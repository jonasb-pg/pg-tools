/**
 * BASIS – gemeinsamer Teil aller Pretty-Good-Tools (Analyse Tool, Ricardo Tool).
 *
 * Diese Datei ist in jedem Apps-Script-Projekt als «Basis.gs» identisch vorhanden. Quelle ist das Repo (apps/basis/Basis.gs),
 * ein Test prüft, dass alle Kopien gleich sind. Hier nichts toolspezifisches einbauen: Was ein Tool braucht, gibt es als Katalog mit.
 *
 * Inhalt: ein Gestaltungsstandard für die Sheets (Datenbank) und die automatisch geschriebene «Übersicht».
 *  - Tab «Übersicht» zuerst: was jeder Tab enthält, wer hineinschreibt, die wichtigsten Regeln. Wird bei jedem «einrichten» neu geschrieben.
 *  - Reihenfolge und Farbe der Tabs nach ihrer Art:
 *      arbeit       Das Tool schreibt (Daten).              weiss, Warnung bei Handänderung
 *      protokoll    Das Tool schreibt einen Verlauf (Log). grau,  Warnung bei Handänderung
 *      hilfe        Zwischenablage oder Formeln.            grau,  ohne Warnung
 *      einstellung  Von Hand anpassbar.                     gelb
 *  - Arial (Datentabs 10 Punkt), Kopfzeile fett auf hellgrau, Kopfzeile fixiert, Zeitzone Zürich.
 *  - Tab «Einstellungen»: Spalten Einstellung | Wert | Erklärung, Werte in blauer Schrift (= Eingabewert).
 * Tab- und Spaltennamen ändert die Basis nie: Die Tools finden ihre Spalten über die Namen.
 */

const BASIS_VERSION = '2026-10-16.1';
const BASIS = {
  zeitzone: 'Europe/Zurich', schrift: 'Arial', groesse: 10,
  kopf: '#efefef', gelb: '#ffd966', grau: '#b7b7b7', wert: '#0000ff',
  // Kopfzellen in diesen Farben (oder ohne Farbe) gelten als gewöhnliche Kopfzeile. Andere Farben (z.B. dunkelgrau = berechnete Spalte) bleiben.
  alteKopffarben: ['#ffffff', '#efefef', '#e6efe9', '#f3f3f3', '#d9d9d9']
};
const BASIS_ARTEN = {
  arbeit: { farbe: null, warnung: true, wer: 'Tool' },
  protokoll: { farbe: BASIS.grau, warnung: true, wer: 'Tool' },
  hilfe: { farbe: BASIS.grau, warnung: false, wer: 'Tool' },
  einstellung: { farbe: BASIS.gelb, warnung: false, wer: 'Mensch' }
};
const BASIS_REIHENFOLGE = ['arbeit', 'protokoll', 'hilfe', 'einstellung'];

/**
 * Bringt das Sheet auf den Standard und schreibt die Übersicht.
 * tool:   { name: 'Ricardo Tool', version: VERSION, zweck: 'ein Satz', legende: [[Begriff, Bedeutung], …] (optional, ergänzt die Legende) }
 * katalog: [{ tab, art, inhalt, wer (optional), kopf (Zeilen mit Kopf, Vorgabe 1, 0 = keine Kopfzeile) }]
 * regeln: [[Titel, [Zeile, …]], …]  (optional) erscheint unter der Tab-Liste
 * Gibt die Liste der Tabs zurück, die im Katalog stehen, aber im Sheet fehlen (nicht als Fehler: manche entstehen erst beim ersten Gebrauch).
 */
function basisEinrichten_(ss, tool, katalog, regeln) {
  ss.setSpreadsheetTimeZone(BASIS.zeitzone);
  const fehlt = [];
  katalog.forEach(function (k) {
    const sh = ss.getSheetByName(k.tab);
    if (!sh) { fehlt.push(k.tab); return; }
    basisTab_(sh, k, tool.name);
  });
  basisUebersicht_(ss, tool, katalog, regeln || []);
  basisReihenfolge_(ss, katalog);
  return fehlt;
}

/** Ein Tab nach seiner Art gestalten. Inhalte bleiben unberührt. */
function basisTab_(sh, k, toolName) {
  const art = BASIS_ARTEN[k.art] || BASIS_ARTEN.arbeit, kopfZeilen = k.kopf === undefined ? 1 : k.kopf;
  const zeilen = Math.max(1, sh.getMaxRows()), spalten = Math.max(1, sh.getMaxColumns());
  /* Schrift überall gleich. Die Grösse nur in Datentabs: Tabs ohne Kopfzeile (Auswertung, Regeln) haben bewusst grössere Titel. */
  const alles = sh.getRange(1, 1, zeilen, spalten).setFontFamily(BASIS.schrift);
  if (kopfZeilen > 0) alles.setFontSize(BASIS.groesse);
  sh.setTabColor(art.farbe);
  if (kopfZeilen > 0) {
    const letzte = Math.max(1, sh.getLastColumn()), kopf = sh.getRange(1, 1, kopfZeilen, letzte);
    const farben = kopf.getBackgrounds().map(function (z) {
      return z.map(function (f) { return BASIS.alteKopffarben.indexOf(String(f).toLowerCase()) > -1 ? BASIS.kopf : f; });
    });
    kopf.setBackgrounds(farben).setFontWeight('bold').setVerticalAlignment('middle');
    if (sh.getFrozenRows() < kopfZeilen) sh.setFrozenRows(kopfZeilen);
  }
  if (k.tab === 'Einstellungen') basisEinstellungen_(sh);
  /* Warnung bei Handänderung: nur für Tabs, die das Tool schreibt. Eigene alte Schutzregeln (gleicher Anfang der Beschreibung) zuerst entfernen. */
  sh.getProtections(SpreadsheetApp.ProtectionType.SHEET).forEach(function (p) {
    if (/^Wird vom .* geführt/.test(String(p.getDescription()))) p.remove();
  });
  if (art.warnung) {
    try { sh.protect().setWarningOnly(true).setDescription('Wird vom ' + toolName + ' geführt. Bitte nicht von Hand sortieren, keine Spalten ändern.'); } catch (err) { /* nicht kritisch */ }
  }
}

/** Einstellungen: Einstellung | Wert | Erklärung. Werte blau, Namen fett, Text umbrochen. */
function basisEinstellungen_(sh) {
  const n = Math.max(sh.getLastRow() - 1, 1);
  sh.getRange(2, 1, n, 1).setFontWeight('bold').setVerticalAlignment('top');
  sh.getRange(2, 2, n, 1).setFontColor(BASIS.wert).setVerticalAlignment('top').setWrap(true);   // Hintergrund bleibt: gelb = noch festzulegen
  sh.getRange(2, 3, n, 1).setVerticalAlignment('top').setWrap(true);
  sh.setColumnWidth(1, 250); sh.setColumnWidth(2, 420); sh.setColumnWidth(3, 520);
}

/** Tab «Übersicht» neu schreiben: Kopf, Legende, alle Tabs mit Inhalt und Schreiber, Regeln. */
function basisUebersicht_(ss, tool, katalog, regeln) {
  const sh = ss.getSheetByName('Übersicht') || ss.insertSheet('Übersicht', 0);
  const zeilen = [
    [tool.name, '', '', ''],
    [tool.zweck || '', '', '', ''],
    ['Stand: Version ' + (tool.version || '') + ', Basis ' + BASIS_VERSION + '. Dieser Tab wird bei jedem «einrichten» neu geschrieben, Änderungen hier gehen verloren.', '', '', ''],
    ['', '', '', ''],
    ['Tab', 'Inhalt', 'Wer schreibt', 'Art']
  ];
  const artText = { arbeit: 'Daten (weiss)', protokoll: 'Verlauf (grau)', hilfe: 'Hilfstab (grau)', einstellung: 'Einstellung (gelb)' };
  BASIS_REIHENFOLGE.forEach(function (a) {
    katalog.filter(function (k) { return (k.art || 'arbeit') === a; }).forEach(function (k) {
      zeilen.push([k.tab, k.inhalt || '', k.wer || (BASIS_ARTEN[a] || BASIS_ARTEN.arbeit).wer, artText[a]]);
    });
  });
  zeilen.push(['', '', '', ''], ['Legende', '', '', '']);
  [['Weisser Tab', 'Das Tool schreibt. Nicht von Hand sortieren, keine Spalten löschen oder umbenennen (Warnung beim Bearbeiten).'],
    ['Grauer Tab', 'Verlauf oder Hilfstab. Nur lesen.'],
    ['Gelber Tab', 'Von Hand anpassbar.'],
    ['Blaue Schrift', 'Eingabewert, den ihr ändern könnt.'],
    ['Gelbes Feld', 'Noch festzulegen oder zu prüfen.'],
    ['Kopfzeile', 'Hellgrau. Spaltennamen nie ändern: Das Tool findet die Spalten über ihre Namen.']].concat(tool.legende || []).forEach(function (z) { zeilen.push([z[0], z[1], '', '']); });
  const titelZeilen = [];
  regeln.forEach(function (r) {
    zeilen.push(['', '', '', '']);
    titelZeilen.push(zeilen.length + 1);
    zeilen.push([r[0], '', '', '']);
    r[1].forEach(function (z) { zeilen.push(['', z, '', '']); });
  });
  sh.clear();
  sh.getRange(1, 1, zeilen.length, 4).setValues(zeilen).setFontFamily(BASIS.schrift).setFontSize(BASIS.groesse).setVerticalAlignment('top').setWrap(true);
  sh.getRange(1, 1).setFontSize(14).setFontWeight('bold');
  sh.getRange(3, 1).setFontColor('#666666');
  sh.getRange(5, 1, 1, 4).setFontWeight('bold').setBackground(BASIS.kopf);
  sh.getRange(6, 1, katalog.length, 1).setFontWeight('bold');
  const leg = zeilen.findIndex(function (z) { return z[0] === 'Legende'; }) + 1;
  sh.getRange(leg, 1).setFontWeight('bold');
  titelZeilen.forEach(function (r) { sh.getRange(r, 1).setFontWeight('bold'); });
  [1, 2, 3].forEach(function (r) { sh.getRange(r, 1, 1, 4).merge().setWrap(true); });
  sh.setColumnWidth(1, 190); sh.setColumnWidth(2, 720); sh.setColumnWidth(3, 130); sh.setColumnWidth(4, 140);
  sh.setFrozenRows(0);
  sh.setTabColor(null);
  sh.getProtections(SpreadsheetApp.ProtectionType.SHEET).forEach(function (p) { if (/^Wird vom .* geführt/.test(String(p.getDescription()))) p.remove(); });
  try { sh.protect().setWarningOnly(true).setDescription('Wird vom ' + tool.name + ' geführt. Wird bei jedem «einrichten» neu geschrieben.'); } catch (err) { /* nicht kritisch */ }
}

/** Übersicht zuerst, dann die Tabs in der Reihenfolge des Katalogs nach Art. Tabs ausserhalb des Katalogs bleiben am Schluss. */
function basisReihenfolge_(ss, katalog) {
  const ziel = ['Übersicht'];
  BASIS_REIHENFOLGE.forEach(function (a) { katalog.forEach(function (k) { if ((k.art || 'arbeit') === a) ziel.push(k.tab); }); });
  let pos = 1;
  ziel.forEach(function (name) {
    const sh = ss.getSheetByName(name);
    if (!sh) return;
    ss.setActiveSheet(sh);
    ss.moveActiveSheet(pos++);
  });
  const ue = ss.getSheetByName('Übersicht');
  if (ue) ss.setActiveSheet(ue);
}
