/* Ersatzteil Tool, Prüfung 24.10.2026: gemeinsame Testhilfe für t_ersatzteil_p2410_*.js. Kein Google, kein Netz, kein Browser.
   - lade(opt): apps/ersatzteil/Code.gs in einer vm-Sandbox mit Mock-Sheets. Mit opt.puffer hält der Mock Schreibungen zurück, bis derselbe Lauf liest oder
     SpreadsheetApp.flush() aufruft (wie SpreadsheetApp bündelt). So prüft der Test dauerhaft, dass die Sperre vor dem Freigeben schreibt (Befund 1, Vertrag V1).
   - neu(start, opt): das <script> aus apps/ersatzteil/Index.html in einem Mini-DOM; google.script.run ist gestubbt, Antworten löst der Test von Hand aus.
   Direkt ausgeführt prüft die Datei nur sich selbst. */
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const REPO = __dirname + '/../';
const CODE = fs.readFileSync(process.env.ET_CODE || (REPO + 'apps/ersatzteil/Code.gs'), 'utf8');        // ET_CODE / ET_HTML: Gegenprobe gegen einen anderen Stand
const HTML = fs.readFileSync(process.env.ET_HTML || (REPO + 'apps/ersatzteil/Index.html'), 'utf8');

const KOPF_TEILE = ['ID', 'Marke', 'Modell', 'Produktart', 'Teil', 'Teilart', 'Menge', 'Box', 'Status', 'Quelle', 'Erfasst am', 'Erfasst von', 'Verbraucht am', 'Verbraucht von', 'Bemerkung', 'Kennung'];
function teil(id, m, mo, pa, t, box, menge, status) { return [id, m, mo, pa, t, '', menge === undefined ? 1 : menge, box, status || 'im Lager', '', '', '', '', '', '', '']; }
function basisTabs() {
  return {
    'Teile': [KOPF_TEILE.slice()],
    'Boxen': [['Box', 'Produktart', 'Status', 'Ort', 'Angelegt am', 'Angelegt von', 'Bemerkung'], ['B01', 'Kaffeemaschine', 'offen', '', '', '', ''], ['B02', 'Staubsauger', 'offen', '', '', '', '']],
    'Einstellungen': [['Einstellung', 'Wert', 'Erklärung'], ['Admins', '', ''], ['KI-Budget USD pro Monat', '30', '']],
    'Kosten': [['Zeit', 'Aktion', 'ID', 'Modell', 'Tokens Input', 'Tokens Output', 'Websuchen', 'USD']],
    'Log': [['Zeit', 'Bearbeiter', 'Aktion', 'ID', 'Details']],
    'Ersatzteile': [['Zeit', 'Marke', 'Modell', 'Produkt', 'Gesucht', 'Teil', 'Teilenummer', 'Art', 'Preis CHF', 'Shop', 'Link', 'Lieferbar', 'Hinweis', 'Bearbeiter']],
    'Listen': [['Produktart', 'Teilart', 'Quelle'], ['Kaffeemaschine', 'Tank', 'Galaxus']]
  };
}

/* opt: tabs (geteilt zwischen Läufen), puffer, onRelease (nach releaseLock), sperreFehler (Anzahl waitLock-Aufrufe, die mit Zeitüberschreitung scheitern),
   fetch (UrlFetchApp.fetch), email (angemeldete Person), besitzer (Konto des Tools; Vorgabe = email wie im Editor), key, props (geteilte Script-Eigenschaften),
   maxRows ({Tab: Zahl}), ohneFlush (Gegenprobe) */
function lade(opt) {
  opt = opt || {};
  const tabs = opt.tabs || basisTabs(), props = opt.props || {}, maxRows = opt.maxRows || {}, maxCols = {};
  const offen = [];
  const flush = function () { while (offen.length) offen.shift()(); };
  const schreib = function (f) { if (opt.puffer) offen.push(f); else f(); };
  const zelle = function (n, r, c, x) { const v = tabs[n]; while (v.length < r) v.push([]); v[r - 1][c - 1] = x; };
  function colIdx(a1) { const m = /^([A-Z]+)(\d+)$/.exec(a1); let c = 0; for (const ch of m[1]) c = c * 26 + ch.charCodeAt(0) - 64; return [Number(m[2]), c]; }
  function sheet(n) {
    const v = function () { return tabs[n]; };
    const max = function () { return maxRows[n] || Math.max(1000, v().length); };
    return {
      getDataRange: function () { flush(); return { getValues: function () { const b = Math.max.apply(null, v().map(function (z) { return z.length; })); return v().map(function (z) { const k = z.slice(); while (k.length < b) k.push(''); return k; }); } }; },
      getLastColumn: function () { flush(); return Math.max.apply(null, v().map(function (z) { return z.length; })); },
      getLastRow: function () { flush(); return v().length; },
      getMaxRows: function () { return max(); },
      getMaxColumns: function () { return maxCols[n] || Math.max(26, v()[0].length); },
      insertRowsAfter: function (nach, anzahl) { assert.strictEqual(nach, max(), 'insertRowsAfter hinter der letzten Zeile'); maxRows[n] = max() + anzahl; },
      insertColumnsAfter: function (nach, anzahl) { maxCols[n] = (maxCols[n] || Math.max(26, v()[0].length)) + anzahl; },
      getRange: function (r, c, nr, nc) {
        let rc = null;
        if (typeof r === 'string') { rc = colIdx(r); r = rc[0]; c = rc[1]; }
        nr = nr || 1;
        if (r + nr - 1 > max()) throw new Error('Die Koordinaten des Bereichs liegen ausserhalb der Abmessungen des Tabellenblatts (' + n + ', Zeile ' + (r + nr - 1) + ' > ' + max() + ').');
        return {
          getValues: function () { flush(); return v().slice(r - 1, r - 1 + nr).map(function (z) { return z.slice(c - 1, c - 1 + (nc || z.length)); }); },
          setValues: function (x) { schreib(function () { x.forEach(function (z, i) { while (v().length < r - 1 + i) v().push([]); v()[r - 1 + i] = z.slice(); }); }); },
          setValue: function (x) { schreib(function () { zelle(n, r, c, x); }); },
          setDataValidation: function () {}
        };
      }
    };
  }
  let sperreFehler = opt.sperreFehler || 0;
  const ctx = {
    console: { log: console.log, error: function (m) { (ctx.__fehler = ctx.__fehler || []).push(String(m)); } },
    SpreadsheetApp: { getActiveSpreadsheet: function () { return { getSheetByName: function (n) { return tabs[n] ? sheet(n) : null; } }; }, flush: function () { if (!opt.ohneFlush) flush(); },
      newDataValidation: function () { const o = { requireValueInList: function () { return o; }, build: function () { return {}; } }; return o; } },
    PropertiesService: { getScriptProperties: function () { return {
      getProperty: function (k) { if (k === 'ANTHROPIC_API_KEY') return opt.key === undefined ? 'sk-test' : opt.key; return props[k] === undefined ? null : props[k]; },
      setProperty: function (k, x) { props[k] = String(x); } }; } },
    LockService: { getScriptLock: function () { return {
      waitLock: function () { if (sperreFehler > 0) { sperreFehler--; throw new Error('Lock timeout: another process was holding the lock for too long.'); } },
      releaseLock: function () { if (opt.onRelease) opt.onRelease(); } }; } },
    Utilities: { formatDate: function (d, tz, f) { return f === 'MM.yyyy' ? '10.2026' : '24.10.2026 08:00:00'; } },
    Session: { getActiveUser: function () { return { getEmail: function () { return opt.email || 'a@pretty-good.ch'; } }; },
      getEffectiveUser: function () { return { getEmail: function () { return opt.besitzer !== undefined ? opt.besitzer : (opt.email || 'a@pretty-good.ch'); } }; } },   // Vorgabe: wie im Editor
    UrlFetchApp: { fetch: opt.fetch || function () { throw new Error('kein Netz im Test'); } },
    HtmlService: {},
    basisEinrichten_: function () { return []; }
  };
  vm.createContext(ctx);
  vm.runInContext(CODE, ctx);
  ctx.__tabs = tabs; ctx.__flush = flush; ctx.__offen = offen; ctx.__props = props; ctx.__maxRows = maxRows;
  return ctx;
}
/* Antwort von Claude für UrlFetchApp.fetch */
function antwort(model, text, stop, usage, code) {
  return { getResponseCode: function () { return code || 200; }, getContentText: function () {
    return code && code !== 200 ? '{"error":{"message":"Overloaded"}}' : JSON.stringify({ stop_reason: stop || 'end_turn', model: model, usage: usage || { input_tokens: 100000, output_tokens: 1000 }, content: [{ type: 'text', text: text }] }); } };
}

/* ---------- Oberfläche: Mini-DOM ---------- */
const SCRIPT = /<script>([\s\S]*?)<\/script>/.exec(HTML)[1];
function unesc(s) { return String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&'); }
const START = { version: 't', ich: 'a@pretty-good.ch', admin: true, fotoBreite: 1200, schluessel: true, budgetVoll: false, imLager: 3,
  boxen: [{ box: 'B01', produktart: 'Kaffeemaschine', status: 'offen', ort: '' }, { box: 'B02', produktart: 'Staubsauger', status: 'offen', ort: '' }],
  produktarten: ['Kaffeemaschine'], teilarten: ['Tank', 'Akku'], quellen: ['Galaxus'] };
/* opt: speicher (geteiltes Objekt = localStorage über ein «Neuladen» hinweg), bestaetigen (confirm) */
function neu(start, opt) {
  opt = opt || {};
  const reg = {}, alle = [], fehler = [], aufrufe = [], alerts = [], speicher = opt.speicher || {};
  let klickH = null, tastH = null, aendH = null;
  function element(tag, attrs, parent) {
    const el = { tagName: tag.toUpperCase(), id: attrs.id || '', value: attrs.value !== undefined ? attrs.value : '', hidden: 'hidden' in attrs, disabled: 'disabled' in attrs,
      dataset: { a: attrs['data-a'], v: attrs['data-v'] }, style: {}, _parent: parent, _html: '', textContent: '',
      focus: function () {}, click: function () {}, scrollIntoView: function () {}, classList: { toggle: function () {} }, querySelectorAll: function () { return []; },
      addEventListener: function (t, f) { if (t === 'change') aendH = f; } };
    Object.defineProperty(el, 'innerHTML', { get: function () { return el._html; }, set: function (h) { setzeHtml(el, h); } });
    return el;
  }
  function entferne(parent) {
    for (let i = alle.length - 1; i >= 0; i--) if (alle[i]._parent === parent) { const x = alle[i]; alle.splice(i, 1); if (x.id && reg[x.id] === x) delete reg[x.id]; entferne(x); }
  }
  function setzeHtml(el, h) {
    entferne(el); el._html = h;
    const re = /<(\w+)((?:\s+[\w-]+(?:="[^"]*")?)*)\s*\/?>/g; let m;
    while ((m = re.exec(h))) {
      const attrs = {}; const ra = /([\w-]+)(?:="([^"]*)")?/g; let a;
      while ((a = ra.exec(m[2]))) attrs[a[1]] = a[2] === undefined ? '' : unesc(a[2]);
      if (attrs.id || attrs['data-a']) { const x = element(m[1], attrs, el); alle.push(x); if (attrs.id) reg[attrs.id] = x; }
    }
  }
  ['titel', 'sub', 'kopf-etikett', 'main', 'lade', 'kamera'].forEach(function (id) { reg[id] = element('div', { id: id }, null); });
  const offen = [];
  const run = function () {
    let ok, fe; const o = {
      withSuccessHandler: function (f) { ok = f; return o; }, withFailureHandler: function (f) { fe = f; return o; },
      api: function (name, args) { const a = { name: name, args: JSON.parse(JSON.stringify(args)), ok: ok, fe: fe }; aufrufe.push(a); offen.push(a); }
    }; return o;
  };
  const ctx = {
    document: { getElementById: function (id) { return reg[id] || null; }, addEventListener: function (t, f) { if (t === 'click') klickH = f; if (t === 'keydown') tastH = f; },
      createElement: function () { return { getContext: function () { return { drawImage: function () {} }; }, toDataURL: function () { return 'data:image/jpeg;base64,' + 'A'.repeat(200); } }; } },
    google: { script: { get run() { return run(); } } },
    confirm: function () { return opt.bestaetigen === undefined ? true : opt.bestaetigen; }, alert: function (t) { alerts.push(t); }, prompt: function () { return 'Toaster'; },
    localStorage: { getItem: function (k) { return k in speicher ? speicher[k] : null; }, setItem: function (k, x) { speicher[k] = String(x); }, removeItem: function (k) { delete speicher[k]; } },
    URL: { createObjectURL: function () { return 'blob:x'; }, revokeObjectURL: function () {} },
    Image: function () { const img = this; img.width = 4000; img.height = 3000; Object.defineProperty(img, 'src', { set: function () { img.onload(); } }); }
  };
  vm.createContext(ctx);
  vm.runInContext(SCRIPT, ctx);
  const api = {
    reg: reg, aufrufe: aufrufe, offen: offen, fehler: fehler, alerts: alerts, speicher: speicher,
    $: function (id) { return reg[id]; },
    text: function (id) { return reg[id] ? reg[id].innerHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : ''; },
    antworte: function (name, wert, alsFehler, welcher) {
      const l = offen.filter(function (a) { return a.name === name; });
      const a = welcher === 'letzter' ? l[l.length - 1] : l[0];
      if (!a) throw new Error('kein offener Aufruf ' + name);
      offen.splice(offen.indexOf(a), 1);
      try { alsFehler ? a.fe({ message: wert }) : a.ok(wert); } catch (e) { fehler.push(name + ': ' + e.message); }
    },
    klick: function (aktion, v) {
      const b = alle.filter(function (x) { return x.dataset.a === aktion && (v === undefined || x.dataset.v === v); })[0];
      if (!b) throw new Error('Knopf ' + aktion + (v ? '=' + v : '') + ' nicht auf der Seite');
      klickH({ target: { closest: function () { return b; } } });
    },
    taste: function (id) { tastH({ key: 'Enter', target: { id: id }, preventDefault: function () {} }); },
    foto: function () { aendH.call({ files: [{}] }); },
    gibt: function (aktion, v) { return alle.some(function (x) { return x.dataset.a === aktion && (v === undefined || x.dataset.v === v); }); },
    anzahl: function (name) { return aufrufe.filter(function (a) { return a.name === name; }).length; },
    letzter: function (name) { return aufrufe.filter(function (a) { return a.name === name; }).slice(-1)[0]; }
  };
  api.antworte('startDaten', JSON.parse(JSON.stringify(start || START)));
  return api;
}

module.exports = { lade: lade, basisTabs: basisTabs, teil: teil, antwort: antwort, KOPF_TEILE: KOPF_TEILE, neu: neu, START: START };

if (require.main === module) {
  const c = lade({ puffer: true });
  c.einlagern({ teil: 'Tank', marke: 'Philips', box: 'B01' });
  assert.strictEqual(c.__offen.length, 0, 'nach der Sperre ist nichts mehr gepuffert');
  const u = neu();
  assert.ok(u.gibt('einFoto') && !u.fehler.length);
  console.log('ok ersatzteil p2410 hilfe');
}
