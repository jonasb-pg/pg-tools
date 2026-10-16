import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))  # Pfade relativ zu tests/
"""Ricardo Tool: Admin mit Betrieb, Kennzahlen, Einstellungen, Storno, Feedback; Feedback-Knopf. Erfundene Daten. Lauf: python3 tests/t_ricardo_admin_ui.py [ordner für bilder]"""
import json, pathlib, sys
from playwright.sync_api import sync_playwright
html = (pathlib.Path(__file__).parent.parent / 'apps/ricardo/Index.html').read_text().replace('<?!= JSON.stringify(lang) ?>', '"de"')
AUS = sys.argv[1] if len(sys.argv) > 1 else None
P = {'verkaeufe': 3, 'storniert': 1, 'umsatz': 120, 'auszahlung': 104, 'schnitt': 40, 'verkaufsquote': 67, 'unverkauft': 1, 'tageBisVerkauf': 5.5, 'tageBisVersand': 2, 'retouren': 1, 'retourenquote': 33, 'preisvorschlaege': 2}
L0 = dict(P, verkaeufe=0, storniert=0, umsatz=0, auszahlung=0, schnitt=None, verkaufsquote=None, unverkauft=0, tageBisVerkauf=None, tageBisVersand=None, retouren=0, retourenquote=None, preisvorschlaege=0)
KZ = {'woche': L0, 'vierWochen': P, 'gesamt': P, 'jetzt': {'gelistet': 12, 'zuPacken': 2, 'zahlungOffen': 1, 'zahlTage': 3}, 'wochen': [{'name': '2026-10-12', 'verkaeufe': 3, 'umsatz': 120, 'auszahlung': 104}], 'seit': '12.10.2026'}
FB = [{'r': 2, 'zeit': '16.10.2026 09:00', 'person': 'xx@pretty-good.ch', 'bereich': 'verkauf', 'text': 'Knopf fehlt', 'status': 'Neu'}]
DATEN = {'startDaten': {'version': 't', 'admin': True, 'zustaende': [], 'maengelPflicht': [], 'laufzeit': 6, 'retoureGruende': [], 'kiAktiv': True, 'mailAktiv': True, 'aktiv': 3, 'schwelle': 90},
         'analyseListe': [], 'verkaeufe': {'offen': []}, 'retouren': {'offen': []}, 'mailsJetzt': {'anzahl': 0, 'verpasst': 0, 'kontrolle': {'aktiv': True, 'letzte': '', 'warnung': False, 'unecht': 0}, 'angebote': [], 'fragen': [], 'zahlung': []}, 'adminBetrieb': {'ki': True, 'ausloeser': True, 'url': 'https://docs.google.com/x', 'mail': {'aktiv': True, 'letzte': '16.10. 21:42', 'warnung': True, 'unecht': 2}},
         'verbindungTest': [{'name': 'Return Tool', 'ok': True, 'detail': 'gelesen', 'sek': 0.4}, {'name': 'Claude', 'ok': False, 'detail': 'Schlüssel fehlt', 'sek': 0}],
         'kennzahlen': KZ, 'adminEinstellungen': [{'name': 'Admins', 'wert': 'xx@pretty-good.ch', 'hilfe': 'Wer Admin ist'}], 'adminSuche': {'listings': [], 'verkaeufe': []},
         'feedbackListe': FB, 'feedbackStatus': [dict(FB[0], status='Erledigt')], 'feedback': True}
stub = """<script>window.AUFRUFE=[];window.google={script:{run:(function mk(ok,fail){return new Proxy({},{get:function(_,k){
 if(k==='withSuccessHandler')return function(f){return mk(f,fail)}; if(k==='withFailureHandler')return function(f){return mk(ok,f)};
 return function(l,name,args){AUFRUFE.push([name,args]);var D=%s;setTimeout(function(){ok&&ok(JSON.parse(JSON.stringify(name in D?D[name]:{})))},5)}}})})()}};</script>""" % json.dumps(DATEN)
html = html.replace('<head>', '<head>' + stub, 1)
def bild(s, n):
    if AUS: s.screenshot(path=AUS + '/' + n + '.png', full_page=True)
with sync_playwright() as p:
    b = p.chromium.launch(); s = b.new_page(viewport={'width': 1300, 'height': 1000}); err = []
    s.on('pageerror', lambda e: err.append(str(e) + ' ' + str(e.stack)[:300]))
    s.set_content(html); s.wait_for_timeout(300)
    s.click('#nav-admin'); s.wait_for_timeout(150)
    st = s.text_content('#adm-status')
    assert 'Letzte Mail: 16.10. 21:42' in st and 'Seit über 6 Stunden' in st and '2 Mails' in st, st
    s.click('#adm-knopf'); s.wait_for_timeout(100)
    assert 'Schlüssel fehlt' in s.text_content('#adm-test')
    bild(s, 'ricardo_betrieb')
    s.click('#adm-reiter button:nth-child(2)'); s.wait_for_timeout(150)
    t = s.text_content('#adm-kennzahlen')
    for x in ['67%', '120.00', 'Auszahlung CHF 104.00', 'Ø 5.5 Tage', '33%', '12', 'Zahlung offen seit 3+ Tagen', '12.10.2026']: assert x in t, x
    bild(s, 'ricardo_kennzahlen')
    s.click("button[onclick=\"kzZeit('woche')\"]"); s.wait_for_timeout(50)
    assert 'Noch keine Verkäufe' in s.text_content('#adm-kennzahlen')
    s.click('#adm-reiter button:nth-child(3)'); s.wait_for_timeout(100)
    assert 'Admins' in s.text_content('#ad-einst')
    s.click('#adm-reiter button:nth-child(4)'); s.wait_for_timeout(100)
    assert s.is_visible('#ad-q')
    s.click('#adm-reiter button:nth-child(5)'); s.wait_for_timeout(100)
    assert 'Knopf fehlt' in s.text_content('#af-liste')
    s.click('#af-liste button:nth-child(2)'); s.wait_for_timeout(50)
    assert s.evaluate("AUFRUFE.filter(function(a){return a[0]==='feedbackStatus'})[0][1]") == [2, 'Knopf fehlt', 'Erledigt']
    # Feedback-Knopf
    s.click('.fb-auf'); s.fill('#fb-text', 'Idee: Etiketten grösser'); s.click('#fb .haupt-knopf'); s.wait_for_timeout(50)
    assert s.evaluate("AUFRUFE.filter(function(a){return a[0]==='feedback'})[0][1]") == ['Idee: Etiketten grösser', 'admin']
    assert s.is_hidden('#fb')
    b.close()
assert not err, err
print('t_ricardo_admin_ui ok')
