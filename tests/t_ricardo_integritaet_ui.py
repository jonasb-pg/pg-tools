import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))  # Pfade relativ zu tests/
"""Ricardo Tool Oberfläche nach dem Audit 24.10.2026: Suche über alle Kanäle (S1, S3, S6, M1), Listing ohne Inventar mit Doppelprüfung (S2),
«Unverkauft» mit unzugeordneten Verkäufen (M4), zweiter Verkauf in «Täglich» (M3). Stub, erfundene Daten. Lauf: python3 tests/t_ricardo_integritaet_ui.py"""
import json, pathlib
from playwright.sync_api import sync_playwright
html = (pathlib.Path(__file__).parent.parent / 'apps/ricardo/Index.html').read_text().replace('<?!= JSON.stringify(lang) ?>', '"de"')
LINKS = {'listen': 'https://www.ricardo.ch/de/list/', 'verkauft': 'https://www.ricardo.ch/de/my-ricardo/selling/orders/', 'amVerkaufen': 'https://www.ricardo.ch/de/my-ricardo/selling/offers/', 'artikel': 'https://www.ricardo.ch/de/a/'}
AU = {'anzahl': 0, 'verpasst': 0, 'kontrolle': {'aktiv': True, 'letzte': '24.10. 12:00', 'warnung': False, 'unecht': 0}, 'angebote': [], 'fragen': [], 'zahlung': [], 'bewertungen': []}
VK = lambda nr, am: {'nr': nr, 'pgId': 'PG-100', 'titel': 'Philips Toaster', 'kaeufer': 'k' + nr, 'name': 'Testa ' + nr, 'total': '39.00', 'am': am, 'tage': 1, 'bezahlt': '', 'link': 'x'}
TAEGLICH = {'art': 'taeglich', 'links': LINKS, 'aufgaben': AU, 'melden': [], 'offen': [], 'storno': [], 'stornoTage': 14, 'letzteBank': '',
            'doppelt': [{'pgId': 'PG-100', 'verkaeufe': [VK('9003', '23.10.2026'), VK('9004', '24.10.2026')]}]}
R = {'id': 'RC-0001', 'status': 'In Arbeit', 'ean': '', 'bezeichnung': 'Philips Toaster', 'neupreis': '', 'startpreis': '20.00', 'lagerort': '', 'zustand': '', 'maengel': '',
     'frei': True, 'gewicht': '', 'sperrgut': False, 'klasse': '', 'versand': '', 'titel': '', 'beschrieb': '', 'link': '', 'produktlink': '', 'fehlt': ['Zustand wählen'], 'versandForm': '',
     'getestet': False, 'buendelIds': [], 'buendelInhalt': [], 'masse': [], 'englisch': '', 'englischAlt': False, 'quelle': 'Frei', 'analyse': False, 'analyseNr': '', 'fotoOrdner': '', 'geaendert': '', 'regal': 'Ricardo Offline'}
SUCHE = {'treffer': [{'id': 'PG-100', 'name': 'Philips Toaster HD2581', 'tab': 'Online', 'ort': 'TEC-1', 'erfasst': '01.10.2026', 'vp': 30, 'status': '', 'teilVon': '', 'quelle': 'rt', 'warnung': 'Möglicherweise dasselbe Stück wie AN-0008 (Analyse)'}],
         'andere': [{'id': 'PG-200', 'name': 'Philips Toaster HD2581', 'tab': 'Stationär', 'ort': 'HOM-12', 'vp': 25, 'status': '', 'teilVon': '', 'quelle': 'rt', 'warnung': ''},
                    {'id': '', 'name': 'Philips Toaster', 'tab': 'Scanner', 'ort': 'HOM-44', 'vp': 0, 'status': '', 'teilVon': '', 'quelle': 'rt', 'warnung': ''}],
         'archiv': [{'id': 'PG-50', 'name': 'Philips Toaster alt', 'tab': 'Archiv Entsorgt', 'ort': '', 'archiv': True, 'warnung': ''}],
         'eigene': [{'id': 'RC-0003', 'name': 'Toaster Philips (Reuse)', 'ort': 'R1', 'erfasst': '01.09.2026', 'status': 'Unverkauft', 'entscheid': '', 'rc': True, 'warnung': ''},
                    {'id': 'PG-77', 'name': 'Philips Toaster grau', 'ort': '', 'erfasst': '01.08.2026', 'status': 'Unverkauft', 'entscheid': 'Anderer Kanal', 'rc': False, 'warnung': ''}],
         'mehr': False, 'anzahl': 6}
DATEN = {'startDaten': {'version': 't', 'admin': False, 'zustaende': ['Neu und originalverpackt', 'Gebraucht'], 'maengelPflicht': ['Gebraucht'], 'laufzeit': 6, 'retoureGruende': [], 'kiAktiv': True, 'mailAktiv': True, 'aktiv': 3, 'schwelle': 90},
         'suche': SUCHE, 'starteListing': R, 'aehnlicheStuecke': {'kandidaten': []}, 'analyseListe': [], 'aufgaben': AU, 'mailsJetzt': AU,
         'zaehler': {'offen': 0, 'zuPacken': 0, 'versand': 0, 'retouren': 0}, 'verkaeufe': {'offen': []}, 'retouren': {'offen': []},
         'uebersicht': {'letzterImport': '', 'aktiv': 1, 'schwelle': 90, 'laufzeit': 6, 'liste': [{'id': 'PG-101', 'status': 'Gelistet', 'name': 'Kabel', 'ort': 'TEC-2', 'link': 'x', 'buendel': '', 'regal': '', 'seit': '01.10.2026', 'laufzeit': 6, 'abgelaufen': True}],
                        'unzugeordnet': [{'nr': '7001', 'artikel': '6666666666', 'titel': 'Neu: Lampe'}]},
         'setzeStatus': {'letzterImport': '', 'aktiv': 0, 'schwelle': 90, 'laufzeit': 6, 'liste': [], 'unzugeordnet': []},
         'ablauf:taeglich': TAEGLICH, 'ablauf:schicht1': {'art': 'schicht1', 'links': LINKS, 'bereit': [], 'analyse': 0, 'unverkauft': [], 'ohneMail': [], 'entscheide': [], 'aktiv': 0, 'schwelle': 90, 'laufzeit': 6, 'regale': {}, 'unzugeordnet': []},
         'ablauf:schicht2': {'art': 'schicht2', 'links': LINKS, 'verkaeufe': {'offen': []}, 'unverkauft': [], 'ohneMail': [], 'entscheide': [], 'regale': {}},
         'ablauf:schicht3': {'art': 'schicht3', 'links': LINKS, 'versand': [], 'warten': [], 'regale': {}}}
stub = """<script>window.AUFRUFE=[];window.D=%s;window.open=function(){};window.google={script:{run:(function mk(ok,fail){return new Proxy({},{get:function(_,k){
 if(k==='withSuccessHandler')return function(f){return mk(f,fail)}; if(k==='withFailureHandler')return function(f){return mk(ok,f)};
 return function(l,name,args){AUFRUFE.push([name,args]);var key=name==='ablauf'?'ablauf:'+args[0]:name;setTimeout(function(){ok&&ok(JSON.parse(JSON.stringify(D[key]||{})))},5)}}})})()}};</script>""" % json.dumps(DATEN)
html = html.replace('<head>', '<head>' + stub, 1)
fehler = 0
def ok(b, m):
    global fehler
    print('ok' if b else 'FEHLER', m); fehler += 0 if b else 1
with sync_playwright() as p:
    b = p.chromium.launch(); s = b.new_page(viewport={'width': 1300, 'height': 1400}); err = []
    s.on('pageerror', lambda e: err.append(str(e)))
    s.set_content(html); s.wait_for_timeout(400)
    rufe = lambda n: [x[1] for x in s.evaluate('AUFRUFE') if x[0] == n]
    # ---------- M3: Täglich zeigt den zweiten Verkauf ----------
    ok(s.is_visible('#f-doppelt') and 'PG-100' in s.inner_text('#f-doppelt') and '9004' in s.inner_text('#f-doppelt') and 'Zweiter Verkauf' in s.inner_text('#f-doppelt'), 'M3: «Täglich» warnt vor dem zweiten Verkauf')
    # ---------- Suche: alle Kanäle ----------
    s.evaluate("zeige('listen')"); s.wait_for_timeout(200)
    s.evaluate("$('q').value='Philips Toaster'; suchen()"); s.wait_for_timeout(200)
    tr = s.text_content("#treffer")
    ok('6 Treffer' in tr and 'Nichts wird automatisch gewählt' in tr, 'M1: mehrere Treffer, Auswahl verlangt')
    ok('Möglicherweise dasselbe Stück wie AN-0008' in tr, 'S6: Warnung «möglicherweise dasselbe Stück»')
    ok('Stationär' in tr and 'HOM-12' in tr and 'Trotzdem listen' in tr, 'S1: anderer Kanal mit Tab und Lagerort, «Trotzdem listen»')
    ok('ohne ID' in tr, 'S1: Scanner ohne ID nicht listbar')
    ok('Im Archiv des Return Tools' in tr and 'Archiv Entsorgt' in tr and 'gesperrt' in tr, 'S1: Archiv gezeigt und gesperrt')
    ok('In den Listings dieses Tools' in tr and 'RC-0003' in tr and 'Neu listen' in tr, 'S3: eigenes RC-Listing mit «Neu listen»')
    ok('Anderer Kanal' in tr and s.locator('#treffer tr:has-text("PG-77") button').count() == 0, 'S4: vergebenes Stück ohne Knopf, mit Entscheid')
    ok(s.locator('#treffer tr:has-text("PG-50") button').count() == 0, 'S1: Archiv-Zeile ohne Knopf')
    s.click('#treffer tr:has-text("PG-200") button'); s.wait_for_timeout(100)
    ok(s.is_visible('#dialog') and 'Stationär' in s.inner_text('#dialog-text') and not rufe('starteListing'), 'S1: Listen aus anderem Kanal nur nach Bestätigung')
    s.click('#dialog-ja'); s.wait_for_timeout(200)
    ok(rufe('starteListing')[-1] == ['PG-200', True], 'S1: nach Ja: starteListing mit Bestätigung')
    s.evaluate("schliesse && schliesse()"); s.evaluate("zeige('listen')"); s.wait_for_timeout(200)
    s.evaluate("$('q').value='Philips Toaster'; suchen()"); s.wait_for_timeout(200)
    s.click('#treffer tr:has-text("RC-0003") button'); s.wait_for_timeout(200)
    ok(rufe('starteListing')[-1] == ['RC-0003'], 'S3: «Neu listen» startet das RC-Listing')
    # ---------- S2 (Entscheid Jonas 24.10.2026): nur PG-ID; bei «nicht gefunden» ähnliche Stücke zeigen ----------
    s.evaluate("schliesse && schliesse()"); s.evaluate("zeige('listen')"); s.wait_for_timeout(200)
    ok(s.locator('#frei').count() == 0 and s.locator('#fr-name').count() == 0 and 'ohne Inventar' not in s.text_content('#such-karte'), 'S2: kein Weg mehr zu neuen RC-Listings')
    s.evaluate("D.suche = { treffer: [], andere: [], archiv: [], eigene: [], anzahl: 0 }; D.aehnlicheStuecke = { kandidaten: [{ id: 'PG-100', name: 'Philips Toaster HD2581', tab: 'Online', ort: 'TEC-1', status: '', quelle: 'Return Tool', grund: 'Name', archiv: false }] }")
    s.evaluate("$('q').value='Philips Toaster Pro'; suchen()"); s.wait_for_timeout(250)
    ok('Nur Stücke mit PG-ID' in s.text_content('#such-meldung'), 'S2: Meldung «nicht gefunden» verlangt PG-ID')
    ok(rufe('aehnlicheStuecke')[-1] == ['Philips Toaster Pro'] and s.is_visible('#aehnlich') and 'PG-100' in s.text_content('#aehnlich') and s.locator('#aehnlich button').count() == 0, 'S2: ähnliche Stücke als Hilfe, ohne Knopf zum Anlegen')
    ok(not rufe('freiesListing'), 'S2: nichts angelegt')
    # ---------- M4: «Unverkauft» mit unzugeordneten Verkäufen ----------
    s.evaluate("schliesse && schliesse()"); s.evaluate("zeige('ueber')"); s.wait_for_timeout(300)
    s.click('#u-liste button'); s.wait_for_timeout(100)
    ok(s.is_visible('#dialog') and 'Achtung: 1 Verkäufe sind keinem Listing zugeordnet' in s.inner_text('#dialog-text') and '7001' in s.inner_text('#dialog-text'), 'M4: Warnung im Dialog')
    s.click('#dialog-ja'); s.wait_for_timeout(200)
    ok(rufe('setzeStatus')[-1] == ['PG-101', 'Unverkauft', True], 'M4: mit Bestätigung an den Server')
    ok(not err, 'keine JS-Fehler ' + str(err))
    b.close()
print('alle Tests ok' if not fehler else '%d Fehler' % fehler); raise SystemExit(1 if fehler else 0)
