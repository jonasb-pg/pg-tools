/* Umpack Tool 2026-10-26.3 (Jonas 26.10.2026): Anzahl pro Zeile, Teilmengen (Variante A), Quelle während des Scans, fremder Scan, Übertrag mit Vorschau,
   Lieferung prüfen. Erfundene Daten, Sheets im Speicher. Lauf: node tests/t_umpacken_anzahl.js */
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

/* Return Tool mit mehreren Stück pro Zeile (Spalte # = Index 5) */
const rtAnz = (K6, leer5, st) => {
  const m = (id, name, bc, vp, ort, n) => { const z = st(id, name, bc, vp, ort); z[5] = n; z[11] = vp * n; return z; };
  return {
    'Stationär': leer5.concat([K6,
      m('PG-1', 'Seifen-Atelier', '111', 5, 'KID-11', 3),
      m('PG-2', 'Kalaha', '222', 5, 'KID-11', 1),
      m('PG-3', 'Marker', '333', 5, 'KID-11', 7),
      m('PG-4', 'Puppe', '444', 10, 'KID-12', 1),
      m('PG-5', 'Puppe', '444', 10, 'KID-12', 2),
      m('PG-6', 'Fremd', '666', 8, 'KID-13', 1),
      m('PG-7', 'Ball', '777', 4, 'KID-13', 1),
      m('PG-8', 'Leer', '888', 4, 'KID-14', '')]),
    'Archiv Stationär': leer5.concat([K6.concat(['Status', 'Datum', 'Lief-Nr']), m('PG-90', 'Alt', '', 3, 'KID-15', 1)])
  };
};
const verkauf = (name, ab, ort) => ({ name: name, art: 'Verkauf', abnehmer: ab, lagerort: ort, preisregel: 'VP' });
const neu = (opt) => {
  const n = lade(Object.assign({ rt: rtAnz }, opt || {}));
  n.d = n.j(n.c.anlegen({ name: 'U', quelle: 'rt', lagerorte: ['KID-11', 'KID-12'], gebinde: [verkauf('Balu 1', 'Balu', 'BALU1'), lager('Kids 20', 'KID-20')], kuerzel: 'BB' }));
  n.G1 = n.d.gebinde[0].id; n.G2 = n.d.gebinde[1].id;
  n.zu = (ops) => n.j(n.c.zuordnen(n.d.id, ops, 'BB'));
  return n;
};
const spalteW = (DB, n, id, k) => { const t = tab(DB, n); return t.filter(r => r[t[0].indexOf('PG-ID')] === id).map(r => r[t[0].indexOf(k)]); };

test('Anlegen: Anzahl (#) im Bestand, Hinweis für Zeilen mit mehreren Stück', () => {
  const n = neu(), { d, DB } = n;
  assert.strictEqual(d.bestand.find(p => p.id === 'PG-3').anzahl, 7);
  assert.strictEqual(d.bestand.find(p => p.id === 'PG-2').anzahl, 1);
  assert.ok(d.hinweise.some(h => /3 Zeilen mit mehreren Stück \(zusammen 12 Stück\)/.test(h)), JSON.stringify(d.hinweise));
  assert.deepStrictEqual(spalteW(DB, 'Bestand', 'PG-1', 'Anzahl'), ['3']);
  const n2 = lade({ rt: rtAnz }), d2 = n2.j(n2.c.anlegen({ name: 'L', quelle: 'rt', lagerorte: ['KID-14'], gebinde: [lager('X', 'KID-30')] }));
  assert.ok(d2.hinweise.some(h => /leerer oder unplausibler Anzahl, als 1 gezählt: PG-8/.test(h)) && d2.bestand[0].anzahl === 1, JSON.stringify(d2.hinweise));
});

test('dazu: Anzahl wählen, Rest frei, mehr als frei abgelehnt; Wiederholung (sid) bucht nichts doppelt', () => {
  const n = neu();
  let r = n.zu([{ art: 'dazu', id: 'PG-1', gebinde: n.G1, menge: 1, sid: 'a1' }]);
  assert.strictEqual(r.zuordnung['PG-1'].n, 1); assert.strictEqual(r.zuordnung['PG-1'].teile[n.G1].n, 1);
  r = n.zu([{ art: 'dazu', id: 'PG-1', gebinde: n.G1, menge: 1, sid: 'a1' }]);
  assert.ok(r.konflikte[0].gleich && r.zuordnung['PG-1'].n === 1, 'Wiederholung: ' + JSON.stringify(r.konflikte));
  r = n.zu([{ art: 'dazu', id: 'PG-1', gebinde: n.G1, menge: 3, sid: 'a2' }]);
  assert.ok(/nur noch 2 von 3 Stück frei/.test(r.konflikte[0].grund), JSON.stringify(r.konflikte));
  r = n.zu([{ art: 'dazu', id: 'PG-1', gebinde: n.G2, menge: 2, sid: 'a3' }]);
  assert.ok(r.zuordnung['PG-1'].n === 3 && r.zuordnung['PG-1'].teile[n.G2].n === 2, 'auf zwei Kanäle verteilt');
  r = n.zu([{ art: 'dazu', id: 'PG-1', gebinde: n.G2, menge: 1, sid: 'a4' }]);
  assert.ok(/alle 3 Stück schon umgepackt/.test(r.konflikte[0].grund), JSON.stringify(r.konflikte));
  r = n.zu([{ art: 'dazu', id: 'PG-2', gebinde: n.G1, menge: 0, sid: 'a5' }]);
  assert.ok(/Anzahl fehlt/.test(r.konflikte[0].grund));
  /* Stand bleibt nach Neuladen (aus den Zeilen gelesen) */
  const z = n.j(n.c.laden(n.d.id)).zuordnung;
  assert.ok(z['PG-1'].teile[n.G1].n === 1 && z['PG-1'].teile[n.G2].n === 2 && z['PG-1'].n === 3, JSON.stringify(z['PG-1']));
});

test('setzen und verschieben: vorher geprüft, nie mehr als die Anzahl, 0 = entfernen, Preis pro Stück bleibt', () => {
  const n = neu();
  n.zu([{ art: 'dazu', id: 'PG-3', gebinde: n.G2, menge: 4, sid: 's1' }]);
  let r = n.zu([{ art: 'setzen', id: 'PG-3', gebinde: n.G2, anzahl: 5, vorher: 3, sid: 's2' }]);
  assert.ok(/inzwischen geändert/.test(r.konflikte[0].grund) && r.zuordnung['PG-3'].n === 4);
  r = n.zu([{ art: 'setzen', id: 'PG-3', gebinde: n.G2, anzahl: 8, vorher: 4, sid: 's3' }]);
  assert.ok(/mehr als 7 Stück/.test(r.konflikte[0].grund));
  r = n.zu([{ art: 'setzen', id: 'PG-3', gebinde: n.G2, anzahl: 4, vorher: 4, preis: 2.5, sid: 's4' }]);
  assert.strictEqual(r.zuordnung['PG-3'].teile[n.G2].preis, 2.5);
  r = n.zu([{ art: 'verschieben', id: 'PG-3', von: n.G2, gebinde: n.G1, menge: 3, vorher: 4, sid: 's5' }]);
  assert.ok(r.zuordnung['PG-3'].teile[n.G2].n === 1 && r.zuordnung['PG-3'].teile[n.G1].n === 3 && r.zuordnung['PG-3'].teile[n.G2].preis === 2.5, JSON.stringify(r.zuordnung['PG-3']));
  r = n.zu([{ art: 'verschieben', id: 'PG-3', von: n.G2, gebinde: n.G1, menge: 2, vorher: 1, sid: 's6' }]);
  assert.ok(/nur 1 Stück/.test(r.konflikte[0].grund));
  r = n.zu([{ art: 'setzen', id: 'PG-3', gebinde: n.G1, anzahl: 0, vorher: 3, sid: 's7' }, { art: 'setzen', id: 'PG-3', gebinde: n.G2, anzahl: 0, vorher: 1, sid: 's8' }]);
  assert.ok(!r.zuordnung['PG-3'], 'alles entfernt');
  /* Stück mit Anzahl 1: verschieben */
  n.zu([{ art: 'dazu', id: 'PG-2', gebinde: n.G1, menge: 1, sid: 's9' }]);
  r = n.zu([{ art: 'verschieben', id: 'PG-2', von: n.G1, gebinde: n.G2, menge: 1, vorher: 1, sid: 's10' }]);
  assert.ok(r.zuordnung['PG-2'].gebinde === n.G2 && r.zuordnung['PG-2'].n === 1 && !r.zuordnung['PG-2'].teile[n.G1]);
});

test('Barcode mit Anzahl: wählt ein Stück mit genug freien Stück', () => {
  const n = neu();
  let r = n.zu([{ art: 'dazu', code: '444', wunsch: 'PG-4', gebinde: n.G2, menge: 2, sid: 'b1' }]);
  assert.ok(r.ergebnis[0].id === 'PG-5' && r.zuordnung['PG-5'].n === 2 && !r.zuordnung['PG-4'], JSON.stringify(r));
  r = n.zu([{ art: 'dazu', code: '444', wunsch: 'PG-5', gebinde: n.G2, menge: 1, sid: 'b2' }]);
  assert.ok(r.ergebnis[0].id === 'PG-4', 'PG-5 ist voll: PG-4');
  r = n.zu([{ art: 'dazu', code: '444', wunsch: 'PG-5', gebinde: n.G2, menge: 1, sid: 'b3' }]);
  assert.ok(/alle 2 Stücke mit diesem Barcode sind schon zugeordnet/.test(r.konflikte[0].grund), JSON.stringify(r.konflikte));
});

test('Alte Seiten (ohne art) und alte Zeilen (ohne Anzahl): ganzes Stück', () => {
  const n = neu();
  let r = n.zu([{ id: 'PG-1', gebinde: n.G1, vorher: '' }]);
  assert.ok(r.zuordnung['PG-1'].n === 3 && r.zuordnung['PG-1'].teile[n.G1].n === 3, 'altes Verschieben bucht alle 3');
  assert.deepStrictEqual(spalteW(n.DB, 'Zuordnung', 'PG-1', 'Anzahl'), [''], 'Zeile ohne Anzahl');
  r = n.zu([{ id: 'PG-1', gebinde: '', vorher: n.G1 }]);
  assert.ok(!r.zuordnung['PG-1']);
  n.zu([{ art: 'dazu', id: 'PG-3', gebinde: n.G1, menge: 1, sid: 'x' }, { art: 'dazu', id: 'PG-3', gebinde: n.G2, menge: 1, sid: 'y' }]);
  r = n.zu([{ id: 'PG-3', gebinde: n.G1, vorher: n.G1 }]);
  assert.ok(/auf mehrere Gebinde verteilt/.test(r.konflikte[0].grund), 'alter Vorgang auf verteiltes Stück abgelehnt');
});

test('Abschluss: Teilmengen, Rest als «Nicht gefunden», Abnehmer-Liste Stück × Preis', () => {
  const n = neu(), { c, DB, erstellt } = n;
  n.zu([{ art: 'dazu', id: 'PG-1', gebinde: n.G1, menge: 1, sid: '1' },                      // 1 von 3 an Balu
        { art: 'dazu', id: 'PG-2', gebinde: n.G1, menge: 1, sid: '2' },                      // ganz
        { art: 'dazu', id: 'PG-3', gebinde: n.G2, menge: 5, sid: '3' }, { art: 'dazu', id: 'PG-3', gebinde: n.G1, menge: 2, sid: '4' },   // 7 verteilt
        { art: 'dazu', id: 'PG-5', gebinde: n.G2, menge: 2, sid: '5' }]);                    // ganz (2)
  const x = n.j(c.abschliessen(n.d.id, 'BB', true));
  const ae = tab(DB, 'Änderungen'), k = ae[0], z = ae.slice(1).map(r => ({ id: r[k.indexOf('PG-ID')], a: r[k.indexOf('Aktion')], g: r[k.indexOf('Gebinde')], n: r[k.indexOf('Anzahl')], t: r[k.indexOf('Anzahl gesamt')] }));
  const f = (id) => z.filter(r => r.id === id).map(r => r.a + ':' + (r.g || '-') + ':' + r.n + '/' + r.t).sort();
  assert.deepStrictEqual(f('PG-1'), ['Nicht gefunden – prüfen:-:2/3', 'Teilmenge – aufteilen:Balu 1:1/3']);
  assert.deepStrictEqual(f('PG-2'), ['Verkaufen:Balu 1:1/1']);
  assert.deepStrictEqual(f('PG-3'), ['Teilmenge – aufteilen:Balu 1:2/7', 'Teilmenge – aufteilen:Kids 20:5/7']);
  assert.deepStrictEqual(f('PG-5'), ['Lagerort ändern:Kids 20:2/2']);
  assert.deepStrictEqual(f('PG-4'), ['Nicht gefunden – prüfen:-:1/1']);
  assert.ok(x.hinweise.some(h => /2 Teilmengen/.test(h)), JSON.stringify(x.hinweise));
  const liste = erstellt[erstellt.length - 1], balu = liste.getSheetByName('Balu 1').v, total = liste.getSheetByName('Total').v;
  assert.deepStrictEqual(balu[0], ['PG-ID', 'Bezeichnung', 'Barcode', 'Kategorie', 'Gebinde', 'Stück', 'Preis CHF', 'Total CHF']);
  const zeile = id => balu.find(r => r[0] === id);
  assert.deepStrictEqual([zeile('PG-1')[5], zeile('PG-1')[7], zeile('PG-3')[5], zeile('PG-3')[7]], [1, 5, 2, 10]);
  assert.deepStrictEqual(total.find(r => r[0] === 'Total'), ['Total', 4, 20], 'Balu: 1 + 1 + 2 Stück, CHF 20');
  /* Teilmengen belegen den Lagerort, bis sie abgehakt sind */
  assert.ok(c.offeneDurchgaenge_()[n.d.id], 'Teilmengen offen: Durchgang belegt noch');
});

test('Übertrag: Vorschau schreibt nichts, Teilmengen ausgelassen, Anzahl geändert = Abweichung', () => {
  const n = neu(), { c, RT, DB } = n;
  n.zu([{ art: 'dazu', id: 'PG-1', gebinde: n.G1, menge: 1, sid: '1' }, { art: 'dazu', id: 'PG-2', gebinde: n.G1, menge: 1, sid: '2' },
        { art: 'dazu', id: 'PG-5', gebinde: n.G2, menge: 2, sid: '3' }, { art: 'dazu', id: 'PG-4', gebinde: n.G2, menge: 1, sid: '4' }]);
  c.abschliessen(n.d.id, 'BB', true);
  const st = RT.getSheetByName('Stationär').v, ort = id => st.find(r => r[1] === id)[13];
  const v = n.j(c.uebertragenVorschau(n.d.id));
  assert.ok(v.trocken && v.geschrieben === 3 && v.teilmengen.length === 1 && v.teilmengen[0].id === 'PG-1' && v.proZiel.BALU1 === 1 && v.proZiel['KID-20'] === 2, JSON.stringify(v));
  assert.strictEqual(ort('PG-2'), 'KID-11', 'Vorschau: nichts geschrieben');
  assert.ok(!spalteW(DB, 'Änderungen', 'PG-2', 'Erledigt')[0], 'Vorschau: nichts abgehakt');
  st.find(r => r[1] === 'PG-5')[5] = 3;                                     // Anzahl im Return Tool inzwischen geändert
  const x = n.j(c.uebertragen(n.d.id));
  assert.ok(ort('PG-2') === 'BALU1' && ort('PG-4') === 'KID-20' && ort('PG-5') === 'KID-12' && ort('PG-1') === 'KID-11', 'Teilmenge und Abweichung nicht geschrieben');
  assert.ok(x.geschrieben === 2 && x.fehler.length === 1 && /PG-5: Anzahl im Return Tool ist 3, beim Abschluss 2/.test(x.fehler[0]), JSON.stringify(x));
  assert.ok(/automatisch/.test(spalteW(DB, 'Änderungen', 'PG-2', 'Erledigt')[0]) && !spalteW(DB, 'Änderungen', 'PG-1', 'Erledigt').some(String));
});

test('Quelle während des Scans: dazunehmen, Prüfungen, entfernen', () => {
  const n = neu(), { c, j } = n;
  const s0 = n.d.bestandStand;
  assert.throws(() => c.quelleErgaenzen(n.d.id, ['KID-11']), /schon Quelle/);
  assert.throws(() => c.quelleErgaenzen(n.d.id, ['KID-20']), /Kanal dieses Durchgangs|keine Stücke/);
  const d = j(c.quelleErgaenzen(n.d.id, ['KID-13'], 'BB'));
  assert.ok(d.dazu === 2 && d.bestand.some(p => p.id === 'PG-6') && /KID-13/.test(d.lagerorte) && d.bestandStand !== s0, JSON.stringify(d.lagerorte));
  assert.strictEqual(j(c.stand(n.d.id)).bestandStand, d.bestandStand, 'stand meldet den neuen Bestand');
  /* zweiter Durchgang darf KID-13 nicht nehmen (Stücke offen) */
  const d2 = j(c.anlegen({ name: 'Z', quelle: 'rt', lagerorte: ['KID-14'], gebinde: [lager('X', 'KID-31')] }));
  assert.throws(() => c.quelleErgaenzen(d2.id, ['KID-13']), /schon in einem anderen Durchgang/);
  assert.throws(() => c.quelleErgaenzen(d2.id, ['KID-20']), /Kanal im offenen Durchgang U-0001|keine Stücke/);
  /* entfernen: nur ohne Zuordnung */
  n.zu([{ art: 'dazu', id: 'PG-6', gebinde: n.G1, menge: 1, sid: 'q1' }]);
  assert.throws(() => c.quelleEntfernen(n.d.id, 'KID-13'), /schon 1 Stücke zugeordnet/);
  n.zu([{ art: 'setzen', id: 'PG-6', gebinde: n.G1, anzahl: 0, vorher: 1, sid: 'q2' }]);
  const d3 = j(c.quelleEntfernen(n.d.id, 'KID-13', 'BB'));
  assert.ok(!d3.bestand.some(p => p.id === 'PG-6') && !/KID-13/.test(d3.lagerorte), d3.lagerorte);
  assert.ok(tab(n.DB, 'Bestand').some(r => r[0] === n.d.id + ' (entfernt)' && r[1] === 'PG-6'), 'Zeilen bleiben als Verlauf');
  assert.throws(() => c.quelleEntfernen(d2.id, 'KID-14'), /letzte Quelle/);
});

test('Fremder Scan: wo steht das Stück, darf die Palette dazukommen?', () => {
  const n = neu(), { c, j } = n;
  let r = j(c.fremdSuchen(n.d.id, '666'));
  assert.ok(r.treffer.length === 1 && r.treffer[0].ort === 'KID-13' && r.treffer[0].frei && r.treffer[0].anzahl === 2 && r.treffer[0].id === 'PG-6', JSON.stringify(r));
  r = j(c.fremdSuchen(n.d.id, 'pg 6'));
  assert.ok(r.treffer[0].ort === 'KID-13', 'PG-ID als Code');
  assert.strictEqual(j(c.fremdSuchen(n.d.id, '999999')).treffer.length, 0);
  j(c.anlegen({ name: 'Z', quelle: 'rt', lagerorte: ['KID-13'], gebinde: [lager('X', 'KID-31')] }));
  r = j(c.fremdSuchen(n.d.id, '666'));
  assert.ok(!r.treffer[0].frei && /im Durchgang U-0002/.test(r.treffer[0].grund), JSON.stringify(r));
});

test('Lieferung prüfen: leer, offen, unvollständig, vollständig, Abweichung', () => {
  const n = neu(), { c, RT, j } = n;
  n.zu([{ art: 'dazu', id: 'PG-2', gebinde: n.G1, menge: 1, sid: '1' }, { art: 'dazu', id: 'PG-4', gebinde: n.G1, menge: 1, sid: '2' }]);
  c.abschliessen(n.d.id, 'BB', true);
  const L = () => j(c.lieferung(n.d.id)).gebinde.find(g => g.lagerort === 'BALU1');
  assert.strictEqual(L().status, 'leer');
  c.uebertragen(n.d.id);
  let l = L(); assert.ok(l.status === 'offen' && l.erwartetStueck === 2 && l.erwartetTotal === 15, JSON.stringify(l));
  /* Lieferung erstellen nachspielen: PG-2 ins Archiv, PG-4 hängt noch in Stationär */
  const st = RT.getSheetByName('Stationär').v, ar = RT.getSheetByName('Archiv Stationär').v;
  const insArchiv = (id) => { const r = st.find(x => x[1] === id); ar.push(r.slice(0, 14).concat(['VERKAUFT', '26.10.2026', 'STA-1'])); };
  insArchiv('PG-2'); insArchiv('PG-4');
  st.splice(st.findIndex(x => x[1] === 'PG-2'), 1);
  l = L(); assert.ok(l.status === 'unvollstaendig' && l.aktiv.join() === 'PG-4' && /NICHT nochmals starten/.test(l.text), JSON.stringify(l));
  st.splice(st.findIndex(x => x[1] === 'PG-4'), 1);
  l = L(); assert.ok(l.status === 'vollstaendig' && l.stueck === 2 && l.liefNr.join() === 'STA-1' && l.wert === 15, JSON.stringify(l));
  ar[ar.length - 1][5] = 3;                                                 // Anzahl im Archiv falsch (wie heute beim Kalaha)
  l = L(); assert.ok(l.status === 'abweichung' && /Anzahl: PG-4 \(3 statt 1\)/.test(l.text), JSON.stringify(l));
});

console.log(fehler ? fehler + ' Fehler' : 't_umpacken_anzahl ok');
process.exit(fehler ? 1 : 0);
