/* Ricardo Tool 02.11.2026: Suche findet Käufer auch über Vor- und Nachnamen, Akzente und Gross/klein egal. Erfundene Daten. Lauf: node tests/t_ricardo_suche_name.js */
const h = require('./t_ricardo_p2410_hilfe.js');
const { sandbox, ok, KOMPLETT, CSV_KOPF } = h;
const zeile = (nr, art, ref, vor, nach) => [nr, art, 'Philips Toaster', ref, '24.10.2026 10:00', 30, 9, 'k4', vor, nach, 'Testweg  1', '3000', 'Bern', 'Paket B-Post', 'Bezahlt'].join(';') + '\n';
const S = sandbox();
S.listing(Object.assign({ 'PG-ID': 'PG-100', 'Status': 'Gelistet', 'Ricardo-Link': 'https://www.ricardo.ch/de/a/toaster-1111111111/' }, KOMPLETT));
S.c('importVerkaeufe')(CSV_KOPF + zeile('9101', '1111111111', 'PG-100', 'André', 'Zéller'));
const nrn = q => S.c('cockpitSuche')(q).verkaeufe.map(v => v.nr);
ok(S.vz('9101')['Vorname'] === 'André', 'Testverkauf mit Vorname angelegt');
ok(nrn('André Zéller').indexOf('9101') !== -1, 'Vor- und Nachname zusammen');
ok(nrn('andre').indexOf('9101') !== -1, 'Vorname allein, ohne Akzent, klein');
ok(nrn('ZELLER').indexOf('9101') !== -1, 'Nachname gross, ohne Akzent');
ok(nrn('k4').indexOf('9101') !== -1, 'Ricardo-Benutzername wie bisher');
ok(nrn('Vera').length === 0, 'Fremder Name findet nichts');
console.log('Alle Suche-Tests bestanden');
