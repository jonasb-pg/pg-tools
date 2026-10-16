# Ricardo Tool: Bestand und Anpassungen (15.10.2026)

Quelle: Chat «Ricardo Tool» (08.–10.10.2026, https://claude.ai/chat/ea5f8271-d401-45fa-9a83-2008472d354a), Sheet RICARDO TOOL `1liRzxIAKCSKGS5-uN3FkFcboN_Luqd2Ar5Ae57cSmvg` (nur gelesen). Keine Personendaten übernommen.

## Ist

| Punkt | Ist |
|---|---|
| Technik | Apps-Script-Web-App am Sheet (Code.gs, Index.html), Version 2026-10-09.2; Code nur im Editor, nicht im Repo |
| Quelle | Return Tool (nur lesen), Such-Tab «Online»; Stücke ohne Inventar mit RC-Nummer |
| KI | Claude Haiku schreibt Titel, Beschrieb, englische Lesehilfe; ohne Schlüssel Textbausteine |
| Tabs | Listings (32 Spalten), Verkäufe, Retouren, Versand, Einstellungen, Post-Adressen, Wochenübersicht, Log, Doku |
| Stand | ca. 40 Listings (30 Gelistet, 10 RC), Verkäufe noch leer (CSV-Import nie produktiv) |
| Ablauf | suchen → Zustand, Mängel, Versand → Text erstellen → kopieren, Kontrollliste → Link speichern (Gelistet) → Verkaufsbericht-CSV → Post-Adressen, Etikette ZD220, gepackt → Zahlung prüfen, «Bezahlt und versendet» → Unverkauft / Retoure |
| Stati Listing | In Arbeit → Bereit → Gelistet → Verkauft → Versendet; Abgebrochen, Unverkauft, Storniert, Retourniert, Retour abgeschlossen |
| Bündel | eine Zeile mit Bündel-IDs und Bündel-Inhalt; nur aus Stücken mit Inventar |

## Lücken zum Soll

| Soll | Lücke |
|---|---|
| Liest Tab «Ricardo» im ANALYSE TOOL | Quelle und Spalten umstellen; Suche über PG-ID, Analyse-Nr, EAN |
| Titel und Beschrieb aus der Analyse | KI-Text im Ricardo Tool entfällt für Analyse-Stücke |
| Zustand, Grade, Versand aus der Analyse | fix übernehmen; Namen der Versandklassen angleichen (`0-2kg / PostPac B-Post` vs. `PostPac B-Post bis 2 kg`); Zustandswerte abgleichen |
| Fotos in RICARDO FOTOS | Link zum Foto-Ordner auf der Karte |
| Regale Offline / Online / Unpaid | Status auf Regalnamen abbilden |
| Bündel und Stücke ohne Inventar | RC-Weg behalten (Text von Hand oder KI nur für RC); Bündel aus gemischten Quellen (Analyse-PG-ID + RC) |
| Schlusssatz | eine Quelle (Analyse: «sorgfältig geprüft und mit einer Garantie von 30 Tagen») |

## Anpassungen, priorisiert

| Prio | Art | Anpassung |
|---|---|---|
| 1 | ändern | Quelle = Tab «Ricardo» (ANALYSE TOOL), nur lesen; Return Tool höchstens als Hinweis |
| 2 | ändern | Stati auf Regale: Gelistet = Ricardo Online; Verkauft / Zu packen / Wartet auf Zahlung = Ricardo Unpaid |
| 3 | ändern | Karte zeigt Titel und Beschrieb aus der Analyse mit Kopierknopf, Link Foto-Ordner |
| 4 | weglassen | KI-Text, Text-Anweisung, englische Lesehilfe, Mängel-KI, Spezifikationen/Masse (für Analyse-Stücke) |
| 5 | weglassen | Auswahl Zustand und Versand für Analyse-Stücke (bleibt für RC) |
| 6 | neu | Bündel aus gemischten Quellen |
| 7 | behalten | Stücke ohne Inventar (RC) mit Formular; optional KI-Knopf nur für RC |
| 8 | ändern | Versandklassen und Schlusssatz vereinheitlichen |
| 9 | behalten + testen | CSV-Import, Post-Adressen, Zahlung, Retouren, Wochenübersicht; vor Go-live mit echtem CSV, Postlogin-Upload, ZD220 testen |
| 10 | neu | Versionserkennung: fordert nach einer neuen Bereitstellung zum Neuladen auf |

## Wo überarbeiten

Hier, im selben Repo wie Analyse Tool und Matchmaker (Schnittstelle Tab «Ricardo» liegt hier; der alte Chat ist lang und voller überholter Entscheide; sein Code lag nur in einer temporären Sandbox). Voraussetzung: `Code.gs` und `Index.html` des Ricardo Tools ins Repo (`apps/ricardo/`), wie beim Matchmaker.

## Umsetzung 2026-10-15.1 (Testversion, nicht bereitgestellt)

| Prio | Stand | Umsetzung |
|---|---|---|
| 1 | umgesetzt | Neue Quelle Tab «Ricardo» im ANALYSE TOOL (Einstellung «Analyse Tool ID», nur lesen). Startseite: Karte «Aus der Analyse, bereit zum Listen». Suche findet analysierte Stücke zuerst; dieselbe PG-ID aus dem Return Tool erscheint dann nicht doppelt. Return Tool bleibt zweite Quelle |
| 2 | umgesetzt | Regalnamen als Einstellungen «Regal Offline/Online/Unpaid» (Admin): In Arbeit/Bereit = Ricardo Offline, Gelistet = Ricardo Online, Verkauft/Zu packen/Wartet auf Zahlung = Ricardo Unpaid. Anzeige auf der Karte, in «Laufende Angebote» und als Lagerort beim Verkauf (wenn kein Lagerort) |
| 3 | umgesetzt | Listing aus der Analyse übernimmt Titel, Beschrieb, Zustand, Startpreis, Neupreis, EAN, Versand (über Gewicht/Sperrgut auf den Tab «Versand» abgebildet), Analyse-Nr, Foto-Ordner; «geprüft» = ja. Ist danach direkt «Bereit». Fotos-Feld verlinkt den Drive-Ordner |
| 4/5 | umgesetzt | Analyse-Modus (`istAnalyse_`: Quelle «Analyse» und kein Bündel): Zustand, «geprüft», Mängel gesperrt (Server ignoriert sie); Mängel-Regeln in `pruefe_` entfallen; Knopf «Text aus der Analyse wiederherstellen» statt KI |
| 6 | umgesetzt | Bündel mischen Analyse, Return Tool und RC. Ein offenes RC-Listing geht im Bündel auf (Status Abgebrochen). Auflösen rechnet Preis/Neupreis des Hauptstücks zurück (`basis_`), bei Analyse-Hauptstück kommt der Analyse-Text zurück |
| 7 | umgesetzt | RC bleibt; RC lässt sich nach Abbruch, «Unverkauft» oder aufgelöstem Bündel neu listen (`neuAusRc_`) |
| 8 | umgesetzt | Versandklassen werden über das Gewicht abgebildet, Namen bleiben je Tool. Schlusssatz in beiden Sheets gleich (Entscheid 15.10.2026) |
| 9 | unverändert | CSV-Import, Post-Adressen, Zahlung, Retouren, Admin |
| neu | umgesetzt | Vermerk «geändert»: Spalte «Text geändert» = «geändert von … am …», wenn Titel oder Beschrieb aus der Analyse von Hand geändert werden; wird beim Wiederherstellen geleert |

Neue Spalten in «Listings» (am Ende): `Analyse-Nr`, `Foto-Ordner`, `Text geändert`. «Foto-Ordner» ist nicht mehr in `ALT_L`. Vor dem Test einmal «einrichten» ausführen (hängt die drei Spalten und die Einstellung an; die bereitgestellte Version liest nur die ersten 32 Spalten und läuft weiter).

Tests: `tests/t_ricardo_analyse.js` (Server, 23 Fälle), `tests/t_ricardo_ui.py` (Oberfläche mit Stub).

## Umsetzung 2026-10-16.1

- **Post-Adressen pro Versandklasse:** `postAdressen()` liefert `{ anzahl, dateien: [{ klasse, anzahl, name, datei }] }`, eine Excel-Datei pro Versandklasse in der Reihenfolge des Tabs «Versand», «Ohne Versandklasse» zuletzt. Jede Datei einzeln im Postlogin hochladen und dort die gleiche Klasse wählen.
- **Hauptbild beim Packen:** `hauptbilder_()` sucht im Foto-Ordner des Listings (Spalte «Foto-Ordner», nur Stücke aus der Analyse) die Datei «1 Hauptbild …» und hängt ein Vorschaubild als data-URL an den Verkauf. Zwischenspeicher 6 Stunden pro PG-ID. Kein Ordner, kein Zugriff oder kein Bild: kein Bild, Packen wie bisher.
- Tests: `tests/t_ricardo_post.js`, `tests/t_ricardo_pack.py`.
