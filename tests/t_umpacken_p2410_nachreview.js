/* Umpack Tool, Nach-Review 24.10.2026 (Version 2026-10-24.2, noch nicht eingespielt): Regressionstests Server.
   N2  Übergang: Barcode-Scan aus einer Schlange von vor dem Einspielen (mit Kennung, die der alte Server nur im Cache hatte) bucht kein zweites Stück.
   N3  Abschluss: Liste von Hand von vor 2026-10-24.2 («Quelle Tab» = manuell) ohne falsche Tab-Abweichung; Abweichungen bei «Nicht gefunden – prüfen» zählen im Hinweis.
   Testhilfe wie tests/t_umpacken_p2410.js (Sheets im Speicher, erfundene Daten). Lauf: node tests/t_umpacken_p2410_nachreview.js
   Gegenprobe: UMPACK_CODE=<Pfad zu einem anderen Code.gs> node tests/t_umpacken_p2410_nachreview.js */
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
  vm.runInContext(fs.readFileSync(process.env.UMPACK_CODE || (__dirname + '/../apps/umpacken/Code.gs'), 'utf8'), c);   // UMPACK_CODE: Gegenprobe gegen einen anderen Stand
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
/* Zeile, wie sie der Server vor 2026-10-24.2 geschrieben hat: ohne «Scan-ID» */
function alteZeile(DB, d, pg, g, ku) { const k = tab(DB, 'Zuordnung')[0]; const z = k.map(() => ''); z[0] = d; z[1] = pg; z[2] = g; z[4] = '24.10.2026 07:00:00'; z[5] = ku; tab(DB, 'Zuordnung').push(z); }

/* ---------- N2: Übergang Scan-Kennung ---------- */
test('N2 Kennung unbekannt, Wunsch-Stück mit alter Zeile ohne «Scan-ID» (gleiches Gebinde, gleiches Kürzel): schon gespeichert, kein zweites Stück', () => {
  const { c, DB, j } = lade();
  const d = j(c.anlegen({ name: 'U', quelle: 'rt', lagerorte: ['KID-7'], gebinde: [lager('Neu', 'KID-20')], kuerzel: 'AA' }));
  const G = d.gebinde[0].id;
  alteZeile(DB, d.id, 'PG-2', G, 'AA');                       // alter Server hat den Scan gebucht, die Antwort ging verloren
  const vor = tab(DB, 'Zuordnung').length;
  const r = j(c.zuordnen(d.id, [{ code: '222', wunsch: 'PG-2', gebinde: G, preis: '', vorher: '', sid: 'mh5abc12xyz9' }], 'AA'));
  assert.deepStrictEqual(Object.keys(r.zuordnung).sort(), ['PG-2'], 'kein zweites Stück: ' + JSON.stringify(r));
  assert.ok(r.konflikte.length === 1 && r.konflikte[0].gleich && r.konflikte[0].id === 'PG-2' && r.konflikte[0].wunsch === 'PG-2', JSON.stringify(r.konflikte));
  assert.strictEqual(tab(DB, 'Zuordnung').length, vor, 'nichts geschrieben');
});
test('N2 Regel bleibt eng: anderes Kürzel, anderes Gebinde oder Zeile dieses Servers (auch per PG-ID) = echter zweiter EAN-Scan (Befund 3)', () => {
  const { c, DB, j } = lade();
  const d = j(c.anlegen({ name: 'U', quelle: 'rt', lagerorte: ['KID-7'], gebinde: [lager('Neu', 'KID-20'), lager('Zwei', 'KID-21')], kuerzel: 'AA' }));
  const G = d.gebinde[0].id, G2 = d.gebinde[1].id;
  alteZeile(DB, d.id, 'PG-2', G, 'BB');                       // anderes Kürzel
  let r = j(c.zuordnen(d.id, [{ code: '222', wunsch: 'PG-2', gebinde: G, vorher: '', sid: 'aaaa1111' }], 'AA'));
  assert.ok(r.zuordnung['PG-3'] && !r.konflikte.length, 'anderes Kürzel: weiteres Stück ' + JSON.stringify(r));
  r = j(c.zuordnen(d.id, [{ code: '222', wunsch: 'PG-3', gebinde: G2, vorher: '', sid: 'aaaa2222' }], 'AA'));
  assert.ok(r.zuordnung['PG-4'] && r.zuordnung['PG-4'].gebinde === G2, 'anderes Gebinde: weiteres Stück ' + JSON.stringify(r));
  /* Zeile dieses Servers per PG-ID: «Scan-ID» = «-», ein echter zweiter EAN-Scan mit veraltetem Wunsch bleibt gültig */
  const { c: c2, DB: DB2, j: j2 } = lade();
  const e = j2(c2.anlegen({ name: 'V', quelle: 'rt', lagerorte: ['KID-7'], gebinde: [lager('Neu', 'KID-20')], kuerzel: 'AA' }));
  c2.zuordnen(e.id, [{ id: 'PG-2', gebinde: e.gebinde[0].id, vorher: '' }], 'AA');
  const si = spalte(DB2, 'Zuordnung', 'Scan-ID');
  assert.strictEqual(tab(DB2, 'Zuordnung').filter(z => z[1] === 'PG-2')[0][si], '-', 'Zeile ohne Barcode-Scan: «Scan-ID» = «-»');
  r = j2(c2.zuordnen(e.id, [{ code: '222', wunsch: 'PG-2', gebinde: e.gebinde[0].id, vorher: '', sid: 'bbbb1111' }], 'AA'));
  assert.ok(r.zuordnung['PG-2'] && r.zuordnung['PG-3'] && !r.konflikte.length, 'PG-ID-Zeile dieses Servers: weiteres Stück ' + JSON.stringify(r));
  /* «-» ist keine Kennung: Wiederholung mit derselben Kennung weiterhin über «Scan-ID» erkannt */
  r = j2(c2.zuordnen(e.id, [{ code: '222', wunsch: 'PG-2', gebinde: e.gebinde[0].id, vorher: '', sid: 'bbbb1111' }], 'AA'));
  assert.ok(r.konflikte[0] && r.konflikte[0].gleich && r.konflikte[0].id === 'PG-3' && !r.zuordnung['PG-4'], JSON.stringify(r));
});

/* ---------- N3: Abschluss ---------- */
test('N3 Liste von Hand von vor 2026-10-24.2 («Quelle Tab» = manuell): kein «jetzt im Tab …», Lagerort weiter geprüft', () => {
  const { c, DB, j } = lade();
  const d = j(c.anlegen({ name: 'M', quelle: 'manuell', liste: 'ID\tLagerort\nPG-1\tKID-7\nPG-5\tKID-12\nPG-2\tKID-7', gebinde: [lager('Neu', 'KID-30')], kuerzel: 'AA' }));
  /* so hat der alte Code die Liste gespeichert: Tab «manuell», Zeile der Liste, Lagerort aus der Liste */
  const B = tab(DB, 'Bestand'), ct = B[0].indexOf('Quelle Tab'), cz = B[0].indexOf('Quelle Zeile'), co = B[0].indexOf('Lagerort alt'), cp = B[0].indexOf('PG-ID');
  B.slice(1).forEach((z, i) => { if (z[0] === d.id) { z[ct] = 'manuell'; z[cz] = String(i + 2); if (z[cp] === 'PG-2') z[co] = 'KID-8'; } });
  c.zuordnen(d.id, [{ id: 'PG-1', gebinde: d.gebinde[0].id, vorher: '' }, { id: 'PG-2', gebinde: d.gebinde[0].id, vorher: '' }], 'AA');
  c.UHR = '24.10.2026 09:00:00';
  const r = j(c.abschliessen(d.id, 'AA', true)), p = {};
  r.aenderungen.forEach(a => { p[a.id] = a; });
  assert.strictEqual(p['PG-1'].pruefung, 'ok', 'PG-1: ' + p['PG-1'].pruefung);
  assert.strictEqual(p['PG-5'].pruefung, 'ok', 'PG-5 (nicht gefunden): ' + p['PG-5'].pruefung);
  assert.strictEqual(p['PG-1'].tab, 'Stationär', 'Tab aus dem Return Tool');
  assert.ok(/^ABWEICHUNG: Lagerort jetzt «KID-7» statt «KID-8»$/.test(p['PG-2'].pruefung), 'Lagerort weiter geprüft: ' + p['PG-2'].pruefung);
});
test('N3 Abweichungen bei «Nicht gefunden – prüfen» zählen im Hinweis', () => {
  const { c, RT, j } = lade();
  const d = j(c.anlegen({ name: 'A', quelle: 'rt', lagerorte: ['KID-12'], gebinde: [lager('Neu', 'KID-30')], kuerzel: 'AA' }));
  c.zuordnen(d.id, [{ id: 'PG-5', gebinde: d.gebinde[0].id, vorher: '' }], 'AA');
  RT.getSheetByName('Stationär').v.forEach(z => { if (z[1] === 'PG-6') z[13] = 'KID-99'; });      // nicht gescannt, inzwischen anderswo
  c.UHR = '24.10.2026 09:00:00';
  const r = j(c.abschliessen(d.id, 'AA', true)), ng = r.aenderungen.filter(a => a.id === 'PG-6')[0];
  assert.ok(ng && ng.aktion === 'Nicht gefunden – prüfen' && /^ABWEICHUNG/.test(ng.pruefung), JSON.stringify(ng));
  const n = r.aenderungen.filter(a => /^ABWEICHUNG/.test(a.pruefung)).length;
  assert.ok(n >= 1 && r.hinweise[0] === n + ' Abweichungen zum Return Tool: vor dem Eintragen prüfen (Spalte «Prüfung»).', n + ' / ' + JSON.stringify(r.hinweise));
});

console.log(fehler ? fehler + ' Fehler' : 't_umpacken_p2410_nachreview ok');
process.exit(fehler ? 1 : 0);
