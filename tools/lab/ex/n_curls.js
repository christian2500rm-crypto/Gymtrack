/* Curls: barra recta y Z, predicador, poleas (cuerda, una mano, bayesiano, alto), mancuernas (inclinado, Zottman, predicador, araña, inverso), banda, TRX */
(function(GA){
const K=GA._.kit,V=GA._.V,C=GA._.COL,DM=GA._.DIM,SS=K.SS,mix=K.mix,sst=K.sst,D=K.D,Z=[0,0,1],X=[1,0,0],UP=[0,1,0],AL=DM.fa+DM.grip;
const TL=(u,lu,t,lt,d,ld,r,lr)=>[{p:1,dur:u,label:lu,act:1},{dur:t,label:lt,act:1},{p:0,dur:d,label:ld,act:.75},{dur:r,label:lr,act:.5}];
const BI='Bíceps',FA='Antebrazo',BR='Braquial',I0={p:0,act:.5},MB={biceps:1,forearms:.3};
// codo fijo: húmero a `a`° de la vertical (+ adelante, mundo) y separación ab; antebrazo a a+fl° en el plano sagital con la componente z
// que lleva el puño a z=±zt; r = giro del mango desde neutro (90 supino, -90 prono). Devuelve el puño
const arm=(b,s,a,ab,fl,zt,r)=>{const k=K.sd(s),u=V.norm([Math.sin(a*D),-Math.cos(a*D),k*ab]),el=V.madd(b.sho(s),u,DM.ua),
  fz=K.clamp((k*zt-el[2])/AL,-.8,.8),q=Math.sqrt(1-fz*fz),ph=(a+fl)*D,f=[q*Math.sin(ph),-q*Math.cos(ph),fz];
  b.armDir(s,u,f,V.rot(V.norm(V.cross(Z,f)),f,k*(r||0)*D));return b.j(s,'grip');};
const gax=(b,s)=>b.S[s].gripAx;
const ST=(b,o)=>K.stand(b,Object.assign({fz:.12,toe:8,kf:5,tilt:1,sp:[-2],hd:4,sc:[-.012,-.015]},o));
const SH=(E,x)=>E.shadow([x||0,0,0],.45,.32,.55);
const DB=(E,g,ax,tr)=>{E.dumbbell(g,ax,{r:.052,hl:.05});if(tr)E.trace('mancuerna',g);};
// curl de pie con codos pegados: lo = flexión abajo, hi = arriba, zt = semiancho del agarre, r = giro del mango, z1 = semiancho arriba
const SC=(b,p,lo,hi,zt,r,ab,z1)=>{ST(b);return SS.map(([s])=>arm(b,s,mix(3,10,p*p),ab||.1,mix(lo,hi,p),mix(zt,z1||zt,p),r));};
// torre de polea con pila detrás: raíl en R=[x,z], f = dirección torre→persona, polea a la altura py; g = clip o puño (ax: maneral en D en g), g0 = en reposo
const tower=(E,R,f,py,g,g0,ax)=>{const s=[-f[2],0,f[0]],P=(a,y,c)=>[R[0]+f[0]*a+s[0]*c,y,R[1]+f[2]*a+s[2]*c],yw=Math.atan2(-f[2],f[0])/D,T=2.05,B=-.36,Q=P(.09,py,0);
  let cl=g;if(ax){cl=V.madd(g,V.norm(V.perp(V.sub(Q,g),ax)),.075);E.handle(g,ax);for(const k of[-1,1])E.line(V.madd(g,ax,k*.06),cl,.006,'#1b1e22');E.sph(cl,.009,C.chrome);}
  const d=V.norm(V.sub(cl,Q));E.beam(P(0,0,0),P(0,T,0),.08,C.frame);E.boxA(P(.045,py,0),[.05,.15,.12],C.frameD,{yaw:yw});
  E.pulley(Q,V.norm(V.cross(d,f)),.04);E.cable(V.madd(Q,d,.04),cl);
  for(const k of[-1,1]){E.beam(P(B,0,k*.22),P(B,T,k*.22),.06,C.frame,{bias:.2});E.beam(P(B,.03,k*.3),P(B,.03,-k*.3),.08,C.frameD,{layer:-1});}
  E.beam(P(.04,T,0),P(B-.04,T,0),.07,C.frame);E.beam(P(.18,.03,0),P(B-.12,.03,0),.08,C.frameD,{layer:-1});
  const top=E.stack(P(B,0,0),{h:1.6,lift:V.dist(Q,g)-V.dist(Q,g0)+.03,n:14,sel:5,yaw:yw,w:.26,bias:.25});
  E.pulley(P(B,T-.07,0),s,.04);E.cable(P(0,T-.03,0),P(B,T-.03,0));E.cable(P(B,T-.07,0),V.add(top,[0,.02,0]));};
// barra Z por la curva (agarre estrecho) entre los puños G
const EZ=(b,E,G)=>{const ax=V.norm(V.sub(G[0],G[1])),bend=V.norm(V.cross(ax,V.sub(G[0],b.j('R','elb')))),ez=K.ezbar(E,V.madd(V.lerp(G[0],G[1],.5),bend,-.017),ax,{bend});
  SS.forEach(([s],i)=>b.S[s].gripAx=ez.axes.narrow[i]);E.trace('barra',ez.grips.narrow[0]);};

// ═══ CURL CON BARRA ═══ de pie, agarre supino a la anchura de los hombros, codos pegados (húmero casi vertical, deriva 3→10°),
// abajo 20° de antebrazo (la barra queda delante de los muslos), arriba ~140°; 1,2 s sube · aprieta · 2,6 s baja
GA.def('lib_curl_bb',{title:'Curl con barra',cam:{yaw:36,pitch:8},muscles:{biceps:1,forearms:.4},labels:[BI,FA],init:I0,o:{r:90,hi:140},
  timeline:TL(1.2,'Sube sin balancear',.6,'Aprieta arriba',2.6,'Baja en 2-3 s',.4,'Abajo · brazos estirados'),
  build(c,b,E){const G=SC(b,c.p,20,this.o.hi,.2,this.o.r),m=V.lerp(G[0],G[1],.5);K.barbell(E,m,Z,{len:1.5,inner:.5,plates:[.15,.115]});E.trace('barra',G[0]);SH(E);}});
// ═══ CURL INVERSO CON BARRA ═══ igual con agarre prono y muñecas rectas; arriba ~125°, baja en 3 s
GA.alias('lib_reverse_curl_bb','lib_curl_bb',{title:'Curl inverso con barra',muscles:{forearms:1,biceps:.7},labels:[FA,BR,BI],o:{r:-90,hi:125},
  timeline:TL(1.2,'Sube · muñecas rectas',.5,'Aprieta arriba',3,'Baja lento',.4,'Abajo · codos fijos')});

// ═══ CURL CON BARRA Z ═══ agarre estrecho por la curva (supinación parcial), codos fijos; abajo 22° (eje delante de los muslos)
GA.def('lib_curl_ez',{title:'Curl con barra Z',cam:{yaw:38,pitch:8},muscles:{biceps:1,forearms:.45},labels:[BI,FA],init:I0,
  timeline:TL(1.2,'Sube · codos fijos',.6,'Aprieta arriba',2.6,'Baja controlando',.4,'Abajo · sin balanceo'),
  build(c,b,E){EZ(b,E,SC(b,c.p,22,140,.1475,60,.07));SH(E);}});

// ═══ CURL INVERSO CON MANCUERNAS ═══ agarre prono, codos pegados, muñecas rectas; brazos algo separados (mancuernas junto a los muslos)
GA.def('lib_reverse_curl_db',{title:'Curl inverso con mancuernas',cam:{yaw:40,pitch:8},muscles:{forearms:1,biceps:.7},labels:[FA,BR,BI],init:I0,
  timeline:TL(1.2,'Sube sin doblar muñecas',.5,'Aprieta arriba',3,'Baja lento',.4,'Abajo · codos pegados'),
  build(c,b,E){SC(b,c.p,16,125,.32,-90,.15,.26).forEach((g,i)=>DB(E,g,gax(b,SS[i][0]),!i));SH(E);}});

// ═══ CURL ZOTTMAN ═══ sube supino, arriba gira a prono (r), baja en prono 3 s, abajo vuelve a supino
GA.def('lib_zottman_curl_db',{title:'Curl Zottman con mancuernas',cam:{yaw:40,pitch:8},muscles:{biceps:1,forearms:.8},labels:[BI,FA],init:{p:0,r:1,act:.5},
  timeline:[{p:1,dur:1.2,label:'Sube con palmas arriba',act:1},{r:-1,dur:.6,label:'Arriba · gira a palmas abajo',act:1},
    {p:0,dur:3,label:'Baja lento en prono',act:.8},{r:1,dur:.6,label:'Abajo · gira a supino',act:.5}],
  build(c,b,E){SC(b,c.p,16,135,.32,90*c.r,.15,.26).forEach((g,i)=>DB(E,g,gax(b,SS[i][0]),!i));SH(E);}});

// ═══ CURL CON BANDA ═══ pisa la banda (tubo) con los pies a la anchura de cadera; asas en supino, codos pegados; la banda se estira y adelgaza
GA.def('lib_band_curl',{title:'Curl de bíceps con banda elástica',cam:{yaw:36,pitch:8},muscles:{biceps:1,forearms:.35},labels:[BI,FA],init:I0,
  timeline:TL(1.2,'Sube · codos pegados',.5,'Aprieta arriba',2.5,'Baja lento con tensión',.4,'Abajo · sin soltar'),
  build(c,b,E){SC(b,c.p,16,140,.21,90).forEach((g,i)=>{const k=SS[i][1];K.band(E,[[.08,.004,0],[.08,.004,k*.18],g],0,{handle:gax(b,SS[i][0]),col:K.BAND.green,L0:.7});});SH(E);}});

// ═══ CURL MARTILLO EN CABLE (CUERDA) ═══ frente a la polea baja, palmas enfrentadas, codos pegados; arriba separa la cuerda
GA.def('lib_hammer_curl_cable',{title:'Curl martillo en cable',cam:{yaw:22,pitch:10},fitBox:[[-.3,0,-.45],[.95,1.8,.45]],muscles:{biceps:1,forearms:.7},labels:[BI,BR,FA],init:I0,
  timeline:TL(1.2,'Sube · codos pegados',.6,'Separa la cuerda arriba',3,'Baja en 3 s',.4,'Abajo · mantén tensión'),
  build(c,b,E){const Q=[.41,.17,0],pose=q=>{const G=SC(b,q,22,132,mix(.15,.18,sst(.55,1,q)),0),m=V.lerp(G[0],G[1],.5),hw=V.dist(G[0],G[1])/2;
      return[G,V.madd(m,V.norm(V.sub(Q,m)),Math.sqrt(.09-hw*hw))];};
    const g0=K.memo(this,'g0',()=>pose(0)[1]),[G,cl]=pose(c.p);SS.forEach(([s],i)=>b.S[s].gripAx=V.sub(G[i],cl));
    E.rope(cl,G[0],G[1]);tower(E,[.5,0],[-1,0,0],.17,cl,g0);E.trace('cuerda',G[0]);SH(E);}});

// ═══ CURL A UNA MANO EN CABLE ═══ polea baja alineada con el brazo derecho, codo fijo al costado; sube de neutro a supino
GA.def('lib_curl_cable_one_arm',{title:'Curl a una mano en cable',cam:{yaw:16,pitch:8},fitBox:[[-.3,0,-.45],[.95,1.8,.5]],muscles:{biceps_R:1,forearms_R:.35},labels:[BI,FA],init:I0,
  timeline:TL(1.2,'Sube girando la palma',.6,'Aprieta arriba',3,'Baja en 3 s',.4,'Abajo · brazo largo'),
  build(c,b,E){const pose=q=>{ST(b);b.armFK('L',{abd:7,elbow:10,rot:5});return arm(b,'R',mix(3,10,q*q),.1,mix(15,140,q),.2,mix(0,90,sst(.05,.8,q)));};
    const g0=K.memo(this,'g0',()=>pose(0)),g=pose(c.p);tower(E,[.5,.2],[-1,0,0],.17,g,g0,gax(b,'R'));E.trace('maneral',g);SH(E);}});

// ═══ CURL BAYESIANO EN CABLE ═══ de espaldas a la polea baja, zancada corta (izq. delante), húmero derecho ~24° detrás del tronco y fijo;
// del brazo estirado (bíceps en estiramiento) a ~135°
GA.def('lib_bayesian_curl_cable',{title:'Curl bayesiano en cable',cam:{yaw:24,pitch:8},fitBox:[[-.98,0,-.45],[.42,1.85,.5]],muscles:{biceps_R:1,forearms_R:.3},labels:[BI,FA],init:I0,
  timeline:TL(1.2,'Sube · codo atrás fijo',.6,'Aprieta arriba',3,'Baja y estira el bíceps',.5,'Abajo · brazo atrás'),
  build(c,b,E){const pose=q=>{ST(b,{feet:{R:[-.27,.13],L:[.1,-.1]},tilt:5,hd:2});b.armFK('L',{flex:6,abd:6,elbow:14});return arm(b,'R',-24,.12,mix(4,140,q),.27,90);};
    const g0=K.memo(this,'g0',()=>pose(0)),g=pose(c.p);tower(E,[-.6,.25],X,.3,g,g0,gax(b,'R'));E.trace('maneral',g);SH(E,-.05);}});

// ═══ CURL ALTO EN CABLE ═══ entre dos poleas altas, brazos en cruz a la altura del hombro (supino), codos fijos; manos a la cabeza
GA.def('lib_curl_cable_high',{title:'Curl alto en cable',cam:{yaw:62,pitch:6},fitBox:[[-.4,0,-1.05],[.45,1.92,1.05]],muscles:{biceps:1,forearms:.25},labels:[BI,FA],init:I0,
  timeline:TL(1.2,'Manos a la cabeza',.8,'Aprieta · codos altos',2.8,'Abre lento',.4,'Brazos en cruz'),
  build(c,b,E){const pose=q=>{ST(b,{fz:.14,sc:[0,-.01]});return SS.map(([s,k])=>{const u=V.norm([.18,.1,k]),h=V.norm(V.perp(UP,u)),a=mix(15,128,q)*D;
      b.armDir(s,u,V.add(V.mul(u,Math.cos(a)),V.mul(h,Math.sin(a))),V.cross(u,h));return b.j(s,'grip');});};
    const g0=K.memo(this,'g0',()=>pose(0)),G=pose(c.p);SS.forEach(([s,k],i)=>tower(E,[.05,k*1.25],[0,0,-k],1.75,G[i],g0[i],gax(b,s)));E.trace('maneral',G[0]);SH(E);}});

// ═══ PREDICADOR (banco Scott) ═══ sentado, axilas en el borde del cojín a 45°, cara posterior de los brazos apoyada; de ~15° a ~118°
// z0: desplazamiento lateral del cuerpo y del banco (a una mano el cojín queda desplazado bajo el brazo derecho y el izquierdo cuelga fuera)
// asiento bajo (muslos casi horizontales) que acaba 2 cm delante de la cadera: sólo apoyan los glúteos
const scott=(b,E,z0)=>{const u=[.7071,-.7071,0],n=[.7071,.7071,0],SY=.48,F=(x,y,z)=>[x,y,z0+z];
  K.seat(b,[-.1,SY,z0],{tilt:14,sp:[6],hd:-8,sc:[0,.03],legs:false});for(const[s,k]of SS){b.footFlat(s,[.36,0,z0+k*.16],-k*8);}K.legs(b,{up:.6,out:.1});
  // cojín: su cara superior pasa .047 bajo el eje del húmero; empieza donde ese plano sale del tórax (axila) y acaba 12 cm tras el codo
  const A=V.madd(b.sho('R'),n,-.047),e=K.ells(b).tho;A[2]=z0;const T=V.madd(A,u,.01+K.root(t=>{const d=V.sub(V.madd(A,u,t),e[0]);return e[1].reduce((s,a)=>s+(V.dot(d,a)/V.dot(a,a))**2,0)-1;},0,.3));
  const B=V.madd(A,u,.42);T[2]=B[2]=0;const R=V.add(V.madd(T,u,.04),V.mul(n,-.036));
  E.pad(V.madd(T,n,-.04),V.madd(B,n,-.04),.5,.08,C.pad,{up:n,bias:.05});E.cyl(V.add(R,[0,0,-.25]),V.add(R,[0,0,.25]),.038,C.pad,{bias:.05});
  const pc=V.madd(V.lerp(T,B,.5),n,-.08);pc[2]=z0;E.beam(pc,F(pc[0]-.04,0,0),.07,C.frame,{layer:-1});E.beam(F(-.2,0,0),F(-.2,SY-.08,0),.07,C.frame,{layer:-1});
  E.pad(F(-.36,SY-.04,0),F(-.08,SY-.04,0),.34,.08,C.pad,{layer:-1});E.beam(F(-.4,.03,0),F(.76,.03,0),.08,C.frameD,{layer:-1});for(const x of[-.35,.72])E.beam(F(x,.03,-.35),F(x,.03,.35),.07,C.frameD,{layer:-1});};
const PTL=TL(1.3,'Sube sin despegar los codos',.6,'Aprieta arriba',3,'Baja lento sin bloquear',.4,'Abajo · casi estirado');
// ═══ CURL PREDICADOR CON BARRA Z ═══
GA.def('lib_preacher_curl_ez',{title:'Curl predicador con barra Z',cam:{yaw:60,pitch:14},fitBox:[[-.45,0,-.55],[.85,1.4,.55]],muscles:MB,labels:[BI,FA],init:I0,timeline:PTL,
  build(c,b,E){scott(b,E,0);EZ(b,E,SS.map(([s])=>arm(b,s,45,0,mix(15,118,c.p),.1475,60)));E.shadow([.15,0,0],.7,.45,.55);}});
// ═══ CURL PREDICADOR CON MANCUERNA ═══ brazo derecho en el cojín (cuerpo algo a la izquierda), brazo izquierdo relajado fuera del cojín
GA.def('lib_preacher_curl_db',{title:'Curl predicador con mancuerna',cam:{yaw:40,pitch:12},fitBox:[[-.45,0,-.6],[.85,1.4,.5]],muscles:{biceps_R:1,forearms_R:.3},labels:[BI,FA],init:I0,timeline:PTL,
  build(c,b,E){scott(b,E,-.12);b.armFK('L',{flex:4,abd:10,elbow:12});DB(E,arm(b,'R',45,0,mix(15,120,c.p),.07,90),gax(b,'R'),1);E.shadow([.15,0,0],.7,.45,.55);}});

// ═══ CURL INCLINADO CON MANCUERNAS ═══ banco a 45°, espalda y cabeza apoyadas, brazos colgando por detrás del tronco (húmero vertical fijo)
const recl=(b,bn,t,h)=>{b.pelvis([0,0,0],{tilt:t});K.trunk(b,{sp:[-4],hd:h,sc:[-.01,-.02]});const gS=K.low(b,['pel','gluR','gluL'],bn.hinge,UP),gB=K.low(b,['tho','shd'],bn.hinge,bn.n),dy=-gS;
  K.shift(b,[(-gB-bn.n[1]*dy)/bn.n[0],dy,0]);return K.low(b,['pel','lum'],bn.hinge,bn.n);};
GA.def('lib_curl_incline_db',{title:'Curl inclinado con mancuernas',cam:{yaw:58,pitch:20},muscles:MB,labels:[BI,FA],init:I0,
  timeline:TL(1.3,'Sube sin adelantar codos',.5,'Aprieta arriba',3,'Baja y estira completo',.5,'Abajo · brazos colgando'),
  build(c,b,E){const p=c.p,bn=E.bench({at:[0,0,0],dir:0,h:.45,seat:.42,back:.85,inc:45}),k=K.memo(this,'k',()=>{const t=K.root(t=>recl(b,bn,t,0),-60,-15);recl(b,bn,t,0);return[t,K.root(h=>{b.head(h);return K.low(b,K.HEAD,bn.hinge,bn.n)-.003;},-40,20)];});recl(b,bn,...k);
    const hp=b.pf.o;for(const[s,k]of SS){b.footFlat(s,[hp[0]+.5,0,k*.2],-k*10);b.leg(s,null,[1,.5,k*.3]);DB(E,arm(b,s,mix(0,4,p*p),.14,mix(6,135,p),.31,90),gax(b,s),k>0);}
    E.shadow([.1,0,0],.8,.4,.55);}});

// ═══ CURL ARAÑA ═══ pecho apoyado en el banco a 45° (cara al cojín), de puntillas detrás (piernas en línea con el tronco); brazos verticales fuera del cojín, codos fijos
GA.def('lib_spider_curl_db',{title:'Curl araña con mancuernas',cam:{yaw:40,pitch:10},muscles:MB,labels:[BI,FA],init:I0,
  timeline:TL(1.2,'Sube sin mover los codos',.8,'Aprieta arriba',2.6,'Baja controlando',.4,'Abajo · brazos colgando'),
  build(c,b,E){const p=c.p,BL=.82,bn=E.bench({at:[0,0,0],dir:180,h:.45,seat:0,back:BL,inc:45});
    b.pelvis([0,0,0],{tilt:45});K.trunk(b,{sp:[2],hd:-28,sc:[.01,.025]});K.rest(b,['tho','pel','lum'],bn.hinge,bn.n);
    K.shift(b,V.mul(bn.bd,BL-.02-V.dot(V.sub(V.lerp(b.sho('R'),b.sho('L'),.5),bn.hinge),bn.bd)));
    const d=K.legD(14);for(const[s,k]of SS){const f=x=>K.footBallOn(b,s,[x,0,k*.13],-k*6,45),a=f(0),h=b.hip(s);f(h[0]-Math.sqrt(d*d-(h[1]-a[1])**2-(h[2]-a[2])**2)-a[0]);b.leg(s,null,[1,.2,k*.15]);}
    for(const[s,k]of SS)DB(E,arm(b,s,0,.1,mix(8,132,p),.24,90),gax(b,s),k>0);E.shadow([.1,0,0],.75,.4,.55);}});

// ═══ CURL EN TRX ═══ de frente al anclaje, cuerpo rígido inclinado atrás sobre los talones, palmas arriba; el húmero se mantiene ~90°
// respecto al tronco (codos altos) y el codo flexiona hasta llevar las manos a la frente: el cuerpo sube (inclinación resuelta por fotograma
// para que las correas midan siempre lo mismo). El punto de apoyo del talón queda fijo en x=-.012 (lx = x del punto más bajo de la zapatilla)
const lx=(f,u)=>{let m=null;for(const[c,A]of K.shoe([0,0,0],f,u)){const s=Math.hypot(...A.map(a=>a[1])),y=c[1]-s;if(!m||y<m[1])m=[c[0]-A.reduce((t,a)=>t+a[0]*a[1]/s,0),y];}return m[0];};
GA.def('lib_trx_curl',{title:'Curl de bíceps en TRX',cam:{yaw:20,pitch:6},fitBox:[[-1.05,0,-.45],[.45,1.95,.45]],muscles:{biceps:1,forearms:.35},labels:[BI,FA],init:I0,
  timeline:TL(1.3,'Manos a la frente',.6,'Aprieta · codos altos',2.6,'Baja lento',.4,'Abajo · brazos largos'),
  build(c,b,E){const LL=Math.sqrt(K.legD(3)**2-(.12-DM.hipW)**2),M=G=>V.lerp(G[0],G[1],.5);let G;
    const pose=(th,q)=>{const r=th*D,f=[Math.cos(r),Math.sin(r),0],u=[-Math.sin(r),Math.cos(r),0],x=-.012-lx(f,u);for(const[s,k]of SS)K.footOn(b,s,[x,0,k*.12],f,u);
      b.pelvis(V.madd(V.lerp(b.j('R','ank'),b.j('L','ank'),.5),u,LL),{tilt:-th});K.trunk(b,{sp:[-2],hd:2,sc:[0,mix(.03,0,q)]});K.legs(b,{up:0});
      return G=SS.map(([s])=>arm(b,s,mix(92,88,q)+th,.06,mix(6,132,q),mix(.2,.14,q),90));};
    // anclaje en la línea de los brazos estirados con 38° de inclinación; correas de 1,4 m (arriba queda a ~17°)
    const k=K.memo(this,'k',()=>{const H0=M(pose(38,0));return{A:V.madd(H0,V.norm(V.sub(H0,V.lerp(b.sho('R'),b.sho('L'),.5))),1.4),L:1.4};});
    const th=K.root(t=>V.dist(k.A,M(pose(t,c.p)))-k.L,5,60);b.ikErr=0;pose(th,c.p);
    K.trx(E,k.A,G[0],G[1],{ax:[gax(b,'R'),gax(b,'L')]});E.trace('asa',G[0]);E.shadow([-.3,0,0],.7,.35,.55);}});
})(window.GymAnim);
