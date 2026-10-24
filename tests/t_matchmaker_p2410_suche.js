/* Prüfung 24.10.2026, Matchmaker-Script .3: Ablauf der Suche.
   Befund 2 (Suchprofil in falsche Zeile), 3 (Tageslauf: neuer/geänderter Auftrag nur gegen Tageszugang), 8 (Nummern ab 1),
   11 (Wochenende/vergessene Tage), 14 (Profil ohne «Suchwörter:» blockiert alle), 15 (Schlussprüfung: Ergebnis pro Kennung),
   16 (Hand-Korrektur als neue Zeile ohne Schlüssel). Lauf: node tests/t_matchmaker_p2410_suche.js */
const assert = require('assert');
const { umgebung, rt, z, P, auftrag, kennung, KOPF, HEUTE, QUELLE } = require('./t_matchmaker_p2410_h.js');
const ALT = '20.10.2026';
const lager = () => rt([
  z('PG-1', ALT, 'Dualit Toaster', '111', '', 50, 'HOM-1'),
  z('PG-2', ALT, 'Kettle Wasserkocher', '222', '', 30, 'HOM-2'),
  z('PG-3', ALT, 'Velo Citybike', '333', '', 300, 'HOM-3')]);
const profil = (env, r) => String(env.mm().v[r - 1][3] || '');

/* ---------- Befund 2a: während die Profile erstellt werden, wird der Auftrag darüber geholt (Zeilen rutschen hoch) ---------- */
let env = umgebung({ mm: { 'Matchmaker': [['Matchmaker'], [''], KOPF, auftrag('Toaster'), auftrag('Wasserkocher', ''), auftrag('Velo', '')] }, rt: lager() });
let mm = env.mm();
env.beimFetch = () => { mm.v[3][8] = true; env.c.onEdit(env.ev(mm, 4, 9)); };
env.c.sucheAlles();
assert.deepStrictEqual(env.alerts, [], env.alerts.join(' | '));
assert.ok(mm.v[3][0] === 'Wasserkocher' && /^Art: Wasserkocher/.test(profil(env, 4)), 'Befund 2: Wasserkocher hat sein eigenes Profil: ' + profil(env, 4));
assert.ok(mm.v[4][0] === 'Velo' && /^Art: Velo/.test(profil(env, 5)), 'Befund 2: Velo hat sein eigenes Profil: ' + profil(env, 5));
assert.ok(/PG-2/.test(env.zelle(4, 5)) && /PG-3/.test(env.zelle(5, 5)), 'Ergebnis in den jetzigen Zeilen: ' + env.zeile(4) + ' / ' + env.zeile(5));
env.v1();

/* ---------- Befund 2b: während der Profil-Anfrage wird «Toaster» zu «Velo» geändert (onEdit leert das Profil) ---------- */
env = umgebung({ mm: { 'Matchmaker': [['Matchmaker'], [''], KOPF, auftrag('Toaster', '')] }, rt: lager() });
mm = env.mm();
env.beimFetch = () => { mm.v[3][0] = 'Velo'; env.c.onEdit(env.ev(mm, 4, 1)); };
env.c.sucheAlles();
assert.ok(mm.v[3][0] === 'Velo' && profil(env, 4) === '', 'Befund 2: kein Toaster-Profil beim Velo: ' + JSON.stringify(profil(env, 4)));
assert.ok(env.rot() && /1 Suchaufträge wurden während der Suche neu erfasst oder geändert/.test(env.status()), env.status());
env.c.sucheAlles();
assert.ok(/^Art: Velo/.test(profil(env, 4)) && /PG-3/.test(env.zelle(4, 5)), 'zweiter Lauf: Velo richtig: ' + profil(env, 4));

/* ---------- Entscheid Jonas 24.10.2026, 15:00: Tagesläufe prüfen NUR die Stücke des Tages; der Rest über «Ganzer Bestand» ---------- */
env = umgebung({ mm: { 'Matchmaker': [['Matchmaker'], [''], KOPF, auftrag('Toaster')] }, rt: lager() });
mm = env.mm();
env.c.sucheAlles();
assert.ok(/PG-1/.test(env.zelle(4, 5)), 'Lauf 1');
/* a) neuer Auftrag «Wasserkocher» (PG-2 liegt seit 20.10. im Lager): «heute erfasst» prüft ihn NICHT gegen den alten Bestand */
mm.v.push(['Wasserkocher', '', 40, '', '', '', '', '', false, '']);
env.c.onEdit(env.ev(mm, 5, 1));
env.paare = 0;
env.c.sucheHeute();
assert.strictEqual(env.paare, 0, 'Tageslauf: kein Paar mit altem Stück an Claude');
assert.ok(!/PG-2/.test(env.zelle(5, 5)), 'Tageslauf findet altes Stück nicht: ' + env.zeile(5));
assert.ok(/PG-1/.test(env.zelle(4, 5)), 'bisheriger Treffer bleibt stehen: ' + env.zeile(4));
assert.ok(/An diesem Tag wurde nichts erfasst/.test(env.status()) && /bisherige Treffer behalten/.test(env.status()) && !/ganzen Bestand \(/.test(env.status()), env.status());
/* b) «Ganzer Bestand» findet ihn */
env.paare = 0;
env.c.sucheAlles();
assert.ok(/PG-2/.test(env.zelle(5, 5)) && env.paare === 1, 'Ganzer Bestand: neuer Auftrag findet altes Stück: ' + env.zeile(5));

/* c) Stück von heute wird im Tageslauf geprüft, das alte nicht (auch nicht in einem zweiten Lauf) */
env = umgebung({ mm: { 'Matchmaker': [['Matchmaker'], [''], KOPF, auftrag('Toaster')] },
  rt: rt([z('PG-1', ALT, 'Dualit Toaster', '111', '', 50, 'HOM-1'), z('PG-9', HEUTE, 'Severin Toaster', '999', '', 20, 'HOM-9')]) });
env.c.sucheHeute();
assert.deepStrictEqual(env.gefragt, ['Severin Toaster'], 'nur das Stück von heute');
assert.ok(/PG-9/.test(env.zelle(4, 5)) && !/PG-1/.test(env.zelle(4, 5)) && /1 Stück an diesem Tag erfasst und geprüft/.test(env.status()), env.status());
env.c.sucheHeute();
assert.deepStrictEqual(env.gefragt, ['Severin Toaster'], 'zweiter Tageslauf fragt nichts Altes nach');

/* d) Stück vom Donnerstag: «heute» am Samstag prüft es nicht, «Ganzer Bestand» schon */
env = umgebung({ mm: { 'Matchmaker': [['Matchmaker'], [''], KOPF, auftrag('Toaster')] }, rt: lager() });
env.c.sucheAlles();
env.RT.getSheetByName('Stationär').v.push(z('PG-4', '22.10.2026', 'Toaster Philips', '444', '', 20, 'HOM-4'));
env.paare = 0;
env.c.sucheHeute();
assert.ok(!/PG-4/.test(env.zelle(4, 5)) && env.paare === 0, 'Tageslauf: Stück vom 22.10. nicht geprüft');
env.c.sucheAlles();
assert.ok(/PG-4/.test(env.zelle(4, 5)) && env.paare === 1, 'Ganzer Bestand holt es: ' + env.zeile(4));

/* ---------- Befund 8a: Claude nummeriert die Urteile ab 1: verwerfen, nichts beim Nachbarn ---------- */
const lager8 = () => rt([z('PG-1', ALT, 'Dualit Toaster', '111', '', 50, 'HOM-1'), z('PG-2', ALT, 'Dualit Toaster Zubehoer Sandwichzange', '222', '', 10, 'HOM-2'),
  z('PG-3', ALT, 'Severin Toaster', '333', '', 20, 'HOM-3')]);
env = umgebung({ mm: { 'Matchmaker': [['Matchmaker'], [''], KOPF, auftrag('Toaster')] }, rt: lager8() });
env.urteilVersatz = 1;
env.c.sucheAlles();
assert.strictEqual(env.urteile().length, 0, 'Befund 8: kein verschobenes Urteil gespeichert: ' + JSON.stringify(env.urteile()));
assert.ok(!/PG-2/.test(env.zeile(4)), 'Zubehör nie als Treffer');
assert.ok(env.rot() && /3 Paare konnte Claude nicht prüfen/.test(env.status()) && /ab 1 statt ab 0/.test(env.status()), env.status());
env.urteilVersatz = 0;
env.c.sucheAlles();
assert.ok(/PG-1/.test(env.zelle(4, 5)) && /PG-3/.test(env.zelle(4, 5)) && !/PG-2/.test(env.zeile(4)), 'danach richtig: ' + env.zeile(4));

/* Befund 8b: Profile ab 1 bei drei Aufträgen: kein Auftrag bekommt das Profil eines anderen */
env = umgebung({ mm: { 'Matchmaker': [['Matchmaker'], [''], KOPF, auftrag('Toaster', ''), auftrag('Velo', ''), auftrag('Mixer', '')] }, rt: lager8() });
env.profilVersatz = 1;
env.c.sucheAlles();
[4, 5, 6].forEach(r => { const g = env.mm().v[r - 1][0], p = profil(env, r); assert.ok(p === '' || p.indexOf('Art: ' + g) === 0, 'Befund 8: ' + g + ' → ' + p); });
assert.ok(env.rot() && /ohne Suchprofil/.test(env.status()) && /ab 1 statt ab 0/.test(env.status()), env.status());

/* Befund 8c: Kontrollname (produkt) passt nicht zur Nummer: dieses Urteil verwerfen, die übrigen gelten */
env = umgebung({ mm: { 'Matchmaker': [['Matchmaker'], [''], KOPF, auftrag('Toaster')] }, rt: lager8() });
env.echo = true; env.vertauscheEcho = true;
env.c.sucheAlles();
assert.deepStrictEqual(env.urteile().map(r => r[2]), ['Dualit Toaster Zubehoer Sandwichzange'], 'nur das Urteil mit passendem Kontrollnamen gespeichert (erstes und letztes vertauscht)');
assert.ok(env.rot() && /2 Paare konnte Claude nicht prüfen/.test(env.status()) && /Kontrollname/.test(env.status()), env.status());
env.vertauscheEcho = false;
env.c.sucheAlles();
assert.strictEqual(env.urteile().length, 3, 'mit passendem Kontrollnamen alles gespeichert');
/* Profil mit Kontrollname */
env = umgebung({ mm: { 'Matchmaker': [['Matchmaker'], [''], KOPF, auftrag('Toaster', ''), auftrag('Velo', '')] }, rt: lager8() });
env.echo = true;
env.c.sucheAlles();
assert.ok(/^Art: Toaster/.test(profil(env, 4)) && /^Art: Velo/.test(profil(env, 5)), 'Profile mit Kontrollname');

/* ---------- Befund 14: ein Profil ohne «Suchwörter:» blockiert nur diesen Auftrag ---------- */
env = umgebung({ mm: { 'Matchmaker': [['Matchmaker'], [''], KOPF, auftrag('Toaster'), auftrag('Wasserkocher', 'Art: Wasserkocher\nMuss: –\nSuchworte: wasserkocher')] }, rt: lager() });
env.c.sucheAlles();   // Tageslauf prüft seit 24.10. nur Stücke des Tages
assert.deepStrictEqual(env.alerts, [], 'Befund 14: kein Abbruch: ' + env.alerts.join(' | '));
assert.ok(/PG-1/.test(env.zelle(4, 5)), 'Toaster trotzdem durchsucht');
assert.ok(env.rot() && /1 Suchaufträge haben im Suchprofil keine Zeile «Suchwörter: …»/.test(env.status()) && /Zeile 5 «Wasserkocher»/.test(env.status()), env.status());

/* ---------- Befund 15: während der Urteile wird oben ein Auftrag geholt und unten ein Profil von Hand geändert ---------- */
env = umgebung({ mm: { 'Matchmaker': [['Matchmaker'], [''], KOPF, auftrag('Toaster'), auftrag('Wasserkocher'), auftrag('Velo')] }, rt: lager() });
mm = env.mm();
env.beimFetch = () => {
  mm.v[3][8] = true; env.c.onEdit(env.ev(mm, 4, 9));              // Toaster geholt: Wasserkocher rutscht auf Zeile 4, Velo auf 5
  mm.v[4][3] = 'Art: Velo\nMuss: Damenvelo\nSuchwörter: velo';   // Velo-Profil von Hand geändert (onEdit leert die Treffer)
  env.c.onEdit(env.ev(mm, 5, 4));
};
env.c.sucheAlles();
assert.deepStrictEqual(env.alerts, [], env.alerts.join(' | '));
assert.ok(/PG-2/.test(env.zelle(4, 5)) && !/PG-1/.test(env.zeile(4)), 'Befund 15: Wasserkocher-Ergebnis in seiner jetzigen Zeile: ' + env.zeile(4));
assert.strictEqual(env.zeile(5).trim(), '', 'geändertes Profil: kein altes Ergebnis geschrieben');
assert.ok(env.rot() && /1 Suchaufträge wurden während der Suche neu erfasst oder geändert/.test(env.status()), env.status());
assert.ok(/Toaster/.test(env.E().v[1][1]) && /PG-1/.test(env.E().v[1][5]) === false, 'Toaster in «Erledigt» (geholt vor dem Ergebnis)');

/* ---------- Befund 16: Hand-Korrektur als neue Zeile ohne Produkt-Schlüssel ---------- */
const lager16 = () => rt([z('PG-1', ALT, 'Dualit Toaster', '111', '', 50, 'HOM-1'), z('PG-2', ALT, 'Severin Toaster', '222', '', 20, 'HOM-2')]);
env = umgebung({ mm: { 'Matchmaker': [['Matchmaker'], [''], KOPF, auftrag('Toaster')] }, rt: lager16() });
env.c.sucheAlles();
assert.ok(/PG-2/.test(env.zelle(4, 5)), 'Severin passt (Urteil mit Schlüssel vom ' + HEUTE + ')');
const k = kennung('Toaster', '', P('Toaster'));
/* a) ältere Hand-Zeile (Datum vor dem Urteil mit Schlüssel): das Urteil mit Schlüssel gilt */
env.U().v.push([k, 'Toaster', 'Severin Toaster', 'nein', 'von Hand', '23.10.2026', '']);
env.c.sucheHeute();
assert.ok(/PG-2/.test(env.zelle(4, 5)), 'ältere Hand-Zeile gewinnt nicht');
/* b) Hand-Zeile ohne Datum: gewinnt nicht */
env.U().v.push([k, 'Toaster', 'Severin Toaster', 'nein', 'von Hand', '', '']);
env.c.sucheHeute();
assert.ok(/PG-2/.test(env.zelle(4, 5)), 'Hand-Zeile ohne Datum gewinnt nicht');
/* c) Hand-Zeile vom selben Tag, weiter unten: gewinnt */
env.U().v.push([k, 'Toaster', 'Severin Toaster', 'nein', 'von Hand', HEUTE, '']);
env.paare = 0;
env.c.sucheHeute();
assert.ok(!/PG-2/.test(env.zeile(4)) && /PG-1/.test(env.zelle(4, 5)), 'Befund 16: neuere Hand-Korrektur ohne Schlüssel gilt: ' + env.zeile(4));
assert.strictEqual(env.paare, 0, 'nichts neu bezahlt');
/* d) Hand-Zeile von morgen («ähnlich»): gewinnt, auch über eine spätere Zeile mit Schlüssel vom Vortag */
env.U().v.push([k, 'Toaster', 'Dualit Toaster', 'ähnlich', 'Farbe prüfen', '25.10.2026', '']);
env.U().v.push([k, 'Toaster', 'Dualit Toaster', 'passt', '', '23.10.2026', 'dualit toaster|bc:111']);
env.c.sucheHeute();
assert.ok(!/PG-1/.test(env.zelle(4, 5)) && /PG-1/.test(env.zelle(4, 6)) && /Farbe prüfen/.test(env.zelle(4, 6)), 'neuste Zeile gilt (Datum): ' + env.zeile(4));

console.log('t_matchmaker_p2410_suche ok');
