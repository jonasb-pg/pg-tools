import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))  # Pfade relativ zu tests/
# Admin (Betrieb, Kennzahlen, Feedback), Startzeile Warteschlange, Bestellliste, Anmeldung pro Tag. Erfundene Kürzel und Produkte.
import json, sys
from playwright.sync_api import sync_playwright
html = open('../apps/analyse/Index.html', encoding='utf8').read()
AUS = sys.argv[1] if len(sys.argv) > 1 else None
P = lambda **k: dict({'analysen': 0, 'schichten': 0, 'schichtStunden': 0, 'imBudget': None, 'abweichung': None, 'dauer': None, 'budget': None, 'proSchicht': None, 'proStundeNetto': None, 'proStundeBrutto': None, 'schichtDauer': None, 'ergebnis': {'reuse': 0, 'ricardo': 0, 'matchmaker': 0, 'nicht': 0}, 'reparatur': 0}, **k)
voll = P(analysen=40, schichten=5, schichtStunden=32.5, imBudget=68, abweichung=2.4, dauer=14.1, budget=11.7, proSchicht=8, proStundeNetto=4.3, proStundeBrutto=1.2, schichtDauer=6.5, ergebnis={'reuse': 20, 'ricardo': 8, 'matchmaker': 4, 'nicht': 8}, reparatur=3)
KZ = {'von': '2026-10-05', 'bis': '2026-10-17', 'einheit': 'woche', 'zeitraum': voll, 'seit': '12.10.2026',
      'verlauf': [dict(voll, name='2026-10-05'), dict(voll, name='2026-10-12')], 'personen': [dict(voll, name='XX'), dict(voll, name='YY', analysen=10)]}
LEER = dict(KZ, zeitraum=P(), verlauf=[], personen=[])
ADM = {'budget': 150, 'verbraucht': '140.00', 'ki': True, 'url': 'https://docs.google.com/x', 'importAn': True, 'ausloeser': True, 'batches': [],
       'schlange': {'zahlen': {'offen': 12, 'bereit': 9, 'laeuft': 3, 'fehler': 0}, 'liste': [{'id': 'PG-1', 'bezeichnung': 'Testgerät A', 'kategorie': 'Home', 'ovp': 50, 'recherche': 'Bereit', 'status': 'Offen', 'budget': 15}], 'zuletzt': '17.10.2026 07:00'}}
BS = [{'r': 2, 'zeit': '16.10.2026 10:00:00', 'id': 'PG-1', 'produkt': 'Testgerät A', 'was': 'Akku tauschen', 'teil': 'Akku X1', 'nummer': 'A-1', 'shop': 'Shop Eins', 'preis': 19.9, 'link': 'https://example.com/a', 'kuerzel': 'XX', 'status': 'Offen'},
      {'r': 3, 'zeit': '16.10.2026 11:00:00', 'id': 'PG-2', 'produkt': 'Testgerät B', 'was': 'Filter', 'teil': 'Filter F', 'nummer': '', 'shop': 'Shop Eins', 'preis': 5.1, 'link': '', 'kuerzel': 'YY', 'status': 'Offen'},
      {'r': 4, 'zeit': '15.10.2026 11:00:00', 'id': 'PG-3', 'produkt': 'Testgerät C', 'was': 'Kabel', 'teil': 'Kabel K', 'nummer': '', 'shop': '', 'preis': None, 'link': '', 'kuerzel': 'YY', 'status': 'Bestellt'}]
FB = [{'r': 2, 'zeit': '16.10.2026 09:00:00', 'kuerzel': 'XX', 'id': 'PG-1', 'schritt': 'Funktion', 'text': 'Schritt unklar', 'status': 'Erledigt'},
      {'r': 3, 'zeit': '16.10.2026 10:00:00', 'kuerzel': 'YY', 'id': '', 'schritt': '', 'text': 'Idee: grössere Knöpfe', 'status': 'Neu'}]
stub = """<script>window.CALLS=[];window.ARGS={};window.google={script:{url:{getLocation:function(cb){}},run:(function(){var ok;var o={withSuccessHandler:function(f){ok=f;return o},withFailureHandler:function(){return o},api:function(l,n,a){CALLS.push(n);ARGS[n]=a;var f=ok;
var D={startDaten:{version:'x',admin:true,zahlen:{offen:12,bereit:9,laeuft:3,fehler:0},listen:{kategorie:[]},reparatur:[]},adminDaten:%s,kennzahlen:null,bestellliste:%s,bestellStatus:%s,feedbackListe:%s,feedbackStatus:%s,anmelden:true};
if(n==='kennzahlen')D[n]=a[0]===''?%s:%s;if(n in D)setTimeout(function(){f(D[n])},5);
}};return o;})()}};</script>""" % (json.dumps(ADM), json.dumps(BS), json.dumps(BS), json.dumps(FB), json.dumps(FB), json.dumps(KZ), json.dumps(LEER))
html = html.replace('<head>', '<head>' + stub, 1)
err = []
def bild(pg, n):
    if AUS: pg.screenshot(path=AUS + '/' + n + '.png', full_page=True)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1300, 'height': 1000})
    pg.on('pageerror', lambda e: err.append(str(e)))
    pg.route('http://app.test/', lambda r: r.fulfill(body=html, content_type='text/html; charset=utf-8'))
    # Kürzel von gestern gilt nicht mehr: Start erscheint, Anmeldung wird gemeldet
    pg.goto('http://app.test/'); pg.evaluate("localStorage.setItem('at-kuerzel','XX');localStorage.setItem('at-kuerzel-tag','2000-1-1')"); pg.reload(); pg.wait_for_timeout(300)
    assert not pg.is_hidden('#start'), 'Start fehlt bei altem Kürzel'
    pg.fill('#kuerzel', 'xx'); pg.click('button[data-a=sessionStart]'); pg.wait_for_timeout(100)
    assert pg.evaluate('ARGS.anmelden') == ['XX']
    pg.reload(); pg.wait_for_timeout(300)
    assert pg.is_hidden('#start'), 'heute angemeldet: kein Start'
    assert pg.evaluate("CALLS.filter(function(c){return c==='anmelden'}).length") == 0
    # Startseite: keine Warteschlange in der Navigation, eine Zeile auf der Startseite
    assert pg.query_selector('#nav-liste') is None
    assert '9 Stücke bereit' in pg.inner_text('#schlange-info'), pg.inner_text('#schlange-info')
    assert pg.is_visible('#nav-werkstatt') and pg.is_visible('#nav-sektion2')
    # Admin › Betrieb
    pg.click('#nav-admin'); pg.wait_for_timeout(150)
    assert 'Testgerät A' in pg.inner_text('#liste'); assert 'USD 140.00 von 150' in pg.inner_text('#adm-status')
    assert pg.query_selector('#adm-status .meldung.warn') is not None, 'Budget über 90% markiert'
    bild(pg, 'admin_betrieb')
    # Kennzahlen
    pg.click('button[data-a=admTab][data-v=kennzahlen]'); pg.wait_for_timeout(150)
    # Standard: diese Woche (Montag bis Sonntag), leer
    v, bi = pg.evaluate('ARGS.kennzahlen'); import datetime as dt
    assert (dt.date.fromisoformat(bi) - dt.date.fromisoformat(v)).days == 6 and dt.date.fromisoformat(v).weekday() == 0, (v, bi)
    assert 'Keine Analysen' in pg.inner_text('#adm-kennzahlen') and 'KW ' in pg.inner_text('#adm-kennzahlen')
    assert pg.is_hidden('#adm-betrieb')
    pg.click('button[data-a=zrSchritt][data-v="-1"]'); pg.wait_for_timeout(80)
    assert pg.evaluate('ARGS.kennzahlen')[0] == str(dt.date.fromisoformat(v) - dt.timedelta(days=7))
    pg.click('button[data-a=zrArt][data-v=monat]'); pg.wait_for_timeout(80)
    assert pg.evaluate('ARGS.kennzahlen')[0].endswith('-01')
    pg.click('button[data-a=zrArt][data-v=alles]'); pg.wait_for_timeout(80)
    assert pg.evaluate('ARGS.kennzahlen') == ['', '']
    t = pg.text_content('#adm-kennzahlen')
    for x in ['1.2', '40 Analysen in 32.5 Schichtstunden', '68%', '80%', '32 von 40', 'Matchmaker', '10%', 'KW 41', 'KW 42', 'XX', 'YY', 'seit 12.10.2026', 'Total']: assert x in t, x
    for x in ['Trefferquote', 'Pro Stufe', 'Pro Kategorie', 'netto']: assert x not in t, x
    bild(pg, 'admin_kennzahlen')
    pg.click('button[data-a=zrArt][data-v=eigen]'); pg.wait_for_timeout(80)
    pg.fill('#zr-von', '2026-10-20'); pg.fill('#zr-bis', '2026-10-01'); pg.click('button[data-a=zrEigen]'); pg.wait_for_timeout(80)
    assert pg.evaluate('ARGS.kennzahlen') == ['2026-10-01', '2026-10-20']     # vertauscht wird gedreht
    # Feedback: Neu zuerst, Status setzen
    pg.click('button[data-a=admTab][data-v=feedback]'); pg.wait_for_timeout(150)
    assert pg.inner_text('#af-liste').index('grössere Knöpfe') < pg.inner_text('#af-liste').index('Schritt unklar')
    pg.click('button[data-a=afSetz][data-k="1"][data-v=Erledigt]'); pg.wait_for_timeout(50)
    assert pg.evaluate('ARGS.feedbackStatus') == [3, 'Idee: grössere Knöpfe', 'Erledigt']
    bild(pg, 'admin_feedback')
    # Ersatzteile: Bestellliste nach Shop, Ergebniskarte erst nach einer Suche
    pg.click('#nav-teile'); pg.wait_for_timeout(150)
    assert pg.is_hidden('#teile-karte')
    tb = pg.text_content('#bestell')
    assert 'Shop Eins' in tb and 'Total CHF 25.00' in tb and 'Bestellt, noch nicht da' in tb, tb
    pg.click('button[data-a=bestellSetz][data-k="0"][data-v=Bestellt]'); pg.wait_for_timeout(50)
    assert pg.evaluate('ARGS.bestellStatus') == [2, 'PG-1', 'Bestellt', 'XX']
    bild(pg, 'ersatzteile')
    # Infrastruktur bleibt
    assert pg.is_visible('#nav-werkstatt')
    pg.set_viewport_size({'width': 390, 'height': 800}); pg.click('#nav-admin') if pg.is_visible('#nav-admin') else None
    b.close()
assert not err, err
print('t_admin_ui ok')
