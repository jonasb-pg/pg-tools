/* Ersatzteil Tool, Datenintegrität (24.10.2026): verbraucht liest und rechnet in der Sperre (M3), Marke ohne Sonderzeichen und langes Modell trotz
   Markenabweichung mit Hinweis (M4), Box- und ET-Nummern ohne Abschneiden, Zahlen, Kostenzeile nicht still. Server mit Stubs, kein Google. */
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const lies = function (p) { return fs.readFileSync(__dirname + '/../' + p, 'utf8'); };
const ids = function (l) { return JSON.parse(JSON.stringify(l.map(function (t) { return t.id; }))); };
const kopf = ['ID', 'Marke', 'Modell', 'Produktart', 'Teil', 'Teilart', 'Menge', 'Box', 'Status', 'Quelle', 'Erfasst am', 'Erfasst von', 'Verbraucht am', 'Verbraucht von', 'Bemerkung'];
const teil = function (id, m, mo, pa, t, box, menge) { return [id, m, mo, pa, t, '', menge || 1, box, 'im Lager', '', '', '', '', '', '']; };
const tabs = {
  'Teile': [kopf, teil('ET-0001', "De'Longhi", 'ECAM22.110', 'Kaffeemaschine', 'Brühgruppe', 'B01'), teil('ET-0002', 'Dyson', 'V8', 'Staubsauger', 'Akku', 'B02'),
    teil('ET-0003', 'Philips', 'HD7462', 'Kaffeemaschine', 'Tank', 'B01', 2), teil('ET-0004', '', 'SBA3010', 'Kopfhörer', 'Ladekabel', 'B02'), teil('ET-9999', 'Bosch', 'TKA3A031', 'Kaffeemaschine', 'Kanne', 'B03')],
  'Boxen': [['Box', 'Produktart', 'Status', 'Ort', 'Angelegt am', 'Angelegt von', 'Bemerkung']],
  'Einstellungen': [['Einstellung', 'Wert', 'Erklärung'], ['Admins', '', '']], 'Log': [['Zeit', 'Bearbeiter', 'Aktion', 'ID', 'Details']],
  'Kosten': [['Zeit', 'Aktion', 'ID', 'Modell', 'Tokens Input', 'Tokens Output', 'Websuchen', 'USD']]
};
for (let i = 1; i <= 99; i++) tabs.Boxen.push(['B' + String(i).padStart(2, '0'), 'X', 'offen', '', '', '', '']);
let inSperre = false, leseAusserhalb = 0, kostenKaputt = false;
function sheet(n) {
  const v = tabs[n];
  return { getDataRange: function () { if (n === 'Teile' && !inSperre) leseAusserhalb++; return { getValues: function () { return v.map(function (z) { return z.slice(); }); } }; },
    getLastColumn: function () { return v[0].length; }, getLastRow: function () { return v.length; },
    getRange: function (r) {
      return { getValues: function () { return [v[0]]; },
        setValues: function (x) { if (n === 'Kosten' && kostenKaputt) throw new Error('Tab geschützt'); x.forEach(function (z) { v.push(z); }); },
        setValue: function (x) { const m = /^([A-Z]+)(\d+)$/.exec(r); v[Number(m[2]) - 1][m[1].charCodeAt(0) - 65] = x; } };
    } };
}
const fehlerLog = [];
const ctx = { console: { log: console.log, error: function (m) { fehlerLog.push(m); } }, SpreadsheetApp: { getActiveSpreadsheet: function () { return { getSheetByName: function (n) { return tabs[n] ? sheet(n) : null; } }; } },
  PropertiesService: { getScriptProperties: function () { return { getProperty: function () { return 'sk-test'; } }; } },
  LockService: { getScriptLock: function () { return { waitLock: function () { inSperre = true; }, releaseLock: function () { inSperre = false; } }; } },
  Utilities: { formatDate: function () { return '24.10.2026 08:00:00'; } }, Session: { getActiveUser: function () { return { getEmail: function () { return 'a@pretty-good.ch'; } }; } },
  UrlFetchApp: { fetch: function () { return { getResponseCode: function () { return 200; }, getContentText: function () { return JSON.stringify({ stop_reason: 'end_turn', model: 'claude-haiku-5-5', usage: { input_tokens: 1000, output_tokens: 100 }, content: [{ type: 'text', text: '{"marke":"Philips","modell":"HD7462","produktart":"Kaffeemaschine"}' }] }); } }; } } };
vm.createContext(ctx);
vm.runInContext(lies('apps/ersatzteil/Code.gs'), ctx);
assert.ok(/const VERSION = '2026-10-24\.1'/.test(lies('apps/ersatzteil/Code.gs')));

/* M4: Marke ohne Leer-/Sonderzeichen; langes Modell trotz Markenabweichung mit Hinweis; Präfix erst ab 5 Zeichen */
let s = ctx.suchen({ marke: 'Delonghi', modell: 'ECAM 22.110', produktart: 'Kaffeevollautomat' });
assert.deepStrictEqual(ids(s.passend), ['ET-0001'], 'Delonghi = De\'Longhi');
assert.ok(!s.passend[0].hinweis, 'gleiche Marke: kein Hinweis');
s = ctx.suchen({ marke: 'DeLonghi', modell: 'ECAM22110' });
assert.deepStrictEqual(ids(s.passend), ['ET-0001']);
s = ctx.suchen({ marke: 'Saeco', modell: 'ECAM22.110' });
assert.deepStrictEqual(ids(s.passend), ['ET-0001'], 'Modell passt, Marke vom Typenschild weicht ab: trotzdem passend');
assert.ok(/^Marke prüfen \(De'Longhi\)$/.test(s.passend[0].hinweis), s.passend[0].hinweis);
s = ctx.suchen({ marke: 'Philips', modell: 'SBA3010/00' });
assert.deepStrictEqual(ids(s.passend), ['ET-0004'], 'Teil ohne Marke, langes Modell passt');
assert.ok(/Marke prüfen \(ohne Marke\)/.test(s.passend[0].hinweis));
s = ctx.suchen({ marke: 'Samsung', modell: 'V8' });
assert.deepStrictEqual(ids(s.passend), [], 'kurzes Modell (V8) mit anderer Marke: nicht passend');
s = ctx.suchen({ modell: 'HD' });
assert.deepStrictEqual(ids(s.passend), [], '«HD» ist kein Treffer für HD7462 (Präfix unter 5 Zeichen)');
s = ctx.suchen({ marke: 'Philips', modell: 'HD74' });
assert.deepStrictEqual(ids(s.passend), [], 'HD74 nur Serie'); assert.deepStrictEqual(ids(s.serie), ['ET-0003']);
s = ctx.suchen({ modell: 'HD746' });
assert.deepStrictEqual(ids(s.passend), ['ET-0003'], 'ab 5 Zeichen: Präfix-Treffer');
assert.deepStrictEqual(ids(ctx.suchen({ marke: 'dyson', modell: 'V8' }).passend), ['ET-0002'], 'kurzes Modell exakt gleich: passend');

/* M3: verbraucht liest und rechnet in der Sperre */
leseAusserhalb = 0;
assert.strictEqual(ctx.verbraucht('ET-0003').rest, 1);
assert.strictEqual(leseAusserhalb, 0, 'Tab «Teile» nur in der Sperre gelesen');
assert.strictEqual(tabs.Teile[3][6], 1);
assert.strictEqual(ctx.verbraucht('ET-0003').rest, 0); assert.strictEqual(tabs.Teile[3][8], 'verbraucht');
assert.throws(function () { ctx.verbraucht('ET-0003'); }, /schon verbraucht/);
assert.throws(function () { ctx.verbraucht('ET-7777'); }, /nicht gefunden/);

/* Nummern: B99 → B100 (vorher B00), ET-9999 → ET-10000 (vorher ET-0000) */
assert.strictEqual(ctx.boxNeu('Staubsauger').box, 'B100');
assert.strictEqual(ctx.boxNeu('Staubsauger').box, 'B101');
inSperre = true; assert.strictEqual(ctx.neueId_(), 'ET-10000'); inSperre = false;

/* Zahlen */
[['1,299.00', 1299], ["1'299.00", 1299], ['1.299,00', 1299], ['12,50', 12.5], ['CHF 12.-', 12], ['1,299', 1299], ['9.90', 9.9], ['', ''], [5, 5]]
  .forEach(function (x) { assert.strictEqual(ctx.zahl_(x[0]), x[1], 'zahl_ ' + x[0]); });

/* Kostenzeile: Fehler beim Schreiben ist nicht still (Log und Konsole), der Aufruf selbst läuft weiter */
kostenKaputt = true;
const t = ctx.typenschild('x'.repeat(200), 'image/jpeg');
assert.strictEqual(t.modell, 'HD7462');
assert.ok(tabs.Log.some(function (z) { return z[2] === 'Kosten-Fehler' && /Kostenzeile nicht geschrieben \(Typenschild/.test(z[4]); }), 'Kosten-Fehler im Log');
assert.ok(fehlerLog.length === 1 && /Kostenzeile fehlt/.test(fehlerLog[0]));
kostenKaputt = false;
console.log('ok ersatzteil daten');
