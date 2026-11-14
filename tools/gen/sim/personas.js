// Las seis personas de §N de 20-propuesta.md: respuestas, rutina esperada y comparación con la salida del prototipo.
// node personas.js [--pesos=propuesta|ajustados] [--reparto=recomendado|dias] [--quiet]  → escribe ejemplos.json y personas-comparacion.json
// (con --reparto=dias: ejemplos-dias.json y personas-comparacion-dias.json). v3 (paso 2): + Sergio y Nuria, personas de reparto (D-24), sin «esperado».
// v5 (paso 3): chequeos duros V8 (techo), V9 (tope por sesión), minutos y series de inicio/65+ (función chequeos, abajo).
// v8 (paso 6, 45-juicio-entrenador.md §8): + 4 personas de los graves (Raúl J-01, Inés J-02, Ramón J-03, Jorge J-04).
// v7 (paso 4, C-20, B-1, D-24): + 11 personas de seguridad y bordes; cada persona lleva lo que DEBE y lo que NO DEBE salir (REGLAS, abajo),
// comprobado en código, más las comprobaciones de seguridad comunes de seguridad.js; las de 5-6 días llevan además la `alternativa` con la
// otra variante de reparto (por defecto, 'dias'), con sus propias reglas. Sale con código 1 si algo falla.
'use strict';
const fs = require('fs'), path = require('path');
const K = require('./catalogo.js')();
const arg = k => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : null; };
const OPT = {}; if (arg('tipo')) OPT.tipo = arg('tipo'); if (arg('pases')) OPT.pases = arg('pases'); if (arg('pesos')) OPT.pesos = arg('pesos'); if (arg('reparto')) OPT.reparto = arg('reparto');
const SUF = OPT.reparto === 'dias' ? '-dias' : '';
const G = require('./generador.js')(K, OPT);
const X = require('./textos.js')(K, G);
const ALT_REP = OPT.reparto === 'dias' ? 'recomendado' : 'dias';
const GA = require('./generador.js')(K, Object.assign({}, OPT, { reparto: ALT_REP }));   // la otra variante (B-1)
const XA = require('./textos.js')(K, GA);
const SEG = require('./seguridad.js')(K, G, X);
const MN = require('./menus.js')(K);
const QUIET = process.argv.includes('--quiet');
const OUT = arg('out') || __dirname;

const W = (id, s, r) => ({ id: 'lib_' + id, s, r });
const CW = (id, min) => ({ id: 'lib_' + id, min, cardio: true });
const PERSONAS = [
  { key: 'lucia', nombre: 'Lucía', edad: 34,
    a: { goal: 'salud', exp: 'cero', days: 3, min: 45, consec: false, age: '18', screen: 'nada', zones: {}, sport: 'no', prio: [], places: { main: 'c', g: null, c: K.place('nada') } },
    resumen: 'Créame una rutina · Salud y forma · Empiezo de cero · 3 días, 45 min, sin días seguidos · Casa: «Sin material» · 18-39 · Seguridad: nada de esto · Molestias: ninguna · Deporte: no · Prioridades: todo por igual',
    esp: { split: 'cc2', K: 2, wt: 3, place: { A: 'c', B: 'c' }, min: { A: 37, B: 36 }, plan: {
      A: [CW('cardio_march', 5), W('chair_squat', 2, 12), W('pushup_incline', 2, 12), W('inverted_row_table', 2, 10), W('glute_bridge', 2, 12), W('dead_bug', 2, 10), CW('cardio_dance', 10)],
      B: [CW('cardio_march', 5), W('reverse_lunge_bw', 2, 10), W('pushup_knee', 2, 12), W('ytw_prone', 2, 10), W('good_morning_bw', 2, 12), W('plank', 2, '20s'), CW('cardio_dance', 10)] },
      avisos: ['split_cc2_3', 'step', 'first_week', 'mat_gap'] } },
  { key: 'marta', nombre: 'Marta', edad: 29,
    a: { goal: 'musculo', exp: '6m2a', days: 4, min: 60, age: '18', screen: 'nada', zones: {}, sport: 'no', prio: ['gluteos'], places: { main: 'g', g: K.place('grande'), c: null } },
    resumen: 'Créame una rutina · Ganar músculo · De 6 meses a 2 años · 4 días, 60 min · Gimnasio grande (P6 se salta) · 18-39 · Seguridad: nada de esto · Molestias: ninguna · Deporte: no · Prioridad: glúteos',
    esp: { split: 'tp4', K: 4, wt: 4, place: { A: 'g', B: 'g', C: 'g', D: 'g' }, min: { A: 53, B: 54, C: 54, D: 52 }, plan: {
      A: [CW('cardio_walk', 5), W('bench_press', 4, 10), W('row_cable', 3, 10), W('shoulder_press_db', 2, 12), W('lat_pulldown', 3, 12), W('lat_raise_db', 3, 15), W('tricep_pushdown', 2, 12), W('face_pull', 2, 15)],
      B: [CW('cardio_walk', 5), W('back_squat', 3, 10), W('rdl_bb', 3, 10), W('bulgarian_squat_db', 2, 12), W('leg_curl_seated', 3, 12), W('hip_abductor', 2, 15), W('calf_machine', 3, 15), W('crunch_cable', 3, 15)],
      C: [CW('cardio_walk', 5), W('pulldown_close', 3, 12), W('press_incline_db', 4, 12), W('tbar_row_supported', 3, 12), W('cable_fly_low', 3, 12), W('lat_raise_cable', 2, 15), W('curl_incline_db', 2, 12), W('tricep_overhead_cable', 2, 12)],
      D: [CW('cardio_walk', 5), W('hip_thrust_bb', 4, 12), W('leg_press', 3, 12), W('reverse_lunge_db', 2, 12), W('leg_curl', 2, 12), W('leg_ext', 2, 15), W('calf_seated', 2, 15), W('pallof_press_cable', 2, 12)] },
      avisos: ['split_tp4', 'prio', 'reps', 'rest'] } },
  { key: 'javier', nombre: 'Javier', edad: 31,
    a: { goal: 'musculo', exp: 'gt2a', ritmo: 'meses', days: 6, min: 75, age: '18', screen: 'nada', zones: {}, sport: 'no', prio: [], places: { main: 'g', g: K.place('grande'), c: null } },
    resumen: 'Créame una rutina · Ganar músculo · Más de 2 años → «Me cuesta semanas o meses» · 6 días, 75 min · Gimnasio grande · 18-39 · Seguridad: nada de esto · Molestias: ninguna · Deporte: no · Prioridades: todo por igual',
    esp: { split: 'ppl3', K: 3, wt: 6, place: { A: 'g', B: 'g', C: 'g' }, min: { A: 55, B: 48, C: 53 }, plan: {
      A: [CW('cardio_walk', 5), W('bench_press', 3, 8), W('ohp_bb', 2, 10), W('press_incline_db', 2, 10), W('cable_fly_low', 2, 12), W('lat_raise_cable', 3, 15), W('tricep_overhead_cable', 2, 12), W('tricep_pushdown', 2, 12), W('crunch_cable', 2, 15)],
      B: [CW('cardio_walk', 5), W('pullup', 3, 8), W('bb_row', 3, 10), W('row_cable_one_arm', 2, 12), W('face_pull', 2, 15), W('rear_fly_cable', 2, 15), W('curl_incline_db', 2, 12), W('hammer_curl', 2, 12)],
      C: [CW('cardio_bike', 5), W('back_squat', 3, 8), W('rdl_bb', 3, 10), W('leg_press', 2, 12), W('leg_curl_seated', 3, 12), W('leg_ext', 2, 15), W('calf_machine', 3, 15), W('hanging_knee_raise', 2, 12)] },
      avisos: ['split_ppl', 'reps', 'rest', 'time_spare'] } },
  { key: 'antonio', nombre: 'Antonio', edad: 67,
    a: { goal: 'salud', exp: 'lt6m', days: 2, min: 45, age: '65', screen: 'nada', zones: { rodilla: 'antigua' }, pref: { impact: false, floor: true }, sport: 'suave', prio: [], places: { main: 'g', g: K.place('barrio'), c: null } },
    resumen: 'Créame una rutina · Salud y forma · Menos de 6 meses · 2 días, 45 min · Gimnasio pequeño o de barrio → «Está bien así» · 65-74 · Seguridad: nada de esto · Rodilla: lesión antigua + «Prefiero sin saltos ni impacto» + consentimiento · Deporte: camino o voy en bici, tranquilo · Prioridades: todo por igual',
    esp: { split: 'cc2', K: 2, wt: 2, place: { A: 'g', B: 'g' }, min: { A: 43, B: 42 }, plan: {
      A: [CW('cardio_bike', 8), W('leg_press', 3, 12), W('chest_press_machine', 3, 12), W('lat_pulldown', 2, 12), W('leg_curl_seated', 2, 12), W('face_pull', 2, 15), W('pallof_press_cable', 2, 12)],
      B: [CW('cardio_bike', 8), W('rdl_db', 2, 12), W('shoulder_press_machine', 2, 12), W('row_machine', 3, 12), W('step_up_bw', 2, 10), W('pushup_incline', 2, 12), W('dead_bug', 2, 10)] },
      avisos: ['age65', 'lim', 'stable', 'paseos'] } },
  { key: 'rosa', nombre: 'Rosa', edad: 46,
    a: { goal: 'grasa', exp: '6m2a', days: 3, min: 30, age: '40', screen: 'nada', zones: {}, sport: 'suave', prio: [], places: { main: 'c', g: null, c: K.place('mancbanco', { dbMax: 20 }) } },
    resumen: 'Créame una rutina · Perder grasa · De 6 meses a 2 años · 3 días, 30 min · Casa: «Mancuernas y banco» → mancuernas hasta 20 kg, el banco se inclina · 40-64 · Seguridad: nada de esto · Molestias: ninguna · Deporte: camino o voy en bici, tranquilo · Prioridades: todo por igual',
    esp: { split: 'cc3', K: 3, wt: 3, place: { A: 'c', B: 'c', C: 'c' }, min: { A: 30, B: 30, C: 30 }, plan: {
      A: [CW('cardio_march', 3), W('goblet_squat', 3, 10), W('press_flat_db', 3, 10), W('row_incline_db', 3, 10), W('dead_bug', 2, 10)],
      B: [CW('cardio_march', 3), W('rdl_db', 3, 10), W('shoulder_press_db', 3, 10), W('pullover_db', 3, 12), W('split_squat_db', 2, 12)],
      C: [CW('cardio_march', 3), W('hip_thrust_db', 3, 10), W('press_incline_db', 3, 10), W('row_bent_db', 3, 10), W('side_bend_db', 2, 12)] },
      avisos: ['time_cut', 'cardio', 'vol_corto'] } },
  { key: 'david', nombre: 'David', edad: 44,
    a: { goal: 'fuerza', exp: 'gt2a', ritmo: 'semanas', days: 4, min: 60, age: '40', screen: 'nada', zones: {}, sport: 'suave', prio: [], daysOther: 1,
      places: { main: 'g', g: K.place('barrio'), c: K.place('basico', { dbMax: 20 }) } },
    resumen: 'Créame una rutina · Ganar fuerza · Más de 2 años → «Casi cada semana» · 4 días, 60 min · Gimnasio pequeño o de barrio → «Está bien así» → + Casa «Lo básico» (mancuernas hasta 20 kg, bandas con anclaje, minibanda) → 1 día en casa · 40-64 · Seguridad: nada de esto · Molestias: ninguna · Deporte: camino o voy en bici, tranquilo · Prioridades: todo por igual',
    esp: { split: 'tp4', K: 4, wt: 4, place: { A: 'g', B: 'g', C: 'g', D: 'c' }, min: { A: 46, B: 50, C: 41, D: 51 }, plan: {
      A: [CW('cardio_bike', 5), W('back_squat', 3, 6), W('rdl_bb', 3, 8), W('bulgarian_squat_db', 2, 8), W('leg_curl_seated', 2, 10), W('calf_machine', 2, 15), W('plank', 2, '40s')],
      B: [CW('cardio_walk', 5), W('bench_press', 4, 6), W('bb_row', 3, 8), W('ohp_bb', 2, 8), W('lat_pulldown', 2, 8), W('tricep_pushdown', 2, 10), W('face_pull', 2, 15)],
      C: [CW('cardio_elliptical', 5), W('deadlift', 3, 6), W('leg_press', 3, 8), W('hip_thrust_bb', 2, 8), W('leg_curl', 2, 10), W('hanging_knee_raise', 2, 12)],
      D: [CW('cardio_march', 5), W('shoulder_press_db', 3, 8), W('band_pulldown', 3, 15), W('row_db', 3, 8), W('floor_press_db', 3, 10), W('band_face_pull', 2, 15), W('curl_db', 2, 10)] },
      avisos: ['split_tp4', 'places', 'reps', 'rest'] } },
  // v3 (D-24): personas de reparto para enseñar las dos variantes (sin rutina «esperada»: se revisan a mano)
  { key: 'sergio', nombre: 'Sergio', edad: 27, grupo: 'reparto (B-1)', motivo: 'paso 2: 6 días en gimnasio grande, para ver las dos variantes de reparto',
    a: { goal: 'musculo', exp: '6m2a', days: 6, min: 60, age: '18', screen: 'nada', zones: {}, sport: 'no', prio: [], places: { main: 'g', g: K.place('grande'), c: null } },
    resumen: 'Créame una rutina · Ganar músculo · De 6 meses a 2 años · 6 días, 60 min · Gimnasio grande · 18-39 · Seguridad: nada de esto · Molestias: ninguna · Deporte: no · Prioridades: todo por igual', esp: null },
  { key: 'nuria', nombre: 'Nuria', edad: 41, grupo: 'reparto (B-1)', motivo: 'paso 2: 6 días en casa con mancuernas y banco, para ver las dos variantes de reparto',
    a: { goal: 'musculo', exp: '6m2a', days: 6, min: 45, age: '40', screen: 'nada', zones: {}, sport: 'no', prio: [], places: { main: 'c', g: null, c: K.place('mancbanco', { dbMax: 20 }) } },
    resumen: 'Créame una rutina · Ganar músculo · De 6 meses a 2 años · 6 días, 45 min · Casa: «Mancuernas y banco» (hasta 20 kg, el banco se inclina) · 40-64 · Seguridad: nada de esto · Molestias: ninguna · Deporte: no · Prioridades: todo por igual', esp: null },
  // ── v7 (paso 4, C-20 y B-1): personas de seguridad y bordes (sin rutina «esperada» ejercicio a ejercicio: lo que DEBE y NO DEBE salir, en REGLAS) ──
  { key: 'carmen', nombre: 'Carmen', edad: 58, grupo: 'seguridad', motivo: 'C-10, C-17: tensión alta con medicación, sedentaria, en casa y con 20 minutos',
    a: { goal: 'salud', exp: 'cero', days: 3, min: 20, consec: false, age: '40', screen: ['enf', 'med'], zones: {}, sport: 'no', prio: [], places: { main: 'c', g: null, c: K.place('basico', { dbMax: 10 }) } },
    resumen: 'Créame una rutina · Salud y forma · Empiezo de cero · 3 días, 20 min · Casa: «Lo básico» (mancuernas hasta 10 kg, bandas con anclaje, minibanda) · 40-64 · Seguridad: 🩺 tensión alta y 💊 medicación diaria (tensión y metformina) · Molestias: ninguna · Deporte: no, por ahora no · Prioridades: todo por igual', esp: null },
  { key: 'manuel', nombre: 'Manuel', edad: 70, grupo: 'seguridad', motivo: 'C-07, C-09, I-11: 70 años con 15 de pesas, 4 días',
    a: { goal: 'musculo', exp: 'gt2a', ritmo: 'semanas', days: 4, min: 60, age: '65', screen: 'nada', zones: {}, sport: 'suave', prio: [], places: { main: 'g', g: K.place('barrio'), c: null } },
    resumen: 'Créame una rutina · Ganar músculo · Más de 2 años → «Casi cada semana» (15 años de pesas) · 4 días, 60 min · Gimnasio pequeño o de barrio · 65-74 · Seguridad: nada de esto · Molestias: ninguna · Deporte: camino o voy en bici, tranquilo · Prioridades: todo por igual', esp: null },
  { key: 'pablo', nombre: 'Pablo', edad: 35, grupo: 'seguridad', motivo: 'C-16: tirón lumbar hace 2 semanas (lesión reciente = «Me operaron»)',
    a: { goal: 'musculo', exp: '6m2a', days: 3, min: 60, age: '18', screen: 'nada', zones: { lumbar: 'reciente' }, sport: 'no', prio: [], places: { main: 'g', g: K.place('grande'), c: null } },
    resumen: 'Créame una rutina · Ganar músculo · De 6 meses a 2 años · 3 días, 60 min · Gimnasio grande · 18-39 · Seguridad: nada de esto · Espalda baja: «Me duele ahora» → «¿Es por un golpe, una caída o un tirón de las últimas 6 semanas?» Sí (tirón hace 2 semanas) · Deporte: no · Prioridades: todo por igual', esp: null },
  { key: 'lucas', nombre: 'Lucas', edad: 17, grupo: 'seguridad', motivo: '16-17 años con «Ganar fuerza» (modo prudente, C-27)',
    a: { goal: 'fuerza', exp: '6m2a', days: 3, min: 60, age: '16', screen: 'nada', zones: {}, sport: 'piernas', prio: [], power: true, places: { main: 'g', g: K.place('grande'), c: null } },
    resumen: 'Créame una rutina · Ganar fuerza · De 6 meses a 2 años · 3 días, 60 min · Gimnasio grande · 16 o 17 · Seguridad: nada de esto · Molestias: ninguna · Deporte: corro o hago deporte de piernas (fútbol) · Prioridades: todo por igual · Afinar: «Incluir ejercicios explosivos»', esp: null },
  { key: 'alex', nombre: 'Alex', edad: null, grupo: 'seguridad', motivo: 'C-14, I-12: «Prefiero no decirlo» en la edad, con experiencia y 4 días',
    a: { goal: 'musculo', exp: 'gt2a', ritmo: 'semanas', days: 4, min: 60, age: 'nd', screen: 'nada', zones: {}, sport: 'no', prio: [], places: { main: 'g', g: K.place('grande'), c: null } },
    resumen: 'Créame una rutina · Ganar músculo · Más de 2 años → «Casi cada semana» · 4 días, 60 min · Gimnasio grande · Edad: «Prefiero no decirlo» · Seguridad: nada de esto · Molestias: ninguna · Deporte: no · Prioridades: todo por igual', esp: null },
  { key: 'elena', nombre: 'Elena', edad: 38, grupo: 'seguridad', motivo: 'C-02: vuelve tras 14 meses sin entrenar, con historial (y un ejercicio de riesgo en él)',
    a: { goal: 'musculo', exp: 'paron', paron: { antes: 'gt2a', fuera: 'gt6m' }, days: 3, min: 60, age: '18', screen: 'nada', zones: {}, sport: 'no', prio: [], places: { main: 'g', g: K.place('barrio'), c: null } },
    ctx: { hist: { lib_back_squat: { n: 40 }, lib_bench_press: { n: 40 }, lib_lat_pulldown: { n: 35 }, lib_row_cable: { n: 30 }, lib_leg_press: { n: 20 }, lib_rdl_db: { n: 20 }, lib_shoulder_press_db: { n: 25 }, lib_curl_db: { n: 30 }, lib_lat_pulldown_behind: { n: 12 } } },
    resumen: 'Créame una rutina · Ganar músculo · Vuelvo tras un parón → antes «Más de 2 años» · fuera «Más de 6 meses» (14 meses) · 3 días, 60 min · Gimnasio pequeño o de barrio · 18-39 · Seguridad: nada de esto · Molestias: ninguna · Deporte: no · Historial: sentadilla, banca, jalón (también tras nuca), remo, prensa, rumano con mancuernas, press de hombros y curl', esp: null },
  { key: 'irene', nombre: 'Irene', edad: 29, grupo: 'bordes', motivo: '«Aguantar más» con 5 días (B-1: 5 días en las dos variantes)',
    a: { goal: 'aguante', exp: '6m2a', days: 5, min: 45, age: '18', screen: 'nada', zones: {}, sport: 'piernas', prio: [], places: { main: 'g', g: K.place('grande'), c: null } },
    resumen: 'Créame una rutina · Aguantar más · De 6 meses a 2 años · 5 días, 45 min · Gimnasio grande · 18-39 · Seguridad: nada de esto · Molestias: ninguna · Deporte: corro o hago deporte de piernas · Prioridades: todo por igual', esp: null },
  { key: 'pilar', nombre: 'Pilar', edad: 52, grupo: 'seguridad', motivo: 'C-13: huesos frágiles (osteoporosis), en casa',
    a: { goal: 'salud', exp: '6m2a', days: 3, min: 45, age: '40', screen: 'nada', zones: {}, huesos: true, sport: 'suave', prio: [], places: { main: 'c', g: null, c: K.place('mancbanco', { dbMax: 20 }) } },
    resumen: 'Créame una rutina · Salud y forma · De 6 meses a 2 años · 3 días, 45 min · Casa: «Mancuernas y banco» (hasta 20 kg) · 40-64 · Seguridad: nada de esto · Molestias: «Huesos frágiles (osteoporosis o una fractura por un golpe leve)» · Deporte: camino, tranquilo · Prioridades: todo por igual', esp: null },
  { key: 'sara', nombre: 'Sara', edad: 30, grupo: 'bordes', motivo: 'C-15: «Otra zona» (tobillo, lesión antigua) sin modo prudente; 5 días (B-1)',
    a: { goal: 'musculo', exp: 'gt2a', ritmo: 'meses', days: 5, min: 60, age: '18', screen: 'nada', zones: { otra: 'antigua' }, sport: 'no', prio: [], places: { main: 'g', g: K.place('grande'), c: null } },
    resumen: 'Créame una rutina · Ganar músculo · Más de 2 años → «Me cuesta semanas o meses» · 5 días, 60 min · Gimnasio grande · 18-39 · Seguridad: nada de esto · Molestias: «Otra zona» (tobillo) → «Lesión antigua» · Deporte: no · Prioridades: todo por igual', esp: null },
  { key: 'luis', nombre: 'Luis', edad: 55, grupo: 'bordes', motivo: 'I-4: entrenó años y lo dejó hace 20 (parón de más de 2 años)',
    a: { goal: 'salud', exp: 'paron', paron: { antes: 'gt2a', fuera: 'gt2a' }, days: 3, min: 45, age: '40', screen: 'nada', zones: {}, sport: 'suave', prio: [], places: { main: 'g', g: K.place('barrio'), c: null } },
    resumen: 'Créame una rutina · Salud y forma · Vuelvo tras un parón → antes «Más de 2 años» · fuera «Más de 2 años» (20 años) · 3 días, 45 min · Gimnasio pequeño o de barrio · 40-64 · Seguridad: nada de esto · Molestias: ninguna · Deporte: camino, tranquilo · Prioridades: todo por igual', esp: null },
  { key: 'marina', nombre: 'Marina', edad: 33, grupo: 'seguridad', motivo: 'C-12: posparto con el alta de la revisión, en casa',
    a: { goal: 'salud', exp: 'lt6m', days: 3, min: 30, age: '18', screen: 'nada', posparto: 'alta', zones: {}, sport: 'no', prio: [], places: { main: 'c', g: null, c: K.place('basico', { dbMax: 10 }) } },
    resumen: 'Créame una rutina · Salud y forma · Menos de 6 meses · 3 días, 30 min · Casa: «Lo básico» (mancuernas hasta 10 kg) · 18-39 · Seguridad: «He dado a luz hace menos de un año» → «¿Te han dado el alta para hacer ejercicio?» Sí · Molestias: ninguna · Deporte: no · Prioridades: todo por igual', esp: null },
  // ── v8 (paso 6): una persona por cada defecto grave del juez de entrenador (J-01…J-04) ──
  { key: 'raul', nombre: 'Raúl', edad: 32, grupo: 'seguridad', motivo: 'J-01, J-04: tirón lumbar hace 3 semanas y pide explosivos',
    a: { goal: 'musculo', exp: '6m2a', days: 4, min: 60, age: '18', screen: 'nada', zones: { lumbar: 'reciente' }, sport: 'piernas', prio: [], power: true, places: { main: 'g', g: K.place('grande'), c: null } },
    resumen: 'Créame una rutina · Ganar músculo · De 6 meses a 2 años · 4 días, 60 min · Gimnasio grande · 18-39 · Seguridad: nada de esto · Espalda baja: «Me duele ahora» → tirón de hace 3 semanas (lesión reciente) · Deporte: fútbol · Afinar: «Incluir ejercicios explosivos»', esp: null },
  { key: 'ines', nombre: 'Inés', edad: 36, grupo: 'seguridad', motivo: 'J-02: hombro que duele ahora, avanzada, gimnasio en casa (barra, rack, dominadas y mancuernas)',
    a: { goal: 'musculo', exp: 'gt2a', ritmo: 'meses', days: 4, min: 60, age: '18', screen: 'nada', zones: { hombro: 'ahora' }, sport: 'no', prio: [], places: { main: 'c', g: null, c: K.place('casagym') } },
    resumen: 'Créame una rutina · Ganar músculo · Más de 2 años → «Me cuesta semanas o meses» · 4 días, 60 min · Casa: «Gimnasio en casa» (barra, rack, dominadas, mancuernas hasta 30 kg, banco) · 18-39 · Seguridad: nada de esto · Hombro: «Me duele ahora» · Deporte: no', esp: null },
  { key: 'ramon', nombre: 'Ramón', edad: 75, grupo: 'seguridad', motivo: 'J-03: 75 años con experiencia en un parque de calistenia (barra de dominadas y paralelas)',
    a: { goal: 'salud', exp: '6m2a', days: 3, min: 30, age: '75', screen: 'nada', zones: {}, sport: 'suave', prio: [], places: { main: 'c', g: null, c: K.place('parque') } },
    resumen: 'Créame una rutina · Salud y forma · De 6 meses a 2 años · 3 días, 30 min · Parque de calistenia · 75 o más · Seguridad: nada de esto · Molestias: ninguna · Deporte: camino', esp: null },
  { key: 'jorge', nombre: 'Jorge', edad: 45, grupo: 'seguridad', motivo: 'J-04, J-08: espalda baja operada, «Ganar fuerza» en un gimnasio en casa, prioridad brazos y pecho',
    a: { goal: 'fuerza', exp: '6m2a', days: 4, min: 75, age: '40', screen: 'nada', zones: { lumbar: 'op' }, sport: 'no', prio: ['brazos', 'pecho'], places: { main: 'c', g: null, c: K.place('casagym') } },
    resumen: 'Créame una rutina · Ganar fuerza · De 6 meses a 2 años · 4 días, 75 min · Casa: «Gimnasio en casa» · 40-64 · Seguridad: nada de esto · Espalda baja: «Me operaron» · Deporte: no · Prioridades: brazos y pecho', esp: null },
  // v14 (P1, repaso del reparto): personas que eligen su reparto en «Cambiar reparto» (a.plan). Solo vale con un entreno distinto por día
  // ('dias'): sus reglas van en debeAlt; con 'recomendado' el plan no se aplica (debe)
  { key: 'dani', nombre: 'Dani', edad: 30, grupo: 'reparto elegido', motivo: 'P1: el caso que pidió el usuario: 4 días con un solo día de pierna (empuje, tirón, pierna y torso)',
    a: { goal: 'musculo', exp: '6m2a', days: 4, min: 60, age: '18', screen: 'nada', zones: {}, sport: 'no', prio: [], places: { main: 'g', g: K.place('grande'), c: null }, plan: 'pplt4' },
    resumen: 'Ganar músculo · De 6 meses a 2 años · 4 días, 60 min · Gimnasio grande · «Cambiar reparto»: empuje, tirón, pierna y torso', esp: null },
  { key: 'nerea', nombre: 'Nerea', edad: 27, grupo: 'reparto elegido', motivo: 'P1: «por músculos» con 4 días en un gimnasio de barrio (pecho y espalda en días distintos)',
    a: { goal: 'musculo', exp: 'gt2a', ritmo: 'meses', days: 4, min: 75, age: '18', screen: 'nada', zones: {}, sport: 'no', prio: [], places: { main: 'g', g: K.place('barrio'), c: null }, plan: 'grp4' },
    resumen: 'Ganar músculo · Más de 2 años, le cuesta meses · 4 días, 75 min · Gimnasio de barrio · «Cambiar reparto»: por músculos', esp: null },
  { key: 'hugo', nombre: 'Hugo', edad: 35, grupo: 'reparto elegido', motivo: 'P1: «Ganar fuerza» con un solo día de pierna: los cuatro levantamientos siguen en la semana',
    a: { goal: 'fuerza', exp: 'gt2a', ritmo: 'meses', days: 4, min: 75, age: '18', screen: 'nada', zones: {}, sport: 'no', prio: [], places: { main: 'g', g: K.place('grande'), c: null }, plan: 'pplt4' },
    resumen: 'Ganar fuerza · Más de 2 años, le cuesta meses · 4 días, 75 min · Gimnasio grande · «Cambiar reparto»: empuje, tirón, pierna y torso', esp: null },
  { key: 'paco', nombre: 'Paco', edad: 68, grupo: 'reparto elegido', motivo: 'P1: 65 o más con experiencia que llega con un reparto elegido guardado: no se le aplica (sus reglas no se tocan)',
    a: { goal: 'salud', exp: 'gt2a', ritmo: 'meses', days: 4, min: 60, age: '65', screen: 'nada', zones: {}, sport: 'suave', prio: [], places: { main: 'g', g: K.place('grande'), c: null }, plan: 'pplt4' },
    resumen: 'Salud y forma · Más de 2 años · 4 días, 60 min · Gimnasio grande · 65-74 · con un reparto elegido guardado de antes', esp: null },
  { key: 'iker', nombre: 'Iker', edad: 33, grupo: 'reparto elegido', motivo: 'P1: un solo día de pierna en casa con lo básico (mancuernas de 20 kg y bandas), 5 días de 45 min',
    a: { goal: 'musculo', exp: '6m2a', days: 5, min: 45, age: '18', screen: 'nada', zones: {}, sport: 'no', prio: [], places: { main: 'c', g: null, c: K.place('basico') }, plan: 'pplet5' },
    resumen: 'Ganar músculo · De 6 meses a 2 años · 5 días, 45 min · Casa: «Lo básico» · «Cambiar reparto»: empuje y tirón dos veces y un día de pierna', esp: null },
  { key: 'tomas', nombre: 'Tomás', edad: 38, grupo: 'reparto elegido', motivo: 'P2: «Más torso» en el cuestionario con 5 días: un solo día de pierna sin pasar por «Cambiar reparto»',
    a: { goal: 'musculo', exp: '6m2a', days: 5, min: 60, age: '18', screen: 'nada', zones: {}, sport: 'no', prio: [], places: { main: 'g', g: K.place('grande'), c: null }, enfoque: 'torso' },
    resumen: 'Ganar músculo · De 6 meses a 2 años · 5 días, 60 min · Gimnasio grande · Reparto entre torso y pierna: «Más torso»', esp: null },
  { key: 'marcos', nombre: 'Marcos', edad: 26, grupo: 'reparto elegido', motivo: 'P2: «Más glúteo y pierna» ya no es solo para mujeres: un hombre con 4 días',
    a: { goal: 'musculo', exp: '6m2a', days: 4, min: 60, age: '18', screen: 'nada', zones: {}, sport: 'no', prio: [], places: { main: 'g', g: K.place('grande'), c: null }, enfoque: 'gluteo' },
    resumen: 'Ganar músculo · De 6 meses a 2 años · 4 días, 60 min · Gimnasio grande · Hombre · Reparto entre torso y pierna: «Más glúteo y pierna»', esp: null },
  { key: 'lola', nombre: 'Lola', edad: 41, grupo: 'reparto elegido', motivo: 'P1: empieza de cero y elige empuje, tirón, pierna y cuerpo completo: se le permite, con sus series y su esfuerzo de inicio',
    a: { goal: 'salud', exp: 'cero', days: 4, min: 45, age: '40', screen: 'nada', zones: {}, sport: 'no', prio: [], places: { main: 'g', g: K.place('barrio'), c: null }, plan: 'pplc4' },
    resumen: 'Salud y forma · Empiezo de cero · 4 días, 45 min · Gimnasio de barrio · 40-64 · «Cambiar reparto»: empuje, tirón, pierna y cuerpo completo', esp: null },
];

// ── v7 (paso 4): lo que DEBE y lo que NO DEBE salir, por persona, comprobado en código. R = rutina analizada (mkR). Cada regla: [texto, (R) → bien?, (R) → detalle] ──
const L_ = s => 'lib_' + s;
const tiene = (R, ...xs) => xs.some(x => R.ids.has(L_(x)));
const hay = (R, ...xs) => xs.filter(x => R.ids.has(L_(x)));
const rrOf = r => G.repRange(r.L, r.r);
const prin = R => R.rows.filter(r => r.prio === 1 && r.L.c);
const enRango = (R, lo, hi) => R.det.every(d => d.minExact >= lo * R.inp.min - 1e-9 && d.minExact <= hi * R.inp.min + 1e-9);
const mins = R => R.det.map(d => d.letra + ' ' + Math.round(d.minExact)).join(' · ');
const rarezas = R => R.rows.filter(r => r.place === 'g' && MN.std(r.lib) === 'C').map(r => r.lib.replace('lib_', ''));
const conPeso = R => R.rows.filter(r => r.L.lt === 'w' && typeof r.r === 'number');
const APOYO_MAT = ['corporal', 'maquina', 'smith', 'trx', 'step', 'banda'];
const uniApoyo = R => R.rows.filter(r => r.L.u && ['lunge', 'squat'].includes(r.L.pat) && APOYO_MAT.includes(r.L.mat)).map(r => r.lib.replace('lib_', ''));
const SUELO = R => R.rows.filter(r => K.TAGS.suelo.has(r.lib)).map(r => r.lib.replace('lib_', ''));
const COLUMNA = R => R.rows.filter(r => K.TAGS.spine.has(r.lib) || K.TAGS.spineFlex.has(r.lib)).map(r => r.lib.replace('lib_', ''));
// E14a: el bloque de equilibrio son varias filas «bal»: sus minutos son la suma
const balance = R => R.det.map(d => { const w = d.rows.find(r => r.kind === 'warm'), b = d.rows.find(r => r.kind === 'bal'), bm = d.rows.filter(r => r.kind === 'bal').reduce((t, r) => t + (+r.min || 0), 0); return { d: d.letra, w: w ? w.min : 0, b: bm, orden: !b || !w || d.rows.indexOf(b) > d.rows.indexOf(w) }; });
const T = (R, re) => re.test(R.txt);
// v14 (P1): los días de la semana por su tipo y la regla común de la variante 'recomendado' (y de quien no puede elegir): el plan no se aplica
const roles = R => Object.values(R.m.tpl).join(',');
const ELEGIDOS = ['tpt3', 'pplt4', 'pplc4', 'grp4', 'pplet5', 'grp5', 'tptpt5', 'pplg6'];
const SIN_PLAN = ['El reparto elegido no se aplica aquí (solo vale con un entreno distinto por día y con quien puede elegir)', R => !ELEGIDOS.includes(R.m.split), R => R.m.split];
const REGLAS = {
  lucia: { debe: [
    ['Empieza de cero: la forma de salida son 2 entrenos que se alternan (P9; cambia D1 para quien empieza)', R => G.formaInicial(R.inp) === 'recomendado' && G.formaInicial(Object.assign({}, R.inp, { masTorso: true })) === 'dias' && G.formaInicial(Object.assign({}, R.inp, { enfoque: 'gluteo' })) === 'dias'],
    ['Cuerpo completo A/B que se alternan (inicio con 3 días)', R => R.m.split === 'cc2' && R.m.wd === 3, R => R.m.split],
    ['Primer escalón en casa: sentadilla a la silla y flexiones inclinadas o de rodillas', R => tiene(R, 'chair_squat') && tiene(R, 'pushup_incline', 'pushup_knee'), R => [...R.ids].join(',')],
    ['Modo inicio: 2 series y 4-5 ejercicios por día', R => R.rows.every(r => r.series <= 2) && R.det.every(d => { const n = d.rows.filter(r => r.kind === 'str').length; return n >= 4 && n <= 5; }), R => R.det.map(d => d.rows.filter(r => r.kind === 'str').length).join('/')],
    ['Esfuerzo «Fácil» en meta.effort (C-01)', R => R.m.effort.obj === 'facil', R => JSON.stringify(R.m.effort)]],
    noDebe: [
    ['Flexiones completas, sentadilla libre o fondos (variantes duras para empezar)', R => hay(R, 'pushup', 'air_squat', 'bench_dip', 'pushup_wide').length > 0, R => hay(R, 'pushup', 'air_squat', 'bench_dip', 'pushup_wide').join(',')],
    ['Pasarse de 45 min', R => !enRango(R, 0, 1.05), mins]] },
  marta: { debe: [
    ['Con experiencia, la forma de salida es un entreno distinto cada día (P9 solo cambia a quien empieza de cero)', R => G.formaInicial(R.inp) === 'dias'],
    ['Torso/pierna ×2 (K=4)', R => R.m.split === 'tp4', R => R.m.split],
    ['Pierna con básicos de barra o máquina en el hueco 1 (sentadilla, prensa, hack, rumano, peso muerto, hip thrust)', R => R.rows.filter(r => r.prio === 1 && ['squat', 'hinge', 'hip_ext', 'lunge'].includes(r.L.pat)).every(r => ['back_squat', 'leg_press', 'hack_squat', 'rdl_bb', 'deadlift', 'hip_thrust_bb', 'hip_thrust_machine', 'front_squat', 'squat_smith'].includes(r.lib.replace('lib_', ''))), R => R.rows.filter(r => r.prio === 1).map(r => r.lib).join(',')],
    ['Hip thrust (barra o máquina) por su prioridad de glúteos', R => tiene(R, 'hip_thrust_bb', 'hip_thrust_machine')],
    ['«Ganar músculo» con días de torso de 60 min: curl y tríceps directos sin pedir prioridad de brazos (P3)', R => R.rows.some(r => r.L.pat === 'curl') && R.rows.some(r => r.L.pat === 'tri'), R => R.rows.map(r => r.L.pat).join(',')],
    ['Los brazos extra no dejan la semana sin hombro posterior directo (P3)', R => R.rows.some(r => r.L.pat === 'rear')],
    ['Principales con 3 o más series', R => prin(R).every(r => r.series >= 3), R => prin(R).map(r => r.lib.replace('lib_', '') + '×' + r.series).join(',')],
    ['Sesiones de 51-63 min (85-105 % de 60)', R => enRango(R, 0.85, 1.05), mins]],
    noDebe: [
    ['Peso muerto con kettlebell, sentadilla en polea o rarezas en el gimnasio', R => tiene(R, 'kb_deadlift', 'squat_cable') || rarezas(R).length > 0, R => rarezas(R).join(',')],
    ['Aislamiento como principal', R => R.rows.some(r => r.prio === 1 && !r.L.c)]] },
  javier: { debe: [
    ['Empuje/tirón/pierna ×2 con 3 entrenos (recomendado)', R => R.m.split === 'ppl3', R => R.m.split],
    ['Principales con 3 o más series (avanzado, 75 min)', R => prin(R).every(r => r.series >= 3), R => prin(R).map(r => r.lib.replace('lib_', '') + '×' + r.series).join(',')],
    ['Básicos de gimnasio: banca, sentadilla o prensa, dominadas o jalón y remo', R => tiene(R, 'bench_press') && tiene(R, 'back_squat', 'hack_squat', 'leg_press') && tiene(R, 'pullup', 'lat_pulldown', 'chinup') && tiene(R, 'bb_row', 'row_cable', 'row_db', 'tbar_row_supported')],
    ['Cada día ≥ 85 % de 75 min o, si no, con el volumen en lo alto del rango y el texto «no hace falta más» (decisión pendiente, paso 3)', R => R.det.every(d => d.minExact >= 0.85 * 75 || d.sobraMotivo === 'rango') && (R.det.every(d => d.minExact >= 0.85 * 75) || T(R, /no hace falta más/)), mins]],
    noDebe: [
    ['Curl araña o rarezas en el gimnasio', R => tiene(R, 'spider_curl_db') || rarezas(R).length > 0, R => rarezas(R).join(',')],
    ['Pasarse de 75 min', R => !enRango(R, 0, 1.05), mins]],
    debeAlt: [
    ['«dias»: 6 entrenos distintos (K=6)', R => R.m.K === 6, R => R.m.split + ' K=' + R.m.K],
    ['«dias»: principales con 3 o más series', R => prin(R).every(r => r.series >= 3), R => prin(R).filter(r => r.series < 3).map(r => r.lib).join(',')],
    ['«dias»: sin rarezas en el gimnasio', R => rarezas(R).length === 0, R => rarezas(R).join(',')],
    ['«dias»: cada día ≤ 105 % de 75 min', R => enRango(R, 0, 1.05), mins]] },
  antonio: { debe: [
    ['Calentamiento de 8 min y, tras él, bloque de equilibrio de 5 min o más (C-09)', R => balance(R).every(x => x.w === 8 && x.b >= 5 && x.orden), R => JSON.stringify(balance(R))],
    ['Unilateral de pierna con apoyo y sin carga en las manos', R => uniApoyo(R).length > 0, R => uniApoyo(R).join(',')],
    ['Principales en máquina, polea, Smith o mancuernas (sin barra libre)', R => R.rows.filter(r => r.prio === 1).every(r => !['barra', 'barraz'].includes(r.L.mat))],
    ['2 series en todo el primer ciclo (C-08)', R => R.rows.every(r => r.series <= 2)],
    ['Esfuerzo «Fácil» y rampa al cerrar el primer ciclo (8-12 dejando unas 2; C-07)', R => R.m.effort.obj === 'facil' && R.m.rampa && R.m.rampa.reps === '8-12', R => JSON.stringify(R.m.rampa)],
    ['Con 2 días de pesas, equilibrio también en casa otro día (C-09)', R => T(R, /equilibrio en casa/)]],
    noDebe: [
    ['Hip thrust con barra, o subida, zancada o sentadilla dividida con mancuernas', R => hay(R, 'hip_thrust_bb', 'step_up_db', 'split_squat_db', 'reverse_lunge_db', 'lunge_db').length > 0, R => hay(R, 'hip_thrust_bb', 'step_up_db', 'split_squat_db', 'reverse_lunge_db', 'lunge_db').join(',')],
    ['Ejercicios en el suelo («sin suelo» marcado por defecto a partir de 65, I-11)', R => SUELO(R).length > 0, R => SUELO(R).join(',')],
    ['Flexión o giro de columna con carga', R => COLUMNA(R).length > 0, R => COLUMNA(R).join(',')]] },
  rosa: { debe: [
    ['Cuerpo completo A/B/C', R => R.m.split === 'cc3', R => R.m.split],
    ['Cabe en 30 min', R => enRango(R, 0, 1.05), mins],
    ['Básicos con mancuernas: sentadilla, press, remo y peso muerto rumano', R => tiene(R, 'goblet_squat', 'squat_db') && tiene(R, 'press_flat_db', 'press_incline_db') && tiene(R, 'row_db', 'row_incline_db', 'row_bent_db') && tiene(R, 'rdl_db'), R => [...R.ids].join(',')]],
    noDebe: [
    ['Remo bajo una mesa (tiene mancuernas y banco)', R => tiene(R, 'inverted_row_table')]] },
  david: { debe: [
    ['Los cuatro básicos en el gimnasio: sentadilla, banca, peso muerto y press militar', R => ['back_squat', 'bench_press', 'deadlift', 'ohp_bb'].every(x => tiene(R, x)), R => ['back_squat', 'bench_press', 'deadlift', 'ohp_bb'].filter(x => !tiene(R, x)).join(',')],
    ['El levantamiento objetivo va el primero de su día', R => R.det.every(d => { const lf = (R.m.lifts || {})[d.letra] || []; const s = d.rows.filter(r => r.kind === 'str'); return !lf.length || lf.includes(s[0].lib); })],
    ['Rango pesado (4-6) en sentadilla, banca y peso muerto (v8: si uno se repite en la semana, la repetición puede ser ligera)', R => ['lib_back_squat', 'lib_bench_press', 'lib_deadlift'].every(id => R.rows.some(r => r.lib === id && rrOf(r).hi <= 6)), R => R.rows.filter(r => ['lib_back_squat', 'lib_bench_press', 'lib_deadlift'].includes(r.lib)).map(r => r.lib + ' ' + r.reps).join(',')],
    ['El día de casa es de torso (la pierna, en el gimnasio)', R => R.det.filter(d => d.place === 'c').every(d => /^T/.test(d.role)), R => R.det.map(d => d.letra + ':' + d.role + '/' + d.place).join(',')],
    ['Cada levantamiento 1,5 veces por semana o más, en el gimnasio (C-06, J-10)', R => ['lib_back_squat', 'lib_bench_press', 'lib_deadlift', 'lib_ohp_bb'].every(id => R.det.filter(d => d.rows.some(r => r.lib === id)).reduce((a, d) => a + R.m.fd[d.letra], 0) >= 1.5 - 1e-9), R => ['lib_back_squat', 'lib_bench_press', 'lib_deadlift', 'lib_ohp_bb'].map(id => id + ' ' + R.det.filter(d => d.rows.some(r => r.lib === id)).reduce((a, d) => a + R.m.fd[d.letra], 0)).join(',')]],
    // (en 'dias' cada básico va en su día: la regla de 1,5 veces por semana es de 'recomendado', C-06)
    noDebe: [
    ['Rango pesado (≤ 6) con mancuernas ligeras en casa', R => R.rows.some(r => r.place === 'c' && r.L.mat === 'mancuernas' && rrOf(r) && rrOf(r).hi <= 6)],
    ['Unilateral como principal en el gimnasio', R => R.rows.some(r => r.prio === 1 && r.L.u && ['squat', 'lunge', 'hinge', 'hip_ext'].includes(r.L.pat) && r.place === 'g')]],
    debeAlt: [['Los cuatro básicos en el gimnasio: sentadilla, banca, peso muerto y press militar', R => ['back_squat', 'bench_press', 'deadlift', 'ohp_bb'].every(x => tiene(R, x)), R => ['back_squat', 'bench_press', 'deadlift', 'ohp_bb'].filter(x => !tiene(R, x)).join(',')],
    ['El levantamiento objetivo va el primero de su día', R => R.det.every(d => { const lf = (R.m.lifts || {})[d.letra] || []; const s = d.rows.filter(r => r.kind === 'str'); return !lf.length || lf.includes(s[0].lib); })],
    ['Rango pesado (4-6) en sentadilla, banca y peso muerto (v8: si uno se repite en la semana, la repetición puede ser ligera)', R => ['lib_back_squat', 'lib_bench_press', 'lib_deadlift'].every(id => R.rows.some(r => r.lib === id && rrOf(r).hi <= 6)), R => R.rows.filter(r => ['lib_back_squat', 'lib_bench_press', 'lib_deadlift'].includes(r.lib)).map(r => r.lib + ' ' + r.reps).join(',')],
    ['El día de casa es de torso (la pierna, en el gimnasio)', R => R.det.filter(d => d.place === 'c').every(d => /^T/.test(d.role)), R => R.det.map(d => d.letra + ':' + d.role + '/' + d.place).join(',')]] },
  sergio: { debe: [
    ['Empuje/tirón/pierna con 3 entrenos que se repiten (recomendado)', R => R.m.split === 'ppl3', R => R.m.split],
    // (con cada entreno 2 veces por semana, el freno de C-03 deja un principal en 2 series si su grupo ya está en lo alto del rango: paso 3)
    ['Cada principal suma 4 o más series por semana (series × veces por semana)', R => prin(R).every(r => r.series * R.m.f >= 4 - 1e-9), R => prin(R).map(r => r.lib.replace('lib_', '') + ' ' + r.series + '×' + R.m.f).join(',')]],
    noDebe: [['Rarezas en el gimnasio', R => rarezas(R).length > 0, R => rarezas(R).join(',')]],
    debeAlt: [
    ['«dias»: 6 entrenos distintos (K=6)', R => R.m.K === 6, R => R.m.split + ' K=' + R.m.K],
    ['«dias»: sin rarezas y principales con 3 o más series (cada entreno, una vez por semana)', R => rarezas(R).length === 0 && prin(R).every(r => r.series >= 3), R => rarezas(R).join(',') + ' ' + prin(R).filter(r => r.series < 3).map(r => r.lib).join(',')]] },
  nuria: { debe: [
    ['Casa con mancuernas y banco, 6 días: 3 entrenos que se repiten', R => R.m.K === 3, R => R.m.split + ' K=' + R.m.K]],
    noDebe: [['Remo bajo una mesa (tiene mancuernas)', R => tiene(R, 'inverted_row_table')]],
    debeAlt: [
    ['«dias»: con su material no salen 6 entrenos distintos buenos: K baja y se explica', R => R.m.K < 6 && T(R, /Con tu material no salen 6 entrenos distintos/), R => R.m.split + ' K=' + R.m.K]] },
  carmen: { debe: [
    ['Modo prudente e inicio, con esfuerzo «Fácil» y subidas lentas (C-01)', R => R.P.prud && R.P.inicio && R.m.effort.obj === 'facil' && R.m.effort.subidas === 'lenta', R => JSON.stringify(R.m.effort)],
    ['Con 20 min y rutina prudente: 5 min de calentamiento cada día (C-17)', R => R.m.corto && R.det.every(d => (d.rows.find(r => r.kind === 'warm') || {}).min === 5), R => R.det.map(d => (d.rows.find(r => r.kind === 'warm') || {}).min).join('/')],
    ['2 o 3 ejercicios de 2 series por día, dentro de los 20 min', R => R.det.every(d => { const s = d.rows.filter(r => r.kind === 'str'); return s.length >= 2 && s.length <= 3 && s.every(r => r.series === 2) && d.minExact <= 21; }), mins],
    ['Sin rango pesado: 10 repeticiones o más en lo que lleva peso', R => conPeso(R).every(r => rrOf(r).lo >= 10), R => conPeso(R).map(r => r.lib.replace('lib_', '') + ' ' + r.reps).join(',')],
    ['«Respira durante el esfuerzo» en los principales con peso', R => R.rows.filter(r => r.prio === 1 && r.L.c && r.L.lt === 'w').every(r => /Respira durante el esfuerzo/.test(r.nota))],
    ['Consulta antes de empezar (inactiva con enfermedad y medicación, C-10)', R => T(R, /comentarlo con tu médico antes de empezar/)],
    ['Avisos de tensión no controlada y de azúcar (C-10)', R => T(R, /160\/100/) && T(R, /lleva algo dulce/)]],
    noDebe: [
    ['Saltos, comba, carrera o intervalos (HIIT)', R => R.det.some(d => d.rows.some(r => r.lib && ((K.TAGS.lim[r.lib] || {}).impacto === 2 || r.lib === 'lib_cardio_hiit')))],
    ['Más de 2 series o dificultad mayor que 1', R => R.rows.some(r => r.series > 2 || r.L.dif > 1)]] },
  manuel: { debe: [
    ['Volumen y estructura de intermedio con experiencia (C-07): nivel I, 4 días de torso/pierna', R => R.m.lvS === 'I' && R.m.wd === 4 && R.m.split === (R.m.reparto === 'dias' ? 'tp4' : 'tp2'), R => R.m.lvS + ' ' + R.m.split + ' ' + R.m.wd],
    ['Calentamiento de 8 min y equilibrio de 8 min tras él (C-09, 60 min)', R => balance(R).every(x => x.w === 8 && x.b === 8 && x.orden), R => JSON.stringify(balance(R))],
    ['Unilateral de pierna con apoyo (peso corporal, máquina o Smith)', R => uniApoyo(R).length > 0, R => uniApoyo(R).join(',')],
    ['Principales en máquina, Smith o mancuernas, sin barra libre (C-07)', R => R.rows.filter(r => r.prio === 1).every(r => !['barra', 'barraz'].includes(r.L.mat)), R => R.rows.filter(r => r.prio === 1).map(r => r.lib).join(',')],
    ['Series: 3 como mucho en los principales y 2 en el resto; 10-12 repeticiones (primer ciclo)', R => R.rows.every(r => r.series <= (r.prio === 1 ? 3 : 2)) && conPeso(R).every(r => rrOf(r).lo >= 10)],
    ['Rampa del Coach al cerrar el primer ciclo: 8-12 dejando unas 2 (C-07)', R => R.m.rampa && R.m.rampa.reps === '8-12' && T(R, /8-12 repeticiones dejando unas 2/), R => JSON.stringify(R.m.rampa)],
    ['Sesiones de 60 min como mucho', R => enRango(R, 0, 1.05), mins]],
    noDebe: [
    ['Unilateral de pie con carga en las manos, hip thrust con barra o columna con carga', R => R.rows.some(r => r.L.u && ['squat', 'lunge', 'hinge'].includes(r.L.pat) && ['mancuernas', 'kettlebell', 'barra'].includes(r.L.mat)) || tiene(R, 'hip_thrust_bb') || COLUMNA(R).length > 0],
    ['Ejercicios en el suelo (I-11)', R => SUELO(R).length > 0, R => SUELO(R).join(',')],
    ['Dificultad 3, o dificultad 2 fuera de máquinas, Smith y mancuernas', R => R.rows.some(r => r.L.dif === 3 || (r.L.dif === 2 && !['maquina', 'smith', 'mancuernas'].includes(r.L.mat))), R => R.rows.filter(r => r.L.dif >= 2).map(r => r.lib + ' d' + r.L.dif).join(',')]] },
  pablo: { debe: [
    ['La lesión reciente se trata como «Me operaron»: nada que cargue la espalda baja (C-16)', R => R.rows.every(r => !((K.TAGS.lim[r.lib] || {}).lumbar >= 1)), R => R.rows.filter(r => (K.TAGS.lim[r.lib] || {}).lumbar >= 1).map(r => r.lib).join(',')],
    ['Aviso de consulta y línea de alarma (hormigueo, pérdida de fuerza, dolor que baja por la pierna)', R => T(R, /que la valore tu fisio o tu médico/) && T(R, /hormigueo/)],
    ['El resto del cuerpo se entrena: rodilla, empuje y tirón cada semana, y la rutina valida (la cadera queda exenta)', R => R.res.ok && ['squat', 'push_h', 'pull_v'].every(p => R.rows.some(r => r.L.pat === p || (p === 'pull_v' && r.L.pat === 'pull_h')))],
    ['No es modo prudente: series de intermedio (principales con 3)', R => !R.P.prud && prin(R).every(r => r.series >= 3), R => prin(R).map(r => r.lib.replace('lib_', '') + '×' + r.series).join(',')]],
    noDebe: [
    ['Peso muerto, rumano, sentadilla con barra, remo con barra, buenos días o hiperextensiones', R => hay(R, 'deadlift', 'rdl_bb', 'rdl_db', 'back_squat', 'bb_row', 'good_morning_bw', 'hyperextension', 'back_ext_machine').length > 0, R => hay(R, 'deadlift', 'rdl_bb', 'rdl_db', 'back_squat', 'bb_row', 'good_morning_bw', 'hyperextension', 'back_ext_machine').join(',')]] },
  // v9 (J-11, opción por defecto menor: 'tecnica'): 16-17 con experiencia, sin el modo clínico prudente
  lucas: { debe: [
    ['16-17 con experiencia (J-11): no es modo prudente; 3 días de pesas; «Justo» dejando 2 o más', R => !R.P.prud && R.P.menor && R.m.wd <= 3 && R.m.effort.obj === 'justo' && /2/.test(R.m.effort.rir), R => R.P.prud + ' ' + R.m.wd + ' ' + JSON.stringify(R.m.effort)],
    ['Nunca rango de 6 o menos', R => conPeso(R).every(r => r.slot === 'PW' || rrOf(r).hi > 6), R => conPeso(R).map(r => r.lib.replace('lib_', '') + ' ' + r.reps).join(',')],
    ['Básicos de gimnasio, no los de quien empieza de cero (ni sentadilla a la silla ni flexiones de rodillas)', R => !tiene(R, 'chair_squat', 'pushup_knee', 'pushup_incline') && tiene(R, 'back_squat', 'front_squat', 'goblet_squat', 'leg_press', 'squat_smith', 'hack_squat'), R => [...R.ids].join(',')],
    ['Explosivos de bajo volumen porque los pidió (2 series)', R => R.rows.some(r => r.slot === 'PW') && R.rows.filter(r => r.slot === 'PW').every(r => r.series <= 2)],
    ['Aviso de supervisión («entrena con alguien que te enseñe la técnica»)', R => T(R, /entrena con alguien que te enseñe/)]],
    noDebe: [
    ['«Mientras aprendes la técnica» (tiene experiencia)', R => T(R, /mientras aprendes la técnica/)],
    ['Descansos de 2:30 o más en series de 10 repeticiones o más (J-13)', R => R.rows.some(r => r.descanso_s >= 150 && rrOf(r) && rrOf(r).lo >= 10)]] },
  alex: { debe: [
    ['Prudente + filtros de 65+ sin su tope de nivel (C-14): nivel I, A/B/C con 3 días de pesas', R => R.P.prud && R.P.segM && R.m.lvS === 'I' && R.m.split === 'cc3' && R.m.wd === 3, R => R.m.lvS + ' ' + R.m.split + ' ' + R.m.wd],
    ['Equilibrio de 5 min tras el calentamiento', R => balance(R).every(x => x.b >= 5 && x.orden), R => JSON.stringify(balance(R))],
    ['Unilateral de pierna con apoyo', R => uniApoyo(R).length > 0, R => uniApoyo(R).join(',')],
    ['El tope de días se explica con su motivo (I-12) y no promete «Cambiar reparto» (P12)', R => T(R, /como no sé tu edad, mejor 3 de pesas/) && !T(R, /Cambiar reparto/)],
    ['Texto de C-14 («Si me dices tu edad, la ajusto»)', R => T(R, /Si me dices tu edad/)]],
    noDebe: [
    ['Flexión o giro de columna con carga, impacto o hip thrust con barra', R => COLUMNA(R).length > 0 || tiene(R, 'hip_thrust_bb') || R.rows.some(r => (K.TAGS.lim[r.lib] || {}).impacto === 2), R => COLUMNA(R).join(',')],
    ['Unilateral de pie con carga en las manos', R => R.rows.some(r => r.L.u && ['squat', 'lunge', 'hinge'].includes(r.L.pat) && ['mancuernas', 'kettlebell', 'barra'].includes(r.L.mat))]] },
  elena: { debe: [
    ['Nivel P con modo vuelta (antes más de 2 años, fuera más de 6 meses; §E.1)', R => R.m.level === 'P' && R.P.vuelta, R => R.m.level + ' ' + R.m.modes.join(',')],
    ['Para el Coach: sin peso propuesto de antes del parón (más de 6 meses, C-02)', R => R.m.vuelta && R.m.vuelta.pesos === 'recalibrar' && R.m.vuelta.subirNivel === true, R => JSON.stringify(R.m.vuelta)],
    ['El texto dice que la primera sesión es para encontrar su peso de ahora', R => T(R, /encontrar tu peso de ahora/)],
    ['Mantiene ejercicios de su historial (3 o más)', R => ['back_squat', 'bench_press', 'lat_pulldown', 'row_cable', 'leg_press', 'rdl_db', 'shoulder_press_db', 'curl_db'].filter(x => tiene(R, x)).length >= 3, R => ['back_squat', 'bench_press', 'lat_pulldown', 'row_cable', 'leg_press', 'rdl_db', 'shoulder_press_db', 'curl_db'].filter(x => tiene(R, x)).join(',')],
    ['Explica por qué no está el jalón tras nuca, que hacía (D-22)', R => T(R, /No incluyo el jalón tras nuca/)]],
    noDebe: [
    ['Jalón tras nuca', R => tiene(R, 'lat_pulldown_behind')],
    ['Promesas: «volverás rápido» o pesos de antes del parón', R => T(R, /volver[áa]s rápido|la última vez/i)],
    ['Más de 3 series (nivel P)', R => R.rows.some(r => r.series > 3)]] },
  irene: { debe: [
    ['«Aguantar más»: 12-15 y 17-20 repeticiones', R => conPeso(R).every(r => rrOf(r).lo >= 12), R => conPeso(R).map(r => r.reps).join(',')],
    ['Descansos cortos (90 s o menos)', R => R.rows.every(r => r.descanso_s <= 90), R => R.rows.map(r => r.descanso_s).join(',')],
    ['Recomendado: torso/pierna ×2 (K=4) con 5 días', R => R.m.split === 'tp4' && R.m.wd === 5, R => R.m.split],
    ['Corre: volumen de pierna × 0,8 (el objetivo de cuádriceps queda por debajo del de pecho)', R => R.m.vol.cuads.obj < R.m.vol.pecho.obj, R => R.m.vol.cuads.obj + ' / ' + R.m.vol.pecho.obj],
    ['Sesiones de 38-47 min (85-105 % de 45)', R => enRango(R, 0.85, 1.05) || R.det.every(d => d.minExact >= 0.85 * 45 || d.sobraMotivo === 'rango'), mins]],
    noDebe: [['Rango de fuerza (10 o menos)', R => conPeso(R).some(r => rrOf(r).hi <= 10), R => conPeso(R).filter(r => rrOf(r).hi <= 10).map(r => r.lib).join(',')]],
    debeAlt: [
    ['«dias»: 5 entrenos distintos (torso, pierna, empuje, tirón, pierna)', R => R.m.K === 5 && R.m.split === 'ulppl', R => R.m.split + ' K=' + R.m.K],
    ['«dias»: sin rarezas y dentro de 45 min', R => rarezas(R).length === 0 && enRango(R, 0, 1.05), R => rarezas(R).join(',') + ' · ' + mins(R)]] },
  pilar: { debe: [
    ['Sin flexión ni giro de columna (con o sin carga) ni impacto (C-13)', R => COLUMNA(R).length === 0 && R.det.every(d => d.rows.every(r => !r.lib || (K.TAGS.lim[r.lib] || {}).impacto !== 2)), R => COLUMNA(R).join(',')],
    ['Core de antiextensión o antirrotación (plancha, pallof, dead bug, paseo)', R => R.rows.filter(r => r.slot === 'CO').every(r => ['core_iso', 'carry'].includes(r.L.pat) || /pallof|plank/.test(r.lib)), R => R.rows.filter(r => r.slot === 'CO').map(r => r.lib).join(',')],
    ['Aviso de huesos frágiles con consulta', R => T(R, /huesos frágiles/) && T(R, /Consúltalo con tu médico/)],
    ['No es modo prudente ni de 65+ (solo los filtros de columna e impacto)', R => !R.P.prud && !R.P.segM]],
    noDebe: [['Inclinación lateral, giros rusos o crunch', R => hay(R, 'side_bend_db', 'russian_twist_db', 'russian_twist_bw', 'crunch', 'crunch_db').length > 0, R => hay(R, 'side_bend_db', 'russian_twist_db', 'russian_twist_bw', 'crunch', 'crunch_db').join(',')]] },
  sara: { debe: [
    ['«Otra zona» no es modo prudente (C-15): 5 días de pesas, nivel A y esfuerzo «Justo»', R => !R.P.prud && R.m.wd === 5 && R.m.level === 'A' && R.m.effort.obj === 'justo', R => R.P.prud + ' ' + R.m.wd + ' ' + R.m.level],
    ['Nota de la otra zona y regla de dolor con la línea de alarma', R => T(R, /molestia en otra zona/) && T(R, /3 de 10/) && T(R, /hormigueo/)],
    ['Series de avanzado sin precaución: principales con 3 o más y alguno con 4', R => prin(R).every(r => r.series >= 3) && prin(R).some(r => r.series >= 4), R => prin(R).map(r => r.lib.replace('lib_', '') + '×' + r.series).join(',')]],
    noDebe: [
    ['«Rutina suave» o el tope de 3 días de la rutina prudente', R => T(R, /Rutina suave|mejor 3 de pesas/)],
    ['Sin impacto forzado (lesión antigua: la preferencia sigue siendo suya)', R => R.P.noImpact]],
    debeAlt: [['«dias»: 5 entrenos distintos', R => R.m.K === 5, R => R.m.split + ' K=' + R.m.K]] },
  luis: { debe: [
    ['Más de 2 años sin entrenar = empezar de cero (I-4): P0 e inicio, sin modo vuelta', R => R.m.level === 'P0' && R.P.inicio && !R.P.vuelta && R.m.vuelta && R.m.vuelta.subirNivel === false, R => R.m.level + ' ' + R.m.modes.join(',')],
    ['Texto del parón largo', R => T(R, /más de 2 años sin entrenar/)],
    ['2 series y 4-5 ejercicios por día', R => R.rows.every(r => r.series <= 2) && R.det.every(d => { const n = d.rows.filter(r => r.kind === 'str').length; return n >= 4 && n <= 5; })]],
    noDebe: [['«Volverás rápido» o «¿Subimos a tu nivel?»', R => T(R, /volver[áa]s rápido|Subimos a tu nivel/i)]] },
  marina: { debe: [
    ['Posparto con alta (C-12): prudente, sin impacto y sin flexión de columna con carga', R => R.P.prud && R.P.posparto && R.P.noImpact && COLUMNA(R).filter(x => K.TAGS.spine.has(L_(x))).length === 0],
    ['Nota de suelo pélvico', R => T(R, /suelo pélvico/)],
    ['Cabe en 30 min', R => enRango(R, 0, 1.05), mins]],
    noDebe: [['Saltos, comba o carrera', R => R.det.some(d => d.rows.some(r => r.lib && (K.TAGS.lim[r.lib] || {}).impacto === 2))]] },
};
// v8 (paso 6): reglas de las personas de los graves
const LUMBAR1 = R => R.rows.filter(r => (K.TAGS.lim[r.lib] || {}).lumbar >= 1).map(r => r.lib.replace('lib_', ''));
const IMPACTO = R => R.det.flatMap(d => d.rows.filter(r => r.lib && ((K.TAGS.lim[r.lib] || {}).impacto === 2 || r.slot === 'PW')).map(r => r.lib.replace('lib_', '')));
Object.assign(REGLAS, {
  raul: { debe: [
    ['Sin explosivos ni impacto con la espalda recién lesionada (J-01), aunque los pidió', R => IMPACTO(R).length === 0 && !R.P.powerOk, R => IMPACTO(R).join(',')],
    ['Nada que cargue o comprima la espalda baja (lim ≥ 1: hack, Smith, péndulo, hip thrust con barra, press de pie…; J-04)', R => LUMBAR1(R).length === 0, R => LUMBAR1(R).join(',')],
    ['Aviso de consulta y línea de alarma', R => T(R, /que la valore tu fisio o tu médico/) && T(R, /hormigueo/)],
    ['La prensa, con su nota de rango (J-25)', R => R.rows.filter(r => r.lib === 'lib_leg_press').every(r => /pelvis no se despegue/.test(r.nota)) && tiene(R, 'leg_press')]],
    noDebe: [['Saltos, sentadilla hack o en Smith, peso muerto o hip thrust con barra', R => hay(R, 'skater_jump', 'box_jump', 'jump_squat', 'hack_squat', 'squat_smith', 'pendulum_squat', 'deadlift', 'rdl_bb', 'hip_thrust_bb').length > 0, R => hay(R, 'skater_jump', 'box_jump', 'jump_squat', 'hack_squat', 'squat_smith', 'pendulum_squat', 'deadlift', 'rdl_bb', 'hip_thrust_bb').join(',')]] },
  ines: { debe: [
    ['Con el hombro doliendo, nada por encima de la cabeza (salvo landmine), colgado, con barra en la espalda, fondos ni elevaciones (J-02)', R => R.rows.every(r => !K.TAGS.hombroAhoraFuera.has(r.lib)), R => R.rows.filter(r => K.TAGS.hombroAhoraFuera.has(r.lib)).map(r => r.lib).join(',')],
    ['Todos los empujes a 8 repeticiones o más (J-02)', R => R.rows.filter(r => ['push_h', 'push_v', 'fly'].includes(r.L.pat)).every(r => !rrOf(r) || rrOf(r).lo >= 8), R => R.rows.filter(r => ['push_h', 'push_v', 'fly'].includes(r.L.pat)).map(r => r.lib + ' ' + r.reps).join(',')],
    ['Hombro posterior o rotación externa cada semana', R => R.rows.some(r => r.L.pat === 'rear')],
    ['El texto dice lo que se hace con el hombro', R => T(R, /Mientras te duela la hombro|Mientras te duela el hombro|nada por encima de la cabeza/)],
    ['Tirón cada semana (remos; sin dominadas)', R => R.rows.some(r => ['pull_h', 'pull_v'].includes(r.L.pat))]],
    noDebe: [['Press militar, dominadas, sentadilla con barra o fondos', R => hay(R, 'ohp_bb', 'shoulder_press_db', 'pullup', 'chinup', 'pullup_negative', 'back_squat', 'front_squat', 'dip_bars').length > 0, R => hay(R, 'ohp_bb', 'shoulder_press_db', 'pullup', 'chinup', 'pullup_negative', 'back_squat', 'front_squat', 'dip_bars').join(',')]] },
  ramon: { debe: [
    ['Calentamiento y, tras él, equilibrio (65+, C-09)', R => balance(R).every(x => x.w >= 5 && x.b >= 5 && x.orden), R => JSON.stringify(balance(R))],
    ['Unilateral de pierna con apoyo y sin carga en las manos', R => uniApoyo(R).length > 0, R => uniApoyo(R).join(',')],
    ['Tirón cada semana sin colgarse (remo en barra baja)', R => R.rows.some(r => r.L.pat === 'pull_h')]],
    noDebe: [
    ['Dominadas, negativas, con banda o cualquier ejercicio colgado (J-03)', R => R.rows.some(r => K.TAGS.colgado.has(r.lib)), R => R.rows.filter(r => K.TAGS.colgado.has(r.lib)).map(r => r.lib).join(',')],
    ['Flexiones de rodillas en el suelo (hay inclinadas)', R => tiene(R, 'pushup_knee')],
    ['Suelo fuera del core y del hombro posterior, o sin su aviso (con «sin suelo» por defecto a los 75; en un parque no hay otra opción para esos dos)', R => R.rows.some(r => !['CO', 'RE'].includes(r.slot) && K.TAGS.suelo.has(r.lib)) || (SUELO(R).length > 0 && !T(R, /no había otra opción/)), R => SUELO(R).join(',')]] },
  jorge: { debe: [
    ['Nada que cargue la espalda baja operada (lim ≥ 1; J-04)', R => LUMBAR1(R).length === 0, R => LUMBAR1(R).join(',')],
    ['Prioridad de brazos: curl y tríceps directos cada semana (J-08)', R => R.rows.some(r => r.L.pat === 'curl') && R.rows.some(r => r.L.pat === 'tri'), R => R.rows.map(r => r.L.pat).join(',')],
    ['El press de hombros con peso libre, sentado con respaldo y a 8 o más', R => R.rows.filter(r => r.L.pat === 'push_v' && ['mancuernas', 'kettlebell', 'barra'].includes(r.L.mat)).every(r => /respaldo/.test(r.nota) && rrOf(r).lo >= 8)],
    ['Sentadillas y zancadas sin peso en las manos (prensa no hay): unilaterales sin carga', R => R.rows.filter(r => ['squat', 'lunge'].includes(r.L.pat)).every(r => !K.TAGS.axialManos.has(r.lib)), R => R.rows.filter(r => K.TAGS.axialManos.has(r.lib)).map(r => r.lib).join(',')]],
    noDebe: [['Peso muerto, sentadilla con barra, hack, Smith o press militar de pie', R => hay(R, 'deadlift', 'rdl_bb', 'back_squat', 'front_squat', 'hack_squat', 'squat_smith', 'ohp_bb').length > 0, R => hay(R, 'deadlift', 'rdl_bb', 'back_squat', 'front_squat', 'hack_squat', 'squat_smith', 'ohp_bb').join(',')]] },
  // ── v14 (P1): reparto elegido. debe = variante 'recomendado' (el plan no se aplica) · debeAlt = variante 'dias' (la de la app) ──
  dani: { debe: [SIN_PLAN],
    debeAlt: [
    ['Sale el reparto elegido: empuje, tirón, pierna y torso', R => R.m.split === 'pplt4' && roles(R) === 'E,Ti,PU,T2', R => R.m.split + ' ' + roles(R)],
    ['Un solo día de pierna: los ejercicios de pierna, todos en ese día', R => R.rows.filter(r => ['squat', 'lunge', 'hinge', 'hip_ext', 'knee_flex', 'knee_ext'].includes(r.L.pat)).every(r => r.dia === 'C'), R => R.rows.filter(r => ['squat', 'hinge'].includes(r.L.pat)).map(r => r.dia + ':' + r.lib).join(',')],
    ['El día de pierna lleva sentadilla y bisagra principales', R => R.rows.some(r => r.dia === 'C' && r.prio === 1 && r.L.pat === 'squat') && R.rows.some(r => r.dia === 'C' && r.prio === 1 && r.L.pat === 'hinge')],
    ['Pecho y espalda llegan a su objetivo (el torso trabaja 2 veces)', R => R.m.vol.pecho.v >= R.m.vol.pecho.obj && R.m.vol.espalda.v >= R.m.vol.espalda.obj, R => JSON.stringify([R.m.vol.pecho, R.m.vol.espalda])],
    ['El porqué dice que hay un solo día de pierna', R => T(R, /un solo día de pierna/)],
    ['Mover los días (P8): la misma rutina con las letras cambiadas, y un orden que no es de sus días se ignora', R => { const o = [2, 0, 1, 3], L = 'ABCD', r2 = G.genRoutine(R.inp, { orden: o }), fila = d => JSON.stringify(d.rows.map(x => [x.lib, x.series, x.reps]));
      return r2.ok && r2.det.map(d => d.letra).join('') === L && o.every((src, i) => fila(r2.det[i]) === fila(R.res.det[src]) && r2.meta.tpl[L[i]] === R.m.tpl[L[src]] && r2.days[L[i]].focus === R.res.days[L[src]].focus && r2.days[L[i]].label === 'Día ' + L[i])
        && Object.keys(SEG(r2, R.inp)).length === 0 && !G.genRoutine(R.inp, { orden: [1, 0, 2] }).meta.orden && !G.genRoutine(R.inp, { orden: [0, 0, 1, 2] }).meta.orden; }],
    ['El coste se dice: aviso de volumen con cuádriceps, isquios o glúteos', R => R.avisos.some(t => /cuádriceps|isquios|glúteos/.test(t) && /menos de lo ideal/.test(t)), R => R.avisos.join(' | ')],
    ['Sesiones de 51-63 min', R => enRango(R, 0.85, 1.05), mins]],
    noDebeAlt: [['«Con tu material no sale bien el reparto que elegiste»', R => T(R, /no sale bien el reparto que elegiste/)]] },
  nerea: { debe: [SIN_PLAN],
    debeAlt: [
    ['Sale «por músculos»: pecho y tríceps, espalda y bíceps, pierna, hombros y brazos', R => R.m.split === 'grp4' && roles(R) === 'PT,EB,PU,HB', R => R.m.split + ' ' + roles(R)],
    ['Pecho y espalda, en días distintos (lo que pidió el usuario)', R => R.rows.filter(r => r.L.pat === 'push_h').every(r => r.dia === 'A') && R.rows.filter(r => ['pull_h', 'pull_v'].includes(r.L.pat)).every(r => r.dia === 'B'), R => R.rows.filter(r => ['push_h', 'pull_h', 'pull_v'].includes(r.L.pat)).map(r => r.dia + ':' + r.L.pat).join(',')],
    ['El día de pecho lleva al menos tres ejercicios de pecho y un tríceps', R => R.rows.filter(r => r.dia === 'A' && ['push_h', 'fly'].includes(r.L.pat)).length >= 3 && R.rows.some(r => r.dia === 'A' && r.L.pat === 'tri')],
    ['Curl en el día de espalda y curl y tríceps en el de hombros', R => R.rows.some(r => r.dia === 'B' && r.L.pat === 'curl') && R.rows.some(r => r.dia === 'D' && r.L.pat === 'curl') && R.rows.some(r => r.dia === 'D' && r.L.pat === 'tri')],
    ['Tirón y empuje equilibrados (≥ 1)', R => R.m.ratio.tiron_empuje >= 1 - 1e-9, R => R.m.ratio.tiron_empuje],
    ['El porqué dice que cada músculo trabaja 1 vez por semana', R => T(R, /1 vez por semana/)]] },
  hugo: { debe: [SIN_PLAN],
    debeAlt: [
    ['Sale el reparto elegido (empuje, tirón, pierna y torso)', R => R.m.split === 'pplt4', R => R.m.split],
    ['Los cuatro levantamientos de fuerza siguen en la semana: sentadilla, peso muerto, banca y militar', R => hay(R, 'back_squat', 'deadlift', 'bench_press', 'ohp_bb').length === 4, R => hay(R, 'back_squat', 'deadlift', 'bench_press', 'ohp_bb').join(',')],
    ['Sentadilla y peso muerto, los dos en el día de pierna', R => R.rows.filter(r => ['lib_back_squat', 'lib_deadlift'].includes(r.lib)).every(r => r.dia === 'C')],
    ['A quien busca fuerza no se le ofrece «por músculos»', R => !G.planes(R.inp).otros.some(x => /^grp/.test(x)), R => G.planes(R.inp).otros.join(',')]] },
  paco: { debe: [SIN_PLAN, ['Torso y pierna (su reparto de 65 o más con experiencia)', R => ['tp2', 'tp4'].includes(R.m.split), R => R.m.split]],
    debeAlt: [SIN_PLAN, ['Torso y pierna en 4 entrenos (su reparto de 65 o más con experiencia)', R => R.m.split === 'tp4', R => R.m.split],
    ['No se le ofrece ningún otro reparto', R => G.planes(R.inp).otros.length === 0, R => G.planes(R.inp).otros.join(',')]] },
  iker: { debe: [SIN_PLAN],
    debeAlt: [
    ['Sale el reparto elegido o el texto dice que con su material no sale', R => R.m.split === 'pplet5' || T(R, /no sale bien el reparto que elegiste/), R => R.m.split],
    ['Si sale: un solo día de pierna y el coste dicho en un aviso', R => R.m.split !== 'pplet5' || (roles(R).split(',').filter(x => x === 'PU').length === 1 && R.avisos.some(t => /cuádriceps|isquios|glúteos/.test(t))), R => roles(R) + ' · ' + R.avisos.join(' | ')],
    ['Con mancuernas de 20 kg, nada a 8 repeticiones o menos en pierna', R => R.rows.filter(r => ['squat', 'lunge', 'hinge'].includes(r.L.pat) && rrOf(r)).every(r => rrOf(r).lo >= 8), R => R.rows.filter(r => ['squat', 'lunge', 'hinge'].includes(r.L.pat)).map(r => r.lib + ' ' + r.reps).join(',')]] },
  tomas: { debe: [SIN_PLAN],
    debeAlt: [
    ['«Más torso» con 5 días: empuje y tirón dos veces y un día de pierna', R => R.m.split === 'pplet5' && roles(R) === 'E1,Ti1,PU,E2,Ti2' && R.m.plan === 'pplet5', R => R.m.split + ' ' + roles(R)],
    ['El recomendado sigue siendo el equilibrado (torso, pierna, empuje, tirón y pierna)', R => R.m.rec === 'ulppl', R => R.m.rec],
    ['El porqué dice «la pierna, 1» y el coste va en un aviso', R => T(R, /la pierna, 1/) && R.avisos.some(t => /cuádriceps|isquios|glúteos/.test(t)), R => R.porque[0] + ' · ' + R.avisos.join(' | ')],
    ['Sin la frase de «no sale bien el reparto que elegiste»', R => !T(R, /no sale bien el reparto que elegiste/)]] },
  marcos: { debe: [['«Más glúteo y pierna» (no depende de ser mujer): el glúteo, prioritario', R => R.P.enfoque && R.P.prioG.has('gluteos')]],
    debeAlt: [
    ['Tres días de pierna y uno de torso', R => R.m.split === 'p3t1', R => R.m.split],
    ['Hip thrust o puente en la semana', R => R.rows.some(r => r.L.pat === 'hip_ext')],
    ['Con «más glúteo» no se ofrecen otros repartos', R => G.planes(R.inp).otros.length === 0, R => G.planes(R.inp).otros.join(',')]] },
  lola: { debe: [SIN_PLAN, ['Empieza de cero pero eligió su reparto: la forma de salida es un entreno distinto cada día (lo pedido manda, P9)', R => G.formaInicial(R.inp) === 'dias']],
    debeAlt: [
    ['Sale el reparto elegido (empuje, tirón, pierna y cuerpo completo)', R => R.m.split === 'pplc4', R => R.m.split],
    ['Sigue en modo inicio: 2 series en todo y esfuerzo «Fácil»', R => R.rows.every(r => r.series === 2) && R.m.effort.obj === 'facil', R => R.rows.map(r => r.series).join('')],
    ['A quien empieza no se le ofrece «por músculos»', R => !G.planes(R.inp).otros.some(x => /^grp/.test(x)), R => G.planes(R.inp).otros.join(',')]] },
});
function mkR(res, inp, Xx) {
  const P = G.effective(inp);
  const rows = res.det.flatMap(d => d.rows.filter(r => r.kind === 'str').map(r => Object.assign({ dia: d.letra, place: d.place, L: K.BY.get(r.lib) }, r)));
  const porque = Xx.porque(res, inp), avisos = Xx.avisos(res, inp);
  return { res, inp, P, m: res.meta, rows, ids: new Set(rows.map(r => r.lib)), porque, avisos, textos: porque.concat(avisos), txt: porque.concat(avisos).join('\n'), det: res.det };
}
function evalReglas(R, debe, noDebe) {
  const out = [];
  for (const [t, f, d] of (debe || [])) { let ok = false, det = null; try { ok = !!f(R); if (!ok && d) det = d(R); } catch (e) { det = 'error: ' + e.message; } out.push({ tipo: 'debe', t, ok, det }); }
  for (const [t, f, d] of (noDebe || [])) { let sale = true, det = null; try { sale = !!f(R); if (sale && d) det = d(R); } catch (e) { det = 'error: ' + e.message; } out.push({ tipo: 'no_debe', t, ok: !sale, det }); }
  // las comprobaciones de seguridad comunes (seguridad.js) valen para todas las personas
  const sg = SEG(R.res, R.inp, R.textos); for (const [k, v] of Object.entries(sg)) out.push({ tipo: 'seguridad', t: k, ok: false, det: String(v) });
  return out;
}

const SPLIT_TXT = { cc2: 'Cuerpo completo A/B', cc3: 'Cuerpo completo A/B/C', tp2: 'Torso/Pierna (2 entrenos)', tp4: 'Torso/Pierna ×2 (4 entrenos)', ppl3: 'Empuje/Tirón/Pierna ×2 (3 entrenos)', tp4cc: 'Torso/Pierna ×2 + cuerpo completo (5 entrenos)',
  ppl6: 'Empuje/Tirón/Pierna ×2 con gemelas distintas (6 entrenos)', tpc3: 'Torso/Pierna/Cuerpo completo (3 entrenos)', ulppl: 'Torso/Pierna/Empuje/Tirón/Pierna (5 entrenos)', tp6: 'Torso/Pierna ×3 (6 entrenos)', fz2: 'Fuerza en dos sitios: A/B de fuerza en el gimnasio y accesorios en casa',
  pgp3: 'Pierna/Torso/Pierna (más glúteo)', p3t1: 'Tres de pierna y uno de torso (más glúteo)', tp5g: 'Tres de pierna y dos de torso (más glúteo)', tp6g: 'Cuatro de pierna y dos de torso (más glúteo)',
  tpt3: 'Torso/Pierna/Torso (elegido)', pplt4: 'Empuje/Tirón/Pierna/Torso (elegido)', pplc4: 'Empuje/Tirón/Pierna/Cuerpo completo (elegido)', grp4: 'Por músculos, 4 días (elegido)',
  pplet5: 'Empuje/Tirón/Pierna/Empuje/Tirón (elegido)', grp5: 'Por músculos, 5 días (elegido)', tptpt5: 'Torso/Pierna/Torso/Pierna/Torso (elegido)', pplg6: 'Empuje/Tirón/Pierna/Empuje/Tirón/Hombros y brazos (elegido)' };
function repartoTxt(res, inp) {
  const m = res.meta, letras = Object.keys(res.days);
  let s = SPLIT_TXT[m.split] + ` (K=${m.K})`;
  if (m.split === 'cc2' && m.wd === 3) s += ' alternas: A·B·A, luego B·A·B';
  else if (m.split === 'fz2') s += ': gimnasio ' + (m.fz2.gym % 2 ? Array.from({ length: m.fz2.gym }, (_, i) => 'AB'[i % 2]).join('·') + ', luego ' + Array.from({ length: m.fz2.gym }, (_, i) => 'BA'[i % 2]).join('·') : Array.from({ length: m.fz2.gym }, (_, i) => 'AB'[i % 2]).join('·')) + ' · casa ' + Object.keys(m.tpl).slice(2).join('·');
  else s += ': ' + Array.from({ length: m.wd }, (_, i) => letras[i % letras.length]).join('·');
  s += ` · ${res.weeklyTarget} sesiones de pesas por semana`;
  if (inp.days > res.weeklyTarget) s += ` (de ${inp.days} días; el resto, caminar o equilibrio)`;
  const tipos = Object.entries(m.tpl).map(([k, v]) => `${k} ${v}${m.dayPlace[k] !== inp.places.main ? ' (casa)' : ''}`).join(' · ');
  return s + ' · ' + tipos;
}
const sid = id => id ? id.replace(/^lib_/, '') : id;
function comparar(p, res) {
  const e = p.esp, dif = [], ok = [];
  if (!e) return { ok, dif, porDia: {}, cuenta: null };
  const est = { split: res.meta.split, K: res.meta.K, wt: res.weeklyTarget, place: res.meta.dayPlace };
  (est.split === e.split ? ok : dif).push(`reparto ${est.split} (esperado ${e.split})`);
  (est.K === e.K ? ok : dif).push(`K=${est.K} (esperado ${e.K})`);
  (est.wt === e.wt ? ok : dif).push(`weeklyTarget ${est.wt} (esperado ${e.wt})`);
  (JSON.stringify(est.place) === JSON.stringify(e.place) ? ok : dif).push(`sitios ${JSON.stringify(est.place)} (esperado ${JSON.stringify(e.place)})`);
  const mine = {}; res.det.forEach(d => { mine[d.letra] = d; });
  const allMine = new Map(); res.det.forEach(d => d.rows.filter(r => r.kind === 'str').forEach(r => allMine.set(r.lib, { d: d.letra, r })));
  const allEsp = new Map(); Object.entries(e.plan).forEach(([dk, xs]) => xs.filter(x => !x.cardio).forEach(x => allEsp.set(x.id, { d: dk, x })));
  let same = 0, sameElsewhere = 0, samePat = 0, distinct = 0, totalEsp = allEsp.size;
  const porDia = {};
  for (const [dk, xs] of Object.entries(e.plan)) {
    const md = mine[dk]; const rowsM = md ? md.rows.filter(r => r.kind === 'str') : [];
    const lines = [];
    for (const x of xs.filter(x => !x.cardio)) {
      const L = K.BY.get(x.id); const m1 = rowsM.find(r => r.lib === x.id);
      if (m1) { same++; const rr = G.repRange(L, x.r); const espR = typeof x.r === 'string' ? parseInt(x.r) + ' s' : rr.lo + '-' + rr.hi;
        lines.push(`= ${sid(x.id)} ${m1.series}×${m1.reps} (esp. ${x.s}×${espR})${m1.series !== x.s || m1.reps !== espR ? ' ← series/reps distintas' : ''}`); continue; }
      const m2 = allMine.get(x.id); if (m2) { sameElsewhere++; lines.push(`↔ ${sid(x.id)} está en mi Día ${m2.d}`); continue; }
      const m3 = rowsM.find(r => r.pat === L.pat && !xs.some(y => y.id === r.lib)); if (m3) { samePat++; lines.push(`≈ ${sid(x.id)} → ${sid(m3.lib)} (mismo patrón ${L.pat})`); continue; }
      distinct++; lines.push(`✗ ${sid(x.id)} (${L.pat}) sin equivalente en el día`);
    }
    const extra = rowsM.filter(r => !xs.some(y => y.id === r.lib) && !lines.some(l => l.includes('→ ' + sid(r.lib))));
    extra.forEach(r => lines.push(`+ ${sid(r.lib)} (${r.pat}, hueco ${r.slot}) ${r.series}×${r.reps}`));
    const espW = (xs.find(x => x.cardio) || {}).id, myW = md && md.rows.find(r => r.kind === 'warm');
    lines.push(`calentamiento ${myW ? sid(myW.lib) + ' ' + myW.min + ' min' : '—'} (esp. ${sid(espW)} ${xs[0].min} min)`);
    const espC = xs.slice(1).find(x => x.cardio), myC = md && md.rows.find(r => r.kind === 'cardio');
    if (espC || myC) lines.push(`cardio final ${myC ? sid(myC.lib) + ' ' + myC.min + ' min' : '—'} (esp. ${espC ? sid(espC.id) + ' ' + espC.min + ' min' : '—'})`);
    lines.push(`minutos ${md ? md.minutos : '—'} (esp. ≈ ${e.min[dk]})`);
    porDia[dk] = lines;
  }
  return { ok, dif, porDia, cuenta: { esperados: totalEsp, mismoDia: same, otroDia: sameElsewhere, mismoPatron: samePat, distinto: distinct } };
}
// v7 (C-07): 65+ con experiencia, hasta 3 series en el principal
function chequeos(res, inp) {
  const P = G.effective(inp), out = [], m = res.meta, sem = {};
  K.PG.forEach(g => { sem[g] = 0; });
  res.det.forEach(d => { const ses = {};
    d.rows.filter(r => r.kind === 'str' && r.slot !== 'PW').forEach(r => { const o = K.volV(K.BY.get(r.lib)); for (const g in o) { ses[g] = (ses[g] || 0) + r.series * o[g]; sem[g] += r.series * o[g] * ((m.fd || {})[d.letra] || m.f); } });
    Object.entries(ses).forEach(([g, v]) => { if (v > 10 + 1e-9) out.push(`V9 ${d.letra}: ${g} ${v} > 10`); });
    if (d.minExact > inp.min * 1.05 + 1e-9) out.push(`minutos ${d.letra}: ${Math.round(d.minExact)} > ${inp.min} × 1,05`);
    const IA = ['I', 'A'].includes(P.level) && !P.cauto;
    if (IA && inp.min >= 45 && d.minExact < 0.85 * inp.min && d.sobraMotivo !== 'rango') out.push(`minutos ${d.letra}: ${Math.round(d.minExact)} < 85 % de ${inp.min} sin motivo`);
    if ((P.inicio || (P.mayor && !P.mayorExp)) && d.rows.some(r => r.kind === 'str' && r.series > 2)) out.push(`series ${d.letra}: más de 2 con inicio o 65+`);
    if (P.mayorExp && d.rows.some(r => r.kind === 'str' && r.series > (r.prio === 1 ? 3 : 2))) out.push(`series ${d.letra}: 65+ con experiencia por encima de 3 (principal) o 2 (resto)`); });
  K.PG.forEach(g => { const c = (m.vol[g] || {}).techo; if (c != null && sem[g] > c + 1e-9) out.push(`V8: ${g} ${Math.round(sem[g] * 10) / 10} > ${c}`); });
  return { ok: !out.length, fallos: out, minutos: res.det.map(d => d.letra + ' ' + Math.round(d.minExact) + '/' + inp.min) };
}
const diasJSON = res => res.det.map(d => ({ letra: d.letra, nombre: d.nombre, minutos: d.minutos, ejercicios: d.rows.map(r => ({ lib: r.lib, n: r.n, series: r.series, reps: r.reps, descanso_s: r.descanso_s, nota: r.nota || '' })) }));
const marca = c => (c.ok ? '✓ ' : '✗ ') + (c.tipo === 'no_debe' ? 'NO debe: ' : c.tipo === 'seguridad' ? 'seguridad: ' : 'debe: ') + c.t + (c.ok || !c.det ? '' : ' → ' + c.det);
function pinta(titulo, p, res, inp, chk, R, reglas, determinista) {
  if (QUIET) return;
  console.log(`\n════ ${titulo} · ${repartoTxt(res, inp)} · ok=${res.ok} · determinista=${determinista} · chequeos ${chk.ok ? 'OK' : JSON.stringify(chk.fallos)} · min ${chk.minutos.join(' ')}`);
  console.log('  descansos', JSON.stringify(res.meta.rest), '· esfuerzo', JSON.stringify(res.meta.effort), '· validación', JSON.stringify(res.meta.validate.hard), JSON.stringify(res.meta.validate.softAll), '· probados', JSON.stringify(res.meta.tried));
  for (const d of res.det) { console.log(`  ${d.nombre} · ${d.place}${d.preset ? '/' + d.preset : ''} · ≈ ${d.minutos} min`); d.rows.forEach(r => console.log(`     ${(r.lib || '—').padEnd(30)} ${String(r.series || '').padStart(2)} × ${String(r.reps).padEnd(7)} ${r.descanso_s != null ? r.descanso_s + ' s' : ''}  ${r.slot ? '[' + r.slot + r.prio + (r.pass === 'near' ? '~' : '') + ']' : ''} ${r.nota || ''}`)); }
  console.log('  volumen/semana (v · directas · objetivo · techo):', Object.entries(res.meta.vol).map(([g, v]) => `${g} ${v.v}·${v.dir}·${v.obj}·${v.techo}`).join(' | '));
  console.log('  ratios', JSON.stringify(res.meta.ratio), '· recortes', JSON.stringify(res.meta.cut), '· quitados', JSON.stringify(res.meta.removed));
  if (p.esp && titulo.indexOf('alternativa') < 0) { const c = comparar(p, res); console.log('  COMPARACIÓN con §N:', JSON.stringify(c.cuenta)); c.ok.forEach(s => console.log('   ✓ ' + s)); c.dif.forEach(s => console.log('   ✗ ' + s));
    Object.entries(c.porDia).forEach(([dk, ls]) => { console.log('   Día ' + dk); ls.forEach(l => console.log('      ' + l)); }); }
  console.log('  DEBE / NO DEBE:'); reglas.forEach(c => console.log('   ' + marca(c)));
  console.log('  POR QUÉ:'); R.porque.forEach(s => console.log('   • ' + s));
  console.log('  AVISOS:'); R.avisos.forEach(s => console.log('   ! ' + s));
}
const ejemplos = [], comp = [];
let fallos = 0;
for (const p of PERSONAS) {
  const inp = G.desdeRespuestas(p.a), ctx = p.ctx || {};
  const r1 = G.genRoutine(inp, ctx), r2 = G.genRoutine(G.desdeRespuestas(p.a), ctx);
  const determinista = JSON.stringify(r1.days) === JSON.stringify(r2.days);
  const c = comparar(p, r1);
  const chk = chequeos(r1, inp);
  const R = mkR(r1, inp, X), rg = REGLAS[p.key] || {};
  // (las reglas «debe» son de la variante 'recomendado' y «debeAlt» de 'dias': con --reparto=dias se cambian de sitio)
  const rMain = OPT.reparto === 'dias' && rg.debeAlt ? { debe: rg.debeAlt, noDebe: rg.noDebeAlt } : rg, rAlt = OPT.reparto === 'dias' ? { debe: rg.debe, noDebe: rg.noDebe } : { debe: rg.debeAlt, noDebe: rg.noDebeAlt };
  const reglas = evalReglas(R, rMain.debe, rMain.noDebe);
  const malas = reglas.filter(x => !x.ok).length + (chk.ok ? 0 : 1) + (r1.ok ? 0 : 1) + (determinista ? 0 : 1);
  fallos += malas;
  const ej = { nombre: p.nombre, edad: p.edad, grupo: p.grupo || 'propuesta §N', motivo: p.motivo || null, resumen_respuestas: p.resumen, reparto_opcion: OPT.reparto || 'recomendado', reparto: repartoTxt(r1, inp),
    dias: diasJSON(r1), porque: R.porque, avisos: R.avisos, comprobaciones: reglas.map(marca) };
  const cp = { key: p.key, ok: r1.ok, determinista, chequeos: chk, reglas, malas, effort: r1.meta.effort, rampa: r1.meta.rampa, vuelta: r1.meta.vuelta, seguridad: r1.meta.seguridad,
    hard: r1.meta.validate.hard, soft: r1.meta.validate.softAll, comparacion: c, vol: r1.meta.vol, ratio: r1.meta.ratio, rest: r1.meta.rest, tried: r1.meta.tried, cut: r1.meta.cut, removed: r1.meta.removed, log: r1.meta.log };
  pinta(`${p.nombre} (${p.edad == null ? 'edad: prefiere no decirlo' : p.edad})`, p, r1, inp, chk, R, reglas, determinista);
  // v7 (B-1): las de 5-6 días llevan la otra variante de reparto en «alternativa», con el mismo formato y sus propias reglas
  if (p.a.days >= 5) {
    const a1 = GA.genRoutine(inp, ctx), a2 = GA.genRoutine(G.desdeRespuestas(p.a), ctx);
    const detA = JSON.stringify(a1.days) === JSON.stringify(a2.days);
    const chkA = chequeos(a1, inp), RA = mkR(a1, inp, XA);
    const reglasA = evalReglas(RA, rAlt.debe, rAlt.noDebe);
    const malasA = reglasA.filter(x => !x.ok).length + (chkA.ok ? 0 : 1) + (a1.ok ? 0 : 1) + (detA ? 0 : 1);
    fallos += malasA;
    ej.alternativa = { reparto_opcion: ALT_REP, reparto: repartoTxt(a1, inp), dias: diasJSON(a1), porque: RA.porque, avisos: RA.avisos, comprobaciones: reglasA.map(marca) };
    cp.alternativa = { reparto: ALT_REP, ok: a1.ok, determinista: detA, chequeos: chkA, reglas: reglasA, malas: malasA, split: a1.meta.split, K: a1.meta.K, vol: a1.meta.vol };
    pinta(`${p.nombre} · alternativa reparto '${ALT_REP}'`, p, a1, inp, chkA, RA, reglasA, detA);
  }
  ejemplos.push(ej); comp.push(cp);
}
fs.writeFileSync(path.join(OUT, 'ejemplos' + SUF + '.json'), JSON.stringify(ejemplos, null, 1));
fs.writeFileSync(path.join(OUT, 'personas-comparacion' + SUF + '.json'), JSON.stringify(comp, null, 1));
const linea = c => `${c.key}: ok=${c.ok} det=${c.determinista} V8/V9/min ${c.chequeos.ok ? 'OK' : c.chequeos.fallos.join('; ')} · ${c.chequeos.minutos.join(' ')} · reglas ${c.reglas.filter(x => x.ok).length}/${c.reglas.length}` +
  (c.comparacion && c.comparacion.cuenta ? ' ' + JSON.stringify(c.comparacion.cuenta) : '') + (c.alternativa ? ` | alternativa ${c.alternativa.reparto} ${c.alternativa.split} K=${c.alternativa.K}: ok=${c.alternativa.ok} det=${c.alternativa.determinista} V8/V9/min ${c.alternativa.chequeos.ok ? 'OK' : c.alternativa.chequeos.fallos.join('; ')} · reglas ${c.alternativa.reglas.filter(x => x.ok).length}/${c.alternativa.reglas.length}` : '');
console.log('\nResumen (' + PERSONAS.length + ' personas, ' + comp.filter(c => c.alternativa).length + ' con alternativa):\n         ' + comp.map(linea).join('\n         '));
const malasL = comp.flatMap(c => c.reglas.filter(x => !x.ok).map(x => c.key + ': ' + marca(x)).concat(c.alternativa ? c.alternativa.reglas.filter(x => !x.ok).map(x => c.key + ' (alternativa): ' + marca(x)) : []));
console.log(fallos ? '\nFALLOS (' + fallos + '):\n  ' + malasL.join('\n  ') : '\nTodas las reglas «debe» y «no debe», la seguridad común, V8/V9/minutos y el determinismo: OK.');
if (fallos) process.exitCode = 1;
