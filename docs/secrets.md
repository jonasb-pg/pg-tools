# Schlüssel und Zugänge

Regel: Im Repo stehen nur **Name und Ort** eines Geheimnisses, nie der Wert.

| Name | Ort | Wer pflegt | Verwendet in |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | Analyse Tool: Apps Script → Projekteinstellungen → Script-Properties | Jonas | `key_()`, `kopfzeilen_()` (Header `x-api-key`, `anthropic-version: 2023-06-01`) |
| `CLAUDE_API_KEY` | Matchmaker-Script: Script-Properties, gesetzt über Menü «Claude-Schlüssel setzen» | Jonas | `suche_` → `frageClaude_` |
| Icecat-Benutzername | Sheet Einstellungen | Jonas | `icecatUrl_()`; heute offener Zugang `openIcecat-live`, vor Dauerbetrieb eigenes Konto |
| Test-WLAN Passwort | Sheet Einstellungen | Team | Anzeige im Schritt Funktion |
| Testkonten (Google, Apple-ID, Amazon, Hersteller-Apps) | Tab «Testkonten» im ANALYSE TOOL Sheet, gepflegt im Bereich «Infrastruktur»; Logindaten inkl. Passwort für das Analyse-Team sichtbar (interne Regel von Pretty Good, Entscheid 15.10.2026). Werte nie im Repo | Analyse-Team | Hausregel «Funktionen mit App und Konto nur mit Testkonto» |
| ASWO-Login | ASWO-App am Computer | Team | Ersatzteile (Rückfall-Shop) |

## Weitere Script-Properties (keine Geheimnisse)

| Name | Inhalt |
|---|---|
| `ABGLEICH_BIS` | Zeitstempel ms: Abgleich läuft bis (Sperre) |
| `ABGLEICH_ZULETZT` | Text: letzter Abgleich |
| `REPARATUR_<PG-ID>` | JSON `{was, teil, kuerzel, zeit, stand}`: Stand einer pausierten Analyse; gelöscht bei `abschliessen` |

## Berechtigungen (OAuth-Scopes, von Apps Script abgeleitet)

Sheets (eigenes + `openById` für Return Tool, HANDBÜCHER, Matchmaker), Drive (Ordner HANDBÜCHER PDF, RICARDO FOTOS), externe Requests (`UrlFetchApp`), Trigger (`ScriptApp`). «Zulassen» klickt Jonas.
