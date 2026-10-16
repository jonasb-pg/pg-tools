// Funktionsauswahl: Prüfumfang der Stufe, höchstens N beworbene (die ersten = wichtigsten), «Alle» ohne Grenze
const fs = require('fs'), src = fs.readFileSync(__dirname + '/../src/Code.gs', 'utf8');
const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exit(1); } };
const f = new Function(src.slice(src.indexOf('const ARTEN = '), src.indexOf('\n', src.indexOf('const PRUEFUMFANG'))) + '\nconst MAX_BEWORBEN = 5;\n'
  + src.slice(src.indexOf('function funktionsAuswahl_('), src.indexOf('function ueberblick_(')) + '; return funktionsAuswahl_;')();
const fn = [{ n: 'Bild', a: 'Kern', ok: true }].concat([1, 2, 3, 4, 5, 6, 7].map(i => ({ n: 'B' + i, a: 'Beworben', ok: true })), [{ n: 'W1', a: 'Weitere', ok: true }, { n: 'B8', a: 'Beworben', ok: false, g: 'Konto nötig' }]);
let r = f(fn, 'Kern und beworben', {});
ok(r.kern.length === 1 && r.weitere.map(x => x.n).join() === 'B1,B2,B3,B4,B5', 'die ersten 5 beworbenen');
ok(r.ungeprueftKurz.join() === 'B6,B7,W1,B8' && r.ungeprueft[0] === 'B6 (Stufe: nur die wichtigsten 5)' && r.ungeprueft.indexOf('W1') > -1, 'Rest nicht geprüft');
r = f(fn, 'Kern und beworben', { 'Höchstens beworbene Funktionen': '2' });
ok(r.weitere.length === 2, 'Einstellung 2');
r = f(fn, 'Alle', { 'Höchstens beworbene Funktionen': '2' });
ok(r.weitere.length === 8, 'Alle: keine Grenze (7 beworbene + 1 weitere)');
r = f(fn, 'Kern', {});
ok(r.kern.length === 1 && r.weitere.length === 0 && r.ungeprueftKurz.indexOf('B1') > -1, 'nur Kern');
console.log('ok t_funktionen');
