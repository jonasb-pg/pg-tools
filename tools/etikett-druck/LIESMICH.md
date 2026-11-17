# PG Etikett: Druckprogramm für den Brother QL-500

Stand 17.11.2026. Für den QL-500 gibt es auf dem Mac keinen Treiber mehr; P-touch Editor druckt direkt über USB. Dieses Programm macht dasselbe für das Analyse Tool.

| Datei | Wozu |
|---|---|
| `pg_etikett.py` | Dienst auf `http://127.0.0.1:9123`: zeichnet das Etikett (QR-Code, ID, Bezeichnung) und schickt es über USB an den QL-500 |
| `install.sh` | richtet alles unter `~/Library/Application Support/PG-Etikett` ein und startet den Dienst bei jeder Anmeldung |
| `deinstallieren.sh` | entfernt Dienst und Programm |

## Einrichten

1. Ordner auf den Mac am Analyseplatz legen (z.B. in «Downloads»).
2. P-touch Editor schliessen, QL-500 einschalten.
3. Terminal öffnen und ausführen: `bash ~/Downloads/pg-etikett/install.sh`
4. Am Schluss öffnet sich die Seite des Programms. Dort «Testetikett 29 × 90 mm» klicken.

## Ablauf

Analyse Tool (Knopf «Etikett drucken» oder Abschluss mit eingeschaltetem Schalter) → Fenster auf `/druck?id=…&t=…&f=90|62&n=…` → Etikett wird gedruckt → Fenster schliesst sich.
Dieselbe Auftragsnummer `n` druckt nie zweimal.

## Formate

| Format im Tool | Rolle | Bedruckbare Fläche |
|---|---|---|
| 90 | 29 × 90 mm | 991 × 306 Punkte, der Länge nach gedruckt |
| 62 | 62 × 29 mm (DK-11209) | 696 × 271 Punkte |

## Wenn etwas nicht geht

| Zeichen | Ursache | Abhilfe |
|---|---|---|
| Fenster zeigt «Website nicht erreichbar» | Dienst läuft nicht | `bash install.sh` nochmals ausführen; Protokoll `~/Library/Logs/pg-etikett-dienst.log` |
| «Kein Brother-Drucker gefunden» | Drucker aus oder Kabel | einschalten, einstecken |
| «Der Drucker ist belegt» | P-touch Editor hält den Drucker | P-touch Editor schliessen |
| Selbsttest: `--probe` | zeigt Zeile für Zeile, was geht | `"$HOME/Library/Application Support/PG-Etikett/venv/bin/python" "$HOME/Library/Application Support/PG-Etikett/pg_etikett.py" --probe` |

## Geprüft und nicht geprüft

- Geprüft (`tests/t_etikett_druck.py`, mit Attrappen für qrcode, brother_ql und usb): Zeichnen, QR-Code lesbar, Übergabe an die Bibliothek, Webseite, Schutz gegen doppelten Druck, Fehlermeldungen.
- Nicht geprüft: die echte Bibliothek `brother_ql_next` 0.12.0, USB auf dem Mac und der Druck auf dem QL-500. Das zeigt erst der Selbsttest am Gerät.
