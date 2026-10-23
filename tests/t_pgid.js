/* PG-ID als einzige Nummer (Entscheid Jonas 23.10.2026, Runde 2 vom 24.10.2026): Lagerort «Analyse» aus den Kanal-Tabs, Suche im ganzen Return Tool,
   Galaxus-Nummer und Name in beide Richtungen, AN-Doppel erkennen, Schreibweisen von PG-ID und Barcode. Erfundene Daten. */
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const KOPF = ['☑', 'ID', 'Sendung', 'Erfasst', 'Bezeichnung', '#', 'Barcode', 'Link', 'Kategorie', 'OVP', 'VP', 'Wert', 'CH', 'Lagerort', 'Lief-Nr'];
const leer = function () { return [[''], [''], [''], [''], ['']]; };
const gx = n => 'https://www.galaxus.ch/de/s1/product/produkt-' + String(n).repeat(3);
const zeile = function (id, bez, bc, ort, link) { return ['', id, '', '', bez, 1, bc, link || '', 'Kids', 100, 50, '', '', ort, '']; };
const TABS = {
  'Analyse': leer().concat([KOPF.concat(['Reusable']), zeile('PG-100', 'Denver Kamera', '', 'Analyse').concat(['']), zeile('PG-101', 'Sony Kopfhörer', '', 'Analyse').concat(['Ja'])]),
  'Stationär': leer().concat([KOPF, zeile('PG-200', 'Babymoov Premium Care 2019', '', 'Analyse', gx(111)), zeile('PG-201', 'Tonies Toniebox 2 blau', '4251192100001', 'KID-6'), zeile('PG-202', 'Beurer MG 195 (9 Stufen, 120 min)', '', 'analyse '),
    zeile('PG-0203', 'Denver MCR 50', 40064081, 'Analyse'), zeile('PG-204', 'imoo Watch Phone Z1 (41 mm, 4G)', '', 'Analyse')]),
  'Archiv Stationär': leer().concat([KOPF, zeile('PG-300', 'Tonies Toniebox alt', '', 'Analyse')]),
  'Scanner': leer().concat([['☑', 'Erfasst', 'Bezeichnung', 'Barcode', 'Lagerort'], ['', '', 'Ohne Nummer Gerät', '7611111111111', 'Analyse']]),
  'Listen': [['Liste'], ['PG-202 Notiz']],
  'Online': leer().concat([KOPF]), 'Berner Brocki': leer().concat([KOPF]), 'Caritas': leer().concat([KOPF]), 'Heilsarmee': leer().concat([KOPF])
};
function blatt(name) {
  const v = TABS[name], breit = () => Math.max.apply(null, v.map(r => r.length));
  return { getName: () => name, getLastRow: () => v.length, getLastColumn: breit,
    getDataRange: () => ({ getValues: () => v.map(r => { const z = r.slice(); while (z.length < breit()) z.push(''); return z; }) }),
    getRange: (r, c, nr, nc) => ({ getValues: () => { const o = []; for (let i = 0; i < (nr || 1); i++) { const z = []; for (let j = 0; j < (nc || 1); j++) z.push(((v[r - 1 + i] || [])[c - 1 + j]) === undefined ? '' : v[r - 1 + i][c - 1 + j]); o.push(z); } return o; } }) };
}
const BL = {}; Object.keys(TABS).forEach(n => BL[n] = blatt(n));
const RT = { getSheets: () => Object.keys(BL).map(n => BL[n]), getSheetByName: n => BL[n] || null,
  createTextFinder: (t) => { let rx = false; const f = { useRegularExpression: b => { rx = b; return f; }, matchEntireCell: () => f, findAll: () => {
    const re = new RegExp(rx ? t : '^' + t + '$', 'i'), out = [];
    Object.keys(TABS).forEach(n => TABS[n].forEach((r, i) => r.forEach((x, j) => { if (re.test(String(x))) out.push({ getSheet: () => BL[n], getRow: () => i + 1, getColumn: () => j + 1 }); })));
    return out; } }; return f; } };
const c = { console, JSON, Math, Date, RegExp, Utilities: { formatDate: () => '' }, SpreadsheetApp: { openById: () => RT } };
vm.createContext(c); vm.runInContext(fs.readFileSync(__dirname + '/../apps/analyse/Code.gs', 'utf8'), c);
assert.throws(() => c.ohneInventar('X', '', 1, '', 2, 'Grund lang', true), /Nur Stücke mit PG-ID/, 'ohne Inventar abgeschaltet (Entscheid 24.10.2026)');
vm.runInContext('OHNE_INVENTAR = true;', c);
let PRODUKTE = [], LOG = [];
c.einst_ = () => ({ 'Return Tool ID': 'RT', 'Return Tool Tab': 'Analyse' });
let PK = ['PG-ID', 'Herkunft', 'Bezeichnung', 'Barcode', 'Link', 'Analyse-Status', 'Übernommen am'];
c.lies_ = n => ({ kopf: PK, z: (n === 'Produkte' ? PRODUKTE : []).map((p, i) => Object.assign({ _r: i + 2 }, p)) });
c.schreib_ = (n, objs) => { objs.forEach(o => PRODUKTE.push(Object.assign({}, o))); };
c.setz_ = (n, feld, werte) => { Object.keys(werte).forEach(r => { PRODUKTE[Number(r) - 2][feld] = werte[r]; }); };
c.gesperrt_ = f => f(); c.log_ = (a, id, d) => LOG.push(a + ' ' + id + ' ' + d); c.zeit_ = () => '24.10.2026';
c.imMatchmaker_ = () => ({}); c.ueberblickSpeicher_ = () => ({ ok: 1 });
const P = id => PRODUKTE.filter(r => r['PG-ID'] === id)[0];

/* Hilfsfunktionen */
assert.strictEqual(c.pgNorm_('pg 0862'), 'PG-862'); assert.strictEqual(c.pgNorm_("PG'862"), 'PG-862'); assert.strictEqual(c.pgNorm_('AN-0001'), '');
assert.strictEqual(c.bcNorm_('0040064081'), '40064081');
assert.strictEqual(c.bcVoll_(40064081), '40064081'); assert.strictEqual(c.bcVoll_(12345678905), '012345678905', 'verlorene führende Null ergänzt (gültige Prüfziffer)');
assert.strictEqual(c.galaxusNr_('https://www.galaxus.ch/de/s6/product/braun-silk-epil-9-flex-epilierer-42667319?openBlocks=x'), '42667319');
assert.strictEqual(c.galaxusNr_('https://www.brack.ch/wahl-1381328'), '');
assert.ok(c.nameTreffer_(c.nameTokens_('beurer mg 195 9 stufen 120 min massagepistole'), 'Beurer MG 195 (9 Stufen, 120 min)') >= 0.6);
assert.ok(c.nameAehnlich_(c.nameTokens_('denver mcr 50 patefonas ruda plattenspieler'), 'Denver MCR 50') >= 0.6, 'kurzer Name ganz enthalten');
assert.ok(c.nameTreffer_(c.nameTokens_('jabra evolve 65 te link 390a'), 'Jabra Evolve2 55') < 0.6, 'evolve2 ist nicht evolve');

/* Zwillinge: streng (Abgleich) vs. Warnung */
const Z = (anName, pgName, streng) => c.anZwillinge_([{ 'PG-ID': 'AN-0001', 'Bezeichnung': anName, 'Analyse-Status': 'Erledigt' }], streng)({ 'PG-ID': 'PG-1', 'Bezeichnung': pgName }).length > 0;
assert.ok(!Z('Apple AirPods Pro 2', 'Apple AirPods 4', true) && !Z('Apple AirPods Pro 2', 'Apple AirPods 4'), 'AirPods 2 ≠ 4');
assert.ok(!Z('Philips Hue Bridge', 'Philips Hue Go', true), 'Hue Bridge hält Hue Go nicht zurück');
assert.ok(!Z('iPhone 13', 'iPhone 13 Pro', true), 'iPhone 13 hält 13 Pro nicht zurück');
assert.ok(!Z('Nespresso Kapselmaschine', 'Nespresso Vertuo Next Kapselmaschine', true));
assert.ok(Z('beurer mg 195 9 stufen 120 min massagepistole', 'Beurer MG 195 (9 Stufen, 120 min)', true), 'echter Doppel bleibt erkannt');
assert.ok(Z('denver mcr 50 patefonas ruda plattenspieler', 'Denver MCR 50') && !Z('denver mcr 50 patefonas ruda plattenspieler', 'Denver MCR 50', true), 'Denver: Warnung, aber kein Zurückhalten');

/* 1. Abgleich */
PRODUKTE = [{ 'PG-ID': 'AN-0027', 'Herkunft': 'Ohne Inventar', 'Bezeichnung': 'Babymoov Premium Care', 'Link': gx(111), 'Analyse-Status': 'Erledigt' },
  { 'PG-ID': 'AN-0028', 'Herkunft': 'Ohne Inventar', 'Bezeichnung': 'beurer mg 195 9 stufen 120 min massagepistole', 'Link': gx(222), 'Analyse-Status': 'Erledigt' },
  { 'PG-ID': 'AN-0067', 'Herkunft': 'Ohne Inventar', 'Bezeichnung': 'imoo watch phone z7 54 mm 4g smartwatch', 'Link': '', 'Analyse-Status': 'Offen' }];
let x = c.spiegeln_(c.einst_());
const ids = PRODUKTE.map(p => p['PG-ID']);
assert.ok(ids.indexOf('PG-100') > -1, 'Tab Analyse');
assert.ok(ids.indexOf('PG-101') < 0, 'Reusable gesetzt: nicht');
assert.ok(ids.indexOf('PG-201') < 0, 'anderer Lagerort: nicht');
assert.ok(ids.indexOf('PG-300') < 0, 'Archiv: nicht');
assert.ok(ids.indexOf('PG-200') < 0, 'gleiche Galaxus-Nummer wie AN-0027: nicht doppelt');
assert.ok(ids.indexOf('PG-202') < 0, 'Name wie AN-0028: nicht doppelt');
assert.ok(ids.indexOf('PG-0203') > -1, 'Denver: kein AN, kommt rein');
assert.ok(ids.indexOf('PG-204') > -1, 'imoo Z1 ist nicht AN-0067 (Z7)');
assert.strictEqual(P('PG-0203')['Barcode'], "'40064081", 'Barcode als Text');
assert.ok(LOG.some(l => /PG-200 ~ AN-0027/.test(l) && /PG-202 ~ AN-0028/.test(l)), 'Hinweis im Log');
assert.strictEqual(x.neu, 3);
/* Zweiter Lauf: stabil */
x = c.spiegeln_(c.einst_()); assert.strictEqual(x.neu, 0); assert.strictEqual(x.entfaellt, 0);
/* Ein Kanal-Tab nicht lesbar: nichts fällt heraus */
const alt = BL['Stationär']; delete BL['Stationär'];
x = c.spiegeln_(c.einst_()); assert.strictEqual(x.entfaellt, 0, 'unvollständig gelesen: kein Entfällt'); assert.ok(/nicht lesbar/.test(x.hinweis));
BL['Stationär'] = alt;

/* 2. Suche: nicht in der Warteschlange → Return Tool, mit Status; Schreibweisen */
let s = c.suche('PG-201');
assert.strictEqual(s.treffer.length, 0); assert.strictEqual(s.rt.length, 1); assert.strictEqual(s.rt[0].tab, 'Stationär');
s = c.suche('4251192100001'); assert.strictEqual(s.rt[0].id, 'PG-201', 'per Barcode');
s = c.suche('0040064081'); assert.ok(s.treffer.length === 1 && s.treffer[0].id === 'PG-0203', 'Barcode mit Nullen findet Stück im Tool'); assert.ok(s.inSchlange);
s = c.suche('pg 203'); assert.ok(s.treffer.length === 1 && s.treffer[0].d, 'PG-0203 als «pg 203», eindeutig: startet sofort');
s = c.suche('toniebox'); assert.strictEqual(s.rt.map(r => r.id).join(), 'PG-201,PG-300', 'Name, Archiv zuletzt'); assert.ok(s.rt[1].archiv);
s = c.suche('Ohne Nummer Gerät'); assert.ok(s.rt.some(r => r.ohneId && r.tab === 'Scanner'), 'Scanner ohne PG-ID wird gezeigt');
assert.ok(!c.suche('Liste').rt.some(r => r.tab === 'Listen'), 'Hilfstab zählt nicht');
s = c.suche('PG-100'); assert.strictEqual(s.treffer.length, 1); assert.strictEqual(s.rt.length, 0, 'offen: kein Return-Tool-Aufruf');
/* Erledigtes Schwesterstück verdeckt das Stück im Return Tool nicht mehr */
PRODUKTE.push({ 'PG-ID': 'PG-199', 'Herkunft': 'Retoure', 'Bezeichnung': 'Tonies Toniebox 2 blau', 'Barcode': '4251192100001', 'Analyse-Status': 'Erledigt' });
s = c.suche('4251192100001'); assert.ok(s.treffer.length === 1 && s.rt.some(r => r.id === 'PG-201'), 'erledigt im Tool + verfügbar im Return Tool');

/* 3. Übernehmen */
let u = c.uebernehmen('pg-201'); assert.strictEqual(u.id, 'PG-201');
let p = P('PG-201'); assert.ok(p && p['Analyse-Status'] === 'Offen' && p['Übernommen am'] === '24.10.2026');
c.spiegeln_(c.einst_()); assert.strictEqual(P('PG-201')['Analyse-Status'], 'Offen', 'Abgleich nimmt Übernommenes nicht heraus');
assert.throws(() => c.uebernehmen('PG-300'), /Archiv/);
/* Vor «einrichten» (Spalte fehlt): nichts fällt heraus, Übernehmen meldet es klar */
PK = PK.filter(k => k !== 'Übernommen am');
PRODUKTE.push({ 'PG-ID': 'PG-777', 'Herkunft': 'Retoure', 'Bezeichnung': 'Weg', 'Analyse-Status': 'Offen' });
assert.strictEqual(c.spiegeln_(c.einst_()).entfaellt, 0, 'ohne Spalte kein Entfällt');
assert.throws(() => c.uebernehmen('PG-201'), /einrichten/);
PK.push('Übernommen am');
assert.strictEqual(c.spiegeln_(c.einst_()).entfaellt, 1, 'mit Spalte fällt PG-777 heraus');
assert.throws(() => c.uebernehmen('AN-0001'), /Ungültige/);
u = c.uebernehmen('PG-202'); assert.ok(u.zwilling && /AN-0028/.test(u.zwilling), 'Warnung AN-0028 vor dem Übernehmen');
assert.ok(!P('PG-202'), 'noch nichts geschrieben');
u = c.uebernehmen('PG-202', true); assert.strictEqual(u.id, 'PG-202'); assert.ok(P('PG-202'));
P('PG-202')['Analyse-Status'] = 'Erledigt'; assert.throws(() => c.uebernehmen('PG-202', true), /schon analysiert/);
P('PG-202')['Analyse-Status'] = 'Reparatur'; assert.throws(() => c.uebernehmen('PG-202', true), /Reparatur/);
/* Suche zeigt AN-Warnung und startet dann nicht sofort */
PRODUKTE.push({ 'PG-ID': 'PG-210', 'Herkunft': 'Retoure', 'Bezeichnung': 'Babymoov Premium Care 2019', 'Link': gx(111), 'Analyse-Status': 'Offen' });
s = c.suche('PG-210'); assert.ok(s.treffer[0].an && /AN-0027/.test(s.treffer[0].an) && !s.treffer[0].d, 'AN-Warnung, kein Sofortstart');

/* 4. Stück ohne Inventar */
const vorher = PRODUKTE.length;
let o = c.ohneInventar('', gx(222).replace('produkt-', 'beurer-mg-195-9-stufen-120-min-massagepistole-'), '', 'Gesundheit', 80, '', false);
assert.ok(o.kandidaten && o.kandidaten.some(k => k.id === 'PG-202') && PRODUKTE.length === vorher, 'Name aus dem Link findet PG-202');
o = c.ohneInventar('Babymoov Premium Care', gx(111), '', '', 80, '', false);
assert.ok(o.kandidaten[0].id === 'PG-200' && o.kandidaten[0].galaxus, 'Galaxus-Nummer zuerst');
assert.throws(() => c.ohneInventar('Beurer MG 195', '', 40, '', 80, '', true), /warum/);
assert.throws(() => c.ohneInventar('Fantasie Gerät XY', '', 40, '', 80, '', false), /warum/, 'auch ohne Treffer: Grund Pflicht');
o = c.ohneInventar('Fantasie Gerät XY', '', 40, '', 80, 'Reuse-Spende ohne Etikett', false);
assert.strictEqual(o.id, 'AN-0068', 'Nummer nach der höchsten AN');
assert.ok(LOG.some(l => /Grund: Reuse-Spende/.test(l)));
console.log('t_pgid ok');
