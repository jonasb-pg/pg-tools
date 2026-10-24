/* Prüfung 24.10.2026, Matchmaker-Script .3: Laufzeit und Verbindung.
   Befund 9 (6-Minuten-Limit ohne Zeitbremse, Status bleibt alt), 10 (Verbindungsfehler in fetchAll bricht den Lauf ab).
   Lauf: node tests/t_matchmaker_p2410_zeit.js */
const assert = require('assert');
const { umgebung, rt, z, auftrag, KOPF, QUELLE } = require('./t_matchmaker_p2410_h.js');
const ALT = '20.10.2026';
const lager = () => rt(['Dualit', 'Severin', 'Philips', 'Bosch', 'Russell'].map((m, i) => z('PG-' + (i + 1), ALT, m + ' Toaster', '10' + i, '', 20 + i, 'HOM-' + i)));
/* eine Anfrage pro Gruppe, ein Paar pro Anfrage: 5 Paare = 5 Aufrufe */
const Q = QUELLE.replace(/const PAARE_PRO_ANFRAGE = \d+;/, 'const PAARE_PRO_ANFRAGE = 1;').replace(/const PARALLEL = \d+;/, 'const PARALLEL = 1;');
const mmTabs = () => ({ 'Matchmaker': [['Matchmaker'], [''], KOPF, auftrag('Toaster')] });

/* ---------- Befund 9a: beim Start «Suche läuft seit …» (rot), bevor Claude gefragt wird ---------- */
let env = umgebung({ quelle: Q, mm: mmTabs(), rt: lager() });
let waehrend = null;
env.beimFetch = () => { waehrend = { text: env.status(), rot: env.rot() }; };
env.c.sucheAlles();
assert.ok(waehrend && /^Suche läuft seit 10:00 \(ganzer Bestand\)/.test(waehrend.text) && waehrend.rot, 'Befund 9: Status während der Suche: ' + JSON.stringify(waehrend));
assert.ok(/^Stand /.test(env.status()) && !env.rot(), 'danach der Schlussstand: ' + env.status());

/* ---------- Befund 9b: Zeitbremse: jede Anfrage dauert 100 s; nach 4½ Minuten keine neue Gruppe, Ergebnis + «Noch N offen» ---------- */
env = umgebung({ quelle: Q, mm: mmTabs(), rt: lager() });
env.uhrProAufruf = 100000;
env.c.sucheAlles();
assert.deepStrictEqual(env.alerts, [], 'kein Abbruch: ' + env.alerts.join(' | '));
assert.strictEqual(env.aufrufe, 3, 'Befund 9: Aufrufe bei 0 s, 100 s, 200 s; bei 300 s keiner mehr');
assert.strictEqual(env.urteile().length, 3, 'drei Urteile gespeichert');
assert.ok(env.rot() && /Noch 2 Paare offen – bitte nochmals starten\./.test(env.status()) && /Zeitbremse/.test(env.status()), env.status());
assert.ok(/PG-1/.test(env.zelle(4, 5)), 'Ergebnis der geprüften Paare geschrieben: ' + env.zelle(4, 5));
env.uhrProAufruf = 0;
env.paare = 0;
env.c.sucheAlles();
assert.ok(env.paare === 2 && !env.rot() && /\+ 2 weitere, die passen/.test(env.zelle(4, 5)), 'Neustart: nur der Rest: ' + env.status());
/* Zeitbremse schon bei den Suchprofilen: Aufträge ohne Profil, Grund im Status */
env = umgebung({ mm: { 'Matchmaker': [['Matchmaker'], [''], KOPF, auftrag('Toaster', '')] }, rt: lager() });
env.beimFetch = () => { env.uhr += 280000; };
env.c.sucheAlles();
assert.ok(/^Art: Toaster/.test(String(env.mm().v[3][3])) && env.paare === 0 && env.rot() && /Noch 5 Paare offen/.test(env.status()), 'Profil fertig, Urteile wegen Zeitbremse offen: ' + env.status());

/* ---------- Befund 10a: fetchAll wirft (Verbindung): die Gruppe wird einzeln nachgefragt, der Lauf geht weiter ---------- */
const Q5 = QUELLE.replace(/const PAARE_PRO_ANFRAGE = \d+;/, 'const PAARE_PRO_ANFRAGE = 1;');      // 5 Anfragen in einer Gruppe (PARALLEL 5)
env = umgebung({ quelle: Q5, mm: mmTabs(), rt: lager() });
env.fetchAllWirft = 1;
env.c.sucheAlles();
assert.deepStrictEqual(env.alerts, [], 'Befund 10: kein Abbruch: ' + env.alerts.join(' | '));
assert.ok(env.einzeln === 5 && env.urteile().length === 5 && env.aufrufe === 1, 'Gruppe einzeln nachgeholt: einzeln ' + env.einzeln + ', Urteile ' + env.urteile().length);
assert.ok(!env.rot() && /\+ 2 weitere, die passen/.test(env.zelle(4, 5)), env.status());

/* Befund 10b: fetchAll und Einzelabruf scheitern: nächste Runde (nach Pause), dann klappt es */
env = umgebung({ quelle: Q5, mm: mmTabs(), rt: lager() });
env.fetchAllWirft = 1; env.fetchWirft = true;
env.c.sucheAlles();
assert.ok(env.alerts.length === 0 && env.urteile().length === 5 && env.aufrufe === 2, 'nächste Runde: Aufrufe ' + env.aufrufe + ', Urteile ' + env.urteile().length);

/* Befund 10c: Verbindung dauerhaft weg: klare Meldung, Status rot; bis dahin gespeicherte Urteile bleiben */
env = umgebung({ quelle: Q, mm: mmTabs(), rt: lager() });
let n = 0;
env.c.UrlFetchApp.fetchAll = (reqs) => { if (++n > 1) throw new Error('Address unavailable'); return reqs.map(q => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ content: [{ type: 'tool_use', input: { urteile: [{ nr: 0, urteil: 'passt', hinweis: '' }] } }] }) })); };
env.c.UrlFetchApp.fetch = () => { throw new Error('Address unavailable'); };
env.c.sucheAlles();
assert.ok(env.urteile().length === 1, 'erste Gruppe gespeichert');
assert.ok(env.rot() && /SUCHE FEHLGESCHLAGEN/.test(env.status()) && /Claude ist nicht erreichbar \(Verbindung: /.test(env.alerts.join(' ')), 'klare Meldung, das gespeicherte Urteil bleibt: ' + env.status());
env = umgebung({ quelle: Q, mm: mmTabs(), rt: lager() });
env.fetchAllWirft = 'immer'; env.fetchWirft = true;
env.c.sucheAlles();
assert.ok(/Claude ist nicht erreichbar \(Verbindung: /.test(env.alerts.join(' ')) && /SUCHE FEHLGESCHLAGEN/.test(env.status()) && env.rot(), env.alerts.join(' | ') + ' / ' + env.status());
env.v1();

console.log('t_matchmaker_p2410_zeit ok');
