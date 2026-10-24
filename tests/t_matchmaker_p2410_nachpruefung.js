/* Nachprüfung 24.10.2026, Matchmaker-Script, Befund 4: Ein Stück, das bei einem geholten Auftrag in «Aus Analyse» steht, ist nur ausgeschlossen,
   solange es danach nicht nochmals analysiert wurde (Retoure). Tag der letzten Analyse = Spalte «Ende» im ANALYSE TOOL, Tab «Analysen».
   Gleiche Regel wie mmGeholt_ im Analyse Tool. Erfundene Daten. Lauf: node tests/t_matchmaker_p2410_nachpruefung.js */
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const CODE = fs.readFileSync(process.env.MM_CODE || (__dirname + '/../apps/matchmaker/Code.gs'), 'utf8');
const pad = n => ('0' + n).slice(-2);
const ANALYSEN = [['Analyse-Nr', 'PG-ID', 'Reusable', 'Regal', 'Ende'],
  ['A-1', 'PG-50', 'Ja', 'Matchmaker', '21.10.2026 10:00:00'],          // für Auftrag «Toaster» analysiert, geholt am 22.10.
  ['A-9', 'PG-50', 'Ja', 'Analysiert', new Date(2026, 9, 30, 9, 0, 0)], // Retoure, am 30.10. neu analysiert, normales Regal
  ['A-2', 'PG-60', 'Ja', 'Matchmaker', '22.10.2026 15:00:00'],          // geholt, keine neue Analyse
  ['A-3', 'PG-70', 'Ja', 'Analysiert', '19.10.2026 15:00:00']];         // Vermerk ohne Datum
const blatt = v => ({ getDataRange: () => ({ getValues: () => v.map(r => r.slice()) }) });
const c = { console, JSON, Math, Date, RegExp,
  Utilities: { formatDate: (d, tz, f) => f.replace('yyyy', d.getFullYear()).replace('MM', pad(d.getMonth() + 1)).replace('dd', pad(d.getDate())) },
  SpreadsheetApp: { openById: () => ({ getSheetByName: n => (n === 'Analysen' ? blatt(ANALYSEN) : null) }) } };
vm.createContext(c); vm.runInContext(CODE, c);
const an = c.leseErledigt_();
assert.ok(an.tage && an.tage['PG-50'] === '2026-10-30' && an.tage['PG-60'] === '2026-10-22', 'Tag der letzten Analyse: ' + JSON.stringify(an.tage));
const zellen = ['PG-50 · Dualit Lite 2 · 21.10.2026', 'PG-60 · Dyson · 22.10.2026 · Fotos: https://drive.google.com/drive/folders/x', 'PG-70 · Lampe'];
const ids = JSON.parse(JSON.stringify(c.ausAnalyseIds_(zellen, an.tage)));
assert.ok(!ids['PG-50'], 'Befund 4: Retoure nach dem Vermerk nicht mehr ausgeschlossen: ' + JSON.stringify(ids));
assert.ok(ids['PG-60'] && ids['PG-70'], 'gleicher Tag oder ohne Datum: weiter ausgeschlossen');
assert.ok(JSON.parse(JSON.stringify(c.ausAnalyseIds_(zellen)))['PG-50'], 'ohne Tage (z.B. Aufräumen): wie bisher');
console.log('ok: Nachprüfung Matchmaker (Befund 4)');
