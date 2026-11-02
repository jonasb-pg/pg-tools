# Heilsarmee Tool (Pilot Filiale Bern)

Stand 30.10.2026, Version 1.0.0. Entscheide Jonas B. 29. und 30.10.2026.

## Ablauf Retouren
1. Lot eröffnen: BRO-1, BRO-2 … (Tab «Lots»).
2. EAN scannen, PG-ID oder Name eingeben. Quelle: Tab «Heilsarmee» im Return Tool (nur lesen).
   Gleiche EAN mehrfach: das erste freie Stück. Schon in einem Lot: Warnung, Bestätigung nötig.
3. Neu oder Gebraucht wählen (Pflicht). Neu = 50% vom OVP, Gebraucht = 75%, auf die nächste Preisstufe gerundet
   (1.9, 2.9, 4.9, 6.9, 9.9, 14.9, 18.9, 24.9, 29.9, 39, 49, 59, dann +10). Preis von Hand überschreibbar.
4. Preis mit der Preis-Gun kleben, Übernehmen (Tab «Stücke», Pos-ID BRO-n/k).
5. Lot abschliessen: Reporting-Tab «BRO-n» mit Kategorie PG, Preisgruppe, Kategorie Brocki, Kassenkategorie, OVP, Brockipreis, Summen.

## Kategorien
Erst beim Reporting (nicht beim Inventarisieren). Reihenfolge: Tab «Kategorien» (gemerkt, von Hand korrigierbar),
Regeln in Kategorien.gs, KI (nur mit Script-Eigenschaft ANTHROPIC_API_KEY), sonst «Prüfen».
Die Regeln erkennen Bubble-Beschreibungen gut, Galaxus-Produktnamen nur zu rund einem Viertel (Test 30.10.2026: 97 von 378).

## Sprache (1.1.0, 02.11.2026)
Oberfläche Deutsch und Englisch, Umschalter DE/EN oben rechts, pro Gerät gemerkt (localStorage «ha.lang»).
Nur Index.html geändert; die bekannten Servermeldungen übersetzt die Oberfläche. Daten und Reporting-Tab im Sheet bleiben deutsch.
Live seit 02.11.2026 13:36 als Bereitstellungs-Version 3 (Rückfall: Version 2).

## Offen
- Reuse-Ablauf (Bubble, Standardpreisliste der Filiale, Foto-Erkennung).
- Etikettendruck entfällt: Preis-Gun.
