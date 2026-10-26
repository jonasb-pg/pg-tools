/* Ricardo Tool 2026-10-26.1: aktuelles Gebot aus den Ricardo-Mails (Jonas 26.10.2026). Mail-Texte nach echtem Aufbau, Titel und Artikel-Nr erfunden.
   Lauf: node tests/t_ricardo_gebote.js */
const fs = require('fs'), path = require('path');
const h = require('./t_ricardo_p2410_hilfe.js');
const { sandbox, ok, KOMPLETT } = h;
const T1 = fs.readFileSync(path.join(__dirname, 'daten/ricardo_gebot.txt'), 'utf8');        // «du hast ein Gebot erhalten», 2 Gebote, CHF 31.-
const T2 = fs.readFileSync(path.join(__dirname, 'daten/ricardo_gebot_erst.txt'), 'utf8');   // «erstes Gebot», «1 Gebote(e) CHF 30.-»
const L1 = 'https://www.ricardo.ch/de/a/toaster-1111111111/';

let S = sandbox();
const m1 = S.c('ricardoMail_')('Jonas, du hast ein Gebot erhalten!', T1), m2 = S.c('ricardoMail_')('Jonas, Glückwunsch, du hast ein erstes Gebot erhalten!', T2);
ok(m1.art === 'Gebot' && m1.artikel === '1111111111' && m1.betrag === 31 && m1.anzahl === 2 && m1.titel === 'Philips Toaster', 'Mail «Gebot erhalten» gelesen: ' + JSON.stringify(m1));
ok(m2.art === 'Gebot' && m2.betrag === 30 && m2.anzahl === 1 && m2.titel === 'Philips Toaster', 'Mail «erstes Gebot» gelesen: ' + JSON.stringify(m2));
ok(S.c('chf_')("1'250.-") === 1250 && S.c('chf_')('101.50') === 101.5 && S.c('chf_')('0.-') === 0, 'Beträge «31.-», «1\'250.-»');
const fr = S.c('ricardoMail_')('Beantworte die Frage zu deinem Angebot: Philips Toaster', 'Philips Toaster\nArtikelnummer: 1111111111\nAktuelles Gebot: CHF 181.-\nkunde fragt:\nGeht er?\nBEANTWORTE DIESE FRAGE');
ok(fr.art === 'Frage' && fr.gebot === 181, 'Frage-Mail: «Aktuelles Gebot» mitgelesen');

/* Wirkung: erstes Gebot, dann höheres; ältere Mail überschreibt nicht; 0.- bei mehreren Geboten zählt nicht */
S.listing(Object.assign({ 'PG-ID': 'PG-100', 'Status': 'Gelistet', 'Ricardo-Link': L1, 'Gelistet am': new Date(Date.now() - 2 * 864e5) }, KOMPLETT));
S.listing(Object.assign({ 'PG-ID': 'PG-101', 'Status': 'Gelistet', 'Ricardo-Link': 'https://www.ricardo.ch/de/a/kabel-2222222222/', 'Gelistet am': new Date() }, KOMPLETT));
const t0 = Date.now() - 3600e3;
let kt = S.karten();
ok(S.c('mailWirkung_')(Object.assign({}, m2, { id: 'g1', datum: new Date(t0) }), kt, []) === true, 'erstes Gebot verarbeitet');
S.c('mailWirkung_')(Object.assign({}, m1, { id: 'g2', datum: new Date(t0 + 60e3) }), kt, []);
ok(S.c('mailWirkung_')(Object.assign({}, m2, { id: 'g0', datum: new Date(t0 - 60e3) }), kt, []) === false, 'ältere Mail überschreibt nicht');
ok(S.c('mailWirkung_')(Object.assign({}, m1, { id: 'g3', betrag: 0, anzahl: 23, datum: new Date(t0 + 120e3) }), kt, []) === false, '«CHF 0.-» trotz Geboten zählt nicht');
kt.schreiben();
ok(S.G && S.G.d.length === 2 && S.G.d[1][0] === '1111111111' && S.G.d[1][1] === 31 && S.G.d[1][2] === 2, 'Tab «Gebote» angelegt und beschrieben: ' + JSON.stringify(S.G && S.G.d));
ok(S.PE.d.length === 1, 'Gebots-Mails kommen nicht in den Posteingang');
kt = S.karten();
S.c('mailWirkung_')(Object.assign({}, fr, { id: 'f1', datum: new Date(t0 + 180e3) }), kt, []); kt.schreiben();
ok(S.G.d[1][1] === 181 && S.G.d[1][2] === 2 && S.pe('f1')['Art'] === 'Frage', 'Frage-Mail: Gebot nachgeführt, Anzahl bleibt, Frage im Posteingang');

/* Frage ohne Gebots-Mail: «Aktuelles Gebot» kann der Startpreis sein → kein Eintrag. Gleiche Zeit: der höhere Betrag gilt */
kt = S.karten();
ok(S.c('mailWirkung_')(Object.assign({}, fr, { artikel: '2222222222', id: 'f2', datum: new Date() }), kt, []) === true && kt.gebot('2222222222', 50, '', new Date(), 'x') === false, 'Frage ohne Gebots-Mail: kein Gebot eingetragen');
const tg = new Date(t0 + 240e3);
kt.gebot('3333333333', 108.5, 27, tg, 'TV-Box'); kt.gebot('3333333333', 107.5, 27, tg, 'TV-Box'); kt.schreiben();
ok(S.G.d.find(r => r[0] === '3333333333')[1] === 108.5 && !S.G.d.some(r => r[0] === '2222222222'), 'gleiche Zeit: höherer Betrag bleibt');
/* Übersicht: Gebot beim gelisteten Stück, «Noch kein Gebot» beim anderen */
S.neu();
const u = S.c('uebersicht')(), a = u.liste.find(x => x.id === 'PG-100'), b = u.liste.find(x => x.id === 'PG-101');
ok(a.gebot && a.gebot.chf === 181 && a.gebot.anzahl === 2 && a.gebot.stand, 'Übersicht: aktuelles Gebot ' + JSON.stringify(a.gebot));
ok(b.gebot && b.gebot.keins === true, 'Übersicht: «Noch kein Gebot»');

S.listing(Object.assign({ 'PG-ID': 'PG-102', 'Status': 'Bereit' }, KOMPLETT)); S.listing(Object.assign({ 'PG-ID': 'PG-103', 'Status': 'In Arbeit' }, KOMPLETT)); S.neu();
ok(S.c('uebersicht')().liste.every(x => x.status === 'Gelistet'), '«Laufende Angebote» nur mit Status «Gelistet» (Jonas 26.10.2026)');
/* Ohne Tab-Zugriff: Verkäufe laufen weiter */
S = sandbox();
S.ctx.SpreadsheetApp.getActive = (orig => () => Object.assign(orig(), { insertSheet: () => { throw new Error('keine Rechte'); } }))(S.ctx.SpreadsheetApp.getActive);
S.listing(Object.assign({ 'PG-ID': 'PG-100', 'Status': 'Gelistet', 'Ricardo-Link': L1 }, KOMPLETT));
kt = S.karten();
ok(S.c('mailWirkung_')(Object.assign({}, m1, { id: 'g9', datum: new Date() }), kt, []) === false && S.log(/Tab «Gebote» nicht lesbar/), 'Tab nicht anlegbar: Gebot übersprungen, Log');
ok(S.c('mailWirkung_')({ art: 'Verkauf', artikel: '1111111111', verkauf: '9001', referenz: 'PG-100', titel: 'Philips Toaster', preis: 30, versand: 9, total: 39, kaeufer: 'k1', lieferart: 'Paket', datum: new Date(), id: 'v1' }, kt, []) === true, 'Verkauf trotzdem verarbeitet');
kt.schreiben();
ok(S.zeile('PG-100')['Status'] === 'Verkauft', 'Listing «Verkauft»');

/* Nachholen im Editor: nur der Tab «Gebote», Fragen kommen nicht nochmals in den Posteingang */
S = sandbox();
S.listing(Object.assign({ 'PG-ID': 'PG-100', 'Status': 'Gelistet', 'Ricardo-Link': L1 }, KOMPLETT));
const echt = 'Authentication-Results: mx.google.com; dkim=pass header.i=@mail.ricardo.ch\r\n\r\nx';
const msg = (betreff, text, d, id) => ({ getDate: () => d, getSubject: () => betreff, getPlainBody: () => text, getId: () => id, getRawContent: () => echt });
S.gmail = () => [{ getMessages: () => [msg('Jonas, Glückwunsch, du hast ein erstes Gebot erhalten!', T2, new Date(Date.now() - 2 * 864e5), 'a'), msg('Jonas, du hast ein Gebot erhalten!', T1, new Date(Date.now() - 864e5), 'b'),
  msg('Beantworte die Frage zu deinem Angebot: Philips Toaster', 'Philips Toaster\nArtikelnummer: 1111111111\nAktuelles Gebot: CHF 40.-\nkunde fragt:\nGeht er?\nBEANTWORTE DIESE FRAGE', new Date(Date.now() - 3600e3), 'c')] }];
S.c('vonWebApp_ = function () { return false; }');
const r = S.c('geboteNachholen')();
ok(/3 Gebots-Mails/.test(r) && S.G.d[1][1] === 40 && S.G.d[1][2] === 2 && S.PE.d.length === 1, 'geboteNachholen: Stand 40.- (2 Gebote), Posteingang unverändert: ' + r);
h.ende();
