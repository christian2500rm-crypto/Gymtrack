// ══════════════════════════════════════════════════════════
// (E2) ESQUEMA 21: TUS RESPUESTAS, TUS SITIOS, TU SALUD, LA RUTINA GENERADA Y EL BORRADOR DEL CUESTIONARIO
// Listas cerradas y saneado de cada clave nueva, al cargar y al importar (como _sanitizeLibPrefs). Lo que no casa se quita;
// una forma rota pasa a null. Los textos que vengan de una copia se pintan siempre escapados.
// ══════════════════════════════════════════════════════════
const PROF_GOALS=['musculo','fuerza','grasa','salud','aguante'],PROF_EXP=['cero','lt6m','6m2a','gt2a','paron'],PROF_RITMO=['semanas','meses','nose'];
const PROF_PARON_ANTES=['lt6m','6m2a','gt2a'],PROF_PARON_FUERA=['2a6m','gt6m','gt2a'],PROF_LEVELS=['P0','P','I','A'];
const PROF_MINS=[15,20,30,45,60,75,90],PROF_AGES=['16','18','40','65','75','nd'],PROF_SPORT=['no','suave','piernas','agua'];
const PROF_PRIO=['pecho','espalda','hombros','brazos','gluteos','piernas','abdomen'],PROF_STYLE=['maq','libre','igual'];
const PROF_WARM=['normal','corto'],PROF_CARDIO=['auto','si','no'];
const PROF_PLAN=['cc3','tpc3','tpt3','ppl3','tp4','pplt4','pplc4','grp4','ulppl','tptpt5','pplet5','grp5','ppl6','tp6','pplg6']; // (P1) el reparto que elige la persona en «Cambiar reparto»
const PROF_SEX=['m','h','nd'],PROF_ENFOQUE=['gluteo','torso','igual']; // (D10) mujer · hombre · prefiero no decirlo; enfoque de la rutina
// Sitios: presets (P5), accesorios (§K.1, con las cosas de casa), familias de máquina (13) y tipos de cardio (9)
const PLACE_PRESETS=['grande','barrio','hotel','box','nada','basico','mancbanco','casagym','parque','propio'];
const PLACE_ACC=['mesa','puerta','silla','pared','escalon','banco','banco_inc','banco_dec','scott','ghd','hiper','rack','landmine','hexbar','anclaje','paralelas',
  'agarre_neutro','kb2','anillas','poleas2','trineo','llanta','cuerdas','saco','bici_ext','piscina'];
const MACH_FAMS=['prensa','extension','curlfem','abdaduct','gemelos','gluteo','lumbares','jalonremo','pecho','contractora','hombro','brazos','abdominales'];
const CARD_KINDS=['cinta','bici','reclinada','spinning','bici_aire','eliptica','remo','escaladora','esqui'];
const PLACE_DBMAX=[10,20,30,99],PLACE_KB=[1,2],PLACE_KBMAX=[8,12,16,24];
// Salud: zonas y tipo de molestia; versión del texto del consentimiento
const HEALTH_ZONES=['rodilla','hombro','lumbar','muneca','cadera','otra'],HEALTH_KINDS=['ahora','antigua','op','reciente'],HEALTH_OTRA=['cuello','tobillo','otra'];
const HEALTH_CONSENT_VER=['1'];
// Pantallas del cuestionario (para retomar el borrador en la suya)
const OB_STEPS=['ob-hola','ob-meta','ob-sexo','ob-exp','ob-ritmo','ob-paron','ob-tiempo','ob-lugar','ob-material','ob-otro','ob-lugar2','ob-material2',
  'ob-reparto-sitios','ob-edad','ob-menor','ob-salud','ob-medico','ob-supervision','ob-posparto','ob-embarazo','ob-molestias','ob-deporte','ob-consulta','ob-enfoque','ob-foco','ob-rutina']; // (P2) la pregunta de torso y pierna, antes de las prioridades
const _LIBID_RE=/^lib_[a-z0-9_]{2,60}$/;
const _oneOf=(v,L)=>L.includes(v)?v:null;
const _num=(v,lo,hi)=>typeof v==='number'&&isFinite(v)&&v>=lo&&v<=hi?v:null;
const _bool=v=>v===true;
function _ids(a,n,re){return Array.isArray(a)?[...new Set(a.filter(x=>typeof x==='string'&&re.test(x)))].slice(0,n):[];}
// Respuestas (sin datos de salud). days fuera de 2-6 → null (se vuelve a preguntar); min, al permitido más cercano.
function _sanitizeProfile(o){
  if(!_isPlainObj(o))return null;
  const p={v:1,ts:_num(o.ts,0,9e15)||Date.now(),mode:_oneOf(o.mode,['gen','own'])||'own'};
  p.goal=_oneOf(o.goal,PROF_GOALS);p.exp=_oneOf(o.exp,PROF_EXP);
  p.ritmo=p.exp==='gt2a'?_oneOf(o.ritmo,PROF_RITMO):null;
  p.paron=p.exp==='paron'&&_isPlainObj(o.paron)&&PROF_PARON_ANTES.includes(o.paron.antes)&&PROF_PARON_FUERA.includes(o.paron.fuera)?{antes:o.paron.antes,fuera:o.paron.fuera}:null;
  p.levelManual=_oneOf(o.levelManual,PROF_LEVELS);
  const d=parseInt(o.days);p.days=Number.isInteger(d)&&d>=2&&d<=6?d:null;
  const m=+o.min;p.min=isFinite(m)&&m>0?PROF_MINS.reduce((b,x)=>Math.abs(x-m)<Math.abs(b-m)?x:b,PROF_MINS[0]):null;
  p.consec=_bool(o.consec);
  p.tope=typeof o.tope==='boolean'?o.tope:null; // (D5) «4 de pesas y el resto, cardio suave» (true) o «todos de pesas» (false)
  const dO=parseInt(o.daysOther);p.daysOther=Number.isInteger(dO)&&dO>=0&&dO<=5&&(p.days==null||dO<p.days)?dO:0;
  p.age=_oneOf(o.age,PROF_AGES);p.ageTs=p.age?_num(o.ageTs,0,9e15):null;
  p.sport=_oneOf(o.sport,PROF_SPORT);
  p.prio=Array.isArray(o.prio)?[...new Set(o.prio.filter(x=>PROF_PRIO.includes(x)))].slice(0,2):[];
  const pf=_isPlainObj(o.pref)?o.pref:{};p.pref={impact:pf.impact!==false,floor:pf.floor!==false};
  p.style=_oneOf(o.style,PROF_STYLE)||'igual';p.warm=_oneOf(o.warm,PROF_WARM)||'normal';p.cardioEnd=_oneOf(o.cardioEnd,PROF_CARDIO)||'auto';
  p.power=_bool(o.power);
  p.avoid=_ids(o.avoid,100,_LIBID_RE);
  const ds=_isPlainObj(o.dismiss)?o.dismiss:{};p.dismiss={};['own','invite','safety','weight','cycle','repaso'].forEach(k=>{p.dismiss[k]=_num(ds[k],0,9e15);}); // (E15) cycle: «¿Cómo seguimos?» contestado · (E16c) repaso anual
  p.nr=_oneOf(o.nr,['ent','pro','med']);
  p.warn=_oneOf(o.warn,['consulta','matrona']); // (E11b) aviso fijo de salud (§H.2): solo cuál, no el motivo // (E9a) sin rutina automática: qué tarjeta enseñar (no guarda el motivo)
  p.forma=_oneOf(o.forma,['dias','recomendado']); // (P9) la forma de reparto elegida a mano en «Cambiar reparto» (null: la de salida de tu nivel)
  p.plan=_oneOf(o.plan,PROF_PLAN); // (P1) reparto elegido (null: el recomendado); el generador lo ignora si ya no se te ofrece
  p.sex=_oneOf(o.sex,PROF_SEX);p.enfoque=_oneOf(o.enfoque,PROF_ENFOQUE); // (D10) más glúteo y pierna · (P2 del repaso del reparto) para todos, y «torso» = un solo día de pierna
  return p;
}
// Un sitio (gimnasio o casa): material de MAT, accesorios, familias de máquina y tipos de cardio de sus listas; preset desconocido → 'propio'
function _sanitizePlace(o){
  if(!_isPlainObj(o))return null;
  const sub=(v,L)=>v==='all'?'all':Array.isArray(v)?[...new Set(v.filter(x=>L.includes(x)))]:[];
  return{preset:_oneOf(o.preset,PLACE_PRESETS)||'propio',
    mats:Array.isArray(o.mats)?[...new Set(o.mats.filter(k=>typeof k==='string'&&k!=='corporal'&&Object.prototype.hasOwnProperty.call(MAT,k)))]:[],
    acc:Array.isArray(o.acc)?[...new Set(o.acc.filter(k=>PLACE_ACC.includes(k)))]:[],
    mach:sub(o.mach,MACH_FAMS),card:sub(o.card,CARD_KINDS),
    dbMax:_oneOf(o.dbMax,PLACE_DBMAX),kb:_oneOf(o.kb,PLACE_KB),kbMax:_oneOf(o.kbMax,PLACE_KBMAX),
    recalTs:_num(o.recalTs,0,9e15)}; // (E3c) «Es otro gimnasio»: las máquinas, desde cero (el Coach no propone el peso de antes)
}
function _sanitizePlaces(o){
  if(!_isPlainObj(o))return null;
  const g=_sanitizePlace(o.g),c=_sanitizePlace(o.c);if(!g&&!c)return null;
  let main=_oneOf(o.main,['g','c'])||(g?'g':'c');if(main==='g'&&!g)main='c';if(main==='c'&&!c)main='g';
  return{v:1,main,g,c};
}
// Salud: SOLO con un consentimiento válido (fecha y versión del texto); sin él, no se guarda nada (§I.2)
function _sanitizeHealth(o){
  if(!_isPlainObj(o)||!_isPlainObj(o.consent)||_num(o.consent.ts,1,9e15)==null||!HEALTH_CONSENT_VER.includes(o.consent.ver))return null;
  const z={};if(_isPlainObj(o.zones))HEALTH_ZONES.forEach(k=>{if(HEALTH_KINDS.includes(o.zones[k]))z[k]=o.zones[k];});
  return{v:1,ts:_num(o.ts,0,9e15)||o.consent.ts,consent:{ts:o.consent.ts,ver:o.consent.ver},zones:z,otraTxt:z.otra?_oneOf(o.otraTxt,HEALTH_OTRA):null,
    huesos:_bool(o.huesos),posparto:_bool(o.posparto),prudent:_bool(o.prudent),screenTs:_num(o.screenTs,0,9e15)};
}
// Un plan que viene de fuera (rutina anterior, base de la generada, rutina aceptada del borrador): días A…F con sus textos
// acotados, ejercicios con buena forma y sin las claves del catálogo (como el plan importado)
function _sanitizePlanCopy(plan,ref){
  if(!_isPlainObj(plan))return null;
  const p=JSON.parse(JSON.stringify(plan));
  Object.keys(p).forEach(k=>{if(!(DAY_KEYS.includes(k)&&_isPlanDay(p[k])))delete p[k];});
  if(!dayKeys(p).length)return null;
  dayKeys(p).forEach(k=>{const d=p[k];
    if(d.label!=null)d.label=String(d.label).slice(0,80);if(d.focus!=null)d.focus=String(d.focus).slice(0,200);
    if(d.did!=null&&!(typeof d.did==='string'&&DID_RE.test(d.did)))delete d.did;
    d.ex=d.ex.filter(_isPlainObj);d.ex.forEach(ex=>{['n','eq','tip','ic','r'].forEach(f=>{if(ex[f]!=null)ex[f]=String(ex[f]).slice(0,300);});
      if(ex.s!=null)ex.s=ex.cardio?1:Math.max(1,Math.min(10,parseInt(ex.s)||3));_slimEx(ex);delete ex.sub;
      if(ref)_impExId(ex,ref);else if(!(typeof ex.id==='string'&&ex.id&&ex.id.length<=80&&!/['"<>\\]/.test(ex.id)))ex.id='ex_'+Date.now()+'_'+Math.random().toString(36).slice(2,6);});});
  return p;
}
// La rutina generada en uso: listas cerradas, mapas por día solo con ids que existan en su rutina, números acotados
const PM_REPARTO=['recomendado','dias'],PM_EFFORT=['facil','justo'],PM_SUBIDAS=['lenta','normal'],PM_VUELTA=['recalibrar','menos20','subirNivel'];
const _CODE_RE=/^[a-z][a-z0-9_]{0,39}$/;
function _sanitizeCodes(L){ // por qué y avisos: códigos con sus datos (no prosa), ≤ 60
  return Array.isArray(L)?L.filter(x=>_isPlainObj(x)&&typeof x.c==='string'&&_CODE_RE.test(x.c)).slice(0,60).map(x=>{
    let p=null;try{p=x.p==null?null:JSON.parse(JSON.stringify(x.p));}catch(e){p=null;}
    if(p!=null&&JSON.stringify(p).length>800)p=null;return{c:x.c,p};}):[];
}
function _sanitizePlanMeta(o,plan){
  if(!_isPlainObj(o)||typeof o.id!=='string'||!PID_RE.test(o.id))return null;
  const dids=new Set(dayKeys(_isPlainObj(plan)?plan:{}).map(k=>plan[k].did).filter(Boolean));
  const byDid=(m,ok)=>{const r={};if(_isPlainObj(m))Object.keys(m).forEach(d=>{if(dids.has(d)&&ok(m[d]))r[d]=m[d];});return r;};
  const didList=(a,n)=>Array.isArray(a)?a.filter(d=>dids.has(d)).slice(0,n):null;
  const m={v:1,id:o.id,ts:_num(o.ts,0,9e15)||Date.now(),gen:_num(o.gen,0,999)||0,cat:typeof o.cat==='string'?o.cat.slice(0,40):'',
    reparto:_oneOf(o.reparto,PM_REPARTO)||'dias',split:typeof o.split==='string'?o.split.slice(0,24):'',K:_num(o.K,1,6),wd:_num(o.wd,1,6),
    tpl:byDid(o.tpl,v=>typeof v==='string'&&v.length<=8),dayPlace:byDid(o.dayPlace,v=>v==='g'||v==='c'),fd:byDid(o.fd,v=>_num(v,0,7)!=null),
    alternas:_bool(o.alternas),fz2:null,seq:didList(o.seq,14),cargaLigera:_bool(o.cargaLigera),lifts:_ids(o.lifts,12,_LIBID_RE),
    vuelta:_oneOf(o.vuelta,PM_VUELTA),rampa:null,effort:null,rest:null,vol:{},zone:{},modes:[],level:_oneOf(o.level,PROF_LEVELS),
    corto:_bool(o.corto),seed:_num(o.seed,0,4294967295)||0,alt:_num(o.alt,0,99)||0,sig:typeof o.sig==='string'?o.sig.slice(0,40):'',
    why:_sanitizeCodes(o.why),warn:_sanitizeCodes(o.warn),base:_sanitizePlanCopy(o.base,null),edited:_bool(o.edited),
    balMin:_num(o.balMin,0,15)||0,apx:byDid(o.apx,v=>[0,60,150,240].includes(v)),est:byDid(o.est,v=>_num(v,1,300)!=null), // (E5)
    pot:_bool(o.pot)}; // (E14a) potencia para 65 o más (§G.5)
  if(_isPlainObj(o.fz2)){const g=didList(o.fz2.gym,6),c=didList(o.fz2.casa,6);if(g&&c)m.fz2={gym:g,casa:c};}
  if(_isPlainObj(o.rampa))m.rampa={series:_num(o.rampa.series,1,6)||3,reps:typeof o.rampa.reps==='string'?o.rampa.reps.slice(0,10):'8-12',rir:_num(o.rampa.rir,0,5)};
  if(_isPlainObj(o.effort))m.effort={obj:_oneOf(o.effort.obj,PM_EFFORT)||'justo',rir:_num(o.effort.rir,0,5),subidas:_oneOf(o.effort.subidas,PM_SUBIDAS)||'normal'};
  if(_isPlainObj(o.rest)){const r={};['iso','comp','heavy','bw'].forEach(k=>{const v=Math.round(+o.rest[k]);if(v>=REST_MIN_S&&v<=REST_MAX_S)r[k]=v;});m.rest=Object.keys(r).length?r:null;}
  if(_isPlainObj(o.vol))Object.keys(o.vol).slice(0,20).forEach(g=>{const v=o.vol[g];if(/^[a-z_]{2,20}$/.test(g)&&_isPlainObj(v)){const x={};['v','dir','obj','top','techo'].forEach(f=>{const n=_num(v[f],0,99);if(n!=null)x[f]=n;});m.vol[g]=x;}});
  if(_isPlainObj(o.zone))Object.keys(o.zone).slice(0,20).forEach(g=>{const z=o.zone[g];if(/^[a-z_]{2,20}$/.test(g)&&Array.isArray(z)&&_num(z[0],1,40)!=null&&_num(z[1],1,40)!=null&&z[0]<z[1])m.zone[g]=[z[0],z[1]];});
  if(Array.isArray(o.modes))m.modes=[...new Set(o.modes.filter(x=>typeof x==='string'&&/^[a-z0-9]{1,16}$/.test(x)))].slice(0,12);
  return m;
}
// Un nivel de deshacer: la rutina de antes con lo que iba con ella; más de 180 días → nada
function _sanitizePlanPrev(o,ref){
  if(!_isPlainObj(o)||_num(o.ts,0,9e15)==null||Date.now()-o.ts>180*86400000)return null;
  const plan=_sanitizePlanCopy(o.plan,ref);if(!plan)return null;
  dayKeys(plan).forEach(k=>{if(!plan[k].did)plan[k].did=newDayId(plan);});
  const inPlan=k=>typeof k==='string'&&_isPlanDay(plan[k])?k:null;
  const wt=parseInt(o.weeklyTarget);
  return{ts:o.ts,src:_oneOf(o.src,['aplicar','restaurar','ejemplo'])||'aplicar',plan,weeklyTarget:Number.isInteger(wt)&&wt>=1&&wt<=7?wt:null,
    nextDay:inPlan(o.nextDay),day:inPlan(o.day),rotBack:inPlan(o.rotBack),meta:_sanitizePlanMeta(o.meta,plan),profile:_sanitizeProfile(o.profile),
    places:_sanitizePlaces(o.places),pendingCoachProposals:_sanitizeProposals(o.pendingCoachProposals),
    libPlace:o.libPlace==='c'?'c':'g',libKit:Array.isArray(o.libKit)?[...new Set(o.libKit.filter(k=>typeof k==='string'&&Object.prototype.hasOwnProperty.call(MAT,k)&&MAT[k].home))]:null};
}
// Borrador del cuestionario: SIN datos de salud (solo respuestas que no lo son); más de 30 días → empieza de nuevo
function _sanitizeObDraft(o){
  if(!_isPlainObj(o)||_num(o.ts,0,9e15)==null||Date.now()-o.ts>30*86400000)return null;
  const a=_sanitizeProfile(Object.assign({},_isPlainObj(o.a)?o.a:{},{mode:'gen'}));
  const pins={};if(_isPlainObj(o.pins))Object.keys(o.pins).slice(0,40).forEach(k=>{if(/^[A-Za-z0-9:_-]{1,40}$/.test(k)&&_LIBID_RE.test(o.pins[k]))pins[k]=o.pins[k];});
  const d={v:1,ts:o.ts,from:_oneOf(o.from,['first','settings'])||'first',step:_oneOf(o.step,OB_STEPS)||'ob-meta',a,alt:_num(o.alt,0,99)||0,pins,
    places:_sanitizePlaces(o.places),accepted:null};
  if(_isPlainObj(o.accepted)){const days=_sanitizePlanCopy(o.accepted.days,null);
    if(days){dayKeys(days).forEach(k=>{if(!days[k].did)days[k].did=newDayId(days);});const meta=_sanitizePlanMeta(o.accepted.meta,days);
      if(meta){meta.why=meta.why.filter(x=>!/^(zona|salud|huesos|posparto|prud)/.test(x.c));meta.warn=meta.warn.filter(x=>!/^(zona|salud|huesos|posparto|prud)/.test(x.c));}
      d.accepted={days,meta,weeklyTarget:_num(o.accepted.weeklyTarget,1,7)};}}
  if(_isPlainObj(o.accepted)&&_isPlainObj(o.accepted.cand)){const cand=_sanitizeCand(o.accepted.cand); // (E10b) la rutina aceptada tal cual (42 R31)
    if(cand)d.accepted={cand,answers:_sanitizeProfile(o.accepted.answers),places:_sanitizePlaces(o.accepted.places),ts:_num(o.accepted.ts,0,9e15)||Date.now()};}
  return d;
}
// Sesiones (E1b-E2): nombre, foco, rutina e id del día con que se hizo; lo que no casa, fuera (la sesión se queda)
function _sanitizeSessionsV21(list){
  _sanitizeSessDay(list);
  (Array.isArray(list)?list:[]).forEach(s=>{if(_isPlainObj(s)&&'pid' in s&&!(typeof s.pid==='string'&&PID_RE.test(s.pid)))delete s.pid;});
}
// Todas las claves nuevas a la vez (al arrancar y al terminar de importar)
function _sanitizeV21(o){
  if(!_isPlainObj(o))return;
  o.profile=_sanitizeProfile(o.profile);o.places=_sanitizePlaces(o.places);o.health=_sanitizeHealth(o.health);
  o.planMeta=_sanitizePlanMeta(o.planMeta,o.currentPlan);o.planPrev=_sanitizePlanPrev(o.planPrev,null);o.obDraft=_sanitizeObDraft(o.obDraft);
  o.rotBack=typeof o.rotBack==='string'&&_isPlainObj(o.currentPlan)&&_isPlanDay(o.currentPlan[o.rotBack])?o.rotBack:null;
  o.bkHealth=o.bkHealth!==false;
  _sanitizeSessionsV21(o.sessions);
}
// ══════════════════════════════════════════════════════════
// (E3a) MATERIAL: el catálogo del generador (bloque GYM-GEN) y un único filtro de material para toda la app (§G.7)
// ══════════════════════════════════════════════════════════
// LIB_K: el catálogo del prototipo sobre la biblioteca de la app (c = multiarticular, u = unilateral, que LIB_ROWS no lleva):
// etiquetas de seguridad (pendientes de revisión, D2), presets de material (P5) y placeCan. Sin el bloque, todo como antes.
const LIB_UNI=new Set((window.GymGen&&GymGen.UNI)||[]);
const LIB_K=(()=>{try{return window.GymGen?GymGen.catalogo(EXERCISE_DB.map(e=>Object.assign({},e,{c:!!e.compound,u:LIB_UNI.has(e.id)}))):null;}
  catch(e){console.error('GymGen',e);return null;}})();
// Un sitio desde su preset (P5): {preset, mats, acc, mach, card, dbMax, kb, kbMax}; null si no existe
function placeFromPreset(k){if(!LIB_K||!LIB_K.PRESETS[k])return null;return _sanitizePlace(Object.assign(LIB_K.place(k),{kbMax:null}));}
// ¿Se puede hacer L en el sitio P? kind 'g' gimnasio · 'c' casa (un gimnasio no hace lo que es solo de casa)
function placeCan(L,P,kind){if(!L||!P)return false;return LIB_K?LIB_K.placeCan(L,P,kind):plOk(L,kind);}
// El sitio de un día: el suyo en la rutina generada (planMeta.dayPlace, por su id) o el principal; null sin tus sitios
function placeOfDay(dk){
  const pl=S.places;if(!_isPlainObj(pl))return null;
  const d=getPlan()[dk],m=S.planMeta,k=(_isPlainObj(m)&&_isPlainObj(m.dayPlace)&&d&&d.did&&m.dayPlace[d.did])||pl.main;
  return pl[k]?k:(pl.g?'g':'c');
}
// El único filtro de material: selector, «¿Máquina ocupada?» y Coach. Con tus sitios, el material del sitio de ese día; sin
// ellos, como siempre (el lugar que deduce routinePlace): «sin perfil, idéntico a hoy»
function canDoHere(L,dk){
  if(!L)return false;
  const k=placeOfDay(dk!=null?dk:S.day);
  return k?placeCan(L,S.places[k],k):plOk(L,routinePlace());
}
// Crea tus sitios la primera vez que hacen falta (42 R12): el material de casa que ya marcaste en el selector (S.libKit) pasa
// a places.c; el principal es el gimnasio (de los grandes: no se da por hecho que falte nada) salvo que tu rutina sea de casa
function ensurePlaces(){
  if(_isPlainObj(S.places))return S.places;
  const main=routinePlace(),kit=Array.isArray(S.libKit)?S.libKit.slice():null;
  let c=null;if(kit||main==='c'){c=placeFromPreset('nada');if(c&&kit){c.mats=kit;c.preset='propio';}}
  S.places=_sanitizePlaces({v:1,main,g:main==='g'?placeFromPreset('grande'):null,c});
  _syncLibKit();
  return S.places;
}
// (E3b) Nombres para decir qué falta: familias de máquina, tipos de cardio y accesorios
const MACH_FAM_LBL={prensa:'prensa de piernas',extension:'máquina de extensión de cuádriceps',curlfem:'máquina de curl femoral',abdaduct:'máquina de abductores',
  gemelos:'máquina de gemelos',gluteo:'máquina de glúteo',lumbares:'banco de lumbares',jalonremo:'máquina de jalón y remo',pecho:'máquina de pecho',
  contractora:'máquina de aperturas',hombro:'máquina de hombro',brazos:'máquina de brazos',abdominales:'máquina de abdominales'};
const CARD_KIND_LBL={cinta:'cinta de correr',bici:'bici estática',reclinada:'bici reclinada',spinning:'bici de spinning',bici_aire:'bici de aire',eliptica:'elíptica',
  remo:'máquina de remo',escaladora:'escaladora',esqui:'máquina de esquí'};
const ACC_LBL={mesa:'una mesa firme',puerta:'una puerta que cierre bien',silla:'una silla',pared:'una pared',escalon:'un escalón',banco:'un banco',banco_inc:'un banco inclinable',
  banco_dec:'un banco declinable',scott:'un banco Scott',ghd:'un GHD',hiper:'un banco de hiperextensiones',rack:'un rack',landmine:'un landmine',hexbar:'una barra hexagonal',
  anclaje:'un anclaje de puerta',paralelas:'paralelas',agarre_neutro:'un agarre neutro',kb2:'dos kettlebells',anillas:'anillas',poleas2:'dos poleas',trineo:'un trineo',
  llanta:'una llanta',cuerdas:'cuerdas de batida',saco:'un saco de boxeo',bici_ext:'una bici',piscina:'una piscina',banda:'una banda elástica'};
// Lo primero que falta en el sitio P para hacer L (para el «¿por qué no?» del selector)
function placeWhyNot(L,P,kind){
  if(!L||!P)return'';
  if(kind==='g'&&L.pl==='c')return'Solo en casa';
  const mats=new Set(P.mats);mats.add('corporal');const T=LIB_K&&LIB_K.TAGS;
  if(!mats.has(L.mat)&&!((T&&T.also[L.id])||[]).some(m=>mats.has(m)))return'Necesita '+_matLow(L.mat);
  if(L.mat==='maquina'&&P.mach!=='all'){const f=T&&T.mfam[L.id];if(f&&!P.mach.includes(f))return'No hay '+(MACH_FAM_LBL[f]||'esa máquina');}
  if(L.mat==='cardio'&&P.card!=='all'){const c=T&&T.ckind[L.id];if(c&&!P.card.includes(c))return'No hay '+(CARD_KIND_LBL[c]||'esa máquina');}
  const r=((T&&T.req[L.id])||[]).find(x=>x==='banda'?!mats.has('banda'):!(P.acc||[]).includes(x));
  return r?'Necesita '+(ACC_LBL[r]||r):'';
}
// «No hay esta máquina en mi gimnasio» / «No tengo este material»: quita del sitio P la familia de máquina, el tipo de cardio o
// el material de L. Devuelve el nombre de lo quitado (o null si L no necesita nada que quitar)
function placeDrop(P,L){
  if(!P||!L||L.mat==='corporal')return null;const T=LIB_K&&LIB_K.TAGS;
  if(L.mat==='maquina'){const f=T&&T.mfam[L.id];if(!f)return null;P.mach=(P.mach==='all'?MACH_FAMS.slice():P.mach).filter(x=>x!==f);return MACH_FAM_LBL[f]||'esa máquina';}
  if(L.mat==='cardio'){const c=T&&T.ckind[L.id];if(!c)return null;P.card=(P.card==='all'?CARD_KINDS.slice():P.card).filter(x=>x!==c);return CARD_KIND_LBL[c]||'esa máquina';}
  if(!P.mats.includes(L.mat))return null;
  P.mats=P.mats.filter(m=>m!==L.mat);return _matLow(L.mat);
}
// S.libKit (el material de casa del selector) es siempre el de places.c: una sola fuente de verdad
function _syncLibKit(){
  const c=_isPlainObj(S.places)&&S.places.c;if(!c)return;
  S.libKit=[...new Set(c.mats.filter(k=>MAT[k]&&MAT[k].home))];
}
// ══════════════════════════════════════════════════════════
// (E4a) EL GENERADOR DE RUTINAS (bloque GYM-GEN, el prototipo v12 tal cual): sus fábricas sobre el catálogo de la app
// ══════════════════════════════════════════════════════════
// Una instancia por forma de reparto (D1: 'dias' por defecto, un entreno distinto por cada día de pesas; «Cambiar reparto»
// ofrece 'recomendado', 2-4 entrenos que se turnan) y por la respuesta de D5 (tope: «4 de pesas y el resto, cardio suave» o
// «todos de pesas»). Puro: lo que necesita de la app (historial, favoritos, otra propuesta) entra por el contexto (42 R29).
// G.genRoutine(input, ctx) → {ok, days:{A:{label, focus, ex:[{lib,s,r,note}]}…}, weeklyTarget, meta, det}
const _genEng={};
function genEngine(o){
  o=o||{};const rep=o.reparto==='recomendado'?'recomendado':'dias',tope=o.tope!==false,key=rep+'|'+(tope?'si':'no');
  if(!_genEng[key]){
    if(!window.GymGen||typeof GymGen.generador!=='function'||!LIB_K)return null;
    const OPT={reparto:rep};if(!tope)OPT.topePrincipiante=false;
    const G=GymGen.generador(LIB_K,OPT),X=GymGen.textos(LIB_K,G),SEG=GymGen.seguridad(LIB_K,G,X);
    _genEng[key]={G,X,SEG,reparto:rep,tope};
  }
  return _genEng[key];
}
// Genera una rutina desde las respuestas en el formato del generador (a) con su contexto ({hist, fav, alt, prev}).
// → {inp, res, E} (res.ok false si las reglas duras no se cumplen con ningún reparto)
function genRoutineFrom(a,ctx,o){
  const E=genEngine(o);if(!E)return null;
  const inp=E.G.desdeRespuestas(a),res=E.G.genRoutine(inp,ctx||{});
  return{inp,res,E};
}
// (E4b) Minutos de un día con la fórmula del generador (30-algoritmo.md §8.1): calentamiento + equilibrio + Σ ejercicios + cardio
// final. Ejercicio = transición (120 s con barra o rack; 60 s si no) + aproximación (solo el primer multiarticular con kilos, o.apx:
// 150 s por defecto; nada con o.inicio) + series × trabajo × (2 si es a una pierna o un brazo) + (series − 1) × descanso; trabajo =
// media del rango × 3,5 s + 12 s (por tiempo: los segundos + 12; distancia: 45 s). Las filas de minutos (calentamiento y cardio)
// cuentan sus minutos y o.bal, los del equilibrio. o.rest(e) da el descanso (por defecto, el de la app: el tuyo o el automático).
// Es lo que promete el resultado del cuestionario y lo que enseñará Inicio (E5).
const _GEN_BARM=['barra','disco','barraz'];
function _planExSecs(e,o,first){
  const L=exLib(e),K=LIB_K&&L?LIB_K.BY.get(L.id):null;
  const s=Math.max(0,Math.min(SET_MAX_N,parseInt(e.s)||0));if(!s)return 0;
  const mat=K?K.mat:L?L.mat:null,req=K&&LIB_K.TAGS.req[K.id]||[];
  const tr=_GEN_BARM.includes(mat)||req.includes('rack')?120:60;
  const lt=exLT(e),rr=lt==='t'||lt==='d'?null:repRange(e);
  const work=lt==='t'?(_tgtSecs(e)||30)+12:lt==='d'?45:(rr?(rr.lo+rr.hi)/2:10)*3.5+12;
  const uni=!!(L&&LIB_UNI.has(L.id));
  const rest=o.rest?o.rest(e):getRestSecs(e.id);
  return tr+(first?(o.apx!=null?o.apx:150):0)+s*work*(uni?2:1)+(s-1)*(+rest||0);
}
function _planDayMinutesOf(ex,o){
  o=o||{};let sec=(+o.bal||0)*60,firstDone=!!o.inicio;
  for(const e of Array.isArray(ex)?ex:[]){
    if(!e||typeof e!=='object')continue;
    if(e.cardio||exLT(e)==='c'){sec+=(_cardioMin(e)||0)*60;continue;}
    if(o.bal){const L=exLib(e);if(L&&L.pat==='bal')continue;} // (E14a) sus minutos son los del bloque de equilibrio
    const first=!firstDone&&isCompoundEx(e)&&exLT(e)==='w';if(first)firstDone=true;
    sec+=_planExSecs(e,o,first);
  }
  return sec/60;
}
function _planDayMinutes(dk,o){const d=getPlan()[dk];return d&&Array.isArray(d.ex)?_planDayMinutesOf(d.ex,o):0;}
// Aproximación del primer multiarticular con kilos de un día generado, como el generador (C-32): nada con 65 o más ni prudente; 60 s
// en el exprés, el modo corto o con 15 min; 4 min en el primer básico pesado de «Ganar fuerza» (6 repeticiones o menos); si no, 150 s
function genApproachSecs(g,row){
  const G=g.E.G,P=G.effective(g.inp),why=(g.res.meta&&g.res.meta.why)||[];
  if(P.mayor||P.prud)return 0;
  if(P.corto||g.inp.min===15||why.some(w=>w&&(w.c==='expres'||w.c==='corto')))return 60;
  const L=LIB_K.BY.get(row&&row.lib),rr=L?G.repRange(L,row.r):null;
  return g.inp.goal==='fuerza'&&row.prio===1&&L&&G.heavyOk(L)&&rr&&rr.hi<=6?240:150;
}
// Fila del detalle del generador → ejercicio del plan (el que guarda la app): rango estándar escrito («10-12», que repRange respeta),
// por tiempo «30s», cardio y calentamiento en minutos. (E5 añade el id, las notas y lo que conserva de tu rutina.)
function genRowToEx(row){
  const L=LIB_BY_ID.get(row.lib);if(!L)return null;
  const e=_libCopy(L,'g_'+row.lib.replace(/^lib_/,''));
  if(row.kind==='warm'||row.kind==='cardio'){e.cardio=true;e.s=1;e.r=row.reps;return e;}
  e.s=row.series;
  const K=LIB_K.BY.get(row.lib),secs=typeof row.r==='string'&&/s$/.test(row.r)?parseInt(row.r):null;
  e.r=K&&K.lt==='t'?(secs||30)+'s':K&&K.lt==='d'?String(row.r):/^\d+-\d+$/.test(row.reps)?row.reps:String(row.r);
  return e;
}
// (E4c) Textos de la rutina generada: el «por qué» y los avisos, las mismas frases que el prototipo (sim/textos.js; la seguridad
// primero; la app enseña los 3 primeros avisos y el resto en «ver más»). g = genRoutineFrom(…).
function genTexts(g){const X=g.E.X;return{porque:X.porque(g.res,g.inp),avisos:X.avisos(g.res,g.inp),visibles:X.AVISOS_VISIBLES};}
