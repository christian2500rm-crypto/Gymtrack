const _seguridad = (function () {
// Comprobaciones de seguridad, modos y textos del paso 4 (medición 5), compartidas por matriz.js y personas.js.
// Miran la rutina FINAL (filas de res.det), las respuestas ya pasadas por desdeRespuestas (inp) y el perfil efectivo (G.effective):
// no usan nada interno del generador. Uso: const S = require('./seguridad.js')(K, G, X); S(res, inp) → { clave: detalle } (vacío = bien)
// Fuentes de cada regla: 41-revision-ciencia.md (C-xx), 43-revision-requisitos-ux.md (I-xx) y 44-diagnostico-algoritmo.md (D-xx).
return function (K, G, X) {
  // E14a: el bloque de equilibrio son varias filas («bal», cada una con su parte de minutos)
  const balMinOf = d => d.rows.filter(r => r.kind === 'bal').reduce((t, r) => t + (+r.min || 0), 0);
  const SPINE = K.TAGS.spine, FLEX = K.TAGS.spineFlex;
  const CARGA = ['mancuernas', 'kettlebell', 'barra', 'barraz', 'disco'];          // en las manos: no queda una libre para apoyarse
  const APOYO_MAT = ['corporal', 'maquina', 'smith', 'trx', 'step', 'banda'];      // «con apoyo»: sin carga en las manos o guiado
  const ZONAS = ['rodilla', 'hombro', 'lumbar', 'muneca', 'cadera'];
  const lim = id => K.TAGS.lim[id] || {};
  const LVn = l => ({ P0: 0, P: 1, I: 2, A: 3 })[l];
  const MN = _menus(K);
  const menuIds = (sl, cls) => { const mm = MN.MENUS[sl] || { sec: [] }; const ids = MN.tiers(sl, cls).flat(); (mm.sec || []).forEach(s => { ids.push(...(s.tiers ? s.tiers.flat() : MN.tiers(s.slot, cls).flat())); }); return ids; };
  return function seguridad(res, inp, textosIn) {
    const P = G.effective(inp), m = res.meta, f = {};
    P.corto = P.corto || !!m.corto;
    const bump = (k, d) => { if (!f[k]) f[k] = d == null ? true : d; };
    const days = res.det;
    const str = days.flatMap(d => d.rows.filter(r => r.kind === 'str').map(r => ({ d, r, L: K.BY.get(r.lib) })));
    const all = str.concat(days.flatMap(d => d.rows.filter(r => r.kind === 'warm' || r.kind === 'cardio').map(r => ({ d, r, L: K.BY.get(r.lib) }))));
    const textos = textosIn || X.porque(res, inp).concat(X.avisos(res, inp));
    // C-01 / D-26: objetivo de esfuerzo en meta (facil en inicio, prudente y 65+; justo en el resto) y nunca «al límite en la última»
    const ef = m.effort;
    if (!ef || ef.obj !== (P.cauto ? 'facil' : 'justo') || ef.ultimaAlLimite) bump('esfuerzo_meta', JSON.stringify(ef || null));
    // C-33 / §I.6 / C-23: frases que no se dicen nunca (la lista está en textos.js)
    { const pr = X.prohibidas(textos); if (pr.length) bump('frase_prohibida', pr[0]); }
    // D-01, D-02, C-14: filtros de 65+, también con «Prefiero no decirlo»
    if (P.segM) {
      for (const { d, L } of all) {
        if (SPINE.has(L.id)) bump('seg_columna', d.letra + ':' + L.id);
        if (lim(L.id).impacto === 2 || L.pat === 'plyo') bump('seg_impacto', d.letra + ':' + L.id);
        if (L.dif === 3) bump('seg_dif3', d.letra + ':' + L.id);
      }
      for (const { d, L } of str) {
        if (L.u && ['squat', 'lunge', 'hinge'].includes(L.pat) && CARGA.includes(L.mat)) bump('apoyo_cargado', d.letra + ':' + L.id);
        if (L.id === 'lib_hip_thrust_bb') bump('seg_hip_thrust_barra', d.letra);
      }
      if (!str.some(({ L }) => L.u && ['lunge', 'squat'].includes(L.pat) && APOYO_MAT.includes(L.mat))) bump('sin_unilateral_apoyo', true);
      // C-09: bloque de equilibrio de 5 min o más tras el calentamiento; en el modo corto (15-20 min), «en casa» con su aviso
      if (m.corto) { if (!m.warn.some(w => w.c === 'equilibrio_casa')) bump('equilibrio', 'modo corto sin aviso'); }
      // (65+: 5 min o más; «Prefiero no decirlo» con 30 min: 3, porque C-14 pide el bloque sin fijar los minutos)
      else { const minB = P.mayor || inp.min >= 45 ? 5 : 3; days.forEach(d => { const iw = d.rows.findIndex(r => r.kind === 'warm'), ib = d.rows.findIndex(r => r.kind === 'bal'), bm = balMinOf(d);
        if (ib < 0 || bm < minB - 1e-9 || (iw >= 0 && ib < iw)) bump('equilibrio', d.letra + ':' + bm + ' min'); }); }
    }
    // C-07: 65+ sin barra libre en el hueco 1 los primeros ciclos
    if (P.mayor) for (const { d, r, L } of str) if (r.prio === 1 && ['barra', 'barraz'].includes(L.mat)) bump('mayor_barra_principal', d.letra + ':' + L.id);
    // C-13 (huesos frágiles) y C-12 (posparto): sin flexión ni giro de columna con carga ni impacto; huesos frágiles, tampoco abdominales en flexión
    if (P.huesos || P.posparto) for (const { d, L } of all) { if (SPINE.has(L.id)) bump('huesos_columna', d.letra + ':' + L.id); if (lim(L.id).impacto === 2) bump('huesos_impacto', d.letra + ':' + L.id); }
    if (P.huesos) for (const { d, L } of str) if (FLEX.has(L.id)) bump('huesos_flexion', d.letra + ':' + L.id);
    // C-16: «Me operaron» y lesión reciente → nada que cargue la zona (lim ≥ 1)
    for (const { d, L } of all) for (const z of Object.keys(inp.zones || {})) { if (z === 'otra') continue; if (['op', 'reciente'].includes(inp.zones[z]) && (lim(L.id)[z] || 0) >= 1) bump('zona_fuera', d.letra + ':' + L.id + ' ' + z); }
    // D-03: «Me duele ahora»: sus ejercicios «con cuidado» sin rango pesado (≤ 6) y con 3 series como mucho
    for (const { d, r, L } of str) { const rr = G.repRange(L, r.r);
      for (const z of Object.keys(inp.zones || {})) { if (z === 'otra' || inp.zones[z] !== 'ahora' || (lim(L.id)[z] || 0) < 1) continue;
        if (rr && rr.hi <= 6) bump('dolor_ahora_pesado', d.letra + ':' + L.id + ' ' + r.reps); if (r.series > 3) bump('dolor_ahora_series', d.letra + ':' + L.id + '×' + r.series);
        if (L.lt === 'w' && rr && rr.lo < 8) bump('ahora_rango', d.letra + ':' + L.id + ' ' + r.reps); } }   // v8 (J-02, J-05): 8-12 como poco
    // C-08 / C-07: 65+ como mucho 2 series en el primer ciclo; con experiencia, 3 en el principal
    if (P.mayor) for (const { d, r } of str) { const mx = P.mayorExp ? (r.prio === 1 ? 3 : 2) : 2; if (r.series > mx) bump('mayor_series', d.letra + ':' + r.lib + '×' + r.series); }
    if (P.inicio) for (const { d, r } of str) if (r.series > 2) bump('inicio_series', d.letra + ':' + r.lib + '×' + r.series);
    // prudente: sin dificultad 3, explosivos ni HIIT
    if (P.prud) for (const { d, r, L } of all) if (L.dif === 3 || L.id === 'lib_cardio_hiit' || (r.kind === 'str' && ['plyo', 'full'].includes(L.pat))) bump('prudente_filtro', d.letra + ':' + L.id);
    // C-15: el modo prudente sale solo de la comprobación de seguridad, 16-17, «Prefiero no decirlo» o posparto (no de «Otra zona»)
    { const scr = [].concat(inp.screen || []); const esperado = scr.some(s => ['enf', 'med', 'visto', 'superv'].includes(s)) || (inp.age === '16' && !P.menor) || inp.age === 'nd' || !!P.posparto;   // v9 (J-11): 16-17 con experiencia, no
      if (!!P.prud !== esperado) bump('prudente_mal', 'prudente=' + !!P.prud + ' esperado=' + esperado); }
    // I-12 / C-23: si se dan menos días de pesas de los pedidos (65+ o prudente), el texto lo dice con su motivo
    if ((P.mayor || P.prud) && inp.days > res.weeklyTarget && !textos.some(s => /^Has dicho \d días/.test(s))) bump('tope_sin_texto', inp.days + '→' + res.weeklyTarget);
    // C-10: inactivo con enfermedad o medicación → consulta antes de empezar
    if (inp.inactivo && inp.salud && !m.warn.some(w => w.c === 'consulta_inactivo')) bump('consulta_inactivo', true);
    // I-4: más de 2 años sin entrenar → P0 + inicio, sin modo vuelta
    if (inp.paron && inp.paron.fuera === 'gt2a' && (P.level !== 'P0' || !P.inicio || P.vuelta)) bump('paron_largo', P.level + ' ' + [...P.M].join(','));
    // C-17: modo corto (65+ o prudente con 15-20 min) con 5 min de calentamiento cada día
    if (m.corto) days.forEach(d => { const w = d.rows.find(r => r.kind === 'warm'); if (!w || w.min < 5) bump('corto_sin_calentamiento', d.letra); });
    // I-11: «sin suelo» (por defecto con 65+): un ejercicio de suelo solo si no había otra opción, y con su aviso
    if (P.noFloor && str.some(({ L }) => K.TAGS.suelo.has(L.id)) && !m.warn.some(w => w.c === 'suelo')) bump('suelo_sin_aviso', true);
    // dificultad (con la excepción de C-07: 65+ con experiencia, hasta 2 en máquinas, Smith y mancuernas)
    for (const { d, L } of str) if (L.dif > P.difCap && !(L.dif === 2 && P.dif2) && !(P.mayorExp && L.dif === 2 && ['maquina', 'smith', 'mancuernas'].includes(L.mat))) bump('dificultad_modo', d.letra + ':' + L.id);
    // zonas marcadas: nada «evitar» (lim 2)
    for (const { d, L } of all) for (const z of ZONAS) if ((inp.zones || {})[z] && (lim(L.id)[z] || 0) === 2) bump('zona_evitar', d.letra + ':' + L.id + ' ' + z);
    // ── v8 (paso 6, 45-juicio-entrenador.md): lo que CARGA cada ejercicio, no solo su etiqueta «con cuidado» ──
    const zs = inp.zones || {}, zAct = Object.keys(zs).some(z => ['ahora', 'op', 'reciente'].includes(zs[z]));
    // J-01: con una zona que duele ahora, operada o reciente, ni explosivos ni impacto (salvo que la persona lo pida a mano)
    if (zAct && (inp.pref || {}).impact !== true) for (const { d, r, L } of all) if (r.slot === 'PW' || lim(L.id).impacto === 2) bump('explosivo_zona', d.letra + ':' + L.id);
    // J-02: hombro que duele ahora: nada por encima de la cabeza (salvo landmine), colgado, con barra en la espalda, fondos ni elevaciones
    if (zs.hombro === 'ahora') for (const { d, L } of str) if (K.TAGS.hombroAhoraFuera.has(L.id)) bump('hombro_ahora_overhead', d.letra + ':' + L.id);
    if (zs.hombro === 'ahora') for (const { d, r, L } of str) { const rr = G.repRange(L, r.r); if (['push_h', 'push_v', 'fly'].includes(L.pat) && rr && rr.lo < 8) bump('hombro_ahora_pesado', d.letra + ':' + L.id + ' ' + r.reps); }
    // J-03: excéntricos (negativas, nórdico) a 3-5 como mucho, y nada colgado con 65 o más
    for (const { d, r, L } of str) { const rr = G.repRange(L, r.r); if (K.TAGS.excentrico.has(L.id) && (!rr || rr.hi > 6 || r.series > 2)) bump('excentrico_reps', d.letra + ':' + L.id + ' ' + r.series + '×' + r.reps); }
    if (P.segM) for (const { d, L } of str) if (K.TAGS.colgado.has(L.id)) bump('mayor_colgado', d.letra + ':' + L.id);
    if (P.cauto) for (const { d, L } of str) if (['lib_pullup_negative', 'lib_pullup_band'].includes(L.id)) bump('cauto_negativas', d.letra + ':' + L.id);
    // J-04: espalda operada o reciente: nada que comprima la columna (hack, Smith, péndulo, press de pie, hip thrust con barra)
    if (['op', 'reciente'].includes(zs.lumbar)) for (const { d, L } of str) if (['lib_hack_squat', 'lib_squat_smith', 'lib_pendulum_squat', 'lib_ohp_smith', 'lib_ohp_bb', 'lib_hip_thrust_bb', 'lib_push_press'].includes(L.id)) bump('lumbar_activa_axial', d.letra + ':' + L.id);
    // J-05: rodilla que duele ahora: ni sentadilla con barra o máquina de carga alta ni zancadas largas; y el texto «sin zancadas largas» es verdad
    if (zs.rodilla === 'ahora') for (const { d, L } of str) if (K.TAGS.rodillaAhoraFuera.has(L.id)) bump('rodilla_ahora_cargada', d.letra + ':' + L.id);
    if (textos.some(s => /zancadas largas/.test(s)) && str.some(({ L }) => K.TAGS.zancadaLarga.has(L.id))) bump('texto_zancadas', str.filter(({ L }) => K.TAGS.zancadaLarga.has(L.id)).map(({ L }) => L.id).join(','));
    // J-06: muñeca que duele ahora: flexiones solo con la nota de los puños o los agarres
    if (zs.muneca === 'ahora') for (const { d, r, L } of str) if (L.pat === 'push_h' && L.mat === 'corporal' && !/puños/.test(r.nota || '')) bump('muneca_ahora_palma', d.letra + ':' + L.id);
    // J-07: huesos frágiles: equilibrio (5 min tras el calentamiento con 30 min o más; con menos, el aviso «en casa»), extensores y remos con apoyo
    if (P.huesos) {
      if (inp.min >= 30 && !P.corto) days.forEach(d => { const iw = d.rows.findIndex(r => r.kind === 'warm'), ib = d.rows.findIndex(r => r.kind === 'bal'), bm = balMinOf(d); if (ib < 0 || bm < (inp.min >= 45 ? 5 : 3) - 1e-9 || (iw >= 0 && ib < iw)) bump('huesos_equilibrio', d.letra + ':' + bm); });
      else if (!m.warn.some(w => w.c === 'equilibrio_casa')) bump('huesos_equilibrio', 'sin aviso');
      for (const { d, L } of str) if (K.TAGS.remoSinApoyo.has(L.id)) bump('huesos_remo_sin_apoyo', d.letra + ':' + L.id);
      if (inp.min > 20 && !str.some(({ L }) => K.TAGS.extensores.has(L.id))) bump('huesos_extensores', 'ninguno');
    }
    // ── v9 (paso 6): selección y prescripción ──
    // J-08: con prioridad de brazos y material, trabajo directo (curl y tríceps) cada semana (con sesiones de 45 min o más)
    // (con 30 min o menos no se exige: el tiempo pide antes los básicos, el core y el tirón que equilibra el hombro; el texto lo dice)
    // (v14, P6: con la semana montada día a día, solo si hay un día de su familia: de tirón, torso, cuerpo completo, espalda y bíceps o brazos
    // para el curl; de empuje, torso, cuerpo completo, pecho y tríceps o brazos para el tríceps. En una semana sin esos días, el hueco del
    // día de hombros y brazos puede ceder su sitio al ejercicio que equilibra tirón y empuje, y el porqué lo dice: «no caben ejercicios directos»)
    const cabeBrazo = g => !m.roles || m.roles.some(t => ['torso', 'completo', 'brazos'].concat(g === 'biceps' ? ['tiron', 'espalda_biceps'] : ['empuje', 'pecho_triceps']).includes(t));
    if (inp.min > 30 && !P.corto) for (const g of ['biceps', 'triceps']) { if (!P.prioG.has(g) || !cabeBrazo(g)) continue;
      // (con material = algún ejercicio de su menú —el de la clase de la persona: a inicio, prudentes y 65+, sin fondos en banco ni flexión diamante— posible en sus sitios)
      const hay = menuIds(g === 'biceps' ? 'CU' : 'TR', G.clsOf(P, inp)).some(id => { const L = K.BY.get(id); return L && L.lt !== 'c' && (L.dif <= P.difCap || (P.dif2 && L.dif === 2) || (P.mayorExp && L.dif === 2 && ['maquina', 'smith', 'mancuernas'].includes(L.mat))) && Object.values(m.dayPlace).some(pk => K.placeCan(L, inp.places[pk], pk)) && G.safeL(L, inp); });
      if (hay && !str.some(({ r, L }) => G.mainGroup(L) === g || r.slot === (g === 'biceps' ? 'CU' : 'TR'))) bump('prioridad_sin_directo', g); }   // (los fondos en el hueco de tríceps y las dominadas supinas en el de curl cuentan)
    // v14 (P1): los repartos que elige la persona. Nunca con 65 o más, rutina prudente, 16-17 años, menos de 30 min ni «más glúteo»; «por
    // músculos», ni a quien empieza ni con «Ganar fuerza»; y si salió el que pidió, es de los que se le ofrecen y la semana lleva sus días
    { const SOLO_ELEGIDOS = ['tpt3', 'pplt4', 'pplc4', 'grp4', 'pplet5', 'grp5', 'tptpt5', 'pplg6'], roles = Object.values(m.tpl || {});
      if (SOLO_ELEGIDOS.includes(m.split)) {
        if (P.mayor || P.prud || P.menor || inp.min < 30 || inp.enfoque === 'gluteo') bump('plan_no_permitido', m.split);
        if (m.split.indexOf('grp') === 0 && (LVn(P.lvS) <= 1 || inp.goal === 'fuerza')) bump('plan_no_permitido', m.split + ' (por músculos)');
        if (m.split !== m.plan || (m.split !== inp.plan && !m.roles && !(inp.masTorso && !inp.plan && m.split === G.UNA_PIERNA[m.wd]))) bump('plan_sin_pedir', m.split + ' / ' + inp.plan);   // (P2: o lo pidió con «Más torso»)
        if (roles.join(',') !== G.SPLITS[m.split].join(',') && roles.slice().sort().join(',') !== G.SPLITS[m.split].slice().sort().join(',')) bump('plan_dias', roles.join(','));
      }
      // v14 (P6): reparto a medida («x:…» o uno con nombre montado día a día): solo a quien puede elegir, con tirón y empuje equilibrados, y
      // la semana que se queda sin pierna, sin empuje o sin tirón lleva su aviso (y solo ella)
      { const xm = String(m.split).indexOf('x:') === 0, pat = ps => str.some(({ L }) => ps.includes(L.pat));
        if (xm && (P.mayor || P.prud || P.menor || inp.min < 30 || inp.enfoque === 'gluteo' || !inp.roles)) bump('plan_no_permitido', m.split + ' (a medida)');
        if (xm && pat(['push_h', 'push_v']) && m.ratio.tiron_empuje < 1 - 1e-9) bump('medida_tiron_empuje', m.ratio.tiron_empuje);
        if (m.roles) { const sin = [['pierna', ['squat', 'lunge', 'hinge', 'hip_ext']], ['empuje', ['push_h', 'push_v']], ['tirón', ['pull_h', 'pull_v']]].filter(([, ps]) => !pat(ps)).map(([z]) => z);
          const dicho = textos.some(t => /^Tu semana se queda sin /.test(t));
          if (sin.length && !sin.every(z => textos.some(t => /^Tu semana se queda sin /.test(t) && t.includes(z)))) bump('semana_sin_aviso', sin.join(','));
          if (!sin.length && dicho) bump('semana_sin_aviso', 'aviso de más'); } }
      // un solo día de pierna: el texto del reparto lo dice (y los avisos dan las series si se quedan cortas)
      if (['tpt3', 'pplt4', 'pplet5', 'pplg6'].includes(m.split) && !textos.some(t => /pierna, 1|un solo día de pierna/.test(t))) bump('plan_texto', m.split); }
    // v14 (P12): «cámbialo en Cambiar reparto» solo se dice a quien la hoja se lo ofrece: nunca con el tope de 65+, de rutina prudente o de 16-17
    if ((P.mayor || P.prud || P.menor) && textos.some(t => /Has dicho \d+ días/.test(t) && /Cambiar reparto/.test(t))) bump('promesa_cambiar_reparto', true);
    // v14 (P11): el día de tirón no lleva tríceps directo (va con el empuje), tampoco con prioridad de brazos
    for (const { d, r } of str) if (/^Ti\d?$/.test(d.role) && r.slot === 'TR') bump('triceps_en_tiron', d.letra + ':' + r.lib);
    // J-09: con mancuernas de 20 kg o menos, intermedios y avanzados nunca a 8 repeticiones o menos (salvo elevaciones, brazos y gemelos)
    if (LVn(P.level) >= 2 && !P.cauto) for (const { d, r, L } of str) { const Pl = inp.places[d.place] || {}; const rr = G.repRange(L, r.r);
      if (['mancuernas', 'kettlebell'].includes(L.mat) && (Pl.dbMax || 20) <= 20 && !['raise', 'rear', 'curl', 'tri', 'calf', 'raise_f'].includes(L.pat) && rr && rr.hi <= 8) bump('carga_insuficiente', d.letra + ':' + L.id + ' ' + r.reps); }
    // J-13: nada de 2:30 o más de descanso en series de 10 repeticiones o más
    for (const { d, r, L } of str) { const rr = G.repRange(L, r.r); if (r.descanso_s >= 150 && rr && rr.lo >= 10) bump('descanso_incoherente', d.letra + ':' + L.id + ' ' + r.reps + ' ' + r.descanso_s + 's'); }
    // J-14: «Aguantar más» y «Perder grasa»: un día con 15 min o más sin usar, con cardio posible y por debajo de su tope (45 min), no
    if (['aguante', 'grasa', 'salud'].includes(inp.goal) && inp.cardioEnd !== 'no' && !m.corto && !m.why.some(w => w.c === 'expres') && !m.warn.some(w => w.c === 'sin_cardio'))
      days.forEach(d => { const c = d.rows.find(r => r.kind === 'cardio'); if (inp.min - d.minExact >= 15 + 1e-9 && (!c || c.min < (inp.goal === 'salud' ? 30 : 45))) bump('objetivo_cardio_sin_usar', d.letra + ':' + Math.round(inp.min - d.minExact)); });
    // J-11: 16-17 con experiencia: sin rango de 6 o menos; si pidió explosivos y no hay, se dice por qué
    if (P.menor) for (const { d, r, L } of str) { const rr = G.repRange(L, r.r); if (r.slot !== 'PW' && rr && rr.hi <= 6) bump('menor_pesado', d.letra + ':' + L.id + ' ' + r.reps); }
    if (inp.power && !str.some(({ r }) => r.slot === 'PW') && !textos.some(s => /explosiv/i.test(s))) bump('texto_explosivos_ignorados', true);
    // ── v10 (paso 6): textos verdaderos y legibles (J-16…J-19) ──
    const mats = new Set(str.map(({ L }) => L.mat)), hayBal = days.some(d => d.rows.some(r => r.kind === 'bal'));
    // J-16: «máquinas», «Smith» o «N minutos de equilibrio» solo si los hay
    for (const s of textos) { if (/máquinas/i.test(s) && /para empezar|así se aconseja|con máquinas/.test(s) && !['maquina', 'polea', 'smith'].some(x => mats.has(x)) && !/sin máquinas/.test(s)) bump('texto_falso_65', 'máquinas: ' + s.slice(0, 60));
      if (/Smith/.test(s) && !mats.has('smith')) bump('texto_falso_65', 'Smith: ' + s.slice(0, 60));
      if (/\d+ minutos de equilibrio/.test(s) && !hayBal) bump('texto_falso_65', 'equilibrio: ' + s.slice(0, 60)); }
    // J-17: los rangos de la frase de repeticiones existen en la rutina
    { const rngs = new Set(str.map(({ r, L }) => { const rr = G.repRange(L, r.r); return rr ? rr.lo + '-' + rr.hi : null; }).filter(Boolean));
      for (const s of textos.filter(s => /^(Ganar|Perder|Salud|Aguantar)[^:]*: .*repeticiones/.test(s) || /^Empiezo con fuerza general/.test(s))) for (const mm of s.matchAll(/(\d+)-(\d+)/g)) if (!rngs.has(mm[1] + '-' + mm[2])) bump('texto_reps', mm[0] + ' en «' + s.slice(0, 60) + '»'); }
    // J-18: avisos sin decimales ni «0 series» y como mucho 3 de volumen
    { const av = X.avisos(res, inp); if (av.some(s => /\d\.\d/.test(s) || /unas [01] series/.test(s))) bump('avisos_ilegibles', av.find(s => /\d\.\d|unas [01] series/.test(s)).slice(0, 60));
      if (av.filter(s => /por debajo de lo ideal|series por semana|menos series de lo ideal/.test(s)).length > 3) bump('avisos_ilegibles', 'más de 3 de volumen');
      if (av.concat(textos).some(s => /Mientras te duela la hombro/.test(s))) bump('avisos_ilegibles', 'la hombro'); }
    // J-19: frases con datos que no son los de la persona
    if (textos.some(s => /elige pesos/.test(s)) && !str.some(({ L }) => L.lt === 'w')) bump('texto_no_cuadra', 'elige pesos sin pesos');
    if (textos.some(s => /En sesiones de (\d+) minutos/.test(s) && +s.match(/En sesiones de (\d+) minutos/)[1] !== inp.min)) bump('texto_no_cuadra', 'minutos del core');
    if (textos.some(s => /^Con (\d+) minutos no cabe el equilibrio/.test(s) && +s.match(/^Con (\d+) minutos/)[1] !== inp.min)) bump('texto_no_cuadra', 'minutos del equilibrio');
    if (textos.some(s => /en los días sin pesas/.test(s)) && !(inp.days > res.weeklyTarget)) bump('texto_no_cuadra', 'días sin pesas');
    if (textos.some(s => /por tu molestia/.test(s)) && !Object.keys(zs).length && !P.segM && !P.huesos && !P.posparto && !P.prud) bump('texto_no_cuadra', 'molestia sin molestia');
    if (P.cauto && textos.some(s => /sobren 2-3/.test(s))) bump('texto_no_cuadra', 'cauto con 2-3');
    if (textos.some(s => /\d\.\d/.test(s))) bump('texto_no_cuadra', 'punto decimal: ' + textos.find(s => /\d\.\d/.test(s)).slice(0, 50));
    return f;
  };
};

})();
