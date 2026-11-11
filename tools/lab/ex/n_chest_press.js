/* Familia press de pecho: banca con barra (plana, inclinada, declinada, Smith, cerrada), máquinas, poleas, bandas, mancuernas, aperturas */
(function(GA){
const K=GA._.kit,V=GA._.V,C=GA._.COL,DM=GA._.DIM,I=GA._,SS=K.SS,mix=K.mix,fpt=I.fpt,fdir=I.fdir,D=Math.PI/180,UP=[0,1,0],Z=[0,0,1];
const PEL=['pel','gluR','gluL'],THO=['tho','shd'];
// tumbado/sentado en banco: respaldo a o.a° (0 plano, + inclinado, - declinado) por la bisagra o.h=[x,y]. a>5: glúteos en el
// asiento y espalda en el respaldo; si no, todo el tronco en el plano con los hombros en x=o.sx. Resuelve (una vez) el giro
// de la pelvis para que glúteos y espalda alta apoyen y, con o.rest, la flexión de cabeza que la apoya.
const lieB=(b,o,k)=>{const a=o.a*D,n=[Math.sin(a),Math.cos(a),0],h=[o.h[0],o.h[1],0],inc=o.a>5;
  const pose=t=>{b.pelvis([0,1,0],{tilt:o.a-90+t});K.trunk(b,o);const gB=K.low(b,THO,h,n);
    if(inc){const gS=K.low(b,PEL,h,UP);K.shift(b,[(gS*n[1]-gB)/n[0],-gS,0]);}
    else{K.shift(b,V.mul(n,-gB));const sm=V.lerp(b.sho('R'),b.sho('L'),.5);K.shift(b,V.mul([-Math.cos(a),Math.sin(a),0],(o.sx-sm[0])/-Math.cos(a)));}
    return K.low(b,PEL,h,n)-(inc?.004:0);};
  if(k.t==null){k.t=K.root(pose,-25,25);pose(k.t);k.h=o.rest?K.root(x=>{b.head(x);return K.low(b,K.HEAD,h,n)-.002;},-40,40):null;}
  pose(k.t);if(k.h!=null)b.head(k.h);return n;};
// punto de la superficie del pecho a altura u (desde el centro de la elipsoide torácica) + normal
const chest=(b,u)=>{const T=b.tf,f=.115*Math.sqrt(Math.max(0,1-(u/.165)**2));return[fpt(T,0,.15+u,.012+f),V.norm(fdir(T,0,u/.0272,f/.0132))];};
// codo (IK hombro→tg) situado en el plano x=X (antebrazo vertical en vista lateral), solución baja
const elbX=(sh,tg,X)=>{const L1=DM.ua,L2=DM.fa+DM.grip,d=V.sub(tg,sh),Q=V.len(d),a=V.mul(d,1/Q),ca=(L1*L1+Q*Q-L2*L2)/(2*L1*Q),c0=V.madd(sh,a,L1*ca),
  r=L1*Math.sqrt(Math.max(0,1-ca*ca)),e1=V.norm(V.perp([0,-1,0],a)),e2=V.cross(a,e1),A=r*e1[0],B=r*e2[0],bs=Math.atan2(B,A),dd=Math.acos(K.clamp((X-c0[0])/Math.hypot(A,B),-1,1));
  const P=[bs+dd,bs-dd].map(f=>V.add(c0,V.add(V.mul(e1,r*Math.cos(f)),V.mul(e2,r*Math.sin(f)))));return P[0][1]<P[1][1]?P[0]:P[1];};
// timeline de press: baja (excéntrica) → pausa → empuja → arriba
const TL=(L,d,u,h)=>[{p:1,dur:d||2.2,label:L[0],act:.8},{dur:h||.3,label:L[1],act:.9},{p:0,dur:u||1.2,label:L[2],act:1},{dur:.6,label:L[3],act:.5}];
const LB={p:['Pectoral','Tríceps','Deltoides ant.'],u:['Pectoral superior','Deltoides ant.'],l:['Pectoral inferior','Pectoral','Tríceps'],t:['Tríceps','Pectoral','Deltoides ant.']};
const MP={pecs:1,triceps:.6,frontdelts:.5};
// bancos: plano (1,22 m) / inclinado con bisagra en x=0; declinado con cojín de piernas
const FLAT={a:0,h:[0,.44],sx:-.36,sp:[-8],sc:[-.012,-.03],rest:1},INC={a:35,h:[0,.45],sp:[-8],sc:[-.012,-.03],rest:1},DEC={a:-18,h:[.3,.62],sx:-.3,sp:[-6],sc:[-.012,-.03],rest:1};
const flat=E=>E.bench({at:[0,0,0],h:.44,seat:.42,back:.8}),incl=E=>E.bench({at:[0,0,0],h:.45,seat:.4,back:.95,inc:35});
const feet=(b,dx,z)=>{for(const[s,k]of SS){const hp=b.hip(s);b.footFlat(s,[hp[0]+(dx||.36),0,k*(z||.27)],-k*14);b.leg(s,null,[1,.6,k*.4]);}};
// declinado: cojín a -18° desde la bisagra (cadera) + muslos sobre el rodillo de corva y tobillos bajo los rodillos
const decl=(b,E)=>{const h=[.3,.62,0],d=[-Math.cos(18*D),-Math.sin(18*D),0],n=[-Math.sin(18*D),Math.cos(18*D),0],td=[Math.cos(20*D),Math.sin(20*D),0],sd=[Math.cos(72*D),-Math.sin(72*D),0];
  E.pad(V.madd(h,n,-.038),V.madd(V.madd(h,n,-.038),d,1.22),.28,.075,C.pad,{up:n,layer:-1});
  for(const[s,k]of SS){b.legDir(s,V.add(td,[0,0,k*.1]),V.add(sd,[0,0,k*.05]));b.footRelax(s,8);}
  const kn=b.j('R','kne'),an=b.j('R','ank'),r1=V.madd(V.madd(kn,td,-.09),[td[1],-td[0],0],.105),r2=V.madd(V.madd(an,sd,-.07),[-sd[1],sd[0],0],.083),cx=r1[0]+.05;
  for(const r of[r1,r2])E.cyl([r[0],r[1],-.21],[r[0],r[1],.21],.045,C.pad);
  E.beam([cx,0,0],[cx,r1[1],0],.06,C.frame,{layer:-1});E.beam([r1[0],r1[1],0],[cx,r1[1],0],.04,C.frame);E.beam([r2[0],r2[1],0],[cx,r2[1],0],.04,C.frame);
  E.beam([.2,0,0],[.2,.5,0],.06,C.frame,{layer:-2});E.beam([-.55,0,0],[-.55,.3,0],.06,C.frame,{layer:-2});E.beam([-.6,.03,0],[cx+.1,.03,0],.06,C.frameD,{layer:-2});
  for(const x of[-.55,cx])E.beam([x,.03,-.25],[x,.03,.25],.05,C.frameD,{layer:-2});};
// soportes con ganchos J en x, cuna a la altura y
const uprights=(E,x,y)=>{for(const k of[-1,1]){const z=k*.56;E.beam([x,0,z],[x,y+.16,z],.06,C.frame);E.boxA([x+.03,y-.035,z],[.1,.04,.07],C.frameD);
  E.boxA([x+.075,y-.005,z],[.014,.05,.07],C.frameD);E.beam([x-.28,.03,z],[x+.28,.03,z],.06,C.frameD,{layer:-1});}E.beam([x,.2,-.56],[x,.2,.56],.05,C.frameD);};
// Smith: guías verticales en x=BX, barra a la altura y
const smith=(E,BX,y)=>{for(const k of[-1,1]){const z=k*.62;E.beam([BX,0,z],[BX,2.1,z],.055,C.frame);E.beam([BX-.6,.03,z],[BX+.6,.03,z],.07,C.frameD,{layer:-1});E.boxA([BX,y,z],[.1,.13,.1],C.frameD);}
  E.beam([BX,2.1,-.65],[BX,2.1,.65],.07,C.frame);K.barbell(E,[BX,y,0],Z,{len:2.04,inner:.69,plates:[.225,.165]});};
// press con barra: o.W semi-agarre, o.u altura del contacto en el pecho; arriba sobre los hombros (o.vert: vertical, Smith).
// Codo en el plano del contacto (antebrazo vertical abajo); trayectoria en J (vuelve hacia los hombros al empezar a subir)
const barPress=(spec,c,b,E,o)=>{const k=K.memo(spec,'k',()=>({}));lieB(b,o.L,k);o.bench(b,E);
  const sh=b.sho('R'),[q,n]=chest(b,o.u),B=V.madd(q,n,.017),R=K.armD(6),dz=o.W-sh[2],tx=o.vert?B[0]:sh[0],T=[tx,sh[1]+Math.sqrt(R*R-dz*dz-(tx-sh[0])**2)];
  if(!k.pole)k.pole=o.pole||V.sub(elbX(sh,[B[0],B[1],o.W],B[0]),sh);const p=c.p,bc=[mix(T[0],B[0],p*p),mix(T[1],B[1],p),0],P=k.pole;
  for(const[s,kk]of SS)b.arm(s,[bc[0],bc[1],kk*o.W],[P[0],P[1],kk*P[2]],Z);if(!o.legs)feet(b);
  if(o.vert)smith(E,bc[0],bc[1]);else{K.barbell(E,bc,Z,{plates:[.225,.225]});uprights(E,sh[0]-(o.L.a>5?.22:.13),T[1]-.05);}
  E.trace('barra',V.add(bc,[0,0,.75]));E.shadow([0,0,0],.9,.5,.55);};
const BCAM={cam:{yaw:58,pitch:30},fitBox:[[-.85,0,-.45],[.7,1.2,.45]]};

GA.def('lib_bench_press',Object.assign({
  title:'Press de banca con barra',muscles:{pecs:1,triceps:.6,frontdelts:.55},labels:LB.p,
  timeline:TL(['Baja al pecho medio','Toca suave · sin rebote','Empuja · glúteos abajo','Arriba · omóplatos juntos']),
  build(c,b,E){barPress(this,c,b,E,{L:FLAT,bench:(b,E)=>flat(E),W:.4,u:-.02});}},BCAM));

GA.def('lib_incline_bench_bb',{
  title:'Press inclinado con barra',cam:{yaw:64,pitch:22},fitBox:[[-.7,0,-.45],[.75,1.55,.45]],
  muscles:{upperpecs:1,frontdelts:.7,pecs:.5,triceps:.5},labels:LB.u,
  timeline:TL(['Baja al pecho alto','Toca suave · sin rebote','Empuja arriba','Arriba · omóplatos juntos']),
  build(c,b,E){barPress(this,c,b,E,{L:INC,bench:(b,E)=>incl(E),W:.39,u:.075});}});

GA.def('lib_decline_bench_bb',{
  title:'Press declinado con barra',cam:{yaw:62,pitch:24},fitBox:[[-.8,0,-.45],[.85,1.15,.45]],
  muscles:{lowerpecs:1,pecs:.7,triceps:.6,frontdelts:.3},labels:LB.l,
  timeline:TL(['Baja al pecho bajo','Toca suave · sin rebote','Empuja controlando','Arriba · piernas sujetas']),
  build(c,b,E){barPress(this,c,b,E,{L:DEC,bench:decl,legs:1,W:.39,u:-.085});}});

GA.def('lib_bench_smith',{
  title:'Press de banca en Smith',cam:{yaw:60,pitch:28},fitBox:[[-.85,0,-.5],[.7,1.3,.5]],
  muscles:MP,labels:LB.p,
  timeline:TL(['Baja a la mitad del pecho','Toca suave · sin rebote','Empuja vertical','Arriba · espalda apoyada']),
  build(c,b,E){barPress(this,c,b,E,{L:FLAT,bench:(b,E)=>flat(E),W:.4,u:-.03,vert:1});}});

GA.def('lib_close_grip_bench',Object.assign({
  title:'Press de banca con agarre cerrado',muscles:{triceps:1,pecs:.7,frontdelts:.5},labels:LB.t,
  timeline:TL(['Baja al pecho bajo','Codos pegados','Extiende los brazos','Arriba · sin bloquear']),
  build(c,b,E){barPress(this,c,b,E,{L:FLAT,bench:(b,E)=>flat(E),W:.19,u:-.07,pole:[.6,-.5,.45]});}},BCAM));

// press con mancuernas tumbado: abajo húmero a o.ab° del tronco y o.dn° bajo su plano (o.fy: codo apoyado en el suelo y) con
// antebrazo vertical, o con o.sq las mancuernas juntas sobre el pecho; arriba a alcance casi completo entre hombro y pecho
// (o.xt) a ±o.zt; o.neu agarre neutro. Converge al final (z con potencia 1,5)
const dbPress=(b,E,p,o)=>{const[q,n]=chest(b,o.u||0),ab=o.ab*D;
  for(const[s,k]of SS){const sh=b.sho(s),dn=o.fy==null?o.dn*D:Math.asin((sh[1]-o.fy-.038)/DM.ua),hb=V.add(V.mul(V.norm(b.tdir(k*Math.sin(ab),-Math.cos(ab),0)),Math.cos(dn)),V.mul(b.tf.F,-Math.sin(dn)));
    const bot=o.sq?V.add(V.madd(q,n,.063),[0,0,k*o.zt]):V.madd(V.madd(sh,hb,DM.ua),UP,DM.fa+DM.grip),R=K.armD(8),tx=mix(sh[0],q[0],o.xt==null?.5:o.xt),tz=k*o.zt;
    const top=[tx,sh[1]+Math.sqrt(R*R-(tx-sh[0])**2-(tz-sh[2])**2),tz],w=1-p,g=[mix(bot[0],top[0],w),mix(bot[1],top[1],w),mix(bot[2],top[2],Math.pow(w,1.5))];
    const ax=o.neu?b.tdir(0,1,0):b.tdir(k,-.25,0);b.arm(s,g,o.sq?[.5,-.6,k*.6]:[0,-1,0],ax);E.dumbbell(b.j(s,'grip'),ax,{r:.056});
    if(s==='R')E.trace('mancuerna',V.madd(b.j(s,'grip'),ax,.13));}};
const slerp=(a,b,t)=>{const w=Math.acos(K.clamp(V.dot(a,b),-1,1));if(w<1e-4)return a;const s=Math.sin(w);return V.add(V.mul(a,Math.sin((1-t)*w)/s),V.mul(b,Math.sin(t*w)/s));};
// punto de la recta P0+F·t (t>0) a distancia R de c
const ray=(c,P0,F,R)=>{const q=V.sub(P0,c),bq=V.dot(F,q);return V.madd(P0,F,-bq+Math.sqrt(Math.max(0,bq*bq-V.dot(q,q)+R*R)));};
// aperturas: la mano recorre un círculo máximo de la esfera del hombro (codo fijo a el°) de a (cerrado) a z (abierto) con p;
// el codo apunta hacia fuera/abajo (sentido de apertura). Devuelve los puños
const flyArc=(b,p,el,a,z,gr,dn)=>{const R=K.armD(el),G=[];for(const[s,k]of SS){const sh=b.sho(s),A=a(s,k),B=z(s,k),d=slerp(A,B,p),T=V.norm(V.cross(V.norm(V.cross(A,B)),d));
  b.arm(s,V.madd(sh,d,R),V.add(T,[0,-(dn==null?.35:dn),0]),gr(s,k));G.push(b.j(s,'grip'));}return G;};
const flyDB=(b,E,p,ti)=>{const G=flyArc(b,p,24,(s,k)=>V.norm(V.sub(ray(b.sho(s),b.tpt(k*.085,-.17,0),b.tf.F,K.armD(24)),b.sho(s))),(s,k)=>V.norm(b.tdir(k*.96,-.18,-.12)),()=>b.tdir(0,1,0));
  for(const g of G)E.dumbbell(g,b.tdir(0,1,0),{r:.05});E.trace('mancuerna',G[ti||0]);};
const FLY=L=>[{p:1,dur:2.4,label:L[0],act:.8},{dur:.4,label:'Estira el pecho',act:.9},{p:0,dur:1.4,label:L[1],act:1},{dur:.5,label:'Arriba · sin chocar',act:.5}];
const DCAM={cam:{yaw:-30,pitch:26}};

GA.def('lib_press_decline_db',{
  title:'Press declinado con mancuernas',cam:{yaw:-34,pitch:24},
  muscles:{lowerpecs:1,pecs:.7,triceps:.5,frontdelts:.3},labels:LB.l,
  timeline:TL(['Baja al pecho bajo','Pausa · estira el pecho','Empuja arriba','Arriba · sin trabar codos'],2.4),
  build(c,b,E){lieB(b,DEC,K.memo(this,'k',()=>({})));decl(b,E);dbPress(b,E,c.p,{ab:52,dn:18,zt:.15,u:-.07,xt:.7});E.shadow([0,0,0],.9,.5,.55);}});

GA.def('lib_floor_press_db',Object.assign({
  title:'Press en el suelo con mancuernas',muscles:{pecs:1,triceps:.7,frontdelts:.4},labels:LB.p,
  timeline:TL(['Baja hasta el suelo','Codos apoyados · pausa','Empuja','Arriba · sin chocar'],2,1.1,.6),
  build(c,b,E){const mt=K.mat(E,[-.1,0,0],[1.75,.62]);K.supine(b,{y:mt.top,x:-.42,at:'sho',hd:'rest',sp:[-2],sc:[-.01,-.025]});
    for(const[s,k]of SS){b.footFlat(s,[b.hip(s)[0]+.42,mt.top,k*.18],-k*6);b.leg(s,null,[0,1,k*.25]);}
    dbPress(b,E,c.p,{ab:45,fy:mt.top,zt:.15,xt:.4});E.shadow([-.1,0,0],.95,.4,.45);}},DCAM));

GA.def('lib_close_press_db',Object.assign({
  title:'Press cerrado con mancuernas',muscles:{triceps:1,pecs:.8,frontdelts:.5},labels:LB.t,
  timeline:TL(['Baja al pecho · juntas','Codos pegados','Empuja sin separarlas','Arriba · aprieta']),
  build(c,b,E){lieB(b,FLAT,K.memo(this,'k',()=>({})));flat(E);feet(b);dbPress(b,E,c.p,{sq:1,neu:1,zt:.058,u:-.05,xt:.6});E.shadow([0,0,0],.9,.5,.55);}},DCAM));

GA.def('lib_fly_db',Object.assign({
  title:'Aperturas con mancuernas',muscles:{pecs:1,frontdelts:.5},labels:['Pectoral','Deltoides ant.'],
  timeline:FLY(['Abre en arco · codos fijos','Junta en arco']),
  build(c,b,E){lieB(b,FLAT,K.memo(this,'k',()=>({})));flat(E);feet(b);flyDB(b,E,c.p);E.shadow([0,0,0],.9,.5,.55);}},DCAM));

GA.def('lib_fly_incline_db',{
  title:'Aperturas inclinadas con mancuernas',cam:{yaw:38,pitch:16},
  muscles:{upperpecs:1,frontdelts:.6,pecs:.5},labels:LB.u,
  timeline:FLY(['Abre hasta estirar','Sube en arco y junta']),
  build(c,b,E){lieB(b,INC,K.memo(this,'k',()=>({})));incl(E);feet(b,.42);flyDB(b,E,c.p,1);E.shadow([0,0,0],.85,.45,.55);}});

// máquina de press sentado: respaldo a o.a°, empuje hacia o.ph° sobre la horizontal. Abajo (S) húmero a o.ab° del tronco y 20°
// por detrás con el antebrazo en la línea de empuje; extensión (T) casi completa con los manerales a ±o.tz (convergen).
// Manerales horizontales en palancas de .8 m que giran sobre un eje alto P equidistante de S y T; leva r 8 cm → pila detrás
const SEAT={h:[0,.46],sp:[-4],hd:4,sc:[-.01,-.03]};
const machine=(spec,c,b,E,o)=>{const k=K.memo(spec,'k',()=>({})),p=c.p,X=-.32;lieB(b,Object.assign({a:o.a},SEAT),k);
  if(!k.P){const sh=b.sho('R'),ab=o.ab*D,dn=20*D,dir=[Math.cos(o.ph*D),Math.sin(o.ph*D),0];
    const hb=k.hb=V.add(V.mul(V.norm(b.tdir(Math.sin(ab),-Math.cos(ab),0)),Math.cos(dn)),V.mul(b.tf.F,-Math.sin(dn)));
    const S=k.S=V.madd(V.madd(sh,hb,DM.ua),dir,DM.fa+DM.grip),T=k.T=ray(sh,[S[0],S[1],o.tz],dir,K.armD(12)),h=V.dist(S,T)/2;
    const P=k.P=V.madd(V.lerp(S,T,.5),V.norm(V.perp(UP,dir)),Math.sqrt(.64-h*h)),an=q=>Math.atan2(q[1]-P[1],q[0]-P[0]);k.aS=an(S);k.aT=an(T);}
  const P=k.P,a=mix(k.aT,k.aS,p),hz=mix(k.T[2],k.S[2],p),g=[P[0]+.8*Math.cos(a),P[1]+.8*Math.sin(a)],TY=P[1]+.14,n=[Math.sin(o.a*D),Math.cos(o.a*D),0],bd=[-n[1],n[0],0];
  for(const[s,kk]of SS){const G=[g[0],g[1],kk*hz];b.arm(s,G,[k.hb[0],k.hb[1],kk*k.hb[2]],Z);E.cyl([g[0],g[1],kk*(hz-.075)],[g[0],g[1],kk*(hz+.075)],.018,C.rubber);
    E.beam([P[0],P[1],kk*.52],[g[0],g[1],kk*(hz+.085)],.055,C.frameD);E.beam([P[0],TY,kk*.52],[P[0],P[1],kk*.52],.05,C.frame);}
  for(const[s,kk]of SS){b.footFlat(s,[b.hip(s)[0]+.42,0,kk*.2],-kk*10);b.leg(s,null,[1,.4,kk*.25]);}
  E.pad([.02,.42,0],[.42,.42,0],.36,.08,C.pad,{up:UP,layer:-1});E.pad(V.madd([0,.46,0],n,-.04),V.madd(V.madd([0,.46,0],n,-.04),bd,.78),.32,.08,C.pad,{up:n,layer:-1});
  E.beam([.22,0,0],[.22,.38,0],.07,C.frame,{layer:-2});E.beam([X,0,0],[X,TY,0],.08,C.frame,{layer:-2});E.beam([X,TY,0],[P[0]+.05,TY,0],.07,C.frame);
  E.beam([P[0],TY,-.55],[P[0],TY,.55],.07,C.frame);E.cyl([P[0],P[1],-.55],[P[0],P[1],.55],.025,C.chrome);E.disc([P[0],P[1],0],Z,.08,.03,C.frameD);
  E.beam([X-.4,.03,0],[.34,.03,0],.08,C.frameD,{layer:-1});for(const x of[X-.35,.3])E.beam([x,.03,-.4],[x,.03,.4],.06,C.frameD,{layer:-1});
  const sx=X-.24,top=E.stack([sx,0,0],{h:1.5,lift:Math.abs(a-k.aS)*.08,n:12,sel:5,yaw:0,w:.26});E.pulley([sx,P[1]+.08,0],Z,.04);
  E.cable(top,[sx-.04,P[1]+.08,0]);E.cable([sx,P[1]+.12,0],[P[0],P[1]+.08,0]);E.trace('maneral',[g[0],g[1],hz]);E.shadow([0,0,0],.75,.45,.55);};

GA.def('lib_chest_press_machine',{
  title:'Press de pecho en máquina',cam:{yaw:35,pitch:14},fitBox:[[-.4,0,-.4],[.75,1.5,.4]],
  muscles:MP,labels:LB.p,
  timeline:TL(['Vuelve lento · estira','Pecho estirado','Empuja sin bloquear','Extendido · codos suaves'],2.4,1.2),
  build(c,b,E){machine(this,c,b,E,{a:80,ph:-3,ab:66,tz:.2});}});

GA.def('lib_chest_press_incline_machine',{
  title:'Press inclinado en máquina',cam:{yaw:35,pitch:14},fitBox:[[-.45,0,-.4],[.7,1.6,.4]],
  muscles:{upperpecs:1,frontdelts:.6,pecs:.5,triceps:.5},labels:LB.u,
  timeline:TL(['Baja lento · postura firme','Pecho estirado','Empuja arriba y adelante','Extendido · codos suaves'],2.4,1.2),
  build(c,b,E){machine(this,c,b,E,{a:62,ph:32,ab:45,tz:.18});}});

// ── de pie: zancada corta (pie L delante, R detrás de puntillas) o pies paralelos; tronco algo inclinado, pecho arriba ──
const split=(b,o)=>{b.footFlat('L',[.16,0,-.13],8);K.footBallOn(b,'R',[-.3,0,.15],-10,24);b.pelvis([-.05,.89,0],{tilt:o.tl||10});K.trunk(b,o);
  b.leg('L',null,[1,.1,-.12]);b.leg('R',null,[1,-.1,.12]);};
const both=(b,o)=>K.stand(b,Object.assign({fz:.15,kf:10,tilt:7},o));
// empuje de pie: abajo (p=1) húmero a 45° y 25° por detrás con el antebrazo en la línea de empuje (horizontal); delante (p=0)
// manos juntas (±.06) a alcance casi completo; las escápulas pasan de retraídas a algo protraídas. Devuelve puño(s,p)
const push=(b,p)=>{const T0=[],S0=[],H=[];for(const[s,k]of SS){const sh=b.tpt(k*DM.shW,-DM.shDn,-.005),ab=45*D,dn=25*D;
    const hb=V.add(V.mul(V.norm(b.tdir(k*Math.sin(ab),-Math.cos(ab),0)),Math.cos(dn)),V.mul(b.tf.F,-Math.sin(dn))),S=V.madd(V.madd(sh,hb,DM.ua),[1,0,0],DM.fa+DM.grip);
    S0.push(S);T0.push(ray(sh,[S[0],S[1],k*.06],[1,0,0],K.armD(10)));H.push(hb);}
  b.scap('both',-.01,mix(.02,-.03,p));const g=(i,q)=>V.lerp(T0[i],S0[i],q);
  SS.forEach(([s],i)=>b.arm(s,g(i,p),H[i],UP));return g;};
// torres de poleas en z=±1 con polea a la altura PH (x=TX, z=±.88); cable → maneral D (clip a 8,5 cm del puño). lift = la mitad
// del alargamiento del cable respecto a la posición más corta (g0 = puños en ella)
const towers=(E,b,TX,PH,g0)=>{for(const[s,k]of SS){const z=k,pz=k*.88,g=b.j(s,'grip'),pul=[TX,PH,pz],cd=V.norm(V.sub(pul,g)),ax=b.S[s].gripAx;
    const clip=V.madd(g,cd,.085),L0=V.dist(pul,g0[s==='R'?0:1])-.085;E.handle(g,ax);for(const j of[-1,1])E.line(V.madd(g,ax,j*.055),clip,.008,'#2a2f35');
    for(const dx of[-.16,.16])E.beam([TX+dx,0,z],[TX+dx,2.3,z],.06,C.frame);E.beam([TX-.4,.03,z],[TX+.4,.03,z],.07,C.frameD,{layer:-1});
    E.cyl([TX,.12,pz],[TX,2.15,pz],.014,C.chrome);for(const y of[.12,2.15])E.beam([TX,y,z],[TX,y,pz],.04,C.frameD);
    const st=E.stack([TX,0,z],{h:1.95,lift:(V.dist(pul,clip)-L0)/2,n:16,sel:5,yaw:90,w:.26});E.cable(st,[TX,2.2,z]);E.cable([TX,2.2,z],[TX,2.2,pz]);E.cable([TX,2.2,pz],[TX,PH+.06,pz]);
    E.boxA([TX,PH,pz],[.06,.12,.06],C.frameD);E.pulley(V.madd(pul,cd,.03),V.norm(V.cross(UP,cd)),.042);E.cable(V.madd(pul,cd,.03),clip);}
  E.beam([TX,2.3,-1],[TX,2.3,1],.07,C.frame);};
// anclaje de bandas: dos montantes en x=AX, z=±AZ; banda (tubo con asa) del montante a cada puño
const bands=(E,b,AY,L0,AZ,AX)=>{for(const[s,k]of SS){const a=[AX,AY,k*AZ];K.band(E,[a,b.j(s,'grip')],null,{handle:b.S[s].gripAx,col:K.BAND.green,L0});
    E.beam([AX,0,k*AZ],[AX,2,k*AZ],.07,C.frame);E.beam([AX-.35,.03,k*AZ],[AX+.35,.03,k*AZ],.07,C.frameD,{layer:-1});E.cyl([AX,AY-.02,k*AZ],[AX,AY+.02,k*AZ],.045,K.BAND.green);}
  E.beam([AX,2,-AZ],[AX,2,AZ],.07,C.frame);E.beam([AX,.15,-AZ],[AX,.15,AZ],.05,C.frameD);};
const SCAM={cam:{yaw:42,pitch:10},fitBox:[[-.45,0,-.6],[.7,1.85,.6]]};
const PTL=L=>TL(L,2,1.1,.3);

GA.def('lib_cable_chest_press',Object.assign({
  title:'Press de pecho en cable',muscles:{pecs:1,frontdelts:.5,triceps:.5},labels:LB.p,
  timeline:PTL(['Vuelve controlando','Pecho estirado','Empuja y junta','Manerales juntos']),
  build(c,b,E){split(b,{sp:[-4],hd:-6});const g=push(b,c.p);towers(E,b,-.42,1.45,[g(0,1),g(1,1)]);E.trace('maneral',b.j('R','grip'));E.shadow([-.05,0,0],.55,.35,.55);}},SCAM));

GA.def('lib_band_chest_press',Object.assign({
  title:'Press de pecho con banda elástica',muscles:{pecs:1,frontdelts:.5,triceps:.5},labels:LB.p,
  timeline:PTL(['Vuelve lento · codos a 45°','Pecho estirado','Empuja al frente','Brazos estirados']),
  build(c,b,E){split(b,{sp:[-4],hd:-6});const g=push(b,c.p);bands(E,b,b.sho("R")[1]-.06,.5,.82,-.5);E.trace('asa',b.j('R','grip'));E.shadow([-.05,0,0],.55,.35,.55);}},SCAM));

// apertura de pie: de abierto (brazos en cruz algo por detrás del plano frontal) a manos juntas delante del pecho; codo fijo a 18°
const flyStand=(b,p)=>{const R=K.armD(18),cl=(s,k)=>V.norm(V.sub(ray(b.sho(s),b.tpt(k*.07,-.2,0),b.tf.F,R),b.sho(s))),op=(s,k)=>V.norm(b.tdir(k*.95,-.1,-.22));
  flyArc(b,1-p,18,cl,op,()=>UP);return SS.map(([s,k])=>V.madd(b.sho(s),op(s,k),R));};
const FTL=L=>[{p:1,dur:1.4,label:L[0],act:1},{dur:.8,label:'Aprieta al frente',act:1},{p:0,dur:2.4,label:L[1],act:.75},{dur:.4,label:'Estira el pecho',act:.5}];

GA.def('lib_cable_fly_mid',Object.assign({
  title:'Apertura en cable medio',muscles:{pecs:1,frontdelts:.4},labels:['Pectoral','Deltoides ant.'],
  timeline:FTL(['Cierra en arco','Abre lento · codos fijos']),
  build(c,b,E){both(b,{sp:[-3],hd:-5,sc:[-.012,-.015]});const g=flyStand(b,c.p);towers(E,b,-.58,1.42,g);E.trace('maneral',b.j('R','grip'));E.shadow([0,0,0],.45,.35,.55);}},SCAM,{fitBox:[[-.75,0,-.6],[.7,1.85,.6]]}));

GA.def('lib_band_fly',Object.assign({
  title:'Aperturas con banda elástica',muscles:{pecs:1,frontdelts:.4},labels:['Pectoral','Deltoides ant.'],
  timeline:FTL(['Junta las manos al frente','Abre lento · codos suaves']),
  build(c,b,E){split(b,{tl:8,sp:[-3],hd:-5,sc:[-.012,-.015]});flyStand(b,c.p);bands(E,b,b.sho("R")[1]-.1,.6,.68,-.72);E.trace('asa',b.j('R','grip'));E.shadow([-.05,0,0],.5,.35,.55);}},SCAM));

})(window.GymAnim);
