/* PG-ID als einzige Nummer (Entscheid Jonas 23.10.2026): Lagerort «Analyse» aus allen Kanal-Tabs, Suche im ganzen Return Tool, kein AN bei Treffern. Erfundene Daten. */
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const KOPF = ['☑', 'ID', 'Sendung', 'Erfasst', 'Bezeichnung', '#', 'Barcode', 'Link', 'Kategorie', 'OVP', 'VP', 'Wert', 'CH', 'Lagerort', 'Lief-Nr'];
const leer = function () { return [[''], [''], [''], [''], ['']]; };
const zeile = function (id, bez, bc, ort) { return ['', id, '', '', bez, 1, bc, '', 'Kids', 100, 50, '', '', ort, '']; };
const TABS = {
  'Analyse': leer().concat([KOPF.concat(['Reusable']), zeile('PG-100', 'Denver Kamera', '', 'Analyse').concat(['']), zeile('PG-101', 'Sony Kopfhörer', '', 'Analyse').concat(['Ja'])]),
  'Stationär': leer().concat([KOPF, zeile('PG-200', 'Babymoov Premium Care 2019', '', 'Analyse'), zeile('PG-201', 'Tonies Toniebox 2 blau', '4251192100001', 'KID-6'), zeile('PG-202', 'Beurer MG 195', '', 'analyse ')]),
  'Archiv Stationär': leer().concat([KOPF, zeile('PG-300', 'Tonies Toniebox alt', '', 'Analyse')]),
  'Listen': [['Liste'], ['x']]
};
function blatt(name) {
  const v = TABS[name];
  const sh = { getName: () => name, getLastRow: () => v.length, getLastColumn: () => Math.max.apply(null, v.map(r => r.length)),
    getDataRange: () => ({ getValues: () => v.map(r => r.slice()) }),
    getRange: (r, c, nr, nc) => ({ getValues: () => { const o = []; for (let i = 0; i < (nr || 1); i++) { const z = (v[r - 1 + i] || []).slice(c - 1, c - 1 + (nc || 1)); while (z.length < (nc || 1)) z.push(''); o.push(z); } return o; } }) };
  return sh;
}
const BL = {}; Object.keys(TABS).forEach(n => BL[n] = blatt(n));
const RT = { getSheets: () => Object.keys(BL).map(n => BL[n]), getSheetByName: n => BL[n] || null,
  createTextFinder: (t) => { let ganz = false; const f = { matchEntireCell: (b) => { ganz = b; return f; }, findAll: () => {
    const out = []; Object.keys(TABS).forEach(n => TABS[n].forEach((r, i) => r.forEach(x => { const s = String(x); if (ganz ? s === t : s.toLowerCase().indexOf(t.toLowerCase()) > -1) out.push({ getSheet: () => BL[n], getRow: () => i + 1 }); })));
    return out; } }; return f; } };
const PROPS = {};
const c = { console, JSON, Math, Date, Utilities: { formatDate: () => '' }, SpreadsheetApp: { openById: () => RT }, PropertiesService: { getScriptProperties: () => ({ getProperty: k => PROPS[k] || null, setProperty: (k, v) => { PROPS[k] = v; } }) } };
vm.createContext(c); vm.runInContext(fs.readFileSync(__dirname + '/../apps/analyse/Code.gs', 'utf8'), c);
let PRODUKTE = [], LOG = [];
c.einst_ = () => ({ 'Return Tool ID': 'RT', 'Return Tool Tab': 'Analyse' });
c.lies_ = () => ({ z: PRODUKTE.map((p, i) => Object.assign({ _r: i + 2 }, p)) });
c.schreib_ = (n, objs) => { objs.forEach(o => PRODUKTE.push(Object.assign({}, o))); };
c.setz_ = (n, feld, werte) => { Object.keys(werte).forEach(r => { PRODUKTE[Number(r) - 2][feld] = werte[r]; }); };
c.gesperrt_ = (f) => f();
c.log_ = (a, id, d) => LOG.push(a + ' ' + id + ' ' + d);
c.zeit_ = () => '23.10.2026';
vm.runInContext('ean_ = ean_;', c);

/* 1. Abgleich: Tab «Analyse» plus Lagerort «Analyse» aus Stationär, nicht aus Archiv; schon als AN analysiert → nicht nochmals */
PRODUKTE = [{ 'PG-ID': 'AN-0027', 'Herkunft': 'Ohne Inventar', 'Bezeichnung': 'Babymoov Premium Care', 'Analyse-Status': 'Erledigt' }];
let x = c.spiegeln_(c.einst_());
const ids = PRODUKTE.map(p => p['PG-ID']);
assert.ok(ids.indexOf('PG-100') > -1, 'Tab Analyse');
assert.ok(ids.indexOf('PG-101') < 0, 'Reusable gesetzt: nicht');
assert.ok(ids.indexOf('PG-202') > -1, 'Stationär mit Lagerort «analyse » (Gross/Leerzeichen egal)');
assert.ok(ids.indexOf('PG-201') < 0, 'Stationär mit anderem Lagerort: nicht');
assert.ok(ids.indexOf('PG-300') < 0, 'Archiv: nicht');
assert.ok(ids.indexOf('PG-200') < 0, 'schon als AN-0027 analysiert: nicht doppelt');
assert.ok(LOG.some(l => /PG-200 ~ AN-0027/.test(l)), 'Hinweis im Log');
assert.strictEqual(x.neu, 2);

/* 2. Suche: nicht im Analyse Tool → Treffer im ganzen Return Tool (PG-ID, Barcode, Name), Archiv zuletzt */
let s = c.suche('PG-201');
assert.strictEqual(s.treffer.length, 0); assert.strictEqual(s.rt.length, 1); assert.strictEqual(s.rt[0].tab, 'Stationär'); assert.ok(!s.rt[0].archiv);
s = c.suche('4251192100001'); assert.strictEqual(s.rt[0].id, 'PG-201', 'per Barcode');
s = c.suche('toniebox'); assert.strictEqual(s.rt.map(r => r.id).join(), 'PG-201,PG-300', 'per Name, Archiv zuletzt'); assert.ok(s.rt[1].archiv);
assert.ok(!('o' in s.rt[0]), 'keine Rohdaten an die Oberfläche');
s = c.suche('PG-100'); assert.strictEqual(s.treffer.length, 1, 'in der Warteschlange: wie bisher'); assert.strictEqual(s.rt.length, 0);

/* 3. Übernehmen: mit PG-ID in die Warteschlange, der Abgleich nimmt es nicht wieder heraus; Archiv nicht übernehmbar */
assert.strictEqual(c.uebernehmen('pg-201').id, 'PG-201');
let p = PRODUKTE.filter(r => r['PG-ID'] === 'PG-201')[0];
assert.ok(p && p['Analyse-Status'] === 'Offen' && p['Barcode'] === '4251192100001' && p['Herkunft'] === 'Retoure');
c.spiegeln_(c.einst_());
assert.strictEqual(PRODUKTE.filter(r => r['PG-ID'] === 'PG-201')[0]['Analyse-Status'], 'Offen', 'bleibt in der Warteschlange');
assert.strictEqual(PRODUKTE.filter(r => r['PG-ID'] === 'PG-201').length, 1, 'kein Doppel');
assert.throws(() => c.uebernehmen('PG-300'), /Archiv/);
assert.throws(() => c.uebernehmen('AN-0001'), /Ungültige/);

/* 4. Stück ohne Inventar: Treffer im Return Tool → Liste statt AN; trotzdem nur mit Grund */
const vorher = PRODUKTE.length;
let o = c.ohneInventar('Beurer MG 195', '', 40, 'Gesundheit', 80, '', false);
assert.ok(o.kandidaten && o.kandidaten[0].id === 'PG-202' && PRODUKTE.length === vorher, 'kein AN, Kandidaten zurück');
assert.throws(() => c.ohneInventar('Beurer MG 195', '', 40, '', 80, '', true), /warum/);
assert.throws(() => c.ohneInventar('Fantasie Gerät XY', '', 40, '', 80, '', false), /warum/, 'auch ohne Treffer: Grund Pflicht');
o = c.ohneInventar('Fantasie Gerät XY', '', 40, '', 80, 'Reuse-Spende ohne Etikett', false);
assert.ok(/^AN-\d{4}$/.test(o.id));
assert.ok(LOG.some(l => /Grund: Reuse-Spende/.test(l)));
console.log('t_pgid ok');
