# pg-analyse-tool

Analyse Tool von Pretty Good: geführte Prüfung von Retouren am Analyseplatz, mit KI-Recherche, Handbuch, Ersatzteilen, Ricardo-Vorbereitung, Reparatur und Matchmaker. Google Apps Script + Google Sheets.

| Pfad | Inhalt |
|---|---|
| `src/Code.gs` | Server (Apps Script), Stand = Editor |
| `src/Index.html` | Oberfläche (HTML, CSS, JS) |
| `docs/architektur.md` | Komponenten, IDs, Datenflüsse, Trigger, Sperren |
| `docs/datenmodell.md` | Tabs und Spalten (erzeugt) |
| `docs/stati.md` | Stati, Übergänge, Regale, Gründe, Stufen, Grades |
| `docs/einstellungen.md` | Einstellungen und Prompts im Wortlaut (erzeugt) |
| `docs/api.md` | Server-Funktionen (erzeugt) und externe APIs |
| `docs/secrets.md` | Wo Schlüssel liegen (nie Werte) |
| `docs/matchmaker.md` | Matchmaker Sheet, Script, Integration |
| `docs/betrieb.md` | Einspielen, Go-live, Kosten, Tests |
| `docs/entscheide.md` | Entscheid-Log |
| `data/` | Snapshot Einstellungen, extrahierte Code-Fakten |
| `tools/` | `extract.js` + `gen.py`: erzeugte Doku neu bauen |
| `tests/` | lokale Playwright-/Node-Tests |

Doku neu erzeugen: `node tools/extract.js && python3 tools/gen.py`

Regel: Jede Code-Änderung = Commit mit `VERSION`, Doku-Update und Eintrag in `docs/entscheide.md`, wenn ein Entscheid dahintersteht. Keine Schlüssel, Passwörter oder Personendaten im Repo.
