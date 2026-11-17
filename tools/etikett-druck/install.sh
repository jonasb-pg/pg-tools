#!/bin/bash
# PG Etikett einrichten (Mac mini am Analyseplatz). Aufruf im Terminal:  bash install.sh
# Legt alles unter «~/Library/Application Support/PG-Etikett» ab und startet den Dienst bei jeder Anmeldung. Braucht kein Passwort.
set -u
HIER="$(cd "$(dirname "$0")" && pwd)"
ZIEL="$HOME/Library/Application Support/PG-Etikett"
NAME="ch.pretty-good.etikett"
PLIST="$HOME/Library/LaunchAgents/$NAME.plist"
sag() { printf '\n== %s\n' "$1"; }
ende() { printf '\nABBRUCH: %s\n' "$1"; exit 1; }

sag "1/5 Python suchen"
PY=""
for k in python3 /opt/homebrew/bin/python3 /usr/local/bin/python3 /Library/Frameworks/Python.framework/Versions/Current/bin/python3; do
  if command -v "$k" >/dev/null 2>&1 && "$k" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 9) else 1)' >/dev/null 2>&1; then PY="$(command -v "$k")"; break; fi
done
[ -n "$PY" ] || ende "Python 3.9 oder neuer fehlt. Wenn gerade ein Fenster «Befehlszeilen-Entwicklerwerkzeuge installieren» aufgegangen ist: auf «Installieren» klicken, warten bis es fertig ist, dann diesen Befehl nochmals ausführen."
echo "Python: $PY ($("$PY" -c 'import sys; print(sys.version.split()[0])'))"

sag "2/5 Programm ablegen"
mkdir -p "$ZIEL" "$HOME/Library/LaunchAgents" "$HOME/Library/Logs" || ende "Ordner lässt sich nicht anlegen."
cp "$HIER/pg_etikett.py" "$ZIEL/pg_etikett.py" || ende "pg_etikett.py fehlt neben install.sh."
"$PY" -m venv "$ZIEL/venv" || ende "Die Python-Umgebung lässt sich nicht anlegen."
V="$ZIEL/venv/bin/python"

sag "3/5 Bibliotheken laden (braucht Internet, dauert etwa eine Minute)"
"$V" -m pip install --quiet --upgrade pip
"$V" -m pip install --quiet "brother_ql_next==0.12.0" pillow pyusb qrcode || ende "Die Bibliotheken liessen sich nicht laden. Bitte die Meldungen oben an Claude schicken."
"$V" -m pip install --quiet libusb-package || echo "Hinweis: libusb-package liess sich nicht laden. Falls unten «USB» einen Fehler meldet: Homebrew installieren und «brew install libusb» ausführen."

sag "4/5 Selbsttest (P-touch Editor bitte schliessen, Drucker einschalten)"
"$V" "$ZIEL/pg_etikett.py" --probe
PROBE=$?

sag "5/5 Dienst einrichten und starten"
cat > "$PLIST" <<PL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$NAME</string>
  <key>ProgramArguments</key><array><string>$V</string><string>$ZIEL/pg_etikett.py</string></array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>$HOME/Library/Logs/pg-etikett-dienst.log</string>
  <key>StandardErrorPath</key><string>$HOME/Library/Logs/pg-etikett-dienst.log</string>
</dict></plist>
PL
launchctl bootout "gui/$(id -u)/$NAME" >/dev/null 2>&1
launchctl bootstrap "gui/$(id -u)" "$PLIST" || launchctl load "$PLIST" || ende "Der Dienst lässt sich nicht starten."
# Der erste Start kann dauern (Befund 17.11.2026: nach 2 Sekunden antwortete der Dienst noch nicht): bis zu 30 Sekunden warten.
LAEUFT=0
for i in $(seq 1 15); do sleep 2; if curl -s -m 3 "http://127.0.0.1:9123/status.json" >/dev/null; then LAEUFT=1; break; fi; done
if [ "$LAEUFT" = 1 ]; then echo "Der Dienst läuft: http://127.0.0.1:9123"; else echo "FEHLER: Der Dienst antwortet nicht. Protokoll: $HOME/Library/Logs/pg-etikett-dienst.log"; tail -20 "$HOME/Library/Logs/pg-etikett-dienst.log" 2>/dev/null; PROBE=1; fi

if [ "$PROBE" = 0 ]; then
  printf '\nFERTIG. Jetzt öffnet sich die Seite des Druckprogramms: dort auf «Testetikett 29 × 90 mm» klicken.\n'
  open "http://127.0.0.1:9123/"
else
  printf '\nNOCH NICHT FERTIG: Oben steht mindestens ein FEHLER. Bitte die ganze Ausgabe dieses Fensters kopieren und an Claude schicken.\n'
fi
