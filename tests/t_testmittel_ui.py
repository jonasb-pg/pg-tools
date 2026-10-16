import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))  # Pfade relativ zu tests/
# Schritt «Funktion»: Testmittel im Inventar als Chip, unbekannte als Frage «Habt ihr das?». Nichts gilt von vornherein als fehlend.
import json, sys
from playwright.sync_api import sync_playwright
html = open('../apps/analyse/Index.html', encoding='utf8').read()
AUS = sys.argv[1] if len(sys.argv) > 1 else None
stub = """<script>window.CALLS=[];window.google={script:{url:{getLocation:function(cb){}},run:(function(){var ok;var o={withSuccessHandler:function(f){ok=f;return o},withFailureHandler:function(){return o},api:function(l,n,a){CALLS.push(n);var f=ok;
if(n==='startDaten')setTimeout(function(){f({version:'x',admin:false,zahlen:{offen:0,bereit:0,laeuft:0},listen:{kategorie:[]},reparatur:[]})},5);
}};return o;})()}};</script>"""
html = html.replace('<head>', '<head>' + stub, 1)
err = []
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1200, 'height': 1100})
    pg.on('pageerror', lambda e: err.append(str(e.stack)[:500]))
    pg.route('http://app.test/', lambda r: r.fulfill(body=html, content_type='text/html; charset=utf-8'))
    pg.goto('http://app.test/'); pg.wait_for_timeout(300)
    pg.evaluate("document.getElementById('start').hidden=true; K='XX';")
    pg.evaluate("""window.D={produkt:{id:'PG-1',bezeichnung:'Testkamera',vp:80,budget:15,stufe:'S1'},ablauf:['ident','funktion','entscheid'],zustand:{grade:[['A','x','x']]},recherche:true,infos:[],handbuch:null,ident:{marke:'T',modell:'K1'},
      funktion:{liste:[{n:'Aufnahme',t:'Aufnahme',g:'Kern'}],mittel:[{name:'microSD-Karte',vorhanden:'Ja'},{name:'Netzteil 12 V',vorhanden:'Nein'},{name:'App «Testcam»',vorhanden:''}],ungeprueft:[],ungeprueftKurz:[],defekte:[],hinweise:[]},
      liefer:{teile:[]},sicher:[],reset:[],reparatur:{stundenansatz:50,grenze:25,hinweis:''},ricardo:{versand:[],fotoUrl:''}};
      beginne(D, Date.now()); AN.i=1; zeichneAnalyse();""")
    pg.wait_for_timeout(100)
    assert pg.evaluate('AN.s.mittelFehlt.length') == 0, 'nichts von vornherein fehlend'
    assert pg.query_selector('button.chip[data-v="0"]') is not None                     # Inventar «Ja» als Chip
    assert pg.query_selector('button[data-a=mittelHaben][data-v="1"]') is not None     # «Nein» im Inventar wird gefragt
    assert pg.query_selector('button[data-a=mittelHaben][data-v="2"]') is not None     # unbekannt wird gefragt
    pg.click('button[data-a=mittelHaben][data-v="2"][data-k=ja]')
    pg.click('button[data-a=mittelHaben][data-v="1"][data-k=nein]')
    assert pg.evaluate('AN.s.mittelDa') == ['App «Testcam»'] and pg.evaluate('AN.s.mittelFehlt') == ['Netzteil 12 V']
    if AUS: pg.screenshot(path=AUS + '/testmittel.png', full_page=True)
    pg.click('button[data-a=mittelHaben][data-v="2"][data-k=nein]')                     # umentschieden
    assert pg.evaluate('AN.s.mittelDa') == [] and sorted(pg.evaluate('AN.s.mittelFehlt')) == ['App «Testcam»', 'Netzteil 12 V']
    pg.click('button[data-a=mittelHaben][data-v="2"][data-k=nein]')                     # nochmals: Antwort aufheben
    assert pg.evaluate('AN.s.mittelFehlt') == ['Netzteil 12 V']
    d = pg.evaluate('daten()')
    assert d['mittelFehlt'] == ['Netzteil 12 V'] and d['mittelDa'] == [], d
    b.close()
assert not err, err
print('t_testmittel_ui ok')
