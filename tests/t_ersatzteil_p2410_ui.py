import os, json; os.chdir(os.path.dirname(os.path.abspath(__file__)))  # Pfade relativ zu tests/
from playwright.sync_api import sync_playwright
"""Ersatzteil Tool, Prüfung 24.10.2026 (Befund 2 und 3) im echten Browser, 390 px: Während «Speichern» läuft, sind Abbrechen und Zurück gesperrt (sichtbar),
nach der Antwort kommt «Gespeichert». Wird die Seite währenddessen neu geladen, holt der Start die Erfassung mit derselben Kennung nach und meldet die ET-Nummer.
google.script.run ist gestubbt; «einlagern» antwortet erst, wenn der Test window.LOS() aufruft."""
html = open('../apps/ersatzteil/Index.html', encoding='utf8').read()
start = {"version": "test", "ich": "test@pretty-good.ch", "admin": True, "fotoBreite": 1200, "schluessel": True, "budgetVoll": False, "imLager": 3,
         "boxen": [{"box": "B12", "produktart": "Kaffeemaschine", "status": "offen", "ort": ""}, {"box": "B20", "produktart": "Netzteile", "status": "offen", "ort": ""}],
         "produktarten": ["Kaffeemaschine"], "teilarten": ["Tank", "Akku"], "quellen": []}
stub = ("<script>window.START=" + json.dumps(start) + ";window.AUFRUFE=JSON.parse(sessionStorage.getItem('aufrufe')||'[]');window.WARTEND=[];"
        "window.LOS=function(){var w=window.WARTEND.shift();w.ok({id:'ET-0042',box:w.a[0].box,teil:w.a[0].teil,imLager:4,wiederholt:!!w.wieder});};"
        "window.google={script:{get run(){var ok,fe;var o={withSuccessHandler:function(f){ok=f;return o},withFailureHandler:function(f){fe=f;return o},"
        "api:function(n,a){window.AUFRUFE.push([n,a]);sessionStorage.setItem('aufrufe',JSON.stringify(window.AUFRUFE));"
        "if(n==='startDaten'){setTimeout(function(){ok(window.START)},10);return;}"
        "if(n==='einlagern'){window.WARTEND.push({ok:ok,a:a,wieder:window.AUFRUFE.filter(function(x){return x[0]==='einlagern'}).length>1});return;}"
        "setTimeout(function(){ok({})},10);}};return o;}}};</script>")
html = html.replace('<head>', '<head>' + stub, 1)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844})
    fehler = []; pg.on('pageerror', lambda e: fehler.append(str(e)))
    pg.on('dialog', lambda d: d.accept())
    pg.route('http://app.test/', lambda r: r.fulfill(body=html, content_type='text/html; charset=utf-8'))
    pg.goto('http://app.test/'); pg.wait_for_timeout(300)
    # 1) Abbrechen während des Speicherns: gesperrt, dann «Gespeichert»
    pg.click('[data-a=einHand]'); pg.fill('#f-marke', 'Philips'); pg.fill('#f-produktart', 'Kaffeemaschine'); pg.fill('#f-teil', 'Tank'); pg.click('[data-a=zuBox]')
    pg.click('#speichern'); pg.wait_for_timeout(50)
    assert pg.is_disabled('#speichern') and 'GESPEICHERT' in pg.inner_text('#speichern').upper(), pg.inner_text('#speichern')
    pg.click('.fuss [data-a=start]'); pg.wait_for_timeout(50)
    assert 'Wird gespeichert' in pg.inner_text('#meldung'), pg.inner_text('#meldung')
    assert pg.locator('#speichern').count() == 1, 'Seite «Box» bleibt'
    pg.evaluate('window.LOS()'); pg.wait_for_timeout(50)
    assert 'GESPEICHERT' in pg.inner_text('#titel').upper() and pg.inner_text('#kopf-etikett') == 'ET-0042'
    assert pg.evaluate("localStorage.getItem('et-offen')") is None
    # 2) Neuladen während des Speicherns: Start holt die Erfassung mit derselben Kennung nach
    pg.click('[data-a=einHand]'); pg.fill('#f-marke', 'Dyson'); pg.fill('#f-produktart', 'Staubsauger'); pg.fill('#f-teil', 'Akku'); pg.click('[data-a=zuBox]')
    pg.click('[data-a=box][data-v=B20]'); pg.click('#speichern'); pg.wait_for_timeout(50)
    k1 = [x for x in pg.evaluate('window.AUFRUFE') if x[0] == 'einlagern'][-1][1][0]['kennung']
    assert json.loads(pg.evaluate("localStorage.getItem('et-offen')"))['daten']['kennung'] == k1
    pg.reload(); pg.wait_for_timeout(300)
    ein = [x for x in pg.evaluate('window.AUFRUFE') if x[0] == 'einlagern']
    assert len(ein) == 3 and ein[-1][1][0]['kennung'] == k1 and ein[-1][1][0]['teil'] == 'Akku', ein
    assert 'wird abgeschlossen' in pg.inner_text('#meldung'), pg.inner_text('#meldung')
    pg.evaluate('window.LOS()'); pg.wait_for_timeout(50)
    t = pg.inner_text('#meldung'); assert 'Akku liegt in Box B20 (ET-0042)' in t, t
    assert pg.evaluate("localStorage.getItem('et-offen')") is None
    assert pg.evaluate("document.body.scrollWidth <= 390"), 'horizontaler Überlauf'
    pg.screenshot(path='et_p2410_nachholen.png')
    assert not fehler, fehler
    b.close()
print('ok ersatzteil p2410 ui')
