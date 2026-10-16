"""Ricardo Tool: Reiter «Zu erledigen» mit Stub (Preisvorschlag, Frage, Nachricht, Zahlung überfällig). Lauf: python3 tests/t_ricardo_aufgaben_ui.py [bild.png]"""
import json, pathlib, sys
from playwright.sync_api import sync_playwright
html = (pathlib.Path(__file__).parent.parent / 'ricardo-script/Index.html').read_text().replace('<?!= JSON.stringify(lang) ?>', '"de"')
AU = {'anzahl': 4, 'verpasst': 1,
      'kontrolle': {'aktiv': True, 'letzte': '16.10. 21:42', 'warnung': False, 'unecht': 0},
      'angebote': [{'id': 'm1', 'art': 'Preisvorschlag', 'eingang': '16.10. 12:08', 'alter': 2, 'titel': 'Neu: Haartrockner Z', 'pgId': 'PG-2002', 'artikel': '1332215532',
                    'betrag': '75.00', 'preis': '87.00', 'frist': '18.10. 12:08', 'restStunden': 37, 'empfehlung': 'Annehmen', 'link': 'https://www.ricardo.ch/de/a/1332215532'}],
      'fragen': [{'id': 'm2', 'art': 'Frage', 'eingang': '16.10. 10:25', 'alter': 26, 'titel': 'Neu: Soundkarte X', 'pgId': 'PG-3003', 'artikel': '1331877810', 'von': 'kaeufer_b',
                  'text': 'Guten Tag.\nIst das Netzteil dabei?', 'entwurf': 'Guten Tag\n\nJa, das Netzteil ist dabei.\n\nLiebe Grüsse, Pretty Good', 'link': 'https://www.ricardo.ch/de/a/1331877810'},
                 {'id': 'm3', 'art': 'Nachricht', 'eingang': '16.10. 05:42', 'alter': 5, 'titel': 'SUP-Board-Set Rot', 'pgId': '', 'artikel': '1331786830', 'von': 'kaeufer_c',
                  'text': '', 'entwurf': '', 'link': 'https://www.ricardo.ch/de/my-ricardo/messages/?conversationId=abc'}],
      'zahlung': [{'nr': '54006286', 'pgId': 'PG-1001', 'titel': 'Neu: Testgerät Babyphone', 'kaeufer': 'kaeufer_a', 'total': '99.00', 'tage': 4, 'meldet': '16.10.2026',
                   'link': 'https://www.ricardo.ch/de/my-ricardo/selling/order/54006286', 'entwurf': 'Hallo Anna\n\nVielen Dank ...\n\nLiebe Grüsse\nPretty Good'}]}
NACH = dict(AU, anzahl=3, fragen=AU['fragen'][1:])
DATEN = {'startDaten': {'version': 't', 'admin': False, 'zustaende': [], 'maengelPflicht': [], 'laufzeit': 6, 'retoureGruende': [], 'kiAktiv': True, 'mailAktiv': True, 'aktiv': 3, 'schwelle': 90},
         'analyseListe': [], 'verkaeufe': {'offen': []}, 'retouren': {'offen': []}, 'mailsJetzt': AU, 'aufgaben': AU, 'aufgabeErledigt': NACH}
stub = """<script>window.AUFRUFE=[];window.OFFEN=[];window.open=function(u){OFFEN.push(u)};window.google={script:{run:(function mk(ok,fail){return new Proxy({},{get:function(_,k){
 if(k==='withSuccessHandler')return function(f){return mk(f,fail)}; if(k==='withFailureHandler')return function(f){return mk(ok,f)};
 return function(l,name,args){AUFRUFE.push([name,args]);var D=%s;setTimeout(function(){ok&&ok(JSON.parse(JSON.stringify(D[name]||{})))},5)}}})})()}};</script>""" % json.dumps(DATEN)
html = html.replace('<head>', '<head>' + stub, 1)
fehler = 0
def ok(b, m):
    global fehler
    print('ok' if b else 'FEHLER', m); fehler += 0 if b else 1
with sync_playwright() as p:
    b = p.chromium.launch(); s = b.new_page(viewport={'width': 1300, 'height': 1500}); err = []
    s.on('pageerror', lambda e: err.append(str(e)))
    s.set_content(html); s.wait_for_timeout(300)
    ok(s.text_content('#z-aufgaben') == '4' and s.is_visible('#z-aufgaben'), 'Zähler beim Start (Mails im Hintergrund gelesen)')
    s.click('#nav-aufgaben'); s.wait_for_timeout(200)
    t = s.text_content('#a-liste')
    ok('Vorschlag CHF 75.00 (Preis CHF 87.00)' in t and 'noch 37 h' in t and 'Annehmen' in t, 'Preisvorschlag mit Frist und Empfehlung')
    ok('Ist das Netzteil dabei?' in t and s.input_value('#ae-0').startswith('Guten Tag'), 'Frage mit Entwurf')
    ok(s.eval_on_selector('.aufgabe.sehr-alt', 'e => e.innerText.indexOf("Soundkarte") > -1'), 'Frage älter als 24 h rot')
    ok('Die Nachricht steht nur auf Ricardo' in t, 'Nachricht ohne Text: Hinweis')
    ok('seit 4 Tagen nicht bezahlt' in t and 'Käufer meldet: bezahlt am 16.10.2026' in t, 'Zahlung überfällig')
    ok('empfohlen war: 1' in s.inner_text('#a-kontrolle') and 'Letzte Ricardo-Mail: 16.10. 21:42' in s.text_content('#a-kontrolle'), 'Kontrolle und verpasste Vorschläge')
    if len(sys.argv) > 1: s.screenshot(path=sys.argv[1], full_page=True)
    s.context.grant_permissions(['clipboard-read', 'clipboard-write'])
    s.click('text=Antwort kopieren und Ricardo öffnen'); s.wait_for_timeout(200)
    ok(s.evaluate('OFFEN[0]') == 'https://www.ricardo.ch/de/a/1331877810', 'Ricardo geöffnet')
    s.click('.aufgabe:has-text("Soundkarte") >> text=Erledigt'); s.wait_for_timeout(200)
    ok(s.evaluate('AUFRUFE.some(a => a[0] === "aufgabeErledigt" && a[1][0] === "m2")') and 'Soundkarte' not in s.inner_text('#a-liste') and s.text_content('#z-aufgaben') == '3', 'Erledigt: weg, Zähler 3')
    ok(not err, 'keine JS-Fehler ' + str(err))
    b.close()
print('alle Tests ok' if not fehler else '%d Fehler' % fehler); raise SystemExit(1 if fehler else 0)
