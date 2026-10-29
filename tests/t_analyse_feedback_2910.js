/* Feedback-Runde 29.10.2026, Analyse Tool (Entscheide Jonas): A1 abgelesenes Modell gilt (kein Icecat, Modell in der Antwort), A2 Preis im Abschluss,
   A4 Übernahme-Meldung mit Tabs und Log, E1 Befund frei bearbeitbar (befundText), E5 Ablauf ohne Recherche, E10 nur Hauptbild Pflicht.
   Erfundene Daten. Lauf: node tests/t_analyse_feedback_2910.js */
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const CODE = fs.readFileSync(__dirname + '/../apps/analyse/Code.gs', 'utf8');
const j = x => JSON.parse(JSON.stringify(x));

function umgebung() {
  const c = { console, JSON, Math, Date, RegExp, Utilities: { formatDate: () => '29.10.2026' } };
  vm.createContext(c); vm.runInContext(CODE, c);
  const DB = { Produkte: [], Analysen: [], Ricardo: [], Matchmaker: [], 'Prüfschritte': [], 'Testmittel-Log': [], Stufen: [], Testmittel: [], Sicherheitspunkte: [], Recherche: [] }, KOPF = {}, PROPS = {}, LOG = [];
  KOPF.Analysen = vm.runInContext('ANALYSEN_KOPF', c).slice();
  KOPF.Produkte = ['PG-ID', 'Bezeichnung', 'Analyse-Status', 'Recherche-Schlüssel', 'Herkunft', 'Reparatur-Stand', 'VP CHF', 'Neupreis CHF', 'Barcode', 'Link'];
  let zeit = 0; const zw = n => String(n).padStart(2, '0');
  c.zeit_ = d => d ? '29.10.2026 10:00:00' : '29.10.2026 10:' + zw(10 + (zeit++ % 50)) + ':00';
  c.lies_ = n => ({ kopf: KOPF[n] || [], z: (DB[n] || []).map((r, i) => Object.assign({ _r: i + 2 }, r)) });
  c.schreib_ = (n, o) => { if (!DB[n]) DB[n] = []; o.forEach(x => DB[n].push(j(x))); return DB[n].length; };
  c.setz_ = (n, f, w) => { Object.keys(w).forEach(r => { DB[n][Number(r) - 2][f] = w[r]; }); };
  c.produkt_ = id => c.lies_('Produkte').z.filter(r => c.idKey_(r['PG-ID']) === c.idKey_(id))[0];
  c.einst_ = () => ({ 'Garantie Tage': 90, 'Ricardo ab VP CHF': 50 }); c.gesperrt_ = f => f(); c.rueckmeldung_ = () => {}; c.takt_ = () => {}; c.blatt_ = () => ({});
  c.log_ = (a, i, d) => LOG.push(a + ' | ' + i + ' | ' + d); c.einmalProTag_ = (a, l) => l;
  c.PropertiesService = { getScriptProperties: () => ({ getProperty: k => PROPS[k] || null, setProperty: (k, v) => { PROPS[k] = v; }, deleteProperty: k => { delete PROPS[k]; } }) };
  c.CacheService = { getScriptCache: () => ({ get: () => null, put: () => {}, remove: () => {}, getAll: () => ({}), putAll: () => {}, removeAll: () => {} }) };
  c.scoreGrenzen_ = () => [70, 40]; c.rechercheVon_ = () => ({ kopf: [], z: DB.Recherche }); c.handbuchFuer_ = () => null; c.manualslibSuche_ = () => '';
  c.ricardoVersand_ = () => [{ name: 'Paket', preis: 9 }]; c.startpreisProzent_ = () => ({ A: 60, B: 50, C: 40 }); c.fotoUrl_ = () => 'https://x/foto';
  c.funktionsAuswahl_ = (fn) => ({ kern: fn, weitere: [], ungeprueft: [], ungeprueftKurz: [] });
  return { c, DB, KOPF, PROPS, LOG };
}

/* ---- A1: abgelesenes Modell ---- */
{
  const { c } = umgebung();
  assert.strictEqual(c.modellAbgelesen_('KMX750', ''), 'KMX750', 'leer → abgelesenes Modell');
  assert.strictEqual(c.modellAbgelesen_('KMX750', 'kMix KMX750'), 'kMix KMX750', 'Antwort enthält das Modell: Antwort bleibt');
  assert.strictEqual(c.modellAbgelesen_('US-ANSI', 'Magic Keyboard CH'), 'US-ANSI (Magic Keyboard CH)', 'Antwort passt nicht: abgelesenes Modell zuerst');
  const p = { 'Bezeichnung': 'Apple Magic Keyboard (CH)', 'Barcode': '194252433126', 'Link': 'https://galaxus.ch/x', 'Herkunft': 'Retoure', 'VP CHF': 149 };
  const k = { zb: [], testmittel: [], vorhanden: [] }, e = { 'KI-Modell Recherche': 'claude-haiku-5-5', 'Recherche-Anweisung': 'A', 'Funktions-Anweisung': 'F', 'Hausregeln': 'H' };
  const mit = c.params_(p, { titel: 'Icecat-Titel' }, e, k, 'US-ANSI').messages[0].content, ohne = c.params_(p, null, e, k, '').messages[0].content;
  assert.ok(/^Modell, am Gerät abgelesen: US-ANSI\. Es ist verbindlich/.test(mit), 'A1: Modell steht zuerst und ist verbindlich');
  assert.ok(/Händler-Listing \(kann eine andere Variante/.test(mit) && /EAN des Händler-Listings/.test(mit), 'A1: Listing und EAN nur als Hinweis');
  assert.ok(/^Produkt: Apple Magic Keyboard/.test(ohne) && /\nEAN: 194252433126/.test(ohne), 'ohne Modell wie bisher');
  /* rechercheJetzt mit Modell: kein Icecat-Aufruf, Modell in der Antwort ersetzt */
  const u2 = umgebung(); let icecat = 0, geschrieben = null;
  u2.c.icecat_ = () => { icecat++; return { daten: {}, log: [] }; }; u2.c.recherchiert_ = () => ({ K: true }); u2.c.kontext_ = () => k;
  u2.c.claude_ = () => ({}); u2.c.text_ = () => '{}'; u2.c.json_ = () => ({ marke: 'Apple', modell: 'Magic Keyboard CH', funktionen: [], infos: [] });
  u2.c.rechercheNorm_ = r => r; u2.c.rechercheSchreiben_ = (p0, d) => { geschrieben = d; }; u2.c.uebNeu_ = () => {}; u2.c.ueberblick_ = () => ({ ok: true });
  u2.c.SpreadsheetApp = { flush: () => {} }; u2.c.schreib_ = () => {};
  u2.DB.Produkte.push({ 'PG-ID': 'PG-1', 'Bezeichnung': 'Apple Magic Keyboard (CH)', 'Analyse-Status': 'Offen', 'Recherche-Schlüssel': 'K', 'Herkunft': 'Retoure', 'VP CHF': 149 });
  u2.c.rechercheJetzt('PG-1', 'US-ANSI');
  assert.strictEqual(icecat, 0, 'A1: mit Modell kein Icecat');
  assert.strictEqual(geschrieben.modell, 'US-ANSI (Magic Keyboard CH)', 'A1: abgelesenes Modell steht in der geschriebenen Recherche');
  assert.ok(u2.LOG.some(l => /Neu recherchiert \| PG-1 \| Modell, am Gerät abgelesen: US-ANSI/.test(l)));
}

/* ---- E10: nur das Hauptbild ist Pflicht ---- */
{
  const { c } = umgebung();
  const st = { zahl: { hauptbild: 1, weitere: 0, typenschild: 0, mangel: 0 }, ohneTypenschild: false, ohneMangel: false };
  assert.strictEqual(c.fotoFehlt_(st, true).length, 0, 'E10: Hauptbild da → nichts fehlt');
  assert.strictEqual(c.fotoFehlt_({ zahl: { hauptbild: 0, weitere: 3, typenschild: 1, mangel: 1 } }, false).join(), 'Hauptbild', 'E10: ohne Hauptbild fehlt das Hauptbild');
  assert.strictEqual(c.fotoEmpfohlen_(st, true).join('|'), 'zwei weitere Fotos|Typenschild|Mangel', 'E10: der Rest ist Empfehlung');
}

/* ---- E5: Ablauf ohne Recherche, E1 Befundtext, A2 Preis ---- */
{
  const { c, DB, LOG } = umgebung();
  DB.Produkte.push({ 'PG-ID': 'PG-7', 'Bezeichnung': 'Kochtopf 24 cm', 'Analyse-Status': 'Offen', 'Recherche-Schlüssel': 'K7', 'Herkunft': 'Retoure', 'VP CHF': 30, 'Neupreis CHF': 60 });
  DB.Stufen.push({ 'Herkunft': 'Retoure', 'VP ab CHF': 0, 'Stufe': 'Key Functions', 'Minuten': 10, 'Websuchen': 3, 'KI-Modell': '', 'Recherche-Umfang': 'Voll', 'Prüfumfang': 'Kern' });
  const e = c.einst_(), p = c.produkt_('PG-7');
  const u0 = c.ueberblick_(p, e);
  assert.strictEqual(u0.ablauf.length, 0, 'ohne Recherche und ohne Flag: kein Ablauf (wie bisher)');
  const u = c.ueberblick_(p, e, true);
  assert.strictEqual(u.ablauf.join(), 'ident,voll,funktion,zustand,entscheid', 'E5: kurzer Ablauf');
  assert.ok(u.ohne === true && u.recherche === true && u.funktion.ersatz === true && u.funktion.liste.length === 1 && u.liefer.teile.length === 0, 'E5: Ersatzfunktion, Lieferumfang als Freitext');
  assert.strictEqual(c.starteAnalyse('PG-7', true).ohne, true, 'E5: starteAnalyse(id, true)');
  assert.strictEqual(c.starteAnalyse('PG-7').ohne, false);
  /* Urteil mit eigenem Befundtext */
  const bezug = { ablauf: u.ablauf, sicher: [], liefer: [], fn: u.funktion.liste.map(x => x.n), reset: [] };
  const d = { id: 'PG-7', kuerzel: 'AB', start: Date.UTC(2026, 9, 29, 8, 0, 0), aktivSek: 120, ohne: true, fn: ['ok'], grade: 'B', kanal: 'regal', lauf: 'L-1', v: '2026-10-29.1', bezug: bezug,
    maengel: 'Kleine Delle am Rand', befundText: '' };
  const x1 = c.urteil_(j(d), u, e);
  assert.ok(x1.reusable && /Kleine Delle am Rand/.test(x1.befund), 'E1: ohne eigenen Text wie bisher (Mängel im Befund)');
  const x2 = c.urteil_(j(Object.assign({}, d, { befundText: 'Alles geprüft, Deckel sitzt, kleine Delle am Rand.' })), u, e);
  assert.strictEqual(x2.befund, 'Alles geprüft, Deckel sitzt, kleine Delle am Rand.', 'E1: eigener Text ersetzt den Befund');
  /* Abschluss: Preis kommt zurück (Regal: VP), Befund = eigener Text */
  const r = c.abschliessen(j(Object.assign({}, d, { befundText: 'Eigener Befund.' })));
  assert.strictEqual(r.preis, 30, 'A2: Preis (VP) im Abschluss');
  assert.strictEqual(DB.Analysen[0]['Befund'], 'Eigener Befund.', 'E1: eigener Befund im Protokoll');
  assert.ok(r.reusable && r.nr === 'A-000001');
  /* Abschluss Ricardo: Startpreis */
  const { c: c2, DB: DB2 } = umgebung();
  DB2.Produkte.push({ 'PG-ID': 'PG-8', 'Bezeichnung': 'Toaster', 'Analyse-Status': 'Offen', 'Recherche-Schlüssel': 'K8', 'Herkunft': 'Retoure', 'VP CHF': 40, 'Neupreis CHF': 80 });
  DB2.Stufen.push(DB.Stufen[0]);
  const u8 = c2.ueberblick_(c2.produkt_('PG-8'), e, true);
  c2.ricardoPruefen_ = () => ({ 'PG-ID': 'PG-8', 'Titel': 'Toaster', 'Startpreis CHF': 48 });
  const r8 = c2.abschliessen({ id: 'PG-8', kuerzel: 'AB', start: 1, aktivSek: 60, ohne: true, fn: ['ok'], grade: 'A', kanal: 'ricardo', ricardo: {}, lauf: 'L-8', v: '2026-10-29.1',
    bezug: { ablauf: u8.ablauf, sicher: [], liefer: [], fn: u8.funktion.liste.map(x => x.n), reset: [] } });
  assert.strictEqual(r8.preis, 48, 'A2: Startpreis Ricardo im Abschluss');
  assert.ok(!LOG.some(l => /Überblick geändert/.test(l)), 'E5: Abschluss mit ohne = true nimmt denselben kurzen Ablauf');
  /* Review 29.10.2026 (7): versiegelt → eigener Befundtext zählt nicht */
  const xv = c.urteil_(j(Object.assign({}, d, { versiegelt: true, befundText: 'Alter Handtext' })), u, e);
  assert.ok(!/Alter Handtext/.test(xv.befund), 'Review 7: bei versiegelt gilt der feste Befund, nicht der Handtext');
}

/* ---- Review 29.10.2026 (1, 4): Matchmaker mit «ohne Recherche»: das Flag bleibt im Stand, der Wiedereinstieg holt den kurzen Ablauf, der Abschluss danach bringt den Preis ---- */
{
  const { c, DB } = umgebung();
  DB.Produkte.push({ 'PG-ID': 'PG-9', 'Bezeichnung': 'Pfanne', 'Analyse-Status': 'Offen', 'Recherche-Schlüssel': 'K9', 'Herkunft': 'Retoure', 'VP CHF': 25, 'Neupreis CHF': 50 });
  DB.Stufen.push({ 'Herkunft': 'Retoure', 'VP ab CHF': 0, 'Stufe': 'Key Functions', 'Minuten': 10, 'Websuchen': 3, 'KI-Modell': '', 'Recherche-Umfang': 'Voll', 'Prüfumfang': 'Kern' });
  c.mmPruefen_ = () => ({ gesucht: 'Pfanne', schluessel: 'k9', mehr: '' }); c.mmVermerk_ = () => {}; c.mmStatus_ = () => {};
  const e = c.einst_(), u = c.ueberblick_(c.produkt_('PG-9'), e, true);
  const bezug = { ablauf: u.ablauf, sicher: [], liefer: [], fn: u.funktion.liste.map(x => x.n), reset: [] };
  const s = { fn: ['ok'], grade: 'A' };
  const r = c.abschliessen({ id: 'PG-9', kuerzel: 'AB', start: 1, aktivSek: 60, ohne: true, fn: ['ok'], grade: 'A', kanal: 'matchmaker', mm: { gesucht: 'Pfanne', schluessel: 'k9' },
    stand: { s: s, i: 4, start: 1, aktiv: 60000, rm: {}, ohne: true }, lauf: 'L-9', v: '2026-10-29.1', bezug: bezug });
  assert.strictEqual(r.regal, 'Matchmaker');
  const st = JSON.parse(DB.Analysen[0]['Stand']);
  assert.strictEqual(st.ohne, true, 'Review 1: «ohne» steht im gespeicherten Stand');
  const z = c.matchmakerZurueck('PG-9');
  assert.ok(z.d.ohne === true && z.d.ablauf.join() === 'ident,voll,funktion,zustand,entscheid', 'Review 1: Wiedereinstieg holt den kurzen Ablauf');
  c.mmPruefen_ = () => null;
  const r2 = c.abschliessen({ id: 'PG-9', kuerzel: 'AB', start: 1, aktivSek: 90, ohne: true, nachMm: true, fn: ['ok'], grade: 'A', kanal: 'regal', lauf: 'L-9b', v: '2026-10-29.1', bezug: bezug });
  assert.ok(r2.regal === 'Analysiert' && r2.preis === 25, 'Review 4: Abschluss nach dem Wiedereinstieg bringt den Preis (VP)');
}

/* ---- A4: Übernahme abgelehnt: Meldung nennt die Tabs, Log-Zeile ---- */
{
  const { c, LOG } = umgebung();
  c.SpreadsheetApp = { openById: () => ({}) }; c.rtKanalTabs_ = () => ['Analyse', 'Stationär']; c.rtSuchTabs_ = () => ['Analyse', 'Stationär', 'Archiv Stationär', 'Lieferliste'];
  c.rtFinde_ = () => [{ tab: 'Archiv Stationär', idN: 'PG-5' }, { tab: 'Lieferliste', idN: 'PG-5' }]; c.rtLesen_ = () => ({ zeilen: [] });
  assert.throws(() => c.uebernehmen('PG-5'), /Tab «Archiv Stationär», «Lieferliste», der nicht als Kanal-Tab gilt\. Kanal-Tabs: Analyse, Stationär\./, 'A4: Tabs in der Meldung');
  assert.ok(LOG.some(l => /^Übernahme abgelehnt \| PG-5 \| Tabs: Archiv Stationär, Lieferliste/.test(l)), 'A4: Log');
  c.rtFinde_ = () => [{ tab: 'Archiv Stationär', idN: 'PG-5' }];
  assert.throws(() => c.uebernehmen('PG-5'), /steht nur im Archiv des Return Tools \(Archiv Stationär\)/, 'A4: nur Archiv');
  c.rtFinde_ = () => [];
  assert.throws(() => c.uebernehmen('PG-5'), /steht nicht im Return Tool/, 'A4: nicht gefunden');
}
console.log('t_analyse_feedback_2910 ok');
