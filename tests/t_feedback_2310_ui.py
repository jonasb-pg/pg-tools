import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))  # Pfade relativ zu tests/
"""Analyse Tool, Feedbacks 23.10.2026: «doch getestet» im Schritt Zustand, Fotos im Hintergrund hochladen, Zeit für den Verkaufsteil, OVP Pflicht. Erfundene Produkte."""
import sys, base64
from playwright.sync_api import sync_playwright
html = open('../apps/analyse/Index.html', encoding='utf8').read()
AUS = sys.argv[1] if len(sys.argv) > 1 else None
PNG = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==')
stub = """<script>window.CALLS=[];window.HOCH=0;window.google={script:{url:{getLocation:function(cb){}},run:(function(){var ok,no;var o={withSuccessHandler:function(f){ok=f;return o},withFailureHandler:function(f){no=f;return o},api:function(l,n,a){CALLS.push([n,a]);var f=ok;
if(n==='startDaten')setTimeout(function(){f({version:'x',admin:false,zahlen:{offen:3,bereit:2,laeuft:0},listen:{kategorie:['Kids']},reparatur:[]})},5);
if(n==='starteAnalyse')setTimeout(function(){f(window.mach(a[0]))},5);
if(n==='pruefen')setTimeout(function(){var d=a[0];f({offen:[['o.zustand']],befundAuto:d.doch.indexOf('Bluetooth')>-1?'':'Nicht geprüft: Bluetooth.',wahl:['Bluetooth'],doch:d.doch})},5);
if(n==='fotoStand')setTimeout(function(){f({bezeichnung:'Gerät',liste:[],zahl:{}})},5);
if(n==='fotoHochladen'){HOCH++;setTimeout(function(){f({bezeichnung:'Gerät',liste:[{id:'f'+HOCH,art:a[1],name:'x',bild:'data:image/png;base64,iVBORw0KGgo='}],zahl:{}})},400);}
}};return o;})()}};
window.mach=function(id){return {produkt:{id:id,bezeichnung:'Gerät '+id,vp:100,ovp:200,budget:10,stufe:'Vollprüfung'},ablauf:['ident','funktion','zustand','entscheid'],zustand:{grade:[['A','x','x'],['C','y','y']]},recherche:true,infos:[],handbuch:null,ident:{marke:'M',modell:id},
 funktion:{liste:[{n:'Ein',t:'Ein',g:'Kern'}],mittel:[],ungeprueft:['Bluetooth'],ungeprueftKurz:['Bluetooth'],defekte:[],hinweise:[]},liefer:{teile:[]},sicher:[],reset:[],reparatur:{stundenansatz:50,grenze:25,hinweis:''},ricardo:{versand:[],fotoUrl:''}};};</script>"""
html = html.replace('<head>', '<head>' + stub, 1)
err = []
def bild(pg, n):
    if AUS: pg.screenshot(path=AUS + '/' + n + '.png', full_page=True)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1300, 'height': 900})
    pg.on('pageerror', lambda e: err.append(str(e.stack)[:400]))
    pg.route('http://app.test/', lambda r: r.fulfill(body=html, content_type='text/html; charset=utf-8'))
    pg.goto('http://app.test/'); pg.evaluate("localStorage.clear(); localStorage.setItem('at-kuerzel','XX'); localStorage.setItem('at-kuerzel-tag', heute())"); pg.reload(); pg.wait_for_timeout(300)
    # 1. Zustand: «doch getestet»
    pg.evaluate("starten('PG-1')"); pg.wait_for_timeout(100)
    pg.evaluate("AN.s.fn = {0:'ok'}; AN.i = 2; stand()"); pg.wait_for_timeout(200)
    assert pg.is_visible('#doch button[data-v="Bluetooth"]'), pg.inner_html('#befund-auto')
    assert 'Bluetooth' in pg.text_content('#befund-auto')
    bild(pg, 'fb_doch')
    pg.click('#doch button[data-v="Bluetooth"]'); pg.wait_for_timeout(200)
    assert pg.evaluate("AN.s.doch.Bluetooth") is True
    assert pg.evaluate("CALLS.filter(function(c){return c[0]==='pruefen'}).pop()[1][0].doch.join()") == 'Bluetooth'
    assert pg.get_attribute('#doch button[data-v="Bluetooth"]', 'aria-pressed') == 'true'
    pg.click('#doch button[data-v="Bluetooth"]'); pg.wait_for_timeout(200)
    assert not pg.evaluate("!!(AN.s.doch||{}).Bluetooth"), 'wieder weg'
    # 6. Zeit Verkaufsteil: zählt nur im Entscheid mit Kanal Ricardo
    pg.wait_for_timeout(1500); assert pg.evaluate("AN.vk || 0") == 0
    pg.evaluate("AN.i = 3; AN.s.kanal = 'ricardo'"); pg.wait_for_timeout(2300)
    vk = pg.evaluate("AN.vk"); assert 1000 <= vk <= 3500, vk
    assert pg.evaluate("daten().verkaufSek") >= 1
    pg.evaluate("abbruchJetzt()"); pg.wait_for_timeout(100)
    # 2. Ohne Inventar: OVP vor VP, VP freiwillig
    pg.evaluate("ohneZeigen()")
    assert '50% vom OVP' in pg.text_content('label[for="o-vp"]')
    # 3. Foto-Seite: weiter fotografieren, während hochgeladen wird
    pg.evaluate("fotoModus('PG-1')"); pg.wait_for_timeout(100)
    pg.evaluate("FS.art='weitere'")
    pg.set_input_files('#fs-galerie', files=[{'name': 'a.png', 'mimeType': 'image/png', 'buffer': PNG}, {'name': 'b.png', 'mimeType': 'image/png', 'buffer': PNG}])
    pg.wait_for_timeout(150)
    assert 'wird hochgeladen' in pg.text_content('#fs-liste'), pg.text_content('#fs-liste')
    assert pg.locator('#fs-liste button[data-a="fsFoto"][data-v="weitere"]').count() == 1, 'Knopf bleibt da'
    pg.evaluate("FS.art='hauptbild'")
    pg.set_input_files('#fs-galerie', files=[{'name': 'c.png', 'mimeType': 'image/png', 'buffer': PNG}])
    pg.wait_for_timeout(100)
    bild(pg, 'fb_fotos')
    assert pg.evaluate("HOCH") == 1, 'nacheinander, nicht gleichzeitig'
    pg.wait_for_timeout(1600)
    assert pg.evaluate("HOCH") == 3 and 'wird hochgeladen' not in pg.text_content('#fs-liste')
    arten = pg.evaluate("CALLS.filter(function(c){return c[0]==='fotoHochladen'}).map(function(c){return c[1][1]}).join()")
    assert arten == 'weitere,weitere,hauptbild', arten
    b.close()
assert not err, err
print('t_feedback_2310_ui ok')
