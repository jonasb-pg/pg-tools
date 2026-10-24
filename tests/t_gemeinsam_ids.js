/* Prüfung 24.10.2026, Vertrag V3: Alle Tools vergleichen PG-IDs und Barcodes gleich. Lauf: node tests/t_gemeinsam_ids.js */
const fs = require('fs'), vm = require('vm');
let fehler = 0;
const ok = function (b, m) { if (!b) { fehler++; console.log('FEHLER', m); } };
function lade(p) {
  const c = { console: console, SpreadsheetApp: {}, PropertiesService: {}, CacheService: {}, Utilities: {}, Session: {}, ScriptApp: {}, LockService: {}, UrlFetchApp: {},
    HtmlService: {}, DriveApp: {}, GmailApp: {}, MailApp: {}, Logger: { log: function () {} } };
  vm.createContext(c);
  vm.runInContext(fs.readFileSync(__dirname + '/../' + p, 'utf8'), c);
  return c;
}
const tools = [
  { name: 'Analyse', c: lade('apps/analyse/Code.gs'), pg: 'pgNorm_', bc: 'bcNorm_' },
  { name: 'Ricardo', c: lade('apps/ricardo/Code.gs'), pg: 'idNorm_', bc: 'normEan_' },
  { name: 'Umpack', c: lade('apps/umpacken/Code.gs'), pg: 'pgNorm_', bc: 'bcKey_' },
  { name: 'Matchmaker', c: lade('apps/matchmaker/Code.gs'), pg: 'pgNorm_', bc: 'bcKey_' }
];
const PG = [['PG-0862', 'PG-862'], ['pg 862', 'PG-862'], ["PG'862", 'PG-862'], ['PG862', 'PG-862'], ['PG-862', 'PG-862'], [' pg-00862 ', 'PG-862'], ['PG-31606', 'PG-31606']];
const BC = [['07613081105484', '7613081105484'], ["'4006381333931", '4006381333931'], ['(01)04006381333931', '4006381333931'], ['0104006381333931', '4006381333931'],
  ['4006381-333931', '4006381333931'], [' 4006381 333931 ', '4006381333931'], ['080926145160', '80926145160'], [4006381333931, '4006381333931'], ['abc123', 'ABC123']];
tools.forEach(function (t) {
  ok(typeof t.c[t.pg] === 'function', t.name + ': ' + t.pg + ' fehlt');
  ok(typeof t.c[t.bc] === 'function', t.name + ': ' + t.bc + ' fehlt');
  if (typeof t.c[t.pg] === 'function') PG.forEach(function (f) { const r = t.c[t.pg](f[0]); ok(r === f[1], t.name + ' ' + t.pg + '(' + JSON.stringify(f[0]) + ') = ' + JSON.stringify(r) + ', erwartet ' + f[1]); });
  if (typeof t.c[t.bc] === 'function') BC.forEach(function (f) { const r = String(t.c[t.bc](f[0])); ok(r === f[1], t.name + ' ' + t.bc + '(' + JSON.stringify(f[0]) + ') = ' + JSON.stringify(r) + ', erwartet ' + f[1]); });
});
console.log(fehler ? fehler + ' FEHLER' : 't_gemeinsam_ids ok');
process.exit(fehler ? 1 : 0);
