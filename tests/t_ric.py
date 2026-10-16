import json
from playwright.sync_api import sync_playwright
html=open('src/Index.html',encoding='utf8').read()
st={"id":"PG-14742","bezeichnung":"Razer BlackShark V2 Pro, weiss","zahl":{"hauptbild":1,"weitere":1,"typenschild":0,"mangel":0},"liste":[{"id":"a","art":"hauptbild","name":"1 Hauptbild PG-14742.jpg"},{"id":"b","art":"weitere","name":"2 Weitere 01 PG-14742.jpg"}],"ordner":"","ohneTypenschild":False,"ohneMangel":False}
stub="<script>window.CALLS=[];window.google={script:{url:{getLocation:function(cb){}},run:(function(){var ok;var o={withSuccessHandler:function(f){ok=f;return o},withFailureHandler:function(){return o},api:function(l,n,a){CALLS.push(n);var f=ok;if(n==='matchmaker')setTimeout(function(){f({passt:[],aehnlich:[],anzahl:3})},5);if(n==='fotoStand')setTimeout(function(){f(%s)},10);if(n==='ricardoText')setTimeout(function(){f({titel:'Razer BlackShark V2 Pro Gaming-Headset, weiss',beschrieb:'Einleitung.\\n\\nZustand: Neu (gemäss Beschreibung). Verpackung geöffnet, unbenutzt.',zustand:'Neu (gemäss Beschreibung)'})},10);}};return o;})()}};</script>"%json.dumps(st)
html=html.replace('<head>','<head>'+stub,1)
err=[]
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1200,'height':1400})
    pg.on('pageerror',lambda e:err.append(str(e)))
    pg.route('http://app.test/', lambda r: r.fulfill(body=html, content_type='text/html; charset=utf-8'))
    pg.route('https://cdnjs.cloudflare.com/**', lambda r: r.fulfill(body='window.qrcode=function(){return {addData:function(){},make:function(){},createSvgTag:function(){return "<svg width=150 height=150><rect width=150 height=150 fill=black /></svg>"}}}', content_type='text/javascript'))
    pg.goto('http://app.test/'); pg.wait_for_timeout(300)
    pg.evaluate("""document.getElementById('start').hidden=true; K='JB';
    var d={produkt:{id:'PG-14742',bezeichnung:'Razer',vp:108,budget:10,stufe:'Key Functions Plus'},ablauf:['ident','entscheid'],zustand:{grade:[['A','Unbenutzt','x']]},recherche:true,infos:[],handbuch:null,ident:{marke:'Razer',modell:'X'},
      funktion:{liste:[],mittel:[]},liefer:{teile:[]},sicher:[],reset:[],ricardo:{vorschlag:true,versand:[{name:'0-2kg / PostPac B-Post',preis:9},{name:'2-10kg / PostPac B-Post',preis:12},{name:'10-30kg / PostPac B-Post',preis:21},{name:'0-30 kg / Sperrgut B-Post',preis:31}],fotoUrl:'https://x/dev?foto=PG-14742'}};
    beginne(d, Date.now()); AN.i=1; LAUF.urteil={reusable:true,grade:'A',rep:[],befund:'',ricardoZustand:'Neu (gemäss Beschreibung)'}; LAUF.urteilBild=(function(){var x=daten();delete x.aktivSek;delete x.rueckmeldung;delete x.kanal;delete x.ricardo;delete x.mm;delete x.nachMm;delete x.stand;return JSON.stringify(x)})(); zeichneSchritt();""")
    pg.screenshot(path='ric1.png', full_page=True)
    assert 'OVP – · VP CHF 108.00' in pg.inner_text('#schritt'), 'Preise im Entscheid fehlen'; print('preise im entscheid ok')
    pg.click('button[data-a=kanal][data-v=ricardo]'); pg.wait_for_timeout(1500)
    pg.click('button[data-a=ricVersand][data-v="0"]'); pg.wait_for_timeout(1300)
    print('fehlt:', pg.inner_text('#ric-fehlt'), '| disabled', pg.evaluate("document.getElementById('ric-ab').disabled"))
    pg.screenshot(path='ric2.png', full_page=True)
    v=pg.input_value('input[data-e=ricPreis]'); print('preis vorschlag:', v)
    assert v=='108', 'Startpreis nicht als Vorschlag gefüllt'
    pg.fill('input[data-e=ricPreis]','79'); pg.wait_for_timeout(100)
    assert pg.evaluate('daten().ricardo.preis')=='79', 'Startpreis nicht übernommen'
    pg.fill('input[data-e=ricPreis]',''); pg.wait_for_timeout(100)
    assert 'Startpreis' in pg.inner_text('#ric-fehlt'), 'leerer Startpreis nicht gemeldet'
    print('preis ok')
    # photo mode
    pg2=b.new_page(viewport={'width':390,'height':844}); pg2.route('http://app.test/', lambda r: r.fulfill(body=html, content_type='text/html; charset=utf-8'))
    pg2.on('pageerror',lambda e:err.append('fs '+str(e)))
    pg2.goto('http://app.test/'); pg2.wait_for_timeout(300); pg2.evaluate("fotoModus('PG-14742')"); pg2.wait_for_timeout(300); pg2.screenshot(path='fs.png', full_page=True)
    print(pg.evaluate('CALLS'))
    b.close()
print('ERR',err)
