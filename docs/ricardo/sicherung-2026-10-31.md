# Sicherung vor der Umstellung auf das Cockpit (31.10.2026, 17:35)

| Was | Stand |
|---|---|
| Kopie Live-Sheet | «(31/10/2026) RICARDO TOOL Sicherung vor Umstellung Cockpit», ID 1etBumIWgO92tSM9yjxMEAZsLTYU_Pxw0z3QMLVT6GGM, Ordner 00_Claude-Eingang. Alle Tabs; letzte Zeilen mit dem Original verglichen (identisch). Das gebundene Skript der Kopie hat keine Auslöser und läuft nicht von selbst. |
| Bestand Live-Sheet | Listings: letzte Zeile 136 (PG-20360; vorher irrtümlich 140 notiert, Kopie und Original enden beide bei 136) · Verkäufe: letzte Zeile 80 (54307926) · Posteingang: letzte Zeile 66 (Mail-ID 1a19228d98bb7db2, 31.10.2026) · Retouren: leer · Gebote: letzte Zeile 47 · Log: letzte Zeile 2253 (31.10.2026 15:09:22, «Ricardo-Mails: 1 verarbeitet») |
| Alter Code | apps/ricardo/Code.gs (320196 Zeichen, Hash 2829083497) und Index.html (204830, 3929198557) = Stand im Live-Editor am 31.10. 17:40 (verglichen). Lokaler Tag ricardo-live-vor-cockpit-2026-10-31; ausserdem Versionsverlauf der Bereitstellung bei Google. |
| Mails | Das Tool löscht und markiert keine Mails in Gmail. Es liest nach Zeit (Script-Eigenschaft MAIL_STAND) mit einer Stunde Überlappung; doppelte Mails erkennt es an der Mail-ID im Tab «Posteingang». Script-Eigenschaften bleiben beim Code-Wechsel unverändert. Fehlt eine Mail, kann sie nachgelesen werden. |
| Nach der Umstellung prüfen | Zeilen pro Tab ≥ Bestand oben; nächster Lauf «Ricardo-Mails» im Log (alle 30 Min. 07–19 Uhr); letzte Mail-ID im Posteingang ≥ 1a19228d98bb7db2. |
| Zurück | Bereitstellen › Bereitstellungen verwalten › Stift › Version der Bereitstellung vor der Umstellung wählen › Bereitstellen. Danach im Editor den alten Code (Repo) wieder einspielen, damit auch die Auslöser den alten Code nutzen. |

## Stand 31.10.2026, 17:45
Umstellung angefangen, aber nicht gespeichert: Im Live-Editor sind zwei von 14 Einspiel-Schritten im Editor angewendet («Nicht gespeicherte Änderungen»), dann wurde der nächste Schritt von der Sicherheitsprüfung blockiert. Nichts ist gespeichert oder bereitgestellt; Live-Tool und Auslöser laufen mit dem alten Code.

## Stand 31.10.2026, 17:50 – live
- Code.gs und Index.html im Live-Editor eingespielt und mit dem Ziel verglichen (Code 331451 Zeichen / Hash 3993215958, Index 281132 / 4278501516), gespeichert.
- Einstellungen: Zeile «Auktionsende | Donnerstag 19:00» ergänzt.
- Bereitstellung aktualisiert: **Version 39**, 31.10.2026 17:48, «2026-10-31.1 Cockpit (Rückfall: Version 38)». Gleiche URL wie bisher.
- Rauchtest live: Cockpit lädt mit echten Daten (Bereit 72, Verkauft 30, Versendet 48, Nicht verkauft 44), To-dos 64, Panel Bereit zeigt «Do 05.11.2026 19:00». Keine Fehler in der Konsole.
- Bestand nach der Umstellung: Listings, Verkäufe, Posteingang, Gebote identisch mit der Sicherung (letzte Einträge PG-20360, 54307926, 1a19228d98bb7db2, 1333232208); Retouren leer; Log nur ergänzt.
- Rückfall: Bereitstellungen verwalten › Stift › Version 38 › Bereitstellen; danach apps/ricardo/Code.gs und Index.html aus Tag ricardo-live-vor-cockpit-2026-10-31 in den Editor, damit auch die Auslöser den alten Code nutzen.

## Tiefenprüfung 31.10.2026, 18:15
- Statisch: alle 46 Serveraufrufe der Oberfläche haben eine Funktion in `api()`; Syntax Code.gs und Oberflächen-JS ok; UI-Tests FEHLER 0.
- Mail-Abruf und alle Hilfsfunktionen gegenüber dem alten Code unverändert. Auslöser: `mailsAbholen` (:09/:39) und `suchVorrat` (alle 5 Min.) – beide Funktionen vorhanden.
- Ausführungsprotokoll seit der Umstellung: alle Läufe «Abgeschlossen» (u.a. mailsAbholen 18:09, 3.9 s). Kein Log-Eintrag ohne neue Mails ist normal.
- Echter Gebrauch: Verkaufsbericht 17:54 eingelesen, «0 neu, 6 bekannt» (keine Doppelten). Cockpit lädt in 3–6 s (erster Aufruf nach Bereitstellung bis 17 s).
- Daten: Listings, Verkäufe, Posteingang, Gebote unverändert gegenüber der Sicherung.
- Oberflächen-Paket nach Feedback Jonas (Stufentexte weg, Stand pro Quelle im Knopf, To-dos unter Verwaltung, Hinweis «Mail fehlt» im Reporting weg, Suchtext beim Wechsel leeren): im Live-Editor gespeichert (Index 281824 / 2997902977), im Test als Version 9 bereitgestellt. **Live noch nicht bereitgestellt** (Bereitstellen von der Sicherheitsprüfung gestoppt) – die Web-App läuft weiter auf Version 39. Der Servercode ist identisch, die Auslöser betrifft das nicht.
- apps/ricardo-test/build_index.py baut jetzt aus Index_basis_alt.html (alte Oberfläche, Tag ricardo-live-vor-cockpit-2026-10-31).

## Stand 31.10.2026, 18:16 – Version 40 live
Nach Go Jonas bereitgestellt: **Version 40** «2026-10-31.2 Kopf mit Quellen-Knoepfen, ohne Stufentexte (Rückfall: 39)». Servercode unverändert gegenüber Version 39 (Code 331451 / 3993215958), Oberfläche 281824 / 2997902977. Live geprüft: Kopf mit drei Quellen-Knöpfen und Stand, keine Stufentexte, To-dos unter Verwaltung, Zahlen unverändert.

## Abgleich mit Ricardo 31.10.2026, 18:20 – Version 41
- Version 41 (18:23): Abstand Kopf → Chips 28 px; «Zahlung bei Ricardo melden» jetzt auch bei versendeten Verkäufen (Etikett, To-do, «Jetzt» im Panel). Vorher verschwand die Aufgabe nach dem Versand (alter «Täglich»-Ablauf zeigte sie). Oberfläche 282399 / 815282252, Servercode unverändert.
- Verkäufe: alle 30 Verkäufe auf Ricardo-Seite 1 (29./30.10.) sind im Tool. 20 Verkäufe sind im Tool bezahlt (Bank oder von Hand), auf Ricardo aber «Zahlung ausstehend» → jetzt als To-do sichtbar.
- Angebote: 8 Stücke laufen auf Ricardo wieder (Ende 5./6.11., gleiche Artikel-Nr; vermutlich automatisch neu eingestellt), im Tool «Unverkauft»: RC-0012, AN-0035, PG-18882, AN-0015, RC-0027 (1 Gebot), PG-17549, PG-29347, AN-0026.
- PG-22902 (Feiyu): Ricardo «nicht verkauft» 29.10., im Tool noch «Gelistet» (Mail fehlte) → im Panel «Nicht verkauft» bestätigen.
- PG-18036 (Tamron): Ricardo-Angebot «nicht verkauft» 15.10., im Tool Verkauf 54000061 versendet – vermutlich Preisvorschlag nach Ablauf.
- Übrige «Nicht verkauft» auf Ricardo stimmen mit dem Tool überein.
- 18:30 (Go Jonas): die 8 wieder laufenden Angebote im Listings-Tab auf «Gelistet» gesetzt (Zeilen 51, 73, 92, 96, 112, 113, 120, 124): Gelistet am = Ricardo-Ende minus 7 Tage, Laufzeit Tage 7, Bearbeitet von «Abgleich Ricardo 31.10. (Claude)», Log-Eintrag. Cockpit danach: Online 8, Nicht verkauft 36, RC-0027 mit Gebot CHF 40.00.

## 02.11.2026
- Retoure PG-18036 (Tamron, Verkauf 54000061) nachgetragen: RT-0001 abgeschlossen (CHF 204.00 zurückbezahlt, auf Ricardo storniert laut Jonas, Entscheid Neu listen), ohne Rückzahlungs-Mail. Verkauf → Retourniert, Listing → In Arbeit (Texte behalten, «Getestet» geleert).
- Suche: Käufer auch über Vorname und Firma; Akzente und Gross/klein egal (Test tests/t_ricardo_suche_name.js). Im Live-Editor gespeichert (Code 331711 / 3729864063), Bereitstellung als Version 42 noch offen (Sicherheitsprüfung).
