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
 * Betrieb: Web-App «Ausführen als Jonas», Zugriff «Jeder in Pretty Good». Wer scannt, braucht keine eigenen Freigaben; im Log steht die angemeldete Person.
 * Grundregeln
 *  - Alle Entscheide stehen in diesem Sheet. Das Return Tool wird nur gelesen (beim Setup), nie geschrieben.
 *  - Die Oberfläche ruft den Server nur über api(name, argumente) auf. Spalten werden über ihre Kopfzeilen gefunden.
 *  - Schreiben nur in einer Sperre (LockService), damit mehrere Personen gleichzeitig scannen können.
 * Datenintegrität (24.10.2026)
 *  - Belegte Lagerorte: alle Tabs des Return Tools mit Spalte «Lagerort» (auch Scanner ohne ID, Analyse, Archiv) und die «Lagerort neu»
 *    offener Durchgänge. Ein neuer Lagerort, der irgendwo vorkommt, wird abgelehnt. Ähnliche Schreibweisen (KIDS-8 / KID-8) nur als Hinweis.
 *  - Ein Stück ist höchstens in einem offenen Durchgang. Barcode-Scans löst der Server in der Sperre auf (freies Stück dieser EAN).
 *  - Abschluss liest das Return Tool neu und markiert Abweichungen pro ID (Zeile nur als Hinweis).
 */

const VERSION = '2026-10-24.1';
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
  'Änderungen': ['Durchgang', 'PG-ID', 'Bezeichnung', 'Aktion', 'Gebinde', 'Abnehmer', 'Lagerort alt', 'Lagerort neu', 'VP alt', 'Preis', 'Return-Tool-Tab', 'Zeile', 'Erledigt', 'Prüfung'],
  'Log': ['Zeit', 'Person', 'Aktion', 'Durchgang', 'Detail'],
  'Einstellungen': ['Einstellung', 'Wert', 'Erklärung']
};
const EINST = [
  ['Return Tool ID', RT_ID, 'Aus diesem Sheet liest das Setup den Bestand. Das Tool schreibt dort nie.'],
  ['Quell-Tabs', QUELL_TABS, 'Aus diesen Tabs des Return Tools wählt das Setup die Quelle, mit Komma getrennt. Belegte Lagerorte prüft das Tool in allen Tabs.'],
  ['Ablage-Ordner ID', ABLAGE_ID, 'In diesen Drive-Ordner legt der Abschluss die Liste pro Abnehmer.'],
  ['Admins', '', 'E-Mail-Adressen, die einen abgeschlossenen Durchgang wieder öffnen dürfen. Leer = alle.']
];
const KATALOG = [
  { tab: 'Durchgänge', art: 'arbeit', inhalt: 'Ein Durchgang pro Umpack-Aktion: Name, Status (Setup, Scan, Abgeschlossen), Quelle.' },
  { tab: 'Gebinde', art: 'arbeit', inhalt: 'Die Ziel-Gebinde pro Durchgang: Verkauf an Abnehmer, neue Palette im Lager, Entsorgung, mit Preisregel.' },
  { tab: 'Bestand', art: 'arbeit', inhalt: 'Die Stücke der Quelle beim Setup (Kopie aus dem Return Tool oder von Hand eingefügt).' },
  { tab: 'Zuordnung', art: 'arbeit', inhalt: 'Welches Stück in welches Gebinde gescannt wurde. Preis leer = Preisregel des Gebindes.' },
  { tab: 'Änderungen', art: 'arbeit', inhalt: 'Beim Abschluss: was im Return Tool zu ändern ist (Lagerort, Preis, verkauft, entsorgt). «Prüfung» = Abgleich mit dem Return Tool beim Abschluss (Schlüssel ID, Zeile nur Hinweis). «Erledigt» setzt ihr, wenn es eingetragen ist.' },
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
/** Zahl aus Text: «1'234.50», «1,234.50», «1.234,50», «1234,50», «12.-». Das hintere Trennzeichen trennt die Rappen; «1,234» = 1234. */
function zahl_(x) {
  if (typeof x === 'number') return x;
  let s = String(x == null ? '' : x).replace(/CHF/i, '').replace(/['’\s]/g, '').replace(/[.,]-$/, '');
  if (!s) return 0;
  const p = s.lastIndexOf('.'), k = s.lastIndexOf(',');
  if (p > -1 && k > -1) s = p > k ? s.replace(/,/g, '') : s.replace(/\./g, '').replace(',', '.');
  else if (k > -1) s = /^-?\d{1,3}(,\d{3})+$/.test(s) ? s.replace(/,/g, '') : s.replace(',', '.');
  else if ((s.match(/\./g) || []).length > 1) s = s.replace(/\./g, '');
  const n = Number(s);
  return isFinite(n) ? n : 0;
}
function rappen_(x) { return Math.round(Number(x) * 100) / 100; }
function norm_(s) { return String(s == null ? '' : s).trim().toUpperCase(); }
/** Lagerort zum Vergleichen: gross, ohne Leerzeichen. */
function ortKey_(s) { return String(s == null ? '' : s).toUpperCase().replace(/\s+/g, ''); }
/** Ähnliche Schreibweise, nur für Hinweise (nie zusammenlegen): KIDS-8 ~ KID-8, KID-08 ~ KID-8. */
function ortAehnlich_(s) { const k = ortKey_(s), m = /^([A-Z]+?)S?-0*(\d+)$/.exec(k); return m ? m[1] + '-' + m[2] : k; }
/** Barcode zum Vergleichen: ohne Apostroph und Leerzeichen, Ziffern ohne führende Nullen (UPC-A = EAN-13 mit 0 davor). */
function bcKey_(s) { let b = String(s == null ? '' : s).replace(/^'/, '').replace(/\s+/g, '').toUpperCase(); if (/^\d+$/.test(b)) b = b.replace(/^0+/, ''); return b; }
/** Zeit «dd.MM.yyyy HH:mm:ss» (wie zeit_) in Millisekunden, sonst 0. */
function zeitMs_(t) { const m = /^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2}):(\d{2})/.exec(String(t || '')); return m ? Date.UTC(+m[3], +m[2] - 1, +m[1], +m[4], +m[5], +m[6]) : 0; }

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

/**
 * Liest das Return Tool (nur lesen). Alle Tabs mit einer Spalte «Lagerort» in den ersten 15 Zeilen (auch Scanner ohne ID, Analyse, Archiv …).
 *  stuecke: Stücke der Quell-Tabs (mit ID, für die Quelle), orte: jeder vorkommende Lagerort (Schlüssel ortKey_) mit Anzahl pro Tab,
 *  ids: PG-ID → wo sie jetzt steht (alle Tabs mit ID), fehlend: Quell-Tabs, die fehlen oder keine Kopfzeile mit «ID» und «Lagerort» haben.
 */
function rtLesen_(e) {
  const rt = SpreadsheetApp.openById(e['Return Tool ID'] || RT_ID), quell = {}, aus = { stuecke: [], orte: {}, ids: {}, fehlend: [] };
  String(e['Quell-Tabs'] || QUELL_TABS).split(',').map(function (t) { return t.trim(); }).filter(String).forEach(function (t) { quell[t] = false; });
  rt.getSheets().forEach(function (sh) {
    const tab = sh.getName(), istQuelle = Object.prototype.hasOwnProperty.call(quell, tab);
    if (sh.getLastRow() < 2) { if (istQuelle) quell[tab] = true; return; }
    const v = sh.getDataRange().getValues();
    let k = -1;
    for (let i = 0; i < Math.min(v.length, 15); i++) { if (v[i].map(function (x) { return String(x).trim(); }).indexOf('Lagerort') > -1) { k = i; break; } }
    if (k < 0) return;
    const kopf = v[k].map(function (x) { return String(x).trim(); }), c = function (n) { return kopf.indexOf(n); };
    if (istQuelle && c('ID') > -1) quell[tab] = true;
    for (let i = k + 1; i < v.length; i++) {
      const g = function (n) { return c(n) < 0 ? '' : v[i][c(n)]; };
      const ort = String(g('Lagerort')).trim(), id = String(g('ID') || '').trim(), mitId = /^[A-Z]{2,4}-\d+$/i.test(id);
      if (ort) {
        const ok = ortKey_(ort), o = aus.orte[ok] = aus.orte[ok] || { ort: ort, anzahl: 0, tabs: {} };
        o.anzahl++; o.tabs[tab] = (o.tabs[tab] || 0) + 1;
      }
      if (!mitId) continue;
      (aus.ids[norm_(id)] = aus.ids[norm_(id)] || []).push({ tab: tab, zeile: i + 1, ort: ort });
      if (istQuelle) aus.stuecke.push({ id: id, barcode: String(g('Barcode')).replace(/^'/, '').trim(), name: String(g('Bezeichnung')).trim(), kat: String(g('Kategorie')).trim(),
        ovp: zahl_(g('OVP')), vp: zahl_(g('VP')), ort: ort, tab: tab, zeile: i + 1 });
    }
  });
  Object.keys(quell).forEach(function (t) { if (!quell[t]) aus.fehlend.push(t); });
  return aus;
}

/**
 * Belegte Lagerorte: alles im Return Tool und die «Lagerort neu» offener Durchgänge (nicht abgeschlossen, oder abgeschlossen mit noch
 * nicht eingetragenen Änderungen). ohne = Durchgang, dessen eigene Gebinde nicht zählen. Gibt { SCHLÜSSEL: 'wo belegt' } zurück.
 */
function belegt_(orte, ohne) {
  const b = {};
  Object.keys(orte).forEach(function (k) {
    const o = orte[k];
    b[k] = 'im Return Tool (' + Object.keys(o.tabs).map(function (t) { return t + ': ' + o.tabs[t]; }).join(', ') + ' Stück)';
  });
  offeneGebinde_().forEach(function (g) {
    const k = ortKey_(g['Lagerort neu']);
    if (k && String(g['Durchgang']) !== ohne && !b[k]) b[k] = 'im offenen Durchgang ' + g['Durchgang'] + ' (Gebinde «' + g['Name'] + '»)';
  });
  return b;
}
/** Durchgänge, die noch etwas belegen: Status nicht «Abgeschlossen», oder Änderungen ohne «Erledigt». */
function offeneDurchgaenge_() {
  const offen = {}, aend = {};
  lies_('Änderungen').z.forEach(function (r) { if (!String(r['Erledigt'] || '').trim()) aend[String(r['Durchgang'])] = true; });     // «U-… (zurückgenommen)» zählt nicht
  lies_('Durchgänge').z.forEach(function (d) { const id = String(d['Durchgang']); if (String(d['Status']) !== 'Abgeschlossen') offen[id] = 'offen'; else if (aend[id]) offen[id] = 'abgeschlossen, Änderung noch nicht eingetragen'; });
  return offen;
}
function offeneGebinde_() {
  const offen = offeneDurchgaenge_();
  return lies_('Gebinde').z.filter(function (g) { return offen[String(g['Durchgang'])]; });
}
/** Prüft neue Lagerorte gegen die belegten. Belegt: Fehler. Ähnliche Schreibweise: Hinweis (Rückgabe). */
function orteFrei_(gebinde, b) {
  const hinweise = [], aehnlich = {};
  Object.keys(b).forEach(function (k) { (aehnlich[ortAehnlich_(k)] = aehnlich[ortAehnlich_(k)] || []).push(k); });
  gebinde.forEach(function (g) {
    if (!g.lagerort) return;
    const k = ortKey_(g.lagerort);
    if (b[k]) throw new Error('Der Lagerort «' + g.lagerort + '» ist schon belegt: ' + b[k] + '. Bitte einen freien wählen.');
    const a = (aehnlich[ortAehnlich_(k)] || []).filter(function (x) { return x !== k; });
    if (a.length) hinweise.push('«' + g.lagerort + '» ähnelt dem bestehenden Lagerort ' + a.slice(0, 3).join(', ') + '. Bitte prüfen.');
  });
  return hinweise;
}
/** Stücke, die schon in einem offenen Durchgang sind: { PG-ID: 'U-0001 (offen)' }. */
function idsOffen_(ohne) {
  const offen = offeneDurchgaenge_(), aus = {};
  lies_('Bestand').z.forEach(function (p) { const d = String(p['Durchgang']); if (d !== ohne && offen[d] === 'offen') aus[norm_(p['PG-ID'])] = d + ' (offen)'; });
  lies_('Änderungen').z.forEach(function (r) { const d = String(r['Durchgang']); if (d !== ohne && !String(r['Erledigt'] || '').trim() && offen[d]) aus[norm_(r['PG-ID'])] = d + ' (Änderung noch nicht im Return Tool eingetragen)'; });
  return aus;
}

/** Setup: Lagerorte der Quell-Tabs mit Anzahl Stücke, die nächste freie Nummer pro Kürzel (über alle belegten Orte), fehlende Quell-Tabs. */
function lagerorte() {
  const e = einst_(), rt = rtLesen_(e), je = {}, max = {};
  rt.stuecke.forEach(function (p) {
    const o = p.ort || '(ohne Lagerort)';
    je[o] = je[o] || { ort: o, anzahl: 0, tabs: {} };
    je[o].anzahl++; je[o].tabs[p.tab] = true;
  });
  const b = belegt_(rt.orte, ''), aehnlich = {};
  Object.keys(b).forEach(function (k) {
    aehnlich[ortAehnlich_(k)] = true;
    const m = /^([A-Z]+)-(\d{1,4})$/.exec(k);     // nur echte Palettennummern (im Return Tool stehen teils EANs als Lagerort, z.B. KID-4005176984105)
    if (m) max[m[1]] = Math.max(max[m[1]] || 0, Number(m[2]));
  });
  const naechste = {};
  Object.keys(max).forEach(function (k) {
    let n = max[k] + 1;
    while (b[k + '-' + n] || aehnlich[ortAehnlich_(k + '-' + n)]) n++;
    naechste[k] = k + '-' + n;
  });
  return { orte: Object.keys(je).sort(ortSort_).map(function (o) { return { ort: o, anzahl: je[o].anzahl, tabs: Object.keys(je[o].tabs).join(', ') }; }),
    naechste: naechste, fehlend: rt.fehlend, belegt: Object.keys(b) };
}
function ortSort_(a, b) {
  const x = /^([A-Z]+)-(\d+)$/i.exec(a), y = /^([A-Z]+)-(\d+)$/i.exec(b);
  if (x && y && x[1].toUpperCase() === y[1].toUpperCase()) return Number(x[2]) - Number(y[2]);
  return a.localeCompare(b);
}

/** Eine Zeile in Felder teilen. Felder in Anführungszeichen dürfen das Trennzeichen enthalten, "" = ein Anführungszeichen. */
function felder_(z, trenn) {
  const aus = [];
  let f = '', q = false;
  for (let i = 0; i < z.length; i++) {
    const ch = z[i];
    if (q) { if (ch === '"') { if (z[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch; }
    else if (ch === '"' && !f.trim()) { q = true; f = ''; }
    else if (ch === trenn) { aus.push(f); f = ''; }
    else f += ch;
  }
  aus.push(f);
  return aus;
}
/** Liste von Hand (Export, aus Excel oder Sheets kopiert): Kopfzeile mit ID oder PG-ID, dazu Bezeichnung, VP, Lagerort, Barcode, Kategorie (optional). */
function manuellLesen_(text) {
  const zeilen = String(text || '').replace(/\r/g, '').split('\n').filter(function (z) { return z.trim(); });
  if (zeilen.length < 2) throw new Error('Die Liste braucht eine Kopfzeile und mindestens ein Stück.');
  const trenn = zeilen[0].indexOf('\t') > -1 ? '\t' : (zeilen[0].indexOf(';') > -1 ? ';' : ',');
  const kopf = felder_(zeilen[0], trenn).map(function (x) { return x.trim().toLowerCase(); });
  const c = function (namen) { for (let i = 0; i < namen.length; i++) { const j = kopf.indexOf(namen[i]); if (j > -1) return j; } return -1; };
  const ci = c(['id', 'pg-id', 'pgid']), cb = c(['barcode', 'ean']), cn = c(['bezeichnung', 'produkt', 'name']), cv = c(['vp', 'preis', 'vp chf']), co = c(['lagerort', 'ort', 'palette']), ck = c(['kategorie']), cov = c(['ovp', 'neupreis']);
  if (ci < 0) throw new Error('In der Kopfzeile fehlt die Spalte «ID» oder «PG-ID».');
  const aus = [];
  zeilen.slice(1).forEach(function (z, i) {
    const t = felder_(z, trenn), g = function (j) { return j < 0 ? '' : String(t[j] === undefined ? '' : t[j]).trim(); };
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
    const name = String(g.name || '').trim(), art = String(g.art || ''), ort = ortKey_(g.lagerort), regel = String(g.preisregel || 'VP');
    if (!name) throw new Error('Gebinde ' + (i + 1) + ': Name fehlt.');
    if (namen[name.toLowerCase()]) throw new Error('Den Gebinde-Namen «' + name + '» gibt es doppelt.');
    namen[name.toLowerCase()] = true;
    if (ARTEN.indexOf(art) < 0) throw new Error('Gebinde «' + name + '»: Art fehlt.');
    if (art === 'Verkauf' && !String(g.abnehmer || '').trim()) throw new Error('Gebinde «' + name + '»: Abnehmer fehlt.');
    if (art !== 'Entsorgung' && !ort) throw new Error('Gebinde «' + name + '»: neuer Lagerort fehlt.');
    if (art !== 'Entsorgung' && orte[ort]) throw new Error('Den Lagerort «' + ort + '» haben zwei Gebinde.');
    if (art !== 'Entsorgung') orte[ort] = true;
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
 * Das Return Tool wird auch bei einer Liste von Hand gelesen (belegte Lagerorte). Ist es nicht lesbar, bricht das Setup ab.
 */
function anlegen(s) {
  s = s || {};
  const name = String(s.name || '').trim();
  if (!name) throw new Error('Bitte dem Durchgang einen Namen geben.');
  const gebinde = gebindePruefen_(s.gebinde), e = einst_();
  let rt;
  try { rt = rtLesen_(e); } catch (err) { throw new Error('Das Return Tool ist nicht lesbar, belegte Lagerorte lassen sich nicht prüfen (' + (err && err.message) + ').'); }
  let bestand;
  if (s.quelle === 'manuell') bestand = manuellLesen_(s.liste);
  else {
    const orte = (s.lagerorte || []).map(String);
    if (!orte.length) throw new Error('Bitte mindestens einen Quell-Lagerort wählen.');
    bestand = rt.stuecke.filter(function (p) { return orte.indexOf(p.ort || '(ohne Lagerort)') > -1; });
  }
  if (!bestand.length) throw new Error('In der Quelle sind keine Stücke.');
  const doppelt = {}, ids = {};
  bestand.forEach(function (p) { const k = norm_(p.id); if (ids[k]) doppelt[k] = true; ids[k] = true; });
  if (Object.keys(doppelt).length) throw new Error('Diese IDs stehen in der Quelle doppelt: ' + Object.keys(doppelt).slice(0, 10).join(', ') + '. Bitte zuerst im Return Tool klären.');
  /* Ein neuer Lagerort darf in der Quelle nicht schon vorkommen (sonst wären alte und neue Stücke gemischt). */
  const quellOrte = {};
  bestand.forEach(function (p) { quellOrte[ortKey_(p.ort)] = true; });
  gebinde.forEach(function (g) { if (g.lagerort && quellOrte[g.lagerort]) throw new Error('Der neue Lagerort «' + g.lagerort + '» ist auch ein Quell-Lagerort. Bitte einen neuen wählen.'); });
  return gesperrt_(function () {
    /* In der Sperre: Lagerorte gegen Return Tool und offene Gebinde, Stücke gegen offene Durchgänge */
    const hinweise = orteFrei_(gebinde, belegt_(rt.orte, ''));
    const offen = idsOffen_(''), schon = bestand.filter(function (p) { return offen[norm_(p.id)]; });
    if (schon.length) throw new Error('Diese Stücke sind schon in einem anderen Durchgang: ' + schon.slice(0, 10).map(function (p) { return p.id + ' in ' + offen[norm_(p.id)]; }).join(', ')
      + (schon.length > 10 ? ' und ' + (schon.length - 10) + ' weitere' : '') + '. Zuerst dort abschliessen und eintragen.');
    let max = 0;
    lies_('Durchgänge').z.forEach(function (r) { const m = /^U-(\d+)$/.exec(String(r['Durchgang'])); if (m) max = Math.max(max, Number(m[1])); });
    const id = 'U-' + String(max + 1).padStart(4, '0'), t = zeit_();
    schreib_('Durchgänge', [{ 'Durchgang': id, 'Name': name, 'Status': 'Scan', 'Quelle': s.quelle === 'manuell' ? 'Manuell' : 'Return Tool',
      'Quell-Lagerorte': s.quelle === 'manuell' ? 'Liste' : (s.lagerorte || []).join(', '), 'Erstellt am': t, 'Erstellt von': ich_() + (s.kuerzel ? ' (' + s.kuerzel + ')' : '') }]);
    schreib_('Gebinde', gebinde.map(function (g, i) {
      return { 'Durchgang': id, 'Gebinde': id + '-G' + (i + 1), 'Name': g.name, 'Art': g.art, 'Abnehmer': g.abnehmer, 'Lagerort neu': g.lagerort, 'Preisregel': g.preisregel, 'Prozent': g.prozent };
    }));
    schreib_('Bestand', bestand.map(function (p) {
      return { 'Durchgang': id, 'PG-ID': p.id, 'Barcode': p.barcode, 'Bezeichnung': p.name, 'Kategorie': p.kat, 'OVP': p.ovp || '', 'VP': p.vp, 'Lagerort alt': p.ort, 'Quelle Tab': p.tab, 'Quelle Zeile': p.zeile };
    }));
    const ohneBc = bestand.filter(function (p) { return !bcKey_(p.barcode); }).length;
    if (ohneBc) hinweise.push(ohneBc + ' Stücke ohne Barcode: nur per PG-ID-Etikett scannbar.');
    if (s.quelle !== 'manuell' && rt.fehlend.length) hinweise.push('Quell-Tabs nicht gelesen: ' + rt.fehlend.join(', ') + '.');
    log_('Durchgang angelegt', id, name + ' · ' + bestand.length + ' Stücke · ' + gebinde.map(function (g) { return g.name; }).join(', ') + (hinweise.length ? ' · ' + hinweise.join(' ') : ''));
    return Object.assign(laden(id), { hinweise: hinweise });
  });
}

/** Gebinde während des Scans ergänzen oder ändern (z.B. eine dritte Balu-Palette). Gebinde mit Stücken lassen sich nicht löschen. */
function gebindeAendern(id, liste) {
  const d = durchgang_(id);
  if (d['Status'] === 'Abgeschlossen') throw new Error('Der Durchgang ist abgeschlossen.');
  const neu = gebindePruefen_(liste);
  let rt;
  try { rt = rtLesen_(einst_()); } catch (err) { throw new Error('Das Return Tool ist nicht lesbar, belegte Lagerorte lassen sich nicht prüfen (' + (err && err.message) + ').'); }
  return gesperrt_(function () {
    const alt = lies_('Gebinde').z.filter(function (g) { return String(g['Durchgang']) === id; }), belegt = {};
    lies_('Zuordnung').z.forEach(function (z) { if (String(z['Durchgang']) === id && String(z['Gebinde'])) belegt[String(z['Gebinde'])] = true; });
    const quellOrte = {};
    lies_('Bestand').z.forEach(function (p) { if (String(p['Durchgang']) === id) quellOrte[ortKey_(p['Lagerort alt'])] = true; });
    neu.forEach(function (g) { if (g.lagerort && quellOrte[g.lagerort]) throw new Error('Der neue Lagerort «' + g.lagerort + '» ist auch ein Quell-Lagerort.'); });
    /* Nur neue oder geänderte Lagerorte prüfen; die eigenen bisherigen Gebinde zählen nicht als belegt. */
    const bisher = {};
    alt.forEach(function (g) { bisher[ortKey_(g['Lagerort neu'])] = true; });
    const hinweise = orteFrei_(neu.filter(function (g) { return g.lagerort && !bisher[g.lagerort]; }), belegt_(rt.orte, id));
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
    return Object.assign(laden(id), { hinweise: hinweise });
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
 * Barcode-Scan: { code: '4005…', wunsch: 'PG-…' (was der Browser angezeigt hat), gebinde, vorher: '' }. Der Server wählt in der Sperre ein noch freies Stück
 * dieser EAN aus der Quelle (den Wunsch, wenn er noch frei ist). Freie Stücke mit verschiedenem VP: Konflikt, PG-ID scannen.
 * vorher = das Gebinde, das der Browser beim Scannen gesehen hat. vorher '' auf ein schon zugeordnetes Stück ist immer ein Konflikt
 * (gleich = schon so gespeichert, vom gleichen Kürzel). Gibt den neuen Stand der Zuordnung zurück, dazu Konflikte und die aufgelösten Barcodes.
 */
function zuordnen(id, ops, kuerzel) {
  const d = durchgang_(id);
  if (String(d['Status']) !== 'Scan') throw new Error('Der Durchgang ist nicht im Scan (Status: ' + d['Status'] + ').');
  return gesperrt_(function () {
    const z = zuordnungVon_(id), gebinde = {}, bestand = {}, proBc = {}, t = zeit_(), neu = [], konflikte = [], ergebnis = [], ku = String(kuerzel || '').toUpperCase().slice(0, 4), gemerkt = {};
    lies_('Gebinde').z.forEach(function (g) { if (String(g['Durchgang']) === id) gebinde[String(g['Gebinde'])] = g; });
    lies_('Bestand').z.forEach(function (p) {
      if (String(p['Durchgang']) !== id) return;
      bestand[norm_(p['PG-ID'])] = p;
      const b = bcKey_(p['Barcode']);
      if (b) (proBc[b] = proBc[b] || []).push(p);
    });
    const gName = function (g) { return gebinde[g] ? gebinde[g]['Name'] : 'kein Gebinde'; };
    (ops || []).forEach(function (o) {
      if (!o.id && o.code) {
        /* Wiederholter Barcode-Scan (Antwort nicht angekommen, Seite neu geladen): nicht ein zweites Stück derselben EAN buchen. */
        const schon = scanSchon_(o.sid);
        if (schon && z[norm_(schon)]) { konflikte.push({ id: schon, code: o.code, grund: 'schon gespeichert', gebinde: z[norm_(schon)].gebinde, gleich: true }); return; }
        const wk = norm_(o.wunsch || '');
        if (wk && z[wk] && z[wk].gebinde === o.gebinde && z[wk].kuerzel === ku) { konflikte.push({ id: o.wunsch, code: o.code, grund: 'schon gespeichert', gebinde: o.gebinde, gleich: true }); return; }
        const r = stueckZuCode_(o.code, bestand, proBc, z, o.wunsch);
        if (r.fehler) { konflikte.push({ id: o.wunsch || o.code, code: o.code, grund: r.fehler }); return; }
        o = Object.assign({}, o, { id: r.id, vorher: '' });
      }
      const k = norm_(o.id), jetzt = z[k] ? z[k].gebinde : '';
      if (!bestand[k]) { konflikte.push({ id: o.id, grund: 'nicht in der Quelle' }); return; }
      if (o.gebinde && !gebinde[o.gebinde]) { konflikte.push({ id: o.id, grund: 'Gebinde gibt es nicht' }); return; }
      if (o.vorher === '' && jetzt) {
        konflikte.push({ id: o.id, grund: 'schon in ' + gName(jetzt) + (z[k].kuerzel ? ' (' + z[k].kuerzel + ')' : ''), gebinde: jetzt, gleich: jetzt === o.gebinde && z[k].kuerzel === ku });
        return;
      }
      if (o.vorher !== undefined && String(o.vorher || '') !== jetzt && String(o.gebinde || '') !== jetzt) { konflikte.push({ id: o.id, grund: 'inzwischen von jemand anderem in ' + gName(jetzt) + ' gelegt', gebinde: jetzt }); return; }
      const preis = o.preis === '' || o.preis === undefined || o.preis === null ? '' : rappen_(zahl_(o.preis));
      if (preis !== '' && preis < 0) { konflikte.push({ id: o.id, grund: 'Preis kleiner als 0' }); return; }
      const pid = String(bestand[k]['PG-ID']);
      neu.push({ 'Durchgang': id, 'PG-ID': pid, 'Gebinde': o.gebinde || '', 'Preis': preis, 'Zeit': t, 'Kürzel': ku });
      if (o.gebinde) z[k] = { gebinde: o.gebinde, preis: preis, zeit: t, kuerzel: ku }; else delete z[k];
      if (o.code) { ergebnis.push({ code: o.code, wunsch: o.wunsch || '', id: pid, gebinde: o.gebinde }); if (o.sid) gemerkt[o.sid] = pid; }
    });
    schreib_('Zuordnung', neu);
    scanMerken_(gemerkt);
    return { zuordnung: z, konflikte: konflikte, ergebnis: ergebnis };
  });
}
/** Gespeicherte Barcode-Scans pro Scan-Kennung (12 Stunden), damit eine Wiederholung kein zweites Stück bucht. */
function scanSchon_(sid) {
  if (!sid) return '';
  try { return CacheService.getScriptCache().get('scan:' + String(sid).slice(0, 40)) || ''; } catch (err) { return ''; }
}
function scanMerken_(m) {
  const k = Object.keys(m);
  if (!k.length) return;
  const o = {};
  k.forEach(function (s) { o['scan:' + String(s).slice(0, 40)] = m[s]; });
  try { CacheService.getScriptCache().putAll(o, 43200); } catch (err) { /* ohne Speicher bleibt der Schutz über das Gebinde */ }
}
/** Barcode → freies Stück der Quelle. { id } oder { fehler }. */
function stueckZuCode_(code, bestand, proBc, z, wunsch) {
  if (bestand[norm_(code)]) return { id: String(bestand[norm_(code)]['PG-ID']) };          // PG-ID als Code
  const l = proBc[bcKey_(code)] || [];
  if (!l.length) return { fehler: 'nicht in der Quelle' };
  const frei = l.filter(function (p) { return !z[norm_(p['PG-ID'])]; });
  if (!frei.length) return { fehler: 'alle ' + l.length + ' Stücke mit diesem Barcode sind schon zugeordnet, PG-ID scannen' };
  const vp = {};
  frei.forEach(function (p) { vp[rappen_(zahl_(p['VP']))] = true; });
  if (Object.keys(vp).length > 1) return { fehler: 'mehrere freie Stücke mit diesem Barcode und verschiedenem VP, PG-ID scannen' };
  const w = frei.filter(function (p) { return wunsch && norm_(p['PG-ID']) === norm_(wunsch); })[0];
  return { id: String((w || frei[0])['PG-ID']) };
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

/** Zuordnungen anderer (anderes Kürzel) in den letzten 2 Minuten. */
function spaeteScans_(id, kuerzel) {
  const ku = String(kuerzel || '').toUpperCase().slice(0, 4), jetzt = zeitMs_(zeit_()), aus = {};
  lies_('Zuordnung').z.forEach(function (r) {
    if (String(r['Durchgang']) !== id) return;
    const ms = zeitMs_(r['Zeit']), k = String(r['Kürzel'] || '').toUpperCase();
    if (ms && jetzt - ms <= 120000 && (!ku || k !== ku)) aus[k || '?'] = (aus[k || '?'] || 0) + 1;
  });
  return Object.keys(aus).map(function (k) { return k + ' (' + aus[k] + ')'; });
}

/** Abgleich eines Stücks mit dem Return Tool beim Abschluss. Schlüssel ist die ID, nicht die Zeile. */
function pruefungRt_(p, rt, ortNeu) {
  if (!rt) return { text: 'nicht geprüft (Liste von Hand)' };
  const wo = rt.ids[norm_(p['PG-ID'])] || [], f = [];
  if (!wo.length) f.push('nicht mehr im Return Tool');
  else if (wo.length > 1) f.push('steht ' + wo.length + '× im Return Tool (' + wo.map(function (w) { return w.tab + ' Zeile ' + w.zeile; }).join(', ') + ')');
  else {
    if (ortKey_(wo[0].ort) !== ortKey_(p['Lagerort alt'])) f.push('Lagerort jetzt «' + (wo[0].ort || 'leer') + '» statt «' + p['Lagerort alt'] + '»');
    if (wo[0].tab !== String(p['Quelle Tab'])) f.push('jetzt im Tab «' + wo[0].tab + '»');
  }
  if (ortNeu && rt.orte[ortKey_(ortNeu)]) f.push('Lagerort neu «' + ortNeu + '» inzwischen im Return Tool belegt');
  return { text: f.length ? 'ABWEICHUNG: ' + f.join('; ') : 'ok', tab: wo.length === 1 ? wo[0].tab : '', zeile: wo.length === 1 ? wo[0].zeile : '' };
}

/**
 * Abschluss: schreibt die Änderungsliste (was im Return Tool zu tun ist) und legt pro Abnehmer ein eigenes Sheet an.
 * Nicht zugeordnete Stücke bleiben, wo sie sind (keine Änderung). Das Return Tool wird nicht geschrieben (manueller Weg), aber neu gelesen:
 * Pro ID wird geprüft, ob «Lagerort alt» noch stimmt (Spalte «Prüfung»). Ist das Return Tool nicht lesbar, bricht der Abschluss ab.
 * Kamen in den letzten 2 Minuten noch Zuordnungen anderer, kommt zuerst { warnung } zurück; mit bestaetigt = true wird trotzdem abgeschlossen.
 */
function abschliessen(id, kuerzel, bestaetigt) {
  const d = durchgang_(id);
  if (String(d['Status']) === 'Abgeschlossen') throw new Error('Der Durchgang ist schon abgeschlossen.');
  const k = kontrolle_(id);
  if (k.fehler.length) throw new Error(k.fehler.join(' '));
  const e = einst_(), datum = Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy');
  let rt = null;
  if (String(d['Quelle']) !== 'Manuell') {
    try { rt = rtLesen_(e); } catch (err) { throw new Error('Das Return Tool ist nicht lesbar, der Abschluss ist abgebrochen (' + (err && err.message) + '). Bitte später nochmals.'); }
  }
  return gesperrt_(function () {
    const d2 = durchgang_(id);
    if (String(d2['Status']) === 'Abgeschlossen') throw new Error('Der Durchgang ist schon abgeschlossen.');
    if (!bestaetigt) {
      const spaet = spaeteScans_(id, kuerzel);
      if (spaet.length) return { warnung: 'In den letzten 2 Minuten haben andere noch zugeordnet: ' + spaet.join(', ') + '. Sind alle fertig und ist alles gespeichert?' };
    }
    const k2 = kontrolle_(id), zeilen = [], hinweise = [];
    if (k2.fehler.length) throw new Error(k2.fehler.join(' '));
    /* Liste pro Abnehmer: ein Sheet, ein Tab pro Gebinde und eine Zusammenfassung. In der Sperre, damit sie genau zur Änderungsliste passt. */
    const abnehmer = {}, links = [];
    Object.keys(k2.pro).forEach(function (gid) { const x = k2.pro[gid]; if (String(x.g['Art']) === 'Verkauf' && x.stuecke.length) (abnehmer[String(x.g['Abnehmer'])] = abnehmer[String(x.g['Abnehmer'])] || []).push(x); });
    Object.keys(abnehmer).forEach(function (a) { const l = abnehmerListe_(e, datum, a, String(d2['Name']), abnehmer[a]); links.push(a + ': ' + l.url); l.hinweise.forEach(function (h) { hinweise.push(h); }); });
    let abw = 0;
    Object.keys(k2.pro).forEach(function (gid) {
      const x = k2.pro[gid], art = String(x.g['Art']);
      x.stuecke.forEach(function (s) {
        const p = s.p, pr = pruefungRt_(p, rt, String(x.g['Lagerort neu'] || ''));
        if (/^ABWEICHUNG/.test(pr.text)) abw++;
        zeilen.push({ 'Durchgang': id, 'PG-ID': p['PG-ID'], 'Bezeichnung': p['Bezeichnung'],
          'Aktion': art === 'Verkauf' ? 'Verkaufen' : (art === 'Entsorgung' ? 'Entsorgen' : 'Lagerort ändern'),
          'Gebinde': x.g['Name'], 'Abnehmer': x.g['Abnehmer'], 'Lagerort alt': p['Lagerort alt'], 'Lagerort neu': x.g['Lagerort neu'] || '',
          'VP alt': zahl_(p['VP']), 'Preis': s.preis, 'Return-Tool-Tab': pr.tab || p['Quelle Tab'], 'Zeile': pr.zeile || p['Quelle Zeile'], 'Erledigt': '', 'Prüfung': pr.text });
      });
    });
    if (abw) hinweise.unshift(abw + ' Abweichungen zum Return Tool: vor dem Eintragen prüfen (Spalte «Prüfung»).');
    zeilen.sort(function (a, b) { return String(a['Return-Tool-Tab']).localeCompare(String(b['Return-Tool-Tab'])) || Number(a['Zeile']) - Number(b['Zeile']); });
    schreib_('Änderungen', zeilen);
    setz_('Durchgänge', [{ _r: d2._r, 'Status': 'Abgeschlossen', 'Abgeschlossen am': zeit_(), 'Abgeschlossen von': ich_() + (kuerzel ? ' (' + kuerzel + ')' : ''), 'Listen': links.join('\n') }]);
    log_('Abgeschlossen', id, zeilen.length + ' Änderungen · nicht zugeordnet ' + k2.offen + ' · ' + links.join(' | ') + (hinweise.length ? ' · ' + hinweise.join(' ') : ''));
    return Object.assign(laden(id), { hinweise: hinweise });
  });
}

/** Ein Sheet pro Abnehmer im Ablage-Ordner: Tab «Total» und ein Tab pro Gebinde. Gibt { url, hinweise } zurück. */
function abnehmerListe_(e, datum, abnehmer, durchgangName, gebinde) {
  const titel = '(' + datum + ') ' + abnehmer + '-Liste ' + durchgangName, hinweise = [];
  const ss = SpreadsheetApp.create(titel);
  try { DriveApp.getFileById(ss.getId()).moveTo(DriveApp.getFolderById(e['Ablage-Ordner ID'] || ABLAGE_ID)); }
  catch (err) { hinweise.push('Liste ' + abnehmer + ' liegt in «Meine Ablage» von Jonas, Verschieben in den Ablage-Ordner ging nicht (' + (err && err.message) + ').'); }
  /* Das Tool läuft als Jonas: Damit alle im Team die Liste öffnen können, ist sie für Pretty Good mit Link lesbar. */
  try { DriveApp.getFileById(ss.getId()).setSharing(DriveApp.Access.DOMAIN_WITH_LINK, DriveApp.Permission.VIEW); }
  catch (err) { hinweise.push('Liste ' + abnehmer + ' ist nicht für Pretty Good freigegeben, nur Jonas kann sie öffnen (' + (err && err.message) + ').'); }
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
  return { url: ss.getUrl(), hinweise: hinweise };
}

/** Änderungen eines abgeschlossenen Durchgangs für die Anzeige. */
function aenderungenVon_(id) {
  return lies_('Änderungen').z.filter(function (r) { return String(r['Durchgang']) === id; }).map(function (r) {
    return { r: r._r, id: String(r['PG-ID']), name: String(r['Bezeichnung']), aktion: String(r['Aktion']), gebinde: String(r['Gebinde']), abnehmer: String(r['Abnehmer']),
      alt: String(r['Lagerort alt']), neu: String(r['Lagerort neu']), vp: zahl_(r['VP alt']), preis: zahl_(r['Preis']), tab: String(r['Return-Tool-Tab']), zeile: String(r['Zeile']),
      erledigt: String(r['Erledigt']), pruefung: String(r['Prüfung'] === undefined ? '' : r['Prüfung']) };
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

/**
 * Admin: abgeschlossenen Durchgang wieder öffnen. Änderungen werden als «zurückgenommen» markiert, die Abnehmer-Listen bleiben im Ordner,
 * bekommen aber «UNGÜLTIG» vor den Titel. Was dabei nicht klappt, kommt als Hinweis zurück.
 */
function wiederOeffnen(id) {
  const e = einst_(), admins = String(e['Admins'] || '').toLowerCase().split(/[,;\s]+/).filter(String);
  if (admins.length && admins.indexOf(ich_().toLowerCase()) < 0) throw new Error('Nur für Admins.');
  return gesperrt_(function () {
    const d = durchgang_(id), hinweise = [];
    if (String(d['Status']) !== 'Abgeschlossen') throw new Error('Der Durchgang ist nicht abgeschlossen.');
    if (aenderungenVon_(id).some(function (a) { return a.erledigt; })) throw new Error('Ein Teil der Änderungen ist im Return Tool schon eingetragen. Zuerst dort zurücknehmen und «Erledigt» leeren.');
    String(d['Listen'] || '').split('\n').filter(String).forEach(function (l) {
      const i = l.indexOf(': '), wer = i > -1 ? l.slice(0, i) : l, url = i > -1 ? l.slice(i + 2) : l;
      try { const ss = SpreadsheetApp.openByUrl(url), n = String(ss.getName()); if (!/^UNGÜLTIG/.test(n)) ss.rename('UNGÜLTIG – ' + n); }
      catch (err) { hinweise.push('Die alte Liste ' + wer + ' liess sich nicht als UNGÜLTIG markieren, bitte von Hand (' + url + ').'); }
    });
    setz_('Änderungen', lies_('Änderungen').z.filter(function (r) { return String(r['Durchgang']) === id; }).map(function (r) { return { _r: r._r, 'Durchgang': id + ' (zurückgenommen)' }; }));
    setz_('Durchgänge', [{ _r: d._r, 'Status': 'Scan', 'Abgeschlossen am': '', 'Abgeschlossen von': '', 'Listen': '' }]);
    log_('Wieder geöffnet', id, 'alte Listen: ' + String(d['Listen'] || '–').replace(/\n/g, ' | ') + (hinweise.length ? ' · ' + hinweise.join(' ') : ''));
    return Object.assign(laden(id), { hinweise: hinweise });
  });
}

/** Prüfen im Editor (nicht in der Web-App): Liest die Lagerorte aus dem Return Tool und schreibt das Ergebnis ins Protokoll. Ändert nichts. */
function pruefen() {
  const x = lagerorte();
  console.log('Lagerorte: ' + x.orte.length + ' · nächste: ' + JSON.stringify(x.naechste) + (x.fehlend.length ? ' · Quell-Tabs fehlen: ' + x.fehlend.join(', ') : ''));
  console.log(x.orte.map(function (o) { return o.ort + ' (' + o.anzahl + ', ' + o.tabs + ')'; }).join(' | ').slice(0, 6000));
}
