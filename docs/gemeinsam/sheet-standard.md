# Sheet-Standard (Basis)

Stand: Basis `2026-10-16.1`. Gilt für ANALYSE TOOL und RICARDO TOOL. Code: `apps/basis/Basis.gs`.

## Entscheid

| Frage | Entscheid | Grund |
|---|---|---|
| Wie teilen die Tools den Standard? | Eine Datei `Basis.gs`, in jedem Apps-Script-Projekt identisch | Eine Apps-Script-Bibliothek verlangsamt laut Google jeden Aufruf und braucht Versionierung pro Projekt. Eine kopierte Datei hat keine Laufzeitkosten. |
| Wo ist die Quelle? | Nur im Repo (`apps/basis/Basis.gs`) | Änderungen nie im Editor, sonst laufen die Kopien auseinander. |
| Wann wirkt der Standard? | Bei jedem «einrichten» | Keine Daten werden verschoben, nur Gestaltung, Reihenfolge und Übersicht. Mehrfaches Ausführen ändert nichts. |
| Spalten- und Tabnamen? | Bleiben unverändert | Beide Tools finden ihre Spalten über die Namen. |
| Automatisches Einspielen (clasp, GitHub Actions)? | Später (Phase 2) | Braucht ein Google-Login als GitHub-Secret, das Jonas selbst hinterlegt. |

## Regeln im Sheet

| Element | Standard |
|---|---|
| Erster Tab | «Übersicht», bei jedem «einrichten» neu geschrieben: Zweck, Version, alle Tabs mit Inhalt, Schreiber und Art, Legende, Regeln |
| Reihenfolge | Übersicht, Daten (weiss), Verlauf (grau), Hilfstabs (grau), Einstellungen (gelb) |
| Daten (`arbeit`) | weisser Reiter, Warnung beim Bearbeiten von Hand |
| Verlauf (`protokoll`) | grauer Reiter `#b7b7b7`, Warnung beim Bearbeiten |
| Hilfstab (`hilfe`) | grauer Reiter, ohne Warnung (Zwischenablage, Formeln) |
| Einstellung (`einstellung`) | gelber Reiter `#ffd966`, frei anpassbar |
| Schrift | Arial überall, in Datentabs 10 Punkt |
| Kopfzeile | fett auf `#efefef`, fixiert. Dunkelgrau bleibt (berechnete Spalte) |
| Tab «Einstellungen» | Einstellung (fett) · Wert (blaue Schrift = Eingabewert) · Erklärung. Gelber Zellhintergrund = noch festzulegen |
| Zeitzone | Europe/Zurich |

## Neuer Tab in einem Tool

1. Tab im Code anlegen wie bisher.
2. Eintrag im Katalog ergänzen: `ANALYSE_KATALOG` (apps/analyse/Code.gs) oder `RICARDO_KATALOG` (apps/ricardo/Code.gs) mit `tab`, `art`, `inhalt`, optional `wer` und `kopf` (Anzahl Kopfzeilen, 0 = Layout-Tab).
3. `tests/t_basis.js` prüft, dass jeder Ricardo-Tab im Katalog steht.

## Basis ändern

1. `apps/basis/Basis.gs` ändern, `BASIS_VERSION` erhöhen, `sh tools/tests.sh`.
2. Die Datei «Basis» in **beiden** Apps-Script-Projekten ersetzen und den Hash prüfen (siehe `betrieb.md`).
3. In beiden Tools «einrichten» ausführen.
