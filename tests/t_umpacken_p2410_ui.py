import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))
"""Umpack Tool, Prüfung 24.10.2026 (Version 2026-10-24.2): Regressionstests Oberfläche (Index.html, google.script.run gestubbt).
Befunde 2, 3, 4, 8, 9, 10, 11, 12, 13, 14, 16, 18, 19, 20. Seit 24.10.2026: Scan zuerst, dann Gebinde tippen; Anlegen/Gebinde speichern gesperrt, solange der Server arbeitet. Kamera (Befund 5): tests/t_umpacken_p2410_kamera.py. Erfundene Daten.
Lauf: python3 tests/t_umpacken_p2410_ui.py"""
import json, sys
from playwright.sync_api import sync_playwright

html0 = open('../apps/umpacken/Index.html', encoding='utf8').read()
G = lambda i, name, art='Lager', ort='', ab='': {'id': 'U-0001-G%d' % i, 'name': name, 'art': art, 'abnehmer': ab, 'lagerort': ort, 'preisregel': 'VP', 'prozent': ''}
P = lambda i, bc, name, ort, vp=10: {'id': 'PG-%d' % i, 'barcode': bc, 'name': name, 'kat': 'Kids', 'vp': vp, 'vpFehlt': not vp, 'ort': ort, 'tab': 'Stationär'}
D = {'id': 'U-0001', 'name': 'Kids', 'status': 'Scan', 'quelle': 'Return Tool', 'lagerorte': 'KID-7, KID-12', 'listen': '', 'gebindeStand': 'a',
     'gebinde': [G(1, 'Kids neu', ort='KID-20'), G(2, 'Balu 1', 'Verkauf', 'BALU-1', 'Balu')],
     'bestand': [P(1, '111', 'Lego', 'KID-7', 20), P(2, '222', 'Puppe', 'KID-7'), P(3, '222', 'Puppe', 'KID-7'), P(4, '444', 'Ball', 'KID-7'), P(5, '444', 'Ball', 'KID-12'),
                 P(6, '666', 'Kreisel', 'KID-7', 0)],
     'zuordnung': {}, 'aenderungen': []}
AEND = [{'r': 2, 'id': 'PG-1', 'name': 'Lego', 'aktion': 'Lagerort ändern', 'gebinde': 'Kids neu', 'abnehmer': '', 'alt': 'KID-7', 'neu': 'KID-20', 'vp': 20, 'preis': 20, 'tab': 'Stationär', 'zeile': '7', 'erledigt': '', 'pruefung': 'ok'},
        {'r': 3, 'id': 'PG-6', 'name': 'Kreisel', 'aktion': 'Lagerort ändern', 'gebinde': 'Kids neu', 'abnehmer': '', 'alt': 'KID-7', 'neu': 'KID-20', 'vp': 0, 'preis': 0, 'tab': 'Stationär', 'zeile': '12', 'erledigt': '', 'pruefung': 'ABWEICHUNG: VP fehlt oder ist 0 (Preis CHF 0.00 aus VP)'},
        {'r': 4, 'id': 'PG-5', 'name': 'Ball', 'aktion': 'Nicht gefunden – prüfen', 'gebinde': '', 'abnehmer': '', 'alt': 'KID-12', 'neu': '', 'vp': 10, 'preis': 0, 'tab': 'Stationär', 'zeile': '11', 'erledigt': '', 'pruefung': 'ok'}]
stub = """<script>window.CALLS=[];window.D=%s;window.AEND=%s;window.ZU={};window.MODUS='ok';window.WARTET=[];window.KONF={};window.UMMAP={};window.STATUS='Scan';window.GSTAND='a';window.PIEPS=[];window.HALT=[];
window.AudioContext=function(){this.currentTime=0;this.destination={};};
window.AudioContext.prototype.createOscillator=function(){return {frequency:{value:0},connect:function(){},start:function(){PIEPS.push(this.frequency.value)},stop:function(){}};};
window.AudioContext.prototype.createGain=function(){return {gain:{value:0},connect:function(){}};};
window.google={script:{run:(function mk(ok,fail){return new Proxy({},{get:function(_,k){
 if(k==='withSuccessHandler')return function(f){return mk(f,fail)}; if(k==='withFailureHandler')return function(f){return mk(ok,f)};
 return function(name,args){CALLS.push([name,JSON.parse(JSON.stringify(args))]);
  var antw=function(){var r;
  if(name==='start')r={version:'t',durchgaenge:[{id:'U-0001',name:'Kids',status:'Scan',quelle:'Return Tool',lagerorte:'KID-7',erstellt:'24.10.2026'},{id:'U-0002',name:'Andere',status:'Scan',quelle:'Return Tool',lagerorte:'KID-9',erstellt:'24.10.2026'},{id:'U-0003',name:'Falsch',status:'Verworfen',quelle:'Return Tool',lagerorte:'KID-1',erstellt:'24.10.2026'}]};
  if(name==='lagerorte')r={orte:[{ort:'KID-7',anzahl:5,ohneId:2},{ort:'KID-12',anzahl:1,ohneId:0}],naechste:{KID:'KID-21'},fehlend:[],belegt:['KID-20']};
  if(name==='laden'){r=JSON.parse(JSON.stringify(D));r.id=args[0];r.zuordnung=JSON.parse(JSON.stringify(ZU));r.gebindeStand=GSTAND;if(args[0]==='U-0003')r.status='Verworfen';}
  if(name==='stand')r={status:STATUS,zuordnung:JSON.parse(JSON.stringify(ZU)),gebindeStand:GSTAND};
  if(name==='verwerfen'){r=JSON.parse(JSON.stringify(D));r.status='Verworfen';}
  if(name==='erledigt')r=AEND;
  if(name==='abschliessen'){r=JSON.parse(JSON.stringify(D));r.status='Abgeschlossen';r.zuordnung=ZU;r.aenderungen=AEND;}
  if(name==='zuordnen'){
    if(MODUS.indexOf('fehler:')===0&&args[1].length){fail&&fail({message:MODUS.slice(7)});return;}
    var konf=[],erg=[];
    args[1].forEach(function(o){ if(o.unbekannt)return; var id=o.id; if(!id&&o.code){id=UMMAP[o.wunsch]||o.wunsch;erg.push({code:o.code,wunsch:o.wunsch,id:id,gebinde:o.gebinde});}
      if(KONF[id]){konf.push({id:id,grund:KONF[id]});return;} if(o.gebinde)ZU[id]={gebinde:o.gebinde,preis:o.preis};else delete ZU[id];});
    r={zuordnung:JSON.parse(JSON.stringify(ZU)),konflikte:konf,ergebnis:erg,gebindeStand:GSTAND};}
  ok&&ok(r);};
  if(name==='zuordnen'&&(MODUS==='verzoegert'||MODUS==='haengen')&&args[1].length){WARTET.push(antw);return;}
  if(name==='anlegen'||name==='gebindeAendern'){HALT.push({ok:function(){ok&&ok(JSON.parse(JSON.stringify(D)))},fail:function(m){fail&&fail({message:m})}});return;}
  setTimeout(antw,5);}}})})()}};</script>""" % (json.dumps(D), json.dumps(AEND))
html = html0.replace('<head>', '<head>' + stub, 1)
fehler = 0
def ok(b, m):
    global fehler
    print('ok' if b else 'FEHLER', m); fehler += 0 if b else 1
def seite(p, ls=None, breit=False, oeffnen=True):
    b = p.chromium.launch(); s = b.new_page(viewport={'width': 1300 if breit else 400, 'height': 900}); err = []
    s.on('pageerror', lambda e: err.append(str(e))); s.on('dialog', lambda d: d.accept())
    s.route('http://app.test/', lambda r: r.fulfill(body=html, content_type='text/html; charset=utf-8'))
    s.goto('http://app.test/'); s.wait_for_timeout(100)
    if ls:
        for k, v in ls.items(): s.evaluate("([k,v])=>localStorage.setItem(k,v)", [k, v])
        s.reload(); s.wait_for_timeout(150)
    s.fill('#kuerzel', 'AA')
    if oeffnen: s.click('button[data-a=oeffne][data-v="U-0001"]'); s.wait_for_timeout(120)
    return b, s, err
def scan(s, code, warte=80):
    s.fill('#scan', code); s.press('#scan', 'Enter'); s.wait_for_timeout(warte)
# Scan zuerst, dann Ziel (24.10.2026): gebucht wird erst mit dem Tippen aufs Gebinde
def tippe(s, gid='U-0001-G1', warte=80):
    s.click('.gebinde-wahl button[data-a=ziel][data-v="%s"]' % gid); s.wait_for_timeout(warte)
def buche(s, code, gid='U-0001-G1', warte=80):
    scan(s, code, 30); tippe(s, gid, warte)
OPS = "CALLS.filter(function(c){return c[0]==='zuordnen'&&c[1][1].length}).map(function(c){return c[1][1].map(function(o){return o.unbekannt?('?'+o.unbekannt):(o.id||('bc:'+o.code+'>'+o.wunsch))+(o.gebinde===''?'-weg':'')+(o.preis!==undefined&&o.preis!==''?'@'+o.preis:'')})})"
ops = lambda s: s.evaluate(OPS)
flach = lambda s: [o for x in ops(s) for o in x]
rot = lambda s: s.locator('#rueck .meldung.stop').count() == 1
letzterPiep = lambda s: s.evaluate("PIEPS[PIEPS.length-1]")

with sync_playwright() as p:
    # Befund 2: nach «nicht im Scan» keine ✅ mehr, sondern rot + tiefer Ton + rote Liste; auch Entfernen/Verschieben/Preis
    b, s, err = seite(p)
    s.evaluate("MODUS='fehler:Der Durchgang ist nicht im Scan (Status: Abgeschlossen).'")
    buche(s, 'PG-1', warte=150)
    scan(s, 'PG-3')
    ok(s.evaluate("UM.Q.length") == 1 and 'Jetzt das Gebinde tippen' in s.text_content('#rueck'), 'B2 Scan allein bucht nichts (Schlange unverändert)')
    tippe(s)
    r = s.text_content('#rueck')
    ok('✅' not in r and 'NICHT gespeichert: PG-3' in r and rot(s) and letzterPiep(s) == 220, 'B2 Scan nach «nicht im Scan»: rot, tiefer Ton, kein ✅ (' + r.strip()[:70] + ')')
    ok('PG-3' in s.text_content('#ng-platz') and 'nochmals scannen' in s.text_content('#ng-platz'), 'B2 abgelehnter Scan steht in der roten Liste')
    s.click('#reiter-inhalt button[data-a=entfernen][data-v="PG-1"]'); s.wait_for_timeout(80)
    ok('NICHT gespeichert: PG-1' in s.text_content('#rueck') and s.evaluate("UM.Q.length") == 1, 'B2 Entfernen nach «nicht im Scan»: rot, nichts in der Schlange')
    b.close()

    # Befund 3: Entfernen direkt nach einem Barcode-Scan wartet auf die Antwort; danach trifft es das aufgelöste Stück
    b, s, err = seite(p, breit=True)
    s.evaluate("MODUS='verzoegert'; UMMAP={'PG-2':'PG-3'}")
    buche(s, '222')
    s.click('#reiter-inhalt button[data-a=entfernen][data-v="PG-2"]'); s.wait_for_timeout(80)
    ok('NICHT entfernt' in s.text_content('#rueck') and s.evaluate("UM.Q.length") == 1 and letzterPiep(s) == 220, 'B3 Entfernen auf ausstehenden Barcode-Scan: abgelehnt, rot')
    s.evaluate("MODUS='ok'; WARTET.shift()()"); s.wait_for_timeout(120)
    ok(s.evaluate("UM.letzte[0]") == 'PG-3' and s.locator('#reiter-inhalt button[data-a=entfernen][data-v="PG-3"]').count() == 1, 'B3 nach der Antwort: Zeile zeigt das aufgelöste PG-3')
    s.click('#reiter-inhalt button[data-a=entfernen][data-v="PG-3"]'); s.wait_for_timeout(120)
    ok(flach(s)[-1] == 'PG-3-weg' and 'PG-3' not in s.evaluate("JSON.stringify(ZU)"), 'B3 Entfernen trifft PG-3: ' + json.dumps(ops(s)))
    b.close()

    # Befund 4: gleiche EAN aus verschiedenen Lagerorten → PG-ID verlangen, nichts gesendet
    b, s, err = seite(p)
    scan(s, '444')
    ok('verschiedenen Lagerorten (KID-7, KID-12)' in s.text_content('#rueck') and rot(s) and not ops(s) and s.evaluate("UM.wartet") is None, 'B4 EAN 444 aus KID-7 und KID-12: rot, PG-ID verlangt, nichts gesendet')
    b.close()

    # Befund 8: während des Speicherns keinen anderen Durchgang öffnen; dessen Schlange bleibt ganz
    alt = json.dumps([{'id': 'PG-2', 'gebinde': 'U-0001-G1', 'preis': '', 'vorher': ''}, {'id': 'PG-4', 'gebinde': 'U-0001-G1', 'preis': '', 'vorher': ''}])
    b, s, err = seite(p, {'um-q-U-0002': alt})
    s.evaluate("MODUS='verzoegert'")
    buche(s, 'PG-1')
    s.click('#ungespeichert button[data-a=oeffne][data-v="U-0002"]'); s.wait_for_timeout(100)
    geladen = s.evaluate("CALLS.filter(function(c){return c[0]==='laden'&&c[1][0]==='U-0002'}).length")
    ok(geladen == 0 and 'noch gespeichert' in s.text_content('#toast'), 'B8 Öffnen während des Speicherns gesperrt')
    s.evaluate("MODUS='ok'; WARTET.shift()()"); s.wait_for_timeout(100)
    ok(len(json.loads(s.evaluate("localStorage.getItem('um-q-U-0002')"))) == 2 and s.evaluate("UM.Q.length") == 0, 'B8 Schlange von U-0002 nicht gekürzt')
    s.click('#ungespeichert button[data-a=oeffne][data-v="U-0002"]'); s.wait_for_timeout(200)
    an2 = s.evaluate("CALLS.filter(function(c){return c[0]==='zuordnen'&&c[1][0]==='U-0002'}).map(function(c){return c[1][1].map(function(o){return o.id})})")
    ok(an2 == [['PG-2', 'PG-4']], 'B8 danach U-0002 öffnen: beide Scans nachgespeichert ' + json.dumps(an2))
    b.close()

    # Befund 9: anderes Gerät ändert die Gebinde → neu laden; gelöschtes Gebinde lässt sich nicht mehr tippen
    # (seit 24.10.2026 kein «aktives» Gebinde mehr: Scan zuerst, dann Gebinde tippen)
    b, s, err = seite(p)
    s.evaluate("GSTAND='b'; D.gebinde=D.gebinde.slice(0,1)")
    buche(s, 'PG-1', 'U-0001-G2', 200)
    nl = s.evaluate("CALLS.filter(function(c){return c[0]==='laden'}).length")
    ok(nl == 2 and s.locator('.gebinde-wahl button').count() == 1 and s.locator('.gebinde-wahl button[data-v="U-0001-G2"]').count() == 0, 'B9 Gebinde-Stand geändert: neu geladen, gelöschtes Gebinde nicht mehr zum Tippen da')
    scan(s, 'PG-2')
    s.evaluate("UMA.ziel('U-0001-G2')"); s.wait_for_timeout(80)          # veralteter Knopf (z.B. noch in der Kamera-Leiste)
    ok(flach(s) == ['PG-1'] and s.evaluate("UM.wartet && UM.wartet.p.id") == 'PG-2', 'B9 gelöschtes Gebinde getippt: nichts gebucht, PG-2 wartet weiter')
    ok('gibt es nicht mehr' in s.text_content('#rueck'), 'B9 gelöschtes Gebinde getippt: rote Meldung')
    s.evaluate("GSTAND='c'"); s.evaluate("UMF.abfrage()"); s.wait_for_timeout(150)
    ok(s.evaluate("CALLS.filter(function(c){return c[0]==='laden'}).length") == 3, 'B9 Abfrage merkt geänderte Gebinde auch ohne Scan')
    s.evaluate("var k=document.createElement('div');k.innerHTML='<b id=kam-text></b><div id=kam-ziele></div>';document.getElementById('kamera').appendChild(k);UMF.gebindeNeu()"); s.wait_for_timeout(150)
    ok(s.locator('#kam-ziele button').count() == 1, 'B9 Kamera-Leiste nach neu geladenen Gebinden nachgeführt: ' + str(s.locator('#kam-ziele button').count()))
    b.close()

    # Befund 10: Durchgang verwerfen; Verworfene auf der Startseite getrennt und nur ansehbar
    b, s, err = seite(p)
    s.click('button[data-a=verwerfen]'); s.wait_for_timeout(200)
    vw = s.evaluate("CALLS.filter(function(c){return c[0]==='verwerfen'})")
    ok(vw and vw[0][1][0] == 'U-0001' and s.evaluate("UM.ansicht") == 'start' and 'verworfen' in s.text_content('#toast'), 'B10 Verwerfen mit Rückfrage, zurück zur Startseite')
    ok('Verworfen' in s.text_content('main') and s.locator('button[data-a=oeffne][data-v="U-0003"]').text_content() == 'Ansehen', 'B10 Startseite: Abschnitt «Verworfen», nur ansehen')
    s.click('button[data-a=oeffne][data-v="U-0003"]'); s.wait_for_timeout(150)
    ok(s.locator('#scan').count() == 0 and 'Dieser Durchgang ist verworfen' in s.text_content('main'), 'B10 verworfener Durchgang: kein Scan')
    b.close()

    # Befund 11: Barcode ins Preisfeld, Hand-Scanner im Kürzel-Feld, Fokus weg
    b, s, err = seite(p, breit=True)
    buche(s, 'PG-1', warte=150)
    inp = s.locator('#reiter-inhalt input[data-preis="PG-1"]')
    inp.click(); inp.fill('4005176984105'); inp.press('Enter'); s.wait_for_timeout(120)
    ok(not any('@' in o for o in flach(s)) and 'Preis NICHT gespeichert' in s.text_content('#rueck') and letzterPiep(s) == 220, 'B11 EAN im Preisfeld: rot, nicht gesendet ' + json.dumps(ops(s)))
    inp = s.locator('#reiter-inhalt input[data-preis="PG-1"]'); inp.fill('99999'); inp.press('Enter'); s.wait_for_timeout(120)
    ok(flach(s)[-1] == 'PG-1@99999', 'B11 Preis 99 999 geht')
    s.click('#kuerzel'); s.keyboard.type('4005176984105'); s.keyboard.press('Enter'); s.wait_for_timeout(150)
    ok(s.input_value('#kuerzel') == 'AA' and 'nicht in der Quelle' in s.text_content('#rueck'), 'B11 Hand-Scanner ins Kürzel-Feld: Kürzel bleibt «AA», Code geht ans Scanfeld')
    buche(s, 'PG-2', warte=150)
    s.click('#reiter-inhalt button[data-a=entfernen][data-v="PG-2"]'); s.wait_for_timeout(120)
    ok(s.evaluate("document.activeElement.id") == 'scan', 'B11 Fokus nach «Entfernen» wieder im Scanfeld')
    s.evaluate("document.activeElement.blur()")
    s.keyboard.type('PG-3'); s.keyboard.press('Enter'); s.wait_for_timeout(150)
    ok(s.evaluate("UM.wartet && UM.wartet.p.id") == 'PG-3', 'B11 Hand-Scan ohne Fokus: PG-3 wartet aufs Gebinde')
    tippe(s, warte=150)
    ok(flach(s)[-1] == 'PG-3', 'B11 Hand-Scan ohne Fokus landet trotzdem im Scan ' + json.dumps(ops(s)))
    b.close()

    # Befund 12: Konflikt vom Server bleibt in der roten Liste (auch nach Neuladen), bis gespeichert oder erledigt
    b, s, err = seite(p)
    s.evaluate("KONF={'PG-2':'inzwischen von jemand anderem in Balu 1 gelegt','PG-1':'schon in Balu 1 (BB)'}")
    buche(s, 'PG-2', warte=150); buche(s, 'PG-1', warte=150); buche(s, 'PG-4', warte=150)
    t = s.text_content('#ng-platz')
    ok('PG-2' in t and 'PG-1' in t and 'jemand anderem' in t and 'PG-4' not in t, 'B12 Konflikte in der roten Liste, gespeicherte nicht')
    s.reload(); s.wait_for_timeout(150); s.click('button[data-a=oeffne][data-v="U-0001"]'); s.wait_for_timeout(150)
    ok('PG-2' in s.text_content('#ng-platz'), 'B12 rote Liste bleibt nach Neuladen')
    buche(s, 'PG-2', warte=150)          # nach dem Neuladen kennt der Stub keine Konflikte mehr: PG-2 wird gespeichert
    ok('PG-2' not in s.text_content('#ng-platz') and 'PG-1' in s.text_content('#ng-platz'), 'B12 nochmals gescannt und gespeichert: fällt aus der Liste')
    s.click('#ng-platz button[data-a=ngWeg][data-v="PG-1"]'); s.wait_for_timeout(80)
    ok(s.text_content('#ng-platz').strip() == '' and s.evaluate("localStorage.getItem('um-ng-U-0001')") is None, 'B12 «Erledigt» leert die Liste')
    b.close()

    # Befund 13: fremder Code geht ins Log des Servers
    b, s, err = seite(p)
    scan(s, 'XYZ-123', 150)
    ok(flach(s) == ['?XYZ-123'] and rot(s), 'B13 fremder Code: rot und an den Server (Log) ' + json.dumps(ops(s)))
    b.close()

    # Befund 14 / 16: Setup zeigt Zeilen ohne ID; VP fehlt gelb (Scan und Abschluss), «Nicht gefunden» ohne Preis
    b, s, err = seite(p, oeffnen=False)
    s.click('button[data-a=neuerDurchgang]'); s.wait_for_timeout(150)
    s.click('.orte label input'); s.wait_for_timeout(30)
    ok('2 ohne ID' in s.text_content('.orte') and '2 Zeilen ohne ID' in s.text_content('#s-zahl'), 'B14 Setup: Zeilen ohne ID pro Lagerort sichtbar')
    s.click('button[data-a=zurStart]'); s.wait_for_timeout(120)
    s.click('button[data-a=oeffne][data-v="U-0001"]'); s.wait_for_timeout(120)
    s.click('button[data-a=reiter][data-v=offen]'); s.wait_for_timeout(50)
    ok(s.locator('#reiter-inhalt td.gelb').count() == 1, 'B16 Stück ohne VP gelb')
    buche(s, 'PG-1', warte=150)
    s.click('button[data-a=zumAbschluss]'); s.wait_for_timeout(150)
    s.click('button[data-a=abschliessen]'); s.wait_for_timeout(200)
    zeilen = s.locator('main table').nth(1).locator('tbody tr')
    ok(zeilen.nth(1).locator('td.gelb').count() == 1 and zeilen.nth(2).locator('td').nth(7).text_content() == '–' and 'Nicht gefunden – prüfen' in zeilen.nth(2).text_content(), 'B13/B16 Abschluss: VP 0 gelb, «Nicht gefunden – prüfen» ohne Preis')
    # Befund 20: Erledigt mit PG-ID
    s.click('input[data-erl="3"]'); s.wait_for_timeout(120)
    e = s.evaluate("CALLS.filter(function(c){return c[0]==='erledigt'})[0][1]")
    ok(e == ['U-0001', [{'r': 3, 'id': 'PG-6'}], True], 'B20 Erledigt schickt Zeile und PG-ID ' + json.dumps(e))
    b.close()

    # Befund 18: Abfrage alle 20 s über «stand» (nur lesen); Abschluss von einem anderen Gerät beendet den Scan
    b, s, err = seite(p)
    s.evaluate("UMF.abfrage()"); s.wait_for_timeout(100)
    ok(s.evaluate("CALLS.filter(function(c){return c[0]==='stand'}).length") == 1 and s.evaluate("CALLS.filter(function(c){return c[0]==='zuordnen'}).length") == 0, 'B18 Abfrage über «stand», nicht über zuordnen')
    s.evaluate("STATUS='Abgeschlossen'; D.status='Abgeschlossen'; D.aenderungen=AEND"); s.evaluate("UMF.abfrage()"); s.wait_for_timeout(200)
    ok(s.evaluate("UM.ansicht") == 'abschluss' and s.locator('#scan').count() == 0 and 'Abgeschlossen' in s.text_content('#toast'), 'B18 Handy erfährt den Abschluss')
    b.close()

    # Befund 19: Kamera an + «Zum Abschluss» zeichnet die Abschluss-Seite
    b, s, err = seite(p)
    buche(s, 'PG-1', warte=150)
    s.evaluate("UMK.KAM.an=true")
    s.click('button[data-a=zumAbschluss]'); s.wait_for_timeout(150)
    ok(s.evaluate("UM.ansicht") == 'abschluss' and 'Kontrolle' in s.text_content('main') and s.locator('#scan').count() == 0 and not s.evaluate("UMK.KAM.an"), 'B19 Kamera aus, Abschluss-Seite sichtbar')
    b.close()

    # Befund 20: Wächter gibt Senden nach Zeitüberschreitung frei; späte Antwort kürzt die Schlange nicht doppelt
    b, s, err = seite(p)
    s.evaluate("UM.waechter=300; MODUS='haengen'")
    buche(s, 'PG-1', warte=50)
    s.wait_for_timeout(450)
    s.evaluate("clearTimeout(UM.wTimer); UM.waechter=60000")      # zweiten Wächter anhalten, damit die Reihenfolge der Antworten eindeutig ist
    buche(s, 'PG-2', warte=50)
    ok(ops(s) == [['PG-1'], ['PG-1']] and s.evaluate("UM.Q.length") == 2, 'B20 Wächter: nach 300 ms nochmals gesendet, Scans bleiben ' + json.dumps(ops(s)))
    s.evaluate("MODUS='ok'; WARTET.shift()()"); s.wait_for_timeout(80)
    ok(s.evaluate("UM.Q.length") == 2, 'B20 späte Antwort der alten Anfrage zählt nicht')
    s.evaluate("WARTET.shift()()"); s.wait_for_timeout(200)
    ok(s.evaluate("UM.Q.length") == 0 and ops(s) == [['PG-1'], ['PG-1'], ['PG-2']] and s.evaluate("Object.keys(ZU).sort().join()") == 'PG-1,PG-2', 'B20 danach alles gespeichert, nichts verloren ' + json.dumps(ops(s)))
    ok(not err, 'keine JS-Fehler ' + str(err))
    b.close()

    # 24.10.2026: «Durchgang anlegen» und «Gebinde speichern» gesperrt, solange der Server arbeitet (kein Doppelklick = zwei Durchgänge)
    b, s, err = seite(p, oeffnen=False)
    s.click('button[data-a=neuerDurchgang]'); s.wait_for_timeout(150)
    s.click('.orte label input'); s.wait_for_timeout(30)
    s.locator('.geb-zeile').first.locator('[data-g=name]').fill('Neu')
    s.click('button[data-a=anlegen]'); s.wait_for_timeout(80)
    kn = s.locator('button[data-a=anlegen]')
    ok(kn.is_disabled() and 'Wird gespeichert' in kn.text_content(), 'Anlegen: Knopf gesperrt «Wird gespeichert …», solange der Server arbeitet')
    s.evaluate("UMA.anlegen()"); s.wait_for_timeout(80)
    ok(s.evaluate("CALLS.filter(function(c){return c[0]==='anlegen'}).length") == 1 and 'wird schon angelegt' in s.text_content('#toast'), 'Anlegen nochmals während es läuft: «Der Durchgang wird schon angelegt», kein zweiter Aufruf')
    s.evaluate("HALT.shift().ok()"); s.wait_for_timeout(150)
    ok(s.evaluate("UM.ansicht") == 'scan' and s.is_visible('#scan') and 'angelegt' in s.text_content('#toast'), 'Anlegen fertig: Scan-Seite')
    s.click('button[data-a=reiter][data-v=bearbeiten]'); s.wait_for_timeout(80)
    s.click('button[data-a=bearbSpeichern]'); s.wait_for_timeout(80)
    kn = s.locator('button[data-a=bearbSpeichern]')
    ok(kn.is_disabled() and 'Wird gespeichert' in kn.text_content(), 'Gebinde speichern: Knopf gesperrt, solange der Server arbeitet')
    s.evaluate("UMA.bearbSpeichern()"); s.wait_for_timeout(80)
    ok(s.evaluate("CALLS.filter(function(c){return c[0]==='gebindeAendern'}).length") == 1, 'Gebinde speichern nochmals während es läuft: kein zweiter Aufruf')
    s.evaluate("HALT.shift().fail('Die Gebinde hat inzwischen jemand anderes geändert.')"); s.wait_for_timeout(100)
    kn = s.locator('button[data-a=bearbSpeichern]')
    ok(not kn.is_disabled() and kn.text_content() == 'Gebinde speichern' and 'jemand anderes' in s.text_content('#toast'), 'Gebinde speichern abgelehnt: Knopf wieder frei, Meldung rot')
    ok(not err, 'keine JS-Fehler ' + str(err))
    b.close()
print('t_umpacken_p2410_ui ok' if not fehler else '%d Fehler' % fehler); raise SystemExit(1 if fehler else 0)
