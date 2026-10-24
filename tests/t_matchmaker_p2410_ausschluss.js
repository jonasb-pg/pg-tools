/* Prüfung 24.10.2026, Matchmaker-Script .3: welche Stücke Kandidaten sind.
   Befund 6 / Z1 (Ricardo Tool und Umpack Tool ausschliessen, Vertrag V5a/b), 19 (Stücke unter «Aus Analyse» geholter Aufträge),
   Z6 (IDs normalisiert, Vertrag V3), Z7 («Ricardo Offline» + Ricardo frei mit «Anderer Kanal» = wieder frei), Z12 (ohne PG-ID nie «Passt»),
   18 (Stücke ohne Link: Kategorie im Suchtext), V3 (Barcode-Vergleich; alte Produkt-Schlüssel gelten weiter).
   Lauf: node tests/t_matchmaker_p2410_ausschluss.js */
const assert = require('assert');
const { umgebung, rt, rtTab, z, zs, P, auftrag, kennung, KOPF, AN_KOPF, RIC_KOPF, UMP_KOPF } = require('./t_matchmaker_p2410_h.js');
const ALT = '20.10.2026';
const F = 'Art: Föhn\nMuss: –\nSuchwörter: föhn, haartrockner';
const ERL_KOPF = ['Geholt am', 'Gesucht', 'Mehr Infos', 'Limit CHF', 'Suchprofil', 'Gefunden', 'Zurück in die Liste', 'Aus Analyse'];
const stueck = (id, name, kat) => z(id, ALT, name, '76' + id.replace(/\D/g, ''), '', 100, 'TEC-1', kat);
const tabs = () => ({
  mm: { 'Matchmaker': [['Matchmaker'], [''], KOPF, auftrag('Föhn', F)],
    'Erledigt': [ERL_KOPF,
      ['22.10.2026', 'Föhn Dyson', '', 300, 'Art: Föhn', '', false, 'PG-0900 · Dyson Föhn E1 · 22.10.2026'],
      ['20.10.2026', 'Haartrockner', '', 80, 'Art: Haartrockner', '', false, 'PG-901 · Dyson Föhn E2 · 20.10.2026\nPG-901 · nicht geklappt · 21.10.2026'],
      ['21.10.2026', 'Föhn klein', '', 80, 'Art: Föhn', '', false, 'PG-902 · Dyson Föhn E3 · 19.10.2026\nPG-902 · nicht verkauft, jetzt auf Ricardo · 21.10.2026'],
      /* derselbe Vermerk «nicht geklappt» bei einem anderen geholten Auftrag hebt die Reservation von Zeile 2 nicht auf (pro Auftrag, wie im Analyse Tool) */
      ['23.10.2026', 'Föhn gross', '', 80, 'Art: Föhn', '', false, 'PG-900· Dyson Föhn E1 · 18.10.2026\nPG-900 · nicht geklappt · 19.10.2026']] },
  rt: rt([
    stueck('PG-862', 'Dyson Föhn A'), stueck('PG-700', 'Dyson Föhn B'), stueck('PG-701', 'Dyson Föhn C'), stueck('PG-702', 'Dyson Föhn D'),
    stueck('PG-703', 'Dyson Föhn F'), stueck('PG-704', 'Dyson Föhn G'), stueck('PG-705', 'Dyson Föhn H'), stueck('PG-500', 'Dyson Föhn I'),
    stueck('PG-600', 'Dyson Föhn U1'), stueck('PG-601', 'Dyson Föhn U2'), stueck('PG-602', 'Dyson Föhn U3'), stueck('PG-603', 'Dyson Föhn U4'),
    stueck('PG-900', 'Dyson Föhn E1'), stueck('PG-901', 'Dyson Föhn E2'), stueck('PG-902', 'Dyson Föhn E3'),
    stueck('PG-910', 'Supersonic HD07 pink', 'Haartrockner')],                                   // Befund 18: Produktart nur in der Kategorie
  { 'Scanner': rtTab([zs(ALT, 'Dyson Föhn Scanner', '7699', 90, 'HOM-45')], true) }),
  an: { 'Analysen': [AN_KOPF, ['A-1', 'PG-0862', 'Ja', 'Ricardo Offline'], ['A-2', 'PG-500', 'Ja', 'Ricardo Offline']] },
  ric: { 'Listings': [RIC_KOPF,
    ['PG-862', 'Unverkauft', 'Dyson Föhn A', '', 'Anderer Kanal'],         // Z7: wieder frei
    ['pg 700', 'Gelistet', 'Dyson Föhn B', '', ''],                         // läuft auf Ricardo (ID anders geschrieben)
    ['PG-750', 'Verkauft', 'Bündel Föhne', 'PG-701, PG-0702', ''],          // Bündel verkauft
    ['PG-703', 'Unverkauft', 'Dyson Föhn F', '', 'Entsorgung'],            // entsorgt
    ['PG-704', 'Gelistet', 'Dyson Föhn G', '', ''], ['PG-704', 'Abgebrochen', 'Dyson Föhn G', '', ''],   // nicht freie Zeile zählt
    ['PG-705', 'Abgebrochen', 'Dyson Föhn H', '', ''],                      // frei
    ['PG-500', 'Unverkauft', 'Dyson Föhn I', '', '']] },                    // frei, aber ohne Entscheid: bleibt über das ANALYSE TOOL weg
  ump: { 'Änderungen': [UMP_KOPF,
    ['U-0001', 'PG-600', 'Dyson Föhn U1', 'Verkaufen', 'Palette Brocki', 'Brocki', 'TEC-1', 'BRO-1', 100, 50, 'Stationär', 7, '', 'ok'],
    ['U-0001', 'PG-601', 'Dyson Föhn U2', 'Entsorgen', 'Entsorgung', '', 'TEC-1', '', 100, 0, 'Stationär', 8, '24.10.2026 09:00 jonas@pretty-good.ch', 'ok'],
    ['U-0001', 'PG-602', 'Dyson Föhn U3', 'Lagerort ändern', 'Palette 2', '', 'TEC-1', 'PAL-2', 100, 100, 'Stationär', 9, '', 'ok'],
    ['U-0002 (zurückgenommen)', 'PG-603', 'Dyson Föhn U4', 'Verkaufen', 'Palette X', 'Caritas', 'TEC-1', 'CAR-1', 100, 50, 'Stationär', 10, '', 'ok']] }
});

let env = umgebung(tabs());
env.c.sucheAlles();
assert.deepStrictEqual(env.alerts, [], env.alerts.join(' | '));
const gefragt = env.gefragt.slice().sort();
const erwartet = ['Dyson Föhn A', 'Dyson Föhn H', 'Dyson Föhn U2', 'Dyson Föhn U3', 'Dyson Föhn U4', 'Dyson Föhn E2', 'Dyson Föhn E3', 'Supersonic HD07 pink', 'Dyson Föhn Scanner'].sort();
assert.deepStrictEqual(gefragt, erwartet, 'Kandidaten nach allen Ausschlüssen');
/* Befund 6, Vertrag V5a: B (gelistet, «pg 700»), C und D (im verkauften Bündel, «PG-0702»), F (Entsorgung), G (nicht freie Zeile zählt) weg */
['Dyson Föhn B', 'Dyson Föhn C', 'Dyson Föhn D', 'Dyson Föhn F', 'Dyson Föhn G'].forEach(n => assert.ok(env.gefragt.indexOf(n) < 0, 'Ricardo: ' + n + ' ausgeschlossen'));
/* Z7: A steht im ANALYSE TOOL als «PG-0862» Ricardo Offline, im Ricardo Tool frei mit «Anderer Kanal»: Kandidat. I ohne Entscheid: weg */
assert.ok(env.gefragt.indexOf('Dyson Föhn A') > -1 && env.gefragt.indexOf('Dyson Föhn I') < 0, 'Z7');
/* Vertrag V5b: U1 (Verkaufen, nicht erledigt) weg; U2 (erledigt), U3 (Lagerort ändern), U4 (zurückgenommen) bleiben */
assert.ok(env.gefragt.indexOf('Dyson Föhn U1') < 0, 'Umpack: Verkauf ohne «Erledigt» ausgeschlossen');
/* Befund 19: E1 bei geholtem Auftrag («PG-0900» = PG-900) weg; E2 «nicht geklappt», E3 «Ricardo» heben auf */
assert.ok(env.gefragt.indexOf('Dyson Föhn E1') < 0 && env.gefragt.indexOf('Dyson Föhn E2') > -1 && env.gefragt.indexOf('Dyson Föhn E3') > -1, 'Befund 19');
const st = env.status();
assert.ok(/1 Stück mit Ergebnis im ANALYSE TOOL/.test(st) && /5 Stück im Ricardo Tool/.test(st) && /1 Stück im Umpack Tool/.test(st) && /1 Stück bei geholten Aufträgen/.test(st), st);
assert.ok(!env.rot(), 'alle Quellen lesbar: nicht rot: ' + st);
/* Befund 18: PG-910 nur über die Kategorie gefunden; Zahl der Stücke ohne Link im Status */
assert.ok(/17 Stück ohne Shop-Link \(gesucht in Bezeichnung und Kategorie\)/.test(st), st);
/* Z12: Scanner-Stück ohne PG-ID nie unter «Passt», sondern unter «Ähnlich» mit Hinweis */
const ae = [6, 7, 8].map(k => env.zelle(4, k)).join('\n');
assert.ok(!/Scanner/.test(env.zelle(4, 5)), 'Z12: nicht unter «Passt»: ' + env.zelle(4, 5));
assert.ok(/Dyson Föhn Scanner\nohne ID \(Scanner\)/.test(ae) && /passt, aber ohne PG-ID/.test(ae), 'Z12: unter «Ähnlich» mit Hinweis: ' + ae);
assert.ok(/\+ 5 weitere, die passen/.test(env.zelle(4, 5)), '8 passende Stücke mit PG-ID: 3 gezeigt + 5 weitere: ' + env.zelle(4, 5));

/* Nicht lesbare Quelle: Status rot mit Grund, Ergebnis trotzdem geschrieben (wie beim ANALYSE TOOL) */
env = umgebung(tabs());
env.kaputt.RIC = true;
env.c.sucheAlles();
assert.ok(env.rot() && /ACHTUNG: Ricardo Tool nicht lesbar \(Kein Zugriff\)\. Stücke, die auf Ricardo laufen, sind NICHT ausgeschlossen\./.test(env.status()), env.status());
assert.ok(env.gefragt.indexOf('Dyson Föhn B') > -1 && env.gefragt.indexOf('Dyson Föhn I') < 0 && env.gefragt.indexOf('Dyson Föhn A') < 0, 'ohne Ricardo Tool: nichts von dort ausgeschlossen, A bleibt über das ANALYSE TOOL weg');
assert.ok(env.zelle(4, 5) !== '', 'Ergebnis geschrieben');
env = umgebung(tabs());
env.kaputt.UMP = true;
env.c.sucheAlles();
assert.ok(env.rot() && /ACHTUNG: Umpack Tool nicht lesbar \(Kein Zugriff\)/.test(env.status()) && env.gefragt.indexOf('Dyson Föhn U1') > -1, env.status());
env = umgebung(Object.assign(tabs(), { ric: { 'Listings': [['PG-ID', 'Status', 'Bezeichnung']] } }));
env.c.sucheAlles();
assert.ok(env.rot() && /Ricardo Tool nicht lesbar \(Spalte «Bündel-IDs», «Entscheid unverkauft» fehlt im Tab «Listings»\)/.test(env.status()), env.status());
env = umgebung(Object.assign(tabs(), { ump: { 'Änderungen': [['Durchgang', 'PG-ID']] } }));
env.c.sucheAlles();
assert.ok(env.rot() && /Umpack Tool nicht lesbar \(Spalte «Aktion», «Erledigt» fehlt im Tab «Änderungen»\)/.test(env.status()), env.status());
env = umgebung(Object.assign(tabs(), { an: { 'Analysen': [AN_KOPF] } }));
env.kaputt.AN = true;
env.c.sucheAlles();
assert.ok(env.rot() && /ACHTUNG: ANALYSE TOOL nicht lesbar \(Kein Zugriff\)/.test(env.status()), env.status());

/* Z6 / Vertrag V3: PG-ID und Barcode vergleichen */
const pg = (x) => env.lauf('pgNorm_(' + JSON.stringify(x) + ')');
[['PG-0862', 'PG-862'], ['pg 0862', 'PG-862'], ["PG'862", 'PG-862'], ['PG862', 'PG-862'], [' PG-862 ', 'PG-862'], ['pg-000', 'PG-0'], ['AN-0012', 'AN-12'], ['rc 7', 'RC-7'],
  ['RT-0003', 'RT-3'], ['et5', 'ET-5'], ['ohne ID (Scanner)', 'OHNE ID (SCANNER)'], ['862', '862'], ['', '']].forEach(f => assert.strictEqual(pg(f[0]), f[1], 'pgNorm_ ' + f[0]));
const bc = (x) => env.lauf('bcKey_(' + JSON.stringify(x) + ')');
[['07613081105484', '7613081105484'], ['7613081105484', '7613081105484'], [7613081105484, '7613081105484'], ["'07613081105484", '7613081105484'],
  ['4006381-333931', '4006381333931'], ['(01)07613081105484', '7613081105484'], ['0107613081105484', '7613081105484'], [' 7613 0811 05484 ', '7613081105484'],
  ['ab-12 c', 'AB12C'], ['0100000000000001', '1'], ['01234567890123', '1234567890123'], ['', '']].forEach(f => assert.strictEqual(bc(f[0]), f[1], 'bcKey_ ' + f[0]));

/* V3 ohne neues Bezahlen: Urteil mit Produkt-Schlüssel in alter Barcode-Schreibweise («4006381-333931») gilt weiter */
const K = kennung('Toaster', '', P('Toaster'));
env = umgebung({ mm: { 'Matchmaker': [['Matchmaker'], [''], KOPF, auftrag('Toaster')],
  'Urteile': [['Kennung', 'Gesucht', 'Produkt', 'Urteil (passt / ähnlich / nein)', 'Hinweis', 'Geprüft am', 'Produkt-Schlüssel'],
    [K, 'Toaster', 'Philips Toaster', 'ähnlich', 'Farbe prüfen', '24.10.2026', 'philips toaster|bc:4006381-333931'],
    [K, 'Toaster', 'Dualit Toaster', 'passt', '', '24.10.2026', 'dualit toaster|bc:7613081105484']] },
  rt: rt([z('PG-1', ALT, 'Philips Toaster', '4006381-333931', '', 30, 'HOM-1'), z('PG-2', ALT, 'Dualit Toaster', '(01)07613081105484', '', 50, 'HOM-2')]) });
env.c.sucheAlles();
assert.strictEqual(env.paare, 0, 'V3: nichts neu bezahlt');
assert.ok(/PG-1/.test(env.zelle(4, 6)) && /Farbe prüfen/.test(env.zelle(4, 6)) && /PG-2/.test(env.zelle(4, 5)), 'alte Urteile gelten: ' + env.zeile(4));

console.log('t_matchmaker_p2410_ausschluss ok');
