/**
 * UMPACK TOOL – Pretty Good
 *
 * Paletten neu triagieren: Stücke aus bestehenden Paletten (z.B. KID-1 bis KID-12) herausnehmen und in neue Gebinde packen.
 * Ein Durchgang hat drei Phasen (Entscheid Jonas 21.10.2026):
 *   1. Setup:     Quelle (Lagerorte aus dem Return Tool lesen oder eine Liste von Hand einfügen) und Ziel-Gebinde festlegen.
 *                 Gebinde-Arten: Verkauf an einen Abnehmer (z.B. Balu 1), neue Palette im Lager (z.B. KID-13), Entsorgung.
 *   2. Scan:      Jedes Stück in sein Gebinde scannen. Preis pro Gebinde (VP, Prozent vom VP, 0) oder pro Stück.
 *   3. Abschluss: Kontrolle, Liste pro Abnehmer als eigenes Sheet, Änderungsliste fürs Return Tool.
 *                 Übertragung ins Return Tool: manuell nach der Änderungsliste. Die automatische Übertragung ist noch gesperrt
 *                 (braucht das Einverständnis von Jonas M. und den nachgebauten Verkaufsablauf des Return Tools).
 * Grundregeln
 *  - Alle Entscheide stehen in diesem Sheet. Das Return Tool wird nur gelesen (beim Setup), nie geschrieben.
 *  - Die Oberfläche ruft den Server nur über api(name, argumente) auf. Spalten werden über ihre Kopfzeilen gefunden.
 *  - Schreiben nur in einer Sperre (LockService), damit mehrere Personen gleichzeitig scannen können.
 */

const VERSION = '2026-10-21.1';
const TZ = 'Europe/Zurich';
const RT_ID = '1FpHJNeWZENdhgP6MqAYyOOEe1FN0tIZWOkRiYItOz2E';          // Return Tool, nur lesen
const DB_ID = '1VexhXpyWyGTVaKiH7BPLPNQyENKYA-flgeRs-FPN-IA';         // Datenbank «(21/10/2026) UMPACK TOOL» (eigenständiges Skript, nicht im Sheet)
const ABLAGE_ID = '1S3ErLO9WlDyCK2UfVEwNuBA9XFmuFMSK';                  // Drive-Ordner «00_Claude-Eingang» für die Abnehmer-Listen
const QUELL_TABS = 'Stationär, Berner Brocki, Caritas, Heilsarmee, Online, Spenden';
const ARTEN = ['Verkauf', 'Lager', 'Entsorgung'];
const REGELN = ['VP', 'Prozent', 'Null'];

const KOPF = {
  'Durchgänge': ['Durchgang', 'Name', 'Status', 'Quelle', 'Quell-Lagerorte', 'Erstellt am', 'Erstellt von', 'Abgeschlossen am', 'Abgeschlossen von', 'Listen'],
  'Gebinde': ['Durchgang', 'Gebinde', 'Name', 'Art', 'Abnehmer', 'Lagerort neu', 'Preisregel', 'Prozent'],
  'Bestand': ['Durchgang', 'PG-ID', 'Barcode', 'Bezeichnung', 'Kategorie', 'OVP', 'VP', 'Lagerort alt', 'Quelle Tab', 'Quelle Zeile'],
  'Zuordnung': ['Durchgang', 'PG-ID', 'Gebinde', 'Preis', 'Zeit', 'Kürzel'],
  'Änderungen': ['Durchgang', 'PG-ID', 'Bezeichnung', 'Aktion', 'Gebinde', 'Abnehmer', 'Lagerort alt', 'Lagerort neu', 'VP alt', 'Preis', 'Return-Tool-Tab', 'Zeile', 'Erledigt'],
  'Log': ['Zeit', 'Person', 'Aktion', 'Durchgang', 'Detail'],
  'Einstellungen': ['Einstellung', 'Wert', 'Erklärung']
};
const EINST = [
  ['Return Tool ID', RT_ID, 'Aus diesem Sheet liest das Setup den Bestand. Das Tool schreibt dort nie.'],
  ['Quell-Tabs', QUELL_TABS, 'In diesen Tabs des Return Tools sucht das Setup nach Lagerorten, mit Komma getrennt.'],
  ['Ablage-Ordner ID', ABLAGE_ID, 'In diesen Drive-Ordner legt der Abschluss die Liste pro Abnehmer.'],
  ['Admins', '', 'E-Mail-Adressen, die einen abgeschlossenen Durchgang wieder öffnen dürfen. Leer = alle.']
];
const KATALOG = [
  { tab: 'Durchgänge', art: 'arbeit', inhalt: 'Ein Durchgang pro Umpack-Aktion: Name, Status (Setup, Scan, Abgeschlossen), Quelle.' },
  { tab: 'Gebinde', art: 'arbeit', inhalt: 'Die Ziel-Gebinde pro Durchgang: Verkauf an Abnehmer, neue Palette im Lager, Entsorgung, mit Preisregel.' },
  { tab: 'Bestand', art: 'arbeit', inhalt: 'Die Stücke der Quelle beim Setup (Kopie aus dem Return Tool oder von Hand eingefügt).' },
  { tab: 'Zuordnung', art: 'arbeit', inhalt: 'Welches Stück in welches Gebinde gescannt wurde. Preis leer = Preisregel des Gebindes.' },
  { tab: 'Änderungen', art: 'arbeit', inhalt: 'Beim Abschluss: was im Return Tool zu ändern ist (Lagerort, Preis, verkauft, entsorgt). «Erledigt» setzt ihr, wenn es eingetragen ist.' },
  { tab: 'Log', art: 'protokoll', inhalt: 'Jede Aktion mit Zeit und Person.' },
  { tab: 'Einstellungen', art: 'einstellung', inhalt: 'Return Tool, Quell-Tabs, Ablage-Ordner, Admins.' }
];

/* ------------------------------------------------------------------ */
/* Web-App und Einrichtung                                             */
/* ------------------------------------------------------------------ */

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index').setTitle('Umpack Tool').addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** Legt die Tabs mit Kopfzeilen an und bringt das Sheet auf den Pretty-Good-Standard. Ändert keine Daten. */
function einrichten() {
  const ss = ss_();
  Object.keys(KOPF).forEach(function (n) {
    let sh = ss.getSheetByName(n);
    if (!sh) {
      const leer = ss.getSheets().filter(function (s) { return s.getLastRow() === 0 && /^(Tabelle|Sheet|Blatt)\s*1$/.test(s.getName()); })[0];
      sh = leer ? leer.setName(n) : ss.insertSheet(n);
    }
    const k = KOPF[n], alt = sh.getLastColumn() ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String) : [];
    k.forEach(function (name) { if (alt.indexOf(name) === -1) { alt.push(name); sh.getRange(1, alt.length).setValue(name); } });
    if (n !== 'Einstellungen' && n !== 'Log') sh.getRange(1, 1, sh.getMaxRows(), alt.length).setNumberFormat('@');   // IDs, Barcodes, Preise als Text: nichts wird umgewandelt
  });
  const e = ss.getSheetByName('Einstellungen'), da = e.getLastRow() > 1 ? e.getRange(2, 1, e.getLastRow() - 1, 1).getValues().map(function (r) { return String(r[0]).trim(); }) : [];
  EINST.forEach(function (z) { if (da.indexOf(z[0]) === -1) e.appendRow([z[0], z[1] === undefined ? '' : z[1], z[2]]); });
  basisEinrichten_(ss, { name: 'Umpack Tool', version: VERSION, zweck: 'Paletten neu triagieren: Setup, Scan, Abschluss. Das Return Tool wird nur gelesen; was dort zu ändern ist, steht im Tab «Änderungen».' }, KATALOG,
    [['Regeln', ['Ein Durchgang: Setup (Quelle und Gebinde), Scan (jedes Stück in sein Gebinde), Abschluss (Listen und Änderungen).',
      'Preis 0 = verschenkt. Gebinde-Arten: Verkauf an Abnehmer, neue Palette im Lager, Entsorgung.',
      'Die Änderungen im Return Tool trägt ihr nach dem Tab «Änderungen» ein und setzt «Erledigt». Verkauf: Lagerort auf das Gebinde setzen, dann «Lieferung erstellen».']]]);
  vergiss_();
  return 'ok';
}

/* ------------------------------------------------------------------ */
/* Sheet-Zugriff                                                       */
/* ------------------------------------------------------------------ */

let MEMO = {};
function ss_() { return SpreadsheetApp.openById(DB_ID); }
function blatt_(n) {
  const sh = ss_().getSheetByName(n);
  if (!sh) throw new Error('Tab «' + n + '» fehlt. Bitte im Apps-Script-Projekt «einrichten» ausführen.');
  return sh;
}
/** Liest einen Tab als Liste von Objekten. _r = Zeilennummer im Sheet. */
function lies_(n) {
  if (MEMO[n]) return MEMO[n];
  const sh = blatt_(n), v = sh.getDataRange().getValues(), kopf = (v[0] || []).map(function (x) { return String(x).trim(); });
  const z = [];
  for (let i = 1; i < v.length; i++) {
    if (!v[i].some(function (x) { return String(x) !== ''; })) continue;
    const o = { _r: i + 1 };
    kopf.forEach(function (k, j) { if (k) o[k] = v[i][j]; });
    z.push(o);
  }
  MEMO[n] = { kopf: kopf, z: z };
  return MEMO[n];
}
function vergiss_(n) { if (n) delete MEMO[n]; else MEMO = {}; }
/** Hängt Zeilen an (Objekte, Spalten nach Kopfzeile). Werte als Text, damit Sheets nichts umwandelt. */
function schreib_(n, zeilen) {
  if (!zeilen.length) return;
  const sh = blatt_(n), kopf = lies_(n).kopf;
  const werte = zeilen.map(function (o) { return kopf.map(function (k) { return o[k] === undefined || o[k] === null ? '' : String(o[k]); }); });
  sh.getRange(sh.getLastRow() + 1, 1, werte.length, kopf.length).setValues(werte);
  vergiss_(n);
}
/** Setzt einzelne Felder in bestehenden Zeilen: [{ _r, Feld: Wert }]. */
function setz_(n, aend) {
  if (!aend.length) return;
  const sh = blatt_(n), kopf = lies_(n).kopf;
  aend.forEach(function (a) {
    Object.keys(a).forEach(function (k) {
      if (k === '_r') return;
      const c = kopf.indexOf(k);
      if (c < 0) throw new Error('Spalte «' + k + '» fehlt im Tab «' + n + '».');
      sh.getRange(a._r, c + 1).setValue(a[k] === null || a[k] === undefined ? '' : String(a[k]));
    });
  });
  vergiss_(n);
}
function gesperrt_(f) {
  const l = LockService.getScriptLock();
  if (!l.tryLock(20000)) throw new Error('Gerade speichert jemand anderes. Bitte nochmals versuchen.');
  try { vergiss_(); return f(); } finally { SpreadsheetApp.flush(); l.releaseLock(); }
}
function einst_() {
  const e = {};
  lies_('Einstellungen').z.forEach(function (r) { e[String(r['Einstellung']).trim()] = String(r['Wert'] === undefined ? '' : r['Wert']).trim(); });
  return e;
}
function ich_() { try { return Session.getActiveUser().getEmail() || ''; } catch (err) { return ''; } }
function zeit_(d) { return Utilities.formatDate(d || new Date(), TZ, 'dd.MM.yyyy HH:mm:ss'); }
function log_(aktion, durchgang, detail) {
  try { schreib_('Log', [{ 'Zeit': zeit_(), 'Person': ich_(), 'Aktion': aktion, 'Durchgang': durchgang || '', 'Detail': String(detail || '').slice(0, 500) }]); } catch (err) { /* Log darf nie stören */ }
}
function zahl_(x) {
  if (typeof x === 'number') return x;
  const s = String(x == null ? '' : x).replace(/['’\s]/g, '').replace(/CHF/i, '');
  if (!s) return 0;
  const n = Number(/,\d{1,2}$/.test(s) ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, ''));
  return isFinite(n) ? n : 0;
}
function rappen_(x) { return Math.round(Number(x) * 100) / 100; }
function norm_(s) { return String(s == null ? '' : s).trim().toUpperCase(); }

/* ------------------------------------------------------------------ */
/* Einstieg für die Oberfläche                                         */
/* ------------------------------------------------------------------ */

function api(name, args) {
  const f = { start: start, lagerorte: lagerorte, anlegen: anlegen, laden: laden, zuordnen: zuordnen, gebindeAendern: gebindeAendern,
    scanStarten: scanStarten, abschliessen: abschliessen, erledigt: erledigt, wiederOeffnen: wiederOeffnen }[name];
  if (!f) throw new Error('Unbekannte Funktion.');
  try { return f.apply(null, args || []); }
  catch (e) { log_('Fehler', '', name + ': ' + (e && e.message)); throw e; }
}

/** Startseite: alle Durchgänge, der neueste zuerst. */
function start() {
  const d = lies_('Durchgänge').z.map(function (r) {
    return { id: String(r['Durchgang']), name: String(r['Name']), status: String(r['Status']), quelle: String(r['Quelle']), lagerorte: String(r['Quell-Lagerorte']),
      erstellt: String(r['Erstellt am']), abgeschlossen: String(r['Abgeschlossen am'] || ''), listen: String(r['Listen'] || '') };
  }).reverse();
  return { version: VERSION, durchgaenge: d, ich: ich_() };
}

/* ------------------------------------------------------------------ */
/* Setup                                                               */
/* ------------------------------------------------------------------ */

/** Liest die Quell-Tabs des Return Tools. Gibt pro Tab die Zeilen mit Kopf zurück (Kopfzeile = erste Zeile mit «ID» und «Lagerort»). */
function rtLesen_(e) {
  const rt = SpreadsheetApp.openById(e['Return Tool ID'] || RT_ID), aus = [];
  String(e['Quell-Tabs'] || QUELL_TABS).split(',').map(function (t) { return t.trim(); }).filter(String).forEach(function (tab) {
    const sh = rt.getSheetByName(tab);
    if (!sh || sh.getLastRow() < 2) return;
    const v = sh.getDataRange().getValues();
    let k = -1;
    for (let i = 0; i < Math.min(v.length, 15); i++) { const z = v[i].map(function (x) { return String(x).trim(); }); if (z.indexOf('ID') > -1 && z.indexOf('Lagerort') > -1) { k = i; break; } }
    if (k < 0) return;
    const kopf = v[k].map(function (x) { return String(x).trim(); }), c = function (n) { return kopf.indexOf(n); };
    for (let i = k + 1; i < v.length; i++) {
      const id = String(v[i][c('ID')] || '').trim();
      if (!/^[A-Z]{2,4}-\d+$/i.test(id)) continue;
      const g = function (n) { return c(n) < 0 ? '' : v[i][c(n)]; };
      aus.push({ id: id, barcode: String(g('Barcode')).replace(/^'/, '').trim(), name: String(g('Bezeichnung')).trim(), kat: String(g('Kategorie')).trim(),
        ovp: zahl_(g('OVP')), vp: zahl_(g('VP')), ort: String(g('Lagerort')).trim(), tab: tab, zeile: i + 1 });
    }
  });
  return aus;
}

/** Setup: alle Lagerorte aus den Quell-Tabs mit Anzahl Stücke, und die nächste freie Nummer pro Kürzel (z.B. KID → KID-13). */
function lagerorte() {
  const e = einst_(), alle = rtLesen_(e), je = {}, max = {};
  alle.forEach(function (p) {
    const o = p.ort || '(ohne Lagerort)';
    je[o] = je[o] || { ort: o, anzahl: 0, tabs: {} };
    je[o].anzahl++; je[o].tabs[p.tab] = true;
    const m = /^([A-Z]+)-(\d+)$/i.exec(p.ort);
    if (m) { const k = m[1].toUpperCase(); max[k] = Math.max(max[k] || 0, Number(m[2])); }
  });
  /* Auch Lagerorte, die schon in einem offenen Durchgang als neues Gebinde vergeben sind, zählen als belegt. */
  lies_('Gebinde').z.forEach(function (g) { const m = /^([A-Z]+)-(\d+)$/i.exec(String(g['Lagerort neu'])); if (m) { const k = m[1].toUpperCase(); max[k] = Math.max(max[k] || 0, Number(m[2])); } });
  const naechste = {};
  Object.keys(max).forEach(function (k) { naechste[k] = k + '-' + (max[k] + 1); });
  return { orte: Object.keys(je).sort(ortSort_).map(function (o) { return { ort: o, anzahl: je[o].anzahl, tabs: Object.keys(je[o].tabs).join(', ') }; }), naechste: naechste };
}
function ortSort_(a, b) {
  const x = /^([A-Z]+)-(\d+)$/i.exec(a), y = /^([A-Z]+)-(\d+)$/i.exec(b);
  if (x && y && x[1].toUpperCase() === y[1].toUpperCase()) return Number(x[2]) - Number(y[2]);
  return a.localeCompare(b);
}

/** Liste von Hand (Export, aus Excel oder Sheets kopiert): Kopfzeile mit ID oder PG-ID, dazu Bezeichnung, VP, Lagerort, Barcode, Kategorie (optional). */
function manuellLesen_(text) {
  const zeilen = String(text || '').replace(/\r/g, '').split('\n').filter(function (z) { return z.trim(); });
  if (zeilen.length < 2) throw new Error('Die Liste braucht eine Kopfzeile und mindestens ein Stück.');
  const trenn = zeilen[0].indexOf('\t') > -1 ? '\t' : (zeilen[0].indexOf(';') > -1 ? ';' : ',');
  const kopf = zeilen[0].split(trenn).map(function (x) { return x.trim().toLowerCase(); });
  const c = function (namen) { for (let i = 0; i < namen.length; i++) { const j = kopf.indexOf(namen[i]); if (j > -1) return j; } return -1; };
  const ci = c(['id', 'pg-id', 'pgid']), cb = c(['barcode', 'ean']), cn = c(['bezeichnung', 'produkt', 'name']), cv = c(['vp', 'preis', 'vp chf']), co = c(['lagerort', 'ort', 'palette']), ck = c(['kategorie']), cov = c(['ovp', 'neupreis']);
  if (ci < 0) throw new Error('In der Kopfzeile fehlt die Spalte «ID» oder «PG-ID».');
  const aus = [];
  zeilen.slice(1).forEach(function (z, i) {
    const t = z.split(trenn), g = function (j) { return j < 0 ? '' : String(t[j] === undefined ? '' : t[j]).trim(); };
    if (!g(ci)) return;
    aus.push({ id: g(ci), barcode: g(cb), name: g(cn), kat: g(ck), ovp: zahl_(g(cov)), vp: zahl_(g(cv)), ort: g(co), tab: 'manuell', zeile: i + 2 });
  });
  return aus;
}

/** Prüft die Gebinde aus dem Setup. Gibt bereinigte Gebinde zurück. */
function gebindePruefen_(liste) {
  if (!Array.isArray(liste) || !liste.length) throw new Error('Bitte mindestens ein Gebinde anlegen.');
  const namen = {}, orte = {};
  return liste.map(function (g, i) {
    const name = String(g.name || '').trim(), art = String(g.art || ''), ort = norm_(g.lagerort), regel = String(g.preisregel || 'VP');
    if (!name) throw new Error('Gebinde ' + (i + 1) + ': Name fehlt.');
    if (namen[name.toLowerCase()]) throw new Error('Den Gebinde-Namen «' + name + '» gibt es doppelt.');
    namen[name.toLowerCase()] = true;
    if (ARTEN.indexOf(art) < 0) throw new Error('Gebinde «' + name + '»: Art fehlt.');
    if (art === 'Verkauf' && !String(g.abnehmer || '').trim()) throw new Error('Gebinde «' + name + '»: Abnehmer fehlt.');
    if (art !== 'Entsorgung' && !ort) throw new Error('Gebinde «' + name + '»: neuer Lagerort fehlt.');
    if (ort && orte[ort]) throw new Error('Den Lagerort «' + ort + '» haben zwei Gebinde.');
    if (ort) orte[ort] = true;
    if (REGELN.indexOf(regel) < 0) throw new Error('Gebinde «' + name + '»: Preisregel fehlt.');
    const pz = Number(String(g.prozent || '').replace(',', '.'));
    if (regel === 'Prozent' && !(pz >= 0 && pz <= 100)) throw new Error('Gebinde «' + name + '»: Prozent zwischen 0 und 100 eintragen.');
    return { id: g.id || '', name: name, art: art, abnehmer: art === 'Verkauf' ? String(g.abnehmer).trim() : '', lagerort: art === 'Entsorgung' ? '' : ort,
      preisregel: art === 'Entsorgung' ? 'Null' : regel, prozent: regel === 'Prozent' ? pz : '' };
  });
}

/**
 * Setup speichern: legt den Durchgang an, kopiert den Bestand der Quelle und speichert die Gebinde. Danach ist der Durchgang bereit zum Scannen.
 * s = { name, quelle: 'rt' | 'manuell', lagerorte: [..], liste: 'Text', gebinde: [{ name, art, abnehmer, lagerort, preisregel, prozent }], kuerzel }
 */
function anlegen(s) {
  s = s || {};
  const name = String(s.name || '').trim();
  if (!name) throw new Error('Bitte dem Durchgang einen Namen geben.');
  const gebinde = gebindePruefen_(s.gebinde);
  let bestand;
  if (s.quelle === 'manuell') bestand = manuellLesen_(s.liste);
  else {
    const orte = (s.lagerorte || []).map(String);
    if (!orte.length) throw new Error('Bitte mindestens einen Quell-Lagerort wählen.');
    bestand = rtLesen_(einst_()).filter(function (p) { return orte.indexOf(p.ort || '(ohne Lagerort)') > -1; });
  }
  if (!bestand.length) throw new Error('In der Quelle sind keine Stücke.');
  const doppelt = {}, ids = {};
  bestand.forEach(function (p) { const k = norm_(p.id); if (ids[k]) doppelt[k] = true; ids[k] = true; });
  if (Object.keys(doppelt).length) throw new Error('Diese IDs stehen in der Quelle doppelt: ' + Object.keys(doppelt).slice(0, 10).join(', ') + '. Bitte zuerst im Return Tool klären.');
  /* Ein neuer Lagerort darf in der Quelle nicht schon vorkommen (sonst wären alte und neue Stücke gemischt). */
  const quellOrte = {};
  bestand.forEach(function (p) { quellOrte[norm_(p.ort)] = true; });
  gebinde.forEach(function (g) { if (g.lagerort && quellOrte[g.lagerort]) throw new Error('Der neue Lagerort «' + g.lagerort + '» ist auch ein Quell-Lagerort. Bitte einen neuen wählen.'); });
  return gesperrt_(function () {
    let max = 0;
    lies_('Durchgänge').z.forEach(function (r) { const m = /^U-(\d+)$/.exec(String(r['Durchgang'])); if (m) max = Math.max(max, Number(m[1])); });
    const id = 'U-' + ('000' + (max + 1)).slice(-4), t = zeit_();
    schreib_('Durchgänge', [{ 'Durchgang': id, 'Name': name, 'Status': 'Scan', 'Quelle': s.quelle === 'manuell' ? 'Manuell' : 'Return Tool',
      'Quell-Lagerorte': s.quelle === 'manuell' ? 'Liste' : (s.lagerorte || []).join(', '), 'Erstellt am': t, 'Erstellt von': ich_() + (s.kuerzel ? ' (' + s.kuerzel + ')' : '') }]);
    schreib_('Gebinde', gebinde.map(function (g, i) {
      return { 'Durchgang': id, 'Gebinde': id + '-G' + (i + 1), 'Name': g.name, 'Art': g.art, 'Abnehmer': g.abnehmer, 'Lagerort neu': g.lagerort, 'Preisregel': g.preisregel, 'Prozent': g.prozent };
    }));
    schreib_('Bestand', bestand.map(function (p) {
      return { 'Durchgang': id, 'PG-ID': p.id, 'Barcode': p.barcode, 'Bezeichnung': p.name, 'Kategorie': p.kat, 'OVP': p.ovp || '', 'VP': p.vp, 'Lagerort alt': p.ort, 'Quelle Tab': p.tab, 'Quelle Zeile': p.zeile };
    }));
    log_('Durchgang angelegt', id, name + ' · ' + bestand.length + ' Stücke · ' + gebinde.map(function (g) { return g.name; }).join(', '));
    return laden(id);
  });
}

/** Gebinde während des Scans ergänzen oder ändern (z.B. eine dritte Balu-Palette). Gebinde mit Stücken lassen sich nicht löschen. */
function gebindeAendern(id, liste) {
  const d = durchgang_(id);
  if (d['Status'] === 'Abgeschlossen') throw new Error('Der Durchgang ist abgeschlossen.');
  const neu = gebindePruefen_(liste);
  return gesperrt_(function () {
    const alt = lies_('Gebinde').z.filter(function (g) { return String(g['Durchgang']) === id; }), belegt = {};
    lies_('Zuordnung').z.forEach(function (z) { if (String(z['Durchgang']) === id && String(z['Gebinde'])) belegt[String(z['Gebinde'])] = true; });
    const quellOrte = {};
    lies_('Bestand').z.forEach(function (p) { if (String(p['Durchgang']) === id) quellOrte[norm_(p['Lagerort alt'])] = true; });
    neu.forEach(function (g) { if (g.lagerort && quellOrte[g.lagerort]) throw new Error('Der neue Lagerort «' + g.lagerort + '» ist auch ein Quell-Lagerort.'); });
    alt.forEach(function (g) { if (belegt[String(g['Gebinde'])] && !neu.some(function (n) { return n.id === String(g['Gebinde']); })) throw new Error('Das Gebinde «' + g['Name'] + '» hat schon Stücke und lässt sich nicht löschen.'); });
    let max = 0;
    alt.forEach(function (g) { const m = /-G(\d+)$/.exec(String(g['Gebinde'])); if (m) max = Math.max(max, Number(m[1])); });
    const aend = [], dazu = [];
    neu.forEach(function (g) {
      const a = alt.filter(function (x) { return String(x['Gebinde']) === g.id; })[0];
      const werte = { 'Name': g.name, 'Art': g.art, 'Abnehmer': g.abnehmer, 'Lagerort neu': g.lagerort, 'Preisregel': g.preisregel, 'Prozent': g.prozent };
      if (a) {
        if (belegt[g.id] && String(a['Art']) !== g.art) throw new Error('Das Gebinde «' + a['Name'] + '» hat schon Stücke: Die Art lässt sich nicht mehr ändern.');
        aend.push(Object.assign({ _r: a._r }, werte));
      } else dazu.push(Object.assign({ 'Durchgang': id, 'Gebinde': id + '-G' + (++max) }, werte));
    });
    const weg = alt.filter(function (g) { return !neu.some(function (n) { return n.id === String(g['Gebinde']); }); });
    setz_('Gebinde', aend);
    schreib_('Gebinde', dazu);
    weg.forEach(function (g) { setz_('Gebinde', [{ _r: g._r, 'Durchgang': id + ' (gelöscht)' }]); });     // nicht löschen: bleibt als Verlauf
    log_('Gebinde geändert', id, neu.map(function (g) { return g.name; }).join(', '));
    return laden(id);
  });
}

/* ------------------------------------------------------------------ */
/* Scan                                                                */
/* ------------------------------------------------------------------ */

function durchgang_(id) {
  const d = lies_('Durchgänge').z.filter(function (r) { return String(r['Durchgang']) === String(id); })[0];
  if (!d) throw new Error('Durchgang ' + id + ' gibt es nicht.');
  return d;
}

/** Alles, was die Oberfläche für einen Durchgang braucht. Die Zuordnung prüft der Browser selbst (sofort), gespeichert wird im Hintergrund. */
function laden(id) {
  const d = durchgang_(id);
  const gebinde = lies_('Gebinde').z.filter(function (g) { return String(g['Durchgang']) === id; }).map(function (g) {
    return { id: String(g['Gebinde']), name: String(g['Name']), art: String(g['Art']), abnehmer: String(g['Abnehmer']), lagerort: String(g['Lagerort neu']),
      preisregel: String(g['Preisregel'] || 'VP'), prozent: g['Prozent'] === '' ? '' : Number(g['Prozent']) };
  });
  const bestand = lies_('Bestand').z.filter(function (p) { return String(p['Durchgang']) === id; }).map(function (p) {
    return { id: String(p['PG-ID']), barcode: String(p['Barcode']), name: String(p['Bezeichnung']), kat: String(p['Kategorie']), vp: zahl_(p['VP']), ort: String(p['Lagerort alt']), tab: String(p['Quelle Tab']) };
  });
  return { id: id, name: String(d['Name']), status: String(d['Status']), quelle: String(d['Quelle']), lagerorte: String(d['Quell-Lagerorte']),
    listen: String(d['Listen'] || ''), gebinde: gebinde, bestand: bestand, zuordnung: zuordnungVon_(id), aenderungen: d['Status'] === 'Abgeschlossen' ? aenderungenVon_(id) : [] };
}
function zuordnungVon_(id) {
  const z = {};
  lies_('Zuordnung').z.forEach(function (r) {
    if (String(r['Durchgang']) !== id) return;
    const k = norm_(r['PG-ID']);
    if (!String(r['Gebinde'])) { delete z[k]; return; }               // entfernt
    z[k] = { gebinde: String(r['Gebinde']), preis: String(r['Preis']) === '' ? '' : zahl_(r['Preis']), zeit: String(r['Zeit']), kuerzel: String(r['Kürzel']) };
  });
  return z;
}

/**
 * Speichert Scans (aus der Warteschlange des Browsers). ops = [{ id: 'PG-…', gebinde: 'U-0001-G1' | '' (entfernen), preis: '' | Zahl, vorher: 'U-0001-G2' | '' }]
 * vorher = das Gebinde, das der Browser beim Scannen gesehen hat. Hat jemand anderes das Stück inzwischen woanders hingelegt, gilt das als Konflikt und
 * wird nicht überschrieben. Gibt den neuen Stand der Zuordnung zurück, dazu die Konflikte.
 */
function zuordnen(id, ops, kuerzel) {
  const d = durchgang_(id);
  if (String(d['Status']) !== 'Scan') throw new Error('Der Durchgang ist nicht im Scan (Status: ' + d['Status'] + ').');
  return gesperrt_(function () {
    const z = zuordnungVon_(id), gebinde = {}, bestand = {}, t = zeit_(), neu = [], konflikte = [];
    lies_('Gebinde').z.forEach(function (g) { if (String(g['Durchgang']) === id) gebinde[String(g['Gebinde'])] = g; });
    lies_('Bestand').z.forEach(function (p) { if (String(p['Durchgang']) === id) bestand[norm_(p['PG-ID'])] = true; });
    (ops || []).forEach(function (o) {
      const k = norm_(o.id), jetzt = z[k] ? z[k].gebinde : '';
      if (!bestand[k]) { konflikte.push({ id: o.id, grund: 'nicht in der Quelle' }); return; }
      if (o.gebinde && !gebinde[o.gebinde]) { konflikte.push({ id: o.id, grund: 'Gebinde gibt es nicht' }); return; }
      if (o.vorher !== undefined && String(o.vorher || '') !== jetzt && String(o.gebinde || '') !== jetzt) { konflikte.push({ id: o.id, grund: 'inzwischen von jemand anderem in ' + (gebinde[jetzt] ? gebinde[jetzt]['Name'] : 'kein Gebinde') + ' gelegt', gebinde: jetzt }); return; }
      const preis = o.preis === '' || o.preis === undefined || o.preis === null ? '' : rappen_(zahl_(o.preis));
      if (preis !== '' && preis < 0) { konflikte.push({ id: o.id, grund: 'Preis kleiner als 0' }); return; }
      neu.push({ 'Durchgang': id, 'PG-ID': o.id, 'Gebinde': o.gebinde || '', 'Preis': preis, 'Zeit': t, 'Kürzel': String(kuerzel || '').toUpperCase().slice(0, 4) });
      if (o.gebinde) z[k] = { gebinde: o.gebinde, preis: preis, zeit: t }; else delete z[k];
    });
    schreib_('Zuordnung', neu);
    return { zuordnung: z, konflikte: konflikte };
  });
}

/** Aus «Setup» zurück in den Scan (z.B. nach dem Wiederöffnen). */
function scanStarten(id) {
  return gesperrt_(function () {
    const d = durchgang_(id);
    if (String(d['Status']) === 'Abgeschlossen') throw new Error('Der Durchgang ist abgeschlossen.');
    setz_('Durchgänge', [{ _r: d._r, 'Status': 'Scan' }]);
    return laden(id);
  });
}

/* ------------------------------------------------------------------ */
/* Abschluss                                                           */
/* ------------------------------------------------------------------ */

/** Preis eines Stücks: eigener Preis, sonst die Regel des Gebindes (VP, Prozent vom VP, 0). */
function preis_(g, vp, eigen) {
  if (eigen !== '' && eigen !== undefined && eigen !== null) return rappen_(zahl_(eigen));
  const r = String(g['Preisregel'] || 'VP');
  if (r === 'Null' || String(g['Art']) === 'Entsorgung') return 0;
  if (r === 'Prozent') return rappen_(vp * Number(g['Prozent'] || 0) / 100);
  return rappen_(vp);
}

/** Kontrolle vor dem Abschluss: alles in Ordnung? Gibt die Zahlen pro Gebinde und die Fehler zurück. */
function kontrolle_(id) {
  const geb = lies_('Gebinde').z.filter(function (g) { return String(g['Durchgang']) === id; });
  const bestand = lies_('Bestand').z.filter(function (p) { return String(p['Durchgang']) === id; }), z = zuordnungVon_(id), fehler = [];
  const pro = {};
  geb.forEach(function (g) { pro[String(g['Gebinde'])] = { g: g, stuecke: [] }; });
  bestand.forEach(function (p) {
    const a = z[norm_(p['PG-ID'])];
    if (!a) return;
    if (!pro[a.gebinde]) { fehler.push(p['PG-ID'] + ': Gebinde gibt es nicht mehr.'); return; }
    pro[a.gebinde].stuecke.push({ p: p, preis: preis_(pro[a.gebinde].g, zahl_(p['VP']), a.preis) });
  });
  if (!Object.keys(z).length) fehler.push('Es ist noch nichts gescannt.');
  return { pro: pro, fehler: fehler, offen: bestand.filter(function (p) { return !z[norm_(p['PG-ID'])]; }).length };
}

/**
 * Abschluss: schreibt die Änderungsliste (was im Return Tool zu tun ist) und legt pro Abnehmer ein eigenes Sheet an.
 * Nicht zugeordnete Stücke bleiben, wo sie sind (keine Änderung). Das Return Tool wird nicht geschrieben (manueller Weg).
 */
function abschliessen(id, kuerzel) {
  const d = durchgang_(id);
  if (String(d['Status']) === 'Abgeschlossen') throw new Error('Der Durchgang ist schon abgeschlossen.');
  const k = kontrolle_(id);
  if (k.fehler.length) throw new Error(k.fehler.join(' '));
  const e = einst_(), datum = Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy');
  return gesperrt_(function () {
    const d2 = durchgang_(id);
    if (String(d2['Status']) === 'Abgeschlossen') throw new Error('Der Durchgang ist schon abgeschlossen.');
    const k2 = kontrolle_(id), zeilen = [];
    if (k2.fehler.length) throw new Error(k2.fehler.join(' '));
    /* Liste pro Abnehmer: ein Sheet, ein Tab pro Gebinde und eine Zusammenfassung. In der Sperre, damit sie genau zur Änderungsliste passt. */
    const abnehmer = {}, links = [];
    Object.keys(k2.pro).forEach(function (gid) { const x = k2.pro[gid]; if (String(x.g['Art']) === 'Verkauf' && x.stuecke.length) (abnehmer[String(x.g['Abnehmer'])] = abnehmer[String(x.g['Abnehmer'])] || []).push(x); });
    Object.keys(abnehmer).forEach(function (a) { links.push(a + ': ' + abnehmerListe_(e, datum, a, String(d2['Name']), abnehmer[a])); });
    Object.keys(k2.pro).forEach(function (gid) {
      const x = k2.pro[gid], art = String(x.g['Art']);
      x.stuecke.forEach(function (s) {
        const p = s.p;
        zeilen.push({ 'Durchgang': id, 'PG-ID': p['PG-ID'], 'Bezeichnung': p['Bezeichnung'],
          'Aktion': art === 'Verkauf' ? 'Verkaufen' : (art === 'Entsorgung' ? 'Entsorgen' : 'Lagerort ändern'),
          'Gebinde': x.g['Name'], 'Abnehmer': x.g['Abnehmer'], 'Lagerort alt': p['Lagerort alt'], 'Lagerort neu': x.g['Lagerort neu'] || '',
          'VP alt': zahl_(p['VP']), 'Preis': s.preis, 'Return-Tool-Tab': p['Quelle Tab'], 'Zeile': p['Quelle Zeile'], 'Erledigt': '' });
      });
    });
    zeilen.sort(function (a, b) { return String(a['Return-Tool-Tab']).localeCompare(String(b['Return-Tool-Tab'])) || Number(a['Zeile']) - Number(b['Zeile']); });
    schreib_('Änderungen', zeilen);
    setz_('Durchgänge', [{ _r: d2._r, 'Status': 'Abgeschlossen', 'Abgeschlossen am': zeit_(), 'Abgeschlossen von': ich_() + (kuerzel ? ' (' + kuerzel + ')' : ''), 'Listen': links.join('\n') }]);
    log_('Abgeschlossen', id, zeilen.length + ' Änderungen · nicht zugeordnet ' + k2.offen + ' · ' + links.join(' | '));
    return laden(id);
  });
}

/** Ein Sheet pro Abnehmer im Ablage-Ordner: Tab «Total» und ein Tab pro Gebinde. Gibt den Link zurück. */
function abnehmerListe_(e, datum, abnehmer, durchgangName, gebinde) {
  const titel = '(' + datum + ') ' + abnehmer + '-Liste ' + durchgangName;
  const ss = SpreadsheetApp.create(titel);
  try { DriveApp.getFileById(ss.getId()).moveTo(DriveApp.getFolderById(e['Ablage-Ordner ID'] || ABLAGE_ID)); } catch (err) { /* bleibt in «Meine Ablage» */ }
  const kopf = ['PG-ID', 'Bezeichnung', 'Barcode', 'Kategorie', 'Gebinde', 'Preis CHF'];
  const total = ss.getSheets()[0].setName('Total');
  const zusammen = [['Abnehmer', abnehmer], ['Durchgang', durchgangName], ['Datum', datum.replace(/\//g, '.')], ['', ''], ['Gebinde', 'Stück', 'Total CHF']];
  let summe = 0, stueck = 0;
  gebinde.forEach(function (x) {
    const z = x.stuecke.map(function (s) { return [String(s.p['PG-ID']), String(s.p['Bezeichnung']), String(s.p['Barcode']), String(s.p['Kategorie']), String(x.g['Name']), s.preis]; });
    const t = z.reduce(function (a, r) { return a + r[5]; }, 0);
    summe += t; stueck += z.length;
    zusammen.push([String(x.g['Name']), z.length, rappen_(t)]);
    const sh = ss.insertSheet(String(x.g['Name']).slice(0, 90));
    sh.getRange(1, 1, 1, kopf.length).setValues([kopf]).setFontWeight('bold').setBackground('#efefef');
    if (z.length) { sh.getRange(2, 1, z.length, 4).setNumberFormat('@'); sh.getRange(2, 1, z.length, kopf.length).setValues(z); }
    sh.getRange(z.length + 2, 5, 1, 2).setValues([['Total', rappen_(t)]]).setFontWeight('bold');
    sh.getRange(2, 6, z.length + 1, 1).setNumberFormat('#,##0.00');
    sh.setFrozenRows(1); sh.autoResizeColumns(1, kopf.length);
  });
  zusammen.push(['Total', stueck, rappen_(summe)]);
  total.getRange(1, 1, zusammen.length, 3).setValues(zusammen.map(function (r) { return [r[0], r[1] === undefined ? '' : r[1], r[2] === undefined ? '' : r[2]]; }));
  total.getRange(5, 1, 1, 3).setFontWeight('bold').setBackground('#efefef');
  total.getRange(zusammen.length, 1, 1, 3).setFontWeight('bold');
  total.getRange(6, 3, zusammen.length - 5, 1).setNumberFormat('#,##0.00');
  ss.getSheets().forEach(function (s) { s.getDataRange().setFontFamily('Arial').setFontSize(10); });
  total.getRange(1, 1, 3, 1).setFontWeight('bold');
  total.autoResizeColumns(1, 3);
  return ss.getUrl();
}

/** Änderungen eines abgeschlossenen Durchgangs für die Anzeige. */
function aenderungenVon_(id) {
  return lies_('Änderungen').z.filter(function (r) { return String(r['Durchgang']) === id; }).map(function (r) {
    return { r: r._r, id: String(r['PG-ID']), name: String(r['Bezeichnung']), aktion: String(r['Aktion']), gebinde: String(r['Gebinde']), abnehmer: String(r['Abnehmer']),
      alt: String(r['Lagerort alt']), neu: String(r['Lagerort neu']), vp: zahl_(r['VP alt']), preis: zahl_(r['Preis']), tab: String(r['Return-Tool-Tab']), zeile: String(r['Zeile']), erledigt: String(r['Erledigt']) };
  });
}

/** Änderungen als im Return Tool eingetragen markieren (manueller Weg). zeilen = Zeilennummern im Tab «Änderungen». */
function erledigt(id, zeilen, wert) {
  return gesperrt_(function () {
    const ok = {};
    lies_('Änderungen').z.forEach(function (r) { if (String(r['Durchgang']) === id) ok[r._r] = true; });
    const t = wert === false ? '' : zeit_() + ' ' + ich_();
    setz_('Änderungen', (zeilen || []).filter(function (r) { return ok[r]; }).map(function (r) { return { _r: r, 'Erledigt': t }; }));
    return aenderungenVon_(id);
  });
}

/** Admin: abgeschlossenen Durchgang wieder öffnen (Änderungen werden als «zurückgenommen» markiert, die Abnehmer-Liste bleibt im Ordner). */
function wiederOeffnen(id) {
  const e = einst_(), admins = String(e['Admins'] || '').toLowerCase().split(/[,;\s]+/).filter(String);
  if (admins.length && admins.indexOf(ich_().toLowerCase()) < 0) throw new Error('Nur für Admins.');
  return gesperrt_(function () {
    const d = durchgang_(id);
    if (String(d['Status']) !== 'Abgeschlossen') throw new Error('Der Durchgang ist nicht abgeschlossen.');
    if (aenderungenVon_(id).some(function (a) { return a.erledigt; })) throw new Error('Ein Teil der Änderungen ist im Return Tool schon eingetragen. Zuerst dort zurücknehmen und «Erledigt» leeren.');
    setz_('Änderungen', lies_('Änderungen').z.filter(function (r) { return String(r['Durchgang']) === id; }).map(function (r) { return { _r: r._r, 'Durchgang': id + ' (zurückgenommen)' }; }));
    setz_('Durchgänge', [{ _r: d._r, 'Status': 'Scan', 'Abgeschlossen am': '', 'Abgeschlossen von': '' }]);
    log_('Wieder geöffnet', id, '');
    return laden(id);
  });
}
