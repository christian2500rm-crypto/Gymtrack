// ══════════════════════════════════════════════════════════
// FUERZA POR EJERCICIO (12b): lista compacta con estado, filtros por día y «Estancados primero»
// ══════════════════════════════════════════════════════════
// Una fila por ejercicio con historial: color de su día, último valor en su medida (kg, reps, s o m, como la ficha:
// _histMode), lo ganado, una mini-gráfica con eje de tiempo y un chip de estado. El estado sale del MISMO diagnóstico
// que el Coach (coach_item → coach_exerciseProgression, con sus «en espera»): ⏸ estancado y ↘ bajando solo si el Coach
// lo juzga así; 🏆 récord (prAll) en los últimos 14 días; ↗ progresando = up / strong_up; ⏳ en espera (recién cambiado,
// en descarga o recuperándose); → estable; · pocos datos. Los que ya no están en la rutina, con la misma función sin
// «espera». Filtro y orden viven en memoria (al volver a abrir la app: todos, en el orden de la rutina).
let _plF='all',_plStag=false;
const PL_PR_DAYS=14;
// Fecha de un récord: su ts o, en un registro antiguo, la de su fecha escrita (dts)
function _prWhen(f){return f?f.ts!=null?f.ts:f.dts!=null?f.dts:null:null;}
const PL_ST={pr:{ic:'🏆',t:'Récord reciente'},up:{ic:'↗',t:'Progresando'},stag:{ic:'⏸',t:'Estancado'},down:{ic:'↘',t:'Bajando'},
  hold:{ic:'⏳',t:'En espera'},flat:{ic:'→',t:'Estable'},new:{ic:'·',t:'Pocos datos'}};
// Estado de cada id de la lista: {k, it (diagnóstico del Coach), pr (nº de récords recientes), why (texto corto)}
function progStatusMap(list){
  const plan=routinePlan(),ctx=coach_itemCtx(plan),items={};
  Object.keys(plan).forEach(dk=>{const d=plan[dk];if(d&&Array.isArray(d.ex))d.ex.forEach(ex=>{
    if(ex&&!ex.cardio&&ex.id&&!items[ex.id])items[ex.id]=coach_item(ex,dk,ctx);});});
  const pa=prAll(),from=Date.now()-PL_PR_DAYS*DAY_MS,out={};
  list.forEach(({id})=>{
    const it=items[id]||{p:coach_exerciseProgression(id)},p=it.p,t=p.trend,h=it.hold;
    const b=pa.byEx[id],pr=b&&Array.isArray(b.flags)?b.flags.filter(f=>f&&_prWhen(f)!=null&&_prWhen(f)>=from):[];
    const k=!h&&t==='stagnant'?'stag':!h&&t==='down'?'down':pr.length?'pr':h?'hold':t==='up'||t==='strong_up'?'up':t==='flat'?'flat':'new';
    out[id]={k,it,pr:pr.length,why:_plWhy(k,it,pr)};
  });
  return out;
}
// El porqué del estado, con las palabras del Coach («4+ sesiones sin mejorar», «1RM est. +6.2 %»…). Estancado: el Coach
// mira el tramo final más corto que ya lo demuestra (≥ 4 sesiones en ≥ 3 semanas), así que son «N+» (pueden ser más).
// Sin paréntesis (van dentro del aria-label de la fila, que ya lleva comas) y con espacio duro antes de «%».
function _plWhy(k,it,pr){
  const p=it.p,pct=v=>(v>=0?'+':'−')+Math.abs(v).toFixed(Math.abs(v)<10?1:0)+NB+'%';
  if(k==='stag')return`${p.stagSessions}+ sesiones sin mejorar`;
  if(k==='down')return p.dropPct>0?`${Math.round(p.dropPct)}${NB}% por debajo de tu nivel`:'por debajo de tu nivel';
  if(k==='pr'){const l=pr.reduce((a,f)=>!a||_prWhen(f)>_prWhen(a)?f:a,null);return pr.length>1?`${pr.length} récords en 2 semanas`:`récord ${l&&l.d?'el '+l.d:'reciente'}`;}
  if(k==='hold')return it.ex?_holdTxt(it):'en espera';
  if(k==='up')return p.lastre?'más lastre':`${_progWhat(p).sh} ${pct(p.pct)}`;
  if(k==='flat')return'estable · sigue el plan';
  return'aún pocas sesiones para juzgarlo';
}
function _plChipTxt(s){
  if(s.k!=='hold')return PL_ST[s.k].t;
  const h=s.it.hold.kind;return h==='deload'?'En descarga':h==='changed'?'Recién cambiado':'Recuperando';
}
// Mini-gráfica (64×26) con eje de tiempo real: los últimos 12 registros de su medida; la línea se corta en una banda más
// dura (.sp-cut, como la ficha) y el último punto va marcado
function plSpark(data,color,cuts){
  const n=data.length;if(n<2)return'';
  const s0=Math.max(0,n-12),d=data.slice(s0),ts=_histTs(data).slice(s0),vs=d.map(r=>+r.v||0);
  const W=64,H=26,P=3,t0=ts[0],t1=ts[ts.length-1],mn=Math.min(...vs),mx=Math.max(...vs);
  const X=t=>P+(t1>t0?(t-t0)/(t1-t0):1)*(W-2*P),Y=v=>mx===mn?H/2:H-P-(v-mn)/(mx-mn)*(H-2*P);
  const cs=new Set((Array.isArray(cuts)?cuts:[]).map(i=>i-s0).filter(i=>i>0&&i<d.length));
  const path=d.map((r,i)=>(i===0||cs.has(i)?'M':'L')+X(ts[i]).toFixed(1)+','+Y(vs[i]).toFixed(1)).join(' ');
  const marks=[...cs].map(i=>{const x=((X(ts[i-1])+X(ts[i]))/2).toFixed(1);
    return`<line class="sp-cut" x1="${x}" y1="1" x2="${x}" y2="${H-1}" stroke="var(--text3)" stroke-width="1" stroke-dasharray="2 2"/>`;}).join('');
  const L=d.length-1;
  return`<svg class="pl-spark" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true" focusable="false">${marks}<path d="${path}" fill="none" stroke="${color}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${X(ts[L]).toFixed(1)}" cy="${Y(vs[L]).toFixed(1)}" r="2.4" fill="${color}"/></svg>`;
}
// Peso corporal con lastre (chaleco, disco…): sus kilos son solo el lastre (misma regla que la ficha y el Coach)
function _isLastre(exId,kd){const ex=findExInPlan(exId)||_mmExOf(exId);return exLT(ex)==='bw'||(kd||[]).some(r=>_recLT(r)==='bw');}
// Una fila: abre la ficha del ejercicio (toque, Intro o espacio)
function plRowHtml(x,s){
  const {id,data:all,name,color,inPlan}=x;
  // Medida de la fila (_histMode): kilos, o reps / tiempo / distancia sin peso («15 reps», «45 s», «30 m»)
  const H=_histMode(all),data=H.kg?H.data:H.data.map(r=>Object.assign({},r,{v:_recMetric(r,H.lt)||0}));
  // Banda más dura (_bandUp): lo ganado cuenta desde la última; si es la de la última sesión, «banda más dura»
  const cuts=H.kg?[]:_bandCuts(findExInPlan(id)||_mmExOf(id),H.data),k0=cuts.length?cuts[cuts.length-1]:0;
  const lastV=parseFloat(data[data.length-1].v),firstV=parseFloat(data[k0].v);
  const g=isFinite(lastV)&&isFinite(firstV)?Math.round((lastV-firstV)*10)/10:0,u=NB+(H.kg?'kg':_metricU(H.lt)); // (16e) «+30 s», «+5 reps» sin partir
  // Mismo peso por tiempo o distancia (paseo, plancha con disco): lo ganado en segundos o metros
  const tg=H.kg&&g===0&&data.length>=2?_tdGainSince(data):null;
  // …y peso corporal con el mismo lastre: lo ganado en reps
  const lg=H.kg&&g===0&&!(tg&&tg.v)&&data.length>=2&&_isLastre(id,H.data)?_lrGainSince(H.data):null;
  // (kilos con kgTxt: «+15 kg», «+2.5 kg», sin «.0»; signo menos tipográfico)
  const gTxt=v=>(v>0?'+':'−')+(H.kg?kgTxt(Math.abs(v)):Math.abs(v))+u;
  let gain=data.length<2?['mute','primer registro']:k0>0&&k0===data.length-1?['band','banda más dura']
    :tg&&tg.v?[tg.v>0?'up':'dn',`${tg.v>0?'+':'−'}${Math.abs(tg.v)}${NB}${_metricU(tg.lt)}`]
    :lg?[lg>0?'up':'dn',`${lg>0?'+':'−'}${Math.abs(lg)}${NB}reps`]
    :g>0?['up',gTxt(g)]:g<0?['dn',gTxt(g)]:['mute','sin cambios'];
  // «↘ Bajando» frente al primer registro puede salir «sin cambios» o «+…» (40 → 57.5 → 40 kg): lo que baja es frente a
  // tu nivel (el mismo dato del Coach que dice el aria)
  if(s.k==='down'&&gain[0]!=='dn'&&s.it&&s.it.p&&s.it.p.dropPct>0)gain=['dn',`−${Math.round(s.it.p.dropPct)}${NB}% de tu nivel`];
  // Peso corporal con lastre: «+15 kg lastre» (nunca «15 kg» a secas, que parecería el peso del ejercicio)
  const lastre=H.kg&&_isLastre(id,H.data),lastW=kgTxt(data[data.length-1].v);
  const vTxt=!H.kg?_metricTxt(lastV,H.lt):lastre?`+${lastW}${NB}kg lastre`:lastW+NB+'kg';
  const out=inPlan?'':_isSubOnly(id)?'Alternativa que hiciste «solo hoy»':'Ya no está en tu rutina';
  const chip=_plChipTxt(s),st=PL_ST[s.k];
  // (16b) Mismo peso por tiempo o distancia: la fila dice lo ganado en s o m («+50 s») y el porqué lo dice igual
  // («tiempo +50 s», no el % del Coach sobre otra base), para que lo que se ve y lo que se oye coincidan.
  // (16 r1) Igual en toda fila sin kilos (solo tiempo, distancia, reps) y en la de lastre igual con reps: «reps +5 reps»
  // no; «reps +5» tampoco: el nombre de la medida de la fila y lo que muestra («tiempo +50 s», «distancia +100 m», «reps +5 reps»)
  const rowLT=tg&&tg.v?tg.lt:lg?'r':!H.kg?H.lt:null,rowSh=rowLT==='t'?'tiempo':rowLT==='d'?'distancia':'reps';
  const why=s.k==='up'&&gain[0]==='up'&&rowLT?`${rowSh} ${gain[1]}`:s.why;
  const aria=`${name}, ${chip.toLowerCase()}, ${why}, último ${lastre?`lastre +${lastW}${NB}kg`:vTxt}${out?', '+out.toLowerCase():''}: ver la ficha`;
  // Mismo peso por tiempo o distancia: la mini-gráfica dibuja lo que progresa (sus segundos o metros), como «+50 s»
  const spk=tg&&tg.v?H.data.filter(r=>_recLT(r)===tg.lt&&_recMetric(r,tg.lt)!=null).map(r=>Object.assign({},r,{v:_recMetric(r,tg.lt)}))
    :lg?H.data.filter(r=>_lrReps(r)!=null).map(r=>Object.assign({},r,{v:_lrReps(r)})):data;
  return`<div class="card prog-tap pl-row" data-ex="${esc(id)}" data-st="${s.k}" role="button" tabindex="0" aria-label="${esc(aria)}" onclick="openHist(this.dataset.ex)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openHist(this.dataset.ex)}">
    <span class="pl-dot" style="background:${color}" aria-hidden="true"></span>
    <span class="pl-main"><span class="clbl pl-n">${esc(name)}</span>${out?`<span class="prog-out">${out}</span>`:''}
      <span class="pl-sub"><span class="pl-v${lastre?' lt':''}" style="color:${color}">${lastre?`${esc('+'+lastW+NB+'kg')}<small> lastre</small>`:esc(vTxt)}</span><span class="pl-g ${gain[0]}${gain[0]==='band'?' prog-band':''}">${esc(gain[1])}</span></span></span>
    <span class="pl-side">${plSpark(spk,color,cuts)}<span class="pl-st ${s.k}" title="${esc(why)}"><span aria-hidden="true">${st.ic}</span> ${chip==='Récord reciente'?'Récord<span class="pl-st-x"> reciente</span>':/^(Recién cambiado|En descarga)$/.test(chip)?chip.replace(/^([^ ]+ )(.+)$/,'<span class="pl-st-x">$1</span><span class="pl-st-c">$2</span>'):esc(chip)}</span></span>
    <span class="prog-go" aria-hidden="true">›</span>
  </div>`;
}
// La sección entera (#prog-str): filtros, resumen, «Estancados primero» y las filas
function progStrengthHtml(){
  const list=progStrengthList();
  if(!list.length)return`<div class="card" id="prog-str"><div class="empty"><div class="eic">🏋️</div><p>Completa entrenamientos y registra pesos para ver tu progreso de fuerza.</p></div></div>`;
  const st=progStatusMap(list),hasOut=list.some(x=>!x.inPlan),plan=getPlan();
  if(_plF==='out'&&!hasOut)_plF='all';
  const dks=dayKeys(plan); // (E1a) los días de tu rutina (2-6)
  if(_plF!=='all'&&_plF!=='out'&&!dks.includes(_plF))_plF='all';
  const f=_plF;
  let rows=list.filter(x=>f==='all'||(f==='out'?!x.inPlan:x.inPlan&&x.day===f));
  if(_plStag){const r={stag:0,down:1},_r=o=>{const v=r[st[o.x.id].k];return v==null?2:v;};rows=rows.map((x,i)=>({x,i})).sort((a,b)=>(_r(a)-_r(b))||a.i-b.i).map(o=>o.x);}
  // «Progresan» cuenta como el Coach (tendencia al alza, también con récord reciente o en espera); los récords recientes
  // de esos van entre paréntesis y los de los demás, aparte (así «13 progresan» coincide con el «Progresan 13/13» del Coach)
  const c={};rows.forEach(x=>{const s=st[x.id],k=s.k,t=s.it.p.trend,up=k!=='stag'&&k!=='down'&&(t==='up'||t==='strong_up');
    c[k]=(c[k]||0)+1;if(up){c.u=(c.u||0)+1;if(k==='pr')c.uPr=(c.uPr||0)+1;}else if(k==='pr')c.oPr=(c.oPr||0)+1;});
  const parts=[c.u&&`<b class="up">${c.u}</b> ${c.u===1?'progresa':'progresan'}${c.uPr?` (<b class="pr">${c.uPr}</b> con récord reciente)`:''}`,c.oPr&&`<b class="pr">${c.oPr}</b> con récord`,
    c.stag&&`<b class="stag">${c.stag}</b> ${c.stag===1?'estancado':'estancados'}`,c.down&&`<b class="down">${c.down}</b> bajando`].filter(Boolean);
  const fb=(k,t,al)=>`<button type="button" class="wc-rg${f===k?' on':''}" data-f="${k}"${DAY_COLORS[k]?` style="--dc:${DAY_COLORS[k]}"`:''} aria-pressed="${f===k}"${al?` aria-label="${esc(al)}"`:''} onclick="plSetF('${k}')">${t}</button>`;
  const dl=d=>{const l=plan[d]&&plan[d].label;return l&&l!=='Día '+d?`Día ${d}: ${l}`:'';};
  const fName=f==='all'?'':f==='out'?' fuera de tu rutina':' en el Día '+f;
  return`<div class="card pl-card" id="prog-str">
    <div class="wc-ranges pl-f${dks.length>=4?' pl-fx':''}" role="group" aria-label="Filtrar ejercicios por día">${fb('all','Todos')}${dks.map(d=>fb(d,'Día '+d,dl(d))).join('')}${hasOut?fb('out','Fuera','Fuera de tu rutina'):''}</div>
    <div class="pl-bar"><span class="pl-sum" aria-live="polite">${parts.length?parts.join(' · '):plural(rows.length,'ejercicio')}</span>
      <button type="button" class="pl-stag" aria-pressed="${_plStag}" onclick="plToggleStag()"><span class="pl-sw" aria-hidden="true"></span>Estancados primero</button></div>
    <div class="pl-list">${rows.length?rows.map(x=>plRowHtml(x,st[x.id])).join(''):`<p class="pl-empty">Sin ejercicios con registros${fName}.</p>`}</div>
  </div>`;
}
function _plRefresh(focusSel){
  const el=document.getElementById('prog-str');
  if(!el||S.tab!=='prog'){render();return;}
  el.outerHTML=progStrengthHtml();
  if(focusSel){const b=document.querySelector('#prog-str '+focusSel);if(b)try{b.focus({preventScroll:true});}catch(e){}}
}
function plSetF(k){if(k!=='all'&&k!=='out'&&!dayKeys().includes(k))return;_plF=k;_plRefresh(`[data-f="${k}"]`);}
function plToggleStag(){_plStag=!_plStag;_plRefresh('.pl-stag');}
// Peso corporal en Progreso: la gráfica está en Inicio (donde se registra); aquí, el último y su cambio con un enlace
function progWeightLinkHtml(){
  const pts=wSeries();
  if(!pts.length)return`<div class="card pl-w"><span class="pl-w-ic" aria-hidden="true">⚖️</span><span class="pl-w-m"><span class="pl-w-s">Registra tu peso y verás su evolución en Inicio.</span></span>
    <button type="button" class="btn bs pl-w-b" onclick="S.wmodal=true;renderWmodal()">Registrar</button></div>`;
  const last=pts[pts.length-1];
  let sub='primer registro';
  if(pts.length>=2){const k=wRangeKey(),rp=wInRange(pts,k),R=WRANGES.find(x=>x[0]===k);sub=`${wSign(last.v-rp[0].v)} kg ${wRangeLbl(rp,R)}`;}
  return`<button type="button" class="card pl-w" onclick="progToWeight()" aria-label="Peso corporal: ${wf1(last.v)} kg, ${esc(sub)}. Ver la gráfica en Inicio">
    <span class="pl-w-ic" aria-hidden="true">⚖️</span>
    <span class="pl-w-m"><span class="pl-w-v">${wf1(last.v)}<small> kg</small></span><span class="pl-w-s">${esc(sub)} · ${esc(wWhen(last.t))}</span></span>
    <span class="pl-w-go">Ver gráfica<span aria-hidden="true"> ›</span></span></button>`;
}
function progToWeight(){
  go('dash');
  const el=document.getElementById('dash-w');if(!el)return;
  try{el.scrollIntoView({block:'start'});}catch(e){el.scrollIntoView();} // salto directo (sin animación: no se queda a medias)
}

// ── (12d) MÁS FUERTE Y MÁS LIGERO: índice de fuerza frente a la tendencia del peso ──────────────
// Dos líneas en % desde el inicio del periodo elegido (rangos 1M-Todo como el peso, guardado aparte en S.rRange):
//  · Fuerza (menta): en cada día con sesión, la media del 1RM estimado relativo de cada ejercicio con kilos (peso × reps;
//    _recE1, la mejor serie) frente a su PRIMERA sesión del periodo. Solo ejercicios con ≥ 2 sesiones en el periodo; cada uno
//    conserva su último valor hasta la siguiente; sin las sesiones de semanas ligeras (descanso o descarga: rec.dl / _lightAt),
//    que no son pérdida de fuerza. Un punto por día (con lo registrado hasta el final de ese día).
//  · Peso (azul): la tendencia de 7 días de wSeries (la misma media móvil exponencial de la gráfica del peso), en % frente a
//    la tendencia de la primera pesada del periodo.
// El periodo acaba en el último dato (sesión o pesada) y empieza N días antes (Todo: desde el primero). El coral queda para
// los récords. Sin kilos (solo peso corporal, bandas, tiempo o distancia) no hay índice y se explica; sin peso, solo fuerza.
const RC_MIN=2;
function rRangeKey(){return WRANGES.some(r=>r[0]===S.rRange)?S.rRange:'6m';}
function setRRange(k){if(!WRANGES.some(r=>r[0]===k))return;S.rRange=k;saveState();_rcRefresh(`[data-r="${k}"]`);}
function _rcRefresh(focusSel){
  const el=document.getElementById('prog-rc');
  if(!el||S.tab!=='prog'){render();return;}
  el.outerHTML=recompCardHtml();
  if(focusSel){const b=document.querySelector('#prog-rc '+focusSel);if(b)try{b.focus({preventScroll:true});}catch(e){}}
}
// Registros de kilos de cada ejercicio: [{id, pts:[{t, e}]}] (1RM est. > 0, sin semanas ligeras), por fecha. Los antiguos
// sin ts cuentan con el día de su fecha escrita (_histTs); los que ni eso, no (out.undated: cuántos se quedan fuera)
function _rcStrength(){
  const out=[];out.undated=0;
  Object.keys(S.strength||{}).forEach(id=>{
    const data=S.strength[id];if(!Array.isArray(data)||!data.length)return;
    const ts=_histTs(data),pts=[];
    data.forEach((rec,i)=>{
      if(!rec||typeof rec!=='object'||_recLT(rec)!=='w')return;
      const e=_recE1(rec);if(!(e>0)||!isFinite(e))return;
      if(rec.dl||_lightAt(id,ts[i]))return;
      if(ts.est[i]===2){out.undated++;return;}
      pts.push({t:ts[i],e});
    });
    if(pts.length)out.push({id,pts:pts.sort((a,b)=>a.t-b.t)});
  });
  return out;
}
// % con signo: una cifra decimal por debajo de 10 («+4.2», «−0.8», «±0.0»), entero desde 10 («+38»)
function _rcPct(v){const a=Math.abs(v);return(v>=0.05?'+':v<=-0.05?'−':'±')+(a<9.95?a.toFixed(1):String(Math.round(a)));}
// (16b) Cambio de peso del subtítulo del KPI: «−4 kg», «+1.5 kg», «±0 kg» (signo −, kgTxt y sin partir la cifra)
function _rcKgDelta(v){return`<span class="nw">${kgSign(v)}${NB}kg</span>`;}
// Datos de la gráfica: s [{t, p (%), n (ejercicios)}], w [{t, p (%), kg (tendencia)}] y lo necesario para los avisos
function recompData(k){
  k=WRANGES.some(r=>r[0]===k)?k:rRangeKey();
  const R=WRANGES.find(r=>r[0]===k),ex=_rcStrength(),wp=wSeries().filter(p=>isFinite(p.tr)&&p.tr>0);
  let end=-Infinity;ex.forEach(x=>{end=Math.max(end,x.pts[x.pts.length-1].t);});if(wp.length)end=Math.max(end,wp[wp.length-1].t);
  const from=R[2]&&isFinite(end)?end-R[2]*DAY_MS:-Infinity;
  const use=ex.map(x=>({id:x.id,pts:x.pts.filter(p=>p.t>=from)})).filter(x=>x.pts.length>=RC_MIN);
  const byDay={};use.forEach(x=>x.pts.forEach(p=>{const d=_startOfDay(p.t);if(!(byDay[d]>=p.t))byDay[d]=p.t;}));
  const ix=use.map(()=>-1); // días en orden: cada ejercicio avanza su puntero hasta su último registro de ese día
  const s=Object.values(byDay).sort((a,b)=>a-b).map(t=>{let sum=0,n=0;
    use.forEach((x,j)=>{while(ix[j]+1<x.pts.length&&x.pts[ix[j]+1].t<=t)ix[j]++;if(ix[j]>=0){sum+=x.pts[ix[j]].e/x.pts[0].e;n++;}});
    return{t,p:(sum/n-1)*100,n};});
  const wr=wp.filter(p=>p.t>=from),w=wr.length>=2?wr.map(p=>({t:p.t,p:(p.tr/wr[0].tr-1)*100,kg:p.tr})):[];
  return{k,R,from,end,s:s.length>=2?s:[],w,nEx:use.length,
    kgEx:ex.filter(x=>x.pts.length>=RC_MIN).length,kgAny:ex.length>0,wAll:wp.length,undated:ex.undated,
    strAny:Object.keys(S.strength||{}).some(id=>Array.isArray(S.strength[id])&&S.strength[id].length)};
}
// Lectura en una frase (umbral: ±1 % de fuerza, ±0.5 % de peso), con las cifras redondeadas como se muestran (_rcPct):
// con «Peso −0.5 %» en la tarjeta, la frase no dice «el mismo peso»
function _rcVerdict(sv,wv){
  const r1=v=>Math.sign(v)*+Math.abs(v).toFixed(1);sv=r1(sv);if(wv!=null)wv=r1(wv);
  const su=sv>=1,sd=sv<=-1;
  if(wv==null)return su?'Ganas fuerza':sd?'Algo menos de fuerza en este periodo':'Tu fuerza se mantiene';
  const wd=wv<=-0.5,wu=wv>=0.5;
  if(su)return wd?'Recomposición en marcha 💪':wu?'Más fuerte, con algo más de peso':'Más fuerte con el mismo peso';
  if(sd)return wd?'Más ligero, con algo menos de fuerza':'Algo menos de fuerza en este periodo';
  return wd?'Más ligero sin perder fuerza':wu?'Misma fuerza, con algo más de peso':'Fuerza y peso estables';
}
// SVG: el motor de la gráfica del peso (_wc + wcMove: lectura al tocar o arrastrar). Punto principal = fuerza (y null
// antes de su primera sesión), segundo = peso; en cada fecha de sesión o pesada, los dos valores sobre sus líneas.
// Si el peso cambia mucho menos que la fuerza (5 veces menos recorrido y al menos 1 %), lleva su propia escala a la
// derecha (en azul, RC_DUAL): en la común quedaría aplastado sobre la línea del 0 y no se vería su tendencia.
const RC_DUAL=5;
const _rcExt=a=>{const v=a.map(p=>p.p).concat(0);return[Math.min(...v),Math.max(...v)];};
function _rcDual(d){if(d.w.length<2||!d.s.length)return false;const[sLo,sHi]=_rcExt(d.s),[wLo,wHi]=_rcExt(d.w);return wHi-wLo>=1&&(sHi-sLo)/(wHi-wLo)>RC_DUAL;}
function rcChartSVG(d){
  const W=_wcW(60),H=170,PL=34,PT=24,PB=20,id='wc'+(++_wcSeq),s=d.s,w=d.w,all=s.concat(w);
  const t0=Math.min(...all.map(p=>p.t)),t1=Math.max(...all.map(p=>p.t)),span=Math.max(t1-t0,1);
  const [sLo,sHi]=_rcExt(s),[wLo,wHi]=w.length?_rcExt(w):[0,0],dual=_rcDual(d),PR=dual?30:12;
  const steps=[.5,1,2,2.5,5,10,20,25,50,100,200,500];
  const scale=(lo,hi)=>{const pad=Math.max((hi-lo)*.14,1);lo-=pad;hi+=pad;
    const st=steps.find(x=>x>=(hi-lo)/4)||500,ticks=[];for(let v=Math.ceil(lo/st)*st;v<=hi+1e-9;v+=st)ticks.push(+v.toFixed(2));return{lo,hi,st,ticks};};
  const A=dual?scale(sLo,sHi):scale(Math.min(sLo,wLo),Math.max(sHi,wHi)),B=dual?scale(wLo,wHi):A,ticks=A.ticks;
  const X=t=>PL+(t-t0)/span*(W-PL-PR),Y=v=>PT+(A.hi-v)/(A.hi-A.lo)*(H-PT-PB),Yw=v=>PT+(B.hi-v)/(B.hi-B.lo)*(H-PT-PB);
  const xl=_wcXLabels(t0,t1),days=span/DAY_MS;
  const path=(a,f)=>a.map((p,i)=>(i?'L':'M')+X(p.t).toFixed(1)+','+f(p.p).toFixed(1)).join('');
  const tkf=st=>v=>(v>0?'+':v<0?'−':'')+(st<1?Math.abs(v).toFixed(1):String(Math.abs(v))),tk=tkf(A.st),tkw=tkf(B.st);
  const at=(a,t)=>{if(a.length<2||t<a[0].t||t>a[a.length-1].t)return null;let i=1;while(i<a.length-1&&a[i].t<t)i++;
    const p=a[i-1],q=a[i];return q.t===p.t?q.p:p.p+(q.p-p.p)*(t-p.t)/(q.t-p.t);};
  const hp=[...new Set(all.map(p=>p.t))].sort((a,b)=>a-b).map(t=>{const a=at(s,t),b=at(w,t);
    return{x:X(t),y:a==null?null:Y(a),ty:b==null?null:Yw(b),t,t1:wFmt(t,'wd'),
      t2:[a!=null?'Fuerza '+_rcPct(a)+NB+'%':'',b!=null?'Peso '+_rcPct(b)+NB+'%':''].filter(Boolean).join(' · ')};});
  _wc[id]={W,H,PT,PB,PL,PR,auto:true,p:hp};
  _wcIds.push(id);while(_wcIds.length>8)delete _wc[_wcIds.shift()];
  // Valores finales junto a su último punto (_wcPlace): donde no los pise ninguna línea (el peso que baja hasta su último
  // punto, la fuerza que pasa por encima…) ni el otro valor (nunca uno encima del otro)
  const sl=s[s.length-1],wl=w.length?w[w.length-1]:null;
  const specs=[{x:X(sl.t),y:Y(sl.p),txt:_rcPct(sl.p)+NB+'%'}].concat(wl?[{x:X(wl.t),y:Yw(wl.p),txt:_rcPct(wl.p)+NB+'%'}]:[]);
  const pl=[s.map(p=>[X(p.t),Y(p.p)])].concat(wl?[w.map(p=>[X(p.t),Yw(p.p)])]:[]);
  const pos=_wcPlace(specs,pl,specs.map(q=>[q.x,q.y,4.4]),{PL,PT,PB,W,H,xMax:dual?W-PR-2:W-1});
  const lv=(i,cls)=>`<text x="${pos[i].x.toFixed(1)}" y="${pos[i].y.toFixed(1)}" text-anchor="${pos[i].anc}" class="rc-lv ${cls}">${specs[i].txt}</text>`;
  const lvS=lv(0,'s'),lvW=wl?lv(1,'w'):'';
  const aria=`Fuerza ${_rcPct(sl.p)} %${wl?` y peso ${_rcPct(wl.p)} %`:''} entre el ${wFmt(t0,'dmy')} y el ${wFmt(t1,'dmy')}${dual?' (el peso, con su propia escala a la derecha)':''}. Toca o arrastra para ver cada fecha.`;
  return`<svg class="wc-svg rc-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(aria)}">
    ${ticks.map(v=>`<line x1="${PL}" x2="${W-PR}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" class="wc-grid"/><text x="${PL-6}" y="${(Y(v)+3).toFixed(1)}" text-anchor="end" class="wc-ytk${dual?' rc-ys':''}">${tk(v)}</text>`).join('')}
    <text x="${PL-6}" y="${PT-14}" text-anchor="end" class="wc-ytk sc-u${dual?' rc-ys':''}">%</text>
    ${dual?B.ticks.map(v=>`<text x="${W-PR+5}" y="${(Yw(v)+3).toFixed(1)}" text-anchor="start" class="wc-ytk rc-yw">${tkw(v)}</text>`).join('')+`<text x="${W-PR+5}" y="${PT-14}" text-anchor="start" class="wc-ytk sc-u rc-yw">%</text>`:''}
    ${xl.map(([t,tx],i)=>`<text x="${X(t).toFixed(1)}" y="${H-5}" text-anchor="${days<=120?(i===0?'start':i===3?'end':'middle'):'middle'}" class="wc-xtk">${tx}</text>`).join('')}
    <line x1="${PL}" x2="${W-PR}" y1="${Y(0).toFixed(1)}" y2="${Y(0).toFixed(1)}" class="rc-zero"/>
    ${wl?`<path d="${path(w,Yw)}" class="rc-w"/>`:''}
    <path d="${path(s,Y)}" class="rc-s"/>
    ${wl?`<circle cx="${X(wl.t).toFixed(1)}" cy="${Yw(wl.p).toFixed(1)}" r="4" class="rc-dw"/>`:''}
    <circle cx="${X(sl.t).toFixed(1)}" cy="${Y(sl.p).toFixed(1)}" r="4.4" class="rc-ds"/>
    ${lvW}${lvS}
    <g id="${id}-h" class="wc-hov" style="display:none"><line class="wc-hl" y1="${PT-6}" y2="${H-PB}"/><circle class="wc-hd" r="4.5"/><circle class="wc-ht" r="3.5"/>
      <g class="wc-tip"><rect rx="6" width="118" height="34"/><text class="wc-t1" x="8" y="14"></text><text class="wc-t2" x="8" y="27"></text></g></g>
    <rect x="0" y="0" width="${W}" height="${H}" fill="transparent" style="touch-action:pan-y;cursor:crosshair" onpointerdown="wcMove(event,'${id}')" onpointermove="wcMove(event,'${id}')" onpointerleave="wcLeave(event,'${id}')"/>
  </svg>`;
}
// La tarjeta (#prog-rc)
function recompCardHtml(){
  const d=recompData(rRangeKey());
  const und=d.undated?` ${d.undated===1?'Un registro antiguo sin fecha no cuenta':plural(d.undated,'registro antiguo','registros antiguos')+' sin fecha no cuentan'}.`:'';
  if(!d.kgEx){
    // Con kilos pero sin reps apuntadas (registros antiguos «40 kg»): sin 1RM estimado, y no es que vayan sin kilos
    const kgNoR=!d.kgAny&&!d.undated&&Object.keys(S.strength||{}).some(id=>Array.isArray(S.strength[id])&&S.strength[id].some(r=>r&&typeof r==='object'&&_recLT(r)==='w'&&+r.v>0));
    const msg=kgNoR?'Tus registros con kilos no tienen las reps apuntadas, y sin ellas no hay 1RM estimado. Apunta las reps de cada serie y verás aquí tu fuerza frente a tu peso.'
      :d.kgAny||d.undated?'Con dos sesiones con kilos en un mismo ejercicio verás aquí si ganas fuerza mientras cambia tu peso.'
      :d.strAny?'Tus ejercicios van sin kilos (peso corporal, bandas, tiempo o distancia), así que aquí no hay índice de fuerza: su evolución la tienes en «Fuerza por ejercicio». Cuando registres kilos en un ejercicio, verás aquí tu fuerza frente a tu peso.'
      :'Cuando tengas dos sesiones con kilos en un ejercicio, verás aquí si ganas fuerza mientras cambia tu peso.';
    return`<div class="card rc-card" id="prog-rc"><div class="rc-empty"><span class="rc-eic" aria-hidden="true">📈</span><p>${msg}${und}</p></div></div>`;
  }
  const chips=`<div class="wc-ranges rc-ranges" role="tablist" aria-label="Periodo de la gráfica">${WRANGES.map(r=>`<button type="button" class="wc-rg${r[0]===d.k?' on':''}" data-r="${r[0]}" role="tab" aria-selected="${r[0]===d.k}" onclick="setRRange('${r[0]}')">${r[1]}</button>`).join('')}</div>`;
  if(!d.s.length)return`<div class="card rc-card" id="prog-rc">${chips}<p class="rc-hint rc-none">En este periodo ningún ejercicio con kilos tiene dos sesiones (sin contar semanas ligeras). Prueba un periodo más largo.${und}</p></div>`;
  const sl=d.s[d.s.length-1],wl=d.w.length?d.w[d.w.length-1]:null,all=d.s.concat(d.w);
  const per=wRangeLbl([{t:Math.min(...all.map(p=>p.t))},{t:Math.max(...all.map(p=>p.t))}],d.R);
  const nw=wl?'':`<div class="rc-nw"><p class="rc-hint">${d.wAll?'No hay pesadas suficientes en este periodo para la línea del peso.':'Registra tu peso (en «Peso corporal», justo debajo) y lo verás aquí frente a tu fuerza.'}</p></div>`;
  return`<div class="card rc-card" id="prog-rc">
    <div class="rc-k">
      <div class="rc-kp s"><span>Fuerza</span><b>${_rcPct(sl.p)}<small> %</small></b><em>${_nwUnits(plural(d.nEx,'ejercicio'))} con kilos</em></div>
      <div class="rc-kp w"><span>Peso</span><b>${wl?_rcPct(wl.p)+'<small> %</small>':'—'}</b><em>${wl?_rcKgDelta(wl.kg-d.w[0].kg)+' '+_nwUnits(wRangeLbl(d.w,d.R)):d.wAll?'pocas pesadas':'sin registrar'}</em></div>
    </div>
    <div class="rc-v" id="rc-v">${_rcVerdict(sl.p,wl?wl.p:null)} <span>${_nwUnits(per)}</span></div>
    ${chips}
    <div class="wchart rc-chart">${rcChartSVG(d)}</div>
    <div class="wc-legend rc-lg"><span><i class="rc-ks"></i>Fuerza</span>${wl?`<span><i class="rc-kw"></i>Peso (tendencia 7${NB}días${_rcDual(d)?' · escala a la derecha':''})</span>`:''}<span><i class="rc-k0"></i>Inicio del periodo</span></div>
    <p class="rc-hint"><b>Fuerza</b>: media de tu 1RM estimado en cada ejercicio con kilos frente a su primera sesión del periodo (sin semanas ligeras).${wl?` <b>Peso</b>: tendencia de 7${NB}días.`:''}${und}</p>
    ${nw}
  </div>`;
}

// ── (12c) CONSTANCIA: calendario de 26 semanas × 7 días y rachas ──────────────────
// Cada día con sesión lleva el color de su día de la rutina (DAY_COLORS; otro día, neutro), las semanas de descanso
// (S.restWeeks) van rayadas, hoy remarcado y los días por llegar vacíos. Racha = semanas seguidas (lunes a domingo)
// cumpliendo el objetivo semanal (getWeeklyTarget). Como en coach_consistency, el descanso no penaliza: una semana con
// descanso pide la parte proporcional de sus días sin descanso (redondeada); si no pide nada, ni suma ni corta. La semana
// en curso y la primera (si empezaste a mitad) solo suman si ya se cumplieron; si no, tampoco cortan.
const CAL_WEEKS=26;
const CAL_WD=['lunes','martes','miércoles','jueves','viernes','sábado','domingo'];
let _calPick=null; // día con varias sesiones elegido (clave del día): muestra para elegir cuál abrir (en memoria)
function _calMon(ts){const d=new Date(ts);d.setHours(0,0,0,0);const w=d.getDay();d.setDate(d.getDate()-(w===0?6:w-1));return d.getTime();}
function _calAdd(ts,n){const d=new Date(ts);d.setDate(d.getDate()+n);return d.getTime();} // en días locales (cambios de hora)
function _calKey(ts){const d=new Date(ts);return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();}
// Sesiones del calendario y de las rachas: con su ts; las antiguas sin ts (copias de formato antiguo), el día de su fecha
// escrita (s.date «5 May», _datedTs: como los registros), en una copia con old:true (sin resumen que abrir). Las que no
// tienen ni eso no salen y se avisa (_calUndated).
function _calDated(){const all=(S.sessions||[]).filter(s=>s&&typeof s==='object');
  return{all,t:_datedTs(all.map(s=>({ts:s.ts,d:s.date})),DAY_MS)};}
function _calSessions(){const lim=_calAdd(_calMon(Date.now()),7),{all,t}=_calDated(),out=[];
  all.forEach((s,i)=>{const e=t.est[i];if(e===2)return;const ts=e===0?s.ts:t[i];
    if(isFinite(ts)&&ts>0&&ts<lim)out.push(e===0?s:Object.assign({},s,{ts,old:true}));});
  return out;}
function _calUndated(){const{t}=_calDated();return t.est.filter(e=>e===2).length;}
function _calRestAt(ts){return Array.isArray(S.restWeeks)&&S.restWeeks.some(r=>r&&isFinite(r.startTs)&&isFinite(r.endTs)&&ts>=r.startTs&&ts<r.endTs);}
// Semanas desde la del primer entreno (máx. 10 años) hasta la actual: {mon,n,req,rest,st:'met'|'miss'|'rest'|'open'}
function constancyWeeks(){
  const target=getWeeklyTarget(),cur=_calMon(Date.now()),ss=_calSessions(),cnt={};
  let first=cur;
  ss.forEach(s=>{const m=_calMon(s.ts);cnt[m]=(cnt[m]||0)+1;if(m<first)first=m;});
  first=Math.max(first,_calAdd(cur,-7*520));
  const out=[];
  for(let m=first,i=0;m<=cur&&i<600;m=_calAdd(m,7),i++){
    const nx=_calAdd(m,7),n=cnt[m]||0;
    const rest=Math.min(1,restWeeksInWindow(m,nx)/((nx-m)/REST_WEEK_MS));
    const req=rest>0?Math.round(target*(1-rest)):target;
    let st=req===0?(n>=target?'met':'rest'):n>=req?'met':'miss';
    if(st==='miss'&&(m===cur||(m===first&&ss.length)))st='open'; // en curso / primera semana a medias: no corta
    out.push({mon:m,n,req,rest,st});
  }
  return out;
}
function constancyStats(){
  const W=constancyWeeks();let run=0,best=0;
  W.forEach(w=>{if(w.st==='met'){run++;if(run>best)best=run;}else if(w.st==='miss')run=0;});
  // semanas de la racha actual (para marcarlas): las 'met' desde el último corte
  const curSet=new Set();for(let i=W.length-1,k=run;i>=0&&k>0;i--){if(W[i].st==='met'){curSet.add(W[i].mon);k--;}}
  return{weeks:W,cur:run,best,target:getWeeklyTarget(),curSet,now:W[W.length-1]};
}
function _calDate(ts,withYear){const d=new Date(ts),wd=(d.getDay()+6)%7;
  return`${CAL_WD[wd]} ${d.getDate()} ${MONTHS[d.getMonth()].toLowerCase()}${withYear?' '+d.getFullYear():''}`;}
// (E1b) el nombre con que se hizo; sin apuntar, el del día de esa letra; si ya no está, «Sesión extra»
function _calDayLbl(s){if(s&&typeof s.lbl==='string'&&s.lbl.trim())return s.lbl;const p=getPlan();return p[s.day]&&p[s.day].label?p[s.day].label:'Sesión extra';}
function constancyCardHtml(){
  const st=constancyStats(),plan=getPlan(),now=Date.now(),today=_startOfDay(now),cur=_calMon(now),yr=new Date(now).getFullYear();
  const start=_calAdd(cur,-7*(CAL_WEEKS-1)),end=_calAdd(cur,7),byDay={};
  const ss=_calSessions().slice().sort((a,b)=>a.ts-b.ts);
  ss.forEach(s=>{if(s.ts>=start&&s.ts<end)(byDay[_calKey(s.ts)]=byDay[_calKey(s.ts)]||[]).push(s);});
  const inWin=ss.filter(s=>s.ts>=start&&s.ts<end),cnt={},wkSt={};
  // (E1a) cada sesión con el color de su día si ese día está en tu rutina (A…F); si no, neutra y en «Otra»
  // (E1b) y de su día por su id: tras correr las letras, una sesión sigue a su día (y la de un día quitado va a «Otra»)
  const dc=k=>plan[k]&&DAY_COLORS[k]?DAY_COLORS[k]:null,sc=s=>dc(sessDayKey(s,plan));
  inWin.forEach(s=>{const k=sc(s)?sessDayKey(s,plan):'x';cnt[k]=(cnt[k]||0)+1;});
  st.weeks.forEach(w=>{wkSt[w.mon]=w;});
  const tapW=inWin.filter(s=>!s.old),lastTs=tapW.length?tapW[tapW.length-1].ts:null;
  let cells=`<span class="cal-m" aria-hidden="true"></span>`+['L','','X','','V','',''].map(l=>`<span class="cal-wd" aria-hidden="true">${l}</span>`).join('')+`<span aria-hidden="true"></span>`;
  let lastLbl=-9,anyRest=false;
  const mOf=w=>new Date(_calAdd(start,7*w)).getMonth();
  for(let w=0;w<CAL_WEEKS;w++){
    const mon=_calAdd(start,7*w);
    // rótulo del mes en la columna de su primer lunes (la primera columna, solo si a su mes le quedan ≥ 3 semanas)
    let ml='';
    if(w===0){let j=1;while(j<CAL_WEEKS&&mOf(j)===mOf(0))j++;if(j>=3)ml=MONTHS[mOf(0)];}
    else if(mOf(w)!==mOf(w-1))ml=MONTHS[mOf(w)];
    if(ml&&w-lastLbl<3)ml='';if(ml)lastLbl=w;
    cells+=`<span class="cal-m" aria-hidden="true">${ml}</span>`;
    for(let i=0;i<7;i++){
      const ts=_calAdd(mon,i),k=_calKey(ts),list=byDay[k]||[],isT=ts===today,fut=ts>today,rest=!fut&&_calRestAt(ts+12*3600000);
      if(rest)anyRest=true;
      const dl=_calDate(ts,new Date(ts).getFullYear()!==yr)+(isT?' (hoy)':'');
      const cls='cal-c'+(isT?' today':'')+(fut?' fut':'');
      if(list.length){
        // las antiguas fechadas por su fecha escrita (old) se pintan, pero no tienen resumen: sin botón si solo hay de esas
        const tap=list.filter(s=>!s.old),cols=[...new Set(list.map(s=>sc(s)||'var(--text3)'))];
        const bg=cols.length>1?`background:linear-gradient(135deg,${cols[0]} 50%,${cols[1]} 50%)`:`--dc:${cols[0]}`;
        const what=list.length>1?`${_joinY(list.map(_calDayLbl))} (${list.length} sesiones)`:_calDayLbl(list[0]);
        const last=tap[tap.length-1],oldTxt=list.length>tap.length?(tap.length?`, ${list.length-tap.length===1?'una antigua':(list.length-tap.length)+' antiguas'} sin resumen`:', sesión antigua sin resumen'):'';
        cells+=!tap.length?`<span class="${cls} on old" style="${bg}" role="img" aria-label="${esc(dl)}: ${esc(what)}${rest?', semana de descanso':''}${oldTxt}" title="${esc(dl)}: ${esc(what)}${oldTxt}"></span>`
          :`<button type="button" class="${cls} on${_calPick===k?' sel':''}" style="${bg}" data-ts="${last.ts}" data-k="${k}"${tap.length>1?` data-n="${tap.length}"`:''} tabindex="${last.ts===lastTs?0:-1}" aria-label="${esc(dl)}: ${esc(what)}${rest?', semana de descanso':''}${oldTxt}. ${tap.length>1?'Elegir cuál ver':'Ver resumen'}" title="${esc(dl)}: ${esc(what)}${oldTxt}"></button>`;
      }else{
        const what=fut?'por llegar':rest?'descanso':'sin entreno';
        cells+=`<span class="${cls}${rest?' rest':''}" role="img" aria-label="${esc(dl)}: ${what}"></span>`;
      }
    }
    const wsx=wkSt[mon],wcls=wsx?(wsx.st==='met'?'wk-ok'+(st.curSet.has(mon)?' wk-cur':''):wsx.st==='rest'?'wk-rest':''):'';
    cells+=`<span class="cal-w ${wcls}" aria-hidden="true"></span>`;
  }
  // texto resumen
  const T=st.target,nw=st.now,wk=st.weeks.slice(-CAL_WEEKS),met=wk.filter(w=>w.st==='met').length,counted=wk.filter(w=>w.st==='met'||w.st==='miss').length;
  const noTs=_calUndated();
  let sum;
  if(!ss.length)sum=`Aún no hay sesiones. Cada entreno pinta su día aquí; entrena <b>${plural(T,'día')}</b> por semana para empezar una racha.`;
  else{
    sum=`<b>${plural(inWin.length,'sesión','sesiones')}</b> en ${CAL_WEEKS} semanas. Objetivo: <b>${plural(T,'día')}</b> por semana`+(counted?`, cumplido en <b>${met} de ${counted}</b>${NB}semanas.`:'.');
    if(nw&&nw.st==='open'&&nw.req>0){const f=nw.req-nw.n;sum+=` Esta semana llevas ${nw.n} de ${nw.req}: ${f===1?'te falta 1':'te faltan '+f} para ${st.cur?'alargar la racha':'empezar una racha'}.`;}
    else if(nw&&nw.st==='met'&&nw.mon===cur)sum+=' Esta semana ya está cumplida. 💪';
    else if(nw&&nw.st==='rest')sum+=' Semana de descanso: no corta la racha.';
  }
  if(noTs)sum+=` ${noTs===1?'Una sesión antigua sin fecha no sale':plural(noTs,'sesión antigua','sesiones antiguas')+' sin fecha no salen'} en el calendario ni ${noTs===1?'cuenta':'cuentan'} para las rachas.`;
  const kp=(v,l,on)=>`<div class="cal-kp${on?' on':''}"><b>${v}<small>${v===1?'semana':'semanas'}</small></b><span>${l}</span></div>`;
  const lg=dayKeys(plan).map(d=>`<span><i style="background:${DAY_COLORS[d]}"></i>${esc(dayLabel(d,plan))} <b>${cnt[d]||0}</b></span>`).join('')
    +(cnt.x?`<span><i style="background:var(--text3)"></i>Otra <b>${cnt.x}</b></span>`:'')
    +(anyRest?`<span><i class="rest"></i>Descanso</span>`:'')
    +`<span><i class="today"></i>Hoy</span><span><i class="wk"></i>Cumplida</span><span><i class="wk cur"></i>Racha</span>`;
  const pickHtml=_calPickHtml(byDay);
  const aria=`Constancia: racha actual ${plural(st.cur,'semana')}, mejor racha ${plural(st.best,'semana')}, objetivo ${plural(T,'día')} por semana.`;
  return`<div class="card cal-card" id="prog-cal" role="group" aria-label="${esc(aria)}">
    <div class="cal-k">${kp(st.cur,'Racha actual',st.cur>0)}${kp(st.best,'Mejor racha',false)}</div>
    <p class="cal-sum" id="cal-sum">${_nwUnits(sum)}</p>
    <div class="cal-wrap" role="group" aria-label="Calendario de las últimas ${CAL_WEEKS} semanas, de lunes a domingo" aria-describedby="cal-sum" onkeydown="calKey(event)" onclick="calWrapTap(event)">${cells}</div>
    <div class="cal-lg">${lg}</div>
    <div class="cal-pick" id="cal-pick" aria-live="polite">${pickHtml}</div>
  </div>`;
}
function _calPickHtml(byDay){
  const list=_calPick&&byDay[_calPick]&&byDay[_calPick].filter(s=>!s.old);if(!list||list.length<2)return'';
  const hm=ts=>{const d=new Date(ts);return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');};
  const dl=_calDate(list[0].ts,new Date(list[0].ts).getFullYear()!==new Date().getFullYear());
  return`<div class="cal-pick-t">${esc(dl[0].toUpperCase()+dl.slice(1))}: ${list.length} sesiones. ¿Cuál quieres ver?</div>
    <div class="cal-pick-b">${list.map(s=>`<button type="button" class="btn bs" style="--dc:${DAY_COLORS[sessDayKey(s)]||'var(--text3)'}" onclick="openSessionSummary(${s.ts})"><i aria-hidden="true"></i>${esc(_calDayLbl(s))} · ${hm(s.ts)}</button>`).join('')}</div>`;
}
// Toque en un día: una sesión → su resumen; varias → elegir cuál (debajo del calendario)
function calTap(b){
  if(!b)return;
  if(+b.dataset.n>1){
    _calPick=_calPick===b.dataset.k?null:b.dataset.k;
    const el=document.getElementById('prog-cal');if(!el){render();return;}
    el.outerHTML=constancyCardHtml();
    const nb=document.querySelector(`#prog-cal .cal-c[data-k="${b.dataset.k}"]`);if(nb)try{nb.focus({preventScroll:true});}catch(e){}
    return;
  }
  _calPick=null;openSessionSummary(+b.dataset.ts);
}
// Toque en el calendario: las celdas miden ~8-11 px, así que un toque va al día con sesión más cercano a menos de 17 px
// de su borde (zona de ≥ 44 px), aunque caiga en un hueco, en un día vacío o en el rótulo del mes. Con teclado (Intro o
// espacio sobre el botón: click sin coordenadas, detail 0) va al botón con el foco.
const CAL_SNAP=17;
function calWrapTap(ev){
  const own=ev.target&&ev.target.closest?ev.target.closest('button.cal-c.on'):null;
  if(ev.detail===0&&own){calTap(own);return;}
  // Un toque en una sesión antigua (sin resumen) o más cerca de ella que de cualquier otra no abre nada (no salta a la vecina)
  const x=ev.clientX,y=ev.clientY;let best=null,bd=Infinity;
  ev.currentTarget.querySelectorAll('button.cal-c.on,.cal-c.on.old').forEach(b=>{const r=b.getBoundingClientRect();
    const dx=Math.max(r.left-x,0,x-r.right),dy=Math.max(r.top-y,0,y-r.bottom),d=Math.hypot(dx,dy);
    // a igual distancia (dentro de la celda: 0), la del centro más próximo
    const dc=d+Math.hypot(x-(r.left+r.right)/2,y-(r.top+r.bottom)/2)*1e-3;if(dc<bd){bd=dc;best=b;}});
  if(best&&best.tagName!=='BUTTON')return;
  if(best&&bd<=CAL_SNAP+1)calTap(best);else if(own)calTap(own);
}
// Teclado: flechas, Inicio y Fin recorren los días con sesión (foco itinerante: un solo Tab entra al calendario)
function calKey(e){
  const k=e.key;if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(k))return;
  const bs=[...document.querySelectorAll('#prog-cal button.cal-c.on')];if(!bs.length)return;
  let i=bs.indexOf(document.activeElement);if(i<0)return;
  i=k==='Home'?0:k==='End'?bs.length-1:(k==='ArrowLeft'||k==='ArrowUp')?Math.max(0,i-1):Math.min(bs.length-1,i+1);
  e.preventDefault();bs.forEach((b,j)=>b.tabIndex=j===i?0:-1);bs[i].focus();
}

function renderProg(){
  const tot=S.sessions.length;
  return`
  <div class="topbar"><h1>Tu progreso</h1><div class="sub">${tot} ${tot===1?'sesión':'sesiones'} completada${tot!==1?'s':''}</div></div>
  ${wrapProgCardHtml()}
  <div class="sh">Constancia</div>
  ${constancyCardHtml()}
  <div class="sh">Músculos trabajados</div>
  ${mmProgCardHtml()}
  <div class="sh" id="rc-h">Más fuerte y más ligero</div>
  ${recompCardHtml()}
  <div class="sh">Peso corporal</div>
  ${progWeightLinkHtml()}
  <div class="sh">Récords</div>
  ${prWallHtml()}
  <div class="sh" id="pl-h">Fuerza por ejercicio</div>
  ${progStrengthHtml()}
  <div class="sh">Guía de progresión</div>
  <div class="card">
    <div style="display:flex;flex-direction:column;gap:12px">
      ${[['var(--green)','↑','¿Llegaste al tope del rango en todas las series?','Sube un salto de tu equipo (2.5 kg en Smith, 1 kg en polea o mancuerna…) y vuelve al mínimo del rango. '+(_rpeOn()?'Si fue fácil':'Si te sobran 3 reps o más')+', puede ser doble. Como mucho un 10 %: con pesos ligeros, antes suma 2 reps y luego da el salto mínimo.'],
         _rpeOn()?['var(--blue)','+','¿Dentro del rango, o al límite?','Mismo peso y una rep más la próxima vez. «Al límite» nunca sube peso.']:['var(--blue)','+','¿Dentro del rango?','Mismo peso y una rep más la próxima vez.'], // (M2)
         ['var(--amber)','↓','¿Dos sesiones seguidas por debajo del rango?','Baja un 5–10 % (al menos un salto) y vuelve a subir desde ahí. No pasa nada.'],
         ['var(--blue)','→','La regla de oro',`${getWeeklyTarget()} día${getWeeklyTarget()!==1?'s':''}/semana durante meses = resultados reales. La constancia lo es todo.`],
      ].map(([c,i,t,d])=>`<div style="display:flex;gap:12px;align-items:flex-start">
        <span style="color:${c};font-size:18px;font-weight:700;line-height:1.3;flex-shrink:0;width:20px;text-align:center">${i}</span>
        <div><div style="font-size:13px;font-weight:500;margin-bottom:2px">${t}</div><div style="font-size:12px;color:var(--text2);line-height:1.55">${_nwUnits(d)}</div></div>
      </div>`).join('')}
    </div>
  </div>`;
}

