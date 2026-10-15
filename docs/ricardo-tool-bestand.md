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

Hier, im selben Repo wie Analyse Tool und Matchmaker (Schnittstelle Tab «Ricardo» liegt hier; der alte Chat ist lang und voller überholter Entscheide; sein Code lag nur in einer temporären Sandbox). Voraussetzung: `Code.gs` und `Index.html` des Ricardo Tools ins Repo (`ricardo-script/`), wie beim Matchmaker.
