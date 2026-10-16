/* Tempo: Zwischenspeicher für stabile Tabs, gezieltes Lesen der Recherche, Abgleich tagsüber ohne Handbücher. Lauf: node tests/t_tempo.js */
const vm = require('vm'), fs = require('fs');
let fehler = 0; const ok = (b, m) => { if (!b) { fehler++; console.log('FEHLER', m); } else console.log('ok', m); };
let lesungen = {}, finder = 0, cacheStore = {};
function blatt(name, rows) {
  const d = rows;
  return { getName: () => name, getLastRow: () => d.length, getLastColumn: () => d[0].length,
    getDataRange: () => { lesungen[name] = (lesungen[name] || 0) + 1; return { getValues: () => d.map(r => r.slice()) }; },
    getRange: (r, c, nr, nc) => ({
      getValues: () => { const o = []; for (let i = 0; i < (nr || 1); i++) { const z = []; for (let j = 0; j < (nc || 1); j++) z.push((d[r - 1 + i] || [])[c - 1 + j] ?? ''); o.push(z); } return o; },
      createTextFinder: (t) => { const f = { matchEntireCell: () => f, matchCase: () => f, findAll: () => { finder++; const out = []; for (let i = 0; i < (nr || 1); i++) if (String((d[r - 1 + i] || [])[c - 1]) === t) out.push({ getRow: () => r + i }); return out; } }; return f; }
    }) };
}
const kopfR = ['Schlüssel', 'Bezeichnung', 'Feld', 'Inhalt'];
const R = [kopfR]; for (let i = 0; i < 3000; i++) R.push(['K' + (i % 500), 'x', 'Feld' + i, 'i' + i]);
R.push(['0761', 'Toaster', 'Marke und Modell', 'Koenig|T1|']); R.push(['0761', 'Toaster', 'Funktionen', '[]']); R.push(['K9', 'y', 'Ende', 'z']);
const E = [['Einstellung', 'Wert', 'Erklärung'], ['Recherche-Guthaben', 5, ''], ['Admins', '', '']];
const SH = { Recherche: blatt('Recherche', R), Einstellungen: blatt('Einstellungen', E), Log: blatt('Log', [['Zeit']]) };
const c = { console, JSON, Date, Math, Object, String, Number, Array, RegExp, Error,
  SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: n => SH[n] }) },
  CacheService: { getScriptCache: () => ({ get: k => cacheStore[k] ?? null, put: (k, v) => { cacheStore[k] = v; }, remove: k => { delete cacheStore[k]; } }) },
  Utilities: { formatDate: (d, tz, f) => f === 'H' ? String(c.STUNDE) : '0' }, LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  PropertiesService: { getScriptProperties: () => ({ getProperty: () => null, setProperty() {}, deleteProperty() {} }) }, Session: { getActiveUser: () => ({ getEmail: () => 't' }) }, STUNDE: 10 };
vm.createContext(c); vm.runInContext(fs.readFileSync(__dirname + '/../src/Code.gs', 'utf8'), c);
vm.runInContext("log_ = function () {}; zeit_ = function () { return 'z'; };", c);

const r = vm.runInContext("rechercheVon_('0761')", c);
ok(r.z.length === 2 && r.z[0]._r === 3002 && r.z[1]['Feld'] === 'Funktionen', 'nur die zwei Zeilen des Schlüssels, mit richtiger Zeilennummer');
ok(!lesungen.Recherche, 'Recherche nicht ganz gelesen');
ok(vm.runInContext("rechercheVon_('K9').z.length", c) === 7, 'Schlüssel in mehreren Blöcken (6 + 1 am Schluss)');
ok(vm.runInContext("rechercheVon_('fehlt').z.length", c) === 0 && !lesungen.Recherche, 'unbekannter Text-Schlüssel: leer, ohne alles zu lesen');
vm.runInContext("rechercheVon_('999')", c);
ok(lesungen.Recherche === 1, 'unbekannter Zahlen-Schlüssel: sicherheitshalber alles gelesen');

ok(vm.runInContext("einst_()['Recherche-Guthaben']", c) === 5, 'Einstellungen gelesen');
vm.runInContext("einst_(); einst_();", c);
ok(lesungen.Einstellungen === 1, 'mehrmals im gleichen Aufruf: einmal gelesen');
vm.runInContext("MEMO = {};", c);                                   // neuer Aufruf
vm.runInContext("einst_();", c);
ok(lesungen.Einstellungen === 1, 'nächster Aufruf: aus dem Zwischenspeicher');
E[1][1] = 4; vm.runInContext("setz_ = setz_; vergiss_('Einstellungen'); MEMO = {};", c);
ok(vm.runInContext("einst_()['Recherche-Guthaben']", c) === 4 && lesungen.Einstellungen === 2, 'nach Schreiben frisch gelesen');
vm.runInContext("gesperrt_(function () { lies_('Einstellungen'); })", c);
ok(lesungen.Einstellungen === 3, 'in einer Sperre immer frisch');
vm.runInContext("onEdit({ range: { getSheet: function () { return { getName: function () { return 'Einstellungen'; } }; } } }); MEMO = {};", c);
vm.runInContext("einst_();", c);
ok(lesungen.Einstellungen === 4, 'Änderung von Hand (onEdit): frisch gelesen');
const x = vm.runInContext("var a = lies_('Einstellungen'); a.z[0]['Wert'] = 99; lies_('Einstellungen').z[0]['Wert']", c);
ok(x === 4, 'Kopie: Änderungen am Ergebnis verändern den Speicher nicht');

ok(vm.runInContext("tagsueber_({})", c) === true, '10 Uhr: tagsüber (Vorgabe 07:00-18:30)');
c.STUNDE = 20; ok(vm.runInContext("tagsueber_({})", c) === false, '20 Uhr: nicht tagsüber');
c.STUNDE = 10; ok(vm.runInContext("tagsueber_({ 'Handbücher nicht zwischen': '' })", c) === false, 'Einstellung leer: Handbücher immer');
const H = blatt('Handbücher', [['Schlüssel', 'Status', 'Datei'], ['koenig|t1', 'gelesen', 'https://d/1'], ['bosch|x', 'Fehler', ''], ['koenig|t1x', 'kein Handbuch', '']]);
vm.runInContext("handbuchBlatt_ = function () { return HB; }", Object.assign(c, { HB: H }));
const hz = vm.runInContext("JSON.stringify(handbuchZeile_({}, 'koenig|t1'))", c);
ok(JSON.parse(hz).Datei === 'https://d/1' && !lesungen['Handbücher'], 'Handbuch-Zeile gezielt gefunden, ohne das Sheet ganz zu lesen');
ok(vm.runInContext("handbuchZeile_({}, 'gibts|nicht')", c) === null, 'unbekanntes Modell: null');
console.log(fehler ? 'Fehler: ' + fehler : 'alle Tests ok'); process.exit(fehler ? 1 : 0);
