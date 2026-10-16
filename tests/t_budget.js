// Monatsbudget: zählt nur diesen Monat, schätzt laufende Recherchen, 0 = keine
const fs = require('fs'), src = fs.readFileSync(__dirname + '/../apps/analyse/Code.gs', 'utf8');
const ab = src.indexOf('/** Monatsbudget in USD'), bis = src.indexOf('/** Einmal pro Tag ins Log');
const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exit(1); } };
const zahlSrc = src.slice(src.indexOf('function zahl_('), src.indexOf('\n}', src.indexOf('function zahl_(')) + 2);
function lauf(kostenZeilen, laufend, e) {
  const KOPF = ['Zeit', 'Art', 'ID', 'Bezeichnung', 'Modell', 'Tokens Eingabe', 'Tokens Ausgabe', 'Websuchen', 'Suchfehler', 'Abschluss', 'Belegte Infos', 'USD'];
  const blatt_ = () => ({ getLastRow: () => kostenZeilen.length + 1, getRange: () => ({ getValues: () => kostenZeilen.map(r => { const a = KOPF.map(() => ''); a[0] = r[0]; a[1] = r[1]; a[11] = r[2]; return a; }) }) });
  const kopf_ = () => KOPF;
  const lies_ = () => ({ z: Array.from({ length: laufend }, () => ({ 'Recherche-Status': 'Läuft' })) });
  const Utilities = { formatDate: (d, tz, f) => f === 'MM.yyyy' ? (d.getMonth() + 1 < 10 ? '0' : '') + (d.getMonth() + 1) + '.' + d.getFullYear() : '' };
  const f = new Function('blatt_', 'kopf_', 'lies_', 'Utilities', 'CacheService', 'TZ', 'BUDGET_VORGABE', 'BUDGET_SCHAETZUNG', zahlSrc + src.slice(ab, bis) + '; return { frei: rechercheFrei_, kosten: monatsKosten_ };');
  const CacheService = { getScriptCache: () => ({ get: () => null, put() {}, remove() {} }) };   // ohne Zwischenspeicher: rechnet jedes Mal
  return f(blatt_, kopf_, lies_, Utilities, CacheService, 'Europe/Zurich', 150, 0.3);
}
const d = new Date(), mm = (d.getMonth() + 1 < 10 ? '0' : '') + (d.getMonth() + 1), heute = '01.' + mm + '.' + d.getFullYear() + ' 10:00:00';
const alt = '01.' + (mm === '01' ? '02' : '01') + '.2020 10:00:00';
let x = lauf([[heute, 'Vorab-Recherche', 0.2], [heute, 'Vorab-Recherche', '0,4'], [alt, 'Vorab-Recherche', 99], [heute, 'Ricardo-Text', 1]], 2, {});
ok(Math.abs(x.kosten().usd - (0.2 + 0.4 + 1 + 2 * 0.3)) < 1e-9, 'Summe Monat + laufende geschätzt');
ok(x.frei({}) === Math.floor((150 - 2.2) / 0.3), 'frei mit Vorgabe 150');
ok(x.frei({ 'KI-Budget USD pro Monat': 0 }) === 0, '0 = keine');
ok(x.frei({ 'KI-Budget USD pro Monat': '2.5' }) === 1, 'kleines Budget');
x = lauf([], 0, {});
ok(x.frei({ 'KI-Budget USD pro Monat': 3 }) === 10, 'ohne Kosten: Schätzung 0.30');
console.log('ok t_budget');
