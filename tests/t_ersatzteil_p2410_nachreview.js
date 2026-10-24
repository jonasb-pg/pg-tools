/* Ersatzteil Tool, Nach-Review 24.10.2026 (Version 2026-10-24.2, noch nicht eingespielt): Regressionstest Oberfläche.
   N4  Netzfehler beim Speichern: die Erfassung bleibt im Browser («et-offen»), wie in nachholen(). Neuladen holt sie mit derselben Kennung nach
       (kein Doppel, falls der Server schon gespeichert hat). Andere Fehler (z.B. Box voll): nichts bleibt offen.
   Mini-DOM aus t_ersatzteil_p2410_hilfe.js, google.script.run gestubbt. Lauf: node tests/t_ersatzteil_p2410_nachreview.js
   Gegenprobe: ET_HTML=<Pfad zu einem anderen Index.html> node tests/t_ersatzteil_p2410_nachreview.js */
const assert = require('assert');
const H = require('./t_ersatzteil_p2410_hilfe');
const vonHand = function (u) {
  u.klick('einHand');
  u.$('f-marke').value = 'Philips'; u.$('f-modell').value = 'HD7462'; u.$('f-produktart').value = 'Kaffeemaschine'; u.$('f-teil').value = 'Tank';
  u.klick('zuBox');
};
let fehler = 0;
function test(name, f) { try { f(); console.log('ok', name); } catch (e) { fehler++; console.log('FEHLER', name, '\n   ', e.message); } }

test('N4 Netzfehler beim Speichern: «et-offen» bleibt, Neuladen holt mit derselben Kennung nach', () => {
  const speicher = {};
  const u = H.neu(null, { speicher: speicher });
  vonHand(u); u.klick('speichern');
  const k = u.letzter('einlagern').args[0].kennung;
  u.antworte('einlagern', 'NetworkError: Connection failure due to HTTP 0', true);
  assert.ok(/nicht doppelt erfasst/.test(u.text('meldung')), u.text('meldung'));
  assert.ok('et-offen' in speicher && JSON.parse(speicher['et-offen']).daten.kennung === k, 'Erfassung bleibt im Browser');
  assert.strictEqual(u.$('speichern').disabled, false, 'nochmals Speichern möglich');
  const b = H.neu(null, { speicher: speicher });                    // Seite neu geladen statt nochmals «Speichern»
  assert.strictEqual(b.anzahl('einlagern'), 1, 'Start holt die Erfassung nach');
  assert.strictEqual(b.letzter('einlagern').args[0].kennung, k, 'mit derselben Kennung');
  b.antworte('einlagern', { id: 'ET-0042', box: 'B01', teil: 'Tank', imLager: 4, wiederholt: true });
  assert.ok(/Tank liegt in Box B01 \(ET-0042\)/.test(b.text('meldung')) && !('et-offen' in speicher), b.text('meldung'));
});
test('N4 nochmals «Speichern» nach dem Netzfehler: gleiche Kennung, danach nichts mehr offen', () => {
  const speicher = {};
  const u = H.neu(null, { speicher: speicher });
  vonHand(u); u.klick('speichern');
  const k = u.letzter('einlagern').args[0].kennung;
  u.antworte('einlagern', 'NetworkError: Connection failure due to HTTP 0', true);
  u.klick('speichern');
  assert.strictEqual(u.letzter('einlagern').args[0].kennung, k);
  u.antworte('einlagern', { id: 'ET-0042', box: 'B01', teil: 'Tank', imLager: 4, wiederholt: true });
  assert.ok(!('et-offen' in speicher) && u.$('titel').textContent === 'Gespeichert');
});
test('N4 anderer Fehler (Box voll): nichts bleibt offen, kein Nachholen', () => {
  const speicher = {};
  const u = H.neu(null, { speicher: speicher });
  vonHand(u); u.klick('speichern');
  u.antworte('einlagern', 'Box «B01» ist voll. Bitte eine andere Box wählen oder eine neue anlegen.', true);
  assert.ok(!('et-offen' in speicher), 'nicht offen');
  assert.strictEqual(H.neu(null, { speicher: speicher }).anzahl('einlagern'), 0, 'kein Nachholen');
});

console.log(fehler ? fehler + ' Fehler' : 'ok ersatzteil p2410 nachreview');
process.exit(fehler ? 1 : 0);
