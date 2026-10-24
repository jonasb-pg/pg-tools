/* Ricardo Tool, Prüfung 24.10.2026: gemeinsame Sandbox für die Tests t_ricardo_p2410_*.js (Mock-Sheets, Return Tool, ANALYSE TOOL, Dienste).
   Erfundene Daten, keine Netzwerkzugriffe. Direkt aufgerufen tut die Datei nichts. */
const fs = require('fs'), vm = require('vm'), path = require('path');
const src = fs.readFileSync(process.env.RICARDO_CODE || path.join(__dirname, '../apps/ricardo/Code.gs'), 'utf8');   // RICARDO_CODE: anderen Stand prüfen (z.B. den alten)
let fehler = 0;
const ok = (b, m) => { if (!b) { fehler++; console.log('FEHLER', m); } else console.log('ok', m); };
const wirft = (f, re, m) => { let t = ''; try { f(); } catch (e) { t = e.message; } ok(re.test(t), m + (t ? ' [' + t.slice(0, 220) + ']' : ' [kein Fehler]')); return t; };

function blatt(name, rows) {
  const d = rows.map(r => r.slice());
  const breite = () => Math.max(0, ...d.map(r => r.length));
  const sh = {
    d, getName: () => name, getLastRow: () => d.length, getLastColumn: () => breite(), getMaxColumns: () => Math.max(60, breite()), getMaxRows: () => sh.maxRows || d.length + 100,
    insertRowsAfter: (r, n) => { sh.eingefuegt = (sh.eingefuegt || 0) + n; sh.maxRows = (sh.maxRows || d.length) + n; },
    appendRow: r => { if (sh.kaputt) throw new Error('Sheet kaputt'); d.push(r.slice()); },
    deleteRow: r => { d.splice(r - 1, 1); },
    getDataRange: () => { sh.gelesen = (sh.gelesen || 0) + 1; return sh.getRange(1, 1, d.length, breite()); },
    getRange: (r, c, nr, nc) => ({
      getValues: () => { const o = []; for (let i = 0; i < (nr || 1); i++) { const z = []; for (let j = 0; j < (nc || 1); j++) z.push(((d[r - 1 + i] || [])[c - 1 + j]) ?? ''); o.push(z); } return o; },
      getValue: () => ((d[r - 1] || [])[c - 1]) ?? '',
      setValue: v => { if (sh.kaputt) throw new Error('Sheet kaputt'); while (d.length < r) d.push([]); d[r - 1][c - 1] = v; },
      setValues: v => {
        if (sh.kaputt) throw new Error('Sheet kaputt');
        if (sh.maxRows && r + v.length - 1 > sh.maxRows) throw new Error('Zeilen reichen nicht (Vertrag V2)');
        v.forEach((z, i) => { while (d.length < r + i) d.push([]); z.forEach((x, j) => { d[r - 1 + i][c - 1 + j] = x; }); });
      },
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
const ANA_KOPF = ['PG-ID', 'Analyse-Nr', 'Bezeichnung', 'EAN', 'Titel', 'Artikelbeschrieb', 'Ricardo-Zustand', 'Grade', 'Startpreis CHF', 'Neupreis CHF', 'Versandklasse', 'Versand CHF', 'Foto-Ordner', 'Fotos', 'Kürzel', 'Analysiert am'];
const MM_KOPF = ['PG-ID', 'Analyse-Nr', 'Bezeichnung', 'EAN', 'Suchauftrag', 'Titel', 'Artikelbeschrieb', 'Zustand', 'Grade', 'Preis CHF', 'Neupreis CHF', 'Versandklasse', 'Versand CHF', 'Foto-Ordner', 'Fotos', 'Kürzel', 'Analysiert am', 'Status'];
const ana = (id, name, am) => [id, 'A-' + id.slice(3), name, '', name + ' Titel', 'Text.', 'Gebraucht', 'C', 90, 200, '0-2kg / PostPac B-Post', 9, '', 3, 'JB', am || new Date(2026, 9, 20)];
const mm = (id, name, status, auftrag, am) => [id, 'A-' + id.slice(3), name, '', auftrag || 'Auftrag ' + name, name, 'Text', 'Gebraucht', 'C', 80, 400, '0-2kg / PostPac B-Post', 9, '', 3, 'JB', am || new Date(2026, 9, 20), status];
/* Ein vollständiges Listing (Status «Bereit»), damit markiereGelistet geht */
const KOMPLETT = { 'Startpreis CHF': 30, 'Zustand': 'Gebraucht', 'Mängel': 'Kratzer', 'Mängel Text': 'Kratzer.', 'Getestet': 'ja', 'Gewicht bis kg': 2,
  'Versandklasse': 'PostPac B-Post bis 2 kg', 'Titel': 'Philips Toaster', 'Beschrieb': 'Zustand: Gebraucht\nMängel: Kratzer.', 'Bezeichnung': 'Philips Toaster', 'Quelle Tab': 'Online' };
const CSV_KOPF = 'Order ID;Article ID;ArticleTitle;ReferenceNumber;EndDate;Selling Price;ShippingCost;BuyerNick;BuyerFirstName;BuyerLastName;BuyerAddress;BuyerZipCode;BuyerCity;DeliveryDescription;ShippingStatus\n';

/* opt: { rt: {Tab: blatt}, ana: [Zeilen], mm: [Zeilen], einst: {Name: Wert} } */
function sandbox(opt) {
  opt = opt || {};
  const S = { logs: [], flush: 0, mails: [], fetch: [], gesperrt: 0, sperrenMax: 0 };
  const einst = Object.assign({ 'Return Tool ID': 'RT', 'Analyse Tool ID': 'AT', 'Such-Tabs': 'Online', 'Hinweis-Tabs': 'Stationär, Analyse, Berner Brocki, Caritas, Heilsarmee, Scanner',
    'Laufzeit Tage': '6', 'Versandsatz': 'Versand per Post.', 'Schlusssatz': '30 Tage Garantie.', 'Provision %': '12', 'Preisvorschlag bis Stunden nach Auktionsende': '24' }, opt.einst || {});
  S.E = blatt('Einstellungen', [['Einstellung', 'Wert']].concat(Object.keys(einst).map(k => [k, einst[k]])));
  S.V = blatt('Versand', [['Klasse', 'bis kg', 'Preis', 'Sperrgut'], ['PostPac B-Post bis 2 kg', 2, 9, 'nein']]);
  S.LOG = { getName: () => 'Log', appendRow: r => S.logs.push(r) };
  S.RT = opt.rt || {
    Online: rtTab('Online', [{ id: 'PG-100', name: 'Philips Toaster HD2581', bc: '8710103855891', ort: 'TEC-1', vp: 30, ovp: 60 }, { id: 'PG-101', name: 'Kabel USB-C 2 m', bc: '4006381333931', ort: 'TEC-2', vp: 8, ovp: 15 }]),
    'Stationär': rtTab('Stationär', [{ id: 'PG-200', name: 'Koor Boho Lampe', bc: '07613081105484', ort: 'HOM-3', vp: 40, ovp: 90 }]),
    Analyse: rtTab('Analyse', [{ id: 'PG-300', name: 'Stihl GTA 26', ort: 'Analyse', vp: 100, ovp: 200 }]),
    'Berner Brocki': rtTab('Berner Brocki', []), Caritas: rtTab('Caritas', []), Heilsarmee: rtTab('Heilsarmee', []),
    Scanner: rtTab('Scanner', [], true), 'Archiv Entsorgt': rtTab('Archiv Entsorgt', [{ id: 'PG-50', name: 'Sodastream Crystal', ort: '' }])
  };
  S.ANA = blatt('Ricardo', [ANA_KOPF].concat(opt.ana || [ana('PG-300', 'Stihl GTA 26')]));
  S.MM = blatt('Matchmaker', [MM_KOPF].concat(opt.mm || []));
  S.CACHE = {}; S.PROPS = {}; S.oeffnen = 0;
  const ext = {
    AT: { getName: () => 'AT', getSheetByName: n => ({ Ricardo: S.ANA, Matchmaker: S.MM })[n] || null },
    RT: { getName: () => 'RT', getSheetByName: n => S.RT[n] || null, getSheets: () => Object.keys(S.RT).map(n => ({ getName: () => n })) }
  };
  const fmt = (d, tz, f) => { const p = n => ('0' + n).slice(-2); const m = { yyyy: d.getFullYear(), MM: p(d.getMonth() + 1), M: d.getMonth() + 1, dd: p(d.getDate()), d: d.getDate(), HH: p(d.getHours()), H: d.getHours(), mm: p(d.getMinutes()), m: d.getMinutes(), u: d.getDay() || 7 }; return f.replace(/yyyy|MM|M|dd|d|HH|H|mm|m|u/g, k => m[k]); };
  S.aktiv = 'test@pretty-good.ch'; S.besitzer = 'test@pretty-good.ch';
  const ctx = {
    console, Date, Math, JSON, Object, String, Number, Array, RegExp, Error, isNaN, parseFloat, Buffer, Promise,
    SpreadsheetApp: { getActive: () => ({ getSheetByName: n => ({ Listings: S.L, Einstellungen: S.E, Versand: S.V, Log: S.LOG, 'Verkäufe': S.VK, Posteingang: S.PE, Retouren: S.RE })[n] || null }),
      openById: id => {
        if (id === 'RT') S.oeffnen++;
        if (id === 'AT') S.atOeffnen = (S.atOeffnen || 0) + 1;
        if (S.gesperrt > 0) S.externInSperre = (S.externInSperre || 0) + 1;     // Prüfung 10: externe Tabellen nie in der Sperre öffnen
        return ext[id];
      }, flush: () => { S.flush++; } },
    LockService: { getScriptLock: () => ({ waitLock() { if (S.sperreBesetzt) throw new Error('Lock timeout: another process was holding the lock for too long.'); S.gesperrt++; S.sperrenMax = Math.max(S.sperrenMax, S.gesperrt); },
      tryLock() { if (S.sperreBesetzt) return false; S.gesperrt++; return true; }, releaseLock() { S.gesperrt--; } }) },
    Session: { getActiveUser: () => ({ getEmail: () => S.aktiv }), getEffectiveUser: () => ({ getEmail: () => S.besitzer }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => S.PROPS[k] ?? null, setProperty: (k, v) => { S.PROPS[k] = String(v); } }) },
    Utilities: { formatDate: fmt, parseDate: (s) => { let m = /(\d+) (\d+) (\d{4}) (\d+) (\d+)/.exec(s); if (m) return new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5]); m = /(\d{4})-(\d\d)-(\d\d) (\d\d):(\d\d)/.exec(s); return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]); },
      newBlob: (x) => ({ x, getBytes: () => Buffer.isBuffer(x) ? x : Buffer.from(String(x)), getDataAsString: () => Buffer.from(x).toString() }),
      gzip: b => ({ getBytes: () => require('zlib').gzipSync(b.getBytes()) }), ungzip: b => ({ getDataAsString: () => require('zlib').gunzipSync(Buffer.from(b.x)).toString() }),
      base64Encode: b => Buffer.from(b).toString('base64'), base64Decode: s => Buffer.from(s, 'base64') },
    CacheService: { getScriptCache: () => ({ get: k => S.CACHE[k] ?? null, getAll: ks => { const o = {}; ks.forEach(k => { if (k in S.CACHE) o[k] = S.CACHE[k]; }); return o; }, putAll: o => Object.assign(S.CACHE, o), put: (k, v) => { S.CACHE[k] = v; }, remove: k => { delete S.CACHE[k]; } }) },
    MailApp: { sendEmail: (o) => { S.mails.push({ o, gesperrt: S.gesperrt }); } },
    ScriptApp: { getProjectTriggers: () => (S.ausloeser || []).map(n => ({ getHandlerFunction: () => n })), getOAuthToken: () => 't' },
    UrlFetchApp: { fetch: (url, o) => { S.fetch.push({ url, o, gesperrt: S.gesperrt }); if (S.urlAntwort) return S.urlAntwort(url, o); throw new Error('kein Netz im Test'); } },
    GmailApp: { search: (q, start, max) => (S.gmail ? S.gmail(q, start, max) : []) }
  };
  vm.createContext(ctx); vm.runInContext(src, ctx);
  S.c = n => vm.runInContext(n, ctx);
  S.ctx = ctx;
  const L = S.c('L_COLS'), V = S.c('V_COLS'), I = S.c('I_COLS'), R = S.c('R_COLS');
  S.L = blatt('Listings', [L]); S.VK = blatt('Verkäufe', [V]); S.PE = blatt('Posteingang', [I]); S.RE = blatt('Retouren', [R]);
  S.listing = o => { S.L.d.push(L.map(k => o[k] ?? '')); };
  S.verkauf = o => { S.VK.d.push(V.map(k => o[k] ?? '')); };
  S.retoure = o => { S.RE.d.push(R.map(k => o[k] ?? '')); };
  S.zeile = id => { const z = S.L.d.filter(r => r[0] === id).pop(); const o = {}; L.forEach((k, i) => o[k] = z ? z[i] : undefined); return o; };
  S.vz = nr => { const z = S.VK.d.filter(r => r[0] === nr).pop(); const o = {}; V.forEach((k, i) => o[k] = z ? z[i] : undefined); return o; };
  S.pe = id => { const z = S.PE.d.filter(r => r[0] === id).pop(); const o = {}; I.forEach((k, i) => o[k] = z ? z[i] : undefined); return o; };
  /* neuer Aufruf der Web-App: Speicher pro Aufruf leeren, Zwischenspeicher bleibt */
  S.neu = () => S.c('MEMO = {}; CFG = null; ANALYSE_FRISCH = null; IN_SPERRE = 0; VORRAT = null;');
  S.kalt = () => { S.neu(); for (const k of Object.keys(S.CACHE)) delete S.CACHE[k]; };
  S.log = re => S.logs.some(r => re.test(String(r[2]) + ' ' + String(r[4])));
  S.karten = () => { const a = ctx.SpreadsheetApp.getActive(); return S.c('karten_')(a.getSheetByName('Verkäufe'), a.getSheetByName('Listings'), a.getSheetByName('Posteingang')); };
  vm.runInContext('wochen_ = function () {}; hauptbilder_ = function () {};', ctx);
  return S;
}
module.exports = { sandbox, blatt, rtTab, RT_KOPF, ana, mm, KOMPLETT, CSV_KOPF, ok, wirft, ende: (name) => { console.log(fehler ? fehler + ' Fehler' : 'alle Tests ok'); process.exit(fehler ? 1 : 0); } };
if (require.main === module) console.log('Hilfsdatei der Tests t_ricardo_p2410_*.js (Sandbox), nichts zu prüfen.');
