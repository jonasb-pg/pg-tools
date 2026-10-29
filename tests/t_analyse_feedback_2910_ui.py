import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))  # Pfade relativ zu tests/
"""Feedback-Runde 29.10.2026 (Entscheide Jonas), Oberfläche Analyse Tool: E15 VP vorausgefüllt (50% OVP), E5 «Ohne Recherche», E10 nur Hauptbild Pflicht
(Rest «empfohlen»), E8 Grossansicht im Tool, E12 Uhr hält an, wenn das Tab verdeckt ist, A2 Preis auf der letzten Seite. Erfundene Daten."""
import json
from playwright.sync_api import sync_playwright
html=open('../apps/analyse/Index.html',encoding='utf8').read()
stub="""<script>window.CALLS=[];window.ARGS={};window.google={script:{url:{getLocation:function(cb){}},run:(function(){var ok;var o={withSuccessHandler:function(f){ok=f;return o},withFailureHandler:function(){return o},api:function(l,n,a){CALLS.push(n);ARGS[n]=a;var f=ok;
if(n==='startDaten')setTimeout(function(){f({version:'x',admin:false,zahlen:{offen:3},listen:{kategorie:[]},reparatur:[]})},5);
if(n==='matchmaker')setTimeout(function(){f({passt:[],aehnlich:[],anzahl:3})},20);
if(n==='pruefen')setTimeout(function(){f({reusable:true,grade:a[0].grade||'A',rep:[],befund:'Befund.',befundAuto:'',ricardoZustand:'Neu'})},5);
if(n==='preisSetzen')setTimeout(function(){var d=JSON.parse(JSON.stringify(window.D));d.produkt.vp=a[1];d.produkt.ovp=a[2]||d.produkt.ovp;if(a[3]===true){d.ohne=true;d.ablauf=['ident','voll','funktion','zustand','entscheid'];d.liefer={teile:[]};d.recherche=true;}f(d)},5);
if(n==='starteAnalyse')setTimeout(function(){var d=JSON.parse(JSON.stringify(window.D));if(a[1]===true){d.ohne=true;d.ablauf=['ident','voll','funktion','zustand','entscheid'];d.liefer={teile:[]};d.recherche=true;}f(d)},5);
if(n==='fotoStand')setTimeout(function(){f({bezeichnung:'Testgerät',zahl:{hauptbild:1,weitere:0,typenschild:0,mangel:0},liste:[{id:'F1',art:'hauptbild',name:'a.jpg'}]})},5);
if(n==='abschliessen'&&window.SCHON)setTimeout(function(){f({nr:'A-000009',pgid:'PG-7',reusable:true,grade:'A',regal:'Analysiert',befund:'Befund.',verkaufsinfo:'',dauerMin:1.2,budget:10,schon:true})},5);
else if(n==='abschliessen')setTimeout(function(){f({nr:'A-000009',pgid:a[0].id,reusable:true,grade:'A',regal:'Analysiert',befund:'Befund.',verkaufsinfo:'',preis:45,dauerMin:1.2,budget:10,zahlen:{offen:2}})},5);
}};return o;})()}};</script>"""
html=html.replace('<head>','<head>'+stub,1)
err=[]; fehler=0
def ok(b,m):
    global fehler
    print('ok' if b else 'FEHLER', m); fehler += 0 if b else 1
D="""window.D={produkt:{id:'PG-7',bezeichnung:'Kochtopf 24 cm',vp:'',ovp:'60',budget:10,stufe:'Basis'},ablauf:[],
  zustand:{grade:[['A','Neu und originalverpackt','x'],['B','Neu','y'],['C','Gebraucht','z']]},recherche:false,infos:[],handbuch:null,ident:{marke:'',modell:''},
  funktion:{liste:[{t:'Alle Teile sind unbeschädigt und benutzbar',n:'Zustand der Teile',g:'Kern'}],ersatz:true,mittel:[],defekte:[],hinweise:[],ungeprueft:[],ungeprueftKurz:[]},liefer:{teile:[]},sicher:[],reset:[],
  reparatur:{stundenansatz:50,grenze:25},ricardo:{vorschlag:false,versand:[],fotoUrl:'https://x/dev?foto=PG-7'},einst:null};"""
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1200,'height':1100})
    pg.on('pageerror',lambda e:err.append(str(e.stack)[:500]))
    pg.route('http://app.test/', lambda r: r.fulfill(body=html, content_type='text/html; charset=utf-8'))
    pg.goto('http://app.test/'); pg.wait_for_timeout(300)
    pg.evaluate("document.getElementById('start').hidden=true; K='JB'; "+D+" beginne(D, Date.now());"); pg.wait_for_timeout(100)
    # E5: ohne Recherche
    ok(pg.locator('button[data-a=ohneStart]').count()==1 and pg.locator('button[data-a=recherche]').count()==1, 'E5: Karte ohne Recherche hat «Jetzt recherchieren» und «Ohne Recherche prüfen»')
    txt0=pg.evaluate("(function(){ohneStart(); return document.getElementById('schritt').innerText.toLowerCase();})()")
    ok('kurze ablauf wird vorbereitet' in txt0 and 'recherche läuft' not in txt0, 'Review 8: eigene Meldung statt «Recherche läuft»')
    pg.wait_for_timeout(150)
    ok(pg.evaluate('ARGS.starteAnalyse')==['PG-7',True] and pg.evaluate('AN.d.ohne')==True and pg.evaluate('AN.d.ablauf.join()')=='ident,voll,funktion,zustand,entscheid', 'E5: starteAnalyse(id, true), kurzer Ablauf übernommen')
    ok(pg.evaluate("AN.d.ablauf[AN.i]")=='ident' and 'Kurzer Ablauf ohne Recherche' in pg.inner_text('#schritt'), 'E5: Identität zeigt den Hinweis «kurzer Ablauf»')
    # E15: VP vorausgefüllt mit 50% vom OVP (60 → 30)
    ok(pg.is_visible('#id-vp') and pg.input_value('#id-vp')=='30' and pg.locator('#id-ovp').count()==0, 'E15: VP mit 50% vom OVP vorausgefüllt, OVP-Feld nicht nötig')
    pg.fill('#id-vp','35'); pg.click('button[data-a=identJa]'); pg.wait_for_timeout(200)
    ok(pg.evaluate('ARGS.preisSetzen')==['PG-7',35,'',True] and pg.evaluate('AN.d.produkt.vp')==35, 'E15: angepasster VP gespeichert, Flag «ohne» geht mit')
    ok(pg.evaluate("AN.d.ablauf[AN.i]")=='voll' and pg.locator('input[data-e=fehltText]').count()==1, 'E5: Vollständigkeit als Freitext')
    # E12: Uhr hält an, wenn das Tab verdeckt ist
    ok(pg.evaluate('!!AN.seit'), 'Uhr läuft')
    pg.evaluate("Object.defineProperty(document,'visibilityState',{configurable:true,get:function(){return 'hidden'}}); document.dispatchEvent(new Event('visibilitychange'));"); pg.wait_for_timeout(50)
    ok(pg.evaluate('!AN.seit && AN.autoPause===true'), 'E12: Tab verdeckt → Uhr automatisch angehalten')
    pg.evaluate("Object.defineProperty(document,'visibilityState',{configurable:true,get:function(){return 'visible'}}); document.dispatchEvent(new Event('visibilitychange'));"); pg.wait_for_timeout(50)
    ok(pg.evaluate('!!AN.seit && AN.autoPause===false'), 'E12: Tab sichtbar → Uhr läuft weiter')
    pg.evaluate('pause()'); pg.wait_for_timeout(50)
    pg.evaluate("Object.defineProperty(document,'visibilityState',{configurable:true,get:function(){return 'hidden'}}); document.dispatchEvent(new Event('visibilitychange'));")
    pg.evaluate("Object.defineProperty(document,'visibilityState',{configurable:true,get:function(){return 'visible'}}); document.dispatchEvent(new Event('visibilitychange'));"); pg.wait_for_timeout(50)
    ok(pg.evaluate('!AN.seit'), 'E12: von Hand pausiert bleibt pausiert, auch wenn das Tab wieder sichtbar wird')
    pg.evaluate('pause()'); pg.wait_for_timeout(50)
    # E10 / E8: Fotos
    pg.click('button[data-a=fotosAuf] >> nth=0'); pg.wait_for_timeout(200)
    txt=pg.inner_text('#ric-slots').lower()
    ok('empfohlen' in txt and txt.count('fehlt')==0, 'E10: ohne weitere Fotos steht «empfohlen», nicht «fehlt»')
    ok(pg.locator('#ric-slots a[data-a=fotoGross]').count()==1, 'E8: Bild öffnet die Grossansicht im Tool')
    pg.click('#ric-slots a[data-a=fotoGross]'); pg.wait_for_timeout(100)
    ok(pg.is_visible('#foto-gross') and 'sz=w1600' in pg.get_attribute('#foto-gross img','src') and pg.locator('#foto-gross a[href*="drive.google.com/file/d/F1"]').count()==1, 'E8: Grossansicht mit Drive-Link')
    pg.evaluate("document.querySelector('#foto-gross img').dispatchEvent(new Event('error'))"); pg.wait_for_timeout(50)
    ok(pg.locator('#foto-gross .gross-leer').count()==1, 'Review 5: Drive liefert kein Bild → Hinweis statt leerem Overlay')
    pg.click('button[data-a=fotoGrossZu]'); pg.wait_for_timeout(50)
    ok(pg.is_hidden('#foto-gross'), 'E8: Grossansicht schliessen')
    pg.click('button[data-a=fotosAuf] >> nth=0'); pg.wait_for_timeout(100)
    # Ablauf bis zum Entscheid, Ricardo-Fehlliste ohne Zwang zu weiteren Fotos
    pg.click('button[data-a=weiter]'); pg.wait_for_timeout(80)
    pg.click('button[data-a=fn][data-v=ok]'); pg.click('button[data-a=fnWeiter]'); pg.wait_for_timeout(100)
    pg.click('button[data-a=grade][data-v=A]') if pg.locator('button[data-a=grade][data-v=A]').count() else None
    pg.evaluate("AN.s.grade='A'; weiter();"); pg.wait_for_timeout(200)
    ok(pg.evaluate("AN.d.ablauf[AN.i]")=='entscheid' and pg.evaluate('ARGS.pruefen[0].ohne')==True and 'befundText' in pg.evaluate('Object.keys(ARGS.pruefen[0])'), 'Entscheid: ohne und befundText gehen an den Server')
    pg.evaluate("AN.s.kanal='ricardo'; AN.s.ricTitel='Kochtopf 24 cm'; AN.s.ricBeschrieb='Guter Topf.'; AN.s.ricVersand='Paket'; AN.s.ricPreis='45'; RIC={id:'PG-7',st:{zahl:{hauptbild:1,weitere:0,typenschild:0,mangel:0},liste:[]}};")
    ok(pg.evaluate('ricFehlt().length')==0, 'E10: mit Hauptbild, Titel, Beschrieb, Versand und Preis fehlt nichts mehr')
    # A2: Preis auf der letzten Seite
    pg.evaluate("abschluss()"); pg.wait_for_timeout(300)
    ok(pg.evaluate('!AN') and 'preis chf 45.00' in pg.inner_text('#fertig').lower(), 'A2: Preis steht auf der letzten Seite')
    # Review 4: «schon gespeichert» (Wiederholung nach Netzfehler) bringt keinen Preis → der gezeigte bleibt
    pg.evaluate("window.SCHON=1; FERTIG.r.speichert=true; SP=[{k:K,id:'PG-7',d:{id:'PG-7',lauf:'L-x',kuerzel:'JB'},an:{lauf:'L-x'},versuche:0}]; SP_LAEUFT=false; spWeiter();"); pg.wait_for_timeout(100)
    ok(pg.evaluate('FERTIG.r.schon===true && FERTIG.r.preis===45') and 'preis chf 45.00' in pg.inner_text('#fertig').lower(), 'Review 4: Preis bleibt nach «schon gespeichert» stehen')
    ok(not err, 'keine JS-Fehler ' + str(err))
    b.close()
raise SystemExit(1 if fehler else 0)
