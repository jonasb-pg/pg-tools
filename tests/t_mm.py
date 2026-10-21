import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))  # Pfade relativ zu tests/
import json
from playwright.sync_api import sync_playwright
html=open('../apps/analyse/Index.html',encoding='utf8').read()
stub="""<script>window.CALLS=[];window.ARGS={};window.google={script:{url:{getLocation:function(cb){}},run:(function(){var ok;var o={withSuccessHandler:function(f){ok=f;return o},withFailureHandler:function(){return o},api:function(l,n,a){CALLS.push(n);ARGS[n]=a;var f=ok;
if(n==='startDaten')setTimeout(function(){f({version:'x',admin:false,zahlen:{offen:3},listen:{kategorie:[]},reparatur:[]})},5);
if(n==='matchmaker')setTimeout(function(){f(window.MMR)},300);
if(n==='pruefen')setTimeout(function(){f({reusable:true,grade:'B',rep:[],befund:'',ricardoZustand:'Gebraucht'})},5);
if(n==='abschliessen')setTimeout(function(){f({nr:'A-000009',reusable:true,grade:'B',regal:a[0].kanal==='matchmaker'?'Matchmaker':'Analysiert',befund:'',verkaufsinfo:'x',dauerMin:3,budget:15,zahlen:{offen:2},mm:a[0].mm})},5);
if(n==='ricardoText')setTimeout(function(){f({titel:'Bosch Unlimited 7 Akkusauger',beschrieb:'Einleitung\\n\\nNeupreis: CHF 300.00',zustand:'Gebraucht'})},5);
if(n==='fotoStand')setTimeout(function(){f({bezeichnung:'Bosch',zahl:{hauptbild:1,weitere:2,typenschild:1,mangel:0},liste:[],kennung:'k',ordner:'https://drive/x'})},5);
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
      funktion:{liste:[],mittel:[],defekte:[],hinweise:[]},liefer:{teile:[]},sicher:[],reset:[],reparatur:{stundenansatz:50,grenze:25},ricardo:{vorschlag:true,versand:[{name:'0-2kg / PostPac B-Post',preis:9}],fotoUrl:'',prozent:{A:50,B:50,C:35}}};
      beginne(D, Date.now()-120000); AN.s.grade='B';""")
    pg.click('button[data-a=identJa]'); pg.wait_for_timeout(80)
    pg.screenshot(path='mm1.png')
    pg.wait_for_timeout(400); pg.screenshot(path='mm2.png')
    t=pg.inner_text('#schritt')
    assert 'Empfehlung: Regal Matchmaker' in t and pg.locator('button[data-a=kanal][data-v=ricardo]').count()==1 and pg.locator('button[data-a=kanal][data-v=regal]').count()==1, 'Matchmaker als Empfehlung, Ricardo und Regal waehlbar'
    print('mm empfehlung, andere waehlbar ok')
    pg.click('button[data-a=kanal][data-v=matchmaker]'); pg.wait_for_timeout(300)
    # 21.10.2026: Matchmaker wie Ricardo: Fotos, Titel, Beschrieb, Versand, Preis (VP)
    t=pg.text_content('#schritt')
    assert 'Doch nicht Matchmaker' in t and 'Suchauftrag passt' in t and pg.locator('#ric-qr').count()==1 and 'abschliessen' not in pg.evaluate('CALLS'), t[:400]
    assert pg.evaluate('AN.s.ricPreis') == '180' and 'VP aus dem Return Tool' in t, pg.evaluate('AN.s.ricPreis')
    assert pg.evaluate("ARGS.ricardoText[0].kanal") == 'matchmaker' and pg.evaluate('AN.s.ricTitel').startswith('Bosch')
    assert pg.locator('button[data-a=kanal][data-v=matchmaker]').count()==0, 'kein zweiter Matchmaker-Knopf im Panel'
    pg.click('button[data-a=ricVersand][data-v="0"]'); pg.wait_for_timeout(200)
    pg.evaluate('fotoHolen()'); pg.wait_for_timeout(100); pg.evaluate('ricNachfuehren()')
    assert pg.is_enabled('#ric-ab'), pg.inner_text('#ric-fehlt')
    pg.click('#ric-ab'); pg.wait_for_timeout(300)
    a=pg.evaluate('ARGS.abschliessen[0]')
    assert a['kanal']=='matchmaker' and a['ricardo']['preis']=='180' and a['ricardo']['versand'].startswith('0-2kg') and a['ricardo']['titel'] and a['mm']['gesucht'], a
    print('matchmaker wie ricardo ok')
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
assert not err, err
print('t_mm ok')
