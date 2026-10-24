/* Feedback zentral im Sheet «FEEDBACK TOOLS» (Entscheid Jonas 24.10.2026): Analyse Tool und Ricardo Tool schreiben dorthin, Spalte «Tool».
   Erfundene Daten. Lauf: node tests/t_feedback_zentral.js */
const fs = require('fs'), vm = require('vm'), assert = require('assert');
let n = 0; const ok = (b, m) => { assert.ok(b, m); n++; };

/* Mock: ein Tab «Feedback» im zentralen Sheet, Zeilen als Array (Zeile 1 = Kopf). */
function zentral(kopf, zeilen) {
  const daten = [kopf.slice()].concat(zeilen || []);
  const sh = {
    daten, angehaengt: 0,
    getLastRow: () => daten.length, getLastColumn: () => daten[0].length,
    getRange: (r, c, nr, nc) => ({
      getValues: () => daten.slice(r - 1, r - 1 + (nr || 1)).map(z => { const o = []; for (let i = 0; i < (nc || 1); i++) o.push(z[c - 1 + i] === undefined ? '' : z[c - 1 + i]); return o; }),
      setValue: v => { daten[r - 1][c - 1] = v; }
    }),
    appendRow: z => { daten.push(z.slice()); sh.angehaengt++; }
  };
  return sh;
}
function lade(datei, sh, extra) {
  const geoeffnet = [];
  const c = Object.assign({ console, JSON, Math, Date, RegExp,
    Utilities: { formatDate: d => 'DATUM' }, Session: { getActiveUser: () => ({ getEmail: () => 'eva@example.ch' }), getEffectiveUser: () => ({ getEmail: () => 'tool@example.ch' }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => null, setProperty: () => {} }) },
    CacheService: { getScriptCache: () => ({ get: () => null, put: () => {}, getAll: () => ({}), putAll: () => {}, remove: () => {}, removeAll: () => {} }) },
    LockService: { getScriptLock: () => ({ waitLock: () => {}, tryLock: () => true, releaseLock: () => {} }) },
    SpreadsheetApp: { openById: id => { geoeffnet.push(id); if (sh === null) throw new Error('Keine Berechtigung'); return { getSheetByName: n => n === 'Feedback' ? sh : null }; }, flush: () => {} }
  }, extra || {});
  vm.createContext(c); vm.runInContext(fs.readFileSync(__dirname + '/../apps/' + datei + '/Code.gs', 'utf8'), c);
  return { c, geoeffnet };
}
const KOPF = ['Zeit', 'Tool', 'Person', 'PG-ID', 'Bereich', 'Feedback', 'Status'];
const ID = '1iGyQrvX3MFPEFzpI4K8kCm4bdI5MpL1mPKr8bipFX-Q';

/* ---- Analyse Tool ---- */
{
  const sh = zentral(KOPF, [[new Date(), 'Ricardo Tool', 'x@example.ch', '', 'admin', 'Fremdes Feedback', 'Neu']]);
  const { c, geoeffnet } = lade('analyse', sh);
  c.einst_ = () => ({}); c.istAdmin_ = () => true;
  const SCHRITT3 = vm.runInContext('SCHRITTE[3] || ""', c);
  ok(c.feedback('Knopf zu klein', 'ab', 'PG-12', 3) === true, 'Analyse: feedback gibt true');
  const z = sh.daten[2];
  ok(geoeffnet[0] === ID, 'Analyse: Vorgabe ist das Sheet FEEDBACK TOOLS');
  ok(z[1] === 'Analyse Tool' && z[2] === 'AB' && z[3] === 'PG-12' && z[4] === SCHRITT3 && z[5] === 'Knopf zu klein' && z[6] === 'Neu' && z[0] instanceof Date, 'Analyse: Zeile mit Tool, Kürzel, PG-ID, Text, Status, Datum');
  ok(sh.angehaengt === 1, 'Analyse: genau eine Zeile per appendRow (atomar)');
  c.feedback('=SUMME(A1)', 'ab', '', '');
  ok(sh.daten[3][5] === "'=SUMME(A1)", 'Analyse: Formel wird als Text gespeichert');
  const l = c.feedbackListe();
  ok(l.length === 2 && l.every(x => x.text !== 'Fremdes Feedback'), 'Analyse: Liste zeigt nur Feedbacks des Analyse Tools');
  ok(l[1].r === 3 && l[1].kuerzel === 'AB' && l[1].id === 'PG-12', 'Analyse: Liste mit Zeilennummer und Feldern wie bisher');
  c.feedbackStatus(3, 'Knopf zu klein', 'Erledigt');
  ok(sh.daten[2][6] === 'Erledigt', 'Analyse: Status in der richtigen Zeile gesetzt');
  assert.throws(() => c.feedbackStatus(2, 'Fremdes Feedback', 'Erledigt'), /verschoben/); n++;
  ok(sh.daten[1][6] === 'Neu', 'Analyse: Feedback eines anderen Tools bleibt unberührt');
  /* Spalten in anderer Reihenfolge und eine Zusatzspalte: über die Namen */
  const sh2 = zentral(['Tool', 'Zeit', 'Notiz', 'Feedback', 'Person', 'Status', 'Bereich', 'PG-ID']);
  const a2 = lade('analyse', sh2); a2.c.einst_ = () => ({ 'Feedback-Sheet ID': ' anderes-sheet ' });
  a2.c.feedback('Test', 'cd', '', '');
  ok(a2.geoeffnet[0] === 'anderes-sheet' && sh2.daten[1][0] === 'Analyse Tool' && sh2.daten[1][3] === 'Test' && sh2.daten[1][2] === '', 'Analyse: Einstellung «Feedback-Sheet ID», Spalten über die Namen');
  /* Fehler laut */
  const a3 = lade('analyse', zentral(['Zeit', 'Tool', 'Feedback'])); a3.c.einst_ = () => ({});
  assert.throws(() => a3.c.feedback('x', 'ab'), /fehlen die Spalten: Person, PG-ID, Bereich, Status/); n++;
  const a4 = lade('analyse', null); a4.c.einst_ = () => ({});
  assert.throws(() => a4.c.feedback('x', 'ab'), /nicht erreichbar \(Keine Berechtigung\)/); n++;
  assert.throws(() => c.feedback('  ', 'ab'), /etwas hineinschreiben/); n++;
  /* einrichten legt keinen eigenen Tab «Feedback» mehr an, die Einstellung kommt dazu */
  ok(!('Feedback' in vm.runInContext('SPALTEN', c)), 'Analyse: Tab «Feedback» nicht mehr Pflicht');
  ok(vm.runInContext('NEUE_EINSTELLUNGEN', c).some(e => e[0] === 'Feedback-Sheet ID' && e[1] === ID), 'Analyse: neue Einstellung «Feedback-Sheet ID»');
  const src = fs.readFileSync(__dirname + '/../apps/analyse/Code.gs', 'utf8');
  ok(!/blatt_\('Feedback'\)|schreib_\('Feedback'/.test(src) && !/\['Kosten', 'Feedback'/.test(src), 'Analyse: kein Schreiben in den eigenen Tab «Feedback»');
}

/* ---- Ricardo Tool ---- */
{
  const sh = zentral(KOPF, [[new Date(), 'Analyse Tool', 'AB', 'PG-1', 'Funktion', 'Analyse-Feedback', 'Neu']]);
  const { c, geoeffnet } = lade('ricardo', sh);
  c.cfg_ = () => ''; c.pruefeAdmin_ = () => true;
  ok(c.feedback('Etiketten grösser', 'packen') === true, 'Ricardo: feedback gibt true');
  const z = sh.daten[2];
  ok(geoeffnet[0] === ID && z[1] === 'Ricardo Tool' && z[2] === 'eva@example.ch' && z[4] === 'packen' && z[5] === 'Etiketten grösser' && z[6] === 'Neu' && z[3] === '', 'Ricardo: Zeile mit Tool, Person, Bereich, Text, Status');
  const l = c.feedbackListe();
  ok(l.length === 1 && l[0].r === 3 && l[0].person === 'eva@example.ch' && l[0].bereich === 'packen', 'Ricardo: Liste nur eigene Feedbacks, Felder wie bisher');
  c.feedbackStatus(3, 'Etiketten grösser', 'Erledigt');
  ok(sh.daten[2][6] === 'Erledigt' && sh.daten[1][6] === 'Neu', 'Ricardo: Status nur in der eigenen Zeile');
  assert.throws(() => c.feedbackStatus(2, 'Analyse-Feedback', 'Erledigt'), /verschoben/); n++;
  ok(vm.runInContext('DEFAULTS', c).some(e => e[0] === 'Feedback-Sheet ID' && e[1] === ID), 'Ricardo: Einstellung «Feedback-Sheet ID» in den Vorgaben');
  const src = fs.readFileSync(__dirname + '/../apps/ricardo/Code.gs', 'utf8');
  ok(!/insertSheet\(TAB_F\)|getSheetByName\(TAB_F\)/.test(src), 'Ricardo: kein eigener Tab «Feedback» mehr');
  const r2 = lade('ricardo', null); r2.c.cfg_ = () => '';
  assert.throws(() => r2.c.feedback('x', 'a'), /FEEDBACK TOOLS» ist nicht erreichbar/); n++;
}
console.log('t_feedback_zentral ok (' + n + ' Prüfungen)');
