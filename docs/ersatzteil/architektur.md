# Ersatzteil Tool

Stand: Version `2026-10-24.2` (Code, noch nicht eingespielt; live: `2026-10-24.1` als Bereitstellung Version 2 vom 24.10.2026). Umsetzung der Prüfung vom 24.10.2026: `docs/ersatzteil/pruefung-2026-10-24.md`. Code: `apps/ersatzteil/Code.gs`, `apps/ersatzteil/Index.html`, dazu `apps/basis/Basis.gs` als Datei «Basis». Sheet: «ERSATZTEIL TOOL» (ID `1RII8qKWcrcSOESBbfiP-AQg7rDDu4zLy8xXLKM8ycZE`, Ordner 00_Claude-Eingang). Mockups: Canvas «Ersatzteil-Tool Mockups». Apps-Script-Projekt `1CYsmUXWDLFAfj6tmKg_AAGH1l34kXKFXfkQjzRgIM2F8st8kngsby-3C`, Bereitstellung Version 1 (19.10.2026 14:03), Adressen im Sheet «TOOL LINKS» (siehe `docs/gemeinsam/betrieb.md`).

## Zweck

Internes Ersatzteillager. Nur modellspezifische Teile (Netzteile, Tanks, Fernbedienungen, Akkus, Platinen) werden erfasst; Kabel und Schrauben liegen in Sortierkästen ohne Eintrag. Teile werden nicht verkauft.

## Entscheide

| Frage | Entscheid |
|---|---|
| Gerät | Handy am Platz, verschiedene Handys. Web-App im Browser, Kamera über das Dateifeld mit `capture="environment"`. Das Foto wird im Browser auf «Foto-Breite Pixel» verkleinert (JPEG 85%) und nirgends gespeichert. |
| Zugang | Web-App «Ausführen als Jonas», Zugriff «Jeder in pretty-good.ch». Bearbeiter = Google-Adresse der Person, kein Kürzel. |
| Online-Suche | Die Ersatzteil-Suche des Analyse Tools, kopiert: gleiche `Ersatzteil-Anweisung`, gleiche `Ersatzteil-Shops` (RS Online, Galaxus, fixpart mit Domain; ASWO nur Link), gleiches `TEIL_FORMAT`, zuerst nur in den Shops, sonst offen. Ohne Verkaufspreis, darum ohne «lohnt sich». |
| Master für Teile | Dieses Sheet. Das Analyse Tool liest künftig den Tab «Teile» und die Einstellungen «Ersatzteil-Shops» und «Ersatzteil-Anweisung» von hier (noch nicht umgebaut). |
| KI | Haiku 5.5 liest das Typenschild, Sonnet 5.5 sucht online. Monatsbudget USD 30 in den Einstellungen (leer = 30, 0 = keine Bremse, unlesbar = KI gesperrt mit Meldung); ist es voll, geht nur noch Handeingabe. Unbekanntes Modell: höchster bekannter Preis. |
| ID | `ET-####`, fortlaufend, vergeben unter dem Script-Lock: Maximum aus Tab und Script-Eigenschaft `ET_MAX` (eine gelöschte letzte Zeile gibt ihre Nummer nicht frei). Boxen `B##`. Ab ET-10000 bzw. B100 einfach eine Stelle mehr (nie abgeschnitten). |
| Menge | Eine Zeile darf Menge > 1 haben (gleiche Teile). «Genommen» zieht eine Einheit ab, bei 0 wird die Zeile «verbraucht». Menge von Hand als Text («2 Stk») wird gelesen; unlesbar = Fehler statt ganze Zeile weg. |
| Wiederholung | Die Oberfläche schickt pro Erfassung und pro Entnahme eine Kennung. Der Server prüft sie in der Sperre gegen die Spalte «Kennung» (Tab «Teile», letzte 10 pro Zeile) und gibt bei Wiederholung das erste Ergebnis zurück. Spalte statt Script-Cache: dauerhaft, kein Ablauf. |
| Speichern | Solange «einlagern» läuft, ist die Navigation gesperrt. Die Erfassung steht bis zur Antwort im Browser («et-offen»); nach einem Neuladen schickt der Start sie mit derselben Kennung nochmals und meldet die ET-Nummer (bis 12 Stunden, danach Meldung «unklar»). |
| Sperre | `gesperrt_` schreibt vor dem Freigeben ins Sheet (`SpreadsheetApp.flush()`, Vertrag V1); Zeitüberschreitung = «Gerade speichert jemand anderes». `schreib_` fügt Zeilen an, wenn der Tab voll ist (V2). |
| Admin | «Admins» in den Einstellungen. Leer = nur das Konto des Tools (Vertrag V6). `einrichten` läuft nur im Editor oder über das Menü, nicht aus der Web-App. |

## Ablauf

| Seite | Schritte |
|---|---|
| Start | Teil einlagern (Foto oder Hand), Teil suchen (Foto oder tippen) |
| Prüfen | Marke, Modell, Produktart (vom Typenschild vorausgefüllt), Teil (Pillen mit Teilarten), Woher |
| Box | Liste der Boxen: passende offene Box zuoberst und vorgewählt, volle Boxen gesperrt, «Neue Box anlegen» mit der Produktart des Teils; Menge 1/2/3/mehr; «In B12 speichern» |
| Suche | Treffer in Gruppen: Passend (Marke und Modell; Marke ohne Leer-/Sonderzeichen verglichen, Modell gleich oder Präfix ab 5 Zeichen; passt ein Modell ab 5 Zeichen bei anderer oder fehlender Marke, oder genau bei fehlender Marke: trotzdem passend mit Hinweis «Marke prüfen»), Gleiche Serie (Marke und erste vier Zeichen des Modells), Gleiche Marke, Gleiche Produktart; Freitext: jedes Wort über alle Felder (ohne Akzente), zusätzlich gegen die Marke ohne Sonderzeichen und gegen das Modell mit Präfix-Regel («HD7462/20» findet HD7462). «Genommen» pro Zeile (gesperrt pro Teil). Darunter «Welches Teil?» und «Online suchen» mit Angeboten, Shop-Knöpfen (ASWO App schwarz) und Suchbegriff; Marke/Modell aus dem Suchfeld, wenn es von Hand geändert ist; Antworten einer früheren Suche werden verworfen. |

## API (`api(name, args)`)

| Funktion | Eingabe | Ausgabe |
|---|---|---|
| `startDaten` | | version, ich, admin, fotoBreite, schluessel, budgetVoll, budgetHinweis (Grund, warum die KI gesperrt ist, sonst leer), imLager, boxen, produktarten, teilarten, quellen |
| `typenschild` | Base64-JPEG, MIME | { marke, modell, produktart }, leer wo nicht lesbar |
| `einlagern` | { marke, modell, produktart, teil, teilart, menge, box, quelle, bemerkung, kennung } | { id, box, teil, wiederholt, imLager }; volle oder aufgelöste Box abgelehnt (ausser Wiederholung) |
| `suchen` | { marke, modell, produktart } oder { text } | { passend, serie, marke, produktart, text } |
| `verbraucht` | id, kennung | { id, rest, wiederholt } |
| `boxNeu` | produktart, ort | { box, boxen } |
| `boxStatus` | box, status | { boxen }; «voll» alle, «offen» und «aufgelöst» nur Admins, auflösen nur leer |
| `onlineSuche` | { marke, modell, produktart, teil } | { gefunden, hinweis, suchbegriff, shops, angebote } |

## Tabs

Teile (seit `2026-10-24.2` mit Spalte «Kennung» am Schluss), Boxen, Ersatzteile (Log der Online-Suchen), Log, Kosten, Listen (Produktart, Teilart, Quelle; eine Kopfzeile), Einstellungen. `einrichten` fügt fehlende neue Spalten an (`NEUE_SPALTEN`), prüft die Spalten (`SPALTEN`), ergänzt fehlende Einstellungen (`NEUE_EINSTELLUNGEN`), setzt die Auswahllisten für Status und ruft `basisEinrichten_` mit `ERSATZTEIL_KATALOG`. `schreib_` verlangt jede Spalte aus `SPALTEN`, `lies_` ebenso für Teile, Boxen und Kosten (umbenannte Spalte = Meldung statt still falsch). Status «im Lager» und Box-Status werden getrimmt und klein verglichen.

## Datenintegrität (24.10.2026)

| Punkt | Regel |
|---|---|
| Verbraucht | Lesen der Zeile, Prüfen und Rechnen der Restmenge in der Sperre: zwei gleichzeitige «Genommen» ziehen zwei Einheiten ab. |
| Marke | `markeKern_`: klein, ohne Akzente, ohne Leer- und Sonderzeichen («De'Longhi» = «Delonghi»). |
| Modell | Präfix-Treffer erst ab `MODELL_MIN` = 5 Zeichen («HD» passt nicht mehr auf alle HD-Geräte). Treffer bei Markenabweichung: Feld `hinweis` im Treffer, die Oberfläche zeigt es. |
| Zahlen | `zahl_`: das hintere Trennzeichen trennt die Rappen («1,299.00» = 1299, «1.299,00» = 1299, «12,50» = 12.5, «12.-» = 12); ein einzelnes Trennzeichen mit genau drei Ziffern ist ein Tausender («1.299» = 1299); «2x 12.90» = 12.90, «12.90-15.90» = 12.90, «CHF 30»/«30 USD» = 30. |
| Kosten | Lässt sich die Kostenzeile nicht schreiben, steht «Kosten-Fehler» im Log (und in der Konsole); das Budget wäre sonst zu tief. Bricht der Abruf ab (Zeitüberschreitung), Kostenzeile mit USD «unbekannt» und Log «KI-Fehler». |
| Fehler | Jeder Fehler, den die Oberfläche sieht, steht im Log («Fehler», ausser schon genauer geloggt). Unlesbare KI-Antwort: eigene Logzeile. Fehler in der Shop-Runde der Online-Suche: offene Runde läuft trotzdem. |

## Tests

`tests/t_ersatzteil_daten.js` (Datenintegrität oben), `tests/t_ersatzteil_daten_ui.py` (Hinweis «Marke prüfen»), `tests/t_ersatzteil.js` (Server mit Stubs: Suche, ID, Einlagern, Verbraucht, Boxen, Shops, Katalog), `tests/t_ersatzteil_ui.py` (Playwright 390 px: Start, Prüfen, Box, Speichern, Suche, Online; kein horizontaler Überlauf). Prüfung 24.10.2026: `tests/t_ersatzteil_p2410_server.js` und `tests/t_ersatzteil_p2410_ui.js` (mit der Testhilfe `tests/t_ersatzteil_p2410_hilfe.js`: Mock-Sheets mit Schreibpuffer, Mini-DOM), `tests/t_ersatzteil_p2410_ui.py` (Chromium: Speichern sperrt die Navigation, Neuladen holt nach).

## Offen

- Version `2026-10-24.2` einspielen: zuerst «einrichten» (fügt die Spalte «Kennung» an), dann neu bereitstellen. Details: `docs/ersatzteil/pruefung-2026-10-24.md`.
- Test mit fünf echten Teilen am Handy (eingespielt, Schlüssel gesetzt, `einrichten` gelaufen, Version 1 bereitgestellt am 19.10.2026).
- Analyse Tool: Seite «Ersatzteile» liest zuerst den Tab «Teile» dieses Sheets, Shop-Liste und Anweisung von hier.
- Boxen und Listen im Sheet mit den echten Werten füllen.
