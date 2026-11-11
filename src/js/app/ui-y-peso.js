// ── UI HELPERS ────────────────────────────────────────────────
let _toastT=null;
// Dónde sale el aviso (#toast): abajo, encima de lo que flota (navegación, barra de descanso y de «siguiente serie») y, en
// Inicio, encima del botón «Empezar» cuando va pegado al borde. Se calcula al mostrarlo, al cambiar de pantalla y cuando
// cambian las barras (--toast-b; con una hoja abierta manda la regla de la hoja).
function _toastPlace(){
  try{
    let b=_dockH();const app=document.getElementById('app').getBoundingClientRect(),cta=S.tab==='dash'?document.querySelector('.hoy>.hoy-cta'):null;
    if(cta){const r=cta.getBoundingClientRect(),dk=app.bottom-b;if(r.height&&r.bottom>dk-70&&r.top<dk)b=Math.round(app.bottom-r.top)+4;}
    const v=b+'px',rs=document.documentElement.style;if(rs.getPropertyValue('--toast-b')!==v)rs.setProperty('--toast-b',v);
  }catch(e){}
}
function toast(msg,ms){
  const el=document.getElementById('toast');
  if(!el)return;
  // (16c) un «Deshacer» anterior ya no vacía este aviso al cumplir sus 5 s (dejaba una caja vacía de 34 px)
  try{if(_undoToastT){clearTimeout(_undoToastT);_undoToastT=null;_lastSetAction=null;}}catch(e){}
  el.style.pointerEvents='';
  el.innerHTML=icT(msg);
  el.classList.remove('pr');
  _toastPlace();
  el.classList.add('show');
  try{if(RF.open)RF._toastSeen();}catch(e){} // (16) con el modo descanso abierto, dentro de él y a la vista
  clearTimeout(_toastT);
  _toastT=setTimeout(()=>el.classList.remove('show'),ms||2600);
}

// Modal de confirmación (reemplaza confirm nativo)
let _cmodalState=null;
function confirmModal({title,body,okText,cancelText,onOk,onCancel,danger}){
  _cmodalState={title,body,okText:okText||'Aceptar',cancelText:cancelText||'Cancelar',onOk,onCancel,danger:!!danger};
  renderCmodal();
}
function closeCmodal(runCancel){
  const st=_cmodalState;_cmodalState=null;renderCmodal();
  if(runCancel&&st&&typeof st.onCancel==='function')st.onCancel();
}
function cmodalOk(){
  const st=_cmodalState;_cmodalState=null;renderCmodal();
  if(st&&typeof st.onOk==='function')st.onOk();
}
function renderCmodal(){
  const root=document.getElementById('cmodal-root');
  if(!root)return;
  if(!_cmodalState){root.innerHTML='';return;}
  const s=_cmodalState;
  root.innerHTML=`<div class="cmov" onclick="if(event.target===this)closeCmodal(true)"><div class="cmod">
    <div class="cmod-hdl"></div>
    <div class="cmod-t">${esc(s.title)}</div>
    <div class="cmod-b">${esc(s.body)}</div>
    <div class="cmod-btns">
      <button class="btn bs" onclick="closeCmodal(true)">${esc(s.cancelText)}</button>
      <button class="btn ${s.danger?'bp':'bp'}" style="${s.danger?'background:var(--red);color:var(--bg)':''}" onclick="cmodalOk()">${esc(s.okText)}</button>
    </div>
  </div></div>`;
}

// Soporte global teclado en modales: Escape cierra, Enter confirma (solo en confirmModal sin input)
document.addEventListener('keydown',e=>{
  // (14) La historia «Wrapped» va por encima de todo: Escape la cierra y nada de debajo recibe el teclado
  if(_wr){if(e.key==='Escape'){e.preventDefault();if(document.getElementById('wr-shot'))_wrShotClose();else closeWrapped();}return;}
  if(e.key==='Escape'){
    if(_cmodalState){closeCmodal(true);return;}
    if(_myMat){closeMyMaterial();return;} // (E3c) «Mi material», encima del buscador y de Ajustes
    if(_libKitOpen){closeLibKit();return;} // «Mi material», encima del selector (y de la ficha)
    if(_libDetail){closeLibDetail();return;} // (11) la ficha de un ejercicio, encima del selector
    if(_pickerState){closeExercisePicker();return;}
    if(!_obOpen()&&(document.getElementById('ob-sheet-root')||{}).innerHTML){obSheetClose();return;} // (E11b) «Mis molestias» encima de Ajustes
    if(_obOpen()){obEsc();return;} // (E7) el cuestionario (z 390): debajo del selector, encima de Ajustes
    if(_busy){closeBusy();return;} // (11) hoja «¿Máquina ocupada?»
    // Otros modales propios de #cmodal-root (trasladar historial, editar peso, próxima sesión…)
    {const cr=document.getElementById('cmodal-root');if(cr&&cr.firstElementChild){cr.innerHTML='';_restPickEx=null;return;}}
    if(_lsSheetOpen()){closeLoadSheet();return;} // saltos de peso (encima de Ajustes)
    if(RF.open){RF.close();return;} // modo descanso a pantalla completa
    if(_sum){closeSessionSummary();return;} // (09) resumen de una sesión (puede estar encima del historial)
    if(_mmSheet){closeMuscleSheet();return;} // hoja de un grupo muscular (puede estar encima del editor)
    if(_routineEdOpen){closeRoutineEditor();return;}
    if(S._hist){closeHist();return;}
    if(S._wdetail){closeWDetail();return;}
    if(S.wmodal){S.wmodal=false;S.wnew='';renderWmodal();return;}
    if(S.settingsOpen){closeSettings();return;}
  }else if(e.key==='Enter'&&_cmodalState&&!document.querySelector('#cmodal-root input,#cmodal-root textarea')){
    e.preventDefault();cmodalOk();
  }else if(e.key==='Tab'&&(_pickerState||_busy)&&!_cmodalState)_sheetTrap(e);
  else if(e.key==='Tab'&&S._hist&&!_cmodalState&&!_sum&&!_mmSheet&&!RF.open&&!(document.getElementById('cmodal-root')||{}).firstElementChild)_histTrap(e);
});

// Haptic feedback — iOS Safari no implementa navigator.vibrate, pero no rompe si no existe
function haptic(pattern){
  try{
    if(typeof navigator!=='undefined'&&typeof navigator.vibrate==='function'){
      navigator.vibrate(pattern);
    }
  }catch(e){}
}


function fmtDate(d){return d.getDate()+' '+MONTHS[d.getMonth()];}
// (E1a) Rotación: el día siguiente a c en el orden de la rutina, saltando los días vacíos (no entran en la rotación hasta
// tener ejercicios). Clave desconocida → el primer día con ejercicios. Con un solo día con ejercicios, ese mismo.
// Siempre devuelve un día que existe (con todos vacíos, el primero; sin días, 'A').
function getNextDay(c,plan){
  const p=plan||getPlan(),K=dayKeys(p),i=K.indexOf(c);
  if(i>=0)for(let j=1;j<=K.length;j++){const k=K[(i+j)%K.length];if(_dayLive(p[k]))return k;}
  return liveDayKeys(p)[0]||K[0]||'A';
}
// Cuenta series completadas de forma defensiva (sólo índices 0..maxSets-1)
function countSetsDone(exId,maxSets){
  const c=S.sets[exId]||{};let n=0;
  for(let i=0;i<maxSets;i++){if(c[i])n++;}
  return n;
}
function getWeekSessions(){
  const t=new Date(),dow=t.getDay(),off=dow===0?-6:1-dow;
  const mon=new Date(t);mon.setDate(t.getDate()+off);mon.setHours(0,0,0,0);
  const sun=new Date(mon);sun.setDate(mon.getDate()+6);sun.setHours(23,59,59,999);
  return S.sessions.filter(s=>s.ts&&new Date(s.ts)>=mon&&new Date(s.ts)<=sun).length;
}

function weekGrid(){
  const lbl=['L','M','X','J','V','S','D'],t=new Date(),dow=t.getDay(),off=dow===0?-6:1-dow;
  const mon=new Date(t);mon.setDate(t.getDate()+off);mon.setHours(0,0,0,0);
  return lbl.map((l,i)=>{
    const d=new Date(mon);d.setDate(mon.getDate()+i);
    const isT=d.toDateString()===t.toDateString(),we=i>=5;
    // Comparar por timestamp del mismo día (resistente a colisión de año)
    const done=S.sessions.some(s=>s.ts&&sameDayTs(s.ts,d.getTime()));
    const cls=done?'done':isT?'today':''; // (E12) los días sin sesión, neutros
    // (16e) Cada día con su nombre para lectores: «sábado, descanso», «lunes, entrenado», «jueves, hoy»
    const al=['lunes','martes','miércoles','jueves','viernes','sábado','domingo'][i]+(done?', entrenado':isT?', hoy':d>t?', pendiente':', sin entrenar');
    return`<div class="dd ${cls}" role="img" aria-label="${al}">${l}${done?'<span style="font-size:11px" aria-hidden="true">✓</span>':''}</div>`;
  }).join('');
}

// cuts (opcional): posiciones en las que empieza una banda más dura (_bandCuts). Ahí la línea se corta y una raya
// discontinua lo marca, para que el cambio de banda no se lea como una caída.
function spark(data,color,cuts){
  if(!data||data.length<2)return`<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text3);font-size:13px">Necesitas al menos 2 registros</div>`;
  const vs=data.map(d=>d.v),mn=Math.min(...vs)-.5,mx=Math.max(...vs)+.5;
  const W=320,H=90,P=14;
  const px=i=>(i/(data.length-1))*(W-P*2)+P;
  const py=v=>H-P-((v-mn)/(mx-mn))*(H-P*2.5);
  const cs=new Set((Array.isArray(cuts)?cuts:[]).filter(i=>i>0&&i<data.length)),segs=[];
  {let cur=[];data.forEach((d,i)=>{if(cs.has(i)&&cur.length){segs.push(cur);cur=[];}cur.push(i);});segs.push(cur);}
  const pth=s=>s.map((i,k)=>(k===0?'M':'L')+px(i).toFixed(1)+','+py(data[i].v).toFixed(1)).join(' ');
  const path=segs.map(pth).join(' ');
  const area=segs.filter(s=>s.length>1).map(s=>pth(s)+` L${px(s[s.length-1]).toFixed(1)},${H} L${px(s[0]).toFixed(1)},${H} Z`).join(' ');
  const marks=[...cs].map(i=>{const x=((px(i-1)+px(i))/2).toFixed(1),gap=px(i)-px(i-1),lb=gap>=100?'banda más dura':gap>=44?'⇧ banda':'';
    return`<g class="sp-cut"><title>banda más dura</title><line x1="${x}" y1="${lb?11:2}" x2="${x}" y2="${H-P+2}" stroke="var(--text3)" stroke-width="1" stroke-dasharray="3 3"/>${lb?`<text x="${x}" y="7" text-anchor="middle" font-size="8.5" fill="var(--text3)" font-family="DM Sans,sans-serif">${lb}</text>`:''}</g>`;}).join('');
  const gid='g'+Math.abs(color.split('').reduce((a,c)=>a+c.charCodeAt(0),0));
  // Con muchos puntos: valores solo en primero/último/máximo y ~4 fechas (evita solapes)
  const n=data.length,dense=n>8,iMax=vs.indexOf(Math.max(...vs));
  const showV=i=>!dense||i===0||i===n-1||(i===iMax&&vs[iMax]!==vs[n-1]&&iMax>1&&iMax<n-2);
  const showD=i=>!dense||[0,Math.round((n-1)/3),Math.round(2*(n-1)/3),n-1].includes(i);
  const anc=i=>dense&&i===0?'start':dense&&i===n-1?'end':'middle';
  return`<svg viewBox="0 0 ${W} ${H}" style="overflow:visible">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${color}" stop-opacity=".2"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
    <path d="${area}" fill="url(#${gid})"/>
    ${marks}<path d="${path}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    ${data.map((d,i)=>`<circle cx="${px(i)}" cy="${py(d.v)}" r="${dense?2.4:3.5}" fill="${color}" stroke="var(--bg2)" stroke-width="${dense?1.2:2}"/>
    ${showV(i)?`<text x="${px(i)}" y="${py(d.v)-8}" text-anchor="${anc(i)}" font-size="9.5" fill="${color}" font-family="DM Mono,monospace" font-weight="500">${esc(d.v)}</text>`:''}`).join('')}
    ${data.map((d,i)=>showD(i)?`<text x="${px(i)}" y="${H-1}" text-anchor="${anc(i)}" font-size="8.5" fill="var(--text3)" font-family="DM Sans,sans-serif">${esc(d.d)}</text>`:'').join('')}
  </svg>`;
}

// ─── GRÁFICA DE PESO CORPORAL ────────────────────────────────
// Eje temporal real, tendencia (media móvil exponencial de 7 días, filtra la variación
// diaria de agua/comida), rangos 1M-Todo, marcas de máx/mín y lectura al tocar/arrastrar.
const WRANGES=[['1m','1M',30,'en 1 mes'],['3m','3M',91,'en 3 meses'],['6m','6M',182,'en 6 meses'],['1a','1A',365,'en 1 año'],['all','Todo',0,'en total']];
const DAY_MS=86400000;
// Periodo del cambio: el del rango elegido, o el que cubren de verdad tus datos si son menos
// («−4.0 kg en 6 meses», no «en 1 año» cuando solo hay 6 meses de registros)
function wRangeLbl(rp,R){
  if(!R)return'';
  if(!R[2]||!rp||rp.length<2)return R[3];
  const days=(rp[rp.length-1].t-rp[0].t)/DAY_MS;
  if(days>=R[2]*0.85)return R[3];
  if(days<14)return`en ${plural(Math.max(1,Math.round(days)),'día')}`;
  if(days<60)return`en ${plural(Math.round(days/7),'semana')}`;
  const h=Math.round(days/30.44*2)/2,lbl=h%1?`en ${Math.floor(h)} meses y medio`:`en ${plural(h,'mes','meses')}`;
  // 1A con 6 meses y una semana de datos no dice «en 6 meses» como 6M (que cubre menos): «en algo más de 6 meses»
  return WRANGES.some(x=>x[2]&&x[2]<R[2]&&x[3]===lbl&&days>x[2]+3)?lbl.replace('en ','en algo más de '):lbl;
}
function wRangeKey(){return WRANGES.some(r=>r[0]===S.wRange)?S.wRange:'3m';}
function setWRange(k){if(!WRANGES.some(r=>r[0]===k))return;S.wRange=k;saveState();render();}
const wf1=v=>(Math.round(v*10)/10).toFixed(1);
const wSign=(v,d)=>(v>0?'+':v<0?'−':'±')+Math.abs(v).toFixed(d==null?1:d);
// (16b) Cambio de kilos con signo tipográfico y kgTxt, redondeado a 0.1: «−4», «+1.5», «±0»
const kgSign=v=>{const a=Math.round(Math.abs(+v||0)*10)/10;return(a<0.05?'±':v>0?'+':'−')+kgTxt(a);};
function wFmt(t,mode){const d=new Date(t),m=MONTHS[d.getMonth()];
  if(mode==='m')return m;if(mode==='my')return m+" '"+String(d.getFullYear()).slice(2);
  if(mode==='dmy')return d.getDate()+' '+m+' '+d.getFullYear();
  if(mode==='wd')return['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][d.getDay()]+' '+d.getDate()+' '+m;
  return d.getDate()+' '+m;}
// Serie normalizada y ordenada [{t,v}] (registros antiguos sin ts → el día de su fecha escrita «8 Sep», o interpolados
// entre vecinos: _datedTs)
function wSeries(){
  const W=(S.weights||[]).filter(w=>w&&isFinite(parseFloat(w.v)));
  const t=_datedTs(W,DAY_MS);
  const pts=W.map((w,i)=>({t:t[i],v:parseFloat(w.v)})).sort((a,b)=>a.t-b.t);
  let e=null,lt=0;pts.forEach(p=>{if(e===null)e=p.v;else{const dt=Math.max((p.t-lt)/DAY_MS,.25);e+=(1-Math.exp(-dt/7))*(p.v-e);}lt=p.t;p.tr=e;});
  return pts;}
function wInRange(pts,k){const r=WRANGES.find(x=>x[0]===k)||WRANGES[1];if(!r[2]||pts.length<3)return pts;
  const from=pts[pts.length-1].t-r[2]*DAY_MS,s=pts.filter(p=>p.t>=from);return s.length>=2?s:pts.slice(-2);}
// Ritmo (kg/semana): regresión lineal de la tendencia en las últimas 4 semanas
function wRate(pts){const L=pts[pts.length-1].t,s=pts.filter(p=>p.t>=L-28*DAY_MS);
  if(s.length<3||L-s[0].t<5*DAY_MS)return null;let mx=0,my=0;s.forEach(p=>{mx+=p.t;my+=p.tr;});mx/=s.length;my/=s.length;
  let a=0,b=0;s.forEach(p=>{a+=(p.t-mx)*(p.tr-my);b+=(p.t-mx)*(p.t-mx);});return b?a/b*7*DAY_MS:null;}
function wRangeChips(k){return`<div class="wc-ranges" role="tablist">${WRANGES.map(r=>`<button class="wc-rg${r[0]===k?' on':''}" role="tab" aria-selected="${r[0]===k}" onclick="setWRange('${r[0]}')">${r[1]}</button>`).join('')}</div>`;}
let _wcSeq=0;const _wc={},_wcIds=[];
// Etiquetas del eje de tiempo (peso corporal y ficha de ejercicio): 4 equidistantes (≤120 días) o inicios de mes
function _wcXLabels(t0,t1){
  const span=Math.max(t1-t0,1),days=span/DAY_MS;
  if(days<=120)return[0,1/3,2/3,1].map(f=>t0+span*f).map(t=>[t,wFmt(t)]);
  const d=new Date(t0);d.setDate(1);d.setHours(0,0,0,0);const ms=[];while(d.getTime()<=t1){if(d.getTime()>=t0)ms.push(d.getTime());d.setMonth(d.getMonth()+1);}
  const step=Math.ceil(ms.length/5)||1;return ms.filter((_,i)=>i%step===0).map(t=>[t,wFmt(t,days>400?'my':'m')]);
}
// Ancho de una gráfica en unidades del viewBox = su ancho real en píxeles: así su letra (10 px) se ve de 10 px también
// a 320-360 px (con un viewBox fijo de 340 se encogía hasta ~7 px). off: márgenes, bordes y rellenos que la rodean;
// sheet: va en una hoja fija (ficha, detalle del peso), que mide lo que la ventana; si no, lo que #app (máx. 480 px)
function _wcW(off,sheet){
  let a=0;try{a=sheet?document.documentElement.clientWidth:(document.getElementById('app')||{}).clientWidth;}catch(e){}
  if(!(a>0))a=window.innerWidth||390;
  return Math.max(240,Math.min(440,Math.round(Math.min(a,480)-off)));
}
// Al cambiar el ancho (girar el móvil, ventana) se repintan las gráficas que haya a la vista
// (16b) El ancho de partida es el de la carga: el primer resize que solo cambia la altura (barra del navegador,
// teclado) no repinta nada
let _wcRzT=0,_wcRzW=(document.documentElement&&document.documentElement.clientWidth)||0;
window.addEventListener('resize',()=>{clearTimeout(_wcRzT);_wcRzT=setTimeout(()=>{
  const a=document.documentElement.clientWidth;if(Math.abs(a-_wcRzW)<6)return;_wcRzW=a;
  try{if(document.querySelector('#screen .wc-svg'))render();if(document.querySelector('#hist-root .wc-svg'))renderHist();if(document.querySelector('#wdetail-root .wc-svg'))renderWDetail();}catch(e){console.error(e);}
},180);});
function wChartSVG(pts,o){
  o=o||{};const W=o.w||340,H=o.h||150,PL=31,PR=12,PT=18,PB=20,id='wc'+(++_wcSeq),n=pts.length;
  const t0=pts[0].t,t1=pts[n-1].t,span=Math.max(t1-t0,1);
  const vals=pts.flatMap(p=>[p.v,p.tr]);let lo=Math.min(...vals),hi=Math.max(...vals);
  const pad=Math.max((hi-lo)*.14,.4);lo-=pad;hi+=pad;
  const st=[.2,.5,1,2,2.5,5,10,20].find(s=>s>=(hi-lo)/4)||20,ticks=[];
  for(let v=Math.ceil(lo/st)*st;v<=hi+1e-9;v+=st)ticks.push(+v.toFixed(2));
  const X=t=>PL+(t-t0)/span*(W-PL-PR),Y=v=>PT+(hi-v)/(hi-lo)*(H-PT-PB);
  const xl=_wcXLabels(t0,t1),days=span/DAY_MS;
  const tr=pts.map((p,i)=>(i?'L':'M')+X(p.t).toFixed(1)+','+Y(p.tr).toFixed(1)).join('');
  const area=tr+`L${X(t1).toFixed(1)},${H-PB}L${PL},${H-PB}Z`;
  let iMx=0,iMn=0;pts.forEach((p,i)=>{if(p.v>pts[iMx].v)iMx=i;if(p.v<pts[iMn].v)iMn=i;});
  const last=pts[n-1],lx=X(last.t),ly=Y(last.v),r=n>120?1.7:n>50?2.1:2.6;
  const far=i=>i!==n-1&&Math.abs(X(pts[i].t)-lx)>46;
  const lab=(i,txt,below)=>{const x=X(pts[i].t),y=Y(pts[i].v);const a=x<PL+24?'start':x>W-PR-24?'end':'middle';
    return`<text x="${x.toFixed(1)}" y="${(below?y+12:y-7).toFixed(1)}" text-anchor="${a}" class="wc-ann">${txt}</text>`;};
  _wc[id]={W,H,PT,PB,PL,PR,p:pts.map(p=>({x:X(p.t),y:Y(p.v),ty:Y(p.tr),v:p.v,tr:p.tr,t:p.t}))};
  _wcIds.push(id);while(_wcIds.length>8)delete _wc[_wcIds.shift()];
  return`<svg class="wc-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolución del peso: de ${wf1(pts[0].v)} a ${wf1(last.v)} kg">
    <defs><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--green)" stop-opacity=".22"/><stop offset="100%" stop-color="var(--green)" stop-opacity="0"/></linearGradient></defs>
    ${ticks.map(v=>`<line x1="${PL}" x2="${W-PR}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" class="wc-grid"/><text x="${PL-6}" y="${(Y(v)+3).toFixed(1)}" text-anchor="end" class="wc-ytk">${st<1?v.toFixed(1):v}</text>`).join('')}
    ${xl.map(([t,s],i)=>`<text x="${X(t).toFixed(1)}" y="${H-5}" text-anchor="${days<=120?(i===0?'start':i===3?'end':'middle'):'middle'}" class="wc-xtk">${s}</text>`).join('')}
    <path d="${area}" fill="url(#${id}g)"/>
    ${n<=45?`<path d="${pts.map((p,i)=>(i?'L':'M')+X(p.t).toFixed(1)+','+Y(p.v).toFixed(1)).join('')}" class="wc-raw"/>`:''}
    ${pts.map(p=>`<circle cx="${X(p.t).toFixed(1)}" cy="${Y(p.v).toFixed(1)}" r="${r}" class="wc-pt"/>`).join('')}
    <path d="${tr}" class="wc-trend"/>
    ${far(iMx)?lab(iMx,'máx '+wf1(pts[iMx].v),false):''}${far(iMn)&&iMn!==iMx?lab(iMn,'mín '+wf1(pts[iMn].v),true):''}
    <circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="4.6" class="wc-last"/>
    ${(()=>{const q=_wcPlace([{x:lx,y:ly,txt:wf1(last.v)}],[pts.map(p=>[X(p.t),Y(p.tr)])].concat(n<=45?[pts.map(p=>[X(p.t),Y(p.v)])]:[]),pts.slice(-8).map(p=>[X(p.t),Y(p.v),p===last?4.6:r]),{PL,PT,PB,W,H})[0];
      return`<text x="${q.x.toFixed(1)}" y="${q.y.toFixed(1)}" text-anchor="${q.anc}" class="wc-lastv">${wf1(last.v)}</text>`;})()}
    <g id="${id}-h" class="wc-hov" style="display:none"><line class="wc-hl" y1="${PT-6}" y2="${H-PB}"/><circle class="wc-hd" r="4.5"/><circle class="wc-ht" r="3"/>
      <g class="wc-tip"><rect rx="6" width="118" height="34"/><text class="wc-t1" x="8" y="14"></text><text class="wc-t2" x="8" y="27"></text></g></g>
    <rect x="0" y="0" width="${W}" height="${H}" fill="transparent" style="touch-action:pan-y;cursor:crosshair" onpointerdown="wcMove(event,'${id}')" onpointermove="wcMove(event,'${id}')" onpointerleave="wcLeave(event,'${id}')"/>
  </svg>`;}
function wcMove(ev,id){const c=_wc[id],g=document.getElementById(id+'-h');if(!c||!g)return;
  const r=ev.currentTarget.ownerSVGElement.getBoundingClientRect();const x=(ev.clientX-r.left)/r.width*c.W;
  const P=c.p;let lo=0,hi=P.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(P[m].x<x)lo=m;else hi=m;}
  const p=Math.abs(P[lo].x-x)<=Math.abs(P[hi].x-x)?P[lo]:P[hi];
  g.style.display='';const q=s=>g.querySelector(s);
  q('.wc-hl').setAttribute('x1',p.x);q('.wc-hl').setAttribute('x2',p.x);
  // Sin línea principal en ese punto (y null: la de recomposición antes de tu primera sesión del periodo) va solo la segunda
  const hd=q('.wc-hd'),py=p.y!=null?p.y:p.ty;hd.style.display=p.y==null?'none':'';if(p.y!=null){hd.setAttribute('cx',p.x);hd.setAttribute('cy',p.y);}
  // Segunda línea (tendencia del peso, 1RM estimado de la ficha): sin ella (ty null) no hay segundo punto
  const ht=q('.wc-ht');if(p.ty==null)ht.style.display='none';else{ht.style.display='';ht.setAttribute('cx',p.x);ht.setAttribute('cy',p.ty);}
  // Textos propios del punto (ficha de ejercicio: t1/t2) o los del peso corporal
  const t1=q('.wc-t1'),t2=q('.wc-t2'),rc=q('.wc-tip rect');
  t1.textContent=p.t1!=null?p.t1:wFmt(p.t,'wd')+' · '+wf1(p.v)+' kg';t2.textContent=p.t2!=null?p.t2:'Tendencia '+wf1(p.tr)+' kg';
  let tw=118,th=34;
  if(c.auto){th=t2.textContent?34:21;try{tw=Math.ceil(Math.max(t1.getComputedTextLength(),t2.getComputedTextLength()))+16;}catch(e){tw=180;}
    tw=Math.min(c.W-c.PL-c.PR,Math.max(70,tw));rc.setAttribute('width',tw);rc.setAttribute('height',th);}
  const tx=Math.max(c.PL,Math.min(c.W-c.PR-tw,p.x-tw/2)),ty=py-th-12<2?Math.min(c.H-c.PB-th-2,py+12):py-th-12;
  q('.wc-tip').setAttribute('transform','translate('+tx.toFixed(1)+','+ty.toFixed(1)+')');
  // (12) La lectura no tapa a medias el valor final (ficha, recomposición, peso): si se pisan, ese valor se oculta mientras tanto
  _wcLastV(g,el=>{try{const b=el.getBBox();return tx<b.x+b.width+2&&tx+tw>b.x-2&&ty<b.y+b.height+2&&ty+th>b.y-2;}catch(e){return false;}});}
// Valores finales de las gráficas (ficha, peso, recomposición): cada uno prueba varios sitios alrededor de su último punto
// (arriba a la izquierda, debajo, a su altura a la izquierda, más arriba, más abajo, a la derecha si cabe) y se queda,
// para todos a la vez, con la combinación que menos choca: un valor encima de otro descarta la combinación; cada línea que
// lo cruza (polilíneas en px del viewBox) o punto que tapa pesa más que preferir un sitio a otro.
// specs: [{x,y,txt}]; polys: [[[x,y],…],…]; marks: [[x,y,r],…]; o: {PL,PT,PB,W,H,xMax} → [{x,y,anc}]
function _segBox(x1,y1,x2,y2,b){let t0=0,t1=1;const dx=x2-x1,dy=y2-y1;
  for(const [p,q] of [[-dx,x1-b.x0],[dx,b.x1-x1],[-dy,y1-b.y0],[dy,b.y1-y1]]){
    if(p===0){if(q<0)return false;}else{const r=q/p;if(p<0){if(r>t1)return false;if(r>t0)t0=r;}else{if(r<t0)return false;if(r<t1)t1=r;}}}
  return true;}
function _wcPlace(specs,polys,marks,o){
  const xMax=o.xMax!=null?o.xMax:o.W-1;
  // b: la tinta del texto (11 px DM Mono: ~7 px por carácter, de ty−10 a ty+2) para los choques con líneas y puntos;
  // bb: su caja entera (getBBox: ty−11 a ty+3) para no pisar otro valor ni salirse por arriba o hasta los rótulos del eje
  const box=(x0,tw,ty)=>({x0,x1:x0+tw,y0:ty-10,y1:ty+2}),bbox=(x0,tw,ty)=>({x0,x1:x0+tw,y0:ty-11,y1:ty+3});
  const cands=specs.map(sp=>{const tw=sp.txt.length*7,x=sp.x,y=sp.y,L=[];
    const add=(ax,ty,anc,pref)=>{const x0=anc==='end'?ax-tw:ax,b=box(x0,tw,ty),bb=bbox(x0,tw,ty);
      if(x0<o.PL-4||b.x1>xMax||bb.y0<0||bb.y1>o.H-o.PB+7)return;L.push({x:ax,y:ty,anc,b,bb,pref});};
    // (los dos valores pueden apilarse: 14 px entre uno y otro, sin tocarse)
    if(x>=o.PL+56){add(x-7,y-9,'end',0);add(x-7,y+15,'end',1);add(x-11,y+4,'end',2);add(x-7,y-23,'end',4);add(x-7,y+29,'end',5);}
    else{add(x+7,y-9,'start',0);add(x+7,y+15,'start',1);add(x+7,y-23,'start',4);add(x+7,y+29,'start',5);}
    add(x+11,y+4,'start',3);
    if(!L.length){const ty=y<o.PT+16?y+15:y-9,st=x<o.PL+56,ax=st?x+7:x-7,x0=st?ax:ax-tw;L.push({x:ax,y:ty,anc:st?'start':'end',b:box(x0,tw,ty),bb:bbox(x0,tw,ty),pref:9});}
    L.forEach(c=>{const b={x0:c.b.x0-1.5,x1:c.b.x1+1.5,y0:c.b.y0-1.5,y1:c.b.y1+1.5};
      const hit=polys.filter(pl=>{for(let i=1;i<pl.length;i++)if(_segBox(pl[i-1][0],pl[i-1][1],pl[i][0],pl[i][1],b))return true;return pl.length===1&&pl[0][0]>=b.x0&&pl[0][0]<=b.x1&&pl[0][1]>=b.y0&&pl[0][1]<=b.y1;}).length;
      const mk=marks.filter(([mx,my,r])=>mx+r>b.x0&&mx-r<b.x1&&my+r>b.y0&&my-r<b.y1).length;
      c.k=hit*10+mk*10+c.pref;});
    return L;});
  const ov=(a,b)=>a.x0<b.x1+3&&a.x1>b.x0-3&&a.y0<b.y1&&a.y1>b.y0;
  let best=null,bk=Infinity;
  const walk=(i,pick,k)=>{if(k>=bk)return;if(i===cands.length){bk=k;best=pick.slice();return;}
    for(const c of cands[i]){let kk=k+c.k;for(const p of pick)if(ov(p.bb,c.bb))kk+=1000;pick.push(c);walk(i+1,pick,kk);pick.pop();}};
  walk(0,[],0);
  return best.map(c=>({x:c.x,y:c.y,anc:c.anc}));
}
function _wcLastV(g,hide){const sv=g&&g.ownerSVGElement;if(sv)sv.querySelectorAll('.wc-lastv,.rc-lv').forEach(el=>{el.style.opacity=hide(el)?'0':'';});}
function wcLeave(ev,id){if(ev.pointerType!=='mouse')return;const g=document.getElementById(id+'-h');if(g){g.style.display='none';_wcLastV(g,()=>false);}}
function wLegend(rate){return`<div class="wc-legend"><span><i class="wc-ld"></i>Registro</span><span><i class="wc-ll"></i>Tendencia 7 días</span>${rate!=null?`<span class="wc-rate ${wRateCls(rate)}">${wSign(rate,2)} kg/sem</span>`:''}</div>`;}
// Día de la última pesada: «Hoy» / «Ayer» solo si lo es de verdad (con su fecha guardada); si no, «Vie 23 Oct».
// (10) Sustituye a la etiqueta «kg hoy / kg ayer» de la fila de métricas de Inicio, que se quitó por repetir datos.
function wWhen(t){
  const real=(S.weights||[]).some(w=>w&&typeof w.ts==='number'&&w.ts===t),n=Date.now();
  return real&&sameDayTs(t,n)?'Hoy':real&&sameDayTs(t,n-DAY_MS)?'Ayer':wFmt(t,'wd');
}
// Tarjeta de peso (Inicio y Progreso)
function renderWeightCard(emptyMsg){
  const pts=wSeries();
  if(pts.length<2)return`<div class="card">${pts.length?`<div class="wc-top"><div><div class="wc-now">${wf1(pts[0].v)}<small> kg</small></div><div class="wc-sub">Primer registro · ${wFmt(pts[0].t)}</div></div></div><p class="wc-hint">Registra tu peso otro día para ver la evolución.</p>`:`<div class="empty"><div class="eic">${ic('scale')}</div><p>${emptyMsg}</p></div>`}
    <button class="btn bs" style="margin-top:12px" onclick="S.wmodal=true;renderWmodal()">Registrar peso de hoy</button></div>`;
  const k=wRangeKey(),rp=wInRange(pts,k),last=pts[pts.length-1],ch=last.v-rp[0].v,rate=wRate(pts),R=WRANGES.find(x=>x[0]===k);
  const vs=rp.map(p=>p.v),avg=vs.reduce((a,b)=>a+b,0)/vs.length;
  return`<div class="card wcard">
    <div class="wc-top">
      <div><div class="wc-now">${wf1(last.v)}<small> kg</small></div><div class="wc-sub">${wWhen(last.t)} · tendencia ${wf1(last.tr)} kg</div></div>
      <div class="wc-right"><div class="wc-badge ${ch<=0?'dn':'up'}">${wSign(ch)} kg</div><div class="wc-rl">${_nwUnits(wRangeLbl(rp,R))}</div></div>
    </div>
    ${wRangeChips(k)}
    <div class="wchart">${wChartSVG(rp,{h:150,w:_wcW(68)})}</div>
    ${wLegend(rate)}
    <div class="wc-stats">
      <div class="hist-m"><div class="hist-m-v">${wf1(rp[0].v)}</div><div class="hist-m-l">Inicio</div></div>
      <div class="hist-m"><div class="hist-m-v">${wf1(Math.min(...vs))}</div><div class="hist-m-l">Mín</div></div>
      <div class="hist-m"><div class="hist-m-v">${wf1(Math.max(...vs))}</div><div class="hist-m-l">Máx</div></div>
      <div class="hist-m"><div class="hist-m-v">${wf1(avg)}</div><div class="hist-m-l">Media</div></div>
    </div>
    <div class="wc-actions"><button class="btn bs" onclick="S.wmodal=true;renderWmodal()">Registrar peso</button><button class="btn bs" onclick="openWDetail()">Ver detalle</button></div>
  </div>`;}
// Hoja de detalle: gráfica grande, resumen semanal y registros
function openWDetail(){S._wdetail=true;S._wdetailN=40;renderWDetail();}
function closeWDetail(){S._wdetail=false;renderWDetail();}
function renderWDetail(){
  const root=document.getElementById('wdetail-root');if(!root)return;
  const pts=S._wdetail?wSeries():[];if(!S._wdetail||pts.length<2){root.innerHTML='';return;}
  const k=wRangeKey(),rp=wInRange(pts,k),last=pts[pts.length-1],ch=last.v-rp[0].v,rate=wRate(pts),R=WRANGES.find(x=>x[0]===k);
  const vs=rp.map(p=>p.v),avg=vs.reduce((a,b)=>a+b,0)/vs.length;
  // medias semanales (lunes-domingo), recientes primero
  const wm=new Map();rp.forEach(p=>{const d=new Date(p.t),dw=d.getDay();d.setDate(d.getDate()+(dw===0?-6:1-dw));d.setHours(0,0,0,0);
    const key=d.getTime();if(!wm.has(key))wm.set(key,[]);wm.get(key).push(p.v);});
  const wl=[...wm.entries()].sort((a,b)=>b[0]-a[0]).map(([t,a])=>({t,avg:a.reduce((x,y)=>x+y,0)/a.length,n:a.length}));
  const wlo=Math.min(...wl.map(w=>w.avg)),whi=Math.max(...wl.map(w=>w.avg));
  const wkLbl=t=>{const a=new Date(t),b=new Date(t+6*DAY_MS);return a.getMonth()===b.getMonth()?a.getDate()+'–'+b.getDate()+' '+MONTHS[b.getMonth()]:wFmt(a.getTime())+' – '+wFmt(b.getTime());};
  const delta=d=>d==null?'<span class="hist-item-ch" style="color:var(--text3)">—</span>':`<span class="hist-item-ch" style="color:${d<0?'var(--green)':d>0?'var(--red)':'var(--text3)'}">${wSign(d)}</span>`;
  const weeks=wl.map((w,i)=>{const prev=wl[i+1];const pct=whi>wlo?(w.avg-wlo)/(whi-wlo):.5;
    return`<div class="hist-item"><div class="hist-item-d" style="min-width:84px">${wkLbl(w.t)}</div>
      <div class="wd-bar"><i style="width:${(18+pct*82).toFixed(0)}%"></i></div>
      <div class="hist-item-w" style="flex:0 0 auto">${wf1(w.avg)}</div>${delta(prev?w.avg-prev.avg:null)}</div>`;}).join('');
  const N=S._wdetailN||40,rev=rp.slice().reverse(),shown=rev.slice(0,N);
  const entries=shown.map((p,i)=>{const prev=rev[i+1];return`<div class="hist-item"><div class="hist-item-d" style="min-width:84px">${wFmt(p.t,'wd')}</div>
    <div class="hist-item-w">${wf1(p.v)} kg</div>${delta(prev?p.v-prev.v:null)}</div>`;}).join('');
  const sc=root.querySelector('.hist-sheet');const keepScroll=sc?sc.scrollTop:0;
  root.innerHTML=`<div class="hist-over" onclick="if(event.target===this)closeWDetail()"><div class="hist-sheet" role="dialog" aria-label="Detalle del peso corporal">
    <div class="hist-sheet-head"><div class="hist-sheet-hdl"></div>
      <div class="hist-sheet-title">Peso corporal</div>
      <div class="hist-sheet-sub">${pts.length} registros · desde ${wFmt(pts[0].t,'dmy')}</div>
      <button class="hist-sheet-close" onclick="closeWDetail()" aria-label="Cerrar">✕</button></div>
    <div class="hist-sheet-body">
      ${wRangeChips(k)}
      <div class="wchart lg">${wChartSVG(rp,{h:205,w:_wcW(53,true)})}</div>
      ${wLegend(rate)}
      <div class="hist-row">
        <div class="hist-m"><div class="hist-m-v">${wf1(last.v)}</div><div class="hist-m-l">Actual</div></div>
        <div class="hist-m"><div class="hist-m-v" style="color:${ch<=0?'var(--green)':'var(--red)'}">${wSign(ch)}</div><div class="hist-m-l">${wRangeLbl(rp,R)}</div></div>
        <div class="hist-m"><div class="hist-m-v" style="color:${rate==null?'var(--text3)':rate<=0?'var(--green)':'var(--red)'}">${rate==null?'—':wSign(rate,2)}</div><div class="hist-m-l">kg / semana</div></div>
        <div class="hist-m"><div class="hist-m-v">${wf1(Math.min(...vs))}</div><div class="hist-m-l">Mínimo</div></div>
        <div class="hist-m"><div class="hist-m-v">${wf1(Math.max(...vs))}</div><div class="hist-m-l">Máximo</div></div>
        <div class="hist-m"><div class="hist-m-v">${wf1(avg)}</div><div class="hist-m-l">Media</div></div>
      </div>
      <p class="wc-hint">Toca o arrastra sobre la gráfica para ver cada día. La tendencia suaviza las subidas y bajadas diarias (agua, comida, sal) y muestra tu evolución real.</p>
      <div class="hist-list-h">Media semanal</div>${weeks}
      <div class="hist-list-h" style="margin-top:14px">Registros</div>${entries}
      ${rev.length>N?`<button class="btn bs" style="margin-top:6px" onclick="S._wdetailN=(S._wdetailN||40)+60;renderWDetail()">Ver más (${rev.length-N})</button>`:''}
      <button class="btn bp" style="margin-top:12px" onclick="closeWDetail();S.wmodal=true;renderWmodal()">Registrar peso de hoy</button>
    </div></div></div>`;
  const sc2=root.querySelector('.hist-sheet');if(sc2&&keepScroll)sc2.scrollTop=keepScroll;
}

// RPE medio de las series marcadas hoy (1-3) o null
function _liveRpeAvg(id){
  const v=Object.values((S.rpe&&S.rpe[id])||{}).filter(x=>x>0);
  return v.length?+(v.reduce((a,b)=>a+b,0)/v.length).toFixed(2):null;
}
// Reps de hoy para guardar/juzgar: las escritas o, si están vacías, las del objetivo de hoy (el placeholder).
// null si el objetivo no es un nº de reps («30s»).
function _todayReps(ex,p){
  const t=parseInt((S.logs[ex.id]||{}).r);
  if(t>0)return t;
  if(p===undefined)p=coach_prescribe(ex.id);
  return p&&p.reps>0?p.reps:targetRepsNum(ex);
}
// Tarjeta de resultado al completar todas las series: qué toca la PRÓXIMA sesión, con la misma lógica que el
// objetivo de hoy (coach_prescribe sobre tu historial + lo de hoy). Así nunca contradice a la etiqueta.
function getSug(id,sets,reps){
  const ex=findExInPlan(id);
  sets=ex?(parseInt(ex.s)||sets):sets;
  if(!(sets>0))return null;
  const c=S.sets[id]||{};
  let done=0;for(let i=0;i<sets;i++){if(c[i])done++;}
  if(done<sets)return null;
  // Lo de hoy sale de las series (peso máximo y reps más bajas con él); sin series propias, de lo escrito
  const l=S.logs[id]||{},sm=ex&&!ex.cardio?setsSummary(ex):null;
  const w=(sm&&sm.w)||parseFloat(l.w)||0;
  // Sin peso: peso corporal, bandas, por tiempo o distancia (con su medida de hoy); peso × reps sin peso, nada
  const lt=ex?exLT(ex):'w',nk=lt!=='w'&&lt!=='c';
  if(!w&&(!nk||(lt==='t'&&!(sm&&sm.t>0))||(lt==='d'&&!(sm&&sm.m>0))))return null;
  // Semana ligera: nunca se propone subir
  // (13 r1) «15 % menos de carga» solo si de verdad baja (el Coach da su cifra); «con menos series» solo si sus series bajaron
  if(deloadAppliesTo(id)){
    const p=_dlLoadMode(id)&&lt!=='bw'&&lt!=='r'?coach_prescribe(id):null;
    if(p&&p.dlFrom!=null){const to=p.weight>0&&p.dlFrom>p.weight?p.weight:p.t>0?p.t:p.m;
      return{t:'ok',m:`Descarga: tus series con un ${_dlPctTxt(p.dlFrom,to)} menos de carga. La subida vuelve cuando termine. 🧘`};}
    const fewer=_dlFewerSets(id);
    return{t:'ok',m:w?`Descarga: mantén ${kgTxt(w)} kg ${fewer?'con menos series':'y hazlo suave'}. La subida vuelve cuando termine. 🧘`
      :`Descarga: lo mismo de hoy${fewer?' con menos series':', suave'}. La subida vuelve cuando termine. 🧘`};
  }
  if(getActiveRest())return{t:'ok',m:w?`Semana de descanso: entrena suave y mantén ${kgTxt(w)} kg o menos. 🌴`:'Semana de descanso: entrena suave, con menos reps o menos tiempo. 🌴'};
  if(!ex)return null;
  const today=coach_prescribe(id);
  // Reps confirmadas: las de las series (al marcarlas o tocadas) o las escritas; si no, se cuentan las del objetivo
  const typedR=sm&&sm.own&&sm.r>0?sm.r:parseInt(l.r),r=typedR>0?(sm&&sm.r>0?sm.r:typedR):_todayReps(ex,today);
  // Lo de hoy con el plan de hoy (ps/pr): el motivo sale como «hoy 3×12…», sin paréntesis dentro de paréntesis
  const extra={v:w,r:r>0?r:null,setsDone:done,rpe:_liveRpeAvg(id),ts:Date.now(),ps:_baseSets(ex),pr:ex.r,sets:sm?sm.sets:undefined};
  if(nk){extra.lt=lt;if(lt==='t'||lt==='d')extra.r=sm&&sm.r>0?sm.r:null;if(sm&&sm.t>0)extra.t=sm.t;if(sm&&sm.m>0)extra.m=sm.m;}
  const next=coach_prescribe(id,{ex,ignoreLight:true,extra});
  if(!next)return null;
  if(!_presIsKg(next)){
    // Sin kilos: reps, tiempo o distancia (o la variante que toca)
    const why=esc(next.reason),val=esc(presValTxt(next)),line=sm?esc(_setsLine(sm.sets)):'';
    if(next.kind==='harder')return{t:'up',m:`¡Objetivo cumplido! Próxima sesión: ${esc(next.head.toLowerCase())} (${why}). 🎯`};
    if(next.kind==='up')return{t:'up',m:`¡Objetivo cumplido! Próxima sesión: ${val} (${why}). 🎯`};
    if(next.kind==='down')return{t:'dn',m:`Próxima sesión: ${esc(next.head.toLowerCase())} (${why}). No pasa nada. 💪`};
    // «+ reps» que viene de repetir (held: por debajo del rango, distancia sin completar…): con su motivo, como «mantén»
    if(next.kind==='reps'&&!next.held)return{t:'ok',m:`Buen trabajo${line?': '+line:''}. Próxima sesión: ${val}. 👍`};
    return{t:'ok',m:`Próxima sesión: ${val} (${why}). ✊`};
  }
  const asm=!(typedR>0)&&r>0?` Cuento ${r} reps (tu objetivo): si hiciste otras, apúntalas.`:'';
  const kg=kgTxt(next.weight),why=esc(next.reason);
  // Pesas fijas con un salto de más del 50 %: la versión más difícil (lo mismo que dice el objetivo y su botón)
  if(next.kind==='harder')return{t:'up',m:`¡Objetivo cumplido! Próxima sesión: ${esc(next.head.toLowerCase())} (${why}). 🎯${asm}`};
  if(next.kind==='up')return{t:'up',m:`¡Objetivo cumplido! Próxima sesión: ${kg} kg × ${next.reps} (${why}). 🎯${asm}`};
  if(next.kind==='down')return{t:'dn',m:/^dos sesiones/.test(next.reason)
    ?`Dos sesiones por debajo del rango: la próxima, baja a ${kg} kg y busca ${next.lo}-${next.hi} reps limpias. No pasa nada. 💪${asm}`
    :`Próxima sesión: baja a ${kg} kg y busca ${next.reps} reps (${why}). 💪${asm}`};
  if(next.kind==='reps')return{t:'ok',m:`Buen trabajo con ${kgTxt(w)} kg. Próxima sesión: mismo peso y busca ${next.reps} reps${/%/.test(next.reason)?' antes de subir':''}. 👍${asm}`};
  return{t:r>0&&r<next.lo?'dn':'ok',m:`Próxima sesión: mantén ${kg} kg y busca ${next.reps} reps (${why}). ✊${asm}`};
}

