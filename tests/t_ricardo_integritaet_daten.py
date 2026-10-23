import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))  # Pfade relativ zu tests/
"""
Ricardo Tool: Suche gegen eine Momentaufnahme des echten Return Tools (Audit 24.10.2026, S1/K1).
200 zufällige Stücke aus allen aktiven Kanal-Tabs werden per ID, Barcode und Name gesucht. Ziel: ID 100 %, Barcode 100 % (wo vorhanden und suchbar).
Daten: Pickle (Liste von dicts tab, id, name, bc, ort), Pfad in RT_PKL oder als erstes Argument. Fehlt die Datei, wird der Test übersprungen.
Lauf: python3 tests/t_ricardo_integritaet_daten.py [pfad/rt.pkl]
"""
import json, pickle, random, subprocess, sys, tempfile, pathlib

PFAD = (sys.argv[1] if len(sys.argv) > 1 else os.environ.get('RT_PKL')) or '/tmp/claude-0/-home-claude/c7242280-2ca0-5036-9a3c-024d9484a5e5/scratchpad/abgleich/rt.pkl'
if not os.path.exists(PFAD):
    print('übersprungen: keine Momentaufnahme des Return Tools unter', PFAD); raise SystemExit(0)
daten = pickle.load(open(PFAD, 'rb'))
AKTIV = ['Online', 'Stationär', 'Analyse', 'Berner Brocki', 'Caritas', 'Heilsarmee', 'Scanner']
random.seed(24102026)
aktiv = [d for d in daten if d['tab'] in AKTIV]
stichprobe = []
for t in AKTIV:                                   # aus jedem aktiven Tab mindestens 10, Rest zufällig
    l = [d for d in aktiv if d['tab'] == t]
    stichprobe += random.sample(l, min(10, len(l)))
rest = [d for d in aktiv if d not in stichprobe]
stichprobe += random.sample(rest, 200 - len(stichprobe))

JS = r'''
const fs = require('fs'), vm = require('vm');
const [codePfad, datenPfad, probePfad] = process.argv.slice(2);
const daten = JSON.parse(fs.readFileSync(datenPfad, 'utf8')), probe = JSON.parse(fs.readFileSync(probePfad, 'utf8'));
const KOPF = ['☑', 'ID', 'Sendung', 'Erfasst', 'Bezeichnung', '#', 'Barcode', 'Link', 'Kategorie', 'OVP', 'VP', 'Wert', 'CH', 'Lagerort', 'Lief-Nr'];
/* Wie im echten Sheet: Ziffern-Barcodes sind Zahlen (führende Nullen gehen verloren), Kopfzeile in Zeile 6 */
const zelle = (bc) => /^\d{1,15}$/.test(bc) ? Number(bc) : bc;
const tabs = {};
daten.forEach(d => { (tabs[d.tab] = tabs[d.tab] || []).push(d); });
const blatt = (name, rows) => ({ getName: () => name, getLastRow: () => rows.length, getDataRange: () => ({ getValues: () => rows }) });
const RT = {};
Object.keys(tabs).forEach(t => {
  const kopf = t === 'Scanner' ? KOPF.filter(k => k !== 'ID') : KOPF;
  RT[t] = blatt(t, [['Return Tool'], [], [], [], [], kopf].concat(tabs[t].map(d => kopf.map(k => ({ ID: d.id, Bezeichnung: d.name, Barcode: zelle(d.bc), Lagerort: d.ort, VP: 10 })[k] ?? ''))));
});
const E = { getName: () => 'Einstellungen', getLastRow: () => 4, getRange: () => ({ getValues: () => [['Return Tool ID', 'RT'], ['Such-Tabs', 'Online'], ['Hinweis-Tabs', 'Stationär, Analyse, Berner Brocki, Caritas, Heilsarmee, Scanner'], ['Analyse Tool ID', 'AT']] }) };
const LISTINGS = { getName: () => 'Listings', getLastRow: () => 1, getRange: () => ({ getValues: () => [] }) };
const ctx = { console, JSON, Math, Date, Object, String, Number, Array, RegExp, Error,
  SpreadsheetApp: { getActive: () => ({ getSheetByName: n => ({ Einstellungen: E, Listings: LISTINGS })[n] || null }),
    openById: id => id === 'RT' ? { getSheetByName: n => RT[n] || null, getSheets: () => Object.keys(RT).map(n => RT[n]) } : { getSheetByName: () => null } },
  CacheService: { getScriptCache: () => ({ get: () => null, getAll: () => ({}), put() {}, putAll() {}, remove() {} }) },
  Utilities: { formatDate: () => '' }
};
vm.createContext(ctx); vm.runInContext(fs.readFileSync(codePfad, 'utf8'), ctx);
/* Ohne Zwischenspeicher würde jede Suche alle Tabs neu aufbereiten: einmal lesen, für alle Suchen merken */
vm.runInContext('var RT_KOPIE = {}; const _q = quelleGemerkt_; quelleGemerkt_ = function (src, tab, frisch) { return RT_KOPIE[tab] || (RT_KOPIE[tab] = _q(src, tab, frisch)); };', ctx);
const alle = (x) => x.treffer.concat(x.andere, x.archiv, x.eigene);
const passt = (d, x) => alle(x).some(r => d.id ? r.id === d.id : (r.tab === d.tab && r.name === d.name));
const st = { id: [0, 0], idVarianten: [0, 0], bc: [0, 0], bcZuKurz: 0, name: [0, 0], nameAbgeschnitten: 0, fehlt: [] };
probe.forEach(d => {
  if (d.id) {
    st.id[1]++; if (passt(d, ctx.suche(d.id))) st.id[0]++; else st.fehlt.push(['ID', d.tab, d.id]);
    const n = d.id.replace(/^PG-/, '');
    ['pg ' + n, 'PG-0' + n, n].forEach(v => { st.idVarianten[1]++; if (passt(d, ctx.suche(v))) st.idVarianten[0]++; else st.fehlt.push(['ID-Variante', d.tab, v]); });
  }
  if (d.bc) {
    if (d.bc.trim().length < 3) st.bcZuKurz++;
    else { st.bc[1]++; if (passt(d, ctx.suche(d.bc))) st.bc[0]++; else st.fehlt.push(['Barcode', d.tab, d.id, d.bc]); }
  }
  st.name[1]++;
  const x = ctx.suche(d.name);
  if (passt(d, x)) st.name[0]++; else if (x.mehr) st.nameAbgeschnitten++; else st.fehlt.push(['Name', d.tab, d.id, d.name]);
});
console.log(JSON.stringify(st));
'''
with tempfile.TemporaryDirectory() as tmp:
    pathlib.Path(tmp, 'daten.json').write_text(json.dumps(daten))
    pathlib.Path(tmp, 'probe.json').write_text(json.dumps(stichprobe))
    pathlib.Path(tmp, 'lauf.js').write_text(JS)
    aus = subprocess.run(['node', str(pathlib.Path(tmp, 'lauf.js')), str(pathlib.Path('../apps/ricardo/Code.gs').resolve()), str(pathlib.Path(tmp, 'daten.json')), str(pathlib.Path(tmp, 'probe.json'))],
                         capture_output=True, text=True, timeout=600)
if aus.returncode:
    print(aus.stderr); raise SystemExit(1)
st = json.loads(aus.stdout.strip().splitlines()[-1])
q = lambda p: '%d/%d = %.1f %%' % (p[0], p[1], 100.0 * p[0] / p[1] if p[1] else 100.0)
print('Stichprobe: %d Stücke aus %s (Momentaufnahme %d Zeilen)' % (len(stichprobe), ', '.join(AKTIV), len(daten)))
print('ID:', q(st['id']), '| ID-Schreibweisen (pg 123, PG-0123, 123):', q(st['idVarianten']))
print('Barcode:', q(st['bc']), '| zu kurz für die Suche (< 3 Zeichen):', st['bcZuKurz'])
print('Name:', q(st['name']), '| mehr als 40 Treffer (abgeschnitten):', st['nameAbgeschnitten'])
for f in st['fehlt'][:20]: print('  nicht gefunden:', f)
fehler = 0
for k in ('id', 'idVarianten', 'bc'):
    if st[k][0] != st[k][1]: fehler += 1; print('FEHLER Trefferquote', k)
if st['name'][0] + st['nameAbgeschnitten'] != st['name'][1]: fehler += 1; print('FEHLER Name nicht gefunden')
print('alle Tests ok' if not fehler else '%d Fehler' % fehler); raise SystemExit(1 if fehler else 0)
