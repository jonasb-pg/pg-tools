/* Texte für Käufer:innen (Verkaufsinfo und Ricardo): verständlich, keine Listen «Nicht geprüft: …», keine Firmware. Entscheid Jonas 17.10.2026. */
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const c = { console: console, Utilities: { formatDate: function () { return ''; } } };
vm.createContext(c); vm.runInContext(fs.readFileSync(__dirname + '/../apps/analyse/Code.gs', 'utf8'), c);
const u = { funktion: { liste: [{ n: 'Saugen' }, { n: 'Akku laden (ca. 60 Min.)' }, { n: 'Licht' }, { n: 'App-Verbindung' }] }, produkt: { umfang: 'Kern und beworben' },
  liefer: { teile: ['Staubsauger', 'Ladestation', 'Bodendüse (breit)'], unsicher: false } };
assert.strictEqual(c.geprueft_(u, { fn: ['ok', 'ok', 'np', 'ok'] }), 'Wir haben es bei uns getestet: Saugen, Akku laden und App-Verbindung funktionieren einwandfrei.');
assert.strictEqual(c.geprueft_(u, { fn: ['ok'] }), 'Wir haben es bei uns getestet: Saugen funktioniert einwandfrei.');
assert.strictEqual(c.geprueft_(u, { fn: [] }), 'Wir haben es bei uns getestet, es funktioniert einwandfrei.');
assert.strictEqual(c.geprueft_({ funktion: { ersatz: true, liste: [] } }, {}), 'Wir haben alle Teile auf Vollständigkeit und Zustand geprüft.');

let t = c.kaeuferSaetze_({ grade: 'B', fehlt: ['Bodendüse (breit)'], rep: [], nichtGeprueftKurz: ['Schwarzen Toner für den Druck liefern (ca. 8000 Seiten)'] }, u, { fn: ['ok', 'ok', 'np', 'ok'], maengel: 'Kratzer am Griff' });
assert.deepStrictEqual(JSON.parse(JSON.stringify(t)), ['Das Produkt ist neu und unbenutzt. Das ist uns aufgefallen: Kratzer am Griff.',
  'Wir haben es bei uns getestet: Saugen, Akku laden und App-Verbindung funktionieren einwandfrei.',
  'Im Paket sind Staubsauger und Ladestation. Bodendüse fehlt.']);
assert.ok(!/Nicht geprüft|nicht ausprobiert|Toner|Firmware/.test(t.join(' ')));
assert.strictEqual(c.kaeuferSaetze_({ versiegelt: true, grade: 'A' }, u, { maengel: 'x' }).join(' '), 'Das Produkt ist neu und originalverpackt, die Verpackung ist noch versiegelt.');
t = c.kaeuferSaetze_({ grade: 'A', fehlt: [], rep: [{ text: 'Netzkabel ersetzt' }] }, u, { fn: ['ok'] }).join(' ');
assert.strictEqual(t, 'Das Produkt ist neu und unbenutzt, in der Originalverpackung. Wir haben es bei uns getestet: Saugen funktioniert einwandfrei. Ausserdem haben wir es repariert: Netzkabel ersetzt. '
  + 'Im Paket sind Staubsauger, Ladestation und Bodendüse.');
/* unsicherer Lieferumfang: nur was fehlt */
t = c.kaeuferSaetze_({ grade: 'C', fehlt: ['Akku', 'Netzteil'], rep: [] }, { funktion: u.funktion, liefer: { teile: ['X'], unsicher: true } }, { fn: [] }).join(' ');
assert.strictEqual(t, 'Das Produkt ist gebraucht. Wir haben es bei uns getestet, es funktioniert einwandfrei. Akku und Netzteil fehlen.');
/* Grades = Ricardo-Zustände (Entscheid Jonas 17.10.2026) */
assert.strictEqual(c.ricardoZustand_({ reusable: true, grade: 'A' }), 'Neu und originalverpackt');
assert.strictEqual(c.ricardoZustand_({ reusable: true, grade: 'B' }), 'Neu (gemäss Beschreibung)');
assert.strictEqual(c.ricardoZustand_({ reusable: true, grade: 'C' }), 'Gebraucht');
assert.strictEqual(c.ricardoZustand_({ reusable: true, versiegelt: true, grade: 'A' }), 'Neu und originalverpackt');
const NEU_E = vm.runInContext('NEUE_EINSTELLUNGEN', c), UMBAU = vm.runInContext('EINST_UMBAU', c);
['A', 'B', 'C'].forEach(function (g) {
  const neu = NEU_E.filter(function (n) { return n[0] === 'Grade ' + g; })[0], um = UMBAU.filter(function (n) { return n[0] === 'Grade ' + g; })[0];
  assert.ok(neu && um && neu[1] === um[3] && neu[2] === um[2], 'Umbau Grade ' + g + ' passt zur Vorgabe');
});
assert.strictEqual(NEU_E.filter(function (n) { return n[0] === 'Grade A'; })[0][1].split(':')[0], 'Neu und originalverpackt');
console.log('t_geprueft ok');
