import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))
"""Umpack Tool Oberfläche (21.10.2026): Setup, Scan (ID, Barcode, unbekannt, doppelt, verschieben, Preis), Warteschlange, Abschluss. Erfundene Daten. Lauf: python3 tests/t_umpacken_ui.py"""
import json, sys
from playwright.sync_api import sync_playwright
html = open('../apps/umpacken/Index.html', encoding='utf8').read()
D = {'id': 'U-0001', 'name': 'Kids → Balu', 'status': 'Scan', 'quelle': 'Return Tool', 'lagerorte': 'KID-7, KID-12', 'listen': '',
     'gebinde': [{'id': 'U-0001-G1', 'name': 'Balu 1', 'art': 'Verkauf', 'abnehmer': 'Balu', 'lagerort': 'BALU-1', 'preisregel': 'VP', 'prozent': ''},
                 {'id': 'U-0001-G2', 'name': 'Kids neu', 'art': 'Lager', 'abnehmer': '', 'lagerort': 'KID-13', 'preisregel': 'Prozent', 'prozent': 50},
                 {'id': 'U-0001-G3', 'name': 'Weg', 'art': 'Entsorgung', 'abnehmer': '', 'lagerort': '', 'preisregel': 'Null', 'prozent': ''}],
     'bestand': [{'id': 'PG-1', 'barcode': '111', 'name': 'Lego Zug', 'kat': 'Kids', 'vp': 20, 'ort': 'KID-7', 'tab': 'Stationär'},
                 {'id': 'PG-2', 'barcode': '222', 'name': 'Puppe', 'kat': 'Kids', 'vp': 12.5, 'ort': 'KID-7', 'tab': 'Stationär'},
                 {'id': 'PG-3', 'barcode': '222', 'name': 'Puppe', 'kat': 'Kids', 'vp': 12.5, 'ort': 'KID-7', 'tab': 'Stationär'}],   # seit 24.10.2026 gleicher Lagerort: gleiche EAN aus verschiedenen Lagerorten verlangt die PG-ID (Prüfung 24.10.2026 Befund 4)
     'zuordnung': {}, 'aenderungen': []}
stub = """<script>window.CALLS=[];window.D=%s;window.ZU={};
window.google={script:{run:(function mk(ok,fail){return new Proxy({},{get:function(_,k){
 if(k==='withSuccessHandler')return function(f){return mk(f,fail)}; if(k==='withFailureHandler')return function(f){return mk(ok,f)};
 return function(name,args){CALLS.push([name,JSON.parse(JSON.stringify(args))]);setTimeout(function(){var r;
  if(name==='start')r={version:'t',durchgaenge:[{id:'U-0001',name:'Kids → Balu',status:'Scan',quelle:'Return Tool',lagerorte:'KID-7',erstellt:'22.10.2026'}]};
  if(name==='lagerorte')r={orte:[{ort:'KID-7',anzahl:2},{ort:'KID-12',anzahl:1},{ort:'HOM-3',anzahl:5}],naechste:{KID:'KID-13',HOM:'HOM-4'}};
  if(name==='laden'||name==='anlegen'){r=JSON.parse(JSON.stringify(D));r.zuordnung=JSON.parse(JSON.stringify(ZU));}
  if(name==='zuordnen'){var konf=[];args[1].forEach(function(o){if(!o.id&&o.code)o=Object.assign({},o,{id:o.wunsch}); if(o.id==='PG-2'&&window.KONFLIKT){konf.push({id:o.id,grund:'inzwischen von jemand anderem in Weg gelegt'});return;} if(o.gebinde)ZU[o.id]={gebinde:o.gebinde,preis:o.preis};else delete ZU[o.id];});r={zuordnung:JSON.parse(JSON.stringify(ZU)),konflikte:konf};}
  if(name==='abschliessen'){r=JSON.parse(JSON.stringify(D));r.status='Abgeschlossen';r.zuordnung=ZU;r.listen='Balu: https://docs.google.com/x';r.aenderungen=[{r:2,id:'PG-1',name:'Lego Zug',aktion:'Verkaufen',gebinde:'Balu 1',abnehmer:'Balu',alt:'KID-7',neu:'BALU-1',vp:20,preis:20,tab:'Stationär',zeile:'7',erledigt:''}];}
  if(name==='erledigt'){r=[{r:2,id:'PG-1',name:'Lego Zug',aktion:'Verkaufen',gebinde:'Balu 1',abnehmer:'Balu',alt:'KID-7',neu:'BALU-1',vp:20,preis:20,tab:'Stationär',zeile:'7',erledigt:args[2]?'x':''}];}
  ok&&ok(r);},5)}}})})()}};</script>""" % json.dumps(D)
html = html.replace('<head>', '<head>' + stub, 1)
fehler = 0
def ok(b, m):
    global fehler
    print('ok' if b else 'FEHLER', m); fehler += 0 if b else 1
N = lambda s, n: s.evaluate("CALLS.filter(function(c){return c[0]==='%s'}).length" % n)
with sync_playwright() as p:
    b = p.chromium.launch(); s = b.new_page(viewport={'width': 1300, 'height': 1000}); err = []
    s.on('pageerror', lambda e: err.append(str(e)))
    s.on('dialog', lambda d: d.accept())
    s.route('http://app.test/', lambda r: r.fulfill(body=html, content_type='text/html; charset=utf-8'))
    s.goto('http://app.test/'); s.wait_for_timeout(200)
    ok('Kids → Balu' in s.text_content('main'), 'Startseite mit offenem Durchgang')
    # Setup
    s.click('button[data-a=neuerDurchgang]'); s.wait_for_timeout(150)
    ok(s.locator('.orte label').count() == 3, 'Lagerorte aus dem Return Tool')
    s.fill('#s-filter', 'KID'); s.wait_for_timeout(50)
    ok(s.locator('.orte label').count() == 2, 'Filter KID')
    s.click('button[data-a=alleOrte]'); s.wait_for_timeout(50)
    ok('2 Lagerorte, 3 Stücke' in s.text_content('#s-zahl'), 'Auswahl gezählt')
    z = s.locator('.geb-zeile').first
    z.locator('[data-g=name]').fill('Balu 1'); z.locator('[data-g=abnehmer]').fill('Balu'); z.locator('[data-g=lagerort]').fill('balu-1')
    s.click('button[data-a=gebDazu]'); s.wait_for_timeout(50)
    z2 = s.locator('.geb-zeile').nth(1)
    z2.locator('[data-g=name]').fill('Kids neu')
    ok('KID-13' in z2.text_content(), 'Vorschlag nächste Palette KID-13')
    z2.locator('button[data-a=vorschlag]', has_text='KID-13').click(); s.wait_for_timeout(50)
    ok(s.locator('.geb-zeile').nth(1).locator('[data-g=lagerort]').input_value() == 'KID-13', 'Vorschlag übernommen')
    s.click('button[data-a=gebDazu]'); s.wait_for_timeout(50)
    s.locator('.geb-zeile').nth(2).locator('[data-g=art]').select_option('Entsorgung'); s.wait_for_timeout(50)
    ok(s.locator('.geb-zeile').nth(2).locator('[data-g=lagerort]').is_disabled() and s.locator('.geb-zeile').nth(2).locator('[data-g=name]').input_value() == '', 'Entsorgung: kein Lagerort')
    s.locator('.geb-zeile').nth(2).locator('[data-g=name]').fill('Weg')
    s.click('button[data-a=anlegen]'); s.wait_for_timeout(200)
    a = s.evaluate("CALLS.filter(function(c){return c[0]==='anlegen'})[0][1][0]")
    ok(a['lagerorte'] == ['KID-7', 'KID-12'] and a['gebinde'][0]['lagerort'] == 'BALU-1' and a['gebinde'][2]['art'] == 'Entsorgung' and a['gebinde'][1]['lagerort'] == 'KID-13', 'Setup gesendet: ' + json.dumps(a['gebinde'])[:200])
    ok(s.is_visible('#scan'), 'nach dem Setup: Scan')
    if len(sys.argv) > 2 and sys.argv[2].endswith('.png'): s.screenshot(path=sys.argv[2], full_page=True)
    # Scan ohne Kürzel
    s.fill('#scan', 'PG-1'); s.press('#scan', 'Enter'); s.wait_for_timeout(50)
    ok('Kürzel' in s.text_content('#rueck'), 'ohne Kürzel: Hinweis')
    s.fill('#kuerzel', 'jb')
    s.fill('#scan', 'pg-1'); s.press('#scan', 'Enter'); s.wait_for_timeout(200)
    ok('Balu 1' in s.text_content('#rueck') and 'CHF 20.00' in s.text_content('#rueck'), 'PG-1 → Balu 1, VP')
    ok(N(s, 'zuordnen') == 1 and s.evaluate("ZU['PG-1'].gebinde") == 'U-0001-G1', 'im Hintergrund gespeichert')
    # Barcode mit zwei Stücken: erstes freies, dann zweites, dann alle vergeben
    s.click('button[data-a=aktiv][data-v="U-0001-G2"]'); s.wait_for_timeout(50)
    s.fill('#scan', '222'); s.press('#scan', 'Enter'); s.wait_for_timeout(100)
    ok('PG-2' in s.text_content('#rueck') and 'CHF 6.25' in s.text_content('#rueck'), 'Barcode → PG-2, 50 %')
    s.fill('#scan', '222'); s.press('#scan', 'Enter'); s.wait_for_timeout(100)
    ok('PG-3' in s.text_content('#rueck'), 'gleicher Barcode → PG-3')
    s.fill('#scan', '222'); s.press('#scan', 'Enter'); s.wait_for_timeout(100)
    ok('Alle 2 Stücke' in s.text_content('#rueck'), 'Barcode erschöpft: PG-ID verlangen')
    s.fill('#scan', 'PG-99'); s.press('#scan', 'Enter'); s.wait_for_timeout(50)
    ok('nicht in der Quelle' in s.text_content('#rueck'), 'unbekannt')
    s.fill('#scan', 'PG-2'); s.press('#scan', 'Enter'); s.wait_for_timeout(50)
    ok('schon in Kids neu' in s.text_content('#rueck'), 'schon im aktiven Gebinde')
    # Verschieben nach Entsorgung
    s.click('button[data-a=aktiv][data-v="U-0001-G3"]'); s.wait_for_timeout(50)
    s.fill('#scan', 'PG-3'); s.press('#scan', 'Enter'); s.wait_for_timeout(50)
    ok(s.locator('#rueck button[data-a=verschieben]').count() == 1, 'in anderem Gebinde: Knopf verschieben')
    s.click('#rueck button[data-a=verschieben]'); s.wait_for_timeout(200)
    ok(s.evaluate("ZU['PG-3'].gebinde") == 'U-0001-G3', 'verschoben')
    ok('0 Stück' not in s.locator('.gebinde-wahl button[data-v="U-0001-G3"]').text_content() and 'CHF 0.00' in s.locator('.gebinde-wahl button[data-v="U-0001-G3"]').text_content(), 'Entsorgung CHF 0')
    # Preis von Hand
    inp = s.locator('#reiter-inhalt input[data-preis="PG-1"]')
    inp.fill('15'); inp.press('Enter'); s.wait_for_timeout(200)
    ok(s.evaluate("ZU['PG-1'].preis") == 15 and 'CHF 15.00' in s.locator('.gebinde-wahl button[data-v="U-0001-G1"]').text_content(), 'Preis von Hand 15')
    # Konflikt vom Server
    s.evaluate("KONFLIKT=true")
    s.click('#reiter-inhalt button[data-a=entfernen][data-v="PG-2"]'); s.wait_for_timeout(200)
    ok('Nicht gespeichert' in s.text_content('#rueck') and s.evaluate("UM.D.zuordnung['PG-2'].gebinde") == 'U-0001-G2', 'Konflikt: Stand vom Server gilt')
    s.evaluate("KONFLIKT=false")
    # Reiter offen / Gebinde
    s.click('button[data-a=reiter][data-v=offen]'); s.wait_for_timeout(50)
    ok('0 Stücke' in s.text_content('#reiter-inhalt'), 'nichts mehr offen')
    # Abschluss
    s.click('button[data-a=zumAbschluss]'); s.wait_for_timeout(200)
    ok('Kontrolle' in s.text_content('main') and 'CHF 15.00' in s.text_content('main'), 'Kontrolle mit Totalen')
    s.click('button[data-a=abschliessen]'); s.wait_for_timeout(200)
    t = s.text_content('main')
    ok('Abgeschlossen' in t and 'Liste öffnen' in t and 'BALU-1' in t and 'Liste kopieren' in t, 'Abschluss: Liste, Änderungen, kopieren')
    s.click('input[data-erl="2"]'); s.wait_for_timeout(150)
    ok('1 von 1 erledigt' in s.text_content('main'), 'erledigt angehakt')
    ok(not err, 'keine JS-Fehler ' + str(err))
    if len(sys.argv) > 1 and sys.argv[1].endswith('.png'): s.screenshot(path=sys.argv[1], full_page=True)   # nur Bildpfade
    b.close()
print('t_umpacken_ui ok' if not fehler else '%d Fehler' % fehler); raise SystemExit(1 if fehler else 0)
