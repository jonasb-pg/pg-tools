/* Prüfung 24.10.2026, Analyse Tool: Abgleich mit dem Return Tool, Suche und Übernehmen.
   K1 (uebernehmen über api), H1 (Sofortstart nur mit PG-ID), M2 (ein Schlüssel), M3 (Pflichtspalten), M4 (ein AN hält höchstens ein Stück zurück),
   N5 (erledigt und wieder im Tab Analyse), Z4/V4 (Kanal-Tabs nach Kopfzeile, Zeilen ohne Bezeichnung). Erfundene Daten. Lauf: node tests/t_analyse_p2410_abgleich.js */
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const CODE = fs.readFileSync(__dirname + '/../apps/analyse/Code.gs', 'utf8');
const KOPF = ['☑', 'ID', 'Sendung', 'Erfasst', 'Bezeichnung', '#', 'Barcode', 'Link', 'Kategorie', 'OVP', 'VP', 'Wert', 'CH', 'Lagerort', 'Lief-Nr'];
const leer = () => [[''], [''], [''], [''], ['']];
const gx = n => 'https://www.galaxus.ch/de/s1/product/produkt-' + String(n).repeat(3);
const zeile = (id, bez, bc, ort, link) => ['', id, '', '', bez, 1, bc, link || '', 'Kids', 100, 50, '', '', ort, ''];

function lade(TABS) {
  function blatt(name) {
    const v = () => TABS[name], breit = () => Math.max.apply(null, v().map(r => r.length));
    return { getName: () => name, getLastRow: () => v().length, getLastColumn: breit,
      getDataRange: () => ({ getValues: () => v().map(r => { const z = r.slice(); while (z.length < breit()) z.push(''); return z; }) }),
      getRange: (r, c, nr, nc) => ({ getValues: () => { const o = []; for (let i = 0; i < (nr || 1); i++) { const z = []; for (let j = 0; j < (nc || 1); j++) z.push(((v()[r - 1 + i] || [])[c - 1 + j]) === undefined ? '' : v()[r - 1 + i][c - 1 + j]); o.push(z); } return o; } }) };
  }
  const RT = { getSheets: () => Object.keys(TABS).map(blatt), getSheetByName: n => TABS[n] ? blatt(n) : null,
    createTextFinder: (t) => { let rx = false; const f = { useRegularExpression: b => { rx = b; return f; }, matchEntireCell: () => f, findAll: () => {
      const re = new RegExp(rx ? t : '^' + t + '$', 'i'), out = [];
      Object.keys(TABS).forEach(n => TABS[n].forEach((r, i) => r.forEach((x, j) => { if (re.test(String(x))) out.push({ getSheet: () => blatt(n), getRow: () => i + 1, getColumn: () => j + 1 }); })));
      return out; } }; return f; } };
  const PROPS = {};
  const c = { console, JSON, Math, Date, RegExp, Utilities: { formatDate: () => '' }, SpreadsheetApp: { openById: () => RT },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => PROPS[k] === undefined ? null : PROPS[k], setProperty: (k, v) => { PROPS[k] = String(v); }, deleteProperty: k => { delete PROPS[k]; } }) } };
  vm.createContext(c); vm.runInContext(CODE, c);
  const st = { PRODUKTE: [], ANALYSEN: [], LOG: [], PK: ['PG-ID', 'Herkunft', 'Bezeichnung', 'Barcode', 'Link', 'Analyse-Status', 'Übernommen am'] };
  c.einst_ = () => ({ 'Return Tool ID': 'RT', 'Return Tool Tab': 'Analyse' });
  c.lies_ = n => ({ kopf: n === 'Produkte' ? st.PK : [], z: (n === 'Produkte' ? st.PRODUKTE : (n === 'Analysen' ? st.ANALYSEN : [])).map((p, i) => Object.assign({ _r: i + 2 }, p)) });
  c.schreib_ = (n, objs) => { objs.forEach(o => st.PRODUKTE.push(Object.assign({}, o))); return 0; };
  c.setz_ = (n, feld, werte) => { Object.keys(werte).forEach(r => { st.PRODUKTE[Number(r) - 2][feld] = werte[r]; }); };
  c.gesperrt_ = f => f(); c.log_ = (a, id, d) => st.LOG.push(a + ' ' + id + ' ' + d); c.zeit_ = () => '24.10.2026';
  c.imMatchmaker_ = () => ({}); c.ueberblickSpeicher_ = (p) => ({ sofort: String(p['PG-ID']) });
  c.einmalProTag_ = (a, l) => l;
  c.neu = () => vm.runInContext('RT_KANAL_MEMO = null;', c);          // neuer Aufruf (in Apps Script gilt der Merker nur für einen Aufruf)
  return { c, st, PROPS };
}
const ids = st => st.PRODUKTE.map(p => p['PG-ID']);
const P = (st, id) => st.PRODUKTE.filter(p => p['PG-ID'] === id)[0];
const basis = () => ({
  'Analyse': leer().concat([KOPF.concat(['Reusable']), zeile('PG-100', 'Denver Kamera', '', 'Analyse').concat(['']), zeile('PG-500b', 'Sony WH-1000XM5', '', 'Analyse').concat([''])]),
  'Stationär': leer().concat([KOPF, zeile('PG-0203', 'Denver MCR 50', 40064081, 'Analyse'),
    zeile('PG-200', 'Babymoov Premium Care 2019', '', 'Analyse', gx(111)), zeile('PG-205', 'Babymoov Premium Care 2019 grau', '', 'Analyse', gx(111))]),
  'Online': leer().concat([KOPF]), 'Berner Brocki': leer().concat([KOPF]), 'Caritas': leer().concat([KOPF]), 'Heilsarmee': leer().concat([KOPF]),
  'Scanner': leer().concat([['☑', 'Erfasst', 'Bezeichnung', 'Barcode', 'Lagerort'], ['', '', 'Ohne Nummer', '7611111111111', 'Analyse']]),
  'Archiv 2025': leer().concat([KOPF, zeile('PG-950', 'Sodastream', '', 'Analyse')])
});

/* ---- K1: «Übernehmen und analysieren» geht über api() ---- */
{
  const T = basis(); T['Stationär'].push(zeile('PG-201', 'Tonies Toniebox 2 blau', '4251192100001', 'KID-6'));
  const { c, st } = lade(T);
  const r = c.api('de', 'uebernehmen', ['PG-201', false]);
  assert.strictEqual(r.id, 'PG-201', 'K1: api kennt uebernehmen');
  assert.ok(P(st, 'PG-201') && P(st, 'PG-201')['Übernommen am'] === '24.10.2026', 'K1: übernommen');
  assert.throws(() => c.api('de', 'gibtsNicht', []), /Unbekannte Funktion/);
}

/* ---- M2: ID ohne PG-Muster mit Kleinbuchstaben legt nicht jede Runde eine neue Zeile an ---- */
{
  const { c, st } = lade(basis());
  st.PRODUKTE = [{ 'PG-ID': 'AN-0027', 'Herkunft': 'Ohne Inventar', 'Bezeichnung': 'Babymoov Premium Care', 'Link': gx(111), 'Analyse-Status': 'Erledigt' }];
  for (let i = 0; i < 3; i++) { c.neu(); c.spiegeln_(c.einst_()); }
  assert.strictEqual(st.PRODUKTE.filter(p => p['PG-ID'] === 'PG-500b').length, 1, 'M2: PG-500b nur einmal');
  assert.strictEqual(c.idKey_('PG-500b'), 'PG-500B'); assert.strictEqual(c.idKey_(' an 0027 '), 'AN-27'); assert.strictEqual(c.idKey_('pg 0862'), 'PG-862');

  /* ---- M4: ein AN hält höchstens ein Stück zurück (das beste Paar), das andere kommt in die Warteschlange ---- */
  const drin = ids(st);
  assert.ok(drin.indexOf('PG-200') < 0 && drin.indexOf('PG-205') > -1, 'M4: PG-200 zurückgehalten (erstes von zwei gleich guten), PG-205 in der Warteschlange: ' + drin.join());
  assert.ok(st.LOG.some(l => /PG-200 ~ AN-0027/.test(l)) && !st.LOG.some(l => /PG-205 ~ AN-0027/.test(l)), 'M4: Hinweis nur für das zurückgehaltene');
}
{ /* M4: Galaxus-Nummer schlägt ähnlichen Namen */
  const T = basis();
  T['Stationär'] = leer().concat([KOPF, zeile('PG-301', 'Babymoov Premium Care', '', 'Analyse'), zeile('PG-302', 'Etwas anderes Gerät', '', 'Analyse', gx(111))]);
  const { c, st } = lade(T);
  st.PRODUKTE = [{ 'PG-ID': 'AN-0027', 'Herkunft': 'Ohne Inventar', 'Bezeichnung': 'Babymoov Premium Care', 'Link': gx(111), 'Analyse-Status': 'Erledigt' }];
  c.spiegeln_(c.einst_());
  assert.ok(ids(st).indexOf('PG-302') < 0 && ids(st).indexOf('PG-301') > -1, 'M4: das Paar mit gleicher Galaxus-Nummer wird zurückgehalten: ' + ids(st).join());
}
{ /* M4 und Admin: Liste der zurückgehaltenen Stücke wird gemerkt */
  const { c, st, PROPS } = lade(basis());
  st.PRODUKTE = [{ 'PG-ID': 'AN-0027', 'Herkunft': 'Ohne Inventar', 'Bezeichnung': 'Babymoov Premium Care', 'Link': gx(111), 'Analyse-Status': 'Erledigt' }];
  c.spiegeln_(c.einst_());
  const info = JSON.parse(PROPS.ABGLEICH_INFO);
  assert.deepStrictEqual(info.verdacht, ['PG-200 ~ AN-0027'], 'Admin sieht das zurückgehaltene Stück');
  assert.ok(info.tabs.indexOf('Stationär') > -1 && info.tabs.indexOf('Scanner') < 0 && info.tabs.indexOf('Archiv 2025') < 0, 'V4: erkannte Kanal-Tabs ohne Scanner und Archiv: ' + info.tabs.join());
}

/* ---- M3: umbenannte Pflichtspalte → Tab «nicht lesbar», nichts fällt heraus ---- */
['Lagerort', 'ID', 'Bezeichnung'].forEach(function (spalte) {
  const T = basis(), { c, st } = lade(T);
  c.spiegeln_(c.einst_());
  assert.strictEqual(P(st, 'PG-0203')['Analyse-Status'], 'Offen');
  T['Stationär'][5] = T['Stationär'][5].slice(); T['Stationär'][5][KOPF.indexOf(spalte)] = spalte === 'ID' ? 'PG-ID' : 'Anders';
  c.neu();
  const r = c.spiegeln_(c.einst_());
  assert.strictEqual(P(st, 'PG-0203')['Analyse-Status'], 'Offen', 'M3: «' + spalte + '» umbenannt, PG-0203 bleibt offen');
  assert.strictEqual(r.entfaellt, 0); assert.ok(/nicht lesbar/.test(r.hinweis || '') && /Stationär/.test(r.hinweis), 'M3: laut gemeldet: ' + r.hinweis);
});
{ /* M3: im Tab «Analyse» fehlt «Reusable» → Fehler statt still alles neu */
  const T = basis(), { c } = lade(T);
  T['Analyse'][5] = T['Analyse'][5].slice(); T['Analyse'][5][KOPF.length] = 'Reuse?';
  assert.throws(() => c.spiegeln_(c.einst_()), /Analyse.*Reusable.*nicht lesbar/, 'M3: Haupttab ohne Reusable');
}

/* ---- Z4/V4: neuer Kanal-Tab wird gelesen und gemeldet; umbenannter Tab bleibt; Zeile ohne Bezeichnung wird gemeldet und fällt nicht heraus ---- */
{
  const T = basis(), { c, st } = lade(T);
  c.spiegeln_(c.einst_());
  T['Brocki XY'] = leer().concat([KOPF, zeile('PG-900', 'Bosch Mixer MUM5', '', 'Analyse')]);
  c.neu(); c.spiegeln_(c.einst_());
  assert.ok(P(st, 'PG-900'), 'V4: Stück aus neuem Kanal-Tab kommt in die Warteschlange');
  assert.ok(st.LOG.some(l => /Neuer Kanal-Tab.*Brocki XY/.test(l)), 'V4: neuer Tab im Log');
  /* umbenannt: Stationär → Stationaer: PG-0203 bleibt offen */
  T['Stationaer'] = T['Stationär']; delete T['Stationär'];
  c.neu(); c.spiegeln_(c.einst_());
  assert.strictEqual(P(st, 'PG-0203')['Analyse-Status'], 'Offen', 'V4: umbenannter Tab wird erkannt, nichts fällt heraus');
  /* Zeile mit ID, aber ohne Bezeichnung */
  const z = T['Stationaer'].findIndex(r => r[1] === 'PG-0203'); T['Stationaer'][z] = T['Stationaer'][z].slice(); T['Stationaer'][z][4] = '';
  c.neu(); const r = c.spiegeln_(c.einst_());
  assert.strictEqual(P(st, 'PG-0203')['Analyse-Status'], 'Offen', 'Z4: ohne Bezeichnung fällt es nicht still heraus');
  assert.ok(st.LOG.some(l => /ohne Bezeichnung.*PG-0203/.test(l)), 'Z4: im Log gemeldet');
  assert.strictEqual(r.entfaellt, 0);
}
{ /* V4: Einstellung «Return Tool Kanal-Tabs» überschreibt die Erkennung */
  const T = basis(), { c } = lade(T);
  assert.deepStrictEqual(Array.from(c.rtKanalTabs_({ 'Return Tool Kanal-Tabs': 'Online, Caritas' }, 'Analyse', c.SpreadsheetApp.openById())), ['Analyse', 'Online', 'Caritas']);
  assert.ok(c.rtArchiv_('ARCHIV 2025') && c.rtArchiv_('archiv') && !c.rtArchiv_('Mein Archiv'));
}

/* ---- H1: Sofortstart nur mit PG-ID; per Barcode/Name Liste und weitere Stücke im Return Tool ---- */
{
  const EAN = '4251192100001';
  const T = basis();
  T['Analyse'].push(zeile('PG-110', 'Tonies Toniebox 2 blau', EAN, 'Analyse').concat(['']));
  T['Stationär'].push(zeile('PG-111', 'Tonies Toniebox 2 blau', EAN, 'Eingang'));
  const { c, st } = lade(T);
  c.spiegeln_(c.einst_());
  let s = c.suche(EAN);
  assert.ok(s.inSchlange && s.treffer.length === 1 && !s.treffer[0].d && !s.sofort, 'H1: Barcode startet nicht sofort');
  assert.ok(s.etikett, 'H1: Hinweis «PG-ID auf dem Etikett vergleichen»');
  assert.deepStrictEqual(Array.from(s.rt.map(r => r.id)), ['PG-111'], 'H1: zweites Stück mit diesem Barcode aus dem Return Tool, ohne das schon gelistete');
  s = c.suche('Toniebox');
  assert.ok(!s.treffer[0].d && !s.sofort && s.rt.some(r => r.id === 'PG-111'), 'H1: Name startet nicht sofort, prüft den Barcode im Return Tool');
  s = c.suche('pg 0110');
  assert.ok(s.sofort && s.treffer[0].d && s.treffer[0].d.sofort === 'PG-110' && s.rt.length === 0, 'H1: PG-ID (vereinheitlicht) startet sofort, ohne Return Tool');
  s = c.suche('(01)04251192100001');
  assert.ok(s.inSchlange && s.treffer[0].id === 'PG-110' && !s.sofort, 'V3: GS1-Barcode erkannt');
}

/* ---- N5: erledigt, aber wieder im Tab Analyse → gemeldet; über «Übernehmen» mit Rückfrage neu analysierbar ---- */
{
  const T = basis(), { c, st, PROPS } = lade(T);
  c.spiegeln_(c.einst_());
  P(st, 'PG-100')['Analyse-Status'] = 'Erledigt';
  st.ANALYSEN = [{ 'Analyse-Nr': 'A-000007', 'PG-ID': 'PG-100', 'Kürzel': 'AB', 'Ende': '20.10.2026 10:00:00' }];
  c.neu(); c.spiegeln_(c.einst_());
  assert.ok(st.LOG.some(l => /wieder.*PG-100/.test(l)), 'N5: im Log');
  assert.deepStrictEqual(JSON.parse(PROPS.ABGLEICH_INFO).wieder, ['PG-100'], 'N5: im Admin');
  assert.strictEqual(P(st, 'PG-100')['Analyse-Status'], 'Erledigt', 'N5: nicht still wieder geöffnet');
  let u = c.uebernehmen('PG-100');
  assert.ok(u.erledigt && /A-000007/.test(u.erledigt) && /AB/.test(u.erledigt), 'N5: zuerst Rückfrage mit der alten Analyse');
  assert.throws(() => c.uebernehmen('PG-100', true), /schon analysiert/, 'N5: «trotzdem» (AN-Doppel) reicht nicht');
  u = c.uebernehmen('PG-100', 'retoure');
  assert.strictEqual(P(st, 'PG-100')['Analyse-Status'], 'Offen', 'N5: als Retoure neu in der Warteschlange');
  assert.ok(st.LOG.some(l => /Neu analysieren \(Retoure\) PG-100/.test(l)));
}
{ /* N5: kurz nach der Analyse (Return Tool noch nicht nachgeführt) keine Meldung */
  const { c, st } = lade(basis());
  c.spiegeln_(c.einst_());
  P(st, 'PG-100')['Analyse-Status'] = 'Erledigt';
  c.zeit_ = () => '24.10.2026 12:00:00';
  st.ANALYSEN = [{ 'Analyse-Nr': 'A-000008', 'PG-ID': 'PG-100', 'Ende': '24.10.2026 11:30:00' }];
  c.neu(); c.spiegeln_(c.einst_());
  assert.ok(!st.LOG.some(l => /wieder.*PG-100/.test(l)), 'N5: nach einer halben Stunde noch keine Meldung');
}

/* ---- V3: PG-ID und Barcode überall gleich ---- */
{
  const { c } = lade(basis());
  [['PG-0862', 'PG-862'], ['pg 862', 'PG-862'], ["PG'862", 'PG-862'], ['PG862', 'PG-862'], [' PG-862 ', 'PG-862'], ['PG_862', ''], ['AN-0001', ''], ['862', '']]
    .forEach(f => assert.strictEqual(c.pgNorm_(f[0]), f[1], 'pgNorm_ ' + f[0]));
  [['07613081105484', '7613081105484'], [7613081105484, '7613081105484'], ["'07613081105484", '7613081105484'], ['4006381-333931', '4006381333931'],
    ['(01)07613081105484', '7613081105484'], ['0107613081105484', '7613081105484'], [' 7613 0811 05484 ', '7613081105484'], ['ab 12c', 'AB12C']]
    .forEach(f => assert.strictEqual(c.bcNorm_(f[0]), f[1], 'bcNorm_ ' + JSON.stringify(f[0])));
}
console.log('t_analyse_p2410_abgleich ok');
