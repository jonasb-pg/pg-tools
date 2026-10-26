import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))
"""Umpack Tool 2026-10-26.3 (Jonas 26.10.2026): Oberfläche für Anzahl (Zahlknöpfe nach dem Scan), Teilmengen, Quelle und Kanal mit «+ Gebinde»,
fremder Scan mit Rückfrage, Übertrag mit Vorschau, Anleitung für Teilmengen, Anzeige «Lieferung». google.script.run gestubbt, erfundene Daten.
Lauf: python3 tests/t_umpacken_anzahl_ui.py"""
import json
from playwright.sync_api import sync_playwright

html0 = open('../apps/umpacken/Index.html', encoding='utf8').read()
G = lambda i, name, art='Lager', ort='', ab='': {'id': 'U-0001-G%d' % i, 'name': name, 'art': art, 'abnehmer': ab, 'lagerort': ort, 'preisregel': 'VP', 'prozent': ''}
P = lambda i, bc, name, ort, vp=10, n=1: {'id': 'PG-%d' % i, 'barcode': bc, 'name': name, 'kat': 'Kids', 'vp': vp, 'vpFehlt': not vp, 'ort': ort, 'tab': 'Stationär', 'anzahl': n}
D = {'id': 'U-0001', 'name': 'Kids', 'status': 'Scan', 'quelle': 'Return Tool', 'lagerorte': 'KID-11, KID-12', 'listen': '', 'gebindeStand': 'a', 'bestandStand': 'b1',
     'gebinde': [G(1, 'Balu 1', 'Verkauf', 'BALU1', 'Balu'), G(2, 'Kids 20', ort='KID-20')],
     'bestand': [P(1, '111', 'Seifen-Atelier', 'KID-11', 5, 3), P(2, '222', 'Kalaha', 'KID-11', 5), P(3, '333', 'Marker', 'KID-12', 5, 14)],
     'zuordnung': {}, 'aenderungen': []}
AEND = [{'r': 2, 'id': 'PG-1', 'name': 'Seifen-Atelier', 'aktion': 'Teilmenge – aufteilen', 'gebinde': 'Balu 1', 'abnehmer': 'Balu', 'alt': 'KID-11', 'neu': 'BALU1', 'vp': 5, 'preis': 5, 'tab': 'Stationär', 'zeile': '3844', 'erledigt': '', 'pruefung': 'ok', 'anzahl': 1, 'gesamt': 3},
        {'r': 3, 'id': 'PG-1', 'name': 'Seifen-Atelier', 'aktion': 'Nicht gefunden – prüfen', 'gebinde': '', 'abnehmer': '', 'alt': 'KID-11', 'neu': '', 'vp': 5, 'preis': 0, 'tab': 'Stationär', 'zeile': '3844', 'erledigt': '', 'pruefung': 'ok', 'anzahl': 2, 'gesamt': 3},
        {'r': 4, 'id': 'PG-2', 'name': 'Kalaha', 'aktion': 'Verkaufen', 'gebinde': 'Balu 1', 'abnehmer': 'Balu', 'alt': 'KID-11', 'neu': 'BALU1', 'vp': 5, 'preis': 5, 'tab': 'Stationär', 'zeile': '4016', 'erledigt': '', 'pruefung': 'ok', 'anzahl': 1, 'gesamt': 1}]
stub = """<script>window.CALLS=[];window.D=%s;window.AEND=%s;window.ZU={};window.STATUS='Scan';window.FREMD={};window.LIEF=null;
window.AudioContext=function(){this.currentTime=0;this.destination={};};
window.AudioContext.prototype.createOscillator=function(){return {frequency:{value:0},connect:function(){},start:function(){},stop:function(){}};};
window.AudioContext.prototype.createGain=function(){return {gain:{value:0},connect:function(){}};};
function anw(o){var k=o.id||o.wunsch,a=ZU[k]||{teile:{}},t=a.teile,alt=t[o.gebinde];
 if(o.art==='dazu')t[o.gebinde]={n:(alt?alt.n:0)+o.menge,preis:alt?alt.preis:''};
 else if(o.art==='setzen'){if(o.anzahl>0)t[o.gebinde]={n:o.anzahl,preis:o.preis===undefined?(alt?alt.preis:''):o.preis};else delete t[o.gebinde];}
 else if(o.art==='verschieben'){var v=t[o.von];if(v.n-o.menge>0)v.n-=o.menge;else delete t[o.von];t[o.gebinde]={n:(alt?alt.n:0)+o.menge,preis:''};}
 var gs=Object.keys(t);if(!gs.length){delete ZU[k];return;}a.n=gs.reduce(function(s,g){return s+t[g].n},0);a.gebinde=gs[0];ZU[k]=a;}
window.google={script:{run:(function mk(ok,fail){return new Proxy({},{get:function(_,k){
 if(k==='withSuccessHandler')return function(f){return mk(f,fail)}; if(k==='withFailureHandler')return function(f){return mk(ok,f)};
 return function(name,args){CALLS.push([name,JSON.parse(JSON.stringify(args))]);
  var antw=function(){var r;
  if(name==='start')r={version:'t',durchgaenge:[{id:'U-0001',name:'Kids',status:'Scan',quelle:'Return Tool',lagerorte:'KID-11',erstellt:'26.10.2026'}]};
  if(name==='lagerorte')r={orte:[{ort:'KID-11',anzahl:2,ohneId:0},{ort:'KID-12',anzahl:1,ohneId:0},{ort:'KID-13',anzahl:4,ohneId:0},{ort:'KID-14',anzahl:9,ohneId:1}],naechste:{KID:'KID-21'},fehlend:[],belegt:[]};
  if(name==='laden'){r=JSON.parse(JSON.stringify(D));r.zuordnung=JSON.parse(JSON.stringify(ZU));if(STATUS!=='Scan'){r.status=STATUS;r.aenderungen=AEND;}}
  if(name==='stand')r={status:STATUS,zuordnung:JSON.parse(JSON.stringify(ZU)),gebindeStand:'a',bestandStand:D.bestandStand};
  if(name==='zuordnen'){args[1].forEach(function(o){if(!o.unbekannt)anw(o);});r={zuordnung:JSON.parse(JSON.stringify(ZU)),konflikte:[],ergebnis:[],gebindeStand:'a',bestandStand:D.bestandStand};}
  if(name==='fremdSuchen')r=FREMD[args[1]]||{treffer:[]};
  if(name==='quelleErgaenzen'){D.bestand.push({id:'PG-6',barcode:'666',name:'Fremd',kat:'Kids',vp:8,vpFehlt:false,ort:args[1][0],tab:'Stationär',anzahl:1});D.lagerorte+=', '+args[1][0];D.bestandStand='b2';r=JSON.parse(JSON.stringify(D));r.zuordnung=JSON.parse(JSON.stringify(ZU));r.hinweise=[];r.dazu=1;}
  if(name==='uebertragenVorschau')r={geschrieben:1,schon:0,fehler:[],proZiel:{BALU1:1},teilmengen:[{id:'PG-1'}],nichtGefunden:1,trocken:true};
  if(name==='uebertragen'){r={geschrieben:1,schon:0,fehler:[],proZiel:{BALU1:1},teilmengen:[{id:'PG-1'}],nichtGefunden:1};AEND[2].erledigt='x (automatisch)';}
  if(name==='lieferung')r=LIEF||{gebinde:[{name:'Balu 1',abnehmer:'Balu',lagerort:'BALU1',status:'unvollstaendig',text:'Unvollständig: 55 Zeilen im Archiv, aber 31 noch in Stationär. Lieferung NICHT nochmals starten',stueck:55,wert:600,erwartetStueck:86,erwartetTotal:925,liefNr:['STA-1'],aktiv:['PG-9']}]};
  ok&&ok(r);};
  setTimeout(antw,5);}}})})()}};</script>""" % (json.dumps(D), json.dumps(AEND))
html = html0.replace('<head>', '<head>' + stub, 1)
fehler = 0
def ok(b, m):
    global fehler
    print('ok' if b else 'FEHLER', m); fehler += 0 if b else 1
def seite(p, breit=True):
    b = p.chromium.launch(); s = b.new_page(viewport={'width': 1300 if breit else 400, 'height': 900}); err = []
    s.on('pageerror', lambda e: err.append(str(e))); s.on('dialog', lambda d: d.accept())
    s.route('http://app.test/', lambda r: r.fulfill(body=html, content_type='text/html; charset=utf-8'))
    s.goto('http://app.test/'); s.wait_for_timeout(100)
    s.fill('#kuerzel', 'BB')
    s.click('button[data-a=oeffne][data-v="U-0001"]'); s.wait_for_timeout(120)
    return b, s, err
def scan(s, code, warte=60):
    s.fill('#scan', code); s.press('#scan', 'Enter'); s.wait_for_timeout(warte)
def tippe(s, gid='U-0001-G1', warte=80):
    s.click('.gebinde-wahl button[data-a=ziel][data-v="%s"]' % gid); s.wait_for_timeout(warte)
N = lambda s, n: s.evaluate("CALLS.filter(function(c){return c[0]===%s&&(c[0]!=='zuordnen'||c[1][1].some(function(o){return !o.unbekannt}))}).length" % json.dumps(n))
OPS = "CALLS.filter(function(c){return c[0]==='zuordnen'}).map(function(c){return c[1][1]}).reduce(function(a,b){return a.concat(b)},[]).filter(function(o){return !o.unbekannt})"

with sync_playwright() as p:
    b, s, err = seite(p)
    ok('Quelle' in s.text_content('#quelle-platz') and 'KID-11 · 0/4' in s.text_content('#quelle-platz') and 'KID-12 · 0/14' in s.text_content('#quelle-platz'), 'Quelle mit Stück pro Quell-Gebinde')
    ok('0 / 18 Stück' in s.text_content('#zaehler'), 'Zähler in Stück (Anzahl)')
    ok(s.locator('button[data-a=kanalPlus]').count() == 1 and s.locator('button[data-a=quellePlus]').count() == 1, 'Quelle und Kanal mit «+ Gebinde»')
    # Stück mit 3 Stück: Zahlknöpfe
    scan(s, 'PG-1')
    ok('3 Stück im Return Tool – wie viele packst du um?' in s.text_content('#rueck') and s.locator('#rueck .mengen button').count() == 3, 'Scan PG-1 (3 Stück): Frage mit Knöpfen 1–3')
    tippe(s)
    ok('Zuerst die Anzahl tippen' in s.text_content('#rueck') and N(s, 'zuordnen') == 0, 'Kanal vor der Anzahl: abgelehnt, nichts gesendet')
    s.click('#rueck button[data-a=menge][data-v="1"]'); s.wait_for_timeout(40)
    ok('1 × PG-1' in s.text_content('#rueck') and 'bereit' in s.get_attribute('.gebinde-wahl', 'class'), 'Anzahl 1 gewählt: jetzt Kanal tippen')
    tippe(s, 'U-0001-G1', 120)
    o = s.evaluate(OPS)
    ok(len(o) == 1 and o[0]['art'] == 'dazu' and o[0]['menge'] == 1 and o[0]['gebinde'] == 'U-0001-G1' and o[0].get('sid'), 'gesendet: dazu, 1 Stück, mit Kennung')
    ok('1 von 3 umgepackt' in s.text_content('#rueck') and '1 / 18 Stück' in s.text_content('#zaehler'), 'Rückmeldung und Zähler')
    # nochmals scannen: nur noch 2 frei; Zahl ins Scanfeld
    scan(s, 'PG-1')
    ok('noch 2 frei' in s.text_content('#rueck') and s.locator('#rueck .mengen button').count() == 2, 'zweiter Scan: nur noch 2 frei')
    scan(s, '2')
    ok('2 × PG-1' in s.text_content('#rueck'), 'Anzahl ins Scanfeld getippt (Hand-Scanner/PC)')
    tippe(s, 'U-0001-G2', 120)
    ok(s.evaluate("ZU['PG-1'].teile['U-0001-G1'].n") == 1 and s.evaluate("ZU['PG-1'].teile['U-0001-G2'].n") == 2, 'auf zwei Kanäle verteilt')
    scan(s, 'PG-1')
    ok('Alle 3 Stück von PG-1 schon umgepackt' in s.text_content('#rueck') and s.locator('#rueck .meldung.stop').count() == 1, 'dritter Scan: alle umgepackt, rot')
    # Inhalt: zwei Zeilen für PG-1, Anzahl korrigieren
    s.click('button[data-a=reiter][data-v=gebinde]'); s.wait_for_timeout(40)
    ok(s.locator('#reiter-inhalt input[data-anz="PG-1|U-0001-G2"]').count() == 1 and s.locator('#reiter-inhalt input[data-anz="PG-1|U-0001-G1"]').count() == 1, 'Inhalt: eine Zeile pro Kanal mit Anzahl')
    inp = s.locator('#reiter-inhalt input[data-anz="PG-1|U-0001-G2"]'); inp.fill('5'); inp.press('Enter'); s.wait_for_timeout(80)
    ok('NICHT gespeichert' in s.text_content('#toast') and s.evaluate("ZU['PG-1'].teile['U-0001-G2'].n") == 2, 'mehr als die Anzahl: abgelehnt')
    inp = s.locator('#reiter-inhalt input[data-anz="PG-1|U-0001-G2"]'); inp.fill('0'); inp.press('Enter'); s.wait_for_timeout(120)
    o = s.evaluate(OPS)[-1]
    ok(o['art'] == 'setzen' and o['anzahl'] == 0 and o['vorher'] == 2 and not s.evaluate("ZU['PG-1'].teile['U-0001-G2']"), '0 = aus diesem Kanal entfernt (vorher mitgeschickt)')
    # 14 Stück: Zahlfeld statt Knöpfen
    scan(s, 'PG-3')
    ok(s.locator('#menge-feld').count() == 1 and s.locator('#rueck .mengen button[data-a=menge]').count() == 0, 'mehr als 12 Stück: Zahlfeld')
    s.fill('#menge-feld', '20'); s.press('#menge-feld', 'Enter'); s.wait_for_timeout(40)
    ok('Anzahl 1 bis 14' in s.text_content('#rueck'), 'Zahl zu gross: abgelehnt')
    s.fill('#menge-feld', '9'); s.press('#menge-feld', 'Enter'); s.wait_for_timeout(40); tippe(s, 'U-0001-G2', 120)
    ok(s.evaluate("ZU['PG-3'].n") == 9, '9 von 14 gebucht')
    # Stück mit Anzahl 1: wie bisher
    scan(s, 'PG-2')
    ok(s.locator('#rueck .mengen').count() == 0 and 'Jetzt das Gebinde tippen' in s.text_content('#rueck'), 'Anzahl 1: keine Frage')
    tippe(s); ok(s.evaluate(OPS)[-1]['menge'] == 1, 'Anzahl 1 gebucht')
    # Review: Stück mit Anzahl 1 inzwischen von jemand anderem gebucht: neu warnen statt still verschieben
    scan(s, 'PG-2')                                                           # liegt in Balu 1 (G1)
    s.evaluate("ZU['PG-2']={teile:{'U-0001-G2':{n:1,preis:''}},n:1,gebinde:'U-0001-G2'}; UM.D.zuordnung['PG-2']={teile:{'U-0001-G2':{n:1,preis:'',kuerzel:'XY'}},n:1,gebinde:'U-0001-G2',kuerzel:'XY'}")
    n0 = len(s.evaluate(OPS)); tippe(s, 'U-0001-G1')
    ok('inzwischen in Kids 20 (XY)' in s.text_content('#rueck') and len(s.evaluate(OPS)) == n0, 'inzwischen von jemand anderem verschoben: Warnung, nichts gesendet')
    tippe(s, 'U-0001-G1', 120)
    o = s.evaluate(OPS)[-1]
    ok(o['art'] == 'verschieben' and o['von'] == 'U-0001-G2' and o['gebinde'] == 'U-0001-G1', 'nochmals tippen: bewusst verschieben')
    # Fremder Scan: Rückfrage, dann als Quelle dazunehmen und das Stück wartet
    s.evaluate("FREMD['666']={treffer:[{ort:'KID-13',tab:'Stationär',id:'PG-6',name:'Fremd',anzahl:4,frei:true,grund:''}]}")
    scan(s, '666', 120)
    ok('steht im Return Tool auf KID-13' in s.text_content('#rueck') and s.locator('#rueck button[data-a=fremdJa]').count() == 1, 'fremder Scan: Frage «als Quelle dazunehmen?»')
    s.click('#rueck button[data-a=fremdJa]'); s.wait_for_timeout(200)
    q = [c for c in s.evaluate("CALLS") if c[0] == 'quelleErgaenzen']
    ok(len(q) == 1 and q[0][1][1] == ['KID-13'] and s.evaluate("UM.wartet && UM.wartet.p.id") == 'PG-6' and 'KID-13' in s.text_content('#quelle-platz'), 'nach Ja: KID-13 Quelle, Stück wartet auf den Kanal')
    s.evaluate("FREMD['777']={treffer:[{ort:'KID-30',tab:'Stationär',id:'PG-7',name:'X',anzahl:2,frei:false,grund:'ist ein Kanal im offenen Durchgang U-0005'}]}")
    scan(s, '777', 120)
    ok('Zur Seite legen' in s.text_content('#rueck') and 'Kanal im offenen Durchgang' in s.text_content('#rueck') and s.locator('#rueck button[data-a=fremdJa]').count() == 0, 'nicht freie Palette: nur «zur Seite legen»')
    # Quelle + Gebinde
    s.click('button[data-a=quellePlus]'); s.wait_for_timeout(120)
    ok(s.locator('#qp-orte input[data-qort="KID-14"]').count() == 1 and s.locator('#qp-orte input[data-qort="KID-11"]').count() == 0, 'Quelle-Auswahl ohne bestehende Quellen')
    s.check('#qp-orte input[data-qort="KID-14"]'); s.click('button[data-a=quelleDazu]'); s.wait_for_timeout(200)
    q = [c for c in s.evaluate("CALLS") if c[0] == 'quelleErgaenzen']
    ok(len(q) == 2 and q[1][1][1] == ['KID-14'], 'Quelle dazunehmen sendet die gewählten Orte')
    # Kanal + Gebinde: Editor mit neuer Zeile
    s.click('button[data-a=kanalPlus]'); s.wait_for_timeout(60)
    ok(s.locator('#reiter-inhalt .geb-zeile').count() == 3 and 'Kanal bearbeiten' in s.text_content('.reiter'), 'Kanal «+ Gebinde»: Editor mit neuer Zeile')
    ok(not err, 'keine JS-Fehler: ' + '; '.join(err))
    b.close()

    # Abgeschlossen: Anleitung Teilmengen, Übertrag mit Vorschau, Lieferung
    b, s, err = seite(p)
    s.evaluate("STATUS='Abgeschlossen'"); s.click('button[data-a=zurStart]'); s.wait_for_timeout(100)
    s.click('button[data-a=oeffne][data-v="U-0001"]'); s.wait_for_timeout(250)
    t = s.text_content('main')
    ok('1 Teilmenge von Hand aufteilen' in t and 'Anzahl der Zeile auf 2 setzen' in t and '1 Stück → BALU1' in t, 'Anleitung für die Teilmenge')
    ok('1 / 3' in t and '2 / 3' in t, 'Änderungen mit Stück / Anzahl gesamt')
    ok('unvollständig' in s.text_content('.lief') and 'NICHT nochmals starten' in s.text_content('.lief') and 'unvollstaendig' in s.get_attribute('.lief', 'class'), 'Lieferung: unvollständig rot angezeigt')
    s.click('button[data-a=uebertragen]'); s.wait_for_timeout(300)
    names = [c[0] for c in s.evaluate("CALLS")]
    ok('uebertragenVorschau' in names and 'uebertragen' in names and names.index('uebertragenVorschau') < names.index('uebertragen'), 'Übertrag: erst Vorschau, dann schreiben')
    ok(s.locator('button[data-a=uebertragen]').count() == 0, 'nach dem Übertrag kein Knopf mehr (alles übertragen)')
    s.evaluate("LIEF={gebinde:[{name:'Balu 1',abnehmer:'Balu',lagerort:'BALU1',status:'vollstaendig',text:'Vollständig: 86 Stück im Archiv (STA-1).',stueck:86,wert:925,erwartetStueck:86,erwartetTotal:925,liefNr:['STA-1'],aktiv:[]}]}")
    s.click('button[data-a=lieferungPruefen]'); s.wait_for_timeout(200)
    ok('vollständig' in s.text_content('.lief') and 'vollstaendig' in s.get_attribute('.lief', 'class'), 'Lieferung neu prüfen: vollständig grün')
    ok(not err, 'keine JS-Fehler: ' + '; '.join(err))
    b.close()

print('t_umpacken_anzahl_ui ok' if not fehler else '%d Fehler' % fehler)
raise SystemExit(1 if fehler else 0)
