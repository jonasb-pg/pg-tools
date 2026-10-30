"""Heilsarmee Tool 1.0.0: Oberfläche mit Schein-Server (google.script.run). Erfundene Daten. Lauf: python3 tests/t_heilsarmee_ui.py"""
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
  getBootstrap: () => ({version:'1.0.0',prozentNeu:.5,prozentGebraucht:.75,stufen:[1.9,2.9,4.9,6.9,9.9,14.9,18.9,24.9,29.9,39,49,59],lots:LOTS,user:''}),
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
    check('Gebraucht: 75% von 39 = 29.90', pg.inner_text('#preisGross') == '29.90')
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
    check('Von Hand: Name vorausgefüllt', pg.input_value('#hBez') == 'Unbekanntes Ding')
    pg.click('#btnGebraucht')
    check('Ohne OVP kein Preis', pg.is_disabled('#btnUebernehmen'))
    pg.fill('#hOvp', '20')
    check('Gebraucht 75% von 20 = 14.90', pg.inner_text('#preisGross') == '14.90')
    pg.click('#btnUebernehmen'); pg.wait_for_selector('#screen-lot.active')
    check('Von Hand gespeichert', pg.evaluate('SAVES')[-1]['quelle'] == 'Von Hand' and pg.evaluate('SAVES')[-1]['ovp'] == 20)
    pg.click('#btnAbschliessen'); pg.wait_for_selector('#screen-fertig.active')
    check('Abschluss mit Hinweis Prüfen', 'abgeschlossen' in pg.inner_text('#fertigText') and 'prüfen' in pg.inner_text('#fertigText'))
    b.close()
print(('%d Fehler' % len(fehler)) if fehler else 'Alle UI-Checks bestanden')
sys.exit(1 if fehler else 0)
