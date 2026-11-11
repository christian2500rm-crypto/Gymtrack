/* ex/n_core_rot.js */
/* Core rotacional: landmine, máquina de rotación, leñadores (cable, mancuerna, banda), Pallof, inclinación lateral, molino, giros rusos, lanzamiento */
(function(GA){
const K=GA._.kit,V=GA._.V,C=GA._.COL,DM=GA._.DIM,SS=K.SS,mix=K.mix,sst=K.sst,D=K.D,UP=[0,1,0];
const OB='Oblicuos',AB='Abdomen',DA='Deltoides anterior',GL='Glúteos';
const smid=b=>V.lerp(b.sho('R'),b.sho('L'),.5),sh=(E,x,z)=>E.shadow([x||0,0,z||0],.55,.42,.55);
const TL=(a,la,b,lb,c,lc,d,ld)=>[{p:1,dur:a,label:la,act:1},{dur:b,label:lb,act:.95},{p:0,dur:c,label:lc,act:.75},{dur:d,label:ld,act:.55}];

const ST=(b,o)=>{const fz=o.fz||.17,to=o.toe==null?10:o.toe,q=o.q||[0,0],po={yaw:o.yaw||0,tilt:o.tilt||0,roll:o.roll||0},d=K.legD(o.kf||8),Z=o.z||0,bx=o.bx==null?.12:o.bx;
  SS.forEach(([s,k],i)=>K.footBallOn(b,s,[bx,0,k*fz],-k*to+(o.fy||0)+k*q[i]*40,q[i]*26));
  const pose=x=>{b.pelvis([x,1,Z],po);let hy=9;for(const[s]of SS){const h=b.hip(s),A=b.S[s].ank;hy=Math.min(hy,A[1]+1-h[1]+Math.sqrt(Math.max(.01,d*d-(h[0]-A[0])**2-(h[2]-A[2])**2)));}
    b.pelvis([x,hy,Z],po);K.trunk(b,o);K.legs(b,o.pole);if(o.arms)o.arms(b);};
  const e0=b.ikErr,x=K.root(x=>{pose(x);return K.com(b,o.xm&&o.xm())[0]-bx+.085;},-.6,.5);b.ikErr=e0;pose(x);};
const reach=(b,dn,ax,w,ef)=>{const sm=smid(b),R0=K.armD(ef);let L=9;for(const[s,k]of SS){const a=V.add(V.sub(sm,b.sho(s)),V.mul(ax,k*w)),d=V.dot(a,dn);L=Math.min(L,Math.sqrt(d*d-V.dot(a,a)+R0*R0)-d);}return V.madd(sm,dn,L);};
const hands=(b,r,u,ef,w,gx)=>{const dn=V.norm(b.tdir(r,u,1)),ax=V.norm(V.perp(b.tf.R,dn)),M=reach(b,dn,ax,w,ef),H=[V.madd(M,ax,w),V.madd(M,ax,-w)];
  SS.forEach(([s,k],i)=>b.arm(s,H[i],b.tdir(k*.6,-1,-.4),gx?gx(H[i],ax):ax));return{M,ax,H};};
const POST=(E,X,Y,Z)=>{E.beam([X,0,Z],[X,2.2,Z],.08,C.frame);E.boxA([X,.02,Z],[.4,.04,.4],C.frameD,{layer:-1});E.boxA([X,Y,Z],[.094,.035,.094],K.COL.strap);return[X,Y,Z+.045];};
const COLM=(E,X,Z,PY,cl,L0)=>{const P=[X,PY,Z+.15],d=V.norm(V.sub(cl,P)),n=V.cross(d,UP),pn=V.len(n)>.1?V.norm(n):[1,0,0];
  for(const k of[-1,1])E.beam([X+k*.22,0,Z],[X+k*.22,2.24,Z],.07,C.frame);E.beam([X-.26,2.24,Z],[X+.26,2.24,Z],.07,C.frame);
  E.boxA([X,.02,Z],[.62,.04,.5],C.frameD,{layer:-1});E.cyl([X,.08,Z+.09],[X,2.16,Z+.09],.016,C.chrome);E.boxA([X,PY,Z+.1],[.08,.15,.06],C.frameD);
  E.pulley(P,pn,.04);E.cable(V.madd(P,d,.04),cl);
  const top=E.stack([X,0,Z-.02],{h:1.85,lift:V.dist(P,cl)-L0+.03,n:14,sel:5,yaw:90,w:.28,bias:.2});E.cable(top,[X,2.14,Z-.02]);E.cable([X,2.18,Z+.06],[X,PY+.08,Z+.09]);};

const WC=(b,p,hi,w,gx,kg)=>{const e=hi?p:1-p,d=kg?0:1;let R;
  ST(b,{fz:.19,toe:12,q:[.25*(1-p),sst(.3,1,p)],yaw:mix(20,-24+12*d,p),tilt:mix(3,22+16*d,e),kf:mix(10,30+15*d,e),sp:[mix(0,8,e),0,mix(24,-28+10*d,p)],hd:[mix(-14,24,e),mix(10,-10,p)],sc:[0,.02],
    xm:()=>[[R.M,(kg||4)/75]],arms:b=>{R=hands(b,mix(-.3,hi?.3:.42,p),hi?mix(.75,-.7+.3*d,p):mix(-.7,.42,p),14,w,gx);}});return R;};
const WCAM={cam:{yaw:62,pitch:8},fitBox:[[-.45,0,-1.1],[.6,2.1,.55]]},HT=['Baja en diagonal · gira',.4,'Junto a la rodilla derecha',1.9,'Sube controlando',.5,'Arriba · brazos largos'];
const WCC=(c,b,E,hi,ctx)=>{const PY=hi?2.02:.2,P=[.5,PY,-.9],cl=p=>{const R=WC(b,p,hi,.06);return V.madd(R.M,V.norm(V.sub(P,R.M)),.22);};
  const L0=K.memo(ctx,'L0',()=>V.dist(P,cl(0))),c1=cl(c.p);WC(b,c.p,hi,.06,h=>V.norm(V.sub(h,c1)));
  E.rope(c1,b.j('R','grip'),b.j('L','grip'));COLM(E,.5,-1.05,PY,c1,L0);E.trace('cuerda',c1);sh(E,0,-.2);};
GA.def('lib_woodchop_high_cable',Object.assign({title:'Leñador alto en cable',
  muscles:{obliques:1,abs:.6,frontdelts:.25},labels:[OB,AB],init:{p:0,act:.55},timeline:TL(1.1,...HT),
  build(c,b,E){WCC(c,b,E,1,this);}},WCAM));
GA.def('lib_woodchop_low_cable',Object.assign({title:'Leñador bajo en cable',
  muscles:{obliques:1,abs:.5,glutes:.3,frontdelts:.25},labels:[OB,AB,GL],init:{p:0,act:.55},
  timeline:TL(1.1,'Sube en diagonal · gira',.4,'Sobre el hombro derecho',1.9,'Baja controlando',.5,'Abajo · cadera atrás'),
  build(c,b,E){WCC(c,b,E,0,this);}},WCAM));
GA.def('lib_band_woodchop',Object.assign({title:'Leñador con banda elástica',
  muscles:{obliques:1,abs:.6,frontdelts:.3,glutes:.25},labels:[OB,AB],init:{p:0,act:.55},timeline:TL(1.1,...HT),
  build(c,b,E){const A=POST(E,.5,1.95,-1.05),R=WC(b,c.p,1,.042);K.band(E,[A,R.M],null,{handle:R.ax,col:K.BAND.green,L0:.9});E.trace('asa',R.M);sh(E,0,-.2);}},WCAM));
GA.def('lib_woodchop_db',{title:'Leñador con mancuerna',cam:{yaw:62,pitch:8},
  muscles:{obliques:1,abs:.5,frontdelts:.4,glutes:.3},labels:[OB,AB,DA],init:{p:0,act:.55},
  timeline:TL(1,'Sube en diagonal · pivota',.4,'Arriba · brazos largos',1.8,'Baja controlando',.5,'Junto a la cadera'),
  build(c,b,E){const R=WC(b,c.p,0,.038,null,10);E.dumbbell(R.M,R.ax,{len:.16,r:.06,hl:.06});E.trace('mancuerna',R.M);sh(E);}});

const PAL=(b,p)=>{ST(b,{fz:.19,toe:8,kf:14,tilt:4,sp:[-2],hd:[-4],sc:[-.005,mix(-.01,.03,p)],arms:b=>{
  const M=V.lerp(b.tpt(0,-.2,.2),reach(b,V.norm(b.tdir(0,-.12,1)),UP,-.042,8),p);
  SS.forEach(([s,k])=>b.arm(s,V.madd(M,UP,-k*.042),b.tdir(k*.7,-1,-.3),UP));}});return V.lerp(b.j('R','grip'),b.j('L','grip'),.5);};
const PCAM={cam:{yaw:52,pitch:12},fitBox:[[-.45,0,-1.1],[.8,1.85,.45]]},PT=[1.2,'Empuja al frente',2,'Aguanta 2 s · sin girar',1.5,'Vuelve al pecho',.6,'Abdomen firme'];
GA.def('lib_pallof_press_cable',Object.assign({title:'Press Pallof en cable',muscles:{obliques:1,abs:.7},labels:[OB,AB],init:{p:0,act:.55},timeline:TL(...PT),
  build(c,b,E){const M0=K.memo(this,'m0',()=>PAL(b,0)),M=PAL(b,c.p),X=M0[0]+.12,P=[X,M0[1],-.9],cl=V.madd(M,V.norm(V.perp(V.sub(P,M),UP)),.075);
    E.handle(M,UP);for(const k of[-1,1])E.line(V.madd(M,UP,k*.06),cl,.006,'#1b1e22');E.sph(cl,.009,C.chrome);
    COLM(E,X,-1.05,M0[1],cl,V.dist(P,M0)-.075);E.trace('maneral',M);sh(E);}},PCAM));
GA.def('lib_band_pallof',Object.assign({title:'Press Pallof con banda elástica',muscles:{obliques:1,abs:.7,glutes:.25},labels:[OB,AB],init:{p:0,act:.55},timeline:TL(...PT),
  build(c,b,E){const M0=K.memo(this,'m0',()=>PAL(b,0)),M=PAL(b,c.p),A=POST(E,M0[0]+.12,M0[1],-1.05);
    K.band(E,[A,M],null,{handle:UP,col:K.BAND.red,L0:.75});E.trace('asa',M);sh(E);}},PCAM));

const LPV=[1.72,.05,0];
GA.def('lib_landmine_rotation',{title:'Rotación landmine',cam:{yaw:40,pitch:12},fitBox:[[-.35,0,-.45],[1.55,1.82,.45]],
  muscles:{obliques:1,abs:.5,frontdelts:.4,glutes:.3},labels:[OB,AB,DA],init:{p:0,act:1},
  timeline:[{p:1,dur:1.4,label:'Arco a la cadera derecha',act:.8},{dur:.3,label:'Gira el tronco · pivota',act:.9},{p:0,dur:1.1,label:'Sube por arriba',act:1},
    {p:-1,dur:1.4,label:'Arco a la cadera izquierda',act:.8},{dur:.3,label:'Gira el tronco · pivota',act:.9},{p:0,dur:1.1,label:'Sube por arriba',act:1}],
  build(c,b,E){const p=c.p,a=Math.abs(p),ps=128*p*D,R0=K.armD(8),L1=1.86;let G=[1,1,0];
    ST(b,{fz:.22,toe:12,q:[sst(.2,1,-p),sst(.2,1,p)],yaw:-17*p,tilt:4+8*a,kf:8+14*a,sp:[0,0,-30*p],hd:[mix(-10,20,a),-16*p],sc:[0,.025],z:.03*p,xm:()=>[[G,.15]],
      arms:b=>{const v=V.sub(smid(b),LPV),d=V.len(v),n=V.mul(v,1/d),e1=V.norm(V.perp(UP,n)),e2=V.cross(e1,n);
        const hp=r=>{const q=(d*d+L1*L1-r*r)/(2*d),h=Math.sqrt(Math.max(0,L1*L1-q*q)),M=V.add(V.madd(LPV,n,q),V.add(V.mul(e1,h*Math.cos(ps)),V.mul(e2,h*Math.sin(ps)))),x=V.norm(V.sub(M,LPV));return[V.madd(M,x,.04),V.madd(M,x,-.04),x];};
        const H=hp(K.root(r=>{const H=hp(r);return Math.max(V.dist(H[0],b.sho('R')),V.dist(H[1],b.sho('L')))-R0;},.25,.75));G=V.madd(LPV,H[2],1.95);SS.forEach(([s,k],i)=>b.arm(s,H[i],b.tdir(k*.5,-1,-.3),H[2]));}});
    K.landmine(E,LPV,G,{plates:[.225]});E.trace('punta',G);sh(E);}});

GA.def('lib_side_bend_db',{title:'Inclinación lateral con mancuerna',cam:{yaw:70,pitch:6},
  muscles:{obliques_L:1,obliques_R:.5,abs:.3,lowback:.3},labels:[OB,AB,'Lumbares'],init:{p:0,act:.55},
  timeline:[{p:1,dur:2,label:'Baja de lado · sin girar',act:.8},{dur:.4,label:'Estira el costado',act:.85},{p:0,dur:1.4,label:'Sube con el oblicuo',act:1},{dur:.6,label:'Arriba · erguido',act:.55}],
  build(c,b,E){const p=c.p;let g=[0,1,0];
    ST(b,{fz:.13,toe:6,kf:5,z:-.035*p,roll:-3*p,sp:[0,31*p],hd:[-4,0,-10*p],xm:()=>[[g,.16]],arms:b=>{g=V.madd(b.sho('R'),V.norm([0,-1,.12]),K.armD(5));b.arm('R',g,[-1,0,.2],[1,0,0]);
      const L=b.lf;K.palm(b,null,'L',E.fpt(L,-.15,.07,.01),{fd:E.fdir(L,0,-.5,1),n:V.neg(L.R),pole:[-.4,0,-1]});}});
    const L=b.lf;K.palm(b,E,'L',E.fpt(L,-.15,.07,.01),{fd:E.fdir(L,0,-.5,1),n:V.neg(L.R),pole:[-.4,0,-1]});
    E.dumbbell(g,[1,0,0],{r:.055,hl:.055});E.trace('mancuerna',g);sh(E);}});

const kbDir=(b,s,n,a)=>{const S=b.S[s],fd=V.norm(V.sub(S.grip,S.elb)),w=V.norm(V.perp(n,fd));return V.norm(V.add(V.mul(fd,-Math.cos(a*D)),V.mul(w,Math.sin(a*D))));};
GA.def('lib_kb_windmill',{title:'Molino con kettlebell',cam:{yaw:78,pitch:8},
  muscles:{obliques:1,glutes:.5,hams:.5,frontdelts_R:.4,abs:.3},labels:[OB,GL,'Isquiotibiales'],init:{p:0,act:.6},
  timeline:[{p:1,dur:2.6,label:'Cadera atrás · baja la mano',act:.8},{dur:.5,label:'Abajo · mira la pesa',act:.9},{p:0,dur:2,label:'Sube despacio',act:1},{dur:.6,label:'Arriba · brazo bloqueado',act:.6}],
  build(c,b,E){const p=c.p;let h=[0,2,0];
    ST(b,{fz:.24,toe:5,fy:32,kf:mix(4,12,p),yaw:mix(28,50,p),tilt:80*p,z:.12*p,sp:[0,-32*p,-58*p],hd:[mix(-45,-8,p),mix(-80,-95,p)],sc:[.01,0],xm:()=>[[h,.21]],
      arms:b=>{h=V.madd(b.sho('R'),[0,1,0],K.armD(3));b.arm('R',h,b.tdir(1,0,0),b.tdir(0,0,1));
        const S=b.S.L,sl=b.sho('L'),of=V.add(V.mul(S.ffwd||[1,0,0],.075),[0,0,.03]),P=t=>V.add(t<1?V.lerp(S.hip,S.kne,t):V.lerp(S.kne,S.ank,Math.min(1,t-1)),of),R0=K.armD(6);
        const f=t=>V.dist(P(t),sl)-R0,t=f(1.9)<0?1.9:K.root(f,0,1.9);b.arm('L',P(t),[-.3,.2,-1],V.norm(V.sub(S.kne,S.hip)));}});
    K.kettlebell(E,h,{kg:16,up:V.neg(kbDir(b,'R',V.neg(b.tf.F),58)),ax:b.tdir(0,0,1)});E.trace('pesa',h);sh(E);}});

const RTL=[{p:1,dur:.8,label:'Gira a la derecha',act:1},{dur:.2,label:'Junto a la cadera',act:.9},{p:-1,dur:1.5,label:'Gira al otro lado',act:1},{dur:.2,label:'Junto a la cadera',act:.9},{p:0,dur:.8,label:'Al centro · espalda recta',act:.75}];
const RT=(c,b,E,ld,up)=>{const p=c.p,Y=K.mat(E,[.12,0,0],[1.25,.62]).top;
  K.seat(b,[-.05,Y,0],{tilt:-44,yaw:-14*p,sp:[6,0,-50*p],hd:[14,-14*p],sc:[0,.03],legs:!up,feet:{x:.56,z:.12,toe:6,y:Y}});
  if(up)for(const[s,k]of SS){b.leg(s,[.54,Y+.16,k*.12],[.3,1,k*.15]);b.footRelax(s,25);}
  const fw=V.norm(b.tdir(0,-.2,1)),ax=V.norm(V.perp(b.tf.R,fw)),c0=V.add(V.madd(b.tpt(0,up?-.19:-.29,.12),fw,.22),[0,.07*Math.sin(Math.PI*p)**2,0]),H=ld(E,c0,ax,fw);
  SS.forEach(([s,k],i)=>{if(H[i])b.arm(s,H[i],b.tdir(k*.7,-.8,-.4),H[2]);});E.trace('carga',c0);sh(E,.1);};
const RTD=(t,ld,up,mus)=>({title:t,cam:{yaw:42,pitch:20},fitBox:[[-.5,0,-.3],[.75,.9,.3]],muscles:mus||{obliques:1,abs:.6},labels:[OB,AB],init:{p:0,act:.75},timeline:RTL,
  build(c,b,E){RT(c,b,E,ld,up);}});
GA.def('lib_russian_twist_db',RTD('Giro ruso con mancuerna',(E,c,ax,fw)=>{E.dumbbell(c,ax,{r:.055,hl:.06,len:.12});const u=V.cross(fw,ax);
  return[V.madd(V.madd(c,ax,.09),fw,-.06),V.madd(V.madd(c,ax,-.09),fw,-.06),u];}));
GA.def('lib_plate_russian_twist',RTD('Giro ruso con disco',(E,c,ax,fw)=>{E.plate(c,fw,.13,{th:.03});return[V.madd(c,ax,.11),V.madd(c,ax,-.11),V.cross(fw,ax)];}));
GA.def('lib_mb_russian_twist',RTD('Giro ruso con balón medicinal',(E,c,ax,fw)=>{const m=K.medball(E,c,.12);return[m.palm(ax),m.palm(V.neg(ax)),V.cross(fw,ax)];},0,{obliques:1,abs:.7}));
GA.def('lib_russian_twist_bw',RTD('Giro ruso con peso corporal',(E,c,ax,fw)=>[V.madd(c,ax,.035),V.madd(c,ax,-.035),V.cross(fw,ax)],1));

GA.def('lib_torso_rotation_machine',{title:'Rotación de torso en máquina',cam:{yaw:30,pitch:24},fitBox:[[-.42,0,-.36],[.6,1.52,.36]],
  muscles:{obliques:1,abs:.4},labels:[OB,AB],init:{p:0,act:.55},
  timeline:TL(1.4,'Gira desde el abdomen',.6,'Aprieta · cadera fija',2.4,'Vuelve despacio al centro',.5,'Espalda recta'),
  build(c,b,E){const SY=.47,a=mix(10,-45,c.p),HY=1.68,XR=-.58,FD=C.frameD;
    K.seat(b,[0,SY,0],{sp:[0,0,a],hd:[4],sc:[0,.02],feet:{x:.44,z:.15,toe:6}});
    const A=b.waist,F=V.norm(V.perp(b.tf.F,UP)),R=V.cross(F,UP),P=(r,y,f)=>[A[0]+R[0]*r+F[0]*f,y,A[2]+R[2]*r+F[2]*f],T=(r,u,f)=>b.tpt(r,u,f),hy=T(0,-.24,0)[1],sy=T(0,-.04,0)[1];
    SS.forEach(([s,k])=>b.arm(s,T(k*.25,-.24,.27),b.tdir(k*.6,-1,-.5),UP));
    E.pad(T(0,-.17,.16),T(0,-.33,.16),.24,.07,C.pad,{up:b.tdir(0,0,1)});
    for(const k of[-1,1]){const h=P(k*.25,hy,.27);E.beam(P(k*.3,HY-.14,0),P(k*.3,sy,0),.035,C.frame);E.beam(P(k*.3,sy,0),V.add(h,[0,.1,0]),.035,C.frame);
      E.cyl(V.add(h,[0,-.09,0]),V.add(h,[0,.1,0]),.017,'#2a2f35');E.beam(V.add(h,[0,-.09,0]),P(k*.1,hy-.09,.2),.03,FD);}
    E.beam(P(-.3,HY-.14,0),P(.3,HY-.14,0),.05,C.frame);E.cyl([A[0],HY-.16,A[2]],[A[0],HY+.03,A[2]],.11,FD);
    const kn=V.lerp(b.hip('R'),b.j('R','kne'),.75),ry=kn[1]+.11;E.cyl([kn[0],ry,-.3],[kn[0],ry,.24],.045,C.pad);E.beam([kn[0],.04,-.32],[kn[0],ry,-.32],.05,C.frame);
    E.pad([-.2,SY-.04,0],[.2,SY-.04,0],.36,.08,C.pad,{up:UP,layer:-1});E.beam([0,.05,0],[0,SY-.08,0],.08,C.frame);
    E.beam([XR-.12,.03,0],[.4,.03,0],.09,FD,{layer:-1});E.beam([kn[0],.03,-.36],[kn[0],.03,0],.07,FD,{layer:-1});
    for(const k of[-1,1])E.beam([XR,0,k*.19],[XR,HY+.08,k*.19],.06,C.frame);E.beam([XR,HY+.08,-.22],[XR,HY+.08,.22],.06,FD);E.beam([XR,HY+.08,0],[A[0],HY+.08,A[2]],.07,C.frame);
    const top=E.stack([XR,0,0],{h:1.45,lift:(10-a)*D*.11,n:12,sel:5,yaw:0,w:.26,bias:.15});E.pulley([XR+.04,HY-.02,0],[0,0,1],.04);
    E.cable([A[0]-.11,HY-.06,A[2]],[XR+.04,HY+.02,0]);E.cable([XR,HY-.02,0],top);E.trace('pecho',T(0,-.22,.2));E.shadow([0,0,0],.6,.4,.55);}});

const MBW=-1.3;
GA.def('lib_mb_rot_throw',{title:'Lanzamiento rotacional con balón medicinal',cam:{yaw:46,pitch:10},fitBox:[[-.5,0,MBW+.1],[.7,1.9,.45]],
  muscles:{obliques:1,abs:.5,glutes:.5,frontdelts:.3},labels:[OB,AB,GL],init:{p:0,f:0,act:.6},
  timeline:[{p:1,dur:.5,label:'Gira la cadera y lanza',act:1},{f:1,dur:.6,label:'Al muro y vuelve',act:.7,ease:'lin'},
    {p:0,f:0,dur:.75,label:'Recibe y carga',act:.8},{dur:.35,label:'Balón junto a la cadera',act:.6}],
  build(c,b,E){const p=c.p,r=.12;let H;
    ST(b,{fz:.22,toe:10,q:[.9*sst(.1,1,p),.25*(1-p)],yaw:mix(-22,28,p),tilt:mix(16,6,p),kf:mix(28,14,p),sp:[mix(6,0,p),0,mix(-28,22,p)],hd:[mix(10,0,p),mix(30,15,p)],sc:[0,.02],
      xm:()=>[[H.M,4/75]],arms:b=>{H=hands(b,mix(.6,-.45,p),mix(-1.3,-.25,p),mix(55,12,p),r+.028,(h,ax)=>V.norm(V.perp(b.tdir(0,1,0),ax)));}});
    const fl=p>.999&&c.f>0&&c.f<1,t=fl?1-Math.abs(1-2*c.f):0,W=[.28,1.3,MBW+r],M=V.add(V.lerp(H.M,W,t),[0,.05*Math.sin(Math.PI*t),0]);
    K.medball(E,M,r);E.boxA([.2,1.1,MBW-.05],[3,2.2,.1],'#26303a',{layer:-2});for(const[rd,cl]of[[.2,'#3a4652'],[.07,C.accent]])E.disc([W[0],W[1],MBW+.004],[0,0,1],rd,.008,cl,{layer:-1,hub:0});E.trace('balón',M);sh(E,0,-.1);}});

})(window.GymAnim);
