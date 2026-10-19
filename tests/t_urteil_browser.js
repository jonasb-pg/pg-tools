/* Weg A: Das Urteil im Browser (urteilQuelle_) muss genau das gleiche liefern wie pruefen() auf dem Server. Erfundene Daten. Lauf: node tests/t_urteil_browser.js */
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const c = { console: console, Utilities: { formatDate: function () { return ''; } } };
vm.createContext(c); vm.runInContext(fs.readFileSync(__dirname + '/../apps/analyse/Code.gs', 'utf8'), c);
const quelle = c.urteilQuelle_();
assert.ok(!/<\/script/i.test(quelle), 'kein </script> in der Quelle');
/* leerer «Browser»: nur window, kein Apps-Script-Dienst */
const b = { window: {} }; b.window = b;
vm.createContext(b); vm.runInContext(quelle, b);
assert.ok(b.URTEIL && typeof b.URTEIL.urteil === 'function', 'URTEIL im Browser da');
const u = { ablauf: ['ident', 'hygiene', 'sicher', 'voll', 'funktion', 'reset', 'zustand', 'entscheid'], rueckruf: null, firmware: false,
  funktion: { liste: [{ n: 'Ein', t: 'Einschalten', g: 'Kern' }, { n: 'Licht', t: 'Licht', g: 'Weitere' }], ungeprueft: ['App'], ungeprueftKurz: ['App'] }, reset: [['Zurücksetzen', 'x'], ['Kontrolle', 'y']],
  liefer: { teile: ['Kabel', 'Bodendüse (breit)'], unsicher: false }, sicher: ['Kabel unbeschädigt'], zustand: { grade: [['A', 'Neu und originalverpackt', ''], ['B', 'Neu', ''], ['C', 'Gebraucht', '']] },
  produkt: { umfang: 'Kern', vp: 120, budget: 10 }, reparatur: { stundenansatz: 60, grenze: 50 }, einst: { 'Garantie Tage': 30 } };
const faelle = [
  { fn: ['ok', 'ok'], grade: 'A', fehlt: [], rep: [] },
  { fn: ['ok', 'nok'], grade: 'B', fehlt: ['Bodendüse (breit)'], rep: [{ was: 'Kabel', text: 'Kabel ersetzt', min: 10, teil: 5 }], unbenutzt: true, sicher: true, reset: 2, maengel: 'Kratzer' },
  { neuOvp: true, fn: ['ok', 'np'], grade: 'A', fehlt: [], rep: [], sicher: true },
  { versiegelt: true, fn: [], grade: '', fehlt: [], rep: [] },
  { ko: { art: 'defekt', text: 'Motor', schritt: 'funktion', min: 120, teil: 80 }, fn: ['nok'], grade: '', fehlt: [], rep: [] },
  { unbenutzt: true, sicher: true, reset: 2, fn: ['ok', 'ok'], grade: 'C', fehlt: [], rep: [], maengel: 'Delle' }
];
faelle.forEach(function (d, i) {
  const s = JSON.parse(JSON.stringify(c.pruefenAus_(c.urteil_(JSON.parse(JSON.stringify(d)), u, u.einst))));
  const x = b.URTEIL.urteil(JSON.parse(JSON.stringify(d)), u, u.einst);
  const r = JSON.parse(JSON.stringify(x.offen ? { offen: x.offen, befundAuto: x.befundAuto || '' } : { reusable: x.reusable, grade: x.grade, grund: x.grund, befundAuto: x.befundAuto, befund: x.befund, hinweis: x.hinweis, rep: x.rep,
    versiegelt: x.versiegelt, ricardoZustand: b.URTEIL.ricardoZustand(x), verkaufsinfo: x.verkaufsinfo }));
  assert.deepStrictEqual(r, s, 'Fall ' + (i + 1) + ' gleich wie der Server');
});
console.log('t_urteil_browser ok (' + faelle.length + ' Fälle, ' + quelle.length + ' Zeichen)');
