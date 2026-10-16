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
const k = JSON.parse(JSON.stringify(c.kennzahlenRechnen_(analysen, log, jetzt, [['Trefferquote des Scores'], ['Stufe', 'Infos', 'Bestätigt', 'Korrigiert', 'Trefferquote'], ['Grün', '10', '3', '1', '75%'], ['']])));
const w = k.woche;
assert.strictEqual(w.analysen, 4);
assert.strictEqual(w.schichten, 2);
/* XX: 08:00 (Anmeldung) bis 10:00 = 2 h; YY: 13:00 bis 13:30 = 0.5 h */
assert.strictEqual(w.schichtStunden, 2.5);
assert.strictEqual(w.proSchicht, 2);
assert.strictEqual(w.proStundeBrutto, 1.6);
assert.strictEqual(w.dauer, 12.1);                       // (10+20+12+6.5)/4
assert.strictEqual(w.proStundeNetto, 4.9);               // 60/12.125
assert.strictEqual(w.imBudget, 67);                      // 2 von 3 mit Budget
assert.strictEqual(w.abweichung, -1);                    // (-5+5-3)/3
assert.deepStrictEqual(w.ergebnis, { reuse: 1, ricardo: 1, matchmaker: 1, nicht: 1 });
assert.strictEqual(w.reparatur, 1);
assert.strictEqual(k.vierWochen.analysen, 4);
assert.strictEqual(k.gesamt.analysen, 5);
assert.deepStrictEqual(k.personen.map(function (p) { return [p.name, p.analysen, p.proSchicht]; }), [['XX', 3, 3], ['YY', 1, 1]]);
assert.strictEqual(k.wochen[0].name, '2026-10-12');      // neueste Woche zuerst
assert.strictEqual(k.treffer.length, 1); assert.strictEqual(k.treffer[0].quote, '75%');
assert.strictEqual(k.seit, '01.09.2026');
/* Ohne Anmeldung: Schicht beginnt mit der ersten Analyse */
const ohne = JSON.parse(JSON.stringify(c.kennzahlenRechnen_(analysen.slice(0, 3), [], jetzt, [])));
assert.strictEqual(ohne.woche.schichtStunden, 1.8);     // 08:10 bis 10:00
const leer = JSON.parse(JSON.stringify(c.kennzahlenRechnen_([], [], jetzt, [])));
assert.strictEqual(leer.woche.analysen, 0); assert.strictEqual(leer.woche.imBudget, null);
console.log('t_kennzahlen ok');
