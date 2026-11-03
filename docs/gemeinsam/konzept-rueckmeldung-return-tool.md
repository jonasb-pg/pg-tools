# Architektur: Rückführung aller Tools ins Return Tool

Stand 03.11.2026, Entwurf (Claude), noch nicht entschieden. Vorgaben Jonas: im Return Tool muss niemand etwas tun; klarer Lauf von den Tools ins Return Tool; alle Tools beachten; zu 99% wasserdicht, kein Wirrwarr.

## Korrektur Jonas 03.11.2026 17:37
«Es muss von der Sammlung rübergespielt werden und nicht vom Tool»: Der Dienst läuft im Script des Sheets RÜCKFÜHRUNG, nicht im Return Tool. Folgen und Gegenmassnahmen siehe Abschnitt «Dienst in der Sammlung». Die Abschnitte darunter mit «Dienst im Script des Return Tools» sind damit überholt.

## Dienst in der Sammlung (gilt)
- Keine gemeinsame Sperre mit End of Day / VERSCH: Schreiben pro Zeile = frisch per PG-ID suchen, schreiben, sofort zurücklesen (ID und Werte); stimmt etwas nicht → alte Werte zurück, Konflikt. Kein Lauf im Zeitfenster von End of Day (Einstellung).
- Nebenwirkungen, die sonst das Return Tool macht (Erledigt am, Analyse Log, Verschieben, Archiv-Status), macht der Dienst selbst, nach dem gelesenen Code des Return Tools nachgebaut.
- Stufe 1: nur Felder schreiben (Reusable, Kürzel, Befund, Erledigt am, Analyse-Log-Zeile, Ricardo-Link, Erzielter VP, Lagerort), kein Verschieben.
- Stufe 2: Verschieben = in Ziel-Tab anhängen → prüfen → Quellzeile löschen (nur wenn ID dort noch steht); vorher prüfen, ob die PG-ID im Ziel schon steht (kein Doppel).

## Bild (alt)
Tools (Analyse, Ricardo, Umpacken, Heilsarmee, Matchmaker über Analyse) → schreiben Ereignisse (nur anhängen) ins Sheet «RÜCKFÜHRUNG» (Tab «Ereignisse») → Dienst im Script des Return Tools (Zeittrigger alle 10 Min., gleiche Sperre wie End of Day und VERSCH) verarbeitet sie mit den eigenen Funktionen des Return Tools → Status zurück ins Ereignis, Protokoll, Mail an Jonas nur bei Konflikt.
Scanner (Python) schreibt wie heute neue Zeilen in Tab «Scanner» (Eingang, bleibt). vidaXL (eigene DB) und Ersatzteil-Tool: nicht im Return Tool, ausserhalb.

## Warum der Dienst im Script des Return Tools
Script-Sperre gilt pro Projekt: nur so kann er nie gleichzeitig mit End of Day, VERSCH oder Lieferung laufen. Er ruft dieselben Funktionen wie ein Klick (Analyse Log, Erledigt am, Archiv-Status, Lieferliste stimmen). Schreiben von aussen löst kein onEdit aus und kennt die Sperre nicht.

## Sheet «RÜCKFÜHRUNG»
- Ereignisse: Ereignis-ID (Quelle + Quell-Nr + Art, eindeutig), Zeit, Quelle, Art, PG-ID, Werte (JSON), Status (Neu, Wartet, Erledigt, Konflikt, Übersprungen), Ergebnis, Bearbeitet am. Tools hängen nur an; Status schreibt nur der Dienst.
- Zuordnung: Art + Wert → Ziel im Return Tool (Tab, Feld, Aktion).
- Protokoll: je Schreibvorgang PG-ID, Tab, Feld, alt, neu, Ereignis-ID.
- Einstellungen: Modus (Aus / Vorschau / Schreiben), max. Ereignisse pro Lauf, Mail bei Konflikt.

## Ereignisse
| Quelle | Art | Return Tool |
|---|---|---|
| Analyse | ANALYSE_FERTIG (reusable, Kürzel, Befund, Regal) | Tab Analyse: Reusable, Kürzel, Befund; verschieben: Regal Ricardo → Online, Analysiert → Zielkanal (Spalte S), nicht reusable → (offen), Matchmaker → (offen) |
| Analyse | MATCHMAKER_ABGEHOLT (Preis) | → Archiv (Verkauft) |
| Ricardo | GELISTET (Ricardo-Link) | Tab Online: Ricardo-Link |
| Ricardo | VERSENDET (Erzielter VP, Verkauf-Nr) | Online: Erzielter VP → Archiv (Verkauft) |
| Ricardo | ENTSCHEID_NICHT_VERKAUFT (anderer Kanal / Entsorgung) | verschieben |
| Ricardo | RETOURE | Archiv zurück → Online (bzw. Analyse) |
| Umpacken | LAGERORT_NEU, VERKAUFT_AN (Abnehmer) | heute direkter Übertrag (nur Lagerort) → auf Ereignisse umstellen |
| Heilsarmee | LOT_ABGEGEBEN (PG-IDs, Lot) | Tab Heilsarmee → Lieferung (GESPENDET); von Hand erfasste Stücke ohne PG-ID: nichts |

## Verarbeitung je Ereignis (in der Sperre)
1. Schon erledigt (Ereignis-ID)? → nichts. 2. Zuordnung kennt Art/Wert? sonst Konflikt. 3. PG-ID genau einmal in aktiven Tabs, im erwarteten Tab? Noch nicht da (z.B. Verkauf vor Analyse) → Wartet, nach 48 h Konflikt; doppelt/falscher Tab → Konflikt. 4. Felder leer oder gleich? anderer Wert → Konflikt. 5. Schreiben + Aktion über Return-Tool-Funktion, Zeile direkt davor frisch per PG-ID suchen. 6. Protokoll, Status Erledigt.
Reihenfolge: nach Zeit, pro PG-ID nacheinander. Jedes Ereignis einzeln: Abbruch lässt Rest offen.

## Sicherungen
Modus-Schalter mit Vorschau und Aus; Obergrenze pro Lauf; vor Start Kopie des Return Tools; Rückgängig pro Ereignis über Protokoll (Archiv zurück für Verschiebungen); keine Texte mit = + - @ am Anfang; Tests mit Kopie des Return Tools vor jedem Einspielen; tägliche Kontrollzahl (Ereignisse neu/erledigt/Konflikt) im Morgen-Lauf, Mail nur bei Konflikt.

## Einführung
0. Zugang zum Code des Return Tools klären und lesen. 1. Sheet RÜCKFÜHRUNG, Tools schreiben Ereignisse (ohne Wirkung). 2. Dienst im Modus Vorschau, eine Woche, Abgleich mit Handarbeit. 3. Schreiben, zuerst nur ANALYSE_FERTIG, dann Ricardo, dann Umpacken/Heilsarmee. 4. Altlast: Ereignisse aus der Analyse-Historie nachtragen (201 Stücke), in Portionen.

## Offene Fragen
1. Code des Return Tools (v6.0): Zugang? Funktionen für VERSCH, Lieferung, Archiv zurück wiederverwendbar? Regel «Return Tool nur lesen» müsste für den Dienst fallen.
2. Nicht reusable: Archiv Entsorgt oder je nach Grund Spenden?
3. Regal Matchmaker: wo im Return Tool, bis abgeholt?
4. Ricardo verkauft: Archiv bei Versand oder nach Retourenfrist?
5. Heilsarmee: gilt ein abgeschlossenes Lot als Lieferung (GESPENDET)?
6. Brücke bis zur Datenbank von HuggyStudio?

## Fall: Produkt mit ID, die im Return Tool nicht auffindbar ist (Frage Jonas 03.11.2026)
Grundsatz: Der Dienst legt im Return Tool nie eine neue Zeile an und vergibt nie eine PG-ID (ID-Vergabe nur durch das Return Tool, End of Day).
| Lage | Status | Was passiert |
|---|---|---|
| PG-ID noch nicht verteilt (steht im Tab Scanner, ID kommt erst mit End of Day) | Wartet | jeder Lauf prüft neu, wird automatisch gebucht, sobald die Zeile da ist |
| nach 48 h immer noch nirgends | Konflikt «nicht im Return Tool» | Mail an Jonas; Liste in RÜCKFÜHRUNG; Lösung: im Return Tool erfassen (Scanner) → Ereignis läuft von selbst weiter, oder «ignorieren» mit Grund |
| PG-ID nur im Archiv | je nach Art: Retoure = erwartet, sonst Konflikt «im Archiv» | nichts geschrieben |
| PG-ID doppelt (pink) | Konflikt «doppelt» | nichts geschrieben |
| keine PG-ID (Heilsarmee von Hand, alte AN-/RC-Nummern) | Übersprungen «ohne PG-ID» | gezählt im Bericht, nichts geschrieben |
Heute in den Tools: Analyse lässt seit 24.10. nur Stücke mit PG-ID zu («Bitte zuerst im Return Tool erfassen»); Umpacken lehnt unbekannte IDs ab; Heilsarmee erfasst «von Hand» ohne PG-ID; Ricardo kennt RC-Nummern für Stücke ohne Inventar.
