# Einstellungen (Tab «Einstellungen»)

<!-- Automatisch erzeugt mit tools/gen.py aus data/einstellungen-snapshot.json (Version 2026-10-15.14). Nicht von Hand ändern. -->


Sheet ANALYSE TOOL (1jhmq1JoyM6Xor33pM77AmOixbvqKuGzfFX-js9PdIrM), Tab Einstellungen, Stand 15.10.2026 12:10. Werte, die Geheimnisse sind, stehen nicht hier (siehe docs/secrets.md).

Quelle der Wahrheit ist das Sheet. `einrichten()` legt fehlende Zeilen aus `NEUE_EINSTELLUNGEN` (Code) an, ändert bestehende Werte aber nicht.

| Einstellung | Wert | Zweck |
|---|---|---|
| Admins | jonas.b@pretty-good.ch | Wer den Reiter «Admin» sieht. «einrichten» trägt die eigene Adresse ein. |
| Return Tool ID | 1FpHJNeWZENdhgP6MqAYyOOEe1FN0tIZWOkRiYItOz2E | Wird nur gelesen, nie beschrieben. |
| Return Tool Tab | Analyse | Dieser Tab wird in die Warteschlange gespiegelt. |
| Automatischer Import | Ja | Ja: Das Tool gleicht alle 10 Minuten mit dem Return Tool ab. Nein: nur Stücke ohne Inventar. |
| KI-Modell Recherche | claude-sonnet-5-5 | Für die Vorab-Recherche und die Ersatzteil-Suche. |
| Websuchen pro Produkt (max.) | 5 | Begrenzt Kosten und Dauer der Recherche. |
| Icecat-Benutzername | openIcecat-live | Offener Testzugang. Für den Dauerbetrieb ein eigenes Gratis-Konto eintragen. Leer = Icecat aus. |
| Reparatur lohnt bis Prozent vom VP | 25 | Eine Reparatur lohnt sich, wenn Arbeit und Ersatzteil zusammen höchstens so viel Prozent vom Verkaufspreis kosten. Gilt auch auf der Seite «Ersatzteile». |
| Garantie Tage | 90 | Quelle: Entscheid von Jonas, immer 90 Tage. Steht in jeder Verkaufsinfo. |
| Recherche-Anweisung | siehe [Recherche-Anweisung](#recherche-anweisung) | So sucht die KI. In normaler Sprache änderbar. |
| Funktions-Anweisung | siehe [Funktions-Anweisung](#funktions-anweisung) | So stellt die KI die Liste der Funktionen und ihre Prüfschritte zusammen. |
| Ersatzteil-Anweisung | siehe [Ersatzteil-Anweisung](#ersatzteil-anweisung) | So sucht die KI auf der Seite «Ersatzteile». Gilt für jede Marke. |
| Recherche-Guthaben | 0 | Kostenbremse: So viele Vorab-Recherchen darf das Tool noch starten. Jede gestartete Recherche zieht eins ab, bei 0 startet keine mehr. Zum Freigeben eine Zahl eintragen. |
| Vergleichsmodell |  | Nur zum Testen: Steht hier ein Modell, läuft jede Vorab-Recherche zusätzlich damit. Das Ergebnis steht nur im Tab «Kosten», zum Vergleichen von Preis und Qualität. Kostet doppelt. |
| Stundenansatz Reparatur CHF | 50 | Mit diesem Ansatz rechnet das Tool die Arbeitszeit einer Reparatur. Quelle: Entscheid von Jonas vom 10.10.2026. |
| Hausregeln | siehe [Hausregeln](#hausregeln) | Was beim Prüfen gilt. Die KI hält sich beim Erstellen der Prüfschritte daran. In normaler Sprache änderbar. |
| Test-WLAN Name | TEST WLAN | Das Tool zeigt Name und Passwort bei Geräten an, die zum Prüfen ein WLAN brauchen. |
| Test-WLAN Passwort | [im Sheet, nicht im Repo] | Bitte selbst eintragen. |
| Grade A | Unbenutzt: Versiegelt oder ausgepackt, keine Gebrauchsspuren. | Titel und Beschreibung, getrennt durch einen Doppelpunkt. Erscheint im Schritt «Zustand» und in der Verkaufsinfo. |
| Grade B | Gebraucht: Keine oder leichte Spuren, nur aus der Nähe sichtbar. | Wie Grade A. |
| Grade C | Gebraucht: Deutliche Spuren, auf den ersten Blick sichtbar. | Wie Grade A. |
| Handbuch-Sheet ID | 1GqaJ3mFsVuwJmXVPBo0k-t78Rn5qsEf9ZKMHHR-9IYc | Das Sheet «HANDBÜCHER» mit allen gelesenen Handbüchern, eine Zeile pro Modell. Es bleibt bestehen, auch wenn das Analyse Tool ersetzt wird. |
| Handbuch-Guthaben | 0 | Kostenbremse: So viele Handbücher darf das Tool noch suchen und lesen (rund USD 0.05 bis 0.10 pro Handbuch). Jedes zieht eins ab, bei 0 macht es keines mehr. |
| KI-Modell Handbuch | claude-haiku-5-5 | Mit diesem Modell liest das Tool die Handbücher. Haiku reicht dafür (Test vom 14.10.2026: gleiche Qualität wie Sonnet zu einem Zwanzigstel des Preises). |
| Handbuch-Anweisung | = Konstante HANDBUCH_ANWEISUNG in src/Code.gs (Wortlaut identisch) | So liest die KI ein Handbuch. Die Abschnitte und die fünf Kopfzeilen nicht umbenennen, das Tool liest sie aus. |
| Handbuch-Ordner ID | 1JUaSaYQpkt3HZn2ByjR4LpFJcwsoFOMJ | Der Drive-Ordner «HANDBÜCHER PDF». Das Tool legt jedes Handbuch dort ab (Marke Modell.pdf) und liest es von dort. Hochgeladene Handbücher landen auch hier. |
| Handbuch-Suche | = Konstante HANDBUCH_SUCHE in src/Code.gs (Wortlaut identisch) | So sucht die KI ein Handbuch, wenn es weder im Ordner noch bei Icecat noch in der Recherche eines gibt. Das JSON-Format nicht ändern, das Tool liest es aus. |
| Ersatzteil-Shops | = Konstante TEIL_SHOPS in src/Code.gs (Wortlaut identisch) | Hier sucht die KI Ersatzteile zuerst, eine Zeile pro Shop: Name \| Domain \| Link \| Info. |
| Ricardo ab VP CHF | 50 | Ab diesem Verkaufspreis schlägt das Tool im Entscheid «Auf Ricardo» vor. Die Person entscheidet. |
| Ricardo-Foto-Ordner ID | 1DimLxvk4jqFf3gpbre1kKm5oE84_7TD4 | Der Drive-Ordner «RICARDO FOTOS». Pro Produkt ein Ordner mit der PG-ID, darin die Fotos vom Handy, das Hauptbild zuerst. |
| Web-App-Adresse für Fotos | https://script.google.com/a/macros/pretty-good.ch/s/AKfycbz-CuQ5QOygYatY8Sq7L8EK0FaulltyecT3u_wTjKEe/dev | TEST-WERT. Vor Go-live leeren (leer = Live-Adresse der Web-App). |
| Ricardo-Versand | = Konstante RICARDO_VERSAND in src/Code.gs | Versandklassen wie bei Ricardo, eine pro Zeile: Name \| Preis CHF. Pretty Good versendet mit B-Post. |
| KI-Modell Ricardo | claude-haiku-5-5 | Mit diesem Modell schreibt das Tool Titel und Artikelbeschrieb für Ricardo. |
| Ricardo-Anweisung | = Konstante RICARDO_ANWEISUNG in src/Code.gs | So schreibt die KI Titel und Artikelbeschrieb. Zustand, Neupreis, Versand und Garantie setzt das Tool selbst darunter. |
| Ricardo-Versandsatz | Versand ausschliesslich per Post, keine Abholung. | Steht in jedem Artikelbeschrieb. |
| Ricardo-Schlusssatz | Alle Produkte werden von Pretty Good sorgfältig geprüft und mit einer Garantie von 30 Tagen verkauft. | Steht am Ende jedes Artikelbeschriebs. Keine Domain verwenden. |
| Matchmaker-Sheet ID | 1xxlT767Eqc7Y0OREu4fVM-LYWyJ2tSbfz52z0SS8L1w | Aus diesem Sheet (Tab «Matchmaker») liest das Tool die offenen Suchaufträge. Beim Auftrag schreibt es in die Spalte «Aus Analyse». |
| KI-Modell Matchmaker | claude-sonnet-5-5 | Mit diesem Modell prüft das Tool jedes Produkt gegen alle offenen Suchaufträge. |
| Matchmaker-Anweisung | = Konstante MM_ANWEISUNG in src/Code.gs (Wortlaut identisch) | Nach diesen Regeln entscheidet die KI «passt» oder «ähnlich». «Passt» ist Pflicht. |

## Prompts im Wortlaut

### Recherche-Anweisung

```text
Du recherchierst für die Analyse von Retouren und Reuse-Produkten bei Pretty Good. Bestimme zuerst das genaue Modell: Suche nach der EAN und halte Herstellernummer und Modellcode fest. Verwende sie in allen weiteren Suchen statt des Händlertitels. Farbe, Ausführung und Herstellernummer nennst du nur, wenn eine Quelle sie für diese EAN belegt. Sonst schreibst du «am Gerät ablesen» und nennst im Lieferumfang, was sich zwischen den Ausführungen unterscheidet. Suche zuerst auf der Herstellerseite, im Handbuch und auf den Support-Seiten des Herstellers, danach bei Händlern (bei Galaxus auch unter «Fragen & Antworten»), zuletzt in der Community des Herstellers, bei iFixit und in Foren. Schreibe «unbekannt», wenn du nichts Belegtes findest. Erfinde keinen Lieferumfang und übernimm ihn nie aus einem Handbuch, das für mehrere Modelle gilt. Im Lieferumfang steht jedes lose Teil einzeln (z.B. Innentopf, Tank, Deckel, Halterung, Fernbedienung, Netzkabel, Aufsätze, Adapter), denn lose Teile fehlen bei Retouren am häufigsten. Markiere ein Variantenrisiko, wenn es das Produkt in mehreren Bundles, Farben, Generationen oder Ausführungen gibt. Für Reset, Kontosperre und Firmware gelten nur Angaben des Herstellers. Kontosperre: Bei Geräten, die sich an ein Konto binden (z.B. Drohnen, Kinderuhren, Smartwatches, Tracker, smarte Schlösser, Kameras), ist «unbekannt» keine Antwort. Schreibe, woran man die Bindung am Gerät erkennt und wer sie lösen kann. Lässt sie sich am Prüfplatz nicht erkennen, schreibe das als Vorbehalt für den Verkauf. Zurücksetzen: Kennt das Handbuch keinen Reset, schreibe «Kein Reset vorgesehen» und was stattdessen zu löschen ist (Speicherkarte, Messwerte, Kopplungen). Datentragend ist ein Gerät nur, wenn es Personendaten, Konten, Kopplungen oder Messwerte einer Person speichert, nicht bei blossen Geräteeinstellungen. Antworte in Stichworten auf Deutsch.
```

### Funktions-Anweisung

```text
Liste die Funktionen des Produkts auf. «Kern» ist das, wofür man das Produkt kauft, höchstens drei. «Beworben» sind Funktionen, mit denen Hersteller oder Händler im Titel oder in den Hauptmerkmalen werben. «Weitere» sind alle übrigen. Die Prüfung ist eine Handlung mit klarem Ergebnis in einem Satz. Lies dafür das Handbuch oder die Bedienseite des Herstellers und schreibe die Bedienung genau: welche Taste, kurz drücken oder wie lange halten, welche Reihenfolge, welche Anzeige (z.B. Farbe der LED). Beschreibe keine Taste und keine Mechanik, die keine Quelle belegt. Kennst du die Bedienung nicht, schreibe «Bedienung laut Handbuch» statt zu raten. Nenne Voraussetzungen im Schritt (z.B. zuerst laden, Deckel zu, bestimmter Modus, Software des Herstellers nötig). Sichtprüfung, Lieferumfang, Zurücksetzen und Reinigung sind schon abgedeckt, wiederhole sie nicht. Halte die Hausregeln ein. Kläre zuerst, ob das Gerät unter den Hausregeln überhaupt anläuft (z.B. ohne Wasser, ohne Topf, ohne Konto, nur vom Akku). Gibt es eine Prüfung, die die Hausregeln einhält (z.B. Aufheizen ohne Wasser), nimm diese. Läuft das Gerät so nicht an, ist die Prüfung das, was es dann zeigt (z.B. Anzeige «kein Wasser», Tasten reagieren). Sonst ist die Funktion nicht prüfbar, ebenso wenn sie Spezialgerät braucht oder länger als fünf Minuten dauert. Braucht eine Funktion nur ein gängiges Hilfsmittel (Kabel, Audioquelle, Smartphone, PC, Batterien, USB-Netzteil), ist sie prüfbar und das Hilfsmittel steht unter den Testmitteln. Ein Produkt hat nie nur nicht prüfbare Funktionen: Dann sind die Funktionen das, was sich von Hand prüfen lässt (Klappen, Verschlüsse, Tasten, Schlüssel, Stecker, bewegliche und abnehmbare Teile). Bei einem Produkt ohne Technik ist die Kernfunktion, dass es unbeschädigt und benutzbar ist.
```

### Ersatzteil-Anweisung

```text
Du suchst ein Ersatzteil für ein Produkt, das Pretty Good prüft und weiterverkauft. Bestimme zuerst das genaue Modell und die Teilenummer des Herstellers für das gesuchte Teil. Suche dann Preise in Schweizer Franken mit Lieferung in die Schweiz, dort wo es der Auftrag sagt: zuerst in unseren Shops, sonst im Ersatzteil-Shop des Herstellers und bei anderen Händlern. Bei Akkus und Netzteilen nur Originalteile oder Markenware von einem Schweizer Händler, keine Direktimporte. Nenne nur Angebote, die zum Modell passen, und erfinde nichts.
```

### Hausregeln

```text
Kein Wasser und keine anderen Flüssigkeiten einfüllen. Keine Lebensmittel und kein Verbrauchsmaterial verwenden (Kapseln, Filter, Papier, Tinte). Keine Montage und keine Installation an Wand oder Decke. Zusammenstecken ohne Werkzeug, eine Tischklemme und das Abnehmen von Teilen, die dafür gedacht sind (Seitenwand, Deckel, Aufsatz), sind keine Montage. Kein neues Konto anlegen und keine SIM-Karte einsetzen. Funktionen, die nur mit App und Konto gehen, werden mit einem Testkonto von Pretty Good geprüft, wenn eines unter den bekannten Testmitteln steht. Sonst sind sie nicht prüfbar. Das Gehäuse wird nicht geöffnet. Heiz- und Motorgeräte laufen nur kurz und nie unbeaufsichtigt. Akkus werden nur unter Aufsicht geladen. Versiegeltes Zubehör bleibt versiegelt. Smarte Geräte kommen nur ins Test-WLAN. Firmware wird nur auf dem offiziellen Weg des Herstellers aktualisiert. Körpernah sind Produkte mit Kontakt zu Mund, Ohr, Brust oder rasierter Haut: In-Ear-Kopfhörer, Rasierer, Epilierer, Zahnbürsten, Mundduschen, Milchpumpen. Gebraucht werden sie entsorgt.
```
