import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))  # Pfade relativ zu tests/
# Werkstatt-Seite lokal: Liste, Formular, Speichern, Testmittel
import json
from playwright.sync_api import sync_playwright
html=open('../apps/analyse/Index.html',encoding='utf8').read()
W={"konten":[{"r":2,"dienst":"Google","login":"pg.test@gmail.com","passwort":"Abc-123","geraet":"Foto-Handy","notiz":"","aktiv":True,"von":"JB","am":""}],
   "mittel":[{"name":"Steckdose","vorhanden":""},{"name":"Testkonto Google","vorhanden":"Ja"}],"dienste":["Google","Apple-ID","Amazon","Hersteller-App","Anderes"]}
stub="""<script>window.CALLS=[];window.ARGS={};window.google={script:{url:{getLocation:function(cb){}},run:(function(){var ok;var o={withSuccessHandler:function(f){ok=f;return o},withFailureHandler:function(){return o},api:function(l,n,a){CALLS.push(n);ARGS[n]=a;var f=ok;
if(n==='startDaten')setTimeout(function(){f({version:'x',admin:false,zahlen:{offen:0},listen:{kategorie:[]},reparatur:[]})},5);
if(n==='werkstatt'||n==='kontoSpeichern'||n==='mittelSpeichern')setTimeout(function(){f(%s)},5);
}};return o;})()}};</script>"""%json.dumps(W)
html=html.replace('<head>','<head>'+stub,1)
err=[]
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1200,'height':1200})
    pg.on('pageerror',lambda e:err.append(str(e)))
    pg.route('http://app.test/', lambda r: r.fulfill(body=html, content_type='text/html; charset=utf-8'))
    pg.goto('http://app.test/'); pg.wait_for_timeout(300)
    pg.evaluate("document.getElementById('start').hidden=true; K='JB';")
    pg.click('#nav-werkstatt'); pg.wait_for_timeout(200)
    pg.click('button[data-a=wsNeu]'); pg.click('button[data-a=wsDienst][data-v=Amazon]')
    pg.fill('#ws-login','pg.amazon@pretty-good.ch'); pg.fill('#ws-pw','X!9'); pg.click('button[data-a=wsDienst][data-v=Amazon]')
    pg.screenshot(path='/tmp/claude-0/-home-claude-pg-analyse-tool/c7242280-2ca0-5036-9a3c-024d9484a5e5/scratchpad/ws1.png', full_page=True)
    pg.click('button[data-a=wsSpeichern]'); pg.wait_for_timeout(100)
    print('konto', json.dumps(pg.evaluate('ARGS.kontoSpeichern')))
    pg.click('button[data-a=mtSetz][data-k="0"][data-v=Nein]'); pg.wait_for_timeout(50)
    pg.fill('#mt-neu','Lötkolben'); pg.press('#mt-neu','Enter'); pg.wait_for_timeout(50)
    print('mittel', json.dumps(pg.evaluate('ARGS.mittelSpeichern')), pg.evaluate('CALLS'))
    b.close()
print('ERR',err)
