/* Kennzahlen: Zeitbudget, Schicht (Anmeldung bis letzte Analyse), pro Stunde, Ergebnis mit Matchmaker. Erfundene Kürzel. */
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const c = { console: console, Utilities: { formatDate: function () { return ''; } } };
vm.createContext(c); vm.runInContext(fs.readFileSync(__dirname + '/../apps/analyse/Code.gs', 'utf8'), c);
const A = function (k, start, ende, dauer, budget, regal, reusable, extra) {
  return Object.assign({ 'Kürzel': k, 'Start': start, 'Ende': ende, 'Dauer Min': dauer, 'Zeitbudget Min': budget, 'Regal': regal, 'Reusable': reusable, 'Stufe': 'S1', 'Kategorie': 'Home' }, extra || {});
};
const analysen = [
  A('XX', '14.10.2026 08:10:00', '14.10.2026 08:20:00', 10, 15, 'Analysiert', 'Ja'),
  A('XX', '14.10.2026 08:25:00', '14.10.2026 08:45:00', 20, 15, 'Matchmaker', 'Ja'),
  A('XX', '14.10.2026 09:00:00', '14.10.2026 10:00:00', 12, 15, 'Ricardo Offline', 'Ja', { 'Reparatur (Beschrieb)': 'Akku' }),
  A('YY', '15.10.2026 13:00:00', '15.10.2026 13:30:00', '6,5', '', '', 'Nein'),
  A('XX', '01.09.2026 09:00:00', '01.09.2026 09:10:00', 10, 10, 'Analysiert', 'Ja')        // älter als 4 Wochen
];
const log = [
  { 'Aktion': 'Anmelden', 'Zeit': '14.10.2026 08:00:00', 'Detail': 'XX' },
  { 'Aktion': 'Anmelden', 'Zeit': '14.10.2026 09:30:00', 'Detail': 'XX' },       // zweite Anmeldung zählt nicht
  { 'Aktion': 'Anmelden', 'Zeit': '13.10.2026 08:00:00', 'Detail': 'YY' }        // anderer Tag ohne Analyse
];
const jetzt = Date.UTC(2026, 9, 16, 12, 0, 0);
const R = function (von, bis, an, lg) { return JSON.parse(JSON.stringify(c.kennzahlenRechnen_(an || analysen, lg || log, jetzt, von, bis))); };
/* Woche 12.–18.10.2026 */
const k = R('2026-10-12', '2026-10-18'), w = k.zeitraum;
assert.strictEqual(k.einheit, 'tag');
assert.strictEqual(w.analysen, 4);
assert.strictEqual(w.schichten, 2);
/* XX: 08:00 (Anmeldung) bis 10:00 = 2 h; YY: 13:00 bis 13:30 = 0.5 h */
assert.strictEqual(w.schichtStunden, 2.5);
assert.strictEqual(w.proSchicht, 2);
assert.strictEqual(w.proStundeBrutto, 1.6);
assert.strictEqual(w.dauer, 12.1);                       // (10+20+12+6.5)/4
assert.strictEqual(w.imBudget, 67);                      // 2 von 3 mit Budget
assert.deepStrictEqual(w.ergebnis, { reuse: 1, ricardo: 1, matchmaker: 1, nicht: 1 });
assert.deepStrictEqual(k.verlauf.map(function (x) { return [x.name, x.analysen]; }), [['2026-10-14', 3], ['2026-10-15', 1]]);
assert.deepStrictEqual(k.personen.map(function (p) { return [p.name, p.analysen]; }), [['XX', 3], ['YY', 1]]);
/* Ganzer Zeitraum: von leer = ab erster Analyse, Verlauf pro Woche */
const g = R('', '');
assert.strictEqual(g.zeitraum.analysen, 5); assert.strictEqual(g.von, '2026-09-01'); assert.strictEqual(g.bis, '2026-10-16');
assert.strictEqual(g.einheit, 'woche'); assert.deepStrictEqual(g.verlauf.map(function (x) { return x.name; }), ['2026-08-31', '2026-10-12']);
assert.strictEqual(g.seit, '01.09.2026');
/* Monat September: nur die alte Analyse */
assert.strictEqual(R('2026-09-01', '2026-09-30').zeitraum.analysen, 1);
/* Langer Zeitraum: pro Monat */
const j = R('2026-01-01', '2026-12-31'); assert.strictEqual(j.einheit, 'monat'); assert.deepStrictEqual(j.verlauf.map(function (x) { return x.name; }), ['2026-09', '2026-10']);
/* Ohne Anmeldung: Schicht beginnt mit der ersten Analyse */
assert.strictEqual(R('2026-10-12', '2026-10-18', analysen.slice(0, 3), []).zeitraum.schichtStunden, 1.8);     // 08:10 bis 10:00
const leer = R('2026-10-12', '2026-10-18', [], []);
assert.strictEqual(leer.zeitraum.analysen, 0); assert.strictEqual(leer.zeitraum.imBudget, null);
console.log('t_kennzahlen ok');
