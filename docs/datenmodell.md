# Datenmodell

<!-- Automatisch erzeugt mit tools/gen.py aus src/Code.gs (Version 2026-10-15.11). Nicht von Hand ändern. -->


Sheet **ANALYSE TOOL** `1jhmq1JoyM6Xor33pM77AmOixbvqKuGzfFX-js9PdIrM`. Spaltennamen sind Schlüssel: Der Code liest und schreibt nach Name, nicht nach Position. `einrichten()` prüft, ob alle Spalten da sind.

| Tab | Schreibt | Liest | Granularität |
|---|---|---|---|
| Produkte | Abgleich (aus Return Tool, Tab «Analyse»), ohneInventar | alle | 1 Zeile pro Stück (PG-ID) |
| Recherche | Vorab-Recherche (Batch), rechercheJetzt | ueberblick_ | 1 Zeile pro Schlüssel × Feld |
| Analysen | abschliessen | Auswertung, suche (Regal Matchmaker), matchmakerZurueck | 1 Zeile pro abgeschlossene Analyse |
| Prüfschritte | abschliessen | Auswertung | 1 Zeile pro geprüftem Punkt |
| Testmittel | Mensch (Vorhanden), abschliessen (neue Namen) | ueberblick_ | 1 Zeile pro Testmittel |
| Testmittel-Log | abschliessen | Auswertung | 1 Zeile pro Nennung |
| Feedback | feedback | Jonas | 1 Zeile pro Eintrag; Status von Hand |
| Bestellliste | reparaturPause | Startseite (Teil-Status), Besteller:in | 1 Zeile pro Teil; Status von Hand |
| Testkonten |  |  |  |
| Ricardo | abschliessen (kanal ricardo) | Ricardo Tool (geplant: Maske) | 1 Zeile pro Inserat |
| Ersatzteile | ersatzteilSuche | ersatzteile, «Später reparieren» | 1 Zeile pro Angebot |
| Quellen-Log | Recherche | Analyse der Quellen | 1 Zeile pro Quelle und Recherche |
| Batches | Abgleich | Abgleich | 1 Zeile pro Batch der Claude Batch API |
| Log | log_ | Fehlersuche | 1 Zeile pro Ereignis |
| Sicherheitspunkte | Mensch | ueberblick_ | 1 Zeile pro Punkt, «Gilt für» filtert |
| Stufen | Mensch | stufe_ | 1 Zeile pro Herkunft × VP-Schwelle |
| Einstellungen | Mensch, einrichten | einst_ | 1 Zeile pro Einstellung |
| Auswertung |  |  |  |
| Score-Regeln |  |  |  |
| Listen |  |  |  |

Zusätzlich angelegt bei Bedarf: «Kosten» (jeder KI-Aufruf), «Bestellliste», «Feedback», «Ricardo». «Auswertung», «Score-Regeln», «Listen» sind Formel-/Werte-Tabs ohne feste Spalten.

## Produkte

| # | Spalte |
|---|---|
| 1 | PG-ID |
| 2 | Herkunft |
| 3 | Bezeichnung |
| 4 | Anzahl |
| 5 | Barcode |
| 6 | Link |
| 7 | Kategorie |
| 8 | Neupreis CHF |
| 9 | VP CHF |
| 10 | Importiert am |
| 11 | Recherche-Schlüssel |
| 12 | Recherche-Status |
| 13 | Recherche-Batch |
| 14 | Analyse-Status |

## Recherche

| # | Spalte |
|---|---|
| 1 | Schlüssel |
| 2 | Bezeichnung |
| 3 | Feld |
| 4 | Inhalt |
| 5 | Quelle (Link) |
| 6 | Quellentyp |
| 7 | Modelltreffer |
| 8 | Zweitquelle bestätigt |
| 9 | Variantenrisiko |
| 10 | Von uns bestätigt (Anzahl) |
| 11 | Von uns korrigiert (Anzahl) |
| 12 | Recherchiert am |
| 13 | Punkte Quelle |
| 14 | Punkte Modell |
| 15 | Punkte Zweitquelle |
| 16 | Punkte bestätigt |
| 17 | Abzug Variante |
| 18 | Summe |
| 19 | Score |

## Analysen

| # | Spalte |
|---|---|
| 1 | Analyse-Nr |
| 2 | PG-ID |
| 3 | Bezeichnung |
| 4 | Barcode |
| 5 | Kategorie |
| 6 | Herkunft |
| 7 | Kürzel |
| 8 | Start |
| 9 | Ende |
| 10 | Dauer Min |
| 11 | Zeitbudget Min |
| 12 | Über Budget Min |
| 13 | Marke |
| 14 | Modell |
| 15 | Stufe |
| 16 | Reusable |
| 17 | Grade |
| 18 | Versiegelt |
| 19 | Grund |
| 20 | K.-o.-Schritt |
| 21 | Fehlendes Zubehör |
| 22 | Nicht geprüfte Funktionen |
| 23 | Befund |
| 24 | Verkaufsinfo |
| 25 | CH-Stecker |
| 26 | Firmware-Version |
| 27 | Reparatur (Beschrieb) |
| 28 | Reparatur Min |
| 29 | Ersatzteil CHF |
| 30 | Reparaturkosten CHF |
| 31 | Garantie Tage |
| 32 | Regal |
| 33 | Matchmaker-Auftrag |
| 34 | Stand |

## Prüfschritte

| # | Spalte |
|---|---|
| 1 | Analyse-Nr |
| 2 | PG-ID |
| 3 | Nr |
| 4 | Block |
| 5 | Schritt |
| 6 | Herkunft Schritt |
| 7 | Ergebnis |
| 8 | Bemerkung |
| 9 | Zeit |
| 10 | Kürzel |

## Testmittel

| # | Spalte |
|---|---|
| 1 | Testmittel |
| 2 | Vorhanden |

## Testmittel-Log

| # | Spalte |
|---|---|
| 1 | Zeit |
| 2 | PG-ID |
| 3 | Testmittel |
| 4 | Art |
| 5 | Kürzel |

## Feedback

| # | Spalte |
|---|---|
| 1 | Zeit |
| 2 | Kürzel |
| 3 | PG-ID |
| 4 | Schritt |
| 5 | Feedback |
| 6 | Status |

## Bestellliste

| # | Spalte |
|---|---|
| 1 | Zeit |
| 2 | PG-ID |
| 3 | Produkt |
| 4 | Was |
| 5 | Teil |
| 6 | Teilenummer |
| 7 | Shop |
| 8 | Preis CHF |
| 9 | Link |
| 10 | Kürzel |
| 11 | Status |

## Testkonten

| # | Spalte |
|---|---|
| 1 | Dienst |
| 2 | Login |
| 3 | Passwort |
| 4 | Gerät |
| 5 | Notiz |
| 6 | Aktiv |
| 7 | Erfasst von |
| 8 | Erfasst am |
| 9 | Geändert von |
| 10 | Geändert am |

## Ricardo

| # | Spalte |
|---|---|
| 1 | PG-ID |
| 2 | Analyse-Nr |
| 3 | Bezeichnung |
| 4 | EAN |
| 5 | Titel |
| 6 | Artikelbeschrieb |
| 7 | Ricardo-Zustand |
| 8 | Grade |
| 9 | Startpreis CHF |
| 10 | Neupreis CHF |
| 11 | Versandklasse |
| 12 | Versand CHF |
| 13 | Foto-Ordner |
| 14 | Fotos |
| 15 | Kürzel |
| 16 | Analysiert am |
| 17 | Status |

## Ersatzteile

| # | Spalte |
|---|---|
| 1 | Zeit |
| 2 | PG-ID |
| 3 | Produkt |
| 4 | Gesucht |
| 5 | Teil |
| 6 | Teilenummer |
| 7 | Art |
| 8 | Preis CHF |
| 9 | Shop |
| 10 | Link |
| 11 | Lieferbar |
| 12 | VP CHF |
| 13 | Hinweis |
| 14 | Kürzel |

## Quellen-Log

| # | Spalte |
|---|---|
| 1 | Zeit |
| 2 | Schlüssel |
| 3 | Bezeichnung |
| 4 | Quelle |
| 5 | Gefunden |
| 6 | Gelieferte Felder |
| 7 | Meldung |

## Batches

| # | Spalte |
|---|---|
| 1 | Batch-ID |
| 2 | Erstellt am |
| 3 | Status |
| 4 | Anzahl |
| 5 | Abgeholt am |

## Log

| # | Spalte |
|---|---|
| 1 | Zeit |
| 2 | Person |
| 3 | Aktion |
| 4 | ID |
| 5 | Detail |

## Sicherheitspunkte

| # | Spalte |
|---|---|
| 1 | Punkt |
| 2 | Gilt für |

## Stufen

| # | Spalte |
|---|---|
| 1 | Herkunft |
| 2 | VP ab CHF |
| 3 | Stufe |
| 4 | Minuten |
| 5 | Websuchen |
| 6 | KI-Modell |
| 7 | Recherche-Umfang |
| 8 | Prüfumfang |

## Einstellungen

| # | Spalte |
|---|---|
| 1 | Einstellung |
| 2 | Wert |
