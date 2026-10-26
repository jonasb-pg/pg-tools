/* Testgerüst für die Prüfung 24.10.2026 (Matchmaker-Script, Version .3): Sheets im Speicher (Matchmaker Sheet, Return Tool, ANALYSE TOOL,
   Ricardo Tool, Umpack Tool), Claude gestubbt, Uhr steuerbar, Protokoll von Sperre, flush und Schreibzugriffen. Erfundene Daten.
   Wird von tests/t_matchmaker_p2410_*.js geladen. Direkt aufgerufen (node tests/t_matchmaker_p2410_h.js) prüft es nur, dass Code.gs lädt. */
const vm = require('vm'), fs = require('fs'), crypto = require('crypto'), path = require('path'), assert = require('assert');
const DATEI = path.join(__dirname, '../apps/matchmaker/Code.gs');
const QUELLE = fs.readFileSync(DATEI, 'utf8');
const ID = { RT: '1FpHJNeWZENdhgP6MqAYyOOEe1FN0tIZWOkRiYItOz2E', AN: '1jhmq1JoyM6Xor33pM77AmOixbvqKuGzfFX-js9PdIrM',
  RIC: '1liRzxIAKCSKGS5-uN3FkFcboN_Luqd2Ar5Ae57cSmvg', UMP: '1VexhXpyWyGTVaKiH7BPLPNQyENKYA-flgeRs-FPN-IA' };
const pad = (n) => ('0' + n).slice(-2);
const fmt = (d, f) => f.replace('yyyy', d.getFullYear()).replace('MM', pad(d.getMonth() + 1)).replace('dd', pad(d.getDate())).replace('HH', pad(d.getHours())).replace('mm', pad(d.getMinutes()));
const START = new Date(2026, 9, 24, 10, 0, 0).getTime();     // Samstag, 24.10.2026, 10:00
const HEUTE = '24.10.2026';
/* Live-Kopf Tab «Matchmaker» (Spalte J «Aus Analyse» vom Analyse Tool) */
const KOPF = ['Gesucht', 'Mehr Infos (was ist zwingend, was egal)', 'Limit CHF', 'Suchprofil (von Claude, anpassbar)', 'Passt', 'Ähnlich 1', 'Ähnlich 2', 'Ähnlich 3', 'Geholt', 'Aus Analyse'];
const KRT = ['☑', 'ID', 'Sendung', 'Erfasst', 'Bezeichnung', '#', 'Barcode', 'Link', 'Kategorie', 'OVP', 'VP', 'Wert', 'CH', 'Lagerort'];
const AN_KOPF = ['Analyse-Nr', 'PG-ID', 'Reusable', 'Regal'];
const RIC_KOPF = ['PG-ID', 'Status', 'Bezeichnung', 'Bündel-IDs', 'Entscheid unverkauft'];      // andere Reihenfolge als im Ricardo Tool: gelesen wird über den Kopf
const UMP_KOPF = ['Durchgang', 'PG-ID', 'Bezeichnung', 'Aktion', 'Gebinde', 'Abnehmer', 'Lagerort alt', 'Lagerort neu', 'VP alt', 'Preis', 'Return-Tool-Tab', 'Zeile', 'Erledigt', 'Prüfung'];
/* Zeile im Return Tool (Kopf KRT) und Scanner-Zeile (ohne ID) */
const z = (id, erf, bez, bc, link, vp, ort, kat) => [false, id, '', erf, bez, 1, bc, link || '', kat || '', 0, vp, vp, '', ort];
const zs = (erf, bez, bc, vp, ort) => [false, '', erf, bez, 1, bc, '', '', 0, vp, vp, '', ort];
const rtTab = (zeilen, ohneId) => [[], [], [], [], [], ohneId ? KRT.filter(k => k !== 'ID') : KRT].concat(zeilen);
/** Return Tool mit allen vier Bestand-Tabs; extra überschreibt einzelne Tabs (null = Tab fehlt). */
function rt(stationaer, extra) {
  const t = { 'Stationär': rtTab(stationaer || []), 'Scanner': rtTab([], true), 'Analyse': rtTab([]), 'Online': rtTab([]) };
  Object.keys(extra || {}).forEach(k => { if (extra[k] === null) delete t[k]; else t[k] = extra[k]; });
  return t;
}
const P = (w) => 'Art: ' + w + '\nMuss: –\nSuchwörter: ' + w.toLowerCase();
const auftrag = (g, profil, aus) => [g, '', 50, profil === undefined ? P(g) : profil, '', '', '', '', false, aus || ''];
const kennung = (g, i, p) => Array.from(crypto.createHash('md5').update(g + '\n' + i + '\n' + p, 'utf8').digest()).slice(0, 5).map(x => ('0' + x.toString(16)).slice(-2)).join('');

function blatt(name, v, ss, env) {
  const s = { v: v, name: name, ss: ss, breite: 26, maxRows: Math.max(1000, v.length), farbe: {}, eingefuegt: 0,
    getName: () => s.name, getParent: () => s.ss,
    getLastRow: () => { let n = s.v.length; while (n > 0 && (s.v[n - 1] || []).every(x => x === '' || x == null)) n--; return n; },
    getLastColumn: () => Math.max(0, ...s.v.map(r => { let n = (r || []).length; while (n > 0 && (r[n - 1] === '' || r[n - 1] == null)) n--; return n; })),
    getMaxRows: () => s.maxRows, getMaxColumns: () => s.breite,
    getDataRange: () => rng(s, 1, 1, Math.max(1, s.getLastRow()), Math.max(1, s.getLastColumn()), env),
    getRange: (r, c, nr, nc) => rng(s, r, c, nr || 1, nc || 1, env),
    insertRowsAfter(a, n) { s.maxRows += n; s.eingefuegt += n; }, insertColumnsAfter(a, n) { s.breite += n; }, setFrozenRows() {}, setColumnWidth() {},
    appendRow: (r) => { s.v.splice(s.getLastRow(), 0, r.slice()); }, deleteRow: (r) => { env.log.push('delete:' + s.name); s.v.splice(r - 1, 1); },
    copyTo: (ss2) => { const k = blatt('Kopie', JSON.parse(JSON.stringify(s.v)), ss2, env); ss2.sheets.push(k); return { setName: (n) => { k.name = n; return k; } }; } };
  return s;
}
function rng(s, r, c, nr, nc, env) {
  const schreib = (art) => {
    if (r + nr - 1 > s.maxRows) throw new Error('Der Bereich liegt ausserhalb des Tabs «' + s.name + '» (Zeile ' + (r + nr - 1) + ' > ' + s.maxRows + ')');
    env.log.push(art + ':' + s.name);
  };
  const o = {
    getValues: () => { const a = []; for (let i = 0; i < nr; i++) { const zz = []; for (let j = 0; j < nc; j++) zz.push(((s.v[r - 1 + i] || [])[c - 1 + j]) ?? ''); a.push(zz); } return a; },
    getDisplayValues: () => o.getValues().map(zz => zz.map(String)), getValue: () => ((s.v[r - 1] || [])[c - 1]) ?? '',
    setValues: (w) => { schreib('write'); w.forEach((zz, i) => { s.v[r - 1 + i] = s.v[r - 1 + i] || []; zz.forEach((x, j) => { s.v[r - 1 + i][c - 1 + j] = x; }); }); return o; },
    setValue: (x) => { schreib('write'); s.v[r - 1] = s.v[r - 1] || []; s.v[r - 1][c - 1] = x; return o; },
    clearContent: () => { schreib('clear'); for (let i = 0; i < nr; i++) for (let j = 0; j < nc; j++) if (s.v[r - 1 + i]) s.v[r - 1 + i][c - 1 + j] = ''; return o; },
    setFontColor: (f) => { s.farbe[r + ',' + c] = f; return o; },
    getRow: () => r, getLastRow: () => r + nr - 1, getColumn: () => c, getLastColumn: () => c + nc - 1, getSheet: () => s
  };
  ['setBackgrounds', 'setBackground', 'setVerticalAlignment', 'setWrap', 'setNumberFormat', 'setFontSize', 'setFontWeight', 'insertCheckboxes', 'clearDataValidations', 'copyTo'].forEach(m => { o[m] = () => o; });
  return o;
}
function datei(tabs, env) {
  const ss = { toasts: [], getSheetByName: (n) => ss.sheets.find(s => s.name === n) || null, getNumSheets: () => ss.sheets.length, getSpreadsheetTimeZone: () => 'Europe/Zurich',
    insertSheet: (n) => { const s = blatt(n, [], ss, env); ss.sheets.push(s); return s; }, toast: (t) => ss.toasts.push(String(t)) };
  ss.sheets = Object.keys(tabs || {}).map(n => blatt(n, tabs[n], ss, env));
  return ss;
}

/* Standard-Claude: Profil aus «Gesucht» (Suchwort = erstes Wort), Urteil: «zubehoer» = nein, sonst passt. Versatz simuliert Nummern ab 1. */
function standardAntwort(env, q) {
  const body = JSON.parse(q.payload), frage = body.messages[0].content;
  if (body.tools[0].name === 'suchprofile') {
    env.profilAnfragen++;
    const profile = [];
    frage.split('\n').forEach(l => {
      const m = /^\[(\d+)\] Gesucht: ([^|]*)/.exec(l); if (!m) return;
      const g = m[2].trim(), w = g.split(' ')[0].toLowerCase();
      profile.push(Object.assign({ nr: Number(m[1]) + env.profilVersatz, art: g, muss: '', wunsch: '', nicht: '', suchwoerter: [w] }, env.echo ? { gesucht: g.split(' ').slice(0, 3).join(' ') } : {}));
    });
    return { input: { profile: profile } };
  }
  const urteile = [];
  frage.split('\n').forEach(l => {
    const m = /^\[(\d+)\] (.*)$/.exec(l); if (!m) return;
    const name = m[2].replace(/ \(Shop-Link: .*\)$/, '');
    env.paare++; env.gefragt.push(name);
    urteile.push(Object.assign({ nr: Number(m[1]) + env.urteilVersatz, urteil: env.urteil ? env.urteil(name) : (/zubehoer/i.test(name) ? 'nein' : 'passt'), hinweis: '' },
      env.echo ? { produkt: name.split(' ').slice(0, 3).join(' ') } : {}));
  });
  if (env.vertauscheEcho && urteile.length > 1) { const n = urteile.length - 1, x = urteile[0].produkt; urteile[0].produkt = urteile[n].produkt; urteile[n].produkt = x; }   // erstes ↔ letztes
  return { input: { urteile: urteile } };
}

/**
 * opt: mm, rt, an, ric, ump (Tabs als { Name: Zeilen }), quelle (veränderter Code), antwort(env, q).
 * env: log (lock, release, flush, write:Tab, clear:Tab, delete:Tab), uhr, uhrProAufruf, kaputt.{AN,RIC,UMP}, dokBesetzt, lockHook, beimFetch,
 *      fetchAllWirft (Aufruf-Nr. oder 'immer'), fetchWirft, aufrufe, einzeln, paare, gefragt, profilVersatz, urteilVersatz, echo, vertauscheEcho.
 */
function umgebung(opt) {
  opt = opt || {};
  const env = { alerts: [], log: [], paare: 0, profilAnfragen: 0, gefragt: [], profilVersatz: 0, urteilVersatz: 0, echo: false, vertauscheEcho: false, urteil: null,
    beimFetch: null, lockHook: null, dokBesetzt: false, kaputt: {}, uhr: START, uhrProAufruf: 0, fetchAllWirft: 0, fetchWirft: false, aufrufe: 0, einzeln: 0 };
  env.MM = datei(opt.mm, env);
  env.RT = datei(opt.rt || rt([]), env);
  env.AN = datei(opt.an || { 'Analysen': [AN_KOPF] }, env);
  env.RIC = datei(opt.ric || { 'Listings': [RIC_KOPF] }, env);
  env.UMP = datei(opt.ump || { 'Änderungen': [UMP_KOPF] }, env);
  class UhrDate extends Date { constructor(...a) { if (a.length) super(...a); else super(env.uhr); } static now() { return env.uhr; } }
  const antworte = (q) => {
    const a = (opt.antwort || standardAntwort)(env, q);
    if (a.code) return { getResponseCode: () => a.code, getContentText: () => a.text || '' };
    return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ stop_reason: 'tool_use', content: [{ type: 'tool_use', input: a.input }] }) };
  };
  const c = { console, JSON, Date: UhrDate, Math, Object, String, Number, Array, RegExp, Error, isFinite, parseFloat, decodeURIComponent,
    SpreadsheetApp: { CopyPasteType: { PASTE_FORMAT: 'f' }, getActiveSpreadsheet: () => env.MM, getUi: () => ({ alert: (t) => env.alerts.push(String(t)) }), flush: () => env.log.push('flush'),
      openById: (id) => {
        const n = Object.keys(ID).find(k => ID[k] === id);
        if (!n) throw new Error('Unbekannte Datei ' + id);
        if (env.kaputt[n]) throw new Error('Kein Zugriff');
        return env[n];
      } },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => 'sk-test' }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => env.log.push('release:skript') }),
      getDocumentLock: () => ({ tryLock: () => { if (env.lockHook) { const h = env.lockHook; env.lockHook = null; h(); } if (env.dokBesetzt) return false; env.log.push('lock'); return true; },
        releaseLock: () => env.log.push('release') }) },
    ScriptApp: { getProjectTriggers: () => [] },
    Utilities: { formatDate: (d, tz, f) => fmt(d, f), sleep: (ms) => { env.uhr += ms; }, DigestAlgorithm: {}, Charset: {},
      computeDigest: (a, t) => Array.from(crypto.createHash('md5').update(t, 'utf8').digest()).map(x => x > 127 ? x - 256 : x) },
    UrlFetchApp: {
      fetchAll: (reqs) => {
        env.aufrufe++;
        if (env.beimFetch) { const b = env.beimFetch; env.beimFetch = null; b(reqs[0]); }
        env.uhr += env.uhrProAufruf;
        if (env.fetchAllWirft === 'immer' || env.fetchAllWirft === env.aufrufe) throw new Error('Address unavailable: https://api.anthropic.com/v1/messages');
        return reqs.map(antworte);
      },
      fetch: (url, p) => {
        env.einzeln++;
        if (env.fetchWirft) throw new Error('Verbindung abgebrochen');
        assert.ok(url === 'https://api.anthropic.com/v1/messages' && p && p.payload && !('url' in p), 'fetch(url, params) wie in Apps Script');
        return antworte(Object.assign({ url: url }, p));
      } } };
  vm.createContext(c);
  vm.runInContext(opt.quelle || QUELLE, c);
  env.c = c;
  env.lauf = (s) => vm.runInContext(s, c);
  env.mm = () => env.MM.getSheetByName('Matchmaker');
  env.U = () => env.MM.getSheetByName('Urteile');
  env.E = () => env.MM.getSheetByName('Erledigt');
  env.zelle = (r, col) => String((env.mm().v[r - 1] || [])[col - 1] ?? '');
  env.zeile = (r) => [5, 6, 7, 8].map(k => env.zelle(r, k)).join('\n');
  env.status = (r) => String((env.mm().v[(r || 2) - 1] || [])[0] ?? '');
  env.rot = (r) => env.mm().farbe[(r || 2) + ',1'] === '#b00020';
  env.ev = (sh, r, col, r2, col2) => ({ range: rng(sh, r, col, (r2 || r) - r + 1, (col2 || col) - col + 1, env) });
  env.urteile = () => (env.U() ? env.U().v.slice(1).filter(r => r[0]) : []);
  /* V1: jede Freigabe der Dokument-Sperre direkt nach flush */
  env.v1 = () => env.log.forEach((x, i) => { if (x === 'release' || x === 'release:skript') assert.strictEqual(env.log[i - 1], 'flush', 'V1: flush vor releaseLock (Protokoll: ' + env.log.slice(Math.max(0, i - 4), i + 1).join(', ') + ')'); });
  return env;
}

module.exports = { umgebung, rt, rtTab, z, zs, P, auftrag, kennung, KOPF, KRT, AN_KOPF, RIC_KOPF, UMP_KOPF, HEUTE, QUELLE, DATEI, standardAntwort };

if (require.main === module) {
  const env = umgebung({ mm: { 'Matchmaker': [['Matchmaker'], [''], KOPF] } });
  assert.strictEqual(env.lauf('VERSION'), '2026-10-26.2');
  console.log('t_matchmaker_p2410_h ok (Testgerüst)');
}
