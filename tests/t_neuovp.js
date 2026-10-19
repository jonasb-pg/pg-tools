/* Neu und unbenutzt, Verpackung geöffnet (Feedback DS/SW, Entscheid Jonas 19.10.2026): Hygiene und Zurücksetzen entfallen. Erfundene Daten. */
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const c = { console: console, Utilities: { formatDate: function () { return ''; } } };
vm.createContext(c); vm.runInContext(fs.readFileSync(__dirname + '/../apps/analyse/Code.gs', 'utf8'), c);
const u = { ablauf: ['ident', 'hygiene', 'voll', 'funktion', 'reset', 'zustand', 'entscheid'], rueckruf: null, firmware: false,
  funktion: { liste: [{ n: 'Ein', t: 'Einschalten', g: 'Kern' }], ungeprueft: [], ungeprueftKurz: [] }, reset: [['Zurücksetzen', 'x'], ['Kontrolle', 'y']],
  liefer: { teile: ['Kabel'], unsicher: false }, sicher: [], zustand: { grade: [['A', 'Neu und originalverpackt', ''], ['B', 'Neu', ''], ['C', 'Gebraucht', '']] }, produkt: { umfang: 'Kern' } };
const basis = { fn: ['ok'], grade: 'A', fehlt: [], rep: [] };
let x = JSON.parse(JSON.stringify(c.urteil_(Object.assign({}, basis), u, {})));
assert.deepStrictEqual(x.offen.map(function (o) { return o[0]; }).sort(), ['o.hygiene', 'o.reset'], 'normal: Hygiene und Zurücksetzen offen');
x = JSON.parse(JSON.stringify(c.urteil_(Object.assign({ neuOvp: true }, basis), u, {})));
assert.ok(!x.offen && x.reusable && x.grade === 'A', 'neu und unbenutzt: nichts offen');
assert.ok(/Zurücksetzen entfällt/.test(x.befund), x.befund);
x = JSON.parse(JSON.stringify(c.urteil_(Object.assign({ neuOvp: true, ko: { art: 'sperre' } }, basis), u, {})));
assert.strictEqual(x.reusable, false, 'K.-o. gilt trotzdem');
const z = JSON.parse(JSON.stringify(c.schritte_(Object.assign({ neuOvp: true, unbenutzt: true, reset: 0 }, basis), u, 6)));
assert.ok(z.some(function (r) { return r['Block'] === 'Zurücksetzen' && /entfällt/.test(r['Ergebnis']); }), 'Protokoll: Zurücksetzen entfällt');
assert.ok(z.some(function (r) { return r['Block'] === 'Hygiene' && r['Ergebnis'] === 'ok'; }));
console.log('t_neuovp ok');
