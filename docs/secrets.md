# Schlüssel und Zugänge

Regel: Im Repo stehen nur **Name und Ort** eines Geheimnisses, nie der Wert.

| Name | Ort | Wer pflegt | Verwendet in |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | Apps Script → Projekteinstellungen → Script-Properties | Jonas | `key_()`, `kopfzeilen_()` (Header `x-api-key`, `anthropic-version: 2023-06-01`) |
| Icecat-Benutzername | Sheet Einstellungen | Jonas | `icecatUrl_()`; heute offener Zugang `openIcecat-live`, vor Dauerbetrieb eigenes Konto |
| Test-WLAN Passwort | Sheet Einstellungen | Team | Anzeige im Schritt Funktion |
| Testkonten (Google, Apple-ID, Amazon, Hersteller-Apps) | nach internen Regeln von Pretty Good; geplant: Admin-Bereich im Tool | Analyse-Team | Hausregel «Funktionen mit App und Konto nur mit Testkonto» |
| ASWO-Login | ASWO-App am Computer | Team | Ersatzteile (Rückfall-Shop) |

## Weitere Script-Properties (keine Geheimnisse)

| Name | Inhalt |
|---|---|
| `ABGLEICH_BIS` | Zeitstempel ms: Abgleich läuft bis (Sperre) |
| `ABGLEICH_ZULETZT` | Text: letzter Abgleich |
| `REPARATUR_<PG-ID>` | JSON `{was, teil, kuerzel, zeit, stand}`: Stand einer pausierten Analyse; gelöscht bei `abschliessen` |

## Berechtigungen (OAuth-Scopes, von Apps Script abgeleitet)

Sheets (eigenes + `openById` für Return Tool, HANDBÜCHER, Matchmaker), Drive (Ordner HANDBÜCHER PDF, RICARDO FOTOS), externe Requests (`UrlFetchApp`), Trigger (`ScriptApp`). «Zulassen» klickt Jonas.
