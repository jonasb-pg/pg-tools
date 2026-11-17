import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))
"""Etikett aus dem Analyse Tool (17.11.2026, Jonas): Bild 62 × 29 mm, Druck über einen unsichtbaren Rahmen, automatisch nur wo eingeschaltet. Erfundene Daten."""
import base64, json, struct, sys
from playwright.sync_api import sync_playwright
html=open('../apps/analyse/Index.html',encoding='utf8').read()
stub="""<script>window.RUFE=[];window.google={script:{url:{getLocation:function(cb){}},run:(function(){var ok;var o={withSuccessHandler:function(f){ok=f;return o},withFailureHandler:function(){return o},api:function(l,n,a){var f=ok;RUFE.push([n,a]);
if(n==='startDaten')setTimeout(function(){f({version:'x',admin:false,zahlen:{offen:3},listen:{kategorie:[]},reparatur:[]})},5);
if(n==='suche')setTimeout(function(){f({treffer:[{id:'PG-500',bezeichnung:'Testgerät',status:'Erledigt',fertig:{nr:'A-000002',wer:'FG',am:'02.11.2026',regal:'Ricardo',reusable:'Ja'}}],inSchlange:false,rt:[],rtFehler:''})},5);
if(n==='etikettLog')setTimeout(function(){f(true)},5);
}};return o;})()}};</script>"""
html=html.replace('<head>','<head>'+stub,1)
QR={"AN-0068":["111111101110101111111","100000101010001000001","101110100110001011101","101110101010001011101","101110100101001011101","100000100101101000001","111111101010101111111","000000001011100000000","101101110111101001011","000110010001111101000","111111110101000001111","100111000111001010000","010001100110100110000","000000001101001110101","111111101011100011000","100000101100000110111","101110100010111100111","101110101011001100010","101110101010101100100","100000100110010001001","111111101110010011100"],"PG-500":["111111100001101111111","100000100110101000001","101110101111101011101","101110101010101011101","101110101011101011101","100000101110101000001","111111101010101111111","000000001101100000000","101111100100101111100","001101001000100101100","011101111011010011010","000100001110000110100","111110110101010010000","000000001011111101010","111111100110101101110","100000101111111100101","101110101100100101010","101110101100100011100","101110101111010101100","100000100000000100100","111111101111010101010"],"PG-25337":["111111100111001111111","100000101001001000001","101110100110101011101","101110100100001011101","101110101101101011101","100000100011001000001","111111101010101111111","000000000110000000000","101010100100100010010","110011010101000010010","100100110001010011011","000010011001110011010","100010111001001010001","000000001010001010100","111111100100100011111","100000100010001011010","101110101100101011000","101110100111010011010","101110101101011010001","100000100011110001010","111111101001011111011"]}
QRSTUB="window.qrcode=function(){var d='';return{addData:function(x){d=x},make:function(){},getModuleCount:function(){return QRM[d].length},isDark:function(r,c){return QRM[d][r].charAt(c)==='1'}}};"
fehler=0; err=[]
def ok(b,m):
    global fehler
    print('ok' if b else 'FEHLER', m); fehler += 0 if b else 1
aus=sys.argv[1] if len(sys.argv)>1 else None
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1200,'height':900})
    pg.add_init_script("try{ if(window.top!==window){ window.print=function(){ window.top.DRUCKE=(window.top.DRUCKE||0)+1; }; } }catch(e){}")
    pg.on('pageerror',lambda e:err.append(str(e)[:300]))
    pg.route('http://app.test/', lambda r: r.fulfill(body=html, content_type='text/html; charset=utf-8'))
    # QR-Bibliothek: einmal echt (lokal nachgebaut ist nicht nötig), sonst gesperrt → Etikett ohne Code
    pg.route('**/qrcode.min.js', lambda r: r.abort())
    pg.goto('http://app.test/'); pg.wait_for_timeout(300)
    pg.evaluate("document.getElementById('start').hidden=true; K='JB';")
    def bild():
        src=pg.evaluate("(function(){var f=document.getElementById('et-rahmen'); return f?f.srcdoc:'';})()")
        i=src.find('data:image/png;base64,'); 
        if i<0: return None, src
        d=base64.b64decode(src[i+22:src.find('"',i)]); return d, src
    # 1) Fertig-Bildschirm: Knopf und Schalter, ohne Schalter kein automatischer Druck
    pg.evaluate("fertigZeigen({id:'PG-25337',bezeichnung:'Philips Wasserkocher HD9350/90 Edelstahl 1.7 Liter'},{reusable:true,grade:'B',regal:'Analysiert',befund:'',verkaufsinfo:'',preis:20,dauerMin:5,budget:10,nr:'',speichert:true})")
    pg.wait_for_timeout(200)
    ok(pg.locator('#fertig button[data-a=etikett]').count()==1 and pg.locator('#fertig input[data-a=etAutoSetz]').count()==1, 'Fertig-Bildschirm zeigt «Etikett drucken» und den Schalter')
    ok(not pg.evaluate("window.DRUCKE||0") and not pg.locator('#et-rahmen').count(), 'Schalter aus: kein automatischer Druck')
    ok(not pg.locator('#fertig input[data-a=etAutoSetz]').is_checked(), 'Schalter ist ohne Einstellung aus')
    # 2) Knopf: druckt, ohne QR-Bibliothek trotzdem (ID als Text)
    pg.click('#fertig button[data-a=etikett]'); pg.wait_for_timeout(3200)
    d,src=bild()
    ok(d is not None and d[:8]==b'\x89PNG\r\n\x1a\n' and struct.unpack('>II',d[16:24])==(732,342), 'Etikett ist ein PNG mit 732 × 342 Punkten (62 × 29 mm bei 300 dpi)')
    ok('@page{size:62mm 29mm;margin:0}' in src and 'width:62mm;height:29mm' in src, 'Druckseite hat genau die Etikettengrösse')
    ok(pg.evaluate("window.DRUCKE||0")==1, 'Knopf löst genau einen Druck aus (auch ohne QR-Bibliothek)')
    ok(pg.evaluate("RUFE.filter(function(x){return x[0]==='etikettLog'}).map(function(x){return x[1].join('|')}).join(';')")=='PG-25337|hand|JB', 'Druck von Hand steht im Log-Aufruf')
    if aus: open(aus+'/et_ohne_qr.png','wb').write(d)
    # 3) Schalter ein: bleibt gemerkt, Abschluss druckt automatisch
    pg.unroute('**/qrcode.min.js')
    pg.route('**/qrcode.min.js', lambda r: r.fulfill(body='window.QRM='+json.dumps(QR)+';'+QRSTUB, content_type='application/javascript'))
    pg.click('#fertig input[data-a=etAutoSetz]')
    ok(pg.evaluate("localStorage.getItem('at-etikett')")=='1', 'Schalter ein wird für dieses Gerät gemerkt')
    pg.evaluate("fertigZeigen({id:'AN-0068',bezeichnung:'Lampe'},{reusable:false,grade:'',regal:'',befund:'',verkaufsinfo:'',preis:'',dauerMin:2,budget:10,nr:'',speichert:true})")
    pg.wait_for_timeout(3200)
    d2,src2=bild()
    ok(pg.evaluate("window.DRUCKE||0")==2 and '<title>AN-0068</title>' in src2, 'Schalter ein: Abschluss druckt automatisch, auch AN-Nummer und nicht reusable')
    ok(pg.locator('#et-rahmen').count()==1, 'es bleibt immer nur ein Druckrahmen auf der Seite')
    ok(pg.evaluate("RUFE.filter(function(x){return x[0]==='etikettLog'}).pop()[1].join('|')")=='AN-0068|auto|JB', 'automatischer Druck steht im Log-Aufruf')
    ok(pg.locator('#fertig input[data-a=etAutoSetz]').is_checked(), 'Schalter zeigt den gemerkten Stand')
    if aus and d2: open(aus+'/et_mit_qr.png','wb').write(d2)
    try:
        import cv2, numpy
        img=cv2.imdecode(numpy.frombuffer(d2,numpy.uint8),cv2.IMREAD_GRAYSCALE)
        txt=cv2.QRCodeDetector().detectAndDecode(img)[0]
        ok(txt=='AN-0068', 'QR-Code auf dem Etikett lässt sich lesen und ergibt die ID ('+repr(txt)+')')
    except ImportError: print('Hinweis: ohne OpenCV kein Lesetest für den QR-Code')
    # 4) Schalter aus: wieder kein automatischer Druck
    pg.click('#fertig input[data-a=etAutoSetz]')
    ok(pg.evaluate("localStorage.getItem('at-etikett')") is None, 'Schalter aus löscht die Einstellung')
    pg.evaluate("fertigZeigen({id:'PG-1',bezeichnung:'X'},{reusable:true,grade:'A',regal:'Analysiert',preis:1,dauerMin:1,budget:1,nr:'',speichert:true})"); pg.wait_for_timeout(300)
    ok(pg.evaluate("window.DRUCKE||0")==2, 'Schalter aus: kein Druck beim Abschluss')
    # 5) Reparatur-Pause: Knopf ja, automatisch nein
    pg.evaluate("localStorage.setItem('at-etikett','1'); FERTIG={titel:'Toaster',r:{pause:true,id:'PG-77',teil:false}}; zeichneFertig();"); pg.wait_for_timeout(200)
    ok(pg.locator('#fertig button[data-a=etikett][data-v=PG-77]').count()==1 and pg.evaluate("window.DRUCKE||0")==2, 'Reparatur-Pause: Knopf da, kein automatischer Druck')
    # 6) schon analysiert: Nachdruck aus der Meldung
    pg.fill('#q','PG-500'); pg.evaluate('suchen()'); pg.wait_for_timeout(200)
    ok(pg.locator('#such-meldung a[data-a=etikett][data-v=PG-500]').count()==1 and pg.locator('#such-meldung a[data-a=nochmal]').count()==1, 'schon analysiert: Link «Etikett drucken» neben «Neu analysieren»')
    pg.click('#such-meldung a[data-a=etikett]'); pg.wait_for_timeout(600)
    ok(pg.evaluate("window.DRUCKE||0")==3 and '<title>PG-500</title>' in bild()[1], 'Nachdruck druckt die richtige ID')
    # 7) böse Zeichen in der Bezeichnung brechen nichts
    pg.evaluate("etikett('PG-9', 'A \"B\" <c> & d\\'e sehr langer Name der sicher nicht auf zwei Zeilen passt weil er viel zu lang ist und noch länger wird')"); pg.wait_for_timeout(600)
    d3,src3=bild()
    ok(pg.evaluate("window.DRUCKE||0")==4 and d3 is not None, 'Sonderzeichen und überlange Bezeichnung: Etikett druckt')
    if aus and d3: open(aus+'/et_lang.png','wb').write(d3)
    ok(not err, 'keine Skriptfehler '+' | '.join(err))
    # Druckseite als PDF: Seitengrösse prüfen
    if aus:
        s2=b.new_page(); s2.set_content(src3); s2.pdf(path=aus+'/et.pdf', prefer_css_page_size=True, print_background=True)
    b.close()
print('FEHLER:',fehler); sys.exit(1 if fehler else 0)
