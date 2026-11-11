/* ex/_kit.js */
/* Kit reutilizable (NO registra ejercicios): equipamiento con medidas reales + posturas genéricas. API en KIT.md.
   Metros, Y arriba, la persona mira a +X y su derecha es +Z. Equipamiento K.xxx(E,…) dibuja con E.* y devuelve los
   puntos de contacto; posturas K.xxx(b,…) colocan el cuerpo en el orden pelvis → columna → cabeza → escápulas → miembros. */
(function(GA){
'use strict';
const I=GA._,V=I.V,C=I.COL,DM=I.DIM,fpt=I.fpt,fdir=I.fdir,D=Math.PI/180,UP=[0,1,0],TAU=Math.PI*2;
const clamp=(x,a,b)=>x<a?a:x>b?b:x,mix=(a,b,t)=>a+(b-a)*t,sst=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const SS=[['R',1],['L',-1]],sd=s=>s==='R'?1:-1;
const K=I.kit={D,SS,sd,mix,clamp,sst};
const KC=K.COL={iron:'#2b2f35',wood:'#9a7653',woodD:'#5f4632',foam:'#3b4a5c',strap:'#24282d',rope:'#4a5057',tape:'#17191c',
  ball:'#3d7cc0',mat:'#283a4a',grip:'#1f2328',bumper:'#24282e',step:'#3a4048'};
K.BAND={yellow:'#e2c044',red:'#d2493f',green:'#3fa564',blue:'#3a78d0',black:'#30343a',purple:'#8a58c8',orange:'#e07a32'};

const MEMO=new WeakMap();
K.memo=(ctx,key,fn)=>{if(!ctx||typeof ctx!=='object'||typeof ctx.build!=='function')throw Error('K.memo: pasa el spec (this) desde build(c,b,E){…}, no desde una flecha');
  let m=MEMO.get(ctx);if(!m)MEMO.set(ctx,m={});return key in m?m[key]:(m[key]=fn());};
K.root=(f,lo,hi,tol)=>{tol=tol||2e-5;let a=lo,b=hi,fa=f(a),fb=f(b),c=a,side=0;if(fa*fb>0)return I.solve(f,lo,hi);
  for(let i=0;i<14;i++){c=(fa*b-fb*a)/(fa-fb);const fc=f(c);if(Math.abs(fc)<tol)break;
    if(fc*fb>0){b=c;fb=fc;if(side<0)fa/=2;side=-1;}else{a=c;fa=fc;if(side>0)fb/=2;side=1;}}
  return c;};
K.legD=kf=>Math.sqrt(DM.th*DM.th+DM.sh*DM.sh+2*DM.th*DM.sh*Math.cos(kf*D));        // cadera→tobillo con rodilla flexionada kf°
K.armD=ef=>{const a=DM.ua,f=DM.fa+DM.grip;return Math.sqrt(a*a+f*f+2*a*f*Math.cos(ef*D));};   // hombro→puño con codo ef°
K.kneeFor=d=>Math.acos(clamp((d*d-DM.th*DM.th-DM.sh*DM.sh)/(2*DM.th*DM.sh),-1,1))/D;      // inversa de legD
K.com=(b,xm)=>{let m=0,s=[0,0,0];const add=(p,w)=>{s=V.madd(s,p,w);m+=w;};
  add(b.headC,.081);add(V.lerp(b.pf.o,V.lerp(b.sho('L'),b.sho('R'),.5),.5),.497);
  for(const k of['L','R']){const S=b.S[k];
    if(S.elb){add(V.lerp(S.sho,S.elb,.44),.028);add(V.lerp(S.elb,S.grip,.5),.022);}else add(V.madd(S.sho,UP,-.3),.05);
    if(S.kne){add(V.lerp(S.hip,S.kne,.43),.1);add(V.lerp(S.kne,S.ank,.43),.047);add(S.ank,.015);}else add(V.madd(S.hip,UP,-.45),.162);}
  if(xm)for(const[p,w]of xm)add(p,w);return V.mul(s,1/m);};

const ext=(e,n)=>Math.sqrt(e[1].reduce((s,a)=>s+V.dot(a,n)**2,0));
K.ells=b=>{const P=b.pf,L=b.lf,T=b.tf,H=b.hf,m=V.mul,S=b.S,hc=b.headC,sm=V.lerp(S.L.sho,S.R.sho,.5);
  const e=(c,a,u,f,F)=>[c,[m(F.R,a),m(F.U,u),m(F.F,f)]];
  return{pel:e(fpt(P,0,.035,-.014),.152,.1,.108,P),gluR:e(fpt(P,.066,-.01,-.066),.07,.085,.062,P),gluL:e(fpt(P,-.066,-.01,-.066),.07,.085,.062,P),
    lum:e(fpt(L,0,.075,.012),.136,.12,.1,L),tho:e(fpt(T,0,.15,.012),.155,.165,.115,T),
    shd:[V.add(V.madd(sm,T.U,-.035),m(T.F,-.012)),[m(V.sub(S.R.sho,S.L.sho),.51),m(T.U,.07),m(T.F,.088)]],
    head:e(hc,.078,.108,.096,H),face:e(V.add(hc,fdir(H,0,-.052,.028)),.062,.058,.072,H),hair:e(V.add(hc,fdir(H,0,.04,-.045)),.086,.1,.094,H),
    hipR:sp(S.R.hip,.084),hipL:sp(S.L.hip,.084),shoR:sp(S.R.sho,.062),shoL:sp(S.L.sho,.062)};};   // raíz de muslos y brazos (de lado)
const sp=(c,r)=>[c,[[r,0,0],[0,r,0],[0,0,r]]];
const TORSO=['pel','gluR','gluL','lum','tho','shd','hipR','hipL','shoR','shoL'],HEAD=['head','face','hair'];
K.TORSO=TORSO;K.HEAD=HEAD;
K.gap=(e,o,n)=>V.dot(V.sub(e[0],o),n)-ext(e,n);                       // holgura elipsoide ↔ plano (o,n)
K.sgap=(e,c,r)=>{const d=V.sub(e[0],c),l=V.len(d)||1e-6;return l-r-ext(e,V.mul(d,1/l));};  // ≈ holgura con una esfera
K.low=(b,parts,o,n)=>{const E=K.ells(b);let g=1e9;for(const k of parts||TORSO)g=Math.min(g,K.gap(E[k],o||[0,0,0],n||UP));return g;};
K.shift=(b,d)=>{b.pf={o:V.add(b.pf.o,d),R:b.pf.R,U:b.pf.U,F:b.pf.F};b._torso();return b;};
K.rest=(b,parts,o,n)=>{n=n||UP;const g=K.low(b,parts,o||[0,0,0],n);K.shift(b,V.mul(n,-g));return-g;};
K.restBall=(b,parts,c,r)=>{for(let i=0;i<5;i++){const E=K.ells(b);let g=1e9;for(const k of parts||TORSO)g=Math.min(g,K.sgap(E[k],c,r));K.shift(b,[0,-g,0]);}return b;};
K.frame=(b,pos,U,F)=>{U=V.norm(U);F=V.norm(V.perp(F,U));b.pf={o:pos.slice(),R:V.cross(F,U),U,F};b._torso();return b;};
const trunk=(b,o)=>{const sp=o.sp||[],hd=o.hd,sc=o.sc||[];b.spine(sp[0]||0,sp[1]||0,sp[2]||0);
  if(Array.isArray(hd))b.head(hd[0]||0,hd[1]||0,hd[2]||0);else b.head(typeof hd==='number'?hd:0);b.scap('both',sc[0]||0,sc[1]||0);};
K.trunk=trunk;

K.shoe=(ank,f,u)=>{const sl=V.norm(V.cross(f,u)),h=V.add(ank,V.add(V.mul(f,-DM.heel),V.mul(u,-DM.ankH))),m=V.mul;
  return[[V.add(V.madd(h,f,.125),m(u,.036)),[m(f,.138),m(u,.042),m(sl,.05)]],[V.add(V.madd(h,f,.03),m(u,.06)),[m(f,.05),m(u,.05),m(sl,.046)]],
    [V.add(V.madd(h,f,.125),m(u,.004)),[m(f,.142),m(u,.012),m(sl,.052)]]];};
K.footOn=(b,s,P,f,u,n)=>{n=n||UP;f=V.norm(f);u=V.norm(V.perp(u,f));let lo=1e9;for(const e of K.shoe(P,f,u))lo=Math.min(lo,V.dot(e[0],n)-ext(e,n));
  b.foot(s,V.madd(P,n,V.dot(P,n)-lo),f,u);return b.j(s,'ank');};
K.footBallOn=(b,s,P,yaw,pitch,n)=>{const f0=V.yaw(yaw||0),sv=V.norm(V.cross(UP,f0)),a=(pitch||0)*D,f=V.rot(f0,sv,a),u=V.rot(UP,sv,a);
  const an=V.add(P,V.add(V.mul(f,-(DM.toe-.06)),V.mul(u,DM.ankH)));return K.footOn(b,s,[an[0],P[1],an[2]],f,u,n);};
K.legs=(b,o)=>{o=o||{};for(const[s,k]of SS){const f=b.S[s].ffwd||b.pf.F;b.leg(s,null,V.add(V.add(f,V.mul(UP,o.up==null?.15:o.up)),[0,0,k*(o.out||0)]));}return b;};
K.palmT=(P,o)=>{o=o||{};return V.add(V.madd(P,V.norm(o.fd||[1,0,0]),-.05),V.mul(V.norm(o.n||UP),.029));};
K.palm=(b,E,s,P,o)=>{o=o||{};const k=sd(s),fd=V.norm(o.fd||[1,0,0]),n=V.norm(o.n||UP),sv=V.norm(V.cross(fd,n));
  b.arm(s,K.palmT(P,{fd,n}),o.pole||[-1,.25,k*.6],sv);
  if(E&&o.draw!==false)E.ell(V.add(V.madd(P,n,.011),V.mul(sv,k*.008)),[V.add(V.mul(fd,.09),V.mul(sv,k*.012)),V.mul(n,.011),V.mul(sv,.05)],b.col.skin,{grp:'fa'+s});
  return b;};

K.armsFloor=(b,E,o)=>{o=o||{};const Y=o.y||0,R=K.armD(o.elbow==null?6:o.elbow),dn=V.norm(V.perp(V.neg(b.tf.U),UP)),sv=V.norm(V.perp(b.tf.R,UP)),a=(o.spread==null?14:o.spread)*D;
  for(const[s,k]of SS){if(o.sides&&!o.sides.includes(s))continue;const sh=b.sho(s),fd=V.norm(V.add(V.mul(dn,Math.cos(a)),V.mul(sv,k*Math.sin(a)))),dy=sh[1]-Y-.029;
    const t=V.madd([sh[0],Y+.029,sh[2]],fd,Math.sqrt(Math.max(.01,R*R-dy*dy)));K.palm(b,E,s,V.add(V.madd(t,fd,.05),[0,-.029,0]),{fd,pole:[0,1,0]});}
  return b;};

K.stand=(b,o)=>{o=o||{};const fx=o.fx==null?-.05:o.fx,fz=o.fz==null?.12:o.fz,to=o.toe==null?8:o.toe,Y=o.y||0,F=o.feet||{R:[fx,fz],L:[fx,-fz]};
  for(const[s,k]of SS)b.footFlat(s,[F[s][0],F[s][2]==null?Y:F[s][2],F[s][1]],-k*to);
  const A={R:b.j('R','ank').slice(),L:b.j('L','ank').slice()},d=K.legD(o.kf==null?4:o.kf),po={tilt:o.tilt||0,yaw:o.yaw||0,roll:o.roll||0};
  const hyOf=hx=>o.hy!=null?o.hy:Math.min(...SS.map(([s,k])=>A[s][1]+Math.sqrt(Math.max(.01,d*d-(hx-A[s][0])**2-(A[s][2]-k*DM.hipW-(o.z||0))**2))));
  const pose=hx=>{const hy=hyOf(hx);b.pelvis([hx,hy,o.z||0],po);trunk(b,o);K.legs(b,o.pole);if(o.arms)o.arms(b);return hy;};
  let hx=o.x==null?mix(A.R[0],A.L[0],.5)+.03:o.x;const e0=b.ikErr;
  if(o.balance){const bx=o.bx==null?mix(A.R[0],A.L[0],.5)+.045:o.bx;hx=K.root(x=>{pose(x);return K.com(b,typeof o.xm==='function'?o.xm():o.xm)[0]-bx;},bx-.7,bx+.45);}
  b.ikErr=e0;return{x:hx,y:pose(hx)};};

K.lie=(b,o)=>{o=o||{};const fc=o.face||'up',h=o.dir||(fc==='down'?1:-1),Y=o.y||0,O=[0,Y,0],sideF=fc==='L'||fc==='R';
  const place=inc=>{let U=[h,0,0],F=fc==='up'?[0,1,0]:fc==='down'?[0,-1,0]:[0,0,fc==='L'?h:-h];
    if(inc){const U2=[h*Math.cos(inc*D),Math.sin(inc*D),0];F=V.rot(F,V.norm(V.cross(U,U2)),Math.abs(inc)*D);U=U2;}
    if(o.roll)F=V.rot(F,U,o.roll*D);
    K.frame(b,[0,1,0],U,F);trunk(b,Object.assign({},o,{hd:typeof o.hd==='number'?o.hd:0}));K.rest(b,o.parts||TORSO,O);};
  if(o.incl==='auto'||(sideF&&o.incl==null))place(K.root(x=>{place(x);return K.low(b,['pel','gluR','gluL','hipR','hipL'],O)-K.low(b,['shd','shoR','shoL','tho'],O);},-25,25));
  else place(o.incl||0);
  const hd0=typeof o.hd==='number'?o.hd:0,OH=[0,o.headY==null?Y:o.headY,0],hg=x=>{if(sideF)b.head(hd0,o.turn||0,x);else b.head(x,o.turn||0,0);return K.low(b,HEAD,OH)-(o.hd==='rest'?.002:.006);};
  if(o.hd==='rest'||hg(sideF?0:hd0)<0){const x=K.root(hg,-50,50);if(sideF)b.head(hd0,o.turn||0,x);else b.head(x,o.turn||0,0);}
  const ap=o.at==='sho'?V.lerp(b.sho('R'),b.sho('L'),.5):o.at==='head'?b.headC:b.pf.o;
  K.shift(b,[(o.x||0)-ap[0],0,(o.z||0)-b.pf.o[2]]);return b;};
K.supine=(b,o)=>K.lie(b,Object.assign({face:'up'},o));
K.prone=(b,o)=>K.lie(b,Object.assign({face:'down'},o));
K.sideLie=(b,o)=>K.lie(b,Object.assign({face:(o&&o.down)||'L'},o));

const shinBack=(b,s,kn,Y,toes)=>{const f=toes==='tuck'?V.norm([-.3,-1,0]):V.norm([-1,-.24,0]),u=toes==='tuck'?V.norm(V.perp([1,0,0],f)):V.norm(V.perp([0,-1,0],f));
  let lo=1e9;for(const e of K.shoe([0,0,0],f,u))lo=Math.min(lo,e[0][1]-ext(e,UP));const ay=Math.max(Y-lo,Y+.036),dy=ay-kn[1];
  const an=[kn[0]-Math.sqrt(Math.max(.001,DM.sh*DM.sh-dy*dy)),ay,kn[2]];b.legDir(s,V.sub(kn,b.hip(s)),V.sub(an,kn));b.foot(s,b.j(s,'ank'),f,u);};
K.kneel=(b,o)=>{o=o||{};const Y=o.y||0,X=o.x||0,kz=o.kz||.1,al=(o.thigh||0)*D,dz=kz-DM.hipW,tl=Math.sqrt(DM.th*DM.th-dz*dz);
  const hip=[X+tl*Math.sin(al),Y+.056+tl*Math.cos(al),o.z||0],KN={};
  b.pelvis(hip,{tilt:o.tilt||0,yaw:o.yaw||0});trunk(b,o);
  for(const[s,k]of SS){if(o.half===s){const hp=b.hip(s);b.footFlat(s,[hp[0]+(o.fwd==null?.38:o.fwd),Y,k*(o.fz||.13)],-k*6);b.leg(s,null,[1,.5,k*.15]);continue;}
    KN[s]=[X,Y+.056,(o.z||0)+k*kz];shinBack(b,s,KN[s],Y,o.toes);}
  return{knees:KN,hip};};

K.quad=(b,E,o)=>{o=o||{};const Y=o.y||0,X=o.x||0,kz=o.kz||.1,hz=o.hz||.16,al=(o.thigh||0)*D,R=K.armD(o.elbow==null?6:o.elbow);
  const dz=kz-DM.hipW,tl=Math.sqrt(DM.th*DM.th-dz*dz),hip=[X+tl*Math.sin(al),Y+.056+tl*Math.cos(al),0],HY=Y+.029;
  const oo=Object.assign({hd:-14,sc:[0,.012]},o);
  const pose=t=>{b.pelvis(hip,{tilt:t});trunk(b,oo);};
  const t=K.root(t=>{pose(t);const sh=b.sho('R'),tx=o.hx==null?sh[0]:o.hx-.05;return Math.hypot(sh[0]-tx,sh[1]-HY,sh[2]-hz)-R;},150,30);
  pose(t);const KN={},H={};
  for(const[s,k]of SS){KN[s]=[X,Y+.056,k*kz];shinBack(b,s,KN[s],Y,o.toes);H[s]=[o.hx==null?b.sho(s)[0]+.05:o.hx,Y,k*hz];
    if(o.arms!==false&&(typeof o.arms!=='string'||o.arms===s))K.palm(b,E,s,H[s],{pole:[-1,.3,k*.45]});}
  return{hands:H,knees:KN,tilt:t};};

K.plank=(b,E,o)=>{o=o||{};const xT=o.xT==null?-1:o.xT,fy=o.fy||0,hy=o.hy||0,zF=o.zF||.1,zH=o.zH||.3,p=o.p||0,kn=!!o.knees,pr=o.pr||[.03,-.02],ca=o.k||{};
  const dz=zF-DM.hipW,LL=Math.sqrt(K.legD(2)**2-dz*dz),LT=Math.sqrt(DM.th*DM.th-dz*dz),oo=Object.assign({sp:[1],hd:-6},o);
  const pose=(th,q)=>{const ld=V.xy(th);
    if(kn){b.pelvis(V.madd([xT,fy+.056,0],ld,LT),{tilt:90-th});trunk(b,oo);b.scap('both',-.01,q);
      for(const[s,k]of SS){const K0=[xT,fy+.056,k*zF];b.legDir(s,V.sub(K0,b.hip(s)),V.xy(180-(o.shin==null?35:o.shin)));b.footRelax(s,30);}return;}
    const f=V.xy(th-76),u=V.xy(th+14);let lo=1e9;for(const e of K.shoe([0,0,0],f,u))lo=Math.min(lo,e[0][1]-ext(e,UP));
    const tip=V.sub(V.mul(f,DM.toe),V.mul(u,DM.ankH)),A=[xT-tip[0],fy-lo,0];
    b.pelvis(V.madd(A,ld,LL),{tilt:90-th});trunk(b,oo);b.scap('both',-.01,q);
    for(const[s,k]of SS){b.foot(s,[A[0],A[1],k*zF],f,u);b.leg(s,null,b.pdir(0,0,1));}};
  const HP=x=>[x-.05,hy+.029,zH];
  if(o.forearm){const EY=hy+.042,q=mix(pr[0],pr[1],p),th=K.root(t=>{pose(t,q);return b.sho('R')[1]-EY-DM.ua;},-15,45);
    pose(th,q);const ex=b.sho('R')[0],ez=b.sho('R')[2];
    for(const[s,k]of SS)b.armVia(s,[ex,EY,k*ez],[ex+.328,hy+.03,k*(ez-.033)],[0,0,1]);return{th,elbows:{R:[ex,EY,ez],L:[ex,EY,-ez]}};}
  if(ca.tb==null){const clr=o.clr==null?.065:o.clr;
    ca.tb=K.root(t=>{pose(t,pr[1]);return Math.min(K.low(b,['tho','shd'],[0,hy,0]),K.low(b,['face','head'],[0,hy,0])+.02)-clr;},-20,40);
    ca.hx=o.hx!=null?o.hx:b.sho('R')[0]-.06;
    for(let i=0;i<(o.hx!=null?1:3);i++){ca.tt=K.root(t=>{pose(t,pr[0]);const S=b.sho('R'),H=HP(ca.hx);return V.dist(S,H)-(o.top||.618);},ca.tb,70);
      if(o.hx==null){pose(ca.tt,pr[0]);ca.hx=b.sho('R')[0]+.05+(o.dhx||0);}}}
  const th=mix(ca.tt,ca.tb,p);pose(th,mix(pr[0],pr[1],p));const H={};
  for(const[s,k]of SS){H[s]=[ca.hx,hy,k*zH];const pl=o.pole||[-.8,.45,.55];K.palm(b,E,s,H[s],{pole:[pl[0],pl[1],k*pl[2]]});}
  return{th,hands:H};};

K.hang=(b,o)=>{o=o||{};const X=o.x||0,Y=o.y==null?2.25:o.y,W=o.w==null?.4:o.w,p=o.p||0,g=o.grip||'pro';
  const tilt=-(o.lean==null?14:o.lean)*p,s0=o.sc0||[.03,.012],s1=o.sc1||[-.02,-.03],sc=[mix(s0[0],s1[0],p),mix(s0[1],s1[1],p)];
  const pl=g==='sup'?[.8,-.4,.35]:g==='neu'?[.45,-.35,.7]:[.15,-.25,1],R0=K.armD(o.e0==null?4:o.e0),ax=g==='neu'?[1,0,0]:[0,0,1];
  const place=(cx,cy)=>{b.pelvis([0,0,0],{tilt});b.spine(o.sp==null?-3*p:o.sp);b.head(o.hd==null?-10*p:o.hd);b.scap('both',sc[0],sc[1]);
    const sm=V.lerp(b.sho('R'),b.sho('L'),.5);K.shift(b,[cx-sm[0],cy-sm[1],-sm[2]]);
    if(o.legs)o.legs(b);else for(const[s,k]of SS){b.legFK(s,{flex:o.hip==null?4+16*p:o.hip,knee:o.knee==null?6+12*p:o.knee,abd:2});b.footRelax(s,32);}
    for(const[s,k]of SS)b.arm(s,[X,Y,k*W],[pl[0],pl[1],k*pl[2]],ax);};
  let cx=X-.05,cy=Y-.6;const e0=b.ikErr;
  for(let i=0;i<3;i++){place(cx,cy);const S=b.S.R.sho,sm=V.lerp(S,b.S.L.sho,.5),chin=b.hpt(0,-.105,.065)[1]-sm[1];
    const dz=W-(S[2]-sm[2]),dx=X-S[0],yB=Y-Math.sqrt(Math.max(.01,R0*R0-dz*dz-dx*dx)),yT=Y+.025-chin;cy=mix(yB,yT,p);
    cx=K.root(x=>{place(x,cy);return K.com(b)[0]-X;},X-.45,X+.3);}
  b.ikErr=e0;place(cx,cy);return{x:cx,y:cy};};

K.support=(b,o)=>{o=o||{};const X=o.x||0,Y=o.y==null?1.2:o.y,W=o.w==null?.26:o.w,p=o.p||0,R=K.armD(mix(o.e0==null?6:o.e0,o.e1==null?92:o.e1,p));
  const tilt=mix(o.lean0==null?6:o.lean0,o.lean1==null?26:o.lean1,p),sc=[mix(-.018,.022,p),mix(.0,.02,p)];
  const place=dx=>{b.pelvis([0,0,0],{tilt});b.spine(o.sp==null?4+4*p:o.sp);b.head(o.hd==null?4:o.hd);b.scap('both',sc[0],sc[1]);
    const S=b.S.R.sho,sm=V.lerp(S,b.S.L.sho,.5),dz=W-(S[2]-sm[2]);K.shift(b,V.sub([X+dx,Y+Math.sqrt(Math.max(.01,R*R-dx*dx-dz*dz)),0],sm));
    if(o.legs)o.legs(b);else for(const[s,k]of SS){b.legFK(s,{flex:o.hip==null?8:o.hip,knee:o.knee==null?70:o.knee,abd:2});b.footRelax(s,28);}
    for(const[s,k]of SS)b.arm(s,[X,Y,k*W],[-1,.15,k*.25],[1,0,0]);};
  const e0=b.ikErr,dx=K.root(d=>{place(d);return K.com(b)[0]-X;},-.25,.3);b.ikErr=e0;place(dx);return{dx};};

K.seat=(b,P,o)=>{o=o||{};b.pelvis([P[0]+(o.dx||0),P[1]+.1,P[2]],{tilt:o.tilt||0,yaw:o.yaw||0});trunk(b,o);
  const parts=o.parts||['pel','gluR','gluL'];if(o.ball)K.restBall(b,parts,o.ball.c,o.ball.r);else K.rest(b,parts,P);
  if(o.legs!==false){const ft=o.feet||{},hp=b.pf.o,fx=ft.x==null?hp[0]+.39:ft.x;
    for(const[s,k]of SS)b.footFlat(s,[fx,ft.y||0,k*(ft.z==null?.15:ft.z)],-k*(ft.toe==null?8:ft.toe));K.legs(b,{up:.6,out:.12});}
  return b.pf.o;};

K.plateTh=r=>r>=.2?.055:r>=.15?.04:.028;
K.plate=(E,c,n,o)=>{o=o||{};n=V.norm(n||UP);const r=o.r||.225,t=o.th||K.plateTh(r);E.plate(c,n,r,{th:t,col:o.col,layer:o.layer});return{c,n,r,th:t,top:V.madd(c,n,t/2)};};

K.kbR=kg=>clamp(.085+((kg||16)-8)*.04/24,.07,.14);
K.kettlebell=(E,h,o)=>{o=o||{};const r=K.kbR(o.kg),up=V.norm(o.up||UP),ax=V.norm(V.perp(o.ax||[0,0,1],up)),hw=r*.62+.018,dc=r+.068,col=o.col||KC.iron;
  const c=V.madd(h,up,-dc),go=o.layer?{layer:o.layer}:undefined,horns=[];
  E.sph(c,r,col,go);E.disc(V.madd(c,up,-r+.007),up,r*.5,.014,col,Object.assign({hub:0},go));
  for(const k of[1,-1]){const G=V.madd(h,ax,k*hw),M=V.add(V.madd(h,up,-.034),V.mul(ax,k*(hw+.01))),A=V.add(V.madd(c,up,r*.74),V.mul(ax,k*r*.56));
    E.cap(G,M,.0165,.0175,col,go);E.cap(M,A,.0175,.022,col,go);horns.push(V.lerp(M,A,.3));}
  E.cap(V.madd(h,ax,-hw),V.madd(h,ax,hw),.0165,.0165,col,go);
  return{h,c,r,up,ax,hw,dc,bot:V.madd(c,up,-r),horns,floorH:dc+r};};
K.kbFloorH=kg=>K.kbR(kg)*2+.068;   // altura del centro del asa con la kettlebell apoyada en el suelo

K.barbell=(E,c,ax,o)=>{o=o||{};ax=V.norm(ax||[0,0,1]);const L=(o.len||2.2)/2,IN=o.inner||.655,P=o.plates||[.225];let R=0;
  E.bar(V.madd(c,ax,-IN),V.madd(c,ax,IN),{r:o.r||.014});
  for(const k of[-1,1]){E.cyl(V.madd(c,ax,k*(IN-.012)),V.madd(c,ax,k*(IN+.018)),.034,C.chrome);E.cyl(V.madd(c,ax,k*(IN+.018)),V.madd(c,ax,k*L),.025,C.chrome);
    let u=IN+.02;for(const q of P){const pp=typeof q==='number'?{r:q}:q,t=pp.th||K.plateTh(pp.r);
      E.plate(V.madd(c,ax,k*(u+t/2)),ax,pp.r,{th:t,col:pp.col||o.col});u+=t+.002;R=Math.max(R,pp.r);}
    if(P.length&&o.clip!==false)E.cyl(V.madd(c,ax,k*u),V.madd(c,ax,k*(u+.028)),.031,'#3a4048');}
  return{c,ax,R,ends:[V.madd(c,ax,L),V.madd(c,ax,-L)],grip:w=>[V.madd(c,ax,w),V.madd(c,ax,-w)]};};

K.ezbar=(E,c,ax,o)=>{o=o||{};ax=V.norm(ax||[0,0,1]);const bd=V.norm(V.perp(o.bend||[-1,0,0],ax)),IN=.33,L=.6,P=o.plates||[.17],PF=[[0,0],[.06,0],[.115,.034],[.18,0],[.235,.034],[.3,0],[IN,0]];
  const pt=(u,v)=>V.add(V.madd(c,ax,u),V.mul(bd,v)),G={narrow:[],wide:[]},A={narrow:[],wide:[]};let R=0;
  for(const k of[1,-1]){for(let i=0;i<PF.length-1;i++){const a=pt(k*PF[i][0],PF[i][1]),z=pt(k*PF[i+1][0],PF[i+1][1]);E.cyl(a,z,.0125,C.chrome);if(i)E.sph(a,.0128,C.chrome);}
    for(const[n,i]of[['narrow',2],['wide',4]]){const a=pt(k*PF[i][0],PF[i][1]),z=pt(k*PF[i+1][0],PF[i+1][1]);G[n].push(V.lerp(a,z,.5));A[n].push(V.norm(V.mul(V.sub(z,a),k)));}
    E.cyl(pt(k*(IN-.01),0),pt(k*(IN+.02),0),.033,C.chrome);E.cyl(pt(k*(IN+.02),0),pt(k*L,0),.025,C.chrome);
    let u=IN+.022;for(const r of P){const t=K.plateTh(r);E.plate(pt(k*(u+t/2),0),ax,r,{th:t});u+=t+.002;R=Math.max(R,r);}}
  return{grips:G,axes:A,R};};

K.trapbar=(E,c,o)=>{o=o||{};const f=V.yaw(o.yaw||0),z=V.yaw((o.yaw||0)-90),hi=o.hi==null?.1:o.hi,y0=c[1]-hi,P=o.plates||[.225];
  const Q=(a,b,y)=>V.add(V.add([c[0],y==null?y0:y,c[2]],V.mul(f,a)),V.mul(z,b)),hx=[[.5,0],[.24,.36],[-.24,.36],[-.5,0],[-.24,-.36],[.24,-.36]];
  for(let i=0;i<6;i++){const a=hx[i],e=hx[(i+1)%6];E.cyl(Q(a[0],a[1]),Q(e[0],e[1]),.017,C.frameD);E.sph(Q(a[0],a[1]),.018,C.frameD);}
  let R=0;const grip=[];
  for(const k of[1,-1]){for(const a of[-.12,.12])E.beam(Q(a,k*.36),Q(a,k*.31,c[1]),.03,C.frameD);
    E.cyl(Q(-.13,k*.31,c[1]),Q(.13,k*.31,c[1]),.016,C.chrome);E.cyl(Q(-.07,k*.31,c[1]),Q(.07,k*.31,c[1]),.0175,KC.grip);grip.push(Q(0,k*.31,c[1]));
    E.cyl(Q(0,k*.36),Q(0,k*.41),.033,C.chrome);E.cyl(Q(0,k*.41),Q(0,k*.82),.025,C.chrome);
    let u=.43;for(const r of P){const t=K.plateTh(r);E.plate(Q(0,k*(u+t/2)),z,r,{th:t});u+=t+.002;R=Math.max(R,r);}}
  return{grip,ax:f,R,base:y0};};

K.rack=(E,o)=>{o=o||{};const X=o.x==null?.45:o.x,Z=o.z||.6,H=o.h||2.25,hy=o.hook==null?1.38:o.hook,dp=o.depth||0,col=o.col||C.frame;
  for(const x of dp?[X,X+dp]:[X])for(const k of[-1,1])E.beam([x,0,k*Z],[x,H,k*Z],.075,col);
  for(const k of[-1,1])E.beam([X-.4,.035,k*Z],[X+dp+(dp?.08:.4),.035,k*Z],.07,C.frameD,{layer:-1});
  if(dp){for(const x of[X,X+dp])E.beam([x,H-.04,-Z-.04],[x,H-.04,Z+.04],.07,col);E.beam([X+dp,.04,-Z],[X+dp,.04,Z],.07,C.frameD,{layer:-1});}
  else{E.beam([X+.3,.04,-Z],[X+.3,.04,Z],.07,C.frameD,{layer:-1});if(o.pull!==false)E.bar([X,H+.02,-Z-.05],[X,H+.02,Z+.05],{r:.016});}
  for(const k of[-1,1]){E.boxA([X-.07,hy-.0495,k*Z],[.09,.075,.07],C.frameD);E.boxA([X-.12,hy-.01,k*Z],[.018,.06,.07],C.frameD);
    if(o.safety)E.beam([X-.65,o.safety,k*(Z-.005)],[X+dp,o.safety,k*(Z-.005)],.05,C.frameD);}
  return{hooks:[[X-.075,hy,Z],[X-.075,hy,-Z]],bar:[X-.075,hy+.002,0],hook:hy,safety:o.safety};};

K.box=(E,c,s,o)=>{o=o||{};const yaw=o.yaw||0,kd=o.kind||'wood',f=V.yaw(yaw),zz=V.yaw(yaw-90),y0=c[1]||0,h=s[1],top=[c[0],y0+h,c[2]],L={yaw,layer:-1};
  const at=(a,y,b)=>V.add(V.add([c[0],y,c[2]],V.mul(f,a)),V.mul(zz,b));
  if(kd==='wood'||kd==='soft'){E.boxA([c[0],y0+h/2,c[2]],s,o.col||(kd==='wood'?KC.wood:KC.foam),Object.assign({round:kd==='soft'?7:0},L));
    if(kd==='wood')for(const k of[-1,1])E.ell(at(0,y0+h*.8,k*(s[2]/2+.002)),[V.mul(f,Math.min(.07,s[0]*.18)),[0,.018,0],V.mul(zz,.001)],KC.woodD,{layer:-1,outline:false});}
  else if(kd==='step'){E.boxA(at(0,y0+h-.025,0),[s[0],.05,s[2]],o.col||KC.step,L);E.boxA(at(0,y0+h-.002,0),[s[0]-.02,.006,s[2]-.02],'#1d2126',Object.assign({outline:false},L));
    for(const k of[-1,1])E.boxA(at(k*(s[0]/2-.1),y0+(h-.05)/2,0),[.16,h-.05,s[2]-.04],'#2a2f35',L);}
  else{const lx=s[0]>=s[2],L2=(lx?s[0]:s[2])/2,W=lx?s[2]:s[0],q=(a,y,w)=>lx?at(a,y,w):at(w,y,a);   // patas a lo largo del lado mayor
    E.pad(q(-L2,y0+h-.04,0),q(L2,y0+h-.04,0),W,.08,o.col||C.pad,{up:UP,layer:-1});
    for(const a of[-1,1]){const u=a*Math.max(L2*.5,L2-.12);E.beam(q(u,y0,0),q(u,y0+h-.08,0),.05,C.frame,{layer:-2});E.beam(q(u,y0+.025,-W*.6),q(u,y0+.025,W*.6),.05,C.frameD,{layer:-2});}}
  return{top,y:y0+h,fwd:f,side:zz};};

K.fitball=(E,c,r,o)=>{o=o||{};r=r||.325;const q=o.sq||0;E.ell(c,[[r*(1+q*.5),0,0],[0,r*(1-q),0],[0,0,r*(1+q*.5)]],o.col||KC.ball,{layer:o.layer==null?-1:o.layer});
  E.shadow([c[0],0,c[2]],r*.85,r*.85,.5);return{c,r,top:V.add(c,[0,r*(1-q),0]),at:d=>V.madd(c,V.norm(d),r)};};

K.abWheel=(E,c,ax,o)=>{o=o||{};ax=V.norm(ax||[0,0,1]);const R=.09;
  E.disc(c,ax,R,.065,'#262a30',{hub:.45});E.disc(c,ax,R*.62,.072,'#4a525d',{hub:.3});
  E.cyl(V.madd(c,ax,-.17),V.madd(c,ax,.17),.009,C.chrome);
  for(const k of[-1,1])E.cyl(V.madd(c,ax,k*.055),V.madd(c,ax,k*.165),.019,KC.grip);
  return{c,ax,R,hands:[V.madd(c,ax,.11),V.madd(c,ax,-.11)]};};

K.band=(E,a,b,o)=>{o=o||{};let pts=Array.isArray(a[0])?a.slice():[a,b];const col=o.col||K.BAND.red;
  if(o.handle){const e=pts[pts.length-1],d=V.norm(V.sub(pts[pts.length-2],e)),ha=V.norm(V.perp(o.handle,d)),ring=V.madd(e,d,.075);
    E.cyl(V.madd(e,ha,-.065),V.madd(e,ha,.065),.017,KC.grip);for(const k of[-1,1])E.line(V.madd(e,ha,k*.066),ring,.006,'#1b1e22');
    E.sph(ring,.008,C.chrome);pts[pts.length-1]=ring;}
  let len=0;for(let i=1;i<pts.length;i++)len+=V.dist(pts[i-1],pts[i]);
  const w=(o.w||.007)/Math.sqrt(Math.max(1,o.L0?len/o.L0:1)),cl=col;   // más fino cuanto más estirado
  for(let i=1;i<pts.length;i++){const A=pts[i-1],B=pts[i];
    if(o.loop){const n=V.norm(V.perp(o.flat||[0,1,0],V.sub(B,A)));for(const k of[-1,1])E.cap(V.madd(A,n,k*.009),V.madd(B,n,k*.009),w,w,cl);}
    else E.cap(A,B,w,w,cl);}
  E.sph(pts[0],w*1.5,cl);return{len,end:pts[pts.length-1]};};

K.miniband=(E,pR,pL,o)=>{o=o||{};const r=o.r||.062,col=o.col||K.BAND.green,sv=V.norm(V.sub(pR,pL)),ax=o.axis&&Array.isArray(o.axis[0])?o.axis:[o.axis,o.axis];let len=0;
  const fr=(a,k)=>{if(!a)return[V.norm(V.perp(o.fwd||[1,0,0],sv)),V.mul(sv,k)];a=V.norm(a);return[V.norm(V.cross(a,sv)),V.mul(V.norm(V.perp(sv,a)),k)];};
  const FR=fr(ax[0],1),FL=fr(ax[1],-1),seg=(a,b)=>{E.cap(a,b,.0095,.0095,col);len+=V.dist(a,b);};
  for(const k of[-1,1])seg(V.madd(pR,FR[0],k*r),V.madd(pL,FL[0],k*r));
  for(const[c,[f,s]]of[[pR,FR],[pL,FL]]){let q=V.madd(c,f,r);for(let i=1;i<=6;i++){const t=Math.PI*i/6,n=V.madd(V.madd(c,f,r*Math.cos(t)),s,r*Math.sin(t));seg(q,n);q=n;}}
  return{len};};

K.trx=(E,anchor,hR,hL,o)=>{o=o||{};const mid=V.lerp(hR,hL,.5),J=V.madd(anchor,V.norm(V.sub(mid,anchor)),o.split||.55),att=[],sc='#1f2327';
  E.beam(anchor,J,.036,sc,{h:.006});E.sph(anchor,.025,C.frameD);E.boxA(J,[.03,.06,.03],C.chrome);
  [hR,hL].forEach((h,i)=>{const d=V.norm(V.sub(J,h)),ax=V.norm(V.perp((o.ax&&o.ax[i])||[0,0,1],d)),top=o.feet?V.madd(h,d,.12):h,P=V.madd(top,d,.1);
    E.beam(V.madd(J,d,-.03),P,.032,sc,{h:.006});E.boxA(V.madd(P,d,.05),[.036,.028,.036],'#d8b23a');
    for(const k of[-1,1])E.line(P,V.madd(top,ax,k*.065),.007,sc);E.cyl(V.madd(top,ax,-.065),V.madd(top,ax,.065),.018,KC.grip);
    if(o.feet){let q=V.madd(top,ax,-.05);for(let j=1;j<=6;j++){const t=Math.PI*j/6,n=V.add(V.madd(h,ax,-.05*Math.cos(t)),V.mul(d,.06-.11*Math.sin(t)));E.line(q,n,.012,sc);q=n;}}
    att.push(P);});
  return{J,att};};

K.pullupBar=(E,o)=>{o=o||{};const X=o.x||0,kd=o.kind||'posts',W=o.w||(kd==='door'?.43:.6);let Y=o.y==null?(kd==='door'?2.0:2.25):o.y;
  if(kd==='door'){const DH=2.05;for(const k of[-1,1]){E.beam([X+.06,0,k*(W+.04)],[X+.06,DH+.04,k*(W+.04)],.08,KC.wood,{h:.12,bias:.05});}
    E.beam([X+.06,DH+.04,-W-.08],[X+.06,DH+.04,W+.08],.08,KC.wood,{h:.12});Y=Math.min(Y,DH-.05);
    for(const k of[-1,1])E.boxA([X+.03,Y,k*(W-.02)],[.06,.06,.04],C.frameD);}
  else if(kd==='tower'){const UX=X-.75;for(const k of[-1,1]){E.beam([UX,0,k*W],[UX,Y+.15,k*W],.075,C.frame);E.beam([UX-.32,.035,k*W],[UX+.4,.035,k*W],.07,C.frameD,{layer:-1});
      E.beam([UX,Y+.12,k*W],[X+.07,Y+.12,k*W],.065,C.frame);E.beam([X,Y+.12,k*W],[X,Y,k*W],.045,C.frameD);}
    for(const y of[Y+.12,.15])E.beam([UX,y,-W],[UX,y,W],.06,C.frameD);}
  else{for(const k of[-1,1]){E.beam([X,0,k*(W+.045)],[X,Y+.14,k*(W+.045)],.07,C.frame);E.beam([X-.55,.035,k*(W+.045)],[X+.5,.035,k*(W+.045)],.07,C.frameD,{layer:-1});}
    E.beam([X,Y+.14,-W-.08],[X,Y+.14,W+.08],.07,C.frame);}
  E.bar([X,Y,-W-.03],[X,Y,W+.03],{r:.016});
  let neutral=null;if(o.neutral){neutral=[];for(const k of[1,-1]){const z=k*o.neutral;E.cyl([X-.12,Y,z],[X+.12,Y,z],.016,C.chrome);E.cyl([X+.01,Y,z],[X+.12,Y,z],.019,KC.grip);neutral.push([X+.065,Y,z]);}}
  return{x:X,y:Y,w:W,grip:w=>[[X,Y,w],[X,Y,-w]],neutral};};

K.dipStation=(E,o)=>{o=o||{};const X=o.x||0,Y=o.y||1.2,W=o.w||.26,L=o.len||.6,Wb=W+.2;
  for(const k of[-1,1]){const z=k*W;E.bar([X-L/2,Y,z],[X+L/2,Y,z],{r:.02});E.cyl([X-.1,Y,z],[X+.1,Y,z],.023,KC.grip);   // funda centrada en el agarre
    for(const x of[X-L/2+.03,X+L/2-.03])E.beam([x,Y-.015,z],[x,.03,k*Wb],.05,C.frame);
    E.beam([X-L/2-.12,.03,k*Wb],[X+L/2+.12,.03,k*Wb],.06,C.frameD,{layer:-1});}
  E.beam([X+L/2+.08,.035,-Wb],[X+L/2+.08,.035,Wb],.05,C.frameD,{layer:-1});
  return{y:Y,w:W,grip:x=>[[x==null?X:x,Y,W],[x==null?X:x,Y,-W]]};};

K.mat=(E,c,s,o)=>{o=o||{};const th=o.th||.008,y=c[1]||0;s=s||[1.8,.6];E.boxA([c[0],y+th/2,c[2]],[s[0],th,s[1]],o.col||KC.mat,{yaw:o.yaw||0,layer:-1,outline:false});return{top:y+th};};

K.landmine=(E,pivot,end,o)=>{o=o||{};const L=o.L||1.95,ax=V.norm(V.sub(end,pivot)),tip=V.madd(pivot,ax,L),col=V.madd(pivot,ax,L-.42),P=o.plates||[.225];
  E.boxA([pivot[0],.012,pivot[2]],[.34,.024,.34],C.frameD,{layer:-1});E.sph(pivot,.045,C.frameD);E.cyl(pivot,V.madd(pivot,ax,.22),.036,C.frame);
  E.bar(V.madd(pivot,ax,.2),col,{r:.014});E.cyl(V.madd(col,ax,-.012),V.madd(col,ax,.018),.034,C.chrome);E.cyl(V.madd(col,ax,.018),tip,.025,C.chrome);
  let u=.022,R=0;for(const r of P){const t=K.plateTh(r);E.plate(V.madd(col,ax,u+t/2),ax,r,{th:t});u+=t+.002;R=Math.max(R,r);}
  return{ax,tip,collar:col,grip:V.madd(tip,ax,-.07),R,L};};

K.medball=(E,c,r,o)=>{o=o||{};const kd=o.kind||'med';r=r||(kd==='wall'?.17:.12);const col=o.col||(kd==='wall'?'#4b5563':kd==='slam'?'#26292e':'#7a3b2e');
  E.sph(c,r,col);if(kd!=='slam')for(const n of[[0,1,0],[1,0,0]]){const a=V.norm(V.perp([0,0,1],n)),bb=V.cross(n,a);let q=null;
    for(let i=0;i<=16;i++){const t=TAU*i/16,p=V.add(c,V.add(V.mul(a,r*1.005*Math.cos(t)),V.mul(bb,r*1.005*Math.sin(t))));if(q)E.line(q,p,.004,kd==='wall'?C.accent:'#2a1a16',{outline:false});q=p;}}
  return{c,r,palm:d=>V.madd(c,V.norm(d),r+.028)};};

K.sled=(E,c,o)=>{o=o||{};const f=V.yaw(o.yaw||0),z=V.yaw((o.yaw||0)-90),y0=c[1]||0,P=(a,y,b)=>V.add(V.add([c[0],y0+y,c[2]],V.mul(f,a)),V.mul(z,b)),H=o.post||1.15;
  for(const k of[-1,1]){E.beam(P(-.5,.02,k*.27),P(.42,.02,k*.27),.05,C.frameD,{layer:-1,h:.035});E.beam(P(.42,.02,k*.27),P(.56,.11,k*.27),.05,C.frameD,{layer:-1,h:.035});}
  for(const a of[-.42,.36])E.beam(P(a,.06,-.3),P(a,.06,.3),.05,C.frame,{layer:-1});E.boxA(P(0,.06,0),[.55,.02,.5],C.frameD,{layer:-1,yaw:o.yaw||0});
  E.cyl(P(0,.07,0),P(0,.5,0),.025,C.chrome);for(let i=0;i<(o.plates==null?2:o.plates);i++)E.plate(P(0,.1+i*.058,0),UP,.225,{th:.055});
  const hi=[],lo=[],ax=[];
  for(const k of[1,-1]){const A=P(-.42,.06,k*.24),B=P(-.5,H,k*.24),d=V.norm(V.sub(B,A));E.beam(A,B,.042,C.frame);E.beam(P(-.42,.5,k*.24),P(-.1,.07,k*.24),.035,C.frame);
    E.cyl(V.madd(B,d,-.2),B,.022,KC.grip);hi.push(V.madd(B,d,-.08));lo.push(V.madd(A,d,.5));ax.push(d);}
  E.beam(P(-.46,.62,-.24),P(-.46,.62,.24),.035,C.frame);
  return{hi,lo,ax,hook:P(.56,.12,0)};};

K.ropeHand=(phase,amp)=>-(amp||.2)*.55*Math.sin(TAU*phase);
K.battleRope=(E,anchor,hand,phase,o)=>{o=o||{};const amp=o.amp||.2,lam=o.lam||1.7,r=o.r||.019,n=o.n||30,dh=V.sub([anchor[0],0,anchor[2]],[hand[0],0,hand[2]]),S=V.len(dh),dn=V.mul(dh,1/S),pts=[];
  const rise=Math.min(1.1,S*.45);
  for(let i=0;i<=n;i++){const s=S*i/n,base=mix(hand[1],anchor[1],sst(0,rise,s)),A=amp*sst(0,.35,s)*(1-.6*s/S)*(1-sst(S-.4,S,s));
    const y=Math.max(r,base+A*Math.sin(TAU*(s/lam-phase)));pts.push([hand[0]+dn[0]*s,i?y:hand[1],hand[2]+dn[2]*s]);}
  const g={grp:'rope'+(o.id||(hand[2]>=0?'R':'L'))};   // un grupo por cuerda: sin contornos entre tramos
  for(let i=1;i<pts.length;i++)E.cap(pts[i-1],pts[i],r,r,KC.rope,g);
  E.cap(V.madd(hand,V.norm(V.sub(pts[3],hand)),-.04),pts[2],.022,.021,KC.tape,g);
  return{pts};};

K.jumpRope=(E,hR,hL,phase,o)=>{o=o||{};const ax=o.ax||[V.norm([0,-1,.35]),V.norm([0,-1,-.35])],tips=[];
  [hR,hL].forEach((h,i)=>{const a=V.norm(ax[i]);E.cyl(V.madd(h,a,-.065),V.madd(h,a,.08),.016,KC.grip);E.cap(V.madd(h,a,.08),V.madd(h,a,.095),.01,.006,C.chrome);tips.push(V.madd(h,a,.095));});
  const axn=V.norm(V.sub(tips[0],tips[1])),d0=V.norm(V.perp([0,-1,0],axn)),d=V.rot(d0,axn,-TAU*phase),my=(tips[0][1]+tips[1][1])/2,Rr=o.R||my-(o.y||0)-.008,pts=[];
  const mid=V.lerp(tips[0],tips[1],.5),hw=V.dist(tips[0],tips[1])/2;   // lazo en U algo más ancho que las manos
  for(let i=0;i<=24;i++){const t=i/24,cs=Math.cos(Math.PI*t),sn=Math.sin(Math.PI*t);pts.push(V.madd(V.madd(mid,axn,cs*(hw+.2*Math.sqrt(sn))),d,Rr*Math.pow(sn,.6)));}
  for(let i=1;i<pts.length;i++)E.line(pts[i-1],pts[i],o.w||.011,o.col||'#c7ced6');
  return{pts,low:pts[12]};};

K.wall=(E,o)=>{o=o||{};const X=o.x==null?1:o.x,H=o.h||2.8,W=o.w||1.2,Z=o.z||0;E.boxA([X+.05,H/2,Z],[.1,H,W*2],o.col||'#26303a',{layer:-2});
  if(o.target){E.disc([X-.003,o.target,Z],[1,0,0],.22,.012,C.frameD,{layer:-1,hub:0});E.disc([X-.008,o.target,Z],[1,0,0],.12,.012,C.accent,{layer:-1,hub:0});}
  return{x:X,n:[-1,0,0]};};

K.rowerGeo=o=>{o=o||{};const X=o.x==null?.95:o.x,fa=48*D,f=[Math.cos(fa),Math.sin(fa),0],u=[-Math.sin(fa),Math.cos(fa),0],feet={};
  for(const[s,k]of SS)feet[s]={heel:[X-.53,.13,k*.09],f,u};return{X,SY:.36,RY:.3,feet,exit:[X-.27,.63,0],rest:[X-.35,.63,0],hw:.26};};
K.rower=(E,o)=>{o=o||{};const G=K.rowerGeo(o),X=G.X,SY=G.SY,RY=G.RY,sx=o.seatX==null?-.5:o.seatX,FD=C.frameD,FR=C.frame,feet=G.feet;
  E.beam([X-2.35,RY-.025,0],[X-.42,RY-.025,0],.07,'#5b6573',{h:.05,layer:-1});
  E.beam([X-2.28,RY-.05,0],[X-2.28,.03,0],.05,FD,{layer:-1});E.beam([X-2.28,.025,-.27],[X-2.28,.025,.27],.05,FD,{layer:-1});
  E.beam([X-.45,RY-.02,0],[X-.12,.36,0],.075,FR);E.beam([X-.12,.36,0],[X+.08,.04,0],.07,FD);E.beam([X+.08,.025,-.3],[X+.08,.025,.3],.05,FD,{layer:-1});
  E.disc([X,.5,0],[0,0,1],.27,.25,'#2b3036',{hub:.22});E.disc([X,.5,.128],[0,0,1],.2,.008,'#3a414b',{hub:0,outline:false});
  E.beam([X-.08,.72,0],[X-.3,1.02,0],.04,FR);E.boxA([X-.31,1.06,0],[.04,.16,.22],FD,{pitch:-20});E.boxA([X-.334,1.065,0],[.004,.11,.16],C.screen,{pitch:-20,outline:false});
  for(const[s]of SS){const{heel,f,u}=feet[s],c=V.add(V.madd(heel,f,.13),V.mul(u,-.012));
    E.boxA(c,[.32,.016,.13],'#2a2f36',{pitch:48,layer:-1});E.boxA(V.add(V.madd(heel,f,-.015),V.mul(u,.03)),[.02,.06,.13],'#2a2f36',{pitch:48,layer:-1});
    const sp=V.add(V.madd(heel,f,.15),V.mul(u,.085));E.line(V.add(sp,[0,0,-.065]),V.add(sp,[0,0,.065]),.016,'#1d2126');}
  E.beam([X-.47,.08,-.2],[X-.47,.08,.2],.04,FD,{layer:-1});
  E.boxA([sx,SY-.025,0],[.3,.05,.27],C.pad,{layer:-1,round:4});E.boxA([sx,RY+.02,0],[.2,.03,.12],FD,{layer:-1});
  const ex=G.exit,rest=G.rest,hc=o.handle||rest,hw=G.hw;
  E.line(ex,hc,.009,'#1f2327');E.sph(ex,.02,FD);
  E.cyl([hc[0],hc[1],hc[2]-hw],[hc[0],hc[1],hc[2]+hw],.013,C.chrome);for(const k of[-1,1])E.cyl([hc[0],hc[1],hc[2]+k*.1],[hc[0],hc[1],hc[2]+k*.25],.019,KC.grip);
  E.shadow([X-.7,0,0],1.4,.35,.5);
  return{seat:[sx,SY,0],SY,feet,exit:ex,rest,hw};};

K.stairClimber=(E,o)=>{o=o||{};const X=o.x||0,Y0=o.y0==null?.25:o.y0,rs=o.rise||.2,rn=o.run||.25,w=o.w||.56,ph=o.phase||0,n=o.n||5,FD=C.frameD,steps=[];
  const st=i=>({i,x:X+(i-ph)*rn,x1:X+(i-ph+1)*rn,y:Y0+(i-ph)*rs}),ytop=Y0+n*rs;
  for(let i=-1;i<=n+1;i++){const s=st(i);if(s.y<.06||s.y>ytop+.001)continue;
    E.boxA([(s.x+s.x1)/2,s.y-.02,0],[rn-.006,.04,w],'#3b424b',{layer:-1});E.boxA([s.x+.012,s.y+.001,0],[.02,.004,w-.02],C.accent,{layer:-1,outline:false});
    if(s.y+rs<=ytop+.001)E.boxA([s.x1-.008,s.y+rs/2,0],[.012,rs-.04,w],'#262b31',{layer:-1});steps.push(s);}
  const lo=[X-.5,.0],hiP=[X+n*rn+.35,ytop+.15],y0=Math.max(.06,Y0-rs-.03);
  E.boxA([X-.25,y0/2,0],[.5,y0,w+.07],FD,{layer:-1});E.boxA([X-.25,y0+.002,0],[.48,.004,w-.02],'#1d2126',{layer:-1,outline:false});
  const RX0=X-.2,RX1=X+.55,RY=Y0+rs+.95,RS=.1/(RX1-RX0),rz=w/2+.09;
  for(const k of[-1,1]){const z=k*(w/2+.035);E.poly([[lo[0],0,z],[hiP[0],0,z],[hiP[0],ytop-.04,z],[X+n*rn,ytop-.04,z],[X-.05,Y0-rs-.04,z],[X-.05,y0,z],[lo[0],y0,z]],FD,{layer:-1});
    const r0=[RX0,RY,k*rz],r1=[RX1,RY+.1,k*rz];E.bar(r0,r1,{r:.017});E.cyl(V.lerp(r0,r1,.08),V.lerp(r0,r1,.7),.02,KC.grip);
    E.beam([r0[0]+.02,r0[1],r0[2]],[X-.1,y0,k*(w/2+.05)],.035,C.frame);E.beam(r1,[hiP[0]-.11,RY+.14,k*(w/2+.05)],.035,C.frame);}
  E.boxA([hiP[0],ytop/2+.5,0],[.22,ytop+1,w+.12],FD,{layer:-1});E.boxA([hiP[0]-.14,ytop+1.08,0],[.06,.24,.36],C.frame,{pitch:-25});E.boxA([hiP[0]-.172,ytop+1.08,0],[.004,.16,.26],C.screen,{pitch:-25,outline:false});
  E.shadow([X+.4,0,0],1.1,.45,.55);
  const rail=(x,s)=>[x,RY+(x-RX0)*RS,sd(s)*rz];
  return{steps,step:st,rail,railAx:V.norm([1,RS,0]),rs,rn};};

K.airBike=(E,o)=>{o=o||{};const X=o.x||0,th=(o.cyc||0)*TAU,BB=[X+.04,.3,0],CR=.17,SEAT=[X-.28,.9,0],FAN=[X+.6,.55,0],PV=[X+.43,.8],FD=C.frameD,FR=C.frame;
  const ped={},crank={},hand={},hax={};
  for(const[s,k]of SS){const a=th+(s==='L'?Math.PI:0),P=[BB[0]+CR*Math.sin(a),BB[1]+CR*Math.cos(a),k*.14];ped[s]=P;crank[s]=a;
    E.beam([BB[0],BB[1],k*.075],[P[0],P[1],k*.075],.026,FD,{up:[0,0,1]});E.cyl([P[0],P[1],k*.075],[P[0],P[1],k*.19],.01,C.chrome);
    const q=(104+15*Math.sin(a))*D,dv=[Math.cos(q),Math.sin(q),0],z=k*.27,top=[PV[0]+dv[0]*.5,PV[1]+dv[1]*.5,z],bot=[PV[0]-dv[0]*.16,PV[1]-dv[1]*.16,k*.05];
    const cp=[BB[0]+CR*.7*Math.sin(a),BB[1]+CR*.7*Math.cos(a)];
    E.beam([PV[0],PV[1],k*.2],[top[0],top[1],k*.2],.035,FR);E.beam([top[0],top[1],k*.2],top,.03,FR);E.cyl(top,[top[0]+dv[0]*.2,top[1]+dv[1]*.2,z],.019,KC.grip);
    E.beam([PV[0],PV[1],k*.05],bot,.035,FR);E.line(bot,[cp[0],cp[1],k*.05],.014,'#4c5560');E.cyl([cp[0],cp[1],k*.045],[cp[0],cp[1],k*.075],.009,C.chrome);
    hand[s]=[top[0]+dv[0]*.1,top[1]+dv[1]*.1,z];hax[s]=dv;}
  E.cyl([PV[0],PV[1],-.22],[PV[0],PV[1],.22],.02,C.chrome);
  E.disc(FAN,[0,0,1],.33,.2,'#2a2f36',{hub:.15});E.disc(V.add(FAN,[0,0,.104]),[0,0,1],.31,.006,'#3d4550',{hub:0,outline:false});
  for(let i=0;i<8;i++){const q=-th*2.4+i*TAU/8;E.line(V.add(FAN,[0,0,.11]),V.add(FAN,[.28*Math.cos(q),.28*Math.sin(q),.11]),.01,'#59636f',{outline:false});}
  E.beam([X-.62,.04,0],[X+.82,.04,0],.07,FD,{layer:-1});for(const x of[-.6,.8])E.beam([X+x,.03,-.3],[X+x,.03,.3],.06,FD,{layer:-1});
  E.beam([BB[0],BB[1],0],[X-.22,.75,0],.07,FR,{bias:-.04});E.cyl([X-.22,.75,0],[SEAT[0]+.02,SEAT[1]-.03,0],.02,C.chrome);E.beam([X-.6,.05,0],[BB[0],BB[1],0],.06,FR);
  E.beam([BB[0],BB[1],0],[PV[0],PV[1],0],.06,FR);E.beam([X+.8,.05,0],[FAN[0],FAN[1],0],.06,FD);E.cyl([BB[0],BB[1],-.05],[BB[0],BB[1],.05],.04,FD);
  E.ell(SEAT,[[.13,0,0],[0,.035,0],[0,0,.09]],'#3a414b',{layer:-1});E.boxA([PV[0]+.05,PV[1]+.2,0],[.05,.13,.2],FD,{pitch:-30});
  E.shadow([X+.1,0,0],.9,.4,.55);
  return{seat:[SEAT[0],SEAT[1]+.03,0],ped,crank,hand,hax,BB};};

K.skiErg=(E,o)=>{o=o||{};const X=o.x==null?.55:o.x,TY=2.08,FD=C.frameD,top={};
  E.beam([X,.05,0],[X,TY,0],.11,C.frame);E.disc([X+.03,TY-.1,0],[0,0,1],.21,.17,'#2b3036',{hub:.3});
  E.boxA([X-.09,1.5,0],[.04,.15,.2],FD,{pitch:-12});E.boxA([X-.112,1.5,0],[.004,.1,.15],C.screen,{pitch:-12,outline:false});
  E.boxA([X-.45,.025,0],[1.2,.05,.6],FD,{layer:-1});   // plataforma del soporte de suelo (1,2 × 0,6 m)
  for(const[s,k]of SS){const A=[X-.13,TY-.08,k*.12],h=s==='R'?(o.hR||[X-.25,1.2,.17]):(o.hL||[X-.25,1.2,-.17]),ax=V.norm(V.sub(A,h));
    E.pulley(A,[0,0,1],.025);E.line(A,V.madd(h,ax,.08),.008,'#9aa4af');E.cyl(V.madd(h,ax,-.075),V.madd(h,ax,.075),.019,KC.grip);top[s]=A;}
  E.shadow([X-.45,0,0],.75,.42,.5);
  return{top,x:X,base:.05};};
K.standOnFeet=K.stand;K.supineOnFloor=K.supine;K.proneOnFloor=K.prone;K.pushupBody=K.plank;K.seatOnBox=K.seat;K.suspension=K.trx;
{const al=GA.alias;GA.alias=(k,t,p)=>al(k,t,p?Object.assign({_thv:undefined},p):p);}
})(window.GymAnim);
