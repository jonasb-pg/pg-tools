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

/* ---------- Befund 3: neuer Auftrag und geänderter Auftrag im Tageslauf gegen den ganzen Bestand ---------- */
env = umgebung({ mm: { 'Matchmaker': [['Matchmaker'], [''], KOPF, auftrag('Toaster')] }, rt: lager() });
mm = env.mm();
env.c.sucheAlles();
assert.ok(/PG-1/.test(env.zelle(4, 5)), 'Lauf 1');
/* a) neuer Auftrag «Wasserkocher» (PG-2 liegt seit 20.10. im Lager), dann «heute erfasst» */
mm.v.push(['Wasserkocher', '', 40, '', '', '', '', '', false, '']);
env.c.onEdit(env.ev(mm, 5, 1));
env.paare = 0;
env.c.sucheHeute();
assert.ok(/PG-2/.test(env.zelle(5, 5)), 'Befund 3a: neuer Auftrag findet altes Stück im Tageslauf: ' + env.zeile(5));
assert.strictEqual(env.paare, 1, 'nur das neue Paar an Claude (Toaster hat sein Urteil)');
assert.ok(/dazu jedes Paar ohne Urteil im ganzen Bestand/.test(env.status()) && /bisherige Treffer behalten/.test(env.status()), env.status());
/* b) «Mehr Infos» beim Toaster korrigiert: Profil leer, neue Kennung, im Tageslauf wieder gegen den ganzen Bestand */
mm.v[3][1] = 'egal welche Farbe';
env.c.onEdit(env.ev(mm, 4, 2));
assert.ok(env.zelle(4, 5) === '' && profil(env, 4) === '', 'onEdit leert Profil und Treffer');
env.paare = 0;
env.c.sucheHeute();
assert.ok(/PG-1/.test(env.zelle(4, 5)), 'Befund 3b: Treffer nach Textkorrektur wieder da: ' + env.zeile(4));
assert.strictEqual(env.paare, 1);
assert.ok(!env.rot(), 'nichts offen: Status nicht rot: ' + env.status());

/* Reihenfolge im Tageslauf: zuerst die Stücke des Tages (Limit 1 Paar pro Lauf) */
const Q1 = QUELLE.replace(/const PAARE_PRO_LAUF = \d+;/, 'const PAARE_PRO_LAUF = 1;');
env = umgebung({ quelle: Q1, mm: { 'Matchmaker': [['Matchmaker'], [''], KOPF, auftrag('Toaster')] },
  rt: rt([z('PG-1', ALT, 'Dualit Toaster', '111', '', 50, 'HOM-1'), z('PG-9', HEUTE, 'Severin Toaster', '999', '', 20, 'HOM-9')]) });
env.c.sucheHeute();
assert.deepStrictEqual(env.gefragt, ['Severin Toaster'], 'zuerst das Stück von heute');
assert.ok(env.rot() && /Noch 1 Paare offen – bitte nochmals starten\./.test(env.status()), env.status());
env.c.sucheHeute();
assert.deepStrictEqual(env.gefragt, ['Severin Toaster', 'Dualit Toaster'], 'dann das alte Stück');
assert.ok(!/Paare offen/.test(env.status()) && /PG-1/.test(env.zelle(4, 5)) && /PG-9/.test(env.zelle(4, 5)));

/* ---------- Befund 11: Stück vom Donnerstag, Tagesläufe nur am Freitag «heute» und am Samstag «heute»: wird trotzdem geprüft ---------- */
env = umgebung({ mm: { 'Matchmaker': [['Matchmaker'], [''], KOPF, auftrag('Toaster')] }, rt: lager() });
env.c.sucheAlles();
env.RT.getSheetByName('Stationär').v.push(z('PG-4', '22.10.2026', 'Toaster Philips', '444', '', 20, 'HOM-4'));
env.paare = 0;
env.c.sucheHeute();                      // 24.10.: das Stück vom 22.10. ist nicht «heute»
assert.ok(/PG-4/.test(env.zelle(4, 5)) && env.paare === 1, 'Befund 11: verpasster Tag nachgeholt: ' + env.zeile(4));
assert.ok(/An diesem Tag wurde nichts erfasst, dazu jedes Paar ohne Urteil im ganzen Bestand/.test(env.status()), env.status());

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
env.c.sucheHeute();
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
