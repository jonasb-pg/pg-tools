# Stati und Übergänge

## Produkte.Analyse-Status

| Wert | Bedeutung | Gesetzt von |
|---|---|---|
| `Offen` | in der Warteschlange | Abgleich (neu aus Return Tool), `ohneInventar`, Abgleich (wieder im Return Tool) |
| `Entfällt` | nicht mehr im Return-Tool-Tab «Analyse» | Abgleich |
| `Reparatur` | pausiert, liegt im Regal «Reparatur» | `reparaturPause` |
| `Erledigt` | Analyse abgeschlossen | `abschliessen` |

```text
Offen <--> Entfällt
Offen --> Reparatur --> Erledigt
Offen --> Erledigt
```

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
| originalversiegelt | A | Neu und originalverpackt | Neu und originalverpackt, ungeöffnet. |
| unbenutzt, vollständige Originalverpackung (auch geöffnet) | A | Neu und originalverpackt | Neu und originalverpackt. |
| unbenutzt, ohne Originalverpackung oder mit beschriebener Abweichung | B | Neu (gemäss Beschreibung) | Neu, unbenutzt (gemäss Beschreibung). |
| mit Gebrauchsspuren | C | Gebraucht | Gebraucht. |
| defekt | – | (nicht verkauft) |

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
