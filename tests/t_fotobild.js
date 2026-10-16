// Vorschaubild vom Server: data-URL, gemerkt, leer ohne Vorschau, leer wenn zu gross
const fs = require('fs'), src = fs.readFileSync(__dirname + '/../src/Code.gs', 'utf8');
const f = src.slice(src.indexOf('function fotoBild_('), src.indexOf('/** Ein Foto vom Handy ablegen.'));
const store = {}; let thumbs = 0;
const CacheService = { getScriptCache: () => ({ get: k => store[k] || null, put: (k, v) => { store[k] = v; } }) };
const Utilities = { base64Encode: b => Buffer.from(b).toString('base64') };
const fotoBild_ = new Function('CacheService', 'Utilities', f + '; return fotoBild_;')(CacheService, Utilities);
const datei = (id, bytes) => ({ getId: () => id, getThumbnail: () => { thumbs++; return bytes ? { getBytes: () => bytes, getContentType: () => 'image/jpeg' } : null; } });
const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exit(1); } };
const a = fotoBild_(datei('A', [1, 2, 3]));
ok(a === 'data:image/jpeg;base64,AQID', 'data-URL');
ok(fotoBild_(datei('A', [1, 2, 3])) === a && thumbs === 1, 'aus Zwischenspeicher');
ok(fotoBild_(datei('B', null)) === '', 'ohne Vorschau leer');
ok(fotoBild_(datei('C', new Array(80000).fill(7))) === '' && !store['fb:C'], 'zu gross leer');
const ui = fs.readFileSync(__dirname + '/../src/Index.html', 'utf8');
ok(!/<img src="https:\/\/drive\.google\.com\/thumbnail/.test(ui) && (ui.match(/fotoSrc\(x\)/g) || []).length === 3, 'UI nutzt fotoSrc');
console.log('ok t_fotobild');
