/* Umpack Tool, Prüfung 24.10.2026 (Version 2026-10-24.2): Regressionstests Server für die Befunde 1–20, Z4 und die Verträge V1, V2, V3, V4, V6.
   Erfundene Daten, Sheets im Speicher. Lauf: node tests/t_umpacken_p2410.js */
const vm = require('vm'), fs = require('fs'), assert = require('assert');

function lade(opt) {
  opt = opt || {};
  function blatt(name, v, maxR) {
    const s = { v: v, name: name, maxR: maxR || 1000, formate: [], getName: () => s.name,
      getLastRow: () => s.v.length, getLastColumn: () => Math.max(0, ...s.v.map(z => z.length)), getMaxRows: () => Math.max(s.maxR, s.v.length), getMaxColumns: () => s.maxC || 26,
      getDataRange: () => ({ getValues: () => s.v.map(z => z.slice()), setFontFamily() { return this; }, setFontSize() { return this; } }),
      appendRow: (z) => { s.v.push(z.slice()); },
      insertRowsAfter: (nach, n) => { s.maxR = s.getMaxRows() + n; },
      insertColumnsAfter: (nach, n) => { s.maxC = (s.maxC || 26) + n; },
      getRange: (r, c, nr, nc) => {
        nr = nr || 1; nc = nc || 1;
        if (r + nr - 1 > s.getMaxRows() && opt.streng) throw new Error('The coordinates of the range are outside the dimensions of the sheet.');
        if (c + nc - 1 > s.getMaxColumns()) throw new Error('Spalte ausserhalb');
        return rng(s, r, c, nr, nc);
      },
      setName: (n) => { s.name = n; return s; }, setFrozenRows() {}, autoResizeColumns() {} };
    return s;
  }
  function rng(s, r, c, nr, nc) {
    const o = {
      getValues: () => { const a = []; for (let i = 0; i < nr; i++) { const z = []; for (let j = 0; j < nc; j++) z.push(((s.v[r - 1 + i] || [])[c - 1 + j]) ?? ''); a.push(z); } return a; },
      getValue: () => ((s.v[r - 1] || [])[c - 1]) ?? '',
      setValues: (w) => {
        if (S.schreibFehler && S.schreibFehler(s.name)) throw new Error('Schreibfehler ' + s.name);
        w.forEach((z, i) => { s.v[r - 1 + i] = s.v[r - 1 + i] || []; z.forEach((x, j) => { s.v[r - 1 + i][c - 1 + j] = x; }); }); return o;
      },
      setValue: (x) => { s.v[r - 1] = s.v[r - 1] || []; s.v[r - 1][c - 1] = x; return o; },
      setNumberFormat: (f) => { s.formate.push([r, c, nr, nc, f]); return o; }, setFontWeight: () => o, setBackground: () => o, setFontFamily: () => o, setFontSize: () => o
    };
    return o;
  }
  let nr = 0;
  function datei(tabs, titel, maxR) {
    const sheets = Object.keys(tabs).map(n => blatt(n, tabs[n], maxR)), id = 'S' + (++nr);
    const ss = { sheets, titel, getSheetByName: (n) => sheets.find(s => s.name === n) || null, getSheets: () => sheets, getId: () => id, getUrl: () => 'https://docs.google.com/spreadsheets/d/' + id,
      insertSheet: (n) => { const s = blatt(n, [], maxR); sheets.push(s); return s; }, getName: () => ss.titel, rename: (t) => { ss.titel = t; } };
    return ss;
  }
  const K6 = ['☑', 'ID', 'Sendung', 'Erfasst', 'Bezeichnung', '#', 'Barcode', 'Link', 'Kategorie', 'OVP', 'VP', 'Wert', 'CH', 'Lagerort'];
  const leer5 = [['TITEL'], [], [], [], []];
  const st = (id, name, bc, vp, ort) => [false, id, '', '', name, 1, bc, '', 'Kids', 0, vp, vp, '', ort];
  const DB = datei(opt.db || {}, 'DB', opt.maxRows);
  const RT = datei(opt.rt ? opt.rt(K6, leer5, st) : {
    'Stationär': leer5.concat([K6,
      st('PG-1', 'Lego Zug', '111', 20, 'KID-7'),
      st('PG-2', 'Puppe', '222', 12.5, 'KID-7'),
      st('PG-3', 'Puppe', '222', 12.5, 'KID-7'),
      st('PG-4', 'Puppe', '222', 12.5, 'KID-7'),
      st('PG-5', 'Toaster', '444', 18, 'KID-12'),
      st('PG-6', 'Puppe', '222', 12.5, 'KID-12'),
      st('PG-7', 'Ball', '777', '', 'KID-12'),            // VP leer
      st('PG-8', 'Auto', '888', 'ca. 20', 'KID-12'),      // VP «ca. 20»
      st('PG-9', 'Kreisel', '999', 5, 'HOM-3')]),
    'Archiv Stationär': leer5.concat([K6, st('PG-50', 'Alt', '', 3, 'KID-15'), st('PG-9', 'Kreisel alt', '999', 5, 'KID-15')]),
    'Online': leer5.concat([K6, st('PG-60', 'Doppelt', '', 3, 'ONL-1')]),
    'Caritas': leer5.concat([K6, st('PG-60', 'Doppelt', '', 3, 'CAR-1')])
  });
  const S = { lockHook: null, inLock: false, lockFrei: true, flushWirft: false, schreibFehler: null, admin: opt.admin === undefined ? 'jonas@pg' : opt.admin, ich: 'test@pg', freigaben: 0 };
  const erstellt = [];
  const c = { console, JSON, Date, Math, Object, String, Number, Array, RegExp, Error, isFinite,
    SpreadsheetApp: { openById: (id) => (id === '1VexhXpyWyGTVaKiH7BPLPNQyENKYA-flgeRs-FPN-IA' ? DB : RT),
      flush() { if (S.flushWirft) throw new Error('flush kaputt'); },
      create: (t) => { const s = datei({ 'Tabelle1': [] }, t); erstellt.push(s); return s; },
      openByUrl: (u) => { const s = erstellt.find(x => x.getUrl() === u); if (!s) throw new Error('nicht gefunden'); return s; } },
    DriveApp: { getFileById: () => ({ moveTo() {}, setSharing() {} }), getFolderById: () => ({}), Access: {}, Permission: {} },
    LockService: { getScriptLock: () => ({ tryLock: () => {
      if (!S.lockFrei) return false;
      if (S.lockHook && !S.inLock) { const h = S.lockHook; S.lockHook = null; S.inLock = true; try { h(); } finally { S.inLock = false; } }
      return true; }, releaseLock() { S.freigaben++; } }) },
    Session: { getActiveUser: () => ({ getEmail: () => S.ich }), getEffectiveUser: () => ({ getEmail: () => S.admin }) },
    Utilities: { formatDate: (d, tz, f) => f === 'dd/MM/yyyy' ? '24/10/2026' : c.UHR }, UHR: '24.10.2026 08:00:00' };
  vm.createContext(c);
  vm.runInContext(fs.readFileSync(__dirname + '/../apps/umpacken/Code.gs', 'utf8'), c);
  vm.runInContext('basisEinrichten_ = function () { return []; };', c);
  if (opt.vorEinrichten) opt.vorEinrichten(c, DB);
  c.einrichten();
  return { c, DB, RT, S, st, K6, leer5, erstellt, j: (x) => JSON.parse(JSON.stringify(x)) };
}
const lager = (name, ort) => ({ name: name, art: 'Lager', lagerort: ort, preisregel: 'VP' });
const tab = (DB, n) => DB.getSheetByName(n).v;
const spalte = (DB, n, k) => tab(DB, n)[0].indexOf(k);
let fehler = 0;
function test(name, f) { try { f(); console.log('ok', name); } catch (e) { fehler++; console.log('FEHLER', name, '\n   ', e.message); } }

/* ---------- V3: IDs und Barcodes ---------- */
test('V3 pgNorm_ / bcKey_ / ortKey_', () => {
  const { c } = lade();
  [['pg 0862', 'PG-862'], ["PG'862", 'PG-862'], ['PG862', 'PG-862'], ['PG-0862', 'PG-862'], [' pg-862 ', 'PG-862'], ['an 007', 'AN-7'], ['RC0012', 'RC-12'], ['et-5', 'ET-5'], ['rt 3', 'RT-3'],
    ['PG-0', 'PG-0'], ['kid-7', 'KID-7'], ['PG-12a', 'PG-12A'], ['', '']].forEach(x => assert.strictEqual(c.pgNorm_(x[0]), x[1], 'pgNorm_ ' + x[0]));
  assert.strictEqual(c.norm_('pg 0862'), 'PG-862', 'norm_ = pgNorm_');
  [['(01)04005176984105', '4005176984105'], ['0104005176984105', '4005176984105'], ["'0400-5176 984105", '4005176984105'], ['00012345', '12345'], ['ab-12 c', 'AB12C'],
    ['01234567890123', '1234567890123'], ['4005176984105', '4005176984105']].forEach(x => assert.strictEqual(c.bcKey_(x[0]), x[1], 'bcKey_ ' + x[0]));
  ['KID15', 'KID 15', 'KID–15', 'KID_15', 'kid-15', 'KID.15'].forEach(x => assert.strictEqual(c.ortKey_(x), 'KID15', 'ortKey_ ' + x));
  assert.strictEqual(c.ortName_(' kid - 15 '), 'KID-15'); assert.strictEqual(c.ortAehnlich_('KIDS-08'), 'KID-8'); assert.strictEqual(c.ortAehnlich_('KID 8'), 'KID-8');
  assert.ok(c.idGueltig_('PG 13') && c.idGueltig_('XY-12') && !c.idGueltig_('PG-12a') && !c.idGueltig_(''));
});

/* ---------- V1: Sperre auch frei, wenn flush scheitert ---------- */
test('V1 gesperrt_: releaseLock auch wenn flush wirft', () => {
  const { c, S } = lade();
  S.flushWirft = true; const vor = S.freigaben;
  assert.strictEqual(c.gesperrt_(() => 7), 7);
  assert.strictEqual(S.freigaben, vor + 1);
});

/* ---------- Befund 1: Status in der Sperre ---------- */
test('B1 zuordnen und gebindeAendern nach Abschluss während des Wartens auf die Sperre: abgelehnt, nichts gebucht', () => {
  const { c, DB, S, j } = lade();
  const d = j(c.anlegen({ name: 'A', quelle: 'rt', lagerorte: ['KID-7', 'KID-12'], gebinde: [lager('Neu', 'KID-20')], kuerzel: 'JB' }));
  const G = d.gebinde[0].id;
  c.zuordnen(d.id, [{ id: 'PG-1', gebinde: G, vorher: '' }], 'JB');
  c.UHR = '24.10.2026 08:10:00';
  S.lockHook = () => c.abschliessen(d.id, 'CH', true);
  assert.throws(() => c.zuordnen(d.id, [{ id: 'PG-5', gebinde: G, vorher: '' }], 'BB'), /nicht im Scan \(Status: Abgeschlossen\)/);
  assert.strictEqual(tab(DB, 'Zuordnung').filter(z => z[0] === d.id && z[1] === 'PG-5').length, 0, 'PG-5 nicht gebucht');
  /* gebindeAendern genauso */
  const { c: c2, S: S2, j: j2 } = lade();
  const e = j2(c2.anlegen({ name: 'B', quelle: 'rt', lagerorte: ['KID-7'], gebinde: [lager('Neu', 'KID-20')], kuerzel: 'JB' }));
  c2.zuordnen(e.id, [{ id: 'PG-1', gebinde: e.gebinde[0].id, vorher: '' }], 'JB');
  c2.UHR = '24.10.2026 08:10:00';
  S2.lockHook = () => c2.abschliessen(e.id, 'CH', true);
  assert.throws(() => c2.gebindeAendern(e.id, e.gebinde.concat([lager('Zwei', 'KID-21')])), /nicht im Scan \(Status: Abgeschlossen\)/);
});

/* ---------- Befund 3 und 15: Scan-Kennung dauerhaft, Wunsch-Regel nur ohne Kennung ---------- */
test('B3 echter zweiter EAN-Scan mit Scan-Kennung bucht ein weiteres Stück (auch gleiches Kürzel auf zwei Geräten)', () => {
  const { c, j } = lade();
  const d = j(c.anlegen({ name: 'B', quelle: 'rt', lagerorte: ['KID-7'], gebinde: [lager('Neu', 'KID-20')], kuerzel: 'JB' }));
  const G = d.gebinde[0].id;
  c.zuordnen(d.id, [{ code: '222', wunsch: 'PG-2', gebinde: G, vorher: '', sid: 'b-1' }], 'BB');
  const r = j(c.zuordnen(d.id, [{ code: '222', wunsch: 'PG-2', gebinde: G, vorher: '', sid: 'a-1' }, { code: '222', wunsch: 'PG-3', gebinde: G, vorher: '', sid: 'a-2' }], 'AA'));
  assert.deepStrictEqual(Object.keys(r.zuordnung).filter(k => /PG-[234]/.test(k)).sort(), ['PG-2', 'PG-3', 'PG-4'], JSON.stringify(r));
  assert.strictEqual(r.konflikte.length, 0);
  const { c: c2, j: j2 } = lade();
  const e = j2(c2.anlegen({ name: 'B2', quelle: 'rt', lagerorte: ['KID-7'], gebinde: [lager('Neu', 'KID-20')], kuerzel: 'JB' }));
  c2.zuordnen(e.id, [{ code: '222', wunsch: 'PG-2', gebinde: e.gebinde[0].id, vorher: '', sid: 'x-1' }], 'LAGE');
  const r2 = j2(c2.zuordnen(e.id, [{ code: '222', wunsch: 'PG-2', gebinde: e.gebinde[0].id, vorher: '', sid: 'y-1' }], 'LAGE'));
  assert.strictEqual(Object.keys(r2.zuordnung).filter(k => /PG-[234]/.test(k)).length, 2, 'zwei Geräte, gleiches Kürzel: zwei Stücke');
  /* alte Seite ohne Kennung: Wunsch-Regel bleibt */
  const r3 = j2(c2.zuordnen(e.id, [{ code: '222', wunsch: 'PG-3', gebinde: e.gebinde[0].id, vorher: '' }], 'LAGE'));
  assert.ok(r3.konflikte[0] && r3.konflikte[0].gleich, 'ohne Kennung: schon gespeichert');
});
test('B15 Wiederholung mit gleicher Scan-Kennung bucht nichts (Spalte «Scan-ID», ohne Cache)', () => {
  const { c, DB, j } = lade();
  const d = j(c.anlegen({ name: 'M', quelle: 'rt', lagerorte: ['KID-7'], gebinde: [lager('Neu', 'KID-20')], kuerzel: 'JB' }));
  const G = d.gebinde[0].id;
  c.zuordnen(d.id, [{ id: 'PG-2', gebinde: G, vorher: '' }], 'BB');
  const op = { code: '222', wunsch: 'PG-2', gebinde: G, vorher: '', sid: 'm-1' };
  c.zuordnen(d.id, [op], 'AA');
  const r = j(c.zuordnen(d.id, [op], 'AA'));
  assert.deepStrictEqual(Object.keys(r.zuordnung).sort(), ['PG-2', 'PG-3'], 'Wiederholung bucht kein drittes Stück');
  assert.ok(r.konflikte[0].gleich && r.konflikte[0].id === 'PG-3' && r.konflikte[0].wunsch === 'PG-2', JSON.stringify(r.konflikte));
  const si = spalte(DB, 'Zuordnung', 'Scan-ID');
  assert.ok(si > -1 && tab(DB, 'Zuordnung').some(z => z[si] === 'm-1' && z[1] === 'PG-3'), 'Scan-ID steht im Tab');
  assert.ok(!/43200|CacheService/.test(fs.readFileSync(__dirname + '/../apps/umpacken/Code.gs', 'utf8')), 'kein Cache mit 43200 s mehr');
});
test('B15 einrichten ergänzt «Scan-ID», «Verworfen am/von» in bestehenden Tabs; ohne Spalte lehnt zuordnen laut ab', () => {
  const alt = { 'Zuordnung': [['Durchgang', 'PG-ID', 'Gebinde', 'Preis', 'Zeit', 'Kürzel'], ['U-0009', 'PG-1', 'U-0009-G1', '', 'x', 'JB']],
    'Durchgänge': [['Durchgang', 'Name', 'Status', 'Quelle', 'Quell-Lagerorte', 'Erstellt am', 'Erstellt von', 'Abgeschlossen am', 'Abgeschlossen von', 'Listen']] };
  const { c, DB } = lade({ db: alt });
  assert.deepStrictEqual(tab(DB, 'Zuordnung')[0].slice(-1), ['Scan-ID']);
  assert.deepStrictEqual(tab(DB, 'Zuordnung')[1].slice(0, 2), ['U-0009', 'PG-1'], 'Daten bleiben');
  assert.deepStrictEqual(tab(DB, 'Durchgänge')[0].slice(-2), ['Verworfen am', 'Verworfen von']);
  /* Spalte fehlt (einrichten nicht gelaufen) */
  const { c: c2, DB: DB2, j } = lade();
  const d = j(c2.anlegen({ name: 'X', quelle: 'rt', lagerorte: ['KID-7'], gebinde: [lager('Neu', 'KID-20')] }));
  tab(DB2, 'Zuordnung')[0].pop();
  assert.throws(() => c2.zuordnen(d.id, [{ id: 'PG-1', gebinde: d.gebinde[0].id, vorher: '' }], 'JB'), /Scan-ID» fehlt/);
});

/* ---------- Befund 4: Lagerort alt bei EAN-Auflösung ---------- */
test('B4 gleiche EAN, freie Stücke aus verschiedenen Lagerorten: PG-ID verlangen; gleicher Ort: Auflösung', () => {
  const { c, j } = lade();
  const d = j(c.anlegen({ name: 'C', quelle: 'rt', lagerorte: ['KID-7', 'KID-12'], gebinde: [lager('Neu', 'KID-20')], kuerzel: 'JB' }));
  const G = d.gebinde[0].id;
  let r = j(c.zuordnen(d.id, [{ code: '222', wunsch: 'PG-2', gebinde: G, vorher: '', sid: 's1' }], 'AA'));
  assert.ok(!r.ergebnis.length && /verschiedenen Lagerorten \(KID-7, KID-12\), PG-ID scannen/.test(r.konflikte[0].grund), JSON.stringify(r.konflikte));
  c.zuordnen(d.id, [{ id: 'PG-6', gebinde: G, vorher: '' }], 'AA');      // das Stück aus KID-12 per PG-ID
  r = j(c.zuordnen(d.id, [{ code: '222', wunsch: 'PG-2', gebinde: G, vorher: '', sid: 's2' }], 'AA'));
  assert.deepStrictEqual(r.ergebnis.map(x => x.id), ['PG-2'], 'jetzt nur noch KID-7: Barcode geht');
});

/* ---------- Befund 6: Liste von Hand gegen das Return Tool ---------- */
test('B6 Liste von Hand: aufgelöst (V3), unbekannt/Archiv/doppelt abgelehnt, Abschluss geprüft, Überlappung normalisiert', () => {
  const { c, j } = lade();
  assert.throws(() => c.anlegen({ name: 'E', quelle: 'manuell', liste: 'ID\tLagerort\nPG-0001\tKID-7\nPG-999\tKID-9', gebinde: [lager('Neu', 'KID-20')] }), /nicht im Return Tool: PG-999/);
  assert.throws(() => c.anlegen({ name: 'E', quelle: 'manuell', liste: 'ID\nPG-50', gebinde: [lager('Neu', 'KID-20')] }), /nur im Archiv \(verkauft oder weg\): PG-50/);
  assert.throws(() => c.anlegen({ name: 'E', quelle: 'manuell', liste: 'ID\nPG-60', gebinde: [lager('Neu', 'KID-20')] }), /mehrfach im Return Tool: PG-60 \(Online Zeile 7, Caritas Zeile 7\)/);
  const d = j(c.anlegen({ name: 'E', quelle: 'manuell', liste: 'ID\tLagerort\nPG-0001\tKID-7\npg 5\tKID-99\nPG-9\tHOM-3\n\tnur Text', gebinde: [lager('Neu', 'KID-20')], kuerzel: 'JB' }));
  assert.deepStrictEqual(d.bestand.map(p => p.id + '@' + p.ort), ['PG-1@KID-7', 'PG-5@KID-12', 'PG-9@HOM-3'], 'ID, Lagerort aus dem Return Tool (PG-9: Archiv zählt nicht)');
  assert.ok(d.hinweise.some(h => /Lagerort aus dem Return Tool übernommen.*pg 5 KID-99 → KID-12/.test(h)), JSON.stringify(d.hinweise));
  assert.ok(d.hinweise.some(h => /1 Zeilen ohne ID übersprungen \(Zeile 5\)/.test(h)), JSON.stringify(d.hinweise));
  /* Überlappung normalisiert: «PG-0001» im anderen Durchgang = PG-1 */
  assert.throws(() => c.anlegen({ name: 'E2', quelle: 'rt', lagerorte: ['KID-7'], gebinde: [lager('Neu', 'KID-30')] }), /PG-1 in U-0001 \(offen\)/);
  c.zuordnen(d.id, d.bestand.map(p => ({ id: p.id, gebinde: d.gebinde[0].id, vorher: '' })), 'JB');
  c.UHR = '24.10.2026 09:00:00';
  const f = j(c.abschliessen(d.id, 'JB', true));
  assert.ok(f.aenderungen.every(a => !/nicht geprüft/.test(a.pruefung)), 'Abschluss prüft auch die Liste von Hand');
  assert.ok(/steht 2× im Return Tool/.test(f.aenderungen.find(a => a.id === 'PG-9').pruefung), 'PG-9 auch im Archiv: Abweichung');
  assert.strictEqual(f.aenderungen.find(a => a.id === 'PG-1').pruefung, 'ok');
});

/* ---------- Befund 7: Vertrag V2, Tab voll ---------- */
test('B7 V2: Tabs mit 30 Zeilen laufen nicht voll (insertRowsAfter mit Textformat), anlegen mit 40 Stücken klappt', () => {
  const viele = (K6, leer5, st) => { const z = [K6]; for (let i = 1; i <= 40; i++) z.push(st('PG-' + i, 'X', String(1000 + i), 5, 'KID-7')); return { 'Stationär': leer5.concat(z) }; };
  const { c, DB, j } = lade({ maxRows: 30, streng: true, rt: viele });
  const d = j(c.anlegen({ name: 'K', quelle: 'rt', lagerorte: ['KID-7'], gebinde: [lager('Neu', 'KID-20')], kuerzel: 'JB' }));
  assert.strictEqual(d.bestand.length, 40);
  const b = DB.getSheetByName('Bestand');
  assert.ok(b.getMaxRows() >= 41 && b.formate.some(f => f[0] === 31 && f[4] === '@'), 'neue Zeilen ab 31 als Text: ' + JSON.stringify(b.formate.slice(-2)));
  c.zuordnen(d.id, d.bestand.map(p => ({ id: p.id, gebinde: d.gebinde[0].id, vorher: '' })), 'JB');
  assert.strictEqual(tab(DB, 'Zuordnung').length, 41);
});
test('B7 Teil-Schreiben beim Setup: Durchgang wird «Verworfen», Stücke und Lagerort bleiben frei', () => {
  const { c, DB, S, j } = lade();
  S.schreibFehler = (n) => n === 'Bestand';
  assert.throws(() => c.anlegen({ name: 'K', quelle: 'rt', lagerorte: ['KID-7'], gebinde: [lager('Neu', 'KID-20')] }), /nicht ganz speichern.*U-0001 ist verworfen/);
  S.schreibFehler = null;
  assert.strictEqual(tab(DB, 'Durchgänge')[1][2], 'Verworfen');
  const d = j(c.anlegen({ name: 'K2', quelle: 'rt', lagerorte: ['KID-7'], gebinde: [lager('Neu', 'KID-20')] }));
  assert.strictEqual(d.id, 'U-0002', 'neue Nummer, KID-20 und die Stücke sind frei');
});

/* ---------- Befund 9: Gebinde-Nummer und Gebinde-Stand ---------- */
test('B9 Gebinde-Nummer nie wiederverwendet; Gebinde-Stand in Antworten; veralteter Stand lehnt gebindeAendern ab', () => {
  const { c, j } = lade();
  const d = j(c.anlegen({ name: 'D', quelle: 'rt', lagerorte: ['KID-7', 'KID-12'], gebinde: [lager('Kids neu', 'KID-20'), lager('Kids 2', 'KID-21')], kuerzel: 'JB' }));
  const G1 = d.gebinde[0].id, G2 = d.gebinde[1].id, stand0 = d.gebindeStand;
  assert.ok(stand0 && j(c.stand(d.id)).gebindeStand === stand0);
  c.zuordnen(d.id, [{ id: 'PG-1', gebinde: G1, vorher: '' }], 'JB');
  const n1 = j(c.gebindeAendern(d.id, [j(c.laden(d.id)).gebinde[0]], stand0));        // «Kids 2» löschen
  assert.notStrictEqual(n1.gebindeStand, stand0);
  assert.throws(() => c.gebindeAendern(d.id, n1.gebinde.concat([{ name: 'Weg', art: 'Entsorgung' }]), stand0), /Inzwischen hat jemand anderes die Gebinde geändert/);
  const neu = j(c.gebindeAendern(d.id, n1.gebinde.concat([{ name: 'Weg', art: 'Entsorgung' }]), n1.gebindeStand)).gebinde;
  assert.deepStrictEqual(neu.map(g => g.id), [G1, d.id + '-G3'], 'G2 wird nicht wieder vergeben');
  const r = j(c.zuordnen(d.id, [{ id: 'PG-5', gebinde: G2, vorher: '' }], 'BB'));
  assert.ok(/Gebinde gibt es nicht/.test(r.konflikte[0].grund) && !r.zuordnung['PG-5'], 'veralteter Scan landet nicht im neuen Gebinde');
  assert.strictEqual(r.gebindeStand, j(c.laden(d.id)).gebindeStand, 'zuordnen liefert den Gebinde-Stand');
});

/* ---------- Befund 10: Durchgang verwerfen ---------- */
test('B10 verwerfen: ohne Scans jede Person, mit Scans nur Admins; danach Stücke und Lagerorte frei; Status sperrt alles', () => {
  const { c, S, j } = lade();
  S.ich = 'lager@pg';
  const d = j(c.anlegen({ name: 'falsch', quelle: 'rt', lagerorte: ['KID-7', 'KID-12'], gebinde: [lager('Neu', 'KID-20')], kuerzel: 'LA' }));
  assert.throws(() => c.anlegen({ name: 'richtig', quelle: 'rt', lagerorte: ['KID-12'], gebinde: [lager('Neu', 'KID-30')] }), /schon in einem anderen Durchgang/);
  const v = j(c.verwerfen(d.id, 'LA'));
  assert.strictEqual(v.status, 'Verworfen');
  assert.throws(() => c.zuordnen(d.id, [{ id: 'PG-1', gebinde: d.gebinde[0].id, vorher: '' }], 'LA'), /nicht im Scan \(Status: Verworfen\)/);
  assert.throws(() => c.verwerfen(d.id), /schon verworfen/);
  assert.throws(() => c.abschliessen(d.id, 'LA', true), /nicht im Scan \(Status: Verworfen\)/);
  const e = j(c.anlegen({ name: 'richtig', quelle: 'rt', lagerorte: ['KID-12'], gebinde: [lager('Neu', 'KID-20')] }));
  assert.strictEqual(e.id, 'U-0002', 'Stücke und KID-20 wieder frei');
  c.zuordnen(e.id, [{ id: 'PG-5', gebinde: e.gebinde[0].id, vorher: '' }], 'LA');
  assert.throws(() => c.verwerfen(e.id), /schon 1 Stücke gescannt: nur ein Admin/);
  S.ich = 'jonas@pg';                    // Admins leer → das Konto, unter dem das Tool läuft
  c.UHR = '24.10.2026 09:00:00';
  assert.strictEqual(j(c.verwerfen(e.id, 'JB')).status, 'Verworfen');
  const f = j(c.anlegen({ name: 'drei', quelle: 'rt', lagerorte: ['KID-12'], gebinde: [lager('Neu', 'KID-20')] }));
  c.zuordnen(f.id, [{ id: 'PG-5', gebinde: f.gebinde[0].id, vorher: '' }], 'JB');
  c.abschliessen(f.id, 'JB', true);
  assert.throws(() => c.verwerfen(f.id), /abgeschlossen\. Ein Admin muss ihn zuerst wieder öffnen/);
  assert.ok(j(c.start()).durchgaenge.some(x => x.status === 'Verworfen'));
});

/* ---------- Befund 11: Preis plausibel ---------- */
test('B11 Preis: Barcode, ab 100 000, unlesbar abgelehnt; 0 und «12,50» erlaubt', () => {
  const { c, j } = lade();
  const d = j(c.anlegen({ name: 'H', quelle: 'rt', lagerorte: ['KID-7'], gebinde: [{ name: 'Balu 1', art: 'Verkauf', abnehmer: 'Balu', lagerort: 'BALU-1', preisregel: 'VP' }], kuerzel: 'JB' }));
  const G = d.gebinde[0].id;
  c.zuordnen(d.id, [{ id: 'PG-1', gebinde: G, vorher: '' }], 'JB');
  const ko = (p) => j(c.zuordnen(d.id, [{ id: 'PG-1', gebinde: G, preis: p, vorher: G }], 'JB')).konflikte.map(k => k.grund).join('|');
  assert.ok(/Barcode/.test(ko(4005176984105)), 'Zahl mit 13 Ziffern');
  assert.ok(/Barcode/.test(ko('40051769')), '8 Ziffern als Text');
  assert.ok(/zu hoch/.test(ko(100000)));
  assert.ok(/unlesbar/.test(ko('abc')));
  assert.ok(/kleiner als 0/.test(ko(-1)));
  assert.strictEqual(ko(0), ''); assert.strictEqual(ko('12,50'), '');
  assert.strictEqual(j(c.laden(d.id)).zuordnung['PG-1'].preis, 12.5);
});

/* ---------- Befund 13: fremde und fehlende Stücke ---------- */
test('B13 fremde Scans ins Log; nicht gescannte Stücke als «Nicht gefunden – prüfen», sperren nichts', () => {
  const { c, DB, S, j } = lade();
  const d = j(c.anlegen({ name: 'F', quelle: 'rt', lagerorte: ['KID-12'], gebinde: [lager('Neu', 'KID-20')], kuerzel: 'JB' }));
  const G = d.gebinde[0].id;
  c.zuordnen(d.id, [{ unbekannt: '4000000000001', bei: G }, { code: '5555', wunsch: '', gebinde: G, vorher: '', sid: 'f1' }, { id: 'PG-1', gebinde: G, vorher: '' }, { id: 'PG-5', gebinde: G, vorher: '' }], 'AB');
  const log = tab(DB, 'Log').filter(z => z[2] === 'Fremder Scan');
  assert.ok(log.length === 1 && /AB: 4000000000001 \(bei Neu\), 5555, PG-1/.test(log[0][4]), JSON.stringify(log));
  c.UHR = '24.10.2026 09:00:00';
  const f = j(c.abschliessen(d.id, 'JB', true));
  const ng = f.aenderungen.filter(a => a.aktion === 'Nicht gefunden – prüfen').map(a => a.id).sort();
  assert.deepStrictEqual(ng, ['PG-6', 'PG-7', 'PG-8'], JSON.stringify(f.aenderungen.map(a => a.id + ':' + a.aktion)));
  assert.ok(f.hinweise.some(h => /3 Stücke nicht gescannt/.test(h)));
  /* sperren nichts: PG-6 kann in einen neuen Durchgang; PG-5 (Lagerort ändern, nicht eingetragen) sperrt */
  assert.throws(() => c.anlegen({ name: 'G', quelle: 'manuell', liste: 'ID\nPG-5', gebinde: [lager('Neu', 'KID-40')] }), /PG-5 in U-0001 \(Änderung noch nicht/);
  const g = j(c.anlegen({ name: 'G', quelle: 'manuell', liste: 'ID\nPG-6', gebinde: [lager('Neu', 'KID-40')] }));
  assert.strictEqual(g.bestand[0].id, 'PG-6');
  /* «Erledigt» auf einer Nicht-gefunden-Zeile hindert das Wiederöffnen nicht */
  const x = f.aenderungen.find(a => a.id === 'PG-7');
  c.erledigt(d.id, [{ r: x.r, id: x.id }], true);
  c.verwerfen(g.id);
  S.ich = 'jonas@pg';                    // Admin
  assert.strictEqual(j(c.wiederOeffnen(d.id)).status, 'Scan');
});

/* ---------- Befund 14: Zeilen ohne gültige ID ---------- */
test('B14 Zeilen ohne gültige ID: im Setup gezählt und als Hinweis, «PG 13» gilt (V3)', () => {
  const { c, j } = lade({ rt: (K6, leer5, st) => ({ 'Stationär': leer5.concat([K6, st('PG-1', 'Lego', '111', 20, 'KID-7'), st('', 'Puppe ohne ID', '222', 5, 'KID-7'), st('PG-12a', 'Bär', '333', 5, 'KID-7'), st('PG 13', 'Auto', '444', 5, 'KID-7'), [false, '', '', '', '', '', '', '', '', '', '', '', '', 'KID-7']]) }) });
  const o = j(c.lagerorte()).orte.find(x => x.ort === 'KID-7');
  assert.strictEqual(o.anzahl, 2); assert.strictEqual(o.ohneId, 2, 'leere Zeile zählt nicht');
  const d = j(c.anlegen({ name: 'I', quelle: 'rt', lagerorte: ['KID-7'], gebinde: [lager('Neu', 'KID-20')] }));
  assert.deepStrictEqual(d.bestand.map(p => p.id), ['PG-1', 'PG 13']);
  assert.ok(d.hinweise.some(h => /KID-7: 2 Zeilen ohne ID oder mit ungültiger ID.*Puppe ohne ID.*Bär «PG-12a»/.test(h)), JSON.stringify(d.hinweise));
});

/* ---------- Befund 16: VP fehlt ---------- */
test('B16 zahl_ robust; VP leer/unlesbar beim Setup und Abschluss markiert', () => {
  const { c, DB, j } = lade();
  [['Fr. 12.50', 12.5], ['15.–', 15], ['ca. 20', 20], ['CHF 12.-', 12], ['12.50 CHF', 12.5], ["1'234.50", 1234.5], ['SFr. 3', 3], ['', 0], ['abc', 0], [7, 7]].forEach(x => assert.strictEqual(c.zahl_(x[0]), x[1], 'zahl_ ' + x[0]));
  assert.strictEqual(c.zahlOderNull_(''), null); assert.strictEqual(c.zahlOderNull_('abc'), null); assert.strictEqual(c.zahlOderNull_('0'), 0);
  const d = j(c.anlegen({ name: 'V', quelle: 'rt', lagerorte: ['KID-12'], gebinde: [{ name: 'Balu 1', art: 'Verkauf', abnehmer: 'Balu', lagerort: 'BALU-1', preisregel: 'VP' }], kuerzel: 'JB' }));
  assert.ok(d.hinweise.some(h => /1 Stücke ohne VP.*PG-7/.test(h)), JSON.stringify(d.hinweise));
  assert.ok(d.bestand.find(p => p.id === 'PG-7').vpFehlt && !d.bestand.find(p => p.id === 'PG-8').vpFehlt && d.bestand.find(p => p.id === 'PG-8').vp === 20);
  const vi = spalte(DB, 'Bestand', 'VP');
  assert.strictEqual(tab(DB, 'Bestand').find(z => z[1] === 'PG-7')[vi], '', 'VP leer bleibt leer (nicht 0)');
  c.zuordnen(d.id, [{ id: 'PG-7', gebinde: d.gebinde[0].id, vorher: '' }, { id: 'PG-8', gebinde: d.gebinde[0].id, vorher: '' }], 'JB');
  c.UHR = '24.10.2026 09:00:00';
  const f = j(c.abschliessen(d.id, 'JB', true));
  assert.ok(/^ABWEICHUNG: VP fehlt oder ist 0 \(Preis CHF 0.00 aus VP\)/.test(f.aenderungen.find(a => a.id === 'PG-7').pruefung), f.aenderungen.find(a => a.id === 'PG-7').pruefung);
  assert.strictEqual(f.aenderungen.find(a => a.id === 'PG-8').pruefung, 'ok');
  assert.ok(f.hinweise.some(h => /1 Stücke ohne VP: Preis 0/.test(h)));
});

/* ---------- Befund 17: Lagerort ohne Trennzeichen ---------- */
test('B17 KID15, KID 15, KID–15, KID_15 gelten als belegt, wenn KID-15 belegt ist', () => {
  const { c } = lade({ rt: (K6, leer5, st) => ({ 'Stationär': leer5.concat([K6, st('PG-1', 'Lego', '111', 20, 'KID-7'), st('PG-8', 'Ball', '888', 5, 'KID-15')]) }) });
  ['KID15', 'KID 15', 'KID–15', 'KID_15'].forEach(o => assert.throws(() => c.anlegen({ name: 'G', quelle: 'rt', lagerorte: ['KID-7'], gebinde: [lager('Neu', o)] }), /ist schon belegt.*KID-15/, o));
  assert.throws(() => c.anlegen({ name: 'G', quelle: 'rt', lagerorte: ['KID-7'], gebinde: [lager('A', 'X-1'), lager('B', 'X 1')] }), /zwei Gebinde/);
  assert.throws(() => c.anlegen({ name: 'G', quelle: 'rt', lagerorte: ['KID-7'], gebinde: [lager('A', 'KID7')] }), /auch ein Quell-Lagerort/);
  const o = JSON.parse(JSON.stringify(c.lagerorte()));
  assert.strictEqual(o.naechste.KID, 'KID-16'); assert.ok(o.belegt.indexOf('KID-15') > -1, 'belegt in Schreibweise');
});

/* ---------- Befund 18: Abfrage nur lesend ---------- */
test('B18 stand(): ohne Sperre, ohne Log bei abgeschlossenem Durchgang, mit Status', () => {
  const { c, DB, S, j } = lade();
  const d = j(c.anlegen({ name: 'L', quelle: 'rt', lagerorte: ['KID-7'], gebinde: [lager('Neu', 'KID-20')], kuerzel: 'JB' }));
  c.zuordnen(d.id, [{ id: 'PG-1', gebinde: d.gebinde[0].id, vorher: '' }], 'JB');
  c.UHR = '24.10.2026 09:00:00';
  c.abschliessen(d.id, 'JB', true);
  const vor = tab(DB, 'Log').length;
  S.lockFrei = false;
  for (let i = 0; i < 10; i++) { const r = j(c.api('stand', [d.id])); assert.strictEqual(r.status, 'Abgeschlossen'); assert.strictEqual(r.zuordnung['PG-1'].gebinde, d.gebinde[0].id); }
  assert.strictEqual(tab(DB, 'Log').length, vor, 'keine Log-Zeilen');
  /* alte Seite (vor dem Neuladen) fragt noch über zuordnen ohne Scans ab: Fehler an die Seite, aber keine Log-Flut */
  S.lockFrei = true;
  for (let i = 0; i < 3; i++) assert.throws(() => c.api('zuordnen', [d.id, [], 'BB']), /nicht im Scan/);
  assert.strictEqual(tab(DB, 'Log').length, vor, 'keine Log-Zeilen von alten Abfragen');
  assert.throws(() => c.api('zuordnen', [d.id, [{ id: 'PG-1', gebinde: d.gebinde[0].id, vorher: '' }], 'BB']), /nicht im Scan/);
  assert.strictEqual(tab(DB, 'Log').length, vor + 1, 'echter Scan nach dem Abschluss steht im Log');
});

/* ---------- Befund 20: Erledigt mit PG-ID ---------- */
test('B20 erledigt: Zeile + PG-ID; verschobene Zeile über die PG-ID; nur Nummern oder unklare ID: nichts gesetzt', () => {
  const { c, DB, j } = lade();
  const d = j(c.anlegen({ name: 'R', quelle: 'rt', lagerorte: ['KID-12'], gebinde: [lager('Neu', 'KID-20')], kuerzel: 'JB' }));
  c.zuordnen(d.id, [{ id: 'PG-5', gebinde: d.gebinde[0].id, vorher: '' }, { id: 'PG-6', gebinde: d.gebinde[0].id, vorher: '' }], 'JB');
  c.UHR = '24.10.2026 09:00:00';
  const a = j(c.abschliessen(d.id, 'JB', true)).aenderungen, p5 = a.find(x => x.id === 'PG-5'), p6 = a.find(x => x.id === 'PG-6');
  assert.throws(() => c.erledigt(d.id, [p5.r], true), /Veraltete Ansicht/);
  let e = j(c.erledigt(d.id, [{ r: p6.r, id: 'pg 5' }], true));          // falsche Zeile, richtige ID (V3): über die ID gefunden
  assert.ok(e.find(x => x.id === 'PG-5').erledigt && !e.find(x => x.id === 'PG-6').erledigt);
  assert.throws(() => c.erledigt(d.id, [{ r: p6.r, id: 'PG-1' }], true), /nicht eindeutig gefunden: PG-1/);
  assert.ok(!j(c.laden(d.id)).aenderungen.find(x => x.id === 'PG-6').erledigt, 'nichts gesetzt');
});

/* ---------- Z4 und V4: Quell-Tabs ---------- */
test('Z4/V4 Vorgabe Quell-Tabs ohne «Spenden»; alte Vorgabe wird ersetzt, eigene bleibt; Quell-Tab ohne Bezeichnung nicht lesbar', () => {
  const { c, DB } = lade();
  const e = tab(DB, 'Einstellungen').find(z => z[0] === 'Quell-Tabs');
  assert.strictEqual(e[1], 'Stationär, Berner Brocki, Caritas, Heilsarmee, Online');
  const altE = (wert) => ({ 'Einstellungen': [['Einstellung', 'Wert', 'Erklärung'], ['Quell-Tabs', wert, 'alt'], ['Admins', '', 'Leer = alle.']] });
  const m1 = lade({ db: altE('Stationär, Berner Brocki, Caritas, Heilsarmee, Online, Spenden') });
  assert.strictEqual(tab(m1.DB, 'Einstellungen').find(z => z[0] === 'Quell-Tabs')[1], 'Stationär, Berner Brocki, Caritas, Heilsarmee, Online', 'alte Vorgabe ersetzt');
  assert.ok(/Leer = nur das Konto/.test(tab(m1.DB, 'Einstellungen').find(z => z[0] === 'Admins')[2]), 'Erklärung nachgeführt');
  const m2 = lade({ db: altE('Stationär, Spenden') });
  assert.strictEqual(tab(m2.DB, 'Einstellungen').find(z => z[0] === 'Quell-Tabs')[1], 'Stationär, Spenden', 'eigener Wert bleibt');
  const m3 = lade({ rt: (K6, leer5, st) => ({ 'Stationär': leer5.concat([K6, st('PG-1', 'Lego', '111', 20, 'KID-7')]), 'Online': leer5.concat([['ID', 'Barcode', 'Lagerort'], ['PG-2', '1', 'ONL-1']]) }) });
  const o = JSON.parse(JSON.stringify(m3.c.lagerorte()));
  assert.ok(o.fehlend.indexOf('Online') > -1 && !o.orte.some(x => x.ort === 'ONL-1') && o.belegt.indexOf('ONL-1') > -1, 'Online ohne Bezeichnung: gemeldet, Lagerort trotzdem belegt');
});

/* ---------- V6: Admins ---------- */
test('V6 Admins leer = nur das Konto, unter dem das Tool läuft; neues Sheet: Admins = einrichtendes Konto', () => {
  const { c, DB, S, j } = lade({ db: { 'Einstellungen': [['Einstellung', 'Wert', 'Erklärung'], ['Admins', '', 'x']] } });
  const d = j(c.anlegen({ name: 'W', quelle: 'rt', lagerorte: ['KID-7'], gebinde: [lager('Neu', 'KID-20')] }));
  c.zuordnen(d.id, [{ id: 'PG-1', gebinde: d.gebinde[0].id, vorher: '' }], 'JB');
  c.UHR = '24.10.2026 09:00:00'; c.abschliessen(d.id, 'JB', true);
  S.ich = 'simon@pg';
  assert.throws(() => c.wiederOeffnen(d.id), /Nur für Admins/);
  S.ich = 'jonas@pg';
  assert.strictEqual(j(c.wiederOeffnen(d.id)).status, 'Scan');
  const n = lade();
  assert.strictEqual(tab(n.DB, 'Einstellungen').find(z => z[0] === 'Admins')[1], 'jonas@pg', 'neues Sheet: einrichtendes Konto eingetragen');
});

console.log(fehler ? fehler + ' Fehler' : 't_umpacken_p2410 ok');
process.exit(fehler ? 1 : 0);
