/* Tempo Ricardo Tool (19.10.2026): Tabs pro Aufruf nur einmal lesen, in Sperren frisch, Einstellungen und ANALYSE TOOL im Zwischenspeicher. Lauf: node tests/t_ricardo_tempo.js */
const vm = require('vm'), fs = require('fs');
let fehler = 0; const ok = (b, m) => { if (!b) { fehler++; console.log('FEHLER', m); } else console.log('ok', m); };
let lesen = {}, cache = {}, oeffnen = 0;
function blatt(name, d) {
  return { getName: () => name, getLastRow: () => d.length, getMaxColumns: () => 60,
    getRange: (r, c, nr, nc) => {
      if (typeof r === 'number' && r === 2 && nr > 1) lesen[name] = (lesen[name] || 0) + 1;
      return { getValues: () => { const o = []; for (let i = 0; i < (nr || 1); i++) { const z = []; for (let j = 0; j < (nc || 1); j++) z.push((d[r - 1 + i] || [])[c - 1 + j] ?? ''); o.push(z); } return o; },
        setValue: (v) => { d[r - 1][c - 1] = v; }, setValues: (v) => { v.forEach((z, i) => z.forEach((x, j) => { d[r - 1 + i][c - 1 + j] = x; })); } };
    },
    getRangeList: (a1) => ({ setValue: (v) => a1.forEach(a => { const m = /^([A-Z]+)(\d+)$/.exec(a); d[Number(m[2]) - 1][m[1].charCodeAt(0) - 65] = v; }) }),
    getDataRange: () => ({ getValues: () => d.map(z => z.slice()) }), appendRow: (z) => d.push(z) };
}
const c = { console, JSON, Date, Math, Object, String, Number, Array, RegExp, Error, Buffer };
vm.createContext(c);
const code = fs.readFileSync(__dirname + '/../apps/ricardo/Code.gs', 'utf8');
vm.runInContext(code, c);
const L_COLS = vm.runInContext('L_COLS', c), V_COLS = vm.runInContext('V_COLS', c), R_COLS = vm.runInContext('R_COLS', c);
const zeile = (cols, o) => cols.map(k => o[k] ?? '');
const L = [L_COLS.slice(), zeile(L_COLS, { 'PG-ID': 'PG-1', 'Status': 'Gelistet', 'Bezeichnung': 'Toaster' }), zeile(L_COLS, { 'PG-ID': 'PG-2', 'Status': 'In Arbeit', 'Bezeichnung': 'Föhn', 'Angelegt am': new Date(Date.now() - 5 * 3600000) })];
const V = [V_COLS.slice(), zeile(V_COLS, { 'Verkauf-Nr': '1', 'PG-ID': 'PG-9', 'Status': 'Zu packen' }), zeile(V_COLS, { 'Verkauf-Nr': '2', 'PG-ID': 'PG-8', 'Status': 'Bereit zum Versand' })];
const R = [R_COLS.slice(), zeile(R_COLS, { 'Retoure-Nr': 'R-1', 'Status': 'Offen' })];
const E = [['Einstellung', 'Wert'], ['Laufzeit Tage', '6'], ['Regal Online', 'Ricardo Online']];
const A = [['PG-ID', 'Titel', 'Artikelbeschrieb', 'Bezeichnung'], ['PG-50', 'Mixer', 'Text', 'Mixer M']];
const SH = { Listings: blatt('Listings', L), 'Verkäufe': blatt('Verkäufe', V), Retouren: blatt('Retouren', R), Einstellungen: blatt('Einstellungen', E), Log: blatt('Log', [['Zeit']]) };
const ANA = { Ricardo: blatt('Ricardo', A) };
let gesperrt = 0;
Object.assign(c, {
  SpreadsheetApp: { getActive: () => ({ getSheetByName: n => SH[n] }), openById: () => { oeffnen++; return { getSheetByName: n => ANA[n] }; } },
  CacheService: { getScriptCache: () => ({ get: k => cache[k] ?? null, put: (k, v) => { cache[k] = v; }, remove: k => { delete cache[k]; }, getAll: ks => { const o = {}; ks.forEach(k => { if (cache[k] !== undefined) o[k] = cache[k]; }); return o; }, putAll: (o) => Object.assign(cache, o) }) },
  LockService: { getScriptLock: () => ({ waitLock() { gesperrt++; }, tryLock() { gesperrt++; return true; }, releaseLock() { gesperrt--; } }) },
  Utilities: { formatDate: () => '0', newBlob: (x) => ({ getBytes: () => Buffer.from(typeof x === 'string' ? x : x), getDataAsString: () => Buffer.from(x).toString() }),
    gzip: (b) => b, ungzip: (b) => b, base64Encode: (b) => Buffer.from(b).toString('base64'), base64Decode: (s) => Buffer.from(s, 'base64') },
  Session: { getActiveUser: () => ({ getEmail: () => 'test@example.ch' }) },
  PropertiesService: { getScriptProperties: () => ({ getProperty: () => null }) }
});
const neu = () => vm.runInContext('MEMO = {}; CFG = null; ANALYSE_FRISCH = null; IN_SPERRE = 0;', c);   // neuer Aufruf der Web-App
const run = (s) => vm.runInContext(s, c);

/* 1. Listings im gleichen Aufruf nur einmal gelesen */
neu(); lesen = {};
run("alleListings_(); listingsIndex_(); zaehleAktive_(); uebersicht(); findeZeile_(SpreadsheetApp.getActive().getSheetByName('Listings'), 'PG-1')");
ok(lesen.Listings === 1, 'Listings fünfmal gebraucht, einmal gelesen (' + lesen.Listings + ')');
/* 2. Kopien: Änderungen an Zeilen bleiben lokal */
run("alleListings_()[0]['Status'] = 'X'");
ok(run("alleListings_()[0]['Status']") === 'Gelistet', 'Änderung am Ergebnis ändert den Speicher nicht');
/* 3. Schreiben in einer Sperre: danach frisch */
run("(function () { const l = sperre_(1000); try { const sh = SpreadsheetApp.getActive().getSheetByName('Listings'); const z = findeZeile_(sh, 'PG-1'); const rec = zeileZuRec_(sh, z); rec['Status'] = 'Verkauft'; schreibe_(sh, z, rec, true); } finally { l.releaseLock(); } })()");
ok(run("alleListings_()[0]['Status']") === 'Verkauft' && gesperrt === 0, 'nach der Sperre: der geschriebene Stand, Sperre frei');
lesen = {};
run("(function () { const l = sperre_(1000); try { alleListings_(); alleListings_(); } finally { l.releaseLock(); } })()");
ok(lesen.Listings === 2, 'in der Sperre immer frisch gelesen');
run("const l2 = sperre_(1000); l2.releaseLock(); l2.releaseLock();");
ok(gesperrt === 0 && run('IN_SPERRE') === 0, 'zweimal freigeben schadet nicht');
/* 4. Angefangene verwerfen: ein Schreibzugriff, danach frisch */
neu();
ok(run('angefangeneVerwerfen_()') === 1 && L[2][1] === 'Abgebrochen' && run("alleListings_()[1]['Status']") === 'Abgebrochen', 'angefangenes Listing verworfen, Speicher nachgeführt');
/* 5. Verkäufe: aufgaben-artige Mehrfachlesung, zaehler in einem Aufruf */
neu(); lesen = {};
const z = run('zaehler()');
ok(z.zuPacken === 1 && z.versand === 1 && z.offen === 2 && z.retouren === 1, 'zaehler: Marken stimmen ' + JSON.stringify(z));
run('alleVerkaeufe_(); verkaeufe()');
ok(lesen['Verkäufe'] === 1, 'Verkäufe dreimal gebraucht, einmal gelesen');
/* 6. Einstellungen im Zwischenspeicher; Änderung von Hand (onEdit) gilt sofort */
neu(); cache = {}; lesen = {};
run("cfg_('Laufzeit Tage')"); neu(); run("cfg_('Laufzeit Tage')");
ok(lesen.Einstellungen === 1, 'Einstellungen im nächsten Aufruf aus dem Zwischenspeicher');
E[1][1] = '9'; run("onEdit({ range: { getSheet: function () { return { getName: function () { return 'Einstellungen'; } }; } } })"); neu();
ok(run("cfg_('Laufzeit Tage')") === '9', 'nach onEdit frisch');
/* 7. ANALYSE TOOL: Liste aus der Kopie, Listing immer frisch */
neu(); cache = {}; oeffnen = 0;
run('leseAnalyse_()'); neu(); run('leseAnalyse_()');
ok(oeffnen === 1, 'Liste der Analyse: zweiter Aufruf ohne das ANALYSE TOOL zu öffnen');
A.push(['PG-51', 'Neu', 'Text', 'Neues Stück']); neu();
ok(run("findeAnalyse_('PG-51') !== null") && oeffnen === 2, 'eben analysiertes Stück: findeAnalyse_ liest frisch');
run("findeAnalyse_('PG-51'); findeAnalyse_('PG-50')");
ok(oeffnen === 2, 'im gleichen Aufruf nur einmal geöffnet');
/* 8. Weg A: uiTempo schreibt eine Zeile «Tempo UI», ohne Sperre, und nimmt nur gültige Namen */
const logs = []; vm.runInContext('log_ = function (a, id, d) { LOGS.push([a, d]); }', Object.assign(c, { LOGS: logs }));
const g0 = gesperrt;
run("uiTempo([{ n: 'ablauf', anzahl: 4, median: 1200, max: 4100, blk: 1 }, { n: 'x<script>', anzahl: 1, median: 1, max: 1 }, { n: 'setzeVerkauf', anzahl: 2, median: 900, max: 1500, blk: 0 }])");
ok(logs.length === 1 && logs[0][0] === 'Tempo UI' && logs[0][1] === 'ablauf 4× Median 1.2 s, max 4.1 s, 1× wartend · setzeVerkauf 2× Median 0.9 s, max 1.5 s', 'uiTempo: eine Zeile, Median/Max in s ' + JSON.stringify(logs));
ok(gesperrt === g0, 'uiTempo ohne Sperre');
run('uiTempo([])'); run("uiTempo('quatsch')");
ok(logs.length === 1, 'leer oder ungültig: keine Zeile');
console.log(fehler ? 'Fehler: ' + fehler : 'alle Tests ok'); process.exit(fehler ? 1 : 0);
