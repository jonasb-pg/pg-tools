import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))  # Pfade relativ zu tests/
"""Ricardo Tool Oberfläche, Nach-Review 24.10.2026: Befunde 1 (Formate), 2 (Warnung bleibt), 3 (Storno bezahlt), 4 (Retoure Defekt), 5 (Link ersetzen),
9 (Zebra unklar) und 11 (Archiv ohne Kopf im Betrieb). Nutzt Stub und Daten aus t_ricardo_p2410_ui.py (nur der Kopf bis «fehler = 0»). Lauf: python3 tests/t_ricardo_p2410_nachreview_ui.py"""
import json, pathlib
kopf = (pathlib.Path(__file__).parent / 't_ricardo_p2410_ui.py').read_text().split('fehler = 0')[0]
ns = {'__file__': str(pathlib.Path(__file__).parent / 't_ricardo_p2410_ui.py')}
exec(kopf, ns)
html = ns['html']
from playwright.sync_api import sync_playwright
fehler = 0
def ok(b, m):
    global fehler
    print('ok' if b else 'FEHLER', m); fehler += 0 if b else 1
with sync_playwright() as p:
    b = p.chromium.launch(); s = b.new_page(viewport={'width': 1300, 'height': 1400}); err = []
    s.on('pageerror', lambda e: err.append(str(e)))
    s.set_content(html); s.wait_for_timeout(400)
    rufe = lambda n: [x[1] for x in s.evaluate('AUFRUFE') if x[0] == n]

    # ---------- 4: Retoure «Defekt» → «Neu listen» mit Rückfrage ----------
    RT = {'offen': [{'nr': 'RT-0001', 'eroeffnet': '20.10.2026', 'pgId': 'PG-100', 'titel': 'Toaster', 'grund': 'Defekt', 'notiz': '', 'verkauf': '9001', 'name': 'Eva', 'kaeufer': 'eva', 'iban': '', 'betrag': '39.00',
                      'rueckzahlungAm': '21.10.2026', 'rueckzahlung': '39.00', 'ricardo': '21.10.2026', 'entscheid': ''}], 'abgeschlossen': 0, 'auszahlungen': 0, 'entscheide': ['Neu listen', 'Anderer Kanal', 'Entsorgung']}
    s.evaluate("D.retouren = %s; H.retoureSchritt = function (a) { return a[3] === true ? { ok: D.retouren } : { fehler: 'Bitte bestätigen: RT-0001 kam als «Defekt» zurück. Neu listen nur, wenn das Stück repariert und geprüft ist.' }; }; 0" % json.dumps(RT))
    s.evaluate("zeige('retour')"); s.wait_for_timeout(300)
    s.click('#rt-liste button:text-is("Neu listen")'); s.wait_for_timeout(200)
    ok(s.is_visible('#dialog') and 'Defekt' in s.inner_text('#dialog-text'), '4: Rückfrage des Servers erscheint als Dialog')
    s.click('#dialog-ja'); s.wait_for_timeout(200)
    ok(rufe('retoureSchritt')[-1] == ['RT-0001', 'entscheid', 'Neu listen', True], '4: nach Ja mit Bestätigung nochmals aufgerufen')

    # ---------- 3: Admin-Storno eines bezahlten, nicht versendeten Verkaufs ----------
    s.evaluate("""D.adminSuche.verkaeufe = [Object.assign({}, D.adminSuche.verkaeufe[1], { nr: '9020', pgId: 'PG-1', zeile: 4, status: 'Bereit zum Versand', bezahlt: '21.10.2026', storno: true, zuordnen: false })];
      H.adminLoescheVerkauf = function (a) { return a[2] === true ? { ok: true } : { fehler: 'Bitte bestätigen: Verkauf 9020 ist bezahlt (CHF 91.00 am 21.10.2026), aber nicht versendet. Stornieren? Das Geld muss zurück.' }; }; 0""")
    s.evaluate("zeige('admin'); admTab('storno')"); s.wait_for_timeout(200)
    s.evaluate("$('ad-q').value = '9020'; adminSuchen()"); s.wait_for_timeout(300)
    s.click('#ad-liste tr:has-text("9020") button:text-is("Löschen")'); s.wait_for_timeout(150); s.click('#dialog-ja'); s.wait_for_timeout(200)
    ok(s.is_visible('#dialog') and 'bezahlt' in s.inner_text('#dialog-text'), '3: bezahlt: zweite Rückfrage vom Server (Rückzahlung)')
    s.click('#dialog-ja'); s.wait_for_timeout(200)
    ok(rufe('adminLoescheVerkauf')[-1] == [4, '9020', True], '3: nach Ja mit Bestätigung storniert')

    # ---------- 5: «Gelistet» mit anderem Link: Rückfrage, dann ersetzen ----------
    s.evaluate("""R = Object.assign({}, D.lade, { status: 'Gelistet', fehlt: [] });
      H.markiereGelistet = function (a) { return a[3] === true ? { ok: R } : { fehler: 'Bitte bestätigen: PG-100 ist schon mit dem Ricardo-Link https://www.ricardo.ch/de/a/x-2222222222/ gelistet. Link ersetzen (z.B. falsch eingefügt)?' }; };
      $('r-link').value = 'https://www.ricardo.ch/de/a/x-1111111111/'; gelistet(function () {}); 0""")
    s.wait_for_timeout(200)
    ok(s.is_visible('#dialog') and 'Link ersetzen' in s.inner_text('#dialog-text'), '5: Rückfrage «Link ersetzen?»')
    s.click('#dialog-ja'); s.wait_for_timeout(200)
    ok(rufe('markiereGelistet')[-1][3] is True, '5: nach Ja mit Bestätigung')

    # ---------- 1, 2, 9: Etikette ----------
    s.evaluate("ablaufStarten('schicht2')"); s.wait_for_timeout(300)
    s.click('#f-schritte button:text-is("Start →")'); s.wait_for_timeout(150); s.click('#f-aktion'); s.wait_for_timeout(150)
    s.evaluate("""window.FETCH = []; window.fetch = function (u, o) { FETCH.push(u); if (/default/.test(u)) return Promise.resolve({ ok: true, text: function () { return Promise.resolve(JSON.stringify({ uid: 'z1', name: 'ZD220' })); } });
      return Promise.reject(new TypeError('Failed to fetch')); }; DL = []; 0""")   # 9: /write geht raus, Antwort fehlt
    s.click('#f-schritte button:text-is("Etikette drucken")'); s.wait_for_timeout(400)
    ok(rufe('etikette')[-1] == ['50000002', False, False, ['zpl', 'pdf']], '1: die Seite sagt dem Server, dass sie ZPL kann')
    ok(s.evaluate('DL.length') == 0 and 'Unklar' in s.text_content('#hinweis') and s.get_attribute('#hinweis', 'class') == 'stop' and 'Nochmals drucken' in s.text_content('#f-schritte') and 'Datei' in s.text_content('#f-schritte'),
       '9: gesendet, keine Antwort: kein Download, «unklar» mit «Nochmals drucken» und «Datei»')
    s.evaluate("""window.fetch = function (u) { if (/default/.test(u)) return Promise.resolve({ ok: true, text: function () { return Promise.resolve(JSON.stringify({ uid: 'z1' })); } });
      return new Promise(function () {}); }; DL = []; 0""")
    s.click('#f-schritte button:text-is("Nochmals drucken")'); s.wait_for_timeout(10600)
    ok(s.evaluate('DL.length') == 0 and 'Unklar' in s.text_content('#hinweis'), '9: Zeitüberschreitung nach dem Senden: kein Download')
    # 2: Warnung «nicht gespeichert» bleibt als stop stehen
    s.evaluate("""$('hinweis').hidden = true; window.fetch = function () { return Promise.reject(new TypeError('Failed to fetch')); };
      H.etikette = function () { return { ok: { nr: '50000002', sendung: '99.60.9', daten: 'XlhBXlha', typ: 'zpl', name: 'Etikette 50000002.zpl', nichtGespeichert: true, warnungen: 'Sendungsnummer 99.60.9 nicht gespeichert (Verkauf weg).' } }; }; DL = []; 0""")
    s.evaluate("etikette('50000002', true)"); s.wait_for_timeout(500)
    ok('nicht gespeichert' in s.text_content('#hinweis') and s.get_attribute('#hinweis', 'class') == 'stop' and s.evaluate('DL.length') == 1, '2: Warnung bleibt als «stop» sichtbar, auch nach der Druckmeldung')
    s.wait_for_timeout(6500)
    ok(s.is_visible('#hinweis') and 'nicht gespeichert' in s.text_content('#hinweis'), '2: Warnung verschwindet nicht von selbst')
    # 1: PDF (Vorgabe) wird heruntergeladen
    s.evaluate("H.etikette = function () { return { ok: { nr: '50000002', sendung: '99.60.10', daten: 'JVBERi0xLjQK', pdf: 'JVBERi0xLjQK', typ: 'pdf', name: 'Etikette 50000002.pdf' } }; }; DL = []; $('hinweis').hidden = true; etikette('50000002', true)")
    s.wait_for_timeout(300)
    ok(s.evaluate('DL.length') == 1 and s.evaluate('DL[0].name') == 'Etikette 50000002.pdf', '1: PDF (Vorgabe) heruntergeladen')

    # ---------- 11: Archiv ohne Kopf im Admin › Betrieb ----------
    s.evaluate("D.adminBetrieb.archivOhneKopf = [{ tab: 'Archiv Kaputt', seit: '24.10.2026 10:00' }]; zeichneBetrieb(D.adminBetrieb); 0")
    ok('Archiv Kaputt' in s.text_content('#adm-status'), '11: Admin › Betrieb zeigt den Archiv-Tab ohne Kopfzeile')
    ok(not err, 'keine JS-Fehler ' + str(err))
    b.close()
print('alle Tests ok' if not fehler else str(fehler) + ' Fehler')
raise SystemExit(1 if fehler else 0)
