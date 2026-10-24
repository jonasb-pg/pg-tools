/* Ricardo Tool: Tempo der Suche (24.10.2026, Version .2): Vorrat im Zwischenspeicher, schlanke Kopien, Start liest frisch. Erfundene Daten. Lauf: node tests/t_ricardo_vorrat.js */
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

const S = sandbox();
/* Zugriffe auf den Zwischenspeicher zählen */
const cs = S.ctx.CacheService.getScriptCache();
let zugriffe = 0, liest = 0;
S.ctx.CacheService.getScriptCache = () => ({ get: k => { zugriffe++; return cs.get(k); }, getAll: ks => { zugriffe++; return cs.getAll(ks); }, putAll: cs.putAll, put: cs.put, remove: cs.remove });
for (const n of Object.keys(S.RT)) { const sh = S.RT[n], g = sh.getDataRange; sh.getDataRange = () => { liest++; return g(); }; }
S.RT['Stationär'].d[6].push('x'); // Spalte ohne Kopf: egal
/* 1. Erste Suche ohne Vorrat: liest alles, merkt sich Hinweis-Tabs schlank */
let r = S.c("suche('Toaster')");
ok(r.treffer.length === 1 && r.andere.length === 1, 'Toaster: 1 Treffer Online, 1 in Stationär');
const st = S.c("gepacktLesen_('rt:Stationär')");
ok(st && st[0].schlank === true && st[0].spez === undefined && st[0].kat === undefined, 'Stationär schlank gemerkt');
const on = S.c("gepacktLesen_('rt:Online')");
ok(on && !on[0].schlank && on[0].ovp === 60, 'Online ganz gemerkt (mit Neupreis)');
ok(S.c('VORRAT') === null, 'Vorrat nach der Suche geleert');
/* 2. Zweite Suche: kein Tab des Return Tools wird gelesen, wenige Zugriffe */
liest = 0; zugriffe = 0;
r = S.c("suche('Lampe')");
ok(r.andere.length === 1 && r.andere[0].id === 'PG-201', 'Lampe aus der Kopie (Stationär)');
ok(liest === 0, 'kein Tab frisch gelesen (' + liest + ')');
ok(zugriffe <= 8, 'wenige Zugriffe auf den Zwischenspeicher (' + zugriffe + ')');
/* 3. Schlanke Kopie gilt nie für Start oder Bündel: findeQuelle_ liest frisch */
liest = 0;
const q = S.c("findeQuelle_('PG-200', true)");
ok(q && q.ovp === 60 && !q.schlank, 'findeQuelle_ mit schlanker Kopie: frisch gelesen, mit Neupreis');
ok(liest >= 1, 'dafür frisch gelesen');
/* 4. Nichts gefunden: zweiter Durchgang liest Such-Tabs frisch, Hinweis- und Archiv-Tabs nicht */
S.RT.Online.d.push(['', 'PG-102', '', '', 'Neues Radio Sangean', '', '', '', '', 20, 10, '', '', 'TEC-9', '']);
liest = 0;
r = S.c("suche('Sangean')");
ok(r.treffer.length === 1 && r.treffer[0].id === 'PG-102', 'eben erfasst: im zweiten Durchgang gefunden');
ok(liest === 1, 'nur Online frisch gelesen (' + liest + ')');
/* 5. suchVorrat: nachts nichts, tags alles; danach Analyse aus der langen Kopie */
const echt = S.ctx.Date;
const fest = (h) => { S.ctx.Date = class extends echt { constructor(...a) { if (a.length) super(...a); else super(2026, 9, 24, h, 0); } static now() { return new echt(2026, 9, 24, h, 0).getTime(); } }; };
Object.keys(S.CACHE).forEach(k => delete S.CACHE[k]);
fest(3); liest = 0; S.c('suchVorrat()'); ok(liest === 0, 'suchVorrat um 3 Uhr: nichts');
fest(9); liest = 0; S.c('suchVorrat()');
ok(liest === Object.keys(S.RT).length, 'suchVorrat um 9 Uhr: alle Tabs gelesen (' + liest + ')');
ok(!!S.c("gepacktLesen_('ana-lang:' + VERSION)"), 'lange Kopie der Analyse da');
liest = 0; S.c('suchVorrat()'); ok(liest === 1, 'nächster Lauf: nur Such-Tab (' + liest + ')');
S.ctx.Date = echt;
delete S.CACHE['ana:' + S.c('VERSION') + ':n'];
S.c('ANALYSE_FRISCH = null');
let anaOeffnen = 0; const op = S.ctx.SpreadsheetApp.openById; S.ctx.SpreadsheetApp.openById = id => { if (id === 'AT') anaOeffnen++; return op(id); };
r = S.c("suche('Stihl')");
ok(r.treffer.length === 1 && r.treffer[0].quelle === 'analyse' && anaOeffnen === 0, 'Suche nimmt die lange Kopie der Analyse (ANALYSE TOOL nicht geöffnet)');
S.c('ANALYSE_FRISCH = null');
S.c("analyseListe()"); ok(anaOeffnen === 1, 'Liste «Aus der Analyse» liest weiter frisch nach 60 s');
console.log(fehler ? fehler + ' FEHLER' : 'alle Tests ok'); process.exit(fehler ? 1 : 0);
