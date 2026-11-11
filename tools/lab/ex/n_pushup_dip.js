/* Flexiones y fondos: variantes de flexión (rodillas, inclinada, declinada, abierta, arquero, diamante, pliométrica),
   fondos (paralelas, asistidos, máquina, banco, anillas), press en TRX, pike, flexión y parada de manos en la pared */
(function(GA){
const K=GA._.kit,V=GA._.V,C=GA._.COL,DM=GA._.DIM,SS=K.SS,mix=K.mix,sst=K.sst,D=Math.PI/180,UP=[0,1,0];
const pc=(t,n)=>K.memo(t,'pl'+(n||''),()=>({}));
// flexión estándar: baja 2 s · pausa · empuja 1 s · arriba
const PT=(l1,l2,d1,d2)=>[{p:1,dur:d1||2,label:l1,act:.8},{dur:.25,label:'Pecho cerca del apoyo',act:.9},
  {p:0,dur:d2||1,label:l2,act:1},{dur:.45,label:'Arriba · cuerpo firme',act:.5}];
// palmas con los dedos abiertos a° (+ hacia fuera, - hacia dentro) y codo hacia pole (z se refleja)
const palms=(b,E,H,a,pl)=>{for(const[s,k]of SS)K.palm(b,E,s,H[s],{fd:[Math.cos(a*D),0,k*Math.sin(a*D)],pole:[pl[0],pl[1],k*pl[2]]});};
const PUM={pecs:1,triceps:.6,frontdelts:.5};

// ═══ FLEXIONES DE RODILLAS ═══════════════════════════════════════════════════
GA.def('lib_pushup_knee',{title:'Flexiones de rodillas',cam:{yaw:30,pitch:14},
  muscles:{pecs:1,triceps:.55,frontdelts:.5},labels:['Pectoral','Tríceps','Deltoides ant.'],init:{p:0,act:.5},
  timeline:PT('Baja en 2 s · rodillas a cabeza recto','Empuja el suelo'),
  build(c,b,E){const mt=K.mat(E,[-.05,0,0],[1.4,.8]);
    K.plank(b,E,{knees:true,xT:-.45,fy:mt.top,hy:mt.top,dhx:.05,p:c.p,k:pc(this)});E.shadow([-.1,0,0],.7,.35,.5);}});

// ═══ FLEXIONES INCLINADAS (manos en banco) ═══════════════════════════════════
GA.def('lib_pushup_incline',{title:'Flexiones inclinadas (manos elevadas)',cam:{yaw:30,pitch:12},
  muscles:{pecs:1,lowerpecs:.6,triceps:.5,frontdelts:.4},labels:['Pectoral','Pectoral inferior','Tríceps'],init:{p:0,act:.5},
  timeline:PT('Baja el pecho al borde','Empuja el banco'),
  build(c,b,E){const pl=K.plank(b,E,{xT:-1.15,hy:.45,dhx:.17,p:c.p,k:pc(this)});
    K.box(E,[pl.hands.R[0]+.13,0,0],[.42,.45,1.1],{kind:'bench'});E.shadow([-.3,0,0],.9,.4,.5);}});

// ═══ FLEXIONES DECLINADAS (pies en banco) ════════════════════════════════════
GA.def('lib_pushup_decline',{title:'Flexiones declinadas (pies elevados)',cam:{yaw:30,pitch:12},
  muscles:{upperpecs:1,pecs:.6,frontdelts:.6,triceps:.5,abs:.3},labels:['Pectoral superior','Deltoides ant.'],init:{p:0,act:.5},
  timeline:PT('Baja controlado · cadera firme','Empuja el suelo'),
  build(c,b,E){const XT=-1.05;K.plank(b,E,{xT:XT,fy:.45,p:c.p,k:pc(this)});
    K.box(E,[XT-.17,0,0],[.42,.45,.8],{kind:'bench'});E.shadow([-.2,0,0],1,.4,.5);}});

// ═══ FLEXIONES ABIERTAS ══════════════════════════════════════════════════════
GA.def('lib_pushup_wide',{title:'Flexiones abiertas',cam:{yaw:30,pitch:16},
  muscles:{pecs:1,frontdelts:.5,triceps:.35},labels:['Pectoral','Deltoides ant.','Tríceps'],init:{p:0,act:.5},
  timeline:PT('Baja · codos a 45°','Empuja · aprieta el pecho'),
  build(c,b,E){const pl=K.plank(b,null,{xT:-1,zH:.44,p:c.p,k:pc(this)});palms(b,E,pl.hands,18,[-.7,.4,.65]);
    E.shadow([-.15,0,0],1,.4,.5);}});

// ═══ FLEXIONES DIAMANTE ══════════════════════════════════════════════════════
GA.def('lib_pushup_diamond',{title:'Flexiones diamante',cam:{yaw:30,pitch:16},
  muscles:{triceps:1,pecs:.7,frontdelts:.45},labels:['Tríceps','Pectoral','Deltoides ant.'],init:{p:0,act:.5},
  timeline:PT('Baja · codos pegados','Empuja con los tríceps'),
  build(c,b,E){const pl=K.plank(b,null,{xT:-1,zH:.065,dhx:-.1,clr:.1,top:.61,p:c.p,k:pc(this)});palms(b,E,pl.hands,-42,[-1,.35,.2]);
    E.shadow([-.15,0,0],1,.35,.5);}});

// ═══ FLEXIONES ARQUERO ═══════════════════════════════════════════════════════
// Manos muy abiertas con los dedos hacia fuera. El cuerpo rígido gira sobre las puntas de los pies (yaw) hacia el brazo
// que flexiona; el ángulo se resuelve para que el otro brazo quede estirado. sd: lado que trabaja (+1 der, -1 izq).
GA.def('lib_pushup_archer',{title:'Flexiones arquero',cam:{yaw:28,pitch:20},
  muscles:{pecs:1,triceps:.6,frontdelts:.5,abs:.3},labels:['Pectoral','Tríceps','Deltoides ant.'],init:{p:0,sd:1,act:.5},
  timeline:[{p:1,dur:2,label:'Baja hacia la mano derecha',act:.85},{dur:.3,label:'Brazo izquierdo estirado',act:.9},
    {p:0,dur:1.2,label:'Empuja y vuelve al centro',act:1},{sd:-1,dur:.4,label:'Arriba · cambia de lado',act:.5},
    {p:1,dur:2,label:'Baja hacia la mano izquierda',act:.85},{dur:.3,label:'Brazo derecho estirado',act:.9},
    {p:0,dur:1.2,label:'Empuja y vuelve al centro',act:1},{sd:1,dur:.4,label:'Arriba · cambia de lado',act:.5}],
  build(c,b,E){const p=c.p,w=c.sd>=0?'R':'L',st=w==='R'?'L':'R',O=[-1,0,0],ZH=.58,A=45;
    // top: alcance con dedos al frente que deja los brazos casi estirados (≈10°) con los dedos a 45° (palmas propias abajo)
    // d0: brazo arriba (p=0, sin giro); el objetivo del brazo estirado pasa de d0 a armD(5): el giro arranca desde 0 sin salto
    const fd=s=>[Math.cos(A*D),0,K.sd(s)*Math.sin(A*D)],pk=q=>K.plank(b,null,{xT:-1,zH:ZH,top:.648,p:q,k:pc(this)}),e0=b.ikErr;
    const d0=K.memo(this,'d0',()=>{const h=pk(0).hands.L;return V.dist(b.sho('L'),K.palmT(h,{fd:fd('L')}));}),pl=pk(p),pf=b.pf,F={};b.ikErr=e0;
    for(const[s]of SS)F[s]=[b.j(s,'ank'),b.S[s].ffwd,b.S[s].fup];
    const rY=(v,a,o)=>{const q=V.rot(o?V.sub(v,O):v,UP,a);return o?V.add(q,O):q;};
    const pose=a=>{K.frame(b,rY(pf.o,a,1),rY(pf.U,a),rY(pf.F,a));};
    const T=s=>K.palmT(pl.hands[s],{fd:fd(s)}),kk=K.sd(w),L=mix(d0,K.armD(5),sst(0,.3,p));
    const a=p<.001?0:K.root(x=>{pose(-kk*x);return V.dist(b.sho(st),T(st))-L;},0,20*D);
    pose(-kk*a);for(const[s]of SS){b.foot(s,rY(F[s][0],-kk*a,1),rY(F[s][1],-kk*a),rY(F[s][2],-kk*a));b.leg(s,null,b.pdir(0,0,1));}
    const q=sst(0,.35,p);
    for(const[s,k]of SS){const P=V.lerp([-.6,.45,.6],s===w?[-.9,.45,.35]:[-.2,1,.15],q);
      K.palm(b,E,s,pl.hands[s],{fd:fd(s),pole:[P[0],P[1],k*P[2]]});}
    E.shadow([-.15,0,0],1,.45,.5);}});

// ═══ FLEXIONES PLIOMÉTRICAS ══════════════════════════════════════════════════
// q: profundidad (0 arriba → 1 abajo); p: vuelo (0 manos en el suelo → 1 máxima altura con las manos despegadas)
GA.def('lib_pushup_plyo',{title:'Flexiones pliométricas',cam:{yaw:30,pitch:12},
  muscles:{pecs:1,triceps:.6,frontdelts:.5},labels:['Pectoral','Tríceps','Deltoides ant.'],init:{p:0,q:0,act:.5},
  timeline:[{q:1,dur:1.1,label:'Baja controlado',act:.8},{q:0,dur:.24,label:'Empuja explosivo',act:1,ease:'in'},
    {p:1,dur:.2,label:'Despega las manos',act:1,ease:'out'},{p:0,dur:.2,label:'Aterriza',act:.9,ease:'in'},
    {q:.22,dur:.22,label:'Amortigua · codos suaves',act:.9,ease:'out'},{q:0,dur:.4,label:'Encadena la siguiente',act:.6}],
  build(c,b,E){const e0=b.ikErr,pl=K.plank(b,null,{xT:-1,zH:.32,p:c.q-.34*c.p,k:pc(this)});b.ikErr=e0;
    const H={};for(const[s,k]of SS){const h=pl.hands[s],S=b.sho(s),dx=S[0]-h[0]+.05,dz=S[2]-h[2],r=.618;
      H[s]=[h[0],Math.max(0,S[1]-.029-Math.sqrt(Math.max(0,r*r-dx*dx-dz*dz))),h[2]];}
    palms(b,E,H,6,[-.8,.45,.55]);
    // sombras de las palmas en el suelo: referencia del vuelo de las manos
    for(const[s]of SS)E.shadow([H[s][0]-.02,0,H[s][2]],.11+.2*H[s][1],.07+.12*H[s][1],.8-1.6*H[s][1]);
    E.shadow([-.15,0,0],1,.4,.5);}});

// ═══ FONDOS ══════════════════════════════════════════════════════════════════
const DT=(l1,l2,d1)=>[{p:1,dur:d1||2.2,label:l1,act:.8},{dur:.25,label:'Abajo · hombro al codo',act:.9},
  {p:0,dur:1.1,label:l2,act:1},{dur:.45,label:'Arriba · hombros abajo',act:.5}];
GA.def('lib_dip_bars',{title:'Fondos en paralelas',cam:{yaw:16,pitch:8},fitBox:[[-.55,0,-.48],[.48,2.2,.48]],
  muscles:{lowerpecs:1,triceps:.9,frontdelts:.5,pecs:.4},labels:['Pectoral inferior','Tríceps'],init:{p:0,act:.5},
  timeline:DT('Baja · torso al frente','Sube sin bloquear'),
  build(c,b,E){const ds=K.dipStation(E,{y:1.25,w:.26});K.support(b,{y:ds.y,w:ds.w,p:c.p,e0:8,lean1:30});E.shadow([0,0,0],.5,.4,.45);}});

// asistidos: de rodillas en la plataforma (palanca con pivote en la torre, detrás) que baja con el cuerpo y sube la pila
GA.def('lib_assisted_dip',{title:'Fondos asistidos en máquina',cam:{yaw:36,pitch:8},fitBox:[[-1.1,0,-.45],[.4,2.32,.45]],
  muscles:{triceps:1,lowerpecs:.8,frontdelts:.5},labels:['Tríceps','Pectoral inferior'],init:{p:0,act:.5},
  timeline:DT('Baja a 90° de codo','Empuja · la plataforma ayuda'),
  build(c,b,E){const HY=1.25,W=.27,CX=-.74,legs=b=>{for(const[s,k]of SS){b.legDir(s,[.06,-1,k*.02],[-1,-.04,0]);b.footRelax(s,25);}};
    const pose=p=>{K.support(b,{y:HY,w:W,p,e0:8,lean0:4,lean1:20,legs});return b.j('R','kne')[1]-.156;};
    const L0=K.memo(this,'ky',()=>pose(0));pose(c.p);
    const kn=b.j('R','kne'),PY=kn[1]-.056,PV=[CX+.1,.62,0],ky=PY-.1,ph=Math.asin((ky-PV[1])/.55),A=[PV[0]+.55*Math.cos(ph),ky,0];
    E.pad([kn[0]+.1,PY-.04,0],[kn[0]-.36,PY-.04,0],.44,.08,C.pad,{up:UP,layer:-1});
    E.beam(PV,A,.06,C.frame,{layer:-2});E.beam(A,[A[0],PY-.08,0],.05,C.frameD,{layer:-2});E.cyl([PV[0],PV[1],-.06],[PV[0],PV[1],.06],.05,C.frameD);
    for(const k of[-1,1]){E.beam([CX,0,k*.3],[CX,2.25,k*.3],.08,C.frame);E.beam([CX-.35,.03,k*.3],[CX+.3,.03,k*.3],.07,C.frameD,{layer:-1});
      E.beam([CX,HY,k*W],[.06,HY,k*W],.045,C.frame);E.cyl([-.1,HY,k*W],[.12,HY,k*W],.024,K.COL.grip);E.beam([CX,HY,k*.3],[CX,HY,k*W],.05,C.frame);}
    E.beam([CX,2.25,-.33],[CX,2.25,.33],.08,C.frame);E.beam([CX,.62,-.3],[CX,.62,.3],.06,C.frameD);
    const st=E.stack([CX-.2,0,0],{h:1.6,lift:Math.max(0,L0-ky)*1.2,n:14,sel:6,w:.28,bias:.2});
    E.cable(st,[CX-.2,1.75,0]);E.pulley([CX-.14,1.75,0],[0,0,1],.06);E.cable([CX-.08,1.75,0],[CX-.08,PV[1]+.05,0]);
    E.shadow([0,0,0],.55,.4,.45);}});

// en máquina: sentado, espalda al respaldo; los manerales (agarre neutro) giran sobre un eje detrás del respaldo
GA.def('lib_dip_machine',{title:'Fondos en máquina',cam:{yaw:40,pitch:10},fitBox:[[-.7,0,-.5],[.62,1.45,.5]],
  muscles:{triceps:1,lowerpecs:.6,frontdelts:.4},labels:['Tríceps','Pectoral inferior'],init:{p:0,act:.5},
  timeline:[{p:1,dur:1.2,label:'Empuja abajo · codos atrás',act:1},{dur:.4,label:'Abajo sin bloquear',act:1},
    {p:0,dur:2.4,label:'Sube lento',act:.75},{dur:.4,label:'Arriba · codo a 90°',act:.55}],
  build(c,b,E){const SY=.46,HZ=.29,p=c.p,seat=e=>K.seat(b,[0,SY,0],{tilt:-10,sp:[2],hd:6,sc:[e,0],feet:{x:.47,z:.17,toe:8}});
    const G=K.memo(this,'G',()=>{seat(0);const S=b.sho('R'),t=[S[0]-.07,S[1]-.43],u=[S[0]+.05,S[1]-.61],M=V.lerp(t,u,.5),n=[u[1]-t[1],t[0]-u[0]],
      l=(S[0]-.62-M[0])/n[0],P=[M[0]+n[0]*l,M[1]+n[1]*l];
      return{P,a0:Math.atan2(t[1]-P[1],t[0]-P[0]),a1:Math.atan2(u[1]-P[1],u[0]-P[0]),r:Math.hypot(t[0]-P[0],t[1]-P[1])};});
    seat(mix(.01,-.02,p));
    const a=mix(G.a0,G.a1,p),hx=G.P[0]+G.r*Math.cos(a),hy=G.P[1]+G.r*Math.sin(a),LZ=.37;
    for(const[s,k]of SS){b.arm(s,[hx,hy,k*HZ],[-1,.05,k*.15],[1,0,0]);
      const P=[G.P[0],G.P[1],k*LZ],Q=[hx-.11,hy,k*LZ];E.beam(P,Q,.045,C.frame);E.beam(Q,[hx-.11,hy,k*(HZ-.02)],.035,C.frameD);
      E.cyl([hx-.12,hy,k*HZ],[hx+.1,hy,k*HZ],.022,K.COL.grip);E.cyl([P[0],P[1],k*(LZ-.03)],[P[0],P[1],k*(LZ+.04)],.06,C.frameD);}
    E.pad([-.24,SY-.04,0],[.24,SY-.04,0],.36,.08,C.pad,{up:UP,layer:-1});
    E.pad(b.tpt(0,-.55,-.15),b.tpt(0,.02,-.15),.28,.08,C.pad,{up:b.tdir(0,0,1),layer:-1});
    const bk=b.tpt(0,-.3,-.2),X0=G.P[0];E.beam([bk[0],SY-.06,0],bk,.06,C.frame,{layer:-2});E.beam([0,0,0],[0,SY-.08,0],.08,C.frame,{layer:-1});
    E.beam([X0-.45,.03,0],[.55,.03,0],.08,C.frameD,{layer:-1});E.beam([X0,0,0],[X0,G.P[1]+.08,0],.08,C.frame,{layer:-2});
    E.beam([X0,G.P[1],-LZ-.04],[X0,G.P[1],LZ+.04],.06,C.frameD,{layer:-2});
    const st=E.stack([X0-.32,0,0],{h:1.3,lift:Math.max(0,G.a0-a)*.13,n:12,sel:5,w:.26,bias:.2});
    E.disc([X0,G.P[1],0],[0,0,1],.13,.03,C.frameD,{layer:-2});E.pulley([X0-.32,1.42,0],[0,0,1],.05);
    E.cable([X0-.27,1.42,0],[X0-.13,G.P[1],0]);E.cable([X0-.37,1.42,0],[X0-.37,st[1],0]);
    E.shadow([0,0,0],.7,.42,.5);}});

// en banco: manos en el borde, dedos al frente, talones en el suelo; la cadera baja pegada al banco
GA.def('lib_bench_dip',{title:'Fondos en banco o silla',cam:{yaw:38,pitch:12},
  muscles:{triceps:1,frontdelts:.5,lowerpecs:.4},labels:['Tríceps','Deltoides ant.'],init:{p:0,act:.5},
  timeline:[{p:1,dur:2,label:'Baja hasta codos a 90°',act:.8},{dur:.25,label:'Espalda cerca del banco',act:.9},
    {p:0,dur:1.1,label:'Sube sin encoger hombros',act:1},{dur:.45,label:'Arriba · brazos estirados',act:.5}],
  build(c,b,E){const p=c.p,BE=-.2,BH=.45,Z=.2,P=[BE-.075,BH,0],T=K.palmT(P),R=K.armD(mix(6,92,p)),dz=Z-DM.shW;
    b.pelvis([0,0,0],{tilt:mix(-4,4,p)});K.trunk(b,{sp:[4],hd:4,sc:[mix(-.015,.012,p),.01]});
    // hombros a distancia R de las manos; la x se corrige para que glúteos y lumbares queden 1 cm delante del banco
    let dx=.15;for(let i=0;i<2;i++){K.shift(b,V.sub([T[0]+dx,T[1]+Math.sqrt(R*R-dx*dx-dz*dz),0],V.lerp(b.sho('R'),b.sho('L'),.5)));
      dx-=Math.min(0,K.low(b,['gluR','gluL','pel','lum'],[BE+.01,0,0],[1,0,0]));}
    for(const[s,k]of SS){b.footFlat(s,[BE+.75,0,k*.13],-k*6);b.leg(s,null,[.2,1,k*.1]);K.palm(b,E,s,[P[0],BH,k*Z],{pole:[-1,-.1,k*.2]});}
    K.box(E,[BE-.2,0,0],[.4,BH,1.1],{kind:'bench'});E.shadow([.15,0,0],.75,.35,.5);}});

// anillas: apoyo con anillas pegadas al cuerpo; bajan hasta que el hombro pasa el codo
// anilla de madera (Ø int. 18 cm) inclinada hacia fuera: el puño en la parte baja, la correa sale por fuera del brazo
const ring=(E,g,k)=>{const u=V.norm([0,1,k*.75]),c=V.madd(g,u,.104);let q=null;for(let i=0;i<=16;i++){const t=Math.PI*i/8,n=V.add(c,V.add([.104*Math.sin(t),0,0],V.mul(u,-.104*Math.cos(t))));
  if(q)E.cap(q,n,.014,.014,K.COL.wood,{grp:'ring'+k});q=n;}return V.madd(c,u,.118);};
GA.def('lib_ring_dip',{title:'Fondos en anillas',cam:{yaw:32,pitch:6},fitBox:[[-.72,.5,-.4],[.45,2.32,.4]],
  muscles:{triceps:1,lowerpecs:.8,frontdelts:.6,abs:.25},labels:['Tríceps','Pectoral inferior'],init:{p:0,act:.5},
  timeline:DT('Baja · anillas pegadas','Sube sin abrir las anillas',2.4),
  build(c,b,E){const Y=1.3,W=.23;K.support(b,{y:Y,w:W,p:c.p,e0:4,e1:100,lean0:4,lean1:22,hip:14,knee:80});
    for(const k of[-1,1]){const t=ring(E,[0,Y,k*W],k);E.beam(t,[0,3.2,k*W],.036,K.COL.strap,{h:.005});E.boxA(V.add(t,[0,.12,0]),[.045,.06,.012],C.chrome);}
    E.shadow([0,0,0],.45,.35,.45);}});

// ═══ PRESS DE PECHO EN TRX ═══════════════════════════════════════════════════
// De espaldas al anclaje, sobre los metatarsos, cuerpo rígido inclinado. Las asas recorren la esfera de la correa:
// al bajar el pecho entre las asas el cuerpo se inclina más. TH: ángulo del cuerpo sobre la horizontal arriba.
GA.def('lib_trx_chest_press',{title:'Press de pecho en TRX',cam:{yaw:38,pitch:6},fitBox:[[-.15,0,-.35],[1.55,1.55,.35]],
  muscles:{pecs:1,frontdelts:.5,triceps:.5,abs:.3},labels:['Pectoral','Deltoides ant.','Tríceps'],init:{p:0,act:.5},
  timeline:[{p:1,dur:2,label:'Baja el pecho entre las asas',act:.8},{dur:.25,label:'Codos a 45°',act:.9},
    {p:0,dur:1.1,label:'Empuja · cadera firme',act:1},{dur:.45,label:'Arriba · cuerpo recto',act:.5}],
  build(c,b,E){const p=c.p,A=[-.3,2.5,0],TH=54,R=K.armD(4);
    const body=(th,q)=>{for(const[s,k]of SS)K.footBallOn(b,s,[0,0,k*.12],-k*4,96-th);
      const am=V.lerp(b.j('R','ank'),b.j('L','ank'),.5),u=V.xy(th),LL=Math.sqrt(K.legD(3)**2-(.12-DM.hipW)**2);
      b.pelvis(V.madd(am,u,LL),{tilt:90-th});K.trunk(b,{sp:[0],hd:-4,sc:[-.01,mix(.03,-.03,q)]});K.legs(b,{up:0});};
    const top=()=>SS.map(([s,k])=>V.madd(b.sho(s),V.norm(b.tdir(-k*.08,-.12,1)),R)),bot=()=>SS.map(([s,k])=>b.tpt(k*.23,-.16,.165));
    const g=K.memo(this,'g',()=>{const e0=b.ikErr;body(TH,0);const L=V.dist(A,V.lerp(...top(),.5)),
      t1=K.root(t=>{body(t,1);return V.dist(A,V.lerp(...bot(),.5))-L;},TH-30,TH);b.ikErr=e0;return{L,t1};});
    body(mix(TH,g.t1,p),p);const H0=top(),H1=bot(),H=[];
    SS.forEach(([s,k],i)=>{const h=V.madd(A,V.norm(V.sub(V.lerp(H0[i],H1[i],p),A)),g.L);H.push(h);b.arm(s,h,[-.9,.35,k*.45],[0,0,1]);});
    K.trx(E,A,H[0],H[1]);E.beam([A[0],A[1]+.03,-.6],[A[0],A[1]+.03,.6],.08,C.frame);
    E.shadow([.6,0,0],.9,.35,.5);}});

// ═══ FLEXIONES PIKE ══════════════════════════════════════════════════════════
// V invertida sobre los metatarsos, piernas rectas. Los hombros recorren un arco alrededor de las manos (ang° desde la
// vertical, + hacia los pies; radio armD(e)); el tronco (cabeza abajo) gira hasta que la cadera cae en el círculo de las
// piernas. Arriba brazos y tronco casi en línea; abajo la cabeza llega al suelo por delante de las manos.
const pike=(b,am,LL,T,e,ang,o)=>{const R=K.armD(e),a=ang*D,dz=T[2]-DM.shW,r=Math.sqrt(R*R-dz*dz),S=[T[0]-r*Math.sin(a),T[1]+r*Math.cos(a),0];
  const f=be=>{const q=be*D;K.frame(b,[0,1,0],[Math.sin(q),-Math.cos(q),0],[-Math.cos(q),-Math.sin(q),0]);K.trunk(b,o);
    K.shift(b,V.sub(S,V.lerp(b.sho('R'),b.sho('L'),.5)));return V.dist(b.pf.o,am)-LL;};f(K.root(f,0,80));};
GA.def('lib_pike_pushup',{title:'Flexiones pike',cam:{yaw:24,pitch:8},
  muscles:{frontdelts:1,triceps:.6,upperpecs:.4,sidedelts:.35},labels:['Deltoides ant.','Tríceps'],init:{p:0,act:.5},
  timeline:[{p:1,dur:2.2,label:'Baja la cabeza por delante',act:.8},{dur:.25,label:'Cabeza cerca del suelo',act:.9},
    {p:0,dur:1.1,label:'Empuja arriba · cadera alta',act:1},{dur:.45,label:'Arriba · V invertida',act:.5}],
  build(c,b,E){const p=c.p,HZ=.24,T=K.palmT([0,0,HZ]);
    for(const[s,k]of SS)K.footBallOn(b,s,[-.76,0,k*.11],-k*3,50);
    const am=V.lerp(b.j('R','ank'),b.j('L','ank'),.5),LL=Math.sqrt(K.legD(2)**2-(.11-DM.hipW)**2);
    const P=(e,q)=>pike(b,am,LL,T,e,mix(25,-8,q),{sp:[2],hd:mix(-10,-18,q),sc:[mix(.03,.012,q),mix(.01,0,q)]});
    const e1=K.memo(this,'e1',()=>{const e0=b.ikErr,r=K.root(e=>{P(e,1);return K.low(b,K.HEAD,[0,0,0])-.025;},70,140);b.ikErr=e0;return r;});
    P(mix(5,e1,p),p);K.legs(b,{up:0});
    for(const[s,k]of SS)K.palm(b,E,s,[0,0,k*HZ],{pole:[-.8,.5,k*.75]});
    E.shadow([-.4,0,0],.75,.35,.5);}});

// ═══ PARADA DE MANOS EN LA PARED (de espaldas a la pared en x=WX, mira a -X) ═══
// Tronco a g° de la vertical (cabeza hacia -X); hombros a armD(e) de las manos (a un palmo de la pared); las piernas
// rectas giran hasta apoyar los talones en la pared. Flexión: baja la cabeza al cojín por delante de las manos.
const WX=.3,HZ=.25,CT=.05,FD=[-1,0,0];
const hs=(b,o)=>{const r=o.g*D;K.frame(b,[0,1,0],[-Math.sin(r),-Math.cos(r),0],[-Math.cos(r),Math.sin(r),0]);
  K.trunk(b,o);const T=K.palmT([0,0,HZ],{fd:FD}),R=K.armD(o.e),dz=HZ-DM.shW;
  K.shift(b,V.sub([T[0]+o.dx,T[1]+Math.sqrt(R*R-o.dx*o.dx-dz*dz),0],V.lerp(b.sho('R'),b.sho('L'),.5)));
  const leg=a=>{const d=[Math.sin(a*D),Math.cos(a*D),0];let g=9;for(const[s]of SS){b.legDir(s,d,d);b.footRelax(s,45);
    for(const e of K.shoe(b.j(s,'ank'),b.S[s].ffwd,b.S[s].fup))g=Math.min(g,K.gap(e,[WX,0,0],FD));}return g;};
  leg(K.root(leg,-15,40));};
GA.def('lib_hspu_wall',{title:'Flexiones de parada de manos en la pared',cam:{yaw:-28,pitch:4},fitBox:[[-.45,0,-.25],[.3,2.28,.25]],
  muscles:{frontdelts:1,triceps:.7,sidedelts:.45,traps:.4,upperpecs:.3},labels:['Deltoides ant.','Tríceps','Trapecio'],init:{p:0,act:.6},
  timeline:[{p:1,dur:2.5,label:'Baja la cabeza al cojín',act:.8},{dur:.3,label:'Toca suave · sin apoyar',act:.9},
    {p:0,dur:1.4,label:'Empuja hasta estirar',act:1},{dur:.6,label:'Arriba · brazos bloqueados',act:.6}],
  build(c,b,E){const p=c.p,ho=this.hold,q=ho?0:p,
    P=(e,q)=>hs(b,{g:mix(3,13,q),dx:mix(.015,-.05,q),e,sp:[-3],hd:mix(-14,-4,q),sc:[ho?mix(.025,.035,p):mix(.03,.012,q),0]});
    const g=ho?{e1:4}:K.memo(this,'g',()=>{const e0=b.ikErr,e1=K.root(e=>{P(e,1);return K.low(b,K.HEAD,[0,CT,0])-.004;},60,140);
      P(e1,1);b.ikErr=e0;return{e1,hx:b.headC[0]};});
    P(mix(4,g.e1,q),q);
    for(const[s,k]of SS)K.palm(b,E,s,[0,0,k*HZ],{fd:FD,pole:[1,.25,k*.6]});
    if(!ho)K.box(E,[g.hx,0,0],[.3,CT,.34],{kind:'soft'});
    K.wall(E,{x:WX,h:2.4,w:.9});E.shadow([.05,0,0],.4,.35,.5);}});
GA.alias('lib_handstand_hold','lib_hspu_wall',{title:'Parada de manos contra la pared',hold:1,
  muscles:{frontdelts:1,traps:.5,triceps:.5,sidedelts:.4,abs:.35},labels:['Deltoides ant.','Trapecio','Tríceps'],init:{p:0,act:.85},
  timeline:[{p:1,dur:2.5,label:'Mantén · empuja el suelo',act:.9,ease:'sin'},{p:0,dur:2.5,label:'Abdomen firme · en línea',act:1,ease:'sin'}]});

})(window.GymAnim);
