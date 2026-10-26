import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))
"""Umpack Tool Oberfläche, Datenintegrität (24.10.2026): belegte Lagerorte und fehlende Quell-Tabs im Setup, Barcode-Scan geht als Code an den Server
(führende Nullen, verschiedener VP), Stücke ohne Barcode, ungespeicherte Scans bleiben sichtbar (auch nach Neuladen), Abschluss-Warnung, Abweichungen.
Erfundene Daten. Lauf: python3 tests/t_umpacken_daten_ui.py"""
import json, sys
from playwright.sync_api import sync_playwright
html = open('../apps/umpacken/Index.html', encoding='utf8').read()
D = {'id': 'U-0001', 'name': 'Kids', 'status': 'Scan', 'quelle': 'Return Tool', 'lagerorte': 'KID-7', 'listen': '',
     'gebinde': [{'id': 'U-0001-G1', 'name': 'Balu 1', 'art': 'Verkauf', 'abnehmer': 'Balu', 'lagerort': 'BALU-1', 'preisregel': 'VP', 'prozent': ''}],
     'bestand': [{'id': 'PG-1', 'barcode': '111', 'name': 'Lego Zug', 'kat': 'Kids', 'vp': 20, 'ort': 'KID-7', 'tab': 'Stationär'},
                 {'id': 'PG-2', 'barcode': '0222', 'name': 'Puppe', 'kat': 'Kids', 'vp': 12.5, 'ort': 'KID-7', 'tab': 'Stationär'},
                 {'id': 'PG-4', 'barcode': '333', 'name': 'Puppe gross', 'kat': 'Kids', 'vp': 10, 'ort': 'KID-7', 'tab': 'Stationär'},
                 {'id': 'PG-5', 'barcode': '333', 'name': 'Puppe gross', 'kat': 'Kids', 'vp': 15, 'ort': 'KID-7', 'tab': 'Stationär'},
                 {'id': 'PG-6', 'barcode': '', 'name': 'Holzbox', 'kat': 'Kids', 'vp': 5, 'ort': 'KID-7', 'tab': 'Stationär'}],
     'zuordnung': {}, 'aenderungen': []}
AEND = [{'r': 2, 'id': 'PG-1', 'name': 'Lego Zug', 'aktion': 'Verkaufen', 'gebinde': 'Balu 1', 'abnehmer': 'Balu', 'alt': 'KID-7', 'neu': 'BALU-1', 'vp': 20, 'preis': 20, 'tab': 'Stationär', 'zeile': '8', 'erledigt': '', 'pruefung': 'ABWEICHUNG: Lagerort jetzt «KID-8» statt «KID-7»'},
        {'r': 3, 'id': 'PG-2', 'name': 'Puppe', 'aktion': 'Verkaufen', 'gebinde': 'Balu 1', 'abnehmer': 'Balu', 'alt': 'KID-7', 'neu': 'BALU-1', 'vp': 12.5, 'preis': 12.5, 'tab': 'Stationär', 'zeile': '9', 'erledigt': '', 'pruefung': 'ok'}]
stub = """<script>window.CALLS=[];window.D=%s;window.AEND=%s;window.ZU={};window.ZU_ZU=false;window.GLEICH=false;
window.google={script:{run:(function mk(ok,fail){return new Proxy({},{get:function(_,k){
 if(k==='withSuccessHandler')return function(f){return mk(f,fail)}; if(k==='withFailureHandler')return function(f){return mk(ok,f)};
 return function(name,args){CALLS.push([name,JSON.parse(JSON.stringify(args))]);setTimeout(function(){var r;
  if(name==='start')r={version:'t',durchgaenge:[{id:'U-0001',name:'Kids',status:'Scan',quelle:'Return Tool',lagerorte:'KID-7',erstellt:'24.10.2026'}]};
  if(name==='lagerorte')r={orte:[{ort:'KID-7',anzahl:5}],naechste:{KID:'KID-16'},fehlend:['Caritas','Online'],belegt:['HOM-45','KID-13','KID-7']};
  if(name==='laden'||name==='anlegen'){r=JSON.parse(JSON.stringify(D));r.zuordnung=JSON.parse(JSON.stringify(ZU));}
  if(name==='zuordnen'){ if(window.ZU_ZU&&args[1].length){fail&&fail(new Error('Der Durchgang ist nicht im Scan (Status: Abgeschlossen).'));return;}
    var konf=[],erg=[];args[1].forEach(function(o){var id=o.id||o.wunsch; if(window.GLEICH){konf.push({id:id,grund:'schon in Balu 1 (JB)',gleich:true});return;}
      if((o.art==='setzen'&&!Number(o.anzahl))||(!o.art&&!o.gebinde))delete ZU[id];else ZU[id]={gebinde:o.gebinde,preis:o.preis===undefined?(ZU[id]||{}).preis:o.preis}; if(o.code)erg.push({code:o.code,wunsch:o.wunsch,id:id,gebinde:o.gebinde});});
    r={zuordnung:JSON.parse(JSON.stringify(ZU)),konflikte:konf,ergebnis:erg};}
  if(name==='abschliessen'){ if(!args[2])r={warnung:'In den letzten 2 Minuten haben andere noch zugeordnet: SM (3). Sind alle fertig und ist alles gespeichert?'};
    else{r=JSON.parse(JSON.stringify(D));r.status='Abgeschlossen';r.zuordnung=ZU;r.listen='Balu: https://docs.google.com/x';r.aenderungen=AEND;r.hinweise=['1 Abweichungen zum Return Tool: vor dem Eintragen prüfen (Spalte «Prüfung»).'];}}
  ok&&ok(r);},5)}}})})()}};</script>""" % (json.dumps(D), json.dumps(AEND))
html = html.replace('<head>', '<head>' + stub, 1)
fehler = 0
def ok(b, m):
    global fehler
    print('ok' if b else 'FEHLER', m); fehler += 0 if b else 1
Z = lambda s: s.evaluate("CALLS.filter(function(c){return c[0]==='zuordnen' && c[1][1].length}).map(function(c){return c[1][1]})")
with sync_playwright() as p:
    b = p.chromium.launch(); s = b.new_page(viewport={'width': 1300, 'height': 1000}); err = []; dialoge = []
    s.on('pageerror', lambda e: err.append(str(e)))
    s.on('dialog', lambda d: (dialoge.append(d.message), d.accept()))
    s.route('http://app.test/', lambda r: r.fulfill(body=html, content_type='text/html; charset=utf-8'))
    s.goto('http://app.test/'); s.wait_for_timeout(200)
    # Setup: fehlende Quell-Tabs, belegter Lagerort
    s.click('button[data-a=neuerDurchgang]'); s.wait_for_timeout(150)
    ok('Nicht gelesen' in s.text_content('main') and 'Caritas, Online' in s.text_content('main'), 'M1: fehlende Quell-Tabs im Setup angezeigt')
    s.click('.orte label input'); s.wait_for_timeout(30)
    z = s.locator('.geb-zeile').first
    z.locator('[data-g=name]').fill('Neu'); z.locator('[data-g=art]').select_option('Lager'); s.wait_for_timeout(50)
    z = s.locator('.geb-zeile').first
    ok('KID-16' in z.text_content(), 'Vorschlag nächste Palette vom Server (KID-16)')
    z.locator('[data-g=lagerort]').fill(' kid-13 ')
    s.click('button[data-a=anlegen]'); s.wait_for_timeout(150)
    ok(s.evaluate("CALLS.filter(function(c){return c[0]==='anlegen'}).length") == 0 and 'KID-13 ist schon belegt' in s.text_content('main'), 'S1: belegter Lagerort im Setup markiert, nicht gesendet')
    s.locator('.geb-zeile').first.locator('[data-g=lagerort]').fill('KID-13')
    s.click('button[data-a=anlegen]'); s.wait_for_timeout(150)
    ok('KID-13 ist schon belegt' in s.text_content('#toast') and s.evaluate("CALLS.filter(function(c){return c[0]==='anlegen'}).length") == 0, 'S1: Meldung «schon belegt»')
    # Scan
    s.click('button[data-a=zurStart]'); s.wait_for_timeout(150)
    s.fill('#kuerzel', 'jb'); s.click('button[data-a=oeffne]'); s.wait_for_timeout(200)
    # Scan zuerst, dann Ziel (24.10.2026): gesendet wird erst nach dem Tippen aufs Gebinde
    def tippe(gid='U-0001-G1', ms=150): s.click('.gebinde-wahl button[data-a=ziel][data-v="%s"]' % gid); s.wait_for_timeout(ms)
    s.fill('#scan', '000222'); s.press('#scan', 'Enter'); s.wait_for_timeout(150)
    ok(not Z(s) and s.evaluate("UM.wartet.p.id") == 'PG-2' and 'PG-2' in s.text_content('#rueck'), 'Barcode erkannt (PG-2), vor dem Tippen nichts gesendet')
    tippe()
    q = Z(s)
    ok(q and q[-1][0].get('code') == '000222' and q[-1][0].get('wunsch') == 'PG-2' and not q[-1][0].get('id'), 'S3: Barcode geht als Code an den Server (führende Nullen egal): ' + json.dumps(q[-1] if q else None))
    ok('PG-2' in s.text_content('#rueck') and s.evaluate("ZU['PG-2'].gebinde") == 'U-0001-G1', 'Barcode → PG-2 gespeichert')
    s.fill('#scan', '333'); s.press('#scan', 'Enter'); s.wait_for_timeout(100)
    ok('verschiedener VP' in s.text_content('#rueck') and len(Z(s)) == 1 and s.evaluate("UM.wartet") is None, 'S3: gleiche EAN, verschiedener VP: PG-ID verlangen, nichts gesendet')
    s.click('button[data-a=reiter][data-v=offen]'); s.wait_for_timeout(50)
    ok('1 ohne Barcode: nur per PG-ID-Etikett' in s.text_content('#reiter-inhalt'), 'Stücke ohne Barcode: eigene Meldung')
    # gleich = schon gespeichert: keine rote Meldung
    s.evaluate("GLEICH=true")
    s.fill('#scan', 'PG-6'); s.press('#scan', 'Enter'); s.wait_for_timeout(50); tippe()
    ok('Nicht gespeichert' not in s.text_content('#rueck'), 'Konflikt «gleich» (schon so gespeichert) ohne rote Meldung')
    s.evaluate("GLEICH=false")
    # S4: Durchgang inzwischen abgeschlossen: Scans bleiben und sind sichtbar
    s.evaluate("ZU_ZU=true")
    s.fill('#scan', 'PG-1'); s.press('#scan', 'Enter'); s.wait_for_timeout(50); tippe(ms=200)
    ok(s.is_visible('#ungespeichert') and 'PG-1' in s.text_content('#ungespeichert') and 'NICHT gespeichert' in s.text_content('#ungespeichert'), 'S4: ungespeicherte Scans oben sichtbar')
    ok(s.evaluate("JSON.parse(localStorage.getItem('um-q-U-0001')).length") == 1, 'S4: Schlange nicht verworfen (im Speicher)')
    s.fill('#scan', 'PG-4'); s.press('#scan', 'Enter'); s.wait_for_timeout(50); tippe(ms=100)
    ok(s.evaluate("JSON.parse(localStorage.getItem('um-q-U-0001')).length") == 1 and 'klären' in s.text_content('#toast'), 'S4: weitere Scans gesperrt, bis geklärt')
    s.goto('http://app.test/'); s.wait_for_timeout(250)
    ok(s.is_visible('#ungespeichert') and 'U-0001' in s.text_content('#ungespeichert') and 'PG-1' in s.text_content('#ungespeichert'), 'S4: nach Neuladen weiter sichtbar')
    s.click('#ungespeichert button[data-a=qVerwerfen]'); s.wait_for_timeout(100)
    ok(s.is_hidden('#ungespeichert') and s.evaluate("localStorage.getItem('um-q-U-0001')") is None, 'Verwerfen nur nach Rückfrage, dann weg')
    # Abschluss: Warnung, dann Abweichungen
    s.evaluate("ZU_ZU=false")
    s.click('button[data-a=oeffne]'); s.wait_for_timeout(200)
    s.fill('#scan', 'PG-1'); s.press('#scan', 'Enter'); s.wait_for_timeout(50); tippe()
    s.click('button[data-a=zumAbschluss]'); s.wait_for_timeout(150)
    n = len(dialoge)
    s.click('button[data-a=abschliessen]'); s.wait_for_timeout(300)
    ok(any('SM (3)' in d for d in dialoge[n:]), 'S4: Abschluss warnt bei Zuordnungen anderer')
    ab = s.evaluate("CALLS.filter(function(c){return c[0]==='abschliessen'}).map(function(c){return c[1][2]})")
    ok(ab == [False, True], 'nach Bestätigung zweiter Aufruf mit bestaetigt=true: ' + json.dumps(ab))
    t = s.text_content('main')
    ok('1 Abweichungen zum Return Tool' in t and s.locator('td.abw').count() == 1 and 'Zeile (Hinweis)' in t, 'M2: Abweichung gelb, Zeile nur Hinweis')
    ok(not err, 'keine JS-Fehler ' + str(err))
    b.close()
print('t_umpacken_daten_ui ok' if not fehler else '%d Fehler' % fehler); raise SystemExit(1 if fehler else 0)
