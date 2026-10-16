/* Satz «getestet» für Verkaufsinfo und Ricardo: verständlich, nennt die getesteten Funktionen. */
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const c = { console: console, Utilities: { formatDate: function () { return ''; } } };
vm.createContext(c); vm.runInContext(fs.readFileSync(__dirname + '/../apps/analyse/Code.gs', 'utf8'), c);
const u = { funktion: { liste: [{ n: 'Saugen' }, { n: 'Akku laden' }, { n: 'Licht' }, { n: 'App-Verbindung' }] }, produkt: { umfang: 'Kern und beworben' } };
assert.strictEqual(c.geprueft_(u, { fn: ['ok', 'ok', 'np', 'ok'] }), 'Von uns getestet, funktioniert: Saugen, Akku laden und App-Verbindung.');
assert.strictEqual(c.geprueft_(u, { fn: ['ok'] }), 'Von uns getestet, funktioniert: Saugen.');
assert.strictEqual(c.geprueft_(u, { fn: [] }), 'Funktion geprüft.');
assert.ok(!/Kernfunktion|beworben/.test(c.geprueft_(u, { fn: ['ok', 'ok', 'ok', 'ok'] })));
assert.strictEqual(c.geprueft_({ funktion: { ersatz: true, liste: [] }, produkt: {} }, {}), 'Alle Teile auf Vollständigkeit und Zustand geprüft.');
console.log('t_geprueft ok');
