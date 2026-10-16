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
assert.strictEqual(c.kaeuferSaetze_({ versiegelt: true, grade: 'A' }, u, { maengel: 'x' }).filter(String).join(' '), 'Das Produkt ist neu und originalverpackt, die Verpackung ist noch versiegelt.');
t = c.kaeuferSaetze_({ grade: 'A', fehlt: [], rep: [{ text: 'Netzkabel ersetzt' }] }, u, { fn: ['ok'] }).filter(String).join(' ');
assert.strictEqual(t, 'Das Produkt ist neu und unbenutzt, in der Originalverpackung. Wir haben es bei uns getestet: Saugen funktioniert einwandfrei. Ausserdem haben wir es repariert: Netzkabel ersetzt. '
  + 'Im Paket sind Staubsauger, Ladestation und Bodendüse.');
/* unsicherer Lieferumfang: nur was fehlt */
t = c.kaeuferSaetze_({ grade: 'C', fehlt: ['Akku', 'Netzteil'], rep: [] }, { funktion: u.funktion, liefer: { teile: ['X'], unsicher: true } }, { fn: [] }).filter(String).join(' ');
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
/* Hinweise aus der Recherche erscheinen nicht als Teile */
t = c.kaeuferSaetze_({ grade: 'B', fehlt: [], rep: [] }, { funktion: u.funktion, liefer: { teile: ['Gefrierschüssel', 'Gedruckte Anleitung: unbekannt', 'AT957A (Major) liegen 2 Paddel («C» und «M») bei', 'Ladegerät (Steckertyp am Gerät ablesen)', 'Ausführungen AT956A/AT956B: Unterschied unbekannt; Farbe am Gerät ablesen'], unsicher: false } }, { fn: [] });
assert.strictEqual(t[2], 'Im Paket sind Gefrierschüssel und Ladegerät.');
t = c.kaeuferSaetze_({ grade: 'B', fehlt: [], rep: [] }, { funktion: { liste: [{ n: 'Unbeschädigt und benutzbar' }] }, liefer: { teile: ['Akku-Handkreissäge', 'Kein Akku', 'Kein Ladegerät', 'Kein Ladenetzteil im Lieferumfang', 'Eichenstücke 10 cm, bis 25 %'], unsicher: false } }, { fn: ['ok'] });
assert.deepStrictEqual(JSON.parse(JSON.stringify(t.slice(1))), ['Wir haben alle Teile auf Vollständigkeit und Zustand geprüft.', 'Im Paket ist Akku-Handkreissäge. Nicht im Lieferumfang sind Akku, Ladegerät und Ladenetzteil.']);
/* Ohne Strom: Satz zur Vollständigkeit statt Liste von Handgriffen */
assert.strictEqual(c.geprueft_({ funktion: u.funktion, strom: [] }, { fn: ['ok', 'ok'] }), 'Wir haben alle Teile auf Vollständigkeit und Zustand geprüft.');
assert.ok(/Saugen/.test(c.geprueft_({ funktion: u.funktion, strom: ['Akku'] }, { fn: ['ok'] })));
/* Struktur des Ricardo-Beschriebs (Vorlage Jonas 17.10.2026) */
const e = { 'Ricardo-Versandsatz': 'Versand ausschliesslich per Post, keine Abholung.', 'Ricardo-Schlusssatz': 'Schluss.' };
let b = c.ricardoBeschrieb_('Einleitung.', ['Punkt eins', 'Punkt zwei'], ['Das Produkt ist neu und unbenutzt.', 'Wir haben es bei uns getestet: A und B funktionieren einwandfrei.', 'Im Paket ist X. Y fehlt.'], 0, e);
assert.strictEqual(b, 'Einleitung.\n\n– Punkt eins\n– Punkt zwei\n\nDas Produkt ist neu und unbenutzt.\nWir haben es bei uns getestet:\nA und B funktionieren einwandfrei.\n\nIm Paket ist X. Y fehlt.\n\nVersand ausschliesslich per Post, keine Abholung.\n\nSchluss.');
b = c.ricardoBeschrieb_('', [], ['Das Produkt ist neu und originalverpackt, die Verpackung ist noch versiegelt.', '', ''], 303, e);
assert.strictEqual(b, 'Das Produkt ist neu und originalverpackt, die Verpackung ist noch versiegelt.\n\nNeupreis: CHF 303.00\n\nVersand ausschliesslich per Post, keine Abholung.\n\nSchluss.');
const SCHL = vm.runInContext('NEUE_EINSTELLUNGEN', c).filter(function (n) { return n[0] === 'Ricardo-Schlusssatz'; })[0][1];
assert.ok(!/nicht geprüfte/.test(SCHL) && /Garantie von 30 Tagen/.test(SCHL));
assert.ok(/Lieferumfang/.test(vm.runInContext('RICARDO_ANWEISUNG', c)));
/* Startpreis-Vorschlag nach Grade (Entscheid Jonas 17.10.2026), im Admin änderbar */
assert.strictEqual(c.startpreis_({ 'Neupreis CHF': 303, 'VP CHF': 150 }, 'A', {}), 152);
assert.strictEqual(c.startpreis_({ 'Neupreis CHF': 303, 'VP CHF': 150 }, 'C', {}), 106);
assert.strictEqual(c.startpreis_({ 'Neupreis CHF': '', 'VP CHF': 70 }, 'B', {}), 70);
assert.strictEqual(c.startpreis_({ 'Neupreis CHF': 200 }, 'C', { 'Startpreis C % vom Neupreis': 40 }), 80);
assert.strictEqual(c.startpreisProzent_({ 'Startpreis A/B % vom Neupreis': 'x' }).A, 50);
console.log('t_geprueft ok');
