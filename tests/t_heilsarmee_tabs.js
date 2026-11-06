/* Heilsarmee Tool 1.4.0: Suche über alle Tabs des Return Tools (Jonas B. 06.11.2026). Erfundene Daten. Lauf: node tests/t_heilsarmee_tabs.js */
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const c = { console: console }; vm.createContext(c);
['Kategorien.gs', 'Code.gs'].forEach((f) => vm.runInContext(fs.readFileSync(__dirname + '/../apps/heilsarmee/' + f, 'utf8'), c));
let n = 0; const eq = (a, b, m) => { assert.deepStrictEqual(JSON.parse(JSON.stringify(a)), b, m); n++; };
const KOPF = ['', 'ID', 'Sendung', 'Erfasst', 'Bezeichnung', '#', 'Barcode', 'Link', 'Kategorie', 'OVP', 'VP', 'Wert', 'CH', 'Lagerort'];
let lesen = {};
function tab(name, zeilen, kopf) {
  const rows = [[name.toUpperCase()], [], [], []].concat(kopf === false ? [] : [KOPF]).concat(zeilen);
  return { getDataRange: () => { lesen[name] = (lesen[name] || 0) + 1; return { getDisplayValues: () => rows.map((r) => r.map((x) => String(x == null ? '' : x))) }; }, rows: rows };
}
const z = (id, bez, ean, ovp, ort) => ['', id, 'S1', '', bez, '1', ean, '', 'Home', ovp, '', '', '', ort];
const RT = {
  'Heilsarmee': tab('Heilsarmee', [z('PG-1', 'Testlampe Alpha', '7610000000011', '40,00', 'HEI-1')]),
  'Stationär': tab('Stationär', [z('PG-2', 'Testlampe Alpha', '7610000000011', '40,00', 'HOM-1'), z('PG-3', 'Beispielkanne Gamma', '7610000000028', '1\'200,00', 'HOM-2'), z('PG-1', 'Testlampe Alpha doppelt', '7610000000011', '40,00', 'HOM-9')]),
  'Analyse': tab('Analyse', [z('PG-4', 'Musterwecker Delta', '', '19,90', 'Analyse')]),
  'Archiv Stationär': tab('Archiv Stationär', [z('PG-5', 'Verkaufter Stuhl', '7610000000035', '80,00', 'BALU1')]),
  'Online': tab('Online', [z('PG-6', 'Ohne Kopfzeile', '7610000000042', '10,00', 'X')], false),
};
c.SpreadsheetApp = { openById: () => ({ getSheetByName: (nm) => RT[nm] || null }), getActive: () => ({ getSheetByName: () => null }) };
let store = {}; c.CacheService = { getScriptCache: () => ({ get: (k) => (k in store ? store[k] : null), getAll: (ks) => ks.reduce((o, k) => { if (k in store) o[k] = store[k]; return o; }, {}), put: (k, v) => { store[k] = v; }, putAll: (o) => Object.assign(store, o) }) };
c.Session = { getActiveUser: () => ({ getEmail: () => 'test@example.com' }) };
c.vergeben_ = () => ({});

let t = c.suche('7610000000011').treffer;
eq(t.map((x) => x.id), ['PG-1', 'PG-2'], 'EAN: Heilsarmee zuerst, dann Stationär; PG-1 nur einmal');
eq([t[1].ovp, t[1].ort], [40, 'HOM-1'], 'OVP und Lagerort aus anderem Tab');
eq(c.suche('PG-3').treffer.map((x) => [x.id, x.ovp]), [['PG-3', 1200]], 'PG-ID aus Stationär, OVP mit Tausender');
eq(c.suche('musterwecker').treffer.map((x) => x.id), ['PG-4'], 'Name aus Analyse');
eq(c.suche('7610000000035').treffer, [], 'Archiv wird nicht durchsucht');
eq(c.suche('7610000000042').treffer, [], 'Tab ohne Kopfzeile übersprungen');
eq(Object.keys(lesen).sort(), ['Analyse', 'Heilsarmee', 'Online', 'Stationär'], 'gelesene Tabs (kein Archiv, fehlende ignoriert)');

// Cache: zweite Suche mit Treffer liest die übrigen Tabs nicht neu
lesen = {}; store['ha-rt'] && delete store['ha-rt'];
c.suche('PG-2'); eq(lesen['Stationär'] || 0, 0, 'Treffer aus Cache, Stationär nicht neu gelesen');
// neu erfasstes Stück: ohne Treffer wird frisch gelesen
RT['Stationär'].rows.push(z('PG-7', 'Neu erfasst Epsilon', '7610000000059', '15,00', 'HOM-3'));
eq(c.suche('7610000000059').treffer, [], 'innert 2 min kein erneutes Lesen');
store['ha-rt2-t'] = String(Date.now() - 130000);
eq(c.suche('7610000000059').treffer.map((x) => x.id), ['PG-7'], 'ohne Treffer frisch nachgelesen');
// Cache in Stücken (gross)
store = {}; const viele = []; for (let i = 0; i < 3000; i++) viele.push(z('PG-' + (1000 + i), 'Artikel Nummer ' + i + ' mit langer Bezeichnung zum Füllen des Zwischenspeichers', '76100' + String(100000 + i), '9,90', 'HOM-1'));
RT['Stationär'] = tab('Stationär', viele);
eq(c.suche('PG-3999').treffer.map((x) => x.id), ['PG-3999'], 'grosse Liste');
eq(Number(store['ha-rt2-n']) > 1, true, 'Cache in mehreren Stücken');
lesen = {}; eq(c.suche('PG-1500').treffer.map((x) => x.id), ['PG-1500'], 'aus Stücken zusammengesetzt'); eq(lesen['Stationär'] || 0, 0, 'ohne neu lesen');
// Config ohne RETURN_TABS-Zeile → Standard
eq(c.getConfig_().RETURN_TABS.indexOf('Stationär') >= 0, true, 'Standard RETURN_TABS');
console.log('Alle ' + n + ' Tests bestanden');
