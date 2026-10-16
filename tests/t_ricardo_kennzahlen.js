/* Ricardo Tool: Kennzahlen (Verkäufe, Quote, Tage, Retouren, Preisvorschläge, Jetzt). Erfundene Daten. */
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
  { 'Status': 'Versendet', 'Gelistet am': D(5), 'Verkauft am': D(12) },
  { 'Status': 'Verkauft', 'Gelistet am': D(10), 'Verkauft am': D(14) },
  { 'Status': 'Unverkauft', 'Gelistet am': D(6) },
  { 'Status': 'Gelistet', 'Gelistet am': D(15) }
];
const verkaeufe = [
  { 'Verkauf-Nr': '1', 'Verkauft am': D(12), 'Status': 'Versendet', 'Preis CHF': 40, 'Auszahlung CHF': 35, 'Bezahlt und versendet am': D(14) },
  { 'Verkauf-Nr': '2', 'Verkauft am': D(14), 'Status': 'Wartet auf Zahlung', 'Preis CHF': 60, 'Auszahlung CHF': 52 },
  { 'Verkauf-Nr': '3', 'Verkauft am': D(13), 'Status': 'Storniert', 'Preis CHF': 99, 'Auszahlung CHF': 90 },
  { 'Verkauf-Nr': '4', 'Verkauft am': D(16), 'Status': 'Zu packen', 'Preis CHF': 20, 'Auszahlung CHF': 17 }
];
const retouren = [{ 'Eröffnet am': D(15) }];
const post = [{ 'Art': 'Preisvorschlag', 'Eingang': D(15) }, { 'Art': 'Frage', 'Eingang': D(15) }];
const k = JSON.parse(JSON.stringify(c.kennzahlenRechnen_(listings, verkaeufe, retouren, post, D(17).getTime(), 3)));
const w = k.woche;                      // Woche ab Montag 12.10.
assert.strictEqual(w.verkaeufe, 3); assert.strictEqual(w.storniert, 1);
assert.strictEqual(w.umsatz, 120); assert.strictEqual(w.auszahlung, 104); assert.strictEqual(w.schnitt, 40);
assert.strictEqual(w.verkaufsquote, 100);          // Unverkauft wurde in der Vorwoche gelistet
assert.strictEqual(k.vierWochen.verkaufsquote, 67); // 2 verkauft, 1 unverkauft
assert.strictEqual(w.tageBisVerkauf, 5.5);          // (7 + 4) / 2
assert.strictEqual(w.tageBisVersand, 2);
assert.strictEqual(w.retouren, 1); assert.strictEqual(w.retourenquote, 33);
assert.strictEqual(w.preisvorschlaege, 1);
assert.deepStrictEqual(k.jetzt, { gelistet: 1, zuPacken: 1, zahlungOffen: 1, zahlTage: 3 });   // Nr. 2 seit 3 Tagen offen, Nr. 4 erst seit 1 Tag
assert.strictEqual(k.wochen.length, 1); assert.strictEqual(k.wochen[0].name, '2026-10-12'); assert.strictEqual(k.wochen[0].verkaeufe, 3);
assert.strictEqual(k.seit, '12.10.2026');
const leer = JSON.parse(JSON.stringify(c.kennzahlenRechnen_([], [], [], [], D(17).getTime(), 3)));
assert.strictEqual(leer.woche.verkaeufe, 0); assert.strictEqual(leer.woche.verkaufsquote, null);
console.log('t_ricardo_kennzahlen ok');
