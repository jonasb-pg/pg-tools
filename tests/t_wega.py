import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))  # Pfade relativ zu tests/
"""Analyse Tool, Weg A (Jonas 19.10.2026): Urteil im Browser, Abschliessen im Hintergrund (Fehler -> Pausiert, Netz -> nochmals),
Suche mit Überblick, Vorladen, Zeitmessung. Erfundene Produkte. Lauf: python3 tests/t_wega.py"""
import subprocess
from playwright.sync_api import sync_playwright
html = open('../apps/analyse/Index.html', encoding='utf8').read()
quelle = subprocess.check_output(['node', '-e', "const fs=require('fs'),vm=require('vm');const c={console,Utilities:{formatDate:()=>''}};vm.createContext(c);vm.runInContext(fs.readFileSync('../apps/analyse/Code.gs','utf8'),c);process.stdout.write(c.urteilQuelle_())"]).decode('utf8')
stub = """<script>window.CALLS=[];window.ABS='ok';window.google={script:{url:{getLocation:function(cb){}},run:(function(){var ok,no;var o={withSuccessHandler:function(f){ok=f;return o},withFailureHandler:function(f){no=f;return o},api:function(l,n,a){CALLS.push([n,a]);var f=ok,g=no;
if(n==='startDaten')setTimeout(function(){f({version:'x',admin:false,zahlen:{offen:3,bereit:2,laeuft:0},listen:{kategorie:[]},reparatur:[]})},5);
if(n==='starteAnalyse')setTimeout(function(){f(window.mach(a[0]))},5);
if(n==='suche')setTimeout(function(){f({inSchlange:true,treffer:[{id:'PG-9',bezeichnung:'Gerät PG-9',status:'Offen',recherche:'Bereit',d:window.mach('PG-9')}]})},5);
if(n==='warteschlange')setTimeout(function(){f({zahlen:{offen:2,bereit:2,laeuft:0},liste:[{id:'PG-5',bezeichnung:'Gerät PG-5',status:'Offen',recherche:'Bereit'},{id:'PG-6',bezeichnung:'Gerät PG-6',status:'Offen',recherche:'Bereit'}],zuletzt:''})},5);
if(n==='vorab')setTimeout(function(){var m={};a[0].forEach(function(id){m[id]=window.mach(id)});f(m)},5);
if(n==='uiTempo')setTimeout(function(){f(true)},5);
if(n==='abschliessen')setTimeout(function(){var m=window.ABS;if(m==='netz'){window.ABS='ok';g(new Error('NetworkError: connection failure'));return;}
 if(m==='fehler'){g(new Error('Es fehlen noch Fotos: Hauptbild.'));return;} f({nr:'A-000042',pgid:'PG-1',reusable:true,grade:'A',regal:'Analysiert',befund:'b',verkaufsinfo:'v',dauerMin:1,budget:10,zahlen:{offen:2,bereit:1,laeuft:0}})},400);
}};return o;})()}};
window.mach=function(id){return {produkt:{id:id,bezeichnung:'Gerät '+id,vp:100,budget:10,stufe:'Vollprüfung',umfang:'Kern'},ablauf:['ident','funktion','zustand','entscheid'],
 zustand:{grade:[['A','Neu und originalverpackt',''],['B','Neu',''],['C','Gebraucht','']]},recherche:true,infos:[],handbuch:null,ident:{marke:'M',modell:id},rueckruf:null,firmware:false,
 funktion:{liste:[{n:'Ein',t:'Einschalten',g:'Kern'}],mittel:[],ungeprueft:[],ungeprueftKurz:[],defekte:[],hinweise:[]},liefer:{teile:[],unsicher:false},sicher:[],reset:[],
 reparatur:{stundenansatz:50,grenze:25,hinweis:''},ricardo:{versand:[],fotoUrl:''},einst:{'Garantie Tage':30}};};</script>"""
html = html.replace('<head>', '<head>' + stub, 1).replace('</body>', '<script>' + quelle + '</script></body>', 1)
err = []
n = lambda pg, name: pg.evaluate("CALLS.filter(function(c){return c[0]==='%s'}).length" % name)
def bis_entscheid(pg, id):
    pg.evaluate("starten('%s')" % id); pg.wait_for_timeout(100)
    pg.evaluate("AN.s.fn = {0: 'ok'}; AN.s.grade = 'A'; AN.s.kanal = 'regal'; AN.i = AN.d.ablauf.indexOf('entscheid'); sichern(); zeichneAnalyse()"); pg.wait_for_timeout(100)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1300, 'height': 900})
    pg.on('pageerror', lambda e: err.append(str(e.stack)[:400]))
    pg.route('http://app.test/', lambda r: r.fulfill(body=html, content_type='text/html; charset=utf-8'))
    pg.goto('http://app.test/'); pg.evaluate("localStorage.clear(); localStorage.setItem('at-kuerzel','XX'); localStorage.setItem('at-kuerzel-tag', heute())"); pg.reload(); pg.wait_for_timeout(300)
    assert pg.evaluate('!!window.URTEIL'), 'Urteil im Browser geladen'
    # 1. Urteil im Browser: kein pruefen
    bis_entscheid(pg, 'PG-1')
    assert n(pg, 'pruefen') == 0, 'kein Aufruf pruefen'
    assert pg.evaluate('LAUF.urteil && LAUF.urteil.reusable === true && LAUF.urteil.grade === "A"'), pg.evaluate('JSON.stringify(LAUF.urteil)')
    # 2. Abschliessen: Fertig sofort, Speichern im Hintergrund, Nummer kommt nach
    pg.evaluate('abschluss()')
    assert pg.evaluate('AN') is None and 'abgeschlossen' in pg.text_content('#fertig') and 'Wird gespeichert' in pg.text_content('#fertig'), pg.text_content('#fertig')
    assert pg.is_visible('#sp-info')
    pg.wait_for_timeout(600)
    assert 'A-000042' not in pg.text_content('#fertig') and 'PG-1 ·' in pg.text_content('#fertig') and pg.evaluate('SP.length') == 0 and not pg.is_visible('#sp-info'), pg.text_content('#fertig')
    # 3. Abgelehnt: zurück zu Pausiert mit Meldung, beim Fortsetzen am Entscheid
    pg.evaluate("ABS='fehler'"); bis_entscheid(pg, 'PG-2'); pg.evaluate('abschluss()'); pg.wait_for_timeout(600)
    assert 'Gerät PG-2' in pg.text_content('#nav-pausiert') and '⚠' in pg.text_content('#nav-pausiert'), pg.text_content('#nav-pausiert')
    assert 'Fotos' in pg.inner_text('#toast') and pg.evaluate('SP.length') == 0
    pg.click('#nav-pausiert button[data-v="PG-2"]'); pg.wait_for_timeout(100)
    assert pg.evaluate('AN.d.produkt.id') == 'PG-2' and pg.evaluate("AN.d.ablauf[AN.i]") == 'entscheid' and pg.evaluate('AN.s.grade') == 'A'
    pg.evaluate('abbruchJetzt()')
    # 4. Netz weg: bleibt in der Warteschlange und geht beim zweiten Versuch durch, auch über ein Neuladen
    pg.evaluate("ABS='netz'"); bis_entscheid(pg, 'PG-3'); pg.evaluate('abschluss()'); pg.wait_for_timeout(600)
    assert pg.evaluate('SP.length') == 1 and pg.evaluate("JSON.parse(localStorage.getItem('at-speichern')).length") == 1
    pg.wait_for_timeout(6000)
    assert pg.evaluate('SP.length') == 0 and n(pg, 'abschliessen') == 4, n(pg, 'abschliessen')
    # 5. Suche mit einem Treffer: startet ohne starteAnalyse
    s0 = n(pg, 'starteAnalyse')
    pg.fill('#q', 'Gerät PG-9'); pg.evaluate('suchen()'); pg.wait_for_timeout(100)
    assert pg.evaluate('AN && AN.d.produkt.id') == 'PG-9' and n(pg, 'starteAnalyse') == s0
    pg.evaluate('abbruchJetzt()')
    # 6. Liste: vorab geholt, Start sofort
    pg.evaluate("vorabHolen([{id:'PG-5',status:'Offen',recherche:'Bereit'},{id:'PG-6',status:'Offen',recherche:'Bereit'},{id:'PG-7',status:'Offen',recherche:'Offen'}])"); pg.wait_for_timeout(200)
    assert n(pg, 'vorab') == 1 and pg.evaluate("CALLS.filter(function(c){return c[0]==='vorab'})[0][1][0].join()") == 'PG-5,PG-6'
    pg.evaluate("starten('PG-6')"); pg.wait_for_timeout(50)
    assert pg.evaluate('AN && AN.d.produkt.id') == 'PG-6' and n(pg, 'starteAnalyse') == s0
    # 7. Zeitmessung: Zusammenfassung an den Server
    pg.evaluate('uiSenden()'); pg.wait_for_timeout(50)
    z = pg.evaluate("CALLS.filter(function(c){return c[0]==='uiTempo'})[0][1][0]")
    assert any(x[0] == 'abschliessen' and x[4] is False for x in z) and any(x[0] == 'startDaten' for x in z), z
    b.close()
assert not err, err
print('t_wega ok')
