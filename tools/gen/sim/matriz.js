// Matriz de perfiles: invariantes de §E.13 y calidad. node matriz.js [--pesos=propuesta|ajustados] [--tipo=literal] [--pases=literal] [--reparto=recomendado|dias] [--n=4] [--out=dir] [--ver=N]
// Medición 3 (paso 2): --reparto y comprobaciones de selección y reparto (ver «Medición 3» en 40-simulacion.md). Las claves de las mediciones 1 y 2 no cambian.
// Medición 4 (paso 3): volumen con la cuenta fraccional por patrón y el deltoides por cabezas (K.volV, 05 §1.1), calculado aquí desde las filas
// (independiente del generador) contra los objetivos de §E.3 revisados; techo (V8) y tope por sesión (V9) en fraccionales; ver 40-simulacion.md.
// --ver=N mide versiones/generador-vN.js con versiones/textos-vN.js (p. ej. --ver=4 = fila v4b).
// Medición 5 (paso 4): invariantes de seguridad, modos y textos de seguridad.js (C-01, C-07, C-09, C-10, C-12…C-17, C-23, C-33, D-01…D-03,
// I-4, I-11, I-12) en los 4.200 perfiles y en un BLOQUE DE SEGURIDAD aparte (perfiles con huesos frágiles, posparto, lesión reciente,
// «Prefiero no decirlo», 65+ con experiencia, 16-17 con fuerza, parón de más de 2 años, tensión con inactividad, 65+ con días seguidos,
// nivel efectivo…), que se informa en `seguridad` sin mezclarse con las tasas de siempre (--seg=0 lo quita). Desde v7, el perfil
// deja la preferencia «sin suelo» sin marcar para que desdeRespuestas aplique su defecto (marcada con 65 o más, I-11).
'use strict';
const fs = require('fs'), path = require('path');
const arg = k => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : null; };
const OPT = {}; ['pesos', 'tipo', 'pases', 'reparto'].forEach(k => { if (arg(k)) OPT[k] = arg(k); });
// --tope=no: principiantes con 5-6 días hacen todos los días de pesas (decisión D5 del usuario, 6 nov: hay que soportar los dos casos)
if (arg('tope') === 'no') OPT.topePrincipiante = false;
// --enfoque=gluteo (D10, 6 nov): todos los perfiles con el enfoque «más glúteo y menos torso» (solo se ofrece a las mujeres)
const ENFOQUE = arg('enfoque') === 'gluteo' ? 'gluteo' : arg('enfoque') === 'torso' ? 'torso' : null;   // v14 (P2): --enfoque=torso, todos piden «Más torso» (un día de pierna)
// --plan=rota (v14, P1): cada perfil al que se le ofrecen otros repartos en «Cambiar reparto» (G.planes) pide uno de ellos, rotando;
// las invariantes son las mismas. La salida lleva `plan`: cuántos lo pidieron y cuántos salieron con él, por reparto
const PLAN = arg('plan') === 'rota';
// --roles=azar (v14, P6): cada perfil con 3 días o más pide una semana montada día a día (el tipo de cada día, por su número de perfil:
// sale de todo, también semanas sin pierna o sin tirón); el generador la aplica solo a quien puede elegir y si queda equilibrada
const ROLES = arg('roles') === 'azar', TIPOS8 = ['torso', 'pierna', 'empuje', 'tiron', 'completo', 'pecho_triceps', 'espalda_biceps', 'hombros_brazos'];
const conRoles = pr => { if (!ROLES || !(pr.a.days >= 3)) return; pr.a.roles = Array.from({ length: pr.a.days }, (_, i) => TIPOS8[(pr.id * 7 + i * (3 + pr.id % 4) + (pr.id >> 3)) % 8]); };
// --sesion (v15, tipo de sesión): cada perfil elige el tipo de sesión que corresponde a sus minutos (G.sesionDe) en vez de decirlos. Las
// invariantes son las mismas (los minutos pasan a ser el presupuesto interno del tipo) más las del tipo (seguridad.js); y los perfiles de
// «Completa» se generan también con «Lo esencial» y «A fondo» para comprobar el orden: ejercicios por día y minutos, de menos a más.
// El orden se exige entre tipos que salen con el mismo reparto; si el material o una molestia cambian el reparto de un tipo a otro (otro
// número de entrenos), los días no se pueden comparar uno a uno: se cuenta aparte (sesion_orden_otro_reparto), sin ser un fallo
const SES = process.argv.includes('--sesion');
// (T3) y mueve los dos interruptores: 1 de cada 3 sin abdominales; el cardio, el de su objetivo o 0, 10 o 20 min
const conSesion = pr => { if (!SES) return; pr.a.sesion = G.sesionDe(pr.a.min); if (pr.id % 3 === 0) pr.a.abs = false; if (pr.id % 4) pr.a.cardio = [0, 10, 20][pr.id % 4 - 1]; };
const ordenSesion = (pr, inp, res, f) => { if (!SES || inp.sesion !== 'completa') return;
  const de = s => { const m = G.genRoutine(G.desdeRespuestas(Object.assign({}, pr.a, { sesion: s }))).meta; return Object.assign({ split: m.split }, m.sesion); }, e = de('esencial'), c = Object.assign({ split: res.meta.split }, res.meta.sesion), fo = de('fondo'), med = s => s.ej.reduce((x, y) => x + y, 0) / s.ej.length;
  // (holgura: los minutos van redondeados a 5 y dos rutinas casi iguales pueden caer a un lado y a otro; un ejercicio menos en un solo día
  // tampoco es «dar menos». Lo que queda dentro de la holgura se cuenta aparte: sesion_orden_casi)
  const casi = (a, b) => !(med(a) <= med(b) + 1e-9 && a.min <= b.min), mal = (a, b) => !(med(a) <= med(b) + 0.34 && a.min <= b.min + 5), txt = `${e.ej.join('/')} ≈${e.min} · ${c.ej.join('/')} ≈${c.min} · ${fo.ej.join('/')} ≈${fo.min}`;
  if ((e.split === c.split && mal(e, c)) || (c.split === fo.split && mal(c, fo))) f.sesion_orden = txt; else if (mal(e, c) || mal(c, fo)) f._otroReparto = txt; else if (casi(e, c) || casi(c, fo)) f._casi = txt;
  // (T8) los minutos de las tarjetas (G.tiemposSesion, con los cuatro tipos): dos seguidos con rutinas distintas no enseñan el mismo tiempo
  // ni al revés (sesion_tarjetas), salvo que el mayor no dure de verdad un minuto más: entonces el mismo, y se cuenta aparte
  // (sesion_tarjetas_mismo_tiempo, la tarjeta dice «en el mismo tiempo que…»); dos con la misma rutina, siempre el mismo
  const I = { expres: de('expres'), esencial: e, completa: c, fondo: fo }, D = G.tiemposSesion(I), ts = ['expres', 'esencial', 'completa', 'fondo'];
  ts.forEach((t, i) => { if (!i) return; const p = ts[i - 1], tt = `${p} ≈${D[p]} (${I[p].minX}) · ${t} ≈${D[t]} (${I[t].minX})`;
    if (I[t].firma === I[p].firma) { if (D[t] !== D[p]) f.sesion_tarjetas = tt; }
    else if (D[t] < D[p] || (D[t] === D[p] && I[t].minX - I[p].minX >= 1)) f.sesion_tarjetas = tt;
    else if (D[t] === D[p]) f._mismoTiempo = tt; }); };
const planStat = { pedidos: 0, salen: 0, por: {} };
const conPlan = pr => { if (!PLAN) return; const o = G.planes(G.desdeRespuestas(pr.a)).otros; if (o.length) pr.a.plan = o[pr.id % o.length]; };
const cuentaPlan = (pr, res) => { if (!pr.a.plan) return; const p = planStat.por[pr.a.plan] = planStat.por[pr.a.plan] || { pedidos: 0, salen: 0 }; planStat.pedidos++; p.pedidos++; if (res.meta.split === pr.a.plan) { planStat.salen++; p.salen++; } };
// --cat=N carga versiones/catalogo-vN.js (para reproducir una versión vieja con su catálogo: p. ej. --ver=6 --cat=4)
const K = require(arg('cat') ? './versiones/catalogo-v' + arg('cat') + '.js' : './catalogo.js')(null, { basic: arg('basic') || undefined });
const VER = arg('ver');
const G = require(VER ? './versiones/generador-v' + VER + '.js' : './generador.js')(K, OPT);
const X = require(VER ? './versiones/textos-v' + VER + '.js' : './textos.js')(K, G);
const OUT = arg('out') || __dirname;
// medición 5: solo con generadores que ya dejan meta.effort (v7 en adelante); con --ver de antes, no se mide (saldría todo en fallo)
const SEG = (X.prohibidas && (!VER || +VER >= 7)) ? require('./seguridad.js')(K, G, X) : null;
// --solo=id,id… (depuración): solo esos perfiles (de los 4.200 o del bloque de seguridad, ids 100000+), con su rutina y sus fallos en pantalla
const SOLO = arg('solo') ? new Set(arg('solo').split(',').map(Number)) : null;

// ── Medición 4: objetivos por grupo de planificación (§E.3 revisado en el paso 3: 05 §1.2 «inicio por defecto» × objetivo; deltoides por cabezas) ──
const BASE_V = { pecho: [8, 11, 13], espalda: [9, 12, 14], hombro_lat: [5, 7, 8], hombro_post: [7, 9, 11], biceps: [4, 6, 8], triceps: [4, 6, 8], abdomen: [3, 5, 6],
  cuads: [8, 11, 13], isquios: [7, 10, 12], gluteos: [8, 12, 14], gemelos: [2, 4, 6] };
const MULT_V = { musculo: 1, fuerza: 0.75, grasa: 0.9, salud: 0.65, aguante: 0.85 };
const CEIL_V = { P0: 12, P: 12, I: 18, A: 20 };
const LVv = { P0: 0, P: 1, I: 2, A: 3 };
function prioV(inp) { const s = new Set(); if (inp.enfoque === 'gluteo') s.add('gluteos'); (inp.prio || []).slice(0, 2).forEach(p => { if (p === 'brazos') { s.add('biceps'); s.add('triceps'); } else if (p === 'piernas') { s.add('cuads'); s.add('isquios'); } else if (p === 'hombros') { s.add('hombro_lat'); s.add('hombro_post'); } else s.add(p); }); return s; }
function objetivosV(inp, P) {
  const i = LVv[P.lvV] <= 1 ? 0 : LVv[P.lvV] - 1, pr = prioV(inp), obj = {}, top = {}, ceil = {}, top0 = {};
  for (const g of K.PG) {
    const c = CEIL_V[P.lvV]; ceil[g] = pr.has(g) ? (P.lvV === 'A' ? 24 : c * 1.2) : c;
    if (!BASE_V[g]) { obj[g] = 0; top[g] = 0; continue; }
    let v = BASE_V[g][P.mayor && !P.mayorExp ? 0 : i] * (P.mayor ? Math.min(MULT_V[inp.goal], 0.65) : MULT_V[inp.goal]);   // medición 5 (C-07): 65+ con experiencia, base de intermedio
    if (P.lvV === 'P0') v *= 0.75;
    if (pr.has(g)) v *= 1.25;
    if (inp.enfoque === 'gluteo') v *= g === 'gluteos' ? 1.15 : (g === 'cuads' || g === 'isquios') ? 1.1 : ['pecho', 'espalda', 'hombro_lat', 'hombro_post', 'biceps', 'triceps'].includes(g) && !pr.has(g) ? 0.75 : 1;   // v12 (D10)
    if (inp.sport === 'piernas' && ['cuads', 'isquios', 'gluteos', 'gemelos'].includes(g)) v *= 0.8;
    if (K.PBIG.includes(g)) v = Math.max(4, v);
    obj[g] = Math.round(v * 100) / 100; top[g] = Math.max(obj[g] * (pr.has(g) ? 1.5 : 1.3), obj[g] + 2);   // (+2: con objetivos bajos, un ejercicio de 2 series)
    top0[g] = top[g];   // (medición 6: lo alto del rango de siempre, para «no hace falta más»)
    // medición 6 (J-15): I/A sin precaución con 60 min o más → hasta la parte alta del rango objetivo de 05 §1.2 (× 1,4 I · × 1,5 A; +0,15 prioritario)
    if (LVv[P.level] >= 2 && !P.cauto && inp.min >= 60) top[g] = Math.min(ceil[g], Math.max(top[g], obj[g] * ((P.lvV === 'A' ? 1.5 : 1.4) + (pr.has(g) ? 0.15 : 0))));
    // v12 (D10): «más glúteo» → torso y brazos en su objetivo (× 0,75) con poco margen (objetivo × 1,15, mín. +1), también con 60 min o más
    if (inp.enfoque === 'gluteo' && ['pecho', 'espalda', 'hombro_lat', 'hombro_post', 'biceps', 'triceps'].includes(g) && !pr.has(g)) top[g] = top0[g] = Math.max(obj[g] * 1.15, obj[g] + 1);
  }
  return { obj, top, ceil, pr, top0 };
}
// zona de cada plantilla (como ZONA_TPL del generador, con el hombro por cabezas)
const HO = ['hombro_ant', 'hombro_lat', 'hombro_post'];
// v14 (P1): los tipos de día de los repartos que elige la persona (pierna única, por músculos)
const ZONA_P1 = { PU: ['cuads', 'isquios', 'gluteos', 'gemelos', 'abdomen'], PT: ['pecho', 'triceps', 'abdomen'], EB: ['espalda', 'biceps', 'hombro_post', 'abdomen', 'gemelos'], HB: [...HO, 'biceps', 'triceps', 'abdomen'],
  PE: ['pecho', 'abdomen', 'gemelos'], ES: ['espalda', 'hombro_post', 'abdomen'], HO: [...HO, 'abdomen', 'gemelos'], BR: ['biceps', 'triceps', 'abdomen'] };
const ZONA_V = r => ZONA_P1[r] ? ZONA_P1[r] : /^T\d$/.test(r) ? ['pecho', 'espalda', ...HO, 'biceps', 'triceps', 'abdomen'] : /^(P\d|Pi)/.test(r) ? ['cuads', 'isquios', 'gluteos', 'gemelos', 'abdomen'] :
  /^E/.test(r) ? ['pecho', ...HO, 'triceps', 'abdomen'] : /^Ti/.test(r) ? ['espalda', 'biceps', ...HO, 'abdomen', 'gemelos'] : /^TC$/.test(r) ? ['pecho', 'espalda', ...HO, 'biceps', 'triceps', 'abdomen'] : /^PC$/.test(r) ? ['cuads', 'isquios', 'gluteos', 'gemelos', 'abdomen'] : K.PG;
// ¿hay con qué entrenar el grupo (ejercicio cuyo grupo principal es ese) en los sitios de la rutina? (caché por material y seguridad)
const matC = new Map();
function materialV(inp, P, res, solo) {
  const pls = solo ? [solo] : [...new Set(Object.values(res.meta.dayPlace))];
  const key = JSON.stringify([pls.map(p => inp.places[p]), inp.zones, inp.pref, inp.age, inp.modes, inp.power, P.difCap, P.dif2]);
  if (matC.has(key)) return matC.get(key);
  const out = {};
  for (const g of K.PG) out[g] = K.C.some(L => L.lt !== 'c' && K.mainGroupV(L) === g && (L.dif <= P.difCap || (P.dif2 && L.dif === 2)) && pls.some(p => K.placeCan(L, inp.places[p], p)) && G.safeL(L, inp));
  matC.set(key, out); return out;
}

// ── Medición 2 (paso 1 · diagnóstico, 44-diagnostico-algoritmo.md). Comprobaciones NUEVAS: no cambian las de v1. ──
// Flexión o rotación de columna con carga (§E.5, 65 o más): la lista SPINE del catálogo (8) más las que faltan.
const SPINE_AMPLIADA = new Set(['situp', 'v_up', 'russian_twist_db', 'plate_russian_twist', 'mb_russian_twist', 'crunch_cable', 'crunch_machine', 'crunch_db',
  'plate_crunch', 'side_bend_db', 'woodchop_db', 'woodchop_high_cable', 'woodchop_low_cable', 'landmine_rotation', 'torso_rotation_machine', 'mb_rot_throw'].map(i => 'lib_' + i));
// Rarezas (provisional, criterio de entrenador): variantes que no se ponen en un gimnasio habiendo una estándar equivalente.
const RAREZA = new Set(['squat_cable', 'landmine_squat', 'vsquat', 'belt_squat', 'kb_sumo_squat', 'sumo_squat_db', 'miniband_squat', 'trx_pistol', 'kb_deadlift', 'deadlift_db', 'db_swing',
  'kb_swing_american', 'kb_sl_rdl', 'band_good_morning', 'superman', 'ball_back_ext', 'leg_curl_db', 'trx_leg_curl', 'calf_smith', 'calf_seated_db', 'cable_chest_press', 'press_decline_db',
  'close_press_db', 'pushup_archer', 'bench_dip', 'ring_dip', 'pulldown_machine_uni', 'scap_pullup', 'renegade_row_db', 'row_cable_standing', 'meadows_row', 'row_smith', 'backpack_row',
  'inverted_row_table', 'trx_y_raise', 'y_raise_cable', 'hspu_wall', 'handstand_hold', 'curl_cable_high', 'spider_curl_db', 'zottman_curl_db', 'reverse_curl_bb', 'reverse_curl_db',
  'tricep_pushdown_rev', 'tricep_kickback_cable', 'trx_tricep_ext', 'flutter_kick', 'heel_touch', 'plank_shoulder_tap', 'ball_pass', 'ball_pike', 'trx_pike', 'mb_rot_throw',
  'plate_russian_twist', 'mountain_climber', 'side_bend_db', 'curtsy_lunge_db', 'curtsy_lunge_bw', 'cossack_squat', 'band_lunge', 'trx_lunge', 'hip_thrust_sofa', 'donkey_kick',
  'miniband_kickback', 'band_glute_kickback', 'ball_bridge'].map(i => 'lib_' + i));
// Músculo objetivo de cada hueco: el ejercicio debe cargar alguno con peso ≥ 0,8 (core ≥ 0,6). Si no, «hueco con músculo ajeno».
const HUECO_MUS = { SQ: ['quads'], LU: ['quads', 'glutes'], HI: ['hams', 'glutes'], HE: ['glutes'], KF: ['hams'], KE: ['quads'], CA: ['calves'], PH: ['pecs', 'upperpecs', 'lowerpecs'],
  PI: ['upperpecs', 'pecs', 'frontdelts'], PV: ['frontdelts', 'sidedelts'], FL: ['pecs', 'upperpecs', 'lowerpecs'], TV: ['lats', 'midback'], TH: ['midback', 'lats'], RA: ['sidedelts'],
  RE: ['reardelts'], CU: ['biceps'], TR: ['triceps'], CO: ['abs', 'obliques'] };
const musAjeno = (L, slot) => { const ms = HUECO_MUS[slot]; if (!ms) return false; const thr = slot === 'CO' ? 0.6 : 0.8; return !ms.some(m => (L.mus[m] || 0) >= thr); };
const ZL = { rodilla: 'rodilla', hombro: 'hombro', lumbar: 'espalda baja', muneca: 'muñeca o codo', cadera: 'cadera' };
const NV = +(arg('n') || 4);
const TAG = (OPT.pesos || 'propuesta') + (OPT.tipo ? '-tipo_' + OPT.tipo : '') + (OPT.pases ? '-pases_' + OPT.pases : '') + (arg('basic') ? '-basic_' + arg('basic') : '') + (OPT.reparto === 'dias' ? '-dias' : '') + (process.argv.includes('--sesion') ? '-sesion' : '') + (VER ? '-v' + VER : '');
// medición 3: etiqueta std (menus.js) y levantamientos objetivo
const MN = require('./menus.js')(K);
const LIFT_ID = { SQ: 'lib_back_squat', PH: 'lib_bench_press', HI: 'lib_deadlift', PV: 'lib_ohp_bb' };
const LEG_ONLY = /^(P\d|Pi)/;

const GOALS = ['musculo', 'fuerza', 'grasa', 'salud', 'aguante'];
const EXPS = [{ exp: 'cero' }, { exp: 'lt6m' }, { exp: '6m2a' }, { exp: 'gt2a', ritmo: 'meses' }, { exp: 'gt2a', ritmo: 'semanas' }, { exp: 'paron', paron: { antes: '6m2a', fuera: 'gt6m' } }];
const DAYS = [2, 3, 4, 5, 6];
const MINS = [15, 20, 30, 45, 60, 75, 90];
const PRESETS = ['grande', 'barrio', 'hotel', 'box', 'nada', 'basico', 'mancbanco', 'casagym', 'parque'];
const ZONAS = [{ n: 'ninguna', z: {} }, { n: 'rodilla ahora', z: { rodilla: 'ahora' } }, { n: 'hombro antigua', z: { hombro: 'antigua' } }, { n: 'lumbar op', z: { lumbar: 'op' } },
  { n: 'muñeca+rodilla antigua', z: { muneca: 'antigua', rodilla: 'antigua' } }, { n: 'cadera ahora', z: { cadera: 'ahora' } }, { n: 'otra zona', z: { otra: 'ahora' } },
  { n: 'sin impacto', z: {}, pref: { impact: false } }, { n: 'sin suelo', z: {}, pref: { floor: false } }, { n: '4 zonas', z: { rodilla: 'antigua', hombro: 'ahora', lumbar: 'antigua', muneca: 'ahora' }, pref: { impact: false } },
  { n: 'ninguna', z: {} }, { n: 'ninguna', z: {} }];
const EDADES = ['18', '40', '18', '40', '65', '75', '16', 'nd', '18', '40'];
const SPORT = ['no', 'suave', 'piernas', 'agua', 'no'];
const PRIO = [[], [], ['gluteos'], [], ['brazos', 'pecho'], [], ['espalda'], []];

function perfiles() {
  const out = []; let i = 0;
  for (const goal of GOALS) for (const ex of EXPS) for (const days of DAYS) for (const min of MINS) for (let k = 0; k < NV; k++, i++) {
    const preset = PRESETS[(i * 7 + k * 4) % PRESETS.length];
    const zn = ZONAS[(i * 5 + k * 3 + Math.floor(i / 9)) % ZONAS.length];
    const age = EDADES[(i * 3 + k * 7 + Math.floor(i / 11)) % EDADES.length];
    const kind = K.PRESETS[preset].kind;
    const places = { main: kind, g: null, c: null }; places[kind] = K.place(preset);
    let daysOther = 0;
    if (i % 9 === 4 && days >= 2) { const other = kind === 'g' ? 'c' : 'g'; places[other] = K.place(other === 'c' ? 'basico' : 'barrio'); daysOther = days >= 4 ? 2 : 1; }
    // (medición 5: la preferencia sin marcar → el defecto de desdeRespuestas: «sin suelo» marcado con 65 o más, I-11)
    const a = { goal, ...ex, days, min, consec: days >= 3 && i % 7 === 3, age, screen: i % 13 === 7 ? 'med' : 'nada', zones: Object.assign({}, zn.z), pref: Object.assign({}, zn.pref || {}),
      sport: SPORT[i % SPORT.length], prio: PRIO[i % PRIO.length], style: ['igual', 'maq', 'libre'][i % 3], power: i % 11 === 5, cardioEnd: i % 17 === 3 ? 'si' : i % 17 === 9 ? 'no' : 'auto', daysOther, places };
    if (ENFOQUE) a.enfoque = ENFOQUE;   // v12 (D10)
    out.push({ id: i, a, preset, zona: zn.n });
  }
  return out;
}
// Medición 5: bloque de seguridad (aparte de los 4.200). Cada caso especial × 5 objetivos × 5 días × 4 duraciones, con el material rotando.
const ESPECIALES = [
  { n: 'huesos frágiles', a: { huesos: true } }, { n: 'posparto con alta', a: { posparto: 'alta', age: '18' } },
  { n: 'lumbar reciente', a: { zones: { lumbar: 'reciente' } } }, { n: 'rodilla reciente', a: { zones: { rodilla: 'reciente' } } },
  { n: 'hombro ahora', a: { zones: { hombro: 'ahora' }, exp: 'gt2a', ritmo: 'meses' } }, { n: 'rodilla ahora (I/A)', a: { zones: { rodilla: 'ahora' }, exp: 'gt2a', ritmo: 'semanas' } },
  { n: 'otra zona ahora', a: { zones: { otra: 'ahora' } } }, { n: 'prefiere no decir la edad', a: { age: 'nd', exp: 'gt2a', ritmo: 'semanas' } },
  { n: '65 con experiencia', a: { age: '65', exp: 'gt2a', ritmo: 'semanas' } }, { n: '75 con experiencia', a: { age: '75', exp: '6m2a' } },
  { n: '16-17', a: { age: '16' } }, { n: 'parón de más de 2 años', a: { exp: 'paron', paron: { antes: 'gt2a', fuera: 'gt2a' } } },
  { n: 'tensión e inactividad', a: { screen: ['enf', 'med'], exp: 'cero', sport: 'no' } }, { n: '65 con días seguidos', a: { age: '65', consec: true } },
  { n: 'nivel efectivo (empezó de cero)', a: { exp: 'cero', efectiva: { sesiones: 30, semanas: 10 } } },
];
function perfilesSeguridad() {
  const out = []; let i = 0;
  for (const es of ESPECIALES) for (const goal of GOALS) for (const days of DAYS) for (const min of [20, 30, 45, 75]) {
    const preset = PRESETS[(i * 5 + days) % PRESETS.length], kind = K.PRESETS[preset].kind;
    const places = { main: kind, g: null, c: null }; places[kind] = K.place(preset);
    const a = Object.assign({ goal, exp: '6m2a', days, min, consec: false, age: '40', screen: 'nada', zones: {}, pref: {}, sport: 'no', prio: [], style: 'igual', power: i % 4 === 1, cardioEnd: 'auto', daysOther: 0, places }, JSON.parse(JSON.stringify(es.a)));
    if (es.a.consec && days < 3) a.consec = false;
    if (ENFOQUE) a.enfoque = ENFOQUE;   // v12 (D10)
    out.push({ id: 100000 + i, a, preset, zona: es.n, especial: es.n }); i++;
  }
  return out;
}

const LV = { P0: 0, P: 1, I: 2, A: 3 };
function analizar(res, inp, prof) {
  const P = G.effective(inp), f = {}, q = {};   // f: fallos de invariantes · q: calidad
  const days = res.det; const all = days.flatMap(d => d.rows.filter(r => r.kind === 'str').map(r => ({ d, r, L: K.BY.get(r.lib) })));
  const bump = (o, k, ej) => { if (!o[k]) o[k] = ej || true; };
  if (!res.ok) bump(f, 'ok_false', res.reason.join(','));
  // material y lugar (independiente del generador)
  for (const { d, r, L } of all) {
    const Pl = inp.places[d.place];
    if (!K.placeCan(L, Pl, d.place)) bump(f, 'material', d.letra + ':' + r.lib);
    if (d.place === 'g' && L.pl === 'c') bump(f, 'lugar', d.letra + ':' + r.lib);
  }
  days.forEach(d => d.rows.filter(r => r.kind === 'warm' || r.kind === 'cardio').forEach(r => { const L = K.BY.get(r.lib); if (!K.placeCan(L, inp.places[d.place], d.place)) bump(f, 'material', d.letra + ':' + r.lib); if (d.place === 'g' && L.pl === 'c') bump(f, 'lugar', d.letra + ':' + r.lib); }));
  // lista de riesgo
  for (const { d, r } of all) if (K.TAGS.nogen.has(r.lib)) bump(f, 'riesgo', d.letra + ':' + r.lib);
  // molestias y reglas de edad/prudencia
  for (const { d, r, L } of all.concat(days.flatMap(d => d.rows.filter(x => x.kind === 'cardio' || x.kind === 'warm').map(x => ({ d, r: x, L: K.BY.get(x.lib) }))))) {
    const lim = K.TAGS.lim[L.id] || {};
    for (const z of Object.keys(inp.zones)) { if (z === 'otra') continue; if (lim[z] === 2) bump(f, 'molestias', d.letra + ':' + L.id + ' evitar ' + z); if (['op', 'reciente'].includes(inp.zones[z]) && lim[z] >= 1) bump(f, 'molestias', d.letra + ':' + L.id + ' ' + inp.zones[z] + ' ' + z); }
    if (inp.pref.impact === false && lim.impacto === 2) bump(f, 'molestias', d.letra + ':' + L.id + ' impacto');
    if (P.mayor && (lim.impacto === 2 || L.pat === 'plyo' || L.dif === 3 || K.TAGS.spine.has(L.id))) bump(f, 'edad65', d.letra + ':' + L.id);
    if (P.prud && (L.dif === 3 || L.id === 'lib_cardio_hiit' || ((L.pat === 'plyo' || L.pat === 'full') && r.kind === 'str'))) bump(f, 'prudente', d.letra + ':' + L.id);
    if (r.kind === 'str' && (L.pat === 'plyo' || L.pat === 'full') && !(inp.power && LV[P.level] >= 2 && !P.prud && !P.mayor)) bump(f, 'explosivos', d.letra + ':' + L.id);
  }
  // dificultad
  // (medición 5, C-07: 65+ con experiencia, dificultad 2 en máquinas, Smith y mancuernas)
  for (const { d, r, L } of all) { if (L.dif > P.difCap) { if (L.dif === 2 && P.dif2) bump(q, 'dif2_excepcion', d.letra + ':' + L.id); else if (!(P.mayorExp && L.dif === 2 && ['maquina', 'smith', 'mancuernas'].includes(L.mat))) bump(f, 'dificultad', d.letra + ':' + L.id + ' dif' + L.dif); } }
  // unicidad
  // (medición 6, J-12 y J-22: la unicidad es por día; repetir en la semana es calidad, no invariante)
  { const seenW = new Set(); days.forEach(d => { const seen = new Set(); d.rows.filter(r => r.kind === 'str').forEach(r => { if (seen.has(r.lib)) bump(f, 'repetido', d.letra + ':' + r.lib); seen.add(r.lib); if (seenW.has(r.lib)) bump(q, 'repetido_semana', d.letra + ':' + r.lib); seenW.add(r.lib); }); }); }
  // ≥ 3 de fuerza por día y ≤ 8
  // (medición 4: con 15 min y calentamiento obligatorio —65+ o prudente, C-17— la regla explícita es 2 ejercicios: `meta.corto`)
  days.forEach(d => { const n = d.rows.filter(r => r.kind === 'str').length; if (n < 3) { if (res.meta.corto && n >= 2) bump(q, 'menos3_c17', d.letra + ':' + n); else bump(f, 'menos3', d.letra + ':' + n); } if (n > 8) bump(f, 'mas8', d.letra + ':' + n); });
  // tiempo (se acepta +5 %, §E.11) · medición 4: tiempo_sobre_100 = algún día por encima de lo pedido, aunque sea dentro del +5 %
  // (v15: el exprés elegido como tipo de sesión promete «15-20 min», no 15 justos)
  days.forEach(d => { if (d.minExact > (inp.sesion === 'expres' ? 20 : inp.min) * 1.05 + 1e-9) bump(f, 'tiempo', d.letra + ':' + Math.round(d.minExact) + '>' + inp.min); else if (d.minExact > inp.min + 0.5) bump(q, 'tiempo_sobre_100', d.letra + ':' + Math.round(d.minExact * 10) / 10 + '>' + inp.min); });
  // ── volumen (medición 4: cuenta fraccional por patrón y deltoides por cabezas, desde las filas; objetivos de §E.3 revisados) ──
  const OV = objetivosV(inp, P), MAT = materialV(inp, P, res), r1 = x => Math.round(x * 10) / 10;
  const VV = { v: {}, dir: {} }; K.PG.forEach(g => { VV.v[g] = 0; VV.dir[g] = 0; });
  // (medición 6, J-10: con la frecuencia de cada día, meta.fd; con un solo sitio es la misma en todos)
  const fd = d => (res.meta.fd || {})[d.letra] || res.meta.f;
  // (medición 6: máximo de series por ejercicio según papel, nivel y modo —como el generador, J-23—, para saber si un grupo aún admite una serie)
  const maxSer = r => { const L0 = K.BY.get(r.lib); if (K.TAGS.excentrico.has(r.lib)) return 2; const zA = Object.keys(inp.zones || {}).some(z => inp.zones[z] === 'ahora' && ((K.TAGS.lim[r.lib] || {})[z] || 0) >= 1);
    const b = P.inicio || (P.mayor && !P.mayorExp) ? 2 : P.mayorExp ? (r.prio === 1 ? 3 : 2) : LV[P.level] <= 1 ? 3 : P.level === 'I' ? (r.prio === 1 ? 4 : 3) : 4; return zA ? Math.min(b, 3) : b; };
  for (const { d, r, L } of all) { if (r.slot === 'PW') continue; const o = K.volV(L); for (const g in o) { VV.v[g] += r.series * o[g] * fd(d); if (o[g] === 1) VV.dir[g] += r.series * fd(d); } }
  // tirón:empuje en 1 con la espalda en lo alto de su rango o en el techo: el pecho no puede crecer sin pasarla (para «sobra sin motivo» y «no hace falta más»)
  { let pu = 0, ps = 0; all.forEach(({ d, r, L }) => { const s = r.series * fd(d); if (['pull_h', 'pull_v', 'rear'].includes(L.pat)) pu += s; if (['push_h', 'push_v', 'fly'].includes(L.pat)) ps += s; });
    const tl = Math.max(0.75, res.meta.f); VV.espTop = VV.v.espalda >= OV.top.espalda - tl - 1e-9 || VV.v.espalda >= OV.ceil.espalda - tl; VV.teLleno = ps + res.meta.f > pu + 1e-9 && VV.espTop; }
  const avisoV = g => res.meta.warn.some(w => w.c === 'vol_corto' && (w.p.g === g || (w.p.g === 'hombros' && HO.includes(g))));
  let gOk = 0, gTot = 0;
  for (const g of K.PG) {
    if (K.PIND.includes(g)) continue;
    const big = K.PBIG.includes(g), o = OV.obj[g], v = VV.v[g];
    if (!big && o < 2) continue;
    gTot++;
    const okV = big ? (v >= o - 0.75 - 1e-9 && v <= OV.top[g] + 1e-9) : v >= o - 1.5 - 1e-9;   // D-20: pequeños, solo por debajo de objetivo − 1,5
    if (okV) gOk++; else bump(q, 'vol_fuera:' + g, r1(v) + '/' + o);
    if (big && v < o - 0.75 - 1e-9 && MAT[g]) bump(q, 'grande_bajo:' + g, r1(v) + '/' + o);
    if (!big && v < o - 1.5 - 1e-9 && MAT[g]) bump(q, 'pequeno_bajo:' + g, r1(v) + '/' + o);
  }
  q._volOk = gOk; q._volTot = gTot;
  // medición 4: pares perfil × grupo grande en [objetivo − 0,75; objetivo × 1,3 (× 1,5 prioritario)] con 30 min o más y material para el grupo
  q._rgOk = 0; q._rgTot = 0; q._rgOkP = 0; if (inp.min >= 30) K.PBIG.forEach(g => { if (!MAT[g]) return; q._rgTot++; if (VV.v[g] >= OV.obj[g] - 0.75 - 1e-9 && VV.v[g] <= OV.top[g] + 1e-9) q._rgOk++; if (VV.v[g] >= OV.obj[g] - 0.75 - 1e-9 && VV.v[g] <= OV.top[g] + Math.max(0, res.meta.f - 1) + 1e-9) q._rgOkP++; });
  q._pqOk = 0; q._pqTot = 0; K.PSMALL.forEach(g => { if (!MAT[g] || OV.obj[g] < 2) return; q._pqTot++; if (VV.v[g] >= OV.obj[g] - 1.5 - 1e-9) q._pqOk++; });
  K.PBIG.forEach(g => { if (VV.v[g] < 4 - 1e-9) { const av = avisoV(g); bump(av ? q : f, av ? 'grande<4_con_aviso' : 'grande<4_sin_aviso', g + ':' + r1(VV.v[g])); } });
  // V8 (C-04, C-05): techo semanal en series fraccionales, por cabezas
  K.PG.forEach(g => { if (VV.v[g] > OV.ceil[g] + 1e-9) bump(f, 'techo', g + ':' + r1(VV.v[g]) + '>' + OV.ceil[g]); });
  // cobertura de patrones (V5)
  if (res.meta.validate.hard.some(h => h.startsWith('V5'))) bump(f, 'cobertura', res.meta.validate.hard.filter(h => h.startsWith('V5')).join(','));
  // tirón:empuje
  const hayTiron = K.C.some(L => ['pull_h', 'pull_v'].includes(L.pat) && Object.entries(res.meta.dayPlace).some(([, p]) => K.placeCan(L, inp.places[p], p) && G.safeL(L, inp)));
  q._tiron = hayTiron; if (res.meta.ratio.tiron_empuje < 1 - 1e-9) bump(f, 'tiron_empuje', res.meta.ratio.tiron_empuje);
  if (res.meta.ratio.rodilla_cadera < 0.6 || res.meta.ratio.rodilla_cadera > 1.6) bump(q, 'rodilla_cadera', res.meta.ratio.rodilla_cadera);
  // ── calidad ──
  const nStr = days.map(d => d.rows.filter(r => r.kind === 'str').length), mins = days.map(d => d.minExact);
  if (Math.max(...nStr) - Math.min(...nStr) >= 3) bump(q, 'dias_desequilibrados_n', nStr.join('/'));
  if (Math.max(...mins) - Math.min(...mins) > 15) bump(q, 'dias_desequilibrados_min', mins.map(Math.round).join('/'));
  days.forEach(d => { const c = {}; d.rows.filter(r => r.kind === 'str').forEach(r => { c[r.pat] = (c[r.pat] || 0) + 1; });
    Object.entries(c).forEach(([p, n]) => { if (n >= 3) bump(q, 'patron_x3_dia', d.letra + ':' + p); if (n === 2 && ['CCA', 'CCB', 'CCC'].includes(d.role) && !['core', 'core_iso', 'core_rot'].includes(p)) bump(q, 'patron_x2_cc', d.letra + ':' + p); }); });
  days.forEach(d => { const s = d.rows.filter(r => r.kind === 'str'); const iFirstIso = s.findIndex(r => !r.c && !['CO'].includes(r.slot)); const iLastP1 = s.map(r => r.prio === 1 && r.c).lastIndexOf(true);
    if (iFirstIso >= 0 && iLastP1 > iFirstIso) bump(q, 'aislamiento_antes_basico', d.letra + ':' + s[iFirstIso].lib); });
  days.forEach(d => d.rows.filter(r => r.kind === 'str' && r.prio === 1).forEach(r => { const L = K.BY.get(r.lib);
    if (!L.c) bump(q, 'aislamiento_principal', d.letra + ':' + r.lib);
    if (L.u && ['squat', 'lunge', 'hinge', 'hip_ext'].includes(L.pat) && d.place === 'g') bump(q, 'unilateral_principal_gym', d.letra + ':' + r.lib);
    if (r.pass === 'near' || r.oi > 0) bump(q, 'principal_con_respaldo', d.letra + ':' + r.slot + '→' + L.pat);
    if (d.place === 'g' && LV[P.level] >= 2 && (L.mat === 'kettlebell' || /goblet/.test(L.id) || L.lt !== 'w') && ['squat', 'hinge', 'push_h', 'push_v', 'pull_h'].includes(L.pat) && (inp.places.g.mats || []).includes('barra')) bump(q, 'principal_poca_carga_gym', d.letra + ':' + r.lib);
  }));
  days.forEach(d => { if (d.empty.length) bump(q, 'hueco_vacio', d.letra + ':' + d.empty.join(',')); });
  if (LV[P.level] >= 2 && !P.cauto) { const pr = all.filter(x => x.r.prio === 1); if (pr.length && pr.every(x => x.r.series <= 2)) bump(q, 'principales_2_series', pr.length); }
  days.forEach(d => { const sp = inp.min - d.minExact; if (sp >= 20) bump(q, 'sobra_20min', d.letra + ':' + Math.round(sp)); });
  // medición 4 (D-15): sobras de intermedios y avanzados sin precaución; «sin motivo» = el día deja 20 min o más y algún grupo grande de su
  // zona, con material, está por debajo de lo alto del rango (objetivo × 1,3; × 1,5 prioritario) y del techo, con menos de 8 ejercicios
  if (LV[P.level] >= 2 && !P.cauto) days.forEach(d => { const sp = inp.min - d.minExact; if (sp < 20) return; bump(q, 'sobra_20min_IA', d.letra + ':' + Math.round(sp));
    // (tolerancia: una serie, que con K < días suma f a la semana)
    const tol = Math.max(0.75, res.meta.f);
    // (medición 6, J-15: si ningún ejercicio del grupo admite otra serie —4 en I/A, 3 en principiantes y cautos—, el paso mínimo es un ejercicio de 2 series)
    const tolG = g => d.rows.some(r => r.kind === 'str' && K.mainGroupV(K.BY.get(r.lib)) === g && r.series < maxSer(r)) ? tol : Math.max(tol, 2 * fd(d));
    const MD = materialV(inp, P, res, d.place);   // el material del sitio de ese día
    // el pecho no cuenta si tirón:empuje está en 1 y la espalda ya está en lo alto de su rango o en el techo (crecer exigiría pasarla)
    const n = d.rows.filter(r => r.kind === 'str').length; const gs = ZONA_V(d.role).filter(g => K.PBIG.includes(g) && MD[g] && VV.v[g] < OV.top[g] - tolG(g) - 1e-9 && VV.v[g] < OV.ceil[g] - tol && !(g === 'pecho' && VV.teLleno) && !(g === 'hombro_post' && VV.espTop));
    if (gs.length && n < 8) bump(q, 'sobra_20min_sin_motivo', d.letra + ':' + Math.round(sp) + ' ' + gs.join(',')); });
  // medición 6 (J-15): I/A sin precaución, 60 min o más, algún día por debajo del 60 % del tiempo
  if (LV[P.level] >= 2 && !P.cauto && inp.min >= 60 && days.some(d => d.minExact < 0.6 * inp.min)) bump(q, 'dia_corto_IA', days.map(d => d.letra + Math.round(d.minExact)).join(','));
  // medición 6 (J-12): un ejercicio de suelo con «sin suelo» habiendo en su menú otro sin suelo posible (material, seguridad, dificultad), aunque se repita
  if (P.noFloor) { const cls = G.clsOf(P, inp); for (const { d, r, L } of all) { if (!K.TAGS.suelo.has(L.id) || !r.slot) continue; const Pl = inp.places[d.place];
    const mids = [r.slot].concat((MN.MENUS[r.slot] && MN.MENUS[r.slot].sec || []).filter(x => x.slot).map(x => x.slot)).flatMap(sl => MN.tiers(sl, cls).flat());
    const alt = mids.find(id => { const e = K.BY.get(id); return e && !K.TAGS.suelo.has(id) && e.c === L.c && (e.dif <= P.difCap || (P.dif2 && e.dif === 2)) && K.placeCan(e, Pl, d.place) && G.safeL(e, inp) && !d.rows.some(x => x.lib === id) && !Object.keys(inp.zones || {}).some(z => inp.zones[z] === 'ahora' && ((K.TAGS.lim[id] || {})[z] || 0) >= 1); });   // (una alternativa «con cuidado» de una zona que duele ahora no es mejor que el suelo)
    if (alt) bump(q, 'suelo_evitable', d.letra + ':' + L.id + ' (había ' + alt.replace('lib_', '') + ')'); } }
  days.forEach(d => { if (['T1', 'T2', 'T3', 'E', 'E1', 'E2', 'Ti', 'Ti1', 'Ti2'].includes(d.role) && d.rows.some(r => r.kind === 'str' && ['squat', 'lunge', 'hinge', 'knee_flex', 'knee_ext', 'calf', 'hip_ext'].includes(r.pat))) bump(q, 'pierna_en_torso', d.letra);
    if (['P1', 'P2', 'P3', 'Pi', 'Pi1', 'Pi2'].includes(d.role) && d.rows.some(r => r.kind === 'str' && ['push_h', 'push_v', 'pull_h', 'pull_v', 'curl', 'tri', 'raise', 'fly'].includes(r.pat))) bump(q, 'torso_en_pierna', d.letra); });
  if (P.inicio) for (const { d, L } of all) { const dn = K.LIB_DOWN[L.id]; if (L.mat === 'corporal' && dn) { const D = K.BY.get(dn); if (K.placeCan(D, inp.places[d.place], d.place) && D.dif <= 1 && G.safeL(D, inp)) bump(q, 'inicio_sin_escalon', d.letra + ':' + L.id + ' (hay ' + dn + ')'); } }
  if (P.inicio && all.some(x => ['lib_pushup', 'lib_pushup_wide', 'lib_bench_dip', 'lib_air_squat'].includes(x.L.id))) bump(q, 'inicio_variante_dura', all.filter(x => ['lib_pushup', 'lib_pushup_wide', 'lib_bench_dip', 'lib_air_squat'].includes(x.L.id)).map(x => x.L.id).join(','));
  days.forEach(d => { const fam = {}; d.rows.filter(r => r.kind === 'str' && r.mat === 'maquina').forEach(r => { const fm = K.TAGS.mfam[r.lib]; fam[fm] = (fam[fm] || 0) + 1; }); Object.entries(fam).forEach(([fm, n]) => { if (n >= 2) bump(q, 'maquina_repetida_dia', d.letra + ':' + fm); }); });
  if (Object.values(res.meta.dayPlace).includes('g') && LV[P.level] >= 2) { const ang = all.filter(x => x.L.pat === 'push_h').map(x => K.angle(x.L)); if (ang.length >= 2 && !ang.includes('flat')) bump(q, 'sin_press_plano', ang.join(',')); }
  days.forEach(d => { const s = d.rows.filter(r => r.kind === 'str'); if (s.length && s.every(r => r.mat === 'corporal') && d.place === 'g') bump(q, 'gym_solo_corporal', d.letra); });
  if (inp.pref.floor === false && all.some(x => K.TAGS.suelo.has(x.L.id))) bump(q, 'suelo_con_sin_suelo', all.filter(x => K.TAGS.suelo.has(x.L.id)).map(x => x.L.id).join(','));
  if (all.some(x => x.L.id === 'lib_inverted_row_table')) bump(q, 'remo_mesa', true);
  if (res.meta.split !== res.meta.table) bump(q, 'respaldo_reparto', res.meta.table + '→' + res.meta.split);
  if ((P.mayor || P.segM) && !all.some(x => x.L.u && ['lunge', 'squat'].includes(x.L.pat))) bump(f, 'mayor_sin_unilateral', true);   // medición 5: también «Prefiero no decirlo» (C-14)
  if (P.inicio) days.forEach(d => { const n = d.rows.filter(r => r.kind === 'str').length; if (n > 5) bump(q, 'inicio_mas_de_5', d.letra + ':' + n); });
  // (medición 5, C-07 y opción de M-4: 65+ con experiencia, hasta 4 días de pesas)
  if (P.mayor && inp.days > 3 && res.weeklyTarget > (P.mayorExp ? 4 : 3)) bump(f, 'mayor_mas_de_3', res.weeklyTarget);

  // ════ Medición 2: comprobaciones nuevas (claves nuevas; las de v1 no cambian) ════
  const ex = {};   // datos para los agregados nuevos
  const LVn = LV[P.level], adulto = ['18', '40'].includes(inp.age) && !P.prud && !P.mayor, IAok = LVn >= 2 && !P.cauto;
  // V9 (C-04): ≤ 10 series fraccionales por grupo y sesión (§E.3 «Tope por sesión»); medición 4: cuenta por patrón y deltoides por cabezas
  days.forEach(d => { const sv = {}; d.rows.filter(r => r.kind === 'str' && r.slot !== 'PW').forEach(r => { const o = K.volV(K.BY.get(r.lib)); for (const g in o) sv[g] = (sv[g] || 0) + r.series * o[g]; });
    Object.entries(sv).forEach(([g, v]) => { if (v > 10 + 1e-9) bump(f, 'sesion_mas_10', d.letra + ':' + g + ' ' + v); }); });
  // §E.5 65 o más: sin flexión ni rotación de columna con carga (lista ampliada; la de v1 solo mira TAGS.spine)
  if (P.mayor) for (const { d, L } of all) if (SPINE_AMPLIADA.has(L.id)) bump(f, 'edad65_columna', d.letra + ':' + L.id);
  // §E.1/E.9 inicio: 2 series en todo durante el primer ciclo
  if (P.inicio) for (const { d, r } of all) if (r.series > 2) bump(f, 'inicio_mas_2_series', d.letra + ':' + r.lib + '×' + r.series);
  // C-08: 65 o más con 3 series desde el primer día
  // (medición 5, C-07: con experiencia, 3 en el principal es la regla; la invariante nueva es `mayor_series` de seguridad.js)
  if (P.mayor) for (const { d, r } of all) if (r.series > (P.mayorExp && r.prio === 1 ? 3 : 2)) bump(q, 'mayor_3_series', d.letra + ':' + r.lib + '×' + r.series);
  // 65 o más: unilateral de pierna con mancuernas, kettlebell o barra (manos ocupadas: no puede apoyarse)
  if (P.mayor) for (const { d, L } of all) if (L.u && ['lunge', 'squat'].includes(L.pat) && ['mancuernas', 'kettlebell', 'barra'].includes(L.mat)) bump(q, 'mayor_unilateral_cargado', d.letra + ':' + L.id);
  // I-11: 65 o más con ejercicios en el suelo (sin haberlo pedido)
  if (P.mayor) for (const { d, L } of all) if (K.TAGS.suelo.has(L.id)) bump(q, 'mayor_suelo', d.letra + ':' + L.id);
  // Dolor «ahora» y ejercicio «con cuidado» de esa zona en rango pesado (≤ 6)
  for (const { d, r, L } of all) { const lim = K.TAGS.lim[L.id] || {}; const rr = G.repRange(L, r.r);
    for (const z of Object.keys(inp.zones)) if (inp.zones[z] === 'ahora' && lim[z] === 1 && rr && rr.hi <= 6) bump(q, 'dolor_ahora_pesado', d.letra + ':' + L.id + ' ' + z + ' ' + r.reps); }
  // Hueco relleno con un ejercicio que no carga su músculo objetivo (p. ej. flexiones en «elevación lateral», superman en «curl femoral»)
  for (const { d, r, L } of all) if (r.slot && musAjeno(L, r.slot)) bump(q, 'hueco_musculo_ajeno', d.letra + ':' + r.slot + '→' + L.id);
  // Respaldo evitable: hueco 1 con patrón secundario o cercano habiendo candidatos del patrón principal sin usar
  const usados = new Set(all.map(x => x.L.id));
  for (const { d, r, L } of all) {
    if (r.prio !== 1 || !(r.pass === 'near' || r.oi > 0) || !G.SLOT[r.slot]) continue;
    const p0 = G.SLOT[r.slot].pats[0], Pl = inp.places[d.place];
    // medición 3: la alternativa tiene que ser multiarticular (un hueco 1 no admite aislamientos: el pullover no cuenta como «jalón disponible»)
    // (medición 5, I-11: con «sin suelo», un ejercicio de suelo no es una alternativa: catálogo v5 con el suelo bien etiquetado)
    const ok = e => (p0 === 'push_h:inc' ? (e.pat === 'push_h' && K.angle(e) === 'inc') : e.pat === p0) && e.c && !usados.has(e.id) && e.dif <= P.difCap && K.placeCan(e, Pl, d.place) && G.safeL(e, inp) && !(inp.pref.floor === false && K.TAGS.suelo.has(e.id)) && !(P.cauto && ['lib_pullup_negative', 'lib_pullup_band'].includes(e.id)) && !(P.segM && K.TAGS.colgado.has(e.id));   // (medición 6, J-03: ya no son alternativa para cautos ni 65+)
    const alt = K.C.filter(ok); if (alt.length) bump(q, 'respaldo_evitable', d.letra + ':' + r.slot + '→' + L.id + ' (había ' + alt.slice(0, 3).map(e => e.id.replace('lib_', '')).join(',') + ')');
  }
  // Rarezas en días de gimnasio
  const gymRows = all.filter(x => x.d.place === 'g'); const rar = gymRows.filter(x => RAREZA.has(x.L.id));
  if (rar.length) bump(q, 'rareza_gym', rar.map(x => x.d.letra + ':' + x.L.id).join(','));
  ex.gymN = gymRows.length; ex.gymRar = rar.length; ex.gymMainN = gymRows.filter(x => x.r.prio === 1).length; ex.gymMainRar = rar.filter(x => x.r.prio === 1).length;
  // Volumen alto (C-03): series DIRECTAS de un grupo grande por encima de objetivo × 1,3 (× 1,5 prioritario), la definición de la medición 2,
  // ahora con la cuenta por patrón y por cabezas; vol_alto_fraccional = lo mismo con todas las series fraccionales (incluye lo indirecto)
  // vol_alto_paso: más de un «paso» por encima (con K < días una serie suma f a la semana y el mínimo es 2 por ejercicio: el generador no puede
  // afinar más que f − 1 por encima de lo alto del rango sin quitar un ejercicio entero)
  const paso = Math.max(0, res.meta.f - 1);
  for (const g of K.PBIG) { if (VV.dir[g] > OV.top[g] + paso + 1e-9) bump(q, 'vol_alto_paso', g + ':' + r1(VV.dir[g]) + '>' + r1(OV.top[g] + paso)); }
  for (const g of K.PBIG) { if (VV.dir[g] > OV.top[g] + 1e-9) bump(q, 'vol_alto', g + ':' + r1(VV.dir[g]) + '>' + r1(OV.top[g])); if (VV.v[g] > OV.top[g] + 1e-9) bump(q, 'vol_alto_fraccional', g + ':' + r1(VV.v[g]) + '>' + r1(OV.top[g])); }
  // Hombro posterior o rotación externa ≥ 2 series/semana con ≥ 6 de empuje (§E.3 protegidos), contado por cabeza (C-05)
  { let rear = 0, push = 0; all.forEach(({ d, r, L }) => { const s = r.series * fd(d); if ((L.mus.reardelts || 0) >= 0.8) rear += s; if (['push_h', 'push_v'].includes(L.pat)) push += s; });
    if (push >= 6 && rear < 2 - 1e-9) { bump(q, 'hombro_post_bajo', rear + ' con ' + push + ' de empuje'); if (inp.min > 20 && !(P.segM && inp.min <= 30)) bump(q, 'hombro_post_bajo_no_corto', rear + ' con ' + push + ' de empuje'); } }
  // Principales con 2 series (intermedio o avanzado, sin modos de precaución, sesiones de 45 min o más)
  if (IAok && inp.min >= 45) { const pr = all.filter(x => x.r.prio === 1 && x.L.c); ex.mainN = pr.length; ex.main2 = pr.filter(x => x.r.series <= 2).length;
    if (pr.length && ex.main2 / pr.length >= 0.5) bump(q, 'principales_2_series_IA', ex.main2 + '/' + pr.length); }
  // Aprovechamiento del tiempo (intermedio o avanzado sin precaución, «Ganar músculo» o «Ganar fuerza», 45 min o más)
  if (IAok && inp.min >= 45 && ['musculo', 'fuerza'].includes(inp.goal)) { ex.uso = days.map(d => Math.min(1, d.minExact / inp.min));
    if (days.some(d => d.minExact < 0.7 * inp.min)) bump(q, 'sesion_corta_IA', days.map(d => Math.round(d.minExact)).join('/') + ' de ' + inp.min); }
  // Explicaciones falsas: «separo torso y pierna» sin torso/pierna · «Amable con tu X» de una zona que no es · «no hace falta más» con grupos por debajo
  let porque = null, avisos = []; try { porque = X.porque(res, inp); avisos = X.avisos(res, inp); } catch (e) { bump(f, 'textos_error', String(e.message).slice(0, 80)); }
  // ════ Medición 5 (paso 4): seguridad, modos y textos (seguridad.js) → invariantes ════
  if (porque && SEG) { const sg = SEG(res, inp, porque.concat(avisos)); for (const [k, v] of Object.entries(sg)) bump(f, k, v); }
  if (porque) {
    // medición 5 (D-22, C-03): «buen punto de partida» con algún grupo grande (con material) por debajo de objetivo − 0,75
    { const bajo5 = K.PBIG.filter(g => MAT[g] && OV.obj[g] && VV.v[g] < OV.obj[g] - 0.75 - 1e-9); if (porque.some(s => /buen punto de partida/.test(s)) && bajo5.length) bump(q, 'explicacion_falsa', '«buen punto de partida» con ' + bajo5.join(',') + ' por debajo'); }
    if (porque.some(s => /separo torso y pierna/.test(s)) && !['tp2', 'tp4', 'tp4cc', 'tpc3', 'ulppl', 'tp6', 'pgp3', 'p3t1', 'tp5g', 'tp6g'].includes(res.meta.split)) bump(q, 'explicacion_falsa', 'consec con ' + res.meta.split);   // medición 3: repartos nuevos con torso y pierna
    // medición 4: con la cuenta nueva; y, a intermedios y avanzados, «no hace falta más» solo con los grupos grandes en lo alto del rango
    const bajo = K.PBIG.filter(g => MAT[g] && VV.v[g] < OV.obj[g] - 0.75 - 1e-9);
    if (porque.some(s => /no hace falta más/.test(s)) && bajo.length) bump(q, 'explicacion_falsa', 'te sobran con ' + bajo.join(',') + ' por debajo');
    // (el texto habla de los minutos que sobran: cuentan los grupos de la zona de los días con 8 min o más sin usar)
    const zSobra = new Set(days.filter(d => inp.min - d.minExact >= 8).flatMap(d => ZONA_V(d.role)));
    const tolT = Math.max(0.75, res.meta.f), sobraD = days.filter(d => inp.min - d.minExact >= 8), tolTG = g => sobraD.some(d => d.rows.some(r => r.kind === 'str' && K.mainGroupV(K.BY.get(r.lib)) === g && r.series < maxSer(r))) ? tolT : Math.max(tolT, 2 * res.meta.f);
    const bajoTop = K.PBIG.filter(g => zSobra.has(g) && MAT[g] && VV.v[g] < Math.min(OV.top0[g], OV.ceil[g]) - tolTG(g) - 1e-9 && VV.v[g] < OV.ceil[g] - tolT && !(g === 'pecho' && VV.teLleno) && !(g === 'hombro_post' && VV.espTop));
    if (porque.some(s => /no hace falta más/.test(s)) && LV[P.level] >= 2 && !P.cauto && bajoTop.length) bump(q, 'explicacion_falsa', 'te sobran (I/A) con ' + bajoTop.join(',') + ' por debajo de lo alto del rango');
    const alto = K.PBIG.filter(g => VV.v[g] > OV.obj[g] * 1.5 + 1e-9);
    if (porque.some(s => /buen punto de partida/.test(s)) && alto.length) bump(q, 'explicacion_volumen', alto.join(',') + ' > objetivo × 1,5');
  }
  for (const { d, r, L } of all) { const m = /(?:Amable con|Elegido por) (?:tu|la) ([a-zñ ]+?)[:.]/.exec(r.nota || ''); if (!m) continue;   // medición 5: el texto de C-23
    const z = Object.keys(ZL).find(k => ZL[k] === m[1].trim()); if (!z || !(K.TAGS.amable[z] && K.TAGS.amable[z].has(L.id))) bump(q, 'explicacion_falsa', d.letra + ':' + L.id + ' «amable con ' + m[1] + '»'); }
  ex.adulto = adulto; ex.IAgym = adulto && LVn >= 2 && !P.inicio && inp.places.main === 'g'; ex.cauto = P.cauto;

  // ════ Medición 3 (paso 2): selección y reparto ════
  const m = res.meta, novato = LVn <= 1 || P.cauto;
  // % de ejercicios «std A» (estándar de entrenador) en días de gimnasio
  ex.stdN = gymRows.length; ex.stdA = gymRows.filter(x => MN.std(x.L.id) === 'A').length; ex.stdMainN = gymRows.filter(x => x.r.prio === 1).length; ex.stdMainA = gymRows.filter(x => x.r.prio === 1 && MN.std(x.L.id) === 'A').length;
  // principal con poca carga en gimnasio con barra, solo I/A sin modo cauto (la clave de la medición 2 incluía 65+ y prudentes)
  days.forEach(d => d.rows.filter(r => r.kind === 'str' && r.prio === 1).forEach(r => { const L = K.BY.get(r.lib);
    if (d.place === 'g' && LVn >= 2 && !P.cauto && (L.mat === 'kettlebell' || /goblet/.test(L.id) || L.lt !== 'w') && ['squat', 'hinge', 'push_h', 'push_v', 'pull_h'].includes(L.pat) && (inp.places.g.mats || []).includes('barra')) bump(q, 'principal_poca_carga_gym_IA', d.letra + ':' + r.lib); }));
  // ejercicios de fuerza por sesión (05 §4.2: principiante 4-6, I/A 5-8; inicio 4-5): por encima, siempre; por debajo, solo con 45 min o más
  days.forEach(d => { const n = d.rows.filter(r => r.kind === 'str').length; const [lo, hi] = P.inicio ? [4, 5] : P.mayorExp ? [4, 7] : novato ? [4, 6] : [5, 8];   // (medición 5, C-07: 65+ con experiencia, hasta 7)
    if (n > hi || (n < lo && inp.min >= 45)) bump(q, 'ej_sesion_fuera', d.letra + ':' + n + ' (' + lo + '-' + hi + ')'); });
  // ejercicios distintos por grupo grande y semana (hombro por cabezas): principiante o cauto ≤ 2 · I/A ≤ 3
  { const cnt = {}; all.forEach(({ L }) => { let g = G.mainGroup(L); if (!K.BIG.includes(g)) return; if (g === 'hombros') { const mm = L.mus; const fr = mm.frontdelts || 0, sd = mm.sidedelts || 0, rr = mm.reardelts || 0; g += ':' + (rr >= fr && rr >= sd ? 'post' : sd > fr ? 'lat' : 'ant'); } cnt[g] = (cnt[g] || 0) + 1; });
    const lim = novato ? 2 : 3; const fuera = Object.entries(cnt).filter(([, n]) => n > lim); ex.grN = Object.keys(cnt).length; ex.grOk = Object.keys(cnt).length - fuera.length;
    if (fuera.length) bump(q, 'ej_grupo_semana', fuera.map(([g, n]) => g + ' ' + n).join(',')); }
  // «Ganar fuerza» (I/A sin modo cauto): el levantamiento objetivo va el primero de su día; y, en 'recomendado' con 3+ días y un sitio con
  // barra, rack y banco, cada levantamiento posible sale ≥ 1,5 veces por semana (C-06)
  const fzIA = inp.goal === 'fuerza' && LVn >= 2 && !P.cauto;
  if (fzIA) {
    days.forEach(d => { const lifts = (m.lifts || {})[d.letra] || []; const s = d.rows.filter(r => r.kind === 'str' && r.slot !== 'PW'); if (lifts.length && s.length && !lifts.includes(s[0].lib)) bump(q, 'fuerza_lift_no_primero', d.letra + ':' + s[0].lib); });
    const gymDias = days.filter(d => d.place === 'g').reduce((a, d) => a + fd(d), 0);
    if (OPT.reparto !== 'dias' && inp.days >= 3 && (!inp.daysOther || (inp.places.g && gymDias >= 3 - 1e-9))) {
      const pk = inp.daysOther ? 'g' : inp.places.main, Pl = inp.places[pk]; const fq = {};
      // posible = material, seguridad y sin «con cuidado» de una zona que duele ahora (con «ahora» no se busca el levantamiento pesado: D-03)
      const ahoraCuidado = id => Object.keys(inp.zones).some(z => inp.zones[z] === 'ahora' && ((K.TAGS.lim[id] || {})[z] || 0) >= 1);
      Object.values(LIFT_ID).forEach(id => { if (K.placeCan(K.BY.get(id), Pl, pk) && G.safeL(K.BY.get(id), inp) && !ahoraCuidado(id)) fq[id] = 0; });
      days.forEach(d => d.rows.forEach(r => { if (r.kind === 'str' && r.lib in fq) fq[r.lib] += fd(d); }));
      const bajos = Object.entries(fq).filter(([, v]) => v < 1.5 - 1e-9); ex.liftN = Object.keys(fq).length; ex.liftOk = ex.liftN - bajos.length;
      if (bajos.length) bump(q, 'fuerza_lift_freq', bajos.map(([id, v]) => id.replace('lib_', '') + ' ' + v).join(','));
    }
  }
  // dos sitios: día solo de pierna en casa (sin barra y rack) teniendo gimnasio (D-12)
  // (solo intermedios y avanzados sin modo cauto: a un principiante, la pierna con peso corporal le basta y lo que no hay en casa es el tirón)
  if (inp.places.g && inp.places.c && !novato) days.forEach(d => { const Pl = inp.places[d.place]; if (d.place === 'c' && LEG_ONLY.test(d.role) && !((Pl.mats || []).includes('barra') && (Pl.acc || []).includes('rack'))) bump(q, ['nada', 'parque'].includes(Pl.preset) ? 'pierna_casa_sin_material' : 'pierna_casa_con_gym', d.letra + ':' + d.role + ' ' + Pl.preset); });
  // respaldo de reparto por avisos blandos: la primera opción no tenía fallos duros ni huecos 1 vacíos y aun así se cambió (D-12)
  { const t0 = (m.tried || [])[0]; if (t0 && t0.split !== m.split && t0.hard === 0 && (t0.h1v || 0) === 0 && (OPT.reparto !== 'dias' || (t0.h1 || 0) === 0)) bump(q, 'respaldo_blando', t0.split + '→' + m.split); }
  // días seguidos y cuerpo completo (sin modo 65+ ni prudente, que tienen su aviso «mejor días alternos»): CC en días consecutivos
  if (inp.consec && !P.mayor && !P.prud && ['cc2', 'cc3'].includes(m.split)) bump(q, 'consec_cc', m.split);
  // reparto 'dias': K = días de pesas; si es menor, debe haber motivo (material, dos sitios exactos o topes con su texto)
  ex.K = m.K; ex.wd = res.weeklyTarget;
  // (medición 5, C-22: con 65+ o prudente y días seguidos, torso/pierna con K=2 es un motivo de seguridad, con su texto: `kMotivo`)
  if (OPT.reparto === 'dias' && m.K < res.weeklyTarget) { const motivo = m.split !== m.table || !!m.kMotivo; if (!motivo) bump(q, 'k_menor_sin_motivo', m.K + '<' + res.weeklyTarget); else bump(q, m.kMotivo ? 'k_seguridad' : 'k_material', m.kMotivo || (m.table + '→' + m.split)); }
  return { f, q, ex };
}

const profs = perfiles();
const t0 = Date.now();
const agg = { n: 0, f: {}, q: {}, ej: {}, ejq: {}, volOk: 0, volTot: 0, tironPerf: 0, tironOk: 0, det: 0, detN: 0, alt: 0, altN: 0, ms: [], splits: {}, dims: { goal: {}, level: {}, days: {}, min: {}, preset: {}, zona: {}, edad: {} }, okFalse: 0, tiempoSin15: 0, tiempoSin15N: 0 };
const muestras = [];
const porPerfil = [];
const agg2 = { gymN: 0, gymRar: 0, gymMainN: 0, gymMainRar: 0, mainN: 0, main2: 0, uso: {}, seg: {} };
const agg3 = { stdN: 0, stdA: 0, stdMainN: 0, stdMainA: 0, grN: 0, grOk: 0, liftN: 0, liftOk: 0, kd: {}, splitsAdulto: {} };
const agg4 = { rgOk: 0, rgTot: 0, rgOkP: 0, pqOk: 0, pqTot: 0, rgMin: {} };
const verUno = (pr, inp, res, f, q) => { console.log(`\n#${pr.id} · ${resumen(pr, inp)} · nivel ${res.meta.level} modos [${inp.modes.join(',')}] · reparto ${res.meta.split} (tabla ${res.meta.table}) · ok=${res.ok}`);
  console.log('  fallos', JSON.stringify(f), '\n  calidad', JSON.stringify(Object.keys(q).filter(k => !k.startsWith('_'))), '\n  detalle', JSON.stringify(Object.fromEntries(Object.entries(q).filter(([k]) => /rareza|rodilla_cadera|patron_x2|maquina_rep/.test(k)))), '\n  log', JSON.stringify(res.meta.log).slice(0, 600), '\n  recortes', JSON.stringify(res.meta.cut));
  for (const d of res.det) { console.log(`  ${d.nombre} [${d.role} · ${d.place}/${d.preset}] ≈ ${d.minExact.toFixed(1)} min`); d.rows.forEach(r => console.log(`     ${(r.lib || '—').padEnd(30)} ${String(r.series || '').padStart(2)} × ${String(r.reps).padEnd(7)} ${r.descanso_s != null ? r.descanso_s + 's' : ''} ${r.slot ? '[' + r.slot + r.prio + (r.pass === 'near' ? '~' : r.oi > 0 ? '*' : '') + ']' : ''} ${r.kind === 'bal' ? r.min + ' min' : ''}`)); } };
for (const pr of profs) {
  if (SOLO && !SOLO.has(pr.id)) continue;
  conSesion(pr); conPlan(pr); conRoles(pr);
  const inp = G.desdeRespuestas(pr.a);
  const a0 = Date.now(); const res = G.genRoutine(inp); agg.ms.push(Date.now() - a0); cuentaPlan(pr, res);
  if (ROLES && pr.a.roles) { planStat.pedidos++; if (res.meta.roles) { planStat.salen++; const z = (res.meta.warn.find(w => w.c === 'semana_sin') || { p: { z: [] } }).p.z.join('+') || 'completa'; planStat.por[z] = (planStat.por[z] || 0) + 1; } }
  const { f, q, ex } = analizar(res, inp, pr); ordenSesion(pr, inp, res, f); if (f._otroReparto) { q.sesion_orden_otro_reparto = f._otroReparto; delete f._otroReparto; } if (f._casi) { q.sesion_orden_casi = f._casi; delete f._casi; } if (f._mismoTiempo) { q.sesion_tarjetas_mismo_tiempo = f._mismoTiempo; delete f._mismoTiempo; }
  if (SOLO) verUno(pr, inp, res, f, q);
  agg.n++;
  // medición 2: agregados nuevos y segmentos
  agg2.gymN += ex.gymN; agg2.gymRar += ex.gymRar; agg2.gymMainN += ex.gymMainN; agg2.gymMainRar += ex.gymMainRar;
  if (ex.mainN) { agg2.mainN += ex.mainN; agg2.main2 += ex.main2; }
  agg3.stdN += ex.stdN; agg3.stdA += ex.stdA; agg3.stdMainN += ex.stdMainN; agg3.stdMainA += ex.stdMainA; agg3.grN += ex.grN || 0; agg3.grOk += ex.grOk || 0;
  if (ex.liftN) { agg3.liftN += ex.liftN; agg3.liftOk += ex.liftOk; }
  if (inp.days >= 4) { const key = inp.days + ' días · ' + (inp.places.main === 'g' ? 'gimnasio' : 'casa'); const o = agg3.kd[key] = agg3.kd[key] || { n: 0, KigualDiasPesas: 0, Kmedia: 0 }; o.n++; if (ex.K === ex.wd) o.KigualDiasPesas++; o.Kmedia += ex.K; }
  if (ex.adulto) agg3.splitsAdulto[res.meta.split] = (agg3.splitsAdulto[res.meta.split] || 0) + 1;
  if (ex.uso) { const b = agg2.uso[inp.min] = agg2.uso[inp.min] || { s: 0, n: 0 }; ex.uso.forEach(u => { b.s += u; b.n++; }); }
  const claves = new Set(Object.keys(f).concat(Object.keys(q).filter(k => !k.startsWith('_')).map(k => k.split(':')[0])));
  for (const [seg, dentro] of [['todos', true], ['adulto', ex.adulto], ['adulto_IA_gym', ex.IAgym], ['cauto', ex.cauto]]) {
    if (!dentro) continue; const s = agg2.seg[seg] = agg2.seg[seg] || { n: 0, k: {} }; s.n++; claves.forEach(k => { s.k[k] = (s.k[k] || 0) + 1; });
  }
  const P = G.effective(inp);
  ['goal', 'level', 'days', 'min', 'preset', 'zona', 'edad'].forEach(k => { const v = k === 'level' ? P.level : k === 'preset' ? pr.preset : k === 'zona' ? pr.zona : k === 'edad' ? inp.age : inp[k]; const o = agg.dims[k]; o[v] = o[v] || { n: 0, fallos: 0 }; o[v].n++; if (Object.keys(f).length) o[v].fallos++; });
  agg.splits[res.meta.split] = (agg.splits[res.meta.split] || 0) + 1;
  for (const k of Object.keys(f)) { agg.f[k] = (agg.f[k] || 0) + 1; if (!agg.ej[k]) agg.ej[k] = { perfil: pr.id, resumen: resumen(pr, inp), detalle: f[k] }; }
  const qk = new Set(Object.keys(q).filter(k => !k.startsWith('_')).map(k => k.split(':')[0]));
  for (const kk of qk) { agg.q[kk] = (agg.q[kk] || 0) + 1; const k = Object.keys(q).find(x => x.split(':')[0] === kk); if (!agg.ejq[kk]) agg.ejq[kk] = { perfil: pr.id, resumen: resumen(pr, inp), detalle: q[k] + (k.includes(':') ? ' (' + k.split(':')[1] + ')' : '') }; }
  agg.volOk += q._volOk; agg.volTot += q._volTot;
  agg4.rgOk += q._rgOk; agg4.rgTot += q._rgTot; agg4.rgOkP += q._rgOkP; agg4.pqOk += q._pqOk; agg4.pqTot += q._pqTot;
  if (q._rgTot) { const b = agg4.rgMin[inp.min] = agg4.rgMin[inp.min] || [0, 0]; b[0] += q._rgOk; b[1] += q._rgTot; }
  if (q._tiron) { agg.tironPerf++; if (res.meta.ratio.tiron_empuje >= 1 - 1e-9) agg.tironOk++; }
  if (!res.ok) agg.okFalse++;
  if (inp.min !== 15) { agg.tiempoSin15N++; if (!f.tiempo) agg.tiempoSin15++; }
  // determinismo: una de cada 3 se repite; «Otra propuesta» en una de cada 10
  if (pr.id % 3 === 0) { const r2 = G.genRoutine(G.desdeRespuestas(pr.a)); agg.detN++; if (JSON.stringify(r2.days) === JSON.stringify(res.days)) agg.det++; else if (!agg.ej.determinismo) agg.ej.determinismo = { perfil: pr.id }; }
  if (pr.id % 10 === 0) { const r3 = G.genRoutine(inp, { alt: 1, prev: new Set(Object.values(res.days).flatMap(d => d.ex.map(e => e.lib))) }); agg.altN++;
    const a1 = new Set(Object.values(res.days).flatMap(d => d.ex.map(e => e.lib)).filter(x => !/cardio/.test(x))), b1 = Object.values(r3.days).flatMap(d => d.ex.map(e => e.lib)).filter(x => !/cardio/.test(x));
    const cambia = b1.filter(x => !a1.has(x)).length / Math.max(1, b1.length); agg.alt += cambia; }
  porPerfil.push({ id: pr.id, preset: pr.preset, zona: pr.zona, goal: inp.goal, level: P.level, modes: inp.modes, days: inp.days, min: inp.min, age: inp.age, split: res.meta.split, K: res.meta.K, wd: res.weeklyTarget, ok: res.ok, f: Object.keys(f), q: Object.keys(q).filter(k => !k.startsWith('_')).map(k => k.split(':')[0]) });
  muestras.push({ pr, inp, res });
}
function resumen(pr, inp) { return `${inp.goal} · ${pr.a.exp}${pr.a.ritmo ? '/' + pr.a.ritmo : ''} · ${inp.days} días · ${inp.min} min · ${pr.preset}${inp.daysOther ? ' + 2.º sitio ' + inp.daysOther + ' días' : ''} · ${pr.zona} · edad ${inp.age}${inp.consec ? ' · seguidos' : ''}${inp.prio.length ? ' · prio ' + inp.prio.join('+') : ''}${inp.power ? ' · explosivos' : ''}`; }
// ── Medición 5: bloque de seguridad (aparte; no entra en las tasas de los 4.200) ──
const aggS = { n: 0, f: {}, ej: {}, q: {}, porCaso: {}, det: 0, detN: 0, ms: [] };
const muestrasS = [];
if (arg('seg') !== '0') for (const pr of perfilesSeguridad()) {
  if (SOLO && !SOLO.has(pr.id)) continue;
  conSesion(pr); conPlan(pr); conRoles(pr);
  const inp = G.desdeRespuestas(pr.a);
  const a0 = Date.now(); const res = G.genRoutine(inp); aggS.ms.push(Date.now() - a0); cuentaPlan(pr, res);
  const { f, q } = analizar(res, inp, pr); ordenSesion(pr, inp, res, f); if (f._otroReparto) { q.sesion_orden_otro_reparto = f._otroReparto; delete f._otroReparto; } if (f._casi) { q.sesion_orden_casi = f._casi; delete f._casi; } if (f._mismoTiempo) { q.sesion_tarjetas_mismo_tiempo = f._mismoTiempo; delete f._mismoTiempo; }
  if (SOLO) verUno(pr, inp, res, f, q);
  aggS.n++; const c = aggS.porCaso[pr.especial] = aggS.porCaso[pr.especial] || { perfiles: 0, con_fallo: 0, claves: {} }; c.perfiles++;
  if (Object.keys(f).length) c.con_fallo++;
  for (const k of Object.keys(f)) { aggS.f[k] = (aggS.f[k] || 0) + 1; c.claves[k] = (c.claves[k] || 0) + 1; if (!aggS.ej[k]) aggS.ej[k] = { perfil: pr.id, caso: pr.especial, resumen: resumen(pr, inp), detalle: f[k] }; }
  for (const kk of new Set(Object.keys(q).filter(k => !k.startsWith('_')).map(k => k.split(':')[0]))) aggS.q[kk] = (aggS.q[kk] || 0) + 1;
  if (pr.id % 3 === 0) { const r2 = G.genRoutine(G.desdeRespuestas(pr.a)); aggS.detN++; if (JSON.stringify(r2.days) === JSON.stringify(res.days)) aggS.det++; }
  muestrasS.push({ pr, inp, res });
}
const ms = agg.ms.slice().sort((a, b) => a - b);
const pct = (a, b) => b ? Math.round(1000 * a / b) / 10 + ' %' : '—';
const salida = {
  modo: TAG, perfiles: agg.n, segundos: Math.round((Date.now() - t0) / 100) / 10, ms_mediana: ms[Math.floor(ms.length / 2)], ms_p95: ms[Math.floor(ms.length * 0.95)],
  ok_false: agg.okFalse, repartos: agg.splits, ...(PLAN || ROLES ? { plan: planStat } : {}),
  invariantes: Object.fromEntries(Object.entries(agg.f).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, { n: v, tasa: pct(v, agg.n), ejemplo: agg.ej[k] }])),
  calidad: Object.fromEntries(Object.entries(agg.q).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, { n: v, tasa: pct(v, agg.n), ejemplo: agg.ejq[k] }])),
  volumen_grupos_en_objetivo: pct(agg.volOk, agg.volTot), tiron_empuje_ge1_con_material: pct(agg.tironOk, agg.tironPerf) + ` (${agg.tironOk}/${agg.tironPerf})`,
  tiempo_ok_sin_15min: pct(agg.tiempoSin15, agg.tiempoSin15N), determinismo: `${agg.det}/${agg.detN}`, otra_propuesta_cambia_media: pct(agg.alt, agg.altN),
  dims: agg.dims,
  // medición 2
  medicion: 2,
  rarezas_en_gimnasio: { ejercicios: pct(agg2.gymRar, agg2.gymN), principales: pct(agg2.gymMainRar, agg2.gymMainN) },
  principales_con_2_series_IA: pct(agg2.main2, agg2.mainN) + ` (${agg2.main2}/${agg2.mainN})`,
  aprovechamiento_tiempo_IA: Object.fromEntries(Object.entries(agg2.uso).map(([m, b]) => [m + ' min', pct(b.s, b.n)])),
  segmentos: Object.fromEntries(Object.entries(agg2.seg).map(([s, o]) => [s, Object.assign({ perfiles: o.n }, Object.fromEntries(['tiempo', 'cobertura', 'techo', 'tiron_empuje', 'vol_fuera', 'sobra_20min',
    'remo_mesa', 'sesion_mas_10', 'edad65_columna', 'inicio_mas_2_series', 'vol_alto', 'rareza_gym', 'respaldo_evitable', 'hueco_musculo_ajeno', 'principales_2_series_IA', 'sesion_corta_IA',
    'explicacion_falsa', 'dolor_ahora_pesado', 'mayor_unilateral_cargado', 'mayor_suelo', 'mayor_3_series', 'hombro_post_bajo',
    'principal_poca_carga_gym_IA', 'ej_sesion_fuera', 'ej_grupo_semana', 'fuerza_lift_no_primero', 'fuerza_lift_freq', 'pierna_casa_sin_material', 'pierna_casa_con_gym', 'respaldo_blando', 'consec_cc', 'k_material', 'k_menor_sin_motivo',
    'grande_bajo', 'pequeno_bajo', 'vol_alto_fraccional', 'vol_alto_paso', 'sobra_20min_IA', 'sobra_20min_sin_motivo', 'hombro_post_bajo_no_corto', 'tiempo_sobre_100', 'menos3_c17'].map(k => [k, pct(o.k[k] || 0, o.n)])))])),
  // medición 3
  medicion3: { reparto: OPT.reparto || 'recomendado', std_A_gimnasio: { ejercicios: pct(agg3.stdA, agg3.stdN), principales: pct(agg3.stdMainA, agg3.stdMainN) },
    grupos_en_rango_ejercicios_semana: pct(agg3.grOk, agg3.grN), fuerza_levantamientos_15_semana: pct(agg3.liftOk, agg3.liftN) + ` (${agg3.liftOk}/${agg3.liftN})`,
    K_frente_a_dias_4_6: Object.fromEntries(Object.entries(agg3.kd).sort().map(([k, o]) => [k, { perfiles: o.n, K_igual_dias_de_pesas: pct(o.KigualDiasPesas, o.n), K_media: Math.round(10 * o.Kmedia / o.n) / 10 }])),
    repartos_adultos: agg3.splitsAdulto },
  // medición 4 (paso 3): volumen con la cuenta nueva
  medicion4: { version_generador: VER ? 'v' + VER : 'actual', grandes_en_rango_30min_con_material: pct(agg4.rgOk, agg4.rgTot) + ` (${agg4.rgOk}/${agg4.rgTot})`,
    grandes_en_rango_30min_con_material_tolerancia_paso: pct(agg4.rgOkP, agg4.rgTot),
    grandes_en_rango_por_minutos: Object.fromEntries(Object.entries(agg4.rgMin).map(([m, b]) => [m + ' min', pct(b[0], b[1])])),
    pequenos_ge_objetivo_menos_1_5_con_material: pct(agg4.pqOk, agg4.pqTot) + ` (${agg4.pqOk}/${agg4.pqTot})` },
  // medición 5 (paso 4): bloque de seguridad, aparte
  medicion5: { seguridad_js: !!SEG, bloque_seguridad: { perfiles: aggS.n, determinismo: `${aggS.det}/${aggS.detN}`, ms_mediana: aggS.ms.slice().sort((a, b) => a - b)[Math.floor(aggS.ms.length / 2)] || null,
    invariantes: Object.fromEntries(Object.entries(aggS.f).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, { n: v, tasa: pct(v, aggS.n), ejemplo: aggS.ej[k] }])),
    calidad: Object.fromEntries(Object.entries(aggS.q).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, v + ' (' + pct(v, aggS.n) + ')'])),
    por_caso: aggS.porCaso } },
};
fs.writeFileSync(path.join(OUT, 'matriz-' + TAG + '.json'), JSON.stringify(salida, null, 1));
fs.writeFileSync(path.join(OUT, 'matriz-' + TAG + '-perfiles.json'), JSON.stringify(porPerfil));
console.log(JSON.stringify({ modo: salida.modo, perfiles: salida.perfiles, segundos: salida.segundos, ms_mediana: salida.ms_mediana, ok_false: salida.ok_false, repartos: salida.repartos,
  invariantes: Object.fromEntries(Object.entries(salida.invariantes).map(([k, v]) => [k, v.n + ' (' + v.tasa + ')'])), calidad: Object.fromEntries(Object.entries(salida.calidad).map(([k, v]) => [k, v.n + ' (' + v.tasa + ')'])),
  volumen: salida.volumen_grupos_en_objetivo, tiron: salida.tiron_empuje_ge1_con_material, tiempo_sin15: salida.tiempo_ok_sin_15min, det: salida.determinismo, alt: salida.otra_propuesta_cambia_media,
  rarezas_gym: salida.rarezas_en_gimnasio, principales_2_series_IA: salida.principales_con_2_series_IA, aprovechamiento_IA: salida.aprovechamiento_tiempo_IA, segmentos: salida.segmentos, medicion3: salida.medicion3, medicion4: salida.medicion4,
  medicion5: { perfiles_seguridad: aggS.n, determinismo: salida.medicion5.bloque_seguridad.determinismo, invariantes_seguridad: Object.fromEntries(Object.entries(aggS.f).map(([k, v]) => [k, v + ' (' + pct(v, aggS.n) + ')'])), calidad_seguridad: salida.medicion5.bloque_seguridad.calidad } }, null, 1));
module.exports = { muestras };
if (arg('muestras')) {
  const ids = arg('muestras').split(',').map(Number);
  const txt = []; for (const id of ids) { const m = muestras.find(x => x.pr.id === id) || muestrasS.find(x => x.pr.id === id); if (!m) continue; const { pr, inp, res } = m;
    txt.push(`\n#${id} · ${resumen(pr, inp)} · nivel ${res.meta.level} modos [${inp.modes.join(',')}] · reparto ${res.meta.split} (tabla ${res.meta.table}) · ok=${res.ok}`);
    txt.push(`  descansos ${JSON.stringify(res.meta.rest)} · vol ${Object.entries(res.meta.vol).map(([g, v]) => g + ' ' + v.v + '/' + v.obj).join(' · ')} · T:E ${res.meta.ratio.tiron_empuje} · R:C ${res.meta.ratio.rodilla_cadera}`);
    txt.push(`  validación ${JSON.stringify(res.meta.validate.hard)} ${JSON.stringify(res.meta.validate.softAll)} · recortes ${JSON.stringify(res.meta.cut)}`);
    for (const d of res.det) { txt.push(`  ${d.nombre} [${d.role} · ${d.place}/${d.preset}] ≈ ${d.minutos} min`); d.rows.forEach(r => txt.push(`     ${(r.lib || '—').padEnd(30)} ${String(r.series || '').padStart(2)} × ${String(r.reps).padEnd(7)} ${r.descanso_s != null ? r.descanso_s + 's' : ''} ${r.slot ? '[' + r.slot + r.prio + (r.pass === 'near' ? '~' : r.oi > 0 ? '*' : '') + ']' : ''} d${r.dif || ''} ${r.nota ? '· ' + r.nota.slice(0, 110) : ''}`)); }
    txt.push('  avisos: ' + JSON.stringify(res.meta.warn.map(w => w.c + (w.p && w.p.g ? ':' + w.p.g : ''))));
  }
  fs.writeFileSync(path.join(OUT, 'revision-' + TAG + '.txt'), txt.join('\n'));
}
