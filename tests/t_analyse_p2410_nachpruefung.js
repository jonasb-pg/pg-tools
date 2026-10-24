/* Nachprüfung 24.10.2026, Analyse Tool (Server). Je Befund ein Regressionstest:
   1 alter Matchmaker-Schlüssel «gesucht|» gilt weiter (Vermerk «nicht geklappt»/«Ricardo», Wiedereinstieg, Abschluss mit altem Treffer),
   3 Echo der KI («gesucht») nicht wortgleich: Treffer bleibt, Unsinn wird verworfen,
   4 «Geholt» nur, wenn der Vermerk des geholten Auftrags nicht älter ist als der Eintrag (Retoure für einen anderen Auftrag),
   5 vorübergehender Schreibfehler beim Abholen: Batch bleibt «Läuft», nächster Lauf schreibt; nach 3 Fehlschlägen «Fehler»,
   6 derselbe Wiedereinstieg zweimal geschickt: Ergebnis statt Fehler «schon nicht geklappt».
   (Befund 2 prüft tests/t_analyse_p2410_nachpruefung_ui.py.) Erfundene Daten. Lauf: node tests/t_analyse_p2410_nachpruefung.js */
const fs = require('fs'), vm = require('vm'), assert = require('assert'), crypto = require('crypto');
const CODE = fs.readFileSync(process.env.ANALYSE_CODE || (__dirname + '/../apps/analyse/Code.gs'), 'utf8');
const j = x => JSON.parse(JSON.stringify(x));
const MM_KOPF = ['Gesucht', 'Mehr Infos (was ist zwingend, was egal)', 'Limit CHF', 'Suchprofil (von Claude, anpassbar)', 'Passt', 'Ähnlich 1', 'Ähnlich 2', 'Ähnlich 3', 'Geholt', 'Aus Analyse'];

function mmUmgebung(T, extra) {
  const geschrieben = [];
  const blatt = n => ({ getDataRange: () => ({ getValues: () => T[n].map(r => r.slice()) }), getMaxColumns: () => 26,
    getRange: (r, c) => ({ getValue: () => (T[n][r - 1] || [])[c - 1] || '', setValue: v => { geschrieben.push([n, r, c, v]); while (T[n][r - 1].length < c) T[n][r - 1].push(''); T[n][r - 1][c - 1] = v; return { setFontWeight: () => {} }; }, setFontWeight: () => {} }) });
  const c = Object.assign({ console, JSON, Math, Date, RegExp, Utilities: { formatDate: () => '30.10.2026' }, SpreadsheetApp: { openById: () => ({ getSheetByName: n => T[n] ? blatt(n) : null }) } }, extra || {});
  vm.createContext(c); vm.runInContext(CODE, c);
  const LOG = [];
  c.einst_ = () => ({}); c.log_ = (a, i, d) => LOG.push(a + ' ' + i + ' ' + d); c.einmalProTag_ = (a, l) => l;
  return { c, geschrieben, LOG };
}

/* ---- Befund 1: Schlüssel aus Version .1 («gesucht|», weil «Mehr Infos (…)» nicht gefunden wurde) ---- */
{
  const T = () => ({ Matchmaker: [['Stand'], MM_KOPF,
    ['Toaster', 'Dualit, 2 Schlitze, Farbe egal', 80, 'Art: Toaster', '', '', '', '', false, 'PG-50 · Dualit Lite 2 · 20.10.2026'],
    ['Kaffeemaschine', 'Siebträger', 300, 'Art: Kaffeemaschine', '', '', '', '', false, '']] });
  const altMm = { gesucht: 'Toaster', mehr: '', limit: 80, hinweis: '', schluessel: 'toaster|', zeile: 3 };     // so steht er heute in «Analysen».Stand.mm
  /* Wiedereinstieg: «nicht geklappt» landet beim alten Auftrag, dann ist er für andere Stücke wieder frei */
  let U = mmUmgebung(T());
  U.c.mmVermerk_({}, altMm, 'PG-50 · nicht geklappt · 24.10.2026', 'PG-50', true);
  assert.ok(U.geschrieben.some(g => g[1] === 3 && /PG-50 · nicht geklappt/.test(g[3])), 'Befund 1: «nicht geklappt» beim alten Auftrag: ' + JSON.stringify(U.geschrieben) + U.LOG.join(';'));
  U.c.produkt_ = () => ({ 'PG-ID': 'PG-77', 'Bezeichnung': 'Dualit Classic' });
  U.c.claude_ = () => ({ content: [{ type: 'text', text: '{"treffer":[]}' }] });
  const r = U.c.matchmaker('PG-77', {}, []);
  assert.ok(r.anzahl === 2 && r.reserviert.length === 0, 'Befund 1: Auftrag danach frei: ' + JSON.stringify(r));
  /* «jetzt auf Ricardo» ebenso */
  U = mmUmgebung(T());
  U.c.mmVermerk_({}, altMm, 'PG-50 · nicht verkauft, jetzt auf Ricardo · 24.10.2026', 'PG-50', true);
  assert.ok(U.geschrieben.some(g => g[1] === 3 && /Ricardo/.test(g[3])), 'Befund 1: Ricardo-Vermerk geschrieben');
  /* Wiedereinstieg schliesst den alten Auftrag aus (aus = [alter Schlüssel]) */
  U = mmUmgebung(T());
  U.c.produkt_ = () => ({ 'PG-ID': 'PG-50', 'Bezeichnung': 'Dualit Lite 2' });
  U.c.claude_ = () => ({ content: [{ type: 'text', text: '{"treffer":[]}' }] });
  assert.strictEqual(U.c.matchmaker('PG-50', {}, ['toaster|']).anzahl, 1, 'Befund 1: alter Auftrag beim Wiedereinstieg ausgeschlossen');
  /* Laufende Analyse mit Treffer vom alten Server: Abschluss geht, gespeichert wird der Schlüssel von heute */
  const T2 = T(); T2.Matchmaker[2][9] = '';
  U = mmUmgebung(T2);
  const mm = U.c.mmPruefen_({ mm: altMm, stand: { s: {} } }, 'PG-60');
  assert.ok(mm.zeile === 3 && mm.schluessel === U.c.mmSchluessel_({ gesucht: 'Toaster', mehr: 'Dualit, 2 Schlitze, Farbe egal' }) && mm.mehr === 'Dualit, 2 Schlitze, Farbe egal', 'Befund 1: mmPruefen_ mit altem Treffer: ' + JSON.stringify(mm));
  /* neuer Schlüssel trifft weiterhin genau seinen Auftrag */
  assert.ok(U.c.mmSchluesselGleich_({ gesucht: 'Toaster', mehr: 'x' }, 'toaster|x') && !U.c.mmSchluesselGleich_({ gesucht: 'Toaster', mehr: 'x' }, 'toaster|y'));
}

/* ---- Befund 3: Echo «gesucht» ---- */
{
  const lauf = (gesucht, echo, nr, weitere) => {
    const T = { Matchmaker: [['Stand'], MM_KOPF, [gesucht, 'Dualit, 2 Schlitze', 80, 'Art: Toaster', '', '', '', '', false, '']].concat(weitere || []) };
    const U = mmUmgebung(T);
    U.c.produkt_ = () => ({ 'PG-ID': 'PG-1', 'Bezeichnung': 'Dualit Lite 2 Toaster' });
    U.c.claude_ = b => ({ content: [{ type: 'text', text: JSON.stringify({ treffer: [{ nr: nr || 1, gesucht: typeof echo === 'function' ? echo(b.messages[0].content) : echo, urteil: 'passt', hinweis: '' }] }) }] });
    return j(U.c.matchmaker('PG-1', {}, []).passt.map(x => x.gesucht));
  };
  const lang = 'Toaster ' + 'mit breiten Schlitzen und Brötchenaufsatz, gerne Edelstahl oder Chrom, '.repeat(3) + 'Ende';
  assert.deepStrictEqual(lauf(lang, p => /\[1\] Gesucht: (.*?)( \| Mehr Infos|$)/m.exec(p)[1]), [lang], 'Befund 3: Gesucht über 200 Zeichen (gekürzt im Prompt)');
  assert.deepStrictEqual(lauf('Toaster', p => /\[1\] Gesucht: (.*)$/m.exec(p)[1].slice(0, 60)), ['Toaster'], 'Befund 3: Echo mit «| Mehr Infos …»');
  assert.deepStrictEqual(lauf('Toastr Dualit', 'Toaster Dualit'), ['Toastr Dualit'], 'Befund 3: Tippfehler korrigiert');
  assert.deepStrictEqual(lauf('Toaster', 'Toaster'), ['Toaster'], 'Befund 3: exakt');
  assert.deepStrictEqual(lauf('Toaster', 'Gibt es nicht'), [], 'Befund 3: Unsinn verworfen');
  /* falsche Nummer, Echo passt wortgleich zu einem anderen Auftrag: dieser */
  assert.deepStrictEqual(lauf('Toaster', 'Wasserkocher', 1, [['Wasserkocher', '', 40, '', '', '', '', '', false, '']]), ['Wasserkocher'], 'Befund 3: wortgleich bei anderem Auftrag');
  /* Nummer ab 0 (N3): nach dem Echo */
  assert.deepStrictEqual(lauf('Toaster', 'Toaster', 0), ['Toaster'], 'N3 bleibt');
}

/* ---- Befund 4: «Geholt» nach Datum ---- */
{
  const T = { Matchmaker: [MM_KOPF, ['Toaster klein', 'egal', 50, '', '', '', '', '', false, 'PG-50 · Dualit Lite 2 · 30.10.2026']],
    Erledigt: [['Geholt am', 'Gesucht', 'Mehr Infos', 'Limit CHF', 'Suchprofil', 'Gefunden', 'Zurück in die Liste', 'Aus Analyse'],
      ['22.10.2026', 'Toaster', 'Dualit', 80, '', '', false, 'PG-50 · Dualit Lite 2 · 21.10.2026'],
      ['23.10.2026', 'Föhn', '', 80, '', '', false, 'PG-60 · Dyson · 22.10.2026 · Fotos: https://drive.google.com/x'],
      ['23.10.2026', 'Lampe', '', 80, '', '', false, 'PG-70 · Lampe']] };
  const U = mmUmgebung(T);
  const ANA = [{ 'PG-ID': 'PG-50', 'Status': 'Geholt', 'Analysiert am': '21.10.2026 10:00:00' }, { 'PG-ID': 'PG-50', 'Status': 'Offen', 'Analysiert am': '30.10.2026 09:00:00' },
    { 'PG-ID': 'PG-60', 'Status': 'Offen', 'Analysiert am': '22.10.2026 15:00:00' }, { 'PG-ID': 'PG-70', 'Status': 'Offen', 'Analysiert am': '20.10.2026 15:00:00' }];
  U.c.ss_ = () => ({ getSheetByName: () => ({}) }); U.c.gesperrt_ = f => f();
  U.c.lies_ = () => ({ z: ANA.map((r, i) => Object.assign({ _r: i + 2 }, r)) });
  U.c.setz_ = (n, f, w) => { Object.keys(w).forEach(r => { ANA[Number(r) - 2][f] = w[r]; }); };
  U.c.mmGeholt_({});
  assert.strictEqual(ANA[1]['Status'], 'Offen', 'Befund 4: Retoure für Auftrag B bleibt «Offen» (Vermerk von A ist älter)');
  assert.strictEqual(ANA[0]['Status'], 'Geholt', 'alter Eintrag bleibt «Geholt»');
  assert.strictEqual(ANA[2]['Status'], 'Geholt', 'gleicher Tag wie der Vermerk: geholt (Datum vor «· Fotos:»)');
  assert.strictEqual(ANA[3]['Status'], 'Geholt', 'Vermerk ohne Datum: wie bisher geholt');
}

/* ---- Befund 5: vorübergehender Schreibfehler beim Abholen ---- */
{
  const digest = (a, s) => Array.from(crypto.createHash('md5').update(String(s)).digest()).map(b => b > 127 ? b - 256 : b);
  const PROPS = {};
  const c = { console, JSON, Math, Date, RegExp, Utilities: { formatDate: () => '10.2026', computeDigest: digest, DigestAlgorithm: {}, Charset: {} },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => (k === 'ANTHROPIC_API_KEY' ? 'KEY' : (PROPS[k] || null)), setProperty: (k, v) => { PROPS[k] = v; }, deleteProperty: k => { delete PROPS[k]; } }) } };
  vm.createContext(c); vm.runInContext(CODE, c);
  const P = [{ _r: 2, 'PG-ID': 'PG-1', 'Herkunft': 'Retoure', 'Bezeichnung': 'Gerät', 'Recherche-Schlüssel': 'EAN1', 'Recherche-Batch': 'B1', 'Recherche-Status': 'Läuft', 'Analyse-Status': 'Offen', 'VP CHF': 80 }];
  const BATCH = [{ _r: 2, 'Batch-ID': 'B1', 'Status': 'Läuft' }], KOSTEN = [], REC = {};
  const gut = { marke: 'X', modell: 'Y', infos: [], testmittel: [], sichtpruefung: [], funktionen: [{ name: 'Ein', pruefung: 'Einschalten', art: 'Kern', pruefbar: 'Ja' }] };
  const ERG = JSON.stringify({ custom_id: c.hash_('EAN1'), result: { type: 'succeeded', message: { stop_reason: 'end_turn', model: 'claude-sonnet-5-5', usage: { input_tokens: 1000, output_tokens: 500 }, content: [{ type: 'text', text: '```json\n' + JSON.stringify(gut) + '\n```' }] } } });
  c.UrlFetchApp = { fetch: (url) => ({ getResponseCode: () => 200, getContentText: () => /results/.test(url) ? ERG : JSON.stringify({ processing_status: 'ended', results_url: 'https://x/results' }) }) };
  c.lies_ = n => ({ z: n === 'Produkte' ? P : n === 'Batches' ? BATCH : n === 'Kosten' ? KOSTEN : [] });
  c.gesperrt_ = f => f(); c.log_ = () => {}; c.zeit_ = () => 't';
  c.schreib_ = (n, o) => { if (n === 'Kosten') o.forEach(x => KOSTEN.push(Object.assign(x, { 'Batch-ID': 'B1' }))); return 0; };
  c.setz_ = (n, f, w) => { const t = n === 'Produkte' ? P : BATCH; Object.keys(w).forEach(r => { t.filter(x => x._r === Number(r))[0][f] = w[r]; }); };
  c.loeschen_ = () => {}; c.rechercheVon_ = k => ({ kopf: [], z: REC[k] || [] }); c.blatt_ = () => ({ getLastRow: () => 1 });
  let scheitert = 1;
  c.rechercheSchreiben_ = () => { if (scheitert-- > 0) throw new Error('API call to sheets.spreadsheets.values.append failed with error: Internal error encountered.'); REC.EAN1 = [{ 'Feld': 'Funktionen' }]; };
  c.abholen_();
  assert.ok(P[0]['Recherche-Status'] === 'Läuft' && BATCH[0]['Status'] === 'Läuft', 'Befund 5: nach vorübergehendem Fehler bleibt alles «Läuft»: ' + P[0]['Recherche-Status'] + '/' + BATCH[0]['Status']);
  c.abholen_();
  assert.ok(P[0]['Recherche-Status'] === 'Bereit' && BATCH[0]['Status'] === 'Abgeholt' && KOSTEN.length === 1, 'Befund 5: nächster Lauf schreibt, Kosten einmal');
  /* dauerhaft kaputt: nach 3 Versuchen «Fehler», Batch abgeholt */
  P[0]['Recherche-Status'] = 'Läuft'; BATCH[0]['Status'] = 'Läuft'; delete REC.EAN1; scheitert = 99; P[0]['Recherche-Batch'] = 'B1';
  for (let i = 0; i < 3; i++) c.abholen_();
  assert.ok(P[0]['Recherche-Status'] === 'Fehler' && BATCH[0]['Status'] === 'Abgeholt' && KOSTEN.length === 1, 'Befund 5: nach 3 Fehlschlägen «Fehler»: ' + P[0]['Recherche-Status'] + '/' + BATCH[0]['Status']);
}

/* ---- Befund 6: Wiedereinstieg mit neuem Matchmaker-Auftrag zweimal geschickt ---- */
{
  const c = { console, JSON, Math, Date, RegExp, Utilities: { formatDate: () => '24.10.2026' } };
  vm.createContext(c); vm.runInContext(CODE, c);
  const KOPF = { Analysen: vm.runInContext('ANALYSEN_KOPF', c).slice(), Produkte: ['PG-ID', 'Bezeichnung', 'Analyse-Status', 'Recherche-Schlüssel', 'Herkunft'], Matchmaker: vm.runInContext('MATCHMAKER_KOPF', c).slice() };
  const DB = { Produkte: [{ 'PG-ID': 'PG-50', 'Bezeichnung': 'Dualit Lite 2', 'Analyse-Status': 'Erledigt', 'Recherche-Schlüssel': 'K', 'Herkunft': 'Retoure' }], Analysen: [], Matchmaker: [], Ricardo: [] };
  c.zeit_ = () => '24.10.2026 10:00:00';
  c.lies_ = n => ({ kopf: KOPF[n] || [], z: (DB[n] || []).map((r, i) => Object.assign({ _r: i + 2 }, r)) });
  c.schreib_ = (n, o) => { o.forEach(x => DB[n].push(j(x))); return 2; };
  c.setz_ = (n, f, w) => { Object.keys(w).forEach(r => { DB[n][Number(r) - 2][f] = w[r]; }); };
  c.produkt_ = id => c.lies_('Produkte').z.filter(r => c.idKey_(r['PG-ID']) === c.idKey_(id))[0];
  const U = { produkt: { id: 'PG-50', budget: 15, stufe: 'S', vp: 80 }, ablauf: ['ident', 'funktion', 'zustand', 'entscheid'], rueckruf: null, firmware: false, strom: [], sicher: [],
    funktion: { liste: [{ n: 'Heizen', t: 'Heizen', g: 'Kern' }], ungeprueft: [], ungeprueftKurz: [], mittel: [] }, reset: [], liefer: { teile: [], unsicher: false },
    zustand: { grade: [['A', 'Neu', ''], ['B', 'Neu', ''], ['C', 'Gebraucht', '']] }, ident: { marke: 'Dualit', modell: 'Lite 2' }, ricardo: { versand: [] } };
  c.einst_ = () => ({ 'Garantie Tage': 90 }); c.ueberblickSpeicher_ = () => j(U);
  c.ss_ = () => ({ getSheetByName: () => ({}) }); c.gesperrt_ = f => f(); c.log_ = () => {}; c.takt_ = () => {}; c.blatt_ = () => ({}); c.einmalProTag_ = (a, l) => l; c.rueckmeldung_ = () => {};
  c.verkaufPruefen_ = () => ({ 'PG-ID': 'PG-50', 'Titel': 'Dualit', 'Foto-Ordner': '' });
  const MM = [{ zeile: 3, gesucht: 'Toaster', mehr: 'Dualit', aus: 'PG-50 · Dualit Lite 2 · 20.10.2026' }, { zeile: 4, gesucht: 'Toaster klein', mehr: '', aus: '' }];
  c.mmAuftraege_ = () => ({ liste: MM.map(a => Object.assign({}, a, { ids: c.mmVermerkIds_(a.aus), dup: 1 })) });
  c.mmVermerk_ = (e, mm, text) => { const a = MM.filter(x => c.mmSchluessel_(x) === mm.schluessel)[0]; if (a) a.aus = (a.aus ? a.aus + '\n' : '') + text; };
  DB.Analysen.push({ 'Analyse-Nr': 'A-000010', 'PG-ID': 'PG-50', 'Reusable': 'Ja', 'Grade': 'B', 'Regal': 'Matchmaker', 'Matchmaker-Auftrag': 'Toaster (Dualit)', 'Lauf-ID': 'AB-erst',
    'Stand': JSON.stringify({ s: {}, mm: { gesucht: 'Toaster', mehr: 'Dualit', schluessel: c.mmSchluessel_(MM[0]), zeile: 3 }, lauf: 'AB-erst' }) });
  const d = { id: 'PG-50', kuerzel: 'AB', start: Date.now(), aktivSek: 100, fn: ['ok'], grade: 'B', kanal: 'matchmaker', nachMm: true, mm: { gesucht: 'Toaster klein', mehr: '', schluessel: c.mmSchluessel_(MM[1]), zeile: 4, dup: 1 },
    stand: { s: { x: 1 }, i: 3, start: 1, aktiv: 1 }, ricardo: {}, lauf: 'AB-wieder-1', v: '2026-10-24.2', bezug: { ablauf: U.ablauf, sicher: [], liefer: [], fn: ['Heizen'], reset: [] } };
  const r1 = c.abschliessen(j(d));
  assert.strictEqual(r1.regal, 'Matchmaker');
  const r2 = c.abschliessen(j(d));
  assert.ok(r2.schon && r2.nr === 'A-000010', 'Befund 6: zweiter gleicher Wiedereinstieg liefert das Ergebnis: ' + JSON.stringify(r2));
  assert.strictEqual(MM[1].aus.split('\n').length, 1, 'Befund 6: kein zweiter Vermerk');
  /* ein ANDERER Wiedereinstieg auf denselben Auftrag bleibt verboten */
  assert.throws(() => c.abschliessen(j(Object.assign({}, d, { lauf: 'AB-wieder-2' }))), /schon nicht geklappt/, 'Befund 6: anderer Lauf weiterhin abgelehnt');
}
console.log('ok: Nachprüfung Analyse (Befunde 1, 3, 4, 5, 6)');
