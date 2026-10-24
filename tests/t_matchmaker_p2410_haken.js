/* Prüfung 24.10.2026, Matchmaker-Script .3: Haken «Geholt» und «Zurück in die Liste».
   Befund 1 (zwei Haken kurz nacheinander), 13 (mehrere Haken auf einmal), 19/V5 («Aus Analyse» nach «Erledigt» und zurück),
   V1 (flush vor dem Freigeben der Sperre), V2 (Tab «Erledigt» bzw. «Matchmaker» voll). Lauf: node tests/t_matchmaker_p2410_haken.js */
const assert = require('assert');
const { umgebung, auftrag, KOPF, P } = require('./t_matchmaker_p2410_h.js');
const namen = ['Toaster', 'Wasserkocher', 'Mixer', 'Velo', 'Lampe', 'Stuhl', 'Tisch'];
const liste = () => ({ 'Matchmaker': [['Matchmaker'], [''], KOPF].concat(namen.map(g => auftrag(g))) });
const offen = (env) => env.mm().v.slice(3).filter(r => r[0]).map(r => r[0] + (r[8] === true ? ' [Haken]' : ''));
const erledigt = (env) => (env.E() ? env.E().v.slice(1).filter(r => r[1]).map(r => r[1]) : []);

/* Befund 1: onEdit(Zeile 8) wartet auf die Sperre, in dieser Zeit läuft onEdit(Zeile 5) ganz durch und löscht Zeile 5.
   Vorher: danach wurde «Stuhl» (früher Zeile 9) verschoben, die angehakte Lampe blieb stehen. */
let env = umgebung({ mm: liste() });
let mm = env.mm();
mm.v[4][8] = true;      // Zeile 5 Wasserkocher
mm.v[7][8] = true;      // Zeile 8 Lampe
env.lockHook = () => env.c.onEdit(env.ev(mm, 5, 9));
env.c.onEdit(env.ev(mm, 8, 9));
assert.deepStrictEqual(erledigt(env), ['Wasserkocher', 'Lampe'], 'Befund 1: genau die angehakten Aufträge in «Erledigt», in der Reihenfolge der Liste');
assert.deepStrictEqual(offen(env), ['Toaster', 'Mixer', 'Velo', 'Stuhl', 'Tisch'], 'Befund 1: kein falscher Auftrag verschoben, kein Haken bleibt stehen');
env.v1();

/* Gleich, aber nacheinander: das zweite Ereignis findet nichts mehr */
env = umgebung({ mm: liste() });
mm = env.mm();
mm.v[4][8] = true; mm.v[7][8] = true;
env.c.onEdit(env.ev(mm, 5, 9));
env.c.onEdit(env.ev(mm, 8, 9));
assert.deepStrictEqual(erledigt(env), ['Wasserkocher', 'Lampe']);
assert.deepStrictEqual(offen(env), ['Toaster', 'Mixer', 'Velo', 'Stuhl', 'Tisch']);

/* Befund 13: Bereich markiert, Leertaste (zwei Haken in einem Ereignis) */
env = umgebung({ mm: liste() });
mm = env.mm();
mm.v[3][8] = true; mm.v[4][8] = true;
env.c.onEdit(env.ev(mm, 4, 9, 5, 9));
assert.deepStrictEqual(erledigt(env), ['Toaster', 'Wasserkocher'], 'Befund 13: beide Haken verarbeitet');
assert.deepStrictEqual(offen(env), ['Mixer', 'Velo', 'Lampe', 'Stuhl', 'Tisch']);
/* Haken auf einer Zeile ohne «Gesucht»: zurück auf FALSE, nichts verschoben */
mm.v.push(['', '', '', '', '', '', '', '', true, '']);
const leer = mm.v.length;
env.c.onEdit(env.ev(mm, leer, 9));
assert.strictEqual(mm.v[leer - 1][8], false);
assert.strictEqual(erledigt(env).length, 2);

/* Sperre besetzt: Haken zurück, Hinweis, nichts verschoben */
env.dokBesetzt = true;
mm.v[3][8] = true;
env.c.onEdit(env.ev(mm, 4, 9));
assert.ok(mm.v[3][8] === false && mm.v[3][0] === 'Mixer' && /Suche schreibt gerade/.test(env.MM.toasts.join(' ')), 'Sperre besetzt: Haken zurück');
env.dokBesetzt = false;

/* Befund 19 / Vertrag V5: «Aus Analyse» geht mit nach «Erledigt» (neue letzte Spalte) und kommt mit «Zurück in die Liste» zurück.
   Bestehender Tab «Erledigt» mit 7 Spalten (vor .3) wird ergänzt, alte Zeilen bleiben. */
const VERMERK = 'PG-77 · Dualit Toaster · 21.10.2026 · Fotos: https://drive.google.com/drive/folders/abc';
env = umgebung({ mm: { 'Matchmaker': [['Matchmaker'], [''], KOPF, auftrag('Toaster', undefined, VERMERK), auftrag('Velo')],
  'Erledigt': [['Geholt am', 'Gesucht', 'Mehr Infos', 'Limit CHF', 'Suchprofil', 'Gefunden', 'Zurück in die Liste'], ['01.10.2026', 'Alt', '', 10, 'Art: Alt', '', false]] } });
mm = env.mm();
mm.v[3][4] = 'Dualit Toaster\nPG-77 · Analyse · CHF 50';
mm.v[3][8] = true;
env.c.onEdit(env.ev(mm, 4, 9));
let E = env.E();
assert.strictEqual(E.v[0][7], 'Aus Analyse', 'Kopf «Aus Analyse» als Spalte H ergänzt');
assert.deepStrictEqual(E.v[1].slice(0, 7), ['01.10.2026', 'Alt', '', 10, 'Art: Alt', '', false], 'alte Zeile unverändert');
assert.ok(E.v[2][1] === 'Toaster' && E.v[2][7] === VERMERK && /PG-77/.test(E.v[2][5]) && E.v[2][6] === false, 'Vermerk «Aus Analyse» mit nach «Erledigt»: ' + JSON.stringify(E.v[2]));
assert.deepStrictEqual(offen(env), ['Velo']);
/* Zurück in die Liste */
E.v[2][6] = true;
env.c.onEdit(env.ev(E, 3, 7));
assert.deepStrictEqual(offen(env), ['Velo', 'Toaster'], 'zurück ans Ende der Liste');
const zur = mm.v.find(r => r[0] === 'Toaster');
assert.ok(zur[3] === P('Toaster') && zur[9] === VERMERK && zur[8] !== true && !zur[4], 'Profil und «Aus Analyse» zurück, Ergebnis leer: ' + JSON.stringify(zur));
assert.deepStrictEqual(erledigt(env), ['Alt'], 'Zeile in «Erledigt» gelöscht');
env.v1();

/* Befund 1 in «Erledigt»: zwei Haken «Zurück» kurz nacheinander, das zweite Ereignis wartet auf die Sperre */
env = umgebung({ mm: { 'Matchmaker': [['Matchmaker'], [''], KOPF, auftrag('Velo')],
  'Erledigt': [['Geholt am', 'Gesucht', 'Mehr Infos', 'Limit CHF', 'Suchprofil', 'Gefunden', 'Zurück in die Liste', 'Aus Analyse'],
    ['20.10.2026', 'Toaster', '', 50, 'P1', '', true, ''], ['20.10.2026', 'Mixer', '', 50, 'P2', '', false, ''], ['21.10.2026', 'Lampe', '', 50, 'P3', '', true, 'PG-5 · Lampe · 21.10.2026']] } });
E = env.E();
env.lockHook = () => env.c.onEdit(env.ev(E, 2, 7));
env.c.onEdit(env.ev(E, 4, 7));
assert.deepStrictEqual(offen(env), ['Velo', 'Toaster', 'Lampe'], 'genau die angehakten zurück');
assert.deepStrictEqual(erledigt(env), ['Mixer'], 'Mixer bleibt in «Erledigt»');
assert.strictEqual(env.mm().v.find(r => r[0] === 'Lampe')[9], 'PG-5 · Lampe · 21.10.2026');

/* «Zurück» mit Vermerk, aber im Tab «Matchmaker» gibt es (noch) keine Spalte «Aus Analyse»: sie wird angelegt wie im Analyse Tool */
env = umgebung({ mm: { 'Matchmaker': [['Matchmaker'], [''], KOPF.slice(0, 9), auftrag('Velo').slice(0, 9)],
  'Erledigt': [['Geholt am', 'Gesucht', 'Mehr Infos', 'Limit CHF', 'Suchprofil', 'Gefunden', 'Zurück in die Liste', 'Aus Analyse'], ['20.10.2026', 'Toaster', '', 50, 'P1', '', true, 'PG-9 · Toaster · 20.10.2026']] } });
env.c.onEdit(env.ev(env.E(), 2, 7));
assert.ok(env.mm().v[2][9] === 'Aus Analyse' && env.mm().v[4][9] === 'PG-9 · Toaster · 20.10.2026', 'Spalte «Aus Analyse» angelegt: ' + JSON.stringify(env.mm().v[2]));

/* V2: Tab «Erledigt» hat keine freie Zeile mehr (alle Zeilen belegt): Zeilen werden angehängt statt Fehler */
env = umgebung({ mm: { 'Matchmaker': [['Matchmaker'], [''], KOPF, auftrag('Toaster'), auftrag('Velo')],
  'Erledigt': [['Geholt am', 'Gesucht', 'Mehr Infos', 'Limit CHF', 'Suchprofil', 'Gefunden', 'Zurück in die Liste', 'Aus Analyse'], ['20.10.2026', 'Alt', '', 1, 'P', '', false, '']] } });
env.E().maxRows = 2;
env.mm().v[3][8] = true; env.mm().v[4][8] = true;
env.c.onEdit(env.ev(env.mm(), 4, 9, 5, 9));
assert.ok(env.E().eingefuegt === 2 && erledigt(env).join() === 'Alt,Toaster,Velo', 'V2: Erledigt um 2 Zeilen ergänzt');
/* V2 umgekehrt: Tab «Matchmaker» voll */
env.mm().maxRows = env.mm().v.length;
env.E().v[2][6] = true; env.E().v[3][6] = true;
env.c.onEdit(env.ev(env.E(), 3, 7, 4, 7));
assert.ok(env.mm().eingefuegt >= 1 && offen(env).join() === 'Toaster,Velo', 'V2: Matchmaker ergänzt: ' + offen(env));

/* Kopfzeile in «Erledigt» verschoben: Hinweis statt still nichts tun */
env = umgebung({ mm: { 'Matchmaker': [['Matchmaker'], [''], KOPF, auftrag('Velo')], 'Erledigt': [['Datum', 'Gesucht'], ['x', 'Toaster']] } });
env.E().v[1][6] = true;
env.c.onEdit(env.ev(env.E(), 2, 7));
assert.ok(/Spalten im Tab «Erledigt» verschoben/.test(env.MM.toasts.join(' ')), env.MM.toasts.join(' | '));

console.log('t_matchmaker_p2410_haken ok');
