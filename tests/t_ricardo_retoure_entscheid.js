/* Ricardo Tool: Retoure schliesst erst nach Rückzahlung, Ricardo-Storno und Entscheid fürs Stück. Erfundene Daten. */
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const c = { console: console, LockService: { getScriptLock: function () { return { waitLock: function () {}, releaseLock: function () {} }; } } };
vm.createContext(c); vm.runInContext(fs.readFileSync(__dirname + '/../apps/ricardo/Code.gs', 'utf8'), c);
const R = vm.runInContext('R_COLS', c);
let rzeile, listing, geschrieben = 0;
const neu = function (pg) {
  rzeile = {}; R.forEach(function (k) { rzeile[k] = ''; });
  Object.assign(rzeile, { 'Retoure-Nr': 'RT-0001', 'Status': 'Offen', 'PG-ID': pg, 'IBAN': 'CH00 TEST', 'Adresse': 'Testweg 1', 'Preis CHF': 40, 'Versand CHF': 9, _zeile: 2 });
  listing = { 'PG-ID': pg, 'Status': 'Retourniert', 'Entscheid unverkauft': '' };
};
c.SpreadsheetApp = { getActive: function () { return { getSheetByName: function () { return { getRange: function () { return { setValues: function (v) { geschrieben++; R.forEach(function (k, j) { rzeile[k] = v[0][j]; }); } }; } }; } }; } };
c.rZeilen_ = function () { return [rzeile]; };
c.findeZeile_ = function () { return 5; };
c.zeileZuRec_ = function () { return Object.assign({}, listing); };
c.schreibe_ = function (sh, z, rec) { listing = rec; };
c.nutzer_ = function () { return 'test@pretty-good.ch'; };
c.log_ = function () {};
c.retouren = function () { return { ok: true }; };
assert.strictEqual(R[R.length - 1], 'Entscheid');

neu('PG-2001');
c.retoureSchritt('RT-0001', 'rueckzahlung', '49');
c.retoureSchritt('RT-0001', 'ricardo', '');
assert.strictEqual(rzeile['Status'], 'Offen', 'ohne Entscheid noch offen');
assert.strictEqual(listing['Status'], 'Retourniert');
assert.throws(function () { c.retoureSchritt('RT-0001', 'entscheid', 'Verschenken'); }, /Unbekannter Entscheid/);
c.retoureSchritt('RT-0001', 'entscheid', 'Neu listen');
assert.strictEqual(rzeile['Status'], 'Abgeschlossen');
assert.strictEqual(listing['Status'], 'Bereit', 'Neu listen bringt das Stück ins Listing');
assert.strictEqual(listing['Entscheid unverkauft'], 'Neu listen');
assert.throws(function () { c.retoureSchritt('RT-0001', 'entscheid', 'Entsorgung'); }, /bereits abgeschlossen/);

neu('PG-2002');
c.retoureSchritt('RT-0001', 'entscheid', 'Entsorgung');   // Entscheid zuerst geht auch
assert.strictEqual(rzeile['Status'], 'Offen');
c.retoureSchritt('RT-0001', 'ricardo', '');
c.retoureSchritt('RT-0001', 'rueckzahlung', '20');
assert.strictEqual(rzeile['Status'], 'Abgeschlossen');
assert.strictEqual(listing['Status'], 'Retour abgeschlossen');
assert.strictEqual(listing['Entscheid unverkauft'], 'Entsorgung');
assert.strictEqual(rzeile['IBAN'], '');
console.log('t_ricardo_retoure_entscheid ok');
