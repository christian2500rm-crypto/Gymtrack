// ══════════════════════════════════════════════════════════
// PROPUESTAS DEL COACH — generación y aplicación real
// ══════════════════════════════════════════════════════════
function coach_generateProposals(cycle,an){
  // Todas las candidatas del diagnóstico único, ordenadas por prioridad.
  // reserve:false = las que se muestran (máx. 3 y 1 por día); reserve:true = en reserva.
  an=an||coach_analyze();
  const sel=coach_selectProposals(an.candidates,{fresh:true});
  const res=new Set(sel.reserve.map(p=>p.id));
  return sel.active.concat(sel.reserve).map(p=>({...p,reserve:res.has(p.id)}));
}

function findExInPlan(exId){
  const plan=getPlan();
  for(const dk of Object.keys(plan)){
    const ex=plan[dk].ex.find(e=>e.id===exId);
    if(ex)return ex;
  }
  // (11) un ejercicio de tu rutina sustituido «solo hoy» sigue siendo tuyo: el original (ex.sub.orig, el que vuelve al
  // guardar) es el que cambian el Coach, la descarga y el historial
  for(const dk of Object.keys(plan)){
    const s=(plan[dk].ex||[]).find(e=>e&&e.sub&&e.sub.orig&&e.sub.orig.id===exId);
    if(s)return s.sub.orig;
  }
  return null;
}

// Aplicar / ignorar por id ESTABLE (nunca por índice) y repintar siempre: el siguiente toque actúa sobre
// la propuesta que ves. Los botones llevan el id en data-pid (escapado), no dentro del JS del onclick.
function applyProposal(id){
  const list=S.pendingCoachProposals||[];
  const i=list.findIndex(p=>p&&p.id===id);
  if(i<0){render();return;}
  const p=list[i];
  if(_proposalBlocked(p)){
    toast(getActiveDeload().kind==='all'?'Durante la descarga no se cambia el plan · aplícala al terminar':'Espera a que termine la descarga en curso para aplicar esta');
    render();return;
  }
  const pv=coach_pendingView();
  if(!pv.active.some(x=>x.id===id)){toast('Esa propuesta está en reserva');render();return;}
  const r=_applyProposalByData(p);
  if(!r.ok){
    if(r.drop){list.splice(i,1);saveState();}
    toast(r.msg||'No se pudo aplicar');render();return;
  }
  list.splice(i,1);
  if(!Array.isArray(S.appliedProposals))S.appliedProposals=[];
  const rec={...p,dayKey:p.type==='deload'?null:(p.dayKey||r.dayKey||null),appliedAt:Date.now()};
  if(r.dlId)rec.dlId=r.dlId;
  S.appliedProposals.push(rec);
  if(S.appliedProposals.length>60)S.appliedProposals=S.appliedProposals.slice(-60);
  saveState();
  toast(r.msg||`✓ Aplicado: ${p.title}`,3200);
  render();
}

function ignoreProposal(id){
  const list=S.pendingCoachProposals||[];
  const i=list.findIndex(p=>p&&p.id===id);
  if(i>=0){list.splice(i,1);saveState();toast('Propuesta ignorada · tu plan no cambia');}
  render();
}

// Aplica una propuesta guardada. Devuelve {ok, msg, dlId?, dayKey?, drop?}.
// «Semana de descarga» y «Descarga en X» (antes «Reducir volumen») son TEMPORALES (S.deload): guardan las series y vuelven solas.
function _applyProposalByData(p){
  const plan=getPlan();
  // (11) Con un ejercicio cambiado «solo hoy», lo que toca a ese ejercicio (o una descarga de todo el plan) espera a
  // que guardes o descartes el entreno: entonces vuelve el original y se aplica sobre él. La propuesta no se pierde.
  if(p.type==='deload'?_hasSubs():(p.exId&&(_subSlot(p.exId)||_subOfOrig(p.exId))))
    return{ok:false,msg:'Hoy tienes un ejercicio cambiado «solo hoy»: aplícala cuando guardes el entreno'};
  const gone={ok:false,drop:true,msg:'Ese ejercicio ya no está en tu rutina'};
  const ex=p.exId?findExInPlan(p.exId):null;
  if(p.type==='add_set'){
    if(!ex)return gone;
    ex.s=Math.min(6,(parseInt(ex.s)||3)+1);
  }else if(p.type==='rm_set'){
    if(!ex)return gone;
    // Con sus series a medias, la sesión se guardaría recortada y marcada como descarga
    if(S.sets[ex.id]&&Object.values(S.sets[ex.id]).some(Boolean))return{ok:false,msg:'Termina o descarta el entreno en curso antes de reducir este ejercicio'};
    const d=startDeload('ex',[ex.id],p.title);
    if(!d)return{ok:false,drop:true,msg:'Ese ejercicio ya tiene el mínimo de series'};
    return{ok:true,dlId:d.id,dayKey:_dayOfEx(ex.id),msg:deloadStartTxt(d)};
  }else if(p.type==='rep_scheme'){
    if(!ex)return gone;
    // Cambiar el esquema de reps solo vale con peso × reps (una plancha o unas flexiones no pasan a «8»)
    if(exLT(ex)!=='w')return{ok:false,drop:true,msg:'Esa propuesta ya no aplica a este ejercicio'};
    if(p.to){ex.s=p.to.s;ex.r=p.to.r;}
    else{ex.s=Math.min(6,(parseInt(ex.s)||3)+1);ex.r=8;} // propuestas de la versión anterior
  }else if(p.type==='cardio_min'){ // (E16d) minutos del cardio final
    if(!ex)return gone;
    if(!(ex.cardio||exLT(ex)==='c')||!p.to||!p.to.min)return{ok:false,drop:true,msg:'Esa propuesta ya no aplica a este ejercicio'};
    ex.r=p.to.min+' min';
  }else if(p.type==='deload'){
    return beginFullDeload(); // (13b) la misma que Ajustes → «Descarga o descanso»
  }else if(p.type==='swap'){
    if(!ex)return gone;
    const lib=LIB_BY_ID.get(p.libExId);
    if(!lib||lib.cardio)return{ok:false,drop:true,msg:'Ese ejercicio ya no está en la biblioteca'};
    if(S.sets[ex.id]&&Object.values(S.sets[ex.id]).some(Boolean))return{ok:false,msg:'Termina o descarta el entreno en curso antes de cambiar este ejercicio'};
    const dk=_dayOfEx(ex.id),day=plan[dk],idx=day.ex.indexOf(ex);
    // (13b) como el editor: si el nuevo ya tiene historial propio (estuvo en tu rutina o lo hiciste «solo hoy»), sigue con él
    const hk=_libHistKey(lib.id),own=!!hk&&!_planIdTaken(hk)&&Array.isArray(S.strength[hk])&&S.strength[hk].length>0;
    const nx=_carryTarget(ex,own?_libCopy(lib,hk):libExToEx(lib)); // tus series y reps (si se miden igual)
    const kept=Array.isArray(S.strength[ex.id])&&S.strength[ex.id].length>0;
    _stampExName(ex); // Progreso lo sigue mostrando con su nombre, en «Fuera»
    day.ex[idx]=nx; // el historial del anterior se queda con su id
    _deloadFollowSwap(ex.id,nx,dk); // (13a) en descarga: al terminar, el nuevo vuelve a tus series de verdad
    delete S.sets[ex.id];delete S.logs[ex.id];
    if(S.open===ex.id)S.open=null;
    saveState();
    return{ok:true,dayKey:dk,msg:`✓ ${day.label}: ${ex.n} → ${nx.n}${kept?` · el historial de ${ex.n} sigue en Progreso («Fuera»)`:''}`};
  }else if(p.type==='add_ex'){
    const lib=LIB_BY_ID.get(p.libExId);
    if(!lib||!p.dayKey||!plan[p.dayKey])return{ok:false,drop:true,msg:'Esa propuesta ya no se puede aplicar'};
    if(_planLibIds().has(lib.id))return{ok:false,drop:true,msg:`${lib.n} ya está en tu rutina`};
    const arr=plan[p.dayKey].ex,nx=libExToEx(lib);
    if(p.basis==='power'){let i=0;while(i<arr.length&&arr[i]&&(arr[i].cardio||(exLib(arr[i])||{}).pat==='bal'))i++;arr.splice(i,0,nx);} // (E14a) al empezar, tras el calentamiento y el equilibrio
    else if(arr.length&&arr[arr.length-1].cardio)arr.splice(arr.length-1,0,nx);else arr.push(nx);
  }else{
    return{ok:false,drop:true,msg:'Propuesta desconocida'};
  }
  saveState();
  return{ok:true,dayKey:ex?_dayOfEx(ex.id):p.dayKey||null};
}

function renderRoutineEditor(opts){
  const root=document.getElementById('settings-root');
  if(!root)return;
  _routineEdOpen=true;
  // Conservar el scroll de la hoja entre repintados (salvo al cambiar de día)
  const prevSheet=root.querySelector('.hist-sheet');
  const keepScroll=prevSheet&&!(opts&&opts.top)?prevSheet.scrollTop:0;
  const plan=getPlan();
  _editDay=_editDayOr(_editDay); // (E1a)
  const day=plan[_editDay];
  // El maniquí del volumen planificado se conserva entre repintados (solo cambian sus pesos)
  const keepMM=mmDetach(root);
  const exItems=day.ex.map((slot,i)=>{
    // (11) La rutina: si hoy está sustituido «solo hoy», se edita el original y se avisa del sustituto
    const ex=routineEx(slot),sub=slot!==ex?slot:null;
    const isCardio=!!ex.cardio;
    return`<div class="edit-ex-item" data-idx="${i}" id="edi_${i}">
      <div class="drag-handle" aria-label="Arrastrar">⠿</div>
      <div class="edit-ex-ic exic" aria-hidden="true">${exIconHtml(ex)}</div>
      <div class="edit-ex-info">
        <div class="edit-ex-name">${esc(ex.n)}</div>
        <div class="edit-ex-meta">${_nwX(esc(_edMetaTxt(ex)))}</div>
        ${sub?`<div class="edit-ex-sub">⇄ Hoy: ${esc(sub.n)} · solo hoy</div>`:''}
        ${!isCardio?_srEditorHtml(ex,i):''}
      </div>
      <div class="edit-ex-actions">
        <button class="edit-ex-btn" onclick="swapExerciseUI('${_editDay}',${i})" title="Cambiar" aria-label="Cambiar ejercicio">⇄</button>
        <button class="edit-ex-btn danger" onclick="removeExercise('${_editDay}',${i})" title="Eliminar" aria-label="Eliminar">✕</button>
      </div>
    </div>`;
  }).join('');

  root.innerHTML=`<div class="hist-over" onclick="if(event.target===this)closeRoutineEditor()"><div class="hist-sheet" id="routine-ed" role="dialog" aria-label="Editar rutina" style="max-height:92vh;max-height:92dvh">
    <div class="hist-sheet-head">
      <div class="hist-sheet-hdl"></div>
      <div class="hist-sheet-title">Editar rutina</div>
      <div class="hist-sheet-sub">⇄ cambiar · ✕ eliminar · ⠿ reordenar</div>
      <button class="hist-sheet-close" onclick="closeRoutineEditor()" aria-label="Cerrar">✕</button>
    </div>
    <div class="hist-sheet-body" style="padding:12px 0 24px">
      ${mmPlanBlockHtml()}
      <div class="edit-day-tab">
        ${dayTabsHtml(plan,_editDay,'edit-day-btn','editorSetDay')}
      </div>
      ${(()=>{ // (E1b) el día abierto: su nombre (se cambia con «Nombre») y, si está vacío, lo que eso supone
        const f=String(day.focus==null?'':day.focus).trim(),dl=esc(dayLabel(_editDay,plan));
        return`<div class="ed-day"><div class="ed-day-i"><b>${dl}</b><span>${f?esc(f):'Sin nombre'}</span></div>
          <button type="button" class="ed-day-b" data-dk="${esc(_editDay)}" onclick="renameDayUI(this.dataset.dk)" aria-label="Cambiar el nombre del ${dl}">✎ Nombre</button></div>
          ${day.ex.length?'':`<p class="ed-empty">Este día está vacío: añade sus ejercicios. Mientras esté vacío, no entra en tu rotación.</p>`}`;})()}
      ${exItems}
      <button class="edit-add-btn" onclick="addExerciseUI('${_editDay}')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Añadir ejercicio
      </button>
      ${(()=>{ // (E1b) acciones del día abierto y de los días de la rutina (2-6)
        const K=dayKeys(plan),dl=esc(dayLabel(_editDay,plan)),n=K.length;
        return`<div class="ed-acts">
          <button type="button" class="btn bs" data-dk="${esc(_editDay)}" onclick="emptyDayUI(this.dataset.dk)"${day.ex.length?'':' disabled'}>Vaciar este día</button>
          <button type="button" class="btn bs" data-dk="${esc(_editDay)}" onclick="removeDayUI(this.dataset.dk)"${n<=2?' disabled':''} aria-label="Quitar el ${dl}">Quitar día</button>
        </div>
        <div class="ed-days">
          <div class="ed-days-h">Tus días <span>${plural(n,'día')} de 6</span></div>
          <button type="button" class="btn bs" onclick="addDayUI()"${n>=6?' disabled':''}>${n>=6?'Ya tienes 6 días: es el máximo':`＋ Añadir día (Día ${DAY_KEYS[n]})`}</button>
          <button type="button" class="btn bs" onclick="startFromScratchUI()">Empezar de cero</button>
          <button type="button" class="btn bs" onclick="resetPlanToDefault()">Volver a la rutina de ejemplo</button>
          <p class="ed-days-n">Tu historial nunca se borra: lo que quites sigue en Progreso.</p>
        </div>`;})()}
    </div>
  </div></div>`;
  mmMountAll(root,keepMM);
  thumbsIn(root); // (11) miniaturas 3D de los ejercicios
  if(keepScroll){const sh=root.querySelector('.hist-sheet');if(sh)sh.scrollTop=keepScroll;}
  initDragDrop(_editDay);
}

function render(){
  const s=document.getElementById('screen');
  if(!s)return;
  // Descarga caducada: el plan vuelve a sus series antes de pintar
  try{deloadTick();}catch(e){console.error(e);}
  // (11) Sustituciones «solo hoy» que ya no tienen entreno (o con mala forma): vuelve el original
  try{subTick();}catch(e){console.error(e);}
  // Preservar posición de scroll entre renders (evita el "salto al inicio" al marcar series)
  const prevScroll=_scrollTo&&Date.now()-_scrollTo.ts<700?_scrollTo.top:s.scrollTop,scrollSeq=_scrollReq;
  const keepMM=mmDetach(s); // mapas musculares en pantalla: se reutilizan tras repintar
  try{animDetach(s);}catch(e){console.error(e);} // animaciones de ejercicio: mismo canvas (giro/pausa) tras repintar
  try{hoyDetach(s);}catch(e){console.error(e);} // (10) vista previa 3D de «HOY TOCA»: mismo canvas tras repintar
  if(S.tab==='dash')s.innerHTML=renderDash();
  else if(S.tab==='workout')s.innerHTML=renderWorkout();
  else if(S.tab==='coach')s.innerHTML=renderCoach();
  else s.innerHTML=renderProg();
  try{animAttach(s);}catch(e){console.error(e);}
  try{hoyAttach(s);}catch(e){console.error(e);}
  // Montar animaciones de ejercicio (canvas) presentes en la pantalla (las reutilizadas se reactivan)
  if(typeof GymAnim!=='undefined'){try{GymAnim.mountAll(s);}catch(e){}}
  try{animHoldSync();}catch(e){console.error(e);} // repintado con una hoja abierta: las nuevas también quietas
  thumbsIn(s); // (11) miniaturas 3D (iconos de las tarjetas): las de caché al momento, el resto en tiempo libre
  try{mmMountAll(s,keepMM);}catch(e){console.error(e);}
  try{renderNextBar();}catch(e){console.error(e);}
  // Restaurar scroll (ya y en el siguiente frame, por si el DOM aún no estaba listo), salvo que después de repintar se
  // haya pedido otro desplazamiento (avance automático, filas a la vista…)
  if(prevScroll>0){s.scrollTop=prevScroll;requestAnimationFrame(()=>{if(_scrollReq===scrollSeq)s.scrollTop=prevScroll;});}
  renderSettings();
  renderWmodal();
  renderHist();
  renderWDetail();
  renderMuscleSheet();
  try{renderSummary();}catch(e){console.error(e);} // (09) resumen de sesión abierto: se cierra si su sesión ya no está
  // (08) Modo descanso a pantalla completa (si está abierto) y pantalla encendida durante el entreno
  try{RF.render();}catch(e){console.error(e);}
  try{WL.sync();}catch(e){}
}

