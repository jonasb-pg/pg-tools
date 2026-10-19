import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))  # Pfade relativ zu tests/
"""Analyse Tool: Analysen pausieren und fortsetzen, nur auf diesem Gerät und für das gleiche Kürzel (Jonas 19.10.2026). Erfundene Produkte. Lauf: python3 tests/t_pausiert.py [ordner für bilder]"""
import sys
from playwright.sync_api import sync_playwright
html = open('../apps/analyse/Index.html', encoding='utf8').read()
AUS = sys.argv[1] if len(sys.argv) > 1 else None
stub = """<script>window.CALLS=[];window.google={script:{url:{getLocation:function(cb){}},run:(function(){var ok;var o={withSuccessHandler:function(f){ok=f;return o},withFailureHandler:function(){return o},api:function(l,n,a){CALLS.push([n,a]);var f=ok;
if(n==='startDaten')setTimeout(function(){f({version:'x',admin:false,zahlen:{offen:3,bereit:2,laeuft:0},listen:{kategorie:[]},reparatur:[]})},5);
if(n==='starteAnalyse')setTimeout(function(){f(window.mach(a[0]))},5);
}};return o;})()}};
window.mach=function(id){return {produkt:{id:id,bezeichnung:'Gerät '+id,vp:100,budget:10,stufe:'Vollprüfung'},ablauf:['ident','funktion','entscheid'],zustand:{grade:[['A','x','x']]},recherche:true,infos:[],handbuch:null,ident:{marke:'M',modell:id},
 funktion:{liste:[{n:'Ein',t:'Ein',g:'Kern'}],mittel:[],ungeprueft:[],ungeprueftKurz:[],defekte:[],hinweise:[]},liefer:{teile:[]},sicher:[],reset:[],reparatur:{stundenansatz:50,grenze:25,hinweis:''},ricardo:{versand:[],fotoUrl:''}};};</script>"""
html = html.replace('<head>', '<head>' + stub, 1)
err = []
def bild(pg, n):
    if AUS: pg.screenshot(path=AUS + '/' + n + '.png', full_page=True)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1300, 'height': 900})
    pg.on('pageerror', lambda e: err.append(str(e.stack)[:400]))
    pg.route('http://app.test/', lambda r: r.fulfill(body=html, content_type='text/html; charset=utf-8'))
    pg.goto('http://app.test/'); pg.evaluate("localStorage.clear(); localStorage.setItem('at-kuerzel','XX'); localStorage.setItem('at-kuerzel-tag', heute())"); pg.reload(); pg.wait_for_timeout(300)
    # Analyse A starten, einen Schritt weiter, pausieren
    pg.evaluate("starten('PG-1')"); pg.wait_for_timeout(100)
    pg.evaluate("AN.i = 1; AN.aktiv = 125000; sichern(); zeichneAnalyse()")
    assert pg.text_content('#uhr-knopf') == 'Pausieren', pg.text_content('#uhr-knopf')
    pg.click('#uhr-knopf'); pg.wait_for_timeout(100)
    assert pg.evaluate('AN') is None and pg.is_visible('#scan-suche')
    assert 'Gerät PG-1' in pg.text_content('#nav-pausiert') and 'Pausiert (1)' in pg.text_content('#nav-pausiert'), pg.text_content('#nav-pausiert')
    # Zweite Analyse starten, während A pausiert ist
    pg.evaluate("starten('PG-2')"); pg.wait_for_timeout(100)
    assert pg.evaluate('AN.d.produkt.id') == 'PG-2'
    bild(pg, 'pausiert')
    # Klick auf A: B wird pausiert, A geht beim gleichen Schritt weiter
    pg.click('#nav-pausiert button[data-v="PG-1"]'); pg.wait_for_timeout(100)
    assert pg.evaluate('AN.d.produkt.id') == 'PG-1' and pg.evaluate('AN.i') == 1 and pg.evaluate('AN.aktiv') >= 125000
    assert 'Gerät PG-2' in pg.text_content('#nav-pausiert') and 'Gerät PG-1' not in pg.text_content('#nav-pausiert')
    # Nach Neuladen: laufende Analyse und Pausierte sind noch da
    pg.reload(); pg.wait_for_timeout(300)
    assert pg.evaluate('AN.d.produkt.id') == 'PG-1' and 'Gerät PG-2' in pg.text_content('#nav-pausiert')
    # Suche nach einem pausierten Stück setzt es fort statt neu zu starten
    n = pg.evaluate("CALLS.filter(function(c){return c[0]==='starteAnalyse'}).length")
    pg.evaluate("abbruchJetzt(); analyse('PG-2', Date.now())"); pg.wait_for_timeout(100)
    assert pg.evaluate('AN.d.produkt.id') == 'PG-2' and pg.evaluate("CALLS.filter(function(c){return c[0]==='starteAnalyse'}).length") == n
    assert pg.text_content('#nav-pausiert').strip() == ''
    # Anderes Kürzel sieht die Pausierten nicht
    pg.click('#uhr-knopf'); pg.wait_for_timeout(100)
    pg.evaluate("K='YY'; zeichnePausiert()")
    assert pg.text_content('#nav-pausiert').strip() == ''
    pg.evaluate("K='XX'; zeichnePausiert()")
    assert 'Gerät PG-2' in pg.text_content('#nav-pausiert')
    # Läuft ein Aufruf, wird nicht pausiert
    pg.click('#nav-pausiert button[data-v="PG-2"]'); pg.wait_for_timeout(100)
    pg.evaluate("OFFEN['x'] = true"); pg.click('#uhr-knopf'); pg.wait_for_timeout(50)
    assert pg.evaluate('AN.d.produkt.id') == 'PG-2' and 'Kurz warten' in pg.inner_text('#toast')
    b.close()
assert not err, err
print('t_pausiert ok')
