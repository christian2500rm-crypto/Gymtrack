/* En casa con carga improvisada: mochila cargada y garrafas de agua en lugar de pesas. Sentadilla abrazando la mochila,
   peso muerto rumano con la mochila colgando del asa, y press de hombros, curl y elevación lateral con garrafas */
(function(GA){
const K=GA._.kit,V=GA._.V,C=GA._.COL,DM=GA._.DIM,SS=K.SS,mix=K.mix,sst=K.sst,D=K.D,UP=[0,1,0],X=[1,0,0],Z=[0,0,1];
const sh=(E,x)=>E.shadow([x||0,0,0],.5,.38,.55);
// menor ángulo ≥ 0 en que ok(a) se cumple (pasos st hasta mx y bisección): la carga cuelga y sólo gira lo que la apoya
const rest=(ok,st,mx)=>{let a=0;while(a<mx&&!ok(a))a+=st;if(a>0){let lo=a-st;for(let i=0;i<6;i++){const m=(lo+a)/2;if(ok(m))a=m;else lo=m;}}return a;};
// x del borde delantero de las piernas a la altura y (muslo con pantalón / tibia) que se solapan en z con [z0-zr, z0+zr] (n_hinge)
const front=(b,y,z0,zr)=>{let x=-9;for(const[s]of SS){const S=b.S[s];for(const[a,z,r0,r1]of[[S.hip,S.kne,.09,.06],[S.kne,S.ank,.058,.04]])
  if(y<=a[1]&&y>=z[1]){const t=(a[1]-y)/(a[1]-z[1]),d=V.norm(V.sub(z,a)),r=mix(r0,r1,t);
    if(zr==null||Math.abs(mix(a[2],z[2],t)-z0)<zr+r)x=Math.max(x,mix(a[0],z[0],t)+r*Math.sqrt(1+(d[0]/Math.min(-.3,d[1]))**2));}
  else if(r0>.08&&y>a[1]&&y<a[1]+r0&&(zr==null||Math.abs(a[2]-z0)<zr+r0))x=Math.max(x,a[0]+Math.sqrt(r0*r0-(y-a[1])**2));}return x;};

// ═══ MOCHILA CARGADA ≈ 30 × 42 × 18 cm ═══ c = centro, U = arriba, O = cara de las correas (la otra cara apoya en el cuerpo).
// Cuerpo con la parte de arriba redondeada, asa superior de 14 cm (caben las dos manos) y correas de hombro algo sueltas.
const BC='#6b5b4b',BS='#2b2622';
const pack=(E,c,U,O)=>{const R=V.norm(V.cross(O,U)),P=(r,u,f)=>V.add(c,V.add(V.mul(R,r),V.add(V.mul(U,u),V.mul(O,f)))),ax=(a,u,f)=>[V.mul(R,a),V.mul(U,u),V.mul(O,f)];
  E.box(P(0,-.03,0),ax(.15,.18,.09),BC,{grp:'bp',round:7});E.ell(P(0,.13,0),ax(.15,.08,.09),BC,{grp:'bp'});
  for(const k of[-1,1]){const q=[P(k*.05,.19,.07),P(k*.075,.12,.112),P(k*.1,-.03,.118),P(k*.115,-.15,.104),P(k*.12,-.2,.08)];
    for(let i=1;i<q.length;i++)E.cap(q[i-1],q[i],.012,.012,BS,{grp:'bps'+k});}
  const h=[P(-.075,.195,0),P(-.06,.235,0),P(.06,.235,0),P(.075,.195,0)];for(let i=1;i<4;i++)E.cap(h[i-1],h[i],.009,.009,BS,{grp:'bph'});};

// ═══ GARRAFA DE AGUA CON ASA ═══ J: w ancho (a lo largo del asa), d fondo, h alto del cuerpo, sh hombro, nk cuello, cp tapón, hd asa→tapón,
// r radio del tapón, hw semilargo del asa. 5 L ≈ 17 × 12 × 33 cm; 2 L ≈ 12 × 9 × 23 cm. t = asa → arranque del cuerpo
const J5={w:.17,d:.12,h:.26,sh:.035,nk:.018,cp:.02,hd:.05,r:.024,hw:.062},J2={w:.12,d:.088,h:.15,sh:.024,nk:.012,cp:.016,hd:.032,r:.019,hw:.056};
for(const J of[J5,J2])J.t=J.hd+J.cp+J.nk+J.sh;
const JC='#bcd7e6',JL='#3a7cc0',JK='#2c5f9e',JH='#e4eaef';
// garrafa colgando del puño s (el asa sigue el eje W del agarre): cae por gravedad y gira sobre el asa hacia n sólo lo justo para
// que brazo, antebrazo y puño (cápsulas) no entren en el cuerpo ni en el hombro de la garrafa (cajas) → {h,W,U (cuerpo→asa),F,c,a}
const hangJ=(b,s,W,n,J)=>{const S=b.S[s],h=S.grip,fd=V.norm(V.sub(S.wri,S.elb)),P=[];   // puntos de los ejes de las cápsulas (desde el puño) + radio
  for(const[A,B,ra,rb]of[[S.sho,S.elb,.056,.045],[S.elb,S.wri,.042,.03],[S.wri,V.madd(S.wri,fd,.1),.038,.034]])
    for(let i=0;i<=10;i++){const q=V.sub(V.lerp(A,B,i/10),h);q.push(mix(ra,rb,i/10));P.push(q);}
  W=V.norm(W);const g0=V.norm(V.perp([0,-1,0],W)),Wp=V.dot(V.cross(W,g0),n)<0?V.neg(W):W,
    BX=[[-J.t-J.h/2,J.w/2,J.h/2,J.d/2],[-J.t+J.sh*.25,J.w*.4,J.sh*.25,J.d*.4]];   // cuerpo y hombro: [u del centro, semiejes W,U,F]
  const fr=a=>{const U=V.neg(V.rot(g0,Wp,a));return{h,W,U,F:V.norm(V.cross(U,W))};},
    ok=a=>{const{U,F}=fr(a);for(const q of P){const w=Math.abs(V.dot(q,W)),u=V.dot(q,U),f=Math.abs(V.dot(q,F)),r2=q[3]*q[3];
      for(const[c,ea,eu,ed]of BX){const x=Math.max(0,w-ea),y=Math.max(0,Math.abs(u-c)-eu),z=Math.max(0,f-ed);if(x*x+y*y+z*z<r2)return false;}}return true;};
  const a=rest(ok,.1,1.5),f=fr(a);f.c=V.madd(h,f.U,-J.t-J.h/2);f.a=a;return f;};
const jug=(E,J,f,g)=>{const{h,W,U,F}=f,P=u=>V.madd(h,U,u),ax=(a,u,d)=>[V.mul(W,a),V.mul(U,u),V.mul(F,d)],o={grp:g};
  E.box(P(-J.t-J.h/2),ax(J.w/2,J.h/2,J.d/2),JC,{grp:g,round:5});E.ell(P(-J.t),ax(J.w/2,J.sh,J.d/2),JC,o);
  E.box(P(-J.t-J.h*.44),ax(J.w/2+.002,J.h*.17,J.d/2+.002),JL,o);                                   // etiqueta
  E.cyl(P(-J.t+J.sh*.6),P(-J.hd-J.cp),J.r*.78,JC,o);E.cyl(P(-J.hd-J.cp),P(-J.hd),J.r,JK,o);          // cuello y tapón
  // asa: barra dentro del puño y dos patas hasta la anilla bajo el tapón
  E.cap(V.madd(h,W,-J.hw),V.madd(h,W,J.hw),.0085,.0085,JH,{bias:.04});
  for(const k of[-1,1])E.cap(V.madd(h,W,k*J.hw),V.madd(P(-J.hd-J.cp-.006),W,k*J.r*.9),.0065,.0065,JH,{bias:.04});};

// ═══ SENTADILLA CON MOCHILA ═══ mochila cargada abrazada contra el pecho (correas hacia fuera): su cara interior toca el tórax, los
// antebrazos la rodean por los lados y las manos agarran las aristas delanteras. Como la goblet: pecho arriba, rodillas siguiendo la
// punta del pie, baja hasta muslos paralelos y sube empujando con los talones (CdM con la mochila sobre el medio pie).
const hug=b=>{const U=V.norm(V.lerp(b.tdir(0,1,0),UP,.45)),O=V.norm(V.perp(b.tdir(0,0,1),U)),R=V.norm(V.cross(O,U)),e=K.ells(b);
  let c=V.madd(b.tpt(0,-.19,0),O,.3);const o=V.madd(c,O,-.09),n=V.neg(O);c=V.madd(c,O,.003-Math.min(K.gap(e.tho,o,n),K.gap(e.lum,o,n)));
  for(const[s,k]of SS)b.arm(s,V.add(c,V.add(V.mul(R,k*.163),V.add(V.mul(U,-.05),V.mul(O,.072)))),b.tdir(k*.55,-1,-.3),U);
  return{c,U,O};};
const SQ=(ctx,b,p,o)=>{const st=(kf,tl)=>K.stand(b,{fz:o.fz,toe:o.toe,kf,tilt:tl,sp:o.sp||[-3],hd:-tl*.4,sc:o.sc,balance:true,arms:o.arms,xm:o.xm});
  const kB=K.memo(ctx,'kB',()=>K.root(kf=>{st(kf,o.t[1]);return b.hip('R')[1]-b.j('R','kne')[1]+(o.dep||0);},60,150));
  b.ikErr=0;return st(mix(5,kB,p),mix(o.t[0],o.t[1],p));};
GA.def('lib_squat_backpack',{title:'Sentadilla con mochila',cam:{yaw:34,pitch:9},
  muscles:{quads:1,glutes:.8,adductors:.4,abs:.2},labels:['Cuádriceps','Glúteos'],init:{p:0,act:.45},
  timeline:[{p:1,dur:2.2,label:'Baja · pecho arriba',act:.85},{dur:.35,label:'Abajo · muslos paralelos',act:.95},
    {p:0,dur:1.3,label:'Sube empujando con los talones',act:1},{dur:.6,label:'Arriba · mochila pegada',act:.45}],
  build(c,b,E){let bp=null;
    SQ(this,b,c.p,{fz:.17,toe:16,t:[3,22],dep:0,sc:[-.005,-.005],arms:b=>{bp=hug(b);},xm:()=>bp?[[bp.c,10/75]]:null});
    pack(E,bp.c,bp.U,bp.O);sh(E);}});

// ═══ PESO MUERTO RUMANO CON MOCHILA ═══ las dos manos en el asa superior, brazos estirados colgando de los hombros; la cara interior
// de la mochila pasa a ras de los muslos y, si rodillas o tibias la tocan, gira sobre el asa. Rodillas suaves casi fijas, cadera atrás
// con la columna neutra hasta que la mochila llega a la altura de las tibias (sin tocar el suelo) y sube apretando glúteos.
const carry=b=>{const S=b.sho('R'),L=K.armD(4),dz=.045-S[2];let x=S[0],y=S[1]-L;
  for(let i=0;i<4;i++){x=Math.max(S[0]-.03,front(b,y-.05,0,.16)+.096);y=S[1]-Math.sqrt(Math.max(.01,L*L-dz*dz-(x-S[0])**2));}
  for(const[s,k]of SS)b.arm(s,[x,y,k*.045],[-.3,0,k],Z);
  const h=[x,y,0],dn=a=>[Math.sin(a),-Math.cos(a),0],Of=a=>[Math.cos(a),Math.sin(a),0],
    a=rest(a=>{for(let d=.05;d<.47;d+=.04){const q=V.madd(V.madd(h,dn(a),d),Of(a),-.094);if(q[0]<front(b,q[1],0,.16)+.003)return false;}return true;},.03,1);
  return{h,U:V.neg(dn(a)),O:Of(a),c:V.madd(h,dn(a),.235),a};};
const rdl=(b,p,T1)=>{let bp=null;K.stand(b,{fz:.12,toe:6,kf:mix(10,20,sst(0,.45,p)),tilt:mix(2,T1,p),sp:[-2],hd:-mix(2,T1,p)*.3,sc:[-.008,-.006],
  balance:true,arms:b=>{bp=carry(b);},xm:()=>bp?[[bp.c,10/75]]:null});return bp;};
const low=bp=>bp.c[1]-.21*bp.U[1]-.09*Math.abs(bp.O[1]);
GA.def('lib_rdl_backpack',{title:'Peso muerto rumano con mochila',cam:{yaw:30,pitch:10},
  muscles:{hams:1,glutes:.9,lowback:.5},labels:['Isquiotibiales','Glúteos','Lumbares'],init:{p:0,act:.6},
  timeline:[{p:1,dur:3,label:'Baja · cadera atrás',act:.8},{dur:.3,label:'Estira isquios',act:.9},
    {p:0,dur:1.5,label:'Sube · empuja la cadera',act:1},{dur:.6,label:'Arriba · aprieta glúteos',act:.6}],
  build(c,b,E){const T1=K.memo(this,'T1',()=>K.root(t=>low(rdl(b,1,t))-.085,40,88));b.ikErr=0;   // el fondo pasa sobre las punteras
    const bp=rdl(b,c.p,T1);pack(E,bp.c,bp.U,bp.O);E.trace('mochila',V.add(bp.h,[0,0,.08]));sh(E,.05);}});

// ═══ PRESS DE HOMBROS CON GARRAFAS ═══ de pie, una garrafa de 5 L en cada mano por el asa (agarre prono), codos en el plano escapular
// algo por debajo de los hombros y antebrazos verticales todo el recorrido; la garrafa cuelga apoyada en el dorso del antebrazo (como una
// kettlebell). Empuja arriba en ligero arco hacia dentro hasta estirar los brazos sin arquear la espalda y baja lento.
GA.def('lib_shoulder_press_jugs',{title:'Press de hombros con garrafas',cam:{yaw:66,pitch:10},
  muscles:{frontdelts:1,sidedelts:.6,triceps:.6},labels:['Deltoides anterior','Tríceps'],init:{p:0,act:.65},
  timeline:[{p:1,dur:1.3,label:'Empuja arriba · sin arquear',act:1},{dur:.4,label:'Arriba · brazos estirados',act:.9},
    {p:0,dur:2.4,label:'Baja lento a los hombros',act:.75},{dur:.4,label:'Abajo · abdomen firme',act:.65}],
  build(c,b,E){const p=c.p,SP=30*D,AG=12*D,ph=mix(-32,84,p)*D,G={},W=(b,k)=>b.tdir(k*Math.cos(AG),0,Math.sin(AG));
    K.stand(b,{fz:.15,toe:8,kf:4,sp:[-1],hd:-3,sc:[.016*sst(.4,1,p),0],balance:true,xm:()=>G.R?[[G.R,5/75],[G.L,5/75]]:null,arms:b=>{
      for(const[s,k]of SS){b.armDir(s,b.tdir(k*Math.cos(SP)*Math.cos(ph),Math.sin(ph),Math.sin(SP)*Math.cos(ph)),b.tdir(0,1,0),W(b,k));G[s]=b.j(s,'grip');}}});
    for(const[s,k]of SS)jug(E,J5,hangJ(b,s,W(b,k),b.tdir(k*Math.sin(AG),0,-Math.cos(AG)),J5),'jg'+s);
    E.trace('garrafa',b.j('R','grip'));sh(E);}});

// ═══ CURL CON GARRAFAS ═══ de pie, una garrafa de 5 L en cada mano por el asa (agarre supino), brazos estirados con las garrafas a los
// lados de los muslos; sube con los codos pegados y fijos (húmero 3→10°) hasta ~135° y baja lento. La garrafa cuelga siempre vertical.
const AL=DM.fa+DM.grip;
const carm=(b,s,a,ab,fl,zt,r)=>{const k=K.sd(s),u=V.norm([Math.sin(a*D),-Math.cos(a*D),k*ab]),el=V.madd(b.sho(s),u,DM.ua),
  fz=K.clamp((k*zt-el[2])/AL,-.8,.8),q=Math.sqrt(1-fz*fz),ph=(a+fl)*D,f=[q*Math.sin(ph),-q*Math.cos(ph),fz];
  b.armDir(s,u,f,V.rot(V.norm(V.cross(Z,f)),f,k*(r||0)*D));return b.j(s,'grip');};
GA.def('lib_curl_jugs',{title:'Curl con garrafas',cam:{yaw:36,pitch:8},
  muscles:{biceps:1,forearms:.5},labels:['Bíceps','Antebrazo'],init:{p:0,act:.5},
  timeline:[{p:1,dur:1.2,label:'Sube · codos pegados',act:1},{dur:.6,label:'Aprieta arriba',act:1},
    {p:0,dur:2.6,label:'Baja lento sin balanceo',act:.75},{dur:.4,label:'Abajo · brazos estirados',act:.5}],
  build(c,b,E){const p=c.p;K.stand(b,{fz:.12,toe:8,kf:5,tilt:1,sp:[-2],hd:4,sc:[-.012,-.015]});
    for(const[s]of SS){carm(b,s,mix(3,10,p*p),.16,mix(14,135,p),mix(.3,.25,p),90);jug(E,J5,hangJ(b,s,b.S[s].gripAx,X,J5),'jg'+s);}
    E.trace('garrafa',b.j('R','grip'));sh(E);}});

// ═══ ELEVACIÓN LATERAL CON GARRAFAS ═══ de pie, una garrafa pequeña (2 L) en cada mano por el asa, tronco algo inclinado, codos suaves
// y fijos; sube en el plano escapular hasta la altura del hombro liderando con el codo, sin encoger, y baja lento.
GA.def('lib_lateral_raise_jugs',{title:'Elevación lateral con garrafas',cam:{yaw:60,pitch:8},
  muscles:{sidedelts:1,frontdelts:.3,traps:.25},labels:['Deltoides lateral','Trapecio'],init:{p:0,act:.5},
  timeline:[{p:1,dur:1.3,label:'Sube · lidera con el codo',act:1},{dur:.5,label:'Altura del hombro',act:1},
    {p:0,dur:2.4,label:'Baja lento sin encoger',act:.75},{dur:.4,label:'Abajo · sin descansar',act:.5}],
  build(c,b,E){const p=c.p;K.stand(b,{fz:.12,toe:8,kf:6,tilt:6,sp:[-2],hd:-5,sc:[-.006,0]});
    for(const[s,k]of SS){const o={abd:mix(14,90,p),hz:mix(14,24,p),elbow:mix(12,15,p),rot:mix(-5,8,p)};b.armFK(s,o);
      o.grip=V.norm(V.perp(b.tdir(0,0,1),V.norm(V.sub(b.j(s,'wri'),b.j(s,'elb')))));b.armFK(s,o);
      jug(E,J2,hangJ(b,s,o.grip,b.tdir(k,0,0),J2),'jg'+s);}
    E.trace('garrafa',b.j('R','grip'));sh(E);}});

})(window.GymAnim);
