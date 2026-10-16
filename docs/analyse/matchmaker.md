# Matchmaker

## Matchmaker Sheet `1xxlT767Eqc7Y0OREu4fVM-LYWyJ2tSbfz52z0SS8L1w`

| Tab | Spalten | Inhalt |
|---|---|---|
| Matchmaker | Zeile 1 Titel, Zeile 2 Status des letzten Laufs, Zeile 3 Kopf: Gesucht · Mehr Infos · Limit CHF · Suchprofil · Passt · Ähnlich 1 · Ähnlich 2 · Ähnlich 3 · Geholt (Checkbox) · **Aus Analyse** (neu, vom Analyse Tool) | 1 Zeile pro offener Suchauftrag |
| Erledigt | Geholt am · Gesucht · Mehr Infos · Limit · Suchprofil · Gefunden · Zurück in die Liste | geholte Aufträge |
| Urteile | Kennung (MD5 aus Gesucht + Mehr Infos + Suchprofil, 10 Hex) · Gesucht · Produkt · Urteil · Hinweis · Geprüft am | Cache der KI-Urteile |

Suchprofil-Format (Text, von Hand änderbar): `Art:` / `Muss:` / `Wunsch:` / `Nicht:` / `Suchwörter:`.

## Matchmaker-Script (`apps/matchmaker/Code.gs`, Version 3)

Container-gebundenes Apps-Script-Projekt im Matchmaker Sheet (Erweiterungen → Apps Script), 1 Datei `Code.gs`, 820 Zeilen. Stand im Repo = Editor am 15.10.2026.

### Konstanten

| Name | Wert | Bedeutung |
|---|---|---|
| `RETURN_TOOL_ID` | `1FpHJNeWZENdhgP6MqAYyOOEe1FN0tIZWOkRiYItOz2E` | Return Tool, nur lesen |
| `TAB` / `TAB_ERLEDIGT` / `TAB_URTEILE` | `Matchmaker` / `Erledigt` / `Urteile` | Tabs im Matchmaker Sheet |
| `BESTAND_TABS` | `Scanner`, `Analyse`, `Stationär`, `Online` | durchsuchte Tabs im Return Tool |
| `MODELL` | `claude-sonnet-5-5` | Profil und Urteil |
| `PAARE_PRO_ANFRAGE` | 60 | Paare pro Urteils-Anfrage |
| `PROFILE_PRO_ANFRAGE` | 10 | Profile pro Anfrage (Rückfall 3, dann 1) |
| `PARALLEL` | 5 | gleichzeitige Anfragen (`UrlFetchApp.fetchAll`) |
| `PASST_MAX` | 3 | Produkte in der Zelle «Passt» |
| `S` | `GESUCHT 1, INFOS 2, LIMIT 3, PROFIL 4, PASST 5, GEHOLT 9` | Spaltennummern Tab Matchmaker |
| `KOPF` | 9 Spalten A–I | Kopf beim Umbau; im Sheet heute: Gesucht · Mehr Infos · Limit CHF · Suchprofil · Passt · Ähnlich 1–3 · Geholt |

### Einstiegspunkte

| Funktion | Auslöser | Wirkung |
|---|---|---|
| `onOpen` | Sheet öffnen | Menü «Matchmaker» |
| `sucheHeute` / `sucheGestern` / `sucheAlles` | Menü | `suche_('heute' / 'gestern' / 'alles')`; gestern = am Montag der Freitag (`vortag_`) |
| `schluesselSetzen` | Menü | Script-Property `CLAUDE_API_KEY` (Wert gibt Jonas ein) |
| `onEdit` | einfacher Trigger bei Eingabe von Hand | `bearbeitetMatchmaker_` / `bearbeitetErledigt_` |

### Ablauf `suche_` → `sucheAusfuehren_`

| # | Schritt | Funktion | Detail |
|---|---|---|---|
| 0 | Sperre | `LockService.getDocumentLock().tryLock(1000)` | zweite Suche bricht ab |
| 0 | Aufräumen | `alteAutomatikEntfernen_` | löscht alte Zeit-Trigger (`automatischerLauf` u.a.) |
| 0 | Einrichten | `einrichten_` → `kopfZeile_`, `istNeu_`, `umbauen_`, `hilfsTabs_` | Kopfzeile = erste Zeile mit «Gesucht»/«Produkt» in Spalte A (bis Zeile 12); alter Aufbau wird einmalig mit Kopie umgebaut |
| 1 | Aufträge | `leseAuftraege_` | `{zeile, gesucht, infos, profil}` je nicht leerer Zeile |
| 1 | Profile | `erstelleProfile_` | nur Aufträge ohne Profil; Tool `suchprofile`; schreibt sofort in Spalte D |
| 1 | Suchwörter | `leseSuchwoerter_` | Zeile `Suchwörter:` im Profil, Wörter ≥ 3 Zeichen; fehlt sie → Fehler mit Zeilennummer |
| 1 | Kennung | `kennung_` | MD5(Gesucht + Mehr Infos + Profil), erste 5 Bytes hex |
| 2 | Bestand | `leseBestand_` | Kopf = Zeile mit Spalte «Bezeichnung»; Felder ID, Erfasst…, Link, VP, Lagerort; Filter auf Tag (`tag_`) ausser bei «alles» |
| 2 | Gruppieren | `gruppiere_` | gleiche Bezeichnung + VP = 1 Produkt mit mehreren IDs |
| 2 | Kandidaten | `findeKandidaten_` → `trifft_` | Textsuche in `norm(Bezeichnung + Link)`; Wörter ≤ 4 Zeichen als ganzes Wort, längere als Wortteil |
| 3 | Cache | `ladeUrteile_`, Schlüssel `schluessel_` = Kennung + `norm(Bezeichnung)` | gleiches Paar nie zweimal; Urteil im Tab von Hand überschreibbar |
| 3 | Urteil | `pruefeMitClaude_` | Tool `urteile`; bis 3 Runden für fehlende Nummern |
| 3 | Speichern | `speichereUrteile_` | Zeilen im Tab Urteile, Format Text |
| 3 | Aufräumen | `raeumeUrteileAuf_` | nur bei «alles»: Urteile ungültiger Kennungen löschen |
| 4 | Schutz | Vergleich `leseAuftraege_` vorher/nachher | Sheet während der Suche verändert → Fehler, nichts schreiben |
| 4 | Ausgabe | `ergebnisZeilen_` → `produktText_` | Spalten E–H; Passt grün `#d9ead3`, Ähnlich gelb `#fff2cc`; neueste Erfassung zuerst |
| 4 | Status | `status_` | Zeile 2; rot bei Fehlern, ungeprüften Paaren oder Aufträgen ohne Profil |

### Prompts (Wortlaut im Code)

| Konstante | Zweck | Ausgabe (Tool) |
|---|---|---|
| `PROFIL_SYSTEM` | Suchprofil: art, muss, wunsch, nicht, suchwoerter; Regeln für Suchwörter (Galaxus-Namen, Wortstämme, Marke nur wenn spezifisch) | `PROFIL_TOOL` `suchprofile` → `{profile:[{nr, art, muss, wunsch, nicht, suchwoerter[]}]}` |
| `URTEIL_SYSTEM` | Urteil passt / aehnlich / nein; streng; Preis zählt nicht; mehr als gewünscht ist keine Abweichung | `URTEIL_TOOL` `urteile` → `{urteile:[{nr, urteil, hinweis}]}` |

API-Aufruf `frageClaude_`: `POST https://api.anthropic.com/v1/messages`, Header `x-api-key`, `anthropic-version: 2023-06-01`, `max_tokens 16000`, `tool_choice auto`; Rückfall JSON aus Text. 3 Versuche mit 15 s Pause bei Überlast/Zeitlimit; 401/403/404/400 brechen sofort ab. `DIAGNOSE` hält den letzten Grund fest.

### Haken (`onEdit`)

| Ereignis | Wirkung |
|---|---|
| «Geholt» = TRUE (Spalte I) | Zeile → Tab Erledigt (`Geholt am`, A–D, `Gefunden` = E–H zusammengefügt, Checkbox), dann `deleteRow` |
| Text in A/B geändert | D–H der Zeile leeren, Checkbox I setzen |
| Profil D geändert | E–H leeren |
| Erledigt «Zurück in die Liste» = TRUE | A–D zurück ans Ende von Matchmaker, Checkbox I, Zeile in Erledigt löschen |

`onEdit` reagiert nur auf Eingaben von Hand, nicht auf Schreiben durch ein Script. Das Analyse Tool löst diese Haken also nicht aus.

### Zusammenspiel mit der Spalte «Aus Analyse» (Spalte J, vom Analyse Tool)

| Fall | Folge |
|---|---|
| «Geholt» | Zeile wird gelöscht, J geht mit; Erledigt übernimmt nur A–H (gewollt: Vermerk ist dann erledigt) |
| «Zurück in die Liste» | A–D kommen zurück, J bleibt leer |
| `umbauen_` | läuft nur beim alten Aufbau (Spalte D ≠ «Suchprofil»), heute nie |
| Ausgabe der Suche | schreibt nur E–H, J bleibt |

### Bekannte Schwächen (Stand Recherche 12.10.2026, `claude/nacht-recherche/03-matchmaker.md`)

| # | Schwäche |
|---|---|
| 1 | Neuer oder geänderter Auftrag wird nur gegen den Tageszugang geprüft, ausser «ganzer Bestand» läuft |
| 2 | Textsuche erzeugt fremde Produktarten (z.B. «micro» → Microsoft) |
| 3 | Änderung am Auftrag = neue Kennung, alte Urteile verfallen |
| 4 | «Geholt» bewegt den Auftrag, nicht das Produkt; keine Reservation im Return Tool |
| 5 | Scanner-Zeilen ohne PG-ID; Gruppierung nach Name + Preis |
| 6 | Laufzeitgrenze Apps Script 6 Minuten |

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
