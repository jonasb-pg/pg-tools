import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))  # Pfade relativ zu tests/
"""Ricardo Tool Oberfläche mit Stub: Liste «Aus der Analyse», Analyse-Modus gesperrt, Text wiederherstellen. Lauf: python3 tests/t_ricardo_ui.py"""
import json, pathlib, re
from playwright.sync_api import sync_playwright
html = (pathlib.Path(__file__).parent.parent / 'apps/ricardo/Index.html').read_text().replace('<?!= JSON.stringify(lang) ?>', '"de"')
R = {'id': 'PG-100', 'status': 'Bereit', 'ean': '076', 'bezeichnung': 'Toaster X', 'neupreis': 80, 'startpreis': '40.00', 'lagerort': '', 'zustand': 'Gebraucht', 'maengel': '',
     'frei': False, 'gewicht': 2, 'sperrgut': False, 'klasse': 'PostPac B-Post bis 2 kg', 'versand': '9.00', 'titel': 'Toaster X 2 Schlitze', 'beschrieb': 'Zustand: Gebraucht.',
     'link': '', 'produktlink': '', 'fehlt': [], 'versandForm': 'Paket, bis 2kg, Economy', 'getestet': True, 'buendelIds': [], 'buendelInhalt': [], 'masse': [],
     'englisch': '', 'englischAlt': False, 'quelle': 'Analyse', 'analyse': True, 'analyseNr': 'A-0001', 'fotoOrdner': 'https://drive.google.com/x', 'geaendert': 'geändert von jb am 15.10.2026', 'regal': 'Ricardo Offline'}
DATEN = {'startDaten': {'version': 't', 'admin': False, 'zustaende': ['Neu und originalverpackt', 'Neu (gemäss Beschreibung)', 'Gebraucht', 'Defekt'], 'maengelPflicht': ['Gebraucht', 'Defekt'],
         'laufzeit': 6, 'retoureGruende': [], 'kiAktiv': True, 'aktiv': 3, 'schwelle': 90},
         'analyseListe': [{'id': 'PG-100', 'name': 'Toaster X', 'titel': 'Toaster X 2 Schlitze', 'zustand': 'Gebraucht', 'preis': 40, 'fotos': 5, 'ordner': 'https://drive.google.com/x', 'kuerzel': 'JB', 'erfasst': '14.10.2026'}],
         'starteListing': R, 'erstelleText': dict(R, geaendert='', textQuelle='Analyse'), 'verkaeufe': {'offen': []}, 'retouren': {'offen': []}}
stub = """<script>window.AUFRUFE=[];window.google={script:{run:(function mk(ok,fail){return new Proxy({},{get:function(_,k){
 if(k==='withSuccessHandler')return function(f){return mk(f,fail)}; if(k==='withFailureHandler')return function(f){return mk(ok,f)};
 return function(l,name,args){AUFRUFE.push(name);var D=%s;setTimeout(function(){ok&&ok(JSON.parse(JSON.stringify(D[name]||{})))},5)}}})})()}};</script>""" % json.dumps(DATEN)
html = html.replace('<head>', '<head>' + stub, 1)
fehler = 0
def ok(b, m):
    global fehler
    print('ok' if b else 'FEHLER', m); fehler += 0 if b else 1
with sync_playwright() as p:
    b = p.chromium.launch(); s = b.new_page(); err = []
    s.on('pageerror', lambda e: err.append(str(e)))
    s.set_content(html); s.wait_for_timeout(300)
    ok(s.is_visible('#ana-karte') and 'Toaster X 2 Schlitze' in s.inner_text('#ana-liste'), 'Liste «Aus der Analyse»')
    s.click('#ana-liste button'); s.wait_for_timeout(200)
    ok(s.is_visible('#arbeit'), 'Listing offen')
    ok(s.eval_on_selector_all('#d-zustand button', 'b => b.every(x => x.disabled)') and s.is_disabled('#d-getestet'), 'Zustand und Prüfung gesperrt')
    ok(s.is_hidden('#d-maengel-block') and 'A-0001' in s.inner_text('#d-ana'), 'Mängel aus, Hinweis Analyse')
    ok(s.text_content('#t-knopf') == 'Text aus der Analyse wiederherstellen' and s.is_visible('#t-geaendert'), 'Knopf und Vermerk geändert')
    ok('Regal «Ricardo Offline»' in s.inner_text('#a-meta') and s.is_visible('#felder a[href="https://drive.google.com/x"]'), 'Regal und Foto-Ordner-Link')
    s.click('#t-knopf'); s.wait_for_timeout(100); s.click('#dialog-ja'); s.wait_for_timeout(200)
    ok(s.is_hidden('#t-geaendert') and 'Text aus der Analyse' in s.inner_text('#t-quelle'), 'Text wiederhergestellt')
    ok(not err, 'keine JS-Fehler ' + str(err))
    b.close()
print('alle Tests ok' if not fehler else '%d Fehler' % fehler); raise SystemExit(1 if fehler else 0)
