/* Ersatzteil Tool, Prüfung 24.10.2026 (Version 2026-10-24.2): Regressionstests Oberfläche für die Befunde 2, 3, 4, 9–12, 15 (Eingaben sichern).
   Mini-DOM aus t_ersatzteil_p2410_hilfe.js, google.script.run gestubbt, Antworten von Hand. Kein Browser. */
const assert = require('assert');
const H = require('./t_ersatzteil_p2410_hilfe');
const vonHand = function (u) {
  u.klick('einHand');
  u.$('f-marke').value = 'Philips'; u.$('f-modell').value = 'HD7462'; u.$('f-produktart').value = 'Kaffeemaschine'; u.$('f-teil').value = 'Tank';
  u.klick('zuBox');
};
const treffer = { passend: [], serie: [], marke: [], produktart: [], text: [
  { id: 'ET-0001', teil: 'Tank', marke: 'Philips', modell: 'HD7462', produktart: 'Kaffeemaschine', menge: 1, box: 'B01' },
  { id: 'ET-0002', teil: 'Deckel', marke: 'Philips', modell: 'HD7462', produktart: 'Kaffeemaschine', menge: 1, box: 'B01' }] };
const onlineAntwort = function (teil) { return { gefunden: 1, hinweis: '', suchbegriff: { text: teil }, shops: [], angebote: [{ teil: teil, nummer: '1', art: 'Original', preis: 9.9, shop: 'Galaxus', link: 'https://www.galaxus.ch/x', lieferbar: 'Ja' }] }; };

/* ---------- Befund 2: Abbrechen/Zurück während des Speicherns ---------- */
(function () {
  const u = H.neu();
  vonHand(u); u.klick('speichern');
  assert.strictEqual(u.$('speichern').disabled, true); assert.ok(/Wird gespeichert/.test(u.$('speichern').textContent));
  u.klick('start');                                                  // Abbrechen
  assert.ok(/Wird gespeichert\. Bitte warten/.test(u.text('meldung')), 'sichtbar gesperrt: ' + u.text('meldung'));
  u.klick('zuPruefen');                                              // Zurück
  assert.ok(u.$('speichern'), 'Seite «Box» bleibt stehen');
  u.antworte('einlagern', { id: 'ET-0042', box: 'B01', teil: 'Tank', imLager: 4 });
  assert.deepStrictEqual(u.fehler, [], 'kein Fehler im Handler');
  assert.strictEqual(u.$('titel').textContent, 'Gespeichert'); assert.strictEqual(u.$('kopf-etikett').textContent, 'ET-0042');
  assert.ok(!('et-offen' in u.speicher), 'nach der Antwort nichts mehr offen');
  u.klick('start');                                                  // danach wieder frei
  assert.ok(u.gibt('einFoto'));
})();

/* ---------- Befund 2/3: Neuladen während des Speicherns → beim Start mit derselben Kennung nachholen und melden ---------- */
(function () {
  const speicher = {};
  const a = H.neu(null, { speicher: speicher });
  vonHand(a); a.klick('speichern');
  const k = a.letzter('einlagern').args[0].kennung;
  assert.ok(/^[a-z0-9]{8,40}$/.test(k), 'Kennung: ' + k);
  assert.ok(JSON.parse(speicher['et-offen']).daten.kennung === k, 'Erfassung im Browser gemerkt');
  const b = H.neu(null, { speicher: speicher });                    // Seite neu geladen, erste Antwort geht verloren
  assert.strictEqual(b.anzahl('einlagern'), 1, 'Start schickt die offene Erfassung nochmals');
  assert.strictEqual(b.letzter('einlagern').args[0].kennung, k, 'mit derselben Kennung');
  assert.ok(/wird abgeschlossen/.test(b.text('meldung')));
  b.klick('einHand');
  assert.ok(/Bitte warten/.test(b.text('meldung')), 'Navigation gesperrt, bis es bestätigt ist');
  b.antworte('einlagern', { id: 'ET-0042', box: 'B01', teil: 'Tank', imLager: 4, wiederholt: true });
  assert.ok(/Tank liegt in Box B01 \(ET-0042\)/.test(b.text('meldung')), b.text('meldung'));
  assert.ok(!('et-offen' in speicher));
  const c = H.neu(null, { speicher: speicher });
  assert.strictEqual(c.anzahl('einlagern'), 0, 'danach nichts mehr nachzuholen');
  /* Netzfehler beim Nachholen: bleibt für den nächsten Start */
  speicher['et-offen'] = JSON.stringify({ daten: { teil: 'Akku', box: 'B02', kennung: 'abcdefgh99' }, zeit: Date.now() });
  const d = H.neu(null, { speicher: speicher });
  d.antworte('einlagern', 'NetworkError: Connection failure due to HTTP 0', true);
  assert.ok(/noch nicht bestätigt/.test(d.text('meldung')) && 'et-offen' in speicher);
  /* zu alt: nicht still nachholen, sondern melden */
  speicher['et-offen'] = JSON.stringify({ daten: { teil: 'Akku', box: 'B02', kennung: 'abcdefgh99' }, zeit: Date.now() - 13 * 3600 * 1000 });
  const e = H.neu(null, { speicher: speicher });
  assert.strictEqual(e.anzahl('einlagern'), 0); assert.ok(/Unklar, ob die Erfassung «Akku, Box B02»/.test(e.text('meldung')));
})();

/* ---------- Befund 3: Netzfehler, zweiter Klick = gleiche Kennung; Inhalt geändert = neue Kennung; volle Box ---------- */
(function () {
  const u = H.neu();
  vonHand(u); u.klick('speichern');
  const k1 = u.letzter('einlagern').args[0].kennung;
  u.antworte('einlagern', 'NetworkError: Connection failure due to HTTP 0', true);
  assert.ok(/nicht doppelt erfasst/.test(u.text('meldung')), u.text('meldung'));
  assert.strictEqual(u.$('speichern').disabled, false);
  u.klick('speichern');
  assert.strictEqual(u.anzahl('einlagern'), 2); assert.strictEqual(u.letzter('einlagern').args[0].kennung, k1, 'Wiederholung mit derselben Kennung');
  u.antworte('einlagern', 'Box «B01» ist voll. Bitte eine andere Box wählen oder eine neue anlegen.', true);
  assert.ok(/ist voll/.test(u.text('meldung')));
  assert.strictEqual(u.$('speichern').disabled, true, 'volle Box abgewählt');
  assert.ok(!u.gibt('box', 'B01') || u.$('main').innerHTML.indexOf('<span class="voll">voll</span>') > -1, 'B01 als voll angezeigt');
  u.klick('box', 'B02'); u.klick('speichern');
  assert.notStrictEqual(u.letzter('einlagern').args[0].kennung, k1, 'andere Box = anderer Inhalt = neue Kennung');
  assert.strictEqual(u.letzter('einlagern').args[0].box, 'B02');
})();

/* ---------- Befund 4: zwei verschiedene Teile «Genommen» gehen beide hinaus; dasselbe Teil zweimal: sichtbar «Bitte warten» ---------- */
(function () {
  const u = H.neu();
  u.klick('suchHand'); u.$('s-text').value = 'philips'; u.taste('s-text');
  u.antworte('suchen', treffer);
  u.klick('weg', 'ET-0001'); u.klick('weg', 'ET-0002');
  assert.deepStrictEqual(u.aufrufe.filter(function (a) { return a.name === 'verbraucht'; }).map(function (a) { return a.args[0]; }), ['ET-0001', 'ET-0002']);
  u.klick('weg', 'ET-0001');
  assert.strictEqual(u.anzahl('verbraucht'), 2); assert.ok(/ET-0001 wird gerade gebucht/.test(u.text('meldung')));
  const k1 = u.aufrufe.filter(function (a) { return a.name === 'verbraucht'; })[0].args[1];
  assert.ok(/^[a-z0-9]{8,40}$/.test(k1), 'Kennung pro Entnahme');
  u.antworte('verbraucht', 'NetworkError: Connection failure due to HTTP 0', true);
  assert.ok(/nicht doppelt abgezogen/.test(u.text('meldung')));
  u.klick('weg', 'ET-0001');
  assert.strictEqual(u.letzter('verbraucht').args[1], k1, 'Wiederholung nach Netzfehler: gleiche Kennung');
  u.antworte('verbraucht', { id: 'ET-0002', rest: 0 });
  assert.ok(/ET-0002 ist raus/.test(u.text('meldung')));
  u.antworte('verbraucht', { id: 'ET-0001', rest: 0, wiederholt: true }, false, 'letzter');
  u.klick('weg', 'ET-0001');
  assert.notStrictEqual(u.letzter('verbraucht').args[1], k1, 'nach Erfolg neue Kennung');
  assert.deepStrictEqual(u.fehler, []);
})();

/* ---------- Befund 9: Online-Antwort der vorherigen Suche wird verworfen; zweiter Klick sichtbar ---------- */
(function () {
  const u = H.neu();
  u.klick('suchHand'); u.$('s-text').value = 'Philips HD7462'; u.$('s-teil').value = 'Wassertank'; u.klick('online');
  u.taste('s-teil');                                                 // nochmals (Enter), solange sie läuft
  assert.strictEqual(u.anzahl('onlineSuche'), 1); assert.ok(/läuft schon/.test(u.text('online')));
  u.klick('start'); u.klick('suchHand'); u.$('s-text').value = 'Dyson V8'; u.$('s-teil').value = 'Akku'; u.klick('online');
  assert.strictEqual(u.anzahl('onlineSuche'), 2, 'neue Suche geht hinaus');
  u.antworte('onlineSuche', onlineAntwort('Wassertank Philips HD7462'));   // Antwort der ersten Suche kommt zuerst
  assert.ok(/KI sucht/.test(u.text('online')) && !/Wassertank/.test(u.text('online')), 'alte Antwort verworfen: ' + u.text('online'));
  u.antworte('onlineSuche', onlineAntwort('Akku Dyson V8'));
  assert.ok(/Akku Dyson V8/.test(u.text('online')));
  assert.strictEqual(u.$('online-knopf').disabled, false);
})();

/* ---------- Befund 10: Typenschild im Suchfeld korrigiert → Online-Suche mit der Korrektur ---------- */
(function () {
  const u = H.neu();
  u.klick('suchFoto'); u.foto();
  u.antworte('typenschild', { marke: 'Philips', modell: 'HD7462/2O', produktart: 'Kaffeemaschine' });
  u.antworte('suchen', { passend: [], serie: [], marke: [], produktart: [], text: [] });
  u.$('s-text').value = 'Philips HD7462/20'; u.$('s-teil').value = 'Tank'; u.klick('online');
  const a = u.letzter('onlineSuche').args[0];
  assert.deepStrictEqual([a.marke, a.modell, a.produktart], ['Philips', 'HD7462/20', 'Kaffeemaschine']);
  /* unverändert → Werte vom Typenschild */
  const v = H.neu();
  v.klick('suchFoto'); v.foto();
  v.antworte('typenschild', { marke: 'De Longhi', modell: 'ECAM 22.110', produktart: 'Kaffeemaschine' });
  v.$('s-teil').value = 'Tank'; v.klick('online');
  assert.deepStrictEqual([v.letzter('onlineSuche').args[0].marke, v.letzter('onlineSuche').args[0].modell], ['De Longhi', 'ECAM 22.110']);
})();

/* ---------- Befund 11: getippte Menge bleibt beim Wechsel der Box ---------- */
(function () {
  const u = H.neu();
  vonHand(u); u.$('f-menge').value = '5'; u.klick('box', 'B02');
  assert.strictEqual(u.$('f-menge').value, '5');
  u.klick('zuPruefen'); u.klick('zuBox'); u.klick('speichern');
  assert.strictEqual(u.letzter('einlagern').args[0].menge, 5);
})();

/* ---------- Befund 12: nach «Online suchen» mit Freitext bleibt die Lagersuche Freitext ---------- */
(function () {
  const u = H.neu();
  u.klick('suchHand'); u.$('s-text').value = 'Wassertank Philips'; u.klick('suchen');
  u.antworte('suchen', { passend: [], serie: [], marke: [], produktart: [], text: [{ id: 'ET-0003', teil: 'Wassertank', marke: 'Philips', modell: 'HD7462', produktart: 'K', menge: 2, box: 'B01' }] });
  u.$('s-teil').value = 'Dichtung'; u.klick('online');
  assert.deepStrictEqual([u.letzter('onlineSuche').args[0].marke, u.letzter('onlineSuche').args[0].modell], ['Wassertank', 'Philips'], 'Aufteilung nur für den Aufruf');
  u.antworte('onlineSuche', { gefunden: 0, hinweis: '', suchbegriff: { text: '' }, shops: [], angebote: [] });
  u.klick('weg', 'ET-0003'); u.antworte('verbraucht', { id: 'ET-0003', rest: 1 });
  assert.deepStrictEqual(JSON.parse(JSON.stringify(u.letzter('suchen').args[0])), { text: 'Wassertank Philips' });
  assert.ok(/eine Einheit genommen, 1 bleiben/.test(u.text('meldung')));
  u.antworte('suchen', { passend: [], serie: [], marke: [], produktart: [], text: [] });
  assert.ok(/1 bleiben/.test(u.text('meldung')), 'Meldung bleibt nach der automatischen Lagersuche stehen');
})();

/* ---------- Befund 15: Eingaben während des Typenschild-Lesens bleiben; Fehlermeldung bleibt; Antwort nach Abbrechen verworfen ---------- */
(function () {
  let u = H.neu();
  u.klick('einFoto'); u.foto();
  u.$('f-teil').value = 'Wassertank';
  u.antworte('typenschild', { marke: 'Philips', modell: 'HD7462', produktart: 'Kaffeemaschine' });
  assert.strictEqual(u.$('f-teil').value, 'Wassertank'); assert.strictEqual(u.$('f-modell').value, 'HD7462');
  /* «Neues Foto» auf der Seite Prüfen behält das Teil */
  u.klick('einFoto'); u.foto();
  assert.strictEqual(u.$('f-teil').value, 'Wassertank');
  u.antworte('typenschild', { marke: '', modell: 'HD7462/20', produktart: '' });
  assert.deepStrictEqual([u.$('f-marke').value, u.$('f-modell').value, u.$('f-teil').value], ['Philips', 'HD7462/20', 'Wassertank']);
  /* Suche: Teil getippt während des Lesens */
  u = H.neu();
  u.klick('suchFoto'); u.foto(); u.$('s-teil').value = 'Akku';
  u.antworte('typenschild', { marke: 'Dyson', modell: 'V8', produktart: 'Staubsauger' });
  assert.strictEqual(u.$('s-teil').value, 'Akku'); assert.strictEqual(u.$('s-text').value, 'Dyson V8');
  /* Fehler beim Lesen: Meldung bleibt stehen, Budget gesperrt merkt sich die Oberfläche */
  u = H.neu();
  u.klick('einFoto'); u.foto();
  u.antworte('typenschild', 'Das KI-Budget für diesen Monat ist aufgebraucht. Bis Monatsende geht nur die Handeingabe.', true);
  assert.ok(/KI-Budget/.test(u.text('meldung')), u.text('meldung'));
  u.klick('einFoto');
  assert.ok(/KI-Budget/.test(u.text('meldung')) && u.anzahl('typenschild') === 1);
  /* Antwort kommt nach Abbrechen: bleibt auf der Startseite */
  u = H.neu();
  u.klick('einFoto'); u.foto(); u.klick('start');
  u.antworte('typenschild', { marke: 'Philips', modell: 'HD7462', produktart: 'Kaffeemaschine' });
  assert.ok(u.gibt('suchHand') && !u.$('f-teil'), 'Startseite bleibt');
  /* zweites Foto, solange das erste gelesen wird: sichtbar */
  u = H.neu();
  u.klick('einFoto'); u.foto(); u.klick('einFoto'); u.foto();
  assert.strictEqual(u.anzahl('typenschild'), 1); assert.ok(/vorherige Foto wird noch gelesen/.test(u.text('meldung')));
  /* Budget-Hinweis vom Start (z.B. unlesbares Budget) */
  const s = JSON.parse(JSON.stringify(H.START)); s.budgetVoll = true; s.budgetHinweis = 'Das KI-Budget in den Einstellungen («dreissig») ist keine Zahl.';
  u = H.neu(s); u.klick('einFoto');
  assert.ok(/«dreissig»/.test(u.text('meldung')));
  assert.deepStrictEqual(u.fehler, []);
})();

console.log('ok ersatzteil p2410 ui');
