/* Ricardo Tool, Prüfung 24.10.2026: Befunde 2, 4, 10 (Sperre, Mails, MailApp), 15, 16, 22, Z10, Vertrag V1/V2. Erfundene Daten. Lauf: node tests/t_ricardo_p2410_verkauf.js */
const h = require('./t_ricardo_p2410_hilfe.js');
const { sandbox, ok, wirft, KOMPLETT, CSV_KOPF } = h;
const L1 = 'https://www.ricardo.ch/de/a/toaster-1111111111/', L2 = 'https://www.ricardo.ch/de/a/kabel-2222222222/';
const mail = o => Object.assign({ art: 'Verkauf', referenz: 'PG-100', titel: 'Philips Toaster', preis: 30, versand: 9, total: 39, kaeufer: 'k1', lieferart: 'Paket B-Post', datum: new Date(), id: 'm' + Math.random() }, o);
const zeile = (nr, art, ref, preis, versand, status) => [nr, art, 'Philips Toaster', ref, '24.10.2026 10:00', preis, versand, 'k4', 'Vera', 'Muster', 'Testweg  1', '3000', 'Bern', 'Paket B-Post', status || 'Offen'].join(';') + '\n';

/* ---------- Befund 2: später Verkauf auf vergebenes oder anders gebundenes Stück ---------- */
let S = sandbox();
S.listing(Object.assign({ 'PG-ID': 'PG-100', 'Status': 'Unverkauft', 'Entscheid unverkauft': 'Anderer Kanal', 'Ricardo-Link': L1 }, KOMPLETT));
let kt = S.karten(); S.c('mailWirkung_')(mail({ artikel: '1111111111', verkauf: '9001' }), kt, []); kt.schreiben();
ok(S.zeile('PG-100')['Status'] === 'Unverkauft' && /vergeben \(Entscheid «Anderer Kanal»\)/.test(S.pe('W-9001')['Text']), '2: Mail-Verkauf auf vergebenes Stück: kein «Verkauft», Hinweis W-…');
S = sandbox();
S.listing(Object.assign({ 'PG-ID': 'PG-100', 'Status': 'Unverkauft', 'Entscheid unverkauft': 'Entsorgung', 'Ricardo-Link': L1 }, KOMPLETT));
let imp = S.c('importVerkaeufe')(CSV_KOPF + zeile('9002', '1111111111', 'PG-100', 31, 9));
ok(S.zeile('PG-100')['Status'] === 'Unverkauft' && imp.import.warnungen === 1 && /vergeben \(Entscheid «Entsorgung»\)/.test(S.pe('W-9002')['Text']), '2: Bericht ebenso (entsorgtes Stück nicht still «Verkauft»)');
/* altes Bündel (unverkauft) verkauft sich spät, ein Teil ist inzwischen einzeln gelistet (Daten von vor dem 24.10.) */
S = sandbox();
S.listing({ 'PG-ID': 'PG-100', 'Status': 'Unverkauft', 'Bündel-IDs': 'PG-101', 'Bezeichnung': 'Set', 'Ricardo-Link': L1 });
S.listing({ 'PG-ID': 'PG-101', 'Status': 'Gelistet', 'Ricardo-Link': L2 });
kt = S.karten(); S.c('mailWirkung_')(mail({ artikel: '1111111111', verkauf: '7001' }), kt, []); kt.schreiben();
ok(S.L.d[1][1] === 'Unverkauft' && /PG-101 steht in einem anderen Listing \(Status «Gelistet»\)/.test(S.pe('W-7001')['Text']), '2: Teil anderswo gebunden: Hinweis statt «Verkauft»');
const L = S.c('L_COLS'), row = o => L.map(k => o[k] ?? '');
ok(/^Ablehnen: Stück ist vergeben/.test(S.c('empfehlung_')(row({ 'PG-ID': 'PG-1', 'Status': 'Unverkauft', 'Entscheid unverkauft': 'Entsorgung', 'Gelistet am': new Date(Date.now() - 6.5 * 864e5), 'Laufzeit Tage': 6 }), new Date())), '2: Preisvorschlag auf vergebenes Stück: «Ablehnen»');
kt = S.karten(); S.c('mailWirkung_')({ art: 'Preisvorschlag', artikel: '1111111111', titel: 'Set', betrag: 20, preis: 30, id: 'pv1', datum: new Date() }, kt, []); kt.schreiben();
ok(/^Ablehnen: PG-101 steht in einem anderen Listing/.test(S.pe('pv1')['Empfehlung']), '2: Preisvorschlag zum alten Bündel: «Ablehnen» mit Grund');

/* ---------- Befund 4: Bericht gleicht bekannte Verkäufe ab, Verkauf von Hand zuordnen ---------- */
S = sandbox();
S.listing(Object.assign({ 'PG-ID': 'PG-100', 'Status': 'Bereit' }, KOMPLETT));
kt = S.karten(); S.c('mailWirkung_')(mail({ artikel: '1111111111', verkauf: '9003', referenz: '', preis: 0, total: 9 }), kt, []); kt.schreiben();
ok(S.vz('9003')['PG-ID'] === '' && S.vz('9003')['Preis CHF'] === 0, '4: Mail-Verkauf ohne PG-ID und ohne Preis (Link noch nicht gespeichert)');
S.neu(); S.c("markiereGelistet('PG-100', '" + L1 + "')");
S.neu(); imp = S.c('importVerkaeufe')(CSV_KOPF + zeile('9003', '1111111111', 'PG-100', 30, 9));
let v = S.vz('9003'), z = S.zeile('PG-100');
ok(v['PG-ID'] === 'PG-100' && z['Status'] === 'Verkauft' && z['Verkauf-Nr'] === '9003' && imp.import.nachgetragen === 1, '4: Bericht trägt die PG-ID nach (sichere Zuordnung) und setzt das Listing auf «Verkauft»');
ok(v['Preis CHF'] === 30 && v['Total CHF'] === 39 && v['Provision CHF'] === 3.6 && v['Auszahlung CHF'] === 26.4 && imp.import.preise === 1 && z['Erzielter Preis CHF'] === 30, '4: Preis 0 aus der Mail durch den Bericht ersetzt (Total, Provision, Auszahlung)');
ok(v['Nachname'] === 'Muster' && imp.import.ergaenzt === 1, '4: Adresse wie bisher ergänzt');
S.neu(); S.c("setzeVerkauf('9003', 'gepackt')"); S.neu(); S.c("setzeVerkauf('9003', 'bezahlt')"); S.neu(); S.c("setzeVerkauf('9003', 'versendet')");
ok(S.zeile('PG-100')['Status'] === 'Versendet', '4: Versenden setzt das Listing auf «Versendet» (vorher blieb es «Gelistet»)');
S.neu(); imp = S.c('importVerkaeufe')(CSV_KOPF + zeile('9003', '1111111111', 'PG-100', 35, 9));
ok(S.vz('9003')['Preis CHF'] === 30 && /Verkaufsbericht weicht ab: Preis CHF 30\.00 im Tool, CHF 35\.00 im Bericht/.test(S.pe('WB-9003')['Text']), '4: abweichender Betrag: nichts überschrieben, Hinweis WB-…');
S.neu(); S.c('importVerkaeufe')(CSV_KOPF + zeile('9003', '1111111111', 'PG-100', 35, 9));
ok(S.PE.d.filter(r => r[0] === 'WB-9003').length === 1, '4: Hinweis nur einmal');
/* Verkauf ohne Zuordnung versendet: Hinweis */
S = sandbox();
S.verkauf({ 'Verkauf-Nr': '9010', 'Artikel-Nr': '5555555555', 'Status': 'Bereit zum Versand', 'Bezahlt am': new Date(), 'Titel': 'Lampe' });
S.c("setzeVerkauf('9010', 'versendet')");
ok(/keinem Listing zugeordnet/.test(S.pe('WV-9010')['Text']), '4: versendet ohne Zuordnung: Hinweis (sonst bliebe das Stück «Gelistet»)');
/* Admin «Verkauf zuordnen» */
S = sandbox();
S.listing(Object.assign({ 'PG-ID': 'PG-100', 'Status': 'Gelistet', 'Ricardo-Link': L1 }, KOMPLETT));
S.listing(Object.assign({ 'PG-ID': 'PG-101', 'Status': 'Unverkauft', 'Entscheid unverkauft': 'Entsorgung' }, KOMPLETT));
S.listing(Object.assign({ 'PG-ID': 'PG-102', 'Status': 'Verkauft', 'Verkauf-Nr': '8000' }, KOMPLETT));
S.verkauf({ 'Verkauf-Nr': '9011', 'Artikel-Nr': '1111111111', 'Status': 'Zu packen', 'Preis CHF': 30, 'Verkauft am': new Date(2026, 9, 23) });
S.verkauf({ 'Verkauf-Nr': '9012', 'Artikel-Nr': '9999999999', 'Status': 'Zu packen', 'Preis CHF': 20 });
S.verkauf({ 'Verkauf-Nr': '9013', 'PG-ID': 'PG-100', 'Status': 'Zu packen' });
wirft(() => S.c("adminVerkaufZuordnen(2, '9011', 'PG-101')"), /Zuordnung nicht möglich: Das Stück ist vergeben/, '4: Zuordnen auf vergebenes Stück abgelehnt');
wirft(() => S.c("adminVerkaufZuordnen(2, '9011', 'PG-102')"), /Zuordnung nicht möglich: Das Stück ist schon «Verkauft» \(Verkauf 8000\)/, '4: Zuordnen auf schon verkauftes Stück abgelehnt');
wirft(() => S.c("adminVerkaufZuordnen(4, '9013', 'PG-100')"), /schon PG-100 zugeordnet/, '4: schon zugeordnet');
wirft(() => S.c("adminVerkaufZuordnen(3, '9012', 'pg 0100')"), /^Bitte bestätigen: Verkauf 9012 \(Artikel-Nr 9999999999\) passt zu keinem Ricardo-Link von PG-100/, '4: Artikel-Nr passt nicht: Bestätigung (PG-ID normalisiert gefunden)');
S.c("adminVerkaufZuordnen(2, '9011', 'PG-100')");
ok(S.vz('9011')['PG-ID'] === 'PG-100' && S.zeile('PG-100')['Status'] === 'Verkauft' && S.zeile('PG-100')['Verkauf-Nr'] === '9011' && S.log(/Verkauf zugeordnet/), '4: zugeordnet: PG-ID am Verkauf, Listing «Verkauft»');
S.aktiv = 'andere@pretty-good.ch';
wirft(() => S.c("adminVerkaufZuordnen(3, '9012', 'PG-100', true)"), /Nur für Admins/, '4: nur für Admins');

/* ---------- Befund 15: Zurückschreiben prüft die Nummer in der Zeile, Kopfzeile geprüft ---------- */
S = sandbox();
S.verkauf({ 'Verkauf-Nr': '9020', 'Status': 'Zu packen' });
S.verkauf({ 'Verkauf-Nr': '9021', 'Status': 'Zu packen' });
S.listing({ 'PG-ID': 'PG-100', 'Status': 'Unverkauft', 'Ricardo-Link': 'https://www.ricardo.ch/de/a/t-3333333333/', 'Angelegt am': new Date(2026, 9, 1) });
S.listing({ 'PG-ID': 'PG-100', 'Status': 'Gelistet', 'Ricardo-Link': L1, 'Angelegt am': new Date(2026, 9, 10) });
kt = S.karten();
S.c('mailWirkung_')({ art: 'Bezahlt gemeldet', verkauf: '9021', id: 'b1', datum: new Date() }, kt, []);
S.c('mailWirkung_')(mail({ artikel: '1111111111', verkauf: '9022' }), kt, []);
/* jemand sortiert die Tabs von Hand, während der Lauf rechnet */
S.VK.d.splice(1, 0, S.VK.d.splice(2, 1)[0]);
S.L.d.splice(1, 0, S.L.d.splice(2, 1)[0]);
kt.schreiben();
ok(S.vz('9021')['Käufer meldet bezahlt am'] instanceof Date && !(S.vz('9020')['Käufer meldet bezahlt am'] instanceof Date), '15: Verkauf in die richtige Zeile geschrieben (nach Nummer gesucht)');
ok(S.L.d[1][1] === 'Verkauft' && S.L.d[2][1] === 'Unverkauft', '15: Listing mit gleicher PG-ID über «Angelegt am» gefunden');
S.verkauf({ 'Verkauf-Nr': '9030', 'Status': 'Zu packen' });
kt = S.karten(); S.c('mailWirkung_')({ art: 'Bezahlt gemeldet', verkauf: '9030', id: 'b2', datum: new Date() }, kt, []);
S.VK.d.pop();                                                                           // Zeile von Hand gelöscht
kt.schreiben();
ok(S.log(/Zeile verschoben/) && !S.VK.d.some(r => r[0] === '9030'), '15: Zeile nicht mehr da: nichts überschrieben, Eintrag im Log');
S = sandbox();
S.VK.d[0][2] = 'Stück-Nr';                                                              // Kopfzeile von Hand geändert
wirft(() => S.c('importVerkaeufe')(CSV_KOPF + zeile('9040', '1', '', 10, 0)), /Das Sheet passt nicht zu dieser Version \(Tab «Verkäufe»\)/, '15: Bericht prüft die Kopfzeile vor dem Schreiben');
S = sandbox();
S.PE.d.push(S.c('I_COLS').map(k => ({ 'ID': 'p1', 'Art': 'Preisvorschlag', 'Status': 'Offen', 'Frist': new Date(Date.now() - 3600e3) })[k] ?? ''));
S.PE.d.push(S.c('I_COLS').map(k => ({ 'ID': 'p2', 'Art': 'Frage', 'Status': 'Offen', 'Text': 'bleibt' })[k] ?? ''));
const geschrieben = []; const gr = S.PE.getRange; S.PE.getRange = (r, c, nr, nc) => { const x = gr(r, c, nr, nc), sv = x.setValues; x.setValues = v => { geschrieben.push([r, nr]); sv(v); }; return x; };
S.c('posteingangPflegen_')(S.PE);
ok(S.pe('p1')['Status'] === 'Abgelaufen' && geschrieben.length === 1 && geschrieben[0][0] === 2, '15: Posteingang: nur die geänderte Zeile zurückgeschrieben');

/* ---------- Befund 16: Schlüssel Order ID + Article ID, Blättern, unbekannte Mails ---------- */
S = sandbox();
S.listing(Object.assign({ 'PG-ID': 'PG-100', 'Status': 'Gelistet', 'Ricardo-Link': L1 }, KOMPLETT));
S.listing(Object.assign({ 'PG-ID': 'PG-101', 'Status': 'Gelistet', 'Ricardo-Link': L2 }, KOMPLETT));
imp = S.c('importVerkaeufe')(CSV_KOPF + zeile('9050', '1111111111', 'PG-100', 30, 9) + zeile('9050', '2222222222', 'PG-101', 8, 0));
ok(imp.import.neu === 2 && S.vz('9050')['PG-ID'] === 'PG-100' && S.vz('9050-2222222222')['PG-ID'] === 'PG-101' && S.zeile('PG-101')['Verkauf-Nr'] === '9050-2222222222', '16: zwei Artikel derselben Bestellung = zwei Verkäufe');
S.neu(); imp = S.c('importVerkaeufe')(CSV_KOPF + zeile('9050', '1111111111', 'PG-100', 30, 9) + zeile('9050', '2222222222', 'PG-101', 8, 0));
ok(imp.import.neu === 0 && imp.import.bekannt === 2 && S.VK.d.length === 3, '16: denselben Bericht nochmals: nichts doppelt');
S.neu(); const vz2 = S.c("alleVerkaeufe_()").filter(x => x['Verkauf-Nr'] === '9050-2222222222')[0];
ok(S.c('vZeile_')(vz2).link === 'https://www.ricardo.ch/de/my-ricardo/selling/order/9050/', '16: Link zu Ricardo mit der Order ID');
kt = S.karten();
ok(S.c('mailWirkung_')(mail({ artikel: '1111111111', verkauf: '9050' }), kt, []) === false && S.c('mailWirkung_')(mail({ artikel: '3333333333', verkauf: '9050', referenz: '' }), kt, []) === true, '16: Mail: gleicher Artikel bekannt, dritter Artikel derselben Bestellung neu');
/* Gmail: mehr als 100 Verläufe -> blättern; ganz voll -> Stand bleibt */
const thread = (d, betreff, i) => ({ getMessages: () => [{ getDate: () => d, getSubject: () => betreff, getPlainBody: () => '', getId: () => 'id' + i,
  getRawContent: () => 'Authentication-Results: mx.google.com; dkim=pass header.i=@mail.ricardo.ch\r\n\r\nx' }] });
S = sandbox();
S.PROPS.MAIL_KONTO = 'test@pretty-good.ch'; S.PROPS.MAIL_STAND = String(Date.now() - 600000);
const seiten = [];
S.gmail = (q, start, max) => { seiten.push([start, max, S.gesperrt]); return Array.from({ length: start < 200 ? 100 : 7 }, (x, i) => thread(new Date(), 'Newsletter Ricardo Herbst', start + i)); };
S.c('mailsLesen_()');
ok(seiten.length === 3 && seiten[2][0] === 200 && seiten.every(s => s[2] === 0), '16/10: Gmail geblättert (3 Seiten), ohne Sperre gelesen');
ok(S.logs.filter(r => r[2] === 'Ricardo-Mail unbekannt').length === 10, '16: unbekannte Ricardo-Betreffe im Log (höchstens 10 pro Lauf)');
const n0 = S.logs.length; S.c('mailsLesen_()');
ok(S.logs.slice(n0).filter(r => r[2] === 'Ricardo-Mail unbekannt').length === 0, '16: dieselbe Mail nur einmal gemeldet');
S = sandbox();
const stand = Date.now() - 600000;
S.PROPS.MAIL_KONTO = 'test@pretty-good.ch'; S.PROPS.MAIL_STAND = String(stand);
S.gmail = (q, start) => Array.from({ length: 100 }, (x, i) => thread(new Date(), 'Etwas', start + i));
S.c('mailsLesen_()');
ok(S.PROPS.MAIL_STAND === String(stand) && S.log(/Mehr als 500 Mail-Verläufe/), '16: Obergrenze erreicht: Stand bleibt stehen, Eintrag im Log');

/* ---------- Befund 10: lange Sperren ---------- */
S = sandbox();
S.sperreBesetzt = true;
wirft(() => S.c("aufgabeErledigt('x')"), /^Das Tool ist gerade beschäftigt \(eine andere Speicherung läuft noch\)\. Bitte gleich nochmals versuchen\.$/, '10: «Lock timeout» als verständliche Meldung');
ok(S.log(/Sperre besetzt/), '10: besetzte Sperre im Log');
wirft(() => S.c("api('en', 'aufgabeErledigt', ['x'])"), /^The tool is busy right now/, '10: auch englisch');
S.sperreBesetzt = false;
S.c("(function () { const l = sperre_(1000); l.releaseLock(); })()");
ok(S.flush >= 1 && S.gesperrt === 0, 'V1: vor dem Freigeben SpreadsheetApp.flush()');
S.c("Date = (function (D) { let t = 0; function X(a) { return a === undefined ? new D(D.now() + t) : new D(a); } X.now = function () { return D.now() + t; }; X.vor = function (ms) { t += ms; }; X.UTC = D.UTC; X.prototype = D.prototype; return X; })(Date)");
S.c("(function () { const l = sperre_(1000); Date.vor(31000); l.releaseLock(); })()");
ok(S.log(/Lange Sperre/), '10: Sperre über 30 s im Log');
/* Rückzahlungs-Mail erst nach der Sperre */
S = sandbox({ einst: { 'Rückzahlungen an': 'invoice@pretty-good.ch' } });
S.verkauf({ 'Verkauf-Nr': '9060', 'PG-ID': 'PG-100', 'Status': 'Bezahlt und versendet', 'Preis CHF': 40, 'Versand CHF': 9, 'Vorname': 'Vera', 'Nachname': 'Muster' });
const ret = S.c("retoureEroeffnen('9060', 'Defekt', '', 'CH93 0076 2011 6238 5295 7', 'Testweg 1')");
ok(ret.mail.ok && S.mails.length === 1 && S.mails[0].gesperrt === 0, '10: Mail an die Buchhaltung ausserhalb der Sperre');
/* Claude-Entwürfe ausserhalb der Sperre, Schreiben kurz gesperrt */
S = sandbox();
S.PROPS.ANTHROPIC_API_KEY = 'x';
S.PE.d.push(S.c('I_COLS').map(k => ({ ID: 'f1', Art: 'Frage', Status: 'Offen' })[k] ?? ''));
S.urlAntwort = () => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ content: [{ type: 'text', text: 'Ja, das Netzteil ist dabei.' }] }) });
S.c('entwuerfe_')(S.PE, [{ id: 'f1', text: 'Netzteil?', von: 'k', L: null, verkauf: '', k: { vRows: [], neuV: [] } }]);
ok(S.fetch.length === 1 && S.fetch[0].gesperrt === 0 && S.pe('f1')['Entwurf'] === 'Ja, das Netzteil ist dabei.', '10: Claude ohne Sperre gefragt, Entwurf in die Zeile mit derselben ID');
/* ANALYSE TOOL nie in der Sperre öffnen */
S = sandbox();
S.listing(Object.assign({ 'PG-ID': 'PG-300', 'Status': 'In Arbeit', 'Quelle Tab': 'Analyse', 'Titel': 'x' }, { 'Startpreis CHF': 90 }));
S.listing({ 'PG-ID': 'PG-301', 'Status': 'Unverkauft', 'Bezeichnung': 'x' });
S.externInSperre = 0;
S.c("textAusAnalyse_('PG-300')"); S.neu(); S.c("entscheidUnverkauft('PG-301', 'Anderer Kanal')");
ok(!S.externInSperre, '10: Text aus der Analyse und Entscheid lesen das ANALYSE TOOL ausserhalb der Sperre');
S = sandbox();
S.listing({ 'PG-ID': 'PG-300', 'Status': 'In Arbeit', 'Quelle Tab': 'Analyse', 'Bündel-IDs': 'PG-101', 'Bündel-Inhalt': 'Stihl\nKabel', 'Startpreis CHF': 98, 'Neupreis CHF': 215 });
S.externInSperre = 0; const bl = S.c("buendelLeeren('PG-300')");
ok(!S.externInSperre && bl.startpreis === '90.00' && bl.analyse, '10: Bündel auflösen liest Analyse und Return Tool ausserhalb der Sperre');

/* ---------- Befund 22: Bank-Abgleich zeigt Gutschriften ohne Treffer ---------- */
S = sandbox();
const ba = S.c('bankAbgleichRechnen_')([{ datum: '2026-10-20', text: 'Unbekannte Zahlung Meier', betrag: 12.5, auftrag: 'A9' }, { datum: '2026-10-20', text: 'Belastung', betrag: -3 }], []);
ok(ba.ohneTreffer.length === 1 && ba.ohneTreffer[0].betrag === '12.50' && /Meier/.test(ba.ohneTreffer[0].text), '22: Gutschrift ohne Treffer in der Liste (nicht nur als Zahl)');

/* ---------- Prüfung Z10: Packliste zeigt das Regal, Return-Tool-Ort nur als Hinweis ---------- */
S = sandbox();
const vzZ = st => S.c('vZeile_')({ 'Verkauf-Nr': '1', 'Status': st, 'Lagerort': 'TEC-1', 'Total CHF': 1, 'Preis CHF': 1 });
ok(vzZ('Zu packen').lagerort === 'Ricardo Online' && vzZ('Zu packen').rtOrt === 'TEC-1', 'Z10: zu packen: Regal «Ricardo Online», TEC-1 nur als Hinweis');
ok(vzZ('Wartet auf Zahlung').lagerort === 'Ricardo Unpaid' && vzZ('Bereit zum Versand').lagerort === 'Ricardo Unpaid', 'Z10: gepackt: Rollcontainer «Ricardo Unpaid»');

/* ---------- Vertrag V2: Zeilen reichen nicht ---------- */
S = sandbox();
S.listing(Object.assign({ 'PG-ID': 'PG-100', 'Status': 'Gelistet', 'Ricardo-Link': L1 }, KOMPLETT));
S.VK.maxRows = 1;                                                                      // Tab hat keine freien Zeilen mehr
S.c('importVerkaeufe')(CSV_KOPF + zeile('9070', '1111111111', 'PG-100', 30, 9));
ok(S.VK.eingefuegt === 1 && S.vz('9070')['PG-ID'] === 'PG-100', 'V2: vor dem Anhängen Zeilen eingefügt');

h.ende();
