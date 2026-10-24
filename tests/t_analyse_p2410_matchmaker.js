/* Prüfung 24.10.2026, Analyse Tool: Matchmaker.
   H6 (Kopfzeile des Matchmaker-Scripts), M6 (Vermerk beim richtigen von zwei gleichen Aufträgen, Wiedereinstieg), N3 (Nummer und «gesucht» der KI),
   Z5/Z8 (reservierte Aufträge nicht vorschlagen, beim Abschluss prüfen), V5 (Status «Geholt» aus dem Tab «Erledigt»), Z14 (Status vor dem Schreiben prüfen).
   Erfundene Daten. Lauf: node tests/t_analyse_p2410_matchmaker.js */
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const CODE = fs.readFileSync(__dirname + '/../apps/analyse/Code.gs', 'utf8');
const MM_KOPF = ['Gesucht', 'Mehr Infos (was ist zwingend, was egal)', 'Limit CHF', 'Suchprofil (von Claude, anpassbar)', 'Passt', 'Ähnlich 1', 'Ähnlich 2', 'Ähnlich 3', 'Geholt'];

function umgebung(TABS) {
  const geschrieben = [];
  const blatt = n => ({ getDataRange: () => ({ getValues: () => TABS[n].map(r => r.slice()) }), getMaxColumns: () => 26,
    getRange: (r, c) => ({ getValue: () => (TABS[n][r - 1] || [])[c - 1] || '', setValue: v => { geschrieben.push([n, r, c, v]); while (TABS[n][r - 1].length < c) TABS[n][r - 1].push(''); TABS[n][r - 1][c - 1] = v; return { setFontWeight: () => {} }; }, setFontWeight: () => {} }) });
  const c = { console, JSON, Math, Date, RegExp, Utilities: { formatDate: () => '24.10.2026' }, SpreadsheetApp: { openById: () => ({ getSheetByName: n => TABS[n] ? blatt(n) : null }) } };
  vm.createContext(c); vm.runInContext(CODE, c);
  const LOG = [];
  c.einst_ = () => ({}); c.log_ = (a, i, d) => LOG.push(a + ' ' + i + ' ' + d); c.einmalProTag_ = (a, l) => l;
  return { c, geschrieben, LOG };
}
const auftrag = (g, m, p, aus) => { const z = [g, m, 100, p || 'Art: Kapselmaschine', '', '', '', '', false]; if (aus !== undefined) z.push(aus); return z; };

/* ---- H6: Kopf «Mehr Infos (…)» und «Suchprofil (…)» werden gelesen; fehlt «Mehr Infos», ist das ein Fehler ---- */
{
  const T = { Matchmaker: [['Matchmaker'], ['Status'], MM_KOPF, auftrag('Nespresso Vertuo', 'nur Next, nicht Pop'), auftrag('Nespresso Vertuo', 'egal welche', 'Art: Kapselmaschine')] };
  const { c } = umgebung(T);
  const l = c.mmAuftraege_({}).liste;
  assert.ok(l[0].mehr === 'nur Next, nicht Pop' && l[0].profil === 'Art: Kapselmaschine' && l[0].limit === 100, 'H6: Spalten über den Anfang gefunden');
  assert.notStrictEqual(c.mmSchluessel_(l[0]), c.mmSchluessel_(l[1]), 'H6: verschiedene Aufträge, verschiedene Schlüssel');
  T.Matchmaker[2] = ['Gesucht', 'Infos', 'Limit CHF', 'Suchprofil'];
  assert.throws(() => c.mmAuftraege_({}), /Spalte «Mehr Infos» fehlt/, 'H6: fehlende Pflichtspalte laut');
}

/* ---- M6 + N3: zwei gleiche Aufträge; KI wählt den zweiten (mit «gesucht»); der Vermerk landet dort; Wiedereinstieg schliesst nur ihn aus ---- */
{
  const T = { Matchmaker: [['Datum', 'Name', 'Gesucht', 'Mehr Infos', 'Suchprofil', 'Geholt'], ['1.10.', 'Kundin A', 'Nespresso Vertuo', '', '', false], ['5.10.', 'Kundin B', 'Nespresso Vertuo', '', '', false]] };
  const { c, geschrieben } = umgebung(T);
  c.produkt_ = () => ({ 'PG-ID': 'PG-9', 'Bezeichnung': 'Nespresso Vertuo Next' });
  let prompt = '';
  c.claude_ = (b) => { prompt = b.system; return { content: [{ type: 'text', text: '```json\n{"treffer":[{"nr":2,"gesucht":"Nespresso Vertuo","urteil":"passt","hinweis":"gleiches Modell"}]}\n```' }] }; };
  const r = c.matchmaker('PG-9', { marke: 'Nespresso', modell: 'Vertuo Next' }, []);
  assert.ok(/"nr": 1/.test(prompt) && /"gesucht"/.test(prompt) && !/"nr": 0/.test(prompt), 'N3: Beispiel beginnt bei 1 und verlangt «gesucht»');
  assert.strictEqual(r.passt[0].zeile, 3, 'Kundin B');
  c.mmVermerk_({}, r.passt[0], 'PG-9 · Nespresso · 24.10.2026', 'PG-9');
  const v = geschrieben.filter(g => /PG-9/.test(g[3]));
  assert.ok(v.length === 1 && v[0][1] === 3, 'M6: Vermerk bei Kundin B (Zeile 3): ' + JSON.stringify(geschrieben));
  /* Wiedereinstieg: nur der alte Auftrag (mit PG-9 im Vermerk) fällt weg, Kundin A bleibt */
  c.claude_ = () => ({ content: [{ type: 'text', text: '{"treffer":[]}' }] });
  assert.strictEqual(c.matchmaker('PG-9', {}, [r.passt[0].schluessel]).anzahl, 1, 'M6: Kundin A bleibt beim Wiedereinstieg');
  /* Z5/Z8: für ein anderes Stück ist Kundin B reserviert → nicht im Vorschlag */
  c.produkt_ = () => ({ 'PG-ID': 'PG-10', 'Bezeichnung': 'Nespresso Vertuo Next' });
  const r2 = c.matchmaker('PG-10', {}, []);
  assert.ok(r2.anzahl === 1 && r2.reserviert.length === 1 && r2.reserviert[0].fuer === 'PG-9', 'Z5/Z8: reservierter Auftrag nicht vorgeschlagen: ' + JSON.stringify(r2));
  /* zweiter Vermerk für dasselbe Gesucht trifft den freien Auftrag (Kundin A), nie den reservierten */
  c.mmVermerk_({}, { schluessel: r.passt[0].schluessel, zeile: 3, dup: 2, gesucht: 'Nespresso Vertuo' }, 'PG-10 · Nespresso · 24.10.2026', 'PG-10');
  assert.ok(geschrieben.some(g => g[1] === 2 && /PG-10/.test(g[3])) && !geschrieben.some(g => g[1] === 3 && /PG-10/.test(g[3])), 'M6/Z5: PG-10 bei Kundin A');
  /* N3: Nummer passt nicht zu «gesucht» → nach «gesucht» zugeordnet, sonst verworfen */
  T.Matchmaker.push(['9.10.', 'Kunde C', 'Dyson Föhn', 'Supersonic', '', false]);
  c.produkt_ = () => ({ 'PG-ID': 'PG-11', 'Bezeichnung': 'Dyson Supersonic' });
  c.claude_ = () => ({ content: [{ type: 'text', text: '{"treffer":[{"nr":0,"gesucht":"Dyson Föhn","urteil":"passt"},{"nr":1,"gesucht":"Gibt es nicht","urteil":"passt"}]}' }] });
  const r3 = c.matchmaker('PG-11', {}, []);
  assert.ok(r3.passt.length === 1 && r3.passt[0].gesucht === 'Dyson Föhn', 'N3: nach «gesucht» zugeordnet, Unsinn verworfen: ' + JSON.stringify(r3.passt));
}

/* ---- Z5/Z8: beim Abschluss ist der Auftrag inzwischen für ein anderes Stück reserviert → Fehler; nicht geklappt → Fehler ---- */
{
  const T = { Matchmaker: [MM_KOPF.concat(['Aus Analyse']), auftrag('Toaster', 'egal', '', 'PG-5 · Toaster · 23.10.2026'), auftrag('Föhn', '', '', 'PG-6 · Föhn · 20.10.2026\nPG-6 · nicht geklappt · 22.10.2026')] };
  const { c } = umgebung(T);
  const stand = { s: {} };
  assert.throws(() => c.mmPruefen_({ mm: { gesucht: 'Toaster', schluessel: c.mmSchluessel_({ gesucht: 'Toaster', mehr: 'egal' }), zeile: 2 }, stand: stand }, 'PG-7'), /schon für PG-5 reserviert/);
  assert.throws(() => c.mmPruefen_({ mm: { gesucht: 'Föhn', schluessel: c.mmSchluessel_({ gesucht: 'Föhn', mehr: '' }), zeile: 3 }, stand: stand }, 'PG-6'), /schon nicht geklappt/);
  const ok = c.mmPruefen_({ mm: { gesucht: 'Föhn', schluessel: c.mmSchluessel_({ gesucht: 'Föhn', mehr: '' }), zeile: 3 }, stand: stand }, 'PG-8');
  assert.ok(ok.zeile === 3, 'aufgehobener Vermerk (nicht geklappt) gibt den Auftrag frei');
  const ids = c.mmVermerkIds_('PG-1 · A · 1.10.\nPG-2 · B\nPG-1 · nicht verkauft, jetzt auf Ricardo · 3.10.\npg 0003 · C');
  assert.deepStrictEqual(JSON.parse(JSON.stringify(ids)), { 'PG-1': false, 'PG-2': true, 'PG-3': true }, 'V5: letzte Zeile je ID zählt, Ricardo hebt auf');
}

/* ---- V5 + Z14: «Geholt» aus dem Tab «Erledigt»; zurück in der Liste → «Offen»; nur erwartete Status werden geändert ---- */
{
  const T = { Matchmaker: [MM_KOPF.concat(['Aus Analyse']), auftrag('Lampe', '', '', 'PG-3 · Lampe · 21.10.2026')],
    Erledigt: [['Geholt am', 'Gesucht', 'Mehr Infos', 'Limit CHF', 'Suchprofil', 'Gefunden', 'Zurück in die Liste', 'Aus Analyse'],
      ['22.10.2026', 'Toaster', '', 100, '', '', false, 'PG-1 · Toaster · 21.10.2026'],
      ['22.10.2026', 'Föhn', '', 100, '', '', false, 'PG-2 · Föhn · 20.10.2026\nPG-2 · nicht geklappt · 21.10.2026'],
      ['23.10.2026', 'Mixer', '', 100, '', '', false, 'PG-4 · Mixer · 22.10.2026']] };
  const { c, LOG } = umgebung(T);
  const ANA = [{ 'PG-ID': 'PG-1', 'Status': 'Offen' }, { 'PG-ID': 'PG-2', 'Status': 'Offen' }, { 'PG-ID': 'PG-3', 'Status': 'Geholt' }, { 'PG-ID': 'PG-0004', 'Status': 'Ricardo' }];
  let inSperre = false, gelesenInSperre = 0;
  c.ss_ = () => ({ getSheetByName: () => ({}) });
  c.lies_ = n => { if (inSperre) gelesenInSperre++; return { z: ANA.map((r, i) => Object.assign({ _r: i + 2 }, r)) }; };
  c.gesperrt_ = f => { inSperre = true; try { return f(); } finally { inSperre = false; } };
  c.setz_ = (n, f, w) => { Object.keys(w).forEach(r => { ANA[Number(r) - 2][f] = w[r]; }); };
  c.mmGeholt_({});
  assert.strictEqual(ANA[0]['Status'], 'Geholt', 'V5: PG-1 geholt');
  assert.strictEqual(ANA[1]['Status'], 'Offen', 'V5: «nicht geklappt» hebt auf');
  assert.strictEqual(ANA[2]['Status'], 'Offen', 'V5: PG-3 steht wieder im Tab «Matchmaker» → wieder offen');
  assert.strictEqual(ANA[3]['Status'], 'Ricardo', 'Z14: nur «Offen» wird «Geholt» (PG-0004 = PG-4 ist schon bei Ricardo)');
  assert.ok(gelesenInSperre > 0, 'Z14: in der Sperre frisch gelesen');
  assert.ok(LOG.some(l => /PG-1 → Geholt/.test(l)));
  /* ohne Spalte «Aus Analyse» im Tab «Erledigt»: nichts ändern, Hinweis */
  T.Erledigt = T.Erledigt.map(r => r.slice(0, 7)); ANA[0]['Status'] = 'Offen'; LOG.length = 0;
  c.mmGeholt_({});
  assert.strictEqual(ANA[0]['Status'], 'Offen');
  assert.ok(LOG.some(l => /Aus Analyse.*fehlt/.test(l)), 'V5: Hinweis, wenn das Matchmaker-Script noch nicht nachgeführt ist');
}
{ /* Z14: mmNachRicardo_ liest in der Sperre frisch und schreibt nur Zeilen, die dann noch «Ricardo» heissen */
  const { c } = umgebung({ Matchmaker: [MM_KOPF] });
  let inSperre = false; const SET = [];
  c.ss_ = () => ({ getSheetByName: () => ({}) });
  c.lies_ = n => ({ z: n === 'Matchmaker' ? (inSperre ? [{ _r: 2, 'PG-ID': 'PG-1', 'Status': 'Geholt' }, { _r: 3, 'PG-ID': 'PG-2', 'Status': 'Ricardo' }] : [{ _r: 2, 'PG-ID': 'PG-1', 'Status': 'Ricardo' }, { _r: 3, 'PG-ID': 'PG-2', 'Status': 'Ricardo' }]) : [] });
  c.gesperrt_ = f => { inSperre = true; try { return f(); } finally { inSperre = false; } };
  c.setz_ = (n, f, w) => SET.push([n, f, JSON.parse(JSON.stringify(w))]); c.mmVermerk_ = () => {};
  c.mmNachRicardo_({});
  assert.deepStrictEqual(SET.filter(s => s[0] === 'Matchmaker')[0][2], { 3: 'Auf Ricardo' }, 'Z14: Zeile 2 ist inzwischen «Geholt», bleibt');
}
console.log('t_analyse_p2410_matchmaker ok');
