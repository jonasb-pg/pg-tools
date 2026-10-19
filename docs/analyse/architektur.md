# Architektur

Stand: Version `2026-10-19.4` (Weg A). Live: Bereitstellungsversion 12 vom 19.10.2026, 19:58. Bereitstellen macht Claude nach Bestätigung von Jonas.

## Komponenten

| Komponente | Typ | ID / Adresse | Rolle |
|---|---|---|---|
| Analyse Tool (Code) | Apps Script, an Sheet gebunden | Script `1UahLr-Ek_4QzRuGzyk4YhuZf1WrslrvJDlls-Eee5iFHiuQZORuiYLqN` (neu seit 16.10.2026) | Server (`Code.gs`) und Oberfläche (`Index.html`) |
| Web-App Test | Apps Script `/dev` | `https://script.google.com/a/macros/pretty-good.ch/s/AKfycbybqqJDajrNMiPKEQ4j64tzzWb8gUHOrdVrR1-UIvc/dev` | immer der gespeicherte Stand (HEAD), nur für Bearbeiter:innen des Scripts |
| Web-App Live | Apps Script Bereitstellung | Bereitstellungsversion 9 | Analyseplatz; neue Version nur nach Bestätigung von Jonas (Claude stellt bereit) |
| ANALYSE TOOL | Google Sheet | `1jhmq1JoyM6Xor33pM77AmOixbvqKuGzfFX-js9PdIrM` | Datenbank des Tools (siehe `datenmodell.md`) |
| Return Tool | Google Sheet | `1FpHJNeWZENdhgP6MqAYyOOEe1FN0tIZWOkRiYItOz2E` | **nur lesen**. Tab «Analyse» = Quelle der Warteschlange |
| HANDBÜCHER | Google Sheet | `1GqaJ3mFsVuwJmXVPBo0k-t78Rn5qsEf9ZKMHHR-9IYc` | gelesene Handbücher, 1 Zeile pro Modell; bleibt bei Ersatz des Tools |
| HANDBÜCHER PDF | Drive-Ordner | `1JUaSaYQpkt3HZn2ByjR4LpFJcwsoFOMJ` | PDFs «Marke Modell.pdf» |
| RICARDO FOTOS | Drive-Ordner (in 00_Claude-Eingang) | `1DimLxvk4jqFf3gpbre1kKm5oE84_7TD4` | 1 Unterordner pro PG-ID; Beschreibung = JSON `{typenschild, mangel}` |
| Matchmaker Sheet | Google Sheet + eigenes Apps Script | `1xxlT767Eqc7Y0OREu4fVM-LYWyJ2tSbfz52z0SS8L1w` | Suchaufträge; Analyse Tool liest Tab «Matchmaker», schreibt nur Spalte «Aus Analyse» |
| RICARDO TOOL | Google Sheet | `1liRzxIAKCSKGS5-uN3FkFcboN_Luqd2Ar5Ae57cSmvg` | bestehendes Ricardo-Tool; wird später zur Maske, die Tab «Ricardo» liest |
| Claude API | extern | `https://api.anthropic.com/v1` (`/messages`, `/messages/batches`) | Recherche, Handbuch, Ersatzteile, Ricardo-Text, Matchmaker |
| Icecat | extern | `https://live.icecat.biz/api?UserName=…&Language=de&GTIN=…` | Specs, Lieferumfang, Handbuch-Link per EAN |

## Datenflüsse

```text
Return Tool (Tab Analyse) --[abgleichen, alle 10 Min, nur lesen]--> Produkte (Analyse-Status Offen | Entfällt)
Produkte (Offen, Recherche Offen) --[Batch API, Guthaben > 0]--> Recherche (+ Icecat) --> Recherche-Status Bereit
Produkte (Bereit) --[Handbuch-Suche, Guthaben > 0]--> HANDBÜCHER + HANDBÜCHER PDF
Analyseplatz: Scan --> starteAnalyse --> ueberblick_ (Recherche + Handbuch + Stufen + Sicherheitspunkte + Testmittel)
  Schritte: ident > handbuch > hygiene > sicher > voll > sperre > funktion > reset > zustand > entscheid (je nach Produktart)
  nach ident: matchmaker() im Hintergrund --> Matchmaker Sheet lesen --> Claude
  Defekt: sofort reparieren | später (reparaturPause --> Bestellliste, Regal Reparatur) | nicht reusable
  Entscheid: Treffer «passt» --> nur Regal Matchmaker
             sonst Ricardo (Fotos per QR/Handy --> RICARDO FOTOS, ricardoText --> Claude) | Regal Analysiert
  abschliessen --> Analysen, Prüfschritte, Testmittel-Log, Ricardo, Produkte.Analyse-Status = Erledigt, Vermerk im Matchmaker Sheet
Wiedereinstieg: Scan PG-ID mit Regal Matchmaker --> matchmakerZurueck --> Entscheid --> Analysen-Zeile nachführen
Infrastruktur (alle mit Kürzel): werkstatt --> Testkonten + Testmittel; kontoSpeichern --> Testkonten, kontenAbgleich_ --> Testmittel «Testkonto Google/Apple-ID/Amazon» = Ja/Nein; mittelSpeichern --> Testmittel
```

## Auslöser (Trigger)

| Funktion | Takt | Angelegt von |
|---|---|---|
| `abgleichen` | alle 10 Minuten (`TAKT_MINUTEN`) | `einrichten()` löscht alle Trigger und legt genau diesen an |

## Sperren und Nebenläufigkeit

| Mechanismus | Wo | Zweck |
|---|---|---|
| `LockService.getScriptLock()` über `gesperrt_()` | jedes Schreiben ins Sheet | keine gleichzeitigen Schreibvorgänge; max. 30 s warten |
| Script-Property `ABGLEICH_BIS` über `allein_()` | `abgleichen` | nur ein Abgleich gleichzeitig; gilt 6 Min |
| `nurEinmal` in `abschliessen` | Abschluss | ein Stück wird nur einmal abgeschlossen (ausser Wiedereinstieg Matchmaker) |
| `OFFEN[name]` in `ruf()` (Browser) | Oberfläche | kein Doppelklick-Doppelaufruf |

## Zustand im Browser

| Schlüssel (localStorage) | Inhalt |
|---|---|
| `at-lauf` | laufende Analyse `AN` als JSON (wird verworfen, wenn `VERSION` nicht passt) |
| `at-kuerzel` | Kürzel der Person |
| `at-lang` | `de` oder `en` |

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
