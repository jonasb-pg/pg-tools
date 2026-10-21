# Umpack Tool · Architektur

Stand: Version `2026-10-21.2` (Kamera-Scan fürs Handy, Ausführen als Jonas). Code im Apps-Script-Projekt «Umpack Tool» (eigenständig, Konto jonas.b@pretty-good.ch, Projekt-ID 1VHq2IFZC4W6GRdvOPIYIKFHvrnL7CzlkPABe7_0xg4rOHGBt5hrcqisg). Datenbank: Sheet «(21/10/2026) UMPACK TOOL» (DB_ID im Code). Web-App: «Ausführen als Jonas», Zugriff «Jeder in Pretty Good»: Wer scannt, braucht keine eigenen Freigaben (Simon). Abnehmer-Listen sind für Pretty Good mit Link lesbar.

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

Tests: tests/t_umpacken.js (Server), tests/t_umpacken_ui.py (Oberfläche).

## Handy und Kamera (21.10.2026)
- Handy-Ansicht: Gebinde zweispaltig, Tabellen scrollen in der Karte, Scanfeld ohne Autofokus (keine Tastatur). «Teilen → Zum Home-Bildschirm» als App-Ersatz (Apps Script kann keine echte App/PWA).
- Knopf «Kamera»: Live-Bild in einer Leiste unten (bleibt beim Wechsel des Gebindes offen), alle 200 ms Strichcode suchen: BarcodeDetector (Chrome/Android), sonst ZXing (@zxing/library 0.21.3 von jsDelivr, v.a. iPhone). Gleicher Code erst nach 2.5 s wieder, Vibration bei Treffer.
- Erlaubt der Google-Rahmen die Live-Kamera nicht, öffnet sich die Foto-Kamera des Handys (Datei-Feld mit capture): Foto machen, Code wird gelesen.
- Test: tests/t_umpacken_kamera.py (Handy-Grösse, Fake-Kamera, simulierter Leser). ZXing echt geprüft in Chrome mit gezeichnetem EAN-13.
