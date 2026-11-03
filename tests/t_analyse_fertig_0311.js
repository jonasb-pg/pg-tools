/* Feedback FG 02.11.2026, Analyse Tool: Ein schon analysiertes Stück zeigt beim Scannen die letzte Analyse (wann, wer, Ergebnis). Erfundene Daten.
   Lauf: node tests/t_analyse_fertig_0311.js */
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const c = { console, JSON, Math, Date, RegExp, Utilities: { formatDate: () => '' } };
vm.createContext(c); vm.runInContext(fs.readFileSync(__dirname + '/../apps/analyse/Code.gs', 'utf8'), c);
const AN = [
  { 'Analyse-Nr': 'A-000001', 'PG-ID': 'PG-500', 'Kürzel': 'DS', 'Ende': '01.11.2026 10:00:00', 'Regal': 'Stationär', 'Reusable': 'Ja' },
  { 'Analyse-Nr': 'A-000002', 'PG-ID': 'PG-500', 'Kürzel': 'FG', 'Ende': '02.11.2026 14:20:00', 'Regal': 'Ricardo', 'Reusable': 'Ja' },
  { 'Analyse-Nr': 'A-000003', 'PG-ID': 'PG-0600', 'Kürzel': 'SW', 'Ende': '02.11.2026 09:00:00', 'Regal': '', 'Reusable': 'Nein' }];
let gelesen = 0;
c.lies_ = n => { gelesen++; assert.strictEqual(n, 'Analysen'); return { z: AN }; };
const st = [{ id: 'PG-500', status: 'Erledigt' }, { id: 'PG-600', status: 'Erledigt' }, { id: 'PG-700', status: 'Offen' }, { id: 'PG-800', status: 'Erledigt' }];
c.fertigInfo_(st);
assert.deepStrictEqual(JSON.parse(JSON.stringify(st[0].fertig)), { nr: 'A-000002', wer: 'FG', am: '02.11.2026', regal: 'Ricardo', reusable: 'Ja' }, 'letzte Analyse zählt');
assert.strictEqual(st[1].fertig.reusable, 'Nein', 'PG-ID vereinheitlicht (PG-0600 = PG-600)');
assert.strictEqual(st[2].fertig, undefined, 'offenes Stück ohne Info');
assert.strictEqual(st[3].fertig, undefined, 'erledigt ohne Analyse-Zeile: keine Info, kein Fehler');
gelesen = 0; c.fertigInfo_([{ id: 'PG-1', status: 'Offen' }]); assert.strictEqual(gelesen, 0, 'ohne erledigte Stücke wird «Analysen» nicht gelesen');
c.lies_ = () => { throw new Error('kaputt'); }; const y = [{ id: 'PG-500', status: 'Erledigt' }]; c.fertigInfo_(y); assert.strictEqual(y[0].fertig, undefined, 'Lesefehler stört die Suche nicht');
console.log('t_analyse_fertig_0311 ok');
