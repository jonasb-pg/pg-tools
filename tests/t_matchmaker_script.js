/* Matchmaker-Script (apps/matchmaker/Code.gs), Datenintegrität (24.10.2026):
   Tageslauf behält Treffer und entfernt verschwundene (M5), Gruppe und Urteil mit Barcode/Link (M6), Ausschluss über ANALYSE TOOL «Analysen» und
   sichtbarer Hinweis, wenn nicht lesbar, Scanner ohne ID markiert (M7), Prüfen und Schreiben in der Dokument-Sperre.
   Version .2: alte Urteile ohne Produkt-Schlüssel gelten weiter über die Bezeichnung (Urteil mit Schlüssel gewinnt),
   Zwischenspeichern nach jeder Gruppe, höchstens PAARE_PRO_LAUF Paare pro Lauf mit Hinweis im Status.
   Sheets im Speicher, Claude gestubbt. Lauf: node tests/t_matchmaker_script.js */
const vm = require('vm'), fs = require('fs'), assert = require('assert'), crypto = require('crypto');
const sperre = { dok: false, dokBesetzt: false };
function blatt(name, v, ss) {
  const s = { v: v, name: name, ss: ss, breite: 26,
    getName: () => s.name, getParent: () => s.ss, getLastRow: () => s.v.length, getLastColumn: () => Math.max(0, ...s.v.map(z => z.length)), getMaxRows: () => Math.max(1000, s.v.length), getMaxColumns: () => s.breite,
    getDataRange: () => rng(s, 1, 1, Math.max(1, s.v.length), Math.max(1, s.getLastColumn())), getRange: (r, c, nr, nc) => rng(s, r, c, nr || 1, nc || 1),
    insertRowsAfter() {}, insertColumnsAfter(a, n) { s.breite += n; }, setFrozenRows() {}, setColumnWidth() {}, appendRow: (z) => s.v.push(z.slice()), deleteRow: (r) => s.v.splice(r - 1, 1) };
  return s;
}
const passtGeschrieben = [];
function rng(s, r, c, nr, nc) {
  const o = {
    getValues: () => { const a = []; for (let i = 0; i < nr; i++) { const z = []; for (let j = 0; j < nc; j++) z.push(((s.v[r - 1 + i] || [])[c - 1 + j]) ?? ''); a.push(z); } return a; },
    getDisplayValues: () => o.getValues().map(z => z.map(String)), getValue: () => ((s.v[r - 1] || [])[c - 1]) ?? '',
    setValues: (w) => { if (s.name === 'Matchmaker' && c === 5) passtGeschrieben.push(sperre.dok); w.forEach((z, i) => { s.v[r - 1 + i] = s.v[r - 1 + i] || []; z.forEach((x, j) => { s.v[r - 1 + i][c - 1 + j] = x; }); }); return o; },
    setValue: (x) => { s.v[r - 1] = s.v[r - 1] || []; s.v[r - 1][c - 1] = x; return o; },
    clearContent: () => { for (let i = 0; i < nr; i++) for (let j = 0; j < nc; j++) if (s.v[r - 1 + i]) s.v[r - 1 + i][c - 1 + j] = ''; return o; }
  };
  ['setBackgrounds', 'setBackground', 'setVerticalAlignment', 'setWrap', 'setNumberFormat', 'setFontColor', 'setFontSize', 'setFontWeight', 'insertCheckboxes', 'clearDataValidations', 'copyTo'].forEach(m => { o[m] = () => o; });
  return o;
}
function datei(tabs) {
  const ss = { toasts: [], getSheetByName: (n) => ss.sheets.find(s => s.name === n) || null, getNumSheets: () => ss.sheets.length, getSpreadsheetTimeZone: () => 'Europe/Zurich',
    insertSheet: (n) => { const s = blatt(n, [], ss); ss.sheets.push(s); return s; }, toast: (t) => ss.toasts.push(t) };
  ss.sheets = Object.keys(tabs).map(n => blatt(n, tabs[n], ss));
  return ss;
}
const pad = (n) => ('0' + n).slice(-2);
const fmt = (d, f) => f.replace('yyyy', d.getFullYear()).replace('MM', pad(d.getMonth() + 1)).replace('dd', pad(d.getDate())).replace('HH', pad(d.getHours())).replace('mm', pad(d.getMinutes()));
const heute = fmt(new Date(), 'dd.MM.yyyy');
const PROFIL1 = 'Art: Toaster\nMuss: –\nSuchwörter: toaster', PROFIL2 = 'Art: Wasserkocher\nMuss: –\nSuchwörter: wasserkocher';
const KOPF = ['Gesucht', 'Mehr Infos (was ist zwingend, was egal)', 'Limit CHF', 'Suchprofil (von Claude, anpassbar)', 'Passt', 'Ähnlich 1', 'Ähnlich 2', 'Ähnlich 3', 'Geholt'];
const kennung = (g, i, p) => Array.from(crypto.createHash('md5').update(g + '\n' + i + '\n' + p, 'utf8').digest()).slice(0, 5).map(x => ('0' + x.toString(16)).slice(-2)).join('');
const MM = datei({
  'Matchmaker': [['Matchmaker'], [''], KOPF, ['Toaster', '', 50, PROFIL1, '', '', '', '', false], ['Wasserkocher', '', 40, PROFIL2, '', '', '', '', false]],
  /* altes Urteil ohne Produkt-Schlüssel (vor 0e30fe8): gilt weiter für «Toaster Rot» (PG-5, hat Barcode), wird nicht neu geprüft */
  'Urteile': [['Kennung', 'Gesucht', 'Produkt', 'Urteil (passt / ähnlich / nein)', 'Hinweis', 'Geprüft am'], [kennung('Toaster', '', PROFIL1), 'Toaster', 'Toaster Rot', 'passt', 'alt', '01.10.2026']]
});
MM.sheets.find(s => s.name === 'Urteile').breite = 6;
const KRT = ['☑', 'ID', 'Sendung', 'Erfasst', 'Bezeichnung', '#', 'Barcode', 'Link', 'Kategorie', 'OVP', 'VP', 'Wert', 'CH', 'Lagerort'];
const z = (id, erf, bez, bc, link, vp, ort) => [false, id, '', erf, bez, 1, bc, link, '', 0, vp, vp, '', ort];
const RT = datei({
  'Stationär': [[], [], [], [], [], KRT,
    z('PG-1', '20.10.2026', 'Dualit Toaster', '0111', 'https://www.galaxus.ch/de/s1/product/dualit-toaster-toaster-111111', 50, 'HOM-1'),
    z('PG-2', '20.10.2026', 'Dualit Toaster', '222', 'https://www.galaxus.ch/de/s1/product/dualit-toaster-zubehoer-222222', 50, 'HOM-1'),   // gleiche Bezeichnung und VP, anderes Produkt
    z('PG-3', '20.10.2026', 'Kettle Wasserkocher', '333', '', 30, 'HOM-2'),
    z('PG-4', '20.10.2026', 'Toaster Philips', '444', '', 20, 'HOM-3'),
    z('PG-5', '20.10.2026', 'Toaster Rot', '555', '', 25, 'HOM-3')],
  'Scanner': [[], [], [], [], [], KRT.filter(k => k !== 'ID'), [false, '', '20.10.2026', 'Toaster Scanner', 1, '666', '', '', 0, 9, 9, '', 'HOM-45']],
  'Analyse': [[], [], [], [], [], KRT], 'Online': [[], [], [], [], [], KRT]
});
const AN = datei({ 'Analysen': [['Analyse-Nr', 'PG-ID', 'Reusable', 'Regal'], ['A-1', 'PG-4', 'Ja', 'Matchmaker'], ['A-2', 'PG-5', 'Nein', ''], ['A-3', 'PG-5', 'Ja', 'Analysiert']] });
let analyseKaputt = false, paareGeprueft = 0, beimPruefen = null;
const alerts = [];
/* Claude-Antwort: Zubehör = nein, sonst passt */
function antwort(q) {
  const frage = JSON.parse(q.payload).messages[0].content;
  const urteile = [];
  frage.split('\n').forEach(l => { const m = /^\[(\d+)\] (.*)$/.exec(l); if (!m) return; paareGeprueft++; urteile.push({ nr: Number(m[1]), urteil: /zubehoer/.test(m[2]) ? 'nein' : 'passt', hinweis: '' }); });
  return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ stop_reason: 'tool_use', content: [{ type: 'tool_use', input: { urteile: urteile } }] }) };
}
const c = { console, JSON, Date, Math, Object, String, Number, Array, RegExp, Error, isFinite, parseFloat, decodeURIComponent,
  SpreadsheetApp: { getActiveSpreadsheet: () => MM, getUi: () => ({ alert: (t) => alerts.push(t) }), flush() {},
    openById: (id) => { if (id === '1FpHJNeWZENdhgP6MqAYyOOEe1FN0tIZWOkRiYItOz2E') return RT; if (analyseKaputt) throw new Error('Kein Zugriff'); return AN; } },
  PropertiesService: { getScriptProperties: () => ({ getProperty: () => 'sk-test' }) },
  LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }),
    getDocumentLock: () => ({ tryLock: () => { if (sperre.dokBesetzt) return false; sperre.dok = true; return true; }, releaseLock: () => { sperre.dok = false; } }) },
  ScriptApp: { getProjectTriggers: () => [] },
  Utilities: { formatDate: (d, tz, f) => fmt(d, f), sleep() {}, DigestAlgorithm: {}, Charset: {},
    computeDigest: (a, t) => Array.from(crypto.createHash('md5').update(t, 'utf8').digest()).map(x => x > 127 ? x - 256 : x) },
  UrlFetchApp: { fetchAll: (reqs) => reqs.map(q => {
    if (beimPruefen) { beimPruefen(); beimPruefen = null; }
    return antwort(q);
  }) } };
vm.createContext(c);
const QUELLE = fs.readFileSync(__dirname + '/../apps/matchmaker/Code.gs', 'utf8');
vm.runInContext(QUELLE, c);
const mm = MM.getSheetByName('Matchmaker'), U = MM.getSheetByName('Urteile');
const zelle = (r, col) => String(mm.v[r - 1][col - 1] || '');
const status = () => String(mm.v[1][0]);
assert.ok(/const VERSION = '2026-10-24\.5'/.test(fs.readFileSync(__dirname + '/../apps/matchmaker/Code.gs', 'utf8')));

/* Lauf 1: ganzer Bestand */
paareGeprueft = 0;
c.sucheAlles();
assert.deepStrictEqual(alerts, [], 'kein Fehler: ' + alerts.join(' | '));
let p1 = zelle(4, 5);
assert.ok(/PG-1\b/.test(p1) && !/PG-2\b/.test(p1), 'M6: PG-1 und PG-2 (gleiche Bezeichnung und VP, anderer Barcode/Link) sind getrennte Produkte mit eigenem Urteil: ' + p1);
assert.ok(!/PG-4/.test(p1), 'M7: PG-4 (Regal Matchmaker im ANALYSE TOOL) weggelassen');
assert.ok(/PG-5/.test(p1) || /\+ 1 weitere/.test(p1), 'PG-5: letzte Zeile in «Analysen» gilt (Reusable Ja)');
/* 24.10.2026 (.3, Z12): Stücke ohne PG-ID nie unter «Passt», höchstens «Ähnlich» mit Hinweis */
const ae1 = () => [6, 7, 8].map(k => zelle(4, k)).join('\n');
assert.ok(!/ohne ID \(Scanner\)/.test(p1) && /ohne ID \(Scanner\)/.test(ae1()) && /ohne PG-ID/.test(ae1()), 'M7/Z12: Scanner-Zeile ohne ID gekennzeichnet, unter «Ähnlich»: ' + ae1());
assert.ok(/PG-3/.test(zelle(5, 5)), 'Wasserkocher: PG-3');
assert.ok(/1 Stück mit Ergebnis im ANALYSE TOOL .* weggelassen/.test(status()) && /1 Stück ohne ID \(Scanner\)/.test(status()), status());
assert.strictEqual(U.v[0][6], 'Produkt-Schlüssel', 'Urteile: Spalte Produkt-Schlüssel ergänzt');
assert.ok(U.v.slice(2).every(r => /\|(bc|link):|\|$/.test(r[6])), 'jedes neue Urteil hat den Produkt-Schlüssel');
assert.ok(U.v.some(r => r[2] === 'Dualit Toaster' && r[3] === 'nein' && /bc:222/.test(r[6])) && U.v.some(r => r[2] === 'Dualit Toaster' && r[3] === 'passt' && /bc:111/.test(r[6])), 'zwei Urteile für «Dualit Toaster» (führende Null im Barcode egal)');
assert.ok(passtGeschrieben.length === 1 && passtGeschrieben[0] === true, 'Ergebnis in der Dokument-Sperre geschrieben');
/* Rückfall: altes Urteil ohne Schlüssel liefert weiter den Treffer PG-5 und wird nicht neu bezahlt */
assert.ok(!U.v.slice(2).some(r => r[2] === 'Toaster Rot'), 'altes Urteil «Toaster Rot» gilt weiter, kein neues Urteil geschrieben');
assert.strictEqual(paareGeprueft, 4, 'nur Paare ohne Urteil an Claude (PG-1, PG-2, Scanner, PG-3), nicht PG-5 (PG-4 ausgeschlossen)');
assert.ok(/PG-5/.test(p1), 'PG-5 über das alte Urteil in «Passt»: ' + p1);

/* Lauf 2: heute erfasst. PG-6 neu, PG-3 verkauft. Seit 24.10.2026 (Entscheid Jonas): Tageslauf zeigt nur Stücke dieses Tages, nur Neues geht an Claude. */
RT.getSheetByName('Stationär').v.push(z('PG-6', heute, 'Toaster Neu', '777', '', 35, 'HOM-4'));
RT.getSheetByName('Stationär').v.splice(8, 1);      // PG-3
paareGeprueft = 0;
c.sucheHeute();
p1 = zelle(4, 5);
assert.ok(/PG-6/.test(p1) && !/PG-1\b/.test(p1) && !/PG-5/.test(p1), 'Tageslauf: nur der Treffer von heute (PG-6): ' + p1);
assert.strictEqual(zelle(5, 5), '', 'M5: Treffer auf PG-3 (nicht mehr im Bestand) entfernt');
assert.strictEqual(paareGeprueft, 1, 'nur das neue Stück wurde geprüft');
assert.ok(/nur Stücke dieses Tages/.test(status()), status());

/* Lauf 3: ANALYSE TOOL nicht lesbar: sichtbarer Hinweis, nichts still */
analyseKaputt = true;
c.sucheAlles();
assert.ok(/ACHTUNG: ANALYSE TOOL nicht lesbar \(Kein Zugriff\)/.test(status()), status());
assert.ok(/PG-4/.test(zelle(4, 5) + zelle(4, 6)) || /\+ \d weitere/.test(zelle(4, 5)), 'ohne ANALYSE TOOL nicht ausgeschlossen (und gemeldet)');
analyseKaputt = false;

/* Neueres Urteil mit Produkt-Schlüssel überschreibt das alte ohne Schlüssel */
U.v.push([kennung('Toaster', '', PROFIL1), 'Toaster', 'Toaster Rot', 'nein', 'von Hand', heute, 'toaster rot|bc:555']);
paareGeprueft = 0;
c.sucheAlles();
assert.ok(![4, 5, 6, 7].some(k => /PG-5/.test(zelle(4, k + 1))), 'PG-5: Urteil mit Schlüssel (nein) gewinnt über altes (passt)');
assert.ok(/PG-1\b/.test(zelle(4, 5)), 'übrige Treffer bleiben: ' + zelle(4, 5));
assert.strictEqual(paareGeprueft, 0, 'nichts neu geprüft');
assert.ok(U.v.some(r => r[2] === 'Toaster Rot' && !r[6]), 'alte Zeile bleibt stehen');

/* Sheet während der Suche verändert (24.10.2026 .3, Befund 15): unveränderte Aufträge bekommen ihr Ergebnis in ihrer jetzigen Zeile,
   der geänderte bleibt unberührt, Status rot. Früher wurde das ganze Ergebnis verworfen. */
RT.getSheetByName('Stationär').v.push(z('PG-7', heute, 'Toaster Blau', '888', '', 15, 'HOM-4'));
const vorher5 = JSON.stringify(mm.v[4].slice(4, 8));
beimPruefen = () => { mm.v[4][0] = 'Wasserkocher gross'; };
passtGeschrieben.length = 0;
c.sucheAlles();
assert.ok(alerts.length === 0 && passtGeschrieben.length === 1 && passtGeschrieben[0] === true && /PG-7/.test(zelle(4, 5)) && JSON.stringify(mm.v[4].slice(4, 8)) === vorher5,
  'veränderte Zeile nicht geschrieben, unveränderte schon (in der Sperre): ' + alerts.join(' | '));
assert.ok(/ACHTUNG: 1 Suchaufträge wurden während der Suche neu erfasst oder geändert/.test(status()), status());
mm.v[4][0] = 'Wasserkocher';

/* Haken «Geholt» während die Suche schreibt (Dokument-Sperre besetzt): nichts verschieben, Haken zurück */
const ev = (sh, r, col) => ({ range: { getSheet: () => sh, getRow: () => r, getLastRow: () => r, getColumn: () => col, getLastColumn: () => col, getValue: () => sh.v[r - 1][col - 1], setValue: (x) => { sh.v[r - 1][col - 1] = x; } } });
sperre.dokBesetzt = true;
mm.v[3][8] = true;
c.onEdit(ev(mm, 4, 9));
assert.ok(mm.v[3][0] === 'Toaster' && mm.v[3][8] === false && /Suche schreibt gerade/.test(MM.toasts.join(' ')), 'Sperre besetzt: Haken zurück, Zeile bleibt');
sperre.dokBesetzt = false;
mm.v[3][8] = true;
c.onEdit(ev(mm, 4, 9));
assert.ok(mm.v[3][0] === 'Wasserkocher' && MM.getSheetByName('Erledigt').v.some(r => r[1] === 'Toaster'), 'Sperre frei: Auftrag nach «Erledigt» verschoben');
assert.strictEqual(sperre.dok, false, 'Sperre wieder frei');

/* Zwischenspeichern und Limit: eigenes Sheet, eine Anfrage pro Gruppe (PARALLEL 1, 1 Paar pro Anfrage), höchstens 3 Paare pro Lauf */
const QUELLE2 = QUELLE.replace(/const PAARE_PRO_ANFRAGE = \d+;/, 'const PAARE_PRO_ANFRAGE = 1;').replace(/const PARALLEL = \d+;/, 'const PARALLEL = 1;').replace(/const PAARE_PRO_LAUF = \d+;/, 'const PAARE_PRO_LAUF = 3;');
assert.ok(/PAARE_PRO_ANFRAGE = 1;/.test(QUELLE2) && /PARALLEL = 1;/.test(QUELLE2) && /PAARE_PRO_LAUF = 3;/.test(QUELLE2), 'Konstanten gesetzt');
const MM2 = datei({
  'Matchmaker': [['Matchmaker'], [''], KOPF, ['Toaster', '', 50, PROFIL1, '', '', '', '', false]],
  'Urteile': [['Kennung', 'Gesucht', 'Produkt', 'Urteil (passt / ähnlich / nein)', 'Hinweis', 'Geprüft am', 'Produkt-Schlüssel'],
    [kennung('Toaster', '', PROFIL1), 'Toaster', 'Toaster Rot', 'ähnlich', 'alt', '01.10.2026', '']]
});
MM2.sheets.find(s => s.name === 'Urteile').breite = 7;
/* Variante: gleiche Bezeichnung «Toaster Rot», anderer Barcode → teilt das alte Urteil */
RT.getSheetByName('Stationär').v.push(z('PG-8', '20.10.2026', 'Toaster Rot', '999', '', 26, 'HOM-5'));
let aufrufe = 0, wirftBeim = 0;
/* Uhr für die Zeitbremse (24.10.2026 .3): uhrSprung rückt die Uhr beim nächsten Aufruf an Claude vor */
let uhr = Date.now(), uhrSprung = 0;
class UhrDate extends Date { constructor(...a) { if (a.length) super(...a); else super(uhr); } static now() { return uhr; } }
const c2 = Object.assign({}, c, {
  Date: UhrDate,
  SpreadsheetApp: Object.assign({}, c.SpreadsheetApp, { getActiveSpreadsheet: () => MM2 }),
  UrlFetchApp: { fetchAll: (reqs) => { aufrufe++; if (aufrufe === wirftBeim) throw new Error('Zeitlimit überschritten'); if (uhrSprung) { uhr += uhrSprung; uhrSprung = 0; } return reqs.map(antwort); } }
});
vm.createContext(c2);
vm.runInContext(QUELLE2, c2);
const mm2 = MM2.getSheetByName('Matchmaker'), U2 = MM2.getSheetByName('Urteile');
const status2 = () => String(mm2.v[1][0]);
const neueZeilen = () => U2.v.slice(2).length;
/* Offen: PG-1, PG-2, Scanner, PG-6, PG-7 (5 Paare); PG-5 und PG-8 über das alte Urteil, PG-4 ausgeschlossen */

/* a) Zeitbremse nach der ersten Gruppe: die erste ist gespeichert, der Rest steht im Status.
   (Bis .2 hiess der Fall «zweite Gruppe wirft, Lauf bricht ab». Seit Befund 10 bricht ein Verbindungsfehler den Lauf nicht mehr ab,
   die Gruppe wird nachgefragt; das prüft tests/t_matchmaker_p2410_zeit.js. Den Abbruch mitten im Lauf stellt hier die Zeitbremse nach.) */
alerts.length = 0; uhrSprung = 280000; aufrufe = 0; paareGeprueft = 0;
c2.sucheAlles();
assert.deepStrictEqual(alerts, [], 'kein Fehler: ' + alerts.join(' | '));
assert.strictEqual(aufrufe, 1, 'nach der Zeitbremse keine neue Gruppe');
assert.strictEqual(neueZeilen(), 1, 'Urteil der ersten Gruppe gespeichert');
assert.ok(U2.v[2][6] && U2.v[2][6].indexOf('|') > 0, 'mit Produkt-Schlüssel gespeichert');
assert.ok(/Noch 4 Paare offen – bitte nochmals starten\./.test(status2()) && /Zeitbremse/.test(status2()), status2());

/* b) Neustart: nur der Rest, höchstens 3 Paare, Hinweis im Status */
alerts.length = 0; wirftBeim = 0; aufrufe = 0; paareGeprueft = 0;
c2.sucheAlles();
assert.deepStrictEqual(alerts, [], 'kein Fehler: ' + alerts.join(' | '));
assert.strictEqual(paareGeprueft, 3, 'Limit: 3 Paare pro Lauf');
assert.strictEqual(aufrufe, 3, 'drei Gruppen');
assert.strictEqual(neueZeilen(), 4, 'jede Gruppe gespeichert');
assert.ok(/Noch 1 Paare offen – bitte nochmals starten\./.test(status2()), status2());
const ae = [6, 7, 8].map(k => String(mm2.v[3][k - 1] || '')).join(' ');
assert.ok(/PG-5/.test(ae) && /PG-8/.test(ae), 'Variante PG-8 teilt das alte Urteil «ähnlich» mit PG-5: ' + ae);

/* c) nochmals: der letzte Rest, kein Hinweis mehr; danach nichts mehr zu prüfen */
paareGeprueft = 0;
c2.sucheAlles();
assert.strictEqual(paareGeprueft, 1, 'nur noch der Rest');
assert.strictEqual(neueZeilen(), 5, 'alle 5 Paare gespeichert, keins doppelt');
assert.ok(!/Paare offen/.test(status2()), status2());
paareGeprueft = 0;
c2.sucheAlles();
assert.strictEqual(paareGeprueft, 0, 'alles beurteilt, nichts doppelt bezahlt');
assert.ok(!U2.v.slice(2).some(r => r[2] === 'Toaster Rot'), 'Toaster Rot (PG-5, PG-8) nie neu geprüft');
console.log('t_matchmaker_script ok');
