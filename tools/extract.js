// Liest src/Code.gs und schreibt data/code-facts.json: Konstanten, Tabs und Spalten, API-Funktionen mit Kommentar.
const vm = require('vm'), fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../src/Code.gs'), 'utf8');
const P = new Proxy(function () {}, { get: (t, k) => k === Symbol.toPrimitive ? () => '' : P, apply: () => P, construct: () => P });
const c = { console, Session: P, PropertiesService: P, Utilities: P, SpreadsheetApp: P, DriveApp: P, ScriptApp: P, HtmlService: P, LockService: P, UrlFetchApp: P, CacheService: P, ContentService: P };
vm.createContext(c); vm.runInContext(src, c);
const g = n => vm.runInContext('typeof ' + n + ' !== "undefined" ? ' + n + ' : null', c);
const api = (/const f = \{([\s\S]*?)\}\[name\]/.exec(src)[1]).split(',').map(s => s.split(':')[1]).filter(Boolean).map(s => s.trim());
const doc = {};
const re = /(\/\*\*[\s\S]*?\*\/|\/\*[^\n]*\*\/)?\s*\nfunction ([A-Za-z_]+)\(([^)]*)\)/g; let m;
while ((m = re.exec(src))) doc[m[2]] = { params: m[3], doc: (m[1] || '').replace(/^\/\*\*?|\*\/$/g, '').replace(/\n\s*\* ?/g, ' ').trim(), zeile: src.slice(0, m.index).split('\n').length + 1 };
const out = { version: g('VERSION'), spalten: g('SPALTEN'), stufenStart: g('STUFEN_START'), ko: g('KO'), arten: g('ARTEN'), pruefumfang: g('PRUEFUMFANG'), grades: g('GRADES'),
  handbuchStatus: g('HANDBUCH_STATUS'), handbuchThemen: g('HANDBUCH_THEMEN'), fotoArten: g('FOTO_ARTEN'), bestellStatus: g('BESTELL_STATUS'), schritte: g('SCHRITTE'),
  neueEinstellungen: (g('NEUE_EINSTELLUNGEN') || []).map(r => r[0]), takt: g('TAKT_MINUTEN'), api: api.map(n => Object.assign({ name: n }, doc[n] || {})),
  intern: Object.keys(doc).filter(n => api.indexOf(n) < 0).map(n => Object.assign({ name: n }, doc[n])) };
fs.writeFileSync(path.join(__dirname, '../data/code-facts.json'), JSON.stringify(out, null, 1));
console.log('ok', out.version, Object.keys(out.spalten).length, 'Tabs', out.api.length, 'API', out.intern.length, 'intern');
