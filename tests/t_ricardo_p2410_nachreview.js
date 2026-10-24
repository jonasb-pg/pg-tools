/* Ricardo Tool, Nach-Review 24.10.2026: Regressionstests zu den Befunden 1–3, 5–8 und 11 (Server). Erfundene Daten. Lauf: node tests/t_ricardo_p2410_nachreview.js */
const h = require('./t_ricardo_p2410_hilfe.js');
const { sandbox, ok, wirft, KOMPLETT, CSV_KOPF, mm, rtTab } = h;
const post = (S) => {
  S.PROPS.POST_CLIENT_ID = 'id'; S.PROPS.POST_CLIENT_SECRET = 'geheim'; S.nummer = 0;
  S.urlAntwort = (url, o) => {
    if (/token/i.test(url)) return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ access_token: 'x', expires_in: 300 }) };
    S.nummer++; S.formate = (S.formate || []).concat([JSON.parse(o.payload).labelDefinition.imageFileType]);
    if (S.sperreNachPost) S.sperreBesetzt = true;                         // während der Post-Antwort hält jemand anderes die Sperre
    return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ item: { identCode: '99.00.1234.' + S.nummer, label: [Buffer.from('%PDF-1.4').toString('base64')] } }) };
  };
};
const adr = { 'Nachname': 'Muster', 'Vorname': 'Eva', 'Strasse': 'Testweg', 'Hausnummer': '1', 'PLZ': '3000', 'Ort': 'Bern', 'Lieferart': 'Paket B-Post' };

/* ---------- 1: Etikette, alte Seite bekommt PDF im alten Format ---------- */
let S = sandbox({ einst: { 'Etiketten-Format': 'ZPL' } }); post(S);
S.verkauf(Object.assign({ 'Verkauf-Nr': '9001', 'PG-ID': 'PG-100', 'Status': 'Zu packen' }, adr));
S.verkauf(Object.assign({ 'Verkauf-Nr': '9002', 'PG-ID': 'PG-101', 'Status': 'Zu packen' }, adr));
let e = S.c("etikette('9001')");
ok(e.typ === 'pdf' && e.pdf && e.pdf === e.daten && S.formate[0] === 'PDF', '1: alte Seite (ohne Formate) bekommt PDF mit Feld «pdf», auch bei Einstellung ZPL');
S.neu(); e = S.c("etikette('9002', false, false, ['zpl', 'pdf'])");
ok(e.typ === 'zpl' && e.pdf === '' && S.formate[1] === 'ZPL2', '1: neue Seite mit Einstellung ZPL: ZPL');
S = sandbox(); post(S);
S.verkauf(Object.assign({ 'Verkauf-Nr': '9001', 'PG-ID': 'PG-100', 'Status': 'Zu packen' }, adr));
e = S.c("etikette('9001', false, false, ['zpl', 'pdf'])");
ok(e.typ === 'pdf' && S.formate[0] === 'PDF', '1: Einstellung fehlt (vor «einrichten»): PDF');

/* ---------- 2: Sendungsnummer auch bei besetzter Sperre gespeichert ---------- */
S = sandbox(); post(S);
S.verkauf(Object.assign({ 'Verkauf-Nr': '9002', 'PG-ID': 'PG-101', 'Status': 'Zu packen' }, adr));
S.sperreNachPost = true;
e = S.c("etikette('9002', false, false, ['pdf'])");
ok(S.vz('9002')['Sendungsnummer'] === e.sendung && !e.warnungen && S.log(/Etikette ohne Sperre gespeichert/), '2: Sperre besetzt: Sendungsnummer trotzdem gespeichert (Zeile geprüft), im Log');
S.sperreNachPost = false; S.sperreBesetzt = false; S.neu();
wirft(() => S.c("etikette('9002', false, false, ['pdf'])"), /^Bitte bestätigen: Für PG-101 gibt es schon eine Etikette/, '2: danach keine zweite Etikette ohne Rückfrage');
ok(S.nummer === 1, '2: nur eine Anfrage an die Post');
/* Zeile verschwunden: Warnung mit nichtGespeichert */
S = sandbox(); post(S);
S.verkauf(Object.assign({ 'Verkauf-Nr': '9003', 'PG-ID': 'PG-102', 'Status': 'Zu packen' }, adr));
S.urlAntwort = ((alt) => (u, o) => { const r = alt(u, o); if (!/token/i.test(u)) S.VK.d.splice(1, 1); return r; })(S.urlAntwort);
e = S.c("etikette('9003', false, false, ['pdf'])");
ok(e.nichtGespeichert === true && /nicht gespeichert/.test(e.warnungen) && S.log(/Etikette nicht gespeichert/), '2: Verkauf nicht mehr da: Warnung «nicht gespeichert» an die Seite und ins Log');

/* ---------- 3: bezahlt, nicht versendet: Storno mit Rückfrage und Aufgabe «Rückzahlung» ---------- */
S = sandbox();
S.listing(Object.assign({}, KOMPLETT, { 'PG-ID': 'PG-100', 'Status': 'Verkauft', 'Verkauf-Nr': '9001' }));
S.verkauf({ 'Verkauf-Nr': '9001', 'PG-ID': 'PG-100', 'Status': 'Bereit zum Versand', 'Bezahlt am': new Date(), 'Preis CHF': 30, 'Total CHF': 39, 'Vorname': 'Eva', 'Nachname': 'Muster' });
S.verkauf({ 'Verkauf-Nr': '9004', 'PG-ID': 'PG-104', 'Status': 'Bezahlt und versendet', 'Bezahlt am': new Date() });
wirft(() => S.c("adminLoescheVerkauf(2, '9001')"), /^Bitte bestätigen: Verkauf 9001 ist bezahlt \(CHF 39\.00 .*nicht versendet.*Rückzahlung/, '3: bezahlt, nicht versendet: Rückfrage mit Hinweis auf die Rückzahlung');
ok(S.vz('9001')['Status'] === 'Bereit zum Versand', '3: ohne Bestätigung nichts geändert');
S.neu(); S.c("adminLoescheVerkauf(2, '9001', true)");
ok(S.vz('9001')['Status'] === 'Storniert' && S.zeile('PG-100')['Status'] === 'Storniert' && /Rückzahlung CHF 39\.00 an Eva Muster/.test(S.pe('WS-9001')['Text']), '3: mit Bestätigung storniert, Rückzahlung als Aufgabe im Posteingang');
S.neu(); wirft(() => S.c("adminLoescheVerkauf(3, '9004', true)"), /bezahlt und versendet\. Storno nur über eine Retoure/, '3: versendet: weiterhin nur Retoure');
ok(S.c("adminSuche('9001')").verkaeufe.length >= 0 && S.c("adminSuche('Bereit')") !== null, '3: adminSuche läuft');

/* ---------- 5: falscher Link bei «Gelistet» mit Rückfrage ersetzen ---------- */
S = sandbox();
const LA = 'https://www.ricardo.ch/de/a/toaster-1111111111/', LB = 'https://www.ricardo.ch/de/a/lampe-2222222222/';
S.listing(Object.assign({}, KOMPLETT, { 'PG-ID': 'PG-100', 'Status': 'Bereit' }));
S.listing(Object.assign({}, KOMPLETT, { 'PG-ID': 'PG-101', 'Status': 'Bereit' }));
S.c("markiereGelistet('PG-100', '" + LB + "')"); S.neu();
const am = S.zeile('PG-100')['Gelistet am'];
wirft(() => S.c("markiereGelistet('PG-100', '" + LA + "')"), /^Bitte bestätigen: PG-100 ist schon mit dem Ricardo-Link .*2222222222.* Link ersetzen/, '5: anderer Link bei «Gelistet»: Rückfrage');
S.neu(); S.c("markiereGelistet('PG-100', '" + LA + "', '', true)");
ok(S.zeile('PG-100')['Ricardo-Link'] === LA && !S.zeile('PG-100')['Frühere Links'] && S.zeile('PG-100')['Status'] === 'Gelistet' && S.zeile('PG-100')['Gelistet am'] === am && S.log(/Link ersetzt/), '5: ersetzt, alter Link NICHT in «Frühere Links», «Gelistet am» bleibt');
S.neu(); S.c("markiereGelistet('PG-101', '" + LB + "')");
ok(S.zeile('PG-101')['Status'] === 'Gelistet', '5: danach lässt sich das andere Stück mit seinem Link listen');
S.neu(); wirft(() => S.c("markiereGelistet('PG-100', '" + LB + "', '', true)"), /bereits bei PG-101 hinterlegt/, '5: auch beim Ersetzen gilt die Doppelprüfung');

/* ---------- 6: alte offene Zeile mit neuerer Zeile danach ist abgelöst; Entscheid auf der offenen Zeile ---------- */
S = sandbox();
S.listing(Object.assign({}, KOMPLETT, { 'PG-ID': 'PG-100', 'Status': 'Unverkauft', 'Angelegt am': new Date(2026, 9, 10) }));
S.listing(Object.assign({}, KOMPLETT, { 'PG-ID': 'PG-100', 'Status': 'Abgebrochen', 'Angelegt am': new Date(2026, 9, 18) }));
ok(S.c("ablauf('schicht1')").unverkauft.length === 0, '6: abgelöste Zeile nicht mehr unter «nicht verkauft»');
S.neu(); const r6 = S.c("starteListing('PG-100')");
ok(r6.status === 'In Arbeit' || r6.status === 'Bereit', '6: Stück startet wieder (wie live)');
S = sandbox();
S.listing(Object.assign({}, KOMPLETT, { 'PG-ID': 'PG-200', 'Status': 'Unverkauft', 'Entscheid unverkauft': 'Anderer Kanal' }));
S.listing(Object.assign({}, KOMPLETT, { 'PG-ID': 'PG-200', 'Status': 'Unverkauft', 'Ricardo-Link': LA }));
S.listing(Object.assign({}, KOMPLETT, { 'PG-ID': 'PG-201', 'Status': 'Storniert' }));
S.listing(Object.assign({}, KOMPLETT, { 'PG-ID': 'PG-201', 'Status': 'Gelistet', 'Ricardo-Link': LB }));
S.c("entscheidUnverkauft('PG-200', 'Neu listen')");
ok(S.L.d[2][1] === 'Bereit' && S.L.d[1][1] === 'Unverkauft' && S.L.d[1][S.c("col_('Entscheid unverkauft')") - 1] === 'Anderer Kanal', '6: Entscheid trifft die offene Zeile');
S.neu(); wirft(() => S.c("entscheidUnverkauft('PG-201', 'Neu listen')"), /ist «Gelistet», nicht unverkauft/, '6: nicht offen (neuere Zeile gelistet): Fehler statt alte Zeile ändern');

/* ---------- 7: Matchmaker-Status erst nach allen Prüfungen; scheitert die Sperre: laut ---------- */
const z0 = mm('PG-301', 'Ohne Preis', 'Offen', 'Auftrag X'); z0[9] = 0; z0[10] = 0;
S = sandbox({ ana: [], mm: [z0], rt: { Online: rtTab('Online', [{ id: 'PG-301', name: 'Ohne Preis', ort: 'TEC-1' }]), 'Archiv A': rtTab('Archiv A', []) } });
wirft(() => S.c("starteListing('PG-301', false, ['mm'])"), /keinen Startpreis/, '7: ohne Preis Fehler');
ok(S.MM.d[1][17] === 'Offen', '7: ohne Preis bleibt der Matchmaker-Status «Offen»');
S = sandbox({ ana: [], mm: [mm('PG-300', 'Stihl GTA 26', 'Offen', 'Auftrag Müller')] });
const orig = S.c('mmAufRicardo_');
S.ctx.mmAufRicardo_ = function (q) { const r = orig(q); S.sperreBesetzt = true; return r; };
wirft(() => S.c("starteListing('PG-300', false, ['mm', 'rt'])"), /gerade beschäftigt/, '7: Sperre besetzt nach dem Matchmaker-Status');
ok(S.log(/Matchmaker-Status FEHLER/) && /nicht angelegt/.test(S.pe('WM-PG-300')['Text'] || ''), '7: laut im Log und im Posteingang');
S.sperreBesetzt = false; S.neu(); S.ctx.mmAufRicardo_ = orig;
ok(S.c("starteListing('PG-300', false, [])").id === 'PG-300', '7: nochmals starten geht ohne neue Rückfrage');

/* ---------- 8: Bericht-Abgleich trägt nur plausibel nach ---------- */
S = sandbox();
S.listing(Object.assign({}, KOMPLETT, { 'PG-ID': 'PG-200', 'Status': 'Bereit', 'Angelegt am': new Date(2026, 9, 22) }));
S.verkauf({ 'Verkauf-Nr': '555001', 'Artikel-Nr': '1300000001', 'Titel': 'Lampe', 'Verkauft am': new Date(2026, 9, 1), 'Preis CHF': 40, 'Versand CHF': 9, 'Total CHF': 49, 'Status': 'Bezahlt und versendet', 'Bezahlt am': new Date(2026, 9, 2) });
S.c('importVerkaeufe')(CSV_KOPF + '555001;1300000001;Lampe;PG-200;01.10.2026 12:00;40;9;nick;Eva;Muster;Testweg 1;3000;Bern;Paket;Versandt\n');
ok(S.zeile('PG-200')['Status'] === 'Bereit' && !S.vz('555001')['PG-ID'] && /noch nie einen Ricardo-Link/.test(S.pe('W-555001')['Text']), '8: Listing ohne Link: nichts nachgetragen, Hinweis');
S = sandbox();
S.listing(Object.assign({}, KOMPLETT, { 'PG-ID': 'PG-200', 'Status': 'Gelistet', 'Ricardo-Link': 'https://www.ricardo.ch/de/a/x-1300000009/', 'Angelegt am': new Date(2026, 9, 22) }));
S.verkauf({ 'Verkauf-Nr': '555002', 'Artikel-Nr': '', 'Titel': 'Lampe', 'Verkauft am': new Date(2026, 9, 1), 'Preis CHF': 40, 'Status': 'Bezahlt und versendet', 'Bezahlt am': new Date(2026, 9, 2) });
S.c('importVerkaeufe')(CSV_KOPF + '555002;;Lampe;PG-200;01.10.2026 12:00;40;9;nick;Eva;Muster;Testweg 1;3000;Bern;Paket;Versandt\n');
ok(S.zeile('PG-200')['Status'] === 'Gelistet' && /erst nach dem Verkauf angelegt/.test(S.pe('W-555002')['Text']), '8: Listing nach dem Verkauf angelegt: Hinweis, kein Status');
S = sandbox();
S.listing(Object.assign({}, KOMPLETT, { 'PG-ID': 'PG-200', 'Status': 'Gelistet', 'Ricardo-Link': 'https://www.ricardo.ch/de/a/x-1300000001/', 'Angelegt am': new Date(2026, 9, 1, 8) }));
S.verkauf({ 'Verkauf-Nr': '555003', 'Artikel-Nr': '1300000001', 'Titel': 'Lampe', 'Verkauft am': new Date(2026, 9, 5), 'Preis CHF': 40, 'Status': 'Zu packen' });
S.c('importVerkaeufe')(CSV_KOPF + '555003;1300000001;Lampe;;05.10.2026 12:00;40;9;nick;Eva;Muster;Testweg 1;3000;Bern;Paket;\n');
ok(S.zeile('PG-200')['Status'] === 'Verkauft' && S.vz('555003')['PG-ID'] === 'PG-200', '8: plausibel (Link passt, Datum passt): wie bisher nachgetragen');

/* ---------- 11: Archiv ohne Kopfzeile im Admin › Betrieb ---------- */
S = sandbox();
S.RT['Archiv Kaputt'] = h.blatt('Archiv Kaputt', [['nur Text'], ['PG-1', 'Etwas']]);
S.c("suche('Toaster')");
let b = S.c('archiveOhneKopf_()');
ok(b.length === 1 && b[0].tab === 'Archiv Kaputt' && /archivOhneKopf: archiveOhneKopf_\(\)/.test(S.c('adminBetrieb').toString()), '11: Admin › Betrieb nennt den Archiv-Tab ohne Kopfzeile');
S.RT['Archiv Kaputt'] = rtTab('Archiv Kaputt', []); S.kalt(); S.c("suche('Toaster')");
ok(S.c('archiveOhneKopf_()').length === 0, '11: nach der Reparatur verschwindet die Meldung');

h.ende();
