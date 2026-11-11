/* Core con material: TRX y fitball (pike, rodillas al pecho, planchas), crunch y pase de fitball, rueda abdominal,
   escaladores, toques de hombro, plancha lateral y caminata de oso */
(function(GA){
const K=GA._.kit,V=GA._.V,C=GA._.COL,DM=GA._.DIM,SS=K.SS,mix=K.mix,sst=K.sst,D=K.D,UP=[0,1,0],M=Math;
const T4=(d1,l1,d2,l2,d3,l3,d4,l4)=>[{p:1,dur:d1,label:l1,act:1},{dur:d2,label:l2,act:1},{p:0,dur:d3,label:l3,act:.75},{dur:d4,label:l4,act:.5}];
const ISO=(a,b)=>[{p:1,dur:2,label:a,act:.85,ease:'sin'},{p:0,dur:2,label:b,act:1,ease:'sin'}];
const CORE={abs:1,obliques:.4,frontdelts:.4},PIKE={abs:1,frontdelts:.5,obliques:.35,triceps:.25};
// boca abajo sobre las manos: palmas en [hx,y,±hz]; hombros en el arco de los brazos (ang° desde la vertical, + hacia los pies),
// tronco a be° (pelvis→hombros sobre la horizontal); piernas por FK (hf flexión de cadera, kf rodilla)
// (o.S: punto medio de los hombros dado, p. ej. sobre los codos)
const PR=(b,o)=>{const q=o.be*D;K.frame(b,[0,1,0],[M.cos(q),M.sin(q),0],[M.sin(q),-M.cos(q),0]);K.trunk(b,o);
  const m=V.lerp(b.sho('R'),b.sho('L'),.5),dz=o.hz-(b.sho('R')[2]-m[2]),T=K.palmT([o.hx||0,o.y||0,o.hz]),R=K.armD(o.e==null?5:o.e),r=M.sqrt(R*R-dz*dz),a=(o.ang||0)*D;
  K.shift(b,V.sub(o.S||[T[0]-r*M.sin(a),T[1]+r*M.cos(a),0],m));
  for(const[s,k]of SS){b.legFK(s,{flex:o.hf||0,knee:o.kf||0,abd:o.ab||0});b.footRelax(s,o.fr||0);}};
// tronco resuelto para que las puntas de los pies apoyen en el suelo (y)
const TOES=(b,o,y)=>{const g=be=>{o.be=be;PR(b,o);let m=1e9;for(const[s]of SS)for(const e of K.shoe(b.S[s].ank,b.S[s].ffwd,b.S[s].fup))m=M.min(m,K.gap(e,[0,y||0,0],UP));return m;};
  const e0=b.ikErr;g(K.root(g,-12,60));b.ikErr=e0;};
// antebrazos: codo bajo el hombro (o en el punto dado) hacia los puños G
const FORE=(b,EL,G)=>{for(const[s,k]of SS)b.armVia(s,EL[s],G[s],[0,0,1]);};
const BRE=q=>({sp:[4],hd:-8,sc:[.003*q,.02+.022*q]});
const palms=(b,E,o)=>{for(const[s,k]of SS)K.palm(b,E,s,[o.hx||0,o.y||0,k*o.hz],{pole:[-.8,.45,k*.55]});};
const amid=b=>V.lerp(b.j('R','ank'),b.j('L','ank'),.5);

// ═══ TRX: pies en las cunas, manos en el suelo. La correa (TL desde el anclaje TA) lleva los tobillos por un arco ═══
// q(p) da {hf,kf,ang}; el tronco se resuelve para que los tobillos queden en la correa. Inicio: plancha alta recta (be0)
const TRX=(me,b,E,p,q)=>{const o0={hx:0,hz:.17,sp:[2],hd:-6,sc:[-.005,.025],fr:22},B0=6;
  const G=K.memo(me,'g',()=>{PR(b,Object.assign({be:B0},o0));const a=amid(b),A=[a[0]+.06,2.3,0];return{A,L:V.dist(A,a)};});
  const o=Object.assign({},o0,q(p)),f=be=>{o.be=be;PR(b,o);return V.dist(amid(b),G.A)-G.L;};
  const e0=b.ikErr;f(p<.002?B0:K.root(f,B0+8,-75));b.ikErr=e0;palms(b,E,o);STRAP(E,b,G.A);};
const STRAP=(E,b,A)=>{const H=SS.map(([s])=>{const a=b.j(s,'ank');return V.madd(V.madd(a,b.S[s].ffwd,.02),V.norm(V.sub(A,a)),.012);});
  K.trx(E,A,H[0],H[1],{feet:true});E.beam([A[0],A[1]+.04,-.5],[A[0],A[1]+.04,.5],.08,C.frame);E.shadow([-.6,0,0],1,.35,.5);};
GA.def('lib_trx_pike',{title:'Pike en TRX',cam:{yaw:28,pitch:10},fitBox:[[-1.55,0,-.35],[.4,1.35,.35]],
  muscles:PIKE,labels:['Abdomen','Deltoides anterior','Oblicuos'],
  timeline:T4(1.5,'Sube la cadera · piernas rectas',.5,'Arriba · hombros sobre manos',2.5,'Baja lento sin hundir',.5,'Plancha alta'),
  build(c,b,E){TRX(this,b,E,c.p,p=>({hf:mix(0,100,p),kf:2,ang:mix(0,-14,p),sp:[mix(2,8,p)],hd:mix(-6,-14,p)}));}});
GA.def('lib_trx_knee_tuck',{title:'Rodillas al pecho en TRX',cam:{yaw:28,pitch:10},fitBox:[[-1.55,0,-.35],[.4,1.1,.35]],
  muscles:CORE,labels:['Abdomen','Oblicuos','Deltoides anterior'],
  timeline:T4(1.2,'Rodillas al pecho',.4,'Aprieta · cadera baja',2,'Estira lento · core firme',.5,'Plancha alta'),
  build(c,b,E){TRX(this,b,E,c.p,p=>({hf:mix(0,104,p),kf:mix(2,132,p),ang:mix(0,-6,p),sp:[mix(2,14,p)],hd:mix(-6,-12,p)}));}});

// ═══ FITBALL bajo las piernas: el balón (r .325) toca la línea de la tibia (y su prolongación por el empeine) a u m de la
// rodilla; el tronco se resuelve para que el balón apoye en el suelo y el balón rueda (meridianos) hacia las manos
const ROLL=(E,x,r,x0)=>{const fb=K.fitball(E,[x,r,0],r),a=-(x-x0)/r;
  for(const g of[0,M.PI/2]){let q=null;const e=V.mul(V.xy((a+g)/D),r*1.003);for(let i=0;i<=16;i++){const t=i*M.PI/8,P=V.add(V.madd(fb.c,e,M.cos(t)),[0,0,r*1.003*M.sin(t)]);
    q&&E.line(q,P,.006,'#2f6aa8',{layer:-1,outline:false});q=P;}}};
// holgura mínima piernas (muslos, tibias, zapatillas) ↔ esfera
const gapB=(b,c,r)=>{let g=1e9;for(const[s]of SS){const S=b.S[s];for(const[a,e,ra,rb]of[[S.kne,S.ank,.054,.034],[S.hip,S.kne,.084,.056]]){
    const ab=V.sub(e,a),t=K.clamp(V.dot(V.sub(c,a),ab)/V.dot(ab,ab),0,1);g=M.min(g,V.dist(V.madd(a,ab,t),c)-r-mix(ra,rb,t));}
  for(const e of K.shoe(S.ank,S.ffwd,S.fup))g=M.min(g,K.sgap(e,c,r));}return g;};
// x0: balón bajo la mitad de la tibia en la plancha; luego el centro avanza dx·p y el tronco baja hasta que las piernas lo tocan
const BALL=(me,b,E,p,q,r,dx)=>{const o=Object.assign({hx:0,hz:.17,sp:[2],hd:-6,sc:[-.005,.025]},q(p)),re=M.sqrt(r*r-DM.hipW**2),e0=b.ikErr;
  const x0=K.memo(me,'x0',()=>{const o0=Object.assign({},o,q(0));let ce;const f=be=>{o0.be=be;PR(b,o0);const kn=V.lerp(b.j('R','kne'),b.j('L','kne'),.5),d=V.norm(V.sub(amid(b),kn));
    let n=[d[1],-d[0],0];if(n[1]>0)n=V.neg(n);ce=V.madd(V.madd(kn,d,.22),n,re+.045);return ce[1]-r;};f(K.root(f,30,-40));return ce[0];});
  const c=[x0+dx*p,r,0],g=be=>{o.be=be;PR(b,o);return gapB(b,c,r);};let a=-80;while(a<30&&g(a+10)>0)a+=10;
  g(K.root(g,a,a+10));b.ikErr=e0;palms(b,E,o);ROLL(E,c[0],r,x0);E.shadow([-.4,0,0],.9,.35,.5);};
GA.def('lib_ball_pike',{title:'Pike en fitball',cam:{yaw:28,pitch:10},
  muscles:PIKE,labels:['Abdomen','Deltoides anterior','Oblicuos'],
  timeline:T4(1.6,'Sube la cadera · rueda el balón',.5,'Arriba · piernas rectas',2.6,'Baja lento sin hundir',.5,'Plancha · tibias en el balón'),
  build(c,b,E){BALL(this,b,E,c.p,p=>({hf:mix(0,100,p),kf:2,ang:mix(0,-14,p),fr:mix(40,50,p),sp:[mix(2,8,p)],hd:mix(-6,-14,p)}),.325,.52);}});
GA.def('lib_ball_knee_tuck',{title:'Rodillas al pecho en fitball',cam:{yaw:28,pitch:10},
  muscles:CORE,labels:['Abdomen','Oblicuos','Deltoides anterior'],
  timeline:T4(1.3,'Rodillas al pecho · rueda',.4,'Aprieta el abdomen',2.1,'Estira lento sin hundir',.5,'Plancha · tibias en el balón'),
  build(c,b,E){BALL(this,b,E,c.p,p=>({hf:mix(0,116,p),kf:mix(2,128,p),ang:mix(0,-8,p),fr:mix(40,50,p),sp:[mix(2,20,p)],hd:mix(-6,-14,p)}),.275,.39);}});

// ═══ PLANCHAS ISOMÉTRICAS: antebrazos en el suelo y pies en el TRX · antebrazos sobre el fitball y puntas en el suelo ═══
GA.def('lib_trx_plank',{title:'Plancha en TRX',cam:{yaw:28,pitch:10},fitBox:[[-1.6,0,-.35],[.45,.85,.35]],
  muscles:{abs:1,obliques:.5,frontdelts:.35,glutes:.25},labels:['Abdomen','Oblicuos','Deltoides anterior'],init:{p:0,act:1},
  timeline:ISO('Mantén · inhala','Mantén · glúteos firmes'),
  build(c,b,E){const EY=.042;PR(b,Object.assign({be:-3,S:[0,EY+DM.ua,0],fr:22},BRE(c.p)));const EL={},G={};
    for(const[s,k]of SS){const z=b.sho(s)[2];EL[s]=[0,EY,z];G[s]=[.328,.03,z-k*.033];}FORE(b,EL,G);
    STRAP(E,b,K.memo(this,'A',()=>{const a=amid(b);return[a[0]+.06,2.3,0];}));}});
// codos y puños sobre la esfera (radio r+.045 del eje del antebrazo): el codo bajo el hombro, puños juntos arriba
GA.def('lib_ball_plank',{title:'Plancha en fitball',cam:{yaw:30,pitch:10},
  muscles:{abs:1,obliques:.5,frontdelts:.3},labels:['Abdomen','Oblicuos','Deltoides anterior'],init:{p:0,act:1},
  timeline:ISO('Mantén · balón quieto','Mantén · exhala sin hundir'),
  build(c,b,E){const r=.325,Ro=r+.045,o=Object.assign({be:20,S:[0,0,0],fr:14},BRE(c.p));PR(b,o);const z=b.sho('R')[2]-b.pf.o[2];
    const on=(x,zz)=>[x,r+M.sqrt(Ro*Ro-x*x-zz*zz),zz],F=on(.07,.035),xe=K.root(x=>V.dist(on(x,z),F)-DM.fa-DM.grip,-.32,0),e=on(xe,z);
    o.S=[e[0],e[1]+DM.ua,0];TOES(b,o);const EL={},G={};for(const[s,k]of SS){EL[s]=[e[0],e[1],k*z];G[s]=[F[0],F[1],k*F[2]];}FORE(b,EL,G);
    K.fitball(E,[0,r,0],r);E.shadow([-.6,0,0],.9,.3,.5);}});
// ═══ PLANCHA LATERAL (sobre el antebrazo izquierdo, pecho hacia +Z): codo bajo el hombro, cuerpo recto, pies apilados ═══
GA.def('lib_side_plank',{title:'Plancha lateral',cam:{yaw:14,pitch:18},fitBox:[[-1.45,0,-.15],[.35,.8,.45]],
  muscles:{obliques_L:1,obliques_R:.55,abs:.5,abductors_L:.4,abductors_R:.25},labels:['Oblicuos','Abdomen','Glúteo medio'],init:{p:0,act:1},
  timeline:ISO('Mantén · cadera alta','Mantén · cuerpo en línea'),
  build(c,b,E){const p=c.p,Y=K.mat(E,[-.5,0,.12],[1.9,.62]).top,EY=Y+.042,e0=b.ikErr;
    const P=ep=>{const q=ep*D;K.frame(b,[0,1,0],[M.cos(q),M.sin(q),0],[0,0,1]);K.trunk(b,{sp:[0,1.5*p],sc:[.004*p,.01]});
      K.shift(b,V.sub([0,EY+DM.ua,0],b.sho('L')));b.legFK('L',{});b.legFK('R',{abd:-5});b.footRelax('L',8);b.footRelax('R',8);
      return M.min(...K.shoe(b.j('L','ank'),b.S.L.ffwd,b.S.L.fup).map(e=>K.gap(e,[0,Y,0],UP)));};
    P(K.root(P,0,30));b.ikErr=e0;const sl=b.sho('L');b.armVia('L',[sl[0],EY,sl[2]],[sl[0]+.06,Y+.03,sl[2]+.324],[1,0,0]);
    b.arm('R',b.ppt(.15,.1,-.01),b.tdir(.5,0,-1),b.pdir(0,1,0));E.shadow([-.5,0,0],.95,.3,.5);}});

// ═══ RUEDA ABDOMINAL: brazos estirados (armD 3) desde los hombros hasta los puños de la rueda, que rueda por el suelo ═══
const WHEEL=(b,E,Y)=>{const R=K.armD(3),sm=V.lerp(b.sho('R'),b.sho('L'),.5),dy=sm[1]-Y-.09,dz=b.sho('R')[2]-sm[2]-.11,
  w=[sm[0]+M.sqrt(M.max(0,R*R-dy*dy-dz*dz)),Y+.09,0],aw=K.abWheel(E,w,[0,0,1]);
  for(const[s,k]of SS)b.arm(s,aw.hands[s==='R'?0:1],[-1,-.2,k*.4],[0,0,1]);E.trace('rueda',w);};
const AWM={abs:1,lats:.5,obliques:.4,frontdelts:.3};
GA.def('lib_ab_wheel_knees',{title:'Rueda abdominal de rodillas',cam:{yaw:30,pitch:12},
  muscles:AWM,labels:['Abdomen','Dorsales','Oblicuos'],
  timeline:T4(2.4,'Avanza lento · espalda neutra',.5,'Estirado · glúteos firmes',1.6,'Vuelve tirando del abdomen',.5,'Rueda bajo los hombros'),
  build(c,b,E){const p=c.p,Y=K.mat(E,[.07,0,0],[2.2,.6]).top;
    K.kneel(b,{x:-.42,y:Y,thigh:mix(4,68,p),tilt:mix(54,80,p),sp:[mix(16,3,p)],hd:mix(-24,-12,p),sc:[.01,mix(.03,.015,p)],toes:'tuck'});
    WHEEL(b,E,Y);E.shadow([0,0,0],.8,.3,.5);}});
// de pie: metatarsos fijos, el talón sube con la tibia (pitch = 76° − elevación de la tibia); rodillas casi rectas
GA.def('lib_ab_wheel_standing',{title:'Rueda abdominal de pie',cam:{yaw:30,pitch:10},
  muscles:Object.assign({},AWM,{lats:.6,obliques:.5,frontdelts:.4,lowback:.3}),labels:['Abdomen','Dorsales','Oblicuos'],
  timeline:T4(2.8,'Rueda lejos · sin arquear',.5,'Cuerpo recto · aguanta',1.8,'Vuelve con el abdomen',.6,'Cadera alta · rueda delante'),
  build(c,b,E){const p=c.p,ls=mix(70,7,p),kf=mix(30,3,p),lt=(ls+kf)*D,X=-.9;
    for(const[s,k]of SS)K.footBallOn(b,s,[X,0,k*.11],-k*4,M.max(0,76-ls));
    const a=amid(b),kn=V.add(a,[DM.sh*M.cos(ls*D),DM.sh*M.sin(ls*D),0]),hp=V.add(kn,[DM.th*M.cos(lt),DM.th*M.sin(lt),0]);
    const hy=.09+.62*M.cos(mix(35,62,p)*D),e0=b.ikErr,P=t=>{t*=D;K.frame(b,hp,[M.cos(t),M.sin(t),0],[M.sin(t),-M.cos(t),0]);
      K.trunk(b,{sp:[mix(20,6,p)],hd:mix(-10,-14,p),sc:[.01,mix(.03,.012,p)]});return V.lerp(b.sho('R'),b.sho('L'),.5)[1]-hy;};P(K.root(P,-80,30));b.ikErr=e0;
    for(const[s,k]of SS)b.leg(s,null,[1,.2,k*.1]);WHEEL(b,E,0);E.shadow([-.2,0,0],.9,.3,.5);}});

// ═══ CRUNCH EN FITBALL: zona lumbar sobre el balón, pies firmes y abiertos; la columna se enrolla de extensión a flexión ═══
GA.def('lib_ball_crunch',{title:'Crunch en fitball',cam:{yaw:24,pitch:18},
  muscles:{abs:1,obliques:.35},labels:['Abdomen','Oblicuos'],
  timeline:T4(1.3,'Sube el pecho · exhala',.6,'Aprieta el abdomen',2.2,'Baja lento · estira',.5,'Lumbar sobre el balón'),
  build(c,b,E){const p=c.p,r=.275,fb=K.fitball(E,[0,r,0],r);
    b.pelvis([.24,.6,0],{tilt:-70});K.trunk(b,{sp:[mix(-26,30,p)],hd:mix(6,20,p),sc:[0,.01]});K.restBall(b,['pel','gluR','gluL','lum','tho'],fb.c,r);
    for(const[s,k]of SS){K.footOn(b,s,[.72,0,k*.21],V.yaw(-k*10),UP);b.leg(s,null,[.3,1,k*.35]);b.arm(s,b.hpt(k*.112,.005,-.035),b.tdir(k,.15,.25));}
    E.shadow([.3,0,0],.7,.35,.5);}});

// ═══ PASE DE FITBALL (boca arriba, cabeza hacia -X): p 0 abajo suspendido → 1 arriba en V; h 0 balón en las manos → 1 entre los pies ═══
GA.def('lib_ball_pass',{title:'Pase de fitball (manos a pies)',cam:{yaw:-18,pitch:12},
  muscles:{abs:1,obliques:.35,quads:.25,frontdelts:.25},labels:['Abdomen','Oblicuos','Cuádriceps'],init:{p:0,h:0},
  timeline:[{p:1,dur:1.2,label:'Sube brazos y piernas',act:1},{h:1,dur:.5,label:'Pasa el balón a los pies',act:1},
    {p:0,dur:1.8,label:'Baja sin tocar el suelo',act:.8},{dur:.3,label:'Abajo · balón en los pies',act:.7},
    {p:1,dur:1.2,label:'Sube a por el balón',act:1},{h:0,dur:.5,label:'Pasa el balón a las manos',act:1},
    {p:0,dur:1.8,label:'Baja con el balón',act:.8},{dur:.3,label:'Abajo · sin tocar el suelo',act:.7}],
  build(c,b,E){const p=c.p,h=c.h,r=.275,Y=K.mat(E,[-.1,0,0],[1.9,.62]).top,e=sst(0,1,p),hh=1-sst(.3,.8,h);
    K.supine(b,{y:Y,x:0,incl:mix(0,10,p),sp:[mix(10,48,p)],hd:mix(12,24,p),sc:[0,.02],parts:['pel','gluR','gluL','lum']});
    const fl=mix(17,104,p)*D,ab=M.tan((mix(1.5,15.5,M.max(sst(.3,.8,p),sst(0,.6,h)))+1.6*sst(.3,.8,p)*(1-h))*D);
    for(const[s,k]of SS){b.leg(s,V.madd(b.hip(s),V.norm(b.pdir(k*ab,-M.cos(fl),M.sin(fl))),K.legD(mix(3,6,p))),b.pdir(0,M.sin(fl),M.cos(fl)));b.footRelax(s,30);}
    const sm=V.lerp(b.sho('R'),b.sho('L'),.5),am=amid(b),Bf=V.madd(V.madd(am,V.norm(V.sub(am,V.lerp(b.j('R','kne'),b.j('L','kne'),.5))),.04),b.S.R.ffwd,.02),Bh=V.madd(sm,V.norm(V.lerp([-.76,.65,0],V.norm(V.sub(Bf,sm)),e)),mix(.59,M.min(.6,V.dist(Bf,sm)),e)),
      Bc=V.lerp(Bh,Bf,h),hc=V.lerp(Bh,Bc,hh);
    for(const[s,k]of SS)b.arm(s,V.add(hc,[0,0,k*(r+mix(.08,.03,hh))]),V.lerp([0,1,k*.4],[-1,0,k*.5],e),[1,0,0]);
    K.fitball(E,Bc,r,{layer:0});E.shadow([0,0,0],.8,.3,.5);}});

// ═══ PLANCHA ALTA SOBRE LAS PUNTAS: escaladores (cíclico) y toques de hombro ═══
const HIGH=(me,b,o)=>{o=Object.assign({hz:.17,sp:[2],hd:-8,sc:[-.005,.025],fr:14},o);o.be=K.memo(me,'be',()=>{TOES(b,o);return o.be;});PR(b,o);return o;};
GA.def('lib_mountain_climber',{title:'Escaladores',cam:{yaw:28,pitch:12},cycle:{period:.9},
  muscles:{abs:1,quads:.5,frontdelts:.4,obliques:.35},labels:['Abdomen','Cuádriceps','Deltoides anterior'],init:{act:.85},
  timeline:[{dur:.9,label:'Rodillas al pecho · alterna rápido',act:.85}],
  build(c,b,E){const o=HIGH(this,b,{ab:1});palms(b,E,o);
    for(const[s,k]of SS){const ph=((c.cyc+(k>0?.25:.75))%1)*2;if(ph>=1)continue;const q=M.sin(M.PI*ph)**2;
      b.legFK(s,{flex:115*q,knee:2+132*q**.6,abd:1});b.footRelax(s,mix(14,40,q));}
    E.shadow([-.6,0,0],1,.35,.5);}});
GA.def('lib_plank_shoulder_tap',{title:'Plancha con toques de hombro',cam:{yaw:30,pitch:14},
  muscles:{abs:1,obliques:.7,frontdelts:.4,triceps:.25},labels:['Abdomen','Oblicuos','Deltoides anterior'],init:{p:0,sd:1},
  timeline:[{p:1,dur:.6,label:'Mano derecha al hombro',act:1},{dur:.25,label:'Toca · cadera quieta',act:1},{p:0,dur:.6,label:'Apoya la mano',act:.8},{sd:-1,dur:.3,label:'Pies abiertos · firme',act:.7},
    {p:1,dur:.6,label:'Mano izquierda al hombro',act:1},{dur:.25,label:'Toca · cadera quieta',act:1},{p:0,dur:.6,label:'Apoya la mano',act:.8},{sd:1,dur:.3,label:'Pies abiertos · firme',act:.7}],
  build(c,b,E){const o=HIGH(this,b,{ab:7}),p=c.p,w=c.sd>=0?'R':'L',kw=K.sd(w),op=w==='R'?'L':'R',H=s=>[0,0,K.sd(s)*o.hz],PL=k=>[-.8,.45,k*.55];
    K.palm(b,E,op,H(op),{pole:PL(-kw)});
    if(p<.06)K.palm(b,E,w,H(w),{pole:PL(kw)});
    else{const q=sst(.06,1,p),g=V.lerp(K.palmT(H(w)),V.add(b.sho(op),b.tdir(kw*.03,.04,.09)),q);g[1]+=.07*M.sin(M.PI*q);b.arm(w,g,V.lerp(PL(kw),[.25,-1,kw*.6],q),[1,0,0]);}
    E.shadow([-.6,0,0],1,.4,.5);}});

// ═══ CAMINATA DE OSO (cíclico): hombros fijos sobre las manos, rodillas a un palmo del suelo; mano y pie contrarios a la vez.
// Apoyo DU del ciclo (el miembro va hacia atrás con el suelo, cuyas marcas se desplazan igual) y vuelo con elevación ═══
GA.def('lib_bear_crawl',{title:'Caminata de oso',cam:{yaw:30,pitch:14},fitBox:[[-1.2,0,-.3],[.35,.72,.3]],cycle:{period:1.3},
  muscles:{abs:1,frontdelts:.6,quads:.5,obliques:.3,triceps:.3},labels:['Abdomen','Deltoides anterior','Cuádriceps'],init:{act:.85},
  timeline:[{dur:1.3,label:'Mano y pie contrarios · espalda plana',act:.85}],
  build(c,b,E){const S=.24,DU=.6,cy=c.cyc,st=ph=>ph<DU?[S/2-S*ph/DU,0]:[S*sst(DU,1,ph)-S/2,.05*M.sin(M.PI*(ph-DU)/(1-DU))];
    const A=st((cy+.8)%1),B=st((cy+.3)%1),L={R:[A,B],L:[B,A]};PR(b,{be:1,S:[0,.635,0],sp:[0],hd:-16,sc:[0,.02]});
    for(const[s,k]of SS){const[hm,ft]=L[s];K.palm(b,E,s,[.05+hm[0],hm[1],k*.17],{pole:[-.8,.45,k*.55]});
      K.footBallOn(b,s,[-.85+ft[0],ft[1],k*.12],-k*4,45);b.leg(s,null,[.4,-1,k*.15]);}
    for(let i=-8;i<4;i++){const x=i*.2-(cy*S/DU)%.2;E.line([x,.002,-.45],[x,.002,.45],.006,'#cfd8e0',{alpha:.2*M.max(0,1-M.abs(x+.4)/1.1),layer:-1});}
    E.shadow([-.35,0,0],.8,.35,.5);}});

})(window.GymAnim);
