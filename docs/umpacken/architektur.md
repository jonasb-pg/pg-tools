# Umpack Tool · Architektur

Stand: Version `2026-10-24.1` (Code, noch nicht eingespielt; nach dem Einspielen «einrichten» ausführen, ergänzt die Spalte «Prüfung» im Tab «Änderungen»). Live: Bereitstellung Version 4 (21.10.2026 20:34). Oberfläche schlank: keine Erklärtexte, kurze Meldungen (Wunsch Jonas). Link in TOOL LINKS. Code im Apps-Script-Projekt «Umpack Tool» (eigenständig, Konto jonas.b@pretty-good.ch, Projekt-ID 1VHq2IFZC4W6GRdvOPIYIKFHvrnL7CzlkPABe7_0xg4rOHGBt5hrcqisg). Datenbank: Sheet «(21/10/2026) UMPACK TOOL» (DB_ID im Code). Web-App: «Ausführen als Jonas», Zugriff «Jeder in Pretty Good»: Wer scannt, braucht keine eigenen Freigaben (Simon). Abnehmer-Listen sind für Pretty Good mit Link lesbar.

## Zweck
Paletten neu triagieren (Entscheid Jonas 21.10.2026): Stücke aus bestehenden Paletten herausnehmen und in neue Gebinde packen. Alle Entscheide im Tool, das Return Tool wird erst beim Abschluss nachgeführt.

## Ablauf eines Durchgangs
1. **Setup**: Name, Quelle (Lagerorte aus dem Return Tool lesen oder Liste von Hand einfügen), Ziel-Gebinde.
   Gebinde-Arten: Verkauf an Abnehmer (Liste pro Abnehmer, gilt als verkauft), neue Palette im Lager (nur Lagerort neu), Entsorgung (Preis 0).
   Preisregel pro Gebinde: VP, % vom VP, 0 (gratis); pro Stück überschreibbar. Vorschlag für die nächste freie Palette pro Kürzel (z.B. KID-13).
2. **Scan**: Gebinde wählen, PG-ID oder Barcode scannen. Der Browser entscheidet sofort (✅, ⚠️ schon zugeordnet / verschieben, ❌ nicht in der Quelle), gespeichert wird im Hintergrund (Warteschlange, auch über ein Neuladen). Der Server prüft mit «vorher» auf Konflikte zwischen mehreren Scannern.
3. **Abschluss**: Kontrolle, pro Abnehmer ein eigenes Sheet im Ordner «00_Claude-Eingang», Änderungsliste (Tab «Änderungen») fürs Return Tool. Manuell eintragen und «erledigt» anhaken. Automatische Übertragung gesperrt, bis Jonas M. einverstanden ist und der Verkaufsablauf des Return Tools nachgebaut ist.

## Datenbank (eigenes Sheet)
Durchgänge · Gebinde · Bestand (Kopie der Quelle beim Setup) · Zuordnung (Verlauf, letzte Zeile pro Stück gilt) · Änderungen · Log · Einstellungen.

## Regeln
- Das Return Tool wird nur gelesen (Setup). Kein Schreibzugriff im Code.
- Neue Lagerorte dürfen keine Quell-Lagerorte sein; zwei Gebinde nie mit gleichem Lagerort; doppelte IDs in der Quelle brechen das Setup ab.
- Nicht gescannte Stücke bleiben, wo sie sind (keine Änderung).

Tests: tests/t_umpacken.js (Server), tests/t_umpacken_ui.py (Oberfläche), tests/t_umpacken_daten.js und tests/t_umpacken_daten_ui.py (Datenintegrität).

## Datenintegrität (24.10.2026, nach Audit)
| Punkt | Regel |
|---|---|
| Belegte Lagerorte | `rtLesen_` liest alle Tabs des Return Tools mit Spalte «Lagerort» (auch Scanner ohne ID, Analyse, alle «Archiv …»). Dazu die «Lagerort neu» offener Durchgänge: Status nicht abgeschlossen, oder abgeschlossen mit Änderungen ohne «Erledigt». Vergleich gross, ohne Leerzeichen (`ortKey_`). |
| Neuer Lagerort | Kommt er irgendwo vor, lehnt das Setup ab (auch «Gebinde ändern»), mit Ort und Tab in der Meldung. Gilt auch für Abnehmer-Lagerorte (BALU-1 ist nach dem Verkauf im Archiv belegt: nächste Liste BALU-2). Ähnliche Schreibweise (KIDS-8 / KID-8, KID-08 / KID-8) nur als Hinweis. |
| Nächste Palette | Höchste Nummer pro Präfix über alle belegten Orte + 1, überspringt ähnliche Schreibweisen. Stand Momentaufnahme 24.10.: HOM-46, KID-15 (vorher HOM-4 bzw. KID-13, beide belegt). |
| Quell-Tabs | Fehlt ein Quell-Tab oder hat er keine Kopfzeile mit «ID» und «Lagerort», zeigt das Setup ihn an (nicht mehr still). Einstellung enthält «Spenden», das es im Return Tool nicht gibt. |
| Offene Durchgänge | Ein Stück darf nur in einem offenen Durchgang sein (in der Sperre geprüft). Auch Stücke mit noch nicht eingetragener Änderung eines abgeschlossenen Durchgangs sperren das Setup. |
| Return Tool nicht lesbar | Setup, «Gebinde ändern» und Abschluss brechen ab (auch bei einer Liste von Hand, weil die Lagerorte sonst ungeprüft wären). |
| Barcode-Scan | Der Browser schickt den Code (`code`, angezeigtes Stück als `wunsch`). Der Server wählt in der Sperre ein freies Stück dieser EAN aus der Quelle. Freie Stücke mit verschiedenem VP: PG-ID scannen. Barcodes ohne führende Nullen verglichen (UPC-A / EAN-13). |
| Doppelscan | `vorher: ''` auf ein schon zugeordnetes Stück ist immer ein Konflikt (`gleich` = schon so gespeichert vom gleichen Kürzel, ohne rote Meldung). |
| Ungespeicherte Scans | Ist der Durchgang inzwischen abgeschlossen, bleibt die Schlange im Browser und steht oben rot (auch nach Neuladen), bis sie nach dem Wiederöffnen nachgespeichert oder bewusst verworfen wird. |
| Abschluss | Warnt, wenn in den letzten 2 Minuten andere Kürzel noch zugeordnet haben (zweiter Aufruf mit `bestaetigt`). Liest das Return Tool neu, prüft pro ID «Lagerort alt», Tab, doppelte IDs und ob «Lagerort neu» inzwischen belegt ist: Spalte «Prüfung» («ok» / «ABWEICHUNG: …»). Tab und Zeile aus dem neuen Stand, Zeile nur als Hinweis. |
| Abnehmer-Liste | Verschieben in den Ordner und Freigabe: Fehler kommen als Hinweis zurück. Wiederöffnen setzt «UNGÜLTIG – » vor den Titel der alten Liste. |
| Liste von Hand | CSV mit Anführungszeichen (`"Tisch, rund"`, `""`) wird richtig getrennt. Zahlen: «1'234.50», «1,234.50», «1.234,50», «1234,50». |
| Stücke ohne Barcode | Hinweis beim Setup und im Reiter «Offen»: nur per PG-ID-Etikett. |

## Handy und Kamera (21.10.2026)
- Handy-Ansicht: Gebinde zweispaltig, Tabellen scrollen in der Karte, Scanfeld ohne Autofokus (keine Tastatur). «Teilen → Zum Home-Bildschirm» als App-Ersatz (Apps Script kann keine echte App/PWA).
- Knopf «Kamera»: Live-Bild in einer Leiste unten (bleibt beim Wechsel des Gebindes offen), alle 200 ms Strichcode suchen: BarcodeDetector (Chrome/Android), sonst ZXing (@zxing/library 0.21.3 von jsDelivr, v.a. iPhone). Gleicher Code erst nach 2.5 s wieder, Vibration bei Treffer.
- Erlaubt der Google-Rahmen die Live-Kamera nicht, öffnet sich die Foto-Kamera des Handys (Datei-Feld mit capture): Foto machen, Code wird gelesen.
- Test: tests/t_umpacken_kamera.py (Handy-Grösse, Fake-Kamera, simulierter Leser). ZXing echt geprüft in Chrome mit gezeichnetem EAN-13.

## Betrieb und Prüfung (21.10.2026)
- Einrichten im Editor ausgeführt (Tabs angelegt). `pruefen()` im Editor liest die Lagerorte aus dem Return Tool und schreibt sie ins Protokoll, ändert nichts: 75 Lagerorte, nächste Kids-Palette KID-13.
- Im Return Tool stehen teils EANs als Lagerort (z.B. KID-4005176984105). Für «nächste Palette» zählen nur Nummern mit 1–4 Stellen; als belegt gelten sie trotzdem.
- Tab «Tabellenblatt1» in der Datenbank ist leer und stört nicht.

## Geplant: Übertragung ins Return Tool (Entscheid Jonas 22.10.2026)
Ziel: Nach dem Abschluss ein Knopf «Ins Return Tool übertragen» mit Vorschau. Start mit Option B, später allenfalls C.
- B: Lagerort (und Preis, wo er vom VP abweicht) pro Stück über die ID setzen. Verkauf der Abnehmer-Gebinde danach im Return Tool mit «Lieferung erstellen».
- C: zusätzlich Verkauf wie «Lieferung erstellen» (Lief-Nr, Verschieben). Braucht den Code des Return Tools.
- Sicherungen: Suche über ID (nie Zeile), vorher prüfen, ob «Lagerort alt» noch stimmt (sonst überspringen und melden), jede Änderung mit vorher/nachher ins Log, Zeilen in «Änderungen» bekommen «Erledigt», zweiter Klick schreibt nichts doppelt.
- Voraussetzung: Ok von Jonas M. für Schreibzugriff des Umpack Tools aufs Return Tool.
- Die Datenbank hat dafür schon alles (Tab «Änderungen»: PG-ID, Aktion, Lagerort alt/neu, VP alt, Preis, Return-Tool-Tab, Erledigt). Neue Spalten (z.B. «Übertragen am», «Fehler») ergänzt «einrichten» ohne Umbau. Abgeschlossene Durchgänge von vorher lassen sich nachträglich übertragen.
- Return Tool «Stationär»: Kopfzeile in Zeile 6 (☑, ID, …, Lagerort, Lief-Nr, → VERSCH.), Daten ab Zeile 7.
