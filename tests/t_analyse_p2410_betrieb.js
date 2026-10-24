/* Prüfung 24.10.2026, Analyse Tool: Betrieb.
   N1 (Reparatur-Stand in «Produkte» statt Script-Eigenschaften, alter Stand lesbar), N7 («Letzter Abgleich» nur bei Erfolg, Fehler sichtbar),
   Z11 (einrichten nur für Admins, Nachtlast, Läufe unter mehreren Konten, Laufzeit), V6 (leere Admin-Liste = nur Besitzerin). Erfundene Daten.
   Lauf: node tests/t_analyse_p2410_betrieb.js */
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const CODE = fs.readFileSync(__dirname + '/../apps/analyse/Code.gs', 'utf8');
function neu(extra) {
  const PROPS = {}, cache = {};
  const c = Object.assign({ console, JSON, Math, Date, RegExp, Utilities: { formatDate: (d, tz, f) => f === 'H' ? String(c.STUNDE) : '24.10.2026', newBlob: s => ({ getBytes: () => Buffer.from(String(s)) }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => PROPS[k] === undefined ? null : PROPS[k], setProperty: (k, v) => { PROPS[k] = String(v); }, deleteProperty: k => { delete PROPS[k]; } }) },
    CacheService: { getScriptCache: () => ({ get: k => cache[k] || null, put: (k, v) => { cache[k] = v; }, getAll: ks => { const o = {}; ks.forEach(k => { if (cache[k]) o[k] = cache[k]; }); return o; }, putAll: o => Object.assign(cache, o), remove: k => { delete cache[k]; }, removeAll: ks => ks.forEach(k => delete cache[k]) }) },
    STUNDE: 10 }, extra || {});
  vm.createContext(c); vm.runInContext(CODE, c);
  return { c, PROPS, cache };
}

/* ---- N1: Reparatur-Stand ---- */
{
  const { c, PROPS } = neu();
  const P = [{ 'PG-ID': 'PG-1', 'Bezeichnung': 'Föhn', 'Analyse-Status': 'Offen', 'Reparatur-Stand': '' }], BL = [];
  let kopf = ['PG-ID', 'Bezeichnung', 'Analyse-Status', 'Reparatur-Stand'];
  c.lies_ = n => ({ kopf: n === 'Produkte' ? kopf : [], z: (n === 'Produkte' ? P : (n === 'Bestellliste' ? BL : [])).map((r, i) => Object.assign({ _r: i + 2 }, r)) });
  c.produkt_ = id => c.lies_('Produkte').z.filter(r => r['PG-ID'] === id)[0];
  c.setz_ = (n, f, w) => { Object.keys(w).forEach(r => { P[Number(r) - 2][f] = w[r]; }); };
  c.schreib_ = (n, o) => { if (n === 'Bestellliste') BL.push(...o); return 0; };
  c.gesperrt_ = f => f(); c.blatt_ = () => ({}); c.log_ = () => {}; c.zeit_ = () => '24.10.2026 10:00:00';
  const gross = 'x'.repeat(20000);                                      // grösser als eine Script-Eigenschaft (9 KB), passt in eine Zelle
  const r = c.reparaturPause({ id: 'PG-1', kuerzel: 'ab', was: 'Kabel ersetzen', stand: { s: { notiz: gross }, i: 3 } });
  assert.strictEqual(P[0]['Analyse-Status'], 'Reparatur');
  assert.ok(/Kabel ersetzen/.test(P[0]['Reparatur-Stand']) && !PROPS['REPARATUR_PG-1'], 'N1: Stand in «Produkte», nicht in den Script-Eigenschaften');
  assert.ok(r.liste[0].was === 'Kabel ersetzen' && r.liste[0].kuerzel === 'AB', 'N1: Liste liest den Stand aus «Produkte»');
  c.ueberblick_ = () => ({ ok: 1 }); c.einst_ = () => ({});
  assert.strictEqual(c.reparaturWeiter('PG-1').stand.i, 3, 'N1: Fortsetzen mit dem Stand');
  /* vor dem 24.10.2026 pausiert: Stand nur in der Script-Eigenschaft → wird weiter gelesen */
  P[0]['Reparatur-Stand'] = ''; PROPS['REPARATUR_PG-1'] = JSON.stringify({ was: 'alt', stand: { i: 2 } });
  assert.strictEqual(c.reparaturWeiter('PG-1').stand.i, 2, 'N1: alter Stand geht nicht verloren');
  /* zu gross für eine Zelle: klare Meldung */
  assert.throws(() => c.reparaturPause({ id: 'PG-1', kuerzel: 'AB', was: 'x', stand: { s: 'y'.repeat(50000) } }), /zu gross/);
  /* vor «einrichten» (Spalte fehlt): wie bisher in der Script-Eigenschaft; ist der Speicher voll, eine richtige Meldung */
  kopf = ['PG-ID', 'Bezeichnung', 'Analyse-Status']; P[0]['Analyse-Status'] = 'Offen';
  c.PropertiesService = { getScriptProperties: () => ({ getProperty: () => null, setProperty: () => { throw new Error('Quota exceeded'); }, deleteProperty: () => {} }) };
  assert.throws(() => c.reparaturPause({ id: 'PG-1', kuerzel: 'AB', was: 'x', stand: { i: 1 } }), /konnte nicht gespeichert werden.*einrichten/, 'N1: richtige Meldung statt «zu gross»');
}

/* ---- N7 + Z11: Abgleich ---- */
{
  const { c, PROPS } = neu();
  const LOG = [];
  c.einst_ = () => ({ 'Automatischer Import': 'Ja', 'Handbuch-Guthaben': 0 }); c.log_ = (a, i, d) => LOG.push(a + ' ' + d); c.zeit_ = () => '24.10.2026 10:00:00';
  c.gesperrt_ = f => f(); c.vergiss_ = () => {}; c.startPaket_ = () => ({});
  c.abholen_ = () => ({}); c.starten_ = () => ({}); c.mmNachRicardo_ = () => ({}); c.mmGeholt_ = () => ({}); c.vorwaermen_ = () => ({});
  c.Session = { getEffectiveUser: () => ({ getEmail: () => 'jonas@x' }) };
  c.spiegeln_ = () => { throw new Error('Return Tool nicht erreichbar'); };
  c.abgleichen({ triggerUid: '1' });
  assert.ok(!PROPS.ABGLEICH_ZULETZT, 'N7: kein «Letzter Abgleich» bei gescheitertem Spiegeln');
  assert.ok(/nicht erreichbar/.test(JSON.parse(PROPS.ABGLEICH_FEHLER).text), 'N7: Fehler gemerkt');
  c.istAdmin_ = () => false; c.startPaket_ = () => ({ zahlen: {} }); c.fotoBasis_ = () => 'u';
  assert.ok(/nicht erreichbar/.test(c.startDaten().abgleichFehler.text), 'N7: Startseite bekommt den Fehler');
  c.spiegeln_ = () => ({ neu: 1 });
  c.abgleichen({ triggerUid: '1' });
  assert.ok(PROPS.ABGLEICH_ZULETZT && !PROPS.ABGLEICH_FEHLER, 'N7: nach Erfolg wieder gesetzt, Fehler weg');
  assert.ok(/s: spiegeln/.test(PROPS.ABGLEICH_DAUER) && LOG.some(l => /^Abgleich-Lauf /.test(l)), 'Z11: Laufzeit im Admin und im Log (der Lauf hat etwas gemacht)');
  /* Z11: zweites Konto mit eigenem Auslöser */
  c.Session = { getEffectiveUser: () => ({ getEmail: () => 'simon@x' }) };
  c.abgleichen({ triggerUid: '2' });
  assert.ok(LOG.some(l => /mehreren Konten.*jonas@x/.test(l)), 'Z11: mehrere Konten gemeldet');
  /* Z11: Knopf «Aktualisieren» zählt nicht als Konto */
  const konten = JSON.parse(PROPS.ABGLEICH_KONTEN); c.Session = { getEffectiveUser: () => ({ getEmail: () => 'kurt@x' }) };
  c.abgleichen(true);
  assert.deepStrictEqual(Object.keys(JSON.parse(PROPS.ABGLEICH_KONTEN)).sort(), Object.keys(konten).sort(), 'Z11: manuell kein neues Konto');
  /* Z11: nachts nur jeder dritte Lauf, ausser Handbücher */
  c.STUNDE = 23; let laeufe = 0; c.spiegeln_ = () => { laeufe++; return {}; };
  for (let i = 0; i < 6; i++) c.abgleichen({ triggerUid: '1' });
  assert.strictEqual(laeufe, 2, 'Z11: nachts 2 von 6 Läufen');
  c.abgleichen(true); assert.strictEqual(laeufe, 3, 'Z11: Knopf läuft immer');
  c.einst_ = () => ({ 'Automatischer Import': 'Ja', 'Handbuch-Guthaben': 5 }); laeufe = 0;
  for (let i = 0; i < 3; i++) c.abgleichen({ triggerUid: '1' });
  assert.strictEqual(laeufe, 3, 'Z11: mit Handbuch-Guthaben jede Runde');
}

/* ---- Z11/V6: einrichten nur für Admins; leere Liste = nur die Besitzerin ---- */
{
  const { c } = neu();
  let user = 'simon@pretty-good.ch', owner = 'jonas@pretty-good.ch', admins = '';
  c.Session = { getActiveUser: () => ({ getEmail: () => user }) };
  c.SpreadsheetApp = { getActiveSpreadsheet: () => ({ getOwner: () => owner ? { getEmail: () => owner } : null }) };
  c.einst_ = () => ({ 'Admins': admins });
  assert.throws(() => c.einrichten(), /Nur für Admins/, 'Z11: einrichten nur für Admins');
  assert.strictEqual(c.istAdmin_(), false, 'V6: leere Liste, nicht Besitzerin');
  user = owner; assert.strictEqual(c.istAdmin_(), true, 'V6: Besitzerin');
  admins = 'simon@pretty-good.ch'; user = 'simon@pretty-good.ch'; assert.strictEqual(c.istAdmin_(), true);
  user = 'jonas@pretty-good.ch'; assert.strictEqual(c.istAdmin_(), false, 'V6: mit Liste zählt nur die Liste');
  admins = ''; owner = ''; user = 'x@pretty-good.ch';
  assert.strictEqual(c.istAdmin_(), false, 'V6: Besitzerin unbekannt (geteilte Ablage): kein Admin');
  assert.strictEqual(c.istAdmin_(null, true), true, 'V6: … aber «einrichten» darf laufen, sonst käme niemand hinein');
  /* Funktionen ohne «_» sind von der Oberfläche aus aufrufbar: nur die vorgesehenen */
  const api = /const f = \{([\s\S]*?)\}\[name\]/.exec(CODE)[1].split(',').map(x => x.split(':')[0].trim()).filter(Boolean);
  const offen = [...CODE.matchAll(/^function ([A-Za-z0-9]+)\(/gm)].map(m => m[1]).filter(n => !n.endsWith('_') && api.indexOf(n) < 0);
  assert.deepStrictEqual(offen.sort(), ['abgleichen', 'api', 'doGet', 'einrichten', 'onEdit', 'onOpen'], 'V6: nur Web-App, Auslöser und einrichten (prüft Admin) ohne «_»: ' + offen.join());
}
console.log('t_analyse_p2410_betrieb ok');
