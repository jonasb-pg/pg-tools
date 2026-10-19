import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))  # Pfade relativ zu tests/
"""Ricardo Tool: Abläufe Täglich, Schicht 1-3 mit Stub. Erfundene Daten. Lauf: python3 tests/t_ricardo_ablauf_ui.py [bild-prefix]"""
import json, pathlib, sys, tempfile
from playwright.sync_api import sync_playwright
html = (pathlib.Path(__file__).parent.parent / 'apps/ricardo/Index.html').read_text().replace('<?!= JSON.stringify(lang) ?>', '"de"')
LINKS = {'listen': 'https://www.ricardo.ch/de/list/', 'verkauft': 'https://www.ricardo.ch/de/my-ricardo/selling/orders/', 'amVerkaufen': 'https://www.ricardo.ch/de/my-ricardo/selling/offers/', 'artikel': 'https://www.ricardo.ch/de/a/'}
AU = {'anzahl': 1, 'verpasst': 0, 'kontrolle': {'aktiv': True, 'letzte': '19.10. 12:00', 'warnung': False, 'unecht': 0},
      'angebote': [{'id': 'm1', 'art': 'Preisvorschlag', 'eingang': '19.10. 10:00', 'alter': 2, 'titel': 'Neu: Föhn Z', 'pgId': 'PG-2002', 'artikel': '1300000009', 'betrag': '75.00', 'preis': '87.00', 'frist': '20.10. 10:00', 'restStunden': 20, 'empfehlung': 'Annehmen', 'link': 'https://www.ricardo.ch/de/a/1300000009'}],
      'fragen': [], 'zahlung': []}
V = lambda nr, titel, **k: dict({'nr': nr, 'pgId': 'PG-' + nr[-3:], 'titel': titel, 'kaeufer': 'nick' + nr[-2:], 'name': 'Testa Muster', 'total': '58.00', 'am': '16.10.2026', 'tage': 3, 'bezahlt': '', 'link': 'https://www.ricardo.ch/de/my-ricardo/selling/order/' + nr + '/'}, **k)
TAEGLICH = {'art': 'taeglich', 'links': LINKS, 'aufgaben': AU, 'melden': [V('50000001', 'Neu: Soundkarte', bezahlt='17.10.2026')],
            'storno': [V('50000007', 'Neu: Lampe', tage=12, storno='https://www.ricardo.ch/de/my-ricardo/selling/order/cancelation/50000007/')], 'stornoTage': 10, 'retouren': 2, 'letzteBank': ''}
BANK = {'sicher': [{'nr': '50000002', 'pgId': 'PG-002', 'titel': 'Neu: Kamera', 'kaeufer': 'nick02', 'name': 'Testa Beispiel', 'total': '91.00', 'status': 'Zu packen', 'grund': 'Nummer und Betrag',
                    'bank': {'datum': '2026-10-17', 'betrag': '91.00', 'text': 'GUTSCHRIFT 1300000002', 'auftrag': 'A2'}}],
        'unsicher': [{'nr': '50000004', 'pgId': 'PG-004', 'titel': 'Neu: Uhr', 'kaeufer': 'nick04', 'name': 'Testa Probe', 'total': '25.00', 'status': 'Wartet auf Zahlung', 'grund': 'Name und Betrag',
                      'bank': {'datum': '2026-10-17', 'betrag': '25.00', 'text': 'TESTA PROBE', 'auftrag': 'A4'}}], 'gutschriften': 3, 'schonErfasst': 1, 'offen': 5}
OFFEN = [dict(nr='50000002', pgId='PG-002', titel='Neu: Kamera', am='16.10.2026', total='91.00', preis='82.00', status='Zu packen', name='Testa Beispiel', kaeufer='nick02', ort='3000 Bern', lagerort='Ricardo Unpaid', klasse='Paket B-Post', meldet='', bezahlt='17.10.2026', ricardoGemeldet='', sendung='', artikel='1300000002', link='x', ohneAdresse=False),
         dict(nr='50000003', pgId='PG-003', titel='Neu: Tasche', am='16.10.2026', total='40.00', preis='31.00', status='Zu packen', name='nick03', kaeufer='nick03', ort='', lagerort='', klasse='Paket B-Post', meldet='', bezahlt='', ricardoGemeldet='', sendung='', artikel='', link='x', ohneAdresse=True)]
SCHICHT2 = {'art': 'schicht2', 'links': LINKS, 'verkaeufe': {'offen': OFFEN, 'zuPacken': 2}, 'letzterImport': '19.10.2026', 'postBereit': True, 'entscheide': ['Neu listen', 'Anderer Kanal', 'Entsorgung'],
            'unverkauft': [{'id': 'PG-010', 'status': 'Unverkauft', 'name': 'Bügeleisen', 'ort': 'R1', 'link': 'https://www.ricardo.ch/de/a/neu-x-1300000010/', 'artikel': '1300000010', 'kopieren': 'https://www.ricardo.ch/de/list/?prefill=1300000010'}],
            'ohneMail': [{'id': 'PG-011', 'name': 'Schläger', 'link': 'https://www.ricardo.ch/de/a/neu-y-1300000011/', 'ende': '18.10.2026'}], 'regale': {}}
SCHICHT3 = {'art': 'schicht3', 'links': LINKS, 'versand': [dict(OFFEN[0], status='Bereit zum Versand', sendung='99.60.123456.12345678')], 'warten': [dict(OFFEN[1], status='Wartet auf Zahlung', nr='50000009'), dict(OFFEN[1], status='Wartet auf Zahlung', nr='50000010'), dict(OFFEN[1], status='Wartet auf Zahlung', nr='50000011')], 'regale': {}}
SCHICHT1 = {'art': 'schicht1', 'links': LINKS, 'bereit': [{'id': 'PG-010', 'status': 'Bereit', 'name': 'Bügeleisen', 'ort': 'R1', 'regal': 'Ricardo Offline', 'wieder': True}], 'analyse': 4, 'aktiv': 30, 'schwelle': 90, 'laufzeit': 6, 'regale': {}}
DATEN = {'startDaten': {'version': 't', 'admin': False, 'zustaende': [], 'maengelPflicht': [], 'laufzeit': 6, 'retoureGruende': [], 'kiAktiv': True, 'mailAktiv': True, 'aktiv': 30, 'schwelle': 90},
         'analyseListe': [], 'uebersicht': {'letzterImport': '', 'liste': [], 'aktiv': 30, 'schwelle': 90, 'laufzeit': 6}, 'verkaeufe': {'offen': OFFEN}, 'retouren': {'offen': [], 'abgeschlossen': 0, 'auszahlungen': 0}, 'mailsJetzt': AU, 'aufgaben': AU,
         'ablauf:taeglich': TAEGLICH, 'ablauf:schicht1': SCHICHT1, 'ablauf:schicht2': SCHICHT2, 'ablauf:schicht3': SCHICHT3, 'bankAbgleich': BANK, 'bankBestaetigen': TAEGLICH,
         'entscheidUnverkauft': dict(SCHICHT2, unverkauft=[]), 'setzeVerkauf': {'offen': OFFEN}, 'etikette': {'nr': '50000002', 'sendung': '99.60.1.2', 'pdf': 'JVBERi0xLjQK', 'name': 'Etikette 50000002.pdf', 'warnungen': '', 'produkt': 'ECO'}}
stub = """<script>window.AUFRUFE=[];window.OFFEN=[];window.open=function(u){OFFEN.push(u)};window.google={script:{run:(function mk(ok,fail){return new Proxy({},{get:function(_,k){
 if(k==='withSuccessHandler')return function(f){return mk(f,fail)}; if(k==='withFailureHandler')return function(f){return mk(ok,f)};
 return function(l,name,args){AUFRUFE.push([name,args]);var D=%s;var key=name==='ablauf'?'ablauf:'+args[0]:name;setTimeout(function(){ok&&ok(JSON.parse(JSON.stringify(D[key]||{})))},5)}}})})()}};</script>""" % json.dumps(DATEN)
html = html.replace('<head>', '<head>' + stub, 1)
fehler = 0
def ok(b, m):
    global fehler
    print('ok' if b else 'FEHLER', m); fehler += 0 if b else 1
csv = tempfile.NamedTemporaryFile('w', suffix='.csv', delete=False, encoding='utf-8')
csv.write('Buchungsdatum;Valutadatum;Auftragsnummer;Konto;IBAN;Buchungstext;Gutschrift;Belastung;Saldo\n17.10.2026;17.10.2026;A2;1;CH00;"GUTSCHRIFT; 1300000002";91.00;;1000\n17.10.2026;17.10.2026;A9;1;CH00;Miete;;1500.00;0\n17.10.2026;17.10.2026;A4;1;CH00;TESTA PROBE;25.00;;25\n'); csv.close()
with sync_playwright() as p:
    b = p.chromium.launch(); s = b.new_page(viewport={'width': 1300, 'height': 1600}); err = []
    s.on('pageerror', lambda e: err.append(str(e)))
    s.set_content(html); s.wait_for_timeout(300)
    ok(s.text_content('#z-f-taeglich') == '3', 'Zähler Täglich beim Start (1 melden + 1 Aufgabe + 1 Storno)')
    ok(s.is_visible('#s-ablauf') and s.text_content('#f-titel') == 'Täglich', 'Start im Ablauf Täglich')
    s.click('#nav-f-taeglich'); s.wait_for_timeout(200)
    t = s.text_content('#f-schritte')
    ok(s.is_visible('#s-ablauf') and 'Bank-Export hochladen' in t and 'Zahlung bei Ricardo melden' in t and 'Storno prüfen' in t and 'Retouren' in t, 'Täglich: alle Schritte')
    ok(s.locator('#f-schritte .karte.schritt').count() == 7, 'Täglich: 7 Schritte')
    ok(s.locator('#f-schritte #rt-offen-karte').count() == 1, 'Retouren im Ablauf Täglich eingebaut')
    ok('Neu: Soundkarte' in t and 'bezahlt 17.10.2026' in t, 'Melden-Liste')
    ok('Vorschlag CHF 75.00' in t, 'Preisvorschlag im Ablauf')
    ok(s.locator('.ricardo-zeile').count() >= 5, 'Zeilen «Auf Ricardo»')
    s.set_input_files('#f-bank', csv.name); s.click('#f-schritte button:has-text("Einlesen")'); s.wait_for_timeout(400)
    call = [a for a in s.evaluate('AUFRUFE') if a[0] == 'bankAbgleich']
    ok(call and len(call[0][1][0]) == 2 and call[0][1][0][0] == {'datum': '2026-10-17', 'text': 'GUTSCHRIFT; 1300000002', 'betrag': 91, 'auftrag': 'A2'}, 'CSV: nur Gutschriften, Datum und Betrag gelesen')
    t = s.text_content('#f-bank-erg')
    ok('Sicher zugeordnet' in t and 'Bitte prüfen' in t, 'Bank-Vorschläge')
    ok(s.is_checked('.bank-wahl[data-i="0"]') and not s.is_checked('.bank-wahl[data-i="1"]'), 'Sicher angehakt, unsicher nicht')
    s.click('#f-schritte button:text-is("Angehakte als bezahlt erfassen")'); s.wait_for_timeout(200)
    call = [a for a in s.evaluate('AUFRUFE') if a[0] == 'bankBestaetigen']
    ok(call and call[0][1][0] == [{'nr': '50000002', 'bank': BANK['sicher'][0]['bank']}], 'Nur Angehakte bestätigt')
    s.click('#f-schritte button:text-is("Gemeldet")'); s.wait_for_timeout(200)
    ok(['setzeVerkauf', ['50000001', 'ricardoBezahlt']] in s.evaluate('AUFRUFE'), 'Gemeldet ruft ricardoBezahlt')
    s.click('.erledigt-haken input >> nth=0'); s.wait_for_timeout(100)
    ok(s.locator('.karte.schritt.fertig').count() == 1 and s.locator('#f-fortschritt span.an').count() == 1, 'Haken Schritt erledigt')
    if len(sys.argv) > 1: s.screenshot(path=sys.argv[1] + '-taeglich.png', full_page=True)
    s.click('#nav-f-schicht1'); s.wait_for_timeout(200)
    t = s.text_content('#f-schritte')
    ok('4 aus der Analyse, 1 angefangen' in t and 'wieder listen' in t and s.is_visible('#q') and s.locator('#f-schritte #such-karte').count() == 1 and s.locator('#f-schritte #u-karte').count() == 1, 'Listing mit Suche und laufenden Angeboten eingebaut')
    ok(s.text_content('#f-titel') == 'Listing', 'Name Listing')
    s.click('#nav-f-schicht2'); s.wait_for_timeout(200)
    t = s.text_content('#f-schritte')
    ok('Verkaufsbericht einlesen' in t and 'Bügeleisen' in t and 'Schläger' in t and 'Neu: Kamera' in t and 'Adresse fehlt' in t, 'Schicht 2 Inhalte')
    ok(s.locator('#et-50000003 button', has_text='Etikette').count() == 0 and s.locator('#et-50000002 button', has_text='Etikette drucken').count() == 1, 'Etikette nur mit Adresse')
    s.click('#et-50000002 >> text=Etikette drucken'); s.wait_for_timeout(200)
    ok(['etikette', ['50000002']] in s.evaluate('AUFRUFE') and any(u.startswith('blob:') for u in s.evaluate('OFFEN')), 'Etikette geholt und geöffnet')
    s.click('#f-schritte button:text-is("Neu listen")'); s.wait_for_timeout(200)
    ok(['entscheidUnverkauft', ['PG-010', 'Neu listen']] in s.evaluate('AUFRUFE') and 'Bügeleisen' not in s.text_content('#f-schritte'), 'Entscheid unverkauft')
    if len(sys.argv) > 1: s.screenshot(path=sys.argv[1] + '-schicht2.png', full_page=True)
    s.click('#nav-f-schicht3'); s.wait_for_timeout(200)
    t = s.text_content('#f-schritte')
    ok('Sendung 99.60.123456.12345678' in t and 'Nicht bezahlt: 3 Pakete' in t, 'Schicht 3')
    s.click('#f-schritte button:text-is("Versendet")'); s.click('#dialog-ja'); s.wait_for_timeout(200)
    ok(['setzeVerkauf', ['50000002', 'versendet']] in s.evaluate('AUFRUFE'), 'Versendet')
    s.click('#f-schritte button:text-is("Zahlung erhalten") >> nth=0'); s.click('#dialog-ja'); s.wait_for_timeout(200)
    ok(['setzeVerkauf', ['50000009', 'bezahlt']] in s.evaluate('AUFRUFE'), 'Zahlung von Hand im Ablauf Versenden')
    ok(s.is_hidden('#nav-aufgaben') and s.is_hidden('#nav-verkauf') and s.is_hidden('#nav-listen'), 'Alte Reiter ausgeblendet')
    s.click('#l-en'); s.wait_for_timeout(200)
    ok('Shipping' in s.text_content('#f-titel'), 'Englisch')
    if len(sys.argv) > 1: s.screenshot(path=sys.argv[1] + '-schicht3.png', full_page=True)
    ok(not err, 'keine JS-Fehler ' + str(err))
    b.close()
sys.exit(1 if fehler else 0)
