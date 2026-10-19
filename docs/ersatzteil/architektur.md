# Ersatzteil Tool

Stand: Version `2026-10-17.1`. Code: `apps/ersatzteil/Code.gs`, `apps/ersatzteil/Index.html`, dazu `apps/basis/Basis.gs` als Datei «Basis». Sheet: «ERSATZTEIL TOOL» (ID `1RII8qKWcrcSOESBbfiP-AQg7rDDu4zLy8xXLKM8ycZE`, Ordner 00_Claude-Eingang). Mockups: Canvas «Ersatzteil-Tool Mockups». Apps-Script-Projekt `1CYsmUXWDLFAfj6tmKg_AAGH1l34kXKFXfkQjzRgIM2F8st8kngsby-3C`, Bereitstellung Version 1 (19.10.2026 14:03), Adressen im Sheet «TOOL LINKS» (siehe `docs/gemeinsam/betrieb.md`).

## Zweck

Internes Ersatzteillager. Nur modellspezifische Teile (Netzteile, Tanks, Fernbedienungen, Akkus, Platinen) werden erfasst; Kabel und Schrauben liegen in Sortierkästen ohne Eintrag. Teile werden nicht verkauft.

## Entscheide

| Frage | Entscheid |
|---|---|
| Gerät | Handy am Platz, verschiedene Handys. Web-App im Browser, Kamera über das Dateifeld mit `capture="environment"`. Das Foto wird im Browser auf «Foto-Breite Pixel» verkleinert (JPEG 85%) und nirgends gespeichert. |
| Zugang | Web-App «Ausführen als Jonas», Zugriff «Jeder in pretty-good.ch». Bearbeiter = Google-Adresse der Person, kein Kürzel. |
| Online-Suche | Die Ersatzteil-Suche des Analyse Tools, kopiert: gleiche `Ersatzteil-Anweisung`, gleiche `Ersatzteil-Shops` (RS Online, Galaxus, fixpart mit Domain; ASWO nur Link), gleiches `TEIL_FORMAT`, zuerst nur in den Shops, sonst offen. Ohne Verkaufspreis, darum ohne «lohnt sich». |
| Master für Teile | Dieses Sheet. Das Analyse Tool liest künftig den Tab «Teile» und die Einstellungen «Ersatzteil-Shops» und «Ersatzteil-Anweisung» von hier (noch nicht umgebaut). |
| KI | Haiku 5.5 liest das Typenschild, Sonnet 5.5 sucht online. Monatsbudget USD 30 in den Einstellungen; ist es voll, geht nur noch Handeingabe. |
| ID | `ET-####`, fortlaufend, vergeben unter dem Script-Lock. Boxen `B##`. |
| Menge | Eine Zeile darf Menge > 1 haben (gleiche Teile). «Genommen» zieht eine Einheit ab, bei 0 wird die Zeile «verbraucht». |

## Ablauf

| Seite | Schritte |
|---|---|
| Start | Teil einlagern (Foto oder Hand), Teil suchen (Foto oder tippen) |
| Prüfen | Marke, Modell, Produktart (vom Typenschild vorausgefüllt), Teil (Pillen mit Teilarten), Woher |
| Box | Liste der Boxen: passende offene Box zuoberst und vorgewählt, volle Boxen gesperrt, «Neue Box anlegen» mit der Produktart des Teils; Menge 1/2/3/mehr; «In B12 speichern» |
| Suche | Treffer in Gruppen: Passend (Marke und Modell), Gleiche Serie (Marke und erste vier Zeichen des Modells), Gleiche Marke, Gleiche Produktart; Freitext sucht jedes Wort über alle Felder. «Genommen» pro Zeile. Darunter «Welches Teil?» und «Online suchen» mit Angeboten, Shop-Knöpfen (ASWO App schwarz) und Suchbegriff. |

## API (`api(name, args)`)

| Funktion | Eingabe | Ausgabe |
|---|---|---|
| `startDaten` | | version, ich, admin, fotoBreite, schluessel, budgetVoll, imLager, boxen, produktarten, teilarten, quellen |
| `typenschild` | Base64-JPEG, MIME | { marke, modell, produktart }, leer wo nicht lesbar |
| `einlagern` | { marke, modell, produktart, teil, teilart, menge, box, quelle, bemerkung } | { id, box, imLager } |
| `suchen` | { marke, modell, produktart } oder { text } | { passend, serie, marke, produktart, text } |
| `verbraucht` | id | { id, rest } |
| `boxNeu` | produktart, ort | { box, boxen } |
| `boxStatus` | box, status | { boxen }; «voll» alle, «offen» und «aufgelöst» nur Admins, auflösen nur leer |
| `onlineSuche` | { marke, modell, produktart, teil } | { gefunden, hinweis, suchbegriff, shops, angebote } |

## Tabs

Teile, Boxen, Ersatzteile (Log der Online-Suchen), Log, Kosten, Listen (Produktart, Teilart, Quelle; eine Kopfzeile), Einstellungen. `einrichten` prüft die Spalten (`SPALTEN`), ergänzt fehlende Einstellungen (`NEUE_EINSTELLUNGEN`), setzt die Auswahllisten für Status und ruft `basisEinrichten_` mit `ERSATZTEIL_KATALOG`.

## Tests

`tests/t_ersatzteil.js` (Server mit Stubs: Suche, ID, Einlagern, Verbraucht, Boxen, Shops, Katalog), `tests/t_ersatzteil_ui.py` (Playwright 390 px: Start, Prüfen, Box, Speichern, Suche, Online; kein horizontaler Überlauf).

## Offen

- Test mit fünf echten Teilen am Handy (eingespielt, Schlüssel gesetzt, `einrichten` gelaufen, Version 1 bereitgestellt am 19.10.2026).
- Analyse Tool: Seite «Ersatzteile» liest zuerst den Tab «Teile» dieses Sheets, Shop-Liste und Anweisung von hier.
- Boxen und Listen im Sheet mit den echten Werten füllen.
