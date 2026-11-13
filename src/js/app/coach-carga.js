// ═══ COACH DE CARGA (v15) ═══════════════════════════════════════════════
// coach_prescribe(exId) decide el peso y las reps de HOY de un ejercicio a partir de tus sesiones normales
// (las de descarga o descanso, dl, no cuentan). Es la ÚNICA fuente de sugerencias de carga: objetivo y etiqueta de
// la tarjeta, placeholders, tarjeta de resultado, ajuste en vivo, calentamiento, modal final, objetivos de Inicio y
// «Tu próxima sesión» del Coach. Reglas:
//  · Doble progresión en un rango de reps (repRange): mismo peso y +1 rep hasta llegar al tope en todas las series;
//    entonces sube el salto de tu equipo y vuelve al mínimo del rango.
//  · RPE medio de la última sesión (1-3, el mismo corte que la etiqueta 😌/💪/🥵): todo fácil → salto doble (si cabe
//    en el tope del 10 %) o +2 reps; al límite en TODAS las series y sin reps de sobra → se repite una vez y luego se sube (C1, _limCase).
//  · Dos sesiones seguidas con el mismo peso claramente por debajo del rango → baja un 5-10 % (al menos un salto).
//  · Saltos según el equipo (loadStepFor: Ajustes, o el que ya usas en ese ejercicio, o el de su tipo de equipo).
//    Tope del 10 % por salto: si hasta el salto más pequeño lo supera (1 kg sobre 8.5 kg), antes suma hasta 2 reps
//    por encima del tope del rango; y un salto de más del 25 % no se propone nunca (8.5 → 11 kg en polea).
//  · Semana de descarga o de descanso: mismo peso (nunca sube). Tras 3+ semanas sin hacerlo: repite antes de subir.
//  · Cada sesión se juzga con el plan con el que se hizo (ps/pr del registro, _recPlan): si luego cambian las series
//    o las reps (Coach o editor), no cuenta como series sin completar. Con menos reps en el plan, sube el peso; con
//    más, lo baja (~2.5 % por rep de diferencia). Con una serie más, mismo peso hasta completarlas.
// Devuelve null si no hay historial (o el objetivo es por tiempo). Si no:
// {exId, kind:'up'|'reps'|'keep'|'down'|'deload', weight, reps, lo, hi, sets, last, step, eq, reason, head, ...}
function _r2(v){return Math.round(v*100)/100;}
// 57.5 → «57.5», 60 → «60», 9.25 → «9.25»
function kgTxt(v){const n=+v;return isFinite(n)?String(_r2(n)):'';}
// RPE medio guardado (1-3) → 1 fácil · 2 justo · 3 al límite (null sin dato)
function rpeCat(v){if(!_rpeOn())return null;v=+v; // (M2) esfuerzo apagado: como si no hubiera esfuerzo apuntado (Coach, «¿Por qué?», historial)
  return v>0&&isFinite(v)?(v<=1.4?1:v<=2.4?2:3):null;}
const RPE_TXT={1:'fácil',2:'a esfuerzo justo',3:'al límite'};
// Tipo de equipo para el salto de peso: el del material de su ejercicio de la biblioteca (MAT[mat].cls; máquina y polea
// según sea multiarticular; peso corporal con lastre: bw). Sin biblioteca (personalizado o importado), o cardio: por
// equipo, nombre e id, como siempre.
function loadEqClass(ex){
  if(!ex)return'maqA';
  const L=exLib(ex);
  if(L&&!L.cardio){
    if(L.lt==='bw')return'bw';
    const c=MAT[L.mat].cls,k=isCompoundEx(ex);
    return c==='maq'?(k?'maq':'maqA'):c==='polea'?(k?'maq':'polea'):c;
  }
  if(isBodyweightEx(ex))return'bw';
  const lib=String(_libIdOf(ex)||ex.lib||'');
  const t=normTxt(`${ex.eq||''} ${ex.n||''}`);
  const comp=isCompoundEx(ex);
  if(/mancuern|dumbbell/.test(t)||/_db(_|$)/.test(lib))return'manc';
  if(/cable|polea/.test(t))return comp?'maq':'polea';
  if(/smith|barra|barbell/.test(t))return'barra';
  return comp?'maq':'maqA';
}
// Salto que ya usas en un ejercicio: el aumento más repetido entre tus últimos registros normales, ajustado a un salto
// real (0.5, 1, 1.25, 2, 2.5 o 5). Así nunca te propone un peso que tu máquina no tiene. null si aún no has subido nunca.
// Solo cuentan las subidas de verdad: un récord de peso nuevo sobre el mejor anterior (volver a tu peso tras una
// bajada no es un salto), sin las sesiones ligeras (dl: descarga o semana de descanso) y sin saltos de más del 25 %
// (un error al teclear). Si ese salto grande se repite en la sesión siguiente, pasa a ser tu nueva referencia.
// Con pesas fijas, los saltos de su equipo (kettlebell de 4 en 4 kg: un +4 no se queda en 5).
const LOAD_SNAP=[0.5,1,1.25,2,2.5,5],HIST_SNAP={kb:LOAD_EQ.kb.opts,disco:LOAD_EQ.disco.opts};
function _histStep(exId,cls){
  const SN=HIST_SNAP[cls]||LOAD_SNAP;
  const a=(Array.isArray(S.strength[exId])?S.strength[exId]:[]).filter(r=>r&&!r.dl&&+r.v>0&&isFinite(+r.v)).slice(-12);
  const cnt={};
  let top=a.length?+a[0].v:0;
  for(let i=1;i<a.length;i++){
    const v=+a[i].v,dv=_r2(v-top);
    if(!(dv>0))continue;
    if(dv>top*LOAD_MAX+1e-9){if(+a[i-1].v>top*(1+LOAD_MAX)+1e-9)top=v;continue;}
    const s=SN.reduce((b,x)=>Math.abs(x-dv)<Math.abs(b-dv)?x:b,SN[0]);cnt[s]=(cnt[s]||0)+1;
    top=v;
  }
  let best=null,bn=0;
  Object.keys(cnt).forEach(k=>{const n=cnt[k];if(n>bn||(n===bn&&+k<best)){best=+k;bn=n;}});
  return best;
}
// Salto de peso de un ejercicio → {step, src:'ajuste'|'historial'|'equipo'}
function loadStepFor(ex,cls){
  cls=cls||loadEqClass(ex);
  const set=LOAD_EQ[cls]&&S.loadSteps?S.loadSteps[cls]:'auto';
  if(set!=='auto'&&LOAD_EQ[cls]&&LOAD_EQ[cls].opts.includes(+set))return{step:+set,src:'ajuste'};
  const h=ex?_histStep(ex.id,cls):null;
  if(h)return{step:h,src:'historial'};
  return{step:LOAD_EQ[cls]?LOAD_EQ[cls].def:2.5,src:'equipo'}; // peso corporal con lastre: 2.5
}
function loadStepOf(ex){return loadStepFor(ex).step;}
// Rango de reps de la doble progresión. Un rango escrito en el plan («8-12») se respeta tal cual. Si es un número:
// multiarticular → [r-2, r] (12 → 10-12); aislamiento → [r, r+3] (12 → 12-15); con 15+ reps → [r-3, r].
// Objetivo por tiempo («30s») → null.
function repRange(ex){
  const raw=String(ex&&ex.r!=null?ex.r:'').trim();
  const m=raw.match(/^(\d{1,3})\s*[-–]\s*(\d{1,3})$/);
  if(m&&+m[1]>0&&+m[2]>=+m[1])return{lo:+m[1],hi:+m[2]};
  const r=targetRepsNum(ex);
  if(r==null)return null;
  if(r>=15)return{lo:r-3,hi:r};
  return isCompoundEx(ex)?{lo:Math.max(1,r-2),hi:r}:{lo:r,hi:r+3};
}
// ¿Sesión fallida? Claramente por debajo del rango: 2+ reps por debajo del mínimo, o por debajo y al límite
function _loadFail(rec,lo){
  const r=_recReps(rec);
  return r!=null&&(r<lo-1||(r<lo&&rpeCat(rec.rpe)===3));
}
// Plan que había ANTES de una propuesta aplicada de «Añadir serie» o «Cambiar esquema», sacado de su diff
// («3×12 → 4×8»): {s, r} (r = null si solo cambiaron las series). null si es de otro tipo o no se entiende.
function _propPrevPlan(a){
  if(!a||(a.type!=='add_set'&&a.type!=='rep_scheme')||typeof a.diff!=='string')return null;
  const m=a.diff.match(/^\s*(\d{1,2})\s*×\s*([^\s→·]{1,20})/);
  if(!m||!(+m[1]>0))return null;
  return{s:+m[1],r:a.type==='rep_scheme'?m[2]:null};
}
// El primero de esos cambios de exId aplicado después de ts → el plan de antes {s, r}; null si no hubo ninguno.
// (Se usa también en la migración v16 con las propuestas de los datos que se migran.)
function _planBefore(applied,exId,ts){
  if(!Array.isArray(applied)||!(ts>0))return null;
  let best=null,bp=null;
  applied.forEach(a=>{
    if(!a||a.exId!==exId||!(+a.appliedAt>ts)||(best&&+a.appliedAt>=+best.appliedAt))return;
    const p=_propPrevPlan(a);if(p){best=a;bp=p;}
  });
  return bp;
}
// Plan (series y reps) con el que se hizo un registro de fuerza. Los nuevos lo guardan (ps/pr, v16); si falta, el de
// antes de un «Añadir serie» / «Cambiar esquema» aplicado después y, si tampoco, el plan de ahora.
function _recPlan(rec,ex){
  const ps=parseInt(rec&&rec.ps),hasR=!!rec&&_validPr(rec.pr);
  if(ps>0&&hasR)return{s:ps,r:rec.pr};
  const b=_planBefore(S.appliedProposals,ex.id,rec&&+rec.ts);
  return{s:ps>0?ps:b&&b.s>0?b.s:_baseSets(ex),r:hasR?rec.pr:b&&b.r!=null?b.r:ex.r};
}
// Rango de reps de un registro según SU plan (si las reps del plan cambiaron después); null si es el mismo de ahora
function _recRange(rec,ex){
  const p=_recPlan(rec,ex);
  if(String(p.r).trim()===String(ex.r).trim())return null;
  return repRange(Object.assign({},ex,{r:p.r}));
}
// Coach de carga por tipo de registro (exLT): peso × reps → _presKg (el de siempre); peso corporal con lastre (su último
// registro tiene peso) → también _presKg; peso corporal sin lastre y «solo reps» (bandas, sin material) → _presReps;
// por tiempo o por distancia → _presTD. Cardio: null. Todas devuelven el mismo objeto P (con unit 'kg' | 'reps' | 's' | 'm').
function coach_prescribe(exId,opts){
  opts=opts||{};
  const ex=opts.ex||findExInPlan(exId);
  if(!ex||ex.cardio)return null;
  const lt=exLT(ex);if(lt==='c')return null;
  if(lt==='w')return _presKg(exId,ex,opts);
  const all=(Array.isArray(S.strength[exId])?S.strength[exId]:[]).filter(r=>r&&typeof r==='object');
  if(opts.extra)all.push(opts.extra);
  const real=all.filter(r=>!r.dl),d=real.length?real:all;
  if(!d.length)return null;
  if(lt==='bw'&&+d[d.length-1].v>0)return _presKg(exId,ex,opts);
  return lt==='bw'||lt==='r'?_presReps(exId,ex,lt,d,opts):_presTD(exId,ex,lt,d,opts);
}
// Con pesas fijas (kettlebell) un salto de más del 50 % no se da: antes, la variante más difícil
const KB_MAX=0.5;
// Reps con las que empezar tras un salto de pesa fija: las que dan el mismo 1RM estimado con el peso nuevo (Epley), entre
// loE y lo (16 kg × 14 → 20 kg × 6)
function _kbReps(w,r,step,lo,loE){
  const e=w*(1+Math.min(r,30)/30);
  return Math.max(loE,Math.min(lo,Math.round(30*(e/(w+step)-1))));
}
// ── (E6, §G.4-§G.5) EL COACH CON LA RUTINA NUEVA ──
// Esfuerzo objetivo de tu rutina (planMeta.effort): 'facil' (empezar de cero, prudente, 65 o más) o 'justo'; null sin rutina
// generada (como siempre). Las caritas se juzgan respecto de él: con 'facil', «😌 Fácil» es el objetivo (+1 repetición o un salto
// simple, como mucho una subida de peso por semana), «💪 Justo» ya es más de lo previsto (se mantiene) y «🥵 Al límite», un salto menos.
function _effortObj(){const e=_isPlainObj(S.planMeta)&&S.planMeta.effort;return e&&(e.obj==='facil'||e.obj==='justo')?e.obj:null;}
// ¿Subió el peso en los últimos 7 días? (la última subida entre dos registros seguidos)
// (M2b) ¿La sesión anterior a la última también llegó al tope del rango (el de su plan) en todas las series con el mismo peso?
// Para el perfil prudente con el esfuerzo apagado: sube solo tras dos sesiones seguidas en el tope.
function _topTwice(d,ex,w,hi){
  const p=d.length>1?d[d.length-2]:null;if(!p||Math.abs(+p.v-w)>1e-9)return false;
  const rr=_recRange(p,ex),r=_recReps(p);if(!(r>=(rr?rr.hi:hi)))return false;
  const sd=p.setsDone==null||p.setsDone===''?null:parseInt(p.setsDone),tn=_recTopSets(p),sdj=tn!=null&&sd!=null&&tn<sd?tn:sd;
  return sdj==null||!(sdj>=0)||sdj>=_recPlan(p,ex).s;
}
function _upThisWeek(d){for(let i=d.length-1;i>0;i--){if(+d[i].v>+d[i-1].v+1e-9)return!!d[i].ts&&Date.now()-d[i].ts<7*86400000;}return false;}
// Vuelta tras un parón (§G.4), para todo el mundo, por el tiempo desde el último registro de ESTE ejercicio: 3-8 semanas → −10 %;
// 8-26 → −20 % (y desde ahí se juzga contra los registros nuevos); más de 26 → sin peso propuesto («Primera vez tras el parón»).
// La rutina generada lo adelanta a quien dijo que volvía de un parón (planMeta.vuelta), con los registros de antes de ella.
function _presGap(exId){
  const a=(_isPlainObj(S.strength)&&Array.isArray(S.strength[exId])?S.strength[exId]:[]).filter(r=>r&&typeof r==='object'&&!r.dl&&+r.ts>0);
  const last=a[a.length-1];if(!last)return null;
  const days=(Date.now()-last.ts)/86400000,pm=_isPlainObj(S.planMeta)?S.planMeta:null,pv=pm&&pm.vuelta&&last.ts<pm.ts?pm.vuelta:null;
  return{days,pv,retake:days>182||pv==='recalibrar',cut:days>182?0:(days>56||pv==='menos20')?0.2:days>=LOAD_GAP_DAYS?0.1:0};
}
function _presRetake(exId){const ex=findExInPlan(exId);if(!ex||ex.cardio||exLT(ex)!=='w')return false;const g=_presGap(exId);return!!(g&&g.retake);}
// Mancuernas más pesadas que tienes en el sitio del día de este ejercicio («Mi material»); null sin tope
function _maxLoadOf(ex){
  const L=exLib(ex);if(!L||L.mat!=='mancuernas'||!_isPlainObj(S.places))return null;
  const p=getPlan(),dk=dayKeys(p).find(k=>(p[k].ex||[]).some(e=>e&&(e.id===ex.id||routineEx(e).id===ex.id)));
  const P=S.places[dk?placeOfDay(dk):(S.places.main||'g')];
  return P&&+P.dbMax>0&&+P.dbMax<99?+P.dbMax:null;
}
// (C1) «Al límite» en lo alto del rango ya no frena la subida sin fin (antes: «repítelo hasta que salga justo», aunque sobraran
// repeticiones; quien entrena siempre al fallo no subía nunca). Solo se repite, y una sola vez ('hold'), si TODAS las series fueron al
// límite, no sobran 2 o más repeticiones sobre el tope y la sesión anterior con este peso no estaba ya en el tope. Si no, se sube un
// salto (nunca el doble): 'sobran' (2+ repeticiones por encima del tope) · 'repetido' (ya lo repetiste) · 'ultimas' (solo costaron
// las últimas series, lo normal). Los registros sin series (antiguos) cuentan como «todas al límite». Con objetivo «fácil» (65 o más,
// rutina prudente, empezar de cero) no cambia nada: «al límite» sigue bajando un salto o repitiendo.
function _limCase(d,last,w,r,top){
  if(r>=top+2)return'sobran';
  const ss=Array.isArray(last.sets)?last.sets.filter(x=>x&&x.rpe>=1&&x.rpe<=3):[];
  if(ss.length&&!ss.every(x=>x.rpe===3))return'ultimas';
  const p=d.length>1?d[d.length-2]:null;
  return p&&Math.abs((+p.v||0)-w)<0.01&&_recReps(p)>=top?'repetido':'hold';
}
const LIM_TXT={sobran:', y te sobran repeticiones',repetido:' otra vez: toca subir',ultimas:' en las últimas series'};
function _presKg(exId,ex,opts){
  const rr=repRange(ex);
  if(!rr)return null;
  const src=(Array.isArray(S.strength[exId])?S.strength[exId]:[]).filter(r=>r&&+r.v>0&&isFinite(+r.v));
  if(opts.extra)src.push(opts.extra);
  if(!src.length)return null;
  const real=src.filter(r=>!r.dl),d=real.length?real:src;
  const last=d[d.length-1],w=+last.v;
  const cls=loadEqClass(ex),ls=loadStepFor(ex,cls),step=ls.step;
  const lo=rr.lo,hi=rr.hi,baseSets=_baseSets(ex);
  const r=_recReps(last),rc=rpeCat(last.rpe);
  const sd=last.setsDone==null||last.setsDone===''?null:parseInt(last.setsDone);
  // Lo de hoy (tarjeta de resultado: el registro «extra») se describe como «hoy», no como «la última vez»
  const today=!!opts.extra&&last===opts.extra,when=today?'hoy':'la última vez';
  // Plan con el que se hizo esa sesión (ps/pr). Si después cambiaron las series o las reps (propuesta del Coach o
  // editor), se juzga con aquel plan y se explica el cambio, en vez de tomarlo por series sin completar.
  const lp=_recPlan(last,ex),lr=_recRange(last,ex);
  const repsChanged=!!lr&&(lr.lo!==lo||lr.hi!==hi);
  const setsUp=lp.s<baseSets&&!(sd>=baseSets);
  // Registro serie a serie (v18): cuentan las series hechas CON el peso de referencia (si bajaste en las últimas,
  // aún no toca subir). Los registros sin series se juzgan como siempre.
  const topN=_recTopSets(last),sdTop=topN!=null&&sd!=null&&topN<sd?topN:null;
  const sdj=sdTop!=null?sdTop:sd;
  const setsOk=sdj==null||!(sdj>=0)||sdj>=Math.min(lp.s,baseSets);
  const sx=sd>0?sd:lp.s; // «3×12»
  const did=r!=null?`${sx}×${r}`:'';
  const rpeT=rc?' '+RPE_TXT[rc]:'';
  const tr=targetRepsNum(ex),scheme=`${baseSets}×${tr!=null?tr:lo+'-'+hi}`; // «4×8» (solo números)
  const P={exId,eq:cls,step,stepSrc:ls.src,lo,hi,sets:Math.max(1,parseInt(ex.s)||baseSets),last:w,lastR:r,lastRpe:rc,lastSets:sd,lastD:last.d||'',lastTs:last.ts||null};
  P.unit='kg';
  // Pesas fijas (kettlebell, discos): el salto puede ser un 25-100 % más. Antes de saltar se suben más reps (hasta hiK) y,
  // tras el salto, se empieza con menos (_kbReps) y se vuelve a subir; los fallos se cuentan por debajo de loE.
  const bigJ=(cls==='kb'||cls==='disco')&&step>w*LOAD_CAP+1e-9;
  const loE=bigJ?Math.max(3,lo-4):lo,hiK=hi+(step<=w*LOAD_MAX+1e-9?2:4);
  if(bigJ){P.hiK=hiK;P.loE=loE;}
  const out=(kind,weight,reps,reason)=>{
    weight=_r2(Math.max(0,weight));
    const head=kind==='up'?`Sube a ${kgTxt(weight)} kg`:kind==='down'?`Baja a ${kgTxt(weight)} kg`
      :kind==='deload'?(deloadAppliesTo(exId)?'Descarga':'Semana de descanso')
      :`Mantén ${kgTxt(weight)} kg${reps?` y busca ${reps} reps`:''}`;
    return Object.assign(P,{kind,weight,reps,reason,head});
  };
  // Semana ligera: descarga de este ejercicio o semana de descanso → nunca sube
  if(!opts.ignoreLight&&isLightNow(exId)){
    const reps=r!=null?Math.min(hi,Math.max(lo,r)):hi;
    // (13d) descarga con menos peso: tus series con un 15 % menos (al salto de tu equipo)
    if(exLT(ex)==='w'&&_dlLoadMode(exId)){const wl=_dlLessKg(w,step);
      if(wl!=null)return Object.assign(out('deload',wl,reps,`−${_dlPctTxt(w,wl)} de peso con tus series: ${kgTxt(wl)} kg en vez de ${kgTxt(w)}; la subida vuelve al terminar`),{dlFrom:w});
      return out('deload',w,reps,`mantén ${kgTxt(w)} kg (un salto menos sería demasiado) y hazlo suave; la subida vuelve al terminar`);}
    return out('deload',w,reps,deloadAppliesTo(exId)?`mantén ${kgTxt(w)} kg ${_dlFewerSets(exId)?'con menos series':'y hazlo suave'}; la subida vuelve al terminar`:`${kgTxt(w)} kg o menos y entrena suave`);
  }
  // (E6) Vuelta tras un parón: sin peso propuesto (más de 6 meses) o un 10-20 % menos, y desde ahí a subir
  if(!today){const g=_presGap(exId);
    if(g&&g.retake)return null;
    if(g&&g.cut){const w2=Math.max(step,Math.round(w*(1-g.cut)/step)*step);
      if(w2<w-1e-9)return out('down',w2,lo,`${g.days>=LOAD_GAP_DAYS?`hace ${plural(Math.max(1,Math.floor(g.days/7)),'semana')} que no lo haces`:'vuelves tras un parón'}: un ${Math.round(g.cut*100)} % menos para volver y desde ahí, a subir`);}}
  // Reps sin apuntar (registros antiguos): mismo peso hasta saber cuántas haces
  if(r==null)return out('keep',w,Math.min(hi,Math.max(lo,targetRepsNum(ex)||hi)),'apunta tus reps al terminar y ajusto el peso');
  // Esquema nuevo (las reps del plan cambiaron después de esa sesión) y lo que hiciste queda fuera del rango nuevo:
  // el peso se adapta, ~2.5 % por rep de diferencia (como mucho un 10 %, al menos un salto).
  //  · Menos reps («pasar a 4×8 con algo más de peso») → sube.
  //  · Más reps («pasar a 3×12 con algo menos de peso») → baja (si fue fácil, una rep menos de margen).
  if(repsChanged&&(r>hi||r<lo)){
    if(r>hi){
      if(step>w*LOAD_MAX+1e-9)return out('keep',w,hi,`nuevo esquema ${scheme}; +${kgTxt(step)} kg sería un ${Math.round(step/w*100)} % más, elige un salto menor en Ajustes`);
      let k=Math.max(1,Math.round(w*Math.min(LOAD_CAP,LOAD_PER_REP*(r-hi))/step));
      while(k>1&&k*step>w*LOAD_CAP+1e-9)k--;
      return out('up',w+k*step,hi,`nuevo esquema ${scheme}, con más peso; ${when} ${did}${rpeT}`);
    }
    let k=Math.round(w*Math.min(LOAD_CAP,LOAD_PER_REP*(lo-r-(rc===1?1:0)))/step);
    if(rc!==1)k=Math.max(1,k);
    while(k>1&&k*step>w*LOAD_CAP+1e-9)k--;
    if(k>0&&w-k*step>0)return out('down',w-k*step,lo,`nuevo esquema ${scheme}, con algo menos de peso; ${when} ${did}${rpeT}`);
    return out('keep',w,lo,`nuevo esquema ${scheme}, con este peso; ${when} ${did}${rpeT}`);
  }
  // Dos sesiones seguidas con este peso claramente por debajo del rango (el de su plan) → bajar un 5-10 % (al menos
  // un salto). Con un esquema nuevo no: aquellas sesiones se hicieron con otro objetivo de reps.
  if(!repsChanged){
    let fails=0;
    for(let i=d.length-1;i>=0&&Math.abs(+d[i].v-w)<0.01;i--){const rg=_recRange(d[i],ex)||rr;if(!_loadFail(d[i],bigJ?loE:rg.lo))break;fails++;}
    if(fails>=2){
      let k=Math.max(1,Math.round(w*LOAD_DOWN/step));
      while(k>1&&k*step>w*LOAD_CAP+1e-9)k--;
      if(w-k*step>0)return out('down',w-k*step,lo,`dos sesiones seguidas por debajo de ${bigJ?loE:lo} reps con ${kgTxt(w)} kg`);
      return out('keep',w,lo,`dos sesiones por debajo de ${lo} reps; prueba una variante más fácil o un peso menor si lo hay`);
    }
  }
  // Series sin completar, contando las que tocaban entonces (si ahora son menos, las de ahora)
  if(!setsOk)return out('keep',w,Math.min(hi,Math.max(lo,r)),sdTop!=null
    ?`haz las ${baseSets} series con ${kgTxt(w)} kg antes de subir; ${when} ${sdTop} de ${sd} con ese peso`
    :`completa las ${baseSets} series antes de subir; ${when} hiciste ${sd}${lp.s!==baseSets?' de '+lp.s:''}`);
  if(bigJ){
    if(r>=hiK){
      if(setsUp)return out('keep',w,hiK,`ahora son ${baseSets} series; complétalas con este peso y luego subes`);
      const limK=rc===3?(_effortObj()==='facil'?'facil':_limCase(d,last,w,r,hiK)):null; // (C1)
      const repsTxt=`${today?'hoy ':''}${did} ${rc?RPE_TXT[rc]:'completas'}${LIM_TXT[limK]||''}`;
      if(limK==='facil')return out('keep',w,hiK,`${today?'hoy ':''}${did} al límite; repítelo hasta que salga «justo» y entonces subes`);
      if(limK==='hold')return out('keep',w,hiK,`${today?'hoy ':''}${did} al límite en todas las series; repítelo una vez más y, si vuelve a salir, subes`);
      const gapD=last.ts?Math.floor((Date.now()-last.ts)/86400000):0;
      if(gapD>=LOAD_GAP_DAYS)return out('keep',w,hiK,`hace ${plural(Math.floor(gapD/7),'semana')} que no lo haces: repite antes de subir`);
      const pct=Math.round(step/w*100);
      if(step>w*KB_MAX+1e-9){
        // Ni con más reps compensa el salto (4 → 8 kg): la versión más difícil, si la hay; si no, una pesa intermedia
        const up=_presVariant(ex,'up');
        if(up){const o=out('harder',w,hiK,`${repsTxt}; +${kgTxt(step)} kg sería un ${pct} % más: la versión más difícil`);return Object.assign(o,{up:up.id,head:`Pasa a ${up.n}`});}
        return out('keep',w,hiK,`+${kgTxt(step)} kg sería un ${pct} % más: usa una pesa intermedia o una variante más difícil`);
      }
      const n=_kbReps(w,r,step,lo,loE),o=out('up',w+step,n,`${repsTxt}; con ${kgTxt(w+step)} kg empieza con ${n} reps y vuelve a subir`);
      o.head+=` y busca ${n} reps`;
      return o;
    }
    if(r>=loE)return out('reps',w,Math.min(hiK,r+(rc===1?2:1)),`${when} ${did}${rpeT}; con pesas fijas, antes de saltar llega a ${hiK} reps`);
    return out('keep',w,Math.min(loE,r+1),`${when} ${did}${rpeT}; rango ${loE}-${hiK}`);
  }
  if(r>=hi){
    // Serie nueva en el plan (Añadir serie / editor): primero todas las series con este peso, luego se sube
    if(setsUp)return out('keep',w,hi,`ahora son ${baseSets} series; complétalas con este peso y luego subes`);
    const eo=_effortObj(),lim=rc===3&&eo!=='facil'?_limCase(d,last,w,r,hi):null; // (C1)
    const repsTxt=`${today?'hoy ':''}${did} ${rc?RPE_TXT[rc]:'completas'}${LIM_TXT[lim]||''}`;
    if(rc===3&&eo==='facil'&&w-step>0)return out('down',w-step,lo,`${today?'hoy ':''}${did} al límite: un salto menos, tu rutina va con margen`);
    if(rc===3&&eo==='facil')return out('keep',w,hi,`${today?'hoy ':''}${did} al límite; repítelo hasta que salga «justo» y entonces subes`);
    if(lim==='hold')return out('keep',w,hi,`${today?'hoy ':''}${did} al límite en todas las series; repítelo una vez más y, si vuelve a salir, subes`);
    if(eo==='facil'&&rc===2)return out('keep',w,hi,`${repsTxt}: tu objetivo es que salga «fácil»; repite con este peso`);
    // (M2b) Prudente y con el esfuerzo apagado en Ajustes: sin saber si te sobraba, el tope dos sesiones seguidas con este peso
    if(eo==='facil'&&!_rpeOn()&&!_topTwice(d,ex,w,hi))return out('keep',w,hi,`${repsTxt}: primera vez en el tope con ${kgTxt(w)} kg; repítelo otra sesión y, si sale igual, subes`);
    if(eo==='facil'&&_upThisWeek(d))return out('keep',w,hi,`${repsTxt}; ya subiste esta semana: como mucho una subida por semana`);
    // Pausa larga: repetir antes de subir
    const gapD=last.ts?Math.floor((Date.now()-last.ts)/86400000):0;
    if(gapD>=LOAD_GAP_DAYS)return out('keep',w,hi,`hace ${plural(Math.floor(gapD/7),'semana')} que no lo haces: repite antes de subir`);
    // Salto: doble si fue fácil (o te sobraron 3+ reps), sin pasar del 10 %
    let k=eo!=='facil'&&rc!==3&&(rc===1||r>=hi+3)?2:1; // (E6) con «fácil» de objetivo, nunca el salto doble; (C1) ni tras una sesión al límite
    while(k>1&&k*step>w*LOAD_CAP+1e-9)k--;
    // Lastre de peso corporal (chaleco, mochila, un disco): el % sobre el lastre no dice nada (de 2.5 a 5 kg es un 100 %
    // más de lastre y muy poco más de carga total): un salto siempre que no pase del lastre que ya llevas (2.5 → 5 → 7.5)
    const bwL=cls==='bw'&&exLT(ex)==='bw';
    if(step>w*LOAD_CAP+1e-9&&!(bwL&&step<=w+1e-9)){
      // Hasta el salto mínimo supera el 10 % (carga ligera): antes, un par de reps por encima del tope.
      // Y un salto de más del 25 % no se propone nunca (8.5 → 11 kg en una polea).
      const pct=Math.round(step/w*100);
      if(r<hi+2)return out('reps',w,r+1,`${repsTxt}; +${kgTxt(step)} kg sería un ${pct} % más, así que antes llega a ${hi+2} reps`);
      if(step>w*LOAD_MAX+1e-9)return out('keep',w,hi+2,`+${kgTxt(step)} kg sería un ${pct} % más; sigue con ${hi+2} reps o ${bwL?'usa un lastre intermedio':'elige un salto menor en Ajustes'}`);
    }
    // (E6) Pesos que no existen: con mancuernas de hasta N kg, nunca «sube a N+2»; la versión más difícil o más repeticiones
    {const mx=_maxLoadOf(ex);if(mx&&w+step>mx+1e-9){const up=_presVariant(ex,'up');
      if(up){const o=out('harder',w,hi,`${repsTxt}; tus mancuernas llegan a ${kgTxt(mx)} kg: la versión más difícil`);return Object.assign(o,{up:up.id,head:`Pasa a ${up.n}`});}
      return out('keep',w,hi+2,`tus mancuernas llegan a ${kgTxt(mx)} kg: sube hasta ${hi+2} repeticiones o haz la bajada más lenta`);}
      while(mx&&k>1&&w+k*step>mx+1e-9)k--;}
    return out('up',w+k*step,lo,`${repsTxt}${k>1?', salto doble':''}`);
  }
  if(r>=lo){
    const eo=_effortObj();
    if(eo==='facil'&&rc===3&&w-step>0)return out('down',w-step,lo,`${when} ${did} al límite: un salto menos, tu rutina va con margen`);
    const nx=Math.min(hi,eo==='facil'?(rc===2||rc===3?r:r+1):r+(rc===1?2:1)); // (E6) con «fácil» de objetivo, +1 como mucho
    return out('reps',w,nx,`${when} ${did}${rpeT}`);
  }
  // Por debajo del rango (aún sin dos fallos seguidos): mismo peso, una rep más
  return out('keep',w,Math.min(lo,r+1),`${when} ${did}${rpeT}; rango ${lo}-${hi}`);
}
// ── Coach sin kilos: peso corporal, «solo reps», por tiempo y por distancia ──
// Rango de reps sin peso: el escrito tal cual («8-12»); un número: 15 o más → [r-3, r], si no [r, r+3] (12 → 12-15)
function _repRangeBW(ex){
  const raw=String(ex&&ex.r!=null?ex.r:'').trim();
  const m=raw.match(/^(\d{1,3})\s*[-–]\s*(\d{1,3})$/);
  if(m&&+m[1]>0&&+m[2]>=+m[1])return{lo:+m[1],hi:+m[2]};
  const r=targetRepsNum(ex);
  if(r==null)return null;
  return r>=15?{lo:r-3,hi:r}:{lo:r,hi:r+3};
}
// La variante más difícil (up) o más fácil (dn) de su ejercicio de la biblioteca, si existe y no está ya en tu rutina
function _presVariant(ex,k){
  const L=exLib(ex);if(!L)return null;
  const id=k==='up'?L.up:LIB_DOWN[L.id];if(!id)return null;
  const v=LIB_BY_ID.get(id);
  // (E3c) con tus sitios, solo una variante que puedas hacer ahí (sin ellos, como siempre: no se miraba el sitio)
  return v&&!v.cardio&&!_planLibIds().has(id)&&(!_isPlainObj(S.places)||canDoHere(v,_dayOfEx(ex.id)||S.day))?v:null;
}
// Lo común de una prescripción sin kilos (los mismos campos que la de kg, más su tipo y su unidad)
function _presBase(exId,ex,lt,last,lo,hi,unit){
  const cls=loadEqClass(ex),ls=loadStepFor(ex,cls),baseSets=_baseSets(ex);
  const sd=last.setsDone==null||last.setsDone===''?null:parseInt(last.setsDone),lp=_recPlan(last,ex);
  return{P:{exId,eq:cls,step:ls.step,stepSrc:ls.src,lo,hi,sets:Math.max(1,parseInt(ex.s)||baseSets),last:+last.v>0?+last.v:0,lastR:_recReps(last),
      lastRpe:rpeCat(last.rpe),lastSets:sd,lastD:last.d||'',lastTs:last.ts||null,lt,unit,weight:0,reps:null,t:null,m:null,up:null,dn:null,band:false,lastre:false,held:false},
    sd,baseSets,lp,setsUp:lp.s<baseSets&&!(sd>=baseSets),setsOk:sd==null||!(sd>=0)||sd>=Math.min(lp.s,baseSets),
    gap:last.ts?Math.floor((Date.now()-last.ts)/86400000):0,sx:sd>0?sd:lp.s,rc:rpeCat(last.rpe)};
}
// Motivo de una semana ligera sin kilos
function _presLightTxt(exId,unit){
  const w=unit==='s'?'mismo tiempo':unit==='m'?'misma distancia':'mismas reps';
  return deloadAppliesTo(exId)?`${w}${_dlFewerSets(exId)?' con menos series':', más suave'}; la subida vuelve al terminar`:`entrena suave: ${unit==='s'?'menos tiempo':unit==='m'?'menos distancia o menos peso':'menos reps'} o menos series`;
}
// Peso corporal sin lastre y «solo reps» (bandas, TRX…): una rep más cada vez hasta el tope del rango en todas las
// series; entonces lo más difícil que haya (banda más dura → la variante más difícil → lastre, si admite) y vuelta al
// mínimo. Dos sesiones claramente por debajo del rango: la variante más fácil. Solo cuentan las sesiones sin peso
// (las de lastre las lleva el Coach de kg).
function _presReps(exId,ex,lt,all,opts){
  const d=all.filter(r=>!(+r.v>0));if(!d.length)return null;
  const rg=_repRangeBW(ex);if(!rg)return null;
  const last=d[d.length-1],lo=rg.lo,hi=rg.hi,r=_recReps(last),B=_presBase(exId,ex,lt,last,lo,hi,'reps'),P=B.P,rc=B.rc;
  const today=!!opts.extra&&last===opts.extra,when=today?'hoy':'la última vez';
  const did=r!=null?`${B.sx}×${r}`:'',rpeT=rc?' '+RPE_TXT[rc]:'';
  const out=(kind,reps,reason,head,x,stay)=>{
    // Si el objetivo sube (por debajo del rango: 10 → 11) es «+ reps» («Busca 11 reps»), nunca «mantén». El motivo sigue
    // siendo el de repetir (held: la tarjeta final lo dice). Con series sin completar (stay), «mantén»: primero completarlas
    let held=false;if(kind==='keep'&&!stay&&r!=null&&reps>r){kind='reps';held=true;}
    return Object.assign(P,{kind,reps,reason,held,head:head||(kind==='deload'?(deloadAppliesTo(exId)?'Descarga':'Semana de descanso'):kind==='keep'?`Mantén ${reps} reps`:`Busca ${reps} reps`)},x||{});
  };
  if(!opts.ignoreLight&&isLightNow(exId))return out('deload',r!=null?Math.min(hi,Math.max(lo,r)):hi,_presLightTxt(exId,'reps'));
  if(r==null)return out('keep',Math.min(hi,Math.max(lo,targetRepsNum(ex)||lo)),'apunta tus reps al terminar y te digo cuántas buscar');
  const n=d.length;
  // (E6, §G.4) Dominadas: si en la primera sesión no llegas a 8, las asistidas (máquina o banda) o solo la bajada, lenta
  {const L=exLib(ex);if(n===1&&r<8&&L&&L.pat==='pull_v'&&L.lt==='bw'){const dn=_presVariant(ex,'dn');
    if(dn)return out('down',lo,`en la primera sesión hiciste ${r}: mejor asistidas o solo la bajada, lenta, de 3 a 5`,`Prueba ${dn.n}`,{dn:dn.id});
    return out('keep',Math.min(lo,r+1),`en la primera sesión hiciste ${r}: entre series, haz solo la bajada, lenta (3-5 s), hasta llegar a 8`);}}
  // Dos sesiones flojas con el objetivo de ahora: si lo subiste después (editor), aquellas se hicieron con otro y no
  // cuentan (como en el Coach de kg con un esquema nuevo)
  const sameT=k=>{const q=_repRangeBW({r:_recPlan(d[k],ex).r});return !!q&&q.lo===lo&&q.hi===hi;};
  if(n>=2&&sameT(n-1)&&sameT(n-2)&&_loadFail(d[n-1],lo)&&_loadFail(d[n-2],lo)){
    const dn=_presVariant(ex,'dn');
    if(dn)return out('down',lo,`dos sesiones seguidas por debajo de ${lo} reps: la versión más fácil, con buena técnica`,`Prueba ${dn.n}`,{dn:dn.id});
    return out('keep',lo,`dos sesiones por debajo de ${lo} reps; prueba una variante más fácil o descansa más entre series`,`Busca ${lo} reps`);
  }
  if(!B.setsOk){const v=Math.min(hi,Math.max(lo,r));
    return out('keep',v,`completa las ${B.baseSets} series antes de subir; ${when} hiciste ${B.sd}${B.lp.s!==B.baseSets?' de '+B.lp.s:''}`,v>r?`Busca ${v} reps`:'',null,true);}
  if(r>=hi){
    if(B.setsUp)return out('keep',hi,`ahora son ${B.baseSets} series; complétalas y luego subes`);
    {const lim=rc===3?(_effortObj()==='facil'?'facil':_limCase(d,last,0,r,hi)):null; // (C1) también sin kilos
      if(lim==='facil')return out('keep',hi,`${today?'hoy ':''}${did} al límite; repítelo hasta que salga «justo» y entonces subes`);
      if(lim==='hold')return out('keep',hi,`${today?'hoy ':''}${did} al límite en todas las series; repítelo una vez más antes de pasar a algo más difícil`);}
    if(B.gap>=LOAD_GAP_DAYS)return out('keep',hi,`hace ${plural(Math.floor(B.gap/7),'semana')} que no lo haces: repite antes de subir`);
    const done=`${B.sx}×${hi} completas`,L=exLib(ex);
    if(L&&(L.mat==='banda'||L.mat==='minibanda'))return out('harder',lo,`${done}: banda más dura y vuelve a ${lo} reps`,'Usa una banda más dura',{band:true});
    const up=_presVariant(ex,'up');
    if(up)return out('harder',hi,`${done}: la versión más difícil, vuelve a ${fmtTargetReps(up)}`,`Pasa a ${up.n}`,{up:up.id});
    if(lt==='bw'&&P.eq==='bw'&&L&&L.x.includes('L'))return out('harder',lo,`${done}: prueba +${kgTxt(P.step)} kg (chaleco, mochila o un disco) y vuelve a ${lo} reps`,'Añade lastre',{lastre:true,weight:P.step});
    return out('keep',hi,`${done}: suma una serie o cambia de variante`);
  }
  if(r>=lo){const eo=_effortObj();return out('reps',Math.min(hi,eo==='facil'?(rc===2||rc===3?r:r+1):r+(rc===1?2:1)),`${when} ${did}${rpeT}`);}
  return out('keep',Math.min(lo,r+1),`${when} ${did}${rpeT}; rango ${lo}-${hi}`,`Busca ${Math.min(lo,r+1)} reps`);
}
// Por tiempo o por distancia. Sin peso: +5 s (o el salto de metros) por sesión hasta el tope (tiempo: el doble del plan,
// como mucho +60 s; distancia: el doble) en todas las series; entonces la variante más difícil (o lastre, si admite).
// Con peso: por tiempo, al llegar al tope sube un salto y vuelve al tiempo del plan; por distancia, con la distancia del
// plan completa sube un salto. Dos sesiones por debajo del 80 % del plan: con peso baja un salto; sin peso, menos tiempo
// o distancia (o la variante más fácil).
function _presTD(exId,ex,lt,all,opts){
  const x0=lt==='t'?_tgtSecs(ex):_tgtMetres(ex);if(!x0)return null;
  const wm=+all[all.length-1].v>0,d=all.filter(r=>wm?+r.v>0:!(+r.v>0)),last=d[d.length-1];
  const cap=lt==='t'?Math.min(2*x0,x0+60):2*x0,f=lt==='t'?'t':'m',st=lt==='t'?_tStep:_dStep,fmt=lt==='t'?fmtSecs:fmtM;
  const x=_recMetric(last,lt),w=wm?_r2(+last.v):0,B=_presBase(exId,ex,lt,last,x0,cap,lt==='t'?'s':'m'),P=B.P,rc=B.rc;
  const today=!!opts.extra&&last===opts.extra,when=today?'hoy':'la última vez';
  const did=x!=null?`${B.sx}×${fmt(x)}`:'',rpeT=rc?' '+RPE_TXT[rc]:'';
  const set=(kind,v,wt,reason,head,xo)=>{
    wt=_r2(Math.max(0,wt||0));
    // Si los segundos o metros del objetivo suben (25 → 30 m con el mismo peso) es «+ tiempo / + distancia», no «mantén»;
    // el motivo sigue siendo el de repetir (held: la tarjeta final lo dice)
    let held=false;if(kind==='keep'&&x!=null&&v>x){kind='reps';held=true;}
    const o={kind,weight:wt,reps:null,reason,held};o[f]=v;
    o.head=head||(kind==='deload'?(deloadAppliesTo(exId)?'Descarga':'Semana de descanso'):kind==='up'?`Sube a ${kgTxt(wt)} kg`
      :kind==='down'?(wt>0&&wt<w?`Baja a ${kgTxt(wt)} kg`:`Baja a ${fmt(v)}`):kind==='reps'?`${lt==='t'?'Aguanta':'Recorre'} ${fmt(v)}`
      :wt>0?`Mantén ${kgTxt(wt)} kg`:`Mantén ${fmt(v)}`);
    return Object.assign(P,o,xo||{});
  };
  if(!opts.ignoreLight&&isLightNow(exId)){
    const v0=x!=null?Math.min(cap,x):x0;
    // (13d) descarga con menos carga: con kilos, un 15 % menos de peso y el mismo tiempo o distancia; sin kilos, un 15 % menos de tiempo o distancia
    if(_dlLoadMode(exId)){
      if(w>0){const wl=_dlLessKg(w,P.step);
        if(wl!=null)return set('deload',v0,wl,`−${_dlPctTxt(w,wl)} de peso con tus series: ${kgTxt(wl)} kg en vez de ${kgTxt(w)}; la subida vuelve al terminar`,null,{dlFrom:w});}
      else{const vl=_dlLessTD(v0,lt);
        if(vl<v0)return set('deload',vl,0,`−${_dlPctTxt(v0,vl)} de ${lt==='t'?'tiempo':'distancia'} con tus series: ${fmt(vl)} en vez de ${fmt(v0)}; la subida vuelve al terminar`,null,{dlFrom:v0});}
    }
    return set('deload',v0,w,_presLightTxt(exId,P.unit));
  }
  if(x==null)return set('keep',x0,w,lt==='t'?'apunta tus segundos al terminar y te digo cuánto aguantar':'apunta tus metros al terminar y te digo cuánto recorrer');
  const inc=st(x)*(rc===1?2:1),n=d.length,lim=Math.round(0.8*x0);
  // Sesión floja: por debajo del 80 % del objetivo de ahora y hecha con ese mismo objetivo (si lo subiste después en el
  // editor, las de antes se hicieron con otro y no cuentan)
  const x0Of=k=>{const q={r:_recPlan(d[k],ex).r};return lt==='t'?_tgtSecs(q):_tgtMetres(q);};
  const fail=k=>{const v=_recMetric(d[k],lt);return v!=null&&v<0.8*x0&&x0Of(k)===x0;};
  if(n>=2&&fail(n-1)&&fail(n-2)){
    if(wm&&w-P.step>0)return set('down',x0,w-P.step,`dos sesiones seguidas por debajo de ${fmt(lim)} con ${kgTxt(w)} kg`);
    // Sin peso (o ya con el más pequeño): algo menos que el plan, pero como mucho un salto más de lo que hiciste
    // (15 s → 20 s, nunca 25 s); con peso, el mismo peso (un paseo del granjero sin pesas no tiene sentido)
    const dn=_presVariant(ex,'dn'),v=Math.max(st(x0),Math.min(x0-st(x0),x+st(x)));
    if(dn)return set('down',v,0,`dos sesiones seguidas por debajo de ${fmt(lim)}: la versión más fácil, con buena técnica`,`Prueba ${dn.n}`,{dn:dn.id});
    return set('down',v,wm?w:0,`dos sesiones seguidas por debajo de ${fmt(lim)}${wm?' con '+kgTxt(w)+' kg':''}: baja un poco y vuelve a subir`);
  }
  if(!B.setsOk)return set('keep',x,w,`completa las ${B.baseSets} series antes de subir; ${when} hiciste ${B.sd}${B.lp.s!==B.baseSets?' de '+B.lp.s:''}`);
  const limTxt=`${when} ${did} al límite; repítelo hasta que salga «justo»`,gapTxt=`hace ${plural(Math.floor(B.gap/7),'semana')} que no lo haces: repite antes de subir`;
  if(!wm){
    if(x>=cap){
      if(rc===3)return set('keep',x,0,limTxt);
      if(B.gap>=LOAD_GAP_DAYS)return set('keep',x,0,gapTxt); // pausa larga: repite antes de pasar a la variante
      const done=`${B.sx}×${fmt(cap)} completos`,up=_presVariant(ex,'up'),L=exLib(ex);
      if(up)return set('harder',cap,0,`${done}: la versión más difícil, vuelve a ${fmtTargetReps(up)}`,`Pasa a ${up.n}`,{up:up.id});
      if(lt==='t'&&P.eq==='bw'&&L&&L.x.includes('L'))return set('harder',x0,P.step,`${done}: prueba +${kgTxt(P.step)} kg (chaleco, mochila o un disco) y vuelve a ${fmt(x0)}`,'Añade lastre',{lastre:true});
      return set('keep',cap,0,`${done}: suma una serie o cambia de variante`);
    }
    if(rc===3)return set('keep',x,0,limTxt);
    if(B.gap>=LOAD_GAP_DAYS)return set('keep',x,0,gapTxt);
    return set('reps',Math.min(cap,x+inc),0,`${when} ${did}${rpeT}`);
  }
  // Con peso: con pesas fijas, peso corporal con lastre o discos, un salto aunque sea grande (se vuelve al tiempo o
  // distancia del plan); con el resto, como mucho un 25 %
  const jumpOk=['bw','kb','disco'].includes(P.eq)?P.step<=w+1e-9:P.step<=w*LOAD_MAX+1e-9,pct=Math.round(P.step/w*100);
  const bigTxt=`+${kgTxt(P.step)} kg sería un ${pct} % más: suma una serie o elige un salto menor en Ajustes`;
  if(lt==='t'){
    if(rc===3)return set('keep',x,w,limTxt);
    if(B.gap>=LOAD_GAP_DAYS)return set('keep',x,w,gapTxt);
    if(x>=cap)return jumpOk?set('up',x0,w+P.step,`${when} ${did}: ${fmt(cap)} completos; con más peso vuelves a ${fmt(x0)}`):set('keep',cap,w,bigTxt);
    return set('reps',Math.min(cap,x+inc),w,`${when} ${did}${rpeT}`);
  }
  if(x<x0)return set('keep',x0,w,`completa ${fmt(x0)} en todas las series antes de subir; ${when} ${did}`);
  if(rc===3)return set('keep',x0,w,limTxt);
  if(B.gap>=LOAD_GAP_DAYS)return set('keep',x0,w,gapTxt);
  return jumpOk?set('up',x0,w+P.step,`${when} ${did}${rpeT}: distancia completa, sube un salto`):set('keep',x0,w,bigTxt);
}
// ¿Prescripción de kilos (peso × reps)? Las de antes no llevaban unit
function _presIsKg(p){return !p||!p.unit||p.unit==='kg';}
// Valor objetivo en su unidad (reps, segundos o metros) de una prescripción sin kilos
function _presTgtVal(p){return !p?null:p.unit==='reps'?p.reps:p.unit==='s'?p.t:p.unit==='m'?p.m:p.weight;}
// Objetivo en texto: «60 kg × 12» · «13 reps» · «35 s», «10 kg · 45 s» · «25 m», «21 kg · 30 m» · «→ Flexiones declinadas»
function presValTxt(p){
  if(!p)return'';
  const vr=(p.kind==='harder'&&p.up)||(p.kind==='down'&&p.dn)?LIB_BY_ID.get(p.up||p.dn):null;
  if(vr)return'→ '+vr.n;
  if(_presIsKg(p))return`${kgTxt(p.weight)} kg × ${p.reps}`;
  const w=p.weight>0?_kgNB(p.weight):'';
  if(p.unit==='s')return(w?w+NBD:'')+fmtSecs(p.t);
  if(p.unit==='m')return(w?w+NBD:'')+fmtM(p.m);
  return(p.band?'banda más dura · ':'')+(w?`${w} × ${p.reps}`:_repsNB(p.reps));
}
// Para las fichas cortas (cabecera de la tarjeta, HOY TOCA, objetivos de Inicio): una variante, sin su nombre largo; la
// banda más dura, sin las reps
function presShortTxt(p){return p&&((p.kind==='harder'&&p.up)||(p.kind==='down'&&p.dn))?(p.kind==='harder'?'→ más difícil':'→ más fácil'):p&&p.band?'banda más dura':presValTxt(p);}
// Palabra del tipo de objetivo («sube», «+ reps», «+ tiempo», «variante»…)
function presWord(p){return !p?'':p.kind==='reps'&&p.unit==='s'?'+ tiempo':p.kind==='reps'&&p.unit==='m'?'+ distancia':PRES_WORD[p.kind]||'';}
// Lo de hoy de un ejercicio sin kilos en su medida («13 reps», «45 s», «10 kg · 30 m», «10 kg × 12»): cabecera de la tarjeta.
// Todo con espacios duros: la cabecera plegada nunca parte el valor («hoy 10 kg ×» ⏎ «12»)
function _sumMetricTxt(ex,sum){
  const lt=exLT(ex),w=sum.w>0?_kgNB(sum.w):'';
  if(lt==='t'||lt==='d'){const v=lt==='t'?(sum.t>0?fmtSecs(sum.t):''):(sum.m>0?fmtM(sum.m):'');return v?(w?w+NBD:'')+v:w;}
  return sum.r>0?(w?w+NB+'×'+NB+sum.r:_repsNB(sum.r)):w;
}
// Compatibilidad (pruebas y código antiguo): {v, label, cls, light} a partir de coach_prescribe
function sugW(exId){
  const p=coach_prescribe(exId);
  if(!p||!_presIsKg(p))return null; // sin kilos (reps, tiempo, distancia) no hay peso que sugerir
  return{v:p.weight,label:presTagTxt(p,null),cls:p.kind==='up'?'':p.kind==='down'?'down':'keep',light:p.kind==='deload',p};
}
// Texto de la etiqueta junto al peso. typed = peso escrito hoy (o null)
// Sin kilos con peso (lastre, paseo con 20 kg): el peso de la fila (tw) también tiene que ser el del objetivo
function _presWOk(p,tw){return !(p.weight>0)||Math.abs((+tw||0)-p.weight)<0.01;}
function presTagTxt(p,typed,tw){
  if(!p)return'';
  // Sin kilos: typed = lo de la siguiente fila en la unidad del objetivo (reps, segundos o metros)
  if(!_presIsKg(p)){const tg=_presTgtVal(p);return typed>0&&tg>0&&typed===tg&&_presWOk(p,tw)?'✓ objetivo':`Usar ${presValTxt(p)}`;}
  if(typed>0&&Math.abs(typed-p.weight)<0.01)return'✓ objetivo';
  if(typed>0)return`Objetivo ${kgTxt(p.weight)}`;
  return`Usar ${kgTxt(p.weight)} kg`;
}
function presTagCls(p,typed,tw){
  if(!p)return'';
  if(typed>0)return Math.abs(typed-(_presIsKg(p)?p.weight:_presTgtVal(p)))<0.01&&(_presIsKg(p)||_presWOk(p,tw))?'ok':'keep';
  return p.kind==='up'||p.kind==='harder'?'':p.kind==='down'?'down':'keep';
}
// Etiqueta del objetivo («Objetivo 60» / «Usar 60 kg»): las series que faltan vuelven al peso y reps del Coach
function useSug(exId){
  const p=coach_prescribe(exId);
  if(!p)return;
  if(!S.logs[exId])S.logs[exId]={};
  const ex=_dayEx(exId);
  if(ex&&!ex.cardio){
    _setUndone(ex,_presIsKg(p)?r=>({w:p.weight,r:p.reps>0?p.reps:r.r})
      :r=>({w:p.weight>0?p.weight:r.w,r:p.reps>0?p.reps:r.r,t:p.t>0?p.t:r.t,d:p.m>0?p.m:r.d}));
    _syncSetLog(ex);saveState();
    if(_openCard(exId))_refreshSets(ex);else render();
    return;
  }
  S.logs[exId].w=String(p.weight);
  saveState();render();
}

// ── Coach de carga: piezas de la interfaz ──
const PRES_WORD={up:'sube',reps:'+ reps',keep:'mantén',down:'baja',deload:'suave',harder:'variante'};
const PRES_IC={up:'↑',reps:'+',keep:'=',down:'↓',deload:'🧘',harder:'⇧'};
// (13e) Objetivo «suave» por la semana de descanso (no por una descarga): 🌴 y menta, como su aviso
function _presRest(p){return!!(p&&p.kind==='deload'&&getActiveRest()&&!(p.exId&&deloadAppliesTo(p.exId)));}
function presIc(p){return _presRest(p)?'🌴':PRES_IC[p.kind];}
function presKCls(p){return _presRest(p)?'k-deload k-rest':'k-'+p.kind;}
const _tgtWhyOpen=new Set(); // «¿Por qué?» abiertos (solo en memoria: no es estado de la app)
// Bloque «Objetivo de hoy» de la tarjeta abierta: peso × reps, series, motivo y «¿Por qué?» desplegable
function presTargetHtml(ex,p,compact){
  if(ex&&!p&&_presRetake(ex.id))return`<div class="tgt k-keep"><div class="tgt-top"><div class="tgt-main"><div class="tgt-r">${ic('target')} <b>Primera vez tras el parón:</b> elige un peso con el que te sobren unas 3 repeticiones. Lo de antes sigue en tu gráfico.</div></div></div></div>`; // (E6)
  if(!ex||!p)return'';
  const open=_tgtWhyOpen.has(ex.id);
  // Compacto (durante el ejercicio, debajo de las series): solo el motivo y «¿Por qué?» (las filas ya llevan los valores)
  if(compact)return`<div class="tgt cmp ${presKCls(p)}">
    <div class="tgt-top">
      <div class="tgt-main"><div class="tgt-r">${ic('target')} <b>${_nwUnits(esc(p.head))}:</b> ${_nwUnits(esc(p.reason))}</div></div>
      <button type="button" class="tgt-why-btn" data-ex="${esc(ex.id)}" aria-expanded="${open}" onclick="toggleTgtWhy(this)">¿Por qué? <span aria-hidden="true">${open?'▴':'▾'}</span></button>
    </div>
    <div class="tgt-why"${open?'':' hidden'}>${presWhyHtml(ex,p)}</div>
  </div>`;
  return`<div class="tgt ${presKCls(p)}">
    <div class="tgt-top">
      <div class="tgt-main"><div class="tgt-l sepw"><span class="sepw-a">${ic('target')} Objetivo de hoy</span> <span class="nw sepw-s"><i class="sep">· </i>${esc(plural(p.sets,'serie'))}</span></div>
        <div class="tgt-v${p.up||p.dn||p.band?' var':''}">${_nwX(esc(presValTxt(p)))}</div></div>
      <button type="button" class="tgt-why-btn" data-ex="${esc(ex.id)}" aria-expanded="${open}" onclick="toggleTgtWhy(this)">¿Por qué? <span aria-hidden="true">${open?'▴':'▾'}</span></button>
    </div>
    <div class="tgt-r"><b>${_nwUnits(esc(p.head))}:</b> ${_nwUnits(esc(p.reason))}</div>${_presVarBtn(ex,p)}
    <div class="tgt-why"${open?'':' hidden'}>${presWhyHtml(ex,p)}</div>
  </div>`;
}
// «Cambiar a … ›»: el objetivo es otra variante (más difícil al completar el rango, o más fácil tras dos sesiones flojas)
function _presVarBtn(ex,p){
  const id=p&&(p.kind==='harder'?p.up:p.kind==='down'?p.dn:null),L=id?LIB_BY_ID.get(id):null;
  return L?`<button type="button" class="tgt-set tgt-var" data-ex="${esc(ex.id)}" onclick="${p.kind==='harder'?'applyHarder':'applyEasier'}(this.dataset.ex)">Cambiar a ${esc(L.n)} ›</button>`:'';
}
// Cambia en la rutina el ejercicio por su variante más difícil (o más fácil): con sus series y el objetivo de la variante
// (sus reps o su tiempo), sin preguntar por el historial (el anterior conserva el suyo). Nunca con series marcadas hoy.
function applyHarder(exId){_applyVariant(exId,'up');}
function applyEasier(exId){_applyVariant(exId,'dn');}
function _applyVariant(exId,k){
  const p=coach_prescribe(exId),id=p&&(k==='up'?p.up:p.dn),L=id?LIB_BY_ID.get(id):null;
  const dk=_dayOfEx(exId),day=dk?getPlan()[dk]:null,slot=day&&Array.isArray(day.ex)?day.ex.find(e=>e.id===exId):null;
  if(!L||!slot){toast('Ese cambio ya no se puede hacer');return;}
  if(slot.sub){toast('Hoy lo tienes cambiado «solo hoy»: hazlo cuando guardes el entreno');return;}
  if(S.sets[exId]&&Object.values(S.sets[exId]).some(Boolean)){toast('Termina primero las series de hoy');return;}
  const ex=routineEx(slot);
  confirmModal({title:`Cambiar a ${L.n}`,
    body:`${ex.n} pasa a ${L.n} (${_nSeries(_baseSets(ex))} × ${fmtTargetReps(L)}) en tu ${day.label}. ${_histStaysTxt(ex)}`,
    okText:'Cambiar',cancelText:'Cancelar',
    onOk:()=>_routineSwapTo(dk,slot,L,{keepToday:false,noHist:true,noCarryR:true})});
}
function toggleTgtWhy(btn){
  const id=btn&&btn.dataset.ex,box=btn&&btn.closest('.tgt'),why=box&&box.querySelector('.tgt-why');
  if(!id||!why)return;
  const open=why.hidden;
  why.hidden=!open;
  if(open)_tgtWhyOpen.add(id);else _tgtWhyOpen.delete(id);
  btn.setAttribute('aria-expanded',String(open));
  const ar=btn.querySelector('span');if(ar)ar.textContent=open?'▴':'▾';
  // (16) al desplegarlo, el «¿Por qué?» entero a la vista (por encima de la barra «siguiente serie»), si cabe
  if(open&&box.closest('#screen'))_revealSpan(document.getElementById('screen'),box,box);
}
// «¿Por qué?»: tus 5 últimas sesiones (peso, reps y esfuerzo) + la regla que aplica
const RPE_COL={1:'var(--green)',2:'var(--amber)',3:'var(--red)'};
const TGT_LEG_RPE='<div class="tgt-leg"><span><i style="background:var(--green)"></i>fácil</span><span><i style="background:var(--amber)"></i>justo</span><span><i style="background:var(--red)"></i>al límite</span></div>';
function presWhyHtml(ex,p){
  if(!_presIsKg(p))return _presWhyNoKg(ex,p);
  const recs=(Array.isArray(S.strength[ex.id])?S.strength[ex.id]:[]).filter(r=>r&&+r.v>0&&!r.dl).slice(-5);
  let svg='';
  if(recs.length){
    const n=recs.length,W=300,vs=recs.map(r=>+r.v),mn=Math.min(...vs),mx=Math.max(...vs);
    const X=i=>n===1?W/2:24+i*((W-48)/(n-1)),Y=v=>mx===mn?24:36-((v-mn)/(mx-mn))*24;
    const pts=recs.map((r,i)=>`${X(i).toFixed(1)},${Y(+r.v).toFixed(1)}`).join(' ');
    svg=`<svg class="tgt-spark" viewBox="0 0 ${W} 64" role="img" aria-label="Últimas ${n} sesiones">
      ${n>1?`<polyline points="${pts}" fill="none" stroke="color-mix(in srgb,var(--text) 18%,transparent)" stroke-width="1.5"/>`:''}
      ${recs.map((r,i)=>{const c=RPE_COL[rpeCat(r.rpe)]||'var(--text3)',rr=_recReps(r);
        return`<circle cx="${X(i).toFixed(1)}" cy="${Y(+r.v).toFixed(1)}" r="4.5" fill="${c}"/>
        <text x="${X(i).toFixed(1)}" y="54" text-anchor="middle" class="tgt-sp-t">${esc(kgTxt(r.v))}${rr?'×'+rr:''}</text>`;}).join('')}
    </svg>`;
  }
  const st=kgTxt(p.step);
  const src=p.stepSrc==='ajuste'?`+${st} kg (lo elegiste en Ajustes)`:p.stepSrc==='historial'?`+${st} kg, el que sueles usar aquí`:`+${st} kg (${(LOAD_EQ[p.eq]||{l:'tu equipo'}).l.toLowerCase()})`;
  const on=_rpeOn(); // (M2) sin la leyenda ni las reglas del esfuerzo
  return`${svg}${on?TGT_LEG_RPE:''}
    <ul class="tgt-rules">
      <li>Rango <b>${p.lo}-${p.hi} reps</b>: mismo peso y una rep más cada vez. Al hacer ${p.hi} en todas las series, sube un salto y vuelve a ${p.lo}.</li>
      <li>Salto: <b>${esc(src)}</b>. Sube como mucho un 10 % (doble si ${on?'fue fácil':'te sobran 3 reps o más'}). Con pesos ligeros, antes suma 2 reps y luego da el salto mínimo.</li>
      ${!on&&_effortObj()==='facil'?`<li>Tu rutina va con margen: subes solo tras llegar a ${p.hi} reps en todas las series dos sesiones seguidas con el mismo peso.</li>`:''}
      <li>${on?(_effortObj()==='facil'?'«Al límite» no sube peso: un salto menos. ':'Si todas las series salen «al límite» y sin repeticiones de sobra, repite una vez antes de subir. '):''}Dos sesiones seguidas por debajo de ${p.lo} reps: baja un 5-10 %, al menos un salto.</li>${p.hiK?`
      <li>Pesas fijas: +${esc(st)} kg es un ${Math.round(p.step/Math.max(1,p.last)*100)} %. Antes de saltar llegas a ${p.hiK} reps; tras el salto empiezas con menos reps y vuelves a subir.</li>`:''}
    </ul>
    ${LOAD_EQ[p.eq]&&p.weight>0?'<button type="button" class="tgt-set" onclick="openLoadSettings()">Cambiar saltos de peso ›</button>':''}`;
}
// «¿Por qué?» de un objetivo sin kilos: tus 5 últimas sesiones (su medida y esfuerzo) y la regla
function _presWhyNoKg(ex,p){
  const lt=p.lt,wm=p.last>0,recs=(Array.isArray(S.strength[ex.id])?S.strength[ex.id]:[]).filter(r=>r&&!r.dl&&(wm?+r.v>0:!(+r.v>0))&&_recMetric(r,lt)!=null).slice(-5);
  let svg='';
  if(recs.length){
    const n=recs.length,W=300,vs=recs.map(r=>_recMetric(r,lt)),mn=Math.min(...vs),mx=Math.max(...vs);
    const X=i=>n===1?W/2:24+i*((W-48)/(n-1)),Y=v=>mx===mn?24:36-((v-mn)/(mx-mn))*24,u=lt==='t'?'s':lt==='d'?'m':'';
    const pts=recs.map((r,i)=>`${X(i).toFixed(1)},${Y(vs[i]).toFixed(1)}`).join(' ');
    svg=`<svg class="tgt-spark" viewBox="0 0 ${W} 64" role="img" aria-label="Últimas ${n} sesiones">
      ${n>1?`<polyline points="${pts}" fill="none" stroke="color-mix(in srgb,var(--text) 18%,transparent)" stroke-width="1.5"/>`:''}
      ${recs.map((r,i)=>{const c=RPE_COL[rpeCat(r.rpe)]||'var(--text3)';
        return`<circle cx="${X(i).toFixed(1)}" cy="${Y(vs[i]).toFixed(1)}" r="4.5" fill="${c}"/>
        <text x="${X(i).toFixed(1)}" y="54" text-anchor="middle" class="tgt-sp-t">${wm?esc(kgTxt(r.v))+'·':''}${vs[i]}${u}</text>`;}).join('')}
    </svg>`;
  }
  const rule=lt==='t'?`Suma 5 s por sesión hasta <b>${esc(fmtSecs(p.hi))}</b> en todas las series; después, la variante más difícil${wm?' (con peso: sube un salto y vuelve a '+esc(fmtSecs(p.lo))+')':''}.`
    :lt==='d'?`Suma distancia hasta <b>${esc(fmtM(p.hi))}</b>; con peso, completa ${esc(fmtM(p.lo))} en todas las series y sube un salto.`
    :`Rango <b>${p.lo}-${p.hi} reps</b>: una rep más cada vez. Con ${p.hi} en todas las series, pasas a la variante más difícil (o banda más dura / lastre) y vuelves a ${p.lo}.`;
  const on=_rpeOn();
  return`${svg}${on?TGT_LEG_RPE:''}
    <ul class="tgt-rules">
      <li>${rule}</li>
      <li>${on?(_effortObj()==='facil'?'Al límite no sube. ':'Con todas las series al límite, repite una vez antes de subir. '):''}Dos sesiones claramente por debajo: variante más fácil.</li>
    </ul>
    ${LOAD_EQ[p.eq]&&p.weight>0?'<button type="button" class="tgt-set" onclick="openLoadSettings()">Cambiar saltos de peso ›</button>':''}`;
}
// Ajuste en vivo entre series: tras una serie «al límite», mantener o bajar; si todo va «fácil», probar un salto más
function liveAdjHtml(ex,p){
  if(!ex||!p||p.kind==='deload'||!_rpeOn())return''; // (M2) sin esfuerzo no hay ajuste en vivo
  const n=parseInt(ex.s)||0,c=S.sets[ex.id]||{},rp=(S.rpe&&S.rpe[ex.id])||{};
  const marked=[];for(let i=0;i<n;i++)if(c[i])marked.push(i);
  if(!marked.length||marked.length>=n)return'';
  if(!_presIsKg(p)){
    if(rp[marked[marked.length-1]]===3)return`<div class="live-adj lim"><span>${ic('e3')} Serie al límite: repite lo mismo (o un poco menos) y cuida la técnica.</span></div>`;
    if(marked.every(i=>rp[i]===1))return`<div class="live-adj easy"><span>${ic('e1')} Te sobra: intenta ${p.unit==='reps'?'1-2 reps':p.unit==='s'?'5 s':'5 m'} más en la siguiente serie.</span></div>`;
    return'';
  }
  // Peso de la SIGUIENTE serie (fila prerrellenada o tocada); sin él, el objetivo
  const rows=setRows(ex,p),nx=rows.find(r=>!r.done),w=nx&&nx.w>0?nx.w:p.weight,eid=esc(ex.id);
  const lastR=rp[marked[marked.length-1]];
  if(lastR===3){
    const dn=_r2(w-p.step),canDown=dn>0&&w>p.weight-p.step+0.01; // no encadenar bajadas
    return`<div class="live-adj lim"><span>${ic('e3')} Serie al límite: mantén ${esc(kgTxt(w))} kg${canDown?` o baja a ${esc(kgTxt(dn))} kg si no llegas a ${p.lo} reps`:' y cuida la técnica'}.</span>${canDown?`<button type="button" class="live-adj-btn" data-ex="${eid}" onclick="liveSetWeight(this.dataset.ex,${dn})">Bajar a ${esc(kgTxt(dn))}</button>`:''}</div>`;
  }
  if(p.kind!=='down'&&marked.every(i=>rp[i]===1)&&w<=p.weight+0.01){
    const lastDone=rows[marked[marked.length-1]],reps=lastDone&&lastDone.r>0?lastDone.r:_todayReps(ex,p);
    if(p.step>w*LOAD_CAP+1e-9)return`<div class="live-adj easy"><span>${ic('e1')} Te sobra: haz 1-2 reps más en la siguiente serie.</span></div>`;
    const up=_r2(w+p.step);
    return`<div class="live-adj easy"><span>${ic('e1')} Te sobra: si hiciste ${reps?reps+' reps':'tus reps'}, prueba ${esc(kgTxt(up))} kg en la siguiente serie.</span><button type="button" class="live-adj-btn" data-ex="${eid}" onclick="liveSetWeight(this.dataset.ex,${up})">Poner ${esc(kgTxt(up))}</button></div>`;
  }
  return'';
}
// «Bajar a X» / «Poner X»: las series que faltan pasan a ese peso (las hechas no cambian)
function liveSetWeight(exId,v){
  v=_r2(+v);
  if(!exId||!(v>0)||v>=1000)return;
  const ex=_dayEx(exId);
  if(!S.logs[exId])S.logs[exId]={};
  if(ex&&!ex.cardio){_setUndone(ex,r=>({w:v,r:r.r}));_syncSetLog(ex);}
  else S.logs[exId].w=String(v);
  saveState();render();
  toast(`Siguientes series con ${kgTxt(v)} kg`);
}
// Una serie en texto: «57.5×12», «12 reps», «45 s», «30 m», con peso «10 kg · 45 s» («—» si no tiene nada)
function _setTxt(s){
  const w=_setNumW(s.w),r=_setNumR(s.r),t=_setNumT(s.t),d=_setNumD(s.d);
  if(t!=null||d!=null){const v=t!=null?fmtSecs(t):fmtM(d);return w!=null?_kgNB(w)+NBD+v:v;}
  return w!=null?kgTxt(w)+(r!=null?'×'+r:' kg'):(r!=null?r+' reps':'—');
}
// Separador entre series distintas: « · »; si alguna lleva peso y segundos o metros (ya tiene «·» dentro: «20 kg · 30 m»),
// « / », para que se vea dónde acaba cada serie («20 kg · 30 m / 20 kg · 25 m»)
function _setsSep(list){return list.some(x=>x&&_setNumW(x.w)!=null&&(_setNumT(x.t)!=null||_setNumD(x.d)!=null))?' / ':' · ';}
// Lo hecho en una línea: «57.5×12 · 57.5×11 · 55×12»; si todas son iguales, «3 series · 57.5 kg × 12» («3 series · 45 s»)
function _setsLine(sets){
  const ok=(Array.isArray(sets)?sets:[]).filter(s=>s&&typeof s==='object');
  if(!ok.length)return'';
  const all=ok.map(_setTxt);
  if(ok.length>1&&all.every(x=>x===all[0])){
    const w=_setNumW(ok[0].w),r=_setNumR(ok[0].r),td=_setNumT(ok[0].t)!=null||_setNumD(ok[0].d)!=null;
    return`${ok.length} series · `+(w!=null&&!td?`${kgTxt(w)} kg${r!=null?' × '+r:''}`:all[0]);
  }
  return all.join(_setsSep(ok));
}
// Prescripción de la PRÓXIMA sesión con lo hecho hoy (la misma cuenta que la tarjeta de resultado), o null
function _nextPres(ex){
  if(!ex||ex.cardio)return null;
  const done=countSetsDone(ex.id,ex.s);if(!done)return null;
  const sm=setsSummary(ex),lt=exLT(ex),w=sm.w||_setNumW((S.logs[ex.id]||{}).w);
  if(!w&&(lt==='w'||lt==='c'||(lt==='t'&&!(sm.t>0))||(lt==='d'&&!(sm.m>0))))return null;
  const r=lt==='t'||lt==='d'?sm.r:(sm.r||_todayReps(ex));
  const extra={v:w||0,r:r>0?r:null,setsDone:done,rpe:_liveRpeAvg(ex.id),ts:Date.now(),ps:_baseSets(ex),pr:ex.r,sets:sm.sets};
  if(lt!=='w'){extra.lt=lt;if(sm.t>0)extra.t=sm.t;if(sm.m>0)extra.m=sm.m;}
  return coach_prescribe(ex.id,{ex,ignoreLight:true,extra});
}
// Objetivos de un día del plan: [{ex, p}] de los ejercicios de fuerza con historial
function dayTargets(dk){
  const day=getPlan()[dk];
  if(!day||!Array.isArray(day.ex))return[];
  return day.ex.filter(e=>e&&!e.cardio).map(ex=>({ex,p:coach_prescribe(ex.id)})).filter(x=>x.p);
}
// Lista de objetivos: 'dash' (compacta, en «Próxima sesión» de Inicio) o 'coach' (con el motivo de cada uno)
function dayTargetsHtml(dk,mode){
  const t=dayTargets(dk);
  if(!t.length)return'';
  const rows=t.map(({ex,p})=>`<div class="tgl-row">
      <span class="tgl-ic ${presKCls(p)}" role="img" aria-label="${esc(presWord(p))}">${icE(presIc(p))}</span>
      <span class="tgl-n">${esc(ex.n)}${mode==='coach'?`<small>${_nwUnits(esc(p.head))}: ${_nwUnits(esc(p.reason))}</small>`:''}</span>
      <span class="tgl-v">${esc(presShortTxt(p))}</span></div>`).join('');
  // Con algún objetivo que no es de kilos («13 reps», «45 s»), «Objetivos de hoy»; si todos lo son, «Objetivos de carga»
  return`<div class="tgl${mode==='coach'?' full':''}">${mode==='dash'?`<div class="tgl-h">${ic('target')} ${t.some(x=>!_presIsKg(x.p))?'Objetivos de hoy':'Objetivos de carga'}</div>`:''}${rows}</div>`;
}
// Día para «Tu próxima sesión» del Coach: el entreno a medias si lo hay; si no, el que toca
function _coachPlanDay(){const aw=getActiveWorkout();return aw?aw.day:hoyDayKey();} // (E1b) el que toca de verdad
function coachPlanCardHtml(){
  const dk=_coachPlanDay(),day=getPlan()[dk];
  const list=day?dayTargetsHtml(dk,'coach'):'';
  if(!list)return'';
  const aw=getActiveWorkout();
  return`<div class="sh">${ic('target')} ${aw?'Tu entreno de hoy':'Tu próxima sesión'} · ${esc(day.label)}</div>
  <div class="card coach-plan">${list}
    <div class="coach-plan-f">Doble progresión: primero reps, luego peso.${_rpeOn()?' Con tu esfuerzo (fácil, justo o al límite) ajusto el salto.':''}</div>
    <button class="btn bs" onclick="${aw?'resumeWorkout()':"S.day=S.nextDay;go('workout')"}">${aw?'Seguir entrenando':'Ir a entrenar'} ${esc(day.label)} →</button>
  </div>`;
}
// ── Ajustes → Coach de carga: salto de peso por tipo de equipo ──
// En Ajustes es una sola fila («Saltos de peso») que abre su hoja; dentro, cada equipo con su valor a la derecha y, al tocarlo, sus
// opciones en un selector de la app (antes eran siete desplegables del sistema en mitad de Ajustes).
function _lsVal(k){const v=(S.loadSteps||{})[k];return v===undefined||v==='auto'?null:+v;} // null = automático
function _lsTxt(v){return v==null?'Auto':'+'+kgTxt(v)+NB+'kg';}
function loadStepsRowHtml(){
  const n=Object.keys(LOAD_EQ).filter(k=>_lsVal(k)!=null).length;
  return`<div class="sh" id="set-load">Coach de carga</div>
  <div class="set-section">
    <div class="set-row" id="set-ls" role="button" tabindex="0" aria-haspopup="dialog" onclick="openLoadSheet()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openLoadSheet();}">
      <div class="set-row-info"><div class="set-row-t">Saltos de peso</div><div class="set-row-d">Cuánto sube cada equipo cuando toca subir</div></div>
      <span class="set-row-v">${n?`${n} a tu medida`:'Auto'}</span><span class="set-row-arrow" aria-hidden="true">›</span>
    </div>
  </div>`;
}
function _lsRowsHtml(){
  return Object.keys(LOAD_EQ).map(k=>{const q=LOAD_EQ[k],v=_lsVal(k);
    return`<div class="set-row ls-row" role="button" tabindex="0" aria-haspopup="dialog" data-k="${k}" onclick="openLoadStep(this.dataset.k)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openLoadStep(this.dataset.k);}" aria-label="Salto de peso de ${esc(q.l)}: ${v==null?'automático':'más '+kgTxt(v)+' kilos'}. Cambiar">
      <div class="set-row-info"><div class="set-row-t">${esc(q.l)}</div><div class="set-row-d">${_nwUnits(esc(q.d))}</div></div>
      <span class="set-row-v ls-v${v==null?'':' on'}">${_lsTxt(v)}</span><span class="set-row-arrow" aria-hidden="true">›</span></div>`;}).join('');
}
// La hoja de los saltos de peso (encima de Ajustes, o sola si se llega desde el objetivo de un ejercicio)
function _lsSheetOpen(){return!!document.querySelector('#ls-root .hist-sheet');}
function openLoadSheet(focusK){
  const root=document.getElementById('ls-root');if(!root)return;
  root.innerHTML=`<div class="hist-over" onclick="if(event.target===this)closeLoadSheet()"><div class="hist-sheet" id="ls-sheet" role="dialog" aria-modal="true" aria-labelledby="ls-t" tabindex="-1" style="max-height:90vh;max-height:90dvh">
    <div class="hist-sheet-head"><div class="hist-sheet-hdl"></div><div class="hist-sheet-title" id="ls-t">Saltos de peso</div><div class="hist-sheet-sub">Cuánto sube cada equipo cuando toca subir</div>
      <button type="button" class="hist-sheet-close" onclick="closeLoadSheet()" aria-label="Cerrar">✕</button></div>
    <div class="hist-sheet-body"><div class="set-section ls-sec">${_lsRowsHtml()}
      <div class="ls-note">Auto: el salto que ya usas en cada ejercicio. Si aún no has subido, el habitual de su equipo (<span class="nw">+2.5 kg</span> en barra, máquinas y discos, <span class="nw">+1 kg</span> en mancuernas y polea, <span class="nw">+4 kg</span> en kettlebell). Sube como mucho un 10 %; con pesos ligeros o pesas fijas (kettlebell, discos), antes suma <span class="nw">2 reps</span> y luego da el salto mínimo de tu equipo.</div></div></div></div></div>`;
  const el=(focusK&&root.querySelector('.ls-row[data-k="'+focusK+'"]'))||document.getElementById('ls-sheet');
  if(el)try{el.focus({preventScroll:true});}catch(e){}
}
function closeLoadSheet(){
  const root=document.getElementById('ls-root');if(!root||!_lsSheetOpen())return;
  root.innerHTML='';
  const b=document.getElementById('set-ls');if(b)try{b.focus({preventScroll:true});}catch(e){}
}
// El selector de un equipo: «Auto» y sus saltos. Elegir guarda al momento y vuelve a la hoja, con el foco en su fila
function openLoadStep(k){
  const q=LOAD_EQ[k],root=document.getElementById('cmodal-root');if(!q||!root)return;
  const cur=_lsVal(k),opt=v=>`<button type="button" class="ls-opt${cur===v?' on':''}" role="radio" aria-checked="${cur===v}" data-k="${k}" data-v="${v==null?'auto':v}" onclick="pickLoadStep(this.dataset.k,this.dataset.v)">${_lsTxt(v)}</button>`;
  root.innerHTML=`<div class="cmov" onclick="if(event.target===this)closeLoadStep()"><div class="cmod ls-pick" role="dialog" aria-modal="true" aria-labelledby="lsp-t" tabindex="-1" data-k="${k}">
    <div class="cmod-hdl"></div>
    <div class="cmod-t" id="lsp-t">${esc(q.l)}</div>
    <div class="cmod-b">${_nwUnits(esc(q.d))}. Elige cuánto sube cuando toca subir.</div>
    <div class="ls-opts" role="radiogroup" aria-labelledby="lsp-t">${opt(null)}${q.opts.map(opt).join('')}</div>
    <div class="cmod-btns"><button type="button" class="btn bs" onclick="closeLoadStep()">Cerrar</button></div>
  </div></div>`;
  const el=root.querySelector('.ls-opt.on')||root.querySelector('.ls-pick');if(el)try{el.focus({preventScroll:true});}catch(e){}
}
function closeLoadStep(){
  const root=document.getElementById('cmodal-root'),d=root&&root.querySelector('.ls-pick');if(!d)return;
  const k=d.dataset.k;root.innerHTML='';
  const b=document.querySelector('#ls-root .ls-row[data-k="'+k+'"]');if(b)try{b.focus({preventScroll:true});}catch(e){}
}
function pickLoadStep(k,v){
  if(!LOAD_EQ[k])return;
  setLoadStep(k,v);
  const root=document.getElementById('cmodal-root');if(root&&root.querySelector('.ls-pick'))root.innerHTML='';
  if(_lsSheetOpen())openLoadSheet(k);
}
function setLoadStep(k,v){
  if(!LOAD_EQ[k])return;
  const nv=v==='auto'?'auto':+v;
  if(nv!=='auto'&&!LOAD_EQ[k].opts.includes(nv))return;
  S.loadSteps=_sanitizeLoadSteps(Object.assign({},S.loadSteps,{[k]:nv}));
  saveState();
  // Repintar la app (objetivos nuevos) sin perder la posición de la hoja de Ajustes
  const sh=document.querySelector('#settings-root .hist-sheet'),sc=sh?sh.scrollTop:0;
  render();
  const sh2=document.querySelector('#settings-root .hist-sheet');if(sh2)sh2.scrollTop=sc;
  toast(nv==='auto'?`${LOAD_EQ[k].l}: salto automático`:`${LOAD_EQ[k].l}: +${kgTxt(nv)} kg`);
}
function openLoadSettings(){openLoadSheet();}

