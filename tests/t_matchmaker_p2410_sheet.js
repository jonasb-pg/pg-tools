/* Prüfung 24.10.2026, Matchmaker-Script .3: Aufbau der Sheets.
   Befund 4 (Spalte eingefügt / Kopf umbenannt startet den alten Umbau), 5 (Return-Tool-Tab umbenannt oder Pflichtspalte fehlt),
   7 («Ganzer Bestand» löscht Urteile von Aufträgen in «Erledigt»; erst leeren, dann schreiben), 12 (Status fest in Zeile 2),
   17 (Claude-Schlüssel für alle Bearbeiter nutzbar: Hinweis auf Ausgabenlimite). Lauf: node tests/t_matchmaker_p2410_sheet.js */
const assert = require('assert'), fs = require('fs'), path = require('path');
const { umgebung, rt, rtTab, z, zs, P, auftrag, KOPF, KRT } = require('./t_matchmaker_p2410_h.js');
const ALT = '20.10.2026';
const lager = () => rt([z('PG-1', ALT, 'Dualit Toaster', '111', '', 50, 'HOM-1'), z('PG-2', ALT, 'Severin Toaster', '222', '', 20, 'HOM-2')]);

/* ---------- Befund 4a: Spalte «Datum» nach «Gesucht» eingefügt: Spalten über den Kopf, kein Umbau ---------- */
const kopf = KOPF.slice(); kopf.splice(1, 0, 'Datum');
const PR = 'Art: Toaster\nMuss: Marke Dualit\nSuchwörter: toaster, dualit';
let env = umgebung({ mm: { 'Matchmaker': [['Matchmaker'], [''], kopf, ['Toaster', '20.10.2026', 'nur Dualit', 50, PR, '', '', '', '', false, 'PG-77 · Dualit · 21.10.2026']] }, rt: lager() });
let mm = env.mm();
env.c.sucheAlles();
assert.deepStrictEqual(env.alerts, [], env.alerts.join(' | '));
assert.deepStrictEqual(mm.v[2], kopf, 'Kopf unverändert');
assert.ok(mm.v[3][1] === '20.10.2026' && mm.v[3][4] === PR && mm.v[3][10] === 'PG-77 · Dualit · 21.10.2026', 'Datum, Profil und «Aus Analyse» unverändert: ' + JSON.stringify(mm.v[3]));
assert.ok(/PG-1/.test(mm.v[3][5]) && /PG-2/.test(mm.v[3][5]), 'Ergebnis in der Spalte «Passt» (F): ' + mm.v[3][5]);
assert.ok(!env.MM.getSheetByName('Matchmaker alt'), 'kein Umbau, keine Kopie');
/* Haken «Geholt» in der verschobenen Spalte (K) geht weiter */
mm.v[3][9] = true;
env.c.onEdit(env.ev(mm, 4, 10));
assert.ok(env.E().v[1][1] === 'Toaster' && env.E().v[1][7] === 'PG-77 · Dualit · 21.10.2026' && env.E().v[1][2] === 'nur Dualit', 'Haken geht, «Aus Analyse» mit: ' + JSON.stringify(env.E().v[1]));

/* ---------- Befund 4b: Kopf «Suchprofil» umbenannt: Fehler, nichts verändert, kein Umbau ---------- */
const kopf2 = KOPF.slice(); kopf2[3] = 'Profil';
env = umgebung({ mm: { 'Matchmaker': [['Matchmaker'], [''], kopf2, auftrag('Toaster', PR, 'PG-77 · x · 21.10.2026')] }, rt: lager() });
mm = env.mm();
const vorher = JSON.stringify(mm.v.slice(2));
env.c.sucheAlles();
assert.ok(/Spalten verschoben – bitte Kopfzeile prüfen/.test(env.alerts.join(' ')) && /«Suchprofil» fehlt/.test(env.alerts.join(' ')), 'Befund 4: klare Meldung: ' + env.alerts.join(' | '));
assert.strictEqual(JSON.stringify(mm.v.slice(2)), vorher, 'Kopf und Aufträge unverändert');
assert.ok(!env.MM.getSheetByName('Matchmaker alt') && env.paare === 0 && env.profilAnfragen === 0, 'kein Umbau, nichts an Claude');
assert.ok(/SUCHE FEHLGESCHLAGEN/.test(env.status()) && env.rot(), 'Status rot: ' + env.status());
/* der Haken meldet es, statt still nichts zu tun */
mm.v[3][8] = true;
env.c.onEdit(env.ev(mm, 4, 9));
assert.ok(/Spalten verschoben/.test(env.MM.toasts.join(' ')) && mm.v[3][0] === 'Toaster', 'Haken: Hinweis, nichts verschoben');
/* Passt und Ähnlich nicht nebeneinander */
const kopf3 = KOPF.slice(); kopf3.splice(5, 0, 'Notiz');
env = umgebung({ mm: { 'Matchmaker': [['Matchmaker'], [''], kopf3, ['Toaster', '', 50, PR, '', 'n', '', '', '', false, '']] }, rt: lager() });
env.c.sucheAlles();
assert.ok(/nicht nebeneinander/.test(env.alerts.join(' ')), env.alerts.join(' | '));

/* Befund 4c: alter Aufbau (Produkt DE | Product EN | Limit | Notiz | Suchbegriffe): nur dann der Umbau, mit Kopie */
env = umgebung({ mm: { 'Matchmaker': [['Matchmaker'], [''], ['Produkt DE', 'Product EN', 'Limit', 'Notiz', 'Suchbegriffe'], ['Toaster\nDualit', 'toaster', 50, 'pg', 'toaster']] }, rt: lager() });
env.c.onEdit(env.ev(env.mm(), 4, 1));
assert.ok(/Alter Aufbau/.test(env.MM.toasts.join(' ')), 'Haken beim alten Aufbau: Hinweis');
env.c.sucheAlles();
assert.ok(env.MM.getSheetByName('Matchmaker alt') && env.mm().v[2][3] === KOPF[3] && env.mm().v[3][0] === 'Toaster' && /Dualit/.test(env.mm().v[3][1]), 'Umbau: ' + JSON.stringify(env.mm().v.slice(2, 4)));
assert.ok(/PG-1/.test(env.zelle(4, 5)), 'danach gesucht');

/* ---------- Befund 5a: Tab «Stationär» umbenannt: Status rot, Passt/Ähnlich bleiben stehen ---------- */
env = umgebung({ mm: { 'Matchmaker': [['Matchmaker'], [''], KOPF, auftrag('Toaster')] }, rt: lager() });
env.c.sucheAlles();
const p1 = env.zeile(4);
assert.ok(/PG-1/.test(p1) && !env.rot(), 'Lauf 1: ' + env.status());
env.RT.getSheetByName('Stationär').name = 'Stationär alt';
env.c.sucheHeute();
assert.strictEqual(env.zeile(4), p1, 'Befund 5: Treffer nicht still gelöscht');
assert.ok(env.rot() && /Return Tool nicht vollständig lesbar \(Tab «Stationär» fehlt\)/.test(env.status()) && /NICHT aktualisiert/.test(env.status()), env.status());
/* Befund 5b: Kopf «Barcode» umbenannt: Tab nicht lesbar, keine neuen Produkt-Schlüssel, nichts neu bezahlt */
env.RT.getSheetByName('Stationär alt').name = 'Stationär';
env.RT.getSheetByName('Stationär').v[5][6] = 'EAN';
const urteileVorher = env.urteile().length;
env.paare = 0;
env.c.sucheAlles();
assert.ok(env.zeile(4) === p1 && env.paare === 0 && env.urteile().length === urteileVorher, 'Befund 5: nichts neu beurteilt, nichts gelöscht');
assert.ok(env.rot() && /«Stationär»: Spalte «Barcode» fehlt/.test(env.status()), env.status());
/* Kopfzeile ganz weg (z.B. Zeilen eingefügt, Kopf erst in Zeile 14) */
env.RT.getSheetByName('Stationär').v[5][6] = 'Barcode';
env.RT.getSheetByName('Stationär').v.splice(0, 0, [], [], [], [], [], [], [], []);
env.c.sucheAlles();
assert.ok(env.rot() && /«Stationär»: keine Kopfzeile mit «Bezeichnung»/.test(env.status()) && env.zeile(4) === p1, env.status());
/* Scanner ohne ID-Spalte ist in Ordnung (nur Hinweis-Tab), Online ohne «Lagerort» nicht */
env = umgebung({ mm: { 'Matchmaker': [['Matchmaker'], [''], KOPF, auftrag('Toaster')] },
  rt: rt([z('PG-1', ALT, 'Dualit Toaster', '111', '', 50, 'HOM-1')], { 'Scanner': rtTab([zs(ALT, 'Toaster Scanner', '666', 9, 'HOM-45')], true), 'Online': [[], [], [], [], [], KRT.filter(k => k !== 'Lagerort')] }) });
env.c.sucheAlles();
assert.ok(env.rot() && /«Online»: Spalte «Lagerort» fehlt/.test(env.status()) && !/«Scanner»/.test(env.status()), env.status());

/* ---------- Befund 12: Status in der Zeile über dem Kopf, sonst als Hinweis ---------- */
env = umgebung({ mm: { 'Matchmaker': [KOPF, auftrag('Toaster'), auftrag('Velo')] }, rt: lager() });
env.c.sucheAlles();
env.c.sucheAlles();
assert.deepStrictEqual(env.mm().v.slice(1).map(r => r[0]), ['Toaster', 'Velo'], 'Befund 12: Kopf in Zeile 1: kein Auftrag überschrieben');
assert.ok(/PG-1/.test(env.zelle(2, 5)) && env.MM.toasts.some(t => /^Stand /.test(t)), 'Status als Hinweis: ' + env.MM.toasts.slice(-2).join(' | '));
env = umgebung({ mm: { 'Matchmaker': [[''], KOPF, auftrag('Toaster')] }, rt: lager() });
env.c.sucheAlles();
env.c.sucheAlles();
assert.ok(/^Stand /.test(env.status(1)) && env.mm().v[1][0] === 'Gesucht' && env.mm().v[2][0] === 'Toaster' && env.alerts.length === 0, 'Kopf in Zeile 2: Status in Zeile 1: ' + env.status(1));

/* ---------- Befund 7: «Ganzer Bestand» behält die Urteile von Aufträgen in «Erledigt» samt Hand-Korrektur ---------- */
env = umgebung({ mm: { 'Matchmaker': [['Matchmaker'], [''], KOPF, auftrag('Toaster'), auftrag('Velo')] }, rt: lager() });
mm = env.mm();
env.c.sucheAlles();
env.U().v.forEach(r => { if (r[2] === 'Severin Toaster') { r[3] = 'nein'; r[4] = 'von Hand: Kunde will Dualit'; } });
mm.v[3][8] = true; env.c.onEdit(env.ev(mm, 4, 9));          // versehentlich geholt
env.c.sucheAlles();                                          // «ganzer Bestand», Auftrag steht in «Erledigt»
assert.deepStrictEqual(env.urteile().map(r => r[2] + ' ' + r[3]), ['Dualit Toaster passt', 'Severin Toaster nein'], 'Befund 7: Urteile bleiben');
env.E().v[1][6] = true; env.c.onEdit(env.ev(env.E(), 2, 7)); // zurück in die Liste
env.paare = 0;
env.c.sucheAlles();
assert.ok(env.paare === 0 && /PG-1/.test(env.zelle(5, 5)) && !/PG-2/.test(env.zeile(5)), 'nichts neu bezahlt, Hand-Korrektur gilt: ' + env.zeile(5));
/* Urteile eines gelöschten Auftrags werden weiter entfernt: zuerst die bleibenden Zeilen schreiben, dann nur das Ende leeren */
env.c.sucheAlles();
const vRow = mm.v.findIndex(r => r[0] === 'Velo');
mm.v.splice(vRow, 1);                                        // Velo von Hand gelöscht (Zeile entfernt)
env.U().v.splice(1, 0, ['abcdef0123', 'Velo', 'Velo Citybike', 'passt', '', '20.10.2026', 'velo citybike|bc:333']);
env.log.length = 0;
env.c.sucheAlles();
assert.deepStrictEqual(env.urteile().map(r => r[1]), ['Toaster', 'Toaster'], 'Urteil des gelöschten Auftrags entfernt');
const iW = env.log.lastIndexOf('write:Urteile'), iC = env.log.lastIndexOf('clear:Urteile');
assert.ok(iW > -1 && iC > iW, 'Befund 7: erst schreiben, dann das Ende leeren: ' + env.log.join(', '));
assert.ok(/1 Urteile zu gelöschten Suchaufträgen entfernt/.test(env.status()), env.status());
/* zu wenig Zeit: nicht aufräumen (nichts halb), Hinweis im Status */
env.U().v.push(['ffffffffff', 'Weg', 'Velo Citybike', 'passt', '', '20.10.2026', 'velo citybike|bc:333']);
env.RT.getSheetByName('Stationär').v.push(z('PG-5', ALT, 'Toaster Philips', '555', '', 20, 'HOM-5'));
env.beimFetch = () => { env.uhr += 301000; };
env.c.sucheAlles();
assert.ok(env.urteile().some(r => r[0] === 'ffffffffff') && /Urteile nicht aufgeräumt \(zu wenig Zeit/.test(env.status()), env.status());
/* «Erledigt» nicht lesbar: nicht aufräumen (sonst gingen Urteile geholter Aufträge verloren) */
env.E().v.push(['20.10.2026', 'Mixer', '', 50, P('Mixer'), '', false, '']);
env.E().v[0][1] = 'Auftrag';
env.c.sucheAlles();
assert.ok(env.urteile().some(r => r[0] === 'ffffffffff') && /Urteile nicht aufgeräumt \(Tab «Erledigt» nicht lesbar\)/.test(env.status()) && env.rot(), env.status());

/* ---------- Befund 17: kein Code-Fix möglich; Hinweis beim Setzen des Schlüssels und in der Doku ---------- */
assert.ok(/Ausgabenlimite/.test(env.lauf('SCHLUESSEL_HINWEIS')), 'Hinweis auf Ausgabenlimite beim Setzen des Schlüssels');
assert.ok(/Ausgabenlimite/.test(fs.readFileSync(path.join(__dirname, '../docs/analyse/matchmaker.md'), 'utf8')), 'Doku: Ausgabenlimite unter «Von Hand zu tun»');

console.log('t_matchmaker_p2410_sheet ok');
