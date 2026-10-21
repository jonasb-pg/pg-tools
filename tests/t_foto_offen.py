import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))
"""21.10.2026: Eine offene Analyse aus der alten Version (Lauf mit /dev-Adresse im Speicher) bleibt erhalten und zeigt den QR-Code mit der Adresse vom Server. Erfundene Daten."""
import subprocess, json
from playwright.sync_api import sync_playwright
html = open('../apps/analyse/Index.html', encoding='utf8').read()
quelle = subprocess.check_output(['node', '-e', "const fs=require('fs'),vm=require('vm');const c={console,Utilities:{formatDate:()=>''}};vm.createContext(c);vm.runInContext(fs.readFileSync('../apps/analyse/Code.gs','utf8'),c);process.stdout.write(c.urteilQuelle_())"]).decode('utf8')
version = html.split("var VERSION = '")[1].split("'")[0]
stub = """<script>window.google={script:{url:{getLocation:function(cb){}},run:(function(){var ok;var o={withSuccessHandler:function(f){ok=f;return o},withFailureHandler:function(f){return o},api:function(l,n,a){var f=ok;
if(n==='startDaten')setTimeout(function(){f({version:'x',admin:false,fotoBasis:'https://x/exec',zahlen:{offen:1,bereit:1,laeuft:0},listen:{kategorie:[]},reparatur:[]})},50);
}};return o;})()}};window.qrcode=function(){var d='';return {addData:function(x){d=x},make:function(){},createSvgTag:function(){return '<svg data-q="'+d+'"></svg>'}}};</script>"""
html = html.replace('<head>', '<head>' + stub, 1).replace('</body>', '<script>' + quelle + '</script></body>', 1)
d = {'produkt': {'id': 'PG-7', 'bezeichnung': 'Gerät', 'vp': 100, 'budget': 10, 'stufe': 'V', 'umfang': 'Kern'}, 'ablauf': ['ident', 'entscheid'],
     'zustand': {'grade': [['A', 'Neu', '']]}, 'recherche': True, 'infos': [], 'handbuch': None, 'ident': {'marke': 'M', 'modell': 'X'}, 'rueckruf': None, 'firmware': False,
     'funktion': {'liste': [], 'mittel': [], 'ungeprueft': [], 'ungeprueftKurz': [], 'defekte': [], 'hinweise': []}, 'liefer': {'teile': [], 'unsicher': False}, 'sicher': [], 'reset': [],
     'reparatur': {'stundenansatz': 50, 'grenze': 25, 'hinweis': ''}, 'ricardo': {'versand': [], 'fotoUrl': 'https://x/dev?foto=PG-7', 'prozent': {}}, 'einst': {}}
err = []
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    pg.on('pageerror', lambda e: err.append(str(e)))
    pg.route('http://app.test/', lambda r: r.fulfill(body=html, content_type='text/html; charset=utf-8'))
    pg.goto('http://app.test/'); pg.wait_for_timeout(300)
    lauf = {'v': version, 'd': d, 'start': 1, 'aktiv': 0, 'seit': 1, 'i': 0, 's': None, 'gate': None, 'rm': {}, 'hb': None}
    gespeichert = pg.evaluate("l => { var a = JSON.parse(l); a.s = leer(a.d); a.s.kanal = 'ricardo'; a.i = 1; return JSON.stringify(a); }", json.dumps(lauf))
    pg.add_init_script("localStorage.clear(); localStorage.setItem('at-kuerzel','XX'); var d = new Date(); localStorage.setItem('at-kuerzel-tag', d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()); localStorage.setItem('at-lauf', " + json.dumps(gespeichert) + ");")
    pg.goto('http://app.test/'); pg.wait_for_timeout(1500)
    assert pg.evaluate('AN && AN.d.produkt.id') == 'PG-7', 'offene Analyse ist noch da'
    assert pg.evaluate("fotoLink()") == 'https://x/exec?foto=PG-7'
    pg.evaluate("if (!document.getElementById('ric-qr')) { var x = document.createElement('div'); x.innerHTML = ricardoTeil({}); document.body.appendChild(x); } qrZeichnen();")
    q = pg.evaluate("document.querySelector('#ric-qr svg') && document.querySelector('#ric-qr svg').getAttribute('data-q')")
    href = pg.evaluate("document.querySelector('.ric-qr a') && document.querySelector('.ric-qr a').href")
    print('QR', q, 'Link', href)
    assert q == 'https://x/exec?foto=PG-7' and href == 'https://x/exec?foto=PG-7'
    b.close()
assert not err, err
print('t_foto_offen ok')
