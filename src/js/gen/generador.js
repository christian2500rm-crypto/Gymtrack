const _generador = (function () {
// Prototipo del generador de rutinas de 20-propuesta.md §E (E.0-E.16), en node, puro y determinista.
// Uso: const G = require('./generador.js')(require('./catalogo.js')(), opciones)
//   G.desdeRespuestas(respuestas) → input de genRoutine (perfil efectivo de §E.1)
//   G.genRoutine(input, ctx) → {ok, days, weeklyTarget, meta, det}
// Donde la especificación es ambigua, la elección está marcada con «ISSUE-xx» (ver 40-simulacion.md).
// v2 (paso 2, 44-diagnostico-algoritmo.md): la elección de ejercicio sale de los MENÚS de menus.js (escalones por hueco y clase de
// persona) y la puntuación de §E.7 solo desempata dentro del escalón; músculo objetivo obligatorio por hueco; topes por sesión.
// v7 (paso 4, seguridad y modos): meta.effort por modo (C-01) · 65+ con experiencia (C-07) · bloque de equilibrio de 5-8 min (C-09) ·
// huesos frágiles (C-13) · «Prefiero no decirlo» = prudente + filtros de 65+ (C-14) · «Otra zona» sin modo prudente (C-15) · lesión
// reciente = «Me operaron» (C-16) · «sin suelo» por defecto con 65+ (I-11) · parón de más de 2 años = inicio (I-4) · «Me duele ahora»
// sin rango pesado ni levantamiento (D-03) · posparto con alta (C-12) · consulta si inactivo con enfermedad (C-10) · 65+ o prudente con
// días seguidos en torso/pierna (C-22) · cardio suave para principiantes que pierden grasa (C-28) · «evitar» de otra zona a cautos (C-29)
// v8 (paso 6, 45-juicio-entrenador.md, graves y molestias): cualquier zona que duele ahora, operada o con lesión reciente → sin saltos ni
// explosivos (J-01) · hombro que duele ahora: nada por encima de la cabeza, colgado ni con barra en la espalda, rotación externa en vez de
// elevaciones y empujes a 8-12 (J-02) · excéntricos a 3-5 y nada colgado ni negativas para cautos y 65+ (J-03) · espalda operada o reciente
// sin compresión (J-04) · rodilla que duele ahora sin sentadilla con barra ni zancadas largas (J-05) · muñeca: flexiones sobre los puños (J-06)
// · huesos frágiles: equilibrio, extensores, remos con apoyo y menús estables (J-07)
// v9 (paso 6, selección y prescripción): frecuencia por entreno y «Ganar fuerza» con dos sitios (J-10) · prioridad de brazos con trabajo
// directo (J-08) · mancuernas de 20 kg o menos con suelo de repeticiones (J-09) · 16-17 con experiencia sin modo clínico (J-11, opción
// menor) · descansos por la carga de cada serie (J-13) · cardio que llena el día en aguante y grasa (J-14) · relleno hasta el rango
// objetivo de 05 con 60 min o más y core y gemelos fuera del día de pierna en E/Ti/P (J-15) · rangos estándar (J-20) · 4 series como
// mucho (J-23) · nota de dominadas (J-21)
// v10 (paso 6, textos): el «En lugar de…» con su motivo real (J-19) y los días ligeros marcados para el texto de repeticiones (J-17)

const GEN_VERSION = 11;   // (v11 y v12 no la subieron: la semilla de los perfiles de siempre no cambiaba; v12 = D10, enfoque «más glúteo»). 11 = E14a: catálogo con §K.3 y equilibrio con ejercicios
const CARGA_MANOS = ['mancuernas', 'kettlebell', 'barra', 'barraz', 'disco'];   // v7 (D-02): sin mano libre para apoyarse
const LV = { P0: 0, P: 1, I: 2, A: 3 };

// ── E.3 volumen ──
// v5 (paso 3, D-16, C-05): objetivos por grupo de PLANIFICACIÓN (K.PG: deltoides por cabezas) con la cuenta fraccional por patrón (K.volV,
// 05 §1.1). Base P · I · A = «inicio por defecto» de 05 §1.2 por músculo; isquios y glúteos suben a 7 · 10 · 12 (con la cuenta por patrón,
// la bisagra y el hip thrust cuentan 1 y la sentadilla 0,5: con 6 · 8 · 10 una pierna normal se pasaba de rango); el hombro lateral y el
// posterior heredan la base del hombro (7 · 9 · 11); el anterior no tiene objetivo (solo indirecto, 05 §5.3), pero sí techo y tope.
const BASE = { pecho: [8, 11, 13], espalda: [9, 12, 14], hombro_lat: [5, 7, 8], hombro_post: [7, 9, 11], biceps: [4, 6, 8], triceps: [4, 6, 8], abdomen: [3, 5, 6], cuads: [8, 11, 13], isquios: [7, 10, 12], gluteos: [8, 12, 14], gemelos: [2, 4, 6] };
const MULT = { musculo: 1, fuerza: 0.75, grasa: 0.9, salud: 0.65, aguante: 0.85 };
const CEIL = { P0: 12, P: 12, I: 18, A: 20 };
const HO = ['hombro_ant', 'hombro_lat', 'hombro_post'];
const ENF_UP = ['pecho', 'espalda', 'hombro_lat', 'hombro_post', 'biceps', 'triceps'];   // v12 (D10): el torso, en lo justo con «más glúteo»
// ── E.9 repeticiones: [principal, secundario multiarticular, aislamiento, pequeños] ──
const REPS = {
  musculo: { P: [12, 12, 12, 15], I: [10, 12, 12, 15], A: [8, 10, 12, 15] },
  fuerza: { P: [8, 10, 10, 15], I: [6, 8, 10, 15], A: [5, 6, 10, 15] },
  grasa: { P: [12, 12, 12, 15], I: [10, 12, 12, 15], A: [10, 12, 12, 15] },
  salud: { P: [12, 12, 12, 15], I: [12, 12, 12, 15], A: [12, 12, 12, 15] },
  aguante: { P: [15, 15, 20, 20], I: [15, 15, 20, 20], A: [15, 15, 20, 20] },
};
const REPS_CAUTO = [12, 12, 12, 15];
const REST = { fuerza: [90, 150, 180], musculo: [75, 120, 150], grasa: [60, 105, 120], salud: [60, 90, 120], aguante: [45, 75, 90] };
const PEQ_PATS = ['raise', 'rear', 'calf', 'core', 'core_iso', 'core_rot', 'hip_abd', 'hip_add', 'carry'];

// ── E.6 huecos ──
const SLOT = {
  SQ: { pats: ['squat', 'lunge'], tipo: 'multi', mus: { quads: 1, glutes: 0.5 }, grupo: 'cuads', leg: 1, fam: 'rodilla' },
  LU: { pats: ['lunge', 'squat'], tipo: 'multi', mus: { quads: 1, glutes: 0.8 }, grupo: 'cuads', leg: 1, fam: 'rodilla' },
  HI: { pats: ['hinge', 'hip_ext'], tipo: 'multi', mus: { hams: 1, glutes: 0.9 }, grupo: 'isquios', leg: 1, fam: 'cadera' },
  HE: { pats: ['hip_ext', 'hinge'], tipo: 'any', mus: { glutes: 1, hams: 0.5 }, grupo: 'gluteos', leg: 1, fam: 'cadera' },
  KF: { pats: ['knee_flex', 'hinge'], tipo: 'iso', mus: { hams: 1 }, grupo: 'isquios', leg: 1, fam: 'cadera' },
  KE: { pats: ['knee_ext', 'squat'], tipo: 'iso', mus: { quads: 1 }, grupo: 'cuads', leg: 1, fam: 'rodilla' },
  CA: { pats: ['calf'], tipo: 'iso', mus: { calves: 1 }, grupo: 'gemelos', leg: 1 },
  PH: { pats: ['push_h'], tipo: 'multi', mus: { pecs: 1, triceps: 0.5, frontdelts: 0.5 }, grupo: 'pecho', fam: 'empuje' },
  PI: { pats: ['push_h:inc', 'push_v'], tipo: 'multi', mus: { upperpecs: 1, pecs: 0.6 }, grupo: 'pecho', fam: 'empuje' },
  PV: { pats: ['push_v', 'push_h'], tipo: 'multi', mus: { frontdelts: 1, sidedelts: 0.6 }, grupo: 'hombro_ant', fam: 'empuje' },
  FL: { pats: ['fly', 'push_h'], tipo: 'iso', mus: { pecs: 1 }, grupo: 'pecho' },
  TV: { pats: ['pull_v', 'pull_h'], tipo: 'multi', mus: { lats: 1, biceps: 0.5 }, grupo: 'espalda', fam: 'tiron' },
  TH: { pats: ['pull_h', 'pull_v'], tipo: 'multi', mus: { midback: 1, lats: 0.8 }, grupo: 'espalda', fam: 'tiron' },
  RA: { pats: ['raise', 'push_v'], tipo: 'iso', mus: { sidedelts: 1 }, grupo: 'hombro_lat' },
  RE: { pats: ['rear', 'pull_h'], tipo: 'iso', mus: { reardelts: 1 }, grupo: 'hombro_post', prot: 1 },
  CU: { pats: ['curl', 'pull_v:sup'], tipo: 'iso', mus: { biceps: 1 }, grupo: 'biceps' },
  TR: { pats: ['tri', 'push_h:dip'], tipo: 'iso', mus: { triceps: 1 }, grupo: 'triceps' },
  CO: { pats: ['core_iso', 'core_rot', 'core', 'carry'], tipo: 'none', mus: { abs: 1, obliques: 0.6 }, grupo: 'abdomen', prot: 1 },
  PW: { pats: ['plyo', 'full'], tipo: 'multi', mus: { quads: 1, glutes: 1 }, grupo: 'cuads' },   // ISSUE: la propuesta no dice dónde van los explosivos
  AB: { pats: ['hip_abd'], tipo: 'iso', mus: { abductors: 1, glutes: 0.5 }, grupo: 'gluteos', leg: 1 },   // v2: abductores (prioridad glúteos)
  // v8 (J-02): rotación externa en el sitio de las elevaciones laterales cuando el hombro duele ahora · (J-07) extensores de la espalda con huesos frágiles
  RX: { pats: ['rear'], tipo: 'iso', mus: { reardelts: 1 }, grupo: 'hombro_post' },
  EX: { pats: ['hinge', 'rear', 'core_iso'], tipo: 'any', mus: { lowback: 1, midback: 0.5 }, grupo: 'espalda' },
};
// v2 (D-04): músculo objetivo de cada hueco; el ejercicio debe cargar alguno con peso ≥ 0,8 (core ≥ 0,6). Mismo criterio que matriz.js.
const HUECO_MUS = { SQ: ['quads'], LU: ['quads', 'glutes'], HI: ['hams', 'glutes'], HE: ['glutes'], KF: ['hams'], KE: ['quads'], CA: ['calves'], PH: ['pecs', 'upperpecs', 'lowerpecs'],
  PI: ['upperpecs', 'pecs', 'frontdelts'], PV: ['frontdelts', 'sidedelts'], FL: ['pecs', 'upperpecs', 'lowerpecs'], TV: ['lats', 'midback'], TH: ['midback', 'lats'], RA: ['sidedelts'],
  RE: ['reardelts'], CU: ['biceps'], TR: ['triceps'], CO: ['abs', 'obliques'], PW: ['quads', 'glutes'], AB: ['abductors'], RX: ['reardelts'], EX: ['lowback', 'midback', 'reardelts'] };
const musOk = (L, sid) => { const ms = HUECO_MUS[sid]; if (!ms) return true; const thr = sid === 'CO' ? 0.6 : 0.8; return ms.some(m => (L.mus[m] || 0) >= thr); };
// patrón añadido en la plantilla («SQ1 (o LU)», «PI1 (o PV)»…) → menú del hueco de ese patrón
const PAT_SLOT = { squat: 'SQ', lunge: 'LU', hinge: 'HI', hip_ext: 'HE', knee_flex: 'KF', knee_ext: 'KE', calf: 'CA', push_h: 'PH', push_v: 'PV', fly: 'FL', pull_v: 'TV', pull_h: 'TH', raise: 'RA', rear: 'RE', curl: 'CU', tri: 'TR', hip_abd: 'AB' };
const CORE_PATS = ['core', 'core_iso', 'core_rot', 'carry'];
const TPL = {
  CCA: [['SQ', 1], ['PH', 1], ['TV', 1], ['HE', 2], ['CO', 2], ['RA', 3], ['CU', 3], ['TR', 3]],
  CCB: [['HI', 1], ['PI', 1, ['push_v']], ['TH', 1], ['LU', 2], ['RE', 2], ['CO', 2], ['TR', 3], ['KF', 3]],
  CCC: [['SQ', 1, ['lunge']], ['PH', 1], ['TH', 1, ['pull_v']], ['KF', 2, ['hip_ext']], ['PV', 2, ['raise']], ['CO', 2], ['CU', 3], ['CA', 3]],
  T1: [['PH', 1], ['TH', 1], ['PV', 2], ['TV', 2], ['RA', 2], ['RE', 2], ['TR', 3], ['CU', 3]],
  P1: [['SQ', 1], ['HI', 1], ['LU', 2], ['KF', 2], ['CO', 2], ['CA', 3], ['HE', 3]],
  T2: [['TV', 1], ['PI', 1], ['TH', 2], ['FL', 2, ['push_v']], ['RA', 2], ['RE', 3], ['CU', 3], ['TR', 3]],
  P2: [['HE', 1], ['SQ', 2], ['LU', 2], ['KF', 2], ['CO', 2], ['CA', 3], ['KE', 3]],
  E: [['PH', 1], ['PV', 2], ['PI', 2], ['RA', 2], ['TR', 2], ['FL', 3], ['TR', 3], ['CO', 3]],
  // v9 (J-15): el core y los gemelos, del día de pierna (el único que se llena) al de tirón (el más corto)
  Ti: [['TV', 1], ['TH', 1], ['TH', 2], ['RE', 2], ['CU', 2], ['CO', 2], ['CA', 2], ['CU', 3]],
  Pi: [['SQ', 1], ['HI', 1], ['LU', 2], ['KF', 2], ['KE', 3], ['CA', 3]],
  // v3 (D-09, opción reparto 'dias'): gemelas distintas para Empuje/Tirón/Pierna ×2 (E1 banca + militar, E2 inclinado + mancuernas;
  // Ti1 vertical primero, Ti2 remo primero; Pi1 sentadilla, Pi2 bisagra e hip thrust) y la tercera pareja de Torso/Pierna ×3
  E1: [['PH', 1], ['PV', 2], ['PI', 2], ['RA', 2], ['TR', 2], ['FL', 3], ['TR', 3], ['CO', 3]],
  E2: [['PI', 1], ['PV', 2], ['FL', 2], ['RA', 2], ['TR', 2], ['PH', 3], ['TR', 3], ['CO', 3]],
  Ti1: [['TV', 1], ['TH', 1], ['TH', 2], ['RE', 2], ['CU', 2], ['CO', 2], ['CA', 2], ['CU', 3]],
  Ti2: [['TH', 1], ['TV', 1], ['TV', 2], ['RE', 2], ['CU', 2], ['CO', 2], ['CA', 2], ['CU', 3]],
  Pi1: [['SQ', 1], ['HI', 1], ['LU', 2], ['KF', 2], ['KE', 3], ['CA', 3]],
  Pi2: [['HI', 1], ['HE', 1], ['SQ', 2], ['KF', 2], ['LU', 3], ['CA', 3]],
  T3: [['PH', 1], ['TV', 1], ['PV', 2], ['TH', 2], ['RA', 2], ['RE', 3], ['CU', 3], ['TR', 3]],
  P3: [['SQ', 1], ['HE', 1], ['LU', 2], ['KF', 2], ['CA', 2], ['CO', 2], ['KE', 3]],
  // v9 (J-10): «Ganar fuerza» con dos sitios: los días de casa son de accesorios (los básicos, en el gimnasio): torso y, si hay 2, pierna
  TC: [['TH', 1], ['PI', 1, ['push_v']], ['TV', 2], ['RE', 2], ['PV', 2], ['RA', 3], ['CU', 3], ['TR', 3]],
  PC: [['LU', 1], ['HE', 1], ['KF', 2], ['HI', 2], ['CA', 2], ['CO', 2]],
  // v14 (P1, repaso del reparto): tipos de día para los repartos que elige la persona. PU = el único día de pierna de la semana (completo);
  // PT, EB y HB = «por músculos» con 4 días (pecho y tríceps, espalda y bíceps, hombros y brazos); PE, ES, HO y BR = con 5 (uno por músculo)
  PU: [['SQ', 1], ['HI', 1], ['LU', 2], ['KF', 2], ['HE', 2], ['CO', 2], ['CA', 2], ['KE', 3]],
  PT: [['PH', 1], ['PI', 1], ['FL', 2], ['TR', 2], ['TR', 2], ['CO', 2], ['FL', 3]],
  EB: [['TV', 1], ['TH', 1], ['TH', 2], ['RE', 2], ['CU', 2], ['CU', 2], ['CA', 3]],
  HB: [['PV', 1], ['RA', 2], ['RE', 2], ['CU', 2], ['TR', 2], ['CO', 2], ['RA', 3]],
  PE: [['PH', 1], ['PI', 1], ['FL', 2], ['FL', 2], ['CO', 2], ['CA', 3]],
  ES: [['TV', 1], ['TH', 1], ['TH', 2], ['TV', 2], ['RE', 2], ['CO', 3]],
  HO: [['PV', 1], ['RA', 2], ['RE', 2], ['RA', 2], ['CO', 2], ['CA', 2]],
  BR: [['CU', 2], ['TR', 2], ['CU', 2], ['TR', 2], ['CO', 2], ['CU', 3], ['TR', 3]],
};
// «Ganar fuerza» (§E.2): A sentadilla + banca · B peso muerto + militar · C variante de sentadilla + inclinado · P2 peso muerto · T2 press militar
const TPL_FUERZA = {
  CCB: [['HI', 1], ['PV', 1], ['TH', 1], ['LU', 2], ['RE', 2], ['CO', 2], ['TR', 3], ['KF', 3]],
  CCC: [['SQ', 1, ['lunge']], ['PI', 1], ['TH', 1, ['pull_v']], ['KF', 2, ['hip_ext']], ['PV', 2, ['raise']], ['CO', 2], ['CU', 3], ['CA', 3]],
  T2: [['PV', 1], ['TV', 1], ['TH', 2], ['PI', 2], ['RA', 2], ['RE', 3], ['CU', 3], ['TR', 3]],   // ISSUE: T2 no tiene hueco PV1
  P2: [['HI', 1], ['SQ', 2], ['LU', 2], ['KF', 2], ['CO', 2], ['CA', 3], ['KE', 3]],
  E2: [['PV', 1], ['PI', 2], ['FL', 2], ['RA', 2], ['TR', 2], ['PH', 3], ['TR', 3], ['CO', 3]],
  Pi2: [['HI', 1], ['SQ', 2], ['HE', 2], ['KF', 2], ['LU', 3], ['CA', 3]],
};
// v3 (C-06): «Ganar fuerza» I/A con 2 entrenos que se alternan: cada básico en su día, las dos veces (torso: banca + militar; pierna: sentadilla + peso muerto)
const TPL_FUERZA_K2 = {
  T1: [['PH', 1], ['PV', 1], ['TH', 1], ['TV', 2], ['RE', 2], ['RA', 3], ['TR', 3], ['CU', 3]],
  P1: [['SQ', 1], ['HI', 1], ['LU', 2], ['KF', 2], ['CO', 2], ['CA', 3], ['HE', 3]],
  E: [['PH', 1], ['PV', 1], ['PI', 2], ['RA', 2], ['TR', 2], ['FL', 3], ['TR', 3], ['CO', 3]],
};
const LIFT_ID = { SQ: 'lib_back_squat', PH: 'lib_bench_press', HI: 'lib_deadlift', PV: 'lib_ohp_bb' };
// «Levantamiento objetivo» por plantilla (§E.2: A sentadilla + banca, B peso muerto + militar, C variantes; P1 sentadilla, P2 peso muerto; T1 banca, T2 militar)
const LIFT = { CCA: ['SQ', 'PH'], CCB: ['HI', 'PV'], CCC: [], T1: ['PH'], T2: ['PV'], P1: ['SQ'], P2: ['HI'], E: ['PH'], Ti: [], Pi: ['SQ', 'HI'],
  E1: ['PH'], E2: ['PV'], Ti1: [], Ti2: [], Pi1: ['SQ'], Pi2: ['HI'], T3: [], P3: [], TC: [], PC: [],
  PU: ['SQ', 'HI'], PT: ['PH'], EB: [], HB: ['PV'], PE: ['PH'], ES: [], HO: ['PV'], BR: [] };   // v14 (P1): PU lleva sentadilla y peso muerto, como Pi
const LIFT_K2 = { T1: ['PH', 'PV'], P1: ['SQ', 'HI'], E: ['PH', 'PV'], Pi: ['SQ', 'HI'], CCA: ['SQ', 'PH'], CCB: ['HI', 'PV'] };
const SPLITS = {
  cc2: ['CCA', 'CCB'], cc3: ['CCA', 'CCB', 'CCC'], tp2: ['T1', 'P1'], tp4: ['T1', 'P1', 'T2', 'P2'], ppl3: ['E', 'Ti', 'Pi'],
  tp4cc: ['T1', 'P1', 'T2', 'P2', 'CCA'], ppl6: ['E1', 'Ti1', 'Pi1', 'E2', 'Ti2', 'Pi2'],
  // v3: reparto 'dias' (D-09; 05 §2.2): torso/pierna/cuerpo completo (3 días seguidos), «ULPPL» (5), torso/pierna ×3 (6, principiantes sin C-21)
  tpc3: ['T1', 'P1', 'CCB'], ulppl: ['T1', 'P1', 'E', 'Ti', 'P2'], tp6: ['T1', 'P1', 'T2', 'P2', 'T3', 'P3'],
  // v13 (D10, E16e): «más glúteo y pierna» con un entreno por día: más días de pierna que de torso
  // v14 (P1): repartos que la persona puede elegir en «Cambiar reparto» (además de cc3, tpc3, ppl3, tp4, ulppl, ppl6 y tp6): con un solo día
  // de pierna (tpt3, pplt4, pplet5, pplg6), con un día entero de pierna y un repaso (pplc4), con más torso (tptpt5) y «por músculos» (grp4, grp5)
  tpt3: ['T1', 'PU', 'T2'], pplt4: ['E', 'Ti', 'PU', 'T2'], pplc4: ['E', 'Ti', 'Pi', 'CCB'], grp4: ['PT', 'EB', 'PU', 'HB'],
  pplet5: ['E1', 'Ti1', 'PU', 'E2', 'Ti2'], grp5: ['PE', 'ES', 'PU', 'HO', 'BR'], tptpt5: ['T1', 'P1', 'T2', 'P2', 'T3'], pplg6: ['E1', 'Ti1', 'PU', 'E2', 'Ti2', 'HB'],
  pgp3: ['P1', 'T1', 'P2'], p3t1: ['P1', 'T1', 'P2', 'P3'], tp5g: ['P1', 'T1', 'P2', 'T2', 'P3'], tp6g: ['P1', 'T1', 'P2', 'T2', 'P3', 'Pi2'],
};
const CHAIN = ['ppl3', 'tp4', 'tp2', 'cc3', 'cc2'];
const TWINS = [['CCA', 'CCB'], ['T1', 'T2'], ['P1', 'P2'], ['E1', 'E2'], ['Ti1', 'Ti2'], ['Pi1', 'Pi2']];
const LIGHT = ['T2', 'P2', 'CCB', 'E2', 'Ti2', 'Pi2', 'T3', 'P3'];
const ZT = ['pecho', 'espalda', 'hombros', 'biceps', 'triceps', 'abdomen'], ZP = ['cuads', 'isquios', 'gluteos', 'gemelos', 'abdomen'], ZE = ['pecho', 'hombros', 'triceps', 'abdomen'], ZTi = ['espalda', 'biceps', 'hombros', 'abdomen', 'gemelos'];   // v9 (J-15): core y gemelos en el día de tirón
const ZPT = ['pecho', 'triceps', 'abdomen'], ZEB = ['espalda', 'biceps', 'hombro_post', 'abdomen', 'gemelos'], ZHB = ['hombros', 'biceps', 'triceps', 'abdomen'];   // v14 (P1)
const ZONA_TPL = { PU: ZP, PT: ZPT, EB: ZEB, HB: ZHB, PE: ['pecho', 'abdomen', 'gemelos'], ES: ['espalda', 'hombro_post', 'abdomen'], HO: ['hombros', 'abdomen', 'gemelos'], BR: ['biceps', 'triceps', 'abdomen'], CCA: null, CCB: null, CCC: null, T1: ZT, T2: ZT, T3: ZT, P1: ZP, P2: ZP, P3: ZP, E: ZE, E1: ZE, E2: ZE, Ti: ZTi, Ti1: ZTi, Ti2: ZTi, Pi: ZP, Pi1: ZP, Pi2: ZP, TC: ZT, PC: ZP };
const DIA_ELEGIDO = ['PU', 'PT', 'EB', 'HB', 'PE', 'ES', 'HO', 'BR'];   // v14 (P1): los tipos de día que solo salen en un reparto elegido
const LEG_TPL = ['PU', 'CCA', 'CCB', 'CCC', 'P1', 'P2', 'P3', 'Pi', 'Pi1', 'Pi2', 'PC'];
const RESERVA = { pecho: ['PI', 'PH', 'FL'], espalda: ['TH', 'TV'], cuads: ['KE', 'SQ', 'LU'], gluteos: ['HE', 'AB'], isquios: ['KF'], hombro_lat: ['RA'], hombro_post: ['RE'], biceps: ['CU'], triceps: ['TR'], gemelos: ['CA'], abdomen: ['CO'] };
const ROLE_BASE = r => r.replace(/#\d+$/, '');
// nombre de cada tipo de día (lo que ve la persona)
const NOMBRE_DIA = { CCA: 'Cuerpo completo', CCB: 'Cuerpo completo', CCC: 'Cuerpo completo', T1: 'Torso', T2: 'Torso', T3: 'Torso', P1: 'Pierna', P2: 'Pierna', P3: 'Pierna', E: 'Empuje', E1: 'Empuje', E2: 'Empuje', Ti: 'Tirón', Ti1: 'Tirón', Ti2: 'Tirón', Pi: 'Pierna', Pi1: 'Pierna', Pi2: 'Pierna', TC: 'Torso', PC: 'Pierna',
  PU: 'Pierna', PT: 'Pecho y tríceps', EB: 'Espalda y bíceps', HB: 'Hombros y brazos', PE: 'Pecho', ES: 'Espalda', HO: 'Hombros', BR: 'Brazos' };   // v14 (P1)
// v8 (J-12, J-22): repetir en la semana el mejor ejercicio cuesta 1,25 escalones (gana a una variante 2 escalones peor, al suelo con «sin
// suelo» y a lo «con cuidado» de una zona que duele; pierde ante otra igual de buena: variación moderada, Kassiano 2022)
const REP_PEN = 1.25;
const PLANCHA_FRONTAL = new Set(['lib_plank', 'lib_ball_plank', 'lib_trx_plank', 'lib_plank_shoulder_tap', 'lib_ab_wheel_knees', 'lib_ab_wheel_standing', 'lib_mountain_climber', 'lib_bear_crawl', 'lib_hollow_hold']);

// Solo con pesos «ajustados»: simula enlazar en el catálogo variantes que hoy no están en ninguna cadena de progresión (ISSUE-catálogo)
const EXTRA_DOWN = { lib_pushup_wide: 'lib_pushup_knee', lib_sumo_squat_bw: 'lib_chair_squat', lib_forward_lunge_bw: 'lib_reverse_lunge_bw', lib_walking_lunge_bw: 'lib_reverse_lunge_bw' };
// Solo con pesos «ajustados»: etiqueta propuesta «inicio» = variante de entrada de cada patrón en casa (las que eligió a mano la persona Lucía, §N.1)
const INICIO = new Set(['lib_chair_squat', 'lib_pushup_incline', 'lib_pushup_knee', 'lib_glute_bridge', 'lib_reverse_lunge_bw', 'lib_dead_bug', 'lib_good_morning_bw', 'lib_inverted_row_table', 'lib_bird_dog', 'lib_plank']);
function fnv1a(str) { let h = 0x811c9dc5; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; }
function canon(o) { if (Array.isArray(o)) return '[' + o.map(canon).join(',') + ']'; if (o && typeof o === 'object') return '{' + Object.keys(o).sort().map(k => JSON.stringify(k) + ':' + canon(o[k])).join(',') + '}'; return JSON.stringify(o); }
const r15 = x => Math.round(x / 15) * 15;

return function (K, OPT) {
  // tipo: 'hueco' (elegido) | 'literal' · pases: 'filtro' (elegido) | 'literal' · pesos: 'propuesta' (los de §E.7) | 'ajustados' (correcciones que propone 40-simulacion.md)
  // v3: reparto 'recomendado' (2-4 entrenos que rotan, lo que pide la ciencia) | 'dias' (tantos entrenos distintos como días de pesas; decisión
  // abierta del usuario, B-1) · topePrincipiante: principiantes con 5-6 días → 4 días de pesas (C-21, en las dos variantes)
  // v7: mayor4 = 65+ con experiencia que pide 4 o más días → 4 de pesas en torso/pierna (C-07; opción para la decisión M-4)
  // v9 (J-11, decisión de especificación): menor = 'tecnica' (16-17 con experiencia: menús de principiante o intermedio, sin rango de 6 o
  // menos, «Justo» dejando 2, 3 días y explosivos de bajo volumen si los pide; sin experiencia, prudente como antes) | 'prudente' (v7: todo
  // 16-17 en modo prudente clínico). repetir: un ejercicio puede repetirse en la semana (J-12, J-22; false = unicidad semanal de v7)
  OPT = Object.assign({ tipo: 'hueco', pases: 'filtro', pesos: 'propuesta', reparto: 'recomendado', topePrincipiante: true, mayor4: true, menor: 'tecnica', repetir: true }, OPT || {});
  const AJ = OPT.pesos === 'ajustados';
  const { BY, TAGS, LIB_DOWN, PAT_NEAR, GROUPS, GMUS, BIG, SMALL, placeCan, angle } = K;
  // v5 (paso 3): grupos de planificación y cuenta fraccional por patrón (catalogo.js: PG, volV, fracV, mainGroupV)
  const { PG, PBIG, PSMALL, PIND, fracV, mainGroupV } = K;
  const mgV = L => mainGroupV(L);
  const CAT_SIG = K.C.length + ':' + fnv1a(K.C.map(e => e.id).join(',')).toString(36);
  const MN = _menus(K);
  if (MN.faltan.length) throw new Error('menus.js: ids que no existen: ' + MN.faltan.join(', '));
  // v2: clase de persona para los menús (menus.js). M = 65+ · C = inicio o prudente · P = principiante · F = fuerza I/A · IA
  // v7 (C-14): «Prefiero no decirlo» usa los menús de 65+ (unilateral sin carga, sin hip thrust con barra, core sin flexión ni giro)
  // v8 (J-07): huesos frágiles, menús estables (goblet o prensa antes que sentadilla con barra; press de hombros sentado; remos con apoyo)
  function clsOf(P, inp) { if (P.mayor || P.segM) return 'M'; if (P.inicio || P.prud || P.huesos) return 'C'; if (LV[P.lvS] <= LV.P) return 'P'; return inp.goal === 'fuerza' ? 'F' : 'IA'; }
  // v2 (D-08): tope de ejercicios de fuerza por sesión (05 §4.2: principiante 4-6, intermedio/avanzado 5-8; §E.1: inicio 4-5)
  // y por minutos, como el mínimo de §E.10 paso 8 (15-20 min → 3-4, 30 → 4-5): en 20-30 min no caben 6 ejercicios
  // v7 (C-07): 65+ con experiencia, hasta 7 (05 §7.1: 6-8 ejercicios con prioridad a máquinas; nivel I para estructura y volumen)
  // v9 (J-08): con prioridad de brazos, uno más (el curl o el tríceps que pidió; en inicio, 6 en vez de 5), salvo con 20 min o menos
  // v15 (T1, tipo de sesión): la persona ya no dice minutos, elige un tipo de sesión, y el tipo fija la receta. SESION = su presupuesto
  // interno de minutos (calentamiento, equilibrio y fuerza; el que usan los escalones de siempre: series de arranque, calentamiento,
  // relleno): «Lo esencial» es la rutina de 30 min (5 ejercicios de 2 series); «Completa», la de 60 con 7 ejercicios como mucho en
  // intermedios y avanzados; «A fondo», la de 90 (hasta 8); «Exprés», el exprés de 15 min (o el modo corto de 20 con 65 o más o rutina
  // prudente, C-17). Los topes de quien empieza, de 65 o más y del modo prudente no cambian con el tipo.
  // sesionDe: el tipo que corresponde a unos minutos guardados de antes (T7: 15-20 exprés · 30 lo esencial · 45-60 completa · 75-90 a fondo)
  const SESION = { expres: 15, esencial: 30, completa: 60, fondo: 90 };
  const sesionDe = min => { const m = +min || 60; return m <= 20 ? 'expres' : m <= 30 ? 'esencial' : m <= 60 ? 'completa' : 'fondo'; };
  // v15 (T3): el cardio al terminar que sale marcado según el objetivo (minutos: 0, 10 o 20). Músculo y fuerza, no; perder grasa, 20 (10
  // si ya hace un deporte de piernas o de agua); salud, 10 si no hace otro deporte; aguantar más, 10 (0 si ya pasea). En el exprés, no.
  // Quien tenía «siempre» o «nunca» en «Afinar mi rutina» (cardioEnd) lo conserva: 10 como mínimo, o nada.
  const cardioDef = a => { if (a.cardioEnd === 'no' || a.sesion === 'expres') return 0;
    const d = a.goal === 'grasa' ? (['piernas', 'agua'].includes(a.sport) ? 10 : 20) : a.goal === 'salud' ? ((a.sport === 'no' || !a.sport) ? 10 : 0) : a.goal === 'aguante' ? (a.sport === 'suave' ? 0 : 10) : 0;
    return d || (a.cardioEnd === 'si' ? 10 : 0); };
  const capOf = (P, min, ses) => Math.min((P.inicio ? 5 : P.mayorExp ? 7 : (LV[P.lvS] <= LV.P || P.cauto) ? 6 : ses === 'completa' ? 7 : 8) + (P.prioG.has('biceps') && (min == null || min > 20) ? 1 : 0), min == null ? 8 : min <= 15 ? 3 : min <= 20 ? 4 : min <= 30 ? 5 + (P.prioG.has('biceps') ? 1 : 0) : 8);
  const novato = P => LV[P.lvS] <= LV.P || P.cauto;   // el déficit se cubre antes con series que con ejercicios nuevos
  // grupo para contar «ejercicios distintos por grupo y semana» (hombro por cabezas, C-05)
  function subGroup(L) { const g = mainGroup(L); if (g !== 'hombros') return g; const m = L.mus; const f = m.frontdelts || 0, s = m.sidedelts || 0, r = m.reardelts || 0; return 'hombros:' + (r >= f && r >= s ? 'post' : s > f ? 'lat' : 'ant'); }
  // menú de un hueco para una clase: escalones propios, los del patrón secundario y los de los patrones añadidos en la plantilla; luego el respaldo
  const menuC = new Map();
  function menuOf(h, cls) {
    const key = h.id + '|' + (h.add || []).join(',') + '|' + cls; if (menuC.has(key)) return menuC.get(key);
    const out = [], seen = new Set(); let tier = 0;
    const push = (tiers, kind, sec) => { for (const tr of tiers) { let any = false; for (const id of tr) { if (seen.has(id)) continue; seen.add(id); out.push({ id, tier, kind, sec, pos: out.length }); any = true; } if (any) tier++; } };
    const m = MN.MENUS[h.id] || { sec: [], resp: [] };
    // escalones de un hueco para la clase y, como último recurso del mismo patrón, los de las clases más prudentes (p. ej. flexiones
    // inclinadas para un intermedio con la muñeca tocada); nunca al revés (a un cauto no le llegan las variantes de intermedio) ni a 65+
    const slotT = sl => { const mm = MN.MENUS[sl] || {}; let out2 = MN.tiers(sl, cls).slice(); for (const c2 of ({ F: ['IA', 'P', 'C'], IA: ['P', 'C'], P: ['C'], C: [], M: [] })[cls]) if (mm[c2]) out2 = out2.concat(mm[c2]); return out2; };
    push(slotT(h.id), 'own', 0);
    for (const s of m.sec) push(s.slot ? slotT(s.slot) : s.tiers, 'own', 1);
    for (const p of (h.add || [])) { const sl = PAT_SLOT[p]; if (sl) push(slotT(sl), 'own', 1); }
    for (const s of m.resp) push(s.slot ? slotT(s.slot) : s.tiers, 'resp', 1);
    menuC.set(key, out); return out;
  }

  // ── vectores de músculos (_libVec de la app: pectoral repartido) y coseno ──
  const vecC = new Map();
  function vec(mus, key) {
    if (key && vecC.has(key)) return vecC.get(key);
    const v = {}; for (const k in mus) if (mus[k] > 0) v[k] = Math.max(v[k] || 0, mus[k]);
    const P = ['pecs', 'upperpecs', 'lowerpecs'], pm = Math.max(0, ...P.map(m => v[m] || 0));
    if (pm > 0) P.forEach(m => { v[m] = Math.max(v[m] || 0, pm * 0.6); });
    if (key) vecC.set(key, v); return v;
  }
  function cos(a, b) { let d = 0, x = 0, y = 0; for (const k in a) { x += a[k] * a[k]; if (b[k]) d += a[k] * b[k]; } for (const k in b) y += b[k] * b[k]; return x && y ? d / Math.sqrt(x * y) : 0; }
  // peso de un ejercicio en un grupo (el mayor de sus músculos) y su conteo fraccional (§E.3)
  const gw = (L, g) => Math.max(0, ...GMUS[g].map(m => L.mus[m] || 0));
  const frac = (L, g) => { const w = gw(L, g); return w >= 0.8 ? 1 : w >= 0.3 ? 0.5 : 0; };
  const mainG = new Map();
  function mainGroup(L) {
    if (mainG.has(L.id)) return mainG.get(L.id);
    let best = null, bw = 0; for (const g of GROUPS) { const w = gw(L, g); if (w > bw + 1e-9) { bw = w; best = g; } }
    mainG.set(L.id, best); return best;
  }
  const isLegUni = L => L.u && ['squat', 'lunge', 'hinge', 'hip_ext', 'knee_flex', 'knee_ext', 'calf'].includes(L.pat);
  function heavyOk(L) {   // §E.9 «Rango pesado solo en…»
    if (L.lt !== 'w' || L.u || /goblet/.test(L.id) || L.mat === 'kettlebell') return false;
    if (!['squat', 'hinge', 'push_h', 'push_v'].includes(L.pat)) return false;
    return ['barra', 'barraz', 'smith', 'maquina'].includes(L.mat) || (L.mat === 'mancuernas' && ['push_h', 'push_v'].includes(L.pat));
  }
  const famOf = L => ['squat', 'lunge'].includes(L.pat) ? 'rodilla' : ['hinge', 'hip_ext'].includes(L.pat) ? 'cadera' : ['push_h', 'push_v'].includes(L.pat) ? 'empuje' :
    ['pull_h', 'pull_v'].includes(L.pat) ? 'tiron' : ['core', 'core_iso', 'core_rot', 'carry'].includes(L.pat) ? 'core' : null;

  // ════════ E.1 Perfil efectivo (desde las respuestas del cuestionario) ════════
  function desdeRespuestas(a) {
    let level = 'P', modes = [];
    const e = a.exp;
    if (e === 'cero') { level = 'P0'; modes.push('inicio'); }
    else if (e === 'lt6m') level = 'P';
    else if (e === '6m2a') level = 'I';
    else if (e === 'gt2a') level = a.ritmo === 'meses' ? 'A' : 'I';
    else if (e === 'paron') {
      const an = (a.paron || {}).antes, fu = (a.paron || {}).fuera;
      // v7 (I-4): «Llevo sin entrenar… Más de 2 años» → como la primera vez: P0 + inicio, sin «vuelta» (sin «¿Subimos a tu nivel?»; 05 §6.6)
      if (fu === 'gt2a') { level = 'P0'; modes.push('inicio'); }
      else if (an === 'lt6m') { level = 'P0'; modes.push('inicio'); }
      else if (an === '6m2a' && fu === '2a6m') { level = 'P'; modes.push('vuelta'); }
      else if (an === '6m2a') { level = 'P0'; modes.push('inicio', 'vuelta'); }
      else if (an === 'gt2a' && fu === '2a6m') { level = 'I'; modes.push('vuelta'); }
      else { level = 'P'; modes.push('vuelta'); }
    }
    if (a.levelManual) { level = a.levelManual; }
    // v7 (I-3): nivel efectivo al regenerar (respuesta + tiempo + sesiones registradas): P0 → P con 12 o más sesiones en 6 o más semanas
    // (y el modo inicio, solo en la primera rutina); P → I con 6 meses y 48 o más sesiones (umbrales de 43, para el revisor de ciencia)
    const ef = a.efectiva || null; let subeNivel = null;
    if (ef && !a.levelManual) {
      if (level === 'P0' && ef.sesiones >= 12 && ef.semanas >= 6) { level = 'P'; modes = modes.filter(m => m !== 'inicio'); subeNivel = { de: 'P0', a: 'P', sesiones: ef.sesiones, semanas: ef.semanas }; }
      if (level === 'P' && ef.sesiones >= 48 && ef.semanas >= 26) { subeNivel = { de: (subeNivel || {}).de || 'P', a: 'I', sesiones: ef.sesiones, semanas: ef.semanas }; level = 'I'; }
    }
    if (a.age === '65' || a.age === '75') modes.push('mayor');
    if (a.age === '75') modes.push('mayor75');
    // v7 (C-14): «Prefiero no decirlo» = prudente + los filtros de seguridad de 65+ (sin su tope de nivel)
    if (a.age === 'nd') modes.push('segmayor');
    // zonas: 'ahora' | 'antigua' | 'op' | v7 (C-16) 'reciente' = golpe, caída o tirón de las últimas 6 semanas, o zona hinchada (se trata como 'op')
    const zones = Object.assign({}, a.zones || {});
    const scr = [].concat(a.screen || []);
    const salud = scr.some(s => ['enf', 'med'].includes(s));
    // v7 (C-15): «Otra zona» ya no activa el modo prudente (solo nota, regla de dolor y, con «ahora» u operación, sin impacto)
    // v7 (C-12): posparto con el alta de la revisión = prudente + sin impacto + sin flexión de columna con carga + nota de suelo pélvico
    // v9 (J-11): 16-17 con experiencia (nivel I o A) no van al modo prudente clínico (Lloyd 2014: la fuerza es segura y útil en adolescentes
    // con supervisión y técnica primero); sin experiencia, sí. Con OPT.menor = 'prudente', todos (v7)
    const menorExp = a.age === '16' && LV[level] >= LV.I && OPT.menor !== 'prudente';
    if (menorExp) modes.push('menor');
    const prudent = scr.some(s => ['enf', 'med', 'visto', 'superv'].includes(s)) || (a.age === '16' && !menorExp) || a.age === 'nd' || a.posparto === 'alta';
    if (prudent) modes.push('prudente');
    if (a.huesos) modes.push('huesos');                // v7 (C-13): «Huesos frágiles (osteoporosis o una fractura por un golpe leve)»
    if (a.posparto === 'alta') modes.push('posparto');
    // v7: preferencias con su defecto visible y desmarcable: «Mejor sin tumbarme en el suelo» marcado con 65 o más (I-11); «sin saltos ni
    // impacto» marcado con huesos frágiles, posparto y «Otra zona» que duele ahora o con operación o lesión reciente (C-13, C-12, C-15)
    const pref = Object.assign({}, a.pref || {});
    if (pref.floor === undefined) pref.floor = !(a.age === '65' || a.age === '75');
    // v8 (J-01): con CUALQUIER zona que duele ahora, operada o con lesión reciente (no solo «Otra zona»): el aterrizaje de un salto carga la
    // columna, la rodilla y la cadera, y el texto promete «no cargo esa zona»
    if (pref.impact === undefined) pref.impact = !(a.huesos || a.posparto === 'alta' || Object.values(zones).some(v => ['ahora', 'op', 'reciente'].includes(v)));
    // v7 (C-10): «no activo» deducido de P3 y P10, sin pregunta nueva (empieza de cero o vuelve de un parón y no hace otro deporte)
    const inactivo = (e === 'cero' || e === 'paron') && (!a.sport || a.sport === 'no');
    // v15 (T1): con tipo de sesión, los minutos son el presupuesto interno del tipo; sin él (rutinas de antes), los que diga la respuesta
    const sesion = SESION[a.sesion] ? a.sesion : null;
    const minS = !sesion ? a.min : sesion === 'expres' && (modes.includes('mayor') || prudent) ? 20 : SESION[sesion];
    return {
      // v12 (D10): con «más glúteo», el glúteo ocupa uno de los dos huecos de prioridad (P11 lo enseña marcado): queda uno para elegir
      goal: a.goal, level, modes, days: a.days, min: minS, sesion, abs: !sesion || a.abs !== false, cardio: !sesion ? null : [0, 10, 20].includes(a.cardio) ? a.cardio : cardioDef(a), consec: !!a.consec, age: a.age, sport: a.sport || 'no', prio: a.enfoque === 'gluteo' ? (a.prio || []).filter(p => p !== 'gluteos').slice(0, 1) : (a.prio || []).slice(0, 2),
      pref, style: a.style || 'igual', warm: a.warm || 'normal', cardioEnd: a.cardioEnd || 'auto', power: !!a.power,
      avoid: a.avoid || [], places: a.places, daysOther: a.daysOther || 0, zones, prudent, keep: null, pins: null, enfoque: a.enfoque === 'gluteo' ? 'gluteo' : null,
      plan: typeof a.plan === 'string' && SPLITS[a.plan] ? a.plan : null, masTorso: a.enfoque === 'torso', roles: Array.isArray(a.roles) && a.roles.length >= 3 && a.roles.length <= 6 && a.roles.every(t => typeof t === 'string') ? a.roles.slice() : null, salud, screen: scr, inactivo, paron: e === 'paron' ? Object.assign({}, a.paron) : null, subeNivel,
    };
  }

  // ════════ genRoutine (E.16) ════════
  // v14 (P8): mover los días de orden. ctx.orden = para cada posición nueva, el índice del día en el orden del generador ([1, 0, 2, 3] = el
  // segundo pasa a ser el Día A). Es solo un cambio de letras: la rutina es la misma (misma semilla, mismos ejercicios y series); se remapea
  // todo lo que nombra un día en la salida (days, det, los mapas de meta, time_spare.dias, no_cabe.dia, cut, removed y las validaciones).
  // Un orden que no es una permutación de sus días (p. ej. porque cambió el número de días) se ignora
  function reordenar(res, orden) {
    const L = 'ABCDEF', K = res.det.length;
    if (!Array.isArray(orden) || orden.length !== K || orden.slice().sort().join() !== [...Array(K).keys()].join() || orden.every((x, i) => x === i)) return res;
    const pos = {}; orden.forEach((src, i) => { pos[src] = i; });   // índice de antes → índice nuevo
    const lt = l => L[pos[L.indexOf(l)]], mapa = o => o ? Object.fromEntries(orden.map((src, i) => [L[i], o[L[src]]])) : o;
    const days = {}; orden.forEach((src, i) => { days[L[i]] = Object.assign({}, res.days[L[src]], { label: 'Día ' + L[i] }); });
    const det = orden.map((src, i) => Object.assign({}, res.det[src], { letra: L[i], nombre: 'Día ' + L[i] + ' · ' + days[L[i]].focus }));
    const m = res.meta, fix = w => { if (!w || !w.p) return w; const p = Object.assign({}, w.p);
      if (w.c === 'time_spare' && Array.isArray(p.dias)) p.dias = p.dias.map(lt).sort();
      if (w.c === 'no_cabe' && typeof p.dia === 'number' && pos[p.dia] != null) p.dia = pos[p.dia];
      return Object.assign({}, w, { p }); };
    const val = s => String(s).split(':').map(tk => /^[A-F]$/.test(tk) && lt(tk) ? lt(tk) : tk).join(':');
    const meta = Object.assign({}, m, { tpl: mapa(m.tpl), dayPlace: mapa(m.dayPlace), fd: mapa(m.fd), est: mapa(m.est), lifts: mapa(m.lifts), why: (m.why || []).map(fix), warn: (m.warn || []).map(fix),
      cut: (m.cut || []).map(c => { const a = String(c).split(':'); return a.length === 2 && pos[+a[1]] != null ? a[0] + ':' + pos[+a[1]] : c; }),
      removed: (m.removed || []).map(r => Object.assign({}, r, { t: pos[r.t] != null ? pos[r.t] : r.t })),
      validate: m.validate ? Object.assign({}, m.validate, { hard: (m.validate.hard || []).map(val), softAll: (m.validate.softAll || []).map(val) }) : m.validate, orden: orden.slice(),
      sesion: m.sesion ? Object.assign({}, m.sesion, { ej: orden.map(src => m.sesion.ej[src]) }) : m.sesion });
    return Object.assign({}, res, { days, det, meta, reason: res.reason ? res.reason.map(val) : res.reason });
  }
  function genRoutine(inp, ctx) { const r = genRoutineBase(inp, ctx); return ctx && ctx.orden ? reordenar(r, ctx.orden) : r; }
  function genRoutineBase(inp, ctx) {
    ctx = Object.assign({ hist: {}, fav: new Set(), alt: 0, prev: null }, ctx || {});
    const P = effective(inp);
    const seed0 = ctx.seed != null ? ctx.seed : fnv1a(canon(seedSrc(inp)));
    const seed = ctx.alt ? fnv1a(seed0 + ':' + ctx.alt) : seed0;
    const st0 = { inp, P, ctx, seed, J: ctx.alt ? 0.9 : 0, cls: clsOf(P, inp) };
    const tgt = volumeTargets(inp, P);
    let best = null; const tried = [];
    const opts = splitOptions(inp, P);
    for (const opt of opts) {
      // v3 (D-12): con dos sitios se construyen todas las asignaciones y se queda la de mejor calidad (no la primera que valida)
      let bo = null;
      for (const asg of placeAssignments(opt, inp, P)) {
        const r = build(opt, asg, st0, tgt);
        r.v = validate(r); r.q = calidad(r);
        tried.push({ split: opt.id, asg: asg.join(''), hard: r.v.hard.length, soft: r.v.soft.length, dura: r.v.hard.slice(0, 3), blanda: r.v.soft, h1: r.q.h1, h1v: r.q.h1v, q: Math.round(r.q.score * 10) / 10 });
        // a calidad parecida (< 1,5) se queda la primera, que es la de §E.2: la gemela «ligera» en el segundo sitio
        if (!bo || r.v.hard.length < bo.v.hard.length || (r.v.hard.length === bo.v.hard.length && r.q.score < bo.q.score - 1.5)) bo = r;
      }
      // v3 (D-12): el reparto de la tabla solo se cambia por una validación dura; con 'dias', también si el material no da para K entrenos
      // distintos (huecos 1 vacíos, con respaldo de otro patrón o con una rareza): entonces K baja y se explica (k_material)
      // (en 'recomendado', un hueco 1 que se queda vacío también es «el material no da»: §E.2, «no llena un día entero de tirón»)
      // v14 (P6): un reparto a medida («x:…») solo vale si tirón y empuje quedan equilibrados (la regla que cuida el hombro); si no, la cadena sigue
      const teOk = opt.id.indexOf('x:') !== 0 || pushPull(bo).ps === 0 || pushPull(bo).ratio >= 1 - 1e-9;
      if (bo.v.hard.length === 0 && bo.q.h1v === 0 && teOk && (OPT.reparto !== 'dias' || bo.q.h1 === 0)) return finish(bo, tried);
      if (!best || better(bo, best)) best = bo;
    }
    return finish(best, tried);
  }
  function better(a, b) { if (a.v.hard.length !== b.v.hard.length) return a.v.hard.length < b.v.hard.length; if (a.q.h1v !== b.q.h1v) return a.q.h1v < b.q.h1v; if (a.q.h1 !== b.q.h1) return a.q.h1 < b.q.h1; return a.v.soft.length < b.v.soft.length; }
  // v3: calidad de una rutina construida (menor es mejor): huecos 1 vacíos (10), con respaldo de otro patrón (5) o con una rareza (3),
  // más el escalón de cada elección (los huecos 2 pesan 0,3). h1 = huecos 1 «malos» (vacíos, respaldo o rareza), para 'dias'.
  function calidad(st) {
    let h1 = 0, h1v = 0, score = 0;
    // D-12: con casa sin barra y rack teniendo gimnasio, los días solo de pierna van al gimnasio (la pierna necesita carga; el torso se
    // apaña mejor con mancuernas y bandas); y perder un levantamiento objetivo de «Ganar fuerza» pesa como un hueco vacío a medias
    const casaLimitada = Pl => !(Pl.mats || []).includes('barra') || !(Pl.acc || []).includes('rack');
    st.T.forEach(t => { if (t.place === 'c' && st.inp.places.g && casaLimitada(t.P) && /^(P[0-9]|Pi)/.test(t.rb)) score += 6;
      (t.lift || []).forEach(id => { const h = t.slots.find(k => k.id === id && k.prio === 1); if (!h || !h.x || LIFT_ID[id] !== h.x.lib) score += 5; }); });   // v9: también si el hueco del levantamiento ya no está (J-09 lo cambia por una zancada en casa)
    st.T.forEach(t => t.slots.forEach(h => {
      if (h.id === 'PW' || h.id === 'CO') return;
      if (h.prio === 1) {
        if (h.empty && !h.sust) { h1++; h1v++; score += 10; return; }
        if (!h.x) return;
        if (h.x.pass === 'near') { h1++; score += 5; }
        if (MN.std(h.x.lib) === 'C') { h1++; score += 3; }
        if (h.x.rep && OPT.reparto === 'dias' && st.T.length >= 4 && (st.opt.id === st.opt.rec || st.opt.id !== st.opt.table)) { h1++; score += 3; }   // v8: en 'dias' con 4-6 entrenos (gemelas), repetir en un hueco 1 = no hay K entrenos distintos
        score += h.x.eff || 0;
      } else if (h.prio === 2) { if (h.empty && !h.sust) score += 2; else if (h.x && h.on) score += 0.3 * (h.x.eff || 0) + (MN.std(h.x.lib) === 'C' ? 1 : 0); }
    }));
    return { h1, h1v, score };
  }
  function seedSrc(inp) {
    const pl = {}; for (const k of ['g', 'c']) { const p = inp.places && inp.places[k]; if (p) pl[k] = { mats: [...p.mats].sort(), acc: [...(p.acc || [])].sort(), mach: p.mach === 'all' ? 'all' : [...(p.mach || [])].sort(), card: p.card === 'all' ? 'all' : [...(p.card || [])].sort(), dbMax: p.dbMax, kb: p.kb }; }
    return { goal: inp.goal, level: inp.level, modes: [...inp.modes].sort(), days: inp.days, min: inp.min, consec: inp.consec, age: inp.age, sport: inp.sport, prio: [...inp.prio].sort(), pref: inp.pref,
      style: inp.style, warm: inp.warm, cardioEnd: inp.cardioEnd, power: inp.power, avoid: [...inp.avoid].sort(), main: inp.places.main, pl, daysOther: inp.daysOther, zones: inp.zones, prudent: !!inp.prudent, v: GEN_VERSION, cat: CAT_SIG , ...(inp.enfoque ? { enfoque: inp.enfoque } : {}), ...(inp.plan ? { plan: inp.plan } : {}), ...(inp.masTorso ? { masTorso: 1 } : {}), ...(inp.roles ? { roles: inp.roles } : {}), ...(inp.sesion ? { sesion: inp.sesion } : {}) };
  }

  function effective(inp) {
    const M = new Set(inp.modes);
    const mayor = M.has('mayor') || M.has('mayor75'), m75 = M.has('mayor75');
    // v7 (C-14): segM = filtros de seguridad de 65+ (columna, impacto, unilateral con apoyo, equilibrio): 65+ y «Prefiero no decirlo»
    const segM = mayor || M.has('segmayor');
    const huesos = M.has('huesos'), posparto = M.has('posparto');
    const prud = M.has('prudente') || !!inp.prudent;   // v7 (C-15): «Otra zona» ya no
    const inicio = M.has('inicio');
    const level = inp.level;
    // v7 (C-07): 65+ con experiencia declarada (P3 de 6 meses o más: nivel I o A) → nivel I para estructura y volumen; sin ella, como mucho P
    const mayorExp = mayor && LV[level] >= LV.I;
    const lvS = mayor ? (mayorExp ? 'I' : LV[level] > LV.P ? 'P' : level) : level;
    const cauto = inicio || prud || mayor;
    const menor = M.has('menor') && !prud;   // v9 (J-11): 16-17 con experiencia
    let wd = (mayor || prud || menor) ? Math.min(inp.days, 3) : inp.days;  // días de pesas (16-17: 2-3 días, Lloyd 2014)
    if (mayorExp && OPT.mayor4 !== false && inp.days >= 4) wd = 4;   // v7 (C-07, opción de M-4): 4 días con torso/pierna si los pide (05 §11)
    // v3 (C-21, D-10): principiantes con 5-6 días → 4 días de pesas y el resto, caminar o cardio suave (05 §2.2), en las dos variantes de reparto
    const capP = OPT.topePrincipiante !== false && !mayor && !prud && LV[level] <= LV.P && inp.days >= 5;
    if (capP) wd = 4;
    const difCap = cauto ? 1 : menor ? Math.min(2, { P0: 1, P: 1, I: 2, A: 3 }[level]) : { P0: 1, P: 1, I: 2, A: 3 }[level];
    const dif2 = (level === 'P0' || level === 'P') && !prud && !mayor;   // ISSUE-dif: la excepción de dif 2 vale para P0 (inicio) pero no para prudente ni 65+
    // v8 (J-01): sin explosivos con cualquier zona que duele ahora, operada o reciente
    const zonaActiva = Object.keys(inp.zones || {}).some(z => ['ahora', 'op', 'reciente'].includes((inp.zones || {})[z]));
    const powerOk = !!inp.power && LV[level] >= LV.I && !prud && !segM && !huesos && !zonaActiva;
    const prioG = new Set(); (inp.prio || []).forEach(p => { if (p === 'brazos') { prioG.add('biceps'); prioG.add('triceps'); } else if (p === 'piernas') { prioG.add('cuads'); prioG.add('isquios'); } else prioG.add(p); });
    const enfoque = inp.enfoque === 'gluteo'; if (enfoque) prioG.add('gluteos');   // v12 (D10): el glúteo, siempre prioritario
    // v5: las mismas prioridades en grupos de planificación (el hombro, en sus cabezas lateral y posterior)
    const prioV = new Set(); prioG.forEach(g => { if (g === 'hombros') { prioV.add('hombro_lat'); prioV.add('hombro_post'); } else prioV.add(g); });
    const zones = inp.zones || {};
    // v5 (C-17): con 65 o más o rutina prudente, 15-20 min = modo corto con calentamiento (5 min) y 2 (15 min) o 3 (20 min) ejercicios
    const corto = (mayor || prud) && inp.min <= 20;
    // v7: zonas fuera de la rutina = «Me operaron» y, desde C-16, la lesión reciente (golpe, caída o tirón de < 6 semanas, o hinchazón)
    const opZones = Object.keys(zones).filter(z => z !== 'otra' && (zones[z] === 'op' || zones[z] === 'reciente'));
    // v7 (D-03): zonas que duelen ahora (sin rango pesado ni levantamiento objetivo en sus ejercicios «con cuidado»)
    const ahoraZ = Object.keys(zones).filter(z => z !== 'otra' && zones[z] === 'ahora');
    // v15 (T3): «Abdominales: No». A 65 o más, «Prefiero no decirlo», huesos frágiles y rutina prudente no se les quita el core (ni se les
    // ofrece: su interruptor no sale); tampoco a quien tiene el abdomen de prioridad
    const absFijo = segM || huesos || prud || prioV.has('abdomen'), sinAbs = !!inp.sesion && inp.abs === false && !absFijo;
    return { M, mayor, m75, prud, inicio, vuelta: M.has('vuelta'), level, lvS, lvV: lvS, cauto, wd, capP, difCap, dif2, powerOk, prioG, prioV, zones, corto, enfoque, absFijo, sinAbs,
      segM, huesos, posparto, mayorExp, ahoraZ, zonaActiva, menor,
      // v8: molestias concretas (J-02, J-04, J-05, J-06)
      hombroAhora: zones.hombro === 'ahora', rodillaAhora: zones.rodilla === 'ahora', munecaAhora: zones.muneca === 'ahora', lumbarFuera: ['op', 'reciente'].includes(zones.lumbar), lumbarZ: !!zones.lumbar,
      noImpact: (inp.pref && inp.pref.impact === false) || huesos || posparto, noFloor: inp.pref && inp.pref.floor === false, opZones };
  }
  // v7 (D-03): ¿este ejercicio es «con cuidado» (lim 1) de una zona que duele ahora?
  const ahoraCuidado = (P, id) => P.ahoraZ.some(z => ((TAGS.lim[id] || {})[z] || 0) >= 1);

  // ════════ E.3 objetivos de volumen ════════
  // v5: por grupo de planificación (PG). t = objetivo («inicio por defecto» × objetivo); top = lo alto del rango bueno (objetivo × 1,3;
  // × 1,5 prioritario, C-03), hasta donde se rellena el tiempo sobrante en intermedios y avanzados y por encima de lo cual frena el freno;
  // ceil = techo semanal en fraccionales (V8, C-04, C-05). El hombro anterior no tiene objetivo (t = 0): solo techo y tope por sesión.
  function volumeTargets(inp, P) {
    const i = LV[P.lvV] <= 1 ? 0 : LV[P.lvV] - 1, t = {}, ceil = {}, top = {}, topR = {};
    for (const g of PG) {
      const c = CEIL[P.lvV];
      ceil[g] = P.prioV.has(g) ? (P.lvV === 'A' ? 24 : c * 1.2) : c;
      if (!BASE[g]) { t[g] = 0; top[g] = 0; topR[g] = 0; continue; }
      let v = BASE[g][P.mayor && !P.mayorExp ? 0 : i];   // v7 (C-07): 65+ con experiencia, base de intermedio (× mín(objetivo, 0,65))
      v *= P.mayor ? Math.min(MULT[inp.goal], 0.65) : MULT[inp.goal];
      if (P.lvV === 'P0') v *= 0.75;
      if (P.prioV.has(g)) v *= 1.25;
      // v12 (D10): más glúteo (× 1,15 sobre la prioridad: × 1,44), algo más de cuádriceps e isquios y el torso y los brazos en lo justo
      if (P.enfoque) v *= g === 'gluteos' ? 1.15 : (g === 'cuads' || g === 'isquios') ? 1.1 : ENF_UP.includes(g) && !P.prioV.has(g) ? 0.75 : 1;   // (una prioridad elegida, p. ej. brazos, no baja)
      if (inp.sport === 'piernas' && ['cuads', 'isquios', 'gluteos', 'gemelos'].includes(g)) v *= 0.8;
      if (PBIG.includes(g)) v = Math.max(4, v);
      t[g] = Math.round(v * 100) / 100;
      top[g] = Math.max(t[g] * (P.prioV.has(g) ? 1.5 : 1.3), t[g] + 2);   // v5: con objetivos bajos (≤ 6), el 30 % no llegaba ni a un ejercicio de 2 series
      // v9 (J-15): hasta dónde rellena el tiempo sobrante un intermedio o avanzado con 60 min o más: la parte alta del «rango objetivo» de
      // 05 §1.2 (I 10-16 e inicio 10-12 → × 1,4; A 12-20 e inicio 12-14 → × 1,5; prioritarios, +0,15), sin pasar del techo
      topR[g] = Math.min(ceil[g], Math.max(top[g], t[g] * ((P.lvV === 'A' ? 1.5 : 1.4) + (P.prioV.has(g) ? 0.15 : 0))));
      // v12 (D10): con «más glúteo», el torso y los brazos se quedan en su objetivo (× 0,75) con poco margen: el freno baja lo que pase y el
      // tiempo que sobre va al glúteo (abductores en los días de torso), no a subir el torso hasta lo alto del rango
      if (P.enfoque && ENF_UP.includes(g) && !P.prioV.has(g)) { top[g] = Math.max(t[g] * 1.15, t[g] + 1); topR[g] = top[g]; }
    }
    return { t, ceil, top, topR };
  }

  // ════════ E.2 reparto ════════
  // v3 (D-09, D-10, D-11; B-1 sin decidir): dos variantes. 'recomendado' = tabla de §E.2 revisada (2-4 entrenos que rotan);
  // 'dias' = K = días de pesas (2 → CC A/B · 3 → CC A/B/C, o T/P/CC con días seguidos · 4 → T/P ×2 · 5 → ULPPL, o T/P ×2 + CC en
  // principiantes · 6 → E/Ti/P ×2 con gemelas distintas, o T/P ×3 en principiantes). Los topes de días de pesas (65+, prudente, C-21)
  // valen en las dos. Cadena de respaldo: solo por validaciones duras (y, con 'dias', por falta de material para K distintos).
  function tableSplit(inp, P) {
    const d = inp.days, wd = P.wd, beginner = LV[P.lvS] <= LV.P, col65 = P.mayor || P.prud, warn = [], why = [];
    const fuerzaIA = inp.goal === 'fuerza' && LV[P.level] >= LV.I && !P.cauto;
    const exp = LV[P.level] >= LV.I;
    let id, chain, kMotivo = null, rec = null;
    if (P.capP) why.push({ c: 'cap_principiante', p: { dias: d, pesas: wd } });
    // v7 (I-12, C-23): el tope de días de 65+ y el de rutina prudente, cada uno con su texto y su motivo
    if (col65 && d > wd) why.push({ c: P.mayor ? 'cap65' : 'capPrudent', p: { dias: d, pesas: wd, motivo: P.mayor ? 'edad' : inp.age === '16' && LV[P.level] < LV.I ? 'menor' : inp.age === 'nd' ? 'nd' : P.posparto ? 'posparto' : 'salud' } });   // v10: a 16-17 con experiencia y prudente por su salud, el motivo es la salud
    if (P.menor && d > wd) why.push({ c: 'capMenor', p: { dias: d, pesas: wd } });   // v9 (J-11)
    // v7 (C-07): 65+ con experiencia y A/B/C (3 días) o torso/pierna (4 días): «con experiencia» como en la fila de prudentes de §E.2
    const exp65 = !P.mayor || P.mayorExp;
    if (OPT.reparto === 'dias') {
      if (wd <= 2) id = 'cc2';
      // v7 (C-22): 65+ o prudente con días seguidos → torso/pierna (cada zona descansa 48 h; ICFSR 2021, 05 §2.2) aunque K baje de 3 a 2
      else if (wd === 3) { if (inp.consec && !col65) { id = 'tpc3'; why.push({ c: 'consec' }); } else if (inp.consec) { id = 'tp2'; why.push({ c: 'consec' }); kMotivo = 'consec_cauto'; } else id = 'cc3'; }
      else if (wd === 4) id = 'tp4';
      else if (wd === 5) id = beginner ? 'tp4cc' : 'ulppl';
      else id = beginner ? 'tp6' : 'ppl6';
      chain = { cc2: ['cc2'], cc3: ['cc3', 'cc2'], tp2: ['tp2', 'cc3', 'cc2'], tpc3: ['tpc3', 'tp2'], tp4: ['tp4', 'tp2', 'cc3', 'cc2'], tp4cc: ['tp4cc', 'tp4', 'tp2', 'cc3', 'cc2'],
        ulppl: ['ulppl', 'tp4', 'tp2', 'cc3', 'cc2'], tp6: ['tp6', 'tp4', 'tp2', 'cc3', 'cc2'], ppl6: ['ppl6', 'ppl3', 'tp4', 'tp2', 'cc3', 'cc2'] }[id];
      // v13 (D10, E16e): con «más glúteo y pierna», más días de pierna que de torso (65+ y prudentes siguen con los suyos); el torso, lo justo
      // para mantenerlo. Si el material no da para tantos entrenos distintos, la cadena vuelve a los repartos de siempre
      if (inp.enfoque === 'gluteo' && !col65 && wd >= 3) {
        const g = { 3: 'pgp3', 4: 'p3t1', 5: 'tp5g', 6: 'tp6g' }[wd];
        if (g) { id = g; chain = { pgp3: ['pgp3', 'cc3', 'cc2'], p3t1: ['p3t1', 'tp4', 'tp2', 'cc3', 'cc2'], tp5g: ['tp5g', 'ulppl', 'tp4', 'tp2', 'cc3', 'cc2'],
          tp6g: ['tp6g', 'ppl6', 'tp6', 'tp4', 'tp2', 'cc3', 'cc2'] }[g]; }
      }
      // v14 (P1): el reparto que eligió la persona en «Cambiar reparto» (inp.plan), si es de los que se le ofrecen (planesDe). Si su material
      // no da (validación dura o hueco principal vacío o de respaldo), la cadena sigue con el reparto de siempre y el texto lo dice
      rec = id;
      // v14 (P6): el reparto montado día a día (el tipo de cada día) manda sobre el elegido y sobre «Más torso», con los mismos límites
      const medida = inp.roles && inp.roles.length === wd && puedeElegir(inp, P) ? repartoDeTipos(inp.roles) : null;
      if (medida && medida.id !== id) { chain = [medida.id].concat(chain.filter(x => x !== medida.id)); id = medida.id; why.push({ c: 'a_medida' }); }
      else if (medida) why.push({ c: 'a_medida' });
      else if (inp.plan && inp.plan !== id && planesDe(inp, P, id).includes(inp.plan)) { chain = [inp.plan].concat(chain.filter(x => x !== inp.plan)); id = inp.plan; }
      // v14 (P2): «Más torso» en el cuestionario = el reparto con un solo día de pierna de sus días, si se le ofrece a esta persona (los
      // mismos límites que un reparto elegido). Lo que elija después en «Cambiar reparto» (inp.plan) manda; el recomendado (rec) no cambia
      else if (inp.masTorso && !inp.plan && !medida && UNA_PIERNA[wd] && planesDe(inp, P, id).includes(UNA_PIERNA[wd])) { const t = UNA_PIERNA[wd]; chain = [t].concat(chain.filter(x => x !== t)); id = t; why.push({ c: 'mas_torso' }); }
    } else {
      if (col65) {
        if (wd <= 2) id = 'cc2';
        else if (wd >= 4) id = 'tp2';                                       // v7 (C-07): solo 65+ con experiencia que pide 4 o más días
        else if (inp.consec) { id = 'tp2'; why.push({ c: 'consec' }); }      // v7 (C-22): antes CC A/B en días seguidos con un aviso
        else id = (exp && exp65) ? 'cc3' : 'cc2';   // «CC A/B (A/B/C con experiencia)», también con 4-6 días (3 de pesas)
      } else {
        if (d === 2) id = 'cc2';
        else if (d === 3) { if (inp.consec) { id = 'tp2'; why.push({ c: 'consec' }); } else id = (beginner || fuerzaIA) ? 'cc2' : 'cc3'; }
        else if (wd <= 5) id = (beginner || fuerzaIA || inp.goal === 'salud') ? 'tp2' : 'tp4';
        else id = (beginner || inp.goal === 'salud') ? 'tp2' : 'ppl3';
        if (id === 'ppl3' && inp.min <= 30) id = fuerzaIA ? 'tp2' : 'tp4';
        if (beginner && !P.capP && d >= 5) warn.push({ c: 'pocos_pesas' });
        if (fuerzaIA && d >= 3 && ['cc2', 'tp2', 'ppl3'].includes(id)) why.push({ c: 'fuerza_k2' });   // C-06
      }
      chain = CHAIN.slice(CHAIN.indexOf(id));
    }
    return { id, warn, why, chain, kMotivo, rec: rec || id };
  }
  // v14 (P1): los repartos que se ofrecen a esta persona además del recomendado (rec), todos con un entreno distinto por día de pesas.
  // A nadie con 65 o más, rutina prudente o 16-17 años (siguen con el suyo: sus reglas no se tocan), ni con menos de 30 min (el exprés y
  // el modo corto eligen por familias), ni con «más glúteo» (ya eligió su reparto). «Por músculos» (grp…), ni a quien empieza (aprende
  // antes repitiendo) ni con «Ganar fuerza» (cada levantamiento saldría una vez por semana sin más práctica); cuerpo completo ×3, no con días seguidos
  // v14 (P6): el reparto montado día a día. La persona elige el TIPO de cada día (inp.roles) y aquí se pasa a plantillas: si la semana es la
  // de un reparto con nombre, ese (con sus textos); si no, uno a medida («x:…») con una plantilla distinta por cada repetición del tipo (el
  // único día de pierna de la semana es el completo, PU). Como mucho 3 de torso, de pierna o de cuerpo completo, 2 de empuje o de tirón y 1
  // de cada día «por músculos»
  const TIPO_TPL = { torso: ['T1', 'T2', 'T3'], pierna: ['P1', 'P2', 'P3'], empuje: ['E1', 'E2'], tiron: ['Ti1', 'Ti2'], completo: ['CCA', 'CCB', 'CCC'], pecho_triceps: ['PT'], espalda_biceps: ['EB'],
    hombros_brazos: ['HB'], pecho: ['PE'], espalda: ['ES'], hombros: ['HO'], brazos: ['BR'] };
  const tipoDe = r => { const b = ROLE_BASE(r); return /^T(\d|C)$/.test(b) ? 'torso' : /^(PU|P\d|Pi\d?|PC)$/.test(b) ? 'pierna' : /^E\d?$/.test(b) ? 'empuje' : /^Ti\d?$/.test(b) ? 'tiron' : /^CC[A-C]$/.test(b) ? 'completo' :
    ({ PT: 'pecho_triceps', EB: 'espalda_biceps', HB: 'hombros_brazos', PE: 'pecho', ES: 'espalda', HO: 'hombros', BR: 'brazos' })[b] || null; };
  const NOMBRADOS = ['cc3', 'tpc3', 'tpt3', 'ppl3', 'tp4', 'pplt4', 'pplc4', 'grp4', 'ulppl', 'tptpt5', 'pplet5', 'grp5', 'tp4cc', 'ppl6', 'tp6', 'pplg6'];
  function repartoDeTipos(tipos) {
    if (!Array.isArray(tipos) || tipos.length < 3 || tipos.length > 6 || !tipos.every(t => TIPO_TPL[t])) return null;
    // una semana con días de empuje (o de pecho, o de hombros) necesita algún día que tire (torso, tirón, cuerpo completo o espalda): es la
    // regla que cuida el hombro (tirón:empuje ≥ 1). Sin él, el equilibrio tendría que quitar empujes y meter remos donde no tocan
    if (tipos.some(t => ['empuje', 'pecho_triceps', 'pecho', 'hombros', 'hombros_brazos'].includes(t)) && !tipos.some(t => ['torso', 'tiron', 'completo', 'espalda_biceps', 'espalda'].includes(t))) return null;
    const nom = NOMBRADOS.find(id => SPLITS[id].length === tipos.length && SPLITS[id].every((r, i) => tipoDe(r) === tipos[i]));
    if (nom) return { id: nom, roles: SPLITS[nom].slice() };
    const n = {}, k = {}; tipos.forEach(t => { n[t] = (n[t] || 0) + 1; });
    const tpl = tipos.map(t => { const i = k[t] = (k[t] || 0) + 1; return n[t] === 1 ? (t === 'pierna' ? 'PU' : t === 'empuje' ? 'E' : t === 'tiron' ? 'Ti' : TIPO_TPL[t][0]) : (TIPO_TPL[t][i - 1] || null); });
    if (!tpl.every(Boolean)) return null;
    const id = 'x:' + tpl.join(''); SPLITS[id] = tpl; return { id, roles: tpl };
  }
  // quién puede elegir reparto (uno con nombre, «Más torso» o día a día): nadie con 65 o más, rutina prudente o 16-17 años, ni con menos de
  // 30 min, ni con «más glúteo»; y siempre con un entreno distinto por día
  const puedeElegir = (inp, P) => OPT.reparto === 'dias' && !P.mayor && !P.prud && !P.menor && inp.min >= 30 && inp.enfoque !== 'gluteo' && P.wd >= 3;
  const UNA_PIERNA = { 3: 'tpt3', 4: 'pplt4', 5: 'pplet5', 6: 'pplg6' };   // v14 (P2): el reparto de «Más torso» para cada número de días
  const PLANES = { 3: ['cc3', 'tpc3', 'tpt3', 'ppl3'], 4: ['tp4', 'pplt4', 'pplc4', 'grp4'], 5: ['ulppl', 'tptpt5', 'pplet5', 'grp5'], 6: ['ppl6', 'tp6', 'pplg6'] };
  function planesDe(inp, P, rec) {
    if (!puedeElegir(inp, P)) return [];
    const beginner = LV[P.lvS] <= LV.P;
    return (PLANES[P.wd] || []).filter(id => id !== rec && !(/^grp/.test(id) && (beginner || inp.goal === 'fuerza')) && !(id === 'cc3' && inp.consec));
  }
  // v14 (P7): «Otro entreno para este día». Con la rutina que la persona tiene delante (res; pos = el día por su posición), se rehace todo
  // con el sorteo solo en ese día (ctx.altDia), cada hueco de los demás días anclado al ejercicio que ya tiene (ctx.fijos) y lo que ese día
  // llevaba, penalizado (ctx.prev). Es una rutina generada entera: las series de la semana se vuelven a cuadrar y pasan las mismas reglas.
  // Solo vale si los demás días conservan exactamente sus ejercicios y ese día cambia; si no, se prueba otra vez del sorteo (hasta 8) y, si
  // ninguna vale, null (la app lo dice). Devuelve la rutina y el contexto que la reproduce ({altDia, fijos, prev})
  function otroDia(inp, ctx, res, pos) {
    ctx = ctx || {}; const K = res.det.length; if (!(pos >= 0 && pos < K)) return null;
    const ord = Array.isArray(res.meta.orden) && res.meta.orden.length === K ? res.meta.orden : [...Array(K).keys()], src = ord[pos];
    const libs = d => d.rows.filter(r => r.kind === 'str').map(r => r.lib), firma = d => libs(d).slice().sort().join(',');
    const fijos = {}; res.det.forEach((d, i) => { if (i !== pos) d.rows.forEach(r => { if (r.kind === 'str' && r.key) fijos[r.key] = r.lib; }); });
    const prev = libs(res.det[pos]), n0 = ctx.altDia && ctx.altDia[src] ? ctx.altDia[src] : 0;
    for (let n = n0 + 1; n <= n0 + 8; n++) {
      const c2 = Object.assign({}, ctx, { altDia: { [src]: n }, fijos, prev: new Set(prev) }), r = genRoutine(inp, c2);
      if (!r.ok || r.det.length !== K || r.meta.split !== res.meta.split) continue;
      if (!r.det.every((d, i) => i === pos || firma(d) === firma(res.det[i])) || firma(r.det[pos]) === firma(res.det[pos])) continue;
      return { res: r, ctx: { altDia: c2.altDia, fijos, prev }, n, nuevos: libs(r.det[pos]).filter(x => !prev.includes(x)).length };
    }
    return null;
  }
  // v14 (P9): la forma de reparto de salida, que la app usa para elegir la opción `reparto` cuando la persona no ha elegido ninguna. D1
  // (6 nov) puso «un entreno distinto cada día» ('dias') para todo el mundo; el 13 nov el usuario aprobó que quien EMPIEZA DE CERO (modo
  // inicio) salga con 2 entrenos que se alternan ('recomendado'): con 'dias' le salían 15 ejercicios distintos con 3 días y 20 con 4, cada
  // uno una vez por semana, y al empezar se aprende repitiendo. No si pidió una estructura que solo existe con un entreno por día (un
  // reparto elegido, «Más torso» o «Más glúteo y pierna»): lo pedido manda
  function formaInicial(inp) { return (inp.modes || []).includes('inicio') && !inp.plan && !inp.masTorso && inp.enfoque !== 'gluteo' ? 'recomendado' : 'dias'; }
  // lo que usa la app para montar «Cambiar reparto»: el recomendado y los demás (ella genera cada uno y enseña solo los que salen)
  function planes(inp) { const P = effective(inp), rec = tableSplit(Object.assign({}, inp, { plan: null }), P).rec; return { rec, otros: planesDe(inp, P, rec) }; }
  function splitOptions(inp, P) {
    const tb = tableSplit(inp, P);
    let ids = tb.chain.filter(id => SPLITS[id].length <= P.wd);
    // v7: 65+ y prudentes, cuerpo completo; torso/pierna con días seguidos (C-22) y, con experiencia y 4 días, también T/P ×2 en 'dias' (C-07)
    if (P.mayor || P.prud) ids = ids.filter(id => id === 'cc2' || id === 'cc3' || id === 'tp2' || (id === 'tp4' && P.mayorExp));
    // v3 (D-12): con días seguidos, el respaldo nunca pasa a cuerpo completo (65+ y prudentes sí, con el aviso «mejor días alternos»)
    if (inp.consec && !(P.mayor || P.prud) && !['cc2', 'cc3'].includes(tb.id)) { const nc = ids.filter(id => !['cc2', 'cc3'].includes(id)); if (nc.length) ids = nc; }
    const out = [];
    const dOther = Math.min(inp.daysOther || 0, P.wd - 1);
    const beginner = LV[P.lvS] <= LV.P;
    // v9 (J-10, C-06): «Ganar fuerza» I/A con dos sitios y 2 o más días de gimnasio: los dos entrenos de fuerza se alternan en el gimnasio
    // (cada levantamiento 1,5 veces por semana con 3 días; 05 §1.2: 4-9 series por levantamiento en 2-3 sesiones) y los días de casa son
    // de accesorios. Antes, torso/pierna ×2 con un entreno en casa: cada levantamiento 1 vez por semana (David)
    if (dOther > 0 && inp.goal === 'fuerza' && LV[P.level] >= LV.I && !P.cauto && inp.places.g && inp.places.c && OPT.reparto !== 'dias') {
      const gymDays = inp.places.main === 'g' ? P.wd - dOther : dOther, homeDays = P.wd - gymDays;
      if (gymDays >= 2 && homeDays >= 1) {
        const casa = homeDays === 1 ? ['TC'] : ['TC', 'PC'];
        out.push({ id: 'fz2', roles: ['CCA', 'CCB'].concat(casa), K: 2 + casa.length, table: tb.id, rec: tb.rec, warn: tb.warn, why: tb.why.concat([{ c: 'fuerza_2sitios', p: { gym: gymDays, casa: homeDays } }]), dOther, kMotivo: null,
          alternas: gymDays % 2 === 1, sitios: ['g', 'g'].concat(casa.map(() => 'c')), freq: [gymDays / 2, gymDays / 2].concat(casa.map(() => homeDays / casa.length)) });
      }
    }
    for (const id of ids) {
      let sid = id, roles = SPLITS[id].slice();
      if (dOther > 0) {
        const K0 = roles.length, m = dOther * K0 / P.wd;
        if (!(Number.isInteger(m) && m >= 1 && m <= K0 - 1)) { sid = { 2: 'cc2', 3: (inp.consec && !(P.mayor || P.prud)) ? 'tpc3' : 'cc3', 4: 'tp4', 5: beginner ? 'tp4cc' : 'ulppl', 6: beginner ? 'tp6' : 'ppl6' }[P.wd]; roles = SPLITS[sid].slice(); }
      }
      if (out.some(o => o.id === sid)) continue;
      out.push({ id: sid, roles, K: roles.length, table: tb.id, rec: tb.rec, warn: tb.warn, why: tb.why, dOther, kMotivo: tb.kMotivo, alternas: sid === 'cc2' && P.wd === 3 || sid === 'tp2' && P.wd === 3 });
    }
    return out;
  }
  // E.2 dos sitios: qué entrenos van al segundo sitio (prefiriendo la gemela ligera) y orden de la rotación
  function placeAssignments(opt, inp, P) {
    if (opt.sitios) return [opt.sitios.slice()];   // v9 (J-10): fuerza con dos sitios, sitios fijos
    const main = inp.places.main, other = main === 'g' ? 'c' : 'g';
    if (!opt.dOther || !inp.places[other]) return [opt.roles.map(() => main)];
    const K = opt.K, m = opt.dOther * K / P.wd;
    const combos = []; const idx = [...Array(K).keys()];
    (function rec(start, acc) { if (acc.length === m) { combos.push(acc.slice()); return; } for (let i = start; i < K; i++) { acc.push(i); rec(i + 1, acc); acc.pop(); } })(0, []);
    const pref = i => { const r = ROLE_BASE(opt.roles[i]); const li = LIGHT.indexOf(r); return li >= 0 ? li : 3 + (K - i); };
    combos.sort((a, b) => a.map(pref).reduce((x, y) => x + y, 0) - b.map(pref).reduce((x, y) => x + y, 0));
    return combos.map(c => idx.map(i => c.includes(i) ? other : main));
  }
  // orden de rotación: los del segundo sitio al final; sin dos del mismo tipo seguidos; «1» antes que «2»
  function rotationOrder(roles, asg, main) {
    const K = roles.length; const typ = r => { const b = ROLE_BASE(r); return /^Ti/.test(b) ? 'Ti' : /^Pi/.test(b) ? 'Pi' : /^E/.test(b) ? 'E' : b[0] === 'T' ? 'T' : b[0] === 'P' ? 'P' : b; };
    if (asg.every(a => a === main)) return [...Array(K).keys()];
    const perms = []; (function rec(acc, rest) { if (!rest.length) { perms.push(acc); return; } rest.forEach((x, i) => rec(acc.concat(x), rest.slice(0, i).concat(rest.slice(i + 1)))); })([], [...Array(K).keys()]);
    const nOther = asg.filter(a => a !== main).length; let best = null, bs = -1e9;
    for (const p of perms) {
      if (!p.slice(K - nOther).every(i => asg[i] !== main)) continue;
      let s = 0; for (let j = 0; j < K; j++) if (typ(roles[p[j]]) === typ(roles[p[(j + 1) % K]]) && K > 2) s -= 10;
      for (let j = 0; j < K; j++) for (let k = j + 1; k < K; k++) if (p[j] > p[k]) s -= 0.1;   // conserva el orden base («1» antes que «2»)
      if (s > bs) { bs = s; best = p; }
    }
    return best;
  }

  // ════════ build (E.16) ════════
  function build(opt, asg, st0, tgt) {
    const { inp, P } = st0;
    const order = rotationOrder(opt.roles, asg, inp.places.main);
    const T = order.map((ri, n) => {
      const role = opt.roles[ri], rb = ROLE_BASE(role);
      const pk = asg[ri], Pl = inp.places[pk];
      const fz = inp.goal === 'fuerza' && LV[P.level] >= LV.I, k2 = fz && ['tp2', 'ppl3'].includes(opt.id);   // v3 (C-06): fuerza con 2-3 entrenos
      let def = (k2 && TPL_FUERZA_K2[rb]) ? TPL_FUERZA_K2[rb] : (fz && TPL_FUERZA[rb]) ? TPL_FUERZA[rb] : TPL[rb];
      def = def.slice();
      // v7 (D-03): un levantamiento que es «con cuidado» de una zona que duele ahora deja de ser levantamiento objetivo (se elige la variante amable)
      const lift = ((fz && !P.cauto) ? ((k2 && LIFT_K2[rb]) || LIFT[rb] || []) : []).filter(id => !ahoraCuidado(P, LIFT_ID[id]));
      if (P.powerOk && ['CCA', 'P1', 'Pi', 'Pi1', 'PU'].includes(rb)) def = [['PW', 2]].concat(def);
      if (P.prioG.has('gluteos') && ['P1', 'P2', 'P3', 'Pi', 'Pi1', 'Pi2', 'PU'].includes(rb)) def = def.concat([['AB', P.enfoque ? 2 : 3]]);   // v2: abductores con prioridad glúteos (v12: secundario con «más glúteo»)
      // v12 (D10): con «más glúteo», el hip thrust o el puente va justo tras el primero en los días de pierna (secundario, pero de lo último
      // en recortarse: h.glu) y los de cuerpo completo llevan uno
      // (si la plantilla ya lo tiene como principal —P2, Pi2, P3, PC—, se queda como está)
      if (P.enfoque && ['P1', 'P2', 'P3', 'Pi', 'Pi1', 'Pi2', 'PC'].includes(rb)) { const i = def.findIndex(d => d[0] === 'HE'); if (!(i >= 0 && def[i][1] === 1)) { if (i >= 0) def.splice(i, 1); def.splice(Math.min(1, def.length), 0, ['HE', 2]); } }
      // v12 (D10): y menos torso: en los días de torso, empuje y tirón, los secundarios de torso (tras los dos primeros) solo entran si falta
      // volumen (hueco 3), salvo el curl y el tríceps de quien también prioriza brazos
      // y, al final, un hueco 3 de abductores: el tiempo que sobre en esos días va al glúteo (t.gluZ), no al torso
      const gluZ = P.enfoque && /^(T\d|E\d?|Ti\d?|TC)$/.test(rb);
      // (con 45 min o más: con menos tiempo y en el exprés, esos huecos dan el tercer ejercicio del día, V4; y nunca los de una prioridad elegida)
      if (gluZ && inp.min >= 45) def = def.map((d, i) => d[1] === 2 && i >= 2 && ['PV', 'PI', 'PH', 'TV', 'TH', 'RA', 'RE', 'CU', 'TR', 'FL'].includes(d[0]) && !P.prioV.has(SLOT[d[0]].grupo) && !(['CU', 'TR'].includes(d[0]) && P.prioG.has('biceps')) ? [d[0], 3].concat(d.slice(2)) : d);
      if (gluZ) def = def.concat([['AB', 3]]);
      if (P.enfoque && ['CCA', 'CCB', 'CCC'].includes(rb) && !def.some(d => d[0] === 'HE')) { const i2 = def.findIndex(d => d[1] >= 2); def.splice(i2 < 0 ? def.length : i2, 0, ['HE', 2]); }
      if (P.hombroAhora) def = def.map(d => d[0] === 'RA' ? ['RX', d[1]] : d);   // v8 (J-02): rotación externa en lugar de elevaciones laterales
      // v9 (J-08): con prioridad de brazos, un curl y un tríceps directos (huecos 2) en cada día de torso o de cuerpo completo (y el del
      // grupo en empuje o tirón), antes que elevaciones, gemelos o aperturas: con la cuenta indirecta no salía ni un curl (488 de 525)
      // v14 (P11): «torso» es T1, T2, T3 o TC; antes bastaba con empezar por «T» y el día de tirón (Ti) se llevaba también un tríceps
      if (P.prioG.has('biceps')) {
        const z = ZONA_TPL[rb], want = z === null || /^T(\d|C)$/.test(rb) ? ['CU', 'TR'] : (z || []).includes('biceps') ? ['CU'] : (z || []).includes('triceps') ? ['TR'] : [];
        for (const w of want) { const i = def.findIndex(d => d[0] === w); if (i >= 0) def.splice(i, 1); }
        // (delante de los demás huecos 2, para que se llenen antes: si no, una dominada supina de un remo secundario le quita el curl)
        const i2 = def.findIndex(d => d[1] >= 2); def.splice(i2 < 0 ? def.length : i2, 0, ...want.map(w => [w, 2]));
      }
      // v9 (J-09): «Ganar fuerza» en un sitio con mancuernas de 20 kg o menos y sin barra ni máquinas: la sentadilla principal, a una pierna
      // (búlgara: con 2 × 20 kg sí cuesta a 8-10; una goblet con 20 kg, no)
      if (fz && !P.cauto && cargaLigera(Pl)) def = def.map(d => d[0] === 'SQ' && d[1] === 1 ? ['LU', 1] : d);
      if (P.huesos && inp.min > 20) def = def.concat([['EX', 2]]);               // v8 (J-07): extensores de la espalda cada día (Sinaki 2002); con 15-20 min, en casa (aviso)
      // v14 (P3): «Ganar músculo» sin precaución y con 45 min o más: en los días de torso, el curl y el tríceps dejan de ser accesorios que
      // solo entran si falta volumen (con la cuenta indirecta de remos y presses no faltaba nunca: 0 series directas con 3-4 días) y pasan a
      // secundarios, detrás de los demás. Son un extra (h.xbr): lo primero que sale si el día no cabe; nunca desplazan a otro ejercicio.
      // (empuje y tirón ya llevan el suyo como secundario; con prioridad de brazos manda J-08; con «más glúteo», el torso va en lo justo)
      const xbr = new Set();
      if (inp.goal === 'musculo' && !P.cauto && inp.min >= 45 && !P.prioG.has('biceps') && !P.enfoque && /^(T\d|TC)$/.test(rb)) {
        for (const w of ['CU', 'TR']) { if (def.some(d => d[0] === w && d[1] <= 2)) continue; const i = def.findIndex(d => d[0] === w && d[1] === 3); if (i >= 0) { def[i] = [w, 2].concat(def[i].slice(2)); xbr.add(i); } }
      }
      const slots = def.map((d, i) => mkSlot(d[0], d[1], d[2], role + '#' + n + ':' + d[0] + ':' + i));
      xbr.forEach(i => { slots[i].xbr = 1; });
      if (P.segM) slots.forEach(h => { if (h.id === 'LU') { h.prio = Math.min(h.prio, 2); h.obl = 1; h.uni = 1; } });   // LU obligatorio con apoyo (65+; v7: y «Prefiero no decirlo», C-14)
      slots.forEach(h => { if (h.id === 'EX') h.fijo = 1; if (P.enfoque && h.id === 'HE') h.glu = 1; if (P.prioG.has('biceps') && ['CU', 'TR'].includes(h.id) && h.prio === 2) h.brazo = 1; });   // v8: no lo quitan los topes ni los recortes (salvo el exprés) · v9 (J-08)
      // v9 (J-10): veces por semana que se hace ESTE entreno (con un solo sitio, días de pesas ÷ K en todos)
      return { n, role, rb, place: pk, P: Pl, slots, lift, gluZ: gluZ ? 1 : 0, f: opt.freq ? opt.freq[ri] : P.wd / opt.roles.length, light: ['tp4', 'tp4cc', 'ulppl', 'ppl6', 'tp6', 'pgp3', 'p3t1', 'tp5g', 'tp6g'].includes(opt.id) && LV[P.level] >= LV.I && ['T2', 'P2', 'E2', 'Ti2', 'Pi2'].includes(rb) };
    });
    const st = Object.assign({}, st0, { T, used: new Set(inp.avoid || []), opt, tgt, warn: [], why: [], avoided: new Set(), rest: restTable(inp, P), f: P.wd / T.length, log: [] });
    // E.8 orden de llenado: huecos 1 de todas, luego 2
    // v2 (D-07, D-11): con «Ganar fuerza» I/A, primero los huecos del levantamiento objetivo de cada plantilla (si no, el peso muerto se lo
    // queda el primer día que tenga una bisagra); después los huecos 1 y por último los 2 (§E.8)
    const isLift = (t, h) => h.prio === 1 && t.lift.includes(h.id);
    for (const pr of [0, 1, 2]) T.forEach(t => t.slots.filter(h => !h.x && !h.empty && (pr === 0 ? isLift(t, h) : h.prio === pr)).forEach(h => { const x = fill(h, t, st); if (x) { h.x = x; h.on = true; } else h.empty = true; }));
    // v14 (P3): un extra de brazos que no encontró su aislamiento vuelve a ser el accesorio de siempre (entra solo si falta volumen): no es un hueco vacío
    T.forEach(t => t.slots.forEach(h => { if (h.xbr && h.empty) { h.prio = 3; h.empty = false; delete h.xbr; } }));
    // v15 (T2): bíceps y tríceps directos asegurados en «Completa» y «A fondo», con todos los objetivos: al menos un ejercicio de cada
    // uno a la semana (2 series). Con los huecos ya llenos: si la semana lleva uno directo como secundario (empuje, tirón, «por músculos»,
    // prioridad de brazos) o como extra de «Ganar músculo», es ese (h.gar); si no, su accesorio sube a secundario —o se añade el hueco— en
    // el primer día de su zona donde de verdad hay con qué hacerlo (por orden de menos ejercicios, uno en cada día si se puede; solo curl
    // o extensión: garUp). Asegurado = de lo último que quita el tope de ejercicios y no sale por tiempo: cae antes otro accesorio.
    // No se aplica a 65 o más, «Prefiero no decirlo», huesos frágiles ni rutina prudente (sus huecos de seguridad y su core van antes);
    // ni a «Lo esencial» ni al exprés, que no llevan brazos directos (la tarjeta lo dice).
    if ((inp.sesion === 'completa' || inp.sesion === 'fondo') && !P.segM && !P.huesos && !P.prud) for (const w of ['TR', 'CU']) {
      const g = w === 'CU' ? 'biceps' : 'triceps', directo = h => h.id === w && h.x && h.on && fracV(BY.get(h.x.lib), g) === 1, nGar = t => t.slots.filter(h => h.gar).length;
      const ya = T.slice().sort((a, b) => nGar(a) - nGar(b) || a.n - b.n).map(t => t.slots.find(h => directo(h) && h.prio <= 2)).find(Boolean);
      if (ya) { ya.gar = 1; delete ya.xbr; continue; }
      const n2 = t => t.slots.filter(h => h.on && h.x && h.prio <= 2).length + 10 * nGar(t);
      const cs = T.filter(t => { const z = ZONA_TPL[t.rb]; return !z || z.includes(g); }).sort((a, b) => n2(a) - n2(b) || a.n - b.n);
      for (const t of cs) { let h = t.slots.find(k => k.id === w && !k.x), nuevo = false;
        if (!h) { h = mkSlot(w, 2, null, t.role + '#' + t.n + ':' + w + ':g'); nuevo = true; }
        const antes = { prio: h.prio, empty: h.empty }; h.prio = 2; h.gar = 1; h.garUp = 1; h.empty = false;
        const x = fill(h, t, st);
        if (x) { h.x = x; h.on = true; if (nuevo) t.slots.push(h); break; }
        h.prio = antes.prio; h.empty = antes.empty; delete h.gar; delete h.garUp; }
    }
    // 65+: al menos un unilateral de pierna a la semana (si ninguna plantilla tiene LU, se añade a la primera de pierna)
    // v2: un hueco de press de hombros que el material o la seguridad dejan vacío se sustituye por otro press (inclinado o, si no, plano):
    // sin esto, en casa sin material el día de torso se queda con un solo empuje y falla la cobertura (V5)
    T.forEach(t => t.slots.filter(h => h.empty && h.id === 'PV' && h.prio <= 2 && !h.sust).forEach(h => { const h2 = mkSlot('PI', h.prio, null, h.key + ':sust'); const x = fill(h2, t, st); if (x) { h.sust = 1; h2.x = x; h2.on = true; h2.de = 'PV'; t.slots.splice(t.slots.indexOf(h) + 1, 0, h2); } }));
    if (P.segM && !T.some(t => t.slots.some(h => h.on && h.id === 'LU'))) { const t = T.find(t => LEG_TPL.includes(t.rb)) || T[0]; const h = mkSlot('LU', 2, null, t.role + '#' + t.n + ':LU:x'); h.obl = 1; h.uni = 1; t.slots.push(h); const x = fill(h, t, st); if (x) { h.x = x; h.on = true; } }
    // v5 (paso 3): el calentamiento, el equilibrio y el cardio se planifican antes, para que el presupuesto de tiempo los cuente (D-17);
    // la prescripción va antes del tope (las repeticiones y los descansos entran en los minutos)
    st.corto = P.corto;
    addWarmupBalanceCardio(st);
    prescribe(st);
    capSessions(st);
    if (P.sinAbs && inp.min === 15) quitaAbs(st, true);   // v15 (T3): en el exprés, el core sale antes de elegir los 3 ejercicios
    if (inp.min === 15 || P.corto) expres(st, P.corto ? (inp.min <= 15 ? 2 : 3) : 3); else {
      balanceVolume(st);
      // E.16: huecos 3 si hay déficit (ordenados por las prioridades), sin pasar del tope de la sesión (v2, D-08)
      T.forEach(t => t.slots.filter(h => h.prio === 3 && !h.on && !h.x && !h.cap).sort((a, b) => (P.prioV.has(b.grupo) ? 1 : 0) - (P.prioV.has(a.grupo) ? 1 : 0))
        .forEach(h => { if ((deficit(st, h.grupo) || (h.id === 'AB' && P.prioV.has('gluteos'))) && nStr(t) < capOf(P, inp.min, inp.sesion)) { const x = fill(h, t, st); if (x) { h.x = x; h.on = true; setPres(st, t, h); h.x.s = 2; if (!fitsDay(t, st)) { h.on = false; st.used.delete(h.x.lib); h.x = null; } } } }));
    }
    fitTime(st);
    // v15 (T3): «Abdominales: No» = la misma rutina sin sus ejercicios de abdominales (ningún otro ocupa su sitio: la sesión dura menos)
    if (P.sinAbs) quitaAbs(st);
    orderSessions(st);
    return st;
  }
  // (un día de 3 ejercicios no baja de 3, V4: su core solo sale si otro hueco del día ocupa su sitio; si no hay ninguno, se queda)
  function quitaAbs(st, todo) {
    const esCore = id => { const L = BY.get(id); return famOf(L) === 'core' || CORE_PATS.includes(L.pat); }, fuera = h => { h.on = false; st.used.delete(h.x.lib); h.x = null; h.cut = 1; };
    st.T.forEach(t => t.slots.slice().forEach(h => { if (!h.on || !h.x || h.obl || h.fijo || !esCore(h.x.lib)) return;
      if (todo || nStr(t) > 3) { fuera(h); return; }
      const alt = t.slots.find(k => { if (k === h || k.on || k.empty || k.id === 'CO' || k.id === 'PW') return false; const x = k.x || fill(k, t, st, true); return !!x && !esCore(x.lib) && canAddEx(st, t, BY.get(x.lib), 2); });
      if (!alt) return;
      if (!alt.x) alt.x = fill(alt, t, st); else st.used.add(alt.x.lib);
      if (!alt.x) return; alt.on = true; setPres(st, t, alt); alt.x.s = 2; fuera(h); }));
    st.warn = st.warn.filter(w => w.c !== 'core_corto' && !(w.c === 'vol_corto' && w.p && w.p.g === 'abdomen'));
  }
  function mkSlot(id, prio, add, key) {
    const d = SLOT[id]; const pats = d.pats.slice(); (add || []).forEach(p => { if (!pats.includes(p)) pats.push(p); });
    return { id, prio, pats, add: (add || []).slice(), tipo: d.tipo, vecT: vec(d.mus), grupo: d.grupo, leg: !!d.leg, prot: !!d.prot, key, x: null, on: false };
  }
  const act = t => t.slots.filter(h => h.on && h.x);
  const nStr = t => act(t).length;
  // v2 (D-08): si una sesión pasa del tope, se apagan huecos 2-3: primero los accesorios, luego lo que otro día de la semana ya cubre;
  // el core y el hombro posterior solo si otro día los tiene; nunca un hueco 1 ni uno obligatorio
  const CUT_ORDER = ['CO', 'RA', 'RX', 'FL', 'KE', 'CA', 'CU', 'TR', 'AB', 'RE', 'KF', 'TV', 'TH', 'PV', 'PI', 'HE', 'LU', 'SQ', 'HI', 'PH', 'EX', 'PW'];
  function capSessions(st) {
    if (st.inp.min === 15 || st.P.corto) return;   // el exprés y el modo corto (C-17) eligen sus ejercicios por familia (§E.11)
    const cap = capOf(st.P, st.inp.min, st.inp.sesion);
    const fam = h => { const L = BY.get(h.x.lib); return L.pat === 'knee_flex' ? 'cadera' : famOf(L); };
    const weekFam = (f, except) => st.T.reduce((a, t) => a + act(t).filter(h => h !== except && famOf(BY.get(h.x.lib)) === f).length * t.f, 0);   // v9: veces por semana
    const minT = t => dayMinutes(t, st, false, { s: 2, floor: true, noCardio: true });
    for (const t of st.T.slice().sort((a, b) => minT(b) - minT(a) || a.n - b.n)) {
      // v5 (D-17): presupuesto de tiempo previo: si ni con 2 series y los descansos en su suelo cabe el día (calentamiento y equilibrio
      // incluidos; el cardio final se recorta antes en fitTime), fuera ejercicios con el mismo orden que el tope de ejercicios
      const overT = () => nStr(t) > 3 && dayMinutes(t, st, false, { s: 2, floor: true, noCardio: true }) > st.inp.min + 1e-9;
      for (let k = 0; k < 10 && (nStr(t) > cap || overT()); k++) {
        if (nStr(t) <= cap) st.preCut = true;   // quitado por tiempo (para el motivo de los avisos)
        const elsewhere = h => st.T.some(o => o !== t && act(o).some(k2 => k2.id === h.id));
        const day = act(t), kn = day.filter(h => fam(h) === 'rodilla').length, hp = day.filter(h => fam(h) === 'cadera').length;
        const pushW = st.T.reduce((a, o) => a + act(o).filter(h => ['push_h', 'push_v', 'fly'].includes(BY.get(h.x.lib).pat)).length * 2 * o.f, 0);
        let best = null, bs = -1e9;
        for (const h of day) {
          if (h.prio === 1 || h.obl || h.fijo || h.id === 'PW') continue;
          { const f0 = famOf(BY.get(h.x.lib)); if (f0 && f0 !== 'core' && weekFam(f0, h) + 1e-9 < v5need(st, f0)) continue; }   // v5: nunca por debajo de V5
          let s = (h.prio === 3 ? 100 : 0) + (elsewhere(h) ? 20 : 0) + (20 - CUT_ORDER.indexOf(h.id)) / 2;
          if (h.id === 'CO' && !elsewhere(h) && st.inp.min > 20) continue;  // v5: el último core de la semana no sale (V5; con 20 min o menos es aviso)
          if (h.id === 'RE' && !elsewhere(h) && pushW >= 6) s -= 50;      // hombro posterior protegido con 6+ series de empuje
          if (h.xbr) s += 60;   // v14 (P3): los brazos de «Ganar músculo» son un extra: lo primero que sale
          if (h.gar) s -= 60;   // v15 (T2): el bíceps y el tríceps asegurados, de lo último en irse
          if (h.brazo) s -= 60; if (h.glu) s -= 50;   // v12 (D10): el glúteo de quien lo pidió, de lo último en irse (tras una prioridad de brazos elegida)                                            // v9 (J-08): el trabajo directo de la prioridad, lo último que sale
          if (fam(h) === 'rodilla' && kn <= hp) s -= 30;                   // no desequilibrar rodilla:cadera dentro del día
          if (fam(h) === 'cadera' && hp <= kn) s -= 30;
          { const L0 = BY.get(h.x.lib), pp = pushPull(st), w = h.x.s * t.f;   // v5: ni tirón:empuje ni rodilla:cadera de la semana
            if (isPull(L0) && pp.pu - w < pp.ps - 1e-9) s -= 40; if (isPush(L0) && pp.ps > pp.pu - 1e-9) s += 15;
            const kn2 = ['squat', 'lunge', 'knee_ext'].includes(L0.pat), hp2 = ['hinge', 'hip_ext', 'knee_flex'].includes(L0.pat);
            if (kn2 && pp.hp > 0 && (pp.kn - w) / pp.hp < 0.6) s -= 20; if (hp2 && pp.hp - w > 0 && pp.kn / (pp.hp - w) > 1.6) s -= 20; }
          if (s > bs) { bs = s; best = h; }
        }
        if (!best) break;
        best.on = false; st.used.delete(best.x.lib); best.x = null; best.cap = 1; st.log.push('tope:' + t.rb + ':' + best.id);
      }
    }
  }
  // ejercicios distintos de un grupo en la semana (hombro por cabezas)
  const groupN = (st, sg) => st.T.reduce((a, t) => a + act(t).filter(h => subGroup(BY.get(h.x.lib)) === sg).length, 0);

  // ════════ E.4-E.7 candidatos y puntuación ════════
  const baseP = p => p.split(':')[0];
  function ownIdx(L, h) {
    for (let i = 0; i < h.pats.length; i++) {
      const p = h.pats[i];
      if (p === 'push_h:inc') { if (L.pat === 'push_h' && angle(L) === 'inc') return i; continue; }
      if (p === 'pull_v:sup') { if (K.CU_EXTRA.includes(L.id)) return i; continue; }
      if (p === 'push_h:dip') { if (K.TR_EXTRA.includes(L.id)) return i; continue; }
      if (L.pat === p) return i;
    }
    return -1;
  }
  function nearPats(h) { const s = new Set(); h.pats.filter(p => !p.includes(':')).forEach(p => (PAT_NEAR[p] || []).forEach(q => s.add(q))); return s; }
  function safe(L, st, why) {
    const { inp, P } = st, lim = TAGS.lim[L.id] || {};
    const no = r => { if (why) why.push(r); return false; };
    if (TAGS.nogen.has(L.id)) return no('riesgo');
    if ((inp.avoid || []).includes(L.id)) return no('avoid');
    const expl = L.pat === 'plyo' || L.pat === 'full';
    if (expl && !P.powerOk) return no('explosivo');
    // v7 (C-16): la lesión reciente se trata como «Me operaron»: fuera todo lo que carga la zona (lim ≥ 1)
    for (const z of Object.keys(P.zones)) { if (z === 'otra') continue; const v = lim[z] || 0; if (v === 2) return no('lim:' + z); if (v >= 1 && (P.zones[z] === 'op' || P.zones[z] === 'reciente')) return no('op:' + z); }
    if (P.noImpact && lim.impacto === 2) return no('impacto');
    // v7 (C-14): los filtros de 65+ también con «Prefiero no decirlo» (segM)
    if (P.segM && (lim.impacto === 2 || L.pat === 'plyo' || L.dif === 3 || TAGS.spine.has(L.id))) return no('mayor');
    // v7 (C-13, C-12): huesos frágiles y posparto: sin flexión ni giro de columna con carga; huesos frágiles, tampoco abdominales en flexión o giro
    if ((P.huesos || P.posparto) && TAGS.spine.has(L.id)) return no('columna');
    if (P.huesos && TAGS.spineFlex.has(L.id)) return no('huesos');
    // v7 (D-02, C-14): 65+ y «Prefiero no decirlo»: ningún unilateral de pie con carga en las manos (sin mano libre para la pared o la silla)
    // ni hip thrust con barra (montar la barra en la cadera); el «con apoyo» es peso corporal, guiado (prensa, Smith) o TRX
    if (P.segM && L.u && ['squat', 'lunge', 'hinge'].includes(L.pat) && CARGA_MANOS.includes(L.mat)) return no('apoyo');
    if (P.segM && L.id === 'lib_hip_thrust_bb') return no('mayor');
    if (P.prud && (L.dif === 3 || expl || L.id === 'lib_cardio_hiit')) return no('prudente');
    // v8 (J-02): hombro que duele ahora: nada por encima de la cabeza (salvo el landmine), colgado, con barra en la espalda, fondos ni elevaciones
    if (P.hombroAhora && TAGS.hombroAhoraFuera.has(L.id)) return no('hombro_ahora');
    // v8 (J-05): rodilla que duele ahora: ni sentadilla con barra o en máquina de carga alta, ni búlgaras ni zancadas largas
    if (P.rodillaAhora && TAGS.rodillaAhoraFuera.has(L.id)) return no('rodilla_ahora');
    // v8 (J-03): 65 o más (y «Prefiero no decirlo»): nada colgado de una barra (riesgo de caída y carga del hombro)
    if (P.segM && TAGS.colgado.has(L.id)) return no('colgado');
    // v8 (J-07): huesos frágiles: ningún remo con la espalda inclinada sin apoyo
    if (P.huesos && TAGS.remoSinApoyo.has(L.id)) return no('huesos_remo');
    return true;
  }
  // v7 (C-07): 65+ con experiencia, dificultad hasta 2 en máquinas, Smith y mancuernas (la barra libre, no: tampoco en el hueco 1)
  function difOk(L, P, strict) { if (L.dif <= P.difCap) return true; if (P.mayorExp && L.dif === 2 && ['maquina', 'smith', 'mancuernas'].includes(L.mat)) return true; return !strict && P.dif2 && L.dif === 2 && (TAGS.lim[L.id].lumbar || 0) < 2; }
  const canDo = (L, t, st, strict) => placeCan(L, t.P, t.place) && safe(L, st) && difOk(L, st.P, strict !== false);
  // v9 (J-09): sitio con mancuernas de 20 kg o menos y sin barra, Smith, máquinas ni poleas
  function cargaLigera(Pl) { const m = new Set((Pl && Pl.mats) || []); return m.has('mancuernas') && (Pl.dbMax || 20) <= 20 && !['barra', 'smith', 'maquina', 'polea'].some(x => m.has(x)); }
  function limitedLoad(Pl) {
    const m = new Set(Pl.mats || []);
    if (['barra', 'disco', 'barraz', 'smith', 'maquina', 'polea'].some(x => m.has(x))) return false;
    if (m.has('mancuernas')) return (Pl.dbMax || 20) <= 10;
    if (m.has('kettlebell')) return (Pl.kb || 1) === 1;
    return true;
  }
  function weekEx(st) { const out = []; st.T.forEach(t => t.slots.forEach(h => { if (h.x) out.push({ t, h, L: BY.get(h.x.lib) }); })); return out; }
  // ── v2: elección por escalones (D-05, D-06, D-07) ──
  // Ajustes de escalón (se suman al escalón del menú; gana el menor): molestias, amable, impacto, suelo, preferencias, historial, ancla.
  function tierAdj(L, h, t, st, strict) {
    const { inp, P, ctx } = st, lim = TAGS.lim[L.id] || {}, why = {}; let v = 0;
    for (const z of Object.keys(P.zones)) { if (z === 'otra') continue; if ((lim[z] || 0) === 1) { if (P.zones[z] === 'ahora') { v += 2; why.molestia = z; } else if (P.zones[z] === 'antigua') { v += 0.5; why.molestia = why.molestia || z; } } }
    // v4: si la zona duele ahora, lo «amable» pesa más (−1,5): con la rodilla doliendo, prensa antes que sentadilla con barra (§E.5; OARSI 2019)
    for (const z of Object.keys(P.zones)) { if (TAGS.amable[z] && TAGS.amable[z].has(L.id)) { v -= P.zones[z] === 'ahora' ? 2.5 : 0.5; why.amable = z; break; } }   // v7 (D-03): con la zona doliendo ahora, −2,5 (antes −1,5): lo amable gana a su escalón vecino (hombro: landmine antes que press militar con barra; 05 §7.4)
    if (P.noImpact && lim.impacto === 1) v += 1;
    if (P.noFloor && TAGS.suelo.has(L.id)) v += 5.5;   // «mejor sin suelo»: solo si no queda otra cosa (§E.5); v9 (J-12): +5,5 (antes +4), para que repetir uno «con cuidado» (+1,25 +2) o uno 5 escalones peor gane al suelo
    // v8 (J-04): espalda baja operada o con lesión reciente: sentadillas, zancadas y paseos con peso en las manos, después de la prensa, las
    // máquinas y los unilaterales sin carga
    if (P.lumbarFuera && TAGS.axialManos.has(L.id)) { v += 6; why.axial = 1; }
    // v8 (J-27): posparto: las primeras semanas, dead bug, bird dog o plancha lateral antes que la plancha frontal y la rueda
    if (P.posparto && PLANCHA_FRONTAL.has(L.id)) v += 3;
    // v9 (J-09): «Ganar fuerza» con mancuernas ligeras: la bisagra principal, a una pierna
    if (inp.goal === 'fuerza' && h.prio === 1 && h.id === 'HI' && L.u && cargaLigera(t.P) && LV[P.level] >= LV.I) v -= 1.5;
    // v7 (C-29): en inicio, prudente y 65+, lo que es «evitar» (lim 2) para alguna zona baja 1,5 escalones aunque esa zona no esté marcada
    if (P.cauto && ['rodilla', 'hombro', 'lumbar', 'muneca', 'cadera'].some(z => !P.zones[z] && (lim[z] || 0) === 2)) { v += 1.5; why.evitar = 1; }
    // v7 (C-07): con 65 o más, sin barra libre en el hueco 1 durante los primeros ciclos (máquina, Smith o mancuernas antes)
    if (P.mayor && h.prio === 1 && ['barra', 'barraz'].includes(L.mat)) v += 3;
    // v4: a 65+, la preferencia de estilo no salta el orden de seguridad de su menú (zancada con mancuernas, hip thrust con mancuerna): −0,5
    if ((inp.style === 'maq' && ['maquina', 'polea', 'smith'].includes(L.mat)) || (inp.style === 'libre' && ['barra', 'barraz', 'mancuernas', 'kettlebell', 'disco'].includes(L.mat))) { v -= P.mayor ? 0.5 : 1; why.pref = 1; }
    if (ctx.fav.has(L.id)) { v -= 1; why.fav = 1; }
    const hi = ctx.hist[L.id]; if (hi && hi.n >= 3) { v -= 1; why.hist = 1; }
    if (inp.keep && inp.keep[L.id] && inp.keep[L.id].slot === h.id) { v -= 3; why.ancla = 1; }
    if (!strict && L.dif > st.P.difCap) { v += 1; why.dif2 = 1; }
    return { v, why };
  }
  // Desempate dentro del escalón: variedad, tiempo, estabilidad (cauto), preferencias, prioridad fuera del hueco 1, «estirado» (05 §4.2.5)
  function tieScore(L, h, t, st) {
    const { inp, P, ctx } = st; let s = 0;
    const we = weekEx(st), inDay = we.filter(e => e.t === t && e.h !== h);
    if (inDay.some(e => e.L.pat === L.pat)) s -= 0.8;
    if (we.some(e => e.t !== t && e.L.pat === L.pat && e.L.mat === L.mat)) s -= 0.8;
    if (L.mat === 'maquina' && inDay.some(e => e.L.mat === 'maquina' && TAGS.mfam[e.L.id] === TAGS.mfam[L.id])) s -= 0.5;
    if (inp.min <= 45 && L.u) s -= 0.6; if (inp.min <= 30 && L.mat === 'barra') s -= 0.6;
    if (P.cauto && ['maquina', 'polea', 'smith'].includes(L.mat)) s += 0.5;
    { const lim = TAGS.lim[L.id] || {}; if (Object.keys(P.zones).some(z => z !== 'otra' && (lim[z] || 0) === 1)) s -= 0.5; }   // v4: a igualdad, el que no es «con cuidado»
    if ((inp.style === 'maq' && ['maquina', 'polea', 'smith'].includes(L.mat)) || (inp.style === 'libre' && ['barra', 'barraz', 'mancuernas', 'kettlebell', 'disco'].includes(L.mat))) s += 0.6;
    if (ctx.fav.has(L.id)) s += 0.5;
    const hi = ctx.hist[L.id]; if (hi && hi.recent) s += 0.3;
    if (h.prio > 1 && P.prioG.has(mainGroup(L))) s += 0.5 + (TAGS.long.has(L.id) ? 0.3 : 0); else if (TAGS.long.has(L.id)) s += 0.1;
    return s;
  }
  function pick(cs, h, t, st, strict) {
    for (const c of cs) { c.adj = tierAdj(c.L, h, t, st, strict); c.eff = c.e.tier + c.adj.v + (c.rep ? REP_PEN : 0); c.tie = tieScore(c.L, h, t, st); }
    // v10 (J-12, repaso): con «sin suelo», el suelo solo si de verdad no hay otra opción: si queda un candidato sin suelo que no sea «con
    // cuidado» de una zona que duele ahora, gana aunque sea varios escalones peor o se repita en la semana (antes, +5,5 dejaba el press en el
    // suelo de un avanzado delante del press con banda repetido, con la nota «no había otra opción», que era falsa)
    if (st.P.noFloor && cs.some(c => !TAGS.suelo.has(c.L.id) && !ahoraCuidado(st.P, c.L.id))) cs.forEach(c => { if (TAGS.suelo.has(c.L.id)) c.eff += 100; });
    // v14 (P7): un hueco anclado (ctx.fijos: clave del hueco → ejercicio) se queda con su ejercicio si sigue siendo posible
    { const fx = st.ctx.fijos && st.ctx.fijos[h.key]; if (fx) { const c = cs.find(c => c.L.id === fx); if (c) return c; } }
    const mn = Math.min(...cs.map(c => c.eff));
    // v14 (P7): «Otro entreno para este día» (ctx.altDia: índice del día → vez): el sorteo de «Otra propuesta», solo en ese día y con su semilla
    const lot = st.ctx.altDia && st.ctx.altDia[t.n] ? st.ctx.altDia[t.n] : 0, sd = lot ? fnv1a(st.seed + ':d' + t.n + ':' + lot) : st.seed, J = lot ? 0.9 : st.J;
    if (st.ctx.alt || lot) {   // «Otra propuesta»: sorteo dentro de los dos primeros escalones (D-05.4)
      let best = null, bs = -1e9;
      for (const c of cs) { if (c.eff > mn + 1 + 1e-9) continue;
        const s = c.tie - 0.25 * (c.eff - mn) + J * (fnv1a(sd + '|' + h.key + '|' + c.L.id) / 4294967296) - (st.ctx.prev && st.ctx.prev.has(c.L.id) ? 0.5 : 0);
        if (s > bs + 1e-12 || (Math.abs(s - bs) <= 1e-12 && c.L.id < best.L.id)) { best = c; bs = s; } }
      return best;
    }
    let best = null;
    for (const c of cs) { if (c.eff > mn + 1e-9) continue;
      if (!best || c.tie > best.tie + 1e-9 || (Math.abs(c.tie - best.tie) <= 1e-9 && (c.e.pos < best.e.pos || (c.e.pos === best.e.pos && c.L.id < best.L.id)))) best = c; }
    return best;
  }
  function score(L, h, t, st, own, strict) {   // v1 (§E.7), ya no elige: se conserva para depurar y comparar
    const { inp, P, ctx } = st, tm = {};
    const oi = own ? ownIdx(L, h) : -1;
    tm.patron = 3 * (own ? (oi === 0 ? 1 : 0.75) : 0.6);
    tm.musculos = 2 * cos(vec(L.mus, L.id), h.vecT);
    // ISSUE-tipo: literal = «huecos 1-2: multiarticular +1, aislamiento −1,2 · hueco 3: aislamiento +0,5» (castiga el curl femoral en KF2);
    // elegido = según el tipo del hueco, y en el hueco principal (prioridad 1) siempre multiarticular
    if (OPT.tipo === 'literal') tm.tipo = h.prio <= 2 ? (L.c ? 1 : -1.2) : (!L.c ? 0.5 : 0);
    else tm.tipo = (h.tipo === 'multi' || h.prio === 1) ? (L.c ? 1 : -1.2) : h.tipo === 'iso' ? (!L.c ? 0.5 : 0) : 0;
    if (h.id === 'CO') tm.carga = (L.lt === 'r' || L.lt === 't') ? 0.5 : L.lt === 'w' ? (h.prio <= 2 ? 1 : 0.4) : L.lt === 'd' ? 0.4 : 0;
    else if (h.prio <= 2) tm.carga = { w: 1, bw: 0.6, d: 0.4 }[L.lt] || 0; else tm.carga = L.lt === 'w' ? 0.4 : 0;
    if (AJ && P.inicio && L.mat === 'corporal' && L.lt === 'bw') tm.carga = 0;   // ajustado: en inicio, «admite lastre» no es una ventaja
    if (AJ && P.inicio && INICIO.has(L.id)) tm.inicio = 2.0;                   // ajustado: etiqueta «variante de entrada» (propuesta)
    const lv = P.lvS; tm.dificultad = (lv === 'P0' || lv === 'P') ? (L.dif === 1 ? 0.6 : 0) : lv === 'I' ? (L.dif <= 2 ? 0.4 : 0) : (L.dif >= 2 ? 0.4 : 0.2);
    let est = 0;
    if (P.cauto) { if (['maquina', 'polea', 'smith'].includes(L.mat)) est += 0.5; if (h.prio === 1 && L.mat === 'barra') est -= 0.8; }
    if (P.m75) { if (L.mat === 'maquina') est += 0.5; if (isLegUni(L) && !TAGS.apoyo.has(L.id)) est -= 1.0; }
    tm.estabilidad = est;
    const down = LIB_DOWN[L.id] || (AJ ? EXTRA_DOWN[L.id] : null);   // ajustado: simula enlazar en el catálogo variantes sueltas (flexiones abiertas…)
    if (P.cauto && L.mat === 'corporal' && down) { const D = BY.get(down); if (D && canDo(D, t, st, true)) tm.escalon = AJ ? -2.5 : -1.0; }
    if (TAGS.basic.has(L.id) && h.prio === 1 && !(AJ && oi !== 0)) tm.basico = inp.goal === 'fuerza' ? 2.0 : 1.2;   // ajustado: solo con el patrón principal del hueco
    if (inp.goal === 'fuerza' && LV[P.level] >= LV.I && h.prio === 1) { let x = 0; if ((LIFT[t.rb] || []).includes(h.id) && LIFT_ID[h.id] === L.id) x += 3.0; if (!heavyOk(L)) x -= 1.0; tm.levantamiento = x; }
    const hi = ctx.hist[L.id]; if (hi && hi.n >= 3) tm.historial = 0.8 + (h.prio === 1 ? 0.7 : 0) + (hi.recent ? 0.3 : 0);
    if (inp.keep && inp.keep[L.id] && inp.keep[L.id].slot === h.id) tm.ancla = 3.0;
    const mg = mainGroup(L); if (mg && P.prioG.has(mg) && !(AJ && h.prio === 1)) tm.prioridad = 0.5 + (TAGS.long.has(L.id) ? 0.3 : 0);
    if (inp.style === 'maq' && ['maquina', 'polea', 'smith'].includes(L.mat)) tm.preferencia = 0.6;
    if (inp.style === 'libre' && ['barra', 'barraz', 'mancuernas', 'kettlebell', 'disco'].includes(L.mat)) tm.preferencia = (tm.preferencia || 0) + 0.6;
    if (ctx.fav.has(L.id)) tm.preferencia = (tm.preferencia || 0) + 0.5;
    const lim = TAGS.lim[L.id] || {};
    for (const z of Object.keys(P.zones)) { if (TAGS.amable[z] && TAGS.amable[z].has(L.id)) { tm.amable = 0.6; break; } }
    let mol = 0; for (const z of Object.keys(P.zones)) { if ((lim[z] || 0) === 1) { if (P.zones[z] === 'ahora') mol -= 2.0; else if (P.zones[z] === 'antigua') mol -= 0.5; } }
    if (P.noImpact && lim.impacto === 1) mol -= 1.0; if (P.noFloor && TAGS.suelo.has(L.id)) mol -= 1.5; if (mol) tm.molestia = mol;
    let va = 0; const we = weekEx(st);
    const inDay = we.filter(e => e.t === t);
    if (inDay.some(e => e.L.pat === L.pat)) va -= 0.8;
    if (we.some(e => e.t !== t && e.L.pat === L.pat && e.L.mat === L.mat)) va -= 0.8;
    if (L.mat === 'maquina' && inDay.some(e => e.L.mat === 'maquina' && TAGS.mfam[e.L.id] === TAGS.mfam[L.id])) va -= 0.5;
    const an = angle(L); if (an && we.some(e => angle(e.L) === an)) va -= 1.0;
    if (h.id === 'PI' && an === 'inc') va += 1.0;
    if (AJ && h.id === 'PH' && an === 'flat') va += 1.0;   // ajustado: el hueco PH pide plano igual que PI pide inclinado
    if (va) tm.variedad = va;
    let ti = 0; if (inp.min <= 45 && L.u) ti -= 0.6; if (inp.min <= 30 && L.mat === 'barra') ti -= 0.6; if (ti) tm.tiempo = ti;
    if (h.leg && L.u && limitedLoad(t.P) && (!AJ || (L.c && !P.inicio && !P.mayor))) tm.cargaLimitada = 1.2;   // ajustado: solo multiarticulares y no en inicio ni 65+
    if (ctx.prev && ctx.prev.has(L.id)) tm.otra = -0.3;
    if (!strict && L.dif === 2 && L.dif > P.difCap) tm.dif2 = -1.5;
    tm.jitter = st.J * (fnv1a(st.seed + '|' + h.key + '|' + L.id) / 4294967296);
    let s = 0; for (const k in tm) s += tm[k];
    return { s, tm };
  }
  // v2: candidatos = los del menú del hueco que pasan los filtros duros (material, seguridad, dificultad), cargan el músculo del hueco,
  // son multiarticulares en huecos multiarticulares y no repiten patrón (≤ 2 por día, core aparte) ni familia de máquina (≤ 2 por día).
  function cands(h, t, st, strict) {
    const out = [], day = act(t).filter(k => k !== h), pc = {}, fc = {};
    day.forEach(k => { const D = BY.get(k.x.lib); pc[D.pat] = (pc[D.pat] || 0) + 1; const f = TAGS.mfam[D.id]; if (f) fc[f] = (fc[f] || 0) + 1; });
    // v7 (D-03): con «Ganar fuerza» y la zona del levantamiento doliendo ahora, ese hueco usa el menú de hipertrofia (prensa o máquina antes
    // que la barra pesada; 05 §7.4: «flexión profunda cargada si duele» → prensa y rango sin dolor)
    const cls = st.cls === 'F' && h.prio === 1 && LIFT_ID[h.id] && ahoraCuidado(st.P, LIFT_ID[h.id]) ? 'IA' : st.cls;
    // v8 (J-12, J-22): dónde está ya cada ejercicio (días con el ejercicio activo, sin contar este hueco)
    const donde = new Map(); st.T.forEach(o => o.slots.forEach(k => { if (k !== h && k.on && k.x) { if (!donde.has(k.x.lib)) donde.set(k.x.lib, new Set()); donde.get(k.x.lib).add(o); } }));
    for (const e of menuOf(h, cls)) {
      const L = BY.get(e.id);
      if (!L || L.lt === 'c') continue;
      const dd = donde.get(L.id);
      if (dd && dd.has(t)) continue;                    // nunca dos veces el mismo ejercicio en un día
      const repe = !!dd && OPT.repetir !== false;      // ya está otro día de la semana: se puede repetir con penalización
      if (!repe && (dd || st.used.has(L.id))) continue;
      if (h.uni && !(L.u && ['lunge', 'squat'].includes(L.pat))) continue;   // 65+: unilateral de pierna (con apoyo)
      // v7 (I-11): con «sin suelo», un ejercicio de suelo solo en un hueco 1, en el core o el hombro posterior (protegidos) o en el unilateral
      // obligatorio, y con su aviso; en un secundario o un accesorio, mejor el hueco vacío (a partir de los 55-65, bajar al suelo es la barrera)
      if (st.P.noFloor && TAGS.suelo.has(L.id) && h.prio >= 2 && !h.prot && !h.obl && !h.fijo && !['CO', 'RE'].includes(h.id)) continue;
      if ((SLOT[h.id].tipo === 'multi' || h.prio === 1) && !L.c) continue;     // aislamientos nunca en un hueco multiarticular ni como principal
      if (!musOk(L, h.id)) continue;                                          // D-04: músculo objetivo
      if ((h.xbr || h.garUp) && !['curl', 'tri'].includes(L.pat)) continue;                // v14 (P3): el extra de brazos es un aislamiento (unos fondos son otro empuje y descuadran tirón:empuje)
      if (!CORE_PATS.includes(L.pat) && (pc[L.pat] || 0) >= 2) continue;     // como mucho 2 del mismo patrón en el día
      // v7: en cuerpo completo, un hueco de reserva o un accesorio no repite un patrón que ya está en el día (dos hip thrust o dos elevaciones
      // laterales en un CC: mejor una serie más del que ya está; medida patron_x2_cc del diagnóstico, objetivo ≤ 2 %)
      if (['CCA', 'CCB', 'CCC'].includes(t.rb) && (h.reserva || h.prio === 3) && !CORE_PATS.includes(L.pat) && (pc[L.pat] || 0) >= 1) continue;
      const f = TAGS.mfam[L.id]; if (f && (fc[f] || 0) >= 2) continue;        // ni 3 de la misma familia de máquina
      // v3 (D-13): el remo bajo una mesa, solo como último recurso: en un hueco secundario, no si la semana ya tiene 2 tirones
      if (L.id === 'lib_inverted_row_table' && h.prio >= 2 && weekEx(st).filter(e => e.h.on && ['pull_h', 'pull_v'].includes(e.L.pat)).length >= 2) continue;
      if (!placeCan(L, t.P, t.place) || !safe(L, st) || !difOk(L, st.P, strict)) continue;
      if (st.quickKey === h.key && (L.u || BARM.includes(L.mat) || L.id === 'lib_inverted_row_table' || (st.P.noFloor && TAGS.suelo.has(L.id)))) continue;   // v9 (J-12): el tiempo no justifica bajar al suelo   // v5: exprés que no cabe, solo variantes rápidas (el remo bajo una mesa, nunca: D-13)
      out.push({ L, e, rep: repe });
    }
    return out;
  }
  function fill(h, t, st, peek) {
    for (const strict of [true, false]) {
      const cs = cands(h, t, st, strict);
      if (!cs.length) continue;
      const b = pick(cs, h, t, st, strict), L = b.L;
      if (OPT.debug && OPT.debug(h, t)) { console.log('· hueco', h.key, strict ? 'estricto' : 'dif2', peek ? '(peek)' : ''); cs.slice().sort((x, y) => x.eff - y.eff || y.tie - x.tie || x.e.pos - y.e.pos).slice(0, 6).forEach(c => console.log('    esc', c.eff, 'des', c.tie.toFixed(2), c.L.id, JSON.stringify(c.adj.why))); }
      if (!peek) st.used.add(L.id);
      const tm = {};   // para el «¿por qué?» (§E.15)
      if (b.adj.why.amable) tm.amable = b.adj.why.amable;
      if (h.prio > 1 && st.P.prioG.has(mainGroup(L))) tm.prioridad = 1;
      if (h.prio === 1 && t.lift && t.lift.includes(h.id) && LIFT_ID[h.id] === L.id) tm.levantamiento = 1;
      if (st.P.cauto && ['maquina', 'polea', 'smith'].includes(L.mat) && L.lt === 'w') tm.estabilidad = 1;   // v8 (J-03): no el remo invertido
      const pass = b.e.kind === 'resp' ? 'near' : 'own';
      return { lib: L.id, pass, strict, oi: pass === 'own' ? b.e.sec : -1, tier: b.e.tier, eff: b.eff, tm, s: 2, r: null, notes: [], rep: !!b.rep };
    }
    if (!peek) h.empty = true;
    return null;
  }

  // ════════ E.9 series, repeticiones, descansos ════════
  function restTable(inp, P) {
    const f = { P0: 0.85, P: 0.85, I: 1, A: 1.1 }[P.lvV];
    let [iso, comp, heavy] = REST[inp.goal].map(x => r15(x * f));
    // v9 (J-13): el descanso sale de la carga de cada serie: hasta 6 repeticiones, el de fuerza (heavy); de 7 a 12, el de hipertrofia (con
    // «Ganar fuerza», 2-3 min son para 3-6 repeticiones, 05 §3.2: antes, 2:45-3:00 para series de 10-12 en modo prudente)
    if (inp.goal === 'fuerza') comp = r15(REST.musculo[1] * f);
    const ag = inp.goal === 'aguante';
    const fl = { iso: ag ? 45 : 60, comp: ag ? 60 : 90, heavy: 120 };
    iso = Math.max(fl.iso, iso); comp = Math.max(fl.comp, comp); heavy = Math.max(fl.heavy, heavy);
    // v5 (D-21, C-25): reglas explícitas. El +15 s de prudente y 65+ forma parte de su suelo (seguridad: no se recorta para que quepa);
    // exprés (15 min) y modo corto (C-17): suelo de 75 s en multiarticulares (90 s con prudente o 65+), la excepción declarada de §E.11
    const short = inp.min === 15 || P.corto;
    if (short) { fl.comp = Math.min(fl.comp, 75); fl.heavy = Math.min(fl.heavy, 75); }   // (en «Aguantar más» el suelo ya es 60)
    // (v9, J-13: con prudente o 65+, el +15 s sin pasar de 2:15 en las series de 7-12: 2:30 o más es descanso de fuerza)
    if (P.prud || P.mayor) { comp = Math.min(comp, 120) + 15; heavy += 15; fl.comp = Math.min(fl.comp, 120) + 15; fl.heavy += 15; }
    // v9 (J-13): peso corporal sin lastre, bandas, TRX y paseos: 75-90 s (60 en «Aguantar más»), +15 con prudente o 65+
    let bw = ag ? Math.max(60, iso) : Math.min(90, Math.max(75, iso)); if (P.prud || P.mayor) bw += 15;
    return { iso, comp, heavy, bw, floor: fl, base: { iso, comp, heavy } };
  }
  function roleOf(L, h, t, inp) {
    if (L.lt !== 'c' && (PEQ_PATS.includes(L.pat) || ['abdomen', 'gemelos'].includes(mainGroup(L)))) return h.prio === 1 && !PEQ_PATS.includes(L.pat) ? 'principal' : 'peq';
    if (h.prio === 1) return (t.light && !t.lift.includes(h.id)) ? 'secundario' : 'principal';
    return L.c ? 'secundario' : 'aislamiento';
  }
  function setPres(st, t, h) {
    const { inp, P } = st, L = BY.get(h.x.lib), x = h.x, notes = [];
    const role = roleOf(L, h, t, inp); x.role = role; x.principal = h.prio === 1;
    const lvk = LV[P.lvV] <= 1 ? 'P' : P.lvV;
    const row = P.cauto ? REPS_CAUTO : REPS[inp.goal][lvk];
    let r = row[{ principal: 0, secundario: 1, aislamiento: 2, peq: 3 }[role]];
    if (L.lt === 't') { r = (P.cauto ? 20 : { P0: 30, P: 30, I: 40, A: 45 }[P.level]) + 's'; }
    else if (L.lt === 'd') { r = L.r; }
    else if (['banda', 'minibanda', 'trx'].includes(L.mat)) { r = typeof L.r === 'number' ? L.r : r; }
    // v8 (J-03): los excéntricos (negativas, nórdico, pistol) con las repeticiones del catálogo (3-5 lentas), no subidos a 8
    else if (TAGS.excentrico.has(L.id)) { r = typeof L.r === 'number' ? L.r : 5; notes.push(L.pat === 'squat' ? 'Controla la bajada.' : 'Baja en 3-5 segundos; empieza con pocas.'); }
    else if (L.lt === 'bw' || L.lt === 'r') { r = Math.max(8, Math.min(typeof L.r === 'number' ? L.r : r, r)); }
    else {
      if (r <= 6 && !heavyOk(L)) { r = 8; notes.push('sin rango pesado'); }   // ISSUE-pesado: «rango de secundario» no basta en avanzado (6)
      // v9 (J-09, J-24): con mancuernas o kettlebell de 20 kg o menos, a intermedios y avanzados, suelo de repeticiones por patrón para que
      // cada serie cueste (con 20 kg un intermedio hace 15-20 goblets: a 6-8 no llega al esfuerzo pedido ni el Coach puede subir un peso que
      // no existe): pierna y bisagra con las dos piernas, 12-15; a una pierna, 8-10; remos, 10-12; presses, 8-10. A principiantes, no:
      // 10 kg no son ligeros para ellos (antes, +2 a todos con la nota «Con mancuernas ligeras, más repeticiones»)
      const db = t.P && (t.P.dbMax || 20);
      if (['mancuernas', 'kettlebell'].includes(L.mat) && db <= 20 && LV[P.level] >= LV.I && !P.cauto) {
        const fl = ['squat', 'hinge', 'hip_ext'].includes(L.pat) && !L.u ? 15 : ['squat', 'lunge', 'hinge', 'hip_ext'].includes(L.pat) ? 10 : L.pat === 'pull_h' ? 12 : ['push_h', 'push_v'].includes(L.pat) ? 10 : 0;
        if (fl && r < fl) { r = fl; x.ligera = 1; st.cargaLigera = Math.max(st.cargaLigera || 0, db); }
      }
    }
    // v9 (J-11): 16-17 con experiencia, nunca rango de 6 o menos (6-8 como mucho)
    if (P.menor && typeof r === 'number' && r < 8 && h.id !== 'PW') { r = 8; notes.push('sin rango pesado'); }
    // v7 (D-03): con la zona doliendo ahora, sus ejercicios «con cuidado» nunca en rango pesado: como poco 6-8 (el de secundario de fuerza)
    const ahoraEj = typeof r === 'number' && L.lt === 'w' && ahoraCuidado(P, L.id);
    // v8 (J-02, J-05): 8-12 como poco (antes 6-8): con la zona doliendo, ni rango pesado ni casi pesado
    if (ahoraEj && r < 10) { r = 10; notes.push('sin rango pesado'); }
    // v8 (J-02): con el hombro doliendo, TODOS los empujes a 8-12 como poco (el press de pecho a 4-6 también carga el hombro)
    const hombroEmp = P.hombroAhora && ['push_h', 'push_v', 'fly'].includes(L.pat);
    if (hombroEmp && typeof r === 'number' && r < 10) { r = 10; notes.push('sin rango pesado'); }
    // v8 (J-04): espalda operada o reciente: el press de hombros con peso libre, sentado con respaldo y a 8 o más
    if (P.lumbarFuera && L.pat === 'push_v' && ['mancuernas', 'kettlebell', 'barra'].includes(L.mat)) { if (typeof r === 'number' && r < 10) r = 10; notes.push('Sentado y con la espalda apoyada en el respaldo.'); }
    x.r = r;
    // v5 (D-15, C-08): máximos de §E.9, con 65 o más a 2 en el primer ciclo (como inicio; luego el Coach propone 3, §G.5);
    // series iniciales por papel y nivel: intermedio o avanzado sin precaución y con 45 min o más → principal 3 (avanzado con 60 min o
    // más, 4), secundario multiarticular 3, aislamientos y pequeños 2; el resto (inicio, 65+, prudente, principiante, 30 min o menos), 2
    // v7 (C-07): 65+ con experiencia, hasta 3 en el principal desde el primer día (05 §11: mayores I/A 2-3 por ejercicio; NSCA 2019); el resto, 2
    x.max = P.inicio || (P.mayor && !P.mayorExp) ? 2 : P.mayorExp ? (x.principal ? 3 : 2) : LV[P.level] <= LV.P ? 3 : P.level === 'I' ? (x.principal ? 4 : 3) : (x.principal ? 5 : 4);
    if (ahoraCuidado(P, L.id) || hombroEmp) x.max = Math.min(x.max, 3);   // v7 (D-03): y como mucho 3 series (también sin kilos: dominadas asistidas, flexiones…)
    if (TAGS.excentrico.has(L.id)) x.max = 2;   // v8 (J-03): 2 series de 3-5 (el nórdico de los estudios empieza así: Mjølsnes 2004)
    x.max = Math.min(x.max, 4);   // v9 (J-23): 4 series por ejercicio y sesión como mucho (05 §1.2: 2-4; más rara vez compensa); la 5.ª, a otro ejercicio
    // v9 (J-21): dominadas libres a 8-12 sin saber si las hace: la salida está en la nota (y el Coach puede cambiarlas por asistidas)
    if (['lib_pullup', 'lib_chinup', 'lib_pullup_neutral'].includes(L.id)) notes.push('Si no llegas a 8, hazlas asistidas (máquina o banda) o solo la bajada, lenta.');
    const IAok = LV[P.level] >= LV.I && !P.cauto && inp.min >= 45;
    x.s = !IAok ? 2 : role === 'principal' ? (P.level === 'A' && inp.min >= 60 ? 4 : 3) : role === 'secundario' ? (inp.min >= 60 ? 3 : 2) : 2;
    x.s = Math.min(x.s, x.max); x.s0 = x.s;
    // v2 (D-14): potencia = 2-3 series de 3-6 repeticiones rápidas con descanso largo (05 §3.2); no cuenta como volumen de hipertrofia
    if (h.id === 'PW') { x.role = 'potencia'; x.r = 3; x.max = 3; x.s = 2; notes.length = 0; notes.push('Cada repetición, lo más rápida posible; para antes de que se frene.'); }
    // notas de seguridad y de la propuesta
    const lim = TAGS.lim[L.id] || {};
    const cz = Object.keys(P.zones).filter(z => z !== 'otra' && (lim[z] || 0) === 1 && ['ahora', 'antigua'].includes(P.zones[z]));
    if (cz.length) { x.cuidado = cz; notes.push('Con cuidado (' + cz.map(zLbl).join(', ') + '): rango cómodo y sin dolor; baja solo hasta donde no moleste.'); }
    if (L.id === 'lib_inverted_row_table') notes.push('Usa una mesa firme y estable.');
    // v8 (J-06): muñeca que duele ahora: flexiones sobre los puños o con agarres (05 §7.4: evitar la palma plana con la muñeca en extensión)
    if (P.munecaAhora && L.pat === 'push_h' && L.mat === 'corporal') notes.push('Hazlas sobre los puños, con agarres o sobre dos mancuernas, con la muñeca recta.');
    // v8 (J-05): rodilla que duele ahora: la sentadilla, a un cajón y en el rango sin dolor
    if (P.rodillaAhora && L.pat === 'squat' && !['maquina', 'smith'].includes(L.mat) && L.lt !== 't') notes.push('Baja hasta un cajón o un banco, solo en el rango sin dolor.');
    // v8 (J-25): prensa con la espalda baja marcada: rango corto
    if (P.lumbarZ && ['lib_leg_press', 'lib_leg_press_single', 'lib_calf_leg_press'].includes(L.id)) notes.push('Baja solo hasta donde la pelvis no se despegue del respaldo.');
    if (h.obl && P.segM && ['corporal', 'step', 'banda'].includes(L.mat)) notes.push('Apóyate en una pared o una silla.');
    if (h.id === 'EX') notes.push('Sin redondear la espalda y en un rango corto.');   // v8 (J-07)   // (en prensa, Smith o TRX ya hay apoyo)
    if (P.cauto && L.mat === 'corporal' && L.up && BY.get(L.up) && canDo(BY.get(L.up), t, st, true)) notes.push('Cuando te salga fácil, el Coach te sube a la variante siguiente.');
    if ((P.prud || P.mayor) && L.c && L.lt === 'w' && x.principal) notes.push('Respira durante el esfuerzo: no aguantes el aire.');
    if (L.mat === 'barra' && L.c && x.principal) notes.push('Nunca al límite en la barra.');
    if (P.noFloor && TAGS.suelo.has(L.id)) { notes.push('Pide tumbarse: no había otra opción en este hueco.'); st.warn.push({ c: 'suelo', p: { id: L.id } }); }
    x.notes = notes;
  }
  function prescribe(st) { st.T.forEach(t => t.slots.forEach(h => { if (h.x) setPres(st, t, h); })); }
  function repRange(L, r) {
    if (typeof r !== 'number') return null;
    if (TAGS.excentrico.has(L.id)) return { lo: Math.max(1, r - 2), hi: r };   // v8 (J-03): 3-5 (pistol 4-6)
    // v9 (J-20): solo los rangos de 05 §3.2 (3-5, 4-6, 6-8, 8-10, 8-12, 10-12, 12-15, 15-20); antes salían 8-11, 10-13, 12-14, 17-20 o 5-7
    if (L.lt === 'bw' || L.lt === 'r') return r <= 5 ? { lo: 3, hi: 5 } : r <= 10 ? { lo: 8, hi: 12 } : r <= 15 ? { lo: 12, hi: 15 } : { lo: 15, hi: 20 };   // (3-5: potencia, saltos de 3 rápidos)
    if (!L.c) return r <= 10 ? { lo: 10, hi: 12 } : r <= 15 ? { lo: 12, hi: 15 } : { lo: 15, hi: 20 };
    return r <= 5 ? { lo: 3, hi: 5 } : r <= 6 ? { lo: 4, hi: 6 } : r <= 8 ? { lo: 6, hi: 8 } : r <= 10 ? { lo: 8, hi: 10 } : r <= 12 ? { lo: 10, hi: 12 } : r <= 15 ? { lo: 12, hi: 15 } : { lo: 15, hi: 20 };
  }
  // floor = el suelo de cada tipo (para el presupuesto de tiempo previo, v5)
  function restOf(L, x, st, floor) {
    const R = floor ? st.rest.floor : st.rest; if (L.lt === 'c') return 0;
    if (x.role === 'potencia') return R.heavy;
    if (!L.c) return R.iso;
    // v9 (J-13): peso corporal, bandas, TRX y paseos (y las dominadas o fondos de quien empieza, o a una pierna): 75-90 s
    if (['r', 't', 'd'].includes(L.lt) || ['banda', 'minibanda', 'trx'].includes(L.mat) || L.pat === 'carry' || (L.lt === 'bw' && (L.u || st.P.cauto || LV[st.P.level] <= LV.P))) return st.rest.bw;
    const rr = repRange(L, x.r); return rr && rr.hi <= 6 ? R.heavy : R.comp;
  }

  // ════════ volumen ════════
  // v5 (paso 3, D-16): cuenta fraccional por patrón (05 §1.1) y por grupo de planificación (deltoides por cabezas): K.volV
  function volume(st) {
    const v = {}, dir = {}; PG.forEach(g => { v[g] = 0; dir[g] = 0; });
    st.T.forEach(t => act(t).forEach(h => { if (h.id === 'PW') return; const o = K.volV(BY.get(h.x.lib)); for (const g in o) { v[g] += h.x.s * t.f * o[g]; if (o[g] === 1) dir[g] += h.x.s * t.f; } }));
    return { v, dir };
  }
  const sessVol = (t, g) => act(t).reduce((a, h) => a + (h.id === 'PW' ? 0 : h.x.s * fracV(BY.get(h.x.lib), g)), 0);
  function deficit(st, g) { if (!st.tgt.t[g]) return false; const d = st.tgt.t[g] - volume(st).v[g]; const small = PSMALL.includes(g) && !st.P.prioV.has(g); if (small && st.tgt.t[g] < 2) return false; return small ? d > 1.5 : d > 0.75; }
  // v5 (C-04): ¿se puede añadir n series a este ejercicio sin pasar el techo semanal (V8) ni el tope de 10 por grupo y sesión (V9)?
  function canAddSet(st, t, h, n, vol) {
    n = n || 1; vol = vol || volume(st); const o = K.volV(BY.get(h.x.lib));
    for (const g in o) { if (vol.v[g] + n * t.f * o[g] > st.tgt.ceil[g] + 1e-9) return false; if (sessVol(t, g) + n * o[g] > 10 + 1e-9) return false; }
    return true;
  }
  const canAddEx = (st, t, L, n, vol) => { vol = vol || volume(st); const o = K.volV(L); for (const g in o) { if (vol.v[g] + n * t.f * o[g] > st.tgt.ceil[g] + 1e-9) return false; if (sessVol(t, g) + n * o[g] > 10 + 1e-9) return false; } return true; };
  function pushPull(st) {
    let pu = 0, ps = 0, kn = 0, hp = 0, rear = 0;
    st.T.forEach(t => act(t).forEach(h => { const L = BY.get(h.x.lib), s = h.x.s * t.f;
      if (['pull_h', 'pull_v', 'rear'].includes(L.pat)) pu += s; if (['push_h', 'push_v', 'fly'].includes(L.pat)) ps += s;
      if (['squat', 'lunge', 'knee_ext'].includes(L.pat)) kn += s; if (['hinge', 'hip_ext', 'knee_flex'].includes(L.pat)) hp += s;
      if (L.pat === 'rear') rear += s; }));
    return { pu, ps, kn, hp, rear, ratio: ps ? pu / ps : 9, rh: hp ? kn / hp : 9 };
  }
  const zoneOk = (t, g) => { const z = ZONA_TPL[t.rb]; return !z || z.includes(g) || (HO.includes(g) && z.includes('hombros')); };

  // ════════ E.10 reparto y equilibrio del volumen ════════
  // v5 (paso 3): grupos de planificación (deltoides por cabezas) y cuenta por patrón; cada serie que se añade respeta el techo semanal (V8)
  // y el tope de 10 por grupo y sesión (V9) de todos los grupos que carga el ejercicio (C-04); freno por encima de lo alto del rango (C-03)
  const ROLE_RANK = { principal: 0, secundario: 1, aislamiento: 2, peq: 2, potencia: 9 };
  // v5 (D-17): ¿cabe el día en los minutos pedidos? (el cardio final solo cuenta con «Perder grasa», que lo defiende; si no, se recorta antes)
  const fitsDay = (t, st) => dayMinutes(t, st, false, { noCardio: st.inp.goal !== 'grasa' }) <= st.inp.min + 1e-9;
  const isPush = L => ['push_h', 'push_v', 'fly'].includes(L.pat), isPull = L => ['pull_h', 'pull_v', 'rear'].includes(L.pat);
  function balanceVolume(st) {
    const { T, tgt, P, inp } = st, exh = {}, teTry = {};
    const cap = capOf(P, inp.min, inp.sesion), nov = novato(P);
    // v3: un empuje nuevo solo si tirón:empuje sigue ≥ 1 después (contando que entra con 2 series); v5: también al subir una serie
    const pushOk = (L, n, t) => { if (!isPush(L)) return true; const pp = pushPull(st); return pp.pu + 1e-9 >= pp.ps + n * (t ? t.f : st.f); };
    // v2 (D-08): principiantes y cautos, como mucho 2 ejercicios distintos por grupo y semana al añadir (05 §4.2: 1-2)
    const roomG = (L, t) => (!nov || groupN(st, subGroup(L)) < 2) && pushOk(L, 2, t);
    for (let it = 0; it < 160; it++) {
      const vol = volume(st), { v } = vol;
      let g = null, gd = 0;
      for (const gg of PG) {
        if (exh[gg] || !tgt.t[gg]) continue; const d = tgt.t[gg] - v[gg]; if (d <= 0.75) continue;
        if (PSMALL.includes(gg) && tgt.t[gg] < 2) continue;
        if (d > gd + 1e-9) { gd = d; g = gg; }
      }
      if (!g) break;
      const small = PSMALL.includes(g) && !P.prioV.has(g);
      // a. encender un hueco 2-3 apagado cuyo ejercicio tiene g como grupo principal (v5: que quepa en el día, D-17)
      const stepA = () => {
        if (gd <= 1.5) return false;
        const pks = [];
        T.forEach(t => { if (nStr(t) >= cap) return; t.slots.forEach(h => { if (h.on || h.prio === 1 || h.cap) return;
          if (h.x && !h.on) { const L = BY.get(h.x.lib); if (mgV(L) === g && roomG(L, t) && canAddEx(st, t, L, 2, vol)) pks.push({ t, h }); return; }
          if (h.empty) return; const x = fill(h, t, st, true); if (!x) return; const L = BY.get(x.lib); if (mgV(L) === g && roomG(L, t) && canAddEx(st, t, L, 2, vol)) pks.push({ t, h }); }); });
        pks.sort((a, b) => nStr(a.t) - nStr(b.t) || a.t.n - b.t.n);
        for (const { t, h } of pks) {
          const had = !!h.x; if (!h.x) h.x = fill(h, t, st); else st.used.add(h.x.lib); h.on = true; setPres(st, t, h); h.x.s = 2;
          if (fitsDay(t, st)) { st.log.push('a:' + g + ':' + h.key); return true; }
          h.on = false; st.used.delete(h.x.lib); if (!had) h.x = null;
        }
        return false;
      };
      // b. +1 serie al ejercicio de grupo principal g con más peso en g y menos series (a igualdad, el de papel más principal); v5: que quepa
      const stepB = () => {
        const bs = [];
        T.forEach(t => act(t).forEach(h => { const L = BY.get(h.x.lib); if (h.id === 'PW' || mgV(L) !== g || h.x.s >= h.x.max || h.x.s >= 6) return; if (!canAddSet(st, t, h, 1, vol) || !pushOk(L, 1, t)) return; bs.push({ t, h, w: fracV(L, g), r: ROLE_RANK[h.x.role] || 0 }); }));
        bs.sort((a, b) => b.w - a.w || a.h.x.s - b.h.x.s || a.r - b.r || a.t.n - b.t.n);
        for (const b of bs) { b.h.x.s++; if (fitsDay(b.t, st)) { st.log.push('b:' + g); return true; } b.h.x.s--; }
        return false;
      };
      // c. hueco de reserva en una plantilla que ya trabaja esa zona y no ha llegado al tope de ejercicios (v5: que quepa)
      const stepC = () => {
        if (small && !(['gemelos', 'abdomen'].includes(g) && !nov && gd > 1.5)) return false;   // v5: gemelos y core no reciben trabajo indirecto
        const ts = T.filter(t => nStr(t) < cap && zoneOk(t, g)).sort((a, b) => nStr(a) - nStr(b) || a.n - b.n);
        // v8: un hueco de reserva no repite un hueco que ya está en el día (dos press inclinados: mejor plano o aperturas)
        for (const t of ts) { for (const sid of (RESERVA[g] || [])) { if (act(t).some(k => k.id === sid)) continue; const h = mkSlot(sid, 3, null, t.role + '#' + t.n + ':' + sid + ':r' + t.slots.length); h.reserva = 1; const x = fill(h, t, st, true);
          if (x && mgV(BY.get(x.lib)) === g && roomG(BY.get(x.lib), t) && canAddEx(st, t, BY.get(x.lib), 2, vol)) { h.x = fill(h, t, st); h.on = true; t.slots.push(h); setPres(st, t, h); h.x.s = 2;
            if (fitsDay(t, st)) { st.log.push('c:' + g); return true; }
            t.slots.pop(); st.used.delete(h.x.lib); } } }
        return false;
      };
      // v5: si un grupo de empuje no puede crecer porque dejaría tirón:empuje < 1, primero se hace sitio con una serie (o un hueco) de tirón
      // (antes se daba el grupo por agotado y no se volvía a mirar aunque luego entraran tirones: pecho 4 de 13,75 en el perfil 292)
      const pullRoom = () => {
        const pr = []; T.forEach(t => act(t).forEach(h => { const L = BY.get(h.x.lib); if (isPull(L) && h.x.s < h.x.max && h.x.s < 6 && canAddSet(st, t, h, 1, vol)) pr.push({ t, h }); }));
        pr.sort((a, b) => a.h.x.s - b.h.x.s || a.t.n - b.t.n);
        for (const { t, h } of pr) { h.x.s++; if (fitsDay(t, st)) { st.log.push('tiron_sitio:' + g); return true; } h.x.s--; }
        for (const t of T) { if (nStr(t) >= cap) continue; for (const h of t.slots) { if (h.on || h.cap || h.empty || h.prio === 1 || !['TV', 'TH', 'RE'].includes(h.id)) continue;
          const had = !!h.x; const x = h.x || fill(h, t, st, true); if (!x || !canAddEx(st, t, BY.get(x.lib), 2, vol)) continue;
          if (!had) h.x = fill(h, t, st); else st.used.add(h.x.lib); h.on = true; setPres(st, t, h); h.x.s = 2;
          if (fitsDay(t, st)) { st.log.push('tiron_hueco:' + g); return true; }
          h.on = false; st.used.delete(h.x.lib); if (!had) h.x = null; } }
        return false;
      };
      if (nov ? (stepB() || stepA() || stepC()) : (stepA() || stepB() || stepC())) continue;
      if (['pecho', 'hombro_ant'].includes(g) && (teTry[g] = (teTry[g] || 0) + 1) <= 6 && pullRoom()) continue;
      // d. aviso con el motivo (v5, D-20: en los pequeños, solo con un déficit de más de 1,5: es la regla, no un fallo)
      const anyCand = K.C.some(L => L.lt !== 'c' && mgV(L) === g && !st.used.has(L.id) && T.some(t => canDo(L, t, st, false)));
      exh[g] = anyCand ? 'dias' : 'material';
      if (!small || gd > 1.5) st.warn.push({ c: 'vol_corto', p: { g, motivo: exh[g], v: Math.round(v[g] * 10) / 10, obj: Math.round(tgt.t[g] * 10) / 10 } });
    }
    // 2b. freno (C-03)
    brake(st);
    // 3. techo semanal (V8) y tope por sesión (V9), en series fraccionales y por cabezas
    enforceCaps(st);
    // 4. tirón:empuje ≥ 1
    for (let k = 0; k < 30; k++) {
      const pp = pushPull(st); if (pp.ratio >= 1 - 1e-9) break;
      let moved = false; const vol = volume(st);
      const c = []; T.forEach(t => act(t).forEach(h => { const L = BY.get(h.x.lib); if (isPull(L) && h.x.s < h.x.max && h.x.s < 6 && canAddSet(st, t, h, 1, vol)) c.push({ t, h }); }));
      c.sort((a, b) => a.h.x.s - b.h.x.s); for (const { t, h } of c) { h.x.s++; if (fitsDay(t, st)) { moved = true; st.log.push('tiron+'); break; } h.x.s--; }
      if (!moved) { const c2 = []; T.forEach(t => act(t).forEach(h => { const L = BY.get(h.x.lib); if (isPush(L) && h.prio !== 1 && h.x.s > 2) c2.push(h); }));
        if (c2.length) { c2.sort((a, b) => b.x.s - a.x.s); c2[0].x.s--; moved = true; st.log.push('empuje-'); } }
      if (!moved) break;
    }
    // 5. rodilla:cadera entre 0,6 y 1,6
    for (let k = 0; k < 20; k++) {
      const pp = pushPull(st); if (pp.rh >= 0.6 && pp.rh <= 1.6) break;
      const side = pp.rh < 0.6 ? ['squat', 'lunge', 'knee_ext'] : ['knee_flex', 'hip_ext', 'hinge'];
      // v5: la serie que se añade no puede pasar de lo alto del rango su grupo principal; si no hay, −1 serie (mín. 2, no hueco 1) al lado largo
      const vol = volume(st), c = []; T.forEach(t => act(t).forEach(h => { const L = BY.get(h.x.lib); const i = side.indexOf(L.pat), g2 = mgV(L); if (i >= 0 && h.x.s < h.x.max && h.x.s < 6 && canAddSet(st, t, h, 1, vol) && (!tgt.top[g2] || vol.v[g2] + t.f <= tgt.top[g2] + 1e-9)) c.push({ t, h, i }); }));
      c.sort((a, b) => a.i - b.i || a.h.x.s - b.h.x.s); let ok5 = false; for (const { t, h } of c) { h.x.s++; if (fitsDay(t, st)) { ok5 = true; st.log.push('rc'); break; } h.x.s--; }
      if (!ok5) { const long = pp.rh < 0.6 ? ['knee_flex', 'hip_ext', 'hinge'] : ['squat', 'lunge', 'knee_ext']; const d = []; T.forEach(t => act(t).forEach(h => { const L = BY.get(h.x.lib); if (long.includes(L.pat) && h.prio !== 1 && h.x.s > 2) d.push(h); }));
        if (d.length) { d.sort((a, b) => b.x.s - a.x.s); d[0].x.s--; ok5 = true; st.log.push('rc-'); } }
      if (!ok5) break;
    }
    // 6. protegidos: core ≥ 2 directas/semana · hombro posterior ≥ 2/semana con 6+ de empuje
    protect(st, 'abdomen', 'CO', () => volume(st).dir.abdomen >= 2);
    if (pushPull(st).ps >= 6) protect(st, 'hombro_post', 'RE', () => pushPull(st).rear >= 2);
    // 7. gemelas con ≤ 10 min de diferencia
    for (const [a, b] of TWINS) {
      for (let k = 0; k < 6; k++) {
        const ta = T.find(t => t.rb === a), tb = T.find(t => t.rb === b); if (!ta || !tb) break;
        const ma = strMin(ta, st), mb = strMin(tb, st); if (Math.abs(ma - mb) <= 10) break;
        const [lo, hi] = ma > mb ? [tb, ta] : [ta, tb];
        // v5: un hueco 1 no baja de su arranque (en David, el remo con barra pasaba a 2 series para igualar minutos) y la serie que se mueve
        // no puede pasar el tope por sesión de ningún grupo del ejercicio que la recibe
        const c = act(hi).filter(h => h.x.s > (h.prio === 1 ? Math.max(2, h.x.s0 || 2) : 2)).sort((x, y) => y.x.s - x.x.s); let ok = false;
        for (const h of c) { const g = mgV(BY.get(h.x.lib)); const tgtH = act(lo).find(k2 => mgV(BY.get(k2.x.lib)) === g && k2.x.s < k2.x.max && Object.entries(K.volV(BY.get(k2.x.lib))).every(([g2, w]) => sessVol(lo, g2) + w <= 10 + 1e-9)); if (tgtH) { h.x.s--; tgtH.x.s++; ok = true; break; } }
        if (!ok) break;
      }
    }
    // 8. mínimo de ejercicios por sesión si el volumen lo permite (v2, D-08: solo intermedios y avanzados sin modo cauto)
    const minEx = novato(P) ? 0 : st.inp.min <= 20 ? 3 : st.inp.min <= 30 ? 4 : st.inp.min <= 45 ? 5 : 6;
    for (const t of T) {
      for (let k = 0; k < 8 && nStr(t) < minEx; k++) {
        const vol = volume(st); let added = false;
        const offs = t.slots.filter(h => !h.on && !h.empty && !h.cap && h.prio >= 2);
        for (const h of offs) { const x = h.x || fill(h, t, st, true); if (!x) continue; const L = BY.get(x.lib), g = mgV(L); if (!canAddEx(st, t, L, 2, vol) || (tgt.t[g] && vol.v[g] + 2 * t.f > (PSMALL.includes(g) ? tgt.t[g] * 1.5 : tgt.top[g]) + 1e-9)) continue;
          const had = !!h.x; if (!h.x) h.x = fill(h, t, st); else st.used.add(h.x.lib); h.on = true; setPres(st, t, h); h.x.s = 2;
          if (!fitsDay(t, st)) { h.on = false; st.used.delete(h.x.lib); if (!had) h.x = null; continue; }
          added = true; st.log.push('min:' + t.rb); break; }
        if (!added) break;
      }
    }
    enforceCaps(st);
  }
  // v5 (C-03): grupo grande por encima de lo alto del rango (objetivo × 1,3; × 1,5 prioritario) → −1 serie a un ejercicio donde ese grupo
  // es DIRECTO (lo indirecto no quita básicos: la sentadilla no baja por el glúteo), primero los que no son hueco 1 y con más series
  // (mín. 2); un hueco 1 nunca por debajo de su arranque; si no queda ninguno, se apaga un accesorio (hueco 3) de ese grupo
  function brake(st) {
    const { T, tgt } = st;
    for (let k = 0; k < 80; k++) {
      const { v } = volume(st); let moved = false;
      for (const g of PBIG) {
        if (!tgt.top[g] || v[g] <= tgt.top[g] + 1e-9) continue;
        // (con f ≥ 2 —cada entreno 2 o más veces por semana— el hueco 1 puede bajar a 2: 2 series × 2-3 sesiones ya son 4-6 por semana)
        const c = []; T.forEach(t => act(t).forEach(h => { const L = BY.get(h.x.lib); if (h.id === 'PW' || fracV(L, g) !== 1) return; const fl = h.prio === 1 && t.f < 2 ? Math.max(2, h.x.s0 || 2) : 2; if (h.x.s > fl) c.push(h); }));
        if (c.length) { c.sort((a, b) => (a.prio === 1 ? 1 : 0) - (b.prio === 1 ? 1 : 0) || b.x.s - a.x.s); c[0].x.s--; moved = true; st.log.push('freno:' + g); break; }
        const acc = []; T.forEach(t => act(t).forEach(h => { if (h.prio === 3 && !h.obl && !h.fijo && !h.prot && nStr(t) > 3 && mgV(BY.get(h.x.lib)) === g) acc.push(h); }));
        if (acc.length) { const h = acc[acc.length - 1]; h.on = false; st.used.delete(h.x.lib); h.x = null; h.cap = 1; moved = true; st.log.push('freno_off:' + g); break; }
      }
      if (!moved) break;
    }
  }
  // v5 (C-04, C-05): V8 (techo semanal) y V9 (≤ 10 series fraccionales por grupo y sesión), duras: −1 serie (mín. 2) al que más aporta,
  // primero los que no son hueco 1; con todo en 2, se apaga un accesorio o un secundario (nunca un hueco 1, uno obligatorio ni lo que deje
  // V5 corta). Devuelve si ha quedado todo dentro.
  function enforceCaps(st) {
    const weekFam = (f, except) => st.T.reduce((a, t) => a + act(t).filter(h => h !== except && famOf(BY.get(h.x.lib)) === f).length * t.f, 0);   // v9: veces por semana
    for (let k = 0; k < 200; k++) {
      const { v } = volume(st); let g = null, tt = null;
      for (const gg of PG) if (v[gg] > st.tgt.ceil[gg] + 1e-9) { g = gg; break; }
      if (!g) for (const t of st.T) { for (const gg of PG) if (sessVol(t, gg) > 10 + 1e-9) { g = gg; tt = t; break; } if (g) break; }
      if (!g) return true;
      const pool = tt ? [tt] : st.T;
      const c = []; pool.forEach(t => act(t).forEach(h => { const w = h.id === 'PW' ? 0 : fracV(BY.get(h.x.lib), g); if (w > 0 && h.x.s > 2) c.push({ h, w }); }));
      if (c.length) { c.sort((a, b) => (a.h.prio === 1 ? 1 : 0) - (b.h.prio === 1 ? 1 : 0) || b.w - a.w || b.h.x.s - a.h.x.s); c[0].h.x.s--; st.log.push((tt ? 'V9:' : 'V8:') + g); continue; }
      const off = []; pool.forEach(t => act(t).forEach(h => { const L = BY.get(h.x.lib); if (h.prio === 1 || h.obl || h.fijo || h.id === 'PW' || fracV(L, g) === 0 || nStr(t) <= 3) return;
        const f0 = famOf(L); if (f0 && f0 !== 'core' && weekFam(f0, h) + 1e-9 < v5need(st, f0)) return; off.push({ h, w: fracV(L, g) }); }));
      if (!off.length) return false;
      off.sort((a, b) => b.h.prio - a.h.prio || b.w - a.w); const { h } = off[0]; h.on = false; st.used.delete(h.x.lib); h.x = null; h.cap = 1; st.log.push('V89off:' + g);
    }
    return false;
  }
  function protect(st, g, sid, ok) {
    for (let k = 0; k < 6 && !ok(); k++) {
      // +1 serie a uno que ya está, o encender/crear el hueco (v5: sin pasar V8/V9)
      const vol = volume(st);
      // v5 (D-17): primero donde quepa en el día; si en ningún día cabe: con 20 min o menos (o 65+ con 30 o menos, que tienen 20 de fuerza)
      // no se añade (son los minutos que la persona tiene); con más, se añade en el día más corto y el ajuste al tiempo recorta otra cosa
      const corto = st.inp.min <= 20 || (st.P.segM && st.inp.min <= 30);
      const c = []; st.T.forEach(t => act(t).forEach(h => { const L = BY.get(h.x.lib); if ((sid === 'CO' ? CORE_PATS.includes(L.pat) && fracV(L, 'abdomen') === 1 : L.pat === 'rear') && h.x.s < h.x.max && h.x.s < 6 && canAddSet(st, t, h, 1, vol)) c.push({ t, h }); }));
      c.sort((a, b) => a.h.x.s - b.h.x.s); let up = false;
      for (const { t, h } of c) { h.x.s++; if (fitsDay(t, st) || (!corto && c[0].h === h)) { up = true; break; } h.x.s--; }
      if (up) continue;
      let done = false;
      for (const pass of corto ? [0] : [0, 1]) {
        for (const t of st.T.slice().sort((a, b) => nStr(a) - nStr(b))) {
          if (nStr(t) >= capOf(st.P, st.inp.min, st.inp.sesion) || !zoneOk(t, g)) continue;
          let h = t.slots.find(hh => hh.id === sid && !hh.on && !hh.empty), nuevo = false;
          if (!h) { h = mkSlot(sid, 3, null, t.role + '#' + t.n + ':' + sid + ':p'); h.reserva = 1; t.slots.push(h); nuevo = true; }
          const x = h.x || fill(h, t, st, true); if (!x) { if (nuevo) t.slots.pop(); else h.empty = true; continue; }
          if (!canAddEx(st, t, BY.get(x.lib), 2, vol)) { if (nuevo) t.slots.pop(); continue; }
          const had = !!h.x; if (!h.x) h.x = fill(h, t, st); else st.used.add(h.x.lib);
          h.on = true; h.prot = true; setPres(st, t, h); h.x.s = 2;
          if (pass === 1 || fitsDay(t, st)) { done = true; break; }
          h.on = false; h.prot = false; st.used.delete(h.x.lib); if (!had) h.x = null; if (nuevo) t.slots.pop();
        }
        if (done) break;
      }
      if (!done) break;
    }
  }
  // v5 (D-17): si el día no cabe en lo pedido, el ejercicio más lento (unilateral o con barra) se cambia por la variante más rápida de su
  // hueco (bilateral y sin barra), con las mismas series; se usa en el exprés y al final del ajuste al tiempo
  function quickSwap(t, st) {
    for (let k = 0; k < 3 && dayMinutes(t, st, false, { noCardio: true }) > st.inp.min + 1e-9; k++) {   // (sin el cardio final, que se recorta antes)
      const slow = act(t).filter(h => { const L = BY.get(h.x.lib); return h.id !== 'PW' && !h.fijo && (L.u || BARM.includes(L.mat)); });   // v8: los extensores (huesos frágiles) no se cambian
      let did = false;
      for (const h of slow) { const old = h.x, s0 = old.s, m0 = dayMinutes(t, st, false, { noCardio: true }); st.used.delete(old.lib); st.quickKey = h.key; const x2 = fill(h, t, st, true); st.quickKey = null;
        // v8: la variante rápida es de la misma familia (rodilla, cadera, empuje, tirón, core) para no romper V5 (antes, bird dog → Y-T-W dejaba la semana sin core)
        if (x2 && x2.lib !== old.lib && famOf(BY.get(x2.lib)) === famOf(BY.get(old.lib))) { h.x = x2; st.used.add(x2.lib); setPres(st, t, h); h.x.s = Math.min(s0, h.x.max); if (dayMinutes(t, st, false, { noCardio: true }) < m0 - 1e-9) { did = true; st.log.push('rapido:' + old.lib + '>' + x2.lib); break; } st.used.delete(x2.lib); }
        h.x = old; st.used.add(old.lib); }
      if (!did) break;
    }
  }
  // E.11 modo exprés: n ejercicios × 2 series por día (rodilla o cadera alternando, empuje, tirón). v5 (C-17): con 65 o más o rutina
  // prudente y 15-20 min, «modo corto»: 5 min de calentamiento y 2 (15 min) o 3 (20 min) ejercicios; con 2, una pierna y un torso por día
  // (rodilla o cadera alternando; tirón o empuje, lo que menos lleve la semana y, a igualdad, tirón)
  function expres(st, n) {
    n = n || 3;
    st.T.forEach((t, i) => {
      const a = act(t); const keep = [];
      const by = fam => a.find(h => famOf(BY.get(h.x.lib)) === fam && !keep.includes(h));
      // v2: rodilla o cadera según lo que menos lleve la semana hasta ahora (antes, alternando por posición: con dos sitios fallaba)
      const done = { rodilla: 0, cadera: 0, empuje: 0, tiron: 0 }; st.T.slice(0, i).forEach(o => act(o).forEach(h => { const f = famOf(BY.get(h.x.lib)); if (f in done) done[f]++; }));
      // (65+: el día con el unilateral obligatorio ya pone la rodilla; los demás, cadera)
      const oblDay = st.P.segM ? st.T.findIndex(o => act(o).some(h => h.obl)) : -1;
      const first = (oblDay >= 0 && oblDay !== i) || done.cadera < done.rodilla || (done.cadera === done.rodilla && i % 2) ? 'cadera' : 'rodilla', second = first === 'cadera' ? 'rodilla' : 'cadera';
      // 65+: el unilateral con apoyo es obligatorio cada semana (§E.1): si la semana aún no lo tiene, es el de pierna de este día
      const uniDone = st.T.slice(0, i).some(o => act(o).some(h => h.obl)), obl = st.P.segM && !uniDone ? a.find(h => h.obl) : null;
      if (['CCA', 'CCB', 'CCC'].includes(t.rb)) {
        const low = obl || by(first) || by(second);
        const ultimoCC = i === st.T.length - 1 && st.T.length >= 3 && done.rodilla === done.cadera;
        const otherF = low && famOf(BY.get(low.x.lib)) === 'rodilla' ? 'cadera' : 'rodilla';
        if (n >= 3 && ultimoCC && low && by(otherF)) { const up = done.tiron <= done.empuje ? 'tiron' : 'empuje'; const l2 = by(otherF); [low, l2, by(up) || by(up === 'tiron' ? 'empuje' : 'tiron')].forEach(h => { if (h && !keep.includes(h)) keep.push(h); }); }   // v5: rodilla:cadera de la semana
        else if (n >= 3) [low, by('empuje'), by('tiron')].forEach(h => { if (h) keep.push(h); });
        else { let up1 = done.tiron <= done.empuje ? 'tiron' : 'empuje'; const e0 = by('empuje'), t0 = by('tiron');
          if (done.tiron === done.empuje && e0 && t0 && st.P.prioV.has(mgV(BY.get(e0.x.lib))) && !st.P.prioV.has(mgV(BY.get(t0.x.lib)))) up1 = 'empuje';   // v5: prioridad
          const up2 = up1 === 'tiron' ? 'empuje' : 'tiron'; [low, by(up1) || by(up2)].forEach(h => { if (h) keep.push(h); }); }
      }
      // v3: en los días de pierna, el tercero equilibra rodilla y cadera (sentadilla + bisagra + curl femoral o hip thrust, no una 2.ª rodilla)
      // (y en los de torso, tirón:empuje: con empate, tirón; Kolber 2010)
      const legF = h => { const p = BY.get(h.x.lib).pat; return ['squat', 'lunge', 'knee_ext'].includes(p) ? 'k' : ['hinge', 'hip_ext', 'knee_flex'].includes(p) ? 'h' : ['push_h', 'push_v', 'fly'].includes(p) ? 'e' : ['pull_h', 'pull_v', 'rear'].includes(p) ? 't' : null; };
      // v5: el tercero equilibra la semana (días anteriores + este), no solo el día: con la pierna ya equilibrada, va el tirón
      const prevF = { k: 0, h: 0, e: 0, t: 0 }; st.T.slice(0, i).forEach(o => act(o).forEach(h => { const f = legF(h); if (f) prevF[f]++; }));
      // v5 (D-19): en los días que no son de cuerpo completo, primero uno de cada familia del día (torso: empuje y tirón; pierna: rodilla y
      // cadera); antes salían los dos huecos 1 de más prioridad, que en un torso de fuerza son dos empujes (perfil 1204: tirón:empuje 0,75)
      if (!['CCA', 'CCB', 'CCC'].includes(t.rb)) { const zt = ZONA_TPL[t.rb] || [], fams = zt.includes('pecho') && zt.includes('espalda') ? ['e', 't'] : zt.includes('cuads') ? ['k', 'h'] : [];
        // v7 (D-02, C-14): con 65+ o «Prefiero no decirlo», el unilateral con apoyo obligatorio de la semana es la rodilla de su día de pierna
        // (desde v7 hay torso/pierna con 65+: días seguidos, C-22, y con experiencia, C-07; antes el exprés lo dejaba fuera)
        if (obl && fams.includes('k')) keep.push(obl);
        for (const f of fams) { if (keep.some(k => legF(k) === f)) continue; const h = a.filter(h2 => legF(h2) === f && !keep.includes(h2)).sort((x, y) => x.prio - y.prio)[0]; if (h && keep.length < n) keep.push(h); } }
      const fill3 = all => { const c = s => prevF[s] + keep.filter(h => legF(h) === s).length;
        const want = c('k') > c('h') ? 'h' : c('h') > c('k') ? 'k' : c('e') >= c('t') && c('e') > 0 ? 't' : c('t') > c('e') ? 'e' : 'n';   // v5: 'n' = neutro (core, gemelos)
        // v5: la familia que falta; si no hay, mejor un neutro (core, gemelos, brazos) que uno de la familia contraria
        const w = h => legF(h) === want ? 2 : legF(h) === null ? 1 : 0;
        const lst = a.filter(h => !keep.includes(h)).sort((x, y) => w(y) - w(x) || x.prio - y.prio); return all ? lst : lst[0]; };
      // v5 (D-17): del 3.º en adelante, el primero de la lista de preferencia que quepa en los minutos (con los ya elegidos); si ninguno cabe, el preferido
      // (sin el cardio final, que el ajuste al tiempo quita antes que un ejercicio)
      const cabe = h => { const on0 = a.map(k => k.on); a.forEach(k => { k.on = keep.includes(k) || k === h; }); const ok = dayMinutes(t, st, false, { noCardio: true }) <= st.inp.min + 1e-9; a.forEach((k, j) => { k.on = on0[j]; }); return ok; };
      while (keep.length < n) { let h; if (keep.length < 2) h = a.slice().sort((x, y) => x.prio - y.prio).find(h2 => !keep.includes(h2)); else { const lst = fill3(true); h = lst.find(cabe) || lst[0]; } if (!h) break; keep.push(h); }
      // v8: si con los elegidos no cabe en los minutos, el más lento (que no sea el primero) deja su sitio a otro del día y de su misma familia
      // que sí quepa (V5 y el equilibrio no cambian)
      // (perfil 3867: con el hombro doliendo, el único press de hombros es el landmine, a una mano y lento)
      const fitsK = () => { const on0 = a.map(k => k.on), s0 = a.map(k => k.x && k.x.s); a.forEach(k => { k.on = keep.includes(k); if (k.on) k.x.s = 2; }); const ok = dayMinutes(t, st, false, { noCardio: true }) <= st.inp.min + 1e-9; a.forEach((k, j) => { k.on = on0[j]; if (k.x) k.x.s = s0[j]; }); return ok; };
      if (keep.length >= 3 && !fitsK()) { const secs = h => exSecs(BY.get(h.x.lib), Object.assign({}, h.x, { s: 2 }), st, false);
        // v12 (solo con «más glúteo», para no cambiar las demás rutinas): si ningún cambio basta solo, se queda el que más acorta (sin bajar un
        // principal a secundario) y se prueba con el siguiente (perfil 3867: el landmine
        // por el inclinado no basta mientras la rotación externa con banda, a un brazo, siga; quickSwap la cambia después por el face pull)
        const minK = () => { const on0 = a.map(k => k.on), s0 = a.map(k => k.x && k.x.s); a.forEach(k => { k.on = keep.includes(k); if (k.on) k.x.s = 2; }); const m = dayMinutes(t, st, false, { noCardio: true }); a.forEach((k, j) => { k.on = on0[j]; if (k.x) k.x.s = s0[j]; }); return m; };
        outer: for (const h of keep.slice(1).sort((x, y) => secs(y) - secs(x))) { const i = keep.indexOf(h); let best = null, bestM = minK();
          for (const c of a.filter(k => !keep.includes(k) && famOf(BY.get(k.x.lib)) === famOf(BY.get(h.x.lib))).sort((x, y) => x.prio - y.prio)) { keep[i] = c; if (fitsK()) break outer; const m = st.P.enfoque ? minK() : Infinity; if (m < bestM - 1e-9 && c.prio <= h.prio) { best = c; bestM = m; } keep[i] = h; }
          if (best) keep[i] = best; } }
      a.forEach(h => { if (!keep.includes(h)) { h.on = false; st.used.delete(h.x.lib); h.x = null; h.cut = 1; } else h.x.s = 2; });
      quickSwap(t, st);
      // v5 (C-17): en el modo corto, si con 3 no cabe en los minutos pedidos, 2: fuera el de torso de la familia que más lleva la semana
      // (contando este día; a igualdad, sale el empuje), para que a la semana haya empuje y tirón
      if (st.corto && keep.length > 2 && dayMinutes(t, st, false, { noCardio: true }) > st.inp.min + 1e-9) {
        const wk = { empuje: done.empuje, tiron: done.tiron }; keep.forEach(h => { const f = famOf(BY.get(h.x.lib)); if (f in wk) wk[f]++; });
        const ups = keep.filter(h => ['empuje', 'tiron'].includes(famOf(BY.get(h.x.lib))));
        const pr = h => st.P.prioV.has(mgV(BY.get(h.x.lib))) ? 1 : 0;   // v5: a igualdad, se queda el de un grupo prioritario (perfil 228: pecho prioritario y ningún pecho en la semana)
        const out = ups.length >= 2 ? ups.sort((x, y) => { const fx = famOf(BY.get(x.x.lib)), fy = famOf(BY.get(y.x.lib)); return (wk[fy] - wk[fx]) || (pr(x) - pr(y)) || (fx === 'empuje' ? -1 : 1); })[0] : keep[keep.length - 1];
        out.on = false; st.used.delete(out.x.lib); out.x = null; out.cut = 1;
      }
    });
    const ns = st.T.map(t => nStr(t));
    st.expres = true; st.why.push({ c: st.corto ? 'corto' : 'expres', p: { n, nMin: Math.min(...ns), nMax: Math.max(...ns), min: st.inp.min } });
    const { v } = volume(st); for (const g of PBIG) if (v[g] < 4) st.warn.push({ c: 'vol_corto', p: { g, motivo: 'tiempo', v: Math.round(v[g] * 10) / 10, obj: Math.round(st.tgt.t[g] * 10) / 10 } });
  }

  // ════════ E.12 calentamiento, equilibrio y cardio ════════
  const CARD_GYM_WARM = ['lib_cardio_walk', 'lib_cardio_bike', 'lib_cardio_elliptical', 'lib_cardio_rower', 'lib_cardio_recumbent', 'lib_cardio_spinning', 'lib_cardio_air_bike', 'lib_cardio_ski_erg', 'lib_cardio_shadow_boxing', 'lib_cardio_dance'];
  const CARD_GYM_WARM_SOFT = ['lib_cardio_bike', 'lib_cardio_elliptical', 'lib_cardio_recumbent', 'lib_cardio_rower', 'lib_cardio_walk'];
  const CARD_HOME_WARM = ['lib_cardio_march', 'lib_cardio_shadow_boxing', 'lib_cardio_dance'];
  const CARD_FINAL_GYM = ['lib_cardio_bike', 'lib_cardio_elliptical', 'lib_cardio_rower', 'lib_cardio_recumbent', 'lib_cardio_walk', 'lib_cardio_run', 'lib_cardio_spinning', 'lib_cardio_air_bike', 'lib_cardio_ski_erg', 'lib_cardio_stair_machine', 'lib_cardio_treadmill_run', 'lib_cardio_shadow_boxing', 'lib_cardio_dance'];
  const CARD_FINAL_HOME = ['lib_cardio_dance', 'lib_cardio_march', 'lib_cardio_shadow_boxing', 'lib_cardio_step', 'lib_cardio_jog_in_place', 'lib_cardio_jump_rope', 'lib_cardio_hiit'];
  const LOW_IMPACT = new Set(['lib_cardio_bike', 'lib_cardio_recumbent', 'lib_cardio_spinning', 'lib_cardio_air_bike', 'lib_cardio_elliptical', 'lib_cardio_rower', 'lib_cardio_walk', 'lib_cardio_march', 'lib_cardio_walk_outdoor', 'lib_cardio_cycling_outdoor', 'lib_cardio_swim']);
  function pickCardio(t, st, list, low, avoidId) {
    const { P } = st;
    for (const pass of [0, 1]) for (const id of list) {
      const L = BY.get(id); if (!L || (pass === 0 && id === avoidId)) continue;
      if (!placeCan(L, t.P, t.place) || !safe(L, st) || L.dif > Math.max(P.difCap, 1)) continue;
      if (low && !LOW_IMPACT.has(id)) continue;
      if ((P.prud || LV[P.level] <= LV.P) && id === 'lib_cardio_hiit') continue;
      return id;
    }
    return null;
  }
  function addWarmupBalanceCardio(st) {
    const { inp, P } = st;
    let wm = inp.min <= 20 ? 0 : 5;
    if (wm && (inp.min <= 30 || inp.warm === 'corto')) wm = 3;
    // v7 (C-09): con 65 o más, 8 min; con 30 min, 5 + los 5 del bloque de equilibrio (05 §7.1: el equilibrio «puede ir en el calentamiento»;
    // 05 §9.2: en 65+ sustituye a la movilidad específica): los mismos 10 min que antes (8 + 2) y 20 de fuerza
    if (P.mayor) wm = inp.min <= 30 ? 5 : 8;   // ISSUE-15min: «8 con 65 o más» frente a «ninguno con 15-20 min»: gana la seguridad
    // v5 (C-17): con 65 o más o rutina prudente y 15-20 min (modo corto), 5 min de calentamiento: sin él no se carga, y con 8 no cabe nada
    if (P.corto) wm = 5;
    const knee = !!P.zones.rodilla, low = knee || P.noImpact || P.segM;
    let cm = 0;
    if (inp.sesion) cm = inp.cardio || 0;   // v15 (T3): con tipo de sesión, los minutos de cardio que eligió la persona
    else if (inp.cardioEnd !== 'no') {
      if (inp.goal === 'grasa') cm = ['piernas', 'agua'].includes(inp.sport) ? 10 : 15;
      else if (inp.goal === 'salud') cm = (inp.sport === 'no' || !inp.sport) ? 10 : 0;
      else if (inp.goal === 'aguante') cm = inp.sport === 'suave' ? 0 : 10;
      if (inp.cardioEnd === 'si' && !cm) cm = 10;
    }
    st.cardioPlan = cm; st.warmMin = wm; st.cardioLow = knee || P.noImpact || P.segM || P.prud || (LV[P.level] <= LV.P && inp.goal === 'grasa');
    // v7 (C-09): bloque de equilibrio de 5-8 min tras el calentamiento (antes, 2 min): 2-4 ejercicios que progresan, junto a una pared o una
    // silla (OMS 2020: multicomponente ≥ 3 días; ICFSR 2021; 05 §7.1: 5-10 min). 65+: 5 min (8 con sesiones de 60 min o más); «Prefiero no
    // decirlo» (C-14): 5. En el modo corto (15-20 min) no cabe: «en casa, cualquier día» (aviso)
    let balMin = P.segM && !P.corto ? (P.mayor ? (inp.min >= 60 ? 8 : 5) : (inp.min >= 45 ? 5 : 3)) : 0;   // («Prefiero no decirlo» con 30 min: 3; C-14 no fija los minutos)
    // v8 (J-07): huesos frágiles, el bloque de equilibrio de 65+ (05 §7.4: «fuerza progresiva + equilibrio»; la mayoría de las fracturas vienen
    // de una caída): 5 min con 45 min o más y 3 con 30; con 15-20 min, «en casa, cualquier día» (aviso)
    if (P.huesos && !balMin && !P.corto && inp.min >= 30) balMin = inp.min >= 45 ? 5 : 3;   // (con 30 min, 3, como «Prefiero no decirlo»: C-14)
    st.balMin = balMin;
    for (const t of st.T) {
      const home = t.place === 'c';
      if (wm) {
        const list = home ? CARD_HOME_WARM : (low ? CARD_GYM_WARM_SOFT : CARD_GYM_WARM);
        const id = pickCardio(t, st, list, low && !home, null) || pickCardio(t, st, home ? CARD_HOME_WARM : CARD_GYM_WARM, false, null);
        t.warm = id ? { lib: id, min: wm } : null; if (!id) st.warn.push({ c: 'sin_calentamiento', p: { dia: t.n } });
        // v8 (J-05): con la rodilla doliendo ahora, un isométrico al final del calentamiento (05 §7.4: sentadilla en pared en rango sin dolor)
        if (t.warm && P.rodillaAhora) t.warm.nota = 'Al final, 2 veces 30-45 s de sentadilla en la pared, en un ángulo sin dolor.';
      } else t.warm = null;
      t.balance = balMin ? { min: balMin } : null;
      if (cm) {
        // v7 (C-28): principiante que quiere perder grasa → cardio de bajo impacto por defecto (05 §7.2 y §8.2: sin saltos ni carrera al principio)
        const lowC = low || P.prud || (LV[P.level] <= LV.P && inp.goal === 'grasa'); st.cardioLow = lowC;
        const id = pickCardio(t, st, home ? CARD_FINAL_HOME : CARD_FINAL_GYM, lowC, t.warm && t.warm.lib) || null;
        t.cardio = id ? { lib: id, min: cm } : null; if (!id) st.warn.push({ c: 'sin_cardio', p: { dia: t.n } });
        if (t.cardio && inp.sesion) t.cardio.fijo = 1;   // v15 (T3): va aparte del presupuesto del tipo (dayMinutes no lo cuenta; la duración que se enseña, sí)
      } else t.cardio = null;
    }
    if (inp.sport === 'suave' && inp.goal !== 'grasa') st.why.push({ c: 'paseos' });
    if ((P.segM && P.corto) || (P.huesos && !P.segM && inp.min <= 20)) st.warn.push({ c: 'equilibrio_casa', p: { min: inp.min } });
    if (P.huesos && inp.min <= 20) st.warn.push({ c: 'extensores_casa', p: { min: inp.min } });   // v8 (J-07)
    // v7 (C-09): con menos de 3 días de pesas, el equilibrio también en casa los otros días (OMS: 3 días o más; tarjeta en Inicio)
    if ((P.segM || P.huesos) && balMin && P.wd < 3) st.why.push({ c: 'equilibrio_dias', p: { pesas: P.wd } });
  }

  // ════════ E.11 minutos y ajuste al tiempo ════════
  const BARM = ['barra', 'disco', 'barraz'];
  // v5 (C-32): aproximación del primer multiarticular con kilos: 150 s; en «Ganar fuerza», el primer básico en rango pesado sube en 3
  // pasos (≈ 4 min); exprés y modo corto, 60 s («la primera serie con poco peso»)
  function approachSecs(L, x, st) {
    // v5: 65+ empieza con cargas ligeras (30-40 % 1RM, ICFSR 2021): sin series de aproximación en el primer ciclo. v7: también prudente (10-12
    // repeticiones dejando 3 o más: la primera serie ya es ligera; 05 §9.2 reserva la aproximación para los patrones pesados), como inicio
    if (st.P.mayor || st.P.prud) return 0;
    if (st.expres || st.corto || st.inp.min === 15) return 60;
    const rr = repRange(L, x.r);
    return st.inp.goal === 'fuerza' && x.principal && heavyOk(L) && rr && rr.hi <= 6 ? 240 : 150;
  }
  // o = { s: series a suponer, floor: descansos en su suelo, noCardio } → para el presupuesto de tiempo previo (v5, D-17)
  function exSecs(L, x, st, first, o) {
    const s = o && o.s != null ? Math.min(o.s, x.s || o.s) : x.s;
    const rr = repRange(L, x.r);
    const tr = (BARM.includes(L.mat) || (TAGS.req[L.id] || []).includes('rack')) ? 120 : 60;
    const ap = first ? approachSecs(L, x, st) : 0;
    const secs = typeof x.r === 'string' && /s$/.test(x.r) ? parseInt(x.r) : null;
    const work = L.lt === 't' ? (secs || 30) + 12 : L.lt === 'd' ? 45 : (rr ? (rr.lo + rr.hi) / 2 : 10) * 3.5 + 12;
    return tr + ap + s * work * (L.u ? 2 : 1) + (s - 1) * (o && o.floor ? restOf(L, x, st, true) : restOf(L, x, st));
  }
  function strMin(t, st) { return dayMinutes(t, st, true); }
  function dayMinutes(t, st, onlyStr, o) {
    let sec = 0; const seq = sessionSeq(t, st);
    let firstDone = false;
    for (const h of seq) {
      const L = BY.get(h.x.lib);
      const first = !firstDone && !st.P.inicio && L.c && L.lt === 'w'; if (first) firstDone = true;
      sec += exSecs(L, h.x, st, first, o);
    }
    if (!onlyStr) { if (t.warm) sec += t.warm.min * 60; if (t.balance) sec += t.balance.min * 60; if (t.cardio && !t.cardio.fijo && !(o && o.noCardio)) sec += t.cardio.min * 60; }
    return sec / 60;
  }
  function fitTime(st) {
    const { inp, P } = st, budget = inp.min;   // v5: el recorte apunta a lo pedido (antes ×1,05); el +5 % queda como tolerancia de la estimación
    const R = st.rest, cut = [];
    const over = () => st.T.filter(t => dayMinutes(t, st) > budget + 1e-9);
    const weekFam = (fam, except) => st.T.reduce((a, t) => a + act(t).filter(h => h !== except && famOf(BY.get(h.x.lib)) === fam).length * t.f, 0);   // v9: veces por semana
    const canRemove = (t, h) => {
      if (nStr(t) <= 3) return false;
      const L = BY.get(h.x.lib), fam = famOf(L);
      if (fam && weekFam(fam, h) === 0) return false;
      if (fam && fam !== 'core' && weekFam(fam, h) + 1e-9 < v5need(st, fam)) return false;   // v2: el recorte no rompe V5 (D-17)
      if (h.obl || h.gar) return false;   // v15 (T2): ni el bíceps o el tríceps asegurados
      if (h.fijo && !st.T.some(o => act(o).some(k => k !== h && k.fijo))) return false;   // v8: queda al menos un extensor en la semana
      if (h.prot && h.id === 'CO' && weekFam('core', h) === 0) return false;
      if (h.prot && h.id === 'RE' && !st.T.some(tt => act(tt).some(k => k !== h && BY.get(k.x.lib).pat === 'rear'))) return false;
      return true;
    };
    const removed = [], stuck = new Set();
    for (let it = 0; it < 300; it++) {
      // v2: si un día no se puede recortar más, se sigue con los demás (v1 se rendía con el primero y no miraba el resto)
      const ov = over().filter(t => !stuck.has(t)); if (!ov.length) break;
      const t = ov[0]; let did = null;
      // 1. descanso de aislamientos −15 s (toda la rutina)
      if (R.iso - 15 >= R.floor.iso && act(t).some(h => !BY.get(h.x.lib).c)) { R.iso -= 15; did = 'iso'; }
      // 2. cardio final a 10 min
      else if (t.cardio && !t.cardio.fijo && t.cardio.min > 10) { t.cardio.min = 10; did = 'cardio10'; }
      // 3. cardio final fuera (con «Perder grasa», antes el paso 6; si ni así cabe, fuera el cardio y se recuperan los accesorios)
      else if (t.cardio && !t.cardio.fijo && inp.goal !== 'grasa') { t.cardio = null; did = 'cardio_fuera'; }
      else if (t.cardio && !t.cardio.fijo && inp.goal === 'grasa') {
        const snap = act(t).filter(h => h.prio === 3 && canRemove(t, h));
        let fits = false; const tmp = [];
        for (const h of snap.slice().reverse()) { h.on = false; tmp.push(h); if (dayMinutes(t, st) <= budget) { fits = true; break; } }
        if (fits) { tmp.forEach(h => { st.used.delete(h.x.lib); removed.push({ t: t.n, lib: h.x.lib }); h.x = null; h.cut = 1; }); did = 'acc_por_cardio'; }
        else { tmp.forEach(h => { h.on = true; }); t.cardio = null; did = 'cardio_fuera'; }
      }
      // 4. accesorios a 2 series
      else if (act(t).some(h => h.prio === 3 && h.x.s > 2)) { act(t).filter(h => h.prio === 3 && h.x.s > 2).sort((a, b) => b.x.s - a.x.s)[0].x.s--; did = 'acc2'; }
      // 5. descanso de multiarticulares −15 s (toda la rutina)
      else if (R.comp - 15 >= R.floor.comp && act(t).some(h => { const L = BY.get(h.x.lib); return L.c && L.lt !== 'r' && L.lt !== 't' && restOf(L, h.x, st) === R.comp; })) { R.comp -= 15; did = 'comp'; }
      else if (R.heavy - 15 >= R.floor.heavy && act(t).some(h => { const L = BY.get(h.x.lib); return L.c && restOf(L, h.x, st) === R.heavy; })) { R.heavy -= 15; did = 'heavy'; }
      // 6. quitar accesorios, el último primero
      else { const seq = sessionSeq(t, st).filter(h => (h.prio === 3 || h.id === 'PW' || h.xbr) && canRemove(t, h));   // v14 (P3): y los brazos extra   // v10: los explosivos son un extra: salen como un accesorio si el día no cabe
        if (seq.length) { const h = seq[seq.length - 1]; h.on = false; st.used.delete(h.x.lib); removed.push({ t: t.n, lib: h.x.lib }); h.x = null; h.cut = 1; did = 'acc_fuera'; }
        // 7. calentamiento de 5 a 3 min (nunca con 65 o más)
        else if (t.warm && t.warm.min > 3 && !P.mayor && !P.corto) {   // v7 (C-17): ni en el modo corto (los 5 min son la condición para cargar)
           st.T.forEach(tt => { if (tt.warm && tt.warm.min > 3) tt.warm.min = 3; }); did = 'warm3'; }
        // 8. secundarios a 2 series
        else if (act(t).some(h => h.prio === 2 && h.x.s > 2)) { act(t).filter(h => h.prio === 2 && h.x.s > 2).sort((a, b) => b.x.s - a.x.s)[0].x.s--; did = 'sec2'; }
        // 9. quitar un secundario si otro día cubre su patrón y quedan ≥ 3 de fuerza
        else { const corto = inp.min <= 20;
          // con sesión corta, un ejercicio de pierna solo sale si rodilla:cadera no se descuadra (o no empeora)
          const rcOk = h => { const pat = BY.get(h.x.lib).pat; if (!['squat', 'lunge', 'knee_ext', 'hinge', 'hip_ext', 'knee_flex'].includes(pat)) return true;
            const r0 = pushPull(st).rh; h.on = false; const r1 = pushPull(st).rh; h.on = true; const out0 = r0 < 0.6 || r0 > 1.6, out1 = r1 < 0.6 || r1 > 1.6;
            return !out1 || (out0 && Math.abs(Math.log(r1)) <= Math.abs(Math.log(r0))); };
          const c = sessionSeq(t, st).filter(h => h.prio === 2 && (canRemove(t, h) || (corto && h.id === 'CO' && nStr(t) > 3)) && (corto ? rcOk(h) : st.T.some(tt => tt !== t && act(tt).some(k => BY.get(k.x.lib).pat === BY.get(h.x.lib).pat))));
          if (corto) c.sort((a, b) => (a.id === 'CO' ? 1 : 0) - (b.id === 'CO' ? 1 : 0));
          if (c.length) { const h = c[c.length - 1]; h.on = false; st.used.delete(h.x.lib); removed.push({ t: t.n, lib: h.x.lib }); h.x = null; h.cut = 1; did = 'sec_fuera'; }
          // 10. principales a 2 series
          else if (act(t).some(h => h.prio === 1 && h.x.s > 2)) { act(t).filter(h => h.prio === 1 && h.x.s > 2).sort((a, b) => b.x.s - a.x.s)[0].x.s--; did = 'pri2'; }
        } }
      if (!did) { stuck.add(t); continue; }
      cut.push(did + ':' + t.n);
    }
    st.cut = cut; st.removed = removed;
    if (inp.min <= 20 && !st.T.some(t => act(t).some(h => famOf(BY.get(h.x.lib)) === 'core'))) st.warn.push({ c: 'core_corto' });
    st.T.forEach(t => { if (dayMinutes(t, st) > inp.min + 1e-9) quickSwap(t, st); });   // v5 (D-17)
    const left = st.T.filter(t => dayMinutes(t, st) > inp.min * 1.05 + 1e-9); left.forEach(t => st.warn.push({ c: 'no_cabe', p: { dia: t.n, m: Math.round(dayMinutes(t, st)), min: inp.min } }));
    if (cut.some(c => c.startsWith('cardio_fuera'))) st.why.push({ c: 'time_cut', p: { que: 'cardio', min: inp.min } });
    if (cut.some(c => /^(comp|heavy|iso)/.test(c))) st.why.push({ c: 'time_cut', p: { que: 'descansos', min: inp.min } });
    if (removed.length) st.why.push({ c: 'time_cut', p: { que: 'accesorios', n: removed.length, min: inp.min } });
    // v5 (D-15): el tiempo sobrante se usa para llegar a lo alto del rango bueno (fillSpare)
    fillSpare(st);
    // v3 (D-19, adelantado): tirón:empuje se comprueba otra vez al final, porque el recorte y el relleno de tiempo lo pueden romper:
    // +1 serie a un tirón si cabe en su día (v5: y en V8/V9); si no, −1 a un empuje que no sea hueco 1 (mín. 2) y, si no, a un hueco 1 con más de 3
    for (let k = 0; k < 20; k++) {
      const pp = pushPull(st); if (pp.ps === 0 || pp.ratio >= 1 - 1e-9) break;
      let did = false; const pulls = [], vol = volume(st);
      st.T.forEach(t => act(t).forEach(h => { const L = BY.get(h.x.lib); if (isPull(L) && h.x.s < h.x.max && h.x.s < 6 && canAddSet(st, t, h, 1, vol)) pulls.push({ t, h }); }));
      pulls.sort((a, b) => a.h.x.s - b.h.x.s);
      for (const { t, h } of pulls) { h.x.s++; if (dayMinutes(t, st) <= budget + 1e-9) { did = true; st.log.push('te+'); break; } h.x.s--; }
      if (!did) { const pu = []; st.T.forEach(t => act(t).forEach(h => { const L = BY.get(h.x.lib); if (isPush(L) && ((h.prio !== 1 && h.x.s > 2) || (h.prio === 1 && h.x.s > 3))) pu.push(h); }));
        pu.sort((a, b) => (a.prio === 1 ? 1 : 0) - (b.prio === 1 ? 1 : 0) || b.x.s - a.x.s); if (pu.length) { pu[0].x.s--; did = true; st.log.push('te-'); } }
      // v11 (D5 del usuario, 6 nov): el curl y el tríceps de la prioridad de brazos (h.brazo) tampoco se quitan aquí; con principiantes a 6 días
      // de pesas (topePrincipiante: false), quitar el fondo en silla para cuadrar tirón:empuje dejaba la prioridad sin tríceps (perfil 268)
      if (!did) { const ex = []; st.T.forEach(t => act(t).forEach(h => { const L = BY.get(h.x.lib); if (!isPush(L) || h.prio === 1 || h.obl || h.fijo || h.brazo || nStr(t) <= 3) return; const f0 = famOf(L);   // v5 (D-19)
          if (f0 && st.T.reduce((a, t2) => a + act(t2).filter(k => k !== h && famOf(BY.get(k.x.lib)) === f0).length * t2.f, 0) + 1e-9 < v5need(st, f0)) return; ex.push({ t, h }); }));
        ex.sort((a, b) => b.h.prio - a.h.prio || a.h.x.s - b.h.x.s); if (ex.length) { const { h } = ex[0]; h.on = false; st.used.delete(h.x.lib); h.x = null; h.cut = 1; did = true; st.log.push('te_fuera'); } }
      // v5 (D-19): último recurso, en sesiones donde ya no caben más series (fuerza a 20 min: banca + militar + remo; 65+ sin material con un
      // solo tirón posible): un empuje que no sea el primer levantamiento del día deja su sitio a otro hueco del mismo día: primero un tirón,
      // después la familia de pierna que menos lleve la semana y después el core; si cabe (con la tolerancia del +5 % de la estimación) y V5
      // sigue cumpliéndose
      if (!did) for (const t of st.T) {
        const first = (t.seq || sessionSeq(t, st)).find(h => isPush(BY.get(h.x.lib)));
        const outs = act(t).filter(h => isPush(BY.get(h.x.lib)) && !(t.lift && t.lift[0] === h.id) && !(t.lift && t.lift.length && h === first))
          .sort((a, b) => (t.lift.includes(a.id) ? 1 : 0) - (t.lift.includes(b.id) ? 1 : 0) || b.prio - a.prio);
        const pp0 = pushPull(st), legNeed = pp0.kn > pp0.hp ? ['HI', 'HE', 'KF'] : ['SQ', 'LU', 'KE'];
        const rank = h => ['TV', 'TH', 'RE'].includes(h.id) ? 0 : legNeed.includes(h.id) ? 1 : h.id === 'CO' ? 2 : 3;
        const ps = t.slots.filter(h => !h.on && !h.empty && !['PH', 'PI', 'PV', 'FL', 'PW'].includes(h.id)).sort((a, b) => rank(a) - rank(b));
        for (const out of outs) {
          for (const pslot of ps) {
            const oldX = out.x, hadX = pslot.x; out.on = false; st.used.delete(oldX.lib); out.x = null;
            const x = pslot.x || fill(pslot, t, st, true);
            if (x && !isPush(BY.get(x.lib))) { pslot.x = x; st.used.add(x.lib); pslot.on = true; setPres(st, t, pslot); pslot.x.s = 2;
              const f0 = famOf(BY.get(oldX.lib)), v5 = !f0 || st.T.reduce((a, t2) => a + act(t2).filter(k => famOf(BY.get(k.x.lib)) === f0).length * t2.f, 0) + 1e-9 >= v5need(st, f0);
              if (dayMinutes(t, st) <= inp.min * 1.05 + 1e-9 && v5 && pushPull(st).ratio > pp0.ratio + 1e-9) { out.cut = 1; did = true; st.log.push('te_cambio:' + oldX.lib + '>' + x.lib); st.why.push({ c: 'te_cambio', p: { de: oldX.lib, a: x.lib, min: inp.min } }); break; }
              pslot.on = false; st.used.delete(x.lib); pslot.x = hadX; }
            out.x = oldX; out.on = true; st.used.add(oldX.lib);
          }
          if (did) break;
        }
        if (did) break;
      }
      // v5 (D-19): y si quitar un empuje rompe V5 (65+ sin material: un solo tirón posible), un accesorio que no sea empuje (no hueco 1, no
      // obligatorio, no el último de su familia ni el último core) deja su sitio a un tirón: un hueco apagado de tirón o uno de reserva
      if (!did) for (const t of st.T) {
        const pp0 = pushPull(st);
        const outs = act(t).filter(h => { const L = BY.get(h.x.lib); if (h.prio === 1 || h.obl || h.fijo || isPush(L) || isPull(L) || h.id === 'PW') return false; const f0 = famOf(L);
          if (f0 === 'core' && !st.T.some(t2 => act(t2).some(k => k !== h && famOf(BY.get(k.x.lib)) === 'core'))) return false;
          return !f0 || f0 === 'core' || st.T.reduce((a, t2) => a + act(t2).filter(k => k !== h && famOf(BY.get(k.x.lib)) === f0).length * t2.f, 0) + 1e-9 >= v5need(st, f0); })
          .sort((a, b) => b.prio - a.prio);
        const ps = t.slots.filter(h => !h.on && !h.empty && ['TV', 'TH', 'RE'].includes(h.id));
        for (const sid of ['RE', 'TH']) if (!ps.some(h => h.id === sid)) { const h = mkSlot(sid, 3, null, t.role + '#' + t.n + ':' + sid + ':te'); h.reserva = 1; h.nuevo = 1; ps.push(h); }
        for (const out of outs) {
          for (const pslot of ps) {
            const oldX = out.x; out.on = false; st.used.delete(oldX.lib); out.x = null;
            if (pslot.nuevo) t.slots.push(pslot);
            const x = pslot.x || fill(pslot, t, st, true);
            if (x && isPull(BY.get(x.lib))) { const hadX = pslot.x; pslot.x = x; st.used.add(x.lib); pslot.on = true; setPres(st, t, pslot); pslot.x.s = 2;
              if (dayMinutes(t, st) <= inp.min * 1.05 + 1e-9 && pushPull(st).ratio > pp0.ratio + 1e-9) { out.cut = 1; delete pslot.nuevo; did = true; st.log.push('te_cambio2:' + oldX.lib + '>' + x.lib); break; }
              pslot.on = false; st.used.delete(x.lib); pslot.x = hadX; }
            if (pslot.nuevo) t.slots.pop();
            out.x = oldX; out.on = true; st.used.add(oldX.lib);
          }
          if (did) break;
        }
        if (did) break;
      }
      if (!did) break;
    }
    // v5 (C-04): V8 y V9 otra vez al final (los pasos anteriores suben series)
    enforceCaps(st);
    // v10 (J-19): si un día al que el ajuste quitó el cardio final vuelve a tener 8 min o más libres (los pasos siguientes lo acortaron), el
    // cardio vuelve con los minutos que quepan; y el texto «he quitado el cardio final» solo nombra los días que siguen sin él
    if (st.cardioPlan && inp.cardioEnd !== 'no' && !st.expres && !st.corto) { st.T.forEach(t => {
      if (t.cardio || !st.cut.includes('cardio_fuera:' + t.n)) return; const spare = inp.min - dayMinutes(t, st); if (spare < 8) return;
      const id = pickCardio(t, st, t.place === 'c' ? CARD_FINAL_HOME : CARD_FINAL_GYM, st.cardioLow, t.warm && t.warm.lib); if (!id) return;
      t.cardio = { lib: id, min: Math.min(st.cardioPlan, Math.max(5, Math.floor(spare / 5) * 5)) }; st.cut = st.cut.filter(c => c !== 'cardio_fuera:' + t.n); });
      if (!st.cut.some(c => c.startsWith('cardio_fuera'))) st.why = st.why.filter(w => !(w.c === 'time_cut' && w.p.que === 'cardio')); }
    // v9 (J-14): con «Aguantar más» o «Perder grasa», si sobran 15 min o más en un día, el cardio final crece hasta llenarlo (como mucho 45
    // min de cardio; de bajo impacto si hace falta): para esos objetivos el cardio es parte del objetivo (05 §8.2 y §7.2). Si la persona
    // dijo «sin cardio al final», no
    // (con «Salud y forma», lo mismo hasta 30 min: el aeróbico es la otra mitad de la salud, OMS 2020: 150-300 min por semana)
    if (['aguante', 'grasa', 'salud'].includes(inp.goal) && inp.cardioEnd !== 'no' && !inp.sesion && !st.expres && !st.corto) st.T.forEach(t => {   // (v15: con tipo de sesión, el cardio es el elegido)
      const spare = inp.min - dayMinutes(t, st); if (spare < 15) return;
      if (!t.cardio) { const id = pickCardio(t, st, t.place === 'c' ? CARD_FINAL_HOME : CARD_FINAL_GYM, st.cardioLow, t.warm && t.warm.lib); if (!id) { if (!st.warn.some(w => w.c === 'sin_cardio')) st.warn.push({ c: 'sin_cardio', p: { dia: t.n } }); return; } t.cardio = { lib: id, min: 0 }; }
      const add = Math.min(Math.floor((spare + 1e-9) / 5) * 5, (inp.goal === 'salud' ? 30 : 45) - t.cardio.min);
      if (add > 0) { t.cardio.min += add; st.cardioRelleno = true; }
      // (en casa o en un parque, 20 min o más de marcha en el sitio o de baile: mejor caminar al aire libre)
      if (t.cardio.min >= 20 && t.place === 'c' && ['lib_cardio_march', 'lib_cardio_dance', 'lib_cardio_jog_in_place'].includes(t.cardio.lib) && BY.get('lib_cardio_walk_outdoor') && safe(BY.get('lib_cardio_walk_outdoor'), st)) t.cardio.lib = 'lib_cardio_walk_outdoor';
      if (!t.cardio.min) t.cardio = null;
    });
    // v5 (D-15, D-22): si sobra tiempo, el motivo, para que el texto diga la verdad
    st.T.forEach(t => { const spr = inp.min - dayMinutes(t, st); t.spare = spr >= 8 ? spr : 0; });
    const sp = st.T.filter(t => t.spare >= 8).map(t => t.spare);
    const motivoSobra = st.expres ? null : spareReason(st);
    if (sp.length && !st.expres) st.why.push({ c: 'time_spare', p: { m: Math.round(Math.min(...sp) / 5) * 5, mx: Math.round(Math.max(...sp) / 5) * 5, motivo: motivoSobra, dias: st.T.filter(t => t.spare >= 8).map(t => 'ABCDEF'[st.T.indexOf(t)]), conCardio: st.T.filter(t => t.spare >= 8).every(t => !!t.cardio) } });   // v10 (J-19): qué días y si ya llevan cardio
    // v5 (D-20, D-22): los avisos de volumen corto se rehacen con la rutina final (antes se quedaban con la cifra y el motivo de mitad del
    // proceso): grande por debajo de objetivo − 0,75 o del suelo de 4 (§E.3, «solo se baja del suelo por tiempo o material, y con aviso»);
    // pequeño (objetivo ≥ 2) por debajo de objetivo − 1,5. Motivo: material · tiempo (exprés, modo corto, presupuesto o recortes) · tope
    // (inicio, 65+, prudente o principiante: pocos ejercicios y 2 series para empezar) · días (el resto: tope de ejercicios, de series o por sesión)
    st.warn = st.warn.filter(w => w.c !== 'vol_corto' && w.c !== 'suelo');
    if (P.noFloor) { const s0 = st.T.flatMap(t => act(t)).find(h => TAGS.suelo.has(h.x.lib)); if (s0) st.warn.push({ c: 'suelo', p: { id: s0.x.lib } }); }   // v10 (J-19)
    { const { v } = volume(st), nov = P.inicio || P.cauto || LV[P.level] <= LV.P, porTiempo = st.expres || st.preCut || cut.some(c => /^(acc_fuera|sec_fuera|acc_por_cardio|pri2|sec2|acc2)/.test(c));
      PG.forEach(g => { const o = st.tgt.t[g]; if (!o) return; const big = PBIG.includes(g);
        const bajo = big ? (v[g] < o - 0.75 - 1e-9 || v[g] < 4 - 1e-9) : (o >= 2 && v[g] < o - 1.5 - 1e-9); if (!bajo) return;
        const libre = K.C.some(L => L.lt !== 'c' && mgV(L) === g && !st.used.has(L.id) && st.T.some(t => canDo(L, t, st, false)));
        const conSitio = st.T.some(t => act(t).some(h => mgV(BY.get(h.x.lib)) === g && h.x.s < h.x.max));
        // v10: si el material lo permitiría y lo quita la seguridad (hombro que duele: sin elevaciones laterales), el motivo es la molestia
        const matSolo = K.C.some(L => L.lt !== 'c' && mgV(L) === g && st.T.some(t => placeCan(L, t.P, t.place)));
        const motivo = !hayMat(st, g) ? (matSolo ? 'molestia' : 'material') : (!libre && !conSitio) ? 'material' : porTiempo ? 'tiempo' : nov ? 'tope' : 'dias';
        st.warn.push({ c: 'vol_corto', p: { g, motivo, v: Math.round(v[g] * 10) / 10, obj: Math.round(o * 10) / 10 } }); }); }
  }
  // ¿hay algún ejercicio cuyo grupo principal sea g en los sitios de la rutina (material, seguridad y dificultad)?
  function hayMat(st, g) { st._mat = st._mat || {}; if (!(g in st._mat)) st._mat[g] = K.C.some(L => L.lt !== 'c' && mgV(L) === g && st.T.some(t => canDo(L, t, st, false))); return st._mat[g]; }
  // v5 (D-15): por qué sobra tiempo. inicio · prudente (modos con tope de ejercicios y series) · novato (principiante: se empieza en la parte
  // baja del rango) · rango (intermedio o avanzado con los grupos grandes de esos días en lo alto del rango, en el techo o sin material)
  // · tope (queda volumen por poner pero no cabe: tope de ejercicios, máximo de series o tope por sesión)
  function spareReason(st) {
    const { P } = st;
    if (P.inicio) return 'inicio';
    if (P.cauto) return 'prudente';
    if (LV[P.level] <= LV.P) return 'novato';
    const { v } = volume(st);
    // (a una serie del tope: con K < días, una serie más suma f a la semana)
    const tol = Math.max(0.75, st.f);
    // (el pecho tampoco puede crecer si tirón:empuje está en 1 y la espalda ya está en lo alto de su rango o en el techo: Kolber 2010)
    const espTopU = (LV[P.level] >= LV.I && !P.cauto && st.inp.min >= 60) ? st.tgt.topR.espalda : st.tgt.top.espalda;
    const pp = pushPull(st), espTop = v.espalda >= espTopU - tol - 1e-9 || v.espalda >= st.tgt.ceil.espalda - tol, teLleno = pp.ps + st.f > pp.pu + 1e-9 && espTop;
    // (y el hombro posterior solo crece con face pulls y pájaros, que también cargan la espalda: con la espalda arriba, tampoco)
    const topU = g => (LV[P.level] >= LV.I && !P.cauto && st.inp.min >= 60) ? st.tgt.topR[g] : st.tgt.top[g];   // v9 (J-15)
    // v9 (J-15): «lleno» = no cabe más sin pasarse del rango: si ningún ejercicio del grupo admite otra serie, el paso mínimo es un ejercicio
    // nuevo de 2 series (2 × f a la semana), no una serie
    // (por día: el relleno de ese día solo puede subir series de SUS ejercicios o añadir uno nuevo)
    const admite = (g, t) => act(t).some(h => h.id !== 'PW' && mgV(BY.get(h.x.lib)) === g && h.x.s < h.x.max && h.x.s < 6);
    const tolG = (g, t) => admite(g, t) ? tol : Math.max(tol, 2 * t.f);
    // (o, si el relleno de ese día ya no encontró nada que cupiera en los rangos, en lo alto del rango de siempre —objetivo × 1,3—: un
    // ejercicio que carga dos grupos no sube si uno de ellos ya está arriba)
    const full = (g, t) => v[g] >= topU(g) - tolG(g, t) - 1e-9 || (t.rellenoLleno && v[g] >= st.tgt.top[g] - tolG(g, t) - 1e-9) || v[g] >= st.tgt.ceil[g] - tol || !hayMat(st, g) || (g === 'pecho' && teLleno) || (g === 'hombro_post' && espTop)
      // v14 (P1): en un día de un solo grupo o en el único día de pierna, el músculo que ya toca el tope de 10 series por sesión (V9) no admite más ese día
      // (y el hombro posterior tampoco, si la espalda de ese día ya está en el tope: sus ejercicios también la cargan)
      || (DIA_ELEGIDO.includes(t.rb) && (sessVol(t, g) >= 10 - 1 - 1e-9 || (g === 'hombro_post' && sessVol(t, 'espalda') >= 10 - 1 - 1e-9)));
    // por día: un día corto con todos los grupos de su zona llenos tiene motivo («rango») aunque otro grupo de otro día esté corto
    st.T.forEach(t => { const spr = st.inp.min - dayMinutes(t, st); t.sobraMotivo = spr >= 1 ? (PBIG.filter(g => zoneOk(t, g) && st.tgt.t[g]).every(g => full(g, t)) ? 'rango' : 'tope') : null; });
    const lleno = st.T.filter(t => t.spare >= 8).every(t => t.sobraMotivo === 'rango');   // (el texto: solo los días con 8 min o más)
    // el texto «no hace falta más» habla de toda la rutina: además, ningún grupo grande con material por debajo de su objetivo
    const algunoBajo = PBIG.some(g => st.tgt.t[g] && v[g] < st.tgt.t[g] - 0.75 - 1e-9 && hayMat(st, g));
    return lleno && !algunoBajo ? 'rango' : 'tope';
  }
  // v5 (D-15): con tiempo sobrante, volumen hasta lo alto del rango bueno: intermedios y avanzados sin precaución, hasta objetivo × 1,3
  // (× 1,5 prioritario; en los pequeños, series directas hasta su objetivo); principiantes y modos prudentes, hasta su objetivo × 1,15
  // («empezar en la parte baja del rango», 05 §1.2); inicio, nada (2 series y 4-5 ejercicios en el primer ciclo, §E.1). Orden: +1 serie
  // a los principales, a los secundarios y a los accesorios y, por último, un accesorio nuevo del grupo que más lo necesita. Nunca pasa
  // de los minutos pedidos (sin el +5 %), del techo (V8), del tope por sesión (V9), del máximo de series, del tope de ejercicios, ni deja
  // tirón:empuje por debajo de 1 o rodilla:cadera fuera de 0,6-1,6.
  function fillSpare(st) {
    const { inp, P, tgt } = st;
    if (st.expres || st.corto || P.inicio) return;
    const IA = LV[P.level] >= LV.I && !P.cauto, cap = capOf(P, inp.min, inp.sesion);
    // v9 (J-15): con 60 min o más, hasta la parte alta del rango objetivo de 05 (topR) y, en los pequeños, directas hasta objetivo × 1,5
    const largo = IA && inp.min >= 60, topF = g => largo ? tgt.topR[g] : tgt.top[g];
    const lim = (g, vol) => {
      if (!tgt.t[g]) return 0;
      const c = tgt.ceil[g] - vol.v[g];
      // pequeños (ya reciben trabajo indirecto, 05 §1.2): en I/A, series directas hasta su objetivo sin pasar de objetivo × 1,5 en total
      if (PSMALL.includes(g)) return Math.min(c, IA ? Math.min(tgt.t[g] * (largo ? 1.5 : 1) - vol.dir[g], tgt.t[g] * (largo ? 2 : 1.5) - vol.v[g]) : tgt.t[g] * 1.15 - vol.v[g]);
      return Math.min(c, (IA ? topF(g) : tgt.t[g] * 1.15) - vol.v[g]);
    };
    // sitio para n series más de L: su grupo principal tiene objetivo y todos los grupos que L trabaja de forma DIRECTA siguen dentro de su
    // tope de relleno (lo indirecto solo mira el techo, que ya comprueba canAddSet/canAddEx)
    const roomFor = (L, n, vol, tf) => { const o = K.volV(L), g0 = mgV(L); if (!g0 || !tgt.t[g0]) return false; tf = tf || st.f;
      for (const g in o) { if (!tgt.t[g]) continue;
        if (o[g] === 1) { if (lim(g, vol) < n * tf - 1e-9) return false; }
        else if (PBIG.includes(g) && vol.v[g] + n * tf * o[g] > (IA ? topF(g) : tgt.t[g] * 1.15) + 0.5) return false; }   // v5: el 0,5 de un face pull a la espalda también cuenta
      return true; };
    // v12 (D10): con «más glúteo», en los días de torso el glúteo también es de la zona (solo abductores: ver build)
    const zoneF = (t, g) => zoneOk(t, g) || (g === 'gluteos' && t.gluZ);
    const hayTiron = pushPull(st).pu > 0; let pullTries = 0;
    const okBal = (L, n, tf) => {
      const pp = pushPull(st), add = n * (tf || st.f);
      if (isPush(L) && hayTiron && pp.pu + 1e-9 < pp.ps + add) return false;
      const kn = ['squat', 'lunge', 'knee_ext'].includes(L.pat), hp = ['hinge', 'hip_ext', 'knee_flex'].includes(L.pat);
      if (kn && pp.hp > 0 && (pp.kn + add) / pp.hp > 1.6 + 1e-9) return false;
      if (hp && pp.kn > 0 && pp.kn / (pp.hp + add) < 0.6 - 1e-9) return false;
      return true;
    };
    for (const t of st.T) {
      t.rellenoLleno = false;   // v9 (J-15): true si el relleno se para porque no cabe nada más dentro de los rangos (no por el tiempo ni por el tope de ejercicios)
      for (let it = 0; it < 40; it++) {
        if (inp.min - dayMinutes(t, st) < 1.5) break;
        const vol = volume(st);
        // 1. +1 serie (principales, secundarios, accesorios; a igualdad, el grupo con más sitio relativo y el ejercicio con menos series)
        const cs = [];
        act(t).forEach(h => { const L = BY.get(h.x.lib); if (h.id === 'PW' || h.x.s >= h.x.max || h.x.s >= 6) return; const g = mgV(L);
          if (!g || !tgt.t[g] || !zoneF(t, g) || !roomFor(L, 1, vol, t.f)) return;
          if (!canAddSet(st, t, h, 1, vol) || !okBal(L, 1, t.f)) return;
          cs.push({ h, r: ROLE_RANK[h.x.role] || 0, need: lim(g, vol) / tgt.t[g], bajo: vol.v[g] < tgt.t[g] - 0.75 ? (tgt.t[g] - vol.v[g]) / tgt.t[g] : 0 }); });
        // v5: primero lo que está por debajo de su objetivo (de más a menos déficit); después, por papel (principales, secundarios…) hasta lo alto del rango
        cs.sort((a, b) => b.bajo - a.bajo || a.r - b.r || b.need - a.need || a.h.x.s - b.h.x.s);
        let did = false;
        // v5: un empuje con sitio que solo frena tirón:empuje → antes, una serie de tirón (hombro posterior si tiene sitio; si no, remo o jalón):
        // con prioridad de pecho, la espalda sube con él (Kolber 2010); techo, tope por sesión y minutos sí se respetan
        if (!cs.length && pullTries < 8) { const blocked = act(t).some(h => { const L = BY.get(h.x.lib); const g = mgV(L); return isPush(L) && h.x.s < h.x.max && g && tgt.t[g] && (P.prioV.has(g) || vol.v[g] < tgt.t[g] - 0.75) && zoneOk(t, g) && roomFor(L, 1, vol, t.f) && canAddSet(st, t, h, 1, vol) && !okBal(L, 1, t.f); });
          if (blocked) { pullTries++; const pl = []; st.T.forEach(t2 => act(t2).forEach(h => { const L = BY.get(h.x.lib); if (isPull(L) && h.x.s < h.x.max && h.x.s < 6 && canAddSet(st, t2, h, 1, vol)) pl.push({ t2, h, rear: L.pat === 'rear' && lim('hombro_post', vol) >= st.f ? 0 : 1 }); }));
            pl.sort((a, b) => a.rear - b.rear || a.h.x.s - b.h.x.s); for (const { t2, h } of pl) { h.x.s++; if (dayMinutes(t2, st) <= inp.min + 1e-9) { did = true; st.log.push('rell_tiron'); break; } h.x.s--; }
            if (did) continue; } }
        for (const c of cs) { c.h.x.s++; if (dayMinutes(t, st) <= inp.min + 1e-9) { did = true; st.log.push('rell+:' + c.h.id); break; } c.h.x.s--; }
        if (did) continue;
        // 2. un accesorio nuevo (2 series) del grupo de la zona con más sitio relativo: primero un hueco de la plantilla, si no, uno de reserva
        if (nStr(t) >= cap) break;
        const gs = PG.filter(g => tgt.t[g] && zoneF(t, g) && lim(g, vol) >= 2 * t.f - 1e-9).sort((a, b) => lim(b, vol) / tgt.t[b] - lim(a, vol) / tgt.t[a]);
        for (const g of gs) {
          const tryH = h => { const x = h.x || fill(h, t, st, true); if (!x) return false; const L = BY.get(x.lib); if (mgV(L) !== g || !roomFor(L, 2, vol, t.f) || !canAddEx(st, t, L, 2, vol) || !okBal(L, 2, t.f)) return false;
            if (!h.x) h.x = fill(h, t, st); else st.used.add(h.x.lib); h.on = true; delete h.cut; delete h.cap; setPres(st, t, h); h.x.s = 2;
            if (dayMinutes(t, st) > inp.min + 1e-9) { h.on = false; st.used.delete(h.x.lib); h.x = null; h.cap = 1; return false; }
            return true; };
          let ok = false;
          for (const h of t.slots.filter(hh => !hh.on && !hh.empty && hh.grupo === g && hh.prio >= 2)) { if (tryH(h)) { ok = true; break; } }
          if (!ok) for (const sid of ((g === 'gluteos' && t.gluZ && !zoneOk(t, g)) ? ['AB'] : (RESERVA[g] || []))) { if (act(t).some(k => k.id === sid)) continue; const h = mkSlot(sid, 3, null, t.role + '#' + t.n + ':' + sid + ':s' + t.slots.length); h.reserva = 1; t.slots.push(h); if (tryH(h)) { ok = true; break; } t.slots.pop(); }
          if (ok) { did = true; st.log.push('rell_ej:' + g); break; }
        }
        if (!did) { t.rellenoLleno = true; break; }
      }
    }
  }

  // ════════ E.8 orden en la sesión ════════
  function sessionSeq(t, st) {
    const a = act(t), P = st.P, cc = ['CCA', 'CCB', 'CCC'].includes(t.rb);
    const pr = h => { const g = mainGroup(BY.get(h.x.lib)); return P.prioG.has(g) ? 0 : 1; };
    const isCore = h => h.id === 'CO' || ['core', 'core_iso', 'core_rot', 'carry'].includes(BY.get(h.x.lib).pat);
    const pw = a.filter(h => h.id === 'PW');
    const p1 = a.filter(h => h.prio === 1 && !isCore(h) && h.id !== 'PW');
    const famIdx = h => ({ rodilla: 0, empuje: 1, tiron: 2, cadera: 3 })[famOf(BY.get(h.x.lib))] ?? 4;
    // v2 (D-07): con «Ganar fuerza» (I/A), el levantamiento objetivo va siempre primero, también por delante del grupo prioritario (05 §4.1)
    const lift = h => (t.lift || []).includes(h.id) ? 0 : 1;
    p1.sort((x, y) => lift(x) - lift(y) || pr(x) - pr(y) || (cc ? famIdx(x) - famIdx(y) : 0) || t.slots.indexOf(x) - t.slots.indexOf(y));
    const rest = a.filter(h => !p1.includes(h) && !pw.includes(h) && !isCore(h));
    const multi = rest.filter(h => BY.get(h.x.lib).c), iso = rest.filter(h => !BY.get(h.x.lib).c);
    multi.sort((x, y) => (BY.get(x.x.lib).u ? 1 : 0) - (BY.get(y.x.lib).u ? 1 : 0) || pr(x) - pr(y) || t.slots.indexOf(x) - t.slots.indexOf(y));
    const big = h => BIG.includes(mainGroup(BY.get(h.x.lib))) ? 0 : 1;
    iso.sort((x, y) => pr(x) - pr(y) || big(x) - big(y) || t.slots.indexOf(x) - t.slots.indexOf(y));
    const core = a.filter(h => isCore(h) && !p1.includes(h));
    const coreP1 = p1.filter(isCore);
    return pw.concat(p1, multi, iso, coreP1, core);
  }
  function orderSessions(st) { st.T.forEach(t => { t.seq = sessionSeq(t, st); }); }

  // V5 (v2): veces por semana que se pide a cada familia = 2 (1 si el material solo da para una), pero nunca más que las sesiones
  // semanales de los días que entrenan esa zona (torso/pierna a 3 días: la pierna sale 1,5 veces por semana y no puede dar 2)
  const FAM_G = { rodilla: 'cuads', cadera: 'isquios', empuje: 'pecho', tiron: 'espalda' };
  // v7: familias que V5 no pide por una zona fuera («Me operaron» o lesión reciente): las mismas que exime validate()
  const V5_EXENTA = { rodilla: ['rodilla'], cadera: ['cadera'], lumbar: ['cadera'], hombro: ['empuje', 'tiron'], muneca: ['empuje'] };
  function v5need(st, f) {
    const { T, inp } = st;
    if (st.P.opZones.some(z => (V5_EXENTA[z] || []).includes(f))) return 0;   // v7 (C-16): si validate no la pide, el recorte tampoco la protege
    const avail = K.C.filter(L => famOf(L) === f && L.lt !== 'c' && T.some(t => canDo(L, t, st, false))).length;
    let base = inp.days >= 2 && avail >= 2 ? 2 : avail >= 1 ? 1 : 0;
    // v2 (D-18, extendido a 20 min): en sesiones de 20 min o menos no caben 9 ejercicios a la semana; rodilla y cadera ≥ 1, empuje y tirón ≥ 2
    if ((inp.min <= 20 || (st.P.segM && inp.min <= 30)) && (f === 'rodilla' || f === 'cadera')) base = Math.min(base, 1);   // v5: 65+ con 30 min = 20 de fuerza (v7: 5 de calentamiento y 5 de equilibrio; también «Prefiero no decirlo», C-14)
    // v5 (C-17): modo corto con 2 ejercicios (15 min con 65 o más o prudente): rodilla, cadera, empuje y tirón, ≥ 1 por semana
    if (st.P.corto) base = Math.min(base, 1);
    const zf = T.reduce((a, t) => a + (zoneOk(t, FAM_G[f]) ? t.f : 0), 0);
    return Math.min(base, zf);
  }
  // ════════ E.13 validaciones ════════
  function validate(st) {
    const hard = [], soft = [], { T, P, inp } = st;
    const letters = 'ABCDEF';
    if (T.length > 6) hard.push('V1:mas_de_6');
    T.forEach((t, i) => {
      const L0 = letters[i];
      const strs = act(t);
      const seen = new Set();   // v8 (J-12, J-22): la unicidad es por día; en la semana, un ejercicio puede repetirse
      strs.forEach(h => { const L = BY.get(h.x.lib);
        if (seen.has(L.id)) hard.push('V2:repetido:' + L.id); seen.add(L.id);
        if (!placeCan(L, t.P, t.place)) hard.push('V3:material:' + L0 + ':' + L.id);
        if (!safe(L, st)) hard.push('V3:filtro:' + L0 + ':' + L.id);
        if (!difOk(L, P, false)) hard.push('V3:dificultad:' + L0 + ':' + L.id);
        if (!(h.x.s >= 1 && h.x.s <= 6)) hard.push('V6:series:' + L.id);
        if (L.lt === 't' ? !/^\d+s$/.test(h.x.r) : L.lt === 'd' ? !/^\d+(\s*m)?$/.test(String(h.x.r)) : !(typeof h.x.r === 'number' && h.x.r > 0)) hard.push('V6:reps:' + L.id);
      });
      if (strs.length < (P.corto ? 2 : 3)) hard.push('V4:menos_de_3:' + L0);   // v5 (C-17): modo corto, 2 o 3 ejercicios según quepan
      // v5 (C-04, C-05): V9 · ≤ 10 series fraccionales por grupo (de planificación) y sesión
      PG.forEach(g => { const sv = sessVol(t, g); if (sv > 10 + 1e-9) hard.push('V9:' + L0 + ':' + g + ':' + sv); });
      if (strs.length > 8) hard.push('V4:mas_de_8:' + L0);
      [t.warm, t.cardio].forEach(c => { if (c && !placeCan(BY.get(c.lib), t.P, t.place)) hard.push('V3:cardio:' + L0 + ':' + c.lib); });
    });
    if (T.length < 2 || T.length > inp.days) hard.push('V7:K');
    // V5 cobertura semanal (veces por semana)
    const cnt = { rodilla: 0, cadera: 0, empuje: 0, tiron: 0, core: 0 };
    T.forEach(t => act(t).forEach(h => { const f = famOf(BY.get(h.x.lib)); if (f) cnt[f] += t.f; }));
    const exempt = new Set(); P.opZones.forEach(z => { ({ rodilla: ['rodilla'], cadera: ['cadera'], lumbar: ['cadera'], hombro: ['empuje', 'tiron'], muneca: ['empuje'] }[z] || []).forEach(f => exempt.add(f)); });
    for (const f of ['rodilla', 'cadera', 'empuje', 'tiron']) {
      if (exempt.has(f)) continue;
      const need = v5need(st, f);
      if (cnt[f] + 1e-9 < need) hard.push('V5:' + f + ':' + cnt[f].toFixed(1) + '<' + need);
    }
    if (cnt.core < 1 && !P.sinAbs && K.C.some(L => famOf(L) === 'core' && T.some(t => canDo(L, t, st, false)))) { if (inp.min <= 20) soft.push('S:core_corto'); else hard.push('V5:core'); }
    // v5 (C-04, C-05): V8 · techo semanal en series fraccionales por grupo de planificación
    const { v } = volume(st);
    PG.forEach(g => { if (v[g] > st.tgt.ceil[g] + 1e-9) hard.push('V8:' + g + ':' + Math.round(v[g] * 10) / 10 + '>' + st.tgt.ceil[g]); });
    // blandas
    PBIG.forEach(g => { if (v[g] < 4 - 1e-9) soft.push('S:grande<4:' + g); });
    T.forEach((t, i) => { if (dayMinutes(t, st) > inp.min * 1.05 + 1e-9) soft.push('S:minutos:' + letters[i]); });
    T.forEach(t => t.slots.forEach(h => { if (h.empty && !h.sust && h.prio <= 2) soft.push('S:hueco_vacio:' + h.id); }));
    const pp = pushPull(st); if (pp.ps > 0 && pp.ratio < 1 - 1e-9) soft.push('S:tiron_empuje:' + pp.ratio.toFixed(2));
    if (pp.hp > 0 && pp.kn > 0 && (pp.rh < 0.6 || pp.rh > 1.6)) soft.push('S:rodilla_cadera:' + pp.rh.toFixed(2));
    for (const [a, b] of TWINS) { const ta = T.find(t => t.rb === a), tb = T.find(t => t.rb === b); if (ta && tb && Math.abs(dayMinutes(ta, st) - dayMinutes(tb, st)) > 10) soft.push('S:gemelas:' + a + b); }
    const softTypes = [...new Set(soft.map(s => s.split(':')[1]))];   // ISSUE-blandas: se cuentan por tipo
    return { hard, soft: softTypes, softAll: soft };
  }

  // ════════ salida (E.0) y explicaciones (E.15) ════════
  const zLbl = z => ({ rodilla: 'rodilla', hombro: 'hombro', lumbar: 'espalda baja', muneca: 'muñeca o codo', cadera: 'cadera', otra: 'otra zona' })[z] || z;
  function focusOf(t, st) {
    const seq = t.seq || sessionSeq(t, st);
    const nm = NOMBRE_DIA[t.rb];
    if (nm === 'Cuerpo completo') {
      const w = h => { const L = BY.get(h.x.lib); const p = L.pat;
        if (p === 'squat') return 'sentadilla'; if (p === 'lunge') return 'zancada'; if (p === 'hinge') return /good_morning/.test(L.id) ? 'bisagra' : 'peso muerto'; if (p === 'hip_ext') return /thrust/.test(L.id) ? 'hip thrust' : 'puente';
        if (p === 'push_h') return L.mat === 'corporal' ? 'flexiones' : 'press'; if (p === 'push_v') return 'press de hombros'; if (p === 'pull_v') return /pullup|chinup/.test(L.id) ? 'dominadas' : 'jalón'; if (p === 'pull_h') return 'remo'; if (p === 'rear') return 'espalda alta';
        return null; };
      const ws = []; seq.filter(h => h.prio === 1).forEach(h => { const x = w(h); if (x && !ws.includes(x)) ws.push(x); });
      return nm + ' — ' + joinY(ws.slice(0, 3));
    }
    const vol = {}; act(t).forEach(h => { const L = BY.get(h.x.lib); GROUPS.forEach(g => { vol[g] = (vol[g] || 0) + h.x.s * frac(L, g); }); });
    const gs = GROUPS.filter(g => vol[g] >= 2 && zoneOk(t, g)).sort((a, b) => vol[b] - vol[a]).slice(0, 3).map(g => K.GLBL[g].toLowerCase());
    return nm + ' — ' + joinY(gs);
  }
  const joinY = a => a.length <= 1 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' y ' + a[a.length - 1];
  // E14a (§K.3): el bloque de equilibrio con ejercicios del catálogo. 3 min: a una pierna y talones y puntas; 5: a una pierna, pasos en
  // línea y girando la cabeza; 8: los cuatro (talones y puntas para empezar). min = su parte del bloque (suman los minutos del bloque).
  const BAL_SEQ = { 3: [['balance_single_leg', 2, '20s', 1.5], ['balance_heel_toe', 2, 12, 1.5]],
    5: [['balance_single_leg', 2, '20s', 2], ['balance_tandem_walk', 2, 10, 1.5], ['balance_head_turns', 2, '20s', 1.5]],
    8: [['balance_heel_toe', 2, 12, 1.5], ['balance_single_leg', 2, '30s', 2.5], ['balance_tandem_walk', 3, 10, 2], ['balance_head_turns', 2, '20s', 2]] };
  function balanceRows(t) {
    const m = t.balance.min, seq = BAL_SEQ[m] || BAL_SEQ[m >= 8 ? 8 : m >= 5 ? 5 : 3];
    return seq.filter(([id]) => BY.has('lib_' + id)).map(([id, s, r], i, arr) => {
      const L = BY.get('lib_' + id), share = arr[i][3];
      const nota = [i === 0 ? 'equilibrio · junto a una pared o una silla' : null, L.u ? 'por lado' : null, i === arr.length - 1 ? 'Cuando te salgan fáciles, toca la pared solo con un dedo.' : null].filter(Boolean).join(' · ');
      return { lib: L.id, n: L.n, series: s, reps: typeof r === 'string' ? parseInt(r) + ' s' : String(r), r, descanso_s: 15, kind: 'bal', min: share, pat: L.pat, mat: L.mat, u: !!L.u, nota };
    });
  }
  function finish(st, tried) {
    const { T, P, inp } = st, letters = 'ABCDEF', days = {}, det = [];
    T.forEach((t, i) => {
      const k = letters[i], ex = [], rows = [];
      if (t.warm) { ex.push({ lib: t.warm.lib, s: 1, r: t.warm.min + ' min', note: t.warm.nota }); rows.push({ lib: t.warm.lib, n: BY.get(t.warm.lib).n, series: 1, reps: t.warm.min + ' min', descanso_s: null, nota: 'calentamiento' + (t.warm.nota ? ' · ' + t.warm.nota : ''), kind: 'warm', min: t.warm.min }); }
      // v7 (C-09): bloque de equilibrio de 5-8 min con ejercicios que progresan, siempre junto a una pared o una silla. E14a (§K.3): con los
      // del catálogo (patrón «bal»: no cuentan volumen y el Coach los registra); antes era una fila de texto
      if (t.balance) for (const x of balanceRows(t)) { ex.push({ lib: x.lib, s: x.series, r: x.r, note: x.nota }); rows.push(x); }
      for (const h of (t.seq || sessionSeq(t, st))) {
        const L = BY.get(h.x.lib), x = h.x; ex.push({ lib: L.id, s: x.s, r: x.r, note: x.notes.filter(n => !/^sin rango/.test(n)).join(' ') || undefined });
        const rr = repRange(L, x.r);
        const repsTxt = typeof x.r === 'string' ? (/s$/.test(x.r) ? parseInt(x.r) + ' s' : x.r) : rr ? rr.lo + '-' + rr.hi : String(x.r);
        const nota = [h.id === 'CO' ? 'core' : null, L.u ? 'unilateral: por lado' : null, ...x.notes.filter(n => !/^sin rango/.test(n)), porQue(L, h, x, st)].filter(Boolean).join(' · ');
        rows.push({ lib: L.id, n: L.n, series: x.s, reps: repsTxt, r: x.r, descanso_s: restOf(L, x, st), nota, kind: 'str', slot: h.id, prio: h.prio, role: x.role, pat: L.pat, mat: L.mat, dif: L.dif, u: !!L.u, c: !!L.c, cuidado: x.cuidado || null, pass: x.pass, oi: x.oi, strict: x.strict, key: h.key });
      }
      if (t.cardio) { ex.push({ lib: t.cardio.lib, s: 1, r: t.cardio.min + ' min' }); rows.push({ lib: t.cardio.lib, n: BY.get(t.cardio.lib).n, series: 1, reps: t.cardio.min + ' min', descanso_s: null, nota: 'cardio final', kind: 'cardio', min: t.cardio.min }); }
      const label = 'Día ' + k, focus = focusOf(t, st);
      days[k] = { label, focus, ex };
      det.push({ letra: k, role: t.rb, place: t.place, preset: t.P && t.P.preset, ligero: !!t.light, nombre: label + ' · ' + focus, minutos: Math.round(dayMinutes(t, st) + (t.cardio && t.cardio.fijo ? t.cardio.min : 0)), minExact: dayMinutes(t, st), sobraMotivo: t.sobraMotivo || null, rows, empty: t.slots.filter(h => h.empty && !h.sust && h.prio <= 2).map(h => h.id) });
    });
    const vol = volume(st), pp = pushPull(st);
    // v15 (T1): el resumen de la sesión, con la rutina final: lo que enseña la tarjeta del tipo es esto mismo (minutos de un día medio,
    // redondeados a 5; ejercicios de fuerza por día; si hay bíceps y tríceps directos, abdominales y cardio final)
    const nEj = det.map(d => d.rows.filter(r => r.kind === 'str').length), filas = det.flatMap(d => d.rows);
    const sesion = { tipo: inp.sesion || null, min: Math.round(det.reduce((x, d) => x + d.minutos, 0) / det.length / 5) * 5, ej: nEj, ejMin: Math.min(...nEj), ejMax: Math.max(...nEj),
      biceps: vol.dir.biceps > 0, triceps: vol.dir.triceps > 0, sinAbs: !!P.sinAbs, absFijo: !!P.absFijo, abs: filas.some(r => r.kind === 'str' && CORE_PATS.includes(r.pat)), cardio: Math.max(0, ...filas.filter(r => r.kind === 'cardio').map(r => r.min)) };
    // ── v7 (paso 4): por qué y avisos de seguridad y modos, con la rutina final ──
    const why2 = [], warn2 = [];
    // D-22: «No incluyo el jalón tras nuca…» solo si la persona lo hacía (historial o favorito): si no, es ruido
    { const r0 = [...TAGS.nogen].find(id => (st.ctx.hist[id] && st.ctx.hist[id].n >= 1) || st.ctx.fav.has(id)); if (r0) why2.push({ c: 'risk', p: { id: r0 } }); }
    if (P.mayorExp) why2.push({ c: 'mayor_exp', p: { dias: P.wd } });                                    // C-07
    if (inp.paron && inp.paron.fuera === 'gt2a') why2.push({ c: 'paron_largo' });                         // I-4
    else if (P.vuelta) why2.push({ c: 'vuelta', p: { fuera: inp.paron && inp.paron.fuera } });          // C-02 (la rampa de pesos es del Coach)
    if (inp.subeNivel) why2.push({ c: 'nivel_efectivo', p: inp.subeNivel });                             // I-3
    if (inp.goal === 'fuerza' && P.cauto) why2.push({ c: 'fuerza_general' });                            // C-27
    if (inp.inactivo && inp.salud) warn2.push({ c: 'consulta_inactivo' });                               // C-10
    if (P.huesos) warn2.push({ c: 'huesos' });                                                            // C-13
    if (P.posparto) warn2.push({ c: 'posparto' });                                                        // C-12
    Object.keys(P.zones).filter(z => P.zones[z] === 'reciente').forEach(z => warn2.push({ c: 'reciente', p: { z } }));   // C-16
    if (P.zones.otra) warn2.push({ c: 'otra_zona', p: { tipo: P.zones.otra } });                         // C-15
    // (con días seguidos y cuerpo completo al final —65+ o prudente por material—, el aviso de días alternos)
    if (inp.consec && ['cc2', 'cc3'].includes(st.opt.id) && P.wd >= 3 && !st.opt.warn.some(w => w.c === 'alternos')) warn2.push({ c: 'alternos' });
    // v14 (P6): una semana montada día a día que se queda sin una zona (ningún ejercicio de pierna, de empuje o de tirón): no se impide, se dice
    const aMedida = st.opt.why.some(w => w.c === 'a_medida') && st.opt.id === st.opt.table;
    if (aMedida) { const hay = pats => T.some(t => act(t).some(h => pats.includes(BY.get(h.x.lib).pat)));
      const sin = [['pierna', ['squat', 'lunge', 'hinge', 'hip_ext']], ['empuje', ['push_h', 'push_v']], ['tiron', ['pull_h', 'pull_v']]].filter(([, p]) => !hay(p)).map(([z]) => z);
      if (sin.length) warn2.push({ c: 'semana_sin', p: { z: sin } }); }
    // C-01: objetivo de esfuerzo por modo, para que el Coach lea las caritas RESPECTO de él (ver 40-simulacion.md, cambio 42)
    const effort = P.cauto ? { obj: 'facil', rir: '3 o más', subidas: 'lenta', ultimaAlLimite: false } : { obj: 'justo', rir: LV[P.level] <= LV.P || P.menor ? '2-3' : '1-2', subidas: 'normal', ultimaAlLimite: false };   // v9 (J-11): 16-17, dejando 2 o más
    // C-07, C-08, §G.5: lo que el Coach propone al cerrar el primer ciclo (no se aplica solo)
    const rampa = P.mayor ? { cuando: 'cierre_ciclo_1', series: P.mayorExp ? null : 3, reps: '8-12', esfuerzo: 'justo', rir: 'unas 2', donde: 'maquinas_y_estables', nuncaAlLimite: true }
      : P.inicio ? { cuando: 'cierre_ciclo_1', series: 3, esfuerzo: LV[P.level] <= LV.P ? 'facil_justo' : 'justo' } : null;
    // C-02 / I-4: para el Coach de carga, qué hacer con los pesos de antes del parón (más de 6 meses: sin peso propuesto; 2-6 meses: −20 %)
    const vuelta = inp.paron ? { fuera: inp.paron.fuera || null, pesos: inp.paron.fuera === '2a6m' ? 'menos20' : 'recalibrar', subirNivel: !!P.vuelta } : null;
    const meta = { split: st.opt.id, K: T.length, tpl: Object.fromEntries(T.map((t, i) => [letters[i], t.rb])), dayPlace: Object.fromEntries(T.map((t, i) => [letters[i], t.place])),
      effort, rampa, vuelta, kMotivo: st.opt.kMotivo || null, balMin: st.balMin || 0, cargaLigera: st.cargaLigera || 0, cardioRelleno: !!st.cardioRelleno,
      fz2: st.opt.id === 'fz2' ? { gym: st.opt.why.find(w => w.c === 'fuerza_2sitios').p.gym, casa: st.opt.why.find(w => w.c === 'fuerza_2sitios').p.casa } : null,
      seguridad: { prudente: !!P.prud, filtrosMayor: !!P.segM, mayorExp: !!P.mayorExp, huesos: !!P.huesos, posparto: !!P.posparto, zonasFuera: P.opZones, sinSuelo: !!P.noFloor, sinImpacto: !!P.noImpact },
      rest: { iso: st.rest.iso, comp: st.rest.comp, heavy: st.rest.heavy }, est: Object.fromEntries(det.map(d => [d.letra, d.minutos])),
      // v5: por grupo de planificación (deltoides por cabezas), cuenta fraccional por patrón; tope = lo alto del rango bueno
      vol: Object.fromEntries(PG.map(g => [g, { v: Math.round(vol.v[g] * 10) / 10, dir: Math.round(vol.dir[g] * 10) / 10, obj: Math.round(st.tgt.t[g] * 10) / 10, tope: Math.round(st.tgt.top[g] * 10) / 10, techo: Math.round(st.tgt.ceil[g] * 10) / 10 }])),
      corto: st.corto || 0,
      ratio: { tiron_empuje: Math.round(pp.ratio * 100) / 100, rodilla_cadera: Math.round(pp.rh * 100) / 100 },
      why: st.why.concat(st.opt.why, why2), warn: st.warn.concat(st.opt.warn, warn2), seed: st.seed, alt: st.ctx.alt, modes: [...P.M], level: P.level, lvS: P.lvS, wd: P.wd, f: st.f, fd: Object.fromEntries(T.map((t, i) => [letters[i], t.f])),
      validate: st.v, tried, cut: st.cut, removed: st.removed, alternas: st.opt.alternas, table: st.opt.table, rec: st.opt.rec || st.opt.table, roles: aMedida ? T.map(t => tipoDe(t.rb)) : null,   // (P6) el tipo de cada día, si la semana se montó día a día
      plan: st.opt.why.some(w => w.c === 'a_medida') ? st.opt.table : inp.plan || (st.opt.rec && st.opt.table !== st.opt.rec && st.opt.why.some(w => w.c === 'mas_torso') ? st.opt.table : null),   // plan: el reparto pedido (en la hoja o con «Más torso»)
      log: st.log, reparto: OPT.reparto, capP: !!P.capP, sesion,
      lifts: Object.fromEntries(T.map((t, i) => [letters[i], (t.lift || []).map(id => { const h = t.slots.find(k => k.id === id && k.prio === 1 && k.on && k.x); return h ? h.x.lib : null; }).filter(Boolean)])) };
    const ok = st.v.hard.length === 0;
    return { ok, reason: ok ? null : st.v.hard, days, weeklyTarget: P.wd, meta, det };
  }
  function porQue(L, h, x, st) {
    const tm = x.tm || {}; const P = st.P;
    // v2: la zona del texto es la de la lista «amable» que contiene el ejercicio (antes, la primera zona marcada: D-22)
    // v7 (C-23): «Elegido por tu rodilla» en vez de «Amable con…», que roza «seguro para tu lesión» (§I.6); la nota «con cuidado» ya dice el rango
    if (tm.amable) return 'Elegido por tu ' + zLbl(tm.amable) + '.';
    // v2: «En lugar de…» también cuando un hueco 1 se cubre con su patrón secundario, y con el motivo real (material o molestia)
    if (x.pass === 'near' || (h.prio === 1 && x.oi > 0)) {
      // ¿el material permitía algún ejercicio del menú propio del hueco? Si sí, lo quitó la seguridad o el nivel; si no, el material
      const t = st.T.find(tt => tt.slots.includes(h));
      // v10 (J-19): por qué no salió el patrón propio del hueco: material, molestia (seguridad), nivel (dificultad) o, si no, sin motivo que dar
      const own = t ? menuOf(h, st.cls).filter(e => e.kind === 'own' && e.sec === 0).map(e => BY.get(e.id)).filter(Boolean) : [];
      const conMat = own.filter(E => placeCan(E, t.P, t.place)), hayMat = conMat.length > 0;
      const porZona = conMat.some(E => { const w = []; safe(E, st, w); return w.some(x => /^(lim|op|hombro_ahora|rodilla_ahora|impacto|columna|huesos|apoyo|mayor|colgado|huesos_remo|prudente)/.test(x)); });
      const porNivel = conMat.some(E => safe(E, st) && !difOk(E, st.P, false));
      const motivo = !hayMat ? ': con tu material no hay, así que este.' : porZona ? ': por tu molestia o tu seguridad, este.' : porNivel ? ': por tu nivel, este.' : ', este.';
      return 'En lugar de ' + ({ SQ: 'una sentadilla', LU: 'una zancada', HI: 'una bisagra', HE: 'un puente o hip thrust', KF: 'un curl femoral', KE: 'una extensión de cuádriceps', CA: 'un gemelo', PH: 'un press', PI: 'un press inclinado', PV: 'un press de hombros', FL: 'unas aperturas', TV: 'un jalón', TH: 'un remo', RA: 'una elevación lateral', RE: 'un ejercicio de hombro posterior', CU: 'un curl', TR: 'un tríceps', CO: 'un ejercicio de core', PW: 'un explosivo', AB: 'un abductor' }[h.id] || 'otro') +
        motivo;
    }
    if (tm.prioridad) return 'Para tu prioridad: ' + K.GLBL[mainGroup(L)].toLowerCase() + '.';
    if (tm.levantamiento && tm.levantamiento > 0) return 'Levantamiento básico de fuerza.';
    if (tm.estabilidad > 0) return 'Estable y fácil de aprender.';
    if (h.prio === 1) { const gs = GROUPS.filter(g => frac(L, g) === 1).map(g => K.GLBL[g].toLowerCase()); return 'Base del día: ' + joinY(gs.slice(0, 2)) + '.'; }
    return null;
  }
  return { genRoutine, desdeRespuestas, effective, volumeTargets, repRange, mainGroup, frac, GEN_VERSION, fnv1a, canon, SLOT, TPL, LIFT, heavyOk, famOf, planes, formaInicial, reordenar, otroDia, tipoDe, repartoDeTipos, TIPO_TPL, SPLITS, UNA_PIERNA, NOMBRE_DIA, LEG_TPL, safeL: (L, inp) => safe(L, { inp, P: effective(inp) }), clsOf, OPT, SESION, sesionDe, cardioDef };
};

})();
