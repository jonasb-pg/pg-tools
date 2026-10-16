/* Ricardo Tool: Post-Export pro Versandklasse und Hauptbild beim Packen. Lauf: node tests/t_ricardo_post.js */
const fs = require('fs'), vm = require('vm'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../apps/ricardo/Code.gs'), 'utf8');
function blatt(name, rows) {
  let d = rows.map(r => r.slice());
  const sh = { d: () => d, getSheetId: () => 7, getName: () => name, getLastRow: () => d.length, getMaxColumns: () => 40, getMaxRows: () => d.length + 50, insertColumnsAfter() {},
    clear() { d = []; }, getRange: (r, c, nr, nc) => ({
      getValues: () => { const o = []; for (let i = 0; i < (nr || 1); i++) { const z = []; for (let j = 0; j < (nc || 1); j++) z.push(((d[r - 1 + i] || [])[c - 1 + j]) ?? ''); o.push(z); } return o; },
      setValues: v => { v.forEach((z, i) => { while (d.length < r + i) d.push([]); z.forEach((x, j) => { d[r - 1 + i][c - 1 + j] = x; }); }); },
      setNumberFormat() {}, clearContent() {} }) };
  return sh;
}
let ctx;
const V_COLS = () => vm.runInContext('V_COLS', ctx), L_COLS = () => vm.runInContext('L_COLS', ctx);
const verkauf = (nr, pg, status, klasse) => V_COLS().map(k => ({ 'Verkauf-Nr': nr, 'PG-ID': pg, 'Status': status, 'Versandklasse': klasse, 'Nachname': 'N' + nr, 'Vorname': 'V', 'Strasse': 'Weg', 'Hausnummer': '1', 'PLZ': '3000', 'Ort': 'Bern', 'Titel': 'T' + nr, 'Verkauft am': new Date(), 'Total CHF': 10, 'Preis CHF': 9 })[k] ?? '');
const V = blatt('Versand', [['Klasse', 'bis kg', 'Preis', 'Sperrgut'], ['PostPac B-Post bis 2 kg', 2, 9, 'nein'], ['PostPac B-Post bis 10 kg', 10, 12, 'nein'], ['PostPac B-Post bis 30 kg', 30, 21, 'nein'], ['Sperrgut B-Post bis 30 kg', 30, 31, 'ja']]);
const E = blatt('Einstellungen', [['Einstellung', 'Wert'], ['Regal Unpaid', 'Regal Unpaid']]);
let S, L, P = blatt('Post-Adressen', []), LOG = blatt('Log', [['Zeit']]), exporte = [], cache = {}, drive = 0;
const datei = (name, trash) => ({ getName: () => name, isTrashed: () => !!trash, getThumbnail: () => ({ getContentType: () => 'image/png', getBytes: () => [1, 2, 3] }) });
const ordner = { F1: [datei('2 Weitere 01 PG-1.jpg'), datei('1 Hauptbild PG-1.jpg')], F3: [datei('1 Hauptbild PG-3.jpg', true)] };
ctx = { console, Date, Math, JSON, Object, String, Number, Array, RegExp, Error, isNaN, parseFloat,
  SpreadsheetApp: { getActive: () => ({ getId: () => 'SS', getSheetByName: n => ({ 'Verkäufe': S, Listings: L, Versand: V, Log: LOG, 'Post-Adressen': P, Einstellungen: E })[n] }), flush() {} },
  ScriptApp: { getOAuthToken: () => 't' },
  UrlFetchApp: { fetch: () => { exporte.push(P.d().slice(1).map(r => r[14])); return { getResponseCode: () => 200, getBlob: () => ({ getBytes: () => [1] }) }; } },
  Utilities: { formatDate: () => '2026-10-16', base64Encode: b => 'B' + b.length },
  CacheService: { getScriptCache: () => ({ getAll: ks => { const o = {}; ks.forEach(k => { if (k in cache) o[k] = cache[k]; }); return o; }, putAll: o => Object.assign(cache, o) }) },
  DriveApp: { getFolderById: id => { drive++; if (!ordner[id]) throw new Error('nicht gefunden'); let i = 0; const f = ordner[id]; return { getFiles: () => ({ hasNext: () => i < f.length, next: () => f[i++] }) }; } },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  Session: { getActiveUser: () => ({ getEmail: () => 't' }) }, PropertiesService: { getScriptProperties: () => ({ getProperty: () => null, setProperty() {} }) } };
vm.createContext(ctx); vm.runInContext(src, ctx);
S = blatt('Verkäufe', [V_COLS(), verkauf('1', 'PG-1', 'Zu packen', 'Sperrgut B-Post bis 30 kg'), verkauf('2', 'PG-2', 'Zu packen', 'PostPac B-Post bis 2 kg'),
  verkauf('3', 'PG-3', 'Zu packen', 'PostPac B-Post bis 2 kg'), verkauf('4', '', 'Zu packen', ''), verkauf('5', 'PG-5', 'Bezahlt und versendet', 'PostPac B-Post bis 2 kg')]);
const lz = (pg, f) => L_COLS().map(k => ({ 'PG-ID': pg, 'Status': 'Verkauft', 'Foto-Ordner': f })[k] ?? '');
L = blatt('Listings', [L_COLS(), lz('PG-1', 'https://drive.google.com/drive/folders/F1'), lz('PG-2', ''), lz('PG-3', 'https://drive.google.com/drive/folders/F3')]);
let fehler = 0; const ok = (b, m) => { if (!b) { fehler++; console.log('FEHLER', m); } else console.log('ok', m); };

const r = vm.runInContext('postAdressen()', ctx);
ok(r.anzahl === 4 && r.dateien.length === 3, 'vier Adressen in drei Dateien: ' + JSON.stringify(r.dateien.map(d => [d.klasse, d.anzahl])));
ok(r.dateien.map(d => d.klasse).join('|') === 'PostPac B-Post bis 2 kg|Sperrgut B-Post bis 30 kg|Ohne Versandklasse', 'Reihenfolge wie Tab Versand, ohne Klasse zuletzt');
ok(JSON.stringify(exporte) === JSON.stringify([['Ricardo 2', 'Ricardo 3'], ['Ricardo 1'], ['Ricardo 4']]), 'jede Datei nur mit ihren Adressen: ' + JSON.stringify(exporte));
ok(r.dateien[1].name === 'Post-Adressen 2026-10-16 Sperrgut B-Post bis 30 kg.xlsx', 'Dateiname');
ok(P.d().length === 1 && P.d()[0][0] === 'Firmenname', 'Adressen danach aus dem Sheet entfernt');
S.d().slice(1).forEach(z => { z[V_COLS().indexOf('Status')] = 'Wartet auf Zahlung'; });
ok(vm.runInContext('postAdressen()', ctx).anzahl === 0, 'nichts zu packen: keine Datei');
S.d().slice(1).forEach(z => { z[V_COLS().indexOf('Status')] = 'Zu packen'; });

const v = vm.runInContext('verkaeufe()', ctx), bild = id => (v.offen.find(o => o.pgId === id) || {}).bild;
ok(bild('PG-1') === 'data:image/png;base64,B3', 'Hauptbild aus dem Foto-Ordner, nicht «2 Weitere»');
ok(bild('PG-2') === '' && bild('PG-3') === '', 'ohne Ordner oder nur gelöschtes Hauptbild: kein Bild');
ok(v.offen.find(o => o.nr === '4').bild === undefined, 'Stück ohne PG-ID: kein Bild, kein Fehler');
const vorher = drive; vm.runInContext('verkaeufe()', ctx);
ok(drive === vorher, 'zweites Laden aus dem Zwischenspeicher, ohne Drive');

/* Verkauf aus der Ricardo-Mail: ohne Adresse nicht im Post-Export, der Verkaufsbericht trägt die Adresse nach */
const ohneAdr = verkauf('6', 'PG-6', 'Zu packen', 'PostPac B-Post bis 2 kg');
['Nachname', 'Vorname', 'Strasse', 'Hausnummer', 'PLZ', 'Ort'].forEach(k => { ohneAdr[V_COLS().indexOf(k)] = ''; });
ohneAdr[V_COLS().indexOf('Quelle')] = 'Mail'; ohneAdr[V_COLS().indexOf('Artikel-Nr')] = '1331';
S.d().push(ohneAdr);
const r2 = vm.runInContext('postAdressen()', ctx);
ok(r2.anzahl === 5 && r2.ohne === 1, 'Verkauf ohne Adresse übersprungen und gezählt ' + JSON.stringify([r2.anzahl, r2.ohne]));
ok(vm.runInContext('verkaeufe()', ctx).offen.find(o => o.nr === '6').ohneAdresse === true, 'Packliste zeigt «Adresse fehlt»');
const csv = 'Article ID;Order ID;ArticleTitle;ReferenceNumber;ArticleUrl;EndDate;ItemQuantity;Selling Price;ShippingCost;BuyerNick;BuyerCompanyName;BuyerFirstName;BuyerLastName;BuyerAddress;BuyerPostalBox;BuyerZipCode;BuyerCity;BuyerCountry;BuyerEmail;BuyerPhone;PaymentStatus;DeliveryDescription;ShippingStatus\n'
  + '1331;6;Titel 6;PG-6;x;15.10.2026 21:35;1;58.95;9.00;nick6;;Anna;Muster;Teststrasse  12;;3000;Bern;CH;a@b.ch;0;Nicht bezahlt;Paket B-Post;Nicht versandt\n';
const imp = vm.runInContext('importVerkaeufe(' + JSON.stringify(csv) + ')', ctx).import;
const z6 = S.d().find(z => String(z[0]) === '6');
ok(imp.neu === 0 && imp.bekannt === 1 && imp.ergaenzt === 1, 'Bericht: bekannter Verkauf, Adresse ergänzt');
ok(z6[V_COLS().indexOf('Nachname')] === 'Muster' && z6[V_COLS().indexOf('Strasse')] === 'Teststrasse' && z6[V_COLS().indexOf('Hausnummer')] === '12' && z6[V_COLS().indexOf('PLZ')] === '3000' && z6[V_COLS().indexOf('Status')] === 'Zu packen', 'Adresse eingetragen, Status bleibt');
ok(vm.runInContext('postAdressen()', ctx).anzahl === 6, 'danach im Post-Export');
const imp2 = vm.runInContext('importVerkaeufe(' + JSON.stringify(csv) + ')', ctx).import;
ok(imp2.ergaenzt === 0 && S.d().filter(z => String(z[0]) === '6').length === 1, 'zweimal einlesen ändert nichts');
console.log(fehler ? 'Fehler: ' + fehler : 'alle Tests ok'); process.exit(fehler ? 1 : 0);
