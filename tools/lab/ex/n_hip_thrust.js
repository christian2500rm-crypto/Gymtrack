/* Familia hip thrust: hip thrust (banco, Smith, máquina, sofá), puentes de glúteo (suelo, fitball), hiperextensiones, superman */
(function(GA){
const K=GA._.kit,V=GA._.V,C=GA._.COL,I=GA._,SS=K.SS,mix=K.mix,fpt=I.fpt,KC=K.COL;
const BH=.43,RC=.02,Z=[0,0,1];
// timeline estándar: sube, aprieta, baja, abajo
const TL=(L,u,h,d,r)=>[{p:1,dur:u||1.2,label:L[0],act:1},{dur:h||1,label:L[1],act:1},{p:0,dur:d||2.2,label:L[2],act:.75},{dur:r||.4,label:L[3],act:.5}];
const LT=['Empuja con los talones','Aprieta glúteos 1 s','Baja controlando','Abajo · sin apoyar'];
const GH={glutes:1,hams:.4,quads:.3},LG=['Glúteos','Isquiotibiales'];
// banco a lo ancho (eje Z) con el canto delantero en x=0
const bench=E=>K.box(E,[-.15,0,0],[1.05,BH,.3],{kind:'bench',yaw:90});
// hip thrust: espalda alta (bajo las escápulas) en el canto del banco (x=0, y=H); p 0 abajo → 1 tronco y muslos alineados
const thrust=(b,p,o)=>{o=o||{};const a=mix(o.a0==null?50:o.a0,o.a1||0,p);
  b.pelvis([0,1,0],{tilt:a-90});K.trunk(b,{sp:[mix(6,2,p)],hd:mix(24,34,p),sc:[0,-.01]});
  const T=b.tf;K.shift(b,V.sub(V.madd([-RC,(o.H||BH)-RC,0],T.F,RC+.115),fpt(T,0,.15,.012)));
  for(const[s,k]of SS){if(o.free===s)continue;b.footFlat(s,[o.fx||.71,0,k*(o.fz||.16)],-k*(o.toe==null?10:o.toe));b.leg(s,null,[.6,1,k*.3]);}};
// punto del pliegue de la cadera (centro de la carga a f del eje); con g: se desliza por el pliegue hasta g(punto)=0
const hipPt=(b,f,g)=>{const q=u=>{const r=b.ppt(0,u,f);r[2]=0;return r;};return q(g?K.root(u=>g(q(u)),-.1,.14):.02);};
// normal superior del muslo (plano XY) y empuje de la carga fuera del muslo: holgura .095 (muslo+short) + r
const thn=b=>{const h=V.lerp(b.hip('R'),b.hip('L'),.5),q=V.sub(V.lerp(b.j('R','kne'),b.j('L','kne'),.5),h);q[2]=0;const t=V.norm(q);return[h,[-t[1],t[0],0]];};
const clr=(b,c,r)=>{const[h,n]=thn(b),o=V.dot(V.sub(c,h),n),m=.095+r;return o<m?V.madd(c,n,m-o):c;};
const grab=(b,c,w,ax)=>{for(const[s,k]of SS)b.arm(s,V.add(c,[0,0,k*w]),[0,-1,k*.4],ax||Z);};
// barra con almohadilla de espuma sobre la cadera
const padBar=(E,c,o)=>{K.barbell(E,c,Z,o);E.cyl(V.add(c,[0,0,-.2]),V.add(c,[0,0,.2]),.042,KC.foam);};
// brazos abiertos con las palmas apoyadas sobre el banco/sofá (altura y)
const armsOn=(b,E,y,x)=>{for(const[s,k]of SS)K.palm(b,E,s,[x,y,k*.47],{fd:[-1,0,k*.25],pole:[.15,.3,k]});};
const HT=(o)=>Object.assign({cam:{yaw:30,pitch:27},muscles:GH,labels:LG,timeline:TL(LT)},o);

GA.def('lib_hip_thrust_bb',HT({
  title:'Hip thrust con barra',cam:{yaw:50,pitch:24},muscles:{glutes:1,hams:.45,quads:.3,adductors:.25},
  build(c,b,E){bench(E);thrust(b,c.p);const bc=clr(b,hipPt(b,.135),.042);padBar(E,bc,{plates:[.225,.225]});grab(b,bc,.29);E.shadow([.3,0,0],.8,.45,.5);}
}));

// Smith: la barra sube por las guías (x fija) → el punto de apoyo se desliza un poco por el pliegue de la cadera
GA.def('lib_hip_thrust_smith',HT({
  title:'Hip thrust en Smith',cam:{yaw:50,pitch:22},fitBox:[[-.45,0,-.45],[.9,.9,.45]],
  build(c,b,E){bench(E);thrust(b,c.p);const BX=.36,bc=hipPt(b,.135,q=>q[0]-BX),RZ=.62,[h,n]=thn(b),o=V.dot(V.sub(bc,h),n);if(o<.137)bc[1]+=(.137-o)/n[1];
    for(const k of[-1,1]){const o=k>0?{alpha:.3,outline:false}:null;E.beam([BX,0,k*RZ],[BX,2.15,k*RZ],.055,C.frame,o);E.beam([BX-.6,.03,k*RZ],[BX+.62,.03,k*RZ],.07,C.frameD,{layer:-1});E.boxA([BX,bc[1],k*RZ],[.1,.13,.1],C.frameD,o);}
    E.beam([BX,2.15,-RZ-.03],[BX,2.15,RZ+.03],.07,C.frame);
    padBar(E,bc,{len:2.04,inner:.69,plates:[.225,.165]});grab(b,bc,.29);E.trace('barra',V.add(bc,[0,0,1.02]));E.shadow([.3,0,0],.8,.45,.5);}
}));

// máquina: palanca con rodillo sobre la cadera que gira en un eje por delante de los pies; discos en los cuernos
GA.def('lib_hip_thrust_machine',HT({
  title:'Hip thrust en máquina',cam:{yaw:40,pitch:36},
  build(c,b,E){thrust(b,c.p,{H:.45});const P=[1.12,.36,0],L=.8,rc=hipPt(b,.145,q=>V.dist(q,P)-L);
    E.pad([-.3,.41,0],[0,.41,0],.62,.08,C.pad,{up:[0,1,0],layer:-1});
    for(const k of[-1,1]){E.beam([-.15,.03,k*.36],[1.2,.03,k*.36],.07,C.frameD,{layer:-1});E.beam([-.15,.03,k*.36],[-.15,.37,k*.36],.06,C.frame,{layer:-1});
      E.beam([P[0],.03,k*.42],[P[0],P[1],k*.42],.07,C.frame);const e=[rc[0],rc[1],k*.42];E.beam([P[0],P[1],k*.42],e,.06,C.frameD);
      E.cyl(e,V.add(e,[0,0,k*.22]),.025,C.chrome);for(const d of[.07,.115])E.plate(V.add(e,[0,0,k*d]),Z,.17,{th:.04});}
    E.cyl([P[0],P[1],-.48],[P[0],P[1],.48],.03,C.chrome);E.cyl(V.add(rc,[0,0,-.42]),V.add(rc,[0,0,.42]),.05,C.pad);
    grab(b,rc,.36);E.trace('rodillo',V.add(rc,[0,0,.45]));E.shadow([.4,0,0],.8,.45,.5);}
}));

GA.def('lib_hip_thrust_db',HT({
  title:'Hip thrust con mancuerna',muscles:{glutes:1,hams:.5,quads:.4,adductors:.3},
  build(c,b,E){bench(E);thrust(b,c.p);const r=.078,dc=clr(b,hipPt(b,.094+r),r),F=b.pdir(0,0,1);E.dumbbell(dc,Z,{r,hl:.09,len:.14});
    for(const[s,k]of SS)b.arm(s,V.add(V.madd(dc,F,r+.01),[0,0,k*.115]),[0,-1,k*.6],[1,0,0]);E.shadow([.3,0,0],.8,.45,.5);}
}));

// sofá: escápulas en el borde del asiento, brazos apoyados en el cojín
const sofa=E=>{const f='#5a6472',g='#6b7685',o=(x,y,z,sx,sy,sz,c,r)=>E.boxA([x,y,z],[sx,sy,sz],c,{round:r||6,layer:-1});
  o(-.42,.21,0,.84,.34,1.5,f);o(-.36,.415,0,.72,.07,1.22,g,9);o(-.74,.62,0,.2,.56,1.5,f,10);
  for(const k of[-1,1]){o(-.4,.5,k*.68,.88,.26,.16,f,9);for(const x of[-.78,-.06])E.cyl([x,0,k*.67],[x,.04,k*.67],.025,KC.woodD,{layer:-1});}};
GA.def('lib_hip_thrust_sofa',HT({
  title:'Hip thrust con peso corporal',fitBox:[[-.6,0,-.62],[.95,.8,.62]],
  build(c,b,E){sofa(E);thrust(b,c.p,{H:.45});armsOn(b,E,.45,-.3);E.shadow([.2,0,0],1,.5,.5);}
}));

GA.def('lib_hip_thrust_single',HT({
  title:'Hip thrust a una pierna',muscles:{glutes_R:1,hams_R:.45,quads_R:.3},labels:LG,
  timeline:TL(['Empuja con el talón','Aprieta 1 s · cadera recta','Baja controlando','Abajo · sin apoyar'],1.3,1,2.4),
  build(c,b,E){bench(E);thrust(b,c.p,{free:'L',fz:.11});b.legFK('L',{flex:mix(105,95,c.p),knee:90,abd:2});b.footRelax('L',10);armsOn(b,E,BH,-.14);E.shadow([.3,0,0],.8,.45,.5);}
}));

// ═══ puentes en el suelo: hombros fijos sobre la esterilla, la cadera sube hasta alinear hombros-cadera-rodillas ═══
const LB=['Sube la cadera','Aprieta glúteos 1 s','Baja lento','Abajo · sin apoyar'];
const bridge=(b,E,p,o)=>{o=o||{};const Y=K.mat(E,[-.08,0,0],[1.75,.6]).top;
  K.supine(b,{y:Y,x:-.45,at:'sho',incl:-mix(o.i0||3,o.i1||25,p),sp:[mix(3,0,p)],sc:[0,-.01],hd:'rest'});
  if(o.legs)o.legs(b);else for(const[s,k]of SS){if(o.free===s)continue;b.footFlat(s,[o.fx||.33,Y,k*(o.fz||.15)],-k*6);b.leg(s,null,[0,1,k*(o.ko||.08)]);}
  if(!o.hands)K.armsFloor(b,E,{y:Y,spread:16});E.shadow([0,0,0],.85,.32,.5);return Y;};
const BR=(o)=>Object.assign({cam:{yaw:-30,pitch:18},muscles:{glutes:1,hams:.5},labels:LG,timeline:TL(LB,1,1,2,.5)},o);

GA.def('lib_glute_bridge',BR({
  title:'Puente de glúteo',muscles:{glutes:1,hams:.5,lowback:.25},
  build(c,b,E){bridge(b,E,c.p);}
}));
GA.def('lib_glute_bridge_bb',BR({
  title:'Puente de glúteo con barra',cam:{yaw:-40,pitch:26},fitBox:[[-.85,0,-.35],[.6,.7,.35]],
  build(c,b,E){bridge(b,E,c.p,{hands:1,fx:.3});const bc=clr(b,hipPt(b,.135),.042);padBar(E,bc,{plates:[.225]});grab(b,bc,.3);}
}));
GA.def('lib_glute_bridge_db',BR({
  title:'Puente de glúteo con mancuerna',muscles:{glutes:1,hams:.6,quads:.3},
  build(c,b,E){bridge(b,E,c.p,{hands:1});const r=.078,dc=clr(b,hipPt(b,.094+r),r),F=b.pdir(0,0,1);E.dumbbell(dc,Z,{r,hl:.09,len:.14});
    for(const[s,k]of SS)b.arm(s,V.add(V.madd(dc,F,r+.01),[0,0,k*.115]),[0,-1,k*.6],[1,0,0]);}
}));
GA.def('lib_glute_bridge_single',BR({
  title:'Puente de glúteo a una pierna',muscles:{glutes_R:1,hams_R:.5,lowback:.25,abs:.25},
  timeline:TL(['Empuja con el talón','Aprieta 1 s · pelvis nivelada','Baja lento','Abajo · sin apoyar'],1.1,1,2.4,.5),
  build(c,b,E){bridge(b,E,c.p,{free:'L',fz:.11,fx:.3});const d=V.norm(V.sub(b.j('R','kne'),b.hip('R')));d[2]=-d[2];b.legDir('L',d,d);b.footRelax('L',20);}
}));
GA.def('lib_miniband_glute_bridge',BR({
  title:'Puente de glúteo con minibanda',muscles:{glutes:1,hams:.5,abductors:.4},labels:['Glúteos','Glúteo medio'],
  timeline:TL(['Sube · rodillas afuera','Aprieta 1 s','Baja lento','Abajo · tensa la banda'],1,1,2,.5),
  build(c,b,E){bridge(b,E,c.p,{fz:.16,ko:mix(.1,.22,c.p)});const at=s=>V.lerp(b.j(s,'kne'),b.hip(s),.14),ax=V.norm(V.sub(b.hip('R'),b.j('R','kne')));
    K.miniband(E,at('R'),at('L'),{axis:ax,r:.064});}
}));
// talones sobre el fitball (quieto): la suela apoya en la esfera bajo el tobillo, puntas arriba
GA.def('lib_ball_bridge',BR({
  title:'Puente de glúteo en fitball',muscles:{glutes:1,hams:.7,lowback:.3},
  timeline:TL(['Sube la cadera','Aprieta 1 s · bola quieta','Baja lento','Abajo · sin apoyar'],1,1,2.2,.5),
  build(c,b,E){const fb=K.fitball(E,[.87,.275,0],.275),FB=b=>{for(const[s,k]of SS){const u=V.norm([-.42,1,k*.36]);
      K.footOn(b,s,V.madd(fb.c,u,fb.r),V.perp([1,0,0],u),u,u);b.leg(s,null,[0,1,k*.12]);}};
    bridge(b,E,c.p,{i1:28,legs:FB});}
}));

// ═══ extensiones lumbares (cadena posterior) ═══
const LL=['Lumbares','Glúteos'],SU={lowback:1,glutes:.6};
// boca abajo: pecho, brazos (estirados al frente) y piernas suben a la vez; mirada al suelo
GA.def('lib_superman',{
  title:'Superman',cam:{yaw:18,pitch:11},muscles:{lowback:1,glutes:.6,hams:.35,midback:.3},labels:LL,
  timeline:[{p:1,dur:1.2,label:'Eleva brazos, pecho y piernas',act:1},{dur:2,label:'Pausa 2 s · mira al suelo',act:1},{p:0,dur:1.8,label:'Baja lento',act:.75},{dur:.6,label:'Abajo',act:.45}],
  build(c,b,E){const p=c.p,Y=K.mat(E,[.15,0,0],[2.1,.6]).top,ex=mix(0,28,p);
    K.prone(b,{y:Y,x:0,sp:[-ex],hd:-ex*.45,sc:[mix(0,.012,p),-.01]});
    for(const[s,k]of SS){const sh=b.sho(s),hp=b.hip(s),R=K.armD(4),dy=mix(Y+.035,sh[1]+.15,p)-sh[1],dz=k*.06;
      b.arm(s,[sh[0]+Math.sqrt(R*R-dy*dy-dz*dz),sh[1]+dy,sh[2]+dz],[0,1,0],[0,0,1]);
      const ly=Y+.075+mix(0,.19,p),lx=-Math.sqrt(K.legD(3)**2-(ly-hp[1])**2-.0004);b.leg(s,[hp[0]+lx,ly,k*.11],[0,-1,0]);b.footRelax(s,62);}
    E.shadow([.1,0,0],1,.3,.5);}
});
// brazos cruzados sobre el pecho
const cross=b=>{for(const[s,k]of SS)b.arm(s,b.tpt(-k*.11,-.06-(k+1)*.012,.15+(k+1)*.012),b.tdir(k*.55,-.75,.4),b.tdir(0,1,0));};
// banco romano a 45°: piernas fijas (cojín bajo el pliegue de la cadera, rodillos tras los tobillos); bisagra de cadera, espalda neutra
GA.def('lib_hyperextension',{
  title:'Hiperextensión en banco romano',cam:{yaw:30,pitch:8},muscles:{lowback:1,glutes:.8,hams:.7},labels:['Lumbares','Glúteos','Isquiotibiales'],
  timeline:[{p:1,dur:1.4,label:'Sube hasta alinear',act:1},{dur:.6,label:'Arriba · sin arquear',act:1},{p:0,dur:2.2,label:'Baja con la espalda recta',act:.75},{dur:.4,label:'Abajo',act:.5}],
  build(c,b,E){const p=c.p,H=[0,1.02,0],dL=[-.7071,-.7071,0],nF=[.7071,-.7071,0],u=V.neg(dL),sD=V.norm(V.madd(dL,nF,-.06));
    b.pelvis(H,{tilt:mix(140,45,p)});K.trunk(b,{sp:[mix(8,0,p)],hd:mix(8,2,p),sc:[0,.01]});
    for(const[s,k]of SS){b.legDir(s,dL,sD);b.foot(s,b.j(s,'ank'),nF,u);}
    cross(b);
    const an=b.j('R','ank'),A=V.add(H,V.madd(V.mul(dL,.2),nF,.2)),FP=V.madd(V.madd(an,u,-.108),nF,.07),B=V.madd(FP,u,-.06),R=V.madd(V.madd(an,u,.1),nF,-.1);
    E.pad(V.madd(V.madd(H,dL,.05),nF,.13),V.madd(V.madd(H,dL,.38),nF,.13),.42,.09,C.pad,{up:V.neg(nF),layer:-1});
    E.boxA([FP[0],FP[1],0],[.05,.36,.4],C.frameD,{pitch:45,layer:-1});
    E.cyl([R[0],R[1],-.2],[R[0],R[1],.2],.045,C.pad);E.beam(V.madd(R,u,-.02),B,.04,C.frameD,{layer:-1});
    E.beam(A,B,.08,C.frame,{layer:-2});E.beam(A,[A[0],.03,0],.07,C.frame,{layer:-2});E.beam(B,[B[0],.03,0],.07,C.frame,{layer:-2});
    E.beam([B[0]-.25,.03,0],[A[0]+.25,.03,0],.08,C.frameD,{layer:-2});for(const x of[B[0]-.2,A[0]+.2])E.beam([x,.03,-.35],[x,.03,.35],.06,C.frameD,{layer:-2});
    E.shadow([0,0,0],.8,.4,.5);}
});
// máquina lumbar sentado: pelvis fija (asiento, cojín de muslos, pies en la plataforma), rodillo bajo las escápulas;
// la palanca gira con el tórax alrededor de su centro de giro (como lib_crunch_machine); leva r 12 cm → cable → pila
const thA=b=>{const u=b.tdir(0,1,0);return Math.atan2(u[0],u[1]);};
GA.def('lib_back_ext_machine',{
  title:'Extensión lumbar en máquina',cam:{yaw:26,pitch:12},fitBox:[[-.8,0,-.45],[.72,1.36,.45]],
  muscles:{lowback:1,glutes:.5,hams:.4},labels:['Lumbares','Glúteos','Isquiotibiales'],
  timeline:[{p:1,dur:1.5,label:'Extiende sin rebotar',act:1},{dur:.8,label:'Pausa atrás',act:1},{p:0,dur:2.5,label:'Vuelve controlando',act:.75},{dur:.4,label:'Adelante · sin soltar',act:.5}],
  build(c,b,E){const SY=.5,FY=.09,RU=-.17,RR=.055,LZ=.31,p=c.p;
    const pose=q=>{K.seat(b,[0,SY,0],{tilt:mix(30,-8,q),sp:[mix(16,-4,q)],hd:mix(14,2,q),sc:[0,.005],feet:{x:.44,y:FY+.008,z:.13}});cross(b);};
    const G=K.memo(this,'g',()=>{pose(0);const f=K.root(f=>{const e=K.ells(b),q=b.tpt(0,RU,f);return Math.min(K.sgap(e.tho,q,RR),K.sgap(e.shd,q,RR));},-.35,-.08);
      const a0=b.tpt(0,RU,f),g0=thA(b);pose(1);const a1=b.tpt(0,RU,f),dA=thA(b)-g0,cs=Math.cos(dA),sn=Math.sin(dA);
      const rx=a1[0]-(a0[0]*cs+a0[1]*sn),ry=a1[1]-(-a0[0]*sn+a0[1]*cs),d=(1-cs)**2+sn*sn;return{f,g0,PV:[((1-cs)*rx+sn*ry)/d,(-sn*rx+(1-cs)*ry)/d]};});
    b.ikErr=0;pose(p);const rc=b.tpt(0,RU,G.f),PV=G.PV,CR=.12,CZ=-.38,lift=.015+Math.max(0,G.g0-thA(b))*CR;
    E.cyl([rc[0],rc[1],-LZ],[rc[0],rc[1],LZ],RR,C.pad);
    for(const k of[-1,1]){E.beam([PV[0],PV[1],k*LZ],[rc[0],rc[1],k*LZ],.05,C.frame);E.beam([PV[0],PV[1],k*.44],[PV[0]+.05,0,k*.44],.07,C.frame,{layer:-1});}
    E.cyl([PV[0],PV[1],-.46],[PV[0],PV[1],.46],.022,C.chrome);E.disc([PV[0],PV[1],CZ],Z,CR,.03,C.frameD,{hub:.3});
    const kn=b.j('R','kne'),hp=b.hip('R'),td=V.norm(V.sub(kn,hp)),tc=V.madd(V.lerp(hp,kn,.72),V.norm(V.perp([0,1,0],td)),.109);
    E.cyl([tc[0],tc[1],-.24],[tc[0],tc[1],.24],.045,C.pad);for(const k of[-1,1])E.beam([tc[0],tc[1],k*.24],[tc[0]+.04,FY,k*.24],.035,C.frameD,{layer:-1});
    E.pad([-.2,SY-.04,0],[.3,SY-.04,0],.4,.08,C.pad,{up:[0,1,0],layer:-1});E.beam([0,0,0],[0,SY-.08,0],.08,C.frame,{layer:-1});
    E.boxA([.5,FY/2,0],[.3,FY,.46],C.frameD,{layer:-1});E.beam([-.9,.03,0],[.62,.03,0],.08,C.frameD,{layer:-2});
    const SX=-.7,TX=-.86,FL=.035,top=E.stack([SX,0,CZ],{h:1.3,lift,n:12,sel:5,yaw:0,w:.26,bias:.2});
    E.beam([TX-.04,0,CZ],[TX-.04,1.42,CZ],.06,C.frame,{layer:-1});E.beam([TX-.07,1.42,CZ],[SX+.04,1.42,CZ],.05,C.frame,{layer:-1});
    const q=[[PV[0]+CR,PV[1]],[PV[0]+CR,FL],[TX,FL],[TX,1.36],[SX,1.36],[SX,top[1]+.02]];
    for(let i=0;i<5;i++)E.cable([q[i][0],q[i][1],CZ],[q[i+1][0],q[i+1][1],CZ]);for(const i of[1,2,3,4])E.pulley([q[i][0],q[i][1],CZ],Z,.035);
    E.shadow([0,0,0],.8,.45,.55);}
});
// fitball: abdomen y cadera sobre el balón, puntas en el suelo y suelas contra la pared; el tronco rodea el balón y sube hasta la línea de las piernas
GA.def('lib_ball_back_ext',{
  title:'Hiperextensión en fitball',cam:{yaw:32,pitch:12},fitBox:[[-.9,0,-.45],[.8,1.15,.45]],muscles:{lowback:1,glutes:.6,hams:.5},labels:LL,
  timeline:[{p:1,dur:1.3,label:'Sube hasta alinear',act:1},{dur:.8,label:'Arriba · sin pasarte',act:1},{p:0,dur:2.2,label:'Baja rodeando el balón',act:.75},{dur:.4,label:'Abajo',act:.5}],
  build(c,b,E){const p=c.p,fb=K.fitball(E,[0,.325,0],.325),D=K.legD(10),sg=k=>K.sgap(K.ells(b)[k],fb.c,fb.r);
    for(const[s,k]of SS)K.footBallOn(b,s,[-.75,0,k*.17],-k*8,72);const A=V.lerp(b.j('R','ank'),b.j('L','ank'),.5);
    // cadera en el círculo de las piernas (tobillos fijos) apoyada en el balón; el tronco se enrolla hasta tocarlo (sp)
    const pose=(tl,sp)=>{const pl=a=>{b.pelvis(V.add(A,[D*Math.cos(a),D*Math.sin(a),0]),{tilt:tl});K.trunk(b,{sp:[sp],hd:mix(-4,0,p),sc:[0,.02]});return Math.min(sg('pel'),sg('hipR'));};pl(K.root(pl,.1,1.2));};
    const SB=K.memo(this,'sb',()=>K.root(s=>{pose(80,s);return Math.min(sg('lum'),sg('tho'));},-10,80));
    b.ikErr=0;pose(mix(80,56,p),mix(SB,-2,p));K.legs(b,{up:-1});
    for(const[s,k]of SS)b.arm(s,b.hpt(k*.12,.01,-.02),b.tdir(k,.3,-.3),b.tdir(0,0,1));
    let w=1;for(const e of[...K.shoe(b.j('R','ank'),b.S.R.ffwd,b.S.R.fup)])w=Math.min(w,K.gap(e,[0,0,0],[1,0,0]));
    E.boxA([w-.05,.55,0],[.1,1.1,1],'#2a333d',{layer:-2});E.shadow([-.4,0,0],.9,.35,.5);}
});
})(window.GymAnim);
