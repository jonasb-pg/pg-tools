import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))
"""Etikett aus dem Analyse Tool (17.11.2026, Jonas): Der Druck läuft über das Programm «PG Etikett» auf dem Mac (QL-500 ohne Treiber).
Das Tool öffnet dafür ein Fenster auf http://127.0.0.1:9123/druck. Hier ist window.open eine Attrappe, die die Adressen sammelt. Erfundene Daten."""
import json, re, sys, urllib.parse
from collections import Counter
from playwright.sync_api import sync_playwright
html=open('../apps/analyse/Index.html',encoding='utf8').read()
stub="""<script>window.RUFE=[];window.AUF=[];window.ZU=false;window.open=function(u,n,o){ if(window.ZU) return null; AUF.push([u,n,o]); return {closed:false}; };
window.google={script:{url:{getLocation:function(cb){}},run:(function(){var ok;var o={withSuccessHandler:function(f){ok=f;return o},withFailureHandler:function(){return o},api:function(l,n,a){var f=ok;RUFE.push([n,a]);
if(n==='startDaten')setTimeout(function(){f({version:'x',admin:false,zahlen:{offen:3},listen:{kategorie:[]},reparatur:[]})},5);
if(n==='suche')setTimeout(function(){f({treffer:[{id:'PG-500',bezeichnung:'Testgerät',status:'Erledigt',fertig:{nr:'A-000002',wer:'FG',am:'02.11.2026',regal:'Ricardo',reusable:'Ja'}}],inSchlange:false,rt:[],rtFehler:''})},5);
if(n==='etikettLog')setTimeout(function(){f(true)},5);
}};return o;})()}};</script>"""
html=html.replace('<head>','<head>'+stub,1)
fehler=0; err=[]
def ok(b,m):
    global fehler
    print('ok' if b else 'FEHLER', m); fehler += 0 if b else 1
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1200,'height':900})
    pg.on('pageerror',lambda e:err.append(str(e)[:300]))
    pg.route('http://app.test/', lambda r: r.fulfill(body=html, content_type='text/html; charset=utf-8'))
    pg.goto('http://app.test/'); pg.wait_for_timeout(300)
    pg.evaluate("document.getElementById('start').hidden=true; K='JB';")
    auf=lambda: pg.evaluate("AUF")
    def teile(u):
        x=urllib.parse.urlsplit(u); q=urllib.parse.parse_qs(x.query); return x.scheme+'://'+x.netloc+x.path, {k:v[0] for k,v in q.items()}
    logs=lambda: pg.evaluate("RUFE.filter(function(x){return x[0]==='etikettLog'}).map(function(x){return x[1].join('|')})")
    # 1) Fertig-Bildschirm: Knopf, Format, Schalter; ohne Schalter kein automatischer Druck
    pg.evaluate("fertigZeigen({id:'PG-25337',bezeichnung:'Philips  Wasserkocher HD9350/90 & Co'},{reusable:true,grade:'B',regal:'Analysiert',befund:'',verkaufsinfo:'',preis:20,dauerMin:5,budget:10,nr:'',speichert:true})")
    pg.wait_for_timeout(200)
    ok(pg.locator('#fertig button[data-a=etikett]').count()==1 and pg.locator('#fertig input[data-a=etAutoSetz]').count()==1 and pg.locator('#fertig button[data-a=etFormatSetz]').count()==1, 'Fertig-Bildschirm zeigt «Etikett drucken», das Format und den Schalter')
    ok(len(auf())==0 and not pg.locator('#fertig input[data-a=etAutoSetz]').is_checked(), 'Schalter ist ohne Einstellung aus: kein automatischer Druck')
    # 2) Knopf: ein Fenster auf das Druckprogramm, mit ID, Bezeichnung, Format, Auftragsnummer
    pg.click('#fertig button[data-a=etikett]'); pg.wait_for_timeout(150)
    a=auf(); adr,q=teile(a[0][0])
    ok(len(a)==1 and adr=='http://127.0.0.1:9123/druck' and a[0][1]=='pg-etikett', 'Knopf öffnet genau ein Fenster auf das Druckprogramm (immer dasselbe Fenster)')
    ok(q['id']=='PG-25337' and q['t']=='Philips Wasserkocher HD9350/90 & Co' and q['f']=='90' and len(q['n'])>10, 'Adresse trägt ID, Bezeichnung (Sonderzeichen heil), Format 90 und eine Auftragsnummer')
    ok(logs()==['PG-25337|hand|JB'], 'Druck von Hand steht im Log-Aufruf')
    pg.click('#fertig button[data-a=etikett]'); pg.wait_for_timeout(150)
    ok(teile(auf()[1][0])[1]['n']!=q['n'], 'jeder Klick hat eine neue Auftragsnummer (Nachdruck möglich)')
    # 3) Format wechseln
    ok('90 × 29 mm' in pg.inner_text('#fertig button[data-a=etFormatSetz]').lower(), 'Knopf zeigt das Format 90 × 29 mm')
    pg.click('#fertig button[data-a=etFormatSetz]'); pg.wait_for_timeout(100)
    ok(pg.evaluate("localStorage.getItem('at-etikett-format')")=='62' and '62 × 29 mm' in pg.inner_text('#fertig button[data-a=etFormatSetz]').lower(), 'Wechsel auf 62 × 29 mm wird gemerkt')
    pg.click('#fertig button[data-a=etikett]'); pg.wait_for_timeout(150)
    ok(teile(auf()[2][0])[1]['f']=='62', '62 mm geht als Format an das Druckprogramm')
    pg.click('#fertig button[data-a=etFormatSetz]'); pg.wait_for_timeout(100)
    ok(pg.evaluate("localStorage.getItem('at-etikett-format')") is None, 'zurück auf 90 mm')
    # 4) Schalter ein: Abschluss druckt automatisch, auch AN-Nummer und nicht reusable
    pg.click('#fertig input[data-a=etAutoSetz]')
    ok(pg.evaluate("localStorage.getItem('at-etikett')")=='1', 'Schalter ein wird für dieses Gerät gemerkt')
    pg.evaluate("fertigZeigen({id:'AN-0068',bezeichnung:'Lampe'},{reusable:false,grade:'',regal:'',befund:'',verkaufsinfo:'',preis:'',dauerMin:2,budget:10,nr:'',speichert:true})"); pg.wait_for_timeout(200)
    a=auf(); ok(len(a)==4 and teile(a[3][0])[1]['id']=='AN-0068' and logs()[-1]=='AN-0068|auto|JB', 'Schalter ein: Abschluss druckt automatisch und steht als «auto» im Log')
    ok(pg.locator('#fertig input[data-a=etAutoSetz]').is_checked(), 'Schalter zeigt den gemerkten Stand')
    # 5) Fenster blockiert: Meldung, kein Log, Abschluss bleibt
    n=len(logs()); pg.evaluate("ZU=true; fertigZeigen({id:'PG-2',bezeichnung:'Y'},{reusable:true,grade:'A',regal:'Analysiert',preis:1,dauerMin:1,budget:1,nr:'',speichert:true})"); pg.wait_for_timeout(200)
    ok('Pop-ups' in pg.inner_text('body') and len(logs())==n and pg.locator('#fertig button[data-a=etikett][data-v=PG-2]').count()==1, 'Fenster blockiert: Hinweis auf Pop-ups, kein Log-Eintrag, Fertig-Bildschirm steht')
    pg.evaluate("ZU=false")
    # 6) Schalter aus
    pg.click('#fertig input[data-a=etAutoSetz]')
    ok(pg.evaluate("localStorage.getItem('at-etikett')") is None, 'Schalter aus löscht die Einstellung')
    pg.evaluate("fertigZeigen({id:'PG-1',bezeichnung:'X'},{reusable:true,grade:'A',regal:'Analysiert',preis:1,dauerMin:1,budget:1,nr:'',speichert:true})"); pg.wait_for_timeout(200)
    ok(len(auf())==4, 'Schalter aus: kein Druck beim Abschluss')
    # 7) Reparatur-Pause: Knopf ja, automatisch nein
    pg.evaluate("localStorage.setItem('at-etikett','1'); FERTIG={titel:'Toaster',r:{pause:true,id:'PG-77',teil:false}}; zeichneFertig();"); pg.wait_for_timeout(200)
    ok(pg.locator('#fertig button[data-a=etikett][data-v=PG-77]').count()==1 and len(auf())==4, 'Reparatur-Pause: Knopf da, kein automatischer Druck')
    # 8) schon analysiert: Nachdruck aus der Meldung
    pg.fill('#q','PG-500'); pg.evaluate('suchen()'); pg.wait_for_timeout(200)
    ok(pg.locator('#such-meldung a[data-a=etikett][data-v=PG-500]').count()==1 and pg.locator('#such-meldung a[data-a=nochmal]').count()==1, 'schon analysiert: Link «Etikett drucken» neben «Neu analysieren»')
    pg.click('#such-meldung a[data-a=etikett]'); pg.wait_for_timeout(200)
    a=auf(); ok(len(a)==5 and teile(a[4][0])[1]['id']=='PG-500' and teile(a[4][0])[1]['t']=='Testgerät', 'Nachdruck schickt die richtige ID und Bezeichnung')
    # 9) Fehler vom 17.11.: Die Funktion für die farbigen Marken heisst «etikett» und darf nicht überschrieben sein
    marke=pg.evaluate("etikett('vo.unsicher','gelb')"); pg.wait_for_timeout(200)
    ok(isinstance(marke,str) and marke.startswith('<span class="etikett gelb">') and len(auf())==5, 'etikett(Text, Farbe) liefert weiter die farbige Marke und druckt nichts')
    dop=[k for k,v in Counter(re.findall(r'^(\s*)function (\w+)\(',open('../apps/analyse/Index.html',encoding='utf8').read(),re.M)).items() if v>1]
    ok(not dop, 'kein Funktionsname ist auf derselben Ebene doppelt vergeben '+str(dop))
    ok(not err, 'keine Skriptfehler '+' | '.join(err))
    b.close()
print('FEHLER:',fehler); sys.exit(1 if fehler else 0)
