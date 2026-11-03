# Heilsarmee Tool (Pilot Filiale Bern)

Stand 30.10.2026, Version 1.0.0. Entscheide Jonas B. 29. und 30.10.2026.

## Ablauf Retouren
1. Lot eröffnen: BRO-1, BRO-2 … (Tab «Lots»).
2. EAN scannen, PG-ID oder Name eingeben. Quelle: Tab «Heilsarmee» im Return Tool (nur lesen).
   Gleiche EAN mehrfach: das erste freie Stück. Schon in einem Lot: Warnung, Bestätigung nötig.
3. Neu oder Gebraucht wählen (Pflicht). Der Prozentsatz ist der Rabatt auf den Neupreis (Jonas B. 02.11.2026): Neu 50% Rabatt = 50% vom OVP,
   Gebraucht 75% Rabatt = 25% vom Neupreis (Config RABATT_NEU, RABATT_GEBRAUCHT), auf die nächste Preisstufe gerundet
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

## 1.2.0 (02.11.2026)
Prozentsatz = Rabatt. Vorher rechnete das Tool Gebraucht als 75% vom Neupreis (falsch). Config-Zeilen PROZENT_* im Sheet durch RABATT_* ersetzt,
Spalte «Prozent» im Tab «Stücke» heisst «Rabatt». Im Sheet war nur ein Stück erfasst (Neu, unverändert richtig).
Live seit 02.11.2026 14:40 als Bereitstellungs-Version 4 (Rückfall: Version 3).

## Kamera-Scan (02.11.2026)
Knopf «Kamera» neben dem Suchfeld, übernommen aus dem Umpacken-Tool: Live-Bild der Rückkamera, alle 200 ms Strichcode suchen
(BarcodeDetector des Browsers, sonst ZXing 0.21.3 von jsdelivr). Ein Treffer schliesst die Kamera und sucht wie ein Handscanner.
Erlaubt der Google-Rahmen die Live-Kamera nicht: Foto-Kamera des Handys öffnet, das Foto wird gelesen. Nur Index.html geändert.
Live seit 02.11.2026 17:19 als Bereitstellungs-Version 5 «1.2.1 Kamera-Scan» (Rückfall: Version 4).

## 1.3.0 Neupreis nicht verfügbar (03.11.2026)
Von Hand erfassen: zuerst Neupreis eingeben. Ist er nicht auffindbar, Knopf «Neupreis nicht verfügbar»: OVP wird «NA» (auch so im Tab «Stücke»),
der Verkaufspreis wird direkt gewählt: grosse Knöpfe 1.90 / 2.90 / 4.90 / 6.90, darunter ein Dropdown mit allen weiteren Heilsarmee-Stufen.
Nochmals tippen führt zurück zur Neupreis-Eingabe. Nebenbei: Feld «Menge» ragte auf schmalen Handys über den Rand (behoben).
Im Editor gespeichert, noch nicht live (wartet auf Go für Bereitstellungs-Version 6, Rückfall Version 5).
