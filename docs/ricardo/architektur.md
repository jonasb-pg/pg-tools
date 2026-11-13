# Architektur Ricardo Tool

Stand: Version `2026-10-24.4` (Umsetzung der Prüfung vom 24.10.2026 und Etikette direkt drucken, siehe `pruefung-2026-10-24.md`; nicht bereitgestellt). Davor `2026-10-24.1` (Datenintegrität nach Audit: Suche über alle Kanäle, Doppelprüfung, Zuordnung der Verkäufe). Vorher `2026-10-21.2` (Matchmaker-Stücke per Scan auf Ricardo). Live: Bereitstellung Version 26 (21.10.2026, 15:06; neue Version nur mit Go von Jonas). Abläufe Täglich, Listing, Packen, Versenden als geführte Fälle; Retouren unter Verwaltung. Post-Adressprüfung ausgeschaltet (kostenpflichtig, Entscheid Jonas 19.10.2026).

## Komponenten

| Komponente | Typ | ID / Adresse | Rolle |
|---|---|---|---|
| Ricardo Tool (Code) | Apps Script, an Sheet gebunden | Script `17okxNkNUeGHE_XLKjqxvAE7APSV6D0IusWQsfm1igLX7pvpU9GjYh_hE` | `Code.gs`, `Index.html`, `Basis.gs` (gemeinsam, siehe `../gemeinsam/sheet-standard.md`) |
| RICARDO TOOL | Google Sheet | `1liRzxIAKCSKGS5-uN3FkFcboN_Luqd2Ar5Ae57cSmvg` | Datenbank; Übersicht im ersten Tab |
| ANALYSE TOOL | Google Sheet | `1jhmq1JoyM6Xor33pM77AmOixbvqKuGzfFX-js9PdIrM` | liest Tab «Ricardo» und «Matchmaker»; schreibt nur den Status im Tab «Matchmaker» auf «Ricardo», wenn ein Listing startet (`mmAufRicardo_`); scheitert das, startet das Listing nicht |
| Return Tool | Google Sheet | `1FpHJNeWZENdhgP6MqAYyOOEe1FN0tIZWOkRiYItOz2E` | **nur lesen** |
| Ricardo-Mails | Gmail (Google-Gruppe care@pretty-good.ch) | Suche `from:<Mail-Absender>` | Verkäufe, Zahlungsmeldungen, Fragen, Preisvorschläge |
| Claude API | extern | `https://api.anthropic.com/v1/messages` | Titel, Beschrieb, Antwortentwürfe (Haiku) |
| Post API | extern | developer.apis.post.ch, Anwendung «Ricardo Tool Pretty Good» | Etiketten (Barcode API, `etikette`); Adressprüfung ausgeschaltet (kostenpflichtig) |
| Zebra Browser Print | lokal auf dem PC am Etikettendrucker | `https://127.0.0.1:9101` | nimmt ZPL-Etiketten aus der Seite und schickt sie an den Zebra ZD220 (Prüfung E1); fehlt es, Download |

## Tabs

Siehe Tab «Übersicht» im Sheet und `RICARDO_KATALOG` in `apps/ricardo/Code.gs`. Daten: Listings, Verkäufe, Posteingang, Retouren, Wochenübersicht. Verlauf: Log. Hilfstab: Post-Adressen. Einstellungen: Einstellungen, Versand. Der frühere Tab «Doku» ist seit `2026-10-16.4` Teil der Übersicht.

## Auslöser

| Funktion | Takt | Zweck |
|---|---|---|
| `mailsAbholen` | alle 30 Min., wirkt nur im Fenster «Mails prüfen zwischen» (07:00–19:00) | Ricardo-Mails lesen, Verkäufe und Aufgaben anlegen |
| `mailsJetzt` | beim Öffnen der Web-App, höchstens alle 5 Min. | dasselbe sofort |
| `suchVorrat` | alle 5 Min., wirkt 06–21 Uhr | Kopien für die Suche im Zwischenspeicher (Schlüssel `rt1:…`): Analyse und Such-Tabs jedes Mal, Hinweis-Tabs alle 10 Min., Archive stündlich. Liest nur. «einrichten» legt den Auslöser an und füllt die Kopien (`vorratEinrichten_`) |

`mailsAbholen` und `suchVorrat` tun nichts, wenn sie aus der Web-App aufgerufen werden (`vonWebApp_`); `einrichten`, `postTest`, `postAdresseTest` laufen nur im Editor (`nurEditor_`).

## Datenintegrität (2026-10-24.1, Audit vom 24.10.2026)

Gleiche Fehlerart wie im Analyse Tool: Stücke mit PG-ID im Return Tool wurden übersehen und bekamen eine zweite Nummer.

| Regel | Umsetzung (`apps/ricardo/Code.gs`) |
|---|---|
| Suche liest alles | `suche`: ANALYSE TOOL, Such-Tabs (listbar), Hinweis-Tabs (Einstellung, Vorgabe `HINWEIS_TABS`: Stationär, Analyse, Berner Brocki, Caritas, Heilsarmee, Scanner; Listen nur nach Bestätigung), Tabs «Archiv…» (`ARCHIV_MUSTER` = `/^archiv/i`, Vertrag V4, nur anzeigen; ohne Kopfzeile einmal pro Tag gemeldet und übersprungen), neue Kanal-Tabs mit Kopf ID + Bezeichnung und «Scanner» auch ohne Eintrag als Hinweis-Tabs (`rtTabs_`), eigener Tab «Listings» (`listingsZeilen_`). Fehlt ein Tab oder seine Kopfzeile: Fehler (`leseQuelle_`) |
| Nummern normalisiert | Vertrag V3: `idNorm_`/`nrNorm_` (`ID_MUSTER`: PG, AN, RC, RT, ET mit Trenner und führenden Nullen), reine Zahl ab 4 Stellen als PG-Nummer, `normEan_` ohne GS1-«(01)» und führende Nullen |
| Warnungen | `warnungen_`: gleiche EAN aus verschiedenen Quellen mit anderer Nummer («möglicherweise dasselbe Stück»), gleiche Nummer auch im Archiv |
| Start eines Listings | `vorpruefen_` liest Analyse und Return Tool frisch (ohne Sperre); Archiv sperrt; vergebene Stücke (Entscheid «Anderer Kanal»/«Entsorgung», `ENTSCHEID_GEBUNDEN`) sperren |
| Nur PG-ID (Entscheid Jonas 24.10.2026) | `freiesListing` bricht ab («Nur Stücke mit PG-ID. Bitte zuerst im Return Tool erfassen.»), der Weg in der Oberfläche ist entfernt. Bestehende RC-Listings bleiben gültig (`neuAusRc_`, Bündel). Bei «nicht gefunden» zeigt `aehnlicheStuecke` / `freiKandidaten_` ähnliche Stücke (EAN, Nummer, Galaxus-Artikelnummer gegen Spalte «Link», Marke + 60 % der Wörter) aus Return Tool inkl. Archiv, Analyse und Listings, ohne Anlegen |
| Verkäufe zuordnen | `listingKarte_` / `verkaufZuordnen_`: Artikel-Nr vor Referenz; frühere Links (Spalte «Frühere Links», gefüllt von `markiereGelistet`) und Widersprüche ändern keinen Status, sondern legen einen Hinweis «W-<Verkauf-Nr>» im Posteingang an; zweiter Verkauf auf verkauftes Stück ebenso, dazu `doppelt` in `ablauf('taeglich')` |
| «Unverkauft» von Hand | `setzeStatus(id, 'Unverkauft', bestaetigt)`: offene unzugeordnete Verkäufe verlangen Bestätigung; passt einer (Artikel-Nr, früherer Link, ähnlicher Titel), gesperrt |
| Kleinere | Rückzahlung höchstens Preis + Porto; `MAIL_LETZTE` erst nach erfolgreichem Schreiben; Preisvorschlag ohne bekanntes Angebot: «Prüfen» |
| Review 24.10.2026 | Verkauf über den Link einer alten (freien) Zeile, während dasselbe Stück auf einer neueren Zeile offen/gelistet ist: Hinweis, kein Status. Fehlende Hinweis-/Archiv-Tabs: Meldung «Tab X nicht lesbar» (`quelleSicher_`), nur Such-Tabs hart. «einrichten» entfernt «Spenden» aus den Hinweis-Tabs (`hinweisTabsBereinigen_`). Rückzahlung über Preis + Porto oder ohne Preis: Bestätigung. Zweiter Suchdurchgang liest nur Such-Tabs und Analyse frisch. 4–7 Ziffern auch im Namen. Knöpfe in der Suche über Liste/Index (`startAus`). Bündel-Teil gegen Archiv geprüft. Nummer aktiv und im Archiv: Bestätigung (`starteListing(id, auchAndere, archivOk)`) |

Neue Spalte in «Listings» (am Ende): `Frühere Links`. Vor dem Bereitstellen «einrichten» ausführen: hängt die Spalten an und stellt die alte Vorgabe der Hinweis-Tabs (mit «Spenden») auf die heutigen Kanal-Tabs um. Ohne «einrichten» meldet die Web-App «Das Sheet passt nicht zu dieser Version».

## Prüfung 24.10.2026 (2026-10-24.4)

Einzelheiten, Tests und offene Punkte: `pruefung-2026-10-24.md`.

| Regel | Umsetzung (`apps/ricardo/Code.gs`, `Index.html`) |
|---|---|
| Rückfragen am Server | `starteListing(id, auchAndere, bestaetigt)`, `buendelHinzu(id, zusatzId, bestaetigt)`: Fehler «Bitte bestätigen: … [kürzel]», Kürzel `archiv`, `mm`, `kanal`, `rt`, `analyse`. Die Oberfläche (`bestaetigen`, `mitBestaetigung`) sammelt die bestätigten Kürzel und ruft nochmals auf; `true` (alt) gilt nur für `archiv`. Englisch: `enMitKuerzel_` |
| Matchmaker (Vertrag V5) | «Offen» → Rückfrage `[mm]`, dann `mmAufRicardo_` (nur wenn noch «Offen»; scheitert → kein Listing/kein Bündel); «Geholt» sperrt. Gilt auch für Bündel-Teile und wenn die Suche das Stück nur aus dem Return-Tool-Tab «Analyse» kennt |
| Analyse-Stück und Return Tool | anderer Kanal-Tab → `[kanal]`, nicht im Return Tool → `[rt]`, Lagerort «Analyse» → `[analyse]` (`vorFreigabe_`, `rtPasstZurAnalyse_`) |
| Status | «Gelistet» nur aus «In Arbeit»/«Bereit» (`markiereGelistet`; bei «Gelistet» Link ersetzen nur mit Rückfrage, alter Link nicht in «Frühere Links»); offene Zeile mit neuerer Zeile danach = abgelöst (`listingsIndex_`, `entscheidUnverkauft` auf der offenen Zeile); Storno bezahlt/nicht versendet mit Rückfrage und Aufgabe «Rückzahlung»; «Unverkauft» ohne Entscheid startet nicht neu, «Neu listen» entscheidet auf derselben Zeile; Verkauf auf vergebenes/anders gebundenes Stück → Hinweis «W-…», kein Status (`verkaufStatusErlaubt_`); Admin-Löschen mit Statusprüfung; `adminVerkaufZuordnen` |
| Ricardo-Links | nur Angebotslinks `ricardo.ch/…/a/…<Nr>` (`RICARDO_ANGEBOT`), ohne Query; Doppel über die Artikel-Nr. Oberfläche ohne Inline-onclick mit Server-Text (`data-akt`, `AKTIONEN`) |
| Sperre | Externe Aufrufe (Return Tool, ANALYSE TOOL, Gmail, Claude, MailApp, Post) vor oder nach der Sperre; `sperre_` meldet «gerade beschäftigt», `sperreHalten_` macht `SpreadsheetApp.flush()` vor `releaseLock` (V1) und loggt «Lange Sperre» ab 30 s; die Warteschlange der Seite wiederholt «beschäftigt» bis 3 Mal mit Hinweis |
| Zurückschreiben | `zurueckschreiben_`: Spalte A frisch prüfen, verschobene Zeilen über die Nummer finden, sonst nicht schreiben (Log «Zeile verschoben»); `kopfPruefen_` vor jedem Schreiben; Anhängen nach V2 (`anhaengen_`) |
| Verkäufe | Bericht gleicht bekannte Verkäufe ab (`abgleichen_`), Schlüssel Order ID + Article ID; Mail-Abruf blättert bis 500 Verläufe, unbekannte Betreffe im Log; Kennzahlen ohne «Retourniert» |
| Regal | «Zu packen» = «Ricardo Online» (noch nicht gepackt), Packliste zeigt das Regal, den Return-Tool-Ort nur als Hinweis (Z10) |
| Etikette (E1, Nach-Review) | Einstellung «Etiketten-Format»: `PDF` (Vorgabe, auch wenn sie fehlt; 300 dpi, Download) oder `ZPL` (Post ZPL2, 200 dpi, A6, erst nach Testdruck). ZPL nur, wenn die Seite `['zpl','pdf']` mitschickt (`etikette(nr, vorschau, neu, formate)`); alte Seiten bekommen PDF mit Feld `pdf`. Sendungsnummer wird in der frisch gesuchten Zeile gespeichert, bei besetzter Sperre (45 s) ohne Sperre nach Prüfung der Zeile; zweite Etikette nur nach Rückfrage. ZPL: Zebra Browser Print (`GET /default?type=printer`, 1,5 s, dann `POST /write`), Fehler vor dem Senden oder Fehlerantwort → Download `.zpl`, gesendet ohne Antwort → «unklar» (kein Download). Warnungen des Servers bleiben als «stop» stehen |

Nach-Review 24.10.2026: `pruefung-2026-10-24.md`, Abschnitt «Nach-Review»; Tests `tests/t_ricardo_p2410_nachreview.js`, `tests/t_ricardo_p2410_nachreview_ui.py`.

Tests: `tests/t_ricardo_integritaet.js` (Server), `tests/t_ricardo_integritaet_ui.py` (Oberfläche), `tests/t_ricardo_integritaet_daten.py` (Suche gegen eine Momentaufnahme des echten Return Tools; ohne Datei übersprungen). Prüfung 24.10.2026: `tests/t_ricardo_p2410_status.js`, `_verkauf.js`, `_quellen.js`, `_en.js` (Server, gemeinsame Umgebung `_hilfe.js`), `tests/t_ricardo_p2410_ui.py` (Oberfläche, Zebra Browser Print gestubbt).

## Adresse von Hand (30.10.2026)

Anlass (Jonas 30.10.2026): Der Verkaufsbericht von Ricardo enthält Verkäufe vom gleichen Tag noch nicht (Log 30.10.: zweimal «0 neu, 44 bekannt», die sechs Verkäufe vom Morgen fehlten), die Verkaufs-Mail hat keine Adresse. Packen ging dann nur mit Warten. `adresseLesen_(text)` liest den von der Ricardo-Verkaufsseite kopierten Block «Lieferadresse»: Kopfzeilen («Lieferadresse», «Verkauft an»), Land, Mail und Telefon werden übersprungen; letzte Zeile «PLZ Ort» (auch CH-/FL-), davor Strasse mit Nummer (`strasse_`) oder «Postfach n», davor Name (letzte Zeile, letztes Wort = Nachname) und Firma (Zeilen davor). Eine einzige Zeile vor «PLZ Ort» gilt mit Hausnummer als Strasse (Name fehlt), sonst als Name (Strasse fehlt). `adresseVonHand(nr, text, ueberschreiben)` schreibt die acht Spalten Firma bis Ort (als Text), nur bei offenen Verkäufen; vorhandene Adresse nur nach Rückfrage `[adr]`; Log «Adresse von Hand». Der Bericht überschreibt eine so eingetragene Adresse nicht (`abgleichen_` füllt nur bei leerem Nachnamen und PLZ). Oberfläche: Packen-Schritt «Etikette» bei «Adresse fehlt»: Knopf «Verkauf öffnen» (Ricardo-Verkaufsseite) und Feld «Adresse einfügen» (`adresseHandFeld`, Aktion `adresseHand`); danach Name und Ort statt Hinweis, Liste nachgeführt. Tests: tests/t_ricardo_adresse_hand.js, tests/t_ricardo_ablauf_ui.py.

## Sendungsnummer von Hand (29.10.2026)

`sendungSetzen(nr, sendung, ueberschreiben)` schreibt die Spalte «Sendungsnummer» im Tab «Verkäufe» (8–40 Zeichen, Ziffern, Buchstaben, Punkt, Strich). Eine andere vorhandene Nummer wird nur nach Rückfrage (`[sn]`) ersetzt; Log «Sendungsnummer von Hand». Die Zelle wird als Text geschrieben (`setNumberFormat('@')`), damit reine Ziffernfolgen genau bleiben. Oberfläche: Feld im Packen-Schritt «Etikette» (`sendungFeld`), auch ohne eingelesene Adresse; Text «Sendungsnummer eingetragen», wenn sie nicht aus dem Tool kommt. Beim Versenden steht die Nummer wie bisher zum Kopieren bereit.


## 13.11.2026 – «No bid» bei verkauften Stücken (Version 44, 2026-11-13.1, live 14:10; Rückfall Version 43)
- Befund: 8 Listings vom 05.11. hatten Ricardo-Links mit 9-stelliger Nummer (…-198580646). Ricardo kennt diese Nummern nicht (Weiterleitung auf die Startseite). Gebote, Verkäufe und «nicht verkauft» werden über die Artikel-Nr zugeordnet, darum: «Noch kein Gebot», Status blieb «Gelistet», Verkäufe ohne PG-ID oder nur Hinweis.
- Datenkorrektur 13.11. ~13:58 (Go Jonas): echte Artikel-Nr laut «Mein Verkaufen» eingetragen (PG-18036 1334607728, AN-0068 1334612492, PG-15724 1334609534, PG-23278 1334609952, PG-25337 1334610246, PG-17444 1334612980, PG-23491 1334613952, PG-25148 1334614386); Verkäufe 54597821, 54598307, 54598396 zugeordnet (PG-ID, Versandklasse); Listings auf Versendet (PG-18036, PG-15724, PG-23278, PG-17444) bzw. Verkauft (AN-0068, PG-23491) mit Verkauf-Nr, Preis, Daten wie listingVerkauft_; PG-25337 und PG-25148 «Unverkauft» (Ricardo: 0 Gebote, Ende 12.11.); Hinweise WV-54597821/-54598307/-54598396 erledigt; Log-Einträge «Claude (Korrektur 13.11.)». Kontrolle danach: keine kurzen Links mehr, jeder Verkauf seit Oktober mit PG-ID und passendem Listing (ausser 4 alte Verkäufe ohne Ref. und PG-17575, siehe unten).
- Code: markiereGelistet lehnt Links mit Artikel-Nr unter 10 Stellen ab (auch beim Ersetzen), Meldung DE/EN. Lesen von Links (Mails, frühere Links) unverändert. Test tests/t_ricardo_link_1311.js; alle Ricardo-Tests grün. Prüfsumme Code.gs 332900 / 707229625 (Editor = Repo).
- PG-17575 Doro: Entscheid «Anderer Kanal» (26.10.), danach per Preisvorschlag auf Ricardo verkauft (54409516, 03.11.) und von Emma versendet. Jonas 13.11. 14:18: bestätigt. Listing Zeile 3 am 13.11. ~14:25 von Hand im Sheet nachgetragen (Sheets-Verbindung ausgefallen, darum über Chrome): Versendet, Verkauft am und Versendet am 03.11.2026, Preis 100, Verkauf-Nr 54409516 (Text), Bearbeitet von «Korrektur 13.11. (Claude)». Kein Eintrag im Tab Log.
