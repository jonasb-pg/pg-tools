/* Ricardo Tool: Datenintegrität nach dem Audit vom 24.10.2026 (S1–S6, M1–M6, K1, K2, K6, K7). Erfundene Daten. Lauf: node tests/t_ricardo_integritaet.js */
const fs = require('fs'), vm = require('vm'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../apps/ricardo/Code.gs'), 'utf8');
let fehler = 0; const ok = (b, m) => { if (!b) { fehler++; console.log('FEHLER', m); } else console.log('ok', m); };
const wirft = (f, re, m) => { let t = ''; try { f(); } catch (e) { t = e.message; } ok(re.test(t), m + (t ? ' [' + t + ']' : ' [kein Fehler]')); };

function blatt(name, rows) {
  const d = rows.map(r => r.slice());
  const breite = () => Math.max(0, ...d.map(r => r.length));
  const sh = {
    d, getName: () => name, getLastRow: () => d.length, getLastColumn: () => breite(), getMaxColumns: () => Math.max(60, breite()), getMaxRows: () => d.length + 100,
    appendRow: r => { if (sh.kaputt) throw new Error('Sheet kaputt'); d.push(r.slice()); },
    getDataRange: () => sh.getRange(1, 1, d.length, breite()),
    getRange: (r, c, nr, nc) => ({
      getValues: () => { const o = []; for (let i = 0; i < (nr || 1); i++) { const z = []; for (let j = 0; j < (nc || 1); j++) z.push(((d[r - 1 + i] || [])[c - 1 + j]) ?? ''); o.push(z); } return o; },
      getValue: () => ((d[r - 1] || [])[c - 1]) ?? '',
      setValue: v => { if (sh.kaputt) throw new Error('Sheet kaputt'); while (d.length < r) d.push([]); d[r - 1][c - 1] = v; },
      setValues: v => { if (sh.kaputt) throw new Error('Sheet kaputt'); v.forEach((z, i) => { while (d.length < r + i) d.push([]); z.forEach((x, j) => { d[r - 1 + i][c - 1 + j] = x; }); }); },
      setNumberFormat() { return this; }, setFontWeight() { return this; }, setBackground() { return this; }
    })
  };
  return sh;
}
/* Return Tool wie echt: Kopfzeile in Zeile 6, darüber Titel und Summen */
const RT_KOPF = ['☑', 'ID', 'Sendung', 'Erfasst', 'Bezeichnung', '#', 'Barcode', 'Link', 'Kategorie', 'OVP', 'VP', 'Wert', 'CH', 'Lagerort', 'Lief-Nr'];
const rtTab = (name, stuecke, ohneId) => {
  const kopf = ohneId ? RT_KOPF.filter(k => k !== 'ID') : RT_KOPF;
  return blatt(name, [['Return Tool ' + name], [], ['Summe', 123], [], [], kopf].concat(stuecke.map(s => kopf.map(k => ({ ID: s.id, Bezeichnung: s.name, Barcode: s.bc, Lagerort: s.ort, VP: s.vp, OVP: s.ovp, Link: s.link })[k] ?? ''))));
};

function sandbox() {
  const S = {};
  S.E = blatt('Einstellungen', [['Einstellung', 'Wert'], ['Return Tool ID', 'RT'], ['Analyse Tool ID', 'AT'], ['Such-Tabs', 'Online'],
    ['Hinweis-Tabs', 'Stationär, Analyse, Berner Brocki, Caritas, Heilsarmee, Scanner'], ['Laufzeit Tage', '6'], ['Versandsatz', 'Versand per Post.'], ['Schlusssatz', '30 Tage Garantie.'],
    ['Provision %', '12'], ['Preisvorschlag bis Stunden nach Auktionsende', '24']]);
  S.V = blatt('Versand', [['Klasse', 'bis kg', 'Preis', 'Sperrgut'], ['PostPac B-Post bis 2 kg', 2, 9, 'nein']]);
  S.LOG = blatt('Log', [['Zeit']]);
  S.RT = {
    Online: rtTab('Online', [{ id: 'PG-100', name: 'Philips Toaster HD2581', bc: '8710103855891', ort: 'TEC-1', vp: 30, ovp: 60, link: 'https://www.galaxus.ch/de/s4/product/philips-toaster-hd2581-5551234' },
      { id: 'PG-101', name: 'Kabel USB-C 2 m', bc: 4006381333931, ort: 'TEC-2', vp: 8, ovp: 15 }]),
    'Stationär': rtTab('Stationär', [{ id: 'PG-200', name: 'Philips Toaster HD2581', bc: '8710103855891', ort: 'HOM-12', vp: 25, ovp: 60 },
      { id: 'PG-201', name: 'Koor Boho Lampe', bc: '07613081105484', ort: 'HOM-3', vp: 40, ovp: 90 }]),
    Analyse: rtTab('Analyse', [{ id: 'PG-300', name: 'Stihl GTA 26', bc: '943578645', ort: 'Analyse', vp: 100, ovp: 200 }]),
    'Berner Brocki': rtTab('Berner Brocki', []), Caritas: rtTab('Caritas', []), Heilsarmee: rtTab('Heilsarmee', []),
    Scanner: rtTab('Scanner', [{ name: 'Paulmann SimpLED Stripe', bc: '4000870789735', ort: 'HOM-44' }], true),
    'Archiv Entsorgt': rtTab('Archiv Entsorgt', [{ id: 'PG-50', name: 'Sodastream Crystal', bc: '7290014754545', ort: '' }, { id: 'PG-301', name: 'Bosch Akkuschrauber', bc: '3165140000001', ort: '' }])
  };
  const ANA_KOPF = ['PG-ID', 'Analyse-Nr', 'Bezeichnung', 'EAN', 'Titel', 'Artikelbeschrieb', 'Ricardo-Zustand', 'Grade', 'Startpreis CHF', 'Neupreis CHF', 'Versandklasse', 'Versand CHF', 'Foto-Ordner', 'Fotos', 'Kürzel', 'Analysiert am'];
  S.ANA = blatt('Ricardo', [ANA_KOPF,
    ['PG-300', 'A-000007', 'Stihl GTA 26', '943578645', 'Stihl GTA 26 Akku-Säge', 'Text.', 'Gebraucht', 'C', 90, 200, '0-2kg / PostPac B-Post', 9, '', 3, 'JB', new Date(2026, 9, 20)],
    ['AN-0008', 'A-000008', 'Paulmann SimpLED Stripe', '4000870789735', 'Paulmann LED-Streifen', 'Text.', 'Neu (gemäss Beschreibung)', 'B', 20, 40, '0-2kg / PostPac B-Post', 9, '', 3, 'JB', new Date(2026, 9, 20)],
    ['PG-301', 'A-000009', 'Bosch Akkuschrauber', '3165140000001', 'Bosch Akkuschrauber', 'Text.', 'Gebraucht', 'C', 30, 80, '0-2kg / PostPac B-Post', 9, '', 3, 'JB', new Date(2026, 9, 20)]]);
  const MM_KOPF = ['PG-ID', 'Analyse-Nr', 'Bezeichnung', 'EAN', 'Suchauftrag', 'Titel', 'Artikelbeschrieb', 'Zustand', 'Grade', 'Preis CHF', 'Neupreis CHF', 'Versandklasse', 'Versand CHF', 'Foto-Ordner', 'Fotos', 'Kürzel', 'Analysiert am', 'Status'];
  S.MM = blatt('Matchmaker', [MM_KOPF, ['PG-400', 'A-000010', 'Föhn Dyson', '', 'Föhn gesucht', 'Dyson Föhn', 'Text', 'Gebraucht', 'C', 80, 400, '0-2kg / PostPac B-Post', 9, '', 3, 'JB', new Date(2026, 9, 20), 'Offen']]);
  S.CACHE = {}; S.PROPS = {}; S.oeffnen = 0;
  const ext = {
    AT: { getName: () => 'AT', getSheetByName: n => ({ Ricardo: S.ANA, Matchmaker: S.MM })[n] || null },
    RT: { getName: () => 'RT', getSheetByName: n => S.RT[n] || null, getSheets: () => Object.keys(S.RT).map(n => S.RT[n]) }
  };
  const fmt = (d, tz, f) => { const p = n => ('0' + n).slice(-2); const m = { yyyy: d.getFullYear(), MM: p(d.getMonth() + 1), M: d.getMonth() + 1, dd: p(d.getDate()), d: d.getDate(), HH: p(d.getHours()), H: d.getHours(), mm: p(d.getMinutes()), m: d.getMinutes(), u: d.getDay() || 7 }; return f.replace(/yyyy|MM|M|dd|d|HH|H|mm|m|u/g, k => m[k]); };
  const ctx = {
    console, Date, Math, JSON, Object, String, Number, Array, RegExp, Error, isNaN, parseFloat, Buffer,
    SpreadsheetApp: { getActive: () => ({ getSheetByName: n => ({ Listings: S.L, Einstellungen: S.E, Versand: S.V, Log: S.LOG, 'Verkäufe': S.VK, Posteingang: S.PE, Retouren: S.RE })[n] || null }),
      openById: id => { if (id === 'RT') S.oeffnen++; return ext[id]; } },
    LockService: { getScriptLock: () => ({ waitLock() {}, tryLock() { return true; }, releaseLock() {} }) },
    Session: { getActiveUser: () => ({ getEmail: () => 'test@pretty-good.ch' }), getEffectiveUser: () => ({ getEmail: () => 'test@pretty-good.ch' }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => S.PROPS[k] ?? null, setProperty: (k, v) => { S.PROPS[k] = String(v); } }) },
    Utilities: { formatDate: fmt, parseDate: (s) => { const m = /(\d+) (\d+) (\d{4}) (\d+) (\d+)/.exec(s); return new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5]); },
      newBlob: (x) => ({ x, getBytes: () => Buffer.isBuffer(x) ? x : Buffer.from(String(x)), getDataAsString: () => Buffer.from(x).toString() }),
      gzip: b => ({ getBytes: () => require('zlib').gzipSync(b.getBytes()) }), ungzip: b => ({ getDataAsString: () => require('zlib').gunzipSync(Buffer.from(b.x)).toString() }),
      base64Encode: b => Buffer.from(b).toString('base64'), base64Decode: s => Buffer.from(s, 'base64') },
    CacheService: { getScriptCache: () => ({ get: k => S.CACHE[k] ?? null, getAll: ks => { const o = {}; ks.forEach(k => { if (k in S.CACHE) o[k] = S.CACHE[k]; }); return o; }, putAll: o => Object.assign(S.CACHE, o), put: (k, v) => { S.CACHE[k] = v; }, remove: k => { delete S.CACHE[k]; } }) }
  };
  vm.createContext(ctx); vm.runInContext(src, ctx);
  S.c = n => vm.runInContext(n, ctx);
  S.ctx = ctx;
  const L = S.c('L_COLS'), V = S.c('V_COLS'), I = S.c('I_COLS'), R = S.c('R_COLS');
  S.L = blatt('Listings', [L]); S.VK = blatt('Verkäufe', [V]); S.PE = blatt('Posteingang', [I]); S.RE = blatt('Retouren', [R]);
  S.listing = o => { S.L.d.push(L.map(k => o[k] ?? '')); };
  S.verkauf = o => { S.VK.d.push(V.map(k => o[k] ?? '')); };
  S.zeile = id => { const z = S.L.d.filter(r => r[0] === id).pop(); const o = {}; L.forEach((k, i) => o[k] = z ? z[i] : undefined); return o; };
  S.neu = () => S.c('MEMO = {}; CFG = null; ANALYSE_FRISCH = null; IN_SPERRE = 0;');
  S.vcol = k => V.indexOf(k); S.icol = k => I.indexOf(k);
  vm.runInContext('wochen_ = function () {}; hauptbilder_ = function () {};', ctx);
  return S;
}

/* ---------- K1: Nummern und Barcodes normalisieren ---------- */
let S = sandbox();
ok(['PG-123', 'pg 123', "PG'123", 'PG-0123', 'pg0123'].every(x => S.c('idNorm_(' + JSON.stringify(x) + ')') === 'PG-123'), 'K1: PG-Schreibweisen gleich');
ok(S.c("idNorm_('RC-0001')") === 'RC-1' && S.c("idNorm_('AN-0008')") === 'AN-8' && S.c("idNorm_('A-000007')") === 'A-7' && S.c("idNorm_('PG-ALT-12')") === 'PG-ALT-12', 'K1: RC, AN, A, PG-ALT');
ok(S.c("normEan_('(01)07613081105484(21)ABC')") === '7613081105484' && S.c("normEan_('0761234567890')") === S.c("normEan_(761234567890)"), 'K1: GS1-Präfix weg, führende Nullen egal');
ok(S.c("matcher_('123')({ id: 'PG-123', name: 'x' })") === false && S.c("matcher_('0123')({ id: 'PG-123', name: 'x' })") === true, 'K1: reine Zahl ab 4 Stellen als PG-Nummer');
ok(S.c("matcher_('A-7')({ id: 'PG-300', nr: 'A-000007', name: '' })") === true, 'S6: Analyse-Nr (A-…) gefunden');
ok(S.c("matcher_('AN-8')({ id: 'AN-0008', name: '' })") === true && S.c("matcher_('rc 1')({ id: 'RC-0001', name: '' })") === true, 'S6: AN- und RC-Muster');
ok(S.c("matcher_('X123456F12')({ id: 'PG-1', name: 'Teil', ean: 'x123456f12' })") === true, 'K1: Barcode mit Buchstaben');

/* ---------- S1, M1, M2: alle Kanal-Tabs, Archiv, Fehler bei fehlendem Tab ---------- */
let r = S.c("suche('8710103855891')");
ok(r.treffer.length === 1 && r.treffer[0].id === 'PG-100' && r.andere.length === 1 && r.andere[0].id === 'PG-200' && r.andere[0].ort === 'HOM-12', 'S1/M1: EAN in Online und Stationär, beide mit Lagerort');
ok(r.anzahl === 2, 'M1: Anzahl für die Auswahl');
r = S.c("suche('PG-201')");
ok(r.treffer.length === 0 && r.andere.length === 1 && r.andere[0].tab === 'Stationär', 'S1: PG-ID nur in Stationär wird gefunden');
r = S.c("suche('7613081105484')");
ok(r.andere.length === 1 && r.andere[0].id === 'PG-201', 'K1: Barcode mit führender Null im Return Tool');
r = S.c("suche('pg 50')");
ok(r.archiv.length === 1 && r.archiv[0].tab === 'Archiv Entsorgt' && r.archiv[0].archiv, 'S1: Treffer im Archiv (gesperrt)');
r = S.c("suche('4000870789735')");
ok(r.andere.some(x => x.tab === 'Scanner' && !x.id), 'S1: Scanner ohne ID-Spalte als Hinweis');
ok(r.treffer.some(x => x.id === 'AN-0008') && /dasselbe Stück wie ohne ID \(Scanner\)/.test(r.treffer[0].warnung), 'S6: gleiche EAN aus Analyse und Return Tool mit Warnung');
S.RT.Online.d.push(RT_KOPF.map(k => ({ ID: 'PG-555', Bezeichnung: 'Stihl GTA 26 Ersatz', Barcode: '943578645', VP: 50 })[k] ?? ''));
S.neu(); for (const k of Object.keys(S.CACHE)) delete S.CACHE[k];
r = S.c("suche('943578645')");
ok(r.treffer.length === 2 && r.treffer.every(x => /Möglicherweise dasselbe Stück/.test(x.warnung)) && !r.andere.length, 'S6: PG-300 aus Analyse (RT-Tab «Analyse» doppelt nicht) und PG-555 aus Online, beide gewarnt');
r = S.c("suche('A-000007')");
ok(r.treffer.length === 1 && r.treffer[0].id === 'PG-300', 'S6: Suche nach Analyse-Nr');
S.E.d.push(['Hinweis-Tabs', 'Stationär, Spenden']); S.E.d = S.E.d.filter((z, i) => !(z[0] === 'Hinweis-Tabs' && i < S.E.d.length - 1)); S.c('cfgVergessen_()'); S.neu();
r = S.c("suche('Toaster')");
ok(r.treffer.length === 1 && r.lesefehler.length === 1 && /Tab «Spenden» nicht lesbar/.test(r.lesefehler[0]), 'M2/Review 2: fehlender Hinweis-Tab als Meldung, Suche läuft weiter');
S.E.d.find(z => z[0] === 'Such-Tabs')[1] = 'Online, Webshop'; S.c('cfgVergessen_()'); S.neu();
wirft(() => S.c("suche('Toaster')"), /Den Tab «Webshop» gibt es nicht/, 'M2: fehlender Such-Tab bleibt ein harter Fehler');
S.E.d.find(z => z[0] === 'Such-Tabs')[1] = 'Online';
S.E.d.find(z => z[0] === 'Hinweis-Tabs')[1] = 'Stationär, Caritas'; S.RT.Caritas.d[5] = ['Name', 'Preis']; S.c('cfgVergessen_()'); S.neu(); for (const k of Object.keys(S.CACHE)) delete S.CACHE[k];
r = S.c("suche('Toaster')");
ok(r.lesefehler.length === 1 && /Tab «Caritas» nicht lesbar: Im Tab «Caritas» fehlt die Kopfzeile/.test(r.lesefehler[0]), 'M2/Review 2: fehlende Kopfzeile im Hinweis-Tab als Meldung');
delete S.RT['Stationär']; S.neu(); for (const k of Object.keys(S.CACHE)) delete S.CACHE[k];
ok(S.c("starteListing('PG-100')").id === 'PG-100', 'Review 2: fehlender Hinweis-Tab legt den Start nicht lahm');

/* ---------- S3, S4: eigene Listings, vergebene Stücke ---------- */
S = sandbox();
S.listing({ 'PG-ID': 'RC-0003', 'Status': 'Unverkauft', 'Bezeichnung': 'Vase blau', 'Startpreis CHF': 15, 'Quelle Tab': 'Frei' });
S.listing({ 'PG-ID': 'PG-300', 'Status': 'Unverkauft', 'Bezeichnung': 'Stihl GTA 26', 'Entscheid unverkauft': 'Anderer Kanal' });
S.listing({ 'PG-ID': 'PG-301', 'Status': 'Retour abgeschlossen', 'Bezeichnung': 'Bosch Akkuschrauber', 'Entscheid unverkauft': 'Entsorgung' });
S.listing({ 'PG-ID': 'AN-0001', 'Status': 'Versendet', 'Bezeichnung': 'Altes Stück' });
r = S.c("suche('rc-3')");
ok(r.eigene.length === 1 && r.eigene[0].id === 'RC-0003' && r.eigene[0].rc && r.eigene[0].status === 'Unverkauft', 'S3: RC-Nummer aus dem Tab «Listings»');
r = S.c("suche('AN-1')");
ok(r.eigene.length === 1 && r.eigene[0].status === 'Versendet', 'S3: AN-Nummer aus dem Tab «Listings»');
r = S.c("suche('Vase')");
ok(r.eigene.length === 1, 'S3: Name aus dem Tab «Listings»');
let l = S.c("starteListing('RC-0003')");
ok(l.id === 'RC-0003' && l.status === 'In Arbeit' && S.L.d.filter(z => z[0] === 'RC-0003').length === 2, 'S3: Weg zu neuAusRc_ (neue Zeile)');
ok(!S.c('analyseListe()').some(x => x.id === 'PG-300' || x.id === 'PG-301'), 'S4: «Anderer Kanal»/«Entsorgung» nicht mehr in «Aus der Analyse»');
r = S.c("suche('Stihl')");
ok(r.treffer.length === 1 && r.treffer[0].status === 'Unverkauft' && r.treffer[0].entscheid === 'Anderer Kanal', 'S4: Suche zeigt Status und Entscheid (nicht listbar)');
wirft(() => S.c("starteListing('PG-300')"), /vergeben \(Entscheid «Anderer Kanal»\)/, 'S4: Listen gesperrt (Anderer Kanal)');
wirft(() => S.c("starteListing('PG-301')"), /vergeben \(Entscheid «Entsorgung»\)/, 'S4: Listen gesperrt (Entsorgung nach Retoure)');

/* ---------- M5: Matchmaker-Status scheitert, Listing startet nicht ---------- */
S.MM.kaputt = true;
const vorher = S.L.d.length;
wirft(() => S.c("starteListing('PG-400')"), /Listing nicht gestartet: Der Status im Matchmaker/, 'M5: Fehler beim Statuswechsel bricht ab');
ok(S.L.d.length === vorher, 'M5: keine Zeile angelegt');
S.MM.kaputt = false; S.neu();
l = S.c("starteListing('PG-400')");
ok(l.id === 'PG-400' && S.MM.d[1][17] === 'Ricardo', 'M5: geht es, startet das Listing und der Status ist «Ricardo»');

/* ---------- M6: frisch lesen, Archiv sperrt ---------- */
S = sandbox();
S.c("suche('Kabel')");                                                    // Kopie gemerkt
S.RT['Archiv Entsorgt'].d.push(S.RT.Online.d.splice(7, 1)[0]);              // PG-101 wurde eben archiviert
wirft(() => S.c("starteListing('PG-101')"), /steht im Return Tool im Tab «Archiv Entsorgt»/, 'M6: frisch gelesen, Archiv sperrt (trotz alter Kopie)');
ok(!S.L.d.some(z => z[0] === 'PG-101'), 'M6: kein Listing angelegt');
wirft(() => S.c("starteListing('PG-301')"), /steht im Return Tool im Tab «Archiv Entsorgt»/, 'M6: Stück aus der Analyse, im Return Tool archiviert: gesperrt');
l = S.c("starteListing('PG-200', true)");
ok(l.id === 'PG-200' && S.zeile('PG-200')['Quelle Tab'] === 'Stationär', 'S1: «Trotzdem listen» aus Stationär geht');
wirft(() => S.c("starteListing('PG-201')"), /nicht gefunden/, 'S1: ohne Bestätigung kein Listing aus Stationär');

/* ---------- S2 (Entscheid Jonas 24.10.2026): nur Stücke mit PG-ID; ähnliche Stücke als Hilfe bei «nicht gefunden» ---------- */
S = sandbox();
wirft(() => S.c("freiesListing({ name: 'Holzstuhl Eiche', preis: '30' })"), /^Nur Stücke mit PG-ID\. Bitte zuerst im Return Tool erfassen\.$/, 'S2: kein neues Listing ohne PG-ID');
ok(S.L.d.length === 1, 'S2: keine Zeile angelegt');
let k = S.c("aehnlicheStuecke('Philips Toaster Pro')").kandidaten;
ok(k.length >= 2 && k.some(x => x.id === 'PG-100') && k.some(x => x.id === 'PG-200'), 'S2: weiche Namensregel findet ähnliche Stücke (Marke + 60 %)');
ok(S.c("aehnlicheStuecke('Philips Rasierer')").kandidaten.length === 0, 'S2: gleiche Marke, zu wenig gleiche Wörter: nichts');
ok(S.c("aehnlicheStuecke('(01)07290014754545')").kandidaten.some(x => x.id === 'PG-50' && x.archiv && x.grund === 'EAN'), 'S2: EAN findet Stück im Archiv');
ok(S.c("aehnlicheStuecke('https://www.galaxus.ch/de/s4/product/toaster-x-5551234?utm=1')").kandidaten.some(x => x.id === 'PG-100' && x.grund === 'Galaxus-Link'), 'S2: Galaxus-Artikelnummer gegen Spalte «Link»');
S.listing({ 'PG-ID': 'RC-0002', 'Status': 'Unverkauft', 'Bezeichnung': 'Holzstuhl Eiche' }); S.neu();
ok(S.c("aehnlicheStuecke('Holzstuhl Eiche hell')").kandidaten.some(x => x.quelle === 'Listings' && x.id === 'RC-0002'), 'S2: eigene Listings als ähnliche Stücke');
ok(S.c("starteListing('RC-0002')").id === 'RC-0002', 'S2: bestehendes RC-Listing lässt sich neu listen');

/* ---------- S5, M3: Neu listen behält den alten Link, Zuordnung über die Artikel-Nr ---------- */
S = sandbox();
S.listing({ 'PG-ID': 'PG-100', 'Status': 'Bereit', 'Bezeichnung': 'Philips Toaster', 'Ricardo-Link': 'https://www.ricardo.ch/de/a/toaster-1111111111/', 'Entscheid unverkauft': 'Neu listen',
  'Startpreis CHF': 30, 'Zustand': 'Gebraucht', 'Mängel': 'Kratzer', 'Mängel Text': 'Kratzer.', 'Getestet': 'ja', 'Gewicht bis kg': 2, 'Versandklasse': 'PostPac B-Post bis 2 kg', 'Titel': 'Philips Toaster', 'Beschrieb': 'Zustand: Gebraucht\nMängel: Kratzer.' });
l = S.c("markiereGelistet('PG-100', 'https://www.ricardo.ch/de/a/toaster-2222222222/')");
z = S.zeile('PG-100');
ok(z['Ricardo-Link'].indexOf('2222222222') > 0 && z['Frühere Links'].indexOf('1111111111') > 0, 'S5: alter Link in «Frühere Links»');
const sv = S.ctx.SpreadsheetApp.getActive().getSheetByName('Verkäufe'), sl = S.ctx.SpreadsheetApp.getActive().getSheetByName('Listings'), si = S.ctx.SpreadsheetApp.getActive().getSheetByName('Posteingang');
S.neu();
let kt = S.c('karten_')(sv, sl, si);
const mail = (o) => Object.assign({ art: 'Verkauf', referenz: 'PG-100', titel: 'Philips Toaster', preis: 30, versand: 9, total: 39, kaeufer: 'k1', lieferart: 'Paket B-Post', datum: new Date() }, o);
S.c('mailWirkung_')(mail({ id: 'm1', artikel: '1111111111', verkauf: '9001' }), kt, []);
kt.schreiben();
z = S.zeile('PG-100');
let vz = S.VK.d[1], pe = S.PE.d;
ok(z['Status'] === 'Gelistet' && vz[S.vcol('PG-ID')] === 'PG-100', 'S5: Verkauf des alten Angebots (Referenz passt): kein Statuswechsel, PG-ID eingetragen');
ok(pe.length === 2 && pe[1][0] === 'W-9001' && pe[1][S.icol('Art')] === 'Hinweis' && /früheres Angebot/.test(pe[1][S.icol('Text')]), 'S5: Hinweis unter «Zu erledigen»');
S.neu(); kt = S.c('karten_')(sv, sl, si);
S.c('mailWirkung_')(mail({ id: 'm2', artikel: '3333333333', verkauf: '9002' }), kt, []);
kt.schreiben();
ok(S.zeile('PG-100')['Status'] === 'Gelistet' && /passt, die Artikel-Nr 3333333333 aber nicht/.test(S.PE.d[2][S.icol('Text')]), 'S5: Referenz und Artikel-Nr widersprechen sich: Warnung, kein Statuswechsel');
S.neu(); kt = S.c('karten_')(sv, sl, si);
S.c('mailWirkung_')(mail({ id: 'm3', artikel: '2222222222', verkauf: '9003', referenz: '' }), kt, []);
kt.schreiben();
ok(S.zeile('PG-100')['Status'] === 'Verkauft' && S.zeile('PG-100')['Verkauf-Nr'] === '9003', 'S5: Verkauf über die aktuelle Artikel-Nr setzt «Verkauft»');
/* M3: zweiter Verkauf (Bericht) auf ein schon verkauftes Stück */
const CSV = 'Order ID;Article ID;ArticleTitle;ReferenceNumber;EndDate;Selling Price;ShippingCost;BuyerNick;BuyerFirstName;BuyerLastName;BuyerAddress;BuyerZipCode;BuyerCity;DeliveryDescription;ShippingStatus\n' +
  '9004;2222222222;Philips Toaster;PG-100;24.10.2026 10:00;31;9;k4;Vera;Muster;Testweg  1;3000;Bern;Paket B-Post;Offen\n';
S.neu();
const imp = S.c('importVerkaeufe')(CSV);
ok(imp.import.warnungen === 1 && S.zeile('PG-100')['Verkauf-Nr'] === '9003', 'M3: zweiter Verkauf ändert das Listing nicht');
ok(S.PE.d.some(z => z[0] === 'W-9004' && /Zweiter Verkauf auf PG-100/.test(z[S.icol('Text')])), 'M3: Hinweis «Zweiter Verkauf»');
S.neu();
const ta = S.c("ablauf('taeglich')");
ok(ta.doppelt.length === 1 && ta.doppelt[0].pgId === 'PG-100' && ta.doppelt[0].verkaeufe.length === 4, 'M3: «Täglich» zeigt das Stück mit mehreren Verkäufen');
/* S5: Preisvorschlag ohne bekanntes Angebot */
ok(/^Prüfen/.test(S.c('empfehlung_')(null, new Date())) && /^Prüfen/.test(S.c('empfehlung_')(S.L.d[1].map((x, i) => i === 1 ? 'Gelistet' : (i === S.c("col_('Gelistet am')") - 1 ? '' : x)), new Date())), 'S5: Preisvorschlag ohne Angebot oder Auktionsende: «Prüfen»');

/* ---------- M4: «Unverkauft» von Hand ---------- */
S = sandbox();
S.listing({ 'PG-ID': 'PG-100', 'Status': 'Gelistet', 'Bezeichnung': 'Philips Toaster', 'Titel': 'Philips Toaster HD2581', 'Ricardo-Link': 'https://www.ricardo.ch/de/a/x-4444444444/' });
S.listing({ 'PG-ID': 'PG-101', 'Status': 'Gelistet', 'Bezeichnung': 'Kabel', 'Titel': 'Kabel USB-C 2 m', 'Ricardo-Link': 'https://www.ricardo.ch/de/a/x-5555555555/' });
S.verkauf({ 'Verkauf-Nr': '7001', 'Artikel-Nr': '6666666666', 'PG-ID': '', 'Titel': 'Neu: Philips Toaster HD2581', 'Status': 'Zu packen' });
wirft(() => S.c("setzeStatus('PG-100', 'Unverkauft', true)"), /gesperrt: Verkauf 7001 .* könnte zu PG-100 gehören/, 'M4: passender unzugeordneter Verkauf sperrt, auch mit Bestätigung');
wirft(() => S.c("setzeStatus('PG-101', 'Unverkauft')"), /Bitte bestätigen: 1 Verkäufe/, 'M4: anderer unzugeordneter Verkauf: Bestätigung nötig');
S.c("setzeStatus('PG-101', 'Unverkauft', true)");
ok(S.zeile('PG-101')['Status'] === 'Unverkauft', 'M4: mit Bestätigung geht es');
ok(S.c('uebersicht()').unzugeordnet.length === 1, 'M4: Übersicht liefert die unzugeordneten Verkäufe für die Warnung');

/* ---------- K6: Rückzahlung höchstens Preis + Porto ---------- */
S = sandbox();
S.listing({ 'PG-ID': 'PG-100', 'Status': 'Retourniert' });
S.RE.d.push(S.c('R_COLS').map(k => ({ 'Retoure-Nr': 'RT-0001', 'Status': 'Offen', 'PG-ID': 'PG-100', 'Preis CHF': 40, 'Versand CHF': 9 })[k] ?? ''));
wirft(() => S.c("retoureSchritt('RT-0001', 'rueckzahlung', '490')"), /^Bitte bestätigen: Die Rückzahlung \(CHF 490\.00\) ist mehr als Preis und Porto \(CHF 49\.00\)/, 'K6/Review 3: 490 statt 49 verlangt Bestätigung');
ok(S.RE.d[1][S.c('R_COLS').indexOf('Rückzahlung CHF')] === '', 'K6: ohne Bestätigung nichts erfasst');
S.neu(); S.c("retoureSchritt('RT-0001', 'rueckzahlung', '58', true)");
ok(S.RE.d[1][S.c('R_COLS').indexOf('Rückzahlung CHF')] === 58, 'Review 3: mit Bestätigung mehr als Preis + Porto (Rückporto)');
S = sandbox();
S.RE.d.push(S.c('R_COLS').map(k => ({ 'Retoure-Nr': 'RT-0002', 'Status': 'Offen', 'PG-ID': 'PG-100' })[k] ?? ''));
wirft(() => S.c("retoureSchritt('RT-0002', 'rueckzahlung', '20')"), /^Bitte bestätigen: Der Preis des Verkaufs ist unbekannt/, 'Review 3: Preis unbekannt verlangt Bestätigung');
S.neu(); S.c("retoureSchritt('RT-0002', 'rueckzahlung', '20', true)");
ok(S.RE.d[1][S.c('R_COLS').indexOf('Rückzahlung CHF')] === 20, 'Review 3: mit Bestätigung erfasst');
S = sandbox(); S.listing({ 'PG-ID': 'PG-100', 'Status': 'Retourniert' });
S.RE.d.push(S.c('R_COLS').map(k => ({ 'Retoure-Nr': 'RT-0001', 'Status': 'Offen', 'PG-ID': 'PG-100', 'Preis CHF': 40, 'Versand CHF': 9 })[k] ?? ''));
S.c("retoureSchritt('RT-0001', 'rueckzahlung', '49')");
ok(S.RE.d[1][S.c('R_COLS').indexOf('Rückzahlung CHF')] === 49, 'K6: Preis + Porto geht ohne Bestätigung');

/* ---------- K7: MAIL_LETZTE erst nach erfolgreichem Schreiben ---------- */
S = sandbox();
const msg = (betreff, text) => ({ getDate: () => new Date(), getSubject: () => betreff, getPlainBody: () => text, getId: () => 'g1',
  getRawContent: () => 'Authentication-Results: mx.google.com; dkim=pass header.i=@mail.ricardo.ch\r\n\r\nx' });
S.ctx.GmailApp = { search: () => [{ getMessages: () => [msg('Beantworte die Frage zu deinem Angebot: Toaster', '\nkaeufer fragt:\nGeht er?\nBEANTWORTE DIESE FRAGE\nArtikelnummer: 1234567890')] }] };
S.PROPS.MAIL_KONTO = 'test@pretty-good.ch'; S.PROPS.MAIL_STAND = String(Date.now() - 600000);
S.PE.kaputt = true;
wirft(() => S.c('mailsLesen_()'), /Sheet kaputt/, 'K7: Schreiben scheitert');
ok(!S.PROPS.MAIL_LETZTE, 'K7: MAIL_LETZTE bleibt leer, wenn das Schreiben scheitert');
S.PE.kaputt = false; S.neu();
S.c('mailsLesen_()');
ok(Number(S.PROPS.MAIL_LETZTE) > 0 && S.PE.d.length === 2, 'K7: nach erfolgreichem Schreiben gesetzt');

/* ---------- Review 24.10.2026 ---------- */
/* 1: neu gelistet über eine NEUE Zeile, Verkauf über den alten Link */
S = sandbox();
S.listing({ 'PG-ID': 'PG-100', 'Status': 'Unverkauft', 'Bezeichnung': 'Toaster', 'Ricardo-Link': 'https://www.ricardo.ch/de/a/t-1111111111/' });
S.listing({ 'PG-ID': 'PG-100', 'Status': 'Gelistet', 'Bezeichnung': 'Toaster', 'Ricardo-Link': 'https://www.ricardo.ch/de/a/t-2222222222/', 'Gelistet am': new Date() });
{
  const sv = S.ctx.SpreadsheetApp.getActive().getSheetByName('Verkäufe'), sl = S.ctx.SpreadsheetApp.getActive().getSheetByName('Listings'), si = S.ctx.SpreadsheetApp.getActive().getSheetByName('Posteingang');
  S.neu(); let kt = S.c('karten_')(sv, sl, si);
  S.c('mailWirkung_')({ art: 'Verkauf', referenz: 'PG-100', artikel: '1111111111', verkauf: '8001', titel: 'Toaster', preis: 30, versand: 9, total: 39, kaeufer: 'k', lieferart: 'x', datum: new Date(), id: 'm' }, kt, []);
  kt.schreiben();
  ok(S.L.d[1][1] === 'Unverkauft' && S.L.d[2][1] === 'Gelistet', 'Review 1: alte und neue Zeile behalten ihren Status');
  ok(S.PE.d.some(z => z[0] === 'W-8001' && /früheres Angebot \(Artikel-Nr 1111111111\)/.test(z[S.icol('Text')])) && S.VK.d[1][S.vcol('PG-ID')] === 'PG-100', 'Review 1: Hinweis «früheres Angebot», PG-ID am Verkauf');
  S.neu(); kt = S.c('karten_')(sv, sl, si);
  ok(S.c('mailWirkung_')({ art: 'Nicht verkauft', artikel: '1111111111', id: 'n1', datum: new Date() }, kt, []) === false && S.L.d[2][1] === 'Gelistet', 'Review 1: «nicht verkauft» zum alten Angebot ändert die neue Zeile nicht');
  S.neu(); kt = S.c('karten_')(sv, sl, si);
  S.c('mailWirkung_')({ art: 'Verkauf', referenz: 'PG-100', artikel: '2222222222', verkauf: '8002', titel: 'Toaster', preis: 30, versand: 9, total: 39, kaeufer: 'k', lieferart: 'x', datum: new Date(), id: 'm2' }, kt, []);
  kt.schreiben();
  ok(S.L.d[2][1] === 'Verkauft', 'Review 1: Verkauf über den aktuellen Link setzt die neue Zeile auf «Verkauft»');
}
/* 2: «einrichten» entfernt «Spenden» auch aus einem von Hand geänderten Wert */
S = sandbox();
S.E.d.find(z => z[0] === 'Hinweis-Tabs')[1] = 'Stationär, Spenden, Caritas';
S.c('hinweisTabsBereinigen_')(S.E);
ok(S.E.d.find(z => z[0] === 'Hinweis-Tabs')[1] === 'Stationär, Caritas', 'Review 2: «einrichten» entfernt nur «Spenden»');
S.E.d.find(z => z[0] === 'Hinweis-Tabs')[1] = 'Stationär, Caritas, Heilsarmee, Berner Brocki, Spenden'; S.c('hinweisTabsBereinigen_')(S.E);
ok(S.E.d.find(z => z[0] === 'Hinweis-Tabs')[1] === S.c('HINWEIS_TABS'), 'Review 2: alte Vorgabe wird ganz ersetzt');
/* 4: zweiter Durchgang ohne Treffer liest Hinweis- und Archiv-Tabs aus der Kopie */
S = sandbox();
S.c("suche('nichtsda xyz')");
const gelesen = {}; Object.keys(S.RT).forEach(n => { const alt = S.RT[n].getDataRange; S.RT[n].getDataRange = () => { gelesen[n] = (gelesen[n] || 0) + 1; return alt(); }; });
S.neu(); S.c("suche('nochmals nichts')");
ok(gelesen.Online === 1 && !gelesen['Stationär'] && !gelesen['Archiv Entsorgt'], 'Review 4: ohne Treffer nur Such-Tabs frisch (' + JSON.stringify(gelesen) + ')');
/* 5: 4 bis 7 Ziffern auch im Namen */
S = sandbox(); S.RT.Online.d.push(RT_KOPF.map(k => ({ ID: 'PG-900', Bezeichnung: 'Bosch Serie 4 Geschirrspüler 6000', VP: 50 })[k] ?? ''));
ok(S.c("suche('6000')").treffer.some(x => x.id === 'PG-900'), 'Review 5: Zahl im Namen gefunden');
/* 7, 8: Nummer aktiv UND im Archiv */
S = sandbox();
S.RT['Archiv Entsorgt'].d.push(RT_KOPF.map(k => ({ ID: 'PG-101', Bezeichnung: 'Kabel alt' })[k] ?? ''));
wirft(() => S.c("starteListing('PG-101')"), /^Bitte bestätigen: PG-101 steht im Return Tool aktiv im Tab «Online» und zugleich im Tab «Archiv Entsorgt»/, 'Review 8: aktiv und im Archiv verlangt Bestätigung');
ok(!S.L.d.some(z => z[0] === 'PG-101'), 'Review 8: ohne Bestätigung kein Listing');
S.neu(); ok(S.c("starteListing('PG-101', false, true)").id === 'PG-101', 'Review 8: mit Bestätigung gestartet');
S = sandbox();
S.listing({ 'PG-ID': 'PG-100', 'Status': 'In Arbeit', 'Bezeichnung': 'Toaster', 'Startpreis CHF': 30, 'Quelle Tab': 'Online' });
wirft(() => S.c("buendelHinzu('PG-100', 'PG-50')"), /steht im Return Tool im Tab «Archiv Entsorgt»/, 'Review 7: Bündel-Teil im Archiv gesperrt');
S.RT['Archiv Entsorgt'].d.push(RT_KOPF.map(k => ({ ID: 'PG-101', Bezeichnung: 'Kabel alt' })[k] ?? '')); S.neu();
wirft(() => S.c("buendelHinzu('PG-100', 'PG-101')"), /aktiv und zugleich im Tab «Archiv Entsorgt»/, 'Review 7: Bündel-Teil aktiv und im Archiv gesperrt');

console.log(fehler ? fehler + ' Fehler' : 'alle Tests ok'); process.exit(fehler ? 1 : 0);
