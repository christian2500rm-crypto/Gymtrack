
function go(tab){
  _uiGen++;_scrollTo=null; // cambiar de pantalla cancela el avance automático pendiente del modo gym
  // (08) El RPE ya no es una ventana: sus chips van en la barra del descanso, que se ve en todas las pantallas
  S.tab=tab;['dash','workout','coach','prog'].forEach(t=>{const b=document.getElementById('nb-'+t);b.classList.toggle('on',t===tab);if(t===tab)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');}); // la pestaña activa, también para el lector de pantalla
  document.getElementById('screen').scrollTop=0;render();saveState();_toastPlace();
  try{if(_sw.pending)swUpdateSync(true);}catch(e){} // (15) el aviso de versión nueva se esconde al entrar en Entreno; (16c) y vuelve al salir
}

// ═══════════════════════════════════════════════════════════
// TARJETA «HOY TOCA» DE INICIO (10)
// ═══════════════════════════════════════════════════════════
// Lo primero de Inicio: qué toca, con qué peso y cuánto vas a tardar, con la técnica en 3D del primer multiarticular.
// Al tocar otro ejercicio de la lista cambia la vista previa en su sitio (GymAnim.swap: mismo canvas, sin repintar).
// Estados (hoyState): 'train' toca entrenar · 'extra' objetivo semanal cumplido (sesión extra opcional) ·
// 'live' entreno a medias (Continuar) · 'done' ya entrenaste hoy (resumen + la próxima) · 'rest' semana de descanso.
// Una descarga se avisa dentro de la tarjeta (su aviso con «Terminar»). Todo sale de S al pintar: sin campos nuevos;
// el ejercicio elegido y el elemento montado de la vista previa viven en memoria (no en S).
let _hoyPick=null;  // {dk, id}: ejercicio elegido a mano para la vista previa (se olvida si cambia el día)
let _hoyKeep=null;  // elemento #hoy-pv montado: se reutiliza entre repintados (mismo canvas, giro y fase)
const HOY_MUS={piernas:'piernas',pecho:'pecho',espalda:'espalda',hombros:'hombros',biceps:'bíceps',triceps:'tríceps',core:'abdomen'};
const HOY_WD=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
function _joinY(a){return a.length<2?(a[0]||''):a.slice(0,-1).join(', ')+' y '+a[a.length-1];}
// Día que toca: el siguiente de la rotación. (E1a) Si ese día no existe o se ha quedado vacío, el siguiente con ejercicios
// (los vacíos no entran en la rotación); si ningún día tiene ejercicios, el que tocaba (o el primero) y Inicio lo dice.
function hoyDayKey(){
  const p=getPlan();
  if(_dayLive(p[S.nextDay]))return S.nextDay;
  if(liveDayKeys(p).length)return getNextDay(S.nextDay,p);
  return _isPlanDay(p[S.nextDay])?S.nextDay:(dayKeys(p)[0]||'A');
}
// Nombre corto («Jale» de «Jale — espalda y bíceps») y músculos sacados de sus ejercicios (siguen a la rutina editada;
// se omiten si el nombre ya los dice, como «Piernas + abdomen»)
function hoyDayInfo(dk){
  const day=getPlan()[dk];if(!day)return null;
  const ex=(Array.isArray(day.ex)?day.ex:[]).filter(e=>e&&typeof e==='object'&&e.id!=null);
  const str=ex.filter(e=>!e.cardio),car=ex.filter(e=>e.cardio);
  const label=String(day.label||dk),focus=String(day.focus||'').trim(),name=focus.split(/\s+[—–]\s+/)[0].trim()||label;
  const mus=[];str.forEach(e=>{const m=HOY_MUS[e.muscle];if(m&&!mus.includes(m))mus.push(m);});
  const nn=normTxt(name),musTxt=mus.length&&!mus.every(m=>nn.includes(normTxt(m)))?_joinY(mus):'';
  return{dk,day,label,name,focus,ex,str,car,mus:musTxt};
}
function _hoyCount(info){return info.str.length?'<span class="nw">'+plural(info.str.length,'ejercicio')+'</span>'+(info.car.length?' <span class="nw">+ cardio</span>':''):info.car.length?'cardio':'sin ejercicios';}
// Duración estimada: media de las 6 últimas sesiones de ese día con una duración creíble (5-360 min); sin ninguna, la
// de tus últimas sesiones de cualquier día; sin historial, del plan (≈1 min por ejercicio + 40 s por serie + su
// descanso entre series + los minutos del cardio), redondeada a 5 min.
const _okDur=s=>!!s&&s.durationMin!=null&&isFinite(+s.durationMin)&&+s.durationMin>=5&&+s.durationMin<=MAX_SESSION_MIN;
function _cardioMin(ex){const m=String(ex&&ex.r!=null?ex.r:'').match(/(\d+(?:[.,]\d+)?)\s*min/i);return m?parseFloat(m[1].replace(',','.')):0;}
// (E5, §G.12) La estimación del plan con la fórmula del generador (_hoyEstMin: lo que promete el resultado del cuestionario) y,
// con sesiones de ese día en tu rutina, × durK = mediana de lo que duraron sus 6 últimas ÷ estimado, entre 0,8 y 1,4. Sin sesiones
// de ese día pero sí de otros días de tu rutina, la misma corrección con ellas (cada una frente a la estimación de su día).
const _DURK_MIN=0.8,_DURK_MAX=1.4;
function _median(a){const v=a.slice().sort((x,y)=>x-y),n=v.length;return!n?NaN:n%2?v[(n-1)/2]:(v[n/2-1]+v[n/2])/2;}
function hoyDuration(dk){
  const est=_hoyEstMin(dk);if(!(est>0))return null;
  const L=Array.isArray(S.sessions)?S.sessions:[],cl=r=>Math.min(_DURK_MAX,Math.max(_DURK_MIN,r));
  const own=L.filter(s=>_okDur(s)&&sessOfDay(s,dk)).slice(-6); // (E1b) el mismo día por su id
  if(own.length){const k=cl(_median(own.map(s=>+s.durationMin))/est);return{min:Math.max(5,Math.round(est*k)),src:'day',n:own.length,est,k};}
  const p=getPlan(),estOf={};
  const all=L.filter(s=>_okDur(s)&&sessOfRoutine(s)).map(s=>{const d=dayKeys(p).find(x=>sessOfDay(s,x));if(!d)return null;
    if(!(d in estOf))estOf[d]=_hoyEstMin(d);return estOf[d]>0?(+s.durationMin)/estOf[d]:null;}).filter(r=>r!=null).slice(-6); // (E2) solo las de tu rutina
  if(all.length){const k=cl(_median(all));return{min:Math.max(5,Math.round(est*k)),src:'all',n:all.length,est,k};}
  return{min:Math.max(5,Math.round(est)),src:'plan',n:0,est,k:1};
}
function _hoyDurHtml(d,dk){
  if(!d)return'';
  const why=d.src==='day'?(d.n===1?'Estimado con tu plan y lo que duró tu última sesión de este día':`Estimado con tu plan y tus ${d.n} últimas sesiones de este día`):d.src==='all'?'Estimado con tu plan y tus últimas sesiones':'Estimado con las series, los descansos y el cardio del plan';
  return`<b title="${esc(why)}">~${d.min} min</b>${d.src==='plan'?' estimado':''}`;
}
// Vista previa: la elegida a mano (si es de ese día), si no `def` (en curso: el siguiente ejercicio), si no el primer
// multiarticular con animación, si no el primero de fuerza, si no cualquiera con animación
function _hoyAnimOk(e){return !!(e&&exAnimKey(e));}
function hoyPreviewEx(info,def){
  if(!info)return null;
  if(_hoyPick&&_hoyPick.dk===info.dk){const e=info.ex.find(x=>String(x.id)===_hoyPick.id);if(_hoyAnimOk(e))return e;}
  if(_hoyAnimOk(def))return def;
  return info.str.find(e=>isCompoundEx(e)&&_hoyAnimOk(e))||info.str.find(_hoyAnimOk)||info.ex.find(_hoyAnimOk)||null;
}
// Entreno en curso: el ejercicio empezado sin terminar; si no, el primero pendiente de fuerza; si no, el cardio pendiente
function _hoyNext(info){
  const exs=info.str.filter(e=>parseInt(e.s)>0);
  const ex=exs.find(e=>countSetsDone(e.id,e.s)>0&&!_exComplete(e))||exs.find(e=>!_exComplete(e));
  if(ex)return{ex,i:_firstUndone(ex)};
  const c=info.car.find(e=>!_exComplete(e));return c?{ex:c,i:-1}:null;
}
function _hoyChip(ex,p,live){
  if(live){const n=Math.max(0,parseInt(ex.s)||0),c=countSetsDone(ex.id,n);
    if(n&&c>=n)return`<span class="hoy-tg ok">✓ hecho</span>`;
    if(c>0)return`<span class="hoy-tg part" role="img" aria-label="${c} de ${n} series">${c}/${n}</span>`;}
  if(p)return`<span class="hoy-tg ${presKCls(p)}" role="img" aria-label="Objetivo: ${_presIsKg(p)&&!p.up?`${esc(kgTxt(p.weight))} kilos por ${p.reps}`:esc(presValTxt(p))}, ${esc(presWord(p))}"><i aria-hidden="true">${icE(presIc(p))}</i><b class="tgl-v">${esc(presShortTxt(p))}</b></span>`;
  // Sin historial: cómo se mide (peso corporal, solo reps, por tiempo, distancia) o «nuevo»
  const lt=exLT(ex);
  return`<span class="hoy-tg new">${lt==='bw'?'peso corporal':lt==='r'?'reps':lt==='t'?'por tiempo':lt==='d'?'distancia':'nuevo'}</span>`;
}
function _hoyRowHtml(ex,p,sel,live){
  const n=Math.max(0,parseInt(ex.s)||0);
  const reps=p&&(p.unit==='kg'||p.unit==='reps')?(p.lo!==p.hi?`${p.lo}-${p.hi}`:String(p.lo)):fmtTargetReps(ex).replace(/\s*reps$/,'');
  const ok=_hoyAnimOk(ex);
  return`<button type="button" class="hoy-ex tgl-row${sel?' on':''}" data-ex="${esc(ex.id)}" aria-pressed="${sel?'true':'false'}"${ok?'':' disabled'} onclick="hoyPick(this.dataset.ex)">
    <span class="hoy-ex-i"><span class="hoy-ex-n">${esc(ex.n)}</span><span class="hoy-ex-m">${n}×${esc(reps)}${deloadAppliesTo(ex.id)?' · descarga':''}${ex.sub?' · <span class="sub-tag">solo hoy</span>':''}</span></span>${_hoyChip(ex,p,live)}</button>`;
}
function _hoyCarHtml(info,live){
  if(!info.car.length)return'';
  const parts=info.car.map(e=>{const d=live&&_exComplete(e);return`<b${d?' class="ok"':''}>${esc(String(e.r==null?'':e.r))}${d?' ✓':''}</b>`;}).join(' + ');
  return`<div class="hoy-car"><span aria-hidden="true">${ic('activity')}</span><span>Cardio ${parts}${info.car[0].eq?` · ${esc(info.car[0].eq)}`:''}</span></div>`;
}
function hoyState(){
  const aw=getActiveWorkout();if(aw)return{k:'live',aw,dk:aw.day};
  const now=Date.now(),dk=hoyDayKey();let today=null;
  (Array.isArray(S.sessions)?S.sessions:[]).forEach(s=>{if(s&&s.ts&&sameDayTs(s.ts,now)&&(!today||s.ts>=today.ts))today=s;});
  if(today)return{k:'done',s:today,dk};
  const rest=getActiveRest();if(rest)return{k:'rest',rest,dk};
  const wk=getWeekSessions(),target=getWeeklyTarget();
  return{k:wk>=target?'extra':'train',dk,wk,target};
}
function hoyCardHtml(){
  const st=hoyState();
  return st.k==='rest'?_hoyRestHtml(st):st.k==='done'?_hoyDoneHtml(st):_hoyTrainHtml(st);
}
// Toca entrenar / sesión extra / entreno en curso
// (E1b) Días vacíos: no rotan. Si ninguno tiene ejercicios, Inicio no dice «Hoy toca»: «Te falta rellenar tu rutina»; si
// solo algunos, una línea en la tarjeta lleva al editor en el primero vacío
function _hoyFillHtml(){
  const K=dayKeys(),k0=K[0]||'A';
  return`<div class="card hoy k-fill" id="hoy" data-dk="${esc(k0)}">
    <div class="hoy-k">Tu rutina</div>
    <div class="hoy-t"><span class="hoy-nm">Te falta rellenar tu rutina</span></div>
    <div class="hoy-m">${K.length>1?`Tus ${plural(K.length,'día')} aún no tienen ejercicios`:'Tu rutina aún no tiene ejercicios'}. Añádelos y aquí verás lo que toca cada día.</div>
    <div class="hoy-cta"><button class="btn bp hoy-go" data-dk="${esc(k0)}" onclick="openRoutineEditorAt(this.dataset.dk)">Rellenar mi rutina →</button></div>
  </div>`;
}
function _hoyEmptyDaysHtml(){
  const p=getPlan(),E=dayKeys(p).filter(k=>!_dayLive(p[k]));if(!E.length)return'';
  // «el Día D»; varios con su nombre de siempre, «los días D y E»; con nombres propios, los nombres
  const std=E.every(k=>dayLabel(k,p)==='Día '+k);
  const t=E.length===1?`Te falta rellenar el ${esc(dayLabel(E[0],p))}`:std?`Te faltan por rellenar los días ${_joinY(E)}`:`Te faltan por rellenar ${esc(_joinY(E.map(k=>dayLabel(k,p))))}`;
  return`<button type="button" class="hoy-fill" data-dk="${esc(E[0])}" onclick="openRoutineEditorAt(this.dataset.dk)">${t} · Editar <em aria-hidden="true">›</em></button>`;
}
function _hoyTrainHtml(st){
  if(st.k!=='live'&&!liveDayKeys().length)return _hoyFillHtml(); // (E1b)
  const live=st.k==='live',info=hoyDayInfo(st.dk);if(!info)return'';
  const pc='p'+esc(String(st.dk).toLowerCase()),tot=(S.sessions||[]).length;
  const nx=live?_hoyNext(info):null,pv=hoyPreviewEx(info,nx&&nx.ex),ak=pv?exAnimKey(pv):'';
  const pres=new Map(info.str.map(e=>[e.id,coach_prescribe(e.id)]));
  const anyP=[...pres.values()].some(Boolean),anyNk=[...pres.values()].some(p=>p&&!_presIsKg(p)); // ¿algún objetivo que no es de kilos?
  let kick='Hoy toca',head='',foot='',cta='';
  // (17) Lo que cuentan la pastilla «N/M series» y «▶ Continuar (N/M)»: series; en un día sin series (solo cardio), ejercicios
  const cnt=live?(st.aw.setsTotal?[st.aw.setsDone,st.aw.setsTotal,'serie']:[info.ex.filter(_exComplete).length,info.ex.length,'ejercicio']):null;
  if(live){
    const aw=st.aw;let ago='';
    if(aw.startTs){const m=Math.floor((Date.now()-aw.startTs)/60000);
      ago=m>=0&&m<1?'empezado ahora mismo':m>=0&&m<60?`empezado hace ${m} min`:m>=0&&m<1440?`empezado hace ${Math.max(1,Math.round(m/60))} h`:m>=0?`empezado hace ${plural(Math.max(1,Math.round(m/1440)),'día')}`:'';}
    kick=`En curso${ago?` <span>· ${ago}</span>`:''}`;
    const pct=cnt[1]?Math.min(100,Math.round(cnt[0]/cnt[1]*100)):0; // (17) la barra, con la misma cuenta (día solo de cardio: ejercicios)
    let nxt='¡Todo hecho! Solo te falta guardar la sesión.';
    if(nx&&nx.ex.cardio)nxt=`Siguiente: <em>${esc(nx.ex.n)}</em> · ${esc(String(nx.ex.r==null?'':nx.ex.r))}`;
    else if(nx){const rows=setRows(nx.ex,pres.get(nx.ex.id)),row=rows[nx.i];
      nxt=`Siguiente: <em>${esc(nx.ex.n)}</em> · <span class="hoy-nw">serie ${nx.i+1}/${rows.length}</span>${row?` · <span class="hoy-nw">${esc(_setValTxt(nx.ex,row))}</span>`:''}`;}
    const rs=reopenedFor(st.dk);
    head=`<div class="hoy-bar" aria-hidden="true"><i style="width:${pct}%"></i></div><div class="hoy-m">${nxt}</div>
      ${rs?`<div class="hoy-note">Sesión del ${esc(rs.session.date||'')} reabierta: al guardarla conserva su fecha, su duración y su nota.</div>`:''}`;
    // (16e r1 / 17) la misma cuenta que la pastilla de arriba (cnt): series hechas; sin series (solo cardio), ejercicios
    const [cd,ct,cu]=cnt;
    cta=`<div class="hoy-cta hoy-acts"><button class="btn bp hoy-go" onclick="resumeWorkout()" aria-label="Continuar el entreno: ${cd} de ${plural(ct,cu)}">▶ Continuar (${cd}/${ct})</button><button class="btn bs" onclick="discardWorkout()">Descartar</button></div>`;
  }else{
    if(st.k==='extra'){kick='Sesión extra <span>· opcional</span>';
      head=`<div class="hoy-note"><b>¡Semana completa! ${Math.min(st.wk,st.target)}/${st.target}</b> Si te apetece, una más.</div>`;}
    else if(!tot)kick='Tu primera sesión';
    cta=`<div class="hoy-cta"><button class="btn ${st.k==='extra'?'bs':'bp'} hoy-go" data-dk="${esc(st.dk)}" onclick="hoyStart(this.dataset.dk)">Empezar ${esc(info.label)}${st.k==='extra'?' (extra)':''} →</button></div>`;
    const last=[...(S.sessions||[])].reverse().find(s=>s&&sessOfDay(s,st.dk)&&s.ts); // (E1b) por su id de día
    if(last){const bits=[esc(last.date||fmtDate(new Date(last.ts)))];if(_okDur(last))bits.push(Math.round(+last.durationMin)+' min');
      if(last.totalEx)bits.push(`${+last.doneEx||0}/${plural(+last.totalEx,'ejercicio')}`);
      foot=`<button class="hoy-last" data-ts="${+last.ts}" onclick="openSessionSummary(+this.dataset.ts)">Última vez: ${bits.join(' · ')} <em aria-hidden="true">›</em></button>`;}
    else{const kg=info.str.some(e=>exLT(e)==='w'),m3=_effortObj()==='facil'?'unas 3':'2-3'; // (E6, §G.4) «Primera vez»
      foot=`<div class="hoy-tip">Primera vez${tot?' con este día':''}: elige ${kg?'un peso':'la variante'} con ${kg?'el':'la'} que te sobren ${m3} repeticiones y apunta lo que hagas; desde la próxima vez te digo ${kg?'qué peso poner':'cuántas buscar'}.</div>`;}
  }
  const meta=[info.mus?esc(info.mus):'',_hoyDurHtml(hoyDuration(st.dk),st.dk),_hoyCount(info)].filter(Boolean).join(' · ');
  const rows=info.str.map(e=>_hoyRowHtml(e,pres.get(e.id),pv&&pv.id===e.id,live)).join('');
  return`<div class="card hoy k-${st.k}" id="hoy" data-dk="${esc(st.dk)}">
    ${lightBannerHtml('hoy')}
    <div class="hoy-k">${kick}</div>
    <div class="hoy-t"><span class="pill ${pc}">${esc(info.label)}</span><span class="hoy-nm">${esc(info.name)}</span>${live?`<span class="pill ${pc} hoy-sets" role="img" aria-label="${cnt[0]} de ${plural(cnt[1],cnt[2])} ${cnt[2]==='serie'?(cnt[1]===1?'hecha':'hechas'):(cnt[1]===1?'hecho':'hechos')}" title="${cnt[2]==='serie'?'Series hechas':'Ejercicios hechos'}">${cnt[0]}/${plural(cnt[1],cnt[2])}</span>`:''}</div>
    ${live?'':`<div class="hoy-m">${meta}</div>`}
    ${head}
    ${ak?`<div class="hoy-pv" id="hoy-pv" data-ex="${esc(pv.id)}" data-gym-anim="${esc(ak)}"></div>`:''}
    ${cta}
    ${info.ex.length?`<div class="hoy-l" role="group" aria-label="Ejercicios de ${esc(info.label)}">
      ${info.str.length?`<div class="hoy-lh"><span>${live?'Tu entreno de hoy':anyP?(anyNk?'Objetivos de hoy':'Pesos objetivo de hoy'):'Tus ejercicios de hoy'}</span>${ak?'<small>toca uno para ver su técnica</small>':''}</div>${rows}`:''}
      ${_hoyCarHtml(info,live)}</div>`:`<div class="hoy-note">Este día no tiene ejercicios: añádelos en Ajustes → Editar rutina.</div>`}
    ${foot}${live?'':_hoyEmptyDaysHtml()}
  </div>`;
}
// Ya entrenaste hoy: lo de hoy (duración, series, tonelaje y récords → su resumen) y la próxima, con sus objetivos
function _hoyDoneHtml(st){
  // (E1b) el nombre y el foco con que se hizo la sesión (no los del día de esa letra ahora)
  const s=st.s,lbl=sessDayLbl(s),snm=sessDayFocus(s).trim().split(/\s+[—–]\s+/)[0].trim();
  const D=sessSummaryData(s),npr=D.records.length,dur=_okDur(s)?Math.round(+s.durationMin):null;
  const kp=(l,v,u)=>`<div class="sum-k"><b>${v}</b>${u?`<span>${u}</span>`:''}<small>${l}</small></div>`;
  const nk=st.dk,ni=_dayLive(getPlan()[nk])?hoyDayInfo(nk):null; // (E1b) la próxima, solo si tiene ejercicios
  const nmeta=ni?[ni.mus?esc(ni.mus):'',_hoyDurHtml(hoyDuration(nk),nk),_hoyCount(ni)].filter(Boolean).join(' · '):'';
  return`<div class="card hoy k-done" id="hoy" data-dk="${esc(nk)}">
    ${lightBannerHtml('hoy')}
    <div class="hoy-k">Hecho hoy ✓</div>
    <div class="hoy-t"><span class="pill p${esc(String(s.day).toLowerCase())}">${esc(lbl)}</span><span class="hoy-nm">${esc(snm)}</span></div>
    <div class="hoy-kpis">${kp('Duración',dur==null?'—':dur,dur==null?'':'min')}${kp('Series',D.sets,'')}${D.kgSets||!D.sets?kp('Tonelaje',_kgK(D.ton),'kg'):kp('Tonelaje','—','')}</div>
    <button class="hoy-sum" data-ts="${+s.ts}" onclick="openSessionSummary(+this.dataset.ts)"><span>Ver el resumen de hoy</span>${npr?`<small>${ic('trophy')} ${plural(npr,'récord')}</small>`:''}<span aria-hidden="true">›</span></button>
    ${ni?`<div class="hoy-nx">
      <div class="hoy-k">Próxima sesión</div>
      <div class="hoy-t"><span class="pill p${esc(String(nk).toLowerCase())}">${esc(ni.label)}</span><span class="hoy-nm">${esc(ni.name)}</span></div>
      <div class="hoy-m">${nmeta}</div>
      ${dayTargetsHtml(nk,'dash')}
      <button class="btn bs" data-dk="${esc(nk)}" onclick="hoyStart(this.dataset.dk)">Adelantar ${esc(ni.label)} →</button>
    </div>`:''}
    ${_hoyEmptyDaysHtml()}
  </div>`;
}
// Semana de descanso: un único mensaje (antes salía tres veces en Inicio)
function _hoyRestHtml(st){
  const left=restDaysLeft(st.rest),wk=getWeekSessions(),info=_dayLive(getPlan()[st.dk])?hoyDayInfo(st.dk):null; // (E1b) nunca un día vacío
  return`<div class="card hoy k-rest" id="hoy" data-dk="${esc(st.dk)}">
    ${lightBannerHtml('hoy')}
    <div class="hoy-rest-h"><span class="hoy-rest-ic" aria-hidden="true">${ic('moon')}</span><div class="hoy-rest-b">
      <div class="hoy-k">Semana de descanso</div>
      <div class="hoy-t"><span class="hoy-nm">Hoy toca recuperar</span></div>
      <div class="hoy-m">${left>0?`Quedan <span class="nw">${plural(left,'día')}</span>`:'Termina hoy'} · el Coach no penaliza tu constancia</div>
    </div></div>
    <p class="hoy-rest-p">El descanso es parte del progreso: recuperas fuerza. Dormir bien también cuenta.${wk>0?` Aun así llevas ${plural(wk,'sesión','sesiones')} esta semana.`:''}</p>
    <button class="btn bs" onclick="endRestWeek()">Terminar descanso y volver a entrenar</button>
    ${info?`<button class="hoy-soft" data-dk="${esc(st.dk)}" onclick="hoyStart(this.dataset.dk)">Entrenar suave igualmente · ${esc(info.label)} ›</button>`:''}
  </div>`;
}
function hoyStart(dk){if(!getPlan()[dk])dk=hoyDayKey();S.day=dk;go('workout');}
// Tocar un ejercicio de la lista: la vista previa cambia en su sitio (mismo canvas), sin repintar la pantalla
function hoyPick(id){
  const root=document.getElementById('hoy');if(!root)return;
  const dk=root.dataset.dk,info=hoyDayInfo(dk),ex=info&&info.ex.find(e=>String(e.id)===String(id));
  const ak=ex?exAnimKey(ex):'';if(!ak)return;
  _hoyPick={dk,id:String(ex.id)};
  const el=document.getElementById('hoy-pv');
  if(!el||typeof GymAnim==='undefined'||!GymAnim.swap){render();return;}
  const prev=el.getAttribute('data-gym-anim');
  if(!GymAnim.swap(el,ak))return;
  el.dataset.ex=String(ex.id);
  if(prev!==ak&&!_rm()){el.classList.remove('hoy-sw');void el.offsetWidth;el.classList.add('hoy-sw');} // (clase propia: «.sw» es el interruptor de Ajustes)
  root.querySelectorAll('.hoy-ex').forEach(b=>{const on=b.dataset.ex===String(ex.id);b.classList.toggle('on',on);b.setAttribute('aria-pressed',on?'true':'false');});
  haptic(8);
}
// Repintados: la vista previa montada se saca antes y se vuelve a poner después (mismo canvas; si el ejercicio de la
// nueva tarjeta es otro, se cambia con GymAnim.swap). Fuera de Inicio se conserva para cuando vuelvas.
function hoyDetach(root){const el=root&&root.querySelector('#hoy-pv');if(el&&el._ga)_hoyKeep=el;}
function hoyAttach(root){
  const ph=root&&root.querySelector('#hoy-pv'),k=_hoyKeep;
  if(!ph||!k||k===ph||typeof GymAnim==='undefined'||!GymAnim.swap)return;
  const key=ph.getAttribute('data-gym-anim');
  if(k.getAttribute('data-gym-anim')!==key&&!GymAnim.swap(k,key)){_hoyKeep=null;return;}
  k.className=ph.className;k.dataset.ex=ph.dataset.ex||'';
  ph.replaceWith(k);
}
// Con una hoja encima (fondo negro al 80 % y desenfocado, o el descanso a pantalla completa) las animaciones 3D de la
// pantalla (la vista previa de «HOY TOCA», las de Entreno) se paran: se apartan con un transform, sin mover nada más, y
// el IntersectionObserver del motor las da por no visibles (se queda su último fotograma). Antes seguían comiéndose el
// hilo principal (60-97 % en un móvil) y dejaban sin tiempo libre a las miniaturas del selector y a la carga de su caché.
const _SHEET_ROOTS=['cmodal-root','settings-root','wmodal-root','hist-root','wdetail-root','mmap-root','summary-root','restfull-root','mat-root'];
function _sheetOpen(){return _SHEET_ROOTS.some(id=>{const r=document.getElementById(id);return!!(r&&r.firstElementChild);});}
function animHoldSync(){
  const sc=document.getElementById('screen');if(!sc)return;const on=_sheetOpen();
  sc.querySelectorAll('[data-gym-anim]').forEach(el=>{
    if(on===(el.dataset.held==='1'))return;
    if(on){el.dataset.held='1';el.style.transform='translateY(-300vh)';}else{delete el.dataset.held;el.style.transform='';}});
}
(function(){
  if(typeof MutationObserver!=='function')return;let q=0;
  const mo=new MutationObserver(()=>{if(!q){q=1;Promise.resolve().then(()=>{q=0;animHoldSync();});}});
  _SHEET_ROOTS.forEach(id=>{const r=document.getElementById(id);if(r)mo.observe(r,{childList:true});});
})();

// Saludo de Inicio según la hora: «tardes» hasta las 21:00, como se dice en España
function dashGreet(hr){return hr>=5&&hr<12?'Buenos días':hr>=12&&hr<21?'Buenas tardes':'Buenas noches';}
function renderDash(){
  const wk=getWeekSessions(),tot=S.sessions.length,target=getWeeklyTarget();
  const nowTs0=Date.now(),trainedToday=S.sessions.some(s=>s&&s.ts&&sameDayTs(s.ts,nowTs0));
  // (10) Saludo según la hora (antes rotaba con el nº de sesiones); después de entrenar, «¡Buen trabajo hoy! 💪»
  const now0=new Date(nowTs0),hr=now0.getHours();
  const greet=trainedToday?'¡Buen trabajo hoy!':dashGreet(hr);
  const greetHtml=greet; // sin emoji
  const today0=`${HOY_WD[now0.getDay()]} ${now0.getDate()} ${MONTHS[now0.getMonth()]}`;
  const rest0=getActiveRest();
  // (14e) los primeros días del mes, la oferta del resumen va en el sitio de la fecha (a la vista sin desplazar)
  const offer0=wrapOfferHtml(`${DL_WD[now0.getDay()]} ${now0.getDate()}`);
  return`
  <div class="topbar"><div class="topbar-row"><div class="dash-hd"><h1>${greetHtml}</h1>${offer0||`<div class="sub sepw"><span class="sepw-a" style="white-space:nowrap">${today0}</span> <span class="sepw-s" style="white-space:nowrap"><i class="sep">· </i>${tot===0?'tu primera sesión':`${tot} ${tot===1?'sesión':'sesiones'}`}</span></div>`}</div>
  <div style="display:flex;gap:8px;align-items:center">
    <button class="icon-btn" onclick="S.wmodal=true;renderWmodal()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Peso</button>
    <button class="settings-btn" aria-label="Ajustes" onclick="openSettings()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>
  </div>
  </div></div>
  ${healthWarnHtml()}${S.profile&&S.profile.nr&&!liveDayKeys().length?noRoutineCardHtml():hoyCardHtml()}
  ${_twoPlaces()&&otherPlaceDays().length&&!getActiveWorkout()&&!(S.profile&&S.profile.nr&&!liveDayKeys().length)?'<button type="button" class="ob-link ob-other" onclick="otherPlaceSheet()">¿Hoy en otro sitio? ›</button>':''}
  ${balanceCardHtml()}
  ${dashNoticesHtml()}
  ${rest0?'':`<div class="sh">Esta semana</div>
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px">
      <span style="font-size:15px;font-weight:600;min-width:0">${Math.min(wk,target)} de <span class="nw">${plural(target,'sesión','sesiones')}</span>${wk>target?` <span style="white-space:nowrap">· +${wk-target} extra</span>`:''}</span>
      <span style="font-size:13px;font-weight:500;white-space:nowrap;flex-shrink:0;color:${wk>=target?'var(--green)':wk>0?'var(--amber)':'var(--text2)'}">${wk>=target?'¡Semana completa!':wk>0?(target-wk===1?'Una más':`${target-wk} más`):'Sin sesiones aún'}</span>
    </div>
    <div class="pbar"><div class="pinner" style="width:${Math.min(100,Math.round(wk/target*100))}%"></div></div>
    <div class="wgrid" role="group" aria-label="Días de esta semana">${weekGrid()}</div>
    <div style="display:flex;gap:12px;margin-top:9px;font-size:11px;color:var(--text3)"><span style="color:var(--green)">■ Entrenado</span><span style="border:1px solid var(--green);color:var(--green);padding:0 3px">■</span><span>Hoy</span></div>${weekLineHtml()}
  </div>`}
  <div class="sh" id="dash-w">Peso corporal</div>
  ${renderWeightCard('Registra tu peso en cada sesión para ver la evolución aquí.')}
  ${(()=>{
    if(rest0)return''; // (10) en semana de descanso lo dice la tarjeta de arriba (antes se repetía aquí)
    const w=coach_weeklyInsight();
    if(!w)return''; // función nunca debería devolver null ahora, pero por seguridad
    return`<div class="week-card">
      <div class="week-card-h">
        <div class="week-card-t">${ic('trend')} ${w.title}</div>
        <span class="week-card-tag">${icSin(w.tag)}</span>
      </div>
      <div class="week-card-d">${w.description}</div>
      <div class="week-stats">
        ${w.stats.map(s=>{
          const cls=s.d>0?'up':s.d<0?'dn':'';
          const arrow=s.d>0?'↑':s.d<0?'↓':'';
          return`<div class="week-stat">
            <div class="week-stat-v ${cls}">${s.v}${s.unit}</div>
            <div class="week-stat-l">${s.l}${arrow?' '+arrow:''}</div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  })()}
  ${S.sessions.length>0?(()=>{
    const lastTs=S.sessions[S.sessions.length-1].ts;
    const canReopen=!getActiveWorkout(); // no ofrecer reabrir si ya hay un entreno en curso
    // (09) Cada fila abre el resumen de esa sesión (contadores, récords, ejercicios, esfuerzo y mapa muscular)
    const prs=prBySession();
    return`<div class="sh">Últimas sesiones</div><div class="card">${S.sessions.slice(-4).reverse().map(s=>{
    const lbl=sessDayLbl(s),focus=sessDayFocus(s); // (E1b) los de esa sesión
    const dur=s.durationMin?` · ${s.durationMin}min`:'';
    const isLast=s.ts===lastTs,npr=prs[s.ts]||0;
    return`<div class="sess-row" role="button" tabindex="0" data-ts="${+s.ts}" onclick="openSessionSummary(+this.dataset.ts)" onkeydown="if(event.target===this&&(event.key==='Enter'||event.key===' ')){event.preventDefault();openSessionSummary(+this.dataset.ts)}" aria-label="${esc(lbl)}, ${esc(s.date||'')}${npr?`, ${npr===1?'1 récord':npr+' récords'}`:''}. Ver el resumen de la sesión">
      <div class="sess-top">
        <span class="pill p${esc(String(s.day).toLowerCase())}" style="font-size:12px;padding:3px 9px">${esc(lbl)}</span>
        <span class="sess-f">${esc(focus)}</span>
        ${npr?`<span class="sess-pr" aria-hidden="true">${ic('trophy')} ${npr}</span>`:''}
        <span style="font-size:13px;color:var(--text3);font-family:'DM Sans',sans-serif;white-space:nowrap">${esc(s.date||'')}${dur}</span>
        <span class="sess-go" aria-hidden="true">›</span>
      </div>
      ${s.note?`<div style="font-size:13px;color:var(--text2);margin-top:6px;padding:6px 10px;background:color-mix(in srgb,var(--text) 3%,transparent);border-radius:6px;border-left:2px solid var(--border2);line-height:1.5;font-style:italic">«${esc(s.note)}»</div>`:''}
      ${isLast&&canReopen&&sessDayKey(s)&&sessOfRoutine(s)?`<button type="button" class="hist-btn sess-reopen" onclick="event.stopPropagation();reopenSession(${s.ts})">${s.totalEx&&s.doneEx<s.totalEx?'↩ Reabrir para terminar':'↩ Reabrir para corregir'}</button>`:''}
    </div>`;
  }).join('')}</div>`;
  })():''}
  `;
}

// Inicio: acceso compacto a las propuestas del Coach (se deciden en el Coach).
// (10) El aviso de descarga activa va ahora dentro de la tarjeta «HOY TOCA» (hoyCardHtml).
function dashCoachParts(){
  let deload='',props='';
  // (13d) Semana de descarga recomendada: se elige y empieza en el Coach
  const rec=(S.sessions||[]).length>=CYCLE_MIN_SESSIONS?coach_deloadReco():null;
  if(rec)deload=`<button class="coach-entry dlr-entry" onclick="goDeloadReco()">
      <span class="coach-entry-ic" aria-hidden="true">${ic('leaf')}</span>
      <span class="coach-entry-t">Te toca una semana de descarga<small>${_nwUnits(esc(rec.tag))} · elige el plan en el Coach</small></span>
      <span class="coach-entry-go">Ver ›</span></button>`;
  if((S.pendingCoachProposals||[]).length&&(S.sessions||[]).length>=CYCLE_MIN_SESSIONS){
    // (13e) la semana de descarga del ciclo ya sale arriba (una sola oferta) o está en espera tras «Ahora no»
    const dlOff=!!rec||_dlSnoozedOffer();
    const n=coach_pendingView().active.filter(p=>!(dlOff&&p.type==='deload')).length;
    if(n)props=`<button class="coach-entry" onclick="goCoachProposals()">
      <span class="coach-entry-ic" aria-hidden="true">${ic('bulb')}</span>
      <span class="coach-entry-t">El Coach tiene ${n} propuesta${n!==1?'s':''} para tu rutina<small>Tú decides: aplicar o ignorar</small></span>
      <span class="coach-entry-go">Ver ›</span></button>`;
  }
  return{deload,props};
}
// ── Inicio: los avisos, de uno en uno ──
// Bajo «Hoy toca» se ve UN aviso; los demás esperan detrás de «N avisos más» (un toque los enseña todos). El orden:
//  1) fijos, siempre delante: «Si algo duele, para» (una vez, hasta «Entendido») y la copia de seguridad cuando urge (nunca has
//     guardado una, o la última tiene BK_DAYS días o más);
//  2) el resto —tu rutina por montar, la descarga recomendada, las propuestas del Coach, el repaso anual, la copia que aún no
//     urge y el peso de hoy— se turna: cada día empieza por el siguiente, así que ninguno espera más días que avisos hay.
// (El equilibrio de hoy no es un aviso: es parte del plan del día y va siempre a la vista, encima.)
let _dashMore=false; // «N avisos más» abierto (solo en memoria)
// L: [{k, pin}] en orden de prioridad → las claves en el orden en que se enseñan el día «day» (función pura)
function dashNoticeOrder(L,day){
  const pin=L.filter(x=>x.pin),rest=L.filter(x=>!x.pin),n=rest.length,k=n?((Math.trunc(day)%n)+n)%n:0;
  return pin.concat(rest.slice(k),rest.slice(0,k)).map(x=>x.k);
}
// Número de día local (cambia a medianoche): el turno de los avisos
function _dashDay(){const n=Date.now();return Math.floor((_startOfDay(n)-new Date(n).getTimezoneOffset()*60000)/DAY_MS);}
function dashNotices(){
  const bk=backupReminder(),urge=!!bk&&(bk.never||bk.days>=BK_DAYS),c=dashCoachParts();
  const H={safety:safetyCardHtml(),backup:backupReminderHtml(),own:ownCardHtml(),deload:c.deload,props:c.props,repaso:repasoCardHtml(),weight:weightTodayCardHtml()};
  const L=[['safety',1],urge&&['backup',1],['own'],['deload'],['props'],['repaso'],!urge&&['backup'],['weight']].filter(x=>x&&H[x[0]]).map(x=>({k:x[0],pin:!!x[1]}));
  return{H,L,order:dashNoticeOrder(L,_dashDay())};
}
function dashNoticesHtml(){
  const o=dashNotices(),n=o.order.length-1;if(n<0)return'';
  return`<div class="dash-nt" id="dash-nt">${(_dashMore?o.order:o.order.slice(0,1)).map(k=>o.H[k]).join('')}${n?`<button type="button" class="dash-more" id="dash-more" aria-expanded="${_dashMore}" onclick="dashMoreToggle()">${_dashMore?'Ver solo el primero':plural(n,'aviso','avisos')+' más'} <span aria-hidden="true">${_dashMore?'▴':'▾'}</span></button>`:''}</div>`;
}
function dashMoreToggle(){_dashMore=!_dashMore;render();const b=document.getElementById('dash-more');if(b)try{b.focus({preventScroll:true});}catch(e){}}

function renderWmodal(){
  const root=document.getElementById('wmodal-root');
  if(!root)return;
  if(!S.wmodal){root.innerHTML='';return;}
  const lw=S.weights.length?S.weights[S.weights.length-1]:null;
  root.innerHTML=`<div class="mover" onclick="if(event.target===this){S.wmodal=false;S.wnew='';renderWmodal()}"><div class="modal">
    <div class="modal-hdl"></div>
    <h3>Registrar peso corporal</h3>
    <input class="ob-inp" id="wmodal-input" type="number" placeholder="${lw?lw.v:'105'}" value="${S.wnew||''}" oninput="S.wnew=this.value" step="0.1" inputmode="decimal" onkeydown="if(event.key==='Enter')logW()"/>
    <p style="font-size:13px;color:var(--text3);text-align:center;margin:8px 0 14px">Pésate siempre en las mismas condiciones (mañana, en ayunas)</p>
    <div style="display:flex;gap:8px"><button class="btn bp" style="flex:1" onclick="logW()">Guardar</button><button class="btn bs" style="width:90px" onclick="S.wmodal=false;S.wnew='';renderWmodal()">Cancelar</button></div>
  </div></div>`;
  // Focus diferido: iOS a veces ignora autofocus en elementos insertados dinámicamente
  setTimeout(()=>{const i=document.getElementById('wmodal-input');if(i){i.focus();i.select&&i.select();}},60);
}

// ─── HISTORIAL Y SUGERENCIA DE PESO ─────────────────────────

function getLastW(exId){
  const d=S.strength[exId];
  return d&&d.length>0?d[d.length-1]:null;
}

