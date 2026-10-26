/* Ricardo Tool 2026-10-26.6 (Jonas 26.10.2026): Mail «Stornierungsanfrage eingereicht» erledigt bei einer offenen Retoure den Schritt «Bei Ricardo storniert».
   Mail-Text nach echtem Aufbau, Daten erfunden. Lauf: node tests/t_ricardo_storno_mail.js */
const fs = require('fs'), path = require('path');
const h = require('./t_ricardo_p2410_hilfe.js');
const { sandbox, ok } = h;
const T = fs.readFileSync(path.join(__dirname, 'daten/ricardo_storno.txt'), 'utf8');
let S = sandbox();
const m = S.c('ricardoMail_')('Stornierungsanfrage eingereicht - Philips Toaster - 9001', T);
ok(m.art === 'Storno' && m.artikel === '1111111111' && m.verkauf === '9001' && m.referenz === 'PG-100' && /zurückgeschickt/.test(m.grund), 'Storno-Mail gelesen: ' + JSON.stringify(m));
ok(S.c('ricardoMail_')('Stornierungsanfrage eingereicht - X - 54006045', '').verkauf === '54006045', 'Verkaufs-Nr auch aus dem Betreff');
/* offene Retoure mit Rückzahlung, Entscheid getroffen: Mail schliesst sie ab */
S.retoure({ 'Retoure-Nr': 'RT-0001', 'Status': 'Offen', 'Verkauf-Nr': '9001', 'PG-ID': 'PG-100', 'Grund': 'Defekt', 'Preis CHF': 40, 'Versand CHF': 9, 'Rückzahlung am': new Date(), 'Rückzahlung CHF': 49, 'Entscheid': 'Entsorgung' });
S.listing({ 'PG-ID': 'PG-100', 'Status': 'Retourniert', 'Verkauf-Nr': '9001' });
const d = new Date(2026, 9, 26, 13, 27);
ok(S.c('stornoAusMail_')(Object.assign({}, m, { datum: d })) === true, 'Mail wirkt');
const R = S.c('R_COLS'), rt = S.RE.d[1], rv = n => rt[R.indexOf(n)];
ok(rv('Ricardo storniert am') && rv('Ricardo storniert am').getTime() === d.getTime() && rv('Status') === 'Abgeschlossen', 'Schritt «Bei Ricardo storniert» mit Datum der Mail, Retoure abgeschlossen');
ok(S.zeile('PG-100')['Status'] === 'Retour abgeschlossen', 'Stück frei (Retour abgeschlossen)');
ok(S.c('stornoAusMail_')(Object.assign({}, m, { datum: d })) === false, 'zweite Mail: nichts mehr');
/* ohne offene Retoure: nur Log */
ok(S.c('stornoAusMail_')(Object.assign({}, m, { verkauf: '7777', datum: d })) === false && S.log(/keine offene Retoure/), 'ohne Retoure: Log, nichts geändert');
/* Retoure ohne Rückzahlung: Schritt erledigt, Retoure bleibt offen */
S = sandbox();
S.retoure({ 'Retoure-Nr': 'RT-0002', 'Status': 'Offen', 'Verkauf-Nr': '9001-1111111111', 'PG-ID': 'PG-100', 'Grund': 'Defekt', 'Preis CHF': 40, 'Versand CHF': 9 });
S.c('stornoAusMail_')(Object.assign({}, m, { datum: d }));
const R2 = S.c('R_COLS'), r2 = S.RE.d[1];
ok(r2[R2.indexOf('Ricardo storniert am')] instanceof Date && r2[R2.indexOf('Status')] === 'Offen', 'Verkauf-Nr mit Artikel-Zusatz gefunden; ohne Rückzahlung bleibt die Retoure offen');
ok(S.c('retouren')().offen[0].stornoLink === 'https://www.ricardo.ch/de/my-ricardo/selling/order/9001/cancelation/' || /cancelation\/9001\//.test(S.c('retouren')().offen[0].stornoLink), 'Link zur Stornierung auf Ricardo');
h.ende();
