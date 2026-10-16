# Analyse Tool: Standardablauf

Stand 15.10.2026, Testversion 2026-10-15.13 (live ist noch Version 7). Entscheide von Jonas, umgesetzt im Analyse Tool (Web-App am Google Sheet «ANALYSE TOOL»).

Technische Doku (Code, Datenmodell, Stati, Prompts, APIs, Entscheid-Log): GitHub-Repo `jonasb-pg/pg-analyse-tool` (privat). Dieses Dokument beschreibt nur den Ablauf.

## Grundsatz

Ein Schritt pro Bildschirm. Der Server legt pro Produkt fest, welche Schritte es gibt, und fällt das Urteil. Die Analyse-Person triagiert nicht. Nichts wird defekt verkauft. Die Schrittleiste ist anklickbar, abschliessen geht erst, wenn alle Pflichtschritte erledigt sind.

## Schritte

| Nr. | Schritt | Inhalt | Entfällt wenn |
|---|---|---|---|
| 1 | Produkt | Marke und Modell stimmen. Bei falschem Modell neu recherchieren. Ein belegter Rückruf wird zuerst geklärt. Originalversiegelt: direkt zum Entscheid, Grade A. Danach prüft der Matchmaker im Hintergrund alle offenen Suchaufträge | nie |
| 2 | Handbuch | Nur wenn kein passendes Handbuch da ist: ManualsLib-Link, PDF hochladen, Lesen im Hintergrund | ohne Strom oder Handbuch schon da |
| 3 | Hygiene | Körpernahe Produkte: benutzt = entsorgen | nicht körpernah |
| 4 | Sicherheit | Allgemeine Punkte plus bis zu vier für dieses Produkt (Handbuch «Sichtprüfung», sonst Recherche) | keine Punkte |
| 5 | Vollständigkeit | Lieferumfang antippen, was fehlt | nie |
| 6 | Kontosperre | Gerät mit keinem Konto verbunden. Gesperrt = entsorgen | ohne Konto |
| 7 | Funktion | «Achte auf», dann Funktionen nach Stufe: OK, Nicht OK, Nicht prüfbar | nie |
| 8 | Zurücksetzen | Testkonto entfernen, Werkseinstellungen. Firmware: Version ablesen, aktualisieren nur wenn nötig, max. 10 Minuten | nichts davon nötig |
| 9 | Zustand | Mängel und Hinweise aufschreiben, dann Grade A, B oder C | nie |
| 10 | Entscheid | Urteil, Befund, Verkaufsinfo, Ausgang | nie |

## Ausgänge

| Fall | Ausgang |
|---|---|
| Nicht reusable | entsorgen |
| Suchauftrag passt | nur «Regal Matchmaker» (Pflicht). Klappt es nicht: PG-ID scannen, «Matchmaker hat nicht geklappt», neuer Entscheid ohne neue Analyse |
| Sonst | «Auf Ricardo» (Vorschlag ab VP CHF 50: Fotos per QR-Code, Titel und Beschrieb, Versand) oder «Regal Analysiert» |
| Defekt, Reparatur lohnt, geht nicht sofort | «Später reparieren»: Regal «Reparatur», Teil in die Bestellliste, später «Fortsetzen» |

## Stufen (Tab «Stufen»), nur interne Prüftiefe, automatisch nach VP

| Stufe | Geprüft wird |
|---|---|
| Key Functions (ab CHF 0) | Kernfunktionen |
| Key Functions Plus (ab CHF 50) | Kernfunktionen und beworbene Funktionen |
| Vollprüfung (ab CHF 150) | alle Funktionen, die nach den Hausregeln prüfbar sind |

## Regeln

- Reparatur: Arbeit zu CHF 50/h plus Teil, höchstens 25 % vom VP. Die Person entscheidet, ob sofort oder später.
- Funktion defekt und Reparatur lohnt nicht: entsorgen, auch bei Nebenfunktionen.
- Kernfunktion nicht prüfbar: abbrechen, bis das Testmittel da ist, oder nicht reusable.
- Körpernah: In-Ear, Rasierer, Epilierer, Zahnbürsten, Mundduschen, Milchpumpen. Gebraucht = entsorgen.
- Keine elektrische Messung, keine Stichproben.
- Garantie: 90 Tage im Analyse Tool, 30 Tage auf Ricardo.
- Ricardo-Zustand: versiegelt = Neu und originalverpackt; A = Neu (gemäss Beschreibung); B, C = Gebraucht.

## Infrastruktur (für das ganze Team)

Testkonten mit Logindaten (für das Team sichtbar, interne Regel) und Testmittel pflegen. Aktive Testkonten setzen die Testmittel «Testkonto Google / Apple-ID / Amazon» automatisch.

## Grundlagen

Der Ablauf wurde gegen FprEN 50614, R2v3 (Key Functions Working gegenüber Refurbished), SNR 462638, NIST SP 800-88 und die Praxis von Back Market und ReturnPro geprüft.
