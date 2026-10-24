import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))
"""Umpack Tool, Prüfung 24.10.2026 Befund 5: Kamera bucht für ein Stück nie zwei. Gleicher Code erst nach 1 s aus dem Bild wieder,
nach jedem Treffer 1,5 s alle Codes gesperrt, EAN und PG-Etikett desselben Stücks zählen einmal. Uhr im Browser gesteuert (Date.now),
Bilder über UMK.kamBild, Treffer über UMK.treffer. Seit 24.10.2026: Scan zuerst, dann Gebinde tippen (gebucht wird erst beim Tippen). Erfundene Daten. Lauf: python3 tests/t_umpacken_p2410_kamera.py"""
import json
from playwright.sync_api import sync_playwright
html0 = open('../apps/umpacken/Index.html', encoding='utf8').read()
D = {'id': 'U-0001', 'name': 'Kids', 'status': 'Scan', 'quelle': 'Return Tool', 'lagerorte': 'KID-7', 'listen': '', 'gebindeStand': 'a',
     'gebinde': [{'id': 'G1', 'name': 'Kids neu', 'art': 'Lager', 'abnehmer': '', 'lagerort': 'KID-20', 'preisregel': 'VP', 'prozent': ''},
                 {'id': 'G2', 'name': 'Balu 1', 'art': 'Verkauf', 'abnehmer': 'Balu', 'lagerort': 'BALU-1', 'preisregel': 'VP', 'prozent': ''}],
     'bestand': [{'id': 'PG-1', 'barcode': '111', 'name': 'Lego', 'kat': 'Kids', 'vp': 20, 'ort': 'KID-7', 'tab': 'Stationär'},
                 {'id': 'PG-2', 'barcode': '222', 'name': 'Puppe', 'kat': 'Kids', 'vp': 12.5, 'ort': 'KID-7', 'tab': 'Stationär'},
                 {'id': 'PG-3', 'barcode': '222', 'name': 'Puppe', 'kat': 'Kids', 'vp': 12.5, 'ort': 'KID-7', 'tab': 'Stationär'},
                 {'id': 'PG-5', 'barcode': '555', 'name': 'Ball', 'kat': 'Kids', 'vp': 5, 'ort': 'KID-7', 'tab': 'Stationär'},
                 {'id': 'PG-6', 'barcode': '444', 'name': 'Toaster', 'kat': 'Kids', 'vp': 9, 'ort': 'KID-7', 'tab': 'Stationär'},
                 {'id': 'PG-7', 'barcode': '444', 'name': 'Toaster', 'kat': 'Kids', 'vp': 9, 'ort': 'KID-12', 'tab': 'Stationär'}],
     'zuordnung': {}, 'aenderungen': []}
stub = """<script>window.CALLS=[];window.D=%s;window.ZU={};
window.__T0=Date.now();window.__dt=0;Date.now=function(){return window.__T0+window.__dt;};
window.google={script:{run:(function mk(ok,fail){return new Proxy({},{get:function(_,k){
 if(k==='withSuccessHandler')return function(f){return mk(f,fail)}; if(k==='withFailureHandler')return function(f){return mk(ok,f)};
 return function(name,args){CALLS.push([name,JSON.parse(JSON.stringify(args))]);setTimeout(function(){var r;
  if(name==='start')r={version:'t',durchgaenge:[{id:'U-0001',name:'Kids',status:'Scan',quelle:'Return Tool',lagerorte:'KID-7',erstellt:'24.10.2026'}]};
  if(name==='laden'){r=JSON.parse(JSON.stringify(D));r.zuordnung=JSON.parse(JSON.stringify(ZU));}
  if(name==='zuordnen'){args[1].forEach(function(o){if(o.unbekannt)return;var id=o.id||o.wunsch;if(o.gebinde)ZU[id]={gebinde:o.gebinde,preis:o.preis};else delete ZU[id];});r={zuordnung:JSON.parse(JSON.stringify(ZU)),konflikte:[],ergebnis:[],gebindeStand:'a'};}
  ok&&ok(r);},5)}}})})()}};</script>""" % json.dumps(D)
html = html0.replace('<head>', '<head>' + stub, 1)
fehler = 0
def ok(b, m):
    global fehler
    print('ok' if b else 'FEHLER', m); fehler += 0 if b else 1
OPS = "CALLS.filter(function(c){return c[0]==='zuordnen'&&c[1][1].length}).map(function(c){return c[1][1].map(function(o){return o.id||('bc:'+o.code)})})"
def seite(p):
    b = p.chromium.launch(); s = b.new_page(viewport={'width': 400, 'height': 900}); err = []
    s.on('pageerror', lambda e: err.append(str(e))); s.on('dialog', lambda d: d.accept())
    s.route('http://app.test/', lambda r: r.fulfill(body=html, content_type='text/html; charset=utf-8'))
    s.goto('http://app.test/'); s.wait_for_timeout(100)
    s.fill('#kuerzel', 'AA'); s.click('button[data-a=oeffne]'); s.wait_for_timeout(120)
    return b, s, err
def zeit(s, ms): s.evaluate("window.__dt+=%d" % ms)
def bild(s, *codes): s.evaluate("UMK.kamBild(%s)" % json.dumps(list(codes)))
def treffer(s, code): s.evaluate("UMK.treffer(%s)" % json.dumps(code)); s.wait_for_timeout(40)
def gebucht(s): s.wait_for_timeout(60); return [o for x in s.evaluate(OPS) for o in x]

# Scan zuerst, dann Ziel (24.10.2026): ein Treffer lässt das Stück warten, gebucht wird erst mit dem Tippen aufs Gebinde
def tippe(s, gid='G1'): s.click('.gebinde-wahl button[data-a=ziel][data-v="%s"]' % gid); s.wait_for_timeout(40)
wartet = lambda s: s.evaluate("UM.wartet && UM.wartet.p.id")

with sync_playwright() as p:
    # Puppe 2.6 s im Bild (Bilder alle 200 ms): ein Stück. Gleich nach dem ersten Treffer getippt: weitere Treffer lassen kein zweites Stück warten
    b, s, err = seite(p)
    treffer(s, '222')
    ok(wartet(s) == 'PG-2' and gebucht(s) == [], 'B5 Treffer 222: PG-2 wartet, vor dem Tippen nichts gebucht')
    tippe(s)
    for i in range(13): zeit(s, 200); bild(s, '222'); treffer(s, '222')
    ok(gebucht(s) == ['bc:222'] and wartet(s) is None, 'B5 dieselbe Puppe 2.6 s im Bild: ein Stück, kein zweites wartet ' + json.dumps(gebucht(s)))
    # ohne Bilder dazwischen (Prüfungs-Fall U2): auch nach 2.6 s nicht nochmals
    b.close(); b, s, err = seite(p)
    treffer(s, '222'); tippe(s); zeit(s, 2600); treffer(s, '222')
    ok(gebucht(s) == ['bc:222'] and wartet(s) is None, 'B5 gleicher Code ohne Bild dazwischen nach 2.6 s: nicht nochmals')
    # weg aus dem Bild: dieselbe EAN zählt seit dem Nach-Review 24.10.2026 erst nach 3 s wieder (vorher 1 s)
    for i in range(6): zeit(s, 200); bild(s)
    treffer(s, '222')
    ok(gebucht(s) == ['bc:222'] and wartet(s) is None, 'B5 nach 1.2 s aus dem Bild: dieselbe EAN noch nicht (3 s)')
    for i in range(16): zeit(s, 200); bild(s)
    treffer(s, '222')
    # Der frühere Hinweis «zweites Stück derselben EAN» (KAM.eanZahl, nur bei art 'ok') kommt mit «Scan zuerst, dann Ziel» nicht mehr:
    # der Scan bucht nicht, und das Tippen ist ein bewusster Entscheid. Geprüft wird darum: die zweite Puppe wartet und wird erst mit dem Tippen gebucht.
    ok(wartet(s) == 'PG-3' and gebucht(s) == ['bc:222'], 'B5 nach 3.2 s aus dem Bild: zweite Puppe (PG-3) wartet')
    tippe(s)
    ok(gebucht(s) == ['bc:222', 'bc:222'] and s.evaluate("ZU['PG-3'].gebinde") == 'G1', 'B5 zweite Puppe nach dem Tippen gebucht')
    # EAN und PG-Etikett desselben Stücks (Prüfungs-Fall U7): ein Stück, auch wenn beide länger im Bild sind
    b.close(); b, s, err = seite(p)
    treffer(s, '222'); zeit(s, 30); treffer(s, 'PG-3')
    ok(wartet(s) == 'PG-2' and 'liegen gelassen' not in s.text_content('#rueck'), 'B5 PG-Etikett desselben Stücks gleich nach der EAN: PG-2 wartet weiter, nichts liegen gelassen')
    tippe(s)
    for i in range(12): zeit(s, 200); bild(s, '222', 'PG-3'); treffer(s, 'PG-3'); treffer(s, '222')
    ok(gebucht(s) == ['bc:222'] and s.evaluate("Object.keys(UM.D.zuordnung).length") == 1 and wartet(s) is None, 'B5 EAN und PG-Etikett desselben Stücks, 2.4 s im Bild: ein Stück ' + json.dumps(gebucht(s)))
    # anderes Stück während der Sperre: kommt nach 1.5 s, wenn es noch im Bild ist (ohne Tippen dazwischen)
    b.close(); b, s, err = seite(p)
    treffer(s, '111'); zeit(s, 300); bild(s, '555'); treffer(s, '555')
    ok(wartet(s) == 'PG-1' and gebucht(s) == [], 'B5 anderes Stück 0.3 s danach: noch gesperrt, PG-1 wartet weiter')
    zeit(s, 1300); bild(s, '555'); treffer(s, '555')
    ok(wartet(s) == 'PG-5' and 'liegen gelassen: PG-1' in s.text_content('#rueck'), 'B5 nach 1.6 s: anderes Stück erkannt, PG-1 liegen gelassen')
    tippe(s)
    ok(gebucht(s) == ['bc:555'], 'B5 nach dem Tippen: anderes Stück gebucht ' + json.dumps(gebucht(s)))
    # EAN abgelehnt (gleiche EAN aus zwei Lagerorten → «PG-ID-Etikett scannen»): das Etikett im selben Bild zählt sofort; der abgelehnte Code piept nicht dauernd
    b.close(); b, s, err = seite(p)
    treffer(s, '444')
    ok('PG-ID-Etikett' in s.text_content('#rueck') and gebucht(s) == [] and wartet(s) is None, 'B5 EAN 444 aus KID-7 und KID-12: abgelehnt, nichts gebucht')
    zeit(s, 30); treffer(s, 'PG-7')
    ok(wartet(s) == 'PG-7' and gebucht(s) == [], 'B5 verlangtes PG-Etikett im selben Bild: sofort erkannt, wartet aufs Gebinde')
    tippe(s)
    ok(gebucht(s) == ['PG-7'], 'B5 PG-7 nach dem Tippen gebucht ' + json.dumps(gebucht(s)))
    n = s.evaluate("CALLS.length"); zeit(s, 200); bild(s, '444', 'PG-7'); treffer(s, '444')
    ok(s.evaluate("CALLS.length") == n and gebucht(s) == ['PG-7'] and s.evaluate("UM.rueck.art") == 'ok', 'B5 abgelehnter Code im Bild: keine neue Meldung (✅ von PG-7 bleibt stehen)')
    # bewusstes Tippen aufs Gebinde hebt die kurze Sperre auf (vorher: Gebinde-Wechsel)
    b.close(); b, s, err = seite(p)
    treffer(s, '111'); tippe(s, 'G1'); zeit(s, 300)
    treffer(s, '555')
    ok(wartet(s) == 'PG-5', 'B5 nach dem Tippen: nächstes Stück sofort erkannt')
    tippe(s, 'G2')
    ok(len(gebucht(s)) == 2 and s.evaluate("ZU['PG-1'].gebinde") == 'G1' and s.evaluate("ZU['PG-5'].gebinde") == 'G2', 'B5 nächstes Stück ins andere Gebinde gebucht')
    ok(not err, 'keine JS-Fehler ' + str(err))
    b.close()
print('t_umpacken_p2410_kamera ok' if not fehler else '%d Fehler' % fehler); raise SystemExit(1 if fehler else 0)
