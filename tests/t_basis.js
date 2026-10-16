/* Gemeinsame Basis: lädt mit jedem Tool ohne Namenskonflikt, Kataloge vollständig, basisEinrichten_ gestaltet nach Standard. */
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const lies = function (p) { return fs.readFileSync(__dirname + '/../' + p, 'utf8'); };
const basis = lies('apps/basis/Basis.gs');

/* 1. Basis + Tool im selben Kontext (wie im Apps-Script-Projekt): keine doppelten Namen */
['apps/analyse/Code.gs', 'apps/ricardo/Code.gs'].forEach(function (p) {
  const c = { console: console, SpreadsheetApp: {}, PropertiesService: {}, CacheService: {}, Utilities: {}, Session: {}, ScriptApp: {}, LockService: {}, UrlFetchApp: {}, HtmlService: {}, DriveApp: {}, GmailApp: {}, Logger: { log: function () {} } };
  vm.createContext(c);
  vm.runInContext(lies(p) + '\n' + basis + '\n;this.__k = typeof ANALYSE_KATALOG !== "undefined" ? ANALYSE_KATALOG : RICARDO_KATALOG;', c);
  const k = c.__k, namen = k.map(function (x) { return x.tab; });
  assert.strictEqual(new Set(namen).size, namen.length, p + ': Tab doppelt im Katalog');
  k.forEach(function (x) { assert.ok(['arbeit', 'protokoll', 'hilfe', 'einstellung'].indexOf(x.art) > -1, p + ': Art ' + x.art); assert.ok(x.inhalt, p + ': Inhalt fehlt ' + x.tab); });
  assert.ok(namen.indexOf('Übersicht') < 0 && namen.indexOf('Doku') < 0);
  assert.ok(!/function basis[A-Z]|const BASIS/.test(lies(p)), p + ': definiert basis*-Funktion selbst');
});

/* Ricardo: jeder TAB_*-Name (ausser dem alten Doku) steht im Katalog */
const ric = lies('apps/ricardo/Code.gs'), tabs = ric.match(/^const TAB_L = .*$/m)[0].match(/'([^']+)'/g).map(function (s) { return s.slice(1, -1); });
const rk = ric.slice(ric.indexOf('const RICARDO_KATALOG'), ric.indexOf('];', ric.indexOf('const RICARDO_KATALOG')));
tabs.filter(function (t) { return t !== 'Doku'; }).forEach(function (t) { assert.ok(rk.indexOf("tab: '" + t + "'") > -1, 'Ricardo-Katalog ohne ' + t); });

/* 2. basisEinrichten_ mit einem Mock-Spreadsheet */
function bereich(sh, r, c, nr, nc) {
  const b = {
    setFontFamily: function (f) { sh.schrift = f; return b; }, setFontSize: function (g) { sh.groesse = g; return b; },
    getBackgrounds: function () { const z = []; for (let i = 0; i < nr; i++) { z.push([]); for (let j = 0; j < nc; j++) z[i].push(sh.farben[j] || '#ffffff'); } return z; },
    setBackgrounds: function (f) { if (r === 1) f[0].forEach(function (x, j) { sh.farben[j] = x; }); return b; },
    setFontWeight: function () { return b; }, setVerticalAlignment: function () { return b; }, setWrap: function () { return b; },
    setFontColor: function (f) { if (c === 2) sh.wertfarbe = f; return b; }, setBackground: function () { return b; }, merge: function () { return b; },
    setValues: function (v) { sh.werte = v; return b; }
  };
  return b;
}
function blatt(name, kopf, schutz) {
  const sh = {
    name: name, farben: kopf || [], frozen: 0, tab: 'x', schutz: schutz || [], werte: null,
    getName: function () { return name; }, getMaxRows: function () { return 50; }, getMaxColumns: function () { return 8; },
    getLastColumn: function () { return (kopf || []).length || 1; }, getLastRow: function () { return 10; },
    getRange: function (r, c, nr, nc) { return bereich(sh, r, c, nr || 1, nc || 1); },
    setTabColor: function (f) { sh.tab = f; }, getFrozenRows: function () { return sh.frozen; }, setFrozenRows: function (n) { sh.frozen = n; },
    setColumnWidth: function () {}, clear: function () { sh.werte = null; },
    getProtections: function () { return sh.schutz.map(function (d, i) { return { getDescription: function () { return d; }, remove: function () { sh.schutz[i] = null; } }; }).filter(function (p) { return p.getDescription() !== null; }); },
    protect: function () { const p = { setWarningOnly: function () { return p; }, setDescription: function (d) { sh.schutz = sh.schutz.filter(Boolean).concat([d]); return p; } }; return p; }
  };
  return sh;
}
const ctx = { SpreadsheetApp: { ProtectionType: { SHEET: 'SHEET' } }, console: console };
vm.createContext(ctx); vm.runInContext(basis, ctx);
const liste = [blatt('Log', ['#e6efe9', '#e6efe9']), blatt('Einstellungen', ['#e6efe9', '#e6efe9', '#e6efe9']), blatt('Daten', ['#efefef', '#666666'], ['Wird vom Test Tool geführt. Alt.']), blatt('Fremd')];
let reihenfolge = liste.slice(), aktiv = null;
const ss = {
  tz: '', setSpreadsheetTimeZone: function (z) { ss.tz = z; },
  getSheetByName: function (n) { return reihenfolge.find(function (s) { return s.name === n; }) || null; },
  insertSheet: function (n, i) { const s = blatt(n); reihenfolge.splice(i || 0, 0, s); return s; },
  setActiveSheet: function (s) { aktiv = s; }, moveActiveSheet: function (pos) { reihenfolge = reihenfolge.filter(function (s) { return s !== aktiv; }); reihenfolge.splice(pos - 1, 0, aktiv); }
};
const fehlt = ctx.basisEinrichten_(ss, { name: 'Test Tool', version: 'v1', zweck: 'Zweck.' }, [
  { tab: 'Daten', art: 'arbeit', inhalt: 'Daten.' }, { tab: 'Log', art: 'protokoll', inhalt: 'Verlauf.' },
  { tab: 'Einstellungen', art: 'einstellung', inhalt: 'Werte.' }, { tab: 'Später', art: 'arbeit', inhalt: 'Entsteht später.' }
], [['Regeln', ['Eine Regel.']]]);
assert.strictEqual(JSON.stringify(fehlt), JSON.stringify(['Später']));
assert.strictEqual(ss.tz, 'Europe/Zurich');
assert.deepStrictEqual(reihenfolge.map(function (s) { return s.name; }), ['Übersicht', 'Daten', 'Log', 'Einstellungen', 'Fremd']);
const d = ss.getSheetByName('Daten'), l = ss.getSheetByName('Log'), e = ss.getSheetByName('Einstellungen');
assert.deepStrictEqual(d.farben, ['#efefef', '#666666'], 'berechnete (dunkle) Kopfspalte bleibt');
assert.deepStrictEqual(l.farben, ['#efefef', '#efefef']);
assert.strictEqual(d.tab, null); assert.strictEqual(l.tab, '#b7b7b7'); assert.strictEqual(e.tab, '#ffd966');
assert.strictEqual(d.schrift, 'Arial'); assert.strictEqual(d.groesse, 10); assert.strictEqual(d.frozen, 1);
assert.deepStrictEqual(d.schutz.filter(Boolean).length, 1, 'alter Schutz ersetzt, nicht verdoppelt');
assert.ok(/Test Tool/.test(d.schutz.filter(Boolean)[0]));
assert.strictEqual(e.schutz.filter(Boolean).length, 0, 'Einstellungen ohne Warnschutz');
assert.strictEqual(e.wertfarbe, '#0000ff');
const ue = ss.getSheetByName('Übersicht').werte.map(function (z) { return z.join('|'); });
assert.ok(ue[0].indexOf('Test Tool') === 0);
assert.ok(ue.indexOf('Daten|Daten.|Tool|Daten (weiss)') > -1);
assert.ok(ue.indexOf('Einstellungen|Werte.|Mensch|Einstellung (gelb)') > -1);
assert.ok(ue.indexOf('|Eine Regel.||') > -1);
ue.forEach(function (z) { assert.strictEqual(z.split('|').length, 4); });

/* 3. Zweimal einrichten ändert nichts mehr (idempotent) */
const vorher = JSON.stringify(reihenfolge.map(function (s) { return [s.name, s.farben, s.tab, s.schutz.filter(Boolean)]; }));
ctx.basisEinrichten_(ss, { name: 'Test Tool', version: 'v1', zweck: 'Zweck.' }, [
  { tab: 'Daten', art: 'arbeit', inhalt: 'Daten.' }, { tab: 'Log', art: 'protokoll', inhalt: 'Verlauf.' }, { tab: 'Einstellungen', art: 'einstellung', inhalt: 'Werte.' }
], []);
assert.strictEqual(JSON.stringify(reihenfolge.map(function (s) { return [s.name, s.farben, s.tab, s.schutz.filter(Boolean)]; })), vorher);
console.log('t_basis ok');
