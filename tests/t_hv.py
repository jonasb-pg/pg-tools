import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))  # Pfade relativ zu tests/
import base64, json, sys
from playwright.sync_api import sync_playwright
html=open('../apps/analyse/Index.html',encoding='utf8').read()
if not os.path.exists('test.pdf'):   # Testdatei: 12 Seiten, «Reset» steht auf Seite 9. Wird beim ersten Lauf erzeugt.
    from reportlab.pdfgen import canvas
    c = canvas.Canvas('test.pdf')
    for i in range(12): c.drawString(72, 720, 'Testseite %d' % (i + 1) + (' Reset auf Werkseinstellungen' if i == 8 else '')); c.showPage()
    c.save()
pdf=base64.b64encode(open('test.pdf','rb').read()).decode()
stub="""<script>window.CALLS=[];window.google={script:{run:(function mk(){var ok,ko;var o={withSuccessHandler:function(f){ok=f;return o},withFailureHandler:function(f){ko=f;return o},api:function(l,n,a){CALLS.push(n);var okf=ok;ok=null;ko=null;if(n==='handbuchPdf')setTimeout(function(){okf({name:'t.pdf',daten:'%s',ab:4,datei:'https://drive.google.com/file/d/x/view'})},50);}};return o;})()}};</script>"""%pdf
html=html.replace('<head>','<head>'+stub,1)
B='/opt/npm-tools/node_modules/pdfjs-dist/legacy/build/'
err=[]
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1300,'height':900})
    pg.on('pageerror',lambda e:err.append(str(e)))
    pg.on('console',lambda m:err.append(m.text) if m.type=='error' else None)
    def cdn(route):
        f=route.request.url.split('/')[-1]
        route.fulfill(path=B+f, content_type='text/javascript', headers={'Access-Control-Allow-Origin':'*'})
    pg.route('https://cdnjs.cloudflare.com/**', cdn)
    pg.route('http://app.test/', lambda r: r.fulfill(body=html, content_type='text/html; charset=utf-8'))
    pg.goto('http://app.test/'); pg.wait_for_timeout(500)
    pg.evaluate("AN={d:{produkt:{id:'PG-1'},handbuch:{status:'gelesen',datei:'https://drive.google.com/file/d/x/view',themen:{}},ident:{marke:'Test',modell:'X1'},ablauf:[]},s:{}};hbZeig('0')")
    pg.wait_for_timeout(4000); print("DBG", pg.evaluate("[!!window.pdfjsLib, HV.laedt, !!HV.doc, document.getElementById(\"hv-seite\").innerText]"), err)
    pg.wait_for_function("HV.doc && document.querySelector('#hv-seite canvas')", timeout=15000)
    print('nr:', pg.inner_text('#hv-nr'))
    pg.wait_for_function("HV.texte.length===12", timeout=15000)
    pg.fill('#hv-suche','reset'); pg.wait_for_timeout(500)
    hits=pg.eval_on_selector_all('#hv-treffer button','e=>e.map(x=>x.innerText)'); print('hits:',hits)
    pg.click('#hv-treffer button[data-v="9"]'); pg.wait_for_timeout(600); print('nach klick:', pg.inner_text('#hv-nr'))
    pg.keyboard.press('Escape') if False else None
    pg.click('#hv-seite'); pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(400); print('pfeil:', pg.inner_text('#hv-nr'))
    pg.screenshot(path='hv.png')
    pg.set_viewport_size({'width':390,'height':800}); pg.wait_for_timeout(300); pg.screenshot(path='hv_schmal.png')
    pg.keyboard.press('Escape'); print('zu:', pg.evaluate("document.getElementById('hb-ansicht').hidden"))
    # zweites Öffnen auf Seite 4 ohne Neuladen
    pg.evaluate("hbZeig('4')"); pg.wait_for_timeout(400); print('wieder:', pg.inner_text('#hv-nr'), pg.evaluate('CALLS.filter(c=>c==="handbuchPdf").length'))
    b.close()
print('ERR', err)
