# Architektur Ricardo Tool

Stand: Version `2026-10-24.1` (Datenintegrität nach Audit: Suche über alle Kanäle, Doppelprüfung, Zuordnung der Verkäufe; nicht bereitgestellt). Vorher `2026-10-21.2` (Matchmaker-Stücke per Scan auf Ricardo). Live: Bereitstellung Version 26 (21.10.2026, 15:06; neue Version nur mit Go von Jonas). Abläufe Täglich, Listing, Packen, Versenden als geführte Fälle; Retouren unter Verwaltung. Post-Adressprüfung ausgeschaltet (kostenpflichtig, Entscheid Jonas 19.10.2026).

## Komponenten

| Komponente | Typ | ID / Adresse | Rolle |
|---|---|---|---|
| Ricardo Tool (Code) | Apps Script, an Sheet gebunden | Script `17okxNkNUeGHE_XLKjqxvAE7APSV6D0IusWQsfm1igLX7pvpU9GjYh_hE` | `Code.gs`, `Index.html`, `Basis.gs` (gemeinsam, siehe `../gemeinsam/sheet-standard.md`) |
| RICARDO TOOL | Google Sheet | `1liRzxIAKCSKGS5-uN3FkFcboN_Luqd2Ar5Ae57cSmvg` | Datenbank; Übersicht im ersten Tab |
| ANALYSE TOOL | Google Sheet | `1jhmq1JoyM6Xor33pM77AmOixbvqKuGzfFX-js9PdIrM` | liest Tab «Ricardo» und «Matchmaker»; schreibt nur den Status im Tab «Matchmaker» auf «Ricardo», wenn ein Listing startet (`mmAufRicardo_`); scheitert das, startet das Listing nicht |
| Return Tool | Google Sheet | `1FpHJNeWZENdhgP6MqAYyOOEe1FN0tIZWOkRiYItOz2E` | **nur lesen** |
| Ricardo-Mails | Gmail (Google-Gruppe care@pretty-good.ch) | Suche `from:<Mail-Absender>` | Verkäufe, Zahlungsmeldungen, Fragen, Preisvorschläge |
| Claude API | extern | `https://api.anthropic.com/v1/messages` | Titel, Beschrieb, Antwortentwürfe (Haiku) |
| Post API | extern, beantragt | developer.apis.post.ch, Anwendung «Ricardo Tool Pretty Good» | Adressprüfung, Etiketten (noch nicht gebaut) |

## Tabs

Siehe Tab «Übersicht» im Sheet und `RICARDO_KATALOG` in `apps/ricardo/Code.gs`. Daten: Listings, Verkäufe, Posteingang, Retouren, Wochenübersicht. Verlauf: Log. Hilfstab: Post-Adressen. Einstellungen: Einstellungen, Versand. Der frühere Tab «Doku» ist seit `2026-10-16.4` Teil der Übersicht.

## Auslöser

| Funktion | Takt | Zweck |
|---|---|---|
| `mailsAbholen` | alle 30 Min., wirkt nur im Fenster «Mails prüfen zwischen» (07:00–19:00) | Ricardo-Mails lesen, Verkäufe und Aufgaben anlegen |
| `mailsJetzt` | beim Öffnen der Web-App, höchstens alle 5 Min. | dasselbe sofort |

## Datenintegrität (2026-10-24.1, Audit vom 24.10.2026)

Gleiche Fehlerart wie im Analyse Tool: Stücke mit PG-ID im Return Tool wurden übersehen und bekamen eine zweite Nummer.

| Regel | Umsetzung (`apps/ricardo/Code.gs`) |
|---|---|
| Suche liest alles | `suche`: ANALYSE TOOL, Such-Tabs (listbar), Hinweis-Tabs (Einstellung, Vorgabe `HINWEIS_TABS`: Stationär, Analyse, Berner Brocki, Caritas, Heilsarmee, Scanner; Listen nur nach Bestätigung), Tabs «Archiv …» (`ARCHIV_PRAEFIX`, nur anzeigen), eigener Tab «Listings» (`listingsZeilen_`). Fehlt ein Tab oder seine Kopfzeile: Fehler (`leseQuelle_`) |
| Nummern normalisiert | `idNorm_` (PG, PG-ALT, AN, RC, RT, A), reine Zahl ab 4 Stellen als PG-Nummer, `normEan_` ohne GS1-«(01)» und führende Nullen |
| Warnungen | `warnungen_`: gleiche EAN aus verschiedenen Quellen mit anderer Nummer («möglicherweise dasselbe Stück»), gleiche Nummer auch im Archiv |
| Start eines Listings | `vorpruefen_` liest Analyse und Return Tool frisch (ohne Sperre); Archiv sperrt; vergebene Stücke (Entscheid «Anderer Kanal»/«Entsorgung», `ENTSCHEID_GEBUNDEN`) sperren |
| Nur PG-ID (Entscheid Jonas 24.10.2026) | `freiesListing` bricht ab («Nur Stücke mit PG-ID. Bitte zuerst im Return Tool erfassen.»), der Weg in der Oberfläche ist entfernt. Bestehende RC-Listings bleiben gültig (`neuAusRc_`, Bündel). Bei «nicht gefunden» zeigt `aehnlicheStuecke` / `freiKandidaten_` ähnliche Stücke (EAN, Nummer, Galaxus-Artikelnummer gegen Spalte «Link», Marke + 60 % der Wörter) aus Return Tool inkl. Archiv, Analyse und Listings, ohne Anlegen |
| Verkäufe zuordnen | `listingKarte_` / `verkaufZuordnen_`: Artikel-Nr vor Referenz; frühere Links (Spalte «Frühere Links», gefüllt von `markiereGelistet`) und Widersprüche ändern keinen Status, sondern legen einen Hinweis «W-<Verkauf-Nr>» im Posteingang an; zweiter Verkauf auf verkauftes Stück ebenso, dazu `doppelt` in `ablauf('taeglich')` |
| «Unverkauft» von Hand | `setzeStatus(id, 'Unverkauft', bestaetigt)`: offene unzugeordnete Verkäufe verlangen Bestätigung; passt einer (Artikel-Nr, früherer Link, ähnlicher Titel), gesperrt |
| Kleinere | Rückzahlung höchstens Preis + Porto; `MAIL_LETZTE` erst nach erfolgreichem Schreiben; Preisvorschlag ohne bekanntes Angebot: «Prüfen» |

Neue Spalte in «Listings» (am Ende): `Frühere Links`. Vor dem Bereitstellen «einrichten» ausführen: hängt die Spalten an und stellt die alte Vorgabe der Hinweis-Tabs (mit «Spenden») auf die heutigen Kanal-Tabs um. Ohne «einrichten» meldet die Web-App «Das Sheet passt nicht zu dieser Version».

Tests: `tests/t_ricardo_integritaet.js` (Server), `tests/t_ricardo_integritaet_ui.py` (Oberfläche), `tests/t_ricardo_integritaet_daten.py` (Suche gegen eine Momentaufnahme des echten Return Tools; ohne Datei übersprungen).
