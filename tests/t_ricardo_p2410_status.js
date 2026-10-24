/* Ricardo Tool, Prüfung 24.10.2026: Befunde 1, 5, 6, 7, 8, 11, 12, 18, 19, 21, 23 und Zusatz E1 (Etikette ZPL). Erfundene Daten. Lauf: node tests/t_ricardo_p2410_status.js */
const h = require('./t_ricardo_p2410_hilfe.js');
const { sandbox, ok, wirft, KOMPLETT, CSV_KOPF, ana, rtTab } = h;
const L1 = 'https://www.ricardo.ch/de/a/toaster-1111111111/', L2 = 'https://www.ricardo.ch/de/a/toaster-2222222222/';

/* ---------- Befund 1: «Gelistet» nur aus «In Arbeit»/«Bereit», derselbe Link nochmals = zweiter Klick ---------- */
let S = sandbox();
['Verkauft', 'Versendet', 'Abgebrochen', 'Retourniert'].forEach(function (st) {
  S = sandbox();
  S.listing(Object.assign({ 'PG-ID': 'PG-100', 'Status': st, 'Verkauf-Nr': '9001', 'Ricardo-Link': L1 }, KOMPLETT));
  wirft(() => S.c("markiereGelistet('PG-100', '" + L2 + "')"), new RegExp('ist «' + st + '» und kann nicht als gelistet gespeichert werden'), '1: aus «' + st + '» kein «Gelistet»');
  ok(S.zeile('PG-100')['Status'] === st && S.zeile('PG-100')['Ricardo-Link'] === L1, '1: Status und Link bleiben (' + st + ')');
});
S = sandbox();
const vorher = new Date(2026, 9, 20, 10, 0);
S.listing(Object.assign({ 'PG-ID': 'PG-100', 'Status': 'Gelistet', 'Ricardo-Link': L1, 'Gelistet am': vorher, 'Laufzeit Tage': 6 }, KOMPLETT));
let r = S.c("markiereGelistet('PG-100', 'https://ricardo.ch/de/a/toaster-1111111111?utm_source=app', 9)");
ok(r.status === 'Gelistet' && S.zeile('PG-100')['Gelistet am'] === vorher && S.zeile('PG-100')['Laufzeit Tage'] === 6 && !S.log(/^Gelistet/), '1: zweiter Klick (gleiche Artikel-Nr, andere Schreibweise) ändert nichts');
wirft(() => S.c("markiereGelistet('PG-100', '" + L2 + "')"), /^Bitte bestätigen: PG-100 ist schon mit dem Ricardo-Link .*Link ersetzen/, '1 (Nach-Review 5): schon gelistet, anderer Link: nur mit Rückfrage (sonst zwei Angebote live)');
S = sandbox();
S.listing(Object.assign({ 'PG-ID': 'PG-100', 'Status': 'Bereit', 'Ricardo-Link': L1, 'Entscheid unverkauft': 'Neu listen' }, KOMPLETT));
r = S.c("markiereGelistet('PG-100', '" + L2 + "?utm_campaign=20261024#x')");
ok(r.status === 'Gelistet' && S.zeile('PG-100')['Ricardo-Link'] === L2 && S.zeile('PG-100')['Frühere Links'] === L1 && S.zeile('PG-100')['Entscheid unverkauft'] === '', '1/6: aus «Bereit» gelistet, Link ohne Zusatz gespeichert, alter Link in «Frühere Links»');

/* ---------- Befund 6: strenge Link-Prüfung, Doppel über die Artikel-Nr ---------- */
ok(S.c("artikelAusLink_('https://www.ricardo.ch/de/a/toaster-1111111111/?utm_campaign=20261024')") === '1111111111', '6: Artikel-Nr nicht aus dem Zusatz');
ok(S.c("artikelAusLink_('https://www.ricardo.ch/de/a/1332228520')") === '1332228520' && S.c("artikelAusLink_('https://www.ricardo.ch/fr/a/neu-teufel-real-blue-nc-3-1332227154/')") === '1332227154', '6: Links ohne Titel und andere Sprache');
ok(S.c("artikelAusLink_('https://www.ricardo.ch/de/my-ricardo/selling/order/123456789/')") === '' && S.c("artikelAusLink_('https://www.ricardo.ch/de/list/?prefill=1111111111')") === '', '6: Bestellung und Formular sind keine Angebote');
S = sandbox();
S.listing(Object.assign({ 'PG-ID': 'PG-100', 'Status': 'Gelistet', 'Ricardo-Link': L1 }, KOMPLETT));
S.listing(Object.assign({ 'PG-ID': 'PG-101', 'Status': 'Bereit' }, KOMPLETT));
S.listing(Object.assign({ 'PG-ID': 'PG-102', 'Status': 'Unverkauft', 'Entscheid unverkauft': 'Anderer Kanal', 'Ricardo-Link': 'https://www.ricardo.ch/de/a/x-3333333333/', 'Frühere Links': 'https://www.ricardo.ch/de/a/x-4444444444/' }, KOMPLETT));
wirft(() => S.c("markiereGelistet('PG-101', 'https://ricardo.ch/de/a/toaster-1111111111/?utm_source=app')"), /bereits bei PG-100 hinterlegt/, '6: derselbe Artikel in anderer Schreibweise abgelehnt');
wirft(() => S.c("markiereGelistet('PG-101', 'https://www.ricardo.ch/de/a/toaster-1111111111')"), /bereits bei PG-100/, '6: ohne Schrägstrich ebenso');
wirft(() => S.c("markiereGelistet('PG-101', 'https://www.ricardo.ch/de/a/x-4444444444/')"), /bereits bei PG-102/, '6: auch frühere Links anderer Stücke zählen');
wirft(() => S.c("markiereGelistet('PG-101', 'https://www.ricardo.ch/de/list/?prefill=5555555555')"), /kein gültiger Ricardo-Angebotslink/, '6: Formular-Link abgelehnt');
wirft(() => S.c("markiereGelistet('PG-101', 'https://www.ricardo.ch/de/my-ricardo/selling/order/123456789/')"), /kein gültiger Ricardo-Angebotslink/, '6: Bestell-Link abgelehnt');
wirft(() => S.c('markiereGelistet')('PG-101', "https://www.ricardo.ch/de/a/x-1234567');alert(document.domain);('"), /kein gültiger Ricardo-Angebotslink/, '6/13: Link mit Anführungszeichen und Code abgelehnt');
wirft(() => S.c("markiereGelistet('PG-101', 'https://www.ricardo.ch.evil.com/de/a/x-1234567/')"), /kein gültiger Ricardo-Angebotslink/, '6: fremde Domain abgelehnt');
ok(S.zeile('PG-101')['Status'] === 'Bereit', '6: nichts gespeichert');

/* ---------- Befund 5: Admin-Löschen mit Statusprüfung ---------- */
S = sandbox();
['Gelistet', 'Verkauft', 'Versendet', 'Retourniert', 'Bereit', 'Unverkauft'].forEach(st => S.listing({ 'PG-ID': 'PG-' + st, 'Status': st }));
['Gelistet', 'Verkauft', 'Versendet', 'Retourniert'].forEach(function (st) {
  const z = S.L.d.findIndex(r => r[0] === 'PG-' + st) + 1;
  wirft(() => S.c("adminLoescheListing(" + z + ", 'PG-" + st + "')"), new RegExp('ist «' + st + '» und lässt sich nicht löschen'), '5: Listing «' + st + '» nicht löschbar');
});
let z = S.L.d.findIndex(r => r[0] === 'PG-Bereit') + 1; S.c("adminLoescheListing(" + z + ", 'PG-Bereit')");
z = S.L.d.findIndex(r => r[0] === 'PG-Unverkauft') + 1; S.c("adminLoescheListing(" + z + ", 'PG-Unverkauft')");
ok(!S.L.d.some(r => r[0] === 'PG-Bereit' || r[0] === 'PG-Unverkauft') && S.L.d.length === 5, '5: «Bereit» und freie Status löschbar');
S = sandbox();
S.listing({ 'PG-ID': 'PG-100', 'Status': 'Versendet', 'Verkauf-Nr': '9004' });
S.listing({ 'PG-ID': 'PG-101', 'Status': 'Verkauft', 'Verkauf-Nr': '9005', 'Entscheid unverkauft': 'Neu listen' });
S.verkauf({ 'Verkauf-Nr': '9004', 'PG-ID': 'PG-100', 'Status': 'Bezahlt und versendet', 'Bezahlt am': new Date(), 'Preis CHF': 30 });
S.verkauf({ 'Verkauf-Nr': '9006', 'PG-ID': 'PG-102', 'Status': 'Wartet auf Zahlung', 'Bezahlt am': new Date() });
S.verkauf({ 'Verkauf-Nr': '9005', 'PG-ID': 'PG-101', 'Status': 'Zu packen', 'Strasse': 'Testweg' });
S.verkauf({ 'Verkauf-Nr': '9007', 'Status': 'Storniert' });
wirft(() => S.c("adminLoescheVerkauf(2, '9004')"), /ist bezahlt und versendet\. Storno nur über eine Retoure/, '5: bezahlt und versendet: kein Storno');
ok(S.zeile('PG-100')['Status'] === 'Versendet' && S.vz('9004')['Status'] === 'Bezahlt und versendet', '5: nichts geändert');
wirft(() => S.c("adminLoescheVerkauf(3, '9006')"), /ist bezahlt/, '5: bezahlt, noch nicht versendet: auch nur über Retoure');
wirft(() => S.c("adminLoescheVerkauf(5, '9007')"), /schon storniert/, '5: schon storniert');
S.c("adminLoescheVerkauf(4, '9005')");
ok(S.vz('9005')['Status'] === 'Storniert' && S.vz('9005')['Strasse'] === '' && S.zeile('PG-101')['Status'] === 'Storniert' && S.zeile('PG-101')['Entscheid unverkauft'] === '', '5: unbezahlt storniert, Stück wartet auf den Entscheid');
const ad = S.c("adminSuche('')");
ok(ad.verkaeufe.find(v => v.nr === '9004').storno === false && ad.verkaeufe.find(v => v.nr === '9006').storno === true && ad.listings.find(l => l.id === 'PG-100').loeschbar === false, '5: adminSuche sagt der Oberfläche, was löschbar ist');

/* ---------- Befund 7: «Unverkauft» ohne Entscheid nicht neu starten ---------- */
S = sandbox();
S.listing(Object.assign({ 'PG-ID': 'PG-100', 'Status': 'Unverkauft', 'Ricardo-Link': L1 }, KOMPLETT));
S.listing({ 'PG-ID': 'PG-300', 'Status': 'Storniert', 'Bezeichnung': 'Stihl GTA 26', 'Quelle Tab': 'Analyse' });
S.listing({ 'PG-ID': 'PG-500', 'Status': 'Unverkauft', 'Bündel-IDs': 'PG-101', 'Bezeichnung': 'Set' });
r = S.c("suche('PG-100')");
ok(r.treffer[0].status === 'Unverkauft' && r.treffer[0].entscheidOffen === true, '7: Suche zeigt «Unverkauft», Entscheid offen (kein «Listen»)');
wirft(() => S.c("starteListing('PG-100')"), /ist «Unverkauft» und noch keinen Entscheid hat\. Zuerst entscheiden/, '7: Start gesperrt');
wirft(() => S.c("starteListing('PG-300')"), /ist «Storniert» und noch keinen Entscheid/, '7: «Storniert» ohne Entscheid ebenso');
wirft(() => S.c("starteListing('PG-101')"), /gehört zum Bündel PG-500, das «Unverkauft» ist/, '7: Teil eines Bündels ohne Entscheid');
ok(!S.c('analyseListe()').some(x => x.id === 'PG-300'), '7: nicht in «Aus der Analyse»');
S.listing({ 'PG-ID': 'PG-400', 'Status': 'In Arbeit', 'Bezeichnung': 'X', 'Startpreis CHF': 10, 'Quelle Tab': 'Online' }); S.neu();
wirft(() => S.c("buendelHinzu('PG-400', 'PG-100')"), /noch keinen Entscheid/, '7: auch nicht bündeln');
S.neu(); S.c("entscheidUnverkauft('PG-100', 'Neu listen')");
ok(S.L.d.filter(r => r[0] === 'PG-100').length === 1 && S.zeile('PG-100')['Status'] === 'Bereit', '7: «Neu listen» auf derselben Zeile, keine zweite');
S.neu(); ok(S.c("starteListing('PG-100')").status === 'Bereit', '7: danach weiter bearbeiten');
/* alte Daten: «Leiche» neben einer neueren Zeile erscheint nicht mehr unter «nicht verkauft» */
S = sandbox();
S.listing({ 'PG-ID': 'PG-100', 'Status': 'Unverkauft', 'Bezeichnung': 'alt', 'Ricardo-Link': L1, 'Angelegt am': new Date(2026, 9, 1) });
S.listing({ 'PG-ID': 'PG-100', 'Status': 'Gelistet', 'Bezeichnung': 'neu', 'Ricardo-Link': L2, 'Angelegt am': new Date(2026, 9, 10) });
S.listing({ 'PG-ID': 'PG-101', 'Status': 'Unverkauft', 'Bezeichnung': 'Kabel' });
let f = S.c("ablauf('schicht1')");
ok(!f.unverkauft.some(x => x.id === 'PG-100') && f.unverkauft.some(x => x.id === 'PG-101'), '7: abgelöste alte Zeile nicht mehr in «nicht verkauft»');
ok(S.c('listingsIndex_()')['PG-100'].status === 'Gelistet', '7: Index: die laufende Zeile zählt, egal in welcher Reihenfolge');

/* ---------- Befund 8: Retoure «Defekt» + «Neu listen» ---------- */
S = sandbox();
S.listing(Object.assign({ 'PG-ID': 'PG-300', 'Status': 'Retourniert', 'Verkauf-Nr': '9001' }, KOMPLETT, { 'Quelle Tab': 'Analyse', 'Titel': 'Stihl', 'Beschrieb': 'Text' }));
S.retoure({ 'Retoure-Nr': 'RT-0001', 'Status': 'Offen', 'PG-ID': 'PG-300', 'Grund': 'Defekt', 'Preis CHF': 40, 'Versand CHF': 9, 'Rückzahlung am': new Date(), 'Ricardo storniert am': new Date() });
wirft(() => S.c("retoureSchritt('RT-0001', 'entscheid', 'Neu listen')"), /^Bitte bestätigen: RT-0001 kam als «Defekt» zurück/, '8: «Defekt» + «Neu listen» nur mit Bestätigung');
ok(S.zeile('PG-300')['Status'] === 'Retourniert', '8: ohne Bestätigung nichts');
S.neu(); S.c("retoureSchritt('RT-0001', 'entscheid', 'Neu listen', true)");
let zl = S.zeile('PG-300');
ok(zl['Status'] === 'In Arbeit' && zl['Getestet'] === '' && zl['Titel'] === '' && zl['Beschrieb'] === '' && zl['Quelle Tab'] === 'Retoure' && zl['Entscheid unverkauft'] === 'Neu listen', '8: neu prüfen und neu beschreiben, nicht mehr gesperrt wie Analyse');
r = S.c("lade('PG-300')");
ok(!r.analyse && r.fehlt.indexOf('Produkt prüfen und «geprüft» bestätigen') !== -1, '8: Listing verlangt neue Prüfung');
S = sandbox();
S.listing(Object.assign({ 'PG-ID': 'PG-100', 'Status': 'Retourniert' }, KOMPLETT));
S.retoure({ 'Retoure-Nr': 'RT-0002', 'Status': 'Offen', 'PG-ID': 'PG-100', 'Grund': 'Transportschaden', 'Preis CHF': 40, 'Versand CHF': 9, 'Rückzahlung am': new Date(), 'Ricardo storniert am': new Date() });
S.c("retoureSchritt('RT-0002', 'entscheid', 'Neu listen')");
ok(S.zeile('PG-100')['Status'] === 'In Arbeit' && S.zeile('PG-100')['Getestet'] === '' && S.zeile('PG-100')['Quelle Tab'] === 'Online', '8: anderer Grund ohne Bestätigung, aber auch neu prüfen');

/* ---------- Befund 11: Zahlen robust lesen, Einstellung prüfen ---------- */
S = sandbox();
const z_ = x => S.c('zahl_(' + JSON.stringify(x) + ')');
ok(z_('12,5') === 12.5 && z_('12 %') === 12 && z_("1'234.50") === 1234.5 && z_('1.234,50') === 1234.5 && z_('1,234.50') === 1234.5 && z_('CHF 9.–') === 9 && z_('abc') === 0 && z_(7) === 7, '11: zahl_ liest Komma, %, Tausendertrenner');
S = sandbox({ einst: { 'Provision %': '12,5' } });
S.listing({ 'PG-ID': 'PG-100', 'Status': 'Gelistet', 'Bezeichnung': 'Toaster', 'Ricardo-Link': L1 });
S.c('importVerkaeufe')(CSV_KOPF + '9001;1111111111;Toaster;PG-100;24.10.2026 10:00;90;9;k;Vera;Muster;Testweg  1;3000;Bern;Paket B-Post;Offen\n');
ok(S.vz('9001')['Provision CHF'] === 11.25 && S.vz('9001')['Auszahlung CHF'] === 78.75, '11: «12,5» ergibt Provision 11.25 (nicht 0)');
S = sandbox({ einst: { 'Provision %': '12 %', 'Admins': '' } });
ok(S.c('provision_()') === 0.12, '11: «12 %» = 12 %');
S.c("adminSpeichereEinstellungen({ 'Provision %': '12,5', 'Laufzeit Tage': '7' })");
ok(S.E.d.find(r => r[0] === 'Provision %')[1] === '12.5' && S.E.d.find(r => r[0] === 'Laufzeit Tage')[1] === '7', '11: beim Speichern einheitlich abgelegt');
wirft(() => S.c("adminSpeichereEinstellungen({ 'Provision %': 'zwölf' })"), /«Provision %» muss eine Zahl von 0 bis 50 sein/, '11: Text statt Zahl abgelehnt');
wirft(() => S.c("adminSpeichereEinstellungen({ 'Laufzeit Tage': '45' })"), /«Laufzeit Tage» muss eine Zahl von 1 bis 30 sein/, '11: ausserhalb des Bereichs abgelehnt');
S = sandbox({ einst: { 'Provision %': '120' } });
ok(S.c('provision_()') === 0 && S.log(/Provision %» ist ungültig/), '11: ungültige Provision von Hand: 0 und Eintrag im Log (nicht still)');

/* ---------- Befund 12: Kennzahlen wie Wochenübersicht (Retourniert raus) ---------- */
S = sandbox();
const V = S.c('V_COLS'), vk = st => { const x = {}; V.forEach(k => x[k] = ''); return Object.assign(x, { 'Verkauf-Nr': 'n' + st, 'Verkauft am': new Date(2026, 9, 20), 'Status': st, 'Preis CHF': 100, 'Auszahlung CHF': 88 }); };
const kz = S.c('kennzahlenRechnen_')([], [vk('Bezahlt und versendet'), vk('Retourniert'), vk('Storniert')], [], new Date(2026, 9, 24).getTime(), '', '', 6, 0);
ok(kz.zeitraum.umsatz === 100 && kz.zeitraum.auszahlung === 88 && kz.zeitraum.verkaeufe === 1 && kz.zeitraum.storniert === 1 && kz.zeitraum.retourniert === 1, '12: Umsatz ohne Retouren und Stornos (wie Wochenübersicht)');

/* ---------- Befund 19: Bündel = ein aktives Angebot ---------- */
S = sandbox();
S.listing({ 'PG-ID': 'PG-1', 'Status': 'Gelistet', 'Bündel-IDs': 'PG-2, PG-3, PG-4' });
S.listing({ 'PG-ID': 'PG-9', 'Status': 'Gelistet' });
ok(S.c('zaehleAktive_()') === 2, '19: Bündel mit 3 Teilen + Einzelstück = 2 aktive Angebote');

/* ---------- Befund 21: Funktionen für Editor und Auslöser, Admin bei leerer Liste ---------- */
S = sandbox();
ok(S.c("typeof uiTempo") === 'undefined' && S.c("typeof uiTempo_") === 'function', '21: uiTempo nur noch als uiTempo_ (nicht direkt aufrufbar)');
ok(S.c("api('de', 'uiTempo', [[{ n: 'suche', anzahl: 1, median: 900, max: 900 }]])") === true && S.log(/Tempo UI/), '21: über api() geht es weiter');
S.aktiv = 'mitarbeiterin@pretty-good.ch';
wirft(() => S.c('einrichten()'), /nur im Apps-Script-Editor oder als Auslöser/, '21: einrichten über die Web-App (andere Person) gesperrt');
wirft(() => S.c('postAdresseTest()'), /nur im Apps-Script-Editor/, '21: postAdresseTest gesperrt');
wirft(() => S.c('postTest()'), /nur im Apps-Script-Editor/, '21: postTest gesperrt');
S.oeffnen = 0; S.c('suchVorrat()');
ok(S.oeffnen === 0, '21: suchVorrat über die Web-App tut nichts');
S.gmail = () => { throw new Error('darf nicht lesen'); }; S.PROPS.MAIL_KONTO = 'test@pretty-good.ch';
S.c('mailsAbholen()'); ok(true, '21: mailsAbholen über die Web-App tut nichts');
ok(S.c('istAdmin_()') === false, '21: leere Admin-Liste: andere Person ist kein Admin');
S.aktiv = 'test@pretty-good.ch';
ok(S.c('istAdmin_()') === true, '21: leere Admin-Liste: der Besitzer ist Admin');
S.aktiv = 'mitarbeiterin@pretty-good.ch'; S.E.d.push(['Admins', 'Mitarbeiterin@pretty-good.ch']); S.c('cfgVergessen_()'); S.neu();
ok(S.c('istAdmin_()') === true, '21: eingetragene Adresse ist Admin');

/* ---------- Befund 23: Format-Kennung im Zwischenspeicher ---------- */
S = sandbox();
S.CACHE['rt:Online:n'] = '1'; S.CACHE['rt:Online:0'] = 'kaputt-alt';
r = S.c("suche('Toaster')");
ok(r.treffer.length === 1 && S.CACHE['rt1:Online:n'] && S.c('RT_FORMAT') === 'rt1:', '23: alte Kopien ohne Format-Kennung werden nicht gelesen, neue mit «rt1:»');

/* ---------- Befund 18 und Zusatz E1: Etikette ---------- */
S = sandbox();
S.verkauf({ 'Verkauf-Nr': '9001', 'PG-ID': 'PG-100', 'Status': 'Zu packen', 'Nachname': 'Muster', 'PLZ': '3000', 'Ort': 'Bern', 'Strasse': 'Testweg', 'Hausnummer': '1', 'Lieferart': 'Paket B-Post' });
S.verkauf({ 'Verkauf-Nr': '9002', 'PG-ID': 'PG-101', 'Status': 'Zu packen', 'Nachname': 'Beispiel', 'PLZ': '3000', 'Ort': 'Bern', 'Sendungsnummer': '99.00.1', 'Lieferart': 'Paket B-Post' });
let anfragen = [];
S.ctx.ANFRAGEN = anfragen;
S.c("postEtiketteAnfrage_ = function (a) { ANFRAGEN.push(a); if (ANFRAGEN.danach) ANFRAGEN.danach(); return { sendungsnummer: '99.60.' + ANFRAGEN.length, daten: 'XlhBXkZPNTBeRlNeWFo=', typ: String(a.labelDefinition.imageFileType).indexOf('ZPL') === 0 ? 'zpl' : 'pdf', pdf: '', warnungen: '' }; }");
/* Nach-Review 24.10.2026 (1): Vorgabe PDF; ZPL nur mit Einstellung «ZPL» UND wenn die Seite ZPL kann */
const ld = S.c("postAnfrage_({ id: 'x', nachname: 'M', plz: '3000', ort: 'Bern' }, false, true)").labelDefinition;
ok(ld.imageFileType === 'PDF' && ld.imageResolution === 300, 'E1/NR1: Vorgabe PDF, auch wenn die Einstellung fehlt');
S.E.d.push(['Etiketten-Format', 'ZPL']); S.neu(); S.c('cfgVergessen_()');
ok(S.c("postAnfrage_({ id: 'x', nachname: 'M', plz: '3000', ort: 'Bern' }, false, true)").labelDefinition.imageFileType === 'ZPL2', 'E1: Einstellung ZPL und Seite kann ZPL: ZPL2, 200 dpi');
ok(S.c("postAnfrage_({ id: 'x', nachname: 'M', plz: '3000', ort: 'Bern' }, false)").labelDefinition.imageFileType === 'PDF', 'NR1: Seite ohne Angabe (alte Seite): PDF, auch bei Einstellung ZPL');
let e = S.c("etikette('9001', false, false, ['zpl', 'pdf'])");
ok(e.typ === 'zpl' && e.daten === 'XlhBXkZPNTBeRlNeWFo=' && e.name === 'Etikette 9001.zpl2' && e.sendung === '99.60.1' && S.vz('9001')['Sendungsnummer'] === '99.60.1', 'E1: Etikette als ZPL-Datei, Sendungsnummer gespeichert');
wirft(() => S.c("etikette('9002')"), /^Bitte bestätigen: Für PG-101 gibt es schon eine Etikette \(Sendung 99\.00\.1\)/, '18: zweite Etikette nur mit Bestätigung');
ok(anfragen.length === 1, '18: ohne Bestätigung keine Anfrage an die Post');
S.CACHE['etikette:9001'] = '1';
wirft(() => S.c("etikette('9001', false, true)"), /wird gerade eine Etikette erstellt/, '18: läuft schon eine Etikette (Doppelklick, zweite Person): keine zweite');
delete S.CACHE['etikette:9001'];
anfragen.danach = () => { S.VK.d.splice(1, 0, S.c('V_COLS').map((k, i) => i === 0 ? '8000' : '')); anfragen.danach = null; };   // jemand sortiert während der Post-Anfrage
S.neu(); e = S.c("etikette('9002', false, true)");
ok(S.vz('9002')['Sendungsnummer'] === e.sendung && S.vz('8000')['Sendungsnummer'] === '' && S.log(/Etikette ersetzt/), '18: gespeichert in der Zeile, die jetzt diese Verkauf-Nr hat; Ersatz im Log');
ok(!S.CACHE['etikette:9002'], '18: Merker danach frei');
S = sandbox({ einst: { 'Etiketten-Format': 'PDF' } });
const ld2 = S.c("postAnfrage_({ id: 'x', nachname: 'M', plz: '3000', ort: 'Bern' }, true)").labelDefinition;
ok(ld2.imageFileType === 'PDF' && ld2.imageResolution === 300 && ld2.printPreview === true, 'E1: Einstellung «PDF» wie bisher');
/* Antwort der Barcode API: Etikett base64 in item.label[0], auch bei ZPL (ohne echten Post-Aufruf) */
S = sandbox();
S.CACHE['post-token-DCAPI_BARCODE_READ'] = 'tok';
S.urlAntwort = () => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ item: { identCode: '99.60.7', label: ['XlhBXlha'], warnings: null } }) });
S.E.d.push(['Etiketten-Format', 'ZPL']); S.neu(); S.c('cfgVergessen_()');
const pe = S.c("postEtiketteAnfrage_(postAnfrage_({ id: 'x', nachname: 'M', plz: '3000', ort: 'Bern' }, true, true))");
ok(pe.typ === 'zpl' && pe.daten === 'XlhBXlha' && pe.sendungsnummer === '99.60.7' && pe.pdf === '' && S.fetch.length === 1 && /generateAddressLabel/.test(S.fetch[0].url), 'E1: ZPL-Antwort ausgewertet (gestubbt, kein Netz)');
ok(S.E.d.length > 0 && S.c("DEFAULTS.some(function (d) { return d[0] === 'Etiketten-Format' && d[1] === 'PDF'; })"), 'E1/NR1: «einrichten» legt die Einstellung «Etiketten-Format» mit PDF an');

h.ende();
