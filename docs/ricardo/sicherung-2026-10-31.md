# Sicherung vor der Umstellung auf das Cockpit (31.10.2026, 17:35)

| Was | Stand |
|---|---|
| Kopie Live-Sheet | «(31/10/2026) RICARDO TOOL Sicherung vor Umstellung Cockpit», ID 1etBumIWgO92tSM9yjxMEAZsLTYU_Pxw0z3QMLVT6GGM, Ordner 00_Claude-Eingang. Alle Tabs; letzte Zeilen mit dem Original verglichen (identisch). Das gebundene Skript der Kopie hat keine Auslöser und läuft nicht von selbst. |
| Bestand Live-Sheet | Listings: letzte Zeile 140 (PG-20360) · Verkäufe: letzte Zeile 80 (54307926) · Posteingang: letzte Zeile 66 (Mail-ID 1a19228d98bb7db2, 31.10.2026) · Retouren: leer · Gebote: letzte Zeile 47 · Log: letzte Zeile 2253 (31.10.2026 15:09:22, «Ricardo-Mails: 1 verarbeitet») |
| Alter Code | apps/ricardo/Code.gs (320196 Zeichen, Hash 2829083497) und Index.html (204830, 3929198557) = Stand im Live-Editor am 31.10. 17:40 (verglichen). Lokaler Tag ricardo-live-vor-cockpit-2026-10-31; ausserdem Versionsverlauf der Bereitstellung bei Google. |
| Mails | Das Tool löscht und markiert keine Mails in Gmail. Es liest nach Zeit (Script-Eigenschaft MAIL_STAND) mit einer Stunde Überlappung; doppelte Mails erkennt es an der Mail-ID im Tab «Posteingang». Script-Eigenschaften bleiben beim Code-Wechsel unverändert. Fehlt eine Mail, kann sie nachgelesen werden. |
| Nach der Umstellung prüfen | Zeilen pro Tab ≥ Bestand oben; nächster Lauf «Ricardo-Mails» im Log (alle 30 Min. 07–19 Uhr); letzte Mail-ID im Posteingang ≥ 1a19228d98bb7db2. |
| Zurück | Bereitstellen › Bereitstellungen verwalten › Stift › Version der Bereitstellung vor der Umstellung wählen › Bereitstellen. Danach im Editor den alten Code (Repo) wieder einspielen, damit auch die Auslöser den alten Code nutzen. |

## Stand 31.10.2026, 17:45
Umstellung angefangen, aber nicht gespeichert: Im Live-Editor sind zwei von 14 Einspiel-Schritten im Editor angewendet («Nicht gespeicherte Änderungen»), dann wurde der nächste Schritt von der Sicherheitsprüfung blockiert. Nichts ist gespeichert oder bereitgestellt; Live-Tool und Auslöser laufen mit dem alten Code.
