import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))  # Pfade relativ zu tests/
"""Feedback DS 19.10.2026 (Analyse 19.2): neu und unbenutzt, Preis nachtragen, Befund im Entscheid, Fotos jederzeit, Galerie. Erfundene Daten."""
import json
from playwright.sync_api import sync_playwright
html=open('../apps/analyse/Index.html',encoding='utf8').read()
stub="""<script>window.CALLS=[];window.ARGS={};window.google={script:{url:{getLocation:function(cb){}},run:(function(){var ok;var o={withSuccessHandler:function(f){ok=f;return o},withFailureHandler:function(){return o},api:function(l,n,a){CALLS.push(n);ARGS[n]=a;var f=ok;
if(n==='startDaten')setTimeout(function(){f({version:'x',admin:false,zahlen:{offen:3},listen:{kategorie:[]},reparatur:[]})},5);
if(n==='matchmaker')setTimeout(function(){f({passt:[],aehnlich:[],anzahl:3})},20);
if(n==='pruefen')setTimeout(function(){f({reusable:true,grade:a[0].grade||'A',rep:[],befund:(a[0].maengel?a[0].maengel+' ':'')+'Neu und unbenutzt, Verpackung geöffnet. Zurücksetzen entfällt.',befundAuto:'Neu und unbenutzt, Verpackung geöffnet. Zurücksetzen entfällt.',ricardoZustand:'Neu'})},5);
if(n==='preisSetzen')setTimeout(function(){var d=JSON.parse(JSON.stringify(window.D));d.produkt.vp=a[1];d.produkt.ovp=a[2]||'';f(d)},5);
if(n==='fotoStand')setTimeout(function(){f({bezeichnung:'Testgerät',zahl:{hauptbild:0,weitere:0,typenschild:0,mangel:0},liste:[]})},5);
}};return o;})()}};</script>"""
html=html.replace('<head>','<head>'+stub,1)
err=[]; fehler=0
def ok(b,m):
    global fehler
    print('ok' if b else 'FEHLER', m); fehler += 0 if b else 1
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1200,'height':1100})
    pg.on('pageerror',lambda e:err.append(str(e.stack)[:500]))
    pg.route('http://app.test/', lambda r: r.fulfill(body=html, content_type='text/html; charset=utf-8'))
    pg.goto('http://app.test/'); pg.wait_for_timeout(300)
    pg.evaluate("""document.getElementById('start').hidden=true; K='JB';
      window.D={produkt:{id:'AN-0099',bezeichnung:'Testgerät',vp:'',ovp:'',budget:10,stufe:'Basis'},ablauf:['ident','hygiene','voll','funktion','reset','zustand','entscheid'],
        zustand:{grade:[['A','Neu und originalverpackt','x'],['B','Neu','y'],['C','Gebraucht','z']]},recherche:true,infos:[],handbuch:null,ident:{marke:'Test',modell:'T1'},
        funktion:{liste:[{t:'Einschalten',n:'Ein',g:'Kern'}],mittel:[],defekte:[],hinweise:[],ungeprueft:[],ungeprueftKurz:[]},liefer:{teile:['Kabel']},sicher:[],reset:[['Zurücksetzen','x'],['Kontrolle','y']],
        reparatur:{stundenansatz:50,grenze:25},ricardo:{vorschlag:true,versand:[],fotoUrl:'https://x/dev?foto=AN-0099'}};
      beginne(D, Date.now());""")
    pg.wait_for_timeout(100)
    ok(pg.is_visible('#id-vp') and 'Preis' in pg.inner_text('#schritt'), 'Preis fehlt: Feld in der Identität')
    pg.click('button[data-a=neuOvp]'); pg.wait_for_timeout(100)
    ok('preisSetzen' not in pg.evaluate('CALLS') and pg.evaluate('AN.i')==0, 'Ohne VP geht es nicht weiter')
    pg.fill('#id-vp','45'); pg.fill('#id-ovp','99'); pg.click('button[data-a=neuOvp]'); pg.wait_for_timeout(200)
    ok(pg.evaluate('ARGS.preisSetzen')==['AN-0099',45,99] and pg.evaluate('AN.d.produkt.vp')==45, 'VP und OVP gespeichert, Überblick neu')
    ok(pg.evaluate('AN.d.ablauf[AN.i]')=='voll' and pg.evaluate('AN.s.grade')=='A' and pg.evaluate('AN.s.neuOvp')==True, 'Neu und unbenutzt: Hygiene übersprungen, Grade A vorgewählt')
    ok(pg.locator('#schiene li.aus').count()==2, 'Hygiene und Zurücksetzen in der Schiene als entfallen')
    pg.click('button[data-a=fotosAuf] >> nth=0'); pg.wait_for_timeout(200)
    ok(pg.locator('#ric-slots').count()==1 and 'fotoStand' in pg.evaluate('CALLS'), 'Fotos jederzeit: Kasten mit QR und Fotos schon im Schritt Vollständigkeit')
    pg.screenshot(path='dennis0.png', full_page=True)
    pg.click('button[data-a=fotosAuf] >> nth=0'); pg.wait_for_timeout(100)
    pg.click('button[data-a=weiter]'); pg.wait_for_timeout(80)
    pg.click('button[data-a=fn][data-v=ok]'); pg.click('button[data-a=fnWeiter]'); pg.wait_for_timeout(100)
    ok(pg.evaluate('AN.d.ablauf[AN.i]')=='zustand', 'Nach Funktion direkt Zustand (Zurücksetzen entfällt)')
    pg.click('button[data-a=zurueck]'); pg.wait_for_timeout(80)
    ok(pg.evaluate('AN.d.ablauf[AN.i]')=='funktion', 'Zurück überspringt Zurücksetzen ebenfalls')
    pg.click('button[data-a=fnWeiter]'); pg.wait_for_timeout(80); pg.click('button[data-a=weiter]'); pg.wait_for_timeout(200)
    ok(pg.evaluate('AN.d.ablauf[AN.i]')=='entscheid' and pg.evaluate('ARGS.pruefen[0].neuOvp')==True, 'Entscheid: neuOvp geht an den Server')
    pg.click('button[data-a=befundAuf]'); pg.wait_for_timeout(80)
    ok(pg.is_visible('#maengel-en'), 'Befund bearbeiten im Entscheid')
    pg.fill('#maengel-en','Kleiner Kratzer am Deckel'); pg.click('button[data-a=befundOk]'); pg.wait_for_timeout(200)
    ok(pg.evaluate('ARGS.pruefen[0].maengel')=='Kleiner Kratzer am Deckel' and 'Kleiner Kratzer am Deckel' in pg.inner_text('#schritt'), 'Befund geändert, Urteil neu geholt')
    pg.screenshot(path='dennis1.png', full_page=True)
    # Handy-Seite
    pg.evaluate("fotoModus('AN-0099')"); pg.wait_for_timeout(200)
    ok(pg.locator('button[data-a=fsGalerie]').count()==4 and pg.get_attribute('#fs-galerie','multiple') is not None and pg.get_attribute('#fs-galerie','capture') is None, 'Handy: «Aus Galerie» pro Fotoart, mehrere, ohne Kamera-Zwang')
    pg.screenshot(path='dennis2.png', full_page=True)
    ok(not err, 'keine JS-Fehler ' + str(err))
    b.close()
raise SystemExit(1 if fehler else 0)
