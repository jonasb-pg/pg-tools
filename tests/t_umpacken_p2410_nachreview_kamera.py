import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))
"""Umpack Tool, Nach-Review 24.10.2026 (Version 2026-10-24.2, noch nicht eingespielt): Kamera, Erkennungslücken.
Eine EAN, die ein Stück gebucht oder erkannt hat, bucht erst nach 3 s Abwesenheit wieder, dann mit «zweites Stück derselben EAN».
«Schon in diesem Gebinde» behält das Partner-Stück. Schnelle Wechsel zwischen verschiedenen Codes bleiben gleich schnell.
Testhilfe wie tests/t_umpacken_p2410_kamera.py (Uhr im Browser gesteuert, Bilder über UMK.kamBild, Treffer über UMK.treffer).
Lauf: python3 tests/t_umpacken_p2410_nachreview_kamera.py   Gegenprobe: UMPACK_HTML=<Pfad> python3 tests/t_umpacken_p2410_nachreview_kamera.py"""
import json
from playwright.sync_api import sync_playwright
html0 = open(os.environ.get('UMPACK_HTML') or '../apps/umpacken/Index.html', encoding='utf8').read()
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

with sync_playwright() as p:
    # K1: PG-Etikett gebucht, EAN als zweiter Code. Erkennungslücken, das Stück bleibt in der Hand: nie ein zweites Stück
    b, s, err = seite(p)
    treffer(s, 'PG-2'); zeit(s, 30); bild(s, 'PG-2', '222'); treffer(s, '222')
    for i in range(3): zeit(s, 200); bild(s, 'PG-2', '222'); treffer(s, 'PG-2'); treffer(s, '222')
    for i in range(6): zeit(s, 200); bild(s, '222'); treffer(s, '222')          # Etikett 1.2 s nicht erkannt
    zeit(s, 200); bild(s, '222', 'PG-2'); treffer(s, 'PG-2')
    ok(s.evaluate("UM.rueck.art") == 'warn' and 'schon in' in s.text_content('#rueck'), 'K1 Etikett wieder erkannt: «schon in», nichts gebucht')
    for i in range(6): zeit(s, 200); bild(s, 'PG-2'); treffer(s, 'PG-2')         # EAN 1.2 s nicht erkannt
    zeit(s, 200); bild(s, 'PG-2', '222'); treffer(s, '222')
    ok(gebucht(s) == ['PG-2'], 'K1 EAN nach 1.2 s Lücke wieder erkannt: kein zweites Stück ' + json.dumps(gebucht(s)))
    for i in range(17): zeit(s, 200); bild(s, 'PG-2'); treffer(s, 'PG-2')        # EAN 3.4 s nicht erkannt, Etikett im Bild
    zeit(s, 200); bild(s, 'PG-2', '222'); treffer(s, '222')
    ok(gebucht(s) == ['PG-2'] and s.evaluate("Object.keys(UM.D.zuordnung).length") == 1, 'K1 auch nach 3.4 s: zweiter Code desselben Stücks bucht nicht ' + json.dumps(gebucht(s)))
    b.close()
    # K2: nur EAN, Erkennung fällt 1.2 s aus (Stück bleibt im Bild): kein zweites Stück; erst nach 3 s weg: zweites Stück mit Hinweis
    b, s, err = seite(p)
    treffer(s, '222')
    for i in range(4): zeit(s, 200); bild(s, '222'); treffer(s, '222')
    for i in range(6): zeit(s, 200); bild(s)
    zeit(s, 200); bild(s, '222'); treffer(s, '222')
    ok(gebucht(s) == ['bc:222'] and s.evaluate("UM.rueck.art") == 'ok', 'K2 EAN nach 1.2 s Lücke: kein zweites Stück ' + json.dumps(gebucht(s)))
    for i in range(16): zeit(s, 200); bild(s)
    zeit(s, 200); bild(s, '222'); treffer(s, '222')
    t = s.text_content('#rueck')
    ok(gebucht(s) == ['bc:222', 'bc:222'] and 'zweites Stück derselben EAN' in t and s.evaluate("UM.rueck.art") == 'warn', 'K2 nach 3.4 s weg: zweites Stück, mit Hinweis «zweites Stück derselben EAN» ' + json.dumps(gebucht(s)) + ' ' + t)
    ok('zweites Stück derselben EAN' in s.evaluate("UM.rueck.titel"), 'K2 Hinweis im Titel (den zeigt auch die Kamera-Leiste)')
    b.close()
    # Tempo: verschiedene Codes so schnell wie vorher (1.5 s nach einem Treffer); PG-Etikett nach 1.2 s weg reagiert wieder
    b, s, err = seite(p)
    treffer(s, '111'); zeit(s, 1600); bild(s, '555'); treffer(s, '555')
    ok(gebucht(s) == ['bc:111', 'bc:555'], 'T verschiedene EANs: zweite nach 1.6 s gebucht ' + json.dumps(gebucht(s)))
    zeit(s, 1600); bild(s, 'PG-6'); treffer(s, 'PG-6')
    ok(gebucht(s) == ['bc:111', 'bc:555', 'PG-6'], 'T PG-Etikett eines anderen Stücks nach 1.6 s gebucht ' + json.dumps(gebucht(s)))
    for i in range(8): zeit(s, 200); bild(s)
    treffer(s, 'PG-6')
    ok(s.evaluate("UM.rueck.art") == 'warn' and 'schon in' in s.text_content('#rueck') and gebucht(s) == ['bc:111', 'bc:555', 'PG-6'], 'T PG-Etikett 1.6 s nach dem Treffer, davon 1.6 s weg: Meldung «schon in» wie bisher (1 s)')
    zeit(s, 30); treffer(s, '111')
    ok(gebucht(s) == ['bc:111', 'bc:555', 'PG-6'] and 'Alle 1 Stücke' in s.text_content('#rueck'), 'T nach «schon in» keine Sperre: anderer Code sofort geprüft ' + s.text_content('#rueck')[:60])
    ok(not err, 'keine JS-Fehler ' + str(err))
    b.close()
print('t_umpacken_p2410_nachreview_kamera ok' if not fehler else '%d Fehler' % fehler); raise SystemExit(1 if fehler else 0)
