# Umpack Tool · Architektur

Stand: Version `2026-10-24.2` (Code, nicht eingespielt; nach dem Einspielen sofort «einrichten» ausführen, ergänzt «Scan-ID» in «Zuordnung» und «Verworfen am/von» in «Durchgänge»; Umsetzung der Prüfung: [pruefung-2026-10-24.md](pruefung-2026-10-24.md)). Live: Version 2026-10-24.1 (Bereitstellung 5, 24.10.2026 09:41). Oberfläche schlank: keine Erklärtexte, kurze Meldungen (Wunsch Jonas). Link in TOOL LINKS. Code im Apps-Script-Projekt «Umpack Tool» (eigenständig, Konto jonas.b@pretty-good.ch, Projekt-ID 1VHq2IFZC4W6GRdvOPIYIKFHvrnL7CzlkPABe7_0xg4rOHGBt5hrcqisg). Datenbank: Sheet «(21/10/2026) UMPACK TOOL» (DB_ID im Code). Web-App: «Ausführen als Jonas», Zugriff «Jeder in Pretty Good»: Wer scannt, braucht keine eigenen Freigaben (Simon). Abnehmer-Listen sind für Pretty Good mit Link lesbar.

## Zweck
Paletten neu triagieren (Entscheid Jonas 21.10.2026): Stücke aus bestehenden Paletten herausnehmen und in neue Gebinde packen. Alle Entscheide im Tool, das Return Tool wird erst beim Abschluss nachgeführt.

## Ablauf eines Durchgangs
1. **Setup**: Name, Quelle (Lagerorte aus dem Return Tool lesen oder Liste von Hand einfügen), Ziel-Gebinde.
   Gebinde-Arten: Verkauf an Abnehmer (Liste pro Abnehmer, gilt als verkauft), neue Palette im Lager (nur Lagerort neu), Entsorgung (Preis 0).
   Preisregel pro Gebinde: VP, % vom VP, 0 (gratis); pro Stück überschreibbar. Vorschlag für die nächste freie Palette pro Kürzel (z.B. KID-13).
2. **Scan**: Gebinde wählen, PG-ID oder Barcode scannen. Der Browser entscheidet sofort (✅ nur, wenn der Scan in der Warteschlange ist; ⚠️ schon zugeordnet / verschieben; ❌ rot mit tiefem Ton bei jeder Ablehnung), gespeichert wird im Hintergrund (Warteschlange, auch über ein Neuladen). Der Server prüft mit «vorher» auf Konflikte zwischen mehreren Scannern. Was nicht gespeichert wurde, steht in der roten Liste «Nicht gespeichert – nochmals scannen».
3. **Abschluss**: Kontrolle, pro Abnehmer ein eigenes Sheet im Ordner «00_Claude-Eingang», Änderungsliste (Tab «Änderungen») fürs Return Tool, nicht gescannte Stücke als «Nicht gefunden – prüfen». Manuell eintragen und «erledigt» anhaken. Automatische Übertragung gesperrt, bis Jonas M. einverstanden ist und der Verkaufsablauf des Return Tools nachgebaut ist.
4. **Verwerfen** (statt Abschluss, z.B. falsche Quelle): Status «Verworfen», Stücke und Lagerorte sind wieder frei. Ohne Scans jede Person, mit Scans nur Admins; nicht nach dem Abschluss.

## Datenbank (eigenes Sheet)
Durchgänge (Status Scan, Abgeschlossen, Verworfen; «Verworfen am/von») · Gebinde (gelöschte bleiben als «U-… (gelöscht)», Nummern nie wieder vergeben) · Bestand (Kopie der Quelle beim Setup; VP leer = im Return Tool leer oder unlesbar) · Zuordnung (Verlauf, letzte Zeile pro Stück gilt; «Scan-ID» = Kennung eines Barcode-Scans) · Änderungen · Log (auch «Fremder Scan») · Einstellungen.

## Regeln
- Das Return Tool wird nur gelesen (Setup). Kein Schreibzugriff im Code.
- Neue Lagerorte dürfen keine Quell-Lagerorte sein; zwei Gebinde nie mit gleichem Lagerort; doppelte IDs in der Quelle brechen das Setup ab.
- Nicht gescannte Stücke bleiben, wo sie sind (keine Änderung im Return Tool); sie stehen als «Nicht gefunden – prüfen» in «Änderungen», sperren aber nichts.
- Jeder schreibende Weg prüft den Status in der Sperre nochmals (Abschluss oder Verwerfen dazwischen: nichts wird mehr gebucht).
- Admins (Wiederöffnen, Verwerfen mit Scans): Einstellung «Admins»; leer = nur das Konto, unter dem das Tool läuft (Jonas).

Tests: tests/t_umpacken.js (Server), tests/t_umpacken_ui.py (Oberfläche), tests/t_umpacken_daten.js und tests/t_umpacken_daten_ui.py (Datenintegrität), tests/t_umpacken_kamera.py (Kamera), Prüfung 24.10.2026: tests/t_umpacken_p2410.js (Server), tests/t_umpacken_p2410_ui.py (Oberfläche), tests/t_umpacken_p2410_kamera.py (Kamera-Sperren).

## Datenintegrität (24.10.2026, nach Audit)
| Punkt | Regel |
|---|---|
| Belegte Lagerorte | `rtLesen_` liest alle Tabs des Return Tools mit Spalte «Lagerort» (auch Scanner ohne ID, Analyse, alle «Archiv …»). Dazu die «Lagerort neu» offener Durchgänge: Status «Scan», oder abgeschlossen mit Änderungen ohne «Erledigt» (ohne «Nicht gefunden – prüfen»); Verworfene zählen nicht. Vergleich gross, ohne Leerzeichen und Trennzeichen (`ortKey_`: KID15 = KID-15 = KID–15 = KID_15), gespeichert wird `ortName_` (gross, ohne Leerzeichen). |
| Neuer Lagerort | Kommt er irgendwo vor, lehnt das Setup ab (auch «Gebinde ändern»), mit Ort und Tab in der Meldung. Gilt auch für Abnehmer-Lagerorte (BALU-1 ist nach dem Verkauf im Archiv belegt: nächste Liste BALU-2). Ähnliche Schreibweise (KIDS-8 / KID-8, KID-08 / KID-8) nur als Hinweis. |
| Nächste Palette | Höchste Nummer pro Präfix über alle belegten Orte + 1, überspringt ähnliche Schreibweisen. Stand Momentaufnahme 24.10.: HOM-46, KID-15 (vorher HOM-4 bzw. KID-13, beide belegt). |
| Quell-Tabs | Vorgabe ohne «Spenden» (den Tab gibt es nicht; «einrichten» ersetzt die alte, unveränderte Vorgabe). Fehlt ein Quell-Tab oder fehlt eine Pflichtspalte (ID, Bezeichnung, Lagerort), ist er «nicht lesbar» und das Setup zeigt ihn an (Vertrag V4). Zeilen mit Inhalt, aber ohne gültige ID (nach V3) zählt das Setup pro Lagerort («n ohne ID») und meldet sie beim Anlegen. |
| Offene Durchgänge | Ein Stück darf nur in einem offenen Durchgang sein (in der Sperre geprüft, IDs nach V3: «pg 0862» = «PG-862»). Auch Stücke mit noch nicht eingetragener Änderung eines abgeschlossenen Durchgangs sperren das Setup («Nicht gefunden – prüfen» sperrt nicht). Bricht das Setup beim Schreiben ab, wird der Durchgang «Verworfen». |
| Return Tool nicht lesbar | Setup, «Gebinde ändern» und Abschluss brechen ab (auch bei einer Liste von Hand, weil die Lagerorte sonst ungeprüft wären). |
| Barcode-Scan | Der Browser schickt den Code (`code`, angezeigtes Stück als `wunsch`, Scan-Kennung `sid`). Der Server wählt in der Sperre ein freies Stück dieser EAN aus der Quelle. Freie Stücke mit verschiedenem VP oder verschiedenem «Lagerort alt»: PG-ID scannen (Browser und Server). Barcodes nach V3 verglichen (ohne GS1-«(01)», Bindestriche, führende Nullen). Folgeaktionen (Verschieben, Entfernen, Preis) auf ein Stück mit ausstehendem Barcode-Scan erst nach der Antwort. |
| Doppelscan | `vorher: ''` auf ein schon zugeordnetes Stück ist immer ein Konflikt (`gleich` = schon so gespeichert vom gleichen Kürzel, ohne rote Meldung). Barcode-Scan mit bekannter Scan-Kennung (Spalte «Scan-ID», in der Sperre gelesen, kein Cache) = schon gespeichert; ohne Kennung (alte Seite) gilt die Wunsch-Regel. |
| Ungespeicherte Scans | Ist der Durchgang inzwischen abgeschlossen oder verworfen, bleibt die Schlange im Browser und steht oben rot (auch nach Neuladen), bis sie nach dem Wiederöffnen nachgespeichert oder bewusst verworfen wird. Weitere Scans: rot «NICHT gespeichert». Während gespeichert wird, lässt sich kein anderer Durchgang öffnen; eine Antwort kürzt nur die Schlange ihres Durchgangs. Wächter: nach 60 s ohne Antwort wird neu gesendet, eine späte Antwort zählt nicht. Konflikte und Ablehnungen bleiben in der roten Liste «Nicht gespeichert – nochmals scannen» (Browser-Speicher `um-ng-<Durchgang>`), bis gespeichert oder «Erledigt». |
| Abschluss | Warnt, wenn in den letzten 2 Minuten andere Kürzel noch zugeordnet haben (zweiter Aufruf mit `bestaetigt`). Liest das Return Tool neu, prüft pro ID «Lagerort alt», Tab, doppelte IDs und ob «Lagerort neu» inzwischen belegt ist: Spalte «Prüfung» («ok» / «ABWEICHUNG: …»). Tab und Zeile aus dem neuen Stand, Zeile nur als Hinweis. |
| Abnehmer-Liste | Verschieben in den Ordner und Freigabe: Fehler kommen als Hinweis zurück. Wiederöffnen setzt «UNGÜLTIG – » vor den Titel der alten Liste. |
| Liste von Hand | CSV mit Anführungszeichen (`"Tisch, rund"`, `""`) wird richtig getrennt. Wird gegen das Return Tool aufgelöst (`manuellAufloesen_`): ID wie im Return Tool, Angaben aus dem Return Tool, unbekannt / nur im Archiv / mehrfach in Kanal-Tabs → Fehler; Zeilen ohne ID als Hinweis. Abschluss prüft wie jede Quelle. Zahlen: «1'234.50», «1,234.50», «1.234,50», «1234,50», «Fr. 12.50», «15.–», «ca. 20». |
| Stücke ohne Barcode | Hinweis beim Setup und im Reiter «Offen»: nur per PG-ID-Etikett. |
| VP fehlt | VP leer oder unlesbar bleibt im Bestand leer; Hinweis beim Setup, gelb in den Scan-Tabellen; beim Abschluss «ABWEICHUNG: VP fehlt …», wenn der Preis aus dem VP käme. |
| Preis | Lesbar, ab 0 (0 = verschenkt), unter CHF 100 000, keine 8–14 Ziffern (Barcode im Preisfeld). Hand-Scanner-Eingaben (< 50 ms pro Zeichen + Enter) ausserhalb des Scanfelds gehen ans Scanfeld, das Feld behält seinen Wert; am PC kehrt der Fokus nach jeder Aktion ins Scanfeld zurück. |
| Gebinde-Stand | `gebindeStand_` (Fingerabdruck der Gebinde) kommt mit `laden`, `zuordnen` und `stand`. Ändert ihn jemand, laden die anderen Geräte neu; ein gelöschtes gewähltes Gebinde muss neu gewählt werden. `gebindeAendern` lehnt einen veralteten Stand ab. |
| Abfrage | Alle 20 s `stand` (nur lesen, ohne Sperre): Zuordnung, Gebinde-Stand, Status. Abschluss oder Verwerfen von einem anderen Gerät schliesst die Scan-Seite. Alte Seiten, die noch über `zuordnen` ohne Scans abfragen, schreiben keine Log-Zeilen. |
| Fremde und fehlende Stücke | Fremder Code (nicht in der Quelle): rot, über die Schlange als «Fremder Scan» ins Log. Beim Abschluss: nicht gescannte Stücke als «Nicht gefunden – prüfen» in «Änderungen» (mit Prüfung gegen das Return Tool), sperren nichts, hindern Wiederöffnen nicht. |
| Erledigt | Mit Zeile und PG-ID: passt die Zeile nicht, wird über Durchgang und PG-ID gesucht; unklar → nichts gesetzt. |
| Tabs voll | `schreib_` hängt vor dem Schreiben Zeilen an (Vertrag V2), neue Zeilen als Text. |

## Handy und Kamera (21.10.2026)
- Handy-Ansicht: Gebinde zweispaltig, Tabellen scrollen in der Karte, Scanfeld ohne Autofokus (keine Tastatur). «Teilen → Zum Home-Bildschirm» als App-Ersatz (Apps Script kann keine echte App/PWA).
- Knopf «Kamera»: Live-Bild in einer Leiste unten (bleibt beim Wechsel des Gebindes offen), alle 200 ms Strichcode suchen: BarcodeDetector (Chrome/Android), sonst ZXing (@zxing/library 0.21.3 von jsDelivr, v.a. iPhone). Vibration bei Treffer.
- Sperren (Prüfung 24.10.2026): gleicher Code erst wieder, wenn er mindestens 1 s aus dem Bild war; nach jedem gebuchten Treffer 1,5 s alle Codes gesperrt; EAN und PG-Etikett desselben Stücks zählen einmal (auch wenn beide länger im Bild sind). Ein Gebinde-Wechsel hebt die kurze Sperre auf; nach einer Ablehnung gibt es keine Sperre, damit das verlangte PG-Etikett sofort zählt.
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
