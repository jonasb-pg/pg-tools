#!/usr/bin/env python3
"""Baut apps/ricardo-test/Index.html aus apps/ricardo/Index.html (Live) + cockpit.js.
Alle bisherigen Ansichten und Funktionen bleiben im Code; neu sind Cockpit, Navigation, Start."""
import pathlib, re
root = pathlib.Path(__file__).resolve().parents[1]
live = (root / 'ricardo' / 'Index.html').read_text(encoding='utf-8')
cockpit = (root / 'ricardo-test' / 'cockpit.js').read_text(encoding='utf-8')
s = live
n = 0
PAARE = []
def rep(a, b, count=1):
    global s, n
    assert s.count(a) == count, (s.count(a), a[:70])
    s = s.replace(a, b); n += 1; PAARE.append([a, b])

# 1. CSS
rep("</style>\n</head>", """  /* ---------- Cockpit (Umbau 30.10.2026) ---------- */
  .cp-top { display:flex; flex-wrap:wrap; gap:10px; align-items:center; margin-bottom:14px; }
  .cp-top input[type=text] { flex:1; min-width:260px; height:48px; }
  .cp-top button { white-space:nowrap; }
  .chips { display:flex; flex-wrap:wrap; gap:8px; margin:0 0 10px; }
  .chip { border-radius:24px; background:var(--weiss); display:inline-flex; align-items:center; gap:8px; }
  .chip.an { background:var(--pink); font-weight:900; }
  .chip .zahl { background:var(--weiss); }
  .chip.an .zahl { background:var(--ink); color:var(--weiss); border-color:var(--ink); }
  #cp-sub { margin:0 0 12px; min-height:20px; }
  .klein-knopf { min-height:30px; padding:4px 10px; font-size:12px; margin-left:8px; }
  .cp-zeile { cursor:pointer; }
  .cp-zeile:hover td { background:var(--pink-hell); }
  .cp-zeile.an td { background:var(--pink); }
  .cp-zeile td.pfeil { text-align:right; color:var(--muted); }
  .cp-zeile .etikett { margin:2px 4px 2px 0; }
  #cp-veil { position:fixed; inset:0; z-index:35; background:rgba(10,10,10,.35); display:flex; justify-content:flex-end; }
  #cp-veil[hidden] { display:none; }
  #cp-panel { width:min(560px, 100%); height:100%; overflow-y:auto; background:var(--weiss); border-left:2px solid var(--ink); display:flex; flex-direction:column; animation:cp-slide .18s ease-out; }
  .cp-body .still, .cp-kopf .still, .cp-body .klein { color:#3b3b39; }
  .cp-body input[type=text] { width:100%; height:40px; font-size:15px; margin:2px 0 6px; }
  .cp-body input[type=file] { max-width:100%; }
  #f-schritte #ls-1 > .inhalt > h3, #f-schritte #ls-2 > .inhalt > h3, #f-schritte #ls-3 > .inhalt > h3 { display:none; }
  #r-ende { align-self:center; white-space:nowrap; font-weight:600; }
  @keyframes cp-slide { from { transform:translateX(24px); opacity:.6; } to { transform:none; opacity:1; } }
  .cp-kopf { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; padding:18px 18px 14px; border-bottom:2px solid var(--ink); position:sticky; top:0; background:var(--pink); z-index:1; }
  .cp-kopf strong { display:block; font:900 20px/1.2 var(--sans); }
  .cp-kopf .still { display:block; margin-top:4px; }
  .cp-kopf .x { min-height:0; width:40px; height:40px; padding:0; border-radius:50%; font-size:22px; line-height:1; flex:none; }
  .cp-body { padding:16px 18px 40px; display:flex; flex-direction:column; gap:12px; }
  .cp-jetzt { background:#fff3e0; border:3px solid #e08a00; border-radius:4px; padding:14px 16px; }
  .cp-body .ok, .cp-schritte .ok { background:#dff3df; border:1px solid #6fbf6f; border-radius:4px; padding:6px 10px; margin:0 0 6px; }
  .cp-tun { padding:10px 12px; border:2px solid var(--ink); border-radius:4px; background:var(--weiss); margin-bottom:12px; align-items:center; }
  .cp-tun .f-label { margin:0 6px 0 0; }
  .chip.tun { background:#fff3e0; }
  .chip.tun.an { background:#e08a00; color:var(--weiss); }
  .cp-bankzeile { border:1px solid var(--linie); border-radius:4px; padding:8px 10px; }
  .cp-jetzt .f-label { margin-bottom:8px; }
  .cp-block { margin:0; border:2px solid var(--ink); border-radius:4px; background:var(--pink-hell); padding:0; }
  .cp-block > summary { padding:12px 16px; font:900 15px/1.2 var(--sans); text-transform:uppercase; letter-spacing:.3px; }
  .cp-block > div { padding:0 16px 14px; }
  .cp-hilfe { margin:8px 0 0; border:0; padding:0; }
  .cp-hilfe > summary { font-size:13px; color:var(--muted); font-weight:600; }
  .cp-hilfe p { margin:6px 0 0; }
  .cp-body .knoepfe { display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; }
  .cp-body textarea { width:100%; margin-top:4px; }
  .cp-body .frage { white-space:pre-wrap; background:var(--pink-hell); border:1px solid var(--linie); border-radius:4px; padding:8px 10px; margin:6px 0; }
  .cp-body .f-wahl { margin:10px 0 4px; }
  .cp-body .tabelle { margin-top:8px; }
  .cp-body label { margin:12px 0 4px; }
  @media (max-width: 860px) { #cp-panel { width:100%; } .cp-top input[type=text] { min-width:0; } }
</style>
</head>""")

# 2. Navigation: neue Knöpfe, alte bleiben versteckt (die Funktionen dahinter laufen weiter)
rep("""    <div class="nav">
      <div class="sektion gross" data-t="nav.ablaeufe"></div>
      <button id="nav-f-taeglich" class="flow" onclick="ablaufStarten('taeglich')">""",
"""    <div class="nav">
      <button id="nav-cockpit" onclick="zeigeCockpit()"><span data-t="nav.cockpit"></span></button>
      <button id="nav-todos" onclick="zeigeTodos()"><span data-t="nav.todos"></span><span class="zahl" id="z-todos" hidden></span></button>
      <button id="nav-listing" class="flow" onclick="ablaufStarten('schicht1')"><span>▸ <span data-t="nav.listing"></span></span><span class="zahl" id="z-listing" hidden></span></button>
      <div class="sektion gross" style="margin-top:8px" data-t="nav.sektion2"></div>
      <button id="nav-zahlen" onclick="zeigeZahlen()"><span data-t="nav.zahlen"></span></button>
      <button id="nav-einst" onclick="zeigeEinst()"><span data-t="nav.einst"></span></button>
      <div hidden>
      <div class="sektion gross" data-t="nav.ablaeufe"></div>
      <button id="nav-f-taeglich" class="flow" onclick="ablaufStarten('taeglich')">""")
rep("""      <button id="nav-admin" onclick="zeige('admin')" hidden><span data-t="nav.admin"></span></button>
    </div>""", """      <button id="nav-admin" onclick="zeige('admin')" hidden><span data-t="nav.admin"></span></button>
      </div>
    </div>""")
rep('<span class="gross">Ricardo</span>', '<span class="gross">Ricardo Tool</span>')

# 3. Cockpit-Abschnitt vor LISTEN
rep("""      <!-- ===================== LISTEN ===================== -->""", """      <!-- ===================== COCKPIT (Umbau 30.10.2026) ===================== -->
      <section id="s-cockpit" hidden>
        <div class="cp-top">
          <input type="text" id="cp-q" data-tp="c.such.platz" autocomplete="off">
          <button onclick="cpSuchen()" data-t="suchen"></button>
          <button onclick="cpBericht()" data-t="c.bericht"></button>
          <button onclick="cpBank()" data-t="c.bank"></button>
        </div>
        <p class="still" id="cp-stand" style="margin:-6px 0 12px"></p>
        <div id="cp-warn"></div>
        <div class="chips cp-tun" id="cp-tun"></div>
        <div class="chips" id="cp-chips"></div>
        <p class="still" id="cp-sub"></p>
        <div id="cp-liste"></div>
      </section>
      <div id="cp-veil" hidden onclick="if (event.target === this) cpZu()"><div id="cp-panel" role="dialog" aria-modal="true"></div></div>

      <!-- ===================== LISTEN ===================== -->""")

# 4. zeige(): Cockpit als Ansicht; Nav-Markierung
rep("""    ['listen', 'aufgaben', 'verkauf', 'ueber', 'retour', 'admin'].forEach(function (x) { $('s-' + x).hidden = was !== x; $('nav-' + x).className = was === x ? 'an' : ''; });
    $('s-ablauf').hidden = was !== 'ablauf';""",
"""    ['cockpit', 'listen', 'aufgaben', 'verkauf', 'ueber', 'retour', 'admin'].forEach(function (x) { $('s-' + x).hidden = was !== x; $('nav-' + x).className = was === x ? 'an' : ''; });
    $('s-ablauf').hidden = was !== 'ablauf';
    $('nav-listing').className = 'flow' + (was === 'ablauf' && FA === 'schicht1' ? ' an' : ''); $('nav-zahlen').className = was === 'admin' && ADM_GRUPPE === 'reporting' ? 'an' : ''; $('nav-einst').className = was === 'admin' && ADM_GRUPPE !== 'reporting' ? 'an' : '';
    if (was !== 'cockpit') { $('nav-todos').className = ''; if (typeof cpZu === 'function') cpZu(); }""")
rep("""    if (was === 'aufgaben') ladeAufgaben(false); else if (was === 'ueber')""", """    if (was === 'cockpit') { if (CP) { zeichneCockpit(); ladeCockpit(true); } else ladeCockpit(); return; }
    if (was === 'listen' && !ANA.length) ladeAnalyse();
    if (was === 'aufgaben') ladeAufgaben(false); else if (was === 'ueber')""")
rep("""    $('top-sub').textContent = was === 'ablauf' ? t('f.' + FA) : t('nav.' + was);
    if (was === 'ablauf') return;""", """    $('top-sub').textContent = was === 'ablauf' ? t('f.' + FA) : t('nav.' + was);
    if (was === 'ablauf') return;""")
# Marke Listing: Zahl aus dem Ablauf schicht1 (statt z-f-schicht1)
rep("function marken(l) { marke($('z-f-' + FA), l.length); }", "function marken(l) { marke($('z-f-' + FA), l.length); if (FA === 'schicht1') marke($('z-listing'), l.length); }")
# admTab: Nav-Markierung mitführen
rep("    var reiter = ['betrieb', 'kennzahlen', 'storno', 'feedback', 'einstellungen'];   // Einstellungen am Schluss (Jonas 17.10.2026)", "    var alle = ['betrieb', 'kennzahlen', 'storno', 'feedback', 'einstellungen'], reiter = ADM_GRUPPE === 'reporting' ? ['kennzahlen', 'betrieb'] : ['einstellungen', 'storno', 'feedback'];   // Umbau 31.10.2026: Reporting und Einstellungen getrennt")
rep("    reiter.forEach(function (x) { $('adm-' + x).hidden = x !== ADM; });", "    alle.forEach(function (x) { $('adm-' + x).hidden = x !== ADM; });\n    $('nav-zahlen').className = ADM_GRUPPE === 'reporting' ? 'an' : ''; $('nav-einst').className = ADM_GRUPPE !== 'reporting' ? 'an' : ''; $('top-sub').textContent = t(ADM_GRUPPE === 'reporting' ? 'nav.zahlen' : 'nav.einst');")
rep("  var ADM = 'betrieb', KZ = null, AF = [];", "  var ADM = 'betrieb', KZ = null, AF = [], ADM_GRUPPE = 'einst';")
# Kennzahlen ohne Grade-Tabelle (Jonas 31.10.)
rep("    if (k.grades.length) h += '<div class=\"karte\"><h2>' + esc(t('kz.grades'))", "    if (false && k.grades.length) h += '<div class=\"karte\"><h2>' + esc(t('kz.grades'))")
# Bank-Lesen: im Cockpit das neue Ergebnis zeichnen
rep("      ruf('bankAbgleich', [z], function (r) { BANK = r; $('f-bank-erg').innerHTML = bankHtml(); });", "      ruf('bankAbgleich', [z], function (r) { BANK = r; $('f-bank-erg').innerHTML = (CPP && CPP.art === 'bank') ? cpBankHtml() : bankHtml(); });")

# Auktionsende statt Laufzeit-Feld (Feedback Jonas 31.10.2026)
rep('<div style="width:130px"><input type="number" id="r-tage" min="1" max="30" step="1" aria-label="Laufzeit Tage" title="Laufzeit in Tagen"></div>',
    '<input type="hidden" id="r-tage" value=""><div class="still" id="r-ende"></div>')
rep("    $('r-link').value = ''; $('r-tage').value = S.laufzeit || 6; $('b-id').value = '';", "    $('r-link').value = ''; $('r-tage').value = ''; $('r-ende').textContent = t('c.ende', endeText()); $('b-id').value = '';")
rep("      [t('f.laufzeit'), t('f.laufzeit.w', S.laufzeit), t('f.laufzeit.h'), null],", "      [t('f.laufzeit'), endeText(), t('f.laufzeit.h'), null],")
rep("'s4.link': ['Link des veröffentlichten Angebots und Laufzeit in Tagen', 'Link of the published listing and duration in days'],", "'s4.link': ['Link des veröffentlichten Angebots', 'Link of the published listing'],")
rep("'f.versand.h': ['Versandkosten für den Käufer: CHF {0}. Zeigt Ricardo einen anderen Betrag, mit diesem überschreiben.', 'Shipping cost for the buyer: CHF {0}. If Ricardo shows another amount, overwrite it with this one.'],", "'f.versand.h': ['Versandkosten für den Käufer: CHF {0}.', 'Shipping cost for the buyer: CHF {0}.'],")

# 5. Haken: nach Handlungen aus dem Panel das Cockpit still neu laden
rep("      melde(t('g.p.adr.hand.ok', z.name + ', ' + z.ort), 'ok'); zeichneAblauf();", "      melde(t('g.p.adr.hand.ok', z.name + ', ' + z.ort), 'ok'); zeichneAblauf(); cpNach();")
rep("      melde(t('g.p.sendung.ok', r.sendung), 'ok'); zeichneAblauf();", "      melde(t('g.p.sendung.ok', r.sendung), 'ok'); zeichneAblauf(); cpNach();")
rep("    etikettAusgeben(et);\n    zeichneAblauf();", "    etikettAusgeben(et);\n    zeichneAblauf(); cpNach();")
rep("    ruf('bankBestaetigen', [wahl], function (f) { BANK = null; F = f; zeichneAblauf(); melde(t('f.t1.erfassen') + ': ' + wahl.length, 'ok'); });",
    "    ruf('bankBestaetigen', [wahl], function (f) { BANK = null; if (F && F.art === 'taeglich') { F = f; zeichneAblauf(); } melde(t('f.t1.erfassen') + ': ' + wahl.length, 'ok'); if (CPP && CPP.art === 'bank') cpBank(); cpNach(); });")
# Gelistet: Cockpit nachführen
rep("      melde(t('s4.fertig', r.id), 'ok'); LISTING_OFFEN = '';", "      melde(t('s4.fertig', r.id), 'ok'); LISTING_OFFEN = ''; cpNach();")
# Listing-Liste: Zurück ins Cockpit im Kopf des Ablaufs
rep("""    $('f-leiste').innerHTML = '';
    var vorher = { taeglich: vorherTaeglich,""", """    $('f-leiste').innerHTML = FA === 'schicht1' ? '<button onclick="zeige(\\'cockpit\\')">← ' + t('nav.cockpit') + '</button>' : '';
    var vorher = { taeglich: vorherTaeglich,""")
rep("""      $('f-leiste').innerHTML = '<button onclick="zurListe()">← ' + t('g.liste') + '</button>' + s.map(""", """      $('f-leiste').innerHTML = '<button onclick="zeige(\\'cockpit\\')">← ' + t('nav.cockpit') + '</button><button onclick="zurListe()">← ' + t('g.liste') + '</button>' + s.map(""")

# 6. Cockpit-Code vor dem Start
rep("  /* ---------- Start ---------- */", cockpit + "\n  /* ---------- Start ---------- */")

# 7. Start: Cockpit statt «Täglich»
rep("    lade(false); S = s; texte(); ablaufStarten('taeglich');\n    ladeAnalyse();\n    vorladen(['schicht1', 'schicht2', 'schicht3']);",
    "    lade(false); S = s; texte(); zeige('cockpit');")
# Sprache: Cockpit neu zeichnen
rep("    if (ANSICHT === 'admin') ladeAdmin();\n    $('rt-treffer').innerHTML = ''; if (RT) zeichneRetouren();", "    if (ANSICHT === 'admin') ladeAdmin();\n    if (ANSICHT === 'cockpit' && CP) zeichneCockpit();\n    $('rt-treffer').innerHTML = ''; if (RT) zeichneRetouren();")
# Version sichtbar
rep("$('version').textContent = 'Version ' + S.version;", "$('version').textContent = 'Version ' + S.version + ' · Cockpit';")

out = root / 'ricardo-test' / 'Index.html'
out.write_text(s, encoding='utf-8')
print(n, 'Ersetzungen,', len(s), 'Zeichen')
import json, sys
if '--json' in sys.argv:
    (root / 'ricardo-test' / 'edits.json').write_text(json.dumps(PAARE, ensure_ascii=False), encoding='utf-8')
    print('edits.json', len(PAARE))
