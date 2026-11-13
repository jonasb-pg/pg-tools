/* Ricardo Tool 13.11.2026: «Gelistet» nimmt nur Links mit 10-stelliger Ricardo-Artikelnummer (Fall …-198580646). Erfundene Daten. Lauf: node tests/t_ricardo_link_1311.js */
const h = require('./t_ricardo_p2410_hilfe.js');
const { sandbox, ok, wirft, KOMPLETT } = h;
const KURZ = 'https://www.ricardo.ch/de/a/owlet-dream-sock-neu-198580646/', GUT = 'https://www.ricardo.ch/de/a/owlet-dream-sock-neu-1334609534/';

let S = sandbox();
S.listing(Object.assign({ 'PG-ID': 'PG-100', 'Status': 'Bereit' }, KOMPLETT));
wirft(() => S.c("markiereGelistet('PG-100', '" + KURZ + "')"), /^Die Nummer am Ende des Links \(198580646\) ist keine Ricardo-Artikelnummer/, '9-stellige Nummer abgelehnt');
ok(S.zeile('PG-100')['Status'] === 'Bereit' && !S.zeile('PG-100')['Ricardo-Link'], 'nach Ablehnung: Status und Link unverändert');
wirft(() => S.c("markiereGelistet('PG-100', 'https://www.ricardo.ch/de/a/198580646/')"), /keine Ricardo-Artikelnummer/, 'auch ohne Titel im Link');
wirft(() => S.c("markiereGelistet('PG-100', 'https://www.ricardo.ch/de/a/x-1234567/')"), /keine Ricardo-Artikelnummer/, '7-stellig abgelehnt');
let r = S.c("markiereGelistet('PG-100', '" + GUT + "')");
ok(r.status === 'Gelistet' && S.zeile('PG-100')['Ricardo-Link'] === GUT, '10-stellige Artikelnummer: gelistet');
ok(S.c("artikelAusLink_('" + GUT + "')") === '1334609534', 'Artikelnummer gelesen');
/* Link ersetzen bei «Gelistet»: auch dort keine kurze Nummer */
wirft(() => S.c("markiereGelistet('PG-100', '" + KURZ + "', '', true)"), /keine Ricardo-Artikelnummer/, 'Ersetzen mit kurzer Nummer abgelehnt');
ok(S.zeile('PG-100')['Ricardo-Link'] === GUT, 'Link bleibt beim Ersetzen-Versuch');
/* Lesen alter Links bleibt unverändert (Mails, Frühere Links) */
ok(S.c("artikelAusLink_('https://www.ricardo.ch/de/a/hue-1299009/')") === '1299009', 'kurze Nummern werden beim Lesen weiter erkannt (nur «Gelistet» prüft)');
/* Englisch */
ok(/^The number at the end of the link \(198580646\) is not a Ricardo article number/.test(S.c("en_('Die Nummer am Ende des Links (198580646) ist keine Ricardo-Artikelnummer (die hat 10 Stellen, z.B. 1334608262). Bitte …')")), 'Fehlermeldung auf Englisch');
h.ende();
