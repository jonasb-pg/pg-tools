/* Feedbacks DS/SW, Entscheid Jonas 23.10.2026: «doch getestet», OVP Pflicht mit VP 50%, Dauer für Verkauf. Erfundene Daten. */
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const c = { console, JSON, Math, Date, Utilities: { formatDate: () => '' } };
vm.createContext(c); vm.runInContext(fs.readFileSync(__dirname + '/../apps/analyse/Code.gs', 'utf8'), c);
assert.throws(() => c.ohneInventar('X', '', 1, '', 2, 'Grund lang', true), /Nur Stücke mit PG-ID/, 'ohne Inventar abgeschaltet (Entscheid 24.10.2026)');
vm.runInContext('OHNE_INVENTAR = true;', c);
const u = { ablauf: ['ident', 'funktion', 'zustand', 'entscheid'], rueckruf: null, firmware: false, strom: ['230 V'],
  funktion: { liste: [{ n: 'Einschalten', t: 'Einschalten', g: 'Kern' }, { n: 'Timer', t: 'Timer stellen', g: 'Weitere' }], ungeprueft: ['Bluetooth (App nötig)', 'Fernbedienung (Stufe: nur die wichtigsten 3)'], ungeprueftKurz: ['Bluetooth', 'Fernbedienung'] },
  reset: [], liefer: { teile: ['Kabel'], unsicher: false }, sicher: [], zustand: { grade: [['A', 'Neu', ''], ['B', 'Neu', ''], ['C', 'Gebraucht', '']] }, produkt: { umfang: 'Kern' } };
const j = x => JSON.parse(JSON.stringify(x));

/* 1. «doch getestet» */
let x = j(c.urteil_({ fn: ['ok', 'np'], grade: 'C' }, u, {}));
assert.ok(/Nicht geprüft: Bluetooth, Fernbedienung, Timer/.test(x.befund), x.befund);
assert.strictEqual(x.wahl.join(), 'Bluetooth,Fernbedienung,Timer');
x = j(c.urteil_({ fn: ['ok', 'np'], grade: 'C', doch: ['Bluetooth', 'Timer'] }, u, {}));
assert.ok(/Nicht geprüft: Fernbedienung\./.test(x.befund) && !/Bluetooth|Timer/.test(x.befund.replace(/Wir haben.*$/, '')), x.befund);
assert.strictEqual(x.nichtGeprueft.join(), 'Fernbedienung (Stufe: nur die wichtigsten 3)');
assert.ok(/Einschalten, Timer und Bluetooth funktionieren einwandfrei/.test(x.verkaufsinfo), x.verkaufsinfo);
assert.strictEqual(x.doch.join(), 'Bluetooth,Timer');
assert.strictEqual(x.wahl.join(), 'Bluetooth,Fernbedienung,Timer', 'Auswahl bleibt, damit man es zurücknehmen kann');
/* Kernfunktion «nicht prüfbar», doch getestet: kein «o.kern» mehr */
x = j(c.urteil_({ fn: ['np', 'ok'], grade: 'C' }, u, {}));
assert.ok(x.offen && x.offen.some(o => o[0] === 'o.kern'));
x = j(c.urteil_({ fn: ['np', 'ok'], grade: 'C', doch: ['Einschalten'] }, u, {}));
assert.ok(!x.offen && x.reusable, 'mit «doch getestet» abschliessbar');
/* Unbekannte Namen zählen nicht */
x = j(c.urteil_({ fn: ['ok', 'ok'], grade: 'C', doch: ['Erfunden'] }, u, {}));
assert.strictEqual(x.doch.length, 0);
/* Protokoll */
const z = j(c.schritte_({ fn: ['np', 'ok'], doch: ['Einschalten', 'Bluetooth'] }, u, 3));
assert.ok(z.some(r => r['Schritt'] === 'Einschalten' && r['Ergebnis'] === 'ok (nachträglich getestet)'));
assert.ok(z.some(r => r['Schritt'] === 'Bluetooth' && r['Herkunft Schritt'] === 'Nachträglich getestet' && r['Ergebnis'] === 'ok'));
/* Gleicher Code im Browser */
const b = { window: {} }; vm.createContext(b); vm.runInContext(c.urteilQuelle_(), b);
assert.strictEqual(b.window.URTEIL.pruefen({ fn: ['ok', 'np'], grade: 'C', doch: ['Timer'] }, u, {}).doch.join(), 'Timer');

/* 2. OVP Pflicht, VP = 50% vom OVP */
assert.strictEqual(c.vpAusOvp_(199), 100);
let P = [{ _r: 2, 'PG-ID': 'PG-1', 'Neupreis CHF': '' }], gesetzt = {};
c.produkt_ = () => P[0]; c.gesperrt_ = f => f(); c.setz_ = (n, f, w) => { gesetzt[f] = w[2]; }; c.log_ = () => {}; c.starteAnalyse = () => 'ok';
assert.throws(() => c.preisSetzen('PG-1', 50, ''), /OVP/);
c.preisSetzen('PG-1', '', 120); assert.strictEqual(gesetzt['VP CHF'], 60); assert.strictEqual(gesetzt['Neupreis CHF'], 120);
P[0]['Neupreis CHF'] = 80; gesetzt = {}; c.preisSetzen('PG-1', '', ''); assert.strictEqual(gesetzt['VP CHF'], 40, 'OVP schon da');
gesetzt = {}; c.preisSetzen('PG-1', 55, ''); assert.strictEqual(gesetzt['VP CHF'], 55, 'eigener VP gilt');
let neu = []; c.einst_ = () => ({}); c.rtSuche_ = () => []; c.lies_ = () => ({ z: [] }); c.schreib_ = (n, o) => { neu = neu.concat(o); }; c.zeit_ = () => '';
assert.throws(() => c.ohneInventar('Gerät X', '', '', '', '', 'Reuse-Spende'), /OVP/);
c.ohneInventar('Gerät X', '', '', '', 90, 'Reuse-Spende');
assert.strictEqual(neu[0]['VP CHF'], 45);

/* 6. Dauer Verkauf im Tab «Analysen» */
assert.ok(c.ANALYSEN_KOPF === undefined || true);
const kopf = vm.runInContext('ANALYSEN_KOPF', c);
assert.ok(kopf.indexOf('Dauer Analyse Min') > -1 && kopf.indexOf('Dauer Verkauf Min') > -1);
console.log('t_feedback_2310 ok');
