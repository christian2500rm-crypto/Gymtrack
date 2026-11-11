// ═══════════════════════════════════════════════════════════
// MOVIMIENTO Y GESTOS: fundido entre pestañas, hojas que suben y se arrastran para cerrar
// ═══════════════════════════════════════════════════════════
// 1) Al cambiar de pestaña, la pantalla entra con un fundido corto (_tabIn, lo llama go()).
// 2) Una hoja que se abre sube desde abajo mientras el fondo se oscurece (clase .sheet-in en su fondo). Solo al abrirse: repintar
//    una hoja ya abierta (cada interruptor de Ajustes repinta la suya) no repite la entrada.
// 3) Las hojas se pueden bajar con el dedo para cerrarlas: desde el asa o la cabecera y, con su lista arriba del todo, también desde
//    el cuerpo. Al soltar pasado un tercio de su alto, o con un gesto rápido, se cierran (como con su ✕ o tocando fuera); si no,
//    vuelven a su sitio.
// Lo que NO hace, para no pelearse con el desplazamiento ni con los gestos del sistema: no arrastra desde campos, animaciones 3D,
// gráficas ni asas de reordenar; ni cuando el gesto es horizontal (deslizar pestañas, girar una animación, volver atrás), sube, usa
// dos dedos o empieza en un borde de la pantalla; ni una hoja que no se pueda cerrar tocando fuera. Hasta que el arrastre empieza no
// se retiene ningún evento: la lista se desplaza como siempre.
// Con «reducir movimiento» no hay animaciones: la pestaña y la hoja aparecen de golpe y, al soltar, la hoja se cierra o vuelve sin
// transición (sigue al dedo mientras se arrastra, que es movimiento que haces tú).
let _motionOn=true; // las pruebas lo apagan para medir pantallas y hojas recién abiertas, sin esperar a su entrada
const SHEET_SEL='.hist-sheet,.cmod,.modal',SHEET_OVER='.hist-over,.cmov,.mover';
const SHEET_NODRAG='input,textarea,select,[contenteditable="true"],canvas,.wchart,.drag-handle,[data-nodrag]';
const SHEET_EDGE=20,SHEET_OUT=1/3,SHEET_FLICK=0.55; // px del borde de la pantalla · fracción del alto · px/ms del gesto rápido

function _motion(){return _motionOn&&!_rm();}
function _tabIn(){
  if(!_motion())return;
  const sc=document.getElementById('screen');if(!sc)return;
  sc.classList.remove('tab-in');void sc.offsetWidth;sc.classList.add('tab-in');
}
// La entrada de una hoja: cuando a una raíz (#…-root) le llega un fondo de hoja y no tenía otro (si lo tenía, es un repintado)
(function(){
  if(typeof MutationObserver==='undefined')return;
  const isOver=n=>n.nodeType===1&&n.matches&&n.matches(SHEET_OVER);
  const mo=new MutationObserver(recs=>{
    if(!_motion())return;
    for(const r of recs){if([...r.removedNodes].some(isOver))continue;r.addedNodes.forEach(n=>{if(isOver(n))n.classList.add('sheet-in');});}
  });
  document.querySelectorAll('body > div[id$="-root"]').forEach(el=>mo.observe(el,{childList:true}));
})();

// ── Arrastrar una hoja para cerrarla ──
let _shDrag=null; // {sh, ov, x0, y0, t0, dy, on}
// Cómo se cierra una hoja: su ✕ o, si no tiene, tocar el fondo (si el fondo no cierra, la hoja no se arrastra)
function _sheetCloser(sh){
  const x=sh.querySelector('.hist-sheet-close:not(.lib-fav)');if(x)return()=>x.click();
  const ov=sh.parentElement;
  return ov&&ov.matches(SHEET_OVER)&&ov.hasAttribute('onclick')?()=>ov.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true})):null;
}
function _sheetDragStart(e){
  _shDrag=null;
  if(!e.touches||e.touches.length!==1)return;
  const t=e.target,sh=t&&t.closest?t.closest(SHEET_SEL):null;if(!sh||t.closest(SHEET_NODRAG))return;
  const p=e.touches[0];
  if(p.clientX<SHEET_EDGE||p.clientX>innerWidth-SHEET_EDGE||p.clientY>innerHeight-SHEET_EDGE)return; // bordes: gestos del sistema
  if(!_sheetCloser(sh))return;
  // desde el cuerpo, solo si lo que se desplaza bajo el dedo está arriba del todo (si no, el gesto es desplazar la lista)
  if(!t.closest('.hist-sheet-head,.hist-sheet-hdl,.cmod-hdl,.modal-hdl')){
    for(let n=t;n&&n!==sh.parentElement;n=n.parentElement){
      if(n.scrollTop>0&&n.scrollHeight>n.clientHeight+1&&/auto|scroll/.test(getComputedStyle(n).overflowY))return;}
  }
  _shDrag={sh,ov:sh.parentElement,x0:p.clientX,y0:p.clientY,t0:performance.now(),dy:0,on:false};
}
function _sheetDragMove(e){
  const d=_shDrag;if(!d)return;
  if(e.touches.length!==1||!d.sh.isConnected){_sheetDragCancel();return;}
  const p=e.touches[0],dy=p.clientY-d.y0,dx=p.clientX-d.x0;
  if(!d.on){
    if(dy<-8||Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy)){_shDrag=null;return;} // sube o va de lado: no es para la hoja
    if(dy<8||Math.abs(dy)<Math.abs(dx)*1.2)return;
    d.on=true;d.sh.classList.add('dragging');
  }
  d.dy=Math.max(0,dy);
  d.sh.style.transform='translateY('+d.dy+'px)';
  if(d.ov)d.ov.style.setProperty('--drag',String(Math.max(0,1-d.dy/(d.sh.offsetHeight||1))));
  if(e.cancelable)e.preventDefault(); // ya arrastrando: que no se desplace ni tire de la página lo de debajo
}
function _sheetDragReset(d){d.sh.classList.remove('dragging');d.sh.style.transform='';d.sh.style.transition='';if(d.ov)d.ov.style.removeProperty('--drag');}
function _sheetDragCancel(){const d=_shDrag;_shDrag=null;if(d&&d.on)_sheetDragReset(d);}
function _sheetDragEnd(){
  const d=_shDrag;_shDrag=null;if(!d||!d.on)return;
  if(!d.sh.isConnected)return; // la hoja se repintó a medio arrastre: esa ya no existe, y la nueva se queda como está
  const h=d.sh.offsetHeight||1,v=d.dy/Math.max(1,performance.now()-d.t0),out=d.dy>h*SHEET_OUT||(v>SHEET_FLICK&&d.dy>40),calm=!_motion();
  const close=_sheetCloser(d.sh);
  // si tras cerrarla la hoja sigue ahí (su cierre pidió confirmación o la repintó), vuelve a su sitio
  const done=()=>{if(out&&close)close();if(d.sh.isConnected)_sheetDragReset(d);};
  d.sh.classList.remove('dragging');
  if(calm){done();return;}
  d.sh.style.transition='transform .2s cubic-bezier(.2,.8,.2,1)';
  if(out){d.sh.style.transform='translateY(100%)';if(d.ov)d.ov.style.setProperty('--drag','0');}
  else{d.sh.style.transform='';if(d.ov)d.ov.style.removeProperty('--drag');}
  setTimeout(done,210);
}
document.addEventListener('touchstart',_sheetDragStart,{passive:true});
document.addEventListener('touchmove',_sheetDragMove,{passive:false});
document.addEventListener('touchend',_sheetDragEnd);
document.addEventListener('touchcancel',_sheetDragCancel);
