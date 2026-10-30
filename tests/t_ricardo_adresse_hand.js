/* Ricardo Tool, Feedback Jonas 30.10.2026: Adresse von Hand beim Packen (adresseLesen_, adresseVonHand). Erfundene Daten. Lauf: node tests/t_ricardo_adresse_hand.js */
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const c = { console: console };
vm.createContext(c); vm.runInContext(fs.readFileSync(__dirname + '/../apps/ricardo/Code.gs', 'utf8'), c);
const V_COLS = vm.runInContext('V_COLS', c), LOG = [];
const lies = t => JSON.parse(JSON.stringify(c.adresseLesen_(t)));

// Block wie auf der Ricardo-Verkaufsseite (mit Kopfzeile)
assert.deepStrictEqual(lies('Lieferadresse\n\nAnna Muster\nMusterweg 12a\n3013 Bern'),
  { firma: '', vorname: 'Anna', nachname: 'Muster', strasse: 'Musterweg', nr: '12a', postfach: '', plz: '3013', ort: 'Bern' }, 'Person');
assert.deepStrictEqual(lies('Beispiel GmbH\nPeter Probe\nBahnhofstrasse 1\nCH-8001 Zürich\nSchweiz'),
  { firma: 'Beispiel GmbH', vorname: 'Peter', nachname: 'Probe', strasse: 'Bahnhofstrasse', nr: '1', postfach: '', plz: '8001', ort: 'Zürich' }, 'Firma, CH-, Land');
assert.deepStrictEqual(lies('Praxis Am Platz\nHauptgasse 7\n4500 Solothurn'),
  { firma: '', vorname: 'Praxis Am', nachname: 'Platz', strasse: 'Hauptgasse', nr: '7', postfach: '', plz: '4500', ort: 'Solothurn' }, 'eine Namenszeile (Firma als Name)');
assert.deepStrictEqual(lies('  Eva   Test \r\nPostfach 123\n6000 Luzern 7'),
  { firma: '', vorname: 'Eva', nachname: 'Test', strasse: '', nr: '', postfach: '123', plz: '6000', ort: 'Luzern 7' }, 'Postfach ohne Strasse');
assert.deepStrictEqual(lies('Max Beispiel\nmax@example.com\n+41 79 000 00 00\nWeg 3\n1000 Lausanne'),
  { firma: '', vorname: 'Max', nachname: 'Beispiel', strasse: 'Weg', nr: '3', postfach: '', plz: '1000', ort: 'Lausanne' }, 'Mail und Telefon ignoriert');
assert.throws(() => c.adresseLesen_('Anna Muster\nMusterweg 12'), /Zeile «PLZ Ort» fehlt/, 'ohne PLZ');
assert.throws(() => c.adresseLesen_('Anna Muster\n3013 Bern'), /Strasse fehlt/, 'ohne Strasse');
assert.throws(() => c.adresseLesen_('Musterweg 12\n3013 Bern'), /Name fehlt/, 'ohne Name');
assert.throws(() => c.adresseLesen_(''), /PLZ Ort/, 'leer');

// adresseVonHand: schreibt die 8 Spalten Firma..Ort der richtigen Zeile, als Text, nur offene Verkäufe, Ersetzen mit Bestätigung
const leer = () => V_COLS.map(() => '');
const z1 = leer(), z2 = leer(), z3 = leer();
z1[0] = '50000001'; z1[V_COLS.indexOf('Status')] = 'Zu packen'; z1[V_COLS.indexOf('PG-ID')] = 'PG-1'; z1[V_COLS.indexOf('Total CHF')] = 20; z1[V_COLS.indexOf('Käufer')] = 'nick1';
z2[0] = '50000002'; z2[V_COLS.indexOf('Status')] = 'Bezahlt und versendet';
z3[0] = '50000003'; z3[V_COLS.indexOf('Status')] = 'Zu packen'; z3[V_COLS.indexOf('Nachname')] = 'Alt'; z3[V_COLS.indexOf('PLZ')] = '9000'; z3[V_COLS.indexOf('Ort')] = 'St. Gallen';
const rows = [z1, z2, z3], FORMAT = {};
const sheet = {
  getLastRow: () => rows.length + 1,
  getRange: (r, col, n, m) => ({
    getValues: () => (col === 1 && m === 1 ? rows.map(x => [x[0]]) : [rows[r - 2].slice(col - 1, col - 1 + m)]),
    setValues: v => { v[0].forEach((w, i) => { rows[r - 2][col - 1 + i] = w; }); },
    setNumberFormat: f => { FORMAT[r + ':' + col + ':' + m] = f; }
  })
};
c.SpreadsheetApp = { getActive: () => ({ getSheetByName: () => sheet }) };
c.sperre_ = () => ({ releaseLock: () => {} }); c.log_ = (a, i, d) => LOG.push(a + ' | ' + i + ' | ' + d);
const r = c.adresseVonHand('50000001', 'Lieferadresse\nAnna Muster\nMusterweg 12a\n3013 Bern');
const g = k => rows[0][V_COLS.indexOf(k)];
assert.deepStrictEqual([g('Firma'), g('Vorname'), g('Nachname'), g('Strasse'), g('Hausnummer'), g('Postfach'), g('PLZ'), g('Ort')], ['', 'Anna', 'Muster', 'Musterweg', '12a', '', '3013', 'Bern'], 'Spalten Firma..Ort');
assert.strictEqual(FORMAT['2:' + (V_COLS.indexOf('Firma') + 1) + ':8'], '@', 'als Text (PLZ, Hausnummer)');
assert.strictEqual(r.ohneAdresse, false, 'Adresse nicht mehr fehlend');
assert.strictEqual(r.name + '|' + r.ort, 'Anna Muster|3013 Bern', 'Rückgabe für die Oberfläche');
assert.strictEqual(g('Käufer'), 'nick1', 'Käufer unverändert');
assert.ok(LOG.some(l => /^Adresse von Hand \| PG-1 \| 50000001: Anna Muster, 3013 Bern$/.test(l)), 'Log');
assert.throws(() => c.adresseVonHand('50000002', 'Anna Muster\nWeg 1\n3000 Bern'), /bereits «Bezahlt und versendet»/, 'nur offene Verkäufe');
assert.throws(() => c.adresseVonHand('50000003', 'Neu Name\nWeg 1\n3000 Bern'), /Bitte bestätigen: Für 50000003 ist schon eine Adresse eingetragen .*\[adr\]$/, 'vorhandene Adresse nur mit Bestätigung');
assert.strictEqual(rows[2][V_COLS.indexOf('Nachname')], 'Alt', 'nichts überschrieben');
c.adresseVonHand('50000003', 'Neu Name\nWeg 1\n3000 Bern', true);
assert.strictEqual(rows[2][V_COLS.indexOf('Nachname')] + '|' + rows[2][V_COLS.indexOf('PLZ')], 'Name|3000', 'mit Bestätigung ersetzt');
assert.ok(LOG.some(l => /\(ersetzt\)$/.test(l)), 'Ersetzen im Log');
assert.throws(() => c.adresseVonHand('50000009', 'Anna Muster\nWeg 1\n3000 Bern'), /Verkauf 50000009 nicht gefunden/, 'unbekannter Verkauf');
assert.throws(() => c.adresseVonHand('50000001', 'nur Text'), /PLZ Ort/, 'unlesbar: nichts geschrieben');
assert.throws(() => c.adresseVonHand('', 'Anna\nWeg 1\n3000 Bern'), /Verkauf fehlt/, 'ohne Nummer');

// Der Bericht überschreibt eine von Hand eingetragene Adresse nicht (abgleichen_ füllt nur, wenn Nachname und PLZ leer sind)
assert.ok(/!String\(alt\[vi\('Nachname'\)\]\)\.trim\(\) && !String\(alt\[vi\('PLZ'\)\]\)\.trim\(\)/.test(fs.readFileSync(__dirname + '/../apps/ricardo/Code.gs', 'utf8')), 'Bericht füllt nur leere Adressen');
console.log('t_ricardo_adresse_hand ok');
