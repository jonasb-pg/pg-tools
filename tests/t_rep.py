import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))  # Pfade relativ zu tests/
import json
from playwright.sync_api import sync_playwright
html=open('../apps/analyse/Index.html',encoding='utf8').read()
ang=[{"id":"PG-1","teil":"Akku 3.6V","nummer":"BAT-77","shop":"RS","preis":24.5,"link":"https://ch.rs-online.com/x","produkt":"Dyson"},{"id":"PG-9","teil":"falsch","preis":1}]
stub="""<script>window.CALLS=[];window.PAUSE=null;window.google={script:{url:{getLocation:function(cb){}},run:(function(){var ok;var o={withSuccessHandler:function(f){ok=f;return o},withFailureHandler:function(){return o},api:function(l,n,a){CALLS.push(n);var f=ok;
if(n==='startDaten')setTimeout(function(){f({version:'x',admin:false,zahlen:{offen:3},listen:{kategorie:[]},reparatur:[{id:'PG-5',bezeichnung:'Nespresso',was:'Pumpe tauschen',teil:'Pumpe',status:'Bestellt',kuerzel:'JB',zeit:'15.10.2026 11:00:00'}]})},5);
if(n==='ersatzteile')setTimeout(function(){f(%s)},5);
if(n==='reparaturPause'){PAUSE=a[0];setTimeout(function(){f({zahlen:{offen:2},liste:[{id:'PG-1',bezeichnung:'Dyson V8',was:a[0].was,teil:a[0].teil?a[0].teil.teil:'',status:'Offen',kuerzel:'JB',zeit:'15.10.2026 12:00:00'}]})},5);}
if(n==='reparaturWeiter')setTimeout(function(){f({d:window.D,stand:PAUSE.stand})},5);
}};return o;})()}};</script>"""%json.dumps(ang)
html=html.replace('<head>','<head>'+stub,1)
err=[]
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1200,'height':1300})
    pg.on('pageerror',lambda e:err.append(str(e.stack)[:600]))
    pg.route('http://app.test/', lambda r: r.fulfill(body=html, content_type='text/html; charset=utf-8'))
    pg.goto('http://app.test/'); pg.wait_for_timeout(300)
    pg.evaluate("document.getElementById('start').hidden=true; K='JB';")
    pg.screenshot(path='rep0.png', full_page=True)
    pg.evaluate("""window.D={produkt:{id:'PG-1',bezeichnung:'Dyson V8',vp:200,budget:15,stufe:'Vollprüfung'},ablauf:['ident','funktion','entscheid'],zustand:{grade:[['A','x','x']]},recherche:true,infos:[],handbuch:null,ident:{marke:'Dyson',modell:'V8'},
      funktion:{liste:[{n:'Saugen',t:'Saugen',g:'Kern'}],mittel:[],ungeprueft:[],ungeprueftKurz:[],defekte:[],hinweise:[]},liefer:{teile:[]},sicher:[],reset:[],reparatur:{stundenansatz:50,grenze:25,hinweis:''},ricardo:{versand:[],fotoUrl:''}};
      beginne(D, Date.now()-60000); AN.i=1; AN.s.fn[0]='nok'; fnWeiter(); repMin('15');""")
    pg.screenshot(path='rep1.png', full_page=True)
    pg.click('button[data-a=repSpaeter]'); pg.wait_for_timeout(200)
    pg.click('button[data-a=spNimm][data-v="0"]'); pg.wait_for_timeout(100)
    pg.screenshot(path='rep2.png', full_page=True)
    pg.click('.karte .leiste button[data-a=zurueck], button[data-a=zurueck]'); pg.wait_for_timeout(100); print('nach zurueck sp?', pg.evaluate('!!AN.gate && !AN.gate.sp && AN.gate.min')); pg.click('button[data-a=repSpaeter]'); pg.wait_for_timeout(200); pg.click('button[data-a=spNimm][data-v="0"]'); pg.click('button[data-a=repPause]'); pg.wait_for_timeout(200)
    pg.screenshot(path='rep3.png', full_page=True)
    print('pause', json.dumps(pg.evaluate('PAUSE'))[:400])
    assert pg.evaluate("PAUSE.stand.ohne===false"), 'Review 29.10.2026 (2): «ohne» geht mit dem Stand der Reparatur-Pause mit'
    pg.click('#rep-liste button[data-a=repWeiter]'); pg.wait_for_timeout(200)
    pg.screenshot(path='rep4.png', full_page=True)
    pg.fill('#rep-text','Akku ersetzt'); pg.click('button[data-a=repFertig]'); pg.wait_for_timeout(100)
    print('rep', pg.evaluate('JSON.stringify(AN.s.rep)'), 'gate', pg.evaluate('JSON.stringify(AN.gate)'), 'i', pg.evaluate('AN.i'))
    print(pg.evaluate('CALLS'))
    b.close()
print('ERR',err)
