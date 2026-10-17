import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))  # Pfade relativ zu tests/
"""Ricardo Tool: Admin mit Betrieb, Kennzahlen, Einstellungen, Storno, Feedback; Feedback-Knopf. Erfundene Daten. Lauf: python3 tests/t_ricardo_admin_ui.py [ordner für bilder]"""
import json, pathlib, sys
from playwright.sync_api import sync_playwright
html = (pathlib.Path(__file__).parent.parent / 'apps/ricardo/Index.html').read_text().replace('<?!= JSON.stringify(lang) ?>', '"de"')
AUS = sys.argv[1] if len(sys.argv) > 1 else None
P = {'verkaeufe': 3, 'storniert': 1, 'umsatz': 1234.5, 'auszahlung': 1080, 'schnitt': 40, 'vomNeupreis': 42, 'angeboten': 10, 'verkauft': 6, 'nichtVerkauft': 3, 'laufend': 1, 'verkaufsquote': 67, 'retouren': 1, 'retourenquote': 33}
L0 = dict(P, verkaeufe=0, storniert=0, umsatz=0, auszahlung=0, schnitt=None, vomNeupreis=None, angeboten=0, verkauft=0, nichtVerkauft=0, laufend=0, verkaufsquote=None, retouren=0, retourenquote=None)
KZ = {'von': '2026-10-05', 'bis': '2026-10-17', 'einheit': 'woche', 'zeitraum': P, 'seit': '05.10.2026',
      'grades': [{'grade': 'A', 'angeboten': 4, 'anteil': 40, 'verkauft': 3, 'nichtVerkauft': 1, 'verkaufsquote': 75, 'vomNeupreis': 55}, {'grade': 'C', 'angeboten': 6, 'anteil': 60, 'verkauft': 3, 'nichtVerkauft': 2, 'verkaufsquote': 60, 'vomNeupreis': 30}],
      'verlauf': [dict(P, name='2026-10-05'), dict(P, name='2026-10-12')]}
LEER = dict(KZ, zeitraum=L0, grades=[], verlauf=[])
FB = [{'r': 2, 'zeit': '16.10.2026 09:00', 'person': 'xx@pretty-good.ch', 'bereich': 'verkauf', 'text': 'Knopf fehlt', 'status': 'Neu'}]
DATEN = {'startDaten': {'version': 't', 'admin': True, 'zustaende': [], 'maengelPflicht': [], 'laufzeit': 6, 'retoureGruende': [], 'kiAktiv': True, 'mailAktiv': True, 'aktiv': 3, 'schwelle': 90},
         'analyseListe': [], 'verkaeufe': {'offen': []}, 'retouren': {'offen': []}, 'mailsJetzt': {'anzahl': 0, 'verpasst': 0, 'kontrolle': {'aktiv': True, 'letzte': '', 'warnung': False, 'unecht': 0}, 'angebote': [], 'fragen': [], 'zahlung': []}, 'adminBetrieb': {'ki': True, 'ausloeser': True, 'url': 'https://docs.google.com/x', 'mail': {'aktiv': True, 'letzte': '16.10. 21:42', 'warnung': True, 'unecht': 2}, 'jetzt': {'gelistet': 12, 'zuPacken': 2, 'zahlungOffen': 1, 'zahlTage': 3}},
         'verbindungTest': [{'name': 'Return Tool', 'ok': True, 'detail': 'gelesen', 'sek': 0.4}, {'name': 'Claude', 'ok': False, 'detail': 'Schlüssel fehlt', 'sek': 0}],
         'kzVoll': KZ, 'kzLeer': LEER, 'adminEinstellungen': [{'name': 'Admins', 'wert': 'xx@pretty-good.ch', 'hilfe': 'Wer Admin ist'}], 'adminSuche': {'listings': [], 'verkaeufe': []},
         'feedbackListe': FB, 'feedbackStatus': [dict(FB[0], status='Erledigt')], 'feedback': True}
stub = """<script>window.AUFRUFE=[];window.google={script:{run:(function mk(ok,fail){return new Proxy({},{get:function(_,k){
 if(k==='withSuccessHandler')return function(f){return mk(f,fail)}; if(k==='withFailureHandler')return function(f){return mk(ok,f)};
 return function(l,name,args){AUFRUFE.push([name,args]);var D=%s;if(name==='kennzahlen')name=args[0]===''?'kzVoll':'kzLeer';setTimeout(function(){ok&&ok(JSON.parse(JSON.stringify(name in D?D[name]:{})))},5)}}})})()}};</script>""" % json.dumps(DATEN)
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
    for x in ['Laufende Angebote', '12', 'Zahlung offen seit 3+ Tagen']: assert x in st, x
    bild(s, 'ricardo_betrieb')
    assert [x.strip() for x in s.eval_on_selector_all('#adm-reiter button', 'l => l.map(b => b.textContent)')][-1] == 'Einstellungen'
    s.click('#adm-reiter button:nth-child(2)'); s.wait_for_timeout(150)
    a = s.evaluate("AUFRUFE.filter(function(a){return a[0]==='kennzahlen'}).pop()[1]")
    assert a[0].endswith('-01'), a                       # Standard: dieser Monat
    assert 'Keine Verkäufe' in s.text_content('#adm-kennzahlen')
    s.click("button[onclick=\"zrArt('alles')\"]"); s.wait_for_timeout(100)
    t = s.text_content('#adm-kennzahlen')
    for x in ["1'234.50", "1'080.00", '67%', '10 angeboten: 6 verkauft, 3 nicht verkauft, 1 laufen noch', '42%', 'A · Neu und originalverpackt', 'C · Gebraucht', '60%', 'KW 41', 'Total', 'ohne Porto', 'seit 05.10.2026']: assert x in t, x
    assert 'Laufende Angebote' not in t
    bild(s, 'ricardo_kennzahlen')
    s.click("button[onclick=\"zrArt('woche')\"]"); s.wait_for_timeout(100)
    a = s.evaluate("AUFRUFE.filter(function(a){return a[0]==='kennzahlen'}).pop()[1]")
    import datetime as dt
    assert dt.date.fromisoformat(a[0]).weekday() == 0 and (dt.date.fromisoformat(a[1]) - dt.date.fromisoformat(a[0])).days == 6, a
    s.click('#adm-reiter button:nth-child(3)'); s.wait_for_timeout(100)
    assert s.is_visible('#ad-q')
    s.click('#adm-reiter button:nth-child(4)'); s.wait_for_timeout(100)
    assert 'Knopf fehlt' in s.text_content('#af-liste')
    s.click('#af-liste button:nth-child(2)'); s.wait_for_timeout(50)
    assert s.evaluate("AUFRUFE.filter(function(a){return a[0]==='feedbackStatus'})[0][1]") == [2, 'Knopf fehlt', 'Erledigt']
    s.click('#adm-reiter button:nth-child(5)'); s.wait_for_timeout(100)
    assert 'Admins' in s.text_content('#ad-einst')
    # Feedback-Knopf
    s.click('.fb-auf'); s.fill('#fb-text', 'Idee: Etiketten grösser'); s.click('#fb .haupt-knopf'); s.wait_for_timeout(50)
    assert s.evaluate("AUFRUFE.filter(function(a){return a[0]==='feedback'})[0][1]") == ['Idee: Etiketten grösser', 'admin']
    assert s.is_hidden('#fb')
    b.close()
assert not err, err
print('t_ricardo_admin_ui ok')
