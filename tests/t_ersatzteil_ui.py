import os, json; os.chdir(os.path.dirname(os.path.abspath(__file__)))  # Pfade relativ zu tests/
from playwright.sync_api import sync_playwright
"""Ersatzteil Tool, Oberfläche am Handy: Start, Einlagern (Prüfen, Box, Speichern), Suche mit Treffern und Online-Ergebnis. google.script.run ist gestubbt."""
html = open('../apps/ersatzteil/Index.html', encoding='utf8').read()
start = {"version": "test", "ich": "test@pretty-good.ch", "admin": True, "fotoBreite": 1200, "schluessel": True, "budgetVoll": False, "imLager": 3,
         "boxen": [{"box": "B12", "produktart": "Kaffeemaschine", "status": "offen", "ort": ""}, {"box": "B13", "produktart": "Kaffeemaschine", "status": "voll", "ort": ""}, {"box": "B20", "produktart": "Netzteile", "status": "offen", "ort": ""}],
         "produktarten": ["Kaffeemaschine", "Staubsauger"], "teilarten": ["Netzteil", "Tank", "Fernbedienung", "Akku"], "quellen": ["Galaxus-Retoure", "vidaXL"]}
treffer = {"passend": [{"id": "ET-0001", "marke": "Philips", "modell": "HD7462", "produktart": "Kaffeemaschine", "teil": "Wassertank", "menge": 1, "box": "B12"}],
           "serie": [{"id": "ET-0002", "marke": "Philips", "modell": "HD7447", "produktart": "Kaffeemaschine", "teil": "Filterhalter", "menge": 1, "box": "B12"}], "marke": [], "produktart": [], "text": []}
online = {"gefunden": 1, "hinweis": "", "suchbegriff": {"text": "422224780XX", "art": "Teilenummer von Philips", "quelle": "https://www.philips.ch/x"},
          "angebote": [{"teil": "Dichtung Brühgruppe", "nummer": "422224780XX", "art": "Original", "preis": 9.9, "shop": "philips.ch", "link": "https://www.philips.ch/x", "lieferbar": "Ja"}],
          "shops": [{"shop": "RS Online", "link": "https://ch.rs-online.com/web/c/?searchTerm=422224780XX", "info": "Gratis Versand"}, {"shop": "ASWO", "link": "https://aswoshop.aswo.com/app/?shop=513", "info": "Nur mit Login", "login": True}]}
antworten = {"startDaten": start, "suchen": treffer, "onlineSuche": online, "einlagern": {"id": "ET-0005", "box": "B12", "imLager": 4}, "boxNeu": {"box": "B21", "boxen": start["boxen"] + [{"box": "B21", "produktart": "Staubsauger", "status": "offen", "ort": ""}]}}
stub = "<script>window.ANTW=" + json.dumps(antworten) + ";window.AUFRUFE=[];window.google={script:{run:(function(){var ok,fe;var o={withSuccessHandler:function(f){ok=f;return o},withFailureHandler:function(f){fe=f;return o},api:function(n,a){window.AUFRUFE.push([n,a]);setTimeout(function(){ok(window.ANTW[n])},10)}};return o;})()}};</script>"
html = html.replace('<head>', '<head>' + stub, 1)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
    fehler = []; pg.on('pageerror', lambda e: fehler.append(str(e)))
    pg.route('http://app.test/', lambda r: r.fulfill(body=html, content_type='text/html; charset=utf-8'))
    pg.goto('http://app.test/'); pg.wait_for_timeout(300)
    assert '3 Teile' in pg.inner_text('#sub'); pg.screenshot(path='et_start.png')
    # Einlagern von Hand
    pg.click('[data-a=einHand]'); pg.wait_for_timeout(100)
    pg.fill('#f-marke', 'Philips'); pg.fill('#f-modell', 'HD7462/20'); pg.fill('#f-produktart', 'Kaffeemaschine'); pg.click('[data-a=teilart][data-v=Tank]')
    assert pg.input_value('#f-teil') == 'Tank'; pg.screenshot(path='et_pruefen.png')
    pg.click('[data-a=zuBox]'); pg.wait_for_timeout(100)
    assert 'IN B12 SPEICHERN' in pg.inner_text('#speichern').upper(), pg.inner_text('#speichern')   # Vorschlag: passende offene Box
    assert pg.is_disabled('[data-a=box][data-v=B13]')                                      # volle Box nicht wählbar
    pg.click('[data-a=menge][data-v="2"]'); pg.screenshot(path='et_box.png')
    pg.click('#speichern'); pg.wait_for_timeout(100)
    a = [x for x in pg.evaluate('window.AUFRUFE') if x[0] == 'einlagern'][0][1][0]
    assert a['box'] == 'B12' and a['menge'] == 2 and a['teil'] == 'Tank' and a['teilart'] == 'Tank', a
    assert 'GESPEICHERT' in pg.inner_text('#titel').upper(), pg.inner_text('#titel'); pg.screenshot(path='et_fertig.png')
    # Suche getippt, Treffer, Online
    pg.click('[data-a=start]'); pg.click('[data-a=suchHand]'); pg.fill('#s-text', 'Philips HD7462'); pg.press('#s-text', 'Enter'); pg.wait_for_timeout(100)
    assert '2 im Lager' in pg.inner_text('#sub'); assert 'Gleiche Serie' in pg.inner_text('#treffer')
    pg.fill('#s-teil', 'Dichtung'); pg.click('#online-knopf'); pg.wait_for_timeout(100)
    o = [x for x in pg.evaluate('window.AUFRUFE') if x[0] == 'onlineSuche'][0][1][0]
    assert o['marke'] == 'Philips' and o['modell'] == 'HD7462' and o['teil'] == 'Dichtung', o
    t = pg.inner_text('#online'); assert 'CHF 9.90' in t and 'ASWO APP' in t.upper() and '422224780XX' in t, t
    assert pg.evaluate("document.body.scrollWidth <= 390"), 'horizontaler Überlauf'
    pg.screenshot(path='et_suche.png', full_page=True)
    assert not fehler, fehler
    b.close()
print('ok ersatzteil ui')
