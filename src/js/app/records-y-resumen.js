// ══════════════════════════════════════════════════════════
// RÉCORDS PERSONALES Y RESUMEN DE SESIÓN (09)
// ══════════════════════════════════════════════════════════
// Récords por ejercicio con las series de cada registro (rec.sets, v18) o, en los antiguos, su peso × reps (v×r):
//  · peso: más kilos que nunca (con cualquier nº de reps);
//  · reps: más reps que cualquier serie anterior con ese peso o más (ninguna anterior la «supera» en peso y reps);
//  · 1RM estimado (Epley, el mismo del Coach: peso × (1 + reps/30)): se muestra siempre y eUp dice si lo superas.
//    Un 1RM estimado nuevo siempre es también un récord de peso o de reps.
// Solo hay récord si el ejercicio ya tenía historial (la primera vez no cuenta), y una serie igual a otra anterior de la
// misma sesión no cuenta dos veces. Todo se calcula al momento desde S.strength y las series de hoy: no hay datos nuevos
// que guardar (ni migración). Un registro sin series hechas (setsDone 0: peso escrito sin marcar nada) no cuenta.
const PR_EPS=0.01,PR_HAPTIC=[30,50,30,50,110];
function prE1rm(w,r){w=+w;r=+r;return w>0&&r>=1&&isFinite(w)&&isFinite(r)?w*(1+Math.min(r,30)/30):0;}
function prKg(v){return kgTxt(Math.round(v*2)/2);} // 1RM estimado redondeado a 0.5 kg
// Series de un registro: [{w, r}] (r null si no se apuntaron); formato antiguo: una «serie» con su v×r
function prRecSets(rec){
  if(!rec||typeof rec!=='object')return[];
  if(Array.isArray(rec.sets)){
    const out=[];
    rec.sets.forEach(s=>{if(!s||typeof s!=='object')return;const w=_setNumW(s.w);if(w!=null)out.push({w,r:_setNumR(s.r)});});
    if(out.length)return out;
  }
  if(rec.setsDone!=null&&parseInt(rec.setsDone)===0)return[];
  const w=_setNumW(rec.v);
  return w!=null?[{w,r:_setNumR(rec.r)}]:[];
}
// Récords sin kilos: más reps (peso corporal, solo reps), más tiempo o más distancia, en las series SIN peso (las de
// peso siguen en los de kg). Tipo xr / xt / xd según el tipo del registro. Con bandas no hay (no se apunta qué banda era:
// volver a una más suave daría un récord falso). Como en los de kg, la primera sesión no cuenta.
function _prXType(lt){return lt==='t'?'xt':lt==='d'?'xd':'xr';}
// Medidas sin peso de un registro: [{val}] (reps, segundos o metros); los antiguos sin series, la del registro
function prRecSetsX(rec){
  if(!rec||typeof rec!=='object')return[];
  const lt=_recLT(rec);if(lt==='w')return[];
  const val=s=>lt==='t'?_setNumT(s.t):lt==='d'?_setNumD(s.d):_setNumR(s.r);
  if(Array.isArray(rec.sets)&&rec.sets.some(s=>s&&typeof s==='object')){
    const out=[];
    rec.sets.forEach(s=>{if(!s||typeof s!=='object'||_setNumW(s.w)!=null)return;const v=val(s);if(v!=null)out.push({val:v});});
    return out;
  }
  if((rec.setsDone!=null&&parseInt(rec.setsDone)===0)||+rec.v>0)return[];
  const v=_recMetric(rec,lt);return v!=null?[{val:v}]:[];
}
function _prPushX(st,v,m){if(v>st.best){st.best=v;st.ref={val:v,d:m&&m.d||'',ts:m&&m.ts!=null?m.ts:null};}}
// Mejor marca sin peso de un ejercicio en registros de ese tipo (reps, tiempo o distancia) anteriores a beforeTs
function prBaseX(exId,lt,beforeTs){
  const st={n:0,best:0,ref:null},ty=_prXType(lt),arr=S.strength&&Array.isArray(S.strength[exId])?S.strength[exId]:[];
  const lim=beforeTs!=null&&isFinite(+beforeTs)?+beforeTs:null;
  arr.forEach(rec=>{
    if(!rec||typeof rec!=='object'||_recLT(rec)==='w'||_prXType(_recLT(rec))!==ty)return;
    const ts=+rec.ts;if(lim!=null&&isFinite(ts)&&ts>=lim)return;
    const xs=prRecSetsX(rec);if(!xs.length)return;
    st.n++;const m={d:typeof rec.d==='string'?rec.d.slice(0,20):'',ts:isFinite(ts)?ts:null};
    xs.forEach(x=>_prPushX(st,x.val,m));
  });
  return st;
}
// ¿Es val (reps, s o m sin peso) un récord frente a st? {type:'xr'|'xt'|'xd', val, prev} o null
function prJudgeX(st,val,lt){
  if(!st||!st.n||!(val>0))return null;
  return val>st.best+(lt==='t'||lt==='d'?0.5:0)?{type:_prXType(lt),val,prev:st.ref}:null;
}
// Pista sin peso para la siguiente serie: {kind:'x', lt, need, plan, ok}; nada si está lejos (+2 reps, +15 s / m)
function prHintX(st,v,lt,ex){
  if(!st||!st.n)return null;
  const need=st.best+1,plan=v>0?v:lt==='t'?_tgtSecs(ex):lt==='d'?_tgtMetres(ex):targetRepsNum(ex);
  if(plan==null||need>plan+(lt==='t'||lt==='d'?15:2))return null;
  return{kind:'x',lt,need,plan,ok:plan>=need};
}
// Con bandas no hay récords sin peso (ver arriba). Tampoco en «solo reps» con una máquina o polea (dominadas o fondos
// asistidos): la asistencia es regulable y no se apunta, y con más ayuda saldrían reps «récord» falsas
const PR_NOX_ASSIST=new Set(['maq','maqA','polea']);
function _prNoX(ex){if(!ex||exLT(ex)==='w'||ex.cardio)return true;const c=loadEqClass(ex);return c==='banda'||(exLT(ex)==='r'&&PR_NOX_ASSIST.has(c));}
function _prNew(){return{n:0,maxW:0,wRef:null,maxE:0,eRef:null,front:[]};}
// Añade una serie: peso máximo (con sus mejores reps), mejor 1RM estimado y el «frente» de series que ninguna otra
// supera a la vez en peso y en reps (con él se decide si unas reps con un peso son récord)
function _prPush(st,w,r,meta){
  if(!(w>0))return;
  r=r>0?r:null;
  const m=meta||{},ref=()=>({w,r,d:m.d||'',ts:m.ts==null?null:m.ts});
  if(w>st.maxW+PR_EPS||(Math.abs(w-st.maxW)<=PR_EPS&&r&&(!st.wRef||!st.wRef.r||r>st.wRef.r))){st.maxW=Math.max(st.maxW,w);st.wRef=ref();}
  const e=prE1rm(w,r);
  if(e>st.maxE){st.maxE=e;st.eRef=ref();}
  if(r&&!st.front.some(p=>p.w>=w-PR_EPS&&p.r>=r)){
    st.front=st.front.filter(p=>!(w>=p.w-PR_EPS&&r>=p.r));
    st.front.push(ref());
  }
}
// Récords de un ejercicio con sus registros anteriores a beforeTs (todos si no se indica). n = registros contados.
function prBase(exId,beforeTs){
  const st=_prNew(),arr=S.strength&&Array.isArray(S.strength[exId])?S.strength[exId]:[];
  const lim=beforeTs!=null&&isFinite(+beforeTs)?+beforeTs:null;
  arr.forEach(rec=>{
    if(!rec||typeof rec!=='object')return;
    const ts=+rec.ts;
    if(lim!=null&&isFinite(ts)&&ts>=lim)return;
    const sets=prRecSets(rec);if(!sets.length)return;
    st.n++;
    const meta={d:typeof rec.d==='string'?rec.d.slice(0,20):'',ts:isFinite(ts)?ts:null};
    sets.forEach(s=>_prPush(st,s.w,s.r,meta));
  });
  return st;
}
// ¿Es (w, r) un récord frente a st? null si no. Si sí: {type:'w' (peso) | 'r' (reps con ese peso o más), w, r,
// e1 (1RM estimado), eUp (supera tu 1RM estimado), prev (lo que había: tu serie de más peso, o la de más reps)}
function prJudge(st,w,r){
  if(!st||!st.n||!(w>0))return null;
  r=r>0?r:null;
  const e1=prE1rm(w,r),eUp=e1>st.maxE+0.05;
  if(w>st.maxW+PR_EPS)return{type:'w',w,r,e1,eUp,prev:st.wRef};
  if(!r)return null;
  let best=null;
  for(const p of st.front){
    if(p.w<w-PR_EPS)continue;
    if(p.r>=r)return null; // ya hiciste estas reps (o más) con este peso o más
    if(!best||p.r>best.r||(p.r===best.r&&p.w<best.w))best=p;
  }
  return best?{type:'r',w,r,e1,eUp,prev:best}:null;
}
// Pista antes de una serie con peso w y reps r previstas: {kind:'w'} (récord de peso si la completas) o {kind:'r',
// need (reps para el récord), plan, ok (lo previsto ya lo bate)}. null si no hay historial o está lejos (>2 reps).
function prHint(st,w,r,ex){
  if(!st||!st.n||!(w>0))return null;
  if(w>st.maxW+PR_EPS)return{kind:'w',w};
  let best=null;
  for(const p of st.front)if(p.w>=w-PR_EPS&&(!best||p.r>best.r))best=p;
  if(!best)return null;
  const need=best.r+1,plan=r>0?r:(targetRepsNum(ex)||null);
  if(need>SET_MAX_R||plan==null||need>plan+2)return null;
  return{kind:'r',need,plan,ok:plan>=need,w,prev:best};
}
function prHintTxt(h){
  if(!h)return'';
  if(h.kind==='w')return'🏆 Récord de peso si la completas';
  if(h.kind==='x'){
    if(h.lt==='t')return h.ok?`🏆 Desde ${fmtSecs(h.need)}: nuevo récord`:`🏆 Aguanta ${fmtSecs(h.need)} para nuevo récord`;
    if(h.lt==='d')return h.ok?`🏆 Desde ${fmtM(h.need)}: nuevo récord`:`🏆 Llega a ${fmtM(h.need)} para nuevo récord`;
  }
  return h.ok?`🏆 Desde ${h.need} reps: nuevo récord`:`🏆 Haz ${h.need} reps para nuevo récord`;
}
// «60 kg × 10 · 1RM est. 80 kg» · sin peso: «15 reps», «1:05 min», «40 m»
function _prXTxt(type,v){return type==='xt'?fmtSecs(v):type==='xd'?fmtM(v):_repsNB(v);}
function prTxt(j){return j.val!=null?_prXTxt(j.type,j.val):`${kgTxt(j.w)} kg${j.r?` × ${j.r} · 1RM est. ${prKg(j.e1)} kg`:''}`;}
function prToastTxt(j){return`🏆 ${j.type==='w'?'Récord de peso':'Récord'}: ${prTxt(j)}`;}
function prPrevTxt(j){const p=j&&j.prev;return !p?'':j.val!=null?`antes ${_prXTxt(j.type,p.val)}`:`antes ${kgTxt(p.w)}${p.r?' × '+p.r:' kg'}`;}
function prKindTxt(j){return j.type==='w'?'Peso':j.type==='xt'?'Tiempo':j.type==='xd'?'Distancia':'Reps';}
// El mejor de dos récords: el de peso antes que el de reps (con peso) y estos antes que los de sin peso; si no, el de más
// 1RM estimado (o más peso), o la mayor marca sin peso
const PR_RANK={w:3,r:2,xr:1,xt:1,xd:1};
function _prBetter(a,b){const ra=PR_RANK[a.type]||0,rb=PR_RANK[b.type]||0;if(ra!==rb)return ra>rb;
  if(a.val!=null||b.val!=null)return(+a.val||0)>(+b.val||0);
  return a.e1>b.e1+1e-9||(Math.abs(a.e1-b.e1)<=1e-9&&a.w>b.w);}
// Récords en el entreno de hoy de un ejercicio: cada serie hecha (en su orden) frente a tu historial —el anterior a la
// sesión reabierta, si lo es— y a las series de hoy de antes, más la pista de la siguiente. {flags:{i: récord}, hint, next}
function prLive(ex,rows){
  const out={flags:{},hint:null,next:-1};
  if(!ex||ex.cardio||!ex.id)return out;
  const rs=reopenedFor(S.day),bts=rs?rs.session.ts:null;
  const st=prBase(ex.id,bts);
  // Sin peso (reps, tiempo, distancia): su propia marca; las series con peso van con los récords de kg
  const lt=exLT(ex),sx=_prNoX(ex)?null:prBaseX(ex.id,lt,bts),xv=r=>lt==='t'?r.t:lt==='d'?r.d:r.r;
  if(!st.n&&!(sx&&sx.n))return out;
  const rr=rows||setRows(ex);
  rr.forEach(r=>{
    if(!r.done)return;
    if(r.w>0){if(st.n){const j=prJudge(st,r.w,r.r);if(j)out.flags[r.i]=j;_prPush(st,r.w,r.r,{d:'hoy'});}}
    else if(sx&&sx.n){const v=xv(r);if(v>0){const j=prJudgeX(sx,v,lt);if(j)out.flags[r.i]=j;_prPushX(sx,v,{d:'hoy'});}}
  });
  const nx=rr.find(r=>!r.done);
  // (13 r1) En descarga o semana de descanso no se empuja a batir récords (nada de «Haz 13 reps»): toca ir suave
  if(nx){out.next=nx.i;out.hint=isLightNow(ex.id)?null:nx.w>0||!sx?(st.n?prHint(st,nx.w,nx.r,ex):null):prHintX(sx,xv(nx),lt,ex);}
  return out;
}
// ── Celebración al confirmar una serie que bate un récord ──
function _prVisible(el){
  if(!el||!el.isConnected)return false;
  const r=el.getBoundingClientRect();
  return r.width>0&&r.height>0&&r.bottom>0&&r.top<(window.innerHeight||0);
}
// Color hex de la paleta (:root) para el canvas; t>0 lo aclara hacia blanco y t<0 lo oscurece hacia negro
function paletteHex(v,fb,t){let h=fb;try{const x=getComputedStyle(document.documentElement).getPropertyValue(v).trim();if(/^#[0-9a-f]{6}$/i.test(x))h=x;}catch(e){}
  if(!t)return h;const n=parseInt(h.slice(1),16),to=t>0?255:0,k=Math.abs(t);
  return'rgb('+[16,8,0].map(b=>Math.round(((n>>b)&255)*(1-k)+to*k)).join(',')+')';}
// Estallido corto de partículas del color de récord (canvas fijo encima de todo, sin tocar nada). Con movimiento reducido, nada.
let _prBursts=0;
function prBurst(el){
  if(_rm())return false;
  let cx=(window.innerWidth||390)/2,cy=Math.min((window.innerHeight||800)*.3,240);
  if(el&&_prVisible(el)){const b=el.getBoundingClientRect();cx=b.left+b.width/2;cy=b.top+b.height/2;}
  const SZ=240,c=document.createElement('canvas'),dpr=Math.min(2,window.devicePixelRatio||1);
  let g=null;try{g=c.getContext('2d');}catch(e){}
  if(!g)return false;
  c.className='pr-burst';c.width=Math.round(SZ*dpr);c.height=Math.round(SZ*dpr);
  // el lienzo no sale de la pantalla (sin desbordes laterales): el centro del estallido se desplaza dentro de él
  const vw=document.documentElement.clientWidth||window.innerWidth||390,vh=window.innerHeight||800;
  const left=Math.round(Math.max(0,Math.min(vw-SZ,cx-SZ/2))),top=Math.round(Math.max(0,Math.min(vh-SZ,cy-SZ/2)));
  const ox=cx-left,oy=cy-top;
  c.style.left=left+'px';c.style.top=top+'px';
  c.setAttribute('aria-hidden','true');
  document.body.appendChild(c);
  g.scale(dpr,dpr);
  const pr=paletteHex('--pr','#ff8a65'),cols=[pr,paletteHex('--pr',pr,.45),paletteHex('--pr',pr,-.18),paletteHex('--pr',pr,.8),paletteHex('--amber','#ffb547'),paletteHex('--green','#4fe3c1')],N=30,P=[];
  for(let k=0;k<N;k++){const a=k/N*Math.PI*2+Math.random()*.5,v=80+Math.random()*120;P.push({vx:Math.cos(a)*v,vy:Math.sin(a)*v-50,s:1.8+Math.random()*2.6,c:cols[k%cols.length],rot:Math.random()*6.3,sq:k%3===0});}
  const T=850,t0=performance.now();let done=false;
  const end=()=>{if(done)return;done=true;try{c.remove();}catch(e){}};
  const frame=now=>{
    if(done)return;
    const t=Math.max(0,Math.min(1,(now-t0)/T)),s=t*T/1000;
    g.clearRect(0,0,SZ,SZ);
    if(t<.4){g.globalAlpha=(1-t/.4)*.6;g.strokeStyle=pr;g.lineWidth=3;g.beginPath();g.arc(ox,oy,12+t*150,0,Math.PI*2);g.stroke();}
    g.globalAlpha=Math.max(0,1-t*t);
    P.forEach(p=>{
      const x=ox+p.vx*s,y=oy+p.vy*s+320*s*s;g.fillStyle=p.c;
      if(p.sq){g.save();g.translate(x,y);g.rotate(p.rot+s*9);g.fillRect(-p.s,-p.s*.45,p.s*2,p.s*.9);g.restore();}
      else{g.beginPath();g.arc(x,y,p.s*(1-t*.45),0,Math.PI*2);g.fill();}
    });
    g.globalAlpha=1;
    if(t<1)requestAnimationFrame(frame);else end();
  };
  requestAnimationFrame(frame);
  setTimeout(end,T+500); // por si el navegador no da fotogramas (segundo plano)
  _prBursts++;
  return true;
}
// ✓ dorado (lo pinta setRowsHtml), un pequeño salto del botón, partículas desde el botón que marcó la serie (fila, barra
// «siguiente serie» o modo descanso) y un patrón de vibración propio
function prCelebrate(exId,i,src){
  const card=_openCard(exId),row=card&&card.querySelector(`.lg-row[data-set="${i}"] .lg-ck`);
  const nb=document.getElementById('nb-go'),rf=document.getElementById('rf-go');
  const cands=src==='full'?[rf,row,nb]:src==='bar'?[nb,row]:[row,nb];
  const el=cands.find(_prVisible)||null;
  if(row){row.classList.add('pr-pop');setTimeout(()=>{try{row.classList.remove('pr-pop');}catch(e){}},700);}
  haptic(PR_HAPTIC);
  return prBurst(el);
}
// Todos tus récords: uno por ejercicio y sesión (el mejor de sus series), del más reciente al más antiguo:
// list [{id, k (índice del registro), ts, d, type, w, r, e1, eUp, prev}] y byEx[id] = {flags (por índice), maxW, maxE, eRef}.
// Se recalcula solo si cambian los registros (huella barata: nº de registros y el último de cada ejercicio).
let _prAllCache={sig:null,list:[],byEx:{}};
function _prSig(){
  const st=_isPlainObj(S.strength)?S.strength:{};
  return Object.keys(st).map(id=>{const a=st[id];if(!Array.isArray(a))return id;const l=a[a.length-1]||{};
    return id+':'+a.length+':'+(l.ts||'')+':'+(l.v||'')+':'+(l.r||'')+':'+(l.setsDone==null?'':l.setsDone)+':'+(Array.isArray(l.sets)?JSON.stringify(l.sets).length:'')+':'+(l.t||'')+':'+(l.m||'')+':'+(l.lt||'');}).join('|');
}
function prAll(){
  const sig=_prSig();
  if(_prAllCache.sig===sig)return _prAllCache;
  const st=_isPlainObj(S.strength)?S.strength:{},list=[],byEx={};
  const tsOf=r=>isFinite(+r.ts)?+r.ts:-Infinity;
  Object.keys(st).forEach(id=>{
    const a=st[id];if(!Array.isArray(a))return;
    const ord=a.map((rec,k)=>({rec,k})).filter(x=>x.rec&&typeof x.rec==='object');
    ord.sort((x,y)=>(tsOf(x.rec)-tsOf(y.rec))||x.k-y.k);
    const base=_prNew(),flags=new Array(a.length).fill(null),noX=_prNoX(findExInPlan(id)||_mmExOf(id)),bx={};
    let xLast=null;
    ord.forEach(({rec,k})=>{
      const sets=prRecSets(rec),xs=noX?[]:prRecSetsX(rec);if(!sets.length&&!xs.length)return;
      const meta={d:typeof rec.d==='string'?rec.d.slice(0,20):'',ts:isFinite(+rec.ts)?+rec.ts:null};
      // cada serie frente a lo de ANTES de esta sesión (el «antes» que se muestra); el mejor récord de la sesión
      let best=null;
      if(sets.length){
        if(base.n)sets.forEach(s=>{const j=prJudge(base,s.w,s.r);if(j&&(!best||_prBetter(j,best)))best=j;});
        sets.forEach(s=>_prPush(base,s.w,s.r,meta));
        base.n++;
      }
      if(xs.length){
        const lt=_recLT(rec),ty=_prXType(lt),sb=bx[ty]||(bx[ty]={n:0,best:0,ref:null});
        if(sb.n)xs.forEach(x=>{const j=prJudgeX(sb,x.val,lt);if(j&&(!best||_prBetter(j,best)))best=j;});
        xs.forEach(x=>_prPushX(sb,x.val,meta));
        sb.n++;xLast=ty;
      }
      if(best){const it=Object.assign({id,k,ts:meta.ts,d:meta.d},best);flags[k]=it;list.push(it);}
    });
    // Récords de registros antiguos sin ts: dts = el día de su fecha escrita (_histTs, est 1; la misma regla que _progSrc
    // para el Coach), para que «Récord reciente» los vea también tras importar una copia antigua. ts sigue null.
    if(flags.some(f=>f&&f.ts==null)){const t=_histTs(a);flags.forEach((f,k)=>{if(f&&f.ts==null&&t.est&&t.est[k]===1)f.dts=t[k];});}
    byEx[id]={flags,maxW:base.maxW,wRef:base.wRef,maxE:base.maxE,eRef:base.eRef};
    if(xLast)Object.assign(byEx[id],{xType:xLast,bestX:bx[xLast].best,xRef:bx[xLast].ref});
  });
  list.sort((x,y)=>(y.ts||0)-(x.ts||0));
  _prAllCache={sig,list,byEx};
  return _prAllCache;
}
// Récords de cada sesión (ts → nº de ejercicios con récord)
function prBySession(){const m={};prAll().list.forEach(x=>{if(x.ts!=null)m[x.ts]=(m[x.ts]||0)+1;});return m;}

// ── Muro de récords (Progreso) ──
let _prWallAll=false; // «Ver más» (solo en memoria)
function prWallHtml(){
  const list=prAll().list;
  if(!list.length)return`<div class="card pr-wall" id="pr-wall"><div class="pr-empty">${(S.sessions||[]).length
    ?'Aún sin récords. Cuando superes tu mejor marca en un ejercicio (más peso, más reps con ese peso o, sin peso, más reps, tiempo o distancia), aparecerá aquí.'
    :'Completa entrenamientos y aquí irán apareciendo tus récords personales.'}</div></div>`;
  const now=new Date(),m0=new Date(now.getFullYear(),now.getMonth(),1).getTime();
  const month=list.filter(x=>x.ts!=null&&x.ts>=m0).length,max=Math.min(20,list.length);
  const shown=list.slice(0,_prWallAll?max:5);
  return`<div class="card pr-wall" id="pr-wall">
    <div class="pr-wall-h"><div class="pr-wall-n"><b>${month}</b> ${month===1?'récord':'récords'} este mes</div><div class="pr-wall-t">${list.length} en total</div></div>
    ${shown.map(x=>{
      const has=x.ts!=null&&!!findSession(x.ts),pv=prPrevTxt(x),nm=exDisplayName(x.id);
      return`<button type="button" class="pr-row" data-ts="${has?x.ts:''}" data-ex="${esc(x.id)}" onclick="prWallOpen(this)" aria-label="Récord de ${esc(prKindTxt(x).toLowerCase())} en ${esc(nm)}: ${esc(prTxt(x))}${pv?', '+esc(pv):''}${x.d?', '+esc(x.d):''}. ${has?'Ver la sesión':'Ver el historial'}">
        <span class="pr-ic" aria-hidden="true">${ic('trophy')}</span>
        <span class="pr-i"><span class="pr-nm">${esc(nm)}</span><span class="pr-v">${x.val!=null?_nwUnits(esc(prTxt(x))):`<span class="nw">${esc(kgTxt(x.w))} kg</span>${x.r?' × '+x.r:''}`}${pv?` <i>(${_nwPrev(pv)})</i>`:''}</span></span>
        <span class="pr-d">${esc(x.d||'')}<small>${prKindTxt(x)}</small></span></button>`;}).join('')}
    ${list.length>5?`<button type="button" class="pr-more" onclick="prWallToggle()">${_prWallAll?'Ver menos':`Ver más (${max-5})`}</button>`:''}
  </div>`;
}
function prWallOpen(b){const ts=+(b&&b.dataset.ts);if(ts&&openSessionSummary(ts))return;if(b&&b.dataset.ex)openHist(b.dataset.ex);}
function prWallToggle(){_prWallAll=!_prWallAll;const el=document.getElementById('pr-wall');if(el)el.outerHTML=prWallHtml();else render();}

// ── Resumen de una sesión (al guardar y al tocar una sesión pasada en Inicio, el historial o los récords) ──
// Registros de una sesión: los de su mismo ts (así se guardan siempre); si no hay ninguno (datos importados o editados),
// el último de ese mismo día de cada ejercicio de ese día de la rutina (que no sea de otra sesión)
function _sessRecs(s){
  const ts=+s.ts,st=_isPlainObj(S.strength)?S.strength:{},out=[];
  if(!isFinite(ts))return out;
  Object.keys(st).forEach(id=>{const a=st[id];if(Array.isArray(a))a.forEach(r=>{if(r&&typeof r==='object'&&+r.ts===ts)out.push({id,rec:r});});});
  if(out.length)return out;
  const other=new Set((S.sessions||[]).filter(x=>x&&x!==s).map(x=>+x.ts));
  Object.keys(st).forEach(id=>{
    const a=st[id];if(!Array.isArray(a)||exDayOf(id)!==s.day)return;
    let last=null;a.forEach(r=>{if(r&&typeof r==='object'&&isFinite(+r.ts)&&!other.has(+r.ts)&&sameDayTs(+r.ts,ts))last=r;});
    if(last)out.push({id,rec:last});
  });
  return out;
}
// Series de un registro para el resumen: [{w, r, rpe (1-3; 0 sin dato)}]. Antiguo (sin sus series): setsDone series
// iguales (v×r) con el esfuerzo medio de ese ejercicio (old:true).
// (y sus segundos t o metros d, si los tienen: por tiempo o distancia)
function _sumRecSets(rec,ex){
  const own=Array.isArray(rec.sets)?rec.sets.filter(x=>x&&typeof x==='object'):[];
  const td=(o,t,d)=>{if(t!=null)o.t=t;if(d!=null)o.d=d;return o;};
  if(own.some(x=>_setNumW(x.w)!=null||_setNumR(x.r)!=null||_setNumT(x.t)!=null||_setNumD(x.d)!=null))
    return{old:false,list:own.map(x=>td({w:_setNumW(x.w),r:_setNumR(x.r),rpe:[1,2,3].includes(+x.rpe)?+x.rpe:0},_setNumT(x.t),_setNumD(x.d)))};
  const n=_mmSetsOf(rec,ex),w=_setNumW(rec.v),r=_setNumR(rec.r),c=rpeCat(rec.rpe)||0;
  return{old:true,list:Array.from({length:n},()=>td({w,r,rpe:c},_setNumT(rec.t),_setNumD(rec.m)))};
}
// Serie que cuenta para el tonelaje: con peso y no por tiempo o distancia (un paseo con 20 kg no suma «kg × reps»)
function _kgSet(x){return x.w>0&&x.t==null&&x.d==null;}
function _tonOf(list){let t=0;list.forEach(x=>{if(x.w>0&&x.r>0)t+=x.w*x.r;});return t;}
// Tonelaje de una sesión (kg × reps de cada serie)
function sessTonnage(s){let t=0;_sessRecs(s).forEach(({id,rec})=>{t+=_tonOf(_sumRecSets(rec,findExInPlan(id)||_mmExOf(id)).list);});return Math.round(t);}
// (E1b) el mismo día por su id (sessSameDay): tras quitar un día y correr las letras no se compara con otro
function _prevSameDay(s){let b=null;(S.sessions||[]).forEach(x=>{if(x&&x!==s&&sessSameDay(x,s)&&isFinite(+x.ts)&&+x.ts<+s.ts&&(!b||+x.ts>+b.ts))b=x;});return b;}
// Último registro de un ejercicio anterior a ts (con peso y series hechas; con xlt, uno sin peso de ese tipo de medida)
function _prevRecOf(id,ts,xlt){
  const a=S.strength&&S.strength[id];let p=null;
  const ok=r=>xlt?_recLT(r)!=='w'&&_prXType(_recLT(r))===_prXType(xlt)&&prRecSetsX(r).length>0:prRecSets(r).length>0;
  if(Array.isArray(a))a.forEach(r=>{if(r&&typeof r==='object'&&isFinite(+r.ts)&&+r.ts<ts&&ok(r)&&(!p||+r.ts>=+p.ts))p=r;});
  return p;
}
// Peso de referencia de unas series (el máximo) y las reps más bajas con ese peso (como el registro: v y r)
function _sumTop(list){
  const ws=list.map(x=>x.w).filter(w=>w>0);if(!ws.length)return null;
  const w=Math.max(...ws),rr=list.filter(x=>x.w!=null&&Math.abs(x.w-w)<PR_EPS&&x.r>0).map(x=>x.r);
  return{w,r:rr.length?Math.min(...rr):null};
}
// «55×12×3» si todas las series son iguales; si no, «57.5×12 · 57.5×11 · 55×12» (por tiempo: «3 series · 45 s»)
function _sumLine(list){
  const t=x=>x.t!=null||x.d!=null?(x.w!=null?_kgNB(x.w)+NBD:'')+(x.t!=null?fmtSecs(x.t):fmtM(x.d)):x.w!=null?kgTxt(x.w)+(x.r!=null?'×'+x.r:' kg'):(x.r!=null?x.r+' reps':'');
  const a=list.map(t);
  if(!a.some(Boolean))return plural(list.length,'serie');
  if(a.every(x=>x===a[0]))return list[0].w!=null&&list[0].r!=null?`${a[0]}×${list.length}`:`${plural(list.length,'serie')} · ${a[0]}`;
  return a.map(x=>x||'—').join(_setsSep(list));
}
function _kgK(n){return String(Math.round(+n||0)).replace(/\B(?=(\d{3})+(?!\d))/g,' ');} // 5420 → «5 420»
// Todo lo que muestra el resumen de la sesión s
function sessSummaryData(s){
  const ts=+s.ts,plan=getPlan(),dayEx=plan[s.day]&&Array.isArray(plan[s.day].ex)?plan[s.day].ex:[];
  // (11) lo hecho «solo hoy» va en el sitio del ejercicio de tu rutina al que sustituyó (y lo dice)
  const subOf={};_cleanSessSubs(s.subs).forEach(x=>{subOf[x.alt]=x;});
  const ord=id=>{const o=subOf[id]?subOf[id].orig:null,k=dayEx.findIndex(e=>e&&(e.id===id||(o&&(e.id===o||(e.sub&&e.sub.orig&&e.sub.orig.id===o)))));return k<0?99:k;};
  const pairs=_sessRecs(s),rows=[],records=[],items=[],rpe={0:0,1:0,2:0,3:0};
  let ton=0,sets=0,old=false,kgSets=0;
  pairs.forEach(({id,rec})=>{
    const ex=findExInPlan(id)||_mmExOf(id),name=exDisplayName(id);
    const rs=_sumRecSets(rec,ex),list=rs.list;
    if(!list.length)return;
    if(rs.old)old=true;
    const t=_tonOf(list);ton+=t;sets+=list.length;kgSets+=list.filter(_kgSet).length;
    list.forEach(x=>{rpe[x.rpe||0]++;});
    // récord: el mejor de sus series frente a lo que había antes de esta sesión (lo mismo que el muro de récords)
    const base=prBase(id,ts);let best=null;
    if(base.n)list.forEach(x=>{if(!(x.w>0))return;const j=prJudge(base,x.w,x.r);if(j&&(!best||_prBetter(j,best)))best=j;});
    // sin peso (reps, tiempo, distancia): frente a su mejor marca anterior
    const xl=_recLT(rec),xOk=xl!=='w'&&!_prNoX(ex),xv=x=>xl==='t'?x.t:xl==='d'?x.d:x.r;
    if(xOk){const bx=prBaseX(id,xl,ts);if(bx.n)list.forEach(x=>{if(x.w>0)return;const v=xv(x);if(!(v>0))return;const j=prJudgeX(bx,v,xl);if(j&&(!best||_prBetter(j,best)))best=j;});}
    if(best)records.push(Object.assign({id,name},best));
    // frente a la vez anterior de ese ejercicio: el peso de referencia y, con el mismo peso, las reps; sin peso, su medida
    const top=_sumTop(list),prev=_prevRecOf(id,ts,top||xl==='w'?null:xl);let delta=null;
    const dwTxt=dw=>({cls:dw>0?'up':'dn',t:(dw>0?'↑+':'↓−')+kgTxt(Math.abs(dw)),a:`${dw>0?'subiste':'bajaste'} ${kgTxt(Math.abs(dw))} kg frente a la vez anterior`});
    if(!prev){
      // Sin vez anterior de esta medida, pero sí de la otra (primera vez con lastre tras sesiones sin peso, o al revés):
      // frente a aquella, por el peso (sin peso cuenta como 0 kg). «Nuevo» solo si nunca lo habías hecho.
      const po=xl!=='w'?_prevRecOf(id,ts,top?xl:null):null;
      const pw=po&&!top?((_sumTop(prRecSets(po))||{}).w||_setNumW(po.v)||0):0;
      delta=po&&top?dwTxt(top.w):po&&pw>0?dwTxt(-pw):{cls:'',t:'nuevo',a:'primera vez'};
    }else if(top){
      const pv=prRecSets(prev),pt=_sumTop(pv.map(x=>({w:x.w,r:x.r})))||{w:_setNumW(prev.v),r:_setNumR(prev.r)};
      const dw=_r2(top.w-pt.w);
      if(Math.abs(dw)>=PR_EPS)delta=dwTxt(dw);
      else{const dr=top.r!=null&&pt.r!=null?top.r-pt.r:0;
        // Con el mismo peso por tiempo o distancia (paseo, plancha con disco): los segundos o metros
        const tg=dr?null:_tdGain(rec,prev),tu=tg&&tg.lt==='t'?'s':'m';
        delta=dr?{cls:dr>0?'up':'dn',t:(dr>0?'↑+':'↓−')+plural(Math.abs(dr),'rep'),a:`${plural(Math.abs(dr),'rep')} ${dr>0?'más':'menos'} con el mismo peso`}
          :tg&&tg.v?{cls:tg.v>0?'up':'dn',t:(tg.v>0?'↑+':'↓−')+Math.abs(tg.v)+' '+tu,a:`${Math.abs(tg.v)} ${tu} ${tg.lt==='t'?'de tiempo':'de distancia'} ${tg.v>0?'más':'menos'} con el mismo peso`}
          :{cls:'',t:'=',a:'igual que la vez anterior'};}
    }else if(xl!=='w'){
      const a=_recMetric(rec,xl),b=_recMetric(prev,xl),dv=a!=null&&b!=null?a-b:0;
      const tx=v=>xl==='t'?v+' s':xl==='d'?v+' m':plural(v,'rep'),wd=xl==='t'?'de tiempo':xl==='d'?'de distancia':'';
      // Banda más dura (_bandUp): menos reps con más resistencia no es un retroceso
      delta=dv<0&&_bandUp(ex,prev,rec)?{cls:'band',t:'banda más dura',a:'banda más dura: menos reps con más resistencia, no un retroceso'}
        :dv?{cls:dv>0?'up':'dn',t:(dv>0?'↑+':'↓−')+tx(Math.abs(dv)),a:`${tx(Math.abs(dv))} ${wd?wd+' ':''}${dv>0?'más':'menos'} que la vez anterior`}:{cls:'',t:'=',a:'igual que la vez anterior'};
    }
    rows.push({id,name,line:_sumLine(list),n:list.length,pr:best,delta,dl:!!rec.dl,k:ord(id)});
    const mus=mmExMuscles(ex);if(mus)items.push({id,ex,mus,sets:list.length,name});
  });
  // Lo marcado sin registro de fuerza (peso corporal sin peso, cardio): del snapshot de la sesión
  const sn=s.snapshot&&_isPlainObj(s.snapshot.sets)?s.snapshot.sets:null;
  if(sn)Object.keys(sn).forEach(id=>{
    if(pairs.some(p=>p.id===id)||!_isPlainObj(sn[id]))return;
    const idx=Object.keys(sn[id]).filter(k=>sn[id][k]===true&&/^\d{1,2}$/.test(k)).slice(0,20);
    if(!idx.length)return;
    const ex=findExInPlan(id)||_mmExOf(id),name=exDisplayName(id);
    if(ex&&ex.cardio){rows.push({id,name,line:ex.r?String(ex.r).slice(0,40):'hecho',cardio:true,k:ord(id)});return;}
    const rp=_isPlainObj(s.snapshot.rpe)&&_isPlainObj(s.snapshot.rpe[id])?s.snapshot.rpe[id]:{};
    const lg=_isPlainObj(s.snapshot.logs)&&_isPlainObj(s.snapshot.logs[id])&&Array.isArray(s.snapshot.logs[id].sets)?s.snapshot.logs[id].sets:[];
    const list=idx.map(k=>{const e=_setEntry(lg[+k]),o={w:e?e.w:null,r:e?e.r:null,rpe:[1,2,3].includes(+rp[k])?+rp[k]:0};if(e&&e.t!=null)o.t=e.t;if(e&&e.d!=null)o.d=e.d;return o;});
    sets+=list.length;ton+=_tonOf(list);kgSets+=list.filter(_kgSet).length;list.forEach(x=>{rpe[x.rpe||0]++;});
    rows.push({id,name,line:_sumLine(list),n:list.length,bw:true,k:ord(id)});
    const mus=mmExMuscles(ex);if(mus)items.push({id,ex,mus,sets:list.length,name});
  });
  rows.forEach(r=>{if(subOf[r.id])r.sub=subOf[r.id].on||'';});
  rows.sort((a,b)=>a.k-b.k);
  records.sort((a,b)=>ord(a.id)-ord(b.id));
  const mm=_mmAggregate(items,1,{k:'sess',lbl:'esta sesión',per:'en esta sesión',weeks:1});
  const prevS=_prevSameDay(s);
  return{s,rows,records,ton:Math.round(ton),sets,rpe,old,mm,prev:prevS,prevTon:prevS?sessTonnage(prevS):0,kgSets};
}
let _sum=null,_sumData=null,_sumAnimT=null; // resumen abierto {ts, fresh} (solo en memoria, no en S)
function openSessionSummary(ts,o){
  ts=+ts;
  const s=isFinite(ts)?findSession(ts):null;if(!s)return false;
  closeSessionSummary();
  _sum={ts,fresh:!!(o&&o.fresh)};
  _renderSummary();
  return true;
}
function closeSessionSummary(){
  clearTimeout(_sumAnimT);
  const root=document.getElementById('summary-root');
  if(root&&root.firstElementChild){
    const f=root.querySelector('[data-sum-map]');
    if(f&&typeof GymAnim!=='undefined'&&GymAnim.unmount){try{GymAnim.unmount(f);}catch(e){}}
    root.innerHTML='';
  }
  _sum=null;_sumData=null;
}
// Desde render(): la hoja no se repinta (los contadores y el maniquí siguen); solo se cierra si su sesión ya no está
function renderSummary(){
  if(!_sum)return;
  if(!findSession(_sum.ts)||!document.getElementById('sum-sheet'))closeSessionSummary();
}
function _sumAgo(ts){
  const d=Math.round((_startOfDay(Date.now())-_startOfDay(+ts))/DAY_MS);
  return !isFinite(d)||d<0?'':d===0?' · hoy':d===1?' · ayer':` · hace ${d} días`;
}
function _renderSummary(){
  const root=document.getElementById('summary-root');if(!root||!_sum)return;
  const s=findSession(_sum.ts);if(!s){closeSessionSummary();return;}
  const D=sessSummaryData(s);_sumData=D;
  const fresh=_sum.fresh,anim=!_rm(),plan=getPlan();
  const dl=sessDayLbl(s),focus=sessDayFocus(s); // (E1b) el nombre y el foco con que se hizo
  const date=s.date?String(s.date):isFinite(+s.ts)?fmtDate(new Date(+s.ts)):'';
  const title=fresh?'¡Sesión completada!':`${dl} · ${date}`;
  const sub=fresh?[dl,focus,date].filter(Boolean).join(' · '):`${focus||'Sesión'}${_sumAgo(s.ts)}`;
  // Contadores (duración, series, tonelaje): suben de 0 a su valor (sin animación con movimiento reducido)
  const dur=+s.durationMin>0&&isFinite(+s.durationMin)?Math.round(+s.durationMin):null;
  const kpi=(lbl,val,unit,aria,fmt)=>`<div class="sum-k" role="group" aria-label="${esc(aria)}"><b class="sum-n"${val!=null?` data-to="${val}"${fmt?` data-fmt="${fmt}"`:''}`:''} aria-hidden="true">${val==null?'—':fmt==='k'?_kgK(val):val}</b>${unit&&val!=null?`<span aria-hidden="true">${unit}</span>`:''}<small aria-hidden="true">${lbl}</small></div>`;
  const kpis=`<div class="sum-kpis">${kpi('Duración',dur,'min',dur!=null?`Duración: ${dur} minutos`:'Duración: sin dato')}${kpi('Series',D.sets,'',`Series: ${D.sets}`)}${D.kgSets||!D.sets?kpi('Tonelaje',D.ton,'kg',`Tonelaje: ${_kgK(D.ton)} kilos`,'k'):kpi('Tonelaje',null,'','Tonelaje: sin peso')}</div>`;
  // Frente a la última sesión del mismo día de la rutina
  let cmp='';
  if(D.prev&&D.prevTon>0&&D.ton>0){
    const pct=Math.round((D.ton-D.prevTon)/D.prevTon*100),cls=pct>0?'up':pct<0?'dn':'eq';
    const pd=D.prev.date?String(D.prev.date):fmtDate(new Date(+D.prev.ts)),mx=Math.max(D.ton,D.prevTon);
    const t=pct>0?`▲ +${pct} % de volumen frente al ${pd}`:pct<0?`▼ −${Math.abs(pct)} % de volumen frente al ${pd}`:`= Mismo volumen que el ${pd}`;
    cmp=`<div class="sum-cmp ${cls}" id="sum-cmp"><div class="sum-cmp-t">${esc(t)}</div>
      <div class="sum-bar now"><span>${fresh?'Hoy':esc(date)}</span><i style="width:${(D.ton/mx*100).toFixed(1)}%"></i><b>${_kgK(D.ton)} kg</b></div>
      <div class="sum-bar"><span>${esc(pd)}</span><i style="width:${(D.prevTon/mx*100).toFixed(1)}%"></i><b>${_kgK(D.prevTon)} kg</b></div></div>`;
  }else if(!D.prev&&D.ton>0)cmp=`<div class="sum-first">Primera sesión de ${esc(dl)}: la próxima vez verás cómo cambia tu volumen.</div>`;
  // Récords de la sesión
  const nr=D.records.length,str=D.rows.some(r=>!r.cardio);
  const wRows=D.rows.filter(r=>!r.cardio&&!r.bw),allNew=wRows.length>0&&wRows.every(r=>r.delta&&r.delta.t==='nuevo');
  const recs=nr?`<div class="sum-sec">${ic('trophy')} ${nr===1?'1 récord':nr+' récords'} ${fresh?'hoy':'en esta sesión'}</div><div class="sum-prs" id="sum-prs">${D.records.map((j,i)=>{const pv=prPrevTxt(j);
      return`<div class="sum-pr" style="animation-delay:${(.25+i*.12).toFixed(2)}s"><span class="sum-pr-ic" aria-hidden="true">${ic('trophy')}</span><div class="sum-pr-i"><div class="sum-pr-n">${esc(j.name)}</div><div class="sum-pr-v">${_nwUnits(esc(prTxt(j)))}${pv?` <i>· ${_nwPrev(pv)}</i>`:''}</div></div><span class="sum-pr-k">${prKindTxt(j)}</span></div>`;}).join('')}</div>`
    :str?`<div class="sum-sec">Récords</div><div class="sum-nopr">${allNew?'Primera vez con estos ejercicios: desde la próxima sesión, cada mejora (más peso o más reps) será un récord.'
      :fresh?'Hoy no hubo récord: la constancia también suma.':'Sin récords en esta sesión.'}</div>`:'';
  // Ejercicios: «55×12×3 ↑+2.5»
  const exs=D.rows.length?`<div class="sum-sec">Ejercicios</div><div id="sum-exs">${D.rows.map(r=>`<div class="sum-ex" data-ex="${esc(r.id)}"><div class="sum-ex-i"><div class="sum-ex-n">${esc(r.name)}${r.pr?'<em role="img" aria-label="récord">'+ic('trophy')+'</em>':''}</div><div class="sum-ex-s">${esc(r.line)}${r.dl?' · descarga':''}${r.sub!=null?` · <span class="sub-tag">⇄ solo hoy</span>${r.sub?' en lugar de '+esc(r.sub):''}`:''}</div></div>${r.delta?`<span class="sum-ex-d ${r.delta.cls}" aria-label="${esc(r.delta.a)}">${esc(r.delta.t)}</span>`:r.cardio?'<span class="sum-ex-d up" aria-label="hecho">✓</span>':''}</div>`).join('')}</div>`
    :`<div class="sum-nopr" style="margin-top:14px">Esta sesión no tiene series guardadas.</div>`;
  // Reparto del esfuerzo (RPE) por serie
  const R=D.rpe,tot=_rpeOn()?R[0]+R[1]+R[2]+R[3]:0;let eff=''; // (M2) esfuerzo apagado: sin «Esfuerzo por serie»
  if(tot&&R[0]<tot){
    const L=[[1,'Fácil','fácil','fáciles'],[2,'Justo','justa','justas'],[3,'Al límite','al límite','al límite'],[0,'Sin dato','sin dato','sin dato']].filter(([k])=>R[k]>0);
    eff=`<div class="sum-sec">Esfuerzo por serie</div><div class="sum-rpe" id="sum-rpe" role="img" aria-label="Esfuerzo por serie: ${esc(L.map(([k,,a1,a2])=>`${R[k]} ${R[k]===1?a1:a2}`).join(', '))}">${L.map(([k])=>`<i class="r${k}" style="flex:${R[k]} 1 0"></i>`).join('')}</div>
      <div class="sum-rpe-l" aria-hidden="true">${L.map(([k,l])=>`<span><i class="r${k}"></i>${l} <b>${R[k]}</b></span>`).join('')}</div>${D.old?'<div class="sum-rpe-n">En los registros sin series guardadas cuenta el esfuerzo medio de cada ejercicio.</div>':''}`;
  }else if(tot)eff=`<div class="sum-sec">Esfuerzo por serie</div><div class="sum-nopr">No apuntaste el esfuerzo (fácil, justo o al límite) en esta sesión.</div>`;
  // Mapa muscular de la sesión (componente de la etapa 06): brillo ∝ series de cada músculo hoy
  const gs=D.mm.groups.filter(g=>g.v>=.05).sort((a,b)=>b.v-a.v);
  const canMap=typeof GymAnim!=='undefined'&&typeof GymAnim.muscleMap==='function';
  const mus=gs.length?`<div class="sum-sec">Músculos trabajados</div>${canMap?'<div class="mm-fig sum-fig" data-sum-map="1"></div>':''}
    <div class="sum-gs">${gs.slice(0,5).map(g=>`<button type="button" class="sum-g" data-g="${g.id}" aria-pressed="false" onclick="sumPickGroup(this.dataset.g)">${esc(g.n)} <b>${mmFmt(g.v)}</b></button>`).join('')}</div>
    <div class="sum-pick" id="sum-pick" aria-live="polite">Series por grupo en esta sesión. Toca un músculo o un grupo.</div>`:'';
  const note=s.note?`<div class="sum-sec">Nota</div><div class="sum-note">«${esc(String(s.note).slice(0,500))}»</div>`:'';
  const foot=`<div class="sum-foot">Tonelaje = kg × reps de cada serie${D.old?' (en registros antiguos, peso × reps × series)':''}. Récord: más peso que nunca, o más reps con ese peso (sin peso: más reps, más tiempo o más distancia); el 1RM estimado usa la fórmula de Epley.</div>`;
  root.innerHTML=`<div class="hist-over" onclick="if(event.target===this)closeSessionSummary()"><div class="hist-sheet sum-sheet${anim?' sum-anim':''}" id="sum-sheet" role="dialog" aria-modal="true" aria-labelledby="sum-t" data-ts="${+s.ts}">
    <div class="hist-sheet-head"><div class="hist-sheet-hdl"></div><div class="hist-sheet-title" id="sum-t">${esc(title)}</div><div class="hist-sheet-sub">${_nwUnits(esc(sub))}</div><button class="hist-sheet-close" onclick="closeSessionSummary()" aria-label="Cerrar el resumen">✕</button></div>
    <div class="hist-sheet-body">${kpis}${cmp}${recs}${exs}${eff}${mus}${note}${foot}<button class="btn ${fresh?'bp':'bs'}" id="sum-ok" onclick="closeSessionSummary()">${fresh?'Listo':'Cerrar'}</button></div>
  </div></div>`;
  const fig=root.querySelector('[data-sum-map]');
  if(fig){
    const ref=Math.max(6,...Object.values(D.mm.mus)),w={};
    Object.keys(D.mm.mus).forEach(m=>{if(D.mm.mus[m]>0)w[m]=Math.min(1,D.mm.mus[m]/ref);});
    const lbl=`Músculos de esta sesión, de frente y de espalda: ${gs.slice(0,4).map(g=>`${g.n} ${mmFmt(g.v)} series`).join(', ')}. Toca un músculo para ver sus ejercicios.`;
    try{GymAnim.muscleMap(fig,{weights:w,label:lbl,view:'both',onPick:m=>{const g=_MM_MUS2G[m];if(g)sumPickGroup(g);}});}catch(e){console.error(e);}
  }
  _sumAnimate(root);
  // Al terminar con récords: otro pequeño estallido sobre la lista de récords
  if(fresh&&nr)setTimeout(()=>{if(_sum&&_sum.fresh&&_sum.ts===+s.ts){prBurst(document.getElementById('sum-prs'));haptic(PR_HAPTIC);}},450);
}
// Contadores de 0 a su valor (≈0,9 s, con desaceleración). Siempre acaban en el valor exacto (también sin fotogramas).
function _sumAnimate(root){
  const els=[...root.querySelectorAll('.sum-n[data-to]')];
  if(_rm()||!els.length)return;
  const fmt=(el,v)=>{el.textContent=el.dataset.fmt==='k'?_kgK(v):String(Math.round(v));};
  let done=false;
  const fin=()=>{done=true;els.forEach(el=>fmt(el,+el.dataset.to));};
  const T=900,t0=performance.now();
  els.forEach(el=>fmt(el,0));
  const step=()=>{
    if(done||!els[0].isConnected)return;
    const t=Math.max(0,Math.min(1,(performance.now()-t0)/T)),e=1-Math.pow(1-t,3);
    els.forEach(el=>fmt(el,+el.dataset.to*e));
    if(t<1)requestAnimationFrame(step);else fin();
  };
  requestAnimationFrame(step);
  clearTimeout(_sumAnimT);_sumAnimT=setTimeout(fin,T+300);
}
// Tocar un grupo (o un músculo del maniquí): sus series en esta sesión y qué ejercicios lo trabajaron
function sumPickGroup(gid){
  const D=_sumData,el=document.getElementById('sum-pick');if(!D||!el)return;
  const g=D.mm.groups.find(x=>x.id===gid);if(!g)return;
  document.querySelectorAll('#summary-root .sum-g').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.g===gid)));
  el.innerHTML=!(g.v>=.05)?`<b>${esc(g.n)}</b>: sin series en esta sesión.`
    :`<b>${esc(g.n)}</b>: ${esc(mmFmt(g.v))} series · ${esc(g.ex.slice(0,3).map(e=>e.name).join(', '))}${g.ex.length>3?'…':''}`;
}

