import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))  # Pfade relativ zu tests/
"""Prüfung 24.10.2026, Analyse Tool, Oberfläche: H1 (kein Sofortstart per Barcode, weitere Stücke im Return Tool), K1/N5 (Übernehmen, Retoure neu analysieren),
H2/H3 (Lauf-ID, Konflikt bleibt unter «Pausiert», auch auf Englisch), M1 (Überblick geändert: nach Namen zugeordnet, Schritte neu bestätigen),
M5 (zwei Tabs: zusammenführen statt überschreiben, Warnung), N6 (laufende Analyse aus alter Version bleibt), N7 (Abgleich-Fehler auf der Startseite),
N8 (Foto-Upload: neuer Versuch, «Nochmals hochladen»), Admin-Listen (M4, N5). Erfundene Produkte. Lauf: python3 tests/t_analyse_p2410_ui.py [ordner für bilder]"""
import subprocess, sys, json
from playwright.sync_api import sync_playwright
AUS = sys.argv[1] if len(sys.argv) > 1 else None
html = open('../apps/analyse/Index.html', encoding='utf8').read()
quelle = subprocess.check_output(['node', '-e', "const fs=require('fs'),vm=require('vm');const c={console,Utilities:{formatDate:()=>''}};vm.createContext(c);vm.runInContext(fs.readFileSync('../apps/analyse/Code.gs','utf8'),c);process.stdout.write(c.urteilQuelle_())"]).decode('utf8')
stub = """<script>window.CALLS=[];window.ABS=null;window.FOTO_FEHLER=0;window.START={version:'x',admin:true,zahlen:{offen:3,bereit:2,laeuft:0},listen:{kategorie:[]},reparatur:[],abgleichFehler:{zeit:'24.10.2026 09:00:00',text:'Return Tool nicht erreichbar'}};
window.google={script:{url:{getLocation:function(cb){}},run:(function(){var ok,no;var o={withSuccessHandler:function(f){ok=f;return o},withFailureHandler:function(f){no=f;return o},api:function(l,n,a){CALLS.push([n,JSON.parse(JSON.stringify(a||[]))]);var f=ok,g=no;
if(n==='startDaten')setTimeout(function(){f(window.START)},5);
if(n==='starteAnalyse'||n==='rechercheJetzt')setTimeout(function(){f(window.mach(a[0]))},5);
if(n==='suche')setTimeout(function(){
  if(a[0]==='4251192100001')f({inSchlange:true,sofort:false,etikett:true,treffer:[{id:'PG-110',bezeichnung:'Toniebox',status:'Offen',recherche:'Bereit'}],rt:[{id:'PG-111',bezeichnung:'Toniebox',barcode:'4251192100001',tab:'Stationär',lagerort:'Eingang',archiv:false,status:''}]});
  else if(a[0]==='PG-110')f({inSchlange:true,sofort:true,treffer:[{id:'PG-110',bezeichnung:'Toniebox',status:'Offen',recherche:'Bereit',d:window.mach('PG-110')}],rt:[]});
  else f({inSchlange:false,treffer:[{id:'PG-120',bezeichnung:'Föhn',status:'Erledigt'}],rt:[{id:'PG-120',bezeichnung:'Föhn',barcode:'',tab:'Analyse',lagerort:'Analyse',archiv:false,status:'Erledigt'}]});
},5);
if(n==='uebernehmen')setTimeout(function(){ if(a[0]==='PG-120'&&a[1]!=='retoure') f({erledigt:'A-000007 · AB · 20.10.2026 10:00',id:'PG-120'}); else f({id:a[0]}); },5);
if(n==='abschliessen')setTimeout(function(){var m=window.ABS; f(typeof m==='function'?m(a[0]):{nr:'A-000042',pgid:a[0].id,reusable:true,grade:'C',regal:'Analysiert',befund:'b',verkaufsinfo:'v',dauerMin:1,budget:10,zahlen:{offen:2,bereit:1,laeuft:0}})},100);
if(n==='fotoStand')setTimeout(function(){f({id:a[0],bezeichnung:'Föhn',zahl:{hauptbild:window.FOTOS||0,weitere:0,typenschild:0,mangel:0},liste:[]})},5);
if(n==='fotoHochladen')setTimeout(function(){ if(window.FOTO_FEHLER>0){window.FOTO_FEHLER--;g(new Error('NetworkError'));return;} window.FOTOS=(window.FOTOS||0)+1; f({id:a[0],bezeichnung:'Föhn',zahl:{hauptbild:window.FOTOS,weitere:0,typenschild:0,mangel:0},liste:[]}); },5);
if(n==='adminDaten')setTimeout(function(){f({ki:true,ausloeser:true,importAn:true,url:'#',startpreis:{A:50,B:50,C:35},batches:[],schlange:{zahlen:{offen:1,bereit:1,laeuft:0,fehler:0},liste:[],zuletzt:'24.10.2026 09:00:00'},
  abgleich:{info:{verdacht:['PG-200 ~ AN-0027'],wieder:['PG-120'],nichtLesbar:['Tab «Caritas» (Spalte «Lagerort» fehlt)'],ohneBez:['PG-300 (Stationär)'],tabs:['Analyse','Stationär']},fehler:null,dauer:'24.10.2026 09:00:00 · 12 s: spiegeln 8 s',konten:['jonas@x','simon@x']}})},5);
if(n==='uiTempo'||n==='anmelden'||n==='bestellliste'||n==='werkstatt'||n==='vorab')setTimeout(function(){f(n==='vorab'?{}:(n==='bestellliste'?[]:(n==='werkstatt'?{konten:[],mittel:[],dienste:[]}:true)))},5);
}};return o;})()}};
window.mach=function(id,liste){return {produkt:{id:id,bezeichnung:'Gerät '+id,vp:100,budget:10,stufe:'Vollprüfung',umfang:'Kern'},ablauf:['ident','sicher','funktion','zustand','entscheid'],kennung:'u1',
 zustand:{grade:[['A','Neu und originalverpackt',''],['B','Neu',''],['C','Gebraucht','']]},recherche:true,infos:[],handbuch:null,ident:{marke:'M',modell:id},rueckruf:null,firmware:false,
 funktion:{liste:liste||[{n:'Heizen',t:'Aufheizen',g:'Kern'},{n:'Timer',t:'Timer stellen',g:'Weitere'},{n:'Display',t:'Display zeigt Zeit',g:'Weitere'}],mittel:[],ungeprueft:[],ungeprueftKurz:[],defekte:[],hinweise:[]},
 liefer:{teile:[],unsicher:false},sicher:['Netzkabel ohne Schäden'],sicherAllgemein:1,reset:[],reparatur:{stundenansatz:50,grenze:25,hinweis:''},ricardo:{versand:[],fotoUrl:''},einst:{'Garantie Tage':30}};};</script>"""
html = html.replace('<head>', '<head>' + stub, 1).replace('</body>', '<script>' + quelle + '</script></body>', 1)
err = []
def bild(pg, n):
    if AUS: pg.screenshot(path=AUS + '/' + n + '.png', full_page=True)
def n(pg, name): return pg.evaluate("CALLS.filter(function(c){return c[0]==='%s'}).length" % name)
def letzter(pg, name): return pg.evaluate("CALLS.filter(function(c){return c[0]==='%s'}).pop()[1]" % name)
def bis_entscheid(pg, id):
    pg.evaluate("starten('%s')" % id); pg.wait_for_timeout(80)
    pg.evaluate("AN.s.sicher=true; AN.s.fn={0:'ok',1:'np',2:'ok'}; AN.s.grade='C'; AN.i=AN.d.ablauf.indexOf('entscheid'); AN.s.kanal='regal'; sichern(); zeichneAnalyse()")
    pg.wait_for_timeout(80)

with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 1300, 'height': 900}); pg = ctx.new_page()
    pg.on('pageerror', lambda e: err.append(str(e.stack)[:400]))
    ctx.route('http://app.test/', lambda r: r.fulfill(body=html, content_type='text/html; charset=utf-8'))
    pg.goto('http://app.test/'); pg.evaluate("localStorage.clear(); localStorage.setItem('at-kuerzel','XX'); localStorage.setItem('at-kuerzel-tag', heute())"); pg.reload(); pg.wait_for_timeout(300)
    assert pg.evaluate('!!window.URTEIL'), 'Urteil im Browser geladen'

    # N7: Abgleich-Fehler auf der Startseite
    assert pg.is_visible('#abgleich-info') and 'nicht erreichbar' in pg.text_content('#abgleich-info'), 'N7: Fehler auf der Startseite'

    # H1: Barcode → Liste mit Hinweis «Etikett», kein Start; weitere Stücke aus dem Return Tool mit «Übernehmen»
    pg.fill('#q', '4251192100001'); pg.press('#q', 'Enter'); pg.wait_for_timeout(150)
    assert pg.evaluate('!AN'), 'H1: per Barcode kein Sofortstart'
    assert 'Etikett' in pg.text_content('#such-meldung') and 'weitere Stücke' in pg.text_content('#such-meldung'), pg.text_content('#such-meldung')
    assert pg.is_visible('#treffer button[data-a="starten"][data-v="PG-110"]') and pg.is_visible('#treffer button[data-a="uebernehmen"][data-v="PG-111"]'), 'H1: Liste und Return Tool'
    bild(pg, 'p2410_h1')
    # K1: «Übernehmen und analysieren» ruft uebernehmen über api
    pg.click('#treffer button[data-a="uebernehmen"][data-v="PG-111"]'); pg.wait_for_timeout(200)
    assert letzter(pg, 'uebernehmen') == ['PG-111', False] and pg.evaluate('AN && AN.d.produkt.id') == 'PG-111', 'K1'
    assert pg.evaluate('typeof AN.lauf') == 'string' and len(pg.evaluate('AN.lauf')) > 8, 'H2: Analyse hat eine Lauf-ID'
    pg.evaluate("abbruchJetzt()"); pg.wait_for_timeout(50)
    # H1: PG-ID startet sofort
    pg.fill('#q', 'PG-110'); pg.press('#q', 'Enter'); pg.wait_for_timeout(150)
    assert pg.evaluate('AN && AN.d.produkt.id') == 'PG-110', 'H1: PG-ID startet sofort'
    pg.evaluate("abbruchJetzt()"); pg.wait_for_timeout(50)

    # N5: erledigtes Stück → «Retoure? Neu analysieren» → Rückfrage → mit «retoure» übernommen
    pg.fill('#q', 'Föhn'); pg.press('#q', 'Enter'); pg.wait_for_timeout(150)
    assert 'Schon analysiert' in pg.text_content('#treffer') and pg.locator('#treffer button[data-v="PG-120"]').count() == 0
    pg.click('#treffer a[data-a="nochmal"][data-v="PG-120"]'); pg.wait_for_timeout(150)
    assert 'A-000007' in pg.text_content('#such-meldung') and pg.evaluate('!AN'), 'N5: Rückfrage mit alter Analyse'
    pg.click('#such-meldung button[data-a="retoure"]'); pg.wait_for_timeout(200)
    assert letzter(pg, 'uebernehmen') == ['PG-120', 'retoure'] and pg.evaluate('AN && AN.d.produkt.id') == 'PG-120', 'N5: neu analysieren'
    pg.evaluate("abbruchJetzt()"); pg.wait_for_timeout(50)

    # H2/H3: Abschluss schickt Lauf-ID, Version, Namen; Konflikt → unter «Pausiert» mit Meldung, nicht verworfen
    bis_entscheid(pg, 'PG-1')
    lauf = pg.evaluate('AN.lauf')
    pg.evaluate("window.ABS=function(d){return {konflikt:{id:d.id,kuerzel:'AB',zeit:'24.10.2026 09:12',nr:'A-000001'}};}; 1")
    pg.evaluate("abschluss()"); pg.wait_for_timeout(400)
    d = letzter(pg, 'abschliessen')[0]
    assert d['lauf'] == lauf and d['v'] == '2026-10-24.2' and d['bezug']['fn'] == ['Heizen', 'Timer', 'Display'] and d['ueb'] == 'u1', 'H2/M1: Lauf-ID, Version, Namen mitgeschickt'
    pz = pg.evaluate("pausierte()")
    assert len(pz) == 1 and pz[0]['d']['produkt']['id'] == 'PG-1' and 'AB' in pz[0]['fehler'] and pz[0]['lauf'] == lauf, 'H3: Analyse unter «Pausiert» mit Kürzel'
    assert pg.evaluate("JSON.parse(localStorage.getItem('at-speichern')).length") == 0
    # gleiche Situation auf Englisch: dasselbe Kennzeichen, dieselbe Behandlung
    pg.evaluate("sprache('en')"); pg.click('#nav-pausiert button[data-v="PG-1"]'); pg.wait_for_timeout(100)
    pg.evaluate("abschluss()"); pg.wait_for_timeout(400)
    pz = pg.evaluate("pausierte()")
    assert len(pz) == 1 and 'already been analysed' in pz[0]['fehler'], 'H3: auch auf Englisch nicht verworfen: ' + pz[0].get('fehler', '')
    pg.evaluate("sprache('de')")
    # H2: Server meldet «schon gespeichert» → aus der Warteschlange, nicht unter «Pausiert»
    pg.click('#nav-pausiert button[data-v="PG-1"]'); pg.wait_for_timeout(100)
    pg.evaluate("window.ABS=function(d){return {nr:'A-000001',pgid:d.id,reusable:true,grade:'C',regal:'Analysiert',befund:'b',verkaufsinfo:'v',schon:true};}; 1")
    pg.evaluate("abschluss()"); pg.wait_for_timeout(400)
    assert pg.evaluate("pausierte().length") == 0 and pg.evaluate("SP.length") == 0, 'H2: schon gespeichert'

    # M1: Server meldet geänderten Überblick → Antworten nach Namen zugeordnet, weiter beim geänderten Schritt (unter «Pausiert»)
    bis_entscheid(pg, 'PG-2')
    pg.evaluate("""window.ABS=function(d){var n=window.mach('PG-2',[{n:'Display',t:'Display zeigt Zeit',g:'Weitere'},{n:'Heizen',t:'Aufheizen',g:'Kern'},{n:'Neu',t:'Neue Funktion',g:'Weitere'}]);
      n.sicher=['Netzkabel ohne Schäden','Dichtung eingesetzt (Handbuch S. 4)']; return {ueberblickNeu:true,d:n,neu:['Sicherheit','Funktion']};}; 1""")
    pg.evaluate("abschluss()"); pg.wait_for_timeout(400)
    pz = pg.evaluate("pausierte()")
    a = pz[0]
    assert a['d']['sicher'][1].startswith('Dichtung') and a['s']['sicher'] is False, 'M1: «alles in Ordnung» gilt nicht für neue Sicherheitspunkte'
    assert a['s']['fn'] == {'0': 'ok', '1': 'ok'}, 'M1: Display (war ok) und Heizen (ok) nach Namen, «Neu» offen: ' + json.dumps(a['s']['fn'])
    assert a['i'] == 1 and 'Sicherheit' in a['fehler'], 'M1: weiter beim ersten geänderten Schritt (Sicherheit)'
    pg.click('#nav-pausiert button[data-v="PG-2"]'); pg.wait_for_timeout(100)
    assert pg.evaluate('AN.d.produkt.id') == 'PG-2' and pg.evaluate("AN.d.ablauf[AN.i]") == 'sicher'
    bild(pg, 'p2410_m1')
    pg.evaluate("abbruchJetzt()"); pg.wait_for_timeout(50)

    # N6: laufende Analyse aus einer alten Version (ohne Lauf-ID) bleibt nach dem Neuladen
    alt = pg.evaluate("(function(){var d=window.mach('PG-3');return JSON.stringify({v:'2026-10-15.13',d:d,start:Date.now(),aktiv:60000,seit:Date.now(),i:1,s:leer(d),gate:null,rm:{},hb:null});})()")
    pg.evaluate("localStorage.setItem('at-lauf', %s)" % json.dumps(alt)); pg.reload(); pg.wait_for_timeout(300)
    assert pg.evaluate('AN && AN.d.produkt.id') == 'PG-3' and pg.evaluate('AN.i') == 1 and len(pg.evaluate('AN.lauf') or '') > 8, 'N6: alte Analyse nicht verworfen, bekommt Lauf-ID'
    assert not pg.evaluate('ZWEITER'), 'M5: Neuladen gilt nicht als zweites Tab'

    # M5: zweites Tab im selben Browser
    pg2 = ctx.new_page(); pg2.on('pageerror', lambda e: err.append(str(e.stack)[:400]))
    pg2.goto('http://app.test/'); pg2.wait_for_timeout(400)
    assert pg2.evaluate('ZWEITER') and 'anderen Tab' in pg2.text_content('#toast'), 'M5: Warnung im zweiten Tab'
    pg.wait_for_timeout(3500)
    assert pg.evaluate('ZWEITER'), 'M5: Warnung auch im ersten Tab'
    # Tab 2 beginnt eine eigene Analyse: die des ersten Tabs (PG-3) wird nicht überschrieben, sondern landet unter «Pausiert»
    pg2.evaluate("starten('PG-4')"); pg2.wait_for_timeout(150)
    assert pg2.evaluate("JSON.parse(localStorage.getItem('at-lauf')).d.produkt.id") == 'PG-4'
    assert any(x['d']['produkt']['id'] == 'PG-3' for x in pg2.evaluate("pausierte()")), 'M5: Analyse des anderen Tabs unter «Pausiert» gesichert'
    # Speicher-Warteschlange: Einträge beider Tabs bleiben
    pg2.evaluate("SP.push({k:'XX',id:'PG-8',titel:'x',d:{id:'PG-8',lauf:'L-8',kuerzel:'XX'},an:{},versuche:0}); SP_LAEUFT=true; spMerken();")
    pg.evaluate("SP.push({k:'XX',id:'PG-9',titel:'y',d:{id:'PG-9',lauf:'L-9',kuerzel:'XX'},an:{},versuche:0}); SP_LAEUFT=true; spMerken();")
    ids = pg.evaluate("JSON.parse(localStorage.getItem('at-speichern')).map(function(x){return x.id}).sort()")
    assert ids == ['PG-8', 'PG-9'], 'M5: beide Einträge im Speicher: %s' % ids
    pg2.close(); pg.evaluate("SP=[]; SP_WEG={'L-8':1,'L-9':1}; SP_LAEUFT=false; spMerken(); abbruchJetzt()"); pg.wait_for_timeout(50)

    # N8: Foto-Seite, Upload scheitert zweimal (neuer Versuch), dann dreimal (Knopf «Nochmals hochladen»)
    pg.evaluate("localStorage.clear(); fotoModus('PG-5')"); pg.wait_for_timeout(100)
    pg.evaluate("window.verkleinern=function(d,f){f('data:image/jpeg;base64,AAAA')}; window.FOTO_FEHLER=2; FS.art='hauptbild'; fsHoch({name:'a.jpg'});")
    pg.wait_for_timeout(10500)
    assert pg.evaluate('window.FOTOS') == 1 and pg.evaluate('(FS.fehl||[]).length') == 0, 'N8: nach zwei Fehlern beim dritten Versuch hochgeladen'
    pg.evaluate("window.FOTO_FEHLER=3; FS.art='hauptbild'; fsHoch({name:'b.jpg'});"); pg.wait_for_timeout(10500)
    assert pg.evaluate('(FS.fehl||[]).length') == 1 and pg.is_visible('#fs-liste button[data-a="fsNochmal"]'), 'N8: nicht verloren, Knopf «Nochmals hochladen»'
    bild(pg, 'p2410_n8')
    pg.click('#fs-liste button[data-a="fsNochmal"]'); pg.wait_for_timeout(300)
    assert pg.evaluate('window.FOTOS') == 2 and pg.evaluate('FS.fehl.length') == 0, 'N8: nochmals hochgeladen'

    # Admin: Listen des letzten Abgleichs mit «Übernehmen»
    pg.goto('http://app.test/'); pg.evaluate("localStorage.clear(); localStorage.setItem('at-kuerzel','XX'); localStorage.setItem('at-kuerzel-tag', heute())"); pg.reload(); pg.wait_for_timeout(300)
    pg.evaluate("zeige('admin')"); pg.wait_for_timeout(200)
    t = pg.text_content('#adm-status')
    assert 'PG-200 ~ AN-0027' in t and 'PG-120' in t and 'Caritas' in t and 'PG-300' in t and 'mehreren Konten' in t and '12 s' in t, 'Admin-Listen: ' + t[:300]
    pg.click('#adm-status button[data-a="admUebernehmen"][data-v="PG-200"]'); pg.wait_for_timeout(200)
    assert letzter(pg, 'uebernehmen') == ['PG-200', False], 'M4: aus dem Admin übernehmen'
    bild(pg, 'p2410_admin')
    b.close()
assert not err, err
print('t_analyse_p2410_ui ok')
