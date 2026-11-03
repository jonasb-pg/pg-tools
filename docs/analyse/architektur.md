# Architektur

Stand: Version `2026-10-24.2` (Prüfung 24.10.2026, siehe `pruefung-2026-10-24.md`; im Repo, noch nicht eingespielt). Live zuletzt: Bereitstellungsversion 15 vom 21.10.2026, 15:09. Bereitstellen macht Claude nach Bestätigung von Jonas.

## Komponenten

| Komponente | Typ | ID / Adresse | Rolle |
|---|---|---|---|
| Analyse Tool (Code) | Apps Script, an Sheet gebunden | Script `1UahLr-Ek_4QzRuGzyk4YhuZf1WrslrvJDlls-Eee5iFHiuQZORuiYLqN` (neu seit 16.10.2026) | Server (`Code.gs`) und Oberfläche (`Index.html`) |
| Web-App Test | Apps Script `/dev` | `https://script.google.com/a/macros/pretty-good.ch/s/AKfycbybqqJDajrNMiPKEQ4j64tzzWb8gUHOrdVrR1-UIvc/dev` | immer der gespeicherte Stand (HEAD), nur für Bearbeiter:innen des Scripts |
| Web-App Live | Apps Script Bereitstellung | Bereitstellungsversion 9 | Analyseplatz; neue Version nur nach Bestätigung von Jonas (Claude stellt bereit) |
| ANALYSE TOOL | Google Sheet | `1jhmq1JoyM6Xor33pM77AmOixbvqKuGzfFX-js9PdIrM` | Datenbank des Tools (siehe `datenmodell.md`) |
| Return Tool | Google Sheet | `1FpHJNeWZENdhgP6MqAYyOOEe1FN0tIZWOkRiYItOz2E` | **nur lesen**. Tab «Analyse» plus Lagerort «Analyse» in allen Kanal-Tabs = Quelle der Warteschlange. Kanal-Tab = Name beginnt nicht mit «Archiv», Kopfzeile (erste 12 Zeilen) mit «ID» und «Bezeichnung» (Vertrag V4, `rtKanalTabs_`) |
| HANDBÜCHER | Google Sheet | `1GqaJ3mFsVuwJmXVPBo0k-t78Rn5qsEf9ZKMHHR-9IYc` | gelesene Handbücher, 1 Zeile pro Modell; bleibt bei Ersatz des Tools |
| HANDBÜCHER PDF | Drive-Ordner | `1JUaSaYQpkt3HZn2ByjR4LpFJcwsoFOMJ` | PDFs «Marke Modell.pdf» |
| RICARDO FOTOS | Drive-Ordner (in 00_Claude-Eingang) | `1DimLxvk4jqFf3gpbre1kKm5oE84_7TD4` | 1 Unterordner pro PG-ID; Beschreibung = JSON `{typenschild, mangel}` |
| Matchmaker Sheet | Google Sheet + eigenes Apps Script | `1xxlT767Eqc7Y0OREu4fVM-LYWyJ2tSbfz52z0SS8L1w` | Suchaufträge; Analyse Tool liest Tabs «Matchmaker» und «Erledigt» (Spalten über den Anfang des Kopfs), schreibt nur Spalte «Aus Analyse» im Tab «Matchmaker» |
| RICARDO TOOL | Google Sheet | `1liRzxIAKCSKGS5-uN3FkFcboN_Luqd2Ar5Ae57cSmvg` | bestehendes Ricardo-Tool; wird später zur Maske, die Tab «Ricardo» liest |
| Claude API | extern | `https://api.anthropic.com/v1` (`/messages`, `/messages/batches`) | Recherche, Handbuch, Ersatzteile, Ricardo-Text, Matchmaker |
| Icecat | extern | `https://live.icecat.biz/api?UserName=…&Language=de&GTIN=…` | Specs, Lieferumfang, Handbuch-Link per EAN |

## Datenflüsse

```text
Return Tool (Tab Analyse + Lagerort «Analyse» in allen Kanal-Tabs) --[abgleichen, alle 10 Min (nachts jeder dritte), nur lesen]--> Produkte (Analyse-Status Offen | Entfällt)
  ein AN hält höchstens ein PG-Stück zurück (Admin-Liste); nicht lesbarer Tab / fehlende Pflichtspalte / Zeile ohne Bezeichnung: nichts fällt heraus, Log + Admin
Produkte (Offen, Recherche Offen) --[Batch API, Guthaben > 0]--> Recherche (+ Icecat) --> Recherche-Status Bereit
Produkte (Bereit) --[Handbuch-Suche, Guthaben > 0]--> HANDBÜCHER + HANDBÜCHER PDF
Analyseplatz: Scan --> starteAnalyse --> ueberblick_ (Recherche + Handbuch + Stufen + Sicherheitspunkte + Testmittel)
  Schritte: ident > handbuch > hygiene > sicher > voll > sperre > funktion > reset > zustand > entscheid (je nach Produktart)
  nach ident: matchmaker() im Hintergrund --> Matchmaker Sheet lesen --> Claude
  Defekt: sofort reparieren | später (reparaturPause --> Bestellliste, Regal Reparatur) | nicht reusable
  Entscheid: Treffer «passt» --> nur Regal Matchmaker
             sonst Ricardo (Fotos per QR/Handy --> RICARDO FOTOS, ricardoText --> Claude) | Regal Analysiert
  abschliessen (Lauf-ID, Namen der Schritte d.bezug) --> bezugPruefen_ (passt der Überblick? sonst { ueberblickNeu } zurück, nichts geschrieben)
    --> Analysen (mit Lauf-ID), Ricardo, Matchmaker, Prüfschritte, Testmittel-Log, zuletzt Produkte.Analyse-Status = Erledigt, Vermerk im Matchmaker Sheet
    gleicher Lauf nochmals: fehlende Teile nachholen bzw. { schon }; anderer Lauf auf erledigtem Stück: { konflikt } (Browser legt die Analyse unter «Pausiert»)
Wiedereinstieg: Scan PG-ID mit Regal Matchmaker --> matchmakerZurueck --> Entscheid --> Analysen-Zeile nachführen
Matchmaker Sheet Tab «Erledigt» (Spalte «Aus Analyse») --[abgleichen: mmGeholt_]--> ANALYSE TOOL Tab «Matchmaker» Status Offen -> Geholt (zurück in der Liste: Geholt -> Offen)
Infrastruktur (alle mit Kürzel): werkstatt --> Testkonten + Testmittel; kontoSpeichern --> Testkonten, kontenAbgleich_ --> Testmittel «Testkonto Google/Apple-ID/Amazon» = Ja/Nein; mittelSpeichern --> Testmittel
```

## Auslöser (Trigger)

| Funktion | Takt | Angelegt von |
|---|---|---|
| `abgleichen` | alle 10 Minuten (`TAKT_MINUTEN`); 22–06 Uhr läuft nur jeder dritte Lauf, ausser Handbuch-Guthaben > 0 (`nachtPause_`) | `einrichten()` (nur Admins) löscht die eigenen Trigger und legt genau diesen an. Auslöser anderer Konten sieht es nicht: `kontoMerken_` merkt, unter welchem Konto jeder Lauf lief, und meldet mehrere Konten (Log, Admin, Rückmeldung von «einrichten») |

## Sperren und Nebenläufigkeit

| Mechanismus | Wo | Zweck |
|---|---|---|
| `LockService.getScriptLock()` über `gesperrt_()` | jedes Schreiben ins Sheet | keine gleichzeitigen Schreibvorgänge; max. 30 s warten |
| Script-Property `ABGLEICH_BIS` über `allein_()` | `abgleichen` | nur ein Abgleich gleichzeitig; gilt 6 Min |
| `SpreadsheetApp.flush()` vor `releaseLock` | `gesperrt_` | Vertrag V1: der nächste Lauf liest nach dem Freigeben sicher den neuen Stand |
| Lauf-ID (`laufZeile_`, Spalte «Lauf-ID») | `abschliessen` | ein Lauf wird nur einmal geschrieben (Wiederholung holt nur Fehlendes nach); ein anderer Lauf auf einem erledigten Stück ergibt `{ konflikt }` |
| eine Sperre pro Produkt | `abholen_` | eine kaputte Antwort hält nicht den ganzen Batch auf; Kosten einmal pro Batch-ID |
| Zeilen in der Sperre frisch prüfen | `starten_`, `mmNachRicardo_`, `mmGeholt_`, `mmVermerk_` | Zeilennummern von vor der Sperre und Status, die ein anderes Tool ändert (Ricardo), werden vor dem Schreiben geprüft |
| `OFFEN[name]` in `ruf()` (Browser) | Oberfläche | kein Doppelklick-Doppelaufruf |

## Zustand im Browser

| Schlüssel (localStorage) | Inhalt |
|---|---|
| `at-lauf` | laufende Analyse `AN` als JSON, mit Lauf-ID und Tab-Kennung. Seit 24.10.2026 nie mehr wegen einer anderen `VERSION` verworfen (der Server prüft die Namen der Schritte). Gehört sie einem anderen offenen Tab, übernimmt ein neues Tab sie nicht; überschreibt ein Tab sie, kommt die andere zuerst unter «Pausiert» |
| `at-pausiert` | pausierte Analysen (pro Kürzel, Lauf-ID) |
| `at-speichern` | Warteschlange «Speichert im Hintergrund»; vor jedem Schreiben frisch gelesen und zusammengeführt (Schlüssel Lauf-ID) |
| `at-tab` | Puls des offenen Tabs (alle 3 s): ein zweites Tab bekommt eine Warnung |
| `at-start` | Startdaten des letzten Besuchs (gleiche Version) |
| `at-kuerzel`, `at-kuerzel-tag` | Kürzel der Person, gilt einen Tag |
| `at-lang` | `de` oder `en` |

## Script-Eigenschaften (Betrieb)

| Schlüssel | Inhalt |
|---|---|
| `ABGLEICH_BIS` | Sperre «ein Abgleich gleichzeitig» (`allein_`) |
| `ABGLEICH_ZULETZT` | letzter Abgleich, bei dem das Spiegeln geklappt hat (N7) |
| `ABGLEICH_FEHLER` | `{zeit, text}` des gescheiterten Spiegelns, Startseite und Admin |
| `ABGLEICH_INFO` | Meldungen des letzten Spiegelns: zurückgehaltene Stücke, wieder im Tab Analyse, nicht lesbare Tabs, Zeilen ohne Bezeichnung, gelesene Kanal-Tabs (Admin) |
| `ABGLEICH_DAUER` | Laufzeit des letzten Abgleichs mit den Schritten |
| `ABGLEICH_KONTEN` | Konto → letzter Lauf (Auslöser mehrerer Konten erkennen) |
| `NACHT_ZAEHLER` | Zähler für «nachts jeder dritte Lauf» |
| `RT_KANAL_BEKANNT` | zuletzt erkannte Kanal-Tabs des Return Tools (ein Tab mit kaputter Kopfzeile bleibt «nicht lesbar» statt zu verschwinden) |
| `REPARATUR_<PG-ID>` | nur noch gelesen: Stand von Stücken, die vor dem 24.10.2026 ins Regal «Reparatur» kamen (neu: Spalte «Reparatur-Stand» in «Produkte») |

## Externe Bibliotheken (Browser)

| Bibliothek | Version | Quelle | Zweck |
|---|---|---|---|
| pdf.js | 4.10.38 (`pdf.min.mjs`, dynamischer Import) | cdnjs | Handbuch-Ansicht mit Suche |
| qrcode-generator | 1.4.4 | cdnjs | QR-Code für die Foto-Seite |

## Oberfläche: Ansichten

| Ansicht | Inhalt |
|---|---|
| Analysieren (`scan`) | Suche/Scan, Stück ohne Inventar, Ergebnis der letzten Analyse, Liste «Im Regal Reparatur» |
| Warteschlange (`liste`) | offene Stücke, Recherche-Status, Knopf «Aktualisieren» |
| Ersatzteile (`teile`) | Ersatzteil-Suche, letzte Suchen |
| Admin (`admin`) | nur für «Admins»: Auswertung, Batches, Verbindungstest |
| Foto-Seite (`?foto=PG-ID`) | Handy: Fotos aufnehmen und hochladen |
| Overlays | Handbuch-Ansicht (`#hb-ansicht`), Feedback (`#fb`) |

## Dienste im Apps-Script-Projekt

| Dienst | Kennzeichnung | Wozu |
|---|---|---|
| Google Sheets API v4 | `Sheets` | mehrere Tabs in einem Aufruf lesen (apiWerte_, vorladen_). Fehlt der Dienst, liest das Tool wie bisher über SpreadsheetApp. Eingeschaltet am 17.10.2026. |

## Feedback-Runde 29.10.2026

| Thema | Umsetzung |
|---|---|
| Ablauf ohne Recherche | `starteAnalyse(id, true)` → `ueberblick_(p, e, true)`: Ablauf `ident, voll, funktion, zustand, entscheid`, Ersatzfunktion «Alle Teile sind unbeschädigt und benutzbar», Lieferumfang als Freitext. Das Flag `ohne` reist mit (`daten()`, `preisSetzen`, `pruefen`, `abschliessen`, `ricardoText`, gespeicherter Stand) und bestimmt den Überblick auf dem Server. Cache-Schlüssel mit `:ohne` |
| Befund frei bearbeitbar | `d.befundText` (Entscheid, Textfeld `#befund-text`) ersetzt in `urteil_` den Befund (`befund`), nicht das Protokoll. «Text vom Tool wiederherstellen» löscht ihn |
| Abgelesenes Modell | `rechercheJetzt(id, modell)`: kein Icecat, `params_` nennt Listing und EAN nur als Hinweis, `modellAbgelesen_` setzt das Modell in die Antwort |
| Fotos | Pflicht nur Hauptbild (`fotoFehlt_`), Empfehlungen `fotoEmpfohlen_`; Grossansicht `#foto-gross` (Overlay auf Body-Ebene) |
| Uhr | `visibilitychange`: verdeckt → `AN.seit = null`, `AN.autoPause = true`; sichtbar → weiter, ausser von Hand pausiert |
| Preis am Schluss | `abschliessen` gibt `preis` zurück (Startpreis Ricardo, Preis Matchmaker, sonst VP); der Browser zeigt ihn sofort aus den eigenen Daten |
| Übernahme abgelehnt | `uebernehmen`: Meldung mit allen Tabs, in denen die ID steht, Log «Übernahme abgelehnt» |
| Wiedereinstieg | `ohne` steht im Matchmaker-Stand (`abschliessen`) und im Reparatur-Stand (`repPause`); `matchmakerZurueck`/`reparaturWeiter` holen damit den kurzen Ablauf. `preisAus()` liefert den Preis auch nach dem Wiedereinstieg; bei `schon` behält der Browser den gezeigten Preis |


## 2026-11-03.1 (Version 19, live 03.11.2026 16:40, Rückfall 18)
Feedback FG 02.11.: Schon analysierte Stücke zeigen beim Scannen «PG-… ist bereits analysiert» mit Datum, Kürzel, Analyse-Nr. und Ergebnis (Regal oder «nicht reusable»), Link «Retoure? Neu analysieren». Liegt kein anderes übernehmbares Stück im Return Tool, kein «übernehmen» mehr. Server: `fertigInfo_` in `suche`. Tests: t_analyse_fertig_0311.js, t_analyse_fertig_0311_ui.py.
