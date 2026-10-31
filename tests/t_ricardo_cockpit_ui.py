import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))  # Pfade relativ zu tests/
"""Ricardo Tool Umbau (Cockpit, 30.10.2026): Stufen-Chips, Liste, Panel mit Handlungen, Zubringer. Schein-Server, erfundene Daten.
Lauf: python3 tests/t_ricardo_cockpit_ui.py"""
import json, pathlib
from playwright.sync_api import sync_playwright
html = (pathlib.Path(__file__).parent.parent / 'apps/ricardo-test/Index.html').read_text().replace('<?!= JSON.stringify(lang) ?>', '"de"')
AUFGABEN = {'anzahl': 3, 'kontrolle': {'aktiv': True, 'letzte': '30.10.2026 08:38', 'warnung': False, 'unecht': 0},
            'angebote': [{'id': 'm1', 'pgId': 'PG-300', 'artikel': '1299001', 'titel': 'Pfanne 28 cm', 'betrag': '18.00', 'preis': '25.00', 'frist': '31.10. 20:00', 'restStunden': 20, 'empfehlung': 'Ablehnen', 'alter': 2, 'link': 'https://www.ricardo.ch/de/a/1299001/'}],
            'fragen': [{'id': 'm2', 'pgId': 'PG-300', 'artikel': '1299001', 'titel': 'Garmin Rally', 'art': 'Frage', 'text': 'Induktion?', 'entwurf': 'Ja, geeignet.', 'von': 'mhuber', 'alter': 1, 'link': 'https://www.ricardo.ch/de/a/1299002/'}, {'id': 'm5', 'pgId': 'PG-401', 'artikel': '', 'nr': '54000001', 'titel': 'X', 'art': 'Nachricht', 'text': 'Hallo', 'entwurf': '', 'von': 'kaeufer1', 'alter': 2, 'link': 'https://www.ricardo.ch/de/a/1299005/'}],
            'zahlung': [{'nr': '54000002', 'pgId': 'PG-402', 'titel': 'Toner', 'kaeufer': 'L. Fischer', 'total': '23.80', 'tage': 8, 'meldet': '', 'entwurf': 'Bitte zahlen.', 'link': 'https://www.ricardo.ch/de/my-ricardo/selling/order/54000002/'}],
            'bewertungen': [{'id': 'm3', 'pgId': 'PG-401', 'artikel': '', 'nr': '54000001', 'titel': 'X', 'art': 'Bewertung', 'entwurf': 'Danke!', 'von': 'kaeufer1', 'link': 'https://www.ricardo.ch/de/a/1299003/'}, {'id': 'm4', 'pgId': 'PG-405', 'artikel': '', 'nr': '54000005', 'titel': 'Y', 'art': 'Bewertung', 'entwurf': 'Danke!', 'von': 'kaeufer2', 'link': 'https://www.ricardo.ch/de/a/1299004/'}]}
V = lambda nr, pg, titel, status, **k: dict({'nr': nr, 'pgId': pg, 'titel': titel, 'am': '29.10.2026', 'total': '100.00', 'preis': '90.00', 'status': status, 'name': 'M. Keller', 'kaeufer': 'mkeller', 'ort': '8002 Zürich',
    'lagerort': 'Ricardo Online', 'rtOrt': '', 'klasse': 'bis 2 kg', 'meldet': '', 'bezahlt': '', 'ricardoGemeldet': '', 'sendung': '', 'artikel': '1288' + nr[-3:], 'link': 'https://www.ricardo.ch/de/my-ricardo/selling/order/' + nr + '/', 'ohneAdresse': False}, **k)
COCKPIT = {
    'bereit': [{'id': 'PG-200', 'status': 'Bereit', 'name': 'Hue Bridge', 'ort': 'Ricardo Offline', 'regal': 'Ricardo Offline', 'wieder': True, 'link': 'https://www.ricardo.ch/de/a/hue-1299009/', 'kopieren': 'https://www.ricardo.ch/de/list/?prefill=1299009'}],
    'auktionsende': {'text': 'Do 05.11.2026 19:00', 'tage': 6},
    'analyse': [{'id': 'PG-100', 'name': 'Toaster X', 'titel': 'Toaster X 2 Schlitze', 'zustand': 'Gebraucht', 'preis': 40, 'fotos': 5, 'ordner': 'https://drive.google.com/x', 'erfasst': '30.10.2026', 'mm': False}],
    'online': [{'id': 'PG-300', 'status': 'Gelistet', 'name': 'Pfanne 28 cm', 'ort': 'Ricardo Online', 'regal': 'Ricardo Online', 'link': 'https://www.ricardo.ch/de/a/1299001/', 'buendel': '', 'seit': '25.10.2026', 'gebot': {'keins': True}, 'laufzeit': 6, 'abgelaufen': False},
               {'id': 'PG-302', 'status': 'Gelistet', 'name': 'Hang it all', 'ort': 'Ricardo Online', 'regal': 'Ricardo Online', 'link': 'https://www.ricardo.ch/de/a/1299003/', 'buendel': '', 'seit': '20.10.2026', 'gebot': None, 'laufzeit': 6, 'abgelaufen': True}],
    'verkauft': [V('54000001', 'PG-401', 'Autoradio', 'Zu packen', ohneAdresse=True, name='', ort=''), V('54000002', 'PG-402', 'Toner', 'Wartet auf Zahlung', total='23.80'),
                 V('54000003', 'PG-403', 'Lego', 'Zu packen', bezahlt='30.10.2026'), V('54000004', 'PG-404', 'Garmin', 'Bereit zum Versand', bezahlt='30.10.2026', ricardoGemeldet='30.10.2026', sendung='99.00.1')],
    'versendet': [V('54000005', 'PG-405', 'Dyson', 'Bezahlt und versendet', versendetAm='27.10.2026', sendung='99.00.2')],
    'nichtverkauft': [{'id': 'PG-500', 'status': 'Unverkauft', 'name': 'Krups Mixer', 'ort': 'Ricardo Online', 'link': 'https://www.ricardo.ch/de/a/1299500/', 'artikel': '1299500', 'kopieren': 'https://www.ricardo.ch/de/list/?prefill=1299500'}],
    'ohneMail': [{'id': 'PG-302', 'name': 'Hang it all', 'ort': 'Ricardo Online', 'link': 'https://www.ricardo.ch/de/a/1299003/', 'ende': '26.10.2026'}],
    'storniert': [{'id': 'PG-600', 'status': 'Storniert', 'name': 'Gewindeschneider', 'ort': 'Ricardo Unpaid', 'link': '', 'artikel': '', 'kopieren': ''}],
    'retouren': [{'nr': 'RT-0012', 'verkauf': '54211090', 'pgId': 'PG-700', 'titel': 'Akkuschrauber', 'kaeufer': 'dmeier', 'name': 'D. Meier', 'eroeffnet': '29.10.2026', 'grund': 'Defekt', 'notiz': '', 'iban': 'CH12 3456', 'betrag': '98.00',
                  'rueckzahlung': '', 'rueckzahlungAm': '', 'stornoLink': 'https://www.ricardo.ch/de/my-ricardo/selling/order/cancelation/54211090/', 'ricardo': '', 'ricardoFrist': '28.12.2026', 'ricardoTage': 59, 'entscheid': ''}],
    'retourenAbgeschlossen': 3, 'retoureGruende': ['Defekt', 'Transportschaden', 'Falscher Artikel'],
    'aufgaben': AUFGABEN, 'melden': [{'nr': '54000003', 'pgId': 'PG-403', 'titel': 'Lego', 'total': '100.00', 'name': 'M. Keller', 'link': 'https://www.ricardo.ch/de/my-ricardo/selling/order/54000003/'}],
    'storno': [{'nr': '54000002', 'pgId': 'PG-402', 'titel': 'Toner', 'tage': 15, 'status': 'Wartet auf Zahlung', 'storno': 'https://www.ricardo.ch/de/my-ricardo/selling/order/cancelation/54000002/', 'total': '23.80', 'name': 'L. Fischer'}],
    'offenZahlung': [{'nr': '54000001', 'tage': 1}, {'nr': '54000002', 'tage': 15}], 'doppelt': [], 'stornoTage': 14, 'letzteBank': '30.10.2026 08:37',
    'letzterImport': '30.10.2026', 'unzugeordnet': [], 'aktiv': 111, 'schwelle': 150, 'laufzeit': 6,
    'links': {'listen': 'https://www.ricardo.ch/de/list/', 'verkauft': 'https://www.ricardo.ch/de/my-ricardo/selling/orders/', 'amVerkaufen': 'https://www.ricardo.ch/de/my-ricardo/selling/offers/', 'artikel': 'https://www.ricardo.ch/de/a/'},
    'regale': {'offline': 'Ricardo Offline', 'online': 'Ricardo Online', 'unpaid': 'Ricardo Unpaid'}, 'entscheide': ['Neu listen', 'Anderer Kanal', 'Entsorgung'], 'postBereit': False, 'test': True}
DATEN = {'startDaten': {'version': 't', 'admin': True, 'zustaende': ['Neu und originalverpackt', 'Gebraucht'], 'maengelPflicht': ['Gebraucht'], 'laufzeit': 6, 'retoureGruende': ['Defekt', 'Transportschaden', 'Falscher Artikel'], 'kiAktiv': False, 'mailAktiv': True, 'aktiv': 111, 'schwelle': 150, 'regale': COCKPIT['regale']},
         'cockpit': dict(COCKPIT, analyse=None), 'cockpitSuche': None, 'analyseListe': COCKPIT['analyse'], 'ablauf': {'art': 'schicht1', 'links': COCKPIT['links'], 'bereit': COCKPIT['bereit'], 'unverkauft': [], 'ohneMail': [], 'entscheide': COCKPIT['entscheide'], 'aktiv': 111, 'schwelle': 150, 'laufzeit': 6, 'regale': COCKPIT['regale']},
         'zaehler': {'zuPacken': 2, 'versand': 1, 'retouren': 1, 'offen': 4}, 'mailsJetzt': AUFGABEN, 'aufgaben': AUFGABEN,
         'setzeVerkauf': {'offen': []}, 'aufgabeErledigt': dict(AUFGABEN, anzahl=2, angebote=[]), 'erinnerungErledigt': dict(AUFGABEN, anzahl=2, zahlung=[]), 'setzeStatus': {}, 'entscheidUnverkauft': {'art': 'schicht1'}, 'markiereGelistet': {'id': 'PG-200', 'status': 'Gelistet'},
         'adresseVonHand': {'name': 'Praxis Am Bahnhof', 'ort': '3011 Bern', 'ohneAdresse': False, 'bezahlt': ''}, 'sendungSetzen': {'sendung': '99.00.9'}, 'verkaufStornieren': {},
         'retoureSchritt': {'offen': [], 'abgeschlossen': 4, 'entscheide': COCKPIT['entscheide'], 'auszahlungen': 0}, 'retoureEroeffnen': {'offen': [], 'abgeschlossen': 3, 'entscheide': [], 'auszahlungen': 1, 'mail': {'ok': True, 'an': 'buchhaltung@example.ch'}},
         'adminSuche': {'listings': [], 'verkaeufe': []}, 'cockpitSuche': {'listings': [{'id': 'PG-999', 'name': 'Altes Stück', 'status': 'Abgebrochen', 'am': '01.10.2026', 'zeile': 5, 'loeschbar': True}], 'verkaeufe': [V('54000002', 'PG-402', 'Toner', 'Wartet auf Zahlung', total='23.80', zeile=9)]},
         'lade': {'id': 'PG-200', 'status': 'Bereit', 'bezeichnung': 'Hue Bridge', 'startpreis': '19.00', 'fehlt': ['Titel erstellen'], 'buendelIds': [], 'buendelInhalt': [], 'masse': [], 'zustand': 'Gebraucht', 'maengel': '', 'getestet': False, 'titel': '', 'beschrieb': '', 'lagerort': 'Ricardo Offline', 'ean': '', 'neupreis': 59.9, 'regal': 'Ricardo Offline', 'analyse': False, 'englisch': '', 'englischAlt': False},
         'kennzahlen': {'zeitraum': {'verkaeufe': 0, 'angeboten': 0}, 'grades': [], 'verlauf': [], 'seit': '', 'einheit': 'tag'}, 'adminBetrieb': {'mail': {'aktiv': True, 'letzte': 'x'}, 'ausloeser': True, 'ki': False, 'url': '#'}, 'adminEinstellungen': [], 'feedbackListe': []}
stub = """<script>window.AUFRUFE=[];window.ARGS=[];window.google={script:{run:(function mk(ok,fail){return new Proxy({},{get:function(_,k){
 if(k==='withSuccessHandler')return function(f){return mk(f,fail)}; if(k==='withFailureHandler')return function(f){return mk(ok,f)};
 return function(l,name,args){AUFRUFE.push(name);ARGS.push([name,args]);var D=%s;
 setTimeout(function(){ok&&ok(JSON.parse(JSON.stringify(D[name]===undefined?{}:D[name])))},5)}}})})()}};</script>""" % json.dumps(DATEN)
html = html.replace('<head>', '<head>' + stub, 1)
fehler = 0
def ok(b, m):
    global fehler
    print('ok' if b else 'FEHLER', m); fehler += 0 if b else 1
with sync_playwright() as p:
    b = p.chromium.launch(); s = b.new_page(viewport={'width': 1440, 'height': 900}); err = []
    s.on('pageerror', lambda e: err.append(str(e)))
    s.set_content(html); s.wait_for_timeout(500)
    ok(s.is_visible('#s-cockpit') and s.is_hidden('#s-ablauf'), 'Start im Cockpit')
    chips = s.inner_text('#cp-chips').upper().replace('\n', ' ')
    ok(all(x in chips for x in ['BEREIT 2', 'ONLINE 1', 'VERKAUFT 2', 'BEZAHLT 2', 'VERSENDET 1', 'NICHT VERKAUFT 2', 'RETOUREN 1', 'STORNIERT 1']), 'Chips mit Zahlen: ' + chips)
    def L(): return s.inner_text('#cp-liste').upper()
    def zu(): s.keyboard.press('Escape'); s.wait_for_timeout(50)
    ok('TESTUMGEBUNG' in s.inner_text('#cp-warn'), 'Hinweis Testumgebung')
    ok(s.is_hidden('#cp-tun') and s.is_visible('#nav-todos'), 'Zu-tun-Zeile nicht im Cockpit, eigener Reiter To-dos')
    s.click('#nav-todos'); s.wait_for_timeout(100)
    tun = s.inner_text('#cp-tun').upper().replace('\n', ' ')
    ok(s.is_visible('#cp-tun') and s.is_hidden('#cp-chips') and 'an' in s.get_attribute('#nav-todos', 'class'), 'To-dos: Filterzeile statt Stufen')
    ok(all(x in tun for x in ['ALLE ', 'FRAGEN 1', 'NACHRICHTEN 1', 'PREISVORSCHLÄGE 1', 'BEWERTUNGEN 1', 'ADRESSE FEHLT 1', 'STORNO PRÜFEN 1', 'ZAHLUNG BEI RICARDO MELDEN 1', 'VERSENDEN 1', 'LAUFZEIT PRÜFEN 1', 'NICHT VERKAUFT ENTSCHEIDEN 2', 'RETOURE-SCHRITT 1']) and 'ZAHLUNG PRÜFEN (' not in tun and 'FRAGEN / ' not in tun, 'To-dos: Fragen und Nachrichten getrennt, Bewertung nur versendet (1), «Zahlung prüfen» ohne Zusatz: ' + tun)
    ok('PG-401' in L() and 'PG-405' in L() and 'NACHRICHT' in L() and s.inner_text('#cp-liste').count('→') >= 8, 'To-dos: alle Zeilen mit Stufe und Handlung')
    s.click('#nav-cockpit'); s.wait_for_timeout(100)
    ok(s.is_visible('#cp-chips') and s.is_hidden('#cp-tun') and 'an' in s.get_attribute('#nav-cockpit', 'class') and 'an' not in (s.get_attribute('#nav-todos', 'class') or ''), 'Cockpit zurück: Stufen')
    ok(s.query_selector('.cp-top button:has-text("Listing")') is None, 'Kein Listing-Knopf neben der Suche')
    ok('Mails 30.10.2026 08:38' in s.inner_text('#cp-stand'), 'Stand-Zeile')
    liste = L()
    ok('PG-401' in liste and 'ADRESSE FEHLT' in liste and 'PG-402' in liste and 'STORNO PRÜFEN' in liste and 'PG-403' not in liste, 'Stufe Verkauft: Adresse fehlt, Storno prüfen; bezahlte nicht dabei')
    # Panel Verkauft ohne Adresse
    s.click('tr[data-key="v54000001"]'); s.wait_for_timeout(100)
    pan = s.inner_text('#cp-panel')
    ok(s.is_visible('#cp-veil') and 'JETZT · LIEFERADRESSE' in pan.upper() and s.is_visible('#adr-54000001') and 'Preis 90.00 + Porto 10.00 = Total 100.00' in pan, 'Panel: Jetzt = Adresse, Feld immer da, Preis+Porto=Total')
    s.fill('#adr-54000001', 'Praxis Am Bahnhof\nBahnhofplatz 2\n3011 Bern'); s.click('[data-akt="adresseHand"]'); s.wait_for_timeout(200)
    ok(['adresseVonHand', ['54000001', 'Praxis Am Bahnhof\nBahnhofplatz 2\n3011 Bern', False]] in s.evaluate('ARGS'), 'Adresse von Hand gespeichert, Cockpit still neu geladen')
    # Panel Verkauft mit Storno
    zu(); s.click('tr[data-key="v54000002"]'); s.wait_for_timeout(100)
    pan = s.inner_text('#cp-panel')
    ok('JETZT · VERKAUF STORNIEREN' in pan.upper() and '15 Tage' in pan and s.input_value('#cpz') == 'Bitte zahlen.', 'Panel: Jetzt = Storno (15 Tage), Erinnerungstext dabei')
    s.click('[data-akt="cpErinnert"]'); s.wait_for_timeout(200)
    ok('erinnerungErledigt' in s.evaluate('AUFRUFE'), 'Erinnerung gesendet')
    ok(s.is_disabled('[data-akt="cpStorno"]'), 'Storno gesperrt, bis Ricardo geöffnet wurde')
    s.click('[data-akt="linkR"]'); s.wait_for_timeout(100)
    ok(s.is_enabled('[data-akt="cpStorno"]'), 'Nach Ricardo öffnen: Storno möglich')
    s.click('[data-akt="cpStorno"]'); s.wait_for_timeout(100); s.click('#dialog-ja'); s.wait_for_timeout(200)
    ok('verkaufStornieren' in s.evaluate('AUFRUFE') and s.is_hidden('#cp-veil'), 'Storno mit Rückfrage, Panel zu')
    # Stufe Bezahlt
    s.click('#cp-chips .chip:has-text("Bezahlt")'); s.wait_for_timeout(100)
    liste = L()
    ok('PG-403' in liste and 'BEI RICARDO MELDEN' in liste and 'PG-404' in liste and 'VERSENDEN' in liste, 'Stufe Bezahlt: melden, versenden')
    s.click('tr[data-key="v54000003"]'); s.wait_for_timeout(100)
    ok('JETZT · ZAHLUNG BEI RICARDO MELDEN' in s.inner_text('#cp-panel').upper(), 'Panel Bezahlt: Jetzt = melden')
    ok(s.is_disabled('[data-akt="cpVerkauf"][data-b="ricardoBezahlt"]'), 'Gemeldet gesperrt vor Ricardo')
    s.click('[data-akt="linkR"]'); s.wait_for_timeout(100)
    s.click('[data-akt="cpVerkauf"][data-b="ricardoBezahlt"]'); s.wait_for_timeout(200)
    ok(['setzeVerkauf', ['54000003', 'ricardoBezahlt']] in s.evaluate('ARGS'), 'Gemeldet → setzeVerkauf ricardoBezahlt')
    zu(); s.click('tr[data-key="v54000004"]'); s.wait_for_timeout(100)
    ok('JETZT · VERSENDEN' in s.inner_text('#cp-panel').upper() and '99.00.1' in s.inner_text('#cp-panel'), 'Panel: Jetzt = Versenden mit Sendungsnummer')
    s.click('[data-akt="sendungR"]'); s.wait_for_timeout(100)
    s.click('[data-akt="cpVerkauf"][data-b="versendet"]'); s.wait_for_timeout(100); s.click('#dialog-ja'); s.wait_for_timeout(200)
    ok(['setzeVerkauf', ['54000004', 'versendet']] in s.evaluate('ARGS'), 'Versendet mit Rückfrage')
    # Online: Preisvorschlag und Frage
    s.click('#cp-chips .chip:has-text("Online")'); s.wait_for_timeout(100)
    liste = L()
    ok('PREISVORSCHLAG CHF 18.00' in liste and 'PG-302' not in liste, 'Stufe Online: Preisvorschlag, abgelaufen')
    s.click('tr[data-key="oPG-300"]'); s.wait_for_timeout(100)
    pan = s.inner_text('#cp-panel')
    ok('JETZT · PREISVORSCHLAG' in pan.upper() and 'ABLEHNEN' in pan.upper() and 'noch 20 h' in pan, 'Panel Online: Preisvorschlag mit Empfehlung und Frist')
    ok(s.is_disabled('[data-akt="cpErledigt"]'), 'Erledigt gesperrt vor Ricardo')
    s.click('[data-akt="linkR"]'); s.wait_for_timeout(100); s.click('[data-akt="cpErledigt"]'); s.wait_for_timeout(200)
    ok('aufgabeErledigt' in s.evaluate('AUFRUFE'), 'Preisvorschlag erledigt')
    zu(); s.click('#cp-chips .chip:has-text("Nicht verkauft")'); s.wait_for_timeout(100)
    ok('LAUFZEIT VORBEI' in L() and 'PG-302' in L(), 'Laufzeit vorbei steht unter Nicht verkauft')
    s.click('tr[data-key="ePG-302"]'); s.wait_for_timeout(100)
    s.click('[data-akt="cpUnverkauft"]'); s.wait_for_timeout(100); s.click('#dialog-ja'); s.wait_for_timeout(200)
    ok(['setzeStatus', ['PG-302', 'Unverkauft', False]] in s.evaluate('ARGS'), 'Unverkauft gesetzt')
    # Bereit → Listing
    s.click('#cp-chips .chip:has-text("Bereit")'); s.wait_for_timeout(100)
    ok('AUS DER ANALYSE' in L() and 'NEU LISTEN' in L(), 'Stufe Bereit: Analyse und neu listen')
    s.click('tr[data-key="bPG-200"]'); s.wait_for_timeout(100); s.click('[data-akt="cpWeiter"]'); s.wait_for_timeout(400)
    ok(s.is_visible('#s-ablauf') and s.is_hidden('#s-cockpit') and 'lade' in s.evaluate('AUFRUFE') and 'Hue Bridge' in s.inner_text('#f-schritte'), 'Listing-Ablauf mit dem Stück geöffnet')
    ok('← COCKPIT' in s.inner_text('#f-leiste').upper(), 'Zurück ins Cockpit')
    s.click('#f-leiste button'); s.wait_for_timeout(100)
    ok(s.is_visible('#s-cockpit'), 'Zurück im Cockpit')
    # Nicht verkauft: Entscheid
    s.click('#cp-chips .chip:has-text("Nicht verkauft")'); s.wait_for_timeout(100)
    s.click('tr[data-key="uPG-500"]'); s.wait_for_timeout(100)
    ok('JETZT · ENTSCHEID' in s.inner_text('#cp-panel').upper() and s.is_visible('[data-akt="cpEntscheid"][data-b="Entsorgung"]'), 'Nicht verkauft: Entscheid-Knöpfe')
    s.click('[data-akt="cpEntscheid"][data-b="Anderer Kanal"]'); s.wait_for_timeout(200)
    ok(['entscheidUnverkauft', ['PG-500', 'Anderer Kanal']] in s.evaluate('ARGS'), 'Entscheid gespeichert')
    # Retoure
    zu(); s.click('#cp-chips .chip:has-text("Retouren")'); s.wait_for_timeout(100); s.click('tr[data-key="rRT-0012"]'); s.wait_for_timeout(100)
    ok('JETZT · RÜCKZAHLUNG' in s.inner_text('#cp-panel').upper() and s.input_value('#cprb') == '98.00', 'Retoure: Jetzt = Rückzahlung')
    s.click('[data-akt="cpRtSchritt"]'); s.wait_for_timeout(100); s.click('#dialog-ja'); s.wait_for_timeout(200)
    ok(['retoureSchritt', ['RT-0012', 'rueckzahlung', '98.00']] in s.evaluate('ARGS'), 'Rückzahlung gemacht')
    # Versendet: Retoure eröffnen
    zu(); s.click('#cp-chips .chip:has-text("Versendet")'); s.wait_for_timeout(100); s.click('tr[data-key="s54000005"]'); s.wait_for_timeout(100)
    ok(s.is_visible('#cpri'), 'Versendet: Formular Retoure eröffnen')
    s.fill('#cpri', 'CH93 0076 2011 6238 5295 7'); s.fill('#cpra', 'Seestrasse 1'); s.click('[data-akt="cpRetoureNeu"]'); s.wait_for_timeout(100); s.click('#dialog-ja'); s.wait_for_timeout(200)
    a = [x for x in s.evaluate('ARGS') if x[0] == 'retoureEroeffnen']
    ok(a and a[0][1][0] == '54000005' and a[0][1][1] == 'Defekt' and a[0][1][3] == 'CH93 0076 2011 6238 5295 7', 'Retoure eröffnet')
    # Storniert
    zu(); s.click('#cp-chips .chip:has-text("Storniert")'); s.wait_for_timeout(100); s.click('tr[data-key="uPG-600"]'); s.wait_for_timeout(100)
    ok('Ricardo Unpaid' in s.inner_text('#cp-panel') and s.is_visible('[data-akt="cpEntscheid"]'), 'Storniert: Paket holen, Entscheid')
    # Zubringer
    zu(); s.click('.cp-top button:has-text("Bank-Export")'); s.wait_for_timeout(100)
    ok(s.is_visible('#f-bank') and '30.10.2026 08:37' in s.inner_text('#cp-panel') and '1 · DATEI' in s.inner_text('#cp-panel').upper(), 'Bank-Panel mit Schritt 1, Datei-Feld und letztem Abgleich')
    s.evaluate("BANK={gutschriften:5,schonErfasst:1,offen:4,sicher:[{nr:'54000001',pgId:'PG-401',titel:'Autoradio',name:'P. Bahnhof',total:'217.00',grund:'Nummer und Betrag',bank:{datum:'2026-10-30',betrag:'217.00',text:'54000001'}}],unsicher:[{nr:'54000002',pgId:'PG-402',titel:'Toner',name:'L. Fischer',total:'23.80',grund:'Name und Betrag',bank:{datum:'2026-10-30',betrag:'23.80',text:'Fischer'}}],ohneTreffer:[{datum:'2026-10-30',betrag:'95.00',text:'Twint',auftrag:''}]}; $('f-bank-erg').innerHTML=cpBankHtml()")
    pan = s.inner_text('#cp-panel').upper()
    ok('ZUGEORDNET – BITTE BESTÄTIGEN · 1' in pan and 'UNSICHER – SELBER ENTSCHEIDEN · 1' in pan and 'GUTSCHRIFTEN OHNE RICARDO-VERKAUF · 1' in pan and s.inner_text('#cp-bank-n') == '1', 'Bank: drei Kästen, 1 vorangehakt')
    s.check('.bank-wahl[data-i="1"]'); s.wait_for_timeout(50)
    ok(s.inner_text('#cp-bank-n') == '2', 'Zähler folgt den Haken')
    s.click('text=angehakte Zahlungen erfassen'); s.wait_for_timeout(300)
    a = [x for x in s.evaluate('ARGS') if x[0] == 'bankBestaetigen']
    ok(a and len(a[0][1][0]) == 2 and s.is_hidden('#cp-veil') and 'an' in s.get_attribute('#cp-chips .chip:has-text("Bezahlt")', 'class'), 'Erfasst → Panel zu, Stufe Bezahlt')
    zu(); s.click('.cp-top button:has-text("Verkaufsbericht")'); s.wait_for_timeout(100)
    ok(s.is_visible('#f-bericht') and 'ADRESSLISTE' in s.inner_text('#cp-panel').upper(), 'Bericht-Panel mit Datei-Feld und Post-Adressliste')
    s.keyboard.press('Escape'); s.wait_for_timeout(50)
    ok(s.is_hidden('#cp-veil'), 'Escape schliesst das Panel')
    # Suche
    s.fill('#cp-q', 'Toner'); s.keyboard.press('Enter'); s.wait_for_timeout(200)
    liste = L()
    ok('cockpitSuche' in s.evaluate('AUFRUFE') and 'adminSuche' not in s.evaluate('AUFRUFE') and 'PG-999' in liste and 'ABGEBROCHEN' in liste and 'PG-402' in liste, 'Suche über alles: fremder Status und bekannter Verkauf')
    s.click('tr[data-key="qPG-999"]'); s.wait_for_timeout(100)
    ok('Abgebrochen' in s.inner_text('#cp-panel') and s.is_visible('[data-akt="cpAdmin"]'), 'Fremdes Stück: Panel mit Admin')
    s.click('[data-akt="cpAdmin"]'); s.wait_for_timeout(200)
    ok(s.is_visible('#s-admin') and s.input_value('#ad-q') == 'PG-999' and s.is_visible('#adm-storno'), 'Admin › Storno mit Suche vorbelegt')
    # Navigation
    s.click('#nav-zahlen'); s.wait_for_timeout(200)
    ok(s.is_visible('#adm-kennzahlen') and 'an' in s.get_attribute('#nav-zahlen', 'class') and 'BETRIEB' in s.inner_text('#adm-reiter').upper() and 'STORNO' not in s.inner_text('#adm-reiter').upper(), 'Reporting = Kennzahlen + Betrieb')
    s.click('#nav-einst'); s.wait_for_timeout(200)
    ok(s.is_visible('#adm-einstellungen') and s.is_hidden('#adm-kennzahlen') and 'FEEDBACK' in s.inner_text('#adm-reiter').upper() and 'KENNZAHLEN' not in s.inner_text('#adm-reiter').upper(), 'Einstellungen = Einstellungen + Storno + Feedback')
    s.click('#nav-cockpit'); s.wait_for_timeout(100)
    ok(s.is_visible('#s-cockpit') and s.is_hidden('#nav-f-taeglich'), 'Cockpit zurück, alte Abläufe versteckt')
    ok(s.is_visible('.fb-auf'), 'Feedback-Knopf da')
    s.click('#nav-todos'); s.wait_for_timeout(100)
    s.click('.chip.tun:has-text("Adresse fehlt")'); s.wait_for_timeout(100)
    ok('PG-401' in L() and 'VERKAUFT' in L() and 'PG-402' not in L(), 'To-dos › Adresse fehlt: nur dieses Stück, mit Stufe')
    s.click('tr[data-key="v54000001"]'); s.wait_for_timeout(100)
    pan = s.inner_text('#cp-panel').upper()
    ok('BEWERTUNG' not in pan and 'NACHRICHT' in pan, 'Panel Verkauft: Nachricht ja, Bewertung nein (kommt erst nach dem Versand)'); zu()
    s.click('#nav-cockpit'); s.wait_for_timeout(100)
    # Reaktivieren (Neu listen) im Panel Bereit
    s.click('#cp-chips .chip:has-text("Bereit")'); s.wait_for_timeout(100)
    s.click('tr[data-key="bPG-200"]'); s.wait_for_timeout(100)
    pan = s.inner_text('#cp-panel')
    ok('JETZT · AUF RICARDO NEU EINSTELLEN' in pan.upper() and 'Do 05.11.2026 19:00' in pan and s.is_visible('#wl-PG-200') and s.is_disabled('[data-akt="cpGelistet"]'), 'Neu listen: Reaktivieren-Block mit Auktionsende, «Gelistet» erst nach Ricardo')
    s.click('[data-akt="linkR"][data-a*="prefill"]'); s.wait_for_timeout(100)
    ok(s.is_enabled('[data-akt="cpGelistet"]'), 'Nach Ricardo-Klick: «Gelistet» frei')
    s.fill('#wl-PG-200', 'https://www.ricardo.ch/de/a/hue-1299010/'); s.click('[data-akt="cpGelistet"]'); s.wait_for_timeout(200)
    calls = s.evaluate('ARGS')
    ok(any(c[0] == 'markiereGelistet' and c[1][:3] == ['PG-200', 'https://www.ricardo.ch/de/a/hue-1299010/', ''] for c in calls), 'markiereGelistet ohne Laufzeit (Server rechnet Auktionsende): ' + str([c for c in calls if c[0] == 'markiereGelistet']))
    zu()
    s.click('#l-en'); s.wait_for_timeout(100)
    ok('READY' in s.inner_text('#cp-chips').upper() and 'SOLD' in s.inner_text('#cp-chips').upper(), 'Englisch')
    ok(not err, 'Keine JS-Fehler: ' + '; '.join(err[:3]))
    b.close()
print('FEHLER:', fehler)
raise SystemExit(1 if fehler else 0)
