// Remos y espalda alta: polea, máquina, invertidos, banda, TRX, aperturas inversas, face pull, Y-T-W y rotación externa
(function(GA){
const K=GA._.kit,V=GA._.V,C=GA._.COL,DM=GA._.DIM,SS=K.SS,mix=K.mix,sst=K.sst,M=Math,RD=K.D,UP=[0,1,0],Z=[0,0,1],L1={layer:-1},FR=C.frame,FD=C.frameD,BD=K.BAND;
const T=(u,a,h,b,d,c,r,e)=>[{p:1,dur:u,label:a,act:1},{dur:h,label:b,act:1},{p:0,dur:d,label:c,act:.75},{dur:r,label:e,act:.5}];
const def=(id,o)=>GA.def('lib_'+id,o),LD=['Deltoides post.','Romboides','Trapecio'],LR=['Romboides','Dorsales','Bíceps'];
const mid=b=>V.lerp(b.sho('R'),b.sho('L'),.5);
// columna de polea: B base, f hacia la persona, polea a altura y con cable hasta 'at'; la pila (detrás) sube 'lift'
const col=(E,B,f,y,at,lift)=>{const s=V.cross(UP,f),q=(a,h,c)=>V.add(V.add([B[0],h,B[2]],V.mul(f,a)),V.mul(s,c||0)),P=q(.09,y),H=2.1,yw=M.atan2(-f[2],f[0])/RD;
  let n=V.cross(V.sub(at,P),UP);n=V.len(n)<1e-3?s:V.norm(n);
  for(const c of[-.16,.16])E.beam(q(-.22,0,c),q(-.22,H,c),.06,FR);
  E.beam(q(.03,0),q(.03,H),.07,FR);E.beam(q(.07,H),q(-.26,H),.07,FR);E.beam(q(.3,.03),q(-.5,.03),.09,FD,L1);
  E.boxA(q(.04,y),[.1,.14,.1],FD,{yaw:yw});E.pulley(P,n,.04);E.cable(at,P);
  const top=E.stack(q(-.22,0),{h:1.9,lift,n:14,sel:5,w:.26,yaw:yw+90,bias:.2});
  E.cable(q(.09,y+.04),q(.09,H-.05));E.cable(q(.09,H-.05),q(-.22,H-.05));E.cable(q(-.22,H-.09),top);
  for(const a of[.09,-.22])E.pulley(q(a,H-.09),s,.04);};
// maneral en D: puño g, eje ax, cable hacia 'to' → anilla
const dh=(E,g,ax,to)=>{const d=V.norm(V.sub(to,g)),a=V.norm(V.perp(ax,d)),r=V.madd(g,d,.075);E.cyl(V.madd(g,a,-.062),V.madd(g,a,.062),.016,K.COL.grip);
  for(const k of[-1,1])E.line(V.madd(g,a,k*.062),r,.006,'#1b1e22');E.sph(r,.009,C.chrome);return r;};
// banco y plataforma del remo sentado (columna en x=1, polea baja en [.91,.34,0]): coloca pies y piernas
const PU=[.91,.34,0];
const seatBase=(b,E)=>{const n=V.norm([-.94,.34,0]),fu=V.norm([.34,.94,0]);
  for(const[s,k]of SS){b.footFlat(s,[.8,.12,k*.14],-k*5,n);b.leg(s,null,[.2,1,k*.3]);
    const fc=V.madd(V.madd([.8,.12,k*.14],fu,.13),n,-.02);E.box(fc,[V.mul(n,.02),V.mul(fu,.16),[0,0,.075]],FD);E.beam(V.madd(fc,n,-.03),[.9,.05,k*.14],.04,FR);}
  E.pad([-.75,.38,0],[.32,.38,0],.3,.08,C.pad);E.beam([-.05,0,0],[-.05,.34,0],.08,FR);E.beam([-.6,0,0],[-.6,.34,0],.07,FR);
  E.beam([-.75,.03,0],[1.05,.03,0],.09,FD,L1);E.shadow([.2,0,0],.9,.4,.55);};
// tronco del remo sentado (inclinación ln0 → 0) y escápulas
const seatPose=(b,q,ln,sc)=>{const l=mix(ln,0,sst(0,.85,q));b.pelvis([0,.51,0],{tilt:l});b.spine(mix(1,-3,q));b.head(-l*.5);
  if(sc)b.scap('both',-.006*q,mix(.024,-.035,q));else{b.scap('R',-.006*q,mix(.035,-.035,q));b.scap('L',0,0);}};

// ═══ REMOS EN POLEA ═════════════════════════════════════════════════════════
def('row_cable_wide',{title:'Remo en cable con agarre ancho',cam:{yaw:-44,pitch:12},fitBox:[[-.35,0,-.45],[1.0,1.35,.45]],
  muscles:{midback:1,reardelts:.6,lats:.5,biceps:.35},labels:['Romboides','Deltoides post.','Dorsales'],
  timeline:T(1.3,'Al pecho · codos abiertos',.9,'Junta escápulas',2.8,'Vuelve lento · estira',.4,'Brazos largos · pecho alto'),
  build(c,b,E){const p=c.p;seatPose(b,0,10,1);const sm=mid(b),h0=V.madd(sm,V.norm(V.sub(PU,sm)),.6);seatPose(b,1,10,1);const h1=b.tpt(0,-.2,.155);seatPose(b,p,10,1);
    const h=V.lerp(h0,h1,p);h[1]+=.03*M.sin(M.PI*p);
    for(const[s,k]of SS)b.arm(s,V.add(h,[0,0,k*.31]),[-.6,-.25,k],Z);
    seatBase(b,E);E.bar(V.add(h,[0,0,-.52]),V.add(h,[0,0,.52]),{r:.013});for(const k of[-1,1])E.cyl(V.add(h,[0,0,k*.22]),V.add(h,[0,0,k*.42]),.017,C.rubber);
    const at=V.madd(h,V.norm(V.sub(PU,h)),.05);E.sph(at,.018,C.chrome);E.trace('barra',V.add(h,[0,0,.45]));
    col(E,[1,0,0],[-1,0,0],.34,at,V.dist(PU,at)-V.dist(PU,h0)+.05);}
});

def('row_cable_one_arm',{title:'Remo a una mano en cable',cam:{yaw:-36,pitch:12},fitBox:[[-.35,0,-.4],[1.0,1.35,.4]],
  muscles:{lats_R:1,midback:.7,biceps_R:.4,reardelts_R:.3},labels:['Dorsales','Romboides','Bíceps'],
  timeline:T(1.2,'Codo atrás pegado al cuerpo',.8,'Aprieta 1 s',2.6,'Estira sin girar el tronco',.4,'Brazo largo · hombro adelante'),
  build(c,b,E){const p=c.p;seatPose(b,0,9);const s0=b.sho('R'),g0=V.madd(s0,V.norm(V.sub(PU,s0)),.6);seatPose(b,1,9);const g1=b.tpt(.2,-.38,.08);seatPose(b,p,9);
    const g=V.lerp(g0,g1,p);g[1]+=.03*M.sin(M.PI*p);const ax=V.norm(V.perp(UP,V.sub(PU,g)));
    b.arm('R',g,[-1,-.2,.3],ax);seatBase(b,E);b.leg('R',null,[.2,1,.6]);const kn=b.j('L','kne'),hl=b.hip('L'),td=V.norm(V.sub(kn,hl)),tn=V.norm(V.perp(UP,td));
    K.palm(b,E,'L',V.madd(V.lerp(hl,kn,.7),tn,.07),{fd:td,n:tn,pole:[-.3,.2,-1]});
    const at=dh(E,g,ax,PU);E.trace('maneral',g);col(E,[1,0,0],[-1,0,0],.34,at,V.dist(PU,at)-V.dist(PU,g0)+.075);}
});

def('row_cable_standing',{title:'Remo de pie en cable',cam:{yaw:-36,pitch:8},fitBox:[[-.35,0,-.3],[.95,1.85,.3]],
  muscles:{midback:1,lats:.7,reardelts:.4,biceps:.4},labels:['Romboides','Dorsales','Deltoides post.'],
  timeline:T(1.3,'Al abdomen · sin echarte atrás',.9,'Junta escápulas',2.8,'Estira lento · tronco firme',.4,'Rodillas suaves'),
  build(c,b,E){const p=c.p,P=[1.06,1.02,0];
    const pose=q=>K.stand(b,{fx:-.12,fz:.15,toe:8,kf:20,tilt:mix(12,6,q),x:-.06,sp:[mix(2,-2,q)],hd:-6,sc:[-.006*q,mix(.03,-.035,q)]});
    pose(0);const sm=mid(b),h0=V.madd(sm,V.norm(V.sub(P,sm)),.6);pose(1);const h1=b.tpt(0,-.42,.17);pose(p);
    const h=V.lerp(h0,h1,p);for(const[s,k]of SS)b.arm(s,V.add(h,[0,0,k*.19]),[-1,-.4,k*.3],Z);
    E.bar(V.add(h,[0,0,-.3]),V.add(h,[0,0,.3]),{r:.014});const at=V.madd(h,V.norm(V.sub(P,h)),.05);E.sph(at,.018,C.chrome);E.trace('barra',V.add(h,[0,0,.25]));
    col(E,[1.15,0,0],[-1,0,0],1.02,at,V.dist(P,at)-V.dist(P,h0)+.05);E.shadow([0,0,0],.45,.35,.55);}
});

// ═══ MÁQUINAS DE PALANCA ════════════════════════════════════════════════════
// circunferencia (plano XY) por A y B con centro a la altura py: {P,R,a0,a1}
const circ=(A,B,py)=>{const m=[(A[0]+B[0])/2,(A[1]+B[1])/2],dx=A[0]-B[0],dy=A[1]-B[1],l=M.hypot(dx,dy);let n=[-dy/l,dx/l];if(n[1]<0)n=[-n[0],-n[1]];
  const t=(py-m[1])/n[1],P=[m[0]+n[0]*t,m[1]+n[1]*t];return{P,R:M.hypot(A[0]-P[0],A[1]-P[1]),a0:M.atan2(A[1]-P[1],A[0]-P[0]),a1:M.atan2(B[1]-P[1],B[0]-P[0])};};
// remo en T con apoyo de pecho: palanca desde un eje bajo detrás de la plataforma; asas neutras sobre postes, discos en la punta
const tb=(b,q)=>{for(const[s,k]of SS)b.footFlat(s,[-.44,.12,k*.15],-k*6);b.pelvis([-.17,1.0,0],{tilt:50});
  K.trunk(b,{sp:[mix(0,-4,q)],hd:-8,sc:[-.006*q,mix(.03,-.035,q)]});K.legs(b,{up:.3});};
def('tbar_row_supported',{title:'Remo en T en máquina',cam:{yaw:-36,pitch:10},fitBox:[[-.75,0,-.4],[.95,1.7,.4]],
  muscles:{midback:1,lats:.8,reardelts:.5,biceps:.5},labels:['Romboides','Dorsales','Deltoides post.'],
  timeline:T(1.3,'Codos atrás pegados',.9,'Aprieta omóplatos 1 s',2.8,'Baja lento · pecho firme',.4,'Brazos largos'),
  build(c,b,E){const p=c.p,O=.17,G=K.memo(this,'g',()=>{tb(b,0);const s=b.sho('R'),A=[s[0],s[1]-.6];tb(b,1);const B=b.tpt(.2,-.36,.07);return circ(A,B,.1);});
    tb(b,p);const P=G.P,f=mix(G.a0,G.a1,p),rL=M.sqrt(G.R*G.R-O*O),th=f-M.atan2(O,rL),e=[M.cos(th),M.sin(th),0],nL=[-e[1],e[0],0],H=[P[0]+G.R*M.cos(f),P[1]+G.R*M.sin(f),0],Q=V.madd(H,nL,-O),PV=[P[0],P[1],0];
    for(const[s,k]of SS){const g=V.add(H,[0,0,k*.2]);b.arm(s,g,V.add(b.tdir(k*.25,-.7,0),[0,.2,0]),e);
      E.cyl(V.madd(g,e,-.065),V.madd(g,e,.065),.017,K.COL.grip);E.beam(V.add(Q,[0,0,k*.2]),V.madd(g,nL,-.02),.03,FD);}
    E.beam(V.add(Q,[0,0,-.22]),V.add(Q,[0,0,.22]),.035,FD);E.beam(PV,V.madd(PV,e,rL+.62),.055,FR);E.cyl(V.madd(PV,e,rL+.6),V.madd(PV,e,rL+.92),.025,C.chrome);
    E.plate(V.madd(PV,e,rL+.67),e,.225,{th:.05});E.plate(V.madd(PV,e,rL+.73),e,.17,{th:.035});E.trace('asas',H);
    const pc=b.tpt(0,-.24,.168),Tu=b.tdir(0,1,0),Fd=b.tdir(0,0,1);E.pad(V.madd(pc,Tu,-.2),V.madd(pc,Tu,.16),.28,.08,C.pad,{up:Fd});
    for(const k of[-1,1]){const a=V.add(V.madd(V.madd(pc,Tu,-.17),Fd,.05),[0,0,k*.09]);E.beam(a,[a[0],0,a[2]],.04,FR);}
    E.boxA([-.36,.06,0],[.42,.12,.5],FD,L1);E.boxA([-.36,.122,0],[.4,.006,.46],'#1d2126',{layer:-1,outline:false});
    E.beam([P[0]-.1,.03,0],[.8,.03,0],.08,FD,L1);E.beam(PV,[P[0],.03,0],.08,FR);E.cyl([P[0],P[1],-.08],[P[0],P[1],.08],.03,C.chrome);E.shadow([-.1,0,0],.8,.4,.55);}
});

// remo alto sentado: palancas iso-laterales con eje alto detrás del asiento; la pila sube con el giro (leva r .15)
const hp=(b,q)=>{b.pelvis([0,.56,0],{tilt:8});b.spine(-3);b.head(-3);b.scap('both',mix(.03,-.016,q),mix(.02,-.032,q));};
def('row_machine_high',{title:'Remo alto en máquina',cam:{yaw:-70,pitch:10},fitBox:[[-.4,0,-.4],[.7,1.62,.4]],
  muscles:{lats:1,midback:.8,reardelts:.5,biceps:.4,traps:.3},labels:['Dorsales','Romboides','Deltoides post.'],
  timeline:T(1.3,'Codos a la cadera',.9,'Aprieta 1 s · pecho al apoyo',2.8,'Controla la vuelta',.5,'Estira arriba'),
  build(c,b,E){const p=c.p,LZ=.36,G=K.memo(this,'g',()=>{hp(b,0);const s=b.sho('R'),A=[s[0]+.6*M.cos(42*RD),s[1]+.6*M.sin(42*RD)];hp(b,1);const B=b.tpt(.23,-.26,.06);return circ(A,B,1.9);});
    hp(b,p);const P=G.P,th=mix(G.a0,G.a1,p),u=[M.cos(th),M.sin(th),0];
    for(const[s,k]of SS){const g=[P[0]+G.R*u[0],P[1]+G.R*u[1],k*.23],ha=V.rot(u,Z,-.4);b.arm(s,g,V.lerp([-.2,-1,k*.5],[-.6,-1,k*.3],p),ha);
      E.beam([P[0],P[1],k*LZ],V.add(V.madd([P[0],P[1],0],u,G.R+.08),[0,0,k*LZ]),.045,FR);E.cyl(V.madd(g,ha,-.075),V.madd(g,ha,.075),.017,C.rubber);
      for(const e of[-.085,.085]){const q=V.madd(g,ha,e),r=V.madd([P[0],P[1],0],u,V.dot(V.sub(q,[P[0],P[1],0]),u));E.beam(q,[r[0],r[1],k*LZ],.025,FD);}
      if(s==='R')E.trace('maneral',g);}
    for(const[s,k]of SS){b.footFlat(s,[.42,0,k*.17],-k*6);b.leg(s,null,[1,.3,k*.15]);}
    E.pad([-.24,.43,0],[.17,.43,0],.36,.08,C.pad);E.beam([0,0,0],[0,.39,0],.08,FR);E.beam([P[0]-.3,.03,0],[.8,.03,0],.09,FD,L1);
    const pc=b.tpt(0,-.2,.167),Tq=b.tdir(1,0,0),Fd=b.tdir(0,0,1);E.pad(V.madd(pc,Tq,-.13),V.madd(pc,Tq,.13),.3,.08,C.pad,{up:Fd});
    E.beam(V.madd(pc,Fd,.05),[.62,pc[1],0],.05,FR);E.beam([.62,pc[1],0],[.62,0,0],.06,FR);
    E.beam([P[0],0,0],[P[0],P[1]+.1,0],.1,FR);E.cyl([P[0],P[1],-LZ-.05],[P[0],P[1],LZ+.05],.03,C.chrome);E.pulley([P[0],P[1],0],Z,.15);
    const top=E.stack([P[0]-.3,0,0],{h:1.6,lift:(G.a0-th)*.15,n:12,sel:5,w:.26,yaw:90,bias:.2});E.cable([P[0],P[1]+.15,0],[P[0]-.26,P[1]+.15,0]);E.pulley([P[0]-.26,P[1]+.11,0],Z,.04);E.cable([P[0]-.3,P[1]+.11,0],top);
    E.beam([P[0]-.37,1.62,0],[P[0],1.62,0],.05,FD);E.beam([P[0]-.26,P[1]+.11,-.035],[P[0],P[1]+.11,-.035],.03,FD);E.shadow([.1,0,0],.8,.45,.55);}
});

// ═══ REMOS INVERTIDOS (peso corporal) ════════════════════════════════════════
// cuerpo rígido sobre los talones (x=XF), inclinado th° atrás desde la vertical (cabeza hacia -X); q = retracción escapular
const lean=(b,th,XF,q)=>{const r=th*RD,f=[M.cos(r),M.sin(r),0],u=[-M.sin(r),M.cos(r),0];
  for(const[s,k]of SS)K.footOn(b,s,[XF,0,k*.12],f,u);
  const am=V.lerp(b.j('R','ank'),b.j('L','ank'),.5),LL=M.sqrt(K.legD(3)**2-(.12-DM.hipW)**2);
  b.pelvis(V.madd(am,u,LL),{tilt:-th});K.trunk(b,{sp:[-2],hd:4,sc:[-.01,mix(.025,-.035,q)]});K.legs(b,{up:0});};
const chest=b=>b.tpt(0,-.17,.15);
def('inverted_row',{title:'Remo invertido en barra baja',cam:{yaw:70,pitch:14},fitBox:[[-1,0,-.62],[.95,1.15,.62]],
  muscles:{midback:1,lats:.7,biceps:.5,reardelts:.45},labels:LR,
  timeline:T(1.3,'Pecho a la barra',.8,'Junta escápulas',2.4,'Baja controlado',.4,'Cuerpo recto · brazos largos'),
  build(c,b,E){const p=c.p,XF=.75,BY=.95;
    const G=K.memo(this,'g',()=>{const t1=K.root(t=>{lean(b,t,XF,1);return chest(b)[1]-BY;},20,85);lean(b,t1,XF,1);const BX=chest(b)[0];
      const t0=K.root(t=>{lean(b,t,XF,0);return V.dist(b.sho('R'),[BX,BY,.3])-K.armD(5);},t1,88);b.ikErr=0;return{t0,t1,BX};}),X=G.BX;
    lean(b,mix(G.t0,G.t1,p),XF,p);for(const[s,k]of SS)b.arm(s,[X,BY,k*.3],b.tdir(k*.7,-.4,-.6),Z);
    for(const k of[-1,1]){E.beam([X,0,k*.62],[X,2.1,k*.62],.06,FR);E.beam([X-.45,.03,k*.62],[X+.45,.03,k*.62],.07,FD,L1);E.boxA([X,BY,k*.62],[.1,.13,.1],FD);
      E.cyl([X,BY,k*.67],[X,BY,k*.71],.034,C.chrome);E.cyl([X,BY,k*.71],[X,BY,k*.95],.025,C.chrome);}
    E.beam([X,2.1,-.65],[X,2.1,.65],.07,FR);E.bar([X,BY,-.67],[X,BY,.67],{r:.014});E.shadow([0,0,0],1.1,.35,.5);}
});

// bajo una mesa: rodillas flexionadas y pies planos, cuerpo recto rodilla→hombros girando sobre la rodilla (cabeza fuera de la mesa)
const brg=(b,be,q)=>{const r=be*RD,u=[-M.cos(r),M.sin(r),0],F=[M.sin(r),M.cos(r),0],A={},N={};
  for(const[s,k]of SS){A[s]=K.footOn(b,s,[.7,0,k*.12],[1,0,0],UP);N[s]=V.madd(A[s],[-M.sin(32*RD),M.cos(32*RD),0],DM.sh);}
  K.frame(b,V.madd([N.R[0],N.R[1],0],u,DM.th),u,F);K.trunk(b,{sp:[-2],hd:2,sc:[-.01,mix(.025,-.035,q)]});
  for(const[s]of SS)b.legDir(s,V.sub(N[s],b.hip(s)),V.sub(A[s],N[s]));};
def('inverted_row_table',{title:'Remo invertido bajo una mesa',cam:{yaw:-55,pitch:10},fitBox:[[-1,0,-.55],[.85,.8,.55]],
  muscles:{midback:1,lats:.7,biceps:.5,reardelts:.4},labels:LR,
  timeline:T(1.3,'Pecho al borde de la mesa',.8,'Junta escápulas',2.4,'Baja controlado',.4,'Cuerpo recto'),
  build(c,b,E){const p=c.p,TY=.72,W=K.COL.wood;
    const G=K.memo(this,'g',()=>{const e1=K.root(e=>{brg(b,e,1);return chest(b)[1]-TY+.004;},-40,40);brg(b,e1,1);const X=chest(b)[0];
      const e0=M.max(K.root(e=>{brg(b,e,0);return K.armD(5)-V.dist(b.sho('R'),[X-.012,TY+.015,.3]);},-60,e1),K.root(e=>{brg(b,e,0);return K.low(b,K.HEAD)-.015;},-60,e1));b.ikErr=0;return{e0,e1,X};}),X=G.X;
    brg(b,mix(G.e0,G.e1,p),p);for(const[s,k]of SS)b.arm(s,[X-.012,TY+.015,k*.3],b.tdir(k*.7,-.4,-.6),Z);
    E.boxA([X+.55,TY+.015,0],[1.1,.03,1.5],W);for(const x of[X+.06,X+1.04])for(const k of[-1,1])E.beam([x,0,k*.69],[x,TY,k*.69],.05,K.COL.woodD);
    E.shadow([0,0,0],1,.35,.5);}
});

// TRX: anclaje alto TA; longitud de correa como la dibuja K.trx (anclaje → mosquetón a .55 → puño)
const TA=[1.1,2.35,0],TX=.92,tl=(hR,hL,sp)=>{const J=V.madd(TA,V.norm(V.sub(V.lerp(hR,hL,.5),TA)),sp);return sp+V.dist(J,hR);};
const trxDraw=(E,b,ax,sp)=>{K.trx(E,TA,b.j('R','grip'),b.j('L','grip'),{ax:[ax,ax],split:sp||.55});E.beam([TA[0],TA[1]+.03,-.5],[TA[0],TA[1]+.03,.5],.08,FR);E.shadow([.2,0,0],.6,.35,.55);};
def('trx_row',{title:'Remo en TRX',cam:{yaw:-40,pitch:6},fitBox:[[-.6,0,-.4],[1.15,1.5,.4]],
  muscles:{midback:1,lats:.7,biceps:.5,reardelts:.45},labels:LR,
  timeline:T(1.3,'Pecho a las asas',.8,'Junta escápulas',2.4,'Baja lento · cuerpo recto',.4,'Brazos largos'),
  build(c,b,E){const p=c.p,LT=1.45,R=K.armD(4),H1=()=>SS.map(([s,k])=>b.tpt(k*.2,-.24,.15));
    const G=K.memo(this,'g',()=>{const t0=K.root(t=>{lean(b,t,TX,0);return V.dist(TA,b.sho('R'))-(LT+R);},5,75),t1=K.root(t=>{lean(b,t,TX,1);return V.dist(TA,V.lerp(...H1(),.5))-LT;},0,75);b.ikErr=0;return{t0,t1};});
    lean(b,mix(G.t0,G.t1,p),TX,p);const h1=H1(),ax=b.tdir(0,1,0);
    SS.forEach(([s,k],i)=>{const sh=b.sho(s),g0=V.madd(sh,V.norm(V.sub(TA,sh)),R-.002),g=V.madd(TA,V.norm(V.sub(V.lerp(g0,h1[i],p),TA)),LT);
      b.arm(s,g,b.tdir(k*.3,-.7,-.7),V.perp(ax,V.norm(V.sub(TA,g))));});trxDraw(E,b,ax);}
});
// aperturas en TRX: brazos por FK (arms(q)); la inclinación se resuelve cada fotograma para la longitud de correa (fija a th0° en q=0)
const trxFly=(b,me,p,th0,X,sp,arms)=>{const f=(t,q)=>{lean(b,t,X,q);arms(q);return tl(b.j('R','grip'),b.j('L','grip'),sp);},L=K.memo(me,'L',()=>f(th0,0));
  lean(b,K.root(t=>f(t,p)-L,0,80),X,p);arms(p);};
def('trx_rev_fly',{title:'Aperturas inversas en TRX',cam:{yaw:-52,pitch:8},fitBox:[[-.65,0,-.8],[1.1,2.05,.8]],
  muscles:{reardelts:1,midback:.7,traps:.4},labels:LD,
  timeline:T(1.3,'Abre en cruz · pecho arriba',.8,'Junta escápulas',2.4,'Baja lento · cuerpo recto',.4,'Brazos al frente'),
  build(c,b,E){const ax=()=>b.tdir(0,1,0);trxFly(b,this,c.p,50,.3,.12,q=>{for(const[s]of SS)b.armFK(s,{abd:98,hz:mix(86,0,q),elbow:12,grip:ax()});});trxDraw(E,b,ax(),.12);}
});
def('trx_y_raise',{title:'Elevación en Y en TRX',cam:{yaw:-66,pitch:14},fitBox:[[-.65,0,-.7],[1.1,2.1,.7]],
  muscles:{reardelts:1,midback:.7,traps:.5,sidedelts:.5},labels:LD,
  timeline:T(1.4,'Abre en Y sobre la cabeza',.8,'Escápulas abajo y atrás',2.5,'Baja lento · core firme',.4,'Brazos al frente'),
  build(c,b,E){const ax=()=>b.tdir(1,0,0);trxFly(b,this,c.p,45,.5,.55,q=>{for(const[s]of SS)b.armFK(s,{flex:mix(98,160,q),abd:mix(6,52,q),elbow:6,grip:ax()});});trxDraw(E,b,ax());}
});

// ═══ BANDA ══════════════════════════════════════════════════════════════════
// remo sentado en el suelo: piernas estiradas, banda alrededor de las plantas (pie en flexión dorsal)
const FF=V.norm([.15,1,0]),FU=V.norm([-1,.15,0]);
const br=(b,q)=>{K.seat(b,[0,.008,0],{tilt:mix(8,-2,sst(0,.85,q)),sp:[mix(3,-3,q)],hd:-4,sc:[-.006*q,mix(.03,-.035,q)],legs:false});};
def('band_row',{title:'Remo con banda elástica',cam:{yaw:-36,pitch:14},fitBox:[[-.3,0,-.4],[.95,1.0,.4]],
  muscles:{midback:1,lats:.7,biceps:.5,reardelts:.4},labels:LR,
  timeline:T(1.2,'Al abdomen · junta escápulas',.8,'Aprieta 1 s',2.4,'Vuelve lento y erguido',.4,'Brazos largos'),
  build(c,b,E){const p=c.p,X=K.memo(this,'x',()=>{br(b,0);const h=b.hip('R'),a=K.footOn(b,'R',[0,.008,.11],FF,FU),d=K.legD(10);return h[0]+M.sqrt(d*d-(a[1]-h[1])**2-(.11-h[2])**2);});
    br(b,0);const S0=SS.map(([s])=>b.sho(s));br(b,1);const G1=SS.map(([s,k])=>b.tpt(k*.2,-.38,.1));br(b,p);
    const mt=K.mat(E,[.35,0,0],[1.4,.6]),sl={};
    for(const[s,k]of SS){const a=K.footOn(b,s,[X,mt.top,k*.11],FF,FU);b.leg(s,null,[0,1,k*.2]);sl[s]=V.add(V.madd(V.madd(a,FF,.08),FU,-.09),[0,0,k*.055]);}
    SS.forEach(([s,k],i)=>{const g0=V.madd(S0[i],V.norm(V.sub(sl[s],S0[i])),.6),g=V.lerp(g0,G1[i],p);g[1]+=.03*M.sin(M.PI*p);const d=V.norm(V.sub(sl[s],g));
      b.arm(s,g,[-1,-.3,k*.35],V.perp(UP,d));K.band(E,[[sl[s][0],sl[s][1],0],sl[s],g],null,{handle:V.perp(UP,d),col:BD.red,w:.009,L0:.75});if(s==='R')E.trace('asa',g);});}
});

// face pull con banda anclada a la altura de la cara (dirección húmero/antebrazo por Bézier, como lib_face_pull)
const bz=(A,Kk,B,t)=>{const Cc=V.sub(V.mul(Kk,2),V.mul(V.add(A,B),.5)),u=1-t;return V.norm(V.add(V.add(V.mul(A,u*u),V.mul(Cc,2*t*u)),V.mul(B,t*t)));};
def('band_face_pull',{title:'Face pull con banda elástica',cam:{yaw:-48,pitch:10},fitBox:[[-.35,0,-.38],[1.0,1.85,.38]],
  muscles:{reardelts:1,midback:.6,traps:.4,sidedelts:.3},labels:LD,
  timeline:T(1.3,'A la frente · codos altos',1,'Separa las manos · aprieta 1 s',2.2,'Vuelve lento',.4,'Brazos largos · sin soltar'),
  build(c,b,E){const p=c.p,A=[1.16,1.62,0];K.stand(b,{fx:-.08,fz:.15,kf:8,tilt:-3,sp:[-2],hd:3,sc:[mix(.012,0,p),mix(.02,-.035,p)]});
    for(const[s,k]of SS){const td=(r,u,f)=>b.tdir(k*r,u,f);
      b.armDir(s,bz(td(0,.17,.985),td(.702,.12,.702),td(.93,.02,.37),p),bz(td(-.2,.22,.95),td(-.52,.42,.74),td(-.55,.83,-.08),p));
      const g=b.j(s,'grip'),ax=V.perp(UP,V.norm(V.sub(A,g)));b.S[s].gripAx=ax;K.band(E,[A[0]-.05,A[1],k*.03],g,{handle:ax,col:BD.green,w:.009,L0:.8});if(s==='R')E.trace('asa',g);}
    E.beam([A[0],0,0],[A[0],2.0,0],.08,FR);E.boxA([A[0],A[1],0],[.094,.035,.094],K.COL.strap);E.boxA([A[0],.02,0],[.4,.04,.4],FD,L1);E.shadow([0,0,0],.45,.35,.55);}
});

def('band_pull_apart',{title:'Aperturas inversas con banda elástica',cam:{yaw:66,pitch:12},fitBox:[[-.3,0,-.85],[.7,1.85,.85]],
  muscles:{reardelts:1,midback:.7,traps:.35},labels:LD,
  timeline:T(1.2,'Separa hasta el pecho',.8,'Junta escápulas',2,'Vuelve lento',.4,'Brazos rectos al frente'),
  build(c,b,E){const p=c.p;K.stand(b,{fx:-.06,fz:.13,kf:6,sp:[-2],hd:-2,sc:[0,mix(.02,-.035,sst(.3,1,p))]});
    const ar=ax=>{for(const[s]of SS)b.armFK(s,{abd:84,hz:mix(88,11,p),elbow:4,grip:ax});return V.norm(V.sub(b.j('L','grip'),b.j('R','grip')));};
    ar(ar());K.band(E,b.j('R','grip'),b.j('L','grip'),{loop:1,flat:UP,col:BD.red,w:.008,L0:.4});E.trace('mano',b.j('R','grip'));E.shadow([0,0,0],.45,.35,.55);}
});

// ═══ APERTURAS INVERSAS CON MANCUERNAS (tronco casi paralelo, brazos en el plano frontal) ═══════
def('rear_fly_db',{title:'Aperturas inversas con mancuernas',cam:{yaw:68,pitch:20},fitBox:[[-.45,0,-.8],[.6,1.25,.8]],
  muscles:{reardelts:1,midback:.7,traps:.3},labels:LD,
  timeline:T(1.2,'Abre hasta altura de hombros',.7,'Aprieta · sin balanceo',2.3,'Baja lento',.4,'Abajo · codos suaves'),
  build(c,b,E){const p=c.p,a=mix(6,84,p)*RD,arms=b=>{for(const[s,k]of SS){const u=V.norm([0,-M.cos(a),k*M.sin(a)]);b.armDir(s,u,V.norm(V.add(V.mul(u,.966),[.259,0,0])),[1,0,0]);}};
    K.stand(b,{fx:-.1,fz:.15,toe:6,kf:24,tilt:74,sp:[-2],hd:-16,sc:[0,mix(.025,-.035,sst(.2,1,p))],balance:true,arms,xm:()=>[[b.j('R','grip'),.09],[b.j('L','grip'),.09]]});
    for(const[s]of SS)E.dumbbell(b.j(s,'grip'),[1,0,0],{r:.05,hl:.05});E.trace('mancuerna',b.j('R','grip'));E.shadow([0,0,0],.5,.4,.55);}
});

// ═══ Y-T-W BOCA ABAJO: w 0 = Y, 1 = T, 2 = W; p = brazos despegados ═══════════
const YTW=[[[.7,.71],[.7,.71]],[[.08,1],[.08,1]],[[-.64,.77],[.77,.64]]];
def('ytw_prone',{title:'Elevaciones Y-T-W boca abajo',cam:{yaw:-66,pitch:36},fitBox:[[-.95,0,-.72],[.95,.35,.72]],
  muscles:{reardelts:1,midback:.7,traps:.5},labels:LD,init:{p:0,w:0},
  timeline:[{p:1,dur:1.2,label:'Y · pulgares arriba',act:1},{dur:.6,label:'Aprieta escápulas',act:1},{w:1,dur:1.1,label:'Abre a T sin bajar',act:1},{dur:.6,label:'T · escápulas juntas',act:1},
    {w:2,dur:1.1,label:'W · codos a las costillas',act:1},{dur:.6,label:'W · aprieta 1 s',act:1},{p:0,dur:1.6,label:'Baja controlando',act:.7},{w:0,dur:1.2,label:'Brazos en Y · cuello neutro',act:.5}],
  build(c,b,E){const p=c.p,w=c.w,mt=K.mat(E,[.05,0,0],[2,.65]),Y=mt.top,i=M.min(1,M.floor(w)),t=w-i,sh=(j,q)=>{const P=YTW[i][j],Q=YTW[i+1][j];return[mix(P[0],Q[0],t),mix(P[1],Q[1],t)];};
    K.prone(b,{y:Y,x:0,sp:[-mix(0,5,p)],hd:-6,sc:[-.004*p,mix(0,-.03,p)]});const tW=M.max(0,w-1);
    for(const[s,k]of SS){const S=b.sho(s),hy=S[1]-Y,eu=mix(-M.asin(mix((hy-.045)/.63,(hy-.04)/.3,tW)),.24,p),ef=mix(mix(-M.asin((hy-.045)/.63),0,tW),.24,p),U=sh(0),F=sh(1);
      const d=(h,e)=>{const n=M.hypot(h[0],h[1]);return[h[0]/n*M.cos(e),M.sin(e),k*h[1]/n*M.cos(e)];};b.armDir(s,d(U,eu),d(F,ef),UP);
      const hp=b.hip(s),ly=Y+.075,lx=-M.sqrt(K.legD(3)**2-(ly-hp[1])**2-.0001);b.leg(s,[hp[0]+lx,ly,k*.1],[0,-1,0]);b.footRelax(s,62);}}
});

// ═══ APERTURAS INVERSAS EN POLEAS CRUZADAS ══════════════════════════════════
def('rear_fly_cable',{title:'Aperturas inversas en cable',cam:{yaw:-58,pitch:10},fitBox:[[-.3,0,-.85],[.65,1.85,.85]],
  muscles:{reardelts:1,midback:.6,traps:.3},labels:LD,
  timeline:T(1.3,'Abre atrás · codos suaves',.8,'Junta escápulas sin encoger',2.4,'Cierra lento cruzando',.4,'Brazos al frente'),
  build(c,b,E){const p=c.p,X=.72,PY=1.5;
    K.stand(b,{fx:-.07,fz:.14,kf:10,tilt:4,sp:[-2],hd:-3,sc:[0,mix(.02,-.03,sst(.3,1,p))]});
    for(const[s,k]of SS){const P=[X,PY,-k*.96],ar=(q,ax)=>{b.armFK(s,{abd:90,hz:mix(92,-4,q),elbow:14,grip:ax});return b.j(s,'grip').slice();};
      const g0=ar(0),g=ar(p),ax=V.norm(V.perp(UP,V.sub(P,g)));ar(p,ax);
      const at=dh(E,g,ax,P);col(E,[X,0,-k*1.05],[0,0,k],PY,at,V.dist(P,at)-V.dist(P,g0)+.075);if(s==='R')E.trace('maneral',g);}
    E.shadow([0,0,0],.45,.35,.55);}
});

// ═══ ROTACIÓN EXTERNA (brazo derecho, codo pegado a 90°) ═════════════════════
const xr=(b,p)=>{K.stand(b,{fx:-.07,fz:.13,kf:6,sp:[0],hd:[-4,-8],sc:[0,0]});
  b.armFK('R',{flex:6,abd:9,elbow:90,rot:mix(46,-48,p),grip:UP});b.armFK('L',{abd:6,elbow:12,rot:-10});return b.j('R','grip').slice();};
const XR={muscles:{reardelts_R:1,midback:.3},labels:['Deltoides post.','Romboides'],cam:{yaw:50,pitch:24},fitBox:[[-.25,0,-.45],[.45,1.85,.55]]};
def('ext_rotation_cable',Object.assign({title:'Rotación externa en cable',
  timeline:T(1.2,'Gira el antebrazo afuera',.6,'Codo pegado al costado',2.2,'Vuelve lento',.4,'Mano frente al ombligo'),
  build(c,b,E){const y=K.memo(this,'y',()=>xr(b,0)),P=[.3,y[1],-.76],r0=V.dist(P,y)-.075,g=xr(b,c.p),at=dh(E,g,UP,P);
    col(E,[.3,0,-.85],[0,0,1],y[1],at,V.dist(P,at)-r0);E.trace('maneral',g);E.shadow([0,0,0],.4,.3,.55);}},XR));
def('band_ext_rotation',Object.assign({title:'Rotación externa con banda elástica',
  timeline:T(1.2,'Gira el antebrazo afuera',.6,'Codo pegado al costado',2.2,'Vuelve lento · controla banda',.4,'Mano frente al ombligo'),
  build(c,b,E){const y=K.memo(this,'y',()=>xr(b,0)),A=[.3,y[1],-.81],g=xr(b,c.p);
    K.band(E,A,g,{handle:UP,col:BD.red,w:.009,L0:.7});E.beam([.3,0,-.85],[.3,1.9,-.85],.08,FR);E.boxA([.3,A[1],-.85],[.094,.035,.094],K.COL.strap);
    E.boxA([.3,.02,-.85],[.4,.04,.4],FD,L1);E.trace('maneral',g);E.shadow([0,0,0],.4,.3,.55);}},XR));

})(window.GymAnim);
