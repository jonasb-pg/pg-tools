import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))  # Pfade relativ zu tests/
"""Ricardo Tool: Abläufe Täglich, Listing, Packen, Versenden als geführte Fälle (19.9) mit Stub. Erfundene Daten. Lauf: python3 tests/t_ricardo_ablauf_ui.py [bild-prefix]"""
import json, pathlib, sys, tempfile
from playwright.sync_api import sync_playwright
html = (pathlib.Path(__file__).parent.parent / 'apps/ricardo/Index.html').read_text().replace('<?!= JSON.stringify(lang) ?>', '"de"')
LINKS = {'listen': 'https://www.ricardo.ch/de/list/', 'verkauft': 'https://www.ricardo.ch/de/my-ricardo/selling/orders/', 'amVerkaufen': 'https://www.ricardo.ch/de/my-ricardo/selling/offers/', 'artikel': 'https://www.ricardo.ch/de/a/'}
AU = {'anzahl': 1, 'verpasst': 0, 'kontrolle': {'aktiv': True, 'letzte': '19.10. 12:00', 'warnung': False, 'unecht': 0},
      'angebote': [{'id': 'm1', 'art': 'Preisvorschlag', 'eingang': '19.10. 10:00', 'alter': 2, 'titel': 'Neu: Föhn Z', 'pgId': 'PG-2002', 'artikel': '1300000009', 'betrag': '75.00', 'preis': '87.00', 'frist': '20.10. 10:00', 'restStunden': 20, 'empfehlung': 'Annehmen', 'link': 'https://www.ricardo.ch/de/a/1300000009'}],
      'fragen': [], 'zahlung': [], 'bewertungen': [{'id': 'm9', 'art': 'Bewertung', 'titel': 'Bewerte kaeufer_x', 'von': 'kaeufer_x', 'entwurf': 'Vielen Dank für den reibungslosen Kauf.', 'link': 'https://www.ricardo.ch/de/my-ricardo/selling/order/50000001/'}]}
V = lambda nr, titel, **k: dict({'nr': nr, 'pgId': 'PG-' + nr[-3:], 'titel': titel, 'kaeufer': 'nick' + nr[-2:], 'name': 'Testa Muster', 'total': '58.00', 'am': '16.10.2026', 'tage': 3, 'bezahlt': '', 'link': 'https://www.ricardo.ch/de/my-ricardo/selling/order/' + nr + '/'}, **k)
TAEGLICH = {'art': 'taeglich', 'links': LINKS, 'aufgaben': AU, 'melden': [V('50000001', 'Neu: Soundkarte', bezahlt='17.10.2026')],
            'offen': [V('50000008', 'Neu: Uhr')], 'storno': [V('50000007', 'Neu: Lampe', tage=15, storno='https://www.ricardo.ch/de/my-ricardo/selling/order/cancelation/50000007/')], 'stornoTage': 14, 'retouren': 2, 'letzteBank': ''}
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
SCHICHT1 = {'art': 'schicht1', 'links': LINKS, 'bereit': [{'id': 'PG-010', 'status': 'Bereit', 'name': 'Bügeleisen', 'ort': 'R1', 'regal': 'Ricardo Offline', 'wieder': True}], 'analyse': 1, 'aktiv': 30, 'schwelle': 90, 'laufzeit': 6, 'regale': {},
            'entscheide': ['Neu listen', 'Anderer Kanal', 'Entsorgung'], 'unverkauft': [{'id': 'PG-012', 'status': 'Unverkauft', 'name': 'Lampe', 'ort': 'R2', 'link': 'https://www.ricardo.ch/de/a/neu-x-1300000012/', 'artikel': '1300000012', 'kopieren': ''}],
            'ohneMail': [{'id': 'PG-011', 'name': 'Schläger', 'ort': 'R3', 'link': 'https://www.ricardo.ch/de/a/neu-y-1300000011/', 'ende': '18.10.2026'}]}
R = {'id': 'PG-100', 'status': 'In Arbeit', 'ean': '076', 'bezeichnung': 'Toaster X', 'neupreis': 80, 'startpreis': '40.00', 'lagerort': 'H3', 'zustand': 'Gebraucht', 'maengel': '',
     'frei': False, 'gewicht': 2, 'sperrgut': False, 'klasse': 'PostPac B-Post bis 2 kg', 'versand': '9.00', 'titel': 'Toaster X 2 Schlitze', 'beschrieb': 'Zustand: Gebraucht.',
     'link': '', 'produktlink': '', 'fehlt': [], 'versandForm': 'Paket, bis 2kg, Economy', 'getestet': True, 'buendelIds': [], 'buendelInhalt': [], 'masse': [],
     'englisch': '', 'englischAlt': False, 'quelle': 'Analyse', 'analyse': True, 'analyseNr': 'A-0001', 'fotoOrdner': '', 'geaendert': '', 'regal': 'Ricardo Offline'}
ANA = [{'id': 'PG-100', 'name': 'Toaster X', 'titel': 'Toaster X 2 Schlitze', 'zustand': 'Gebraucht', 'preis': 40, 'fotos': 5, 'ordner': '', 'kuerzel': 'JB', 'erfasst': '14.10.2026'},
       {'id': 'PG-010', 'name': 'Bügeleisen', 'titel': 'Bügeleisen', 'zustand': 'Gebraucht', 'preis': 20, 'fotos': 3, 'ordner': '', 'kuerzel': 'JB', 'erfasst': '14.10.2026'}]
DATEN = {'startDaten': {'version': 't', 'admin': False, 'zustaende': ['Neu und originalverpackt', 'Gebraucht'], 'maengelPflicht': ['Gebraucht'], 'laufzeit': 6, 'retoureGruende': [], 'kiAktiv': True, 'mailAktiv': True, 'aktiv': 30, 'schwelle': 90},
         'analyseListe': ANA, 'starteListing': R, 'lade': dict(R, id='PG-010', bezeichnung='Bügeleisen', analyse=False), 'speichereDetails': R, 'markiereGelistet': {'id': 'PG-100'},
         'adressePruefen': {'stand': 'vorschlag', 'quality': 'USABLE', 'adresse': {'strasse': 'Testweg', 'nr': '1', 'postfach': '', 'plz': '3000', 'ort': 'Bern'}, 'vorschlag': {'strasse': 'Testweg', 'nr': '1', 'postfach': '', 'plz': '3005', 'ort': 'Bern'}},
         'adresseUebernehmen': {'stand': 'ok', 'adresse': {'strasse': 'Testweg', 'nr': '1', 'postfach': '', 'plz': '3005', 'ort': 'Bern'}},
         'aufgabeErledigt': AU, 'listingVerwerfen': True, 'verkaufStornieren': TAEGLICH, 'setzeStatus': {}, 'uebersicht': {'letzterImport': '', 'liste': [], 'aktiv': 30, 'schwelle': 90, 'laufzeit': 6}, 'verkaeufe': {'offen': OFFEN}, 'retouren': {'offen': [], 'abgeschlossen': 0, 'auszahlungen': 0}, 'mailsJetzt': AU, 'aufgaben': AU,
         'zaehler': {'offen': 3, 'zuPacken': 2, 'versand': 1, 'retouren': 4}, 'ablauf:taeglich': TAEGLICH, 'ablauf:schicht1': SCHICHT1, 'ablauf:schicht2': SCHICHT2, 'ablauf:schicht3': SCHICHT3, 'bankAbgleich': BANK, 'bankBestaetigen': TAEGLICH,
         'entscheidUnverkauft': dict(SCHICHT1, unverkauft=[]), 'setzeVerkauf': {'offen': OFFEN}, 'etikette': {'nr': '50000002', 'sendung': '99.60.1.2', 'pdf': 'JVBERi0xLjQK', 'name': 'Etikette 50000002.pdf', 'warnungen': '', 'produkt': 'ECO'}}
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
    b = p.chromium.launch(); s = b.new_page(viewport={'width': 1300, 'height': 1400}); err = []
    s.on('pageerror', lambda e: err.append(str(e)))
    s.set_content(html); s.wait_for_timeout(400)
    nav = s.inner_text('.nav')
    ok(all(x in nav.upper() for x in ['TÄGLICH', 'LISTING', 'PACKEN', 'VERSENDEN', 'RETOUREN', 'LAUFENDE ANGEBOTE']) and s.is_hidden('#nav-aufgaben') and s.is_hidden('#nav-verkauf') and s.is_hidden('#nav-listen'), 'Navigation: 4 Abläufe, Verwaltung')
    A = lambda: s.evaluate('AUFRUFE')
    # ---------- Tempo 19.10.2026: Start mit wenigen Aufrufen ----------
    namen = [x[0] for x in A()]
    arten = [x[1][0] for x in A() if x[0] == 'ablauf']
    ok(arten == ['taeglich', 'schicht1', 'schicht2', 'schicht3'] and namen.count('zaehler') == 1 and 'verkaeufe' not in namen and 'retouren' not in namen, 'Start: Täglich, die anderen Abläufe einmal vorgeladen, ein zaehler, kein verkaeufe/retouren ' + str(namen))
    ok(s.text_content('#z-f-schicht2') == '2' and s.text_content('#z-f-schicht3') == '1' and s.text_content('#z-retour') == '4', 'Marken aus zaehler')
    ok(s.text_content('#z-f-taeglich').strip() != '', 'Marke Täglich aus dem Ablauf selbst')
    # ---------- Täglich: Liste der Fälle ----------
    t = s.text_content('#f-schritte')
    ok('4 offen' in t and 'Neu: Soundkarte' in t and 'Neu: Föhn Z' in t and 'Bewerte kaeufer_x' in t and 'Neu: Lampe' in t, 'Täglich: Liste mit 4 Fällen')
    ok(s.locator('#f-schritte .f-tun').count() == 0, 'In der Liste keine festen Ricardo-/Physisch-Kästen')
    s.set_input_files('#f-bank', csv.name); s.click('#f-schritte button:has-text("Einlesen")'); s.wait_for_timeout(400)
    call = [a for a in A() if a[0] == 'bankAbgleich']
    ok(call and len(call[0][1][0]) == 2 and call[0][1][0][0] == {'datum': '2026-10-17', 'text': 'GUTSCHRIFT; 1300000002', 'betrag': 91, 'auftrag': 'A2'}, 'Bank-Export nur wenn Zahlungen offen, nur Gutschriften')
    ok(s.is_checked('.bank-wahl[data-i="0"]') and not s.is_checked('.bank-wahl[data-i="1"]'), 'Sicher angehakt, unsicher nicht')
    s.click('#f-schritte button:text-is("Angehakte als bezahlt erfassen")'); s.wait_for_timeout(200)
    ok([a for a in A() if a[0] == 'bankBestaetigen'][0][1][0] == [{'nr': '50000002', 'bank': BANK['sicher'][0]['bank']}], 'Nur Angehakte bestätigt')
    s.click('#f-schritte .f-eintrag >> nth=0 >> button'); s.wait_for_timeout(200)
    ok(s.locator('#f-schritte .f-tun.rosa').count() == 1 and 'Zahlung erhalten' in s.text_content('.f-tun.rosa') and s.locator('#f-schritte .karte').count() == 1, 'Fall Zahlung melden: ein Bildschirm, Ricardo-Aktion beim Knopf')
    s.click('.f-tun.rosa button'); s.wait_for_timeout(100)
    ok(any('/selling/order/50000001/' in u for u in s.evaluate('OFFEN')), 'Knopf öffnet genau diesen Verkauf')
    s.click('#f-aktion'); s.wait_for_timeout(200)
    ok(['setzeVerkauf', ['50000001', 'ricardoBezahlt']] in A() and 'Erledigt' in s.text_content('#f-schritte') and 'Weiter mit:' in s.text_content('#f-schritte'), 'Gemeldet, danach «Weiter mit»')
    s.click('#f-schritte button:has-text("Weiter mit")'); s.wait_for_timeout(200)
    ok('Preisvorschlag beantworten' in s.text_content('.f-tun.rosa') and 'Annehmen' in s.text_content('.f-tun.rosa'), 'Nächster Fall: Preisvorschlag mit Empfehlung beim Knopf')
    s.click('#f-aktion'); s.wait_for_timeout(200)
    ok(['aufgabeErledigt', ['m1']] in A(), 'Preisvorschlag erledigt')
    s.click('#f-schritte button:has-text("Zur Liste")'); s.wait_for_timeout(200)
    s.click('#f-schritte .f-eintrag:has-text("Neu: Lampe") button'); s.wait_for_timeout(200)
    ok('Storno öffnen' in s.text_content('.f-tun.rosa') and s.is_visible('#f-neben'), 'Storno: Ricardo-Link und «Ist bezahlt»')
    if len(sys.argv) > 1: s.screenshot(path=sys.argv[1] + '-taeglich.png', full_page=True)
    # ---------- Listing ----------
    s.click('#nav-f-schicht1'); s.wait_for_timeout(400)
    t = s.text_content('#f-schritte')
    zeilen = s.locator('#f-schritte .f-eintrag').all_inner_texts()
    ok(len(zeilen) == 4 and 'Bügeleisen' in zeilen[0] and 'Toaster X' in zeilen[1] and 'Schläger' in t and 'Lampe' in t, 'Listing: eine Liste, angefangene zuoberst, Analyse ohne Doppel, abgelaufene und unverkaufte')
    ok('angefangen' not in t.lower() and 'In Arbeit' not in t, 'Kein Sonderstatus «angefangen» / «In Arbeit»')
    ok(s.locator('#f-schritte #such-karte').count() == 1 and s.evaluate("document.querySelector('#f-schritte > *').contains(document.getElementById('such-karte'))"), 'Suchfeld zuoberst, Liste darunter')
    ok('Anderes Stück' not in t and s.evaluate("document.activeElement.id") == 'q', 'Keine Überschrift «Anderes Stück», Fokus im Suchfeld')
    s.click('#f-schritte .f-eintrag:has-text("Toaster X") button'); s.wait_for_timeout(300)
    ok(['starteListing', ['PG-100']] in A() and s.locator('#f-schritte #ls-1').count() == 1 and s.locator('#f-schritte #ls-2').count() == 0, 'Stück geladen, Schritt Prüfen allein')
    ok('Stück holen: H3' in s.text_content('.f-tun') and s.is_hidden('#ls-1 .nur-alt'), 'Physisch beim Schritt, kein doppelter Speichern-Knopf')
    s.click('#f-aktion'); s.wait_for_timeout(300)
    ok(s.locator('#f-schritte #ls-2').count() == 1 and s.locator('#f-schritte #ls-1').count() == 0, 'Weiter: Titel und Text')
    s.click('#f-aktion'); s.wait_for_timeout(300)
    ok(s.locator('#f-schritte #ls-3').count() == 1 and s.is_visible('#felder') and 'Neues Angebot erstellen' in s.text_content('.f-tun.rosa'), 'Auf Ricardo erfassen: Felder und Ricardo-Knopf')
    ok(s.locator('#kontrolle').count() == 0, 'keine Kontrollliste zum Abhaken (21.10.2026)')
    s.fill('#r-link', 'https://www.ricardo.ch/de/a/toaster-1300000100/'); s.click('#f-aktion'); s.wait_for_timeout(300)
    ok([a for a in A() if a[0] == 'markiereGelistet'] and 'Ricardo Online' in s.text_content('.f-tun'), 'Gelistet, dann Regal')
    s.click('#f-aktion'); s.wait_for_timeout(300)
    ok('Erledigt' in s.text_content('#f-schritte'), 'Listing fertig')
    s.click('#f-schritte button:has-text("Zur Liste")'); s.wait_for_timeout(300)
    s.click('#f-schritte .f-eintrag:has-text("Lampe") button'); s.wait_for_timeout(200)
    ok(s.locator('.f-wahl button').count() == 3 and 'Stück holen: R2' in s.text_content('#f-schritte'), 'Nicht verkauft: Entscheid mit 3 Knöpfen')
    s.click('.f-wahl button:text-is("Entsorgung")'); s.wait_for_timeout(300)
    ok(['entscheidUnverkauft', ['PG-012', 'Entsorgung']] in A() and 'zur Entsorgung' in s.text_content('.f-tun'), 'Entsorgung: physischer Schritt')
    if len(sys.argv) > 1: s.screenshot(path=sys.argv[1] + '-listing.png', full_page=True)
    s.click('#f-leiste button:has-text("Zur Liste")'); s.wait_for_timeout(300)
    s.click('#f-schritte .f-eintrag:has-text("Toaster X") button'); s.wait_for_timeout(300)
    s.click('#f-leiste button:has-text("Zur Liste")'); s.wait_for_timeout(300)
    ok(not [x for x in A() if x[0] in ('listingVerwerfen', 'setzeStatus')], 'Listing verlassen ohne «Gelistet»: bleibt offen, nichts verworfen (21.10.2026)')
    # ---------- Packen ----------
    s.click('#nav-f-schicht2'); s.wait_for_timeout(300)
    t = s.text_content('#f-schritte')
    ok('Adressen fehlen' in t and '2 offen' in t and 'Bügeleisen' not in t, 'Packen: Bericht nur weil eine Adresse fehlt, kein «Nicht verkauft» mehr')
    s.click('#f-schritte .f-eintrag:has-text("Neu: Kamera") button'); s.wait_for_timeout(200)
    ok('Stück holen' in s.text_content('.f-tun'), 'Holen')
    s.click('#f-aktion'); s.wait_for_timeout(300)
    ok(not [x for x in A() if x[0] == 'adressePruefen'] and 'Testa Beispiel' in s.text_content('#f-schritte'), 'Keine Adressprüfung bei der Post, Adresse angezeigt')
    s.click('#f-schritte button:text-is("Etikette drucken")'); s.wait_for_timeout(200)
    ok(['etikette', ['50000002']] in A() and any(u.startswith('blob:') for u in s.evaluate('OFFEN')) and 'Nochmals drucken' in s.text_content('#f-schritte'), 'Etikette gedruckt')
    s.click('#f-aktion'); s.wait_for_timeout(200)
    ok('Matchmaker' in s.text_content('.f-tun'), 'Packen-Schritt')
    s.click('#f-aktion'); s.wait_for_timeout(200)
    ok(['setzeVerkauf', ['50000002', 'gepackt']] in A(), 'Gepackt')
    if len(sys.argv) > 1: s.screenshot(path=sys.argv[1] + '-packen.png', full_page=True)
    # ---------- Versenden ----------
    s.click('#nav-f-schicht3'); s.wait_for_timeout(300)
    ok('3 Pakete warten' in s.text_content('#f-schritte'), 'Versenden: Liste mit Hinweis auf wartende')
    s.click('#f-schritte .f-eintrag >> nth=0 >> button'); s.wait_for_timeout(200)
    ok('Postwagen' in s.text_content('.f-tun'), 'Postwagen')
    s.click('#f-aktion'); s.wait_for_timeout(200)
    ok('99.60.123456.12345678' in s.text_content('.f-tun.rosa') and 'Versand bestätigen' in s.text_content('.f-tun.rosa'), 'Versand bestätigen mit Nummer')
    s.click('.f-tun.rosa button'); s.wait_for_timeout(100)
    s.click('#f-aktion'); s.wait_for_timeout(200)
    ok(['setzeVerkauf', ['50000002', 'versendet']] in A(), 'Versendet')
    if len(sys.argv) > 1: s.screenshot(path=sys.argv[1] + '-versenden.png', full_page=True)
    s.click('#l-en'); s.wait_for_timeout(200)
    ok('Shipping' in s.text_content('.nav'), 'Englisch')
    ok(not err, 'keine JS-Fehler ' + str(err))
    b.close()
sys.exit(1 if fehler else 0)
