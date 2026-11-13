// ══════════════════════════════════════════════════════════
// (E3c) «MI MATERIAL»: el tipo de sitio y el material de tu gimnasio y de tu casa (P5 + P6 del cuestionario), para todo el
// mundo, desde Ajustes y desde el buscador. Se edita una copia (borrador) y se guarda con «Guardar»; ✕, fuera o Escape la
// descartan. La rejilla (matGridHtml) es la misma que usa el cuestionario.
// ══════════════════════════════════════════════════════════
const PRESET_INFO={grande:{ic:'building',t:'Gimnasio grande',d:'De cadena: máquinas, poleas, barras y mancuernas de sobra.'},
  barrio:{ic:'store',t:'Gimnasio pequeño o de barrio',d:'Pesos libres, poleas y algunas máquinas.'},
  hotel:{ic:'bed',t:'Gimnasio de hotel o de comunidad',d:'Mancuernas ligeras, una polea y alguna máquina.'},
  box:{ic:'kettlebell',t:'Box o gimnasio funcional',d:'Barras, kettlebells, anillas, cajones y cuerdas.'},
  nada:{ic:'person',t:'Sin material',d:'Tu cuerpo y cosas de casa: silla, pared, mesa, puerta, escalón.'},
  basico:{ic:'dumbbell',t:'Lo básico',d:'Mancuernas y bandas elásticas.'},mancbanco:{ic:'bench',t:'Mancuernas y banco',d:'Mancuernas ajustables y un banco.'},
  casagym:{ic:'rack',t:'Gimnasio en casa',d:'Rack, barra, discos, banco y mancuernas.'},parque:{ic:'tree',t:'Parque de calistenia',d:'Barras de dominadas, paralelas y bancos.'},
  propio:{ic:'pencil',t:'Otra cosa',d:'Lo marco yo.'}};
const PRESETS_OF={g:['grande','barrio','hotel','box'],c:['nada','basico','mancbanco','casagym','parque','propio']};
// (E15b) Nombre de un sitio: el de su tipo y, si has marcado material que el tipo no trae, «+ ese material» o «+ N materiales»
// (al marcar en la rejilla el tipo no cambia: «Sin material» con una mochila es «Sin material + mochila»)
function _placeLbl(P){
  const I=PRESET_INFO[P&&P.preset]||PRESET_INFO.propio,T=typeof LIB_K!=='undefined'&&LIB_K&&P&&LIB_K.PRESETS[P.preset];if(!T)return I.t;
  const base=Array.isArray(T.mats)?T.mats:[],ex=(P.mats||[]).filter(m=>MAT[m]&&!base.includes(m));
  return ex.length?I.t+' + '+(ex.length===1?MAT[ex[0]].l.split(',')[0].toLowerCase():plural(ex.length,'material','materiales')):I.t;
}
// Cosas de la rejilla: m material (MAT) · a accesorio · f familia de máquina · c tipo de cardio. d: la línea que explica lo que no es obvio
const MAT_SECTIONS=[
  {k:'libres',t:'Pesas libres',items:[{m:'mancuernas'},{m:'barra',l:'Barra y discos'},{m:'barraz',d:'Barra corta con curvas, para curl y tríceps'},{m:'kettlebell',l:'Kettlebells'},{m:'disco',l:'Discos sueltos'},{m:'balon'}]},
  {k:'bancos',t:'Bancos y soportes',items:[{a:'banco',l:'Banco'},{a:'banco_inc',l:'Banco que se inclina'},{a:'rack',l:'Rack o soportes'},{a:'landmine',l:'Landmine',d:'Barra con un extremo anclado al suelo'},
    {m:'dominadas'},{a:'paralelas',l:'Paralelas para fondos'},{a:'hexbar',l:'Barra hexagonal'},{a:'banco_dec',l:'Banco declinable'},{a:'scott',l:'Banco Scott'},
    {a:'ghd',l:'GHD'},{a:'hiper',l:'Banco de hiperextensiones'}]},
  {k:'bandas',t:'Bandas y accesorios',items:[{m:'banda',l:'Bandas elásticas'},{a:'anclaje',l:'Anclaje de puerta',d:'Una pieza en la puerta para enganchar la banda'},{m:'minibanda'},
    {m:'trx',d:'Cintas o anillas para colgar de una puerta o un soporte'},{a:'anillas',l:'Anillas'},{m:'fitball',d:'Pelota grande de ejercicio'},{m:'rueda'},{m:'comba'},{m:'step'},{m:'otro',l:'Otro material'}]},
  {k:'casa',t:'Cosas de casa',home:1,items:[{a:'silla',l:'Silla o banco bajo'},{a:'pared',l:'Pared'},{a:'mesa',l:'Mesa firme',d:'Para el remo bajo una mesa'},
    {a:'puerta',l:'Puerta que cierra bien',d:'Para el remo con toalla'},{a:'escalon',l:'Escalón'},
    {m:'mochila',d:'Para hacer con peso sentadilla, peso muerto, press y curl'}]},
  {k:'poleas',t:'Poleas y Smith',gym:1,items:[{m:'polea'},{a:'poleas2',l:'Dos poleas enfrentadas'},{m:'smith',d:'Barra guiada en raíles (multipower)'}]},
  {k:'maq',t:'Máquinas',gym:1,items:MACH_FAMS.map(f=>({f}))},
  {k:'cardio',t:'Cardio',gym:1,items:CARD_KINDS.map(c=>({c}))},
  {k:'box',t:'Box',gym:1,items:[{a:'trineo',l:'Trineo'},{a:'cuerdas',l:'Cuerdas de batida'},{a:'llanta',l:'Llanta'},{a:'saco',l:'Saco de boxeo'},{a:'kb2',l:'Dos kettlebells iguales'}]}];
const _matItemKey=it=>it.m?'m:'+it.m:it.a?'a:'+it.a:it.f?'f:'+it.f:'c:'+it.c;
function _matItemLbl(it){const cap=t=>t[0].toUpperCase()+t.slice(1);return it.l||(it.m?MAT[it.m].l:it.f?cap(MACH_FAM_LBL[it.f]):it.c?cap(CARD_KIND_LBL[it.c]):cap(ACC_LBL[it.a]||it.a));}
function _matHas(P,it){
  if(it.m)return P.mats.includes(it.m);if(it.a)return(P.acc||[]).includes(it.a);
  if(it.f)return P.mats.includes('maquina')&&(P.mach==='all'||(P.mach||[]).includes(it.f));
  return P.mats.includes('cardio')&&(P.card==='all'||(P.card||[]).includes(it.c));
}
function _matSet(P,it,on){
  const tog=(a,x)=>on?[...new Set([...a,x])]:a.filter(y=>y!==x);
  if(it.m){P.mats=tog(P.mats,it.m);if(it.m==='maquina')P.mach=on?'all':[];if(it.m==='cardio')P.card=on?'all':[];
    if(it.m==='kettlebell'&&!on){P.kb=null;P.kbMax=null;P.acc=P.acc.filter(a=>a!=='kb2');}if(it.m==='mancuernas'&&!on)P.dbMax=null;return;}
  if(it.a){P.acc=tog(P.acc||[],it.a);if(it.a==='kb2')P.kb=on?2:(P.mats.includes('kettlebell')?1:null);return;}
  const fk=it.f?'mach':'card',L=it.f?MACH_FAMS:CARD_KINDS,mk=it.f?'maquina':'cardio',x=it.f||it.c;
  const cur=P.mats.includes(mk)?(P[fk]==='all'?L.slice():(P[fk]||[]).slice()):[];
  const nx=tog(cur,x);P[fk]=nx.length===L.length?'all':nx;P.mats=nx.length?[...new Set([...P.mats,mk])]:P.mats.filter(y=>y!==mk);
}
function _matCount(P,kind){return P?EXERCISE_DB.filter(e=>placeCan(e,P,kind)).length:0;}
// La rejilla de material de un sitio (también la del cuestionario): secciones, «+N» que desbloquea cada cosa (contados con
// placeCan), detalles al marcar (mancuernas hasta cuántos kg; kettlebells cuántas y de cuánto) y lo de gimnasio plegado en casa
function matGridHtml(P,kind,open){
  const n=_matCount(P,kind);
  const plus=it=>{if(_matHas(P,it))return'';const Q=JSON.parse(JSON.stringify(P));_matSet(Q,it,true);const d=_matCount(Q,kind)-n;return d>0?'+'+d:'';};
  const det=it=>{
    if(it.m==='mancuernas'&&_matHas(P,it))return _matSegHtml('Hasta cuántos kg cada una','dbMax',[[10,'Hasta 10'],[20,'Hasta 20'],[30,'Hasta 30'],[99,'Más'],[null,'No lo sé']],P.dbMax);
    if(it.m==='kettlebell'&&_matHas(P,it))return _matSegHtml('¿Cuántas?','kb',[[1,'Una'],[2,'Dos o más']],P.kb)+_matSegHtml('¿De cuántos kg la más pesada?','kbMax',[[8,'8'],[12,'12'],[16,'16'],[24,'24 o más'],[null,'No lo sé']],P.kbMax);
    return'';};
  const sec=S0=>{const fold=kind==='c'&&S0.gym&&!(open&&open[S0.k]),hide=kind==='g'&&S0.home;if(hide)return'';
    const items=S0.items.map(it=>{const on=_matHas(P,it),k=_matItemKey(it),p=plus(it);
      return`<button type="button" class="lib-kt mat-it" aria-pressed="${on}" data-k="${esc(k)}" onclick="matToggle(this.dataset.k)"><span class="lib-kt-n">${esc(_matItemLbl(it))}${it.d?`<small class="mat-d">${esc(it.d)}</small>`:''}${p?`<span class="lib-kt-c">${p}</span>`:''}</span></button>${det(it)}`;}).join('');
    return`<section class="mat-sec" aria-labelledby="mat-s-${S0.k}"><h3 class="mat-sh" id="mat-s-${S0.k}">${esc(S0.t)}</h3>${fold?`<button type="button" class="mat-more" onclick="matOpenSec('${S0.k}')">Mostrar ${esc(S0.t.toLowerCase())} de gimnasio ›</button>`:`<div class="lib-kit mat-kit">${items}</div>`}</section>`;};
  return`<div class="mat-grid"><div class="mat-body-ic">${ic('person')} Tu cuerpo siempre cuenta</div>${MAT_SECTIONS.map(sec).join('')}</div>`;
}
function _matSegHtml(t,f,opts,cur){
  return`<div class="mat-seg" role="radiogroup" aria-label="${esc(t)}"><span class="mat-seg-t">${esc(t)}</span><span class="mat-seg-b">${opts.map(([v,l])=>`<button type="button" role="radio" aria-checked="${cur===v}" class="mat-sb${cur===v?' on':''}" onclick="matDetail('${f}',${v===null?'null':v})">${esc(l)}</button>`).join('')}</span></div>`;
}
let _myMat=null; // {kind, draft:{v,main,g,c}, open:{sección:true}, choose:true (eligiendo tipo), opener, from}
function openMyMaterial(kind,o){
  o=o||{};const op=document.activeElement;
  const draft=_isPlainObj(S.places)?JSON.parse(JSON.stringify(S.places)):{v:1,main:kind==='c'?'c':routinePlace(),g:null,c:null};
  if(!draft.c&&Array.isArray(S.libKit)){const c=placeFromPreset('nada');if(c){c.mats=S.libKit.slice();c.preset='propio';draft.c=c;}} // (42 R12) lo que ya marcaste
  const k=kind==='c'||kind==='g'?kind:draft.main||'g';
  _myMat={kind:k,draft,open:{},choose:!draft[k],opener:op,from:o.from||'settings'};
  renderMyMaterial(true);
}
function closeMyMaterial(){
  const m=_myMat;_myMat=null;const r=document.getElementById('mat-root');if(r)r.innerHTML='';
  if(m&&m.opener&&m.opener.isConnected){try{m.opener.focus({preventScroll:true});}catch(e){}}
}
function renderMyMaterial(fresh){
  const r=document.getElementById('mat-root');if(!r||!_myMat)return;
  const m=_myMat,k=m.kind,P=m.draft[k],both=!!(m.draft.g&&m.draft.c),sc=r.querySelector('.hist-sheet'),keep=sc&&!fresh?sc.scrollTop:0;
  const seg=['g','c'].map(x=>`<button type="button" class="lib-pl" role="radio" aria-checked="${k===x}" onclick="matKind('${x}')">${ic(x==='g'?'dumbbell':'home')} ${x==='g'?'Gimnasio':'Casa o aire libre'}</button>`).join('');
  let body;
  if(m.choose||!P){
    body=`<p class="mat-q">${P?'¿Qué tipo de sitio es?':k==='g'?'¿Cómo es tu gimnasio?':'¿Qué tienes en casa o al aire libre?'}</p>
      ${P?'<p class="mat-warn">Cambiar de tipo vuelve a marcar lo típico de ese sitio.</p>':''}
      <div class="mat-presets" role="radiogroup" aria-label="Tipo de sitio">${PRESETS_OF[k].map(p=>{const I=PRESET_INFO[p],pl=p==='propio'?null:placeFromPreset(p);
        return`<button type="button" class="dlr-opt mat-pre" role="radio" aria-checked="${!!P&&P.preset===p}" onclick="matPreset('${p}')"><span class="mat-pre-ic" aria-hidden="true">${ic(I.ic)}</span><span class="mat-pre-i"><b>${esc(I.t)}</b><small>${esc(I.d)}</small></span>${pl?`<span class="mat-pre-n">${plural(_matCount(pl,k),'ejercicio')}</span>`:''}</button>`;}).join('')}</div>
      ${P?`<button type="button" class="btn bs mat-back" onclick="matChoose(false)">Mantener ${esc(PRESET_INFO[P.preset]?PRESET_INFO[P.preset].t:'mi material')}</button>`:''}`;
  }else{
    const n=_matCount(P,k),I=PRESET_INFO[P.preset]||PRESET_INFO.propio;
    body=`<div class="mat-type"><span>Tipo: <b>${esc(I.t)}</b></span><button type="button" class="mat-link" onclick="matChoose(true)">Cambiar ›</button></div>
      ${k==='g'?`<button type="button" class="mat-link mat-other" onclick="matOtherGym()">Es otro gimnasio</button>`:''}
      <div class="mat-n" aria-live="polite">Con esto: <b>${plural(n,'ejercicio')}</b></div>
      ${matGridHtml(P,k,m.open)}
      ${both?`<div class="mat-main"><button type="button" class="mat-link" onclick="matMain()" ${m.draft.main===k?'disabled':''}>${m.draft.main===k?'Es tu sitio principal':'Hacer de este mi sitio principal'}</button>
        ${m.draft.main!==k?`<button type="button" class="mat-link mat-rm" onclick="matRemove()">Quitar este sitio</button>`:''}</div>`:''}`;
  }
  r.innerHTML=`<div class="hist-over" onclick="if(event.target===this)closeMyMaterial()" style="z-index:520"><div class="hist-sheet" id="mat-sheet" role="dialog" aria-modal="true" aria-labelledby="mat-t" style="max-height:92vh;max-height:92dvh">
    <div class="hist-sheet-head"><div class="hist-sheet-hdl"></div><div class="hist-sheet-title" id="mat-t" tabindex="-1">Mi material</div>
      <div class="hist-sheet-sub">Solo te propongo ejercicios que puedas hacer con esto.</div>
      <button class="hist-sheet-close" onclick="closeMyMaterial()" aria-label="Cerrar">✕</button></div>
    <div class="hist-sheet-body mat-sbody"><div class="lib-place mat-kind" role="radiogroup" aria-label="Sitio">${seg}</div>${body}</div>
    <div class="mat-foot"><button type="button" class="btn bs" onclick="closeMyMaterial()">Cancelar</button><button type="button" class="btn bp" onclick="saveMyMaterial()"${m.draft.g||m.draft.c?'':' disabled'}>Guardar</button></div>
  </div></div>`;
  const sh=r.querySelector('.hist-sheet');if(sh&&keep)sh.scrollTop=keep;
  if(fresh){const t=document.getElementById('mat-t');if(t)try{t.focus({preventScroll:true});}catch(e){}}
}
function matKind(k){if(!_myMat||(k!=='g'&&k!=='c'))return;_myMat.kind=k;_myMat.choose=!_myMat.draft[k];renderMyMaterial(true);}
function matChoose(on){if(!_myMat)return;_myMat.choose=!!on;renderMyMaterial();}
function matPreset(p){
  if(!_myMat)return;const k=_myMat.kind,old=_myMat.draft[k],P=p==='propio'?(old?Object.assign(JSON.parse(JSON.stringify(old)),{preset:'propio'}):placeFromPreset('nada')):placeFromPreset(p);
  if(!P)return;if(p==='propio'&&!old)P.preset='propio';
  if(_myMat.otherGym&&k==='g'){P.recalTs=Date.now();_myMat.otherGym=false;}
  _myMat.draft[k]=P;if(!_myMat.draft.main||!_myMat.draft[_myMat.draft.main])_myMat.draft.main=k;_myMat.choose=false;renderMyMaterial();
}
function matOtherGym(){if(!_myMat)return;_myMat.otherGym=true;_myMat.choose=true;renderMyMaterial();}
function matToggle(key){
  const T=_matTgt();if(!T||!T.P)return;const P=T.P; // (E8b) también el sitio del cuestionario
  const [t,v]=String(key).split(':'),it=t==='m'?{m:v}:t==='a'?{a:v}:t==='f'?{f:v}:{c:v};
  if(t==='m'&&!MAT[v])return;
  _matSet(P,it,!_matHas(P,it));P.preset=P.preset||'propio';T.re();
  const b=document.querySelector(`${T.sel} .mat-it[data-k="${CSS.escape(key)}"]`);if(b)try{b.focus({preventScroll:true});}catch(e){}
}
function matDetail(f,v){
  const T=_matTgt();if(!T||!T.P)return;const P=T.P;
  if(f==='dbMax')P.dbMax=PLACE_DBMAX.includes(v)?v:null;
  else if(f==='kbMax')P.kbMax=PLACE_KBMAX.includes(v)?v:null;
  else if(f==='kb'){P.kb=PLACE_KB.includes(v)?v:null;P.acc=v===2?[...new Set([...(P.acc||[]),'kb2'])]:(P.acc||[]).filter(a=>a!=='kb2');}
  T.re();
}
function matOpenSec(k){const T=_matTgt();if(!T)return;T.open[k]=true;T.re();}
function matMain(){if(!_myMat||!_myMat.draft[_myMat.kind])return;_myMat.draft.main=_myMat.kind;renderMyMaterial();}
function matRemove(){if(!_myMat||_myMat.draft.main===_myMat.kind)return;_myMat.draft[_myMat.kind]=null;_myMat.choose=true;renderMyMaterial();}
function saveMyMaterial(){
  if(!_myMat)return;const d=_sanitizePlaces(_myMat.draft);if(!d){toast('Elige al menos un sitio');return;}
  S.places=d;_syncLibKit();saveState();
  closeMyMaterial();toast('Guardado: tu material');
  if(S.profile&&S.profile.mode==='gen'&&typeof myMatAdapt==='function')setTimeout(myMatAdapt,0); // (E11b)
  if(_pickerState){_pickerState.ctx=_libCtx();_pickerRefresh(true);}
  render();
}
// Resumen de una línea para Ajustes: «Gimnasio grande · Casa: Lo básico» (o «Dime dónde entrenas»)
function placesSummaryTxt(){
  const p=S.places;if(!_isPlainObj(p))return'Dime dónde entrenas';
  const t=x=>p[x]?(PRESET_INFO[p[x].preset]||PRESET_INFO.propio).t:'';
  const a=[p.main==='g'?t('g'):t('c'),p.main==='g'?(p.c?'Casa: '+t('c'):''):(p.g?'Gimnasio: '+t('g'):'')].filter(Boolean);
  return a.join(' · ');
}
// ── PICKER DE EJERCICIOS ──
// Una sola cabecera fija (título, búsqueda, «Gimnasio | Casa», zonas y contador) y debajo la lista: al abrir, el inicio
// (recientes, favoritos, las zonas con su número y lo de tu rutina); con una zona, sus ejercicios por familias de
// movimiento (con tiras de subzona y de material); al escribir, de más a menos parecidos y al final los que no puedes
// hacer aquí. Cada fila lleva su miniatura 3D o, si no tiene, una figura con sus músculos teñidos y su emoji. La búsqueda
// no distingue tildes ni mayúsculas y entiende sinónimos (libQuery). Al escribir solo se repinta la lista: el input no se
// recrea (no pierde el foco ni parpadea el teclado en iOS). La lista se pinta a trozos de 40 filas según bajas. Tocar una
// fila abre su ficha (animación 3D en vivo, consejo, músculos, tu historial y «Añadir» / «Cambiar»).
let _pickerState=null,_libDetail=null,_libKitOpen=null;
const LIB_EQ=[{id:'all',label:'Todo el equipo'},{id:'maquina',label:'Máquina'},{id:'mancuernas',label:'Mancuernas'},{id:'cable',label:'Cable'},{id:'smith',label:'Smith'},{id:'corporal',label:'Peso corporal'}];
// Equipo de un ejercicio para los chips, por su material: cable = polea, peso corporal = sin material o barra de
// dominadas; el resto (barra, kettlebell, bandas…) es su propio material y sale con «Todo el equipo»
function libEqClass(e){if(!e)return'maquina';if(e.cardio)return'cardio';const m=e.mat;
  return m==='polea'?'cable':m==='corporal'||m==='dominadas'?'corporal':m==='maquina'||m==='mancuernas'||m==='smith'?m:m||'otro';}
// Abre el selector. add / pick: en el inicio (o en la zona y subzona que se pidan, p. ej. desde el maniquí) · swap: en la
// zona y subzona del actual, que sale primero · busy («¿Máquina ocupada?» → toda la biblioteca): donde entrenas según tu
// rutina, solo los del mismo tipo (fuerza o cardio) y sin el original, en su zona y subzona, con «Parecidos» primero
// (las alternativas que la hoja aún no te enseñó, busy.seen, de más a menos parecidas). refocus: dónde volver a poner el foco
// tras elegir si onPick repinta (y se lleva) el botón que lo abrió
function showExercisePicker({title,muscle,sub,onPick,currentLib,mode,dayKey,busy,refocus,ctx,place}){ // (E16b) ctx y place: los del cuestionario
  closeLibDetail();_pickerStop();
  mode=['add','swap','busy'].includes(mode)?mode:'pick';
  const st={title,muscle,onPick,currentLib:currentLib||null,mode,dayKey:dayKey||null,busy:busy||null,search:'',filterMuscle:null,filterSub:null,
    mat:'all',more:{},tail:false,ctx:Object.assign(_libCtx(),_isPlainObj(ctx)?ctx:{}),gen:0,count:0,opener:document.activeElement,refocus:typeof refocus==='function'?refocus:null};
  if(place==='g'||place==='c')st.place=place;
  const L=st.currentLib?LIB_BY_ID.get(st.currentLib):null,zone=z=>MUSCLE_GROUPS.some(m=>m.id===z)?z:null;
  if(mode==='busy'&&st.busy){
    const d=getPlan()[st.busy.dk],sl=d&&Array.isArray(d.ex)?d.ex.find(e=>e&&e.id===st.busy.exId):null,o=routineEx(sl);
    const seen=new Set(Array.isArray(st.busy.seen)?st.busy.seen:[]),alts=o?busyAlternatives(o,8,st.busy.dk).filter(a=>!seen.has(a.lib.id)):[];
    Object.assign(st,{place:placeOfDay(st.busy.dk)||routinePlace(),cardio:!!(o&&o.cardio),excl:st.currentLib,pct:{},station:L?_stationOf(L.eq,L):'',
      pin:[...alts.filter(a=>!a.lm),...alts.filter(a=>a.lm)].slice(0,5).sort((a,b)=>b.pct-a.pct).map(a=>a.lib.id)});
    alts.forEach(a=>{st.pct[a.lib.id]=a.pct;});
    st.filterMuscle=L?_grp(L):o&&o.cardio?'cardio':zone(muscle)||'all';
  }else st.filterMuscle=mode==='swap'&&L?_grp(L):zone(muscle);
  if(L&&mode!=='add'&&st.filterMuscle===_grp(L))st.filterSub=_libTopSub(L);
  else if(SUB_BY_ID[sub]&&SUB_BY_ID[sub].z===st.filterMuscle)st.filterSub=sub;
  _pickerState=st;
  renderExercisePicker();
  // el foco entra en la hoja (no en la búsqueda: en el móvil no salta el teclado); al cerrar vuelve a st.opener
  const sh=document.getElementById('lib-sheet');if(sh){try{sh.focus({preventScroll:true});}catch(e){}}
}
// ── Datos del selector: zonas (los 8 grupos), subzonas por músculo y familias por patrón ──
// Subzonas de cada zona: id (único), nombre y sus músculos. Un ejercicio es de una subzona si trabaja alguno de ellos a
// ≥ 50 % (_subW); sale entre los principales si llega al 90 % o si su músculo más trabajado es de ella, y si no, debajo,
// en «También trabajan…».
const ZONE_SUBS={
  piernas:[{id:'cuads',l:'Cuádriceps',mus:['quads']},{id:'isquios',l:'Isquios · femoral',mus:['hams']},{id:'gluteos',l:'Glúteos',mus:['glutes','abductors']},
    {id:'gemelos',l:'Gemelos · pantorrilla',mus:['calves']},{id:'aductores',l:'Aductores',mus:['adductors']}],
  espalda:[{id:'lats',l:'Dorsales',mus:['lats']},{id:'midback',l:'Espalda media',mus:['midback']},{id:'traps',l:'Trapecio',mus:['traps']},{id:'lowback',l:'Lumbares',mus:['lowback']}],
  hombros:[{id:'front',l:'Deltoides anterior',mus:['frontdelts']},{id:'side',l:'Deltoides lateral',mus:['sidedelts']},{id:'rear',l:'Deltoides posterior',mus:['reardelts']}],
  core:[{id:'abs',l:'Abdomen',mus:['abs']},{id:'obliques',l:'Oblicuos',mus:['obliques']}]};
const SUB_BY_ID={};Object.keys(ZONE_SUBS).forEach(z=>ZONE_SUBS[z].forEach(s=>{s.z=z;SUB_BY_ID[s.id]=s;}));
// Grupo del mapa muscular → [zona, subzona] del selector («Añadir» desde el maniquí abre ahí)
const MM2SUB={};MM_GROUPS.forEach(g=>{const s=SUB_BY_ID[g.id];MM2SUB[g.id]=[g.lib,s&&s.z===g.lib?g.id:null];});
// Familias (encabezados de la lista de una zona), por patrón de movimiento y en este orden. «Otros» debe quedar vacía.
const LIB_FAM=[['squat','Sentadillas y prensa'],['lunge','Zancadas y subidas'],['hinge hip_ext','Peso muerto y puentes'],['knee_ext','Extensión de rodilla'],
  ['knee_flex','Curl femoral'],['hip_abd hip_add','Abducción y aducción'],['calf','Pantorrillas'],['bal','Equilibrio'],['push_h','Press de pecho y flexiones'],['fly','Aperturas'],
  ['push_v','Press de hombro'],['raise raise_f rear','Elevaciones y pájaros'],['pull_v','Jalones y dominadas'],['pull_h shrug','Remos'],['curl forearm','Curl y antebrazo'],
  ['tri','Tríceps'],['core','Crunch'],['core_iso','Planchas'],['core_rot','Rotaciones'],['full plyo carry','Cuerpo completo y saltos'],['cardio','Cardio']]
  .map(([p,h])=>({k:p.split(' ')[0],h,pats:p.split(' ')}));
const LIB_FAM_X={k:'otros',h:'Otros',pats:[]},LIB_FAM_OF={};LIB_FAM.forEach(f=>f.pats.forEach(p=>{LIB_FAM_OF[p]=f;}));
// Material y grupo de un ejercicio (mat puede venir como lista: vale el primero), su ficha de MAT y su nombre
function _mat(e){return e?Array.isArray(e.mat)?e.mat[0]:e.mat:'';}
function _grp(e){return e?e.grp||e.muscle:'';}
function matOf(k){return MAT[k]||MAT.otro;}
function matLabel(k){return MAT[k]?MAT[k].l:'';}
// «Necesita kettlebell», «Necesita TRX o anillas»: el nombre en minúscula salvo las siglas
function _matLow(k){const l=matLabel(k);return /^[A-ZÁÉÍÓÚÑ]{2}/.test(l)?l:l.charAt(0).toLowerCase()+l.slice(1);}
// Sinónimos de la búsqueda (todo normalizado: sin tildes y en minúsculas); lo que se encuentra por un sinónimo puntúa un
// 20 % menos. Los plurales no hacen falta: una palabra de más de 4 letras también se busca sin la «s» final (y sin «es»).
const LIB_SYN={isquios:['isquiotibiales','femoral'],isquio:['isquiotibiales','femoral'],femoral:['isquiotibiales'],femorales:['isquiotibiales','femoral'],
  gluteo:['gluteos'],gemelo:['gemelos'],pantorrilla:['gemelos','talones'],pantorrillas:['gemelos','talones'],abdominales:['abdomen','crunch'],abdominal:['abdomen','crunch'],
  abs:['abdomen'],hombro:['hombros','deltoides'],deltoides:['hombros'],dorsal:['dorsales'],dorsales:['dorsal'],pectoral:['pecho'],pectorales:['pecho','pectoral'],
  polea:['cable'],cable:['polea'],mancuerna:['mancuernas'],cinta:['caminadora'],correr:['caminadora'],bici:['bicicleta'],sentadillas:['sentadilla'],remos:['remo'],curls:['curl'],
  liga:['banda'],goma:['banda'],elastico:['banda'],suspension:['trx'],anillas:['trx'],anilla:['trx'],suiza:['comba'],cuerda:['comba'],saltar:['comba'],
  pelota:['fitball'],cajon:['step'],dips:['fondos'],rdl:['rumano'],trotadora:['caminadora'],brazo:['biceps','triceps'],brazos:['biceps','triceps']};
// Frases que cuentan como una palabra (en lo que escribes se cambian; en nombres y alias se añaden)
const LIB_PHRASE=[['pesas? rusas?','kettlebell'],['pelotas? suizas?','fitball'],['barra z','barraz'],['pull ?ups?','dominada']].map(([p,w])=>[new RegExp(' (?:'+p+')(?= )','g'),w]);
// Texto del índice: sin tildes, en minúsculas, solo letras y números, con un espacio delante (para saber si una palabra
// empieza ahí). _libPh le añade las palabras de sus frases.
function _libN(s){return' '+normTxt(s).replace(/[^a-z0-9]+/g,' ').trim();}
function _libPh(t){LIB_PHRASE.forEach(([re,w])=>{if((t+' ').search(re)>=0)t+=' '+w;});return t;}
// Índice de búsqueda (una vez, al primer uso): por ejercicio (i su puesto en el catálogo) su nombre, sus alias, sus
// músculos (zona, subzonas y los que trabaja a ≥ 50 %) y su material, equipo, patrón y familia. mu: sus músculos sin lado
// (el mayor de los dos) · top: el más trabajado · m: su material · a3: tiene animación 3D.
let _libIdxArr=null,_libIdxMap=null;
function _subWm(mu,s){let w=0;if(s)s.mus.forEach(m=>{if((mu[m]||0)>w)w=mu[m];});return w;}
function _libIdx(){
  if(_libIdxArr)return _libIdxArr;
  const lbl={};MUSCLE_GROUPS.forEach(g=>{lbl[g.id]=g.label;});
  _libIdxArr=EXERCISE_DB.map((e,i)=>{
    const mu={};Object.keys(e.mus||{}).forEach(k=>{const m=k.replace(/_(L|R)$/,''),v=+e.mus[k];if(v>0&&isFinite(v))mu[m]=Math.max(mu[m]||0,v);});
    let top=null;Object.keys(mu).forEach(m=>{if(top==null||mu[m]>mu[top])top=m;});
    const g=_grp(e),m=_mat(e),f=LIB_FAM_OF[e.pat]||LIB_FAM_X;
    return{e,i,mu,top,m,a3:typeof GymAnim!=='undefined'&&!!GymAnim.has&&GymAnim.has(e.id),
      nn:_libPh(_libN(e.n)),na:(e.al||[]).map(a=>_libPh(_libN(a))),
      nm:_libN([lbl[g]||g,...(ZONE_SUBS[g]||[]).filter(s=>_subWm(mu,s)>=.5).map(s=>s.l),...Object.keys(mu).filter(k=>mu[k]>=.5).map(k=>MUS_LBL[k]||k)].join(' ')),
      nt:_libPh(_libN([matLabel(m),m,e.eq,PAT_LBL[e.pat]||'',f.h].join(' ')))};
  });
  _libIdxMap=new Map(_libIdxArr.map(x=>[x.e.id,x]));
  return _libIdxArr;
}
function _libIx(id){_libIdx();return _libIdxMap.get(id)||null;}
// Peso de un ejercicio en una subzona (su músculo de ella más trabajado, 0-1) y su subzona principal (la de su músculo más
// trabajado o, si no es de ninguna, la de más peso; null si su zona no tiene subzonas o no llega al 50 % en ninguna)
function _subW(e,s){const x=e&&_libIx(e.id);return x?_subWm(x.mu,typeof s==='string'?SUB_BY_ID[s]:s):0;}
function _libTopSub(e){
  const x=e&&_libIx(e.id),subs=x?ZONE_SUBS[_grp(e)]||[]:[];
  const t=subs.find(s=>s.mus.includes(x.top));if(t&&_subWm(x.mu,t)>=.5)return t.id;
  let b=null,bw=.5;subs.forEach(s=>{const w=_subWm(x.mu,s);if(w>=bw&&(!b||w>bw)){b=s;bw=w;}});
  return b?b.id:null;
}
// Lo que escribes, listo para buscar: qn el texto normalizado (con las frases ya cambiadas) y toks sus palabras, cada
// una con sus variantes [palabra, factor]: ella, sin «s» / «es» si es larga, y sus sinónimos (×0,8)
function _libQ(q){
  let qn=_libN(q)+' ';LIB_PHRASE.forEach(([re,w])=>{qn=qn.replace(re,' '+w);});
  qn=qn.trim().replace(/\s+/g,' ');
  const toks=qn?qn.split(' ').map(k=>{
    const base=[k];if(k.length>4&&k.endsWith('s'))base.push(k.slice(0,-1));if(k.length>5&&k.endsWith('es'))base.push(k.slice(0,-2));
    const vs=base.map(w=>[w,1]);base.forEach(w=>(LIB_SYN[w]||[]).forEach(s=>{if(!vs.some(v=>v[0]===s))vs.push([s,.8]);}));
    return vs;
  }):[];
  return{qn,toks};
}
// 2 si una palabra del texto empieza por k, 1 si k está dentro, 0 si no
function _libAt(t,k){return t.indexOf(k)<0?0:t.indexOf(' '+k)>=0?2:1;}
// Palabras que nombran una zona o una subzona («pecho», «core», «abdomen», «gluteos», «femoral»…) → [{g: zona} | {s: subzona}]
let _libZW=null;
function _libZoneW(){
  if(_libZW)return _libZW;
  const m={},add=(l,t)=>String(l).split(/ · | \/ /).forEach(p=>{const w=_libN(p).trim();if(w&&!w.includes(' '))(m[w]=m[w]||[]).push(t);});
  MUSCLE_GROUPS.forEach(g=>add(g.label,{g:g.id}));Object.values(SUB_BY_ID).forEach(s=>add(s.l,{s}));
  return(_libZW=m);
}
// ¿Es de esa zona (o de las principales de esa subzona: ≥ 90 % o su músculo más trabajado)?
function _libInZ(x,t){return t.g?_grp(x.e)===t.g:_grp(x.e)===t.s.z&&(_subWm(x.mu,t.s)>=.9||t.s.mus.includes(x.top));}
// Puntos de un ejercicio para una búsqueda (0 si alguna palabra no está): cada palabra suma su mejor sitio (nombre 100 si
// empieza una palabra, 80 dentro · su zona o subzona 90 · alias 60 / 50 · músculo 30 · material, equipo o patrón 20); +40
// si es de la zona que nombras (al buscar «pecho», «Jalón al pecho» va detrás de los de pecho), +15 si el nombre empieza
// por lo que escribes, +15 si un alias es justo eso, +4 si es de los tuyos. al: el alias por el que se encontró (o -1).
function _libScore(x,Q,mine){
  let s=0,zb=0;const ah={},ZW=_libZoneW();
  for(const vs of Q.toks){
    let b=0,ba=-1;
    for(const [w,f] of vs){
      const h=_libAt(x.nn,w);if(h&&(h===2?100:80)*f>b){b=(h===2?100:80)*f;ba=-1;}
      if(ZW[w]&&ZW[w].some(t=>_libInZ(x,t))){zb=40;if(90*f>b){b=90*f;ba=-1;}}
      if(b>=60*f)continue;
      x.na.forEach((a,j)=>{const g=_libAt(a,w);if(g&&(g===2?60:50)*f>b){b=(g===2?60:50)*f;ba=j;}});
      if(30*f>b&&x.nm.includes(w)){b=30*f;ba=-1;}
      if(20*f>b&&x.nt.includes(w)){b=20*f;ba=-1;}
    }
    if(!b)return{s:0,al:-1};
    s+=b;if(ba>=0)ah[ba]=(ah[ba]||0)+1;
  }
  s+=zb;
  const q=' '+Q.qn;
  if(x.nn.startsWith(q))s+=15;
  if(x.na.some(a=>a===q))s+=15;
  if(mine&&mine.has&&mine.has(x.e.id))s+=4;
  let al=-1;Object.keys(ah).forEach(j=>{if(al<0||ah[j]>ah[al])al=+j;});
  return{s,al};
}
// Los de una lista del índice que encajan con la búsqueda, de más a menos puntos (empate: orden del catálogo)
function _libRank(Q,pool,mine){
  const out=[];
  pool.forEach(x=>{const r=_libScore(x,Q,mine);if(r.s>0)out.push({x,s:r.s,al:r.al});});
  return out.sort((a,b)=>b.s-a.s||a.x.i-b.x.i);
}
// Lugar: ¿se hace en ese sitio? ¿Y con tu material de casa? (sin decirlo aún, vale todo lo de casa) Y si no, por qué
function libAtPlace(e,place){return plOk(e,place);}
// (E3b) Con tu sitio guardado (places), su material: en el gimnasio deja de valer todo. Sin él, como siempre (en casa, tu kit)
function libDoable(e,place,kit,places){
  const k=place==='c'?'c':'g',P=_isPlainObj(places)?places[k]:null;if(P)return placeCan(e,P,k);
  const m=_mat(e);return libAtPlace(e,place)&&(place!=='c'||!Array.isArray(kit)||m==='corporal'||kit.includes(m));}
function libWhyNot(e,place,kit,places){
  if(libDoable(e,place,kit,places))return'';
  if(!libAtPlace(e,place))return place==='c'?'Solo en gimnasio':'Solo en casa';
  {const k=place==='c'?'c':'g',P=_isPlainObj(places)?places[k]:null;if(P)return placeWhyNot(e,P,k)||'No se puede hacer aquí';} // (E3b)
  return'Necesita '+_matLow(_mat(e));
}
// Contexto del selector (al abrirlo y al cambiar favoritos o tu material): en qué días de tu rutina está cada uno, tu
// historial, «los tuyos» (en tu rutina o con historial), favoritos, recientes, tu material y tu lugar
function _libCtx(){
  const inPlan=_libInPlan(),hist=_libHistMap();
  return{inPlan,hist,mine:new Set([...Object.keys(inPlan),...Object.keys(hist)]),fav:(S.libFav||[]).slice(),rec:(S.libRecent||[]).slice(),
    kit:Array.isArray(S.libKit)?S.libKit.slice():null,place:S.libPlace==='c'?'c':'g',places:_isPlainObj(S.places)?JSON.parse(JSON.stringify(S.places)):null}; // (E3b) tus sitios
}
// Lo último que eliges (añadir, cambiar, «Solo hoy») va primero en «Recientes»
function _libTouch(id){
  if(!LIB_BY_ID.has(id))return;
  S.libRecent=[id,...(Array.isArray(S.libRecent)?S.libRecent:[]).filter(x=>x!==id)].slice(0,12);
  saveState();
}
// Consulta del selector (pura y memorizada: mismo estado y mismo ctx → el mismo resultado). st:
//   search · filterMuscle null (inicio) | 'all' | grupo · filterSub subzona · mat 'all' | 'free' (sin máquina) | material ·
//   place / kit (si faltan, los del ctx) · mode · cardio true/false (solo los de ese tipo) · excl id que no sale ·
//   currentLib «Actual» (swap; su familia va primero) · pin «Parecidos» (busy, ya sin los vistos) · dayKey (add: el día, que
//   no sale en «En tu rutina») · ctx (_libCtx)
// Devuelve {view:'idle'|'list'|'search', items (las filas, en orden y sin repetir), groups [{k, h, items}], tail [{e, why}]
// (búsqueda: los que no puedes hacer aquí), hints {id: alias}, n, more (casa: los que harías con más material; inicio y zona), counts
// {zone, sub, mat}}. Filtros en orden: lugar (y tu material) → tipo → zona → subzona → material; la búsqueda no mira zona
// ni subzona. Orden de una lista: los tuyos, más fáciles, con 3D, catálogo.
const _lqMemo={ctx:null,m:new Map()};
function libQuery(st){
  st=st||{};const ctx=st.ctx||{};
  if(_lqMemo.ctx!==ctx){_lqMemo.ctx=ctx;_lqMemo.m.clear();}
  const place=st.place==='c'||st.place==='g'?st.place:ctx.place==='c'?'c':'g';
  const kit=st.kit!==undefined?st.kit:ctx.kit!==undefined?ctx.kit:null;
  const zone=st.filterMuscle||null,sd=zone&&zone!=='all'&&SUB_BY_ID[st.filterSub]&&SUB_BY_ID[st.filterSub].z===zone?SUB_BY_ID[st.filterSub]:null;
  const mat=st.mat||'all',Q=_libQ(st.search),cardio=st.cardio==null?null:!!st.cardio,excl=st.excl||null,mode=st.mode||'pick';
  const cur=mode==='swap'&&st.currentLib||null,pin=mode==='busy'&&Array.isArray(st.pin)?st.pin:[],dk=mode==='add'&&st.dayKey||null;
  const pls=_isPlainObj(ctx.places)?ctx.places:null,psig=pls&&pls[place]?JSON.stringify(pls[place]):'-'; // (E3b) tu sitio, si lo has dicho
  const key=[Q.qn,zone,sd&&sd.id,mat,place,Array.isArray(kit)?kit.join(','):'-',psig,cardio,excl,cur,pin.join(','),mode,dk].join('|');
  const hit=_lqMemo.m.get(key);if(hit)return hit;
  const X=_libIdx(),mine=ctx.mine instanceof Set?ctx.mine:new Set();
  const okB=x=>(cardio==null||!!x.e.cardio===cardio)&&x.e.id!==excl,okK=x=>libDoable(x.e,place,kit,pls);
  const okM=x=>mat==='all'||(mat==='free'?!(MAT[x.m]||{}).mach:x.m===mat),okZ=x=>!zone||zone==='all'||_grp(x.e)===zone;
  const so=(a,b)=>(mine.has(b.e.id)?1:0)-(mine.has(a.e.id)?1:0)||a.e.dif-b.e.dif||(b.a3?1:0)-(a.a3?1:0)||a.i-b.i;
  const counts={zone:{all:0},sub:{},mat:{}},matCount=a=>{counts.mat.all=a.length;counts.mat.free=0;a.forEach(x=>{counts.mat[x.m]=(counts.mat[x.m]||0)+1;if(!(MAT[x.m]||{}).mach)counts.mat.free++;});};
  const avail=X.filter(x=>okB(x)&&okK(x));
  avail.forEach(x=>{const g=_grp(x.e);counts.zone[g]=(counts.zone[g]||0)+1;counts.zone.all++;});
  let view,groups=[],tail=[],hints={},more=0,off=0;
  if(Q.toks.length){
    view='search';
    const r=_libRank(Q,X.filter(okB),mine),ok=r.filter(y=>okK(y.x));
    matCount(ok.map(y=>y.x));
    const rows=ok.filter(y=>okM(y.x));
    rows.forEach(y=>{if(y.al>=0)hints[y.x.e.id]=y.x.e.al[y.al];});
    groups=[{k:'q',h:'',items:rows.map(y=>y.x.e)}];
    tail=r.filter(y=>!okK(y.x)&&okM(y.x)).map(y=>({e:y.x.e,why:libWhyNot(y.x.e,place,kit,pls)}));
  }else if(!zone){
    view='idle';
    const sec=(k,h,ids)=>{const a=[];ids.forEach(id=>{const x=_libIdxMap.get(id);if(x&&okB(x)&&okK(x)&&!a.includes(x.e))a.push(x.e);});if(a.length)groups.push({k,h,items:a});};
    sec('rec','Recientes',Array.isArray(ctx.rec)?ctx.rec:[]);
    sec('fav','Favoritos',Array.isArray(ctx.fav)?ctx.fav:[]);
    // (añadir: sin los que ya están en ese día)
    if(mode==='add'||mode==='pick')sec('plan','En tu rutina',Object.keys(ctx.inPlan||{}).filter(id=>!dk||!(ctx.inPlan[id]||[]).includes(dk)));
    if(place==='c'&&(Array.isArray(kit)||(pls&&pls.c)))more=X.filter(x=>okB(x)&&libAtPlace(x.e,place)&&!okK(x)).length;
  }else{
    view='list';
    const inZ=avail.filter(okZ);
    (ZONE_SUBS[zone]||[]).forEach(s=>{counts.sub[s.id]=inZ.filter(x=>_subWm(x.mu,s)>=.5).length;});
    const inS=sd?inZ.filter(x=>_subWm(x.mu,sd)>=.5):inZ;
    matCount(inS);
    let rows=inS.filter(okM);
    if(place==='c'&&Array.isArray(kit))more=X.filter(x=>okB(x)&&okZ(x)&&(!sd||_subWm(x.mu,sd)>=.5)&&okM(x)&&libAtPlace(x.e,place)&&!okK(x)).length;
    const take=(k,h,ids,pool)=>{const a=[];ids.forEach(id=>{const x=rows.find(y=>y.e.id===id)||pool&&pool.find(y=>y.e.id===id);if(x&&!a.includes(x))a.push(x);});
      if(a.length){groups.push({k,h,items:a.map(x=>x.e)});rows=rows.filter(x=>!a.includes(x));}};
    // «Actual» sale aunque no se pueda hacer aquí (cambiar una máquina con «Casa» elegido), con su porqué y fuera de la
    // cuenta («N con tu material»); la zona, la subzona y el material lo filtran como al resto
    if(cur){take('cur','Actual',[cur],X.filter(x=>okB(x)&&okZ(x)&&(!sd||_subWm(x.mu,sd)>=.5)&&okM(x)));
      const x=_libIdxMap.get(cur);if(x&&!okK(x)&&groups.some(g=>g.k==='cur'))off=1;}
    if(pin.length){const pz=inZ.filter(okM),a=[];pin.forEach(id=>{const x=pz.find(y=>y.e.id===id);if(x&&!a.includes(x))a.push(x);});
      if(a.length){groups.push({k:'sim',h:'Parecidos',items:a.map(x=>x.e)});rows=rows.filter(x=>!a.includes(x));}}
    let also=[];
    if(sd){also=rows.filter(x=>!(_subWm(x.mu,sd)>=.9||sd.mus.includes(x.top)));rows=rows.filter(x=>!also.includes(x));}
    // (cambiar: la familia del actual, justo después de él)
    const cf=cur&&LIB_FAM_OF[(LIB_BY_ID.get(cur)||{}).pat],fams=[...LIB_FAM,LIB_FAM_X];if(cf)fams.sort((a,b)=>(b===cf)-(a===cf));
    if(zone==='all')MUSCLE_GROUPS.forEach(g=>{const a=rows.filter(x=>_grp(x.e)===g.id).sort(so);if(a.length)groups.push({k:g.id,h:g.label,items:a.map(x=>x.e)});});
    else fams.forEach(f=>{const a=rows.filter(x=>(LIB_FAM_OF[x.e.pat]||LIB_FAM_X)===f).sort(so);if(a.length)groups.push({k:f.k,h:f.h,items:a.map(x=>x.e)});});
    if(also.length)groups.push({k:'also',h:'También trabajan '+sd.l.split(' · ')[0].toLowerCase(),items:also.sort(so).map(x=>x.e)});
  }
  const seen=new Set(),items=[];groups.forEach(g=>g.items.forEach(e=>{if(!seen.has(e)){seen.add(e);items.push(e);}}));
  const res={view,items,groups,tail,hints,n:view==='idle'?counts.zone.all:items.length-off,more,off,counts};
  if(_lqMemo.m.size>=40)_lqMemo.m.clear();
  _lqMemo.m.set(key,res);
  return res;
}
// Ejercicios de la biblioteca para una búsqueda, un grupo y un equipo (todo el catálogo, sin mirar el lugar), de más a
// menos relevante (sin búsqueda, en el orden del catálogo). El equipo es el de los chips de siempre (libEqClass; 'polea'
// vale como 'cable').
function pickerFilter(search,filterMuscle,filterEq){
  const eq=filterEq==='polea'?'cable':filterEq,Q=_libQ(search);
  let pool=_libIdx();
  if(filterMuscle&&filterMuscle!=='all')pool=pool.filter(x=>_grp(x.e)===filterMuscle);
  if(eq&&eq!=='all')pool=pool.filter(x=>libEqClass(x.e)===eq);
  return(Q.toks.length?_libRank(Q,pool).map(y=>y.x):pool).map(x=>x.e);
}
// En qué días de tu rutina está ya cada ejercicio de la biblioteca: {libId:['A','C']} (el original de un «solo hoy» cuenta)
function _libInPlan(){
  const m={},plan=getPlan();
  Object.keys(plan).forEach(dk=>(plan[dk]&&Array.isArray(plan[dk].ex)?plan[dk].ex:[]).forEach(e=>{
    [e,routineEx(e)].forEach(x=>{const k=_libIdOf(x);if(!k)return;if(!m[k])m[k]=[];if(!m[k].includes(dk))m[k].push(dk);});
  }));
  return m;
}
// ── Pintado del selector ──
const PK_CHUNK=40;
let _pkT=0;
// Lo que el selector le pide a libQuery (su estado tal cual) y dónde busca (en «ocupada», el de tu rutina)
function _pickerArgs(){const s=_pickerState;return{search:s.search,filterMuscle:s.filterMuscle,filterSub:s.filterSub,mat:s.mat,place:s.place,mode:s.mode,
  cardio:s.cardio,excl:s.excl,currentLib:s.currentLib,pin:s.pin,dayKey:s.dayKey,ctx:s.ctx};}
function _pickerPlace(){const s=_pickerState;return s&&(s.place||s.ctx&&s.ctx.place)||'g';}
// Nombre corto de una zona («Core / Abdomen» → «Core») y de un chip de material
function _zoneLbl(g){return String(g&&g.label||'').split(' / ')[0];}
// (en «ocupada», «Sin máquina» y «Sin material» irían juntos: el segundo es «Peso corporal»)
function _matChipLbl(k){return k==='free'?'Sin máquina':k==='corporal'&&_pickerState&&_pickerState.mode==='busy'?'Peso corporal':matLabel(k);}
// Figura de cuerpo (de frente y de espaldas) que comparten filas y zonas: un único <symbol>; cada grupo del maniquí se
// tiñe con --f-<grupo> (si no, queda del color del cuerpo)
function _libSpriteOnce(){
  if(document.getElementById('lib-fig'))return;
  const E=(x,y,rx,ry)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>`,R=(x,y,w,h,r)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r==null?Math.min(w,h)/2:r}"/>`;
  const two=f=>f(-1)+f(1),g=(id,s)=>`<g style="fill:var(--f-${id},var(--bg4))">${s}</g>`;
  const fig=(c,back)=>`<circle cx="${c}" cy="3.4" r="2.8"/>`+R(c-1.2,5.6,2.4,2.4)+two(d=>R(c+d*8.1-1.2,16.2,2.4,6.6))+(back?'':R(c-4,20.4,8,3.8)+two(d=>R(c+d*2.3-1.5,32.4,3,6.8)))
    +g('hombros',two(d=>E(c+d*5.6,9.4,2.5,2.1)))
    +(back?g('espalda',E(c,8.3,4,1.7)+`<path d="M${c-4.6} 9.8h9.2l-1.7 10.8h-5.8z"/>`)+g('triceps',two(d=>E(c+d*7.1,13.2,1.5,2.9)))+g('gluteos',two(d=>E(c+d*2.2,22.7,2.3,2.3)))
      +g('isquios',two(d=>R(c+d*2.3-2,25.4,4,7)))+g('gemelos',two(d=>E(c+d*2.3,35,1.6,3.3)))
      :g('pecho',two(d=>R(c+d*2.4-2.2,8.2,4.4,4.4,1.4)))+g('abdomen',R(c-3.3,13,6.6,7.4,1.6))+g('biceps',two(d=>E(c+d*7.1,13.2,1.5,2.9)))+g('cuads',two(d=>R(c+d*2.3-2,24.4,4,8))));
  document.body.insertAdjacentHTML('beforeend',`<svg aria-hidden="true" style="position:absolute;width:0;height:0;overflow:hidden"><symbol id="lib-fig" viewBox="0 0 60 40"><g style="fill:var(--bg4);stroke:var(--text4);stroke-width:.4">${fig(15,0)}${fig(45,1)}</g></symbol></svg>`);
}
// Tinte de la figura: los grupos de una zona (mosaico) o los de un ejercicio, en menta los principales (≥ 90 % o el más
// trabajado) y más tenues los secundarios (≥ 50 %)
function _zoneFigStyle(z){return MM_GROUPS.filter(g=>g.lib===z).map(g=>`--f-${g.id}:var(--green)`).join(';');}
function _libFigStyle(e){
  const x=_libIx(e.id),w={};if(!x)return'';
  Object.keys(x.mu).forEach(m=>{const g=_MM_MUS2G[m];if(g&&x.mu[m]>(w[g]||0))w[g]=x.mu[m];});
  const top=Math.max(0,...Object.values(w));
  return Object.keys(w).filter(g=>w[g]>=.5).map(g=>`--f-${g}:var(${w[g]>=.9||w[g]===top?'--green':'--green-b'})`).join(';');
}
// Miniatura de una fila (72×48): la 3D encima (si tiene) y debajo, de respaldo, la figura teñida y su emoji (cardio: solo
// el emoji, grande)
function _libThumbHtml(e){
  return`<span class="lib-th${e.cardio?' cardio':''}" aria-hidden="true">${thumbImgHtml(e.id,TH_CARD,1)}${e.cardio?'':`<svg class="lib-fig" viewBox="0 0 60 40" style="${_libFigStyle(e)}"><use href="#lib-fig"/></svg>`}<span class="lib-th-e">${e.cardio?ic('run'):''}</span></span>`;
}
// Lo último que hiciste de un ejercicio, en su medida («80 kg × 10», «45 s», «12 reps»…); '' sin historial o en cardio
function _libLastTxt(e,h){
  if(!h||e.cardio)return'';
  if(_histNoKg(h))return`<b>${esc(_recValTxt(h.lastAny))}</b>`;
  return h.last?`<b>${esc(kgTxt(h.last.v))} kg</b>${h.last.r?' × '+esc(h.last.r):''}`:'';
}
// Una fila: miniatura, nombre (★ si es favorito), [«alias» ·] material · 2 músculos y sus etiquetas. o: why (por qué no
// puedes hacerlo aquí), hint (alias por el que se encontró), pct (parecido, «ocupada»), today (botón «Solo hoy» al lado)
function _libRowHtml(e,o){
  const st=_pickerState,c=st.ctx,id=esc(e.id),days=c.inPlan[e.id]||[],cur=e.id===st.currentLib,plan=st.plan||getPlan(),last=_libLastTxt(e,c.hist[e.id]||null);
  const mus=_libMusLbl(e,2).map((l,i)=>i?l.charAt(0).toLowerCase()+l.slice(1):l).join(', ');
  const tags=[cur||days.length?`<span class="lib-item-badge in">${cur?'Actual':'En tu rutina'}${days.length?' · '+days.map(d=>esc(plan[d]?.label||d)).join(', '):''}</span>`:'',
    o.why?`<span class="lib-why">${esc(o.why)}</span>`:'',o.pct?`<span class="lib-pct">${o.pct} %</span>`:'',
    e.dif>1?`<span class="lib-item-badge">${e.dif>2?'Avanzado':'Intermedio'}</span>`:'',last?`<span class="lib-last">${last}</span>`:'',
    st.station&&!cur&&_stationOf(e.eq,e)===st.station?'<span class="lib-item-badge">Misma máquina</span>':''].join('');
  const inP=days.length>0,today=o.today?`<button type="button" class="lib-today" data-lib="${id}" onclick="pickerBusy(this.dataset.lib,'today')" aria-label="${inP?`${esc(e.n)}: ya está en tu rutina`:`Solo hoy: ${esc(e.n)}`}"${inP?' disabled':''}>${inP?'Ya está en tu rutina':'Solo hoy'}</button>`:'';
  return`<li class="lib-li${today?' td':''}"><button type="button" class="lib-item lib-card lib-row${cur?' cur':''}${o.why?' off':''}" data-lib="${id}" onclick="pickerDetail(this.dataset.lib)">${_libThumbHtml(e)}<span class="lib-rb">`
    +`<span class="lib-item-n">${st.favS&&st.favS.has(e.id)?'<span class="lib-star" role="img" aria-label="Favorito">★</span> ':''}${esc(e.n)}</span>`
    +`<span class="lib-meta">${o.hint?`«${esc(o.hint)}» · `:''}<span class="lib-eqt">${esc(matLabel(_mat(e)))}</span>${mus?' · '+esc(mus):''}</span>${tags?`<span class="lib-tags">${tags}</span>`:''}</span>`
    +`<span class="lib-chev" aria-hidden="true">›</span></button>${today}</li>`;
}
// Zonas de la cabecera (Todo y los 8 grupos; tocar la activa vuelve al inicio) y «Gimnasio | Casa»
function _pickerChipsHtml(){
  const fm=_pickerState.filterMuscle;
  return[{id:'all',label:'Todo'},...MUSCLE_GROUPS].map(m=>`<button type="button" class="lib-chip" data-z="${m.id}" aria-pressed="${fm===m.id}" onclick="pickerSetMuscle(this.getAttribute('aria-pressed')==='true'?null:this.dataset.z)">${esc(_zoneLbl(m))}</button>`).join('');
}
function _pickerPlaceHtml(){
  const p=_pickerPlace();
  return[['g',ic('dumbbell')+' Gimnasio'],['c',ic('home')+' Casa']].map(([k,l])=>`<button type="button" class="lib-pl" role="radio" data-pl="${k}" aria-checked="${p===k}" tabindex="${p===k?0:-1}" onclick="pickerSetPlace(this.dataset.pl)" onkeydown="pickerPlaceKey(event)">${l}</button>`).join('');
}
// Mosaico de zonas del inicio: figura, nombre y cuántos hay (sin ninguno, desactivada)
function _pickerTilesHtml(R){
  return`<div class="lib-tiles">${MUSCLE_GROUPS.map(g=>{const n=R.counts.zone[g.id]||0,l=_zoneLbl(g);
    return`<button type="button" class="lib-tile" data-z="${g.id}" onclick="pickerSetMuscle(this.dataset.z)" aria-label="${esc(l)}: ${plural(n,'ejercicio')}"${n?'':' disabled'}>`
      +`${g.id==='cardio'?'<span class="lib-tile-e" aria-hidden="true">'+ic('run')+'</span>':`<svg class="lib-fig" viewBox="0 0 60 40" aria-hidden="true" style="${_zoneFigStyle(g.id)}"><use href="#lib-fig"/></svg>`}`
      +`<span class="lib-tile-n" aria-hidden="true">${esc(l)}</span><span class="lib-tile-c" aria-hidden="true">${n}</span></button>`;}).join('')}</div>`;
}
// Tiras que bajan con la lista: subzonas de la zona (tocar la elegida la quita) y material (Todo, «Sin material» en casa o «Sin máquina» si está
// ocupada, y los que hay, de más a menos), con su número; un material sale si tiene alguno o si es el elegido (sin
// ninguno, el elegido va justo después de «Todo»: si no, quedaría al final, fuera de la vista)
function _pickerStripsHtml(R,subs){
  const st=_pickerState,z=st.filterMuscle,SB=subs&&ZONE_SUBS[z]||[],cm=R.counts.mat,busy=st.mode==='busy',first=busy?'free':_pickerPlace()==='c'?'corporal':'';
  const chip=(cls,k,v,on,l,n)=>`<button type="button" class="lib-chip ${cls}" data-${k}="${v}" aria-pressed="${on}" aria-label="${esc(l)}: ${plural(n,'ejercicio')}" onclick="${k==='sub'?'pickerSetSub':'pickerSetMat'}(this.getAttribute('aria-pressed')==='true'&&this.dataset.${k}?'${k==='sub'?'':'all'}':this.dataset.${k})">${esc(l)}<span class="lib-cn">${n}</span></button>`;
  let h='';
  if(SB.length)h+=`<div class="lib-chiprow" id="lib-subs" role="group" aria-label="Subzona">${SB.filter(s=>R.counts.sub[s.id]||st.filterSub===s.id).map(s=>chip('sub','sub',s.id,st.filterSub===s.id,s.l,R.counts.sub[s.id]||0)).join('')}</div>`;
  const K=k=>cm[k]||(k===st.mat?1e9:0),ks=Object.keys(MAT).filter(k=>k!==first&&(cm[k]||st.mat===k)).sort((a,b)=>K(b)-K(a)),f=first&&(cm[first]||st.mat===first);
  if(ks.length+(f?1:0)>1||st.mat!=='all')h+=`<div class="lib-chiprow" id="lib-eq" role="group" aria-label="Material">${chip('eq','mat','all',st.mat==='all','Todo',cm.all||0)}${f?chip('eq','mat',first,st.mat===first,_matChipLbl(first),cm[first]||0):''}${ks.map(k=>chip('eq','mat',k,st.mat===k,_matChipLbl(k),cm[k]||0)).join('')}</div>`;
  return h?`<div class="lib-strips">${h}</div>`:'';
}
// Sin nada: lo dice y ofrece quitar el primer filtro que devuelve algo (material, subzona, lugar, tu material de casa) o
// borrar la búsqueda
function _pickerRelaxOpt(){
  const st=_pickerState,base=_pickerArgs(),q=!!st.search.trim(),op=_pickerPlace()==='c'?'g':'c';
  const T=[st.mat!=='all'&&{s:{mat:'all'},l:n=>`Hay ${n} sin «${_matChipLbl(st.mat)}» · Ver`},!q&&st.filterSub&&{s:{filterSub:null},l:n=>`Hay ${n} en toda la zona · Ver`},
    !q&&st.mode!=='busy'&&{s:{place:op},l:n=>`Hay ${n} en ${op==='c'?'casa':'el gimnasio'} · Ver`},
    !q&&_pickerPlace()==='c'&&Array.isArray(st.ctx.kit)&&{s:{kit:null},l:n=>`Hay ${n} con más material · Elegir`}].filter(Boolean);
  for(const t of T){const n=libQuery(Object.assign({},base,t.s)).n;if(n)return{s:t.s,l:t.l(n)};}
  return q?{s:{search:''},l:'Borrar la búsqueda'}:null;
}
function _pickerEmptyHtml(){
  const q=_pickerState.search.trim(),r=_pickerRelaxOpt();
  return`<div class="empty lib-empty"><div class="eic" aria-hidden="true">${ic('search')}</div><p>${q?`Sin resultados para «${esc(q)}».`:'Ningún ejercicio con estos filtros.'}</p>${r?`<button type="button" class="btn bs lib-relax" onclick="pickerRelax()">${esc(r.l)}</button>`:''}</div>`;
}
// La lista en piezas, en orden: filas {e, g, o} y trozos de HTML {h} (encabezados, tiras, mosaico, avisos)
function _pickerSeq(R){
  const st=_pickerState,seq=[],H=h=>seq.push({h}),rows=(g,a,o)=>a.forEach(e=>seq.push({e,g,o:o?o(e):{}}));
  const head=(h,n)=>`<h3 class="lib-group-h">${esc(h)}${n?`<span class="lib-gn"> · ${n}</span>`:''}</h3>`;
  if(R.view==='idle'){
    // una sección no repite lo que ya enseña otra de más arriba («Ver todos (N)» cuenta lo que saldrá)
    const shown=new Set(),sec=k=>{const g=R.groups.find(x=>x.k===k),a=g?g.items.filter(e=>!shown.has(e)):[],all=!!st.more[k],n=a.length;if(!n)return;
      H(`<div class="lib-sec" data-k="${k}">${head(g.h)}${n>3?`<button type="button" class="lib-all" data-k="${k}" aria-expanded="${all}" onclick="pickerMore(this.dataset.k)">${all?'Ver menos':`Ver todos (${n})`}</button>`:''}</div>`);
      const v=all?a:a.slice(0,3);v.forEach(e=>shown.add(e));rows(k,v);};
    sec('rec');sec('fav');H(head('Elige una zona')+_pickerTilesHtml(R));sec('plan');
  }else if(R.view==='search'){
    const a=R.groups[0]?R.groups[0].items:[];
    H(_pickerStripsHtml(R,false));rows('q',a,e=>({hint:R.hints[e.id]}));
    if(R.tail.length){const open=st.tail||!a.length,t=`No disponibles aquí (${R.tail.length})`;
      H(a.length?`<button type="button" class="lib-tail-h" aria-expanded="${open}" onclick="pickerTail()">${t}<span aria-hidden="true">${open?'▴':'▾'}</span></button>`:`<h3 class="lib-group-h lib-tail-t">${t}</h3>`);
      if(open)R.tail.forEach(x=>seq.push({e:x.e,g:'tail',o:{why:x.why}}));}
    else if(!a.length)H(_pickerEmptyHtml());
  }else{
    let strips=false;
    R.groups.forEach(g=>{
      const top=g.k==='cur'||g.k==='sim';
      if(!top&&!strips){H(_pickerStripsHtml(R,true));strips=true;}
      H(head(g.h,top?0:g.items.length));
      rows(g.k,g.items,g.k==='sim'?e=>({pct:st.pct&&st.pct[e.id],today:1}):g.k==='cur'&&R.off?e=>({why:libWhyNot(e,_pickerPlace(),st.ctx.kit,st.ctx.places)}):null);
    });
    if(!strips)H(_pickerStripsHtml(R,true));
    if(!R.n)H(_pickerEmptyHtml());
  }
  return seq;
}
// Las siguientes n filas (con los encabezados y tiras que vengan antes); cada tramo de un grupo, en su <ul>
function _pickerChunk(n){
  const st=_pickerState,seq=st.seq;let h='',k=0,ul=null;
  while(st.pos<seq.length&&k<n){
    const p=seq[st.pos++];
    if(p.e){if(ul!==p.g){if(ul!==null)h+='</ul>';h+='<ul class="lib-ul">';ul=p.g;}h+=_libRowHtml(p.e,p.o);k++;}
    else{if(ul!==null){h+='</ul>';ul=null;}h+=p.h;}
  }
  return ul!==null?h+'</ul>':h;
}
// Añade el siguiente trozo (div.lib-chunk, display:contents) antes del centinela; false si ya no queda nada o si la lista
// ya es otra (los trozos de una lista anterior se descartan)
function _pickerAppend(gen){
  const st=_pickerState,s=document.getElementById('lib-more');
  if(!st||st.gen!==gen||!s)return false;
  const ch=document.createElement('div');ch.className='lib-chunk';ch.innerHTML=_pickerChunk(PK_CHUNK);s.before(ch);_pkThWatch(ch);
  if(st.pos<st.seq.length)return true;
  s.remove();return false;
}
// El resto llega al acercarse al final (600 px antes, sobre la hoja que se desplaza); sin IntersectionObserver, en tiempo libre
function _pickerObserve(){
  const st=_pickerState,sh=document.getElementById('lib-sheet'),s=document.getElementById('lib-more');
  if(!st||!sh||!s)return;
  const gen=st.gen;
  if(typeof IntersectionObserver==='function'){
    const io=st.io=new IntersectionObserver(en=>{
      if(!en.some(x=>x.isIntersecting))return;
      if(!_pickerAppend(gen)){io.disconnect();return;}
      const m=document.getElementById('lib-more');if(m){io.unobserve(m);io.observe(m);} // vuelve a mirar: puede seguir a la vista
    },{root:sh,rootMargin:'0px 0px 600px 0px'});
    io.observe(s);
  }else{const ric=window.requestIdleCallback||(f=>setTimeout(f,40)),step=()=>{if(_pickerAppend(gen))ric(step);};ric(step);}
}
// Toda la lista de una vez (pruebas)
function _pickerRenderAll(){const st=_pickerState;if(!st)return;while(_pickerAppend(st.gen));if(st.io){st.io.disconnect();st.io=null;}}
function _pickerStop(){clearTimeout(_pkT);_pkT=0;_pkThStop();const st=_pickerState;if(st&&st.io){st.io.disconnect();st.io=null;}}
// Contador: «3 resultados · 6 no disponibles» · «386 ejercicios en el gimnasio» · en casa con tu material dicho, «41
// ejercicios con tu material · +37 con más material ›» (ese botón abre «Mi material»; con él, la línea mide 44 px: .more)
function _pickerCountHtml(R){
  if(R.view==='search'){const n=R.items.length,t=R.tail.length;return n||t?plural(n,'resultado')+(t?` · ${t} no disponible${t>1?'s':''}`:''):'';}
  const c=_pickerPlace()==='c',k=c&&Array.isArray(_pickerState.ctx.kit),n=R.n;
  return(k&&R.more?`${n}<span class="lib-wd"> ${n===1?'ejercicio':'ejercicios'}</span>`:plural(n,'ejercicio'))+(k?' con tu material':R.view==='idle'?c?' en casa':' en el gimnasio':'')
    +(k&&R.more?` · <button type="button" class="lib-cmore" aria-haspopup="dialog" onclick="openLibKit()" aria-label="${plural(R.more,'ejercicio')} más con otro material: elige el tuyo"><b>+${R.more}</b> con más material ›</button>`:'');
}
function renderExercisePicker(){
  const root=document.getElementById('cmodal-root'),st=_pickerState;
  if(!root||!st)return;
  _libDetail=null;_libKitOpen=null;_libSpriteOnce();
  const busy=st.mode==='busy';
  root.innerHTML=`<div class="hist-over" onclick="if(event.target===this)closeExercisePicker()" style="z-index:500"><div class="hist-sheet" id="lib-sheet" role="dialog" aria-modal="true" aria-labelledby="lib-title" tabindex="-1" style="max-height:calc(92vh - var(--kb));max-height:calc(92dvh - var(--kb))">
    <div class="hist-sheet-head">
      <div class="hist-sheet-hdl"></div>
      <div class="hist-sheet-title" id="lib-title">${esc(st.title)}</div>
      <button type="button" class="hist-sheet-close x44" onclick="closeExercisePicker()" aria-label="Cerrar">✕</button>
      <div class="lib-sbox"><input class="lib-search" id="lib-search-inp" type="search" enterkeyhint="search" placeholder="${busy?`Buscar en ${_pickerPlace()==='c'?'casa':'el gimnasio'}…`:'Buscar: jalón, femoral, liga…'}" aria-label="Buscar ejercicio" aria-controls="lib-list" aria-describedby="lib-count" value="${esc(st.search)}" oninput="pickerSearchInput(event)" oncompositionend="pickerSearchInput(event)" onkeydown="pickerSearchKey(event)" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"/><button type="button" class="lib-clear" id="lib-clear" onclick="pickerClear()" aria-label="Borrar la búsqueda" hidden>✕</button></div>
      ${busy?'':'<div class="lib-plrow lib-hq"><div class="lib-place" id="lib-place" role="radiogroup" aria-label="Dónde entrenas"></div><button type="button" class="lib-kitbtn" id="lib-kitbtn" aria-haspopup="dialog" onclick="openLibKit()" hidden></button></div>'}
      <div class="lib-chiprow lib-hq" id="lib-chips" role="group" aria-label="Zona"></div>
      <div class="lib-count" id="lib-count" aria-live="polite"></div>
    </div>
    <div class="hist-sheet-body"><div id="lib-list"></div></div>
  </div></div>`;
  _pickerRefresh();
}
// El botón con el foco, como selector (clase y data-*, y su puesto entre los iguales), para volver a él tras repintar:
// zonas, subzonas, material, lugar, «Ver todos», filas, «No disponibles aquí», «Hay N… · Ver», «+N con más material»
function _pkKey(el){
  const sh=document.getElementById('lib-sheet');if(!el||!sh||el===sh||el.tagName!=='BUTTON'||!sh.contains(el))return null;
  const a=['z','sub','mat','pl','k','lib'].find(k=>el.dataset[k]!=null),c=['lib-tail-h','lib-relax','lib-cmore'].find(c=>el.classList.contains(c));
  const s=a?`.${el.classList[0]}[data-${a}="${el.dataset[a]}"]`:c?'.'+c:null;
  return s?{s,i:[...sh.querySelectorAll(s)].indexOf(el),tile:el.classList.contains('lib-tile')}:null;
}
function _pkFind(k){const sh=document.getElementById('lib-sheet'),m=k&&sh?sh.querySelectorAll(k.s):[];return m[k&&k.i]||m[0]||null;}
function _pkFocus(el){if(el){try{el.focus({preventScroll:true});}catch(e){}}}
// Repinta lo que depende de los filtros (zonas, lugar, contador y la lista; el input no se toca) con el primer trozo de
// 40 filas. keep: sin volver arriba («Ver todos», «No disponibles aquí»). El foco vuelve al botón que se tocó (o a su
// zona, si era del mosaico, o a la hoja) y el chip elegido de cada tira queda a la vista.
function _pickerRefresh(keep){
  const st=_pickerState,list=document.getElementById('lib-list'),sh=document.getElementById('lib-sheet');
  if(!st)return;if(!list||!sh){renderExercisePicker();return;}
  st.gen++;if(st.io){st.io.disconnect();st.io=null;}
  const R=_pickerQ();st.R=R;st.count=R.n;st.plan=getPlan();st.favS=new Set(st.ctx.fav||[]);
  sh.classList.toggle('lib-q',!!st.search.trim());
  const fk=_pkKey(document.activeElement),sl={},sz=st.slz===st.filterMuscle;st.slz=st.filterMuscle;
  ['lib-chips','lib-subs','lib-eq'].forEach(i=>{const e=document.getElementById(i);if(e&&(sz||i==='lib-chips'))sl[i]=e.scrollLeft;});
  const set=(i,h)=>{const e=document.getElementById(i);if(e)e.innerHTML=h;};
  set('lib-chips',_pickerChipsHtml());set('lib-place',_pickerPlaceHtml());set('lib-count',_pickerCountHtml(R));
  const cn=document.getElementById('lib-count');if(cn)cn.classList.toggle('more',!!cn.querySelector('.lib-cmore'));
  const kb=document.getElementById('lib-kitbtn'),kit=st.ctx.kit,kn=kit&&kit.length;
  if(kb){kb.hidden=_pickerPlace()!=='c';kb.innerHTML=`${ic('dumbbell')}<span class="lib-wd"> Mi material</span>${kn?`<span class="lib-cn"><span class="lib-wd">· </span>${kn}</span>`:''}`;
    kb.setAttribute('aria-label','Mi material'+(kn?': '+plural(kn,'elegido'):''));}
  const x=document.getElementById('lib-clear');if(x)x.hidden=!st.search;
  st.seq=_pickerSeq(R);st.pos=0;_pkThReset();
  list.innerHTML=_pickerChunk(PK_CHUNK)+(st.pos<st.seq.length?'<div id="lib-more" class="lib-more" aria-hidden="true"></div>':'');
  Object.keys(sl).forEach(i=>{const e=document.getElementById(i);if(e)e.scrollLeft=sl[i];});
  if(!keep)sh.scrollTop=0;
  ['lib-chips','lib-subs','lib-eq'].forEach(i=>{const c=document.getElementById(i),a=c&&c.querySelector('[aria-pressed="true"]');if(!a)return;
    const r=a.getBoundingClientRect(),cr=c.getBoundingClientRect();
    if(r.left<cr.left)c.scrollLeft+=r.left-cr.left-16;else if(r.right>cr.right)c.scrollLeft+=r.right-cr.right+16;});
  const ae=document.activeElement;
  if(fk&&(!ae||ae===document.body||!ae.isConnected))_pkFocus(_pkFind(fk)||fk.tile&&document.querySelector('#lib-chips [aria-pressed="true"]')||sh);
  _pkThWatch(list);_pickerObserve();
}
function _pickerQ(){return libQuery(_pickerArgs());}
// Al escribir, la lista se repinta 120 ms después de la última tecla (al borrarlo todo, en el acto); mientras se compone
// una letra (tildes, teclados asiáticos) no se busca
function pickerSearchInput(ev){
  if(ev&&ev.isComposing)return;
  clearTimeout(_pkT);
  const i=document.getElementById('lib-search-inp');
  if(!i||!i.value.trim()){pickerSearchFlush();return;}
  _pkT=setTimeout(pickerSearchFlush,120);
}
function pickerSearchFlush(){clearTimeout(_pkT);_pkT=0;const i=document.getElementById('lib-search-inp');if(i&&_pickerState&&i.value!==_pickerState.search)pickerSearch(i.value);}
// La búsqueda, en el acto (el input sigue siendo el mismo, con su foco y su cursor)
function pickerSearch(v){
  const st=_pickerState;if(!st)return;
  st.search=String(v==null?'':v);st.tail=false;
  const i=document.getElementById('lib-search-inp');if(i&&i.value!==st.search)i.value=st.search;
  _pickerRefresh();
}
// Intro busca ya y cierra el teclado; Escape con algo escrito solo lo borra (no cierra el selector)
function pickerSearchKey(ev){
  if(ev.key==='Enter'){ev.preventDefault();pickerSearchFlush();ev.target.blur();}
  else if(ev.key==='Escape'&&ev.target.value){ev.preventDefault();ev.stopPropagation();pickerClear();}
}
function pickerClear(){
  const i=document.getElementById('lib-search-inp');clearTimeout(_pkT);
  if(i)i.value='';pickerSearch('');
  if(i){try{i.focus({preventScroll:true});}catch(e){}}
}
// Zona (null: el inicio · 'all': todas, por zonas) y, si se da, su subzona (solo vale dentro de su zona)
function pickerSetMuscle(m,sub){
  const st=_pickerState;if(!st)return;
  st.filterMuscle=m==='all'||MUSCLE_GROUPS.some(g=>g.id===m)?m:null;
  st.filterSub=SUB_BY_ID[sub]&&SUB_BY_ID[sub].z===st.filterMuscle?sub:null;
  _pickerRefresh();
}
function pickerSetSub(s){const st=_pickerState;if(!st)return;st.filterSub=SUB_BY_ID[s]&&SUB_BY_ID[s].z===st.filterMuscle?s:null;_pickerRefresh();}
// Material: 'all', 'free' (sin máquina) o uno; se mantiene al cambiar de zona
function pickerSetMat(k){const st=_pickerState;if(!st)return;st.mat=k==='free'||MAT[k]?k:'all';_pickerRefresh();}
// (compatibilidad) el filtro de equipo de antes: 'cable' es la polea
function pickerSetEq(q){if(LIB_EQ.some(x=>x.id===q))pickerSetMat(q==='cable'?'polea':q);}
// Gimnasio | Casa: se guarda (la próxima vez abre donde lo dejaste); en «ocupada» manda tu rutina. La primera vez que
// eliges Casa (aún no has dicho tu material) se abre «Mi material».
function pickerSetPlace(p){
  const st=_pickerState;if(!st||st.mode==='busy'||(p!=='g'&&p!=='c'))return;
  if(S.libPlace!==p){S.libPlace=p;saveState();}
  st.ctx=_libCtx();_pickerRefresh();
  if(p==='c'&&S.libKit===null)openLibKit();
}
// Radios con tabindex itinerante: flechas (cambian de uno a otro), Inicio (Gimnasio) y Fin (Casa)
function pickerPlaceKey(ev){
  const to=ev.key==='Home'?'g':ev.key==='End'?'c':/^Arrow(Left|Right|Up|Down)$/.test(ev.key)?_pickerPlace()==='c'?'g':'c':null;
  if(!to)return;
  ev.preventDefault();if(to!==_pickerPlace())pickerSetPlace(to);
  const b=!_libKitOpen&&document.querySelector('#lib-place [aria-checked="true"]');if(b)b.focus();
}
function pickerMore(k){const st=_pickerState;if(!st)return;st.more[k]=!st.more[k];_pickerRefresh(true);}
function pickerTail(){const st=_pickerState;if(!st)return;st.tail=!st.tail;_pickerRefresh(true);}
function pickerRelax(){
  const st=_pickerState,r=st&&_pickerRelaxOpt();if(!r)return;
  if(r.s.place){pickerSetPlace(r.s.place);return;}
  if('kit' in r.s){openLibKit();return;}
  if('search' in r.s){pickerClear();return;}
  Object.assign(st,r.s);_pickerRefresh();
}
function pickerPick(libId){
  const libEx=LIB_BY_ID.get(libId);
  if(!libEx||!_pickerState)return;
  const cb=_pickerState.onPick,op=_pickerState.opener,rf=_pickerState.refocus,root=document.getElementById('cmodal-root');
  closeLibDetail();_pickerStop();
  _pickerState=null;_libKitOpen=null;
  root.innerHTML='';
  _libTouch(libId);
  if(cb)cb(libEx);
  // el foco vuelve a quien abrió el selector si nadie lo ha movido: si lo repintó onPick (el editor), a su copia (refocus);
  // si onPick abrió otra ventana (trasladar historial), a ella
  const a=document.activeElement;if(a&&a!==document.body&&a.isConnected)return;
  let t=root.querySelector('button')||(op&&op.isConnected&&op!==document.body?op:null);
  if(!t&&rf){try{t=rf();}catch(e){}}
  _pkFocus(t);
}
function closeExercisePicker(){
  const st=_pickerState;
  closeLibDetail();_pickerStop();
  _pickerState=null;_libKitOpen=null;
  document.getElementById('cmodal-root').innerHTML='';
  if(st&&st.opener&&st.opener.isConnected&&st.opener.focus){try{st.opener.focus({preventScroll:true});}catch(e){}}
}
// Desde la ficha o desde «Parecidos», en el modo «máquina ocupada»: «Solo hoy» o «Cambiar en la rutina»
function pickerBusy(libId,how){
  const st=_pickerState;if(!st||!st.busy)return;const b=st.busy;
  closeExercisePicker();
  const d=getPlan()[b.dk],slot=d&&Array.isArray(d.ex)?d.ex.find(e=>e&&e.id===b.exId):null,lib=LIB_BY_ID.get(libId);
  if(!slot||!lib){toast('Ese ejercicio ya no está en tu rutina');render();return;}
  if(how==='today'){_applySoloHoy(b.dk,b.exId,libId);return;}
  if(_slotMarks(slot)){toast(`Ya llevas series de ${slot.n}: termínalo antes de cambiarlo`);render();return;}
  _libTouch(libId);
  _routineSwapTo(b.dk,slot,lib,{keepToday:false,after:nx=>{S.open=nx.id;}});
}
// ── Ficha de un ejercicio (encima del selector): su animación 3D en vivo (arrastra para girar, toca para pausar) o, si no
// tiene, su mapa muscular; ☆ favorito; material · zona · dificultad; sus 3 músculos principales, patrón y tipo; si aquí no
// puedes hacerlo, por qué (y «La tengo» si es por tu material de casa); consejo; tu historial (lo último en su medida:
// kg, reps, segundos o metros) y la acción del selector ──
const LIB_DIF=['','Principiante','Intermedio','Avanzado'];
function _libDetailHtml(e){
  const st=_pickerState,sp=typeof GymAnim!=='undefined'&&GymAnim.get?GymAnim.get(e.id):null,id=esc(e.id);
  const plan=getPlan(),days=_libInPlan()[e.id]||[],cur=st.currentLib===e.id,hist=_libHistMap()[e.id]||null,fav=(S.libFav||[]).includes(e.id);
  const pl=_pickerPlace(),m=_mat(e),why=libWhyNot(e,pl,st.ctx.kit,st.ctx.places),g=MUSCLE_GROUPS.find(x=>x.id===_grp(e));
  const sub=[e.eq||matLabel(m),g?_zoneLbl(g):'',LIB_DIF[e.dif]||''].filter(Boolean).join(' · ');
  const mus=_libMusLbl(e,3),pat=!e.cardio&&PAT_LBL[e.pat]||'',low=x=>String(x).toLowerCase(); // el patrón, si no repite un músculo («Antebrazo»)
  const tags=[...mus.map(l=>`<span class="mchip">${esc(l)}</span>`),
    pat&&!mus.some(l=>low(l)===low(pat))?`<span class="lib-d-tag">${esc(pat)}</span>`:'',
    `<span class="lib-d-tag">${e.cardio?'Cardio':e.compound?'Multiarticular':'Aislamiento'}</span>`,
    st.station&&!cur&&_stationOf(e.eq,e)===st.station?'<span class="lib-d-tag">Misma máquina</span>':'',
    cur||days.length?`<span class="lib-d-tag in">${cur?'Actual':'En tu rutina'}${days.length?' · '+days.map(d=>esc(plan[d]?.label||d)).join(', '):''}</span>`:''].filter(Boolean).join('');
  const vis=sp?`<div class="ex-anim lib-d-anim" data-ex="lib-detail" data-gym-anim="${id}"></div>`
    :Object.keys(e.mus||{}).length?`<div class="lib-d-map"><svg class="lib-fig" viewBox="0 0 60 40" aria-hidden="true" style="${_libFigStyle(e)}"><use href="#lib-fig"/></svg></div>`:'';
  const need=why?`<div class="lib-d-need"><span class="lib-why">${esc(why)}</span>${pl==='c'&&libAtPlace(e,pl)&&(MAT[m]||{}).home?`<button type="button" class="btn bs lib-have" data-k="${esc(m)}" onclick="libKitHave(this.dataset.k)">La tengo</button>`:''}</div>`:'';
  const last=hist?_libLastTxt(e,hist):'';
  let hh;
  if(last){
    const nk=_histNoKg(hist),L=nk?hist.lastAny:hist.last,recs=nk?[]:(S.strength[hist.key]||[]).filter(r=>r&&typeof r==='object'&&+r.v>0);
    hh=`Tu historial: <b>${plural(hist.n,'sesión','sesiones')}</b> · último ${_nwX(last)}${L.d?' ('+esc(L.d)+')':''}${recs.length>1?` · mejor ${esc(kgTxt(Math.max(...recs.map(r=>+r.v))))}${NB}kg`:''}`
      +(recs.length>=2?`<div class="carea">${spark(recs.slice(-10),'var(--green)')}</div>`:'');
  }else hh=e.cardio?'Cardio: elige un ritmo que puedas mantener todo el tiempo.':e.lt!=='w'?'Aún no lo has hecho: céntrate en la técnica y apunta lo que hagas; desde la próxima vez te diré cuánto buscar.':'Aún no lo has hecho: empieza con un peso cómodo y céntrate en la técnica.';
  let acts='',note='';
  const back=`<button type="button" class="btn bs" onclick="closeLibDetail()">← Volver</button>`;
  if(st.mode==='busy'){
    const otherPlan=days.length>0&&!cur;
    if(cur){acts=back;note=`<div class="lib-d-note">Es el ejercicio de tu rutina.</div>`;}
    else{acts=`<button type="button" class="btn bp" data-lib="${id}" onclick="pickerBusy(this.dataset.lib,'today')"${otherPlan?' disabled style="opacity:.45"':''}>Solo hoy</button><button type="button" class="btn bs" data-lib="${id}" onclick="pickerBusy(this.dataset.lib,'routine')">Cambiar en la rutina</button>`;
      note=`<div class="lib-d-note">${otherPlan?`Ya está en tu rutina (${days.map(d=>esc(plan[d]?.label||d)).join(', ')}): para hoy elige otro.`:'«Solo hoy» se guarda en su propio historial y tu rutina no cambia.'}</div>`;}
  }else{
    const dl=esc(plan[st.dayKey]?.label||'día'),lbl=st.mode==='add'?`Añadir al ${dl}`:st.mode==='swap'?'Cambiar por este':'Elegir';
    const no=st.mode==='swap'&&cur?'Es el actual':st.mode==='add'&&days.includes(st.dayKey)?`Ya está en el ${dl}`:''; // (añadirlo otra vez lo repetiría)
    acts=back+(no?`<button type="button" class="btn bp" disabled style="opacity:.45">${no}</button>`
      :`<button type="button" class="btn bp" data-lib="${id}" onclick="pickerPick(this.dataset.lib)">${lbl}</button>`);
  }
  return`<div class="hist-over" onclick="if(event.target===this)closeLibDetail()" style="z-index:510"><div class="hist-sheet" id="lib-dsheet" role="dialog" aria-modal="true" aria-labelledby="lib-d-title" style="max-height:calc(92vh - var(--kb));max-height:calc(92dvh - var(--kb))">
    <div class="hist-sheet-head lib-d-hd"><div class="hist-sheet-hdl"></div>
      <div class="hist-sheet-title" id="lib-d-title">${esc(e.n)}</div><div class="hist-sheet-sub">${esc(sub)}</div>
      <button type="button" class="hist-sheet-close x44 lib-fav" id="lib-fav" data-lib="${id}" aria-pressed="${fav}" aria-label="Favorito" onclick="libToggleFav(this.dataset.lib)">${fav?'★':'☆'}</button>
      <button type="button" class="hist-sheet-close x44" onclick="closeLibDetail()" aria-label="Volver a la lista">✕</button></div>
    <div class="hist-sheet-body">
      ${vis}
      <div class="lib-d-head">${tags}</div>${need}
      <div class="tip">${_tipHtml(e.tip)}</div>
      <div class="lib-d-hist">${hh}</div>
      <div class="lib-d-acts">${acts}</div>${note}
    </div></div></div>`;
}
function pickerDetail(libId){
  const e=LIB_BY_ID.get(libId),root=document.getElementById('cmodal-root');
  if(!_pickerState||!e||!root)return;
  closeLibDetail();
  // (la fila que la abre: Safari no da el foco a un botón al tocarlo, y entonces vale la primera fila suya)
  const a=document.activeElement;_libDetail=libId;_libDetailOp=a&&a.dataset&&a.dataset.lib===libId?a:null;
  const w=document.createElement('div');w.id='lib-detail';w.innerHTML=_libDetailHtml(e);
  root.appendChild(w);
  if(typeof GymAnim!=='undefined'){
    try{GymAnim.mountAll(w);}catch(err){}
    // sin animación: su mapa muscular (si el motor no está, queda la figura teñida)
    const mp=w.querySelector('.lib-d-map');
    if(mp&&GymAnim.muscleMap){try{GymAnim.muscleMap(mp,{weights:e.mus,label:'Músculos: '+_libMusLbl(e,3).join(', '),view:'both',hint:false,breathe:false});mp.classList.add('on');}catch(err){}}
  }
  const b=w.querySelector('.lib-d-acts .bp:not([disabled])')||w.querySelector('.lib-d-acts .btn:not([disabled])')||w.querySelector('.hist-sheet-close'); // (sin acción: «← Volver», no ☆)
  if(b){try{b.focus({preventScroll:true});}catch(err){}}
}
// Al cerrarla, si el foco estaba en ella, vuelve a la fila que la abrió (en el inicio un ejercicio puede salir en más de una
// sección); si ya no está (p. ej. quitaste el ☆ en «Favoritos»), a otra fila suya o a la hoja
let _libDetailOp=null;
function closeLibDetail(){
  const w=document.getElementById('lib-detail'),id=_libDetail,op=_libDetailOp,inD=!!w&&(w.contains(document.activeElement)||document.activeElement===document.body);
  if(w){w.querySelectorAll('[data-gym-anim],.lib-d-map').forEach(a=>{if(typeof GymAnim!=='undefined'&&GymAnim.unmount){try{GymAnim.unmount(a);}catch(e){}}});w.remove();}
  _libDetail=null;_libDetailOp=null;
  if(inD&&id)_pkFocus(op&&op.isConnected&&op!==document.body?op:document.querySelector(`#lib-list .lib-row[data-lib="${id}"]`)||document.getElementById('lib-sheet'));
}
// Tab no sale de la hoja de arriba (Mi material → ficha → selector → «¿Máquina ocupada?»): del último control vuelve al
// primero y al revés (si el foco está fuera o en la propia hoja, entra por un extremo)
function _sheetTrap(ev){
  const sh=document.querySelector('#lib-kit .hist-sheet')||document.querySelector('#lib-detail .hist-sheet')||document.getElementById('lib-sheet')||document.getElementById('busy-sheet');if(!sh)return;
  const f=[...sh.querySelectorAll('button:not([disabled]),input,[tabindex="0"]')].filter(x=>x.tabIndex>=0&&x.getClientRects().length);if(!f.length)return;
  const a=f[0],z=f[f.length-1],c=document.activeElement,to=!sh.contains(c)||c===sh?ev.shiftKey?z:a:ev.shiftKey&&c===a?z:!ev.shiftKey&&c===z?a:null;
  if(to){ev.preventDefault();try{to.focus();}catch(e){}}
}
// ☆ en la ficha: el primero de «Favoritos» (como mucho 100). La lista de detrás se entera (★ en su fila; en el inicio, su sección).
function libToggleFav(id){
  if(!LIB_BY_ID.has(id))return;
  const a=Array.isArray(S.libFav)?S.libFav:[],on=!a.includes(id);
  S.libFav=on?[id,...a].slice(0,100):a.filter(x=>x!==id);saveState();
  const b=document.getElementById('lib-fav');if(b&&b.dataset.lib===id){b.setAttribute('aria-pressed',on);b.textContent=on?'★':'☆';}
  const st=_pickerState;if(!st)return;
  st.ctx=_libCtx();st.favS=new Set(st.ctx.fav);
  if(st.R&&st.R.view==='idle'){_pickerRefresh(true);return;}
  document.querySelectorAll(`#lib-list .lib-row[data-lib="${id}"] .lib-item-n`).forEach(n=>{n.innerHTML=(on?'<span class="lib-star" role="img" aria-label="Favorito">★</span> ':'')+esc(LIB_BY_ID.get(id).n);});
}
// ── «Mi material» (casa): marca lo que tienes; cada toque se guarda y la lista de detrás cambia en el acto. Se abre sola la
// primera vez que eliges Casa, con 🎒 y con «+N ›»; sin material siempre cuenta. Cada material dice cuántos ejercicios de
// casa lo usan (+N). ──
let _libKitNs=null;
function _libKitN(){
  if(_libKitNs)return _libKitNs;
  const n={};EXERCISE_DB.forEach(e=>{const k=_mat(e);if(libAtPlace(e,'c')&&MAT[k]&&MAT[k].home)n[k]=(n[k]||0)+1;});
  return(_libKitNs=n);
}
// Cuántos verás al pulsar «Listo · ver N ejercicios»: lo de la lista o, si aún no has dicho tu material, lo que se hace
// sin material («Listo» sin marcar nada lo deja así)
function _pickerShown(){
  const st=_pickerState,R=st&&(st.ctx.kit===null&&_pickerPlace()==='c'?libQuery(Object.assign(_pickerArgs(),{kit:[]})):st.R);
  return R?R.n:0;
}
function _libKitHtml(){
  const kit=Array.isArray(S.libKit)?S.libKit:[],N=_libKitN(),ks=Object.keys(MAT).filter(k=>MAT[k].home&&N[k]).sort((a,b)=>(a==='otro')-(b==='otro')||N[b]-N[a]);
  return`<div class="hist-over" onclick="if(event.target===this)closeLibKit()" style="z-index:520"><div class="hist-sheet" id="lib-ksheet" role="dialog" aria-modal="true" aria-labelledby="lib-k-title">
    <div class="hist-sheet-head" style="padding-right:60px"><div class="hist-sheet-hdl"></div>
      <div class="hist-sheet-title" id="lib-k-title">Mi material</div><div class="hist-sheet-sub">Marca lo que tienes en casa y verás lo que puedes hacer con ello. Sin material siempre cuenta.</div>
      <button type="button" class="hist-sheet-close x44" onclick="closeLibKit()" aria-label="Cerrar">✕</button></div>
    <div class="hist-sheet-body">
      <div class="lib-kit" role="group" aria-label="Tu material">${ks.map(k=>`<button type="button" class="lib-kt" data-k="${k}" aria-pressed="${kit.includes(k)}" aria-label="${esc(MAT[k].l)}: ${plural(N[k],'ejercicio')}" onclick="libKitToggle(this.dataset.k)"><span class="lib-kt-n">${esc(MAT[k].l)}<span class="lib-kt-c" aria-hidden="true">+${N[k]}</span></span></button>`).join('')}</div>
      <button type="button" class="btn bp lib-kit-ok" onclick="closeLibKit(1)">Listo · ver ${plural(_pickerShown(),'ejercicio')}</button>
      <button type="button" class="mat-link lib-kit-all" onclick="closeLibKit(1);openMyMaterial(_pickerPlace(),{from:'picker'})">Tu gimnasio y el tipo de sitio ›</button>
    </div></div></div>`;
}
function openLibKit(){
  const root=document.getElementById('cmodal-root');if(!_pickerState||!root)return;
  const o=_libKitOpen&&_libKitOpen.opener;closeLibKit();
  _libKitOpen={opener:o||document.activeElement};_libKitOpen.key=_pkKey(_libKitOpen.opener);
  const w=document.createElement('div');w.id='lib-kit';w.innerHTML=_libKitHtml();root.appendChild(w);
  const b=w.querySelector('.lib-kt');if(b){try{b.focus({preventScroll:true});}catch(e){}}
}
// Cerrar (✕, fuera, Escape) deja tu material como esté; «Listo» sin marcar nada cuenta como «solo sin material»
function closeLibKit(done){
  const w=document.getElementById('lib-kit'),k=_libKitOpen;_libKitOpen=null;
  if(w)w.remove();
  if(done&&S.libKit===null){S.libKit=[];saveState();_libKitChanged();}
  // el foco vuelve a quien la abrió (o a su copia si la lista se repintó: «+N con más material», «Hay N…») o a 🎒
  const kb=document.getElementById('lib-kitbtn'),o=k&&(k.opener&&k.opener.isConnected&&k.opener!==document.body?k.opener:_pkFind(k.key)||(kb&&!kb.hidden?kb:null));
  if(o&&k)_pkFocus(o);
}
function libKitToggle(k){
  if(!MAT[k]||!MAT[k].home)return;
  const kit=Array.isArray(S.libKit)?S.libKit:[];
  S.libKit=kit.includes(k)?kit.filter(x=>x!==k):[...kit,k];saveState();_libKitChanged();
}
// «La tengo» en la ficha: ese material pasa a tu material de casa
function libKitHave(k){
  if(!MAT[k]||!MAT[k].home)return;
  const kit=Array.isArray(S.libKit)?S.libKit:[];if(!kit.includes(k)){S.libKit=[...kit,k];saveState();}
  _libKitChanged();
  // el botón se va: el foco pasa al aviso que lo sustituye (o a la acción de la ficha)
  const n=document.querySelector('#lib-detail .lib-d-need');if(!n)return;
  n.outerHTML=`<div class="lib-d-need ok" tabindex="-1">✓ ${esc(MAT[k].l)}: añadido a tu material</div>`;
  const a=document.activeElement;
  if(!a||a===document.body||!a.isConnected)_pkFocus(document.querySelector('#lib-detail .lib-d-need')||document.querySelector('#lib-detail .lib-d-acts .bp:not([disabled])'));
}
// Tu material cambió: la lista (sin volver arriba), la hoja abierta y su «Listo · ver N»
function _libKitChanged(){
  // (E3b) tu material de casa del selector es el de places.c: lo que no es de casa (barra, máquinas…) se queda
  if(_isPlainObj(S.places)&&S.places.c&&Array.isArray(S.libKit)){const c=S.places.c;c.mats=[...new Set([...c.mats.filter(k=>!(MAT[k]&&MAT[k].home)),...S.libKit])];saveState();}
  const st=_pickerState;if(!st)return;
  st.ctx=_libCtx();_pickerRefresh(true);
  const w=document.getElementById('lib-kit');if(!w)return;
  const kit=S.libKit||[];w.querySelectorAll('.lib-kt').forEach(b=>b.setAttribute('aria-pressed',kit.includes(b.dataset.k)));
  const ok=w.querySelector('.lib-kit-ok');if(ok)ok.textContent='Listo · ver '+plural(_pickerShown(),'ejercicio');
}

// ── DRAG & DROP TÁCTIL PARA REORDENAR ─────────────────────────
// Reordena en memoria + intercambio visual durante el gesto.
// Solo re-renderiza al soltar (evita perder el item arrastrado mid-touch).
function initDragDrop(dayKey){
  const container=document.querySelector('#settings-root .hist-sheet-body');
  if(!container)return;
  const items=container.querySelectorAll('.edit-ex-item');
  items.forEach(item=>{
    const handle=item.querySelector('.drag-handle');
    if(!handle||handle._dragBound)return;
    handle._dragBound=true;
    let startY=0,startIdx=0,curIdx=0,dragging=false,itemH=0;

    const onStart=e=>{
      const touch=e.touches?e.touches[0]:e;
      startY=touch.clientY;
      startIdx=parseInt(item.dataset.idx)||0;
      curIdx=startIdx;
      itemH=item.offsetHeight+8;
      dragging=true;_edDragging=true;
      item.classList.add('dragging');
      item.style.zIndex='10';
      item.style.position='relative';
      if(e.cancelable)e.preventDefault();
    };
    const onMove=e=>{
      if(!dragging)return;
      const touch=e.touches?e.touches[0]:e;
      const dy=touch.clientY-startY;
      const maxIdx=getPlan()[dayKey].ex.length-1;
      const targetIdx=Math.max(0,Math.min(maxIdx,startIdx+Math.round(dy/itemH)));
      // Translate visual del item arrastrado
      item.style.transform=`translateY(${dy}px)`;
      // Mover otros items con CSS transform sin tocar el DOM
      if(targetIdx!==curIdx){
        curIdx=targetIdx;
      }
      if(e.cancelable)e.preventDefault();
    };
    const onEnd=()=>{
      if(!dragging)return;
      dragging=false;_edDragging=false;
      item.classList.remove('dragging');
      item.style.transform='';
      item.style.zIndex='';
      item.style.position='';
      // Aplicar el reorden final al modelo
      if(curIdx!==startIdx){
        const plan=getPlan();
        const arr=plan[dayKey].ex;
        const moved=arr.splice(startIdx,1)[0];
        arr.splice(curIdx,0,moved);
        saveState();
        render(); // repinta la app y el editor, que sigue abierto
      }
    };

    handle.addEventListener('touchstart',onStart,{passive:false});
    handle.addEventListener('touchmove',onMove,{passive:false});
    handle.addEventListener('touchend',onEnd);
    handle.addEventListener('touchcancel',onEnd);
    // Soporte mouse para desktop
    handle.addEventListener('mousedown',e=>{
      onStart(e);
      const mm=ev=>onMove(ev);
      const mu=()=>{onEnd();document.removeEventListener('mousemove',mm);document.removeEventListener('mouseup',mu);};
      document.addEventListener('mousemove',mm);
      document.addEventListener('mouseup',mu);
    });
  });
}

