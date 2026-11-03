# Konzept: Ergebnisse aus Analyse Tool und Ricardo Tool zurück ins Return Tool

Stand 03.11.2026, Entwurf (Claude), noch nicht entschieden. Jonas: «zu 99% wasserdicht, kein Wirrwarr, keine Fehler im Return Tool». Konzipierung später fortsetzen.

Anlass: Feedback FG 02.11. (analysierte Stücke tauchen beim Scannen wieder auf). Ursache: Das Analyse Tool meldet alle 10 Minuten «Erledigt, steht im Return Tool aber (wieder) in der Analyse ohne «Reusable»»; 02.–03.11. 201 verschiedene PG-IDs. Das Ergebnis wird im Return Tool nicht nachgetragen.

## Grundidee
Das Return Tool bleibt der einzige Schreiber seiner Zeilen. Analyse Tool und Ricardo Tool schreiben nie direkt hinein, sondern legen Rückmeldungen in ein Postfach (je ein Tab im eigenen Sheet). Das Return Tool holt sie mit einem Menüpunkt «Rückmeldungen übernehmen» ab: Vorschau → Ausführen (mit eigener Sperre und eigenen Verschiebe-Funktionen) → Quittung im Postfach.

## Warum nicht direkt schreiben
- Zeilen wandern (End of Day, «→ VERSCH.»), Zeilennummern instabil.
- Schreibzugriffe von aussen lösen kein onEdit aus: «Erledigt am (auto)», «Analyse Log», Verschieben fehlen.
- Keine gemeinsame Sperre zwischen den Scripts.
- Zwei Schreiber pro Feld.

## Rückmeldungen
| Ereignis | Return Tool | Danach |
|---|---|---|
| Analyse fertig, reusable | Tab «Analyse»: Reusable Ja, Kürzel, Befund | verschieben in Zielkanal (Spalte S); Regal Ricardo → «Online» |
| Analyse fertig, nicht reusable | Reusable Nein, Kürzel, Befund | offen (Archiv Entsorgt?) |
| Ricardo verkauft (bezahlt und versendet) | Tab «Online»: Ricardo-Link, Erzielter VP | → Archiv (Verkauft) |
| Ricardo nicht verkauft, Entscheid anderer Kanal / Entsorgung | Tab «Online» | verschieben |
| Ricardo-Retoure | Archiv | bestehende Funktion «Archiv: zurück» → Online |

## Regeln
1. Nur über PG-ID, nie Zeilennummer; Zeile in der Sperre unmittelbar vor dem Schreiben frisch suchen.
2. PG-ID genau einmal in aktiven Tabs und im erwarteten Tab, sonst Konflikt.
3. Nur leere Felder füllen; anderer Wert = Konflikt (Mensch); gleicher Wert = erledigt.
4. Verschieben nur über die bestehenden Return-Tool-Funktionen.
5. Ziel nur aus fester Zuordnungstabelle; unbekannt = Konflikt.
6. Jede Rückmeldung quittiert, idempotent; Abbruch mittendrin lässt Rest offen.
7. Vorschau vor dem Ausführen; Ausführen auf Knopf einer festen Person (z.B. abends vor End of Day).
8. Protokoll: vorher, nachher, Quelle.

## Einführung
1. Fragen klären. 2. Eine Woche nur Vorschau, Vergleich mit Handarbeit. 3. Ausführen auf Knopf. 4. Altlast (201 Stücke) in Portionen über dieselbe Vorschau. 5. Später allenfalls automatisch.

## Offene Fragen
1. Code des Return Tools (v6.0): wer hat ihn, darf Claude ihn lesen und einen Menüpunkt ergänzen? (Bisher Regel «Return Tool nur lesen».)
2. Nicht reusable: immer Archiv Entsorgt oder je nach Grund Spenden/Ersatzteile?
3. Regal Matchmaker: wohin im Return Tool?
4. Ricardo verkauft: sofort ins Archiv oder erst nach Retourenfrist?
5. Brücke bis zur neuen Datenbank von HuggyStudio?
