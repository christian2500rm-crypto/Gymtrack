// ── Actualizar contador de duración de sesión cada 30s ──────────
setInterval(()=>{
  const el=document.getElementById('live-dur');
  if(el&&S.sessionStartTs){
    const min=Math.floor((Date.now()-S.sessionStartTs)/60000);
    if(min>MAX_SESSION_MIN)el.textContent='';
    else el.textContent=`● ${min} min`;
  }
},30000);

// ── PWA: manifest ────────────────────────────────────────────────
// Publicada (http/https) usa manifest.webmanifest (Chrome no instala desde un manifest blob:). En file:// —o si quien la
// aloja solo subió index.html y el manifest no está— se crea uno en memoria con las MISMAS claves y URL absolutas: un
// blob: no tiene carpeta, así que «./» no valdría. (15) Antes el respaldo usaba start_url './' (relativa al blob:) y un
// icono de 180 px; ahora va igual que el estático: 192/512 any + maskable, SVG any, atajos y colores de la paleta.
function pwaManifest(){
  const base=new URL('./',location.href).href,icon=f=>new URL('assets/icons/'+f,base).href;
  const bg=typeof paletteHex==='function'?paletteHex('--bg','#0b1514'):'#0b1514';
  return {
    name:'Gymteca',short_name:'Gymteca',description:'Tu app de entrenamiento personal',
    id:base,start_url:base,scope:base,display:'standalone',orientation:'portrait',
    background_color:bg,theme_color:bg,lang:'es',dir:'ltr',categories:['health','fitness','sports'],
    icons:[
      {src:icon('icono-192.png'),sizes:'192x192',type:'image/png',purpose:'any'},
      {src:icon('icono-512.png'),sizes:'512x512',type:'image/png',purpose:'any'},
      {src:icon('icono-192.png'),sizes:'192x192',type:'image/png',purpose:'maskable'},
      {src:icon('icono-512.png'),sizes:'512x512',type:'image/png',purpose:'maskable'},
      {src:icon('icono.svg'),sizes:'any',type:'image/svg+xml',purpose:'any'}
    ],
    shortcuts:PWA_SHORTCUTS.map(s=>({name:s.name,short_name:s.short,description:s.desc,url:base+'?abrir='+s.k,icons:[{src:icon('icono-192.png'),sizes:'192x192',type:'image/png'}]}))
  };
}
// Atajos del icono (mantener pulsado): ?abrir=… al abrir la app (applyLaunchParam). Los mismos en manifest.webmanifest.
const PWA_SHORTCUTS=[
  {k:'entreno',name:'Empezar entreno',short:'Entrenar',desc:'Abre el entreno de hoy'},
  {k:'progreso',name:'Ver mi progreso',short:'Progreso',desc:'Abre Progreso'}
];
function _manifestBlob(){
  document.querySelectorAll('link[rel="manifest"]').forEach(l=>l.remove());
  const link=document.createElement('link');link.rel='manifest';
  link.href=URL.createObjectURL(new Blob([JSON.stringify(pwaManifest())],{type:'application/manifest+json'}));
  document.head.appendChild(link);return link;
}
(function setupManifest(){
  try{
    const st=document.querySelector('link[rel="manifest"]');
    if(!/^https?:$/.test(location.protocol)||!st){_manifestBlob();return;}
    // Publicada: si el estático no está (404), el de memoria (sin instalar en Chrome, pero con nombre, colores e iconos)
    const href=st.href;
    setTimeout(()=>{try{fetch(href,{cache:'no-cache'}).then(r=>{if(!r.ok)_manifestBlob();}).catch(()=>{});}catch(e){}},4000);
  }catch(e){}
})();

// ── Atajos del icono: ?abrir=entreno | progreso ───────────────────
// Se aplica una vez al abrir (antes del primer pintado) y se quita de la barra de direcciones para que recargar no lo
// repita. Sin onboarding hecho no hace nada (la bienvenida va primero). «entreno» abre el entreno en curso o, si no
// hay, el día que toca (igual que «Empezar» de «HOY TOCA»).
function applyLaunchParam(){
  let k=null;
  try{k=new URLSearchParams(location.search).get('abrir');}catch(e){return null;}
  if(!k)return null;
  try{const u=new URL(location.href);u.searchParams.delete('abrir');history.replaceState(history.state,'',u.pathname+u.search+u.hash);}catch(e){}
  if(!S.onboarded||!PWA_SHORTCUTS.some(s=>s.k===k))return null;
  if(k==='entreno'){
    const aw=getActiveWorkout(),dk=aw&&getPlan()[aw.day]?aw.day:hoyDayKey();
    if(getPlan()[dk])S.day=dk;
    S.tab='workout';
  }else if(k==='progreso')S.tab='prog';
  ['dash','workout','coach','prog'].forEach(t=>{const b=document.getElementById('nb-'+t);if(b)b.classList.toggle('on',t===S.tab);});
  return k;
}

// ── PWA: service worker (sw.js) ──────────────────────────────────
// Solo en http(s) y en la ventana principal: nunca en file://, ni dentro de un iframe (el banco de pruebas __seed.html
// abre la app en uno), ni con ?nosw (que además quita uno ya registrado). Si sw.js no está (quien sube solo index.html),
// el registro falla en silencio y la app funciona igual, solo que sin modo sin conexión.
// Aviso de versión nueva (#swup): lo manda sw.js al ver un index.html distinto, o sale cuando hay un sw.js nuevo
// esperando. Nunca recarga solo: «Actualizar» recarga (y activa el sw.js nuevo con skipWaiting). Con un entreno en
// curso, un descanso en marcha, una hoja abierta, la bienvenida o escribiendo en un campo, el aviso espera oculto.
// (16c) Sin saltos: el aviso va en el flujo (48 px), así que ya no se esconde con una hoja, la historia o un campo con
// foco (queda debajo, tapado); solo lo quitan Entreno, un entreno o un descanso en marcha y la bienvenida (_swHard). Si
// tuvo que esperar oculto, no aparece solo al quedar libre (la pantalla saltaría 48 px de repente): vuelve al cambiar de
// pestaña (go → swUpdateSync(true)) o al volver a la app. «Actualizar» sigue sin recargar con nada a medias (_swBusy).
let _sw={reg:null,hash:null,latest:null,ready:false,pending:null,seen:null,dismissed:false,reloading:false,lastCheck:0,poll:null,held:false};
let _swDoReload=()=>location.reload(); // (se sustituye en las pruebas)
const SW_CHECK_MS=30*60*1000;
function swAllowed(){
  try{
    if(!('serviceWorker' in navigator))return 'nosupport';
    if(!/^https?:$/.test(location.protocol))return 'protocol';
    let framed=true;try{framed=window.top!==window.self;}catch(e){}
    if(framed)return 'framed';
    if(new URLSearchParams(location.search).has('nosw'))return 'flag';
    return 'ok';
  }catch(e){return 'error';}
}
// Lo que quita el aviso aunque ya esté a la vista: la bienvenida, Entreno (estás a punto de apuntar una serie: no pisa
// «✓ Hecho»), un entreno o un descanso en marcha
function _swHard(){
  try{
    if(!S.onboarded)return true;
    const ob=document.getElementById('onboarding');if(ob&&getComputedStyle(ob).display!=='none')return true;
    if(getActiveWorkout())return true;
    if(S.tab==='workout')return true;
    if(S.restTimer&&+S.restTimer.endTs>Date.now())return true;
    if(RF.open)return true;
  }catch(e){return true;}
  return false;
}
function _swBusy(){
  try{
    if(_swHard())return true;
    if(_sheetOpen()||_wr||_pickerState||_libDetail||_libKitOpen||_busy||_routineEdOpen||_mmSheet||_sum||S._hist||RF.open)return true;
    const wr=document.getElementById('wrapped-root');if(wr&&wr.firstElementChild)return true;
    const a=document.activeElement;if(a&&(a.tagName==='TEXTAREA'||(a.tagName==='INPUT'&&!/^(button|checkbox|radio|range)$/i.test(a.type))||a.isContentEditable))return true;
  }catch(e){return true;}
  return false;
}
// Hay versión nueva ('doc': index.html nuevo ya guardado · 'sw': sw.js nuevo esperando). id = su huella (o 'sw'):
// la misma versión, una vez quitada con ✕, no vuelve a salir en esta sesión; una más nueva, sí.
function swUpdateReady(kind,id){
  if(_sw.pending!=='sw')_sw.pending=kind==='sw'?'sw':'doc';
  const k=String(id||kind);
  if(k!==_sw.seen){_sw.seen=k;_sw.dismissed=false;}
  swUpdateSync();
  if(!_sw.poll)_sw.poll=setInterval(swUpdateSync,1500);
}
// Enseña u oculta el aviso según lo que esté pasando en la app. nav: cambio de pestaña o vuelta a la app (puede volver a
// salir el que esperaba oculto). A la vista, solo lo quita _swHard; oculto, sale si todo está libre y no estaba esperando.
function swUpdateSync(nav){
  const el=document.getElementById('swup');if(!el)return;
  const want=!!(_sw.pending&&!_sw.dismissed&&!_sw.reloading);
  let show=false;
  if(want){
    if(_swHard())show=false;
    else if(!el.hidden)show=true; // ya a la vista: se queda (una hoja o un campo con foco lo tapan, no lo mueven)
    else show=(nav===true||!_sw.held)&&!_swBusy();
    _sw.held=!show;
  }else _sw.held=false;
  document.body.classList.toggle('swup-on',show);
  if(show===!el.hidden)return;
  el.hidden=!show;
  const lv=document.getElementById('swup-live');
  if(lv)lv.textContent=show?'Nueva versión de Gymteca disponible. Toca «Actualizar» para cargarla.':'';
  if(show){el.classList.remove('in');void el.offsetWidth;el.classList.add('in');}
}
function swUpdateLater(){
  _sw.dismissed=true;swUpdateSync();_sw.held=false;
  clearInterval(_sw.poll);_sw.poll=null;
  toast('Se pondrá al día la próxima vez que abras Gymteca');
}
// «Actualizar»: nunca con algo a medias (se vuelve a mirar al tocar)
function swUpdateApply(){
  if(!_sw.pending||_sw.reloading)return false;
  if(_swBusy()){swUpdateSync();toast('Termina lo que estás haciendo y actualiza después');return false;}
  _sw.reloading=true;swUpdateSync();
  const w=_sw.reg&&_sw.reg.waiting;
  if(w&&navigator.serviceWorker&&navigator.serviceWorker.controller){
    try{w.postMessage({type:'gt-skip'});}catch(e){_swDoReload();return true;}
    setTimeout(()=>{if(_sw.reloading)_swDoReload();},4000); // por si controllerchange no llega
  }else _swDoReload();
  return true;
}
function _swPost(m){try{const c=navigator.serviceWorker&&navigator.serviceWorker.controller;if(c){c.postMessage(m);return true;}}catch(e){}return false;}
function swCheckNow(force){
  if(!_sw.reg)return false;
  const now=Date.now();if(!force&&now-_sw.lastCheck<SW_CHECK_MS)return false;
  _sw.lastCheck=now;
  try{_sw.reg.update().catch(()=>{});}catch(e){}
  return _swPost({type:'gt-check'});
}
// Mensajes de sw.js. _sw.hash = versión con la que se abrió esta página (respuesta al saludo) · _sw.latest = la última
// guardada que se conoce (gt-update / gt-state). El aviso puede llegar antes que la respuesta al saludo: se compara
// cuando están las dos.
function _swOnMsg(d){
  d=d&&typeof d==='object'?d:{};
  if(d.type==='gt-hello'){if(d.hash&&!_sw.hash)_sw.hash=String(d.hash);}
  else if((d.type==='gt-update'||d.type==='gt-state')&&d.hash)_sw.latest=String(d.hash);
  else return false;
  if(_sw.hash&&_sw.latest&&_sw.latest!==_sw.hash){swUpdateReady('doc',_sw.latest);return true;}
  return false;
}
function _swWatch(reg){
  _sw.reg=reg;
  const waitingNew=()=>{if(reg.waiting&&navigator.serviceWorker.controller)swUpdateReady('sw','sw');};
  waitingNew();
  reg.addEventListener('updatefound',()=>{
    const nw=reg.installing;if(!nw)return;
    nw.addEventListener('statechange',()=>{if(nw.state==='installed')waitingNew();});
  });
}
(function setupSW(){
  const why=swAllowed();
  if(why==='flag'){try{navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister())).catch(()=>{});}catch(e){}return;}
  if(why!=='ok')return;
  const sw=navigator.serviceWorker,fresh=!sw.controller; // sin controlador: esta página vino de la red
  sw.addEventListener('message',e=>_swOnMsg(e.data));
  sw.addEventListener('controllerchange',()=>{
    if(_sw.reloading){_swDoReload();return;}
    // Otro sw.js tomó el control (primera instalación, u «Actualizar» en otra pestaña): saludar y comparar
    _swPost({type:'gt-hello',fresh});setTimeout(()=>swCheckNow(true),300);
  });
  const reg=()=>sw.register('sw.js').then(r=>{
    _sw.ready=true;_swWatch(r);
    _swPost({type:'gt-hello',fresh});
    _sw.lastCheck=Date.now(); // al abrir ya revisa sw.js (la navegación pasó por él)
  }).catch(()=>{}); // sin sw.js o sin permiso: la app sigue igual
  if(document.readyState==='complete')setTimeout(reg,1200);else window.addEventListener('load',()=>setTimeout(reg,1200),{once:true});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){swCheckNow(false);swUpdateSync(true);}});
})();

// ── iOS viewport + teclado virtual: actualizar --kb cuando aparece el teclado ─
(function setupViewport(){
  const root=document.documentElement;
  function update(){
    try{
      if(window.visualViewport){
        const vv=window.visualViewport;
        // Diferencia entre altura del layout viewport y el visual viewport = teclado
        const kb=Math.max(0,window.innerHeight-vv.height-vv.offsetTop);
        root.style.setProperty('--kb',kb+'px');
        root.style.setProperty('--vh',vv.height+'px');
      }else{
        root.style.setProperty('--vh',window.innerHeight+'px');
      }
    }catch(e){}
  }
  update();
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize',update);
    window.visualViewport.addEventListener('scroll',update);
  }
  window.addEventListener('resize',update);
  window.addEventListener('orientationchange',()=>setTimeout(update,120));
})();

try{if(_fixPlanLetters())saveState();}catch(e){console.warn(e);} // (E1b) letras de día consecutivas (A, B, D → A, B, C)
try{_bkTrackStart();}catch(e){} // (15) punto de partida de «cambios desde la última copia» (lo que se cargó no es un cambio)
if(S.onboarded){try{if(applyLaunchParam())saveState();}catch(e){console.warn(e);}document.getElementById('onboarding').style.display='none';document.getElementById('app').style.display='flex';render();}
else{try{applyLaunchParam();}catch(e){}try{showOnboarding({from:'first'});}catch(e){console.error(e);}} // sin onboarding: quita ?abrir= y abre la bienvenida (E7)
// Temporizador de descanso/cardio guardado: reanudarlo, o terminarlo si acabó con la app cerrada
try{RT.sync();}catch(e){console.error(e);}
