/* Ricardo Tool: Auswertung der Post-Adressprüfung. Erfundene Adressen. */
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const c = { console: console };
vm.createContext(c); vm.runInContext(fs.readFileSync(__dirname + '/../apps/ricardo/Code.gs', 'utf8'), c);
const e = { strasse: 'Testweg', nr: '1', plz: '3000', ort: 'Bern' };
const antwort = function (strasse, nr, plz, ort) { return { quality: 'CERTIFIED', address: { geographicLocation: { house: { street: strasse, houseNumber: nr }, zip: { zip: plz, city: ort } } } }; };
assert.strictEqual(c.adresseAuswerten_(200, antwort('Testweg', '1', '3000', 'Bern'), e).stand, 'ok');
assert.strictEqual(c.adresseAuswerten_(200, antwort('testweg', '1', '3000', 'BERN'), e).stand, 'ok', 'Gross/klein egal');
assert.strictEqual(c.adresseAuswerten_(200, antwort('Teststrasse', '1', '3000', 'Bern'), { strasse: 'Teststr.', nr: '1', plz: '3000', ort: 'Bern' }).stand, 'ok', 'str. = strasse');
const v = c.adresseAuswerten_(200, antwort('Testweg', '1', '3005', 'Bern'), e);
assert.strictEqual(v.stand, 'vorschlag'); assert.strictEqual(v.vorschlag.plz, '3005');
assert.strictEqual(c.adresseAuswerten_(400, null, e).stand, 'unbekannt');
assert.strictEqual(c.adresseAuswerten_(200, { quality: 'X', address: {} }, e).stand, 'unbekannt');
assert.strictEqual(c.adresseAuswerten_(500, null, e).stand, 'fehler');
const a = JSON.parse(JSON.stringify(c.adresseAnfrage_({ vorname: 'Testa', nachname: 'Muster', strasse: 'Testweg', nr: '1', plz: '3000', ort: 'Bern' })));
assert.deepStrictEqual(a.geographicLocation, { house: { street: 'Testweg', houseNumber: '1' }, zip: { zip: '3000', city: 'Bern' } });
console.log('t_ricardo_adresse ok');
