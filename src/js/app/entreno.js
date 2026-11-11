// ═══ MODO GYM: REGISTRO SERIE A SERIE (v18) ═══════════════════════════════
// Cada serie es una fila [nº] [− peso +] [− reps +] [✓]. S.logs[exId].sets[i] = {w, r} (números o null) son los
// valores PROPIOS de la serie i: los que tocaste (−/+ o escritos) y, al marcarla con ✓, los que tenía (quedan fijos).
// Una serie sin valores propios copia la anterior; la primera parte del peso/reps de hoy: lo ya escrito (S.logs.w/r),
// si no el objetivo del Coach de carga (coach_prescribe), si no lo último que hiciste. Así las filas vienen rellenas con
// valores reales. Una serie marcada sin valores propios (datos de antes de esta versión) solo tiene el peso escrito.
// S.logs[exId].w/r siguen siendo el resumen que usa el resto de la app (modal final, calentamiento, tarjeta de
// resultado…): el peso máximo de las series hechas y las reps más bajas con ese peso (_syncSetLog).
function _setNumW(v){if(v==null||v==='')return null;const n=typeof v==='number'?v:parseFloat(String(v).replace(',','.'));return isFinite(n)&&n>0&&n<=SET_MAX_W?_r2(n):null;}
function _setNumR(v){if(v==null||v==='')return null;const n=typeof v==='number'?v:parseInt(String(v),10);return isFinite(n)&&n>=1&&n<=SET_MAX_R?Math.round(n):null;}
function _setEntry(x){
  if(!(x&&typeof x==='object'&&!Array.isArray(x)))return null;
  const o={w:_setNumW(x.w),r:_setNumR(x.r)},t=_setNumT(x.t),d=_setNumD(x.d);
  if(t!=null)o.t=t;if(d!=null)o.d=d; // por tiempo / distancia (solo si los tiene: las de kg siguen siendo {w, r})
  return o;
}
// Ejercicio del día que se está entrenando (o de cualquier día del plan)
function _dayEx(id){const d=getPlan()[S.day];return (d&&Array.isArray(d.ex)&&d.ex.find(e=>e.id===id))||findExInPlan(id)||null;}
// Qué celdas lleva una fila según el tipo de registro: td (por tiempo o distancia: la 2.ª celda son segundos o metros),
// noKg (sin celda de peso: solo reps, bandas y material sin kilos) y pc (peso opcional que vacío se lee «PC»)
function _rowKind(ex){
  const lt=exLT(ex),td=lt==='t'||lt==='d',cls=lt==='w'?null:loadEqClass(ex);
  return{lt,td,f:td?lt:'r',noKg:lt==='r'||(lt!=='w'&&LOAD_NOKG.has(cls)),pc:lt==='bw'||(td&&cls==='bw')};
}
// Valores de partida de la primera serie: {w, r} (y t o d en las de tiempo o distancia: lo escrito → el Coach → el plan)
function _setBase(ex,p){
  const l=S.logs[ex.id]||{};
  if(p===undefined)p=coach_prescribe(ex.id);
  const k=_rowKind(ex);
  let w=_setNumW(l.w);
  if(w==null&&p&&p.weight>0)w=_r2(p.weight);
  if(w==null&&!_presRetake(ex.id)){const lw=getLastW(ex.id);if(lw)w=_setNumW(lw.v);} // (E6) tras un parón largo, sin el peso de entonces
  if(k.noKg)w=null;
  if(k.td){
    let t=null,d=null;
    if(k.lt==='t'){t=_setNumT(l.t);if(t==null&&p&&p.t>0)t=p.t;if(t==null)t=_tgtSecs(ex);}
    else{d=_setNumD(l.d);if(d==null&&p&&p.m>0)d=p.m;if(d==null)d=_tgtMetres(ex);}
    return{w,r:null,t,d};
  }
  let r=_setNumR(l.r);
  if(r==null&&p&&p.reps>0)r=p.reps;
  if(r==null)r=_setNumR(targetRepsNum(ex));
  return{w,r};
}
// Filas de un ejercicio de fuerza: [{i, w, r, own, done, rpe}] (+ t, d por tiempo o distancia), tantas como series
function setRows(ex,p){
  const n=Math.max(0,Math.min(SET_MAX_N,parseInt(ex&&ex.s)||0));
  if(!ex||ex.cardio||!n)return[];
  const L=S.logs[ex.id]||{},arr=Array.isArray(L.sets)?L.sets:[],c=S.sets[ex.id]||{},rp=(S.rpe&&S.rpe[ex.id])||{};
  const typedW=_setNumW(L.w),k=_rowKind(ex);
  let prev=_setBase(ex,p);const out=[];
  for(let i=0;i<n;i++){
    const e=_setEntry(arr[i]),done=!!c[i];
    let v;
    if(e)v=e;
    // Marcada antes de esta versión (o reabierta de un registro antiguo sin series): solo vale lo escrito, el peso y los
    // segundos o metros (si no, faltan). Nunca los del plan: una plancha antigua con disco no guardaba sus segundos y al
    // volver a guardarla se inventarían.
    else if(done)v={w:typedW,r:prev.r,t:k.lt==='t'?_setNumT(L.t):null,d:k.lt==='d'?_setNumD(L.d):null};
    else v=prev;
    const row={i,w:k.noKg?null:v.w,r:v.r,own:!!e,done,rpe:+rp[i]||0};
    if(k.td){row.t=v.t!=null?v.t:null;row.d=v.d!=null?v.d:null;}
    out.push(row);
    // La siguiente copia esta (también un peso borrado). Una marcada antigua sin peso no se copia a las que faltan.
    if(e)prev={w:e.w,r:e.r,t:e.t,d:e.d};
    else if(done)prev={w:typedW!=null?typedW:prev.w,r:prev.r,t:prev.t,d:prev.d};
  }
  return out;
}
function _setOwn(exId,i,v){
  if(!S.logs[exId])S.logs[exId]={};
  const L=S.logs[exId];
  if(!Array.isArray(L.sets))L.sets=[];
  while(L.sets.length<i)L.sets.push(null);
  L.sets[i]=_setEntry(v)||{w:null,r:null};
}
// Resumen S.logs.w/r (ver arriba). Antes fija los valores de las series marcadas antiguas que ya tenían peso (así no
// cambian si cambia el resumen); las antiguas sin peso siguen tomando el peso del ejercicio, como antes de v18.
// Por tiempo o distancia, también S.logs.t / d: los segundos o metros más bajos con ese peso (sin valor, sin la clave).
function _syncSetLog(ex){
  if(!ex||ex.cardio)return;
  let rows=setRows(ex);
  if(rows.some(r=>r.done&&!r.own&&r.w>0)){rows.forEach(r=>{if(r.done&&!r.own&&r.w>0)_setOwn(ex.id,r.i,r);});rows=setRows(ex);}
  const L=S.logs[ex.id]||(S.logs[ex.id]={});
  const done=rows.filter(r=>r.done),k=_rowKind(ex);
  const td=(at,f)=>{const v=at.map(r=>r[f]).filter(x=>x>0);if(k.td&&k.lt===(f==='t'?'t':'d')&&v.length)L[f]=String(Math.min(...v));else delete L[f];};
  if(done.length){
    const ws=done.map(r=>r.w).filter(w=>w>0);
    const top=ws.length?Math.max(...ws):null;
    const rr=done.filter(r=>r.r>0&&(top==null?r.w==null:r.w!=null&&Math.abs(r.w-top)<0.01)).map(r=>r.r);
    L.w=top!=null?String(top):'';L.r=rr.length?String(Math.min(...rr)):'';
    if(k.td){const at=done.filter(r=>top==null?r.w==null:r.w!=null&&Math.abs(r.w-top)<0.01);td(at,'t');td(at,'d');}
  }else if(rows[0]&&rows[0].own){
    L.w=rows[0].w!=null?String(rows[0].w):'';L.r=rows[0].r!=null?String(rows[0].r):'';
    if(k.td){td([rows[0]],'t');td([rows[0]],'d');}
  }
}
// Resumen de las series hechas para guardar: {w (máximo), r (reps más bajas con ese peso), sets:[{w,r,rpe}]}. Sin peso
// × reps (peso corporal, bandas, tiempo, distancia): w = el mayor lastre o peso (o null), y r / t (segundos) / m (metros)
// = lo más bajo de las series con ese peso (o de todas, sin peso); cada serie lleva su t o d.
function setsSummary(ex,p){
  const rows=setRows(ex,p),done=rows.filter(r=>r.done);
  const ws=done.map(r=>r.w).filter(w=>w>0),w=ws.length?Math.max(...ws):null;
  const lt=exLT(ex);
  if(lt==='w'||ex.cardio){
    const rr=w==null?[]:done.filter(r=>r.r>0&&r.w!=null&&Math.abs(r.w-w)<0.01).map(r=>r.r);
    return{w,r:rr.length?Math.min(...rr):null,own:done.some(r=>r.own&&r.r>0),sets:done.map(r=>({w:r.w,r:r.r,rpe:r.rpe>=1&&r.rpe<=3?r.rpe:null}))};
  }
  const at=w==null?done:done.filter(r=>r.w!=null&&Math.abs(r.w-w)<0.01);
  const mn=f=>{const v=at.map(r=>r[f]).filter(x=>x>0);return v.length?Math.min(...v):null;};
  const td=lt==='t'||lt==='d';
  return{w,r:td?null:mn('r'),t:lt==='t'?mn('t'):null,m:lt==='d'?mn('d'):null,
    own:done.some(r=>r.own&&(r.r>0||r.t>0||r.d>0)),
    sets:done.map(r=>{const o={w:r.w,r:r.r};if(r.t>0)o.t=r.t;if(r.d>0)o.d=r.d;o.rpe=r.rpe>=1&&r.rpe<=3?r.rpe:null;return o;})};
}
// Cambia las series que faltan: la primera pendiente queda con los valores nuevos (fn(fila) → {w,r}) y las siguientes
// la copian; las que tocaste a mano también cambian (fn), las demás siguen copiando la anterior. Lo que fn no toca (los
// segundos o metros de la fila) se queda.
function _setUndone(ex,fn){
  let first=true;
  setRows(ex).forEach(r=>{if(r.done)return;if(first||r.own)_setOwn(ex.id,r.i,Object.assign({},r,fn(r)));first=false;});
}
// Rellena las series hechas sin peso (modal final «Usar el sugerido» / peso escrito allí). Reps vacías → reps.
function _fillDoneRows(ex,w,reps){
  setRows(ex).forEach(r=>{if(r.done&&!(r.w>0))_setOwn(ex.id,r.i,Object.assign({},r,{w,r:r.r!=null?r.r:reps}));});
  _syncSetLog(ex);
}
function _recTopSets(rec){
  if(!rec||!Array.isArray(rec.sets)||!rec.sets.length)return null;
  const v=+rec.v;if(!(v>0))return null;
  const n=rec.sets.filter(s=>s&&Math.abs(+s.w-v)<0.01).length;
  return n>0?n:null;
}
// Texto fantasma de una fila: lo que hiciste en esa serie la última vez («la última vez: 55×12», «… 45 s», «… 10 kg · 30 m»)
function _ghostTxt(lw,i){
  if(!lw)return'';
  let w,r,t,d;
  if(Array.isArray(lw.sets)&&lw.sets.length){const e=lw.sets[i];if(!e||typeof e!=='object')return'';w=_setNumW(e.w);r=_setNumR(e.r);t=_setNumT(e.t);d=_setNumD(e.d);}
  else{const sd=parseInt(lw.setsDone);if(sd>0&&i>=sd)return'';w=_setNumW(lw.v);r=_setNumR(lw.r);t=_setNumT(lw.t);d=_setNumD(lw.m);}
  if(t!=null||d!=null)return'la última vez: '+(w!=null?_kgNB(w)+NBD:'')+(t!=null?fmtSecs(t):fmtM(d));
  if(w==null&&r==null)return'';
  return'la última vez: '+(w!=null?kgTxt(w)+(r!=null?'×'+r:' kg'):r+' reps');
}
const SET_START_W={barra:20,maq:20,maqA:10,manc:5,polea:5,kb:8,disco:5};
function _startWeight(ex){const c=loadEqClass(ex);return c==='bw'?loadStepOf(ex):(SET_START_W[c]||10);}
// Siguiente serie por hacer del día: la tarjeta abierta si le quedan, si no la empezada, si no la primera pendiente
function _exComplete(ex){return ex.cardio?!!(S.sets[ex.id]||{})[0]:countSetsDone(ex.id,ex.s)>=ex.s;}
function _firstUndone(ex){const c=S.sets[ex.id]||{};for(let i=0;i<ex.s;i++)if(!c[i])return i;return -1;}
function nextSetTarget(){
  const d=getPlan()[S.day];if(!d||!Array.isArray(d.ex))return null;
  const exs=d.ex.filter(e=>e&&!e.cardio&&parseInt(e.s)>0);
  const ex=exs.find(e=>e.id===S.open&&!_exComplete(e))||exs.find(e=>countSetsDone(e.id,e.s)>0&&!_exComplete(e))||exs.find(e=>!_exComplete(e));
  if(!ex)return null;
  const i=_firstUndone(ex);
  return i<0?null:{ex,i};
}
// Siguiente ejercicio sin terminar después de exId (fuerza o cardio); si no hay, el primero de fuerza pendiente
function _nextUnfinishedAfter(exId){
  const d=getPlan()[S.day];if(!d||!Array.isArray(d.ex))return null;
  const k=d.ex.findIndex(e=>e.id===exId);
  return d.ex.slice(k+1).find(e=>!_exComplete(e))||d.ex.slice(0,Math.max(0,k)).find(e=>!e.cardio&&!_exComplete(e))||null;
}
function _rm(){try{return matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){return false;}}
const _cssId=id=>{try{return CSS.escape(String(id));}catch(e){return String(id).replace(/["\\]/g,'\\$&');}};
function _openCard(id){return document.querySelector(`#screen .excard.open[data-ex="${_cssId(id)}"]`);}

// HTML del bloque de series de la tarjeta abierta. Celdas según el tipo de registro (_rowKind): peso × reps; peso corporal
// (lastre opcional, «PC» vacío) × reps; solo reps (sin celda de peso: bandas, sin material); por tiempo o distancia
// (segundos o metros con −/+, y peso opcional si el material lo admite)
// Valor de una fila en la unidad de la prescripción (kg, reps, s o m): lo que compara la etiqueta del objetivo
function _rowVal(row,p){
  if(!row)return null;
  const u=p&&p.unit;
  return !u||u==='kg'?(row.w>0?row.w:null):u==='reps'?(row.r>0?row.r:null):u==='s'?(row.t>0?row.t:null):(row.d>0?row.d:null);
}
// Textos de los −/+ de segundos o metros de una fila («Menos tiempo (−5 s), serie 2»)
function _tdAria(f,v,n){
  const st=f==='t'?_tStep:_dStep,dn=st(v!=null?Math.max(1,v-1):0),up=st(v!=null?v:0),u=f==='t'?'s':'m',w=f==='t'?'tiempo':'distancia';
  return[`Menos ${w} (−${dn} ${u}), serie ${n}`,`Más ${w} (+${up} ${u}), serie ${n}`];
}
function setRowsHtml(ex,p,rows){
  const eid=esc(ex.id),bw=isBodyweightEx(ex),K=_rowKind(ex),fixR=!K.td&&targetRepsNum(ex)==null&&!repRange(ex),lw=getLastW(ex.id);
  const nx=rows.findIndex(r=>!r.done),nDone=rows.filter(r=>r.done).length;
  const pw=p&&p.weight>0?kgTxt(p.weight):'';
  const need=!bw&&rows.some(r=>r.done&&!(r.w>0));
  const nxRow=nx>=0?rows[nx]:null,kgP=_presIsKg(p),tv=_rowVal(nxRow,p);
  // Pasar a otra variante (más difícil o más fácil) no se rellena en las filas: lo cambia el botón del objetivo
  const tag=p&&nxRow&&!p.up&&!p.dn?`<button type="button" class="sug-tag ${presTagCls(p,tv,nxRow.w)}" data-ex="${eid}" onclick="useSug(this.dataset.ex)" aria-label="Poner el objetivo en las series que faltan: ${kgP?`${esc(pw)} kg × ${p.reps}`:esc(presValTxt(p))}">${esc(presTagTxt(p,tv,nxRow.w))}</button>`:'';
  // (09) Récords: las series hechas que baten tu marca van en dorado; la siguiente lleva la pista («Haz 11 reps…»)
  const live=prLive(ex,rows);
  const optA=K.lt==='w'?null:K.pc?' (lastre opcional)':' (opcional)';
  const rowHtml=rows.map(r=>{
    const n=r.i+1,rv=_rpeOn()?r.rpe:0,rpeA=rv===1?' · fácil':rv===2?' · justo':rv===3?' · al límite':''; // (M2) apagado: sin el color ni el texto del esfuerzo
    const pj=r.done?live.flags[r.i]||null:null;
    const g=pj?'':_ghostTxt(lw,r.i);
    const prLine=pj?`<div class="lg-pr got">🏆 ${esc(prTxt(pj))}</div>`
      :r.i===live.next?`<div class="lg-pr hint" data-set="${r.i}"${live.hint?'':' hidden'}>${esc(prHintTxt(live.hint))}</div>`:'';
    const wNeed=r.done&&!bw&&!(r.w>0);
    let repsCell;
    if(K.td){
      // Segundos o metros de la serie (enteros), con −/+ de 5 s / 5-100 m
      const f=K.f,v=r[f],tg=p&&(f==='t'?p.t:p.m),[aDn,aUp]=_tdAria(f,v,n);
      repsCell=`<div class="stp stp-${f}"><button type="button" class="stp-b" aria-label="${aDn}" onclick="setStep(this,'${f}',-1)">−</button><label class="stp-c"><input class="stp-v${v!=null&&String(v).length>=5?' lg5':''}" data-f="${f}" type="text" inputmode="numeric" autocomplete="off" enterkeyhint="done" value="${v!=null?v:''}" placeholder="${tg>0?tg:f==='t'?'seg':'m'}" aria-label="${f==='t'?'Segundos':'Metros'} de la serie ${n}${tg>0?', objetivo '+tg:''}" onfocus="setFocus(this)" oninput="setTyped(this,'${f}')" onblur="setBlur(this)" onkeydown="setKey(event)"><span class="stp-u">${f==='t'?'seg':'metros'}</span></label><button type="button" class="stp-b" aria-label="${aUp}" onclick="setStep(this,'${f}',1)">+</button></div>`;
    }else repsCell=fixR
      ?`<div class="stp stp-r stp-fix" aria-label="Objetivo ${esc(fmtTargetReps(ex))}">${esc(fmtTargetReps(ex))}</div>`
      :`<div class="stp stp-r"><button type="button" class="stp-b" aria-label="Una rep menos, serie ${n}" onclick="setStep(this,'r',-1)">−</button><label class="stp-c"><input class="stp-v" data-f="r" type="text" inputmode="numeric" autocomplete="off" enterkeyhint="done" value="${r.r!=null?r.r:''}" placeholder="${p&&p.reps>0?p.reps:'reps'}" aria-label="Repeticiones de la serie ${n}" onfocus="setFocus(this)" oninput="setTyped(this,'r')" onblur="setBlur(this)" onkeydown="setKey(event)"><span class="stp-u">reps</span></label><button type="button" class="stp-b" aria-label="Una rep más, serie ${n}" onclick="setStep(this,'r',1)">+</button></div>`;
    const wCell=K.noKg?'':`<div class="stp stp-w${wNeed?' need':''}"><button type="button" class="stp-b" aria-label="Menos peso, serie ${n}" onclick="setStep(this,'w',-1)">−</button><label class="stp-c"><input class="stp-v" data-f="w" type="text" inputmode="decimal" autocomplete="off" enterkeyhint="done" value="${r.w!=null?esc(kgTxt(r.w)):''}" placeholder="${pw&&!bw?esc(pw):'—'}" aria-label="Peso de la serie ${n} en kg${optA!=null?optA:pw?', objetivo '+esc(pw):''}" onfocus="setFocus(this)" oninput="setTyped(this,'w')" onblur="setBlur(this)" onkeydown="setKey(event)"><span class="stp-u">${K.pc&&r.w==null?'PC':'kg'}</span></label><button type="button" class="stp-b" aria-label="Más peso, serie ${n}" onclick="setStep(this,'w',1)">+</button></div>`;
    return`<div class="lg-row${r.done?' done':''}${pj?' pr':''}${r.i===nx?' next':''}${K.noKg?' nokg':''}${K.td?' td':''}" data-ex="${eid}" data-set="${r.i}">
      <span class="lg-n" aria-hidden="true">${n}</span>
      ${wCell}
      ${repsCell}
      <button type="button" class="lg-ck${r.done?' on':''}${pj?' pr':''}${r.done&&rv?' r'+rv:''}" aria-pressed="${r.done}" aria-label="${r.done?`Serie ${n} hecha${rpeA}${pj?' · ¡récord!':''}. Toca para desmarcarla`:`Marcar la serie ${n} como hecha`}" onclick="setCheck(this)">✓</button>
    </div>${g?`<div class="lg-ghost">${esc(g)}</div>`:''}${prLine}`;
  }).join('');
  return`<div class="lg-sets" data-ex="${eid}">
    <div class="lg-h"><span class="lg-l sepw"><span class="sepw-a">Series <b>${nDone}/${rows.length}</b></span>${lw&&lw.d?` <span class="lg-d sepw-s"><i class="sep">· </i>última ${esc(lw.d)}</span>`:''}</span>${tag}<button class="hist-btn" onclick="event.stopPropagation();openHist(this.dataset.ex)" data-ex="${eid}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>Historial</button></div>
    ${rowHtml}
    ${bw?'':`<div class="need-hint" data-ex="${eid}"${need?'':' hidden'}>Apunta el peso para que cuente en tu progreso</div>`}
  </div>`;
}
// Actualiza en su sitio las filas de un ejercicio (valores, avisos, etiqueta del objetivo, ajuste en vivo, barra
// «siguiente serie»…) sin repintar la app: no se pierde el foco, el teclado ni el toque en curso
function _refreshSets(ex,skipInp){
  renderNextBar();
  const card=_openCard(ex.id),box=card&&card.querySelector('.lg-sets');
  if(!box)return;
  const p=coach_prescribe(ex.id),rows=setRows(ex,p),bw=isBodyweightEx(ex),K=_rowKind(ex);
  rows.forEach(r=>{
    const row=box.querySelector(`.lg-row[data-set="${r.i}"]`);if(!row)return;
    const wi=row.querySelector('.stp-v[data-f="w"]'),ri=row.querySelector('.stp-v[data-f="r"]');
    if(wi&&wi!==skipInp&&document.activeElement!==wi)wi.value=r.w!=null?kgTxt(r.w):'';
    if(ri&&ri!==skipInp&&document.activeElement!==ri)ri.value=r.r!=null?String(r.r):'';
    if(K.td){
      const xi=row.querySelector(`.stp-v[data-f="${K.f}"]`),v=r[K.f];
      if(xi&&xi!==skipInp&&document.activeElement!==xi)xi.value=v!=null?String(v):'';
      if(xi)xi.classList.toggle('lg5',v!=null&&String(v).length>=5); // 5 cifras (12000 m): letra algo menor
      const bs=row.querySelectorAll(`.stp-${K.f} .stp-b`),a=_tdAria(K.f,v,r.i+1);
      if(bs.length===2){bs[0].setAttribute('aria-label',a[0]);bs[1].setAttribute('aria-label',a[1]);}
    }
    const sw=row.querySelector('.stp-w');if(sw)sw.classList.toggle('need',r.done&&!bw&&!(r.w>0));
    const u=wi&&wi.parentNode.querySelector('.stp-u');if(u)u.textContent=K.pc&&r.w==null?'PC':'kg';
  });
  const h=box.querySelector('.need-hint');if(h)h.hidden=!(!bw&&rows.some(r=>r.done&&!(r.w>0)));
  // (09) Pista de récord de la siguiente serie (cambia con el peso y las reps) y el dorado de las hechas
  {const lv=prLive(ex,rows),he=box.querySelector('.lg-pr.hint');
    if(he){const t=prHintTxt(lv.hint);if(he.textContent!==t)he.textContent=t;he.hidden=!t;}
    rows.forEach(r=>{if(!r.done)return;const row=box.querySelector(`.lg-row[data-set="${r.i}"]`);if(!row)return;
      const on=!!lv.flags[r.i];row.classList.toggle('pr',on);const ck=row.querySelector('.lg-ck');if(ck)ck.classList.toggle('pr',on);
      const got=row.nextElementSibling&&row.nextElementSibling.classList.contains('lg-pr')?row.nextElementSibling:null;
      if(got&&got.classList.contains('got')){got.hidden=!on;if(on)got.textContent='🏆 '+prTxt(lv.flags[r.i]);}});}
  const nx=rows.find(r=>!r.done),tag=box.querySelector('.sug-tag');
  if(tag&&p&&nx){const tv=_rowVal(nx,p);tag.textContent=presTagTxt(p,tv,nx.w);tag.className='sug-tag '+presTagCls(p,tv,nx.w);}
  const la=card.querySelector('.la-slot');if(la)la.innerHTML=liveAdjHtml(ex,p);
  // Calentamiento: sigue al peso de la primera serie (con un pequeño retardo para no parpadear con cada tecla)
  if(!rows.some(r=>r.done)){
    clearTimeout(_wuRefreshT);
    _wuRefreshT=setTimeout(()=>{const slot=card.isConnected?card.querySelector('.wu-slot'):null;if(slot)slot.innerHTML=warmupBlockHtml(ex);},350);
  }
  _refreshSugSlot(card,ex.id);
}
function _rowCtx(el){
  const row=el&&el.closest('.lg-row');if(!row)return null;
  const ex=_dayEx(row.dataset.ex),i=parseInt(row.dataset.set);
  return ex&&!ex.cardio&&i>=0&&i<(parseInt(ex.s)||0)?{row,ex,i}:null;
}
// −/+ de peso (salto del equipo, el mismo del Coach de carga), de reps (de 1 en 1), de segundos (5 s; 15 s desde 2 min)
// o de metros (_dStep). Unos segundos o metros vacíos empiezan en los del plan.
function setStep(btn,f,dir){
  const c=_rowCtx(btn);if(!c)return;
  _cancelAdvance(); // editar la serie recién marcada no deja que la tarjeta se cierre sola
  const r=setRows(c.ex)[c.i];if(!r)return;
  let v=r[f];
  if(f==='w'){
    const st=loadStepOf(c.ex)||2.5;
    if(v==null){if(dir<0)return;v=_startWeight(c.ex);}
    else{const nv=_r2(v+dir*st);if(nv<=0){if(!isBodyweightEx(c.ex))return;v=null;}else v=Math.min(SET_MAX_W,nv);}
  }else if(f==='t'||f==='d'){
    if(v==null){if(dir<0)return;v=(f==='t'?_tgtSecs(c.ex):_tgtMetres(c.ex))||(f==='t'?30:20);}
    else{const s=(f==='t'?_tStep:_dStep)(dir>0?v:Math.max(1,v-1));v=Math.max(s,Math.min(f==='t'?SET_MAX_T:SET_MAX_D,v+dir*s));}
    if(v===r[f])return;
  }else{
    if(v==null){if(dir<0)return;v=targetRepsNum(c.ex)||10;}
    else v=Math.min(SET_MAX_R,Math.max(1,v+dir));
    if(v===r.r)return;
  }
  const nv={w:r.w,r:r.r,t:r.t,d:r.d};nv[f]=v; // lo demás de la serie (sus segundos o metros) se queda
  _setOwn(c.ex.id,c.i,nv);_syncSetLog(c.ex);saveState();
  _refreshSets(c.ex);
}
// Escribir el número (teclado numérico): se guarda al momento; el resto de filas se actualiza sin repintar.
// Segundos: «90», «1:30» o «90s»; metros: enteros.
function setTyped(inp,f){
  const c=_rowCtx(inp);if(!c)return;
  _cancelAdvance();
  const r=setRows(c.ex)[c.i];if(!r)return;
  const raw=String(inp.value||'').trim().slice(0,8);
  const nv={w:r.w,r:r.r,t:r.t,d:r.d};nv[f]=f==='w'?_setNumW(raw):f==='t'?_parseSecs(raw):f==='d'?_setNumD(raw):_setNumR(raw);
  _setOwn(c.ex.id,c.i,nv);_syncSetLog(c.ex);saveState();
  _refreshSets(c.ex,inp);
}
function setFocus(inp){_cancelAdvance();try{inp.select();}catch(e){}const a=document.getElementById('app');if(a)a.classList.add('typing');}
function setBlur(inp){
  const a=document.getElementById('app');if(a)a.classList.remove('typing');
  const c=_rowCtx(inp);if(!c)return;
  const r=setRows(c.ex)[c.i];if(!r)return;
  const f=inp.dataset.f;inp.value=r[f]!=null?(f==='w'?kgTxt(r[f]):String(r[f])):''; // normaliza lo escrito («57,50» → 57.5)
}
function setKey(e){if(e.key==='Enter'){e.preventDefault();try{e.target.blur();}catch(_){}}}
// ✓ de una fila: marca (o desmarca) la serie con los valores que muestra.
// Un doble toque sin querer no la desmarca: el 2.º toque sobre la serie recién marcada (<MARK_GUARD_MS) no cuenta.
const MARK_GUARD_MS=450;
let _rowMark=null,_barMarkTs=0;
function setCheck(btn){
  const c=_rowCtx(btn);if(!c)return;
  const id=c.ex.id,i=c.i,on=!!(S.sets[id]&&S.sets[id][i]);
  if(on&&_rowMark&&_rowMark.id===id&&_rowMark.i===i&&Date.now()-_rowMark.ts<MARK_GUARD_MS)return;
  toggleSet(id,i,{src:'row'});
  _rowMark=!on&&S.sets[id]&&S.sets[id][i]?{id,i,ts:Date.now()}:null;
}

// ── Barra «siguiente serie» (sobre la navegación, con la sesión en marcha) ──
function renderNextBar(){
  const el=document.getElementById('nextbar'),app=document.getElementById('app');
  if(!el||!app)return;
  // Escribiendo un número la barra se esconde (teclado); si el campo desapareció sin «blur», vuelve
  const ae=document.activeElement;if(!(ae&&ae.classList&&ae.classList.contains('stp-v')&&ae.isConnected))app.classList.remove('typing');
  const day=getPlan()[S.day];
  // Con la sesión en marcha (alguna serie marcada en este día) o con un ejercicio de fuerza abierto: la primera
  // serie también se puede marcar desde aquí, sin bajar hasta las filas
  const okDay=!!(S.onboarded&&S.tab==='workout'&&day&&Array.isArray(day.ex));
  const openEx=okDay&&S.open?day.ex.find(e=>e.id===S.open&&!e.cardio&&!_exComplete(e)):null;
  const show=okDay&&(dayMarkCount(S.day).marks>0||!!openEx);
  app.classList.toggle('nb-on',show);el.classList.toggle('show',show);
  if(!show){if(el.innerHTML)el.innerHTML='';_dockSync();return;}
  const t=nextSetTarget();
  let h;
  if(t){
    const rows=setRows(t.ex),row=rows[t.i],val=_setValTxt(t.ex,row);
    h=`<button type="button" class="nb-info" onclick="nbOpen()" aria-label="Abrir ${esc(t.ex.n)}"><span class="nb-t split"><span class="nb-tn">${esc(t.ex.n)}</span><span class="nb-tc"> · <b>Serie ${t.i+1}/${rows.length}</b></span></span><span class="nb-s"><b>${esc(val)}</b></span></button>
      <button type="button" class="nb-go" id="nb-go" onclick="nbDone()" aria-label="Marcar hecha la serie ${t.i+1} de ${esc(t.ex.n)}: ${esc(val)}">✓ Hecho</button>`;
  }else{
    const pend=day.ex.filter(e=>e.cardio&&!_exComplete(e));
    h=`<div class="nb-info"><span class="nb-t">Fuerza completada 🎉</span><span class="nb-s">${pend.length?'Te queda: '+esc(pend[0].n):'Guarda tu entreno'}</span></div>
      <button type="button" class="nb-go" id="nb-go" onclick="finishSession()">Guardar</button>`;
  }
  if(el.innerHTML!==h)el.innerHTML=h;
  _dockSync();
}
// «✓ Hecho» de la barra: marca la siguiente serie aunque su tarjeta esté cerrada o fuera de pantalla.
// El botón sigue en el mismo sitio tras marcar: un doble toque (<MARK_GUARD_MS) marca solo una.
function nbDone(){
  const now=Date.now();if(now-_barMarkTs<MARK_GUARD_MS)return;
  const t=nextSetTarget();if(!t)return;
  _barMarkTs=now;toggleSet(t.ex.id,t.i,{src:'bar'});
}
// Tocar el texto de la barra: abre ese ejercicio y lo trae a la vista
function nbOpen(){
  const t=nextSetTarget();if(!t)return;
  _uiGen++;S.open=t.ex.id;render();_scrollToCard(t.ex.id);
}

// ── Avance automático: ejercicio completado → se cierra y se abre el siguiente pendiente ──
const ADV_MS=700;
let _uiGen=0,_advT=null,_advTok=null,_scrollReq=0,_scrollTo=null;
// Desplazamiento suave pedido por el modo gym: si se repinta a mitad, se continúa desde su destino (no se corta)
function _smoothScroll(s,top){
  const req=++_scrollReq;_scrollTo={top,ts:Date.now()};
  try{s.scrollTo({top,behavior:_rm()?'auto':'smooth'});}catch(e){s.scrollTop=top;}
  // Red de seguridad (WebViews sin desplazamiento suave, pestaña en segundo plano…): si no llegó y nadie ha tocado la
  // pantalla mientras tanto, se coloca directamente
  setTimeout(()=>{if(_scrollReq===req&&Math.abs(s.scrollTop-top)>2)s.scrollTop=top;},650);
}
// Tocar o desplazar la lista a mano anula los desplazamientos automáticos pendientes
['touchstart','wheel','pointerdown'].forEach(ev=>{try{document.getElementById('screen').addEventListener(ev,()=>{_scrollReq++;_scrollTo=null;},{passive:true});}catch(e){}});
function _scheduleAdvance(id){
  clearTimeout(_advT);
  _advTok={id,day:S.day,open:S.open,gen:_uiGen};
  _advT=setTimeout(_runAdvance,ADV_MS);
}
// Tocar un número o un −/+ (editar una serie) también cancela el avance pendiente, incluso a mitad del cierre
function _cancelAdvance(){
  if(!_advT&&!_advTok&&!_advAnim)return;
  clearTimeout(_advT);_advT=null;_advTok=null;
  const a=_advAnim;_advAnim=null;
  if(a){_uiGen++;try{a.anim.cancel();}catch(e){}a.body.style.overflow='';}
}
let _advAnim=null;
function _runAdvance(){
  const t=_advTok;_advTok=null;_advT=null;
  // Solo si nada ha cambiado desde que se completó (otra serie, otra tarjeta, otra pantalla, un modal…)
  if(!t||S.tab!=='workout'||S.day!==t.day||S.open!==t.open||_uiGen!==t.gen||_cmodalState||S._hist||S.settingsOpen)return;
  if(document.querySelector('#cmodal-root .cmov'))return;
  // …ni mientras escribes un número (el campo desaparecería y se cerraría el teclado)
  const ae=document.activeElement;if(ae&&ae.classList&&ae.classList.contains('stp-v')&&ae.isConnected)return;
  const ex=_dayEx(t.id);if(!ex||!_exComplete(ex))return;
  const next=_nextUnfinishedAfter(t.id),gen=++_uiGen,rm=_rm();
  const fin=()=>{
    _advAnim=null;
    if(_uiGen!==gen||S.tab!=='workout'||S.day!==t.day)return;
    S.open=next?next.id:(S.open===t.id?null:S.open);
    render();
    const c=document.querySelector(`#screen .excard[data-ex="${_cssId(t.id)}"]`);
    if(c&&!rm){c.classList.add('just-done');setTimeout(()=>c.classList.remove('just-done'),600);}
    if(next)_scrollToCard(next.id);
  };
  const body=t.open===t.id?(()=>{const c=_openCard(t.id);return c&&c.querySelector('.exb');})():null;
  if(body&&!rm&&typeof body.animate==='function'){
    let done=false;const once=()=>{if(!done){done=true;fin();}};
    try{
      body.style.overflow='hidden';
      const a=body.animate([{height:body.offsetHeight+'px',opacity:1},{height:'0px',opacity:0,paddingTop:'0px',paddingBottom:'0px'}],{duration:240,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});
      _advAnim={anim:a,body};
      a.onfinish=once;a.oncancel=once;setTimeout(once,400);
    }catch(e){once();}
  }else fin();
}
// Desplaza la lista para que la tarjeta quede arriba (suave salvo movimiento reducido)
function _scrollToCard(id){
  const s=document.getElementById('screen'),c=document.querySelector(`#screen .excard[data-ex="${_cssId(id)}"]`);
  if(!s||!c)return;
  const top=Math.max(0,c.getBoundingClientRect().top-s.getBoundingClientRect().top+s.scrollTop-_topOff());
  _smoothScroll(s,top);
}
// Lo que tapa arriba el aviso flotante (#toast, p. ej. «Serie 3 marcada · Deshacer», 5 s): px desde el borde superior
// de la lista. Se mide su posición final (sin la transformación de la entrada, que acaba de empezar).
function _toastCover(){
  const t=document.getElementById('toast'),s=document.getElementById('screen');
  if(!t||!s||!t.classList.contains('show')||!t.offsetHeight||t.closest('#rest-full'))return 0; // (16) dentro del modo descanso no tapa la lista
  if(document.querySelector('.hist-over'))return 0; // (16 r2) con una hoja abierta el aviso va abajo
  let ty=0;try{const m=new DOMMatrixReadOnly(getComputedStyle(t).transform);ty=m.m42||0;}catch(e){}
  return Math.max(0,Math.round(t.getBoundingClientRect().bottom-ty-s.getBoundingClientRect().top));
}
// Hueco arriba al colocar una tarjeta: 10 px, o por debajo del aviso si está a la vista (que no tape su nombre)
function _topOff(){const c=_toastCover();return c?Math.max(10,c+8):10;}
// Altura que tapan abajo la navegación, la barra «siguiente serie» y el descanso (px desde el borde inferior de #app)
function _dockH(){
  let h=0;const bb=document.querySelector('.botbar');h+=bb?bb.offsetHeight:58;h+=8;
  const nb=document.getElementById('nextbar');if(nb&&nb.classList.contains('show'))h+=nb.offsetHeight+6;
  const rt=document.getElementById('rest-timer');if(rt&&rt.classList.contains('show'))h+=rt.offsetHeight+6;
  return h;
}
// (16) La lista (#screen) se acaba donde empieza lo que flota abajo: --dock-h = _dockH() con sus alturas reales (la barra
// de dos líneas, el descanso con o sin chips, la zona segura). Se llama al pintar la barra y al mostrar u ocultar el
// descanso; un ResizeObserver recoge el resto (fuentes, textos que cambian de alto, giro de pantalla).
function _dockSync(){
  const app=document.getElementById('app');if(!app)return;
  const v=_dockH()+'px';
  if(app.style.getPropertyValue('--dock-h')!==v)app.style.setProperty('--dock-h',v);
  const rt=document.getElementById('rest-timer'),on=!!(rt&&rt.classList.contains('show'));
  if(app.classList.contains('dock-on')!==on)app.classList.toggle('dock-on',on);
}
try{
  if(typeof ResizeObserver==='function'){
    const ro=new ResizeObserver(()=>_dockSync());
    ['nextbar','rest-timer'].forEach(id=>{const el=document.getElementById(id);if(el)ro.observe(el);});
    const bb=document.querySelector('.botbar');if(bb)ro.observe(bb);
  }
}catch(e){}
// (16) Al abrir una tarjeta a mano: su cabecera y el «Objetivo de hoy» (Coach de carga) a la vista, por encima de las
// barras de abajo. Si todo eso no cabe, la cabecera arriba (como _scrollToCard); si ya se ve, no se mueve nada.
function _revealOpenCard(id){
  const s=document.getElementById('screen'),card=_openCard(id);
  if(!s||!card)return;
  const box=card.querySelector('.exb .tgt')||card.querySelector('.exb .lg-sets')||card.querySelector('.exb');
  _revealSpan(s,card,box);
}
// Que se vea de la parte de arriba de «top» a la de abajo de «bot» (dentro de la lista, sobre las barras y bajo el aviso)
function _revealSpan(s,top,bot){
  if(!s||!top)return;
  const app=document.getElementById('app'),sr=s.getBoundingClientRect(),st=s.scrollTop,abs=y=>y-sr.top+st;
  const avail=(app?app.getBoundingClientRect().bottom:window.innerHeight)-_dockH()-sr.top; // alto visible útil
  const off=_topOff(),a=abs(top.getBoundingClientRect().top),b=abs((bot||top).getBoundingClientRect().bottom);
  if(a>=st+off-1&&b<=st+avail-8)return;
  let to=(b-a+off+8<=avail&&a>=st+off-1)?b-avail+8:a-off;
  to=Math.max(0,Math.min(to,s.scrollHeight-s.clientHeight));
  if(Math.abs(to-s.scrollTop)<2)return;
  _smoothScroll(s,to);
}
// Tras marcar una serie: que las filas de ese ejercicio queden a la vista por encima de las barras de abajo
// (Tras la primera serie la tarjeta se compacta y las filas suben: también se corrige si quedan por encima.)
function _ensureSetsVisible(exId,first){
  const s=document.getElementById('screen'),card=_openCard(exId),box=card&&card.querySelector('.lg-sets');
  if(!s||!box)return;
  const app=document.getElementById('app'),sr=s.getBoundingClientRect(),br=box.getBoundingClientRect();
  const avail=(app?app.getBoundingClientRect().bottom:window.innerHeight)-_dockH()-sr.top; // alto visible útil
  const st=s.scrollTop,abs=y=>y-sr.top+st;
  const bTop=abs(br.top),bBot=abs(br.bottom),cTop=abs(card.getBoundingClientRect().top);
  // Arriba puede estar el aviso «Serie 1 marcada · Deshacer»: la cabecera se coloca por debajo de él
  const cover=_toastCover(),off=cover?Math.max(10,cover+8):10;
  const fits=bBot-cTop+off+6<=avail;
  // ya se ven enteras (tras la 1.ª serie, que compacta la tarjeta, también su cabecera —fuera o bajo el aviso— si cabe)
  if(bTop>=st+cover+4&&bBot<=st+avail-4&&!(first&&fits&&cTop<st+cover-1))return;
  // Si cabe la tarjeta desde su cabecera hasta la última fila, arriba del todo; si no, la última fila sobre las barras
  let top=fits?cTop-off:bBot-avail+8;
  top=Math.max(0,Math.min(top,s.scrollHeight-s.clientHeight));
  if(Math.abs(top-st)<2)return;
  _smoothScroll(s,top);
}
// Abrir / cerrar una tarjeta y cambiar de día (cuentan como «el usuario ha hecho algo»: cancelan el avance pendiente)
function toggleCard(id){_uiGen++;_scrollReq++;_scrollTo=null;S.open=S.open===id?null:id;render();if(S.open===id)_revealOpenCard(id);}
function setWorkoutDay(k){if(!_isPlanDay(getPlan()[k]))return;_uiGen++;_scrollReq++;_scrollTo=null;S.day=k;S.open=null;render();}

// ── Animación compacta: tras la primera serie se encoge (toca para ampliarla) ──
const _animBig=new Set(); // ejercicios con la animación ampliada a mano (solo en memoria)
function animGrow(id){_animBig.add(id);render();}
function animShrink(id){_animBig.delete(id);render();}
// Las animaciones montadas se reutilizan entre repintados (mismo canvas: conservan giro, pausa y fase)
const _animKeep=new Map(); // exId → elemento .ex-anim montado · máx. 4
function animDetach(root){
  if(!root)return;
  root.querySelectorAll('.ex-anim[data-ex]').forEach(el=>{if(el._ga){_animKeep.delete(el.dataset.ex);_animKeep.set(el.dataset.ex,el);}});
  while(_animKeep.size>4){const k=_animKeep.keys().next().value,el=_animKeep.get(k);_animKeep.delete(k);try{if(typeof GymAnim!=='undefined')GymAnim.unmount(el);}catch(e){}}
}
function animAttach(root){
  if(!root)return;
  root.querySelectorAll('.ex-anim[data-ex]').forEach(ph=>{
    const id=ph.dataset.ex,el=_animKeep.get(id);
    if(!el||el===ph)return;
    if(el.getAttribute('data-gym-anim')!==ph.getAttribute('data-gym-anim')){_animKeep.delete(id);try{GymAnim.unmount(el);}catch(e){}return;}
    el.className=ph.className;
    ph.replaceWith(el);
  });
}

// (16) Cifra y unidad juntas en un texto ya escapado: «80 kg», «12 reps», «8 min», «3 series», «1 × 8 min», «1RM est. 86.5 kg» van en un
// .nw (no se parten entre líneas; textContent igual, sin espacios duros que cambien lo que leen los pasos y los lectores)
function _nwUnits(h){return String(h).replace(/(<span class="nw">[^<]*<\/span>)|(1RM est\. |\d+ × )?(\d[\d.,:]*(?:[-–]\d[\d.,:]*)?) (series\/semana|series\/sem|días\/semana|día\/semana|kg|reps|rep|series|serie|min|s|m|h|días|día|meses|mes|semanas|semana|ejercicios|ejercicio|sesiones|sesión|%)(?=$|[\s·,.:;)<…])/g,(m,sp,a,b,c)=>sp?sp:'<span class="nw">'+(a||'')+b+' '+c+'</span>');} // (18 r2) los .nw ya hechos se copian tal cual (llamarla dos veces no anida .nw); (16e) + «7 días»; (16e r1) + series/sem, días/semana, meses, semanas y %; (17) + ejercicios y sesiones; (18) + «24 kg…» y rangos «8-12 reps» (el guion también parte línea)
// (18) Como _nwUnits y además «× 12» de un peso × reps en un .nw («57.5 kg × 12» parte, si acaso, antes del «×», nunca
// entre «×» y «12»). Un «× » delante de un .nw («3 series × 12 reps») entra en ese mismo .nw: nunca hay .nw anidados
// ni cambia el texto (los .nw ya hechos se copian tal cual, con su «×» dentro). (18 r1) El .nw siguiente entra entero (sin
// volver a mirar dentro), «× 12.»/«× 12, 10» al final de frase también se pegan, «× 8-10» va entero y un rango suelto
// («rango 10-12» del editor) no se parte por el guion
function _nwX(h){return _nwUnits(h).replace(/(<span class="nw">[^<]*<\/span>)|× <span class="nw">([^<]*)<\/span>|× (\d+(?:[.,]\d+)?(?:[-–]\d+)?)(?!\d|[.,]\d)|(\d+[-–]\d+)(?![\d\-–]|[.,]\d)/g,(m,sp,inr,n,rg,off,str)=>sp?sp:inr!=null?'<span class="nw">× '+inr+'</span>':n!=null?'<span class="nw">× '+n+'</span>':(off>0&&/[\d.,\-–]/.test(str[off-1]))?m:'<span class="nw">'+rg+'</span>');} // (18 r2) sin aserción hacia atrás (Safari < 16.4 no lo entiende y no cargaría la app): el carácter de antes del rango se mira con su posición
// (16 r2) «antes 8.5 × 11» de los récords: la marca anterior entera en un .nw (partía «8.5 / × 11»); escapa el texto
function _nwPrev(pv){return esc(pv).replace(/^antes (.+)$/,'antes <span class="nw">$1</span>');}
// Buffer para undo del último toggleSet (5s window)
let _lastSetAction=null;
let _undoToastT=null;
// cls 'pr': aviso dorado de récord («🏆 Récord: 60 kg × 10 · 1RM est. 80 kg»), con el mismo «Deshacer»
function showUndoToast(label,onUndo,cls,ms){ // (E10b) ms: cuánto se ve (por defecto 5 s)
  clearTimeout(_undoToastT);clearTimeout(_toastT); // (16c) ni el temporizador de un aviso anterior lo esconde antes de tiempo
  const el=document.getElementById('toast');
  if(!el)return;
  // (16) «80 kg», «12 reps», «45 s» (y «1RM est. 86.5 kg») no se parten entre líneas (el texto no cambia: solo se envuelven)
  const lbl=_nwX(esc(label)); // (18) y «× 10» de «15 kg × 10» junto
  el.innerHTML=`<span style="margin-right:14px">${lbl}</span><button id="undo-btn" style="background:transparent;border:1px solid var(--green);color:var(--green);border-radius:6px;padding:3px 10px;font-size:12px;font-weight:600;cursor:pointer;pointer-events:auto">Deshacer</button>`;
  el.classList.toggle('pr',cls==='pr');
  el.classList.add('show');
  el.style.pointerEvents='auto';
  try{if(RF.open)RF._toastSeen();}catch(e){} // (16) con el modo descanso abierto, dentro de él y a la vista
  const btn=document.getElementById('undo-btn');
  if(btn){
    btn.addEventListener('click',e=>{
      e.stopPropagation();
      el.classList.remove('show');
      el.style.pointerEvents='';
      el.textContent='';
      onUndo();
    },{once:true});
  }
  _undoToastT=setTimeout(()=>{
    el.classList.remove('show');
    el.style.pointerEvents='';
    el.textContent='';
    _lastSetAction=null;
  },ms||5000);
}

function toggleSet(id,i,evt){
  if(!S.sets[id])S.sets[id]={};
  _uiGen++; // una serie nueva (o desmarcada) cancela el avance automático pendiente
  const wasOff=!S.sets[id][i];
  // Snapshot para undo
  const prevSet=S.sets[id][i];
  const prevRpe=S.rpe&&S.rpe[id]?S.rpe[id][i]:undefined;
  // Registro serie a serie: valores de la serie (y resumen) de antes, para deshacer exactamente
  const exS=_dayEx(id),strS=!!(exS&&!exS.cardio);
  const L0=S.logs[id]||{};
  const prevEntry=strS&&Array.isArray(L0.sets)&&L0.sets[i]!=null?JSON.parse(JSON.stringify(L0.sets[i])):null;
  const prevW=L0.w,prevR=L0.r,hadL=!!S.logs[id];
  // Al marcarla, la serie se queda con los valores que muestra su fila (los prerrellenados o los que tocaste)
  if(strS&&wasOff){const row=setRows(exS)[i];if(row)_setOwn(id,i,row);}
  // Marcar inicio de sesión al primer set marcado (para calcular duración real).
  // Si lo primero fue un cardio con temporizador, la sesión empezó cuando arrancó ese cardio.
  if(wasOff&&!S.sessionStartTs)S.sessionStartTs=_cardioStartHint()||Date.now();
  // Marcar una serie es un gesto del usuario: aquí se crea/desbloquea el audio de los pitidos (iOS)
  if(wasOff)Beep.unlock();
  // Marcar a mano un cardio cuyo temporizador sigue en marcha: ese temporizador ya no hace falta
  if(wasOff&&RT.cardioRunning(id))RT.stop();
  S.sets[id][i]=!S.sets[id][i];
  // Si se desmarca, también limpiar RPE de esa serie (sus valores se quedan en la fila)
  if(!wasOff){
    if(S.rpe&&S.rpe[id])delete S.rpe[id][i];
  }
  // Resumen S.logs.w/r para el resto de la app (peso máximo de las series hechas…)
  if(strS)_syncSetLog(exS);
  // Crear / cerrar el entreno activo según las marcas reales (permite reanudarlo si se interrumpe)
  const rsBefore=getReopened();
  syncActiveWorkout();
  // ¿Al desmarcar la última serie, la sesión reabierta ha vuelto al historial?
  const restoredRs=(rsBefore&&!getReopened())?rsBefore:null;
  saveState();render();
  _lastSetAction={id,i,prevSet,prevRpe};
  const ex=_dayEx(id);
  // (09) ¿Esta serie bate un récord? (el mismo cálculo que pinta su ✓ dorado): aviso «🏆 Récord: …» con Deshacer
  let prj=null;
  if(wasOff&&strS){try{prj=prLive(exS).flags[i]||null;}catch(e){console.error(e);}}
  const label=prj?prToastTxt(prj):wasOff?`Serie ${i+1} marcada`:(restoredRs?`Serie ${i+1} desmarcada · sesión devuelta al historial`:`Serie ${i+1} desmarcada`);
  showUndoToast(label,()=>{
    if(!_lastSetAction)return;
    _uiGen++;
    S.sets[id][i]=_lastSetAction.prevSet;
    if(_lastSetAction.prevRpe!==undefined){
      if(!S.rpe[id])S.rpe[id]={};
      S.rpe[id][i]=_lastSetAction.prevRpe;
    }else if(S.rpe&&S.rpe[id]){
      delete S.rpe[id][i];
    }
    // Valores de la serie y resumen como estaban
    if(strS){
      if(!hadL)S.logs[id]={};
      const L=S.logs[id]||(S.logs[id]={});
      if(prevEntry)_setOwn(id,i,prevEntry);else if(Array.isArray(L.sets)&&i<L.sets.length)L.sets[i]=null;
      if(prevW===undefined)delete L.w;else L.w=prevW;
      if(prevR===undefined)delete L.r;else L.r=prevR;
      _syncSetLog(exS);
      if(S.tab==='workout'&&getPlan()[S.day]&&getPlan()[S.day].ex.some(e=>e.id===id))S.open=id; // volver a esa tarjeta
    }
    // Deshacer también la vuelta al historial: la sesión sigue reabierta como antes
    if(restoredRs&&!getReopened()){
      const sess=findSession(restoredRs.session.ts);
      if(sess){
        _detachSession(sess,restoredRs.prevNextDay,restoredRs.reopenTs);
        S.nextDay=restoredRs.session.day;
        S.sessionStartTs=_reopenStartTs(S.reopenedSession);
        S.activeWorkout={day:restoredRs.session.day,startTs:restoredRs.reopenTs};
      }
    }
    _lastSetAction=null;
    syncActiveWorkout();
    RT.cancelRest();closeRpeSelector();
    saveState();render();
  },prj?'pr':'');
  // toque físico al marcar (Android; iOS no tiene vibrate). Récord: botón dorado, partículas y vibración propia
  if(prj){try{prCelebrate(id,i,evt&&evt.src);}catch(e){console.error(e);}}
  else if(wasOff)haptic(12);
  if(wasOff&&S.tab==='workout'){
    if(ex&&!ex.cardio){
      // El descanso empieza YA (antes esperaba al RPE). El RPE se elige con los chips de la barra (o del modo a
      // pantalla completa) mientras corre, se puede cambiar y ajusta su duración (al límite +15 %, fácil −15 %).
      // (M1) Con el descanso apagado no arranca nada: los chips salen solos en la barra, sin reloj (_rpeOnly)
      const rs=getRestSecs(id);
      const started=_restOn()&&RT.start(rs,ex.n,{exId:id,setIdx:i,base:rs});
      // (M2) Con el esfuerzo apagado no se pregunta (con el descanso también apagado, al marcar no sale nada)
      if(_rpeOn())showRpeSelector(id,i,ex,started);
    }
    if(ex){
      // Que las filas sigan a la vista sobre las barras de abajo; al completar el ejercicio, avance automático
      if(!ex.cardio)_ensureSetsVisible(id,countSetsDone(id,ex.s)===1);
      if(_exComplete(ex))_scheduleAdvance(id);
    }
  }else if(!wasOff){
    RT.cancelRest();
    closeRpeSelector();
  }
}

// ── RPE DE LA SERIE (etapa 08: dentro del descanso) ──
// Tras marcar una serie su descanso ya está corriendo; el esfuerzo se elige con 3 chips en la propia barra del descanso
// (y en el modo a pantalla completa) y se puede cambiar mientras dura: cada cambio recalcula el final desde el mismo
// inicio (al límite +15 %, fácil −15 %, más lo sumado con ±15 s). Ya no hay ventana que tape las filas ni que haya que
// cerrar. _rpeOpen = la serie a la que se refieren los chips: {exId, setIdx, ex, rest (su descanso arrancó al marcar)}.
let _rpeOpen=null;
function showRpeSelector(exId,setIdx,ex,rest){
  _rpeOpen={exId,setIdx,ex,rest:!!rest};
  _rpeOpenLast=null;
  RT._paintRpe();RF.render();
}
// Serie de los chips para el descanso t (en marcha o recién terminado): la última marcada, si ese descanso es el suyo
// (M1) Con el descanso apagado y sin temporizador (t null): la última serie marcada (la barra del esfuerzo sin reloj)
function _rpeTargetFor(t){
  const o=_rpeOpen;
  if(!o||!_rpeOn())return null; // (M2) esfuerzo apagado: sin chips en ningún sitio
  if(!t){if(_restOn())return null;}
  else if(t.kind!=='rest'||t.exId!==o.exId||!Number.isInteger(t.setIdx)||t.setIdx!==o.setIdx)return null;
  if(!S.sets[o.exId]||!S.sets[o.exId][o.setIdx])return null; // desmarcada
  return o;
}
const RPE_CHIPS=[[1,'😌','Fácil','Fácil'],[2,'💪','Justo','Justo'],[3,'🥵','Límite','Al límite']];
function rpeChipsHtml(lvl,big){
  return RPE_CHIPS.map(([n,ic,sh,l])=>`<button type="button" class="rpe-chip r${n}" data-l="${n}" aria-pressed="${lvl===n}" aria-label="${l}" onclick="setRpe(${n})"><i aria-hidden="true">${ic}</i><span>${big?l:sh}</span></button>`).join('');
}
// Descanso según el esfuerzo, sobre el del ejercicio (el guardado en su descanso si lo hay: base)
function _rpeRest(level,exId,t){
  const b=t&&+t.base>0?+t.base:getRestSecs(exId);
  if(!_rpeOn())return b; // (M2) esfuerzo apagado: la duración normal, sin ajuste
  return level===3?Math.round(b*1.15):level===1?Math.round(b*0.85):b;
}
function setRpe(level){
  if(!_rpeOpen||!_rpeOn())return;
  level=+level;if(level!==1&&level!==2&&level!==3)return;
  const o=_rpeOpen,{exId,setIdx,ex}=o;
  if(!S.rpe[exId])S.rpe[exId]={};
  S.rpe[exId][setIdx]=level;
  saveState();
  // Descanso ajustado por el esfuerzo. Si arrancó al marcar la serie, solo se ajusta mientras sigue en marcha: si ya
  // terminó (RPE elegido con «¡Listo!» en la barra) o lo saltaste, el esfuerzo se guarda y no empieza otro descanso.
  // Solo arranca aquí si no pudo arrancar al marcar (había un cardio en marcha).
  const t=S.restTimer;
  if(t&&t.kind==='rest'&&t.exId===exId&&(!Number.isInteger(t.setIdx)||t.setIdx===setIdx)&&t.endTs>Date.now())RT.adjustRest(exId,_rpeRest(level,exId,t));
  else if(!o.rest&&_restOn()){const b=getRestSecs(exId);if(RT.start(_rpeRest(level,exId),ex.n,{exId,setIdx,base:b}))o.rest=true;}
  render();
  RT._paintRpe();RF.render();
  // (M1) Barra del esfuerzo sin reloj: se ve lo elegido un momento y se va sola
  if(!S.restTimer&&!_restOn()){clearTimeout(_rpeSoloT);_rpeSoloT=setTimeout(()=>{_rpeSoloT=null;if(_rpeOpen===o&&!S.restTimer)closeRpeSelector();},RPE_SOLO_MS);}
}
const RPE_SOLO_MS=700;let _rpeSoloT=null;
function skipRpe(){
  const o=_rpeOpen;
  closeRpeSelector();
  // Sin esfuerzo: descanso normal (si no había empezado ya al marcar la serie)
  const last=o||_rpeOpenLast;
  if(last&&!last.rest&&_restOn()){const b=getRestSecs(last.exId);RT.start(b,last.ex.n,{exId:last.exId,setIdx:last.setIdx,base:b});}
  _rpeOpenLast=null;
}
let _rpeOpenLast=null;
// Quita los chips (desmarcar, deshacer, guardar o descartar el entreno…). El descanso, si lo hay, sigue.
function closeRpeSelector(){
  if(_rpeOpen)_rpeOpenLast=_rpeOpen;
  _rpeOpen=null;
  try{RT._paintRpe();RF.render();}catch(e){console.error(e);}
}
// Temporizadores del refresco en su sitio del calentamiento y de la tarjeta de resultado (los usa _refreshSets).
// (07) Los manejadores del antiguo campo único de peso/reps se quitaron: las filas usan setStep/setTyped/setFocus.
let _wuRefreshT=null,_sugRefreshT=null;
// Tarjeta de resultado («Próxima sesión: …»): se recalcula con lo que escribes (peso y reps), con un pequeño retardo
function _refreshSugSlot(card,id){
  clearTimeout(_sugRefreshT);
  _sugRefreshT=setTimeout(()=>{
    const slot=card&&card.isConnected?card.querySelector('.sug-slot'):null;
    if(!slot)return;
    const g=getSug(id);
    slot.innerHTML=g?`<div class="sug ${g.t}">${_nwX(g.m)}</div>`:'';
  },250);
}
function logW(){
  const v=parseFloat(S.wnew);
  if(!v||v<30||v>300){
    // Shake del input + mensaje
    const inp=document.querySelector('.mover .ob-inp');
    if(inp){
      inp.style.borderColor='var(--red)';
      inp.classList.add('shake');
      setTimeout(()=>{inp.style.borderColor='';inp.classList.remove('shake');},600);
    }
    toast('Introduce un peso entre 30 y 300 kg');
    return;
  }
  const now=Date.now();
  S.weights.push({d:fmtDate(new Date()),v,ts:now});
  S.wmodal=false;S.wnew='';saveState();render();
  toast(`Peso guardado: ${v} kg`);
}
function finishSession(){
  const day=getPlan()[S.day];
  // (E1a) un día sin ejercicios no se guarda como sesión (contaría en la semana, el Coach y el calendario)
  if(!_dayLive(day)){toast('Este día aún no tiene ejercicios: añade alguno antes de guardar');return;}
  const strEx=day.ex.filter(e=>!e.cardio);
  const doneEx=strEx.filter(e=>countSetsDone(e.id,e.s)>=e.s).length;
  // Bug fix: evitar doble sesión el mismo día — comparar por timestamp (resistente a colisiones de año)
  // Una sesión reabierta se guarda con su fecha original: se compara con ESE día.
  const rs=reopenedFor(S.day);
  const nowTs=rs?rs.session.ts:Date.now();
  const existingToday=S.sessions.find(s=>s.ts&&sameDayTs(s.ts,nowTs));
  if(existingToday){
    confirmModal({
      title:rs?'Ya hay otra sesión ese día':'Ya hay una sesión hoy',
      body:`Ya registraste el ${sessDayLbl(existingToday)} ${rs?'el '+(rs.session.date||'mismo día'):'hoy'}. ¿Guardar esta como una sesión adicional?`,
      okText:'Guardar igual',
      cancelText:'Cancelar',
      onOk:()=>openFinishModal(doneEx,strEx.length)
    });
    return;
  }
  openFinishModal(doneEx,strEx.length);
}

// Ejercicios de fuerza con series marcadas pero SIN peso escrito: al guardar se perderían del progreso.
// Los de peso corporal / por tiempo no cuentan (su peso es opcional).
// Devuelve [{ex, done (series hechas), sug (peso sugerido o null), last (último peso o null), repsLbl}]
function getMissingWeights(dayKey){
  const day=getPlan()[dayKey||S.day];
  if(!day||!Array.isArray(day.ex))return[];
  return day.ex.filter(ex=>!ex.cardio&&exLT(ex)==='w'&&countSetsDone(ex.id,ex.s)>0&&!(parseFloat((S.logs[ex.id]||{}).w)>0)).map(ex=>{
    const p=coach_prescribe(ex.id),lw=getLastW(ex.id),typedR=parseInt((S.logs[ex.id]||{}).r);
    return{ex,done:countSetsDone(ex.id,ex.s),sug:p&&p.weight>0?p.weight:null,last:lw&&+lw.v>0?+lw.v:null,
      repsLbl:typedR>0?typedR+' reps':p&&p.reps>0?p.reps+' reps':fmtTargetReps(ex)};
  });
}
function _finSugLabel(n){return n>1?'Usar los sugeridos':'Usar el sugerido';}

// Modal de finalización con nota opcional (+ aviso de pesos sin escribir)
function openFinishModal(doneEx,totalEx){
  const root=document.getElementById('cmodal-root');
  if(!root)return;
  const allDone=doneEx===totalEx;
  const miss=getMissingWeights(S.day);
  const rs=reopenedFor(S.day);
  const title=allDone?'¡Terminado!':'Sesión incompleta';
  let body=allDone?'Buen trabajo. ¿Quieres añadir una nota sobre cómo te sentiste?':`Solo ${doneEx}/${totalEx} ejercicios completados. Puedes añadir una nota antes de guardar.`;
  if(rs)body+=` Se guardará con su fecha original (${rs.session.date||'sin fecha'}).`;
  const note=rs&&rs.session.note?String(rs.session.note).slice(0,500):'';
  const nSug=miss.filter(m=>m.sug!=null).length,anySug=nSug>0;
  const missHtml=miss.length?`<div class="fin-miss" id="fin-miss">
      <div class="fin-miss-h">⚠️ ${miss.length===1?'Falta el peso en 1 ejercicio':`Falta el peso en ${miss.length} ejercicios`}</div>
      <div class="fin-miss-p">Marcaste series sin escribir el peso y no contarían en tu progreso. ${nSug>1?'Usa los sugeridos, escribe otros aquí o revísalos.':anySug?'Usa el sugerido, escribe otro aquí o revísalo.':miss.length>1?'Escríbelos aquí o revísalos.':'Escríbelo aquí o revísalo.'}</div>
      ${miss.map(m=>`<div class="fin-miss-row">
        <div class="fin-miss-n">${esc(m.ex.n)}<small>${m.done} serie${m.done!==1?'s':''}${m.repsLbl?` · ${esc(m.repsLbl)}`:''}${m.last!=null?` · última ${m.last} kg`:' · sin historial'}</small></div>
        <input class="inp inp-hint fin-miss-inp" type="number" inputmode="decimal" step="0.5" min="0" data-ex="${esc(m.ex.id)}" placeholder="${m.sug!=null?m.sug+' sugerido':'peso'}" aria-label="Peso de ${esc(m.ex.n)} en kg" oninput="this.classList.remove('need');_finMissLabel()">
        <span class="fin-miss-u">kg</span>
      </div>`).join('')}
      <div class="fin-miss-err" id="fin-miss-err" hidden></div>
      <button class="fin-miss-skip" id="fin-skip-btn" hidden onclick="finishSkipMissing(${doneEx},${totalEx})">Guardar sin esos pesos</button>
    </div>`:'';
  root.innerHTML=`<div class="cmov" onclick="if(event.target===this){document.getElementById('cmodal-root').innerHTML=''}"><div class="cmod">
    <div class="cmod-hdl"></div>
    <div class="cmod-t">${esc(title)}</div>
    <div class="cmod-b">${esc(body)}</div>
    ${missHtml}
    <textarea id="finish-note-inp" class="inp" placeholder="Notas opcionales (p. ej.: dolió el hombro, cardio sin pausa, sueño regular…)" rows="3" maxlength="500" style="width:100%;font-size:14px;font-family:inherit;font-weight:400;resize:vertical;min-height:60px;margin-bottom:14px">${esc(note)}</textarea>
    <div class="cmod-btns">
      ${miss.length
        ?`<button class="btn bs" onclick="finishReview()">Revisar</button>
      <button class="btn bp" id="fin-save-btn" onclick="finishUseSuggested(${doneEx},${totalEx})">${anySug?_finSugLabel(nSug):'Guardar'}</button>`
        :`<button class="btn bs" onclick="document.getElementById('cmodal-root').innerHTML=''">Cancelar</button>
      <button class="btn bp" onclick="finishSessionConfirmedWithNote(${doneEx},${totalEx})">Guardar</button>`}
    </div>
  </div></div>`;
  // Sin avisos pendientes: foco en la nota. Con avisos: no abrir el teclado encima de la lista.
  if(!miss.length)setTimeout(()=>{const i=document.getElementById('finish-note-inp');if(i)i.focus();},80);
}

// ── Pesos sin escribir (modal final) ──
function _finCollectMissing(){
  const day=getPlan()[S.day];
  const out=[];
  document.querySelectorAll('#fin-miss .fin-miss-inp').forEach(inp=>{
    const ex=day&&Array.isArray(day.ex)?day.ex.find(e=>e.id===inp.dataset.ex):null;
    if(!ex)return;
    const typed=parseFloat(String(inp.value||'').replace(',','.'));
    const okTyped=typed>0&&typed<1000;
    const p=coach_prescribe(ex.id);
    out.push({inp,ex,typed:okTyped,w:okTyped?+typed.toFixed(2):(p&&p.weight>0?p.weight:null)});
  });
  return out;
}
// Escribe en S.logs el peso elegido (y las reps objetivo si estaban vacías)
function _finWriteMissing(rows,fillReps){
  rows.forEach(m=>{
    if(m.w==null)return;
    if(!S.logs[m.ex.id])S.logs[m.ex.id]={};
    // Reps vacías → las del objetivo de hoy (Coach de carga; nunca un objetivo por tiempo «30s»). Se calculan
    // ANTES de escribir el peso, con el historial tal cual.
    const tr=_todayReps(m.ex);
    S.logs[m.ex.id].w=String(m.w);
    if(fillReps&&!(parseInt(S.logs[m.ex.id].r)>0)&&tr)S.logs[m.ex.id].r=String(tr);
    // Registro serie a serie: las series hechas sin peso se quedan con este (y sin reps, con las del objetivo)
    _fillDoneRows(m.ex,m.w,fillReps?tr:null);
  });
  saveState();
}
// Texto del botón principal: «Usar el/los sugerido(s)» mientras quede alguno vacío con sugerencia
function _finMissLabel(){
  const btn=document.getElementById('fin-save-btn');
  if(!btn)return;
  const n=_finCollectMissing().filter(m=>!m.typed&&m.w!=null).length;
  btn.textContent=n?_finSugLabel(n):'Guardar';
}
function finishUseSuggested(doneEx,totalEx){
  const rows=_finCollectMissing();
  const pend=rows.filter(m=>m.w==null);
  if(pend.length){
    // Sin sugerencia (ejercicio sin historial) y sin escribir: no se guarda nada a ciegas
    pend.forEach(m=>{m.inp.classList.add('need');m.inp.classList.remove('shake');void m.inp.offsetWidth;m.inp.classList.add('shake');});
    const err=document.getElementById('fin-miss-err');
    if(err){err.hidden=false;err.textContent=pend.length===1
      ?`Escribe el peso de «${pend[0].ex.n}»: aún no hay sugerencia.`
      :`Escribe el peso de ${pend.length} ejercicios: aún no tienen sugerencia.`;}
    const sk=document.getElementById('fin-skip-btn');if(sk)sk.hidden=false;
    try{pend[0].inp.focus();}catch(e){}
    return;
  }
  _finWriteMissing(rows,true);
  finishSessionConfirmedWithNote(doneEx,totalEx);
}
// Elección explícita: guardar la sesión aunque algún ejercicio quede sin peso
function finishSkipMissing(doneEx,totalEx){
  const rows=_finCollectMissing();
  _finWriteMissing(rows,true); // los que sí tienen peso (escrito o sugerido) se guardan
  const skipped=rows.filter(m=>m.w==null).length;
  finishSessionConfirmedWithNote(doneEx,totalEx,skipped
    ?`✅ Sesión guardada · ${skipped} ejercicio${skipped!==1?'s':''} sin peso no cuenta${skipped!==1?'n':''} en tu progreso`:null);
}
// «Revisar»: cierra el modal y lleva al primer ejercicio sin peso (conserva lo escrito en el modal)
function finishReview(){
  _finWriteMissing(_finCollectMissing().filter(m=>m.typed),false);
  const root=document.getElementById('cmodal-root');if(root)root.innerHTML='';
  const miss=getMissingWeights(S.day);
  if(S.tab!=='workout'){S.tab='workout';}
  S.open=miss.length?miss[0].ex.id:null;
  render();
  if(!miss.length)return;
  const first=miss[0];
  setTimeout(()=>{
    // La primera serie hecha sin peso (o la primera fila)
    const inp=document.querySelector('.excard.open .stp-w.need .stp-v')||document.querySelector('.excard.open .stp-v[data-f="w"]');
    if(inp){
      const cell=inp.closest('.stp');if(cell)cell.classList.add('need');
      let rm=false;try{rm=matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){}
      try{inp.scrollIntoView({block:'center',behavior:rm?'auto':'smooth'});}catch(e){}
      try{inp.focus({preventScroll:true});}catch(e){}
    }
  },120);
  toast(miss.length>1?`Escribe el peso de «${first.ex.n}» y ${miss.length-1} más`:`Escribe el peso de «${first.ex.n}»`,3200);
}

let _finishInFlight=false;
function finishSessionConfirmedWithNote(doneEx,totalEx,doneMsg){
  if(_finishInFlight)return; // anti doble-tap: evita guardar la sesión dos veces
  _finishInFlight=true;
  const inp=document.getElementById('finish-note-inp');
  const note=inp?String(inp.value||'').trim().slice(0,500):'';
  document.getElementById('cmodal-root').innerHTML='';
  finishSessionConfirmed(doneEx,totalEx,note,doneMsg);
  setTimeout(()=>{_finishInFlight=false;},800);
}
function finishSessionConfirmed(doneEx,totalEx,note,doneMsg){
  const day=getPlan()[S.day];
  if(!_dayLive(day)){toast('Este día aún no tiene ejercicios: añade alguno antes de guardar');return;} // (E1a)
  const strEx=day.ex.filter(e=>!e.cardio);
  const now=Date.now();
  // Sesión reabierta de este día: se guarda con su fecha/ts originales (misma semana) y acumula la duración
  const rs=reopenedFor(S.day);
  const sessTs=rs?rs.session.ts:now;
  const today=rs?(rs.session.date||fmtDate(new Date(sessTs))):fmtDate(new Date());
  let durationMin;
  if(rs){
    // Duración original + tiempo extra desde que se reabrió (si el extra no es plausible, se conserva la original)
    const o=+rs.session.durationMin;
    const orig=isFinite(o)&&o>0?Math.round(o):null;
    const extra=rs.reopenTs?Math.max(0,Math.round((now-rs.reopenTs)/60000)):0;
    durationMin=orig==null?null:(orig+extra<=MAX_SESSION_MIN?orig+extra:orig);
  }else{
    // Duración real: desde el primer set marcado hasta ahora.
    // Si supera el máximo plausible (entreno reanudado horas/días después), se descarta (null).
    durationMin=S.sessionStartTs?Math.max(1,Math.round((now-S.sessionStartTs)/60000)):null;
    if(durationMin!=null&&durationMin>MAX_SESSION_MIN)durationMin=null;
  }
  const base=rs?Object.assign({},rs.session):{};
  delete base.snapshot;
  const session=Object.assign(base,{day:S.day,date:today,ts:sessTs,doneEx,totalEx,note:note||null,durationMin});
  // (E1b) el nombre, el foco y el id del día con que se hizo: el historial no cambia aunque cambie la rutina
  session.lbl=dayLabel(S.day).slice(0,80);session.focus=String(day.focus==null?'':day.focus).slice(0,200);
  if(day.did)session.did=day.did;else delete session.did;
  if(_isPlainObj(S.planMeta)&&S.planMeta.id)session.pid=S.planMeta.id;else delete session.pid; // (E2) la rutina con que se hizo
  if(rs)_insertByTs(S.sessions,session);else S.sessions.push(session);
  // Guardar reps, series completadas y RPE promedio
  strEx.forEach(ex=>{
    // Registro serie a serie (v18): peso = el máximo de las series hechas, reps = las más bajas con ese peso, y cada
    // serie en sets:[{w,r,rpe}]. v/r/setsDone/rpe siguen como siempre (Coach, Progreso y gráficas no cambian).
    // Sin peso (peso corporal, bandas, por tiempo o distancia) también se guarda, con v 0 y su medida: reps (r),
    // segundos (t) o metros (m), y su tipo (lt). Peso × reps sin peso sigue sin registro (aviso «Falta el peso»).
    const lt=exLT(ex),l=S.logs[ex.id]||{},sm=setsSummary(ex),w=sm.w||parseFloat(l.w);
    const setsDone=countSetsDone(ex.id,ex.s);
    if(w||(lt!=='w'&&setsDone>0&&(lt==='t'?sm.t>0:lt==='d'?sm.m>0:true))){
      if(!S.strength[ex.id])S.strength[ex.id]=[];
      // Reps sin escribir con series marcadas: cuentan las del objetivo de hoy (el placeholder «N objetivo» y lo que
      // ya daba por hecho la tarjeta de resultado). Antes se guardaba null y la siguiente sugerencia no cuadraba.
      const reps=lt==='t'||lt==='d'?(sm.r||null):(sm.r||parseInt(l.r)||(setsDone>0?(_todayReps(ex)||null):null));
      // Calcular RPE promedio de la sesión
      const rpeMap=S.rpe[ex.id]||{};
      const rpeValues=Object.values(rpeMap).filter(v=>v>0);
      const avgRpe=rpeValues.length>0?+(rpeValues.reduce((a,b)=>a+b,0)/rpeValues.length).toFixed(2):null;
      // Guardar también el muscle group para análisis RPE acumulado por zona
      const rec={d:today,v:w||0,r:reps,setsDone,rpe:avgRpe,muscle:ex.muscle||null,ts:sessTs};
      // Plan con el que se hizo (v16): series de verdad (sin la descarga) y reps del plan. El Coach de carga juzga
      // esta sesión con él aunque después cambies las series o las reps.
      rec.ps=_baseSets(ex);
      if(_validPr(ex.r))rec.pr=typeof ex.r==='number'?ex.r:String(ex.r).slice(0,20);
      // Nombre del ejercicio (v14): Progreso lo sigue mostrando aunque luego lo quites o lo cambies en la rutina
      if(ex.n)rec.n=String(ex.n).slice(0,120);
      // Sesión ligera (descarga o semana de descanso): queda marcada y no cuenta para la tendencia del Coach
      if(_lightAt(ex.id,sessTs))rec.dl=1;
      // Cada serie hecha (v18, aditivo): [{w, r, rpe}] en su orden. Los registros antiguos no lo tienen.
      if(sm.sets.length)rec.sets=sm.sets;
      // Tipo de registro (aditivo): solo si no es peso × reps; por tiempo, los segundos; por distancia, los metros
      // Con peso y sin sus segundos o metros (una plancha antigua con disco, reabierta y guardada otra vez): registro de
      // kg como los de antes, sin tipo ni medida (nunca la del plan)
      const tdNoX=(lt==='t'&&!(sm.t>0))||(lt==='d'&&!(sm.m>0));
      if(lt!=='w'&&REC_LT.includes(lt)&&!tdNoX)rec.lt=lt;
      if(lt==='t'&&sm.t>0)rec.t=sm.t;
      if(lt==='d'&&sm.m>0)rec.m=sm.m;
      if(rs)_insertByTs(S.strength[ex.id],rec);else S.strength[ex.id].push(rec);
    }
  });
  // Snapshot del trabajo realizado (series, pesos serie a serie, RPE) para poder reabrir la sesión SIN pérdida
  session.snapshot={sets:{},logs:{},rpe:{}};
  const _cp=o=>JSON.parse(JSON.stringify(o));
  day.ex.forEach(ex=>{
    if(S.sets[ex.id]&&Object.keys(S.sets[ex.id]).length)session.snapshot.sets[ex.id]={...S.sets[ex.id]};
    if(S.logs[ex.id]&&Object.keys(S.logs[ex.id]).length)session.snapshot.logs[ex.id]=_cp(S.logs[ex.id]);
    if(S.rpe[ex.id]&&Object.keys(S.rpe[ex.id]).length)session.snapshot.rpe[ex.id]={...S.rpe[ex.id]};
  });
  // (11) Ejercicios hechos «solo hoy» en lugar de los de tu rutina (aditivo): el resumen lo dice y, si reabres la
  // sesión, vuelven a sustituirse. Solo los que tienen series hechas.
  const subs=_sessSubsOf(day,session.snapshot.sets,sessTs);
  if(subs.length)session.subs=subs;else delete session.subs;
  // Rotación: tras la sesión más reciente (una reabierta antigua no debe saltarse la que vino después)
  // (E1a) getNextDay salta los días vacíos y siempre da un día que existe (antes, un «arreglo» repetía la misma llamada)
  S.nextDay=rs?getNextDay((l=>sessDayKey(l)||l.day)(S.sessions[S.sessions.length-1])):(S.rotBack&&_dayLive(getPlan()[S.rotBack])?S.rotBack:(seqNextDay()||getNextDay(S.day)));
  if(!rs)S.rotBack=null; // (E12) «¿Hoy en otro sitio?»: el día que tocaba vuelve justo después; con planMeta.seq, su orden
  // La sesión reabierta ya está guardada de nuevo (y sus cambios no están en la última copia: su ts es el de antes)
  if(rs){S.reopenedSession=null;S.dataEditTs=now;}
  day.ex.forEach(ex=>{S.sets[ex.id]={};S.logs[ex.id]={};});
  // (11) La sesión ha terminado: los ejercicios cambiados «solo hoy» vuelven a ser los de tu rutina
  revertDaySubs(S.day);
  // Limpiar RPE, warmups y tracker de duración de la sesión
  S.rpe={};S.warmups={};S.sessionStartTs=null;
  _animBig.clear();clearTimeout(_advT);_advTok=null;closeRpeSelector();
  // La sesión ha terminado: fuera el descanso/cardio en marcha (un cardio no debe marcarse en la siguiente)
  RT.stop();
  // Re-detectar entreno activo: null si no quedan marcas, o reapunta a otro día a medias
  S.activeWorkout=null;
  syncActiveWorkout();
  S.open=null;
  // Cancelar undo pendiente
  _lastSetAction=null;
  // Disparar análisis semanal si toca
  coach_maybeRunWeeklyAnalysis();
  saveState();
  // (15b) Con la primera sesión guardada (y en las siguientes, una vez por arranque) pide al navegador que no borre los datos
  storagePersist();
  toast(doneMsg||(rs?`✅ Sesión del ${today} guardada · Próxima: ${dayLabel(S.nextDay)}`:`✅ Sesión guardada · Próxima: ${dayLabel(S.nextDay)}`),doneMsg?4200:undefined);
  go('dash');
  // (09) Resumen de la sesión recién guardada: contadores, frente a la última del mismo día, récords, ejercicios,
  // esfuerzo y mapa muscular
  try{openSessionSummary(sessTs,{fresh:true});}catch(e){console.error(e);}
}

// ── REANUDAR / DESCARTAR ENTRENO EN CURSO ──
function resumeWorkout(){
  const aw=getActiveWorkout();
  if(!aw){render();return;}
  S.day=aw.day;
  S.open=null;
  go('workout');
  toast(`Reanudando ${dayLabel(aw.day)}`);
}
function discardWorkout(){
  const aw=getActiveWorkout();
  if(!aw)return;
  const rs=reopenedFor(aw.day);
  confirmModal({
    title:rs?'Descartar cambios':'Descartar entreno',
    body:rs
      ?`Se descartarán los cambios y la sesión del ${aw.label} (${rs.session.date||''}) vuelve a tu historial tal como estaba.`
      :`Se borrarán las series marcadas del ${aw.label} sin guardar la sesión. Tu historial y tus pesos NO se tocan. ¿Seguro?`,
    okText:'Descartar',cancelText:'Cancelar',danger:true,
    onOk:()=>{
      const plan=getPlan();
      const day=plan[aw.day];
      if(day&&Array.isArray(day.ex)){
        day.ex.forEach(ex=>{
          S.sets[ex.id]={};S.logs[ex.id]={};
          if(S.rpe)delete S.rpe[ex.id];
          if(S.warmups)delete S.warmups[ex.id];
        });
      }
      revertDaySubs(aw.day); // (11) lo cambiado «solo hoy» vuelve a ser lo de tu rutina
      S.activeWorkout=null;S.sessionStartTs=null;_lastSetAction=null;
      _animBig.clear();clearTimeout(_advT);_advTok=null;closeRpeSelector();
      RT.stop(); // descanso/cardio de un entreno descartado
      // Re-detectar: si quedara otro día con marcas, su tarjeta vuelve a mostrarse (nada queda huérfano).
      // Si era una sesión reabierta, aquí vuelve al historial tal como estaba.
      syncActiveWorkout();
      const restored=!!(rs&&!getReopened());
      saveState();render();
      toast(restored?`Cambios descartados · la sesión del ${rs.session.date||''} sigue en tu historial`:'Entreno descartado',restored?3600:undefined);
    }
  });
}

// ── REABRIR UNA SESIÓN YA FINALIZADA (rescatar) ──
// Devuelve la sesión guardada por su ts, o null.
function findSession(ts){return (S.sessions||[]).find(s=>s.ts===ts)||null;}

// Sesión reabierta (persistida en S.reopenedSession, schema v11):
//   {session:{...sesión original con snapshot}, strength:{exId:[registros originales]}, reopenTs, prevNextDay}
// Al volver a guardarla conserva fecha/ts, nota y acumula la duración. Si se descarta (o se quedan sin
// series marcadas), vuelve al historial tal como estaba: nunca se pierde.
function _isPlainObj(o){return !!o&&typeof o==='object'&&!Array.isArray(o);}
function _validReopened(x){
  if(!_isPlainObj(x)||!_isPlainObj(x.session))return false;
  const s=x.session;
  if(typeof s.ts!=='number'||!isFinite(s.ts)||typeof s.day!=='string'||!s.day)return false;
  // Una sesión de verdad siempre trae su fecha (o su recuento de ejercicios, o su snapshot): si no, es basura
  if(!(typeof s.date==='string'&&s.date)&&!(typeof s.doneEx==='number'&&isFinite(s.doneEx))&&!_isPlainObj(s.snapshot))return false;
  // Registros de fuerza apartados: objeto {exId:[...]} (o ausente)
  if(x.strength!=null&&!_isPlainObj(x.strength))return false;
  return true;
}
function getReopened(){return _validReopened(S.reopenedSession)?S.reopenedSession:null;}
// La reabierta que corresponde a un día de la rutina (o null)
// (E1b) por el id del día de la sesión (sessOfDay): si el día cambió de letra antes de reabrirla, sigue siendo el suyo
function reopenedFor(dayKey){const r=getReopened();return r&&(sessOfDay(r.session,dayKey)||(!_isPlanDay(getPlan()[dayKey])&&r.session.day===dayKey))?r:null;}
// Inicio del cronómetro de una reabierta: sigue contando desde su duración original
function _reopenStartTs(r){
  if(!r)return Date.now();
  const o=+r.session.durationMin;
  const orig=isFinite(o)&&o>0&&o<=MAX_SESSION_MIN?o:0;
  return (r.reopenTs||Date.now())-orig*60000;
}
// Inserta manteniendo el orden cronológico por ts (si es el más reciente equivale a push)
function _insertByTs(arr,rec){
  let i=arr.length-1;
  while(i>=0&&((arr[i]&&arr[i].ts)||0)>rec.ts)i--;
  arr.splice(i+1,0,rec);
}
// Saca una sesión del historial (y sus registros de fuerza) y la guarda como reabierta. (E1b, 42 R6) Con keepIds, solo
// aparta los registros de los ejercicios que siguen en el día (los que se vuelven a grabar al guardarla): los de un
// ejercicio que ya no está (cambiado o quitado en el editor) se quedan en tu historial y nunca se pierden
function _detachSession(sess,prevNextDay,reopenTs,keepIds){
  const ts=sess.ts,strength={};
  Object.keys(S.strength||{}).forEach(id=>{
    if(keepIds&&!keepIds.has(id))return;
    const arr=Array.isArray(S.strength[id])?S.strength[id]:[];
    const mine=arr.filter(r=>r&&r.ts===ts);
    if(mine.length)strength[id]=mine.map(r=>({...r}));
    S.strength[id]=arr.filter(r=>!(r&&r.ts===ts));
    if(S.strength[id].length===0)delete S.strength[id];
  });
  S.sessions=(S.sessions||[]).filter(s=>s.ts!==ts);
  S.reopenedSession={session:JSON.parse(JSON.stringify(sess)),strength,reopenTs:reopenTs||Date.now(),prevNextDay:prevNextDay||null};
}
// Devuelve la sesión reabierta al historial tal como estaba (sin duplicar)
function _restoreReopened(){
  const r=getReopened();
  S.reopenedSession=null;
  if(!r)return false;
  const sess=r.session;
  if(!Array.isArray(S.sessions))S.sessions=[];
  if(!S.sessions.some(s=>s&&s.ts===sess.ts))_insertByTs(S.sessions,sess);
  if(!S.strength||typeof S.strength!=='object')S.strength={};
  Object.keys(r.strength||{}).forEach(id=>{
    const recs=r.strength[id];
    if(!Array.isArray(recs))return;
    if(!Array.isArray(S.strength[id]))S.strength[id]=[];
    recs.forEach(rec=>{
      if(rec&&typeof rec==='object'&&!S.strength[id].some(x=>x&&x.ts===rec.ts))_insertByTs(S.strength[id],rec);
    });
    if(!S.strength[id].length)delete S.strength[id];
  });
  // Rotación: si nadie la ha cambiado desde que se reabrió, vuelve a la de antes
  const sk=sessDayKey(sess)||sess.day; // (E1b) su día por su id
  if(S.nextDay===sk&&r.prevNextDay&&getPlan()[r.prevNextDay])S.nextDay=r.prevNextDay;
  // (11) lo que volvió a sustituirse al reabrirla vuelve a ser lo de tu rutina
  revertDaySubs(sk,true);
  return true;
}
// Mantiene coherente la reabierta: datos inválidos → fuera; su día sin series marcadas → vuelve al historial
function _reconcileReopened(){
  if(S.reopenedSession==null)return false;
  if(!getReopened()){S.reopenedSession=null;return false;}
  if(dayMarkCount(sessDayKey(S.reopenedSession.session)||S.reopenedSession.session.day).marks>0)return false; // (E1b)
  return _restoreReopened();
}

function reopenSession(ts){
  const sess=findSession(ts);
  if(!sess){toast('No se encontró la sesión');return;}
  const plan=getPlan();
  const dayKey=sessDayKey(sess); // (E1b) su día por su id, aunque haya cambiado de letra
  if(!sessOfRoutine(sess)){toast('Esa sesión es de otra rutina: puedes verla, pero no reabrirla');return;} // (E2)
  if(!dayKey){toast('Ese día ya no está en tu rutina: no se puede reabrir');return;}
  confirmModal({
    title:'Reabrir sesión',
    body:`Se reabrirá el ${plan[dayKey].label} (${sess.date||''}) para que lo termines. Tus series, pesos y nota se recuperan, y al guardarla conserva su fecha y su duración. Mientras tanto no cuenta en el historial ni en el Coach.`,
    okText:'Reabrir',cancelText:'Cancelar',
    onOk:()=>_reopenSessionConfirmed(sess)
  });
}

function _reopenSessionConfirmed(sess){
  const sessTs=sess.ts, dayKey=sessDayKey(sess)||sess.day, plan=getPlan(); // (E1b) por su id de día
  const dayObj=plan[dayKey];
  if(!dayObj||!Array.isArray(dayObj.ex)){toast('Esa rutina ya no existe — no se puede reabrir');return;}
  // Solo una sesión reabierta a la vez (la otra aún tiene series marcadas sin guardar)
  const prevRs=getReopened();
  if(prevRs&&prevRs.session.ts!==sessTs){toast('Primero guarda o descarta la sesión que ya tienes reabierta');return;}
  // (11) Lo que esa sesión hizo «solo hoy» vuelve a sustituir a su ejercicio de la rutina mientras está reabierta
  const reSubs=_reapplySessSubs(sess,dayKey);
  const validIds=new Set(dayObj.ex.map(e=>e.id));
  // 1. CONSTRUIR la restauración (solo para ejercicios que SIGUEN en el plan) — aún sin aplicar
  const restore={sets:{},logs:{},rpe:{}};
  let droppedCount=0; // ejercicios del snapshot que ya no están en la rutina (se omiten)
  if(sess.snapshot&&typeof sess.snapshot==='object'){
    const snap=sess.snapshot;
    Object.keys(snap.sets||{}).forEach(id=>{if(validIds.has(id))restore.sets[id]={...snap.sets[id]};else droppedCount++;});
    // Copia completa (también los pesos y reps de cada serie, v18)
    Object.keys(snap.logs||{}).forEach(id=>{if(validIds.has(id)&&_isPlainObj(snap.logs[id]))restore.logs[id]=_sanitizeLogEntry(JSON.parse(JSON.stringify(snap.logs[id])));});
    Object.keys(snap.rpe||{}).forEach(id=>{if(validIds.has(id))restore.rpe[id]={...snap.rpe[id]};});
  }else{
    // Sesión antigua sin snapshot: reconstruir desde los registros de fuerza (peso, reps, nº series y, si las
    // guarda, cada serie con su peso, reps y RPE)
    dayObj.ex.forEach(ex=>{
      const rec=(S.strength[ex.id]||[]).find(r=>r.ts===sessTs);
      if(rec){
        restore.logs[ex.id]={w:+rec.v>0?String(rec.v):'',r:rec.r!=null?String(rec.r):''};
        // Por tiempo o distancia: sus segundos o metros (los registros sin peso tienen v 0: no hay peso que poner)
        if(_setNumT(rec.t)!=null)restore.logs[ex.id].t=String(_setNumT(rec.t));
        if(_setNumD(rec.m)!=null)restore.logs[ex.id].d=String(_setNumD(rec.m));
        const ss=Array.isArray(rec.sets)?rec.sets.filter(s=>s&&typeof s==='object').slice(0,SET_MAX_N):[];
        const n=ss.length||rec.setsDone||0;
        restore.sets[ex.id]={};
        for(let i=0;i<n;i++)restore.sets[ex.id][i]=true;
        if(ss.length){
          restore.logs[ex.id].sets=ss.map(_setEntry);
          if(ss.some(s=>s.rpe>=1&&s.rpe<=3)){restore.rpe[ex.id]={};ss.forEach((s,i)=>{if(s.rpe>=1&&s.rpe<=3)restore.rpe[ex.id][i]=Math.round(s.rpe);});}
        }else if(rec.rpe){restore.rpe[ex.id]={};const lvl=Math.round(rec.rpe);for(let i=0;i<n;i++)restore.rpe[ex.id][i]=lvl;}
      }
    });
  }
  // 2. SALVAGUARDA: ¿quedará al menos una serie marcada visible en el plan actual?
  // Si NO (p.ej. todos los ejercicios del día se cambiaron en el editor), abortar SIN destruir la sesión.
  let willHaveMarks=false;
  Object.keys(restore.sets).forEach(id=>{const c=restore.sets[id];if(c)for(const k in c){if(c[k]){willHaveMarks=true;break;}}});
  if(!willHaveMarks){
    reSubs.forEach(id=>revertSub(dayKey,id)); // (11) la rutina queda como estaba
    toast('No se puede reabrir: los ejercicios de esa rutina han cambiado');
    return; // historial y datos intactos
  }
  // 3. Aplicar la restauración (a partir de aquí es seguro)
  Object.keys(restore.sets).forEach(id=>{S.sets[id]={...restore.sets[id]};});
  Object.keys(restore.logs).forEach(id=>{S.logs[id]={...restore.logs[id]};});
  if(Object.keys(restore.rpe).length){if(!S.rpe)S.rpe={};Object.keys(restore.rpe).forEach(id=>{S.rpe[id]={...restore.rpe[id]};});}
  // 4-5. Quitar sus registros de fuerza y la sesión del historial (deja de contar para el Coach hasta re-guardarla).
  //    Se guarda entera en S.reopenedSession: al re-guardarla conserva fecha, nota y duración; si se descarta, vuelve.
  const now=Date.now();
  _detachSession(sess,S.nextDay,now,validIds); // (E1b) solo los registros de lo que sigue en el día
  // 6. Revertir el puntero de rotación y abrir el día
  S.nextDay=dayKey;
  S.day=dayKey;
  S.open=null;
  // 7. Marcar como entreno activo: el cronómetro sigue desde la duración original
  S.sessionStartTs=_reopenStartTs(S.reopenedSession);
  S.activeWorkout={day:dayKey,startTs:now};
  syncActiveWorkout();
  saveState();
  go('workout');
  toast(droppedCount>0
    ? `Sesión reabierta · ${droppedCount} ejercicio${droppedCount!==1?'s':''} ya no en tu rutina, omitido${droppedCount!==1?'s':''}`
    : `Sesión del ${sess.date||''} reabierta — al guardarla conserva su fecha`,droppedCount>0?4000:3000);
}

// ── SEMANA DE DESCANSO — activar / terminar ──
function startRestWeek(){
  if(getActiveRest()){toast('Ya estás en una semana de descanso');return;}
  const d=getActiveDeload();
  confirmModal({
    title:'Semana de descanso',
    body:`7 días sin entrenar. El Coach no penaliza tu constancia y te lo recuerda en Inicio. Puedes terminarla antes cuando quieras.${d?` Tu ${d.kind==='all'?'semana de descarga':'descarga'} termina ahora: ${deloadBackTxt(d)}.`:''}`,
    okText:'Empezar descanso',cancelText:'Cancelar',
    onOk:_beginRestWeek
  });
}
// (13b) Empieza la semana de descanso (Ajustes → «Descarga o descanso»). Si había una descarga, termina antes: no se
// entrena, y al volver el plan ya está con sus series.
function _beginRestWeek(){
  if(getActiveRest()){toast('Ya estás en una semana de descanso');return;}
  if(getActiveWorkout()){toast('Termina o descarta el entreno en curso antes de empezar el descanso');return;}
  const dl0=getActiveDeload(),hadDl=!!dl0,back=hadDl?deloadBackTxt(dl0):'';
  if(hadDl)_restoreDeload(true);
  if(!Array.isArray(S.restWeeks))S.restWeeks=[];
  const now=Date.now();
  S.restWeeks.push({startTs:now,endTs:now+REST_WEEK_MS});
  S.settingsOpen=false;
  saveState();render();
  toast(hadDl?'🌴 Semana de descanso · la descarga termina y '+back:'🌴 Semana de descanso activada',hadDl?4000:3000);
}
function endRestWeek(){
  if(!getActiveRest())return;
  confirmModal({
    title:'Terminar descanso',
    body:'¿Terminar la semana de descanso ahora y volver a entrenar? Los días que ya descansaste no penalizan tu constancia.',
    okText:'Terminar',cancelText:'Seguir descansando',
    onOk:()=>{
      const now=Date.now();
      // Cierra TODOS los descansos activos (por si hubiera solapados): los recién creados (<1h)
      // se eliminan sin registro; el resto se cierran en 'ahora'.
      S.restWeeks=(S.restWeeks||[]).filter(r=>{
        const active=r&&r.startTs!=null&&r.endTs!=null&&r.startTs<=now&&r.endTs>now;
        if(!active)return true;
        if(now-r.startTs<3600000)return false; // recién empezado → descartar
        r.endTs=now; return true;              // cerrar en 'ahora'
      });
      S.settingsOpen=false;
      saveState();render();
      toast('Descanso terminado — ¡a darle! 💪');
    }
  });
}

