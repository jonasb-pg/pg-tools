"""Erzeugt docs/datenmodell.md, docs/api.md und docs/einstellungen.md aus data/code-facts.json und data/einstellungen-snapshot.json.
Aufruf: node tools/extract.js && python3 tools/gen.py"""
import json, os
B = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
f = json.load(open(f'{B}/data/code-facts.json', encoding='utf8'))
e = json.load(open(f'{B}/data/einstellungen-snapshot.json', encoding='utf8'))
def esc(s): return str(s).replace('|', '\\|').replace('\n', '<br>')
KOPF = '<!-- Automatisch erzeugt mit tools/gen.py aus src/Code.gs (Version {v}). Nicht von Hand ändern. -->\n\n'.format(v=f['version'])

# Datenmodell
ROLLE = {
 'Produkte': ('Abgleich (aus Return Tool, Tab «Analyse»), ohneInventar', 'alle', '1 Zeile pro Stück (PG-ID)'),
 'Recherche': ('Vorab-Recherche (Batch), rechercheJetzt', 'ueberblick_', '1 Zeile pro Schlüssel × Feld'),
 'Analysen': ('abschliessen', 'Auswertung, suche (Regal Matchmaker), matchmakerZurueck', '1 Zeile pro abgeschlossene Analyse'),
 'Prüfschritte': ('abschliessen', 'Auswertung', '1 Zeile pro geprüftem Punkt'),
 'Testmittel': ('Mensch (Vorhanden), abschliessen (neue Namen)', 'ueberblick_', '1 Zeile pro Testmittel'),
 'Testmittel-Log': ('abschliessen', 'Auswertung', '1 Zeile pro Nennung'),
 'Feedback': ('feedback', 'Jonas', '1 Zeile pro Eintrag; Status von Hand'),
 'Ricardo': ('abschliessen (kanal ricardo)', 'Ricardo Tool (geplant: Maske)', '1 Zeile pro Inserat'),
 'Bestellliste': ('reparaturPause', 'Startseite (Teil-Status), Besteller:in', '1 Zeile pro Teil; Status von Hand'),
 'Ersatzteile': ('ersatzteilSuche', 'ersatzteile, «Später reparieren»', '1 Zeile pro Angebot'),
 'Quellen-Log': ('Recherche', 'Analyse der Quellen', '1 Zeile pro Quelle und Recherche'),
 'Batches': ('Abgleich', 'Abgleich', '1 Zeile pro Batch der Claude Batch API'),
 'Log': ('log_', 'Fehlersuche', '1 Zeile pro Ereignis'),
 'Sicherheitspunkte': ('Mensch', 'ueberblick_', '1 Zeile pro Punkt, «Gilt für» filtert'),
 'Stufen': ('Mensch', 'stufe_', '1 Zeile pro Herkunft × VP-Schwelle'),
 'Einstellungen': ('Mensch, einrichten', 'einst_', '1 Zeile pro Einstellung'),
}
L = ['# Datenmodell', '', KOPF, 'Sheet **ANALYSE TOOL** `1jhmq1JoyM6Xor33pM77AmOixbvqKuGzfFX-js9PdIrM`. Spaltennamen sind Schlüssel: Der Code liest und schreibt nach Name, nicht nach Position. `einrichten()` prüft, ob alle Spalten da sind.', '',
     '| Tab | Schreibt | Liest | Granularität |', '|---|---|---|---|']
for t in f['spalten']:
    r = ROLLE.get(t, ('', '', ''))
    L.append(f'| {t} | {esc(r[0])} | {esc(r[1])} | {esc(r[2])} |')
L += ['', 'Zusätzlich angelegt bei Bedarf: «Kosten» (jeder KI-Aufruf), «Bestellliste», «Feedback», «Ricardo». «Auswertung», «Score-Regeln», «Listen» sind Formel-/Werte-Tabs ohne feste Spalten.', '']
for t, cols in f['spalten'].items():
    if not cols: continue
    L += [f'## {t}', '', '| # | Spalte |', '|---|---|'] + [f'| {i+1} | {esc(c)} |' for i, c in enumerate(cols)] + ['']
open(f'{B}/docs/datenmodell.md', 'w', encoding='utf8').write('\n'.join(L))

# API
def clean(d): return '' if not d or d.startswith('-') else d
L = ['# Server-Funktionen', '', KOPF, 'Einziger Einstieg aus der Oberfläche: `api(lang, name, args)` in `Code.gs`. Fehler entstehen deutsch und werden über `EN_REGELN` übersetzt.', '',
     '## Aufrufbar aus der Oberfläche', '', '| Funktion | Parameter | Zeile | Zweck |', '|---|---|---|---|']
L += [f"| `{a['name']}` | `{esc(a.get('params',''))}` | {a.get('zeile','')} | {esc(clean(a.get('doc','')))} |" for a in f['api']]
L += ['', '## Intern (Endung `_` = nicht aufrufbar aus dem Browser)', '', '| Funktion | Parameter | Zeile | Zweck |', '|---|---|---|---|']
L += [f"| `{a['name']}` | `{esc(a.get('params',''))}` | {a.get('zeile','')} | {esc(clean(a.get('doc','')))} |" for a in sorted(f['intern'], key=lambda x: x.get('zeile', 0))]
open(f'{B}/docs/api.md', 'w', encoding='utf8').write('\n'.join(L) + '\n')

# Einstellungen
L = ['# Einstellungen (Tab «Einstellungen»)', '', KOPF.replace('aus src/Code.gs', 'aus data/einstellungen-snapshot.json'), e['_quelle'], '',
     'Quelle der Wahrheit ist das Sheet. `einrichten()` legt fehlende Zeilen aus `NEUE_EINSTELLUNGEN` (Code) an, ändert bestehende Werte aber nicht.', '',
     '| Einstellung | Wert | Zweck |', '|---|---|---|']
lang = []
for n, w, x in e['zeilen']:
    if len(w) > 160: lang.append((n, w)); w = f'siehe [{n}](#{n.lower().replace(" ", "-")})'
    L.append(f'| {esc(n)} | {esc(w)} | {esc(x)} |')
L += ['', '## Prompts im Wortlaut', '']
for n, w in lang: L += [f'### {n}', '', '```text', w, '```', '']
open(f'{B}/docs/einstellungen.md', 'w', encoding='utf8').write('\n'.join(L))
print('ok')
