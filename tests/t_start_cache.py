import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))  # Pfade relativ zu tests/
# Start ohne Warten: Startdaten des letzten Besuchs stehen sofort da, der Server antwortet später. Seiten zeigen zuletzt geladene Daten sofort.
import json
from playwright.sync_api import sync_playwright
html = open('../apps/analyse/Index.html', encoding='utf8').read()
stub = """<script>window.CALLS=[];window.google={script:{url:{getLocation:function(cb){}},run:(function(){var ok;var o={withSuccessHandler:function(f){ok=f;return o},withFailureHandler:function(){return o},api:function(l,n,a){CALLS.push(n);var f=ok;
if(n==='startDaten')setTimeout(function(){f({version:'x',admin:false,zahlen:{offen:5,bereit:4,laeuft:1,fehler:0},listen:{kategorie:['Home']},reparatur:[]})},2500);
if(n==='bestellliste')setTimeout(function(){f([])},1500);
if(n==='werkstatt')setTimeout(function(){f({konten:[],mittel:[{name:'Steckdose',vorhanden:'Ja'}],dienste:['Google']})},1500);
}};return o;})()}};</script>"""
html = html.replace('<head>', '<head>' + stub, 1)
version = html.split("var VERSION = '")[1].split("'")[0]
err = []
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    pg.on('pageerror', lambda e: err.append(str(e)))
    pg.route('http://app.test/', lambda r: r.fulfill(body=html, content_type='text/html; charset=utf-8'))
    pg.goto('http://app.test/')
    alt = {'v': version, 's': {'version': 'x', 'admin': False, 'zahlen': {'offen': 9, 'bereit': 7, 'laeuft': 2, 'fehler': 0}, 'listen': {'kategorie': ['Home']}, 'reparatur': []}}
    import datetime
    d = datetime.date.today()
    pg.evaluate("(a)=>{localStorage.setItem('at-start', a); localStorage.setItem('at-kuerzel','XX'); localStorage.setItem('at-kuerzel-tag', '%d-%d-%d')}" % (d.year, d.month, d.day), json.dumps(alt))
    pg.reload(); pg.wait_for_timeout(300)
    assert '7 Stücke bereit' in pg.inner_text('#schlange-info'), pg.inner_text('#schlange-info')
    pg.wait_for_timeout(2600)
    assert '4 Stücke bereit' in pg.inner_text('#schlange-info'), 'frische Daten ersetzen den Speicher'
    pg.wait_for_timeout(2000)                     # Vorladen fertig
    n = len(pg.evaluate('CALLS'))
    pg.click('#nav-werkstatt'); pg.wait_for_timeout(100)
    assert 'Steckdose' in pg.inner_text('#ws-mittel'), 'vorgeladen: sofort da'
    pg.click('button[data-a=mtAuf]'); assert pg.is_visible('#mt-neu')
    b.close()
assert not err, err
print('t_start_cache ok')
