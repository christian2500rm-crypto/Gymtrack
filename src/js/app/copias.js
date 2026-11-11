// ═══ (15b) COPIAS DE SEGURIDAD Y ALMACENAMIENTO PERSISTENTE ═══
// S.lastBackupTs: cuándo guardaste la última copia (exportar el JSON o el CSV, o copiar el JSON); null = nunca. Va dentro
// de la propia copia (así, al importarla, cuenta como copia de ese momento). S.backupSnoozeTs: «Ahora no» del aviso de
// Inicio → medianoche local de dentro de 7 días (es de este móvil: importar no lo cambia). Sin subir SCHEMA_VERSION: se
// sanean al cargar y al importar (_sanitizeBackupMeta; en el arranque, antes de las const de abajo: solo literales).
// Aviso en Inicio: cada 30 días o tras 10 sesiones nuevas desde la última copia (sin copia: desde tu primera sesión),
// siempre con alguna sesión sin copiar; nunca sin sesiones ni con un entreno en curso.
// (15 arreglos) S.lastBackupKind: 'json' (copia que se puede restaurar) o 'csv' (la última fue el CSV, que no se puede
// importar); null = 'json' (datos de antes). S.lastJsonBackupTs: la última copia JSON (la que vale para restaurar).
// S.dataEditTs: último cambio que una sesión nueva no delata (tu rutina o tu peso, o una sesión antigua reabierta):
// con él, el aviso de los 30 días también sale aunque no haya sesiones nuevas.
const BK_DAYS=30,BK_SESS=10,BK_SNOOZE_DAYS=7;
function _bkTs(v){return typeof v==='number'&&isFinite(v)&&v>0?Math.min(v,Date.now()):null;}
function _sanitizeBackupMeta(o){
  if(!o||typeof o!=='object')return;
  o.lastBackupTs=_bkTs(o.lastBackupTs);
  const z=o.backupSnoozeTs;
  // una espera de más de 8 días (reloj cambiado o dato a mano) no vale: el aviso no puede quedar dormido para siempre
  o.backupSnoozeTs=typeof z==='number'&&isFinite(z)&&z>0&&z<=Date.now()+8*864e5?z:null;
  o.lastBackupKind=o.lastBackupKind==='csv'||o.lastBackupKind==='json'?o.lastBackupKind:null;
  o.lastJsonBackupTs=_bkTs(o.lastJsonBackupTs);
  o.dataEditTs=_bkTs(o.dataEditTs);
}
// La última copia que se puede restaurar (null = ninguna): tras un CSV, la JSON de antes
function _bkSafeTs(){return S.lastBackupKind==='csv'?_bkTs(S.lastJsonBackupTs):_bkTs(S.lastBackupTs);}
// «Cambios desde la copia»: huella de tu rutina y tu peso, mirada en cada saveState (unos 10 KB: barato). Lo cargado al
// abrir es el punto de partida (_bkTrackStart, al final del arranque); antes de eso no se apunta nada.
var _bkSig,_bkReady=false;
function _bkDataSig(){
  const s=JSON.stringify([S.currentPlan||null,S.weights||null,S.profile||null,S.places||null]);let h=0x811c9dc5; // FNV-1a de 32 bits + longitud (E2: y tus respuestas y sitios)
  for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}
  return(h>>>0).toString(36)+'.'+s.length;
}
function _bkTrackStart(){_bkSig=_bkDataSig();_bkReady=true;}
function _bkTrack(){
  if(!_bkReady)return;
  const s=_bkDataSig();
  if(s!==_bkSig){_bkSig=s;S.dataEditTs=Date.now();}
}
// «hoy», «ayer», «hace 12 días» (días de calendario) o «nunca»
function backupAgeTxt(ts){
  ts=_bkTs(ts);if(ts==null)return'nunca';
  const d=Math.round((_startOfDay(Date.now())-_startOfDay(ts))/DAY_MS);
  return d<=0?'hoy':d===1?'ayer':`hace ${d} días`;
}
// ¿Toca el aviso? null o {never, n (sesiones sin copia), days (días desde la última copia o desde tu primera sesión)}
function backupReminder(){
  const ss=Array.isArray(S.sessions)?S.sessions.filter(_isPlainObj):[];
  if(!ss.length||getActiveWorkout())return null;
  const now=Date.now(),z=S.backupSnoozeTs;
  if(typeof z==='number'&&now<z)return null;
  const last=_bkSafeTs();
  let n,since,edits=false;
  if(last==null){
    // sin copia: todas cuentan (también las de copias antiguas sin ts); el tiempo, desde la primera con fecha
    n=ss.length;const T=ss.map(s=>+s.ts).filter(t=>isFinite(t)&&t>0);since=T.length?Math.min(...T):null;
  }else{
    // con copia: las sesiones posteriores (una sin ts, de una copia antigua, ya estaba en ella)
    n=ss.filter(s=>+s.ts>last).length;since=last;
    // sin sesiones nuevas, otros cambios (rutina, peso, una sesión reabierta) también piden copia a los 30 días
    edits=!n&&_bkTs(S.dataEditTs)!=null&&S.dataEditTs>last;
  }
  if(!n&&!edits)return null;
  const days=since==null?0:Math.floor((now-since)/DAY_MS);
  if(n<BK_SESS&&days<BK_DAYS)return null;
  return{never:last==null,n,days,edits,csv:S.lastBackupKind==='csv'};
}
const _bkIcSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function backupReminderHtml(){
  const o=backupReminder();if(!o)return'';
  const ses=plural(o.n,'sesión','sesiones');
  const age=backupAgeTxt(_bkSafeTs());
  const t=o.never?(o.csv?'Tu CSV no sirve para restaurar':'Aún no tienes ninguna copia')
    :o.days>=BK_DAYS?`Tu última copia es de ${age}`
    :`${ses} sin copia`;
  const d=o.never?`${o.n===1?'Tu sesión solo está':`Tus ${ses} solo están`} en este móvil. ${o.csv?'Guarda una copia (JSON) en un toque.':`${o.n===1?'Guárdala':'Guárdalas'} en un archivo en un toque.`}`
    :o.days>=BK_DAYS?(o.edits?'Desde entonces hay cambios sin copiar (rutina, peso…). Guarda una copia en un toque.'
      :`Desde entonces, ${ses} ${o.n===1?'nueva':'nuevas'}. Guarda una copia en un toque.`)
    :`Tu última copia es de ${age}. Guarda otra en un toque.`;
  return`<div class="card bk-card" id="bk-card" role="region" aria-labelledby="bk-t">
    <div class="bk-row"><span class="bk-ic">${_bkIcSvg}</span>
      <div class="bk-txt"><span class="bk-k">Copia de seguridad</span><span class="bk-t" id="bk-t">${esc(t)}</span><span class="bk-d">${esc(d)}</span></div></div>
    <div class="bk-acts"><button type="button" class="btn bp" onclick="backupFromCard(this)">Guardar copia</button><button type="button" class="btn bs" onclick="backupSnooze()">Ahora no</button></div>
  </div>`;
}
// Marca la copia (antes de armarla: la copia lleva su propia fecha); devuelve lo de antes para deshacerlo si falla
// kind 'json' (exportar o copiar el JSON: se puede restaurar) o 'csv' (no se puede importar: no quita la espera del aviso
// ni cuenta como copia restaurable, aunque lastBackupTs apunte cuándo fue)
function _bkMark(kind){
  const p={ts:S.lastBackupTs,z:S.backupSnoozeTs,k:S.lastBackupKind,j:S.lastJsonBackupTs},now=Date.now();
  if(kind==='csv'){if(S.lastBackupKind!=='csv')S.lastJsonBackupTs=_bkTs(S.lastBackupTs);S.lastBackupKind='csv';}
  else{S.lastBackupKind='json';S.lastJsonBackupTs=now;S.backupSnoozeTs=null;}
  S.lastBackupTs=now;
  return p;
}
function _bkUndo(p){S.lastBackupTs=p.ts;S.backupSnoozeTs=p.z;S.lastBackupKind=p.k;S.lastJsonBackupTs=p.j;}
// Ajustes: «Última copia: hace 3 días» (la que se puede restaurar) y, si después exportaste el CSV, que ese no vale
function backupLineTxt(){
  let t=`Última copia: ${backupAgeTxt(_bkSafeTs())}`;
  // (la nota solo si el CSV es de otro día que la restaurable: el mismo día no hay nada que advertir)
  if(S.lastBackupKind==='csv'&&_bkTs(S.lastBackupTs)!=null&&backupAgeTxt(S.lastBackupTs)!==backupAgeTxt(_bkSafeTs()))t+=` · CSV ${backupAgeTxt(S.lastBackupTs)}, no sirve para restaurar`;
  return t;
}
// Copia hecha: guardar y repintar (el aviso se va; con Ajustes abierto, sin perder dónde estabas en la hoja)
function _bkDone(){
  saveState();
  const b=document.querySelector('#settings-root .hist-sheet-body'),top=b?b.scrollTop:0,card=!!document.getElementById('bk-card');
  render();
  const b2=document.querySelector('#settings-root .hist-sheet-body');if(b2&&top)b2.scrollTop=top;
  if(card&&!S.settingsOpen)_wrRefocus();
}
function backupFromCard(el){
  try{if(el&&el.focus)el.focus({preventScroll:true});}catch(e){}
  return exportData();
}
function backupSnooze(){
  S.backupSnoozeTs=_addDaysLocal(_startOfDay(Date.now()),BK_SNOOZE_DAYS);
  saveState();render();_wrRefocus();
  toast(`Vale · te lo recuerdo el ${_dlDayTxt(S.backupSnoozeTs)}`,3200);
}
// navigator.storage.persist(): pide al navegador que no borre tus datos cuando le falte espacio. Tras guardar una sesión,
// una vez por arranque (en Chrome y Safari no pregunta nada; Firefox pregunta una vez y lo recuerda). Sin soporte, o si
// falla, no pasa nada. Devuelve una promesa: true (protegido), false (no) o null (sin soporte / ya se intentó).
let _persistTried=false;
function _persistApi(){try{const st=navigator.storage;return st&&typeof st.persist==='function'?st:null;}catch(e){return null;}}
function _persistReq(st){
  try{
    return Promise.resolve(typeof st.persisted==='function'?st.persisted():false)
      .then(p=>p?true:st.persist()).then(v=>!!v,()=>false);
  }catch(e){return Promise.resolve(false);}
}
function storagePersist(){
  if(_persistTried||!(Array.isArray(S.sessions)&&S.sessions.length))return Promise.resolve(null);
  const st=_persistApi();if(!st)return Promise.resolve(null);
  _persistTried=true;
  return _persistReq(st);
}
// Ajustes: ¿protegido? (solo si el navegador lo sabe decir; si no, la fila no sale). Tocarla, si no lo está, lo pide.
function storagePersistedState(){
  try{const st=navigator.storage;if(!st||typeof st.persisted!=='function')return Promise.resolve(null);
    return Promise.resolve(st.persisted()).then(v=>!!v,()=>null);}catch(e){return Promise.resolve(null);}
}
// (16 r2) Solo escribe la fila la consulta más reciente: una anterior (p. ej. la de abrir Ajustes) que tarde en
// responder ya no pisa con «Normal» el «✓ Protegido» que acaba de dejar el toque.
let _pfSeq=0;
function _setPersistFill(){
  const r=document.getElementById('set-persist');if(!r)return Promise.resolve(null);
  const my=++_pfSeq;
  return storagePersistedState().then(p=>{
    if(my!==_pfSeq)return p;
    const row=document.getElementById('set-persist');if(!row)return p;
    if(p==null){row.style.display='none';return p;}
    row.style.display='';
    row.classList.toggle('set-row-static',p);
    if(p){row.removeAttribute('role');row.removeAttribute('tabindex');}else{row.setAttribute('role','button');row.tabIndex=0;}
    row.querySelector('.set-row-d').textContent=p?'El navegador no borrará tus datos para hacer sitio'
      :'Si al móvil le falta espacio, el navegador podría borrar tus datos. Toca para pedir que los proteja';
    row.querySelector('.set-row-v').textContent=p?'✓ Protegido':'Normal';
    const ar=row.querySelector('.set-row-arrow');if(ar)ar.hidden=p; // fija una vez protegida: sin flecha
    return p;
  });
}
function storagePersistAsk(){
  const row=document.getElementById('set-persist');if(row&&row.classList.contains('set-row-static'))return Promise.resolve(true);
  const st=_persistApi();if(!st){toast('Este navegador no permite proteger tus datos');return Promise.resolve(null);}
  _persistTried=true;
  return _persistReq(st).then(v=>_setPersistFill().catch(()=>null).then(()=>{
    toast(v?'Listo: el navegador no borrará tus datos':'El navegador no lo permite ahora. Añadir Gymteca a tu pantalla de inicio suele ayudar',3600);
    return v;
  }));
}

function exportData(){
  const prev=_bkMark('json');
  try{
    const payload=_backupPayload(); // (E2) lo mismo que «Copiar datos (JSON)»
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download=`gymteca-copia-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);a.click();
    setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url);},100);
    _bkDone();
    toast('Copia descargada · guárdala también fuera del móvil (Drive, correo…)',3600);
    return true;
  }catch(e){_bkUndo(prev);toast('Error al exportar');return false;}
}

function exportCSV(){
  const prev=_bkMark('csv');
  try{
    // CSV: fecha, día, ejercicio, peso(kg), reps, series, rpe
    // (tipos de registro) Columnas añadidas al final: su ejercicio de la biblioteca, el tipo (w, bw, r, t, d) y los segundos
    // o metros. Los registros sin peso dejan peso_kg vacío; los de siempre salen igual que antes.
    const rows=[['fecha','dia','ejercicio','peso_kg','reps','series_completadas','rpe_promedio','ts','lib_id','tipo','tiempo_s','distancia_m']];
    const plan=getPlan();
    // Mapa id→nombre para reconstruir nombres
    const nameById={};
    Object.values(plan).forEach(d=>d.ex.forEach(e=>{nameById[e.id]=e.n;}));
    // Cualquier ejercicio en S.strength aunque ya no esté en el plan
    Object.entries(S.strength||{}).forEach(([exId,records])=>{
      const lib=_libOfKey(exId)||'';
      (records||[]).forEach(r=>{
        const name=nameById[exId]||exDisplayName(exId);
        // Escapado CSV: si contiene coma/comilla/salto, envolver en comillas
        const csvEsc=v=>{const s=String(v==null?'':v);return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
        // Determinar día (A/B/C) por sesión más cercana
        const sess=(S.sessions||[]).find(s=>s.ts&&Math.abs(s.ts-r.ts)<86400000);
        rows.push([r.d||'',sess?.day||'',name,+r.v>0?r.v:(r.lt?'':(r.v??'')),r.r??'',r.setsDone??'',r.rpe??'',r.ts||'',lib,_recLT(r),r.t??'',r.m??''].map(csvEsc));
      });
    });
    // Añadir registros de peso corporal
    rows.push([]);
    rows.push(['# peso_corporal']);
    rows.push(['fecha','peso_kg','ts']);
    (S.weights||[]).forEach(w=>{
      rows.push([w.d||'',w.v??'',w.ts||'']);
    });
    const csv=rows.map(r=>r.join(',')).join('\n');
    const blob=new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8'}); // BOM para Excel
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download=`gymteca-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);a.click();
    setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url);},100);
    _bkDone();
    toast('CSV descargado · para restaurar, usa «Guardar copia»',4200);
    return true;
  }catch(e){_bkUndo(prev);toast('Error al exportar CSV');return false;}
}

function copyDataToClipboard(){
  // (15b) cuenta como copia si se llega a copiar (el JSON ya lleva su fecha); si falla, todo queda como estaba
  const prev=_bkMark('json');
  try{
    const txt=JSON.stringify(_backupPayload(),null,2); // (E2, 42 R3) lo mismo que «Guardar copia»: sin claves de pantalla ni, si lo eliges, tus molestias
    if(navigator.clipboard&&navigator.clipboard.writeText){
      return navigator.clipboard.writeText(txt).then(()=>{_bkDone();toast('JSON copiado al portapapeles');return true;},
        ()=>{_bkUndo(prev);toast('No se pudo copiar');return false;});
    }else{
      // Fallback
      const ta=document.createElement('textarea');
      ta.value=txt;ta.style.position='fixed';ta.style.opacity='0';
      document.body.appendChild(ta);ta.select();
      let ok=false;try{ok=document.execCommand('copy')!==false;}catch(e){}
      document.body.removeChild(ta);
      if(ok){_bkDone();toast('JSON copiado');}else{_bkUndo(prev);toast('No se pudo copiar');}
      return Promise.resolve(ok);
    }
  }catch(e){_bkUndo(prev);toast('Error al copiar');return Promise.resolve(false);}
}

// Import: id de un ejercicio del plan que no se puede usar tal cual (no es texto, está vacío, pasa de 80 o lleva
// comillas, < > o \) → uno nuevo, y su historial, sus series de hoy, sus propuestas… se mueven con él (d: el backup)
function _impExId(o,d){
  if(typeof o.id==='number'&&isFinite(o.id))o.id=String(o.id);
  if(typeof o.id==='string'&&o.id&&o.id.length<=80&&!/['"<>\\]/.test(o.id))return;
  const nid='ex_'+Date.now()+'_'+Math.random().toString(36).slice(2,6);
  if(typeof o.id==='string'&&o.id)_remapExId(d,o.id,nid);
  o.id=nid;
}
function _remapExId(d,from,to){
  const mv=m=>{if(_isPlainObj(m)&&from in m){m[to]=m[from];delete m[from];}};
  const rs=_isPlainObj(d.reopenedSession)?d.reopenedSession:null;
  [d.strength,d.logs,d.sets,d.rpe,d.warmups,d.restOverrides,rs&&rs.strength].forEach(mv);
  // las sesiones del historial y la reabierta: su foto de series y sus «solo hoy»
  (Array.isArray(d.sessions)?d.sessions:[]).concat(rs?[rs.session]:[]).forEach(s=>{if(!_isPlainObj(s))return;
    if(_isPlainObj(s.snapshot))[s.snapshot.sets,s.snapshot.logs,s.snapshot.rpe].forEach(mv);
    if(Array.isArray(s.subs))s.subs.forEach(x=>{if(_isPlainObj(x)){if(x.orig===from)x.orig=to;if(x.alt===from)x.alt=to;}});});
  [d.pendingCoachProposals,d.appliedProposals,_isPlainObj(d.deload)&&d.deload.changes].forEach(L=>{if(Array.isArray(L))L.forEach(p=>{if(_isPlainObj(p)&&p.exId===from)p.exId=to;});});
  (Array.isArray(d.deloadHistory)?d.deloadHistory:[]).forEach(h=>{if(_isPlainObj(h)&&Array.isArray(h.exIds))h.exIds=h.exIds.map(i=>i===from?to:i);});
}
// (E2) Claves nuevas al restaurar una copia, una a una (§D.4; 42 R1). m = los datos de la copia ya migrados (lo que no traía,
// heredado del móvil); had = las claves que traía la copia antes de migrar. Nada de este móvil se pierde por una copia antigua.
function _importV21(m,had){
  const own=k=>S[k],fromCopy=k=>had.has(k)&&m[k]!=null;
  const planFromCopy=had.has('currentPlan');
  // Sitios y respuestas: los de la copia si los trae; si no (copia antigua o sin ellos), los de este móvil
  m.places=_sanitizePlaces(fromCopy('places')?m.places:own('places'));
  m.profile=_sanitizeProfile(fromCopy('profile')?m.profile:own('profile'));
  // Borrador: manda el de este móvil; si no tiene, el de la copia (sin salud y de menos de 30 días)
  m.obDraft=_sanitizeObDraft(own('obDraft'))||_sanitizeObDraft(had.has('obDraft')?m.obDraft:null);
  // Rutina generada: la de la copia describe su rutina; una copia sin ella trae una rutina que no es generada. Sin plan en la
  // copia, se quedan la rutina de este móvil y su planMeta.
  const phoneMeta=own('planMeta'),phonePlan=own('currentPlan');
  if(planFromCopy)m.planMeta=fromCopy('planMeta')?_sanitizePlanMeta(m.planMeta,m.currentPlan):null;
  else m.planMeta=_sanitizePlanMeta(phoneMeta,phonePlan);
  // Rutina anterior: la de la copia si trae una; si no, la rutina generada de este móvil (si la copia la sustituye), para
  // poder volver a ella con «Volver a mi rutina anterior»
  const copyPrev=fromCopy('planPrev')?_sanitizePlanPrev(m.planPrev,null):null;
  if(copyPrev)m.planPrev=copyPrev;
  else if(planFromCopy&&phoneMeta&&phonePlan)m.planPrev=_sanitizePlanPrev({ts:Date.now(),src:'restaurar',plan:phonePlan,weeklyTarget:own('weeklyTarget'),
    nextDay:own('nextDay'),day:own('day'),rotBack:own('rotBack'),meta:phoneMeta,profile:own('profile'),places:own('places'),
    pendingCoachProposals:own('pendingCoachProposals'),libPlace:own('libPlace'),libKit:own('libKit')},null);
  else m.planPrev=planFromCopy?null:_sanitizePlanPrev(own('planPrev'),null);
  // Salud: la de la copia solo con un consentimiento válido; si no, la de este móvil (el consentimiento es de este móvil)
  m.health=(had.has('health')&&_sanitizeHealth(m.health))||_sanitizeHealth(own('health'));
  m.bkHealth=own('bkHealth')!==false; // una preferencia de este móvil: nunca viene de una copia
  // rotBack: el de la copia si apunta a un día de su rutina; si no, ninguno (apuntaba a un día que ya no está)
  m.rotBack=had.has('rotBack')&&typeof m.rotBack==='string'&&_isPlainObj(m.currentPlan)&&_isPlanDay(m.currentPlan[m.rotBack])?m.rotBack:null;
}
// (E2) Lo que va en una copia, para las dos vías («Guardar copia» y «Copiar datos (JSON)»; 42 R3): sin las claves de pantalla
// ni el descanso en marcha, con todas las claves nuevas y las molestias solo si las incluyes (S.bkHealth, en «Mis molestias»)
function _backupPayload(){
  const p={...S,_exported:new Date().toISOString(),_version:SCHEMA_VERSION};
  TRANSIENT_KEYS.forEach(k=>delete p[k]);
  delete p.restTimer; // un temporizador en marcha no tiene sentido en otro dispositivo
  if(S.bkHealth===false)delete p.health;
  return p;
}
function importData(o){o=o||{}; // (E7) o.fromOnboarding: desde la bienvenida
  const inp=document.createElement('input');
  inp.type='file';inp.accept='application/json,.json';
  inp.onchange=(e)=>{
    const f=e.target.files[0];if(!f)return;
    const reader=new FileReader();
    reader.onload=ev=>{
      try{
        const data=JSON.parse(ev.target.result);
        if(!data||typeof data!=='object'||!('sessions'in data||'weights'in data)){
          toast('Archivo no válido');return;
        }
        // (E2) Una copia de una versión más nueva de la app (días D-F, claves que esta no conoce): mejor no restaurarla a medias
        if(Math.max(+data.schema_version||0,+data._version||0)>SCHEMA_VERSION){toast('Actualiza la app antes de restaurar esta copia',4200);return;}
        confirmModal({
          title:'Restaurar copia',
          body:`Se reemplazarán los datos actuales por los del archivo (${plural((data.sessions||[]).length,'sesión','sesiones')}, ${plural((data.weights||[]).length,'peso')}). Esta acción no se puede deshacer.`,
          okText:'Restaurar',
          cancelText:'Cancelar',
          danger:true,
          onOk:()=>{
            // Preferencia de sonido: la del backup solo si la trae (un backup antiguo no cambia la de este móvil)
            const _sndImp=typeof data.timerSound==='boolean'?data.timerSound:(typeof S.timerSound==='boolean'?S.timerSound:true);
            // Saltos de peso (v15): los del backup solo si los trae (uno antiguo no pisa los de este móvil); siempre saneados
            const _lsImp=_sanitizeLoadSteps(_isPlainObj(data.loadSteps)?data.loadSteps:S.loadSteps);
            // Rango del mapa muscular (v17): el del backup solo si lo trae y vale; si no, el de este móvil
            const _mmImp=['7d','4w','cycle'].includes(data.mmRange)?data.mmRange:mmRangeKey();
            // Descanso por ejercicio y pantalla encendida (v19): los del backup solo si los trae; si no, los de este móvil
            const _roImp=_sanitizeRestOverrides(_isPlainObj(data.restOverrides)?data.restOverrides:S.restOverrides);
            const _kaImp=typeof data.keepAwake==='boolean'?data.keepAwake:S.keepAwake!==false;
            // (M1) Descanso entre series: el del backup solo si lo trae; si no, el de este móvil
            const _restImp=typeof data.restOn==='boolean'?data.restOn:S.restOn!==false;
            // (M2) Esfuerzo de cada serie: igual
            const _rpeImp=typeof data.rpeOn==='boolean'?data.rpeOn:S.rpeOn!==false;
            // (E2) Foto de las claves que trae la copia ANTES de migrar (después, data ya está cambiado): 42 R1
            const had=new Set(Object.keys(data));
            // Aplicar migración por si viene de versión antigua
            const migrated=migrateState(data);
            // Registro serie a serie (v18): series de hoy y de los registros, siempre saneadas (también en backups v18+)
            _sanitizeSetData(migrated);
            migrated.timerSound=_sndImp;
            migrated.loadSteps=_lsImp;
            migrated.mmRange=_mmImp;
            migrated.restOverrides=_roImp;
            migrated.keepAwake=_kaImp;
            migrated.restOn=_restImp;
            migrated.rpeOn=_rpeImp;
            // Temporizador: nunca se importa ni se hereda (el del backup es de otro momento; el actual, de otros datos)
            migrated.restTimer=null;
            // Sanear nombres y campos de texto del plan personalizado (defensa XSS). Sin las claves del catálogo (se leen
            // por su lib) y con un id que se pueda usar (uno con comillas o < > pasa a ser nuevo, con sus datos). Lo que no
            // es un ejercicio (null, un texto, un número) se quita: la app no lo sabría pintar.
            // (E1a) Antes, las claves: solo días A…F con su lista de ejercicios; sin ninguno (o sin plan), el de fábrica
            if('currentPlan' in migrated)migrated.currentPlan=_sanitizePlanKeys(migrated.currentPlan);
            if(migrated.currentPlan){
              Object.values(migrated.currentPlan).forEach(day=>{
                if(day&&day.label)day.label=String(day.label).slice(0,80);
                if(day&&day.focus)day.focus=String(day.focus).slice(0,200);
                if(day&&Array.isArray(day.ex)){
                  day.ex=day.ex.filter(_isPlainObj);
                  day.ex.forEach(ex=>{
                    ['n','eq','tip','ic','r'].forEach(k=>{
                      if(ex[k]!=null)ex[k]=String(ex[k]).slice(0,300);
                    });
                    // Series: siempre un número (se pinta tal cual en «3×12 reps»)
                    if(ex.s!=null)ex.s=ex.cardio?1:Math.max(1,Math.min(10,parseInt(ex.s)||3));
                    _slimEx(ex);
                    [ex,_isPlainObj(ex.sub)&&_isPlainObj(ex.sub.orig)?ex.sub.orig:null].forEach(o=>{if(o)_impExId(o,migrated);});
                  });
                }
              });
            }
            // (11) «Solo hoy»: sustituciones del plan y de las sesiones, siempre saneadas (también en backups v20)
            _sanitizePlanSubs(migrated.currentPlan);
            _sanitizeSessSubs(migrated.sessions);
            _sanitizeSessionsV21(migrated.sessions); // (E1b-E2) nombre, foco, rutina e id del día de cada sesión
            if(_isPlainObj(migrated.reopenedSession))_sanitizeSessDay([migrated.reopenedSession.session]);
            // Normalizar restWeeks siempre (defensa: un backup v10 editado a mano podría traerlo inválido)
            if(!Array.isArray(migrated.restWeeks))migrated.restWeeks=[];
            // Sesión reabierta: solo la del backup (nunca heredar la del estado actual) y con forma válida.
            // Si la sesión es real pero sus registros apartados vienen corruptos, se conserva la sesión sin ellos.
            const _rsImp=migrated.reopenedSession;
            if(_isPlainObj(_rsImp)&&_rsImp.strength!=null&&!_isPlainObj(_rsImp.strength))_rsImp.strength={};
            if(!_validReopened(migrated.reopenedSession))migrated.reopenedSession=null;
            // Descarga: solo la del backup (va con SU plan; nunca heredar la de este móvil) y con forma válida.
            // Si ya caducó, vuelve sola al pintar (deloadTick). Propuestas e historial, saneados.
            if(!_validDeload(migrated.deload))migrated.deload=null;
            // Backup sin plan (parcial o editado a mano): se queda el plan de este móvil. Si está en descarga,
            // antes vuelve a sus series (si no, quedaría a la mitad para siempre). La descarga del backup no se
            // aplica: iba con un plan que no viene en el archivo.
            if(!('currentPlan' in migrated)){
              if(getActiveDeload())_restoreDeload(true);
              migrated.deload=null;
            }
            migrated.deloadHistory=_sanitizeDeloadHistory(migrated.deloadHistory);
            migrated.pendingCoachProposals=_sanitizeProposals(migrated.pendingCoachProposals);
            if(!Array.isArray(migrated.appliedProposals))migrated.appliedProposals=[];
            // Nombres guardados en los registros de fuerza (v14): solo texto y acotado (se muestran escapados)
            if(migrated.strength&&typeof migrated.strength==='object')Object.values(migrated.strength).forEach(a=>{
              if(Array.isArray(a))a.forEach(r=>{
                if(!r||typeof r!=='object')return;
                if('n' in r){if(typeof r.n==='string')r.n=r.n.slice(0,120);else delete r.n;}
                // Plan del registro (v16): series 1-20 y reps del plan como texto corto o número; lo demás, fuera
                if('ps' in r&&!(Number.isInteger(+r.ps)&&+r.ps>=1&&+r.ps<=20))delete r.ps;else if('ps' in r)r.ps=+r.ps;
                if('pr' in r&&!_validPr(r.pr))delete r.pr;
              });
            });
            // (14d) Ofertas del resumen: la del mes, la de este móvil si la copia no la trae; la de ciclos, la de la copia (sin
            // ella, todos sus ciclos cerrados cuentan como vistos: nunca se ofrece uno antiguo)
            // (también si la trae vacía o mal: las copias hechas antes de ver una oferta llevan null)
            if(!(typeof migrated.wrapMonthSeen==='string'&&/^m\d{4}-\d{1,2}$/.test(migrated.wrapMonthSeen)))migrated.wrapMonthSeen=S.wrapMonthSeen;
            _sanitizeWrapSeen(migrated);
            // (15b) Última copia: la que trae la copia; si no (copias de antes), la fecha en que se exportó (_exported); si
            // tampoco (JSON hecho a mano), la de este móvil. El «Ahora no» del aviso es de este móvil: no se importa.
            {const bt=_bkTs(data.lastBackupTs),ex=typeof data._exported==='string'?_bkTs(Date.parse(data._exported)):null;
              migrated.lastBackupTs=bt!=null?bt:ex!=null?ex:S.lastBackupTs;migrated.backupSnoozeTs=S.backupSnoozeTs;
              // (15 arreglos) un JSON con fecha es una copia restaurable de ese momento; sin fecha, lo de este móvil.
              // Sus cambios sin copiar son los de la copia (lo que se importa no es un cambio nuevo)
              if(bt!=null||ex!=null){migrated.lastBackupKind='json';migrated.lastJsonBackupTs=migrated.lastBackupTs;}
              else{migrated.lastBackupKind=S.lastBackupKind;migrated.lastJsonBackupTs=S.lastJsonBackupTs;}
              migrated.dataEditTs=data.dataEditTs;_bkReady=false;setTimeout(()=>{if(!_bkReady)_bkTrackStart();},0);
              _sanitizeBackupMeta(migrated);}
            Object.keys(S).forEach(k=>{if(!(k in migrated))migrated[k]=S[k];});
            _importV21(migrated,had);
            S=Object.assign(S,migrated);
            // Selector (lugar, material de casa, favoritos, recientes): los del backup si los trae; si no, los de este móvil
            _sanitizeLibPrefs(S);
            // (E1b) letras de día consecutivas (una copia editada a mano con A, B, D), con los nombres apuntados en sus sesiones
            _fixPlanLetters();
            // Limpiar estado UI transitorio importado
            TRANSIENT_KEYS.forEach(k=>{if(k in S)delete S[k];});
            RT.stop();closeRpeSelector();RF.close();closeSessionSummary();
            // Re-sincronizar el puntero del entreno activo con las series realmente importadas
            syncActiveWorkout();
            S.settingsOpen=true;
            _bkTrackStart(); // lo importado es el nuevo punto de partida de «cambios desde la copia»
            if(o.fromOnboarding){S.settingsOpen=false;if(S.onboarded&&_obOpen())hideOnboarding();} // (E7) la copia trae onboarded → la app; si no, sigue la bienvenida
            saveState();render();
            storagePersist(); // (15b) datos que importan: pide que no se borren (una vez por arranque)
            toast('✓ Datos importados correctamente',3500);
          }
        });
      }catch(err){toast('Error al leer el archivo');}
    };
    reader.readAsText(f);
  };
  inp.click();
}

function resetOnboarding(){
  confirmModal({
    title:'Volver a la bienvenida',
    body:'Vuelves a la pantalla de bienvenida para elegir cómo empezar. Tus datos de entrenamiento no se borran.',
    okText:'Rehacer',
    cancelText:'Cancelar',
    onOk:()=>{
      S.onboarded=false;S.settingsOpen=false;
      // El selector vuelve a empezar en el gimnasio (favoritos, recientes y (E3c) tu material de casa se quedan: es tuyo, §G.7)
      S.libPlace='g';
      saveState();
      showOnboarding({from:'first',step:'ob-hola'}); // (E7) la bienvenida nueva
    }
  });
}

function resetAllData(){
  confirmModal({
    title:'¿Borrar TODOS los datos?',
    body:'Esta acción elimina sesiones, pesos, historial y ciclos de forma permanente. No se puede deshacer. ¿Estás seguro?',
    okText:'Borrar todo',
    cancelText:'Cancelar',
    danger:true,
    onOk:()=>{
      try{localStorage.removeItem('gymtrack_v3');}catch(e){}
      location.reload();
    }
  });
}

