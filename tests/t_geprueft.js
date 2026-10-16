/* Texte für Käufer:innen (Verkaufsinfo und Ricardo): verständlich, keine Listen «Nicht geprüft: …», keine Firmware. Entscheid Jonas 17.10.2026. */
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const c = { console: console, Utilities: { formatDate: function () { return ''; } } };
vm.createContext(c); vm.runInContext(fs.readFileSync(__dirname + '/../apps/analyse/Code.gs', 'utf8'), c);
const u = { funktion: { liste: [{ n: 'Saugen' }, { n: 'Akku laden (ca. 60 Min.)' }, { n: 'Licht' }, { n: 'App-Verbindung' }] }, produkt: { umfang: 'Kern und beworben' },
  liefer: { teile: ['Staubsauger', 'Ladestation', 'Bodendüse (breit)'], unsicher: false } };
assert.strictEqual(c.geprueft_(u, { fn: ['ok', 'ok', 'np', 'ok'] }), 'Von uns getestet, funktioniert einwandfrei: Saugen, Akku laden und App-Verbindung.');
assert.strictEqual(c.geprueft_(u, { fn: [] }), 'Von uns getestet: funktioniert einwandfrei.');
assert.strictEqual(c.geprueft_({ funktion: { ersatz: true, liste: [] } }, {}), 'Von uns geprüft: vollständig und in gutem Zustand.');

let t = c.kaeuferSaetze_({ grade: 'B', fehlt: ['Bodendüse (breit)'], rep: [], nichtGeprueftKurz: ['Schwarzen Toner für den Druck liefern (ca. 8000 Seiten)'] }, u, { fn: ['ok', 'ok', 'np', 'ok'], maengel: 'Kratzer am Griff' }).join(' ');
assert.strictEqual(t, 'Neu, unbenutzt (gemäss Beschreibung). Kratzer am Griff. Von uns getestet, funktioniert einwandfrei: Saugen, Akku laden und App-Verbindung. '
  + 'Einzelne Zusatzfunktionen haben wir nicht ausprobiert. Dabei: Staubsauger und Ladestation. Nicht dabei: Bodendüse.');
assert.ok(!/Nicht geprüft|Toner|Firmware/.test(t));
assert.strictEqual(c.kaeuferSaetze_({ versiegelt: true, grade: 'A' }, u, {}).join(' '), 'Neu und originalverpackt, ungeöffnet.');
t = c.kaeuferSaetze_({ grade: 'A', fehlt: [], rep: [{ text: 'Netzkabel ersetzt' }] }, u, { fn: ['ok'] }).join(' ');
assert.ok(/^Neu und originalverpackt\./.test(t) && /Von uns repariert: Netzkabel ersetzt\./.test(t) && /Dabei: Staubsauger, Ladestation und Bodendüse\./.test(t), t);
/* unsicherer Lieferumfang: kein «Dabei», nur was fehlt */
t = c.kaeuferSaetze_({ grade: 'C', fehlt: ['Akku'], rep: [] }, { funktion: u.funktion, liefer: { teile: ['X'], unsicher: true } }, { fn: [] }).join(' ');
assert.strictEqual(t, 'Gebraucht. Von uns getestet: funktioniert einwandfrei. Nicht dabei: Akku.');
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
