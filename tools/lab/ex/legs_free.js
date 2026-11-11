/* Piernas con peso libre / máquina de gemelos: RDL con mancuernas, sentadilla goblet, elevación de talones */
(function(GA){
const C=GA._.COL,DIM=GA._.DIM,V=GA._.V;
// centro de masas aproximado (fracciones de Winter) + masas externas [[pos,m]]
const com=(b,xm)=>{let m=0,s=[0,0,0];const add=(p,w)=>{s=V.madd(s,p,w);m+=w;};
  add(b.headC,.081);add(V.lerp(b.pf.o,V.lerp(b.sho('L'),b.sho('R'),.5),.5),.497);
  for(const k of['L','R']){const S=b.S[k];add(V.lerp(S.sho,S.elb,.44),.028);add(V.lerp(S.elb,S.grip,.5),.022);
    add(V.lerp(S.hip,S.kne,.43),.1);add(V.lerp(S.kne,S.ank,.43),.047);add(S.ank,.015);}
  if(xm)for(const[p,w]of xm)add(p,w);return V.mul(s,1/m);};
// distancia cadera-tobillo para una flexión de rodilla dada
const legD=kf=>Math.sqrt(DIM.th*DIM.th+DIM.sh*DIM.sh+2*DIM.th*DIM.sh*Math.cos(kf*Math.PI/180));

// ═══ PESO MUERTO RUMANO CON MANCUERNAS ══════════════════════════════════════
// Pies a la anchura de cadera, rodillas suaves (~15-20°) casi fijas, tibias verticales.
// Bisagra de cadera: la cadera va atrás, columna neutra hasta ~75°, mancuernas rozando
// muslos y tibias con trayectoria vertical sobre el medio pie (equilibrio por CdM).
GA.def('lib_rdl_db',{
  title:'Peso muerto rumano (mancuernas)',
  cam:{yaw:-32,pitch:8},
  muscles:{hams:1,glutes:.9,lowback:.5},
  labels:['Isquiotibiales','Glúteos','Lumbares'],
  init:{p:0,act:.7},
  timeline:[
    {p:1,dur:3,label:'Baja · cadera atrás',act:.8},
    {dur:.3,label:'Estira isquios',act:.9},
    {p:0,dur:1.5,label:'Sube · empuja la cadera',act:1},
    {dur:.6,label:'Arriba · aprieta glúteos',act:.7}
  ],
  build(c,b,E){
    const p=c.p,TO=6,FZ=.11,HZ=.16,L=.629,XB=.105;
    b.footFlat('R',[0,0,FZ],-TO);b.footFlat('L',[0,0,-FZ],TO);
    const AK={R:b.j('R','ank').slice(),L:b.j('L','ank').slice()},an=AK.R,tilt=E.mix(3,82,p),d=legD(E.mix(10,21,E.sstep(0,.45,p))),dz=an[2]-DIM.hipW;
    const leg=(s,y)=>{const S=b.S[s];if(y>S.kne[1]){const t=(S.hip[1]-y)/(S.hip[1]-S.kne[1]),a=V.norm(V.sub(S.kne,S.hip));
        return V.lerp(S.hip,S.kne,t)[0]+E.mix(.088,.06,t)/Math.max(.3,-a[1]);}
      const t=E.clamp((S.kne[1]-y)/(S.kne[1]-S.ank[1]),0,1),a=V.norm(V.sub(S.ank,S.kne));
      return V.lerp(S.kne,S.ank,t)[0]+E.mix(.058,.04,t)/Math.max(.3,-a[1]);};
    const db={};
    const pose=hx=>{const hy=an[1]+Math.sqrt(Math.max(d*d-(hx-an[0])**2-dz*dz,.1));
      b.pelvis([hx,hy,0],{tilt});b.spine(E.mix(0,-2,p));b.head(4);b.scap('both',-.008,-.008);
      for(const s of['R','L']){const k=s==='R'?1:-1;b.leg(s,AK[s],V.yaw(-k*TO));}
      for(const s of['R','L']){const k=s==='R'?1:-1,sh=b.sho(s);let y=sh[1]-L,x=sh[0];
        for(let i=0;i<4;i++){x=leg(s,y)+.038;const dx=x-sh[0],dzz=k*HZ-sh[2];y=sh[1]-Math.sqrt(Math.max(L*L-dx*dx-dzz*dzz,.01));}
        db[s]=[x,y,k*HZ];b.arm(s,db[s],b.tdir(k*.45,0,-1),[0,0,1]);}
      return com(b,[[db.R,.13],[db.L,.13]])[0]-XB;};
    pose(E.solve(pose,.15,-.6));
    for(const s of['R','L'])E.dumbbell(b.j(s,'grip'),[0,0,1],{r:.05,hl:.05,len:.12});
    E.trace('mancuerna',V.add(db.R,[0,0,.115]));
    E.shadow([.05,0,0],.5,.32,.55);
  }
});

// ═══ SENTADILLA GOBLET ══════════════════════════════════════════════════════
// Mancuerna vertical pegada al esternón, sujeta por la cabeza superior con ambas manos,
// codos abajo. Pies algo más anchos que hombros, puntas ~20° fuera, rodillas siguen la
// punta, talones apoyados, tronco erguido (~25°), baja por debajo del paralelo con los
// codos por dentro de las rodillas. Cadera resuelta para mantener el CdM sobre el medio pie.
let gob=null;
GA.def('lib_goblet_squat',{
  title:'Sentadilla goblet (mancuerna)',
  cam:{yaw:34,pitch:9},
  muscles:{quads:1,glutes:.9,adductors:.6,abs:.3},
  labels:['Cuádriceps','Glúteos','Aductores'],
  init:{p:0,act:.45},
  timeline:[
    {p:1,dur:2.5,label:'Baja · rodillas afuera',act:.85},
    {dur:.3,label:'Abajo · bajo el paralelo',act:.95},
    {p:0,dur:1.3,label:'Sube empujando el suelo',act:1},
    {dur:.6,label:'Arriba · pecho alto',act:.45}
  ],
  build(c,b,E){
    const p=c.p,TO=20,FZ=.2,R=.074,HL=.085,LEN=.12,XB=.115,MDB=.3;
    for(const s of['R','L']){const k=s==='R'?1:-1;b.footFlat(s,[0,0,k*FZ],-k*TO);}
    const AK={R:b.j('R','ank').slice(),L:b.j('L','ank').slice()},LN=q=>E.mix(3,28,Math.pow(q,1.15));let lean=LN(p),hc,ax;
    const pose=(hx,hy)=>{b.pelvis([hx,hy,0],{tilt:lean});b.spine(-3);b.head(-lean*.3);b.scap('both',-.005,-.008);
      for(const s of['R','L']){const k=s==='R'?1:-1,A=AK[s];b.leg(s,A,V.sub(V.add(V.madd(A,V.yaw(-k*TO),.32),[0,.3,0]),V.lerp(b.hip(s),A,.5)));}
      ax=V.norm(V.lerp(b.tdir(0,1,.17),[0,1,0],.6));hc=b.tpt(0,-.11,.20);
      for(const s of['R','L']){const k=s==='R'?1:-1;
        b.arm(s,V.add(V.madd(hc,ax,LEN/2-.035),b.tdir(k*.045,0,0)),b.tdir(-k*.25,-1,.7),ax);}
      return com(b,[[hc,MDB]])[0]-XB;};
    const hxOf=hy=>E.solve(hx=>pose(hx,hy),.3,-.4);
    if(!gob){const an=AK.R,dz=an[2]-DIM.hipW;gob={};
      // arriba: rodillas casi extendidas (~6°) · abajo: cadera 9 cm por debajo de la rodilla
      lean=LN(0);let y=.9;for(let i=0;i<4;i++){const hx=hxOf(y);y=an[1]+Math.sqrt(legD(6)**2-(hx-an[0])**2-dz*dz);}gob.t=y;
      lean=LN(1);gob.b=E.solve(hy=>{hxOf(hy);return hy-b.j('R','kne')[1]+.09;},.25,.6);lean=LN(p);}
    const hy=E.mix(gob.t,gob.b,p),hx=hxOf(hy);b.ikErr=0;pose(hx,hy);
    E.dumbbell(hc,ax,{r:R,hl:HL,len:LEN});
    E.shadow([.05,0,0],.55,.4,.55);
  }
});

// ═══ ELEVACIÓN DE TALONES EN MÁQUINA (DE PIE) ═══════════════════════════════
// Hombreras sobre los hombros, manos en las asas, metatarsos en el borde de la plataforma
// y talones colgando. Cuerpo rígido (rodillas extendidas sin bloquear): sólo se mueve el
// tobillo, de estiramiento completo (~18° bajo la plataforma) a flexión plantar máxima (~32°).
// El carro de las hombreras sube por una guía vertical; la pila sube lo mismo (cable 1:1).
GA.def('lib_calf_machine',{
  title:'Elevación de talones (máquina)',
  cam:{yaw:-20,pitch:7},
  fitBox:[[-.25,0,-.32],[.9,1.98,.32]],
  muscles:{calves:1},
  labels:['Gemelos','Sóleo'],
  timeline:[
    {p:1,dur:1.2,label:'Sube completo',act:1},
    {dur:1,label:'Aguanta arriba',act:1},
    {p:0,dur:2.8,label:'Baja lento · estira',act:.75},
    {dur:.5,label:'Pausa en estiramiento',act:.55}
  ],
  build(c,b,E){
    const p=c.p,PY=.16,FZ=.1,SX=.03,CX=.46,STX=.74,d=legD(6);
    // cuerpo rígido sobre los metatarsos: inclinación resuelta para que el hombro quede en la guía (x=SX)
    const body=pitch=>{for(const s of['R','L']){const k=s==='R'?1:-1;b.footBall(s,[.008,PY+.011*Math.pow(Math.max(0,pitch-14)/18,1.6),k*FZ],-k*3,pitch);}
      const am=V.lerp(b.j('R','ank'),b.j('L','ank'),.5),dh=Math.sqrt(d*d-(b.j('R','ank')[2]-DIM.hipW)**2);
      const pose=l=>{const r=l*Math.PI/180;b.pelvis(V.add(am,[dh*Math.sin(r),dh*Math.cos(r),0]),{tilt:l+1});b.spine(-1);b.head(-l*.8);
        return b.sho('R')[0]-SX;};
      pose(E.solve(pose,-5,20));return(b.tpt(.14,-.015,-.01)[1]+b.tpt(-.14,-.015,-.01)[1])/2;};
    const sy0=body(-18),sy=body(E.mix(-18,32,p)),lift=sy-sy0+.03,AY=sy+.04;
    for(const s of['R','L']){const k=s==='R'?1:-1;b.leg(s,null,[1,0,k*.08]);}
    // carro: hombreras sobre los hombros, brazos del yugo por fuera, asas verticales delante
    for(const s of['R','L']){const k=s==='R'?1:-1;
      E.pad([SX-.11,sy+.04,k*.155],[SX+.09,sy+.04,k*.155],.1,.08,C.pad,{up:[0,1,0]});
      E.beam([SX-.08,AY,k*.24],[CX-.05,AY,k*.24],.04,C.frame);E.beam([SX-.01,AY,k*.2],[SX-.01,AY,k*.24],.03,C.frameD);
      E.beam([SX+.27,AY,k*.24],[SX+.27,sy-.07,k*.24],.03,C.frame);E.cyl([SX+.27,sy-.07,k*.24],[SX+.27,sy-.21,k*.24],.017,C.rubber);
      b.arm(s,[SX+.27,sy-.14,k*.24],[0,-1,k*.12],[0,1,0]);}
    E.beam([CX-.05,AY,-.26],[CX-.05,AY,.26],.045,C.frame);
    E.boxA([CX,sy-.05,0],[.06,.26,.2],C.frameD);
    // torre: guías del carro, pila de pesas y cable 1:1 (carro → poleas de suelo → polea superior → pila)
    for(const k of[-1,1])E.cyl([CX,.12,k*.07],[CX,1.98,k*.07],.012,C.chrome);
    E.beam([CX+.07,0,0],[CX+.07,2.02,0],.08,C.frame);E.beam([CX+.07,2.02,0],[STX+.22,2.02,0],.07,C.frame);
    E.beam([STX+.22,0,0],[STX+.22,2.02,0],.08,C.frame,{bias:.3});
    const top=E.stack([STX,.07,0],{h:1.75,lift,n:14,sel:6,w:.28,bias:.3});
    E.boxA([STX,.035,0],[.14,.07,.3],C.frameD);
    const P1=[CX,.08,0],P2=[STX+.12,.08,0],P3=[STX+.06,1.92,0];
    E.pulley(P1,[0,0,1],.04);E.pulley(P2,[0,0,1],.04);E.pulley(P3,[0,0,1],.06);
    E.cable([CX,sy-.18,0],P1);E.cable(P1,P2);E.cable(P2,[STX+.12,1.92,0]);E.cable([STX,1.92,0],top);
    // plataforma (borde trasero en x=0: talones colgando) y base
    E.boxA([.17,PY/2,0],[.34,PY,.6],C.frame,{layer:-1});
    E.boxA([.17,PY-.002,0],[.33,.006,.58],'#1d2127',{layer:-1,outline:false});
    E.beam([-.05,.03,0],[STX+.25,.03,0],.09,C.frameD,{layer:-2});
    E.shadow([.15,0,0],.55,.4,.55);
  }
});

})(window.GymAnim);
