/* Matchmaker nicht verkauft → Ricardo (21.10.2026). Ricardo Tool liest den Tab «Matchmaker», setzt beim Start «Ricardo»; die Analyse räumt im Abgleich auf. Erfundene Daten. */
const vm = require('vm'), fs = require('fs'), assert = require('assert');
/* --- Ricardo Tool --- */
const MM = [['PG-ID', 'Analyse-Nr', 'Bezeichnung', 'EAN', 'Suchauftrag', 'Titel', 'Artikelbeschrieb', 'Zustand', 'Grade', 'Preis CHF', 'Neupreis CHF', 'Versandklasse', 'Versand CHF', 'Foto-Ordner', 'Fotos', 'Kürzel', 'Analysiert am', 'Status'],
  ['PG-1', 'A-000001', 'Toaster', "'7610000000000", 'Toaster gesucht', 'Toaster T1', 'Einleitung\n\nNeupreis: CHF 100.00', 'Gebraucht', 'C', 40, 100, '0-2kg / PostPac B-Post', 9, 'https://drive/1', 4, 'XX', '21.10.2026', 'Offen'],
  ['PG-2', 'A-000002', 'Föhn', '', 'Föhn', 'Föhn F', 'Text', 'Neu und originalverpackt', 'A', 30, 0, '0-2kg / PostPac B-Post', 9, 'https://drive/2', 4, 'XX', '21.10.2026', 'Nicht geklappt'],
  ['PG-3', 'A-000003', 'Lampe', '', 'Lampe', 'Lampe L', 'Text', 'Neu (gemäss Beschreibung)', 'B', 20, 60, '0-2kg / PostPac B-Post', 9, 'https://drive/3', 4, 'XX', '21.10.2026', 'Auf Ricardo']];
const EIN = [['Einstellung', 'Wert'], ['Startpreis A/B % vom Neupreis', 50], ['Startpreis C % vom Neupreis', 35]];
let gesetzt = [];
const blatt = (v) => ({ getLastRow: () => v.length, getLastColumn: () => v[0].length, getDataRange: () => ({ getValues: () => v.map(z => z.slice()) }),
  getRange: (r, c, nr, nc) => ({ getValues: () => [v[r - 1].slice(c - 1, c - 1 + (nc || 1))], getValue: () => v[r - 1][c - 1], setValue: (x) => { gesetzt.push([r, c, x]); v[r - 1][c - 1] = x; } }) });
const ss = { getSheetByName: (n) => n === 'Matchmaker' ? blatt(MM) : (n === 'Einstellungen' ? blatt(EIN) : null) };
const r = { console, JSON, Date, Math, SpreadsheetApp: { openById: () => ss }, Utilities: { formatDate: () => '' } };
vm.createContext(r); vm.runInContext(fs.readFileSync(__dirname + '/../apps/ricardo/Code.gs', 'utf8'), r);
vm.runInContext("cfg_ = function (k) { return { 'Versandsatz': 'Versand nur per Post.', 'Schlusssatz': 'Garantie 30 Tage.' }[k] || ''; }; log_ = function () {}; datum_ = function (d) { return String(d); };", r);
const l = JSON.parse(JSON.stringify(r.leseMatchmaker_(ss)));
assert.deepStrictEqual(l.map(x => x.id), ['PG-1', 'PG-3'], 'nur Offen / Auf Ricardo');
const a = l[0];
assert.strictEqual(a.vp, 35, 'Startpreis C: 35 % vom Neupreis'); assert.strictEqual(l[1].vp, 30, 'Startpreis B: 50 %');
assert.ok(/Versand nur per Post\.\n\nGarantie 30 Tage\.$/.test(a.beschrieb) && a.zustand === 'Gebraucht' && a.mm && a.mmStatus === 'Offen' && a.mmZeile === 2, JSON.stringify(a));
r.mmAufRicardo_(a);
assert.deepStrictEqual(gesetzt, [[2, 18, 'Ricardo']], 'Status beim Start auf Ricardo');
gesetzt = []; r.mmAufRicardo_(l[1]); assert.strictEqual(gesetzt.length, 0, 'schon auf Ricardo: nichts');
gesetzt = []; r.mmAufRicardo_(Object.assign({}, a, { mmStatus: 'Offen', mmZeile: 3 })); assert.strictEqual(gesetzt.length, 0, 'falsche Zeile: nichts schreiben');
/* --- Analyse: Abgleich räumt auf --- */
const c = { console, JSON, Date, Math, Utilities: { formatDate: () => '21.10.2026' } };
vm.createContext(c); vm.runInContext(fs.readFileSync(__dirname + '/../apps/analyse/Code.gs', 'utf8'), c);
const T = { Matchmaker: [{ _r: 2, 'PG-ID': 'PG-1', 'Status': 'Ricardo', 'Suchauftrag': 'Toaster gesucht' }, { _r: 3, 'PG-ID': 'PG-2', 'Status': 'Offen' }],
  Analysen: [{ _r: 5, 'PG-ID': 'PG-1', 'Regal': 'Matchmaker', 'Matchmaker-Auftrag': 'Toaster gesucht', 'Stand': JSON.stringify({ mm: { schluessel: 'k', gesucht: 'Toaster gesucht' } }) }] };
c.SET = []; c.VERM = []; c.T = T;
vm.runInContext("ss_ = function () { return { getSheetByName: function () { return {}; } }; }; lies_ = function (n) { return { z: JSON.parse(JSON.stringify(T[n])) }; }; gesperrt_ = function (f) { return f(); };"
  + " setz_ = function (t, f, w) { SET.push([t, f, w]); }; mmVermerk_ = function (e, mm, text) { VERM.push([mm.schluessel, text]); }; log_ = function () {};", c);
c.mmNachRicardo_({});
const set = JSON.parse(JSON.stringify(c.SET));
assert.deepStrictEqual(set.find(x => x[1] === 'Regal'), ['Analysen', 'Regal', { 5: 'Ricardo Offline' }]);
assert.ok(/nicht verkauft, Ricardo 21\.10\.2026$/.test(set.find(x => x[1] === 'Matchmaker-Auftrag')[2][5]));
assert.deepStrictEqual(set.find(x => x[0] === 'Matchmaker'), ['Matchmaker', 'Status', { 2: 'Auf Ricardo' }]);
assert.ok(c.VERM.length === 1 && c.VERM[0][0] === 'k' && /nicht verkauft, jetzt auf Ricardo/.test(c.VERM[0][1]));
console.log('t_mm_ricardo ok');
