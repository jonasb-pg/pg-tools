# Architektur Ricardo Tool

Stand: Version `2026-10-21.1` (angefangene Listings bleiben bis «Gelistet»). Live: Bereitstellung Version 25 (21.10.2026, 11:49, Laufzeit Do 19.00, ohne Kontrollliste; neue Version nur mit Go von Jonas). Abläufe Täglich, Listing, Packen, Versenden als geführte Fälle; Retouren unter Verwaltung. Post-Adressprüfung ausgeschaltet (kostenpflichtig, Entscheid Jonas 19.10.2026).

## Komponenten

| Komponente | Typ | ID / Adresse | Rolle |
|---|---|---|---|
| Ricardo Tool (Code) | Apps Script, an Sheet gebunden | Script `17okxNkNUeGHE_XLKjqxvAE7APSV6D0IusWQsfm1igLX7pvpU9GjYh_hE` | `Code.gs`, `Index.html`, `Basis.gs` (gemeinsam, siehe `../gemeinsam/sheet-standard.md`) |
| RICARDO TOOL | Google Sheet | `1liRzxIAKCSKGS5-uN3FkFcboN_Luqd2Ar5Ae57cSmvg` | Datenbank; Übersicht im ersten Tab |
| ANALYSE TOOL | Google Sheet | `1jhmq1JoyM6Xor33pM77AmOixbvqKuGzfFX-js9PdIrM` | nur lesen: Tab «Ricardo» (fertige Texte aus der Analyse) |
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
