import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))  # Pfade relativ zu tests/
"""Ricardo Tool: Hauptbild beim Packen und ein Post-Export pro Versandklasse (Oberfläche mit Stub). Lauf: python3 tests/t_ricardo_pack.py"""
import json, pathlib, base64
from playwright.sync_api import sync_playwright
html = (pathlib.Path(__file__).parent.parent / 'apps/ricardo/Index.html').read_text().replace('<?!= JSON.stringify(lang) ?>', '"de"')
PIX = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
O = lambda nr, pg, bild: {'nr': nr, 'pgId': pg, 'titel': 'Stück ' + nr, 'am': '16.10.2026', 'total': '49.00', 'preis': '40.00', 'status': 'Zu packen', 'name': 'A B', 'kaeufer': 'ab', 'ort': '3000 Bern', 'lagerort': 'Regal Unpaid', 'klasse': 'PostPac B-Post bis 2 kg', 'bild': bild}
X = base64.b64encode(b'xlsx').decode()
DATEN = {'startDaten': {'version': 't', 'admin': False, 'zustaende': ['Gebraucht'], 'maengelPflicht': [], 'laufzeit': 6, 'retoureGruende': [], 'kiAktiv': True, 'aktiv': 3, 'schwelle': 90},
         'analyseListe': [], 'verkaeufe': {'offen': [O('1', 'PG-1', PIX), O('2', 'PG-2', '')], 'zuPacken': 2},
         'postAdressen': {'anzahl': 3, 'dateien': [{'klasse': 'PostPac B-Post bis 2 kg', 'anzahl': 2, 'name': 'Post-Adressen 2026-10-16 PostPac B-Post bis 2 kg.xlsx', 'datei': X},
                                                    {'klasse': 'Sperrgut B-Post bis 30 kg', 'anzahl': 1, 'name': 'Post-Adressen 2026-10-16 Sperrgut B-Post bis 30 kg.xlsx', 'datei': X}]},
         'retouren': {'offen': []}}
stub = """<script>window.google={script:{run:(function mk(ok,fail){return new Proxy({},{get:function(_,k){
 if(k==='withSuccessHandler')return function(f){return mk(f,fail)}; if(k==='withFailureHandler')return function(f){return mk(ok,f)};
 return function(l,name,args){var D=%s;setTimeout(function(){ok&&ok(JSON.parse(JSON.stringify(D[name]||{})))},5)}}})})()}};</script>""" % json.dumps(DATEN)
html = html.replace('<head>', '<head>' + stub, 1)
fehler = 0
def ok(b, m):
    global fehler
    print('ok' if b else 'FEHLER', m); fehler += 0 if b else 1
with sync_playwright() as p:
    b = p.chromium.launch(); s = b.new_page(); err = []
    s.on('pageerror', lambda e: err.append(str(e)))
    s.set_content(html); s.wait_for_timeout(300)
    s.evaluate("zeige('verkauf')"); s.wait_for_timeout(200)
    ok(s.locator('#v-liste img.vbild').count() == 1, 'Hauptbild nur beim Stück mit Foto')
    ok('Stück 2' in s.inner_text('#v-liste'), 'Stück ohne Foto erscheint normal')
    s.evaluate('post()'); s.wait_for_timeout(200)
    links = s.locator('#v-post a')
    ok(links.count() == 2, 'zwei Dateien, eine pro Versandklasse')
    ok(links.nth(1).get_attribute('download').endswith('Sperrgut B-Post bis 30 kg.xlsx'), 'Dateiname mit Klasse')
    ok('3 Adressen in 2 Dateien' in s.inner_text('#v-post'), 'Hinweis mit Anzahl')
    ok(not err, 'keine Fehler im Browser ' + str(err))
    b.close()
print('Fehler:', fehler); raise SystemExit(1 if fehler else 0)
