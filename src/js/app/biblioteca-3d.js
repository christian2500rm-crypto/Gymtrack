// ══════════════════════════════════════════════════════════
// BIBLIOTECA 3D Y «MÁQUINA OCUPADA» (11)
// ══════════════════════════════════════════════════════════
// Miniaturas del motor (GymAnim.thumb: el fotograma de máxima contracción, sin HUD): icono recortado a la figura
// (tarjetas de Entreno, editor, alternativas) y tarjeta con su fondo (selector). Se generan una vez, en tiempo libre,
// y se guardan en IndexedDB (versionadas con el motor y el ejercicio). El emoji queda debajo como respaldo.
// TH_CARD: la de las filas del selector, a su tamaño en pantalla (72×48; antes 168×112 reducida: 5 veces más píxeles
// que dibujar y codificar, unos 50 ms por miniatura en un móvil medio frente a ~20, y 6 KB en caché frente a ~2,7)
const TH_IC={w:56,h:56,fit:'body'},TH_CARD={w:72,h:48,fit:'scene',bg:'scene'};
function _thKeyOf(x){
  if(typeof GymAnim==='undefined'||!GymAnim.thumbCached)return'';
  if(typeof x==='string')return GymAnim.has(x)?x:'';
  return exAnimKey(x)||'';
}
// <img> de la miniatura de un ejercicio (o de una clave del motor). Si ya está en caché sale con su src; si no, la
// rellena GymAnim.thumbLazy cuando se ve (thumbsIn tras pintar). own (filas del selector): sin caché sale «en espera»
// (data-ga-st="w", que el motor no toca) y data-pk-th, y la rellena el cargador propio del selector (_pkThWatch).
function thumbImgHtml(x,P,own){
  const k=_thKeyOf(x);if(!k)return'';
  let src=null;try{src=GymAnim.thumbCached(k,P.w,P.h,P);}catch(e){src=null;}
  return`<img class="ga-th${src?' ga-on':''}" alt="" aria-hidden="true" draggable="false" decoding="async" data-ga-thumb="${esc(k)}" data-gw="${P.w}" data-gh="${P.h}"${P.fit==='body'?' data-gfit="body"':''}${P.bg?` data-gbg="${esc(P.bg)}"`:''}${src?` src="${esc(src)}" data-ga-st="ok"`:own&&_pkThOk()?' data-ga-st="w" data-pk-th=""':''}>`;
}
// Icono de un ejercicio (dentro de un .exic): miniatura 3D encima del emoji
function exIconHtml(ex){return`${thumbImgHtml(ex,TH_IC)}<span class="exic-e">${esc(ex&&ex.ic||'💪')}</span>`;}
// Solo si hay alguna por empezar: así la caché de IndexedDB no se lee al arrancar en Inicio (que no tiene miniaturas),
// sino al abrir lo primero que las usa (Entreno, editor, selector), cuando «HOY TOCA» ya no ocupa el hilo principal
function thumbsIn(root){if(root&&typeof GymAnim!=='undefined'&&GymAnim.thumbLazy&&root.querySelector('img[data-ga-thumb]:not([data-ga-st])')){try{GymAnim.thumbLazy(root);}catch(e){console.error(e);}}}

// ── Miniaturas del selector: solo las filas que se ven, de arriba abajo y con el dedo quieto ──
// GymAnim.thumbLazy tiene una cola FIFO que no vuelve a mirar qué se ve: al recorrer «Todo» (386 filas) en frío, las
// de pantalla esperaban detrás de todas las que ya pasaron (minutos de tareas largas, toques lentos). Aquí cada fila sin
// caché sale «en espera»; un IntersectionObserver de la hoja vigila los <ul> de filas (decenas de objetivos, no cientos:
// cada uno cuesta en cada fotograma del desplazamiento) y, en tiempo libre, las de caché de esos tramos se ponen al
// momento; 140 ms después del último desplazamiento se dibuja la fila en pantalla de más arriba (una por hueco). Lo que
// sale de la vista se olvida hasta que vuelva. Sin IntersectionObserver, el motor como siempre.
const _pkTh={io:null,sh:null,vis:new Set(),t:0,last:0,ready:false,on:null};
function _pkThOk(){return typeof IntersectionObserver==='function'&&typeof GymAnim!=='undefined'&&!!GymAnim.thumb&&!!GymAnim.thumbReady;}
function _pkThStop(){
  if(_pkTh.io)_pkTh.io.disconnect();if(_pkTh.sh&&_pkTh.on)_pkTh.sh.removeEventListener('scroll',_pkTh.on);
  _pkTh.io=_pkTh.sh=_pkTh.on=null;_pkTh.vis.clear();_pkTh.ready=false;
}
// Filas nuevas en root (la lista entera o un trozo): se vigilan las que esperan
function _pkThWatch(root){
  if(!root)return;
  if(!_pkThOk()){thumbsIn(root);return;}
  const sh=document.getElementById('lib-sheet');if(!sh)return;
  if(_pkTh.sh!==sh){
    _pkThStop();_pkTh.sh=sh;
    _pkTh.io=new IntersectionObserver(en=>{for(const x of en){if(x.isIntersecting)_pkTh.vis.add(x.target);else _pkTh.vis.delete(x.target);}_pkThKick(0);},{root:sh,rootMargin:'64px 0px'});
    _pkTh.on=()=>{_pkTh.last=performance.now();_pkThKick(150);};sh.addEventListener('scroll',_pkTh.on,{passive:true});
    const io=_pkTh.io;GymAnim.thumbReady().then(()=>{if(_pkTh.io===io){_pkTh.ready=true;_pkThKick(0);}},()=>{});
  }
  root.querySelectorAll('ul.lib-ul').forEach(u=>{if(u.querySelector('img[data-pk-th][data-ga-st="w"]'))_pkTh.io.observe(u);});
}
// La lista se repinta: nada de lo anterior sigue en pantalla
function _pkThReset(){if(_pkTh.io)_pkTh.io.disconnect();_pkTh.vis.clear();}
function _pkThKick(ms){
  if(_pkTh.t||!_pkTh.io)return;_pkTh.t=1;
  // tras un fotograma: así la anterior ya está pintada y medir no fuerza otra maquetación
  const go=()=>requestAnimationFrame(()=>{if(window.requestIdleCallback)requestIdleCallback(_pkThWork,{timeout:500});else setTimeout(_pkThWork,16);});
  if(ms>0)setTimeout(go,ms);else go();
}
function _pkThOpt(im){return{w:+im.getAttribute('data-gw'),h:+im.getAttribute('data-gh'),fit:im.getAttribute('data-gfit')||'scene',bg:im.getAttribute('data-gbg')||null};}
function _pkThApply(im,src){
  try{im.decoding='async';}catch(e){}im.src=src;im.setAttribute('data-ga-st','ok');
  if(im.complete&&im.naturalWidth)im.classList.add('ga-on');else im.addEventListener('load',()=>im.classList.add('ga-on'),{once:true});
}
function _pkThWork(){
  _pkTh.t=0;const io=_pkTh.io,sh=_pkTh.sh;if(!io||!_pkTh.ready)return;
  if(!sh||!sh.isConnected){_pkThStop();return;}
  const ims=[];
  for(const ul of _pkTh.vis){
    const w=ul.isConnected?ul.querySelectorAll('img[data-pk-th][data-ga-st="w"]'):[];
    if(!w.length){_pkTh.vis.delete(ul);io.unobserve(ul);continue;}
    w.forEach(im=>ims.push(im));
  }
  if(!ims.length)return;
  const q=performance.now()-_pkTh.last,still=q>=140;
  // primero se mide (con la maquetación al día) y después se ponen las de caché
  const R=still?sh.getBoundingClientRect():null,top=still?ims.map(im=>{const r=im.getBoundingClientRect();return r.bottom>R.top-64&&r.top<R.bottom+64?r.top:null;}):null;
  let best=null,by=1e9;
  ims.forEach((im,i)=>{const P=_pkThOpt(im);let src=null;try{src=GymAnim.thumbCached(im.getAttribute('data-ga-thumb'),P.w,P.h,P);}catch(e){src=null;}
    if(src)_pkThApply(im,src);else if(still&&top[i]!=null&&top[i]<by){by=top[i];best=im;}});
  if(!still){_pkThKick(150-q);return;} // aún se desplaza: al parar
  if(!best)return; // las de esos tramos que faltan no se ven: al desplazar se vuelve a mirar
  const P=_pkThOpt(best),k=best.getAttribute('data-ga-thumb');let src=null;
  try{if(GymAnim.thumb(k,P.w,P.h,P))src=GymAnim.thumbCached(k,P.w,P.h,P);}catch(e){src=null;}
  if(src)_pkThApply(best,src);else best.setAttribute('data-ga-st','x');
  _pkThKick(0);
}

// ── Patrón de movimiento y parecido muscular ──
// Las alternativas de «¿Máquina ocupada?»: primero las del propio ejercicio (libAlts: las de antes del Coach y las de su
// fila del catálogo); después, por parecido de músculos (coseno entre los vectores de músculos del catálogo, mus) y por
// patrón de movimiento: primero las del mismo patrón (un jalón se cambia por otro jalón, no por un remo), luego las de uno
// cercano. Se descartan las de la misma máquina o estación (si está ocupada, también lo está; tampoco cuentan como
// alternativa) y las que no se pueden hacer donde entrenas (routinePlace).
// (LIB_PAT, PAT_NEAR y PAT_LBL salen del catálogo: ver BIBLIOTECA DE EJERCICIOS)
const BUSY_SAME=.6,BUSY_NEAR=.15,BUSY_STATION=.6,BUSY_GROUP=.1,BUSY_MIN_COS=.35,BUSY_ALT=.25,BUSY_LT=.15,BUSY_LOAD=.2;
const _libVecC=new Map();
function _libVec(key){
  if(_libVecC.has(key))return _libVecC.get(key);
  const L=key?LIB_BY_ID.get(key):null,m=L&&Object.keys(L.mus).length?L.mus:null;
  const sp=!m&&key&&typeof GymAnim!=='undefined'?GymAnim.get(key):null,src=m||(sp&&sp.muscles),v={};
  if(src)for(const k in src){const n=k.replace(/_(L|R)$/,''),w=+src[k];if(w>0)v[n]=Math.max(v[n]||0,w);}
  // pectoral, superior e inferior: mismas fibras con otro ángulo (cuentan en parte como el mismo músculo)
  const P=['pecs','upperpecs','lowerpecs'],pm=Math.max(0,...P.map(m=>v[m]||0));
  if(pm>0)P.forEach(m=>{v[m]=Math.max(v[m]||0,pm*.6);});
  _libVecC.set(key,v);return v;
}
function _cosSim(a,b){let d=0,x=0,y=0;for(const k in a){x+=a[k]*a[k];if(b[k])d+=a[k]*b[k];}for(const k in b)y+=b[k]*b[k];return x&&y?d/Math.sqrt(x*y):0;}
// Máquina o estación del equipo («Máquina de extensión» → «maquina de extension»); todas las poleas son la misma
// estación («Cable dual (polea baja)», «Polea alta» → «polea»)
function _station(eq){const s=normTxt(eq).replace(/\(.*?\)/g,'').replace(/\+.*$/,'').replace(/\s+/g,' ').trim();return /^(cable|polea)\b/.test(s)?'polea':s;}
const BUSY_FREE=['mancuernas','peso corporal','barra fija / maquina'];
// Estación que se puede ocupar ('' si no: mancuernas, kettlebell, bandas, peso corporal…). Con su ejercicio de la
// biblioteca (L), por su material; si no tiene, por el nombre del equipo.
function _stationOf(eq,L){if(L)return MAT[L.mat].free?'':_station(eq||L.eq);const s=_station(eq||'');return BUSY_FREE.includes(s)?'':s;}

// ── «Solo hoy»: el sustituto va EN el plan (Entreno, la barra, el descanso, Inicio y el guardado lo tratan como uno más,
// con su propio id = su propio historial) y lleva el ejercicio de tu rutina en ex.sub = {orig, ts, day, re?}. Al guardar
// o descartar la sesión vuelve el original y la rutina queda exactamente como estaba. ──
const SUB_GRACE_MS=3*3600000; // sin ninguna serie marcada en ese día, una sustitución vuelve sola pasadas 3 h
function _validSub(s){return _isPlainObj(s)&&_isPlainObj(s.orig)&&typeof s.orig.id==='string'&&s.orig.id.length>0&&s.orig.id.length<=80&&
  typeof s.orig.n==='string'&&!('sub' in s.orig)&&isFinite(+s.ts);}
function routineEx(ex){return ex&&ex.sub&&_validSub(ex.sub)?ex.sub.orig:ex;}
function _hasSubs(plan){plan=plan||getPlan();for(const dk in plan){const d=plan[dk];if(d&&Array.isArray(d.ex)&&d.ex.some(e=>e&&e.sub))return true;}return false;}
// La rutina tal cual (sin lo cambiado «solo hoy»): Coach, volumen planificado. Solo lectura.
function routinePlan(){const p=getPlan();if(!_hasSubs(p))return p;const o={};
  Object.keys(p).forEach(dk=>{const d=p[dk];o[dk]=d&&Array.isArray(d.ex)?Object.assign({},d,{ex:d.ex.map(routineEx)}):d;});return o;}
// {dk, i, ex} del sustituto con ese id / del hueco cuyo original tiene ese id (o null)
function _subSlot(exId){const p=getPlan();for(const dk in p){const d=p[dk];if(!d||!Array.isArray(d.ex))continue;const i=d.ex.findIndex(e=>e&&e.id===exId&&e.sub);if(i>=0)return{dk,i,ex:d.ex[i]};}return null;}
function _subOfOrig(origId){const p=getPlan();for(const dk in p){const d=p[dk];if(!d||!Array.isArray(d.ex))continue;const i=d.ex.findIndex(e=>e&&e.sub&&e.sub.orig&&e.sub.orig.id===origId);if(i>=0)return{dk,i,ex:d.ex[i]};}return null;}
function _subOrigId(exId){if(!_hasSubs())return null;const s=_subSlot(exId);return s&&_validSub(s.ex.sub)?s.ex.sub.orig.id:null;}
// ¿Ese id ya lo usa algún hueco de la rutina (o el original de un sustituto)?
function _planIdTaken(id){const p=getPlan();for(const dk in p){const d=p[dk];if(!d||!Array.isArray(d.ex))continue;
  for(const e of d.ex){if(!e)continue;if(e.id===id||(e.sub&&e.sub.orig&&e.sub.orig.id===id))return true;}}return false;}
function _slotMarks(ex){const c=ex&&S.sets[ex.id];return !!c&&Object.keys(c).some(k=>c[k]);}
function _clearExState(id){
  if(S.sets)delete S.sets[id];if(S.logs)delete S.logs[id];if(S.rpe)delete S.rpe[id];if(S.warmups)delete S.warmups[id];
  try{_animBig.delete(id);}catch(e){} // (al arrancar aún no existe)
}
// Biblioteca de un id con historial: el de tu rutina, el de la biblioteca (un «Solo hoy»), el del plan original o su nombre
function _libOfKey(k){
  const pe=findExInPlan(k);if(pe)return _libIdOf(pe);
  if(LIB_BY_ID.has(k))return k;
  const o=_origPlanEx(k);if(o)return _libIdOf(o.ex);
  const l=LIB_BY_N.get(exDisplayName(k));return l?l.id:null;
}
// Historial «propio» de cada ejercicio de la biblioteca: {libId:{key, last, n}}. Prioridad: el id que usa tu rutina; si no,
// el de sus «Solo hoy» (el id de la biblioteca); si no, el más reciente de un ejercicio que ya no está en tu rutina
// (p. ej. a2 si cambiaste la Sentadilla en Smith por otro: al volver a hacerla, sigue su historial).
function _libHistMap(){
  const out={},st=_isPlainObj(S.strength)?S.strength:{};
  Object.keys(st).forEach(k=>{
    const a=st[k];if(!Array.isArray(a)||!a.length)return;
    const lib=_libOfKey(k);if(!lib)return;
    // last: el último con peso (lo que enseña «Último: X kg»); lastAny: el último de cualquier tipo (el que ordena)
    let last=null,lastAny=null;for(let i=a.length-1;i>=0;i--){const r=a[i];if(!r||typeof r!=='object')continue;if(!lastAny)lastAny=r;if(+r.v>0){last=r;break;}}
    const c={key:k,last,lastAny,n:a.filter(r=>r&&typeof r==='object').length,rk:_planIdTaken(k)?3:k===lib?2:1,ts:lastAny&&isFinite(+lastAny.ts)?+lastAny.ts:0};
    const cur=out[lib];if(!cur||c.rk>cur.rk||(c.rk===cur.rk&&c.ts>cur.ts))out[lib]=c;
  });
  return out;
}
// Id con el que se registra un ejercicio de la biblioteca hecho «solo hoy» (su propio historial)
function _libHistKey(libId){
  const p=routinePlan();
  for(const dk of Object.keys(p)){const d=p[dk];if(!d||!Array.isArray(d.ex))continue;const e=d.ex.find(x=>x&&_libIdOf(x)===libId);if(e)return e.id;}
  const h=_libHistMap()[libId];
  return h&&!_planIdTaken(h.key)?h.key:libId;
}
// Alternativas a un ejercicio (el de la rutina si hoy está sustituido) que no estén ya en tu rutina: [{lib, cos, pct,
// pat, same, near, sameSt, ai, lm, score, hist}]. Primero sus alternativas (libAlts, en su orden; ai = su puesto, -1 si
// no es una o si va en la misma estación, que está ocupada); después, de más a menos parecida. Fuera las poco parecidas
// (ni su patrón ni un 35 %). Cardio de máquina en el gimnasio: otra máquina de cardio. lm: el tuyo va en kg y este no
// (banda, peso corporal…): va detrás de los que llevan carga aunque trabaje los mismos músculos.
// (E3b) dk: el día del ejercicio (su sitio y su material, canDoHere); sin tus sitios, como siempre
function busyAlternatives(ex,n,dk){
  if(!ex)return[];
  // Sin biblioteca (personalizado): el ejercicio de la animación de su grupo hace de referencia, como siempre
  const orig=routineEx(ex),own=exLib(orig),oLib=own?own.id:(exAnimKey(orig)||null),L=oLib?LIB_BY_ID.get(oLib)||null:null;
  const v=_libVec(oLib),p=L?L.pat:null,st=_stationOf(orig.eq||(L&&L.eq)||'',own),grp=orig.muscle||(L&&L.muscle)||null;
  const inPlan=_planLibIds(),hm=_libHistMap(),cur=ex!==orig?ex.lib:null,place=placeOfDay(dk!=null?dk:S.day)||routinePlace(),fam=_tgtFam(exLT(orig)),alt=libAlts(own).map(a=>a[0]);
  const cm=!!orig.cardio&&!!own&&own.mat==='cardio'&&place==='g',kgO=exLT(orig)==='w';
  return EXERCISE_DB.filter(l=>l.id!==oLib&&l.id!==cur&&!!l.cardio===!!orig.cardio&&!inPlan.has(l.id)&&canDoHere(l,dk!=null?dk:S.day)&&(!cm||l.mat==='cardio'))
    .map(l=>{
      const c=_cosSim(v,_libVec(l.id)),q=l.pat||null,same=!!p&&q===p,near=!!p&&!!q&&(PAT_NEAR[p]||[]).includes(q);
      const sameSt=!!st&&_stationOf(l.eq,l)===st,ai=sameSt?-1:alt.indexOf(l.id),lm=kgO&&l.lt!=='w';
      const score=c+(same?BUSY_SAME:near?BUSY_NEAR:0)-(sameSt?BUSY_STATION:0)+(grp&&l.muscle===grp?BUSY_GROUP:0)
        +(ai>=0?BUSY_ALT*(1-.1*ai):0)-(_tgtFam(l.lt)!==fam?BUSY_LT:0)-(lm?BUSY_LOAD:0);
      return{lib:l,cos:c,pct:Math.round(c*100),pat:q,same,near,sameSt,ai,lm,score,hist:hm[l.id]||null};})
    .filter(a=>!(a.sameSt&&!a.same)&&(a.same||a.near||a.cos>=BUSY_MIN_COS)&&a.score>.3)
    .sort((a,b)=>(a.ai<0)-(b.ai<0)||a.ai-b.ai||b.score-a.score||b.cos-a.cos)
    .slice(0,n||3);
}
const _repsTgt=r=>/^\d{1,3}(\s*[-–]\s*\d{1,3})?$/.test(String(r==null?'':r).trim());
// El sustituto: el de la biblioteca con su id de historial, las series de tu rutina (también en descarga, de 1 a 10) y
// sus reps (las de tu rutina si las dos son reps; un objetivo por tiempo, como la plancha, se queda el suyo). Cardio: tu
// duración.
function _subExFor(lib,orig,id){return _carryTarget(orig,_libCopy(lib,id));}
// Cambia SOLO HOY el ejercicio exId del día dk por libId. {ok, ex, msg, back (volvió al de tu rutina)}
function subToday(dk,exId,libId){
  if(!S.currentPlan)S.currentPlan=JSON.parse(JSON.stringify(PLAN));
  const day=getPlan()[dk];if(!day||!Array.isArray(day.ex))return{ok:false,msg:'Ese día ya no está en tu rutina'};
  const i=day.ex.findIndex(e=>e&&e.id===exId);if(i<0)return{ok:false,msg:'Ese ejercicio ya no está en tu rutina'};
  const slot=day.ex[i],orig=routineEx(slot),lib=LIB_BY_ID.get(libId);
  if(!lib)return{ok:false,msg:'Ese ejercicio no está en la biblioteca'};
  if(_slotMarks(slot))return{ok:false,msg:`Ya llevas series de ${slot.n}: se quedan con él`};
  if(RT.cardioRunning(slot.id))return{ok:false,msg:'Para primero el cardio en marcha'};
  if(libId===_libIdOf(orig)){if(slot!==orig)revertSub(dk,slot.id);saveState();return{ok:true,ex:orig,back:true};}
  if(slot!==orig&&slot.lib===libId)return{ok:true,ex:slot};
  if(!!lib.cardio!==!!orig.cardio)return{ok:false,msg:lib.cardio?'Elige un ejercicio de fuerza':'Elige otro cardio'};
  if(_planLibIds().has(libId))return{ok:false,msg:`${lib.n} ya está en tu rutina: elige otro para hoy`};
  const key=_libHistKey(libId);
  if(_planIdTaken(key))return{ok:false,msg:`${lib.n} ya está en tu rutina: elige otro para hoy`};
  const nx=_subExFor(lib,orig,key);nx.sub={orig,ts:Date.now(),day:dk};
  if(slot!==orig)_clearExState(slot.id); // el sustituto anterior (sin series)
  _clearExState(key);                    // restos de otra vez con ese id
  day.ex[i]=nx;
  if(S.open===slot.id)S.open=nx.id;
  _uiGen++;saveState();
  return{ok:true,ex:nx};
}
// Vuelve el ejercicio de tu rutina (el sustituto se va con su estado de hoy)
function revertSub(dk,exId){
  const day=getPlan()[dk];if(!day||!Array.isArray(day.ex))return false;
  const i=day.ex.findIndex(e=>e&&e.id===exId&&e.sub);if(i<0)return false;
  const e=day.ex[i];if(!_validSub(e.sub)){delete e.sub;return false;}
  day.ex[i]=e.sub.orig;_clearExState(e.id);if(S.open===e.id)S.open=e.sub.orig.id;
  return true;
}
// Todos los de un día (onlyRe: solo los que volvieron a sustituirse al reabrir una sesión)
function revertDaySubs(dk,onlyRe){
  const day=getPlan()[dk];if(!day||!Array.isArray(day.ex))return 0;let n=0;
  for(let i=0;i<day.ex.length;i++){const e=day.ex[i];if(!e||!e.sub||(onlyRe&&!e.sub.re))continue;
    if(!_validSub(e.sub)){delete e.sub;continue;}
    day.ex[i]=e.sub.orig;_clearExState(e.id);if(S.open===e.id)S.open=e.sub.orig.id;n++;}
  return n;
}
// En cada render(): fuera las sustituciones con mala forma; las de un día sin ninguna serie marcada, pasadas 3 h
// (o con la hora del futuro), vuelven solas. Con series marcadas siguen hasta guardar o descartar.
function subTick(){
  const p=getPlan();if(!_hasSubs(p))return false;
  const now=Date.now();let ch=false;
  Object.keys(p).forEach(dk=>{const d=p[dk];if(!d||!Array.isArray(d.ex)||!d.ex.some(e=>e&&e.sub))return;
    const marks=dayMarkCount(dk).marks>0;
    for(let i=0;i<d.ex.length;i++){const e=d.ex[i];if(!e||!e.sub)continue;
      if(!_validSub(e.sub)){delete e.sub;ch=true;continue;}
      const age=now-(+e.sub.ts);
      if(!marks&&!(age>=0&&age<SUB_GRACE_MS)){d.ex[i]=e.sub.orig;_clearExState(e.id);if(S.open===e.id)S.open=e.sub.orig.id;ch=true;}}
  });
  if(ch)saveState();
  return ch;
}
// Lo hecho «solo hoy» en una sesión (para guardarla): [{orig, on, alt, lib, n}], solo con series o registro
function _sessSubsOf(day,snapSets,ts){
  const out=[];
  (day&&Array.isArray(day.ex)?day.ex:[]).forEach(e=>{
    if(!e||!_validSub(e.sub))return;
    const ss=snapSets&&snapSets[e.id],did=_isPlainObj(ss)&&Object.values(ss).some(Boolean);
    const rec=Array.isArray(S.strength[e.id])&&S.strength[e.id].some(r=>r&&+r.ts===ts);
    if(!did&&!rec)return;
    out.push({orig:e.sub.orig.id,on:String(e.sub.orig.n||'').slice(0,120),alt:String(e.id).slice(0,80),lib:typeof e.lib==='string'?e.lib.slice(0,80):null,n:String(e.n||'').slice(0,120)});
  });
  return out.slice(0,20);
}
function _cleanSessSubs(L){
  if(!Array.isArray(L))return[];
  const ok=v=>typeof v==='string'&&v.length>0&&v.length<=80;
  return L.filter(x=>_isPlainObj(x)&&ok(x.orig)&&ok(x.alt)&&x.orig!==x.alt).slice(0,20).map(x=>({orig:x.orig,on:typeof x.on==='string'?x.on.slice(0,120):'',
    alt:x.alt,lib:ok(x.lib)?x.lib:null,n:typeof x.n==='string'?x.n.slice(0,120):''}));
}
// Al reabrir una sesión: lo que hizo «solo hoy» vuelve a sustituir a su ejercicio (si sigue en la rutina). Devuelve sus ids.
function _reapplySessSubs(sess,dk){
  const L=_cleanSessSubs(sess&&sess.subs),day=getPlan()[dk],done=[];
  if(!L.length||!day||!Array.isArray(day.ex))return done;
  L.forEach(x=>{
    const i=day.ex.findIndex(e=>e&&e.id===x.orig&&!e.sub);if(i<0)return;
    const lib=x.lib?LIB_BY_ID.get(x.lib):null;if(!lib||_planIdTaken(x.alt))return;
    const orig=day.ex[i],nx=_subExFor(lib,orig,x.alt);nx.sub={orig,ts:Date.now(),day:dk,re:1};
    day.ex[i]=nx;done.push(nx.id);
  });
  return done;
}
// Backups e importación (v20): sustituciones con forma válida (textos acotados, sin anidar, sin claves del catálogo);
// si no, fuera
function _sanitizePlanSubs(plan){
  if(!_isPlainObj(plan))return;
  Object.values(plan).forEach(d=>{if(!d||!Array.isArray(d.ex))return;
    d.ex.forEach(e=>{if(!e||typeof e!=='object'||!('sub' in e))return;
      const s=e.sub;
      if(_isPlainObj(s)&&_isPlainObj(s.orig)){
        delete s.orig.sub;
        if(s.orig.id!=null&&typeof s.orig.id!=='string')s.orig.id=String(s.orig.id);
        ['n','eq','tip','ic','r'].forEach(k=>{if(s.orig[k]!=null)s.orig[k]=String(s.orig[k]).slice(0,300);});
        _slimEx(s.orig);
        s.ts=+s.ts;if(typeof s.day==='string')s.day=s.day.slice(0,12);else delete s.day;
        if(s.re)s.re=1;else delete s.re;
      }
      if(!_validSub(s))delete e.sub;});});
}
function _sanitizeSessSubs(sessions){
  if(!Array.isArray(sessions))return;
  sessions.forEach(s=>{if(!s||typeof s!=='object'||!('subs' in s))return;const L=_cleanSessSubs(s.subs);if(L.length)s.subs=L;else delete s.subs;});
}
// Historial que solo existe por alternativas «solo hoy» (Progreso e historial lo dicen así)
function _isSubOnly(id){
  if(findExInPlan(id))return false;
  return (S.sessions||[]).some(s=>s&&Array.isArray(s.subs)&&s.subs.some(x=>x&&x.alt===id));
}

// ¿Ejercicio sin material de ningún tipo (plancha, flexiones, crunch en el suelo…)? Nada que pueda estar ocupado. Es de la
// biblioteca con «Sin material» Y su equipo no pide nada: «Peso corporal» (también «Peso corporal (suelo)») o «Sin
// material». Los que piden banco, silla, pared, escalón… («Banco o silla», «Banco declinado») sí pueden estar ocupados.
function _busyNoKit(ex){
  const L=exLib(ex);if(!L||L.mat!=='corporal')return false;
  const e=normTxt((ex&&ex.eq)||L.eq),M=MAT.corporal;
  return !e||e===normTxt(M.eq)||e===normTxt(M.l)||/^peso corporal \((suelo|espacio libre)\)$/.test(e);
}
// ── Tarjeta abierta de Entreno: «⇄ Ocupada» (antes de la primera serie) o el aviso del sustituto de hoy ──
function busyBarHtml(ex,done){
  if(!ex)return'';
  const eid=esc(ex.id);
  if(ex.sub&&_validSub(ex.sub)){
    return`<div class="ex-busy is-sub" role="note"><span class="ex-busy-t"><b>⇄ Solo hoy</b> · en lugar de ${esc(ex.sub.orig.n)}</span>${done?'':`<button type="button" class="ex-busy-b" data-ex="${eid}" onclick="busyRevertEx(this.dataset.ex)" aria-label="Volver a ${esc(ex.sub.orig.n)}">Volver</button><button type="button" class="ex-busy-b go" data-ex="${eid}" onclick="openBusy(this.dataset.ex)" aria-label="Ver otras alternativas">⇄ Otra</button>`}</div>`;
  }
  // Sin material (plancha, flexiones…) no hay nada que pueda estar ocupado: sin el botón. Con cualquier material que sí
  // (mancuernas, barras, bandas en el gimnasio…), se queda.
  if(done||_busyNoKit(ex))return'';
  return`<div class="ex-busy"><span class="ex-busy-t">¿Máquina ocupada? Cámbialo solo por hoy</span><button type="button" class="ex-busy-b go" data-ex="${eid}" onclick="openBusy(this.dataset.ex)" aria-label="Máquina ocupada: alternativas a ${esc(ex.n)}">⇄ Ocupada</button></div>`;
}

// ── Hoja «¿Máquina ocupada?» (en #cmodal-root): 3 alternativas, vista 3D en vivo de la elegida, «Solo hoy» o «Cambiar
// en la rutina» (el flujo de siempre del editor) ──
let _busy=null; // {dk, exId, alts, sel} · solo en memoria
function _busySlot(){if(!_busy)return null;const d=getPlan()[_busy.dk];return d&&Array.isArray(d.ex)?d.ex.find(e=>e&&e.id===_busy.exId)||null:null;}
function openBusy(exId){
  const p=getPlan(),dk=p[S.day]&&Array.isArray(p[S.day].ex)&&p[S.day].ex.some(e=>e&&e.id===exId)?S.day:_dayOfEx(exId);
  const day=dk&&p[dk],ex=day&&Array.isArray(day.ex)?day.ex.find(e=>e&&e.id===exId):null;
  if(!ex){toast('Ese ejercicio ya no está en tu rutina');return;}
  if(_slotMarks(ex)){toast(`Ya llevas series de ${ex.n}: se quedan con él`);return;}
  if(RT.cardioRunning(ex.id)){toast('Para primero el cardio en marcha');return;}
  const op=_busy&&_busy.opener||document.activeElement;closeBusy(1);
  const alts=busyAlternatives(ex,3,dk);
  _busy={dk,exId,alts,sel:alts.length?alts[0].lib.id:null,opener:op};
  renderBusy();
  // el foco entra en la hoja: en la alternativa elegida (o en ✕ si no hay ninguna); al cerrarla vuelve a quien la abrió
  const f=document.querySelector('#busy-sheet .busy-alt[tabindex="0"]')||document.querySelector('#busy-sheet .hist-sheet-close');
  if(f){try{f.focus({preventScroll:true});}catch(e){}}
}
// Nombres de los músculos de un ejercicio de la biblioteca: los de su animación o, si no tiene, los del catálogo (de más
// a menos trabajado). n: cuántos como mucho.
function _libMusLbl(e,n){
  const sp=typeof GymAnim!=='undefined'&&GymAnim.get?GymAnim.get(e.id):null;
  const a=sp&&sp.labels?sp.labels:Object.keys(e.mus||{}).sort((x,y)=>e.mus[y]-e.mus[x]).map(k=>MUS_LBL[k]);
  return n?a.slice(0,n):a;
}
// Vista previa de la alternativa elegida: su animación 3D o, si no tiene, su mapa muscular (nunca un hueco)
function _busyPv(pv,L){
  if(!pv||!L||typeof GymAnim==='undefined')return;
  try{if(GymAnim.has(L.id))GymAnim.swap(pv,L.id);else{pv.removeAttribute('data-gym-anim');GymAnim.muscleMap(pv,{weights:L.mus,view:'both'});}}catch(e){}
}
// ¿El último registro (de cualquier tipo) de un historial es sin kilos? Entonces se enseña en su medida
function _histNoKg(h){const A=h&&h.lastAny;return !!A&&(_recLT(A)!=='w'||!(+A.v>0));}
function _busyInfoHtml(a,orig){
  if(!a)return'';
  const labs=_libMusLbl(a.lib).join(' · ');
  let h='';
  if(a.lib.cardio)h=`Mismo tiempo que tu ${esc(orig.n)}: <b>${esc(String(orig.r||a.lib.r||''))}</b>.`;
  else if(a.hist&&(a.hist.last||_histNoKg(a.hist))){
    const nk=_histNoKg(a.hist),L=nk?a.hist.lastAny:a.hist.last,pr=coach_prescribe(a.hist.key,{ex:_subExFor(a.lib,orig,a.hist.key)});
    h=`Su último registro: <b>${nk?_nwX(esc(_recValTxt(L))):_nwX(`${esc(kgTxt(L.v))} kg${L.r?' × '+esc(L.r):''}`)}</b>${L.d?' · '+esc(L.d):''}.${pr?` Hoy: <b>${_nwX(esc(presValTxt(pr)))}</b>.`:''}`;
  }else h=a.lib.lt==='t'?'Sin historial: aguanta lo que puedas con buena técnica y apúntalo; desde la próxima vez te diré cuánto aguantar.'
    :a.lib.lt==='d'?'Sin historial: recorre la distancia del plan con buena técnica y apúntala; desde la próxima vez te diré cuánto recorrer.'
    :a.lib.lt==='bw'||a.lib.lt==='r'?'Sin historial: haz las reps que puedas con buena técnica y apúntalas; desde la próxima vez te diré cuántas buscar.'
    :'Sin historial: empieza con un peso cómodo y apúntalo; desde la próxima vez te diré cuánto poner.';
  return`${h}${labs?`<br>Trabaja: ${esc(labs)}${a.pct?` · ${a.pct} % de músculos en común`:''}`:''}`;
}
function _busyNote(a,orig){return a?`«Solo hoy» se guarda en el historial de ${esc(a.lib.n)}; tu rutina no cambia y la próxima vez vuelve ${esc(orig.n)}.`:'';}
function renderBusy(){
  const root=document.getElementById('cmodal-root'),ex=_busySlot();
  if(!root||!_busy||!ex){closeBusy();return;}
  const orig=routineEx(ex),isSub=ex!==orig,A=_busy.alts,sel=A.find(a=>a.lib.id===_busy.sel)||A[0]||null;
  const rows=A.map(a=>{const last=a.lib.cardio?esc(String(a.lib.eq)):_histNoKg(a.hist)?esc(_recValTxt(a.hist.lastAny)):a.hist&&a.hist.last?esc(kgTxt(a.hist.last.v))+' kg':'nuevo';
    return`<button type="button" class="busy-alt" role="radio" aria-checked="${a===sel}" tabindex="${a===sel?0:-1}" data-lib="${esc(a.lib.id)}" onclick="busySelect(this.dataset.lib)" onkeydown="busyKey(event)" aria-label="${esc(a.lib.n)}: ${a.pct} % de músculos en común${a.lib.cardio?'':_histNoKg(a.hist)?', último '+esc(_recValTxt(a.hist.lastAny)):a.hist&&a.hist.last?', último '+esc(kgTxt(a.hist.last.v))+' kilos':''}">
      <span class="exic" aria-hidden="true">${thumbImgHtml(a.lib.id,TH_IC)}<span class="exic-e">${esc(a.lib.ic||'💪')}</span></span>
      <span class="busy-alt-i"><span class="busy-alt-n">${esc(a.lib.n)}</span><span class="busy-alt-m">${esc(a.lib.eq)}${a.pat&&!a.lib.cardio?' · '+esc(PAT_LBL[a.pat]||''):''}</span></span>
      <span class="busy-alt-r" aria-hidden="true"><span class="pct">${a.pct} %</span><b>${last}</b></span></button>`;}).join('');
  root.innerHTML=`<div class="hist-over" onclick="if(event.target===this)closeBusy()" style="z-index:500"><div class="hist-sheet" id="busy-sheet" role="dialog" aria-modal="true" aria-labelledby="busy-t" style="max-height:calc(92vh - var(--kb));max-height:calc(92dvh - var(--kb))">
    <div class="hist-sheet-head" style="padding-right:60px"><div class="hist-sheet-hdl"></div>
      <div class="hist-sheet-title" id="busy-t"><span aria-hidden="true">⇄ </span>¿Máquina ocupada?</div>
      <div class="hist-sheet-sub">${isSub?`Hoy haces ${esc(ex.n)} en lugar de ${esc(orig.n)}`:`Alternativas a ${esc(orig.n)} · mismos músculos`}</div>
      <button class="hist-sheet-close x44" onclick="closeBusy()" aria-label="Cerrar">✕</button></div>
    <div class="hist-sheet-body">
      ${sel?`<div class="ex-anim busy-pv" id="busy-pv" data-ex="busy" data-ga-notap${GymAnim.has(sel.lib.id)?` data-gym-anim="${esc(sel.lib.id)}"`:''}></div>
      <div class="busy-list" role="radiogroup" aria-label="Alternativas">${rows}</div>
      <div class="busy-info" id="busy-info" aria-live="polite">${_busyInfoHtml(sel,orig)}</div>
      <div class="busy-acts"><button type="button" class="btn bp" onclick="busySoloHoy()">Solo hoy</button><button type="button" class="btn bs" onclick="busyRoutine()">Cambiar en la rutina</button></div>
      <div class="lib-d-note" id="busy-note">${_busyNote(sel,orig)}</div>`
      :`<div class="busy-empty">No encuentro alternativas parecidas a ${esc(orig.n)} fuera de tu rutina. Busca otra en la biblioteca.</div>`}
      ${isSub?`<button type="button" class="btn bs" style="margin-top:10px;min-height:48px" data-ex="${esc(ex.id)}" onclick="busyRevertEx(this.dataset.ex)">↩ Volver a ${esc(orig.n)}</button>`:''}
      <button type="button" class="busy-more" onclick="busyOpenLibrary()">Ver toda la biblioteca ›</button>
      ${_busyNoneHtml(orig)}
    </div></div></div>`;
  if(typeof GymAnim!=='undefined'){try{GymAnim.mountAll(root);}catch(e){}}
  if(sel&&!GymAnim.has(sel.lib.id))_busyPv(document.getElementById('busy-pv'),sel.lib);
  thumbsIn(root);
}
function busySelect(libId){
  if(!_busy)return;const a=_busy.alts.find(x=>x.lib.id===libId),ex=_busySlot();if(!a||!ex)return;
  _busy.sel=libId;
  document.querySelectorAll('#busy-sheet .busy-alt').forEach(b=>{const on=b.dataset.lib===libId;b.setAttribute('aria-checked',String(on));b.tabIndex=on?0:-1;});
  _busyPv(document.getElementById('busy-pv'),a.lib);
  const orig=routineEx(ex),inf=document.getElementById('busy-info'),nt=document.getElementById('busy-note');
  if(inf)inf.innerHTML=_busyInfoHtml(a,orig);if(nt)nt.innerHTML=_busyNote(a,orig);
  haptic(8);
}
// Las alternativas son un grupo de radios: Tab entra en la elegida y las flechas (Inicio / Fin) la cambian
function busyKey(ev){
  const B=[...document.querySelectorAll('#busy-sheet .busy-alt')],i=B.indexOf(ev.target),n=B.length;
  const to={ArrowDown:i+1,ArrowRight:i+1,ArrowUp:i-1,ArrowLeft:i-1,Home:0,End:n-1}[ev.key];
  if(to===undefined||i<0||!n)return;
  ev.preventDefault();const b=B[(to+n)%n];busySelect(b.dataset.lib);try{b.focus();}catch(e){}
}
// keep: se vuelve a abrir enseguida (el foco no se devuelve)
function closeBusy(keep){
  const root=document.getElementById('cmodal-root'),sh=root&&root.querySelector('#busy-sheet'),o=_busy&&_busy.opener;
  if(sh){const pv=sh.querySelector('#busy-pv');if(pv&&typeof GymAnim!=='undefined'&&GymAnim.unmount){try{GymAnim.unmount(pv);}catch(e){}}root.innerHTML='';}
  _busy=null;
  if(sh&&!keep&&o&&o.isConnected&&o.focus){try{o.focus({preventScroll:true});}catch(e){}}
}
// «Solo hoy» (desde la hoja o desde la ficha de la biblioteca): la tarjeta pasa a la alternativa, abierta
function _applySoloHoy(dk,exId,libId){
  const r=subToday(dk,exId,libId);
  if(!r.ok){toast(r.msg);render();return false;}
  if(!r.back)_libTouch(libId);
  if(S.tab!=='workout'){S.tab='workout';}
  if(getPlan()[dk])S.day=dk;
  S.open=r.ex?r.ex.id:S.open;_scrollTo=null;
  haptic(12);render();
  toast(r.back?`Vuelves a ${r.ex.n}`:`Hoy: ${r.ex.n} · se guarda en su propio historial`,3200);
  return true;
}
function busySoloHoy(libId){
  if(!_busy)return;const b=_busy,id=libId||b.sel;if(!id)return;
  closeBusy();_applySoloHoy(b.dk,b.exId,id);
}
// «Cambiar en la rutina»: el cambio de siempre del editor (con «Trasladar historial» si toca), para siempre
function busyRoutine(libId){
  if(!_busy)return;const b=_busy,slot=_busySlot(),lib=LIB_BY_ID.get(libId||b.sel);
  if(!slot||!lib)return;
  if(_slotMarks(slot)){toast(`Ya llevas series de ${slot.n}: termínalo antes de cambiarlo`);return;}
  closeBusy();_libTouch(lib.id);
  _routineSwapTo(b.dk,slot,lib,{keepToday:false,after:nx=>{S.open=nx.id;}});
}
// (E3b) «No hay esta máquina en mi gimnasio» (o «No tengo este material» en casa): una fila al final de la hoja si el
// ejercicio necesita algo que se pueda quitar de tu sitio
function _busyNoneHtml(orig){
  const L=orig&&exLib(orig);if(!L||L.mat==='corporal'||!_busy)return'';
  const k=placeOfDay(_busy.dk)||routinePlace(),P=_isPlainObj(S.places)?S.places[k]:placeFromPreset('grande');
  if(!placeDrop(P?JSON.parse(JSON.stringify(P)):null,L))return'';
  const t=k==='c'?'No tengo este material en casa':L.mat==='maquina'||L.mat==='cardio'||L.mat==='smith'||L.mat==='polea'?'No hay esta máquina en mi gimnasio':'No hay este material en mi gimnasio';
  return`<button type="button" class="busy-more busy-none" onclick="busyNotHere()">${t}</button>`;
}
// Apunta que tu sitio no tiene esa máquina (su familia) o ese material, con «Deshacer», y vuelve a enseñar las alternativas
// (que ya no lo usan) para cambiarlo en tu rutina. Sin tus sitios, los crea con un gimnasio grande (42 R24, 43 I-1): así
// solo falta lo que dices, no se da por hecho nada más.
function busyNotHere(){
  if(!_busy)return;const exId=_busy.exId,dk=_busy.dk,slot=_busySlot(),orig=routineEx(slot),L=orig&&exLib(orig);if(!L)return;
  const prev=_isPlainObj(S.places)?JSON.parse(JSON.stringify(S.places)):null,prevKit=Array.isArray(S.libKit)?S.libKit.slice():S.libKit;
  ensurePlaces();
  const k=placeOfDay(dk)||S.places.main;if(!S.places[k])S.places[k]=placeFromPreset(k==='c'?'nada':'grande');
  const what=placeDrop(S.places[k],L);
  if(!what){S.places=prev;S.libKit=prevKit;toast('Ese ejercicio no necesita material');return;}
  _syncLibKit();saveState();
  openBusy(exId); // las alternativas, ya sin eso
  const sitio=k==='c'?'tu casa':'tu gimnasio';
  showUndoToast(prev?`Apuntado: ${sitio} no tiene ${what}`:`He apuntado que ${sitio} no tiene ${what}. Revisa tu material en Ajustes.`,()=>{
    S.places=prev;S.libKit=prevKit;saveState();if(_busy&&_busy.exId===exId)openBusy(exId);else render();toast('Deshecho');});
}
function busyRevertEx(exId){
  const s=_subSlot(exId);if(!s){render();return;}
  if(_slotMarks(s.ex)){toast(`Ya llevas series de ${s.ex.n}: se quedan con él`);return;}
  const orig=s.ex.sub.orig;
  closeBusy();revertSub(s.dk,exId);S.open=orig.id;_uiGen++;saveState();render();
  toast(`Vuelves a ${orig.n}`);
}
function busyOpenLibrary(){
  if(!_busy)return;const b={dk:_busy.dk,exId:_busy.exId,seen:_busy.alts.map(a=>a.lib.id)},slot=_busySlot(),orig=routineEx(slot);
  closeBusy();if(!orig)return;
  showExercisePicker({title:`Alternativa a ${orig.n}`,muscle:orig.cardio?'cardio':(orig.muscle||null),mode:'busy',busy:b,currentLib:_libIdOf(orig),onPick:null});
}

