const _textos = (function () {
// Textos de «por qué» y avisos (§E.15 de 20-propuesta.md) a partir de meta.why / meta.warn y la rutina.
// Uso: const X = require('./textos.js')(K, G); X.porque(res, inp) → [frases]; X.avisos(res, inp) → [frases]
return function (K, G) {
  const { BY, GLBL, BIG, PRESETS } = K;
  const LV_ = { P0: 0, P: 1, I: 2, A: 3 };
  let mnC = null; const MN_ = () => mnC || (mnC = _menus(K));
  const GOAL = { musculo: 'Ganar músculo', fuerza: 'Ganar fuerza', grasa: 'Perder grasa', salud: 'Salud y forma', aguante: 'Aguantar más' };
  const zl = z => ({ rodilla: 'rodilla', hombro: 'hombro', lumbar: 'espalda baja', muneca: 'muñeca o codo', cadera: 'cadera', otra: 'otra zona' })[z] || z;
  const fmtMin = s => s % 60 ? (s >= 60 ? Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') + ' min' : s + ' s') : (s / 60) + ' min';
  const joinY = a => a.length <= 1 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' y ' + a[a.length - 1];
  const num = x => String(Math.round(x * 10) / 10).replace('.', ',');   // v9 (J-19): coma decimal
  const moda = xs => { const c = {}; xs.forEach(x => { c[x] = (c[x] || 0) + 1; }); return +Object.keys(c).sort((a, b) => c[b] - c[a] || a - b)[0]; };
  const SLOT_N = { TV: 'jalones', TH: 'remos', CU: 'curl de bíceps', TR: 'tríceps de aislamiento', RA: 'elevaciones laterales', RE: 'hombro posterior', KF: 'curl femoral', KE: 'extensión de cuádriceps', CA: 'gemelos', FL: 'aperturas', PV: 'press de hombros', PI: 'press inclinado', CO: 'core', HE: 'puente o hip thrust', HI: 'peso muerto', SQ: 'sentadillas', LU: 'zancadas', PH: 'press', PW: 'explosivos' };
  // ¿qué compra desbloquea más ejercicios en este sitio? (para mat_gap)
  const COMPRAS = [['una banda elástica y un anclaje de puerta', { mats: ['banda'], acc: ['anclaje'] }], ['unas mancuernas', { mats: ['mancuernas'] }], ['una barra de dominadas', { mats: ['dominadas'] }],
    ['una kettlebell', { mats: ['kettlebell'] }], ['un TRX o anillas', { mats: ['trx'] }], ['un banco', { acc: ['banco', 'banco_inc'] }]];
  // ¿el patrón principal de un hueco tiene algún ejercicio posible en ese sitio? (material y seguridad; no la dificultad)
  const principal = (e, sid) => { const p = G.SLOT[sid].pats[0]; if (p === 'push_h:inc') return e.pat === 'push_h' && K.angle(e) === 'inc'; return e.pat === p; };
  const hay = (sid, Pl, kind, inp) => K.C.some(e => e.lt !== 'c' && principal(e, sid) && K.placeCan(e, Pl, kind));   // v10: solo el material (lo que quita la seguridad no es «con tu material»)
  function compra(Pl, kind, gaps, inp) {
    const base = K.C.filter(e => K.placeCan(e, Pl, kind)).length; let best = null;
    for (const [txt, add] of COMPRAS) {
      const P2 = Object.assign({}, Pl, { mats: [...new Set((Pl.mats || []).concat(add.mats || []))], acc: [...new Set((Pl.acc || []).concat(add.acc || []))] });
      if ((add.mats || []).every(m => (Pl.mats || []).includes(m)) && (add.acc || []).every(a => (Pl.acc || []).includes(a))) continue;
      const n = K.C.filter(e => K.placeCan(e, P2, kind)).length - base, cub = (gaps || []).filter(sid => hay(sid, P2, kind, inp)).length;
      if (!best || cub > best.cub || (cub === best.cub && n > best.n)) best = { txt, n, cub };
    }
    return best;
  }
  // v10 (J-17): los rangos que dice la frase existen en la rutina: los de los básicos (si hay varios, «entre X y Y»; con gemelas pesada y
  // ligera, los de cada una) y los del resto; antes salía la moda y se contradecía con la rutina (Javier en 'dias': «8-10 en los básicos»
  // con banca, sentadilla y rumano a 6-8) y con «Empiezo con fuerza general, a 10-12»
  function rangoDe(rows) {
    const rs = rows.map(r => G.repRange(BY.get(r.lib), r.r)).filter(Boolean); if (!rs.length) return null;
    const u = [...new Set(rs.map(x => x.lo + '-' + x.hi))];
    return u.length === 1 ? u[0] : 'entre ' + Math.min(...rs.map(x => x.lo)) + ' y ' + Math.max(...rs.map(x => x.hi));
  }
  // por papel (principal, secundario, el resto) y aparte lo de peso corporal: «6-8 en los principales, 8-10 en los secundarios y 12-15 en el
  // resto; con tu peso (dominadas), 8-12». Dos rangos en un papel: «X o Y»; tres o más: «entre X y Y». Con gemelas (`dias`), los principales de
  // los días ligeros son secundarios y su rango va con ellos
  function rangosTxt(rows) {
    const rs = rows.map(r => G.repRange(BY.get(r.lib), r.r)).filter(Boolean), u = [...new Set(rs.map(x => x.lo + '-' + x.hi))];
    if (!u.length) return null; if (u.length === 1) return u[0];
    return 'entre ' + Math.min(...rs.map(x => x.lo)) + ' y ' + Math.max(...rs.map(x => x.hi));
  }
  function repsTxt(res, inp) {
    const rows = res.det.flatMap(d => d.rows.filter(r => r.kind === 'str' && typeof r.r === 'number' && r.slot !== 'PW'));
    if (!rows.length) return null;
    const lifts = new Set(Object.values(res.meta.lifts || {}).flat());
    const conPeso = rows.filter(r => BY.get(r.lib).lt === 'w'), base = conPeso.length ? conPeso : rows;
    // (con «Ganar fuerza», el rango de los levantamientos es lo que importa: van aparte)
    const fz = inp.goal === 'fuerza' && base.some(r => lifts.has(r.lib));
    const pr = base.filter(r => fz ? lifts.has(r.lib) : r.role === 'principal');
    const se = base.filter(r => !pr.includes(r) && ['principal', 'secundario'].includes(r.role)), re = base.filter(r => !pr.includes(r) && !se.includes(r));
    const bw = conPeso.length ? rows.filter(r => BY.get(r.lib).lt !== 'w' && r.c) : [];
    const tP = rangosTxt(pr), tS = rangosTxt(se), tR = rangosTxt(re), tB = rangosTxt(bw);
    if (tP && [tS, tR, tB].every(x => !x || x === tP)) return `${GOAL[inp.goal]}: ${tP} repeticiones en casi todo.`;
    const partes = []; for (const [tx, q] of [[tP, fz ? 'los levantamientos' : 'los principales'], [tS, 'los secundarios'], [tR, 'el resto']]) { if (!tx) continue; const l = partes[partes.length - 1]; if (l && l.tx === tx) l.q.push(q); else partes.push({ tx, q: [q] }); }
    const txt = partes.map((p, k) => p.tx + (k === 0 ? ' repeticiones' : '') + ' en ' + joinY(p.q));
    return `${GOAL[inp.goal]}: ${joinY(txt)}${tB && tB !== tP ? `; con tu peso, ${tB}` : ''}.`;
  }
  // v14 (P1): la frase del reparto cuando es uno de los que elige la persona en «Cambiar reparto» (dice la verdad de cada uno: cuántos días
  // de pierna y cuántas veces por semana trabaja cada zona)
  const ELEGIDO = {
    tpt3: 'Torso, pierna y torso: el torso trabaja 2 veces por semana; la pierna, 1, con su día entero.',
    pplt4: 'Empuje, tirón, pierna y torso: un solo día de pierna, y cada músculo del torso trabaja 2 veces por semana.',
    pplc4: 'Empuje, tirón, pierna y un día de cuerpo completo: un día entero de pierna y un repaso el cuarto día; cada músculo trabaja 2 veces por semana.',
    grp4: 'Un día por grupo de músculos: pecho y tríceps, espalda y bíceps, pierna, y hombros y brazos. Cada músculo trabaja a fondo 1 vez por semana.',
    pplet5: 'Empuje y tirón dos veces y un día de pierna: el torso trabaja 2 veces por semana; la pierna, 1.',
    grp5: 'Un día por músculo: pecho, espalda, pierna, hombros y brazos. Cada uno trabaja a fondo 1 vez por semana.',
    tptpt5: 'Torso tres veces y pierna dos, alternando: el torso recibe más trabajo y la pierna sigue 2 veces por semana.',
    pplg6: 'Empuje y tirón dos veces, un día de pierna y uno de hombros y brazos: el torso trabaja 2 veces por semana o más; la pierna, 1.',
  };
  function porque(res, inp) {
    // v3: veces por semana que trabaja cada músculo con cada reparto (con K entrenos que rotan por turnos)
    const m = res.meta, out = [], P = G.effective(inp), d = inp.days, fr = x => Math.round(x * 10) / 10;
    const f = fr({ cc2: m.wd, cc3: m.wd, tp2: m.wd / 2, tp4: m.wd / 2, ppl3: m.wd / 3, tp4cc: 3 * m.wd / 5, ppl6: 2 * m.wd / 6, tpc3: 2 * m.wd / 3, ulppl: 2 * m.wd / 5, tp6: m.wd / 2, fz2: m.wd, pgp3: 2 * m.wd / 3, p3t1: 3 * m.wd / 4, tp5g: 3 * m.wd / 5, tp6g: 4 * m.wd / 6 }[m.split]);
    const NOMBRE = { tp4: 'torso y pierna en 4 entrenos', tp2: 'torso y pierna en 2 entrenos', cc3: 'cuerpo completo en 3 entrenos', cc2: 'cuerpo completo en 2 entrenos', ppl3: 'empuje, tirón y pierna en 3 entrenos', tpc3: 'torso, pierna y cuerpo completo', pgp3: 'pierna, torso y pierna', p3t1: 'tres días de pierna y uno de torso', tp5g: 'tres días de pierna y dos de torso', tp6g: 'cuatro días de pierna y dos de torso',
      // v14 (P1): los que faltaban y los repartos que elige la persona
      ulppl: 'torso, pierna, empuje, tirón y pierna', ppl6: 'empuje, tirón y pierna dos veces', tp6: 'torso y pierna tres veces', tp4cc: 'torso y pierna dos veces y un día de cuerpo completo',
      tpt3: 'torso, pierna y torso', pplt4: 'empuje, tirón, pierna y torso', pplc4: 'empuje, tirón, pierna y cuerpo completo', grp4: 'un día por grupo de músculos', pplet5: 'empuje y tirón dos veces y un día de pierna',
      grp5: 'un día por músculo', tptpt5: 'torso tres veces y pierna dos', pplg6: 'empuje y tirón dos veces, pierna, y hombros y brazos' };
    // reparto
    if (m.split !== m.table && m.split !== 'fz2' && !(m.table === 'cc2' && m.split === 'cc3' && inp.daysOther) && !(inp.daysOther && m.K === m.wd)) {
      // v14 (P1): la persona eligió un reparto en «Cambiar reparto» y con su material (o sus molestias) no sale
      if (m.plan && m.table === m.plan) out.push(`${P.zonaActiva ? 'Con tu material y tus molestias' : 'Con tu material'} no sale bien el reparto que elegiste (${NOMBRE[m.plan] || m.plan}): te propongo ${NOMBRE[m.split] || m.K + ' entrenos'}${m.K < m.wd ? ' que se repiten' : ''}.`);
      else if (m.reparto === 'dias' && m.K < m.wd) out.push(`Con tu material no salen ${m.wd} entrenos distintos sin repetir ejercicios ni usar variantes raras: te propongo ${NOMBRE[m.split] || m.K + ' entrenos'} que se repiten.`);   // k_material
      else { const conZ = P.zonaActiva ? 'Con tu material y tus molestias' : 'Con tu material';   // v10: con el hombro doliendo no hay dominadas: no es solo el material
        out.push(m.table === 'ppl3' ? `${conZ} no sale bien un día solo de tirón: te propongo torso y pierna.` : `${conZ} no salía bien el reparto habitual: te propongo ${NOMBRE[m.split] || m.split}.`); }
    }
    // v9 (J-10): «Ganar fuerza» con dos sitios
    if (m.split === 'fz2') out.push(`Para ganar fuerza, los básicos van en el gimnasio: dos entrenos que se alternan (A con sentadilla y press de banca, B con peso muerto y press militar), así cada levantamiento sale ${num(m.fz2.gym / 2)} veces por semana; ${m.fz2.casa === 1 ? 'el día de casa, accesorios de torso' : 'los días de casa, accesorios de torso y de pierna'} con tu material.`);
    else if (m.split === 'cc2' && m.wd === 3) out.push('Dos entrenos de cuerpo completo que se alternan (A, B, A…): cada músculo trabaja 3 veces por semana y repites cada ejercicio a menudo.');
    else if (m.split === 'cc2' || m.split === 'cc3') out.push(`Cuerpo completo en ${m.K} entrenos: con ${m.wd} días, cada músculo trabaja ${num(f)} veces por semana.`);
    else if (m.split === 'tp2') out.push(`Torso y pierna: con ${m.wd} días, cada músculo trabaja ${num(f)} veces por semana y las sesiones no se alargan.`);
    else if (m.split === 'tp4') out.push(P.level === 'I' || P.level === 'A' ? 'Torso y pierna en 4 entrenos: para cada zona, un día más pesado y otro más ligero.' : `Torso y pierna en 4 entrenos: con ${m.wd} días, cada músculo trabaja ${num(f)} veces por semana.`);
    else if (ELEGIDO[m.split]) { out.push(ELEGIDO[m.split]);
      // «por músculos»: por qué los días de un solo grupo salen más cortos (el tope de 10 series por músculo y sesión, V9)
      if (m.split.indexOf('grp') === 0 && res.det.some(dd => inp.min - dd.minutos >= 10)) out.push('Los días de un solo grupo salen más cortos: pasadas unas 10 series de un músculo en la misma sesión, las siguientes aportan poco.'); }
    else if (m.split === 'ppl3' && m.wd === 3) out.push('Empuje, tirón y pierna: cada zona tiene su día y trabaja 1 vez por semana, con la sesión entera para ella.');
    else if (m.split === 'ppl3') out.push(`Empuje, tirón y pierna: con ${m.wd} días, cada músculo ${num(f)} veces por semana sin repetir dos días seguidos.`);
    else if (m.split === 'ppl6') out.push('Empuje, tirón y pierna dos veces, con ejercicios distintos cada vez: 6 entrenos, uno por día; cada músculo trabaja 2 veces por semana.');
    else if (m.split === 'ulppl') out.push('Torso, pierna, empuje, tirón y pierna: 5 entrenos distintos, uno por día; cada músculo trabaja 2 veces por semana.');
    else if (m.split === 'tp6') out.push('Torso y pierna tres veces, con ejercicios distintos cada vez: 6 entrenos, uno por día; cada músculo trabaja 3 veces por semana.');
    else if (m.split === 'tpc3') out.push('Torso, pierna y cuerpo completo: 3 entrenos distintos, uno por día; cada músculo trabaja 2 veces por semana.');
    else if (m.split === 'tp4cc') out.push(`${m.K} entrenos distintos, uno por día: torso y pierna dos veces y uno de cuerpo completo.`);
    else if (m.split === 'pgp3') out.push('Más glúteo y pierna: dos días de pierna y glúteo y uno de torso (pierna, torso, pierna); el torso, lo justo para mantenerlo.');   // v13 (E16e)
    else if (m.split === 'p3t1') out.push('Más glúteo y pierna: tres días de pierna y glúteo y uno de torso; el torso, lo justo para mantenerlo.');
    else if (m.split === 'tp5g') out.push('Más glúteo y pierna: tres días de pierna y glúteo y dos de torso, alternando.');
    else if (m.split === 'tp6g') out.push('Más glúteo y pierna: cuatro días de pierna y glúteo y dos de torso.');
    else out.push(`${m.K} entrenos distintos, uno por día, para que los días de cada sitio salgan exactos.`);
    // v3 (D-22): «separo torso y pierna» solo si la rutina final tiene días de torso y de pierna
    if (m.why.some(w => w.c === 'consec') && Object.values(m.tpl).some(r => /^T\d/.test(r)) && Object.values(m.tpl).some(r => /^P\d/.test(r))) out.push('Como entrenas días seguidos, separo torso y pierna para que cada zona descanse.');
    // v4 (D-22): solo si el reparto final repite los básicos (con dos sitios puede acabar en 4 entrenos y cada básico sale 1 vez)
    // v5 (D-19): si un press dejó su sitio a un tirón para que tirón:empuje no baje de 1, se dice y no se promete ese levantamiento
    const tc = m.why.find(w => w.c === 'te_cambio');
    if (tc) { const esTiron = ['pull_h', 'pull_v', 'rear'].includes(BY.get(tc.p.a).pat), de = BY.get(tc.p.de).n.toLowerCase(), a = BY.get(tc.p.a).n.toLowerCase();
      out.push(esTiron ? `Con ${tc.p.min} minutos no caben dos presses y el tirón que equilibra el hombro: en lugar de ${de}, ${a}. Si un día tienes más tiempo, añádelo.`
        : `Con tu material no hay tirones suficientes para equilibrar otro ejercicio de empuje, que es lo que cuida el hombro: en lugar de ${de}, ${a}.`); }
    if (!tc && m.why.some(w => w.c === 'fuerza_k2') && (['tp2', 'ppl3'].includes(m.split) || (m.split === 'cc2' && m.wd === 3))) out.push(m.wd === 3 ? 'Para ganar fuerza, cada básico se repite a menudo: 2 entrenos que se alternan, y cada levantamiento sale 1,5 veces por semana.' : `Para ganar fuerza, cada básico se repite: con ${m.wd} días, cada levantamiento sale ${num(m.split === 'ppl3' ? 2 * m.wd / 6 : m.wd / 2)} veces por semana.`);   // C-06
    { const cm = m.why.find(w => w.c === 'capMenor'); if (cm) out.push(`Has dicho ${d} días: con 16-17 años, 3 días de pesas bastan para progresar y recuperar${inp.sport !== 'no' ? ' con tu deporte' : ''}; los otros, ${inp.sport !== 'no' ? 'tu deporte o descanso' : 'camina o descansa'}.`); }   // v9 (J-11) · v14 (P12): sin «cámbialo en Cambiar reparto» (la hoja no ofrece quitar este tope)
    if (m.why.some(w => w.c === 'cap_principiante')) out.push(`Has dicho ${d} días: 4 son de pesas y el resto, camina o haz cardio suave. Para empezar, 3 o 4 días de pesas rinden casi igual y recuperas mejor. Si quieres pesas todos los días, cámbialo en «Cambiar reparto».`);   // C-21
    // v7 (C-23): «Es lo recomendado a partir de los 65» decía más que las guías (dan 2-3 días, no un tope)
    { const c65 = m.why.find(w => w.c === 'cap65'); if (c65) out.push(`Has dicho ${d} días: ${c65.p.pesas} son de pesas y el resto, camina 30 minutos o haz equilibrio. Para empezar, ${c65.p.pesas} días de pesas bastan.`); }   // (65+ con experiencia: 4, C-07)
    // v7 (I-12): el tope de la rutina prudente, con su motivo. v14 (P12): ya no dice «cámbialo en Cambiar reparto»: la hoja solo ofrece
    // quitar el tope a quien empieza (D5) y el usuario decidió quitar la promesa, no el tope
    { const cp = m.why.find(w => w.c === 'capPrudent'); if (cp) out.push(`Has dicho ${d} días: ${({ salud: 'por lo que marcaste en tu seguridad', menor: 'mientras aprendes la técnica', nd: 'como no sé tu edad', posparto: 'en tu vuelta tras el parto' })[cp.p.motivo] || 'con una rutina prudente'}, mejor 3 de pesas; los otros, camina o haz algo suave.`); }
    // v7 (C-22): en 'dias', K baja a 2 por los días seguidos
    if (m.kMotivo === 'consec_cauto' && m.reparto === 'dias') out.push('Aunque prefieres un entreno distinto por día, con días seguidos es mejor que torso y pierna se turnen: así cada zona descansa 48 horas.');
    const other = Object.entries(m.dayPlace).filter(([, p]) => p !== inp.places.main).map(([k]) => k);
    if (other.length) out.push(`${other.length === 1 ? 'El Día ' + other[0] + ' es' : 'Los días ' + joinY(other) + ' son'} ${inp.places.main === 'g' ? 'en casa, con tu material de casa; el resto, en el gimnasio' : 'en el gimnasio; el resto, en casa'}.`);
    // volumen (v5: grupos de planificación con el deltoides por cabezas y la cuenta fraccional de 05 §1.1; «buen punto de partida» solo si
    // ningún grupo grande pasa de objetivo × 1,5; si alguno pasa por los básicos, se dice, C-03)
    const PB = K.PBIG || BIG, VL = g => (K.PLBL || GLBL)[g] || GLBL[g];
    const big = PB.filter(g => m.vol[g]).map(g => m.vol[g].v); const med = big.slice().sort((a, b) => a - b)[Math.floor(big.length / 2)];
    const altos = PB.filter(g => m.vol[g] && m.vol[g].obj && m.vol[g].v > m.vol[g].obj * 1.5 + 1e-9);
    // v7 (D-22, C-03): «buen punto de partida» solo si ningún grupo grande se queda por debajo (los avisos dicen cuáles y por qué)
    const bajos = PB.filter(g => m.vol[g] && m.vol[g].obj && m.vol[g].v < m.vol[g].obj - 0.75 - 1e-9 && m.warn.some(w => w.c === 'vol_corto' && w.p.g === g));
    out.push(altos.length ? `Unas ${Math.round(med)} series por semana para cada músculo grande; ${joinY(altos.map(g => VL(g).toLowerCase()))} ${altos.length === 1 ? 'recibe' : 'reciben'} algo más porque ${altos.length === 1 ? 'trabaja' : 'trabajan'} en los ejercicios básicos. El Coach lo ajustará con tus sesiones.`
      : bajos.length ? `Unas ${Math.round(med)} series por semana para cada músculo grande; ${bajos.length === 1 ? 'uno se queda' : 'algunos se quedan'} por debajo de lo ideal (te digo cuál${bajos.length === 1 ? '' : 'es'} y por qué en los avisos).`
      : `Unas ${Math.round(med)} series por semana para cada músculo grande: buen punto de partida para tu nivel; el Coach te propondrá subir si progresas.`);
    // v9 (J-08, D-22): la frase de la prioridad dice lo que hay de verdad: trabajo directo (o por qué no lo hay), más series solo si las tiene
    // y «antes» solo si su ejercicio va antes en cada día (después, como mucho, del levantamiento de fuerza)
    // v12 (D10): con «más glúteo», su frase propia (el glúteo no repite la de la prioridad, que diría «un 25 %»)
    if (P.enfoque) out.push('Has pedido más glúteo: más series de glúteo y menos de torso, que se queda en lo justo para mantenerlo.');
    { const pr = [...P.prioG].filter(g => !(P.enfoque && g === 'gluteos')); if (pr.length) {
      const strR = res.det.flatMap(dd => dd.rows.filter(r => r.kind === 'str' && r.slot !== 'PW'));
      const directo = g => strR.some(r => G.mainGroup(BY.get(r.lib)) === g || (g === 'biceps' && r.slot === 'CU') || (g === 'triceps' && r.slot === 'TR'));
      const pgOf = g => g === 'hombros' ? 'hombro_lat' : g;
      const mas = g => m.vol[pgOf(g)] && m.vol[pgOf(g)].obj && m.vol[pgOf(g)].v >= m.vol[pgOf(g)].obj - 0.75;
      const antes = g => res.det.every(dd => { const s = dd.rows.filter(r => r.kind === 'str' && r.slot !== 'PW'); const i = s.findIndex(r => G.mainGroup(BY.get(r.lib)) === g); if (i < 0) return true;
        const lf = (m.lifts || {})[dd.letra] || []; return s.slice(0, i).every(r => lf.includes(r.lib) || P.prioG.has(G.mainGroup(BY.get(r.lib))) || (BY.get(r.lib).c && !BY.get(s[i].lib).c)); });
      const conLift = g => res.det.some(dd => { const s = dd.rows.filter(r => r.kind === 'str' && r.slot !== 'PW'); const i = s.findIndex(r => G.mainGroup(BY.get(r.lib)) === g); const lf = (m.lifts || {})[dd.letra] || []; return i > 0 && lf.includes(s[0].lib) && !lf.includes(s[i].lib); });
      const con = pr.filter(directo), sin = pr.filter(g => !directo(g));
      const peq = con.filter(g => ['biceps', 'triceps'].includes(g)), gran = con.filter(g => !['biceps', 'triceps'].includes(g));
      const lista = gs => { const t = joinY(gs.map(g => GLBL[g].toLowerCase())); return t.charAt(0).toUpperCase() + t.slice(1); };
      if (peq.length) out.push(`${lista(peq)}, como pediste: trabajo directo cada semana${peq.every(mas) ? ' y un 25 % más de series que sin prioridad' : ''}; ${peq.every(antes) ? 'cada día, antes que los demás ejercicios pequeños' : `los básicos ya ${peq.length > 1 ? 'los' : 'lo'} trabajan`}.`);   // v12: antes salía «${peq.length…}» tal cual (lo cazó genPure2)
      const van = gran.length === 1 && !['gluteos', 'isquios', 'cuads', 'hombros', 'piernas'].includes(gran[0]) ? 'va' : 'van';
      if (gran.length) out.push(`${lista(gran)}, como pediste: ${gran.every(mas) ? 'un 25 % más de series que sin prioridad' : 'algo más de series'}${gran.every(antes) ? (gran.some(conLift) ? ` y ${van} antes en el día, después del levantamiento de fuerza` : ` y ${van} antes en el día`) : ''}.`);
      if (sin.length) { const cls = G.clsOf(P, inp), MNx = MN_(), ids = sl => { const mm = MNx.MENUS[sl] || { sec: [] }; const o = MNx.tiers(sl, cls).flat(); (mm.sec || []).forEach(s => o.push(...(s.tiers ? s.tiers.flat() : MNx.tiers(s.slot, cls).flat()))); return o; };
        const slotG = { biceps: 'CU', triceps: 'TR', pecho: 'PH', espalda: 'TH', hombros: 'RA', gluteos: 'HE', cuads: 'SQ', isquios: 'KF' };
        const mat = g => ids(slotG[g] || 'PH').some(id => { const L = BY.get(id); return L && L.lt !== 'c' && Object.values(m.dayPlace).some(pk => K.placeCan(L, inp.places[pk], pk)) && G.safeL(L, inp); });
        out.push(`${lista(sin)}: ${sin.every(g => !mat(g)) ? 'con tu material no hay ejercicios directos' : 'en tus sesiones no caben ejercicios directos'}; los básicos ya ${sin.length > 1 ? 'los' : 'lo'} trabajan.`); }
    } }
    const rt = repsTxt(res, inp); if (rt) out.push(rt);
    // v9 (J-13): el descanso de cada ejercicio sale de su carga: la frase dice el de los básicos pesados (hasta 6 repeticiones) y el del resto
    { const comp = res.det.flatMap(dd => dd.rows.filter(r => r.kind === 'str' && r.c && typeof r.r === 'number' && r.slot !== 'PW'));
      const pes = comp.filter(r => { const rr = G.repRange(BY.get(r.lib), r.r); return rr && rr.hi <= 6; }), bas = comp.filter(r => !pes.includes(r) && r.prio === 1);
      const iso = res.det.flatMap(dd => dd.rows.filter(r => r.kind === 'str' && !r.c && r.descanso_s));
      if (pes.length) out.push(`Descansos de ${fmtMin(moda(pes.map(r => r.descanso_s)))} en los básicos pesados: con menos rendirías menos en la siguiente serie${bas.length || iso.length ? `; en el resto, ${fmtMin(moda(bas.concat(iso).map(r => r.descanso_s)))}` : ''}.`);
      else if (bas.length) out.push(`Descansos de ${fmtMin(moda(bas.map(r => r.descanso_s)))} en los básicos${iso.length ? ` y de ${fmtMin(moda(iso.map(r => r.descanso_s)))} en los ejercicios pequeños` : ''}.`); }
    // v9 (J-09): mancuernas ligeras: más repeticiones, con su motivo
    if (m.cargaLigera) out.push(inp.goal === 'fuerza' ? `Con mancuernas de hasta ${m.cargaLigera} kg, la fuerza máxima se entrena poco: subo las repeticiones para que cada serie cueste. Con más peso o con una barra, el Coach bajará el rango.`
      : `Con mancuernas de hasta ${m.cargaLigera} kg, más repeticiones en sentadillas, pesos muertos, remos y presses, para que cada serie cueste de verdad.`);
    // v10 (J-16): solo si en el gimnasio salen de verdad máquinas o mancuernas
    { const gym = res.det.filter(dd => dd.place === 'g').flatMap(dd => dd.rows.filter(r => r.kind === 'str' && BY.get(r.lib).lt === 'w')).map(r => BY.get(r.lib).mat), mq = gym.some(x => ['maquina', 'polea', 'smith'].includes(x)), mc = gym.includes('mancuernas');
      if (P.cauto && (mq || mc)) out.push(`${mq && mc ? 'Máquinas y mancuernas' : mq ? 'Máquinas' : 'Mancuernas'} para empezar: son más fáciles de aprender y de ajustar.`); }
    const step = res.det.flatMap(dd => dd.rows).find(r => r.kind === 'str' && /Coach te sube/.test(r.nota || ''));
    if (step) out.push(`Empiezo por ${step.n.toLowerCase()}: cuando te salga fácil, el Coach te sube a la variante siguiente.`);
    // material que falta
    const gapSlots = [];
    res.det.forEach(dd => { const Pl = inp.places[dd.place]; (G.TPL[dd.role] || []).forEach(([sid]) => { if (['TV', 'CU', 'TR', 'RA', 'TH', 'KF', 'PV', 'FL', 'RE'].includes(sid) && !gapSlots.includes(sid) && !hay(sid, Pl, dd.place, inp)) gapSlots.push(sid); }); });
    const nearRows = res.det.flatMap(dd => dd.rows.filter(r => r.kind === 'str' && (r.pass === 'near' || r.oi > 0)));
    if (gapSlots.length) {
      const pk = inp.places.main, Pl = inp.places[pk]; const cp = compra(Pl, pk, gapSlots, inp);
      const cover = nearRows.filter(r => gapSlots.includes(r.slot)).map(r => r.n.toLowerCase());
      out.push(`No hay ${joinY(gapSlots.map(s => SLOT_N[s]))} con tu material${cover.length ? ': lo cubro con ' + joinY(cover.slice(0, 2)) : ''}.${cp && cp.n > 0 ? ` Con ${cp.txt} tendrías ${cp.n} ejercicios más.` : ''}`);
    }
    // molestias (v7: «ahora» y «antigua» adaptan; «Me operaron» y la lesión reciente (C-16) sacan la zona)
    // v8 (J-05, D-22): cada frase dice lo que la rutina hace de verdad con esa zona (antes, «sin zancadas largas» con búlgaras en la rutina)
    const zAh = Object.keys(inp.zones || {}).filter(z => z !== 'otra' && inp.zones[z] === 'ahora'), zAn = Object.keys(inp.zones || {}).filter(z => z !== 'otra' && inp.zones[z] === 'antigua');
    const AHORA = { rodilla: 'sin sentadilla con barra, búlgaras ni zancadas largas; prensa, sentadilla a un cajón y subidas bajas, en el rango sin dolor',
      hombro: 'nada por encima de la cabeza ni colgado de una barra; press inclinado o landmine, jalón al pecho, remos y rotación externa, a 8-12 repeticiones',
      lumbar: 'sin peso muerto, sentadilla con barra ni remo con barra; lo demás, en rango cómodo',
      muneca: 'sin apoyar la palma con la muñeca doblada: si hay flexiones, sobre los puños o con agarres',
      cadera: 'sin zancadas laterales, sentadillas profundas a una pierna ni saltos; lo demás, en rango cómodo' };
    const ANTIGUA = { rodilla: 'sin saltos ni zancadas caminando', hombro: 'sin jalón tras nuca, remo al mentón ni fondos', lumbar: 'sin peso muerto, sentadilla con barra ni remo con barra',
      muneca: 'sin flexiones con la palma en el suelo ni fondos', cadera: 'sin zancadas laterales ni sentadillas a una pierna' };
    zAh.forEach(z => out.push(`Mientras te duela ${({ lumbar: 'la espalda baja', muneca: 'la muñeca o el codo', hombro: 'el hombro', rodilla: 'la rodilla', cadera: 'la cadera' })[z]}: ${AHORA[z]}.`));
    if (P.noImpact && Object.values(inp.zones || {}).some(v => ['ahora', 'op', 'reciente'].includes(v)) && !inp.zones.otra) out.push('Mientras dure la molestia, sin saltos ni impacto.');
    if (zAn.length) out.push(`Por tu lesión antigua de ${joinY(zAn.map(zl))}: ${zAn.map(z => ANTIGUA[z]).join('; ')}, y rango cómodo en lo demás.`);
    if (zAh.length || zAn.length) out.push('Si algo duele más de 3 sobre 10 o empeora al día siguiente, cámbialo con ⇄ y consúltalo.');
    const zop = Object.keys(inp.zones || {}).filter(z => z !== 'otra' && inp.zones[z] === 'op'), zrec = Object.keys(inp.zones || {}).filter(z => z !== 'otra' && inp.zones[z] === 'reciente');
    if (zop.length) out.push(`No cargo tu ${joinY(zop.map(zl))} hasta que te lo diga quien te operó o tu fisio.`);
    if (zrec.length) out.push(`Por tu lesión reciente de ${joinY(zrec.map(zl))}, no cargo esa zona hasta que la valore tu fisio o tu médico; el resto del cuerpo sí se entrena.`);
    // v7 (C-15): «Otra zona» ya no es modo prudente: no se dice «elijo ejercicios estables» (dejaría de ser verdad)
    if (inp.zones && inp.zones.otra) out.push(`Por tu molestia en otra zona: si algún ejercicio la nota, para y cámbialo con ⇄.${['ahora', 'op', 'reciente'].includes(inp.zones.otra) && P.noImpact ? ' Sin saltos ni impacto mientras dure.' : ''}`);
    // riesgo (v7, D-22: solo si la persona hacía ese ejercicio —historial o favorito—; si no, el texto era ruido en casi todas las rutinas)
    { const rk = m.why.find(w => w.c === 'risk'); if (rk) out.push(`No incluyo el ${BY.get(rk.p.id).n.toLowerCase()}: ${/pulldown_behind|upright/.test(rk.p.id) ? 'carga el hombro en una posición de riesgo' : 'carga mucho la espalda baja'} y hay alternativas igual de buenas.`); }
    // tiempo
    const est = Object.values(m.est); const mx = Math.max(...est);
    const cutC = m.why.find(w => w.c === 'time_cut' && w.p.que === 'cardio'), cutD = m.why.find(w => w.c === 'time_cut' && w.p.que === 'descansos'), cutA = m.why.find(w => w.c === 'time_cut' && w.p.que === 'accesorios');
    // v7 (D-22): si el cardio final solo sale de algunos días, se dice de cuáles (antes, «he quitado el cardio final» y, dos líneas más abajo, «10 min de bici al final»)
    const cardioDias = (m.cut || []).filter(c => c.startsWith('cardio_fuera')).map(c => 'ABCDEF'[+c.split(':')[1]]).filter((x, i, a) => a.indexOf(x) === i);
    const quedaCardio = res.det.some(dd => dd.rows.some(r => r.kind === 'cardio'));
    if (cutC || cutD || cutA) out.push(`Para que quepa en ${inp.min} min he ${joinY([cutD ? `dejado los descansos en ${fmtMin(m.rest.comp)}` : null, cutA ? `quitado ${cutA.p.n === 1 ? 'un accesorio' : cutA.p.n + ' accesorios'}` : null, cutC ? (quedaCardio && cardioDias.length ? `quitado el cardio final ${cardioDias.length === 1 ? 'del día ' + cardioDias[0] : 'de los días ' + joinY(cardioDias)}` : 'quitado el cardio final') : null].filter(Boolean))}.`);
    else if (mx <= inp.min * 1.05) { const mn = Math.min(...est); out.push(mx - mn >= 5 ? `Los días duran entre ${Math.round(mn)} y ${Math.round(mx)} min (tú dijiste ${inp.min}).` : `Cabe en unos ${Math.round(mx)} min (tú dijiste ${inp.min}).`); }   // v10 (J-19)
    const sp = m.why.find(w => w.c === 'time_spare');
    if (sp && sp.p.m >= 10) {
      // v5 (D-15, D-22): el texto dice el motivo real que da el generador (time_spare.p.motivo); «no hace falta más» solo con el rango lleno
      const mot = sp.p.motivo || (P.cauto || P.level === 'P0' || P.level === 'P' ? 'novato' : 'tope');
      const cu = (sp.p.mx && sp.p.mx - sp.p.m >= 10 ? `entre ${sp.p.m} y ${sp.p.mx} minutos según el día` : `unos ${sp.p.m} minutos`) + (sp.p.dias && sp.p.dias.length < res.det.length ? ` (${sp.p.dias.length === 1 ? 'el día ' + sp.p.dias[0] : 'los días ' + joinY(sp.p.dias)})` : '');   // v10 (J-19): qué días
      // v9 (J-19): «añade cardio» solo si cabe (como mucho los minutos que sobran) y no si el cardio ya llena el día (J-14)
      const anade = m.cardioRelleno ? '' : sp.p.conCardio ? ' Si quieres, alarga unos minutos el cardio del final.' : ` Si quieres, añade ${sp.p.m >= 15 ? '10-15' : '10'} minutos de cardio suave al final.`;
      // v9 (J-15): con 5-6 días, si aún sobran 20 minutos o más algún día, la salida de «Cambiar reparto»
      const pocos = m.wd >= 5 && sp.p.mx >= 20 ? ' Con tantos días el volumen se reparte y algún día queda corto: si prefieres menos días y más largos, cámbialo en «Cambiar reparto».' : '';
      out.push(mot === 'rango' ? `Te sobran ${cu}: con este volumen no hace falta más.${anade}${pocos}`
        : mot === 'inicio' ? `Te sobran ${cu}: en las primeras semanas, 2 series y pocos ejercicios bastan; el Coach irá subiendo.${anade}`
        : mot === 'novato' || mot === 'prudente' ? `Te sobran ${cu}: para empezar, con este volumen basta; el Coach irá subiendo.${anade}`
        : `Te sobran ${cu}.${anade}${pocos}`); }
    if (m.why.some(w => w.c === 'expres')) out.push('En 15 minutos priorizo lo básico: 3 ejercicios de 2 series. Haz la primera serie con poco peso. Con 30 cabría una rutina completa.');
    { const c = m.why.find(w => w.c === 'corto');   // v5 (C-17)
      if (c) { const nn = c.p.nMin != null && c.p.nMin !== c.p.nMax ? c.p.nMin + ' o ' + c.p.nMax : (c.p.nMax || c.p.n);
        out.push(`En ${c.p.min} minutos, con los 5 de calentamiento que necesitas, caben ${nn} ejercicios de 2 series por día. Haz la primera serie con poco peso. Con 30 minutos cabría una rutina completa.`); } }
    // cardio
    const cardioRows = res.det.flatMap(dd => dd.rows).filter(r => r.kind === 'cardio'), cardioRow = cardioRows[0];
    // v9 (J-14): con «Aguantar más» o «Perder grasa», el tiempo que sobra va al cardio: la frase dice cuánto y por qué
    if (cardioRow) { const mins = [...new Set(cardioRows.map(r => r.min))].sort((a, b) => a - b), nombres = [...new Set(cardioRows.map(r => r.n.replace(/^Cardio — /, '').toLowerCase()))];
      out.push(`${mins.length === 1 ? mins[0] : 'Entre ' + mins[0] + ' y ' + mins[mins.length - 1]} min de ${nombres.length === 1 ? nombres[0] : 'cardio (' + joinY(nombres.slice(0, 2)).replace(' y ', ' o ') + ')'} al final${m.cardioRelleno ? `: con «${GOAL[inp.goal]}», el tiempo que sobra va al cardio${inp.goal === 'salud' ? ', que es la otra mitad de la salud' : ''}` : ''}${P.zones.rodilla ? (m.cardioRelleno ? ', sin cargar la rodilla' : ': suma sin cargar la rodilla') : P.noImpact || P.mayor ? (m.cardioRelleno ? ', de bajo impacto' : ': de bajo impacto') : ''}.`); }
    else if (cutC) out.push(`Con ${inp.min} minutos no cabe el cardio al final: ${inp.sport === 'suave' ? 'sigue con tus paseos y, si puedes, haz 2 de 30 minutos a paso ligero' : inp.days > res.weeklyTarget ? 'hazlo en los días sin pesas' : 'hazlo otro día, aparte, 20-30 minutos a paso ligero o en bici'}.`);   // v10 (J-19)
    if (m.why.some(w => w.c === 'paseos')) out.push('Sigue con tus paseos: ya cuentan como cardio.');
    // v7 (C-23): «así se aconseja» (calentamiento, equilibrio, máquinas y sin llegar al límite sí son lo que dicen las guías; el tope de días no)
    // v10 (J-16): la frase de 65+ con lo que hay: equilibrio en la sesión o en casa, máquinas solo si las hay
    const strRows = res.det.flatMap(dd => dd.rows.filter(r => r.kind === 'str' && BY.get(r.lib).lt === 'w')), maqs = strRows.filter(r => ['maquina', 'polea', 'smith'].includes(BY.get(r.lib).mat)).length;
    const hayBal = res.det.some(dd => dd.rows.some(r => r.kind === 'bal'));
    if (P.mayor) out.push(`${joinY(['Más calentamiento', hayBal ? `${m.balMin || 5} minutos de equilibrio` : 'equilibrio en casa', maqs ? 'máquinas' : 'ejercicios estables', 'series que no llegan al límite'])}: así se aconseja a partir de los 65.`);
    { const mats = [...new Set(strRows.map(r => ({ maquina: 'máquinas', polea: 'poleas', smith: 'Smith', mancuernas: 'mancuernas' })[BY.get(r.lib).mat]).filter(Boolean))];   // v10 (J-16): el material que sale de verdad
      if (m.why.some(w => w.c === 'mayor_exp')) out.push(`Como llevas tiempo entrenando, la rutina tiene el volumen de alguien con experiencia${m.wd >= 4 ? ' y 4 días de torso y pierna' : ''}, ${mats.length ? 'con ' + joinY(mats) : 'con lo que tienes'} y sin barra libre en los principales. Al cerrar el primer ciclo, el Coach te propondrá 8-12 repeticiones dejando unas 2 en reserva.`); }   // C-07
    { const eq = m.why.find(w => w.c === 'equilibrio_dias'); if (eq) out.push(`Con ${eq.p.pesas} días de pesas, haz también 5-10 minutos de equilibrio en casa otro día de la semana, junto a una pared o una silla.`); }   // C-09
    // v7 (C-14): «Prefiero no decirlo» = prudente + los cuidados de 65+
    if (P.segM && !P.mayor) out.push('Como no sé tu edad, la rutina es prudente y lleva los cuidados que pongo a partir de los 65: equilibrio tras el calentamiento, nada que doble o gire la espalda con peso y zancadas con apoyo. Si me dices tu edad, la ajusto.');
    else if (P.prud && !P.mayor) out.push(inp.age === '16' && LV_[P.level] < 2 ? 'Rutina suave mientras aprendes la técnica: nada al límite y subidas pequeñas.' : 'Rutina suave: nada al límite y subidas pequeñas, por lo que marcaste.');
    else if (P.menor) out.push('Con 16-17 años y experiencia: los básicos de siempre, con la técnica primero, nada por debajo de 6 repeticiones y dejando 2 o más en cada serie.');   // v9 (J-11)
    // v9 (J-11): si pidió explosivos y no hay, se dice por qué (antes, Lucas los pedía y no se le decía nada)
    if (inp.power && !res.det.some(dd => dd.rows.some(r => r.slot === 'PW'))) out.push(`Sin ejercicios explosivos por ahora: ${P.prud ? 'tu rutina es prudente' : P.segM ? 'mejor sin saltos para tu edad' : P.huesos ? 'con huesos frágiles, sin impacto' : P.zonaActiva ? 'mientras tengas la molestia, sin saltos' : LV_[P.level] < 2 ? 'primero, la técnica de los básicos; el Coach te los propondrá cuando lleves 6 meses' : inp.min <= 20 ? `en ${inp.min} minutos no caben` : 'no caben en tus sesiones'}.`);
    if (m.why.some(w => w.c === 'fuerza_general')) { const b = rangoDe(res.det.flatMap(dd => dd.rows.filter(r => r.kind === 'str' && r.prio === 1 && r.c && typeof r.r === 'number'))); out.push(`Empiezo con fuerza general${b ? ' (' + b + ' repeticiones en los básicos)' : ''}; los básicos pesados, cuando el Coach vea que estás listo.`); }   // C-27 (v10, J-17: con el rango que hay)
    if (m.why.some(w => w.c === 'paron_largo')) out.push('Llevas más de 2 años sin entrenar: empiezo como si fuera la primera vez, con 2 series y ejercicios fáciles de aprender. El Coach irá subiendo según lo que hagas.');   // I-4
    { const vu = m.why.find(w => w.c === 'vuelta'); if (vu) out.push(vu.p.fuera === '2a6m' ? 'Vuelves tras unos meses: empiezo un nivel por debajo y con algo menos de peso que antes del parón; el Coach te irá devolviendo a tu nivel.'
      : 'Vuelves tras más de 6 meses: empiezo un nivel por debajo y la primera sesión de cada ejercicio es para encontrar tu peso de ahora (elige uno con el que te sobren unas 3 repeticiones), no el de antes del parón.'); }   // C-02
    { const ne = m.why.find(w => w.c === 'nivel_efectivo'); if (ne) out.push(`Ya no empiezas de cero: llevas ${ne.p.semanas} semanas y ${ne.p.sesiones} sesiones. Te trato como «${ne.p.a === 'I' ? 'de 6 meses a 2 años' : 'menos de 6 meses'}»; puedes cambiarlo en «Afinar».`); }   // I-3
    // esfuerzo (v7, C-01: el objetivo va en meta.effort para el Coach; sin «🥵 en la última serie», que bloqueaba la progresión)
    out.push(P.cauto ? 'Esfuerzo: termina en 😌 Fácil, te sobran unas 3 repeticiones.' : P.level === 'P' || P.level === 'P0' ? 'Esfuerzo: entre 😌 y 💪, te sobran 2-3.' : P.menor ? 'Esfuerzo: 💪 Justo, te sobran 2.' : 'Esfuerzo: 💪 Justo, te sobran 1-2.');
    // v10 (J-19): «elige pesos» solo si hay ejercicios con peso; en los modos cautos, «te sobren unas 3» (como el esfuerzo de arriba)
    { const conPeso = res.det.some(dd => dd.rows.some(r => r.kind === 'str' && BY.get(r.lib).lt === 'w'));
      out.push(`La primera semana es de prueba: elige ${conPeso ? 'pesos' : 'la variante'} con ${conPeso ? 'los' : 'la'} que te sobren ${P.cauto ? 'unas 3' : '2-3'} repeticiones. Desde la segunda sesión, el Coach te dice ${conPeso ? 'cuánto poner' : 'cuándo subir de variante'}.`); }
    return out;
  }
  function avisos(res, inp) {
    const m = res.meta, out = [], P = G.effective(inp), seen = new Set();
    const add = s => { if (!seen.has(s)) { seen.add(s); out.push(s); } };
    // v10 (J-18): para quien empieza, prudentes, 65+ y «Salud y forma», los avisos de volumen solo de los grupos grandes (sin cabezas del
    // deltoides ni bíceps, tríceps, gemelos o abdomen): son detalles que no puede usar; el hombro, como «hombro»
    const simple = P.inicio || P.cauto || LV_[P.level] <= 1 || inp.goal === 'salud';
    const VL = g => ((K.PLBL || GLBL)[g] || GLBL[g] || g);
    // (sin cabezas del deltoides ni pequeños para quien empieza, cautos y «Salud y forma»; a los demás, los pequeños solo si son su prioridad)
    const volW = m.warn.filter(w => w.c === 'vol_corto' && !(simple && ['hombro_lat', 'hombro_post'].includes(w.p.g)) && !((K.PSMALL || []).includes(w.p.g) && (simple || !P.prioV.has(w.p.g))));
    const vT = volW.filter(w => w.p.motivo === 'tiempo').map(w => VL(w.p.g).toLowerCase());
    if (vT.length) add(`Con ${inp.min} minutos, ${joinY([...new Set(vT)])} ${vT.length === 1 ? 'se queda' : 'se quedan'} por debajo de lo ideal: con más tiempo o más días se completa${vT.length === 1 ? '' : 'n'}.`);
    const vP = volW.filter(w => w.p.motivo === 'tope').map(w => VL(w.p.g).toLowerCase());
    if (vP.length) add(P.mayorExp ? `Las primeras semanas, pocas series por ejercicio (3 en los principales y 2 en el resto): ${joinY([...new Set(vP)])} ${vP.length === 1 ? 'se queda' : 'se quedan'} algo por debajo de lo ideal; al cerrar el primer ciclo, el Coach te propondrá subir.`   // v7 (C-07)
      : P.mayor || P.inicio ? `Las primeras semanas, 2 series por ejercicio: ${joinY([...new Set(vP)])} ${vP.length === 1 ? 'se queda' : 'se quedan'} algo por debajo de lo ideal; al cerrar el primer ciclo, el Coach te propondrá pasar a 3.`
      : `Para empezar, pocos ejercicios: ${joinY([...new Set(vP)])} ${vP.length === 1 ? 'se queda' : 'se quedan'} algo por debajo de lo ideal; el Coach irá añadiendo.`);
    // v10 (J-18): material y «días»: una frase por motivo con los grupos juntos y cifras enteras (antes, una línea por grupo con decimales: Rosa, 9)
    { const vM = [...new Set(volW.filter(w => w.p.motivo === 'material').map(w => VL(w.p.g).toLowerCase()))];
      if (vM.length) add(`Con tu material, ${joinY(vM)} ${vM.length === 1 ? 'se queda' : 'se quedan'} por debajo de lo ideal.`);
      const vZ = [...new Set(volW.filter(w => w.p.motivo === 'molestia').map(w => VL(w.p.g).toLowerCase()))];
      if (vZ.length) add(`Por tu molestia, ${joinY(vZ)} ${vZ.length === 1 ? 'se queda' : 'se quedan'} por debajo de lo ideal; cuando mejore, el Coach lo irá completando.`);
      const vD = volW.filter(w => w.p.motivo === 'dias'), nD = [...new Set(vD.map(w => VL(w.p.g).toLowerCase()))];
      if (nD.length) { const vs = vD.map(w => Math.round(w.p.v)), os = vD.map(w => Math.round(w.p.obj)), rg = a => Math.min(...a) === Math.max(...a) ? 'unas ' + a[0] : 'entre ' + Math.min(...a) + ' y ' + Math.max(...a);
        // (con 4 grupos o más, una frase para todos, como lo diría un entrenador: «cada músculo recibe unas N series por semana»)
        const media = Math.round(vs.reduce((a, b) => a + b, 0) / vs.length);
        if (nD.length >= 4) add(`Con ${res.weeklyTarget} días de ${inp.min} minutos, cada músculo recibe unas ${media} series por semana, menos de lo ideal para tu nivel${inp.goal === 'grasa' ? '; para perder grasa conservando el músculo, está bien' : ''}. Si un día tienes más tiempo, el Coach lo aprovecha.`);
        else add(`Con ${res.weeklyTarget} días de ${inp.min} minutos, ${joinY(nD)} ${nD.length === 1 ? 'recibe' : 'reciben'} ${Math.min(...vs) >= 2 ? rg(vs) + ' series por semana, algo menos de lo ideal (' + rg(os) + ')' : 'menos series de lo ideal'}. Si un día tienes más tiempo, el Coach lo aprovecha.`); } }
    for (const w of m.warn) {
      if (w.c === 'vol_corto') continue;
      else if (w.c === 'equilibrio_casa') add(`Con ${inp.min} minutos no cabe el equilibrio: hazlo en casa cualquier día, 2-5 minutos, apoyándote en una pared o una silla.`);   // v5 (C-17, C-09); v8 (J-19): los minutos de la persona
      else if (w.c === 'extensores_casa') add(`Con ${inp.min} minutos no caben los extensores de la espalda: 2 días por semana, en casa, 2 series de bird dog o de Y-T-W boca abajo.`);   // v8 (J-07)
      else if (w.c === 'no_cabe') add(`Tu Día ${'ABCDEF'[w.p.dia]} dura unos ${w.p.m} min (dijiste ${w.p.min}). ¿Subimos el tiempo o quito un ejercicio?`);
      else if (w.c === 'pocos_pesas') add('Para empezar, 3 o 4 días de pesas rinden casi igual y recuperas mejor. Si quieres moverte más, los otros días camina o haz cardio suave.');
      else if (w.c === 'alternos') add('Mejor en días alternos: así cada músculo descansa entre sesiones.');
      else if (w.c === 'suelo') add('Algún ejercicio pide tumbarse en el suelo porque no había otra opción en ese hueco: cámbialo con ⇄ si te cuesta.');
      else if (w.c === 'sin_cardio') add(`No encuentro un cardio que puedas hacer ahí: ${inp.days > res.weeklyTarget ? 'el cardio, en los días sin pesas' : 'camina a paso ligero o ve en bici otro día, 20-30 minutos'}.`);   // v10 (J-19)
      else if (w.c === 'sin_calentamiento') add('No encuentro un calentamiento con tu material: camina o muévete 5 minutos antes de empezar.');
      else if (w.c === 'core_corto') add(`En sesiones de ${inp.min} minutos no cabe el core: haz 2 minutos de ${P.noFloor ? "plancha con las manos en una mesa o una encimera, sin bajar al suelo," : P.posparto ? "dead bug o bird dog (estas semanas, mejor que la plancha)" : "plancha"} en casa cualquier día.`);   // v2 (D-18); v10 (J-19): los minutos de la persona; con «sin suelo», sin suelo; en el posparto, sin plancha frontal (J-27)
      // v7 (paso 4): avisos de seguridad y modos
      else if (w.c === 'consulta_inactivo') add('Como ahora no haces ejercicio y marcaste una enfermedad o una medicación, te recomiendo comentarlo con tu médico antes de empezar. La rutina es suave igualmente.');   // C-10
      else if (w.c === 'huesos') add('Con huesos frágiles, nada que doble o gire la espalda ni ejercicios de impacto. Consúltalo con tu médico antes de subir los pesos.');   // C-13
      else if (w.c === 'posparto') add('Sin impacto ni abdominales que doblen la espalda con peso. Si notas pérdidas de orina, peso en la zona del periné o un bulto en la tripa al hacer fuerza, coméntalo con tu matrona o con un fisioterapeuta de suelo pélvico.');   // C-12
      else if (w.c === 'reciente') add(`Antes de volver a cargar tu ${zl(w.p.z)}, que la valore tu fisio o tu médico: es una lesión de las últimas semanas.`);   // C-16
      else if (w.c === 'otra_zona' && ['ahora', 'op', 'reciente'].includes(w.p.tipo)) add('Si esa molestia es por una operación o por un golpe reciente, consúltalo antes de entrenar la zona.');   // C-15
    }
    if (res.meta.validate.soft.includes('tiron_empuje')) add(`Tirón y empuje no quedan equilibrados (${m.ratio.tiron_empuje}): con tu material no hay más tirón.`);
    if (res.det.some(d => d.rows.some(r => r.lib === 'lib_inverted_row_table'))) add('Usa una mesa firme y estable. Con una banda y anclaje de puerta tendrías remos más seguros.');
    const ops = Object.keys(inp.zones || {}).filter(z => inp.zones[z] === 'op'); if (ops.length) add('Antes de cargar esa zona, consulta a quien te operó o a tu fisio.');
    if (Object.keys(inp.zones || {}).length >= 4) add('Con tantas molestias, te recomiendo que un fisioterapeuta revise tu rutina.');
    // v7 (C-10): rutina prudente por enfermedad o medicación, con las dos frases de seguridad (tensión no controlada y azúcar)
    const scr = [].concat(inp.screen || []);
    if (P.prud && !P.mayor && inp.age !== '16' && inp.age !== 'nd') add('Rutina prudente: nada al límite ni intervalos intensos. Consulta a tu médico antes de subir la intensidad.');
    if (scr.some(s => ['enf', 'med'].includes(s))) add('Si tu tensión no está controlada (por ejemplo, 160/100 o más), consúltalo antes de empezar.');
    if (scr.includes('med')) add('Si usas insulina u otras pastillas que bajan el azúcar, lleva algo dulce y para si notas temblor o sudor frío.');
    if (inp.age === '16') add('Si puedes, entrena con alguien que te enseñe la técnica.');
    // v7 (C-16): la regla de dolor lleva la línea fija de alarma
    if (Object.keys(inp.zones || {}).length) { add('Una molestia leve (3 de 10 o menos) que no empeora al día siguiente es aceptable. Si es punzante, pasa de 3 de 10 o empeora, deja ese ejercicio, cámbialo con ⇄ y, si sigue, consulta.');
      add('Si notas hormigueo, pérdida de fuerza o el dolor baja por la pierna o el brazo, consulta antes de seguir.'); }
    if (!res.ok) add('No he podido cumplir todas las comprobaciones: ' + res.reason.join(', '));
    // v10 (J-18): la seguridad primero (consulta, operación, lesión reciente, huesos, posparto, regla de dolor y alarma); después, el
    // material y el tiempo; al final, el volumen. La app enseña los 3 primeros y el resto en «ver más» (AVISOS_VISIBLES)
    const rango = s => /médico|consulta|fisio|operó|huesos frágiles|matrona|hormigueo|3 de 10|pérdidas de orina|tensión|azúcar|fisioterapeuta|Rutina prudente/.test(s) ? 0 : /por debajo de lo ideal|series por semana|menos series|pocas series|pocos ejercicios|Por tu molestia,/.test(s) ? 2 : 1;
    return out.map((s, i) => [s, i]).sort((a, b) => rango(a[0]) - rango(b[0]) || a[1] - b[1]).map(x => x[0]);
  }
  const AVISOS_VISIBLES = 3;
  // v7 (D-26, C-33, C-19, §I.6): frases que la app no dice nunca. Devuelve las que aparecen en una lista de textos (vacía = bien).
  const PROHIBIDAS = [/seguro para tu/i, /rehabilit/i, /\bcura\b/i, /\btrata (la|el) /i, /previene/i, /prevenir (ca[ií]das|lesiones|la osteoporosis)/i, /quema(r)? (la )?grasa/i, /tonifica/i,
    /perder[áa]s \d/i, /\bIMC\b/, /sobrepeso/i, /cuerpo ideal/i, /sin dolor no hay/i, /al fallo siempre/i, /más es mejor/i, /no pares/i, /\bdieta/i, /suplement/i, /prote[ií]na/i,
    /\bkcal\b/i, /calor[ií]as/i, /d[ée]ficit/i, /catabol/i, /[óo]ptim[oa]/i, /perfecta/i, /algoritmo/i, /\bIA\b/, /sin constancia/i, /baja (la )?tensi[óo]n/i, /baja (el )?az[úu]car/i,
    /seguro en el embarazo/i, /seguro para menores/i, /corrige la postura/i, /acelera el metabolismo/i, /24 ?%/, /amable con/i, /como mejor se aprende/i, /es lo recomendado a partir/i, /🥵 en la última/];
  // v12: y las frases rotas (una plantilla sin rellenar, undefined, NaN, un objeto): las caza la matriz en todos los perfiles
  const ROTAS = [/\$\{/, /\bundefined\b/, /\bNaN\b/, /\[object /];
  const prohibidas = frases => { const out = []; for (const s of frases || []) for (const re of PROHIBIDAS.concat(ROTAS)) if (re.test(s)) out.push(String(re) + ' → ' + s.slice(0, 80)); return out; };
  return { porque, avisos, GOAL, compra, prohibidas, AVISOS_VISIBLES, rangoDe };
};

})();
