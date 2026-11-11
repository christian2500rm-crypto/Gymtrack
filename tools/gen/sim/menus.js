// Menús de preferencia por hueco (paso 2, D-05/D-06/D-07/D-13): la tabla curada de «básicos por patrón y material».
// Cada hueco tiene, por clase de persona, una lista de ESCALONES (separados por «|») con ejercicios equivalentes dentro de cada escalón.
// El material del sitio filtra (placeCan) y la seguridad también (safe/difOk): gana el primer escalón con algún candidato posible,
// y la puntuación de §E.7 solo desempata DENTRO del escalón (variedad, tiempo, estabilidad, «Otra propuesta»).
// Clases: IA = intermedio o avanzado · F = «Ganar fuerza» I/A (barra primero, especificidad) · P = principiante (P0/P sin modo cauto)
//         C = cauto (inicio o prudente: primer escalón, máquinas y variantes estables) · M = 65 o más (como C, sin carga en las manos
//         en unilaterales, sin hip thrust con barra, sin flexión ni rotación de columna con carga).
// Si una clase no está, se usa la siguiente de la cadena: F → IA · M → C → P.
// «sec»: menús del patrón secundario del hueco (cuentan como patrón propio, oi > 0) · «resp»: respaldo de otro patrón (pass 'near', con aviso).
// Criterio [H] de entrenador con 05 §4.2 (selección por material y nivel; progresiones de peso corporal; variación moderada, Kassiano 2022)
// y §E.6 de 20-propuesta.md. Las rarezas (std C) van al final: solo salen si no hay nada más.
'use strict';

const MENUS = {
  SQ: {
    IA: 'back_squat | hack_squat leg_press | front_squat squat_smith pendulum_squat belt_squat | goblet_squat squat_db kb_goblet_squat | squat_backpack | landmine_squat | bulgarian_bw | pistol_squat | trx_squat air_squat band_squat | sumo_squat_db kb_sumo_squat vsquat squat_cable sumo_squat_bw miniband_squat wall_sit',
    F: 'back_squat | front_squat | hack_squat squat_smith | leg_press belt_squat pendulum_squat | goblet_squat squat_db kb_goblet_squat | squat_backpack | landmine_squat | bulgarian_bw | pistol_squat | trx_squat air_squat band_squat | sumo_squat_db kb_sumo_squat vsquat squat_cable sumo_squat_bw miniband_squat wall_sit',
    P: 'goblet_squat leg_press | squat_smith squat_db kb_goblet_squat | hack_squat back_squat | landmine_squat pendulum_squat belt_squat | squat_backpack | air_squat | trx_squat band_squat chair_squat | bulgarian_bw | sumo_squat_db kb_sumo_squat vsquat squat_cable sumo_squat_bw miniband_squat wall_sit',
    C: 'leg_press | goblet_squat squat_smith | squat_db kb_goblet_squat | squat_backpack | hack_squat back_squat | chair_squat | trx_squat | air_squat band_squat | wall_sit | sumo_squat_db kb_sumo_squat vsquat squat_cable sumo_squat_bw miniband_squat landmine_squat pendulum_squat belt_squat',
    sec: ['LU'],
  },
  LU: {
    IA: 'bulgarian_squat_db reverse_lunge_db split_squat_db | walking_lunge_db lunge_db step_up_db | bulgarian_smith lunge_smith leg_press_single lunge_bb kb_lunge | bulgarian_bb | bulgarian_bw reverse_lunge_bw | step_up_bw walking_lunge_bw forward_lunge_bw trx_lunge | lateral_lunge_db side_lunge_bw box_lateral_step_down band_lunge | curtsy_lunge_db curtsy_lunge_bw cossack_squat',
    P: 'split_squat_db reverse_lunge_db step_up_db | lunge_db kb_lunge | bulgarian_squat_db walking_lunge_db lunge_smith bulgarian_smith leg_press_single | reverse_lunge_bw step_up_bw | forward_lunge_bw walking_lunge_bw bulgarian_bw trx_lunge | side_lunge_bw lateral_lunge_db box_lateral_step_down band_lunge | curtsy_lunge_db curtsy_lunge_bw cossack_squat',
    C: 'split_squat_db step_up_bw reverse_lunge_bw | step_up_db reverse_lunge_db | lunge_db kb_lunge forward_lunge_bw | leg_press_single lunge_smith bulgarian_smith trx_lunge | walking_lunge_bw bulgarian_bw band_lunge | side_lunge_bw box_lateral_step_down lateral_lunge_db | curtsy_lunge_db curtsy_lunge_bw cossack_squat',
    M: 'step_up_bw reverse_lunge_bw | split_squat_db step_up_db reverse_lunge_db | forward_lunge_bw | leg_press_single lunge_smith bulgarian_smith | box_lateral_step_down band_lunge',
    sec: ['SQ'],
  },
  HI: {
    IA: 'rdl_bb | rdl_db deadlift trap_bar_deadlift | rdl_smith stiff_leg_deadlift single_leg_rdl_db sumo_deadlift | pull_through_cable kb_deadlift deadlift_db kb_swing | rdl_backpack | sl_rdl_bw good_morning_bw band_deadlift band_good_morning | kb_sl_rdl db_swing kb_swing_american',
    F: 'deadlift | rdl_bb trap_bar_deadlift | sumo_deadlift stiff_leg_deadlift rdl_db rdl_smith | single_leg_rdl_db pull_through_cable kb_deadlift deadlift_db kb_swing | rdl_backpack | sl_rdl_bw good_morning_bw band_deadlift band_good_morning | kb_sl_rdl db_swing kb_swing_american',
    P: 'rdl_db | trap_bar_deadlift kb_deadlift deadlift_db | rdl_bb deadlift rdl_smith | rdl_backpack | good_morning_bw band_deadlift band_good_morning | pull_through_cable single_leg_rdl_db sl_rdl_bw kb_swing | stiff_leg_deadlift sumo_deadlift kb_sl_rdl db_swing kb_swing_american',
    C: 'rdl_db | trap_bar_deadlift kb_deadlift | deadlift_db | rdl_backpack | good_morning_bw band_deadlift | band_good_morning | pull_through_cable rdl_bb rdl_smith deadlift',
    sec: ['HE'],
  },
  HE: {
    IA: 'hip_thrust_bb hip_thrust_machine | hip_thrust_smith glute_bridge_bb hip_thrust_db | glute_bridge_db glute_kickback_machine glute_kickback_cable | hip_thrust_single glute_bridge_single | hip_thrust_sofa glute_bridge miniband_glute_bridge | band_glute_kickback donkey_kick miniband_kickback ball_bridge',
    P: 'hip_thrust_machine hip_thrust_db hip_thrust_bb | glute_bridge_db glute_bridge_bb hip_thrust_smith glute_kickback_machine | hip_thrust_sofa glute_bridge | glute_kickback_cable miniband_glute_bridge hip_thrust_single glute_bridge_single | band_glute_kickback donkey_kick miniband_kickback ball_bridge',
    C: 'hip_thrust_machine | hip_thrust_db glute_bridge_db glute_kickback_machine | hip_thrust_bb glute_bridge_bb hip_thrust_smith | glute_bridge hip_thrust_sofa | miniband_glute_bridge glute_kickback_cable | band_glute_kickback donkey_kick miniband_kickback ball_bridge',
    M: 'hip_thrust_machine glute_kickback_machine | glute_kickback_cable | hip_thrust_db glute_bridge_db | glute_bridge hip_thrust_sofa miniband_glute_bridge | band_glute_kickback miniband_kickback',
    sec: ['HI'],
  },
  KF: {
    IA: 'leg_curl_seated leg_curl | leg_curl_standing leg_curl_cable | slider_leg_curl ball_leg_curl trx_leg_curl | heel_bridge_chair | nordic_curl ghr | leg_curl_db',
    // v7 (paso 4): 65+ y «Prefiero no decirlo»: solo máquinas o polea; sin máquina, la bisagra del patrón secundario o el hueco vacío (nada de
    // tumbarse en el suelo ni boca abajo en un banco con una mancuerna entre los pies: la bisagra del día ya trabaja los isquios)
    M: 'leg_curl_seated leg_curl | leg_curl_standing leg_curl_cable',
    // patrón secundario del hueco (§E.6: knee_flex → hinge): bisagras que cargan isquios, mejor unilaterales o de peso corporal
    sec: ['single_leg_rdl_db kb_sl_rdl | sl_rdl_bw good_morning_bw band_good_morning | stiff_leg_deadlift rdl_db rdl_smith'],
  },
  KE: { IA: 'leg_ext | band_leg_ext' },
  CA: {
    IA: 'calf_machine calf_seated | calf_leg_press calf_raise_db | calf_smith calf_raise_bb calf_raise_single_db | calf_raise_single calf_raise_bw | calf_seated_db',   // v9: el Smith (rareza) después
    C: 'calf_machine calf_seated | calf_leg_press calf_raise_db calf_smith | calf_raise_bw | calf_raise_single calf_raise_bb calf_raise_single_db | calf_seated_db',
  },
  PH: {
    IA: 'bench_press press_flat_db | chest_press_machine bench_smith | floor_press_db kb_floor_press | pushup | dip_bars | pushup_wide | pushup_archer | trx_chest_press band_chest_press | decline_bench_bb press_decline_db cable_chest_press',
    F: 'bench_press | press_flat_db bench_smith | chest_press_machine floor_press_db kb_floor_press | pushup | dip_bars | pushup_wide | pushup_archer | trx_chest_press band_chest_press | decline_bench_bb press_decline_db cable_chest_press',
    P: 'chest_press_machine press_flat_db bench_press | bench_smith floor_press_db kb_floor_press | pushup | pushup_incline pushup_knee | trx_chest_press band_chest_press | pushup_wide | cable_chest_press press_decline_db decline_bench_bb',
    // v10 (45: Carmen): a quien empieza, sin bajar al suelo si hay otra opción: flexiones inclinadas o press con banda de pie antes que el press en el suelo
    C: 'chest_press_machine | press_flat_db bench_smith | bench_press | pushup_incline band_chest_press | floor_press_db kb_floor_press | pushup_knee | trx_chest_press | pushup | pushup_wide | cable_chest_press press_decline_db decline_bench_bb',
  },
  PI: {   // press inclinado (push_h:inc); patrón secundario push_v (§E.6 «PI1 (o PV)»); respaldo: press plano
    IA: 'press_incline_db incline_bench_bb | chest_press_incline_machine press_incline_smith | landmine_press | pushup_decline',
    F: 'incline_bench_bb | press_incline_db press_incline_smith | chest_press_incline_machine | landmine_press | pushup_decline',
    P: 'chest_press_incline_machine press_incline_db | press_incline_smith incline_bench_bb | landmine_press | pushup_decline',
    C: 'chest_press_incline_machine | press_incline_db press_incline_smith | incline_bench_bb',
    sec: ['PV'], resp: ['PH'],
  },
  PV: {
    IA: 'ohp_bb shoulder_press_db | shoulder_press_machine ohp_smith arnold_press_db | landmine_press kb_press | shoulder_press_jugs | pike_pushup band_shoulder_press | pike_pushup_knee | hspu_wall handstand_hold',
    F: 'ohp_bb | shoulder_press_db ohp_smith | shoulder_press_machine arnold_press_db landmine_press kb_press | shoulder_press_jugs | pike_pushup band_shoulder_press | pike_pushup_knee | hspu_wall handstand_hold',
    P: 'shoulder_press_machine shoulder_press_db | ohp_smith | ohp_bb arnold_press_db landmine_press kb_press | shoulder_press_jugs | band_shoulder_press | pike_pushup_knee pike_pushup',
    C: 'shoulder_press_machine | shoulder_press_db ohp_smith | band_shoulder_press | shoulder_press_jugs | landmine_press ohp_bb | pike_pushup_knee',
  },
  FL: { IA: 'fly_machine cable_fly_mid cable_fly_low fly_db | cable_fly_high fly_incline_db | fly_floor_db | band_fly' },
  TV: {
    IA: 'pullup lat_pulldown | chinup pullup_neutral pulldown_close pulldown_supine | assisted_pullup pullup_band pullup_negative | band_pulldown | band_overhead_pulldown | pulldown_one_arm pulldown_machine_uni | pullover_floor_db pullover_bb | towel_pulldown_floor',
    P: 'lat_pulldown assisted_pullup | pulldown_close pulldown_supine pullup_band | pullup_negative band_pulldown | band_overhead_pulldown | pullup chinup pullup_neutral | pulldown_one_arm pulldown_machine_uni | pullover_floor_db pullover_bb | towel_pulldown_floor',
    // v8 (paso 6, J-03): inicio, prudente y 65+ sin dominadas negativas ni con banda (8 bajadas lentas del propio peso son la dosis excéntrica
    // que más agujetas y daño muscular produce; con 65+, además, colgarse es riesgo de caída): si no hay jalón, el respaldo es un remo (TH)
    C: 'lat_pulldown | assisted_pullup pulldown_close pulldown_supine | band_pulldown band_overhead_pulldown | towel_pulldown_floor',
    M: 'lat_pulldown | pulldown_close pulldown_supine | band_pulldown band_overhead_pulldown',
    sec: ['TH'],
  },
  TH: {
    IA: 'row_cable bb_row row_db | row_machine tbar_row_supported row_incline_db tbar_row_landmine row_cable_one_arm row_bent_db | row_machine_high yates_row pendlay_row row_cable_wide kb_row | inverted_row trx_row | band_row | towel_door_row | inverted_row_table | meadows_row row_smith row_cable_standing renegade_row_db backpack_row',
    F: 'bb_row | pendlay_row row_cable row_db tbar_row_landmine | row_machine tbar_row_supported row_incline_db row_cable_one_arm row_bent_db yates_row | row_machine_high row_cable_wide kb_row | inverted_row trx_row | band_row | towel_door_row | inverted_row_table | meadows_row row_smith row_cable_standing renegade_row_db backpack_row',
    P: 'row_cable row_machine row_db | tbar_row_supported row_incline_db row_cable_one_arm row_machine_high | kb_row bb_row row_bent_db | inverted_row trx_row band_row | towel_door_row | inverted_row_table | row_cable_wide yates_row tbar_row_landmine meadows_row row_smith row_cable_standing renegade_row_db backpack_row',
    C: 'row_cable row_machine | row_incline_db tbar_row_supported row_db | row_cable_one_arm row_machine_high kb_row | band_row trx_row inverted_row | towel_door_row | inverted_row_table',
    // v8 (J-03): 65+, el remo con apoyo (mancuerna con la mano en el banco, pecho apoyado) antes que meterse bajo una barra
    M: 'row_cable row_machine | row_incline_db tbar_row_supported row_db | row_cable_one_arm row_machine_high kb_row | band_row | towel_door_row | trx_row | inverted_row | inverted_row_table',
    sec: ['TV'],
  },
  RA: {
    IA: 'lat_raise_db lat_raise_cable lat_raise_machine | plate_lateral_raise lateral_raise_jugs band_lateral_raise | y_raise_cable | wall_lateral_raise_iso',
    C: 'lat_raise_machine lat_raise_db lat_raise_cable | plate_lateral_raise lateral_raise_jugs band_lateral_raise | wall_lateral_raise_iso',
  },
  RE: { IA: 'face_pull rev_fly_machine rear_fly_db | band_face_pull band_pull_apart rear_fly_cable | trx_rev_fly ext_rotation_cable band_ext_rotation | ytw_prone | trx_y_raise' },
  CU: {
    IA: 'curl_db curl_cable curl_ez curl_bb hammer_curl | curl_incline_db preacher_curl_ez curl_machine hammer_curl_cable curl_cable_one_arm bayesian_curl_cable | curl_db_concentrated preacher_curl_db band_curl trx_curl kb_curl curl_jugs | spider_curl_db zottman_curl_db curl_cable_high | towel_curl_iso',
    C: 'curl_machine curl_db curl_cable | hammer_curl curl_ez curl_bb | kb_curl curl_jugs band_curl trx_curl | curl_db_concentrated preacher_curl_db preacher_curl_ez hammer_curl_cable curl_cable_one_arm | towel_curl_iso',
    sec: ['chinup pulldown_supine'],
  },
  TR: {
    IA: 'tricep_pushdown tricep_overhead_cable overhead_ext_db skull_crusher_ez | tricep_pushdown_bar tricep_machine skull_crusher_db overhead_ext_ez close_grip_bench dip_bars skull_crusher_bb | tricep_pushdown_one_arm kickback_db close_press_db assisted_dip dip_machine | band_tricep_pushdown band_tricep_overhead | pushup_diamond | bench_dip | trx_tricep_ext tricep_pushdown_rev tricep_kickback_cable ring_dip',
    P: 'tricep_pushdown overhead_ext_db tricep_overhead_cable tricep_machine | tricep_pushdown_bar kickback_db assisted_dip dip_machine close_press_db | band_tricep_pushdown band_tricep_overhead | skull_crusher_ez skull_crusher_db overhead_ext_ez close_grip_bench tricep_pushdown_one_arm skull_crusher_bb | pushup_diamond | bench_dip | trx_tricep_ext tricep_pushdown_rev tricep_kickback_cable',
    // inicio, prudente y 65+: sin fondos en banco ni flexión diamante (C-29; Kolber 2010: fondos profundos y hombro)
    C: 'tricep_machine tricep_pushdown | overhead_ext_db tricep_overhead_cable kickback_db | band_tricep_pushdown band_tricep_overhead | assisted_dip dip_machine tricep_pushdown_bar close_press_db',
  },
  CO: {
    IA: 'plank pallof_press_cable hanging_knee_raise crunch_cable | side_plank ab_wheel_knees dead_bug crunch_machine band_pallof | leg_raise hollow_hold reverse_crunch lying_leg_raise crunch suitcase_carry_db kb_rack_carry farmer_walk_plates woodchop_high_cable woodchop_low_cable crunch_db plate_crunch | ab_wheel_standing toes_to_bar dragon_flag l_sit trx_plank trx_knee_tuck ball_plank ball_crunch bicycle_crunch russian_twist_bw side_bend_db landmine_rotation torso_rotation_machine band_woodchop woodchop_db | flutter_kick heel_touch plank_shoulder_tap ball_pass ball_knee_tuck mb_russian_twist russian_twist_db plate_russian_twist mountain_climber situp v_up mb_rot_throw ball_pike trx_pike | incline_plank_table standing_knee_elbow',
    F: 'plank hanging_knee_raise ab_wheel_knees pallof_press_cable | suitcase_carry_db kb_rack_carry farmer_walk_plates side_plank crunch_cable | dead_bug crunch_machine band_pallof leg_raise hollow_hold reverse_crunch lying_leg_raise crunch woodchop_high_cable woodchop_low_cable crunch_db plate_crunch | ab_wheel_standing toes_to_bar dragon_flag l_sit trx_plank trx_knee_tuck ball_plank ball_crunch bicycle_crunch russian_twist_bw side_bend_db landmine_rotation torso_rotation_machine band_woodchop woodchop_db | incline_plank_table standing_knee_elbow',
    P: 'plank dead_bug pallof_press_cable | side_plank crunch_cable crunch_machine band_pallof hanging_knee_raise | crunch reverse_crunch lying_leg_raise ball_plank ball_crunch suitcase_carry_db farmer_walk_plates | ab_wheel_knees hollow_hold bicycle_crunch trx_plank woodchop_high_cable woodchop_low_cable band_woodchop crunch_db plate_crunch | leg_raise kb_rack_carry russian_twist_bw side_bend_db torso_rotation_machine landmine_rotation woodchop_db | flutter_kick heel_touch plank_shoulder_tap ball_pass ball_knee_tuck mb_russian_twist russian_twist_db plate_russian_twist mountain_climber situp v_up | incline_plank_table standing_knee_elbow',
    C: 'dead_bug plank pallof_press_cable | side_plank band_pallof crunch_machine crunch_cable | ball_plank crunch reverse_crunch lying_leg_raise | suitcase_carry_db ball_crunch farmer_walk_plates | incline_plank_table standing_knee_elbow',
    // 65+: anti-rotación y anti-extensión; nada de flexión ni rotación de columna con carga (§E.5; 05 §7.4; D-01)
    M: 'pallof_press_cable band_pallof | suitcase_carry_db | incline_plank_table | dead_bug plank side_plank | ball_plank',
  },
  // Potencia (solo con «explosivos», I/A): saltos sin carga axial, 3-5 repeticiones rápidas (05 §3.2; D-14). Nunca wall ball, thruster ni burpee.
  PW: { IA: 'box_jump jump_squat | skater_jump jump_lunge tuck_jump' },
  // v8 (paso 6, J-02): rotación externa en lugar de las elevaciones laterales cuando el hombro duele ahora (05 §7.4; Kolber 2010)
  RX: { IA: 'ext_rotation_cable band_ext_rotation | face_pull band_face_pull | ytw_prone' },
  // v8 (paso 6, J-07): extensores de la espalda sin flexión para huesos frágiles (Sinaki 2002; Giangregorio 2014): máquina o banco romano en
  // rango corto; en casa, Y-T-W boca abajo o bird dog
  EX: { IA: 'back_ext_machine hyperextension | ytw_prone bird_dog | ball_back_ext' },
  // Abductores (accesorio de glúteo medio; solo con prioridad glúteos o como reserva de glúteo)
  AB: { IA: 'hip_abductor | hip_abd_cable | miniband_lateral_walk miniband_monster_walk miniband_seated_abd | miniband_clamshell miniband_side_abduction miniband_fire_hydrant | side_lying_abd clamshell fire_hydrant' },
};
const CHAIN = { IA: ['IA'], F: ['F', 'IA'], P: ['P', 'IA'], C: ['C', 'P', 'IA'], M: ['M', 'C', 'P', 'IA'] };

// Etiqueta std (§K.1 propuesta, D-05): A = el estándar que pondría un entrenador; C = rareza (semilla: la lista RAREZA de matriz.js,
// que es «rara en un gimnasio»); el resto, B. Se usa para medir (matriz.js), no para elegir: la elección la deciden los menús.
const STD_A = ['back_squat', 'leg_press', 'hack_squat', 'goblet_squat', 'squat_smith', 'front_squat',
  'bulgarian_squat_db', 'reverse_lunge_db', 'split_squat_db', 'walking_lunge_db', 'lunge_db', 'step_up_db',
  'deadlift', 'rdl_bb', 'rdl_db', 'trap_bar_deadlift', 'hip_thrust_bb', 'hip_thrust_machine', 'hip_thrust_db',
  'leg_curl', 'leg_curl_seated', 'leg_ext', 'calf_machine', 'calf_seated', 'calf_raise_db',
  'bench_press', 'press_flat_db', 'chest_press_machine', 'press_incline_db', 'incline_bench_bb', 'chest_press_incline_machine', 'pushup', 'pushup_incline', 'pushup_knee', 'dip_bars',
  'ohp_bb', 'shoulder_press_db', 'shoulder_press_machine', 'fly_machine', 'cable_fly_mid', 'cable_fly_low', 'cable_fly_high', 'fly_db',
  'lat_pulldown', 'pullup', 'chinup', 'assisted_pullup', 'pulldown_close', 'pullup_neutral',
  'row_cable', 'row_machine', 'row_db', 'bb_row', 'tbar_row_supported', 'row_incline_db', 'inverted_row',
  'lat_raise_db', 'lat_raise_cable', 'lat_raise_machine', 'face_pull', 'rev_fly_machine', 'rear_fly_db',
  'curl_db', 'curl_bb', 'curl_ez', 'curl_cable', 'hammer_curl', 'curl_incline_db', 'preacher_curl_ez',
  'tricep_pushdown', 'tricep_overhead_cable', 'tricep_pushdown_bar', 'skull_crusher_ez', 'overhead_ext_db', 'tricep_machine',
  'plank', 'side_plank', 'dead_bug', 'pallof_press_cable', 'crunch_cable', 'hanging_knee_raise', 'ab_wheel_knees',
  'hip_abductor', 'hip_adductor', 'farmer_walk_db'];
const STD_C = ['squat_cable', 'landmine_squat', 'vsquat', 'belt_squat', 'kb_sumo_squat', 'sumo_squat_db', 'miniband_squat', 'trx_pistol', 'kb_deadlift', 'deadlift_db', 'db_swing',
  'kb_swing_american', 'kb_sl_rdl', 'band_good_morning', 'superman', 'ball_back_ext', 'leg_curl_db', 'trx_leg_curl', 'calf_smith', 'calf_seated_db', 'cable_chest_press', 'press_decline_db',
  'close_press_db', 'pushup_archer', 'bench_dip', 'ring_dip', 'pulldown_machine_uni', 'scap_pullup', 'renegade_row_db', 'row_cable_standing', 'meadows_row', 'row_smith', 'backpack_row',
  'inverted_row_table', 'trx_y_raise', 'y_raise_cable', 'hspu_wall', 'handstand_hold', 'curl_cable_high', 'spider_curl_db', 'zottman_curl_db', 'reverse_curl_bb', 'reverse_curl_db',
  'tricep_pushdown_rev', 'tricep_kickback_cable', 'trx_tricep_ext', 'flutter_kick', 'heel_touch', 'plank_shoulder_tap', 'ball_pass', 'ball_pike', 'trx_pike', 'mb_rot_throw',
  'plate_russian_twist', 'mountain_climber', 'side_bend_db', 'curtsy_lunge_db', 'curtsy_lunge_bw', 'cossack_squat', 'band_lunge', 'trx_lunge', 'hip_thrust_sofa', 'donkey_kick',
  'miniband_kickback', 'band_glute_kickback', 'ball_bridge'];

module.exports = function (K) {
  const L = id => 'lib_' + id;
  const faltan = [];
  const parse = (s, where) => s.split('|').map(t => t.trim().split(/\s+/).filter(Boolean).map(id => { if (!K.BY.has(L(id))) faltan.push(where + ':' + id); return L(id); })).filter(t => t.length);
  const P = {};   // P[slot][clase] = [[ids escalón 0], [ids escalón 1], …]
  for (const [sl, d] of Object.entries(MENUS)) {
    P[sl] = {};
    for (const k of ['IA', 'F', 'P', 'C', 'M']) if (d[k]) P[sl][k] = parse(d[k], sl + '.' + k);
    P[sl].sec = (d.sec || []).map(x => MENUS[x] ? { slot: x } : { tiers: parse(x, sl + '.sec') });
    P[sl].resp = (d.resp || []).map(x => MENUS[x] ? { slot: x } : { tiers: parse(x, sl + '.resp') });
  }
  // escalones de un hueco para una clase (con la cadena de respaldo de clases)
  function tiers(sl, cls) { const m = P[sl]; if (!m) return []; for (const c of CHAIN[cls]) if (m[c]) return m[c]; return m.IA || []; }
  const STD = {}; STD_A.forEach(i => { STD[L(i)] = 'A'; }); STD_C.forEach(i => { STD[L(i)] = 'C'; });
  [...STD_A, ...STD_C].forEach(i => { if (!K.BY.has(L(i))) faltan.push('std:' + i); });
  const std = id => STD[id] || 'B';
  return { MENUS: P, tiers, CHAIN, std, STD_A, STD_C, faltan };
};
