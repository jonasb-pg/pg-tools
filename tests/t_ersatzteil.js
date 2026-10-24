/* Ersatzteil Tool: lädt mit der Basis ohne Namenskonflikt, Suche in Gruppen, ID-Vergabe, Boxen, Shop-Liste. Server mit Stubs, kein Google. */
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const lies = function (p) { return fs.readFileSync(__dirname + '/../' + p, 'utf8'); };
const J = function (x) { return JSON.stringify(x); }, eq = function (a, b, m) { assert.strictEqual(J(a), J(b), m); };

const kopf = ['ID', 'Marke', 'Modell', 'Produktart', 'Teil', 'Teilart', 'Menge', 'Box', 'Status', 'Quelle', 'Erfasst am', 'Erfasst von', 'Verbraucht am', 'Verbraucht von', 'Bemerkung', 'Kennung'];   // «Kennung» seit 2026-10-24.2
const tabs = {
  'Teile': [kopf,
    ['ET-0001', 'Philips', 'HD7462/20', 'Kaffeemaschine', 'Wassertank', 'Tank', 1, 'B12', 'im Lager', '', '', '', '', '', ''],
    ['ET-0002', 'Philips', 'HD7447', 'Kaffeemaschine', 'Filterhalter', 'Filter', 1, 'B12', 'im Lager', '', '', '', '', '', ''],
    ['ET-0003', 'Philips', 'S5000', 'Rasierer', 'Scherkopf', 'Aufsatz', 2, 'B14', 'im Lager', '', '', '', '', '', ''],
    ['ET-0004', 'Bosch', 'TKA3A031', 'Kaffeemaschine', 'Kanne', 'Andere', 1, 'B13', 'verbraucht', '', '', '', '', '', '']],
  'Boxen': [['Box', 'Produktart', 'Status', 'Ort', 'Angelegt am', 'Angelegt von', 'Bemerkung'], ['B12', 'Kaffeemaschine', 'offen', '', '', '', ''], ['B14', 'Rasierer', 'voll', '', '', '', '']],
  'Einstellungen': [['Einstellung', 'Wert', 'Erklärung'], ['Admins', '', ''], ['KI-Budget USD pro Monat', '30', '']],
  'Kosten': [['Zeit', 'Aktion', 'ID', 'Modell', 'Tokens Input', 'Tokens Output', 'Websuchen', 'USD']],
  'Log': [['Zeit', 'Bearbeiter', 'Aktion', 'ID', 'Details']],
  'Listen': [['Produktart', 'Teilart', 'Quelle'], ['Kaffeemaschine', 'Netzteil', 'Galaxus-Retoure'], ['Rasierer', 'Tank', '']]
};
function sheet(n) {
  const v = tabs[n];
  return { getDataRange: function () { return { getValues: function () { return v; } }; }, getLastColumn: function () { return v[0].length; }, getLastRow: function () { return v.length; }, getMaxRows: function () { return 1000; },
    getRange: function (r, c) {
      return { getValues: function () { return [v[0]]; }, setValues: function (x) { x.forEach(function (z) { v.push(z); }); }, setDataValidation: function () {},
        setValue: function (x) { if (typeof r === 'string') { const m = /^([A-Z]+)(\d+)$/.exec(r); v[Number(m[2]) - 1][m[1].charCodeAt(0) - 65] = x; } } };
    } };
}
const ctx = { console: console, SpreadsheetApp: { getActiveSpreadsheet: function () { return { getSheetByName: function (n) { return tabs[n] ? sheet(n) : null; } }; } },
  PropertiesService: { getScriptProperties: function () { return { getProperty: function () { return ''; } }; } }, LockService: { getScriptLock: function () { return { waitLock: function () {}, releaseLock: function () {} }; } },
  Utilities: { formatDate: function () { return '17.10.2026 00:30:00'; } }, Session: { getActiveUser: function () { return { getEmail: function () { return 'test@pretty-good.ch'; } }; }, getEffectiveUser: function () { return { getEmail: function () { return 'test@pretty-good.ch'; } }; } },   // Konto des Tools: V6 (2026-10-24.2)
  UrlFetchApp: {}, HtmlService: {}, ScriptApp: {}, CacheService: {} };
vm.createContext(ctx);
vm.runInContext(lies('apps/ersatzteil/Code.gs') + '\n' + lies('apps/basis/Basis.gs') + '\n;this.__k = ERSATZTEIL_KATALOG; this.__s = SPALTEN;', ctx);
assert.ok(!/function basis[A-Z]|const BASIS/.test(lies('apps/ersatzteil/Code.gs')), 'definiert basis*-Funktion selbst');

/* Suche vom Typenschild: passend, Serie, Marke */
const s1 = ctx.suchen({ marke: 'Philips', modell: 'HD 7462-20' });
eq(s1.passend.map(function (t) { return t.id; }), ['ET-0001']);
eq(s1.serie.map(function (t) { return t.id; }), ['ET-0002']);
eq(s1.marke.map(function (t) { return t.id; }), ['ET-0003']);
/* Freitext: jedes Wort, Modell auch ohne Trennzeichen; Verbrauchtes nie */
eq(ctx.suchen({ text: 'philips scherkopf' }).text.map(function (t) { return t.id; }), ['ET-0003']);
eq(ctx.suchen({ text: 'hd746220' }).text.map(function (t) { return t.id; }), ['ET-0001']);
eq(ctx.suchen({ text: 'bosch' }).text, []);
assert.strictEqual(ctx.neueId_(), 'ET-0005');
const sd = ctx.startDaten();
assert.strictEqual(sd.imLager, 3); assert.strictEqual(sd.boxen.length, 2); eq(sd.produktarten, ['Kaffeemaschine', 'Rasierer']); assert.strictEqual(sd.schluessel, false);
assert.throws(function () { ctx.einlagern({ teil: 'Tank', marke: 'X', box: 'B99' }); }, /gibt es nicht/);
assert.throws(function () { ctx.einlagern({ teil: '', marke: 'X', box: 'B12' }); }, /was für ein Teil/);
const neu = ctx.einlagern({ teil: 'Netzteil', marke: 'Philips', modell: '0815', produktart: 'Kaffeemaschine', box: 'b12', menge: 2 });
assert.strictEqual(neu.id, 'ET-0005'); assert.strictEqual(neu.box, 'B12'); assert.strictEqual(neu.imLager, 4);
assert.strictEqual(tabs['Teile'][5][2], "'0815", 'Modell als Text');
/* Verbraucht: Menge 2 wird 1, dann raus */
assert.strictEqual(ctx.verbraucht('ET-0005').rest, 1); assert.strictEqual(tabs['Teile'][5][6], 1);
assert.strictEqual(ctx.verbraucht('ET-0005').rest, 0); assert.strictEqual(tabs['Teile'][5][8], 'verbraucht');
assert.throws(function () { ctx.verbraucht('ET-0005'); }, /schon verbraucht/);
/* Boxen */
assert.throws(function () { ctx.boxStatus('B12', 'aufgelöst'); }, /liegen noch/);
assert.strictEqual(ctx.boxNeu('Staubsauger').box, 'B15');
const shops = ctx.teilShops_({});
assert.strictEqual(shops.length, 4); assert.strictEqual(shops[3].domain, ''); assert.ok(shops[3].link.indexOf('aswo') > -1); assert.ok(shops[0].link.indexOf('{q}') > -1);
/* Katalog vollständig: jeder Tab aus SPALTEN steht im Katalog */
const katalog = ctx.__k.map(function (k) { return k.tab; });
Object.keys(ctx.__s).forEach(function (t) { assert.ok(katalog.indexOf(t) > -1, 'Katalog ohne ' + t); });
console.log('ok ersatzteil');
