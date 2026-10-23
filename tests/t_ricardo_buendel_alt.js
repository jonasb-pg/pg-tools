/* Ricardo, Nach-Review 24.10.2026: später Verkauf über die alte eigene Zeile eines Bündel-Teils gilt nicht als sicher; Archiv nicht lesbar → Bestätigung. Erfundene Daten. */
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const c = { console }; vm.createContext(c);
vm.runInContext(fs.readFileSync(__dirname + '/../apps/ricardo/Code.gs', 'utf8'), c);
vm.runInContext(`
var row = function (id, st, link, b) { const r = L_COLS.map(function () { return ''; }); r[0] = id; r[1] = st; r[col_('Ricardo-Link') - 1] = link; r[col_('Bündel-IDs') - 1] = b || ''; return r; };
var L1 = 'https://www.ricardo.ch/de/a/t-1111111111/', L2 = 'https://www.ricardo.ch/de/a/t-2222222222/';
var zu = function (rows, art) { return verkaufZuordnen_(listingKarte_(rows), rows, '', art); };
`, c);
let z = vm.runInContext("zu([row('PG-50', 'Unverkauft', L1), row('PG-60', 'Gelistet', L2, 'PG-50')], '1111111111')", c);
assert.ok(z && z.sicher === false && z.i === 1 && /früheres Angebot/.test(z.warnung), 'Teil im laufenden Bündel: alter Verkauf nicht sicher, Hinweis beim Bündel');
z = vm.runInContext("zu([row('PG-50', 'Gelistet', L1)], '1111111111')", c);
assert.ok(z.sicher === true && z.i === 0, 'normaler Verkauf bleibt sicher');
z = vm.runInContext("zu([row('PG-50', 'Unverkauft', L1), row('PG-60', 'Unverkauft', L2, 'PG-50')], '1111111111')", c);
assert.ok(z.sicher === true, 'Bündel auch frei: kein Konflikt');
z = vm.runInContext("zu([row('PG-60', 'Gelistet', L2, 'PG-50')], '2222222222')", c);
assert.ok(z.sicher === true && z.i === 0, 'Verkauf des Bündels selbst bleibt sicher');
/* Archiv nicht lesbar: vorpruefen_ meldet archivFehler */
vm.runInContext(`findeAnalyse_ = function () { return null; }; findeQuelle_ = function () { return { tab: 'Online', id: 'PG-50' }; };
  rtQuelle_ = function () { return {}; }; rtTabs_ = function () { return { archiv: ['Archiv Stationär'] }; };
  quelleGemerkt_ = function () { throw new Error('Kopfzeile fehlt'); };`, c);
const v = c.vorpruefen_('PG-50', false);
assert.ok(/nicht lesbar/.test(v.archivFehler) && !v.archiv, 'Archiv nicht lesbar wird gemeldet');
console.log('t_ricardo_buendel_alt ok');
