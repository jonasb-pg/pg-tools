# Stati und Übergänge

## Produkte.Analyse-Status

| Wert | Bedeutung | Gesetzt von |
|---|---|---|
| `Offen` | in der Warteschlange | Abgleich (neu aus Return Tool), `uebernehmen`, Abgleich (wieder im Return Tool), `uebernehmen(id, 'retoure')` (Retoure, seit 24.10.2026) |
| `Entfällt` | nicht mehr im Return Tool (Tab «Analyse» oder Lagerort «Analyse» in einem Kanal-Tab) | Abgleich; nie, wenn ein Kanal-Tab nicht lesbar war oder die Zeile keine Bezeichnung hat |
| `Reparatur` | pausiert, liegt im Regal «Reparatur»; Stand in Spalte «Reparatur-Stand» (seit 24.10.2026) | `reparaturPause` |
| `Erledigt` | Analyse abgeschlossen | `abschliessen` (zuletzt, nach allen anderen Zeilen) |

```text
Offen <--> Entfällt
Offen --> Reparatur --> Erledigt
Offen --> Erledigt --(Retoure, «Neu analysieren» mit Rückfrage)--> Offen   (neue Analyse-Nr, die alte bleibt)
```

Ein erledigtes Stück, das im Return Tool (wieder) in der Analyse steht und «Reusable» leer hat, ändert den Status nicht von selbst. Nach einem Tag steht es im Log und im Admin («wieder im Tab Analyse»).

## Produkte.Recherche-Status

| Wert | Bedeutung |
|---|---|
| `Offen` | wartet auf Vorab-Recherche (startet nur bei Recherche-Guthaben > 0) |
| `Läuft` | in einem Batch der Claude Batch API |
| `Bereit` | Recherche in der heutigen Fassung vorhanden (Zeile «Funktionen» im Tab Recherche) |
| `Fehler` | Batch-Ergebnis nicht lesbar; «Aktualisieren mit Fehlern» versucht erneut |

## Regal (Analysen.Regal) = physischer Ort nach der Analyse

| Wert | Wann | Danach |
|---|---|---|
| `Matchmaker` | Treffer «passt» (Pflicht, keine Wahl) | MM-Person; bei Absage Wiedereinstieg per Scan |
| `Ricardo Offline` | Person wählt «Auf Ricardo» (Vorschlag ab VP CHF 50) | Ricardo-Person listet |
| `Analysiert` | Person wählt «Regal Analysiert» | Triage/Verkauf |
| leer | nicht reusable | entsorgen |
| (`Reparatur`) | über Analyse-Status, keine Analysen-Zeile | Fortsetzen |

Geplante Ricardo-Regale (Ricardo Tool): `Ricardo Online` (gelistet), `Ricardo Unpaid` (verkauft, nicht bezahlt).

## Ricardo.Status

| Wert | Gesetzt von |
|---|---|
| `Offline` | `abschliessen` |
| weitere (Online, Unpaid, …) | Ricardo Tool, noch nicht gebaut |

## Matchmaker.Status (Tab «Matchmaker» im ANALYSE TOOL)

| Wert | Bedeutung | Gesetzt von |
|---|---|---|
| `Offen` | liegt im Regal «Matchmaker», Kundschaft hat es noch nicht geholt | `abschliessen` (Kanal Matchmaker); `mmGeholt_`, wenn der Auftrag zurück in die Liste kommt |
| `Geholt` | der Suchauftrag ist im Matchmaker Sheet «Geholt» (Tab «Erledigt», Stück im Vermerk «Aus Analyse»). Das Stück ist vergeben | `mmGeholt_` im Abgleich (seit 24.10.2026, Vertrag V5), nur aus `Offen` |
| `Nicht geklappt` | Wiedereinstieg: der Auftrag hat nicht geklappt | `abschliessen` (nachMm) über `mmStatus_`, nur aus `Offen` |
| `Ricardo` | im Ricardo Tool nach Matchmaker gestartet | Ricardo Tool |
| `Auf Ricardo` | der Abgleich hat nachgeführt (Regal «Ricardo Offline», Vermerk) | `mmNachRicardo_`, nur Zeilen, die in der Sperre noch `Ricardo` heissen |

## Bestellliste.Status (Dropdown)

`Offen` (vom Tool) → `Bestellt` → `Da` (von Hand, Besteller:in)

## Feedback.Status

`Neu` (vom Tool) → `Erledigt` (von Hand)

## Testmittel.Vorhanden

`Ja` | `Nein`. «Nein» = im Schritt Funktion bereits als fehlend markiert.

## HANDBÜCHER.Status

| Wert | Bedeutung |
|---|---|
| `gelesen` | gelesen, Abschnitte gefüllt |
| `nur Bild` | PDF fast nur Bilder |
| `falsches Modell` | PDF gehört nicht zum Produkt (Datei wird umbenannt) |
| `kein Handbuch` | Person hat gesucht und nichts gefunden |
| `Hochladen nötig` | Tool hat nichts gefunden, ManualsLib-Link vorhanden |
| `Hochgeladen` | wird gerade gelesen |
| `Fehler` | Lesen fehlgeschlagen, Hinweis in «Hinweis» |

## Batches.Status

`Läuft` → `Abgeholt`

## Gründe «nicht reusable» (KO)

| Schlüssel | Text |
|---|---|
| `sperre` | Kontosperre: Gerät ist noch mit einem Konto verbunden |
| `sperreUnklar` | Kontobindung am Prüfplatz nicht ausschliessbar |
| `hygiene` | Körpernahes Produkt, benutzt |
| `rueckruf` | Rückruf des Herstellers |
| `reset` | Gerät lässt sich nicht zurücksetzen |
| `kern` | Kernfunktion nicht prüfbar |
| `defekt` | Defekt: … (+ «Reparatur lohnt sich nicht») |
| `reparatur` | Defekt: … Reparatur ist nicht gelungen |
| `frei` | Freitext der Person |

## Stufen (Tab «Stufen», intern, nur Prüftiefe)

| Herkunft | VP ab CHF | Stufe | Minuten | Prüfumfang |
|---|---|---|---|---|
| Retoure | 0 | Key Functions | 10 | Kern |
| Retoure | 50 | Key Functions Plus | 15 | Kern und beworben |
| Retoure | 150 | Vollprüfung | 25 | Alle |
| Ohne Inventar | 0 | Key Functions Plus | 15 | Kern und beworben |

Funktionsarten: `Kern`, `Beworben`, `Weitere`. Stufe wird automatisch nach VP gesetzt.

## Grade und Ricardo-Zustand

Seit `2026-10-17.3` entspricht das Grade dem Ricardo-Zustand (Entscheid Jonas 17.10.2026). Ältere Zeilen in «Analysen» und «Ricardo» behalten ihre alte Bedeutung (A unbenutzt, B leichte Spuren, C deutliche Spuren).

| Fall | Grade | Ricardo-Zustand | Satz im Käufertext |
|---|---|---|---|
| originalversiegelt | A | Neu und originalverpackt | Das Produkt ist neu und originalverpackt, die Verpackung ist noch versiegelt. |
| unbenutzt, vollständige Originalverpackung (auch geöffnet) | A | Neu und originalverpackt | Das Produkt ist neu und unbenutzt, in der Originalverpackung. |
| unbenutzt, ohne Originalverpackung oder mit beschriebener Abweichung | B | Neu (gemäss Beschreibung) | Das Produkt ist neu und unbenutzt. |
| mit Gebrauchsspuren | C | Gebraucht | Das Produkt ist gebraucht. |
| defekt | – | (nicht verkauft) |

Käufertext (Verkaufsinfo und Ricardo) seit `2026-10-17.6`, Vorlage Jonas 17.10.2026. Ricardo-Beschrieb, Absätze durch eine Leerzeile getrennt:

1. Einleitung (KI)
2. Stichpunkte (KI, ohne Lieferumfang)
3. Zustandssatz (mit «Das ist uns aufgefallen: …»), darunter «Wir haben es bei uns getestet:» und auf der nächsten Zeile «… funktionieren einwandfrei.» Produkte ohne Strom: «Wir haben alle Teile auf Vollständigkeit und Zustand geprüft.»
4. «Im Paket sind …», was fehlt, «Nicht im Lieferumfang …»
5. Neupreis
6. Versandsatz
7. Schlusssatz «Bei unseren Auktionen handelt es sich um Neuware und Second-Hand-Artikel von verschiedenen Schweizer Händlern. Auf alle Produkte gewähren wir eine Garantie von 30 Tagen.»

Die Verkaufsinfo enthält 3 und 4 als Fliesstext plus Garantie. Nicht ausprobierte Funktionen und Firmware stehen nur im Protokoll.

## Matchmaker-Urteil

`passt` (Pflicht → Regal Matchmaker) | `ähnlich` (Hinweis, kein Muss) | kein Treffer.

## Testkonten (Tab «Testkonten», ab Version .11)

| Feld | Werte | Wirkung |
|---|---|---|
| Dienst | Google, Apple-ID, Amazon, Hersteller-App, Anderes | Google/Apple-ID/Amazon steuern das gleichnamige Testmittel |
| Aktiv | Ja / Nein | mind. 1 aktives Konto eines Dienstes → Testmittel «Testkonto <Dienst>» = Ja, sonst Nein (`kontenAbgleich_`) |
| Passwort | Klartext | für das Analyse-Team sichtbar (interne Regel); nie im Log, nie im Repo |

## Testmittel «Vorhanden»

| Wert | Wirkung im Schritt «Funktion» |
|---|---|
| Ja | gilt als vorhanden |
| Nein | von Anfang an als fehlend markiert |
| leer | unbekannt, Person entscheidet |
