/* Equilibrio para mayores, siempre con apoyo (pared a la derecha o silla delante): apoyo a una pierna, pasos en línea
   talón-punta, apoyo a una pierna girando la cabeza, y talones y puntas con las manos en el respaldo de una silla. */
(function(GA){
const K=GA._.kit,V=GA._.V,C=GA._.COL,DM=GA._.DIM,SS=K.SS,mix=K.mix,sst=K.sst,D=Math.PI/180,UP=[0,1,0];
const WZ=.56,WN=[0,0,-1];   // cara de la pared a la derecha (z=WZ) y su normal (hacia la persona)
const wall=(E,x0,x1)=>E.boxA([(x0+x1)/2,1.2,WZ+.05],[x1-x0,2.4,.1],'#26303a',{layer:-2});
// pie sobre el talón con la punta levantada a° (dorsiflexión): el borde trasero de la suela pivota en H
const heelOn=(b,s,H,yaw,a)=>{const f0=V.yaw(yaw||0),sv=V.norm(V.cross(UP,f0)),r=-a*D,f=V.rot(f0,sv,r),u=V.rot(UP,sv,r),
  an=V.add(H,V.add(V.mul(f,DM.heel),V.mul(u,DM.ankH)));return K.footOn(b,s,[an[0],H[1],an[2]],f,u);};
// de pie sobre los pies ya fijados. o.sup = {lado: flexión de rodilla°} de las piernas que llegan a su pie (la altura de la
// pelvis, nivelada, es la mayor que permiten todas; con o.soft, mínimo suave: sin picos al pasar el peso de un pie a otro);
// x (y z si hay bz) se resuelven para el CdM en (bx,bz). o:{tilt,sp,hd,sc,out (rodillas afuera),free(b) (pierna libre),arms(b)}
const upright=(b,o)=>{const A=Object.keys(o.sup).map(s=>{const f=b.S[s].ffwd,k=K.sd(s);return[s,k,b.j(s,'ank').slice(),K.legD(o.sup[s]),V.add(V.norm([f[0],0,f[2]]),[0,.15,k*(o.out||0)])];}),sk=o.soft;
  const pose=(x,z)=>{const Y=A.map(([,k,a,d])=>a[1]+Math.sqrt(Math.max(.01,d*d-(x-a[0])**2-(z+k*DM.hipW-a[2])**2))),m=Math.min(...Y);
    b.pelvis([x,sk?m-sk*Math.log(Y.reduce((s,y)=>s+Math.exp((m-y)/sk),0)):m,z],{tilt:o.tilt||0});K.trunk(b,o);for(const[s,,,,pl]of A)b.leg(s,null,pl);if(o.free)o.free(b);o.arms(b);};
  const e0=b.ikErr,cm=()=>K.com(b);let x=o.bx,z=o.bz||0;
  for(let i=0;i<(o.bz==null?1:2);i++){x=K.root(t=>{pose(t,z);return cm()[0]-o.bx;},o.bx-.4,o.bx+.4);
    if(o.bz!=null)z=K.root(t=>{pose(x,t);return cm()[2]-o.bz;},o.bz-.3,o.bz+.3);}
  b.ikErr=e0;pose(x,z);};

// ═══ APOYO A UNA PIERNA (base de 1 y 3) ═════════════════════════════════════
// De lado junto a la pared (a la derecha), yemas de la mano derecha en ella a la altura de la cadera. p 0-1: la carga pasa a
// la pierna derecha (CdM sobre el medio pie derecho, pelvis nivelada) y el pie izquierdo despega: el talón sube sobre los
// metatarsos y luego el pie va atrás y arriba (muslo 26° adelante, rodilla 67°, punta a ~6 cm del suelo).
// o:{hd (cabeza), sw:[dx,dz] balanceo del CdM, la (abducción extra del brazo libre)}
const FX=-.06,FZ=.095,TO=5,HAND=[.17,1.0,WZ],HFD=V.norm([1,.15,0]),HPO=[-.45,-1,.4];
const foot=(s,t)=>{const k=K.sd(s);return V.madd([FX,0,k*FZ],V.yaw(-k*TO),t);};   // punto del pie a t m del talón
// p lineal en el tiempo; fases solapadas, cada una suavizada: carga (0-.45), talón (.3-.75, arranque cuadrático: la rodilla
// casi recta se dobla a ritmo constante) y pie al aire (.6-1, desde la pose del talón hacia la levantada)
const SLS=(b,E,p,o)=>{const sh=sst(0,.45,p),e=sst(.6,1,p),sw=o.sw||[0,0],mR=foot('R',.11);
  K.footBallOn(b,'R',foot('R',.2),-TO,0);K.footBallOn(b,'L',foot('L',.2),TO,22*sst(.3,.75,p)**2);
  const L0=[b.j('L','ank').slice(),b.S.L.ffwd.slice(),b.S.L.fup.slice()];
  upright(b,{sup:e>0?{R:6}:{R:6,L:4},tilt:2,sp:[-1],hd:o.hd||-2,sc:[0,-.005],bx:mix(.045,mR[0],sh)+sw[0],bz:mR[2]*sh+sw[1],
    free:e>0&&(b=>{b.legFK('L',{flex:26,abd:5,knee:67});b.footRelax('L',-14);const S=b.S.L;
      b.foot('L',V.lerp(L0[0],S.ank,e),V.lerp(L0[1],S.ffwd,e),V.lerp(L0[2],S.fup,e));b.leg('L',null,V.add(V.norm([L0[1][0],0,L0[1][2]]),[0,.15,0]));}),
    arms:b=>{K.palm(b,null,'R',HAND,{fd:HFD,n:WN,pole:HPO});b.armFK('L',{abd:mix(12,24,sst(0,.6,p))+(o.la||0),flex:4,elbow:mix(14,20,sst(0,.6,p))});}});
  K.palm(b,E,'R',HAND,{fd:HFD,n:WN,pole:HPO});wall(E,-.75,.8);E.shadow([.02,0,.05],.42,.32,.5);};

GA.def('lib_balance_single_leg',{title:'Apoyo a una pierna junto a la pared',cam:{yaw:-140,pitch:10},fitBox:[[-.4,0,-.3],[.4,1.85,.56]],
  muscles:{abductors:.4,glutes_R:.3,calves_R:.3},labels:['Glúteo medio','Gemelos'],init:{p:0,w:0},note:'20 s por lado',
  timeline:[{p:1,dur:1.4,label:'Levanta un pie',act:.8,ease:'lin'},{w:1,dur:2.5,label:'Aguanta · mirada al frente',act:.9,ease:'lin'},
    {p:0,dur:1.2,label:'Apoya despacio',act:.6,ease:'lin'},{w:0,dur:.6,label:'Cambia de pierna',act:.5}],
  build(c,b,E){const w=c.w,g=sst(.6,1,c.p)*Math.sin(Math.PI*w);
    SLS(b,E,c.p,{sw:[.005*g*Math.sin(2*Math.PI*w),.009*g*Math.sin(3*Math.PI*w)],la:4*g*Math.sin(3*Math.PI*w)});}});

// ═══ APOYO A UNA PIERNA GIRANDO LA CABEZA ═══════════════════════════════════
GA.def('lib_balance_head_turns',{title:'Apoyo a una pierna girando la cabeza',cam:{yaw:-150,pitch:10},fitBox:[[-.4,0,-.3],[.4,1.85,.56]],
  muscles:{abductors:.4,glutes_R:.3,calves_R:.3},labels:['Glúteo medio','Gemelos'],init:{p:0,h:0},note:'20 s por lado',
  timeline:[{p:1,dur:1.4,label:'Levanta un pie',act:.8,ease:'lin'},{h:1,dur:1.6,label:'Gira la cabeza despacio',act:.9},
    {h:-1,dur:2.6,label:'Al otro lado sin prisa',act:.9},{h:0,dur:1.4,label:'Vuelve al centro',act:.9},
    {p:0,dur:1.2,label:'Apoya despacio',act:.6,ease:'lin'},{dur:.6,label:'Cambia de pierna',act:.5}],
  build(c,b,E){SLS(b,E,c.p,{hd:[-2,55*c.h,0]});}});

// ═══ PASOS EN LÍNEA TALÓN-PUNTA ═════════════════════════════════════════════
// Sobre una línea (z=0) junto a la pared, mano derecha cerca de ella. Pie derecho fijo (talón en x=0); el izquierdo pasa de
// detrás (talón en -TX: su punta a ~2 cm del talón derecho) a delante (talón en TX, ~2 cm delante de la punta derecha).
// p 0-1 (lineal; cada fase con su suavizado): el talón izquierdo sube sobre los metatarsos mientras el CdM pasa al pie derecho;
// el pie vuela por fuera del derecho (z=TZ, sin cruzarlo), apoya el talón con la punta arriba y baja la planta; el CdM va al
// centro de la base nueva. p 1→0 = el mismo paso hacia atrás (la punta toca primero y el talón baja).
const TX=.305,TZ=-.125,TA=32,TH=12;
const tandemL=(b,p)=>{if(p<=.32){K.footBallOn(b,'L',[.2-TX,0,0],0,TA*sst(.02,.32,p));return 0;}
  if(p>=.74){heelOn(b,'L',[TX,0,0],0,TH*(1-sst(.74,.82,p)));return 0;}
  const t=(p-.32)/.42,A0=K.footBallOn(b,'L',[.2-TX,0,0],0,TA).slice(),A1=heelOn(b,'L',[TX,0,0],0,TH).slice(),a=mix(TA,-TH,sst(.1,1,t))*D,A=V.lerp(A0,A1,sst(.25,.78,t));
  b.foot('L',[A[0],A[1]+.04*Math.sin(Math.PI*t)**2,TZ*(sst(0,.22,t)-sst(.75,1,t))],[Math.cos(a),-Math.sin(a),0],[Math.sin(a),Math.cos(a),0]);return 1;};
GA.def('lib_balance_tandem_walk',{title:'Pasos en línea talón-punta junto a la pared',cam:{yaw:-145,pitch:12},fitBox:[[-.45,0,-.25],[.65,1.85,.56]],
  muscles:{abductors:.3,calves:.3},labels:['Glúteo medio','Gemelos'],init:{p:0},
  timeline:[{p:1,dur:2,label:'Talón delante de la punta',act:.85,ease:'lin'},{dur:.6,label:'Equilibrio · mirada al frente',act:.9},
    {p:0,dur:2,label:'Vuelve atrás despacio',act:.8,ease:'lin'},{dur:.6,label:'Pies en línea',act:.6}],
  build(c,b,E){const p=c.p;K.footBallOn(b,'R',[.2,0,0],0,0);const fl=tandemL(b,p);
    upright(b,{sup:{R:5,L:fl?2:5},soft:.02,out:.3,tilt:2,sp:[-1],hd:0,sc:[0,-.005],bx:-.03+.15*sst(0,.3,p)+.155*sst(.7,1,p),bz:0,
      arms:b=>{K.palm(b,null,'R',[b.sho('R')[0]+.13,1.0,WZ],{fd:HFD,n:WN,pole:HPO});b.armFK('L',{abd:22,flex:4,elbow:18});}});
    K.palm(b,E,'R',[b.sho('R')[0]+.13,1.0,WZ],{fd:HFD,n:WN,pole:HPO});wall(E,-.95,1.05);
    E.poly([[-.75,.001,-.012],[.95,.001,-.012],[.95,.001,.012],[-.75,.001,.012]],'#c9d1d9',{layer:-1,outline:false});
    E.shadow([b.pf.o[0],0,0],.5,.25,.5);}});

// ═══ TALONES Y PUNTAS CON APOYO ═════════════════════════════════════════════
// Detrás de una silla (respaldo hacia la persona), puños en el travesaño del respaldo. p 0→1: de puntillas (talón ~7 cm
// arriba) con el CdM sobre los metatarsos; p 0→-1: sobre los talones con la punta 18° arriba y el CdM sobre el talón.
const CX=.56,SH=.46,RX=CX-.225,RY=SH+.47;
const chair=(E,x,h)=>{const w=K.COL.wood,d=K.COL.woodD;E.boxA([x,h-.02,0],[.42,.04,.42],w,{layer:-1});
  for(const a of[-1,1])for(const z of[-1,1])E.beam([x+a*.18,0,z*.18],[x+a*.18,h-.04,z*.18],.035,d,{layer:-2});
  for(const z of[-1,1])E.beam([x-.19,h,z*.18],[x-.225,h+.47,z*.18],.035,d,{layer:-2});
  E.boxA([x-.212,h+.3,0],[.03,.14,.4],w,{layer:-2,pitch:-4});E.beam([x-.225,h+.47,-.21],[x-.225,h+.47,.21],.045,w,{layer:-1});};
GA.def('lib_balance_heel_toe',{title:'Talones y puntas con apoyo',cam:{yaw:-24,pitch:8},fitBox:[[-.3,0,-.3],[.78,1.82,.3]],
  muscles:{calves:.4},labels:['Gemelos','Tobillos'],init:{p:0},
  timeline:[{p:1,dur:1.4,label:'Sube de puntillas',act:.9},{dur:.4,label:'Arriba',act:.95},{p:0,dur:1.4,label:'Baja despacio',act:.7},
    {p:-1,dur:1.2,label:'Levanta las puntas',act:.85},{p:0,dur:1,label:'Pies planos',act:.5}],
  build(c,b,E){const p=c.p,up=Math.max(p,0),dn=Math.max(-p,0),kf=mix(4,8,dn);
    for(const[s,k]of SS){const h=[-.05,0,k*.11],y=-k*6;if(p>=0)K.footBallOn(b,s,V.madd(h,V.yaw(y),.2),y,19*up);else heelOn(b,s,h,y,18*dn);}
    upright(b,{sup:{R:kf,L:kf},tilt:2+5*dn,sp:[-1],hd:2,sc:[0,.01],bx:p>=0?mix(.05,.13,up):mix(.05,-.01,dn),
      arms:b=>{for(const[s,k]of SS)b.arm(s,[RX,RY,k*.16],[-.3,-1,k*.5],[0,0,1]);}});
    chair(E,CX,SH);E.shadow([.02,0,0],.4,.32,.5);}});

})(window.GymAnim);
