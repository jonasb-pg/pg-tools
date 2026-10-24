/* Prüfung 24.10.2026, Analyse Tool: Abschliessen.
   H2 (Teil-Abschluss + Wiederholung schreibt nichts doppelt, Lauf-ID), H3 (zweite Analyse derselben PG-ID: Konflikt als Kennzeichen, in jeder Sprache),
   M1/N6 (Überblick geändert: Namen statt Positionen, sonst neu bestätigen), H4 («Modell neu»: Server urteilt mit der neuen Recherche), N1 (Reparatur-Stand weg).
   Erfundene Daten. Lauf: node tests/t_analyse_p2410_abschluss.js */
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const CODE = fs.readFileSync(__dirname + '/../apps/analyse/Code.gs', 'utf8');
const j = x => JSON.parse(JSON.stringify(x));

/* Kleine Datenbank im Speicher: lies_/schreib_/setz_ wie im Sheet (Zeilennummer = Position + 2) */
function umgebung(u) {
  const c = { console, JSON, Math, Date, RegExp, Utilities: { formatDate: () => '24.10.2026' } };
  vm.createContext(c); vm.runInContext(CODE, c);
  const DB = { Produkte: [], Analysen: [], Ricardo: [], Matchmaker: [], 'Prüfschritte': [], 'Testmittel-Log': [] }, KOPF = {}, PROPS = {}, LOG = [];
  KOPF.Analysen = vm.runInContext('ANALYSEN_KOPF', c).slice();
  KOPF.Produkte = ['PG-ID', 'Bezeichnung', 'Analyse-Status', 'Recherche-Schlüssel', 'Herkunft', 'Reparatur-Stand'];
  let zeit = 0;
  const zw = n => String(n).padStart(2, '0');
  c.zeit_ = d => d ? zw(d.getUTCDate()) + '.' + zw(d.getUTCMonth() + 1) + '.' + d.getUTCFullYear() + ' ' + zw(d.getUTCHours()) + ':' + zw(d.getUTCMinutes()) + ':' + zw(d.getUTCSeconds())
    : '24.10.2026 10:' + zw(10 + (zeit++ % 50)) + ':00';                // wie Utilities.formatDate: ein Datum wird formatiert, sonst «jetzt» (jede Minute eine neue)
  c.lies_ = n => ({ kopf: KOPF[n] || [], z: (DB[n] || []).map((r, i) => Object.assign({ _r: i + 2 }, r)) });
  c.schreib_ = (n, o) => { if (!DB[n]) DB[n] = []; o.forEach(x => { const y = {}; Object.keys(x).forEach(k => { if (!KOPF[n] || KOPF[n].indexOf(k) > -1) y[k] = x[k]; }); DB[n].push(j(y)); }); return DB[n].length - o.length + 2; };
  c.setz_ = (n, f, w) => { Object.keys(w).forEach(r => { DB[n][Number(r) - 2][f] = w[r]; }); };
  c.produkt_ = id => c.lies_('Produkte').z.filter(r => c.idKey_(r['PG-ID']) === c.idKey_(id))[0];
  c.einst_ = () => ({ 'Garantie Tage': 90 }); c.ueberblickSpeicher_ = () => j(c.U);
  c.gesperrt_ = f => f(); c.rueckmeldung_ = () => {}; c.log_ = (a, i, d) => LOG.push(a + ' ' + i + ' ' + d); c.takt_ = () => {}; c.blatt_ = () => ({});
  c.einmalProTag_ = (a, l) => l;
  c.PropertiesService = { getScriptProperties: () => ({ getProperty: k => PROPS[k] || null, setProperty: (k, v) => { PROPS[k] = v; }, deleteProperty: k => { delete PROPS[k]; } }) };
  c.U = u;
  return { c, DB, KOPF, PROPS, LOG };
}
const U = () => ({ produkt: { id: 'PG-1', budget: 15, stufe: 'KFP', vp: 80 }, ablauf: ['ident', 'sicher', 'funktion', 'zustand', 'entscheid'], rueckruf: null, firmware: false, strom: ['Netzstecker'],
  sicher: ['Netzkabel und Stecker ohne Schäden'], funktion: { liste: [{ n: 'Heizen', t: 'Aufheizen ohne Wasser', g: 'Kern' }, { n: 'Timer', t: 'Timer stellen', g: 'Weitere' }, { n: 'Display', t: 'Display zeigt Zeit', g: 'Weitere' }],
    ungeprueft: [], ungeprueftKurz: [], mittel: [{ name: 'HDMI-Kabel' }] }, reset: [], liefer: { teile: ['Kanne'], unsicher: false }, zustand: { grade: [['A', 'Neu', ''], ['B', 'Neu', ''], ['C', 'Gebraucht', '']] },
  ident: { marke: 'X', modell: 'Y' }, ricardo: { versand: [] } });
const bezug = u => ({ ablauf: u.ablauf, sicher: u.sicher, liefer: u.liefer.teile, fn: u.funktion.liste.map(x => x.n), reset: u.reset.map(x => x[0]) });
const daten = (u, extra) => Object.assign({ id: 'PG-1', kuerzel: 'AB', start: Date.UTC(2026, 9, 24, 8, 0, 0), aktivSek: 300, sicher: true, fn: ['ok', 'np', 'ok'], grade: 'C', kanal: 'regal',
  lauf: 'AB-lauf-1', v: '2026-10-24.2', bezug: bezug(u) }, extra || {});

/* ---- H2: Teil-Abschluss (Fehler mitten drin) und Wiederholung mit derselben Lauf-ID ---- */
{
  const u = U(), { c, DB, LOG } = umgebung(u);
  DB.Produkte.push({ 'PG-ID': 'PG-1', 'Bezeichnung': 'Beamer', 'Analyse-Status': 'Offen', 'Recherche-Schlüssel': 'K', 'Herkunft': 'Retoure' });
  c.ricardoPruefen_ = () => ({ 'PG-ID': 'PG-1', 'Titel': 'Beamer X Y', 'Startpreis CHF': 40 });
  let mal = 0; const echt = c.testmittelBuchen_;
  c.testmittelBuchen_ = function (tm, id, k, t) { if (!mal++) throw new Error('API call to sheets.spreadsheets.values.append failed with error: Internal error encountered.'); DB['Testmittel-Log'].push({ 'PG-ID': id, 'Zeit': t, 'Testmittel': 'HDMI-Kabel' }); };
  const d = daten(u, { kanal: 'ricardo', ricardo: {} });
  assert.throws(() => c.abschliessen(j(d)), /Internal error/);
  assert.strictEqual(DB.Analysen.length, 1); assert.strictEqual(DB.Produkte[0]['Analyse-Status'], 'Offen');
  assert.strictEqual(DB.Analysen[0]['Lauf-ID'], 'AB-lauf-1', 'H2: Lauf-ID steht in «Analysen»');
  const r = c.abschliessen(j(d));
  assert.strictEqual(DB.Analysen.length, 1, 'H2: keine zweite Analyse');
  assert.strictEqual(DB.Ricardo.length, 1, 'H2: keine zweite Ricardo-Zeile');
  assert.strictEqual(DB['Prüfschritte'].length, 4, 'H2: Prüfschritte nur einmal (1 Sicherheitspunkt + 3 Funktionen)');
  assert.strictEqual(DB['Testmittel-Log'].length, 1, 'H2: Testmittel nachgeholt, einmal');
  assert.strictEqual(DB.Produkte[0]['Analyse-Status'], 'Erledigt', 'H2: jetzt erledigt');
  assert.ok(r.nachgeholt && r.nr === 'A-000001', 'H2: dieselbe Analyse-Nr');
  assert.ok(LOG.some(l => /Abschluss nachgeholt PG-1 A-000001/.test(l)));
  /* nochmals (z.B. Antwort ging verloren): nichts schreiben, Ergebnis kommt mit schon = true */
  const r2 = c.abschliessen(j(d));
  assert.ok(r2.schon && r2.nr === 'A-000001' && DB.Analysen.length === 1 && DB.Ricardo.length === 1, 'H2: dritter Versuch ändert nichts');
  c.testmittelBuchen_ = echt;
}

/* ---- H3: zweite Person, anderer Lauf → Konflikt (Kennzeichen, kein Fehlertext), nichts geschrieben; auch auf Englisch gleich ---- */
{
  const u = U(), { c, DB } = umgebung(u);
  DB.Produkte.push({ 'PG-ID': 'PG-1', 'Bezeichnung': 'Toniebox', 'Analyse-Status': 'Offen', 'Recherche-Schlüssel': 'K', 'Herkunft': 'Retoure' });
  c.testmittelBuchen_ = () => {};
  c.abschliessen(daten(u, { kuerzel: 'AB', lauf: 'AB-1', grade: 'B' }));
  const r = c.abschliessen(daten(u, { kuerzel: 'CD', lauf: 'CD-1', grade: 'C' }));
  assert.ok(r.konflikt && r.konflikt.kuerzel === 'AB' && r.konflikt.nr === 'A-000001' && /24\.10\.2026/.test(r.konflikt.zeit), 'H3: Konflikt mit Kürzel und Zeit: ' + JSON.stringify(r));
  assert.strictEqual(DB.Analysen.length, 1, 'H3: nichts geschrieben');
  vm.runInContext("LANG = 'en';", c);
  const r3 = c.api('en', 'abschliessen', [daten(u, { kuerzel: 'CD', lauf: 'CD-1' })]);
  assert.ok(r3.konflikt && r3.konflikt.kuerzel === 'AB', 'H3: englische Oberfläche bekommt dasselbe Kennzeichen');
  /* Konflikt auch, wenn erst in der Sperre auffällt, dass jemand anderes gerade abgeschlossen hat */
  DB.Produkte[0]['Analyse-Status'] = 'Offen';
  const echt = c.produkt_; let n = 0;
  c.produkt_ = id => { const p = echt(id); if (n++ === 1) p['Analyse-Status'] = 'Erledigt'; return p; };
  const r4 = c.abschliessen(daten(u, { kuerzel: 'EF', lauf: 'EF-1' }));
  assert.ok(r4.konflikt && DB.Analysen.length === 1, 'H3: in der Sperre erkannt');
  c.produkt_ = echt;
  /* Oberfläche: wertet das Kennzeichen, nicht den Text «bereits analysiert» */
  const html = fs.readFileSync(__dirname + '/../apps/analyse/Index.html', 'utf8');
  assert.ok(!/\/bereits analysiert\/\.test\(m\)/.test(html) && /r\.konflikt/.test(html), 'H3: Browser verwirft eine Analyse nicht mehr wegen «bereits analysiert»');
}
{ /* H2: alte Oberfläche ohne Lauf-ID (Eintrag aus der Warteschlange von vor dem Einspielen): Kürzel + Start erkennen denselben Lauf */
  const u = U(), { c, DB } = umgebung(u);
  DB.Produkte.push({ 'PG-ID': 'PG-1', 'Bezeichnung': 'Toniebox', 'Analyse-Status': 'Offen', 'Recherche-Schlüssel': 'K', 'Herkunft': 'Retoure' });
  c.testmittelBuchen_ = () => {};
  const d = daten(u); delete d.lauf; delete d.bezug; delete d.v;
  c.abschliessen(j(d));
  delete DB.Analysen[0]['Lauf-ID'];                                     // wie eine Zeile von vor dem 24.10.2026
  const r = c.abschliessen(j(d));
  assert.ok(r.schon && DB.Analysen.length === 1, 'H2: ohne Lauf-ID über Kürzel und Start erkannt');
  const r2 = c.abschliessen(Object.assign(j(d), { kuerzel: 'XY' }));
  assert.ok(r2.konflikt, 'anderes Kürzel: Konflikt');
}

/* ---- M1/N6: Überblick hat sich zwischen Browser und Server geändert ---- */
{
  const browser = U(), server = U();
  server.ablauf = server.ablauf.slice();
  server.sicher = ['Netzkabel und Stecker ohne Schäden', 'Dichtung im Deckel eingesetzt (Handbuch S. 4)'];
  const { c, DB, LOG } = umgebung(server);
  DB.Produkte.push({ 'PG-ID': 'PG-1', 'Bezeichnung': 'Wasserkocher', 'Analyse-Status': 'Offen', 'Recherche-Schlüssel': 'K', 'Herkunft': 'Retoure' });
  c.testmittelBuchen_ = () => {};
  const r = c.abschliessen(daten(browser));
  assert.ok(r.ueberblickNeu && r.neu.indexOf('Sicherheit') > -1 && r.d && r.d.sicher.length === 2, 'M1: nie gezeigter Sicherheitspunkt → neu bestätigen: ' + JSON.stringify(r.neu));
  assert.strictEqual(DB.Analysen.length, 0, 'M1: nichts geschrieben');
  assert.ok(LOG.some(l => /Überblick geändert PG-1/.test(l)));
}
{ /* gleiche Funktionen, andere Reihenfolge → nach Namen zugeordnet, ohne die Person zu bemühen */
  const browser = U(), server = U();
  server.funktion.liste = [server.funktion.liste[0], server.funktion.liste[2], server.funktion.liste[1]];   // Display und Timer vertauscht
  const { c, DB } = umgebung(server);
  DB.Produkte.push({ 'PG-ID': 'PG-1', 'Bezeichnung': 'Wasserkocher', 'Analyse-Status': 'Offen', 'Recherche-Schlüssel': 'K', 'Herkunft': 'Retoure' });
  c.testmittelBuchen_ = () => {};
  const r = c.abschliessen(daten(browser, { fn: ['ok', 'np', 'ok'] }));     // Browser: Heizen ok, Timer nicht prüfbar, Display ok
  assert.ok(!r.ueberblickNeu && r.nr, 'M1: abgeschlossen');
  const ps = {}; DB['Prüfschritte'].forEach(z => { ps[z['Schritt']] = z['Ergebnis']; });
  assert.strictEqual(ps['Display zeigt Zeit'], 'ok', 'M1: Display war ok');
  assert.strictEqual(ps['Timer stellen'], 'nicht prüfbar', 'M1: Timer war nicht prüfbar');
  assert.ok(/Heizen und Display funktionieren/.test(DB.Analysen[0]['Verkaufsinfo']), 'M1: Verkaufstext folgt dem, was geprüft wurde: ' + DB.Analysen[0]['Verkaufsinfo']);
}
{ /* andere Funktionsliste (neue Recherche) → neu bestätigen; KO vor dem Schritt «Funktion» → keine Rückfrage */
  const browser = U(), server = U();
  server.funktion.liste = [{ n: 'Anrufe', t: 'Anruf tätigen', g: 'Kern' }, { n: 'Puls', t: 'Puls messen', g: 'Kern' }];
  const { c, DB } = umgebung(server);
  DB.Produkte.push({ 'PG-ID': 'PG-1', 'Bezeichnung': 'Uhr', 'Analyse-Status': 'Offen', 'Recherche-Schlüssel': 'K', 'Herkunft': 'Retoure' });
  c.testmittelBuchen_ = () => {};
  assert.ok(c.abschliessen(daten(browser)).ueberblickNeu, 'M1: andere Funktionen');
  const ko = c.abschliessen(daten(browser, { ko: { art: 'frei', text: 'riecht stark nach Rauch', schritt: 'sicher' }, sicher: false }));
  assert.ok(!ko.ueberblickNeu && ko.reusable === false, 'M1: K.-o. vor «Funktion»: die Funktionen zählen nicht');
}
{ /* N6: ohne bezug (Oberfläche vor dem 24.10.2026): wie bisher, mit Hinweis im Log bei anderer Version */
  const u = U(), { c, DB, LOG } = umgebung(u);
  DB.Produkte.push({ 'PG-ID': 'PG-1', 'Bezeichnung': 'Uhr', 'Analyse-Status': 'Offen', 'Recherche-Schlüssel': 'K', 'Herkunft': 'Retoure' });
  c.testmittelBuchen_ = () => {};
  const d = daten(u, { v: '2026-10-15.13' }); delete d.bezug;
  assert.ok(c.abschliessen(d).nr);
  assert.ok(LOG.some(l => /älteren Oberfläche \(2026-10-15\.13\)/.test(l)), 'N6: Version geht mit und steht im Log');
  /* Kennung des Überblicks: ändert sich mit den Funktionen */
  const k1 = c.uebKennung_(U()), v2 = U(); v2.funktion.liste.pop();
  assert.ok(k1 !== c.uebKennung_(v2) && k1 === c.uebKennung_(U()), 'M1: Kennung');
}

/* ---- N1: Reparatur-Stand in «Produkte» wird beim Abschluss geleert, die alte Script-Eigenschaft gelöscht ---- */
{
  const u = U(), { c, DB, PROPS } = umgebung(u);
  DB.Produkte.push({ 'PG-ID': 'PG-1', 'Bezeichnung': 'Föhn', 'Analyse-Status': 'Reparatur', 'Recherche-Schlüssel': 'K', 'Herkunft': 'Retoure', 'Reparatur-Stand': '{"was":"Kabel"}' });
  PROPS['REPARATUR_PG-1'] = '{"was":"alt"}';
  c.testmittelBuchen_ = () => {};
  c.abschliessen(daten(u));
  assert.strictEqual(DB.Produkte[0]['Reparatur-Stand'], '', 'N1: Stand geleert');
  assert.ok(!PROPS['REPARATUR_PG-1'], 'N1: alte Script-Eigenschaft weg');
}

/* ---- H4: «Modell neu» während der Analyse → der Server urteilt beim Abschluss mit der neuen Recherche ---- */
{
  const cache = {};
  const c = { console, JSON, Math, Date, RegExp, Utilities: { formatDate: () => '24.10.2026' },
    CacheService: { getScriptCache: () => ({ get: k => cache[k] || null, put: (k, v) => { cache[k] = v; }, remove: k => { delete cache[k]; }, removeAll: ks => ks.forEach(k => delete cache[k]), getAll: () => ({}) }) },
    ScriptApp: { getService: () => ({ getUrl: () => 'https://x/exec' }) } };
  vm.createContext(c); vm.runInContext(CODE, c);
  const P = { _r: 2, 'PG-ID': 'PG-7', 'Herkunft': 'Retoure', 'Bezeichnung': 'Smartwatch', 'Recherche-Schlüssel': 'EAN7', 'Recherche-Status': 'Bereit', 'Analyse-Status': 'Offen', 'VP CHF': 80 };
  let REC = [{ 'Schlüssel': 'EAN7', 'Feld': 'Funktionen', 'Inhalt': JSON.stringify([{ n: 'Puls', p: 'Puls messen', a: 'Kern', ok: true }, { n: 'GPS', p: 'GPS fix', a: 'Beworben', ok: true }]), _r: 5 },
    { 'Schlüssel': 'EAN7', 'Feld': 'Marke und Modell', 'Inhalt': 'X | Z1 | ', _r: 6 }];
  c.produkt_ = () => Object.assign({}, P); c.einst_ = () => ({ 'Garantie Tage': 90 });
  c.lies_ = n => ({ kopf: [], z: n === 'Stufen' ? [{ 'Herkunft': 'Retoure', 'VP ab CHF': 0, 'Stufe': 'S', 'Minuten': 15, 'Prüfumfang': 'Kern und beworben' }] : (n === 'Produkte' ? [P] : []) });
  c.rechercheVon_ = k => ({ kopf: [], z: REC.filter(r => r['Schlüssel'] === k) });
  c.scoreGrenzen_ = () => [70, 40]; c.handbuchFuer_ = () => null; c.log_ = () => {}; c.takt_ = () => {};
  c.recherchiert_ = () => ({ EAN7: 1 }); c.icecat_ = () => ({ daten: {}, log: [] }); c.kontext_ = () => ({ zb: [], testmittel: [], vorhanden: [] });
  c.claude_ = () => ({ content: [{ type: 'text', text: '```json\n' + JSON.stringify({ marke: 'X', modell: 'Z7', funktionen: [{ name: 'Anrufe', pruefung: 'Anruf tätigen', art: 'Kern' }, { name: 'Puls', pruefung: 'Puls messen', art: 'Kern' }, { name: 'SOS', pruefung: 'SOS auslösen', art: 'Beworben' }] }) + '\n```' }] });
  /* echtes rechercheSchreiben_: löscht die alte Recherche und schreibt die neue (in diese kleine Ablage) */
  c.loeschen_ = (n, zeilen) => { REC = REC.filter(r => zeilen.indexOf(r._r) < 0); };
  c.schreib_ = (n, o) => { if (n === 'Recherche') o.forEach((x, i) => REC.push(Object.assign({ _r: 100 + i }, x))); if (n === 'Prüfschritte') PS.push(...o); return 0; };
  c.blatt_ = () => ({ getLastRow: () => 1 }); c.kopfVon_ = () => [];
  c.gesperrt_ = f => f(); c.setz_ = () => {}; c.rueckmeldung_ = () => {}; c.testmittelBuchen_ = () => {};
  c.SpreadsheetApp = { flush: () => {} }; c.PropertiesService = { getScriptProperties: () => ({ deleteProperty: () => {}, getProperty: () => null }) };
  const PS = [];
  const alt = c.starteAnalyse('PG-7');
  assert.strictEqual(alt.funktion.liste.map(f => f.n).join(), 'Puls,GPS');
  const neu = c.rechercheJetzt('PG-7', 'Z7');
  assert.strictEqual(neu.funktion.liste.map(f => f.n).join(), 'Anrufe,Puls,SOS');
  const server = c.ueberblickSpeicher_(c.produkt_(), c.einst_());
  assert.strictEqual(server.funktion.liste.map(f => f.n).join(), 'Anrufe,Puls,SOS', 'H4: der Zwischenspeicher des Servers kennt die neue Recherche');
  const r = c.abschliessen({ id: 'PG-7', kuerzel: 'AB', start: Date.now(), aktivSek: 600, fn: ['ok', 'ok', 'np'], grade: 'C', kanal: 'regal', sicher: true, lauf: 'L7',
    bezug: { ablauf: neu.ablauf, sicher: neu.sicher, liefer: neu.liefer.teile, fn: neu.funktion.liste.map(x => x.n), reset: neu.reset.map(x => x[0]) } });
  assert.ok(!r.ueberblickNeu && !r.offen, 'H4: Abschluss passt zur neuen Liste: ' + JSON.stringify(r).slice(0, 200));
  assert.ok(PS.some(z => z['Schritt'] === 'Anruf tätigen' && z['Ergebnis'] === 'ok') && PS.some(z => z['Schritt'] === 'SOS auslösen' && z['Ergebnis'] === 'nicht prüfbar'), 'H4: Protokoll mit der neuen Liste');
}
console.log('t_analyse_p2410_abschluss ok');
