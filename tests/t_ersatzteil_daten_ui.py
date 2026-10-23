import os, json; os.chdir(os.path.dirname(os.path.abspath(__file__)))  # Pfade relativ zu tests/
from playwright.sync_api import sync_playwright
"""Ersatzteil Tool (24.10.2026): Treffer «passend» trotz anderer Marke zeigt den Hinweis «Marke prüfen». google.script.run ist gestubbt."""
html = open('../apps/ersatzteil/Index.html', encoding='utf8').read()
start = {"version": "test", "ich": "test@pretty-good.ch", "admin": True, "fotoBreite": 1200, "schluessel": True, "budgetVoll": False, "imLager": 2,
         "boxen": [{"box": "B12", "produktart": "Kaffeemaschine", "status": "offen", "ort": ""}], "produktarten": ["Kaffeemaschine"], "teilarten": ["Tank"], "quellen": []}
treffer = {"passend": [{"id": "ET-0001", "marke": "De'Longhi", "modell": "ECAM22.110", "produktart": "Kaffeemaschine", "teil": "Brühgruppe", "menge": 1, "box": "B12", "hinweis": "Marke prüfen (De'Longhi)"},
                       {"id": "ET-0002", "marke": "Saeco", "modell": "ECAM22.110", "produktart": "Kaffeemaschine", "teil": "Tank", "menge": 1, "box": "B12"}], "serie": [], "marke": [], "produktart": [], "text": []}
stub = "<script>window.ANTW=" + json.dumps({"startDaten": start, "suchen": treffer}) + ";window.google={script:{run:(function(){var ok;var o={withSuccessHandler:function(f){ok=f;return o},withFailureHandler:function(){return o},api:function(n,a){setTimeout(function(){ok(window.ANTW[n])},10)}};return o;})()}};</script>"
html = html.replace('<head>', '<head>' + stub, 1)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844})
    fehler = []; pg.on('pageerror', lambda e: fehler.append(str(e)))
    pg.route('http://app.test/', lambda r: r.fulfill(body=html, content_type='text/html; charset=utf-8'))
    pg.goto('http://app.test/'); pg.wait_for_timeout(300)
    pg.click('[data-a=suchHand]'); pg.fill('#s-text', 'Saeco ECAM22.110'); pg.press('#s-text', 'Enter'); pg.wait_for_timeout(150)
    li = pg.locator('#treffer li')
    assert li.count() == 2, li.count()
    assert "Marke prüfen (De'Longhi)" in li.nth(0).inner_text(), li.nth(0).inner_text()
    assert 'Marke prüfen' not in li.nth(1).inner_text()
    assert not fehler, fehler
    b.close()
print('ok ersatzteil daten ui')
