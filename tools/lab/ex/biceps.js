/* Bíceps: curl en cable (EZ), curl alterno con supinación, concentrado, máquina predicador, martillo */
(function(GA){
const C=GA._.COL,V=GA._.V,D=Math.PI/180;

// de pie, pies a la anchura de cadera, rodillas suaves, tronco erguido, escápulas estables
const stand=(b,o)=>{o=o||{};const x=o.x==null?-.02:o.x;
  for(const s of['R','L']){const k=s==='R'?1:-1;b.footFlat(s,[x-.05,0,k*.12],k*-7);}
  b.pelvis([x,o.y||.93,0],{tilt:o.tilt==null?2:o.tilt});b.spine(o.sp==null?-2:o.sp);b.head(o.hd==null?4:o.hd);b.scap('both',-.01,-.015);
  for(const s of['R','L']){const k=s==='R'?1:-1;b.leg(s,null,[1,0,k*.12]);}};
// curl con codo fijo: húmero casi vertical (dr = deriva adelante, ab = separación lateral), flexión fl;
// fz = componente lateral del antebrazo (fija la anchura del agarre). Devuelve dirección del antebrazo
const curlDir=(b,s,fl,dr,ab,fz)=>{const k=s==='R'?1:-1;
  const u=V.norm([Math.sin(dr*D),-Math.cos(dr*D),k*ab]),el=V.madd(b.sho(s),u,.3);
  if(typeof fz==='function')fz=fz(el);const q=Math.sqrt(1-fz*fz),ph=(dr+fl)*D;
  return{u,el,f:[q*Math.sin(ph),-q*Math.cos(ph),fz]};};

// ═══ CURL DE BÍCEPS EN CABLE (BARRA EZ) ═════════════════════════════════════
// Frente a la polea baja, barra EZ en supinación parcial a la anchura de hombros, codos pegados
// (húmero 9° adelante, fijo), muñecas neutras, tronco quieto, rodillas casi rectas. Abajo codo ~18°
// (barra ~1 cm por delante de los muslos). 1,2 s sube · aprieta · 3 s baja.
GA.def('lib_curl_cable',{
  title:'Curl de bíceps en cable',
  cam:{yaw:34,pitch:8},
  fitBox:[[-.3,0,-.4],[.95,1.8,.4]],
  muscles:{biceps:1,forearms:.4},
  labels:['Bíceps','Antebrazo'],
  timeline:[
    {p:1,dur:1.2,label:'Sube · codos fijos',act:1},
    {dur:.8,label:'Aprieta arriba',act:1},
    {p:0,dur:3,label:'Baja en 3 s',act:.75},
    {dur:.4,label:'Abajo · mantén tensión',act:.55}
  ],
  build(c,b,E){
    const p=c.p,W=.19,AL=18*D;
    stand(b,{tilt:1,hd:5,y:.94});
    const fl=E.mix(16,140,p),dr=9;
    const g={},A={};let fs;
    for(const s of['R','L']){const k=s==='R'?1:-1;
      const r=curlDir(b,s,fl,dr,.1,el=>(k*W-el[2])/.33);A[s]=r;fs=[r.f[0],r.f[1],0];}
    fs=V.norm(fs);const d=V.norm(V.cross([0,0,1],fs));
    const ax={R:V.norm(V.add(V.mul([0,0,1],Math.cos(AL)),V.mul(d,Math.sin(AL)))),L:V.norm(V.add(V.mul([0,0,1],Math.cos(AL)),V.mul(d,-Math.sin(AL))))};
    for(const s of['R','L']){b.armDir(s,A[s].u,A[s].f,ax[s]);g[s]=b.j(s,'grip');}
    // barra EZ: tramos de agarre inclinados, tramo central recto, extremos con tope
    const h=.07,iR=V.madd(g.R,ax.R,-h),oR=V.madd(g.R,ax.R,h),iL=V.madd(g.L,ax.L,h),oL=V.madd(g.L,ax.L,-h);
    const eR=V.madd(oR,[0,0,1],.045),eL=V.madd(oL,[0,0,1],-.045);
    for(const[a,bb]of[[iL,iR],[iR,oR],[oL,iL],[oR,eR],[eL,oL]])E.bar(a,bb,{r:.0125});
    for(const e of[eR,eL])E.sph(e,.017,C.rubber);
    // máquina de poleas: rail con carro en posición baja, torre con pila de pesas
    // columna cerca (cable ~25° de la vertical abajo: tensión desde el inicio, la pila nunca baja al subir)
    const RX=.49,TY=1.9,PY=1.83,P=[RX-.09,.17,0],mid=V.lerp(iL,iR,.5),clip=V.madd(mid,V.norm(V.sub(P,mid)),.03);
    E.cyl(V.madd(mid,[0,0,1],-.015),V.madd(mid,[0,0,1],.015),.02,C.frameD);E.sph(clip,.013,C.chrome);
    E.beam([RX,0,0],[RX,TY,0],.08,C.frame);
    E.boxA([RX-.045,.2,0],[.05,.16,.13],C.frameD);
    E.beam([RX-.06,.17,0],[P[0]+.01,P[1],0],.03,C.frameD);
    E.pulley(P,[0,0,1],.04);
    const TX=.85;for(const k of[-1,1])E.beam([TX,0,k*.22],[TX,TY,k*.22],.06,C.frame,{bias:.2});
    E.beam([RX-.04,TY,0],[TX+.04,TY,0],.07,C.frame);
    E.beam([RX-.19,.03,0],[TX+.12,.03,0],.08,C.frameD,{layer:-1});
    for(const k of[-1,1])E.beam([TX,.03,k*.3],[TX,.03,-k*.3],.08,C.frameD,{layer:-1});
    const tan=V.madd(P,V.norm(V.sub(clip,P)),.04);
    E.cable(tan,clip);
    const lift=Math.max(0,V.dist(P,clip)-.6724+.03);
    const top=E.stack([TX,0,0],{h:1.6,lift,n:14,sel:5,yaw:0,w:.26,bias:.25});
    E.pulley([RX+.04,PY,0],[0,0,1],.04);E.pulley([TX-.04,PY,0],[0,0,1],.04,{bias:.2});
    E.cable([RX+.04,PY+.04,0],[TX-.04,PY+.04,0]);E.cable([TX,PY,0],[TX,top[1]+.02,0],{bias:.2});
    E.shadow([0,0,0],.45,.3,.55);
  }
});

// curl alterno con mancuernas (canales R/L; el resaltado sigue al brazo que trabaja). sup: supinación neutro→palma arriba
const altCurl=(c,b,E,M,o)=>{
  stand(b);
  for(const s of['R','L']){const k=s==='R'?1:-1,v=c[s];
    const m=.3+.7*E.sstep(0,.1,v);M['biceps_'+s]=m;M['forearms_'+s]=o.fa*m;
    const r=curlDir(b,s,E.mix(10,o.top,v),E.mix(2,8,v*v),.12,k*E.mix(.12,o.fz,E.sstep(.15,1,v)));
    const n0=V.norm(V.cross([0,0,1],r.f));
    const ax=o.sup?V.rot(n0,r.f,k*90*D*E.sstep(.1,.75,v)):n0;
    b.armDir(s,r.u,r.f,ax);const g=b.j(s,'grip');
    E.dumbbell(g,ax,{r:.06,hl:.065});}
  E.shadow([0,0,0],.4,.3,.55);};
const altTL=(up,down)=>[
  {R:1,p:1,dur:1.1,label:up+' · der.',act:1},
  {dur:.5,label:'Aprieta arriba',act:1},
  {R:0,p:0,dur:2.5,label:down,act:.75},
  {L:1,dur:1.1,label:up+' · izq.',act:1},
  {dur:.5,label:'Aprieta arriba',act:1},
  {L:0,dur:2.5,label:down,act:.75}];

// ═══ CURL CON MANCUERNAS (ALTERNO, CON SUPINACIÓN) ══════════════════════════
// Abajo agarre neutro (mango hacia delante), codo pegado. Sube supinando hasta palma arriba
// (mango cruzado), aprieta, baja en 2,5 s volviendo a neutro; luego el otro brazo.
const MDB={biceps_R:1,biceps_L:1,forearms_R:.4,forearms_L:.4};
GA.def('lib_curl_db',{
  title:'Curl con mancuernas',
  cam:{yaw:58,pitch:8},
  muscles:MDB,
  labels:['Bíceps','Antebrazo'],
  init:{R:0,L:0,act:.75},
  timeline:altTL('Sube y supina','Baja en 2,5 s · a neutro'),
  build(c,b,E){altCurl(c,b,E,MDB,{sup:1,top:140,fz:-.06,fa:.4});}
});

// ═══ CURL MARTILLO ══════════════════════════════════════════════════════════
// Agarre neutro todo el recorrido (pulgar arriba), codos pegados, alterno, hasta ~135°, baja en 2,5 s.
const MHM={biceps_R:1,biceps_L:1,forearms_R:.7,forearms_L:.7};
GA.def('lib_hammer_curl',{
  title:'Curl martillo (mancuernas)',
  cam:{yaw:40,pitch:8},
  muscles:MHM,
  labels:['Bíceps','Braquial','Antebrazo'],
  init:{R:0,L:0,act:.75},
  timeline:altTL('Sube · pulgar arriba','Baja en 2,5 s'),
  build(c,b,E){altCurl(c,b,E,MHM,{sup:0,top:135,fz:0,fa:.7});}
});

// ═══ CURL CONCENTRADO ═══════════════════════════════════════════════════════
// Sentado en el extremo del banco, piernas abiertas, tronco inclinado desde la cadera. Codo/tríceps
// derecho apoyado en la cara interna del muslo junto a la rodilla, brazo vertical, mancuerna supinada.
// Sube hasta el hombro, aprieta 1 s, baja en 3 s a extensión completa. Mano izquierda en el muslo.
GA.def('lib_curl_db_concentrated',{
  title:'Curl concentrado (mancuerna)',
  cam:{yaw:70,pitch:12},
  muscles:{biceps_R:1},
  labels:['Bíceps'],
  init:{act:.5},
  timeline:[
    {p:1,dur:1.3,label:'Sube hacia el hombro',act:1},
    {dur:1,label:'Aprieta 1 s',act:1},
    {p:0,dur:3,label:'Baja en 3 s · estira',act:.75},
    {dur:.4,label:'Abajo · brazo recto',act:.5}
  ],
  build(c,b,E){
    const p=c.p,HX=-.12,HY=.455;
    E.bench({at:[-.5,0,0],dir:0,h:.38,seat:.5,back:.7,inc:0});
    const pose=tl=>{b.pelvis([HX,HY,0],{tilt:tl});b.spine(2,4,0);b.head(-12,-12);b.scap('R',-.008,.015);return b.sho('R');};
    pose(44);const leg={};
    for(const s of['R','L']){const k=s==='R'?1:-1,H=b.hip(s),K0=[.27,.49,k*.31];
      const td=V.norm(V.sub(K0,H)),K=V.madd(H,td,E.DIM.th);
      const sy=-(K[1]-.075)/E.DIM.sh,sh=Math.sqrt(1-sy*sy),sd=V.add(V.mul(V.norm([.9,0,k*.35]),sh),[0,sy,0]);
      b.legDir(s,td,sd);b.foot(s,b.j(s,'ank'),V.yaw(-k*22),[0,1,0]);leg[s]={H,K,td};}
    // codo contra la cara interna del muslo derecho cerca de la rodilla; la inclinación del tronco
    // se ajusta para que hombro-codo = húmero (brazo casi vertical)
    const L=leg.R,m=V.norm(V.cross(L.td,[0,-1,0]));
    const el=V.add(V.madd(V.madd(L.H,L.td,.8*E.DIM.th),m,.092),[0,.03,0]);
    const S=pose(E.solve(tl=>V.dist(el,pose(tl))-E.DIM.ua,30,60));
    const u=V.norm(V.sub(el,S)),h=V.norm(V.perp([.9,0,-.4],u));
    // sube al frente del hombro/pecho derecho (135°); abajo la muñeca algo menos supinada (-18°) y supina al subir
    const th=E.mix(8,135,p)*D,f=V.add(V.mul(u,Math.cos(th)),V.mul(h,Math.sin(th)));
    const ax=V.rot(V.norm(V.cross(u,h)),f,-18*D*(1-E.sstep(0,.6,p)));
    b.armDir('R',u,f,ax);E.dumbbell(b.j('R','grip'),ax,{r:.055,hl:.06});
    // antebrazo izquierdo apoyado a lo largo del muslo izquierdo, mano sobre la rodilla
    const LL=leg.L,SL=b.sho('L'),eL=t=>V.add(V.madd(LL.H,LL.td,t),[0,.095,0]),tL=E.solve(t=>V.dist(eL(t),SL)-E.DIM.ua,.05,.4),fL=V.norm(V.add(LL.td,[0,-.12,0]));
    b.armDir('L',V.sub(eL(tL),SL),fL,V.norm(V.cross(fL,[0,1,0])));
    E.shadow([0,0,0],.6,.45,.5);
  }
});

// ═══ CURL EN MÁQUINA (PREDICADOR) ═══════════════════════════════════════════
// Sentado, pecho contra el borde superior del cojín inclinado (~45°), parte posterior de los brazos
// apoyada, codos alineados con el eje de la palanca, agarre supino. De ~15° (sin hiperextender) a ~130°.
GA.def('lib_curl_machine',{
  title:'Curl en máquina',
  cam:{yaw:38,pitch:12},
  fitBox:[[-.4,0,-.5],[.68,1.32,.42]],
  muscles:{biceps:1,forearms:.3},
  labels:['Bíceps','Antebrazo'],
  init:{act:.5},
  timeline:[
    {p:1,dur:1.3,label:'Sube sin despegar los brazos',act:1},
    {dur:.7,label:'Aprieta arriba',act:1},
    {p:0,dur:3,label:'Baja en 3 s',act:.75},
    {dur:.4,label:'Abajo · sin bloquear',act:.5}
  ],
  build(c,b,E){
    const p=c.p,SY=.46,HX=-.1,AA=45*D;
    b.pelvis([HX,SY+.09,0],{tilt:18});b.spine(6);b.head(-6);b.scap('both',0,.03);
    for(const s of['R','L']){const k=s==='R'?1:-1;b.footFlat(s,[.36,0,k*.15],k*-8);b.leg(s,null,[1,.2,k*.15]);}
    const u=[Math.sin(AA),-Math.cos(AA),0],n=[Math.cos(AA),Math.sin(AA),0];
    const th=E.mix(15,122,p)*D,f=V.add(V.mul(u,Math.cos(th)),V.mul(n,Math.sin(th)));
    for(const s of['R','L'])b.armDir(s,u,f,[0,0,1]);
    const el=b.j('R','elb'),PV=[el[0],el[1]],g=b.j('R','grip');
    // cojín de brazos: cara superior bajo la parte posterior de los brazos, borde superior en el pecho
    const sR=b.sho('R'),A0=[sR[0]-n[0]*.047,sR[1]-n[1]*.047,0];
    const ch=b.tpt(0,-.13,.13),tc=E.solve(t=>{const q=V.madd(A0,u,t);return(q[0]-ch[0])-(ch[1]-q[1])*.15;},0,.3);
    const T=V.madd(A0,u,tc),T2=V.madd(A0,u,.07),Bt=V.madd(A0,u,.33),TH=.08;
    // 3 tramos (cada brazo se pinta encima): central hasta el pecho, laterales hasta la axila
    for(const z of[-.187,0,.187]){const dz=[0,0,z],A=z?T2:T;
      E.pad(V.add(V.madd(A,n,-TH/2),dz),V.add(V.madd(Bt,n,-TH/2),dz),.187,TH,C.pad,{up:n,bias:.05});
      E.cyl(V.add(V.madd(A,n,-.035),[0,0,z-.094]),V.add(V.madd(A,n,-.035),[0,0,z+.094]),.038,C.pad,{bias:.05});}
    const pc=V.madd(V.lerp(T,Bt,.6),n,-TH);
    E.beam(pc,[.42,0,0],.07,C.frame,{layer:-1});
    // asiento
    E.pad([HX-.24,SY-.04,0],[HX+.2,SY-.04,0],.36,.08,C.pad,{up:[0,1,0],layer:-1});
    E.beam([HX,0,0],[HX,SY-.08,0],.07,C.frame,{layer:-1});
    E.beam([HX-.35,.03,0],[.85,.03,0],.08,C.frameD,{layer:-1});
    for(const x of[HX-.3,.8])E.beam([x,.03,-.4],[x,.03,.4],.07,C.frameD,{layer:-1});
    // ejes de giro en los codos (soportes montados en el bastidor del cojín) + palancas + barra de agarre
    const ZP=.33;E.beam([pc[0],pc[1],-ZP],[pc[0],pc[1],ZP],.05,C.frame,{layer:-1});
    for(const k of[-1,1]){const P=[PV[0],PV[1],k*ZP];
      E.beam([pc[0],pc[1],k*ZP],[P[0],P[1]-.04,k*ZP],.045,C.frame);
      E.cyl(V.add(P,[0,0,-.03]),V.add(P,[0,0,.03]),.04,C.frameD,{hub:.3});
      E.beam(P,[g[0],g[1],k*ZP],.032,C.frameD);E.beam(P,V.madd(P,f,-.1),.032,C.frameD);}
    E.cyl([PV[0],PV[1],ZP+.03],[PV[0],PV[1],ZP+.045],.016,C.accent);
    E.bar([g[0],g[1],-ZP],[g[0],g[1],ZP],{r:.015});
    for(const k of[-1,1])E.cyl([g[0],g[1],k*.12],[g[0],g[1],k*.25],.019,C.rubber);
    // leva (izq.) → polea superior → pila lateral: elevación = radio × ángulo
    const CR=.09,cz=-ZP-.06,cm=[PV[0],PV[1],cz];
    E.disc(cm,[0,0,1],CR,.03,C.frameD,{hub:.25});E.sph(V.madd(V.add(cm,[0,0,-.016]),f,-CR*.62),.012,C.accent);
    const lift=CR*(th-15*D),TX=PV[0]-CR,TZ=-.72,TY=1.22;
    for(const dx of[-.2,.2])E.beam([TX+dx,0,TZ],[TX+dx,TY+.05,TZ],.055,C.frame);
    E.beam([TX-.22,TY+.05,TZ],[TX+.22,TY+.05,TZ],.06,C.frame);E.beam([TX,TY+.05,TZ],[TX,TY+.05,cz],.05,C.frame);
    E.beam([TX-.25,.03,TZ],[TX+.25,.03,TZ],.07,C.frameD,{layer:-1});E.beam([TX,.03,TZ],[TX,.03,-.4],.07,C.frameD,{layer:-1});
    const top=E.stack([TX,0,TZ],{h:1.1,lift,n:11,sel:5,yaw:90,w:.28});
    E.pulley([TX,TY,cz],[1,0,0],.04);E.pulley([TX,TY,TZ],[1,0,0],.04);
    E.cable([TX,PV[1],cz],[TX,TY,cz]);E.cable([TX,TY,cz],[TX,TY,TZ]);E.cable([TX,TY,TZ],[TX,top[1]+.02,TZ]);
    E.shadow([.1,0,-.1],.7,.5,.55);
  }
});

})(window.GymAnim);
