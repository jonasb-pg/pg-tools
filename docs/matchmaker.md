# Matchmaker

## Matchmaker Sheet `1xxlT767Eqc7Y0OREu4fVM-LYWyJ2tSbfz52z0SS8L1w`

| Tab | Spalten | Inhalt |
|---|---|---|
| Matchmaker | Zeile 1 Titel, Zeile 2 Status des letzten Laufs, Zeile 3 Kopf: Gesucht · Mehr Infos · Limit CHF · Suchprofil · Passt · Ähnlich 1 · Ähnlich 2 · Ähnlich 3 · Geholt (Checkbox) · **Aus Analyse** (neu, vom Analyse Tool) | 1 Zeile pro offener Suchauftrag |
| Erledigt | Geholt am · Gesucht · Mehr Infos · Limit · Suchprofil · Gefunden · Zurück in die Liste | geholte Aufträge |
| Urteile | Kennung (MD5 aus Gesucht + Mehr Infos + Suchprofil, 10 Hex) · Gesucht · Produkt · Urteil · Hinweis · Geprüft am | Cache der KI-Urteile |

Suchprofil-Format (Text, von Hand änderbar): `Art:` / `Muss:` / `Wunsch:` / `Nicht:` / `Suchwörter:`.

## Matchmaker-Script (im Matchmaker Sheet, «Matchmaker_Suche.gs», Version 3 vom 08.10.2026)

| Baustein | Logik |
|---|---|
| Menü | Suchen: heute erfasst / gestern erfasst (Montag: Freitag) / ganzer Bestand; Claude-Schlüssel setzen |
| Quelle | Return Tool `1FpHJ…Oz2E`, Tabs Scanner, Analyse, Stationär, Online (nur lesen) |
| Schritt 1 | Claude (`claude-sonnet-5-5`) schreibt pro Auftrag ein Suchprofil |
| Schritt 2 | Textsuche in Bezeichnung + Galaxus-Link (Wörter ≤ 4 Zeichen nur ganz) |
| Schritt 3 | Claude urteilt pro Paar passt / ähnlich / nein; 60 Paare pro Anfrage, 5 parallel |
| Cache | Kennung + normalisierte Bezeichnung; gleiches Paar nie zweimal |
| Ausgabe | Passt (max. 3), Ähnlich 1–3; Zeile 2 = Status |
| Geholt | verschiebt Auftrag nach «Erledigt»; «Zurück in die Liste» holt zurück; Änderung an Gesucht/Mehr Infos leert Profil und Treffer |

**Offen:** Script-Code liegt noch nicht im Repo. Aus dem Editor des Matchmaker Sheets nach `matchmaker-script/` übernehmen.

## Integration im Analyse Tool (ab Version 2026-10-15.10)

| Punkt | Umsetzung |
|---|---|
| Zeitpunkt | nach «Identität stimmt» bzw. «versiegelt», im Hintergrund (`mmStart` → `matchmaker`) |
| Eingabe | Produkt (Bezeichnung, Kategorie, Link) + bestätigte Identität (Marke, Modell, Herstellernummer) + alle offenen Aufträge (Gesucht, Mehr Infos, Suchprofil), ohne «Geholt» |
| Modell / Regeln | Einstellungen «KI-Modell Matchmaker», «Matchmaker-Anweisung» (`MM_ANWEISUNG`) |
| Ausgabe | `{passt:[…], aehnlich:[…], anzahl}`; je Treffer `{zeile, gesucht, mehr, limit, hinweis, schluessel}`; ältester Auftrag (oberste Zeile) zuerst |
| Auftrags-Schlüssel | `norm(Gesucht) + '|' + norm(Mehr Infos)` (Zeilen verschieben sich) |
| Entscheid | `passt` → nur Ausgang «Regal Matchmaker»; `ähnlich` → Hinweis, normale Ausgänge; Fehler → Warnung + «Nochmals prüfen», normale Ausgänge offen |
| Abschluss | Analysen: Regal `Matchmaker`, `Matchmaker-Auftrag`, `Stand` (JSON für Wiedereinstieg); Matchmaker Sheet: Spalte «Aus Analyse» += `PG-ID · Produkt · Datum` |
| Wiedereinstieg | Scan der PG-ID → «Matchmaker hat nicht geklappt» → `matchmakerZurueck` → Entscheid mit erneutem Abgleich ohne alten Auftrag → Analysen-Zeile nachführen (`… → nicht geklappt DATUM`), alter Auftrag erhält «PG-ID · nicht geklappt · Datum» |
| Nicht im Abgleich | nicht reusable Stücke (KO vor dem Entscheid) |
