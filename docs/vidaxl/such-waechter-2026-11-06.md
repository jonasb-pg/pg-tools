# vidaXL Erfassung – Such-Wächter (06.11.2026)

Das Apps-Script-Projekt «vidaXL Erfassung» (gebunden an «vidaXL Retouren DB», Projekt-ID 1vQIIMU2iIUqQ2Z3NUT8_xTO-ZL6mgbp_U74kS2G_LX3FjLAa0pxkSY6n) liegt nicht als Code im Repo. Diese Datei hält fest, was am 06.11.2026 geändert wurde.

## Befund (Jonas B.: «nach der SKU-Eingabe bleibt das Tool hängen», Simon, Smartphone)
- Ausführungen 06.11. 09:13–09:35: rund 30 Suchen, 7 Mal danach neu geladen. Der Server hatte jedes Mal geantwortet (3.7–7.3 s, «abgeschlossen»), neu geladen wurde 7–16 s danach. Beispiel: dieselbe SKU dreimal gesucht, zweimal gehangen, Server fand das Produkt jedes Mal.
- Ursache: Die App wartete ohne Zeitgrenze auf google.script.run. Geht die Antwort auf dem Handy verloren (Ruhezustand, Netzwechsel), bleibt die Anzeige stehen.
- Zusätzlich: Enter startete während einer laufenden Suche eine zweite (je zwei Suchen in derselben Sekunde); vidaxl.ch antwortete einzeln erst nach 22 s bzw. 72 s, danach folgte noch die zweite Abfrage (Suchseite).

## Änderung (gespeichert 06.11.2026 ~09:58, im Editor; live erst mit neuer Bereitstellung)
- Index.html: `submitSku` ersetzt durch Suche mit Wächter (`SUCHE`, `sucheStarten`, `sucheZeitum`, `suchEnde`, `appLog`, Listener `visibilitychange`). 20 s ohne Antwort → einmal automatisch neu, danach «Keine Antwort vom Server. Bitte nochmals versuchen.» Gleiche SKU während laufender Suche wird ignoriert, Antworten älterer Suchen verworfen. Rückkehr aus dem Hintergrund startet eine hängende Suche neu.
- Code.gs: neue Funktion `clientLog(art, details)` → Tab Events, Aktion «App: …» (mit Gerät). In `lookupProduct` keine zweite Abfrage (Suchseite), wenn die Vorschlagssuche schon ≥ 10 s gebraucht hat.
- `VERSION` bleibt '1.2.1' (keine Schema-Änderung; ein Versionswechsel liesse setup() bei Live und /dev im Wechsel immer wieder laufen).
- Prüfsummen (Länge, djb2): vorher Code 50903 / 788728050, Index 45791 / 1006675081.
- Tests: 26 Prüfungen mit Attrappen (normal, doppelt, verlorene Antwort → Wiederholung, zweimal keine Antwort → Meldung, späte Antworten, andere SKU, Rückkehr aus Hintergrund, Serverfehler, Text). /dev: Enter dreifach → eine Suche; zwei SKUs gefunden.
- Rückfall: Bereitstellung Version 7.

## Neuer Client-Code (Index.html, ersetzt `function submitSku`)
```js
/* Suche mit Wächter (Jonas B. 06.11.2026: auf dem Smartphone blieb die App nach der SKU-Eingabe zufällig hängen, obwohl der Server nach wenigen Sekunden geantwortet hatte).
   Kommt nach 20 s keine Antwort, sucht die App einmal von selbst neu, danach Meldung mit «Nochmals versuchen» statt Neuladen.
   Dieselbe Suche zweimal (Enter doppelt, Enter und Knopf) wird ignoriert; Antworten einer älteren Suche werden verworfen.
   Kommt die App aus dem Hintergrund zurück (Bildschirm war aus), wird eine hängende Suche sofort neu gestartet. Jeder Fall steht im Tab Events («App: …»). */
const SUCHE = { nr: 0, id: 0, laeuft: false, v: '', start: 0, versuch: 0, timer: null };
const SUCHE_WARTEN_MS = 20000;
function submitSku() {
  const v = $('skuInput').value.trim();
  if (!v) { $('skuInput').focus(); return; }
  if (SUCHE.laeuft && SUCHE.v === v) return;
  hideSaveBanner();
  item = newItem(); item.raw = v; candidates = [];
  clearResult();
  /* Jonas B. 29.10.2026: keine Suche nach Namen. Text im SKU-Feld geht direkt als Bezeichnung in die Handeingabe. */
  if (!/^\d/.test(v)) { SUCHE.id = ++SUCHE.nr; suchEnde(); item.code = { raw: v, type: 'text', ean: '', sku: '' }; gotoManual(v); return; }
  SUCHE.v = v; SUCHE.versuch = 0; SUCHE.id = ++SUCHE.nr;
  sucheStarten();
}
function sucheStarten() {
  const id = SUCHE.id, v = SUCHE.v, versuch = ++SUCHE.versuch;
  SUCHE.laeuft = true; SUCHE.start = Date.now();
  setSearching(true);
  clearTimeout(SUCHE.timer);
  SUCHE.timer = setTimeout(() => sucheZeitum(id, versuch), SUCHE_WARTEN_MS);
  call('lookupProduct', v).then((r) => {
    if (id !== SUCHE.id || !SUCHE.laeuft) return;                   // ältere Suche oder schon beantwortet: verwerfen
    if (SUCHE.versuch > 1) appLog('Antwort nach Wiederholung', v + ' | Versuch ' + SUCHE.versuch + ' | ' + (Date.now() - SUCHE.start) + ' ms');
    suchEnde();
    if (!r) throw new Error('leere Antwort vom Server');
    item.code = r.code; item.previous = r.previous || []; item.mm = r.matchmaker || [];
    if (r.warnung) toast(r.warnung, 4000);
    if (r.found && r.product) { applyProduct(r.product); renderProduct(); return; }
    if (r.candidates && r.candidates.length) { renderCandidates(r.candidates); return; }
    if (r.code && r.code.type === 'ean') { renderNotFound(r.code); return; }
    gotoManual();                                                    // nicht gefunden: direkt Name und Preis eintragen (Jonas B. 29.10.2026)
  }).catch((e) => {
    if (id !== SUCHE.id || !SUCHE.laeuft) return;
    suchEnde();
    appLog('Suchfehler', v + ' | ' + (e && e.message));
    renderError('Suche fehlgeschlagen: ' + (e && e.message));
  });
}
function sucheZeitum(id, versuch) {
  if (id !== SUCHE.id || !SUCHE.laeuft || versuch !== SUCHE.versuch) return;
  appLog('Keine Antwort', SUCHE.v + ' | Versuch ' + SUCHE.versuch + ' | ' + (SUCHE_WARTEN_MS / 1000) + ' s | ' + (document.hidden ? 'Hintergrund' : 'sichtbar'));
  if (SUCHE.versuch < 2) { sucheStarten(); return; }
  SUCHE.id = ++SUCHE.nr; suchEnde();
  renderError('Keine Antwort vom Server. Bitte nochmals versuchen.');
}
function suchEnde() { SUCHE.laeuft = false; clearTimeout(SUCHE.timer); setSearching(false); }
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && SUCHE.laeuft && Date.now() - SUCHE.start > 3000) { appLog('Neu nach Rückkehr', SUCHE.v); sucheStarten(); }
});
function appLog(art, details) {
  try { call('clientLog', art, String(details || '') + ' | ' + String(navigator.userAgent || '').slice(0, 120)).catch(() => {}); } catch (e) { /* Protokoll darf nie stören */ }
}
```
