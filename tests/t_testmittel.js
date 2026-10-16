/* Testmittel: Inventar wächst nur mit bestätigtem «Haben wir», alles andere nur ins Log. */
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const c = { console: console, Utilities: { formatDate: function () { return ''; } } };
vm.createContext(c); vm.runInContext(fs.readFileSync(__dirname + '/../apps/analyse/Code.gs', 'utf8'), c);
const geschrieben = {}, gesetzt = {};
c.lies_ = function () { return { z: [{ _r: 2, 'Testmittel': 'microSD-Karte', 'Vorhanden': 'Ja' }, { _r: 3, 'Testmittel': 'Netzteil 12 V', 'Vorhanden': 'Nein' }] }; };
c.schreib_ = function (tab, z) { geschrieben[tab] = JSON.parse(JSON.stringify(z)); };
c.setz_ = function (tab, feld, w) { gesetzt[tab + '|' + feld] = JSON.parse(JSON.stringify(w)); };
c.testmittelBuchen_({ benoetigt: ['microSD-Karte', 'Netzteil 12 V', 'App Testcam', 'Stativ'], gefehlt: ['Stativ'], da: ['App Testcam', 'netzteil 12 v'] }, 'PG-1', 'XX', 't');
assert.deepStrictEqual(geschrieben['Testmittel'], [{ 'Testmittel': 'App Testcam', 'Vorhanden': 'Ja' }]);   // Stativ kommt nicht ins Inventar
assert.deepStrictEqual(gesetzt['Testmittel|Vorhanden'], { 3: 'Ja' });                                     // Nein → Ja nach Bestätigung
assert.strictEqual(geschrieben['Testmittel-Log'].length, 5);
assert.ok(geschrieben['Testmittel-Log'].some(function (x) { return x['Testmittel'] === 'Stativ' && x['Art'] === 'Gefehlt'; }));
console.log('t_testmittel ok');
