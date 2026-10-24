/* Prüfung 24.10.2026, Analyse Tool: Recherche abholen und schreiben, Sperren, Anhängen.
   H5 (kaputte KI-Antwort: keine Kostenschleife, Batch nicht hängend, alte Recherche bleibt), M7 (eine Sperre pro Produkt), M8 (append INSERT_ROWS,
   Formeln in den Zeilen aus der Antwort), N2 (Zeilennummern in der Sperre geprüft), N4 (Kopfzeile in der Sperre frisch), V1 (flush vor dem Freigeben),
   V2 (Zeilen anfügen, wenn der Tab voll ist). Erfundene Daten. Lauf: node tests/t_analyse_p2410_recherche.js */
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const CODE = fs.readFileSync(__dirname + '/../apps/analyse/Code.gs', 'utf8');
const crypto = require('crypto');
const digest = (a, s) => Array.from(crypto.createHash('md5').update(String(s)).digest()).map(b => b > 127 ? b - 256 : b);

/* ---- H5 + M7: Antwort mit falschem Typ, zwei Produkte in einem Batch, eines kaputt ---- */
{
  const c = { console, JSON, Math, Date, RegExp, Utilities: { formatDate: () => '10.2026', computeDigest: digest, DigestAlgorithm: {}, Charset: {} } };
  vm.createContext(c); vm.runInContext(CODE, c);
  const P = [{ _r: 2, 'PG-ID': 'PG-1', 'Herkunft': 'Retoure', 'Bezeichnung': 'Gerät', 'Recherche-Schlüssel': 'EAN1', 'Recherche-Batch': 'B1', 'Recherche-Status': 'Läuft', 'Analyse-Status': 'Offen', 'VP CHF': 80 },
    { _r: 3, 'PG-ID': 'PG-2', 'Herkunft': 'Retoure', 'Bezeichnung': 'Toaster', 'Recherche-Schlüssel': 'EAN2', 'Recherche-Batch': 'B1', 'Recherche-Status': 'Läuft', 'Analyse-Status': 'Offen', 'VP CHF': 30 },
    { _r: 4, 'PG-ID': 'PG-3', 'Herkunft': 'Retoure', 'Bezeichnung': 'Föhn', 'Recherche-Schlüssel': 'EAN3', 'Recherche-Batch': 'B1', 'Recherche-Status': 'Läuft', 'Analyse-Status': 'Offen', 'VP CHF': 30 }];
  const BATCH = [{ _r: 2, 'Batch-ID': 'B1', 'Status': 'Läuft' }], KOSTEN = [], LOG = [];
  const REC = { EAN3: [{ _r: 50, 'Schlüssel': 'EAN3', 'Feld': 'Funktionen', 'Inhalt': '[]' }] };       // EAN3 hat schon eine Recherche
  const gut = { marke: 'X', modell: 'Y', infos: [], testmittel: 'keine', sichtpruefung: 'Glas ohne Sprung', funktionen: [{ name: 'Ein', pruefung: 'Einschalten', art: 'Kern', pruefbar: 'Ja' }] };
  const kaputt = { marke: 'X', modell: 'Y', funktionen: 'keine' };                                    // falscher Typ: Text statt Liste
  const zeile = (k, a) => JSON.stringify({ custom_id: c.hash_(k), result: { type: 'succeeded', message: { stop_reason: 'end_turn', model: 'claude-sonnet-5-5', usage: { input_tokens: 100000, output_tokens: 5000 },
    content: [{ type: 'text', text: '```json\n' + JSON.stringify(a) + '\n```' }] } } });
  const ERG = [zeile('EAN1', gut), zeile('EAN2', kaputt), zeile('EAN3', kaputt), '{"custom_id": null}', 'kein json'].join('\n');
  c.UrlFetchApp = { fetch: (url) => ({ getResponseCode: () => 200, getContentText: () => /results/.test(url) ? ERG : JSON.stringify({ processing_status: 'ended', results_url: 'https://x/results' }) }) };
  c.PropertiesService = { getScriptProperties: () => ({ getProperty: () => 'KEY' }) };
  c.lies_ = n => ({ z: n === 'Produkte' ? P : n === 'Batches' ? BATCH : n === 'Kosten' ? KOSTEN : [] });
  let sperren = 0, geloescht = [], geschrieben = [];
  c.gesperrt_ = f => { sperren++; return f(); }; c.log_ = (a, i, d) => LOG.push(a + ' ' + i + ' ' + d); c.zeit_ = () => 't';
  c.schreib_ = (n, o) => { if (n === 'Kosten') o.forEach(x => KOSTEN.push(x)); if (n === 'Recherche') geschrieben.push(o); return 0; };
  c.setz_ = (n, f, w) => { const t = n === 'Produkte' ? P : BATCH; Object.keys(w).forEach(r => { t.filter(x => x._r === Number(r))[0][f] = w[r]; }); };
  c.loeschen_ = (n, z) => { geloescht = geloescht.concat(z); };
  c.rechercheVon_ = k => ({ kopf: [], z: REC[k] || [] });
  c.blatt_ = () => ({ getLastRow: () => 1 });
  for (let lauf = 1; lauf <= 3; lauf++) {
    if (lauf > 1) { BATCH[0]['Status'] = 'Läuft'; P.forEach(p => { p['Recherche-Status'] = 'Läuft'; }); }   // als wäre der Batch hängen geblieben
    c.abholen_();
  }
  assert.strictEqual(KOSTEN.length, 3, 'H5: Kosten genau einmal pro Batch (3 Antworten), nicht in jedem Lauf neu: ' + KOSTEN.length);
  assert.strictEqual(BATCH[0]['Status'], 'Abgeholt', 'H5: Batch abgeholt');
  assert.strictEqual(P[0]['Recherche-Status'], 'Bereit', 'H5: gültige Antwort (Text statt Liste bei testmittel/sichtpruefung vereinheitlicht) geschrieben');
  assert.strictEqual(P[1]['Recherche-Status'], 'Fehler', 'H5: kaputte Antwort → nur dieses Produkt «Fehler»');
  assert.strictEqual(P[2]['Recherche-Status'], 'Bereit', 'H5: vorhandene Recherche bleibt, kaputte Antwort ersetzt sie nicht');
  assert.ok(geloescht.indexOf(50) < 0, 'H5: alte Recherche nicht gelöscht');
  assert.ok(LOG.some(l => /Recherche-Fehler .* falschen Format/.test(l)), 'H5: im Log');
  const d = c.rechercheNorm_(gut);
  assert.ok(Array.isArray(d.testmittel) && d.testmittel.length === 0 && d.sichtpruefung[0] === 'Glas ohne Sprung', 'H5: vereinheitlicht');
  assert.strictEqual(c.rechercheNorm_(kaputt), null); assert.strictEqual(c.rechercheNorm_('{}'), null); assert.strictEqual(c.rechercheNorm_(null), null);
  assert.throws(() => c.rechercheSchreiben_(P[1], kaputt), /nicht brauchbar/, 'H5: rechercheSchreiben_ schreibt nichts Kaputtes');
  /* M7: eine Sperre pro Produkt (Recherche-Schlüssel), nicht alles in einer langen Sperre */
  const s0 = sperren; BATCH[0]['Status'] = 'Läuft'; P.forEach(p => { p['Recherche-Status'] = 'Läuft'; }); KOSTEN.length = 0;
  c.abholen_();
  assert.strictEqual(sperren - s0, 1 + 3 + 1, 'M7: Kosten + je Produkt eine Sperre + Batch-Status: ' + (sperren - s0));
}
{ /* H5: rechercheJetzt mit kaputter Antwort: verständliche Meldung, nichts geschrieben */
  const c = { console, JSON, Math, Date, RegExp, Utilities: { formatDate: () => '' } };
  vm.createContext(c); vm.runInContext(CODE, c);
  let geschrieben = 0;
  c.einst_ = () => ({}); c.produkt_ = () => ({ 'PG-ID': 'PG-1', 'Recherche-Schlüssel': 'K', 'Bezeichnung': 'X' }); c.recherchiert_ = () => ({});
  c.icecat_ = () => ({ daten: {}, log: [] }); c.kontext_ = () => ({ zb: [], testmittel: [], vorhanden: [] }); c.params_ = () => ({ tools: [{ max_uses: 5 }] });
  c.claude_ = () => ({ content: [{ type: 'text', text: '{"funktionen": "keine"}' }] }); c.log_ = () => {};
  c.gesperrt_ = f => f(); c.rechercheSchreiben_ = () => { geschrieben++; };
  assert.throws(() => c.rechercheJetzt('PG-1', 'Z7'), /Die Recherche hat nicht geklappt \(Antwort im falschen Format\)/);
  assert.strictEqual(geschrieben, 0);
}

/* ---- M8, V1, V2, N4: Schreiben über die Sheets-API und ohne ---- */
function sheetUmgebung() {
  const T = { Recherche: [['Schlüssel', 'Bezeichnung', 'Feld', 'Inhalt', 'Quelle (Link)', 'Quellentyp', 'Modelltreffer', 'Zweitquelle bestätigt', 'Variantenrisiko', 'Von uns bestätigt (Anzahl)',
    'Von uns korrigiert (Anzahl)', 'Recherchiert am', 'Punkte Quelle', 'Punkte Modell', 'Punkte Zweitquelle', 'Punkte bestätigt', 'Abzug Variante', 'Summe', 'Score']],
    'Quellen-Log': [['Zeit', 'Schlüssel', 'Bezeichnung', 'Quelle', 'Gefunden', 'Gelieferte Felder', 'Meldung']], Log: [['Zeit', 'Person', 'Aktion', 'ID', 'Detail']],
    'Prüfschritte': [['Analyse-Nr', 'PG-ID', 'Nr', 'Schritt']] };
  const Z = { append: [], batchUpdate: [], flush: 0, release: [], insert: [], kopf: 0 }, cache = {}, MAX = {};
  const blatt = n => ({ getName: () => n, getLastRow: () => T[n].length, getLastColumn: () => T[n][0].length, getMaxRows: () => MAX[n] || T[n].length, getMaxColumns: () => T[n][0].length,
    insertRowsAfter: (a, k) => { Z.insert.push([n, a, k]); MAX[n] = (MAX[n] || T[n].length) + k; },
    getRange: (r, c0, nr, nc) => ({ getValues: () => { if (r === 1 && nr === 1) Z.kopf++; const o = []; for (let i = 0; i < nr; i++) { const z = []; for (let j = 0; j < nc; j++) z.push((T[n][r - 1 + i] || [])[c0 - 1 + j] ?? ''); o.push(z); } return o; },
      setValues: v => { if (r - 1 + v.length > (MAX[n] || T[n].length) + 0 && r > (MAX[n] || T[n].length)) throw new Error('Zeile ' + r + ' gibt es nicht'); v.forEach((z, i) => { T[n][r - 1 + i] = z.slice(); }); } }) });
  const name = b => b.replace(/^'|'(!.*)?$/g, '');
  const Sheets = { Spreadsheets: { Values: {
    append: (body, id, b, o) => { Z.append.push([name(b), o.insertDataOption]); const n = name(b), start = T[n].length + 1 + (n === 'Recherche' ? 7 : 0);   // 7 leer aussehende Zeilen dazwischen
      while (T[n].length < start - 1) T[n].push([]); body.values.forEach(z => T[n].push(z.slice()));
      return { updates: { updatedRange: "'" + n + "'!A" + start + ':S' + (start + body.values.length - 1) } }; },
    batchUpdate: body => { Z.batchUpdate.push(body.data.map(d => [d.range, d.values[0][0]])); return {}; },
    batchGet: (id, o) => ({ valueRanges: o.ranges.map(b => ({ values: T[name(b)].map(z => z.slice()) })) }) } } };
  const c = { console, JSON, Math, Date, RegExp, Sheets,
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: n => T[n] ? blatt(n) : null, getId: () => 'ID' }), flush: () => { Z.flush++; } },
    CacheService: { getScriptCache: () => ({ get: k => cache[k] ?? null, put: (k, v) => { cache[k] = v; }, remove: k => { delete cache[k]; }, removeAll: ks => ks.forEach(k => delete cache[k]), getAll: () => ({}) }) },
    Utilities: { formatDate: () => '24.10.2026 12:00:00' }, LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() { Z.release.push(Z.flush); } }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => null, setProperty() {}, deleteProperty() {} }) }, Session: { getActiveUser: () => ({ getEmail: () => 'jb@x' }) } };
  vm.createContext(c); vm.runInContext(CODE, c);
  return { c, T, Z, cache, MAX };
}
{
  const { c, T, Z } = sheetUmgebung();
  c.rechercheVon_ = () => ({ kopf: T.Recherche[0], z: [] }); c.loeschen_ = () => {};
  const d = { marke: 'X', modell: 'Y', infos: [{ feld: 'Lieferumfang', inhalt: 'Kanne', quelle: 'https://h.example/a', quellentyp: 'Hersteller', modelltreffer: 'Exakt' }], funktionen: [{ name: 'Ein', pruefung: 'Ein', art: 'Kern' }] };
  vm.runInContext('gesperrt_', c)(function () { c.rechercheSchreiben_({ 'Recherche-Schlüssel': 'K1', 'Bezeichnung': 'Kocher' }, d); });
  assert.deepStrictEqual(JSON.parse(JSON.stringify(Z.append[0])), ['Recherche', 'INSERT_ROWS'], 'M8: append fügt Zeilen ein');
  const start = T.Recherche.findIndex(z => z[2] === 'Lieferumfang') + 1;
  assert.ok(start > 2, 'Zeile da');
  const f = Z.batchUpdate[0].filter(x => /!S\d+$/.test(x[0]))[0];
  assert.ok(f && new RegExp("!S" + start + '$').test(f[0]) && new RegExp('R' + start + '>0').test(f[1]), 'M8: Score-Formel in der Zeile, die append gefüllt hat (' + start + '): ' + JSON.stringify(f));
  assert.ok(Z.release.length && Z.release[Z.release.length - 1] > 0, 'V1: flush vor dem Freigeben der Sperre');
}
{ /* V2: ohne Sheets-API und volle Tabelle: zuerst Zeilen anfügen */
  const { c, T, Z } = sheetUmgebung();
  vm.runInContext('Sheets = undefined;', c);
  vm.runInContext('gesperrt_', c)(function () { c.schreib_('Prüfschritte', [{ 'Analyse-Nr': 'A-1', 'Schritt': 'x' }, { 'Analyse-Nr': 'A-1', 'Schritt': 'y' }]); });
  assert.deepStrictEqual(JSON.parse(JSON.stringify(Z.insert[0])), ['Prüfschritte', 1, 2], 'V2: zwei Zeilen angefügt');
  assert.strictEqual(T['Prüfschritte'].length, 3);
}
{ /* N4: Kopfzeile aus dem Zwischenspeicher wird in der Sperre frisch geprüft */
  const { c, T, cache } = sheetUmgebung();
  cache['kopf:Prüfschritte'] = JSON.stringify(['Analyse-Nr', 'PG-ID', 'Nr', 'Schritt']);
  T['Prüfschritte'][0] = ['Analyse-Nr', 'Neu', 'PG-ID', 'Nr', 'Schritt'];                             // jemand hat eine Spalte eingefügt (ohne onEdit)
  vm.runInContext('gesperrt_', c)(function () { c.schreib_('Prüfschritte', [{ 'Analyse-Nr': 'A-2', 'PG-ID': 'PG-9', 'Schritt': 's' }]); });
  const z = T['Prüfschritte'][T['Prüfschritte'].length - 1];
  assert.ok(z[2] === 'PG-9' && z[4] === 's' && z[1] === '', 'N4: Werte in den richtigen Spalten: ' + JSON.stringify(z));
  assert.ok(JSON.parse(cache['kopf:Prüfschritte']).indexOf('Neu') === 1, 'N4: Zwischenspeicher ersetzt');
  /* ausserhalb der Sperre (Log) bleibt es beim Zwischenspeicher: schnell */
  const k0 = 0;
  vm.runInContext("log_('Test', '', 'x')", c);
  assert.ok(T.Log.length === 2, 'Log geschrieben');
}

/* ---- N2: starten_ prüft in der Sperre, ob in der Zeile noch dasselbe Stück steht ---- */
{
  const c = { console, JSON, Math, Date, RegExp, Utilities: { formatDate: () => '' } };
  vm.createContext(c); vm.runInContext(CODE, c);
  const P = [{ 'PG-ID': 'PG-1', 'Recherche-Schlüssel': 'K1', 'Recherche-Status': 'Offen', 'Analyse-Status': 'Offen' }, { 'PG-ID': 'PG-2', 'Recherche-Schlüssel': 'K2', 'Recherche-Status': 'Offen', 'Analyse-Status': 'Offen' }];
  let inSperre = false; const gesetzt = [];
  c.recherchiert_ = () => ({ K1: 1, K2: 1 });
  c.lies_ = n => ({ z: n === 'Produkte' ? (inSperre ? [{ _r: 2, 'PG-ID': 'PG-NEU', 'Recherche-Status': 'Offen' }, { _r: 3, 'PG-ID': 'PG-2', 'Recherche-Status': 'Offen' }] : P.map((p, i) => Object.assign({ _r: i + 2 }, p))) : [] });
  c.gesperrt_ = f => { inSperre = true; try { return f(); } finally { inSperre = false; } };
  c.setz_ = (n, f, w) => gesetzt.push(JSON.parse(JSON.stringify(w)));
  c.rechercheFrei_ = () => 0; c.budgetVoll_ = () => {};
  c.starten_({});
  assert.deepStrictEqual(gesetzt[0], { 3: 'Bereit' }, 'N2: Zeile 2 gehört inzwischen einem anderen Stück, nur Zeile 3 gesetzt');
}
console.log('t_analyse_p2410_recherche ok');
