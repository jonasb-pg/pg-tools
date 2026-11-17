/* Etikett aus dem Analyse Tool (17.11.2026, Jonas), Server: Der Druck steht als Zeile «Etikett» im Log, sonst wird nichts geschrieben. Erfundene Daten.
   Lauf: node tests/t_analyse_etikett.js */
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const c = { console, JSON, Math, Date, RegExp, Utilities: { formatDate: () => '' } };
vm.createContext(c); vm.runInContext(fs.readFileSync(__dirname + '/../apps/analyse/Code.gs', 'utf8'), c);
const log = [];
c.log_ = (a, id, d) => { log.push([a, id, d]); };
c.vorladen_ = () => {};
assert.strictEqual(c.api('de', 'etikettLog', ['PG-25337', 'auto', 'JB']), true, 'über api erreichbar');
assert.deepStrictEqual(log.pop(), ['Etikett', 'PG-25337', 'automatisch nach Abschluss · JB']);
c.etikettLog('AN-0068', 'hand', 'SW'); assert.deepStrictEqual(log.pop(), ['Etikett', 'AN-0068', 'von Hand · SW']);
c.etikettLog('=HYPERLINK("x")', 'irgendwas', '=1+1XYZ'); const z = log.pop();
assert.ok(z[1].charAt(0) === "'" && z[2] === "von Hand · '=1+1", 'Formeln werden entschärft, das Kürzel gekürzt, unbekannte Art zählt als von Hand');
c.etikettLog(); assert.deepStrictEqual(log.pop(), ['Etikett', '', 'von Hand · '], 'ohne Angaben kein Fehler');
assert.deepStrictEqual(Array.from(vm.runInContext('VORLADEN.etikettLog', c)), [], 'liest keinen Tab vor');
assert.strictEqual(vm.runInContext('VERSION', c), '2026-11-17.3');
console.log('t_analyse_etikett ok');
