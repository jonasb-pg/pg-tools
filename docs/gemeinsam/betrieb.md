# Betrieb

## Änderung einspielen (Test)

| # | Schritt | Prüfung |
|---|---|---|
| 1 | Änderung lokal in `apps/<tool>/Code.gs` / `Index.html` (oder `apps/basis/Basis.gs`), `VERSION` erhöhen | |
| 1b | `sh tools/tests.sh` | alle ok |
| 2 | `node --check` auf Code.gs (als .js) und auf die `<script>`-Blöcke aus Index.html | Syntax OK |
| 3 | Code.gs in `vm.runInNewContext` mit Stubs (Session, PropertiesService, Utilities, SpreadsheetApp, DriveApp, ScriptApp, HtmlService, LockService, UrlFetchApp) | «top-level OK» (fängt `ReferenceError … before initialization`) |
| 4 | Oberfläche lokal mit Playwright, `google.script.run` gestubbt | keine `pageerror`, Screenshots ansehen |
| 5 | Zeilen-Patch in den Monaco-Editor des Scripts (prüft Zeilenzahl vorher) | djb2-Hash und Länge im Editor = lokal |
| 6 | Speichern (Strg+S / Symbol) | «In Google Drive gespeichert» |
| 7 | Test-Adresse `/dev` neu laden | Version unten links |
| 8 | Bei Änderung an `Basis.gs`: Datei «Basis» in beiden Projekten ersetzen, Hash prüfen | Hash in beiden Editoren = Repo |
| 9 | Nach Änderungen an Tabs oder Basis: «einrichten» ausführen | Tab «Übersicht» zeigt neue Version |
| 10 | Commit ins Repo mit Doku-Update | |
| 11 | Bei einer neuen Bereitstellung (Live-Version): Sheet «TOOL LINKS» nachführen (Spalten Bereitstellung, Code-Version, Stand) | Zeile des Tools aktuell |

## Sheet «TOOL LINKS»

Sheet `1tkG0_EAGmBKguUhgcvjo621YGfPEeKxWObY-EtzP8nU` (Ordner 00_Claude-Eingang), Tab «Tools»: pro Tool Web-App (live), Test-Adresse (/dev), Sheet, Apps-Script-Projekt, Bereitstellungs-ID, Bereitstellung, Code-Version, Stand. Das Sheet ist die einzige Stelle für die Adressen; Doku im Repo verweist darauf. Pflicht: Jede neue Bereitstellung und jedes neue Tool wird dort eingetragen (Regel Jonas, 19.10.2026).

Wichtig: Konstanten, die in Top-Level-Objekten (`SPALTEN`, `NEUE_EINSTELLUNGEN`) vorkommen, müssen **vor** diesen deklariert sein (`const` hat eine Temporal Dead Zone). Fehler vom 15.10.2026: `RICARDO_VERSAND`.

## Go-live-Checkliste

| # | Punkt | Wer |
|---|---|---|
| 1 | Jonas hat Ricardo im Test durchgespielt | Jonas |
| 2 | Einstellung «Web-App-Adresse für Fotos» leeren | Claude/Jonas |
| 3 | Trigger `pg.inventarisierung` löschen | Jonas |
| 4 | Icecat: eigenes Konto statt `openIcecat-live` | Jonas |
| 5 | Recherche-Guthaben und Handbuch-Guthaben setzen | Jonas |
| 6 | Testkonten angelegt, im Tab Testmittel auf «Ja» | Team |
| 7 | Operations-Konto auf pretty-good.ch fürs Foto-Handy | Jonas |
| 8 | Bereitstellung: neue Version, Zugriff «Jeder in pretty-good.ch», Ausführen als Jonas | Jonas (Go) |
| 9 | Matchmaker: erster echter Treffer, Spalte «Aus Analyse» im Matchmaker Sheet prüfen | Jonas |

## Kosten (Preise je 1 Mio. Tokens, `PREISE` in Code.gs)

| Modell | Input | Output | Einsatz |
|---|---|---|---|
| `claude-sonnet-5-5` | USD 2 | USD 10 | Recherche, Ersatzteile, Matchmaker |
| `claude-haiku-5-5` | USD 0.10 | USD 0.50 | Handbuch lesen, Ricardo-Text |
| Websuche | USD 0.01 pro Suche | | Recherche, Ersatzteile, Handbuch-Suche |
| Batch API | −50 % | | Vorab-Recherche |

Jeder KI-Aufruf schreibt eine Zeile in den Tab «Kosten» (`kostenzeile_`). Richtwerte: Vorab-Recherche ≈ USD 0.28/Produkt, Handbuch USD 0.05–0.10, Matchmaker ≈ USD 0.01/Produkt (Sonnet, ~70 Aufträge).

## Tests (lokal, nicht im Repo-CI)

Alle auf einmal: `sh tools/tests.sh`. `t_basis.js` prüft die gemeinsame Basis mit beiden Tools.

| Skript | Prüft |
|---|---|
| `t_hv.py` | Handbuch-Ansicht, Suche |
| `t_shop.py` | Ersatzteil-Shops, Infoknopf |
| `t_fb.py` | Feedback |
| `t_ric.py` | Ricardo-Teil, Foto-Seite |
| `t_rep.py` | Später reparieren, Fortsetzen |
| `t_mm.py` / `t_mm.js` | Matchmaker-Entscheid, Wiedereinstieg, Server-Auswertung |
