// ══════════════════════════════════════════════════════════
// (14) RESUMEN «WRAPPED» DE UN MES O DE UN CICLO: datos del periodo e historia a pantalla completa
// ══════════════════════════════════════════════════════════
// Periodo {kind:'month', y, m (0-11)} o {kind:'cycle', n} (n = 1… ciclos cerrados en S.mesocycles; el actual = cerrados + 1).
// wrapPeriod lo normaliza: from/to (ms, to exclusivo), cur (en curso: acaba ahora), textos y el periodo anterior.
const WR_MONTHS=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
function wrapPeriod(p){
  if(!p||typeof p!=='object')return null;
  const now=Date.now();
  if(p.kind==='month'){
    const y=Math.round(+p.y),m=Math.round(+p.m);
    if(!isFinite(y)||!isFinite(m)||m<0||m>11||y<2000||y>2200)return null;
    const from=new Date(y,m,1).getTime(),to=new Date(y,m+1,1).getTime();
    if(from>now)return null;
    const name=WR_MONTHS[m],lbl=y===new Date(now).getFullYear()?name:`${name} de ${y}`,cur=now<to;
    return{kind:'month',y,m,from,to,cur,key:`m${y}-${m+1}`,name,label:lbl,title:'Tu '+lbl,
      days:new Date(y,m+1,0).getDate(),elapsed:cur?new Date(now).getDate():new Date(y,m+1,0).getDate(),
      prev:m===0?{kind:'month',y:y-1,m:11}:{kind:'month',y,m:m-1}};
  }
  if(p.kind==='cycle'){
    const M=Array.isArray(S.mesocycles)?S.mesocycles.filter(_isPlainObj):[],n=Math.round(+p.n);
    if(!(n>=1&&n<=M.length+1))return null;
    const endOf=c=>c?(+c.endTs>0?+c.endTs:+c.appliedAt>0?+c.appliedAt:NaN):NaN;
    let from,to,cur=false;
    if(n<=M.length){
      const c=M[n-1];to=endOf(c);
      // inicio guardado; en ciclos antiguos sin él, el final del anterior (o, el primero, tu primera sesión)
      from=+c.startTs>0?+c.startTs:n>1?endOf(M[n-2]):(_sessionTsSorted()[0]||NaN);
    }else{from=+coach_cycleStart();to=now+1;cur=true;}
    if(!isFinite(from)||!isFinite(to)||to<=from)return null;
    const wk=Math.max(1,Math.round((Math.min(to,now)-from)/(7*DAY_MS)));
    return{kind:'cycle',n,from,to,cur,key:'c'+n,name:'ciclo '+n,label:'ciclo '+n,title:'Tu ciclo '+n,weeks:wk,
      prev:n>1?{kind:'cycle',n:n-1}:null};
  }
  return null;
}
// Sesiones de [from, to) con su fecha: la de su ts o, en copias antiguas sin ts, la de su fecha escrita («5 May», _datedTs)
function _wrSessions(from,to){
  const L=(Array.isArray(S.sessions)?S.sessions:[]).filter(s=>s&&typeof s==='object');
  let T=null;
  const out=[];
  L.forEach((s,i)=>{
    let t=+s.ts;
    if(!(t>0&&isFinite(t))){if(!T)T=_datedTs(L.map(x=>({ts:x.ts,d:x.date})),DAY_MS);t=T.est[i]===1?T[i]:NaN;}
    if(t>=from&&t<to)out.push({s,ts:t});
  });
  return out;
}
// Trabajo de una sesión con la misma cuenta que su resumen (sessSummaryData): series, tonelaje (kg × reps de cada serie)
// y, lo que no lleva kilos, en su propia medida: reps sin peso, segundos, metros y ejercicios de cardio hechos.
// Una serie con peso por tiempo o distancia (paseo, plancha con disco) suma sus segundos o metros, nunca kilos inventados.
// (pairs: sus registros ya buscados; si no, los de _sessRecs)
function _wrSessWork(s,pairs){
  const o={sets:0,ton:0,kgSets:0,reps:0,secs:0,metres:0,cardio:0};
  const add=list=>{
    o.sets+=list.length;o.ton+=_tonOf(list);o.kgSets+=list.filter(_kgSet).length;
    list.forEach(x=>{if(x.t!=null)o.secs+=x.t;else if(x.d!=null)o.metres+=x.d;else if(!(x.w>0)&&x.r>0)o.reps+=x.r;});
  };
  if(!pairs)pairs=_sessRecs(s);
  pairs.forEach(({id,rec})=>add(_sumRecSets(rec,findExInPlan(id)||_mmExOf(id)).list));
  // Lo marcado sin registro de fuerza (cardio, peso corporal de copias antiguas): del snapshot, como el resumen
  const sn=s.snapshot&&_isPlainObj(s.snapshot.sets)?s.snapshot.sets:null;
  if(sn)Object.keys(sn).forEach(id=>{
    if(pairs.some(p=>p.id===id)||!_isPlainObj(sn[id]))return;
    const idx=Object.keys(sn[id]).filter(k=>sn[id][k]===true&&/^\d{1,2}$/.test(k)).slice(0,20);
    if(!idx.length)return;
    const ex=findExInPlan(id)||_mmExOf(id);
    if(ex&&ex.cardio){o.cardio++;return;}
    const lg=_isPlainObj(s.snapshot.logs)&&_isPlainObj(s.snapshot.logs[id])&&Array.isArray(s.snapshot.logs[id].sets)?s.snapshot.logs[id].sets:[];
    add(idx.map(k=>{const e=_setEntry(lg[+k]),x={w:e?e.w:null,r:e?e.r:null};if(e&&e.t!=null)x.t=e.t;if(e&&e.d!=null)x.d=e.d;return x;}));
  });
  return o;
}
// Registros de una sesión sin ts (copia antigua) con su fecha estimada ts: de cada ejercicio de su día de la rutina, el
// último registro de esa fecha (su ts o la de su «d», _progSrc) que no sea de otra sesión con ts ni lo haya tomado ya
// otra sesión (claimed: 'id|índice')
function _wrEstRecs(s,ts,claimed){
  const st=_isPlainObj(S.strength)?S.strength:{},out=[];
  const other=new Set((S.sessions||[]).filter(x=>x&&x!==s).map(x=>+x.ts).filter(t=>t>0));
  Object.keys(st).forEach(id=>{
    if(!Array.isArray(st[id])||exDayOf(id)!==s.day)return;
    const a=_progSrc(id);
    for(let i=a.length-1;i>=0;i--){
      const r=a[i];
      if(!r||typeof r!=='object'||!isFinite(+r.ts)||other.has(+r.ts)||!sameDayTs(+r.ts,ts)||claimed.has(id+'|'+i))continue;
      claimed.add(id+'|'+i);out.push({id,rec:r});break;
    }
  });
  return out;
}
// Récords de [from, to) (los del muro: uno por ejercicio y sesión), del más antiguo al más reciente
function _wrRecords(P){
  return prAll().list.filter(x=>{const t=_prWhen(x);return t!=null&&t>=P.from&&t<P.to;}).slice().sort((a,b)=>_prWhen(a)-_prWhen(b));
}
// Números base de un periodo: sesiones, días con entreno, minutos (solo de las sesiones con duración), trabajo y récords
function _wrBase(P){
  const ss=_wrSessions(P.from,P.to),days=new Set();
  const B={sessions:ss.length,days:0,min:0,minN:0,sets:0,ton:0,kgSets:0,reps:0,secs:0,metres:0,cardio:0,byDay:{}};
  // sesiones de copias antiguas sin ts: sus registros, por su fecha estimada (de la última a la primera, para que cada
  // registro cuente una sola vez aunque haya dos sesiones del mismo día de la rutina en la misma fecha)
  const claimed=new Set(),est=new Map();
  for(let k=ss.length-1;k>=0;k--){const{s,ts}=ss[k];if(ts!==+s.ts)est.set(k,_wrEstRecs(s,ts,claimed));}
  ss.forEach(({s,ts},k)=>{
    const d=+s.durationMin;
    if(d>0&&isFinite(d)&&d<=MAX_SESSION_MIN){B.min+=Math.round(d);B.minN++;}
    const w=_wrSessWork(s,est.get(k));['sets','ton','kgSets','reps','secs','metres','cardio'].forEach(k=>{B[k]+=w[k];});
    days.add(_startOfDay(ts));
    const dk=typeof s.day==='string'&&s.day?s.day.slice(0,8):'?';B.byDay[dk]=(B.byDay[dk]||0)+1;
    if(typeof s.lbl==='string'&&s.lbl.trim()){if(!B.dayLbl)B.dayLbl={};B.dayLbl[dk]=s.lbl;} // (E1b) el nombre con que se hizo
  });
  B.ton=Math.round(B.ton);B.days=days.size;
  B.records=_wrRecords(P);
  return B;
}
// El ejercicio que más mejoró, con su propia medida: con kilos, el 1RM estimado (coach_e1rm, Epley); sin kilos, sus reps,
// segundos o metros (para ordenar entre tipos, la puntuación _noKgScore del Coach). Frente a su mejor marca del periodo
// anterior; si no lo hiciste entonces, su último registro de los 90 días antes; si tampoco, su primera vez en este periodo.
// Fuera: descargas y semanas de descanso, cardio, bandas y asistidos (su resistencia cambia), lastre (sus kilos no son la
// carga) y peso con tiempo o distancia.
function _wrMostImproved(P,PP){
  const st=_isPlainObj(S.strength)?S.strength:{},out=[];
  Object.keys(st).forEach(id=>{
    if(!Array.isArray(st[id]))return;
    const ex=findExInPlan(id)||_mmExOf(id);if(ex&&(ex.cardio||exLT(ex)==='c'))return;
    const src=_progSrc(id).filter(r=>r&&typeof r==='object'&&typeof r.ts==='number'&&isFinite(r.ts)&&!r.dl&&!_lightAt(id,r.ts));
    const inP=src.filter(r=>r.ts>=P.from&&r.ts<P.to);if(!inP.length)return;
    const last=inP[inP.length-1],lt=_recLT(last),kg=+last.v>0;
    if(kg&&lt!=='w')return;
    if(!kg&&(lt==='w'||_prNoX(ex)))return;
    const mode=kg?'w':_prXType(lt);
    const same=r=>kg?+r.v>0&&_recLT(r)==='w':!(+r.v>0)&&_recLT(r)!=='w'&&_prXType(_recLT(r))===mode&&_recMetric(r)!=null;
    const val=r=>kg?coach_e1rm(r,ex):_recMetric(r);
    const sc=r=>kg?val(r):_noKgScore(val(r),lt);
    const cand=inP.filter(same);if(!cand.length)return;
    const best=a=>a.reduce((b,r)=>!b||sc(r)>sc(b)?r:b,null);
    let base=null,vs='prev';
    if(PP){const pv=src.filter(r=>r.ts>=PP.from&&r.ts<PP.to&&r.ts<P.from&&same(r));if(pv.length)base=best(pv);}
    if(!base){const bf=src.filter(r=>r.ts<P.from&&r.ts>=P.from-90*DAY_MS&&same(r));if(bf.length){base=bf[bf.length-1];vs='before';}}
    let pool=cand;
    if(!base){if(cand.length<2)return;base=cand[0];pool=cand.slice(1);vs='first';}
    const top=best(pool),a=sc(base),b=sc(top);
    if(!(a>0)||!(b>a*1.001))return;
    out.push({id,name:exDisplayName(id),ex,mode,lt:kg?'w':lt,vs,base,top,pct:(b/a-1)*100,from:val(base),to:val(top)});
  });
  out.sort((x,y)=>y.pct-x.pct||String(x.name).localeCompare(String(y.name)));
  return out[0]||null;
}
// Peso corporal del periodo (serie de la gráfica de peso, con su tendencia tr): pesadas, la primera y la última, y el
// cambio frente a la última pesada antes del periodo (hasta 45 días antes) o, sin ella, la primera del periodo
function _wrBody(P){
  const W=typeof wSeries==='function'?wSeries().filter(p=>p.v>0&&isFinite(p.v)&&isFinite(p.t)):[];
  const pts=W.filter(p=>p.t>=P.from&&p.t<P.to);if(!pts.length)return null;
  const bf=W.filter(p=>p.t<P.from&&p.t>=P.from-45*DAY_MS),ref=bf.length?bf[bf.length-1]:pts.length>1?pts[0]:null,end=pts[pts.length-1];
  const vs=pts.map(p=>p.v);
  return{n:pts.length,pts:pts.map(p=>({t:p.t,v:p.v,tr:p.tr})),ref:bf.length?'before':ref?'first':null,
    start:ref?ref.v:null,end:end.v,change:ref?_r2(end.v-ref.v):null,trStart:ref?ref.tr:null,trEnd:end.tr,
    trChange:ref&&isFinite(ref.tr)&&isFinite(end.tr)?_r2(end.tr-ref.tr):null,min:Math.min(...vs),max:Math.max(...vs)};
}
// Todo lo del resumen de un periodo. null si el periodo no vale (futuro, ciclo que no existe…).
// prev: los números base del periodo anterior, solo si ya entrenabas antes de este periodo (si no, no hay con qué comparar)
function wrappedData(p){
  const P=wrapPeriod(p);if(!P)return null;
  const B=_wrBase(P),PP=P.prev?wrapPeriod(P.prev):null;
  // primera sesión: también las de copias antiguas sin ts (con su fecha escrita, como _wrSessions)
  const first=_wrSessions(-Infinity,Infinity).reduce((m,x)=>Math.min(m,x.ts),Infinity);
  const prev=PP&&first<P.from?Object.assign({P:PP},_wrBase(PP)):null;
  const D=Object.assign({P},B);
  D.prev=prev;
  // Diferencias con el anterior: las mismas filas que la página (_wrCmpView; en curso, frente al mismo tramo). null sin
  // página de comparación. Una fila que no sale (kilos o tiempo sin datos) cuenta como 0 sin %.
  const V=_wrCmpView(D),R={};if(V)V.rows.forEach(x=>{R[x.k]=x;});
  const dv=k=>R[k]?R[k].d:0,pv=k=>R[k]?R[k].pct:null;
  D.cmp=V?{same:V.days,sessions:dv('sessions'),min:dv('min'),ton:dv('ton'),records:dv('records'),sets:dv('sets'),
    sessionsPct:pv('sessions'),tonPct:pv('ton'),minPct:pv('min')}:null;
  D.best=B.sessions?_wrMostImproved(P,PP):null;
  D.bw=_wrBody(P);
  D.mm=_mmAggregate(mmCollect(P.from,P.to-1),1,{k:'wr',lbl:P.label,per:'en '+P.label,weeks:1});
  D.pages=WR_PAGES.filter(g=>g.ok(D)).map(g=>g.k);
  return D;
}

// ── Textos y cifras de la historia ──
const _wrN=n=>_kgK(n).replace(/ /g,NB); // 48320 → «48 320» (sin cortes)
const _wrDec=v=>String(v).replace('.',','); // 2.5 → «2,5»
// Coma decimal en un texto con cifras («47.5 kg × 12 · 1RM est. 66.5 kg» → «47,5 kg…»): páginas e imagen
const _wrCm=t=>String(t).replace(/(\d)\.(\d)/g,'$1,$2');
// 860 → «14 h 20 min», 45 → «45 min»
function _wrHM(min){min=Math.round(+min)||0;const h=Math.floor(min/60),m=min%60;return h?`${h}${NB}h${m?' '+m+NB+'min':''}`:`${m}${NB}min`;}
// Segundos de trabajo por tiempo: «45 s», «12 min», «1 h 5 min»
function _wrSecsTxt(s){s=Math.round(+s)||0;return s<60?s+NB+'s':_wrHM(Math.round(s/60));}
function _wrMetresTxt(m){m=Math.round(+m)||0;return m>=1000?_wrDec(Math.round(m/100)/10)+NB+'km':m+NB+'m';}
// Equivalencia del tonelaje: la unidad más grande que cabe al menos 2 veces (con menos de 80 kg, perros grandes;
// por debajo de 40 kg, ninguna).
// Menos de 10: de media en media («2,5 coches»); a partir de 10, entero. Cada unidad lleva su peso de referencia.
const WR_EQ=[[150000,'🐋','una ballena azul','ballenas azules'],[12000,'🚌','un autobús urbano','autobuses urbanos'],[5000,'🐘','un elefante','elefantes'],
  [1200,'🚗','un coche','coches'],[400,'🎹','un piano de cola','pianos de cola'],[180,'🏍️','una moto','motos'],[40,'🐕','un perro grande','perros grandes']];
function wrTonEquiv(kg){
  kg=+kg;if(!(kg>=40))return null;
  const u=WR_EQ.find(e=>kg/e[0]>=2)||WR_EQ[WR_EQ.length-1],n=kg/u[0],q=n<10?Math.round(n*2)/2:Math.round(n);
  const txt=q===1?u[2]:`${_wrDec(q)} ${u[3]}`;
  const ref='≈'+NB+(u[0]>=1000?_wrDec(u[0]/1000)+NB+'t':u[0]+NB+'kg');
  return{ic:u[1],n:q,txt,one:u[2],kg:u[0],ref,note:u[2].replace(/^./,c=>c.toUpperCase())+' '+ref};
}
// Lo que no son kilos, con su medida: «320 reps sin peso», «12 min por tiempo», «1,2 km», «3 de cardio»
function _wrOtherParts(D){
  const o=[];
  if(D.reps>0)o.push(`${_wrN(D.reps)}${NB}${D.reps===1?'rep':'reps'} sin peso`);
  if(D.secs>0)o.push(`${_wrSecsTxt(D.secs)} por tiempo`);
  if(D.metres>0)o.push(`${_wrMetresTxt(D.metres)} recorridos`);
  if(D.cardio>0)o.push(plural(D.cardio,'bloque de cardio','bloques de cardio'));
  return o;
}
// Cifra que sube de 0 a su valor (data-to; data-fmt="k" con separador de miles, "d1" con un decimal y coma;
// pre: signo delante, «+» o «−», que no cuenta)
const _wrD1=v=>_wrDec((Math.round(+v*10)/10).toFixed(1));
const _wrFmtV=(v,fmt)=>fmt==='k'?_wrN(Math.round(v)):fmt==='d1'?_wrD1(v):String(Math.round(v));
// (la coma decimal va en su span: en DM Mono ocuparía una celda entera, «−1 , 9»)
const _wrNumH=t=>esc(t).replace(/,/g,'<span class="wr-cm">,</span>');
const _wrNum=(v,fmt,cls,pre)=>`<b class="wr-n${cls?' '+cls:''}" data-to="${v}"${fmt?` data-fmt="${fmt}"`:''}${pre?` data-pre="${pre}"`:''}>${_wrNumH((pre||'')+_wrFmtV(v,fmt))}</b>`;
// «de octubre» / «del ciclo 3», «en octubre» / «en el ciclo 3»
const _wrDe=P=>(P.kind==='month'?'de ':'del ')+P.label,_wrEn=P=>(P.kind==='month'?'en ':'en el ')+P.label;
// Signo tipográfico: 1,9 → «+1,9», −1,9 → «−1,9» (menos de verdad, no guion)
const _wrSign=v=>v>0?'+':v<0?'−':'';

// ── El que más mejoró (14b): sus cifras en su propia medida ──
// kg: 1RM estimado (Epley, de su mejor serie); sin kilos: reps, segundos o metros
function _wrBestTxt(b,v){return b.mode==='w'?_wrDec(prKg(v))+NB+'kg':b.mode==='xt'?fmtSecs(v):b.mode==='xd'?fmtM(v):_repsNB(Math.round(v));}
// «antes → ahora» con el mismo formato: por tiempo, si alguno llega al minuto, los dos en m:ss («0:45 → 1:15 min»)
function _wrBestPair(b){
  if(b.mode==='xt'&&Math.max(Math.round(b.from),Math.round(b.to))>=60){
    const f=v=>{v=Math.round(+v)||0;return Math.floor(v/60)+':'+String(v%60).padStart(2,'0');};
    return[f(b.from)+NB+'min',f(b.to)+NB+'min'];
  }
  return[_wrBestTxt(b,b.from),_wrBestTxt(b,b.to)];
}
// La cifra en negrita (DM Mono) y su unidad en la letra del texto: «<b>47</b> kg» (sin el hueco ancho del espacio en DM Mono)
const _wrBoldNum=t=>{const m=String(t).match(/^(\S+?)([  ].*)?$/);return m?`<b>${esc(m[1])}</b>${esc(m[2]||'')}`:`<b>${esc(t)}</b>`;};
function _wrBestSet(r){
  if(!r)return'';
  const w=+r.v,n=_setNumR(r.r);
  return w>0?`${_wrDec(kgTxt(w))}${NB}kg${n?` ×${NB}${n}`:''}`:'';
}
// Frente a qué se compara, en palabras
function _wrBestVs(D){
  const b=D.best,P=D.P,PP=P.prev?wrapPeriod(P.prev):null;
  return b.vs==='prev'&&PP?`frente a tu mejor marca ${_wrDe(PP)}`:b.vs==='before'?`frente a tu último registro antes ${_wrDe(P)}`
    :`desde tu primera vez ${_wrEn(P)}`;
}
// % con sentido: entero a partir de 10, con un decimal por debajo
const _wrPctFmt=p=>p>=10?'':'d1';

// ── Comparación con el periodo anterior (14b) ──
// En un periodo EN CURSO se compara con el mismo tramo del anterior (los primeros N días), no con el anterior entero:
// 12 días de noviembre frente a 30 de octubre siempre «bajarían». Con menos de 3 días en curso no hay página.
// Filas: sesiones, horas (solo si los dos tienen sesiones con duración), kilos (si alguno los tiene), series y récords.
function _wrCmpView(D){
  if(D._cv!==undefined)return D._cv;
  const P=D.P;let B=D.prev,days=0;
  if(!B||!D.sessions)return(D._cv=null);
  if(P.cur){
    const span=Date.now()-P.from;
    if(span<3*DAY_MS)return(D._cv=null);
    const PP=B.P,to=Math.min(PP.to,PP.from+span);
    if(to<PP.to){B=Object.assign({P:PP},_wrBase({from:PP.from,to}));days=Math.max(1,Math.round(span/DAY_MS));}
  }
  const rows=[],row=(k,lbl,a,b,fmt,pct)=>{const d=a-b;rows.push({k,lbl,a,b,d,fmt,pct:pct&&b>0?Math.round(d/b*100):null});};
  row('sessions','Sesiones',D.sessions,B.sessions,v=>String(v),true);
  if(D.minN&&B.minN)row('min','Tiempo',D.min,B.min,_wrHM,true);
  if(D.ton>0||B.ton>0)row('ton','Kilos',D.ton,B.ton,v=>_wrN(v)+NB+'kg',true);
  // series y récords, solo si alguno de los dos tiene (un mes solo de cardio no lleva «0 → 0»)
  if(D.sets||B.sets)row('sets','Series',D.sets,B.sets,v=>_wrN(v),true);
  if(D.records.length||B.records.length)row('records','Récords',D.records.length,B.records.length,v=>String(v),false);
  const PP=B.P,ref=days?`los primeros ${plural(days,'día')} ${_wrDe(PP)}`:(PP.kind==='month'?'':'el ')+PP.label;
  return(D._cv={rows,B,days,ref,refEn:'en '+ref,kick:(PP.kind==='month'?'Frente a ':'Frente al ')+PP.label,back:!(D.prev.sessions>0)});
}
// (16c) Qué sube y qué baja de verdad: kilos y tiempo cuentan con un cambio de al menos el 1 % (o desde 0), sesiones,
// series y récords con cualquier cambio. Los récords que bajan no cuentan como bajada (cada vez cuesta más batirlos).
// main: la cifra principal del periodo, los kilos si hay fila de kilos; si no, las sesiones.
function _wrCmpMix(V){
  if(!V)return null;
  if(V._mix)return V._mix;
  const R={};V.rows.forEach(x=>{R[x.k]=x;});
  const pc=k=>k==='ton'||k==='min';
  // (16 r1) El umbral del 1 % con la proporción exacta (no con el % redondeado: +0,5 % salía «+1 %» y contaba como subida)
  const rel=x=>pc(x.k)&&x.b>0?(x.a-x.b)/x.b:null;
  const up=x=>!!x&&(rel(x)!=null?rel(x)>=0.01:x.d>0);
  const dn=x=>!!x&&x.k!=='records'&&(rel(x)!=null?rel(x)<=-0.01:x.d<0);
  const ord=['ton','sessions','sets','records','min'];
  return(V._mix={R,main:R.ton?'ton':'sessions',ups:ord.filter(k=>up(R[k])),downs:['ton','min','sessions','sets'].filter(k=>dn(R[k]))});
}
// La cifra que encabeza la comparación: la primera que sube de kilos (≥ 1 %), sesiones, series, récords o tiempo (≥ 1 %).
// null si nada sube o si vuelves tras un periodo sin entrenos (V.back). La usan la página y la imagen para compartir (14c).
// (16c) Honesta: si la cifra principal (los kilos; sin kilos, las sesiones) bajó, no hay titular de subida aunque otra
// suba (antes «+1 sesión · Más que en octubre» con un 30 % menos de kilos y de tiempo): la página lo dice mixto.
// (16 r2) Y solo si la principal SUBE, o si se queda igual y nada baja: con los kilos iguales y sesiones, tiempo y series
// a la baja, un récord más ya no es «+1 récord · Más que en junio» en menta: es un mes mixto.
function _wrCmpHero(V){
  if(!V||V.back)return null;
  const M=_wrCmpMix(V);
  if(!M.ups.length)return null;
  if(!M.ups.includes(M.main)&&M.downs.length)return null;
  return M.R[M.ups[0]];
}
// Palabras de una lista de cifras: «kilos», «sesiones y tiempo», «kilos, series y récords»
const _WR_CMP_W={ton:'kilos',sessions:'sesiones',sets:'series',records:'récords',min:'tiempo'};
const _wrCmpWords=ks=>_mmList(ks.map(k=>_WR_CMP_W[k]));
// (14e) Cifras cortas de una fila (las dos en la misma unidad, la unidad una vez al final) para que todas las filas
// quepan en una línea a 320 px: horas con un decimal desde 60 min («13,0 → 14,1 h»), toneladas desde 10 000 kg
// («69,0 → 76,1 t»); el resto, como siempre. La frase completa (con kg y h min exactos) va en .sr-only.
// (14 r1) Sin decimal desde 100 h o 1000 t («158 → 300 h»), «0» y no «0,0»; y si al redondear las dos cifras salen
// iguales aunque cambiaron, más detalle hasta que se distingan (horas → «11:40 → 11:42 h»; toneladas → 2-3 decimales).
const _wrFx=(v,p)=>!v?'0':p?_wrDec((Math.round(v*10**p)/10**p).toFixed(p)):_wrN(Math.round(v));
// (16c) Tiempo en horas y minutos («11:42 → 14:03 h», lo mismo que «14 h 3 min» de la primera página; antes horas con
// decimal, «11,7 → 14,1 h»). Desde 100 h, horas enteras («158 → 300 h») salvo que salgan iguales.
const _wrHMc=v=>{v=Math.round(+v)||0;return v?Math.floor(v/60)+':'+String(v%60).padStart(2,'0'):'0';};
function _wrCmpShort(x){
  const hi=Math.max(x.a,x.b),ch=x.a!==x.b;
  if(x.k==='min'){
    if(hi<60)return{b:String(Math.round(x.b)),a:String(Math.round(x.a)),u:'min'};
    if(hi/60>=100){const o={b:_wrFx(x.b/60,0),a:_wrFx(x.a/60,0),u:'h'};if(!ch||o.b!==o.a)return o;}
    return{b:_wrHMc(x.b),a:_wrHMc(x.a),u:'h'};
  }
  if(x.k==='ton'){
    if(hi<10000)return{b:_wrN(x.b),a:_wrN(x.a),u:'kg'};
    let o;
    for(let p=hi>=1e6?0:1;p<=3;p++){o={b:_wrFx(x.b/1000,p),a:_wrFx(x.a/1000,p),u:'t'};if(!ch||o.b!==o.a)break;}
    return o;
  }
  if(x.k==='sets')return{b:_wrN(x.b),a:_wrN(x.a),u:''};
  return{b:String(x.b),a:String(x.a),u:''};
}
// La diferencia sin % (anterior 0, récords) o con un % que redondea a 0: en la unidad de la fila, o en la pequeña si
// no llega a 1 h / 1 t («+2 min», «+14 kg», «+76,1 t»; desde 100 t sin decimal, «+364 t»)
function _wrCmpAbs(x,sv){
  const ad=Math.abs(x.d);
  if(x.k==='min')return sv.u==='h'&&ad>=60?(ad>=6000?_wrFx(ad/60,0):_wrHMc(ad))+NB+'h':Math.round(ad)+NB+'min';
  if(x.k==='ton')return sv.u==='t'&&ad>=1000?_wrFx(ad/1000,ad>=1e5?0:1)+NB+'t':_wrN(Math.round(ad))+NB+'kg';
  return x.k==='sets'?_wrN(ad):String(ad);
}
function _wrCmpRow(x){
  // (16 r2) Kilos y tiempo con menos del 1 % de cambio cuentan como iguales en la frase (_wrCmpMix): la fila lo dice igual,
  // «≈ −0,8 %» en gris, y no «↓ −1 %» (que contradecía «Más que en junio»); si el % redondeado es 0, la diferencia como
  // siempre («≈ +14 kg», 14 r1)
  const fl=(x.k==='ton'||x.k==='min')&&x.b>0&&x.d!==0&&Math.abs(x.d/x.b)<0.01,fp=fl?Math.round(Math.abs(x.d/x.b)*1000)/10:0;
  const ar=fl?'≈':x.d>0?'↑':x.d<0?'↓':'=',cls=fl?'eq':x.d>0?'up':x.d<0?'dn':'eq';
  const sv=_wrCmpShort(x),ad=Math.abs(x.d),w=x.d>0?'más':'menos',pc=x.pct!=null&&Math.abs(x.pct)>0;
  const dt=x.d===0?'igual':fl&&pc?`${_wrSign(x.d)}${_wrDec(fp)}${NB}%`:pc?`${_wrSign(x.pct)}${Math.abs(x.pct)}${NB}%`:_wrSign(x.d)+_wrCmpAbs(x,sv);
  const how=x.d===0?'igual':fl&&pc?`casi igual (un ${_wrDec(fp)}${NB}% ${w})`:pc?`un ${Math.abs(x.pct)}${NB}% ${w}`:`${fl?'casi igual, ':''}${x.k==='min'?_wrHM(ad):x.k==='ton'?_wrN(ad)+NB+'kg':x.k==='sets'?_wrN(ad):ad} ${w}`;
  const say=`${x.lbl}: de ${x.fmt(x.b)} a ${x.fmt(x.a)}, ${how}.`;
  return`<div class="wr-cr" role="listitem"><span class="wr-cr-l" aria-hidden="true">${x.lbl}</span><span class="wr-cr-v" aria-hidden="true"><span class="wr-cr-b">${esc(sv.b)}</span> → <b>${esc(sv.a)}</b>${sv.u?`<span class="wr-cr-u">${NB}${sv.u}</span>`:''}</span><span class="wr-cr-d ${cls}"><i aria-hidden="true">${ar}</i><span aria-hidden="true">${esc(dt)}</span><span class="sr-only">${esc(say)}</span></span></div>`;
}

// ── Peso corporal (14b): línea de la tendencia y de las pesadas del periodo ──
function _wrBodySvg(D){
  const b=D.bw,P=D.P,pts=b.pts.slice();
  const t0=P.from,t1=Math.max(t0+DAY_MS,Math.min(P.to,Date.now())),Wd=320,H=92,pad=8;
  const vs=pts.map(p=>p.v).concat(pts.map(p=>p.tr).filter(isFinite));if(b.start!=null)vs.push(b.start);
  let lo=Math.min(...vs),hi=Math.max(...vs);if(hi-lo<1){const m=(hi+lo)/2;lo=m-.5;hi=m+.5;}
  const X=t=>(Math.max(0,Math.min(1,(t-t0)/(t1-t0)))*Wd).toFixed(1),Y=v=>(pad+(1-(v-lo)/(hi-lo))*(H-2*pad)).toFixed(1);
  const raw=pts.map((p,i)=>`${i?'L':'M'}${X(p.t)} ${Y(p.v)}`).join('');
  // tendencia: desde la de la pesada de referencia (si es de antes del periodo, en el borde izquierdo)
  const tp=(b.ref==='before'&&isFinite(b.trStart)?[{t:t0,tr:b.trStart}]:[]).concat(pts.filter(p=>isFinite(p.tr)));
  const trend=tp.map((p,i)=>`${i?'L':'M'}${X(p.t)} ${Y(p.tr)}`).join('');
  const base=b.start!=null?`<path d="M0 ${Y(b.start)}H${Wd}" class="wr-bw-base"/>`:'';
  // (16c) lo que añade la gráfica (el texto de encima ya dice de cuánto a cuánto y cuántas pesadas): entre qué pesos se movió
  const rv=pts.map(p=>p.v),rlo=Math.min(...rv),rhi=Math.max(...rv);
  const lbl=`Peso corporal ${_wrEn(P)}, en gráfica: las pesadas y tu tendencia${b.start!=null?', con la línea de tu peso al empezar':''}${rv.length>1&&rhi-rlo>=.05?`. Entre ${_wrD1(rlo)} y ${_wrD1(rhi)}${NB}kg`:''}`;
  return`<svg class="wr-bw" viewBox="0 0 ${Wd} ${H}" preserveAspectRatio="none" role="img" aria-label="${esc(lbl)}">${base}${pts.length>1?`<path d="${raw}" class="wr-bw-raw"/>`:''}${tp.length>1?`<path d="${trend}" class="wr-bw-tr"/>`:''}</svg>`;
}

// ── Mapa muscular del periodo (14b): el maniquí de la etapa 06 con las series totales por grupo ──
const _wrMMGroups=D=>D.mm.groups.filter(g=>g.total>=.5).slice().sort((a,b)=>b.total-a.total||a.n.localeCompare(b.n));
const _wrSets=v=>{const n=Math.round(v);return plural(n,'serie');};
// Montajes de la página (animación del ejercicio, maniquí): se quitan al cambiar de página y al cerrar (sin fugas)
function _wrUnmount(root){
  if(!root||typeof GymAnim==='undefined'||!GymAnim.unmount)return;
  root.querySelectorAll('.wr-3d,.wr-mm').forEach(el=>{try{GymAnim.unmount(el);}catch(e){}});
}
// Páginas: k, acento (data-ac), ok(D) si sale y html(D). Las siguientes etapas añaden las suyas a esta lista.
const WR_PAGES=[
  {k:'empty',ac:'green',lbl:'Sin entrenos',ok:D=>!D.sessions,html:D=>{const P=D.P;
    return`<div class="wr-kick">${esc(P.label)}</div>
      <div class="wr-big wr-big-s"><span>${P.cur?`Aún no hay entrenos ${P.kind==='month'?'este mes':'en este ciclo'}`:`No hubo entrenos en ${esc(P.label)}`}</span></div>
      <p class="wr-line">${P.cur?'Cuando guardes tu primera sesión, aquí irán tus números: sesiones, kilos, récords y lo que más mejoraste.':'Sin sesiones guardadas en este periodo, no hay nada que resumir.'}</p>`;}},
  {k:'sessions',ac:'green',lbl:'Entrenos',ok:D=>D.sessions>0,html:D=>{const P=D.P;
    const dl=P.kind==='month'?(P.cur?`${plural(D.days,'día')} con entreno en lo que va de ${esc(P.name)}`:`<b>${D.days}</b> de los ${P.days} días de ${esc(P.name)} con entreno`)
      :`<b>${plural(D.days,'día')}</b> con entreno en ${plural(P.weeks,'semana')}`;
    const perW=P.kind==='cycle'?` · ${_wrDec(Math.round(D.sessions/P.weeks*10)/10)} por semana`:'';
    const plan=getPlan(),dk=Object.keys(D.byDay).sort();
    const chips=dk.length>1||dk[0]!=='?'?`<div class="wr-days" role="list" aria-label="Sesiones por día de la rutina">${dk.map(k=>{const lb=D.dayLbl&&D.dayLbl[k]?D.dayLbl[k]:plan[k]&&plan[k].label?plan[k].label:k==='?'?'Otras':'Día '+k;
      return`<span class="wr-day" role="listitem" style="--dc:${DAY_COLORS[k]||'var(--text2)'}"><i aria-hidden="true"></i>${esc(lb)}<span class="sr-only">:</span> <b>${D.byDay[k]}</b><span class="sr-only"> ${D.byDay[k]===1?'sesión':'sesiones'}</span></span>`;}).join('')}</div>`:'';
    const nd=D.sessions-D.minN;
    const hrs=D.minN?`<div class="wr-stat"><span class="wr-stat-ic" aria-hidden="true">⏱</span><div><b>${_wrHM(D.min)}</b> entrenando<small>≈ ${Math.round(D.min/D.minN)}${NB}min por sesión${nd?` · ${plural(nd,'sesión','sesiones')} sin duración no ${nd===1?'suma':'suman'}`:''}</small></div></div>`
      :`<div class="wr-stat"><span class="wr-stat-ic" aria-hidden="true">⏱</span><div>Sin duración apuntada<small>Las horas salen de las sesiones con cronómetro.</small></div></div>`;
    return`<div class="wr-kick">Entrenos</div>
      <div class="wr-big">${_wrNum(D.sessions)}<span>${D.sessions===1?'sesión':'sesiones'}</span></div>
      <p class="wr-line">${dl}${perW}</p>${hrs}${chips}`;}},
  {k:'tonnage',ac:'blue',lbl:'Kilos levantados',ok:D=>D.ton>0||D.reps>0||D.secs>0||D.metres>0,html:D=>{
    const o=_wrOtherParts(D);
    if(!(D.ton>0))return`<div class="wr-kick">Trabajo sin kilos</div>
      <div class="wr-big">${D.reps>0?`${_wrNum(D.reps,'k')}<span>reps</span>`:D.secs>0?`<b class="wr-n">${esc(_wrSecsTxt(D.secs))}</b>`:`<b class="wr-n">${esc(_wrMetresTxt(D.metres))}</b>`}</div>
      <p class="wr-line">${esc(_mmList(o))}.</p>
      <p class="wr-note">Tu trabajo ${D.P.kind==='month'?'de este mes':'de este ciclo'} no lleva kilos: cuenta en reps, tiempo y distancia, sin convertirlo a peso.</p>`;
    const eq=wrTonEquiv(D.ton);
    return`<div class="wr-kick">Kilos levantados</div>
      <div class="wr-big">${_wrNum(D.ton,'k')}<span>kg</span></div>
      ${eq?`<div class="wr-eq"><span class="wr-eq-ic" aria-hidden="true">${eq.ic}</span><div>Como levantar <b>${esc(eq.txt)}</b><small>${esc(eq.note)}</small></div></div>`:''}
      ${o.length?`<p class="wr-line wr-line-s">Y sin kilos: ${esc(_mmList(o))}.</p>`:''}
      <p class="wr-note">Tonelaje = kg × reps de cada serie${D.secs>0||D.metres>0?'. Las series por tiempo o distancia cuentan en segundos o metros, no en kilos':''}.</p>`;}},
  {k:'records',ac:'pr',lbl:'Récords',ok:D=>D.records.length>0,html:D=>{
    const R=D.records,ids=new Set(R.map(x=>x.id)),lastOf=new Map();
    R.forEach(x=>lastOf.set(x.id,x)); // el último récord de cada ejercicio
    // 4 filas (3 en pantallas bajas y 2 en las muy bajas, como 320×568, para que quepan sin desplazar)
    const ih=window.innerHeight||800,L=[...lastOf.values()].sort((a,b)=>_prWhen(b)-_prWhen(a)),sh=L.slice(0,ih<620?2:ih<700?3:4);
    // qué superaste, según los tipos de récord que hay: «más peso o más reps», «más tiempo», «más distancia»
    const ty=new Set(R.map(x=>x.type)),what=[ty.has('w')?'más peso o más reps':ty.has('xr')?'más reps':'',ty.has('xt')?'más tiempo':'',ty.has('xd')?'más distancia':''].filter(Boolean);
    return`<div class="wr-kick">Récords</div>
      <div class="wr-big">${_wrNum(R.length,'','wr-pr-n')}<span>${R.length===1?'récord':'récords'}</span></div>
      <p class="wr-line">${ids.size===1?'En 1 ejercicio':`En ${ids.size} ejercicios`}: ${esc(_mmList(what).replace(/ y (?=más)/,' o '))} que nunca.</p>
      <div class="wr-prs">${sh.map(x=>`<div class="wr-pr"><span class="wr-pr-ic" aria-hidden="true">🏆</span><div class="wr-pr-i"><div class="wr-pr-nm">${esc(exDisplayName(x.id))}</div><div class="wr-pr-v">${_wrCm(prTxt(x)).split(' · ').map(p=>`<span>${esc(p)}</span>`).join(' · ')}</div></div><span class="wr-pr-d">${esc(x.d||'')}</span></div>`).join('')}</div>
      ${L.length>sh.length?`<p class="wr-note">Y ${plural(L.length-sh.length,'ejercicio más','ejercicios más')} con récord.</p>`:''}`;}},
  // (14b) El que más mejoró: su animación 3D (o su emoji si no tiene), su % y sus cifras en su medida
  {k:'best',ac:'green',lbl:'El que más mejoró',ok:D=>!!D.best,html:D=>{
    const b=D.best,key=exAnimKey(b.ex||{id:b.id}),ic=b.ex&&b.ex.ic?b.ex.ic:'💪';
    const what=b.mode==='w'?'1RM estimado':b.mode==='xt'?'Tiempo por serie':b.mode==='xd'?'Distancia por serie':'Reps por serie';
    const s0=b.mode==='w'?_wrBestSet(b.base):'',s1=b.mode==='w'?_wrBestSet(b.top):'';
    // el % de SU medida (45 → 60 s = +33 %); b.pct es la puntuación con la que se elige entre tipos (sin kilos, más suave)
    const p=b.from>0?(b.to/b.from-1)*100:b.pct,pf=_wrPctFmt(p);
    return`<div class="wr-kick">El que más mejoró</div>
      <div class="wr-3d${key?'':' wr-3d-e'}"${key?` data-k="${esc(key)}"`:''}><span class="wr-3d-ic" aria-hidden="true">${esc(ic)}</span></div>
      <div class="wr-ex">${esc(b.name)}</div>
      <div class="wr-big">${_wrNum(pf?Math.round(p*10)/10:Math.round(p),pf,'','+')}<span>%</span></div>
      <div class="wr-stat"><span class="wr-stat-ic" aria-hidden="true">📈</span><div>${what}: ${esc(_wrBestPair(b)[0])} → ${_wrBoldNum(_wrBestPair(b)[1])}
        <small>${esc(_wrBestVs(D).replace(/^./,c=>c.toUpperCase()))}${s1?`. Tu mejor serie: ${esc(s1)}${s0&&s0!==s1?` (antes, ${esc(s0)})`:''}`:''}.</small></div></div>
      ${b.mode==='w'?'<p class="wr-note wr-x">El 1RM estimado sale de tu mejor serie (peso y reps), con la fórmula de Epley.</p>':''}`;},
    mount:(D,st)=>{
      const el=st.querySelector('.wr-3d[data-k]');if(!el||typeof GymAnim==='undefined'||!GymAnim.mount)return;
      try{el._gaMounted=1;if(GymAnim.mount(el,el.dataset.k))el.classList.add('on');}catch(e){console.error(e);}
    }},
  // (14b) Peso corporal del periodo: solo con entrenos (la historia es de tu entreno: sin sesiones, solo «Sin entrenos»)
  // y con algo que comparar (una pesada antes del periodo o dos dentro)
  {k:'body',ac:'blue',lbl:'Peso corporal',ok:D=>D.sessions>0&&!!(D.bw&&D.bw.change!=null),html:D=>{
    const b=D.bw,P=D.P,c=b.change,flat=Math.abs(c)<.05;
    const from=b.ref==='before'?`desde tu última pesada antes ${_wrDe(P)}`:`desde tu primera pesada ${_wrEn(P)}`;
    const tc=b.trChange,trTxt=tc==null?'':Math.abs(tc)<.05?'Tu tendencia (la media que suaviza los días sueltos) se mantuvo.'
      :`Tu tendencia (la media que suaviza los días sueltos) ${tc<0?'bajó':'subió'} ${_wrD1(Math.abs(tc))}${NB}kg.`;
    return`<div class="wr-kick">Peso corporal</div>
      ${flat?'<div class="wr-big wr-big-s"><span>Estable</span></div>':`<div class="wr-big">${_wrNum(Math.abs(c),'d1','',_wrSign(c))}<span>kg</span></div>`}
      <p class="wr-line">De <b>${_wrDec(b.start)}</b> a <b>${_wrDec(b.end)}${NB}kg</b> ${esc(from)} · ${plural(b.n,'pesada')}.</p>
      ${_wrBodySvg(D)}
      <div class="wr-bw-key" aria-hidden="true"><span><i class="tr"></i>Tendencia</span><span><i class="raw"></i>Pesadas</span>${b.start!=null?'<span><i class="base"></i>Al empezar</span>':''}</div>
      ${trTxt?`<p class="wr-note">${esc(trTxt)}</p>`:''}`;}},
  // (14b) Músculos: el maniquí de la etapa 06 con las series del periodo y los grupos más trabajados
  {k:'muscles',ac:'pink',lbl:'Músculos',ok:D=>D.sessions>0&&!!(D.mm&&D.mm.sets>0&&_wrMMGroups(D).length),html:D=>{
    const G=_wrMMGroups(D),top=G.slice(0,5),mx=Math.max(1,G[0].total);
    const zero=D.mm.groups.filter(g=>!(g.total>=.5)).map(g=>g.n.toLowerCase());
    const head=G.slice(0,2).map((g,i)=>`<b>${esc(g.n)}</b> (${i?Math.round(g.total):_wrSets(g.total)})`);
    return`<div class="wr-kick">Músculos</div>
      <div class="wr-big">${_wrNum(Math.round(D.mm.sets),'k')}<span>${Math.round(D.mm.sets)===1?'serie hecha':'series hechas'}</span></div>
      <p class="wr-line">Lo que más trabajaste, en series efectivas: ${head.join(' y ')}.</p>
      <div class="wr-mm"></div>
      <div class="wr-mgs" role="list" aria-label="Series efectivas por grupo muscular">${top.map(g=>`<div class="wr-mg" role="listitem"><span class="wr-mg-n">${esc(g.n)}<span class="sr-only">:</span></span><span class="wr-mg-t" aria-hidden="true"><i style="width:${(g.total/mx*100).toFixed(1)}%"></i></span><span class="wr-mg-v">${Math.round(g.total)}<span class="sr-only"> ${Math.round(g.total)===1?'serie efectiva':'series efectivas'}</span></span></div>`).join('')}</div>
      <p class="wr-note${zero.length?'':' wr-x'}">${zero.length?`Sin series: ${esc(_mmList(zero))}. `:''}<span class="wr-x">Series efectivas: cada serie cuenta para los músculos que trabaja (un press de banca suma pecho y, a medias, hombros y tríceps).</span></p>`;},
    mount:(D,st)=>{
      const el=st.querySelector('.wr-mm');if(!el||typeof GymAnim==='undefined'||typeof GymAnim.muscleMap!=='function')return;
      const G=_wrMMGroups(D),lbl=`Mapa muscular ${_wrEn(D.P)}, de frente y de espalda. Más series: ${G.slice(0,3).map(g=>`${g.n} ${Math.round(g.total)}`).join(', ')}.`;
      try{GymAnim.muscleMap(el,{weights:mmWeights(D.mm),label:lbl,view:'both',hint:false});}catch(e){console.error(e);}
    }},
  // (14b) Frente al periodo anterior: flechas por cifra; honesta si no hay anterior (tu primer mes o ciclo) o no entrenaste
  // (16c) Acento según lo que cuenta: menta si sube (o vuelves, o es tu primer mes), neutro si baja, mixto o igual (antes
  // ámbar, el color de los avisos, también para las subidas). ac puede ser una función de D.
  {k:'compare',ac:D=>{const V=_wrCmpView(D);return!V||V.back||_wrCmpHero(V)?'green':'neutral';},lbl:'Comparación',ok:D=>D.sessions>0&&(!D.prev||!!_wrCmpView(D)),html:D=>{
    const P=D.P,V=_wrCmpView(D),unit=P.kind==='month'?'mes':'ciclo';
    if(!V)return`<div class="wr-kick">Comparación</div>
      <div class="wr-big wr-big-s"><span>${P.kind==='month'?'Tu primer mes':'Tu primer ciclo'}</span></div>
      <p class="wr-line">Aún no hay ${unit==='mes'?'un mes anterior':'un ciclo anterior'} con el que comparar: ${P.kind==='month'?`empezaste ${_wrEn(P)}`:'es el primero que haces'}.</p>
      <p class="wr-note">${unit==='mes'?'El mes que viene':'En el próximo ciclo'} verás aquí si subes sesiones, kilos y récords.</p>`;
    const hero=_wrCmpHero(V),M=_wrCmpMix(V);
    const allEq=V.rows.every(x=>x.d===0);
    let big;
    if(V.back)big=`<div class="wr-big wr-big-s"><span>¡Has vuelto!</span></div><p class="wr-line">${esc(_wrEn(V.B.P).replace(/^./,c=>c.toUpperCase()))} no entrenaste; ${esc(_wrEn(P))}, ${plural(D.sessions,'sesión','sesiones')}.</p>`;
    else if(hero){
      const w={ton:'de kilos',sessions:hero.d===1?'sesión':'sesiones',sets:hero.d===1?'serie':'series',records:hero.d===1?'récord':'récords',min:'de tiempo'}[hero.k];
      big=hero.k==='ton'||hero.k==='min'?`<div class="wr-big">${_wrNum(hero.pct,'','','+')}<span>% ${w}</span></div>`
        :`<div class="wr-big">${_wrNum(hero.d,hero.k==='sets'?'k':'','','+')}<span>${w}</span></div>`;
      // (16c) lo que bajó también se dice («aunque con menos tiempo»)
      big+=`<p class="wr-line">Más que ${esc(V.refEn)}${M.downs.length?`, aunque con menos ${esc(_wrCmpWords(M.downs))}`:''}.</p>`;
    }else if(M.ups.length&&M.downs.length)big=`<div class="wr-big wr-big-s"><span>Un ${unit} mixto</span></div><p class="wr-line">${esc(_wrCmpWords(M.ups).replace(/^./,c=>c.toUpperCase()))}: más que ${esc(V.refEn)}. ${esc(_wrCmpWords(M.downs).replace(/^./,c=>c.toUpperCase()))}: menos.</p>`;
    else if(!M.downs.length)big=`<div class="wr-big wr-big-s"><span>Mismo ritmo</span></div><p class="wr-line">${allEq?'Igual':'Casi igual'} que ${esc(V.refEn)}. Constancia de la buena.</p>`;
    else big=`<div class="wr-big wr-big-s"><span>Un ${unit} más tranquilo</span></div><p class="wr-line">Menos que ${esc(V.refEn)}. Bajar el ritmo a ratos también es parte del plan.</p>`;
    return`<div class="wr-kick">${esc(V.kick)}</div>${big}
      <div class="wr-cmp" role="list" aria-label="Comparación con ${esc(V.ref)}">${V.rows.map(_wrCmpRow).join('')}</div>
      ${V.days?`<p class="wr-note">${esc(P.label.replace(/^./,c=>c.toUpperCase()))} sigue en curso: lo comparo con ${esc(V.ref)}, no con ${P.kind==='month'?'el mes':'el ciclo'} entero.</p>`:''}`;}}
];

// ── Historia a pantalla completa ──
// Barras segmentadas arriba, una página cada WR_DUR ms; tocar a la derecha/izquierda pasa o vuelve, deslizar también,
// mantener pulsado pausa, ⏸ pausa/reanuda, ✕ y Escape cierran, ← → cambian de página; el foco no sale y vuelve al cerrar.
// Con movimiento reducido: sin contadores ni transiciones (las cifras salen ya en su valor).
const WR_DUR=7000;
let _wr=null; // {D, i, el (ms en la página), paused, hold, raf, last, ret, ptr}
function openWrapped(p,opts){
  const D=wrappedData(p);if(!D||!D.pages.length)return false;
  const ret=_wr?_wr.ret:document.activeElement;
  // (14d) onClose: lo que hace la entrada al cerrar (p. ej. quitar la oferta ya vista); se conserva al cambiar de periodo
  const onClose=opts&&typeof opts.onClose==='function'?opts.onClose:_wr?_wr.onClose:null;
  if(_wr)closeWrapped(true);
  _wr={D,i:0,el:0,paused:false,hold:false,raf:0,last:0,ret,ptr:null,onClose};
  const root=document.getElementById('wrapped-root');if(!root){_wr=null;return false;}
  const P=D.P,n=D.pages.length;
  root.innerHTML=`<div class="wr${_rm()?'':' wr-anim'}" id="wr" role="dialog" aria-modal="true" aria-labelledby="wr-t" tabindex="-1" data-ac="green" onkeydown="_wrKey(event)">
    <div class="wr-in">
      <div class="wr-bars" aria-hidden="true">${D.pages.map(()=>'<span class="wr-bar"><i></i></span>').join('')}</div>
      <div class="wr-top">
        <svg class="wr-logo" viewBox="278 206 468 638" aria-hidden="true"><path d="M336 560V368a112 112 0 0 1 112-112h128a112 112 0 0 1 112 112v192" fill="none" stroke="var(--green)" stroke-width="92" stroke-linecap="round"/><path d="M398.4 840a230 230 0 1 1 227.2 0z" fill="var(--green)"/><g fill="none" stroke="var(--bg)" stroke-linecap="round" stroke-linejoin="round"><circle cx="436" cy="648" r="34" fill="var(--bg)" stroke="none"/><path d="M554 658q34-46 68 0" stroke-width="28"/><path d="M442 728q70 66 140 0" stroke-width="30"/></g></svg>
        <div class="wr-h"><div class="wr-k"><span class="wr-k-b">Gymteca · </span>${P.kind==='month'?'resumen del mes':'resumen del ciclo'}</div><h2 class="wr-t" id="wr-t">${esc(P.title)}${P.cur?'<small> · en curso</small>':''}</h2></div>
        ${n>1?`<button type="button" class="wr-ic" id="wr-pause" onclick="wrapTogglePause()" aria-pressed="false" aria-label="Pausar el pase automático"></button>`:''}
        <button type="button" class="wr-ic" id="wr-x" onclick="closeWrapped()" aria-label="Cerrar el resumen"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5 5 15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button>
      </div>
      <div class="wr-stage" id="wr-stage"></div>
      <div class="wr-nav${n>1?'':' wr-nav-1'}">${n>1?`
        <button type="button" class="wr-nb" id="wr-prev" onclick="wrapGo(-1)" aria-label="Página anterior"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12.5 4.5 7 10l5.5 5.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        <span class="wr-pg" id="wr-pg" aria-hidden="true"></span>`:''}${D.sessions>0?`
        <button type="button" class="wr-share" id="wr-share" onclick="wrapShare()" aria-label="Compartir el resumen como imagen" hidden><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 12.5V3M6.5 6.5 10 3l3.5 3.5M5.5 9.5H5A1.5 1.5 0 0 0 3.5 11v4.5A1.5 1.5 0 0 0 5 17h10a1.5 1.5 0 0 0 1.5-1.5V11A1.5 1.5 0 0 0 15 9.5h-.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg><span id="wr-share-t">Compartir</span></button>`:''}${n>1?`
        <button type="button" class="wr-nb" id="wr-next" onclick="wrapGo(1)" aria-label="Página siguiente"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7.5 4.5 13 10l-5.5 5.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`:''}
      </div>
      <div class="sr-only" id="wr-live" aria-live="polite"></div>
    </div>
  </div>`;
  const st=document.getElementById('wr-stage');
  st.addEventListener('pointerdown',_wrDown);
  st.addEventListener('pointerup',_wrUp);
  st.addEventListener('pointercancel',_wrCancel);
  st.addEventListener('contextmenu',e=>e.preventDefault());
  document.addEventListener('visibilitychange',_wrVis);
  _wrShow(0);
  try{document.getElementById('wr').focus({preventScroll:true});}catch(e){}
  _wr.last=performance.now();
  _wr.raf=requestAnimationFrame(_wrTick);
  _wr.iv=setInterval(_wrWatch,250);
  return true;
}
function closeWrapped(keep){
  if(!_wr)return;
  cancelAnimationFrame(_wr.raf);clearTimeout(_wr.cT);clearInterval(_wr.iv);clearTimeout(_wr.pT);
  _wrShotClose(true);if(!keep)_wrGlowC=null; // el fondo de la imagen (8 MB) no se queda en memoria
  document.removeEventListener('visibilitychange',_wrVis);
  const ret=_wr.ret,onClose=_wr.onClose;_wr=null;
  const root=document.getElementById('wrapped-root');if(root){_wrUnmount(root);root.innerHTML='';}
  if(!keep&&ret&&ret.isConnected&&typeof ret.focus==='function'){try{ret.focus({preventScroll:true});}catch(e){}}
  if(!keep&&onClose){try{onClose();}catch(e){console.error(e);}}
}
function _wrShow(i){
  if(!_wr)return;
  const D=_wr.D,n=D.pages.length;
  i=Math.max(0,Math.min(n-1,i));_wr.i=i;_wr.el=0;
  const g=WR_PAGES.find(x=>x.k===D.pages[i]),st=document.getElementById('wr-stage'),wr=document.getElementById('wr');
  if(!g||!st||!wr)return;
  wr.dataset.ac=typeof g.ac==='function'?g.ac(D):g.ac;wr.dataset.page=g.k;
  _wrUnmount(st); // la animación o el maniquí de la página anterior se desmontan antes de cambiarla
  st.innerHTML=`<section class="wr-pgc" aria-label="${esc(g.lbl)}">${g.html(D)}</section>`;
  st.scrollTop=0;
  if(g.mount){try{g.mount(D,st);}catch(e){console.error(e);}}
  const pg=document.getElementById('wr-pg');if(pg)pg.textContent=`${i+1} / ${n}`;
  // (14c) «Compartir», en la última página (en su sitio va el contador); la imagen se prepara ya, en segundo plano
  const sh=document.getElementById('wr-share'),last=i===n-1&&D.sessions>0;
  if(sh){sh.hidden=!last;sh.disabled=!last;if(pg)pg.hidden=last;if(last)_wrShotPrefetch();}
  const pv=document.getElementById('wr-prev'),nx=document.getElementById('wr-next');
  if(pv)pv.disabled=i===0;if(nx)nx.disabled=i===n-1;
  // al desactivarse el botón con el foco, el foco vuelve al diálogo (no se pierde fuera)
  if(document.activeElement&&document.activeElement.disabled)try{wr.focus({preventScroll:true});}catch(e){}
  const live=document.getElementById('wr-live');if(live)live.textContent=`Página ${i+1} de ${n}: ${g.lbl}. ${_wrSay(st,g.lbl)}`;
  _wrBars();_wrPauseBtn();
  _wrCount(st);
}
// (14e) Lo que se anuncia de cada página, en frases (antes, el textContent pegaba «Sesiones1» o «+1sesiónMás»):
// cada bloque (kicker, cifra, línea, fila, nota) es una frase; las piezas en línea (cifra y unidad) van con un espacio,
// salvo la coma de las cifras (.wr-cm). Se salta lo aria-hidden (iconos, leyendas, la parte visible de las filas de
// la comparación, que llevan su frase en .sr-only), la animación 3D y el kicker que repite el nombre de la página;
// de un gráfico con role=img se lee su aria-label y data-say sustituye el contenido de un elemento por esa frase.
const _WR_BLK=/^(DIV|P|SECTION|SMALL|H[1-6]|UL|OL|LI)$/;
function _wrSay(root,lbl){
  if(!root)return'';
  const out=[],lb=String(lbl||'').toLowerCase();let cur='';
  const flush=()=>{const t=cur.replace(/\s+/g,' ').replace(/\s+([.,;:)])/g,'$1').replace(/\(\s+/g,'(').trim();if(t)out.push(t);cur='';};
  const walk=n=>{
    if(n.nodeType===3){cur+=n.nodeValue;return;}
    if(n.nodeType!==1||n.hidden||n.getAttribute('aria-hidden')==='true')return;
    const cl=n.classList,tag=n.tagName.toUpperCase();
    if(cl.contains('wr-3d')||tag==='CANVAS'||tag==='SCRIPT'||tag==='STYLE')return;
    if(cl.contains('wr-kick')&&n.textContent.trim().toLowerCase()===lb)return;
    const say=n.getAttribute('data-say')||(n.getAttribute('role')==='img'?n.getAttribute('aria-label'):null);
    const blk=_WR_BLK.test(tag)||n.getAttribute('role')==='listitem';
    if(say!=null||tag==='SVG'){flush();if(say)cur=say;flush();return;}
    const glue=cl.contains('wr-cm');
    if(blk)flush();else if(!glue)cur+=' ';
    n.childNodes.forEach(walk);
    if(blk)flush();else if(!glue)cur+=' ';
  };
  root.childNodes.forEach(walk);flush();
  return out.map(t=>(/[.!?…:;,»]$/.test(t)?t:t+'.').replace(/^\p{Ll}/u,c=>c.toUpperCase())).join(' ').slice(0,900);
}
function wrapGo(d){if(!_wr)return;const n=_wr.D.pages.length,j=_wr.i+d;if(j<0||j>=n){if(j<0)_wr.el=0;_wrBars();return;}_wrShow(j);}
function wrapTogglePause(){if(!_wr)return;_wr.paused=!_wr.paused;_wrPauseBtn();}
function _wrPauseBtn(){
  const b=document.getElementById('wr-pause');if(!b||!_wr)return;
  const p=_wr.paused;
  b.setAttribute('aria-pressed',String(p));b.setAttribute('aria-label',p?'Reanudar el pase automático':'Pausar el pase automático');
  b.innerHTML=p?'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6.5 4.5v11l9-5.5z" fill="currentColor"/></svg>'
    :'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6.5 4.5v11M13.5 4.5v11" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';
  b.classList.toggle('on',p);
}
function _wrBars(){
  if(!_wr)return;
  const bars=document.querySelectorAll('#wr .wr-bar i');
  const one=_wr.D.pages.length===1; // una sola página: su barra, llena (no hay pase automático)
  bars.forEach((b,k)=>{const f=one||k<_wr.i?1:k>_wr.i?0:Math.min(1,_wr.el/WR_DUR);b.style.width=(f*100).toFixed(2)+'%';});
}
// Avance del tiempo de la página (now: ms de performance.now). Pausado, mantenido o en segundo plano, no corre.
function _wrStep(now){
  if(!_wr)return;
  const dt=Math.min(250,Math.max(0,now-_wr.last));_wr.last=now;
  const n=_wr.D.pages.length;
  if(!_wr.paused&&!_wr.hold&&!document.hidden&&n>1){
    _wr.el+=dt;
    if(_wr.el>=WR_DUR){if(_wr.i<n-1)_wrShow(_wr.i+1);else _wr.el=WR_DUR;}
    _wrBars();
  }
}
// Cada fotograma; y, por si el navegador no da fotogramas (ahorro de energía, vistas sin pintar), cada 250 ms
function _wrTick(now){if(!_wr)return;_wr.lastF=performance.now();_wrStep(now);_wr.raf=requestAnimationFrame(_wrTick);}
function _wrWatch(){if(_wr&&performance.now()-(_wr.lastF||0)>200)_wrStep(performance.now());}
function _wrVis(){if(_wr)_wr.last=performance.now();}
// Toques: pulsar pausa (mientras se mantiene); soltar enseguida y sin moverse es un toque (izquierda: atrás; resto:
// adelante); deslizar en horizontal pasa de página. Los botones de dentro de la página no cuentan como toque.
function _wrDown(e){
  if(!_wr||e.button>0||(e.target.closest&&e.target.closest('button,a,input')))return;
  // la animación 3D (grande) se gira y se pausa con el dedo; en miniatura (pantallas bajas) no responde y el toque es de la historia
  // (mientras se gira, la página no pasa: pausa hasta soltar, sin contar como toque ni deslizar)
  const a3=e.target.closest&&e.target.closest('.wr-3d.on');
  if(a3&&a3._ga&&!a3._ga.mini){
    const id=e.pointerId;_wr.hold=true;
    const end=ev=>{
      if(ev.pointerId!==id)return;
      document.removeEventListener('pointerup',end,true);document.removeEventListener('pointercancel',end,true);
      if(_wr&&!_wr.ptr){_wr.hold=false;_wr.last=performance.now();}
    };
    document.addEventListener('pointerup',end,true);document.addEventListener('pointercancel',end,true);
    return;
  }
  _wr.ptr={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now()};_wr.hold=true;
}
function _wrUp(e){
  if(!_wr||!_wr.ptr||_wr.ptr.id!==e.pointerId)return;
  const p=_wr.ptr,dx=e.clientX-p.x,dy=e.clientY-p.y,dt=performance.now()-p.t;
  _wr.ptr=null;_wr.hold=false;_wr.last=performance.now();
  if(Math.abs(dx)>=50&&Math.abs(dx)>Math.abs(dy)*1.3){wrapGo(dx<0?1:-1);return;}
  if(dt<350&&Math.abs(dx)<12&&Math.abs(dy)<12){
    const r=e.currentTarget.getBoundingClientRect();
    wrapGo(e.clientX-r.left<r.width*.3?-1:1);
  }
}
function _wrCancel(){if(_wr){_wr.ptr=null;_wr.hold=false;_wr.last=performance.now();}}
// Teclado dentro de la historia: ← → páginas, espacio pausa (fuera de un botón), Tab no sale. Escape: el manejador global.
function _wrKey(e){
  if(!_wr)return;
  // (14c) con la vista de la imagen abierta, el teclado es suyo: Tab no sale de ella y no se cambia de página
  const shot=document.getElementById('wr-shot');
  if(shot){
    if(e.key!=='Tab')return;
    const f=[...shot.querySelectorAll('button')];e.preventDefault();
    const k=f.indexOf(document.activeElement),to=f[(k<0?0:k+(e.shiftKey?-1:1)+f.length)%f.length];
    if(to)try{to.focus();}catch(_){}
    return;
  }
  if(e.key==='ArrowRight'){e.preventDefault();wrapGo(1);}
  else if(e.key==='ArrowLeft'){e.preventDefault();wrapGo(-1);}
  else if((e.key===' '||e.key==='Spacebar')&&!(e.target.closest&&e.target.closest('button'))){e.preventDefault();wrapTogglePause();}
  else if(e.key==='Tab'){
    const wr=document.getElementById('wr');if(!wr)return;
    const f=[...wr.querySelectorAll('button:not([disabled])')].filter(x=>x.getClientRects().length);if(!f.length){e.preventDefault();return;}
    const a=f[0],z=f[f.length-1],c=document.activeElement;
    const to=!wr.contains(c)||c===wr?(e.shiftKey?z:a):e.shiftKey&&c===a?z:!e.shiftKey&&c===z?a:null;
    if(to){e.preventDefault();try{to.focus();}catch(_){}}
  }
}
// Cifras de 0 a su valor (≈0,9 s con desaceleración). Sin movimiento: ya en su valor. Siempre acaban en el exacto.
function _wrCount(root){
  const els=[...root.querySelectorAll('.wr-n[data-to]')];
  if(!_wr||_rm()||!els.length)return;
  const fmt=(el,v)=>{el.innerHTML=_wrNumH((el.dataset.pre||'')+_wrFmtV(v,el.dataset.fmt));};
  let done=false;
  const fin=()=>{done=true;els.forEach(el=>fmt(el,+el.dataset.to));};
  const T=900,t0=performance.now();
  els.forEach(el=>fmt(el,0));
  const step=()=>{
    if(done||!els[0].isConnected)return;
    const t=Math.max(0,Math.min(1,(performance.now()-t0)/T)),k=1-Math.pow(1-t,3);
    els.forEach(el=>fmt(el,+el.dataset.to*k));
    if(t<1)requestAnimationFrame(step);else fin();
  };
  requestAnimationFrame(step);
  clearTimeout(_wr.cT);_wr.cT=setTimeout(fin,T+300);
}

// ── (14c) Compartir como imagen ──
// Una imagen de 1080×1920 (formato historia) con lo principal del periodo: título y fechas, sesiones, tiempo, kilos (o el
// trabajo sin kilos, en su medida), récords, el que más mejoró y la comparación; con el logo de Teca y la marca. El peso
// corporal no sale (es tuyo: la imagen es para enseñarla). Colores de la paleta con paletteHex (el canvas no lee var()) y
// las fuentes propias (DM Sans, DM Mono) ya cargadas. Se prepara en segundo plano al llegar a la última página.
const WR_SHOT_W=1080,WR_SHOT_H=1920;
const WR_MON_S=['ene','feb','mar','abr','may','jun','jul','ago','sept','oct','nov','dic'];
const _WRF={s:'"DM Sans",sans-serif',m:'"DM Mono",monospace',e:'"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'};
// Fechas del periodo: «Del 1 al 31 de octubre de 2026», «Del 15 sept al 26 oct de 2026 · 6 semanas», «… · en curso»
function _wrRange(P){
  const a=new Date(P.from),b=new Date(P.cur?Date.now():P.to-1);
  if(P.kind==='month'){
    const d=b.getDate();
    return P.cur?(d===1?`1 de ${P.name} de ${P.y}`:`Del 1 al ${d} de ${P.name} de ${P.y}`)+' · en curso':`Del 1 al ${P.days} de ${P.name} de ${P.y}`;
  }
  const f=x=>`${x.getDate()} ${WR_MON_S[x.getMonth()]}`,ys=a.getFullYear()!==b.getFullYear();
  if(P.cur)return`Desde el ${f(a)} de ${a.getFullYear()} · en curso`;
  return`Del ${f(a)}${ys?' de '+a.getFullYear():''} al ${f(b)} de ${b.getFullYear()} · ${plural(P.weeks,'semana')}`;
}
// Colores de la paleta para el canvas: los tokens de :root en hex, con alfa (a) o mezclados (mix)
function _wrPal(){
  const tok={bg:paletteHex('--bg','#0b1514'),bg2:paletteHex('--bg2','#11201e'),text:paletteHex('--text','#eef6f4'),text2:paletteHex('--text2','#86a19c'),
    text3:paletteHex('--text3','#79948f'),mint:paletteHex('--green','#4fe3c1'),pr:paletteHex('--pr','#ff8a65')};
  const rgb=h=>{const n=parseInt(String(h).slice(1),16);return[(n>>16)&255,(n>>8)&255,n&255];};
  const a=(k,al)=>`rgba(${rgb(tok[k]).join(',')},${al})`;
  const mix=(k1,k2,w)=>{const x=rgb(tok[k1]),y=rgb(tok[k2]);return`rgb(${x.map((v,i)=>Math.round(v*w+y[i]*(1-w))).join(',')})`;};
  return Object.assign(tok,{a,mix,prHi:paletteHex('--pr','#ff8a65',.45),stage:mix('bg','bg2',.6)});
}
// (14e) Fondo de la imagen: --bg con brillos radiales menta (G = [cx, cy, radio, alfa en el centro → 0 en el radio]),
// calculado píxel a píxel y redondeado sin tramado. Los degradados del canvas van tramados (cada píxel distinto) y el
// PNG pesaba ~1,7 MB; así la transición es igual de suave (escalones de un nivel de color) y pesa < 600 KB.
// (14 r1) El fondo no depende del resumen: se calcula una vez por paleta (caché mientras la historia está abierta) y,
// al prepararlo de antemano (_wrGlowPrep), a trozos de ~8 ms para no congelar la historia en móviles lentos.
const _wrGlows=(W,H)=>[[W/2,-80,H*.62,.24],[W,H,W*.95,.09]];
let _wrGlowC=null;
function _wrGlowStart(C,W,H,G){
  const rgb=h=>{const n=parseInt(String(h).slice(1),16);return[(n>>16)&255,(n>>8)&255,n&255];};
  const b=rgb(C.bg),m=rgb(C.mint);
  let im;try{im=new ImageData(W,H);}catch(e){im=document.createElement('canvas').getContext('2d').createImageData(W,H);}
  // el alfa va en escalones de un nivel del canal que más cambia: los tres canales cambian en el mismo sitio (menos
  // transiciones por fila, el PNG comprime mejor) y el paso sigue siendo de un nivel (no se ven bandas)
  const Q=Math.max(1,...m.map((v,i)=>Math.abs(v-b[i])));
  return{k:[C.bg,C.mint,W,H,JSON.stringify(G)].join('|'),im,W,H,y:0,b,m,Q,
    gx:G.map(x=>x[0]),gy:G.map(x=>x[1]),gR:G.map(x=>x[2]),gR2:G.map(x=>x[2]*x[2]),gAQ:G.map(x=>x[3]*Q)};
}
function _wrGlowRows(c,y1){
  const {W,b,m,Q,gx,gy,gR,gR2,gAQ}=c,d=c.im.data,n=gx.length;
  for(let y=c.y;y<y1;y++){
    let i=y*W*4;
    for(let x=0;x<W;x++,i+=4){
      let r=b[0],gg=b[1],bb=b[2];
      for(let j=0;j<n;j++){
        const dx=x-gx[j],dy=y-gy[j],d2=dx*dx+dy*dy;if(d2>=gR2[j])continue;
        const a=Math.round(gAQ[j]*(1-Math.sqrt(d2)/gR[j]))/Q;if(!a)continue;
        r+=(m[0]-r)*a;gg+=(m[1]-gg)*a;bb+=(m[2]-bb)*a;
      }
      d[i]=Math.round(r);d[i+1]=Math.round(gg);d[i+2]=Math.round(bb);d[i+3]=255;
    }
  }
  c.y=Math.max(c.y,y1);
}
function _wrGlowGet(C,W,H,G){
  const k=[C.bg,C.mint,W,H,JSON.stringify(G)].join('|');
  if(!_wrGlowC||_wrGlowC.k!==k)_wrGlowC=_wrGlowStart(C,W,H,G);
  return _wrGlowC;
}
async function _wrGlowPrep(C,W,H,G){
  const c=_wrGlowGet(C,W,H,G);
  while(c.y<H){
    if(_wrGlowC!==c)return;
    const t0=performance.now();
    while(c.y<H&&performance.now()-t0<8)_wrGlowRows(c,Math.min(H,c.y+24));
    if(c.y<H)await new Promise(r=>setTimeout(r,0));
  }
}
function _wrGlowBg(g,C,W,H,G){
  const c=_wrGlowGet(C,W,H,G);
  if(c.y<H)_wrGlowRows(c,H);
  g.putImageData(c.im,0,0);
}
function _wrFont(g,w,px,f){g.font=`${w} ${Math.round(px)}px ${_WRF[f||'s']}`;}
function _wrSp(g,px){try{if('letterSpacing' in g)g.letterSpacing=px+'px';}catch(e){}}
function _wrEll(g,t,max){t=String(t);if(g.measureText(t).width<=max)return t;while(t.length>1&&g.measureText(t+'…').width>max)t=t.slice(0,-1);return t.replace(/[\s,·:]+$/,'')+'…';}
// Pone la fuente más grande (de px a min) con la que el texto cabe en max; si ni a min cabe, lo corta con «…»
function _wrFitTxt(g,t,max,w,px,min,f){let s=px;_wrFont(g,w,s,f);while(s>min&&g.measureText(t).width>max){s-=2;_wrFont(g,w,s,f);}return _wrEll(g,t,max);}
// Hasta n líneas (la última, cortada con «…»)
function _wrLines(g,t,max,n){
  const L=[];let cur='';
  String(t).split(/\s+/).filter(Boolean).forEach(w=>{const tr=cur?cur+' '+w:w;if(!cur||g.measureText(tr).width<=max)cur=tr;else{L.push(cur);cur=w;}});
  if(cur)L.push(cur);
  if(L.length>n){const rest=L.slice(n-1).join(' ');L.length=n-1;L.push(rest+'…');}
  return L.map(l=>_wrEll(g,l,max));
}
function _wrRR(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
// «76 125 kg» → [['76 125',1],[' kg',0]]: las cifras grandes (DM Mono) y las unidades pequeñas (DM Sans)
function _wrSegs(t){const o=[];String(t).replace(/([+−]?\d(?:[\d,.]|[   ](?=\d))*)|([^\d+−]+|[+−])/g,(m,a)=>{o.push([m,a?1:0]);return m;});return o;}
// Pinta los segmentos con la cifra a px (encoge todo hasta que quepa en max); devuelve el ancho. Las unidades van sin
// sus espacios y con un hueco proporcional a la cifra («14 h 3 min»), y los miles con un hueco fino («76 125»).
function _wrDrawSegs(g,segs,x,y,max,px,col,ucol){
  let s=px;
  const font=b=>b?_wrFont(g,500,s,'m'):_wrFont(g,600,Math.max(20,s*.42));
  const draw=(t,b,cx,paint)=>{
    font(b);
    if(b){let w=0;t.split(/[   ]/).forEach((q,k)=>{if(k)w+=s*.22;if(paint)g.fillText(q,cx+w,y);w+=g.measureText(q).width;});return w;}
    const q=t.trim(),pre=/^\s/.test(t)?s*.14:0,post=/\s$/.test(t)?s*.14:0;
    if(paint&&q)g.fillText(q,cx+pre,y);
    return pre+(q?g.measureText(q).width:0)+post;
  };
  const mw=()=>segs.reduce((w,[t,b])=>w+draw(t,b,0,false),0);
  let W=mw();while(W>max&&s>30){s-=2;W=mw();}
  let cx=x;
  segs.forEach(([t,b])=>{g.fillStyle=b?col:ucol;cx+=draw(t,b,cx,true);});
  return W;
}
// Teca, la pesa: el logo de la marca (viewBox 1024, recortada como el de la historia: 278 206 468 638). Devuelve su ancho.
function _wrDrawTeca(g,x,y,h,col,face){
  if(typeof Path2D!=='function')return 0;
  const k=h/638;
  g.save();g.translate(x-278*k,y-206*k);g.scale(k,k);g.lineCap='round';g.lineJoin='round';
  g.strokeStyle=col;g.lineWidth=92;g.stroke(new Path2D('M336 560V368a112 112 0 0 1 112-112h128a112 112 0 0 1 112 112v192'));
  g.fillStyle=col;g.fill(new Path2D('M398.4 840a230 230 0 1 1 227.2 0z'));
  g.fillStyle=face;g.beginPath();g.arc(436,648,34,0,Math.PI*2);g.fill();
  g.strokeStyle=face;g.lineWidth=28;g.stroke(new Path2D('M554 658q34-46 68 0'));
  g.lineWidth=30;g.stroke(new Path2D('M442 728q70 66 140 0'));
  g.restore();
  return 468*k;
}
// Las 3 o 4 cifras de arriba: sesiones; tiempo (o días, sin duración); kilos (o el trabajo sin kilos en su medida:
// reps, tiempo, metros; o series, o cardio); récords (o series). Con una sola sesión sin trabajo apuntado, solo dos.
function _wrShotTiles(D){
  const P=D.P,T=[],o=_wrOtherParts(D);
  const days={k:'days',l:'Días con entreno',v:String(D.days),s:P.kind==='cycle'?`en ${plural(P.weeks,'semana')}`:P.cur?'en lo que va de mes':`de los ${P.days} del mes`};
  T.push({k:'sessions',l:'Sesiones',v:String(D.sessions),s:P.kind==='cycle'?`${_wrDec(Math.round(D.sessions/P.weeks*10)/10)} por semana`:D.minN?`${plural(D.days,'día')} con entreno`:`en ${P.name}`});
  T.push(D.minN?{k:'min',l:'Tiempo',v:_wrHM(D.min),s:`≈ ${Math.round(D.min/D.minN)}${NB}min por sesión`}:days);
  const rest='sin pasarlo a kilos'; // el resto del trabajo sin kilos va en la línea de debajo (_wrShotExtra)
  let w=null;
  if(D.ton>0){const eq=wrTonEquiv(D.ton);w={k:'ton',l:'Kilos levantados',v:_wrN(D.ton)+NB+'kg',s:eq?'≈ '+eq.txt:'kg × reps de cada serie'};}
  else if(D.reps>0)w={k:'reps',l:'Reps sin peso',v:_wrN(D.reps)+NB+'reps',s:rest};
  else if(D.secs>0)w={k:'secs',l:'Trabajo por tiempo',v:_wrSecsTxt(D.secs),s:rest};
  else if(D.metres>0)w={k:'metres',l:'Distancia',v:_wrMetresTxt(D.metres),s:rest};
  else if(D.sets>0)w={k:'sets',l:'Series',v:_wrN(D.sets),s:'completadas'};
  else if(D.cardio>0)w={k:'cardio',l:'Cardio',v:String(D.cardio),s:D.cardio===1?'bloque':'bloques'};
  if(w)T.push(w);
  if(D.records.length)T.push({k:'records',l:'Récords',v:String(D.records.length),s:`en ${plural(new Set(D.records.map(x=>x.id)).size,'ejercicio')}`,pr:1});
  else if(D.sets>0&&!(w&&w.k==='sets'))T.push({k:'sets',l:'Series',v:_wrN(D.sets),s:'completadas'});
  // (los días ya salen: en la cifra de sesiones o en su propia cifra, en vez del tiempo)
  return T;
}
// La línea bajo las cifras con el trabajo sin kilos que no está en ellas: «Y sin kilos: 320 reps sin peso y 12 min por
// tiempo.» o, si la cifra ya es de reps (o tiempo…), «También: 3 min por tiempo y 60 m recorridos.»
function _wrShotExtra(D,T){
  const o=_wrOtherParts(D);if(!o.length)return'';
  if(D.ton>0)return`Y sin kilos: ${_mmList(o)}.`;
  const shown=T.some(t=>t.k==='reps'||t.k==='secs'||t.k==='metres')?o.slice(1):T.some(t=>t.k==='cardio')?o.filter(x=>!/cardio/.test(x)):o;
  return shown.length?`También: ${_mmList(shown)}.`:'';
}
function _wrShotBest(D){
  const b=D.best;if(!b)return null;
  const p=b.from>0?(b.to/b.from-1)*100:b.pct,pf=_wrPctFmt(p);
  const what=b.mode==='w'?'1RM estimado':b.mode==='xt'?'Tiempo por serie':b.mode==='xd'?'Distancia por serie':'Reps por serie';
  return{name:b.name,pct:`+${pf?_wrD1(p):Math.round(p)}${NB}%`,line:`${what}: ${_wrBestPair(b).join(' → ')}`,key:exAnimKey(b.ex||{id:b.id})||'',ic:b.ex&&b.ex.ic||'💪'};
}
// Los récords más recientes (el último de cada ejercicio), como en su página
function _wrShotRecs(D){
  if(!D.records.length)return null;
  const m=new Map();D.records.forEach(x=>m.set(x.id,x));
  return[...m.values()].sort((a,b)=>_prWhen(b)-_prWhen(a)).map(x=>({n:exDisplayName(x.id),v:_wrCm(prTxt(x).split(' · ')[0])}));
}
// La comparación en una línea: lo que sube (como la página), «¡Has vuelto!», «Mismo ritmo», «Un mes mixto», «Un mes más
// tranquilo» o el primero. up: va en menta (sube o vuelves); si no, en neutro (16c: antes en ámbar, el color de los avisos)
function _wrShotCmp(D){
  const P=D.P,V=_wrCmpView(D);
  if(!V)return D.prev?null:{k:'Comparación',ar:'',t:P.kind==='month'?'Tu primer mes':'Tu primer ciclo',up:true};
  const k=V.days?'Frente a '+V.ref:V.kick;
  if(V.back)return{k,ar:'',t:'¡Has vuelto!',up:true};
  const h=_wrCmpHero(V),M=_wrCmpMix(V),u=P.kind==='month'?'mes':'ciclo';
  if(h){
    const w={ton:'de kilos',sessions:h.d===1?'sesión':'sesiones',sets:h.d===1?'serie':'series',records:h.d===1?'récord':'récords',min:'de tiempo'}[h.k];
    return{k,ar:'↑',t:`${h.k==='ton'||h.k==='min'?`+${h.pct}${NB}%`:'+'+(h.k==='sets'?_wrN(h.d):h.d)} ${w}`,up:true};
  }
  return{k,ar:'',t:M.ups.length&&M.downs.length?`Un ${u} mixto`:!M.downs.length?'Mismo ritmo':`Un ${u} más tranquilo`,up:false};
}
// Dibuja la imagen (th: la miniatura 3D del que más mejoró, o null → su emoji). Devuelve el canvas.
function wrapShotDraw(D,th){
  const W=WR_SHOT_W,H=WR_SHOT_H,cv=document.createElement('canvas');cv.width=W;cv.height=H;
  const g=cv.getContext('2d');if(!g)throw new Error('sin canvas');
  const C=_wrPal(),P=D.P,X=90,CW=W-2*X;
  g.textBaseline='alphabetic';g.textAlign='left';
  // fondo opaco con el brillo menta de la historia
  g.fillStyle=C.bg;g.fillRect(0,0,W,H);
  // (14e) sin degradados del canvas (tramados): el mismo brillo calculado y redondeado (ver _wrGlowBg)
  _wrGlowBg(g,C,W,H,_wrGlows(W,H));
  // marca: Teca + «Gymteca» + qué resumen es
  const lw=_wrDrawTeca(g,X,128,118,C.mint,C.bg),hx=X+(lw?lw+28:0);
  g.fillStyle=C.text;_wrSp(g,-1);_wrFont(g,700,58);g.fillText('Gymteca',hx,190);
  _wrSp(g,3.5);g.fillStyle=C.text2;_wrFont(g,700,24);g.fillText(P.kind==='month'?'RESUMEN DEL MES':'RESUMEN DEL CICLO',hx+2,234);_wrSp(g,0);
  // título y fechas
  g.fillStyle=C.text;_wrSp(g,-3);g.fillText(_wrFitTxt(g,P.title,CW,700,124,68),X,394);_wrSp(g,0);
  g.fillStyle=C.text2;g.fillText(_wrFitTxt(g,_wrRange(P),CW,500,36,24),X,452);
  // bloques del centro (lo que no quepa sale, de lo menos a lo más importante)
  const T=_wrShotTiles(D),extra=_wrShotExtra(D,T);
  const B=_wrShotBest(D),RL=_wrShotRecs(D)||[],K=_wrShotCmp(D);
  const tileH=180,tg=26,rows=Math.ceil(T.length/2),GAP=46,top=510,bot=1712;
  let showX=!!extra,nr=Math.min(3,RL.length),showMore=RL.length>nr,showK=!!K;
  const tilesH=()=>rows*tileH+(rows-1)*tg+(showX?52:0);
  const tot=()=>{const L=[tilesH()];if(B)L.push(240);if(nr)L.push(44+nr*66+(showMore?38:0));if(showK)L.push(98);return L.reduce((a,b)=>a+b,0)+(L.length-1)*GAP;};
  if(tot()>bot-top)showMore=false;
  while(tot()>bot-top&&nr>1){nr--;}
  if(tot()>bot-top)showX=false;
  if(tot()>bot-top)showK=false;
  let y=top+Math.min(120,Math.max(0,Math.round((bot-top-tot())/2))); // con poco que contar, cerca del título
  // cifras
  T.forEach((t,i)=>{
    const r=Math.floor(i/2),c=i%2,full=i===T.length-1&&T.length%2===1;
    const tw=full?CW:(CW-tg)/2,tx=X+(full?0:c*(tw+tg)),ty=y+r*(tileH+tg),ix=tx+34,iw=tw-68;
    _wrRR(g,tx,ty,tw,tileH,28);g.fillStyle=t.pr?C.a('pr',.1):C.a('text',.05);g.fill();
    g.lineWidth=2;g.strokeStyle=t.pr?C.a('pr',.3):C.a('text',.1);g.stroke();
    _wrSp(g,2.5);g.fillStyle=t.pr?C.pr:C.text2;g.fillText(_wrFitTxt(g,t.l.toUpperCase(),iw,700,22,17),ix,ty+50);
    _wrSp(g,-2);_wrDrawSegs(g,_wrSegs(t.v),ix,ty+124,iw,74,t.pr?C.pr:C.text,C.text2);_wrSp(g,0);
    if(t.s){g.fillStyle=t.k==='ton'?C.mint:C.text2;g.fillText(_wrFitTxt(g,t.s,iw,500,26,19),ix,ty+160);}
  });
  y+=rows*tileH+(rows-1)*tg;
  if(showX){g.fillStyle=C.text2;g.fillText(_wrFitTxt(g,extra,CW,500,28,21),X+4,y+44);y+=52;}
  y+=GAP;
  // el que más mejoró: su miniatura 3D (o su emoji) y su % en su medida
  if(B){
    const S=240;
    g.save();_wrRR(g,X,y,S,S,30);g.clip();g.fillStyle=C.stage;g.fillRect(X,y,S,S);
    if(th){try{g.drawImage(th,X,y,S,S);}catch(e){th=null;}}
    if(!th){_wrFont(g,400,108,'e');g.textAlign='center';g.fillStyle=C.text;g.fillText(B.ic,X+S/2,y+S/2+38);g.textAlign='left';}
    g.restore();_wrRR(g,X,y,S,S,30);g.lineWidth=2;g.strokeStyle=C.a('text',.1);g.stroke();
    const bx=X+S+40,bw=CW-S-40;
    _wrSp(g,2.5);g.fillStyle=C.mint;g.fillText(_wrFitTxt(g,'EL QUE MÁS MEJORÓ',bw,700,24,17),bx,y+34);_wrSp(g,0);
    _wrFont(g,600,40);const nl=_wrLines(g,B.name,bw,2);g.fillStyle=C.text;nl.forEach((l,k)=>g.fillText(l,bx,y+82+k*46));
    const py=y+82+(nl.length-1)*46+72;
    _wrSp(g,-2);_wrDrawSegs(g,_wrSegs(B.pct),bx,py,bw,66,C.mint,C.mint);_wrSp(g,0);
    g.fillStyle=C.text2;g.fillText(_wrFitTxt(g,B.line,bw,500,27,19),bx,py+40);
    y+=S+GAP;
  }
  // récords (coral)
  if(nr){
    _wrSp(g,2.5);g.fillStyle=C.pr;g.fillText(_wrFitTxt(g,P.kind==='month'?'RÉCORDS DEL MES':'RÉCORDS DEL CICLO',CW,700,24,17),X,y+30);_wrSp(g,0);
    RL.slice(0,nr).forEach((x,k)=>{
      const ry=y+44+k*66;
      _wrRR(g,X,ry,CW,56,18);g.fillStyle=C.a('pr',.09);g.fill();g.lineWidth=2;g.strokeStyle=C.a('pr',.24);g.stroke();
      _wrFont(g,400,28,'e');g.fillStyle=C.text;g.fillText('🏆',X+20,ry+39);
      _wrFont(g,500,26,'m');const vw=Math.min(CW*.45,g.measureText(x.v).width),vt=_wrEll(g,x.v,vw);
      g.textAlign='right';g.fillStyle=C.prHi;g.fillText(vt,X+CW-22,ry+38);g.textAlign='left';
      g.fillStyle=C.text;g.fillText(_wrFitTxt(g,x.n,CW-74-22-vw-24,500,29,22),X+70,ry+38);
    });
    let ry=y+44+nr*66;
    if(showMore){const m=RL.length-nr;g.fillStyle=C.text2;_wrFont(g,500,25);g.fillText(`Y ${plural(m,'ejercicio más','ejercicios más')} con récord`,X+4,ry+26);ry+=38;}
    y=ry+GAP;
  }
  // frente al periodo anterior
  if(showK){
    _wrSp(g,2.5);g.fillStyle=K.up?C.mint:C.text2;g.fillText(_wrFitTxt(g,K.k.toUpperCase(),CW,700,24,17),X,y+30);_wrSp(g,0);
    let ax=X;
    if(K.ar){_wrFont(g,700,46);g.fillStyle=C.mint;g.fillText(K.ar,X,y+86);ax+=g.measureText(K.ar).width+12;}
    g.fillStyle=C.text;g.fillText(_wrFitTxt(g,K.t,X+CW-ax,600,46,30),ax,y+86);
  }
  // pie: la marca
  _wrFont(g,600,28);const ft='Hecho con Gymteca',fw=g.measureText(ft).width,fl=44*468/638,fx=(W-(fl+14+fw))/2;
  _wrDrawTeca(g,fx,1786,44,C.mint,C.bg);g.fillStyle=C.text2;_wrFont(g,600,28);g.fillText(ft,fx+fl+14,1821);
  return cv;
}
// Espera a las fuentes propias (sin colgarse: como mucho 2,5 s)
function _wrFontsReady(){
  if(!document.fonts||!document.fonts.load)return Promise.resolve();
  const L=['500 40px "DM Sans"','600 40px "DM Sans"','700 40px "DM Sans"','500 40px "DM Mono"'];
  const p=Promise.all(L.map(f=>document.fonts.load(f).catch(()=>null))).then(()=>document.fonts.ready);
  return Promise.race([p,new Promise(r=>setTimeout(r,2500))]).catch(()=>{});
}
// Miniatura 3D del que más mejoró (la del motor, con su fondo de escena), o null
function _wrShotThumb(key){
  return new Promise(res=>{
    if(!key||typeof GymAnim==='undefined'||!GymAnim.thumb)return res(null);
    let d=null;try{d=GymAnim.thumb(key,240,240,{fit:'scene',bg:'scene',dpr:1});}catch(e){d=null;}
    if(!d)return res(null);
    const im=new Image(),t=setTimeout(()=>res(null),2500);
    im.onload=()=>{clearTimeout(t);res(im);};im.onerror=()=>{clearTimeout(t);res(null);};im.src=d;
  });
}
function _wrCanvasBlob(cv){
  return new Promise((res,rej)=>{
    try{
      if(cv.toBlob)cv.toBlob(b=>b?res(b):rej(new Error('toBlob vacío')),'image/png');
      else fetch(cv.toDataURL('image/png')).then(r=>r.blob()).then(res,rej);
    }catch(e){rej(e);}
  });
}
const _wrShotName=P=>`gymteca-${P.kind==='month'?`${P.name}-${P.y}`:'ciclo-'+P.n}.png`;
// Texto que acompaña a la imagen al compartir: «Mi octubre en Gymteca: 12 sesiones, 76 125 kg levantados y 19 récords.»
function _wrShareText(D){
  const P=D.P,o=[plural(D.sessions,'sesión','sesiones')];
  if(D.ton>0)o.push(`${_wrN(D.ton)}${NB}kg levantados`);
  if(D.records.length)o.push(plural(D.records.length,'récord'));
  return`Mi ${P.label} en Gymteca: ${_mmList(o)}.`;
}
// La imagen lista para compartir: {blob, name, title, text}
async function wrapShotBlob(D){
  await _wrFontsReady();
  const B=_wrShotBest(D),th=B?await _wrShotThumb(B.key):null;
  // el fondo, a trozos (sin congelar la historia); luego el dibujo lo toma de la caché
  await _wrGlowPrep(_wrPal(),WR_SHOT_W,WR_SHOT_H,_wrGlows(WR_SHOT_W,WR_SHOT_H));
  let cv;try{cv=wrapShotDraw(D,th);}finally{if(!_wr)_wrGlowC=null;}
  const blob=await _wrCanvasBlob(cv);
  if(!blob||!(blob.size>0))throw new Error('imagen vacía');
  return{blob,name:_wrShotName(D.P),title:`${D.P.title} · Gymteca`,text:_wrShareText(D)};
}
// Se prepara al llegar a la última página (para que «Compartir» responda al momento: el móvil exige compartir enseguida)
function _wrShotPrefetch(){
  const W=_wr;if(!W||W.png||W.pngP)return;
  clearTimeout(W.pT);
  W.pT=setTimeout(()=>{
    if(_wr!==W||W.png||W.pngP)return;
    const p=W.pngP=wrapShotBlob(W.D);
    p.then(r=>{if(W.pngP===p)W.png=r;},()=>{if(W.pngP===p)W.pngP=null;});
  },600);
}
function _wrShareBusy(on){
  const b=document.getElementById('wr-share'),t=document.getElementById('wr-share-t');if(!b)return;
  b.setAttribute('aria-busy',String(!!on));if(t)t.textContent=on?'Preparando…':'Compartir';
}
// «Compartir»: con navigator.share y archivos, la hoja del sistema; si no, se descarga (o, sin descarga, se enseña para
// guardarla a mano). Cancelar no es un error. Nunca bloquea: la imagen se hace aparte y los fallos acaban en un aviso.
// Devuelve 'share' | 'abort' | 'download' | 'view' | 'error' (o null si ya estaba en marcha o se cerró la historia).
async function wrapShare(){
  const W=_wr;if(!W||W.busy)return null;
  let R=W.png;
  if(!R){
    W.busy=true;_wrShareBusy(true);
    try{R=await(W.pngP||(W.pngP=wrapShotBlob(W.D)));W.png=R;}catch(e){console.warn('wrapShare',e);R=null;W.pngP=null;}
    W.busy=false;if(_wr===W)_wrShareBusy(false);
    if(_wr!==W)return null;
    if(!R){toast('No se pudo crear la imagen. Prueba otra vez.');return'error';}
  }
  let f=null;
  try{if(navigator.share&&navigator.canShare&&typeof File==='function'){f=new File([R.blob],R.name,{type:'image/png'});if(!navigator.canShare({files:[f]}))f=null;}}catch(e){f=null;}
  if(f){
    try{await navigator.share({files:[f],title:R.title,text:R.text});return'share';}
    catch(e){if(e&&e.name==='AbortError')return'abort';} // otro fallo (sin permiso…): se descarga
  }
  return _wrSave(R);
}
// Descarga la imagen; en la app instalada de iPhone (sin descargas) o si falla, la enseña para guardarla con un toque largo
function _wrSave(R,how){
  let dl=false;try{dl=typeof document.createElement('a').download==='string';}catch(e){}
  if(how==='view'||(how!=='download'&&(!dl||navigator.standalone===true)))return _wrShotView(R);
  try{
    const url=URL.createObjectURL(R.blob),a=document.createElement('a');
    a.href=url;a.download=R.name;a.rel='noopener';a.style.display='none';
    document.body.appendChild(a);a.click();
    setTimeout(()=>{a.remove();try{URL.revokeObjectURL(url);}catch(e){}},1500);
    toast('Imagen descargada: '+R.name);
    return'download';
  }catch(e){return _wrShotView(R);}
}
function _wrShotView(R){
  const inn=document.querySelector('#wr .wr-in');if(!inn||!R)return'error';
  _wrShotClose(true);
  let url='';try{url=URL.createObjectURL(R.blob);}catch(e){url='';}
  if(!url){toast('No se pudo enseñar la imagen');return'error';}
  const d=document.createElement('div');
  d.className='wr-shot';d.id='wr-shot';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-labelledby','wr-shot-t');
  d.innerHTML=`<p class="wr-shot-t" id="wr-shot-t">Mantén pulsada la imagen para guardarla o compartirla.</p>
    <div class="wr-shot-i"><img src="${esc(url)}" alt="${esc(R.text)}" width="1080" height="1920"></div>
    <button type="button" class="btn bs wr-shot-x" onclick="_wrShotClose()">Cerrar</button>`;
  d._url=url;inn.appendChild(d);
  try{d.querySelector('button').focus({preventScroll:true});}catch(e){}
  return'view';
}
function _wrShotClose(quiet){
  const d=document.getElementById('wr-shot');if(!d)return;
  try{URL.revokeObjectURL(d._url);}catch(e){}
  d.remove();
  if(!quiet){const b=document.getElementById('wr-share');try{(b&&!b.hidden?b:document.getElementById('wr')).focus({preventScroll:true});}catch(e){}}
}

// ── (14d) Entradas a la historia: Progreso («Tu octubre» y los meses anteriores con sesiones), la oferta de inicio de mes
// en Inicio (el mes anterior) y el ciclo recién cerrado en el Coach (junto a la recomendación de descarga de la etapa 13).
// En S solo lo justo para no insistir: S.wrapMonthSeen = clave del mes cuya oferta ya viste o descartaste ('m2026-10') y
// S.wrapCycleSeen = ciclos cerrados cuya oferta ya viste (al cargar datos o una copia sin él: todos los que traen, así un
// ciclo antiguo nunca se ofrece). Sin subir SCHEMA_VERSION: se sanean al cargar y al importar (_sanitizeWrapSeen).
const WR_OFFER_DAYS=10;  // la oferta del mes anterior sale los 10 primeros días del mes
const WR_CYCLE_DAYS=14;  // la del ciclo cerrado, hasta 14 días después de cerrarlo
const WR_CHIPS=6;        // meses anteriores a la vista en Progreso (el resto tras «Más»)
let _wrpAll=false;       // Progreso: todos los meses a la vista (en memoria)
function _sanitizeWrapSeen(o){
  if(!o||typeof o!=='object')return;
  if(!(typeof o.wrapMonthSeen==='string'&&/^m\d{4}-\d{1,2}$/.test(o.wrapMonthSeen)))o.wrapMonthSeen=null;
  const n=Array.isArray(o.mesocycles)?o.mesocycles.filter(_isPlainObj).length:0;
  o.wrapCycleSeen=Number.isInteger(o.wrapCycleSeen)&&o.wrapCycleSeen>=0?Math.min(o.wrapCycleSeen,n):n;
}
// Meses con alguna sesión (de tus sesiones, también las de copias antiguas sin ts), del más reciente al más antiguo
function wrapMonths(){
  const by=new Map();
  _wrSessions(-Infinity,Infinity).forEach(({ts})=>{const d=new Date(ts),k=d.getFullYear()*12+d.getMonth();by.set(k,(by.get(k)||0)+1);});
  return[...by.entries()].sort((a,b)=>b[0]-a[0]).map(([k,n])=>({y:Math.floor(k/12),m:k%12,n}))
    .filter(x=>wrapPeriod({kind:'month',y:x.y,m:x.m}));
}
// La pesa Teca (logo) en pequeño, en menta con la cara del color del fondo
function _wrLogoSvg(cls){
  return`<svg class="${cls}" viewBox="278 206 468 638" aria-hidden="true"><path d="M336 560V368a112 112 0 0 1 112-112h128a112 112 0 0 1 112 112v192" fill="none" stroke="var(--green)" stroke-width="92" stroke-linecap="round"/><path d="M398.4 840a230 230 0 1 1 227.2 0z" fill="var(--green)"/><g fill="none" stroke="var(--bg2)" stroke-linecap="round" stroke-linejoin="round"><circle cx="436" cy="648" r="34" fill="var(--bg2)" stroke="none"/><path d="M554 658q34-46 68 0" stroke-width="28"/><path d="M442 728q70 66 140 0" stroke-width="30"/></g></svg>`;
}
const _wrXSvg='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5 5 15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
function _wrCap(s){s=String(s||'');return s.charAt(0).toUpperCase()+s.slice(1);}
// Tras repintar con la tarjeta ya fuera (el foco estaba en ella), el foco va al título de la pantalla (nunca se pierde)
function _wrRefocus(){
  const a=document.activeElement;if(a&&a!==document.body&&a.isConnected)return;
  const h=document.querySelector('#screen .topbar h1');if(!h)return;
  h.tabIndex=-1;try{h.focus({preventScroll:true});}catch(e){}
}
// Progreso: «Tu octubre» (el mes en curso si ya tiene sesiones; si no, el último con sesiones) y los anteriores en chips
function wrapProgCardHtml(){
  const L=wrapMonths();if(!L.length)return'';
  const now=new Date(Date.now()),cy=now.getFullYear(),main=L[0],rest=L.slice(1);
  const cur=main.y===cy&&main.m===now.getMonth(),P=wrapPeriod({kind:'month',y:main.y,m:main.m});if(!P)return'';
  const show=_wrpAll?rest:rest.slice(0,WR_CHIPS);
  const nm=x=>_wrCap(WR_MONTHS[x.m])+(x.y!==cy?' '+x.y:'');
  return`<div class="sh" id="wrp-h">Tu resumen</div>
  <div class="card wrp">
    <button type="button" class="wrp-main" data-wr="m${main.y}-${main.m+1}" onclick="wrapOpenMonth(${main.y},${main.m},this)">
      ${_wrLogoSvg('wrp-logo')}
      <span class="wrp-t">${esc(P.title)}<small>${plural(main.n,'sesión','sesiones')}${cur?' · en curso':''} · en una historia para compartir</small></span>
      <span class="wrp-go" aria-hidden="true">Ver ›</span>
    </button>
    ${rest.length?`<div class="wrp-more" role="group" aria-label="Meses anteriores">${show.map(x=>`<button type="button" class="wrp-chip" data-wr="m${x.y}-${x.m+1}" onclick="wrapOpenMonth(${x.y},${x.m},this)" aria-label="Tu ${esc(WR_MONTHS[x.m])}${x.y!==cy?' de '+x.y:''}: ${plural(x.n,'sesión','sesiones')}">${esc(nm(x))}</button>`).join('')}${rest.length>WR_CHIPS?`<button type="button" class="wrp-chip wrp-all" aria-expanded="${_wrpAll}" onclick="wrapProgAll()">${_wrpAll?'Menos':`Más (${rest.length-WR_CHIPS})`}</button>`:''}</div>`:''}
  </div>`;
}
function wrapProgAll(){
  _wrpAll=!_wrpAll;render();
  const b=document.querySelector('.wrp-all');if(b)try{b.focus({preventScroll:true});}catch(e){}
}
function wrapOpenMonth(y,m,el){
  try{if(el&&el.focus)el.focus({preventScroll:true});}catch(e){}
  if(!openWrapped({kind:'month',y,m}))toast('No hay resumen de ese mes');
}
function wrapOpenCycle(n,el){
  try{if(el&&el.focus)el.focus({preventScroll:true});}catch(e){}
  if(!openWrapped({kind:'cycle',n}))toast('No hay resumen de ese ciclo');
}
// Inicio, los primeros días del mes: el resumen del mes anterior, una vez (abrirlo o ✕ lo dan por visto). No sale sin
// sesiones ese mes (ni a quien empieza), ni con un entreno en curso.
function wrapOfferMonth(){
  if(!Array.isArray(S.sessions)||!S.sessions.length||getActiveWorkout())return null;
  const now=new Date(Date.now());if(now.getDate()>WR_OFFER_DAYS)return null;
  const m=(now.getMonth()+11)%12,y=now.getMonth()?now.getFullYear():now.getFullYear()-1;
  const P=wrapPeriod({kind:'month',y,m});if(!P||S.wrapMonthSeen===P.key)return null;
  const n=_wrSessions(P.from,P.to).length;
  return n?{P,y,m,n}:null;
}
function wrapOfferHtml(day){
  const o=wrapOfferMonth();if(!o)return'';
  const r=_wrRecords(o.P).length;
  // (14e) En la cabecera de Inicio, bajo el saludo y en el sitio de la fecha (que vuelve al verla o quitarla): se ve al
  // abrir sin desplazar y no empuja «HOY TOCA» (ocupa lo que la fecha; los toques, 44 px, salen sobre el margen). Las
  // cifras (y el año, si es de otro) van para lectores de pantalla; a la vista, una línea: «dom 1 · Tu octubre ›» (14 r1).
  return`<div class="wro-s" id="wr-offer">${day?`<span class="wro-d">${esc(day)} ·</span>`:''}
    <button type="button" class="wro-main" onclick="wrapOfferOpen(this)">
      <span class="wro-pill">${_wrLogoSvg('wro-logo')}<span class="wro-t"><span class="sr-only">Nuevo resumen: tu ${esc(o.P.name)}${o.P.label!==o.P.name?' de '+o.y:''} · ${plural(o.n,'sesión','sesiones')}${r?` · ${plural(r,'récord')}`:''}</span><span aria-hidden="true">Tu ${esc(o.P.name)}</span></span><span class="wro-go" aria-hidden="true">›</span></span>
    </button>
    <button type="button" class="wro-x" onclick="wrapOfferDismiss()" aria-label="Ocultar el resumen de ${esc(o.P.label)}">${_wrXSvg}</button>
  </div>`;
}
function wrapOfferOpen(el){
  const o=wrapOfferMonth();if(!o){render();return false;}
  S.wrapMonthSeen=o.P.key;saveState();
  try{if(el&&el.focus)el.focus({preventScroll:true});}catch(e){}
  const ok=openWrapped({kind:'month',y:o.y,m:o.m},{onClose:()=>{render();_wrRefocus();toast(`Tu ${o.P.label} sigue en Progreso`,2600);}});
  if(!ok){render();_wrRefocus();}
  return ok;
}
function wrapOfferDismiss(){
  const o=wrapOfferMonth();if(o){S.wrapMonthSeen=o.P.key;saveState();}
  render();_wrRefocus();
  if(o)toast(`Vale · tu ${o.P.label} sigue en Progreso`,2600);
}
// Coach: el ciclo recién cerrado (hasta 14 días), una vez. Va justo encima de la recomendación de descarga (etapa 13),
// que no se toca; si el Coach dejó propuestas, la tarjeta lleva también el atajo a ellas.
function wrapCycleOffer(){
  const n=Array.isArray(S.mesocycles)?S.mesocycles.filter(_isPlainObj).length:0;
  if(!n||n<=(Number.isInteger(S.wrapCycleSeen)?S.wrapCycleSeen:n))return null;
  const P=wrapPeriod({kind:'cycle',n});if(!P||Date.now()-P.to>WR_CYCLE_DAYS*DAY_MS)return null;
  const k=_wrSessions(P.from,P.to).length;
  return k?{P,n,k}:null;
}
function wrapCycleOfferHtml(np){
  const o=wrapCycleOffer();if(!o)return'';
  return`<div class="wro wro-c" id="wr-cyc" role="region" aria-labelledby="wr-cyc-t">
    <div class="wro-row">
      ${_wrLogoSvg('wro-logo')}
      <div class="wro-t" id="wr-cyc-t"><span class="wro-k">Ciclo cerrado</span>Tu ciclo ${o.n}, en un resumen<small>${plural(o.k,'sesión','sesiones')} en ${plural(o.P.weeks,'semana')} · récords, lo que más mejoró y más</small></div>
      <button type="button" class="wro-x" onclick="wrapCycleDismiss()" aria-label="Ocultar el resumen del ciclo ${o.n}">${_wrXSvg}</button>
    </div>
    <div class="wro-acts"><button type="button" class="btn bp" onclick="wrapCycleOpen(this)">Ver tu ciclo</button>${np>0?`<button type="button" class="btn bs" onclick="goCoachProposals()">${np===1?'1 propuesta':np+' propuestas'} ›</button>`:''}</div>
  </div>`;
}
function wrapCycleOpen(el){
  const o=wrapCycleOffer();if(!o){render();return false;}
  S.wrapCycleSeen=o.n;saveState();
  try{if(el&&el.focus)el.focus({preventScroll:true});}catch(e){}
  const ok=openWrapped({kind:'cycle',n:o.n},{onClose:()=>{render();_wrRefocus();toast(`Tu ciclo ${o.n} sigue en «Ciclos anteriores»`,2600);}});
  if(!ok){render();_wrRefocus();}
  return ok;
}
function wrapCycleDismiss(){
  const o=wrapCycleOffer();if(o){S.wrapCycleSeen=o.n;saveState();}
  render();_wrRefocus();
  if(o)toast(`Vale · tu ciclo ${o.n} sigue en «Ciclos anteriores»`,2600);
}
// «Ciclos anteriores» del Coach: cada ciclo cerrado con sesiones abre su resumen
function _wrCycleBtn(n){
  const P=wrapPeriod({kind:'cycle',n});
  if(!P||!_wrSessions(P.from,P.to).length)return'';
  return`<button type="button" class="wrp-chip mlog-go" onclick="wrapOpenCycle(${n},this)" aria-label="Ver el resumen del ciclo ${n}">Ver resumen ›</button>`;
}

