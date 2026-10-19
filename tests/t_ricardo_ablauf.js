/* Ricardo Tool: Bank-Abgleich und Post-Produkt (Abläufe). Erfundene Daten, keine echten Personen. */
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const c = { console: console };
vm.createContext(c); vm.runInContext(fs.readFileSync(__dirname + '/../apps/ricardo/Code.gs', 'utf8'), c);
const D = function (t) { return vm.runInContext('new Date(Date.UTC(2026, 9, ' + t + ', 12))', c); };
const V = function (nr, art, total, status, nachname, bezahlt) {
  return { 'Verkauf-Nr': nr, 'Artikel-Nr': art, 'PG-ID': 'PG-' + nr.slice(-3), 'Titel': 'Test ' + nr, 'Total CHF': total, 'Status': status, 'Nachname': nachname, 'Vorname': 'Testa', 'Käufer': 'nick' + nr.slice(-2), 'Bezahlt am': bezahlt || '' };
};
const vs = [
  V('50000001', '1300000001', 58, 'Wartet auf Zahlung', 'Muster'),
  V('50000002', '1300000002', 91, 'Zu packen', 'Beispiel'),
  V('50000003', '1300000003', 40, 'Wartet auf Zahlung', 'Hügli'),
  V('50000004', '1300000004', 25, 'Wartet auf Zahlung', 'Probe'),
  V('50000005', '1300000005', 30, 'Bezahlt und versendet', 'Fertig', D(10)),
  V('50000006', '1300000006', 30, 'Storniert', 'Weg')
];
const r = JSON.parse(JSON.stringify(c.bankAbgleichRechnen_([
  { datum: '2026-10-16', text: 'GUTSCHRIFT T. MUSTER 3000 BERN MITTEILUNG 1300000001', betrag: 58, auftrag: 'A1' },        // sicher
  { datum: '2026-10-17', text: 'Ricardo 50000002 Beispiel', betrag: 90, auftrag: 'A2' },                                // Nummer, Betrag anders
  { datum: '2026-10-17', text: 'HUEGLI TESTA, WEG 1, 3000 BERN', betrag: 40, auftrag: 'A3' },                            // Name: Hügli im Sheet, HUEGLI in der Bank
  { datum: '2026-10-17', text: 'TESTA PROBE ZUERICH', betrag: 25, auftrag: 'A4' },                                      // Name und Betrag
  { datum: '2026-10-17', text: 'Zahlung 1300000005', betrag: 30, auftrag: 'A5' },                                       // schon bezahlt
  { datum: '2026-10-17', text: 'Zahlung 1300000006', betrag: 30, auftrag: 'A6' },                                       // storniert: kein Treffer
  { datum: '2026-10-17', text: 'Belastung', betrag: -12, auftrag: 'A7' }
], vs)));
assert.deepStrictEqual(r.sicher.map(function (x) { return x.nr; }), ['50000001']);
assert.strictEqual(r.sicher[0].bank.betrag, '58.00');
assert.deepStrictEqual(r.unsicher.map(function (x) { return x.nr; }).sort(), ['50000002', '50000003', '50000004']);
assert.ok(/Betrag weicht ab/.test(r.unsicher.filter(function (x) { return x.nr === '50000002'; })[0].grund));
assert.strictEqual(r.schonErfasst, 1);
assert.strictEqual(r.gutschriften, 6);
/* Ein Verkauf wird nie zwei Gutschriften zugeordnet */
const r2 = c.bankAbgleichRechnen_([{ datum: '2026-10-16', text: '1300000001', betrag: 58 }, { datum: '2026-10-17', text: '1300000001', betrag: 58 }], vs);
assert.strictEqual(r2.sicher.length, 1);
/* Post-Produkt */
assert.deepStrictEqual(Array.from(c.przl_('Paket B-Post PostPac B-Post bis 2 kg')), ['ECO']);
assert.deepStrictEqual(Array.from(c.przl_('Paket A-Post ')), ['PRI']);
assert.deepStrictEqual(Array.from(c.przl_('Paket B-Post Sperrgut B-Post bis 30 kg')), ['ECO', 'SP']);
assert.strictEqual(c.artikelAusLink_('https://www.ricardo.ch/de/a/neu-teufel-real-blue-nc-3-1332227154/'), '1332227154');
console.log('t_ricardo_ablauf ok');
