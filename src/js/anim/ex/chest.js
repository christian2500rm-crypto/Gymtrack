/* ex/chest.js */
/* Pecho: press inclinado (Smith / mancuernas), aperturas (máquina, cable bajo/alto), flexiones */
(function(GA){
const C=GA._.COL,V=GA._.V,fpt=GA._.fpt,fdir=GA._.fdir,DM=GA._.DIM;
const ells=b=>{const P=b.pf,T=b.tf,H=b.hf,m=V.mul,S=b.S;
  const sm=V.lerp(S.L.sho,S.R.sho,.5),sax=m(V.sub(S.R.sho,S.L.sho),.51);
  return{pel:[fpt(P,0,.035,-.014),[m(P.R,.152),m(P.U,.1),m(P.F,.108)]],
    glu:[fpt(P,.066,-.01,-.066),[m(P.R,.07),m(P.U,.085),m(P.F,.062)]],
    tho:[fpt(T,0,.15,.012),[m(T.R,.155),m(T.U,.165),m(T.F,.115)]],
    shd:[V.add(V.madd(sm,T.U,-.035),m(T.F,-.012)),[sax,m(T.U,.07),m(T.F,.088)]],
    hair:[V.add(b.headC,fdir(H,0,.04,-.045)),[m(H.R,.086),m(H.U,.1),m(H.F,.094)]]};};
const slerp=(a,b,t)=>{const w=Math.acos(Math.max(-1,Math.min(1,V.dot(a,b))));if(w<1e-4)return V.norm(V.lerp(a,b,t));
  const s=Math.sin(w);return V.add(V.mul(a,Math.sin((1-t)*w)/s),V.mul(b,Math.sin(t*w)/s));};
const gap=(e,o,n)=>V.dot(V.sub(e[0],o),n)-Math.sqrt(e[1].reduce((s,a)=>s+V.dot(a,n)**2,0));
const recline=(b,bn,tilt)=>{b.pelvis([0,0,0],{tilt});let e=ells(b);const h=bn.hinge,nB=bn.n,up=[0,1,0];
  const gS=Math.min(gap(e.glu,h,up),gap(e.pel,h,up)),gB=Math.min(gap(e.tho,h,nB),gap(e.shd,h,nB));
  const dy=-gS,dx=(-gB-nB[1]*dy)/nB[0];b.pelvis([dx,dy,0],{tilt});e=ells(b);
  return{e,gP:Math.min(gap(e.pel,h,nB),gap(e.glu,h,nB)),gH:gap(e.hair,h,nB)};};
const seatBench=(b,E,bn,o)=>{b.spine(o.fx);b.scap('both',o.el,o.pr);
  if(!o.k){b.head(0);const t=E.solve(t=>recline(b,bn,t).gP-.004,o.t0-25,o.t0+20);
    const h=E.solve(h=>{b.head(h);return recline(b,bn,t).gH-.002;},-25,25);o.k=[t,h];}
  b.head(o.k[1]);return recline(b,bn,o.k[0]);};
const chest=(b,u,r)=>{const T=b.tf,a=.155,c=.165,d=.115;const f=d*Math.sqrt(Math.max(0,1-(u/c)**2-(r/a)**2));
  return[fpt(T,r,.15+u,.012+f),V.norm(fdir(T,r/(a*a),u/(c*c),f/(d*d)))];};
const elbX=(sh,tg,X,hi)=>{const L1=DM.ua,L2=DM.fa+DM.grip,d=V.sub(tg,sh),D=V.len(d),a=V.mul(d,1/D);
  const ca=(L1*L1+D*D-L2*L2)/(2*L1*D),c0=V.madd(sh,a,L1*ca),rho=L1*Math.sqrt(Math.max(0,1-ca*ca));
  const e1=V.norm(V.perp([0,-1,0],a)),e2=V.cross(a,e1),A=rho*e1[0],B=rho*e2[0];
  const bs=Math.atan2(B,A),dd=Math.acos(Math.max(-1,Math.min(1,(X-c0[0])/Math.hypot(A,B))));let best=null;
  for(const ph of[bs+dd,bs-dd]){const el=V.add(c0,V.add(V.mul(e1,rho*Math.cos(ph)),V.mul(e2,rho*Math.sin(ph))));if(!best||(hi?el[1]>best[1]:el[1]<best[1]))best=el;}
  return best;};
const smith=(E,BX,y)=>{const RZ=.62,TOP=2.15;
  for(const k of[-1,1]){E.beam([BX,0,k*RZ],[BX,TOP,k*RZ],.055,C.frame);
    E.beam([BX-.6,.03,k*RZ],[BX+.62,.03,k*RZ],.07,C.frameD,{layer:-1});
    E.boxA([BX,y,k*RZ],[.1,.13,.1],C.frameD);E.cyl([BX+.02,y+.02,k*(RZ-.06)],[BX+.09,y+.06,k*(RZ-.06)],.012,C.chrome);}
  E.beam([BX,TOP,-RZ-.03],[BX,TOP,RZ+.03],.07,C.frame);
  E.bar([BX,y,-1.02],[BX,y,1.02],{r:.0145});
  for(const k of[-1,1]){E.cyl([BX,y,k*.67],[BX,y,k*.7],.04,C.chrome);
    E.plate([BX,y,k*.735],[0,0,1],.225);E.plate([BX,y,k*.79],[0,0,1],.165,{th:.035});}};

const SB1={t0:-52,fx:-10,el:-.015,pr:-.035};
GA.def('lib_press_incline_smith',{
  title:'Press inclinado en Smith',
  cam:{yaw:58,pitch:28},
  fitBox:[[-.55,0,-.4],[.7,1.45,.4]],
  muscles:{upperpecs:1,pecs:.6,frontdelts:.6,triceps:.5},
  labels:['Pectoral superior','Deltoides ant.'],
  init:{p:0,act:.5},
  timeline:[
    {p:1,dur:2.2,label:'Baja al pecho superior',act:.8},
    {dur:.3,label:'Toca suave · sin rebote',act:.9},
    {p:0,dur:1.1,label:'Empuja vertical',act:1},
    {dur:.6,label:'Arriba · sin bloquear',act:.5}
  ],
  build(c,b,E){
    const p=c.p,INC=30,GW=.36;
    const bn=E.bench({at:[0,0,0],dir:0,h:.45,seat:.42,back:.92,inc:INC});
    seatBench(b,E,bn,SB1);
    const[q,n]=chest(b,.075,0),bot=V.madd(q,n,.017),BX=bot[0];
    const sh=b.sho('R'),R=.626,yTop=sh[1]+Math.sqrt(R*R-(BX-sh[0])**2-(GW-sh[2])**2);
    const y=E.mix(yTop,bot[1],p);
    for(const s of['R','L']){const k=s==='R'?1:-1;const pole=V.sub(elbX(b.sho(s),[BX,bot[1],k*GW],BX),b.sho(s));
      b.arm(s,[BX,y,k*GW],V.add(pole,b.tdir(0,-.18*Math.sin(Math.PI*p),0)),[0,0,1]);}
    for(const s of['R','L']){const k=s==='R'?1:-1,hp=b.hip(s);
      b.footFlat(s,[hp[0]+.4,0,k*.26],-k*14);b.leg(s,null,[1,.6,k*.4]);}
    smith(E,BX,y);
    E.trace('barra',[BX,y,1.02]);
    E.shadow([.1,0,0],.9,.5,.55);
  }
});

const SB2={t0:-42,fx:-10,el:-.015,pr:-.03};
GA.def('lib_press_incline_db',{
  title:'Press inclinado con mancuernas',
  cam:{yaw:72,pitch:21},
  fitBox:[[-.45,0,-.3],[.78,1.52,.35]],
  muscles:{upperpecs:1,frontdelts:.7,triceps:.5},
  labels:['Pectoral superior','Deltoides ant.'],
  init:{p:0,act:.5},
  timeline:[
    {p:1,dur:2.5,label:'Baja en 2,5 s',act:.8},
    {dur:.3,label:'Pausa · estira el pecho',act:.9},
    {p:0,dur:1.2,label:'Empuja arriba y adentro',act:1},
    {dur:.5,label:'Arriba · sin chocar',act:.5}
  ],
  build(c,b,E){
    const p=c.p,INC=40;
    const bn=E.bench({at:[0,0,0],dir:0,h:.45,seat:.4,back:.9,inc:INC});
    seatBench(b,E,bn,SB2);
    const[q]=chest(b,.08,0);
    for(const s of['R','L']){const k=s==='R'?1:-1,sh=b.sho(s),R=.627;
      const hb=V.norm(V.add(b.tdir(k*.665,-.665,0),b.tdir(0,0,-.342)));   // abajo: codo a 45° del torso, 20° bajo el plano
      const tz=k*.155,tx=E.mix(sh[0],q[0],.55),top=[tx,sh[1]+Math.sqrt(R*R-(tx-sh[0])**2-(tz-sh[2])**2),tz];
      const eb=V.madd(sh,hb,DM.ua),bot=V.madd(eb,[0,1,0],DM.fa+DM.grip),q1=E.clamp(1-p,0,1),ax=b.tdir(k,-.2,0);
      const g=[E.mix(bot[0],top[0],q1)+.1*Math.sin(Math.PI*q1),E.mix(bot[1],top[1],q1),E.mix(bot[2],top[2],Math.pow(q1,1.5))+k*.02*Math.sin(Math.PI*q1)];  // ligera J hacia los pies, converge
      b.arm(s,g,[0,-1,0],ax);   // codo lo más bajo posible → antebrazo vertical en todo el recorrido
      E.dumbbell(b.j(s,'grip'),ax,{r:.056});
      if(s==='R')E.trace('mancuerna',V.madd(b.j(s,'grip'),ax,.13));}
    for(const s of['R','L']){const k=s==='R'?1:-1,hp=b.hip(s);
      b.footFlat(s,[hp[0]+.42,0,k*.27],-k*14);b.leg(s,null,[1,.6,k*.4]);}
    E.shadow([.05,0,0],.85,.45,.55);
  }
});

const FLY={abd:76,elbow:18,open:-15};
GA.def('lib_fly_machine',{
  title:'Aperturas en máquina',
  cam:{yaw:68,pitch:26},
  fitBox:[[-.25,0,-.3],[.55,1.68,.3]],
  muscles:{pecs:1,frontdelts:.5},
  labels:['Pectoral','Deltoides ant.'],
  init:{p:0,act:.5},
  timeline:[
    {p:1,dur:1.5,label:'Cierra en arco',act:1},
    {dur:1,label:'Aprieta 1 s',act:1},
    {p:0,dur:2.8,label:'Abre lento · estira',act:.7},
    {dur:.4,label:'Estiramiento cómodo',act:.5}
  ],
  build(c,b,E){
    const p=c.p,SY=.46,BXP=-.19;
    b.spine(-5);b.head(-2);b.scap('both',-.01,-.03);
    recline(b,{hinge:[BXP,SY,0],n:[1,0,0]},5);
    const fk=(s,hz)=>b.armFK(s,{abd:FLY.abd,hz,elbow:FLY.elbow,grip:[0,1,0]});
    if(FLY.cl==null)FLY.cl=E.solve(h=>{fk('R',h);return b.j('R','grip')[2]-.034;},20,110);
    const hz=E.mix(FLY.open,FLY.cl,p),PY=1.62,top=[];
    for(const s of['R','L']){fk(s,hz);const sh=b.sho(s),g=b.j(s,'grip');
      const pv=[sh[0],PY,sh[2]],BY=PY-.07,el=[sh[0],BY,sh[2]],cn=[g[0],BY,g[2]];
      E.cyl(V.add(pv,[0,-.05,0]),V.add(pv,[0,.05,0]),.04,C.frameD);E.cyl(pv,el,.022,C.frame);
      E.sph(el,.028,C.frame);E.cyl(el,cn,.02,C.frame);E.sph(cn,.022,C.frame);E.cyl(cn,[g[0],g[1]+.1,g[2]],.017,C.frame);
      E.cyl([g[0],g[1]-.09,g[2]],[g[0],g[1]+.1,g[2]],.023,C.rubber);
      if(s==='R')E.trace('maneral',g);top.push(pv);}
    for(const s of['R','L']){const k=s==='R'?1:-1,hp=b.hip(s);
      b.footFlat(s,[hp[0]+.44,0,k*.2],-k*10);b.leg(s,null,[1,.3,k*.25]);}
    const RX=BXP-.36,CY=PY-.03;
    E.pad([-.18,SY-.04,0],[.24,SY-.04,0],.36,.08,C.pad,{up:[0,1,0],layer:-1});
    E.pad([BXP-.04,SY+.06,0],[BXP-.04,SY+.82,0],.3,.08,C.pad,{up:[1,0,0],layer:-1});
    E.beam([.0,0,0],[.0,SY-.08,0],.07,C.frame);E.beam([BXP-.08,SY+.3,0],[RX,SY+.3,0],.05,C.frame);
    E.beam([-.95,.03,0],[.77,.03,0],.08,C.frameD,{layer:-1});E.beam([.74,.03,-.3],[.74,.03,.3],.06,C.frameD,{layer:-1});
    E.beam([RX,0,0],[RX,PY+.09,0],.09,C.frame);E.beam([RX,PY+.09,0],[top[0][0]+.06,PY+.09,0],.07,C.frame);
    E.beam([top[0][0],PY+.09,-.24],[top[0][0],PY+.09,.24],.07,C.frame);
    const J=[RX+.05,CY,0],tan=(c,k)=>{const dx=J[0]-c[0],dz=J[2]-c[2],a=Math.atan2(dz,dx),w=Math.acos(.06/Math.hypot(dx,dz));
      const q=[a+w,a-w].map(t=>[c[0]+.06*Math.cos(t),CY,c[2]+.06*Math.sin(t)]);return q[0][2]*k>q[1][2]*k?q[0]:q[1];};
    for(const t of top){const k=t[2]>0?1:-1;E.beam([t[0],PY+.05,t[2]],[t[0],PY+.13,t[2]],.06,C.frameD);
      E.disc([t[0],CY,t[2]],[0,1,0],.06,.025,C.frameD);E.cable(J,tan(t,k));}
    const lift=(hz-FLY.open)*Math.PI/180*.06*2;
    const SX=RX-.05,SZ=.42;E.beam([SX,0,SZ],[SX,PY,SZ],.05,C.frame);E.beam([SX,PY,SZ],[RX,PY,0],.05,C.frame);E.beam([SX-.3,.03,SZ],[SX+.25,.03,SZ],.06,C.frameD,{layer:-1});
    const st=E.stack([SX,0,SZ],{h:1.4,lift,n:12,sel:5,yaw:90,w:.24,bias:.15});
    E.pulley([SX,CY-.04,SZ-.04],[1,0,0],.04);E.cable(st,[SX,CY-.04,SZ]);E.pulley(J,[0,1,0],.03);E.cable([SX,CY,SZ-.04],J);
    E.shadow([-.1,0,0],.75,.45,.55);
  }
});

const RCH=Math.sqrt(.09+.1089+2*.3*.33*Math.cos(18*Math.PI/180));     // alcance con codo a 18°
const onSph=(sh,P0,F)=>{const q=V.sub(P0,sh),bq=V.dot(F,q),cq=V.dot(q,q)-RCH*RCH;return V.madd(P0,F,-bq+Math.sqrt(Math.max(0,bq*bq-cq)));};
const flyArms=(b,E,p,dS,dE,TX,PH,gr)=>{const out=[];
  for(const s of['R','L']){const k=s==='R'?1:-1,sh=b.sho(s),a=dS(s,k),z=dE(s,k);
    const d=slerp(a,z,p),n=V.norm(V.cross(a,z)),T=V.norm(V.cross(n,d)),pul=[TX,PH,k*.88];
    const tg=V.madd(sh,d,RCH);b.arm(s,tg,V.add(V.neg(T),[0,-.35,0]));
    const cd=V.norm(V.sub(pul,tg)),ax=V.norm(V.perp(gr,cd));b.S[s].gripAx=ax;
    const clip=V.madd(tg,cd,.085);E.handle(tg,ax);for(const j of[-1,1])E.line(V.madd(tg,ax,j*.055),clip,.008,'#2a2f35');
    const t0=V.madd(sh,a,RCH),L0=V.dist(pul,V.madd(t0,V.norm(V.sub(pul,t0)),.085));
    out.push({pul,clip,lift:(V.dist(pul,clip)-L0)/2,k});}
  return out;};
const towers=(E,TX,PH,cb)=>{const TZ=1;
  for(const c of cb){const k=c.k,z=k*TZ,pz=k*.88;
    for(const dx of[-.16,.16])E.beam([TX+dx,0,z],[TX+dx,2.3,z],.06,C.frame);
    E.beam([TX-.16,2.3,z],[TX+.16,2.3,z],.06,C.frame);E.beam([TX-.4,.03,z],[TX+.4,.03,z],.07,C.frameD,{layer:-1});
    E.cyl([TX,.12,pz],[TX,2.15,pz],.014,C.chrome);E.beam([TX,.12,z],[TX,.12,pz],.04,C.frameD);E.beam([TX,2.15,z],[TX,2.15,pz],.04,C.frameD);
    const st=E.stack([TX,0,z],{h:1.95,lift:c.lift,n:16,sel:5,yaw:90,w:.26});E.cable(st,[TX,2.2,z]);E.cable([TX,2.2,z],[TX,2.2,pz]);E.cable([TX+.02,2.2,pz],[TX+.02,c.pul[1]+.06,pz]);
    const cd=V.norm(V.sub(c.clip,c.pul));let nn=V.cross([0,1,0],cd);nn=V.len(nn)>.05?V.norm(nn):[1,0,0];
    E.boxA([TX,c.pul[1],pz],[.06,.12,.06],C.frameD);E.pulley(V.madd(c.pul,cd,.03),nn,.042);
    E.cable(V.madd(c.pul,cd,.03),c.clip);}
  E.beam([TX,2.3,-TZ],[TX,2.3,TZ],.07,C.frame);};

GA.def('lib_cable_fly_low',{
  title:'Apertura en cable bajo',
  cam:{yaw:62,pitch:7},
  fitBox:[[-.4,0,-.55],[.5,1.85,.55]],
  muscles:{upperpecs:1,frontdelts:.6},
  labels:['Pectoral superior','Deltoides ant.'],
  init:{p:0,act:.5},
  timeline:[
    {p:1,dur:1.3,label:'Sube en arco al centro',act:1},
    {dur:.8,label:'Aprieta arriba',act:1},
    {p:0,dur:2.5,label:'Baja lento · controla',act:.7},
    {dur:.4,label:'Abajo · estira',act:.5}
  ],
  build(c,b,E){
    const p=c.p,TX=-.2;
    for(const s of['R','L']){const k=s==='R'?1:-1;b.footFlat(s,[-.06,0,k*.15],-k*8);}
    b.pelvis([-.03,.94,0],{tilt:9});b.spine(-3);b.head(-5);b.scap('both',-.012,-.012);
    for(const s of['R','L'])b.leg(s,null,[1,0,(s==='R'?1:-1)*.12]);
    const cb=flyArms(b,E,p,(s,k)=>V.norm(b.tdir(k*.47,-.86,-.14)),
      (s,k)=>V.norm(V.sub(onSph(b.sho(s),b.tpt(k*.08,-.02,0),b.tdir(0,0,1)),b.sho(s))),TX,.24,b.tdir(1,0,0));
    towers(E,TX,.24,cb);
    E.trace('maneral',b.j('R','grip'));
    E.shadow([-.03,0,0],.45,.35,.55);
  }
});

GA.def('lib_cable_fly_high',{
  title:'Apertura en cable alto',
  cam:{yaw:60,pitch:6},
  fitBox:[[-.45,0,-.55],[.45,2.1,.55]],
  muscles:{lowerpecs:1,pecs:.7},
  labels:['Pectoral inferior','Pectoral'],
  init:{p:0,act:.5},
  timeline:[
    {p:1,dur:1.3,label:'Baja en arco al centro',act:1},
    {dur:1,label:'Aprieta 1 s',act:1},
    {p:0,dur:2.5,label:'Abre lento · controla',act:.7},
    {dur:.4,label:'Arriba · estira',act:.5}
  ],
  build(c,b,E){
    const p=c.p,TX=-.38;
    b.footFlat('L',[.16,0,-.13],10);b.footBall('R',[-.3,.022,.15],-10,24);
    b.pelvis([-.04,.9,0],{tilt:20});b.spine(-3);b.head(-8);b.scap('both',-.01,-.01);
    b.leg('L',null,[1,.1,-.12]);b.leg('R',null,[1,-.1,.12]);
    const cb=flyArms(b,E,p,(s,k)=>V.norm([-.12,.17,k*.98]),
      (s,k)=>V.norm(V.sub(onSph(b.sho(s),b.tpt(k*.05,-.24,0),b.tdir(0,0,1)),b.sho(s))),TX,2.0,[0,1,0]);
    towers(E,TX,2.0,cb);
    E.trace('maneral',b.j('R','grip'));
    E.shadow([-.05,0,0],.5,.35,.55);
  }
});

const PU={};
GA.def('lib_pushup',{
  title:'Flexiones (push-up)',
  cam:{yaw:28,pitch:14},
  muscles:{pecs:1,triceps:.6,frontdelts:.5,abs:.3},
  labels:['Pectoral','Tríceps','Deltoides ant.'],
  init:{p:0,act:.5},
  timeline:[
    {p:1,dur:2,label:'Baja en 2 s · cuerpo recto',act:.8},
    {dur:.2,label:'Pecho cerca del suelo',act:.9},
    {p:0,dur:1,label:'Empuja el suelo',act:1},
    {dur:.4,label:'Arriba · separa escápulas',act:.5}
  ],
  build(c,b,E){
    const p=c.p,XT=-1.0,ZF=.1,ZH=.31,HY=.029,up=[0,1,0];
    const pose=(th,pr)=>{const fa=th-76,f=V.xy(fa),u=V.xy(fa+90),ld=V.xy(th);
      const h0=V.sub(V.mul(f,-DM.heel),V.mul(u,DM.ankH));                       // talón respecto al tobillo
      const c1=V.add(V.madd(h0,f,.125),V.mul(u,.004)),c2=V.add(V.madd(h0,f,.125),V.mul(u,.036));
      const ay=-Math.min(c1[1]-Math.hypot(.142*f[1],.012*u[1]),c2[1]-Math.hypot(.138*f[1],.042*u[1]));
      const ax=XT-V.madd(h0,f,.26)[0];                                          // punta del pie fija en XT
      b.pelvis(V.madd([ax,ay,0],ld,.8695),{tilt:90-th});b.spine(1);b.head(-6);b.scap('both',-.01,pr);
      for(const s of['R','L']){b.foot(s,[ax,ay,(s==='R'?1:-1)*ZF],f,u);b.leg(s,null,b.pdir(0,0,1));}};
    const clr=()=>{const e=ells(b);return Math.min(gap(e.tho,[0,0,0],up),gap(e.shd,[0,0,0],up));};
    if(PU.tb==null){PU.tb=E.solve(t=>{pose(t,-.02);return clr()-.065;},-10,30);
      const S=b.sho('R');                                                       // mano bajo el codo (antebrazo vertical) con codo a ~40°
      const elb=X=>elbX(S,[X,HY,ZH],X,1);
      PU.xh=E.solve(X=>{const h=V.norm(V.sub(elb(X),S));return Math.atan2(V.dot(h,b.tf.R),-V.dot(h,b.tf.U))*180/Math.PI-40;},S[0]-.35,S[0]+.05);
      PU.pole=V.sub(elb(PU.xh),S);
      PU.tt=E.solve(t=>{pose(t,.03);return .628-V.dist(b.sho('R'),[PU.xh,HY,ZH]);},PU.tb,45);}
    pose(E.mix(PU.tt,PU.tb,p),E.mix(.03,-.02,p));
    for(const s of['R','L']){const k=s==='R'?1:-1,H=[PU.xh,HY,k*ZH];
      b.arm(s,H,[PU.pole[0],PU.pole[1],k*PU.pole[2]],[0,0,1]);
      E.ell([PU.xh+.05,.011,k*(ZH+.008)],[[.09,0,k*.012],[0,.011,0],[0,0,.05]],C.skin,{grp:'fa'+s});}
    E.shadow([-.15,0,0],1.0,.35,.5);
  }
});

})(window.GymAnim);
