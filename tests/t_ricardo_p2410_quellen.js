/* Ricardo Tool, Prüfung 24.10.2026: Befunde 3, 9, 14, 17, Z2, Z3, Z5, Z14 und Vertrag V3, V4, V5 (Quellen, Matchmaker, Return-Tool-Tabs, Nummern).
   Erfundene Daten. Lauf: node tests/t_ricardo_p2410_quellen.js */
const h = require('./t_ricardo_p2410_hilfe.js');
const { sandbox, ok, wirft, rtTab, blatt, ana, mm } = h;
const basis = extra => Object.assign({ Online: rtTab('Online', [{ id: 'PG-100', name: 'Philips Toaster', ort: 'TEC-1', vp: 30, ovp: 60 }]), 'Stationär': rtTab('Stationär', []), Analyse: rtTab('Analyse', []),
  'Berner Brocki': rtTab('Berner Brocki', []), Caritas: rtTab('Caritas', []), Heilsarmee: rtTab('Heilsarmee', []), Scanner: rtTab('Scanner', [], true), 'Archiv Entsorgt': rtTab('Archiv Entsorgt', []) }, extra || {});

/* ---------- Vertrag V3: Nummern und Barcodes ---------- */
let S = sandbox();
const id = x => S.c('idNorm_(' + JSON.stringify(x) + ')'), bc = x => S.c('normEan_(' + JSON.stringify(x) + ')');
ok(['PG-0862', 'PG-862', 'pg 862', "PG'862", 'PG862', ' pg-0862 '].every(x => id(x) === 'PG-862'), 'V3: PG-Schreibweisen = PG-862');
ok(id('PG_862') === 'PG_862' && id('PG - 862') === 'PG - 862' && id('an 0008') === 'AN-8' && id('ET-0012') === 'ET-12' && id('rt 1') === 'RT-1' && id(' x-1 ') === 'X-1', 'V3: nur ein Trenner; AN, ET, RT; Unbekanntes trim + gross');
ok(['07613081105484', '7613081105484', "'07613081105484", '(01)07613081105484', '0107613081105484', ' 7613 0811 05484 '].every(x => bc(x) === '7613081105484') && S.c('normEan_(7613081105484)') === '7613081105484', 'V3: Barcode-Schreibweisen gleich');
ok(bc('4006381-333931') === '4006381333931' && bc('x123 456f12') === 'X123456F12' && bc('') === '', 'V3: Bindestrich weg, Buchstaben gross ohne Leerzeichen');
ok(S.c("matcher_('PG-ALT-12')({ id: 'pg-alt-12', name: '' })") === true && S.c("matcher_('A-7')({ id: 'PG-300', nr: 'A-000007', name: '' })") === true, 'V3: andere Nummern genau, Analyse-Nr weiter suchbar');

/* ---------- Vertrag V5, Prüfung 3: Matchmaker im Bündel und beim Start ---------- */
S = sandbox({ rt: basis({ Analyse: rtTab('Analyse', [{ id: 'PG-400', name: 'Föhn Dyson', ort: 'Analyse', vp: 80 }, { id: 'PG-401', name: 'Mixer', ort: 'Analyse', vp: 40 }, { id: 'PG-402', name: 'Lampe', ort: 'Analyse', vp: 20 }]) }),
  ana: [], mm: [mm('PG-400', 'Föhn Dyson', 'Offen', 'Föhn gesucht'), mm('PG-401', 'Mixer', 'Geholt', 'Mixer gesucht'), mm('PG-402', 'Lampe', 'Offen', 'Lampe gesucht')] });
S.listing({ 'PG-ID': 'PG-100', 'Status': 'In Arbeit', 'Bezeichnung': 'Toaster', 'Startpreis CHF': 30, 'Quelle Tab': 'Online' });
let t = wirft(() => S.c("buendelHinzu('PG-100', 'PG-400')"), /^Bitte bestätigen: PG-400 liegt im Matchmaker für Auftrag «Föhn gesucht»\. Dort nicht verkauft und jetzt auf Ricardo\? \[mm\]$/, 'V5/3: Bündel mit Matchmaker-Stück: der Server fragt');
ok(S.zeile('PG-100')['Bündel-IDs'] === '' && S.MM.d[1][17] === 'Offen', '3: ohne Bestätigung nichts');
S.neu(); let r = S.c("buendelHinzu('PG-100', 'PG-400', ['mm'])");
ok(r.buendelIds.join() === 'PG-400' && S.MM.d[1][17] === 'Ricardo', '3: mit Bestätigung im Bündel und im Matchmaker «Ricardo»');
S.neu(); S.MM.kaputt = true;
wirft(() => S.c("buendelHinzu('PG-100', 'PG-402', ['mm'])"), /^Bündel nicht ergänzt: Der Status im Matchmaker/, '3: Status lässt sich nicht setzen: nicht ins Bündel');
ok(S.zeile('PG-100')['Bündel-IDs'] === 'PG-400', '3: Bündel unverändert');
S.MM.kaputt = false; S.neu();
wirft(() => S.c("buendelHinzu('PG-100', 'PG-401', ['mm'])"), /PG-401 wurde im Matchmaker geholt \(Auftrag «Mixer gesucht»\)/, 'V5: «Geholt» sperrt das Bündel');
wirft(() => S.c("starteListing('PG-401', true, ['mm', 'kanal', 'rt', 'analyse'])"), /wurde im Matchmaker geholt/, 'V5: «Geholt» sperrt den Start (auch mit allen Bestätigungen)');
ok(!S.c('analyseListe()').some(x => x.id === 'PG-401' || x.id === 'PG-402'), 'V5: «Geholt» und «Offen» nicht in «Aus der Analyse»');
r = S.c("suche('PG-401')");
ok(r.treffer.length === 1 && r.treffer[0].mmStatus === 'Geholt', 'V5: Suche zeigt «Geholt» (Oberfläche sperrt)');
/* Z14: mmAufRicardo_ schreibt nur, wenn der Status noch «Offen» ist; Zeile über die PG-ID */
S.neu(); const q = S.c("findeAnalyse_('PG-402')");
S.MM.d[3][17] = 'Geholt';                                                                // inzwischen geholt
let m = S.c('mmAufRicardo_')(q);
ok(m.ok === false && /jetzt «Geholt», das Stück wurde geholt/.test(m.fehler) && S.MM.d[3][17] === 'Geholt', 'Z14: inzwischen «Geholt»: nicht überschrieben');
S.MM.d[3][17] = 'Offen'; S.MM.d.splice(1, 0, ['PG-999'].concat(Array(17).fill('')));     // Zeilen verschoben
m = S.c('mmAufRicardo_')(q);
ok(m.ok && S.MM.d[4][17] === 'Ricardo' && S.MM.d[1][17] === '', 'Z14: verschobene Zeile über die PG-ID gefunden');
/* Matchmaker-Eintrag jünger als der Eintrag im Tab «Ricardo»: er zählt */
S = sandbox({ ana: [ana('PG-410', 'Dyson Föhn', new Date(2026, 9, 10))], mm: [mm('PG-410', 'Dyson Föhn', 'Offen', 'Föhn für Frau M.', new Date(2026, 9, 22))],
  rt: basis({ Analyse: rtTab('Analyse', [{ id: 'PG-410', name: 'Dyson Föhn', ort: 'Analyse', vp: 80 }]) }) });
wirft(() => S.c("starteListing('PG-410')"), /liegt im Matchmaker für Auftrag «Föhn für Frau M\.»/, 'V5: jüngerer Matchmaker-Eintrag verlangt die Bestätigung');

/* ---------- Prüfung Z2: Suche aus der Kopie (ohne Matchmaker-Eintrag), Start erkennt ihn am Server ---------- */
S = sandbox({ ana: [], mm: [], rt: basis({ Analyse: rtTab('Analyse', [{ id: 'PG-420', name: 'Dyson Föhn', ort: 'Analyse', vp: 80 }]) }) });
S.c('vorratFuellen_()');                                                                 // Auslöser: Kopie ohne Matchmaker-Eintrag
S.MM.d.push(mm('PG-420', 'Dyson Föhn', 'Offen', 'Föhn für Frau K.'));                     // eben ins Regal Matchmaker
S.neu(); r = S.c("suche('PG-420')");
ok(!r.treffer.length && r.andere.length === 1 && r.andere[0].tab === 'Analyse', 'Z2: Suche kennt das Stück nur aus dem Return-Tool-Tab «Analyse»');
S.neu(); wirft(() => S.c("starteListing('PG-420', true)"), /^Bitte bestätigen: PG-420 liegt im Matchmaker für Auftrag «Föhn für Frau K\.»/, 'Z2: «Trotzdem listen»: der Server fragt nach dem Matchmaker');
S.neu(); r = S.c("starteListing('PG-420', true, ['mm'])");
ok(r.analyse && S.MM.d[1][17] === 'Ricardo', 'Z2: mit Bestätigung aus der Analyse gestartet, Matchmaker «Ricardo»');

/* ---------- Prüfung 9, Z3: analysiertes Stück in anderem Kanal, neuem Tab, Archiv, nicht im Return Tool ---------- */
const fall = (extra, nr) => sandbox({ ana: [ana(nr, 'Stihl GTA 26')], rt: basis(extra) });
S = fall({ Caritas: rtTab('Caritas', [{ id: 'PG-301', name: 'Stihl GTA 26', ort: 'CAR-2', vp: 0 }]) }, 'PG-301');
wirft(() => S.c("starteListing('PG-301')"), /^Bitte bestätigen: PG-301 ist analysiert, steht im Return Tool aber im Tab «Caritas» \(Lagerort «CAR-2»\).* \[kanal\]$/, '9/Z3 a: in Caritas: Bestätigung');
ok(!S.L.d.some(z => z[0] === 'PG-301'), '9: ohne Bestätigung kein Listing');
S.neu(); ok(S.c("starteListing('PG-301', false, ['kanal'])").analyse, '9: mit Bestätigung aus der Analyse gelistet');
S = sandbox({ ana: [ana('PG-302', 'Stihl GTA 26')], rt: basis({ 'Brocki XY': rtTab('Brocki XY', [{ id: 'PG-302', name: 'Stihl GTA 26', ort: 'BXY-1', vp: 10 }]) }) });
wirft(() => S.c("starteListing('PG-302')"), /steht im Return Tool aber im Tab «Brocki XY»/, 'Z3 b / V4: neuer Kanal-Tab wird gelesen, Bestätigung');
S = sandbox({ ana: [ana('PG-303', 'Stihl GTA 26')], rt: basis({ 'ARCHIV Verkauft': rtTab('ARCHIV Verkauft', [{ id: 'PG-303', name: 'Stihl GTA 26', ort: '' }]) }) });
wirft(() => S.c("starteListing('PG-303', false, ['rt', 'kanal', 'archiv'])"), /steht im Return Tool im Tab «ARCHIV Verkauft» \(nicht mehr an Lager\)/, 'Z3 c / V4: «ARCHIV …» in Grossschrift ist Archiv: gesperrt');
S = fall({}, 'PG-304');
wirft(() => S.c("starteListing('PG-304')"), /^Bitte bestätigen: PG-304 wurde im Return Tool nicht gefunden .* \[rt\]$/, 'Z3 e: aus dem Return Tool verschwunden: Bestätigung «nicht gefunden»');
S = fall({ 'Stationär': rtTab('Stationär', [{ id: 'PG-305', name: 'Stihl GTA 26', ort: 'Analyse', vp: 10 }]) }, 'PG-305');
ok(S.c("starteListing('PG-305')").analyse, '9: Lagerort «Analyse» in einem anderen Tab (Warteschlange der Analyse): ohne Rückfrage');
S = fall({ Online: rtTab('Online', [{ id: 'PG-306', name: 'Stihl GTA 26', ort: 'TEC-9', vp: 10 }]) }, 'PG-306');
ok(S.c("starteListing('PG-306')").analyse, '9: im Such-Tab «Online»: ohne Rückfrage');
S = sandbox({ ana: [ana('AN-0008', 'Paulmann Stripe')] });
ok(S.c("starteListing('AN-0008')").analyse, '9: AN-Nummer (nie im Return Tool): ohne Rückfrage');

/* ---------- Prüfung Z5: nicht analysiert, Lagerort «Analyse» ---------- */
S = sandbox({ ana: [], rt: basis({ Online: rtTab('Online', [{ id: 'PG-120', name: 'Philips Toaster HD2581', ort: 'Analyse', vp: 30 }]) }) });
wirft(() => S.c("starteListing('PG-120')"), /^Bitte bestätigen: PG-120 liegt in der Analyse \(Lagerort «Analyse» im Tab «Online»\).* \[analyse\]$/, 'Z5: wartet auf die Analyse: Bestätigung');
S.neu(); ok(S.c("starteListing('PG-120', false, ['analyse'])").status === 'In Arbeit', 'Z5: mit Bestätigung gestartet');
S = sandbox({ ana: [], rt: basis({ Online: rtTab('Online', [{ id: 'PG-121', name: 'Lampe', ort: 'Analyse', vp: 30 }]) }) });
S.listing({ 'PG-ID': 'PG-100', 'Status': 'In Arbeit', 'Bezeichnung': 'Toaster', 'Startpreis CHF': 30, 'Quelle Tab': 'Online' });
wirft(() => S.c("buendelHinzu('PG-100', 'PG-121')"), /liegt in der Analyse .* \[analyse\]$/, 'Z5: auch im Bündel');

/* ---------- Prüfung 14: Archiv-Tab ohne Kopfzeile ---------- */
S = sandbox();
S.RT['Archiv Notizen'] = blatt('Archiv Notizen', [['Notizen zum Archiv'], ['bitte nicht löschen']]);
S.listing({ 'PG-ID': 'PG-100', 'Status': 'In Arbeit', 'Bezeichnung': 'Toaster', 'Startpreis CHF': 30, 'Quelle Tab': 'Online' });
ok(S.c("starteListing('PG-101')").id === 'PG-101', '14: Start ohne Rückfrage (Archiv-Tab ohne Kopfzeile übersprungen)');
ok(S.logs.filter(r => /Archiv Notizen.*keine Kopfzeile/.test(r[4])).length === 1, '14: einmal im Log gemeldet');
S.RT.Online.d.push(h.RT_KOPF.map(k => ({ ID: 'PG-102', Bezeichnung: 'Netzteil', VP: 5, Lagerort: 'TEC-3' })[k] ?? ''));
S.neu(); r = S.c("buendelHinzu('PG-100', 'PG-102')");
ok(r.buendelIds.join() === 'PG-102', '14: Bündel mit PG-Teil geht (vorher ganz gesperrt)');
ok(S.logs.filter(r => /Archiv Notizen/.test(r[4])).length === 1, '14: nicht nochmals gemeldet');
r = S.c("suche('Toaster')");
ok(!r.lesefehler.length, '14: kein Lesefehler in der Suche');

/* ---------- Vertrag V4: neue Tabs, fremde Tabs, Scanner ---------- */
S = sandbox({ einst: { 'Hinweis-Tabs': 'Stationär, Analyse' } });
S.RT['Brocki XY'] = rtTab('Brocki XY', [{ id: 'PG-901', name: 'Philips Toaster grau', ort: 'BXY-1', vp: 15 }]);
S.RT['Auswertung'] = blatt('Auswertung', [['Monat', 'Umsatz'], ['Okt', 1234]]);
S.RT['Scanner'] = rtTab('Scanner', [{ name: 'Philips Toaster Ersatzteil', bc: '123', ort: 'HOM-44' }], true);
r = S.c("suche('Philips Toaster')");
ok(r.andere.some(x => x.id === 'PG-901' && x.tab === 'Brocki XY') && r.andere.some(x => x.tab === 'Scanner') && !r.lesefehler.length, 'V4: neuer Kanal-Tab und «Scanner» ohne Eintrag in den Einstellungen durchsucht, fremder Tab still übersprungen');
ok(S.log(/Neuer Kanal-Tab «Brocki XY»/) && !S.log(/Auswertung/), 'V4: neuer Kanal-Tab einmal im Log gemeldet');
ok(S.CACHE['rt1:kein:Auswertung'] === '1', 'V4: fremder Tab gemerkt (wird nur alle 6 Stunden wieder angesehen)');
const gelesen = S.RT['Auswertung'].gelesen || 0; S.neu(); S.c("suche('Lampe')");
ok((S.RT['Auswertung'].gelesen || 0) === gelesen, 'V4: fremder Tab in der nächsten Suche nicht gelesen');

/* ---------- Tempo: Suche aus dem Vorrat liest nichts frisch ---------- */
S = sandbox();
S.RT['Auswertung'] = blatt('Auswertung', [['Monat', 'Umsatz']]);
S.ausloeser = ['suchVorrat'];
S.c('vorratFuellen_()'); S.neu(); S.oeffnen = 0; S.atOeffnen = 0;
r = S.c("suche('PG-100')");
ok(r.treffer.length === 1 && S.oeffnen === 0 && !S.atOeffnen, 'Tempo: Suche mit gefülltem Vorrat öffnet weder Return Tool noch ANALYSE TOOL');

/* ---------- Prüfung 17: zweiter Durchgang liest die Analyse nicht frisch; Start schon ---------- */
S = sandbox({ ana: [], rt: basis({ Analyse: rtTab('Analyse', [{ id: 'PG-777', name: 'Neues Gerät Zeta', ort: 'Analyse', vp: 20, ovp: 40 }]) }) });   // wartet im Return Tool auf die Analyse
S.c("suche('irgendwas')");                                                               // Kopien gemerkt (Analyse noch ohne PG-777)
S.ANA.d.push(ana('PG-777', 'Neues Gerät Zeta'));                                         // eben analysiert
S.neu(); S.atOeffnen = 0; r = S.c("suche('Zeta')");
ok(!S.atOeffnen && r.andere.length === 1 && r.andere[0].id === 'PG-777', '17: zweiter Durchgang ohne frische Analyse, das Stück steht im Return-Tool-Tab «Analyse»');
S.neu(); r = S.c("starteListing('PG-777', true)");
ok(r.analyse && r.titel === 'Neues Gerät Zeta Titel', '17: der Start liest die Analyse frisch und nimmt ihre Angaben');

h.ende();
