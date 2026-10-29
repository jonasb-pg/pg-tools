/* Ricardo Tool, Feedback Jonas 29.10.2026: Sendungsnummer von Hand beim Packen (sendungSetzen). Erfundene Daten. Lauf: node tests/t_ricardo_sendung.js */
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const c = { console: console };
vm.createContext(c); vm.runInContext(fs.readFileSync(__dirname + '/../apps/ricardo/Code.gs', 'utf8'), c);
const V_COLS = vm.runInContext('V_COLS', c), LOG = [];
const zeilen = [['50000002'], ['50000003']], zellen = {}, FORMAT = {};
const sheet = {
  getLastRow: () => zeilen.length + 1,
  getRange: (r, col) => { const z = { getValues: () => zeilen, getValue: () => zellen[r + ':' + col] || '', setValue: v => { zellen[r + ':' + col] = v; }, setNumberFormat: f => { FORMAT[r + ':' + col] = f; return z; } }; return z; }
};
c.SpreadsheetApp = { getActive: () => ({ getSheetByName: () => sheet }) };
c.sperre_ = () => ({ releaseLock: () => {} }); c.log_ = (a, i, d) => LOG.push(a + ' | ' + i + ' | ' + d);
const col = V_COLS.indexOf('Sendungsnummer') + 1;
const r = c.sendungSetzen('50000002', ' 99.60.123456.00000001 ');
assert.strictEqual(r.nr + '|' + r.sendung, '50000002|99.60.123456.00000001', 'gespeichert, Leerzeichen weg');
assert.strictEqual(zellen['2:' + col], '99.60.123456.00000001', 'in der Spalte Sendungsnummer der richtigen Zeile');
assert.strictEqual(FORMAT['2:' + col], '@', 'als Text geschrieben (18 Ziffern ohne Punkte bleiben genau)');
c.sendungSetzen('50000003', '990012345612345678');
assert.strictEqual(zellen['2:' + col] && zellen['3:' + col], '990012345612345678', 'reine Ziffernfolge erlaubt');
assert.ok(LOG.some(l => /^Sendungsnummer von Hand \| 50000002 \| 99\.60\.123456\.00000001$/.test(l)), 'Log');
assert.throws(() => c.sendungSetzen('50000002', '99.60.999999.00000009'), /Bitte bestätigen: Für 50000002 ist schon die Sendung 99\.60\.123456\.00000001 eingetragen\. Ersetzen\? \[sn\]$/, 'andere Nummer nur mit Bestätigung');
assert.strictEqual(zellen['2:' + col], '99.60.123456.00000001', 'nichts überschrieben');
c.sendungSetzen('50000002', '99.60.999999.00000009', true);
assert.strictEqual(zellen['2:' + col], '99.60.999999.00000009', 'mit Bestätigung ersetzt');
assert.ok(LOG.some(l => /vorher 99\.60\.123456\.00000001/.test(l)), 'alte Nummer im Log');
c.sendungSetzen('50000002', '99.60.999999.00000009');                       // gleiche Nummer nochmals: keine Rückfrage
assert.throws(() => c.sendungSetzen('50000002', 'abc'), /sieht nicht nach einer Sendungsnummer aus/, 'zu kurz');
assert.throws(() => c.sendungSetzen('50000002', '99.60.1234<6>'), /sieht nicht nach einer Sendungsnummer aus/, 'ungültige Zeichen');
assert.throws(() => c.sendungSetzen('50000009', '99.60.123456.00000001'), /Verkauf 50000009 nicht gefunden/, 'unbekannter Verkauf');
assert.throws(() => c.sendungSetzen('', '99.60.123456.00000001'), /Verkauf fehlt/, 'ohne Nummer');
console.log('t_ricardo_sendung ok');
