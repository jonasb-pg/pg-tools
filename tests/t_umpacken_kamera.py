import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))
"""Umpack Tool Kamera-Scan und Handy-Ansicht (21.10.2026). Davor: Oberfläche (21.10.2026): Setup, Scan (ID, Barcode, unbekannt, doppelt, verschieben, Preis), Warteschlange, Abschluss. Erfundene Daten. Lauf: python3 tests/t_umpacken_ui.py"""
import json, sys
from playwright.sync_api import sync_playwright
html = open('../apps/umpacken/Index.html', encoding='utf8').read()
D = {'id': 'U-0001', 'name': 'Kids → Balu', 'status': 'Scan', 'quelle': 'Return Tool', 'lagerorte': 'KID-7, KID-12', 'listen': '',
     'gebinde': [{'id': 'U-0001-G1', 'name': 'Balu 1', 'art': 'Verkauf', 'abnehmer': 'Balu', 'lagerort': 'BALU-1', 'preisregel': 'VP', 'prozent': ''},
                 {'id': 'U-0001-G2', 'name': 'Kids neu', 'art': 'Lager', 'abnehmer': '', 'lagerort': 'KID-13', 'preisregel': 'Prozent', 'prozent': 50},
                 {'id': 'U-0001-G3', 'name': 'Weg', 'art': 'Entsorgung', 'abnehmer': '', 'lagerort': '', 'preisregel': 'Null', 'prozent': ''}],
     'bestand': [{'id': 'PG-1', 'barcode': '111', 'name': 'Lego Zug', 'kat': 'Kids', 'vp': 20, 'ort': 'KID-7', 'tab': 'Stationär'},
                 {'id': 'PG-2', 'barcode': '222', 'name': 'Puppe', 'kat': 'Kids', 'vp': 12.5, 'ort': 'KID-7', 'tab': 'Stationär'},
                 {'id': 'PG-3', 'barcode': '222', 'name': 'Puppe', 'kat': 'Kids', 'vp': 12.5, 'ort': 'KID-7', 'tab': 'Stationär'}],   # seit 24.10.2026 gleicher Lagerort: gleiche EAN aus verschiedenen Lagerorten verlangt die PG-ID (Prüfung 24.10.2026 Befund 4)
     'zuordnung': {}, 'aenderungen': []}
stub = """<script>window.CALLS=[];window.D=%s;window.ZU={};
window.google={script:{run:(function mk(ok,fail){return new Proxy({},{get:function(_,k){
 if(k==='withSuccessHandler')return function(f){return mk(f,fail)}; if(k==='withFailureHandler')return function(f){return mk(ok,f)};
 return function(name,args){CALLS.push([name,JSON.parse(JSON.stringify(args))]);setTimeout(function(){var r;
  if(name==='start')r={version:'t',durchgaenge:[{id:'U-0001',name:'Kids → Balu',status:'Scan',quelle:'Return Tool',lagerorte:'KID-7',erstellt:'22.10.2026'}]};
  if(name==='lagerorte')r={orte:[{ort:'KID-7',anzahl:2},{ort:'KID-12',anzahl:1},{ort:'HOM-3',anzahl:5}],naechste:{KID:'KID-13',HOM:'HOM-4'}};
  if(name==='laden'||name==='anlegen'){r=JSON.parse(JSON.stringify(D));r.zuordnung=JSON.parse(JSON.stringify(ZU));}
  if(name==='zuordnen'){var konf=[];args[1].forEach(function(o){if(!o.id&&o.code)o=Object.assign({},o,{id:o.wunsch}); if(o.id==='PG-2'&&window.KONFLIKT){konf.push({id:o.id,grund:'inzwischen von jemand anderem in Weg gelegt'});return;} if(o.gebinde)ZU[o.id]={gebinde:o.gebinde,preis:o.preis};else delete ZU[o.id];});r={zuordnung:JSON.parse(JSON.stringify(ZU)),konflikte:konf};}
  if(name==='abschliessen'){r=JSON.parse(JSON.stringify(D));r.status='Abgeschlossen';r.zuordnung=ZU;r.listen='Balu: https://docs.google.com/x';r.aenderungen=[{r:2,id:'PG-1',name:'Lego Zug',aktion:'Verkaufen',gebinde:'Balu 1',abnehmer:'Balu',alt:'KID-7',neu:'BALU-1',vp:20,preis:20,tab:'Stationär',zeile:'7',erledigt:''}];}
  if(name==='erledigt'){r=[{r:2,id:'PG-1',name:'Lego Zug',aktion:'Verkaufen',gebinde:'Balu 1',abnehmer:'Balu',alt:'KID-7',neu:'BALU-1',vp:20,preis:20,tab:'Stationär',zeile:'7',erledigt:args[2]?'x':''}];}
  ok&&ok(r);},5)}}})})()}};</script>""" % json.dumps(D)
html = html.replace('<head>', '<head>' + stub, 1)

# Strichcode-Leser simulieren: der Test legt fest, was die Kamera «sieht»
det = """<script>window.SIEHT=[];window.BarcodeDetector=function(){};
window.BarcodeDetector.prototype.detect=function(q){var c=window.SIEHT.shift();return Promise.resolve(c?[{rawValue:c}]:[]);};</script>"""
html = html.replace('<head>', '<head><meta name="viewport" content="width=device-width, initial-scale=1">' + det, 1)   # setzt im Betrieb doGet
fehler = 0
def ok(b, m):
    global fehler
    print('ok' if b else 'FEHLER', m); fehler += 0 if b else 1
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'])
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, permissions=['camera'],
        user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1')
    s = ctx.new_page(); err = []
    s.on('pageerror', lambda e: err.append(str(e)))
    s.on('dialog', lambda d: d.accept())
    s.route('https://app.test/', lambda r: r.fulfill(body=html, content_type='text/html; charset=utf-8'))
    s.goto('https://app.test/'); s.wait_for_timeout(200)
    ok('Auf dem Handy' not in s.text_content('main'), 'Startseite ohne Erklärtext')
    s.fill('#kuerzel', 'jb')
    s.click('button[data-a=oeffne]'); s.wait_for_timeout(200)
    ok(s.evaluate("document.activeElement.id") != 'scan', 'Handy: Scanfeld nicht automatisch fokussiert (keine Tastatur)')
    breite = s.evaluate("document.documentElement.scrollWidth")
    ok(breite <= 392, 'Handy: keine Seite breiter als der Bildschirm (' + str(breite) + ')')
    s.click('#kamera-knopf'); s.wait_for_timeout(600)
    ok(s.is_visible('#kamera video') and s.evaluate("UMK.KAM.an") and s.text_content('#kamera-knopf') == 'Kamera aus', 'Kamera an: Bild unten, Knopf «Kamera aus»')
    # Scan zuerst, dann Ziel (24.10.2026): die Gebinde stehen auch in der Kamera-Leiste
    ZN = lambda: s.evaluate("CALLS.filter(function(c){return c[0]==='zuordnen' && c[1][1].length}).length")
    ok(s.locator('#kam-ziele button[data-a=ziel]').count() == 3 and s.is_visible('#kam-ziele button[data-v="U-0001-G1"]'), 'Kamera an: die 3 Gebinde in der Kamera-Leiste (#kam-ziele)')
    s.evaluate("SIEHT.push('PG-1')"); s.wait_for_timeout(300)
    ok(s.evaluate("UM.wartet && UM.wartet.p.id") == 'PG-1' and 'Gebinde tippen' in s.text_content('#kam-text') and ZN() == 0 and not s.evaluate("ZU['PG-1']"), 'Kamera liest PG-1: wartet, vor dem Tippen nichts gebucht: ' + s.text_content('#kam-text'))
    ok('bereit' in s.get_attribute('#kam-ziele', 'class'), 'Kamera-Leiste: Gebinde hervorgehoben, solange ein Stück wartet')
    s.click('#kam-ziele button[data-v="U-0001-G1"]'); s.wait_for_timeout(150)
    ok(s.evaluate("ZU['PG-1'] && ZU['PG-1'].gebinde") == 'U-0001-G1' and 'Balu 1' in s.text_content('#kam-text') and s.evaluate("UMK.KAM.an"), 'Gebinde in der Kamera-Leiste getippt: PG-1 landet in Balu 1, Kamera bleibt an: ' + s.text_content('#kam-text'))
    s.evaluate("SIEHT.push('PG-1')"); s.wait_for_timeout(300)
    ok(ZN() == 1 and s.evaluate("UM.wartet") is None, 'Gleicher Code gleich nochmals: kein zweiter Scan, wartet nicht nochmals')
    s.click('.gebinde-wahl button[data-v="U-0001-G2"]'); s.wait_for_timeout(200)
    ok(s.evaluate("UMK.KAM.an") and s.is_visible('#kamera video') and 'Zuerst ein Stück scannen' in s.text_content('#kam-text') and ZN() == 1, 'Gebinde tippen ohne wartendes Stück: rote Meldung, Kamera bleibt an')
    s.evaluate("SIEHT.push('222')"); s.wait_for_timeout(500)
    ok(s.evaluate("UM.wartet && UM.wartet.p.id") == 'PG-2' and not s.evaluate("ZU['PG-2']"), 'Barcode 222 → erstes freies Stück wartet')
    s.click('#kam-ziele button[data-v="U-0001-G2"]'); s.wait_for_timeout(150)
    ok(s.evaluate("ZU['PG-2'] && ZU['PG-2'].gebinde") == 'U-0001-G2' and 'Kids neu' in s.text_content('#kam-text'), 'Barcode 222 → erstes freies Stück in Kids neu')
    if len(sys.argv) > 1 and sys.argv[1].endswith('.png'): s.screenshot(path=sys.argv[1])   # nur Bildpfade (python3 a.py b.py übergibt sonst b.py)
    s.wait_for_timeout(1300)   # seit 24.10.2026: nach jedem Treffer 1,5 s alle Codes gesperrt (Prüfung 24.10.2026 Befund 5)
    s.evaluate("SIEHT.push('999')"); s.wait_for_timeout(500)
    ok('nicht in der Quelle' in s.text_content('#kam-text') and 'stop' in s.get_attribute('#kam-text', 'class'), 'Unbekannter Code: rote Meldung in der Kamera-Leiste')
    s.wait_for_timeout(1600); s.evaluate("SIEHT.push('PG-3')"); s.wait_for_timeout(500)
    ok(s.evaluate("UM.wartet && UM.wartet.p.id") == 'PG-3', 'PG-3 wartet')
    s.wait_for_timeout(1600); s.evaluate("SIEHT.push('998')"); s.wait_for_timeout(500)
    ok('nicht in der Quelle' in s.text_content('#kam-text') and 'wartet noch: PG-3' in s.text_content('#kam-text') and 'stop' in s.get_attribute('#kam-text', 'class'), 'Ablehnung geht in der Kamera-Leiste vor dem wartenden Stück: ' + s.text_content('#kam-text'))
    s.evaluate("UM.wartet=null")
    s.click('#kamera button[data-a=kamera]'); s.wait_for_timeout(200)
    ok(s.is_hidden('#kamera') and not s.evaluate("UMK.KAM.an"), 'Kamera aus über die Leiste')
    # Foto-Weg (wenn die Live-Kamera im Google-Rahmen nicht erlaubt ist)
    s.evaluate("SIEHT.push('PG-3')")
    s.set_input_files('#foto-scan', files=[{'name': 'f.png', 'mimeType': 'image/png', 'buffer': bytes.fromhex('89504e470d0a1a0a0000000d4948445200000001000000010806000000' + '1f15c489' + '0000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082')}])
    s.wait_for_timeout(600)
    ok(s.evaluate("UM.wartet && UM.wartet.p.id") == 'PG-3' and not s.evaluate("ZU['PG-3']"), 'Foto-Kamera: Code aus dem Foto gelesen, PG-3 wartet')
    s.click('.gebinde-wahl button[data-a=ziel][data-v="U-0001-G2"]'); s.wait_for_timeout(200)
    ok(s.evaluate("ZU['PG-3'] && ZU['PG-3'].gebinde") == 'U-0001-G2', 'Foto-Kamera: nach dem Tippen in Kids neu')
    s.set_input_files('#foto-scan', files=[{'name': 'f.png', 'mimeType': 'image/png', 'buffer': bytes.fromhex('89504e470d0a1a0a0000000d4948445200000001000000010806000000' + '1f15c489' + '0000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082')}])
    s.wait_for_timeout(600)
    ok('Kein Strichcode erkannt' in s.text_content('#rueck'), 'Foto ohne Code: klare Meldung')
    # Live-Kamera verweigert → Foto-Kamera
    s.evaluate("navigator.mediaDevices.getUserMedia=function(){return Promise.reject({name:'NotAllowedError'})}; window.KLICK=0; window.KAMRUF=0; document.getElementById('foto-scan').click=function(){KLICK++}; var k=UMA.kamera; UMA.kamera=function(){KAMRUF++; return k.apply(this,arguments)}")
    s.click('#kamera-knopf'); s.wait_for_timeout(300)
    ok(s.evaluate("KLICK") == 1 and s.evaluate("KAMRUF") >= 1 and 'Foto-Kamera' in s.text_content('#toast'), 'Live-Kamera verweigert: Foto-Kamera öffnet sich')
    ok(not err, 'keine JS-Fehler ' + str(err))
    b.close()
print('t_umpacken_kamera ' + ('ok' if not fehler else 'FEHLER: %d' % fehler))
sys.exit(1 if fehler else 0)
