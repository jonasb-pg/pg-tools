import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))  # Pfade relativ zu tests/
"""Analyse Tool: Suche findet Stücke im ganzen Return Tool und übernimmt sie mit PG-ID; «ohne Inventar» zeigt zuerst Treffer (Jonas 23.10.2026). Erfundene Produkte."""
import sys
from playwright.sync_api import sync_playwright
html = open('../apps/analyse/Index.html', encoding='utf8').read()
AUS = sys.argv[1] if len(sys.argv) > 1 else None
stub = """<script>window.CALLS=[];window.google={script:{url:{getLocation:function(cb){}},run:(function(){var ok,no;var o={withSuccessHandler:function(f){ok=f;return o},withFailureHandler:function(f){no=f;return o},api:function(l,n,a){CALLS.push([n,a]);var f=ok,g=no;
if(n==='startDaten')setTimeout(function(){f({version:'x',admin:false,zahlen:{offen:3,bereit:2,laeuft:0},listen:{kategorie:['Kids']},reparatur:[]})},5);
if(n==='suche')setTimeout(function(){ if(a[0]==='PG-50') f({treffer:[{id:'PG-50',bezeichnung:'Babymoov',kategorie:'',ovp:100,recherche:'Bereit',status:'Offen',anzahl:2,an:'AN-0027 (Erledigt)'}],inSchlange:true,rt:[]}); else f({treffer:[{id:'PG-199',bezeichnung:'Toniebox 2',kategorie:'',ovp:100,recherche:'Bereit',status:'Erledigt',anzahl:1}],inSchlange:false,rt:[{id:'PG-201',bezeichnung:'Toniebox 2',barcode:'425',tab:'Stationär',lagerort:'KID-6',archiv:false,status:''},{id:'PG-202',bezeichnung:'Beurer',barcode:'',tab:'Stationär',lagerort:'Analyse',archiv:false,status:''},{id:'PG-203',bezeichnung:'Toniebox 3',barcode:'',tab:'Online',lagerort:'',archiv:false,status:'Erledigt'},{id:'',bezeichnung:'Ohne Nummer',barcode:'7611',tab:'Scanner',lagerort:'',archiv:false,ohneId:true},{id:'PG-300',bezeichnung:'Toniebox alt',barcode:'',tab:'Archiv Stationär',lagerort:'',archiv:true}]}); },5);
if(n==='uebernehmen')setTimeout(function(){ if(a[0]==='PG-202'&&!a[1]) f({zwilling:'AN-0028 (Erledigt)',id:'PG-202'}); else f({id:a[0]}); },5);
if(n==='rechercheJetzt'||n==='starteAnalyse')setTimeout(function(){f(window.mach(a[0]))},5);
if(n==='ohneInventar')setTimeout(function(){ if(!a[6]) f({kandidaten:[{id:'PG-202',bezeichnung:'Beurer MG 195',barcode:'',tab:'Stationär',lagerort:'Analyse',archiv:false}]}); else if(a[5].length<5) g({message:'Bitte angeben, warum das Stück nicht im Return Tool steht.'}); else f({id:'AN-0068'}); },5);
}};return o;})()}};
window.mach=function(id){return {produkt:{id:id,bezeichnung:'Gerät '+id,vp:100,budget:10,stufe:'Vollprüfung'},ablauf:['ident','funktion','entscheid'],zustand:{grade:[['A','x','x']]},recherche:true,infos:[],handbuch:null,ident:{marke:'M',modell:id},
 funktion:{liste:[{n:'Ein',t:'Ein',g:'Kern'}],mittel:[],ungeprueft:[],ungeprueftKurz:[],defekte:[],hinweise:[]},liefer:{teile:[]},sicher:[],reset:[],reparatur:{stundenansatz:50,grenze:25,hinweis:''},ricardo:{versand:[],fotoUrl:''}};};</script>"""
html = html.replace('<head>', '<head>' + stub, 1)
err = []
def bild(pg, n):
    if AUS: pg.screenshot(path=AUS + '/' + n + '.png', full_page=True)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1300, 'height': 900})
    pg.on('pageerror', lambda e: err.append(str(e.stack)[:400]))
    pg.route('http://app.test/', lambda r: r.fulfill(body=html, content_type='text/html; charset=utf-8'))
    pg.goto('http://app.test/'); pg.evaluate("localStorage.clear(); localStorage.setItem('at-kuerzel','XX'); localStorage.setItem('at-kuerzel-tag', heute())"); pg.reload(); pg.wait_for_timeout(300)
    assert pg.locator('[data-a="ohneZeigen"]').count() == 0, 'kein Weg mehr zu «Stück ohne Inventar» (Entscheid 24.10.2026)'
    pg.fill('#q', 'toniebox'); pg.press('#q', 'Enter'); pg.wait_for_timeout(150)
    assert 'im Return Tool' in pg.text_content('#such-meldung'), pg.text_content('#such-meldung')
    assert pg.is_visible('#treffer button[data-v="PG-201"]') and pg.locator('#treffer button[data-v="PG-300"]').count() == 0
    assert 'Archiv' in pg.text_content('#treffer')
    assert 'Im Analyse Tool' in pg.text_content('#treffer') and 'PG-199' in pg.text_content('#treffer'), 'erledigtes Schwesterstück und Return Tool zusammen'
    assert pg.locator('#treffer button[data-v="PG-203"]').count() == 0 and 'Schon analysiert' in pg.text_content('#treffer')
    assert 'Ohne PG-ID' in pg.text_content('#treffer')
    # möglicher AN-Doppel: zuerst Warnung, dann bewusst trotzdem
    pg.click('#treffer button[data-v="PG-202"]'); pg.wait_for_timeout(150)
    assert 'AN-0028' in pg.text_content('#such-meldung') and pg.evaluate('!AN')
    pg.click('#such-meldung button[data-a="uebernehmenTrotzdem"]'); pg.wait_for_timeout(200)
    assert pg.evaluate('AN && AN.d.produkt.id') == 'PG-202'
    assert pg.evaluate("CALLS.filter(function(c){return c[0]==='uebernehmen'}).pop()[1][1]") is True
    pg.evaluate("abbruchJetzt()"); pg.wait_for_timeout(100)
    # offen, aber vielleicht schon als AN analysiert: kein Sofortstart, Warnung sichtbar
    pg.fill('#q', 'PG-50'); pg.press('#q', 'Enter'); pg.wait_for_timeout(150)
    assert pg.evaluate('!AN') and 'AN-0027' in pg.text_content('#treffer') and '2 Stück' in pg.text_content('#treffer')
    pg.fill('#q', 'toniebox'); pg.press('#q', 'Enter'); pg.wait_for_timeout(150)
    bild(pg, 'pgid_suche')
    pg.click('#treffer button[data-v="PG-201"]'); pg.wait_for_timeout(200)
    assert pg.evaluate("CALLS.some(function(c){return c[0]==='uebernehmen'&&c[1][0]==='PG-201'})")
    assert pg.evaluate('AN && AN.d.produkt.id') == 'PG-201', 'Analyse läuft mit PG-ID'
    pg.evaluate("abbruchJetzt()"); pg.wait_for_timeout(100)
    # ohne Inventar: Treffer statt AN
    pg.evaluate("ohneZeigen()"); pg.fill('#o-name', 'Beurer MG 195'); pg.click('#o-knopf'); pg.wait_for_timeout(150)
    assert 'schon im Return Tool' in pg.text_content('#ohne-meldung') and pg.is_visible('#ohne-meldung button[data-v="PG-202"]')
    bild(pg, 'pgid_ohne')
    pg.click('#ohne-meldung button[data-a="ohneTrotzdem"]'); pg.wait_for_timeout(150)
    assert 'warum' in pg.text_content('#ohne-meldung'), pg.text_content('#ohne-meldung')
    assert pg.evaluate('!AN')
    pg.fill('#o-grund', 'Reuse-Spende ohne Etikett'); pg.evaluate("ohneTrotzdem()"); pg.wait_for_timeout(200)
    assert pg.evaluate('AN && AN.d.produkt.id') == 'AN-0068'
    b.close()
assert not err, err
print('t_pgid_ui ok')
