/* Ersatzteil Tool, Prüfung 24.10.2026 (Version 2026-10-24.2): Regressionstests Server für die Befunde 1, 3, 5–8, 13–15 und Vertrag V2.
   Mock-Sheets mit Schreibpuffer aus t_ersatzteil_p2410_hilfe.js. Kein Google, kein Netz. */
const assert = require('assert');
const H = require('./t_ersatzteil_p2410_hilfe');
const ids = function (l) { return l.map(function (t) { return t.id; }).join(','); };
const zeilen = function (tabs) { return tabs.Teile.slice(1); };
const wirft = function (f, re, m) { let e = null; try { f(); } catch (x) { e = x; } assert.ok(e, m + ': kein Fehler'); assert.ok(re.test(e.message), m + ': ' + e.message); return e; };

assert.ok(/const VERSION = '2026-10-24\.2'/.test(require('fs').readFileSync(__dirname + '/../apps/ersatzteil/Code.gs', 'utf8')), 'VERSION');

/* ---------- Befund 1 (V1): Sperre schreibt vor dem Freigeben. Zweiter Lauf wartet auf die Sperre, beide Läufe puffern ihre Schreibungen. ---------- */
(function () {
  const tabs = H.basisTabs(), props = {};
  tabs.Teile.push(H.teil('ET-0001', 'Philips', 'HD7462', 'Kaffeemaschine', 'Tank', 'B01'));
  let B, einmal = true, idB;
  const A = H.lade({ tabs: tabs, props: props, puffer: true, onRelease: function () {
    if (!einmal) return; einmal = false;
    idB = B.einlagern({ teil: 'Akku', marke: 'Dyson', modell: 'V8', produktart: 'Staubsauger', box: 'B02' }).id; B.__flush();
  } });
  B = H.lade({ tabs: tabs, props: props, puffer: true, email: 'b@pretty-good.ch' });
  const idA = A.einlagern({ teil: 'Wassertank', marke: 'Philips', modell: 'HD7462', produktart: 'Kaffeemaschine', box: 'B01' }).id; A.__flush();
  assert.notStrictEqual(idA, idB, 'keine doppelte ET-Nummer');
  assert.deepStrictEqual(zeilen(tabs).map(function (z) { return z[0]; }), ['ET-0001', 'ET-0002', 'ET-0003'], 'alle drei Zeilen da, keine überschrieben');

  /* verbraucht zweimal gleichzeitig bei Menge 3 → 1 */
  const t2 = H.basisTabs(); t2.Teile.push(H.teil('ET-0001', 'Philips', 'HD7462', 'Kaffeemaschine', 'Tank', 'B01', 3));
  let D, e2 = true;
  const C = H.lade({ tabs: t2, puffer: true, onRelease: function () { if (!e2) return; e2 = false; D.verbraucht('ET-0001'); D.__flush(); } });
  D = H.lade({ tabs: t2, puffer: true });
  C.verbraucht('ET-0001'); C.__flush();
  assert.strictEqual(t2.Teile[1][6], 1, 'zwei Entnahmen = zwei Einheiten');

  /* boxNeu gleichzeitig → zwei verschiedene Boxen */
  const t3 = H.basisTabs();
  let F, e3 = true, boxF;
  const E = H.lade({ tabs: t3, puffer: true, onRelease: function () { if (!e3) return; e3 = false; boxF = F.boxNeu('Toaster').box; F.__flush(); } });
  F = H.lade({ tabs: t3, puffer: true });
  const boxE = E.boxNeu('Mixer').box; E.__flush();
  assert.deepStrictEqual([boxE, boxF], ['B03', 'B04']);
  assert.deepStrictEqual(t3.Boxen.slice(1).map(function (z) { return z[0] + '/' + z[1]; }), ['B01/Kaffeemaschine', 'B02/Staubsauger', 'B03/Mixer', 'B04/Toaster']);

  /* Gegenprobe: ohne flush tritt der Fehler auf (der Test erkennt ihn also) */
  const t4 = H.basisTabs();
  let K, e4 = true, idK;
  const J = H.lade({ tabs: t4, puffer: true, ohneFlush: true, onRelease: function () { if (!e4) return; e4 = false; idK = K.einlagern({ teil: 'Akku', marke: 'Dyson', box: 'B02' }).id; K.__flush(); } });
  K = H.lade({ tabs: t4, puffer: true, ohneFlush: true });
  const idJ = J.einlagern({ teil: 'Tank', marke: 'Philips', box: 'B01' }).id; J.__flush();
  assert.strictEqual(idJ, idK, 'Gegenprobe: ohne flush doppelte Nummer');
})();

/* ---------- Befund 3: Kennung pro Erfassung und Entnahme, Wiederholung bucht nicht doppelt ---------- */
(function () {
  const tabs = H.basisTabs(), c = H.lade({ tabs: tabs });
  const t = { teil: 'Tank', marke: 'Philips', modell: 'HD7462', produktart: 'Kaffeemaschine', box: 'B01', menge: 2, kennung: 'k1abcdefgh' };
  const r1 = c.einlagern(t);
  tabs.Boxen[1][2] = 'voll';                                        // inzwischen voll: die Wiederholung gibt trotzdem das erste Ergebnis
  const r2 = c.einlagern(t);
  assert.strictEqual(r1.id, 'ET-0001'); assert.strictEqual(r2.id, 'ET-0001'); assert.strictEqual(r2.wiederholt, true); assert.strictEqual(r2.box, 'B01'); assert.strictEqual(r2.teil, 'Tank');
  assert.strictEqual(zeilen(tabs).length, 1, 'kein zweites Teil');
  assert.ok(tabs.Log.some(function (z) { return z[2] === 'Einlagern wiederholt' && z[3] === 'ET-0001'; }), 'Wiederholung im Log');
  tabs.Boxen[1][2] = 'offen';
  assert.strictEqual(c.einlagern(Object.assign({}, t, { kennung: 'k2abcdefgh' })).id, 'ET-0002', 'andere Kennung = neues Teil');
  assert.strictEqual(c.einlagern(Object.assign({}, t, { kennung: '=1+1' })).id, 'ET-0003', 'ungültige Kennung wird ignoriert');
  assert.strictEqual(c.einlagern(Object.assign({}, t, { kennung: '' })).id, 'ET-0004', 'ohne Kennung (alte Oberfläche) wie bisher');
  assert.strictEqual(zeilen(tabs)[2][15], '', 'ungültige Kennung nicht gespeichert');
  /* verbraucht: gleiche Kennung zweimal → eine Einheit */
  let v = c.verbraucht('ET-0001', 'w1abcdefgh');
  assert.deepStrictEqual([v.rest, v.wiederholt], [1, false]);
  v = c.verbraucht('ET-0001', 'w1abcdefgh');
  assert.deepStrictEqual([v.rest, v.wiederholt], [1, true], 'Wiederholung zieht nichts ab');
  assert.strictEqual(zeilen(tabs)[0][6], 1);
  v = c.verbraucht('ET-0001', 'w2abcdefgh');
  assert.deepStrictEqual([v.rest, v.wiederholt], [0, false]); assert.strictEqual(zeilen(tabs)[0][8], 'verbraucht');
  v = c.verbraucht('ET-0001', 'w2abcdefgh');
  assert.deepStrictEqual([v.rest, v.wiederholt], [0, true], 'Wiederholung nach dem Ausbuchen: kein Fehler «schon verbraucht»');
  assert.strictEqual(zeilen(tabs)[0][15], 'k1abcdefgh w1abcdefgh w2abcdefgh', 'Spalte Kennung führt alle Aufträge der Zeile');
  wirft(function () { c.verbraucht('ET-0001', 'w3abcdefgh'); }, /schon verbraucht/, 'neue Entnahme bei verbrauchtem Teil');
  /* Wiederholung aus einem zweiten Lauf mit Schreibpuffer: die Kennung ist nach der Sperre sichtbar */
  const t2 = H.basisTabs(), props = {};
  let B, einmal = true, rB;
  const A = H.lade({ tabs: t2, props: props, puffer: true, onRelease: function () { if (!einmal) return; einmal = false; rB = B.einlagern(Object.assign({}, t, { kennung: 'gleichxyz1' })); B.__flush(); } });
  B = H.lade({ tabs: t2, props: props, puffer: true });
  const rA = A.einlagern(Object.assign({}, t, { kennung: 'gleichxyz1' })); A.__flush();
  assert.strictEqual(rA.id, rB.id); assert.strictEqual(rB.wiederholt, true); assert.strictEqual(zeilen(t2).length, 1);
})();

/* ---------- Befund 5: getippte Suche (Marke ohne Sonderzeichen, Umlaute, Modell mit Präfix-Regel) ---------- */
(function () {
  const tabs = H.basisTabs();
  tabs.Teile.push(
    H.teil('ET-0001', "De'Longhi", 'ECAM22.110', 'Kaffeemaschine', 'Brühgruppe', 'B01'),
    H.teil('ET-0002', 'Kärcher', 'WV2', 'Fenstersauger', 'Akku', 'B02'),
    H.teil('ET-0003', 'Philips', 'HD7462', 'Kaffeemaschine', 'Wassertank', 'B01'),
    H.teil('ET-0004', '', 'V8', 'Staubsauger', 'Akku', 'B02'),
    H.teil('ET-0005', 'Dyson', 'V11', 'Staubsauger', 'Bürste', 'B02'),
    H.teil('ET-0006', 'Philips', 'HD7462', 'Kaffeemaschine', 'Deckel', 'B01'),
    H.teil('ET-0007', 'Karcher', 'SC3', 'Dampfreiniger', 'Düse', 'B02'));
  const c = H.lade({ tabs: tabs });
  const text = function (s) { return ids(c.suchen({ text: s }).text); };
  assert.strictEqual(text('Delonghi'), 'ET-0001');
  assert.strictEqual(text('DeLonghi ECAM22.110'), 'ET-0001');
  assert.strictEqual(text('De Longhi'), 'ET-0001');
  assert.strictEqual(text('Karcher WV2'), 'ET-0002');
  assert.strictEqual(text('Kärcher'), 'ET-0002,ET-0007', 'Umlaut im getippten Wort');
  assert.strictEqual(text('HD7462/20'), 'ET-0003,ET-0006');
  assert.strictEqual(text('Philips HD7462-20'), 'ET-0003,ET-0006');
  assert.strictEqual(text('philips wassertank'), 'ET-0003');
  assert.strictEqual(text('Bruhgruppe'), 'ET-0001', 'Akzente im Lager');
  assert.strictEqual(text('ECAM 22.110.B'), 'ET-0001');
  assert.strictEqual(text('Philips 20'), '', 'kurzes Wort ist kein Modell-Treffer (unter MODELL_MIN)');
  assert.strictEqual(text('HD74'), 'ET-0003,ET-0006', 'Teilstück wie bisher als Text');
  assert.strictEqual(text('V8'), 'ET-0004');
  /* Befund 13: Teil ohne Marke, Modell genau gleich → passend mit «Marke prüfen» */
  let s = c.suchen({ marke: 'Dyson', modell: 'V8', produktart: 'Akku-Staubsauger' });
  assert.strictEqual(ids(s.passend), 'ET-0004'); assert.strictEqual(s.passend[0].hinweis, 'Marke prüfen (ohne Marke)');
  s = c.suchen({ marke: 'Samsung', modell: 'V11' });
  assert.strictEqual(ids(s.passend), '', 'kurzes Modell bei anderer Marke (Teil mit Marke): nicht passend');
  s = c.suchen({ marke: 'Karcher', modell: 'WV2' });
  assert.strictEqual(ids(s.passend), 'ET-0002');
})();

/* ---------- Befund 6: umbenannte oder fehlende Spalte → Fehler statt still übergangen ---------- */
(function () {
  let tabs = H.basisTabs(); tabs.Teile[0][6] = 'Anzahl';
  tabs.Teile.push(H.teil('ET-0001', 'Philips', 'HD7462', 'Kaffeemaschine', 'Tank', 'B01', 3));
  let c = H.lade({ tabs: tabs });
  wirft(function () { c.einlagern({ teil: 'Akku', marke: 'Dyson', box: 'B02', menge: 5 }); }, /Spalte «Menge».*Kopfzeile wiederherstellen/, 'einlagern bei umbenannter Menge');
  wirft(function () { c.verbraucht('ET-0001'); }, /Spalte «Menge»/, 'verbraucht bei umbenannter Menge');
  assert.strictEqual(tabs.Teile.length, 2); assert.strictEqual(tabs.Teile[1][8], 'im Lager', 'nichts geschrieben');
  tabs = H.basisTabs(); tabs.Teile[0][0] = 'ET-Nr';
  c = H.lade({ tabs: tabs });
  wirft(function () { c.einlagern({ teil: 'Akku', marke: 'Dyson', box: 'B02' }); }, /Spalte «ID»/, 'ID umbenannt');
  tabs = H.basisTabs(); tabs.Teile[0] = tabs.Teile[0].slice(0, 15);           // Spalte «Kennung» fehlt noch: Hinweis auf Einrichten
  c = H.lade({ tabs: tabs });
  wirft(function () { c.einlagern({ teil: 'Akku', marke: 'Dyson', box: 'B02' }); }, /«Kennung».*Einrichten/, 'neue Spalte fehlt');
  tabs = H.basisTabs(); tabs.Teile = [['']];
  c = H.lade({ tabs: tabs });
  wirft(function () { c.einlagern({ teil: 'Tank', marke: 'X', box: 'B01' }); }, /fehlt die Spalte/, 'Tab ohne Kopfzeile');
  assert.deepStrictEqual(tabs.Teile, [['']]);
  tabs = H.basisTabs(); tabs.Ersatzteile[0][8] = 'Preis';
  c = H.lade({ tabs: tabs });
  wirft(function () { c.schreib_('Ersatzteile', [{ 'Zeit': 'x' }]); }, /Spalte «Preis CHF»/, 'schreib_ in jedem Tab');
  tabs = H.basisTabs(); tabs.Kosten[0][7] = 'Dollar';
  c = H.lade({ tabs: tabs });
  assert.ok(/KI-Kosten sind nicht lesbar/.test(c.startDaten().budgetHinweis), 'Kosten unlesbar: KI gesperrt mit Grund, Tool startet');
})();

/* ---------- Befund 7: Handänderungen (Menge als Text, Status gross, gelöschte letzte Zeile) ---------- */
(function () {
  let tabs = H.basisTabs();
  tabs.Teile.push(H.teil('ET-0001', 'Philips', 'HD7462', 'Kaffeemaschine', 'Tank', 'B01', '2 Stk'), H.teil('ET-0002', 'Philips', 'HD7462', 'Kaffeemaschine', 'Deckel', 'B01', 'zwei'));
  let c = H.lade({ tabs: tabs });
  const s = c.suchen({ text: 'philips tank' }).text;
  assert.strictEqual(s[0].menge, 2, 'Menge «2 Stk» = 2');
  assert.strictEqual(c.verbraucht('ET-0001').rest, 1); assert.strictEqual(tabs.Teile[1][6], 1); assert.strictEqual(tabs.Teile[1][8], 'im Lager');
  wirft(function () { c.verbraucht('ET-0002'); }, /Menge «zwei» bei ET-0002 ist nicht lesbar/, 'unlesbare Menge');
  assert.strictEqual(tabs.Teile[2][8], 'im Lager', 'Zeile mit unlesbarer Menge bleibt');
  /* Status von Hand «Im Lager » */
  tabs = H.basisTabs();
  tabs.Teile.push(H.teil('ET-0001', 'Philips', 'HD7462', 'Kaffeemaschine', 'Tank', 'B01', 1, ' Im Lager '));
  c = H.lade({ tabs: tabs });
  assert.strictEqual(c.suchen({ text: 'philips' }).text.length, 1); assert.strictEqual(c.startDaten().imLager, 1);
  assert.strictEqual(c.verbraucht('et 1').rest, 0, 'ID normalisiert verglichen'); assert.strictEqual(tabs.Teile[1][8], 'verbraucht');
  /* Box-Status von Hand «Voll» */
  tabs = H.basisTabs(); tabs.Boxen[1][2] = 'Voll ';
  c = H.lade({ tabs: tabs });
  assert.strictEqual(c.startDaten().boxen[0].status, 'voll');
  /* gelöschte letzte Zeile: Nummer wird nicht wiederverwendet (ET_MAX in den Script-Eigenschaften) */
  tabs = H.basisTabs(); const props = {};
  c = H.lade({ tabs: tabs, props: props });
  c.einlagern({ teil: 'Tank', marke: 'A', box: 'B01' }); c.einlagern({ teil: 'Tank', marke: 'B', box: 'B01' });
  assert.strictEqual(props.ET_MAX, '2');
  tabs.Teile.pop();
  assert.strictEqual(c.einlagern({ teil: 'Akku', marke: 'C', box: 'B01' }).id, 'ET-0003', 'ET-0002 nicht wiederverwendet');
  /* Tab höher als ET_MAX (von Hand eingetragen): der Tab zählt */
  tabs.Teile.push(H.teil('ET-0050', 'X', '', 'X', 'Tank', 'B01'));
  assert.strictEqual(c.einlagern({ teil: 'Akku', marke: 'C', box: 'B01' }).id, 'ET-0051');
})();

/* ---------- Befund 8: KI-Budget und Kosten ---------- */
(function () {
  const schild = '{"marke":"A","modell":"B","produktart":"C"}', bild = 'x'.repeat(200);
  const lauf = function (wert, verbraucht) {
    const tabs = H.basisTabs();
    if (wert === null) tabs.Einstellungen.splice(2, 1); else tabs.Einstellungen[2][1] = wert;
    tabs.Kosten.push(['24.10.2026 08:00:00', 'Typenschild', '', 'claude-haiku-5-5', 0, 0, 0, verbraucht]);
    let n = 0;
    const c = H.lade({ tabs: tabs, fetch: function () { n++; return H.antwort('claude-haiku-5-5', schild); } });
    let m = ''; try { c.typenschild(bild, 'image/jpeg'); } catch (e) { m = e.message; }
    return { m: m, n: n, sd: c.startDaten() };
  };
  ['30', '30 USD', '30.-', 'CHF 30', 'USD 30.00'].forEach(function (w) {
    const r = lauf(w, 999);
    assert.ok(/KI-Budget für diesen Monat ist aufgebraucht/.test(r.m) && r.n === 0, 'Budget «' + w + '» greift: ' + r.m);
  });
  let r = lauf("1'000", 999); assert.strictEqual(r.n, 1, "1'000 USD Budget, 999 verbraucht: läuft");
  r = lauf("1'000", 1000.5); assert.strictEqual(r.n, 0, "1'000 USD Budget, 1000.50 verbraucht: gesperrt");
  r = lauf('dreissig', 0);
  assert.ok(/KI-Budget in den Einstellungen \(«dreissig»\) ist keine Zahl/.test(r.m) && r.n === 0, r.m);
  assert.strictEqual(r.sd.budgetVoll, true); assert.ok(/keine Zahl/.test(r.sd.budgetHinweis));
  r = lauf('', 999); assert.strictEqual(r.n, 0, 'leer = Vorgabe 30 USD');
  r = lauf(null, 999); assert.strictEqual(r.n, 0, 'Zeile fehlt = Vorgabe 30 USD');
  r = lauf('0', 999); assert.strictEqual(r.n, 1, '0 = keine Bremse');
  /* unbekanntes Modell → höchster bekannter Preis und Log */
  let tabs = H.basisTabs(); tabs.Einstellungen.push(['KI-Modell Typenschild', 'claude-opus-5-5', '']);
  let c = H.lade({ tabs: tabs, fetch: function () { return H.antwort('claude-opus-5-5', schild); } });
  c.typenschild(bild, 'image/jpeg');
  assert.strictEqual(tabs.Kosten[1][7], 0.21, 'Sonnet-Preis angesetzt (100k Eingabe, 1k Ausgabe)');
  assert.strictEqual(c.monatsKosten_(), 0.21);
  assert.ok(tabs.Log.some(function (z) { return z[2] === 'Kosten' && /claude-opus-5-5.*keinen Preis/.test(z[4]); }), 'geschätzter Preis im Log');
  /* Zeitüberschreitung: Kostenzeile «unbekannt», Log «KI-Fehler», api() loggt nicht doppelt */
  tabs = H.basisTabs();
  c = H.lade({ tabs: tabs, fetch: function () { throw new Error('Timeout: https://api.anthropic.com/v1/messages'); } });
  wirft(function () { c.api('typenschild', [bild, 'image/jpeg']); }, /Timeout/, 'Zeitüberschreitung');
  assert.deepStrictEqual(tabs.Kosten.slice(1).map(function (z) { return [z[1], z[3], z[7]]; }), [['Typenschild', 'claude-haiku-5-5', 'unbekannt']]);
  assert.strictEqual(tabs.Log.filter(function (z) { return z[2] === 'KI-Fehler' && /Typenschild \(claude-haiku-5-5\): Timeout.*Kosten unbekannt/.test(z[4]); }).length, 1);
  assert.strictEqual(tabs.Log.filter(function (z) { return z[2] === 'Fehler'; }).length, 0, 'nicht doppelt geloggt');
})();

/* ---------- Befund 14: Fehler im Log; Shop-Runde scheitert → offen weitersuchen ---------- */
(function () {
  let tabs = H.basisTabs(), c = H.lade({ tabs: tabs });
  wirft(function () { c.api('einlagern', [{ teil: 'Tank', marke: 'X', box: 'B77' }]); }, /gibt es nicht/, 'Box fehlt');
  assert.ok(tabs.Log.some(function (z) { return z[2] === 'Fehler' && /^einlagern: Box «B77» gibt es nicht/.test(z[4]); }), 'Fehler über api() im Log');
  /* Sperre besetzt: verständliche Meldung, im Log */
  tabs = H.basisTabs(); c = H.lade({ tabs: tabs, sperreFehler: 1 });
  wirft(function () { c.api('einlagern', [{ teil: 'Tank', marke: 'X', box: 'B01' }]); }, /Gerade speichert jemand anderes.*nochmals versuchen/, 'Sperre besetzt');
  assert.ok(tabs.Log.some(function (z) { return z[2] === 'Fehler' && /Gerade speichert jemand anderes/.test(z[4]); }));
  assert.strictEqual(zeilen(tabs).length, 0);
  /* Log selbst nicht schreibbar: Konsole statt still */
  tabs = H.basisTabs(); tabs.Log[0][2] = 'Was'; c = H.lade({ tabs: tabs });
  c.log_('Test', '', 'x');
  assert.ok((c.__fehler || []).some(function (m) { return /Log nicht geschrieben \(Test/.test(m); }));
  /* unlesbare KI-Antwort beim Typenschild: eigene Logzeile */
  tabs = H.basisTabs();
  c = H.lade({ tabs: tabs, fetch: function () { return H.antwort('claude-haiku-5-5', 'Ich kann das Bild nicht sicher lesen, die Marke ist vermutlich {Bosch'); } });
  assert.deepStrictEqual(JSON.parse(JSON.stringify(c.typenschild('x'.repeat(200), 'image/jpeg'))), { marke: '', modell: '', produktart: '' });
  assert.ok(tabs.Log.some(function (z) { return z[2] === 'Typenschild-Fehler' && /KI-Antwort nicht lesbar: Ich kann/.test(z[4]); }));
  /* Online: Shop-Runde Claude 529 → offene Runde läuft trotzdem und liefert */
  tabs = H.basisTabs();
  let n = 0;
  const offen = '```json\n{"angebote":[{"teil":"Wassertank","teilenummer":"421944078","art":"Original","preis":"CHF 24.90","shop":"Galaxus","link":"https://www.galaxus.ch/x","lieferbar":"Ja"}],"suchbegriff":"421944078","hinweis":""}\n```';
  c = H.lade({ tabs: tabs, fetch: function () { n++; return n === 1 ? H.antwort('', '', '', null, 529) : H.antwort('claude-sonnet-5-5', offen); } });
  const o = c.api('onlineSuche', [{ marke: 'Philips', modell: 'HD7462', teil: 'Tank' }]);
  assert.strictEqual(n, 2); assert.strictEqual(o.gefunden, 1); assert.strictEqual(o.angebote[0].preis, 24.9);
  assert.ok(tabs.Log.some(function (z) { return z[2] === 'KI-Fehler' && /Ersatzteil Shops.*Claude 529/.test(z[4]); }), 'Shop-Runde im Log');
  assert.strictEqual(tabs.Ersatzteile.length, 2, 'Suche festgehalten');
  /* Online: beide Runden unlesbar → Meldung, Runden im Log, kein doppelter «Fehler» */
  tabs = H.basisTabs();
  c = H.lade({ tabs: tabs, fetch: function () { return H.antwort('claude-sonnet-5-5', 'kein JSON'); } });
  wirft(function () { c.api('onlineSuche', [{ marke: 'Philips', modell: 'HD7462', teil: 'Tank' }]); }, /Online-Suche hat nicht geklappt \(Antwort nicht lesbar\)/, 'unlesbar');
  assert.strictEqual(tabs.Log.filter(function (z) { return z[2] === 'Ersatzteil-Fehler' && /KI-Antwort nicht lesbar/.test(z[4]); }).length, 2);
  assert.strictEqual(tabs.Log.filter(function (z) { return z[2] === 'Fehler'; }).length, 0);
})();

/* ---------- Befund 15: volle Box, zahl_ ---------- */
(function () {
  const tabs = H.basisTabs(); tabs.Boxen[1][2] = 'voll';
  const c = H.lade({ tabs: tabs });
  wirft(function () { c.einlagern({ teil: 'Tank', marke: 'X', box: 'B01' }); }, /Box «B01» ist voll/, 'volle Box');
  assert.strictEqual(zeilen(tabs).length, 0);
  [['1.299', 1299], ['2x 12.90', 12.9], ['3 × 4.50', 4.5], ['12.90 x 2', 12.9], ['12.90-15.90', 12.9], ['CHF 1’299.00', 1299], ['ab 9.90', 9.9], ['Fr. 12.90', 12.9],
    ['1 299.00', 1299], ['0.299', 0.299], ['12.990', 12990], ['1,299.00', 1299], ["1'299.00", 1299], ['1.299,00', 1299], ['12,50', 12.5], ['CHF 12.-', 12], ['1,299', 1299],
    ['9.90', 9.9], ['', ''], ['dreissig', ''], [5, 5], ['2 Stk', 2], ['2x', 2], ['30 USD', 30], ['-5', -5]]
    .forEach(function (x) { assert.strictEqual(c.zahl_(x[0]), x[1], 'zahl_ ' + JSON.stringify(x[0]) + ' = ' + c.zahl_(x[0])); });
})();

/* ---------- Vertrag V2: Tab voll (alle Zeilen belegt) → Zeilen anfügen ---------- */
(function () {
  const tabs = H.basisTabs();
  for (let i = 1; i <= 9; i++) tabs.Teile.push(H.teil('ET-000' + i, 'X', '', 'X', 'Tank', 'B01'));
  const c = H.lade({ tabs: tabs, maxRows: { Teile: 10, Log: 1 } });
  assert.strictEqual(c.einlagern({ teil: 'Akku', marke: 'Y', box: 'B01' }).id, 'ET-0010');
  assert.strictEqual(c.__maxRows.Teile, 11); assert.strictEqual(tabs.Teile.length, 11);
  assert.ok(tabs.Log.length >= 2 && c.__maxRows.Log >= tabs.Log.length, 'Log ebenso');
})();

/* ---------- einrichten: fügt «Kennung» hinten an, einmal ---------- */
(function () {
  const tabs = H.basisTabs(); tabs.Teile[0] = tabs.Teile[0].slice(0, 15);
  tabs.Teile.push(H.teil('ET-0001', 'X', '', 'X', 'Tank', 'B01').slice(0, 15));
  const c = H.lade({ tabs: tabs });
  assert.ok(/Neue Spalte «Kennung» im Tab «Teile»/.test(c.einrichten()));
  assert.strictEqual(tabs.Teile[0][15], 'Kennung'); assert.strictEqual(tabs.Teile[0].length, 16);
  assert.ok(!/Neue Spalte/.test(c.einrichten()), 'zweites Einrichten fügt nichts mehr an'); assert.strictEqual(tabs.Teile[0].length, 16);
  assert.strictEqual(c.einlagern({ teil: 'Akku', marke: 'Y', box: 'B01', kennung: 'abcdefgh12' }).id, 'ET-0002');
  assert.ok(tabs.Einstellungen.some(function (z) { return z[0] === 'Version' && z[1] === '2026-10-24.2'; }));
})();

/* ---------- Vertrag V6: leere Admin-Liste = nur das Konto des Tools; «einrichten» nicht aus der Web-App ---------- */
(function () {
  let tabs = H.basisTabs();
  let c = H.lade({ tabs: tabs, email: 'mitarbeiterin@pretty-good.ch', besitzer: 'jonas@pretty-good.ch' });
  assert.strictEqual(c.startDaten().admin, false, 'leere Liste: Besucherin ist nicht Admin (vorher: alle)');
  wirft(function () { c.boxStatus('B01', 'aufgelöst'); }, /Nur Admins/, 'Box auflösen');
  assert.strictEqual(c.boxStatus('B01', 'voll').boxen[0].status, 'voll', '«voll» darf jede Person');
  wirft(function () { c.einrichten(); }, /läuft nur im Apps-Script-Editor/, 'einrichten über google.script.run');
  assert.ok(!tabs.Einstellungen.some(function (z) { return z[0] === 'Admins' && z[1]; }), 'niemand hat sich eingetragen');
  c = H.lade({ tabs: tabs, email: 'jonas@pretty-good.ch', besitzer: 'jonas@pretty-good.ch' });
  assert.strictEqual(c.startDaten().admin, true, 'leere Liste: das Konto des Tools ist Admin');
  c.einrichten();
  assert.ok(tabs.Einstellungen.some(function (z) { return z[0] === 'Admins' && z[1] === 'jonas@pretty-good.ch'; }), 'einrichten trägt Jonas ein');
  tabs.Einstellungen.forEach(function (z) { if (z[0] === 'Admins') z[1] = 'Lea@pretty-good.ch, jonas@pretty-good.ch'; });
  assert.strictEqual(H.lade({ tabs: tabs, email: 'lea@pretty-good.ch', besitzer: 'jonas@pretty-good.ch' }).startDaten().admin, true);
  assert.strictEqual(H.lade({ tabs: tabs, email: 'mitarbeiterin@pretty-good.ch', besitzer: 'jonas@pretty-good.ch' }).startDaten().admin, false);
})();

console.log('ok ersatzteil p2410 server');
