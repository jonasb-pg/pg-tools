/* Umpack Tool, Datenintegrität (24.10.2026): belegte Lagerorte über alle Tabs (S1), offene Durchgänge (S2), Barcode-Auflösung im Server (S3),
   Abschluss-Warnung (S4), fehlende Quell-Tabs (M1), Abgleich beim Abschluss (M2), Kleinigkeiten. Erfundene Daten. Lauf: node tests/t_umpacken_daten.js */
const vm = require('vm'), fs = require('fs'), assert = require('assert');
function blatt(name, v) {
  const s = { v: v, name: name, getName: () => s.name,
    getLastRow: () => s.v.length, getLastColumn: () => Math.max(0, ...s.v.map(z => z.length)), getMaxRows: () => Math.max(1000, s.v.length), getMaxColumns: () => 26,
    getDataRange: () => ({ getValues: () => s.v.map(z => z.slice()), setFontFamily() { return this; }, setFontSize() { return this; } }),
    appendRow: (z) => { s.v.push(z.slice()); }, getRange: (r, c, nr, nc) => rng(s, r, c, nr || 1, nc || 1), setName: (n) => { s.name = n; return s; },
    setFrozenRows() {}, autoResizeColumns() {} };
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
let nr = 0;
function datei(tabs, titel) {
  const sheets = Object.keys(tabs).map(n => blatt(n, tabs[n])), id = 'S' + (++nr);
  const ss = { sheets, titel, getSheetByName: (n) => sheets.find(s => s.name === n) || null, getSheets: () => sheets, getId: () => id, getUrl: () => 'https://docs.google.com/spreadsheets/d/' + id,
    insertSheet: (n) => { const s = blatt(n, []); sheets.push(s); return s; }, getName: () => ss.titel, rename: (t) => { ss.titel = t; } };
  return ss;
}
const K6 = ['☑', 'ID', 'Sendung', 'Erfasst', 'Bezeichnung', '#', 'Barcode', 'Link', 'Kategorie', 'OVP', 'VP', 'Wert', 'CH', 'Lagerort'];
const leer5 = [['TITEL'], [], [], [], []];
const st = (id, name, bc, vp, ort) => [false, id, '', '', name, 1, bc, '', 'Kids', 0, vp, vp, '', ort];
const DB = datei({});
const RT = datei({
  'Stationär': leer5.concat([K6,
    st('PG-1', 'Lego Zug', '111', 20, 'KID-7'),
    st('PG-2', 'Puppe', '0222', 12.5, 'KID-7'),         // EAN mit führender Null (UPC-A / EAN-13)
    st('PG-3', 'Puppe', '222', 12.5, 'KID-12'),
    st('PG-4', 'Puppe gross', '333', 10, 'KID-7'),
    st('PG-5', 'Puppe gross', '333', 15, 'KID-7'),      // gleiche EAN, anderer VP
    st('PG-6', 'Holzbox', '', 5, 'KID-7'),              // ohne Barcode
    st('PG-7', 'Toaster', '444', 18, 'HOM-3')]),
  'Scanner': leer5.concat([['☑', 'Sendung', 'Erfasst', 'Bezeichnung', '#', 'Barcode', 'Link', 'Kategorie', 'OVP', 'VP', 'Wert', 'CH', 'Lagerort'],
    [false, '', '', 'Lampe', 1, '777', '', 'Home', 0, 9, 9, '', 'HOM-45'], [false, '', '', 'Lampe', 1, '777', '', 'Home', 0, 9, 9, '', 'hom-45']]),   // Scanner ohne ID
  'Analyse': leer5.concat([K6, st('PG-50', 'Mixer', '888', 9, 'KID-13')]),
  'Archiv Stationär': leer5.concat([K6, st('PG-60', 'Alt', '', 3, 'KID-14'), st('PG-61', 'Alt', '', 3, 'KIDS-15')]),
  'Dashboard': [['Zahlen'], ['ohne Lagerort-Spalte']]
});
const CACHE = {};
const erstellt = [];
let lockFrei = true, rtKaputt = false, driveKaputt = false;
const c = { console, JSON, Date, Math, Object, String, Number, Array, RegExp, Error, isFinite,
  SpreadsheetApp: { openById: (id) => { if (id === '1VexhXpyWyGTVaKiH7BPLPNQyENKYA-flgeRs-FPN-IA') return DB; if (rtKaputt) throw new Error('Keine Berechtigung'); return RT; }, flush() {},
    create: (t) => { const s = datei({ 'Tabelle1': [] }, t); erstellt.push(s); return s; },
    openByUrl: (u) => { const s = erstellt.find(x => x.getUrl() === u); if (!s) throw new Error('nicht gefunden'); return s; } },
  DriveApp: { getFileById: () => ({ moveTo() { if (driveKaputt) throw new Error('Ordner fehlt'); }, setSharing() { if (driveKaputt) throw new Error('Richtlinie'); } }), getFolderById: () => ({}), Access: {}, Permission: {} },
  LockService: { getScriptLock: () => ({ tryLock: () => lockFrei, releaseLock() {} }) },
  CacheService: { getScriptCache: () => ({ get: k => CACHE[k] || null, putAll: o => Object.assign(CACHE, o) }) },
  Session: { getActiveUser: () => ({ getEmail: () => 'test@pg' }) },
  Utilities: { formatDate: (d, tz, f) => f === 'dd/MM/yyyy' ? '24/10/2026' : c.UHR } , UHR: '24.10.2026 08:00:00' };
vm.createContext(c); vm.runInContext(fs.readFileSync(__dirname + '/../apps/umpacken/Code.gs', 'utf8'), c);
vm.runInContext('basisEinrichten_ = function () { return []; };', c);
c.einrichten();
const j = (x) => JSON.parse(JSON.stringify(x));
assert.strictEqual(c.start().version, '2026-10-26.4');   // Prüfung 24.10.2026

/* S1 / M1: nächste Palette über alle Tabs (Scanner ohne ID, Analyse, Archiv), fehlende Quell-Tabs */
let o = j(c.lagerorte());
assert.strictEqual(o.naechste.HOM, 'HOM-46', 'Scanner hat HOM-45: nächste HOM-46 (vorher HOM-4)');
assert.strictEqual(o.naechste.KID, 'KID-16', 'KID-13 (Analyse), KID-14 (Archiv) belegt, KID-15 ähnelt KIDS-15: KID-16');
assert.ok(o.belegt.indexOf('HOM-45') > -1 && o.belegt.indexOf('KID-13') > -1, 'belegt enthält Scanner und Analyse');
assert.deepStrictEqual(o.fehlend, ['Berner Brocki', 'Caritas', 'Heilsarmee', 'Online'], 'fehlende Quell-Tabs werden gemeldet (Vorgabe seit 24.10.2026 ohne «Spenden», Vertrag V4)');
assert.ok(!o.orte.some(x => x.ort === 'HOM-45' || x.ort === 'KID-13'), 'Quelle nur aus Quell-Tabs mit ID');

const lager = (ort) => [{ name: 'Neu', art: 'Lager', lagerort: ort, preisregel: 'VP' }];
assert.throws(() => c.anlegen({ name: 'A', quelle: 'rt', lagerorte: ['KID-7'], gebinde: lager('hom - 45') }), /HOM-45» ist schon belegt: im Return Tool \(Scanner: 2 Stück\)/, 'Scanner-Lagerort, Gross/Klein und Leerzeichen egal');
assert.throws(() => c.anlegen({ name: 'A', quelle: 'rt', lagerorte: ['KID-7'], gebinde: lager('KID-14') }), /Archiv Stationär: 1/, 'Archiv-Lagerort abgelehnt');
assert.throws(() => c.anlegen({ name: 'A', quelle: 'rt', lagerorte: ['KID-7'], gebinde: lager('KID-13') }), /Analyse: 1/, 'Analyse-Lagerort abgelehnt');
/* Ähnliche Schreibweise nur als Hinweis */
const a1 = j(c.anlegen({ name: 'A', quelle: 'rt', lagerorte: ['KID-7'], gebinde: lager('KID-15'), kuerzel: 'JB' }));
assert.strictEqual(a1.id, 'U-0001');
assert.ok(a1.hinweise.some(h => /KID-15» ähnelt .*KIDS-15/.test(h)), 'KIDS-15 / KID-15: Hinweis, kein Fehler');
assert.ok(a1.hinweise.some(h => /1 Stücke ohne Barcode: nur per PG-ID-Etikett/.test(h)), 'Hinweis ohne Barcode');
assert.ok(a1.hinweise.some(h => /Quell-Tabs nicht gelesen: Berner Brocki/.test(h)), 'M1 im Setup-Ergebnis');
assert.deepStrictEqual(a1.bestand.map(p => p.id), ['PG-1', 'PG-2', 'PG-4', 'PG-5', 'PG-6']);

/* S2: Stück schon in offenem Durchgang, Lagerort neu schon in offenem Gebinde */
assert.throws(() => c.anlegen({ name: 'B', quelle: 'rt', lagerorte: ['KID-7'], gebinde: lager('KID-20') }), /schon in einem anderen Durchgang: PG-1 in U-0001 \(offen\)/);
assert.throws(() => c.anlegen({ name: 'B', quelle: 'rt', lagerorte: ['HOM-3'], gebinde: lager('kid-15') }), /KID-15» ist schon belegt: im offenen Durchgang U-0001/);
assert.throws(() => c.anlegen({ name: 'B', quelle: 'manuell', liste: 'ID\tLagerort\nPG-2\tKID-7', gebinde: lager('X-1') }), /PG-2 in U-0001/, 'auch bei einer Liste von Hand');
assert.strictEqual(j(c.lagerorte()).naechste.KID, 'KID-16', 'KID-15 ist im offenen Durchgang belegt');
const a2 = j(c.anlegen({ name: 'B', quelle: 'rt', lagerorte: ['HOM-3'], gebinde: [{ name: 'Balu 1', art: 'Verkauf', abnehmer: 'Balu', lagerort: 'BALU-1', preisregel: 'VP' }], kuerzel: 'JB' }));
assert.strictEqual(a2.id, 'U-0002');
/* gebindeAendern: neuer Lagerort gegen andere offene Gebinde und Return Tool; die eigenen bleiben erlaubt */
const g1 = j(c.laden('U-0001')).gebinde;
assert.throws(() => c.gebindeAendern('U-0001', g1.concat([{ name: 'Balu X', art: 'Verkauf', abnehmer: 'Balu', lagerort: 'balu-1', preisregel: 'VP' }])), /BALU-1» ist schon belegt: im offenen Durchgang U-0002/);
assert.throws(() => c.gebindeAendern('U-0001', g1.concat([{ name: 'H', art: 'Lager', lagerort: 'HOM-45', preisregel: 'VP' }])), /Scanner/);
const G = j(c.gebindeAendern('U-0001', g1.concat([{ name: 'Weg', art: 'Entsorgung' }]))).gebinde.map(g => g.id);
assert.strictEqual(G.length, 2, 'eigener Lagerort KID-15 bleibt erlaubt');

/* S3: zwei Scanner, gleiche EAN, gleiches Gebinde: der Server gibt zwei verschiedene Stücke */
let r1 = j(c.zuordnen('U-0001', [{ code: '222', wunsch: 'PG-2', gebinde: G[0], preis: '', vorher: '' }], 'AA'));
assert.deepStrictEqual(r1.ergebnis.map(x => x.id), ['PG-2'], 'EAN 222 findet PG-2 mit 0222 (führende Null)');
let r2 = j(c.zuordnen('U-0001', [{ code: '0222', wunsch: 'PG-2', gebinde: G[0], preis: '', vorher: '' }], 'BB'));
assert.ok(r2.konflikte.length === 1 && /alle 1 Stücke mit diesem Barcode sind schon zugeordnet/.test(r2.konflikte[0].grund), 'zweiter Scanner: nur ein Stück in der Quelle, Konflikt statt Doppelbuchung');
/* Gleiche EAN, verschiedener VP: PG-ID verlangen; nach einer PG-ID bleibt ein freies Stück → Barcode geht */
let r3 = j(c.zuordnen('U-0001', [{ code: '333', wunsch: 'PG-4', gebinde: G[0], vorher: '' }], 'AA'));
assert.ok(/verschiedenem VP, PG-ID scannen/.test(r3.konflikte[0].grund) && !r3.zuordnung['PG-4'], 'verschiedener VP: PG-ID scannen');
c.zuordnen('U-0001', [{ id: 'PG-5', gebinde: G[0], vorher: '' }], 'AA');
r3 = j(c.zuordnen('U-0001', [{ code: '333', wunsch: 'PG-5', gebinde: G[0], vorher: '' }], 'BB'));
assert.deepStrictEqual(r3.ergebnis.map(x => x.id), ['PG-4'], 'Wunsch vergeben: Server nimmt das andere freie Stück');
/* vorher '' auf ein belegtes Stück: immer Konflikt, auch im gleichen Gebinde */
let r4 = j(c.zuordnen('U-0001', [{ id: 'PG-2', gebinde: G[0], vorher: '' }], 'BB'));
assert.ok(r4.konflikte.length === 1 && /schon in Neu \(AA\)/.test(r4.konflikte[0].grund) && r4.konflikte[0].gleich === false, 'anderer Scanner: Konflikt');
r4 = j(c.zuordnen('U-0001', [{ id: 'PG-2', gebinde: G[0], vorher: '' }], 'AA'));
assert.ok(r4.konflikte[0].gleich === true, 'gleiches Kürzel, gleiches Gebinde: als «schon gespeichert» erkennbar');
const zz = DB.getSheetByName('Zuordnung').v.filter(z => z[0] === 'U-0001' && z[1] === 'PG-2');
assert.strictEqual(zz.length, 1, 'PG-2 genau einmal gespeichert');
/* Wiederholter Barcode-Scan (Antwort nicht angekommen): kein zweites Stück, sondern «schon gespeichert» (Review 24.10.2026) */
let r5 = j(c.zuordnen('U-0001', [{ code: '111', wunsch: 'PG-1', gebinde: G[0], vorher: '', sid: 'scan-a' }], 'AA'));
assert.deepStrictEqual(r5.ergebnis.map(x => x.id), ['PG-1']);
r5 = j(c.zuordnen('U-0001', [{ code: '111', wunsch: 'PG-1', gebinde: G[0], vorher: '', sid: 'scan-a' }], 'AA'));
assert.ok(r5.konflikte.length === 1 && r5.konflikte[0].gleich === true && r5.konflikte[0].id === 'PG-1' && !r5.ergebnis.length, 'gleiche Scan-Kennung: schon gespeichert');
r5 = j(c.zuordnen('U-0001', [{ code: '111', wunsch: 'PG-1', gebinde: G[0], vorher: '' }], 'AA'));
assert.ok(r5.konflikte[0].gleich === true, 'ohne Kennung (alte Seite): Wunsch schon im gleichen Gebinde vom gleichen Kürzel = schon gespeichert');
assert.strictEqual(DB.getSheetByName('Zuordnung').v.filter(z => z[0] === 'U-0001' && z[1] === 'PG-1').length, 1, 'PG-1 genau einmal');
/* Unbekannter Barcode; Stück ohne Barcode nur per PG-ID */
assert.ok(/nicht in der Quelle/.test(j(c.zuordnen('U-0001', [{ code: '999', wunsch: '', gebinde: G[0], vorher: '' }], 'AA')).konflikte[0].grund));
assert.ok(!j(c.zuordnen('U-0001', [{ id: 'PG-6', gebinde: G[0], vorher: '' }], 'AA')).konflikte.length, 'PG-6 per PG-ID');

/* S4: Abschluss warnt bei Zuordnungen anderer in den letzten 2 Minuten, nicht bei eigenen oder älteren */
assert.ok(/BB \(1\)/.test(j(c.abschliessen('U-0001', 'AA')).warnung), 'BB hat eben zugeordnet');
c.UHR = '24.10.2026 08:03:00';
/* M2: Return Tool hat sich seit dem Setup verändert (PG-4 umgezogen, PG-5 weg), PG-1 und PG-2 unverändert; Verschieben der Liste klappt nicht */
c.zuordnen('U-0001', [{ id: 'PG-1', gebinde: G[1], vorher: '' }], 'AA');
c.UHR = '24.10.2026 08:06:00';
const S = RT.getSheetByName('Stationär').v;
S[9][13] = 'KID-8'; S.splice(10, 1);      // PG-4 jetzt KID-8, PG-5 gelöscht
RT.getSheetByName('Archiv Stationär').v.push(st('PG-2', 'Puppe', '0222', 12.5, 'KID-7'));   // PG-2 steht doppelt
rtKaputt = true;
assert.throws(() => c.abschliessen('U-0001', 'AA'), /Return Tool ist nicht lesbar, der Abschluss ist abgebrochen/);
rtKaputt = false;
const f = j(c.abschliessen('U-0001', 'AA'));
assert.strictEqual(f.status, 'Abgeschlossen', 'keine Warnung: letzte fremde Zuordnung älter als 2 Minuten');
const p = (id) => f.aenderungen.find(x => x.id === id);
assert.ok(/^ABWEICHUNG: Lagerort jetzt «KID-8» statt «KID-7»/.test(p('PG-4').pruefung), p('PG-4').pruefung);
assert.ok(/nicht mehr im Return Tool/.test(p('PG-5').pruefung));
assert.ok(/steht 2× im Return Tool/.test(p('PG-2').pruefung));
assert.strictEqual(p('PG-1').pruefung, 'ok'); assert.strictEqual(p('PG-6').pruefung, 'ok');
assert.strictEqual(p('PG-6').zeile, '11', 'Zeile aus dem neuen Stand (Hinweis), PG-6 ist nach oben gerückt');
assert.ok(f.hinweise[0] === '3 Abweichungen zum Return Tool: vor dem Eintragen prüfen (Spalte «Prüfung»).', f.hinweise[0]);

/* Wiederöffnen: alte Abnehmer-Liste im Titel UNGÜLTIG */
c.zuordnen('U-0002', [{ id: 'PG-7', gebinde: j(c.laden('U-0002')).gebinde[0].id, vorher: '' }], 'JB');
driveKaputt = true;
const f2 = j(c.abschliessen('U-0002', 'JB'));
assert.ok(f2.hinweise.some(h => /Meine Ablage/.test(h)) && f2.hinweise.some(h => /nicht für Pretty Good freigegeben/.test(h)), 'Ablage und Freigabe nicht still');
driveKaputt = false;
assert.ok(/^Balu: https/.test(f2.listen));
const w = j(c.wiederOeffnen('U-0002'));
assert.strictEqual(w.status, 'Scan'); assert.strictEqual(w.listen, '');
assert.ok(/^UNGÜLTIG – \(24\/10\/2026\) Balu-Liste B$/.test(erstellt[erstellt.length - 1].titel), erstellt[erstellt.length - 1].titel);
/* Abgeschlossen mit nicht eingetragenen Änderungen: Stücke und Lagerorte bleiben belegt */
assert.throws(() => c.anlegen({ name: 'C', quelle: 'rt', lagerorte: ['KID-7'], gebinde: lager('KID-30') }), /PG-1 in U-0001 \(Änderung noch nicht im Return Tool eingetragen\)/);
assert.strictEqual(j(c.lagerorte()).naechste.KID, 'KID-16', 'KID-15 von U-0001 belegt, solange nicht eingetragen');

/* Liste von Hand: Anführungszeichen im CSV */
const m = j(c.manuellLesen_('ID,Bezeichnung,VP,Lagerort\nPG-90,"Tisch, rund ""Eiche""","1,234.50",X-1\nPG-91,Stuhl,"12,50",X-1'));
assert.strictEqual(m[0].name, 'Tisch, rund "Eiche"'); assert.strictEqual(m[0].vp, 1234.5); assert.strictEqual(m[0].ort, 'X-1'); assert.strictEqual(m[1].vp, 12.5);
/* Zahlen */
[["1'234.50", 1234.5], ['1,234.50', 1234.5], ['1234,50', 1234.5], ['1.234,50', 1234.5], ['1,5', 1.5], ['CHF 12.-', 12], ['1,234', 1234], ['12.5', 12.5], ['1.234.567', 1234567], ['', 0], [7, 7]]
  .forEach(x => assert.strictEqual(c.zahl_(x[0]), x[1], 'zahl_ ' + x[0]));
assert.strictEqual(c.bcKey_("'00012345"), '12345'); assert.strictEqual(c.ortKey_(' kid 7 '), 'KID7'); assert.strictEqual(c.ortAehnlich_('KIDS-08'), 'KID-8');
console.log('t_umpacken_daten ok');
