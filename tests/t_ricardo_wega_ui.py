import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))  # Pfade relativ zu tests/
"""Ricardo Tool, Tempo Weg A (19.12): Speichern im Hintergrund, Fehler mit «Nochmals», Vorladen der Abläufe, Zeitmessung uiTempo. Erfundene Daten.
Lauf: python3 tests/t_ricardo_wega_ui.py"""
import json, pathlib, sys
from playwright.sync_api import sync_playwright
html = (pathlib.Path(__file__).parent.parent / 'apps/ricardo/Index.html').read_text().replace('<?!= JSON.stringify(lang) ?>', '"de"')
# Daten aus dem bestehenden UI-Test (nur die Konstanten, nicht der Lauf)
quelle = (pathlib.Path(__file__).parent / 't_ricardo_ablauf_ui.py').read_text()
ns = {'__file__': str(pathlib.Path(__file__).parent / 't_ricardo_ablauf_ui.py')}
exec(quelle.split('stub = """')[0], ns)
DATEN = ns['DATEN']
# Steuerbarer Stub: STUB.warte[name] = ms, STUB.fehler[name] = Meldung (einmal oder immer)
stub = """<script>window.AUFRUFE=[];window.STUB={warte:{},fehler:{},immer:{}};window.open=function(){};window.google={script:{run:(function mk(ok,fail){return new Proxy({},{get:function(_,k){
 if(k==='withSuccessHandler')return function(f){return mk(f,fail)}; if(k==='withFailureHandler')return function(f){return mk(ok,f)};
 return function(l,name,args){AUFRUFE.push([name,args,Date.now()]);var D=%s;var key=name==='ablauf'?'ablauf:'+args[0]:name;
  var f=STUB.fehler[name]; if(f&&!STUB.immer[name])delete STUB.fehler[name];
  setTimeout(function(){ if(f){fail&&fail({message:f});return;} ok&&ok(JSON.parse(JSON.stringify(D[key]||{})))}, STUB.warte[name]||5)}}})})()}};</script>""" % json.dumps(DATEN)
html = html.replace('<head>', '<head>' + stub, 1)
fehler = 0
def ok(b, m):
    global fehler
    print('ok' if b else 'FEHLER', m); fehler += 0 if b else 1
with sync_playwright() as p:
    b = p.chromium.launch(); s = b.new_page(viewport={'width': 1300, 'height': 1400}); err = []
    s.on('pageerror', lambda e: err.append(str(e)))
    s.set_content(html); s.wait_for_timeout(500)
    A = lambda: s.evaluate('AUFRUFE')
    # ---------- Vorladen: Packen ist sofort da, lädt still nach ----------
    n0 = len(A())
    s.evaluate("STUB.warte.ablauf = 1500")
    s.click('#nav-f-schicht2'); s.wait_for_timeout(50)
    ok('Neu: Kamera' in s.text_content('#f-schritte') and s.is_hidden('#lade'), 'Packen sofort aus dem Vorgeladenen, ohne Lade-Sperre')
    ok([x[1] for x in A()[n0:] if x[0] == 'ablauf'] == [['schicht2']], 'still einmal nachgeladen')
    s.wait_for_timeout(1600); s.evaluate("STUB.warte.ablauf = 5")
    # ---------- Speichern im Hintergrund: «Gepackt» geht sofort weiter ----------
    s.evaluate("STUB.warte.setzeVerkauf = 1200")
    s.click('#f-schritte .f-eintrag:has-text("Neu: Kamera") button'); s.wait_for_timeout(50)
    s.click('#f-aktion'); s.wait_for_timeout(50); s.click('#f-aktion'); s.wait_for_timeout(50); s.click('#dialog-ja'); s.wait_for_timeout(50)
    s.click('#f-aktion'); s.wait_for_timeout(100)
    ok('Erledigt' in s.text_content('#f-schritte') and s.is_hidden('#lade') and s.is_visible('#schlange'), 'Gepackt: Fertig sofort, Speichern läuft unten links')
    ok('Neu: Kamera' not in s.text_content('.f-weiter'), '«Weiter mit» zeigt nicht das eben erledigte Stück')
    # blockierender Aufruf wartet, bis gespeichert ist (Reihenfolge)
    s.evaluate("ruf('etikette', ['50000003'], function () {})"); s.wait_for_timeout(100)
    ok(not [x for x in A() if x[0] == 'etikette' and x[1] == ['50000003']] and s.is_visible('#lade'), 'Etikette wartet auf das Speichern davor')
    s.wait_for_timeout(1500)
    ets = [x for x in A() if x[0] == 'etikette' and x[1] == ['50000003']]; gep = [x for x in A() if x[0] == 'setzeVerkauf' and x[1] == ['50000002', 'gepackt']]
    ok(ets and gep and ets[0][2] >= gep[0][2] + 1000 and s.is_hidden('#schlange') and s.is_hidden('#lade'), 'danach Etikette, Anzeige weg')
    # ---------- Fehler: Meldung mit «Nochmals», Fall zurück in der Liste ----------
    s.evaluate("STUB.warte.setzeVerkauf = 5; STUB.fehler.setzeVerkauf = 'Verkauf 50000002 nicht gefunden.'")
    s.click('#f-schritte button:has-text("Zur Liste")'); s.wait_for_timeout(100)
    s.evaluate("delete ERLEDIGT['p50000002']"); s.evaluate("zeichneAblauf()")
    s.click('#f-schritte .f-eintrag:has-text("Neu: Kamera") button'); s.wait_for_timeout(50)
    s.click('#f-aktion'); s.wait_for_timeout(50); s.click('#f-aktion'); s.wait_for_timeout(50); s.click('#dialog-ja'); s.wait_for_timeout(50); s.click('#f-aktion')
    s.wait_for_timeout(200)
    ok(s.is_visible('#schlange-fehler') and 'nicht gefunden' in s.text_content('#schlange-fehler') and 'Nochmals' in s.text_content('#schlange-fehler'), 'Fehler: deutliche Meldung mit «Nochmals»')
    s.click('#f-schritte button:has-text("Zur Liste")'); s.wait_for_timeout(200)
    ok('Neu: Kamera' in s.text_content('#f-schritte'), 'Fall ist wieder in der Liste')
    n1 = len([x for x in A() if x[0] == 'setzeVerkauf'])
    s.click('#schlange-fehler button:has-text("Nochmals")'); s.wait_for_timeout(200)
    ok(len([x for x in A() if x[0] == 'setzeVerkauf']) == n1 + 1 and s.is_hidden('#schlange-fehler'), '«Nochmals» schickt es noch einmal, ohne Fehler')
    # Netzfehler: wird von selbst wiederholt
    s.evaluate("STUB.fehler.aufgabeErledigt = 'NetworkError: connection failure'")
    s.click('#nav-f-taeglich'); s.wait_for_timeout(200)
    s.click('#f-schritte .f-eintrag:has-text("Föhn") button'); s.wait_for_timeout(50); s.click('#f-aktion'); s.wait_for_timeout(2600)
    ok(len([x for x in A() if x[0] == 'aufgabeErledigt']) == 2 and s.is_hidden('#schlange-fehler'), 'Netzfehler: nach 2 s von selbst wiederholt, keine Meldung')
    # ---------- Listing: Schritte speichern im Hintergrund, Felder kommen nach dem Speichern ----------
    s.click('#nav-f-schicht1'); s.wait_for_timeout(200)
    s.evaluate("STUB.warte.speichereDetails = 800")
    s.click('#f-schritte .f-eintrag:has-text("Toaster X") button'); s.wait_for_timeout(300)
    s.click('#f-aktion'); s.wait_for_timeout(50)
    ok(s.locator('#f-schritte #ls-2').count() == 1 and s.is_hidden('#lade'), 'Prüfen: sofort weiter zu Titel und Text')
    s.click('#f-aktion'); s.wait_for_timeout(50)
    ok(s.locator('#f-schritte #ls-3').count() == 1 and 'Wird gespeichert' in s.text_content('#karte-zu') and s.is_hidden('#felder'), 'Auf Ricardo erfassen: «Wird gespeichert», Felder noch zu')
    s.wait_for_timeout(1800)
    ok(s.is_visible('#felder') and s.is_hidden('#karte-zu'), 'nach dem Speichern: Felder offen')
    s.evaluate("STUB.warte.speichereDetails = 5; STUB.fehler.speichereDetails = 'Listing PG-100 ist bereits «Gelistet» und kann nicht mehr geändert werden.'")
    s.click('#f-leiste button:has-text("1 Prüfen"), #f-leiste button:has-text("✓ Prüfen")'); s.wait_for_timeout(50)
    s.click('#f-aktion'); s.wait_for_timeout(300)
    ok(s.is_visible('#schlange-fehler') and s.locator('#f-schritte #ls-1').count() == 1, 'Speichern gescheitert: zurück beim Schritt Prüfen')
    s.click('#schlange-fehler button:has-text("Schliessen")')
    # ---------- Zeitmessung ----------
    z = s.evaluate("tempoZusammen()")
    ok(any(x['n'] == 'ablauf' and x['anzahl'] >= 4 and x['max'] >= x['median'] for x in z) and any(x['n'] == 'etikette' and x['blk'] == 1 for x in z), 'Messung: pro Aufruf Anzahl, Median, Max, wartend ' + json.dumps(z)[:200])
    s.evaluate("tempoSenden()"); s.wait_for_timeout(50)
    u = [x for x in A() if x[0] == 'uiTempo']
    ok(u and isinstance(u[0][1][0], list) and s.evaluate("Object.keys(TEMPO).length") <= 1, 'uiTempo geschickt, Puffer geleert')
    ok(not err, 'keine JS-Fehler ' + str(err))
    b.close()
sys.exit(1 if fehler else 0)
