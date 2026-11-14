// ══════════════════════════════════════════════════════════
// EDITOR DE RUTINA — funciones completas
// ══════════════════════════════════════════════════════════
let _editDay='A'; // día activo en el editor
// El editor comparte #settings-root con Ajustes. Mientras está abierto (_routineEdOpen), render() -> renderSettings()
// lo repinta EN SU SITIO (con su scroll) en vez de vaciar el contenedor: así se encadenan varios cambios seguidos.
let _routineEdOpen=false;
let _edDragging=false; // arrastre en curso: no repintar el editor a mitad del gesto

// (E1a) Día con el que abre el editor: el que se pide si existe; si no, el que toca; si no, el primero de la rutina
function _editDayOr(d){const p=getPlan();return _isPlanDay(p[d])?d:_isPlanDay(p[S.nextDay])?S.nextDay:(dayKeys(p)[0]||'A');}
// (E1b) dk: el día con el que abre (por defecto, el que toca)
function openRoutineEditor(dk){
  _editDay=_editDayOr(typeof dk==='string'?dk:S.nextDay);
  S.settingsOpen=false;
  _routineEdOpen=true;
  document.getElementById('settings-root').innerHTML='';
  renderRoutineEditor();
}

function closeRoutineEditor(){
  _routineEdOpen=false;
  _edDragging=false;
  const root=document.getElementById('settings-root');
  mmUnmountIn(root);
  if(root)root.innerHTML='';
}
// Cambiar de día en el editor: la lista nueva empieza arriba
function editorSetDay(d){
  if(!_isPlanDay(getPlan()[d]))return;
  _editDay=d;
  renderRoutineEditor({top:true});
}

function editExSeries(dayKey,idx,delta){
  const ex=routineEx(getPlan()[dayKey].ex[idx]); // (11) la rutina: el original si hoy está sustituido
  if(!ex)return;
  const nv=Math.max(1,Math.min(6,(ex.s||3)+delta));
  ex.s=nv;
  saveState();
  const el=document.getElementById('srv_'+idx);
  if(el)el.textContent=nv;
  // Actualizar el meta text
  const meta=document.querySelector(`#edi_${idx} .edit-ex-meta`);
  if(meta)meta.innerHTML=_nwX(esc(_edMetaTxt(ex)));
  mmPlanRefresh(); // el volumen planificado de la cabecera cambia al momento
}

// Reps del plan (1-30). Por tiempo, segundos (−/+ 5 s; de 15 en 15 desde 2 min; de 5 s a 10 min) y por distancia, metros
// (−/+ 5, 10, 50 o 100 m; de 5 m a 5 km): se guardan como «35s» / «40m», lo que leen el Coach y las tarjetas.
function editExReps(dayKey,idx,delta){
  const ex=routineEx(getPlan()[dayKey].ex[idx]);
  if(!ex||ex.cardio)return;
  const lt=exLT(ex);
  let nv;
  if(lt==='t'||lt==='d'){
    const t=lt==='t',cur=(t?_tgtSecs(ex):_tgtMetres(ex))||(t?30:20),st=(t?_tStep:_dStep)(delta>0?cur:Math.max(1,cur-1));
    const v=Math.max(5,Math.min(t?600:5000,cur+delta*st));
    ex.r=v+(t?'s':'m');nv=t?fmtSecs(v):fmtM(v);
  }else{
    const cur=parseInt(ex.r)||12;
    nv=Math.max(1,Math.min(30,cur+delta));
    ex.r=nv;
  }
  saveState();
  const el=document.getElementById('rpv_'+idx);
  if(el)el.textContent=nv;
  const meta=document.querySelector(`#edi_${idx} .edit-ex-meta`);
  if(meta)meta.innerHTML=_nwX(esc(_edMetaTxt(ex)));
}
// Texto de un ejercicio en el editor: «Smith · 3 series × 12 reps · rango 10-12». El rango es el que usa el Coach de
// carga (el de las tarjetas de Entreno); solo se añade si el plan tiene un número de reps, no un rango ya escrito.
// Por tiempo «Peso corporal · 3 series × 45 s», por distancia «… × 30 m»; con banda, «… × 15 reps · banda». El rango sin
// peso es el del Coach sin kilos (12 → 12-15).
function _edMetaTxt(ex){
  if(!ex)return'';
  if(ex.cardio)return`${ex.eq} · ${ex.s} × ${ex.r}`;
  const lt=exLT(ex);
  if(lt==='t'&&_tgtSecs(ex))return`${ex.eq} · ${_nSeries(ex.s)} × ${fmtSecs(_tgtSecs(ex))}`;
  if(lt==='d'&&_tgtMetres(ex))return`${ex.eq} · ${_nSeries(ex.s)} × ${fmtM(_tgtMetres(ex))}`;
  const rr=targetRepsNum(ex)!=null?(lt==='w'?repRange(ex):_repRangeBW(ex)):null;
  return`${ex.eq} · ${_nSeries(ex.s)} × ${ex.r} reps${rr&&rr.lo!==rr.hi?` · rango ${rr.lo}-${rr.hi}`:''}${lt==='r'&&loadEqClass(ex)==='banda'?' · banda':''}`;
}
// −/+ de series y de reps (o segundos, o metros) de un ejercicio en el editor
function _srEditorHtml(ex,i){
  const lt=exLT(ex),t=lt==='t',d=lt==='d',w=t?'segundos':d?'metros':'reps';
  const val=t&&_tgtSecs(ex)?fmtSecs(_tgtSecs(ex)):d&&_tgtMetres(ex)?fmtM(_tgtMetres(ex)):ex.r;
  return`<div class="sr-editor"><span class="sr-g">
          <span class="sr-label">Series</span>
          <button class="sr-btn" aria-label="Una serie menos: ${esc(ex.n)}" onclick="editExSeries('${_editDay}',${i},-1)">−</button>
          <span class="sr-val" id="srv_${i}">${esc(ex.s)}</span>
          <button class="sr-btn" aria-label="Una serie más: ${esc(ex.n)}" onclick="editExSeries('${_editDay}',${i},1)">+</button>
        </span><span class="sr-g">
          <span class="sr-label">${t?'Seg':d?'Metros':'Reps'}</span>
          <button class="sr-btn" aria-label="Menos ${w}: ${esc(ex.n)}" onclick="editExReps('${_editDay}',${i},-1)">−</button>
          <span class="sr-val" id="rpv_${i}">${esc(val)}</span>
          <button class="sr-btn" aria-label="Más ${w}: ${esc(ex.n)}" onclick="editExReps('${_editDay}',${i},1)">+</button>
        </span></div>`;
}

function removeExercise(dayKey,idx){
  const plan=getPlan();
  const slot=plan[dayKey].ex[idx],ex=routineEx(slot);
  if(!ex)return;
  confirmModal({
    title:'Eliminar ejercicio',
    body:`¿Eliminar "${ex.n}" del ${plan[dayKey].label}? Los datos históricos se conservan.`,
    okText:'Eliminar',cancelText:'Cancelar',danger:true,
    onOk:()=>{
      _stampExName(ex);if(slot!==ex)_stampExName(slot); // (11) y su sustituto de hoy, si lo tiene
      const i=plan[dayKey].ex.indexOf(slot);if(i>=0)plan[dayKey].ex.splice(i,1);
      const dl0=getActiveDeload(),dl=_deloadDropEx(ex.id); // (13a) su cambio de la descarga se va con él
      saveState();
      toast(dl==='end'?'Ejercicio eliminado · era el último en descarga: '+deloadBackTxt(dl0):'Ejercicio eliminado');
      render(); // repinta la app y el editor, que sigue abierto
    }
  });
}

function swapExerciseUI(dayKey,idx){
  const slot=getPlan()[dayKey].ex[idx],ex=routineEx(slot);
  if(!ex)return;
  showExercisePicker({
    title:`Cambiar «${ex.n}»`,
    muscle:ex.muscle||null,
    currentLib:_libIdOf(ex),
    mode:'swap',dayKey,
    onPick:(libEx)=>_routineSwapTo(dayKey,slot,libEx,{keepToday:true}),
    refocus:()=>document.querySelector(`#edi_${idx} .edit-ex-btn`)||document.querySelector('#routine-ed .hist-sheet-close') // el ⇄ de su fila, ya repintada
  });
}
// Cambia un ejercicio de la rutina por otro de la biblioteca (editor y «Cambiar en la rutina» de la hoja «¿Máquina
// ocupada?»). Conserva series y reps. (11) Si el nuevo ya tiene historial propio (sus «Solo hoy» o un ejercicio que
// estuvo en tu rutina), sigue con él y el anterior conserva el suyo; si no, se pregunta si trasladar el del anterior.
// keepToday: en el editor, un hueco sustituido «solo hoy» mantiene hoy su sustituto (cambia la rutina de detrás).
function _routineSwapTo(dayKey,slot,libEx,o){
  o=o||{};
  const plan=getPlan(),day=plan[dayKey];
  if(!day||!Array.isArray(day.ex)||day.ex.indexOf(slot)<0||!libEx){toast('Ese ejercicio ya no está en tu rutina');render();return;}
  const ex=routineEx(slot),isSub=slot!==ex;
  const place=newEx=>{
    const i=day.ex.indexOf(slot);if(i<0)return false;
    _stampExName(ex); // si su historial se queda con el id anterior, conserva el nombre
    if(isSub&&o.keepToday&&newEx.id!==slot.id)slot.sub.orig=newEx; // hoy sigue el sustituto; al guardar vuelve el nuevo
    else{
      if(isSub&&newEx.id!==slot.id)_clearExState(slot.id); // el sustituto de hoy (sin series) se va
      day.ex[i]=newEx;
      if(S.open===slot.id)S.open=newEx.id;
    }
    _deloadFollowSwap(ex.id,newEx,dayKey); // (13a) en descarga: al terminar, el nuevo vuelve a tus series de verdad
    return true;
  };
  const done=(newEx,msg)=>{saveState();toast(msg||`Cambiado a ${newEx.n}`);if(o.after)o.after(newEx);render();}; // repinta la app y el editor, que sigue abierto
  const keepR=n=>{if(o.noCarryR&&!n.cardio)n.r=libEx.r;return n;};
  const mk=id=>keepR(_carryTarget(ex,_libCopy(libEx,id)));
  // Hoy ya lo haces como sustituto: pasa a la rutina con el mismo id (sus series de hoy y su historial siguen)
  if(isSub&&slot.lib===libEx.id){const n=mk(slot.id);delete n.sub;if(place(n))done(n);return;}
  const hk=_libHistKey(libEx.id),own=!!hk&&!_planIdTaken(hk)&&Array.isArray(S.strength[hk])&&S.strength[hk].length>0;
  if(own){const n=mk(hk);if(place(n))done(n);return;}
  {
    // Conservar series/reps personalizadas (si se miden igual)
    const newEx=keepR(_carryTarget(ex,libExToEx(libEx)));
      // Si hay histórico, preguntar si migrar
      const oldHist=S.strength[ex.id];
      const doSwap=msg=>{if(place(newEx))done(newEx,msg);};
      const sameFam=_histFam(exLT(ex))===_histFam(exLT(newEx));
      if(oldHist&&oldHist.length>0&&!sameFam&&!o.noHist){
        // Se miden distinto (plancha por tiempo → crunch con kilos): el historial se queda con el anterior, sin preguntar
        doSwap(`Cambiado a ${newEx.n} · el historial se queda con ${ex.n}: se mide distinto`);
      }else if(oldHist&&oldHist.length>0&&!o.noHist){
        // Tres opciones reales: trasladar / no trasladar / cancelar todo
        // Usamos un confirmModal personalizado de 3 botones inline
        const root=document.getElementById('cmodal-root');
        const cancelAll=()=>{root.innerHTML='';toast('Cambio cancelado');};
        const keepHist=()=>{root.innerHTML='';S.strength[newEx.id]=oldHist.slice();delete S.strength[ex.id];doSwap();};
        const dropHist=()=>{root.innerHTML='';doSwap();};
        root.innerHTML=`<div class="cmov" onclick="if(event.target===this)window._swapCancel&&window._swapCancel()"><div class="cmod">
          <div class="cmod-hdl"></div>
          <div class="cmod-t">Trasladar historial</div>
          <div class="cmod-b">El ejercicio anterior tiene ${oldHist.length} registro${oldHist.length!==1?'s':''}. ¿Qué quieres hacer?</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <button class="btn bp" onclick="window._swapKeep()">Trasladar al nuevo ejercicio</button>
            <button class="btn bs" onclick="window._swapDrop()">No, es distinto (conservar antiguo)</button>
            <button class="btn bs" onclick="window._swapCancel()" style="color:var(--text3)">Cancelar cambio</button>
          </div>
        </div></div>`;
        window._swapKeep=keepHist;
        window._swapDrop=dropHist;
        window._swapCancel=cancelAll;
      }else{
        doSwap();
      }
  }
}

function addExerciseUI(dayKey,muscle,sub){
  if(!_isPlanDay(getPlan()[dayKey]))return; // (E1a) ese día ya no existe
  showExercisePicker({
    title:`Añadir al ${dayLabel(dayKey)}`,
    muscle:MUSCLE_GROUPS.some(m=>m.id===muscle)?muscle:null,sub, // desde el mapa muscular: en esa zona y subzona
    mode:'add',dayKey,
    refocus:()=>document.querySelector('#routine-ed .edit-add-btn')||document.querySelector('#routine-ed .hist-sheet-close'), // el editor ya repintado
    onPick:(libEx)=>{
      // (11) si ya tiene historial propio (sus «Solo hoy» o de cuando estuvo en tu rutina), sigue con él
      const hk=_libHistKey(libEx.id),own=!!hk&&!_planIdTaken(hk)&&Array.isArray(S.strength[hk])&&S.strength[hk].length>0;
      const newEx=own?_libCopy(libEx,hk):libExToEx(libEx);
      const plan=getPlan();
      if(!_isPlanDay(plan[dayKey])){toast('Ese día ya no está en tu rutina');render();return;} // (E1a)
      // Si el último es cardio, insertar antes del cardio final
      const ex=plan[dayKey].ex;
      if(ex.length>0&&ex[ex.length-1].cardio){
        ex.splice(ex.length-1,0,newEx);
      }else{
        ex.push(newEx);
      }
      saveState();
      toast(`${newEx.n} añadido`);
      render(); // repinta la app y el editor, que sigue abierto
    }
  });
}

// «Volver a la rutina de ejemplo» (antes «Restaurar plan original»). (E1b) Como cualquier cambio de estructura: no con un
// entreno a medias ni con una sesión reabierta; antes, los nombres apuntados en las sesiones y en el historial de cada
// ejercicio, los «solo hoy» devueltos, la descarga terminada y las propuestas del Coach fuera (eran de la rutina de antes).
function resetPlanToDefault(){
  if(_dayEditBlocked())return;
  confirmModal({
    title:'Volver a la rutina de ejemplo',
    body:'Tu rutina pasa a ser la de ejemplo (3 días: piernas, empuje y tirón). Los cambios que le hiciste se pierden; tu historial y tus pesos se conservan en Progreso.',
    okText:'Volver a la de ejemplo',cancelText:'Cancelar',danger:true,
    onOk:()=>{
      if(_dayEditBlocked())return;
      const pre=_planPrevSnap('ejemplo');_closeCycleQuiet(); // (E5) se puede volver a la de antes; el ciclo se cierra en silencio
      _replacePlan(JSON.parse(JSON.stringify(PLAN)));S.planPrev=pre;
      saveState();
      toast('Tu rutina es ahora la de ejemplo');
      render(); // repinta la app y el editor, que sigue abierto
    }
  });
}

// ══════════════════════════════════════════════════════════
// (E1b) DÍAS DE LA RUTINA EN EL EDITOR: añadir, quitar, cambiar el nombre, vaciar y empezar de cero (2-6 días)
// ══════════════════════════════════════════════════════════
// Quitar o vaciar un día, empezar de cero y volver a la rutina de ejemplo cambian la estructura: no se hacen con un entreno
// a medias ni con una sesión reabierta (sus series son de ese día), y antes apuntan los nombres en las sesiones.
function _dayEditBlocked(){
  if(getActiveWorkout()){toast('Termina o descarta el entreno de hoy antes de cambiar los días de tu rutina',3600);return true;}
  if(getReopened()){toast('Guarda primero la sesión que tienes reabierta',3200);return true;}
  return false;
}
// La rutina generada (cuando exista) sabe que la has tocado
function _markPlanEdited(){if(_isPlainObj(S.planMeta))S.planMeta.edited=true;}
// Un día sale de tu rutina (o se queda vacío): sus «solo hoy» vuelven, cada ejercicio deja su nombre en su historial y su
// cambio de la descarga, y sus propuestas del Coach se van. Devuelve 'end' si con eso terminó la descarga.
function _dayClearRefs(dk){
  const d=getPlan()[dk];if(!_isPlanDay(d))return null;
  revertDaySubs(dk);
  let end=null;const ids=new Set();
  d.ex.forEach(e=>{const ex=routineEx(e);if(!_isPlainObj(ex))return;ids.add(ex.id);_stampExName(ex);if(_deloadDropEx(ex.id)==='end')end='end';});
  S.pendingCoachProposals=(S.pendingCoachProposals||[]).filter(p=>!(p&&(p.dayKey===dk||ids.has(p.exId))));
  return end;
}
// Sustituye la rutina entera (empezar de cero, volver a la de ejemplo): todo lo que colgaba de la de antes se cierra
function _replacePlan(np){
  stampSessionsLbl();
  dayKeys().forEach(k=>{revertDaySubs(k);(getPlan()[k].ex||[]).forEach(e=>_stampExName(routineEx(e)));});
  if(S.deload)_restoreDeload(true); // la descarga iba con la rutina anterior
  S.pendingCoachProposals=[];
  if(S.planMeta!=null)S.planMeta=null; // ya no es una rutina generada
  S.currentPlan=_sanitizePlanKeys(np); // con sus ids de día, nuevos: no se comparan con los de la rutina de antes
  if(!_dayLive(S.currentPlan[S.nextDay]))S.nextDay=getNextDay(null);
  if(!_isPlanDay(S.currentPlan[S.day]))S.day=S.nextDay;
  try{_editDay=_editDayOr(_editDay);}catch(e){}
}
// Añadir día: hasta 6, vacío (no entra en la rotación hasta tener ejercicios) y abierto en el editor
function addDayUI(){
  const p=getPlan(),K=dayKeys(p);
  if(K.length>=DAY_KEYS.length){toast('Tu rutina ya tiene 6 días: es el máximo');return;}
  const k=DAY_KEYS[K.length];
  p[k]={label:'Día '+k,focus:'Día nuevo',did:newDayId(p),ex:[]};
  _markPlanEdited();saveState();
  _editDay=k;
  toast(`Día ${k} añadido: ponle ejercicios. Mientras esté vacío, no entra en tu rotación`,3600);
  if(_routineEdOpen)renderRoutineEditor({top:true});render();
}
// Quitar día: como mínimo quedan 2. Las letras siguientes se corren (D → C) y las sesiones siguen a su día por su id.
function removeDayUI(dk){
  const p=getPlan(),K=dayKeys(p);if(!_isPlanDay(p[dk]))return;
  if(K.length<=2){toast('Tu rutina necesita al menos 2 días');return;}
  if(_dayEditBlocked())return;
  const lb=dayLabel(dk,p),last=K[K.length-1]===dk;
  confirmModal({title:`¿Quitar el ${lb}?`,
    body:`Sus ejercicios salen de tu rutina; tu historial se conserva en Progreso.${last?'':' Los días que van detrás cambian de letra.'}`,
    okText:'Quitar día',cancelText:'Cancelar',danger:true,
    onOk:()=>{
      if(_dayEditBlocked())return;
      const P=getPlan(),KK=dayKeys(P);if(!_isPlanDay(P[dk])||KK.length<=2)return;
      stampSessionsLbl();
      const end=_dayClearRefs(dk);
      // El que toca: si era este, el siguiente con ejercicios (sin contar este)
      const wasNext=S.nextDay===dk;let next=S.nextDay;
      if(wasNext){P[dk].ex=[];next=getNextDay(dk,P);if(next===dk)next=null;}
      S.nextDay=next;if(S.day===dk)S.day=next;
      // el editor se queda en el día que ocupa su sitio (o en el anterior si era el último)
      if(_editDay===dk){const j=KK.indexOf(dk);_editDay=KK[j+1]||KK[j-1];}
      const map={};let i=0;KK.forEach(k=>{if(k!==dk)map[k]=DAY_KEYS[i++];});
      _reletter(map);
      _markPlanEdited();saveState();
      toast(`${lb} quitado${wasNext?` · Hoy toca el ${dayLabel(hoyDayKey())}`:''}${end?' · Tu descarga ha terminado':''}`,3600);
      if(_routineEdOpen)renderRoutineEditor({top:true});render();
    }});
}
// ── (P8, repaso del reparto) Mover un día antes o después en tu rutina: cambia el orden de la semana (las letras), no los ejercicios. El
// historial va con cada ejercicio y las sesiones ya hechas conservan su nombre (stampSessionsLbl). Con «Ganar fuerza» en dos sitios el
// orden lo marcan los sitios (planMeta.seq) y no se ofrece. Si el orden nuevo deja la misma zona dos días seguidos, se avisa ──
function _dayMoveFixed(){return _isPlainObj(S.planMeta)&&Array.isArray(S.planMeta.seq)&&S.planMeta.seq.length>0;}
function _planZonasDias(p){return dayKeys(p).map(k=>_zonasDe((p[k].ex||[]).map(e=>{const L=LIB_K&&LIB_K.BY.get(_libIdOf(e));return L?L.pat:'';})));}
function dayMoveHtml(plan,dk){
  const K=dayKeys(plan),i=K.indexOf(dk);if(K.length<2||i<0||_dayMoveFixed())return'';const dl=esc(dayLabel(dk,plan));
  return`<div class="ed-move" role="group" aria-label="Mover el ${dl}"><span>Mover el ${dl}</span><button type="button" class="btn bs" data-dk="${esc(dk)}" onclick="moveDayUI(this.dataset.dk,-1)" aria-label="Mover el ${dl} antes"${i===0?' disabled':''}>‹ Antes</button><button type="button" class="btn bs" data-dk="${esc(dk)}" onclick="moveDayUI(this.dataset.dk,1)" aria-label="Mover el ${dl} después"${i===K.length-1?' disabled':''}>Después ›</button></div>`;
}
function moveDayUI(dk,dir){
  const p=getPlan(),K=dayKeys(p),i=K.indexOf(dk),j=i+(dir<0?-1:1);if(i<0||j<0||j>=K.length||_dayMoveFixed())return;
  if(_dayEditBlocked())return;
  const antes=_zonasSeguidas(_planZonasDias(p)).length;
  stampSessionsLbl();const map={};K.forEach(k=>{map[k]=k;});map[K[i]]=K[j];map[K[j]]=K[i];
  _reletter(map);_editDay=K[j];_markPlanEdited();saveState();
  const zs=_zonasSeguidas(_planZonasDias(getPlan()));
  toast(`Ahora es el Día ${K[j]}`+(zs.length>antes?`. Ojo: el Día ${K[zs[0][0]]} y el Día ${K[zs[0][0]+1]} trabajan ${zs[0][1]==='pierna'?'la pierna':'el '+zs[0][1]} seguidos; si entrenas dos días seguidos, deja uno en medio`:''),zs.length>antes?5200:2400);
  if(_routineEdOpen)renderRoutineEditor();render();
}
// Cambiar el nombre: se edita el foco («Pierna — glúteo y femoral», hasta 200); el nombre corto sigue siendo «Día X»
function renameDayUI(dk){
  const p=getPlan();if(!_isPlanDay(p[dk]))return;
  const root=document.getElementById('cmodal-root');if(!root)return;
  const lb=esc(dayLabel(dk,p));
  root.innerHTML=`<div class="cmov" onclick="if(event.target===this){document.getElementById('cmodal-root').innerHTML=''}"><div class="cmod" role="dialog" aria-modal="true" aria-labelledby="dn-t">
    <div class="cmod-hdl"></div>
    <div class="cmod-t" id="dn-t">Nombre del ${lb}</div>
    <div class="cmod-b">Lo que trabajas ese día, para reconocerlo de un vistazo. Por ejemplo: «Pierna — glúteo y femoral».</div>
    <input id="dn-inp" class="inp dn-inp" type="text" maxlength="200" autocomplete="off" value="${esc(p[dk].focus==null?'':p[dk].focus)}" aria-label="Nombre del ${lb}" data-dk="${esc(dk)}" onkeydown="if(event.key==='Enter'){event.preventDefault();renameDaySave(this.dataset.dk)}">
    <div class="cmod-btns">
      <button class="btn bs" onclick="document.getElementById('cmodal-root').innerHTML=''">Cancelar</button>
      <button class="btn bp" data-dk="${esc(dk)}" onclick="renameDaySave(this.dataset.dk)">Guardar</button>
    </div>
  </div></div>`;
  setTimeout(()=>{const i=document.getElementById('dn-inp');if(i){try{i.focus();i.select();}catch(e){}}},60);
}
function renameDaySave(dk){
  const p=getPlan(),i=document.getElementById('dn-inp');if(!_isPlanDay(p[dk])||!i)return;
  const v=String(i.value||'').replace(/\s+/g,' ').trim().slice(0,200);
  document.getElementById('cmodal-root').innerHTML='';
  if(v===String(p[dk].focus==null?'':p[dk].focus))return;
  p[dk].focus=v;_markPlanEdited();saveState();
  toast(v?'Nombre guardado':'Nombre borrado');render();
}
// Vaciar este día: quita todos sus ejercicios (para meter el tuyo desde cero); mientras esté vacío, no rota
function emptyDayUI(dk){
  const p=getPlan();if(!_isPlanDay(p[dk])||!p[dk].ex.length)return;
  if(_dayEditBlocked())return;
  const lb=dayLabel(dk,p);
  confirmModal({title:`¿Vaciar el ${lb}?`,body:'Sus ejercicios salen de tu rutina; tu historial se conserva en Progreso. Mientras esté vacío, el día no entra en tu rotación.',
    okText:'Vaciar',cancelText:'Cancelar',danger:true,
    onOk:()=>{
      if(_dayEditBlocked())return;
      const P=getPlan();if(!_isPlanDay(P[dk]))return;
      stampSessionsLbl();
      const end=_dayClearRefs(dk);P[dk].ex=[];
      if(S.nextDay===dk)S.nextDay=getNextDay(dk);
      _markPlanEdited();saveState();
      toast(`${lb} vacío: añade sus ejercicios${end?' · Tu descarga ha terminado':''}`,3200);
      render();
    }});
}
// Empezar de cero: N días vacíos (2-6) y el objetivo semanal en N. También la usa la tarjeta «Pon tu rutina» (onboarding).
function startFromScratch(n){
  n=Math.max(2,Math.min(DAY_KEYS.length,parseInt(n)||3));
  const np={};DAY_KEYS.slice(0,n).forEach(k=>{np[k]={label:'Día '+k,focus:'',ex:[]};});
  _replacePlan(np);
  S.weeklyTarget=n;S.nextDay='A';S.day='A';
  try{_editDay='A';}catch(e){}
  saveState();
  return true;
}
function startFromScratchUI(){
  if(_dayEditBlocked())return;
  const root=document.getElementById('cmodal-root');if(!root)return;
  const cur=dayKeys().length;
  root.innerHTML=`<div class="cmov" onclick="if(event.target===this){document.getElementById('cmodal-root').innerHTML=''}"><div class="cmod" role="dialog" aria-modal="true" aria-labelledby="sc-t">
    <div class="cmod-hdl"></div>
    <div class="cmod-t" id="sc-t">Empezar de cero</div>
    <div class="cmod-b">¿Cuántos días tiene tu rutina? Te dejo esos días vacíos para que metas tus ejercicios. Tu historial se conserva en Progreso.</div>
    <div class="sc-days" role="group" aria-label="Días de tu rutina">${[2,3,4,5,6].map(n=>`<button type="button" class="sc-day${n===cur?' on':''}" aria-pressed="${n===cur}" onclick="startFromScratchAsk(${n})">${n}</button>`).join('')}</div>
    <div class="cmod-btns"><button class="btn bs" onclick="document.getElementById('cmodal-root').innerHTML=''">Cancelar</button></div>
  </div></div>`;
}
function startFromScratchAsk(n){
  confirmModal({title:`¿Empezar de cero con ${plural(n,'día')}?`,
    body:`Tu rutina se queda con ${plural(n,'día vacío','días vacíos')} y tu objetivo pasa a ${plural(n,'día')} por semana. Los ejercicios de ahora salen de tu rutina; tu historial se conserva en Progreso.`,
    okText:'Empezar de cero',cancelText:'Cancelar',danger:true,
    onOk:()=>{
      if(_dayEditBlocked())return;
      startFromScratch(n);
      toast(`Listo: ${plural(n,'día vacío','días vacíos')}. Empieza por el Día A`,3200);
      if(!_routineEdOpen)openRoutineEditor('A');else renderRoutineEditor({top:true});
      render();
    }});
}
// Abre el editor en un día concreto (Inicio: «Te falta rellenar el Día D»)
function openRoutineEditorAt(dk){openRoutineEditor(dk);}

