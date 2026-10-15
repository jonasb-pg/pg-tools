# Matchmaker vereinfachen: Befund und Vorschlag (15.10.2026)

Grundlage: Matchmaker Sheet (Tab «Matchmaker», 72 Zeilen), Matchmaker-Script (`matchmaker-script/Code.gs`), Admin-App `app.pretty-good.ch/admin/matchmaking` (nur angesehen, nichts geändert), Recherche `claude/nacht-recherche/03-matchmaker.md`. Personendaten der Kundschaft sind hier bewusst nicht übernommen.

## Befund

| # | Befund | Beleg |
|---|---|---|
| 1 | Zwei Listen derselben Aufträge: App (Status New 0, Open 63, Offered 7, Unsuccessful 3) und Sheet (72 Zeilen), von Hand übertragen | App, Sheet 15.10. |
| 2 | Die Listen laufen auseinander: «Puzzle» (App, 15.10. 09:08) fehlt im Sheet; angebotene Aufträge (z.B. «lego set», «laminiergerät», «nähmaschine») stehen im Sheet weiter als offen; interne Wünsche (Papiertaschen, Versandboxen, Limit 0) stehen im Sheet, nicht in der App | App vs. Sheet |
| 3 | Die App hat strukturierte Felder, das Sheet nur Freitext: Suchanfrage, Spezifikation, **Zustand** (z.B. New), Max. Budget, **Flexibilität** («Ja, auch Ähnliches»), Suchanfrage vom, **Fällig bis** (4 Wochen), Status, Owner, Versuche, Match fällig (3 Tage nach Angebot) | App, Detail einer Suchanfrage |
| 4 | Zustand und Flexibilität fliessen heute nicht ins Matching; abgelaufene Aufträge werden von Hand aussortiert | Script, Sheet |
| 5 | Zwei Matching-Wege mit unterschiedlichen Regeln: Matchmaker-Script (Stichwortsuche + Urteil pro Paar, von Hand gestartet) und neu das Analyse Tool (ein Urteil pro Produkt gegen alle Aufträge) | Code |
| 6 | Neuer Auftrag wird nur gegen den Tageszugang geprüft, ausser jemand startet «ganzer Bestand» | Script, Recherche 2.6 |
| 7 | Stichwortsuche erzeugt viel Ausschuss (89 % «nein»), ein Vorfilter über Produkttyp + Marke hätte 79 % der KI-Aufrufe gespart | Recherche 2.4/2.5 |
| 8 | «Geholt» verschiebt den Auftrag, nicht das Produkt; keine Reservation; das Match wird in der App von Hand erstellt («Match erstellen») | Script, App |
| 9 | Das Script durchsucht auch Stücke, die schon entsorgt, auf Ricardo oder im Matchmaker sind (Return Tool kennt das Analyse-Ergebnis nicht) | Architektur |

## Ziel

Eine Quelle für Aufträge (die App), eine Matching-Logik mit einem Regelwerk, automatische Auslöser statt Menü, ein Ort für Treffer mit Status. Weniger Handarbeit, weniger Fehlalarme, nichts geht verloren.

## Vorschlag

| # | Massnahme | Wirkung | Braucht |
|---|---|---|---|
| 1 | **App = einzige Quelle der Aufträge.** Offene Aufträge (Status Open) werden automatisch ins Sheet gespiegelt (nur lesen), mit App-ID, Suchanfrage, Spezifikation, Zustand, Budget, Flexibilität, Fällig bis. Kein Abtippen mehr | Keine Abweichung, kein Vergessen, Ablauf automatisch | Export/Schnittstelle der App (Entwickler der App) |
| 2 | **Auftrags-ID statt Text als Schlüssel** (App-ID) | Änderung am Text verliert keine Urteile mehr; Vermerke treffen sicher | 1 |
| 3 | **Regeln aus den App-Feldern:** Flexibilität «Nein» → nur «passt»; «Ja» → auch «ähnlich» anbieten. Zustand «New» → nur versiegelte / Grade A. Budget nur als Hinweis (Entscheid: Limit zählt nicht) | Weniger falsche Angebote | 1 |
| 4 | **Ein Regelwerk für beide Wege:** dieselbe Anweisung und dieselbe Profilbildung für Script und Analyse Tool (z.B. Anweisung im Matchmaker Sheet, beide lesen sie) | Gleiche Urteile, eine Stelle zum Anpassen | klein |
| 5 | **Auslöser statt Menü:** neuer Auftrag → einmal gegen den ganzen Bestand; jeden Abend Tageszugang gegen alle offenen Aufträge; Analyse Tool live | Grösste Lücke geschlossen (Recherche 2.6) | Zeit-Trigger, klein |
| 6 | **Vorfilter vor der KI:** Produktart (Galaxus-Produkttyp aus dem Link) + Pflichtmarke | 70–80 % weniger KI-Aufrufe, weniger Ausschuss | klein bis mittel |
| 7 | **Erledigte Stücke ausschliessen:** PG-IDs mit Ergebnis im ANALYSE TOOL (entsorgt, Ricardo, Matchmaker) überspringt das Script (liest Tab «Analysen», nur lesen) | Keine Treffer auf Stücke, die es nicht mehr gibt | klein |
| 8 | **Ein Treffer-Tab mit Status** statt Spalten Passt/Ähnlich 1–3: eine Zeile pro Treffer (App-ID, PG-ID, Produkt, Ort, Urteil, Hinweis, Status Vorgeschlagen → Geholt → Angeboten → Verkauft / Abgelehnt). Ein Treffer pro Auftrag, ältester Auftrag zuerst | Übersicht, Reservation sichtbar, Messbarkeit | mittel |
| 9 | **Abgelaufen / angeboten automatisch:** Aufträge verschwinden aus dem Matching, sobald die App sie nicht mehr als Open führt | Kein Aufräumen von Hand | 1 |
| 10 | Später: Vorschläge direkt in der App bei «Match erstellen» (Treffer vorausgefüllt) | Ein Werkzeug statt zwei | Entwickler der App |

## Reihenfolge

| Phase | Inhalt | Ohne Entwickler der App? |
|---|---|---|
| 0 | 4, 5, 7 im heutigen Script und Analyse Tool | ja |
| 1 | 1, 2, 3, 9: Spiegel der App-Aufträge | nein, Export nötig |
| 2 | 6, 8: Vorfilter, Treffer-Tab | ja |
| 3 | 10 und Live-Check an der Erfassung im neuen System | nein |

## Offene Fragen an Jonas

| # | Frage |
|---|---|
| 1 | Wer hat die App gebaut und kann einen Export der offenen Aufträge liefern (CSV-Link, Google Sheet oder API mit Schlüssel)? |
| 2 | Wer überträgt heute die Aufträge ins Sheet, und wie oft? |
| 3 | Interne Wünsche (Papiertaschen, Versandboxen): im Matchmaker lassen oder eigene Liste? |
| 4 | Zustand «New» in der App: heisst das originalverpackt / neuwertig? Welche Werte gibt es? |
