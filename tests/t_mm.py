import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))  # Pfade relativ zu tests/
import json
from playwright.sync_api import sync_playwright
html=open('../apps/analyse/Index.html',encoding='utf8').read()
stub="""<script>window.CALLS=[];window.ARGS={};window.google={script:{url:{getLocation:function(cb){}},run:(function(){var ok;var o={withSuccessHandler:function(f){ok=f;return o},withFailureHandler:function(){return o},api:function(l,n,a){CALLS.push(n);ARGS[n]=a;var f=ok;
if(n==='startDaten')setTimeout(function(){f({version:'x',admin:false,zahlen:{offen:3},listen:{kategorie:[]},reparatur:[]})},5);
if(n==='matchmaker')setTimeout(function(){f(window.MMR)},300);
if(n==='pruefen')setTimeout(function(){f({reusable:true,grade:'B',rep:[],befund:'',ricardoZustand:'Gebraucht'})},5);
if(n==='abschliessen')setTimeout(function(){f({nr:'A-000009',reusable:true,grade:'B',regal:a[0].kanal==='matchmaker'?'Matchmaker':'Analysiert',befund:'',verkaufsinfo:'x',dauerMin:3,budget:15,zahlen:{offen:2},mm:a[0].mm})},5);
if(n==='suche')setTimeout(function(){f({inSchlange:false,treffer:[{id:'PG-1',bezeichnung:'Bosch Unlimited 7',status:'Erledigt',mm:'Akkustaubsauger Bosch'}]})},5);
if(n==='matchmakerZurueck')setTimeout(function(){f({d:window.D,stand:ARGS.abschliessen[0].stand && Object.assign({},ARGS.abschliessen[0].stand,{mm:ARGS.abschliessen[0].mm})})},5);
}};return o;})()}};</script>"""
html=html.replace('<head>','<head>'+stub,1)
err=[]
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1200,'height':1100})
    pg.on('pageerror',lambda e:err.append(str(e.stack)[:500]))
    pg.route('http://app.test/', lambda r: r.fulfill(body=html, content_type='text/html; charset=utf-8'))
    pg.goto('http://app.test/'); pg.wait_for_timeout(300)
    pg.evaluate("""document.getElementById('start').hidden=true; K='JB';
      window.MMR={passt:[{zeile:8,gesucht:'Akkustaubsauger Bosch',mehr:'',limit:100,hinweis:'Bosch Akkusauger',schluessel:'akkustaubsauger bosch|'}],aehnlich:[],anzahl:72};
      window.D={produkt:{id:'PG-1',bezeichnung:'Bosch Unlimited 7',vp:180,budget:15,stufe:'Vollprüfung'},ablauf:['ident','entscheid'],zustand:{grade:[['B','Leichte Spuren','x']]},recherche:true,infos:[],handbuch:null,ident:{marke:'Bosch',modell:'BCS71'},
      funktion:{liste:[],mittel:[],defekte:[],hinweise:[]},liefer:{teile:[]},sicher:[],reset:[],reparatur:{stundenansatz:50,grenze:25},ricardo:{vorschlag:true,versand:[],fotoUrl:''}};
      beginne(D, Date.now()-120000); AN.s.grade='B';""")
    pg.click('button[data-a=weiter]'); pg.wait_for_timeout(80)
    pg.screenshot(path='mm1.png')
    pg.wait_for_timeout(400); pg.screenshot(path='mm2.png')
    pg.click('button[data-a=kanal][data-v=matchmaker]'); pg.wait_for_timeout(200)
    a=pg.evaluate('ARGS.abschliessen[0]'); print('abschluss kanal',a['kanal'],'mm',a['mm']['gesucht'],'stand i',a['stand']['i'],'nachMm',a['nachMm'])
    pg.screenshot(path='mm3.png')
    pg.fill('#q','PG-1'); pg.press('#q','Enter'); pg.wait_for_timeout(200); pg.screenshot(path='mm4.png')
    pg.evaluate("window.MMR={passt:[],aehnlich:[{zeile:9,gesucht:'Staubsauger',mehr:'egal',limit:50,hinweis:'anderes Modell',schluessel:'s'}],anzahl:71}")
    pg.click('button[data-a=mmZurueck]'); pg.wait_for_timeout(600); pg.screenshot(path='mm5.png')
    print('mm args', pg.evaluate('ARGS.matchmaker[2]'), 'nachMm', pg.evaluate('AN.nachMm'))
    pg.click('button[data-a=kanal][data-v=regal]'); pg.wait_for_timeout(200)
    a=pg.evaluate('ARGS.abschliessen[0]'); print('2. abschluss kanal',a['kanal'],'nachMm',a['nachMm'],'mm',a['mm'])
    print(pg.evaluate('CALLS'))
    b.close()
print('ERR',err)
