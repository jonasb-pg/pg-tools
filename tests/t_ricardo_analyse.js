/* Ricardo Tool: Quelle ANALYSE TOOL, Analyse-Modus, gemischte Bündel, RC neu listen. Lauf: node tests/t_ricardo_analyse.js */
const fs = require('fs'), vm = require('vm'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../apps/ricardo/Code.gs'), 'utf8');

function blatt(name, rows) {
  const d = rows.map(r => r.slice());
  const breite = () => Math.max(0, ...d.map(r => r.length));
  const sh = {
    d, getName: () => name, getLastRow: () => d.length, getLastColumn: () => breite(), getMaxColumns: () => Math.max(40, breite()), getMaxRows: () => d.length + 100,
    appendRow: r => { d.push(r.slice()); },
    getDataRange: () => sh.getRange(1, 1, d.length, breite()),
    getRange: (r, c, nr, nc) => ({
      getValues: () => { const o = []; for (let i = 0; i < (nr || 1); i++) { const z = []; for (let j = 0; j < (nc || 1); j++) z.push(((d[r - 1 + i] || [])[c - 1 + j]) ?? ''); o.push(z); } return o; },
      getValue: () => ((d[r - 1] || [])[c - 1]) ?? '',
      setValues: v => { v.forEach((z, i) => { while (d.length < r + i) d.push([]); z.forEach((x, j) => { d[r - 1 + i][c - 1 + j] = x; }); }); return this; },
      setNumberFormat() { return this; }, setFontWeight() { return this; }, setBackground() { return this; }
    })
  };
  return sh;
}
const E = blatt('Einstellungen', [['Einstellung', 'Wert'], ['Return Tool ID', 'RT'], ['Analyse Tool ID', 'AT'], ['Such-Tabs', 'Online'], ['Hinweis-Tabs', 'Stationär'],
  ['Laufzeit Tage', '6'], ['Versandsatz', 'Versand per Post.'], ['Schlusssatz', '30 Tage Garantie.'], ['Claude-Modell', 'x']]);
const V = blatt('Versand', [['Klasse', 'bis kg', 'Preis', 'Sperrgut'], ['PostPac B-Post bis 2 kg', 2, 9, 'nein'], ['PostPac B-Post bis 10 kg', 10, 12, 'nein'], ['PostPac B-Post bis 30 kg', 30, 21, 'nein'], ['Sperrgut B-Post bis 30 kg', 30, 31, 'ja']]);
let Lsh, LOG = blatt('Log', [['Zeit']]);
const ANA_KOPF = ['PG-ID', 'Analyse-Nr', 'Bezeichnung', 'EAN', 'Titel', 'Artikelbeschrieb', 'Ricardo-Zustand', 'Grade', 'Startpreis CHF', 'Neupreis CHF', 'Versandklasse', 'Versand CHF', 'Foto-Ordner', 'Fotos', 'Kürzel', 'Analysiert am', 'Status'];
const ANA = blatt('Ricardo', [ANA_KOPF,
  ['PG-100', 'A-0001', 'Toaster X', "'0761234567890", 'Toaster X 2 Schlitze', 'Toaster.\n\nZustand: Gebraucht.\nGeprüft.\n\nVersand per Post.', 'Gebraucht', 'B', 40, 80, '0-2kg / PostPac B-Post', 9, 'https://drive.google.com/x', 5, 'JB', new Date(2026, 9, 14), 'Offline'],
  ['PG-200', 'A-0002', 'Mixer', '', 'Mixer Y', 'Mixer.\n\nZustand: Neu und originalverpackt.', 'Neu und originalverpackt', 'A', 60, 120, '0-30 kg / Sperrgut B-Post', 31, '', 3, 'AB', new Date(2026, 9, 14), 'Offline']]);
const RT = blatt('Online', [['ID', 'Bezeichnung', 'Barcode', 'VP', 'OVP', 'Lagerort', 'Spezifikationen'],
  ['PG-100', 'Toaster X (RT)', '', 35, 80, 'A1', ''], ['PG-300', 'Kabel', '', 10, 20, 'B2', 'Länge: 2 m']]);
const STA = blatt('Stationär', [['ID', 'Bezeichnung', 'Barcode', 'VP', 'OVP', 'Lagerort'], ['PG-900', 'Vitrine Glas', '', 50, 200, 'HOM-1']]);   // 24.10.2026: Hinweis-Tabs müssen existieren (M2)
const RT_TABS = { Online: RT, 'Stationär': STA };
const ext = { AT: { getName: () => 'ANALYSE TOOL', getSheetByName: n => n === 'Ricardo' ? ANA : null }, RT: { getName: () => 'RT', getSheetByName: n => RT_TABS[n] || null, getSheets: () => Object.keys(RT_TABS).map(n => RT_TABS[n]) } };
const ctx = {
  console, Date, Math, JSON, Object, String, Number, Array, RegExp, Error, isNaN, parseFloat,
  SpreadsheetApp: { getActive: () => ({ getSheetByName: n => ({ Listings: Lsh, Einstellungen: E, Versand: V, Log: LOG })[n] }), openById: id => ext[id] },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  Session: { getActiveUser: () => ({ getEmail: () => 'test@pretty-good.ch' }) },
  PropertiesService: { getScriptProperties: () => ({ getProperty: k => PROPS[k] ?? null, setProperty: (k, v) => { PROPS[k] = v; } }) },
  Utilities: { formatDate: d => d.toISOString().slice(0, 10),
    newBlob: (x) => ({ x, getBytes: () => Buffer.isBuffer(x) ? x : Buffer.from(String(x)), getDataAsString: () => Buffer.from(x).toString() }),
    gzip: b => ({ getBytes: () => require('zlib').gzipSync(b.getBytes()) }), ungzip: b => ({ getDataAsString: () => require('zlib').gunzipSync(Buffer.from(b.x)).toString() }),
    base64Encode: b => Buffer.from(b).toString('base64'), base64Decode: s => Buffer.from(s, 'base64') },
  CacheService: { getScriptCache: () => ({ get: k => CACHE[k] ?? null, getAll: ks => { const o = {}; ks.forEach(k => { if (k in CACHE) o[k] = CACHE[k]; }); return o; }, putAll: o => Object.assign(CACHE, o), put: (k, v) => { CACHE[k] = v; }, remove: k => { delete CACHE[k]; } }) }
};
const CACHE = {}, PROPS = {};
vm.createContext(ctx); vm.runInContext(src, ctx);
Lsh = blatt('Listings', [vm.runInContext('L_COLS', ctx)]);
const c = n => vm.runInContext(n, ctx);
let fehler = 0; const ok = (b, m) => { if (!b) { fehler++; console.log('FEHLER', m); } else console.log('ok', m); };
const zeile = id => { const L = c('L_COLS'); const z = Lsh.d.filter(r => r[0] === id).pop(); const o = {}; L.forEach((k, i) => o[k] = z[i]); return o; };

ok(c('analyseListe()').map(a => a.id).join() === 'PG-100,PG-200', 'Liste aus der Analyse');
const s = c("suche('Toaster')");
ok(s.treffer.length === 1 && s.treffer[0].tab === 'Analyse', 'Suche: analysiertes Stück zählt, Return-Tool-Zeile doppelt nicht');
let r = c("starteListing('PG-100')");
ok(r.analyse && r.status === 'Bereit' && r.zustand === 'Gebraucht' && r.getestet, 'Listing aus Analyse sofort bereit: ' + r.status + ' ' + JSON.stringify(r.fehlt));
ok(r.klasse === 'PostPac B-Post bis 2 kg' && r.versand === '9.00' && r.fotoOrdner && r.analyseNr === 'A-0001' && r.ean === '0761234567890', 'Versand, Fotos, Analyse-Nr, EAN');
ok(c("analyseListe()").map(a => a.id).join() === 'PG-200', 'gelistetes Stück fällt aus der Liste');
r = c("speichereDetails('PG-100', { zustand: 'Defekt', getestet: false, maengel: 'x' })");
ok(r.zustand === 'Gebraucht' && r.getestet && !r.maengel, 'Zustand und Prüfung gesperrt');
r = c("speichereDetails('PG-100', { titel: 'Toaster X neu', beschrieb: " + JSON.stringify(zeile('PG-100')['Beschrieb']) + " })");
ok(/^geändert von test@pretty-good.ch am /.test(r.geaendert) && r.status === 'Bereit', 'Vermerk «geändert»: ' + r.geaendert);
r = c("erstelleText('PG-100')");
ok(r.titel === 'Toaster X 2 Schlitze' && !r.geaendert && r.textQuelle === 'Analyse', 'Text aus der Analyse wiederhergestellt');
/* 24.10.2026: neue RC-Nummern gibt es nicht mehr (nur Stücke mit PG-ID); bestehende RC-Listings bleiben gültig */
let fehlerRc = ''; try { c("freiesListing({ name: 'Vase blau', preis: '15', neupreis: '30' })"); } catch (e) { fehlerRc = e.message; }
ok(/^Nur Stücke mit PG-ID\. Bitte zuerst im Return Tool erfassen\.$/.test(fehlerRc), 'kein neues Listing ohne PG-ID: ' + fehlerRc);
const rcZeile = (id, name, vp, ovp) => { const L = c('L_COLS'); Lsh.d.push(L.map(k => ({ 'PG-ID': id, 'Status': 'In Arbeit', 'Bezeichnung': name, 'Startpreis CHF': vp, 'Neupreis CHF': ovp, 'Quelle Tab': 'Frei' })[k] ?? '')); vm.runInContext('vergiss_()', ctx); };
rcZeile('RC-0001', 'Vase blau', 15, 30);
let rc = c("lade('RC-0001')");
ok(rc.id === 'RC-0001', 'bestehendes RC-Listing');
r = c("buendelHinzu('PG-100', 'RC-0001')"); r = c("buendelHinzu('PG-100', 'pg-300')");
ok(r.startpreis === '65.00' && Number(r.neupreis) === 130 && !r.analyse && !r.getestet && !r.titel && r.buendelIds.join() === 'RC-0001, PG-300'.split(', ').join(), 'gemischtes Bündel: ' + r.startpreis + ' ' + r.neupreis);
ok(zeile('RC-0001')['Status'] === 'Abgebrochen', 'offenes RC-Listing geht im Bündel auf');
ok(r.fehlt.indexOf('Produkt prüfen und «geprüft» bestätigen') !== -1, 'Bündel braucht neue Prüfung');
let fehlerText = ''; rcZeile('RC-0002', 'Teller', 5, ''); try { c("buendelHinzu('RC-0002', 'RC-0001')"); } catch (e) { fehlerText = e.message; }
ok(/bereits in einem Listing \(Bündel PG-100\)/.test(fehlerText), 'RC nicht doppelt bündeln: ' + fehlerText);
r = c("buendelLeeren('PG-100')");
ok(r.analyse && r.startpreis === '40.00' && Number(r.neupreis) === 80 && r.status === 'Bereit' && r.titel === 'Toaster X 2 Schlitze', 'Bündel aufgelöst, Analyse wieder da');
r = c("starteListing('RC-0001')");
ok(r.id === 'RC-0001' && r.startpreis === '15.00' && r.status === 'In Arbeit', 'RC neu gelistet');
// RC als Hauptstück mit Bündel, dann auflösen
r = c("buendelHinzu('RC-0001', 'PG-200')");
ok(r.startpreis === '75.00', 'RC-Hauptstück mit Analyse-Stück: ' + r.startpreis);
r = c("buendelLeeren('RC-0001')");
ok(r.startpreis === '15.00' && Number(r.neupreis) === 30, 'RC-Hauptstück zurück: ' + r.startpreis + ' ' + r.neupreis);
r = c("starteListing('PG-200')");
ok(r.sperrgut && r.klasse === 'Sperrgut B-Post bis 30 kg' && r.zustand === 'Neu und originalverpackt' && r.regal === 'Ricardo Offline', 'Sperrgut aus der Analyse, Regal Offline');
r = c("markiereGelistet('PG-200', 'https://www.ricardo.ch/de/a/mixer-1234567890/')");
ok(r.status === 'Gelistet' && r.regal === 'Ricardo Online', 'gelistet = Regal Ricardo Online');
const u = c('uebersicht()');
ok(u.liste.find(x => x.id === 'PG-200').regal === 'Ricardo Online', 'Übersicht zeigt Regal');
const v = c("analyseVersand_('10-30kg / PostPac B-Post')"), v2 = c("analyseVersand_('PostPac B-Post bis 10 kg')");
ok(v.gewicht === 30 && !v.sperrgut && v2.gewicht === 10, 'Versandklassen beider Schreibweisen');
E.d.push(['Regal Online', 'Online-Regal']); vm.runInContext('cfgVergessen_(); vergiss_()', ctx);   // Änderung von Hand: onEdit
ok(c("lade('PG-200')").regal === 'Online-Regal' && c('startDaten').toString() && c("regal_('Bereit')") === 'Ricardo Offline', 'Regalname aus den Einstellungen, sonst Vorgabe');
// Leere Analyse (Tab fehlt) stört nicht
ext.AT.getSheetByName = () => null;
ok(c('analyseListe()').length === 0 && c("suche('Kabel')").treffer.length === 1, 'ohne Tab «Ricardo» weiter wie bisher');
// Tempo: Return Tool gemerkt, neu erfasste Stücke trotzdem gefunden
let opens = 0; const altOpen = ctx.SpreadsheetApp.openById; ctx.SpreadsheetApp.openById = id => { if (id === 'RT') opens++; return altOpen(id); };
for (const k of Object.keys(CACHE)) delete CACHE[k];
c("suche('Kabel')"); const o1 = opens; c("suche('Kabel')");
ok(o1 === 1 && opens === 1 && CACHE['rt:Online:n'], 'zweite Suche aus der gemerkten Kopie, ohne Return Tool zu öffnen');
RT.d.push(['PG-400', 'Lampe neu', '', 12, 20, 'C3', '']);
ok(c("suche('Lampe neu')").treffer.length === 1, 'eben erfasstes Stück wird trotzdem gefunden (frisch nachgelesen)');
const o3 = opens, t3 = c("suche('Lampe neu')"); ok(t3.treffer.length === 1 && opens === o3, 'danach wieder aus der Kopie, ohne Return Tool zu öffnen');
console.log(fehler ? fehler + ' Fehler' : 'alle Tests ok'); process.exit(fehler ? 1 : 0);
