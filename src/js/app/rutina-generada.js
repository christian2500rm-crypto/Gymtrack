// ══════════════════════════════════════════════════════════
// (E5) APLICAR UNA RUTINA GENERADA Y DESHACER (30-propuesta-final.md §G.9, §G.10)
// ══════════════════════════════════════════════════════════
// Candidata: lo que enseña el resultado y lo que se aplica, con las letras del generador. g = genRoutineFrom(…). Cada ejercicio
// lleva lib, series, el objetivo como lo guarda la app (rango escrito, «30s» o minutos), la nota y su descanso; por día, la
// aproximación del primer multiarticular con kilos y los minutos; y los descansos de la rutina por tipo (también el de peso
// corporal, bandas y TRX: el de la primera fila de ese tipo o, si no hay, la regla del generador).
const _LVN={P0:0,P:1,I:2,A:3};
function _genRestCat(g,row,P){ // como restOf del generador
  const L=LIB_K.BY.get(row.lib);if(!L||L.lt==='c')return null;
  if(row.role==='potencia')return'heavy';
  if(!L.c)return'iso';
  if(['r','t','d'].includes(L.lt)||['banda','minibanda','trx'].includes(L.mat)||L.pat==='carry'||(L.lt==='bw'&&(L.u||P.cauto||_LVN[P.level]<=_LVN.P)))return'bw';
  const rr=g.E.G.repRange(L,row.r);return rr&&rr.hi<=6?'heavy':'comp';
}
function genCandidate(g){
  const r=g.res,P=g.E.G.effective(g.inp),days={},apx={},est={};let bw=null;
  r.det.forEach(d=>{
    const rows=d.rows,dex=(r.days[d.letra]&&r.days[d.letra].ex)||[]; // (E14a) el equilibrio, con sus ejercicios (antes, una fila de texto)
    const fr=rows.find(x=>x.kind==='str'&&x.c&&(LIB_K.BY.get(x.lib)||{}).lt==='w');
    days[d.letra]={label:r.days[d.letra].label,focus:r.days[d.letra].focus,ex:rows.map((x,i)=>{
      const e=genRowToEx(x);if(!e)return null;
      const cat=x.kind==='str'?_genRestCat(g,x,P):null;if(cat==='bw'&&bw==null)bw=x.descanso_s;
      return{lib:x.lib,s:e.s,r:e.r,cardio:!!e.cardio,note:String((dex[i]&&dex[i].note)||'').trim(),rest:x.kind==='str'||x.kind==='bal'?x.descanso_s:null,cat,pot:x.role==='potencia'};
    }).filter(Boolean)};
    apx[d.letra]=fr?genApproachSecs(g,fr):150;est[d.letra]=d.minExact;
  });
  const R=r.meta.rest||{},ag=g.inp.goal==='aguante';
  if(bw==null&&R.iso)bw=(ag?Math.max(60,R.iso):Math.min(90,Math.max(75,R.iso)))+(P.prud||P.mayor?15:0);
  // (E14a, §G.5) 65 o más sin rodilla, cadera ni «Otra zona»: al cerrar el primer ciclo, el Coach propone un ejercicio de potencia
  const pot=!!(P.mayor&&!['rodilla','cadera','otra'].some(z=>g.inp.zones&&g.inp.zones[z]));
  return{v:1,days,weeklyTarget:r.weeklyTarget,daysOther:g.inp.daysOther||0,meta:r.meta,apx,est,balMin:r.meta.balMin||0,pot,rest:Object.assign({},R,bw!=null?{bw}:{}),
    reparto:r.meta.reparto==='dias'?'dias':'recomendado',ok:!!r.ok};
}
// Sin consentimiento de salud no queda rastro de la zona (§I.2): fuera las notas que la nombran y los porqués y avisos con zona
const _ZONE_TXT=/rodilla|hombro|lumbar|espalda baja|muñeca|codo|cadera|cuello|tobillo|molestia|otra zona|operación|lesión/i;
function _stripZoneTrace(c){
  Object.values(c.days).forEach(d=>d.ex.forEach(x=>{if(x.note&&_ZONE_TXT.test(x.note))x.note='';}));
  const ok=w=>!(w&&(['reciente','otra_zona','zona','amable','molestia','lim'].includes(w.c)||_ZONE_TXT.test(JSON.stringify(w.p||''))));
  c.meta=Object.assign({},c.meta,{why:(c.meta.why||[]).filter(ok),warn:(c.meta.warn||[]).filter(ok)});
  return c;
}
// planMeta de una rutina aplicada: lo del generador con los ids de día de la rutina nueva (§D)
function _genPlanMeta(c,np){
  const m=c.meta||{},did=k=>np[k]&&np[k].did;
  const byL=o=>{const r={};if(_isPlainObj(o))Object.keys(o).forEach(k=>{const d=did(k);if(d)r[d]=o[k];});return r;};
  const vol={};if(_isPlainObj(m.vol))Object.keys(m.vol).forEach(gk=>{const v=m.vol[gk];if(v)vol[gk]={v:v.v,dir:v.dir,obj:v.obj,top:v.tope,techo:v.techo};});
  const rir=t=>{const x=String(t==null?'':t).match(/\d/);return x?+x[0]:null;};
  const lifts=[].concat(...Object.values(_isPlainObj(m.lifts)?m.lifts:{}).filter(Array.isArray));
  const letters=a=>Array.isArray(a)?a.map(did).filter(Boolean):null;
  const pm={id:'p_'+Date.now().toString(36),ts:Date.now(),gen:(window.GymGen&&GymGen.VERSION)||0,cat:'',reparto:c.reparto,split:m.split,K:m.K,wd:m.wd,
    tpl:byL(m.tpl),dayPlace:byL(m.dayPlace),fd:byL(m.fd),alternas:!!m.alternas,fz2:m.split==='fz2'?{gym:Object.keys(np).filter(k=>(m.dayPlace||{})[k]==='g').map(did),casa:Object.keys(np).filter(k=>(m.dayPlace||{})[k]==='c').map(did)}:null,
    seq:_seqOf(np,m),cargaLigera:!!m.cargaLigera,lifts,vuelta:m.vuelta?(m.vuelta.pesos==='menos20'?'menos20':'recalibrar'):null,
    rampa:m.rampa?{series:m.rampa.series||3,reps:m.rampa.reps||'8-12',rir:rir(m.rampa.rir)}:null,
    effort:m.effort?{obj:m.effort.obj,rir:rir(m.effort.rir),subidas:m.effort.subidas}:null,rest:c.rest,vol,zone:_mmZoneOf(np,c.weeklyTarget,vol),
    modes:m.modes||[],level:m.level,corto:!!m.corto,seed:m.seed,alt:m.alt||0,why:m.why,warn:m.warn,base:JSON.parse(JSON.stringify(np)),edited:false,
    balMin:c.balMin||0,apx:byL(c.apx),est:byL(c.est),pot:!!c.pot};
  return _sanitizePlanMeta(pm,np);
}
// Id sin historial y único de verdad (42 R21): ni en la rutina nueva ni en S.strength; nunca a1…c7 (los de fábrica)
function _uniqueExId(taken){
  const st=_isPlainObj(S.strength)?S.strength:{};let id;
  do{id='ex_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7);}while(taken.has(id)||id in st);
  return id;
}
// La rutina de ahora con lo que va con ella, para «Deshacer» y «Volver a mi rutina anterior» (42 R5)
function _planPrevSnap(src){
  const c=x=>x==null?null:JSON.parse(JSON.stringify(x));
  return{ts:Date.now(),src,plan:c(S.currentPlan),weeklyTarget:S.weeklyTarget,nextDay:S.nextDay,day:S.day,rotBack:S.rotBack||null,meta:c(S.planMeta),
    profile:c(S.profile),places:c(S.places),pendingCoachProposals:c(S.pendingCoachProposals||[]),libPlace:S.libPlace,libKit:c(S.libKit)};
}
// El ciclo en curso se cierra en silencio si tiene sesiones (§G.5, 42 R27): queda su resumen, sin propuestas ni avisos
function _closeCycleQuiet(){
  let cy;try{cy=coach_cycleData();}catch(e){return false;}
  if(!cy||!cy.sessions.length)return false;
  let ins=[];try{ins=coach_generateInsights(coach_analyze(),[]).map(i=>({t:i.t,d:i.d,type:i.type}));}catch(e){}
  if(!Array.isArray(S.mesocycles))S.mesocycles=[];
  S.mesocycles.push({num:S.mesocycles.length+1,startTs:cy.start,endTs:Date.now(),appliedAt:Date.now(),sessionCount:cy.sessions.length,
    summary:`Ciclo cerrado al cambiar de rutina: ${plural(cy.sessions.length,'sesión','sesiones')} en ${plural(Math.max(1,Math.round(cy.weeks)),'semana')}.`,insights:ins});
  S.coachInsights=null;S.coachInsightsStale=true;S.coachLastAnalyzed=Date.now();S.coachStart=Date.now();
  return true;
}
function _applyGuard(){
  if(getActiveWorkout())return{ok:false,why:'entreno',msg:'Termina o descarta el entreno de hoy antes de cambiar de rutina.'};
  if(getReopened())return{ok:false,why:'reabierta',msg:'Guarda primero la sesión que tienes abierta.'};
  return null;
}
// Lo que se hace antes de cambiar la rutina, sea la que sea: nombres apuntados, «solo hoy» devueltos, descanso o cardio parados y
// la descarga terminada (avisa). Devuelve si había descarga.
function _beforePlanSwap(){
  stampSessionsLbl();
  dayKeys().forEach(dk=>{revertDaySubs(dk);(getPlan()[dk].ex||[]).forEach(e=>_stampExName(routineEx(e)));});
  if(S.restTimer){try{RT.stop();}catch(e){}}
  try{closeRpeSelector();}catch(e){} // (M1) y la barra del esfuerzo sin reloj, si la había
  const dl=!!S.deload;if(S.deload)_restoreDeload(true);
  return dl;
}
// Aplica una candidata (genCandidate). o = {answers, places, health|null}. Nunca escribe registros ni borra historial (§G.9).
function applyGeneratedPlan(c,o){
  o=o||{};const bl=_applyGuard();if(bl)return bl;
  if(!c||!_isPlainObj(c.days)||!Object.keys(c.days).length)return{ok:false,why:'vacia'};
  if(!o.health)c=_stripZoneTrace(JSON.parse(JSON.stringify(c)));
  const cur=getPlan(),keepById=id=>{for(const k of dayKeys(cur)){const e=(cur[k].ex||[]).find(x=>x&&x.id===id);if(e)return JSON.parse(JSON.stringify(routineEx(e)));}return null;};
  const pre=_planPrevSnap('aplicar');
  const dl=_beforePlanSwap();
  const cyc=_closeCycleQuiet();
  const hist=_libHistMap(),taken=new Set(),np={};
  Object.keys(c.days).filter(k=>DAY_KEYS.includes(k)).forEach(k=>{const gd=c.days[k];
    np[k]={label:String(gd.label||('Día '+k)).slice(0,80),focus:String(gd.focus||'').slice(0,200),did:null,ex:gd.ex.map(x=>{
      if(x.keep){const e=keepById(x.keep);if(e&&!taken.has(e.id)){taken.add(e.id);return e;}return null;}
      const L=LIB_BY_ID.get(x.lib);if(!L)return null;
      const h=hist[x.lib],id=h&&!taken.has(h.key)?h.key:_uniqueExId(taken);taken.add(id);
      const e=_libCopy(L,id);e.s=x.cardio?1:x.s;e.r=x.r;if(x.cardio)e.cardio=true;
      if(x.pot)e.rc='heavy';
      if(x.note)e.tip=((e.tip||'')+' '+x.note).trim().slice(0,300);
      return e;}).filter(Boolean)};});
  dayKeys(np).forEach(k=>{np[k].did=newDayId(np);});
  S.currentPlan=np;S.planPrev=pre;
  const wt=parseInt(c.weeklyTarget);if(wt>=1&&wt<=7)S.weeklyTarget=wt;
  S.day=S.nextDay=liveDayKeys(np)[0]||dayKeys(np)[0];S.rotBack=null;S.pendingCoachProposals=[];
  S.planMeta=_genPlanMeta(c,np);
  {const sq=seqNextDay();if(sq)S.day=S.nextDay=sq;} // (E12) con secuencia, su primer día
  if(o.answers)S.profile=_sanitizeProfile(o.answers);
  if(o.places){S.places=_sanitizePlaces(o.places);try{_syncLibKit();}catch(e){}}
  if(o.health)S.health=_sanitizeHealth(o.health);
  S.onboarded=true;S.obDraft=null;
  try{_editDay=_editDayOr(_editDay);}catch(e){}
  saveState();
  return{ok:true,deload:dl,cycle:cyc};
}
// «Deshacer» y «Volver a mi rutina anterior»: la de planPrev vuelve con las mismas guardas y la de ahora pasa a planPrev (se puede
// rehacer). Lo que no se deshace: la descarga que terminó, el ciclo que se cerró y los «solo hoy» devueltos.
function restorePlanPrev(){
  const p=S.planPrev;if(!_isPlainObj(p)||!_isPlainObj(p.plan))return{ok:false,why:'nada'};
  const bl=_applyGuard();if(bl)return bl;
  const cur=_planPrevSnap('restaurar');
  const dl=_beforePlanSwap();
  const plan=_sanitizePlanKeys(JSON.parse(JSON.stringify(p.plan)));
  S.currentPlan=plan;
  const wt=parseInt(p.weeklyTarget);if(wt>=1&&wt<=7)S.weeklyTarget=wt;
  S.nextDay=p.nextDay&&_dayLive(plan[p.nextDay])?p.nextDay:getNextDay(null);
  S.day=p.day&&_isPlanDay(plan[p.day])?p.day:S.nextDay;
  S.rotBack=p.rotBack&&_isPlanDay(plan[p.rotBack])?p.rotBack:null;
  S.planMeta=p.meta?_sanitizePlanMeta(p.meta,plan):null;
  S.profile=p.profile?_sanitizeProfile(p.profile):null;
  S.places=p.places?_sanitizePlaces(p.places):null;
  S.pendingCoachProposals=_sanitizeProposals(p.pendingCoachProposals||[]);
  if(p.libPlace)S.libPlace=p.libPlace;if(p.libKit!==undefined)S.libKit=p.libKit;
  S.planPrev=cur;
  try{_editDay=_editDayOr(_editDay);}catch(e){}
  saveState();
  return{ok:true,deload:dl};
}
// Descanso automático con rutina generada (30-algoritmo.md §7.4, §G.4): por la carga de cada serie, con los descansos de tu rutina
// (planMeta.rest). null sin rutina generada (y la app sigue con los de siempre).
function _genRestSecs(ex){
  const pm=S&&S.planMeta;if(!_isPlainObj(pm)||!_isPlainObj(pm.rest)||!ex||ex.cardio)return null;
  let cat=['iso','comp','heavy','bw'].includes(ex.rc)?ex.rc:null;
  if(!cat){
    const L=exLib(ex),K=L&&LIB_K?LIB_K.BY.get(L.id):null;if(!K||K.lt==='c')return null;
    const md=pm.modes||[],cauto=['inicio','prudente','mayor','mayor75'].some(x=>md.includes(x)),lvP=(_LVN[pm.level]!=null?_LVN[pm.level]:2)<=_LVN.P;
    if(!K.c)cat='iso';
    else if(['r','t','d'].includes(K.lt)||['banda','minibanda','trx'].includes(K.mat)||K.pat==='carry'||(K.lt==='bw'&&(K.u||cauto||lvP)))cat='bw';
    else{const rr=repRange(ex);cat=rr&&rr.hi<=6?'heavy':'comp';}
  }
  const v=pm.rest[cat];return typeof v==='number'?{s:v,cat}:null;
}
const _GEN_REST_WHY={iso:'los ejercicios de un solo músculo',comp:'los ejercicios grandes (sentadilla, press, remo)',heavy:'las series pesadas (6 repeticiones o menos)',bw:'los de peso corporal, bandas o TRX'};
const _GOAL_LBL={musculo:'Ganar músculo',fuerza:'Ganar fuerza',grasa:'Perder grasa',salud:'Salud y forma',aguante:'Aguantar más'};
// Minutos estimados de un día con la fórmula del generador y lo de tu rutina (equilibrio, aproximación, si empiezas de cero)
function _hoyEstMin(dk){
  const d=getPlan()[dk];if(!_isPlanDay(d))return 0;
  const pm=_isPlainObj(S.planMeta)?S.planMeta:null,did=d.did;
  return _planDayMinutes(dk,{bal:pm?pm.balMin||0:0,apx:pm&&pm.apx&&pm.apx[did]!=null?pm.apx[did]:undefined,inicio:!!(pm&&(pm.modes||[]).includes('inicio'))});
}
// (E5, §G.6) Zona del mapa muscular por grupo. Con rutina generada, la suya: lo ≈ objetivo − 0,75 (mín. 2; 4 en los grandes) y hi =
// el mayor entre el techo y lo que la propia rutina da al grupo contado como el mapa × 1,2 (los hombros, por la rutina: sin falsos
// «por encima» por el trabajo de rebote). Sin ella, 8-16 como siempre.
const _MM_BIG=['pecho','espalda','hombros','cuads','isquios','gluteos'];
function _mmZoneOf(plan,wt,vol){
  const z={};let st;try{st=mmPlanStats(plan,wt);}catch(e){return z;}
  st.groups.forEach(g=>{
    const ids=g.id==='hombros'?['hombro_lat','hombro_post']:[g.id],vs=ids.map(k=>vol&&vol[k]).filter(Boolean);if(!vs.length)return;
    const obj=vs.reduce((a,v)=>a+(+v.obj||0),0)/vs.length,techo=Math.max(...vs.map(v=>+v.techo||0));
    const lo=Math.max(_MM_BIG.includes(g.id)?4:2,Math.round(obj-0.75));
    const hi=Math.max(Math.round(techo),Math.round(g.v*1.2),lo+2);
    z[g.id]=[Math.min(lo,38),Math.min(hi,40)];
  });
  return z;
}
function mmZone(gid){const z=S&&_isPlainObj(S.planMeta)&&_isPlainObj(S.planMeta.zone)?S.planMeta.zone[gid]:null;return Array.isArray(z)?{lo:z[0],hi:z[1],own:true}:MM_ZONE;}
function mmOwnZones(){return!!(S&&_isPlainObj(S.planMeta)&&_isPlainObj(S.planMeta.zone)&&Object.keys(S.planMeta.zone).length);}
{const _v0=JSON.stringify([S.profile,S.places,S.health,S.planMeta,S.planPrev,S.obDraft,S.rotBack,S.bkHealth]);_sanitizeV21(S);
  if(JSON.stringify([S.profile,S.places,S.health,S.planMeta,S.planPrev,S.obDraft,S.rotBack,S.bkHealth])!==_v0)saveState();}
// Ejercicio de la biblioteca de uno del plan (o null): su lib → el del plan original (PLAN_ANIM, salvo cardio: ese va por
// nombre) → su nombre. Nunca lee el tipo ni los campos del catálogo de la copia del plan: siempre del catálogo.
function _libIdOf(ex){
  if(!ex)return null;
  if(ex.lib&&LIB_BY_ID.has(ex.lib))return ex.lib;
  const pa=PLAN_ANIM[ex.id];if(pa&&LIB_BY_ID.has(pa)&&!LIB_BY_ID.get(pa).cardio)return pa;
  const b=LIB_BY_N.get(ex.n);return b?b.id:null;
}
function exLib(ex){const id=_libIdOf(ex);return id?LIB_BY_ID.get(id):null;}
// Tipo de registro (LT) de un ejercicio: el de su ejercicio de la biblioteca; si no tiene (personalizado o importado),
// por su objetivo y equipo: cardio · «30s»/«1 min» tiempo · «20m» distancia · peso corporal · si no, peso × reps
const _RE_T=/^\d+(?:[.,]\d+)?\s*(?:s|seg|segs|segundos|min|mins|minutos)$/i,_RE_D=/^\d+(?:[.,]\d+)?\s*(?:m|metros|km)$/i;
function exLT(ex){
  if(!ex)return'w';
  const L=exLib(ex);if(L)return L.lt;
  if(ex.cardio)return'c';
  const r=String(ex.r==null?'':ex.r).trim();
  if(_RE_T.test(r))return't';if(_RE_D.test(r))return'd';
  if(BODYWEIGHT_LIB.includes(ex.lib)||BODYWEIGHT_LIB.includes(ex.id)||/peso corporal|bodyweight|barra fija/i.test(String(ex.eq||'')))return'bw';
  return'w';
}
// Lugar: g gimnasio · c casa · a los dos. ¿Se puede hacer ahí?
function plOk(L,place){return !!L&&(L.pl==='a'||L.pl===place);}
// Copia para el plan (lo que se guarda en S.currentPlan): solo los campos de siempre, con su id y su lib
const LIB_COPY_KEYS=['n','ic','eq','muscle','s','r','tip'];
function _libCopy(L,id){const o={id};LIB_COPY_KEYS.forEach(k=>{o[k]=L[k];});if(L.cardio)o.cardio=true;else o.compound=!!L.compound;o.lib=L.id;return o;}
// Crear copia de ejercicio de la biblioteca con nuevo ID único
function libExToEx(L){return _libCopy(L,'ex_'+Date.now()+'_'+Math.random().toString(36).slice(2,6));}
// Familia del objetivo: reps (w, bw, r) · t tiempo · d distancia · c cardio
function _tgtFam(lt){return lt==='t'||lt==='d'||lt==='c'?lt:'reps';}
// Familia del historial: la del objetivo, pero con los kilos aparte (unos registros de peso × reps no pasan a unas
// flexiones ni a un remo con banda, ni al revés)
function _histFam(lt){return lt==='w'?'w':_tgtFam(lt);}
// Al cambiar un ejercicio por otro, el nuevo se queda tus series y tu objetivo solo si se miden igual (12 reps no pasan a
// una plancha, ni «30s» a un curl). Cardio: 1 serie y tu duración si el anterior también era cardio.
function _carryTarget(from,to){
  if(!from)return to;
  if(to.cardio){to.s=1;if(from.cardio&&from.r)to.r=from.r;return to;}
  if(from.s&&!from.cardio)to.s=Math.max(1,Math.min(10,parseInt(from.s)||to.s));
  const fa=_tgtFam(exLT(from)),fb=_tgtFam(exLT(to));
  if(from.r!=null&&from.r!==''&&fa===fb&&(fa!=='reps'||(_repsTgt(from.r)&&_repsTgt(to.r))))to.r=from.r;
  return to;
}
// Objetivo por tiempo («30s», «45 seg», «1 min», «1:30») en segundos y por distancia («20m», «0.4 km») en metros; null si
// no se entiende. Un número suelto vale como segundos (o metros): así se curan las planchas que el editor dejó en «29».
// Solo tiene sentido en un ejercicio de ese tipo (exLT t o d).
function _tgtSecs(ex){
  const r=String(ex&&ex.r!=null?ex.r:'').trim().toLowerCase();
  let m=r.match(/^(\d{1,2}):(\d{2})(?:\s*min)?$/);if(m)return _setNumT(+m[1]*60+(+m[2]));
  m=r.match(/^(\d+(?:[.,]\d+)?)\s*(s|seg|segs|segundos|min|mins|minutos)?$/);if(!m)return null;
  const n=parseFloat(m[1].replace(',','.'));return _setNumT(/^min/.test(m[2]||'')?n*60:n);
}
function _tgtMetres(ex){
  const m=String(ex&&ex.r!=null?ex.r:'').trim().toLowerCase().match(/^(\d+(?:[.,]\d+)?)\s*(m|metros|km)?$/);if(!m)return null;
  const n=parseFloat(m[1].replace(',','.'));return _setNumD(m[2]==='km'?n*1000:n);
}
// Lo escrito en una serie por tiempo: «90», «1:30» o «90s» → 90
function _parseSecs(raw){return _tgtSecs({r:raw});}
// 45 → «45 s», 60 → «1 min», 90 → «1:30 min» · 30 → «30 m». Número y unidad van con espacio duro (NB): en pantallas
// estrechas una línea no se parte entre «30» y «m»
const NB=' ';
// Separador dentro de un valor («20 kg · 30 m»): sin cortes de línea alrededor del punto
const NBD=NB+'·'+NB;
function fmtSecs(s){s=Math.round(+s);if(!(s>0))return'';if(s<60)return s+NB+'s';const m=Math.floor(s/60),x=s%60;return x?`${m}:${String(x).padStart(2,'0')}${NB}min`:`${m}${NB}min`;}
function fmtM(m){m=Math.round(+m);return m>0?m+NB+'m':'';}
// «15 reps» / «1 rep» sin partir; «20 kg»
function _repsNB(v){return v+NB+(Number(v)===1?'rep':'reps');}
function _kgNB(w){return kgTxt(w)+NB+'kg';}
// Objetivo corto para los textos de las propuestas («3×30s», «3×20m», «3×12»): sin espacios (_propPrevPlan corta ahí)
function _tgtShort(ex){
  const lt=exLT(ex);
  if(lt==='t'){const s=_tgtSecs(ex);return s?s+'s':ex.r;}
  if(lt==='d'){const m=_tgtMetres(ex);return m?m+'m':ex.r;}
  return ex.r;
}
// Saltos de los −/+ de tiempo (5 s; de 15 en 15 desde 2 min) y de distancia (5, 10, 50 o 100 m según la distancia)
function _tStep(v){return v<120?5:15;}
function _dStep(v){return v<50?5:v<200?10:v<1000?50:100;}
// Clases de carga sin kilos: bandas y material sin peso (TRX, fitball, rueda…): sus filas no tienen celda de peso
const LOAD_NOKG=new Set(['banda','none']);
// Tipo de un registro: el que guardó (lt) o, si no lo guarda (todos los de antes), peso × reps. Nunca el del ejercicio:
// una plancha antigua con un disco es un registro de kg ({v:10}), no uno por tiempo.
function _recLT(rec){return rec&&REC_LT.includes(rec.lt)?rec.lt:'w';}
// Medida de un registro según su tipo: reps (bw, r), segundos (t) o metros (d); null si no la tiene
function _recMetric(rec,lt){lt=lt||_recLT(rec);return !rec?null:lt==='t'?_setNumT(rec.t):lt==='d'?_setNumD(rec.m):_setNumR(rec.r);}
// Texto de una medida: 15 → «15 reps» / «45 s» / «30 m»
function _metricTxt(v,lt){return v==null?'—':lt==='t'?fmtSecs(v):lt==='d'?fmtM(v):_repsNB(v);}
// Unidad corta de una medida (para «+3 reps», «Mejor (s)»)
// (16e) Consejo del catálogo al pintarlo: «3–5 %», «1 % de inclinación», «5 km/h» con espacio duro y raya de intervalo (los datos no cambian)
function _tipHtml(t){return esc(String(t||'').replace(/(\d)-(\d)/g,'$1–$2').replace(/(\d)[ \u00a0]?%/g,'$1'+NB+'%').replace(/(\d) (km\/h|min|kg|cm|reps?|series?|RPM|m|s|segundos?|minutos?|horas?|metros?|kil[oó]metros?|kilos?|ejercicios?|rondas?|vueltas?|veces|pasos?|días?|semanas?)(?![\wáéíóúñ])/g,'$1'+NB+'$2').replace(/(\d)(s|min)(?![\wáéíóúñ])/g,'$1'+NB+'$2'));} // (16e r1) + reps/series/RPM; «2–3s» → «2–3 s»; (17) + unidades escritas («4–5 segundos», «5 minutos», «4–5 ejercicios»)
function _metricU(lt){return lt==='t'?'s':lt==='d'?'m':'reps';}
// Lo hecho en un registro: «3×15 reps», «3×45 s», «24 kg · 3×30 m» (los de kg: «57.5 kg»)
function _recValTxt(rec){
  if(!rec)return'';
  const lt=_recLT(rec),w=_setNumW(rec.v),sd=parseInt(rec.setsDone),x=_recMetric(rec,lt),pre=sd>0?sd+'×':'';
  if(lt==='w')return w!=null?_kgNB(w):'—';
  if(lt==='t'||lt==='d'){const mt=x==null?'':pre+(lt==='t'?fmtSecs(x):fmtM(x));return w!=null?_kgNB(w)+(mt?NBD+mt:''):(mt||'—');}
  return w!=null?_kgNB(w)+(x!=null?' × '+x:''):x!=null?pre+_repsNB(x):'—';
}
// Con el mismo peso, lo ganado en segundos o metros entre dos registros por tiempo o distancia (a frente a b): {v, lt},
// o null si no son los dos del mismo tipo (t o d) con su medida
function _tdGain(a,b){
  const la=_recLT(a);if((la!=='t'&&la!=='d')||_recLT(b)!==la)return null;
  const x=_recMetric(a,la),y=_recMetric(b,la);return x!=null&&y!=null?{v:x-y,lt:la}:null;
}
// Lo ganado (_tdGain) por el último registro de una lista (de más antiguo a más nuevo) frente al PRIMERO que tiene su
// medida con el mismo peso: las planchas o paseos antiguos con disco no guardaban segundos ni metros y no cuentan
function _tdGainSince(list){
  const n=list.length,l=list[n-1];if(n<2||!l)return null;
  for(let i=0;i<n-1;i++){const r=list[i];if(r&&Math.abs((+r.v||0)-(+l.v||0))<PR_EPS){const g=_tdGain(l,r);if(g)return g;}}
  return null;
}
// Peso corporal con el mismo lastre: lo ganado en reps (serie top) por el último registro frente al primero con ese lastre
function _lrReps(r){const tp=_recTop(r);return(tp&&tp.r)||_setNumR(r&&r.r)||null;}
function _lrGainSince(list){
  const n=list.length,l=list[n-1],b=n>=2&&l?_lrReps(l):null;if(b==null)return null;
  for(let i=0;i<n-1;i++){const r=list[i];if(r&&Math.abs((+r.v||0)-(+l.v||0))<PR_EPS){const a=_lrReps(r);if(a!=null)return b-a;}}
  return null;
}
// Banda más dura (clase banda, solo reps sin peso): la vez anterior llegó al tope de su rango en todas las series y ahora
// hay menos reps. Es el cambio de banda que pide el Coach (la misma regla de reinicio que su tendencia), no un
// retroceso: el resumen, el historial y Progreso lo marcan «banda más dura» en vez de «−3 reps».
// Solo cuando el Coach la pidió (_presReps): con las mismas condiciones. Si la vez anterior fue «al límite» (RPE 3), si
// entre las dos pasaron 3 semanas o más (LOAD_GAP_DAYS), si el plan subió de series sin completarlas o si la de ahora
// fue de semana ligera (dl: el Coach pidió «suave»), el Coach no la pidió, así que menos reps es una bajada de verdad.
function _bandUp(ex,prev,cur){
  if(!ex||!prev||!cur||+prev.v>0||+cur.v>0||cur.dl||loadEqClass(ex)!=='banda')return false;
  const lp=_recLT(prev),lc=_recLT(cur);if(lp==='w'||lc==='w'||_prXType(lp)!=='xr'||_prXType(lc)!=='xr')return false;
  const a=_recMetric(prev,lp),b=_recMetric(cur,lc);if(a==null||b==null||b>=a)return false;
  const pl=_recPlan(prev,ex),rg=_repRangeBW({r:pl.r})||_repRangeBW(ex),sd=parseInt(prev.setsDone);
  if(!rg||a<rg.hi)return false;
  // Series del plan cuando se hizo cur (las que el Coach tenía delante): completas y sin subir de series a medias
  const bs=_recPlan(cur,ex).s;
  if(sd>=0&&sd<Math.min(pl.s,bs))return false;
  if(pl.s<bs&&!(sd>=bs))return false;
  if(rpeCat(prev.rpe)===3)return false;
  const gap=+prev.ts>0&&+cur.ts>0?Math.floor((+cur.ts-(+prev.ts))/86400000):0;
  return gap<LOAD_GAP_DAYS;
}
// Posiciones de una lista de registros (de más antiguo a más nuevo) en las que empieza una banda más dura
function _bandCuts(ex,list){const o=[];for(let i=1;i<list.length;i++)if(_bandUp(ex,list[i-1],list[i]))o.push(i);return o;}

