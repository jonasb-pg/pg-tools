# pg-analyse-tool

Die internen Tools von Pretty Good als Google Apps Script mit Google Sheets als Datenbank. Beide Tools sind gleich aufgebaut und teilen `Basis.gs` (Sheet-Standard).

| Tool | Zweck | Code | Doku |
|---|---|---|---|
| Analyse Tool | Geführte Prüfung von Retouren am Analyseplatz: KI-Recherche, Handbuch, Ersatzteile, Ricardo-Vorbereitung, Reparatur, Matchmaker | `apps/analyse/` | `docs/analyse/` |
| Ricardo Tool | Verkauf über Ricardo: Listings, Mails, Verkäufe, Versand, Retouren | `apps/ricardo/` | `docs/ricardo/` |
| Matchmaker | Script im Matchmaker Sheet (Suche, Profile, Urteile) | `apps/matchmaker/` | `docs/analyse/matchmaker.md` |
| Ersatzteil Tool | Internes Ersatzteillager fürs Handy: Typenschild lesen, einlagern, suchen, Online-Suche wie im Analyse Tool | `apps/ersatzteil/` | `docs/ersatzteil/` |
| Basis | Gemeinsamer Sheet-Standard: Übersicht, Tab-Reihenfolge, Farben, Schrift, Schutz | `apps/basis/Basis.gs` | `docs/gemeinsam/sheet-standard.md` |

## Aufbau

| Pfad | Inhalt |
|---|---|
| `apps/<tool>/Code.gs`, `Index.html` | Server und Oberfläche, Stand = Editor |
| `apps/basis/Basis.gs` | in jedem Apps-Script-Projekt als Datei «Basis» identisch; Quelle ist nur das Repo |
| `docs/analyse/` | Architektur, Datenmodell, Stati, Einstellungen, API, Standardablauf, Matchmaker |
| `docs/ricardo/` | Architektur, Bestand |
| `docs/gemeinsam/` | Sheet-Standard, Betrieb (Einspielen, Go-live, Tests), Secrets (nur wo, nie Werte), Entscheide |
| `data/` | Snapshot Einstellungen, extrahierte Code-Fakten (Analyse) |
| `tools/` | `tests.sh` (alle Tests), `extract.js` + `gen.py` (erzeugte Doku Analyse) |
| `tests/` | Node-Tests (Server mit Stubs) und Playwright-Tests (Oberfläche) |

## Befehle

- Alle Tests: `sh tools/tests.sh`
- Doku Analyse neu erzeugen: `node tools/extract.js && python3 tools/gen.py`

## Regeln

- Jede Code-Änderung = Commit mit erhöhter `VERSION`, Doku-Update und Eintrag in `docs/gemeinsam/entscheide.md`, wenn ein Entscheid dahintersteht.
- `Basis.gs` nur im Repo ändern und dann in beide Projekte kopieren.
- Keine Schlüssel, Passwörter oder Personendaten im Repo. Tests verwenden erfundene Namen.
- Live geht nichts ohne Go von Jonas (neue Bereitstellung im Editor).
- Ändert sich ein Ablauf für die Mitarbeitenden, das passende Prozess-Dokument nachtragen (Liste in `docs/gemeinsam/prozesse.md`).
