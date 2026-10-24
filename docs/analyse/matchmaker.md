# Matchmaker

## Matchmaker Sheet `1xxlT767Eqc7Y0OREu4fVM-LYWyJ2tSbfz52z0SS8L1w`

| Tab | Spalten | Inhalt |
|---|---|---|
| Matchmaker | Zeile 1 Titel, Zeile 2 Status des letzten Laufs (immer die Zeile über dem Kopf), Zeile 3 Kopf: Gesucht · Mehr Infos · Limit CHF · Suchprofil · Passt · Ähnlich 1 · Ähnlich 2 · Ähnlich 3 · Geholt (Checkbox) · **Aus Analyse** (vom Analyse Tool) | 1 Zeile pro offener Suchauftrag; Spalten werden über den Kopf gefunden (ab .3) |
| Erledigt | Geholt am · Gesucht · Mehr Infos · Limit CHF · Suchprofil · Gefunden · Zurück in die Liste · **Aus Analyse** (ab .3, wird in bestehenden Tabs ergänzt) | geholte Aufträge |
| Urteile | Kennung (MD5 aus Gesucht + Mehr Infos + Suchprofil, 10 Hex) · Gesucht · Produkt · Urteil · Hinweis · Geprüft am · Produkt-Schlüssel (ab .2) | Speicher der KI-Urteile |

Suchprofil-Format (Text, von Hand änderbar): `Art:` / `Muss:` / `Wunsch:` / `Nicht:` / `Suchwörter:`.

## Matchmaker-Script (`apps/matchmaker/Code.gs`, Version 2026-10-24.3)

Container-gebundenes Apps-Script-Projekt im Matchmaker Sheet (Erweiterungen → Apps Script), 1 Datei `Code.gs`, rund 1500 Zeilen. **Gespeicherter Code ist sofort live** (der Haken `onEdit` läuft mit dem gespeicherten Stand). Die Suche läuft als die Person, die im Menü klickt.

### Konstanten

| Name | Wert | Bedeutung |
|---|---|---|
| `RETURN_TOOL_ID` | `1FpHJNeWZENdhgP6MqAYyOOEe1FN0tIZWOkRiYItOz2E` | Return Tool, nur lesen |
| `TAB` / `TAB_ERLEDIGT` / `TAB_URTEILE` | `Matchmaker` / `Erledigt` / `Urteile` | Tabs im Matchmaker Sheet |
| `BESTAND_TABS` | `Scanner`, `Analyse`, `Stationär`, `Online` | durchsuchte Tabs im Return Tool, bewusst fest (Vertrag V4). Fehlt einer: Status rot, Ergebnis nicht überschrieben |
| `ANALYSE_ID` / `ANALYSE_TAB` | ANALYSE TOOL / `Analysen` | Ausschluss: Regal Matchmaker, Ricardo Offline, Reusable Nein (letzte Zeile pro PG-ID) |
| `RICARDO_ID` / `RICARDO_TAB` / `RICARDO_FREI` | `1liRzxIAKCSKGS5-uN3FkFcboN_Luqd2Ar5Ae57cSmvg` / `Listings` / wie `FREI` im Ricardo Tool | Ausschluss Ricardo (Vertrag V5a), nur lesen |
| `UMPACK_ID` / `UMPACK_TAB` | `1VexhXpyWyGTVaKiH7BPLPNQyENKYA-flgeRs-FPN-IA` / `Änderungen` | Ausschluss Umpack (Vertrag V5b), nur lesen |
| `MODELL` | `claude-sonnet-5-5` | Profil und Urteil |
| `PAARE_PRO_ANFRAGE` | 60 | Paare pro Urteils-Anfrage |
| `PROFILE_PRO_ANFRAGE` | 10 | Profile pro Anfrage (Rückfall 3, dann 1) |
| `PARALLEL` | 5 | gleichzeitige Anfragen (`UrlFetchApp.fetchAll`) |
| `PAARE_PRO_LAUF` | 900 | höchstens so viele Paare pro Lauf, Rest «Noch N Paare offen» |
| `ZEIT_NEUE_ANFRAGE_MS` | 270 000 (4½ Min) | Zeitbremse: danach keine neue Anfrage an Claude |
| `ZEIT_AUFRAEUMEN_MS` | 300 000 (5 Min) | «Ganzer Bestand» räumt die Urteile nur auf, wenn bis hier noch Zeit ist |
| `PASST_MAX` | 3 | Produkte in der Zelle «Passt» |
| `SPALTEN` | Kopf-Muster | Spalten des Tabs Matchmaker über den Kopf (`spalten_`); Pflicht: Gesucht, Mehr Infos, Suchprofil, Passt, Ähnlich 1–3 (nebeneinander), Geholt |
| `KOPF` / `S` | 9 Spalten A–I | nur noch für den Umbau vom alten Aufbau |
| `KOPF_ERLEDIGT` | 8 Spalten, zuletzt «Aus Analyse» | Tab Erledigt, gelesen über den Kopf (`spaltenErledigt_`) |

### Einstiegspunkte

| Funktion | Auslöser | Wirkung |
|---|---|---|
| `onOpen` | Sheet öffnen | Menü «Matchmaker» |
| `sucheHeute` / `sucheGestern` / `sucheAlles` | Menü | `suche_('heute' / 'gestern' / 'alles')`; gestern = am Montag der Freitag (`vortag_`) |
| `schluesselSetzen` | Menü | Script-Property `CLAUDE_API_KEY` (Wert gibt Jonas ein); Hinweis auf Ausgabenlimite |
| `onEdit` | einfacher Trigger bei Eingabe von Hand | `bearbeitetMatchmaker_` / `bearbeitetErledigt_` |

### Ablauf `suche_` → `sucheAusfuehren_`

| # | Schritt | Funktion | Detail |
|---|---|---|---|
| 0 | Sperre | `LockService.getScriptLock().tryLock(1000)` | zweite Suche bricht ab; Schreiben ins Sheet zusätzlich in der Dokument-Sperre, immer `flush` vor dem Freigeben (Vertrag V1) |
| 0 | Einrichten | `einrichten_` → `kopfZeile_`, `istAlt_`, `umbauen_`, `spalten_`, `hilfsTabs_` | Kopf = erste Zeile (bis 12) mit «Gesucht»; Umbau nur beim alten Aufbau «Produkt DE \| Product EN …»; fehlt eine Spalte: «Spalten verschoben – bitte Kopfzeile prüfen» |
| 0 | Status | `status_` | «Suche läuft seit hh:mm …» (rot), bis der Lauf fertig ist |
| 1 | Aufträge | `leseAuftraege_` | `{zeile, gesucht, infos, profil}` über die Kopfspalten |
| 1 | Profile | `erstelleProfile_` → `profileSchreiben_` | nur Aufträge ohne Profil; in der Sperre in die Zeile mit gleichem Text und leerem Profil (sonst per Inhalt, sonst übersprungen) |
| 1 | Suchwörter | `leseSuchwoerter_` | fehlt die Zeile `Suchwörter:`, fällt nur dieser Auftrag aus (rot, mit Zeile) |
| 1 | Kennung | `kennung_` | MD5(Gesucht + Mehr Infos + Profil), erste 5 Bytes hex (unverändert seit .1) |
| 2 | Bestand | `leseBestand_` | Kopf = Zeile (bis 12) mit «Bezeichnung»; Pflicht: Bezeichnung, Barcode, Lagerort, ID (nicht Scanner); ohne Link: Kategorie im Suchtext |
| 2 | Ausschluss | `ausschluesse_` → `leseErledigt_`, `leseRicardo_`, `leseUmpack_`, `leseErledigtTab_` | IDs normalisiert (`pgNorm_`); siehe unten |
| 2 | Gruppieren | `gruppiere_` | gleiche Bezeichnung + VP + Barcode (sonst Link) = 1 Produkt; Stücke ohne ID eigene Produkte |
| 2 | Kandidaten | `findeKandidaten_` → `trifft_` | immer der ganze Bestand (auch im Tageslauf); Wörter ≤ 4 Zeichen als ganzes Wort |
| 3 | Speicher | `ladeUrteile_`, `urteilFuer_` | Schlüssel Kennung + Produkt-Schlüssel; alte Schreibweise (`schlAlt`) und Zeilen ohne Schlüssel gelten weiter; das neuste Urteil gilt |
| 3 | Urteil | `pruefeMitClaude_` → `frageClaude_` | nur Paare ohne Urteil; im Tageslauf zuerst die Stücke des Tages (`reihenfolge_`); bis 3 Runden; Antworten ab 1 nummeriert oder mit falschem Kontrollnamen werden verworfen |
| 3 | Speichern | `speichereUrteile_` | nach jeder Gruppe, Format Text |
| 3 | Aufräumen | `urteileAufraeumen_` → `raeumeUrteileAuf_` | nur «ganzer Bestand»: Urteile von Kennungen, die weder im Tab Matchmaker noch in «Erledigt» stehen; erst schreiben, dann das Ende leeren |
| 4 | Ausgabe | `trefferPaare_`, `ergebnisZeilen_` → `produktText_` | Spalten Passt/Ähnlich; ohne PG-ID nie «Passt» |
| 4 | Schreiben | `schreibeErgebnis_` | in der Sperre pro Kennung in die jetzige Zeile; neu erfasste oder geänderte Aufträge bleiben leer (rot). Return Tool nicht vollständig gelesen: nichts schreiben |
| 4 | Status | `status_` | Zeile über dem Kopf (Kopf in Zeile 1: Hinweis unten rechts); rot, sobald etwas nicht geprüft oder nicht lesbar war |

### Ausschlüsse (welche Stücke keine Kandidaten sind)

| Quelle | Regel | Nicht lesbar |
|---|---|---|
| ANALYSE TOOL, Tab «Analysen» | letzte Zeile pro PG-ID: Regal Matchmaker oder Ricardo Offline, oder Reusable Nein | rot, nichts ausgeschlossen |
| Ricardo Tool, Tab «Listings» (Spalten über den Kopf: PG-ID, Status, Bündel-IDs, Entscheid unverkauft) | pro PG-ID zählt die nicht freie Zeile, sonst die letzte; ausgeschlossen bei Status nicht frei oder Entscheid «Entsorgung», samt Bündel-IDs | rot, nichts ausgeschlossen |
| ANALYSE TOOL «Ricardo Offline» + Ricardo frei mit Entscheid «Anderer Kanal» | wieder frei (Z7) | – |
| Umpack Tool, Tab «Änderungen» | Zeilen ohne «Erledigt», Aktion «Verkaufen» oder «Entsorgen»; Durchgänge «… (zurückgenommen)» zählen nicht | rot, nichts ausgeschlossen |
| Tab «Erledigt», Spalte «Aus Analyse» | Vermerk «ID · …»: pro Auftrag zählt je ID die letzte Zeile; «nicht geklappt» oder «Ricardo» heben auf (gleich wie `mmVermerkIds_` im Analyse Tool) | rot |

### Prompts (Wortlaut im Code)

| Konstante | Zweck | Ausgabe (Tool) |
|---|---|---|
| `PROFIL_SYSTEM` | Suchprofil: art, muss, wunsch, nicht, suchwoerter; Regeln für Suchwörter; Nummern ab 0, Kontrollname `gesucht` | `PROFIL_TOOL` `suchprofile` → `{profile:[{nr, gesucht, art, muss, wunsch, nicht, suchwoerter[]}]}` |
| `URTEIL_SYSTEM` | Urteil passt / aehnlich / nein; streng; Preis zählt nicht; Nummern ab 0, Kontrollname `produkt` | `URTEIL_TOOL` `urteile` → `{urteile:[{nr, produkt, urteil, hinweis}]}` |

API-Aufruf `frageClaude_`: `POST https://api.anthropic.com/v1/messages`, Header `x-api-key`, `anthropic-version: 2023-06-01`, `max_tokens 16000`, `tool_choice auto`; Rückfall JSON aus Text. 3 Versuche mit 15 s Pause bei Überlast/Zeitlimit; 401/403/404/400 brechen sofort ab. Wirft `fetchAll` (Verbindung), wird die Gruppe einzeln mit `UrlFetchApp.fetch` nachgefragt, sonst in der nächsten Runde. Nach der Zeitbremse keine neue Gruppe. `DIAGNOSE` hält den letzten Grund fest.

### Haken (`onEdit`)

| Ereignis | Wirkung |
|---|---|
| «Geholt» = TRUE (Spalte über den Kopf) | in der Dokument-Sperre: **alle** angehakten Zeilen → Tab Erledigt (`Geholt am`, Gesucht, Mehr Infos, Limit, Suchprofil, `Gefunden` = Passt + Ähnlich, Checkbox, **Aus Analyse**), dann von unten nach oben gelöscht (`geholtAlle_`) |
| Text in Gesucht/Mehr Infos geändert | Suchprofil und Ergebnis der Zeile leeren, Checkbox Geholt setzen |
| Suchprofil geändert | Ergebnis leeren |
| Erledigt «Zurück in die Liste» = TRUE | in der Sperre: **alle** angehakten Zeilen zurück ans Ende von Matchmaker (mit «Aus Analyse»), Checkbox Geholt, Zeilen in Erledigt löschen (`zurueckAlle_`) |
| Sperre besetzt (Suche schreibt) | Haken zurück auf FALSE, Hinweis «Die Suche schreibt gerade …» |
| Kopf verschoben | Hinweis «Spalten verschoben – bitte Kopfzeile prüfen …» statt still nichts tun |

`onEdit` reagiert nur auf Eingaben von Hand, nicht auf Schreiben durch ein Script. Das Analyse Tool löst diese Haken also nicht aus.

### Zusammenspiel mit der Spalte «Aus Analyse» (Spalte J, vom Analyse Tool)

| Fall | Folge |
|---|---|
| «Geholt» | Vermerk geht mit nach «Erledigt» (Spalte «Aus Analyse»). Das Analyse Tool setzt im ANALYSE TOOL, Tab «Matchmaker», das Stück von «Offen» auf «Geholt» (Vertrag V5); das Matchmaker-Script schliesst das Stück aus |
| «Zurück in die Liste» | Vermerk kommt zurück; fehlt die Spalte im Tab Matchmaker, wird sie angelegt (rechts der letzten beschrifteten Spalte, wie im Analyse Tool) |
| `umbauen_` | nur beim alten Aufbau («Produkt DE \| Product EN …»), heute nie |
| Ausgabe der Suche | schreibt nur Passt und Ähnlich 1–3, «Aus Analyse» bleibt |

### Urteile von Hand korrigieren (Tab «Urteile»)

| Weg | So geht es |
|---|---|
| Bestehende Zeile ändern (einfachster Weg) | In der Zeile des Urteils Spalte D auf `passt`, `ähnlich` oder `nein` setzen, Hinweis in E. Gilt ab dem nächsten Lauf. |
| Neue Zeile ohne Produkt-Schlüssel | Kennung (aus einer Zeile des Auftrags kopieren), Gesucht, Produkt (Bezeichnung genau wie im Return Tool), Urteil, Hinweis, **Geprüft am = heutiges Datum (TT.MM.JJJJ)**, Spalte G leer. Gilt für alle Produkte dieser Bezeichnung beim Auftrag und gewinnt, wenn sie neuer ist als das Urteil mit Schlüssel (späteres Datum; bei gleichem Datum die untere Zeile). Ohne Datum gewinnt sie nicht. |
| Neu beurteilen lassen | Die Zeile(n) des Paars löschen; der nächste Lauf fragt Claude. |

### Bekannte Schwächen (Stand Recherche 12.10.2026, `claude/nacht-recherche/03-matchmaker.md`), Stand .3

| # | Schwäche | Stand .3 |
|---|---|---|
| 1 | Neuer oder geänderter Auftrag wird nur gegen den Tageszugang geprüft, ausser «ganzer Bestand» läuft | behoben: jeder Lauf prüft jedes Paar ohne Urteil im ganzen Bestand |
| 2 | Textsuche erzeugt fremde Produktarten (z.B. «micro» → Microsoft) | offen (Claude sortiert sie aus, kostet Urteile) |
| 3 | Änderung am Auftrag = neue Kennung, alte Urteile verfallen | offen (gewollt: geänderter Auftrag wird neu beurteilt) |
| 4 | «Geholt» bewegt den Auftrag, nicht das Produkt; keine Reservation im Return Tool | teilweise: «Aus Analyse» geht mit, Stück wird ausgeschlossen, ANALYSE TOOL setzt «Geholt» (V5); Return Tool bleibt «nur lesen» |
| 5 | Scanner-Zeilen ohne PG-ID; Gruppierung nach Name + Preis | teilweise: ohne PG-ID nie «Passt»; Gruppierung jetzt Name + Preis + Barcode/Link |
| 6 | Laufzeitgrenze Apps Script 6 Minuten | behoben: Zeitbremse nach 4½ Minuten, Rest im Status |

## Prüfung 24.10.2026 (Version 2026-10-24.3)

Umsetzung der unabhängigen Code-Prüfung (19 Befunde, dazu Z6, Z7, Z12 aus der Zusammenspiel-Prüfung und Vertrag V1–V5). Nur im Repo, nicht eingespielt. Tests einzeln: `node tests/t_matchmaker_p2410_<name>.js` (Gerüst `t_matchmaker_p2410_h.js`).

| Befund | Änderung (Funktion) | Test | Status |
|---|---|---|---|
| 1 Hoch: zwei «Geholt» kurz nacheinander verschieben den falschen Auftrag, auch «Zurück in die Liste» | `bearbeitetMatchmaker_` → `geholtAlle_`, `bearbeitetErledigt_` → `zurueckAlle_`: in der Sperre alle angehakten Zeilen, von unten nach oben gelöscht; nie die Zeile aus dem Ereignis | `haken` | behoben |
| 2 Hoch: Suchprofile nach Zeilennummer ohne Sperre | `erstelleProfile_` sammelt, `profileSchreiben_` schreibt in der Sperre in die Zeile mit gleichem Gesucht-/Mehr-Infos-Text und leerem Profil, sonst per Inhalt, sonst übersprungen (Auftrag fällt aus diesem Lauf) | `suche` | behoben |
| 3 Hoch: Tageslauf prüft neue/geänderte Aufträge nur gegen den Tageszugang | `findeKandidaten_` immer ganzer Bestand; an Claude gehen nur Paare ohne Urteil, im Tageslauf die Stücke des Tages zuerst (`reihenfolge_`); begrenzt durch `PAARE_PRO_LAUF` und Zeitbremse, Rest «Noch N Paare offen» | `suche` | behoben (weiter gefasst als vorgeschlagen: jedes Paar ohne Urteil, nicht nur Aufträge ohne jedes Urteil; Paare mit Urteil kosten nichts) |
| 4 Hoch: Spalte eingefügt oder «Suchprofil» umbenannt startet den alten Umbau; Haken still tot | `kopfZeile_`, `istAlt_`, `spalten_`, `spaltenErledigt_`: Spalten über den Kopf; Umbau nur beim alten Aufbau; sonst Fehler «Spalten verschoben – bitte Kopfzeile prüfen …»; der Haken meldet es | `sheet` | behoben |
| 5 Mittel: Return-Tool-Tab fehlt/umbenannt, Treffer verschwinden, Status nicht rot; umbenannter Kopf «Barcode» ändert alle Produkt-Schlüssel | `leseBestand_`: Kopf in Zeile 1–12, Pflichtspalten Bezeichnung, Barcode, Lagerort, ID (Scanner ohne ID); `sucheAusfuehren_`: rot, Passt/Ähnlich werden nicht überschrieben | `sheet` | behoben |
| 6 Mittel (Z1): Ricardo listet direkt aus dem Return Tool, Umpack verkauft/entsorgt – nicht ausgeschlossen | `leseRicardo_` (V5a), `leseUmpack_` (V5b), `ausschluesse_` | `ausschluss` | behoben |
| 7 Mittel: «Ganzer Bestand» löscht Urteile von Aufträgen in «Erledigt» samt Hand-Korrekturen; erst leeren, dann schreiben | `urteileAufraeumen_`: gültig = Kennungen vom Laufbeginn + Tab Matchmaker + Tab Erledigt (in der Sperre gelesen), nur mit genug Zeit, nicht bei unlesbarem «Erledigt»; `raeumeUrteileAuf_`: erst die bleibenden Zeilen schreiben, dann das Ende leeren | `sheet` | behoben |
| 8 Mittel: Claude nummeriert ab 1 statt 0 | `verschoben_` (Nummer 0 fehlt, Nummer n kommt vor → Antwort verwerfen, nachfragen), `echoPasst_` mit neuen Tool-Feldern `produkt` / `gesucht`; Prompt «Nummern beginnen bei 0» | `suche` | behoben. Grenze: der Kontrollname vergleicht Wortanfänge; ist er der Anfang eines längeren Nachbarnamens («Dualit Toaster» / «Dualit Toaster Zubehör»), fällt ein Vertauschen nicht auf |
| 9 Mittel: 6-Minuten-Limit ohne Zeitbremse, Status bleibt alt | `suche_`: «Suche läuft seit hh:mm …» (rot); `zeitUm_` mit `ZEIT_NEUE_ANFRAGE_MS` in `frageClaude_`, `pruefeMitClaude_`, `erstelleProfile_`; Ergebnis und «Noch N Paare offen» werden geschrieben | `zeit`, `t_matchmaker_script` | behoben |
| 10 Mittel: Verbindungsfehler in fetchAll bricht den ganzen Lauf ab | `frageClaude_`: try/catch um `fetchAll`, Gruppe einzeln mit `UrlFetchApp.fetch`, sonst nächste Runde | `zeit` | behoben (ist Claude in einer ganzen Runde gar nicht erreichbar, bricht der Lauf weiter laut ab; gespeicherte Urteile bleiben) |
| 11 Mittel: Wochenende/vergessene Tage nie geprüft | wie 3; der Status nennt «… dazu jedes Paar ohne Urteil im ganzen Bestand» | `suche` | behoben (ein gemerktes Datum des letzten Laufs ist so nicht nötig) |
| 12 Mittel: Status fest in Zeile 2 | `status_`: Zeile über dem Kopf, Kopf in Zeile 1: Hinweis (toast) | `sheet` | behoben |
| 13 Niedrig: mehrere Haken «Geholt» auf einmal | wie 1 | `haken` | behoben |
| 14 Niedrig: ein Profil ohne «Suchwörter:» blockiert alle | `sucheAusfuehren_`: nur dieser Auftrag fällt aus, rot mit Zeile und Gesucht | `suche` | behoben |
| 15 Niedrig: Schlussprüfung ohne Profil; jede Zeilenänderung verwirft alles | `schreibeErgebnis_`: pro Kennung (Text + Profil) in die jetzige Zeile; neu erfasste oder geänderte Aufträge bleiben leer, rot | `suche`, `t_matchmaker_script` | behoben |
| 16 Niedrig: Hand-Korrektur als neue Zeile ohne Schlüssel wirkt nicht | `ladeUrteile_`, `urteilFuer_`, `neuer_`: das neuste Urteil gilt (Datum Spalte F, bei gleichem Datum die untere Zeile) | `suche` | behoben; Anleitung oben unter «Urteile von Hand korrigieren» (eine Notiz im Tab selbst ist nicht umgesetzt) |
| 17 Niedrig: Claude-Schlüssel für alle Bearbeiter nutzbar | nicht lösbar im gebundenen Script; Hinweis beim Setzen (`SCHLUESSEL_HINWEIS`) | `sheet` | teilweise – Ausgabenlimite von Hand (unten) |
| 18 Niedrig: Stücke ohne Link, deren Bezeichnung keine Produktart enthält, nie Kandidat | `leseBestand_`: ohne Link kommt «Kategorie» in den Suchtext; Status zählt Stücke ohne Shop-Link | `ausschluss` | behoben |
| 19 Niedrig: «Geholt» markiert das Stück nicht | `geholtAlle_` / `zurueckAlle_` / `hilfsTabs_`: «Aus Analyse» mit nach «Erledigt» und zurück; `leseErledigtTab_` / `ausAnalyseIds_`: Stücke geholter Aufträge ausgeschlossen. «Geholt» im ANALYSE TOOL setzt das Analyse Tool (V5) | `haken`, `ausschluss` | behoben (Matchmaker-Teil) |
| Z6: IDs normalisiert vergleichen | `pgNorm_` (Vertrag V3) für ANALYSE TOOL, Ricardo, Umpack, «Aus Analyse» | `ausschluss` | behoben |
| Z7: «Ricardo Offline» + Ricardo frei mit «Anderer Kanal» | `ausschluesse_`: wieder frei | `ausschluss` | behoben |
| Z12: Scanner-Stücke ohne PG-ID nie unter «Passt» | `gruppiere_` (eigene Produkte), `ergebnisZeilen_` («passt» → «Ähnlich» mit Hinweis «passt, aber ohne PG-ID …») | `ausschluss`, `t_matchmaker_script` | behoben |
| V1: flush vor releaseLock | alle Sperren (`bearbeitetMatchmaker_`, `bearbeitetErledigt_`, `profileSchreiben_`, `schreibeErgebnis_`, `urteileAufraeumen_`, `suche_`) | `haken`, `suche`, `zeit` | behoben |
| V2: Zeilen anhängen bei vollem Tab | `geholtAlle_` (Erledigt), `zurueckAlle_` (Matchmaker); `speichereUrteile_` hatte es schon | `haken` | behoben |
| V3: Barcode vergleichen | `bcKey_` nach V3; `bcKeyAlt_` + `schlAlt`: Urteile mit dem Schlüssel der alten Schreibweise gelten weiter | `ausschluss` | behoben |

Geänderte bestehende Tests (Verhalten absichtlich geändert): `tests/t_matchmaker_script.js` – Version .3; Scanner-Stück jetzt unter «Ähnlich» (Z12); «Sheet verändert» schreibt die unveränderten Aufträge (Befund 15); «zweite Gruppe wirft» ersetzt durch die Zeitbremse, weil ein Verbindungsfehler den Lauf nicht mehr abbricht (Befunde 9, 10).

### Nachprüfung 24.10.2026 (Befund 4)

`ausAnalyseIds_(zellen, tage)`: Ein Stück im Vermerk «Aus Analyse» eines geholten Auftrags ist nur ausgeschlossen, solange es nach dem Vermerk nicht nochmals analysiert wurde. `tage` = Tag der letzten Analyse je Stück aus dem ANALYSE TOOL (`leseErledigt_`, Spalte «Ende»), das Datum des Vermerks steht am Zeilenende (vor «· Fotos:»). Gleicher Tag oder Vermerk ohne Datum: weiter ausgeschlossen. So wird eine Retoure wieder angeboten. Gleiche Regel wie `mmGeholt_` im Analyse Tool. Test: `tests/t_matchmaker_p2410_nachpruefung.js`.

### Beim Einspielen

| Was | Folge |
|---|---|
| Speichern im Editor | sofort live, auch für den Haken `onEdit`. Keine neuen Berechtigungen (SpreadsheetApp.openById und UrlFetchApp gab es schon). |
| Erster Haken «Geholt» oder erste Suche | Tab «Erledigt» bekommt den Kopf «Aus Analyse» als Spalte H (ist H belegt: nächste freie). Alte Zeilen bleiben. Bis dahin meldet das Analyse Tool einmal am Tag «Spalte «Aus Analyse» fehlt». |
| Tab «Matchmaker» | keine neue Spalte («Aus Analyse» gibt es als J). Fehlt eine Pflichtspalte im Kopf, bricht die Suche mit «Spalten verschoben» ab, statt umzubauen. |
| Urteile | Kennungen unverändert, nichts wird gelöscht oder neu bezahlt. Barcodes mit «(01)», «01»-Präfix (16 Ziffern), Bindestrich oder Apostroph in der Mitte haben einen neuen Produkt-Schlüssel; ihre alten Urteile gelten über die alte Schreibweise weiter. |
| Kosten im ersten Lauf | neu an Claude nur: Paare ohne Urteil (neue oder geänderte Aufträge seit 09:45) und neue Kandidaten über die Kategorie bei Stücken ohne Link. Begrenzt durch 900 Paare und die Zeitbremse. |
| Spalte J «Aus Analyse» (Nachprüfung) | Vor dem Go-live durchsehen: Ein Eintrag «PG-… · …» ohne späteres «nicht geklappt»/«Ricardo» reserviert den Auftrag im Analyse Tool sofort (Z5/Z8). Für Stücke, die anders weitergegangen sind, eine Zeile «PG-… · nicht geklappt · Datum» ergänzen. |
| Ergebnis ändert sich | Scanner-Stücke wandern von «Passt» nach «Ähnlich»; Stücke auf Ricardo, im Umpack Tool verkauft/entsorgt oder bei geholten Aufträgen verschwinden aus den Listen. |
| Status rot im ersten Lauf | wenn die Person, die sucht, Ricardo Tool oder Umpack Tool nicht lesen kann (Grund steht im Status), oder wenn ein Return-Tool-Tab eine Pflichtspalte nicht hat (dann bleiben Passt/Ähnlich auf dem alten Stand). |
| Tagesläufe | dauern etwas länger (Kandidaten im ganzen Bestand), kosten aber nur für Paare ohne Urteil. |

### Von Hand zu tun

| # | Was | Wer |
|---|---|---|
| 1 | In der Anthropic Console für den Claude-Schlüssel des Matchmaker-Scripts eine monatliche **Ausgabenlimite** setzen (am besten eigener Schlüssel oder eigener Workspace nur für den Matchmaker). Alle, die das Matchmaker Sheet bearbeiten dürfen, können das Script und damit den Schlüssel nutzen (Befund 17). | Jonas |
| 2 | Freigaben: Die Suche läuft als die Person, die im Menü klickt. Sie braucht mindestens Leserechte auf Return Tool, ANALYSE TOOL, **RICARDO TOOL** (`1liRzxIAKCSKGS5-uN3FkFcboN_Luqd2Ar5Ae57cSmvg`) und **UMPACK TOOL Datenbank** (`1VexhXpyWyGTVaKiH7BPLPNQyENKYA-flgeRs-FPN-IA`). Fehlt eine Freigabe, steht das rot im Status, und Stücke von dort werden nicht ausgeschlossen. | Jonas (Besitzer der Sheets) |
| 3 | Nach dem Speichern einmal «Suchen: ganzer Bestand» starten und den Status lesen: grau = gut; rot = Grund steht dort (Freigabe, Spalte im Return Tool, Kopfzeile). | Jonas |
| 4 | Team informieren: Stücke ohne PG-ID stehen nur noch unter «Ähnlich»; Hand-Korrektur wie oben («Urteile von Hand korrigieren»); Kopfzeilen im Tab «Matchmaker» und «Erledigt» nicht umbenennen (Spalten einfügen geht). | Jonas |
| 5 | Das Analyse Tool (Vertrag V5, `mmGeholt_`) liest «Erledigt» → «Aus Analyse». Matchmaker zuerst oder gleichzeitig einspielen. | Koordination |

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
