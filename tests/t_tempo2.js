/* Tempo 19.10.2026: Schreiben über die Sheets-API (eine Anfrage), Kopfzeilen ohne eigenen Zugriff, Lesen in der Sperre, Foto-Abfrage ohne Bilder. Lauf: node tests/t_tempo2.js */
const vm = require('vm'), fs = require('fs');
let fehler = 0; const ok = (b, m) => { if (!b) { fehler++; console.log('FEHLER', m); } else console.log('ok', m); };
const T = {
  Log: [['Zeit', 'Person', 'Aktion', 'ID', 'Detail']],
  Produkte: [['PG-ID', 'Bezeichnung', 'Analyse-Status'], ['PG-1', 'Toaster', 'Offen'], ['PG-2', 'Föhn', 'Offen']],
  Einstellungen: [['Einstellung', 'Wert'], ['Admins', '']]
};
let zugriffe = { kopf: 0, raster: 0, append: 0, batchUpdate: 0, batchGet: 0, setValues: 0 }, cache = {};
function blatt(n) {
  return { getName: () => n, getLastRow: () => T[n].length, getLastColumn: () => T[n][0].length, getMaxRows: () => T[n].length, getMaxColumns: () => T[n][0].length,
    getRange: (r, c, nr, nc) => ({
      getValues: () => { if (r === 1 && nr === 1) zugriffe.kopf++; else zugriffe.raster++; const o = []; for (let i = 0; i < nr; i++) { const z = []; for (let j = 0; j < nc; j++) z.push((T[n][r - 1 + i] || [])[c - 1 + j] ?? ''); o.push(z); } return o; },
      setValues: (v) => { zugriffe.setValues++; v.forEach((z, i) => { T[n][r - 1 + i] = z.slice(); }); } }) };
}
const name = (bereich) => bereich.replace(/^'|'(!.*)?$/g, '').replace(/''/g, "'");
const Sheets = { Spreadsheets: { Values: {
  append: (body, id, bereich) => { zugriffe.append++; body.values.forEach(z => T[name(bereich)].push(z.slice())); return {}; },
  batchUpdate: (body) => { zugriffe.batchUpdate++; body.data.forEach(d => { const m = /^'(.+)'!([A-Z]+)(\d+)$/.exec(d.range); const c = m[2].charCodeAt(0) - 64; T[m[1]][Number(m[3]) - 1][c - 1] = d.values[0][0]; }); return {}; },
  batchGet: (id, o) => { zugriffe.batchGet++; return { valueRanges: o.ranges.map(b => ({ values: T[name(b)].map(z => z.slice()) })) }; }
} } };
const c = { console, JSON, Date, Math, Object, String, Number, Array, RegExp, Error, Sheets,
  SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: n => T[n] ? blatt(n) : null, getId: () => 'ID' }), flush() {} },
  CacheService: { getScriptCache: () => ({ get: k => cache[k] ?? null, getAll: ks => { const o = {}; ks.forEach(k => { if (cache[k]) o[k] = cache[k]; }); return o; }, put: (k, v) => { cache[k] = v; }, remove: k => { delete cache[k]; }, removeAll: ks => ks.forEach(k => delete cache[k]) }) },
  Utilities: { formatDate: () => '19.10.2026 12:00:00' }, LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  PropertiesService: { getScriptProperties: () => ({ getProperty: () => null, setProperty() {}, deleteProperty() {} }) }, Session: { getActiveUser: () => ({ getEmail: () => 'jb@x' }) } };
vm.createContext(c); vm.runInContext(fs.readFileSync(__dirname + '/../apps/analyse/Code.gs', 'utf8'), c);
const neu = () => vm.runInContext('LAUF_MEMO = {}; MEMO = {}; KOPF_MEMO = {}; SPERR_MEMO = {}; LESEN = [];', c);

/* Log: eine Anfrage, ohne Sperre, Kopfzeile danach aus dem Zwischenspeicher */
vm.runInContext("log_('Test', 'PG-1', 'eins')", c);
ok(T.Log.length === 2 && T.Log[1][2] === 'Test' && T.Log[1][3] === 'PG-1', 'Log-Zeile in der richtigen Spaltenfolge');
ok(zugriffe.append === 1 && zugriffe.setValues === 0, 'Log: eine append-Anfrage');
const k0 = zugriffe.kopf; neu();
vm.runInContext("log_('Test', 'PG-2', 'zwei')", c);
ok(zugriffe.kopf === k0 && T.Log.length === 3, 'zweites Log in neuem Aufruf: Kopfzeile aus dem Zwischenspeicher');
vm.runInContext("onEdit({ range: { getRow: () => 1, getSheet: () => ({ getName: () => 'Log' }) } })", c); neu();
vm.runInContext("log_('Test', 'PG-3', 'drei')", c);
ok(zugriffe.kopf === k0 + 1, 'nach Änderung der Kopfzeile von Hand: frisch gelesen');

/* Sperre mit Vorladen: eine Anfrage, dann kein weiterer Lesezugriff bis zum eigenen Schreiben */
neu(); const g0 = zugriffe.batchGet, r0 = zugriffe.raster, kk = zugriffe.kopf;
const zahl = vm.runInContext(`gesperrt_(function () {
  const a = produkt_('PG-1'), b = produkt_('PG-2');
  const st = {}; st[a._r] = 'Erledigt'; setz_('Produkte', 'Analyse-Status', st);
  return lies_('Produkte').z.filter(function (r) { return r['Analyse-Status'] === 'Erledigt'; }).length;
}, ['Produkte'])`, c);
ok(zugriffe.batchGet - g0 === 2 && zugriffe.raster === r0 && zugriffe.kopf === kk, 'Sperre: Vorladen + ein frisches Lesen nach dem Schreiben, keine Kopfzeile, kein Raster');
ok(zahl === 1 && T.Produkte[1][2] === 'Erledigt' && T.Produkte[2][2] === 'Offen', 'setz_ trifft genau die Zelle');
ok(zugriffe.batchUpdate === 1, 'setz_: eine Anfrage');
const u0 = zugriffe.batchUpdate;
vm.runInContext("gesperrt_(function () { const st = {}; st[2] = 'A'; st[3] = 'B'; setz_('Produkte', 'Analyse-Status', st); })", c);
ok(zugriffe.batchUpdate === u0 + 1 && T.Produkte[1][2] === 'A' && T.Produkte[2][2] === 'B', 'verschiedene Werte, eine Anfrage');

/* Einstellungen: der Abgleich verwirft die vorbereiteten Überblicke nicht mehr */
cache['ueb-gen'] = 'G1';
vm.runInContext("ohneUebNeu_(function () { vergiss_('Einstellungen'); })", c);
ok(cache['ueb-gen'] === 'G1', 'Einstellungen frisch lesen (Abgleich): Überblicke bleiben');
vm.runInContext("vergiss_('Einstellungen')", c);
ok(cache['ueb-gen'] !== 'G1', 'Einstellungen geändert (Admin): Überblicke neu');

/* Ohne Dienst «Sheets» wie bisher */
neu(); const alt = c.Sheets; vm.runInContext('Sheets = undefined;', c);
const s0 = zugriffe.setValues; vm.runInContext("gesperrt_(function () { schreib_('Log', [{ 'Zeit': 'z', 'Aktion': 'ohne' }]); })", c);
ok(zugriffe.setValues === s0 + 1 && T.Log[T.Log.length - 1][2] === 'ohne', 'ohne Sheets-API: setValues wie bisher');
c.Sheets = alt; vm.runInContext('Sheets = this.Sheets;', c);

/* Foto-Abfrage: unverändert = ohne Bilder */
cache['pk:PG-1'] = JSON.stringify({ pg: 'PG-1', bez: 'Toaster' });
const datei = (id, n) => ({ getId: () => id, getName: () => n, isTrashed: () => false, getThumbnail: () => { c.BILDER++; return null; } });
const ordner = { getId: () => 'O', isTrashed: () => false, getDescription: () => '', getUrl: () => 'u', getFiles: () => { const l = [datei('f1', '1 Hauptbild PG-1.jpg'), datei('f2', '2 Weitere 01 PG-1.jpg')]; return { hasNext: () => l.length > 0, next: () => l.shift() }; } };
c.BILDER = 0; c.DriveApp = { getFolderById: (id) => id === 'O' ? ordner : ({ getFoldersByName: () => { const l = [ordner]; return { hasNext: () => l.length > 0, next: () => l.shift() }; }, isTrashed: () => false }) };
vm.runInContext("einst_ = function () { return { 'Ricardo-Foto-Ordner ID': 'R' }; };", c);
const st1 = JSON.parse(vm.runInContext("JSON.stringify(fotoStand('PG-1'))", c));
ok(st1.liste.length === 2 && st1.kennung && c.BILDER === 2, 'erste Abfrage: alles mit Bildern');
const st2 = JSON.parse(vm.runInContext("JSON.stringify(fotoStand('PG-1', " + JSON.stringify(st1.kennung) + "))", c));
ok(st2.gleich === true && !st2.liste && c.BILDER === 2, 'gleiche Kennung: nur «gleich», keine Bilder');
console.log(fehler ? 'Fehler: ' + fehler : 't_tempo2 ok'); process.exit(fehler ? 1 : 0);
