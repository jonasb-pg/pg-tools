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
assert.strictEqual(t, 'Gebraucht, kaum Gebrauchsspuren. Kratzer am Griff. Von uns getestet, funktioniert einwandfrei: Saugen, Akku laden und App-Verbindung. '
  + 'Einzelne Zusatzfunktionen haben wir nicht ausprobiert. Dabei: Staubsauger und Ladestation. Nicht dabei: Bodendüse.');
assert.ok(!/Nicht geprüft|Toner|Firmware/.test(t));
assert.strictEqual(c.kaeuferSaetze_({ versiegelt: true, grade: 'A' }, u, {}).join(' '), 'Neu und originalverpackt, ungeöffnet.');
t = c.kaeuferSaetze_({ grade: 'A', fehlt: [], rep: [{ text: 'Netzkabel ersetzt' }] }, u, { fn: ['ok'] }).join(' ');
assert.ok(/^Neu, ohne Gebrauchsspuren\. Die Verpackung wurde geöffnet\./.test(t) && /Von uns repariert: Netzkabel ersetzt\./.test(t) && /Dabei: Staubsauger, Ladestation und Bodendüse\./.test(t), t);
/* unsicherer Lieferumfang: kein «Dabei», nur was fehlt */
t = c.kaeuferSaetze_({ grade: 'C', fehlt: ['Akku'], rep: [] }, { funktion: u.funktion, liefer: { teile: ['X'], unsicher: true } }, { fn: [] }).join(' ');
assert.strictEqual(t, 'Gebraucht, mit sichtbaren Gebrauchsspuren. Von uns getestet: funktioniert einwandfrei. Nicht dabei: Akku.');
console.log('t_geprueft ok');
