"""Heilsarmee Tool (DE/EN, Kamera-Scan): Oberfläche mit Schein-Server (google.script.run). Erfundene Daten. Lauf: python3 tests/t_heilsarmee_ui.py"""
import os, sys
from playwright.sync_api import sync_playwright

HTML = open(os.path.join(os.path.dirname(__file__), '..', 'apps', 'heilsarmee', 'Index.html'), encoding='utf-8').read()
MOCK = """
<script>
window.SAVES = []; window.STUECKE = []; window.LOTS = [{lot:'BRO-1',status:'Offen',eroeffnet:'30.10.2026 18:00',stuecke:0,summe:0}];
const DB = [{id:'PG-100',bez:'Testmarke Speiseteller',menge:1,ean:'7612345678901',ovp:39,ort:'HEI-1',vergeben:''},
            {id:'PG-101',bez:'Beispiel Lampe',menge:1,ean:'7612345678918',ovp:118,ort:'HEI-1',vergeben:''},
            {id:'PG-102',bez:'Beispiel Lampe',menge:1,ean:'7612345678918',ovp:118,ort:'HEI-1',vergeben:'BRO-1/9 (BRO-1)'}];
const API = {
  getBootstrap: () => ({version:'1.0.0',rabattNeu:.5,rabattGebraucht:.75,stufen:[1.9,2.9,4.9,6.9,9.9,14.9,18.9,24.9,29.9,39,49,59],lots:LOTS,user:''}),
  neuesLot: () => { LOTS.unshift({lot:'BRO-2',status:'Offen',eroeffnet:'',stuecke:0,summe:0}); return {lot:'BRO-2',lots:LOTS}; },
  lotStuecke: () => STUECKE,
  suche: (q) => ({treffer: DB.filter(x => x.ean === q || x.id.toLowerCase() === q.toLowerCase() || x.bez.toLowerCase().includes(q.toLowerCase()))}),
  stueckSpeichern: (p) => { SAVES.push(p); const pos = p.lot + '/' + (STUECKE.length + 1); STUECKE.unshift({pos, bez:p.bez, menge:p.menge, zustand:p.zustand, ovp:p.ovp, preis:p.preis || (p.zustand==='Neu'?18.9:29.9)}); return {pos, preis: STUECKE[0].preis, stuecke: STUECKE}; },
  stueckLoeschen: (pos) => { STUECKE = STUECKE.filter(x => x.pos !== pos); return {stuecke: STUECKE}; },
  lotAbschliessen: (lot) => ({tab:lot,url:'#',stuecke:STUECKE.length,summeOvp:39,summePreis:18.9,pruefen:1,lots:LOTS}),
};
window.google = {script: {run: (function mk(ok, ko) { return new Proxy({}, {get: (t, k) => {
  if (k === 'withSuccessHandler') return (f) => mk(f, ko);
  if (k === 'withFailureHandler') return (f) => mk(ok, f);
  return (...a) => setTimeout(() => { try { ok(API[k](...a)); } catch (e) { ko(e); } }, 5);
}}); })(null, null)}};
localStorage.setItem('ha.name', JSON.stringify('Tester'));
</script>
"""
fehler = []
def check(name, cond):
    print(('OK   ' if cond else 'FAIL ') + name)
    if not cond: fehler.append(name)

with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844})
    pg.on('dialog', lambda d: d.accept())
    pg.set_content(HTML.replace('<script>', MOCK + '<script>', 1))
    pg.wait_for_function("document.getElementById('busy').style.display === 'none'")
    check('Lots angezeigt', 'BRO-1' in pg.inner_text('#lotListe'))
    pg.click('text=BRO-1')
    check('Lot-Screen', pg.is_visible('#screen-lot') and pg.inner_text('#titel') == 'BRO-1')
    pg.fill('#q', '7612345678901'); pg.keyboard.press('Enter')
    pg.wait_for_selector('#screen-stueck.active')
    check('Scan mit einem Treffer: direkt zum Stück', 'Testmarke Speiseteller' in pg.inner_text('#stueckKopf'))
    check('Übernehmen gesperrt ohne Zustand', pg.is_disabled('#btnUebernehmen'))
    pg.click('#btnNeu')
    check('Neu: 50% von 39 = 18.90', pg.inner_text('#preisGross') == '18.90')
    pg.click('#btnGebraucht')
    check('Gebraucht: 75% Rabatt auf 39 = 9.90', pg.inner_text('#preisGross') == '9.90')
    check('Stufen-Knöpfe 6.90 / 14.90', pg.inner_text('#btnTiefer') == '‹ 6.90' and pg.inner_text('#btnHoeher') == '14.90 ›')
    pg.click('#btnHoeher')
    check('Höher: 14.90 von Hand', pg.inner_text('#preisGross') == '14.90' and pg.input_value('#preisHand') == '14.90' and pg.inner_text('#btnHoeher') == '18.90 ›')
    pg.click('#btnTiefer'); pg.click('#btnTiefer')
    check('Zweimal tiefer: 6.90', pg.inner_text('#preisGross') == '6.90')
    pg.fill('#preisHand', '')
    pg.click('#btnNeu')
    pg.click('#btnUebernehmen'); pg.wait_for_selector('#screen-lot.active')
    s = pg.evaluate('SAVES')
    check('Gespeichert mit Zustand Neu, ohne Preis von Hand', s[-1]['zustand'] == 'Neu' and s[-1]['preis'] is None and s[-1]['pgid'] == 'PG-100')
    check('Liste im Lot', 'BRO-1/1' in pg.inner_text('#stuecke'))
    pg.fill('#q', '7612345678918'); pg.click('text=Suchen')
    pg.wait_for_selector('#screen-stueck.active')
    check('Gleiche EAN zweimal, eine frei: direkt das freie Stück', 'PG-101' in pg.inner_text('#stueckKopf'))
    pg.click('#btnNeu')
    check('118 Neu = 59', pg.inner_text('#preisGross') == '59.00')
    pg.fill('#preisHand', '49')
    check('Preis von Hand', pg.inner_text('#preisGross') == '49.00' and 'Von Hand' in pg.inner_text('#preisInfo'))
    pg.click('#btnUebernehmen'); pg.wait_for_selector('#screen-lot.active')
    check('Preis von Hand gesendet', pg.evaluate('SAVES')[-1]['preis'] == 49)
    pg.fill('#q', 'Unbekanntes Ding'); pg.click('text=Suchen'); pg.wait_for_selector('#treffer .note')
    pg.click('text=Nicht gefunden? Von Hand erfassen')
    pg.wait_for_function("document.activeElement.id === 'hBez'")   # Fokus springt nach 50 ms ins Namensfeld: erst danach tippen
    check('Von Hand: Name vorausgefüllt', pg.input_value('#hBez') == 'Unbekanntes Ding')
    pg.click('#btnGebraucht')
    check('Ohne OVP kein Preis', pg.is_disabled('#btnUebernehmen'))
    pg.fill('#hOvp', '20')
    check('Gebraucht 75% Rabatt auf 20 = 4.90', pg.inner_text('#preisGross') == '4.90')
    pg.click('#btnUebernehmen'); pg.wait_for_selector('#screen-lot.active')
    check('Von Hand gespeichert', pg.evaluate('SAVES')[-1]['quelle'] == 'Von Hand' and pg.evaluate('SAVES')[-1]['ovp'] == 20)
    pg.click('#btnAbschliessen'); pg.wait_for_selector('#screen-fertig.active')
    check('Abschluss mit Hinweis Prüfen', 'abgeschlossen' in pg.inner_text('#fertigText') and 'prüfen' in pg.inner_text('#fertigText'))
    check('DE aktiv markiert', 'on' in pg.get_attribute('#lgDE', 'class') and 'on' not in (pg.get_attribute('#lgEN', 'class') or ''))
    # Englisch (Jonas B. 02.11.2026)
    pg.click('#lgEN')
    check('EN: Knopf Fertig-Seite übersetzt', pg.inner_text('#screen-fertig .btn').upper() == 'BACK TO LOTS')
    pg.click('text=Back to lots')
    check('EN: Startseite', pg.inner_text('#btnNeuesLot').upper() == 'NEW LOT' and 'items' in pg.inner_text('#lotListe') and 'OPEN' in pg.inner_text('#lotListe').upper())
    check('EN: html lang', pg.evaluate('document.documentElement.lang') == 'en')
    pg.click('#lotListe button >> nth=0')
    check('EN: Lot-Screen', 'SCAN EAN' in pg.inner_text('#screen-lot').upper() and 'Not found? Enter by hand' in pg.inner_text('#screen-lot') and pg.inner_text('#btnZurueck') == 'Back')
    pg.fill('#q', 'Nichts'); pg.click('#screen-lot .btn.primary'); pg.wait_for_selector('#treffer .note')
    check('EN: nichts gefunden', 'Nothing found' in pg.inner_text('#treffer'))
    pg.fill('#q', 'Beispiel Lampe'); pg.click('#screen-lot .btn.primary'); pg.wait_for_selector('#treffer .btn')
    check('EN: Trefferliste', 'already in' in pg.inner_text('#treffer') and 'Orig.' in pg.inner_text('#treffer'))
    pg.click('#lgDE')
    check('DE zurück: Treffer neu gezeichnet', 'schon in' in pg.inner_text('#treffer') and 'SUCHEN' in pg.inner_text('#screen-lot').upper())
    pg.click('#lgEN')
    pg.click('#treffer .btn >> nth=0'); pg.wait_for_selector('#screen-stueck.active')
    pg.click('#btnGebraucht')
    check('EN: Zustand und Preis-Info', pg.inner_text('#btnNeu').upper() == 'NEW' and pg.inner_text('#btnGebraucht').upper() == 'USED' and 'discount on original price' in pg.inner_text('#preisInfo'))
    pg.click('#lgDE')
    check('Umschalten mitten im Stück: Zustand bleibt, Text deutsch', '75% Rabatt auf OVP' in pg.inner_text('#preisInfo') and 'sel' in pg.get_attribute('#btnGebraucht', 'class'))
    pg.click('#lgEN')
    # Servermeldung übersetzt
    pg.evaluate("() => { API.stueckSpeichern = () => { throw new Error('Lot BRO-1 ist abgeschlossen.'); }; }")
    pg.click('#btnUebernehmen'); pg.wait_for_timeout(100)
    check('EN: Servermeldung übersetzt', pg.inner_text('#toast') == 'Lot BRO-1 is closed.')
    b.close()
    # Sprache bleibt gemerkt
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844})
    seite = HTML.replace('<script>', MOCK + '<script>', 1)
    pg.route('https://heilsarmee.test/', lambda r: r.fulfill(status=200, content_type='text/html; charset=utf-8', body=seite))
    pg.goto('https://heilsarmee.test/'); pg.wait_for_function("document.getElementById('busy').style.display === 'none'")
    pg.click('#lgEN'); pg.reload(); pg.wait_for_function("document.getElementById('busy').style.display === 'none'")
    check('Gemerkte Sprache EN beim Start', pg.inner_text('#btnNeuesLot').upper() == 'NEW LOT')
    check('Kopfzeile passt auf 390 px', pg.evaluate("document.documentElement.scrollWidth <= 390"))
    b.close()
    # Kamera-Scan (02.11.2026): Live-Bild mit Schein-Kamera und Schein-BarcodeDetector
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844})
    KAMMOCK = """<script>
window.DETECTS = 0;
window.BarcodeDetector = class { constructor(o) { this.o = o; } detect(src) { DETECTS++; return Promise.resolve(src instanceof HTMLImageElement || DETECTS > 3 ? [{rawValue: window.SCANCODE}] : []); } };
window.SCANCODE = '7612345678901';
navigator.mediaDevices.getUserMedia = (c) => { window.KAMWUNSCH = c; if (window.KAMVERBOT) return Promise.reject(new Error('NotAllowed'));
  const cv = document.createElement('canvas'); cv.width = 320; cv.height = 240; const x = cv.getContext('2d'); setInterval(() => { x.fillStyle = '#' + Math.floor(Math.random()*999); x.fillRect(0,0,320,240); }, 50);
  return Promise.resolve(cv.captureStream(10)); };
</script>"""
    seite2 = HTML.replace('<script>', MOCK + KAMMOCK + '<script>', 1)
    pg.route('https://heilsarmee.test/', lambda r: r.fulfill(status=200, content_type='text/html; charset=utf-8', body=seite2))
    pg.goto('https://heilsarmee.test/')
    pg.wait_for_function("document.getElementById('busy').style.display === 'none'")
    pg.click('text=BRO-1')
    check('Kamera-Knopf neben dem Suchfeld', pg.is_visible('#btnKamera') and pg.inner_text('#btnKamera').upper() == 'KAMERA')
    check('Suchfeld und Kamera passen auf 390 px', pg.evaluate("document.documentElement.scrollWidth <= 390"))
    pg.click('#btnKamera')
    pg.wait_for_selector('#screen-stueck.active', timeout=5000)
    check('Live-Scan: Treffer öffnet das Stück', 'Testmarke Speiseteller' in pg.inner_text('#stueckKopf'))
    check('Rückkamera verlangt', pg.evaluate("KAMWUNSCH.video.facingMode.ideal") == 'environment')
    check('Kamera nach Treffer zu, Stream gestoppt', pg.evaluate("document.getElementById('kamera').hidden && !KAM.an && !KAM.stream && !document.body.classList.contains('kam')"))
    pg.click('#lgEN'); pg.evaluate("zeige('lot')")
    check('EN: Camera', pg.inner_text('#btnKamera').upper() == 'CAMERA')
    pg.click('#btnKamera'); pg.wait_for_selector('#kamera video')
    check('EN: Hinweis und Schliessen', 'Hold the barcode' in pg.inner_text('#kamera') and 'CLOSE' in pg.inner_text('#kamera').upper())
    pg.click('#kamera .btn')
    check('Schliessen beendet die Kamera', pg.evaluate("document.getElementById('kamera').hidden && !KAM.an"))
    pg.click('#lgDE')
    # Keine Live-Kamera erlaubt: Foto-Kamera, Foto wird gelesen (ein freier Treffer: direkt zum Stück)
    pg.evaluate("() => { window.KAMVERBOT = true; window.SCANCODE = '7612345678918'; }")
    with pg.expect_file_chooser() as fc:
        pg.click('#btnKamera')
    png = bytes.fromhex('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360f8cf000000030101005bdd1b4f0000000049454e44ae426082')
    fc.value.set_files(files=[{'name': 'scan.png', 'mimeType': 'image/png', 'buffer': png}])
    pg.wait_for_function("document.getElementById('q').value === '7612345678918'")
    pg.wait_for_timeout(200)
    check('Foto-Scan: Code gesucht, einziger freier Treffer offen', pg.is_visible('#screen-stueck.active') and 'Beispiel Lampe' in pg.inner_text('#stueckKopf'))
    check('Foto-Scan: Hinweis auf Foto-Kamera', 'Foto-Kamera' in pg.inner_text('#toast'))
    b.close()
print(('%d Fehler' % len(fehler)) if fehler else 'Alle UI-Checks bestanden')
sys.exit(1 if fehler else 0)
