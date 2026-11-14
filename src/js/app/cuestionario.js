// ══════════════════════════════════════════════════════════
// (E7) CUESTIONARIO: CAPA, BIENVENIDA Y «YA TENGO UNA» (30-propuesta-final.md §B, §C.0, P1, §G.11)
// ══════════════════════════════════════════════════════════
// La capa #onboarding (z 390: encima quedan confirmModal, el selector, la ficha y «Mi material»; debajo, Ajustes y el editor) pinta
// una pantalla cada vez en #ob-root. _ob vive solo en memoria: las respuestas que no son de salud van además al borrador (S.obDraft)
// al momento; las de salud (P8, P8p, P9), solo en memoria hasta el consentimiento (§D.1).
let _ob=null;
const OB_SCR={}; // pantallas: {html(), block, auto, title}
const OB_BLOCK_LBL=['','Tu objetivo','Tu tiempo y tu sitio','Tu cuerpo'];
function _obOpen(){return!!_ob;}
function _obEl(){return document.getElementById('onboarding');}
// Abre el cuestionario. o = {from:'first'|'settings', step}
function showOnboarding(o){
  o=o||{};const d=S.obDraft;
  const a=d&&_isPlainObj(d.a)?JSON.parse(JSON.stringify(d.a)):{};
  _ob={from:o.from==='settings'?'settings':'first',step:'ob-hola',hist:[],a,h:{},alt:d?d.alt||0:0,pins:d&&d.pins?Object.assign({},d.pins):{},
    places:d&&d.places?JSON.parse(JSON.stringify(d.places)):null,resumed:false};
  let st=o.step||(d&&OB_STEPS.includes(d.step)?d.step:null);
  // (§C.0) los pasos de salud nunca se retoman desde el borrador: se vuelven a preguntar
  if(!o.step&&st&&['ob-salud','ob-medico','ob-supervision','ob-posparto','ob-embarazo','ob-molestias','ob-consulta'].includes(st))st='ob-salud'; // (solo al retomar el borrador)
  if(st&&st!=='ob-hola'&&OB_SCR[st]){_ob.step=st;_ob.resumed=!o.step;}
  else if(_ob.from==='settings')_ob.step=OB_SCR['ob-meta']?'ob-meta':'ob-hola';
  const ob=_obEl(),app=document.getElementById('app');
  ob.style.display='flex';ob.setAttribute('role','dialog');ob.setAttribute('aria-modal','true');ob.setAttribute('aria-labelledby','ob-h');
  if(_ob.from==='first')app.style.display='none';
  app.inert=true;
  obRender();
}
function hideOnboarding(){
  _ob=null;const ob=_obEl(),app=document.getElementById('app');
  ob.style.display='none';app.style.display='flex';app.inert=false;
  const sr=document.getElementById('ob-sheet-root');if(_obx){_obx=null;_obxUnmount(sr);}if(sr)sr.innerHTML='';
}
// Cabecera (‹ · bloques · ✕), cuerpo con el foco en el título y pie con «Para qué lo pregunto»
function obRender(o){
  if(!_ob)return;o=o||{};
  const root=document.getElementById('ob-root');if(!root)return;
  const sc=OB_SCR[_ob.step]||OB_SCR['ob-hola'];
  const blk=sc.block||0,head=_ob.step==='ob-hola'?'':`<div class="ob-head">
    <button type="button" class="ob-hb" aria-label="Atrás" onclick="obBack()">‹</button>
    <div class="ob-prog" aria-hidden="true"><div class="ob-bars">${[1,2,3].map(i=>`<i class="${i<blk?'on':i===blk?'cur':''}"></i>`).join('')}</div><div class="ob-blk">${esc(OB_BLOCK_LBL[blk]||(blk>3?'Tu rutina':''))}</div></div>
    <button type="button" class="ob-hb" aria-label="Salir" onclick="obClose()">✕</button></div>`;
  let body=sc.html();if(_ob.single&&!/class="ob-next/.test(body))body+=_obNextBtn('obSingleSave()'); // (E10a) pantalla suelta: siempre «Guardar»
  root.innerHTML=head+`<div class="ob-body${o.keepScroll?' ob-still':''}" data-scr="${_ob.step}">${_ob.resumed&&_ob.step!=='ob-hola'?'<div class="ob-resume">Seguimos donde lo dejaste.</div>':''}${body}</div>`;
  _ob.resumed=false;
  thumbsIn(root); // (M3) las imágenes 3D de la rutina propuesta: se dibujan en tiempo libre, solo las que se ven
  const live=document.getElementById('ob-live');if(live)live.textContent=_ob.step==='ob-hola'?'':`${OB_BLOCK_LBL[blk]||''}. ${sc.auto?'Al elegir, pasas a la siguiente.':''}`;
  if(!o.keepFocus){const h=root.querySelector('#ob-h');if(h)try{h.focus({preventScroll:true});}catch(e){}}
  const ob=_obEl();if(ob&&!o.keepScroll)ob.scrollTop=0;
}
// Ir a una pantalla (y guardar el borrador); Atrás conserva lo respondido
function obGo(id){if(!_ob||!OB_SCR[id])return;
  if(_ob.single&&_ob.ret&&id!==_ob.ret&&typeof obSingleSave==='function'){obSingleSave();return;} // (E10a) una pantalla suelta vuelve a su sitio
  if(_ob.step==='ob-rutina'&&id!=='ob-rutina'&&!_ob.single)_ob.changed=null;
  _ob.hist.push(_ob.step);_ob.step=id;_obSaveDraft();obRender();}
function obBack(){
  if(!_ob)return;
  if(!_ob.hist.length){if(_ob.from==='settings'){obClose();return;}if(_ob.step!=='ob-hola'){_ob.step='ob-hola';_obSaveDraft();obRender();}return;}
  _ob.step=_ob.hist.pop();_obSaveDraft();obRender();
}
// Escape: la hoja propia, si la hay; si no, Atrás (en P1 del primer arranque, nada)
function obEsc(){
  const sr=document.getElementById('ob-sheet-root');if(sr&&sr.innerHTML){obSheetClose();return;}
  if(_ob.step==='ob-hola'&&_ob.from==='first')return;
  obBack();
}
// Borrador: solo lo que no es de salud
function _obSaveDraft(){
  if(!_ob)return;
  const a=JSON.parse(JSON.stringify(_ob.a));['screen','zones','huesos','posparto','otraTxt'].forEach(k=>{delete a[k];});
  S.obDraft=_sanitizeObDraft({v:1,ts:Date.now(),from:_ob.from,step:_ob.step,a,alt:_ob.alt||0,pins:_ob.pins||{},places:_ob.places,
    accepted:S.obDraft&&S.obDraft.accepted||null});
  saveState();
}
// Respuestas que quedan por contestar (para «Termina tu rutina: te quedan N preguntas»)
function obLeft(a){a=a||(S.obDraft&&S.obDraft.a)||{};let n=0;['goal','exp','days','age'].forEach(k=>{if(a[k]==null)n++;});if(!a.places&&!(S.obDraft&&S.obDraft.places))n++;return n+2;}
// ✕: «¿Lo dejamos aquí?». En el primer arranque, salir = entrar en la app con la rutina de ejemplo y el borrador guardado
function obClose(){
  if(!_ob)return;
  if(_ob.from==='settings'&&_ob.single){hideOnboarding();openSettings();return;}
  confirmModal({title:'¿Lo dejamos aquí?',body:_ob.from==='settings'?'Guardo tus respuestas y tu rutina no cambia. Puedes seguir cuando quieras desde Ajustes.':'Guardo tus respuestas y puedes terminar cuando quieras desde Inicio o Ajustes.',
    okText:'Salir',cancelText:'Seguir respondiendo',onOk:()=>{
      if(!_ob)return;_obSaveDraft();const from=_ob.from;
      if(from==='first'){S.onboarded=true;if(!S.coachStart)S.coachStart=S.sessions.length>0?(S.sessions[0].ts||Date.now()):Date.now();saveState();}
      hideOnboarding();go('dash');render();if(from==='settings')openSettings();
    }});
}
// P1: las dos acciones y «Restaurar»
function obStart(mode){
  if(!_ob)showOnboarding({from:'first'});
  if(mode==='own'){_obOwn();return;}
  _ob.a.mode='gen';_obSaveDraft();
  if(OB_SCR['ob-meta'])obGo('ob-meta');
}
function _obOwn(){
  const p=_sanitizeProfile(Object.assign({},S.profile||{},{mode:'own'}));S.profile=p;S.onboarded=true;S.obDraft=null;
  if(!S.coachStart)S.coachStart=S.sessions.length>0?(S.sessions[0].ts||Date.now()):Date.now();
  saveState();hideOnboarding();go('dash');render();
}
function obRestore(){importData({fromOnboarding:true});}
// Hojas propias del cuestionario (#ob-sheet-root, z 395)
function obSheet(html,label){
  const sr=document.getElementById('ob-sheet-root');if(!sr)return;
  if(_obx){_obx=null;_obxUnmount(sr);} // (M3) otra hoja encima de la de ver y cambiar: esa suelta su animación
  sr.innerHTML=`<div class="hist-over ob-over" onclick="if(event.target===this)obSheetClose()"><div class="hist-sheet ob-sheet" role="dialog" aria-modal="true" aria-label="${esc(label||'')}" tabindex="-1">${html}</div></div>`;
  const sh=sr.querySelector('.ob-sheet');if(sh)try{sh.focus({preventScroll:true});}catch(e){}
}
// (M3) La hoja de ver y cambiar (_obx) suelta su animación 3D y devuelve el foco a quien la abrió (la imagen o ⇄ de su fila)
let _obx=null; // la hoja de ver y cambiar abierta: {letra, j, ro, cur, alts, sel, k} · solo en memoria
function obSheetClose(){const sr=document.getElementById('ob-sheet-root'),x=_obx;
  if(x){_obx=null;if(_ob)_ob.sw=null;_obxUnmount(sr);}
  if(sr)sr.innerHTML='';const h=x&&_obxOpener(x)||document.getElementById('ob-h');if(h)try{h.focus({preventScroll:true});}catch(e){}}
// Tab no sale de la capa (con #app inerte basta casi siempre; esto cubre los botones de la propia capa)
function _obTrap(ev){
  if(!_ob||ev.key!=='Tab')return;
  const sr=document.getElementById('ob-sheet-root'),box=sr&&sr.innerHTML?sr:_obEl();
  const f=[...box.querySelectorAll('button:not([disabled]),[href],input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])')].filter(x=>x.offsetParent!==null);
  if(!f.length)return;const i=f.indexOf(document.activeElement);
  if(ev.shiftKey&&(i<=0)){ev.preventDefault();f[f.length-1].focus();}
  else if(!ev.shiftKey&&(i===f.length-1||i<0&&!box.contains(document.activeElement))){ev.preventDefault();f[0].focus();}
}
document.addEventListener('keydown',_obTrap);
// P1 · ob-hola (la misma que el HTML estático, por si se vuelve a ella)
OB_SCR['ob-hola']={block:0,html:()=>`<svg class="ob-teca" viewBox="0 0 468 638" aria-hidden="true"><use href="#ob-teca-path"/></svg>
  <h1 class="ob-title" id="ob-h" tabindex="-1">Te doy la bienvenida a Gymteca</h1>
  <p class="ob-sub">Tu entrenamiento, ordenado y a tu ritmo. Sin cuenta y sin conexión: lo que respondas se queda en este móvil.</p>
  <h2 class="ob-q">¿Cómo quieres empezar?</h2>
  <div class="ob-acts">
    <button type="button" class="ob-card" onclick="obStart('gen')"><span class="ob-ci" aria-hidden="true">${ic('sparkles')}</span><span class="ob-ct"><b>Créame una rutina</b><span>Te hago unas preguntas y te preparo una rutina completa con tu material.</span><em class="ob-tag">Unos 2-3 min</em></span></button>
    <button type="button" class="ob-card" onclick="obStart('own')"><span class="ob-ci" aria-hidden="true">${ic('clipboard')}</span><span class="ob-ct"><b>Ya tengo una rutina</b><span>Entras directo a la app. Puedes meter tu rutina o pedirme una cuando quieras.</span></span></button>
  </div>
  <button type="button" class="ob-link" onclick="obRestore()">${ic('upload')} ¿Tienes una copia de seguridad? Restaurar</button>
  <p class="ob-foot">Podrás cambiar esto cuando quieras en Ajustes.</p>`};
// Inicio: «Pon tu rutina en Gymteca» (quien eligió «Ya tengo una») y, una vez, «Si algo duele»
let _ownPick=null;
function ownCardHtml(){
  const p=S.profile;if(!p||p.mode!=='own'||(p.dismiss&&p.dismiss.own))return'';
  const st=_ownPick||(_ownPick={n:Math.min(6,Math.max(2,getWeeklyTarget())),pl:(S.places&&S.places.main)||'g'});
  return`<div class="card ob-own" id="ob-own"><div class="ob-own-t">Pon tu rutina en Gymteca</div>
    <div class="ob-own-l" id="own-dl">¿Cuántos días entrenas a la semana?</div>
    <div class="ob-days" role="radiogroup" aria-labelledby="own-dl">${[2,3,4,5,6].map(n=>`<button type="button" class="ob-dn${st.n===n?' on':''}" role="radio" aria-checked="${st.n===n}" onclick="ownPick('n',${n})">${n}</button>`).join('')}</div>
    <div class="ob-own-l" id="own-pl">¿Dónde entrenas?</div>
    <div class="lib-place" role="radiogroup" aria-labelledby="own-pl">${[['g',ic('dumbbell')+' Gimnasio'],['c',ic('home')+' Casa o aire libre']].map(([k,t])=>`<button type="button" class="lib-pl${st.pl===k?' on':''}" role="radio" aria-checked="${st.pl===k}" onclick="ownPick('pl','${k}')">${t}</button>`).join('')}</div>
    <button type="button" class="btn bp" onclick="ownStart()">Empezar con ${plural(st.n,'día vacío','días vacíos')}</button>
    <button type="button" class="btn bs" onclick="ownKeep()">Partir de la de ejemplo</button></div>`;
}
function ownPick(k,v){if(!_ownPick)_ownPick={n:3,pl:'g'};_ownPick[k]=v;render();}
function _ownPlace(){const pl=(_ownPick&&_ownPick.pl)||'g';ensurePlaces();if(S.places){if(pl==='c'&&!S.places.c)S.places.c=placeFromPreset('basico');S.places.main=pl;S.places=_sanitizePlaces(S.places);try{_syncLibKit();}catch(e){}}}
function ownStart(){
  const n=(_ownPick&&_ownPick.n)||3;if(_dayEditBlocked())return;
  _ownPlace();startFromScratch(n);S.profile.dismiss.own=Date.now();S.profile=_sanitizeProfile(S.profile);saveState();
  toast(`Listo: ${plural(n,'día vacío','días vacíos')}. Empieza por el Día A`,3200);
  openRoutineEditor('A');render();
}
function ownKeep(){_ownPlace();S.profile.dismiss.own=Date.now();S.profile=_sanitizeProfile(S.profile);saveState();render();toast('Tu rutina es la de ejemplo: cámbiala cuando quieras en «Editar rutina»',3200);}
function safetyCardHtml(){
  const p=S.profile;if(!p||(p.dismiss&&p.dismiss.safety))return'';
  return`<div class="card ob-safe" id="ob-safe"><div class="ob-own-t">Si algo duele, para</div>
    <p class="ob-own-p">Una molestia leve (3 de 10 o menos) que no empeora al día siguiente es aceptable. Si es punzante, pasa de 3 de 10 o va a más, deja ese ejercicio, cámbialo con ⇄ y, si sigue, consulta. Gymteca no sustituye a un profesional sanitario.</p>
    <button type="button" class="btn bs" onclick="safetyOk()">Entendido</button></div>`;
}
function safetyOk(){if(!S.profile)return;S.profile.dismiss.safety=Date.now();S.profile=_sanitizeProfile(S.profile);saveState();render();}
// ── (E8a) Bloque 1 «Tu objetivo» y P4 «Tu tiempo» (§C P2-P4; D10: P2b y P2c; D5: control 4 de P4) ──
// Tarjetas de una respuesta: botones reales con role=radio; tocar, clic, Intro o Espacio eligen y, unos 400 ms después (con la marca a
// la vista), pasan a la siguiente; las flechas solo mueven el foco y marcan, sin avanzar. Desde Ajustes (una pantalla suelta) no avanzan.
function _obOpts(name,opts,cur,o){
  o=o||{};const ci=opts.findIndex(x=>String(x[0])===String(cur));
  return`<div class="ob-acts${o.grid?' ob-grid':''}" role="radiogroup" aria-labelledby="ob-h">${opts.map(([v,icn,t,d,tag],i)=>{const on=String(cur)===String(v);
    return`<button type="button" class="ob-card${on?' on':''}" role="radio" aria-checked="${on}" tabindex="${on||(ci<0&&i===0)?0:-1}" data-v="${esc(String(v))}" onclick="obPick('${name}',this.dataset.v)" onkeydown="_obKey(event)">${ICONOS[icn]?`<span class="ob-ci" aria-hidden="true">${ic(icn)}</span>`:''}<span class="ob-ct"><b>${esc(t)}</b>${d?`<span>${esc(d)}</span>`:''}${tag?`<em class="ob-tag">${esc(tag)}</em>`:''}</span></button>`;}).join('')}</div>${o.noAuto||(_ob&&_ob.single)?'':'<p class="ob-hint">Al tocar, pasas a la siguiente.</p>'}`;
}
function _obKey(ev){
  const k=ev.key,g=ev.currentTarget.closest('[role=radiogroup]');if(!g)return;
  const opts=[...g.querySelectorAll('[role=radio]')],i=opts.indexOf(ev.currentTarget);let j=-1;
  if(k==='ArrowRight'||k==='ArrowDown')j=(i+1)%opts.length;else if(k==='ArrowLeft'||k==='ArrowUp')j=(i-1+opts.length)%opts.length;else if(k==='Home')j=0;else if(k==='End')j=opts.length-1;
  if(j<0)return;ev.preventDefault();
  opts.forEach((b,x)=>{const on=x===j;b.setAttribute('aria-checked',on);b.classList.toggle('on',on);b.tabIndex=on?0:-1;});
  try{opts[j].focus();}catch(e){}
}
const _obWhy=t=>`<div class="tip ob-why"><b>Para qué lo pregunto.</b> ${t}</div>`;
const _obNextBtn=(fn,txt,dis)=>_ob&&_ob.single?`<div class="ob-next"><button type="button" class="btn bp" id="ob-go" onclick="obSingleSave()">Guardar</button></div>`:`<div class="ob-next"><button type="button" class="btn bp" id="ob-go" onclick="${fn}"${dis?' disabled':''}>${txt||'Seguir →'}</button></div>`;
// Elegir una respuesta de un toque: se guarda, se marca y (salvo en una pantalla suelta) se avanza
let _obAdvT=null;
function obPick(name,v){
  if(!_ob)return;const a=_ob.a;
  if(name==='days'||name==='min'||name==='daysOther')v=+v;
  if(name==='tope')v=v==='si';
  if(name==='exp'&&a.exp!==v){delete a.ritmo;delete a.paron;}
  a[name]=v;_obSaveDraft();
  const auto=OB_AUTO[name];
  if(!auto||_ob.single){obRender({keepFocus:true,keepScroll:true});const b=document.querySelector(`#ob-root [data-v="${CSS.escape(String(name==='tope'?(v?'si':'no'):v))}"]`);if(b)try{b.focus();}catch(e){}return;}
  document.querySelectorAll('#ob-root [role=radio]').forEach(b=>{const on=b.dataset.v===String(v);b.classList.toggle('on',on);b.setAttribute('aria-checked',on);});
  clearTimeout(_obAdvT);const st=_ob.step;
  _obAdvT=setTimeout(()=>{if(_ob&&_ob.step===st)obGo(auto(v));},400);
}
// A dónde lleva cada respuesta de un toque
const OB_AUTO={
  goal:()=>'ob-sexo',
  sex:()=>'ob-exp',
  enfoque:()=>'ob-foco', // (P2) la pregunta de torso y pierna va antes de las prioridades
  exp:v=>v==='gt2a'?'ob-ritmo':v==='paron'?'ob-paron':'ob-tiempo',
  ritmo:()=>'ob-tiempo'
};
// P2 · Objetivo
OB_SCR['ob-meta']={block:1,auto:true,html:()=>`<h1 class="ob-title" id="ob-h" tabindex="-1">¿Qué quieres conseguir?</h1>
  <p class="ob-sub">${_ob.repeat?'Tus respuestas ya están puestas: cambia solo lo que quieras. Tu historial se conserva y, antes de cambiar nada, te enseño qué cambia.':'Elige lo que más te importa ahora. Podrás cambiarlo cuando quieras.'}</p>
  ${_obOpts('goal',[['musculo','dumbbell','Ganar músculo','Más músculo, con pesas y descansos medios.'],['fuerza','kettlebell','Ganar fuerza','Mover más peso en los básicos, como la sentadilla o el press. Pocas repeticiones y más descanso.'],
    ['grasa','flame','Perder grasa','Pesas para conservar el músculo y algo de cardio. Lo que comes manda; yo me ocupo del entreno.'],['salud','heart','Salud y forma','Moverte mejor y sentirte bien, sin complicarte.'],
    ['aguante','battery','Aguantar más','Resistencia muscular: más repeticiones y descansos cortos.']],_ob.a.goal)}
  <p class="ob-foot">¿Dudas? Elige «Salud y forma».</p>
  ${_obWhy('Decide cuántas repeticiones haces, cuánto descansas y si añado cardio.')}`};
// P2b · Mujer u hombre (D10): solo sirve para no preguntar por el embarazo a un hombre (desde P2 del repaso, el enfoque se pregunta a todos)
OB_SCR['ob-sexo']={block:1,auto:true,html:()=>`<h1 class="ob-title" id="ob-h" tabindex="-1">¿Eres mujer u hombre?</h1>
  ${_obOpts('sex',[['m','','Mujer'],['h','','Hombre'],['nd','','Prefiero no decirlo']],_ob.a.sex)}
  ${_obWhy('Solo para no hacerte preguntas que no van contigo. No cambia la rutina, los pesos ni la seguridad.')}`};
// P3 · Experiencia
OB_SCR['ob-exp']={block:1,auto:true,html:()=>`<h1 class="ob-title" id="ob-h" tabindex="-1">¿Cuánta experiencia tienes con las pesas?</h1>
  <p class="ob-sub">Cuenta solo el tiempo entrenando con constancia, al menos dos días por semana. Si dudas, elige la más baja: subir es fácil.</p>
  ${_obOpts('exp',[['cero','sprout','Empiezo de cero','Nunca he entrenado con pesas, o casi nada.'],['lt6m','plant','Menos de 6 meses','Conozco algunos ejercicios, pero aún estoy aprendiendo.'],
    ['6m2a','trend','De 6 meses a 2 años','Entreno con constancia y hago bien los básicos.'],['gt2a','trophy','Más de 2 años','Entreno con constancia desde hace tiempo.'],
    ['paron','refresh','Vuelvo tras un parón','Entrenaba, pero llevo más de 2 meses sin hacerlo.']],_ob.a.exp)}
  ${_obWhy('Con esto elijo ejercicios de tu nivel, cuántas series haces y cómo reparto los días.')}`};
// P3a · Ritmo (solo «Más de 2 años»)
OB_SCR['ob-ritmo']={block:1,auto:true,html:()=>`<h1 class="ob-title" id="ob-h" tabindex="-1">¿Cada cuánto consigues subir de peso en los básicos?</h1>
  <p class="ob-sub">En sentadilla, press o remo, por ejemplo.</p>
  ${_obOpts('ritmo',[['semanas','trend','Casi cada semana'],['meses','hourglass','Me cuesta semanas o meses'],['nose','question','No lo sé']],_ob.a.ritmo)}
  ${_obWhy('Separa a quien aún progresa rápido de quien necesita más volumen y variedad.')}`};
// P3b · El parón (dos segmentados; «Seguir» con los dos)
function _obSeg(name,opts,cur,lbl){
  return`<div class="ob-lbl" id="ob-l-${name}">${esc(lbl)}</div><div class="lib-place ob-seg" role="radiogroup" aria-labelledby="ob-l-${name}">${opts.map(([v,t])=>{const on=cur===v;
    return`<button type="button" class="lib-pl${on?' on':''}" role="radio" aria-checked="${on}" data-v="${esc(v)}" onclick="obSeg('${name}',this.dataset.v)">${esc(t)}</button>`;}).join('')}</div>`;
}
function obSeg(name,v){if(!_ob)return;const a=_ob.a;
  if(name==='antes'||name==='fuera'){a.paron=Object.assign({},a.paron||{});a.paron[name]=v;}else a[name]=v;
  _obSaveDraft();obRender({keepFocus:true,keepScroll:true});const b=document.querySelector(`#ob-root [onclick*="'${name}'"][data-v="${CSS.escape(v)}"]`);if(b)try{b.focus();}catch(e){}}
OB_SCR['ob-paron']={block:1,html:()=>{const p=_ob.a.paron||{};return`<h1 class="ob-title" id="ob-h" tabindex="-1">Cuéntame un poco más del parón</h1>
  ${_obSeg('antes',[['lt6m','Menos de 6 meses'],['6m2a','De 6 meses a 2 años'],['gt2a','Más de 2 años']],p.antes,'Antes del parón entrenaba…')}
  ${_obSeg('fuera',[['2a6m','De 2 a 6 meses'],['gt6m','Más de 6 meses'],['gt2a','Más de 2 años']],p.fuera,'Llevo sin entrenar…')}
  ${_obWhy('Volver suele costar menos que la primera vez. Empiezo algo más suave, y la primera sesión de cada ejercicio sirve para encontrar tu peso de ahora.')}
  ${_obNextBtn("obGo('ob-tiempo')",'',!(p.antes&&p.fuera))}`;}};
// P4 · Tu tiempo
function _obBeginner(a){return a.exp==='cero'||a.exp==='lt6m'||(a.exp==='paron'&&!(a.paron&&a.paron.antes==='gt2a'&&a.paron.fuera==='2a6m'));}
function _obRecDays(a){return a.exp==='cero'||a.exp==='lt6m'||a.exp==='paron'?3:4;}
function _obRecMin(a){return _obBeginner(a)?45:60;}
function _obWeekTxt(a){
  const d=a.days,L=n=>DAY_KEYS.slice(0,n).join(' · '),beg=_obBeginner(a);
  if(beg&&d>=5&&a.tope!==false)return`Tu semana: 4 días de pesas (${L(4)}) y ${d-4} de cardio suave.`;
  return d===2?`Tu semana: ${L(2)}. Todo el cuerpo, con ejercicios distintos cada día. Si puedes, deja un día de descanso en medio.`
    :d===3?(a.consec?`Tu semana: ${L(3)}. Torso, pierna y todo el cuerpo, para que ningún músculo repita dos días seguidos.`:`Tu semana: ${L(3)}. Todo el cuerpo, con ejercicios distintos cada día.`)
    :d===4?`Tu semana: ${L(4)}. Torso y pierna: cada músculo, 2 veces.`
    :d===5?(beg?`Tu semana: ${L(5)}. Torso y pierna dos veces y un día de todo el cuerpo.`:`Tu semana: ${L(5)}. Torso, pierna, empuje, tirón y pierna.`)
    :(beg?`Tu semana: ${L(6)}. Torso y pierna, tres veces.`:`Tu semana: ${L(6)}. Empuje, tirón y pierna, dos veces, con ejercicios distintos cada vez.`);
}
function obTimeSet(k,v){if(!_ob)return;const a=_ob.a;
  if(k==='consec')a.consec=!a.consec;else a[k]=k==='tope'?v==='si':+v;
  if(k==='days'&&!(a.days>=5&&_obBeginner(a)))delete a.tope;
  if(k==='days'&&a.days>=5&&_obBeginner(a)&&a.tope==null)a.tope=true;
  _obSaveDraft();obRender({keepFocus:true,keepScroll:true});
  const b=document.querySelector(`#ob-root [data-k="${k}"][data-v="${CSS.escape(String(k==='consec'?'x':v))}"]`)||document.querySelector(`#ob-root [data-k="${k}"]`);if(b)try{b.focus();}catch(e){}}
OB_SCR['ob-tiempo']={block:2,html:()=>{const a=_ob.a;
  if(!(a.days>=2&&a.days<=6))a.days=_obRecDays(a);if(!PROF_MINS.includes(a.min))a.min=_obRecMin(a);
  if(a.days>=5&&_obBeginner(a)&&a.tope==null)a.tope=true;
  const rd=_obRecDays(a),rm=_obRecMin(a);
  const dBtn=n=>`<button type="button" class="ob-dn${a.days===n?' on':''}" role="radio" aria-checked="${a.days===n}" data-k="days" data-v="${n}" onclick="obTimeSet('days',${n})" aria-label="${plural(n,'día')}${n===rd?', recomendado':''}">${n}${n===rd?'<i class="ob-rec">Recomendado</i>':''}</button>`;
  const mBtn=m=>`<button type="button" class="lib-chip ob-min${a.min===m?' on':''}" role="radio" aria-checked="${a.min===m}" data-k="min" data-v="${m}" onclick="obTimeSet('min',${m})"><span class="nw">${m}${NB}min</span>${m===rm?'<i class="ob-rec">Recomendado</i>':''}</button>`;
  return`<h1 class="ob-title" id="ob-h" tabindex="-1">¿Cuánto tiempo tienes?</h1>
  <p class="ob-sub">Cuenta solo los días que de verdad puedes. Si un día no puedes, no pasa nada: sigues por donde lo dejaste.</p>
  <div class="ob-lbl" id="ob-l-days">Días por semana</div>
  <div class="ob-days ob-days-t" role="radiogroup" aria-labelledby="ob-l-days">${[2,3,4,5,6].map(dBtn).join('')}</div>
  ${a.days>=5&&_obBeginner(a)?`<div class="ob-lbl" id="ob-l-tope">¿Cómo quieres esos ${a.days} días?</div>
  <div class="ob-acts" role="radiogroup" aria-labelledby="ob-l-tope">${[['si','4 de pesas y el resto, cardio suave','Al empezar, 4 días de pesas rinden casi igual y recuperas mejor. Los otros días, camina o haz cardio suave.','Recomendado'],
    ['no',`Los ${a.days} de pesas`,'Más días con menos trabajo en cada uno. Si te notas cansado, el Coach te propone descargar.','']].map(([v,t,d,tag])=>{const on=(a.tope!==false)===(v==='si');
    return`<button type="button" class="ob-card${on?' on':''}" role="radio" aria-checked="${on}" data-k="tope" data-v="${v}" onclick="obTimeSet('tope','${v}')"><span class="ob-ct"><b>${esc(t)}</b><span>${esc(d)}</span>${tag?`<em class="ob-tag">${tag}</em>`:''}</span></button>`;}).join('')}</div>`:''}
  <div class="ob-lbl" id="ob-l-min">Minutos por sesión</div>
  <div class="ob-mins" role="radiogroup" aria-labelledby="ob-l-min">${PROF_MINS.map(mBtn).join('')}</div>
  ${a.days===3?`<div class="set-row ob-sw" role="switch" aria-checked="${!!a.consec}" tabindex="0" data-k="consec" onclick="obTimeSet('consec')" onkeydown="if(event.key===' '||event.key==='Enter'){event.preventDefault();obTimeSet('consec');}">
    <div class="set-row-info"><div class="set-row-t">Suelo entrenar días seguidos</div><div class="set-row-d">Así reparto los músculos para que no repitan dos días seguidos.</div></div><div class="sw${a.consec?' on':''}" aria-hidden="true"><div class="sw-k"></div></div></div>`:''}
  <div class="ob-week" aria-live="polite">${esc(_obWeekTxt(a))} <span class="ob-foot">Lo confirmo al final, con tu edad, tu salud y tu material.</span></div>
  ${a.min<=20?'<div class="tip ob-warn">Con tan poco tiempo haré lo esencial: 2 o 3 ejercicios bien elegidos. Con 30 minutos cabe una rutina completa.</div>':''}
  ${_obWhy('Con los días decido cómo repartir el cuerpo; con los minutos, cuántos ejercicios y series caben, contando calentamiento y descansos.')}
  ${_obNextBtn("obTimeNext()")}`;}};
function obTimeNext(){if(!_ob)return;_obSaveDraft();if(OB_SCR['ob-lugar'])obGo('ob-lugar');}
// ── (E8b) Bloque 2: dónde entrenas y tu material (§C P5, P6, P6b, P5', P6', P6c; D8: dos sitios desde la primera versión) ──
// El sitio que se está marcando: el principal (P5-P6) o el segundo (P5'-P6')
function _obKindOf(step){const pl=_ob.places||{};return step==='ob-lugar2'||step==='ob-material2'?(pl.main==='g'?'c':'g'):(_ob.plKind||pl.main||'g');}
function obPlKind(k){if(!_ob||(k!=='g'&&k!=='c'))return;_ob.plKind=k;obRender({keepFocus:true,keepScroll:true});}
// P5 y P5': tipo de sitio con la cifra en vivo (placeCan sobre la biblioteca)
function _obLugarHtml(second){
  const kind=second?_obKindOf('ob-lugar2'):_obKindOf('ob-lugar'),pl=_ob.places||{},cur=pl[kind]&&pl[kind].preset;
  const seg=second?'':`<div class="lib-place ob-seg" role="radiogroup" aria-label="Tipo de sitio">${[['g',ic('dumbbell')+' Gimnasio'],['c',ic('home')+' Casa o aire libre']].map(([k,t])=>`<button type="button" class="lib-pl" role="radio" aria-checked="${kind===k}" onclick="obPlKind('${k}')">${t}</button>`).join('')}</div>`;
  const opts=PRESETS_OF[kind].map(p=>{const I=PRESET_INFO[p],n=p==='propio'?null:_matCount(placeFromPreset(p),kind);
    return[p,I.ic,I.t,p==='propio'?'Lo marco yo en el paso siguiente.':I.d,n!=null?plural(n,'ejercicio'):''];});
  return`<h1 class="ob-title" id="ob-h" tabindex="-1">${second?'¿Y el otro sitio?':'¿Dónde vas a entrenar?'}</h1>
    <p class="ob-sub">${second?`Elige el que más se parezca a ${kind==='c'?'tu casa o tu sitio al aire libre':'tu gimnasio'}.`:'Elige el sitio que más se parezca. Luego puedes ajustar el material.'}</p>
    ${seg}${_obOpts(second?'preset2':'preset',opts,cur)}
    ${_obWhy('Solo te propondré ejercicios que puedas hacer ahí.')}`;
}
OB_SCR['ob-lugar']={block:2,auto:true,html:()=>_obLugarHtml(false)};
OB_SCR['ob-lugar2']={block:2,auto:true,html:()=>_obLugarHtml(true)};
// Elegir un tipo de sitio: copia del preset (o «Otra cosa», que se marca en P6)
function _obSetPreset(kind,p){
  const pl=_ob.places=_ob.places||{v:1,main:kind,g:null,c:null};
  const old=pl[kind],P=p==='propio'?(old?Object.assign(JSON.parse(JSON.stringify(old)),{preset:'propio'}):Object.assign(placeFromPreset('nada'),{preset:'propio'})):placeFromPreset(p);
  pl[kind]=P;if(!pl.main||!pl[pl.main])pl.main=kind;
}
OB_AUTO.preset=v=>{const k=_obKindOf('ob-lugar');_ob.places=_ob.places||{v:1,main:k,g:null,c:null};_ob.places.main=k;_ob.places[k==='g'?'c':'g']=_ob.places[k==='g'?'c':'g']||null;_obSetPreset(k,v);_ob.matKind=null;return v==='grande'?'ob-otro':'ob-material';};
OB_AUTO.preset2=v=>{const k=_obKindOf('ob-lugar2');_obSetPreset(k,v);return v==='grande'?'ob-reparto-sitios':'ob-material2';};
// P6 y P6': la rejilla de «Mi material» (la misma de Ajustes), con la cifra en vivo
function _obMatHtml(second){
  const kind=_obKindOf(second?'ob-material2':'ob-material');_ob.matKind=kind;const P=_ob.places&&_ob.places[kind];
  if(!P)return`<h1 class="ob-title" id="ob-h" tabindex="-1">Elige antes el tipo de sitio</h1>${_obNextBtn("obBack()",'‹ Atrás')}`;
  const gym=kind==='g',empty=['nada','parque'].includes(P.preset);
  const t=gym?'Esto es lo que suele haber':empty?'Con tu cuerpo basta':'¿Qué tienes?';
  const sub=gym?'Desmarca lo que no haya en el tuyo. Si no lo sabes, déjalo: al entrenar podrás decir «No hay esta máquina».':empty?'¿Tienes alguna de estas cosas? Cada una abre más ejercicios.':'Marca todo lo que tengas. Tu cuerpo, una silla y la pared ya cuentan.';
  const n=_matCount(P,kind);
  return`<h1 class="ob-title" id="ob-h" tabindex="-1">${esc(t)}</h1><p class="ob-sub">${esc(sub)}</p>
    <div class="ob-matn" aria-live="polite">Con esto: <b class="nw">${plural(n,'ejercicio')}</b></div>
    <div id="mat-sheet" class="ob-mat">${matGridHtml(P,kind,_ob.matOpen||{})}</div>
    ${_obWhy('Así no te propongo un press de banca si no tienes banco, ni una máquina que tu gimnasio no tiene. Lo de casa también aparece en «Mi material» del buscador de ejercicios.')}
    ${_obNextBtn(second?"obGo('ob-reparto-sitios')":"obGo('ob-otro')",empty&&n<=_matCount(placeFromPreset('nada'),'c')?'Seguir sin nada →':'Está bien así →')}`;
}
OB_SCR['ob-material']={block:2,html:()=>_obMatHtml(false)};
OB_SCR['ob-material2']={block:2,html:()=>_obMatHtml(true)};
// La rejilla trabaja sobre el sitio de «Mi material» o sobre el del cuestionario
function _matTgt(){
  if(_myMat)return{P:_myMat.draft[_myMat.kind],open:_myMat.open,re:()=>renderMyMaterial(),sel:'#mat-root'};
  if(_ob&&_ob.matKind&&_ob.places)return{P:_ob.places[_ob.matKind],open:(_ob.matOpen=_ob.matOpen||{}),re:()=>{_obSaveDraft();obRender({keepFocus:true,keepScroll:true});},sel:'#ob-root'};
  return null;
}
// P6b: ¿otro sitio?
OB_SCR['ob-otro']={block:2,auto:true,html:()=>{const m=(_ob.places&&_ob.places.main)||'g',cur=_ob.a.otro;
  return`<h1 class="ob-title" id="ob-h" tabindex="-1">¿Entrenas también en otro sitio?</h1>
    <p class="ob-sub">Por ejemplo, gimnasio entre semana y casa el fin de semana.</p>
    ${_obOpts('otro',[['no','','No, solo aquí'],['si','',m==='g'?'Sí, también en casa o al aire libre':'Sí, también en un gimnasio']],cur)}
    ${_obWhy('Preparo cada día con el material del sitio donde lo harás.')}`;}};
OB_AUTO.otro=v=>{const pl=_ob.places;if(v==='no'&&pl){pl[pl.main==='g'?'c':'g']=null;_ob.a.daysOther=0;}return v==='si'?'ob-lugar2':(OB_SCR['ob-edad']?'ob-edad':'ob-otro');};
// P6c: cuántos de tus días en el otro sitio
OB_SCR['ob-reparto-sitios']={block:2,html:()=>{const d=_ob.a.days||3,pl=_ob.places||{},o=pl.main==='g'?'c':'g',sitio=o==='c'?'en casa o al aire libre':'en el gimnasio';
  const cur=_ob.a.daysOther>=1&&_ob.a.daysOther<d?_ob.a.daysOther:null;
  return`<h1 class="ob-title" id="ob-h" tabindex="-1">¿Cuántos de tus ${d} días entrenas ${sitio}?</h1>
    <div class="ob-days" role="radiogroup" aria-labelledby="ob-h" style="grid-template-columns:repeat(${Math.max(1,d-1)},1fr)">${Array.from({length:Math.max(1,d-1)},(_,i)=>i+1).map(n=>`<button type="button" class="ob-dn${cur===n?' on':''}" role="radio" aria-checked="${cur===n}" data-v="${n}" onclick="obPick('daysOther',${n})">${n}</button>`).join('')}</div>
    ${_obWhy('Preparo esos días con el material de '+(o==='c'?'casa':'gimnasio')+' y el resto con el del otro sitio. Si un día cambias de sitio, en Inicio tienes «¿Hoy en otro sitio?».')}`;}};
OB_AUTO.daysOther=()=>OB_SCR['ob-edad']?'ob-edad':'ob-reparto-sitios';
// ── (E9a) Bloque 3: edad y seguridad (§C P7, P7x, P8, P8x, P8s, P8p, P8y; §B.3) ──
// Lo de salud vive en _ob.h (memoria) hasta el consentimiento de P9; la edad «Menos de 16», el embarazo y el posparto sin el alta no
// se guardan nunca.
OB_SCR['ob-edad']={block:3,auto:true,html:()=>`<h1 class="ob-title" id="ob-h" tabindex="-1">${_ob.repaso&&_ob.a.age!=='nd'&&OB_AGE_LBL[_ob.a.age]?`¿Sigue siendo ${OB_AGE_LBL[_ob.a.age]}?`:'¿Cuántos años tienes?'}</h1>
  <p class="ob-sub">${_ob.repaso?'Un toque si sigue igual; si has cambiado de tramo, elige el nuevo. Luego, tu seguridad.':'Solo el tramo. Cambia la prudencia y algún ejercicio, nada más.'}</p>
  ${_obOpts('age',[['lt16','','Menos de 16'],['16','','16 o 17'],['18','','18-39'],['40','','40-64'],['65','','65-74'],['75','','75 o más'],['nd','','Prefiero no decirlo']],_ob.h.menor?'lt16':_ob.a.age,{grid:true})}
  ${_obWhy('A partir de 65 añado equilibrio, más calentamiento y voy más despacio. Con menos de 18, cuido más la técnica. Si prefieres no decirlo, te preparo una rutina prudente.')}`};
OB_AUTO.age=v=>{if(v==='lt16'){delete _ob.a.age;delete _ob.a.ageTs;_ob.h.menor=true;_obSaveDraft();return'ob-menor';}
  _ob.h.menor=false;_ob.a.ageTs=Date.now();_obSaveDraft();return'ob-salud';};
// Entrar en la app sin rutina automática (§B.3): primer arranque → rutina vacía (2 días sin ejercicios), sin «Hoy toca» y con su
// tarjeta (nr: 'ent' entrenador · 'pro' quien te la ponga · 'med' visto bueno del médico); desde Ajustes, tu rutina no cambia
function _obNoRoutine(nr){
  if(!_ob)return;const from=_ob.from;
  if(from==='first'){
    const keep=nr==='med'?JSON.parse(JSON.stringify(_ob.a)):null;
    startFromScratch(2);S.weeklyTarget=Math.max(2,Math.min(6,parseInt(_ob.a.days)||2));
    S.profile=_sanitizeProfile({mode:'own',nr});S.onboarded=true;
    if(!S.coachStart)S.coachStart=S.sessions.length>0?(S.sessions[0].ts||Date.now()):Date.now();
    S.obDraft=keep?_sanitizeObDraft({v:1,ts:Date.now(),from:'first',step:'ob-salud',a:keep,alt:0,pins:{},places:_ob.places}):null;
    saveState();hideOnboarding();go('dash');render();
  }else{if(S.profile){const w=nr==='med'?'consulta':_ob.h.embTxt==='emb'?'matrona':null;if(w){S.profile.warn=w;S.profile=_sanitizeProfile(S.profile);saveState();}} // (E11b)
    hideOnboarding();openSettings();toast('Tu rutina no cambia',2600);}
}
OB_SCR['ob-menor']={block:3,html:()=>`<h1 class="ob-title" id="ob-h" tabindex="-1">Mejor con un adulto que sepa de esto</h1>
  <p class="ob-sub">Entrenar fuerza a tu edad es buena idea, pero con alguien que te enseñe la técnica: un entrenador o tu profe de Educación Física. No te preparo una rutina automática; puedes usar Gymteca para apuntar lo que hagas con esa persona.</p>
  <div class="ob-acts"><button type="button" class="btn bp" onclick="_obNoRoutine('ent')">Entrar en la app</button><button type="button" class="btn bs" onclick="obBack()">‹ Atrás</button></div>`};
// P8 · Antes de empezar, tu seguridad. Redacción propia; los conceptos vienen del criterio ACSM 2015 (no copia el PAR-Q+, 41 C-30).
const OB_SCREEN=[['sint','','En reposo o con un esfuerzo ligero (subir un piso, caminar deprisa) noto dolor u opresión en el pecho, me falta el aire mucho más que a otras personas, me mareo o noto el corazón muy acelerado o irregular'],
  ['desm','','Me he desmayado o he perdido el conocimiento en el último año sin una causa clara (no cuentes al sacarte sangre)'],
  ['enf','','Un médico me ha dicho que tengo algo de corazón, tensión alta, diabetes o riñón'],
  ['med','','Tomo medicación a diario para el corazón, la tensión o el azúcar'],
  ['superv','','Me han indicado que haga ejercicio solo con un profesional delante o que evite ciertos esfuerzos'],
  ['emb','','Estoy embarazada'],['post','','He dado a luz hace menos de un año']];
function _obScr(){if(!(_ob.h.scr instanceof Set))_ob.h.scr=new Set(Array.isArray(_ob.h.scr)?_ob.h.scr:[]);return _ob.h.scr;}
function obScreen(k){
  if(!_ob)return;const s=_obScr();
  if(k==='nada'){s.clear();_ob.h.nada=true;_ob.h.visto=false;_ob.h.superv=false;_ob.h.posparto=null;obRender({keepFocus:true,keepScroll:true});
    clearTimeout(_obAdvT);const st=_ob.step;_obAdvT=setTimeout(()=>{if(_ob&&_ob.step===st&&!_ob.single)obGo('ob-molestias');},400);return;}
  _ob.h.nada=false;if(s.has(k))s.delete(k);else s.add(k);
  obRender({keepFocus:true,keepScroll:true});const b=document.querySelector(`#ob-root [data-scr="${k}"]`);if(b)try{b.focus();}catch(e){}
}
OB_SCR['ob-salud']={block:3,html:()=>{const s=_obScr(),man=_ob.a.sex==='h';
  const rows=OB_SCREEN.filter(r=>!(man&&(r[0]==='emb'||r[0]==='post'))).map(([k,ic,t])=>{const on=s.has(k);
    return`<button type="button" class="ob-chk${on?' on':''}" role="checkbox" aria-checked="${on}" data-scr="${k}" onclick="obScreen('${k}')"><span class="ob-cb" aria-hidden="true">${on?'✓':''}</span><span class="ob-ct"><span>${esc(t)}</span></span></button>`;}).join('');
  return`<h1 class="ob-title" id="ob-h" tabindex="-1">Antes de empezar, tu seguridad</h1>
  <p class="ob-sub">Marca lo que te pase. No guardo qué marcas: como mucho, que conviene ir con calma, y solo si me dejas.</p>
  <div class="ob-acts">${rows}
    <button type="button" class="ob-card ob-none${_ob.h.nada?' on':''}" role="checkbox" aria-checked="${!!_ob.h.nada}" data-scr="nada" onclick="obScreen('nada')"><span class="ob-ci" aria-hidden="true">${ic('done')}</span><span class="ob-ct"><b>Nada de esto</b></span></button></div>
  <p class="ob-foot">No es un diagnóstico. Gymteca no sustituye a un profesional sanitario.</p>
  ${_obWhy('Entrenar fuerza es seguro para casi todo el mundo, pero con algunas condiciones conviene ir con más calma o consultarlo antes.')}
  ${s.size?_obNextBtn('obScreenNext()'):''}`;}};
// La primera rama que aplique: embarazo → P8y · posparto → P8p · síntomas o desmayo → P8x · supervisión → P8s · enfermedad o
// medicación → prudente y P9 · nada → P9
function obScreenNext(){
  if(!_ob)return;const s=_obScr();_ob.h.visto=false;_ob.h.superv=false;
  if(s.has('emb')){_ob.h.embTxt='emb';obGo('ob-embarazo');return;}
  if(s.has('post')){obGo('ob-posparto');return;}
  if(s.has('sint')||s.has('desm')){obGo('ob-medico');return;}
  if(s.has('superv')){obGo('ob-supervision');return;}
  obGo('ob-molestias');
}
OB_SCR['ob-medico']={block:3,html:()=>`<h1 class="ob-title" id="ob-h" tabindex="-1">Habla primero con tu médico</h1>
  <p class="ob-sub">El dolor en el pecho, las palpitaciones, los mareos o los desmayos hay que consultarlos antes de entrenar con esfuerzo. Cuando tengas su visto bueno, te preparo una rutina suave.</p>
  <div class="ob-acts"><button type="button" class="btn bp" onclick="_ob.h.visto=true;obGo('ob-molestias')">Ya tengo su visto bueno</button>
  <button type="button" class="btn bs" onclick="_obNoRoutine('med')">Entrar en la app sin rutina</button><button type="button" class="btn bs" onclick="obBack()">‹ Atrás</button></div>`};
OB_SCR['ob-supervision']={block:3,html:()=>`<h1 class="ob-title" id="ob-h" tabindex="-1">Sigue lo que te diga quien te supervisa</h1>
  <p class="ob-sub">Puedo prepararte una rutina suave para que esa persona la revise antes de empezar.</p>
  <div class="ob-acts"><button type="button" class="btn bp" onclick="_ob.h.superv=true;obGo('ob-molestias')">Prepárala</button>
  <button type="button" class="btn bs" onclick="_obNoRoutine('med')">Entrar en la app sin rutina</button><button type="button" class="btn bs" onclick="obBack()">‹ Atrás</button></div>`};
OB_SCR['ob-posparto']={block:3,auto:true,html:()=>`<h1 class="ob-title" id="ob-h" tabindex="-1">¿Te han dado el alta para hacer ejercicio en la revisión posparto?</h1>
  ${_obOpts('pp',[['si','','Sí'],['no','','No'],['nose','','No lo sé']],_ob.h.pp)}`};
OB_AUTO.pp=v=>{delete _ob.a.pp;_ob.h.pp=v;_obSaveDraft();
  if(v==='si'){_ob.h.posparto='alta';return'ob-molestias';}_ob.h.posparto=null;_ob.h.embTxt='post';return'ob-embarazo';};
OB_SCR['ob-embarazo']={block:3,html:()=>`<h1 class="ob-title" id="ob-h" tabindex="-1">En esta etapa, mejor con tu matrona o tu médico</h1>
  <p class="ob-sub">${_ob.h.embTxt==='post'?'Cuando te den el alta en la revisión posparto, vuelve aquí y te preparo una rutina suave.':'En el embarazo el ejercicio suele venir bien, pero hay cosas que debe valorar un profesional y no tengo una rutina adaptada. Puedes usar Gymteca para apuntar la rutina que te pongan.'}</p>
  <div class="ob-acts"><button type="button" class="btn bp" onclick="_obNoRoutine('pro')">Entrar en la app</button><button type="button" class="btn bs" onclick="obBack()">‹ Atrás</button></div>`};
// Inicio sin rutina automática: su tarjeta (sin «Hoy toca» ni «Termina tu rutina»)
function noRoutineCardHtml(){
  const p=S.profile;if(!p||!p.nr||liveDayKeys().length)return'';
  const t=p.nr==='ent'?'Apunta lo que hagas con tu entrenador':p.nr==='pro'?'Apunta la rutina que te pongan':'Cuando tengas el visto bueno de tu médico, te preparo una rutina suave';
  const d=p.nr==='med'?'':'<p class="ob-own-p">Añade sus ejercicios en «Editar rutina» y apunta cada sesión: el Coach te ayudará con los pesos.</p>';
  return`<div class="card ob-own" id="ob-nr"><div class="ob-own-t">${esc(t)}</div>${d}
    ${p.nr==='med'?`<button type="button" class="btn bp" onclick="showOnboarding({from:'first',step:'ob-salud'})">Ya tengo su visto bueno ›</button>`:`<button type="button" class="btn bs" onclick="openRoutineEditor('A')">Editar rutina</button>`}</div>`;
}
// ── (E9b) Molestias, deporte y prioridades (§C P9, P10, P10m, P11; §I.2) ──
const OB_ZONES=[['rodilla','','Rodilla'],['hombro','','Hombro'],['lumbar','','Espalda baja'],['muneca','','Muñeca o codo'],['cadera','','Cadera'],['otra','','Otra zona']];
const OB_ZKIND=[['ahora','Me duele ahora'],['antigua','Lesión antigua'],['op','Me operaron hace menos de un año']];
// ¿Hay que pedir el consentimiento? (zonas, huesos frágiles, «ir con calma» de P8 o el posparto con el alta)
function _obNeedConsent(){const h=_ob.h;return Object.keys(h.zones||{}).length>0||!!h.huesos||_obPrudent()||h.posparto==='alta';}
function _obPrudent(){const s=_obScr();return s.has('enf')||s.has('med')||!!_ob.h.visto||!!_ob.h.superv||_ob.h.posparto==='alta';}
// Preferencias con su defecto a la vista y desmarcable: «sin suelo» con 65 o más; «sin saltos» con huesos frágiles, posparto o una
// zona que duele ahora, operada o con lesión reciente (se marca en vivo)
function _obPrefDef(){const h=_ob.h,z=h.zones||{};return{floor:!['65','75'].includes(_ob.a.age),impact:!(h.huesos||h.posparto==='alta'||Object.values(z).some(v=>['ahora','op','reciente'].includes(v)))};}
function _obPref(){const d=_obPrefDef(),u=_ob.h.prefU||{};return{floor:'floor' in u?u.floor:d.floor,impact:'impact' in u?u.impact:d.impact};}
function obZone(z){if(!_ob)return;const h=_ob.h;h.zones=Object.assign({},h.zones||{});h.zrec=Object.assign({},h.zrec||{});
  if(z in h.zones){delete h.zones[z];delete h.zrec[z];}else h.zones[z]=null;_ob.h.err=null;obRender({keepFocus:true,keepScroll:true});
  const b=document.querySelector(`#ob-root [data-z="${z}"]`);if(b)try{b.focus();}catch(e){}}
function obZoneKind(z,k){if(!_ob)return;const h=_ob.h;h.zones[z]=k;if(k!=='ahora')delete (h.zrec||{})[z];_ob.h.err=null;obRender({keepFocus:true,keepScroll:true});}
function obZoneRec(z,v){if(!_ob)return;const h=_ob.h;h.zrec=Object.assign({},h.zrec||{});h.zrec[z]=v;_ob.h.err=null;obRender({keepFocus:true,keepScroll:true});}
function obZoneOtra(v){if(!_ob)return;_ob.h.otraTxt=v;obRender({keepFocus:true,keepScroll:true});}
function obHuesos(){if(!_ob)return;_ob.h.huesos=!_ob.h.huesos;obRender({keepFocus:true,keepScroll:true});}
function obPrefT(k){if(!_ob)return;const p=_obPref();_ob.h.prefU=Object.assign({},_ob.h.prefU||{});_ob.h.prefU[k]=!p[k];obRender({keepFocus:true,keepScroll:true});}
function obConsent(){if(!_ob)return;_ob.h.consent=!_ob.h.consent;obRender({keepFocus:true,keepScroll:true});}
const _obChk=(on,attr,fn,ic,t,d)=>`<button type="button" class="ob-chk${on?' on ok':''}" role="checkbox" aria-checked="${on}" ${attr} onclick="${fn}"><span class="ob-cb" aria-hidden="true">${on?'✓':''}</span>${ic?`<span class="ob-ci" aria-hidden="true">${ic}</span>`:''}<span class="ob-ct"><span>${esc(t)}</span>${d?`<span class="ob-chk-d">${esc(d)}</span>`:''}</span></button>`;
OB_SCR['ob-molestias']={block:3,html:()=>{const h=_ob.h,z=h.zones||{},p=_obPref(),any=Object.keys(z).length||h.huesos,need=_obNeedConsent();
  const zone=([k,ic,t])=>{const on=k in z;return`<button type="button" class="lib-chip ob-zc" aria-pressed="${on}" data-z="${k}" onclick="obZone('${k}')">${esc(t)}</button>`;};
  const det=Object.keys(z).map(k=>{const t=(OB_ZONES.find(x=>x[0]===k)||[])[2]||k,kind=z[k]==='reciente'?'ahora':z[k];
    return`<div class="ob-zd"><div class="ob-lbl">${esc(t)}: ¿cómo es?</div><div class="lib-place ob-seg" role="radiogroup" aria-label="${esc(t)}: ¿cómo es?">${OB_ZKIND.map(([v,l])=>`<button type="button" class="lib-pl" role="radio" aria-checked="${kind===v}" data-zk="${k}:${v}" onclick="obZoneKind('${k}','${v}')">${esc(l)}</button>`).join('')}</div>
      ${kind==='ahora'?`<div class="ob-lbl">¿Es por un golpe, una caída o un tirón de las últimas 6 semanas, o la zona está hinchada?</div><div class="lib-place ob-seg" role="radiogroup">${[['si','Sí'],['no','No']].map(([v,l])=>`<button type="button" class="lib-pl" role="radio" aria-checked="${(h.zrec||{})[k]===v}" data-zr="${k}:${v}" onclick="obZoneRec('${k}','${v}')">${l}</button>`).join('')}</div>`:''}
      ${k==='otra'?`<div class="lib-place ob-seg" role="radiogroup" aria-label="Qué zona">${[['cuello','Cuello'],['tobillo','Tobillo o pie'],['otra','Otra']].map(([v,l])=>`<button type="button" class="lib-pl" role="radio" aria-checked="${h.otraTxt===v}" onclick="obZoneOtra('${v}')">${l}</button>`).join('')}</div>`:''}</div>`;}).join('');
  return`<h1 class="ob-title" id="ob-h" tabindex="-1">${_ob.from==='settings'&&!S.health?'No guardé tus molestias: ¿tienes alguna ahora?':'¿Te molesta alguna zona al entrenar?'}</h1>
  <p class="ob-sub">Elegiré ejercicios que no la carguen. No es un diagnóstico.</p>
  <div class="ob-zones">${OB_ZONES.map(zone).join('')}</div>${det}
  ${h.err?`<p class="ob-err" role="alert">${esc(h.err)}</p>`:''}
  <div class="ob-lbl">Tus huesos</div>
  ${_obChk(!!h.huesos,'data-k="huesos"','obHuesos()','','Huesos frágiles (osteoporosis o una fractura por un golpe leve)')}
  <div class="ob-lbl">Y para que estés a gusto</div>
  ${_obChk(!p.impact,'data-k="impact"',"obPrefT('impact')",'','Prefiero sin saltos ni impacto')}
  ${_obChk(!p.floor,'data-k="floor"',"obPrefT('floor')",'','Mejor sin tumbarme en el suelo')}
  ${need?`${_obChk(!!h.consent,'data-k="consent"','obConsent()','','Guardar en este móvil mis molestias y lo que marqué de mi salud (sin el detalle), para tenerlo en cuenta cuando cambie mi rutina. Puedo borrarlo cuando quiera.')}
    <button type="button" class="ob-link" onclick="obPrivacy()">Qué guardo y cómo borrarlo</button>
    ${h.consent?'':'<p class="ob-foot">Las usaré solo para esta rutina y no las guardo.</p>'}`:''}
  ${_obWhy('Por ejemplo, con la rodilla que duele quito saltos y zancadas largas y uso prensa y sentadilla a un cajón. Si algo duele de verdad, para y consulta.')}
  <div class="ob-next">${any?`<button type="button" class="btn bp" id="ob-go" onclick="obPainNext()">Seguir →</button>`:`<button type="button" class="btn bp" id="ob-go" onclick="obPainNext()">Ninguna</button>`}
  <button type="button" class="ob-link" onclick="obPainSkip()">Prefiero no decirlo</button></div>`;}};
// Validación con texto: cada zona con su tipo y, si duele ahora, si es reciente
function obPainNext(){
  if(!_ob)return;const h=_ob.h,z=h.zones||{};
  for(const k of Object.keys(z)){const t=((OB_ZONES.find(x=>x[0]===k)||[])[2]||k).toLowerCase();
    if(!z[k]){h.err=`Dime cómo es la molestia de la ${t}.`;obRender({keepFocus:true,keepScroll:true});return;}
    if((z[k]==='ahora'||z[k]==='reciente')&&!(h.zrec||{})[k]){h.err='Dime si es de las últimas semanas.';obRender({keepFocus:true,keepScroll:true});return;}}
  Object.keys(z).forEach(k=>{if(z[k]==='ahora'||z[k]==='reciente')z[k]=(h.zrec||{})[k]==='si'?'reciente':'ahora';});
  h.err=null;if(_ob.healthFlow){_ob.healthAsked=true;obGo('ob-resp-qc');return;}obGo('ob-deporte'); // (E11a)
}
function obPainSkip(){if(!_ob)return;_ob.h.zones={};_ob.h.huesos=false;_ob.h.err=null;if(_ob.healthFlow){_ob.healthAsked=true;obGo('ob-resp-qc');return;}obGo('ob-deporte');}
// P10 · Otro deporte o cardio (opcional)
OB_SCR['ob-deporte']={block:3,auto:true,html:()=>`<h1 class="ob-title" id="ob-h" tabindex="-1">¿Haces otro deporte o cardio?</h1>
  <p class="ob-sub">Para no pasarme con las piernas y decidir si añado cardio a tu rutina.</p>
  ${_obOpts('sport',[['no','sofa','No, por ahora no'],['suave','walk','Camino o voy en bici, tranquilo'],['piernas','run','Corro o hago deporte de piernas','Fútbol, pádel, baloncesto…'],['agua','waves','Nado, remo o algo parecido']],_ob.a.sport)}
  <button type="button" class="ob-link" onclick="obPick('sport','no')">Saltar</button>
  ${_obWhy('Si ya haces cardio, no lo repito; si corres o juegas, te pongo algo menos de pierna.')}`};
// P10m solo si P8 dijo enfermedad o medicación y ahora no hace ejercicio
OB_AUTO.sport=v=>{const s=_obScr(),inact=(_ob.a.exp==='cero'||_ob.a.exp==='paron')&&v==='no';return(s.has('enf')||s.has('med'))&&inact?'ob-consulta':'ob-enfoque';};
OB_SCR['ob-consulta']={block:3,html:()=>`<h1 class="ob-title" id="ob-h" tabindex="-1">Antes de empezar, coméntalo con tu médico</h1>
  <p class="ob-sub">Con lo que marcaste, y como ahora no haces ejercicio, lo recomendable es comentarlo con tu médico antes de empezar, aunque sea suave.</p>
  <div class="ob-acts"><button type="button" class="btn bp" onclick="_ob.h.consulta='hablado';obGo('ob-enfoque')">Ya lo he hablado</button>
  <button type="button" class="btn bs" onclick="_ob.h.consulta='igual';obGo('ob-enfoque')">Empezar suave igualmente</button><button type="button" class="btn bs" onclick="obBack()">‹ Atrás</button></div>`};
// P10b · Reparto entre torso y pierna (P2 del repaso del reparto). Era el «enfoque» de D10, que solo se preguntaba a las mujeres al
// principio: ahora es para todos y va justo antes de las prioridades, cuando ya se saben los días, la edad y la salud. «Más torso» (un
// solo día de pierna) solo se ofrece a quien puede elegir reparto: desde 3 días y 30 min, y sin las reglas de prudencia (65 o más,
// «prefiero no decirlo», 16-17 años, rutina prudente), que siguen con el suyo. El generador vuelve a comprobarlo
function _obTorsoOk(){const a=_ob.a;return(a.days||3)>=3&&(a.min||60)>=30&&!['65','75','nd','16'].includes(a.age)&&!_obPrudent();}
OB_SCR['ob-enfoque']={block:3,auto:true,html:()=>{const tor=_obTorsoOk(),cur=_ob.a.enfoque==='torso'&&!tor?'igual':_ob.a.enfoque;
  return`<h1 class="ob-title" id="ob-h" tabindex="-1">¿Cómo repartes la semana entre torso y pierna?</h1>
  <p class="ob-sub">${tor?'Las tres valen':'Las dos valen'}: depende de lo que te apetezca trabajar.</p>
  ${_obOpts('enfoque',[['igual','','Equilibrado','Torso y pierna por igual.','Recomendado']].concat(tor?[['torso','','Más torso','Un solo día de pierna y el resto, torso. La pierna, lo justo para mantenerla.']]:[],
    [['gluteo','','Más glúteo y pierna','Más trabajo de glúteo y pierna, y el torso, lo justo para mantenerlo.']]),cur)}
  ${_obWhy(tor?'Con esto decido qué va cada día. Con «Más glúteo y pierna», además, el glúteo cuenta como una de tus dos prioridades. Podrás cambiarlo cuando quieras.':'Con «Más glúteo y pierna» el glúteo cuenta como una de tus dos prioridades y le doy más series; el torso se queda en lo justo.')}`;}};
// P11 · Prioridades (hasta 2; con «más glúteo» de D10, el glúteo ya ocupa una)
const OB_PRIO=[['pecho','Pecho'],['espalda','Espalda'],['hombros','Hombros'],['brazos','Brazos'],['gluteos','Glúteos'],['piernas','Piernas'],['abdomen','Abdomen']];
function obPrio(k){
  if(!_ob)return;const glu=_ob.a.enfoque==='gluteo',max=glu?1:2;let p=(_ob.a.prio||[]).filter(x=>!(glu&&x==='gluteos'));
  if(glu&&k==='gluteos')return;
  if(p.includes(k))p=p.filter(x=>x!==k);else if(p.length>=max){_ob.h.prioMsg=glu?'Como mucho 2: el glúteo ya cuenta como una.':'Como mucho 2.';obRender({keepFocus:true,keepScroll:true});return;}else p.push(k);
  _ob.a.prio=p;_ob.h.prioMsg=null;_obSaveDraft();obRender({keepFocus:true,keepScroll:true});const b=document.querySelector(`#ob-root [data-p="${k}"]`);if(b)try{b.focus();}catch(e){}
}
OB_SCR['ob-foco']={block:3,html:()=>{const glu=_ob.a.enfoque==='gluteo',p=(_ob.a.prio||[]).filter(x=>!(glu&&x==='gluteos')),none=!p.length;
  return`<h1 class="ob-title" id="ob-h" tabindex="-1">¿Quieres dar prioridad a alguna zona?</h1>
  <p class="ob-sub">${glu?'Con «Más glúteo y pierna», el glúteo ya es una de tus dos prioridades: elige otra si quieres.':'Elige hasta 2. Les doy algo más de trabajo, sin descuidar el resto.'}</p>
  <div class="ob-zones" role="group" aria-label="Prioridades">${OB_PRIO.map(([k,t])=>{const on=p.includes(k)||(glu&&k==='gluteos');
    return`<button type="button" class="lib-chip ob-zc" aria-pressed="${on}" data-p="${k}" ${glu&&k==='gluteos'?'aria-disabled="true"':''} onclick="obPrio('${k}')">${esc(t)}${glu&&k==='gluteos'?' ✓':''}</button>`;}).join('')}</div>
  <p class="ob-foot" aria-live="polite">${esc(_ob.h.prioMsg||(p.length?'Prioridad: '+p.map(k=>OB_PRIO.find(x=>x[0]===k)[1].toLowerCase()).join(' y ')+'.':''))}</p>
  ${_obWhy('Si priorizas todo, no priorizas nada: con 2 basta.')}
  ${_obNextBtn('obFinishQs()',none?'Todo por igual →':'Seguir →')}`;}};
// Respuestas para el generador (con lo de salud en memoria) y lo que se guarda (sin ello, salvo con consentimiento)
function _obAnswers(){
  const a=JSON.parse(JSON.stringify(_ob.a)),h=_ob.h||{},s=_obScr();
  const scr=[];['enf','med'].forEach(k=>{if(s.has(k))scr.push(k);});if(h.visto)scr.push('visto');if(h.superv)scr.push('superv');
  a.screen=scr.length?scr:'nada';a.zones=JSON.parse(JSON.stringify(h.zones||{}));a.huesos=!!h.huesos;if(h.posparto==='alta')a.posparto='alta';
  a.pref=_obPref();a.places=JSON.parse(JSON.stringify(_ob.places||{}));a.sport=a.sport||'no';a.prio=(a.prio||[]).filter(x=>!(a.enfoque==='gluteo'&&x==='gluteos'));
  a.style=a.style||'igual';a.power=!!a.power;a.cardioEnd=a.cardioEnd||'auto';a.daysOther=a.daysOther||0;a.consec=!!a.consec;
  if(a.enfoque!=='gluteo'&&a.enfoque!=='torso')delete a.enfoque; // (P2) «Más torso»: un solo día de pierna
  if(_ob.from==='settings'&&!a.levelManual){const ef=_obEfectiva();if(ef)a.efectiva=ef;} // (E11a) el nivel sube solo con lo entrenado
  return a;
}
function _obHealthObj(){
  const h=_ob.h||{};if(!h.consent||!_obNeedConsent())return null;
  return _sanitizeHealth({v:1,ts:Date.now(),consent:{ts:Date.now(),ver:'1'},zones:h.zones||{},otraTxt:h.otraTxt,huesos:!!h.huesos,posparto:h.posparto==='alta',prudent:_obPrudent(),screenTs:Date.now()});
}
// Fin de las preguntas: al resultado (E10a)
function obFinishQs(){if(!_ob)return;_obSaveDraft();if(OB_SCR['ob-rutina']){obGo('ob-rutina');_obGenAnimShow();}} // (E16a) con «Preparando tu rutina»
// (E16a, §F.1) Transición «generando», real y corta: lo que acabo de calcular, una línea cada 200 ms (en 1 s; con «reducir movimiento»,
// de golpe), encima del resultado ya generado y que se quita sola. Solo al llegar desde las preguntas; nada de barras ni esperas falsas.
function _obGenAnimShow(){
  const g=_ob&&_ob.g,host=document.getElementById('onboarding');if(!g||!host)return;
  const pl=_ob.places||{},P=pl[pl.main],n=P?_matCount(P,pl.main):0;
  let vol=null;try{vol=((genTexts(g).porque||[]).join(' ').match(/Unas \d+ series por semana para cada músculo grande/)||[])[0]||null;}catch(e){}
  const L=[n?`${n} ejercicios posibles con tu material`:null,_obWeekLine(g).replace(/[;.].*$/,'').replace(/^Esta semana/,'Tu semana'),vol,`Cada día cabe en ${g.inp.min}${NB}min`].filter(Boolean);
  const red=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches),old=document.getElementById('ob-gen');if(old)old.remove();
  const el=document.createElement('div');el.className='ob-gen';el.id='ob-gen';el.setAttribute('role','status');el.setAttribute('aria-live','polite');
  el.innerHTML=`<div class="ob-gen-t">Preparando tu rutina</div>${L.map((x,i)=>`<div class="ob-gen-l" style="animation-delay:${i*200}ms">✓ ${esc(x)}</div>`).join('')}`;
  host.appendChild(el);setTimeout(()=>{el.classList.add('out');setTimeout(()=>{if(el.parentNode)el.remove();},250);},red?600:1000);
}
// «Qué guardo y cómo borrarlo» (la hoja completa llega en E13)
function obPrivacy(){obSheet(`<div class="hist-sheet-head"><div class="hist-sheet-hdl"></div><div class="hist-sheet-title">Qué guardo y cómo borrarlo</div><button class="hist-sheet-close" onclick="obSheetClose()" aria-label="Cerrar">✕</button></div>
  <div class="hist-sheet-body ob-priv">${_privacyTxtHtml()}</div>`,'Qué guardo y cómo borrarlo');}
function _privacyTxtHtml(){return`<p>Todo se queda en este móvil: no hay cuenta ni servidor.</p>
  <p>Con tu permiso guardo tus molestias (zona y tipo), si tienes huesos frágiles, el posparto con el alta y que conviene ir con calma, <b>sin el motivo</b>. Sin tu permiso, las uso solo para la rutina de ahora y no quedan en ningún sitio.</p>
  <p>Nunca guardo tu edad si tienes menos de 16, ni si estás embarazada, ni qué marcaste en «Antes de empezar».</p>
  <p>Puedes borrarlo cuando quieras en Ajustes › Tu entrenamiento › Mis molestias. Las copias de seguridad las llevan solo si lo dejas activado allí.</p>`;}
// ── (E10a) P12 · Tu rutina está lista (§F) ──
// Genera con lo respondido (las respuestas de salud, en memoria) y el historial de la app: lo que ya hiciste a menudo pesa al elegir.
function _obHistCtx(){
  const h={},m=_libHistMap(),now=Date.now();
  Object.keys(m).forEach(lib=>{const x=m[lib];h[lib]={n:x.n,recent:!!(x.ts&&now-x.ts<60*86400000)};});
  return{hist:h,fav:new Set(Array.isArray(S.libFav)?S.libFav:[]),alt:_ob.alt||0};
}
// Con qué respuestas se calculó la rutina que hay en pantalla. Volver atrás, cambiar una respuesta (los días, «torso y pierna»…) y
// seguir enseñaba la rutina de antes: solo la daban por caducada las hojas de la propia pantalla de la rutina. Ahora se rehace
// siempre que las respuestas ya no son las suyas.
function _obGenKey(){try{return JSON.stringify([_obAnswers(),_ob.reparto||'dias']);}catch(e){return'';}}
function _obGenerate(){
  const a=_obAnswers(),o={reparto:_ob.reparto||'dias',tope:a.tope!==false};
  const g=genRoutineFrom(a,_obHistCtx(),o);if(!g)return null;
  const c=genCandidate(g);_obApplyPins(c,g);
  // (P1) el reparto que elegiste deja de estar guardado si ya no se te ofrece (cambiaste los días, la edad, pasaste a 2-4 entrenos…)
  if(_ob.a.plan){let ok=false;try{ok=(_ob.reparto||'dias')==='dias'&&g.E.G.planes(g.inp).otros.includes(_ob.a.plan);}catch(e){}if(!ok)delete _ob.a.plan;}
  _ob.g=g;_ob.c=c;_ob.t=genTexts(g);_ob.dirty=false;_ob.gk=_obGenKey();
  if(!_ob.tab||!c.days[_ob.tab])_ob.tab='A';
  return g;
}
// Lo cambiado a mano con ⇄ (E10c) se queda al regenerar: por día, hueco y vez
function _obPinKey(d,row,i){const n=d.rows.slice(0,i).filter(x=>x.slot===row.slot).length;return d.letra+'|'+row.slot+'|'+n;}
function _obApplyPins(c,g){
  const P=_ob.pins||{};if(!Object.keys(P).length)return;
  g.res.det.forEach(d=>{const rows=d.rows.filter(x=>x.kind!=='bal');rows.forEach((row,i)=>{if(row.kind!=='str')return;const k=_obPinKey({rows,letra:d.letra},row,i),lib=P[k];
    if(!lib||lib===row.lib||!LIB_BY_ID.has(lib))return;const ci=d.rows.indexOf(row),x=c.days[d.letra].ex[ci];if(!x)return; // (E16b) índice de la candidata
    const L=LIB_BY_ID.get(lib),e=_carryTarget({s:x.s,r:x.r,cardio:false,lib:x.lib},_libCopy(L,'pin'));
    c.days[d.letra].ex[ci]=Object.assign({},x,{lib,s:e.s,r:e.r,note:'',pin:1});});
    c.est[d.letra]=_planDayMinutesOf(c.days[d.letra].ex.map(x=>Object.assign(_libCopy(LIB_BY_ID.get(x.lib),'t'),{s:x.s,r:x.r,cardio:x.cardio})),{bal:d.rows.filter(x=>x.kind==='bal').reduce((t,x)=>t+(+x.min||0),0),apx:c.apx[d.letra],
      rest:e=>{const j=c.days[d.letra].ex.findIndex(y=>y.lib===e.lib);const y=c.days[d.letra].ex[j];return y&&y.rest||90;}});});
}
// Etiquetas de los chips (respuestas) y a qué pantalla lleva cada uno
const OB_GOAL_LBL={musculo:'Ganar músculo',fuerza:'Ganar fuerza',grasa:'Perder grasa',salud:'Salud y forma',aguante:'Aguantar más'};
const OB_EXP_LBL={cero:'Empiezo de cero',lt6m:'Menos de 6 meses',['6m2a']:'6 meses-2 años',gt2a:'Más de 2 años',paron:'Vuelvo tras un parón'};
function _obChips(){
  const a=_ob.a,pl=_ob.places||{},out=[];
  if(a.goal)out.push([OB_GOAL_LBL[a.goal],'ob-meta']);
  out.push([plural(a.days||3,'día'),'ob-tiempo'],[(a.min||60)+NB+'min','ob-tiempo']);
  ['g','c'].forEach(k=>{const P=pl[k];if(P)out.push([_placeLbl(P),k===pl.main?'ob-lugar':'ob-lugar2']);});
  if(a.exp)out.push([OB_EXP_LBL[a.exp],'ob-exp']);
  if(a.enfoque==='gluteo')out.push(['Más glúteo','ob-enfoque']);
  if(a.enfoque==='torso')out.push(['Más torso','ob-enfoque']); // (P2)
  Object.keys(_ob.h.zones||{}).forEach(z=>{const t=(OB_ZONES.find(x=>x[0]===z)||[])[2];if(t)out.push([t,'ob-molestias']);});
  const pr=(a.prio||[]).filter(x=>!(a.enfoque==='gluteo'&&x==='gluteos'));if(pr.length)out.push(['Prioridad: '+pr.map(k=>(OB_PRIO.find(x=>x[0]===k)||['',k])[1].toLowerCase()).join(' y '),'ob-foco']);
  return out;
}
// Tocar un chip: esa pregunta sola, con «Guardar», y de vuelta aquí con la rutina regenerada y «Ha cambiado: …»
function obEditFromResult(step){
  if(!_ob||!OB_SCR[step])return;
  _ob.before={a:JSON.stringify(_ob.a),split:_ob.g&&_ob.g.res.meta.split,K:_ob.g&&_ob.g.res.meta.K,places:JSON.stringify(_ob.places),h:JSON.stringify(_ob.h.zones||{})};
  _ob.hist.push(_ob.step);_ob.step=step;_ob.single=true;_ob.ret='ob-rutina';_obSaveDraft();obRender(); // (sin obGo: su desvío de pantalla suelta volvería al momento)
}
function obSingleSave(){if(!_ob)return;const r=_ob.ret||'ob-rutina';_ob.single=false;_ob.ret=null;_ob.dirty=true;_ob.hist.push(_ob.step);_ob.step=r;_obSaveDraft();
  if(r==='ob-resp')_ob.respChanged=true; // (E11a)
  if(r==='ob-rutina'){const b=_ob.before;_obGenerate();const t=_obChangedTxt();_ob.changed=b&&b.split&&_ob.g&&_ob.g.res.meta.split!==b.split?t+' → '+_obWeekLine(_ob.g).replace(/^Tu semana: |^Esta semana: /,'').replace(/\.$/,''):t;_ob.before=null;}
  obRender();}
// La semana con todos los días (43 B-1): «Tu semana: A · B · C · A»; con 2 entrenos que se alternan en 3 días, esta y la siguiente
function _obWeekLine(g){
  const m=g.res.meta,K=m.K,wd=m.wd,days=g.inp.days,L=DAY_KEYS.slice(0,K);
  let t;
  if(K===2&&wd===3)t='Esta semana: A · B · A; la siguiente: B · A · B';
  else t='Tu semana: '+Array.from({length:wd},(_,i)=>L[i%K]).join(' · ');
  if(days>wd)t+=` + ${plural(days-wd,'día')} de caminar o cardio suave`;
  return t+'.';
}
// (M3) Imagen de un ejercicio de la biblioteca: el fotograma 3D del motor (thumbsIn lo dibuja en tiempo libre y lo guarda) encima
// de su respaldo, la figura teñida con su emoji (cardio: solo el emoji), como en el selector. TH_OB: la de las filas de la rutina
// propuesta, con su escenario; en la hoja de ver y cambiar, la del selector (TH_CARD, que quien ya lo abrió tiene en caché).
const TH_OB={w:88,h:66,fit:'scene',bg:'scene'};
function _obThumbHtml(e,P){
  if(typeof _libSpriteOnce==='function')_libSpriteOnce();
  return`<span class="lib-th${e.cardio?' cardio':''}" aria-hidden="true">${thumbImgHtml(e.id,P)}${e.cardio?'':`<svg class="lib-fig" viewBox="0 0 60 40" style="${_libFigStyle(e)}"><use href="#lib-fig"/></svg>`}<span class="lib-th-e">${e.cardio?ic('run'):''}</span></span>`;
}
// La imagen de la fila j del día (índice en d.rows, con el equilibrio): un botón que abre la hoja (obSee). chg: se puede cambiar
function _obThumbBtn(d,j,L,chg){
  return`<button type="button" class="ob-thb" aria-haspopup="dialog" aria-label="Ver ${esc(L.n)}${chg?' y cambiarlo':''}" onclick="obSee('${d.letra}',${j},'th')">${_obThumbHtml(L,TH_OB)}<span class="ob-thp" aria-hidden="true">${ic('expand')}</span></button>`;
}
// (M3) Lo que lleva de verdad la rutina candidata en una fila de fuerza cuando lo has cambiado tú (⇄ o «Buscar otro ejercicio»): el
// detalle del generador (d.rows) sigue con el que propuso él, y la fila enseñaba ese aunque la rutina que se aplica llevara el tuyo
function _obRowPin(d,row){
  const c=_ob&&_ob.c,x=row.kind==='str'&&c&&c.days[d.letra]?c.days[d.letra].ex[d.rows.indexOf(row)]:null;
  return x&&x.pin&&x.lib!==row.lib&&LIB_BY_ID.has(x.lib)?x:null;
}
// «4 × 8-10» de una fila (lo tuyo si la cambiaste: las series y el objetivo que hereda, «30s» → «30 s»)
function _obRowTgt(row,pin){return pin?`${pin.s} × ${String(pin.r).replace(/^(\d+)\s*s$/,'$1'+NB+'s')}`:`${row.series} × ${row.reps}`;}
function _obRowHtml(d,row,i){
  const pin=_obRowPin(d,row),L=LIB_BY_ID.get(pin?pin.lib:row.lib),j=d.rows.indexOf(row);
  const th=L?_obThumbBtn(d,j,L,row.kind==='str'):`<span class="ob-ri" aria-hidden="true">${ic(row.kind==='warm'?'walk':row.kind==='cardio'?'run':row.kind==='bal'?'balance':'dumbbell')}</span>`;
  if(row.kind==='warm'||row.kind==='cardio')return`<div class="ob-row ob-row-c" data-j="${j}">${th}<span class="ob-rt"><b>${(n=>row.kind==='warm'?(/^calentamiento/i.test(n)?n:'Calentamiento — '+n):(/^cardio/i.test(n)?n.replace(/^Cardio\b/,'Cardio final'):'Cardio final — '+n))(esc(L?L.n:row.n))}</b><span class="nw">${esc(row.reps)}</span></span></div>`;
  if(row.kind==='bal'){ // (E14a) ejercicios del catálogo: el primero lleva la cabecera del bloque y el último, cómo progresar
    const bs=d.rows.filter(x=>x.kind==='bal'),first=bs[0]===row,last=bs[bs.length-1]===row,min=bs.reduce((t,x)=>t+(+x.min||0),0),u=!!(L&&/U/.test(L.x||''));
    return`${first?`<div class="ob-bal-h"><span aria-hidden="true">⚖️</span> Equilibrio · ${_nwX(plural(Math.round(min),'minuto'))}, junto a una pared o una silla</div>`:''}<div class="ob-row ob-row-c ob-row-bal" data-lib="${esc(row.lib||'')}" data-j="${j}">${th}<span class="ob-rt"><b>${esc(L?L.n:row.n)}</b><span>${_nwX(`${row.series} × ${esc(row.reps)}`)}${u?' por lado':''}</span>${last?'<span class="ob-rwhy">Cuando te salgan fáciles, toca la pared solo con un dedo.</span>':''}</span></div>`;}
  // (M1) con el descanso entre series apagado en Ajustes, la fila no lo enseña
  const rest=row.descanso_s&&_restOn()?fmtClock(row.descanso_s):'',k=d.letra+':'+i,open=_ob.why===k;
  const cuid=row.cuidado&&!pin?'<em class="ob-cuid">Con cuidado</em>':'';
  const why=pin?`Lo elegiste tú en lugar de ${(LIB_BY_ID.get(row.lib)||{}).n||row.n}.`:row.nota;
  return`<div class="ob-row" data-lib="${esc(pin?pin.lib:row.lib)}" data-j="${j}">${th}<span class="ob-rt"><b>${esc(L?L.n:row.n)}</b>
    <span>${_nwX(esc(_obRowTgt(row,pin)))}${rest?` · descanso ${_nwX(rest)}`:''}${cuid}</span>
    <span class="ob-ra"><button type="button" class="ob-rb" aria-expanded="${open}" onclick="obWhy('${k}')"><span>¿Por qué?</span></button>${typeof obSwap==='function'?`<button type="button" class="ob-rb ob-sw2" aria-haspopup="dialog" aria-label="Cambiar ${esc(L?L.n:'')}" onclick="obSwap('${d.letra}',${i})"><span><i aria-hidden="true">⇄</i><em>Cambiar</em></span></button>`:''}</span>${open&&why?`<span class="ob-rwhy">${esc(why)}</span>`:''}</span></div>`;
}
// (M2) Con el esfuerzo de cada serie apagado en Ajustes, la explicación de la rutina no habla de los chips 😌 💪 🥵: la línea del
// generador «Esfuerzo: 💪 Justo, te sobran 1-2.» se queda en cuántas repeticiones deben sobrar (cualquier otra que los nombrara, fuera).
// Se adapta al pintar: los textos del generador (y su prototipo gemelo) no se tocan.
// (M3b) Con el descanso entre series apagado, tampoco da tiempos de descanso: fuera «Descansos de … en los básicos…».
function _obPorque(){
  let L=(_ob&&_ob.t&&_ob.t.porque)||[];
  if(!_restOn())L=L.filter(x=>!/^Descansos de /.test(x));
  if(_rpeOn())return L;
  return L.map(x=>{const m=/^Esfuerzo: .*te sobran (.+?)(?: repeticiones)?\.$/.exec(x);
    return m?`Termina cada serie cuando aún te sobren ${m[1]} repeticiones.`:/😌|🥵|💪 Justo/.test(x)?null:x;}).filter(Boolean);
}
function obWhy(k){if(!_ob)return;_ob.why=_ob.why===k?null:k;obRender({keepFocus:true,keepScroll:true});}
function obTab(k){if(!_ob)return;_ob.tab=k;_ob.why=null;obRender({keepFocus:true,keepScroll:true});const b=document.querySelector(`#ob-root [role=tab][data-k="${k}"]`);if(b)try{b.focus();}catch(e){}}
function obMore(k){if(!_ob)return;_ob.more=Object.assign({},_ob.more||{});_ob.more[k]=!_ob.more[k];obRender({keepFocus:true,keepScroll:true});}
// Los días de la rutina generada: pestañas de día y, del día elegido, sus ejercicios con su imagen (abre la hoja de ver y
// cambiar), «¿Por qué?» y «Cambiar». Los enseñan la rutina propuesta y la revisión de fin de ciclo.
function _obDaysHtml(){
  const g=_ob.g,r=g.res,c=_ob.c,P=g.E.G.effective(g.inp),two=!!(_ob.places&&_ob.places.g&&_ob.places.c);
  const ks=Object.keys(r.days),tab=ks.includes(_ob.tab)?_ob.tab:ks[0],d=r.det.find(x=>x.letra===tab),rows=d.rows,nStr=rows.filter(x=>x.kind==='str').length;
  return`<div class="tabs ob-tabs" role="tablist" aria-label="Días de tu rutina">${ks.map(k=>{const on=k===tab,dd=r.det.find(x=>x.letra===k);return`<button type="button" class="tab ob-tab${on?' on':''}" role="tab" aria-selected="${on}" tabindex="${on?0:-1}" data-k="${k}" onclick="obTab('${k}')"><span class="pill p${k.toLowerCase()}">${k}</span>${on?' · '+esc(String(r.days[k].focus).split(/\s+[—–-]\s+/)[0]):''}</button>`;}).join('')}</div>
  <section class="ob-dpanel" role="tabpanel" aria-label="Día ${tab}">
    <div class="ob-dh"><b>Día ${tab} · ${esc(r.days[tab].focus)}</b><span>${two?ic(d.place==='c'?'home':'dumbbell')+' ':''}<span class="nw">≈ ${Math.round(c.est[tab])}${NB}min</span> · ${plural(nStr,'ejercicio')}</span></div>
    ${rows.map((x,i)=>_obRowHtml(d,x,rows.filter(y=>y.kind!=='bal').indexOf(x))).join('')}
    ${P.inicio||P.cauto?'<p class="ob-foot">4 × 8-10 = 4 series de 8 a 10 repeticiones.</p>':''}
  </section>`;
}
OB_SCR['ob-rutina']={block:4,html:()=>{
  if(!_ob.g||_ob.dirty||_ob.gk!==_obGenKey())_obGenerate();
  const g=_ob.g;if(!g)return`<h1 class="ob-title" id="ob-h" tabindex="-1">No he podido preparar tu rutina</h1>`;
  const r=g.res,t=_ob.t,pq=_obPorque(),c=_ob.c,P=g.E.G.effective(g.inp),cauto=!!P.cauto,more=_ob.more||{};
  const ks=Object.keys(r.days),ri=typeof _obRepInfo==='function'?_obRepInfo(g):null; // (P1) los días por su nombre
  const av=t.avisos.slice();if(_ob.h.consulta==='igual'){const i=av.findIndex(x=>/médico/.test(x));if(i>0)av.unshift(av.splice(i,1)[0]);}
  const kg=r.det.some(x=>x.rows.some(y=>y.kind==='str'&&(LIB_K.BY.get(y.lib)||{}).lt==='w'));
  // «A tener en cuenta»: va después de la rutina, salvo con el aviso de consultar con tu médico (med), que se queda delante
  const med=_ob.h.consulta==='igual'&&av.some(x=>/médico/.test(x));
  const avHtml=av.length?`<section class="ob-sec"><h2 class="ob-h2">A tener en cuenta</h2><ul class="ob-ul ob-av">${av.slice(0,more.av?99:t.visibles).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
    ${av.length>t.visibles?`<button type="button" class="ob-link" onclick="obMore('av')">${more.av?'Ver menos':'Ver más ('+(av.length-t.visibles)+')'}</button>`:''}</section>`:'';
  const changed=_ob.changed?`<div class="ob-changed" aria-live="polite">Ha cambiado: ${esc(_ob.changed)}</div>`:'<div class="ob-changed" aria-live="polite"></div>';
  // músculos de la rutina candidata (bloque plegado para quien empieza, cautos y 65 o más)
  const tmp={};ks.forEach(k=>{tmp[k]={label:'Día '+k,focus:'',did:'d_tmp'+k.toLowerCase(),ex:c.days[k].ex.map((x,j)=>Object.assign(_libCopy(LIB_BY_ID.get(x.lib),'t_'+k+j),{s:x.s,r:x.r,cardio:x.cardio}))};});
  const mmOpen=more.mm!=null?more.mm:!(cauto||P.lvS==='P0');
  return`<h1 class="ob-title" id="ob-h" tabindex="-1">Tu rutina está lista</h1>
  <p class="ob-sub">Basada en lo que me has contado. Toca cualquier dato para cambiarlo.</p>
  <div class="ob-chips">${_obChips().map(([l,st])=>`<button type="button" class="lib-chip ob-ch" onclick="obEditFromResult('${st}')">${esc(l).replace(/&nbsp;/g,NB)}</button>`).join('')}</div>${changed}
  ${med?avHtml:''}
  ${_obDaysHtml()}
  <section class="card ob-split"><div class="ob-wk">${esc(_obWeekLine(g))}</div>${ri&&!ri.completo?`<div class="ob-wkn">${esc(ri.dias.join(' · '))}</div>`:''}<p class="ob-p">${esc(pq[0]||'')}</p>
    ${typeof _obRepWhy==='function'?_obRepWhy(g):''}
    ${typeof obSplitSheet==='function'?'<button type="button" class="ob-link" onclick="obSplitSheet()">Cambiar reparto ›</button>':''}</section>
  <section class="ob-sec"><h2 class="ob-h2">¿Por qué esta rutina?</h2><ul class="ob-ul">${pq.slice(1,4).map(x=>`<li>${icEsf(esc(x))}</li>`).join('')}</ul>
    ${pq.length>4?'<button type="button" class="ob-link" onclick="obWhyAll()">Ver todo ›</button>':''}</section>
  ${med?'':avHtml}
  <section class="ob-sec"><h2 class="ob-h2">Cómo vas a avanzar</h2><ul class="ob-ul">${cauto?'<li>Las primeras 4 semanas, 2 series y subidas pequeñas; después te propongo pasar a 3.</li>':''}
    <li>Cada sesión: el Coach te dice cuánto poner (primero más repeticiones, luego más peso).</li><li>Cada 4 semanas: revisas tu ciclo y te propongo hasta 3 cambios.</li><li>Si te notas cansado o te estancas: una semana suave.</li></ul></section>
  <section class="ob-sec"><h2 class="ob-h2">Tu primera semana</h2><ul class="ob-ul"><li>La primera vez que hagas cada ejercicio, elige ${kg?'un peso':'la variante'} con ${kg?'el':'la'} que te sobren ${cauto?'unas 3':'2-3'} repeticiones. Desde la segunda sesión, el Coach te dice cuánto poner.</li>
    ${_rpeOn()?`<li>${ic('e2')} Justo = te sobran 1-2. ${ic('e1')} Fácil = 3 o más. ${ic('e3')} Al límite = ninguna.</li>`:''}<li>Si algo duele más de 3 sobre 10 o empeora al día siguiente, cámbialo con ⇄.</li></ul></section>
  <section class="ob-sec"><button type="button" class="ob-fold" aria-expanded="${mmOpen}" onclick="obMore('mm')">Tu semana por músculo <span aria-hidden="true">${mmOpen?'▾':'›'}</span></button>
    ${mmOpen?`<div class="mm-bars">${mmBarsHtml(mmPlanStats(tmp,r.weeklyTarget),{})}</div>`:''}</section>
  <section class="ob-sec"><button type="button" class="ob-fold" onclick="obAvoided()">Lo que he evitado ›</button></section>
  <p class="ob-foot">Si algo duele, para. Gymteca no sustituye a un profesional sanitario. <button type="button" class="ob-link ob-inl" onclick="obPrivacy()">Qué guardo y cómo borrarlo</button></p>
  <div class="ob-next ob-res">${typeof obAccept==='function'?_obAcceptBtn():''}
    ${typeof obOther==='function'?`<div class="ob-res2"><button type="button" class="btn bs" onclick="obOther(1)">Otra propuesta</button>${(_ob.alt||0)>0?'<button type="button" class="btn bs" onclick="obOther(-1)">‹ Anterior</button>':''}<button type="button" class="ob-link" onclick="obTune()">Afinar mi rutina</button></div>`:''}</div>`;}};
// «Ver todo»: el porqué entero, en una hoja
function obWhyAll(){if(!_ob||!_ob.t)return;obSheet(`<div class="hist-sheet-head"><div class="hist-sheet-hdl"></div><div class="hist-sheet-title">¿Por qué esta rutina?</div><button class="hist-sheet-close" onclick="obSheetClose()" aria-label="Cerrar">✕</button></div>
  <div class="hist-sheet-body"><ul class="ob-ul">${_obPorque().map(x=>`<li>${icEsf(esc(x))}</li>`).join('')}</ul></div>`,'¿Por qué esta rutina?');}
// «Lo que he evitado»: molestias, material y riesgos, con su motivo
function obAvoided(){
  if(!_ob||!_ob.g)return;const g=_ob.g,z=_ob.h.zones||{},out=[];
  Object.keys(z).forEach(k=>{const t=(OB_ZONES.find(x=>x[0]===k)||[])[2]||k;out.push(`Lo que carga tu ${t.toLowerCase()}: ejercicios que no la cargan o, si no hay otra opción, con cuidado y en un rango sin dolor.`);});
  if(_ob.h.huesos)out.push('Con huesos frágiles: nada que doble o gire la espalda con peso, ni saltos.');
  const pr=_obPref();if(!pr.impact)out.push('Saltos e impacto: lo pediste.');if(!pr.floor)out.push('Tumbarte en el suelo: lo pediste.');
  ['g','c'].forEach(k=>{const P=(_ob.places||{})[k];if(P&&P.preset!=='grande')out.push(`${k==='g'?'En tu gimnasio':'En casa'}: solo ejercicios con tu material (${plural(_matCount(P,k),'ejercicio posible','ejercicios posibles')}).`);});
  g.res.meta.why.filter(w=>w.c==='risk').forEach(()=>out.push('Ejercicios de riesgo para el hombro, como el jalón tras nuca.'));
  if(!out.length)out.push('Nada especial: con lo que me has contado, todo el catálogo de tu material vale.');
  obSheet(`<div class="hist-sheet-head"><div class="hist-sheet-hdl"></div><div class="hist-sheet-title">Lo que he evitado</div><button class="hist-sheet-close" onclick="obSheetClose()" aria-label="Cerrar">✕</button></div>
    <div class="hist-sheet-body"><ul class="ob-ul">${out.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`,'Lo que he evitado');
}

// «Ha cambiado: …» tras tocar un chip (fija hasta la siguiente interacción)
function _obChangedTxt(){
  const b=_ob.before;if(!b)return null;const A=JSON.parse(b.a),a=_ob.a,out=[];
  if(A.goal!==a.goal&&a.goal)out.push((OB_GOAL_LBL[a.goal]||'').toLowerCase());
  if(A.days!==a.days)out.push(`${A.days} → ${plural(a.days,'día')}`);
  if(A.min!==a.min)out.push(`${A.min} → ${a.min} min`);
  if(A.exp!==a.exp)out.push('tu experiencia');if(A.enfoque!==a.enfoque)out.push('el enfoque');
  if(JSON.stringify(A.prio||[])!==JSON.stringify(a.prio||[]))out.push('tus prioridades');
  if(b.places!==JSON.stringify(_ob.places))out.push('tu material');if(b.h!==JSON.stringify(_ob.h.zones||{}))out.push('tus molestias');
  return out.length?out.join(', '):'nada';
}
// ── (E10b) Aceptar la rutina: «Qué cambia» y «Deshacer» (§F.5, §H.3) ──
function _obAcceptBtn(){
  const w=getActiveWorkout(),ro=getReopened();
  if(w||ro){_obSaveAccepted();return`<button type="button" class="btn bp" id="ob-accept" disabled>Termina antes el entreno de hoy</button>
    <p class="ob-foot" role="status">${w?'Tienes un entreno a medias: termínalo o descártalo.':'Tienes una sesión reabierta: guárdala antes.'} He guardado esta rutina tal cual: la aplicas desde Ajustes cuando quieras.</p>
    <button type="button" class="btn bs" onclick="obGoWorkout()">Ir al entreno</button>`;}
  const own=_ob.from==='settings'&&S.profile&&S.profile.mode==='own';
  return`<button type="button" class="btn bp" id="ob-accept" onclick="obAccept()">${_ob.from==='settings'?'Usar esta rutina':'Empezar con esta rutina →'}</button>${own?'<button type="button" class="btn bs" onclick="obKeepMine()">Guardar mis respuestas y seguir con mi rutina</button>':''}`;
}
function obGoWorkout(){if(!_ob)return;hideOnboarding();go('workout');render();}
// Lo que se guarda de las respuestas (sin salud)
function _obProfileToSave(mode){const a=JSON.parse(JSON.stringify(_ob.a));['screen','zones','huesos','posparto','otraTxt','pp','preset','preset2','otro'].forEach(k=>delete a[k]);
  a.pref=_obPref();a.mode=mode||'gen';return _sanitizeProfile(a);}
// La rutina aceptada, tal cual, en el borrador (sin salud) para aplicarla después exactamente (42 R31)
function _obAcceptedPlan(c){const p={};Object.keys(c.days).forEach(k=>{p[k]={label:c.days[k].label,focus:c.days[k].focus,ex:c.days[k].ex.map((x,i)=>{const e=_libCopy(LIB_BY_ID.get(x.lib),'acc_'+k+i);e.s=x.s;e.r=x.r;if(x.cardio)e.cardio=true;return e;})};});return p;}
function _obSaveAccepted(){
  if(!_ob||!_ob.c)return;const c=_stripZoneTrace(JSON.parse(JSON.stringify(_ob.c)));
  _obSaveDraft();if(!S.obDraft)return;
  S.obDraft.accepted={cand:c,answers:_obProfileToSave('gen'),places:JSON.parse(JSON.stringify(_ob.places||null)),ts:Date.now()};
  S.obDraft=_sanitizeObDraft(S.obDraft);saveState();
}
// La rutina aceptada pendiente (si la hay) y aplicarla tal cual (desde Ajustes: «Tienes una rutina nueva sin aplicar»)
function acceptedPending(){const a=S.obDraft&&S.obDraft.accepted;return a&&a.cand&&a.cand.days?a:null;}
function applyAcceptedPending(){
  const o=acceptedPending();if(!o)return{ok:false,why:'nada'};
  return applyGeneratedPlan(JSON.parse(JSON.stringify(o.cand)),{answers:o.answers,places:o.places,health:null});
}
// (E10b) Saneado de la candidata guardada: lo que necesita applyGeneratedPlan, sin salud
function _sanitizeCand(c){
  if(!_isPlainObj(c)||!_isPlainObj(c.days))return null;
  const days={};
  Object.keys(c.days).filter(k=>DAY_KEYS.includes(k)).forEach(k=>{const d=c.days[k];if(!_isPlainObj(d)||!Array.isArray(d.ex))return;
    const ex=d.ex.filter(x=>_isPlainObj(x)&&typeof x.lib==='string'&&_LIBID_RE.test(x.lib)&&LIB_BY_ID.has(x.lib)).slice(0,16).map(x=>({lib:x.lib,
      s:x.cardio?1:Math.max(1,Math.min(10,parseInt(x.s)||2)),r:String(x.r==null?'':x.r).slice(0,20),cardio:x.cardio===true,
      note:typeof x.note==='string'?x.note.slice(0,300):'',rest:_num(x.rest,0,900),cat:_oneOf(x.cat,['iso','comp','heavy','bw']),pot:x.pot===true}));
    if(ex.length)days[k]={label:String(d.label||('Día '+k)).slice(0,80),focus:String(d.focus||'').slice(0,200),ex};});
  if(!Object.keys(days).length)return null;
  const m=_isPlainObj(c.meta)?c.meta:{},L=o=>{const r={};if(_isPlainObj(o))Object.keys(o).forEach(k=>{if(days[k])r[k]=o[k];});return r;};
  const num=(o,ks,lo,hi)=>{const r={};if(_isPlainObj(o))ks.forEach(k=>{const v=_num(o[k],lo,hi);if(v!=null)r[k]=v;});return r;};
  const vol={};if(_isPlainObj(m.vol))Object.keys(m.vol).slice(0,20).forEach(g=>{if(/^[a-z_]{2,20}$/.test(g))vol[g]=num(m.vol[g],['v','dir','obj','tope','techo'],0,99);});
  const meta={split:typeof m.split==='string'?m.split.slice(0,24):'',K:_num(m.K,1,6),wd:_num(m.wd,1,7),tpl:L(m.tpl),dayPlace:L(m.dayPlace),fd:L(m.fd),
    alternas:m.alternas===true,fz2:_isPlainObj(m.fz2)?{gym:_num(m.fz2.gym,0,7),casa:_num(m.fz2.casa,0,7)}:null,cargaLigera:m.cargaLigera===true,lifts:L(m.lifts),vuelta:_isPlainObj(m.vuelta)?{pesos:_oneOf(m.vuelta.pesos,['menos20','recalibrar'])}:null,
    rampa:_isPlainObj(m.rampa)?{series:_num(m.rampa.series,1,6)||3,reps:typeof m.rampa.reps==='string'?m.rampa.reps.slice(0,10):'8-12',rir:typeof m.rampa.rir==='string'?m.rampa.rir.slice(0,12):m.rampa.rir}:null,
    effort:_isPlainObj(m.effort)?{obj:_oneOf(m.effort.obj,PM_EFFORT)||'justo',rir:typeof m.effort.rir==='string'?m.effort.rir.slice(0,12):m.effort.rir,subidas:_oneOf(m.effort.subidas,PM_SUBIDAS)||'normal'}:null,
    vol,modes:Array.isArray(m.modes)?m.modes.filter(x=>typeof x==='string'&&/^[a-z0-9]{1,16}$/.test(x)).slice(0,12):[],level:_oneOf(m.level,PROF_LEVELS),
    corto:m.corto===true||m.corto===1,seed:_num(m.seed,0,4294967295)||0,alt:_num(m.alt,0,99)||0,why:_sanitizeCodes(m.why),warn:_sanitizeCodes(m.warn)};
  return{v:1,days,weeklyTarget:_num(c.weeklyTarget,1,7)||Object.keys(days).length,meta,apx:L(c.apx),est:L(c.est),balMin:_num(c.balMin,0,15)||0,
    rest:num(c.rest,['iso','comp','heavy','bw'],REST_MIN_S,REST_MAX_S),reparto:_oneOf(c.reparto,PM_REPARTO)||'dias',ok:true};
}
function obAccept(){
  if(!_ob||!_ob.c)return;
  const hist=(Array.isArray(S.sessions)&&S.sessions.length>0)||Object.keys(_isPlainObj(S.strength)?S.strength:{}).length>0;
  if(_ob.from==='first'&&!hist){_obDoApply();return;}
  obWhatChanges();
}
// «Qué cambia en tu rutina»: se quedan · cambian · nuevos · salen, el historial que no se toca y el ciclo que se cierra
function _obDiff(c){
  const cur=getPlan(),now=new Map();dayKeys(cur).forEach(k=>(cur[k].ex||[]).forEach(e=>{const x=routineEx(e),l=x&&!x.cardio?_libIdOf(x):null;if(l)now.set(l,x);}));
  const nw=new Map();Object.values(c.days).forEach(d=>d.ex.forEach(x=>{if(!x.cardio)nw.set(x.lib,x);}));
  let keep=0,chg=0,add=0,out=0;
  nw.forEach((x,l)=>{const o=now.get(l);if(!o)add++;else if(+o.s===+x.s&&String(o.r)===String(x.r))keep++;else chg++;});
  now.forEach((x,l)=>{if(!nw.has(l))out++;});
  return{keep,chg,add,out};
}
function obWhatChanges(){
  if(!_ob||!_ob.c)return;const d=_obDiff(_ob.c);let cy=0;try{cy=coach_cycleData().sessions.length;}catch(e){}
  obSheet(`<div class="hist-sheet-head"><div class="hist-sheet-hdl"></div><div class="hist-sheet-title">Qué cambia en tu rutina</div><button class="hist-sheet-close" onclick="obSheetClose()" aria-label="Cerrar">✕</button></div>
  <div class="hist-sheet-body ob-qc"><p class="ob-qc-n">Se quedan <b>${d.keep}</b> · cambian <b>${d.chg}</b> · nuevos <b>${d.add}</b> · salen <b>${d.out}</b></p>
    <p>Tu historial no se toca: lo que sale sigue en Progreso › Fuera de tu rutina y, si vuelve, retoma su historial.</p>
    <p>Guardo tu rutina actual por si quieres volver.</p>
    ${cy?`<p>Cierro tu ciclo actual (${plural(cy,'sesión','sesiones')}): lo verás en tu resumen.</p>`:''}
    ${S.deload?'<p>Tu descarga termina: la rutina nueva empieza con sus series normales.</p>':''}
    <button type="button" class="btn bp" onclick="obSheetClose();_obDoApply()">Usar esta rutina</button>
    <button type="button" class="btn bs" onclick="obSheetClose()">Seguir mirando</button></div>`,'Qué cambia en tu rutina');
}
function _obDoApply(){
  if(!_ob||!_ob.c)return;
  const first=_ob.from==='first',hadHist=(S.sessions||[]).length>0;
  const r=applyGeneratedPlan(_ob.c,{answers:_obProfileToSave('gen'),places:_ob.places,health:_obHealthObj()});
  if(!r.ok){toast(r.msg||'No se ha podido aplicar la rutina',3600);obRender();return;}
  const dk=S.nextDay;hideOnboarding();go('dash');render();
  if(first&&!hadHist)toast(`Rutina lista · Hoy toca el Día ${dk}`,3200);
  else showUndoToast(`Rutina nueva aplicada${r.deload?' · tu descarga terminó':''}`,()=>{const u=restorePlanPrev();render();
    if(u.ok)toast('Has vuelto a tu rutina anterior'+(r.deload?'. Tu descarga terminó al cambiar de rutina':'')+(r.cycle?'. El ciclo que se cerró sigue en tu resumen':''),3800);},null,10000);
}
// «Guardar mis respuestas y seguir con mi rutina» (quien tiene su propia rutina, desde Ajustes)
function obKeepMine(){if(!_ob)return;S.profile=Object.assign(_obProfileToSave('own'),{dismiss:(S.profile&&S.profile.dismiss)||{}});S.profile=_sanitizeProfile(S.profile);
  S.obDraft=null;saveState();hideOnboarding();openSettings();toast('Guardé tus respuestas; tu rutina no cambia',3000);}
// ── (E10c) Ajustar antes de aceptar (§F.4): ⇄, otra propuesta, cambiar reparto y afinar. Todo en el borrador ──
let _obMN=null;function _obMenus(){if(!_obMN)_obMN=GymGen.menus(LIB_K);return _obMN;}
// ⇄: las siguientes del menú de ese hueco que pasan los mismos filtros (material del sitio del día, seguridad) y no están ya
function _obAlts(letra,i){
  const g=_ob.g,d=g.res.det.find(x=>x.letra===letra);if(!d)return[];const rows=d.rows.filter(x=>x.kind!=='bal'),row=rows[i];if(!row||row.kind!=='str')return[];
  const MN=_obMenus(),P=g.E.G.effective(g.inp),cls=g.E.G.clsOf(P,g.inp),Pl=(_ob.places||{})[d.place];
  const used=new Set();Object.values(_ob.c.days).forEach(dd=>dd.ex.forEach(x=>used.add(x.lib)));
  const ids=[...MN.tiers(row.slot,cls).flat(),...((MN.MENUS[row.slot]&&MN.MENUS[row.slot].sec)||[]).flatMap(s=>s.tiers?s.tiers.flat():MN.tiers(s.slot,cls).flat())];
  const avoid=new Set(_ob.a.avoid||[]),out=[];
  for(const id of ids){if(out.length>=4)break;const L=LIB_K.BY.get(id);if(!L||used.has(id)||avoid.has(id)||out.includes(id)||!LIB_BY_ID.has(id))continue;
    if(Pl&&!LIB_K.placeCan(L,Pl,d.place))continue;if(!g.E.G.safeL(L,g.inp))continue;out.push(id);}
  return out;
}
// ── (M3) Ver y cambiar un ejercicio de la rutina propuesta. Una sola hoja, la de ⇄ y la de tocar la imagen, con el lenguaje de
// «¿Máquina ocupada?»: arriba, la animación 3D en vivo del ejercicio elegido con su nombre, sus músculos y su material; debajo, el
// de tu rutina y las opciones que te encajan (_obAlts) como radios: elegir una cambia la vista y los datos; «Cambiar por este» la
// fija con el flujo de siempre (obPinPick). Calentamiento, cardio final y equilibrio no se cambian aquí: la hoja solo los enseña ──
function obSwap(letra,i){ // ⇄ (i: fila sin contar el equilibrio)
  if(!_ob||!_ob.g)return;const d=_ob.g.res.det.find(x=>x.letra===letra),rw=d&&d.rows.filter(x=>x.kind!=='bal')[i];
  if(rw)obSee(letra,d.rows.indexOf(rw),'sw');
}
// La imagen de la fila j (índice en d.rows, con el equilibrio). k: quién la abre ('th' la imagen, 'sw' ⇄): a él vuelve el foco
function obSee(letra,j,k){
  if(!_ob||!_ob.c||!_ob.g)return;const d=_ob.g.res.det.find(x=>x.letra===letra),row=d&&d.rows[j];if(!row)return;
  const str=row.kind==='str',ex=str?_ob.c.days[letra]&&_ob.c.days[letra].ex[j]:null;if(str&&!ex)return; // (E16b) la candidata: lo fijado
  const cur=ex?ex.lib:row.lib;if(!LIB_BY_ID.has(cur))return;
  const i=str?d.rows.filter(x=>x.kind!=='bal').indexOf(row):-1;
  const x={letra,j,ro:!str,cur,alts:str?_obAlts(letra,i):[],sel:cur,k:k==='sw'?'sw':'th'};
  obSheet(_obxHtml(x,d,row),(str?'Ver y cambiar: ':'Ver ejercicio: ')+LIB_BY_ID.get(cur).n);
  const sr=document.getElementById('ob-sheet-root'),sh=sr&&sr.querySelector('.ob-sheet');if(!sh)return;
  _obx=x;_ob.sw=str?{letra,i}:null;sh.classList.add('obx');
  if(typeof GymAnim!=='undefined'){try{GymAnim.mountAll(sr);}catch(e){}}
  if(!sr.querySelector('#obx-pv[data-gym-anim]'))_busyPv(sr.querySelector('#obx-pv'),LIB_BY_ID.get(cur)); // sin animación: su mapa muscular
  thumbsIn(sr);
}
// «Día A · 4 × 8-10 · descanso 2:00» (sin el descanso si lo tienes apagado en Ajustes) · «Día A · Calentamiento · 5 min»
function _obxSubHtml(x,d,row){
  const t=row.kind==='warm'?'Calentamiento · '+esc(row.reps):row.kind==='cardio'?'Cardio final · '+esc(row.reps)
    :row.kind==='bal'?`Equilibrio · ${esc(row.series+' × '+row.reps)}${/U/.test((LIB_BY_ID.get(row.lib)||{}).x||'')?' por lado':''}`
    :esc(_obRowTgt(row,_obRowPin(d,row)))+(row.descanso_s&&_restOn()?' · descanso '+fmtClock(row.descanso_s):'');
  return`Día ${esc(x.letra)} · ${_nwX(t)}`;
}
// Nombre, músculos y material del ejercicio que se está viendo
function _obxInfoHtml(L){
  const mus=_libMusLbl(L,3),eq=L.eq||matLabel(_mat(L));
  return`<div class="obx-n">${esc(L.n)}</div><div class="obx-mus"><span class="sr-only">Trabaja: </span>${mus.map(l=>`<span class="mchip">${esc(l)}</span>`).join(' ')}</div>
    <div class="obx-eq"><span class="sr-only">Material: </span>${esc(eq)}</div>`;
}
function _obxAltHtml(x,id){
  const A=LIB_BY_ID.get(id),on=id===x.sel,cur=id===x.cur;
  return`<button type="button" class="busy-alt obx-alt" role="radio" aria-checked="${on}" tabindex="${on?0:-1}" data-lib="${esc(id)}" onclick="obxSelect(this.dataset.lib)" onkeydown="obxKey(event)">${_obThumbHtml(A,TH_CARD)}
    <span class="busy-alt-i"><span class="busy-alt-n">${esc(A.n)}</span><span class="busy-alt-m">${esc(A.eq||matLabel(_mat(A)))}</span></span>${cur?'<span class="lib-item-badge in">En tu rutina</span>':A.dif>1?`<span class="lib-item-badge">${A.dif>2?'Avanzado':'Intermedio'}</span>`:''}</button>`;
}
function _obxHtml(x,d,row){
  const L=LIB_BY_ID.get(x.cur),anim=typeof GymAnim!=='undefined'&&GymAnim.has(L.id);
  const body=x.ro?`${L.tip?`<div class="tip">${_tipHtml(L.tip)}</div>`:''}${row.kind==='cardio'?'<p class="lib-d-note">Si no lo quieres, quítalo en «Afinar mi rutina».</p>':''}`
    :`<div class="obx-lbl" id="obx-lbl">Opciones que te encajan</div>
      <div class="busy-list" role="radiogroup" aria-labelledby="obx-lbl">${[x.cur].concat(x.alts).map(id=>_obxAltHtml(x,id)).join('')}</div>
      ${x.alts.length?'':'<p class="ob-foot obx-none">Con tu material y lo que me contaste no hay otra parecida.</p>'}
      <button type="button" class="ob-link" onclick="obSwapSearch()">Buscar otro ejercicio ›</button>
      <div class="obx-out"><button type="button" class="ob-chk" role="checkbox" aria-checked="false" id="ob-avoid" onclick="this.setAttribute('aria-checked',this.getAttribute('aria-checked')!=='true');this.classList.toggle('ok')"><span class="ob-cb" aria-hidden="true"></span><span class="ob-ct"><span>No me lo vuelvas a proponer</span></span></button>
      <button type="button" class="obx-rm" onclick="obxAvoid()">Quitar y elegir otro</button></div>`;
  return`<div class="hist-sheet-head"><div class="hist-sheet-hdl"></div><div class="hist-sheet-title">${x.ro?'Ver ejercicio':'Ver y cambiar'}</div><div class="hist-sheet-sub">${_obxSubHtml(x,d,row)}</div>
      <button type="button" class="hist-sheet-close x44" onclick="obSheetClose()" aria-label="Cerrar">✕</button></div>
    <div class="obx-top"><div class="ex-anim obx-pv" id="obx-pv"${anim?` data-gym-anim="${esc(L.id)}"`:''}></div>
      <div class="obx-info" id="obx-info" aria-live="polite">${_obxInfoHtml(L)}</div></div>
    <div class="obx-sc">${body}</div>
    <div class="obx-acts"><button type="button" class="btn bs" id="obx-go" onclick="obxUse()">${x.ro?'Cerrar':'Me quedo con este'}</button></div>`;
}
// Elegir una opción: la vista en vivo y los datos pasan a ser los suyos, y el botón, «Cambiar por este»
function obxSelect(lib){
  const x=_obx,L=LIB_BY_ID.get(lib);if(!x||x.ro||!L||!(lib===x.cur||x.alts.includes(lib)))return;
  if(lib===x.sel)return;x.sel=lib;
  document.querySelectorAll('#ob-sheet-root .obx-alt').forEach(b=>{const on=b.dataset.lib===lib;b.setAttribute('aria-checked',String(on));b.tabIndex=on?0:-1;});
  const pv=document.getElementById('obx-pv');_busyPv(pv,L);
  if(pv){pv.classList.remove('obx-swp');void pv.offsetWidth;pv.classList.add('obx-swp');} // la vista nueva entra con un fundido
  const inf=document.getElementById('obx-info');if(inf)inf.innerHTML=_obxInfoHtml(L);
  const go=document.getElementById('obx-go'),chg=lib!==x.cur;if(go){go.className='btn '+(chg?'bp':'bs');go.textContent=chg?'Cambiar por este':'Me quedo con este';}
  haptic(8);
}
// Las opciones son un grupo de radios: Tab entra en la elegida y las flechas (Inicio / Fin) la cambian
function obxKey(ev){
  const B=[...document.querySelectorAll('#ob-sheet-root .obx-alt')],i=B.indexOf(ev.currentTarget||ev.target),n=B.length;
  const to={ArrowDown:i+1,ArrowRight:i+1,ArrowUp:i-1,ArrowLeft:i-1,Home:0,End:n-1}[ev.key];
  if(to===undefined||i<0||!n)return;
  ev.preventDefault();const b=B[(to+n)%n];obxSelect(b.dataset.lib);try{b.focus({preventScroll:true});b.scrollIntoView({block:'nearest'});}catch(e){}
}
// La acción principal: con otra elegida, queda fijada (obPinPick: se recalcula y avisa); con la de tu rutina, se cierra
function obxUse(){
  const x=_obx;if(!x||!_ob)return;
  if(x.ro||x.sel===x.cur||!_ob.sw){obSheetClose();return;}
  obPinPick(x.sel);_obxBack(x);
}
function obxAvoid(){const x=_obx;if(!x||!_ob||!_ob.sw)return;obSwapAvoidOnly();_obxBack(x);}
// Quien abrió la hoja (la imagen o ⇄ de su fila), también después de repintar la lista con el cambio
function _obxOpener(x){return document.querySelector(`#ob-root .ob-row[data-j="${+x.j}"] .${x.k==='sw'?'ob-sw2':'ob-thb'}`)||document.querySelector(`#ob-root .ob-row[data-j="${+x.j}"] .ob-thb`);}
function _obxBack(x){const b=x&&_ob&&(_ob.step==='ob-rutina'||_ob.step==='ob-resp-qc')?_obxOpener(x):null;if(b)try{b.focus({preventScroll:true});}catch(e){}} // (las dos pantallas con los días)
function _obxUnmount(sr){const pv=sr&&sr.querySelector('#obx-pv');if(pv&&typeof GymAnim!=='undefined'&&GymAnim.unmount){try{GymAnim.unmount(pv);}catch(e){}}}
// Elegir una: queda fijada (pins) y la rutina se recalcula; «No me lo vuelvas a proponer» va a avoid
function obPinPick(lib){
  if(!_ob||!_ob.sw)return;const {letra,i}=_ob.sw,d=_ob.g.res.det.find(x=>x.letra===letra),rows=d.rows.filter(x=>x.kind!=='bal'),row=rows[i];
  // (M3) «No me lo vuelvas a proponer» es el que se ve en la fila: el tuyo si ya lo habías cambiado, no el que propuso el generador
  const av=document.getElementById('ob-avoid');if(av&&av.getAttribute('aria-checked')==='true'){_ob.a.avoid=[...new Set([...(_ob.a.avoid||[]),(_obRowPin(d,row)||row).lib])];}
  _ob.pins=Object.assign({},_ob.pins||{});_ob.pins[_obPinKey({rows,letra},row,i)]=lib;_ob.sw=null;
  // (M3) volver al que propuso el generador: _obApplyPins no deshace un cambio ya hecho en la candidata; se rehace entera (lo demás
  // fijado se vuelve a aplicar) y el aviso lleva los minutos de la que queda
  if(lib===row.lib)_ob.dirty=true;
  _obApplyPins(_ob.c,_ob.g);_obSaveDraft();obSheetClose();obRender({keepFocus:true,keepScroll:true});
  toast(`Cambiado. El Día ${letra} dura ahora ≈ ${Math.round(_ob.c.est[letra])}${NB}min`,2800);
}
// (E16b) «Buscar otro ejercicio ›»: el selector, en la zona del ejercicio y con el material del sitio de ese día; lo elegido queda fijado
// («Otra propuesta» no lo toca). Si no encaja con lo que me contaste, se queda (lo has elegido tú) con un aviso.
function obSwapSearch(){
  if(!_ob||!_ob.sw||!_ob.g)return;const {letra,i}=_ob.sw,d=_ob.g.res.det.find(x=>x.letra===letra),row=d&&d.rows.filter(x=>x.kind!=='bal')[i];if(!row)return;
  const cur=(_obRowPin(d,row)||row).lib,L=LIB_BY_ID.get(cur),g=_ob.g; // (M3) el actual es el que se ve en la fila
  showExercisePicker({title:'Buscar otro ejercicio',mode:'swap',currentLib:cur,muscle:L?_grp(L):null,place:d.place,
    ctx:{places:JSON.parse(JSON.stringify(_ob.places||{})),inPlan:{}},
    onPick:E=>{if(!E||E.cardio||!_ob||!_ob.sw)return;const K=LIB_K.BY.get(E.id),ok=!K||g.E.G.safeL(K,g.inp),x=_obx;obPinPick(E.id);_obxBack(x); // (M3) el foco, a su fila
      if(!ok)toast('Lo dejo porque lo has elegido tú, pero no encaja del todo con lo que me contaste',3600);}});
}
// (M3) Se quita el que se ve en la fila: si ya lo habías cambiado tú, el tuyo, que además deja de estar fijado
function obSwapAvoidOnly(){if(!_ob||!_ob.sw)return;const {letra,i}=_ob.sw,d=_ob.g.res.det.find(x=>x.letra===letra),rows=d.rows.filter(x=>x.kind!=='bal'),row=rows[i],pin=_obRowPin(d,row);
  if(pin){_ob.pins=Object.assign({},_ob.pins||{});delete _ob.pins[_obPinKey({rows,letra},row,i)];}
  _ob.a.avoid=[...new Set([...(_ob.a.avoid||[]),(pin||row).lib])];_ob.sw=null;_ob.dirty=true;_obSaveDraft();obSheetClose();obRender({keepFocus:true,keepScroll:true});toast('No te lo vuelvo a proponer',2400);}
// «Otra propuesta» y «‹ Anterior»: otra semilla con el mismo reparto, series y rangos; lo fijado se queda
function obOther(dir){
  if(!_ob)return;const n=Math.max(0,(_ob.alt||0)+dir);
  if(dir>0&&n>5){toast('Ya te he enseñado las mejores opciones con estas respuestas. Si quieres algo distinto, cambia alguna.',4200);return;}
  _ob.alt=n;_ob.dirty=true;_obSaveDraft();obRender({keepFocus:true});
  if(dir>0&&Object.keys(_ob.pins||{}).length)toast(`Mantengo ${plural(Object.keys(_ob.pins).length,'ejercicio que elegiste','ejercicios que elegiste')}`,2600);
}
// ── (P1, P4) El reparto de la semana: qué va cada día. El generador dice qué repartos se ofrecen a este perfil (planes: el recomendado
// y los demás) y aquí se genera cada uno y se enseñan solo los que salen de verdad con tu material; cada ficha dice lo que hay en esa
// rutina (días por su nombre, días de pierna, veces por semana y lo que se queda corto), no lo que se pidió ──
function _obGenWith(a,plan,rep,tope,neutro){
  const b=JSON.parse(JSON.stringify(a));if(plan)b.plan=plan;else delete b.plan;b.tope=tope;
  if(neutro&&b.enfoque==='torso')delete b.enfoque; // (P2) una ficha de la hoja es ese reparto tal cual, sin el «Más torso» de tus respuestas
  const g=genRoutineFrom(b,_obHistCtx(),{reparto:rep,tope});return g&&g.res.ok?g:null;
}
function _obRepInfo(g){try{return g.E.X.reparto(g.res,g.inp);}catch(e){return null;}}
function _obRepLine(i){
  const v=n=>`${String(n).replace('.',',')}${NB}${n===1?'vez':'veces'}`;
  return i.completo?`Todo el cuerpo cada día · cada músculo, ${v(Math.min(i.vTorso,i.vPierna))} por semana`
    :`${i.pierna===1?'1 día':String(i.pierna).replace('.',',')+' días'} de pierna · torso, ${v(i.vTorso)} por semana; pierna, ${v(i.vPierna)}`;
}
// Los repartos que te valen ahora mismo, el recomendado el primero. Se calculan una vez por rutina generada (_ob.g)
function _obRepOpts(){
  if(!_ob||!_ob.g)return{planes:[],rec:null};
  if(_ob.ropts&&_ob.ropts.g===_ob.g)return _ob.ropts;
  const g0=_ob.g,a=_obAnswers(),tope=a.tope!==false,cur=_ob.reparto||'dias',E=genEngine({reparto:'dias',tope}),planes=[];
  let pl={rec:null,otros:[]};try{pl=E.G.planes(E.G.desdeRespuestas(JSON.parse(JSON.stringify(a))));}catch(e){}
  const add=(id,g,rec)=>{if(!g||g.res.meta.split!==id||planes.some(p=>p.id===id))return;const info=_obRepInfo(g);if(info)planes.push({id,g,info,rec,cur:cur==='dias'&&g0.res.meta.split===id});};
  if(pl.rec&&pl.otros.length){
    add(pl.rec,cur==='dias'&&g0.res.meta.split===pl.rec?g0:_obGenWith(a,null,'dias',tope,true),true);
    pl.otros.forEach(id=>add(id,cur==='dias'&&g0.res.meta.split===id?g0:_obGenWith(a,id,'dias',tope,true),false));
  }
  return _ob.ropts={g:g0,planes,rec:pl.rec};
}
// (P4) Por qué este reparto y qué más hay, bajo la semana. Solo promete lo que la hoja enseña de verdad
function _obRepWhy(g){
  const ro=_obRepOpts(),m=g.res.meta,cur=ro.planes.find(p=>p.cur),rec=ro.planes.find(p=>p.rec),otros=ro.planes.filter(p=>!p.cur);
  if(!rec||ro.planes.length<2||!cur)return'';
  if(cur.rec){const ej=[];if(rec.info.pierna!==1&&otros.some(p=>p.info.pierna===1))ej.push('un solo día de pierna');if(otros.some(p=>/^grp/.test(p.id)))ej.push('un día para cada grupo de músculos');
    return`<p class="ob-foot ob-rpq">Es el reparto que te recomiendo para tus ${plural(m.wd,'día')} de pesas. Si prefieres otro${ej.length?' ('+ej.join(' o ')+')':''}, en «Cambiar reparto» tienes ${otros.length===1?'uno más que también te vale':otros.length+' más que también te valen'}.</p>`;}
  return`<p class="ob-foot ob-rpq">Este reparto lo has elegido tú. El que te recomiendo para tus ${plural(m.wd,'día')} de pesas es ${esc(_joinY(rec.info.dias).toLowerCase())}.</p>`;
}
// «Cambiar reparto»: qué va cada día (P1) y, debajo, las otras formas de siempre (2-4 entrenos que se repiten, D1; el tope de quien
// empieza, D5). Solo opciones que pasan las reglas duras
function obSplitSheet(){
  if(!_ob||!_ob.g)return;const a=_obAnswers(),cur=_ob.reparto||'dias',tope=a.tope!==false,ro=_obRepOpts(),otras=[];
  if(cur==='dias'&&_obGenWith(a,null,'recomendado',tope))otras.push(['rep','recomendado','2-4 entrenos que se repiten','Repites cada ejercicio más a menudo y aprendes antes.']);
  if(cur==='recomendado'&&ro.planes.length<2&&_obGenWith(a,null,'dias',tope))otras.push(['rep','dias','Un entreno distinto cada día','Más variedad: cada ejercicio, una vez por semana.']);
  const beg=_obBeginner(_ob.a);
  if(beg&&a.days>=5&&tope&&_obGenWith(a,a.plan,cur,false))otras.push(['tope','no',`Quiero pesas los ${a.days} días`,'Más días con menos trabajo en cada uno. Si te notas cansado, el Coach te propone descargar.']);
  if(beg&&a.days>=5&&!tope&&_obGenWith(a,a.plan,cur,true))otras.push(['tope','si','4 de pesas y el resto, cardio suave','Al empezar, 4 días de pesas rinden casi igual y recuperas mejor.']);
  const tag=p=>[p.rec?'Recomendado':'',p.cur?'En tu rutina':''].filter(Boolean).join(' · ');
  const card=p=>`<button type="button" class="ob-card ob-rp" role="radio" aria-checked="${p.cur}" data-plan="${p.id}" onclick="obSplitPick('plan','${p.id}')"><span class="ob-ct"><b>${esc(p.info.dias.join(' · '))}</b><span>${esc(_obRepLine(p.info))}</span>${p.info.cortos.length?`<span class="ob-rp-c">Por debajo de lo ideal: ${esc(_joinY(p.info.cortos))}.</span>`:''}${tag(p)?`<em class="ob-tag">${tag(p)}</em>`:''}</span></button>`;
  const hayPlanes=ro.planes.length>1;
  obSheet(`<div class="hist-sheet-head"><div class="hist-sheet-hdl"></div><div class="hist-sheet-title">Cambiar reparto</div><button class="hist-sheet-close" onclick="obSheetClose()" aria-label="Cerrar">✕</button></div>
  <div class="hist-sheet-body ob-rps"><p class="ob-p ob-rps-now">${esc(_obWeekLine(_ob.g).replace(/^Tu semana: /,'Ahora: ').replace(/^Esta semana: /,'Ahora, esta semana: '))}</p>
  ${hayPlanes?`<div class="ob-lbl" id="ob-rp-l">Qué va cada día</div>${cur==='recomendado'?'<p class="ob-foot">Ahora repites 2-4 entrenos. Estos llevan un entreno distinto cada día:</p>':''}
    <div class="ob-acts" role="radiogroup" aria-labelledby="ob-rp-l">${ro.planes.map(card).join('')}</div>
    <p class="ob-foot">Con el mismo trabajo a la semana se progresa parecido con cualquiera: elige el que más te apetezca cumplir. Solo salen los que caben con tu material.</p>`:''}
  ${otras.length?`${hayPlanes?'<div class="ob-lbl">Otras formas</div>':''}<div class="ob-acts">${otras.map(([k,v,t,d])=>`<button type="button" class="ob-card" onclick="obSplitPick('${k}','${v}')"><span class="ob-ct"><b>${esc(t)}</b><span>${esc(d)}</span></span></button>`).join('')}</div>`:''}
  ${!hayPlanes&&!otras.length?'<p class="ob-foot">Con lo que me has contado, no hay otro reparto que cumpla todas las reglas.</p>':''}</div>`,'Cambiar reparto');
}
function obSplitPick(k,v){
  if(!_ob)return;const b=_obWeekLine(_ob.g),bn=((_obRepInfo(_ob.g)||{}).dias||[]).join(' · ');
  if(k==='plan'){const ro=_obRepOpts();if(!ro.planes.some(p=>p.id===v))return;_ob.reparto='dias';
    // (P2) el reparto de un solo día de pierna es la respuesta «Más torso» (así sigue si luego cambias de días); elegir otro la quita
    const una=_ob.g.E.G.UNA_PIERNA[_ob.g.res.meta.wd];
    if(v===una){_ob.a.enfoque='torso';delete _ob.a.plan;}
    else{if(_ob.a.enfoque==='torso')_ob.a.enfoque='igual';if(v===ro.rec)delete _ob.a.plan;else _ob.a.plan=v;}}
  else if(k==='rep'){_ob.reparto=v;if(v==='recomendado')delete _ob.a.plan;}
  else _ob.a.tope=v==='si';
  _ob.dirty=true;_obSaveDraft();obSheetClose();_obGenerate();
  const an=((_obRepInfo(_ob.g)||{}).dias||[]).join(' · '),l2=_obWeekLine(_ob.g).replace(/^Tu semana: |^Esta semana: /,'').replace(/\.$/,'');
  _ob.changed=k==='plan'&&bn&&an&&bn!==an?`${bn} → ${an}`:`${b.replace(/\.$/,'')} → ${l2}`;obRender({keepFocus:true});
}
// «Afinar mi rutina»: estilo, calentamiento, cardio al terminar, explosivos, nivel y los ejercicios que no quieres
function obTune(){
  if(!_ob)return;const a=_ob.a,P=_ob.g?_ob.g.E.G.effective(_ob.g.inp):{},noPow=!!(P.prud||P.mayor||P.segM||P.huesos||P.inicio||Object.values(_ob.h.zones||{}).some(v=>['ahora','op','reciente'].includes(v)));
  const seg=(k,opts,cur)=>`<div class="lib-place ob-seg" role="radiogroup">${opts.map(([v,t])=>`<button type="button" class="lib-pl" role="radio" aria-checked="${String(cur)===String(v)}" onclick="obTuneSet('${k}','${v}')">${esc(t)}</button>`).join('')}</div>`;
  obSheet(`<div class="hist-sheet-head"><div class="hist-sheet-hdl"></div><div class="hist-sheet-title">Afinar mi rutina</div><button class="hist-sheet-close" onclick="obTuneClose()" aria-label="Cerrar">✕</button></div>
  <div class="hist-sheet-body ob-tune">
    <div class="ob-lbl">¿Cómo prefieres entrenar?</div>${seg('style',[['maq','Máquinas y poleas'],['libre','Peso libre'],['igual','Me da igual']],a.style||'igual')}
    <div class="ob-lbl">Calentamiento</div>${seg('warm',[['normal','Normal (5 min)'],['corto','Corto (3 min)']],a.warm||'normal')}
    <div class="ob-lbl">Cardio al terminar</div>${seg('cardioEnd',[['auto','Según mi objetivo'],['si','Siempre'],['no','Nunca']],a.cardioEnd||'auto')}
    ${noPow?'':`<div class="ob-lbl">Explosivos</div>${seg('power',[['1','Incluir saltos'],['0','Sin explosivos']],a.power?'1':'0')}`}
    <div class="ob-lbl">Nivel</div>${seg('levelManual',[['','Automático'],['P','Principiante'],['I','Intermedio'],['A','Avanzado']],a.levelManual||'')}
    ${(a.avoid||[]).length?`<div class="ob-lbl">Ejercicios que no quieres</div>${a.avoid.map(id=>`<div class="ob-av1"><span>${esc((LIB_BY_ID.get(id)||{}).n||id)}</span><button type="button" class="ob-link" onclick="obUnavoid('${id}')">Volver a permitir</button></div>`).join('')}`:''}
    <button type="button" class="btn bp" onclick="obTuneClose()">Listo</button></div>`,'Afinar mi rutina');
}
function obTuneSet(k,v){if(!_ob)return;if(k==='power')_ob.a.power=v==='1';else if(k==='levelManual'){if(v)_ob.a.levelManual=v;else delete _ob.a.levelManual;}else _ob.a[k]=v;_ob.dirty=true;_obSaveDraft();obTune();}
function obUnavoid(id){if(!_ob)return;_ob.a.avoid=(_ob.a.avoid||[]).filter(x=>x!==id);_ob.dirty=true;_obSaveDraft();obTune();}
function obTuneClose(){obSheetClose();if(_ob&&_ob.dirty)obRender({keepFocus:true});}
// ── (E11a) Ajustes › Tu entrenamiento: «Tus respuestas» y «Qué cambia» (§H.1-§H.3) ──
// Respuestas guardadas → cuestionario (con lo de salud solo si hay consentimiento)
function _obPrefill(){
  if(!_ob)return;const p=S.profile;
  if(p){const a=JSON.parse(JSON.stringify(p));['v','ts','dismiss','nr'].forEach(k=>delete a[k]);Object.keys(a).forEach(k=>{if(a[k]==null)delete a[k];});_ob.a=Object.assign({},a,{mode:'gen'});}
  _ob.places=S.places?JSON.parse(JSON.stringify(S.places)):_ob.places;
  const h=S.health;_ob.h={nada:!(h&&h.prudent)};
  if(h){_ob.h.zones=JSON.parse(JSON.stringify(h.zones||{}));_ob.h.zrec={};Object.keys(_ob.h.zones).forEach(z=>{if(_ob.h.zones[z]==='reciente'||_ob.h.zones[z]==='ahora')_ob.h.zrec[z]=_ob.h.zones[z]==='reciente'?'si':'no';});
    _ob.h.huesos=!!h.huesos;if(h.posparto)_ob.h.posparto='alta';if(h.otraTxt)_ob.h.otraTxt=h.otraTxt;_ob.h.consent=true;if(h.prudent)_ob.h.visto=true;}
  if(p&&p.pref){_ob.h.prefU={floor:p.pref.floor,impact:p.pref.impact};}
  // (P5) la forma de reparto de tu rutina de ahora (antes, al rehacerla desde Ajustes se perdía «2-4 entrenos que se repiten»)
  _ob.reparto=_isPlainObj(S.planMeta)&&S.planMeta.reparto==='recomendado'?'recomendado':'dias';
}
// Nivel efectivo al regenerar (43 I-3): con lo que has entrenado, sube solo
function _obEfectiva(){const L=(S.sessions||[]).filter(s=>s&&s.ts);if(!L.length)return null;return{sesiones:L.length,semanas:Math.max(0,Math.floor((Date.now()-L[0].ts)/(7*864e5)))};}
const OB_AGE_LBL={'16':'16 o 17','18':'18-39','40':'40-64','65':'65-74','75':'75 o más',nd:'Prefiero no decirlo'};
const OB_SPORT_LBL={no:'No, por ahora no',suave:'Camino o voy en bici',piernas:'Corro o hago deporte de piernas',agua:'Nado, remo o algo parecido'};
function _obRespRows(){
  const a=_ob.a,pl=_ob.places||{},pr=(a.prio||[]).filter(x=>!(a.enfoque==='gluteo'&&x==='gluteos'));
  const rows=[['ob-meta','Objetivo',(OB_GOAL_LBL[a.goal]||'—')],['ob-sexo','Mujer u hombre',({m:'Mujer',h:'Hombre',nd:'Prefiero no decirlo'})[a.sex]||'—']];
  rows.push(['ob-exp','Experiencia',OB_EXP_LBL[a.exp]||'—'],['ob-tiempo','Tu tiempo',a.days?`${plural(a.days,'día')} · ${a.min||60}${NB}min`:'—'],
    ['ob-lugar','Dónde entrenas',['g','c'].filter(k=>pl[k]).map(k=>_placeLbl(pl[k])).join(' · ')||'—'],
    ['ob-edad','Edad',OB_AGE_LBL[a.age]||'—'],['ob-molestias','Molestias',S.health?Object.keys(S.health.zones||{}).map(z=>(OB_ZONES.find(x=>x[0]===z)||['',z])[2]).join(', ')||'Ninguna':'No guardadas'],
    ['ob-deporte','Otro deporte',OB_SPORT_LBL[a.sport]||'—'],['ob-enfoque','Torso y pierna',({gluteo:'Más glúteo y pierna',torso:'Más torso'})[a.enfoque]||'Equilibrado'],['ob-foco','Prioridades',(a.enfoque==='gluteo'?['Glúteos']:[]).concat(pr.map(k=>(OB_PRIO.find(x=>x[0]===k)||['',k])[1])).join(' y ')||'Todo por igual']);
  return rows;
}
OB_SCR['ob-resp']={block:0,html:()=>{const ef=_obEfectiva();
  return`<h1 class="ob-title" id="ob-h" tabindex="-1">Tus respuestas</h1>
  <p class="ob-sub">Cambia la que quieras: antes de tocar tu rutina, te enseño qué cambia.</p>
  <div class="set-section ob-resp">${_obRespRows().map(([st,t,v])=>`<button type="button" class="set-row ob-rr" onclick="obRespEdit('${st}')"><span class="set-row-info"><span class="set-row-t">${esc(t)}</span><span class="set-row-d">${esc(v)}</span></span><span class="set-row-arrow" aria-hidden="true">›</span></button>`).join('')}</div>
  ${ef&&ef.sesiones>=12?`<p class="ob-foot">Tu nivel sube solo con lo que entrenas: llevas ${plural(ef.sesiones,'sesión','sesiones')} en ${plural(ef.semanas,'semana')}.</p>`:''}
  ${_ob.respChanged?_obNextBtn('obRespReview()','Ver qué cambia en tu rutina →'):''}`;}};
function obRespEdit(st){if(!_ob||!OB_SCR[st])return;_ob.before={a:JSON.stringify(_ob.a),places:JSON.stringify(_ob.places),h:JSON.stringify(_ob.h.zones||{})};
  _ob.hist.push(_ob.step);_ob.step=st;_ob.single=true;_ob.ret='ob-resp';obRender();}
// Sin consentimiento de salud guardado, antes de regenerar se repasan P8 y P9 (43 I-9)
function obRespReview(){if(!_ob)return;if(!S.health&&!_ob.healthAsked){_ob.healthFlow='resp';_ob.h.scr=new Set();_ob.h.nada=false;obGo('ob-salud');return;}obGo('ob-resp-qc');}
// «Qué cambia en tu rutina»: con la rutina regenerada; aplicar, solo guardar la respuesta o cancelar
OB_SCR['ob-resp-qc']={block:0,html:()=>{
  _ob.dirty=true;_obGenerate();const c=_ob.c;if(!c)return`<h1 class="ob-title" id="ob-h" tabindex="-1">No he podido preparar tu rutina</h1>`;
  const d=_obDiff(c),ri=typeof _obRepInfo==='function'?_obRepInfo(_ob.g):null;let cy=0;try{cy=coach_cycleData().sessions.length;}catch(e){} // (P5) los días por su nombre
  return`<h1 class="ob-title" id="ob-h" tabindex="-1">Qué cambia en tu rutina</h1>
  <div class="ob-qc"><p class="ob-qc-n">Se quedan <b>${d.keep}</b> · cambian <b>${d.chg}</b> · nuevos <b>${d.add}</b> · salen <b>${d.out}</b></p>
  <p>${esc(_obWeekLine(_ob.g))}${ri&&!ri.completo?'<br>'+esc(ri.dias.join(' · '))+'.':''}</p>
  ${_ob.changed?`<div class="ob-changed" aria-live="polite">Ha cambiado: ${esc(_ob.changed)}</div>`:''}
  ${typeof obSplitSheet==='function'?'<button type="button" class="ob-link ob-qc-rp" onclick="obSplitSheet()">Cambiar reparto ›</button>':''}
  <p>Tu historial no se toca: lo que sale sigue en Progreso › Fuera de tu rutina y, si vuelve, retoma su historial. Guardo tu rutina actual por si quieres volver.</p>
  ${cy?`<p>Cierro tu ciclo actual (${plural(cy,'sesión','sesiones')}): lo verás en tu resumen.</p>`:''}</div>
  <section class="ob-sec ob-qc-days"><h2 class="ob-h2">Tu rutina nueva</h2><p class="ob-foot">Toca una imagen para ver el ejercicio o cambiarlo antes de aplicar.</p></section>
  ${_obDaysHtml()}
  <div class="ob-next ob-res"><button type="button" class="btn bp" id="ob-go" onclick="obRespApply()">Aplicar cambios</button>
  ${_ob.fromCycle||_ob.splitFlow?'':'<button type="button" class="btn bs" onclick="obRespSaveOnly()">Solo guardar la respuesta</button>'}<button type="button" class="ob-link" onclick="obRespCancel()">Cancelar</button></div>`;}};
function obRespApply(){if(!_ob||!_ob.c)return;const bl=_applyGuard();if(bl){toast(bl.msg,3600);return;}_obDoApply();}
function obRespSaveOnly(){if(!_ob)return;S.profile=Object.assign(_obProfileToSave(S.profile&&S.profile.mode||'gen'),{dismiss:(S.profile&&S.profile.dismiss)||{}});S.profile=_sanitizeProfile(S.profile);
  if(_ob.places){S.places=_sanitizePlaces(_ob.places);try{_syncLibKit();}catch(e){}}const h=_obHealthObj();if(h)S.health=h;
  const rp=!!_ob.repaso;saveState();hideOnboarding();if(rp){go('dash');toast('Repaso hecho: tu rutina no cambia',3000);}else{openSettings();toast('Guardé tu respuesta; tu rutina no cambia',3000);}}
function obRespCancel(){if(!_ob)return;const fc=!!_ob.fromCycle,rp=!!_ob.repaso;hideOnboarding();if(fc)go('coach');else if(rp)go('dash');else openSettings();}
function openAnswers(){closeSettings();showOnboarding({from:'settings',step:'ob-resp'});_obPrefill();_ob.hist=[];obRender();}
// (P5, repaso del reparto) «Cambiar reparto» con la rutina ya aceptada: tus respuestas tal cual, «Qué cambia en tu rutina» y, encima,
// la hoja de repartos. Sin consentimiento de salud guardado, antes se repasan P8 y P9, como en cualquier cambio (43 I-9); al llegar a
// «Qué cambia», el enlace «Cambiar reparto ›» abre la hoja. Aplicar guarda la rutina de ahora para poder volver
function openSplitChange(){
  closeSettings();showOnboarding({from:'settings',step:'ob-resp'});_obPrefill();_ob.hist=[];_ob.splitFlow=true;obRespReview();
  if(_ob&&_ob.step==='ob-resp-qc'&&_ob.g)obSplitSheet();
}
// La sección de Ajustes
function trainSectionHtml(){
  const p=S.profile,d=S.obDraft,acc=acceptedPending(),rows=[];
  if(acc)rows.push(['Tienes una rutina nueva sin aplicar','La que aceptaste mientras entrenabas: la aplico tal cual.','applyAcceptedUI()']);
  else if(d&&d.step&&!['ob-hola','ob-resp','ob-resp-qc'].includes(d.step)&&!(p&&p.mode==='gen'))rows.push(['Seguir creando mi rutina','Seguimos donde lo dejaste.',"closeSettings();showOnboarding({from:'settings',step:S.obDraft.step})"]);
  if(p&&p.mode==='gen')rows.push(['Tus respuestas','Cambia una y te enseño qué cambia en tu rutina.','openAnswers()']);
  if(p&&p.mode==='gen'&&typeof openSplitChange==='function')rows.push(['Cambiar reparto','Qué va cada día de tu semana. Elige otro y te enseño qué cambia.','openSplitChange()']); // (P5)
  if(typeof repeatQuestionnaire==='function')rows.push(['Repetir el cuestionario',p&&p.mode==='gen'?'Con tus respuestas puestas: cambia solo lo que quieras.':'Te preparo una rutina a medida en 2-3 minutos.','repeatQuestionnaire()']);
  if(typeof restorePlanPrevUI==='function'&&S.planPrev)rows.push(['Volver a mi rutina anterior','La de antes del último cambio, con su objetivo y su día.','restorePlanPrevUI()']);
  if(typeof openMyHealth==='function')rows.push(['Mis molestias',S.health?'Guardadas en este móvil · Ver o borrar':'No guardo ninguna','openMyHealth()']);
  rows.push(['Qué guardo y cómo borrarlo','Lo que se queda en este móvil y cómo borrarlo.','obPrivacy()']); // (E13)
  return rows.map(([t,dsc,fn])=>`<div class="set-row" role="button" tabindex="0" onclick="${fn}" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();${fn.replace(/"/g,'&quot;')}}"><div class="set-row-info"><div class="set-row-t">${esc(t)}</div><div class="set-row-d">${esc(dsc)}</div></div><span class="set-row-arrow">›</span></div>`).join('');
}
function applyAcceptedUI(){const r=applyAcceptedPending();if(!r.ok){toast(r.msg||'No se ha podido aplicar',3600);return;}closeSettings();go('dash');render();
  showUndoToast('Rutina nueva aplicada',()=>{const u=restorePlanPrev();render();if(u.ok)toast('Has vuelto a tu rutina anterior',3000);},null,10000);}
// ── (E11b) Repetir, material, molestias y volver (§H.1, §H.2, §G.12) ──
// «Repetir el cuestionario»: desde P2 con tus respuestas puestas; al final, «Qué cambia» (o «Guardar mis respuestas y seguir con
// mi rutina» si la tuya es propia). «✕» mantiene la tuya.
function repeatQuestionnaire(){closeSettings();showOnboarding({from:'settings',step:'ob-meta'});_obPrefill();_ob.hist=[];_ob.repeat=true;obRender();}
// «Volver a mi rutina anterior»
function restorePlanPrevUI(){
  if(!S.planPrev)return;
  confirmModal({title:'¿Volver a tu rutina anterior?',body:'Vuelve la de antes del último cambio, con su objetivo semanal, su día y tus respuestas de entonces. La de ahora queda guardada por si quieres volver.',
    okText:'Volver a la anterior',cancelText:'Cancelar',onOk:()=>{const r=restorePlanPrev();if(!r.ok){toast(r.msg||'No hay rutina anterior',3600);return;}
      saveState();render();renderSettings();toast('Has vuelto a tu rutina anterior'+(r.deload?'. Tu descarga terminó al cambiar de rutina':''),3200);}});
}
// «Mis molestias»: lo guardado (con consentimiento), borrarlo y si va en las copias de seguridad
function openMyHealth(){
  const h=S.health,z=h?Object.keys(h.zones||{}):[],K={ahora:'me duele ahora',antigua:'lesión antigua',op:'operada hace menos de un año',reciente:'lesión reciente'};
  const items=h?z.map(k=>`${(OB_ZONES.find(x=>x[0]===k)||['',k])[2]}: ${K[h.zones[k]]||''}`).concat(h.huesos?['Huesos frágiles']:[],h.posparto?['Posparto con el alta']:[],h.prudent?['Ir con calma (sin el motivo)']:[]):[];
  obSheet(`<div class="hist-sheet-head"><div class="hist-sheet-hdl"></div><div class="hist-sheet-title">Mis molestias</div><button class="hist-sheet-close" onclick="obSheetClose()" aria-label="Cerrar">✕</button></div>
  <div class="hist-sheet-body ob-qc">${h?`<p>Guardado en este móvil desde el ${esc(fmtDate(new Date(h.consent.ts)))}:</p><ul class="ob-ul">${(items.length?items:['Nada marcado']).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<p>No guardo ninguna molestia ni nada de tu salud. Cuando cambies tu rutina, te lo vuelvo a preguntar.</p>'}
    <div class="set-row ob-sw" role="switch" aria-checked="${S.bkHealth!==false}" tabindex="0" onclick="myHealthBk()" onkeydown="if(event.key===' '||event.key==='Enter'){event.preventDefault();myHealthBk();}">
      <div class="set-row-info"><div class="set-row-t">Incluir en las copias de seguridad</div><div class="set-row-d">Si lo apagas, «Exportar» y «Copiar datos» no llevan tus molestias.</div></div><div class="sw${S.bkHealth!==false?' on':''}" aria-hidden="true"><div class="sw-k"></div></div></div>
    ${h?'<button type="button" class="btn bs" onclick="myHealthDelete()">Borrar mis molestias</button>':''}
    <button type="button" class="ob-link" onclick="obPrivacy()">Qué guardo y cómo borrarlo</button></div>`,'Mis molestias');
}
function myHealthBk(){S.bkHealth=S.bkHealth===false;saveState();openMyHealth();}
function myHealthDelete(){confirmModal({title:'¿Borrar tus molestias?',body:'Se borran de este móvil. Tu rutina no cambia; si la regeneras, te las vuelvo a preguntar.',okText:'Borrar',cancelText:'Cancelar',danger:true,
  onOk:()=>{S.health=null;saveState();openMyHealth();renderSettings();toast('Borrado',2000);}});}
// Tras guardar «Mi material» con rutina generada: «¿Adapto tu rutina a tu material?» → «Qué cambia» → aplicar
function myMatAdapt(){
  if(!S.profile||S.profile.mode!=='gen')return;
  confirmModal({title:'¿Adapto tu rutina a tu material?',body:'Con tu material de ahora te preparo la rutina otra vez; antes de cambiar nada te enseño qué cambia.',okText:'Ver qué cambia',cancelText:'Ahora no',
    onOk:()=>{closeSettings();showOnboarding({from:'settings',step:'ob-resp'});_obPrefill();_ob.hist=[];_ob.healthAsked=!S.health?true:true;_ob.step='ob-resp-qc';obRender();}});
}
// Avisos fijos de salud (§H.2): si desde Ajustes marcas síntomas o embarazo, la rutina se queda y el aviso, hasta que lo quites
function healthWarnHtml(){
  const w=S.profile&&S.profile.warn;if(!w)return'';
  const t=w==='consulta'?'Consulta antes de seguir entrenando con esfuerzo':'Tu rutina no está adaptada al embarazo: revísala con tu matrona';
  return`<div class="card ob-own ob-hw" role="status"><div class="ob-own-t">${ic('alert')} ${esc(t)}</div><button type="button" class="btn bs" onclick="healthWarnOk()">${w==='consulta'?'Ya lo he consultado':'Ya la he revisado'}</button></div>`;
}
function healthWarnOk(){if(!S.profile)return;S.profile.warn=null;S.profile=_sanitizeProfile(S.profile);saveState();render();}
// ── (E12) Lugar por día y semana en Inicio (§G.8, §G.12; D8: dos sitios desde la primera versión) ──
function _twoPlaces(){return!!(S.places&&S.places.g&&S.places.c);}
// «¿Hoy en otro sitio?»: hoy haces un día del otro sitio; el que tocaba vuelve justo después (S.rotBack)
function otherPlaceDays(){const dk=S.nextDay,here=placeOfDay(dk);return liveDayKeys().filter(k=>k!==dk&&placeOfDay(k)!==here);}
function otherPlaceSheet(){
  const dk=S.nextDay,here=placeOfDay(dk),ks=otherPlaceDays(),P=getPlan(),nm=k=>`${dayLabel(k)}${P[k]&&P[k].focus?' · '+String(P[k].focus).split(/\s+[—–]\s+/)[0]:''}`;
  obSheet(`<div class="hist-sheet-head"><div class="hist-sheet-hdl"></div><div class="hist-sheet-title">¿Hoy en otro sitio?</div><button class="hist-sheet-close" onclick="obSheetClose()" aria-label="Cerrar">✕</button></div>
  <div class="hist-sheet-body"><p class="ob-p">Te tocaba el ${esc(nm(dk))} (${here==='c'?'casa':'gimnasio'}). Elige el que haces hoy ${here==='c'?'en el gimnasio':'en casa'}; el ${esc(dayLabel(dk))} vuelve justo después.</p>
    <div class="ob-acts">${ks.map(k=>`<button type="button" class="ob-card" onclick="otherPlacePick('${k}')"><span class="ob-ci" aria-hidden="true">${ic(placeOfDay(k)==='c'?'home':'dumbbell')}</span><span class="ob-ct"><b>${esc(nm(k))}</b></span></button>`).join('')}</div></div>`,'¿Hoy en otro sitio?');
}
function otherPlacePick(k){if(!_dayLive(getPlan()[k]))return;if(getActiveWorkout()){toast('Termina o descarta el entreno de hoy antes',3000);return;}
  S.rotBack=S.nextDay;S.nextDay=k;S.day=k;saveState();obSheetClose();render();toast(`Hoy: ${dayLabel(k)}. Después vuelve el ${dayLabel(S.rotBack)}`,3000);}
// Secuencia de la semana con «Ganar fuerza» y dos sitios (planMeta.seq): los días de gimnasio alternan sus entrenos y los de casa
// van en su sitio; dos semanas: A·B·A·C y luego B·A·B·C
function _seqOf(np,m){
  if(!m||m.split!=='fz2'||!m.fz2)return null;
  const L=Object.keys(np).sort(),dp=m.dayPlace||{},G=L.filter(k=>dp[k]==='g').map(k=>np[k].did),C=L.filter(k=>dp[k]==='c').map(k=>np[k].did);
  const nG=+m.fz2.gym||G.length,nC=+m.fz2.casa||0;if(!G.length)return null;
  const seq=[];for(let w=0;w<2;w++){for(let i=0;i<nG;i++)seq.push(G[(w+i)%G.length]);for(let i=0;i<nC;i++)if(C.length)seq.push(C[(w*nC+i)%C.length]);}
  return seq.slice(0,14);
}
// El día que toca según la secuencia: tantas sesiones de esta rutina como posiciones avanzadas
function seqNextDay(){
  const pm=S.planMeta;if(!pm||!Array.isArray(pm.seq)||!pm.seq.length)return null;
  const n=(S.sessions||[]).filter(s=>s&&sessOfRoutine(s)&&s.ts>=pm.ts).length,did=pm.seq[n%pm.seq.length],p=getPlan();
  return dayKeys(p).find(k=>p[k].did===did)||null;
}
// La semana: «N de M» y, con 2 entrenos en 3 días, cuál toca esta semana
function weekLineHtml(){
  const pm=S.planMeta;if(!pm||!pm.alternas)return'';
  const ks=liveDayKeys(),wd=getWeeklyTarget();if(ks.length!==2||wd!==3)return'';
  const wk=Math.floor((Date.now()-pm.ts)/(7*864e5))%2,seq=wk?[ks[1],ks[0],ks[1]]:[ks[0],ks[1],ks[0]];
  return`<div class="ob-wkl">Esta semana: ${seq.join(' · ')}</div>`;
}
// Equilibrio en casa (65 o más con menos de 3 días de pesas; 41 C-09): los días sin pesas
// (E16c, §H.2 · 41 C-18) Repaso anual de la seguridad y la edad: al año de tu rutina (planMeta.ts) o de tu respuesta de edad
// (profile.ageTs), Inicio lo ofrece; «Ahora no» lo aplaza un mes. Las fechas son de la rutina y de la respuesta, no datos de salud.
function repasoDue(){
  const p=S.profile;if(!p||!p.age)return false;const pm=_isPlainObj(S.planMeta)?S.planMeta:null;
  const ref=Math.max(+(pm&&pm.ts)||0,+p.ageTs||0,+((p.dismiss||{}).repaso)||0);return ref>0&&Date.now()-ref>=365*864e5;
}
function repasoCardHtml(){
  if(!repasoDue())return'';
  return`<div class="card rep-card" id="rep-card"><div class="rep-t">Repasa tu seguridad y tu edad (1${NB}minuto)</div>
    <div class="rep-d">Hace un año que me lo contaste: ¿sigues en el mismo tramo de edad? ¿Hay algo nuevo de salud?</div>
    <div class="rep-b"><button type="button" class="btn bp" onclick="repasoStart()">Repasar</button><button type="button" class="btn bs" onclick="repasoLater()">Ahora no</button></div></div>`;
}
function repasoLater(){const p=S.profile;if(!p)return;p.dismiss=Object.assign({},p.dismiss,{repaso:Date.now()-335*864e5});S.profile=_sanitizeProfile(p);saveState();render();toast('Te lo vuelvo a proponer en un mes',2400);}
function repasoStart(){
  try{closeSettings();}catch(e){}
  showOnboarding({from:'settings',step:'ob-edad'});_obPrefill();_ob.hist=[];_ob.repaso=true;_ob.healthFlow='repaso';_ob.h.scr=new Set();_ob.h.nada=false;obRender();
}
function balanceCardHtml(){
  const pm=S.planMeta;if(!pm||!(pm.modes||[]).some(m=>m==='mayor'||m==='mayor75'||m==='segmayor')||getWeeklyTarget()>=3)return'';
  if((S.sessions||[]).some(s=>s&&s.ts&&sameDayTs(s.ts,Date.now())))return'';
  return`<div class="card ob-own"><div class="ob-own-t">Hoy: 5-10 min de equilibrio</div><p class="ob-own-p">Junto a una pared o una silla: de pie sobre una pierna, 20-30 s por lado; pasos en línea, talón con punta; y sobre una pierna, mirando a un lado y a otro.</p></div>`;
}
// «Peso de hoy» (opcional, tras la primera sesión; 43 m-10): corrige el de hoy si ya está, nunca lo duplica
function weightTodayCardHtml(){
  if(!(S.sessions||[]).length||!S.profile||S.profile.mode!=='gen'||(S.profile.dismiss&&S.profile.dismiss.weight&&Date.now()-S.profile.dismiss.weight<7*864e5))return'';
  if((S.weights||[]).some(w=>w&&w.ts&&sameDayTs(w.ts,Date.now())))return'';
  return`<div class="card ob-own"><div class="ob-own-t">Peso de hoy (opcional)</div><p class="ob-own-p">Si quieres seguir tu peso, apúntalo cuando te pese: una vez por semana basta.</p>
    <button type="button" class="btn bs" onclick="S.wmodal=true;renderWmodal()">Apuntar mi peso</button><button type="button" class="ob-link" onclick="weightTodayLater()">Ahora no</button></div>`;
}
function weightTodayLater(){if(!S.profile)return;S.profile.dismiss.weight=Date.now();S.profile=_sanitizeProfile(S.profile);saveState();render();}
// Color de la tendencia del peso según tu objetivo: bajar es «bueno» (verde) solo con «Perder grasa» (41 C-19)
function wRateCls(rate){const g=S.profile&&S.profile.goal;if(g&&g!=='grasa')return'nt';return rate<=0?'dn':'up';}
