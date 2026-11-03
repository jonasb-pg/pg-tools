import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))
"""Feedback FG 02.11.2026, Oberfläche Analyse Tool: schon analysiertes Stück beim Scannen klar als «bereits analysiert» zeigen. Erfundene Daten."""
from playwright.sync_api import sync_playwright
html=open('../apps/analyse/Index.html',encoding='utf8').read()
stub="""<script>window.ANT={};window.google={script:{url:{getLocation:function(cb){}},run:(function(){var ok;var o={withSuccessHandler:function(f){ok=f;return o},withFailureHandler:function(){return o},api:function(l,n,a){var f=ok;
if(n==='startDaten')setTimeout(function(){f({version:'x',admin:false,zahlen:{offen:3},listen:{kategorie:[]},reparatur:[]})},5);
if(n==='suche')setTimeout(function(){f(ANT[a[0]])},5);
}};return o;})()}};</script>"""
html=html.replace('<head>','<head>'+stub,1)
fehler=0; err=[]
def ok(b,m):
    global fehler
    print('ok' if b else 'FEHLER', m); fehler += 0 if b else 1
F={'nr':'A-000002','wer':'FG','am':'02.11.2026','regal':'Ricardo','reusable':'Ja'}
ANT={
 # 1) erledigt, im Return Tool noch im Tab Analyse (genau der Fall von FG)
 '7612345678901':{'treffer':[{'id':'PG-500','bezeichnung':'Testgerät','status':'Erledigt','fertig':F}],'inSchlange':False,'rt':[{'id':'PG-500','bezeichnung':'Testgerät','barcode':'7612345678901','tab':'Analyse','status':'Erledigt','fertig':F}],'rtFehler':''},
 # 2) erledigt, aber im Return Tool liegt ein zweites, neues Stück mit demselben Barcode
 '7612345678918':{'treffer':[{'id':'PG-501','bezeichnung':'Lampe','status':'Erledigt','fertig':{'nr':'A-000003','wer':'SW','am':'01.11.2026','regal':'','reusable':'Nein'}}],'inSchlange':False,
   'rt':[{'id':'PG-501','bezeichnung':'Lampe','barcode':'7612345678918','tab':'Analyse','status':'Erledigt'},{'id':'PG-502','bezeichnung':'Lampe','barcode':'7612345678918','tab':'Online','status':''}],'rtFehler':''},
 # 3) offen wie bisher
 'PG-700':{'treffer':[{'id':'PG-700','bezeichnung':'Offen','status':'Offen'}],'inSchlange':True,'sofort':False,'rt':[],'rtFehler':''}
}
import json
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1200,'height':900})
    pg.on('pageerror',lambda e:err.append(str(e)[:300]))
    pg.route('http://app.test/', lambda r: r.fulfill(body=html, content_type='text/html; charset=utf-8'))
    pg.goto('http://app.test/'); pg.wait_for_timeout(300)
    pg.evaluate("ANT="+json.dumps(ANT)+"; document.getElementById('start').hidden=true; K='JB';")
    pg.fill('#q','7612345678901'); pg.evaluate('suchen()'); pg.wait_for_timeout(150)
    m=pg.inner_text('#such-meldung')
    ok('PG-500 ist bereits analysiert.' in m and '02.11.2026 · FG · A-000002' in m and 'Ergebnis: Ricardo' in m, 'Fall FG: deutlich «bereits analysiert» mit Datum, Kürzel, Nummer, Ergebnis')
    ok('Dann übernehmen' not in m and pg.inner_text('#treffer')=='' and pg.locator('#such-meldung a[data-a=nochmal]').count()==1, 'kein «übernehmen», keine Tabelle, nur «Neu analysieren» für Retouren')
    pg.fill('#q','7612345678918'); pg.evaluate('suchen()'); pg.wait_for_timeout(150)
    m=pg.inner_text('#such-meldung')
    ok('PG-501 ist bereits analysiert.' in m and 'Ergebnis: nicht reusable' in m, 'erledigt ohne Regal, Reusable Nein: «nicht reusable»')
    ok('Dann übernehmen' in m and 'PG-502' in pg.inner_text('#treffer'), 'zweites, neues Stück im Return Tool bleibt übernehmbar')
    pg.click('#lang-en') if pg.locator('#lang-en').count() else None
    pg.fill('#q','PG-700'); pg.evaluate('suchen()'); pg.wait_for_timeout(150)
    ok('bereits analysiert' not in pg.inner_text('#such-meldung') and 'PG-700' in pg.inner_text('#treffer'), 'offenes Stück wie bisher')
    ok(not err, 'keine JS-Fehler '+str(err))
    b.close()
print('t_analyse_fertig_0311_ui', 'ok' if not fehler else str(fehler)+' Fehler')
import sys; sys.exit(1 if fehler else 0)
