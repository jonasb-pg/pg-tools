#!/bin/sh
# Alle Tests beider Tools. Aufruf vom Repo aus: sh tools/tests.sh   (Python-Tests brauchen Playwright mit Chromium)
cd "$(dirname "$0")/.." || exit 1
fehler=0
for t in tests/*.js; do node "$t" >/dev/null 2>&1 && echo "ok   $t" || { echo "FEHL $t"; fehler=1; }; done
for t in tests/*.py; do timeout 180 python3 "$t" >/dev/null 2>&1 && echo "ok   $t" || { echo "FEHL $t"; fehler=1; }; done
for f in apps/*/Code.gs apps/basis/Basis.gs; do cp "$f" /tmp/pruef.js && node --check /tmp/pruef.js || { echo "SYNTAX $f"; fehler=1; }; done
exit $fehler
