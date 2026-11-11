// Objetivo de cada tipo: reps «12» o «8-12» · tiempo «30s» · distancia «20m» · cardio «10 min»
const _LIB_R={w:/^\d{1,3}(-\d{1,3})?$/,t:/^\d{1,4}s$/,d:/^\d{1,5}m$/,c:/^\d{1,3} min$/};_LIB_R.bw=_LIB_R.r=_LIB_R.w;
function _parseLib(txt){
  const out=[],byId=new Map(),seenN=new Set(),MG=MUSCLE_GROUPS.map(g=>g.id),lib=k=>k.startsWith('lib_')?k:'lib_'+k;
  const err=(id,m)=>{LIB_ERRORS.push(`${id||'?'}: ${m}`);},own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k); // (no «constructor»)
  String(txt).split('\n').forEach(line=>{
    line=line.trim();if(!line||line[0]==='#')return;
    const c=line.split('|').map(v=>v.trim());if(c.length!==19)return err(c[0],c.length+' columnas');
    const [id,n,ic,eq,muscle,s,r,lt,mat,pl,dif,x,pat,mus,alt,why,up,al,tip]=c,M=own(MAT,mat)?MAT[mat]:null,cls=M&&M.cls,cardio=lt==='c',mu={};
    let bad=!/^lib_[a-z0-9_]{2,60}$/.test(id)||byId.has(id)?'id':!n||n.length>80||seenN.has(n)?'nombre':!MG.includes(muscle)?'grupo':
      !LT.includes(lt)?'tipo':!M?'material':!/^[gca]$/.test(pl)?'lugar':!own(PAT_LBL,pat)?'patrón':!tip?'consejo':
      (s&&!/^([1-9]|10)$/.test(s))||(dif&&!/^[123]$/.test(dif))||!_LIB_R[lt].test(r)?'series, dificultad u objetivo':
      cardio!==(muscle==='cardio')||cardio!==(pat==='cardio')?'cardio':
      // Coach: con kg solo si su equipo tiene saltos de peso; «solo reps» sin kg (asistidas y material raro aparte)
      lt==='w'&&!LOAD_EQ[cls]?'kg sin pesas':lt==='r'&&LOAD_EQ[cls]&&!/asistid/i.test(n)&&mat!=='otro'?'reps con pesas':
      /asistid/i.test(n)&&lt!=='r'&&lt!=='bw'?'asistido con kg':(why?why.split('~').length:0)>(alt?alt.split(',').length:0)?'why':'';
    if(!bad)(mus?mus.split(','):[]).forEach(p=>{const [k,v]=p.split(':'),w=+v;if(!MUS_KEYS.includes(k)||!(w>0&&w<=1))bad='músculos';else mu[k]=w;});
    if(!bad&&!cardio&&!Object.keys(mu).length)bad='músculos';
    if(bad)return err(id,bad);
    const o={id,n,ic:ic||'💪',eq:eq||M.eq||M.l,muscle,s:+s||(cardio?1:3),r:/^\d{1,3}$/.test(r)?+r:r,tip};
    if(cardio)o.cardio=true;else o.compound=x.includes('C');
    Object.assign(o,{al:al?al.split(',').map(a=>a.trim()).filter(Boolean):[],mat,pl,dif:+dif||(['maquina','polea','smith'].includes(mat)||cardio?1:2),
      lt,x,pat,mus:mu,alt:alt?alt.split(',').map(a=>lib(a.trim())):[],why:why?why.split('~').map(w=>w.trim()):[],up:up?lib(up):null});
    byId.set(id,o);seenN.add(n);out.push(o);
  });
  // Enlaces (alternativas y versión más difícil): a ejercicios que existen, distintos y del mismo tipo (fuerza o cardio);
  // la versión más difícil, de fuerza, del mismo grupo (el Coach la propone en su hueco) y sin ciclos. Los que no valen se
  // quitan (su razón con ellos) y se apuntan.
  const ok=(o,k)=>{const t=byId.get(k);return !!t&&t!==o&&!!t.cardio===!!o.cardio;},upOk=(o,k)=>ok(o,k)&&!o.cardio&&byId.get(k).muscle===o.muscle;
  out.forEach(o=>{
    const keep=o.alt.map((k,i)=>[k,o.why[i]]).filter(([k])=>ok(o,k)||err(o.id,'alternativa '+k));
    if(keep.length<o.alt.length){o.alt=keep.map(p=>p[0]);o.why=keep.map(p=>p[1]).filter(w=>w!=null);}
    if(o.up&&!upOk(o,o.up)){err(o.id,'más difícil '+o.up);o.up=null;}
  });
  out.forEach(o=>{const seen=new Set([o.id]);for(let t=o;t&&t.up;t=byId.get(t.up)){if(seen.has(t.up)){err(t.id,'ciclo '+t.up);t.up=null;break;}seen.add(t.up);}});
  out.forEach(o=>{['al','alt','why','mus'].forEach(k=>Object.freeze(o[k]));Object.freeze(o);});
  return out;
}
const EXERCISE_DB=_parseLib(LIB_ROWS);
// Índices (búsquedas O(1) por id y por nombre; nunca EXERCISE_DB.find al pintar)
const LIB_BY_ID=new Map(EXERCISE_DB.map(e=>[e.id,e])),LIB_BY_N=new Map(EXERCISE_DB.map(e=>[e.n,e]));
const LIB_DOWN={};EXERCISE_DB.forEach(e=>{if(e.up&&!LIB_DOWN[e.up])LIB_DOWN[e.up]=e.id;}); // versión más fácil
const LIB_PAT={};EXERCISE_DB.forEach(e=>{LIB_PAT[e.id]=e.pat;});
// Preferencias del selector (aditivas, sin subir la versión del esquema; se sanean al cargar y al importar):
// libPlace 'g' gimnasio | 'c' casa · libKit null (aún no lo has dicho) o tu material de casa (claves de MAT con home) ·
// libFav tus favoritos y libRecent los últimos que elegiste (ids de la biblioteca, el más nuevo primero; como mucho 100 y
// 12). Un id con buena forma que no está en el catálogo se guarda (puede venir de una versión más nueva) pero no se pinta.
// El estado de las hojas (selector, ficha, «Mi material») vive solo en memoria: si un backup lo trae, fuera.
function _sanitizeLibPrefs(o){
  if(!_isPlainObj(o))return o;
  ['_pickerState','_libDetail','_libKitOpen'].forEach(k=>{delete o[k];});
  const ids=(a,n)=>Array.isArray(a)?[...new Set(a.filter(x=>typeof x==='string'&&/^lib_[a-z0-9_]{1,60}$/.test(x)))].slice(0,n):[];
  if(o.libPlace!=='g'&&o.libPlace!=='c')o.libPlace='g';
  o.libKit=Array.isArray(o.libKit)?[...new Set(o.libKit.filter(k=>typeof k==='string'&&Object.prototype.hasOwnProperty.call(MAT,k)&&MAT[k].home))]:null;
  o.libFav=ids(o.libFav,100);o.libRecent=ids(o.libRecent,12);
  return o;
}
_sanitizeLibPrefs(S);

