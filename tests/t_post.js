/* Ricardo Tool: Anfrage an die Barcode API der Post (ohne Netz). Erfundene Adresse. */
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const c = { console: console, Utilities: { formatDate: function () { return ''; } } };
vm.createContext(c); vm.runInContext(fs.readFileSync(__dirname + '/../apps/ricardo/Code.gs', 'utf8'), c);
vm.runInContext("CFG = { 'Post Frankierlizenz': '11112222', 'Post Absender': 'Firma AG, Musterweg 1, 3000, Bern' };", c);
const a = JSON.parse(JSON.stringify(c.postAnfrage_({ id: 'V-1', vorname: 'Eva', nachname: 'Muster', strasse: 'Testgasse', nr: '5a', plz: 3011, ort: 'Bern', przl: 'PRI', gramm: 1234.4 }, true)));
assert.strictEqual(a.frankingLicense, '11112222');
assert.deepStrictEqual(a.customer, { name1: 'Firma AG', street: 'Musterweg 1', zip: '3000', city: 'Bern', country: 'CH' });
/* Prüfung 24.10.2026, E1: Standard ist ZPL für den Etikettendrucker (200 dpi); Einstellung «Etiketten-Format» = PDF wie bisher */
assert.deepStrictEqual(a.labelDefinition, { labelLayout: 'A6', printAddresses: 'RECIPIENT_AND_CUSTOMER', imageFileType: 'ZPL2', imageResolution: 200, printPreview: true });
vm.runInContext("CFG['Etiketten-Format'] = 'PDF';", c);
assert.deepStrictEqual(JSON.parse(JSON.stringify(c.postAnfrage_({ id: 'V-1', nachname: 'Muster', plz: 3011, ort: 'Bern' }, false))).labelDefinition,
  { labelLayout: 'A6', printAddresses: 'RECIPIENT_AND_CUSTOMER', imageFileType: 'PDF', imageResolution: 300, printPreview: false });
vm.runInContext("delete CFG['Etiketten-Format'];", c);
assert.deepStrictEqual(a.item.recipient, { name1: 'Muster', firstName: 'Eva', street: 'Testgasse', houseNo: '5a', zip: '3011', city: 'Bern', country: 'CH' });
assert.deepStrictEqual(a.item.attributes, { przl: ['PRI'], weight: 1234 });
/* Firma ohne Person: Firma in name1 */
const f = JSON.parse(JSON.stringify(c.postAnfrage_({ id: 'V-2', firma: 'Laden GmbH', postfach: '12', plz: '8000', ort: 'Zürich' }, false)));
assert.strictEqual(f.item.recipient.name1, 'Laden GmbH'); assert.strictEqual(f.item.recipient.pobox, '12'); assert.deepStrictEqual(f.item.attributes, { przl: ['ECO'] });
console.log('t_post ok');
