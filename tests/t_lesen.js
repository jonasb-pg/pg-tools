/* Schnelles Lesen (17.10.2026): ganzes Raster in einem Aufruf wie getDataRange, mehrere Tabs über die Sheets-API, Überblick-Zwischenspeicher. */
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const cache = {}, aufrufe = [];
const c = { console: console, Utilities: { formatDate: function () { return ''; } },
  CacheService: { getScriptCache: function () { return { get: function (k) { return cache[k] || null; }, put: function (k, v) { cache[k] = v; }, remove: function (k) { delete cache[k]; },
    getAll: function (ks) { const o = {}; ks.forEach(function (k) { if (cache[k]) o[k] = cache[k]; }); return o; } }; } },
  SpreadsheetApp: { getActiveSpreadsheet: function () { return { getId: function () { return 'ID'; } }; } } };
vm.createContext(c); vm.runInContext(fs.readFileSync(__dirname + '/../apps/analyse/Code.gs', 'utf8'), c);

/* rasterWerte_: schneidet leere Zeilen und Spalten ab wie getDataRange */
const raster = [['A', 'B', '', ''], ['1', '', '', ''], ['', 'x', '', ''], ['', '', '', ''], ['', '', '', '']];
const blatt = { getMaxRows: function () { return 5; }, getMaxColumns: function () { return 4; }, getRange: function () { aufrufe.push('getRange'); return { getValues: function () { return raster.map(function (z) { return z.slice(); }); } }; } };
assert.deepStrictEqual(JSON.parse(JSON.stringify(c.rasterWerte_(blatt))), [['A', 'B'], ['1', ''], ['', 'x']]);
assert.strictEqual(aufrufe.length, 1, 'nur ein Lesezugriff');
const leer = { getMaxRows: function () { return 3; }, getMaxColumns: function () { return 2; }, getRange: function () { return { getValues: function () { return [['', ''], ['', ''], ['', '']]; } }; } };
assert.deepStrictEqual(JSON.parse(JSON.stringify(c.rasterWerte_(leer))), [['']]);

/* apiWerte_: ohne Dienst leer, mit Dienst aufgefüllt */
assert.deepStrictEqual(JSON.parse(JSON.stringify(c.apiWerte_(['Stufen']))), {});
let gefragt = null;
c.Sheets = { Spreadsheets: { Values: { batchGet: function (id, o) { gefragt = o; return { valueRanges: [{ values: [['Stufe', 'Minuten', 'X'], ['Kern', 10]] }, {}] }; } } } };
const w = c.apiWerte_(['Stufen', "Leer's"]);
assert.deepStrictEqual(JSON.parse(JSON.stringify(w.Stufen)), [['Stufe', 'Minuten', 'X'], ['Kern', 10, '']]);
assert.deepStrictEqual(JSON.parse(JSON.stringify(w["Leer's"])), [['']]);
assert.deepStrictEqual(JSON.parse(JSON.stringify(gefragt.ranges)), ["'Stufen'", "'Leer''s'"]);
assert.strictEqual(gefragt.dateTimeRenderOption, 'FORMATTED_STRING');

/* vorladen_: Tabs aus dem Zwischenspeicher nicht nochmals holen, den Rest in einem Aufruf */
cache['tab:Einstellungen'] = JSON.stringify({ kopf: ['Einstellung', 'Wert'], z: [] });
let geholt = [];
c.Sheets.Spreadsheets.Values.batchGet = function (id, o) { geholt = o.ranges; return { valueRanges: o.ranges.map(function () { return { values: [['Kopf'], ['a']] }; }) }; };
vm.runInContext("LAUF_MEMO = {}; MEMO = {};", c);
c.vorladen_(['Einstellungen', 'Produkte', 'Stufen']);
assert.deepStrictEqual(JSON.parse(JSON.stringify(geholt)), ["'Produkte'", "'Stufen'"]);
assert.ok(vm.runInContext("!!LAUF_MEMO['Produkte'] && !!MEMO['Einstellungen']", c));
assert.strictEqual(c.lies_('Produkte').z.length, 1, 'lies_ nimmt die vorgeladenen Werte');

/* Überblick-Schlüssel: ändert mit der Produktzeile und mit uebNeu_ */
const p = { 'PG-ID': 'PG-1', 'Recherche-Status': 'Läuft' }, k1 = c.uebSchluessel_(p, '0');
assert.notStrictEqual(k1, c.uebSchluessel_({ 'PG-ID': 'PG-1', 'Recherche-Status': 'Bereit' }, '0'));
assert.notStrictEqual(k1, c.uebSchluessel_(p, '1'));
c.uebNeu_(); assert.ok(cache['ueb-gen']);
delete cache['ueb-gen']; c.vergiss_('Testmittel'); assert.ok(cache['ueb-gen'], 'Testmittel ändert jeden Überblick');
console.log('t_lesen ok');
