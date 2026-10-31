# Ricardo Tool Umbau – Checkliste alt → neu

Stand 30.10.2026. Quelle: Übersetzungstabelle T in Index.html (Live 2026-10-30.1) und ruf()-Aufrufe. Jede Zeile muss im neuen UI eine Stelle haben.

| Bereich alt | Funktion im Live-Tool (Schlüssel im Code) | Neu: Stufe / Stelle | Verhalten | Geprüft von Jonas |
|---|---|---|---|---|
| Global | Feedback-Knopf (fb.*) → Sheet FEEDBACK TOOLS | Knopf unten in der Sidebar, auf jeder Seite | gleich |  |
| Global | Sprache DE/EN | Sidebar unten | gleich |  |
| Global | Zähler «{0} Angebote aktiv», Warnung Limite | Chip «Online» mit Zahl, Warnung orange ab Limite | gleich |  |
| Global | Hinweis Mail-Abruf inaktiv / letzte Mail / keine Mail seit … / unechte Mails (a.inaktiv, a.letzte, a.warnung, a.unecht) | Kopfzeile «Mails hh:mm» + Warnbalken oben, Details Einstellungen › Betrieb | gleich |  |
| Täglich | Bank-Export hochladen (xlsx/csv), Zuordnung Nummer → Name+Betrag, sicher/prüfen/schon erfasst, angehakte als bezahlt (f.t1.*) | Knopf «Bank-Export einlesen» oben → Panel B1 | gleich |  |
| Täglich | Fehler Dateiformat / Excel-Leser (f.t1.format, f.t1.bibliothek) | Meldung im Panel B1 | gleich |  |
| Täglich | Zahlung bei Ricardo melden, «Gemeldet» (f.t2.*) | Stufe Bezahlt › Jetzt: Schritt 1 abhaken | gleich |  |
| Täglich | Preisvorschläge mit Empfehlung, Frist, «Erledigt» (f.t3.*, a.vorschlag, a.frist, a.verpasst) | Stufe Online › Jetzt: Preisvorschlag (Empfehlung, Frist), Erledigt | gleich |  |
| Täglich | Fragen und Nachrichten, Antwortentwurf, kopieren + Ricardo öffnen, «Erledigt» (f.t4.*, a.entwurf, a.keinentwurf, a.nachricht) | Stufe Online › Frage; auch in Verkauft/Versendet, wenn Nachricht zu einem Verkauf | gleich |  |
| Täglich | Unbezahlte erinnern ab N Tagen, Erinnerungstext, «Erinnerung gesendet» (f.t5.*, a.erinnerung, a.erinnert) | Stufe Verkauft › Zahlung: Erinnerungstext kopieren, Erinnerung gesendet | gleich |  |
| Täglich | Käufer meldet bezahlt (a.meldet, v.meldet) | Stufe Verkauft: Hinweis im Panel und Spalte Offen | gleich |  |
| Täglich | Storno prüfen ab N Tagen, Frage «vorher auf Ricardo stornieren» (f.t6.*) | Stufe Verkauft › Zahlung: Verkauf stornieren (Frage) → Stufe Storniert | gleich |  |
| Täglich | Retouren-Übersicht, Regal «Retouren», Provision 60 Tage (f.t7.*) | Stufe Retouren | gleich |  |
| Täglich | Farbstufen Aufgaben: orange ab 4 h, rot ab 24 h (a.text) | Spalte «Offen»: Tag-Farbe nach Alter | gleich |  |
| Listing | Stück wählen: Analyse-Liste (ana.*), Suche EAN/Name (such.*) | Listing Schritt 1 | gleich |  |
| Listing | Suche-Fälle: nicht gefunden, anderer Kanal + «Trotzdem listen», ähnliche Stücke, Archiv, eigene Listings, mehrfach, ohne ID, gesperrt, kein Preis, im Bündel (such.*) | Listing Schritt 1, Trefferliste mit gleichen Meldungen | gleich |  |
| Listing | Regal «Ricardo Offline» holen (such.hilfe, f.s1.physisch) | Listing Schritt 1 Hilfetext; Chip «Bereit» = Regal Ricardo Offline | gleich (Mockup sagte fälschlich «Bereit») |  |
| Listing | Angefangen oder wieder zu listen (f.s1.angefangen) | Listing Schritt 1, zweite Liste | gleich |  |
| Listing | Zustand: Gebraucht / Neu und originalverpackt / Neu (gemäss Beschreibung) / Defekt; Mängel Pflicht je Zustand (s1.*) | Listing Schritt 2 › Prüfen | gleich (Mockup hatte A/B/C/D – falsch) |  |
| Listing | Versandklasse bis 2 / 10 / 30 kg / Sperrgut, Masse aus Return Tool, Versandkosten (s1.klasse, k.*, s1.masse, s1.versand) | Listing Schritt 2 › Prüfen | gleich |  |
| Listing | Geprüft-Haken, Angaben speichern, Pflichtfeld-Meldungen (s1.geprueft, s1.speichern, s1.*.fehlt) | Listing Schritt 2 › Prüfen | gleich |  |
| Listing | Aus der Analyse gesperrt: Zustand/Prüfung nicht änderbar (ana.gesperrt) | Listing Schritt 2 › Prüfen (Felder gesperrt mit Hinweis) | gleich |  |
| Listing | Bündel bilden: PG-ID/RC hinzufügen, auflösen, Preise summiert (b.*) | Listing Schritt 2 › Bündel (aufklappbar) | gleich |  |
| Listing | Titel und Beschrieb erstellen (Claude oder Bausteine), Zeichenzähler, speichern, ersetzen-Frage, Analyse-Text wiederherstellen, englische Lesehilfe (s2.*) | Listing Schritt 2 › Text | gleich |  |
| Listing | Fotos: Ordner öffnen, QR-Code-Hinweis (f.fotos.*) | Listing Schritt 2 › Erfassen | gleich |  |
| Listing | Kopierfelder in Ricardo-Reihenfolge: Fotos, Titel, Produkttyp, Zustand, Beschreibung, Referenz-Nr, Angebotsart Auktion, Startpreis, Laufzeit Donnerstag 19.00, Reaktivierung aus, Versand, Abholung, Boost keinen (f.*) | Listing Schritt 2 › Erfassen | gleich (Mockup hatte 3/7/10 Tage + Festpreis – falsch) |  |
| Listing | Felder zum Kopieren erst wenn vollständig / gespeichert (s3.offen, s3.zu, a.offen, a.fertig) | Listing Schritt 2 › Erfassen | gleich |  |
| Listing | Link + Laufzeit eintragen, «Als gelistet speichern», Regal Ricardo Online, Listing abbrechen (s4.*) | Listing Schritt 3 | gleich |  |
| Listing | Kopieren nicht möglich-Meldung (kopie.fehler) | überall | gleich |  |
| Laufende Angebote | Liste, Filter, Gebot-Stand, abgelaufen, Laufzeit-Hinweis (u.*) | Chip «Online» (abgelaufene oben) | gleich |  |
| Laufende Angebote | «Bearbeiten» (zurück ins Listing) | Stufe Online › Panel: Bearbeiten | gleich |  |
| Laufende Angebote | «Unverkauft» von Hand mit Warnungen (u.frage, u.laeuft, u.unzug, f.s2.ohnemail) | Stufe Online › Panel: Als nicht verkauft setzen (gleiche Warnungen) | gleich |  |
| Laufende Angebote | Angebot kopieren auf Ricardo (f.s2.kopieren, g.kopieren.oeffnen) | Stufe Nicht verkauft › Neu listen → Listing mit «Altes Angebot kopieren» | gleich |  |
| Packen | Verkaufsbericht importieren, Zeitraum 7 Tage, Warnungen, neu/bekannt/ohne Zuordnung, Adressen ergänzt, fehlten (v.import*, v.neu, v.ohne, v.warnungen, v.ergaenzt, v.fehlten) | Knopf «Verkaufsbericht einlesen» oben → Ergebnis-Panel | gleich |  |
| Packen | Nicht verkauft: Entscheid Neu listen / Anderer Kanal / Entsorgung, Regal-Hinweise (f.s2.nicht*, f.e.*) | Stufe Nicht verkauft | gleich |  |
| Packen | Adresse fehlt → Verkaufsbericht oder von Hand (v.ohneadr, g.p.adr.*) | Stufe Verkauft › Jetzt: Adresse (immer überschreibbar) | gleich + überschreibbar (neu) |  |
| Packen | Etikette drucken (Post API), neue Etikette mit Warnung, Post-Zugang fehlt, Sendung {0} (f.s2.etikette*, f.s2.sendung, f.s2.post.fehlt) | Stufe Verkauft › Packen | gleich |  |
| Packen | Sendungsnummer von Hand (g.p.sendung.k, g.tz.hand.k) | Stufe Verkauft › Packen | gleich |  |
| Packen | Adressliste für die Post, eine Datei pro Versandklasse (v.post*) | Stufe Verkauft › Liste: Knopf «Adressliste Post» | gleich |  |
| Packen | Packmaterial-Hinweis Karton/Klebeband/Matchmaker-Karte/Care-Flyer (f.s2.packen.physisch, v.a2) | Stufe Verkauft › Packen Hilfetext | gleich |  |
| Packen | «Gepackt» → Ricardo Unpaid (v.gepackt, v.a3) | Stufe Verkauft › Packen | gleich |  |
| Packen | Zahlung von Hand mit Frage (v.bezahlt, v.f.bezahlt) | Stufe Verkauft › Zahlung | gleich |  |
| Versenden | Gepackt und bezahlt-Liste, Sendungsnummer kopieren, «Versendet» mit Frage, nicht bezahlte bleiben (f.s3.*, v.versendet, v.f.versendet) | Stufe Bezahlt | gleich |  |
| Retouren | Eröffnen: Verkauf suchen (bezahlt+versendet), Grund Defekt/Transportschaden/Falscher Artikel, IBAN, Strasse, Notiz, Frage, Mail an «Rückzahlungen an» (rt.neu*, rt.iban, rt.adresse, rt.f.eroeffnen, rt.mail.*) | Stufe Retouren › + Retoure eröffnen; aus Stufe Versendet › Retoure | gleich |  |
| Retouren | Schritte: Rückzahlung gemacht (Frage), Bei Ricardo storniert (auto per Mail, Link, Frist), Was passiert mit dem Stück (rt.s2, rt.s3*, rt.s4) | Stufe Retouren › Panel Schritte | gleich |  |
| Retouren | Info offen/abgeschlossen/Rückzahlungen (rt.info) | Chip Retouren + Kopf im Panel | gleich |  |
| Admin | Betrieb: Verbindungen testen, Sheet öffnen, Mail-Status, Auslöser, Claude (adm.*) | Seite Einstellungen › Betrieb | gleich |  |
| Admin | Kennzahlen: Woche/Monat/alles/von-bis, Umsatz, Auszahlung, Quote, Preis vom Neupreis, nach Grade, Verlauf, Jetzt-Block, ohne-Mail-Warnung, Definitionen (zr.*, kz.*) | Seite Zahlen | gleich |  |
| Admin | Storno: Suche alles, Listings/Verkäufe, Löschen mit Fragen (ad.*) | Seite Einstellungen › Storno; Admin-Block unten im Panel jedes Stücks | gleich |  |
| Admin | Verkauf zuordnen (ad.zuordnen, adminVerkaufZuordnen) | Panel › Admin-Block | gleich |  |
| Admin | Feedback-Liste mit Status Neu/Erledigt (af.*) | Seite Einstellungen › Feedback | gleich |  |
| Admin | Einstellungen speichern, Claude-Schlüssel-Hinweis, Versandtarife im Sheet (ad.einst*, ad.ki.*) | Seite Einstellungen | gleich |  |
| Status | Listings: In Arbeit, Bereit, Gelistet, Verkauft, Versendet, Storniert, Unverkauft, Abgebrochen | Chips: Bereit (In Arbeit+Bereit), Online (Gelistet), Verkauft, Bezahlt, Versendet, Nicht verkauft (Unverkauft), Retouren, Storniert | Sheet-Werte bleiben, nur Anzeige |  |
| Status | Verkäufe: Zu packen, Wartet auf Zahlung, Bereit zum Versand, Bezahlt und versendet, Retourniert, Retour abgeschlossen | Verkauft = Zu packen + Wartet auf Zahlung (Fahne gepackt); Bezahlt = Bereit zum Versand; Versendet = Bezahlt und versendet | Sheet-Werte bleiben, nur Anzeige |  |

## Testumgebung (30.10.2026)

- Sheet «RICARDO TOOL TEST»: Kopie des Live-Sheets vom 30.10.2026 21:41, ID 1L3VJnSpWt07hKIECrjgM-pnblWh4t1U6VKRay0YQ45s (gleicher Ordner wie das Live-Sheet)
- Apps-Script-Projekt «Ricardo Tool TEST» (gebunden), ID 1V3AN4R-rvMCxFNwDzYyy5zu8MNz0GYRwfnS7jBYWxz1B41ydloSmf_M0; Dateien Code.gs, Index.html, Basis.gs (Basis.gs ist im Live-Projekt, aber nicht im Repo – nachholen)
- Code.gs = Live 2026-10-30.1 + `const TEST = true` (apps/ricardo-test/Code.gs): kein Schreiben ins Analyse Tool (mmAufRicardo_), keine Rückzahlungs-Mail, Feedback als «Ricardo Tool TEST», Titel «Ricardo Tool TEST»
- Script-Eigenschaften werden nicht kopiert: kein Claude-Schlüssel (Texte aus Bausteinen), kein Post-Zugang (keine Etiketten), kein Mail-Abruf (MAIL_KONTO fehlt, keine Auslöser)
- Web-App Version 1, 30.10.2026 21:44: https://script.google.com/a/macros/pretty-good.ch/s/AKfycbzXpMsUGUpZXGrHcbi2maSvDbY4KbSIs3OPJwgy04A3yatw11VixLa9eJ1_pDkx8lty/exec (Jeder in Pretty Good)
- Vor Übernahme ins Live-Tool: nur Index.html übernehmen, TEST-Schalter nicht mitnehmen

## Stand Umbau (30.10.2026, 22:12)

- Web-App Version 2 im Testprojekt: neues Index.html nach dem Stufenmodell (apps/ricardo-test/Index.html, gebaut aus apps/ricardo/Index.html + apps/ricardo-test/cockpit.js mit build_index.py).
- Code.gs im Test = Live + TEST-Schalter + neue Funktion `cockpit()` (nur Lesen, setzt ablauf/verkaeufe/uebersicht/retouren zusammen; versendete Verkäufe der letzten 60 Tage). Für die Übernahme ins Live-Tool ist `cockpit()` als Ergänzung nötig, der TEST-Schalter nicht.
- Alle bisherigen Ansichten und Funktionen bleiben im Code (Abläufe Täglich/Packen/Versenden sind nur aus der Navigation genommen); der Listing-Ablauf ist unverändert der einzige Flow.
- Tests: tests/t_ricardo_cockpit_ui.py (Cockpit, Panels, Handlungen, Zubringer, Suche, Navigation, Englisch) und die bisherigen UI-Tests t_ricardo_ui, t_ricardo_aufgaben_ui, t_ricardo_admin_ui (mit #nav-einst), t_ricardo_p2410_nachreview_ui laufen gegen das neue Index.html durch. t_ricardo_ablauf_ui prüft die alte Navigation und ist mit dem Umbau überholt.

## Stand Umbau (31.10.2026, 17:00) – Version 3 und 4 im Testprojekt

Feedback Jonas 31.10. (FEEDBACK TOOLS, Zeilen 32–59, Status mit Version vermerkt). Umgesetzt in V3 (15:37) und V4 (17:00):

- Cockpit: Chips Bereit → Storniert; Laufzeit-vorbei-Stücke nur unter Nicht verkauft; Spalte Total (Preis + Porto); Zustände «Käufer meldet bezahlt» (orange, Block Zahlung prüfen) und «Bezahlt» (nach Bank-Export oder von Hand mit Beleg).
- Reiter **To-dos** (eigener Nav-Eintrag mit Zahl): alle fälligen Handlungen über alle Stufen, Filter-Chips Fragen, Nachrichten, Preisvorschläge, Bewertungen (nur bei Versendet), Adresse fehlt, Packen, Zahlung prüfen, Erinnern, Storno prüfen, Zahlung bei Ricardo melden, Versenden, Laufzeit prüfen, Nicht verkauft entscheiden, Retoure-Schritt.
- Panel: weiss, Kopf pink, dunkle Schrift; «Jetzt»-Block orange, Erledigtes grün; Doppelschritt (Bestätigung im Tool erst nach Klick auf Ricardo, Schlüssel RIC); Bank-Export und Verkaufsbericht in nummerierten Schritten; Bank-Ergebnis in drei Kästen (Zugeordnet / Unsicher / Ohne Verkauf).
- Neu listen = **Reaktivieren**: Entscheid «Neu listen» öffnet im Cockpit (Stufe Bereit) den Block «Auf Ricardo neu einstellen»: altes Angebot öffnen / Angebot kopieren (prefill), Ende am Auktionsende, Link des neuen Angebots einfügen, «Gelistet» (markiereGelistet ohne Laufzeit → Server rechnet). «Listing ganz durchgehen» bleibt für Text/Preis.
- **Auktionsende**: neue Einstellung «Auktionsende» = «Donnerstag 19:00» (im Testsheet eingetragen). Server `auktionsende_()` / `laufzeitNeu_()`: nächstes Ende, mindestens 24 h entfernt, Laufzeit Tage = aufgerundet; «Laufzeit Tage» nur Reserve. Im Listing-Ablauf statt Feld «6»: Text «Ende Do 05.11.2026 19:00» (Browser rechnet gleich, `naechstesEnde()`).
- Listing-Ablauf: Doppeltitel (Titel und Text / Titel und Beschrieb) weg, Satz «Zeigt Ricardo einen anderen Betrag …» weg.
- Reporting (Kennzahlen + Betrieb, ohne Grade-Tabelle) und Einstellungen (Einstellungen, Storno, Feedback) getrennt.
- Tempo: `cockpit()` ohne Analyse-Liste (20 s → 3–5 s), Analyse parallel und höchstens alle 3 Min; `ANALYSE_MERKEN_SEK` 60 → 300 (analyseListe 7–10 s → 2 s); Start liest das Return Tool frisch nur noch über die ID-Spalten (`idInTab_`, statt 25 s alle Tabs ganz); Auslöser `suchVorrat` im Testprojekt angelegt (`testVorratEinrichten`, Triggers werden beim Kopieren nicht mitkopiert – ohne ihn war jede Suche kalt: adminSuche 60 s).
- Offen: Umsatz/Auszahlung-Definition (Entscheid Jonas: so lassen); Packen-Modus (eine Woche beobachten); Bewertungen, die vor dem Versand eintreffen, erscheinen erst, wenn der Verkauf versendet ist.
- Für die Übernahme ins Live-Tool zusätzlich nötig (Code.gs): `cockpit()`, `cockpitSuche()`/`sucheAlles_()`, api-Map, `idInTab_()` + Änderung in `findeQuelle_`/`imArchiv_`, `auktionsende_()`/`zoneOffset_()`/`laufzeitNeu_()`, DEFAULTS-Zeile «Auktionsende», `ANALYSE_MERKEN_SEK = 300`, startDaten.auktionsende; TEST-Schalter und `testVorratEinrichten` nicht.
