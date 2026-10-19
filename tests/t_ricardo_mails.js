// Ricardo-Mails: Erkennen, Echtheit, Wirkung auf Verkäufe/Listings/Posteingang, Aufgaben. Aufbau der Mails wie echt (Okt 2026), Namen erfunden.
const fs = require('fs'), vm = require('vm');
const src = fs.readFileSync(__dirname + '/../apps/ricardo/Code.gs', 'utf8');
const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exit(1); } };

const VERKAUF = `Hallo Jonas,
Glückwunsch, du hast den Artikel verkauft. Warte auf die Zahlung.
.......................

Neu: Testgerät Babyphone
Artikel-Nr.: 1332228520
Verkaufs-Nr.: 54006286
Referenz-Nr.: PG-1001

.....................................................................
Preis: 1 × 90.00
Paket B-Post: 9.00
Total: 99.00

.....................................................................
Verkauft an: kaeufer_a
https://www.ricardo.ch/de/shop/kaeufer_a/ratings/`;
const BEZAHLT = `Hallo Jonas,
Der Käufer hat angegeben, bezahlt zu haben. Überprüfe es, bevor du den Artikel verschickst.
.......................

Neu: Testgerät Babyphone
Artikel-Nr.: 1332228520
Verkaufs-Nr.: 54006286
Referenz-Nr.: PG-1001`;
const FRAGE = `Hallo Jonas

.....................................................................

kaeufer_b hat eine Frage zu deinem Angebot:

  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

Neu: Soundkarte X
Artikelnummer: 1331877810
nullnull

Aktuelles Gebot: CHF 82.-
nullnull

https://www.ricardo.ch/de/a/1331877810?utm_source=25_de

.....................................................................

.....................................................................

kaeufer_b fragt:

Guten Tag.
Ist das Netzteil dabei?

BEANTWORTE DIESE FRAGE
https://www.ricardo.ch/de/a/1331877810?utm_campaign=rtm_core`;
const NACHRICHT = `Hallo,
Du hast eine neue Nachricht erhalten
.......................

SUP-Board-Set Rot
Artikel-Nr.: 1331786830
Verkaufs-Nr.: 53990997

.....................................................................

kaeufer_c hat dir eine neue Nachricht geschickt. Öffne Nachrichten, um die Unterhaltung fortzusetzen.

In Nachrichten antworten

https://www.ricardo.ch/de/my-ricardo/messages/?conversationId=abc&orderId=53990997&orderMode=selling&utm_campaign=rtm_core&utm_content=body_cta`;
/* Frist immer zwei Tage in der Zukunft, sonst veraltet der Test (fest «18. Oktober» schlug ab 19.10.2026 fehl) */
const FRIST_D = new Date(Date.now() + 2 * 864e5), FRIST_TXT = FRIST_D.getDate() + '. ' + ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'][FRIST_D.getMonth()] + ' ' + FRIST_D.getFullYear();
const ANGEBOT = `Hallo Jonas,

Du hast einen Preisvorschlag von CHF 75.00 erhalten. Du hast nun 48 Stunden Zeit, um diesen anzunehmen oder abzulehnen.

.....................................................................

Neu: Haartrockner Z
Preis: 87.00

.....................................................................
Vorgeschlagener Preis
: 75.00
Paket B-Post
: 9.00
Total
: 84.00

.....................................................................

Läuft ab am ${FRIST_TXT}, 12:08 Uhr.

Antworten

https://www.ricardo.ch/de/a/1332215532/?priceOfferId=8d8b&utm_campaign=rtm_core`;

/* Sandbox mit den nötigen Google-Diensten (nur was der Code hier braucht) */
function sandbox(blaetter, cfg) {
  const props = {}, logs = [];
  const sheet = (name) => {
    const b = blaetter[name];
    return {
      getLastRow: () => b.length + 1,
      getRange: (r, c, n, m) => ({
        getValues: () => b.slice(r - 2, r - 2 + (n || 1)).map(x => x.slice(c - 1, c - 1 + (m || x.length))),
        setValues: (v) => { v.forEach((row, i) => { if (!b[r - 2 + i]) b[r - 2 + i] = []; row.forEach((x, j) => { b[r - 2 + i][c - 1 + j] = x; }); }); },
        setValue: (x) => { b[r - 2][c - 1] = x; }
      }),
      appendRow: (row) => b.push(row)
    };
  };
  const c = {
    console, Date, JSON, Math, Number, String, RegExp, Object, Array,
    SpreadsheetApp: { getActive: () => ({ getSheetByName: sheet }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => props[k] === undefined ? null : props[k], setProperty: (k, v) => { props[k] = v; } }) },
    CacheService: { getScriptCache: () => ({ get: () => null, put: () => {} }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, waitLock: () => {}, releaseLock: () => {} }) },
    Session: { getActiveUser: () => ({ getEmail: () => 'test@pretty-good.ch' }), getEffectiveUser: () => ({ getEmail: () => 'test@pretty-good.ch' }) },
    Utilities: {
      formatDate: (d, tz, f) => { const p = n => ('0' + n).slice(-2); return f.replace('yyyy', d.getFullYear()).replace('MM', p(d.getMonth() + 1)).replace('dd', p(d.getDate())).replace('HH', p(d.getHours())).replace('mm', p(d.getMinutes())).replace(/^H$/, String(d.getHours())).replace(/^m$/, String(d.getMinutes())); },
      parseDate: (s) => { const m = /(\d{4})-(\d\d)-(\d\d) (\d\d):(\d\d)/.exec(s); return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]); }
    }
  };
  vm.createContext(c);
  vm.runInContext(src, c);
  vm.runInContext('CFG = ' + JSON.stringify(cfg || {}) + '; log_ = function (a, b, d) { __logs.push([a, b, d]); }; wochen_ = function () {};', Object.assign(c, { __logs: logs }));
  c.props = props; c.logs = logs;
  return c;
}

/* --- 1. Erkennen --- */
let c = sandbox({}, {});
const v = c.ricardoMail_('Verkauft für 99.00 an kaeufer_a. Zahlung offen – Neu: Testgerät Babyphone', VERKAUF);
ok(v.art === 'Verkauf' && v.verkauf === '54006286' && v.artikel === '1332228520' && v.referenz === 'PG-1001', 'Verkauf: Nummern');
ok(v.preis === 90 && v.versand === 9 && v.total === 99 && v.lieferart === 'Paket B-Post' && v.kaeufer === 'kaeufer_a' && v.titel === 'Neu: Testgerät Babyphone', 'Verkauf: Beträge, Käufer, Titel');
const b = c.ricardoMail_('kaeufer_a hat angegeben, für folgenden Artikel bezahlt zu haben: Neu: Testgerät Babyphone', BEZAHLT);
ok(b.art === 'Bezahlt gemeldet' && b.verkauf === '54006286', 'Bezahlt gemeldet');
const f = c.ricardoMail_('Beantworte die Frage zu deinem Angebot: Neu: Soundkarte X', FRAGE);
ok(f.art === 'Frage' && f.artikel === '1331877810' && f.von === 'kaeufer_b' && f.text === 'Guten Tag.\nIst das Netzteil dabei?' && f.link === 'https://www.ricardo.ch/de/a/1331877810', 'Frage');
const n = c.ricardoMail_('Neue Nachricht zu: SUP-Board-Set Rot - 1331786830', NACHRICHT);
ok(n.art === 'Nachricht' && n.artikel === '1331786830' && n.verkauf === '53990997' && n.von === 'kaeufer_c' && n.link.indexOf('conversationId=abc') > 0 && n.link.indexOf('utm_') < 0, 'Nachricht');
const a = c.ricardoMail_('Du hast einen Preisvorschlag von CHF 75.00 für "Neu: Haartrockner Z" erhalten', ANGEBOT);
ok(a.art === 'Preisvorschlag' && a.betrag === 75 && a.preis === 87 && a.artikel === '1332215532' && a.frist.getDate() === FRIST_D.getDate() && a.frist.getMonth() === FRIST_D.getMonth() && a.frist.getHours() === 12, 'Preisvorschlag');
ok(c.ricardoMail_('Bewerte deine Verkaufserfahrung mit x für: y', 'egal') === null, 'Bewertung wird ignoriert');
ok(c.ricardoMail_('Ereader pocketbook inkpad4', 'Ich habe bezahlt') === null, 'Mail von Käufer wird ignoriert');

/* --- 2. Echtheit: nur die oberste Prüfung von Gmail zählt --- */
const ECHT = 'Delivered-To: x@pretty-good.ch\r\nARC-Seal: i=2; a=rsa\r\nAuthentication-Results: mx.google.com;\r\n       dkim=pass header.i=@pretty-good.ch;\r\n       arc=pass (i=1 spf=pass spfdomain=bounce.ricardo.ch dkim=pass dkdomain=ricardo.ch dmarc=pass fromdomain=ricardo.ch);\r\n       spf=pass\r\nSubject: x';
const FALSCH = 'Delivered-To: x@pretty-good.ch\r\nAuthentication-Results: mx.google.com;\r\n       dkim=pass header.i=@gmail.com;\r\n       arc=pass (i=1 dkim=pass dkdomain=gmail.com)\r\nX-Fake: 1\r\nAuthentication-Results: mx.google.com; arc=pass (i=1 dkim=pass dkdomain=ricardo.ch)\r\nSubject: x';
const DIREKT = 'Authentication-Results: mx.google.com;\r\n dkim=pass header.i=@mail.ricardo.ch header.s=s1;\r\n spf=pass';
const IMITAT = 'Authentication-Results: mx.google.com; arc=pass (i=1 dkim=pass dkdomain=ricardo.ch.evil.com)';
ok(c.echtRicardo_(ECHT) === true, 'echt über Google-Gruppe (ARC)');
ok(c.echtRicardo_(FALSCH) === false, 'gefälschte Kopfzeile weiter unten zählt nicht');
ok(c.echtRicardo_(DIREKT) === true, 'echt direkt (DKIM Subdomain)');
ok(c.echtRicardo_(IMITAT) === false, 'ricardo.ch.evil.com zählt nicht');
ok(c.echtRicardo_('') === false, 'ohne Kopfzeile nicht echt');

/* --- 3. Wirkung --- */
const L_COLS = vm.runInContext('L_COLS', c), V_COLS = vm.runInContext('V_COLS', c), I_COLS = vm.runInContext('I_COLS', c);
const leer = cols => cols.map(() => '');
const listing = (id, status, link, gelistet) => { const r = leer(L_COLS); r[0] = id; r[1] = status; r[L_COLS.indexOf('Ricardo-Link')] = link; r[L_COLS.indexOf('Gelistet am')] = gelistet || ''; r[L_COLS.indexOf('Lagerort')] = 'Regal 3'; r[L_COLS.indexOf('Versandklasse')] = 'PostPac B-Post bis 2 kg'; return r; };
const jetzt = new Date();
const blaetter = {
  'Listings': [listing('PG-1001', 'Gelistet', 'https://www.ricardo.ch/de/a/1332228520', new Date(jetzt - 2 * 864e5)),
    listing('PG-2002', 'Gelistet', 'https://www.ricardo.ch/de/a/1332215532', new Date(jetzt - 10 * 864e5)),
    listing('PG-3003', 'Gelistet', 'https://www.ricardo.ch/de/a/1331877810', new Date(jetzt - 1 * 864e5))],
  'Verkäufe': [], 'Posteingang': [], 'Einstellungen': []
};
c = sandbox(blaetter, { 'Provision %': '12', 'Laufzeit Tage': '6', 'Preisvorschlag bis Stunden nach Auktionsende': '24', 'Mails prüfen zwischen': '00:00-23:59', 'Zahlungserinnerung nach Tagen': '3' });
const sv = c.SpreadsheetApp.getActive().getSheetByName('Verkäufe'), sl = c.SpreadsheetApp.getActive().getSheetByName('Listings'), si = c.SpreadsheetApp.getActive().getSheetByName('Posteingang');
let k = c.karten_(sv, sl, si), fragen = [];
const mit = (info, id, d) => Object.assign(info, { id: id, datum: d || new Date() });
// Preisvorschlag: PG-2002 lief vor 10 Tagen an (Laufzeit 6) -> mehr als 24 h nach Ende -> ablehnen; Frage zu PG-3003
ok(c.mailWirkung_(mit(c.ricardoMail_('Du hast einen Preisvorschlag von CHF 75.00 für "Neu: Haartrockner Z" erhalten', ANGEBOT), 'm1'), k, fragen) === true, 'Preisvorschlag eingetragen');
ok(c.mailWirkung_(mit(c.ricardoMail_('Beantworte die Frage zu deinem Angebot: Neu: Soundkarte X', FRAGE), 'm2'), k, fragen) === true && fragen.length === 1, 'Frage eingetragen, Entwurf vorgemerkt');
ok(c.mailWirkung_(mit(c.ricardoMail_('Beantworte die Frage zu deinem Angebot: Neu: Soundkarte X', FRAGE), 'm2'), k, fragen) === false, 'dieselbe Mail nur einmal');
ok(c.mailWirkung_(mit(c.ricardoMail_('Verkauft für 99.00 an kaeufer_a. Zahlung offen – Neu: Testgerät Babyphone', VERKAUF), 'm3'), k, fragen) === true, 'Verkauf angelegt');
ok(c.mailWirkung_(mit(c.ricardoMail_('Verkauft für 99.00 an kaeufer_a. Zahlung offen – Neu: Testgerät Babyphone', VERKAUF), 'm3b'), k, fragen) === false, 'Verkauf nur einmal (Verkauf-Nr)');
ok(c.mailWirkung_(mit(c.ricardoMail_('kaeufer_a hat angegeben, für folgenden Artikel bezahlt zu haben: x', BEZAHLT), 'm4'), k, fragen) === true, 'bezahlt gemeldet');
k.schreiben();
const vz = blaetter['Verkäufe'][0];
ok(blaetter['Verkäufe'].length === 1 && vz[V_COLS.indexOf('PG-ID')] === 'PG-1001' && vz[V_COLS.indexOf('Status')] === 'Zu packen' && vz[V_COLS.indexOf('Total CHF')] === 99, 'Verkauf im Tab, zugeordnet');
ok(vz[V_COLS.indexOf('Quelle')] === 'Mail' && vz[V_COLS.indexOf('Käufer meldet bezahlt am')] instanceof Date && vz[V_COLS.indexOf('Lagerort')] === 'Regal 3', 'Quelle, bezahlt gemeldet, Lagerort');
ok(Math.abs(vz[V_COLS.indexOf('Provision CHF')] - 10.8) < 1e-9 && !vz[V_COLS.indexOf('Nachname')], 'Provision, noch ohne Adresse');
ok(blaetter['Listings'][0][1] === 'Verkauft' && blaetter['Listings'][0][L_COLS.indexOf('Verkauf-Nr')] === '54006286', 'Listing auf Verkauft');
const pe = blaetter['Posteingang'];
ok(pe.length === 2 && pe[0][I_COLS.indexOf('Art')] === 'Preisvorschlag' && /^Ablehnen: kam mehr als 24 h/.test(pe[0][I_COLS.indexOf('Empfehlung')]), 'Preisvorschlag zu spät: ablehnen');
ok(pe[1][I_COLS.indexOf('PG-ID')] === 'PG-3003' && pe[1][I_COLS.indexOf('Text')] === 'Guten Tag.\nIst das Netzteil dabei?', 'Frage mit Zeilenumbruch und PG-ID');
// Empfehlung: innerhalb der Frist annehmen, schon verkauft ablehnen
ok(c.empfehlung_(blaetter['Listings'][2], new Date()) === 'Annehmen', 'während Auktion annehmen');
ok(/^Ablehnen: Stück ist schon verkauft/.test(c.empfehlung_(blaetter['Listings'][0], new Date())), 'verkauft: ablehnen');
ok(/^Annehmen \(Angebot nicht im Tool/.test(c.empfehlung_(null, new Date())), 'unbekannt: annehmen');
// Ein Verkauf zum Artikel mit offenem Preisvorschlag schliesst ihn automatisch
const ANGEBOT2 = ANGEBOT.replace('1332215532', '1331877810');
k = c.karten_(sv, sl, si);
c.mailWirkung_(mit(c.ricardoMail_('Du hast einen Preisvorschlag von CHF 75.00 für "Neu: Soundkarte X" erhalten', ANGEBOT2), 'm5'), k, []);
const VERKAUF2 = VERKAUF.replace('1332228520', '1331877810').replace('54006286', '54009999').replace('PG-1001', 'PG-3003');
c.mailWirkung_(mit(c.ricardoMail_('Verkauft für 99.00 an kaeufer_a. Zahlung offen – Neu: Soundkarte X', VERKAUF2), 'm6', new Date(Date.now() + 1000)), k, []);
k.schreiben();
ok(pe[2][I_COLS.indexOf('Status')] === 'Automatisch erledigt', 'Preisvorschlag durch Verkauf erledigt');

/* --- 4. Aufgaben und Erledigt --- */
let au = c.aufgaben();
ok(au.angebote.length === 1 && au.fragen.length === 1 && au.zahlung.length === 0 && au.anzahl === 2, 'Aufgaben: 1 Preisvorschlag, 1 Frage');
au = c.aufgabeErledigt('m2');
ok(au.fragen.length === 0 && pe[1][I_COLS.indexOf('Status')] === 'Erledigt', 'Frage erledigt');
// Zahlung überfällig nach 3 Tagen, Erinnerung erledigt blendet aus
blaetter['Verkäufe'][0][V_COLS.indexOf('Verkauft am')] = new Date(Date.now() - 4 * 864e5);
au = c.aufgaben();
ok(au.zahlung.length === 1 && au.zahlung[0].nr === '54006286' && au.zahlung[0].link === 'https://www.ricardo.ch/de/my-ricardo/selling/order/54006286' && au.zahlung[0].meldet, 'Zahlung überfällig mit Link und Hinweis');
au = c.erinnerungErledigt('54006286');
ok(au.zahlung.length === 0, 'Erinnerung erledigt');
// Datenschutz: erledigte Einträge nach 60 Tagen ohne Text
pe[1][I_COLS.indexOf('Eingang')] = new Date(Date.now() - 61 * 864e5);
c.posteingangPflegen_(si);
ok(pe[1][I_COLS.indexOf('Text')] === '' && pe[1][I_COLS.indexOf('Von')] === '', 'alte erledigte Einträge geleert');
// abgelaufener Preisvorschlag
pe[0][I_COLS.indexOf('Frist')] = new Date(Date.now() - 3600e3);
c.posteingangPflegen_(si);
ok(pe[0][I_COLS.indexOf('Status')] === 'Abgelaufen', 'abgelaufen markiert');
ok(c.imFenster_('07:00-19:00') === (jetzt.getHours() * 60 + jetzt.getMinutes() >= 420 && jetzt.getHours() * 60 + jetzt.getMinutes() <= 1140), 'Zeitfenster');
ok(c.imFenster_('') === false, 'leeres Fenster = nie');
console.log('ok t_ricardo_mails');
