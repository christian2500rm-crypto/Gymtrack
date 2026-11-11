// ══════════════════════════════════════════════════════════
// MAPA MUSCULAR 3D — series efectivas por grupo muscular
// ══════════════════════════════════════════════════════════
// Cada serie hecha cuenta para cada músculo según su peso en la animación del ejercicio (spec.muscles de GymAnim,
// vía exAnimKey): el press inclinado cuenta 1 para pecho, 0.6 para hombros y 0.5 para tríceps. Dentro de un grupo con
// varios músculos (Pecho = pectoral + superior + inferior) cuenta el mayor, no la suma. El cardio no cuenta.
// Fuentes: registros de S.strength (setsDone) y, para lo que no tiene registro (peso corporal sin peso), las series
// marcadas del snapshot de cada sesión. Rangos: 7 días, media semanal de 4 semanas o del ciclo del Coach.
// La zona de 8-16 series/semana es una guía orientativa. El maniquí (GymAnim.muscleMap) brilla ∝ series de cada músculo.
const MM_RANGES=[['7d','7 días'],['4w','4 semanas'],['cycle','Ciclo']];
const MM_ZONE={lo:8,hi:16};
const MM_GROUPS=[
  {id:'pecho',n:'Pecho',mus:['pecs','upperpecs','lowerpecs'],lib:'pecho'},
  {id:'espalda',n:'Espalda',mus:['lats','midback','traps','lowback'],lib:'espalda'},
  {id:'hombros',n:'Hombros',mus:['frontdelts','sidedelts','reardelts'],pl:1,lib:'hombros'},
  {id:'biceps',n:'Bíceps',mus:['biceps'],lib:'biceps'},
  {id:'triceps',n:'Tríceps',mus:['triceps'],lib:'triceps'},
  {id:'abdomen',n:'Abdomen',mus:['abs','obliques'],lib:'core'},
  {id:'cuads',n:'Cuádriceps',mus:['quads'],lib:'piernas'},
  {id:'isquios',n:'Isquios',mus:['hams'],pl:1,lib:'piernas'},
  {id:'gluteos',n:'Glúteos',mus:['glutes','abductors'],pl:1,lib:'piernas'},
  {id:'gemelos',n:'Gemelos',mus:['calves'],pl:1,lib:'piernas'},
];
// músculo del maniquí → grupo (al tocarlo). Aductores y antebrazo no forman grupo propio: abren el más cercano.
const _MM_MUS2G={adductors:'cuads',forearms:'biceps'};MM_GROUPS.forEach(g=>g.mus.forEach(m=>{_MM_MUS2G[m]=g.id;}));
function mmRangeKey(){return MM_RANGES.some(r=>r[0]===S.mmRange)?S.mmRange:'4w';}
function mmFmt(v){return !(v>=.05)?'0':String(Math.round(v*10)/10);}
function mmCls(v,gid){const Z=mmZone(gid);return !(v>=.05)?'z0':v<Z.lo?'lo':v<=Z.hi?'ok':'hi';}
function mmZoneTxt(v,gid){const Z=mmZone(gid),o=Z.own;return !(v>=.05)?'Sin trabajo':v<Z.lo?(o?'Por debajo de su zona':'Por debajo de la zona'):v<=Z.hi?(o?'En su zona':'En la zona productiva'):(o?'Por encima de su zona':'Por encima de la zona');}
function _mmList(a){return a.length<2?(a[0]||''):a.slice(0,-1).join(', ')+' y '+a[a.length-1];}
// Músculos de un ejercicio {músculo: peso 0-1} sin sufijo de lado (los unilaterales se hacen con los dos brazos/piernas):
// los de su ejercicio de la biblioteca (mus); si no es de la biblioteca, los de su animación. null si es cardio o no hay.
const _mmMusCache=new Map();
function mmExMuscles(ex){
  if(!ex||ex.cardio||exLT(ex)==='c')return null;
  const L=exLib(ex),key=L?'L:'+L.id:'A:'+exAnimKey(ex);
  if(L&&L.pat==='bal')return null; // (E14a) el equilibrio no cuenta volumen
  if(_mmMusCache.has(key))return _mmMusCache.get(key);
  let src=L?L.mus:null;
  if(!L){const k=key.slice(2),A=LIB_BY_ID.get(k);if(k&&!(A&&A.cardio)&&typeof GymAnim!=='undefined'){const sp=GymAnim.get(k);src=sp&&sp.muscles;}}
  const out={};
  if(src&&typeof src==='object')Object.keys(src).forEach(k=>{
    const v=+src[k],m=k.replace(/_(L|R)$/,'');
    if(v>0&&isFinite(v)&&MUS_LBL[m])out[m]=Math.max(out[m]||0,Math.min(1,v));
  });
  const r=Object.keys(out).length?out:null;
  _mmMusCache.set(key,r);
  return r;
}
function mmGroupW(mus,g){let w=0;g.mus.forEach(m=>{if(mus[m]>w)w=mus[m];});return w;}
// Ejercicio de un id con historial: plan actual > plan original > biblioteca > {nombre guardado, grupo de sus registros}
function _mmExOf(id){
  const ex=findExInPlan(id);if(ex)return ex;
  const o=_origPlanEx(id);if(o)return o.ex;
  const lib=LIB_BY_ID.get(id);if(lib)return lib;
  const recs=Array.isArray(S.strength&&S.strength[id])?S.strength[id]:[];
  const mr=recs.slice().reverse().find(r=>r&&r.muscle);
  return{id,n:exDisplayName(id),muscle:mr?mr.muscle:null};
}
// Series de un registro: setsDone; si falta (registros muy antiguos), las series del plan con el que se hizo
function _mmSetsOf(r,ex){
  const n=parseInt(r.setsDone);
  if(r.setsDone!=null&&isFinite(n))return Math.max(0,Math.min(20,n));
  return Math.min(20,parseInt(r.ps)||parseInt(ex&&ex.s)||3);
}
function mmCollect(from,to){
  const byId=new Map(),seen=new Set();
  const add=(id,n)=>{
    if(!(n>0))return;
    let it=byId.get(id);
    if(!it){const ex=_mmExOf(id);it={id,ex,mus:mmExMuscles(ex),sets:0,name:exDisplayName(id)};byId.set(id,it);}
    it.sets+=n;
  };
  const st=_isPlainObj(S.strength)?S.strength:{};
  // (copias antiguas sin ts: registros y sesiones con la fecha de su «d» / «date», como el resto de Progreso)
  Object.keys(st).forEach(id=>{
    if(!Array.isArray(st[id]))return;
    _progSrc(id).forEach((r,i)=>{
      if(!r||typeof r!=='object')return;
      const ts=+r.ts;if(!isFinite(ts)||ts<from||ts>to)return;
      seen.add(id+'|'+ts);if(r!==st[id][i])seen.add(id+'|d'+_startOfDay(ts));
      add(id,_mmSetsOf(r,findExInPlan(id)||(_origPlanEx(id)||{}).ex));
    });
  });
  // Series marcadas sin registro de fuerza (p. ej. plancha o flexiones sin peso): del snapshot de la sesión
  _wrSessions(from,to+1).forEach(({s,ts})=>{
    const sn=s.snapshot&&s.snapshot.sets;if(!_isPlainObj(sn))return;
    const est=ts!==+s.ts;
    Object.keys(sn).forEach(id=>{
      if(seen.has(id+'|'+ts)||est&&seen.has(id+'|d'+_startOfDay(ts))||!_isPlainObj(sn[id]))return;
      add(id,Math.min(20,Object.values(sn[id]).filter(Boolean).length));
    });
  });
  return[...byId.values()].filter(it=>it.mus);
}
function _mmFirstTs(){
  let t=Infinity;
  (Array.isArray(S.sessions)?S.sessions:[]).forEach(s=>{if(s&&+s.ts>0&&+s.ts<t)t=+s.ts;});
  if(t===Infinity)Object.values(_isPlainObj(S.strength)?S.strength:{}).forEach(a=>{if(Array.isArray(a))a.forEach(r=>{if(r&&+r.ts>0&&+r.ts<t)t=+r.ts;});});
  return t===Infinity?Date.now():t;
}
// Periodo de un rango: desde, semanas para la media (mínimo 1) y texto
function mmRangeInfo(k,now){
  now=now||Date.now();
  const WK=7*DAY_MS;
  if(k==='7d')return{k,from:now-WK,to:now+60000,weeks:1,lbl:'últimos 7 días',per:'en 7 días'};
  if(k==='cycle'){
    const from=Math.min(now,+coach_cycleStart()||now),w=Math.max(1,(now-from)/WK);
    return{k,from,to:now+60000,weeks:w,lbl:`media del ciclo actual · ${plural(Math.round(w*10)/10,'semana')}`,per:'en el ciclo'};
  }
  const from=now-4*WK,w=Math.min(4,Math.max(1,(now-Math.max(from,_mmFirstTs()))/WK));
  return{k:'4w',from,to:now+60000,weeks:w,lbl:w>=3.95?'media de las últimas 4 semanas':`media de ${plural(Math.round(w*10)/10,'semana')} (desde que empezaste)`,per:'en 4 semanas'};
}
// items [{id,name,mus,sets,day?}] → por grupo (series/semana) y por músculo (para el maniquí)
function _mmAggregate(items,weeks,R){
  const mus={},groups=MM_GROUPS.map(g=>({id:g.id,n:g.n,pl:!!g.pl,lib:g.lib,v:0,total:0,ex:[]}));
  let sets=0;
  items.forEach(it=>{
    sets+=it.sets;
    Object.keys(it.mus).forEach(m=>{mus[m]=(mus[m]||0)+it.sets*it.mus[m];});
    groups.forEach((g,i)=>{
      const w=mmGroupW(it.mus,MM_GROUPS[i]);
      if(w>0){const c=it.sets*w;g.total+=c;g.ex.push({id:it.id,name:it.name,sets:it.sets,w,c,day:it.day||null});}
    });
  });
  groups.forEach(g=>{g.v=g.total/weeks;g.ex.sort((a,b)=>b.c-a.c||String(a.name).localeCompare(String(b.name)));});
  Object.keys(mus).forEach(m=>{mus[m]/=weeks;});
  return{R,weeks,items,groups,mus,sets};
}
// Series hechas en un rango ('7d' | '4w' | 'cycle')
function mmStats(k){
  const R=mmRangeInfo(k||mmRangeKey());
  return _mmAggregate(mmCollect(R.from,R.to),R.weeks,R);
}
// Volumen PLANIFICADO de la rutina por semana: series de cada día (las de verdad, sin la descarga) × veces por semana
// que toca ese día (objetivo semanal / nº de días de la rutina)
function mmPlanStats(plan,wt){ // (E5) plan y objetivo semanal de una rutina candidata; por defecto, los tuyos
  plan=plan||routinePlan();const days=liveDayKeys(plan); // (E1b) los días vacíos no rotan: no reparten las sesiones de la semana
  const per=days.length?(wt||getWeeklyTarget())/days.length:0,items=[];
  days.forEach(dk=>plan[dk].ex.forEach(ex=>{
    if(!ex||ex.cardio)return;
    const mus=mmExMuscles(ex);if(!mus)return;
    items.push({id:ex.id,mus,sets:_baseSets(ex)*per,name:ex.n||exDisplayName(ex.id),day:dk});
  }));
  return _mmAggregate(items,1,{k:'plan',lbl:'tu rutina planificada',per:'por semana',weeks:1,freq:per});
}
// Brillo del maniquí (0-1): series/semana de cada músculo frente al más trabajado (mínimo 12 de referencia)
function mmWeights(st){
  const ref=Math.max(12,...Object.values(st.mus)),w={};
  Object.keys(st.mus).forEach(m=>{if(st.mus[m]>0)w[m]=Math.min(1,st.mus[m]/ref);});
  return w;
}
// Una frase: el desequilibrio más claro (isquios/glúteos frente a cuádriceps, pecho frente a espalda, bíceps frente a
// tríceps), o los grupos sin trabajo, o cómo está el volumen respecto a la zona orientativa.
// plan (mmPlanStats, opcional, con las series hechas): un grupo a 0 que la rutina sí trabaja dice qué día le toca.
function mmInsight(st,plan){
  const G={};st.groups.forEach(g=>{G[g.id]=g;});
  if(st.groups.reduce((a,g)=>a+g.v,0)<.3)return'';
  // Día de la rutina que más trabaja un grupo (null si la rutina no lo trabaja)
  const dayOf=gid=>{
    const pg=plan&&plan.groups.find(g=>g.id===gid);
    if(!pg||!(pg.v>=.05))return null;
    const by={};pg.ex.forEach(e=>{if(e.day)by[e.day]=(by[e.day]||0)+e.c;});
    const d=Object.keys(by).sort((a,b)=>by[b]-by[a])[0],dd=d&&getPlan()[d];
    return dd&&dd.label?dd.label:null;
  };
  const per=st.R&&st.R.per?st.R.per:'en este periodo';
  const notYet=(a,pl,day)=>`${a} aún sin series ${per}: ${pl?'les':'le'} toca en tu ${day}.`;
  const cands=[];
  const push=(a,pl,va,b,vb,ids)=>{if(vb>=2&&va/vb<=.65)cands.push({a,pl,va,b,vb,r:va/vb,ids});};
  const q=G.cuads.v,h=G.isquios.v,gl=G.gluteos.v;
  if(q>=2&&h/q<=.65&&gl/q<=.65&&Math.abs(h-gl)<=q*.2)push('Isquios y glúteos',true,(h+gl)/2,'cuádriceps',q,['isquios','gluteos']);
  else{push('Isquios',true,h,'cuádriceps',q,['isquios']);push('Glúteos',true,gl,'cuádriceps',q,['gluteos']);}
  push('Pecho',false,G.pecho.v,'espalda',G.espalda.v,['pecho']);push('Espalda',false,G.espalda.v,'pecho',G.pecho.v,['espalda']);
  push('Bíceps',false,G.biceps.v,'tríceps',G.triceps.v,['biceps']);push('Tríceps',false,G.triceps.v,'bíceps',G.biceps.v,['triceps']);
  if(cands.length){
    const c=cands.sort((x,y)=>x.r-y.r)[0],vb=c.pl?'reciben':'recibe';
    // Aún a 0 pero la rutina lo trabaja (p. ej. al empezar, antes del Día C): no es un desequilibrio, es que falta ese día
    const d=!(c.va>=.05)?dayOf(c.ids[0]):null;
    if(d)return notYet(c.a,c.pl,d);
    const f=c.r<.15?`muy poco frente a ${c.b}`:c.r<.29?`una cuarta parte de las series de ${c.b}`:c.r<.42?`un tercio de las series de ${c.b}`
      :c.r<.58?`la mitad que ${c.b}`:`un ${Math.round((1-c.r)*20)*5} % menos que ${c.b}`;
    return`${c.a} ${vb} ${f} (${mmFmt(c.va)} frente a ${mmFmt(c.vb)} series/sem).`;
  }
  const zero=st.groups.filter(g=>!(g.v>=.05));
  if(zero.length){
    const off=zero.filter(g=>!dayOf(g.id));
    if(plan&&!off.length){const g=zero[0];return notYet(g.n,g.pl,dayOf(g.id));}
    return`Sin trabajo directo${plan?' en tu rutina':''}: ${_mmList((plan?off:zero).map(g=>g.n.toLowerCase()))}.`;
  }
  const mx=Math.max(...st.groups.map(g=>g.v));
  const own=mmOwnZones(); // (E5) con rutina generada, la zona de cada grupo
  if(own?st.groups.every(g=>g.v<mmZone(g.id).lo):mx<MM_ZONE.lo)return own?'Ningún grupo llega aún a su zona. Empezando es normal: si te recuperas bien, suma series poco a poco.':`Ningún grupo llega aún a ${MM_ZONE.lo} series/semana. Empezando es normal: si te recuperas bien, suma series poco a poco.`;
  const big=st.groups.filter(g=>g.v>mmZone(g.id).hi*1.25);
  if(big.length)return own?`${_mmList(big.map(g=>g.n))} ${big.length>1||big[0].pl?'pasan':'pasa'} bastante de su zona: si notas fatiga, ahí hay margen para recortar.`:`${_mmList(big.map(g=>g.n))} ${big.length>1||big[0].pl?'pasan':'pasa'} de ${MM_ZONE.hi*1.25} series/semana: si notas fatiga, ahí hay margen para recortar.`;
  const inZ=st.groups.filter(g=>{const Z=mmZone(g.id);return g.v>=Z.lo&&g.v<=Z.hi;}).length;
  return own?`Buen reparto: ${inZ} de ${st.groups.length} grupos en su zona.`:`Buen reparto: ${inZ} de ${st.groups.length} grupos en la zona de ${MM_ZONE.lo}–${MM_ZONE.hi} series/semana.`;
}
// Barras por grupo con la franja de la zona productiva. tap: filas de 44 px que abren la hoja del grupo
function mmBarsHtml(st,o){
  o=o||{};
  const mx=Math.max(20,...st.groups.map(g=>Math.max(g.v,mmZone(g.id).hi)))*1.04;
  return st.groups.map(g=>{
    const Z=mmZone(g.id),zl=(Z.lo/mx*100).toFixed(1),zw=((Z.hi-Z.lo)/mx*100).toFixed(1); // (E5) la franja de cada grupo
    const cls=mmCls(g.v,g.id),val=mmFmt(g.v),w=Math.min(100,g.v/mx*100).toFixed(1);
    const inner=`<span class="mm-n">${g.n}</span><span class="mm-track"><i class="mm-zone" style="left:${zl}%;width:${zw}%"></i><i class="mm-fill ${cls}" style="width:${w}%"></i></span><span class="mm-v ${cls}">${val}</span>`;
    return o.tap
      ?`<button class="mm-row" data-g="${g.id}" onclick="openMuscleSheet('${g.id}','${o.src||'prog'}')" aria-label="${g.n}: ${val} series por semana, ${mmZoneTxt(g.v,g.id).toLowerCase()}. Ver ejercicios">${inner}<span class="mm-chev" aria-hidden="true">›</span></button>`
      :`<div class="mm-row sm" data-g="${g.id}">${inner}</div>`;
  }).join('');
}
function mmAria(st,src){
  const on=st.groups.filter(g=>g.v>=.05).sort((a,b)=>b.v-a.v);
  const head=src==='plan'?'Mapa muscular de tu rutina planificada, de frente y de espalda':'Mapa muscular de frente y de espalda';
  if(!on.length)return`${head}: sin series todavía.`;
  const low=st.groups.filter(g=>g.v<mmZone(g.id).lo).sort((a,b)=>a.v-b.v).slice(0,3);
  return`${head}. Más series por semana: ${on.slice(0,3).map(g=>`${g.n} ${mmFmt(g.v)}`).join(', ')}.${low.length?` Menos: ${low.map(g=>`${g.n} ${mmFmt(g.v)}`).join(', ')}.`:''} Toca un músculo para ver sus ejercicios.`;
}
// Maniquí: se pinta un hueco data-mm y mmMountAll lo monta (o reutiliza el canvas anterior con setWeights)
const _mmMountData={};
function mmFigHtml(key,st,src,h){
  _mmMountData[key]={weights:mmWeights(st),label:mmAria(st,src),src};
  return`<div class="mm-fig" data-mm="${key}" style="height:${h}px"></div>`;
}
function mmDetach(root){
  const keep=new Map();
  if(root)root.querySelectorAll('[data-mm]').forEach(el=>{if(el._gm)keep.set(el.getAttribute('data-mm'),el);});
  return keep;
}
function mmMountAll(root,keep){
  if(!root)return;
  const ok=typeof GymAnim!=='undefined'&&typeof GymAnim.muscleMap==='function';
  root.querySelectorAll('[data-mm]').forEach(el=>{
    const key=el.getAttribute('data-mm'),d=_mmMountData[key];
    if(!d||!ok)return;
    let target=el;
    const old=keep&&keep.get(key);
    // mismo mapa antes y después de repintar: se conserva su canvas (sin parpadeo ni volver a montarlo)
    if(old&&old!==el&&old._gm){old.className=el.className;old.style.cssText=el.style.cssText;el.replaceWith(old);target=old;keep.delete(key);}
    try{GymAnim.muscleMap(target,{weights:d.weights,label:d.label,view:'both',onPick:m=>mmPick(m,d.src)});}catch(e){console.error(e);}
  });
  if(keep&&ok)keep.forEach(el=>{try{GymAnim.unmount(el);}catch(e){}});
}
function mmUnmountIn(root){
  if(root&&typeof GymAnim!=='undefined'&&GymAnim.unmount)root.querySelectorAll('[data-mm]').forEach(el=>{try{GymAnim.unmount(el);}catch(e){}});
}
function mmPick(m,src){const g=_MM_MUS2G[m];if(g)openMuscleSheet(g,src);}
function mmRangeChips(k){
  return`<div class="wc-ranges" role="tablist" aria-label="Periodo del mapa muscular">${MM_RANGES.map(r=>`<button class="wc-rg${r[0]===k?' on':''}" role="tab" aria-selected="${r[0]===k}" onclick="setMMRange('${r[0]}')">${r[1]}</button>`).join('')}</div>`;
}
// Progreso: tarjeta principal (selector de rango, maniquí, frase, barras por grupo)
function mmProgBodyHtml(st){
  if(!st.sets){
    const none=!(Array.isArray(S.sessions)&&S.sessions.length);
    return`<div class="mm-empty">${none?'Completa entrenamientos y aquí verás qué músculos trabajas y cuánto.':'Sin series en este periodo. Prueba con otro rango.'}</div>`;
  }
  const ins=mmInsight(st,mmPlanStats());
  return`${ins?`<div class="mm-ins" id="mm-ins-prog">${ic('bulb')} ${_nwUnits(esc(ins))}</div>`:''}
    <div class="mm-sub">Series efectivas por semana · ${_nwUnits(esc(st.R.lbl))}</div>
    <div class="mm-bars">${mmBarsHtml(st,{tap:true,src:'prog'})}</div>
    <div class="mm-foot"><i aria-hidden="true"></i><span>${mmOwnZones()?'La franja de cada grupo es su zona, según tu rutina y tu objetivo. Es una guía orientativa, no una regla.':`Zona productiva: <span class="nw">${MM_ZONE.lo}–${MM_ZONE.hi} series</span> por semana y grupo. Es una guía orientativa, no una regla.`} Toca un grupo para ver sus ejercicios.</span></div>`;
}
function mmProgCardHtml(){
  const k=mmRangeKey(),st=mmStats(k);
  return`<div class="card mm-card" id="mm-prog">
    <div id="mm-rg">${mmRangeChips(k)}</div>
    ${mmFigHtml('prog',st,'prog',270)}
    <div class="mm-heat" aria-hidden="true"><span>Pocas series</span><i></i><span>Muchas</span></div>
    <div id="mm-prog-body">${mmProgBodyHtml(st)}</div>
  </div>`;
}
// Cambiar de rango repinta solo la tarjeta y actualiza el maniquí sin volver a montarlo
function setMMRange(k){
  if(!MM_RANGES.some(r=>r[0]===k))return;
  S.mmRange=k;saveState();
  const card=document.getElementById('mm-prog');
  if(!card){render();return;}
  const st=mmStats(k);
  const rg=document.getElementById('mm-rg');if(rg)rg.innerHTML=mmRangeChips(k);
  const body=document.getElementById('mm-prog-body');if(body)body.innerHTML=mmProgBodyHtml(st);
  _mmMountData.prog={weights:mmWeights(st),label:mmAria(st,'prog'),src:'prog'};
  const fig=card.querySelector('[data-mm="prog"]');
  if(fig&&typeof GymAnim!=='undefined'&&GymAnim.muscleMap)GymAnim.muscleMap(fig,{weights:_mmMountData.prog.weights,label:_mmMountData.prog.label});
}
// Coach: versión compacta (mismo rango que Progreso)
function mmCoachCardHtml(){
  const k=mmRangeKey(),st=mmStats(k);
  if(!st.sets)return'';
  const ins=mmInsight(st,mmPlanStats());
  const low=st.groups.filter(g=>g.v<mmZone(g.id).lo).sort((a,b)=>a.v-b.v).slice(0,3);
  return`<div class="sh">Tus músculos · ${k==='7d'?'últimos 7 días':k==='cycle'?'este ciclo':'4 semanas'}</div>
  <div class="card mm-card mm-mini" id="mm-coach">
    ${mmFigHtml('coach',st,'coach',190)}
    ${ins?`<div class="mm-ins">${ic('bulb')} ${_nwUnits(esc(ins))}</div>`:''}
    ${low.length?`<div class="mm-mini-l">${mmOwnZones()?'Por debajo de su zona':`Por debajo de <span class="nw">${MM_ZONE.lo} series/semana</span>`}</div>
    <div class="mm-chips">${low.map(g=>`<button class="mm-chip ${mmCls(g.v,g.id)}" onclick="openMuscleSheet('${g.id}','coach')" aria-label="${g.n}: ${mmFmt(g.v)} series por semana. Ver ejercicios">${g.n} <b>${mmFmt(g.v)}</b></button>`).join('')}</div>`:''}
    <button class="mm-link" onclick="goMuscleMap()">Ver el mapa completo en Progreso ›</button>
  </div>`;
}
function goMuscleMap(){
  go('prog');
  requestAnimationFrame(()=>{const el=document.getElementById('mm-prog'),sc=document.getElementById('screen');
    if(el&&sc)sc.scrollTop=Math.max(0,el.offsetTop-60);});
}
// Editor de rutina: volumen semanal PLANIFICADO (se actualiza al cambiar series o ejercicios)
function mmPlanBlockHtml(){
  const st=mmPlanStats(),ins=mmInsight(st);
  return`<div class="mm-plan" id="mm-plan">
    <div class="mm-plan-h"><span>Volumen semanal planificado</span><span class="mm-plan-s"><span class="nw">${esc(plural(getWeeklyTarget(),'día'))}/semana</span> · series</span></div>
    <div class="mm-plan-row">
      ${mmFigHtml('plan',st,'plan',178)}
      <div class="mm-bars" id="mm-plan-bars">${mmBarsHtml(st,{})}</div>
    </div>
    <div class="mm-ins sm" id="mm-plan-ins">${ins?_nwUnits(esc(ins)):`Toca el maniquí para ver qué ejercicios trabajan cada músculo.`}</div>
  </div>`;
}
function mmPlanRefresh(){
  const box=document.getElementById('mm-plan');if(!box)return;
  const st=mmPlanStats(),ins=mmInsight(st);
  const b=document.getElementById('mm-plan-bars');if(b)b.innerHTML=mmBarsHtml(st,{});
  const i=document.getElementById('mm-plan-ins');if(i)i.innerHTML=ins?_nwUnits(esc(ins)):'Toca el maniquí para ver qué ejercicios trabajan cada músculo.';
  _mmMountData.plan={weights:mmWeights(st),label:mmAria(st,'plan'),src:'plan'};
  const f=box.querySelector('[data-mm="plan"]');
  if(f&&typeof GymAnim!=='undefined'&&GymAnim.muscleMap)GymAnim.muscleMap(f,{weights:_mmMountData.plan.weights,label:_mmMountData.plan.label});
}
// Hoja de un grupo: series/semana, zona y ejercicios que lo trabajan (con su peso para ese grupo)
let _mmSheet=null; // {g, src:'prog'|'coach'|'plan'} · variable de módulo (no se guarda en S)
function openMuscleSheet(gid,src){
  if(!MM_GROUPS.some(g=>g.id===gid))return;
  _mmSheet={g:gid,src:src==='plan'?'plan':src==='coach'?'coach':'prog'};
  renderMuscleSheet();
}
function closeMuscleSheet(){_mmSheet=null;renderMuscleSheet();}
function mmAddFor(gid){
  const g=MM_GROUPS.find(x=>x.id===gid);if(!g)return;
  const dk=_editDayOr(_editDay); // (E1a)
  closeMuscleSheet();
  const [z,sub]=MM2SUB[gid]||[g.lib,null];
  addExerciseUI(dk,z,sub);
}
function renderMuscleSheet(){
  const root=document.getElementById('mmap-root');if(!root)return;
  if(!_mmSheet){root.innerHTML='';return;}
  const plan=_mmSheet.src==='plan';
  const st=plan?mmPlanStats():mmStats(mmRangeKey());
  const g=st.groups.find(x=>x.id===_mmSheet.g);
  if(!g){_mmSheet=null;root.innerHTML='';return;}
  const prevSheet=root.querySelector('.hist-sheet'),keepScroll=prevSheet?prevSheet.scrollTop:0;
  const Z=mmZone(g.id),cls=mmCls(g.v,g.id),mx=Math.max(20,g.v,Z.hi)*1.04,pct=v=>(Math.min(100,v/mx*100)).toFixed(1);
  const pg=plan?null:mmPlanStats().groups.find(x=>x.id===g.id);
  const dayLbl=dk=>{const d=getPlan()[dk];return d&&d.label?d.label:'';};
  const rows=g.ex.map(e=>{
    const det=plan?`${mmFmt(e.sets)} series/sem${e.day?` · ${esc(dayLbl(e.day))}`:''}`:`${plural(e.sets,'serie')} ${esc(st.R.per)}`;
    return`<div class="mm-ex"><div class="mm-ex-i"><div class="mm-ex-n">${esc(e.name)}</div><div class="mm-ex-d">${det} · cuenta ${Math.round(e.w*100)} %</div></div>
      <div class="mm-ex-v">${mmFmt(e.c/st.weeks)}<small> /sem</small></div></div>`;
  }).join('');
  const where=plan?'en tu rutina':'en este periodo';
  const act=plan
    ?`<button class="btn bs" onclick="mmAddFor('${g.id}')">＋ Añadir ejercicio de ${g.n.toLowerCase()} al ${esc(dayLbl(_editDay)||'día').replace(/ (?=\S+$)/,' ')}</button>`
    :`<button class="btn bs" onclick="closeMuscleSheet();openRoutineEditor()">${g.v<Z.lo?'Añadir volumen en tu rutina':'Ver tu rutina'}</button>`;
  root.innerHTML=`<div class="hist-over" onclick="if(event.target===this)closeMuscleSheet()"><div class="hist-sheet" id="mm-sheet" role="dialog" aria-label="${g.n}: ejercicios">
    <div class="hist-sheet-head">
      <div class="hist-sheet-hdl"></div>
      <div class="hist-sheet-title">${g.n}</div>
      <div class="hist-sheet-sub">${plan?`Tu rutina planificada · <span class="nw">${esc(plural(getWeeklyTarget(),'día'))}/semana</span>`:`Series efectivas · ${_nwUnits(esc(st.R.lbl))}`}</div>
      <button class="hist-sheet-close" onclick="closeMuscleSheet()" aria-label="Cerrar">✕</button>
    </div>
    <div class="hist-sheet-body">
      <div class="mm-sh-top"><div class="mm-sh-v ${cls}">${mmFmt(g.v)}<small> series/semana</small></div><div class="mm-sh-z ${cls}">${mmZoneTxt(g.v,g.id)}</div></div>
      <div class="mm-track"><i class="mm-zone" style="left:${pct(Z.lo)}%;width:${(pct(Z.hi)-pct(Z.lo)).toFixed(1)}%"></i><i class="mm-fill ${cls}" style="width:${pct(g.v)}%"></i></div>
      <div class="mm-scale" aria-hidden="true"><span style="left:0;transform:none">0</span><span style="left:${pct(Z.lo)}%">${Z.lo}</span><span style="left:${pct(Z.hi)}%">${Z.hi}</span></div>
      ${pg?`<div class="mm-sh-plan">Tu rutina tiene planificadas <b>${mmFmt(pg.v)}</b>${NB}series/semana de ${g.n.toLowerCase()}.</div>`:''}
      <div class="hist-list-h" style="margin-top:16px">Ejercicios que lo trabajan ${where}</div>
      ${rows||`<div class="mm-empty" style="padding-top:4px">Ningún ejercicio ${where} trabaja ${g.n.toLowerCase()} directamente.</div>`}
      <div class="mm-note">Cada serie cuenta según cuánto trabaja este grupo el ejercicio: en el remo, los hombros cuentan un 50 %. ${Z.own?`Su zona, <span class="nw">${Z.lo}-${Z.hi} series</span> por semana, sale de tu rutina y tu objetivo: es una guía orientativa.`:`La zona de <span class="nw">${MM_ZONE.lo}-${MM_ZONE.hi} series</span> por semana es una guía orientativa: empezando, menos también funciona.`}</div>
      ${act}
    </div>
  </div></div>`;
  if(keepScroll){const sh=root.querySelector('.hist-sheet');if(sh)sh.scrollTop=keepScroll;}
}

