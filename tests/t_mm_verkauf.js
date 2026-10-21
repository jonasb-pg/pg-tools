/* Matchmaker wie Ricardo (21.10.2026): gleiche Prüfung, Preis = VP, eigener Schlusssatz. Erfundene Daten. Lauf: node tests/t_mm_verkauf.js */
const vm = require('vm'), fs = require('fs'), assert = require('assert');
const c = { console, Utilities: { formatDate: () => '' } };
vm.createContext(c); vm.runInContext(fs.readFileSync(__dirname + '/../apps/analyse/Code.gs', 'utf8'), c);
vm.runInContext("fotoStand = function () { return { liste: [1, 2, 3, 4], zahl: { hauptbild: 1, weitere: 2, typenschild: 1, mangel: 0 }, ordner: 'https://drive/o' }; }; fotoFehlt_ = function () { return []; };", c);
const u = { ricardo: { versand: [{ name: '0-2kg', preis: 9 }] } }, x = { grade: 'C', reusable: true }, e = { 'Startpreis C % vom Neupreis': 35 };
const p = { 'PG-ID': 'PG-1', 'Bezeichnung': 'Toaster', 'Barcode': '7610000000000', 'Neupreis CHF': 100, 'VP CHF': 40 };
const d = { ricardo: { titel: 'Toaster T1', beschrieb: 'Text', versand: '0-2kg', preis: '' }, maengel: '' };
const m = JSON.parse(JSON.stringify(c.verkaufPruefen_(d, u, x, e, p, 'matchmaker')));
assert.strictEqual(m['Preis CHF'], 40, 'Matchmaker: Preis = VP');
assert.strictEqual(m['Zustand'], 'Gebraucht'); assert.strictEqual(m['Foto-Ordner'], 'https://drive/o'); assert.strictEqual(m['Versand CHF'], 9);
assert.ok(!('Startpreis CHF' in m) && !('Ricardo-Zustand' in m));
const r = JSON.parse(JSON.stringify(c.ricardoPruefen_(d, u, x, e, p)));
assert.strictEqual(r['Startpreis CHF'], 35, 'Ricardo: 35 % vom Neupreis'); assert.strictEqual(r['Ricardo-Zustand'], 'Gebraucht');
const m2 = c.verkaufPruefen_({ ricardo: Object.assign({}, d.ricardo, { preis: '55' }), maengel: '' }, u, x, e, p, 'matchmaker');
assert.strictEqual(m2['Preis CHF'], 55, 'Preis von Hand');
assert.throws(() => c.verkaufPruefen_({ ricardo: { titel: 'T', beschrieb: '', versand: '0-2kg' } }, u, x, e, p, 'matchmaker'), /Der Artikelbeschrieb fehlt/);
assert.throws(() => c.verkaufPruefen_({ ricardo: { titel: 'T', beschrieb: 'b', versand: '' } }, u, x, e, p, 'matchmaker'), /Versandklasse/);
/* Schluss: Ricardo mit Auktions-Sätzen, Matchmaker mit eigenem (leer = keiner) */
const ein = { 'Ricardo-Versandsatz': 'Nur Post.', 'Ricardo-Schlusssatz': 'Bei unseren Auktionen …', 'Matchmaker-Schlusssatz': '' };
const tr = c.ricardoBeschrieb_('Einleitung', ['A'], ['Das Produkt ist gebraucht.', '', ''], 100, ein, false);
const tm = c.ricardoBeschrieb_('Einleitung', ['A'], ['Das Produkt ist gebraucht.', '', ''], 100, ein, true);
assert.ok(/Auktionen/.test(tr) && /Nur Post/.test(tr));
assert.ok(!/Auktionen|Nur Post/.test(tm) && /Neupreis: CHF 100.00$/.test(tm), tm);
assert.ok(/Garantie 30 Tage$/.test(c.ricardoBeschrieb_('E', [], ['x', '', ''], 0, Object.assign({}, ein, { 'Matchmaker-Schlusssatz': 'Garantie 30 Tage' }), true)));
assert.ok(vm.runInContext("MATCHMAKER_KOPF.indexOf('Suchauftrag') > -1 && MATCHMAKER_KOPF.indexOf('Preis CHF') > -1", c));
console.log('t_mm_verkauf ok');
