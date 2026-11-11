// ─── FICHA DEL EJERCICIO 2.0: gráfica con eje de tiempo ───
// El mismo motor que la del peso corporal (_wc + wcMove: lectura al tocar o arrastrar, rangos 1M-Todo) con la medida de
// la ficha (_histMode): con kilos, el peso máximo (el de tu mejor serie: el registro guarda el máximo de las series) y el 1RM
// estimado (Epley, prE1rm: la mejor serie de la sesión); con lastre, los kilos del lastre (sin 1RM); sin kilos, sus reps,
// segundos o metros. Récords (prAll) en coral, semanas de descanso y descargas como franjas, y el corte de «banda más
// dura» (_bandCuts) como en las mini-gráficas. El rango elegido se guarda aparte del del peso (S.hRange).
function hRangeKey(){return WRANGES.some(r=>r[0]===S.hRange)?S.hRange:'6m';}
function setHRange(k){if(!WRANGES.some(r=>r[0]===k))return;S.hRange=k;saveState();renderHist();}
function hRangeChips(k){return`<div class="wc-ranges hc-ranges" role="tablist" aria-label="Periodo de la gráfica">${WRANGES.map(r=>`<button type="button" class="wc-rg${r[0]===k?' on':''}" role="tab" aria-selected="${r[0]===k}" onclick="setHRange('${r[0]}')">${r[1]}</button>`).join('')}</div>`;}
// Día y mes de la fecha escrita de un registro antiguo («8 Sep», como fmtDate; también «8 sep.» o en inglés «8 Aug»)
const _MON_EN=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
function _recDayMon(d){
  const m=/^\s*(\d{1,2})[\s\/.-]*([a-záéíóú]{3})/i.exec(String(d==null?'':d));if(!m)return null;
  const s=m[2].toLowerCase(),day=+m[1];
  let mon=MONTHS.findIndex(x=>x.toLowerCase()===s);if(mon<0)mon=_MON_EN.indexOf(s);
  return mon>=0&&day>=1&&day<=31?{day,mon}:null;
}
// Fechas de una lista de registros (en orden): su ts; los antiguos sin ts, el día de su fecha escrita (rec.d) con el año
// deducido hacia atrás desde el siguiente registro con fecha (o hoy), sin pasarse de él ni quedar antes del anterior;
// si no se puede leer, entre sus vecinos (o cada G días hasta hoy). t.est[i]: 0 = ts real, 1 = día de rec.d, 2 = aproximada.
function _datedTs(list,G){
  const n=list.length,t=list.map(r=>r&&typeof r.ts==='number'&&isFinite(r.ts)&&r.ts>0?r.ts:null),est=t.map(x=>x==null?2:0);
  let anchor=Date.now();
  for(let i=n-1;i>=0;i--){
    if(est[i]===0){anchor=Math.min(anchor,t[i]);continue;}
    const p=_recDayMon(list[i]&&list[i].d);if(!p)continue;
    const mk=y=>{const d=new Date(y,p.mon,p.day,12);return d.getDate()===p.day?d.getTime():null;};
    const y0=new Date(anchor).getFullYear();let c=mk(y0);
    if(c==null||_startOfDay(c)>_startOfDay(anchor))c=mk(y0-1);
    if(c==null&&p.mon===1&&p.day===29)for(let y=y0-2;y>y0-5&&c==null;y--)c=mk(y); // 29 Feb: el último año bisiesto
    if(c==null)continue;
    c=Math.min(c,anchor);
    let a=i-1;while(a>=0&&est[a]!==0)a--;
    if(a>=0&&c<t[a])continue; // antes que un registro anterior con fecha real: mejor interpolar
    t[i]=c;est[i]=1;anchor=c;
  }
  for(let i=0;i<n;i++)if(t[i]==null){let a=i-1;while(a>=0&&t[a]==null)a--;let b=i+1;while(b<n&&t[b]==null)b++;
    t[i]=a>=0&&b<n?t[a]+(t[b]-t[a])*(i-a)/(b-a):a>=0?Math.min(Date.now(),t[a]+(i-a)*G):b<n?t[b]-(b-i)*G:Date.now()-(n-1-i)*G;}
  t.est=est;return t;
}
function _histTs(list){return _datedTs(list,3*DAY_MS);}
// Un registro con lastre: «+15 kg lastre × 8» (reps de la serie top si las hay)
function _lastreTxt(rec){const t=_recTop(rec),r=t&&t.r?t.r:_setNumR(rec.r);return`+${kgTxt(+rec.v)}${NB}kg lastre${r?' × '+r:''}`;}
// Mejor 1RM estimado de un registro (la mejor serie: peso × (1 + reps/30)); 0 sin reps
function _recE1(rec){let m=0;prRecSets(rec).forEach(s=>{const e=prE1rm(s.w,s.r);if(e>m)m=e;});return m;}
// La mejor serie de un registro de kilos: la de más peso y, con ese peso, más reps
function _recTop(rec){let b=null;prRecSets(rec).forEach(s=>{if(!b||s.w>b.w+PR_EPS||(Math.abs(s.w-b.w)<PR_EPS&&(s.r||0)>(b.r||0)))b=s;});return b;}
// Esfuerzo de un registro: el de cada serie (rec.sets[i].rpe, v18) o, en los antiguos, la media guardada
function _recRpes(rec){
  if(!rec)return[];
  if(Array.isArray(rec.sets)){const a=rec.sets.filter(s=>s&&typeof s==='object').map(s=>rpeCat(s.rpe)).filter(Boolean);if(a.length)return a;}
  const c=rpeCat(rec.rpe);return c?[c]:[];
}
const RPE_WORD={1:'fácil',2:'justo',3:'al límite'};
function _rpeDotsHtml(rec){
  const a=_recRpes(rec);if(!a.length)return'';
  const one=!(Array.isArray(rec.sets)&&rec.sets.some(s=>s&&rpeCat(s.rpe)));
  return`<span class="hist-rpe" role="img" aria-label="Esfuerzo${one?' medio':''}: ${a.map(x=>RPE_WORD[x]).join(', ')}">${a.slice(0,8).map(x=>`<i class="r${x}"></i>`).join('')}</span>`;
}
// Franjas de descanso y descarga que tocan a este ejercicio (las mismas que _lightAt), recortadas a hoy
function _histBands(exId){
  const now=Date.now(),out=[],ok=(a,b)=>isFinite(a)&&isFinite(b)&&b>a;
  (Array.isArray(S.restWeeks)?S.restWeeks:[]).forEach(r=>{if(r&&ok(+r.startTs,+r.endTs)&&+r.startTs<=now)out.push({a:+r.startTs,b:Math.min(now,+r.endTs),k:'rest'});});
  (Array.isArray(S.deloadHistory)?S.deloadHistory:[]).forEach(h=>{if(h&&ok(+h.startTs,+h.endTs)&&(!Array.isArray(h.exIds)||h.exIds.includes(exId)))out.push({a:+h.startTs,b:Math.min(now,+h.endTs),k:'dl'});});
  const d=getActiveDeload();
  // (13 r1) la de todo el plan cubre todos los ejercicios (como _lightAt)
  if(d&&d.startTs<=now&&Array.isArray(d.changes)&&(d.kind==='all'||d.changes.some(c=>c&&c.exId===exId)))out.push({a:d.startTs,b:Math.min(now,d.endTs),k:'dl'});
  return out.filter(x=>x.b>x.a);
}
// Puntos de la gráfica: [{t, v, e (1RM est. o null), pr, light, cut, t1, t2}] de los registros de la medida de la ficha
function _histPts(exId,data,H,o){
  const kd=H.data,ts=_histTs(kd),flags=o.flags||[],cutSet=new Set(o.cuts||[]);
  return kd.map((rec,i)=>{
    const t=ts[i],k=data.indexOf(rec),pr=k>=0?flags[k]||null:null,light=!!rec.dl||_lightAt(exId,t);
    let v,e=null,txt;
    if(H.kg){
      v=+rec.v;
      const top=_recTop(rec),lt=_recLT(rec);
      if(lt==='t'||lt==='d')txt=_recValTxt(rec);
      else if(o.lastre)txt=`+${kgTxt(v)} kg lastre${top&&top.r?' × '+top.r:''}`;
      else txt=`${kgTxt(v)} kg${top&&top.r?' × '+top.r:''}`;
      if(!o.lastre){const x=_recE1(rec);if(x>0)e=x;}
    }else if(H.lreps){const tp=_recTop(rec);v=(tp&&tp.r)||_setNumR(rec.r)||0;txt=_lastreTxt(rec);}
    else{v=_recMetric(rec,H.lt)||0;txt=_recValTxt(rec);}
    const rp=_recRpes(rec),rc=rp.length?Math.round(rp.reduce((a,b)=>a+b,0)/rp.length):0,ch=rc?RPE_CHIPS.find(c=>c[0]===rc):null;
    const t2=[e?`1RM est. ${prKg(e)} kg`:'',ch?ch[1]+' '+ch[3]:'',pr?'🏆 Récord':'',light?'semana ligera':''].filter(Boolean).join(' · ');
    // Fecha: la real con el día de la semana; la de un registro antiguo, como se apuntó («8 Sep»); si es aproximada, «≈»
    const es=ts.est?ts.est[i]:0,dt=es===0?wFmt(t,'wd'):es===1?wFmt(t):'≈ '+wFmt(t);
    return{t,v,e,w:+rec.v||0,pr,light,approx:es===2,cut:cutSet.has(i),t1:dt+' · '+txt.replace(/ /g,' '),t2};
  });
}
// Texto corto de un valor de la ficha (eje, etiqueta del último punto)
function _hVal(v,H){return H.kg?kgTxt(Math.round(v*10)/10):String(Math.round(v));}
function _hUnit(H){return H.kg?'kg':_metricU(H.lt);}
// SVG de la ficha. color: el del día del ejercicio (atributo stroke de la línea principal)
function sChartSVG(pts,o){
  o=o||{};const W=o.w||340,H=o.h||176,PL=31,PR=12,PT=24,PB=20,id='wc'+(++_wcSeq),n=pts.length,M=o.mode,col=o.color||'var(--green)';
  const t0=pts[0].t,t1=pts[n-1].t,span=Math.max(t1-t0,1);
  const vals=pts.flatMap(p=>p.e!=null?[p.v,p.e]:[p.v]);let lo=Math.min(...vals),hi=Math.max(...vals);
  const minSpan=M.kg?2:M.lt==='t'?10:M.lt==='d'?10:2,pad=Math.max((hi-lo)*.14,minSpan/2);lo-=pad;hi+=pad;if(!M.kg||o.lastre)lo=Math.max(0,lo);
  const steps=M.kg?[.5,1,2,2.5,5,10,20,25,50,100]:[1,2,5,10,15,20,30,60,100,200,500,1000,2000];
  const st=steps.find(s=>s>=(hi-lo)/4)||steps[steps.length-1],ticks=[];
  for(let v=Math.ceil(lo/st)*st;v<=hi+1e-9;v+=st)ticks.push(+v.toFixed(2));
  const X=t=>PL+(t-t0)/span*(W-PL-PR),Y=v=>PT+(hi-v)/(hi-lo)*(H-PT-PB);
  const xl=_wcXLabels(t0,t1),days=span/DAY_MS;
  // franjas (descanso / descarga) dentro del rango
  const bands=(o.bands||[]).filter(b=>b.b>t0&&b.a<t1).map(b=>{const x0=X(Math.max(b.a,t0)),x1=X(Math.min(b.b,t1)),w=Math.max(3,x1-x0);
    return`<g class="sc-band ${b.k}"><title>${b.k==='rest'?'Semana de descanso':'Descarga'}</title><rect x="${x0.toFixed(1)}" y="${PT-6}" width="${w.toFixed(1)}" height="${H-PB-PT+6}"/>${w>=40?`<text x="${(x0+w/2).toFixed(1)}" y="${PT+3}" text-anchor="middle" class="sc-bl">${b.k==='rest'?'descanso':'descarga'}</text>`:''}</g>`;}).join('');
  // tramos: la línea se corta donde empieza una banda más dura
  const segs=[];{let cur=[];pts.forEach((p,i)=>{if(p.cut&&cur.length){segs.push(cur);cur=[];}cur.push(i);});segs.push(cur);}
  const path=(arr,f)=>arr.map((i,k)=>(k?'L':'M')+X(pts[i].t).toFixed(1)+','+Y(f(pts[i])).toFixed(1)).join('');
  const line=segs.map(s=>path(s,p=>p.v)).join('');
  const area=segs.filter(s=>s.length>1).map(s=>path(s,p=>p.v)+`L${X(pts[s[s.length-1]].t).toFixed(1)},${H-PB}L${X(pts[s[0]].t).toFixed(1)},${H-PB}Z`).join('');
  const ei=pts.map((p,i)=>p.e!=null?i:-1).filter(i=>i>=0),eLine=ei.length>=2?path(ei,p=>p.e):'';
  const cutMarks=pts.map((p,i)=>{if(!p.cut||!i)return'';const x=(X(pts[i-1].t)+X(p.t))/2,gap=X(p.t)-X(pts[i-1].t),lb=gap>=100?'banda más dura':gap>=44?'⇧ banda':'';
    return`<g class="sp-cut"><title>banda más dura</title><line x1="${x.toFixed(1)}" y1="${lb?PT+6:PT-4}" x2="${x.toFixed(1)}" y2="${H-PB}" stroke="var(--text3)" stroke-width="1" stroke-dasharray="3 3"/>${lb?`<text x="${x.toFixed(1)}" y="${PT+1}" text-anchor="middle" class="sc-bl">${lb}</text>`:''}</g>`;}).join('');
  const r=n>80?2:n>40?2.5:3.2,last=pts[n-1],lx=X(last.t),ly=Y(last.v);
  const dots=pts.map(p=>p.pr?'':`<circle cx="${X(p.t).toFixed(1)}" cy="${Y(p.v).toFixed(1)}" r="${r}" class="sc-pt${p.light?' lt':''}" style="--c:${col}"/>`).join('');
  const prs=pts.map(p=>p.pr?`<circle cx="${X(p.t).toFixed(1)}" cy="${Y(p.v).toFixed(1)}" r="${(r+1.6).toFixed(1)}" class="sc-pr${p.light?' lt':''}"/>`:'').join('');
  _wc[id]={W,H,PT,PB,PL,PR,auto:true,p:pts.map(p=>({x:X(p.t),y:Y(p.v),ty:p.e!=null?Y(p.e):null,t:p.t,t1:p.t1,t2:p.t2}))};
  _wcIds.push(id);while(_wcIds.length>8)delete _wc[_wcIds.shift()];
  const u=_hUnit(M),eFirst=ei.length?pts[ei[0]].e:null,eLast=ei.length?pts[ei[ei.length-1]].e:null,nPr=pts.filter(p=>p.pr).length;
  const aria=`${o.what}: de ${_hVal(pts[0].v,M)} a ${_hVal(last.v,M)} ${u} ${pts.some(p=>p.approx)?'(fechas aproximadas)':`entre el ${wFmt(t0,'dmy')} y el ${wFmt(t1,'dmy')}`}`+
    (eFirst!=null&&ei.length>=2?`; 1RM estimado de ${prKg(eFirst)} a ${prKg(eLast)} kg`:'')+(nPr?`; ${plural(nPr,'récord','récords')}`:'')+'. Toca o arrastra para ver cada sesión.';
  return`<svg class="wc-svg sc-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(aria)}">
    <defs><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${col}" stop-opacity=".2"/><stop offset="100%" stop-color="${col}" stop-opacity="0"/></linearGradient></defs>
    ${bands}
    ${ticks.map(v=>`<line x1="${PL}" x2="${W-PR}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" class="wc-grid"/><text x="${PL-6}" y="${(Y(v)+3).toFixed(1)}" text-anchor="end" class="wc-ytk">${st<1?v.toFixed(1):v}</text>`).join('')}
    <text x="${PL-6}" y="${PT-14}" text-anchor="end" class="wc-ytk sc-u">${u}</text>
    ${xl.map(([t,s],i)=>`<text x="${X(t).toFixed(1)}" y="${H-5}" text-anchor="${days<=120?(i===0?'start':i===3?'end':'middle'):'middle'}" class="wc-xtk">${s}</text>`).join('')}
    ${area?`<path d="${area}" fill="url(#${id}g)"/>`:''}
    <path d="${line}" fill="none" stroke="${col}" class="sc-line"/>
    ${eLine?`<path d="${eLine}" class="sc-e1"/>`:''}
    ${cutMarks}${dots}${prs}
    ${(()=>{const pl=segs.map(sg=>sg.map(i=>[X(pts[i].t),Y(pts[i].v)])).concat(ei.length>=2?[ei.map(i=>[X(pts[i].t),Y(pts[i].e)])]:[]);
      const q=_wcPlace([{x:lx,y:ly,txt:String(_hVal(last.v,M))}],pl,pts.slice(-8).map(p=>[X(p.t),Y(p.v),p.pr?r+1.6:r]),{PL,PT,PB,W,H})[0];
      return`<text x="${q.x.toFixed(1)}" y="${q.y.toFixed(1)}" text-anchor="${q.anc}" class="wc-lastv sc-lastv">${_hVal(last.v,M)}</text>`;})()}
    <g id="${id}-h" class="wc-hov" style="display:none"><line class="wc-hl" y1="${PT-6}" y2="${H-PB}"/><circle class="wc-hd" r="4.5"/><circle class="wc-ht sc-ht" r="3"/>
      <g class="wc-tip"><rect rx="6" width="118" height="34"/><text class="wc-t1" x="8" y="14"></text><text class="wc-t2" x="8" y="27"></text></g></g>
    <rect x="0" y="0" width="${W}" height="${H}" fill="transparent" style="touch-action:pan-y;cursor:crosshair" onpointerdown="wcMove(event,'${id}')" onpointermove="wcMove(event,'${id}')" onpointerleave="wcLeave(event,'${id}')"/>
  </svg>`;
}
// Bloque de la gráfica de la ficha: rangos, resumen del periodo, gráfica y leyenda
function histChartHtml(exId,data,H,o){
  let all=_histPts(exId,data,H,o);
  if(all.length<2)return`<div class="hist-chart-empty">${all.length?'Con una sesión más verás aquí tu evolución.':''}</div>`;
  const k=hRangeKey();let rp=wInRange(all,k);const R=WRANGES.find(x=>x[0]===k);
  // Con peso por tiempo o distancia (paseo, plancha con disco) no hay «mejor serie»: la línea es el peso (los s o m, en la
  // lectura)… salvo que el peso no cambie en el periodo: entonces lo que progresa son sus segundos o metros, y esa es la
  // línea (como «+50 s» de Ganancia), con el peso en la leyenda y el resumen («con 16 kg»)
  const lt0=_recLT(H.data[H.data.length-1]);let tdKg=H.kg&&(lt0==='t'||lt0==='d'),withKg=null;
  if(tdKg){
    const Hm={kg:false,lt:lt0,data:H.data.filter(r=>_recLT(r)===lt0&&_recMetric(r,lt0)!=null)};
    const am=Hm.data.length>=2?_histPts(exId,data,Hm,Object.assign({},o,{cuts:[]})):[],rm=am.length>=2?wInRange(am,k):[];
    if(rm.length>=2&&rm.every(p=>Math.abs(p.w-rm[0].w)<PR_EPS)&&rm.some(p=>p.v!==rm[0].v)){H=Hm;all=am;rp=rm;withKg=rm[0].w;tdKg=false;}
  }
  // Peso corporal con el mismo lastre en el periodo y más (o menos) reps: lo que cambia son las reps, y esa es la línea
  // («+3 reps con +10 kg de lastre», nunca «±0 kg de lastre»)
  let lreps=false;
  if(o.lastre&&H.kg&&withKg==null){
    const rOf=r=>{const tp=_recTop(r);return(tp&&tp.r)||_setNumR(r.r)||null;};
    const Hm={kg:false,lt:'bw',lreps:true,data:H.data.filter(r=>rOf(r)!=null)};
    const am=Hm.data.length>=2?_histPts(exId,data,Hm,Object.assign({},o,{cuts:[]})):[],rm=am.length>=2?wInRange(am,k):[];
    if(rm.length>=2&&rm.every(p=>Math.abs(p.w-rm[0].w)<PR_EPS)&&rm.some(p=>p.v!==rm[0].v)){H=Hm;all=am;rp=rm;withKg=rm[0].w;lreps=true;}
  }
  const u=_hUnit(H),wk=withKg!=null?(lreps?` con +${kgTxt(withKg)}${NB}kg lastre`:` con ${kgTxt(withKg)}${NB}kg`):'';
  const what=H.kg?(o.lastre?'Lastre':tdKg?'Peso':'Peso máximo'):(H.lt==='t'?'Tiempo por serie':H.lt==='d'?'Distancia por serie':'Reps por serie')+wk;
  // Cambio en el periodo (desde el último cambio a una banda más dura, si lo hay; si es el último punto, nada)
  let c0=0;rp.forEach((p,i)=>{if(p.cut&&i)c0=i;});
  const last=rp[rp.length-1],first=rp[c0],dv=c0<rp.length-1?last.v-first.v:null;
  const eArr=rp.filter(p=>p.e!=null),de=eArr.length>=2&&eArr[0].e>0?(eArr[eArr.length-1].e/eArr[0].e-1)*100:null;
  const sg=(v,d)=>(v>0?'+':v<0?'−':'±')+Math.abs(v).toFixed(d);
  // (16e) cifra y unidad con espacio duro («+30 s en 12 días»)
  const fmtD=v=>H.kg?`${v>0?'+':v<0?'−':'±'}${kgTxt(Math.abs(v))}${NB}kg`:`${sg(v,0)}${NB}${u}`;
  const sum=dv==null?'':`<div class="sc-sum"><b class="${dv>0?'up':dv<0?'dn':''}">${fmtD(dv)}</b>${lreps?` con +${kgTxt(withKg)}${NB}kg de lastre`:o.lastre?' de lastre':H.kg?(tdKg?' de peso':' de peso máximo'):withKg!=null?(H.lt==='t'?' de tiempo por serie':' de distancia por serie')+wk:''}${de!=null?` · <b class="${de>0.05?'up':de<-0.05?'dn':''}">${sg(de,1)} %</b> de 1RM estimado`:''} <span>${rp.some(p=>p.approx)?'(fechas aproximadas)':wRangeLbl(rp,R).replace(/(\d) /g,'$1'+NB)}</span></div>`;
  const bands=_histBands(exId),t0=rp[0].t,t1=last.t,inB=bands.filter(b=>b.b>t0&&b.a<t1);
  const hasRest=inB.some(b=>b.k==='rest'),hasDl=inB.some(b=>b.k==='dl'),hasPr=rp.some(p=>p.pr),hasE=eArr.length>=2,hasCut=rp.some((p,i)=>p.cut&&i);
  const legend=`<div class="wc-legend sc-legend"><span><i class="sc-k1" style="background:${o.color}"></i>${what}</span>${hasE?'<span><i class="sc-k2"></i>1RM estimado</span>':''}${hasPr?'<span><i class="sc-kpr"></i>Récord</span>':''}${hasRest?'<span><i class="sc-kb rest"></i>Descanso</span>':''}${hasDl?'<span><i class="sc-kb dl"></i>Descarga</span>':''}${hasCut?'<span><i class="sc-kcut"></i>Banda más dura</span>':''}</div>`;
  return`${hRangeChips(k)}${sum}<div class="wchart hist-chart">${sChartSVG(rp,{mode:H,color:o.color,bands,lastre:o.lastre,what,h:176,w:_wcW(53,true)})}</div>${legend}`;
}

// Foco: al abrir la ficha va a su ✕ (es un diálogo modal); al cerrarla vuelve a lo que la abrió (la fila de Progreso,
// el botón…) o, si ese se repintó, a la fila de ese ejercicio ([data-ex])
let _histOpener=null;
function openHist(exId){
  if(!S._hist){const a=document.activeElement;_histOpener=a&&a!==document.body?a:null;}
  S._hist=exId;renderHist();
}
function closeHist(){
  const id=S._hist,o=_histOpener;S._hist=null;_histOpener=null;renderHist();
  const c=document.activeElement;if(c&&c!==document.body)return;
  let el=o&&o.isConnected?o:null;
  if(!el&&id)try{el=document.querySelector(`[data-ex="${CSS.escape(id)}"]`);}catch(e){}
  if(el)try{el.focus({preventScroll:true});}catch(e){}
}
// Tab no sale de la ficha mientras está encima de todo
function _histTrap(ev){
  const sh=document.querySelector('#hist-root .hist-sheet');if(!sh)return;
  const f=[...sh.querySelectorAll('button:not([disabled]),[tabindex="0"]')].filter(x=>x.tabIndex>=0&&x.getClientRects().length);if(!f.length)return;
  const a=f[0],z=f[f.length-1],c=document.activeElement,to=!sh.contains(c)||c===sh?ev.shiftKey?z:a:ev.shiftKey&&c===a?z:!ev.shiftKey&&c===z?a:null;
  if(to){ev.preventDefault();try{to.focus();}catch(e){}}
}
function _histFocusIn(root){const b=root.querySelector('.hist-sheet-close');if(b)try{b.focus({preventScroll:true});}catch(e){}}

function renderHist(){
  const root=document.getElementById('hist-root');
  if(!root)return;
  if(!S._hist){root.innerHTML='';return;}
  const exId=S._hist;
  let ex=findExInPlan(exId); // (11) también el de tu rutina sustituido hoy «solo hoy»
  // Si ya no está en el plan, intentar reconstruir desde el histórico guardado
  if(!ex){
    // Ya no está en el plan: nombre guardado en sus registros, plan original, biblioteca… (nunca el id)
    ex={id:exId,n:exDisplayName(exId),eq:'—',s:'—',r:'—',ic:'📊',_orphan:true};
  }
  const data=(S.strength[exId]||[]).slice();
  if(data.length===0){
    const fresh0=!root.querySelector('.hist-sheet')||root.dataset.ex!==exId;root.dataset.ex=exId;
    root.innerHTML=`<div class="hist-over" onclick="if(event.target===this)closeHist()"><div class="hist-sheet" role="dialog" aria-modal="true" aria-label="Ficha de ${esc(ex.n)}">
      <div class="hist-sheet-head"><div class="hist-sheet-hdl"></div><div class="hist-sheet-title">${esc(ex.n)}</div><div class="hist-sheet-sub">${esc(ex.eq)}${ex.s&&ex.r&&!ex._orphan?' · '+_nwUnits(esc(ex.s)+'×'+esc(fmtTargetReps(ex))):''}</div><button class="hist-sheet-close" onclick="closeHist()" aria-label="Cerrar">✕</button></div>
      <div class="hist-sheet-body"><div class="empty"><div class="eic">📊</div><p>Sin registros aún. Completa una sesión para ver historial.</p></div></div>
    </div></div>`;
    if(fresh0)_histFocusIn(root);
    return;
  }

  // Medida de la hoja: kilos si el último registro tiene peso; si no, la suya (reps, tiempo o distancia). Las cifras, la
  // gráfica y los cambios son solo de esa medida (sin mezclar kilos con reps); las demás sesiones se listan con su texto.
  const H=_histMode(data),kd=H.data,kdTs=_histTs(kd); // (fechas como la gráfica: «ligera» igual en filas y lectura)
  const ws=kd.map(d=>H.kg?d.v:_recMetric(d,H.lt));
  // «Mejor» sin kilos: la mejor serie (como el récord), no la sesión (cada registro guarda su serie más floja)
  const bestX=d=>Math.max(_recMetric(d,H.lt)||0,...prRecSetsX(d).map(x=>x.val));
  // Banda más dura (_bandUp): el progreso cuenta desde la última; si es la de hoy, «banda más dura» en vez de «−3 reps»
  const bx=ex._orphan?_mmExOf(exId):ex,cuts=H.kg?[]:_bandCuts(bx,kd),k0=cuts.length?cuts[cuts.length-1]:0,bandNow=k0>0&&k0===kd.length-1;
  // Peso corporal con lastre: sus kilos son solo el lastre, sin 1RM estimado (con 5 kg × 11 no son «7 kg» de dominada)
  const lastreH=H.kg&&_isLastre(exId,kd),lastreAny=lastreH||_isLastre(exId,data);
  const mx=H.kg?Math.max(...ws):Math.max(...kd.map(bestX)), first=ws[k0], last=ws[ws.length-1];
  const gain=last-first;
  // Con peso por tiempo o distancia (paseo, plancha con disco) y el mismo peso: lo ganado en segundos o metros (frente
  // al primer registro que los tiene)
  const tdG=H.kg&&kd.length>=2&&Math.abs(gain)<PR_EPS?_tdGainSince(kd):null;
  // …y con el mismo lastre, lo ganado en reps («+3 reps», no «±0 kg»)
  const lrG=lastreH&&kd.length>=2&&Math.abs(gain)<PR_EPS?_lrGainSince(kd):null;
  // (09) Récords: más peso que nunca («PR») o más reps con ese peso («PR reps»), con las series de cada sesión (o v×r en
  // los registros antiguos). La primera sesión no cuenta como récord. Tocar una sesión abre su resumen.
  const PA=prAll().byEx[exId]||null,flags=PA?PA.flags:[];

  const rev=data.slice().reverse(); // newest first for list
  const sameM=d=>H.kg?+d.v>0:!(+d.v>0)&&_recLT(d)!=='w'&&_prXType(_recLT(d))===_prXType(H.lt);
  const entries=rev.map((d,i)=>{
    const mine=sameM(d),next=mine?rev.slice(i+1).find(sameM):null,dv=r=>H.kg?r.v:_recMetric(r,H.lt)||0;
    let delta=next?(dv(d)-dv(next)):0,du=H.kg?null:H.lt==='t'?'s':H.lt==='d'?'m':'';
    // Mismo peso por tiempo o distancia: la diferencia de segundos o metros
    if(H.kg&&next&&Math.abs(delta)<PR_EPS){const g=_tdGain(d,next);if(g&&g.v){delta=g.v;du=g.lt==='t'?'s':'m';}}
    const band=!H.kg&&next&&delta<0&&_bandUp(bx,next,d);
    // Solo peso × reps se resume en «57.5 kg»; con lastre, tiempo o distancia, todo lo hecho («21 kg · 3×25 m»)
    // Con lastre, «+15 kg lastre × 8» (no «15 kg», que parecería el peso del ejercicio). (18) «× 8» con espacio duro
    // (texto suelto en la fila, sin .nw: así lo leen las pruebas y el lector)
    const full=!(H.kg&&mine&&_recLT(d)==='w'),vt=(lastreAny||_recLT(d)==='bw')&&+d.v>0?esc(_lastreTxt(d)):full?esc(_recValTxt(d)):esc(d.v)+' kg';
    const pj=flags[data.length-1-i]||null,isPr=!!pj;
    const sess=d&&typeof d.ts==='number'&&isFinite(d.ts)?findSession(d.ts):null;
    const tapA=sess?` role="button" tabindex="0" data-ts="${d.ts}" onclick="openSessionSummary(+this.dataset.ts)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openSessionSummary(+this.dataset.ts)}" aria-label="Sesión del ${esc(d.d)}: ${vt}${isPr?', récord':''}. Ver el resumen"`:'';
    return`<div class="hist-item${isPr?' pr pw':''}${sess?' tap':''}"${tapA}${isPr?` title="${esc(prToastTxt(pj))}"`:''}>
      <div class="hist-item-d">${esc(d.d)}</div>
      <div class="hist-item-w">${vt.replace(/ × (?=\d)/g,' ×'+NB)}${(()=>{
        // Serie a serie (v18) si el registro la guarda; si no, «3×12» como antes se apuntaba. Sin kilos, solo si las
        // series no son todas iguales (si lo son, ya lo dice «3×45 s»)
        let ln=Array.isArray(d.sets)&&d.sets.length?_setsLine(d.sets):(_setNumR(d.r)&&parseInt(d.setsDone)>0&&!(H.kg&&!mine)?`${parseInt(d.setsDone)}×${_setNumR(d.r)}`:'');
        if(full&&/^\d+ series · /.test(ln))ln='';
        return ln?`<small>${esc(ln)}</small>`:'';
      })()}${(()=>{
        // (12) esfuerzo de cada serie (puntos de color), 1RM estimado de la sesión y si fue ligera (descarga o descanso)
        const e1=H.kg&&mine&&!lastreH?_recE1(d):0,dots=_rpeDotsHtml(d),j=kd.indexOf(d),lg=!!d.dl||_lightAt(exId,j>=0?kdTs[j]:d.ts);
        return dots||e1>0||lg?`<span class="hist-item-x">${dots}${e1>0?`<span>1RM est. ${esc(prKg(e1))} kg</span>`:''}${lg?'<span class="hist-lg">ligera</span>':''}</span>`:'';
      })()}</div>
      ${isPr?`<span class="hist-item-pr ${pj.type}">${pj.type==='w'?'🏆 PR':pj.type==='xt'?'🏆 PR tiempo':pj.type==='xd'?'🏆 PR distancia':'🏆 PR reps'}</span>`:
        band?'<span class="hist-item-ch band">banda más dura</span>':
        delta!==0?`<span class="hist-item-ch ${delta>0?'up':'dn'}">${delta>0?'+':'−'}${du==null?kgTxt(Math.abs(delta))+NB+'kg':Math.abs(delta)+(du?NB+du:'')}</span>`:
        '<span class="hist-item-ch" style="color:var(--text3)">=</span>'}
    </div>`;
  }).join('');

  // Repintado con la ficha abierta (rango, render()): conserva el scroll
  const sc0=root.querySelector('.hist-sheet'),fresh=!sc0||root.dataset.ex!==exId,keep=fresh?0:sc0.scrollTop;root.dataset.ex=exId;
  // …y el foco, si estaba dentro: el mismo control (el rango elegido, una fila) o la ✕
  const fa=!fresh&&root.contains(document.activeElement)?document.activeElement:null;
  const fSel=!fa?null:fa.closest('.hc-ranges')?'.hc-ranges .wc-rg.on':fa.dataset&&fa.dataset.ts?`.hist-item[data-ts="${fa.dataset.ts}"]`:'.hist-sheet-close';
  root.innerHTML=`<div class="hist-over" onclick="if(event.target===this)closeHist()"><div class="hist-sheet" role="dialog" aria-modal="true" aria-label="Ficha de ${esc(ex.n)}">
    <div class="hist-sheet-head">
      <div class="hist-sheet-hdl"></div>
      <div class="hist-sheet-title">${esc(ex.n)}</div>
      <div class="hist-sheet-sub">${ex._orphan?(_isSubOnly(exId)?'Alternativa «solo hoy» · Solo lectura':'Ya no está en tu rutina · Solo lectura'):esc(ex.eq)+' · '+_nwUnits(esc(ex.s)+'×'+esc(fmtTargetReps(ex)))+' objetivo'}</div>
      <button class="hist-sheet-close" onclick="closeHist()" aria-label="Cerrar">✕</button>
    </div>
    <div class="hist-sheet-body">
      <div class="hist-row">
        ${H.kg?`<div class="hist-m"><div class="hist-m-v" style="color:var(--pr)">${lastreH?'+'+esc(kgTxt(mx))+NB+'kg':esc(mx)}</div><div class="hist-m-l">${lastreH?'Lastre máx.':'PR (kg)'}</div></div>
        ${tdG&&tdG.v?`<div class="hist-m"><div class="hist-m-v" style="color:${tdG.v>0?'var(--green)':'var(--amber)'}">${tdG.v>0?'+':'−'}${Math.abs(tdG.v)}${NB}${_metricU(tdG.lt)}</div><div class="hist-m-l">Ganancia</div></div>`
        :lrG?`<div class="hist-m"><div class="hist-m-v" style="color:${lrG>0?'var(--green)':'var(--amber)'}">${lrG>0?'+':'−'}${Math.abs(lrG)}${NB}reps</div><div class="hist-m-l">Ganancia</div></div>`
        :`<div class="hist-m"><div class="hist-m-v" style="color:${gain>=0?'var(--green)':'var(--amber)'}">${gain>0?'+':gain<0?'−':'±'}${esc(kgTxt(Math.abs(gain)))}${NB}kg</div><div class="hist-m-l">Ganancia</div></div>`}`
        :`<div class="hist-m"><div class="hist-m-v" style="color:var(--pr)">${esc(mx)}</div><div class="hist-m-l">Mejor (${_metricU(H.lt)})</div></div>
        ${bandNow?'<div class="hist-m"><div class="hist-m-v band">banda más dura</div><div class="hist-m-l">Progreso</div></div>'
        :`<div class="hist-m"><div class="hist-m-v" style="color:${gain>=0?'var(--green)':'var(--amber)'}">${gain>0?'+':gain<0?'−':''}${Math.abs(gain)}${NB}${_metricU(H.lt)}</div><div class="hist-m-l">Progreso</div></div>`}`}
        <div class="hist-m"><div class="hist-m-v">${data.length}</div><div class="hist-m-l">Sesiones</div></div>
      </div>
      ${H.kg&&!lastreH&&PA&&PA.eRef&&PA.eRef.r?`<div class="hist-e1">1RM estimado: <b>${esc(prKg(PA.maxE))} kg</b> · con ${esc(kgTxt(PA.eRef.w))} kg × ${PA.eRef.r}${PA.eRef.d?` (${esc(PA.eRef.d)})`:''}</div>`:''}
      ${histChartHtml(exId,data,H,{flags,cuts,lastre:lastreH,color:exColorOf(exId)})}
      <div class="hist-list-h">Historial completo</div>
      ${entries}
    </div>
  </div></div>`;
  if(keep){const sc=root.querySelector('.hist-sheet');if(sc)sc.scrollTop=keep;}
  if(fresh)_histFocusIn(root);
  else if(fSel){const f=root.querySelector(fSel)||root.querySelector('.hist-sheet-close');if(f)try{f.focus({preventScroll:true});}catch(e){}}
}

// (E1a) Pestañas de los días de tu rutina (2-6), con su nombre escapado. Con 5 o 6 días, las que no están abiertas
// enseñan solo la letra (el nombre completo va en su etiqueta para lectores de pantalla y al pasar el ratón).
function dayTabsHtml(plan,cur,cls,fn){
  const K=dayKeys(plan),many=K.length>=5;
  return K.map(k=>{const on=cur===k,lb=dayLabel(k,plan),short=many&&!on;
    return`<button type="button" class="${cls}${on?' on':''}" aria-pressed="${on}"${short?` aria-label="${esc(lb)}" title="${esc(lb)}"`:''} onclick="${fn}('${k}')"><span class="tab-t">${esc(short?k:lb)}</span></button>`;}).join('');
}
function renderWorkout(){
  const plan=getPlan();
  if(!_isPlanDay(plan[S.day]))S.day=hoyDayKey(); // (E1a) un día que ya no existe → el que toca
  const tabs=dayTabsHtml(plan,S.day,'tab','setWorkoutDay');
  const day=plan[S.day];
  if(!_isPlanDay(day))return`<div class="topbar"><div class="topbar-row"><div><h1>Entreno</h1></div></div></div>`; // sin días (no debería pasar: el plan se sanea)
  const strEx=day.ex.filter(e=>!e.cardio),live=_dayLive(day);
  const doneEx=strEx.filter(e=>countSetsDone(e.id,e.s)>=e.s).length;
  const pct=strEx.length?Math.round(doneEx/strEx.length*100):0,allDone=doneEx===strEx.length&&strEx.length>0;
  const exHtml=day.ex.map(ex=>{
    const isOpen=S.open===ex.id,c=S.sets[ex.id]||{},eid=esc(ex.id);
    const exDone=ex.cardio?c[0]===true:countSetsDone(ex.id,ex.s)>=ex.s;
    // Objetivo de hoy del Coach de carga (una sola fuente para chip, filas prerrellenadas, etiqueta y ajuste en vivo)
    const pr=!ex.cardio?coach_prescribe(ex.id):null;
    const nSets=!ex.cardio?Math.max(0,parseInt(ex.s)||0):0,nDone=!ex.cardio?countSetsDone(ex.id,ex.s):0;
    const sug=!ex.cardio&&isOpen?getSug(ex.id,ex.s,ex.r):null;
    const rows=!ex.cardio&&(isOpen||nDone>0)?setRows(ex,pr):null;
    const sum=rows&&nDone?setsSummary(ex,pr):null;
    // Progreso en la cabecera: puntos por serie (●●○) y el peso de hoy; completado: lo hecho y lo de la próxima vez
    const dots=!ex.cardio&&!exDone&&nSets?`<span class="ex-dots" role="img" aria-label="${nDone} de ${nSets} series hechas">${Array.from({length:Math.min(nSets,8)},(_,i)=>`<i${i<nDone?' class="on"':''}></i>`).join('')}</span>`:'';
    // Sin kilos (peso corporal, bandas, tiempo, distancia): lo de hoy en su medida («hoy 13 reps», «hoy 45 s»)
    const nk=!ex.cardio&&exLT(ex)!=='w',sumV=sum&&nk?_sumMetricTxt(ex,sum):'';
    // (el peso, «157.5 kg», con espacio duro: no se parte entre el número y «kg»)
    const todayW=sum&&sum.w&&!exDone&&!nk?` · hoy <span class="ex-today">${esc(_kgNB(sum.w))}</span>`:sumV&&!exDone?` · hoy <span class="ex-today">${esc(sumV)}</span>`:'';
    const nx=!ex.cardio&&exDone&&!isLightNow(ex.id)?_nextPres(ex):null;
    const doneSum=!ex.cardio&&exDone&&sum&&(sum.w||(nk&&sum.sets.length))?`<div class="ex-done-sum">${_nwX(esc(_setsLine(sum.sets)))}${nx?` · próxima <b>${_nwX(esc(presValTxt(nx)))}</b>`:''}</div>`:'';
    let body='';
    if(isOpen&&!ex.cardio){
      // Modo gym: antes de la primera serie, la técnica en grande (animación, consejo, objetivo y calentamiento);
      // después, las series arriba del todo y la animación en miniatura (se toca para ampliarla)
      const ak=exAnimKey(ex),training=nDone>0,big=!training||_animBig.has(ex.id);
      const spec=ak&&typeof GymAnim!=='undefined'?GymAnim.get(ak):null;
      const anim=!ak?'':big
        ?`<div class="ex-anim" data-ex="${eid}" data-gym-anim="${ak}"></div>${training?`<button type="button" class="anim-less" data-ex="${eid}" onclick="animShrink(this.dataset.ex)">Reducir animación ▴</button>`:''}`
        :`<div class="anim-mini" role="button" tabindex="0" data-ex="${eid}" onclick="animGrow(this.dataset.ex)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();animGrow(this.dataset.ex)}" aria-label="Ver la técnica de ${esc(ex.n)} en grande"><div class="ex-anim mini" data-ex="${eid}" data-gym-anim="${ak}"></div><div class="anim-mini-t"><b>Técnica</b><span>${esc(spec&&spec.labels?spec.labels.join(' · '):(ex.eq||''))}</span></div><span class="anim-mini-go" aria-hidden="true">Ampliar ▾</span></div>`;
      // (08) debajo de las series: el descanso entre series de este ejercicio (automático o el elegido)
      const setsHtml=setRowsHtml(ex,pr,rows)+restCtlHtml(ex);
      const la=`<div class="la-slot">${liveAdjHtml(ex,pr)}</div>`;
      const sugHtml=`<div class="sug-slot" aria-live="polite">${sug?`<div class="sug ${sug.t}">${_nwX(sug.m)}</div>`:''}</div>`;
      // (11) «¿Máquina ocupada?»: antes de la primera serie, alternativas en un toque (o el aviso del sustituto de hoy)
      const busy=busyBarHtml(ex,nDone);
      body=training
        ?`${busy}${anim}${big?`<div class="tip">${_tipHtml(ex.tip)}</div>`:''}${setsHtml}${la}${presTargetHtml(ex,pr,true)}${sugHtml}`
        :`${busy}${anim}<div class="tip">${_tipHtml(ex.tip)}</div>${presTargetHtml(ex,pr)}<div class="wu-slot">${warmupBlockHtml(ex)}</div>${setsHtml}${la}${sugHtml}`;
    }
    return`<div class="excard${isOpen?' open':''}${exDone?' complete':''}" data-ex="${eid}">
      <div class="exh" role="button" tabindex="0" aria-expanded="${isOpen}" data-ex="${eid}" onclick="toggleCard(this.dataset.ex)" onkeydown="if(event.key==='Enter'){event.preventDefault();toggleCard(this.dataset.ex)}">
        <div class="exic" style="${exDone?'background:var(--green-bg)':''}">${exIconHtml(ex)}</div>
        <div class="exin"><div class="exn" style="${exDone?'color:var(--text2);text-decoration:line-through':''}">${esc(ex.n)}</div><div class="exm">${ex.sub?'<span class="sub-tag">⇄ solo hoy</span> · ':''}${esc(ex.eq)}${NB}· ${_nwUnits(ex.cardio?esc(ex.r):esc(ex.s)+'×'+(pr&&(pr.unit==='kg'||pr.unit==='reps')&&pr.lo!==pr.hi?`${pr.lo}-${pr.hi} reps`:esc(fmtTargetReps(ex))))}${!ex.cardio&&deloadAppliesTo(ex.id)?' · <span class="dl-tag">descarga</span>':''}${todayW}</div>${pr&&!exDone?`<div class="ex-goal ${presKCls(pr)}" role="img" aria-label="Objetivo de hoy: ${_presIsKg(pr)&&!pr.up?`${esc(kgTxt(pr.weight))} kilos por ${pr.reps} repeticiones`:esc(presValTxt(pr))}, ${esc(presWord(pr))}"><span class="ex-goal-v">🎯 ${esc(presShortTxt(pr))}</span><span class="ex-goal-k">${presWord(pr)}</span></div>`:''}${doneSum}</div>
        ${dots}${exDone?'<span style="font-size:18px;flex-shrink:0">✅</span>':`<span class="exarrow">▼</span>`}
      </div>
      ${isOpen?`<div class="exb">${!ex.cardio?body
        :`${busyBarHtml(ex,c[0]||RT.cardioRunning(ex.id)?1:0)}${(()=>{const ak=exAnimKey(ex);return ak?`<div class="ex-anim" data-ex="${eid}" data-gym-anim="${ak}"></div>`:'';})()}<div class="tip">${_tipHtml(ex.tip)}</div>${(()=>{
          // Cronómetro de cardio: parsear duración de ex.r (ej: "8 min", "15 min")
          const m=String(ex.r||'').match(/(\d+)\s*min/i);
          const mins=m?parseInt(m[1]):0;
          if(c[0]){
            return`<button class="btn bs" data-ex="${eid}" onclick="toggleSet(this.dataset.ex,0);render()">✅ Marcado como hecho</button>`;
          }
          if(RT.cardioRunning(ex.id)){
            // En marcha: hora de fin (no hace falta refrescar cada segundo; la cuenta atrás va en la barra)
            const end=new Date(S.restTimer.endTs),hhmm=String(end.getHours()).padStart(2,'0')+':'+String(end.getMinutes()).padStart(2,'0');
            return`<div class="cardio-run">⏱ En marcha · termina a las <b>${hhmm}</b></div>
            <div style="display:flex;gap:8px">
              <button class="btn bs" style="flex:1" onclick="RT.skip()">■ Parar</button>
              <button class="btn bs" style="width:130px" data-ex="${eid}" onclick="toggleSet(this.dataset.ex,0);render()">Marcar hecho</button>
            </div>`;
          }
          if(mins>0){
            return`<div style="display:flex;gap:8px">
              <button class="btn bp" style="flex:1" data-ex="${eid}" onclick="startCardioTimer(this.dataset.ex,${mins})">▶ Iniciar ${mins}${NB}min</button>
              <button class="btn bs" style="width:130px" data-ex="${eid}" onclick="toggleSet(this.dataset.ex,0);render()">Marcar hecho</button>
            </div>`;
          }
          return`<button class="btn bp" data-ex="${eid}" onclick="toggleSet(this.dataset.ex,0);render()">✓ Marcar como hecho</button>`;
        })()}`}
      </div>`:''}
    </div>`;
  }).join('');
  const _hw=healthWarnHtml(); // (E11b) aviso fijo de salud, arriba
  return`${_hw}
  <div class="topbar"><div class="topbar-row"><div><h1>${esc(day.label)}</h1><div class="sub">${esc(day.focus)}${(()=>{
    const rs=reopenedFor(S.day);
    return rs?` · <span style="color:var(--amber)">↩ reabierta (${esc(rs.session.date||'')})</span>`:'';
  })()}${(()=>{
    if(!S.sessionStartTs)return'';
    const elapsedMin=Math.floor((Date.now()-S.sessionStartTs)/60000);
    if(elapsedMin>MAX_SESSION_MIN)return''; // entreno reanudado mucho después: no mostrar contador absurdo
    if(elapsedMin<1)return' · <span style="color:var(--green)">● en curso</span>';
    return` · <span style="color:var(--green)" id="live-dur" data-start="${S.sessionStartTs}">● ${elapsedMin} min</span>`;
  })()}</div></div><span class="pill p${S.day.toLowerCase()}">${doneEx}/${strEx.length}</span></div></div>
  <div class="pbar" style="border-radius:0;height:3px"><div class="pinner" style="width:${pct}%;border-radius:0"></div></div>
  <div class="tabs">${tabs}</div>
  ${lightBannerHtml('workout')}
  ${allDone?`<div class="fbanner">🎉 ¡Todos los ejercicios completados! Guarda la sesión cuando termines el cardio.</div>`:''}
  ${exHtml}
  ${live?`<div style="padding:4px 14px 14px"><button class="btn ${allDone?'bp':'bs'}" onclick="finishSession()">${allDone?'✅ Guardar entrenamiento':'Guardar entrenamiento (incompleto)'}</button></div>`
    :`<div class="card wo-empty"><div class="empty"><div class="eic" aria-hidden="true">📝</div><p>Este día aún no tiene ejercicios. Mientras esté vacío, no entra en tu rotación.</p></div>
      <button type="button" class="btn bp" data-dk="${esc(S.day)}" onclick="addExerciseUI(this.dataset.dk)">Añadir ejercicio</button></div>`}
  `;
}

// ── NOMBRE, DÍA Y COLOR DE UN EJERCICIO CON HISTORIAL (también si ya no está en la rutina) ──
// (E1a) un color por día (A…F): D ámbar, E violeta y F lima, que no se confunden con A (azul), B (rosa) ni C (menta)
const DAY_COLORS={A:'var(--blue)',B:'var(--pink)',C:'var(--green)',D:'var(--amber)',E:'var(--violet)',F:'var(--lime)'};
function _origPlanEx(id){
  for(const dk of Object.keys(PLAN)){const e=PLAN[dk].ex.find(x=>x.id===id);if(e)return{ex:e,day:dk};}
  return null;
}
// Nombre visible de un id de S.strength. Nunca el id interno («A3», «ex_…»):
// plan actual > nombre guardado en sus registros (n, el más reciente) > plan original > biblioteca >
// propuesta de cambio aplicada > «Ejercicio retirado (grupo)».
function exDisplayName(id){
  const ex=findExInPlan(id);
  if(ex&&typeof ex.n==='string'&&ex.n.trim())return ex.n.trim();
  const recs=S.strength&&S.strength[id];
  if(Array.isArray(recs))for(let i=recs.length-1;i>=0;i--){const r=recs[i];if(r&&typeof r.n==='string'&&r.n.trim())return r.n.trim();}
  const o=_origPlanEx(id);if(o)return o.ex.n;
  const lib=LIB_BY_ID.get(id);if(lib)return lib.n;
  const ap=(S.appliedProposals||[]).find(p=>p&&p.type==='swap'&&p.exId===id&&typeof p.diff==='string'&&p.diff.includes(' → '));
  if(ap){const n=ap.diff.split(' → ')[0].trim();if(n)return n;}
  const mus=Array.isArray(recs)?(recs.slice().reverse().find(r=>r&&r.muscle)||{}).muscle:null;
  const ml=mus?(MUSCLE_GROUPS.find(m=>m.id===mus)||{}).label:null;
  return ml?`Ejercicio retirado (${ml})`:'Ejercicio retirado';
}
// Día al que pertenece (para su color y su orden): plan actual > plan original > el día de las sesiones en que se registró
function exDayOf(id){
  const d=_dayOfEx(id);if(d)return d;
  const o=_origPlanEx(id);if(o)return o.day;
  const recs=S.strength&&S.strength[id];
  if(!Array.isArray(recs)||!recs.length)return null;
  const ss=S.sessions||[],cnt={};
  recs.slice(-12).forEach(r=>{
    if(!r)return;
    let s=null;
    if(r.ts)s=ss.find(x=>x&&x.ts===r.ts)||ss.find(x=>x&&x.ts&&Math.abs(x.ts-r.ts)<2*3600000);
    if(!s&&r.d)s=ss.find(x=>x&&x.date===r.d);
    if(s&&DAY_COLORS[s.day])cnt[s.day]=(cnt[s.day]||0)+1;
  });
  let best=null;Object.keys(cnt).forEach(k=>{if(!best||cnt[k]>cnt[best])best=k;});
  return best;
}
function exColorOf(id){return DAY_COLORS[exDayOf(id)]||'var(--text2)';}
// Antes de quitar o cambiar un ejercicio, su último registro se queda con el nombre (registros antiguos sin n)
function _stampExName(ex){
  if(!ex||!ex.id||!ex.n)return;
  const arr=S.strength&&S.strength[ex.id];
  if(!Array.isArray(arr)||!arr.length)return;
  const last=arr[arr.length-1];
  if(last&&typeof last==='object'&&!(typeof last.n==='string'&&last.n.trim()))last.n=String(ex.n).slice(0,120);
}
// Tarjetas de fuerza de Progreso en el orden de la rutina: Día A, B, C (cada uno en su orden del plan y luego
// los que ya no están en la rutina, del más reciente al más antiguo); los de día desconocido, al final.
function progStrengthList(){
  const plan=getPlan(),order={};
  // (11) el de tu rutina sustituido hoy «solo hoy» sigue en su sitio
  Object.keys(plan).forEach(dk=>(plan[dk]&&Array.isArray(plan[dk].ex)?plan[dk].ex:[]).forEach((e,i)=>{if(order[e.id]==null)order[e.id]=i;const o=e&&e.sub&&e.sub.orig;if(o&&order[o.id]==null)order[o.id]=i;}));
  const di=d=>{const k=DAY_KEYS.indexOf(d);return k<0?9:k;}; // (E1a) A…F
  return Object.entries(S.strength||{}).filter(([,d])=>Array.isArray(d)&&d.length>0).map(([id,data])=>{
    const day=exDayOf(id),inPlan=order[id]!=null;
    const lastTs=(data[data.length-1]&&data[data.length-1].ts)||0;
    return{id,data,day,inPlan,name:exDisplayName(id),color:DAY_COLORS[day]||'var(--text2)',k:[di(day),inPlan?0:1,inPlan?order[id]:-lastTs]};
  }).sort((a,b)=>a.k[0]-b.k[0]||a.k[1]-b.k[1]||a.k[2]-b.k[2]);
}

