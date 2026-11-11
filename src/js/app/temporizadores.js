// ─── ANIMACIONES DE EJERCICIOS ───────────────────────────────────────────────
// Motor GymAnim (bloque GYM-ANIM): maniquí 3D con cinemática inversa, tempo real y
// músculo objetivo. Aquí solo se resuelve qué animación corresponde a cada ejercicio.
const PLAN_ANIM={a1:'lib_cardio_walk',a2:'lib_squat_smith',a3:'lib_leg_ext',a4:'lib_leg_curl',a5:'lib_crunch_cable',a6:'lib_cardio_run',
  b1:'lib_cardio_walk',b2:'lib_press_incline_smith',b3:'lib_fly_machine',b4:'lib_lat_raise_cable',b5:'lib_tricep_pushdown',b6:'lib_cardio_run',
  c1:'lib_cardio_walk',c2:'lib_lat_pulldown',c3:'lib_row_machine',c4:'lib_row_db',c5:'lib_curl_cable',c6:'lib_rev_fly_machine',c7:'lib_cardio_run'};
const MUSCLE_ANIM={piernas:'lib_squat_smith',pecho:'lib_press_flat_db',espalda:'lib_lat_pulldown',hombros:'lib_lat_raise_db',
  biceps:'lib_curl_db',triceps:'lib_tricep_pushdown',core:'lib_crunch_cable',cardio:'lib_cardio_walk'};
// Orden: su ejercicio de la biblioteca (lib → id del plan original → nombre): el suyo o '' (sin animación se queda el
// emoji, nunca la de otro) → si no es de la biblioteca (personalizado), la de su grupo muscular.
// Solo se devuelven claves registradas en el motor (los datos importados no llegan al HTML).
function exAnimKey(ex){
  if(!ex||typeof GymAnim==='undefined')return '';
  const ok=k=>(typeof k==='string'&&GymAnim.has(k))?k:'';
  const L=exLib(ex);if(L)return ok(L.id);
  let k=ok(PLAN_ANIM[ex.id]);
  if(!k&&ex.cardio)k=ok('lib_cardio_walk');
  if(!k&&ex.muscle)k=ok(MUSCLE_ANIM[ex.muscle]);
  return k;
}

// ── SONIDO DEL TEMPORIZADOR (WebAudio) ──────────────────────────
// Pitidos suaves 3-2-1 + pitido final. iOS exige crear/desbloquear el AudioContext dentro de un gesto
// (marcar una serie, elegir el RPE, iniciar el cardio…). Los pitidos se PROGRAMAN en el reloj de audio,
// así suenan a su hora aunque los timers de JS vayan con retraso (app en segundo plano en Android).
// Preferencia S.timerSound (por defecto true). Sin AudioContext → silencio, nunca errores.
const Beep={
  _ctx:null,_nodes:[],_primed:false,_idleT:null,
  on(){return S.timerSound!==false;},
  _AC(){try{return window.AudioContext||window.webkitAudioContext||null;}catch(e){return null;}},
  _get(create){
    if(this._ctx)return this._ctx;
    if(!create)return null;
    const AC=this._AC();
    if(!AC)return null;
    try{this._ctx=new AC();}catch(e){this._ctx=null;return null;}
    try{this._ctx.onstatechange=()=>{if(this._ctx&&this._ctx.state==='running')RT._resched();};}catch(e){}
    // Mezclar con la música del usuario (no la corta) donde el navegador lo permite
    try{if(navigator.audioSession&&navigator.audioSession.type!=='ambient')navigator.audioSession.type='ambient';}catch(e){}
    return this._ctx;
  },
  // Llamar SIEMPRE dentro de un gesto del usuario (iOS solo arranca el audio así)
  unlock(){
    if(!this.on())return false;
    const c=this._get(true);
    if(!c)return false;
    clearTimeout(this._idleT);
    try{
      if(c.state!=='running'&&typeof c.resume==='function'){
        const p=c.resume();
        if(p&&typeof p.then==='function')p.then(()=>RT._resched(),()=>{});
      }
    }catch(e){}
    if(!this._primed){
      // Buffer mudo de 1 muestra: termina de "desbloquear" el audio en Safari antiguo
      this._primed=true;
      try{const b=c.createBuffer(1,1,22050),src=c.createBufferSource();src.buffer=b;src.connect(c.destination);src.start(0);}catch(e){}
    }
    if(!S.restTimer)this.release();
    return true;
  },
  // track=false → tono suelto (prueba) que no se cancela al reprogramar los avisos
  _tone(at,freq,dur,vol,track){
    const c=this._ctx;
    const o=c.createOscillator(),g=c.createGain();
    o.type='sine';
    o.frequency.setValueAtTime(freq,at);
    g.gain.setValueAtTime(0.0001,at);
    g.gain.exponentialRampToValueAtTime(vol,at+0.012);
    g.gain.exponentialRampToValueAtTime(0.0001,at+dur);
    o.connect(g);g.connect(c.destination);
    o.start(at);o.stop(at+dur+0.03);
    if(track!==false)this._nodes.push(o);
    o.onended=()=>{const i=this._nodes.indexOf(o);if(i>=0)this._nodes.splice(i,1);try{g.disconnect();}catch(e){}};
  },
  // Programa los avisos de un temporizador que acaba en endTs (ms). Devuelve cuántos tonos quedaron programados.
  schedule(endTs){
    this.cancel();
    if(!this.on())return 0;
    const c=this._ctx;
    if(!c||c.state!=='running')return 0;
    let n=0;
    try{
      const now=Date.now(),t0=c.currentTime;
      [3,2,1].forEach(k=>{const at=(endTs-k*1000-now)/1000;if(at>0.03){this._tone(t0+at,880,0.08,0.09);n++;}});
      const atEnd=(endTs-now)/1000;
      if(atEnd>0.03){this._tone(t0+atEnd,1320,0.34,0.16);n++;}
    }catch(e){}
    return n;
  },
  cancel(){
    this._nodes.forEach(o=>{try{o.onended=null;o.stop(0);}catch(e){}try{o.disconnect();}catch(e){}});
    this._nodes=[];
  },
  // Sin temporizador activo, suspender el contexto al cabo de un rato (no gastar batería)
  release(){
    clearTimeout(this._idleT);
    this._idleT=setTimeout(()=>{
      const c=this._ctx;
      if(c&&(!S.restTimer||!this.on())&&c.state==='running'&&typeof c.suspend==='function'){try{c.suspend().catch(()=>{});}catch(e){}}
    },2500);
  },
  // Pitido de prueba (al activar el sonido en Ajustes; también desbloquea el audio)
  preview(){
    if(!this.unlock())return false;
    const c=this._ctx;
    const play=()=>{try{this._tone(c.currentTime+0.02,1320,0.3,0.14,false);}catch(e){}if(!S.restTimer)this.release();};
    try{
      if(c.state==='running')play();
      else if(typeof c.resume==='function'){const p=c.resume();if(p&&p.then)p.then(play,()=>{});}
    }catch(e){}
    return true;
  }
};

// ── TEMPORIZADOR DE DESCANSO / CARDIO ──────────────────────────
// Basado en la HORA DE FIN, no en un contador: no se congela ni se desfasa al bloquear el móvil o pasar la
// PWA a segundo plano, y sobrevive a una recarga. Estado persistido en S.restTimer (schema v12):
//   {kind:'rest'|'cardio', startTs, endTs, total (s), label, exId, day}
// Al volver (visibilitychange/pageshow) o al cargar: si sigue en marcha se reanuda; si terminó mientras no
// mirabas se muestra «listo» un momento y se ejecuta su final UNA vez (el cardio se marca como hecho).
const CIRC=2*Math.PI*20;
const RT_LATE_MS=2000;           // detectado >2 s tarde → terminó mientras la app no corría (sin pitido ni vibración)
const RT_SHOW_LATE_MS=30*60000;  // un descanso que acabó hace >30 min se cierra sin aviso
// m:ss («1:30», «7:57», «15:00»)
function fmtClock(secs){
  const s=Math.max(0,Math.round(+secs||0));
  return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
}
function _validRestTimer(t){
  if(!_isPlainObj(t))return false;
  if(t.kind!=='rest'&&t.kind!=='cardio')return false;
  if(typeof t.endTs!=='number'||!isFinite(t.endTs))return false;
  const tot=+t.total;
  if(!isFinite(tot)||tot<=0||tot>MAX_SESSION_MIN*60)return false;
  // Fin a más del total en el futuro (reloj cambiado / dato manipulado) → no fiable
  if(t.endTs-Date.now()>tot*1000+60000)return false;
  return true;
}
const RT={
  _tid:null,_hideT:null,_lastSec:null,_doneT:null,
  _el(id){return document.getElementById(id);},
  // start(segundos, texto, {kind:'rest'|'cardio', exId, day, setIdx, base}) → true si arrancó
  // (08) Un descanso de una serie guarda también setIdx (su serie: el RPE de la barra es de esa serie), base (el descanso
  // del ejercicio antes del RPE) y adj (lo sumado con ±15 s). Campos aditivos: un restTimer antiguo sin ellos sigue valiendo.
  start(secs,name,opts){
    opts=(opts&&typeof opts==='object')?opts:{};
    secs=Math.round(+secs);
    if(!(secs>0))return false;
    const kind=opts.kind==='cardio'?'cardio':'rest';
    if(kind==='rest'&&!_restOn())return false; // (M1) descanso entre series apagado en Ajustes
    const cur=S.restTimer;
    // Un cardio en marcha tiene prioridad sobre un descanso (no se pierde su auto-marcado)
    if(kind==='rest'&&cur&&cur.kind==='cardio'&&cur.endTs>Date.now())return false;
    clearTimeout(this._hideT);this._hideT=null;this._doneT=null;
    const now=Date.now();
    S.restTimer={kind,startTs:now,endTs:now+secs*1000,total:secs,label:String(name||'').slice(0,140),exId:opts.exId||null,day:opts.day||S.day||null};
    if(kind==='rest'){
      const si=opts.setIdx,b=Math.round(+opts.base);
      if(Number.isInteger(si)&&si>=0&&si<SET_MAX_N)S.restTimer.setIdx=si;
      S.restTimer.base=b>0?b:secs;S.restTimer.adj=0;
    }
    saveState();
    Beep.unlock();
    this._show();
    this._loop();
    Beep.schedule(S.restTimer.endTs);
    WL.sync();RF.render();
    return true;
  },
  // Cambia la duración del descanso en marcha de exId (el RPE se elige con el descanso ya corriendo): misma hora de
  // inicio, nuevo final (secs + lo sumado con ±15 s). false si no hay un descanso de ese ejercicio en marcha.
  adjustRest(exId,secs){
    const t=S.restTimer;secs=Math.round(+secs);
    if(!t||t.kind!=='rest'||t.exId!==exId||!(secs>0)||t.endTs<=Date.now())return false;
    const tot=Math.max(1,Math.min(RT_MAX_S,secs+(Math.round(+t.adj)||0)));
    t.total=tot;t.endTs=t.startTs+tot*1000;
    saveState();
    // Ya ha pasado ese tiempo: termina ahora, con su pitido (el programado era para el final anterior)
    if(t.endTs<=Date.now()){Beep.schedule(Date.now()+120);this._complete(false);return true;}
    this._lastSec=null;this._tick();
    Beep.schedule(t.endTs);
    RF.render();
    return true;
  },
  // −15 s / +15 s (modo descanso): mueve el final del descanso en marcha, nunca a menos de 1 s ni a más de RT_MAX_S desde
  // que empezó. Devuelve los segundos aplicados (0 si no cambió nada). Los pitidos 3-2-1 se reprograman.
  addSecs(d){
    const t=S.restTimer,now=Date.now();d=Math.round(+d);
    if(!t||t.kind!=='rest'||!d||t.endTs<=now)return 0;
    let end=Math.max(now+1000,Math.min(t.endTs+d*1000,t.startTs+RT_MAX_S*1000));
    if((d>0&&end<t.endTs)||(d<0&&end>t.endTs))end=t.endTs;
    const applied=Math.round((end-t.endTs)/1000);
    if(!applied)return 0;
    t.endTs=end;t.total=Math.max(1,Math.round((end-t.startTs)/1000));t.adj=(Math.round(+t.adj)||0)+applied;
    saveState();
    this._lastSec=null;this._tick();
    Beep.schedule(t.endTs);
    haptic(8);
    RF.render();
    return applied;
  },
  // El descanso elegido para el ejercicio cambió con su descanso en marcha: se recalcula con el nuevo (y el RPE de la serie)
  rebase(exId){
    const t=S.restTimer;
    if(!t||t.kind!=='rest'||t.exId!==exId||!Number.isInteger(t.setIdx)||t.endTs<=Date.now())return false;
    t.base=getRestSecs(exId);
    const lvl=+(((S.rpe||{})[exId]||{})[t.setIdx])||0;
    return this.adjustRest(exId,_rpeRest(lvl,exId,t));
  },
  // Chips del RPE dentro de la barra (#rt-rpe): de la serie cuyo descanso se ve (en marcha o recién terminado)
  _paintRpe(){
    const el=this._el('rest-timer'),box=this._el('rt-rpe'),q=this._el('rt-q');
    if(!el||!box)return;
    const t=S.restTimer||this._doneT,tg=_rpeTargetFor(t);
    if(!t)this._rpeOnly(tg); // (M1) descanso apagado: la barra solo con el esfuerzo (o se va)
    else if(el.dataset.kind==='rpe')el.dataset.kind=t.kind; // un cardio ocupa la barra
    el.classList.toggle('has-rpe',!!tg);
    if(!tg){if(box.firstChild)box.innerHTML='';box.dataset.k='';if(q)q.textContent='';_dockSync();return;}
    const n=Math.max(1,parseInt(tg.ex&&tg.ex.s)||1),lvl=+(((S.rpe||{})[tg.exId]||{})[tg.setIdx])||0,k=tg.setIdx+':'+lvl;
    if(q)q.textContent=S.restTimer||!t?`Serie ${tg.setIdx+1}/${n} · ¿qué tal?`:`¡Listo! · ¿qué tal la serie ${tg.setIdx+1}?`;
    box.setAttribute('aria-label',`¿Qué tal la serie ${tg.setIdx+1} de ${n}${tg.ex&&tg.ex.n?' de '+tg.ex.n:''}?`);
    if(box.dataset.k!==k){box.innerHTML=rpeChipsHtml(lvl,false);box.dataset.k=k;}
    _dockSync();
  },
  // (M1) Barra del esfuerzo sin temporizador (descanso apagado): la misma #rest-timer con data-kind="rpe", sin anillo ni
  // modo a pantalla completa; «✕» la cierra (skip). Se va sola al elegir (setRpe) y la sustituye la siguiente serie
  // marcada. tg null → se esconde (solo si era la del esfuerzo: nunca esconde un descanso o un cardio).
  _rpeOnly(tg){
    const el=this._el('rest-timer');if(!el)return;
    if(!tg){if(el.dataset.kind==='rpe'){el.classList.remove('show','has-rpe');el.dataset.kind='';el.setAttribute('role','timer');el.removeAttribute('aria-label');}return;}
    el.classList.remove('done');el.classList.add('show');
    el.dataset.kind='rpe';el.setAttribute('role','group');el.setAttribute('aria-label','Esfuerzo de la serie');
    const lab=this._el('rt-label'),msg=this._el('rt-msg'),btn=this._el('rt-skip');
    if(lab)lab.textContent='Esfuerzo';
    if(msg)msg.textContent=tg.ex&&tg.ex.n||'';
    if(btn){btn.textContent='✕';btn.setAttribute('aria-label','Cerrar sin apuntar el esfuerzo');}
  },
  // Segundos que faltan del temporizador activo (0 si no hay)
  remaining(){const t=S.restTimer;return t?Math.max(0,Math.ceil((t.endTs-Date.now())/1000)):0;},
  // Resincroniza con el reloj real: al cargar, al volver a primer plano y al restaurar desde bfcache
  sync(){
    const t=S.restTimer;
    if(!t){if(!this._hideT)this._hideEl();return;}
    if(!_validRestTimer(t)){S.restTimer=null;saveState();this._hideEl();return;}
    if(t.kind==='rest'&&!_restOn()){S.restTimer=null;saveState();Beep.cancel();Beep.release();this._hideEl();return;} // (M1) apagado
    // Tras recargar la app con un descanso de una serie (en marcha o que terminó mientras tanto): el RPE de la barra vuelve
    // a ser el de esa serie, si sigue marcada
    if(!_rpeOpen&&_rpeOn()&&t.kind==='rest'&&Number.isInteger(t.setIdx)&&t.exId&&S.sets[t.exId]&&S.sets[t.exId][t.setIdx]){
      const ex=_dayEx(t.exId);if(ex&&!ex.cardio)_rpeOpen={exId:t.exId,setIdx:t.setIdx,ex,rest:true};
    }
    if(t.endTs<=Date.now()){this._complete(Date.now()-t.endTs>RT_LATE_MS);return;}
    clearTimeout(this._hideT);this._hideT=null;
    this._show();this._loop();
    this._resched();
    // Intento de reanudar el audio (Safari lo deja «interrupted» al volver); si exige gesto, se hará en el siguiente toque
    try{const c=Beep._get(false);if(c&&c.state!=='running'&&typeof c.resume==='function'){const p=c.resume();if(p&&p.then)p.then(()=>this._resched(),()=>{});}}catch(e){}
  },
  _resched(){const t=S.restTimer;if(t&&t.endTs>Date.now())Beep.schedule(t.endTs);},
  _loop(){
    clearInterval(this._tid);
    this._lastSec=null;
    this._tid=setInterval(()=>this._tick(),250);
    this._tick();
  },
  _tick(){
    const t=S.restTimer;
    if(!t){clearInterval(this._tid);this._tid=null;return;}
    const ms=t.endTs-Date.now();
    if(ms<=0){this._complete(-ms>RT_LATE_MS);return;}
    const sec=Math.ceil(ms/1000);
    if(sec!==this._lastSec){this._lastSec=sec;this._draw(sec,t.total);}
  },
  _show(){
    const t=S.restTimer,el=this._el('rest-timer');
    if(!t||!el)return;
    const cardio=t.kind==='cardio';
    el.classList.remove('done');el.classList.add('show');
    el.dataset.kind=t.kind;
    el.setAttribute('role','timer');el.removeAttribute('aria-label'); // (M1) por si era la barra del esfuerzo
    const lab=this._el('rt-label'),msg=this._el('rt-msg'),btn=this._el('rt-skip'),num=this._el('rt-num');
    if(lab)lab.textContent=cardio?'Cardio':'Descanso';
    if(msg)msg.textContent=t.label||(cardio?'Cardio':'Recuperando…');
    if(btn){btn.textContent=cardio?'Parar':'Saltar';btn.setAttribute('aria-label',cardio?'Parar el cardio':'Saltar el descanso');}
    if(num)num.classList.toggle('long',t.total>=600);
    this._doneT=null;
    this._paintRpe();
  },
  _draw(sec,total){
    RF.draw(sec,total); // modo a pantalla completa (si está abierto)
    const arc=this._el('rt-arc'),num=this._el('rt-num');
    if(!arc||!num)return;
    const pct=Math.max(0,Math.min(1,sec/total));
    arc.style.strokeDasharray=CIRC;arc.style.strokeDashoffset=CIRC*(1-pct);
    num.textContent=fmtClock(sec);
    arc.style.stroke=sec<=10?'var(--amber)':'var(--green)';
  },
  // Fin del temporizador. late=true → terminó mientras la app no corría (al volver / al recargar)
  _complete(late){
    const t=S.restTimer;
    clearInterval(this._tid);this._tid=null;this._lastSec=null;
    if(!t)return;
    // Consumirlo ANTES de ejecutar su final: así nunca se ejecuta dos veces (recarga, otro evento…)
    S.restTimer=null;
    const ago=Math.max(0,Date.now()-t.endTs);
    const marked=t.kind==='cardio'?_cardioAutoMark(t,ago):false;
    saveState();
    if(t.kind==='cardio'||!late||ago<=RT_SHOW_LATE_MS)this._showDone(t,late,ago,marked);
    else this._hideEl();
    if(!late)haptic([200,100,200]); // el pitido final ya estaba programado en el reloj de audio
    else Beep.cancel();
    Beep.release();
    if(marked){
      render();
      // Cardio terminado con su tarjeta abierta delante: se cierra y se abre el siguiente ejercicio (modo gym)
      if(!late&&S.tab==='workout'&&S.open===t.exId&&t.day===S.day)_scheduleAdvance(t.exId);
    }
    RF.render();WL.sync();
  },
  _showDone(t,late,ago,marked){
    const el=this._el('rest-timer');
    if(!el)return;
    const cardio=t.kind==='cardio';
    el.classList.add('show','done');
    el.dataset.kind=t.kind;el.setAttribute('role','timer');el.removeAttribute('aria-label');
    const num=this._el('rt-num'),msg=this._el('rt-msg'),lab=this._el('rt-label'),btn=this._el('rt-skip'),arc=this._el('rt-arc');
    if(num){num.textContent='✓';num.classList.remove('long');}
    if(arc){arc.style.strokeDasharray=CIRC;arc.style.strokeDashoffset=0;arc.style.stroke='';}
    if(lab)lab.textContent=cardio?'Cardio':'Descanso';
    const mins=Math.round(ago/60000);
    // Lo importante primero: la barra recorta el final del texto en pantallas estrechas
    if(msg)msg.textContent=cardio
      ?(marked?`¡Hecho! ✓ ${t.label||''}`:`¡Tiempo cumplido! ${t.label||''}`).trim()
      :(late&&mins>=1?`Terminó hace ${mins} min`:'¡Listo! Siguiente serie 💪');
    if(btn){btn.textContent='OK';btn.setAttribute('aria-label','Cerrar');}
    // El RPE de la serie sigue en la barra mientras se ve «¡Listo!» (se puede elegir tarde, sin otro descanso)
    this._doneT=t;this._paintRpe();
    clearTimeout(this._hideT);
    this._hideT=setTimeout(()=>{this._hideT=null;this._hideEl();},late?6000:4000);
  },
  _hideEl(){
    const el=this._el('rest-timer');
    if(el)el.classList.remove('show','done');
    this._doneT=null;this._paintRpe();
  },
  // Para y descarta el temporizador (y su final) sin ejecutarlo
  stop(){
    clearInterval(this._tid);this._tid=null;this._lastSec=null;
    clearTimeout(this._hideT);this._hideT=null;
    const had=!!S.restTimer;
    if(had){S.restTimer=null;saveState();}
    Beep.cancel();Beep.release();
    this._hideEl();
    RF.render();WL.sync();
    return had;
  },
  // Botón de la barra: «Saltar» (descanso) / «Parar» (cardio) / «OK» (ya terminado)
  skip(){
    // (M1) «✕» de la barra del esfuerzo (sin reloj): solo la cierra
    {const el=this._el('rest-timer');if(!S.restTimer&&el&&el.dataset.kind==='rpe'){closeRpeSelector();return;}}
    const wasCardio=!!(S.restTimer&&S.restTimer.kind==='cardio');
    this.stop();
    if(wasCardio)render(); // la tarjeta del cardio deja de mostrar «En marcha»
  },
  hide(){this.stop();},
  // Al desmarcar/deshacer series: cierra el DESCANSO pero nunca un cardio en marcha
  cancelRest(){
    if(S.restTimer&&S.restTimer.kind==='cardio'&&S.restTimer.endTs>Date.now())return false;
    return this.stop();
  },
  // ¿Hay un cardio en marcha para este ejercicio?
  cardioRunning(exId){const t=S.restTimer;return !!(t&&t.kind==='cardio'&&t.endTs>Date.now()&&(!exId||t.exId===exId));}
};
// Final del cardio: marca el ejercicio como hecho (una vez). Devuelve true si lo marcó.
function _cardioAutoMark(t,ago){
  if(!t||!t.exId)return false;
  if(ago>MAX_SESSION_MIN*60000)return false; // terminó hace horas: ya no pertenece a este entreno
  const plan=getPlan();
  const inPlan=(t.day&&plan[t.day]&&plan[t.day].ex.some(e=>e.id===t.exId))||Object.values(plan).some(d=>d.ex.some(e=>e.id===t.exId));
  if(!inPlan)return false;
  if(!S.sets[t.exId])S.sets[t.exId]={};
  if(S.sets[t.exId][0])return false;
  // El entreno empezó cuando arrancó el cardio (si aún no había nada marcado)
  if(!S.sessionStartTs&&t.startTs&&Date.now()-t.startTs<MAX_SESSION_MIN*60000)S.sessionStartTs=t.startTs;
  S.sets[t.exId][0]=true;
  syncActiveWorkout();
  return true;
}
// Inicio real de la sesión cuando lo primero fue un cardio con temporizador (para la duración)
function _cardioStartHint(){
  const t=S.restTimer;
  return(t&&t.kind==='cardio'&&t.startTs&&Date.now()-t.startTs<MAX_SESSION_MIN*60000)?t.startTs:null;
}
// ── PANTALLA ENCENDIDA DURANTE EL ENTRENO (Wake Lock, etapa 08) ─────────────────
// Con un entreno en curso (o un descanso/cardio en marcha) y la app a la vista se pide navigator.wakeLock('screen'):
// el móvil no se bloquea entre series. Se suelta al guardar/descartar la sesión, al apagarlo en Ajustes (S.keepAwake) y
// al pasar a segundo plano (el navegador también lo suelta solo; al volver se pide otra vez). Sin soporte o si el
// navegador lo deniega (ahorro de batería, iframe sin permiso…) no hace nada: ni errores ni reintentos hasta que vuelvas
// a la app o empiece otra sesión.
const WL={
  _s:null,_pending:false,_failed:false,requests:0,
  supported(){try{return !!(navigator.wakeLock&&typeof navigator.wakeLock.request==='function');}catch(e){return false;}},
  _want(){
    if(S.keepAwake===false||!S.onboarded)return false;
    if(document.visibilityState&&document.visibilityState!=='visible')return false;
    const t=S.restTimer;
    return !!(getActiveWorkout()||(t&&t.endTs>Date.now()));
  },
  sync(){
    let want=false;try{want=this._want();}catch(e){}
    if(!want){this._failed=false;if(this._s)this.release();return;}
    if((this._s&&!this._s.released)||this._pending||this._failed||!this.supported())return;
    this._pending=true;this.requests++;
    let p;
    try{p=navigator.wakeLock.request('screen');}catch(e){this._pending=false;this._failed=true;return;}
    Promise.resolve(p).then(s=>{
      this._pending=false;
      if(!s||typeof s!=='object'){this._failed=true;return;}
      this._s=s;
      try{s.addEventListener('release',()=>{if(this._s===s)this._s=null;});}catch(e){}
      // Mientras se concedía, la sesión terminó o la app pasó a segundo plano
      let still=false;try{still=this._want();}catch(e){}
      if(!still)this.release();
    },()=>{this._pending=false;this._failed=true;});
  },
  release(){
    const s=this._s;this._s=null;
    if(s){try{const r=s.release();if(r&&typeof r.catch==='function')r.catch(()=>{});}catch(e){}}
  },
  active(){return !!(this._s&&!this._s.released);}
};
function toggleKeepAwake(){
  S.keepAwake=S.keepAwake===false;
  saveState();WL.sync();
  const row=document.getElementById('set-awake');
  if(row){row.setAttribute('aria-checked',String(S.keepAwake));const sw=row.querySelector('.sw');if(sw)sw.classList.toggle('on',S.keepAwake);}
  toast(S.keepAwake?'🔆 La pantalla no se apagará mientras entrenas':'La pantalla se apagará como siempre');
}
// ── DESCANSO ENTRE SERIES: ENCENDIDO / APAGADO (M1) ─────────────────
// S.restOn (por defecto true). Apagado: al marcar una serie (o un calentamiento) no arranca ningún descanso (RT.start lo
// rechaza), no hay barra con reloj, modo a pantalla completa, ±15 s, «Saltar», pitidos ni vibración de fin, y la tarjeta
// no enseña «⏱ Descanso entre series». El esfuerzo de la serie se apunta igual en la barra, sin reloj (_rpeTargetFor).
// El cardio sigue con su cronómetro (RT kind 'cardio'). Lo elegido por ejercicio (S.restOverrides) no se toca.
function _restOn(){return S.restOn!==false;}
let _setRerender=false; // la lista de detrás cambia: se repinta al cerrar Ajustes (repintar ahora movería la hoja)
function toggleRestOn(){
  S.restOn=S.restOn===false;
  saveState();
  if(!S.restOn){
    // Un descanso en marcha (o su «¡Listo!») se para y se cierra lo suyo; el cardio sigue
    const t=S.restTimer;
    if(t&&t.kind==='rest')RT.stop();
    else if(!t&&RT._doneT&&RT._doneT.kind==='rest'){clearTimeout(RT._hideT);RT._hideT=null;RT._hideEl();}
    if(RF.open&&!(S.restTimer&&S.restTimer.kind==='cardio'))RF.close();
    if(_restPickEx)closeRestPicker();
  }
  try{RT._paintRpe();}catch(e){console.error(e);} // la barra del esfuerzo sin reloj aparece o se va
  _setRerender=true;
  // Actualizar solo las filas (sin re-render: la hoja no salta)
  const row=document.getElementById('set-rest');
  if(row){row.setAttribute('aria-checked',String(S.restOn));const sw=row.querySelector('.sw');if(sw)sw.classList.toggle('on',S.restOn);}
  const snd=document.querySelector('#set-sound .set-row-d');if(snd)snd.textContent=timerSoundDesc();
  toast(S.restOn?'⏱ Descanso entre series activado':'Descanso entre series desactivado: sin cuenta atrás');
}
// ── ESFUERZO DE CADA SERIE: ENCENDIDO / APAGADO (M2) ─────────────────
// S.rpeOn (por defecto true), gemelo de S.restOn. Apagado, la app ni pregunta el esfuerzo ni lo usa: sin chips (😌 💪 🥵) en
// la barra del descanso, en el modo a pantalla completa ni en la barra sin reloj (_rpeTargetFor → null), el descanso con su
// duración normal (_rpeRest), y el Coach y las pantallas como si no hubiera esfuerzo apuntado (rpeCat → null y _rpeOn() en
// las lecturas directas: fatiga, zonas, estadística, historial, ficha, resumen). Lo apuntado (S.rpe, rec.rpe,
// rec.sets[i].rpe) no se borra: al encenderlo vuelve todo como estaba.
function _rpeOn(){return S.rpeOn!==false;}
function toggleRpeOn(){
  S.rpeOn=S.rpeOn===false;
  saveState();
  if(!S.rpeOn){
    // Fuera los chips que estén a la vista (lo ya apuntado se queda); un descanso en marcha vuelve a su duración normal
    closeRpeSelector();
    const t=S.restTimer;if(t&&t.kind==='rest'&&t.exId)RT.rebase(t.exId);
  }
  _setRerender=true;
  const row=document.getElementById('set-rpe');
  if(row){row.setAttribute('aria-checked',String(S.rpeOn));const sw=row.querySelector('.sw');if(sw)sw.classList.toggle('on',S.rpeOn);}
  toast(S.rpeOn?'💪 Esfuerzo de cada serie activado':'Esfuerzo de cada serie desactivado');
}

// ── DESCANSO POR EJERCICIO (v19) ────────────────────────────────
// Automático por tipo: aislamiento 60 s, multiarticular 90 s y, si es pesado (8 reps o menos en su rango), 120 s.
// Lo que elijas para un ejercicio (tarjeta «⏱ Descanso entre series» o el modo descanso) se guarda en S.restOverrides.
const REST_DEF={iso:60,comp:90,heavy:120};
function restDefaultSecs(ex){
  {const g=_genRestSecs(ex);if(g)return g.s;} // (E5) con rutina generada, los de tu rutina por la carga de cada serie
  if(!isCompoundEx(ex))return REST_DEF.iso;
  const rr=repRange(ex);
  return rr&&rr.hi<=8?REST_DEF.heavy:REST_DEF.comp;
}
function restDefaultWhy(ex){
  {const g=_genRestSecs(ex);if(g)return`${(S.profile&&_GOAL_LBL[S.profile.goal])||'Tu rutina'}: ${fmtClock(g.s)} en ${_GEN_REST_WHY[g.cat]}`;}
  if(!isCompoundEx(ex))return`aislamiento: ${fmtClock(REST_DEF.iso)} por defecto`;
  const rr=repRange(ex);
  return rr&&rr.hi<=8?`multiarticular con 8 reps o menos: ${fmtClock(REST_DEF.heavy)} por defecto`:`multiarticular: ${fmtClock(REST_DEF.comp)} por defecto (${fmtClock(REST_DEF.heavy)} con 8 reps o menos)`;
}
function _restOverrideOf(id){
  const o=S.restOverrides,v=o&&typeof o==='object'?o[id]:null;
  return typeof v==='number'&&isFinite(v)&&v>=REST_MIN_S&&v<=REST_MAX_S?Math.round(v):null;
}
// Guarda (o con null quita) el descanso elegido para un ejercicio. Si su descanso está en marcha, se recalcula ya.
function setRestOverride(exId,secs){
  if(typeof exId!=='string'||!/^[\w.:-]{1,64}$/.test(exId))return false;
  if(!_isPlainObj(S.restOverrides))S.restOverrides={};
  if(secs==null)delete S.restOverrides[exId];
  else{
    secs=Math.round(+secs);
    if(!(secs>=REST_MIN_S&&secs<=REST_MAX_S))return false;
    if(!(exId in S.restOverrides)&&Object.keys(S.restOverrides).length>=REST_OVR_MAX)return false;
    S.restOverrides[exId]=secs;
  }
  saveState();
  const t=S.restTimer;
  if(t&&t.kind==='rest'&&t.exId===exId&&Number.isInteger(t.setIdx)&&t.endTs>Date.now()){t.adj=0;RT.rebase(exId);}
  const ex=_dayEx(exId);
  toast(`⏱ Descanso${ex&&ex.n?' de '+ex.n:''}: ${fmtClock(getRestSecs(exId))}${secs==null?' (automático)':''}`);
  render();
  return true;
}
// Control de la tarjeta (debajo de las series)
function restCtlHtml(ex){
  if(!_restOn())return''; // (M1) descanso entre series apagado: la tarjeta no lo enseña
  const o=_restOverrideOf(ex.id),s=getRestSecs(ex.id),eid=esc(ex.id);
  return`<button type="button" class="lg-rest" data-ex="${eid}" onclick="openRestPicker(this.dataset.ex)" aria-label="Descanso entre series: ${fmtClock(s)}${o==null?', automático':''}. Cambiar"><span>⏱ Descanso<span class="lg-rest-x"> entre series</span></span> <b>${fmtClock(s)}</b>${o==null?'<span class="lg-rest-k">auto</span>':''}<span class="lg-rest-go" aria-hidden="true">Cambiar ›</span></button>`;
}
const REST_OPTS=[45,60,75,90,105,120,150,180,240];
let _restPickEx=null;
function openRestPicker(exId){
  const ex=_dayEx(exId),root=document.getElementById('cmodal-root');
  if(!ex||ex.cardio||!root||!_restOn())return;
  _restPickEx=ex.id;
  const def=restDefaultSecs(ex),cur=_restOverrideOf(ex.id),opts=REST_OPTS.slice();
  if(cur!=null&&!opts.includes(cur)){opts.push(cur);opts.sort((a,b)=>a-b);}
  root.innerHTML=`<div class="cmov" onclick="if(event.target===this)closeRestPicker()"><div class="cmod" role="dialog" aria-label="Descanso entre series">
    <div class="cmod-hdl"></div>
    <div class="cmod-t">Descanso entre series</div>
    <div class="cmod-b"><b style="color:var(--text);font-weight:600">${esc(ex.n)}</b> · ${esc(restDefaultWhy(ex))}. Lo que elijas se guarda para este ejercicio${_rpeOn()?'; el RPE de cada serie lo ajusta (fácil −15 %, al límite +15 %)':''}.</div>
    <div class="rest-opts" id="rest-opts">
      <button type="button" class="rest-opt auto" aria-pressed="${cur==null}" onclick="pickRest(null)">Automático · ${fmtClock(def)}</button>
      ${opts.map(s=>`<button type="button" class="rest-opt" data-s="${s}" aria-pressed="${cur===s}" onclick="pickRest(${s})">${fmtClock(s)}${s===def?'<small>auto</small>':''}</button>`).join('')}
    </div>
    <div class="cmod-btns"><button class="btn bs" onclick="closeRestPicker()">Cerrar</button></div>
  </div></div>`;
}
function closeRestPicker(){_restPickEx=null;const r=document.getElementById('cmodal-root');if(r)r.innerHTML='';}
function pickRest(secs){const id=_restPickEx;closeRestPicker();if(id)setRestOverride(id,secs);}

// ── MODO DESCANSO A PANTALLA COMPLETA (etapa 08) ─────────────────
// Se abre al tocar la barra del descanso: mm:ss enorme, anillo que se vacía (ámbar en los últimos 10 s), −15 s / +15 s,
// Saltar, el RPE de la serie (3 chips, se puede cambiar mientras dura), el descanso de ese ejercicio y la siguiente serie
// («Serie 2/3 · 55 kg × 12») con «✓ Hecho». Si el ejercicio ya está terminado, el siguiente con su maniquí 3D en
// miniatura (GymAnim). Se queda abierto entre series («¡Listo!» al acabar) mientras haya un entreno en curso; ✕ o Escape
// lo cierran. Solo en memoria (no se guarda en S).
const RF_CIRC=2*Math.PI*54;
const RF={
  open:false,_t:null,_pvEl:null,_pvKey:'',_act:null,_prevFocus:null,
  _el(id){return document.getElementById(id);},
  // Temporizador que se muestra: el que está en marcha o el último que se vio con el modo abierto
  _timer(){const t=S.restTimer;if(t)this._t=t;return t||this._t;},
  openFull(){
    const t=S.restTimer||RT._doneT;
    if(!t||!S.onboarded)return false;
    const root=this._el('restfull-root');if(!root)return false;
    this._t=t;
    if(!this.open||!this._el('rest-full')){
      this._prevFocus=document.activeElement;
      root.innerHTML=`<div class="rf" id="rest-full" role="dialog" aria-modal="true" aria-labelledby="rf-lbl">
        <div class="rf-in">
          <div class="rf-top"><div class="rf-h"><div class="rf-lbl" id="rf-lbl">Descanso</div><div class="rf-name" id="rf-name"></div></div>
            <button type="button" class="rf-x" id="rf-x" onclick="RF.close()" aria-label="Cerrar el modo descanso">✕</button></div>
          <div class="rf-ring" id="rf-ring" role="timer" aria-live="off">
            <svg viewBox="0 0 120 120" aria-hidden="true"><circle class="rf-bg" cx="60" cy="60" r="54"/><circle class="rf-fg" id="rf-arc" cx="60" cy="60" r="54"/></svg>
            <div class="rf-c"><div class="rf-num" id="rf-num"></div><div class="rf-of" id="rf-of"></div></div>
          </div>
          <div class="rf-ctl" id="rf-ctl"></div>
          <div class="rf-rpe" id="rf-rpe"></div>
          <div class="rf-ovr" id="rf-ovr"></div>
          <div class="rf-next" id="rf-next"><div class="rf-pv" id="rf-pv"></div><div class="rf-nt" id="rf-nt"></div><button type="button" class="rf-go" id="rf-go" onclick="rfGo()"></button></div>
        </div></div>`;
      this.open=true;
      this._toastIn();
    }
    this.render();
    try{const x=this._el('rf-x');if(x)x.focus({preventScroll:true});}catch(e){}
    return true;
  },
  close(){
    if(!this.open&&!this._el('rest-full'))return;
    this.open=false;this._t=null;this._act=null;
    this._pv('');
    this._toastOut(); // antes de vaciar: el aviso vuelve a su sitio (arriba, flotante)
    const root=this._el('restfull-root');if(root)root.innerHTML='';
    const f=this._prevFocus;this._prevFocus=null;
    try{if(f&&f.isConnected&&typeof f.focus==='function')f.focus({preventScroll:true});}catch(e){}
  },
  // (16) El aviso (#toast, el mismo elemento: sus clases, temporizadores y «Deshacer» siguen igual) entra en el modo,
  // en el flujo y justo encima de la tarjeta «Siguiente»; así nunca tapa el reloj ni los controles
  _toastHome:null,
  _toastIn(){
    this._toastOut(); // por si el modo se rehízo sin cerrarse (el aviso no se pierde con él)
    const t=this._el('toast'),inn=document.querySelector('#rest-full .rf-in'),nx=this._el('rf-next');
    if(!t||!inn||!nx)return;
    this._toastHome={t,p:t.parentNode,n:t.nextSibling};
    inn.insertBefore(t,nx);
    this._toastSeen();
  },
  _toastOut(){
    const h=this._toastHome;this._toastHome=null;
    const t=h?h.t:this._el('toast');
    if(!t||(t.isConnected&&!t.closest('#rest-full')))return;
    const p=h&&h.p&&h.p.isConnected?h.p:document.body,n=h&&h.n&&h.n.parentNode===p?h.n:null;
    p.insertBefore(t,n);
  },
  // Aviso nuevo con el modo abierto: si quedó fuera de la vista (pantalla baja, lista desplazada), se trae lo justo
  _toastSeen(){
    const t=this._el('toast'),rf=this._el('rest-full');
    if(!t||!rf||!t.classList.contains('show')||t.parentNode!==rf.querySelector('.rf-in'))return;
    const r=t.getBoundingClientRect(),fr=rf.getBoundingClientRect(),top=rf.querySelector('.rf-top');
    // Nunca más allá de lo que deja la cabecera (DESCANSO, nombre y ✕) entera a la vista
    const cap=top?Math.max(0,top.getBoundingClientRect().top-fr.top-4):Infinity;
    if(r.bottom>fr.bottom-8)rf.scrollTop+=Math.min(r.bottom-fr.bottom+8,cap);
    else if(r.top<fr.top+8)rf.scrollTop-=fr.top+8-r.top;
  },
  // Pone html en el elemento solo si cambió (no se pierde el foco ni el toque en curso)
  _set(id,h){const el=this._el(id);if(el&&el.dataset.h!==h){el.innerHTML=h;el.dataset.h=h;}return el;},
  // Maniquí del siguiente ejercicio (miniatura: < 170×110, sin HUD). key '' = quitarlo
  _pv(key){
    const el=this._el('rf-pv');
    if(key&&key===this._pvKey&&this._pvEl===el&&el&&el._ga)return;
    if(this._pvEl){try{if(typeof GymAnim!=='undefined')GymAnim.unmount(this._pvEl);}catch(e){}}
    this._pvEl=null;this._pvKey='';
    if(!key||!el||typeof GymAnim==='undefined')return;
    try{el._gaMounted=1;if(GymAnim.mount(el,key)){this._pvEl=el;this._pvKey=key;}}catch(e){console.error(e);}
  },
  // Repinta todo menos el número y el anillo (draw). Se llama tras cada cambio: render(), RPE, ±15 s, fin, Saltar…
  render(){
    if(!this.open)return;
    const root=this._el('rest-full');if(!root){this.open=false;this._pv('');this._toastOut();return;}
    const t=this._timer(),rt=S.restTimer,running=!!(rt&&rt.endTs>Date.now());
    // Sin descanso en marcha ni entreno en curso (guardado, descartado, importado…) ya no hay nada que mostrar
    if(!t||(!running&&!getActiveWorkout())){this.close();return;}
    const cardio=t.kind==='cardio',ex=t.exId?_dayEx(t.exId):null,si=Number.isInteger(t.setIdx)?t.setIdx:null;
    root.dataset.kind=t.kind;root.classList.toggle('done',!running);
    const lbl=this._el('rf-lbl');if(lbl)lbl.textContent=cardio?'Cardio':'Descanso';
    const nm=this._el('rf-name');
    if(nm)nm.textContent=ex&&si!=null&&!ex.cardio?`${ex.n} · serie ${si+1}/${Math.max(1,parseInt(ex.s)||1)} hecha`:(t.label||(ex?ex.n:''));
    // Controles: −15 s / Saltar / +15 s (descanso) · Parar (cardio) · Volver al entreno (ya terminado)
    this._set('rf-ctl',!running?`<button type="button" class="rf-b rf-skip" onclick="RF.close()">Volver al entreno</button>`
      :cardio?`<button type="button" class="rf-b rf-skip" id="rf-skip" onclick="RT.skip()">■ Parar</button>`
      :`<button type="button" class="rf-b" id="rf-minus" onclick="RT.addSecs(-15)" aria-label="Quitar 15 segundos">−15 s</button><button type="button" class="rf-b rf-skip" id="rf-skip" onclick="RT.skip()">Saltar</button><button type="button" class="rf-b" id="rf-plus" onclick="RT.addSecs(15)" aria-label="Añadir 15 segundos">+15 s</button>`);
    // RPE de la serie (mientras dura el descanso y al acabar, como en la barra)
    const tg=_rpeTargetFor(t);
    if(tg){
      const n=Math.max(1,parseInt(tg.ex&&tg.ex.s)||1),lvl=+(((S.rpe||{})[tg.exId]||{})[tg.setIdx])||0;
      this._set('rf-rpe',`<div class="rf-q">¿Qué tal la <b>serie ${tg.setIdx+1}</b>? El descanso se ajusta</div><div class="rf-chips" role="group" aria-label="¿Qué tal la serie ${tg.setIdx+1} de ${n}?">${rpeChipsHtml(lvl,true)}</div>`);
    }else this._set('rf-rpe','');
    // Descanso de este ejercicio: automático o el elegido; tras usar ±15 s, guardarlo para la próxima
    if(running&&!cardio&&ex&&!ex.cardio&&si!=null){
      const o=_restOverrideOf(ex.id),cur=getRestSecs(ex.id),adj=Math.round(+rt.adj)||0,save=Math.round((+rt.base||cur)+adj);
      const canSave=adj!==0&&save>=REST_MIN_S&&save<=REST_MAX_S&&save!==cur;
      this._set('rf-ovr',`<div class="rf-ovr-t">⏱ Este ejercicio: <b>${fmtClock(cur)}</b>${o==null?' · auto':''}</div>${canSave
        ?`<button type="button" class="save" id="rf-save" onclick="rfSaveRest()">Usar ${fmtClock(save)} siempre</button>`
        :`<button type="button" id="rf-change" data-ex="${esc(ex.id)}" onclick="openRestPicker(this.dataset.ex)">Cambiar</button>`}`);
    }else this._set('rf-ovr',running&&cardio?`<div class="rf-ovr-t">Al terminar se marca como hecho ✓</div>`:'');
    // Siguiente: serie de este ejercicio, o el siguiente ejercicio con su maniquí en miniatura
    const box=this._el('rf-next');
    if(running&&cardio){if(box)box.hidden=true;this._act=null;this._pv('');}
    else if(box){
      box.hidden=false;
      const nx=_rfTarget(t);let key='',act,goTxt,h;
      if(!nx){
        act='save';goTxt='Guardar';
        h=`<div class="rf-nl">Siguiente</div><div class="rf-nn">Fuerza completada 🎉</div><div class="rf-ns">Guarda tu entreno cuando termines</div>`;
      }else if(nx.cardio){
        act='open';goTxt='Ir al cardio';key=exAnimKey(nx.ex);
        h=`<div class="rf-nl">Siguiente ejercicio</div><div class="rf-nn">${esc(nx.ex.n)}</div><div class="rf-ns">${esc(nx.ex.r||'')}</div>`;
      }else{
        const rows=setRows(nx.ex),row=rows[nx.i]||{},val=_setValTxt(nx.ex,row);
        act='done';goTxt='✓ Hecho';
        if(nx.same){
          const g=_ghostTxt(getLastW(nx.ex.id),nx.i);
          // (09) pista de récord para esa serie («🏆 Haz 11 reps para nuevo récord»)
          const lv=prLive(nx.ex,rows),ph=lv.next===nx.i?prHintTxt(lv.hint):'';
          h=`<div class="rf-nl">Siguiente serie</div><div class="rf-nn">Serie ${nx.i+1}/${rows.length} · <span class="rf-nv">${_nwX(esc(val))}</span></div>${g?`<div class="rf-ns">${esc(g)}</div>`:''}${ph?`<div class="rf-ns rf-pr">${esc(ph)}</div>`:''}`;
        }else{
          key=exAnimKey(nx.ex);
          h=`<div class="rf-nl">Siguiente ejercicio</div><div class="rf-nn">${esc(nx.ex.n)}</div><div class="rf-ns">Serie ${nx.i+1}/${rows.length} · <b>${_nwX(esc(val))}</b></div>`;
        }
      }
      this._act=act;
      box.classList.toggle('pv',!!key); // primero el tamaño: el motor mide el contenedor al montar
      this._set('rf-nt',h);
      const go=this._el('rf-go');
      if(go){go.textContent=goTxt;go.classList.toggle('sec',act==='open');go.setAttribute('aria-label',act==='done'&&nx?`Marcar hecha la serie ${nx.i+1} de ${nx.ex.n}`:goTxt);}
      this._pv(key);
    }
    if(running)this.draw(RT.remaining(),rt.total);
    else{
      const num=this._el('rf-num'),arc=this._el('rf-arc'),of=this._el('rf-of'),ring=this._el('rf-ring');
      if(num){num.textContent='¡Listo!';num.classList.remove('warn');}
      if(arc){arc.style.strokeDasharray=RF_CIRC;arc.style.strokeDashoffset=0;arc.classList.remove('warn');}
      if(of)of.textContent=cardio?'Cardio terminado ✓':'A por la siguiente 💪';
      if(ring)ring.setAttribute('aria-label',cardio?'Cardio terminado':'Descanso terminado');
    }
  },
  // Número y anillo (cada segundo, desde RT._draw)
  draw(sec,total){
    if(!this.open)return;
    const num=this._el('rf-num'),arc=this._el('rf-arc'),of=this._el('rf-of'),ring=this._el('rf-ring');
    if(!num||!arc)return;
    const pct=Math.max(0,Math.min(1,sec/(total||1))),warn=sec<=10;
    arc.style.strokeDasharray=RF_CIRC;arc.style.strokeDashoffset=RF_CIRC*(1-pct);
    arc.classList.toggle('warn',warn);num.classList.toggle('warn',warn);
    num.textContent=fmtClock(sec);
    if(of)of.textContent='de '+fmtClock(total);
    if(ring)ring.setAttribute('aria-label',`Quedan ${fmtClock(sec)} de ${fmtClock(total)}`);
  }
};
// Tocar la barra del descanso (fuera de sus botones) abre el modo a pantalla completa
function rtBarTap(e){
  const tg=e&&e.target;
  if(tg&&tg.closest&&tg.closest('button'))return;
  RF.openFull();
}
// Texto de la serie: «57.5 kg × 12», «12 reps» (peso corporal), «— kg × 12» (sin peso); por tiempo o distancia
// «45 s» / «30 m», con peso «10 kg · 45 s»
function _setValTxt(ex,row){
  const lt=exLT(ex);
  if(lt==='t'||lt==='d'){
    const x=row?row[lt]:null,xt=x!=null?(lt==='t'?fmtSecs(x):fmtM(x)):fmtTargetReps(ex);
    return row&&row.w!=null?_kgNB(row.w)+NBD+xt:xt;
  }
  const reps=row&&row.r!=null?row.r:null,rr=reps!=null?reps:fmtTargetReps(ex);
  // Sin kilos (peso corporal, solo reps) «12 reps» sin partir; peso × reps, igual que siempre
  return row&&row.w!=null?`${kgTxt(row.w)} kg × ${rr}`:isBodyweightEx(ex)?(reps!=null?_repsNB(reps):rr):`— kg × ${rr}`;
}
// Siguiente cosa por hacer tras el descanso t (en el día de ese descanso): otra serie del mismo ejercicio; si ya está
// terminado, el siguiente ejercicio sin terminar (fuerza o cardio) o la primera serie pendiente del día; null si no queda.
function _rfTarget(t){
  const plan=getPlan(),dk=t&&t.day&&plan[t.day]?t.day:S.day,d=plan[dk];
  if(!d||!Array.isArray(d.ex))return null;
  const exs=d.ex,str=e=>!!(e&&!e.cardio&&parseInt(e.s)>0);
  const cur=t&&t.exId?exs.find(e=>e.id===t.exId):null;
  if(str(cur)&&!_exComplete(cur)){const i=_firstUndone(cur);if(i>=0)return{dk,ex:cur,i,same:true};}
  const k=cur?exs.indexOf(cur):-1;
  const nx=(k>=0?exs.slice(k+1).find(e=>(e.cardio||str(e))&&!_exComplete(e)):null)
    ||exs.find(e=>str(e)&&countSetsDone(e.id,e.s)>0&&!_exComplete(e))
    ||exs.find(e=>str(e)&&!_exComplete(e))
    ||exs.find(e=>e.cardio&&!_exComplete(e))||null;
  if(!nx)return null;
  if(nx.cardio)return{dk,ex:nx,cardio:true};
  const i=_firstUndone(nx);
  return i>=0?{dk,ex:nx,i,same:false}:null;
}
// «✓ Hecho» del modo descanso: marca la siguiente serie con sus valores (y arranca su descanso). Doble toque = una.
function rfDone(){
  const now=Date.now();if(now-_barMarkTs<MARK_GUARD_MS)return false;
  const tg=_rfTarget(RF._timer());if(!tg||tg.cardio||!(tg.i>=0))return false;
  _barMarkTs=now;
  if(S.day!==tg.dk||S.tab!=='workout'){S.day=tg.dk;if(S.tab!=='workout')go('workout');}
  toggleSet(tg.ex.id,tg.i,{src:'full'});
  return true;
}
function rfGo(){
  const a=RF._act;
  if(a==='done'){rfDone();return;}
  const tg=_rfTarget(RF._timer());
  RF.close();
  if(a==='save'){finishSession();return;}
  if(a==='open'&&tg){
    if(S.day!==tg.dk||S.tab!=='workout'){S.day=tg.dk;if(S.tab!=='workout')go('workout');}
    _uiGen++;S.open=tg.ex.id;render();_scrollToCard(tg.ex.id);
  }
}
// «Usar 1:45 siempre»: el descanso de este ejercicio pasa a ser el de ahora con lo sumado/quitado con ±15 s
function rfSaveRest(){
  const t=S.restTimer;if(!t||t.kind!=='rest'||!t.exId)return false;
  return setRestOverride(t.exId,Math.round((+t.base||getRestSecs(t.exId))+(Math.round(+t.adj)||0)));
}
// Resincronizar al volver a la app (iOS congela la PWA en segundo plano) y al restaurar desde bfcache
// (08) Al pasar a segundo plano se suelta la pantalla encendida; al volver se pide otra vez si sigue el entreno.
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible'){RT.sync();try{if(S.onboarded&&deloadTick())render();}catch(e){console.error(e);}}
  try{WL.sync();}catch(e){}
});
window.addEventListener('pageshow',()=>RT.sync());
// Con un temporizador activo, el siguiente toque desbloquea el audio (p. ej. tras recargar la app)
['pointerup','touchend','click','keydown'].forEach(ev=>document.addEventListener(ev,()=>{
  if(!S.restTimer||!Beep.on())return;
  const c=Beep._get(false);
  if(!c||c.state!=='running')Beep.unlock();
},{capture:true,passive:true}));

// Descanso entre series de un ejercicio (s): el que elegiste para él (S.restOverrides) o el automático por tipo
function getRestSecs(id){
  const o=_restOverrideOf(id);
  if(o!=null)return o;
  // Resolver al objeto ejercicio para detectar compuestos vía isCompoundEx (resistente a swaps)
  const ex=Object.values(getPlan()).flatMap(d=>d.ex).find(e=>e.id===id);
  return restDefaultSecs(ex);
}

// Cronómetro de cardio: mismo temporizador (con hora de fin) en modo «cardio»; al acabar marca el ejercicio
// como hecho, también si terminó con la app en segundo plano o cerrada (se hace al volver).
function startCardioTimer(exId,mins){
  const ex=_dayEx(exId); // (E1a) con guarda: el día abierto puede haber cambiado
  if(!ex)return;
  mins=+mins;
  if(!(mins>0))return;
  syncActiveWorkout();
  saveState();
  if(!_restOn())closeRpeSelector(); // (M1) la barra del esfuerzo sin reloj deja sitio al cardio (y no vuelve al acabar)
  RT.start(Math.round(mins*60),ex.n,{kind:'cardio',exId,day:S.day});
  haptic([60]);
  render(); // la tarjeta pasa a «En marcha»
}

// ── CALENTAMIENTO ACTIVO ──
// Peso objetivo de HOY para calcular el calentamiento:
// el que ya hayas escrito para hoy → si no, el objetivo del Coach de carga (coach_prescribe: también si toca bajar)
// → si no, el último. Sin historial no hay calentamiento (null).
function getWarmupTarget(ex){
  if(!ex)return null;
  const lw=getLastW(ex.id);
  const last=lw?+lw.v:0;
  if(!(last>0))return null;
  const typed=parseFloat((S.logs[ex.id]||{}).w);
  if(typed>0&&typed<1000)return typed;
  const p=coach_prescribe(ex.id);
  return p&&p.weight>0?p.weight:last;
}
// Devuelve series de calentamiento sugeridas, o null si el ejercicio no las necesita.
// Los pesos se redondean al salto de su equipo (2.5 kg en Smith, 1 kg en mancuernas…). Solo con peso × reps (el lastre de
// unas flexiones o el peso de un paseo no se calientan así). Con pesas fijas (kettlebell, discos) cada serie es una pesa
// que existe (al menos un salto) y, si las dos salen iguales, queda una.
function getWarmupSets(ex){
  if(!ex||ex.cardio)return null;
  if(exLT(ex)!=='w')return null;
  if(!isCompoundEx(ex))return null;
  // (E6, §G.4, C-32) con rutina generada: nada si empiezas de cero, vas con cuidado o tienes 65 o más; en el primer básico pesado de
  // «Ganar fuerza» (6 repeticiones o menos), sube en 3 pasos hasta tu peso
  const pm=_isPlainObj(S.planMeta)?S.planMeta:null;
  if(pm&&(pm.modes||[]).some(m=>['inicio','prudente','mayor','mayor75'].includes(m)))return null;
  const target=getWarmupTarget(ex);
  if(!target||target<20)return null; // peso muy bajo no necesita warmup
  const st=loadStepOf(ex)||2.5,rd=v=>_r2(Math.round(v/st)*st);
  const L=exLib(ex),rr=repRange(ex),lift=!!(pm&&L&&S.profile&&S.profile.goal==='fuerza'&&(pm.lifts||[]).includes(L.id)&&rr&&rr.hi<=6);
  const out=lift?[{pct:40,w:rd(target*0.4),reps:5},{pct:60,w:rd(target*0.6),reps:3},{pct:80,w:rd(target*0.8),reps:2}]:[
    {pct:50,w:rd(target*0.5),reps:8},
    {pct:75,w:rd(target*0.75),reps:5}
  ];
  const cls=loadEqClass(ex);
  if(cls!=='kb'&&cls!=='disco')return out;
  const ok=out.filter(s=>s.w>=st-1e-9);
  if(ok.length===2&&Math.abs(ok[0].w-ok[1].w)<0.01)ok.pop();
  return ok.length?ok:null;
}
// Bloque de calentamiento de la tarjeta (va dentro de .wu-slot para poder refrescarlo al escribir el peso)
function warmupBlockHtml(ex){
  const wu=getWarmupSets(ex);
  if(!wu||(S.warmups[ex.id]&&S.warmups[ex.id]._skipped))return'';
  const w=S.warmups[ex.id]||{};
  if(wu.every((_,i)=>w[i]))return`<div class="warmup-block" style="opacity:.6">
    <div class="warmup-h"><span class="warmup-h-l">🔥 Calentamiento ✓</span></div>
  </div>`;
  return`<div class="warmup-block">
    <div class="warmup-h">
      <span class="warmup-h-l">🔥 Calentamiento sugerido<span style="opacity:.8">${NB}·</span> <span style="font-family:'DM Sans',sans-serif;text-transform:none;letter-spacing:0;font-weight:500;opacity:.8;white-space:nowrap">${esc(getWarmupTarget(ex))} kg</span></span>
      <button class="warmup-skip" data-ex="${esc(ex.id)}" onclick="skipWarmup(this.dataset.ex)">Saltar</button>
    </div>
    ${wu.map((s,i)=>`<div class="warmup-row">
      <button class="warmup-sb ${w[i]?'on':''}" data-ex="${esc(ex.id)}" onclick="toggleWarmupSet(this.dataset.ex,${i})" aria-label="Calentamiento ${i+1}">${w[i]?'✓':i+1}</button>
      <div class="warmup-info"><b>${s.w} kg</b> × ${s.reps} reps <span style="color:var(--text3)">(${s.pct}${NB}%)</span></div>
    </div>`).join('')}
  </div>`;
}

function toggleWarmupSet(exId,wIdx){
  if(!S.warmups[exId])S.warmups[exId]={};
  const wasOff=!S.warmups[exId][wIdx];
  S.warmups[exId][wIdx]=!S.warmups[exId][wIdx];
  saveState();render();
  // Tras calentar, descanso corto (45s) · (M1) nunca con el descanso entre series apagado
  if(wasOff&&_restOn()){
    const ex=_dayEx(exId);
    if(ex)RT.start(45,ex.n+' · calentamiento',{exId});
  }
}

function skipWarmup(exId){
  // Marcar todas como saltadas
  if(!S.warmups[exId])S.warmups[exId]={};
  S.warmups[exId]._skipped=true;
  saveState();render();
}

