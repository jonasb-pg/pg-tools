/* Matchmaker 2026-10-26.1 (Jonas 26.10.2026): Spalte «Fälligkeit». Bei jedem Lauf wandern Aufträge mit Fälligkeit vor heute nach «Erledigt» (Grund «Abgelaufen»).
   «Erledigt» vereint geholte und abgelaufene Aufträge, «Zurück in die Liste» holt beide zurück. Heute im Test: 24.10.2026. Erfundene Daten.
   Lauf: node tests/t_matchmaker_faellig.js */
const assert = require('assert');
const { umgebung, P, rt, z } = require('./t_matchmaker_p2410_h.js');
const K2 = ['Gesucht', 'Mehr Infos', 'Flexibilität', 'Limit CHF', 'Fälligkeit', 'Suchprofil', 'Passt', 'Ähnlich 1', 'Ähnlich 2', 'Ähnlich 3', 'Geholt', 'Aus Analyse'];
const a = (g, faellig, aus, flex) => [g, '', flex || '', 50, faellig, P(g), '', '', '', '', false, aus || ''];
const liste = () => ({ 'Matchmaker': [['Matchmaker'], [''], K2,
  a('Toaster', '23.10.2026', '', 'hoch'), a('Velo', '24.10.2026'), a('Lampe', ''), a('Kocher', 'bald'), a('Tisch', new Date(2026, 9, 1), 'PG-5 · Tisch Eiche · 20.10.2026')] });
const offen = (env) => env.mm().v.slice(3).filter(r => r[0]).map(r => r[0]);
const E = (env) => env.E().v, ek = (env, n) => E(env)[0].indexOf(n), erl = (env, g) => E(env).find(r => r[ek(env, 'Gesucht')] === g);

let env = umgebung({ mm: liste(), rt: rt([z('PG-1', '24.10.2026', 'Philips Toaster', '111', '', 20, 'HOM-1')]) });
env.c.sucheHeute();
assert.deepStrictEqual(offen(env), ['Velo', 'Lampe', 'Kocher'], 'abgelaufen (23.10., 01.10.) weg, heute fällig / leer / kein Datum bleiben: ' + offen(env));
const t = erl(env, 'Toaster'), ti = erl(env, 'Tisch');
assert.ok(t && t[ek(env, 'Grund')] === 'Abgelaufen' && ek(env, 'Flexibilität') < 0 && ek(env, 'Fälligkeit') < 0, 'Toaster in «Erledigt» mit Grund; keine Spalten Flexibilität/Fälligkeit (Jonas 12:23)');
assert.ok(ti[ek(env, 'Aus Analyse')] === '' && /PG-5/.test(ti[ek(env, 'Aus Analyse (abgelaufen)')]), 'abgelaufen: Vermerk nicht in «Aus Analyse» (sonst gilt das Stück als geholt), sondern in «Aus Analyse (abgelaufen)»');
assert.ok(/2 Suchaufträge abgelaufen/.test(env.status()) && /1 Zellen in «Fälligkeit» sind kein Datum/.test(env.status()), env.status());
env.v1();

/* Zurück in die Liste: Fälligkeit leer, Vermerk zurück in «Aus Analyse» */
const ziel = env.E(), zr = E(env).indexOf(ti) + 1;
ziel.v[zr - 1][ek(env, 'Zurück in die Liste')] = true;
env.c.onEdit(env.ev(ziel, zr, ek(env, 'Zurück in die Liste') + 1));
const zur = env.mm().v.find(r => r[0] === 'Tisch');
assert.ok(zur && !zur[4] && /PG-5/.test(zur[11]) && !erl(env, 'Tisch'), 'Tisch zurück: Fälligkeit leer, «Aus Analyse» wieder da');

/* Geholt: Grund «Geholt», Fälligkeit und Flexibilität bleiben, «Aus Analyse» wie bisher */
const mm = env.mm(), vr = mm.v.findIndex(r => r[0] === 'Velo') + 1;
mm.v[vr - 1][10] = true;
env.c.onEdit(env.ev(mm, vr, 11));
const v = erl(env, 'Velo');
assert.ok(v && v[ek(env, 'Grund')] === 'Geholt', 'Velo geholt: Grund «Geholt»');

/* Ohne Spalte «Fälligkeit»: nichts verschoben */
env = umgebung({ mm: { 'Matchmaker': [['Matchmaker'], [''], K2.filter(k => k !== 'Fälligkeit'), ['Toaster', '', '', 50, P('Toaster'), '', '', '', '', false, '']] } });
env.c.sucheHeute();
assert.deepStrictEqual(offen(env), ['Toaster'], 'ohne Spalte «Fälligkeit» bleibt alles');
console.log('t_matchmaker_faellig ok');
