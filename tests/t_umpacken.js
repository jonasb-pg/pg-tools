/* Umpack Tool (21.10.2026): Setup aus dem Return Tool und von Hand, Scan mit Konflikten, Abschluss mit Liste pro Abnehmer und Änderungsliste.
   Erfundene Daten, Sheets im Speicher. Lauf: node tests/t_umpacken.js */
const vm = require('vm'), fs = require('fs'), assert = require('assert');
function blatt(name, v) {
  const s = { v: v, name: name, getName: () => name,
    getLastRow: () => s.v.length, getLastColumn: () => Math.max(0, ...s.v.map(z => z.length)), getMaxRows: () => Math.max(1000, s.v.length), getMaxColumns: () => 26,
    getDataRange: () => ({ getValues: () => s.v.map(z => z.slice()), setFontFamily() { return this; }, setFontSize() { return this; } }),
    appendRow: (z) => { s.v.push(z.slice()); }, getRange: (r, c, nr, nc) => rng(s, r, c, nr || 1, nc || 1), setName: (n) => { name = n; s.name = n; return s; },
    insertSheet: null, setFrozenRows() {}, autoResizeColumns() {} };
  return s;
}
function rng(s, r, c, nr, nc) {
  const o = {
    getValues: () => { const a = []; for (let i = 0; i < nr; i++) { const z = []; for (let j = 0; j < nc; j++) z.push(((s.v[r - 1 + i] || [])[c - 1 + j]) ?? ''); a.push(z); } return a; },
    getValue: () => ((s.v[r - 1] || [])[c - 1]) ?? '',
    setValues: (w) => { w.forEach((z, i) => { s.v[r - 1 + i] = s.v[r - 1 + i] || []; z.forEach((x, j) => { s.v[r - 1 + i][c - 1 + j] = x; }); }); return o; },
    setValue: (x) => { s.v[r - 1] = s.v[r - 1] || []; s.v[r - 1][c - 1] = x; return o; },
    setNumberFormat: () => o, setFontWeight: () => o, setBackground: () => o, setFontFamily: () => o, setFontSize: () => o
  };
  return o;
}
function datei(tabs) {
  const sheets = Object.keys(tabs).map(n => blatt(n, tabs[n]));
  const ss = { sheets, getSheetByName: (n) => sheets.find(s => s.name === n) || null, getSheets: () => sheets, getId: () => 'NEU', getUrl: () => 'https://docs.google.com/neu',
    insertSheet: (n) => { const s = blatt(n, []); sheets.push(s); return s; } };
  return ss;
}
const DB = datei({});
const RT = datei({
  'Stationär': [['STATIONÄR'], [], [], [], [], ['☑', 'ID', 'Sendung', 'Erfasst', 'Bezeichnung', '#', 'Barcode', 'Link', 'Kategorie', 'OVP', 'VP', 'Wert', 'CH', 'Lagerort'],
    [false, 'PG-1', '', '', 'Lego Zug', 1, '111', '', 'Kids', 50, 20, 20, '', 'KID-7'],
    [false, 'PG-2', '', '', 'Puppe', 1, '222', '', 'Kids', 30, 12.5, 12.5, '', 'KID-7'],
    [false, 'PG-3', '', '', 'Puppe', 1, '222', '', 'Kids', 30, 12.5, 12.5, '', 'KID-12'],
    [false, 'PG-4', '', '', 'Toaster', 1, '444', '', 'Home', 40, 18, 18, '', 'HOM-3'],
    [false, 'PG-5', '', '', 'Bauklötze', 1, '555', '', 'Kids', 0, 8, 8, '', 'KID-12'],
    [false, 'PG-9', '', '', 'Falsch erfasst', 1, '999', '', 'Kids', 0, 5, 5, '', 'KID-4005176984105']],   // EAN als Lagerort (kommt im Return Tool vor)
  'Berner Brocki': [['X'], ['☑', 'ID', 'Bezeichnung', 'Barcode', 'VP', 'Lagerort'], [false, 'PG-9', 'Stuhl', '', 5, 'BRB-1']]
});
const erstellt = [];
let lockFrei = true;
const c = { console, JSON, Date, Math, Object, String, Number, Array, RegExp, Error, isFinite,
  SpreadsheetApp: { getActive: () => DB, openById: (id) => id === '1VexhXpyWyGTVaKiH7BPLPNQyENKYA-flgeRs-FPN-IA' ? DB : RT, flush() {}, create: (t) => { const s = datei({ 'Tabelle1': [] }); s.titel = t; erstellt.push(s); return s; } },
  DriveApp: { getFileById: () => ({ moveTo() {} }), getFolderById: () => ({}) },
  LockService: { getScriptLock: () => ({ tryLock: () => lockFrei, releaseLock() {} }) },
  Session: { getActiveUser: () => ({ getEmail: () => 'test@pg' }) },
  Utilities: { formatDate: (d, tz, f) => f === 'dd/MM/yyyy' ? '22/10/2026' : '22.10.2026 08:00:00' } };
vm.createContext(c); vm.runInContext(fs.readFileSync(__dirname + '/../apps/umpacken/Code.gs', 'utf8'), c);
/* einrichten ohne die Gestaltung (Basis braucht echte Sheets) */
vm.runInContext('basisEinrichten_ = function () { return []; };', c);
DB.sheets.push(blatt('Tabelle1', []));
c.einrichten();
assert.ok(DB.getSheetByName('Durchgänge') && DB.getSheetByName('Zuordnung') && DB.getSheetByName('Einstellungen').v.length === 5, 'einrichten legt Tabs und Einstellungen an');
const j = (x) => JSON.parse(JSON.stringify(x));

/* Setup: Lagerorte und nächste Nummer */
const o = j(c.lagerorte());
assert.deepStrictEqual(o.orte.map(x => x.ort), ['BRB-1', 'HOM-3', 'KID-7', 'KID-12', 'KID-4005176984105'], 'Lagerorte sortiert');
assert.strictEqual(o.naechste.KID, 'KID-13', 'nächste freie Kids-Palette');
assert.strictEqual(o.orte.find(x => x.ort === 'KID-7').anzahl, 2);

/* Setup-Fehler */
const geb = [{ name: 'Balu 1', art: 'Verkauf', abnehmer: 'Balu', lagerort: 'balu-1', preisregel: 'VP' }, { name: 'Balu 2', art: 'Verkauf', abnehmer: 'Balu', lagerort: 'BALU-2', preisregel: 'VP' },
  { name: 'Kids neu', art: 'Lager', lagerort: 'KID-13', preisregel: 'Prozent', prozent: 50 }, { name: 'Weg', art: 'Entsorgung' }];
assert.throws(() => c.anlegen({ name: 'X', quelle: 'rt', lagerorte: ['KID-7'], gebinde: [{ name: 'A', art: 'Verkauf', lagerort: 'B-1' }] }), /Abnehmer fehlt/);
assert.throws(() => c.anlegen({ name: 'X', quelle: 'rt', lagerorte: ['KID-7'], gebinde: [{ name: 'A', art: 'Lager', lagerort: 'KID-7' }] }), /auch ein Quell-Lagerort/);
assert.throws(() => c.anlegen({ name: 'X', quelle: 'rt', lagerorte: ['KID-7'], gebinde: [geb[0], Object.assign({}, geb[1], { lagerort: 'BALU-1' })] }), /zwei Gebinde/);
assert.throws(() => c.anlegen({ name: 'X', quelle: 'rt', lagerorte: [], gebinde: geb }), /Quell-Lagerort/);

/* Setup speichern */
const d = j(c.anlegen({ name: 'Kids → Balu', quelle: 'rt', lagerorte: ['KID-7', 'KID-12'], gebinde: geb, kuerzel: 'JB' }));
assert.strictEqual(d.id, 'U-0001'); assert.strictEqual(d.status, 'Scan');
assert.deepStrictEqual(d.bestand.map(p => p.id), ['PG-1', 'PG-2', 'PG-3', 'PG-5'], 'Bestand = Stücke der Quell-Lagerorte');
assert.strictEqual(d.gebinde[0].lagerort, 'BALU-1', 'Lagerort gross');
assert.strictEqual(d.gebinde[3].preisregel, 'Null', 'Entsorgung: Preis 0');
const G = d.gebinde.map(g => g.id);
assert.strictEqual(j(c.lagerorte()).naechste.KID, 'KID-14', 'KID-13 ist jetzt vergeben');

/* Scan */
let r = j(c.zuordnen('U-0001', [{ id: 'PG-1', gebinde: G[0], preis: '', vorher: '' }, { id: 'PG-2', gebinde: G[0], preis: '', vorher: '' }, { id: 'PG-3', gebinde: G[2], preis: '', vorher: '' }, { id: 'PG-4', gebinde: G[0], vorher: '' }], 'jb'));
assert.deepStrictEqual(r.konflikte.map(x => x.id), ['PG-4'], 'Stück ausserhalb der Quelle: Konflikt');
assert.strictEqual(r.zuordnung['PG-1'].gebinde, G[0]);
/* Jemand anderes verschiebt PG-2 nach Balu 2, ein veralteter Browser will es entfernen: Konflikt */
c.zuordnen('U-0001', [{ id: 'PG-2', gebinde: G[1], preis: '', vorher: G[0] }], 'xx');
r = j(c.zuordnen('U-0001', [{ id: 'PG-2', gebinde: '', preis: '', vorher: G[0] }], 'jb'));
assert.ok(r.konflikte.length === 1 && /jemand anderem/.test(r.konflikte[0].grund) && r.zuordnung['PG-2'].gebinde === G[1], 'veralteter Stand überschreibt nicht');
/* Preis von Hand, entfernen, Entsorgung */
c.zuordnen('U-0001', [{ id: 'PG-1', gebinde: G[0], preis: '15', vorher: G[0] }, { id: 'PG-5', gebinde: G[3], vorher: '' }], 'jb');
r = j(c.zuordnen('U-0001', [], 'jb'));
assert.strictEqual(r.zuordnung['PG-1'].preis, 15);
c.zuordnen('U-0001', [{ id: 'PG-5', gebinde: '', vorher: G[3] }], 'jb');
r = j(c.zuordnen('U-0001', [], 'jb'));
assert.ok(!r.zuordnung['PG-5'], 'entfernt');
c.zuordnen('U-0001', [{ id: 'PG-5', gebinde: G[3], vorher: '' }], 'jb');

/* Gebinde während des Scans ergänzen; belegtes Gebinde nicht löschbar */
const neuG = j(c.laden('U-0001')).gebinde.concat([{ name: 'Balu 3', art: 'Verkauf', abnehmer: 'Balu', lagerort: 'BALU-3', preisregel: 'VP' }]);
assert.strictEqual(j(c.gebindeAendern('U-0001', neuG)).gebinde.length, 5);
assert.throws(() => c.gebindeAendern('U-0001', neuG.slice(1)), /hat schon Stücke/);

/* Abschluss */
const warn = j(c.abschliessen('U-0001', 'JB'));
assert.ok(/XX \(1\)/.test(warn.warnung) && !warn.status, 'Abschluss warnt: XX hat eben noch zugeordnet');
const fertig = j(c.abschliessen('U-0001', 'JB', true));
assert.strictEqual(fertig.status, 'Abgeschlossen');
const a = fertig.aenderungen, nach = (id) => a.find(x => x.id === id);
assert.strictEqual(a.length, 4, 'vier Änderungen');
assert.ok(nach('PG-1').aktion === 'Verkaufen' && nach('PG-1').preis === 15 && nach('PG-1').neu === 'BALU-1' && nach('PG-1').abnehmer === 'Balu');
assert.ok(nach('PG-2').neu === 'BALU-2' && nach('PG-2').preis === 12.5, 'VP');
assert.ok(nach('PG-3').aktion === 'Lagerort ändern' && nach('PG-3').neu === 'KID-13' && nach('PG-3').preis === 6.25 && nach('PG-3').tab === 'Stationär' && nach('PG-3').zeile === '9', '50 % vom VP, Tab und Zeile');
assert.ok(nach('PG-5').aktion === 'Entsorgen' && nach('PG-5').preis === 0);
assert.strictEqual(erstellt.length, 1, 'ein Sheet pro Abnehmer');
assert.ok(/^\(22\/10\/2026\) Balu-Liste Kids → Balu$/.test(erstellt[0].titel), erstellt[0].titel);
const tot = erstellt[0].getSheetByName('Total').v;
assert.deepStrictEqual(tot[tot.length - 1], ['Total', 2, 27.5], 'Total Balu: 15 + 12.50');
assert.ok(erstellt[0].getSheetByName('Balu 1') && erstellt[0].getSheetByName('Balu 2') && !erstellt[0].getSheetByName('Balu 3'), 'Tabs nur für Gebinde mit Stücken');
assert.ok(/Balu: https/.test(fertig.listen));
assert.throws(() => c.zuordnen('U-0001', [], 'jb'), /nicht im Scan/, 'nach dem Abschluss kein Scan mehr');
assert.throws(() => c.abschliessen('U-0001'), /schon abgeschlossen/);
/* Return Tool nie geschrieben */
assert.strictEqual(RT.getSheetByName('Stationär').v[6][13], 'KID-7', 'Return Tool unverändert');

/* Erledigt und Wiederöffnen (seit 24.10.2026: Zeile mit PG-ID, Prüfung 24.10.2026 Befund 20) */
let e = j(c.erledigt('U-0001', [{ r: a[0].r, id: a[0].id }], true));
assert.ok(e[0].erledigt && !e[1].erledigt);
assert.throws(() => c.wiederOeffnen('U-0001'), /schon eingetragen/);
c.erledigt('U-0001', [{ r: a[0].r, id: a[0].id }], false);
assert.strictEqual(j(c.wiederOeffnen('U-0001')).status, 'Scan');
assert.strictEqual(j(c.laden('U-0001')).aenderungen.length, 0);

/* Manuelle Quelle: seit 24.10.2026 gegen das Return Tool aufgelöst (Prüfung 24.10.2026 Befund 6). Unbekannte IDs abgelehnt, Angaben aus dem Return Tool. */
assert.throws(() => c.anlegen({ name: 'Manuell', quelle: 'manuell', liste: 'ID\tBezeichnung\tVP\tLagerort\nPG-50\tRad\t30,50\tX-1\nPG-51\tHelm\t10\tX-1', gebinde: [{ name: 'Abnehmer A', art: 'Verkauf', abnehmer: 'A', lagerort: 'A-1', preisregel: 'VP' }] }), /nicht im Return Tool: PG-50, PG-51/);
const m = j(c.anlegen({ name: 'Manuell', quelle: 'manuell', liste: 'ID\tBezeichnung\tVP\tLagerort\npg 0004\tToaster\t30,50\tX-1', gebinde: [{ name: 'Abnehmer A', art: 'Verkauf', abnehmer: 'A', lagerort: 'A-1', preisregel: 'VP' }] }));
assert.ok(m.id === 'U-0002' && m.bestand.length === 1 && m.bestand[0].id === 'PG-4' && m.bestand[0].vp === 18 && m.bestand[0].ort === 'HOM-3' && m.quelle === 'Manuell', JSON.stringify(m.bestand));
assert.throws(() => c.anlegen({ name: 'M', quelle: 'manuell', liste: 'Bezeichnung\nRad', gebinde: geb.slice(0, 1) }), /ID/);
assert.throws(() => c.anlegen({ name: 'M', quelle: 'manuell', liste: 'ID\nPG-1\npg-1', gebinde: geb.slice(0, 1) }), /doppelt/);

/* Sperre besetzt */
lockFrei = false;
assert.throws(() => c.zuordnen('U-0002', [], 'jb'), /jemand anderes/);
lockFrei = true;
console.log('t_umpacken ok');
