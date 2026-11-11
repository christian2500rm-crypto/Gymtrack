const _catalogo = (function () {
// Catálogo + etiquetas de §K.1 + presets de material (§C P5-P6) + placeCan (§E.4) de 20-propuesta.md.
// Solo lectura sobre catalog.json. Uso: const K = require('./catalogo.js')(rutaOpcional)


// ── PAT_NEAR de la app (index.html:9941) ──
const PAT_NEAR = { squat: ['knee_ext', 'lunge'], knee_ext: ['squat'], knee_flex: ['hinge'], hinge: ['knee_flex', 'hip_ext'], push_h: ['fly'], fly: ['push_h'], push_v: ['raise', 'push_h'],
  raise: ['push_v', 'raise_f'], raise_f: ['raise', 'push_v'], rear: ['pull_h', 'raise'], pull_v: ['pull_h'], pull_h: ['pull_v', 'rear'], core: ['core_iso'], core_iso: ['core', 'carry'],
  lunge: ['squat', 'hinge'], hip_ext: ['hinge'], shrug: ['pull_h'], forearm: ['curl'], core_rot: ['core', 'core_iso'], carry: ['core_iso'], plyo: ['squat', 'lunge'], full: ['squat', 'hinge'], bal: [] };

// ── MM_GROUPS (index.html:16608) y grupos de planificación (§E.3: espalda sin lumbares) ──
const GROUPS = ['pecho', 'espalda', 'hombros', 'biceps', 'triceps', 'abdomen', 'cuads', 'isquios', 'gluteos', 'gemelos'];
const GMUS = { pecho: ['pecs', 'upperpecs', 'lowerpecs'], espalda: ['lats', 'midback', 'traps'], hombros: ['frontdelts', 'sidedelts', 'reardelts'], biceps: ['biceps'], triceps: ['triceps'],
  abdomen: ['abs', 'obliques'], cuads: ['quads'], isquios: ['hams'], gluteos: ['glutes', 'abductors'], gemelos: ['calves'] };
const GMUS_MAPA = Object.assign({}, GMUS, { espalda: ['lats', 'midback', 'traps', 'lowback'] }); // la cuenta del mapa de la app
const GLBL = { pecho: 'Pecho', espalda: 'Espalda', hombros: 'Hombros', biceps: 'Bíceps', triceps: 'Tríceps', abdomen: 'Abdomen', cuads: 'Cuádriceps', isquios: 'Isquios', gluteos: 'Glúteos', gemelos: 'Gemelos' };
const BIG = ['pecho', 'espalda', 'hombros', 'cuads', 'isquios', 'gluteos'];
const SMALL = ['biceps', 'triceps', 'gemelos', 'abdomen'];

// ── Etiquetas (§K.1). Las que la propuesta da con cifras se derivan con la heurística de 02 (sim.js/lesion.js) ──
const NOGEN = ['lat_pulldown_behind', 'upright_row_bb', 'upright_row_cable', 'upright_row_db', 'good_morning', 'decline_situp', 'kb_windmill', 'sissy_squat',
  'rack_pull', 'power_clean', 'power_snatch', 'push_press', 'kb_snatch', 'snatch_db', 'thruster_bb', 'tire_flip', 'muscle_up',
  'chair_stand_fast'];   // E14a (§K.3): potencia para 65 o más, solo por propuesta del Coach (§G.5)
const ALSO_KB = ['overhead_ext_db', 'suitcase_carry_db', 'single_leg_rdl_db', 'db_swing', 'woodchop_db', 'crunch_db', 'side_bend_db', 'russian_twist_db', 'glute_bridge_db',
  'hip_thrust_db', 'sumo_squat_db', 'calf_raise_single_db', 'snatch_db', 'kickback_db', 'leg_curl_db', 'calf_seated_db', 'preacher_curl_db'];
const POLEAS2 = ['cable_fly_low', 'cable_fly_high', 'cable_fly_mid', 'cable_chest_press', 'rear_fly_cable', 'y_raise_cable', 'curl_cable_high'];
// 13 familias de máquina (42/42) y 9 tipos de cardio (11)
const MFAM = { prensa: ['leg_press', 'hack_squat', 'pendulum_squat', 'vsquat', 'belt_squat', 'leg_press_single', 'calf_leg_press'], extension: ['leg_ext'],
  curlfem: ['leg_curl', 'leg_curl_seated', 'leg_curl_standing', 'ghr'], abdaduct: ['hip_abductor', 'hip_adductor'], gemelos: ['calf_machine', 'calf_seated'],
  gluteo: ['glute_kickback_machine', 'hip_thrust_machine'], lumbares: ['hyperextension', 'back_ext_machine'],
  jalonremo: ['lat_pulldown', 'row_machine', 'pulldown_close', 'pulldown_supine', 'pulldown_machine_uni', 'assisted_pullup', 'pullover_machine', 'lat_pulldown_behind', 'tbar_row_supported', 'row_machine_high'],
  pecho: ['chest_press_machine', 'chest_press_incline_machine', 'assisted_dip', 'dip_machine'], contractora: ['fly_machine', 'rev_fly_machine'],
  hombro: ['shoulder_press_machine', 'lat_raise_machine'], brazos: ['curl_machine', 'tricep_machine'], abdominales: ['crunch_machine', 'torso_rotation_machine'] };
const CKIND = { cinta: ['cardio_walk', 'cardio_run', 'cardio_treadmill_run'], bici: ['cardio_bike'], reclinada: ['cardio_recumbent'], spinning: ['cardio_spinning'],
  bici_aire: ['cardio_air_bike'], eliptica: ['cardio_elliptical'], remo: ['cardio_rower'], escaladora: ['cardio_stair_machine'], esqui: ['cardio_ski_erg'] };
// Flexión o rotación de columna con carga (fuera con 65 o más), ≈ 8
// v5 del catálogo (paso 4, D-01): las 16 de SPINE_AMPLIADA de matriz.js (faltaban crunch con disco, inclinación lateral, leñadores, rotaciones
// con landmine o máquina y lanzamiento rotacional). La usan 65 o más, «Prefiero no decirlo» (C-14), huesos frágiles (C-13) y posparto (C-12).
const SPINE = ['situp', 'v_up', 'russian_twist_db', 'plate_russian_twist', 'mb_russian_twist', 'crunch_cable', 'crunch_machine', 'crunch_db',
  'plate_crunch', 'side_bend_db', 'woodchop_db', 'woodchop_high_cable', 'woodchop_low_cable', 'landmine_rotation', 'torso_rotation_machine', 'mb_rot_throw'];
// v5 (paso 4, C-13): flexión o giro de columna repetidos SIN carga externa; fuera también con huesos frágiles (Giangregorio 2014, «Too Fit To
// Fracture»: evitar abdominales en flexión y giros; 05 §7.4). Con 65 o más no hace falta: su menú de core es antiextensión y antirrotación.
const SPINE_FLEX = ['crunch', 'bicycle_crunch', 'russian_twist_bw', 'ball_crunch', 'reverse_crunch', 'heel_touch', 'ball_pass', 'hanging_knee_raise', 'leg_raise', 'standing_knee_elbow'];
// Básicos (§K.1: «≈ 40: sentadillas, prensa, hack; pesos muertos y rumanos; presses de banca, inclinado y militar; dominadas y jalón; remos»).
// Derivado de esa descripción: solo con carga o dominadas (el prototipo de ciencia incluía air_squat, pushup, inverted_row_table, band_row y trx_row: ver issue)
const BASIC = ['back_squat', 'front_squat', 'squat_smith', 'goblet_squat', 'squat_db', 'kb_goblet_squat', 'leg_press', 'hack_squat',
  'deadlift', 'trap_bar_deadlift', 'sumo_deadlift', 'rdl_bb', 'rdl_db', 'rdl_smith', 'kb_deadlift', 'deadlift_db',
  'bench_press', 'press_flat_db', 'chest_press_machine', 'bench_smith', 'incline_bench_bb', 'press_incline_db', 'press_incline_smith', 'chest_press_incline_machine',
  'ohp_bb', 'shoulder_press_db', 'shoulder_press_machine', 'ohp_smith',
  'pullup', 'chinup', 'pullup_neutral', 'lat_pulldown', 'assisted_pullup',
  'bb_row', 'row_cable', 'row_db', 'row_machine', 'tbar_row_supported', 'row_incline_db', 'row_bent_db', 'yates_row', 'tbar_row_landmine', 'row_smith'];
// La lista del prototipo de ciencia (para comparar)
const BASIC_CIENCIA = ['back_squat', 'squat_smith', 'leg_press', 'hack_squat', 'goblet_squat', 'squat_db', 'air_squat', 'kb_goblet_squat', 'front_squat',
  'deadlift', 'trap_bar_deadlift', 'rdl_bb', 'rdl_db', 'kb_deadlift', 'deadlift_db', 'bench_press', 'press_flat_db', 'chest_press_machine', 'pushup', 'press_incline_db',
  'chest_press_incline_machine', 'incline_bench_bb', 'ohp_bb', 'shoulder_press_db', 'shoulder_press_machine', 'pullup', 'lat_pulldown', 'chinup', 'assisted_pullup', 'pullup_negative',
  'bb_row', 'row_cable', 'row_db', 'row_machine', 'tbar_row_supported', 'inverted_row_table', 'band_row', 'trx_row'];
const LONG = ['rdl_db', 'rdl_bb', 'rdl_smith', 'stiff_leg_deadlift', 'single_leg_rdl_db', 'kb_sl_rdl', 'leg_curl_seated', 'tricep_overhead_cable', 'overhead_ext_db', 'overhead_ext_ez',
  'band_tricep_overhead', 'curl_incline_db', 'bayesian_curl_cable', 'pullover_db', 'pullover_machine', 'straight_arm_pulldown_cable', 'fly_db', 'fly_incline_db', 'cable_fly_low',
  'bulgarian_squat_db', 'bulgarian_smith', 'split_squat_db', 'pendulum_squat', 'hack_squat', 'calf_machine', 'calf_raise_db'];
// Listas «amables» por zona (§E.5: ≈ 8 ids; la propuesta solo da la de rodilla). Las demás son de este prototipo (ver issues)
const AMABLE = {
  rodilla: ['leg_press', 'chair_squat', 'wall_sit', 'glute_bridge', 'hip_thrust_bb', 'hip_thrust_machine', 'leg_curl_seated', 'leg_curl'],
  hombro: ['face_pull', 'band_ext_rotation', 'ext_rotation_cable', 'row_cable', 'row_machine', 'landmine_press', 'chest_press_machine', 'floor_press_db'],
  lumbar: ['leg_press', 'hip_thrust_machine', 'glute_bridge', 'bird_dog', 'dead_bug', 'pallof_press_cable', 'row_incline_db', 'tbar_row_supported'],
  muneca: ['chest_press_machine', 'row_machine', 'lat_pulldown', 'hammer_curl', 'shoulder_press_machine', 'leg_press', 'leg_ext', 'dead_bug'],
  cadera: ['glute_bridge', 'hip_thrust_machine', 'leg_curl_seated', 'leg_ext', 'leg_press', 'side_lying_abd', 'clamshell', 'bird_dog'],
};
// Unilaterales de pierna «con apoyo» (65 o más: obligatorio con apoyo; 75 o más: −1 a los que no lo tienen). Derivado aquí (ver issues)
// v5 (paso 4, D-02): «con apoyo» = sin carga en las manos (una mano libre para la pared o la silla) o guiado (prensa, Smith, TRX):
// fuera la subida, la zancada atrás y la sentadilla dividida con mancuernas
const APOYO = ['step_up_bw', 'reverse_lunge_bw', 'leg_press_single', 'lunge_smith', 'bulgarian_smith', 'trx_lunge', 'box_lateral_step_down', 'leg_curl_standing', 'glute_kickback_machine', 'glute_kickback_cable'];
// Tríceps: «fondos, flexión diamante» (§E.6) y bíceps: «pull_v supino»
const TR_EXTRA = ['dip_bars', 'bench_dip', 'assisted_dip', 'dip_machine', 'ring_dip', 'pushup_diamond'];
const CU_EXTRA = ['chinup', 'pulldown_supine'];

// ── v4 del catálogo (paso 3, D-16, C-05): cuenta de volumen para PLANIFICAR, fraccional por patrón (05 §1.1, Pelland 2026) y con el
//    deltoides por cabezas. Los grupos de siempre (GROUPS) se conservan para lo que ve la persona y para la elección de ejercicios.
//    Directo = 1 serie · indirecto = 0,5. El catálogo solo decide si el músculo está (peso ≥ 0,6 → directo pleno; 0,3-0,6 → 0,5) y el
//    grupo del músculo principal del ejercicio (peso ≥ 0,8) cuenta 1 aunque el patrón no lo liste (fondos y press cerrado → tríceps).
const PG = ['pecho', 'espalda', 'hombro_ant', 'hombro_lat', 'hombro_post', 'biceps', 'triceps', 'abdomen', 'cuads', 'isquios', 'gluteos', 'gemelos'];
const PGMUS = { pecho: ['pecs', 'upperpecs', 'lowerpecs'], espalda: ['lats', 'midback', 'traps'], hombro_ant: ['frontdelts'], hombro_lat: ['sidedelts'], hombro_post: ['reardelts'],
  biceps: ['biceps'], triceps: ['triceps'], abdomen: ['abs', 'obliques'], cuads: ['quads'], isquios: ['hams'], gluteos: ['glutes', 'abductors'], gemelos: ['calves'] };
const PBIG = ['pecho', 'espalda', 'hombro_lat', 'hombro_post', 'cuads', 'isquios', 'gluteos'];   // con objetivo, rango y suelo de 4
const PSMALL = ['biceps', 'triceps', 'abdomen', 'gemelos'];                                       // ya reciben trabajo indirecto (05 §1.2)
const PIND = ['hombro_ant'];   // solo indirecto (05 §5.3: «deltoides anterior» entre los que ya reciben volumen): sin objetivo; cuenta para techo y tope
const PLBL = { pecho: 'Pecho', espalda: 'Espalda', hombro_ant: 'Hombro (frontal)', hombro_lat: 'Hombro (lateral)', hombro_post: 'Hombro (posterior)', biceps: 'Bíceps', triceps: 'Tríceps',
  abdomen: 'Abdomen', cuads: 'Cuádriceps', isquios: 'Isquios', gluteos: 'Glúteos', gemelos: 'Gemelos' };
// 05 §1.1 por patrón: d = directo (1), i = indirecto (0,5; [grupo, peso mínimo]). Empuje vertical: deltoides anterior 1 y lateral 0,5
// (el catálogo le da 0,4-0,7 al lateral en los presses: [H]); pectoral clavicular solo si el ejercicio lo carga de verdad (landmine).
const VOLPAT = {
  push_h: { d: ['pecho'], i: [['triceps', 0.3], ['hombro_ant', 0.3]] },
  push_v: { d: ['hombro_ant'], i: [['hombro_lat', 0.3], ['triceps', 0.3], ['pecho', 0.5]] },
  pull_v: { d: ['espalda'], i: [['biceps', 0.3], ['hombro_post', 0.3]] },
  pull_h: { d: ['espalda'], i: [['biceps', 0.3], ['hombro_post', 0.3]] },
  squat: { d: ['cuads'], i: [['gluteos', 0.3]] }, lunge: { d: ['cuads'], i: [['gluteos', 0.3]] },
  hinge: { d: ['isquios', 'gluteos'], i: [] }, hip_ext: { d: ['gluteos'], i: [['isquios', 0.3]] },
  knee_flex: { d: ['isquios'], i: [] }, knee_ext: { d: ['cuads'], i: [] }, calf: { d: ['gemelos'], i: [] },
  fly: { d: ['pecho'], i: [] }, raise: { d: ['hombro_lat'], i: [] }, raise_f: { d: ['hombro_ant'], i: [] }, rear: { d: ['hombro_post'], i: [['espalda', 0.6]] },
  curl: { d: ['biceps'], i: [] }, tri: { d: ['triceps'], i: [] },
  core: { d: ['abdomen'], i: [] }, core_iso: { d: ['abdomen'], i: [] }, core_rot: { d: ['abdomen'], i: [] }, carry: { d: ['abdomen'], i: [] },
  hip_abd: { d: ['gluteos'], i: [] }, hip_add: { d: [], i: [] }, shrug: { d: ['espalda'], i: [] }, forearm: { d: [], i: [] },
  bal: { d: [], i: [] },   // E14a (§K.3): el equilibrio no cuenta volumen
};

return function (C0, opts) {
  opts = opts || {};
  const C = C0;
  const BY = new Map(C.map(e => [e.id, e]));
  const sid = e => e.id.replace(/^lib_/, '');
  const has = (e, list) => list.includes(sid(e));
  const L = id => 'lib_' + id;

  // req: accesorios que pide cada ejercicio además de su mat (misma heurística sobre `eq` que sim.js de 02, §K.1)
  function reqOf(e) {
    const q = e.eq || '', r = new Set();
    if (/banco inclinado/i.test(q)) r.add('banco_inc');
    else if (/banco declinado/i.test(q) || q === 'Banco declinado') r.add('banco_dec');
    else if (/banco Scott/i.test(q)) r.add('scott');
    else if (/GHD/.test(q)) r.add('ghd');
    else if (/hiperextensiones/.test(q)) r.add('hiper');
    else if (['press_flat_db', 'fly_db', 'skull_crusher_db', 'close_press_db', 'leg_curl_db', 'pullover_db', 'bench_press', 'close_grip_bench', 'hip_thrust_bb', 'skull_crusher_ez',
      'dragon_flag', 'wrist_curl_bb'].includes(sid(e))) r.add('banco');
    if (/rack/i.test(q)) r.add('rack');
    if (/rack \+ banco/.test(q)) r.add('banco');
    if (/landmine/i.test(q)) r.add('landmine');
    if (/hexagonal/i.test(q)) r.add('hexbar');
    if (/anclaje/i.test(q) && e.mat === 'banda') r.add('anclaje');
    if (/Paralelas o torre/i.test(q)) r.add('paralelas');
    if (/agarre neutro/i.test(q)) r.add('agarre_neutro');
    if (/dominadas \+ banda/i.test(q)) r.add('banda');          // §K.1 «banda (dominada asistida)»: es un MATERIAL (ver issue)
    if (/^2 kettlebells/.test(q)) r.add('kb2');
    if (q === 'Anillas') r.add('anillas');
    if (e.mat === 'otro') { const o = { sled_push: 'trineo', sled_drag: 'trineo', tire_flip: 'llanta', battle_rope_waves: 'cuerdas', battle_rope_slams: 'cuerdas',
      cardio_boxing_bag: 'saco', cardio_cycling_outdoor: 'bici_ext', cardio_swim: 'piscina' }[sid(e)]; if (o) r.add(o); }
    if (POLEAS2.includes(sid(e))) r.add('poleas2');
    if (sid(e) === 'inverted_row_table') r.add('mesa');   // v3: en un parque no hay mesa (D-13); las casas la tienen por defecto
    if (sid(e) === 'incline_plank_table') r.add('mesa');   // E14a (§K.3): plancha con las manos en una mesa o encimera
    if (sid(e) === 'towel_door_row') r.add('puerta');      // E14a (§K.3, J-26): «con la puerta cerrada y bien sujeta»
    return [...r];
  }
  // lim (heurística de 02 §4.2 = lesion.js; cadera = heurística de la propuesta de UX, ux10/counts.js) · 2 evitar · 1 con cuidado
  const LOWER_PLYO = ['jump_squat', 'jump_lunge', 'jumping_jack', 'high_knees', 'tuck_jump', 'skater_jump', 'butt_kicks', 'box_jump', 'double_unders'];
  const RUN = ['cardio_run', 'cardio_run_outdoor', 'cardio_treadmill_run', 'cardio_jog_in_place', 'cardio_jump_rope', 'cardio_hiit'];
  const lw = e => e.mus.lowback || 0;
  const R = {
    rodilla: e => {
      if (e.lt === 'c') return has(e, RUN) || has(e, ['cardio_stairs', 'cardio_stair_machine']) ? (has(e, ['cardio_stairs', 'cardio_stair_machine']) ? 1 : 2) : 0;
      if (has(e, LOWER_PLYO) || has(e, ['pistol_squat', 'sissy_squat', 'cossack_squat', 'trx_pistol', 'burpee', 'walking_lunge_db', 'walking_lunge_bw', 'curtsy_lunge_db', 'curtsy_lunge_bw', 'jump_lunge', 'nordic_curl'])) return 2;
      if (['squat', 'lunge', 'knee_ext'].includes(e.pat) || has(e, ['thruster_bb', 'thruster_db', 'kb_thruster', 'mb_wall_ball', 'power_clean', 'power_snatch', 'wall_sit', 'sled_push', 'sled_drag', 'tire_flip', 'calf_leg_press'])) return 1;
      return 0;
    },
    hombro: e => {
      if (e.lt === 'c') return has(e, ['cardio_swim', 'cardio_ski_erg']) ? 1 : 0;
      if (has(e, ['lat_pulldown_behind', 'upright_row_bb', 'upright_row_db', 'upright_row_cable', 'dip_bars', 'ring_dip', 'bench_dip', 'muscle_up', 'toes_to_bar', 'hspu_wall',
        'handstand_hold', 'power_snatch', 'kb_snatch', 'snatch_db', 'push_press', 'pushup_plyo'])) return 2;
      if (e.pat === 'push_v' || e.pat === 'fly' || e.pat === 'raise' || e.pat === 'raise_f' || has(e, ['pullover_db', 'pullover_machine', 'pullup', 'chinup', 'pullup_neutral', 'pullup_band',
        'pullup_negative', 'thruster_bb', 'thruster_db', 'kb_thruster', 'kb_turkish_getup', 'kb_windmill', 'clean_press_db', 'kb_clean_press', 'bench_press', 'incline_bench_bb', 'decline_bench_bb',
        'close_grip_bench', 'assisted_dip', 'dip_machine', 'pushup_archer', 'mb_wall_ball', 'battle_rope_slams', 'skull_crusher_ez', 'overhead_ext_ez', 'tricep_overhead_cable', 'overhead_ext_db',
        'band_tricep_overhead', 'trx_y_raise', 'ab_wheel_standing', 'dead_hang', 'towel_pulldown_floor', 'pullover_floor_db', 'pullover_bb', 'skull_crusher_bb',
        'band_overhead_pulldown'])) return 1;
      // v6 del catálogo (paso 6, J-02): la barra en la espalda o en posición frontal y colgarse también cargan el hombro (rotación externa y
      // abducción para sujetar la barra; tracción con el peso del cuerpo). Propuesta de revisión humana para §K.2
      if (has(e, ['back_squat', 'front_squat', 'squat_smith', 'lunge_bb', 'bulgarian_bb', 'calf_raise_bb', 'lunge_smith', 'bulgarian_smith', 'hanging_knee_raise', 'leg_raise', 'l_sit'])) return 1;
      return 0;
    },
    lumbar: e => {
      if (e.lt === 'c') return has(e, ['cardio_rower', 'cardio_run', 'cardio_run_outdoor', 'cardio_treadmill_run']) ? 1 : 0;
      if (has(e, ['deadlift', 'sumo_deadlift', 'stiff_leg_deadlift', 'rdl_bb', 'good_morning', 'rack_pull', 'bb_row', 'pendlay_row', 'yates_row', 'power_clean', 'power_snatch',
        'tire_flip', 'back_squat', 'front_squat', 'situp', 'v_up', 'toes_to_bar', 'dragon_flag', 'russian_twist_db', 'plate_russian_twist', 'mb_russian_twist', 'ab_wheel_standing', 'decline_situp',
        'jump_squat', 'tuck_jump', 'box_jump', 'superman', 'kb_windmill'])) return 2;
      if (lw(e) >= 0.4 || e.pat === 'hinge' || has(e, ['lunge_bb', 'bulgarian_bb', 'ohp_bb', 'push_press', 'thruster_bb', 'calf_raise_bb', 'shrug_bb', 'farmer_walk_db', 'kb_farmer_carry', 'farmer_walk_plates',
        'russian_twist_bw', 'bicycle_crunch', 'flutter_kick', 'lying_leg_raise', 'leg_raise', 'hanging_knee_raise', 'reverse_crunch', 'crunch_cable', 'woodchop_high_cable', 'woodchop_low_cable',
        'woodchop_db', 'mb_rot_throw', 'mb_slam', 'landmine_rotation', 'burpee', 'renegade_row_db', 'ab_wheel_knees', 'ball_pike', 'trx_pike', 'hyperextension', 'back_ext_machine', 'ball_back_ext',
        'towel_pulldown_floor'])) return 1;
      // v6 del catálogo (paso 6, J-01 y J-04): la columna también se carga por COMPRESIÓN, no solo por activación de los lumbares: la almohadilla
      // de la hack y del péndulo, la barra del Smith y del hip thrust con barra, y el aterrizaje de cualquier salto. Propuesta para §K.2
      if (has(e, LOWER_PLYO) || has(e, ['hack_squat', 'squat_smith', 'pendulum_squat', 'ohp_smith', 'hip_thrust_bb', 'glute_bridge_bb', 'hip_thrust_smith', 'bulgarian_smith', 'lunge_smith', 'calf_smith'])) return 1;
      return 0;
    },
    muneca: e => {
      if (e.lt === 'c') return has(e, ['cardio_boxing_bag']) ? 1 : 0;
      const handsFloor = (e.mat === 'corporal' && e.pat === 'push_h' && !has(e, ['bench_dip', 'pushup_incline', 'pushup_knee'])) || has(e, ['mountain_climber', 'plank_shoulder_tap', 'bear_crawl', 'burpee', 'pike_pushup',
        'hspu_wall', 'handstand_hold', 'renegade_row_db', 'ball_pike', 'ball_knee_tuck', 'trx_pike', 'trx_knee_tuck', 'pushup_plyo', 'pike_pushup_knee']);
      if (handsFloor || has(e, ['front_squat', 'power_clean', 'power_snatch', 'kb_clean', 'kb_snatch', 'kb_clean_press', 'dip_bars', 'ring_dip', 'bench_dip', 'muscle_up', 'wrist_curl_bb',
        'wrist_curl_db', 'reverse_wrist_curl_db'])) return 2;
      if (has(e, ['curl_bb', 'reverse_curl_bb', 'reverse_curl_db', 'zottman_curl_db', 'skull_crusher_ez', 'skull_crusher_db', 'bench_press', 'close_grip_bench', 'incline_bench_bb',
        'decline_bench_bb', 'thruster_bb', 'push_press', 'ohp_bb', 'kb_press', 'kb_turkish_getup', 'kb_windmill', 'kb_rack_carry', 'ab_wheel_knees', 'ab_wheel_standing', 'plate_pinch',
        'assisted_dip', 'dip_machine', 'pushup_incline', 'pushup_knee', 'trx_chest_press', 'band_chest_press', 'mb_wall_ball', 'incline_plank_table', 'skull_crusher_bb'])) return 1;
      return 0;
    },
    impacto: e => {
      if (has(e, LOWER_PLYO) || has(e, RUN) || has(e, ['burpee', 'pushup_plyo'])) return 2;
      if (has(e, ['cardio_stairs', 'cardio_dance', 'cardio_step', 'cardio_shadow_boxing', 'cardio_boxing_bag', 'cardio_stair_machine', 'mb_slam', 'battle_rope_slams', 'kb_swing',
        'kb_swing_american', 'db_swing', 'kb_snatch', 'power_clean', 'power_snatch', 'tire_flip', 'walking_lunge_db', 'walking_lunge_bw', 'muscle_up'])) return 1;
      return 0;
    },
  };
  const HIP_AVOID = /pistol|cossack|curtsy|sissy|jump|skater|tuck|box_jump|copenhagen|split_jump|lateral_lunge|side_lunge|sumo_deadlift/;
  R.cadera = e => {
    if (e.lt === 'c') return 0;
    if (HIP_AVOID.test(e.id)) return 2;
    if (['lunge', 'hip_add', 'hip_abd'].includes(e.pat) || /sumo|deep|bulgarian|deadlift|good_morning/.test(e.id)) return 1;
    return 0;
  };
  const SUELO_IDS = ['floor_press_db', 'glute_bridge_db', 'crunch_db', 'russian_twist_db', 'kb_turkish_getup', 'plank', 'pushup_knee', 'ab_wheel_knees', 'ytw_prone', 'side_lying_abd', 'side_lying_add',
    'miniband_glute_bridge', 'miniband_kickback', 'miniband_clamshell', 'miniband_side_abduction', 'miniband_fire_hydrant', 'band_glute_kickback',
    // v5 del catálogo (paso 4, I-11): los que piden bajar al suelo aunque `eq` no lo diga (manos o espalda en el suelo; bajo una mesa)
    'pushup', 'pushup_wide', 'pushup_archer', 'pushup_diamond', 'pushup_decline', 'pushup_plyo', 'pike_pushup', 'hspu_wall', 'mountain_climber', 'plank_shoulder_tap', 'bear_crawl',
    'trx_pike', 'trx_knee_tuck', 'trx_plank', 'ball_pike', 'ball_knee_tuck', 'ball_plank', 'slider_leg_curl', 'trx_leg_curl', 'ball_leg_curl', 'glute_bridge_bb', 'ball_bridge',
    'inverted_row_table', 'copenhagen', 'plate_crunch', 'ab_wheel_standing',
    // E14b (§K.3): con barra en casa, tumbado en un banco o en el suelo
    'skull_crusher_bb', 'pullover_bb'];

  const TAGS = { req: {}, mfam: {}, ckind: {}, also: {}, alsoAcc: { lib_inverted_row: [{ mats: ['dominadas'], acc: ['paralelas'] }, { mats: ['barra'], acc: ['rack'] }] }, nogen: new Set(NOGEN.map(L)), lim: {}, suelo: new Set(), spine: new Set(SPINE.map(L)), spineFlex: new Set(SPINE_FLEX.map(L)), amable: {}, basic: new Set((opts.basic === 'ciencia' ? BASIC_CIENCIA : BASIC).map(L)),
    long: new Set(LONG.map(L)), apoyo: new Set(APOYO.map(L)), poleas2: new Set(POLEAS2.map(L)) };
  for (const e of C) {
    const r = reqOf(e); if (r.length) TAGS.req[e.id] = r;
    const lm = {}; for (const z of Object.keys(R)) lm[z] = R[z](e); TAGS.lim[e.id] = lm;
    if (/(suelo)/i.test(e.eq || '') || SUELO_IDS.includes(sid(e))) TAGS.suelo.add(e.id);
  }
  // ── v6 del catálogo (paso 6, 45-juicio-entrenador.md): etiquetas de seguridad por lo que CARGA cada ejercicio (propuestas para §K.1-§K.2) ──
  // colgado = se hace colgado de una barra de dominadas (mat 'dominadas': dominadas, negativas, con banda, elevaciones colgado, dead hang, L-sit)
  TAGS.colgado = new Set(C.filter(e => e.mat === 'dominadas').map(e => e.id));
  // barra en la espalda o en posición frontal (rotación externa y abducción del hombro para sujetarla): J-02
  TAGS.barraEspalda = new Set(['back_squat', 'front_squat', 'squat_smith', 'lunge_bb', 'bulgarian_bb', 'calf_raise_bb', 'lunge_smith', 'bulgarian_smith', 'calf_smith', 'good_morning'].map(L).filter(i => BY.has(i)));
  // hombro que duele AHORA (05 §7.4: «evitar press por encima de la cabeza si duele»; preferir landmine, jalón al pecho, remos y rotación
  // externa): fuera todo empuje vertical salvo el landmine, lo colgado, la barra en la espalda, los fondos, las dominadas asistidas y las
  // elevaciones laterales y frontales (las sustituye la rotación externa): J-02
  TAGS.hombroAhoraFuera = new Set(C.filter(e => (e.pat === 'push_v' && sid(e) !== 'landmine_press') || ['raise', 'raise_f'].includes(e.pat) || TAGS.colgado.has(e.id) || TAGS.barraEspalda.has(e.id) ||
    ['dip_bars', 'bench_dip', 'assisted_dip', 'dip_machine', 'ring_dip', 'assisted_pullup', 'pushup_plyo', 'upright_row_bb', 'upright_row_cable', 'upright_row_db'].includes(sid(e))).map(e => e.id));
  // rodilla que duele AHORA (05 §7.4: «flexión profunda cargada si duele; zancadas largas»): fuera las sentadillas con barra o en máquina de
  // carga alta (hack, péndulo, Smith, cinturón), las búlgaras, las zancadas largas o con carga y las laterales; quedan la prensa, la
  // sentadilla a un cajón (goblet o silla), la sentadilla en pared, la subida baja y la zancada corta atrás sin peso: J-05
  TAGS.rodillaAhoraFuera = new Set(['back_squat', 'front_squat', 'squat_smith', 'hack_squat', 'pendulum_squat', 'belt_squat', 'landmine_squat', 'bulgarian_squat_db', 'bulgarian_bb', 'bulgarian_smith',
    'bulgarian_bw', 'split_squat_db', 'lunge_db', 'lunge_bb', 'lunge_smith', 'kb_lunge', 'forward_lunge_bw', 'reverse_lunge_db', 'lateral_lunge_db', 'side_lunge_bw', 'walking_lunge_db',
    'walking_lunge_bw', 'band_lunge', 'sumo_squat_db', 'kb_sumo_squat', 'sumo_squat_bw', 'trx_lunge', 'cossack_squat', 'curtsy_lunge_db', 'curtsy_lunge_bw'].map(L).filter(i => BY.has(i)));
  // zancadas largas (para que el texto «sin zancadas largas» sea verdad): J-05
  TAGS.zancadaLarga = new Set([...TAGS.rodillaAhoraFuera].filter(i => BY.get(i).pat === 'lunge'));
  // remos sin apoyo de pecho (la espalda inclinada y sin apoyo es donde se redondea con carga): fuera con huesos frágiles (J-07)
  TAGS.remoSinApoyo = new Set(['bb_row', 'pendlay_row', 'yates_row', 'row_bent_db', 'tbar_row_landmine', 'meadows_row', 'row_smith', 'renegade_row_db', 'backpack_row'].map(L).filter(i => BY.has(i)));
  // excéntricos de peso corporal: se respetan las repeticiones del catálogo (3-5 lentas), no se suben a 8 (J-03)
  TAGS.excentrico = new Set(['pullup_negative', 'nordic_curl', 'pistol_squat'].map(L).filter(i => BY.has(i)));
  // carga en las manos que comprime la columna (sentadillas, zancadas y paseos con mancuernas o kettlebell): con la espalda baja operada o
  // con lesión reciente, mejor prensa, máquinas y unilaterales sin carga (J-04)
  TAGS.axialManos = new Set(C.filter(e => ['squat', 'lunge', 'carry'].includes(e.pat) && ['mancuernas', 'kettlebell'].includes(e.mat)).map(e => e.id)
    .concat(['lib_squat_backpack', 'lib_farmer_walk_plates'].filter(i => BY.has(i))));   // E14b: la mochila abrazada y los discos en las manos
  // extensores de la espalda sin flexión (huesos frágiles, Sinaki 2002): J-07
  TAGS.extensores = new Set(['back_ext_machine', 'hyperextension', 'ytw_prone', 'bird_dog', 'ball_back_ext'].map(L).filter(i => BY.has(i)));
  for (const [f, ids] of Object.entries(MFAM)) ids.forEach(i => { TAGS.mfam[L(i)] = f; });
  for (const [k, ids] of Object.entries(CKIND)) ids.forEach(i => { TAGS.ckind[L(i)] = k; });
  ALSO_KB.forEach(i => { TAGS.also[L(i)] = ['kettlebell']; });
  if (BY.has('lib_backpack_row')) TAGS.also.lib_backpack_row = ['mochila'];   // E14b (§K.3): el remo con mochila, también con ese material
  for (const [z, ids] of Object.entries(AMABLE)) TAGS.amable[z] = new Set(ids.map(L));
  // comprobaciones: todos los ids de las listas existen
  const faltan = [];
  const chk = (lst, nom) => lst.forEach(i => { if (!BY.has(L(i))) faltan.push(nom + ':' + i); });
  chk(NOGEN, 'nogen'); chk(ALSO_KB, 'also'); chk(POLEAS2, 'poleas2'); chk(SPINE, 'spine'); chk(SPINE_FLEX, 'spineFlex'); chk(BASIC, 'basic'); chk(LONG, 'long'); chk(APOYO, 'apoyo'); chk(TR_EXTRA, 'tr'); chk(CU_EXTRA, 'cu');
  Object.entries(MFAM).forEach(([f, ids]) => chk(ids, 'mfam.' + f)); Object.entries(CKIND).forEach(([k, ids]) => chk(ids, 'ckind.' + k));
  Object.entries(AMABLE).forEach(([z, ids]) => chk(ids, 'amable.' + z));
  const maqSinFam = C.filter(e => e.mat === 'maquina' && !TAGS.mfam[e.id]).map(sid);
  const cardSinTipo = C.filter(e => e.mat === 'cardio' && !TAGS.ckind[e.id]).map(sid);

  // LIB_DOWN (index.html:10390): la versión más fácil
  const LIB_DOWN = {}; C.forEach(e => { if (e.up && !LIB_DOWN[e.up]) LIB_DOWN[e.up] = e.id; });

  // ── Presets de material (§C P5-P6; cifras y contenido de 02 §6.2 = presets.js), en el formato Place de §D.1 ──
  const ALL_MATS = ['barra', 'barraz', 'smith', 'mancuernas', 'kettlebell', 'disco', 'balon', 'otro', 'maquina', 'polea', 'dominadas', 'banda', 'minibanda', 'trx', 'fitball', 'rueda', 'comba', 'step', 'cardio',
    'mochila'];   // E14b (§K.3): «Mochila, garrafas o chaleco» (sus ejercicios son solo de casa: pl 'c')
  const ALL_ACC = ['mesa', 'puerta', 'banco', 'banco_inc', 'banco_dec', 'scott', 'ghd', 'hiper', 'rack', 'landmine', 'hexbar', 'anclaje', 'paralelas', 'agarre_neutro', 'kb2', 'anillas', 'poleas2',
    'trineo', 'llanta', 'cuerdas', 'saco', 'bici_ext', 'piscina'];
  const PRESETS = {
    grande: { kind: 'g', t: 'Gimnasio grande', mats: ALL_MATS, acc: ALL_ACC.filter(a => a !== 'bici_ext' && a !== 'piscina'), mach: 'all', card: 'all', dbMax: 99, kb: 2, cifra: 384 },
    barrio: { kind: 'g', t: 'Gimnasio pequeño o de barrio', mats: ['mancuernas', 'barra', 'disco', 'barraz', 'polea', 'maquina', 'dominadas', 'cardio', 'banda', 'fitball'],
      acc: ['banco', 'banco_inc', 'rack', 'paralelas', 'poleas2', 'hiper'], mach: ['prensa', 'jalonremo', 'extension', 'curlfem', 'pecho', 'hombro', 'gemelos', 'lumbares', 'abdaduct'],
      card: ['cinta', 'bici', 'eliptica'], dbMax: 99, kb: null, cifra: 261 },
    hotel: { kind: 'g', t: 'Gimnasio de hotel o de comunidad', mats: ['mancuernas', 'polea', 'maquina', 'cardio', 'fitball'], acc: ['banco', 'banco_inc'],
      mach: ['jalonremo', 'pecho', 'extension', 'curlfem'], card: ['cinta', 'bici', 'eliptica'], dbMax: 20, kb: null, cifra: 193 },
    box: { kind: 'g', t: 'Box o gimnasio funcional', mats: ['barra', 'disco', 'kettlebell', 'mancuernas', 'dominadas', 'trx', 'comba', 'step', 'balon', 'banda', 'minibanda', 'otro', 'cardio', 'rueda'],
      acc: ['banco', 'rack', 'landmine', 'paralelas', 'kb2', 'anillas', 'trineo', 'cuerdas', 'llanta'], mach: [], card: ['remo', 'bici_aire', 'esqui'], dbMax: 30, kb: 2, cifra: 249 },
    nada: { kind: 'c', t: 'Sin material', mats: [], acc: ['mesa', 'puerta'], mach: [], card: [], dbMax: null, kb: null, cifra: 78 },
    basico: { kind: 'c', t: 'Lo básico', mats: ['mancuernas', 'banda', 'minibanda'], acc: ['anclaje', 'mesa', 'puerta'], mach: [], card: [], dbMax: 20, kb: null, cifra: 156 },
    mancbanco: { kind: 'c', t: 'Mancuernas y banco', mats: ['mancuernas'], acc: ['banco', 'banco_inc', 'mesa', 'puerta'], mach: [], card: [], dbMax: 20, kb: null, cifra: 139 },
    casagym: { kind: 'c', t: 'Gimnasio en casa', mats: ['barra', 'disco', 'dominadas', 'mancuernas'], acc: ['rack', 'banco', 'banco_inc', 'mesa', 'puerta'], mach: [], card: [], dbMax: 30, kb: null, cifra: 183 },
    parque: { kind: 'c', t: 'Parque de calistenia', mats: ['dominadas'], acc: ['paralelas'], mach: [], card: [], dbMax: null, kb: null, cifra: 89 },
  };
  const place = (k, over) => { const p = PRESETS[k]; return Object.assign({ preset: k, mats: p.mats.slice(), acc: p.acc.slice(), mach: p.mach === 'all' ? 'all' : p.mach.slice(),
    card: p.card === 'all' ? 'all' : p.card.slice(), dbMax: p.dbMax, kb: p.kb }, over || {}); };

  // ── placeCan (§E.4), literal salvo dos cosas: un `req` que es un MATERIAL ('banda') se mira en mats (ver issue), y
  //    v2 (paso 2, D-13): «también con» material + accesorio (`alsoAcc`), p. ej. el remo invertido en barra baja se hace en la barra
  //    baja de un parque (dominadas + paralelas) o con una barra en el rack, no solo en una Smith (propuesta de etiqueta para §K.1/§K.3).
  function placeCan(Lb, P, kind) {
    if (!Lb || !P) return false;
    const mats = new Set(P.mats); mats.add('corporal');
    const alsoOk = (TAGS.also[Lb.id] || []).some(m => mats.has(m)) ||
      (TAGS.alsoAcc[Lb.id] || []).some(a => a.mats.every(m => mats.has(m)) && a.acc.every(x => (P.acc || []).includes(x)));
    if (!mats.has(Lb.mat) && !alsoOk) return false;
    if (kind === 'g' && Lb.pl === 'c') return false;
    for (const r of (TAGS.req[Lb.id] || [])) { if (r === 'banda') { if (!mats.has('banda')) return false; continue; } if (!(P.acc || []).includes(r)) return false; }
    if (Lb.mat === 'maquina' && P.mach !== 'all' && !(P.mach || []).includes(TAGS.mfam[Lb.id])) return false;
    if (Lb.mat === 'cardio' && P.card !== 'all' && !(P.card || []).includes(TAGS.ckind[Lb.id])) return false;
    return true;
  }
  // Recuento de presets con placeCan frente a las cifras de la propuesta
  function cuentas() {
    const out = {};
    for (const [k, p] of Object.entries(PRESETS)) {
      const P = place(k), av = C.filter(e => placeCan(e, P, p.kind));
      out[k] = { total: av.length, fuerza: av.filter(e => e.lt !== 'c').length, cardio: av.filter(e => e.lt === 'c').length, propuesta: p.cifra };
    }
    return out;
  }
  // Ángulo de empuje (para «ángulo repetido» y «el hueco pide inclinado»)
  function angle(e) {
    if (e.pat === 'push_v') return 'vert';
    if (e.pat !== 'push_h') return null;
    if ((e.mus.upperpecs || 0) >= 0.8) return 'inc';
    if ((e.mus.lowerpecs || 0) >= 0.8) return 'dec';
    return 'flat';
  }
  // v4 del catálogo (paso 3): cuenta fraccional para planificar (ver PG/VOLPAT arriba). volV(e) → {grupo: 1 | 0,5}; fracV(e, g); mainGroupV(e)
  const pgw = (e, g) => Math.max(0, ...PGMUS[g].map(m => e.mus[m] || 0));
  const volC = new Map();
  function volV(e) {
    if (volC.has(e.id)) return volC.get(e.id);
    const o = {}, vp = VOLPAT[e.pat];
    let mg = null, mw = 0; for (const g of PG) { const w = pgw(e, g); if (w > mw + 1e-9) { mw = w; mg = g; } }
    if (vp) {
      for (const g of vp.d) { const w = pgw(e, g); if (w >= 0.6) o[g] = 1; else if (w >= 0.3) o[g] = 0.5; }
      for (const [g, min] of vp.i) { if (!o[g] && pgw(e, g) >= min) o[g] = 0.5; }
      if (mg && mw >= 0.8 && vp.d.length) o[mg] = 1;   // músculo principal que el patrón no lista como directo (fondos, press cerrado → tríceps)
    } else {   // sin patrón claro (explosivos, cuerpo entero): el umbral del catálogo de §E.3
      for (const g of PG) { const w = pgw(e, g); if (w >= 0.8) o[g] = 1; else if (w >= 0.3) o[g] = 0.5; }
    }
    volC.set(e.id, o); return o;
  }
  const fracV = (e, g) => volV(e)[g] || 0;
  const mainVC = new Map();
  function mainGroupV(e) {
    if (mainVC.has(e.id)) return mainVC.get(e.id);
    const o = volV(e); let best = null;
    for (const g of PG) { if (!o[g]) continue; if (!best || o[g] > o[best] + 1e-9 || (Math.abs(o[g] - o[best]) < 1e-9 && pgw(e, g) > pgw(e, best) + 1e-9)) best = g; }
    mainVC.set(e.id, best); return best;
  }
  return { C, BY, sid, TAGS, R, LIB_DOWN, PAT_NEAR, GROUPS, GMUS, GMUS_MAPA, GLBL, BIG, SMALL, PRESETS, place, placeCan, cuentas, angle, TR_EXTRA: TR_EXTRA.map(L), CU_EXTRA: CU_EXTRA.map(L),
    faltan, maqSinFam, cardSinTipo, ALL_MATS, ALL_ACC,
    PG, PGMUS, PBIG, PSMALL, PIND, PLBL, VOLPAT, volV, fracV, mainGroupV };
};

})();
