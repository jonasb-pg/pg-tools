/**
 * HEILSARMEE TOOL (Server) – Pilot Filiale Bern (brocki.ch). Entscheide Jonas B. 29./30.10.2026.
 *
 * Ablauf: Lot eröffnen (BRO-1, BRO-2 …) → EAN, PG-ID oder Name eingeben → Stück aus dem Tab «Heilsarmee» im Return Tool
 * → Neu oder Gebraucht wählen → Brockipreis wird vorgeschlagen (Neu 50%, Gebraucht 75% vom OVP/Neupreis, auf die nächste
 * Preisstufe gerundet), von Hand überschreibbar → Preis mit der Preis-Gun kleben → Übernehmen → nächstes Stück.
 * Lot abschliessen → Reporting-Tab «BRO-n» mit Kategorie PG und Kategorie Brocki (Kassenkategorie), OVP und Brockipreis, Summen.
 *
 * Kategorien werden erst beim Reporting bestimmt, nicht beim Inventarisieren (Jonas B. 30.10.2026): Regeln in Kategorien.gs,
 * danach KI (nur wenn der Script-Eigenschaft ANTHROPIC_API_KEY ein Schlüssel eingetragen ist), sonst «Prüfen».
 * Das Return Tool wird nur gelesen (Entscheid Jonas B. 30.10.2026). Das Verschieben ins «Archiv Heilsarmee» macht das Team selbst.
 * Preisstufen: 1.9, 2.9, 4.9, 6.9, 9.9, 14.9, 18.9, 24.9, 29.9, 39, 49, 59, dann 69, 79 … (Pilot-Excel, Tab PREISE GEBRAUCHT).
 */
const VERSION = '1.0.0';
const TZ = 'Europe/Zurich';

const CONFIG_DEFAULTS = [
  ['RETURN_TOOL_ID', '1FpHJNeWZENdhgP6MqAYyOOEe1FN0tIZWOkRiYItOz2E', 'Sheet-ID des Return Tools (wird nur gelesen)'],
  ['RETURN_TAB', 'Heilsarmee', 'Tab im Return Tool mit den Retouren für die Heilsarmee'],
  ['PROZENT_NEU', 0.5, 'Neu: Anteil vom OVP (0.5 = 50%)'],
  ['PROZENT_GEBRAUCHT', 0.75, 'Gebraucht: Anteil vom Neupreis (0.75 = 75%)'],
  ['LOT_PREFIX', 'BRO-', 'Vorsilbe der Lot-ID'],
  ['KI_MODELL', 'claude-haiku-5-5', 'KI-Modell für Kategorien, die die Regeln nicht erkennen (nur mit Schlüssel ANTHROPIC_API_KEY)'],
];
const STUFEN_BASIS = [1.9, 2.9, 4.9, 6.9, 9.9, 14.9, 18.9, 24.9, 29.9, 39, 49, 59];
const LOT_COLS = ['Lot', 'Eröffnet am', 'Eröffnet von', 'Status', 'Abgeschlossen am', 'Stücke', 'Summe OVP CHF', 'Summe Brockipreis CHF'];
const ST_COLS = ['Pos-ID', 'Lot', 'Erfasst am', 'Erfasst von', 'Quelle', 'PG-ID', 'EAN', 'Bezeichnung', 'Menge', 'Zustand',
  'OVP CHF', 'Prozent', 'Vorschlag CHF', 'Brockipreis CHF', 'Preis von Hand', 'Lagerort RT', 'Bemerkung'];
const KAT_COLS = ['Bezeichnung', 'Kategorie PG', 'Preisgruppe PG', 'Kategorie Brocki', 'Kassenkategorie Brocki', 'Quelle', 'Bestimmt am'];

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index').setTitle('Heilsarmee Tool')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Heilsarmee Tool')
    .addItem('Setup ausführen', 'setup')
    .addItem('Reporting für ein Lot erstellen', 'menuReporting')
    .addItem('Web-App-Link anzeigen', 'showAppUrl').addToUi();
}
function showAppUrl() {
  const u = ScriptApp.getService().getUrl();
  SpreadsheetApp.getUi().alert(u ? 'Web-App: ' + u : 'Noch keine Bereitstellung (Bereitstellen → Neue Bereitstellung → Web-App).');
}
function menuReporting() {
  const ui = SpreadsheetApp.getUi(), r = ui.prompt('Reporting', 'Lot-ID (z. B. BRO-1):', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const out = reporting(r.getResponseText());
  ui.alert('Tab «' + out.tab + '» erstellt: ' + out.stuecke + ' Stücke, ' + out.pruefen + ' Kategorien zu prüfen.');
}

/* ============================== Hilfen ============================== */
const str_ = (v) => (v == null ? '' : String(v)).trim();
function zahl_(v) {
  if (typeof v === 'number') return isFinite(v) ? v : null;
  const s = str_(v).replace(/CHF/i, '').replace(/['’\s]/g, '').replace(',', '.');
  if (!s) return null;
  const n = Number(s);
  return isFinite(n) ? n : null;
}
const eanNorm_ = (v) => str_(v).replace(/\D/g, '').replace(/^0+/, '');          // UPC-A (12) = EAN-13 mit führender 0
const pgNorm_ = (v) => str_(v).toUpperCase().replace(/[–—\s]/g, '-').replace(/-+/g, '-');
const fmtZeit_ = (d) => Utilities.formatDate(d, TZ, 'dd.MM.yyyy HH:mm');
function nutzer_() { try { return Session.getActiveUser().getEmail() || ''; } catch (e) { return ''; } }

/** Preisstufen bis mindestens «bis» (über 59 in 10er-Schritten). */
function stufen_(bis) {
  const s = STUFEN_BASIS.slice();
  while (s[s.length - 1] < bis) s.push(s[s.length - 1] + 10);
  return s;
}
/** Neupreis × Prozent, auf die nächstgelegene Preisstufe (bei Gleichstand die höhere). null ohne Neupreis. */
function preisVorschlag_(neupreis, prozent) {
  const n = zahl_(neupreis), p = zahl_(prozent);
  if (n == null || n <= 0 || p == null || p <= 0) return null;
  const roh = n * p, s = stufen_(roh + 10);
  let best = s[0];
  s.forEach((x) => { if (Math.abs(x - roh) < Math.abs(best - roh) - 1e-9 || (Math.abs(Math.abs(x - roh) - Math.abs(best - roh)) < 1e-9 && x > best)) best = x; });
  return Math.round(best * 100) / 100;
}

function getConfig_() {
  const c = {};
  CONFIG_DEFAULTS.forEach((d) => { c[d[0]] = d[1]; });
  const sh = SpreadsheetApp.getActive().getSheetByName('Config');
  if (sh && sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues().forEach((r) => { if (str_(r[0]) && str_(r[1]) !== '') c[str_(r[0])] = r[1]; });
  ['PROZENT_NEU', 'PROZENT_GEBRAUCHT'].forEach((k) => {
    let v = zahl_(c[k]); if (v != null && v > 1) v = v / 100;                    // 50 → 0.5
    c[k] = v != null && v > 0 && v <= 1 ? v : CONFIG_DEFAULTS.filter((d) => d[0] === k)[0][1];
  });
  return c;
}

function tab_(name, cols) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); }
  if (cols && sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight('bold').setBackground('#EFEFEF');
    sh.setFrozenRows(1);
  }
  return sh;
}
function zeilen_(sh, cols) {
  const n = sh.getLastRow() - 1;
  if (n < 1) return [];
  return sh.getRange(2, 1, n, cols.length).getValues().map((r, i) => { const o = { _zeile: i + 2 }; cols.forEach((k, j) => { o[k] = r[j]; }); return o; });
}

function setup() {
  const ss = SpreadsheetApp.getActive();
  ss.setSpreadsheetTimeZone(TZ);
  const cf = tab_('Config', ['Schlüssel', 'Wert', 'Erklärung']);
  const da = cf.getLastRow() > 1 ? cf.getRange(2, 1, cf.getLastRow() - 1, 1).getValues().map((r) => str_(r[0])) : [];
  CONFIG_DEFAULTS.forEach((d) => { if (da.indexOf(d[0]) < 0) cf.appendRow(d); });
  tab_('Lots', LOT_COLS); tab_('Stücke', ST_COLS); tab_('Kategorien', KAT_COLS);
  const ps = tab_('Preisstufen', ['Preisstufe CHF']);
  if (ps.getLastRow() < 2) ps.getRange(2, 1, 22, 1).setValues(stufen_(250).slice(0, 22).map((x) => [x]));
  const s1 = ss.getSheetByName('Sheet1') || ss.getSheetByName('Tabellenblatt1');
  if (s1 && s1.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(s1);
  return 'ok';
}

/* ============================== Return Tool lesen ============================== */
/** Liest den Tab Heilsarmee (Kopfzeile wird gesucht: Zeile mit «ID» und «Barcode»). Cache 60 s. */
function returnTool_() {
  const cache = CacheService.getScriptCache(), hit = cache.get('ha-rt');
  if (hit) return JSON.parse(hit);
  const cfg = getConfig_();
  const sh = SpreadsheetApp.openById(str_(cfg.RETURN_TOOL_ID)).getSheetByName(str_(cfg.RETURN_TAB));
  if (!sh) throw new Error('Tab «' + cfg.RETURN_TAB + '» im Return Tool nicht gefunden.');
  const werte = sh.getDataRange().getDisplayValues();
  let kopf = -1;
  for (let i = 0; i < Math.min(20, werte.length); i++) if (werte[i].indexOf('ID') >= 0 && werte[i].indexOf('Barcode') >= 0) { kopf = i; break; }
  if (kopf < 0) throw new Error('Kopfzeile im Tab «' + cfg.RETURN_TAB + '» nicht gefunden (Spalten ID und Barcode).');
  const k = werte[kopf], ix = (n) => k.indexOf(n);
  const out = [];
  for (let i = kopf + 1; i < werte.length; i++) {
    const r = werte[i], id = str_(r[ix('ID')]);
    if (!id) continue;
    out.push({ id: id, bez: str_(r[ix('Bezeichnung')]), menge: zahl_(r[ix('#')]) || 1, ean: str_(r[ix('Barcode')]), ovp: zahl_(r[ix('OVP')]),
      kat: str_(r[ix('Kategorie')]), ort: str_(r[ix('Lagerort')]), link: str_(r[ix('Link')]) });
  }
  try { cache.put('ha-rt', JSON.stringify(out), 60); } catch (e) { /* zu gross für den Cache: ohne */ }
  return out;
}

/** PG-IDs, die schon in einem Lot stehen → { pgid: posId } */
function vergeben_() {
  const m = {};
  zeilen_(tab_('Stücke', ST_COLS), ST_COLS).forEach((s) => { const p = pgNorm_(s['PG-ID']); if (p) m[p] = s['Pos-ID'] + ' (' + s['Lot'] + ')'; });
  return m;
}

/** Suche: EAN (exakt), PG-ID (exakt) oder Teil der Bezeichnung. Freie Stücke zuerst. */
function suche_(q, liste, verg) {
  q = str_(q);
  if (!q) return [];
  const e = eanNorm_(q), p = pgNorm_(q);
  let treffer;
  if (/^\d{6,14}$/.test(q.replace(/\s/g, ''))) treffer = liste.filter((x) => e && eanNorm_(x.ean) === e);
  else if (/^PG-?\d+$/i.test(p)) treffer = liste.filter((x) => pgNorm_(x.id) === p.replace(/^PG(\d)/, 'PG-$1'));
  else {
    const w = q.toLowerCase().split(/\s+/).filter(Boolean);
    treffer = liste.filter((x) => { const b = (x.bez + ' ' + x.id).toLowerCase(); return w.every((t) => b.indexOf(t) >= 0); });
  }
  return treffer.map((x) => Object.assign({}, x, { vergeben: verg[pgNorm_(x.id)] || '' }))
    .sort((a, b) => (a.vergeben ? 1 : 0) - (b.vergeben ? 1 : 0)).slice(0, 12);
}

/* ============================== Web-App-API ============================== */
function getBootstrap() {
  const cfg = getConfig_();
  if (!SpreadsheetApp.getActive().getSheetByName('Stücke')) setup();
  return { version: VERSION, prozentNeu: cfg.PROZENT_NEU, prozentGebraucht: cfg.PROZENT_GEBRAUCHT, stufen: stufen_(1000), lots: lots_(), user: nutzer_() };
}

function lots_() {
  const st = zeilen_(tab_('Stücke', ST_COLS), ST_COLS);
  return zeilen_(tab_('Lots', LOT_COLS), LOT_COLS).map((l) => {
    const s = st.filter((x) => str_(x['Lot']) === str_(l['Lot']));
    return { lot: str_(l['Lot']), status: str_(l['Status']), eroeffnet: l['Eröffnet am'] instanceof Date ? fmtZeit_(l['Eröffnet am']) : str_(l['Eröffnet am']),
      stuecke: s.reduce((a, x) => a + (zahl_(x['Menge']) || 1), 0), summe: s.reduce((a, x) => a + (zahl_(x['Brockipreis CHF']) || 0) * (zahl_(x['Menge']) || 1), 0) };
  }).reverse();
}

function suche(q) {
  return { treffer: suche_(q, returnTool_(), vergeben_()) };
}

function neuesLot(von) {
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const cfg = getConfig_(), sh = tab_('Lots', LOT_COLS), pre = str_(cfg.LOT_PREFIX) || 'BRO-';
    let max = 0;
    zeilen_(sh, LOT_COLS).forEach((l) => { const m = str_(l['Lot']).match(/(\d+)$/); if (m) max = Math.max(max, Number(m[1])); });
    const lot = pre + (max + 1);
    sh.appendRow([lot, new Date(), str_(von) || nutzer_(), 'Offen', '', 0, 0, 0]);
    return { lot: lot, lots: lots_() };
  } finally { lock.releaseLock(); }
}

function lotStuecke(lot) {
  lot = str_(lot);
  return zeilen_(tab_('Stücke', ST_COLS), ST_COLS).filter((s) => str_(s['Lot']) === lot).map((s) => ({
    pos: s['Pos-ID'], pgid: s['PG-ID'], bez: s['Bezeichnung'], menge: zahl_(s['Menge']) || 1, zustand: s['Zustand'], ovp: zahl_(s['OVP CHF']), preis: zahl_(s['Brockipreis CHF']) })).reverse();
}

/**
 * Stück ins Lot. p = { lot, pgid, ean, bez, menge, zustand: 'Neu'|'Gebraucht', ovp, preis (optional, von Hand), quelle, ort, von, ok }.
 * Der Server rechnet den Vorschlag selbst; ein abweichender Preis gilt als «von Hand».
 */
function stueckSpeichern(p) {
  p = p || {};
  const lot = str_(p.lot), zustand = str_(p.zustand), cfg = getConfig_();
  if (!lot) throw new Error('Kein Lot offen.');
  if (zustand !== 'Neu' && zustand !== 'Gebraucht') throw new Error('Bitte Neu oder Gebraucht wählen.');
  const bez = str_(p.bez);
  if (!bez) throw new Error('Bezeichnung fehlt.');
  const ovp = zahl_(p.ovp), prozent = zustand === 'Neu' ? cfg.PROZENT_NEU : cfg.PROZENT_GEBRAUCHT;
  const vorschlag = preisVorschlag_(ovp, prozent);
  let preis = zahl_(p.preis);
  if (preis == null) preis = vorschlag;
  if (preis == null || preis <= 0) throw new Error('Preis fehlt: OVP eingeben oder Brockipreis von Hand.');
  const menge = Math.max(1, Math.round(zahl_(p.menge) || 1));
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const ls = zeilen_(tab_('Lots', LOT_COLS), LOT_COLS).filter((l) => str_(l['Lot']) === lot)[0];
    if (!ls) throw new Error('Lot ' + lot + ' gibt es nicht.');
    if (str_(ls['Status']) !== 'Offen') throw new Error('Lot ' + lot + ' ist abgeschlossen.');
    const sh = tab_('Stücke', ST_COLS), alle = zeilen_(sh, ST_COLS), pg = pgNorm_(p.pgid);
    if (pg && p.ok !== true) {
      const schon = alle.filter((s) => pgNorm_(s['PG-ID']) === pg)[0];
      if (schon) throw new Error('Bitte bestätigen: ' + p.pgid + ' steht schon in ' + schon['Lot'] + ' (' + schon['Pos-ID'] + '). Trotzdem nochmals erfassen? [doppelt]');
    }
    const n = alle.filter((s) => str_(s['Lot']) === lot).reduce((a, s) => { const m = str_(s['Pos-ID']).match(/\/(\d+)$/); return Math.max(a, m ? Number(m[1]) : 0); }, 0) + 1;
    const pos = lot + '/' + n;
    const row = { 'Pos-ID': pos, 'Lot': lot, 'Erfasst am': new Date(), 'Erfasst von': str_(p.von) || nutzer_(), 'Quelle': str_(p.quelle) || (pg ? 'Retoure' : 'Von Hand'),
      'PG-ID': str_(p.pgid), 'EAN': str_(p.ean), 'Bezeichnung': bez, 'Menge': menge, 'Zustand': zustand, 'OVP CHF': ovp == null ? '' : ovp,
      'Prozent': prozent, 'Vorschlag CHF': vorschlag == null ? '' : vorschlag, 'Brockipreis CHF': preis, 'Preis von Hand': vorschlag == null || Math.abs(preis - vorschlag) > 0.001 ? 'Ja' : '',
      'Lagerort RT': str_(p.ort), 'Bemerkung': str_(p.bemerkung) };
    sh.appendRow(ST_COLS.map((k) => row[k]));
    const z = sh.getLastRow();
    sh.getRange(z, ST_COLS.indexOf('EAN') + 1).setNumberFormat('@').setValue(str_(p.ean));
    return { pos: pos, preis: preis, vorschlag: vorschlag, stuecke: lotStuecke(lot) };
  } finally { lock.releaseLock(); }
}

function stueckLoeschen(pos) {
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = tab_('Stücke', ST_COLS), s = zeilen_(sh, ST_COLS).filter((x) => str_(x['Pos-ID']) === str_(pos))[0];
    if (!s) throw new Error(pos + ' nicht gefunden.');
    const l = zeilen_(tab_('Lots', LOT_COLS), LOT_COLS).filter((x) => str_(x['Lot']) === str_(s['Lot']))[0];
    if (l && str_(l['Status']) !== 'Offen') throw new Error('Lot ' + s['Lot'] + ' ist abgeschlossen.');
    sh.deleteRow(s._zeile);
    return { stuecke: lotStuecke(s['Lot']) };
  } finally { lock.releaseLock(); }
}

/** Lot abschliessen: Status, Summen, Reporting-Tab. */
function lotAbschliessen(lot) {
  lot = str_(lot);
  const sh = tab_('Lots', LOT_COLS), l = zeilen_(sh, LOT_COLS).filter((x) => str_(x['Lot']) === lot)[0];
  if (!l) throw new Error('Lot ' + lot + ' gibt es nicht.');
  const st = lotStuecke(lot);
  if (!st.length) throw new Error('Lot ' + lot + ' hat noch keine Stücke.');
  const rep = reporting(lot);
  sh.getRange(l._zeile, 4, 1, 5).setValues([['Abgeschlossen', new Date(), rep.stuecke, rep.summeOvp, rep.summePreis]]);
  return Object.assign(rep, { lots: lots_() });
}

/* ============================== Kategorien und Reporting ============================== */
let KAT_RX_ = null;
/** Kategorie aus der Bezeichnung mit den Regeln. Gibt { pg, preisgruppe, brocki, kasse, quelle } oder null. */
function kategorieRegel_(bez) {
  if (!KAT_RX_) KAT_RX_ = KAT_REGELN.map((r) => [new RegExp(r[0], 'i'), r[1], r[2]]);
  const b = str_(bez);
  for (let i = 0; i < KAT_RX_.length; i++) {
    if (KAT_RX_[i][0].test(b)) {
      const g = KAT_RX_[i][1], sub = KAT_RX_[i][2] || KAT_PG[g][1];
      return { pg: KAT_PG[g][0], preisgruppe: g, brocki: KAT_HAUPT[sub], kasse: sub, quelle: 'Regel' };
    }
  }
  return null;
}

/** KI für Bezeichnungen ohne Regel-Treffer. Nur mit Schlüssel. Gibt { bez: kat } zurück. */
function kategorieKi_(bezeichnungen) {
  const key = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
  if (!key || !bezeichnungen.length) return {};
  const cfg = getConfig_(), gruppen = Object.keys(KAT_PG), kassen = Object.keys(KAT_HAUPT);
  const prompt = 'Ordne jedes Produkt genau einer Preisgruppe und einer Kassenkategorie zu.\nPreisgruppen: ' + gruppen.join(' | ') +
    '\nKassenkategorien: ' + kassen.join(' | ') + '\nAntworte nur mit JSON: [{"i":0,"preisgruppe":"…","kasse":"…"}, …]\nProdukte:\n' +
    bezeichnungen.map((b, i) => i + ': ' + b).join('\n');
  const res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', { method: 'post', muteHttpExceptions: true, contentType: 'application/json',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    payload: JSON.stringify({ model: str_(cfg.KI_MODELL) || 'claude-haiku-5-5', max_tokens: 4000, messages: [{ role: 'user', content: prompt }] }) });
  if (res.getResponseCode() !== 200) return {};
  const txt = (JSON.parse(res.getContentText()).content || []).map((c) => c.text || '').join('');
  const m = txt.match(/\[[\s\S]*\]/);
  if (!m) return {};
  const out = {};
  JSON.parse(m[0]).forEach((r) => {
    const b = bezeichnungen[r.i];
    if (b == null || !KAT_PG[r.preisgruppe] || !KAT_HAUPT[r.kasse]) return;
    out[b] = { pg: KAT_PG[r.preisgruppe][0], preisgruppe: r.preisgruppe, brocki: KAT_HAUPT[r.kasse], kasse: r.kasse, quelle: 'KI' };
  });
  return out;
}

/** Kategorien für eine Liste von Bezeichnungen: zuerst Tab «Kategorien» (gemerkt, von Hand korrigierbar), dann Regeln, dann KI. */
function kategorien_(bezeichnungen) {
  const sh = tab_('Kategorien', KAT_COLS), bekannt = {};
  zeilen_(sh, KAT_COLS).forEach((k) => { if (str_(k['Kassenkategorie Brocki'])) bekannt[str_(k['Bezeichnung'])] = { pg: str_(k['Kategorie PG']), preisgruppe: str_(k['Preisgruppe PG']), brocki: str_(k['Kategorie Brocki']), kasse: str_(k['Kassenkategorie Brocki']), quelle: str_(k['Quelle']) }; });
  const out = {}, neu = [], offen = [];
  bezeichnungen.forEach((b) => {
    b = str_(b);
    if (out[b]) return;
    if (bekannt[b]) { out[b] = bekannt[b]; return; }
    const r = kategorieRegel_(b);
    if (r) { out[b] = r; neu.push(b); } else offen.push(b);
  });
  let ki = {};
  try { ki = kategorieKi_(offen); } catch (e) { ki = {}; }
  offen.forEach((b) => { out[b] = ki[b] || { pg: '', preisgruppe: '', brocki: '', kasse: '', quelle: 'Prüfen' }; if (ki[b]) neu.push(b); });
  const jetzt = new Date();
  if (neu.length) sh.getRange(sh.getLastRow() + 1, 1, neu.length, KAT_COLS.length).setValues(neu.map((b) => [b, out[b].pg, out[b].preisgruppe, out[b].brocki, out[b].kasse, out[b].quelle, jetzt]));
  return out;
}

/** Reporting-Tab «BRO-n» (neu geschrieben bei jedem Aufruf). */
function reporting(lot) {
  lot = str_(lot);
  const st = zeilen_(tab_('Stücke', ST_COLS), ST_COLS).filter((s) => str_(s['Lot']) === lot);
  if (!st.length) throw new Error('Lot ' + lot + ' hat keine Stücke.');
  const kat = kategorien_(st.map((s) => s['Bezeichnung']));
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(lot);
  if (sh) sh.clear(); else sh = ss.insertSheet(lot);
  const kopf = ['Pos-ID', 'PG-ID', 'EAN', 'Bezeichnung', 'Menge', 'Zustand', 'Kategorie PG', 'Preisgruppe PG', 'Kategorie Brocki', 'Kassenkategorie Brocki', 'OVP CHF', 'Brockipreis CHF', 'Total Brockipreis CHF'];
  const daten = st.map((s) => {
    const k = kat[str_(s['Bezeichnung'])] || {};
    return [s['Pos-ID'], s['PG-ID'], str_(s['EAN']), s['Bezeichnung'], zahl_(s['Menge']) || 1, s['Zustand'], k.pg || '', k.preisgruppe || '', k.brocki || 'Prüfen', k.kasse || '', zahl_(s['OVP CHF']), zahl_(s['Brockipreis CHF']), null];
  });
  sh.getRange(1, 1).setValue('Lot ' + lot + ', Inventarliste für die Heilsarmee brocki.ch Bern').setFontWeight('bold');
  sh.getRange(2, 1).setValue('Erstellt am ' + fmtZeit_(new Date()));
  sh.getRange(4, 1, 1, kopf.length).setValues([kopf]).setFontWeight('bold').setBackground('#EFEFEF');
  const z0 = 5, n = daten.length;
  sh.getRange(z0, 3, n, 1).setNumberFormat('@');
  sh.getRange(z0, 1, n, kopf.length).setValues(daten);
  sh.getRange(z0, 13, n, 1).setFormulas(daten.map((d, i) => ['=E' + (z0 + i) + '*L' + (z0 + i)]));
  const zs = z0 + n;
  sh.getRange(zs, 1).setValue('Total');
  sh.getRange(zs, 5).setFormula('=SUM(E' + z0 + ':E' + (zs - 1) + ')');
  sh.getRange(zs, 11).setFormula('=SUMPRODUCT(E' + z0 + ':E' + (zs - 1) + ',K' + z0 + ':K' + (zs - 1) + ')');
  sh.getRange(zs, 13).setFormula('=SUM(M' + z0 + ':M' + (zs - 1) + ')');
  sh.getRange(zs, 1, 1, kopf.length).setFontWeight('bold').setBorder(true, null, null, null, null, null, '#000000', SpreadsheetApp.BorderStyle.SOLID);
  sh.getRange(z0, 11, n + 1, 3).setNumberFormat("#'##0.00");
  sh.getRange(1, 1, zs, kopf.length).setFontFamily('Arial').setFontSize(10);
  sh.setFrozenRows(4);
  const menge = daten.reduce((a, d) => a + d[4], 0);
  return { tab: lot, url: ss.getUrl() + '#gid=' + sh.getSheetId(), stuecke: menge,
    summeOvp: daten.reduce((a, d) => a + (d[10] || 0) * d[4], 0), summePreis: daten.reduce((a, d) => a + (d[11] || 0) * d[4], 0),
    pruefen: daten.filter((d) => d[8] === 'Prüfen').length };
}
