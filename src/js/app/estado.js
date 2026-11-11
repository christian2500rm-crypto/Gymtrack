const PLAN={
  A:{label:'Día A',focus:'Piernas + abdomen',pill:'pa',ex:[
    {id:'a1',n:'Calentamiento — caminadora',ic:'🚶',eq:'Caminadora',muscle:'cardio',s:1,r:'8 min',tip:'4–5 km/h sin inclinación. El objetivo es entrar en calor, no cansarse. Respira tranquilo.',cardio:true},
    {id:'a2',n:'Sentadilla en Smith',ic:'🏋️',eq:'Smith machine + banco',muscle:'piernas',compound:true,s:3,r:12,tip:'Pies al ancho de hombros. Barra en la parte alta de la espalda. Baja hasta muslos paralelos. Empuja desde los talones. Deja 2 reps en reserva.'},
    {id:'a3',n:'Extensión de cuádriceps',ic:'🦵',eq:'Máquina de extensión',muscle:'piernas',s:3,r:12,tip:'Rodilla alineada con el pivote. Sube 2s, baja 3s. No bloquees la rodilla arriba.'},
    {id:'a4',n:'Curl femoral',ic:'🦿',eq:'Máquina de curl femoral',muscle:'piernas',s:3,r:12,tip:'Dobla hasta casi tocar los glúteos. Sostén 1s arriba. Controla el regreso lento.'},
    {id:'a5',n:'Crunch en cable',ic:'⚡',eq:'Cable dual (cuerda alta)',muscle:'core',s:3,r:15,tip:'Arrodíllado de frente. Lleva los codos hacia las rodillas curvando la columna. Siente el abdomen contraerse.'},
    {id:'a6',n:'Cardio — caminadora',ic:'🏃',eq:'Caminadora',muscle:'cardio',s:1,r:'15 min',tip:'Inclinación 3–5%, 5 km/h. Respiración constante: un ritmo que puedas mantener.',cardio:true},
  ]},
  B:{label:'Día B',focus:'Empuje — pecho, hombros, tríceps',pill:'pb',ex:[
    {id:'b1',n:'Calentamiento — caminadora',ic:'🚶',eq:'Caminadora',muscle:'cardio',s:1,r:'8 min',tip:'4–5 km/h. Mueve los brazos. Aumenta el ritmo gradualmente.',cardio:true},
    {id:'b2',n:'Press inclinado en Smith',ic:'🏋️',eq:'Smith machine + banco',muscle:'pecho',compound:true,s:3,r:10,tip:'Banco a 30–45°. Barra al pecho superior. Pies planos en el suelo. Aprieta el pecho arriba. Deja 2 reps en reserva.'},
    {id:'b3',n:'Aperturas en máquina',ic:'🤸',eq:'Máquina de aperturas',muscle:'pecho',s:3,r:12,tip:'Siente el estiramiento al abrir. Cierra hasta que los mangos casi se toquen. Poco peso.'},
    {id:'b4',n:'Elevación lateral en cable',ic:'⚡',eq:'Cable dual (polea baja)',muscle:'hombros',s:3,r:12,tip:'Un brazo a la vez. Levanta solo hasta el nivel del hombro. Muy poco peso.'},
    {id:'b5',n:'Jalón de tríceps en cable',ic:'⬇️',eq:'Cable dual (cuerda)',muscle:'triceps',s:3,r:12,tip:'Codos pegados a los costados. Empuja hasta brazos rectos. Aprieta abajo. Controla el regreso.'},
    {id:'b6',n:'Cardio — caminadora',ic:'🏃',eq:'Caminadora',muscle:'cardio',s:1,r:'15 min',tip:'Inclinación 3–5%, 5 km/h. Enfriamiento activo.',cardio:true},
  ]},
  C:{label:'Día C',focus:'Tirón — espalda y bíceps',pill:'pc',ex:[
    {id:'c1',n:'Calentamiento — caminadora',ic:'🚶',eq:'Caminadora',muscle:'cardio',s:1,r:'8 min',tip:'Camina suave. Círculos con los hombros. Hoy es día de tirón.',cardio:true},
    {id:'c2',n:'Jalón al pecho',ic:'🏋️',eq:'Jalón / remo (máquina)',muscle:'espalda',compound:true,s:3,r:12,tip:'Agarre ancho. Tira hacia el pecho superior. No balancees. La espalda hace el trabajo.'},
    {id:'c3',n:'Remo sentado en máquina',ic:'🚣',eq:'Jalón / remo (máquina)',muscle:'espalda',compound:true,s:3,r:12,tip:'Siéntate erguido. Tira hacia el ombligo. Aprieta omóplatos al final. Regreso 3s.'},
    {id:'c4',n:'Remo con mancuerna',ic:'💪',eq:'Mancuernas + banco',muscle:'espalda',compound:true,s:3,r:10,tip:'Apóyate en el banco. Tira hacia la cadera. Codo directo hacia atrás.'},
    {id:'c5',n:'Curl de bíceps en cable',ic:'⚡',eq:'Cable dual (barra EZ)',muscle:'biceps',s:3,r:12,tip:'Codos fijos a los costados. Sube completo. Aprieta arriba. Controla el regreso 3s.'},
    {id:'c6',n:'Aperturas inversas en máquina',ic:'🔄',eq:'Máquina de aperturas (invertida)',muscle:'espalda',s:3,r:15,tip:'Máquina al revés. Aprieta deltoides posteriores. Poco peso — busca la sensación.'},
    {id:'c7',n:'Cardio — caminadora',ic:'🏃',eq:'Caminadora',muscle:'cardio',s:1,r:'15 min',tip:'Inclinación 3–5%. Si tienes energía, 1 min de trote suave, luego camina.',cardio:true},
  ]}
};

const MONTHS=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const DAY_ORDER=['A','B','C']; // orden del plan de fábrica (las rutinas van de 2 a 6 días: DAY_KEYS y dayKeys())
const DAY_KEYS=['A','B','C','D','E','F']; // (E1a) claves de día posibles, en orden
const DID_RE=/^d_[a-z0-9]{1,16}$/; // (E1b) id estable de un día de la rutina
const PID_RE=/^p_[a-z0-9]{1,16}$/; // (E2) id de una rutina generada (planMeta.id), también en cada sesión hecha con ella
const SCHEMA_VERSION=21;
// (E2) Claves nuevas de primer nivel (esquema 21). Sus valores por defecto viven AQUÍ, en el estado inicial, y nunca en la
// migración: importData llama a migrateState sobre la copia y una clave puesta ahí a null taparía la del móvil (42 R1).
// profile: tus respuestas · places: dónde entrenas y tu material · health: molestias (solo con consentimiento) · planMeta: la
// rutina generada en uso · planPrev: un nivel de deshacer · obDraft: borrador del cuestionario (sin salud) · rotBack: el día al
// que vuelve la rotación tras «¿Hoy en otro sitio?» · bkHealth: ¿las copias llevan tus molestias?
const V21_DEFAULTS={profile:null,places:null,health:null,planMeta:null,planPrev:null,obDraft:null,rotBack:null,bkHealth:true};
// Rango permitido del objetivo de días por semana
const WEEKLY_TARGET_MIN=1, WEEKLY_TARGET_MAX=7, WEEKLY_TARGET_DEFAULT=3;
// (E1b) La botonera de «Días por semana» ofrece de 2 a 6 (como las rutinas). El recorte sigue en 1-7: quien ya tenga 1 o 7
// lo conserva y lo ve marcado hasta que lo cambie
const WEEKLY_PICK_MIN=2, WEEKLY_PICK_MAX=6;
// Duración máxima plausible de una sesión (min); por encima se considera dato no fiable
const MAX_SESSION_MIN=360;
// Duración de una semana de descanso planificada (ms)
const REST_WEEK_MS=7*86400000;
// Coach de carga (v15): salto de peso por tipo de equipo (S.loadSteps, editable en Ajustes → Coach de carga).
// Va aquí arriba porque S y migrateState lo usan al arrancar. La lógica está en coach_prescribe().
const LOAD_EQ={
  barra:{l:'Barra o Smith',d:'Sentadilla y press en Smith',opts:[1.25,2.5,5],def:2.5},
  maq:{l:'Máquina multiarticular',d:'Prensa, jalón, remos, press en máquina',opts:[1,2.5,5],def:2.5},
  maqA:{l:'Máquina de aislamiento',d:'Extensión, curl femoral, aperturas',opts:[1,2.5,5],def:2.5},
  manc:{l:'Mancuernas',d:'Por mancuerna (cada mano)',opts:[1,2,2.5],def:1},
  polea:{l:'Polea o cable',d:'Elevaciones, tríceps y curl en polea',opts:[0.5,1,1.25,2.5],def:1},
  kb:{l:'Kettlebell',d:'Pesas rusas: 8, 12, 16, 20, 24 kg…',opts:[2,4],def:4},
  disco:{l:'Discos, balón y trineo',d:'Pesos sueltos: discos, balón medicinal, trineo',opts:[1,2,2.5,5],def:2.5}
};
const LOAD_CAP=0.10;     // una subida de peso no pasa del 10 % (salvo el salto mínimo del equipo, tras sumar reps)
const LOAD_MAX=0.25;     // y nunca de un 25 % (8.5 → 11 kg en polea es un +29 %: no se propone)
const LOAD_DOWN=0.075;   // bajada tras dos sesiones seguidas por debajo del rango (5-10 %, al menos un salto)
const LOAD_PER_REP=0.025; // cambio de esquema (Coach o editor): ~2.5 % de peso por cada rep de diferencia
const LOAD_GAP_DAYS=21;  // tras 3 semanas sin hacer un ejercicio, se repite el peso antes de subir
// 'auto' (por defecto) = el salto que ya usas en cada ejercicio según tu historial; si aún no hay, el de su equipo (def)
function _defaultLoadSteps(){const o={};Object.keys(LOAD_EQ).forEach(k=>{o[k]='auto';});return o;}
// Solo 'auto' o un valor de la lista de cada equipo; lo que falte o no valga, 'auto'
function _sanitizeLoadSteps(x){
  const o=_defaultLoadSteps();
  if(x&&typeof x==='object'&&!Array.isArray(x))Object.keys(LOAD_EQ).forEach(k=>{const v=x[k];if(v!=='auto'&&LOAD_EQ[k].opts.includes(+v))o[k]=+v;});
  return o;
}

// Registro serie a serie (v18): límites de los valores de cada serie. Aquí arriba porque migrateState los usa al arrancar.
const SET_MAX_W=999,SET_MAX_R=200,SET_MAX_N=20;
// Series por tiempo o por distancia (aditivo, sin migración): cada serie puede llevar t (segundos) y d (metros); el
// registro guarda t y m (m, porque rec.d ya es la fecha) y su tipo lt cuando no es peso × reps (REC_LT). Un registro
// sin peso tiene v 0: todo lo que filtra +v>0 (Coach de carga, saltos, gráficas de kg) no lo ve.
const SET_MAX_T=3600,SET_MAX_D=20000,REC_LT=['bw','r','t','d'];
function _setNumT(v){if(v==null||v===''||typeof v==='boolean')return null;const n=Math.round(typeof v==='number'?v:parseFloat(String(v).replace(',','.')));return isFinite(n)&&n>=1&&n<=SET_MAX_T?n:null;}
function _setNumD(v){if(v==null||v===''||typeof v==='boolean')return null;const n=Math.round(typeof v==='number'?v:parseFloat(String(v).replace(',','.')));return isFinite(n)&&n>=1&&n<=SET_MAX_D?n:null;}
// Biblioteca: claves que solo viven en el catálogo (EXERCISE_DB) y nunca en las copias del plan (se leen por su lib).
// Aquí arriba porque el saneado de las sustituciones (_sanitizePlanSubs) corre al arrancar, antes del catálogo.
const LIB_ONLY_KEYS=['al','mat','pl','dif','lt','x','pat','mus','alt','why','up'];
// Copia de un ejercicio que viene de fuera (backup): sin las claves del catálogo y con lib como texto corto (o sin lib)
function _slimEx(ex){
  if(!_isPlainObj(ex))return;
  LIB_ONLY_KEYS.forEach(k=>{delete ex[k];});
  if('lib' in ex&&!(typeof ex.lib==='string'&&ex.lib.length<=80))delete ex.lib;
}
// Descanso por ejercicio (v19): S.restOverrides = {exId: segundos} elegido por el usuario (lo que falta = automático por
// tipo, ver restDefaultSecs). Límites del descanso: 15 s – 10 min por ejercicio; un descanso en marcha con ±15 s, hasta 15 min.
const REST_MIN_S=15,REST_MAX_S=600,RT_MAX_S=900,REST_OVR_MAX=200;
function _sanitizeRestOverrides(x){
  const o={};
  if(!x||typeof x!=='object'||Array.isArray(x))return o;
  let n=0;
  for(const k of Object.keys(x)){
    if(n>=REST_OVR_MAX)break;
    if(!/^[\w.:-]{1,64}$/.test(k))continue;
    const v=x[k];
    if(typeof v!=='number'||!isFinite(v))continue;
    const s=Math.round(v);
    if(s<REST_MIN_S||s>REST_MAX_S)continue;
    o[k]=s;n++;
  }
  return o;
}

// Claves transitorias de UI que NO deben persistirse (modales abiertos, búsquedas, etc.)
const TRANSIENT_KEYS=['wmodal','wnew','settingsOpen','_hist','open','_editWeightTarget','_deloadActive','_wdetail','_wdetailN'];
let _saveFailedNotified=false;
function loadState(){try{const r=localStorage.getItem('gymtrack_v3');if(r)return JSON.parse(r);}catch(e){}return null;}
function saveState(){
  try{
    try{_bkTrack();}catch(e){} // (15) ¿cambió tu rutina o tu peso desde la última copia?
    const snap={};
    for(const k in S){if(!TRANSIENT_KEYS.includes(k))snap[k]=S[k];}
    localStorage.setItem('gymtrack_v3',JSON.stringify(snap));
    return true;
  }catch(e){
    if(!_saveFailedNotified){
      _saveFailedNotified=true;
      try{toast('⚠️ No se pudo guardar — comprueba almacenamiento del navegador',5000);}catch(_){}
    }
    return false;
  }
}

// Escapado HTML universal (defensa XSS para datos importables / nombres custom)
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
// Plural en español con el número delante: plural(1,'sesión','sesiones') → «1 sesión», plural(2,'día') → «2 días».
// Sin tercer argumento el plural es sing+'s'. Úsalo siempre que el número pueda ser 1 (nunca «1 series»).
function plural(n,sing,plur){return`${n} ${Number(n)===1?sing:(plur||sing+'s')}`;}
// Texto normalizado para buscar: minúsculas y sin tildes ni diéresis («Jalón»/«jalon», «Cuádriceps»/«cuadriceps»)
function normTxt(s){return String(s==null?'':s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();}

// Detecta si un ejercicio es compuesto sin depender de IDs originales (resistente a swaps)
function isCompoundEx(ex){
  if(!ex||ex.cardio)return false;
  if(ex.compound===true)return true;
  // IDs originales del plan v1
  if(['a2','b2','c2','c3','c4'].includes(ex.id))return true;
  // Su ejercicio de la biblioteca (por lib, id del plan original o nombre)
  const L=exLib(ex);return !!(L&&L.compound);
}

// Reps objetivo como número (12 o '12'), o null si el objetivo no es un nº de reps (ej: '30s' en la plancha, '8-12')
function targetRepsNum(ex){
  const r=String(ex&&ex.r!=null?ex.r:'').trim();
  return /^\d{1,3}$/.test(r)&&+r>0?+r:null;
}
// Texto del objetivo: «12 reps» / «8-12 reps»; por tiempo o distancia como en el resto de la app (fmtSecs / fmtM: el
// «30s» del catálogo sale «30 s», «90s» «1:30 min», «30m» «30 m»); lo demás, tal cual («8 min»)
function fmtTargetReps(ex){
  const n=targetRepsNum(ex),raw=String(ex&&ex.r!=null?ex.r:'').trim();
  // Un número suelto en uno por tiempo o distancia (planchas que el editor antiguo dejó en «29») son segundos o metros
  if(n!=null){const lt=ex&&!ex.cardio?exLT(ex):'w';return lt==='t'?fmtSecs(n):lt==='d'?fmtM(n):n+' reps';}
  const u=/^(\d{1,4})\s*([sm])$/.exec(raw);if(u&&+u[1]>0)return u[2]==='s'?fmtSecs(u[1]):fmtM(u[1]);
  return /^\d{1,3}\s*[-–]\s*\d{1,3}$/.test(raw)?raw+' reps':raw;
}
// Peso OPCIONAL (peso corporal, bandas, por tiempo o por distancia: flexiones, plancha, elevaciones colgado…):
// nunca se avisa de «falta el peso» ni se bloquea el guardado por ellos. Tipo de registro: exLT (catálogo).
const BODYWEIGHT_LIB=['lib_pushup','lib_plank','lib_leg_raise'];
function isBodyweightEx(ex){return !!ex&&!ex.cardio&&['bw','r','t','d'].includes(exLT(ex));}

// Compara dos timestamps por día calendario (mismo año/mes/día)
function sameDayTs(ts1,ts2){
  if(!ts1||!ts2)return false;
  const a=new Date(ts1),b=new Date(ts2);
  return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
}

// Objetivo de días de entrenamiento por semana — clamp defensivo a [1,7].
// SIEMPRE devuelve >=1, garantizando que ninguna división (rate, barras de progreso) sea entre 0.
function getWeeklyTarget(){
  const n=parseInt(S&&S.weeklyTarget);
  if(!n||isNaN(n))return WEEKLY_TARGET_DEFAULT;
  return Math.min(WEEKLY_TARGET_MAX,Math.max(WEEKLY_TARGET_MIN,n));
}

// Cuenta series marcadas (fuerza) + cardio hecho de un día concreto del plan.
function dayMarkCount(dayKey){
  const plan=getPlan();
  const day=plan&&plan[dayKey];
  if(!day||!Array.isArray(day.ex))return {strDone:0,strTotal:0,marks:0};
  let strDone=0,strTotal=0,marks=0,setsDone=0,setsTotal=0;
  day.ex.forEach(ex=>{
    if(ex.cardio){
      if(S.sets[ex.id]&&S.sets[ex.id][0])marks++;
    }else{
      strTotal++;
      const c=countSetsDone(ex.id,ex.s);
      setsDone+=c;setsTotal+=Math.max(0,parseInt(ex.s)||0);
      if(c>0)marks++;
      if(c>=ex.s)strDone++;
    }
  });
  return {strDone,strTotal,marks,setsDone,setsTotal};
}

// Día con un entreno en curso = el que más series marcadas tiene (0 marcas → null).
// Se calcula desde las marcas REALES, no desde un puntero, para que nunca haya datos huérfanos invisibles.
function currentInProgressDay(){
  const plan=getPlan();
  let best=null,bestMarks=0;
  for(const dk of Object.keys(plan)){
    const mc=dayMarkCount(dk);
    if(mc.marks>bestMarks){bestMarks=mc.marks;best=dk;}
  }
  return best;
}

// Devuelve el entreno en curso (recuperable) o null — siempre refleja las marcas reales.
function getActiveWorkout(){
  const day=currentInProgressDay();
  if(!day)return null;
  const plan=getPlan();
  if(!plan[day])return null;
  const mc=dayMarkCount(day);
  if(mc.marks<1)return null;
  // startTs fiable solo si el puntero coincide con el día detectado
  const startTs=(S.activeWorkout&&S.activeWorkout.day===day&&S.activeWorkout.startTs)?S.activeWorkout.startTs:(S.sessionStartTs||null);
  return {day,startTs,strDone:mc.strDone,strTotal:mc.strTotal,setsDone:mc.setsDone,setsTotal:mc.setsTotal,label:plan[day].label,focus:plan[day].focus};
}

// ── SEMANA DE DESCANSO (descanso de verdad: 7 días sin entrenar) ──────────────────
// (13b) No es una descarga: S.restWeeks solo guarda periodos sin entrenar (no cambia el plan). La descarga (entrenar
// con menos series) es S.deload, más abajo. Las dos se eligen en el mismo sitio (Ajustes → «Descarga o descanso») y
// nunca a la vez: empezar el descanso termina la descarga y, durante el descanso, no se empieza ninguna.
// Periodo de descanso que cubre AHORA, o null.
function getActiveRest(){
  const now=Date.now();
  if(!Array.isArray(S.restWeeks))return null;
  return S.restWeeks.find(r=>r&&r.startTs!=null&&r.endTs!=null&&r.startTs<=now&&r.endTs>now)||null;
}
// Días completos que quedan de un periodo de descanso (mínimo 0).
function restDaysLeft(r){
  if(!r||r.endTs==null)return 0;
  return Math.max(0,Math.ceil((r.endTs-Date.now())/86400000));
}
// Semanas de descanso (fraccionarias) dentro de la ventana [fromTs,toTs], para no penalizar la constancia.
// Calcula la UNIÓN de días de descanso recortados a la ventana (evita doble-conteo de periodos
// solapados o adyacentes) y la convierte a semanas, capada al tamaño de la ventana.
function restWeeksInWindow(fromTs,toTs){
  if(!Array.isArray(S.restWeeks)||!S.restWeeks.length||toTs<=fromTs)return 0;
  const iv=[];
  S.restWeeks.forEach(r=>{
    if(!r||r.startTs==null||r.endTs==null)return;
    const s=Math.max(fromTs,r.startTs),e=Math.min(toTs,r.endTs);
    if(e>s)iv.push([s,e]);
  });
  if(!iv.length)return 0;
  iv.sort((a,b)=>a[0]-b[0]);
  let total=0,curS=iv[0][0],curE=iv[0][1];
  for(let i=1;i<iv.length;i++){
    if(iv[i][0]<=curE){curE=Math.max(curE,iv[i][1]);} // solapan/adyacentes → fusionar
    else{total+=curE-curS;curS=iv[i][0];curE=iv[i][1];}
  }
  total+=curE-curS;
  const weeks=total/REST_WEEK_MS;
  const windowWeeks=(toTs-fromTs)/REST_WEEK_MS;
  return Math.min(weeks,windowWeeks);
}

// ── DESCARGA TEMPORAL Y REVERSIBLE (schema v13) ─────────────────
// S.deload = {id, kind:'all'|'ex', startTs, endTs, label, changes:[{exId, day, from, to}]} o null.
// Baja las series del plan guardando las originales (from). Vuelve sola al llegar endTs (deloadTick, al cargar
// y en cada render) o antes con «Terminar descarga». Al restaurar, si cambiaste a mano las series de un ejercicio
// durante la descarga, se respeta tu cambio. Solo hay una descarga a la vez.
// Una descarga es «mismo peso, menos series»: en Entreno no se sugiere subir peso mientras dura.
const DELOAD_MS=7*86400000;
function _startOfDay(ts){const d=new Date(ts);d.setHours(0,0,0,0);return d.getTime();}
// (13a) n días de calendario después (hora local). Con un cambio de hora en medio, 7 días no son 7×24 h: la medianoche
// sigue siendo medianoche (antes el fin caía a las 23:00 o a la 01:00).
function _addDaysLocal(ts,n){const d=new Date(ts);d.setDate(d.getDate()+n);return d.getTime();}
// Fin de una descarga que empieza en ts: la medianoche local de dentro de 7 días
function _deloadEndFrom(ts){return _addDaysLocal(_startOfDay(ts),7);}
function _validDeload(d){
  if(!_isPlainObj(d)||(d.kind!=='all'&&d.kind!=='ex'))return false;
  if(typeof d.startTs!=='number'||typeof d.endTs!=='number'||!isFinite(d.startTs)||!isFinite(d.endTs))return false;
  if(d.endTs<=d.startTs||d.endTs-d.startTs>15*86400000)return false;
  if(!Array.isArray(d.changes)||!d.changes.length||d.changes.length>80)return false;
  return d.changes.every(c=>_isPlainObj(c)&&typeof c.exId==='string'&&c.exId&&c.exId.length<=80&&
    Number.isInteger(c.from)&&Number.isInteger(c.to)&&c.from>=1&&c.from<=10&&c.to>=1&&c.to<=10);
}
function _sanitizeDeloadHistory(h){
  if(!Array.isArray(h))return[];
  return h.filter(x=>_isPlainObj(x)&&typeof x.startTs==='number'&&typeof x.endTs==='number'&&isFinite(x.startTs)&&isFinite(x.endTs)&&x.endTs>=x.startTs)
    .map(x=>({id:typeof x.id==='string'?x.id.slice(0,40):null,kind:x.kind==='ex'?'ex':'all',startTs:x.startTs,endTs:x.endTs,
      plannedEndTs:typeof x.plannedEndTs==='number'?x.plannedEndTs:x.endTs,early:!!x.early,
      exIds:Array.isArray(x.exIds)?x.exIds.filter(i=>typeof i==='string').slice(0,80):null}))
    .slice(-30);
}
function getActiveDeload(){return _validDeload(S.deload)?S.deload:null;}
// (13a) Descarga de todo el plan: TODOS los ejercicios de fuerza van ligeros (los de 1 serie, que no bajan, y los
// cambiados o añadidos durante la descarga también): ninguno sube peso, reps, tiempo ni distancia. Solo el cardio no.
function deloadAppliesTo(exId){const d=getActiveDeload();if(!d)return false;
  if(d.kind==='all'){const ex=findExInPlan(exId);return !(ex&&ex.cardio);}
  if(d.changes.some(c=>c.exId===exId))return true;
  // (11) el sustituto «solo hoy» de un ejercicio en descarga también va ligero
  const o=_subOrigId(exId);return !!(o&&d.changes.some(c=>c.exId===o));}
// Semana «ligera» para un ejercicio ahora: una descarga que lo incluye o una semana de descanso (coach_prescribe no sube)
function isLightNow(exId){return !!getActiveRest()||deloadAppliesTo(exId);}
// ¿El registro de ese ejercicio en ts cayó en una descarga o en una semana de descanso? No cuenta para la tendencia.
function _lightAt(exId,ts){
  if(typeof ts!=='number'||!isFinite(ts))return false;
  if(Array.isArray(S.restWeeks)&&S.restWeeks.some(r=>r&&r.startTs!=null&&r.endTs!=null&&ts>=r.startTs&&ts<r.endTs))return true;
  const d=S.deload;
  if(_validDeload(d)&&ts>=d.startTs&&(d.kind==='all'||d.changes.some(c=>c.exId===exId)))return true;
  return Array.isArray(S.deloadHistory)&&S.deloadHistory.some(h=>h&&ts>=h.startTs&&ts<h.endTs&&(!Array.isArray(h.exIds)||h.exIds.includes(exId)));
}
// kind 'all': todo el plan, con uno de sus dos planes (13d):
//   · plan 'sets' (por defecto): −40 % de series (mín. 1), mismo peso.
//   · plan 'weight': mismas series y −15 % de la carga (DELOAD_LOAD): kilos en peso × reps; en los de tiempo o distancia,
//     sus kilos si los llevan y, si no, segundos o metros. Lo que no tiene carga que bajar (peso corporal, bandas) va con
//     −40 % de series. Cada ejercicio de fuerza lleva su cambio (los de carga con m:'load' y from = to), para que el
//     historial, las bandas de Progreso y el cambio de ejercicio lo sigan igual que en el plan de series.
// kind 'ex': una serie menos en esos ejercicios.
const DELOAD_SETS=0.6,DELOAD_LOAD=0.85;
function _dlSetsTo(from){return Math.max(1,Math.round(from*DELOAD_SETS));}
function _dlPlanOf(d){return !d?null:d.kind==='ex'?'ex':d.plan==='weight'?'weight':'sets';}
function startDeload(kind,exIds,label,plan){
  if(getActiveDeload())_restoreDeload(true); // una sola a la vez
  const now=Date.now(),P=getPlan(),changes=[],wp=kind!=='ex'&&plan==='weight';
  Object.keys(P).forEach(dk=>{
    const day=P[dk];if(!day||!Array.isArray(day.ex))return;
    day.ex.forEach(ex=>{
      if(!ex||ex.cardio)return;
      if(kind==='ex'&&!(exIds||[]).includes(ex.id))return;
      const from=Math.max(1,Math.min(10,parseInt(ex.s)||3)),lt=exLT(ex);
      if(lt==='c')return;
      if(wp&&(lt==='w'||lt==='t'||lt==='d')){changes.push({exId:ex.id,day:dk,from,to:from,m:'load'});return;}
      const to=kind==='ex'?Math.max(1,from-1):_dlSetsTo(from);
      if(to===from){if(wp)changes.push({exId:ex.id,day:dk,from,to});return;}
      ex.s=to;changes.push({exId:ex.id,day:dk,from,to});
    });
  });
  if(!changes.length)return null;
  S.deload={id:'dl_'+now,kind:kind==='ex'?'ex':'all',startTs:now,endTs:_deloadEndFrom(now),label:String(label||'').slice(0,120),changes};
  if(kind!=='ex')S.deload.plan=wp?'weight':'sets';
  // (13 r1) Con «Menos peso», el que no puede bajar la carga con los saltos de su equipo (kettlebell de 8 kg, mancuernas
  // ligeras, 5 s de plancha) no se queda igual: baja series, como el plan de series.
  if(wp)changes.forEach(c=>{if(c.m!=='load'||!_dlNoLoadCut(c.exId))return;
    const day=P[c.day],ex=day&&Array.isArray(day.ex)?day.ex.find(e=>e&&e.id===c.exId):null,to=_dlSetsTo(c.from);
    delete c.m;if(ex&&to<c.from){ex.s=to;c.to=to;}});
  saveState();
  return S.deload;
}
// (13 r1) Con la descarga actual de «Menos peso», ¿este ejercicio se queda sin bajar carga? (tiene cifra, pero un salto
// menos sería demasiado). Sin historial no se sabe: sigue con carga (la vista previa dice «−15 % de peso»).
function _dlNoLoadCut(exId){
  let p=null;try{p=coach_prescribe(exId);}catch(e){return false;}
  return !!(p&&p.kind==='deload'&&p.dlFrom==null&&(p.weight>0||p.t>0||p.m>0));
}
// (13 r1) ¿La descarga en marcha le bajó las series a este ejercicio (o al original de un «solo hoy»)? Los de 1 serie y
// los añadidos durante la descarga van ligeros con sus series: su texto dice «más suave», no «con menos series».
function _dlFewerSets(exId){
  const d=getActiveDeload();if(!d)return false;
  const o=_subOrigId(exId),c=d.changes.find(x=>x.exId===exId)||(o&&d.changes.find(x=>x.exId===o));
  return !!(c&&c.to<c.from);
}
// (13 r1) Lo que de verdad baja un ejercicio con «Menos peso»: «15 %», o el real si el salto de tu equipo da otro
function _dlPctTxt(from,to){const p=from>0&&to>=0?Math.round((1-to/from)*100):15;return(p>0?p:15)+NB+'%';}
// (13d) ¿Hoy toca bajar la carga de este ejercicio (plan 'weight')? Su cambio lo dice; uno añadido o cambiado durante la
// descarga sin cambio propio, si se mide con carga (peso × reps, tiempo o distancia).
function _dlLoadMode(exId){
  const d=getActiveDeload();if(!d||d.kind!=='all'||d.plan!=='weight')return false;
  const o=_subOrigId(exId),c=d.changes.find(x=>x.exId===exId)||(o&&d.changes.find(x=>x.exId===o));
  if(c)return c.m==='load';
  const ex=findExInPlan(exId);if(!ex||ex.cardio)return false;
  const lt=exLT(ex);return lt==='w'||lt==='t'||lt==='d';
}
// −15 % de unos kilos con los saltos de tu equipo: el salto más cercano, al menos uno menos. null si bajar un salto ya
// es más de un 30 % (un disco de 2.5 kg sobre 5 kg): entonces mismo peso.
function _dlLessKg(w,step){
  if(!(w>0))return null;step=step>0?step:2.5;
  let t=Math.round(w*DELOAD_LOAD/step)*step;
  if(t>=w-1e-9)t=w-step;
  t=_r2(t);
  return t>0&&t>=w*0.7-1e-9?t:null;
}
// −15 % de segundos o metros, redondeado a su salto (5 s, 10 m…), al menos un salto menos
function _dlLessTD(v,lt){
  if(!(v>0))return v;const st=(lt==='t'?_tStep:_dStep)(v);
  let t=Math.round(v*DELOAD_LOAD/st)*st;if(t>=v)t=v-st;
  return Math.max(st,t);
}
// Devuelve las series originales. Si se termina en la primera hora, cuenta como cancelada (sin historial).
function _restoreDeload(early){
  const d=S.deload;
  if(d==null)return false;
  if(_validDeload(d)){
    d.changes.forEach(c=>{const ex=findExInPlan(c.exId);if(ex&&!ex.cardio&&+ex.s===c.to)ex.s=c.from;});
    const now=Date.now();
    if(!(early&&now-d.startTs<3600000)){
      if(!Array.isArray(S.deloadHistory))S.deloadHistory=[];
      // (13 r1) Todo el plan: exIds null = todos los ejercicios (también los de 1 serie y los añadidos durante la
      // descarga, que fueron ligeros: _lightAt y las franjas de Progreso dicen lo mismo)
      S.deloadHistory.push({id:d.id||null,kind:d.kind,startTs:d.startTs,endTs:Math.min(now,d.endTs),plannedEndTs:d.endTs,early:!!early,exIds:d.kind==='all'?null:d.changes.map(c=>c.exId)});
      if(S.deloadHistory.length>30)S.deloadHistory=S.deloadHistory.slice(-30);
    }
  }
  S.deload=null;
  return true;
}
// (13a) La descarga sigue a tu rutina si la cambias mientras dura. Al cambiar un ejercicio (editor, «Cambiar en la
// rutina», «Cambiar a …», propuesta de cambio) su cambio pasa al nuevo, con sus series de verdad (from): al terminar, el
// nuevo vuelve a ellas. Si el nuevo no lleva las series de la descarga (las cambiaste a mano, o es cardio), el cambio se
// va. Al quitar un ejercicio, su cambio se va. Si no queda ninguno, la descarga termina. Devuelve 'end' si terminó.
function _deloadDropChange(c){
  const d=getActiveDeload();if(!d)return false;
  if(d.changes.length<=1&&d.changes[0]===c){_restoreDeload(true);return'end';}
  d.changes=d.changes.filter(x=>x!==c);return true;
}
function _deloadFollowSwap(oldId,nx,dk){
  const d=getActiveDeload();if(!d||!nx||oldId===nx.id)return false;
  const c=d.changes.find(x=>x.exId===oldId);if(!c)return false;
  d.changes=d.changes.filter(x=>x===c||x.exId!==nx.id); // (nunca debería haber otro con el id nuevo)
  if(nx.cardio||(parseInt(nx.s)||0)!==c.to)return _deloadDropChange(c);
  c.exId=nx.id;if(dk)c.day=dk;
  // (13 r1) «Menos peso» y el nuevo no tiene carga que bajar (peso corporal, bandas) o no puede bajarla con sus saltos:
  // baja series, como haría la descarga si hubiera empezado con él
  if(c.m==='load'){const lt=exLT(nx);
    if(!(lt==='w'||lt==='t'||lt==='d')||_dlNoLoadCut(nx.id)){const to=_dlSetsTo(c.from);delete c.m;if(to<c.from){nx.s=to;c.to=to;}}}
  return true;
}
function _deloadDropEx(exId){
  const d=getActiveDeload();if(!d)return false;
  const c=d.changes.find(x=>x.exId===exId);
  return c?_deloadDropChange(c):false;
}
// (13b) Una sola descarga, un solo vocabulario. Todo el plan: «Semana de descarga» (−40 % de series y mismo peso, o
// mismas series y −15 % de peso: 13d). Un
// ejercicio (el retroceso de uno solo): «Descarga en X» (una serie menos, mismo peso). Mismo nombre en la propuesta
// del Coach, en Ajustes, en el aviso (Inicio, Entreno y Coach), en sus toasts y al terminar. Siempre 7 días, vuelve sola.
const DELOAD_PLAN_TXT={sets:'−40 % de series, mismo peso',weight:'mismas series, −15 % de peso',ex:'una serie menos, mismo peso'};
DELOAD_PLAN_TXT.all=DELOAD_PLAN_TXT.sets; // (descargas de antes, sin plan)
// Plan de una descarga en texto («−40 % de series, mismo peso»)
function deloadPlanTxt(d){return DELOAD_PLAN_TXT[_dlPlanOf(d)]||'';}
function _capTxt(t){return t?t[0].toUpperCase()+t.slice(1):t;}
function deloadTitle(d){
  if(!d)return'';
  if(d.kind==='all')return'Semana de descarga';
  const ex=d.changes&&d.changes[0]?findExInPlan(d.changes[0].exId):null;
  return'Descarga en '+(ex?ex.n:'un ejercicio');
}
// Toast al empezarla (propuesta del Coach o Ajustes)
function deloadStartTxt(d){
  if(d.kind==='all')return`🧘 Semana de descarga: ${deloadPlanTxt(d)} · ${deloadBackOnTxt(d)}`;
  const c=d.changes[0];return`🧘 ${deloadTitle(d)}: ${_nSeries(c.to)} · ${deloadBackOnTxt(d)}`;
}
// (13e) Fechas de la descarga: un solo formato («dom 8 nov», mes en minúscula) y una sola frase para el final. La
// descarga acaba a las 00:00 de endTs, así que ese día ya es normal: «tu plan vuelve el dom 8 nov» (nunca «hasta el»).
const DL_WD=['dom','lun','mar','mié','jue','vie','sáb'];
function _dlDayTxt(ts){const d=new Date(ts);return DL_WD[d.getDay()]+' '+d.getDate()+' '+MONTHS[d.getMonth()].toLowerCase();}
function deloadBackOnTxt(d){return'tu plan vuelve el '+deloadEndTxt(d);}
// (13 r1) Qué vuelve al terminar, según el plan: las series («Menos series», «Descarga en X») o los pesos («Menos peso»;
// y las series de lo que no tenía peso que bajar). El mismo texto al terminar antes, al caducar, al quitar el último
// ejercicio en descarga y al empezar un descanso.
function deloadBackTxt(d){
  if(_dlPlanOf(d)!=='weight')return'tu plan vuelve a sus series';
  return(d.changes||[]).some(c=>c&&c.to<c.from)?'vuelves a tus pesos y series de siempre':'vuelves a tus pesos de siempre';
}
// (13e) El mismo aviso (con 🧘) al terminarla antes y al caducar
function deloadEndMsg(d){return'🧘 Descarga terminada · '+deloadBackTxt(d);}
function endDeload(){
  const d=getActiveDeload();if(!d)return;
  const ex=d.kind==='ex'?findExInPlan(d.changes[0].exId):null;
  const back=_dlPlanOf(d)==='weight'?_capTxt(deloadBackTxt(d)).replace(/^Vuelves a/,'Vuelves ahora a'):'Tu plan vuelve ahora a sus series normales';
  confirmModal({
    title:'Terminar descarga',
    body:`${ex?`${ex.n} vuelve ahora a ${_nSeries(d.changes[0].from)}`:back}. ¿Seguro que quieres terminar ya la descarga? Si sigues, ${deloadBackOnTxt(d)}.`,
    okText:'Terminar',cancelText:'Seguir en descarga',
    onOk:()=>{const msg=deloadEndMsg(d);
      // (13d) sin volver a recomendarla enseguida; (13 r1) salvo si fue un toque sin querer (menos de 1 h: se cancela
      // sin historial, como si no hubiera empezado)
      if(d.kind==='all'&&Date.now()-d.startTs>=3600000)S.dlRecoSnoozeTs=_addDaysLocal(_startOfDay(Date.now()),7);
      _restoreDeload(true);saveState();render();toast(msg);}
  });
}
// (13b) La ÚNICA forma de empezar una semana de descarga de todo el plan (propuesta del Coach y Ajustes): mismas
// comprobaciones y mismos textos. Devuelve {ok, msg, dlId?, drop?}.
function beginFullDeload(plan){
  if(getActiveRest())return{ok:false,msg:'Estás en tu semana de descanso: termínala antes de empezar una descarga'};
  if(_hasSubs())return{ok:false,msg:'Hoy tienes un ejercicio cambiado «solo hoy»: empieza la descarga cuando guardes el entreno'};
  // Con un entreno a medias, la sesión se guardaría recortada y marcada como descarga
  if(getActiveWorkout())return{ok:false,msg:'Termina o descarta el entreno en curso antes de empezar la descarga'};
  // (13e r1) Una «Descarga en X» en marcha termina (su ejercicio vuelve a sus series) y la semana la sustituye: se dice
  const prev=getActiveDeload(),prevTxt=prev&&prev.kind==='ex'?_dlReplacesTxt(prev):'';
  const d=startDeload('all',null,'Semana de descarga',plan==='weight'?'weight':'sets');
  if(!d)return{ok:false,drop:true,msg:plan==='weight'?'Tu plan no tiene ejercicios de fuerza que descargar':'Tu plan ya está en el mínimo de series'};
  return{ok:true,dlId:d.id,msg:deloadStartTxt(d)+(prevTxt?' · '+prevTxt:'')};
}
// «sustituye a la descarga en Sentadilla» (una «Descarga en X» en marcha)
function _dlReplacesTxt(d){return'sustituye a la '+deloadTitle(d).replace(/^Descarga/,'descarga');}
// (13b) Ajustes → «Descarga o descanso»: las dos maneras de recuperarte una semana, explicadas en el mismo sitio.
// Con una en marcha, la fila la termina (endDeload / endRestWeek) en vez de abrir esto.
// (13 r1) Plan de la semana de descarga elegido en el selector (no se guarda; empieza en «Menos series»)
let _rcPlan='sets';
function _rcDlDesc(plan,end){const e=esc(end).replace(/ /g,NB);
  return plan==='weight'?`Sigues entrenando con tus series y un 15${NB}% menos de peso; lo que no tiene peso que bajar va con menos series. Esa semana no se sube nada y tu plan vuelve el ${e}.`
    :`Sigues entrenando, con un 40${NB}% menos de series y el mismo peso. Esa semana no se sube nada y tu plan vuelve el ${e}.`;}
// (13e) Radios «Menos series / Menos peso» (Coach y Ajustes): un solo radio en el orden de tabulación (el elegido) y
// las flechas cambian de opción, como un radiogroup de verdad
function _dlrOptHtml(k,t,dsc,on,fn){
  return`<button type="button" class="dlr-opt${on?' on':''}" role="radio" aria-checked="${on}" tabindex="${on?0:-1}" data-plan="${k}" onclick="${fn}('${k}')" onkeydown="_dlrKey(event,'${fn}')">
      <span class="dlr-opt-t">${t}</span><span class="dlr-opt-d">${dsc}</span></button>`;
}
function _dlrKey(ev,fn){
  const k=ev.key,g=ev.currentTarget&&ev.currentTarget.closest('[role=radiogroup]');if(!g)return;
  const opts=[...g.querySelectorAll('[role=radio]')],i=opts.indexOf(ev.currentTarget);if(i<0)return;
  let j=-1;
  if(k==='ArrowRight'||k==='ArrowDown')j=(i+1)%opts.length;
  else if(k==='ArrowLeft'||k==='ArrowUp')j=(i-1+opts.length)%opts.length;
  else if(k==='Home')j=0;else if(k==='End')j=opts.length-1;
  if(j<0)return;
  ev.preventDefault();
  const plan=opts[j].dataset.plan;
  if(fn==='rcPlanPick'){rcPlanPick(plan);try{opts[j].focus();}catch(e){}}
  else if(fn==='dlRecoPick')dlRecoPick(plan); // repinta y devuelve el foco al elegido
}
function rcPlanPick(k){
  _rcPlan=k==='weight'?'weight':'sets';
  const root=document.getElementById('cmodal-root');if(!root)return;
  root.querySelectorAll('.rc-plan .dlr-opt').forEach(b=>{const on=b.dataset.plan===_rcPlan;b.classList.toggle('on',on);b.setAttribute('aria-checked',on);b.tabIndex=on?0:-1;});
  const dd=root.querySelector('.rc-opt[data-k="deload"] .rc-d');if(dd)dd.innerHTML=_rcDlDesc(_rcPlan,deloadEndTxt({endTs:_deloadEndFrom(Date.now())}));
}
// (13e) La semana de descarga se elige como en el Coach: primero el plan (radios) y luego «Empezar descarga». El
// descanso no tiene nada que elegir: se empieza al tocarlo.
function openRecoveryChooser(){
  const root=document.getElementById('cmodal-root');if(!root)return;
  const end=deloadEndTxt({endTs:_deloadEndFrom(Date.now())}),cd=getActiveDeload(),exDl=cd&&cd.kind==='ex'?cd:null;
  _rcPlan='sets';
  root.innerHTML=`<div class="cmov" onclick="if(event.target===this)closeRecoveryChooser()"><div class="cmod" role="dialog" aria-modal="true" aria-labelledby="rc-t">
    <div class="cmod-hdl"></div>
    <div class="cmod-t" id="rc-t">Descarga o descanso</div>
    <div class="cmod-b">Una semana para recuperarte. Tu plan no se pierde: vuelve solo al terminar.</div>
    <div class="rc-opts">
      <div class="rc-opt rc-dl" data-k="deload" role="group" aria-labelledby="rc-dl-t"><span class="rc-ic" aria-hidden="true">${ic('leaf')}</span><span class="rc-b">
        <span class="rc-t" id="rc-dl-t">Semana de descarga</span><span class="rc-d">${_rcDlDesc(_rcPlan,end)}</span>
        <span class="rc-plan dlr-opts" role="radiogroup" aria-label="Cómo quieres descargar">
          ${_dlrOptHtml('sets','Menos series',`−40${NB}% de series, mismo peso`,_rcPlan==='sets','rcPlanPick')}
          ${_dlrOptHtml('weight','Menos peso',`Mismas series, −15${NB}% de peso`,_rcPlan==='weight','rcPlanPick')}
        </span>
        ${exDl?`<span class="rc-note">Tu «${esc(deloadTitle(exDl))}» termina al empezarla: la semana la sustituye.</span>`:''}
        <button type="button" class="btn bp rc-go" onclick="recoveryPick('deload')">Empezar descarga</button></span></div>
      <button type="button" class="rc-opt" data-k="rest" onclick="recoveryPick('rest')"><span class="rc-ic" aria-hidden="true">${ic('moon')}</span><span class="rc-b">
        <span class="rc-t">Semana de descanso</span><span class="rc-d">7 días sin entrenar. El Coach no penaliza tu constancia ni tu racha.</span></span></button>
    </div>
    <button type="button" class="btn bs rc-cancel" onclick="closeRecoveryChooser()">Cancelar</button>
  </div></div>`;
  const b=root.querySelector('.rc-plan .dlr-opt.on');if(b)try{b.focus({preventScroll:true});}catch(e){}
}
function closeRecoveryChooser(){const root=document.getElementById('cmodal-root');if(root&&root.querySelector('.rc-opts'))root.innerHTML='';}
function recoveryPick(k){
  closeRecoveryChooser();
  if(k==='rest'){_beginRestWeek();return;}
  const r=beginFullDeload(_rcPlan);
  if(!r.ok){toast(r.msg);return;}
  S.settingsOpen=false;saveState();render();toast(r.msg,3600);
}
// Caducidad: al pasar endTs vuelve sola. No cambia las series en mitad de un entreno (espera a que lo guardes,
// como mucho 12 h). Devuelve true si cambió algo (el llamador repinta).
function deloadTick(){
  const d=S.deload;
  if(d==null)return false;
  if(!_validDeload(d)){S.deload=null;saveState();return true;}
  const now=Date.now();
  if(now<d.endTs)return false;
  const aw=getActiveWorkout();
  if(aw&&aw.startTs&&now-aw.startTs<12*3600000)return false;
  const msg=deloadEndMsg(d);
  _restoreDeload(false);saveState();
  toast(msg,4000);
  return true;
}
// Fecha (texto) en que el plan vuelve a la normalidad
function deloadEndTxt(d){return _dlDayTxt(d.endTs);}
// Aviso de descarga (Inicio, Entreno, Coach) y de semana de descanso (solo Entreno: Inicio y Coach ya lo muestran)
function lightBannerHtml(where){
  const d=getActiveDeload();
  if(d){
    let name='';
    if(d.kind==='ex'){
      const ex=findExInPlan(d.changes[0].exId);name=ex?ex.n:'';
      // en Entreno, la descarga de un solo ejercicio solo se avisa en su día
      if(where==='workout'){const day=getPlan()[S.day];if(!day||!day.ex.some(e=>d.changes.some(c=>c.exId===e.id)))return'';}
    }
    const over=Date.now()>=d.endTs;
    const t=deloadTitle(d);
    // (13e) la fecha no se parte en dos líneas («dom 8 / nov»)
    const whenH=over?'Tu plan vuelve al guardar este entreno':`Tu plan vuelve el <span class="dl-when">${esc(deloadEndTxt(d))}</span>`;
    const desc=where==='workout'?`${_capTxt(deloadPlanTxt(d))}: esta semana no subas peso.`:`${_capTxt(deloadPlanTxt(d))}. Después vuelves más fuerte.`;
    // (10) Dentro de la tarjeta «HOY TOCA»: versión compacta (las filas ya dicen «descarga» y su objetivo 🧘), para que «Empezar» quepa
    if(where==='hoy')return`<div class="dl-banner cmp" role="status" title="${esc(desc)}"><span class="dl-banner-ic" aria-hidden="true">${ic('leaf')}</span><div class="dl-banner-b">
      <div class="dl-banner-t">${esc(t)}</div><div class="dl-banner-d">${whenH} · ${_dlPlanOf(d)==='weight'?'menos peso':'menos series'}</div></div>
      <button class="dl-banner-btn" onclick="endDeload()" aria-label="Terminar la descarga">Terminar</button></div>`;
    return`<div class="dl-banner" role="status"><span class="dl-banner-ic" aria-hidden="true">${ic('leaf')}</span><div class="dl-banner-b">
      <div class="dl-banner-t">${esc(t)}</div><div class="dl-banner-d">${whenH} · ${esc(desc)}</div></div>
      <button class="dl-banner-btn" onclick="endDeload()" aria-label="Terminar la descarga">Terminar</button></div>`;
  }
  const r=where==='workout'?getActiveRest():null;
  if(r){
    const left=restDaysLeft(r);
    return`<div class="dl-banner rest" role="status"><span class="dl-banner-ic" aria-hidden="true">${ic('moon')}</span><div class="dl-banner-b">
      <div class="dl-banner-t">Semana de descanso · <span class="dl-when">${left>0?`quedan ${left} día${left!==1?'s':''}`:'termina hoy'}</span></div>
      <div class="dl-banner-d">Si entrenas, hazlo suave: mismo peso o menos. Esta semana no se sube peso.</div></div>
      <button class="dl-banner-btn" onclick="endRestWeek()" aria-label="Terminar la semana de descanso">Terminar</button></div>`;
  }
  return'';
}

// Propuestas del Coach guardadas (S.pendingCoachProposals): forma válida, id estable y único, textos acotados.
// Sirve igual para las de versiones anteriores (sin prio/basis) y para backups importados.
function _sanitizeProposals(list){
  if(!Array.isArray(list))return[];
  const TYPES=['add_set','rm_set','rep_scheme','deload','add_ex','swap','cardio_min'],seen=new Set(),out=[]; // (E16d) cardio_min
  const str=(v,n)=>typeof v==='string'?v.slice(0,n):'';
  const idOrNull=v=>typeof v==='string'&&v&&v.length<=80?v:null;
  list.forEach(p=>{
    if(!_isPlainObj(p)||typeof p.id!=='string'||!/^[\w.:-]{1,120}$/.test(p.id)||seen.has(p.id)||!TYPES.includes(p.type))return;
    seen.add(p.id);
    const q={id:p.id,type:p.type,ic:str(p.ic,8),tag:str(p.tag,40),title:str(p.title,160),description:str(p.description,600),
      exId:idOrNull(p.exId),dayKey:typeof p.dayKey==='string'&&/^[A-Za-z0-9_]{1,12}$/.test(p.dayKey)?p.dayKey:null,libExId:idOrNull(p.libExId)};
    if(typeof p.diff==='string'&&p.diff)q.diff=p.diff.slice(0,120);
    if(typeof p.short==='string'&&p.short)q.short=p.short.slice(0,120);
    if(typeof p.prio==='number'&&isFinite(p.prio))q.prio=p.prio;
    if(typeof p.sev==='number'&&isFinite(p.sev))q.sev=p.sev;
    if(['fatigue','down','stagnant','flat','volume','legacy_up','power','cycle','cardio'].includes(p.basis))q.basis=p.basis;
    if(p.type==='cardio_min'&&_isPlainObj(p.to)&&Number.isInteger(p.to.min)&&p.to.min>=5&&p.to.min<=60)q.to={min:p.to.min}; // (E16d)
    if(typeof p.createdAt==='number'&&isFinite(p.createdAt))q.createdAt=p.createdAt;
    if(_isPlainObj(p.to)&&Number.isInteger(p.to.s)&&p.to.s>=1&&p.to.s<=10&&(Number.isInteger(p.to.r)&&p.to.r>=1&&p.to.r<=30||typeof p.to.r==='string'&&/^\d{1,2}-\d{1,2}$/.test(p.to.r)))q.to={s:p.to.s,r:p.to.r}; // (E16d) o un rango
    out.push(q);
  });
  return out.slice(0,30);
}

// Sincroniza S.activeWorkout con las marcas reales de CUALQUIER día (auto-sana).
// Reapunta al día con marcas y lo limpia cuando no queda ninguna en ningún día.
function syncActiveWorkout(){
  // Una sesión reabierta cuyo día ya no tiene series marcadas vuelve al historial tal como estaba
  _reconcileReopened();
  const day=currentInProgressDay();
  if(day){
    if(!S.activeWorkout||S.activeWorkout.day!==day){
      const ts=(S.activeWorkout&&S.activeWorkout.day===day&&S.activeWorkout.startTs)?S.activeWorkout.startTs:(S.sessionStartTs||Date.now());
      S.activeWorkout={day,startTs:ts};
      if(!S.sessionStartTs)S.sessionStartTs=ts;
    }
  }else{
    S.activeWorkout=null;S.sessionStartTs=null;
  }
}

// Infiere el día con un entreno a medias a partir de las series marcadas (para migración / recuperación).
function inferActiveDay(data){
  const plan=(data&&data.currentPlan)||PLAN;
  const sets=(data&&data.sets)||{};
  let best=null,bestCount=0;
  for(const dk of Object.keys(plan)){
    const day=plan[dk];
    if(!day||!Array.isArray(day.ex))continue;
    let count=0;
    day.ex.forEach(ex=>{
      const c=sets[ex.id];
      if(c)for(const k in c){if(c[k])count++;}
    });
    if(count>bestCount){bestCount=count;best=dk;}
  }
  return best;
}

function migrateState(data){
  if(!data)return data;
  const v=data.schema_version||1;
  if(v<4){
    data.coachStart=data.coachStart||null;
    data.mesocycles=data.mesocycles||[];
    data.coachInsights=data.coachInsights||null;
    data.coachInsightsStale=data.coachInsightsStale!==false;
  }
  if(v<5){
    data.currentPlan=data.currentPlan||null;
    data.pendingCoachProposals=data.pendingCoachProposals||[];
    data.appliedProposals=data.appliedProposals||[];
  }
  if(v<6){
    // v6: RPE por serie + calentamiento + análisis semanal
    data.rpe=data.rpe||{}; // {exId: {setIdx: 1|2|3}} para sesión actual
    data.warmups=data.warmups||{}; // {exId: {setIdx: true}} para sesión actual
    data.weeklyAnalyses=data.weeklyAnalyses||[]; // [{weekStart, weekEnd, ...}]
    data.lastWeekAnalysisTs=data.lastWeekAnalysisTs||null;
  }
  if(v<7){
    // v7: sembrar muscle/compound en ejercicios del currentPlan que vinieran de PLAN sin esos campos
    if(data.currentPlan){
      Object.keys(data.currentPlan).forEach(dk=>{
        const day=data.currentPlan[dk];
        const original=PLAN[dk];
        if(day&&Array.isArray(day.ex)&&original){
          day.ex.forEach(ex=>{
            const orig=original.ex.find(o=>o.id===ex.id);
            if(orig){
              if(!ex.muscle&&orig.muscle)ex.muscle=orig.muscle;
              if(ex.compound==null&&orig.compound)ex.compound=orig.compound;
            }
          });
        }
      });
    }
    // Limpiar campos transitorios persistidos de versiones anteriores
    ['wmodal','wnew','settingsOpen','_hist','open','_editWeightTarget','_deloadActive','_wdetail','_wdetailN'].forEach(k=>{if(k in data)delete data[k];});
  }
  if(v<8){
    // v8: objetivo de días por semana configurable. ADITIVO — no modifica ni borra nada existente.
    // Por defecto 3, que reproduce EXACTAMENTE el comportamiento anterior de la app.
    if(data.weeklyTarget==null)data.weeklyTarget=WEEKLY_TARGET_DEFAULT;
  }
  if(v<9){
    // v9: reanudar entreno incompleto. ADITIVO — no borra series ni datos.
    // Recupera el entreno a medias actual infiriendo el día desde las series ya marcadas.
    if(data.activeWorkout==null){
      data.activeWorkout=null;
      const inferred=inferActiveDay(data);
      if(inferred){
        data.activeWorkout={day:inferred,startTs:data.sessionStartTs||null};
      }
    }
  }
  if(v<10){
    // v10: semana de descanso planificada. ADITIVO — solo añade la lista si falta.
    if(!Array.isArray(data.restWeeks))data.restWeeks=[];
  }
  if(v<11){
    // v11: sesión reabierta (conserva fecha, duración y nota al volver a guardarla). ADITIVO.
    if(data.reopenedSession===undefined)data.reopenedSession=null;
  }
  if(v<12){
    // v12: temporizador de descanso/cardio con hora de fin (sobrevive a recargas) + preferencia de sonido. ADITIVO.
    if(data.restTimer===undefined)data.restTimer=null;
    if(typeof data.timerSound!=='boolean')data.timerSound=true;
  }
  if(v<13){
    // v13: descarga temporal y reversible (guarda las series originales y vuelve sola) + su historial. ADITIVO.
    if(data.deload===undefined)data.deload=null;
    if(!Array.isArray(data.deloadHistory))data.deloadHistory=[];
    // Propuestas pendientes de la versión anterior (detector antiguo): se les asigna el motivo que implicaba su
    // tipo para revisarlas con el diagnóstico nuevo. Si ya no se cumple (p. ej. un falso «estancado»), no se muestran.
    if(Array.isArray(data.pendingCoachProposals)){
      const B={rep_scheme:'stagnant',swap:'stagnant',rm_set:'down',add_ex:'volume',deload:'fatigue',add_set:'legacy_up'};
      data.pendingCoachProposals.forEach(p=>{
        if(!p||typeof p!=='object'||p.basis||!B[p.type])return;
        p.basis=B[p.type];
        if(p.type==='deload'&&typeof p.createdAt!=='number')p.createdAt=Date.now();
      });
    }
  }
  if(v<14){
    // v14: los registros de fuerza guardan el nombre del ejercicio (n). ADITIVO: se apunta en el último registro de
    // cada ejercicio cuyo nombre se conoce (plan actual o plan original), para que Progreso nunca muestre el id
    // interno («A3», «ex_…») si después lo quitas o lo cambias. Los registros nuevos ya lo traen.
    _backfillStrengthNames(data);
  }
  if(v<15){
    // v15: Coach de carga. ADITIVO: saltos de peso por tipo de equipo (los de por defecto si faltan o no valen).
    data.loadSteps=_sanitizeLoadSteps(data.loadSteps);
  }
  if(v<16){
    // v16: cada registro de fuerza guarda el plan con el que se hizo (ps = series, pr = reps del plan). ADITIVO: en los
    // antiguos se apunta el de antes de un «Añadir serie» / «Cambiar esquema» aplicado después y, si no, el de ahora.
    // Así un cambio de series o reps posterior (Coach o editor) no se confunde con series sin completar.
    _backfillRecPlans(data);
  }
  if(v<17){
    // v17: mapa muscular 3D. ADITIVO: rango elegido en Progreso (7 días / 4 semanas / ciclo); por defecto 4 semanas.
    if(!['7d','4w','cycle'].includes(data.mmRange))data.mmRange='4w';
  }
  if(v<18){
    // v18: registro serie a serie (modo gym). ADITIVO: S.logs[exId].sets (valores de cada serie de hoy) y el campo
    // sets:[{w,r,rpe}] de los registros de fuerza nuevos. Los datos antiguos no cambian (sin sets siguen valiendo
    // v/r/setsDone/rpe); solo se sanea lo que venga con mala forma.
    _sanitizeSetData(data);
  }
  if(v<19){
    // v19: «Descanso pro». ADITIVO: descanso elegido por ejercicio (vacío = automático por tipo, como antes salvo los
    // multiarticulares de 8 reps o menos, que pasan a 2 min) y la preferencia de mantener la pantalla encendida.
    data.restOverrides=_sanitizeRestOverrides(data.restOverrides);
    if(typeof data.keepAwake!=='boolean')data.keepAwake=true;
  }
  if(v<20){
    // v20: «Máquina ocupada» / «Solo hoy». ADITIVO: un ejercicio cambiado solo por hoy lleva el de tu rutina en ex.sub
    // ({orig, ts, day}: vuelve solo al guardar o descartar la sesión) y la sesión guardada, subs:[{orig, on, alt, lib, n}].
    // Los datos antiguos no tienen ninguno: solo se sanea lo que venga con mala forma.
    _sanitizePlanSubs(data.currentPlan);
    _sanitizeSessSubs(data.sessions);
  }
  if(v<21){
    // v21: claves nuevas de primer nivel (V21_DEFAULTS: respuestas, sitios, salud, rutina generada…). Nada que migrar:
    //  · sus valores por defecto viven en el estado inicial, nunca aquí: importData llama a migrateState sobre los datos de la
    //    copia, y una clave puesta aquí a null taparía la del móvil (42 R1);
    //  · lbl/focus/did de las sesiones y did de los días se apuntan en el momento justo (stampSessionsLbl), no aquí (42 R2).
    // Se sube la versión para marcar las copias que pueden traer días D-F y claves nuevas: una app más vieja no las restaura.
  }
  _unifyDeloadTexts(data); // (13b) idempotente: corre siempre
  data.schema_version=SCHEMA_VERSION;
  return data;
}
// (13b) Una sola descarga, un solo vocabulario. Lo que guardaron versiones anteriores (propuestas pendientes y aplicadas,
// la descarga en curso) pasa a los textos de ahora: «Reducir volumen en X» → «Descarga en X» (🧘 Descarga) y «Tu historial
// de X se conserva» dice dónde está. Solo textos: no toca series, fechas, ids ni el plan. Idempotente (cada carga e import).
function _unifyDeloadTexts(data){
  if(!data||typeof data!=='object')return;
  const ren=t=>typeof t==='string'?t.replace(/^Reducir volumen en /,'Descarga en '):t;
  const fix=p=>{
    if(!_isPlainObj(p))return;
    if(p.type==='rm_set'){p.title=ren(p.title);if(p.tag==='Recuperación')p.tag='Descarga';if(p.ic==='⚠️')p.ic='🧘';
      if(typeof p.description==='string')p.description=p.description.replace(/ durante 7 días; después vuelve solo a /,' con el mismo peso durante 7 días; después vuelve sola a ');}
    if(p.type==='deload'&&p.tag==='Recuperación')p.tag='Descarga';
    if(p.type==='swap'&&typeof p.description==='string')p.description=p.description.replace(/Tu historial de (.{1,80}?) se conserva\./,'Tu historial de $1 no se pierde: sigue en Progreso, en «Fuera».');
  };
  [data.pendingCoachProposals,data.appliedProposals].forEach(L=>{if(Array.isArray(L))L.forEach(fix);});
  if(_isPlainObj(data.deload)&&typeof data.deload.label==='string')data.deload.label=ren(data.deload.label);
}
// v18: datos serie a serie con buena forma (backups editados a mano o corruptos). Nunca borra un registro: solo su
// lista de series si no vale; cada serie queda {w, r} (números o null) y, en los registros, también rpe 1-3 o null.
function _sanitizeLogEntry(L){
  if(!_isPlainObj(L))return{};
  if('sets' in L){
    if(!Array.isArray(L.sets))delete L.sets;
    else L.sets=L.sets.slice(0,SET_MAX_N).map(_setEntry);
  }
  ['w','r','t','d'].forEach(k=>{if(k in L&&L[k]!=null&&typeof L[k]!=='string'&&typeof L[k]!=='number')delete L[k];else if(typeof L[k]==='string')L[k]=L[k].slice(0,8);});
  return L;
}
function _sanitizeRecSets(r){
  if(!r||typeof r!=='object'||!('sets' in r))return;
  if(!Array.isArray(r.sets)){delete r.sets;return;}
  const a=r.sets.slice(0,SET_MAX_N).filter(s=>s&&typeof s==='object'&&!Array.isArray(s)).map(s=>{const p=+s.rpe,o=_setEntry(s);o.rpe=p>=1&&p<=3?p:null;return o;});
  if(a.length)r.sets=a;else delete r.sets;
}
// Medida y tipo de un registro: t segundos, m metros (enteros con su tope) y lt de REC_LT; lo que no vale, fuera
function _sanitizeRecMeta(r){
  if(!r||typeof r!=='object')return;
  if('t' in r){const t=_setNumT(r.t);if(t==null)delete r.t;else r.t=t;}
  if('m' in r){const m=_setNumD(r.m);if(m==null)delete r.m;else r.m=m;}
  if('lt' in r&&!REC_LT.includes(r.lt))delete r.lt;
  // por tiempo o distancia sin su medida (un backup editado a mano): sin tipo, como lo guarda la app (tdNoX al terminar);
  // si no, un registro vacío por tiempo al final de un ejercicio de kilos lo pasaría todo a «0 s»
  if((r.lt==='t'&&r.t==null)||(r.lt==='d'&&r.m==null))delete r.lt;
}
function _sanitizeSetData(data){
  if(!data||typeof data!=='object')return;
  const logs=o=>{if(_isPlainObj(o))Object.keys(o).forEach(id=>{if(_isPlainObj(o[id]))_sanitizeLogEntry(o[id]);});};
  const recs=st=>{if(_isPlainObj(st))Object.values(st).forEach(a=>{if(Array.isArray(a))a.forEach(r=>{_sanitizeRecSets(r);_sanitizeRecMeta(r);});});};
  logs(data.logs);recs(data.strength);
  if(Array.isArray(data.sessions))data.sessions.forEach(s=>{if(s&&_isPlainObj(s.snapshot))logs(s.snapshot.logs);});
  const rs=data.reopenedSession;
  if(_isPlainObj(rs)){recs(rs.strength);if(_isPlainObj(rs.session)&&_isPlainObj(rs.session.snapshot))logs(rs.session.snapshot.logs);}
}
// Apunta ps/pr en los registros de fuerza de data (y en los de una sesión reabierta) que no los tengan
function _backfillRecPlans(data){
  if(!data||typeof data!=='object')return;
  const plan=_isPlainObj(data.currentPlan)?data.currentPlan:PLAN,byId={};
  Object.values(plan).forEach(d=>{if(d&&Array.isArray(d.ex))d.ex.forEach(e=>{if(e&&e.id!=null&&!e.cardio)byId[String(e.id)]=e;});});
  const dl=_isPlainObj(data.deload)&&Array.isArray(data.deload.changes)?data.deload.changes:[];
  // Series de verdad (las de antes de una descarga en curso), como _baseSets
  const base=e=>{const s=parseInt(e.s)||3,c=dl.find(c=>c&&c.exId===e.id);return c&&s===+c.to&&+c.from>0?+c.from:s;};
  const stamp=st=>{
    if(!_isPlainObj(st))return;
    Object.keys(st).forEach(id=>{
      const e=byId[id],arr=st[id];
      if(!e||!Array.isArray(arr))return;
      arr.forEach(r=>{
        if(!r||typeof r!=='object')return;
        const b=_planBefore(data.appliedProposals,e.id,+r.ts);
        if(!(parseInt(r.ps)>0))r.ps=b&&b.s>0?b.s:base(e);
        if(!_validPr(r.pr)){const pr=b&&b.r!=null?b.r:e.r;if(_validPr(pr))r.pr=typeof pr==='number'?pr:String(pr).slice(0,20);}
      });
    });
  };
  stamp(data.strength);
  if(_isPlainObj(data.reopenedSession))stamp(data.reopenedSession.strength);
}
function _validPr(x){return(typeof x==='number'&&x>0&&isFinite(x))||(typeof x==='string'&&x.trim()!==''&&x.length<=20);}
// Pone n (nombre) en el último registro de cada ejercicio de data.strength que no lo tenga, si el nombre se conoce
function _backfillStrengthNames(data){
  const st=data&&data.strength;
  if(!st||typeof st!=='object'||Array.isArray(st))return;
  const byId={};
  [PLAN,data.currentPlan].forEach(p=>{ // el plan actual pisa al original
    if(!p||typeof p!=='object')return;
    Object.values(p).forEach(d=>{if(d&&Array.isArray(d.ex))d.ex.forEach(e=>{if(e&&e.id!=null&&typeof e.n==='string'&&e.n.trim())byId[String(e.id)]=e.n.trim();});});
  });
  Object.keys(st).forEach(id=>{
    const arr=st[id];if(!Array.isArray(arr)||!arr.length)return;
    const last=arr[arr.length-1];
    if(!last||typeof last!=='object'||(typeof last.n==='string'&&last.n.trim()))return;
    if(byId[id])last.n=byId[id].slice(0,120);
  });
}

let S=Object.assign({tab:'dash',day:'A',nextDay:'A',open:null,logs:{},sets:{},weights:[],sessions:[],strength:{},wmodal:false,wnew:'',onboarded:false,startDay:'A',
  coachStart:null,mesocycles:[],currentPlan:null,coachInsights:null,coachInsightsStale:true,coachLastAnalyzed:null,schema_version:SCHEMA_VERSION,settingsOpen:false,
  pendingCoachProposals:[],appliedProposals:[],rpe:{},warmups:{},weeklyAnalyses:[],lastWeekAnalysisTs:null,weeklyTarget:WEEKLY_TARGET_DEFAULT,activeWorkout:null,restWeeks:[],wRange:'3m',hRange:'6m',rRange:'6m',reopenedSession:null,restTimer:null,timerSound:true,deload:null,deloadHistory:[],dlRecoSnoozeTs:null,loadSteps:_defaultLoadSteps(),mmRange:'4w',restOverrides:{},keepAwake:true,restOn:true,rpeOn:true,
  lastBackupTs:null,backupSnoozeTs:null,lastBackupKind:null,lastJsonBackupTs:null,dataEditTs:null,libPlace:'g',libKit:null,libFav:[],libRecent:[],...V21_DEFAULTS},migrateState(loadState())||{});

// Inicializar currentPlan mutable desde PLAN si no existe aún
if(!S.currentPlan){
  S.currentPlan=JSON.parse(JSON.stringify(PLAN));
  saveState();
}
// (E1a) Claves de día válidas: lo que no es un día (otra clave, sin lista de ejercicios) se quita; sin ningún día, el plan de fábrica
// (E1b) y cada día con su id estable (did); las letras que falten se corren al final del arranque (_fixPlanLetters)
{const _pj0=JSON.stringify(S.currentPlan);S.currentPlan=_sanitizePlanKeys(S.currentPlan);
  if(JSON.stringify(S.currentPlan)!==_pj0)saveState();}

// Helper: plan activo (mutable) — SIEMPRE usar getPlan() en vez de PLAN directamente
function getPlan(){return S.currentPlan||PLAN;}

// ── (E1a) DÍAS DE LA RUTINA: de 2 a 6, con claves A…F ──
// Claves de una letra de la A a la F, consecutivas desde la A e insertadas en orden (nunca R, V ni W: chocan con las clases
// .pr/.pv/.pw de las pastillas p<letra>). La app TOLERA de 1 a 6 días (copias antiguas o editadas a mano), pero no crea
// rutinas de 1 día. dayKeys() es la única fuente del orden; liveDayKeys(), los días con algún ejercicio: un día vacío no
// entra en la rotación ni se puede guardar como sesión. DAY_ORDER queda solo para el plan de fábrica.
function _isPlanDay(d){return _isPlainObj(d)&&Array.isArray(d.ex);}
function dayKeys(plan){const p=plan||getPlan();return _isPlainObj(p)?DAY_KEYS.filter(k=>Object.prototype.hasOwnProperty.call(p,k)&&_isPlanDay(p[k])):[];}
function _dayLive(d){return _isPlanDay(d)&&d.ex.some(_isPlainObj);}
function liveDayKeys(plan){const p=plan||getPlan();return dayKeys(p).filter(k=>_dayLive(p[k]));}
// Nombre del día para pintar (sin escapar: escápalo con esc() al meterlo en HTML)
function dayLabel(k,plan){const d=(plan||getPlan())[k];return _isPlanDay(d)&&d.label!=null&&String(d.label).trim()?String(d.label):'Día '+k;}
// Al cargar y al importar: fuera lo que no sea un día A…F con su lista de ejercicios; si no queda ninguno, el plan de fábrica.
// (E1b) Cada día con su id estable (did), único en la rutina. Las letras que falten (A, B, D) se corren después, con los
// nombres ya apuntados en las sesiones (_fixPlanLetters, al arrancar y al importar).
function _sanitizePlanKeys(plan){
  if(!_isPlainObj(plan))plan=JSON.parse(JSON.stringify(PLAN));
  Object.keys(plan).forEach(k=>{if(!(DAY_KEYS.includes(k)&&_isPlanDay(plan[k])))delete plan[k];});
  if(!dayKeys(plan).length)plan=JSON.parse(JSON.stringify(PLAN));
  const seen=new Set();
  dayKeys(plan).forEach(k=>{const d=plan[k];if(!(typeof d.did==='string'&&DID_RE.test(d.did))||seen.has(d.did))d.did=newDayId(plan);seen.add(d.did);});
  return plan;
}

// ── (E1b) ID ESTABLE DE CADA DÍA Y NOMBRE DEL DÍA EN CADA SESIÓN ──
// Cada día lleva did ('d_…'): viaja con él aunque cambie de letra (al quitar un día, las letras siguientes se corren). Las
// sesiones nuevas guardan el nombre, el foco y el id del día (lbl, focus, did); las antiguas los reciben justo antes de
// cualquier cambio de estructura (stampSessionsLbl): así el historial no se re-etiqueta con la rutina de ahora y las
// comparaciones con «el mismo día» (última vez, duración, fatiga, balance del Coach, reabrir) no mezclan días distintos.
function newDayId(plan){
  const p=plan||getPlan(),used=new Set();
  Object.values(_isPlainObj(p)?p:{}).forEach(d=>{if(d&&d.did)used.add(d.did);});
  (Array.isArray(S&&S.sessions)?S.sessions:[]).forEach(s=>{if(s&&s.did)used.add(s.did);});
  let id;do{id='d_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);}while(used.has(id)||!DID_RE.test(id));
  return id;
}
// Nombre y foco con los que se hizo una sesión (los de entonces; sin apuntar, los del día de esa letra o «Día X»)
function sessDayLbl(s){
  if(!s)return'';
  if(typeof s.lbl==='string'&&s.lbl.trim())return s.lbl;
  const d=getPlan()[s.day];if(_isPlanDay(d))return dayLabel(s.day);
  return DAY_KEYS.includes(s.day)?'Día '+s.day:String(s.day==null?'':s.day); // una clave rara (copia editada), tal cual
}
function sessDayFocus(s){
  if(!s)return'';
  if(typeof s.focus==='string')return s.focus;
  const d=getPlan()[s.day];return _isPlanDay(d)&&d.focus!=null?String(d.focus):'';
}
// Día de tu rutina de ahora al que pertenece una sesión: por su id de día (aunque ese día haya cambiado de letra); sin id
// (sesiones de antes de los ids), por su letra. null si ese día ya no está en tu rutina.
function sessDayKey(s,plan){
  const p=plan||getPlan();if(!s)return null;
  if(s.did)return dayKeys(p).find(k=>p[k].did===s.did)||null;
  return _isPlanDay(p[s.day])?s.day:null;
}
// ¿La sesión s es del día dk de tu rutina?
function sessOfDay(s,dk,plan){const p=plan||getPlan();return !!s&&!!dk&&_isPlanDay(p[dk])&&(s.did?p[dk].did===s.did:s.day===dk);}
// (E2) ¿La sesión es de tu rutina de ahora? Con rutina generada, por su id (pid); sin ella, las que no llevan pid («rutina de antes»
// son las de otra rutina generada; las de copias antiguas, sin pid, cuentan como de la tuya si tampoco es generada)
function sessOfRoutine(s){const pid=_isPlainObj(S.planMeta)&&S.planMeta.id?S.planMeta.id:null;return !!s&&(pid?s.pid===pid:!s.pid);}
// ¿Dos sesiones son del mismo día? Con id, por el id; si a alguna le falta, por la letra (no hubo cambio de estructura
// entre medias: si lo hubiera, las dos tendrían su id apuntado)
function sessSameDay(a,b){return !!a&&!!b&&(a.did&&b.did?a.did===b.did:a.day===b.day);}
// Nombre, foco e id del día de cada sesión con buena forma (copias editadas a mano). Se pintan siempre escapados.
function _sanitizeSessDay(list){
  (Array.isArray(list)?list:[]).forEach(s=>{if(!_isPlainObj(s))return;
    if('lbl' in s){if(typeof s.lbl==='string')s.lbl=s.lbl.slice(0,80);else delete s.lbl;}
    if('focus' in s){if(typeof s.focus==='string')s.focus=s.focus.slice(0,200);else delete s.focus;}
    if('did' in s&&!(typeof s.did==='string'&&DID_RE.test(s.did)))delete s.did;});
}
// Antes de un cambio de estructura (quitar o vaciar un día, empezar de cero, volver a la rutina de ejemplo, importar):
// cada sesión sin nombre apunta el nombre, el foco y el id del día de su letra tal como están ahora
function stampSessionsLbl(){
  const p=getPlan();let n=0;
  (Array.isArray(S.sessions)?S.sessions:[]).forEach(s=>{
    if(!_isPlainObj(s)||typeof s.lbl==='string')return;
    const d=p[s.day];if(!_isPlanDay(d))return;
    s.lbl=dayLabel(s.day,p).slice(0,80);s.focus=String(d.focus==null?'':d.focus).slice(0,200);
    if(!s.did&&d.did)s.did=d.did;n++;
  });
  return n;
}
// Re-letrado: map = {letra de antes: letra nueva} para los días que se quedan (los que no están, se quitan). Mueve a la vez
// la rutina, el día abierto, el que toca, el «¿Hoy en otro sitio?», la descarga, las propuestas del Coach, los «solo hoy»,
// el descanso en marcha y lo que tiene abierto la pantalla. Las sesiones conservan su letra: van por su id de día.
function _reletter(map){
  const old=getPlan(),np={},mv=k=>Object.prototype.hasOwnProperty.call(map,k)?map[k]:null;
  DAY_KEYS.forEach(nk=>{const ok=Object.keys(map).find(o=>map[o]===nk);if(!ok||!_isPlanDay(old[ok]))return;const d=old[ok];
    if(ok!==nk&&String(d.label||'')==='Día '+ok)d.label='Día '+nk; // el nombre de siempre sigue a la letra
    d.ex.forEach(e=>{if(e&&e.sub&&typeof e.sub==='object')e.sub.day=nk;});
    np[nk]=d;});
  S.currentPlan=np;
  S.day=mv(S.day);S.nextDay=mv(S.nextDay);
  if(S.rotBack!=null)S.rotBack=mv(S.rotBack);
  if(_isPlainObj(S.deload)&&Array.isArray(S.deload.changes))S.deload.changes.forEach(c=>{if(c&&c.day!=null){const n=mv(c.day);if(n)c.day=n;}});
  [S.pendingCoachProposals,S.appliedProposals].forEach(L=>{if(Array.isArray(L))L.forEach(p=>{if(p&&p.dayKey!=null){const n=mv(p.dayKey);if(n)p.dayKey=n;}});});
  if(_isPlainObj(S.restTimer)&&S.restTimer.day!=null)S.restTimer.day=mv(S.restTimer.day);
  if(_isPlainObj(S.activeWorkout)&&S.activeWorkout.day!=null)S.activeWorkout.day=mv(S.activeWorkout.day)||S.activeWorkout.day;
  try{if(_editDay!=null)_editDay=mv(_editDay)||'A';}catch(e){}
  try{if(_plF!=='all'&&_plF!=='out')_plF=mv(_plF)||'all';}catch(e){}
  try{if(_hoyPick)_hoyPick=null;}catch(e){}
  if(!_isPlanDay(np[S.nextDay]))S.nextDay=getNextDay(null,np);
  if(!_isPlanDay(np[S.day]))S.day=S.nextDay;
}
// Letras consecutivas desde la A: si faltan (A, B, D de una copia editada a mano), se corren (A, B, C) con los nombres ya
// apuntados en las sesiones. Al arrancar y al importar. true si cambió algo.
function _fixPlanLetters(){
  const K=dayKeys(S.currentPlan);if(K.every((k,i)=>k===DAY_KEYS[i]))return false;
  stampSessionsLbl();const map={};K.forEach((k,i)=>{map[k]=DAY_KEYS[i];});_reletter(map);return true;
}

// Initialize coach start if not set
if(!S.coachStart&&S.sessions.length>0){
  S.coachStart=S.sessions[0].ts||Date.now();
  saveState();
}

// Sanity check: si sessionStartTs lleva >24h sin guardarse, descartarlo
if(S.sessionStartTs&&(Date.now()-S.sessionStartTs)>86400000){
  S.sessionStartTs=null;
  saveState();
}
// Sesión reabierta: descartar datos inválidos y devolverla al historial si ya no tiene series marcadas
if(S.reopenedSession!=null){
  const _rsBefore=S.reopenedSession;
  _reconcileReopened();
  if(S.reopenedSession!==_rsBefore)saveState();
}
// Temporizador guardado con forma no válida → descartarlo (uno válido se reanuda o termina con RT.sync() al arrancar)
if(S.restTimer!=null&&!_validRestTimer(S.restTimer)){S.restTimer=null;saveState();}
if(typeof S.timerSound!=='boolean')S.timerSound=true;
// Descarga temporal (v13): forma válida (una corrupta se descarta), historial y propuestas del Coach saneados
if(S.deload!=null&&!_validDeload(S.deload)){S.deload=null;saveState();}
S.deloadHistory=_sanitizeDeloadHistory(S.deloadHistory);
if(S.dlRecoSnoozeTs!=null&&!(typeof S.dlRecoSnoozeTs==='number'&&isFinite(S.dlRecoSnoozeTs)))S.dlRecoSnoozeTs=null; // (13d)
_sanitizeWrapSeen(S); // (14d) ofertas del resumen ya vistas (sin él, los ciclos que ya tenías no se ofrecen)
_sanitizeBackupMeta(S); // (15b) última copia y «Ahora no» del aviso de copias
S.pendingCoachProposals=_sanitizeProposals(S.pendingCoachProposals);
if(!Array.isArray(S.appliedProposals))S.appliedProposals=[];
// Saltos de peso (v15): siempre con forma válida
S.loadSteps=_sanitizeLoadSteps(S.loadSteps);
// Descanso por ejercicio y pantalla encendida (v19): siempre con forma válida
S.restOverrides=_sanitizeRestOverrides(S.restOverrides);
if(typeof S.keepAwake!=='boolean')S.keepAwake=true;
// (M1) Descanso entre series (Ajustes → «Descanso entre series»): encendido salvo que lo apagues. Sin subir SCHEMA_VERSION:
// quien ya usa la app no lo tiene y lo recibe encendido aquí (y al importar una copia que no lo trae, el de este móvil)
if(typeof S.restOn!=='boolean')S.restOn=true;
// (M2) Esfuerzo de cada serie (Ajustes → «Esfuerzo de cada serie»): igual, encendido salvo que lo apagues
if(typeof S.rpeOn!=='boolean')S.rpeOn=true;
// «Solo hoy» (v20): sustituciones con forma válida (las caducadas vuelven en el primer render, subTick)
_sanitizePlanSubs(S.currentPlan);

