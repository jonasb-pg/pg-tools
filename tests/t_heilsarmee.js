/* Heilsarmee Tool 1.2.0 (Prozentsatz = Rabatt): Preise, Kategorien, Suche, Speichern, Reporting mit Schein-Sheets. Erfundene Daten. Lauf: node tests/t_heilsarmee.js */
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const c = { console: console };
vm.createContext(c);
['Kategorien.gs', 'Code.gs'].forEach((f) => vm.runInContext(fs.readFileSync(__dirname + '/../apps/heilsarmee/' + f, 'utf8'), c));
let n = 0; const ok = (b, m) => { assert.ok(b, m); n++; }; const eq = (a, b, m) => { assert.deepStrictEqual(a === undefined ? a : JSON.parse(JSON.stringify(a)), b, m); n++; };

// Preise: nächste Stufe, über 59 in 10er-Schritten, Gleichstand die höhere
const P = (x, p) => c.preisVorschlag_(x, p);
eq(P(39, 0.5), 18.9, '39 Neu'); eq(P(118, 0.5), 59, '118 Neu'); eq(P(7.1, 0.5), 2.9, '7.10 Neu');
eq(P(49, 0.75), 9.9, '49 Gebraucht (75% Rabatt → 12.25)'); eq(P(100, 0.75), 24.9, '100 Gebraucht → 25'); eq(P(120, 0.75), 29.9, '120 Gebraucht → 30'); eq(P(40, 0.75), 9.9, '40 Gebraucht → 10 (Beispiel Mail)');
eq(P(400, 0.75), 99, '400 Gebraucht → 100'); eq(P(40, 0), 39, 'Rabatt 0 → voller Preis'); eq(P(40, 1), null, 'Rabatt 100% ungültig');
eq(P(30, 0.75), 6.9, '30 Gebraucht → 7.50 → 6.90'); eq(P(2, 0.5), 1.9, 'Minimum 1.90'); eq(P('39,00', 0.5), 18.9, 'Komma'); eq(P("1'000", 0.5), 499, 'Tausender');
eq(P(null, 0.5), null, 'ohne OVP'); eq(P(0, 0.5), null, 'OVP 0');
eq(P(118, 0.5), 59, 'Grenze 59'); eq(P(128, 0.5), 69, '64 → 69'); eq(P(68, 0.5), 29.9, '34 → 29.90 (näher als 39)'); eq(P(70, 0.5), 39, '35 → 39');
eq(c.stufen_(70).slice(11, 14), [59, 69, 79], 'Stufen über 59');

// Kategorien (Regeln)
const K = (b) => { const r = c.kategorieRegel_(b); return r ? r.brocki + ' › ' + r.kasse : null; };
eq(K('Villeroy & Boch Speiseteller Mariefleur'), 'Haushalt › Haushalt Basic', 'Teller');
eq(K('Knipex Verdrahtungszange (160 mm)'), 'Freizeit & Arbeit › Werkstatt, Atelier & Büro', 'Zange');
eq(K('Teppich rund'), 'Möbel › Teppiche', 'Teppich');
eq(K('Kochtopf mit Glasdeckel'), 'Haushalt › Haushalt Basic', 'Deckel ist keine Decke');
eq(K('Fleecedecke'), 'Textilien › E Wohntextilien', 'Decke');
eq(K('Ubiquiti Poe-24-12w-G'), null, 'unbekannt → null (KI oder Prüfen)');

// Suche
const L = [
  { id: 'PG-100', bez: 'Testmarke Lampe Alpha', menge: 1, ean: '7612345678901', ovp: 40, kat: 'Home', ort: 'HEI-1' },
  { id: 'PG-101', bez: 'Testmarke Lampe Alpha', menge: 1, ean: '7612345678901', ovp: 40, kat: 'Home', ort: 'HEI-1' },
  { id: 'PG-102', bez: 'Beispiel Topf Beta', menge: 2, ean: '012345678905', ovp: 25, kat: 'Home', ort: 'HEI-1' },
];
eq(c.suche_('7612345678901', L, { 'PG-100': 'BRO-1/1 (BRO-1)' }).map((x) => x.id), ['PG-101', 'PG-100'], 'EAN, freie zuerst');
eq(c.suche_('12345678905', L, {}).map((x) => x.id), ['PG-102'], 'UPC ohne führende 0');
eq(c.suche_('pg-102', L, {}).map((x) => x.id), ['PG-102'], 'PG-ID klein');
eq(c.suche_('PG–102', L, {}).map((x) => x.id), ['PG-102'], 'PG-ID mit Gedankenstrich');
eq(c.suche_('topf beta', L, {}).map((x) => x.id), ['PG-102'], 'Name');
eq(c.suche_('', L, {}), [], 'leer');

// Schein-Sheets für Speichern und Reporting
function blatt(name) {
  const rows = [], fmt = {};
  const s = { name: name, rows: rows, getLastRow: () => rows.length, getSheetId: () => 7,
    appendRow: (r) => { rows.push(r.slice()); },
    deleteRow: (z) => { rows.splice(z - 1, 1); },
    clear: () => { rows.length = 0; },
    setFrozenRows: () => {},
    getDataRange: () => ({ getDisplayValues: () => rows.map((r) => r.map((x) => (x == null ? '' : String(x)))) }),
    getRange: (r, col, nr, nc) => {
      nr = nr || 1; nc = nc || 1;
      const rg = {
        getValues: () => { const o = []; for (let i = 0; i < nr; i++) { const z = rows[r - 1 + i] || []; o.push(Array.from({ length: nc }, (_, j) => (z[col - 1 + j] == null ? '' : z[col - 1 + j]))); } return o; },
        setValues: (v) => { v.forEach((z, i) => { rows[r - 1 + i] = rows[r - 1 + i] || []; z.forEach((w, j) => { rows[r - 1 + i][col - 1 + j] = w; }); }); return rg; },
        setValue: (v) => rg.setValues([[v]]),
        setFormula: (f) => rg.setValues([[f]]), setFormulas: (f) => rg.setValues(f),
        setFontWeight: () => rg, setBackground: () => rg, setNumberFormat: (f) => { fmt[r + ':' + col] = f; return rg; }, setBorder: () => rg, setFontFamily: () => rg, setFontSize: () => rg,
      };
      return rg;
    } };
  return s;
}
const blaetter = {};
const ss = { getSheetByName: (nm) => blaetter[nm] || null, insertSheet: (nm) => (blaetter[nm] = blatt(nm)), getSheets: () => Object.values(blaetter), deleteSheet: () => {}, setSpreadsheetTimeZone: () => {}, getUrl: () => 'https://sheet' };
c.SpreadsheetApp = { getActive: () => ss, BorderStyle: { SOLID: 1 } };
c.LockService = { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) };
c.Session = { getActiveUser: () => ({ getEmail: () => 'test@example.com' }) };
c.Utilities = { formatDate: () => '30.10.2026 18:00' };
c.PropertiesService = { getScriptProperties: () => ({ getProperty: () => null }) };   // kein KI-Schlüssel
const rt = blatt('Heilsarmee');
rt.rows.push(['HEILSARMEE'], [], [], [], [], ['', 'ID', 'Sendung', 'Erfasst', 'Bezeichnung', '#', 'Barcode', 'Link', 'Kategorie', 'OVP', 'VP', 'Wert', 'CH', 'Lagerort']);
rt.rows.push(['', 'PG-100', 'S1', '', 'Testmarke Speiseteller Gamma', '1', '7612345678901', '', 'Home', '39,00', '', '', '', 'HEI-1']);
rt.rows.push(['', 'PG-102', 'S1', '', 'Ubiquiti Poe-24-12w-G', '2', '0134389313', '', 'Tech', '13,30', '', '', '', 'HEI-1']);
c.SpreadsheetApp.openById = () => ({ getSheetByName: (nm) => (nm === 'Heilsarmee' ? rt : null) });
const cache = {}; c.CacheService = { getScriptCache: () => ({ get: (k) => cache[k] || null, put: (k, v) => { cache[k] = v; } }) };

c.setup();
ok(blaetter['Stücke'] && blaetter['Lots'] && blaetter['Config'], 'Setup legt Tabs an');
const b = c.getBootstrap();
eq([b.rabattNeu, b.rabattGebraucht], [0.5, 0.75], 'Rabatt aus Config');
const l1 = c.neuesLot('Tina'); eq(l1.lot, 'BRO-1', 'erstes Lot'); eq(c.neuesLot('Tina').lot, 'BRO-2', 'zweites Lot');
const t = c.suche('7612345678901').treffer; eq(t.length, 1, 'Suche im Return Tool'); eq(t[0].ovp, 39, 'OVP gelesen');
const s1 = c.stueckSpeichern({ lot: 'BRO-1', pgid: 'PG-100', ean: '7612345678901', bez: t[0].bez, menge: 1, zustand: 'Neu', ovp: 39, von: 'Tina' });
eq([s1.pos, s1.preis], ['BRO-1/1', 18.9], 'Neu 50%');
assert.throws(() => c.stueckSpeichern({ lot: 'BRO-1', pgid: 'PG-100', bez: 'x', zustand: 'Neu', ovp: 39 }), /\[doppelt\]/, 'doppelt'); n++;
eq(c.suche('7612345678901').treffer[0].vergeben, 'BRO-1/1 (BRO-1)', 'vergeben angezeigt');
assert.throws(() => c.stueckSpeichern({ lot: 'BRO-1', pgid: 'PG-102', bez: 'x', ovp: 13.3 }), /Neu oder Gebraucht/, 'Zustand Pflicht'); n++;
const s2 = c.stueckSpeichern({ lot: 'BRO-1', pgid: 'PG-102', bez: 'Ubiquiti Poe-24-12w-G', menge: 2, zustand: 'Gebraucht', ovp: 13.3, preis: 4.9 });
eq([s2.pos, s2.preis, s2.vorschlag], ['BRO-1/2', 4.9, 2.9], 'Gebraucht 75% Rabatt (13.30 → 3.33 → 2.90), Preis von Hand');
const s3 = c.stueckSpeichern({ lot: 'BRO-1', bez: 'Fleecedecke', zustand: 'Gebraucht', ovp: '', preis: '6.90' });
eq([s3.pos, s3.preis], ['BRO-1/3', 6.9], 'von Hand ohne OVP');
assert.throws(() => c.stueckSpeichern({ lot: 'BRO-1', bez: 'Ohne Preis', zustand: 'Neu' }), /Preis fehlt/, 'ohne Preis'); n++;
const zeile = blaetter['Stücke'].rows[2];
eq(zeile[c.ST_COLS ? 0 : 0], 'BRO-1/2', 'Zeile geschrieben');
eq(c.lotStuecke('BRO-1').length, 3, 'drei Stücke');
c.stueckLoeschen('BRO-1/3'); eq(c.lotStuecke('BRO-1').length, 2, 'gelöscht');
const rep = c.lotAbschliessen('BRO-1');
eq([rep.tab, rep.stuecke, rep.pruefen], ['BRO-1', 3, 1], 'Reporting: 3 Stücke (Menge), 1 zu prüfen');
eq(Math.round(rep.summePreis * 100) / 100, 28.7, 'Summe Brockipreis 18.90 + 2×4.90');
const r1 = blaetter['BRO-1'].rows[4];
eq([r1[0], r1[8], r1[9], r1[10], r1[11]], ['BRO-1/1', 'Haushalt', 'Haushalt Basic', 39, 18.9], 'Reporting-Zeile mit Kategorie Brocki');
eq(blaetter['BRO-1'].rows[5][8], 'Prüfen', 'unbekannte Kategorie: Prüfen');
eq(blaetter['BRO-1'].rows[6][0], 'Total', 'Summenzeile');
eq(blaetter['Kategorien'].rows.length, 2, 'Regel-Treffer gemerkt (Kopf + 1)');
assert.throws(() => c.stueckSpeichern({ lot: 'BRO-1', bez: 'x', zustand: 'Neu', preis: 2.9 }), /abgeschlossen/, 'Lot zu'); n++;
console.log('Alle ' + n + ' Tests bestanden');
