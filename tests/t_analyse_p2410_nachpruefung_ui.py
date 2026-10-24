import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))  # Pfade relativ zu tests/
"""Nachprüfung 24.10.2026, Analyse Tool, Oberfläche: Befund 2 (Handbuch während der Analyse gelesen: Der Browser holt den neuen Überblick und stellt
die Antworten um, statt dass der Server den Abschluss mit «Sicherheit neu bestätigen» zurückweist). Erfundene Daten. Lauf: python3 tests/t_analyse_p2410_nachpruefung_ui.py"""
import subprocess
from playwright.sync_api import sync_playwright
html = open('../apps/analyse/Index.html', encoding='utf8').read()
quelle = subprocess.check_output(['node', '-e', "const fs=require('fs'),vm=require('vm');const c={console,Utilities:{formatDate:()=>''}};vm.createContext(c);vm.runInContext(fs.readFileSync('../apps/analyse/Code.gs','utf8'),c);process.stdout.write(c.urteilQuelle_())"]).decode('utf8')
stub = """<script>window.CALLS=[];window.HB=false;
window.START={version:'x',admin:false,zahlen:{offen:1,bereit:1,laeuft:0},listen:{kategorie:[]},reparatur:[]};
window.google={script:{url:{getLocation:function(cb){}},run:(function(){var ok,no;var o={withSuccessHandler:function(f){ok=f;return o},withFailureHandler:function(f){no=f;return o},api:function(l,n,a){CALLS.push([n,JSON.parse(JSON.stringify(a||[]))]);var f=ok;
if(n==='startDaten')setTimeout(function(){f(window.START)},5);
if(n==='starteAnalyse'||n==='rechercheJetzt')setTimeout(function(){f(window.mach(a[0]))},5);
if(n==='abschliessen')setTimeout(function(){f({nr:'A-1',pgid:a[0].id,reusable:true,grade:'C',regal:'Analysiert',befund:'b',verkaufsinfo:'v',dauerMin:1,budget:10,zahlen:{offen:0,bereit:0,laeuft:0}})},20);
if(n==='uiTempo'||n==='anmelden'||n==='vorab')setTimeout(function(){f(n==='vorab'?{}:true)},5);
}};return o;})()}};
window.mach=function(id){var hb=window.HB;return {produkt:{id:id,bezeichnung:'Toaster '+id,vp:100,budget:10,stufe:'Vollprüfung',umfang:'Kern'},
 ablauf:hb?['ident','sicher','funktion','zustand','entscheid']:['ident','handbuch','sicher','funktion','zustand','entscheid'],kennung:hb?'u2':'u1',
 zustand:{grade:[['A','Neu',''],['B','Neu',''],['C','Gebraucht','']]},recherche:true,infos:[],
 handbuch:hb?{status:'gelesen',datei:'',themen:{}}:{status:'Hochladen nötig',datei:'',manualslib:'',themen:{}},ident:{marke:'Dualit',modell:'Lite'},rueckruf:null,firmware:false,
 funktion:{liste:[{n:'Heizen',t:'Aufheizen',g:'Kern'},{n:'Timer',t:'Timer stellen',g:'Weitere'}],mittel:[],ungeprueft:[],ungeprueftKurz:[],defekte:[],hinweise:[]},
 liefer:{teile:['Krümelschublade'],unsicher:false},sicherAllgemein:1,
 sicher:hb?['Netzkabel ohne Schäden','Netzkabel auf Quetschungen prüfen (Handbuch S. 4)']:['Netzkabel ohne Schäden','Gehäuse ohne Risse'],
 reset:[],reparatur:{stundenansatz:50,grenze:25,hinweis:''},ricardo:{versand:[],fotoUrl:''},einst:{'Garantie Tage':30}};};</script>"""
html = html.replace('<head>', '<head>' + stub, 1).replace('</body>', '<script>' + quelle + '</script></body>', 1)
err = []
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 1300, 'height': 900}); pg = ctx.new_page()
    pg.on('pageerror', lambda e: err.append(str(e.stack)[:400]))
    ctx.route('http://app.test/', lambda r: r.fulfill(body=html, content_type='text/html; charset=utf-8'))
    pg.goto('http://app.test/'); pg.evaluate("localStorage.clear(); localStorage.setItem('at-kuerzel','XX'); localStorage.setItem('at-kuerzel-tag', heute())"); pg.reload(); pg.wait_for_timeout(300)

    # 1. Person ist schon bei «Funktion» (Sicherheit «alles in Ordnung»), dann ist das hochgeladene Handbuch gelesen
    pg.evaluate("window.HB=false; starten('PG-1')"); pg.wait_for_timeout(100)
    pg.evaluate("AN.s.sicher=true; AN.s.fn={0:'ok'}; AN.s.fehlt={0:true}; AN.i=AN.d.ablauf.indexOf('funktion'); sichern(); zeichneAnalyse()"); pg.wait_for_timeout(50)
    pg.evaluate("window.HB=true; hbNeu('PG-1', {status:'gelesen', datei:'', themen:{}})"); pg.wait_for_timeout(200)
    assert pg.evaluate("AN.d.sicher.join('|')") == 'Netzkabel ohne Schäden|Netzkabel auf Quetschungen prüfen (Handbuch S. 4)', 'Befund 2: neuer Überblick im Browser: ' + pg.evaluate("AN.d.sicher.join('|')")
    assert pg.evaluate("AN.d.ablauf[AN.i]") == 'sicher', 'Befund 2: zurück zur Sicherheit: ' + pg.evaluate("AN.d.ablauf[AN.i]")
    assert pg.evaluate("AN.s.sicher") is False and pg.evaluate("AN.s.fn[0]") == 'ok' and pg.evaluate("!!AN.s.fehlt[0]"), 'Befund 2: Sicherheit neu, übrige Antworten bleiben'
    assert 'Handbuch ist gelesen' in pg.text_content('#toast'), pg.text_content('#toast')
    assert pg.evaluate("AN.d.handbuch.status") == 'gelesen'
    # Der Abschluss schickt die neuen Namen (der Server findet nichts mehr zum Neu-Bestätigen)
    pg.evaluate("AN.s.sicher=true; AN.s.grade='C'; AN.s.kanal='regal'; AN.i=AN.d.ablauf.indexOf('entscheid'); sichern()")
    d = pg.evaluate("daten()")
    assert d['bezug']['sicher'] == ['Netzkabel ohne Schäden', 'Netzkabel auf Quetschungen prüfen (Handbuch S. 4)'] and 'handbuch' not in d['bezug']['ablauf'], d['bezug']

    # 2. Person ist noch vor der Sicherheit: kein Hinweis, sie bleibt, wo sie ist
    pg.evaluate("abbruchJetzt(); window.HB=false; starten('PG-2')"); pg.wait_for_timeout(100)
    pg.evaluate("AN.i=AN.d.ablauf.indexOf('handbuch'); sichern(); zeichneAnalyse(); document.getElementById('toast').hidden=true"); pg.wait_for_timeout(50)
    pg.evaluate("window.HB=true; hbNeu('PG-2', {status:'gelesen', datei:'', themen:{}})"); pg.wait_for_timeout(200)
    assert pg.evaluate("AN.d.ablauf[AN.i]") == 'sicher' and pg.evaluate("AN.d.sicher.length") == 2 and 'Quetschungen' in pg.evaluate("AN.d.sicher[1]"), 'Befund 2: vor der Sicherheit'
    assert pg.evaluate("document.getElementById('toast').hidden || document.getElementById('toast').textContent.indexOf('Handbuch ist gelesen') < 0"), 'kein Hinweis'

    # 3. Gleiche Sicherheitspunkte: nichts umstellen
    pg.evaluate("abbruchJetzt(); window.HB=false; starten('PG-3')"); pg.wait_for_timeout(100)
    pg.evaluate("AN.i=AN.d.ablauf.indexOf('funktion'); AN.s.sicher=true; sichern()")
    pg.evaluate("window.mach0=window.mach; window.mach=function(id){var x=window.mach0(id); x.sicher=['Netzkabel ohne Schäden','Gehäuse ohne Risse']; return x;}; window.HB=true; hbNeu('PG-3', {status:'gelesen', datei:'', themen:{}})"); pg.wait_for_timeout(200)
    assert pg.evaluate("AN.d.ablauf[AN.i]") == 'funktion' and pg.evaluate("AN.s.sicher") is True, 'gleiche Punkte: bleibt'
    b.close()
assert not err, err
print('ok: Befund 2 (Handbuch gelesen → Überblick im Browser umgestellt)')
