/* QR-Code der Foto-Seite (21.10.2026): nie die /dev-Adresse, auch nicht aus einem im Abgleich vorgewärmten Überblick. Erfundene Daten. Lauf: node tests/t_foto_url.js */
const vm = require('vm'), fs = require('fs'), assert = require('assert');
let url = 'https://script.google.com/a/macros/x/s/ABC/dev', cache = {};
const c = { console, JSON, Date, Math, Object, String, Number, Array, RegExp, Error,
  ScriptApp: { getService: () => ({ getUrl: () => url }) },
  CacheService: { getScriptCache: () => ({ get: k => cache[k] ?? null, put: (k, v) => { cache[k] = v; } }) } };
vm.createContext(c); vm.runInContext(fs.readFileSync(__dirname + '/../apps/analyse/Code.gs', 'utf8'), c);
const p = { 'PG-ID': 'PG-1' };
assert.ok(/\/exec\?foto=PG-1$/.test(c.fotoUrl_(p, {})) && !/\/dev/.test(c.fotoUrl_(p, {})), 'Trigger mit /dev: feste exec-Adresse');
url = 'https://script.google.com/a/macros/x/s/XYZ/exec';
assert.strictEqual(c.fotoUrl_(p, {}), url + '?foto=PG-1', 'Web-App: eigene Adresse');
assert.strictEqual(c.fotoUrl_(p, { 'Web-App-Adresse für Fotos': ' https://a/exec ' }), 'https://a/exec?foto=PG-1', 'Einstellung gewinnt');
/* vorgewärmt mit /dev im Zwischenspeicher: beim Lesen wird die Adresse neu gesetzt */
c.uebSchluessel_ = () => 'k';
cache.k = JSON.stringify({ recherche: true, ricardo: { fotoUrl: 'https://script.google.com/a/macros/x/s/ABC/dev?foto=PG-1' } });
vm.runInContext('uebSchluessel_ = function () { return "k"; };', c);
const u = c.ueberblickSpeicher_(p, {});
assert.strictEqual(u.ricardo.fotoUrl, url + '?foto=PG-1', 'aus dem Zwischenspeicher: Adresse frisch');
console.log('t_foto_url ok');
