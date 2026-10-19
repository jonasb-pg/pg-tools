/* Ricardo Tool: Kennzahlen pro Zeitraum (Umsatz, Auszahlung, Verkaufsquote, Grade, Verlauf) und Jetzt. Erfundene Daten. */
const fs = require('fs'), vm = require('vm'), assert = require('assert');
/* formatDate mit Zeitzone UTC genügt hier: Die Testdaten liegen mittags */
const fmt = function (d, tz, f) {
  const p = function (n) { return ('0' + n).slice(-2); };
  if (f === 'u') return String(d.getUTCDay() || 7);
  if (f === 'yyyy-MM-dd') return d.getUTCFullYear() + '-' + p(d.getUTCMonth() + 1) + '-' + p(d.getUTCDate());
  return p(d.getUTCDate()) + '.' + p(d.getUTCMonth() + 1) + '.' + d.getUTCFullYear();
};
const c = { console: console, Utilities: { formatDate: fmt } };
vm.createContext(c); vm.runInContext(fs.readFileSync(__dirname + '/../apps/ricardo/Code.gs', 'utf8'), c);
const D = function (t) { return vm.runInContext("new Date(Date.UTC(2026, 9, " + t + ", 12))", c); };   // t = Tag im Oktober 2026, als Datum des Script-Kontexts (instanceof Date)
const listings = [
  { 'PG-ID': 'P1', 'Status': 'Versendet', 'Gelistet am': D(5), 'Verkauft am': D(12), 'Zustand': 'Neu und originalverpackt', 'Neupreis CHF': 80 },
  { 'PG-ID': 'P2', 'Status': 'Verkauft', 'Gelistet am': D(10), 'Verkauft am': D(14), 'Zustand': 'Gebraucht', 'Neupreis CHF': 200 },
  { 'PG-ID': 'P3', 'Status': 'Unverkauft', 'Gelistet am': D(6), 'Zustand': 'Gebraucht' },
  { 'PG-ID': 'P4', 'Status': 'Gelistet', 'Gelistet am': D(15), 'Zustand': 'Neu (gemäss Beschreibung)' }
];
const verkaeufe = [
  { 'Verkauf-Nr': '1', 'PG-ID': 'P1', 'Verkauft am': D(12), 'Status': 'Versendet', 'Preis CHF': 40, 'Auszahlung CHF': 35, 'Bezahlt und versendet am': D(14) },
  { 'Verkauf-Nr': '2', 'PG-ID': 'P2', 'Verkauft am': D(14), 'Status': 'Wartet auf Zahlung', 'Preis CHF': 60, 'Auszahlung CHF': 52 },
  { 'Verkauf-Nr': '3', 'Verkauft am': D(13), 'Status': 'Storniert', 'Preis CHF': 99, 'Auszahlung CHF': 90 },
  { 'Verkauf-Nr': '4', 'Verkauft am': D(16), 'Status': 'Zu packen', 'Preis CHF': 20, 'Auszahlung CHF': 17 }
];
const retouren = [{ 'Eröffnet am': D(15) }];
const R = function (von, bis) { return JSON.parse(JSON.stringify(c.kennzahlenRechnen_(listings, verkaeufe, retouren, D(17).getTime(), von, bis, 6, D(16).getTime()))); };
/* Woche 12.–18.10. (KW 42) */
const k = R('2026-10-12', '2026-10-18'), w = k.zeitraum;
assert.strictEqual(k.einheit, 'tag');
assert.strictEqual(w.verkaeufe, 3); assert.strictEqual(w.storniert, 1);
assert.strictEqual(w.umsatz, 120); assert.strictEqual(w.auszahlung, 104); assert.strictEqual(w.schnitt, 40);   // ohne Porto, ohne Storno
assert.strictEqual(w.vomNeupreis, 40);                 // (40/80 + 60/200) / 2
assert.strictEqual(w.angeboten, 1); assert.strictEqual(w.laufend, 1); assert.strictEqual(w.verkaufsquote, null);
assert.strictEqual(w.retouren, 1); assert.strictEqual(w.retourenquote, 33);
/* Ganzer Zeitraum: 4 angeboten, 2 verkauft, 1 nicht, 1 läuft */
const g = R('', '');
assert.strictEqual(g.von, '2026-10-05'); assert.strictEqual(g.bis, '2026-10-17'); assert.strictEqual(g.seit, '05.10.2026'); assert.strictEqual(g.einheit, 'woche');
const z = g.zeitraum;
assert.deepStrictEqual([z.angeboten, z.verkauft, z.nichtVerkauft, z.laufend, z.verkaufsquote], [4, 2, 1, 1, 67]);
assert.deepStrictEqual(g.grades.map(function (x) { return [x.grade, x.angeboten, x.anteil, x.verkauft, x.nichtVerkauft, x.verkaufsquote, x.vomNeupreis]; }),
  [['A', 1, 25, 1, 0, 100, 50], ['B', 1, 25, 0, 0, null, null], ['C', 2, 50, 1, 1, 50, 30]]);
assert.deepStrictEqual(g.verlauf.map(function (x) { return [x.name, x.verkaeufe, x.angeboten]; }), [['2026-10-05', 0, 3], ['2026-10-12', 3, 1]]);
/* Monat September: leer */
const sep = R('2026-09-01', '2026-09-30'); assert.strictEqual(sep.zeitraum.verkaeufe, 0); assert.strictEqual(sep.verlauf.length, 0); assert.strictEqual(sep.einheit, 'woche');
/* Jetzt (Reiter Betrieb) */
assert.deepStrictEqual(JSON.parse(JSON.stringify(c.jetztR_(listings, verkaeufe, D(17).getTime(), 3))), { gelistet: 1, zuPacken: 1, zahlungOffen: 1, zahlTage: 3 });   // Nr. 2 seit 3 Tagen offen, Nr. 4 erst seit 1 Tag
const leer = JSON.parse(JSON.stringify(c.kennzahlenRechnen_([], [], [], D(17).getTime(), '', '')));
assert.strictEqual(leer.zeitraum.verkaeufe, 0); assert.strictEqual(leer.zeitraum.verkaufsquote, null);
/* Abgelaufen ohne Mail «nicht verkauft» (Fehler 17.10.2026): nach dem Verkaufsbericht nicht verkauft, vorher offen */
const ab = [{ 'PG-ID': 'P9', 'Status': 'Gelistet', 'Gelistet am': D(9), 'Zustand': 'Gebraucht' }, { 'PG-ID': 'P10', 'Status': 'Gelistet', 'Gelistet am': D(12), 'Zustand': 'Gebraucht' }];
const mit = JSON.parse(JSON.stringify(c.kennzahlenRechnen_(ab, [], [], D(17).getTime(), '', '', 6, D(16).getTime()))).zeitraum;
assert.deepStrictEqual([mit.nichtVerkauft, mit.laufend, mit.berichtFehlt], [1, 1, 0]);
const ohne = JSON.parse(JSON.stringify(c.kennzahlenRechnen_(ab, [], [], D(17).getTime(), '', '', 6, D(14).getTime()))).zeitraum;
assert.deepStrictEqual([ohne.nichtVerkauft, ohne.laufend, ohne.berichtFehlt], [0, 1, 1]);
/* Beim Einlesen des Verkaufsberichts: abgelaufene «Gelistet» werden «Unverkauft» */
const LC = vm.runInContext('L_COLS', c), zeile = function (st, g) { const r = LC.map(function () { return ''; }); r[LC.indexOf('Status')] = st; r[LC.indexOf('Gelistet am')] = g; return r; };
assert.deepStrictEqual(Array.from(c.abgelaufen_([zeile('Gelistet', D(9)), zeile('Gelistet', D(12)), zeile('Verkauft', D(9)), zeile('Gelistet', '')], D(17).getTime(), 6)), [0]);
console.log('t_ricardo_kennzahlen ok');
