import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))  # Pfade relativ zu tests/
"""Ricardo Tool Oberfläche, Prüfung 24.10.2026: Befunde 1, 3 (V5), 4, 5, 7, 10, 13, 22, 24, Z10 und Zusatz E1 (Etikette direkt drucken).
Stub für google.script.run, gestubbtes fetch (Zebra Browser Print) und Downloads. Erfundene Daten. Lauf: python3 tests/t_ricardo_p2410_ui.py"""
import json, pathlib
from playwright.sync_api import sync_playwright
html = (pathlib.Path(__file__).parent.parent / 'apps/ricardo/Index.html').read_text().replace('<?!= JSON.stringify(lang) ?>', '"de"')
LINKS = {'listen': 'https://www.ricardo.ch/de/list/', 'verkauft': 'https://www.ricardo.ch/de/my-ricardo/selling/orders/', 'amVerkaufen': 'https://www.ricardo.ch/de/my-ricardo/selling/offers/', 'artikel': 'https://www.ricardo.ch/de/a/'}
BOESE = "https://www.ricardo.ch/de/a/x-1234567');alert(document.domain);('"
AU = {'anzahl': 3, 'verpasst': 0, 'kontrolle': {'aktiv': True, 'letzte': '', 'warnung': False, 'unecht': 0}, 'bewertungen': [],
      'angebote': [{'id': "m1');alert(1);('", 'art': 'Preisvorschlag', 'titel': 'Toaster', 'pgId': 'PG-1', 'artikel': '1', 'betrag': '20.00', 'preis': '30.00', 'frist': '', 'restStunden': '', 'empfehlung': 'Annehmen', 'link': BOESE, 'alter': 1}],
      'fragen': [{'id': 'f1', 'art': 'Frage', 'titel': 'Lampe', 'pgId': 'PG-2', 'artikel': '2', 'von': 'k', 'text': 'Geht sie?', 'entwurf': 'Ja.', 'link': BOESE, 'alter': 1}],
      'zahlung': [{'nr': "9');alert(2);('", 'pgId': 'PG-3', 'titel': 'Kabel', 'kaeufer': 'k', 'total': '9.00', 'tage': 4, 'meldet': '', 'link': BOESE, 'entwurf': 'Hallo'}]}
OFFEN = [dict(nr='50000002', pgId='PG-002', titel='Neu: Kamera', am='16.10.2026', total='91.00', preis='82.00', status='Zu packen', name='Testa Beispiel', kaeufer='nick02', ort='3000 Bern',
              lagerort='Ricardo Online', rtOrt='TEC-1', klasse='Paket B-Post', meldet='', bezahlt='', ricardoGemeldet='', sendung='', artikel='1', link='https://www.ricardo.ch/de/my-ricardo/selling/order/50000002/', ohneAdresse=False)]
TAEGLICH = {'art': 'taeglich', 'links': LINKS, 'aufgaben': AU, 'melden': [], 'offen': [dict(OFFEN[0], status='Wartet auf Zahlung')], 'storno': [], 'stornoTage': 14, 'letzteBank': '', 'doppelt': []}
SCHICHT1 = {'art': 'schicht1', 'links': LINKS, 'bereit': [], 'analyse': 0, 'unverkauft': [], 'ohneMail': [], 'entscheide': ['Neu listen', 'Anderer Kanal', 'Entsorgung'], 'aktiv': 0, 'schwelle': 90, 'laufzeit': 6, 'regale': {}, 'unzugeordnet': []}
SCHICHT2 = {'art': 'schicht2', 'links': LINKS, 'verkaeufe': {'offen': OFFEN, 'zuPacken': 1}, 'letzterImport': '', 'postBereit': True, 'entscheide': [], 'unverkauft': [], 'ohneMail': [], 'regale': {'offline': 'Ricardo Offline', 'unpaid': 'Ricardo Unpaid'}}
R = {'id': 'PG-100', 'status': 'Verkauft', 'ean': '', 'bezeichnung': 'Toaster', 'neupreis': '', 'startpreis': '30.00', 'lagerort': '', 'zustand': 'Gebraucht', 'maengel': 'x', 'frei': False, 'gewicht': 2, 'sperrgut': False,
     'klasse': 'PostPac B-Post bis 2 kg', 'versand': '9.00', 'titel': 'Toaster', 'beschrieb': 'Zustand: Gebraucht', 'link': '', 'produktlink': '', 'fehlt': [], 'versandForm': '', 'getestet': True, 'buendelIds': [], 'buendelInhalt': [],
     'masse': [], 'englisch': '', 'englischAlt': False, 'quelle': 'Online', 'analyse': False, 'analyseNr': '', 'fotoOrdner': '', 'geaendert': '', 'regal': ''}
DATEN = {'startDaten': {'version': 't', 'admin': True, 'zustaende': ['Neu und originalverpackt', 'Gebraucht'], 'maengelPflicht': ['Gebraucht'], 'laufzeit': 6, 'retoureGruende': [], 'kiAktiv': True, 'mailAktiv': True, 'aktiv': 3, 'schwelle': 90,
                        'regale': {'offline': 'Ricardo Offline', 'online': 'Ricardo Online', 'unpaid': 'Ricardo Unpaid'}},
         'analyseListe': [], 'aufgaben': AU, 'mailsJetzt': AU, 'aufgabeErledigt': AU, 'erinnerungErledigt': AU, 'zaehler': {'offen': 0, 'zuPacken': 0, 'versand': 0, 'retouren': 0}, 'verkaeufe': {'offen': OFFEN}, 'retouren': {'offen': []},
         'lade': R, 'starteListing': R, 'buendelHinzu': dict(R, status='In Arbeit', buendelIds=['PG-400']), 'entscheidUnverkauft': SCHICHT1, 'aehnlicheStuecke': {'kandidaten': []},
         'suche': {'treffer': [{'id': 'PG-100', 'name': 'Toaster', 'tab': 'Online', 'ort': 'TEC-1', 'erfasst': '', 'vp': 30, 'status': 'Unverkauft', 'entscheid': '', 'entscheidOffen': True, 'teilVon': '', 'quelle': 'rt', 'warnung': ''},
                               {'id': 'PG-401', 'name': 'Mixer', 'tab': 'Analyse', 'ort': '', 'erfasst': '', 'vp': 40, 'status': '', 'teilVon': '', 'quelle': 'analyse', 'mm': True, 'mmStatus': 'Geholt', 'warnung': ''}], 'andere': [], 'archiv': [], 'eigene': [], 'anzahl': 2},
         'uebersicht': {'letzterImport': '', 'aktiv': 1, 'schwelle': 90, 'laufzeit': 6, 'unzugeordnet': [], 'liste': [{'id': "PG-9');alert(3);('", 'status': 'Gelistet', 'name': 'Kabel', 'ort': '', 'link': 'javascript:alert(4)', 'buendel': '', 'regal': '', 'seit': '', 'laufzeit': 6, 'abgelaufen': True}]},
         'adminSuche': {'listings': [{'zeile': 2, 'id': 'PG-100', 'name': 'Toaster', 'status': 'Gelistet', 'am': '', 'buendel': '', 'loeschbar': False}, {'zeile': 3, 'id': 'PG-101', 'name': 'Kabel', 'status': 'Bereit', 'am': '', 'buendel': '', 'loeschbar': True}],
                        'verkaeufe': [dict(OFFEN[0], nr='9004', zeile=2, status='Bezahlt und versendet', bezahlt='20.10.2026', storno=False, zuordnen=False), dict(OFFEN[0], nr='9012', pgId='', zeile=3, storno=True, zuordnen=True)]},
         'adminVerkaufZuordnen': True, 'adminBetrieb': {'ki': True, 'mail': {'aktiv': True, 'letzte': '', 'warnung': False, 'unecht': 0}, 'url': '#', 'ausloeser': True, 'vorrat': False, 'jetzt': None},
         'bankAbgleich': {'sicher': [], 'unsicher': [], 'gutschriften': 2, 'schonErfasst': 0, 'offen': 1, 'ohneTreffer': [{'datum': '2026-10-20', 'betrag': '12.50', 'text': 'Zahlung Müller Zürich', 'auftrag': 'A9'}]},
         'importVerkaeufe': {'offen': OFFEN, 'import': {'neu': 0, 'bekannt': 1, 'ohne': 0, 'ergaenzt': 0, 'nachgetragen': 1, 'preise': 1, 'warnungen': 0, 'fehlten': 0}},
         'etikette': {'nr': '50000002', 'sendung': '99.60.1', 'daten': 'XlhBXkZPNTBeRlNeWFo=', 'typ': 'zpl', 'name': 'Etikette 50000002.zpl', 'warnungen': '', 'produkt': 'ECO'},
         'ablauf:taeglich': TAEGLICH, 'ablauf:schicht1': SCHICHT1, 'ablauf:schicht2': SCHICHT2, 'ablauf:schicht3': {'art': 'schicht3', 'links': LINKS, 'versand': [], 'warten': [], 'regale': {}}}
stub = """<script>window.AUFRUFE=[];window.D=%s;window.H={};window.OFFEN=[];window.open=function(u){OFFEN.push(u)};window.DIALOGE=[];
window.DL=[];HTMLAnchorElement.prototype.click=function(){DL.push({name:this.download,href:this.href})};
window.google={script:{run:(function mk(ok,fail){return new Proxy({},{get:function(_,k){
 if(k==='withSuccessHandler')return function(f){return mk(f,fail)}; if(k==='withFailureHandler')return function(f){return mk(ok,f)};
 return function(l,name,args){AUFRUFE.push([name,JSON.parse(JSON.stringify(args||[]))]);var key=name==='ablauf'?'ablauf:'+args[0]:name;
  var x=H[name]?H[name](args):null; setTimeout(function(){ if(x&&x.fehler){fail&&fail({message:x.fehler});return;} ok&&ok(JSON.parse(JSON.stringify(x&&x.ok!==undefined?x.ok:(D[key]||{}))))},5)}}})})()}};</script>""" % json.dumps(DATEN)
html = html.replace('<head>', '<head>' + stub, 1)
fehler = 0
def ok(b, m):
    global fehler
    print('ok' if b else 'FEHLER', m); fehler += 0 if b else 1
with sync_playwright() as p:
    b = p.chromium.launch(); s = b.new_page(viewport={'width': 1300, 'height': 1400}); err = []
    s.on('pageerror', lambda e: err.append(str(e)))
    dialoge = []; s.on('dialog', lambda d: (dialoge.append(d.message), d.dismiss()))   # alert() aus eingeschleustem Text
    s.set_content(html); s.wait_for_timeout(400)
    rufe = lambda n: [x[1] for x in s.evaluate('AUFRUFE') if x[0] == n]

    # ---------- Befund 13: Text vom Server nie im onclick ----------
    s.evaluate("zeige('aufgaben')"); s.wait_for_timeout(200)
    inner = s.inner_html('#a-liste')
    ok('data-akt=' in inner, '13: «Zu erledigen» mit data-akt statt Text im onclick')
    ok(all('alert' not in seg for seg in inner.split('onclick=')[1:]), '13: kein onclick enthält Server-Text')
    s.click('#a-liste .aufgabe:nth-child(2) button.haupt-knopf'); s.wait_for_timeout(100)
    ok(s.evaluate('OFFEN.length') == 0 and not err and not dialoge, '13: böser Link wird nicht geöffnet, kein Skript ausgeführt')
    s.click('#a-liste button:text-is("Erledigt") >> nth=0'); s.wait_for_timeout(100)
    ok(rufe('aufgabeErledigt')[-1] == ["m1');alert(1);('"], '13: Knopf liefert die ID über data-*, unverändert')
    s.evaluate("zeige('ueber')"); s.wait_for_timeout(300)
    ok('javascript:' not in s.inner_html('#u-liste') and "alert(3)" not in ''.join(seg.split('>')[0] for seg in s.inner_html('#u-liste').split('onclick=')[1:]), '13: Übersicht ohne javascript:-Link und ohne Text im onclick')
    s.evaluate("H.setzeStatus = function () { return { ok: D.uebersicht }; }; 0")
    s.click('#u-liste button'); s.wait_for_timeout(100); s.click('#dialog-ja'); s.wait_for_timeout(150)
    ok(rufe('setzeStatus')[-1][0] == "PG-9');alert(3);('", '13: «Unverkauft» bekommt die Nummer über data-*')

    # ---------- Befund 24: Fehler beim stillen Laden sichtbar ----------
    s.evaluate("H.analyseListe = function () { return { fehler: 'ANALYSE TOOL nicht erreichbar' }; }; zeige('listen'); ladeAnalyse()"); s.wait_for_timeout(200)
    ok('ANALYSE TOOL nicht erreichbar' in s.text_content('#ana-liste') and s.is_visible('#hinweis'), '24: Fehler der Liste «Aus der Analyse» sichtbar')
    s.evaluate("H.zaehler = function () { return { fehler: 'Zähler kaputt' }; }; zaehlerLaden()"); s.wait_for_timeout(150)
    ok('Zähler kaputt' in s.text_content('#hinweis'), '24: jeder stille Fehler wird gemeldet')
    s.evaluate("H.analyseListe = null; H.zaehler = null; $('hinweis').hidden = true")

    # ---------- Befund 7 und V5: Suche ----------
    s.evaluate("$('q').value='Toaster'; suchen()"); s.wait_for_timeout(200)
    tr = s.text_content('#treffer')
    ok('Neu listen' in tr and 'Entscheid offen' in tr, '7: «Unverkauft» ohne Entscheid: Knopf «Neu listen» statt «Listen»')
    ok('im Matchmaker geholt' in tr and s.locator('#treffer tr:has-text("PG-401") button').count() == 0, 'V5: «Geholt» gesperrt, ohne Knopf')
    s.click('#treffer tr:has-text("PG-100") button'); s.wait_for_timeout(250)
    ok(rufe('entscheidUnverkauft')[-1] == ['PG-100', 'Neu listen'] and rufe('lade')[-1] == ['PG-100'] and not rufe('starteListing'), '7: «Neu listen» entscheidet auf derselben Zeile, kein neues Listing')

    # ---------- Befund 1: «Gelistet» nur aus «In Arbeit»/«Bereit» ----------
    s.evaluate("$('r-link').value = 'https://www.ricardo.ch/de/a/x-1234567/'; gelistet()"); s.wait_for_timeout(150)
    ok(not rufe('markiereGelistet') and '«Verkauft»' in s.text_content('#hinweis'), '1: Listing «Verkauft»: «Gelistet» gar nicht erst gesendet')

    # ---------- Vertrag V5 / Befund 3: Rückfrage im Bündel ----------
    s.evaluate("R.status = 'In Arbeit'; H.buendelHinzu = function (a) { return Array.isArray(a[2]) && a[2].indexOf('mm') >= 0 ? null : { fehler: 'Bitte bestätigen: PG-400 liegt im Matchmaker für Auftrag «Föhn gesucht». Dort nicht verkauft und jetzt auf Ricardo? [mm]' }; }; 0")
    s.evaluate("$('b-id').value = 'PG-400'; buendelPlus()"); s.wait_for_timeout(150)
    ok(s.is_visible('#dialog') and 'Föhn gesucht' in s.inner_text('#dialog-text') and '[mm]' not in s.inner_text('#dialog-text'), '3: Server fragt im Bündel nach (Kürzel nicht sichtbar)')
    s.click('#dialog-ja'); s.wait_for_timeout(200)
    ok(rufe('buendelHinzu')[-1] == ['PG-100', 'PG-400', ['mm']], '3: nach Ja mit Bestätigung «mm» nochmals')
    s.evaluate("schliesse && schliesse()")

    # ---------- Befund 10: «beschäftigt» im Hintergrund: Hinweis und Wiederholung, nicht still ----------
    s.evaluate("BESCHAEFTIGT_MS = 120; window.NB = 0; H.aufgabeErledigt = function () { NB++; return NB < 3 ? { fehler: 'Das Tool ist gerade beschäftigt (eine andere Speicherung läuft noch). Bitte gleich nochmals versuchen.' } : null; }; 0")
    s.evaluate("hinter('aufgabeErledigt', ['x'], { text: 'Erledigt' })"); s.wait_for_timeout(60)
    ok('beschäftigt' in s.text_content('#schlange') and s.is_visible('#schlange'), '10: Wiederholung mit sichtbarem Hinweis «beschäftigt»')
    s.wait_for_timeout(700)
    ok(s.evaluate('NB') == 3 and s.is_hidden('#schlange-fehler'), '10: beim dritten Versuch gespeichert')
    s.evaluate("NB = -10")                                                                  # bleibt beschäftigt
    s.evaluate("hinter('aufgabeErledigt', ['y'], { text: 'Erledigt' })"); s.wait_for_timeout(1200)
    ok(s.is_visible('#schlange-fehler') and 'beschäftigt' in s.text_content('#schlange-fehler') and 'Nochmals' in s.text_content('#schlange-fehler'), '10: danach Box mit Meldung und «Nochmals»')
    ok(s.evaluate("netzfehler('Lock timeout: x')") is False and s.evaluate("netzfehler('NetworkError when attempting to fetch resource')") is True, '10: Sperre ist kein Netzfehler')
    s.evaluate("$('schlange-fehler').hidden = true; H.aufgabeErledigt = null")

    # ---------- Befund 4, 5: Admin ----------
    s.evaluate("zeige('admin'); admTab('storno')"); s.wait_for_timeout(250)
    al = s.inner_text('#ad-liste')
    ok(s.locator('#ad-liste tr:has-text("PG-100") button').count() == 0 and 'nicht löschbar' in al, '5: laufendes Listing ohne «Löschen»')
    ok(s.locator('#ad-liste tr:has-text("9004") button').count() == 0 and 'nur über eine Retoure' in al, '5: bezahlter Verkauf ohne Storno, Hinweis Retoure')
    s.fill('#az-1', 'PG-100'); s.evaluate("H.adminVerkaufZuordnen = function (a) { return a[3] === true ? null : { fehler: 'Bitte bestätigen: Verkauf 9012 (Artikel-Nr 1) passt zu keinem Ricardo-Link von PG-100. Trotzdem zuordnen?' }; }; 0")
    s.click('#ad-liste button:text-is("Zuordnen")'); s.wait_for_timeout(150)
    ok(s.is_visible('#dialog') and 'Trotzdem zuordnen' in s.inner_text('#dialog-text'), '4: Zuordnen fragt bei unpassender Artikel-Nr')
    s.click('#dialog-ja'); s.wait_for_timeout(200)
    ok(rufe('adminVerkaufZuordnen')[-1] == [3, '9012', 'PG-100', True], '4: Zuordnen mit Bestätigung')
    s.evaluate("admTab('betrieb')"); s.wait_for_timeout(200)
    ok('suchVorrat' in s.text_content('#adm-status'), 'Betrieb zeigt, wenn der Auslöser «suchVorrat» fehlt')

    # ---------- Befund 22: Bank-Export (Kodierung, Anführungszeichen über Zeilen, ohne Treffer) ----------
    s.evaluate("ablaufStarten('taeglich')"); s.wait_for_timeout(300)
    csv = 'Buchungsdatum;Buchungstext;Gutschrift\n20.10.2026;"Zahlung M\xfcller\nZ\xfcrich";12.50\n21.10.2026;Ricardo 50000002;91.00\n'.encode('cp1252')
    s.set_input_files('#f-bank', files=[{'name': 'konto.csv', 'mimeType': 'text/csv', 'buffer': csv}])
    s.click('#f-schritte button:text-is("Einlesen")'); s.wait_for_timeout(300)
    z = rufe('bankAbgleich')[-1][0]
    ok(len(z) == 2 and z[0]['text'] == 'Zahlung Müller\nZürich' and z[0]['betrag'] == 12.5 and z[1]['datum'] == '2026-10-21', '22: Windows-1252 erkannt, Zeilenumbruch in Anführungszeichen bleibt im Feld')
    ok(s.is_visible('#f-bank-ohne') and '1 Gutschriften ohne Treffer' in s.text_content('#f-bank-ohne') and 'Müller' in s.text_content('#f-bank-ohne'), '22: Gutschriften ohne Treffer als Liste')

    # ---------- Prüfung Z10 und Zusatz E1: Packen, Etikette ----------
    s.evaluate("ablaufStarten('schicht2')"); s.wait_for_timeout(300)
    s.click('#f-schritte button:text-is("Start →")'); s.wait_for_timeout(150)
    ok('Ricardo Online' in s.text_content('#f-schritte') and 'TEC-1' in s.text_content('#f-schritte'), 'Z10: Regal zuerst, Return-Tool-Ort nur als Hinweis')
    s.click('#f-aktion'); s.wait_for_timeout(150)
    # a) Zebra Browser Print erreichbar
    s.evaluate("""window.FETCH=[]; window.fetch = function (u, o) { FETCH.push([u, o && o.method, o && o.body]);
      if (/default\\?type=printer/.test(u)) return Promise.resolve({ ok: true, text: function () { return Promise.resolve(JSON.stringify({ name: 'ZD220', uid: 'z1', connection: 'usb' })); } });
      return Promise.resolve({ ok: true, text: function () { return Promise.resolve(''); } }); }; 0""")
    s.click('#f-schritte button:text-is("Etikette drucken")'); s.wait_for_timeout(300)
    f = s.evaluate('FETCH')
    ok(rufe('etikette')[-1] == ['50000002', False, False, ['zpl', 'pdf']] and len(f) == 2 and f[0][0] == 'https://127.0.0.1:9101/default?type=printer' and f[1][0] == 'https://127.0.0.1:9101/write' and f[1][1] == 'POST', 'E1 a: Zebra Browser Print gefunden, Etikette gesendet')
    body = json.loads(f[1][2])
    ok(body['device']['uid'] == 'z1' and body['data'] == '^XA^FO50^FS^XZ' and s.evaluate('DL.length') == 0 and 'gedruckt (Zebra)' in s.text_content('#hinweis') and s.evaluate('OFFEN.length') == 0, 'E1 a: ZPL-Text an den Drucker, kein Download, kein neuer Tab')
    ok('Nochmals drucken' in s.text_content('#f-schritte') and 'Neue Etikette' in s.text_content('#f-schritte') and 'Datei' in s.text_content('#f-schritte'), 'E1: «Nochmals drucken», «Datei» und «Neue Etikette»')
    # b) nicht erreichbar: still herunterladen; «Nochmals drucken» ohne neuen Server-Aufruf
    s.evaluate("FETCH=[]; window.fetch = function (u) { FETCH.push([u]); return Promise.reject(new TypeError('Failed to fetch')); }; 0")
    n = len(rufe('etikette'))
    s.click('#f-schritte button:text-is("Nochmals drucken")'); s.wait_for_timeout(300)
    ok(len(rufe('etikette')) == n and s.evaluate('DL.length') == 1 and s.evaluate('DL[0].name') == 'Etikette 50000002.zpl' and s.evaluate('DL[0].href').startswith('blob:'), 'E1 b: Browser Print fehlt: Datei heruntergeladen, keine neue Sendungsnummer')
    ok('Download-Ordner' in s.text_content('#hinweis') and s.evaluate('OFFEN.length') == 0, 'E1 b: Meldung «im Download-Ordner», kein neuer Tab, keine Fehlermeldung')
    # c) Fehler beim Drucken (kein Drucker / Antwort 500): herunterladen
    s.evaluate("""window.fetch = function (u) { if (/default/.test(u)) return Promise.resolve({ ok: true, text: function () { return Promise.resolve(JSON.stringify({ name: 'ZD220', uid: 'z1' })); } });
      return Promise.resolve({ ok: false, status: 500, text: function () { return Promise.resolve('Fehler'); } }); }; 0""")
    s.click('#f-schritte button:text-is("Nochmals drucken")'); s.wait_for_timeout(300)
    ok(s.evaluate('DL.length') == 2, 'E1 c: Drucken scheitert: Datei heruntergeladen')
    s.evaluate("window.fetch = function () { return new Promise(function () {}); }; 0")                     # hängt: nach 1,5 s weiter
    s.click('#f-schritte button:text-is("Nochmals drucken")'); s.wait_for_timeout(1900)
    ok(s.evaluate('DL.length') == 3, 'E1: Browser Print antwortet nicht: nach dem Zeitlimit heruntergeladen')
    # «Neue Etikette»: Server fragt (Prüfung 18)
    s.evaluate("H.etikette = function (a) { return a[2] === true ? null : { fehler: 'Bitte bestätigen: Für PG-002 gibt es schon eine Etikette (Sendung 99.60.1). Eine neue Etikette hat eine neue Sendungsnummer, die alte nicht mehr verwenden. Neue Etikette erstellen?' }; }; 0")
    s.click('#f-schritte button:text-is("Neue Etikette")'); s.wait_for_timeout(150)
    ok(s.is_visible('#dialog') and 'schon eine Etikette' in s.inner_text('#dialog-text'), '18: neue Etikette nur nach Rückfrage des Servers')
    s.click('#dialog-ja'); s.wait_for_timeout(2000)
    ok(rufe('etikette')[-1] == ['50000002', False, True, ['zpl', 'pdf']], '18: nach Ja mit Bestätigung (Nach-Review 1: mit Formaten)')
    # PDF: herunterladen statt neuer Tab
    s.evaluate("H.etikette = function () { return { ok: { nr: '50000002', sendung: '99.60.2', daten: 'JVBERi0xLjQK', typ: 'pdf', name: 'Etikette 50000002.pdf' } }; }; DL = []")
    s.evaluate("etikette('50000002')"); s.wait_for_timeout(300)
    ok(s.evaluate('DL.length') == 1 and s.evaluate('DL[0].name') == 'Etikette 50000002.pdf' and s.evaluate('OFFEN.length') == 0, 'E1: PDF heruntergeladen, kein neuer Tab')

    # ---------- Verkaufsbericht: Kodierung, Meldung ----------
    s.evaluate("zeige('verkauf')"); s.wait_for_timeout(200)
    s.set_input_files('#v-datei', files=[{'name': 'bericht.csv', 'mimeType': 'text/csv', 'buffer': 'Order ID;Selling Price\n1;Z\xfcrich\n'.encode('cp1252')}])
    s.click('#s-verkauf button:text-is("Einlesen")'); s.wait_for_timeout(250)
    ok('Zürich' in rufe('importVerkaeufe')[-1][0] and 'PG-ID nachgetragen: 1' in s.text_content('#v-meldung'), '4/22: Bericht mit erkannter Kodierung, Meldung «nachgetragen»')
    ok(not err and not dialoge, 'keine JS-Fehler, kein alert() ' + str(err) + str(dialoge))
    b.close()
print('alle Tests ok' if not fehler else '%d Fehler' % fehler); raise SystemExit(1 if fehler else 0)
