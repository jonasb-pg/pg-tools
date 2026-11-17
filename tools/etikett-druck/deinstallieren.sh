#!/bin/bash
# PG Etikett wieder entfernen. Aufruf im Terminal:  bash deinstallieren.sh
NAME="ch.pretty-good.etikett"
launchctl bootout "gui/$(id -u)/$NAME" >/dev/null 2>&1
rm -f "$HOME/Library/LaunchAgents/$NAME.plist"
rm -rf "$HOME/Library/Application Support/PG-Etikett"
echo "PG Etikett ist entfernt. Die Protokolle liegen noch unter ~/Library/Logs/pg-etikett*.log"
