# Umpack Tool · Architektur

Stand: Version `2026-10-21.1` (erste Version). Code im Apps-Script-Projekt «Umpack Tool» (eigenständig, Konto jonas.b@pretty-good.ch, Projekt-ID 1VHq2IFZC4W6GRdvOPIYIKFHvrnL7CzlkPABe7_0xg4rOHGBt5hrcqisg). Datenbank: Sheet «(21/10/2026) UMPACK TOOL» (DB_ID im Code). Web-App: noch nicht bereitgestellt.

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
