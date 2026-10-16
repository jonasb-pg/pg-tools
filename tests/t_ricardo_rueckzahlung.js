/* Ricardo Tool: Mail an die Buchhaltung bei einer neuen Retoure (Adresse aus «Rückzahlungen an»). Erfundene Daten. */
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const mails = [], logs = [];
const c = { console: console, Utilities: { formatDate: function () { return ''; } }, MailApp: { sendEmail: function (m) { if (m.to === 'kaputt@x.ch') throw new Error('Limit'); mails.push(m); } } };
vm.createContext(c); vm.runInContext(fs.readFileSync(__dirname + '/../apps/ricardo/Code.gs', 'utf8'), c);
let an = 'invoice@pretty-good.ch';
c.cfg_ = function (n) { return n === 'Rückzahlungen an' ? an : ''; };
c.log_ = function (a, id, d) { logs.push([a, id, d]); };
const r = { 'Retoure-Nr': 'RT-0007', 'PG-ID': 'PG-1001', 'Titel': 'Testgerät A', 'Name': 'Vera Muster', 'Käufer': 'vmuster', 'Adresse': 'Testweg 1', 'PLZ': '3000', 'Ort': 'Bern',
  'IBAN': 'CH00 TEST', 'Preis CHF': 40, 'Versand CHF': 9, 'Verkauf-Nr': '555', 'Grund': 'Defekt', 'Notiz': '' };
let x = JSON.parse(JSON.stringify(c.rueckzahlungMail_(r)));
assert.deepStrictEqual(x, { ok: true, an: 'invoice@pretty-good.ch' });
const m = mails[0];
assert.strictEqual(m.to, 'invoice@pretty-good.ch');
assert.ok(/RT-0007 · PG-1001 · CHF 49\.00/.test(m.subject), m.subject);
['PG-ID: PG-1001', 'Produkt: Testgerät A', 'Name: Vera Muster', 'Adresse: Testweg 1, 3000 Bern', 'IBAN: CH00 TEST', 'Betrag: CHF 49.00 (Preis CHF 40.00 + Porto CHF 9.00)'].forEach(function (z) { assert.ok(m.body.indexOf(z) > -1, z); });
an = 'keine-adresse'; x = JSON.parse(JSON.stringify(c.rueckzahlungMail_(r))); assert.strictEqual(x.ok, false); assert.strictEqual(mails.length, 1);
an = 'kaputt@x.ch'; x = JSON.parse(JSON.stringify(c.rueckzahlungMail_(r))); assert.strictEqual(x.ok, false); assert.ok(/Limit/.test(x.fehler));
assert.ok(logs.some(function (l) { return /FEHLER Limit/.test(l[2]); }));
console.log('t_ricardo_rueckzahlung ok');
