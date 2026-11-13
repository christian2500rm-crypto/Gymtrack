// ═══════════════════════════════════════════════════════════
// COACH IA — Motor de análisis rule-based
// ═══════════════════════════════════════════════════════════

const CYCLE_WEEKS = 4; // Ciclo de análisis profundo cada 4 semanas
const CYCLE_MIN_SESSIONS = 6; // Mínimo 6 sesiones para primer informe

// ─── 1. CALCULADORES DE MÉTRICAS ─────────────────────────

function coach_daysSince(ts){
  if(!ts)return 0;
  return Math.floor((Date.now()-ts)/86400000);
}

function coach_cycleStart(){
  // Último informe o inicio del coach
  let t;
  if(S.mesocycles&&S.mesocycles.length>0)t=S.mesocycles[S.mesocycles.length-1].appliedAt||S.coachStart;
  else t=S.coachStart||(S.sessions[0]?.ts)||Date.now();
  // (E5, §G.5) con una rutina generada, el ciclo empieza como pronto con ella
  const pt=_isPlainObj(S.planMeta)?+S.planMeta.ts:0;
  return pt>0&&!(pt<=t)?pt:t;
}

// Ciclo actual. La semana mostrada nunca pasa de CYCLE_WEEKS: un ciclo que se alarga queda «vencido»
// (overdue) y se pide cerrarlo. Un ciclo recién empezado (tras cerrar otro) es «fresh»: estado neutro, sin nota.
function coach_cycleData(){
  const start=coach_cycleStart();
  const sessions=S.sessions.filter(s=>s.ts>=start);
  const days=coach_daysSince(start);
  const weeks=Math.max(0,(Date.now()-start)/(7*86400000));
  const cycleProgress=Math.min(1,weeks/CYCLE_WEEKS);
  const weekNum=Math.min(CYCLE_WEEKS,Math.max(1,Math.ceil(weeks)));
  const overdue=weeks>CYCLE_WEEKS;
  const fresh=(S.mesocycles||[]).length>0&&weeks<1;
  const readyForReview=weeks>=CYCLE_WEEKS*0.85&&(sessions.length>=CYCLE_MIN_SESSIONS||(overdue&&sessions.length>=3));
  return{start,sessions,days,weeks,cycleProgress,weekNum,overdue,fresh,readyForReview};
}

// ─── DETECTOR DE PROGRESO: 1RM estimado (Epley) + doble progresión ───
// Mira las últimas PROG_WINDOW sesiones reales del ejercicio (sin descargas ni semanas de descanso) y no
// depende del ciclo: cerrar un ciclo no borra lo que sabes de cada ejercicio.
//  · 'down'      retroceso: las 2 últimas sesiones ≥5% por debajo de tu mejor nivel anterior (una mala no basta)
//  · 'stagnant'  estancado: ≥4 sesiones y ≥3 semanas sin mejorar el 1RM estimado, ni las reps, ni el peso
//  · 'strong_up' / 'up' / 'flat' según la pendiente (mínimos cuadrados) del 1RM estimado en %/semana
// Mismo peso con más reps (doble progresión) sube el 1RM estimado: nunca cuenta como estancamiento.
const PROG_WINDOW=6,STAG_MIN_SESSIONS=4,STAG_MIN_DAYS=21,REG_DROP=0.95;
function coach_e1rm(rec,ex,all){ // all (C2): con las repeticiones de TODAS las series (la tendencia del Coach); sin él, las más bajas
  const v=+(rec&&rec.v);
  if(!(v>0)||!isFinite(v))return 0;
  // Con peso por tiempo o distancia (un paseo con mancuernas, una plancha con disco): el peso por su medida, sin tope
  // (el Coach sube el tiempo hasta 2-3 min y la distancia hasta el doble del plan: con tope, subir sería «estancarse»)
  const lt=_recLT(rec);
  if(lt==='t'&&_setNumT(rec.t)!=null)return v*(1+_setNumT(rec.t)/120);
  if(lt==='d'&&_setNumD(rec.m)!=null)return v*(1+_setNumD(rec.m)/100);
  // Un registro de kg de antes (sin tiempo ni metros) en un ejercicio por tiempo o distancia (una plancha con disco):
  // con el tiempo o la distancia de su plan, la misma escala que los nuevos (por reps saldría un falso retroceso)
  const xl=lt==='w'&&ex?exLT(ex):'w';
  if(xl==='t'||xl==='d'){const q={r:_recPlan(rec,ex).r},x=xl==='t'?_tgtSecs(q):_tgtMetres(q);if(x!=null)return v*(1+x/(xl==='t'?120:100));}
  let r=all?_recRepsAvg(rec):parseInt(rec.r);
  if(!(r>0))r=targetRepsNum(ex)||10; // registros antiguos sin reps: las del objetivo
  return v*(1+Math.min(r,30)/30);
}
function _recReps(r){const n=parseInt(r&&r.r);return n>0?n:null;}
// (C2) Repeticiones de un registro contando TODAS las series hechas con su peso de referencia (la media): mejorar en las dos
// primeras series y repetir la tercera es progresar. El registro guarda en r las más bajas, y con ellas 10·10·10 → 12·12·10 era
// «estancado». Sin series guardadas (registros antiguos), las de siempre.
function _recRepsAvg(rec){
  const n=_recReps(rec);if(!rec||!Array.isArray(rec.sets))return n;
  const v=+rec.v||0,a=rec.sets.map(x=>x&&(v>0?Math.abs((+x.w||0)-v)<0.01:!(+x.w>0))?_setNumR(x.r):null).filter(x=>x!=null);
  return a.length?a.reduce((x,y)=>x+y,0)/a.length:n;
}
// Registros de un ejercicio para su progresión: los antiguos sin ts (copias de seguridad de formato antiguo) cuentan con
// el día de su fecha escrita («5 May», _histTs: la misma fecha que ven la ficha, la lista y la recomposición), así el Coach
// y Progreso los juzgan igual (en copias: lo guardado no cambia). Los que no tienen ni eso (fecha aproximada) siguen
// fuera. Con todos los ts, la lista tal cual (los datos de siempre dan exactamente lo mismo).
function _progSrc(exId){
  const src=Array.isArray(S.strength[exId])?S.strength[exId]:[],has=r=>!r||typeof r!=='object'||typeof r.ts==='number'&&isFinite(r.ts);
  if(src.every(has))return src;
  const t=_histTs(src);
  return src.map((r,i)=>!has(r)&&t.est&&t.est[i]===1?Object.assign({},r,{ts:t[i]}):r);
}
function coach_exerciseProgression(exId,sinceTs){
  const ex=findExInPlan(exId)||{id:exId};
  const src=_progSrc(exId);
  // Sin kilos (su último registro es de peso corporal, solo reps, tiempo o distancia sin peso): su propia medida
  {let la=null;for(let i=src.length-1;i>=0;i--){const r=src[i];if(r&&typeof r==='object'&&!r.dl){la=r;break;}}
    if(la&&!(+la.v>0)&&_recLT(la)!=='w')return _progNoKg(exId,ex,_recLT(la),sinceTs);}
  const data=[];
  for(let i=src.length-1;i>=0&&data.length<PROG_WINDOW;i--){
    const r=src[i];
    if(!r||!(+r.v>0)||typeof r.ts!=='number'||!isFinite(r.ts))continue;
    if(sinceTs&&r.ts<sinceTs)continue;
    if(r.dl||_lightAt(exId,r.ts))continue; // descarga / semana de descanso: no es tu nivel real
    data.push(r);
  }
  data.sort((a,b)=>a.ts-b.ts);
  const n=data.length,W=7*86400000;
  // lastre: peso corporal con chaleco, mochila o disco. Sus kilos son solo el lastre, así que su % no es fuerza (de 2.5 a
  // 5 kg es un +100 %): fuera de «Fuerza estimada» y del 1RM estimado; la tendencia (más o menos lastre) sí vale
  const res={trend:'insufficient',change:0,pct:0,pctWeek:0,sessions:n,firstV:n?+data[0].v:0,lastV:n?+data[n-1].v:0,
    data,e1rm:[],weeks:0,repsUp:false,dropPct:0,stagSessions:0,stagWeeks:0,metric:'e1rm',lastre:exLT(ex)==='bw'||data.some(r=>_recLT(r)==='bw')};
  if(n<2)return res;
  const e=data.map(r=>coach_e1rm(r,ex,true)); // (C2) todas las series
  res.e1rm=e;
  res.change=+(res.lastV-res.firstV).toFixed(2);
  // Con peso por tiempo o distancia (plancha con disco, paseo) y el mismo peso en toda la ventana, lo que progresa son
  // los segundos o metros: la tendencia es la misma (coach_e1rm), pero la medida y las cifras van en s o m («tiempo
  // +33 %», «30 s → 1:20 min»), como la ficha y la lista. kgTD: sigue contando como ejercicio con kilos (fatiga, fuerza)
  {const lt0=_recLT(data[n-1]);
    if((lt0==='t'||lt0==='d')&&data.every(r=>_recLT(r)===lt0&&_recMetric(r,lt0)!=null&&Math.abs(+r.v-res.firstV)<PR_EPS)){
      res.metric=lt0;res.kgTD=true;res.kgW=res.firstV;res.firstV=_recMetric(data[0],lt0);res.lastV=_recMetric(data[n-1],lt0);res.change=res.lastV-res.firstV;}}
  const span=(data[n-1].ts-data[0].ts)/W;
  res.weeks=span;
  // Tendencia: recta de mínimos cuadrados del 1RM estimado frente al tiempo (no primera contra última)
  let a=e[0],b=e[n-1];
  if(n>=3&&span>0){
    const xs=data.map(r=>(r.ts-data[0].ts)/W),mx=xs.reduce((s,x)=>s+x,0)/n,my=e.reduce((s,y)=>s+y,0)/n;
    let num=0,den=0;
    for(let i=0;i<n;i++){num+=(xs[i]-mx)*(e[i]-my);den+=(xs[i]-mx)*(xs[i]-mx);}
    const sl=den>0?num/den:0;
    a=my+sl*(xs[0]-mx);b=my+sl*(xs[n-1]-mx);
  }
  res.pct=a>0?(b-a)/a*100:0;
  res.e1From=a;res.e1To=b; // (13b) el 1RM estimado de la tendencia (de donde sale el %), no el peso de trabajo
  res.pctWeek=res.pct/Math.max(1,span);
  const r1=_recRepsAvg(data[n-1]),r2=_recRepsAvg(data[n-2]); // (C2)
  res.repsUp=+data[n-1].v===+data[n-2].v&&r1!=null&&r2!=null&&r1>r2;
  // Retroceso: 2 sesiones seguidas claramente por debajo de tu mejor nivel previo
  if(n>=3){
    const ref=Math.max(...e.slice(0,n-2));
    if(ref>0&&e[n-1]<ref*REG_DROP&&e[n-2]<ref*REG_DROP){res.trend='down';res.dropPct=(1-e[n-1]/ref)*100;return res;}
  }
  // Estancamiento: el tramo final más corto con ≥4 sesiones y ≥3 semanas, sin mejorar a su primera sesión
  let k=-1;
  for(let i=n-STAG_MIN_SESSIONS;i>=0;i--){if(data[n-1].ts-data[i].ts>=STAG_MIN_DAYS*86400000){k=i;break;}}
  if(k>=0){
    const b0=data[k],eb=e[k],rb=_recRepsAvg(b0); // (C2)
    let improved=false;
    for(let i=k+1;i<n&&!improved;i++){
      const r=data[i],ri=_recRepsAvg(r);
      if(e[i]>eb*1.01)improved=true;                                   // más 1RM estimado
      else if(+r.v>=+b0.v&&rb!=null&&ri!=null&&ri>rb)improved=true;     // mismo peso, más reps
      else if(+r.v>+b0.v&&e[i]>=eb*0.97)improved=true;                  // más peso sin hundirse
    }
    if(!improved){res.trend='stagnant';res.stagSessions=n-k;res.stagWeeks=(data[n-1].ts-data[k].ts)/W;return res;}
  }
  res.trend=res.pctWeek>=1.5?'strong_up':res.pctWeek>=0.4?'up':'flat';
  return res;
}
// Puntuación sin dimensiones de una medida sin kilos, con la forma de Epley (así los % se parecen a los del 1RM
// estimado: 12 → 13 reps es un +2.4 %, no un +8 %): reps 1 + r/30, tiempo 1 + t/120, distancia 1 + m/100. Sin tope:
// el Coach lleva el tiempo, la distancia y las reps más allá de 2 min, 100 m o 30 reps, y con tope eso sería «estancarse»
function _noKgScore(v,lt){return lt==='t'?1+v/120:lt==='d'?1+v/100:1+v/30;}
// Tendencia de un ejercicio sin kilos: el mismo algoritmo que la del 1RM estimado (ventana, mínimos cuadrados,
// retroceso al 95 %, estancamiento de 4 sesiones en 3 semanas, umbrales de %/semana) con su medida (reps, segundos o
// metros) de los registros sin peso. Empieza después del último reinicio: tras llegar al tope y bajar (banda más dura,
// variante nueva…) bajar no es un retroceso. metric: 'reps' | 't' | 'd'; firstV/lastV en esa medida.
function _progNoKg(exId,ex,lt,sinceTs){
  const src=_progSrc(exId);
  let all=src.filter(r=>r&&typeof r==='object'&&!(+r.v>0)&&typeof r.ts==='number'&&isFinite(r.ts)&&!r.dl&&!_lightAt(exId,r.ts)&&_recMetric(r,lt)!=null);
  if(sinceTs)all=all.filter(r=>r.ts>=sinceTs);
  all.sort((a,b)=>a.ts-b.ts);
  const hi=lt==='t'?(()=>{const x=_tgtSecs(ex);return x?Math.min(2*x,x+60):Infinity;})():lt==='d'?(()=>{const x=_tgtMetres(ex);return x?2*x:Infinity;})()
    :((_repRangeBW(ex)||{}).hi||Infinity);
  let k0=0;
  for(let i=1;i<all.length;i++){const a=_recMetric(all[i-1],lt),b=_recMetric(all[i],lt);if(a>=hi&&b<a)k0=i;}
  const data=all.slice(k0).slice(-PROG_WINDOW),n=data.length,W=7*86400000,mt=lt==='t'?'t':lt==='d'?'d':'reps';
  const m=data.map(r=>_recMetric(r,lt));
  const res={trend:'insufficient',change:0,pct:0,pctWeek:0,sessions:n,firstV:n?m[0]:0,lastV:n?m[n-1]:0,
    data,e1rm:[],weeks:0,repsUp:false,dropPct:0,stagSessions:0,stagWeeks:0,metric:mt};
  if(n<2)return res;
  const e=m.map(v=>_noKgScore(v,lt));
  res.e1rm=e;res.change=m[n-1]-m[0];
  const span=(data[n-1].ts-data[0].ts)/W;
  res.weeks=span;
  let a=e[0],b=e[n-1];
  if(n>=3&&span>0){
    const xs=data.map(r=>(r.ts-data[0].ts)/W),mx=xs.reduce((s,x)=>s+x,0)/n,my=e.reduce((s,y)=>s+y,0)/n;
    let num=0,den=0;
    for(let i=0;i<n;i++){num+=(xs[i]-mx)*(e[i]-my);den+=(xs[i]-mx)*(xs[i]-mx);}
    const sl=den>0?num/den:0;
    a=my+sl*(xs[0]-mx);b=my+sl*(xs[n-1]-mx);
  }
  res.pct=a>0?(b-a)/a*100:0;
  res.e1From=a;res.e1To=b; // (13b) el 1RM estimado de la tendencia (de donde sale el %), no el peso de trabajo
  res.pctWeek=res.pct/Math.max(1,span);
  if(n>=3){
    const ref=Math.max(...e.slice(0,n-2));
    if(ref>0&&e[n-1]<ref*REG_DROP&&e[n-2]<ref*REG_DROP){res.trend='down';res.dropPct=(1-e[n-1]/ref)*100;return res;}
  }
  let k=-1;
  for(let i=n-STAG_MIN_SESSIONS;i>=0;i--){if(data[n-1].ts-data[i].ts>=STAG_MIN_DAYS*86400000){k=i;break;}}
  if(k>=0&&!e.slice(k+1).some(v=>v>e[k]*1.01)){res.trend='stagnant';res.stagSessions=n-k;res.stagWeeks=(data[n-1].ts-data[k].ts)/W;return res;}
  res.trend=res.pctWeek>=1.5?'strong_up':res.pctWeek>=0.4?'up':'flat';
  return res;
}
// Textos de una progresión según su medida: «tu 1RM estimado sube» / «tus reps suben» / «tu tiempo sube»…
function _progWhat(p){const m=p&&p.metric;return m==='reps'?{su:'tus reps',v:'suben',es:'están estables',de:'de reps',sh:'reps'}
  :m==='t'?{su:'tu tiempo',v:'sube',es:'está estable',de:'de tiempo',sh:'tiempo'}:m==='d'?{su:'tu distancia',v:'sube',es:'está estable',de:'de distancia',sh:'distancia'}
  :{su:'tu 1RM estimado',v:'sube',es:'está estable',de:'de 1RM estimado',sh:'1RM est.'};}
// «30 → 45 s», pero «30 s → 1:20 min» si las unidades no coinciden
function _progRange(p){const a=_progVal(p,p.firstV),b=_progVal(p,p.lastV),ua=a.split(' ').pop(),ub=b.split(' ').pop();
  return(ua===ub&&a.includes(' ')?a.slice(0,-ua.length-1):a)+' → '+b+(p.kgTD&&p.kgW?' con '+kgTxt(p.kgW)+' kg':'');}
// (13b) Cifras de «Progresión excepcional»: con kilos el % es del 1RM estimado (su tendencia), así que van las dos cosas
// con su nombre: «1RM est. 35 → 41 kg · trabajas con 28.5 → 33.5 kg». Sin kilos, su propia medida («30 → 45 s»).
function _progExcRange(p){
  if(!p||p.metric!=='e1rm'||!(p.e1From>0)||!(p.e1To>0))return _progRange(p);
  const h=v=>kgTxt(Math.round(v*2)/2),w=p.firstV===p.lastV?`${kgTxt(p.lastV)}${NB}kg`:`${kgTxt(p.firstV)} → ${kgTxt(p.lastV)}${NB}kg`;
  return`1RM est. ${h(p.e1From)} → ${h(p.e1To)}${NB}kg · trabajas con ${w}`;
}
function _progVal(p,v){return p&&p.metric==='reps'?plural(v,'rep'):p&&p.metric==='t'?fmtSecs(v):p&&p.metric==='d'?fmtM(v):v+' kg';}

// Medida de una lista de registros (hoja de historial, tarjetas de Progreso): kilos si el último tiene peso (o es de los
// de siempre); si no, la suya (reps, tiempo o distancia). data = solo los registros de esa medida.
function _histMode(data){
  const l=data[data.length-1],lt=l?_recLT(l):'w',kg=!l||+l.v>0||lt==='w';
  const d=kg?data.filter(r=>+r.v>0):data.filter(r=>!(+r.v>0)&&_recLT(r)!=='w'&&_prXType(_recLT(r))===_prXType(lt)&&_recMetric(r,lt)!=null);
  return{kg,lt:kg?'w':lt,data:d.length?d:(l?[l]:[])};
}
function coach_consistency(weeks){
  // Sesiones por semana en las últimas N semanas
  const now=Date.now(),cutoff=now-(weeks*7*86400000);
  const recent=S.sessions.filter(s=>s.ts>=cutoff);
  // Descontar las semanas de descanso planificado del denominador (no penalizan la constancia)
  const restCount=restWeeksInWindow(cutoff,now);
  const effWeeks=Math.max(1,weeks-restCount);
  const perWeek=recent.length/effWeeks;
  // Objetivo configurable por el usuario (clamp >=1, nunca divide entre 0)
  const target=getWeeklyTarget();
  const rate=Math.min(1,perWeek/target);
  return{sessions:recent.length,perWeek:perWeek.toFixed(1),rate,target,restWeeks:restCount};
}
// Ventana fija de constancia: 4 semanas (o menos si llevas menos tiempo entrenando). No depende del ciclo,
// así que cerrar un ciclo no cambia tu constancia.
function coach_consistencyWindow(){
  let first=Infinity;
  (S.sessions||[]).forEach(s=>{if(s&&typeof s.ts==='number'&&s.ts<first)first=s.ts;});
  if(!isFinite(first))return 1;
  return Math.min(CYCLE_WEEKS,Math.max(1,Math.ceil((Date.now()-first)/(7*86400000))));
}

function coach_weightTrend(){
  if(!S.weights||S.weights.length<2)return{trend:'insufficient',change:0};
  // (C13) La tendencia es la de las últimas 8 semanas (antes, la primera pesada de siempre contra la última: quien bajó 6 kg el año
  // pasado y lleva 3 meses subiendo salía «estable»). Con menos de dos pesadas en ese tiempo, las dos últimas. changeAll: el cambio
  // desde tu primera pesada, que es lo que enseña la ficha «Peso corporal» del Coach («desde el inicio»).
  const W=S.weights,lw=W[W.length-1];let win=W.filter(w=>w&&+w.ts>=+lw.ts-56*86400000);if(win.length<2)win=W.slice(-2);
  const first=win[0].v,last=lw.v;
  const change=last-first,changeAll=last-W[0].v;
  const days=(lw.ts-win[0].ts)/86400000||1;
  const perWeek=(change/days)*7;
  let trend='flat';
  if(Math.abs(perWeek)<0.1)trend='flat';
  else if(perWeek<-0.3)trend='losing_fast';
  else if(perWeek<0)trend='losing';
  else if(perWeek>0.3)trend='gaining_fast';
  else trend='gaining';
  return{trend,change,changeAll,perWeek:perWeek.toFixed(2),first,last,days};
}

function coach_balance(){
  // Sesiones de cada día de tu rutina en el último ciclo. (E1a) Sobre los días con ejercicios (2-6): los vacíos no rotan
  const start=coach_cycleStart(),keys=liveDayKeys();
  const cnt={};keys.forEach(k=>{cnt[k]=0;});
  // (E1b) cada sesión cuenta para su día por su id (aunque ese día haya cambiado de letra); las de días que ya no están, no
  S.sessions.filter(s=>s.ts>=start).forEach(s=>{const k=sessDayKey(s);if(k&&cnt[k]!==undefined)cnt[k]++;});
  const total=keys.reduce((t,k)=>t+cnt[k],0)||1;
  const ideal=total/Math.max(1,keys.length);
  const maxDev=keys.length?Math.max(...keys.map(d=>Math.abs(cnt[d]-ideal))):0;
  return{cnt,total,keys,balanced:keys.length<2||maxDev<=1.5};
}

// RPE acumulado por zona muscular en las últimas N sesiones
function coach_rpeByMuscle(lastN){
  const sessions=(S.sessions||[]).slice(-Math.max(1,lastN||6));
  if(sessions.length===0)return null;
  if(!_rpeOn())return[]; // (M2) esfuerzo apagado: ninguna zona por esfuerzo
  const byMuscle={};
  // Reunir RPE por grupo muscular usando los registros de strength
  Object.values(S.strength||{}).forEach(records=>{
    (records||[]).forEach(r=>{
      // Solo los registros de siempre (con peso, o sin tipo): una plancha «al límite» no calienta la zona de los de kg
      if(!r.rpe||!r.muscle||!(+r.v>0||!r.lt))return;
      if(!sessions.some(s=>s.ts&&Math.abs(s.ts-r.ts)<7200000))return;
      if(!byMuscle[r.muscle])byMuscle[r.muscle]={sum:0,n:0};
      byMuscle[r.muscle].sum+=r.rpe;
      byMuscle[r.muscle].n++;
    });
  });
  const result=Object.entries(byMuscle).map(([m,d])=>({muscle:m,avg:+(d.sum/d.n).toFixed(2),samples:d.n}));
  result.sort((a,b)=>b.avg-a.avg);
  return result;
}

// Duración promedio de las últimas N sesiones (minutos)
function coach_sessionDensity(lastN){
  const sessions=(S.sessions||[]).slice(-Math.max(1,lastN||5)).filter(s=>s.durationMin);
  if(sessions.length===0)return null;
  const avg=sessions.reduce((a,s)=>a+s.durationMin,0)/sessions.length;
  const max=Math.max(...sessions.map(s=>s.durationMin));
  const min=Math.min(...sessions.map(s=>s.durationMin));
  return{avg:Math.round(avg),max,min,samples:sessions.length};
}

// Días desde la última sesión
function coach_daysSinceLastSession(){
  if(!S.sessions||S.sessions.length===0)return null;
  const last=S.sessions[S.sessions.length-1];
  if(!last.ts)return null;
  return Math.floor((Date.now()-last.ts)/86400000);
}

// ─── 1b. DIAGNÓSTICO ÚNICO ─────────────────────────────────────
// Una sola fuente de verdad: el análisis, las tarjetas de insights, el «Análisis detallado» y las propuestas
// salen de coach_analyze(), así que nunca se contradicen.
const PROP_MAX_TOTAL=3;        // máx. cambios de plan por ciclo (y 1 por día de rutina)
const DELOAD_AFTER_WEEKS=6;
// (E6, §G.5) Con rutina generada, por nivel: principiante 8 semanas, intermedio 6, avanzado 5 (recomendación) y 8 · 6 · 6 (propuesta);
// empezar de cero y prudente, solo por fatiga (nunca por semanas). Sin rutina generada, los de siempre.
function _dlLevel(){return _isPlainObj(S.planMeta)&&S.planMeta.level?S.planMeta.level:null;}
function _dlProactive(){const pm=_isPlainObj(S.planMeta)?S.planMeta:null;return!(pm&&(pm.modes||[]).some(m=>m==='inicio'||m==='prudente'));}
function _dlRecoWeeks(){const l=_dlLevel();return l==='P0'||l==='P'?8:l==='I'?6:l==='A'?5:DELOAD_RECO_WEEKS;}
function _dlAfterWeeks(){const l=_dlLevel();return l==='P0'||l==='P'?8:l==='I'||l==='A'?6:DELOAD_AFTER_WEEKS;}    // semanas seguidas entrenando sin descanso/descarga → proponer descarga
function _dayOfEx(exId){
  if(!exId)return null;
  const plan=getPlan();
  return Object.keys(plan).find(dk=>plan[dk]&&Array.isArray(plan[dk].ex)&&plan[dk].ex.some(e=>e.id===exId||(e&&e.sub&&e.sub.orig&&e.sub.orig.id===exId)))||null;
}
function _propPrio(p){
  if(p&&typeof p.prio==='number')return p.prio;
  return({deload:0,rm_set:1,rep_scheme:2,swap:2,add_set:3,add_ex:4})[p&&p.type]??5;
}
// Recuperación de TODO el cuerpo: semana de descanso o descarga de todo el plan (≥3 días), o una pausa de 7+ días
// sin entrenar. «Reducir volumen» (descarga de un solo ejercicio) no lo es: no reinicia la fatiga ni quita la descarga.
// Devuelve el ts de la última (Date.now() si estás en una ahora) o 0 si nunca hubo ninguna.
function _fullDeloadNow(){const d=getActiveDeload();return !!(d&&d.kind==='all');}
function _sessionTsSorted(){return (S.sessions||[]).map(s=>s&&+s.ts).filter(t=>t>0&&isFinite(t)).sort((a,b)=>a-b);}
// {ts, src:'deload'|'rest'|'gap'|null, now:bool}: la última recuperación, de qué tipo fue y si estás en ella ahora
function _recoveryInfo(ss){
  const now=Date.now(),DAY=86400000;
  ss=ss||_sessionTsSorted();
  let ts=0,src=null;
  const at=(t,s)=>{if(t>ts){ts=t;src=s;}};
  (S.restWeeks||[]).forEach(r=>{if(r&&isFinite(r.startTs)&&isFinite(r.endTs)&&r.startTs<=now){const e=Math.min(now,r.endTs);if(e-r.startTs>=3*DAY)at(e,'rest');}});
  (S.deloadHistory||[]).forEach(h=>{if(h&&h.kind!=='ex'&&h.endTs-h.startTs>=3*DAY)at(Math.min(now,h.endTs),'deload');});
  for(let i=1;i<ss.length;i++)if(ss[i]-ss[i-1]>=7*DAY)at(ss[i],'gap');
  const cur=_fullDeloadNow()?'deload':getActiveRest()?'rest':(ss.length&&now-ss[ss.length-1]>=7*DAY)?'gap':null;
  if(cur)return{ts:now,src:cur,now:true};
  return{ts,src,now:false};
}
function coach_recoveryTs(ss){return _recoveryInfo(ss).ts;}
// Fatiga: semanas seguidas entrenando desde la última recuperación de todo el cuerpo y ejercicios en retroceso.
function coach_fatigue(an){
  const now=Date.now(),DAY=86400000;
  const ss=_sessionTsSorted();
  const last=Math.max(ss.length?ss[0]:now,coach_recoveryTs(ss));
  const weeks=Math.max(0,(now-last)/(7*DAY));
  const sessionsSince=ss.filter(t=>t>=last).length;
  // Retrocesos que cuentan para la fatiga: los del 1RM estimado (dos sesiones flojas de flexiones no piden descarga)
  const regress=an.down.filter(i=>!i.p.metric||i.p.metric==='e1rm'||i.p.kgTD).length;
  // Con «Reducir volumen» de un ejercicio en marcha la descarga se sigue proponiendo (se aplica al terminar)
  const deloadNeeded=!_fullDeloadNow()&&!getActiveRest()&&sessionsSince>=6&&(regress>=2||(_dlProactive()&&weeks>=_dlAfterWeeks()));
  const reason=regress>=2
    ?`${regress} ejercicios llevan dos sesiones seguidas por debajo de tu nivel: es fatiga acumulada.`
    :`Llevas ${Math.floor(weeks)} semanas seguidas entrenando sin descanso ni descarga.`;
  return{lastRecoveryTs:last,weeks,sessionsSince,regress,deloadNeeded,reason};
}
// ─── (13c) MEDIDOR DE FATIGA ─────────────────────────────────────
// Nota de 0 a 100: media ponderada de cinco factores (cada uno de 0 a 1), solo de los que tienen datos (los pesos de
// los que no tienen datos no cuentan: la nota se reparte entre los demás).
//   · Al límite (30): % de tus series marcadas «Al límite» en 14 días (≥6 series con esfuerzo). 15 % → 0 · 45 % → 1
//   · Objetivo sin cumplir (20): % de series fallidas frente al mínimo de su plan (reps, segundos o metros, según el tipo
//     de registro) o sin hacer, en 14 días y sin las sesiones de descarga o descanso (≥6 series). 5 % → 0 · 30 % → 1
//   · Bajan de nivel (20): ejercicios en retroceso según el propio Coach (1RM estimado, reps, tiempo o distancia) entre
//     los que tienen tendencia (≥2). 0 % → 0 · 30 % → 1
//   · Sin descanso (20): semanas seguidas desde tu última descarga, semana de descanso o pausa (coach_fatigue).
//     2 → 0 · 6 → 1
//   · Duración (10): media de tus sesiones de 14 días frente a las 4 semanas anteriores del mismo día de rutina
//     (≥2 y ≥3 sesiones con duración). +5 % → 0 · +25 % → 1
// Nivel: baja (<40), moderada (40-69), alta (≥70). Sin nota si no hay esfuerzo ni objetivo que medir en 14 días o hay
// menos de tres factores con datos. Cardio: fuera (no guarda series de fuerza).
const FATIGUE_W={rpe:30,miss:20,drop:20,weeks:20,dur:10},FATIGUE_MOD=40,FATIGUE_HIGH=70,FATIGUE_DAYS=14,FATIGUE_MIN_SETS=6;
function _fatClamp(x){return Math.max(0,Math.min(1,x));}
function _fatPct(x){return Math.round(x*100)+NB+'%';}
// Mínimo de un registro según su plan: {k:'r'|'t'|'d', lo} o null (sin objetivo que se pueda medir)
function _fatTarget(rec,ex,id){
  const e=ex||{id,s:parseInt(rec.ps)||3,r:rec.pr},lt=_recLT(rec),pl=_recPlan(rec,e);
  if(lt==='t'){const lo=_tgtSecs({r:pl.r});return lo?{k:'t',lo}:null;}
  if(lt==='d'){const lo=_tgtMetres({r:pl.r});return lo?{k:'d',lo}:null;}
  // un registro de kg de antes en un ejercicio por tiempo o distancia (plancha con disco): sus reps no son su objetivo
  if(lt==='w'&&ex){const xl=exLT(ex);if(xl==='t'||xl==='d'||xl==='c')return null;}
  const q=Object.assign({},e,{r:pl.r}),rr=lt==='bw'||lt==='r'?_repRangeBW(q):repRange(q);
  return rr&&rr.lo>0?{k:'r',lo:rr.lo,s:parseInt(pl.s)||0}:null;
}
// Series de los registros de fuerza entre [from, to): [{id, rec, ex, list (las de _sumRecSets)}]. Los antiguos sin ts (copias
// de formato antiguo) cuentan con el día de su fecha escrita, como en el Coach y Progreso (_progSrc).
function _fatRecs(from,to){
  const st=_isPlainObj(S.strength)?S.strength:{},out=[];
  Object.keys(st).forEach(id=>{if(!Array.isArray(st[id]))return;const a=_progSrc(id);
    a.forEach(rec=>{
      if(!rec||typeof rec!=='object'||typeof rec.ts!=='number'||!isFinite(rec.ts)||rec.ts<from||rec.ts>=to)return;
      const ex=findExInPlan(id)||_mmExOf(id);if(ex&&ex.cardio)return;
      const list=_sumRecSets(rec,ex).list;if(list.length)out.push({id,rec,ex:findExInPlan(id)||null,list});
    });});
  return out;
}
function coach_fatigueMeter(an){
  const now=Date.now(),DAY=86400000,from=now-FATIGUE_DAYS*DAY;
  const recs=_fatRecs(from,now+1),hasSess=(S.sessions||[]).some(s=>s&&+s.ts>0);
  // (M2) Esfuerzo apagado: sin el factor «Al límite» (ni el «al límite» de los objetivos sin cumplir); la nota se reparte
  // entre los demás factores con datos, como ya se hace con los que aún no tienen datos
  const on=_rpeOn();
  const F={};
  // 1. Al límite
  {let n=0,r3=0;recs.forEach(x=>x.list.forEach(s=>{if(s.rpe>=1&&s.rpe<=3){n++;if(s.rpe===3)r3++;}}));
    const ok=n>=FATIGUE_MIN_SETS,p=ok?r3/n:0;
    F.rpe={key:'rpe',label:'Al límite',ok,v:p,n,hit:r3,s:ok?_fatClamp((p-0.15)/0.30):0,
      txt:ok?`${_fatPct(p)} de tus series en 2 semanas (${r3}${NB}de${NB}${n})`:n?`Solo ${plural(n,'serie')} con esfuerzo marcado en 2 semanas`:'Sin esfuerzo marcado en 2 semanas'};}
  // 2. Objetivo sin cumplir (reps por debajo del mínimo, segundos o metros por debajo del objetivo, o series sin hacer)
  {let n=0,m=0;
    recs.forEach(x=>{
      if(x.rec.dl||_lightAt(x.id,x.rec.ts))return;
      const t=_fatTarget(x.rec,x.ex,x.id);if(!t)return;
      // fallida, como juzga el Coach de carga (_loadFail): 2+ reps por debajo del mínimo (por tiempo o distancia, más
      // de un 10 % por debajo), o por debajo y «Al límite». Quedarse a una rep del mínimo es parte de progresar.
      x.list.forEach(s=>{const v=t.k==='t'?s.t:t.k==='d'?s.d:s.r;if(!(v>0))return;n++;
        if((t.k==='r'?v<t.lo-1:v<t.lo*0.9)||(on&&v<t.lo&&s.rpe===3))m++;});
      const ps=parseInt(x.rec.ps);
      if(ps>0&&ps>x.list.length){n+=ps-x.list.length;m+=ps-x.list.length;}
    });
    const ok=n>=FATIGUE_MIN_SETS,p=ok?m/n:0;
    F.miss={key:'miss',label:'Objetivo sin cumplir',ok,v:p,n,hit:m,s:ok?_fatClamp((p-0.05)/0.25):0,
      txt:ok?(m?`${_fatPct(p)} de tus series (${m}${NB}de${NB}${n}) en 2 semanas`:`Cumples el objetivo en tus ${n}${NB}series de 2 semanas`)
        :'Pocas series con objetivo en 2 semanas'};}
  // 3. Bajan de nivel (la progresión del Coach: cada ejercicio con su medida)
  {an=an||coach_analyze();
    const base=an.withData.length,dn=an.down,ok=base>=2,p=ok?dn.length/base:0;
    const avg=dn.length?dn.reduce((a,i)=>a+(+i.p.dropPct||0),0)/dn.length:0;
    F.drop={key:'drop',label:'Bajan de nivel',ok,v:p,n:base,hit:dn.length,s:ok?_fatClamp(p/0.30):0,
      txt:!ok?'Aún sin tendencia en tus ejercicios':dn.length?`${dn.length}${NB}de${NB}${plural(base,'ejercicio').replace(' ',NB)}${avg>=0.5?` (−${Math.round(avg)}${NB}%${NB}de${NB}media)`:''}`
        :`Ninguno de tus ${plural(base,'ejercicio')}`};}
  // 4. Semanas seguidas sin descanso ni descarga
  {const f=an.fatigue||coach_fatigue(an),ri=_recoveryInfo(),w=f.weeks,wk=Math.floor(w);
    const ok=hasSess;
    F.weeks={key:'weeks',label:'Sin descanso',ok,v:w,s:ok?_fatClamp((w-2)/4):0,
      txt:!ok?'Aún sin entrenos':ri.now?(ri.src==='deload'?'Estás en tu semana de descarga':ri.src==='rest'?'Estás en tu semana de descanso':'Llevas una semana o más sin entrenar')
        :wk<1?'Menos de una semana seguida':`${plural(wk,'semana')} seguida${wk===1?'':'s'}${f.lastRecoveryTs>0&&ri.ts>0?' desde tu último descanso':''}`};}
  // 5. Duración de las sesiones frente a las 4 semanas anteriores (mismo día de rutina si lo hay)
  {const ss=(S.sessions||[]).filter(s=>s&&isFinite(+s.ts)&&+s.durationMin>0&&+s.durationMin<=MAX_SESSION_MIN);
    const rec=ss.filter(s=>+s.ts>=from&&+s.ts<=now),old=ss.filter(s=>+s.ts<from&&+s.ts>=from-28*DAY);
    const avg=a=>a.reduce((t,s)=>t+(+s.durationMin),0)/a.length;
    const ok=rec.length>=2&&old.length>=3;let R=0,B=0,c=0;
    if(ok){const all=avg(old);rec.forEach(s=>{const sd=old.filter(o=>sessSameDay(o,s));R+=+s.durationMin;B+=sd.length?avg(sd):all;});R/=rec.length;B/=rec.length;c=B>0?R/B-1:0;}
    F.dur={key:'dur',label:'Duración',ok,v:c,s:ok?_fatClamp((c-0.05)/0.20):0,
      txt:ok?`${Math.round(R)}${NB}min de media frente a ${Math.round(B)}${NB}(${c>=0?'+':'−'}${Math.round(Math.abs(c)*100)}${NB}%)`:'Pocas sesiones con duración'};}
  const factors=(on?['rpe','miss','drop','weeks','dur']:['miss','drop','weeks','dur']).map(k=>Object.assign(F[k],{w:FATIGUE_W[k],pts:F[k].ok?Math.round(FATIGUE_W[k]*F[k].s):0}));
  const okF=factors.filter(f=>f.ok),wSum=okF.reduce((a,f)=>a+f.w,0);
  const enough=((on&&F.rpe.ok)||F.miss.ok)&&okF.length>=3;
  const score=enough?Math.round(100*okF.reduce((a,f)=>a+f.w*f.s,0)/wSum):null;
  const level=score==null?null:score>=FATIGUE_HIGH?'alta':score>=FATIGUE_MOD?'moderada':'baja';
  const top=enough?okF.slice().sort((a,b)=>b.w*b.s-a.w*a.s)[0]:null;
  const main=top&&top.s>0.05?top:null;
  const recent=recs.length>0||(S.sessions||[]).some(s=>s&&+s.ts>=from);
  const why=score==null?(!hasSess?(on?'Entrena y marca el esfuerzo de tus series: con 2 semanas de datos verás tu fatiga.':'Entrena: con 2 semanas de datos verás tu fatiga.')
      :!recent?`No has entrenado en las 2${NB}últimas semanas: no hay fatiga que medir.`
      :on?'Aún faltan datos: marca el esfuerzo de tus series (Fácil, Justo o Al límite) un par de semanas más.':'Aún faltan datos: entrena un par de semanas más.')
    :_fatWhyCtx(level,an);
  // dlGo: con la recomendación pospuesta y la línea pidiendo descarga, el medidor ofrece empezarla (botón)
  const dlGo=score!=null&&!!_fatDlAsk(level,an)&&_dlSnoozedOffer();
  return{score,level,factors,main,why,enough,dlGo,days:FATIGUE_DAYS};
}
// (13 r1) La línea del medidor no contradice al resto del Coach: en descarga o descanso toca recuperar, y si la semana de
// descarga se recomienda por semanas sin descanso o por ejercicios que bajan, se dice aunque la nota sea baja.
// ¿Pide la línea una semana de descarga? 'alta' | 'weeks' | 'regress' | null
function _fatDlAsk(level,an){
  const dl=getActiveDeload();
  if((dl&&dl.kind==='all')||getActiveRest())return null;
  // (16b) Las mismas reglas que coach_deloadReco (salvo «Ahora no», que decide quien llama): con la fatiga alta solo
  // si llevas ≥ 2 semanas desde tu última descarga o descanso (justo después de terminarla no se vuelve a ofrecer)
  const f=an&&(an.fatigue||coach_fatigue(an));
  if(f&&(S.sessions||[]).length>=CYCLE_MIN_SESSIONS){
    if(level==='alta'&&f.weeks>=2)return'alta';
    if(_dlProactive()&&f.weeks>=_dlRecoWeeks()&&f.sessionsSince>=DELOAD_RECO_MIN_SESS)return'weeks';
    if(f.deloadNeeded&&f.regress>=2)return'regress';
  }
  return null;
}
function _fatWhyCtx(level,an){
  const dl=getActiveDeload();
  if(dl&&dl.kind==='all')return level==='alta'?'Fatiga alta: bien hecho, estás en tu semana de descarga. Toca recuperar, no apretar.'
    :'Estás en tu semana de descarga: toca recuperar, no apretar.';
  if(getActiveRest())return'Estás en tu semana de descanso: toca recuperar.';
  const ask=_fatDlAsk(level,an);
  if(ask==='alta')return'Fatiga alta: tu cuerpo pide bajar el ritmo una semana.';
  const f=an&&(an.fatigue||coach_fatigue(an)),lv=level==='alta'?'Fatiga alta':level==='moderada'?'Fatiga moderada':'Fatiga baja';
  // (16e) «aunque acabas de recuperar» solo si de verdad hubo una recuperación (descarga, descanso o parón)
  if(level==='alta'&&!ask)return f&&f.weeks<2&&(S.sessions||[]).length>=CYCLE_MIN_SESSIONS&&_recoveryInfo().src
    ?`Fatiga alta, aunque acabas de recuperar: estos días ve suave${_rpeOn()?', sin series al límite,':''} y duerme bien.`
    :`Fatiga alta: estos días ve suave${_rpeOn()?', sin series al límite,':''} y duerme bien.`;
  if(ask==='weeks')return`${lv}, pero llevas ${plural(Math.floor(f.weeks),'semana')} sin descanso: una semana de descarga ahora te ayuda a seguir progresando.`;
  if(ask==='regress')return`${lv}${level==='alta'?' y':', pero'} ${f.regress} ejercicios bajan de nivel: una semana de descarga te ayuda a recuperarlos.`;
  return level==='moderada'?(_rpeOn()?'Fatiga moderada: duerme bien y no sumes más series al límite.':'Fatiga moderada: duerme bien y no sumes más series.'):'Fatiga baja: vas fresco, puedes seguir apretando.';
}
// (13e r1) Con la recomendación pospuesta («Ahora no») la única oferta de descarga es el botón del medidor
// («Elegir mi semana de descarga», abre Ajustes → «Descarga o descanso»); la propuesta del ciclo queda en espera.
function _dlSnoozedOffer(){
  if(!_dlRecoSnoozed()||getActiveRest()||(S.sessions||[]).length<CYCLE_MIN_SESSIONS)return false;
  const d=getActiveDeload();return!(d&&d.kind==='all');
}
// Esfuerzo de las últimas n semanas (lunes a domingo; la última, la actual): series por nivel (1 fácil · 2 justo ·
// 3 al límite · 0 sin marcar) y si fue semana de descarga o de descanso
function coach_rpeWeeks(n){
  n=n||8;const out=[];
  // (13e r1) La descarga de todo el plan en marcha y la semana de descanso en marcha se juzgan por lo que van a durar
  // ([inicio, fin], 7 días): con la misma regla de 3 días que las terminadas, las semanas marcadas son desde el primer
  // día las que quedarán al terminar y no saltan de una semana a otra. La semana en que empieza siempre se marca (16b);
  // si aun así no se ve ninguna (fechas raras de copias antiguas), se marca la actual mientras dure.
  const now=Date.now();
  const dls=(S.deloadHistory||[]).filter(h=>h&&h.kind!=='ex'&&isFinite(h.startTs)&&isFinite(h.endTs)).map(h=>[h.startTs,h.endTs]);
  const cur=getActiveDeload(),curDl=cur&&cur.kind==='all'&&isFinite(cur.startTs)&&isFinite(cur.endTs)?[cur.startTs,cur.endTs]:null;
  if(curDl)dls.push(curDl);
  const rests=(Array.isArray(S.restWeeks)?S.restWeeks:[]).filter(r=>r&&isFinite(r.startTs)&&isFinite(r.endTs)&&r.startTs<=now).map(r=>[r.startTs,r.endTs]);
  const ar=getActiveRest(),curRest=ar&&isFinite(ar.startTs)&&isFinite(ar.endTs)?[ar.startTs,ar.endTs]:null;
  // la semana se marca si la descarga o el descanso ocupa en ella 3 días o más (o entero, si fue más corto) y, además,
  // (16b) la semana en la que empieza: la que empieza el fin de semana queda marcada desde el primer día en su semana y
  // no salta a la siguiente el lunes (esa se marca también, por sus días).
  // (16 r2) Solo si ocupa en ella al menos un día entero: la que empieza el domingo por la tarde ya no marca como descarga
  // una semana de lunes a sábado normal (ese domingo la marca la actual mientras no se vea otra, ver abajo).
  const hit=(a,s,e)=>a.some(([x,y])=>{const o=Math.min(y,e+1)-Math.max(x,s);return o>0&&(o>=Math.min(3*86400000,y-x)-1||(x>=s&&x<=e&&o>=Math.min(86400000,y-x)-1));});
  const all=_fatRecs(coach_weekRange(n-1).start,coach_weekRange(0).end+1);
  for(let o=n-1;o>=0;o--){
    const r=coach_weekRange(o),c={0:0,1:0,2:0,3:0};
    all.forEach(x=>{if(x.rec.ts>=r.start&&x.rec.ts<=r.end)x.list.forEach(s=>{c[[1,2,3].includes(s.rpe)?s.rpe:0]++;});});
    out.push({start:r.start,end:r.end,c,total:c[0]+c[1]+c[2]+c[3],now:o===0,
      kind:hit(rests,r.start,r.end)?'rest':hit(dls,r.start,r.end)?'deload':null});
  }
  // (16e) La regla de respaldo solo vale si la que está en marcha ocupa al menos un día entero de la semana actual: la que
  // empieza el domingo por la tarde no se marca ese domingo (luego saltaría el lunes); aparece el lunes en su semana y ahí se queda.
  const last=out[out.length-1],dayIn=p=>p&&Math.min(p[1],last.end+1)-Math.max(p[0],last.start)>=Math.min(86400000,p[1]-p[0])-1;
  if(last){
    if(curRest&&dayIn(curRest)&&!out.some(w=>hit([curRest],w.start,w.end)))last.kind='rest';
    else if(curDl&&dayIn(curDl)&&!last.kind&&!out.some(w=>hit([curDl],w.start,w.end)))last.kind='deload';
  }
  return out;
}
const FAT_COL={baja:'var(--green)',moderada:'var(--amber)',alta:'var(--red)'};
function _fatSevCol(s){return s>=0.67?'var(--red)':s>=0.34?'var(--amber)':'var(--green)';}
// Medidor semicircular (de menta a ámbar y rojo, con las marcas de 40 y 70)
function _fatGaugeSvg(m){
  const R=80,cx=100,cy=100,L=Math.PI*R,sc=m.score==null?0:Math.max(0,Math.min(100,m.score));
  const pt=v=>{const a=Math.PI*v/100;return[(cx-R*Math.cos(a)).toFixed(1),(cy-R*Math.sin(a)).toFixed(1)];};
  const tick=v=>{const a=Math.PI*v/100,c=Math.cos(a),s=Math.sin(a);return`<line class="fat-tk" x1="${(cx-(R-11)*c).toFixed(1)}" y1="${(cy-(R-11)*s).toFixed(1)}" x2="${(cx-(R+11)*c).toFixed(1)}" y2="${(cy-(R+11)*s).toFixed(1)}"/>`;};
  const arc=`M${cx-R},${cy} A${R},${R} 0 0 1 ${cx+R},${cy}`,[kx,ky]=pt(sc);
  const col=m.level?FAT_COL[m.level]:'var(--text4)';
  return`<svg class="fat-g" viewBox="0 0 200 116" aria-hidden="true" focusable="false">
    <defs><linearGradient id="fat-grad" gradientUnits="userSpaceOnUse" x1="${cx-R}" y1="0" x2="${cx+R}" y2="0">
      <stop offset="0" stop-color="var(--green)"/><stop offset=".5" stop-color="var(--amber)"/><stop offset="1" stop-color="var(--red)"/></linearGradient></defs>
    <path class="fat-tr" d="${arc}"/>
    ${m.score==null?'':`<path class="fat-v" d="${arc}" style="stroke-dasharray:${(L*sc/100).toFixed(1)} ${L.toFixed(1)}"/>`}
    ${tick(FATIGUE_MOD)}${tick(FATIGUE_HIGH)}
    ${m.score==null?'':`<circle class="fat-k" cx="${kx}" cy="${ky}" r="8" style="stroke:${col}"/>`}
    <text class="fat-sc" x="${cx}" y="${cy-14}" text-anchor="middle" style="fill:${col}">${m.score==null?'—':m.score}</text>
    <text class="fat-lv" x="${cx}" y="${cy+8}" text-anchor="middle">${m.level?'fatiga '+m.level:'sin datos'}</text>
  </svg>`;
}
function _fatBarsHtml(wk){
  if(!wk.some(w=>w.total>0))return`<div class="fat-empty">Tus barras de esfuerzo aparecen al guardar tus primeros entrenos.</div>`;
  const max=Math.max(...wk.map(w=>w.total)),lbl=w=>{const d=new Date(w.start);return`${d.getDate()} ${MONTHS[d.getMonth()].toLowerCase()}`;};
  // (13e) La leyenda solo nombra lo que hay en las barras (niveles con series y semanas marcadas)
  const L=[[1,'Fácil'],[2,'Justo'],[3,'Al límite'],[0,'Sin marcar']].filter(([k])=>wk.some(w=>w.c[k]));
  const marks=[wk.some(w=>w.kind==='deload')?ic('leaf')+' descarga':'',wk.some(w=>w.kind==='rest')?ic('moon')+' descanso':''].filter(Boolean).join(' · ');
  const kTxt={deload:'semana de descarga',rest:'semana de descanso'};
  const aria='Esfuerzo por semana, últimas 8 semanas: '+wk.map(w=>`${w.now?'esta semana':'semana del '+lbl(w)}${w.kind?' ('+kTxt[w.kind]+')':''}: ${w.total?L.filter(([k])=>w.c[k]).map(([k,l])=>`${w.c[k]} ${l.toLowerCase()}`).join(', '):'sin series'}`).join('; ');
  const cols=wk.map(w=>`<div class="fat-col${w.total?'':' empty'}${w.now?' now':''}">
      <span class="fat-n">${w.total||'—'}</span>
      ${w.total?`<div class="fat-st" style="height:${Math.max(4,Math.round(w.total/max*100))}%">${[0,3,2,1].filter(k=>w.c[k]).map(k=>`<i class="r${k}" style="flex:${w.c[k]} 1 0"></i>`).join('')}</div>`:'<div class="fat-st none"></div>'}
    </div>`).join('');
  const lbls=wk.map(w=>`<span class="${w.now?'now':''}">${w.now?'Esta':esc(lbl(w))}${w.kind?`<i title="${kTxt[w.kind]}">${ic(w.kind==='rest'?'moon':'leaf')}</i>`:''}</span>`).join('');
  const sum={1:0,2:0,3:0};wk.forEach(w=>{sum[1]+=w.c[1];sum[2]+=w.c[2];sum[3]+=w.c[3];});
  return`<div class="fat-bars" id="fat-bars" role="img" aria-label="${esc(aria)}">${cols}</div>
    <div class="fat-bl" aria-hidden="true">${lbls}</div>
    <div class="sum-rpe-l fat-lg" aria-hidden="true">${L.map(([k,l])=>`<span><i class="r${k}"></i>${l}</span>`).join('')}${marks?`<span>${marks}</span>`:''}</div>`;
}
// Tarjeta «Fatiga» del Coach: medidor, factores y barras de esfuerzo de 8 semanas
function fatigueCardHtml(an){
  const m=coach_fatigueMeter(an),wk=_rpeOn()?coach_rpeWeeks(8):[];
  const aria=m.score==null?`Fatiga: sin datos suficientes. ${m.why}`:`Fatiga ${m.score} de 100, ${m.level}. ${m.why}${m.main?` Lo que más pesa: ${m.main.label.toLowerCase()}.`:''}`;
  const rows=m.factors.map(f=>`<li class="fat-f${f.ok?'':' off'}">
      <span class="fat-fd" aria-hidden="true" style="background:${f.ok?_fatSevCol(f.s):'var(--text4)'}"></span>
      <span class="fat-fb"><span class="fat-fl">${esc(f.label)}</span><span class="fat-fv">${_nwUnits(esc(f.txt))}</span></span>
      <span class="fat-fp"><span aria-hidden="true">${f.ok?`${f.pts}<small>/${f.w}</small>`:'—'}</span><span class="sr-only">${f.ok?`${f.pts} de ${f.w} puntos`:'sin datos'}</span></span></li>`).join('');
  const on=_rpeOn(); // (M2) sin esfuerzo: «Fatiga», sin el factor «al límite» ni las barras de esfuerzo
  return`<div class="sh">${on?'Fatiga y esfuerzo':'Fatiga'}</div>
  <div class="card fat-card" id="fat-card" data-score="${m.score==null?'':m.score}" data-level="${m.level||''}">
    <div class="fat-top" role="img" aria-label="${esc(aria)}">${_fatGaugeSvg(m)}</div>
    <div class="fat-why">${_nwUnits(esc(m.why))}${m.main?` <span class="fat-main">Lo que más pesa: ${esc(m.main.label.toLowerCase())}.</span>`:''}</div>
    ${m.dlGo||(_dlSnoozedOffer()&&_dlPropActive())?`<button type="button" class="fat-go" id="fat-go" onclick="openRecoveryChooser()">Elegir mi semana de descarga <span aria-hidden="true">›</span></button>`:''}
    <ul class="fat-fs" aria-label="Factores de la fatiga">${rows}</ul>
    <details class="fat-how"><summary>Cómo se calcula</summary><p>Cada factor suma hasta sus puntos: ${on?'al límite 30, ':''}objetivo sin cumplir 20, bajan de nivel 20, semanas sin descanso 20 y duración 10. Los que aún no tienen datos no cuentan y la nota se reparte entre los demás. Baja hasta 39, moderada de 40 a 69, alta desde 70.</p></details>
    ${on?`<div class="fat-sub">Esfuerzo por semana</div>
    ${_fatBarsHtml(wk)}`:''}
  </div>`;
}
// ─── (13d) RECOMENDACIÓN: SEMANA DE DESCARGA ─────────────────────
// Cuándo: fatiga alta (medidor ≥ FATIGUE_HIGH, sin descanso en las 2 últimas semanas), 5+ semanas seguidas entrenando
// sin descanso ni descarga (6+ sesiones), o dos ejercicios bajando de nivel (coach_fatigue.deloadNeeded). Nunca durante una
// descarga de todo el plan o un descanso, ni con menos de CYCLE_MIN_SESSIONS sesiones. «Ahora no» la calla una semana
// (S.dlRecoSnoozeTs: medianoche local de dentro de 7 días); terminar antes una semana de descarga, también.
// Se aplica con la misma descarga de siempre (beginFullDeload → S.deload): temporal, con aviso, «Terminar» y vuelta sola.
const DELOAD_RECO_WEEKS=5,DELOAD_RECO_MIN_SESS=6;
let _dlRecoPlan='sets'; // plan elegido en la tarjeta (no se guarda)
let _dlRecoMore=false;   // «Ver qué cambia» abierto: la lista de ejercicios y la letra pequeña (no se guarda)
function _dlRecoSnoozed(){const t=S.dlRecoSnoozeTs;return typeof t==='number'&&isFinite(t)&&Date.now()<t;}
// ¿Hay una «Semana de descarga» del cierre de ciclo entre las propuestas activas?
function _dlPropActive(){return(S.pendingCoachProposals||[]).some(p=>p&&p.type==='deload')&&coach_pendingView().active.some(p=>p&&p.type==='deload');}
// {src:'fatigue'|'weeks'|'regress', tag, why, score, weeks} o null
function coach_deloadReco(an,m){
  if((S.sessions||[]).length<CYCLE_MIN_SESSIONS)return null;
  const d=getActiveDeload();if(d&&d.kind==='all')return null;
  if(getActiveRest()||_dlRecoSnoozed())return null;
  an=an||coach_analyze();
  const f=an.fatigue;if(!f)return null;
  m=m||coach_fatigueMeter(an);
  const wk=Math.floor(f.weeks);
  const high=m.score!=null&&m.score>=FATIGUE_HIGH&&f.weeks>=2;
  const long=_dlProactive()&&f.weeks>=_dlRecoWeeks()&&f.sessionsSince>=DELOAD_RECO_MIN_SESS;
  const reg=!!f.deloadNeeded&&f.regress>=2;
  if(!high&&!long&&!reg)return null;
  const weeksTxt=`${plural(wk,'semana')} seguida${wk===1?'':'s'} entrenando sin descanso ni descarga`;
  if(high)return{src:'fatigue',tag:'Fatiga alta',score:m.score,weeks:f.weeks,
    why:`Tu fatiga está alta (${m.score} de 100)${m.main?`; lo que más pesa: ${m.main.label.toLowerCase()}`:''}.${long?` Además llevas ${weeksTxt}.`:''}`};
  if(long)return{src:'weeks',tag:`${wk} semanas sin descanso`,score:m.score,weeks:f.weeks,
    why:`Llevas ${weeksTxt}. Una semana suave ahora te deja recuperar y volver a progresar.`};
  // (13 r1) «es fatiga acumulada» solo si el medidor lo respalda (moderada o alta)
  const fat=m.level==='moderada'||m.level==='alta';
  return{src:'regress',tag:'Bajan de nivel',score:m.score,weeks:f.weeks,
    why:`${f.regress} ejercicios llevan dos sesiones seguidas por debajo de tu nivel${fat?': es fatiga acumulada.':'.'} Una semana suave ahora te ayuda a recuperarlos.`};
}
// Lo que cambiaría cada ejercicio con ese plan: [{id, n, txt}]. Las cifras salen del propio Coach (coach_prescribe) con
// una descarga simulada, así que son las mismas que verás en Entreno.
function _dlPlanPreview(plan){
  const P=getPlan(),now=Date.now(),changes=[],rows=[],wp=plan==='weight';
  Object.keys(P).forEach(dk=>(P[dk]&&Array.isArray(P[dk].ex)?P[dk].ex:[]).forEach(ex=>{
    if(!ex||ex.cardio||exLT(ex)==='c'||changes.some(c=>c.exId===ex.id))return;
    const from=Math.max(1,Math.min(10,_baseSets(ex))),lt=exLT(ex),load=wp&&(lt==='w'||lt==='t'||lt==='d');
    changes.push(Object.assign({exId:ex.id,day:dk,from,to:load?from:_dlSetsTo(from)},load?{m:'load'}:{}));
  }));
  if(!changes.length)return rows;
  const keep=S.deload;
  try{
    S.deload={id:'dl_preview',kind:'all',plan:wp?'weight':'sets',startTs:now,endTs:_deloadEndFrom(now),label:'',changes};
    changes.forEach(c=>{
      const ex=findExInPlan(c.exId);if(!ex)return;
      let txt='';
      if(c.m==='load'){
        const p=coach_prescribe(ex.id),u=p&&p.unit;
        if(p&&p.dlFrom!=null)txt=_presIsKg(p)||p.weight>0?`${kgTxt(p.dlFrom)} → ${kgTxt(p.weight)}${NB}kg`
          :u==='s'?`${fmtSecs(p.dlFrom)} → ${fmtSecs(p.t)}`:`${fmtM(p.dlFrom)} → ${fmtM(p.m)}`;
        // (13 r1) un salto menos sería demasiado: baja series (lo mismo que hará startDeload)
        else if(_dlNoLoadCut(ex.id)){const to=_dlSetsTo(c.from);txt=to<c.from?`${c.from} → ${_nSeries(to)}`:`${_nSeries(c.from)}, más suave`;}
        else if(p&&p.kind==='deload')txt=_presIsKg(p)||p.weight>0?`mismo peso, más suave`:'igual, más suave';
        else txt=exLT(ex)==='w'?`−15${NB}% de peso`:`−15${NB}%`;
      }else txt=c.to<c.from?`${c.from} → ${_nSeries(c.to)}`:`${_nSeries(c.from)}, más suave`;
      rows.push({id:ex.id,n:ex.n,txt:txt.replace(/ → /g,NB+'→ ')});
    });
  }finally{S.deload=keep;}
  return rows;
}
// Tarjeta «Semana de descarga» del Coach (rec = coach_deloadReco)
function deloadRecoHtml(rec){
  if(!rec)return'';
  const plan=_dlRecoPlan==='weight'?'weight':'sets',now=Date.now(),end=_deloadEndFrom(now),cd=getActiveDeload(),exDl=cd&&cd.kind==='ex'?cd:null;
  const rows=_dlPlanPreview(plan),MAX=5;
  const opt=(k,t,dsc)=>_dlrOptHtml(k,t,dsc,plan===k,'dlRecoPick');
  const note=plan==='weight'?`Lo que no tiene peso que bajar (peso corporal, bandas) va con menos series; lo de tiempo o distancia sin peso, con un 15${NB}% menos.`
    :'Mismo peso que ahora: solo bajan las series. Los de 1 serie se quedan igual, más suaves.';
  return`<div class="card dlr-card" id="dl-reco" role="region" aria-labelledby="dlr-t" data-src="${rec.src}" data-plan="${plan}">
    <div class="dlr-h"><span class="dlr-ic" aria-hidden="true">${ic('leaf')}</span><div class="dlr-hb">
      <div class="dlr-tag${rec.src==='fatigue'?' hot':''}">Recomendado · ${_nwUnits(esc(rec.tag))}</div>
      <div class="dlr-t" id="dlr-t">Semana de descarga</div></div></div>
    <div class="dlr-why">${_nwUnits(esc(rec.why))}</div>
    <div class="dlr-dates"><span>Empieza hoy, <b>${esc(_dlDayTxt(now))}</b></span><span>Tu plan vuelve el <b>${esc(deloadEndTxt({endTs:end}))}</b></span></div>
    <div class="dlr-opts" role="radiogroup" aria-label="Cómo quieres descargar">
      ${opt('sets','Menos series',`−40${NB}% de series, mismo peso`)}
      ${opt('weight','Menos peso',`Mismas series, −15${NB}% de peso`)}
    </div>
    ${exDl?`<div class="dlr-note dlr-sub">Tu «${esc(deloadTitle(exDl))}» termina al empezarla: la semana la sustituye.</div>`:''}
    <button type="button" class="dlr-more" aria-expanded="${_dlRecoMore}" onclick="dlRecoMore()">${_dlRecoMore?'Ocultar el detalle':'Ver qué cambia'} <span aria-hidden="true">${_dlRecoMore?'▴':'▾'}</span></button>
    ${_dlRecoMore?`<div class="dlr-det">${rows.length?`<ul class="dlr-prev" aria-label="Lo que cambia en tu plan">${rows.slice(0,MAX).map(r=>`<li><span class="dlr-pn">${esc(r.n)}</span><span class="dlr-pv">${esc(r.txt)}</span></li>`).join('')}${rows.length>MAX?`<li class="more">y ${plural(rows.length-MAX,'ejercicio')} más</li>`:''}</ul>`:''}
      <div class="dlr-note">${_nwUnits(note)} Esa semana no se sube nada; al terminar, tu plan vuelve solo.</div></div>`:''}
    <div class="dlr-acts"><button type="button" class="btn bp dlr-go" onclick="dlRecoStart()">Empezar descarga</button><button type="button" class="btn bs dlr-later" onclick="dlRecoLater()">Ahora no</button></div>
  </div>`;
}
// (13e) Solo se repinta la tarjeta (el foco sigue en el radio elegido, también con las flechas)
function dlRecoPick(k){_dlRecoPlan=k==='weight'?'weight':'sets';
  const el=document.getElementById('dl-reco'),rec=el?coach_deloadReco():null;
  if(el&&rec)el.outerHTML=deloadRecoHtml(rec);else render();
  const b=document.querySelector('#dl-reco .dlr-opt[data-plan="'+_dlRecoPlan+'"]');if(b)try{b.focus({preventScroll:true});}catch(e){}}
// «Ver qué cambia» / «Ocultar el detalle»: como al elegir el plan, solo se repinta la tarjeta y el foco sigue en el botón
function dlRecoMore(){_dlRecoMore=!_dlRecoMore;
  const el=document.getElementById('dl-reco'),rec=el?coach_deloadReco():null;
  if(el&&rec)el.outerHTML=deloadRecoHtml(rec);else render();
  const b=document.querySelector('#dl-reco .dlr-more');if(b)try{b.focus({preventScroll:true});}catch(e){}}
function dlRecoStart(){
  const r=beginFullDeload(_dlRecoPlan);
  if(!r.ok){toast(r.msg);render();return;}
  // La «Semana de descarga» que el Coach propuso al cerrar el ciclo queda hecha con esta
  const L=S.pendingCoachProposals||[];
  for(let i=L.length-1;i>=0;i--){const p=L[i];if(p&&p.type==='deload'){L.splice(i,1);
    if(!Array.isArray(S.appliedProposals))S.appliedProposals=[];S.appliedProposals.push({...p,dayKey:null,appliedAt:Date.now(),dlId:r.dlId});}}
  if(Array.isArray(S.appliedProposals)&&S.appliedProposals.length>60)S.appliedProposals=S.appliedProposals.slice(-60);
  S.dlRecoSnoozeTs=null;_dlRecoMore=false;
  saveState();render();toast(r.msg,3600);
}
function dlRecoLater(){
  S.dlRecoSnoozeTs=_addDaysLocal(_startOfDay(Date.now()),7);_dlRecoMore=false;
  saveState();render();toast(`De acuerdo · te la vuelvo a proponer el ${_dlDayTxt(S.dlRecoSnoozeTs)}`,3600);
}
// (13e r1) Al botón del medidor (la oferta mientras la recomendación está pospuesta)
function goFatGo(){
  const open=!_cfold.has('fat');if(open)_cfold.add('fat'); // su fila de «Más detalle», abierta
  if(S.tab!=='coach')go('coach');else if(open)render();
  requestAnimationFrame(()=>{const b=document.getElementById('fat-go')||document.getElementById('fat-card');if(!b)return;
    b.scrollIntoView({block:'center'});if(b.id==='fat-go')try{b.focus({preventScroll:true});}catch(e){}});
}
function goDeloadReco(){
  if(S.tab!=='coach')go('coach');
  requestAnimationFrame(()=>{const el=document.getElementById('dl-reco');if(el)el.scrollIntoView({block:'start'});});
}
// Series «de verdad» de un ejercicio: durante una descarga, las de tu plan normal (las que vuelven al terminar).
// Así lo que propone el Coach (y su diff) es lo que tendrás después de la descarga, no la mitad.
function _baseSets(ex){
  const s=parseInt(ex&&ex.s)||3,d=getActiveDeload();
  const c=d&&ex&&d.changes.find(c=>c.exId===ex.id);
  return c&&s===c.to?c.from:s;
}
function _nSeries(n){return plural(n,'serie');}
// (13b) Al cambiar un ejercicio por otro distinto (propuesta del Coach, «Cambiar a …»), su historial se queda con él:
// Progreso lo sigue mostrando con su nombre, en «Fuera» (fuera de tu rutina). El texto dice dónde, no solo «se conserva».
function _histStaysTxt(ex){const n=ex&&ex.n||'este ejercicio';
  return Array.isArray(S.strength&&S.strength[ex&&ex.id])&&S.strength[ex.id].length
    ?`Tu historial de ${n} no se pierde: sigue en Progreso, en «Fuera».`:`${n} aún no tiene historial.`;}
// Candidatas, de más a menos prioritaria: fatiga/seguridad (descarga) > retroceso > estancamiento real > progresión > volumen.
// Los ejercicios «en espera» (it.hold: recién cambiados, en descarga o recuperándose) no están en down/stagnant/flat.
// (E16d, §G.4) Propuestas según tu objetivo (con rutina generada): «Ganar fuerza» sube la carga en los básicos a 4-6 (3-5 en avanzados)
// y nunca propone «×12 con menos peso»; «Aguantar más», más repeticiones; «Perder grasa» y «Salud y forma» mantienen las cargas y suben
// antes los minutos de cardio (hasta 150 a la semana, OMS); «Ganar músculo», una serie más solo si el grupo está por debajo de lo alto de
// su rango y de su techo (planMeta.vol); con 16-17 años, nunca por debajo de 6 repeticiones. Sin rutina generada, como siempre.
function _coachGoal(){const p=S.profile;return p&&p.mode==='gen'&&_isPlainObj(S.planMeta)?p.goal||null:null;}
// Series por semana de cada grupo de planificación con la rutina de ahora (la cuenta del generador: volV × veces por semana)
function _planVolNow(){
  const p=getPlan(),ks=liveDayKeys(p),per=ks.length?getWeeklyTarget()/ks.length:0,v={};if(!LIB_K||!LIB_K.volV)return v;
  ks.forEach(k=>(p[k].ex||[]).forEach(e=>{const ex=routineEx(e);if(!ex||ex.cardio)return;const L0=exLib(ex),L=L0&&LIB_K.BY.get(L0.id);if(!L)return;
    const o=LIB_K.volV(L),n=_baseSets(ex);for(const g in o)v[g]=(v[g]||0)+n*o[g]*per;}));
  return v;
}
// Minutos de cardio por semana (calentamiento y cardio final de tus días)
function _cardioWeekMin(){
  const p=getPlan(),ks=liveDayKeys(p),per=ks.length?getWeeklyTarget()/ks.length:0;let m=0;
  ks.forEach(k=>(p[k].ex||[]).forEach(e=>{const ex=routineEx(e);if(ex&&(ex.cardio||exLT(ex)==='c'))m+=(_cardioMin(ex)||0)*per;}));
  return m;
}
function coach_buildCandidates(an){
  const out=[],now=Date.now(),plan=routinePlan(),f=an.fatigue;
  const goal=_coachGoal(),pm=_isPlainObj(S.planMeta)?S.planMeta:{},lifts=new Set(Array.isArray(pm.lifts)?pm.lifts:[]),minor=!!(S.profile&&S.profile.age==='16'); // (E16d)
  const noScheme=goal==='fuerza'||goal==='aguante'||goal==='grasa'||goal==='salud';let volNow=null; // (E16d) sin «×8 con más peso» ni «×12 con menos»
  const hot=new Set((coach_rpeByMuscle(6)||[]).filter(z=>z.avg>=2.6&&z.samples>=3).map(z=>z.muscle));
  if(f.deloadNeeded){
    out.push({id:'deload_week',type:'deload',basis:'fatigue',prio:0,sev:f.weeks,ic:'🧘',tag:'Descarga',createdAt:now,
      title:'Semana de descarga',diff:'−40 % de series · mismo peso · 7 días',short:'una semana de descarga',
      description:`${f.reason} Durante 7 días haces un 40 % menos de series con el mismo peso. Al terminar, tu plan vuelve solo a sus series.`});
  }
  an.down.forEach(it=>{
    const ex=it.ex,s=_baseSets(ex);
    if(_isBalEx(ex))return; // (C11)
    if(f.deloadNeeded&&an.down.length>=2){it.covered='deload';return;} // la descarga ya lo cubre
    if(s<=1)return;
    out.push({id:'rm_set_'+ex.id,type:'rm_set',basis:'down',prio:1,sev:it.p.dropPct,ic:'🧘',tag:'Descarga',exId:ex.id,dayKey:it.dayKey,createdAt:now,
      title:`Descarga en ${ex.n}`,diff:`${s}×${_tgtShort(ex)} → ${s-1}×${_tgtShort(ex)} · 7 días`,short:`bajar a ${_nSeries(s-1)} durante una semana`,
      description:`Dos sesiones seguidas por debajo de tu nivel (−${Math.round(it.p.dropPct)} % ${_progWhat(it.p).de}): suele ser fatiga. Haz ${_nSeries(s-1)} en vez de ${s} con el mismo peso durante 7 días; después vuelve sola a ${_nSeries(s)}.`});
  });
  an.stagnant.forEach(it=>{
    // Cambiar el esquema de reps (con más o menos peso) solo tiene sentido con peso × reps
    const ex=it.ex,s=_baseSets(ex),kg=exLT(ex)==='w',tr=kg?targetRepsNum(ex):null;
    if(_isBalEx(ex))return; // (C11)
    const why=`${it.p.stagSessions}+ sesiones (${Math.max(3,Math.round(it.p.stagWeeks))}+ semanas) sin mejorar ${(kg&&!it.p.kgTD)||it.p.metric==='e1rm'?'peso ni reps':_progWhat(it.p).su} con ${s}×${fmtTargetReps(ex).replace(/ reps$/,'')}.`;
    const base={basis:'stagnant',prio:2,sev:it.p.stagSessions,ic:'🔄',tag:'Variación',exId:ex.id,dayKey:it.dayKey,createdAt:now};
    const rr=kg?repRange(ex):null; // (E16d) con rutina generada el objetivo es un rango («8-10»): targetRepsNum no lo lee
    if(goal==='fuerza'&&rr){ // (E16d) en los básicos, a 4-6 (3-5 en avanzados; 6-8 con 16-17 años, nunca por debajo de 6) con más peso
      const R=minor?'6-8':pm.level==='A'?'3-5':'4-6',lo=+R.split('-')[0],L0=exLib(ex);
      if((L0&&lifts.has(L0.id)||isCompoundEx(ex))&&rr.lo>lo+1){out.push({...base,id:'change_rep_scheme_'+ex.id,type:'rep_scheme',to:{s,r:R},title:`Más carga en ${ex.n}`,
        diff:`${s}×${_tgtShort(ex)} → ${s}×${R}`,short:`pasar a ${s}×${R} con más peso`,description:`${why} Para «Ganar fuerza», en los básicos: ${s}×${R} con más peso.`});return;}
    }
    const RA=goal==='aguante'&&rr?(rr.hi<12?'12-15':rr.hi<=15?'15-20':null):null;
    if(RA){ // (E16d) más repeticiones
      out.push({...base,id:'change_rep_scheme_'+ex.id,type:'rep_scheme',to:{s,r:RA},title:`Más repeticiones en ${ex.n}`,diff:`${s}×${_tgtShort(ex)} → ${s}×${RA}`,
        short:`pasar a ${s}×${RA} con algo menos de peso`,description:`${why} Para «Aguantar más»: ${s}×${RA} con algo menos de peso.`});return;
    }
    if(!noScheme&&tr!=null&&tr>=10){
      const ns=Math.min(6,s+1);
      out.push({...base,id:'change_rep_scheme_'+ex.id,type:'rep_scheme',to:{s:ns,r:8},title:`Cambiar esquema en ${ex.n}`,
        diff:`${s}×${tr} → ${ns}×8`,short:`pasar a ${ns}×8 con algo más de peso`,
        description:`${why} Pasa a ${ns}×8 con algo más de peso: misma musculatura, estímulo nuevo.`});
      return;
    }
    // Sin kilos: antes que otro ejercicio, su versión más difícil (más estímulo con el mismo patrón)
    const upV=kg?null:_presVariant(ex,'up');
    if(upV){
      out.push({...base,id:'swap_'+ex.id,type:'swap',libExId:upV.id,title:`Cambiar ${ex.n} por ${upV.n}`,
        diff:`${ex.n} → ${upV.n}`,short:`cambiar a ${upV.n}`,
        description:`${why} Prueba ${upV.n}: la versión más difícil: más estímulo con el mismo patrón. ${_histStaysTxt(ex)}`});
      return;
    }
    const alt=coach_suggestAlternative(ex);
    if(alt){
      out.push({...base,id:'swap_'+ex.id,type:'swap',libExId:alt.id,title:`Cambiar ${ex.n} por ${alt.n}`,
        diff:`${ex.n} → ${alt.n}`,short:`cambiar a ${alt.n}`,
        description:`${why} Prueba ${alt.n}: ${alt.reason}. ${_histStaysTxt(ex)}`});
      return;
    }
    if(tr!=null&&!noScheme){ // (E16d) «×12 con menos peso»: nunca para fuerza, aguante, grasa ni salud
      out.push({...base,id:'change_rep_scheme_'+ex.id,type:'rep_scheme',to:{s,r:12},title:`Cambiar esquema en ${ex.n}`,
        diff:`${s}×${tr} → ${s}×12`,short:`pasar a ${s}×12 con algo menos de peso`,
        description:`${why} Pasa a ${s}×12 con algo menos de peso para retomar el progreso.`});
    }
  });
  an.flat.forEach(it=>{
    const ex=it.ex,s=_baseSets(ex);
    if(_isBalEx(ex))return; // (C11)
    // Solo si está estable de verdad (no bajando), con datos y sin zona muscular ya «al límite»
    if(s>=5||it.p.sessions<3||it.p.pctWeek<-0.4||hot.has(ex.muscle))return;
    if(goal==='musculo'&&_isPlainObj(pm.vol)){const L0=exLib(ex),L=L0&&LIB_K&&LIB_K.BY.get(L0.id),g=L&&LIB_K.mainGroupV(L),vz=g&&pm.vol[g]; // (E16d)
      if(vz){if(!volNow)volNow=_planVolNow();const cap=Math.min(vz.top||99,vz.techo||99);if((volNow[g]||0)+1>cap+1e-9)return;}}
    out.push({id:'add_set_'+ex.id,type:'add_set',basis:'flat',prio:3,sev:-s,ic:'💪',tag:'Progresión',exId:ex.id,dayKey:it.dayKey,createdAt:now,
      title:`Añadir serie a ${ex.n}`,diff:`${s}×${_tgtShort(ex)} → ${s+1}×${_tgtShort(ex)}`,short:`añadir una serie (${s}→${s+1})`,
      description:`${(w=>w.su[0].toUpperCase()+w.su.slice(1)+' '+w.es)(_progWhat(it.p))} en tus últimas ${it.p.sessions} sesiones. Una serie más (${s}×${_tgtShort(ex)} → ${s+1}×${_tgtShort(ex)}) le da el empujón que necesita.`});
  });
  if(goal==='grasa'||goal==='salud'){ // (E16d)
    const wk=_cardioWeekMin();let best=null;
    if(wk<150)liveDayKeys(plan).forEach(k=>{const arr=plan[k].ex||[],j=arr.length-1,ex=j>0?routineEx(arr[j]):null;if(!ex||!(ex.cardio||exLT(ex)==='c'))return;
      const m=Math.round(_cardioMin(ex)||0);if(m>0&&m<30&&(!best||m<best.m))best={ex,k,m};});
    if(best){const to=Math.min(30,best.m+5),G=goal==='grasa'?'Perder grasa':'Salud y forma';
      out.push({id:'cardio_min_'+best.ex.id,type:'cardio_min',basis:'cardio',prio:1,sev:-best.m,ic:'🚴',tag:'Cardio',exId:best.ex.id,dayKey:best.k,createdAt:now,to:{min:to},
        title:'Más minutos de cardio',diff:`${best.ex.n}: ${best.m} → ${to} min`,short:`pasar a ${to} min de cardio`,
        description:`Para «${G}», antes que más peso: ${to-best.m} minutos más de cardio al final del ${plan[best.k].label}. Ahora sumas unos ${Math.round(wk)} minutos a la semana; lo recomendado son 150-300.`});}
  }
  // Volumen: días con menos de 3 ejercicios de fuerza
  if((S.sessions||[]).length>=4){
    const inPlan=_planLibIds(),place=routinePlace();
    Object.keys(plan).forEach(dk=>{
      const day=plan[dk];if(!day||!Array.isArray(day.ex))return;
      const strEx=day.ex.filter(e=>!e.cardio);
      if(strEx.length>=3)return;
      const cnt={};strEx.forEach(e=>{if(e.muscle)cnt[e.muscle]=(cnt[e.muscle]||0)+1;});
      // (E1a) el grupo principal del propio día; sin ejercicios de fuerza no se adivina por su letra (un «A» puede ser de
      // torso): un día vacío lo rellenas tú desde el editor, y uno solo de cardio se queda como lo hiciste
      const mainMuscle=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a])[0];
      if(!mainMuscle)return;
      // Del lugar de la rutina (casa: nada de máquinas); primero multiarticulares, de tu nivel (dificultad mediana del día),
      // con un material que ya usas y, en el gimnasio, con peso; a igualdad, el orden de la biblioteca
      const libs=strEx.map(exLib).filter(Boolean),difs=libs.map(L=>L.dif).sort((a,b)=>a-b);
      const lvl=difs.length?difs[difs.length>>1]:2,mats=new Set(libs.map(L=>L.mat));
      const rank=e=>(e.compound?0:8)+(e.dif<=lvl?0:4)+(mats.has(e.mat)?0:2)+(place==='g'&&e.lt!=='w'?1:0);
      let pick=null,pr=99;
      EXERCISE_DB.forEach(e=>{if(e.muscle!==mainMuscle||e.lt==='c'||!canDoHere(e,dk)||inPlan.has(e.id)||strEx.some(s=>s.n===e.n))return; // (E3c) su sitio
        const r=rank(e);if(r<pr){pr=r;pick=e;}});
      if(!pick)return;
      out.push({id:'add_ex_'+dk+'_'+pick.id,type:'add_ex',basis:'volume',prio:4,sev:-strEx.length,ic:'➕',tag:'Volumen',dayKey:dk,libExId:pick.id,createdAt:now,
        title:`Añadir ejercicio al ${day.label}`,diff:`+ ${pick.n} · ${pick.s}×${_tgtShort(pick)}`,short:`añadir ${pick.n}`,
        description:`El ${day.label} tiene pocos ejercicios de fuerza (${strEx.length}). Añadir «${pick.n}» (${pick.eq}) sube el volumen de ${mainMuscle} sin alargar mucho la sesión.`});
    });
  }
  return out.sort((x,y)=>(x.prio-y.prio)||((y.sev||0)-(x.sev||0)));
}
// Tope: máx. PROP_MAX_TOTAL cambios por ciclo y 1 por día (la descarga es de todo el plan y no ocupa día).
// Los cambios ya aplicados en este ciclo cuentan; ignorar una libera su hueco y entra la siguiente de la reserva.
function coach_selectProposals(list,opts){
  const fresh=!!(opts&&opts.fresh),cs=coach_cycleStart();
  const applied=fresh?[]:(S.appliedProposals||[]).filter(a=>a&&+a.appliedAt>=cs);
  let total=applied.length;
  const used=new Set();
  applied.forEach(a=>{if(a.type!=='deload'&&a.dayKey)used.add(a.dayKey);});
  const sorted=list.slice().sort((x,y)=>(_propPrio(x)-_propPrio(y))||((+y.sev||0)-(+x.sev||0)));
  const active=[],reserve=[];
  sorted.forEach(p=>{
    const dk=p.type==='deload'?null:(p.dayKey||_dayOfEx(p.exId));
    if(total<PROP_MAX_TOTAL&&(!dk||!used.has(dk))){active.push(p);total++;if(dk)used.add(dk);}
    else reserve.push(p);
  });
  return{active,reserve,appliedCount:applied.length};
}
// Ejercicios «en espera» (it.hold): el Coach no propone otro cambio para ellos hasta tener sesiones nuevas que juzgar.
//  · 'changed'  le aplicaste una propuesta en este ciclo y aún no hay sesiones normales después del cambio.
//               Con sesiones nuevas, su progresión se juzga SOLO con ellas (it.since): ¿funciona el cambio?
//  · 'deload'   está en «Reducir volumen» ahora mismo.
//  · 'recovery' venía en retroceso, pero después hubo (o hay ahora) una descarga de todo el plan, una semana de
//               descanso o una pausa: lo que cuenta son tus próximas sesiones, no proponer otra descarga.
function _appliedThisCycle(plan){
  const cs=coach_cycleStart(),out={};
  const all=Object.values(plan).flatMap(d=>d&&Array.isArray(d.ex)?d.ex:[]);
  (S.appliedProposals||[]).forEach(a=>{
    if(!a||!(+a.appliedAt>=cs)||a.type==='deload')return;
    let id=a.exId;
    if(a.type==='swap'||a.type==='add_ex'){const nx=all.find(e=>e&&e.lib&&e.lib===a.libExId);id=nx?nx.id:null;}
    if(id&&(!out[id]||+a.appliedAt>+out[id].appliedAt))out[id]=a;
  });
  return out;
}
// Contexto del diagnóstico (descarga activa, cambios aplicados en el ciclo, última recuperación): se calcula una vez
// y sirve para todos los ejercicios (coach_analyze y los estados de Progreso, progStatusMap)
function coach_itemCtx(plan){return{dl:getActiveDeload(),applied:_appliedThisCycle(plan),ri:_recoveryInfo()};}
// Diagnóstico de UN ejercicio de la rutina, tal cual lo ve el Coach: {ex, dayKey, p (coach_exerciseProgression),
// hold?, since?}. Progreso usa esta misma función para sus chips (nunca otra regla).
function coach_item(ex,dk,c){
  const dl=c.dl,ri=c.ri,rec=ri.ts;
  const it={ex,dayKey:dk,p:coach_exerciseProgression(ex.id)},a=c.applied[ex.id];
  if(dl&&dl.kind==='ex'&&dl.changes.some(x=>x.exId===ex.id))it.hold={kind:'deload',until:dl.endTs,prop:a||null};
  else if(a){
    const p2=coach_exerciseProgression(ex.id,+a.appliedAt);
    if(p2.trend==='insufficient')it.hold={kind:'changed',since:+a.appliedAt,prop:a};
    else{it.p=p2;it.since=+a.appliedAt;}
  }
  if(!it.hold&&it.p.trend==='down'&&rec>0){
    const d=it.p.data,lastTs=d.length?d[d.length-1].ts:0;
    if(lastTs<rec)it.hold={kind:'recovery',src:ri.src,now:ri.now};
  }
  return it;
}
// (C11) Los ejercicios de equilibrio (el bloque que el creador de rutinas pone con 65 o más) no se juzgan como los de fuerza: mejorar
// en ellos no es sumar segundos sin fin, así que nunca salen «estancados», «estables» ni «en retroceso» y el Coach no propone
// cambiarlos, añadirles series ni descargarlos. Su tendencia se sigue calculando (Progreso la enseña igual).
function _isBalEx(ex){const L=ex&&!ex.cardio?exLib(ex):null;return !!(L&&L.pat==='bal');}
function coach_analyze(){
  // (11) la rutina tal cual: un ejercicio sustituido «solo hoy» se juzga por el original (el que vuelve al guardar)
  const plan=routinePlan(),items=[],ctx=coach_itemCtx(plan);
  Object.keys(plan).forEach(dk=>{
    const day=plan[dk];if(!day||!Array.isArray(day.ex))return;
    day.ex.forEach(ex=>{
      if(!ex||ex.cardio)return;
      items.push(coach_item(ex,dk,ctx));
    });
  });
  const act=items.filter(i=>!i.hold&&!_isBalEx(i.ex));
  const of=(arr,...t)=>arr.filter(i=>t.includes(i.p.trend));
  const an={items,strong:of(items,'strong_up'),up:of(items,'up','strong_up'),flat:of(act,'flat'),stagnant:of(act,'stagnant'),down:of(act,'down'),
    held:items.filter(i=>i.hold),withData:items.filter(i=>i.p.trend!=='insufficient')};
  an.fatigue=coach_fatigue(an);
  an.candidates=coach_buildCandidates(an);
  an.preview=coach_selectProposals(an.candidates,{fresh:true}); // lo que propondría al cerrar el ciclo
  an.candByEx={};
  an.candidates.forEach(c=>{if(c.exId&&!an.candByEx[c.exId])an.candByEx[c.exId]=c;});
  return an;
}
// Propuestas guardadas que siguen vigentes: su ejercicio sigue en el plan y el motivo con el que se crearon
// (basis) sigue siendo cierto. Si ya no (p. ej. vuelves a progresar), no se muestran: nunca contradicen al análisis.
function _basisHolds(p,an){
  if(!p.basis)return true; // propuestas de versiones anteriores: se muestran tal cual
  if(p.basis==='fatigue')return an.fatigue.lastRecoveryTs<(+p.createdAt||0);
  if(p.basis==='volume'){const d=getPlan()[p.dayKey];return !!(d&&Array.isArray(d.ex)&&d.ex.filter(e=>!e.cardio).length<3);}
  // (C12) «Más minutos de cardio»: el cardio no está entre los ejercicios que se analizan (antes caía en «ese ejercicio no está» y la
  // propuesta, guardada, no se veía nunca). Vale mientras ese cardio siga por debajo de lo propuesto y no llegues a 150 min a la semana.
  if(p.basis==='cardio'){const ex=p.exId?findExInPlan(p.exId):null;
    return !!(ex&&(ex.cardio||exLT(ex)==='c')&&p.to&&(_cardioMin(ex)||0)<p.to.min&&_cardioWeekMin()<150);}
  const it=an.items.find(i=>i.ex.id===p.exId);
  if(!it)return false;
  if(it.hold)return false; // recién cambiado / en descarga / recuperándose: primero sus próximas sesiones
  // «Añadir serie» antigua (se creaba al progresar): vale mientras no esté estancado ni en retroceso
  if(p.basis==='legacy_up')return it.p.trend!=='stagnant'&&it.p.trend!=='down';
  return it.p.trend===p.basis||it.p.trend==='insufficient';
}
function coach_livePending(an){
  const plan=getPlan();
  return (S.pendingCoachProposals||[]).filter(p=>{
    if(!p||typeof p.id!=='string')return false;
    if(p.exId&&!findExInPlan(p.exId))return false; // ese ejercicio ya no está en tu rutina
    if(p.type==='add_ex'&&p.dayKey&&!plan[p.dayKey])return false;
    return _basisHolds(p,an);
  });
}
function coach_pendingView(an){
  an=an||coach_analyze();
  return coach_selectProposals(coach_livePending(an),{});
}
// Ejercicios de biblioteca que ya están en el plan (por lib, por id del plan original o por nombre)
function _planLibIds(){
  const set=new Set();
  // (11) también el original de un ejercicio sustituido «solo hoy» (vuelve al guardar)
  Object.values(getPlan()).forEach(d=>(d&&Array.isArray(d.ex)?d.ex:[]).forEach(e=>{const k=_libIdOf(e);if(k)set.add(k);
    if(e&&e.sub&&e.sub.orig){const o=_libIdOf(e.sub.orig);if(o)set.add(o);}}));
  return set;
}
// Lugar de la rutina (g gimnasio · c casa), deducido de toda la rutina (no del día: quien va al gimnasio también tiene
// días solo con mancuernas): gimnasio si alguno de fuerza del catálogo es solo de gimnasio o si no hay ninguno; casa si
// todos se pueden hacer en casa. Lo usan el Coach y «¿Máquina ocupada?» para no proponer máquinas en casa.
function routinePlace(){
  if(_isPlainObj(S.places)&&(S.places.main==='g'||S.places.main==='c'))return S.places.main; // (E3a) lo que dijiste en tus sitios
  const libs=Object.values(routinePlan()).flatMap(d=>d&&Array.isArray(d.ex)?d.ex:[]).filter(e=>e&&!e.cardio).map(exLib).filter(Boolean);
  return !libs.length||libs.some(L=>L.pl==='g')?'g':'c';
}

// ─── 2. GENERADOR DE INSIGHTS ─────────────────────────────

// Texto del «próximo paso» de un ejercicio: la propuesta pendiente si la hay (o «en reserva» si está en la
// reserva); si no, la que haría el Coach al cerrar el ciclo. resIds: ids de las pendientes en reserva.
function _coachNextStep(it,an,pend,resIds){
  if(it.hold)return`${_holdTxt(it)} · dale unas sesiones`; // en espera: nunca otro cambio
  const tag=p=>resIds&&resIds.has(p.id)?'en reserva':'propuesta pendiente';
  const p=(pend||[]).find(x=>x.exId===it.ex.id);
  if(p)return`${p.short||p.title} (${tag(p)})`;
  if(it.covered==='deload'){
    const d=(pend||[]).find(x=>x.type==='deload');
    return d?`una semana de descarga (${tag(d)})`:'una semana de descarga (te la propondré al cerrar el ciclo)';
  }
  const c=an.candByEx&&an.candByEx[it.ex.id];
  if(!c)return'';
  const res=an.preview&&an.preview.reserve.some(x=>x.id===c.id);
  return`${c.short} (${res?'quedará en reserva al cerrar el ciclo':'te lo propondré al cerrar el ciclo'})`;
}
// Orden para nombrar ejercicios en un insight: pendiente activa > la que propondrá al cerrar > en reserva > sin cambio
function _coachStepRank(it,an,pend,resIds){
  const p=(pend||[]).find(x=>x.exId===it.ex.id);
  if(p)return resIds&&resIds.has(p.id)?2:0;
  const c=an.candByEx&&an.candByEx[it.ex.id];
  if(c)return an.preview&&an.preview.active.some(x=>x.id===c.id)?1:3;
  return 4;
}
// «A y B» / «A, B y 3 más» (en <strong>, escapados)
function _namesList(arr){
  const f=x=>`<strong>${esc(x.ex.n)}</strong>`;
  return arr.length<=2?arr.map(f).join(' y '):`${arr.slice(0,2).map(f).join(', ')} y ${arr.length-2} más`;
}
// Por qué un ejercicio está «en espera» (texto corto, sin HTML)
function _holdTxt(it){
  const h=it&&it.hold,ex=it&&it.ex;
  if(!h)return'';
  if(h.kind==='deload')return`en descarga · ${deloadBackOnTxt({endTs:h.until})}`;
  if(h.kind==='recovery'){
    if(h.now&&h.src!=='gap')return`venía por debajo de tu nivel · lo cubre ${h.src==='rest'?'el descanso':'la descarga'}`;
    return`venía por debajo de tu nivel antes de ${h.src==='deload'?'la descarga':h.src==='rest'?'tu descanso':'la pausa'}`;
  }
  const a=h.prop||{};
  if(a.type==='swap'||a.type==='add_ex')return'nuevo en tu plan';
  if(a.type==='rm_set')return`acaba de volver a ${_nSeries(parseInt(ex.s)||1)}`;
  return`acabas de cambiarlo a ${parseInt(ex.s)||ex.s}×${fmtTargetReps(ex).replace(/ reps$/,'')}`;
}

// (C13) ¿Principiante? El nivel de tu rutina generada; sin ella, menos de 6 meses desde tu primera sesión
function _coachNovato(){const l=_dlLevel();if(l)return l==='P0'||l==='P';
  let t0=Infinity;(S.sessions||[]).forEach(s=>{if(s&&+s.ts>0&&+s.ts<t0)t0=+s.ts;});return !isFinite(t0)||Date.now()-t0<182*86400000;}
function coach_generateInsights(an,pend,resIds){
  const cycle=coach_cycleData();
  an=an||coach_analyze();
  pend=pend||coach_livePending(an);
  const cw=coach_consistencyWindow();
  const consistency=coach_consistency(cw);
  const weight=coach_weightTrend();
  const balance=coach_balance();

  const insights=[];

  // ═ A) CONSISTENCIA ═ (ventana fija de 4 semanas; «Empezando» solo con poco historial total)
  if((S.sessions||[]).length<CYCLE_MIN_SESSIONS){
    insights.push({type:'info',ic:'🌱',t:'Empezando',d:`Necesitas <strong>${CYCLE_MIN_SESSIONS-(S.sessions||[]).length}</strong> ${CYCLE_MIN_SESSIONS-(S.sessions||[]).length===1?'sesión':'sesiones'} más para tu primer análisis completo. Sigue así.`});
  }else{
    if(consistency.rate>=0.95){
      insights.push({type:'good',ic:'🎯',t:'Constancia impecable',d:`Llevas <strong>${consistency.perWeek}</strong>${NB}sesiones/semana (objetivo: ${consistency.target}).`});
    }else if(consistency.rate>=0.75){
      insights.push({type:'good',ic:'✓',t:'Buena constancia',d:`Vas a <strong>${consistency.perWeek}</strong>${NB}sesiones/semana. Si llegas a ${consistency.target} consistentes vas a ver cambios importantes.`});
    }else if(consistency.rate>=0.5){
      insights.push({type:'warn',ic:'⚠️',t:'Constancia irregular',d:`Solo <strong>${consistency.perWeek}</strong>${NB}sesiones/semana. El progreso viene de la regularidad — intenta marcar los ${consistency.target} días en tu calendario.`});
    }else{
      insights.push({type:'bad',ic:'⏳',t:'Pocas sesiones',d:`Solo <strong>${consistency.sessions}</strong> ${consistency.sessions===1?'sesión':'sesiones'} en ${plural(cw,'semana')}. Volver a la rutina es lo que más ayuda: aunque sean sesiones cortas, mantén el ritmo.`});
    }
  }

  // ═ B) PESO CORPORAL ═
  if(weight.trend!=='insufficient'){
    const abs=Math.abs(parseFloat(weight.perWeek));
    if(weight.trend==='losing'&&abs>=0.2&&abs<=0.8){
      insights.push({type:'good',ic:'🔥',t:'Bajas a buen ritmo',d:`Bajas <strong>${abs} kg/semana</strong> de media (${kgSign(weight.change)}${NB}kg en ${plural(Math.round(weight.days),'día')}). Es un ritmo moderado: así es más fácil conservar la fuerza.`});
    }else if(weight.trend==='losing_fast'){
      insights.push({type:'warn',ic:'⚡',t:'Bajas rápido',d:`Pierdes <strong>${abs} kg/semana</strong>. Si va acompañado de debilidad en el gym, podrías estar perdiendo músculo también. La pérdida de peso depende sobre todo de lo que comes: para eso, un dietista-nutricionista.`});
    }else if(weight.trend==='flat'){
      if(consistency.rate>=0.75){
        insights.push({type:'info',ic:'⚖️',t:'Peso estable',d:`Tu peso lleva ${plural(Math.round(weight.days),'día')} estable. Si buscas perder grasa, lo que más influye es lo que comes: para eso, un dietista-nutricionista. Si no es tu prioridad, es normal mientras ganas fuerza.`});
      }
    }else if(weight.trend==='gaining'&&weight.change>0.5){
      insights.push({type:'info',ic:'📈',t:'Has ganado peso',d:`Subiste <strong>${kgTxt(Math.round(weight.change*10)/10)}${NB}kg</strong> en ${plural(Math.round(weight.days),'día')}. Si entrenas constante, parte puede ser músculo. Si buscas perder grasa, revisa tu alimentación.`});
    }
  }

  // ═ C) BALANCE DE SESIONES ═
  if(balance.total>=6&&!balance.balanced){
    const worst=Object.entries(balance.cnt).sort((a,b)=>a[1]-b[1])[0];
    // (E1a) todos los días de tu rutina (2-6), sin dar por hecho A, B y C
    insights.push({type:'warn',ic:'⚖️',t:'Desbalance de días',d:`Has hecho <strong>${_joinY(balance.keys.map(k=>plural(balance.cnt[k],'día')+' '+k))}</strong>. El día ${worst[0]} quedó relegado: seguir la rotación de tus días mantiene el equilibrio.`});
  }

  // ═ D) PROGRESIÓN POR EJERCICIO ═ (mismo diagnóstico que el análisis detallado y las propuestas)
  const strengthEx=Object.values(routinePlan()).flatMap(d=>d.ex).filter(e=>!e.cardio);
  const pctTxt=v=>(v>=0?'+':'−')+Math.abs(v).toFixed(Math.abs(v)<10?1:0)+NB+'%';

  if(an.strong.length>0){
    // (los de lastre, detrás: su % es solo del lastre; si es el único, en kilos de lastre)
    const top=an.strong.slice().sort((a,b)=>(a.p.lastre?1:0)-(b.p.lastre?1:0)||b.p.pct-a.p.pct)[0];
    const nov=_coachNovato()?' Los principiantes ganan fuerza rápido — aprovecha esta ventana.':''; // (C13) solo a quien empieza
    if(top.p.lastre)insights.push({type:'good',ic:'🏆',t:'Progresión excepcional',d:`En <strong>${esc(top.ex.n)}</strong> ${top.p.lastV>top.p.firstV?`llevas más lastre: de ${esc(kgTxt(top.p.firstV))} a <strong>${esc(kgTxt(top.p.lastV))} kg</strong>`:`haces más con <strong>${esc(kgTxt(top.p.lastV))} kg</strong> de lastre`} en tus últimas ${top.p.sessions} sesiones.${nov}`});
    else insights.push({type:'good',ic:'🏆',t:'Progresión excepcional',d:`En <strong>${esc(top.ex.n)}</strong> ${_progWhat(top.p).su} ${_progWhat(top.p).v} un <strong>${pctTxt(top.p.pct)}</strong> en tus últimas ${top.p.sessions} sesiones (${esc(_progExcRange(top.p))}).${nov}`});
  }

  if(an.up.length>=2){
    const names=an.up.slice(0,3).map(x=>esc(x.ex.n)).join(', ');
    const dp=an.up.filter(x=>x.p.repsUp).length;
    insights.push({type:'good',ic:'💪',t:'Fuerza subiendo',d:`Progresas en <strong>${an.up.length}</strong> ejercicio${an.up.length!==1?'s':''}: ${names}${an.up.length>3?` y ${an.up.length-3} más`:''}.${dp?` ${dp} con doble progresión (mismo peso, más reps): así se hace.`:''}`});
  }

  // Primero el ejercicio cuya propuesta está activa: el «próximo paso» nombra la que ves (o verás) arriba
  const byStep=arr=>arr.slice().sort((a,b)=>_coachStepRank(a,an,pend,resIds)-_coachStepRank(b,an,pend,resIds));
  if(an.stagnant.length>0){
    const st=byStep(an.stagnant);
    const next=_coachNextStep(st[0],an,pend,resIds);
    insights.push({type:'warn',ic:'🔀',t:'Estancamiento detectado',d:`${_namesList(st)} ${st.length>1?'llevan':'lleva'} 4+ sesiones (3+ semanas) sin mejorar ${st.every(i=>i.p.metric==='e1rm')?'peso ni reps':st.length===1?_progWhat(st[0].p).su:'su marca'}.${next?` Próximo paso${st.length>1?` en ${esc(st[0].ex.n)}`:''}: ${esc(next)}.`:''}`});
  }

  if(an.down.length>0){
    const dn=byStep(an.down);
    const next=_coachNextStep(dn[0],an,pend,resIds);
    insights.push({type:'bad',ic:'📉',t:'Retroceso',d:`En ${_namesList(dn)} llevas dos sesiones seguidas por debajo de tu nivel. Puede ser fatiga, mala técnica o falta de sueño.${next?` Próximo paso${dn.length>1?` en ${esc(dn[0].ex.n)}`:''}: ${esc(next)}.`:''}`});
  }

  // En espera: recién cambiados, en descarga o recuperándose. El Coach no propone nada nuevo para ellos todavía.
  if(an.held.length>0){
    const parts=an.held.map(x=>`<strong>${esc(x.ex.n)}</strong> (${esc(_holdTxt(x))})`),n=parts.length;
    const txt=n===1?parts[0]:n<=3?`${parts.slice(0,-1).join(', ')} y ${parts[n-1]}`:`${parts.slice(0,2).join(', ')} y ${n-2} más`;
    insights.push({type:'info',ic:'⏳',t:'Dale unas sesiones',d:`${txt}. Antes de proponerte otro cambio ${n>1?'en estos ejercicios':'en este ejercicio'}, el Coach espera a ver cómo ${n>1?'responden':'responde'}.`});
  }

  // ═ E) HITOS Y RÉCORDS ═
  const totalSessions=S.sessions.length;
  const milestones=[10,20,30,50,75,100];
  const justHit=milestones.find(m=>totalSessions===m);
  if(justHit){
    insights.push({type:'good',ic:'🎖️',t:`¡Llegaste a ${justHit} sesiones!`,d:'Un hito importante. La mayoría de la gente que empieza el gym abandona antes de este punto. Has demostrado disciplina.'});
  }

  // Primer ejercicio en superar peso corporal: solo con barra (Smith, libre), donde el peso que mueves es el total. La
  // prensa y las máquinas lo superan sin más, las mancuernas y kettlebells son por mano y el lastre se suma a tu peso.
  const weightEx=strengthEx.filter(ex=>exLT(ex)==='w'&&loadEqClass(ex)==='barra').map(ex=>{
    const data=S.strength[ex.id]||[];
    const last=data[data.length-1]?.v||0;
    return{ex,last};
  }).filter(x=>x.last>0);
  const bwKg=S.weights[S.weights.length-1]?.v||0; // (E12) sin suponer un peso (antes 105 kg)
  const overBw=bwKg?weightEx.filter(x=>x.last>=bwKg):[];
  if(overBw.length>0&&!S.coachInsights?.shownBodyweight){
    const top=overBw.sort((a,b)=>b.last-a.last)[0];
    insights.push({type:'good',ic:'🚀',t:'Superas tu peso corporal',d:`En <strong>${esc(top.ex.n)}</strong> mueves ${top.last} kg — más que tu propio peso (${bwKg} kg). Bienvenido al club.`});
    // Marcar como mostrado para no repetir — diferir la mutación fuera del render
    if(!S.coachInsights)S.coachInsights={};
    S.coachInsights.shownBodyweight=true;
    queueMicrotask(()=>saveState());
  }

  // ── Vínculo peso corporal ↔ rendimiento ──
  const bwInsight=coach_bodyweightPerformanceInsight();
  if(bwInsight){
    insights.push({
      type:bwInsight.type,
      ic:bwInsight.ic,
      t:bwInsight.title,
      d:bwInsight.description+(bwInsight.bw?` <span style="opacity:.6;font-family:'DM Sans',sans-serif;font-size:12px">[${bwInsight.bw}]</span>`:'')
    });
  }

  // ═ F) RPE ACUMULADO POR ZONA MUSCULAR ═
  const rpeZones=coach_rpeByMuscle(6);
  if(rpeZones&&rpeZones.length>0){
    const hot=rpeZones.filter(z=>z.avg>=2.6&&z.samples>=3);
    if(hot.length>0){
      const muscleLbl=MUSCLE_GROUPS.find(m=>m.id===hot[0].muscle)?.label||hot[0].muscle;
      insights.push({type:'warn',ic:'🔥',t:'Zona con RPE alto sostenido',d:`Tus últimas sesiones de <strong>${esc(muscleLbl)}</strong> promedian RPE ${hot[0].avg} ("al límite"). Considera bajar 5 % el peso o añadir 1 día de descanso entre sesiones que la trabajen.`});
    }
    const cool=rpeZones.filter(z=>z.avg<=1.4&&z.samples>=3);
    // Sin «margen para subir» si toca descargar o ya estás en descarga (no contradecir a la propuesta)
    if(cool.length>0&&hot.length===0&&!an.fatigue.deloadNeeded&&!getActiveDeload()){
      const muscleLbl=MUSCLE_GROUPS.find(m=>m.id===cool[0].muscle)?.label||cool[0].muscle;
      insights.push({type:'info',ic:'📈',t:'Margen para progresar',d:`Tus sesiones de <strong>${esc(muscleLbl)}</strong> promedian RPE ${cool[0].avg} ("fácil"). Hay espacio para subir peso o reps con seguridad.`});
    }
  }

  // ═ G) DENSIDAD DE SESIÓN ═
  const dens=coach_sessionDensity(5);
  if(dens){
    if(dens.avg>90){
      insights.push({type:'warn',ic:'⏱️',t:'Sesiones muy largas',d:`Tus últimas ${dens.samples} sesiones duran <strong>${dens.avg} min</strong> de media. Más de 90 min suele indicar descansos largos o distracciones — intenta cerrarlas en 60-75 min.`});
    }else if(dens.avg>=45&&dens.avg<=75){
      insights.push({type:'good',ic:'⏱️',t:'Buen ritmo de sesión',d:`Sesiones de <strong>${dens.avg} min</strong> de media: tiempo de sobra para tus series sin alargarte.`});
    }else if(dens.avg<30&&dens.samples>=3){
      insights.push({type:'info',ic:'⚡',t:'Sesiones cortas',d:`Promedias <strong>${dens.avg} min</strong>. Sesiones cortas funcionan si la intensidad es alta — revisa que estés llegando al RPE objetivo.`});
    }
  }

  // ═ H) DESCANSO / INACTIVIDAD ═
  const activeRest=getActiveRest();
  if(activeRest){
    // Semana de descanso planificada: mensaje positivo, sin avisos de inactividad
    const dleft=restDaysLeft(activeRest);
    insights.push({type:'info',ic:'🌴',t:'Semana de descanso',d:`Estás en una semana de descanso planificada${dleft>0?` · quedan <strong>${dleft} día${dleft!==1?'s':''}</strong>`:''}. El descanso es parte del progreso: recuperas mejor y vuelves con más fuerza; tu constancia no se penaliza.`});
  }else{
    const daysSinceLast=coach_daysSinceLastSession();
    if(daysSinceLast!=null){
      if(daysSinceLast>=7&&daysSinceLast<=14){
        insights.push({type:'warn',ic:'⏳',t:'Llevas días sin entrenar',d:`Última sesión hace <strong>${daysSinceLast} días</strong>. El cuerpo conserva fuerza ~1-2 semanas — vuelve con tu peso de siempre y marca bien el esfuerzo: si te cuesta, el Coach no te sube hasta que vuelvas a tu nivel.`});
      }else if(daysSinceLast>14){
        insights.push({type:'bad',ic:'🔄',t:'Pausa larga',d:`Más de <strong>${daysSinceLast} días</strong> sin entrenar. Esta pausa ya cuenta como descanso: no te hace falta una descarga. En tu primera sesión repite tu último peso (el Coach no sube hasta que lo hagas) y, si te cuesta, baja un poco.`});
      }
    }
  }

  return insights;
}

// ─── 3. ANÁLISIS DETALLADO (del mismo diagnóstico que las propuestas) ──
// Cada ejercicio sale en un solo sitio: «Mantener» (progresa y no se toca), «A vigilar» (sin cambio propuesto)
// o en las propuestas. La descarga es temporal: después se vuelve a este mismo plan.
function coach_detailHtml(an,pv){
  const pending=pv.active.concat(pv.reserve);
  const pendEx=new Set(pending.map(p=>p.exId).filter(Boolean));
  const pendIds=new Set(pending.map(p=>p.id));
  const pctTxt=v=>(v>=0?'+':'−')+Math.abs(v).toFixed(Math.abs(v)<10?1:0)+NB+'%';
  const hasDeload=!!getActiveDeload()||an.candidates.some(c=>c.type==='deload')||pending.some(p=>p.type==='deload');
  // Los ejercicios «en espera» (recién cambiados, en descarga o recuperándose) van a «Vigilar» con su motivo
  const keep=an.up.filter(i=>!i.hold&&!an.candByEx[i.ex.id]&&!pendEx.has(i.ex.id)).sort((a,b)=>b.p.pct-a.p.pct);
  const watch=an.items.filter(i=>(i.hold||['flat','stagnant','down'].includes(i.p.trend))&&!an.candByEx[i.ex.id]&&!pendEx.has(i.ex.id))
    .sort((a,b)=>(b.hold?1:0)-(a.hold?1:0));
  const row=(sym,cls,txt)=>`<div class="rec-diff-row"><span class="sym ${cls}">${sym}</span><span>${txt}</span></div>`;
  let h='';
  if(keep.length){
    h+=`<div class="rec-card">
      <div class="rec-head"><span class="rec-badge high">Mantener</span><div class="rec-title">No cambies lo que funciona</div></div>
      <div class="rec-body">${keep.length} ejercicio${keep.length!==1?'s':''} progresa${keep.length!==1?'n':''}: mantén ejercicio, series y reps.${hasDeload?' La descarga es temporal: después vuelves a este mismo plan.':''}</div>
      <div class="rec-diff">${keep.slice(0,4).map(i=>row('✓','add',`${esc(i.ex.n)}: ${i.p.lastre?`lastre ${i.p.lastV!==i.p.firstV?esc(kgTxt(i.p.firstV))+' → ':''}${esc(kgTxt(i.p.lastV))}${NB}kg`:`${_progWhat(i.p).sh} ${pctTxt(i.p.pct)}`}${i.p.repsUp?' · más reps, mismo peso':''}`)).join('')}
        ${keep.length>4?row('+','add',`y ${keep.length-4} más`):''}</div>
    </div>`;
  }
  if(watch.length){
    const st=i=>i.hold?(i.hold.kind==='changed'?`${_holdTxt(i)} · dale unas sesiones`:_holdTxt(i))
      :i.p.trend==='down'?(i.covered==='deload'?'por debajo de tu nivel · lo cubre la descarga':'por debajo de tu nivel · si sigue, el Coach lo ajustará')
      :i.p.trend==='stagnant'?`${i.p.stagSessions}+ sesiones sin mejorar`:'estable · sigue el plan';
    h+=`<div class="rec-card">
      <div class="rec-head"><span class="rec-badge med">Vigilar</span><div class="rec-title">Sin cambios por ahora</div></div>
      <div class="rec-diff">${watch.slice(0,5).map(i=>i.hold?row('…','hold',`${esc(i.ex.n)}: ${esc(st(i))}`)
        :row(i.p.trend==='down'?'▼':i.p.trend==='stagnant'?'▬':'=','ch',`${esc(i.ex.n)}: ${st(i)}`)).join('')}
        ${watch.length>5?row('+','ch',`y ${watch.length-5} más`):''}</div>
    </div>`;
  }
  const next=an.preview.active.filter(p=>!pendIds.has(p.id));
  const nRes=an.preview.reserve.filter(p=>!pendIds.has(p.id)).length;
  h+=`<div class="rec-card">
    <div class="rec-head"><span class="rec-badge">Próximo ciclo</span><div class="rec-title">Al cerrar el ciclo te propondré</div></div>
    ${next.length?`<div class="rec-diff">${next.map((p,i)=>row(String(i+1),_propPrio(p)<=1?'ch':'add',`${esc(p.title)}${p.diff?` <span class="rec-chip">${_nwUnits(esc(p.diff))}</span>`:''}`)).join('')}
      ${nRes?row('…','ch',`y ${nRes} más en reserva (máx. ${PROP_MAX_TOTAL} cambios por ciclo y 1 por día)`):''}</div>`
      :`<div class="rec-body" style="margin:0">${pending.length?'Tus propuestas actuales siguen vigentes.':'Ningún cambio: tu plan funciona. Sigue así.'}</div>`}
  </div>`;
  return h;
}

// Alternativas del Coach de antes del catálogo: para estos ejercicios van primero, tal cual (las mismas propuestas y
// razones de siempre); detrás, las del catálogo (alt/why de su fila).
const COACH_ALTS={
  lib_squat_smith:[['lib_leg_press','misma musculatura con la espalda apoyada: más carga con menos técnica'],['lib_goblet_squat','sentadilla libre y ligera para afinar técnica y profundidad']],
  lib_leg_press:[['lib_squat_smith','patrón de sentadilla guiado: más trabajo de glúteo y core'],['lib_goblet_squat','sentadilla libre y ligera para afinar técnica y profundidad']],
  lib_goblet_squat:[['lib_leg_press','más carga con la espalda apoyada'],['lib_squat_smith','patrón guiado para seguir subiendo peso']],
  lib_leg_ext:[['lib_leg_press','cuádriceps con un movimiento compuesto: más carga total'],['lib_goblet_squat','cuádriceps y glúteo con un patrón funcional']],
  lib_leg_curl:[['lib_leg_curl_seated','cambia el ángulo de la cadera: más estiramiento del femoral'],['lib_rdl_db','femoral y glúteo en estiramiento, con mancuernas']],
  lib_leg_curl_seated:[['lib_leg_curl','tumbado: otro ángulo para el femoral'],['lib_rdl_db','femoral y glúteo en estiramiento, con mancuernas']],
  lib_rdl_db:[['lib_leg_curl_seated','aísla el femoral sin cargar la espalda']],
  lib_press_incline_smith:[['lib_press_incline_db','más recorrido y cada brazo trabaja por su cuenta'],['lib_press_flat_db','press plano: otro ángulo para el pecho']],
  lib_press_flat_db:[['lib_press_incline_smith','guiado e inclinado: más pecho superior'],['lib_press_incline_db','inclinado: más pecho superior']],
  lib_press_incline_db:[['lib_press_incline_smith','guiado: más estable para subir peso'],['lib_press_flat_db','press plano: otro ángulo para el pecho']],
  lib_fly_machine:[['lib_cable_fly_low','tensión constante y énfasis en la parte alta del pecho'],['lib_cable_fly_high','tensión constante y énfasis en la parte baja del pecho']],
  lib_cable_fly_low:[['lib_fly_machine','más estable: centras el esfuerzo en el pecho'],['lib_cable_fly_high','otro ángulo: pecho inferior']],
  lib_cable_fly_high:[['lib_fly_machine','más estable: centras el esfuerzo en el pecho'],['lib_cable_fly_low','otro ángulo: pecho superior']],
  lib_pushup:[['lib_press_flat_db','permite subir la carga poco a poco']],
  lib_lat_pulldown:[['lib_pullover_db','trabaja el dorsal con otro ángulo y más estiramiento'],['lib_row_cable','tirón horizontal: dorsal y espalda media']],
  lib_pullover_db:[['lib_lat_pulldown','tirón vertical: más carga para el dorsal']],
  lib_row_machine:[['lib_row_cable','agarre libre y más recorrido para la espalda media'],['lib_row_db','un brazo cada vez: corrige desequilibrios']],
  lib_row_db:[['lib_row_cable','tensión constante en todo el recorrido'],['lib_row_machine','con apoyo de pecho: más estable para subir peso']],
  lib_row_cable:[['lib_row_machine','con apoyo de pecho: más estable para subir peso'],['lib_row_db','un brazo cada vez: corrige desequilibrios']],
  lib_face_pull:[['lib_rev_fly_machine','deltoides posterior con un recorrido guiado']],
  lib_rev_fly_machine:[['lib_face_pull','deltoides posterior con rotación externa: muy sano para el hombro']],
  lib_lat_raise_cable:[['lib_lat_raise_db','otra curva de resistencia: más tensión arriba']],
  lib_lat_raise_db:[['lib_lat_raise_cable','tensión constante desde abajo']],
  lib_shoulder_press_db:[['lib_shoulder_press_machine','guiado: más seguro para subir peso']],
  lib_shoulder_press_machine:[['lib_shoulder_press_db','más recorrido y estabilidad del hombro']],
  lib_front_raise_db:[['lib_shoulder_press_machine','deltoides frontal con un press guiado']],
  lib_curl_cable:[['lib_hammer_curl','agarre neutro: suma el braquial y el antebrazo'],['lib_curl_db','un brazo cada vez, con supinación'],['lib_curl_machine','con apoyo: aísla mejor el bíceps']],
  lib_curl_db:[['lib_curl_cable','tensión constante en todo el recorrido'],['lib_hammer_curl','agarre neutro: suma el braquial']],
  lib_hammer_curl:[['lib_curl_cable','tensión constante en todo el recorrido']],
  lib_curl_machine:[['lib_curl_db','más libertad de movimiento']],
  lib_curl_db_concentrated:[['lib_curl_cable','tensión constante en todo el recorrido']],
  lib_tricep_pushdown:[['lib_tricep_overhead_cable','brazos sobre la cabeza: más estiramiento de la cabeza larga del tríceps'],['lib_tricep_machine','con apoyo: más estable para subir peso']],
  lib_tricep_overhead_cable:[['lib_tricep_pushdown','más carga con los codos pegados']],
  lib_tricep_machine:[['lib_tricep_pushdown','tensión constante en polea']],
  lib_skull_crusher_db:[['lib_tricep_overhead_cable','mismo estiramiento con menos estrés en el codo']],
  lib_crunch_cable:[['lib_crunch_machine','más estable: centras el esfuerzo en el abdomen'],['lib_leg_raise','abdomen inferior con tu peso corporal']],
  lib_crunch_machine:[['lib_crunch_cable','más recorrido y tensión constante']],
  lib_plank:[['lib_crunch_cable','permite progresar con carga']],
  lib_leg_raise:[['lib_crunch_cable','permite progresar con carga']],
};
// Alternativas de un ejercicio de la biblioteca, en orden: [[id, razón o undefined]]. Las de antes primero (COACH_ALTS, tal
// cual), detrás las de su fila (alt con su why), sin repetir. Las usan el Coach y «¿Máquina ocupada?».
function libAlts(L){
  if(!L)return[];const old=COACH_ALTS[L.id]||[];
  return old.concat(L.alt.map((id,i)=>[id,L.why[i]]).filter(([id])=>!old.some(a=>a[0]===id)));
}
// Devuelve {id, n, reason, lib} de un ejercicio de la biblioteca que no esté ya en el plan, o null. Siempre de fuerza y
// que se pueda hacer donde entrenas (routinePlace). Orden: sus alternativas (libAlts: las de antes, tal cual y con su
// razón → las del catálogo, con su razón why o una generada) → por parecido: mismo patrón, patrón cercano, músculos
// parecidos o mismo grupo (mejor del mismo grupo y del mismo tipo, compuesto o de aislamiento).
function coach_suggestAlternative(ex){
  if(!ex||ex.cardio)return null;
  const src=_libIdOf(ex),L=src?LIB_BY_ID.get(src):null,inPlan=_planLibIds(),dk=_dayOfEx(ex.id)||S.day;
  // (E3c) con el material del sitio de ese día (canDoHere); sin tus sitios, como siempre
  // (C11) a uno de equilibrio solo le vale otro de equilibrio (antes, en un gimnasio sin más, le salía una máquina de su grupo muscular)
  const ok=id=>{const l=LIB_BY_ID.get(id);return l&&!l.cardio&&id!==src&&!inPlan.has(id)&&canDoHere(l,dk)&&(!L||L.pat!=='bal'||l.pat==='bal')?l:null;};
  const muscle=ex.muscle||(L&&L.muscle),p=L&&L.pat;
  const why=l=>p&&l.pat===p?`mismo patrón (${PAT_LBL[p].toLowerCase()}) ${l.mat!==L.mat?'con otro material':'con otra variante'}`:l.muscle===muscle?'mismo grupo muscular con otro estímulo':'trabaja músculos parecidos con otro ejercicio';
  for(const [id,reason] of libAlts(L)){const l=ok(id);if(l)return{id:l.id,n:l.n,reason:reason||why(l),lib:l};}
  // Por parecido (también los personalizados: por su grupo muscular)
  if(!muscle&&!L)return null;
  const v=L?_libVec(L.id):null,comp=isCompoundEx(ex);
  const tier=l=>p&&l.pat===p?0:p&&(PAT_NEAR[p]||[]).includes(l.pat)?1:v&&_cosSim(v,_libVec(l.id))>=.5?2:l.muscle===muscle?3:-1;
  let pick=null,best=99;
  EXERCISE_DB.forEach(l=>{if(!ok(l.id))return;const t=tier(l);if(t<0)return;
    const sc=t*4+(l.muscle===muscle?0:2)+(!!l.compound===comp?0:1);if(sc<best){best=sc;pick=l;}});
  return pick?{id:pick.id,n:pick.n,reason:why(pick),lib:pick}:null;
}

// ─── 4. APLICAR RECOMENDACIONES AL PLAN ───────────────────

function coach_applyRecommendations(){
  confirmModal({
    title:'Cerrar ciclo actual',
    body:'Se archivará el ciclo con su resumen y empezará uno nuevo de 4 semanas. El Coach te dejará sus propuestas (máx. 3 cambios) y tú decides cuáles aplicar.',
    okText:'Cerrar ciclo',
    cancelText:'Cancelar',
    onOk:coach_applyRecommendationsConfirmed
  });
}
// (E6, §G.5) Al cerrar el primer ciclo con la rutina generada, la rampa (planMeta.rampa: 65 o más y empezar de cero): pasar a 3 series
// en los multiarticulares que van con 2. Propone, no aplica; las 3 primeras activas, el resto en reserva.
function _rampProposals(){
  const pm=_isPlainObj(S.planMeta)?S.planMeta:null;if(!pm||!pm.rampa)return[];
  if((S.mesocycles||[]).some(m=>m&&+m.appliedAt>=pm.ts))return[]; // solo el primer ciclo
  const n=pm.rampa.series||3,now=Date.now(),out=[],p=getPlan();
  dayKeys(p).forEach(k=>(p[k].ex||[]).forEach(e=>{const ex=routineEx(e);if(!ex||ex.cardio||out.length>=6||out.some(o=>o.exId===ex.id))return;
    const s=_baseSets(ex);if(s>=n||!isCompoundEx(ex))return;
    out.push({id:'ramp_'+ex.id,type:'add_set',basis:'ramp',prio:1,sev:-s,ic:'📈',tag:'Primer ciclo',exId:ex.id,dayKey:k,createdAt:now,reserve:out.length>=3,
      title:`${ex.n}: pasa a ${s+1} series`,diff:`${s}×${_tgtShort(ex)} → ${s+1}×${_tgtShort(ex)}`,short:`pasar a ${s+1} series`,
      description:`Has cerrado tu primer ciclo con esta rutina: ya puedes pasar a ${s+1} series${pm.rampa.reps?` de ${pm.rampa.reps} repeticiones`:''}${pm.rampa.rir!=null?`, dejando unas ${pm.rampa.rir} en la recámara`:''}. Nunca al límite.`});}));
  return out;
}
// (E14a, §G.5) Con 65 o más y sin rodilla, cadera ni «Otra zona» (planMeta.pot): al cerrar el primer ciclo con la rutina,
// «Levantarse de la silla rápido» en el primer día donde se pueda (una sola vez; nunca lo pone el generador)
function _powerProposals(){
  const pm=_isPlainObj(S.planMeta)?S.planMeta:null;if(!pm||!pm.pot)return[];
  if((S.mesocycles||[]).some(m=>m&&+m.appliedAt>=pm.ts))return[]; // solo el primer ciclo
  const L=LIB_BY_ID.get('lib_chair_stand_fast'),p=getPlan();if(!L||_planLibIds().has(L.id))return[];
  const dk=liveDayKeys(p).find(k=>canDoHere(L,k));if(!dk)return[];
  return[{id:'power_'+dk,type:'add_ex',basis:'power',prio:1,sev:0,ic:'⚡',tag:'Primer ciclo',dayKey:dk,libExId:L.id,createdAt:Date.now(),
    title:'¿Añadimos un ejercicio de potencia?',diff:`+ ${L.n} · ${L.s}×${_tgtShort(L)}`,short:`añadir ${L.n}`,
    description:`Has cerrado tu primer ciclo. A partir de los 65, ganar rapidez ayuda a levantarte, subir escaleras o reaccionar a un tropiezo: «${L.n}» al empezar el ${p[dk].label}, ${L.s} series de ${L.r}, rápido al subir y despacio al bajar.`}];
}
function coach_applyRecommendationsConfirmed(){
  const cycle=coach_cycleData();
  const an=coach_analyze();
  const insights=coach_generateInsights(an,[]);

  // Propuestas reales (todas, ordenadas por prioridad): las 3 primeras activas, el resto en reserva
  const proposals=_rampProposals().concat(_powerProposals(),coach_generateProposals(cycle,an)); // (E6) la rampa del primer ciclo, delante; (E14a) la potencia
  S.pendingCoachProposals=_sanitizeProposals(proposals);
  const nAct=proposals.filter(p=>!p.reserve).length,nRes=proposals.length-nAct;

  const summary=`Ciclo completado: ${plural(cycle.sessions.length,'sesión','sesiones')} en ${plural(Math.max(1,Math.round(cycle.weeks)),'semana')}. ${nAct} propuesta${nAct!==1?'s':''} del coach${nRes?` (+${nRes} en reserva)`:''}.`;
  const mesocycle={
    num:(S.mesocycles?.length||0)+1,startTs:cycle.start,endTs:Date.now(),appliedAt:Date.now(),
    sessionCount:cycle.sessions.length,summary,
    insights:insights.map(i=>({t:i.t,d:i.d,type:i.type})),
  };
  if(!S.mesocycles)S.mesocycles=[];
  S.mesocycles.push(mesocycle);
  S.coachInsights=null;S.coachInsightsStale=true;S.coachLastAnalyzed=Date.now();
  S.coachStart=Date.now(); // reiniciar ciclo
  saveState();

  // (13e r1) La «Semana de descarga» del ciclo no cuenta como propuesta si ya sale como recomendación (o está en espera)
  const reco=coach_deloadReco(),dlOff=!!reco||_dlSnoozedOffer();
  const dlP=dlOff&&coach_pendingView().active.some(p=>p.type==='deload');
  const nP=dlP?coach_pendingView().active.filter(p=>p.type!=='deload').length:nAct;
  const pTxt=`${nP} propuesta${nP!==1?'s':''} ${nP!==1?'esperan':'espera'} tu decisión`;
  const msg=dlP&&reco?`🚀 Ciclo cerrado · te recomiendo una semana de descarga${nP?` y ${pTxt}`:''}`
    :nP>0?`🚀 Ciclo cerrado · ${pTxt}`
    :`🚀 Nuevo ciclo iniciado · ${plural(cycle.sessions.length,'sesión completada','sesiones completadas')}`;
  toast(msg,3500);
  go('coach');
  // (14d) Con la oferta de su resumen arriba («Tu ciclo N»), el Coach se queda arriba: la tarjeta, la recomendación de
  // descarga justo debajo y su atajo a las propuestas. Sin ella (ciclo sin sesiones con fecha), como antes.
  if(wrapCycleOffer())return;
  if(dlP&&reco)goDeloadReco();else if(nP>0)goCoachProposals();
}
// (E15, §G.5 · 43 I-5) Tras cerrar un ciclo (dos semanas como mucho), en el Coach: «Seguir igual» · «Subir un poco (más series o
// variantes)» · con rutina generada, «Rutina nueva con mis respuestas» (regenera con tus respuestas y el nivel que ya has entrenado,
// pasando por «Qué cambia en tu rutina»). Una vez por ciclo (profile.dismiss.cycle).
function _cycleLast(){const ms=(S.mesocycles||[]).filter(m=>_isPlainObj(m)&&+m.appliedAt>0);return ms.length?ms[ms.length-1]:null;}
function cycleNextCardHtml(){
  const p=S.profile,m=_cycleLast();if(!p||!m||Date.now()-m.appliedAt>14*864e5||(p.dismiss&&+p.dismiss.cycle>=+m.appliedAt))return'';
  const gen=p.mode==='gen';
  return`<div class="card cyc-next" id="cyc-next"><div class="cyc-next-t">Ciclo cerrado: ¿cómo seguimos?</div>
    <div class="cyc-next-d">Tu rutina sigue como está hasta que elijas.</div>
    <div class="cyc-next-b"><button type="button" class="btn bs" onclick="cycleNext('igual')">Seguir igual</button>
    <button type="button" class="btn bs" onclick="cycleNext('subir')">Subir un poco</button>
    ${gen?`<button type="button" class="btn bp" onclick="cycleNext('nueva')">Rutina nueva con mis respuestas</button>`:''}</div></div>`;
}
function _cycleUpProposals(){
  const p=getPlan(),now=Date.now(),out=[],inPlan=_planLibIds();
  dayKeys(p).forEach(k=>(p[k].ex||[]).forEach(e=>{const ex=routineEx(e);if(!ex||ex.cardio||out.length>=6||out.some(o=>o.exId===ex.id))return;
    const L=exLib(ex);if(L&&L.pat==='bal')return;
    const base={basis:'cycle',prio:1,ic:'📈',tag:'Subir un poco',exId:ex.id,dayKey:k,createdAt:now},s=_baseSets(ex);
    if(isCompoundEx(ex)&&s<4){out.push(Object.assign({},base,{id:'up_'+ex.id,type:'add_set',sev:-s,title:`${ex.n}: pasa a ${s+1} series`,diff:`${s}×${_tgtShort(ex)} → ${s+1}×${_tgtShort(ex)}`,
      short:`pasar a ${s+1} series`,description:`Has elegido subir un poco: una serie más en «${ex.n}», sin llegar al límite.`}));return;}
    const up=L&&L.up?LIB_BY_ID.get(L.up):null;
    if(up&&['bw','r','t'].includes(L.lt)&&!inPlan.has(up.id)&&canDoHere(up,k))out.push(Object.assign({},base,{id:'upv_'+ex.id,type:'swap',sev:0,libExId:up.id,
      title:`Cambiar ${ex.n} por ${up.n}`,diff:`${ex.n} → ${up.n}`,short:`cambiar a ${up.n}`,description:`Has elegido subir un poco: la variante siguiente de «${ex.n}». ${_histStaysTxt(ex)}`}));
  }));
  return out;
}
function cycleNext(k){
  const p=S.profile;if(!p)return;p.dismiss=Object.assign({},p.dismiss,{cycle:Date.now()});S.profile=_sanitizeProfile(p);
  if(k==='subir'){const add=_cycleUpProposals();S.pendingCoachProposals=_sanitizeProposals(add.concat(S.pendingCoachProposals||[]));saveState();render();
    if(add.length){goCoachProposals();toast(`${plural(add.length,'propuesta','propuestas')} para subir un poco: tú decides`,3000);}else toast('Tu rutina ya está en lo alto: sigue así',2800);return;}
  if(k==='nueva'&&p.mode==='gen'){saveState();showOnboarding({from:'settings',step:'ob-resp'});_obPrefill();_ob.hist=[];_ob.fromCycle=true;obRespReview();return;}
  saveState();render();toast('Seguimos igual: el Coach sigue ajustando tus pesos',2600);
}
// Abre el Coach con sus propuestas a la vista (desde Inicio o al cerrar el ciclo)
function goCoachProposals(){
  if(S.tab!=='coach')go('coach');
  requestAnimationFrame(()=>{const el=document.getElementById('coach-props');if(el)el.scrollIntoView({block:'start'});});
}

// ─── ANÁLISIS SEMANAL (mini-insight cada 7 días) ─────────────

function coach_weekRange(offsetWeeks){
  // offsetWeeks: 0 = esta semana, 1 = la pasada, etc
  // Lunes 00:00 como inicio de semana
  const now=new Date();
  const day=now.getDay()||7;
  const monday=new Date(now);
  monday.setHours(0,0,0,0);
  monday.setDate(now.getDate()-(day-1)-7*offsetWeeks);
  const sunday=new Date(monday);
  sunday.setDate(monday.getDate()+6);
  sunday.setHours(23,59,59,999);
  return{start:monday.getTime(),end:sunday.getTime(),startStr:fmtDate(monday),endStr:fmtDate(sunday)};
}

function coach_weekStats(offsetWeeks){
  const r=coach_weekRange(offsetWeeks);
  const sessions=S.sessions.filter(s=>s.ts>=r.start&&s.ts<=r.end);
  // Volumen total: kilos movidos en esa semana (peso × repeticiones de cada serie; C13)
  // Match preciso: registro de fuerza cuyo ts cae dentro de ±2h de la sesión (evita colisiones del mismo día con otra rutina)
  let totalVolume=0,avgRpe=0,rpeCount=0;
  // (E1a) Los registros de cada sesión se buscan en todo tu historial, no en los ejercicios de la rutina de ahora: al
  // cambiar de rutina o de días, las semanas pasadas no cambian (y cuentan también los ejercicios «solo hoy»)
  const ids=Object.keys(S.strength||{}).filter(id=>Array.isArray(S.strength[id])&&S.strength[id].length);
  sessions.forEach(sess=>{
    ids.forEach(id=>{
      const recs=S.strength[id];
      // El registro vinculado a esta sesión: el más cercano dentro de ±2h
      let best=null,bestDiff=Infinity;
      for(const rec of recs){
        if(!rec||!rec.ts)continue;
        const diff=Math.abs(rec.ts-sess.ts);
        if(diff<7200000&&diff<bestDiff){best=rec;bestDiff=diff;}
      }
      if(best){
        // (C13) kilos movidos: peso × repeticiones de cada serie (antes, peso × series: pasar de 12 a 8 repeticiones con más peso
        // salía como «más volumen»). Los registros sin series, con sus reps; sin reps apuntadas (antiguos, o por tiempo), 10 por serie
        {const ss=Array.isArray(best.sets)?best.sets.filter(x=>x&&+x.w>0&&+x.r>0):[];
          totalVolume+=ss.length?ss.reduce((t,x)=>t+(+x.w)*(+x.r),0):(+best.v||0)*(parseInt(best.setsDone)||1)*(parseInt(best.r)>0?parseInt(best.r):10);}
        if(best.rpe&&(+best.v>0||!best.lt)){avgRpe+=best.rpe;rpeCount++;}
      }
    });
  });
  return{
    sessions:sessions.length,
    totalVolume:Math.round(totalVolume),
    avgRpe:rpeCount>0?+(avgRpe/rpeCount).toFixed(2):null,
    range:r
  };
}

function coach_weeklyInsight(){
  // Si estamos en una semana de descanso planificada, mensaje específico (sin nag de "0 sesiones")
  const activeRest=getActiveRest();
  if(activeRest){
    const curR=coach_weekStats(0);
    const dleft=restDaysLeft(activeRest);
    return{
      title:'Semana de descanso',
      tag:'Descanso 🌴',
      description:`Semana de descanso planificada${dleft>0?` · quedan ${dleft} día${dleft!==1?'s':''}`:''}. Recupera, duerme y come bien — vuelves más fuerte. Tu constancia no se penaliza.`,
      stats:[
        {l:'Sesiones',v:curR.sessions,d:0,unit:''},
        {l:'Estado',v:'Descanso',d:0,unit:''}
      ]
    };
  }
  const cur=coach_weekStats(0);
  const prev=coach_weekStats(1);

  const sessionsDiff=cur.sessions-prev.sessions;
  const volumeDiff=cur.totalVolume-prev.totalVolume;
  const volumePct=prev.totalVolume>0?Math.round((volumeDiff/prev.totalVolume)*100):0;

  let title='Resumen de la semana',description='',tag='Esta semana';
  const stats=[
    {l:'Sesiones',v:cur.sessions,d:sessionsDiff,unit:''},
    {l:'Volumen',v:cur.totalVolume,d:volumeDiff,unit:cur.totalVolume>0?' kg':''}
  ];
  if(cur.avgRpe&&_rpeOn()){ // (M2) sin la estadística «Esfuerzo» con el esfuerzo apagado
    const rpeLabel=cur.avgRpe<=1.4?'Fácil':cur.avgRpe<=2.4?'Justo':'Al límite';
    stats.push({l:'Esfuerzo',v:rpeLabel,d:0,unit:''});
  }

  // ── CASO ESPECIAL: 0 sesiones esta semana — mensaje motivacional contextual ──
  if(cur.sessions===0){
    title='Esta semana';
    // ¿Qué día de la semana es? (1=lunes ... 7=domingo)
    const today=new Date();
    const dow=today.getDay()||7;
    const totalSessions=S.sessions.length;

    if(totalSessions===0){
      description='Aún no has empezado. Tu primera sesión es el comienzo de todo — registra una hoy y construye el hábito.';
    }else if(dow<=2){
      // Lunes/martes — semana joven
      if(prev.sessions>=2)description=`La semana pasada hiciste ${prev.sessions} sesiones — un buen ritmo. Empieza fuerte hoy y mantén la racha.`;
      else if(prev.sessions===1)description=`Llevas una semana en buen camino. Esta semana puedes intentar 2 sesiones para subir el volumen.`;
      else description='Semana nueva, empezamos de cero. Intenta hoy o mañana — la primera sesión siempre es la más difícil.';
    }else if(dow<=4){
      // Miércoles/jueves — mitad de semana
      if(prev.sessions>=2)description=`La semana pasada hiciste ${prev.sessions} sesiones. Aún hay tiempo de hacer al menos una esta semana — no dejes que se vacíe.`;
      else description='Estamos a mitad de semana. Una sesión hoy o mañana mantiene el hábito vivo.';
    }else if(dow<=6){
      // Viernes/sábado — última oportunidad
      if(prev.sessions>=2)description=`La semana pasada entrenaste ${prev.sessions} veces. Aún puedes salvar la semana con una sesión rápida hoy o mañana.`;
      else description='Quedan pocos días. Una sesión corta es mejor que ninguna — el hábito se construye mostrándose, no siendo perfecto.';
    }else{
      // Domingo
      if(prev.sessions>=3)description=`Semana de descanso completo. La pasada hiciste ${prev.sessions} sesiones — ahora a recargar y volver fuerte el lunes.`;
      else description=`Semana sin entrenar. No pasa nada — mañana es lunes, buen momento para retomar con el ${esc(dayLabel(hoyDayKey()))}.`;
    }
    return{title,description,tag,stats};
  }

  // ── Casos normales (ya hay sesiones) ──
  if(prev.sessions===0){
    description=`Llevas ${plural(cur.sessions,'sesión','sesiones')} esta semana. Sigue así para construir un baseline.`;
  }else if(sessionsDiff>0){
    description=`Has hecho ${plural(sessionsDiff,'sesión','sesiones')} más que la semana pasada. ${volumePct>=10?`Volumen total: +${volumePct} %, gran progreso.`:'Buena consistencia.'}`;
  }else if(sessionsDiff<0){
    description=`${plural(Math.abs(sessionsDiff),'sesión','sesiones')} menos que la semana pasada. Si fue intencional perfecto, si no, intenta mantener la cadencia esta semana.`;
  }else{
    if(volumePct>=10)description=`Mismo número de sesiones pero +${volumePct} % de volumen. Estás progresando bien.`;
    else if(volumePct<=-10)description=`El volumen bajó ${Math.abs(volumePct)} % respecto a la semana pasada. Puede ser fatiga o cambio de pesos.`;
    else description=`Semana estable: ${plural(cur.sessions,'sesión','sesiones')}, volumen consistente. Buena base.`;
  }

  return{title,description,tag,stats};
}

// Marcar análisis semanal como visto + guardar histórico
function coach_maybeRunWeeklyAnalysis(){
  const now=Date.now();
  const last=S.lastWeekAnalysisTs||0;
  // Cada 7 días
  if(now-last<7*86400000)return;
  S.lastWeekAnalysisTs=now;
  const insight=coach_weeklyInsight();
  if(insight){
    if(!S.weeklyAnalyses)S.weeklyAnalyses=[];
    S.weeklyAnalyses.push({...insight,ts:now});
    // Mantener solo las últimas 12 semanas
    if(S.weeklyAnalyses.length>12)S.weeklyAnalyses=S.weeklyAnalyses.slice(-12);
  }
  saveState();
}

// ─── PESO CORPORAL ↔ RENDIMIENTO ─────────────────────────────

function coach_bodyweightPerformanceInsight(){
  // Necesitamos al menos 2 pesos corporales y datos en ejercicios compuestos
  if(!S.weights||S.weights.length<2)return null;
  const wRecent=S.weights.slice(-3);
  const wOldest=wRecent[0],wLatest=wRecent[wRecent.length-1];
  const bwDelta=wLatest.v-wOldest.v;
  const bwDays=Math.max(1,Math.round((wLatest.ts-wOldest.ts)/86400000));
  const bwPctPerWeek=(bwDelta/wOldest.v)*100*(7/bwDays);

  // Ejercicios compuestos (los que más reflejan fuerza global)
  const compoundIds=Object.values(routinePlan()).flatMap(d=>d.ex)
    .filter(e=>isCompoundEx(e)&&exLT(e)==='w')
    .map(e=>e.id);

  if(compoundIds.length===0)return null;

  // Calcular delta de fuerza promedio en compuestos en el mismo periodo
  const sinceTs=wOldest.ts;
  let progressing=0,regressing=0,stable=0;
  compoundIds.forEach(id=>{
    const data=(S.strength[id]||[]).filter(r=>r.ts>=sinceTs&&+r.v>0);
    if(data.length<2)return;
    // «Sube» = al menos un salto de su equipo (2.5 kg en Smith, 1 kg en polea…), no un 2.5 fijo
    const change=data[data.length-1].v-data[0].v,st=loadStepOf(findExInPlan(id)||{id})||2.5;
    if(change>=st-1e-9)progressing++;
    else if(change<=-st+1e-9)regressing++;
    else stable++;
  });

  if(progressing+regressing+stable===0)return null;

  // Generar insight basado en la combinación
  const lostWeight=bwDelta<-0.3;
  const gainedWeight=bwDelta>0.3;
  const flatWeight=Math.abs(bwDelta)<=0.3;
  const strongerOverall=progressing>regressing;
  const weakerOverall=regressing>progressing;

  const bwSign=bwDelta>0?'+':'';
  const bwTxt=`${bwSign}${bwDelta.toFixed(1)} kg en ${bwDays}d`;

  // Patrones — para perfil "ganar músculo + perder grasa"
  if(lostWeight&&strongerOverall){
    return{
      type:'good',
      ic:'🎯',
      title:'Bajas de peso y mantienes la fuerza',
      description:`Has bajado ${Math.abs(bwDelta).toFixed(1)} kg y mantienes o subes la fuerza en tus ejercicios multiarticulares: buena señal de que conservas músculo. Sigue así.`,
      bw:bwTxt
    };
  }
  if(lostWeight&&weakerOverall){
    return{
      type:'warn',
      ic:'⚠️',
      title:'Bajas de peso y de fuerza',
      description:`Has bajado ${Math.abs(bwDelta).toFixed(1)} kg pero también estás perdiendo fuerza. Tu fuerza baja mientras bajas de peso: si sigue así, coméntalo con un profesional (médico o dietista-nutricionista).`,
      bw:bwTxt
    };
  }
  if(gainedWeight&&strongerOverall){
    return{
      type:'info',
      ic:'💪',
      title:'Subes de peso y de fuerza',
      description:`Has ganado ${bwDelta.toFixed(1)} kg y tu fuerza sube. Si tu objetivo es otro, lo que comes es lo que más influye: para eso, un dietista-nutricionista.`,
      bw:bwTxt
    };
  }
  if(gainedWeight&&weakerOverall){
    return{
      type:'warn',
      ic:'📊',
      title:'Peso sube pero fuerza baja',
      description:`Has ganado ${bwDelta.toFixed(1)} kg pero tu fuerza está bajando. Puede ser fatiga, mal descanso, o exceso de cardio. Revisa sueño y volumen de cardio.`,
      bw:bwTxt
    };
  }
  if(flatWeight&&strongerOverall){
    return{
      type:'good',
      ic:'⚡',
      title:'Peso estable y más fuerza',
      description:`Tu peso se mantiene y tu fuerza sube: buena señal. La báscula sola no dice si es músculo o grasa.`,
      bw:bwTxt
    };
  }
  if(flatWeight&&weakerOverall){
    return{
      type:'warn',
      ic:'💤',
      title:'Estancamiento general',
      description:`Tu peso se mantiene y la fuerza baja. Puede ser falta de descanso, técnica o motivación. Una semana de descarga (−40 % de series o −15 % de peso: Ajustes → «Descarga o descanso», o la recomendación del Coach) puede ayudarte a recuperar.`,
      bw:bwTxt
    };
  }
  return null;
}

// ─── 5. SCORE GENERAL DEL MESOCICLO ────────────────────────

function coach_score(an){
  an=an||coach_analyze();
  const consistency=coach_consistency(coach_consistencyWindow());
  const cycle=coach_cycleData();

  let score=0,max=100;
  // Consistencia (40 pts)
  score+=Math.min(40,consistency.rate*40);

  // Progresión (40 pts) — mismo diagnóstico que el resto del Coach (últimas sesiones de cada ejercicio)
  const progressing=an.up.length,regressing=an.down.length,withData=an.withData.length;
  if(withData>0){
    score+=Math.max(0,Math.min(40,(progressing/withData)*40-(regressing/withData)*10));
  }

  // Volumen (20 pts) — sesiones hechas frente a las esperadas en lo que llevas de ciclo (máx. sus 4 últimas
  // semanas), según tu objetivo semanal. Las semanas de descanso planificado no cuentan como esperadas.
  const now=Date.now(),winStart=Math.max(cycle.start,now-CYCLE_WEEKS*7*86400000);
  const elapsedW=Math.max(1,Math.ceil((now-winStart)/(7*86400000)));
  const restInWin=restWeeksInWindow(winStart,now);
  const expectedSessions=Math.max(1,elapsedW-restInWin)*getWeeklyTarget();
  const done=S.sessions.filter(s=>s.ts>=winStart).length;
  score+=Math.min(20,(done/expectedSessions)*20);

  score=Math.max(0,Math.min(100,Math.round(score)));
  // Ciclo recién empezado: estado neutro (sin nota) hasta que pase su primera semana
  if(cycle.fresh)return{score,grade:'Nuevo ciclo',color:'var(--blue)',fresh:true};
  let grade='—',color='var(--text3)';
  if(score>=90){grade='Excelente';color='var(--green)';}
  else if(score>=75){grade='Muy bien';color='var(--green-hi)';}
  else if(score>=60){grade='Bien';color='var(--blue)';}
  else if(score>=40){grade='Regular';color='var(--amber)';}
  else if(score>0){grade='Mejorable';color='var(--red)';}
  return{score,grade,color};
}

// ─── 6. RENDER DE LA PANTALLA COACH ────────────────────────

// ── Coach en dos niveles: filas de «Más detalle» ──
// Plegada, cada fila enseña su título y un resumen; su contenido solo se pinta abierta. Las filas abiertas se recuerdan mientras
// la app sigue abierta (no se guardan). Una pieza sin contenido no tiene fila.
const CFOLD_KEYS=['ciclo','fat','ana','mm','det','prev'],_cfold=new Set();
function cfoldHtml(k,title,sum,body){
  if(!body||!String(body).trim())return'';
  const on=_cfold.has(k);
  return`<section class="cfold${on?' on':''}" data-k="${k}">
    <button type="button" class="cfold-h" id="cfold-h-${k}" aria-expanded="${on}"${on?` aria-controls="cfold-b-${k}"`:''} onclick="cfoldToggle('${k}')"><span class="cfold-t">${title}</span><span class="cfold-s">${sum||''}</span><span class="cfold-a" aria-hidden="true">›</span></button>
    ${on?`<div class="cfold-b" id="cfold-b-${k}" role="region" aria-labelledby="cfold-h-${k}">${body}</div>`:''}
  </section>`;
}
function cfoldToggle(k){
  if(!CFOLD_KEYS.includes(k))return;
  if(_cfold.has(k))_cfold.delete(k);else _cfold.add(k);
  render();
  const h=document.getElementById('cfold-h-'+k);if(!h)return;
  try{h.focus({preventScroll:true});}catch(e){}
  // al abrir, que se vea lo abierto (o su principio, si no cabe)
  if(_cfold.has(k))requestAnimationFrame(()=>{const sec=h.closest('.cfold');if(sec&&sec.isConnected)_revealSpan(document.getElementById('screen'),sec,sec);});
}
function renderCoach(){
  const cycle=coach_cycleData();
  const totalSessions=S.sessions.length;

  // Caso 1: Onboarding inicial del coach
  if(totalSessions<CYCLE_MIN_SESSIONS){
    const remaining=CYCLE_MIN_SESSIONS-totalSessions;
    return`
    <div class="topbar"><h1>Coach</h1><div class="sub">Tu entrenador personal</div></div>
    <div class="coach-hero">
      <div class="coach-hero-icon">${ic('chart')}</div>
      <div class="coach-hero-title">Analizando tu progreso</div>
      <div class="coach-hero-sub">Después de <strong style="color:var(--green)">${remaining}</strong> ${remaining===1?'sesión':'sesiones'} más, el coach podrá analizar tu patrón de entrenamiento y darte recomendaciones personalizadas.</div>
    </div>
    ${cycleNextCardHtml()}
    ${coachPlanCardHtml()}
    ${fatigueCardHtml()}
    ${mmCoachCardHtml()}
    <div class="sh">Qué hace el coach</div>
    <div class="insight">
      <div class="insight-ic good">${ic('chart')}</div>
      <div class="insight-body">
        <div class="insight-t">Analiza tu progresión</div>
        <div class="insight-d">Detecta qué ejercicios progresan, cuáles se estancan, y tu consistencia semanal.</div>
      </div>
    </div>
    <div class="insight">
      <div class="insight-ic good">${ic('target')}</div>
      <div class="insight-body">
        <div class="insight-t">Te dice qué peso poner</div>
        <div class="insight-d">En cada ejercicio: primero más reps y luego más peso, con los saltos de tu equipo${_rpeOn()?' y según tu esfuerzo':''}.</div>
      </div>
    </div>
    <div class="insight">
      <div class="insight-ic info">${ic('refresh')}</div>
      <div class="insight-body">
        <div class="insight-t">Renueva tu plan cada 4&nbsp;semanas</div>
        <div class="insight-d">Te propone cambios concretos (series, esquema o ejercicio) y semanas de descarga cuando toca. Tú decides si los aplicas.</div>
      </div>
    </div>
    <div class="insight">
      <div class="insight-ic warn">${ic('bulb')}</div>
      <div class="insight-body">
        <div class="insight-t">Celebra tus logros</div>
        <div class="insight-d">Detecta récords personales, hitos de consistencia, y te da contexto de cuándo has logrado algo importante.</div>
      </div>
    </div>
    <div style="padding:4px 14px 14px">
      <button class="btn bp" onclick="go('workout')">Ir a entrenar →</button>
    </div>`;
  }

  // Caso 2: Ciclo activo — mostrar dashboard del coach (todo sale de un único diagnóstico)
  const an=coach_analyze();
  const pv=coach_pendingView(an);
  const pend=pv.active.concat(pv.reserve);
  const cw=coach_consistencyWindow();
  const consistency=coach_consistency(cw);
  const scoreData=coach_score(an);
  const insights=coach_generateInsights(an,pend,new Set(pv.reserve.map(p=>p.id)));
  const weight=coach_weightTrend();

  // Métricas clave: progresan / fuerza estimada (media del % de 1RM estimado de cada ejercicio)
  // (la fuerza estimada es de los ejercicios con kilos: las reps o el tiempo no son 1RM)
  // (ni el lastre del peso corporal: su % es solo del lastre)
  const progressing=an.up.length,withData=an.withData.length,kgData=an.withData.filter(i=>(i.p.metric==='e1rm'||i.p.kgTD)&&!i.p.lastre);
  const avgPct=kgData.length?kgData.reduce((a,i)=>a+i.p.pct,0)/kgData.length:null;

  // Ciclo: semana con tope (nunca «28/4»), anillo, estado vencido / nuevo
  const C=2*Math.PI*20;
  const cycleOff=C*(1-cycle.cycleProgress);
  const overW=cycle.overdue?Math.floor(cycle.weeks-CYCLE_WEEKS):0;
  const weeksTxt=cycle.weeks<1?`${cycle.days} día${cycle.days!==1?'s':''}`:plural(Math.round(cycle.weeks*10)/10,'semana');
  const R=2*Math.PI*32;
  const ringOff=scoreData.fresh?R:R*(1-scoreData.score/100);
  // Descarga de todo el plan: no se cambia nada. De un solo ejercicio: solo espera lo que le toca.
  const dlNow=getActiveDeload();
  const blockedAll=!!(dlNow&&dlNow.kind==='all');
  const blockedSome=!blockedAll&&pv.active.some(_proposalBlocked);
  const legacy=coach_legacyDeload();
  const dlReco=coach_deloadReco(an),dlWait=!dlReco&&_dlSnoozedOffer();
  // (16b) Si lo único propuesto es la descarga como enlace o fila de espera, sobra la pista del tope de cambios
  const onlyDlRow=!blockedAll&&!pv.reserve.length&&pv.active.length>0&&pv.active.every(p=>p.type==='deload'&&(dlReco||dlWait));

  // ── Dos niveles. Arriba (nivel 1), lo que pide una decisión —descarga recomendada, cierre del ciclo y propuestas— y la
  // próxima sesión. Debajo, bajo «Más detalle», el resto, en filas que se abren (cfoldHtml).
  const propsHtml=pend.length?`<div class="sh" id="coach-props">${ic('bulb')} El Coach propone — tú decides</div>
  ${onlyDlRow?'':`<div class="prop-hint">${blockedAll?'Durante la descarga no se cambia el plan: podrás aplicarlas al terminar.'
    :`Máximo ${PROP_MAX_TOTAL} cambios por ciclo y 1 por día de rutina${pv.appliedCount?` · llevas ${pv.appliedCount}`:''}.${blockedSome?' Lo que afecta a la descarga en curso podrás aplicarlo al terminarla.':''}`}</div>`}
  ${pv.active.map(p=>p.type!=='deload'?_proposalCardHtml(p,_proposalBlocked(p)):dlReco?_propDlLinkHtml():dlWait?_propDlWaitHtml():_proposalCardHtml(p,_proposalBlocked(p))).join('')}
  ${pv.reserve.length?`<button class="prop-res-tg" aria-expanded="${_coachShowReserve}" onclick="_coachShowReserve=!_coachShowReserve;render()">En reserva (${pv.reserve.length}) <span aria-hidden="true">${_coachShowReserve?'▴':'▾'}</span></button>
    ${_coachShowReserve?`<div class="prop-res">${pv.reserve.map(p=>`<div class="prop-res-row"><span class="prop-res-n">${esc(p.title||'')}</span><span class="prop-res-d">${esc(_propWhere(p))}</span></div>`).join('')}
      <div class="prop-res-note">${pv.active.length?'Entran si ignoras alguna de arriba':'Este ciclo ya tiene sus cambios'} (máx. ${PROP_MAX_TOTAL} por ciclo y 1 por día).</div></div>`:''}`:''}`:'';
  const cicloHtml=`  <div class="coach-cycle">
    <div class="coach-cycle-info">
      <div class="coach-cycle-lbl">${cycle.fresh?'Ciclo nuevo':'Ciclo actual'}</div>
      <div class="coach-cycle-val">${_nwUnits(`${cycle.sessions.length} ${cycle.sessions.length===1?'sesión':'sesiones'} · ${weeksTxt}`)}</div>
      ${cycle.fresh?`<div class="coach-cycle-sub">Tu nota aparece tras la primera semana. Tus datos anteriores siguen contando.</div>`
        :cycle.overdue?`<div class="coach-cycle-sub">El ciclo es de ${CYCLE_WEEKS} semanas${cycle.readyForReview?': ciérralo para recibir propuestas':''}</div>`:''}
    </div>
    <div class="coach-cycle-prog">
      <svg viewBox="0 0 50 50">
        <circle class="cbg" cx="25" cy="25" r="20"/>
        <circle class="cfg" cx="25" cy="25" r="20" style="stroke-dasharray:${C};stroke-dashoffset:${cycleOff}"/>
      </svg>
      <div class="cpct">${cycle.overdue?'✓':Math.round(cycle.cycleProgress*100)+NB+'%'}</div>
    </div>
  </div>

  <div class="metric-grid">
    <div class="metric-box">
      <div class="ml">Consistencia</div>
      <div class="mv" style="color:${consistency.rate>=0.75?'var(--green)':consistency.rate>=0.5?'var(--amber)':'var(--red)'}">${consistency.perWeek}</div>
      <div class="md">sesiones/semana${cw>1?` · ${cw}${NB}sem.`:''}</div>
    </div>
    <div class="metric-box">
      <div class="ml">Progresan</div>
      <div class="mv" style="color:var(--green)">${progressing}/${withData||'—'}</div>
      <div class="md">ejercicios</div>
    </div>
    <div class="metric-box">
      <div class="ml">Fuerza estimada</div>
      <div class="mv" style="color:${avgPct==null?'var(--text3)':avgPct>=0?'var(--green)':'var(--amber)'}">${avgPct==null?'—':(avgPct>=0?'+':'−')+Math.abs(avgPct).toFixed(1)+NB+'%'}</div>
      <div class="md">1RM medio · últimas sesiones</div>
    </div>
    <div class="metric-box">
      <div class="ml">Peso corporal</div>
      <div class="mv" style="color:${weight.trend==='insufficient'?'var(--text3)':parseFloat(weight.changeAll)<=0?'var(--green)':'var(--red)'}">${weight.trend==='insufficient'?'—':kgSign(weight.changeAll)}</div>
      <div class="md">kg ${weight.trend==='insufficient'?'sin datos':'desde el inicio'}</div>
    </div>
  </div>`;
  const anaHtml=insights.length===0?`<div class="insight"><div class="insight-ic info">${ic('hourglass')}</div><div class="insight-body"><div class="insight-t">Recopilando datos</div><div class="insight-d">El coach analizará patrones cuando tengas más sesiones registradas.</div></div></div>`:
    insights.map(i=>`<div class="insight"><div class="insight-ic ${i.type}">${icE(i.ic)}</div><div class="insight-body"><div class="insight-t">${i.t}</div><div class="insight-d">${_nwUnits(i.d)}</div></div></div>`).join('');
  const detHtml=cycle.readyForReview?`${coach_detailHtml(an,pv)}
    <div style="padding:4px 14px 14px">
      <button class="btn bp" onclick="coach_applyRecommendations()">Cerrar ciclo e iniciar uno nuevo</button>
    </div>`:
    (cycle.weeks<CYCLE_WEEKS*0.85?`<div class="insight"><div class="insight-ic info">${ic('calendar')}</div><div class="insight-body"><div class="insight-t">En camino al próximo análisis</div><div class="insight-d">${Math.max(1,Math.ceil(CYCLE_WEEKS*0.85-cycle.weeks))!==1?'Faltan unas':'Falta alrededor de'} <strong>${Math.max(1,Math.ceil(CYCLE_WEEKS*0.85-cycle.weeks))}</strong> semana${Math.max(1,Math.ceil(CYCLE_WEEKS*0.85-cycle.weeks))!==1?'s':''} para el análisis del ciclo. Mientras tanto, sigue el plan actual.</div></div></div>`
    :`<div class="insight"><div class="insight-ic info">${ic('calendar')}</div><div class="insight-body"><div class="insight-t">Casi listo</div><div class="insight-d">Llevas ${cycle.sessions.length} ${cycle.sessions.length===1?'sesión':'sesiones'} en este ciclo: con ${Math.max(1,(cycle.overdue?3:CYCLE_MIN_SESSIONS)-cycle.sessions.length)} más tendrás su análisis.</div></div></div>`);
  const prevHtml=S.mesocycles&&S.mesocycles.length>0?`${S.mesocycles.filter(_isPlainObj).map((m,i)=>({m,n:i+1})).reverse().slice(0,3).map(({m,n})=>`<div class="mesocycle-log">
      <h4>Mesociclo ${esc(m.num)} · ${esc(plural(m.sessionCount,'sesión','sesiones'))}</h4>
      <p>${esc(m.summary||'')}</p>
      ${_wrCycleBtn(n)}
    </div>`).join('')}`:'';
  // resúmenes de las filas plegadas
  const fat=coach_fatigueMeter(an),mmK=mmRangeKey(),untilAn=Math.max(1,Math.ceil(CYCLE_WEEKS*0.85-cycle.weeks));

  return`
  <div class="topbar">
    <div class="topbar-row">
      <div><h1>Coach</h1><div class="sub">Mesociclo ${(S.mesocycles?.length||0)+1} · Semana ${cycle.weekNum}/${CYCLE_WEEKS}</div>
        ${cycle.overdue?`<div class="coach-over">Ciclo terminado${overW>=1?` hace ${overW}${NB}sem.`:''}${cycle.readyForReview?' · ciérralo abajo':''}</div>`:''}</div>
      <div class="score-ring${scoreData.fresh?' fresh':''}" role="img" aria-label="${scoreData.fresh?'Ciclo nuevo: la nota aparece tras la primera semana':`Nota del ciclo: ${scoreData.score} de 100, ${esc(scoreData.grade)}`}">
        <svg viewBox="0 0 80 80">
          <circle class="sbg" cx="40" cy="40" r="32"/>
          <circle class="sfg" cx="40" cy="40" r="32" style="${scoreData.fresh?'stroke:var(--blue);stroke-dasharray:3 6;stroke-linecap:butt;opacity:.55':`stroke:${scoreData.color};stroke-dasharray:${R};stroke-dashoffset:${ringOff}`}"/>
        </svg>
        <div class="score-val">${scoreData.fresh
          ?`<span class="n" style="color:var(--blue-hi)">—</span><span class="u">Nuevo<br>ciclo</span>`
          :`<span class="n" style="color:${scoreData.color}">${scoreData.score}</span><span class="u">${scoreData.grade}</span>`}</div>
      </div>
    </div>
  </div>

  ${lightBannerHtml('coach')}

  ${legacy?`<div class="card legacy-dl">
    <div class="legacy-dl-t">${ic('wrench')} Tu plan sigue con series reducidas</div>
    <div class="legacy-dl-d">Una descarga anterior bajó tus series y nunca se deshizo. ¿Las devuelvo a lo normal?</div>
    <div class="rec-diff" style="margin-bottom:10px">${legacy.fixes.slice(0,6).map(f=>`<div class="rec-diff-row"><span class="sym add">↑</span><span>${esc(f.n)}: ${f.from} → ${f.to} series</span></div>`).join('')}${legacy.fixes.length>6?`<div class="rec-diff-row"><span class="sym add">+</span><span>y ${legacy.fixes.length-6} más</span></div>`:''}</div>
    <div style="display:flex;gap:8px"><button class="btn bp" style="flex:1" onclick="coach_fixLegacyDeload(true)">Restaurar series</button><button class="btn bs" style="width:120px" onclick="coach_fixLegacyDeload(false)">Dejar así</button></div>
  </div>`:''}

  ${wrapCycleOfferHtml(pv.active.filter(p=>!(p.type==='deload'&&(dlReco||dlWait))).length)}
  ${cycleNextCardHtml()}

  ${deloadRecoHtml(dlReco)}

  ${cycle.readyForReview?`<div class="cta-banner" role="button" tabindex="0" onclick="coach_applyRecommendations()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();coach_applyRecommendations()}">
    <div class="cta-banner-t">${cycle.overdue?`${ic('flag')} Tu ciclo de ${CYCLE_WEEKS} semanas ha terminado`:ic('sparkles')+' Tu análisis de ciclo está listo'}</div>
    <div class="cta-banner-d">${cycle.overdue?'Ciérralo para recibir tus propuestas y empezar uno nuevo':'Revisa el análisis abajo y cierra el ciclo para recibir tus propuestas'}</div>
  </div>`:''}

  ${propsHtml}

  ${coachPlanCardHtml()}

  <div class="sh cfold-sh">Más detalle</div>
  ${cfoldHtml('ciclo','Tu ciclo',`${plural(cycle.sessions.length,'sesión','sesiones')} · progresan ${progressing}/${withData||'—'}`,cicloHtml)}
  ${cfoldHtml('fat',_rpeOn()?'Fatiga y esfuerzo':'Fatiga',fat.score==null?'sin datos':`${fat.score} · ${esc(fat.level||'')}`,fatigueCardHtml(an))}
  ${cfoldHtml('ana','Análisis del ciclo',insights.length?plural(insights.length,'observación','observaciones'):'recopilando datos',anaHtml)}
  ${cfoldHtml('mm','Tus músculos',mmK==='7d'?'últimos 7 días':mmK==='cycle'?'este ciclo':'4 semanas',mmCoachCardHtml())}
  ${cfoldHtml('det',cycle.readyForReview?'Análisis detallado':'Próximo análisis',cycle.readyForReview?'y cierre del ciclo':cycle.weeks<CYCLE_WEEKS*0.85?(untilAn===1?'en 1 semana':`en unas ${untilAn} semanas`):'casi listo',detHtml)}
  ${cfoldHtml('prev','Ciclos anteriores',String(S.mesocycles?S.mesocycles.filter(_isPlainObj).length:0),prevHtml)}
  `;
}

// ─── 7. TARJETAS DE PROPUESTA (ids estables) ───────────────────
let _coachShowReserve=false;
function _propWhere(p){
  if(p.type==='deload')return'Todo el plan';
  const dk=p.dayKey||_dayOfEx(p.exId),d=dk&&getPlan()[dk];
  return d?d.label:'';
}
// ¿La descarga activa impide aplicar esta propuesta ahora? Descarga de todo el plan: cualquier cambio.
// «Reducir volumen» de un ejercicio: solo lo de ese ejercicio y otra descarga (solo hay una a la vez).
function _proposalBlocked(p){
  const d=getActiveDeload();
  if(!d||!p)return false;
  if(d.kind==='all'||p.type==='deload'||p.type==='rm_set')return true;
  return !!(p.exId&&d.changes.some(c=>c.exId===p.exId));
}
// (13e) Una sola oferta de descarga: si la tarjeta «Semana de descarga» (recomendación) está arriba, la propuesta del
// ciclo con el mismo título queda en un enlace a ella (empezarla desde la tarjeta también resuelve la propuesta)
function _propDlLinkHtml(){
  return`<button type="button" class="coach-entry dlr-entry prop-dl-link" onclick="goDeloadReco()">
      <span class="coach-entry-ic" aria-hidden="true">${ic('leaf')}</span>
      <span class="coach-entry-t">Semana de descarga<small>Ya la tienes arriba: elige el plan y empiézala allí</small></span>
      <span class="coach-entry-go">Ver ›</span></button>`;
}
// (13e r1) Con la recomendación pospuesta («Ahora no»), la propuesta del ciclo queda en espera (sin «Aplicar»): la única
// oferta es el botón del medidor, al que lleva este enlace
function _propDlWaitHtml(){
  return`<button type="button" class="coach-entry dlr-entry prop-dl-wait" onclick="goFatGo()">
      <span class="coach-entry-ic" aria-hidden="true">${ic('leaf')}</span>
      <span class="coach-entry-t">Semana de descarga<small>En espera: te la vuelvo a proponer el ${esc(_dlDayTxt(S.dlRecoSnoozeTs))}. Si cambias de idea, empiézala en «Fatiga y esfuerzo».</small></span>
      <span class="coach-entry-go">Ver ›</span></button>`;
}
function _proposalCardHtml(p,blocked){
  const pid=esc(p.id),where=_propWhere(p),pr=_propPrio(p);
  return`<div class="proposal-card" data-pid="${pid}">
    <div class="proposal-head">
      <div class="proposal-ic" aria-hidden="true">${icE(p.ic||'💡')}</div>
      <div style="min-width:0;flex:1">
        <div class="proposal-tag p${pr<=1?'w':pr===2?'v':'g'}">${esc(p.tag||'Propuesta')}${where?` · ${esc(where)}`:''}</div>
        <div class="proposal-t">${esc(p.title||'')}</div>
        ${p.diff?`<div class="proposal-diff">${_nwUnits(esc(p.diff))}</div>`:''}
        <div class="proposal-d">${_nwUnits(esc(p.description||''))}</div>
      </div>
    </div>
    <div class="proposal-actions">
      <button class="proposal-apply" data-pid="${pid}" onclick="applyProposal(this.dataset.pid)"${blocked?' disabled':''}>${blocked?'Tras la descarga':'✓ Aplicar'}</button>
      <button class="proposal-ignore" data-pid="${pid}" onclick="ignoreProposal(this.dataset.pid)">Ignorar</button>
    </div>
  </div>`;
}

// ─── 8. SERIES REDUCIDAS POR UNA DESCARGA ANTIGUA (antes de v13 era permanente) ───
// Busca descargas / «Reducir volumen» aplicadas con la versión anterior (sin dlId) que nunca se deshicieron y
// ofrece devolver esos ejercicios a sus series por defecto. Tú decides: restaurar o dejarlo así.
function _defaultSets(ex){
  const o=Object.values(PLAN).flatMap(d=>d.ex).find(p=>p.id===ex.id);
  if(o)return parseInt(o.s)||null;
  const lib=LIB_BY_ID.get(ex.lib);
  return lib?parseInt(lib.s)||null:null;
}
function coach_legacyDeload(){
  if(getActiveDeload())return null;
  const entries=(S.appliedProposals||[]).filter(a=>a&&(a.type==='deload'||a.type==='rm_set')&&!a.dlId&&!a.legacyResolved);
  if(!entries.length)return null;
  const all=entries.some(e=>e.type==='deload'),ids=new Set(entries.map(e=>e.exId).filter(Boolean));
  const plan=getPlan(),fixes=[];
  Object.keys(plan).forEach(dk=>(plan[dk]&&Array.isArray(plan[dk].ex)?plan[dk].ex:[]).forEach(ex=>{
    if(!ex||ex.cardio||(!all&&!ids.has(ex.id)))return;
    const def=_defaultSets(ex),cur=parseInt(ex.s)||0;
    if(def&&cur>0&&cur<def)fixes.push({exId:ex.id,n:ex.n,from:cur,to:def});
  }));
  return fixes.length?{entries,fixes}:null;
}
function coach_fixLegacyDeload(restore){
  const L=coach_legacyDeload();
  if(!L){render();return;}
  if(restore)L.fixes.forEach(f=>{const ex=findExInPlan(f.exId);if(ex)ex.s=f.to;});
  L.entries.forEach(e=>{e.legacyResolved=true;});
  saveState();render();
  toast(restore?`✓ Series restauradas en ${L.fixes.length} ejercicio${L.fixes.length!==1?'s':''}`:'De acuerdo, tu plan se queda así');
}

// ═══════════════════════════════════════════════════════════
// Fin Coach IA
// ═══════════════════════════════════════════════════════════
