/* Pliometría, comba, slam, cuerdas de batalla, trineo y paseos con carga */
(function(GA){
const K=GA._.kit,V=GA._.V,C=GA._.COL,DM=GA._.DIM,SS=K.SS,mix=K.mix,sst=K.sst,PI=Math.PI,TAU=2*PI,sin=Math.sin,cos=Math.cos;
// de pie sobre los metatarsos: x,y,z,fz,toe,hl (talón arriba °) | feet:{R:[x,y,z,yaw,hl]}; kf rodilla (piernas de o.sup), tl; CdM en bx
const ST=(b,o)=>{const FT=[],Y=o.y||0,X=o.x==null?.15:o.x,Z=o.z||0,F=o.feet,sup=o.sup||'RL';let bx=0;
 for(const[s,k]of SS){const f=F?F[s]:[X,Y,Z+k*(o.fz||.13),-k*(o.toe==null?10:o.toe),o.hl||0];FT.push([s,f]);K.footBallOn(b,s,[f[0],f[1],f[2]],f[3],f[4]);bx+=(f[0]+mix(-.1,-.01,sst(0,25,f[4])))/2;}
 const A={R:b.j('R','ank').slice(),L:b.j('L','ank').slice()},d=K.legD(o.kf==null?4:o.kf);
 const pose=hx=>{const hy=o.hy!=null?o.hy:Math.min(...SS.filter(([s])=>sup.includes(s)).map(([s,k])=>A[s][1]+Math.sqrt(Math.max(.01,d*d-(hx-A[s][0])**2-(A[s][2]-k*DM.hipW-Z)**2))));
  b.pelvis([hx,hy,Z],{tilt:o.tl||0,roll:o.rl||0,yaw:o.yw||0});K.trunk(b,o);for(const[s,f]of FT)K.footBallOn(b,s,[f[0],f[1],f[2]],f[3],f[4]);K.legs(b,o.pole);if(o.arms)o.arms(b);};
 if(o.bx!=null)bx=o.bx;const e0=b.ikErr,hx=K.root(x=>{pose(x);return K.com(b,o.xm&&o.xm())[0]-bx;},bx-.7,bx+.45);
 b.ikErr=e0;pose(hx);return hx;};
// brazos: a -1 atrás · 0 abajo · 1 arriba (sin quiebro en 0) · HM: canal k por Hermite monótono entre pasos (velocidad continua: brazos y tronco sin latigazo al despegar)
const AR=(b,a,e,ab)=>{for(const[s]of SS)b.armFK(s,{flex:100*a+50*a*a,abd:ab==null?10:ab,elbow:e==null?15:e,rot:5});};
const HM=(c,sp,k)=>{const S=sp._tl.steps,n=S.length,i=c.stepIdx,t=S[i],u=c.u,d=t.dur,sl=j=>{const s=S[(j+n)%n];return(s.to[k]-s.from[k])/s.dur;},m=j=>{const p=sl(j-1),q=sl(j);return p*q>0?2*p*q/(p+q)*d:0;};
 return(1-u*u*(3-2*u))*t.from[k]+u*u*(3-2*u)*t.to[k]+u*(1-u)*((1-u)*m(i)-u*m(i+1));};
const X=(dur,label,act,o)=>Object.assign({dur,label,act},o);
// vuelo: progreso lineal (0 despegue · .5 ápice · 1 contacto) en los pasos que suben / bajan p → altura parabólica
const FL=(c,k)=>{const s=c.step,a=s.from[k=k||'p'],z=s.to[k];return z>a?.5*c.u:z<a?.5+.5*c.u:0;},HOP=(c,H,k)=>{const f=FL(c,k);return 4*H*f*(1-f);};
// rodillas al pecho (t 0-1): tobillos hacia un punto delante de la pelvis
const TUCK=(b,t)=>{if(t<.002)return;for(const[s,k]of SS){const S=b.S[s];
 b.foot(s,V.lerp(S.ank,b.ppt(k*.11,-.2,.23),t),V.lerp(S.ffwd,b.pdir(0,-.85,1),t),V.lerp(S.fup,b.pdir(0,1,.85),t));b.leg(s,null,b.pdir(0,.5,1));}};
const SH=(E,x,z,a)=>E.shadow([x,0,z||0],.4,.3,a==null?.55:a);
const JT=(l1,l2)=>[X(.2,l1,1,{p:1,a:1,ease:'lin'}),X(.2,l2,.85,{p:0,h:.4,a:.3,ease:'lin'})];

// ═══ SENTADILLA CON SALTO ═══ q media sentadilla, h talones, a brazos; vuelo de .4 s (≈20 cm)
GA.def('lib_jump_squat',{
  title:'Sentadilla con salto',cam:{yaw:30,pitch:8},fitBox:[[-.45,0,-.35],[.55,2.2,.35]],
  muscles:{quads:1,glutes:.8,calves:.6,hams:.3},labels:['Cuádriceps','Glúteos','Gemelos'],init:{p:0,q:0,h:0,a:0,act:.5},
  timeline:[X(.55,'Baja a media sentadilla',.8,{q:1,a:-1}),X(.25,'Salta explosivo',1,{q:0,h:1,a:.5,ease:'in'}),
   ...JT('Arriba · cuerpo estirado','Cae en puntas'),X(.25,'Aterriza suave',.85,{q:.5,h:0,a:0,ease:'out'}),X(.45,'De pie',.5,{q:0})],
  build(c,b,E){const y=HOP(c,.2),q=HM(c,this,'q');ST(b,{y,fz:.14,hl:38*c.h*c.h,kf:mix(5,92,c.q),tl:mix(3,40,q),sp:[mix(-2,6,q)],hd:-mix(2,30,q),arms:b=>AR(b,HM(c,this,'a'))});
   SH(E,.05,0,.55-y);}
});

// ═══ SALTOS CON RODILLAS AL PECHO ═══ rebote encadenado; vuelo .52 s (≈33 cm) con rodillas al pecho en el ápice
GA.def('lib_tuck_jump',{
  title:'Saltos con rodillas al pecho',cam:{yaw:30,pitch:8},fitBox:[[-.45,0,-.35],[.6,2.25,.35]],
  muscles:{quads:1,glutes:.7,calves:.6,abs:.4},labels:['Cuádriceps','Glúteos','Abdomen'],init:{p:0,q:.5,h:0,a:-.8,act:.85},
  timeline:[X(.17,'Salta vertical',1,{q:0,h:1,a:.4,ease:'in'}),X(.26,'Rodillas al pecho',1,{p:1,a:.7,ease:'lin'}),
   X(.26,'Estira y cae en puntas',.8,{p:0,h:.4,a:0,ease:'lin'}),X(.3,'Amortigua y repite',.85,{q:.5,h:0,a:-.8,ease:'out'})],
  build(c,b,E){const f=FL(c),y=HOP(c,.33),q=HM(c,this,'q');ST(b,{y,fz:.14,hl:38*c.h*c.h,kf:mix(5,70,c.q),tl:mix(4,30,q)+8*sin(PI*f),sp:[mix(0,8,q)+10*sin(PI*f)],hd:-mix(4,22,q),
   arms:b=>AR(b,HM(c,this,'a'),15+40*sin(PI*f))});TUCK(b,sst(.12,.5,f)*(1-sst(.5,.88,f)));SH(E,.05,0,.55-y);}
});

// ═══ SALTO AL CAJÓN ═══ p 0 suelo → 1 sobre el cajón (m 0 saltando · 1 bajando a pie, primero la pierna derecha)
const BXH=.5,BX0=.04,BX1=.66;
GA.def('lib_box_jump',{
  title:'Salto al cajón',cam:{yaw:28,pitch:9},
  muscles:{quads:1,glutes:.8,calves:.6,hams:.3},labels:['Cuádriceps','Glúteos','Gemelos'],init:{p:0,q:0,h:0,a:0,m:0,act:.5},
  timeline:[X(.6,'Brazos atrás · carga',.8,{q:1,a:-1}),X(.25,'Impulsa con los brazos',1,{q:0,h:1,a:.5,ease:'in'}),
   X(.38,'Vuela al cajón',1,{p:1,q:.7,h:.25,a:.8,ease:'lin'}),X(.24,'Aterriza suave',.85,{q:.85,h:0,a:.2,ease:'out'}),
   X(.6,'De pie sobre el cajón',.6,{q:0,a:0}),X(.3,'Cadera extendida',.5,{m:1}),X(1.6,'Baja caminando',.5,{p:0,ease:'sin'}),X(.4,'Prepárate',.5,{m:0})],
  build(c,b,E){const p=c.p;K.box(E,[.63,0,0],[.5,BXH,.6]);
   if(c.m<.5){const x=mix(BX0,BX1,sst(0,1,p)),y=BXH*sst(0,.7,p)+.2*sin(PI*p),q=HM(c,this,'q');
    ST(b,{x,y,fz:.14,hl:38*c.h*c.h,kf:mix(5,88,c.q),tl:mix(3,42,q),sp:[mix(-2,6,q)],hd:-mix(4,30,q),arms:b=>AR(b,HM(c,this,'a'))});}
   else{const u=1-p,ft=(r,k)=>[mix(BX1,BX0,sst(0,.6,r)),BXH*(1-sst(.35,1,r))+.05*sin(PI*r),k*.14,-k*10,20*sin(PI*r)],R=ft(sst(0,.5,u),1),L=ft(sst(.5,1,u),-1);
    ST(b,{feet:{R,L},kf:5,bx:mix(L[0],R[0],sst(.3,.75,u))-.1,tl:3,sp:[-2],hd:-4,arms:b=>AR(b,.06*sin(TAU*u))});}
   SH(E,BX0,0,.55*(1-p));}
});

// ═══ JUMPING JACKS ═══ p 0 cerrado → 1 abierto (brazos arriba); salto corto de puntas a cada lado
GA.def('lib_jumping_jack',{
  title:'Jumping jacks',cam:{yaw:62,pitch:8},
  muscles:{calves:1,quads:.5,abductors:.4,sidedelts:.35},labels:['Gemelos','Cuádriceps','Glúteo medio'],init:{p:0,act:.7},
  timeline:[X(.4,'Abre piernas y brazos',.8,{p:1}),X(.4,'Vuelve al centro',.8,{p:0})],
  build(c,b,E){const p=c.p,j=4*p*(1-p);ST(b,{y:.06*j,fz:mix(.1,.38,p),toe:mix(6,16,p),hl:12+18*j,kf:mix(14,5,j),tl:4,hd:-3,sc:[.025*p,0],
   arms:b=>{for(const[s]of SS)b.armFK(s,{abd:mix(8,188,p),flex:4,elbow:mix(10,18,j),rot:mix(0,-50,p)});}});SH(E,.05,0,.55-.06*j);}
});

// ═══ ZANCADA CON SALTO ═══ s 1 derecha delante → -1 izquierda delante (cambio en el aire), p profundidad, f vuelo
const JLT=k=>[X(.22,'Salta explosivo',1,{p:0,h:1,ease:'in'}),X(.19,'Cambia de pierna en el aire',1,{f:1,s:k*.5,ease:'lin'}),
 X(.19,'Cae en zancada',.85,{f:0,s:-k,h:.3,ease:'lin'}),X(.35,'Aterriza suave · rodilla alineada',.9,{p:1,h:0,ease:'out'}),X(.1,'Abajo · torso erguido',.9)];
GA.def('lib_jump_lunge',{
  title:'Zancada con salto',cam:{yaw:32,pitch:8},fitBox:[[-.6,0,-.3],[.65,1.95,.3]],
  muscles:{quads:1,glutes:.8,calves:.5,hams:.3},labels:['Cuádriceps','Glúteos','Gemelos'],init:{p:1,f:0,s:1,h:0,act:.9},
  timeline:[...JLT(1),...JLT(-1)],
  build(c,b,E){const y=HOP(c,.18,'f'),ft=(t,k)=>[mix(-.42,.48,t),y+.14*sin(PI*t),k*.11,-k*4,mix(48,28*c.h*c.h,t)];
   ST(b,{feet:{R:ft(sst(0,1,(c.s+1)/2),1),L:ft(sst(0,1,(1-c.s)/2),-1)},kf:mix(8,94,c.p),bx:-.02,tl:6,sp:[-2],hd:-4,
    arms:b=>{for(const[s,k]of SS)b.armFK(s,{flex:-k*c.s*32+5,abd:8,elbow:75,rot:5});}});SH(E,0,0,.55-y);}
});

// ═══ SALTOS DE PATINADOR ═══ s ±1 lado de apoyo (vuelo lateral), p carga sobre la pierna de apoyo con la otra cruzada detrás
const SKP=(k,p)=>({s:[.12,0,k*.5,-k*12,0],x:[mix(-.3,-.36,p),mix(.04,.06,p),k*.62,-k*20,mix(45,55,p)]});
const SKT=(k,l)=>[X(.18,'Impulsa de lado',1,{p:0,ease:'in'}),X(.36,'Salta '+l,1,{s:-k,ease:'lin'}),X(.32,'Cae en una pierna · cadera atrás',.9,{p:1,ease:'out'}),X(.14,'Frena · pierna cruzada detrás',.9)];
GA.def('lib_skater_jump',{
  title:'Saltos de patinador',cam:{yaw:45,pitch:12},
  muscles:{glutes:1,quads:.8,abductors:.5,calves:.4},labels:['Glúteos','Cuádriceps','Glúteo medio'],init:{p:1,s:1,act:.9},
  timeline:[...SKT(1,'a la izquierda'),...SKT(-1,'a la derecha')],
  build(c,b,E){const st=c.step,fs=st.from.s,ts=st.to.s,p=c.p;let F={},Z,kS,y=0;
   if(fs!==ts){const kA=Math.sign(fs),w=(fs-c.s)/(fs-ts),A=SKP(kA,0),N=SKP(-kA,0),sA=kA>0?'R':'L',sN=kA>0?'L':'R',q=(a,b,t)=>a.map((v,i)=>mix(v,b[i],t));y=.12*4*w*(1-w);
    const lx=sst(0,.7,w),lz=sst(0,.75,w),tx=sst(.1,.8,w),tz=sst(.25,1,w),L=q(A.x,N.s,lz),T=q(A.s,N.x,tz);
    L[0]=mix(A.x[0],N.s[0],lx);T[0]=mix(A.s[0],N.x[0],tx);L[1]+=y;T[1]+=y;F[sN]=L;F[sA]=T;Z=mix(kA,-kA,w)*.42;kS=w<.5?kA:-kA;}
   else{kS=Math.sign(c.s);const P=SKP(kS,p);F[kS>0?'R':'L']=P.s;F[kS>0?'L':'R']=P.x;Z=kS*.42;}
   const sS=kS>0?'R':'L';
   ST(b,{feet:F,z:Z,sup:fs!==ts?'RL':sS,kf:mix(10,70,p),tl:mix(14,42,p),rl:-kS*4*p,sp:[2,kS*4*p],hd:-mix(10,26,p),bx:.04,
    arms:b=>{for(const[s,k]of SS){const f=k*c.s;b.armFK(s,{flex:mix(55,-30,(f+1)/2),hz:mix(30,0,(f+1)/2),abd:12,elbow:40});}}});
   SH(E,.05,Z,.55-y);}
});

// ═══ CARRERA EN EL SITIO ═══ apoyo de puntas 40 % (centrado en .5 para R), vuelo con muslo a th° y rodilla a kn°
const RUN=(c,b,E,th,kn)=>{const cy=c.cyc,BX=.1;b.pelvis([BX-.08,.935-.018*cos(4*PI*(cy-.5)),0],{tilt:4,yaw:-5*cos(TAU*cy)});b.spine(0,0,6*cos(TAU*cy));b.head(-4);b.scap('both',0,0);
 for(const[s,k,o]of[['R',1,0],['L',-1,.5]]){const u=(cy+o)%1,z=k*.11;
  if(u>=.3&&u<.7){const v=(u-.3)/.4;K.footBallOn(b,s,[BX,0,z],-k*4,12+16*(2*v-1)**2);b.leg(s,null,[1,.15,k*.05]);continue;}
  const v=((u-.7+1)%1)/.6,w=sst(0,.3,v)*(1-sst(.7,1,v)),g=sin(PI*v),a=th*Math.pow(g,1.2)*PI/180,q=a-(30+(kn-30)*Math.pow(g,.8))*PI/180;
  K.footBallOn(b,s,[BX,0,z],-k*4,28);const S=b.S[s],hp=b.hip(s),A=V.add(hp,[.44*sin(a)+.43*sin(q),-.44*cos(a)-.43*cos(q),0]),ft=[cos(q-.6),sin(q-.6),0];
  const P=V.lerp(S.ank,A,w),F=V.norm(V.lerp(S.ffwd,ft,w)),U=V.norm(V.perp(V.lerp(S.fup,[-sin(q-.6),cos(q-.6),0],w),F)),lo=Math.min(0,...K.shoe(P,F,U).map(e=>K.gap(e,[0,0,0],[0,1,0])));
  b.foot(s,V.add(P,[0,-lo,0]),F,U);b.leg(s,null,[1,.1,k*.05]);}
 for(const[s,k]of SS)b.armFK(s,{flex:-k*40*cos(TAU*cy)+8,abd:8,elbow:88,rot:5});E.shadow([BX-.05,0,0],.35,.25,.5);};
GA.def('lib_high_knees',{
  title:'Skipping (rodillas arriba)',cam:{yaw:30,pitch:8},cycle:{period:.6},
  muscles:{quads:1,calves:.6,abs:.4,glutes:.35},labels:['Cuádriceps','Gemelos','Abdomen'],note:'≈ 200 apoyos/min',
  init:{act:.8},timeline:[X(.6,'Rodillas a la cadera · en puntas',.8)],build(c,b,E){RUN(c,b,E,92,100);}
});
GA.def('lib_butt_kicks',{
  title:'Talones al glúteo',cam:{yaw:28,pitch:8},cycle:{period:.6},
  muscles:{hams:1,calves:.6,quads:.4,glutes:.3},labels:['Isquiotibiales','Gemelos','Cuádriceps'],note:'≈ 200 apoyos/min',
  init:{act:.8},timeline:[X(.6,'Talón al glúteo · rodilla abajo',.8)],build(c,b,E){RUN(c,b,E,10,155);}
});

// ═══ SALTOS DOBLES CON CUERDA ═══ 2 vueltas por salto: apoyo .17 s centrado en cyc 0, cuerda bajo los pies en .25 y .75
GA.def('lib_double_unders',{
  title:'Saltos dobles con cuerda',cam:{yaw:28,pitch:7},cycle:{period:.5},
  muscles:{calves:1,quads:.5,forearms:.4,glutes:.3,frontdelts:.3},labels:['Gemelos','Cuádriceps','Antebrazo'],note:'2 vueltas por salto',
  init:{act:.8},timeline:[X(.5,'Salto alto · gira con las muñecas',.8)],
  build(c,b,E){const cy=c.cyc,w=(cy-.17)/.66,fl=w>0&&w<1,y=fl?.53*w*(1-w):0,ph=(2*cy+.5)%1,H=[];
   const g=fl?0:sin(PI*(((cy+.17)%1)/.34));
   ST(b,{x:.12,y,fz:.1,toe:4,hl:mix(34,22,g),kf:8+22*g,tl:3,sp:[fl?4*sin(PI*w):0],hd:-3,sc:[-.01,0],
    arms:b=>{H.length=0;for(const[s,k]of SS){const a=TAU*(ph+.25),h=V.add(b.ppt(k*.27,.03,.1),[-.03*sin(a),-.03*cos(a),0]);b.arm(s,h,[-.5,-.4,k*.6],V.norm([.1,-1,k*.4]));H.push(h);}},bx:.1});
   K.jumpRope(E,H[0],H[1],ph,{ax:[V.norm([.1,-1,.4]),V.norm([.1,-1,-.4])]});SH(E,.05,0,.5-y);}
});

// ═══ SLAM CON BALÓN MEDICINAL ═══ p 0 balón arriba (brazos estirados) → 1 contra el suelo delante de los pies (sentadilla y bisagra)
GA.def('lib_mb_slam',{
  title:'Slam con balón medicinal',cam:{yaw:34,pitch:8},
  muscles:{abs:1,lats:.8,frontdelts:.4,triceps:.4,glutes:.4},labels:['Abdomen','Dorsales','Tríceps'],init:{p:0,act:.5},
  timeline:[X(.45,'Lánzalo con todo el cuerpo',1,{p:1,ease:'sin'}),X(.3,'Balón al suelo',.85),X(1,'Recógelo y súbelo',.7,{p:0}),X(.35,'Arriba · brazos estirados',.55)],
  build(c,b,E){const p=c.p,r=.13,B=[.37,r,0];let m=B;
   const pose=(kf,p)=>{const e=sst(0,1,p);ST(b,{fz:.17,toe:14,hl:12*(1-p)**2,kf,tl:mix(-4,50,sst(0,.9,p)),sp:[mix(-8,12,e)],hd:mix(-6,-30,e),sc:[mix(.03,0,p),.02],
    arms:b=>{const sm=V.lerp(b.sho('R'),b.sho('L'),.5),q=sst(.05,1,p);m=V.add(V.lerp(V.add(sm,[.06,.55,0]),B,q),[.28*sin(PI*q),0,0]);
     for(const[s,k]of SS)b.arm(s,V.madd(m,V.norm([-.15,.3,k]),r+.028),[-.3,-.4,k],[1,0,0]);},xm:()=>[[m,.13]]});};
   const kB=K.memo(this,'kB',()=>K.root(kf=>{pose(kf,1);return V.dist(b.sho('R'),b.j('R','grip'))-K.armD(14);},40,135));
   // suelta en u .53 del lanzamiento (≈12 m/s, la velocidad de las manos) y va en recta al suelo: impacta en u .65, antes que las manos
   const pr=.5-.5*cos(.53*PI),R0=K.memo(this,'R0',()=>(pose(mix(4,kB,sst(0,1,pr)),pr),m.slice()));
   b.ikErr=0;pose(mix(4,kB,sst(0,1,p)),p);const st=c.step,w=st.to.p>st.from.p?K.clamp((c.u-.53)/.12,0,1):0,bl=w>0?V.lerp(R0,B,w):m;
   K.medball(E,bl,r,{kind:'slam'});E.trace('balón',bl);SH(E,.05);}
});

// ═══ CUERDAS DE BATALLA ═══ anclaje a 3,4 m; mano y onda acopladas (K.ropeHand)
const RA=3.4,ROPE=(E,h,ph,o)=>{for(const[s,k]of SS)K.battleRope(E,[RA,.12,k*.1],h[s],ph[s],o);E.beam([RA+.07,0,0],[RA+.07,.5,0],.12,C.frameD);};
const RFB={cam:{yaw:34,pitch:10},fitBox:[[-.6,0,-.6],[1.5,1.75,.6]]};
GA.def('lib_battle_rope_waves',Object.assign({
  title:'Ondas con cuerdas de batalla',cycle:{period:.5},
  muscles:{frontdelts:1,sidedelts:.5,forearms:.5,abs:.5,biceps:.3},labels:['Deltoides anterior','Antebrazo','Abdomen'],note:'≈ 2 ondas/s por brazo',
  init:{act:.85},timeline:[X(.5,'Alterna rápido · semisentadilla',.85)],
  build(c,b,E){const h={},ph={R:c.cyc,L:(c.cyc+.5)%1};
   ST(b,{x:.05,fz:.21,toe:14,kf:44,tl:22,sp:[2],hd:-18,sc:[0,.02],arms:b=>{for(const[s,k]of SS){h[s]=V.add(b.ppt(k*.2,.14,.34),[0,K.ropeHand(ph[s],.2),0]);b.arm(s,h[s],[-.6,-.5,k*.7],[0,0,1]);}}});
   ROPE(E,h,ph,{amp:.2});SH(E,0,0);}
},RFB));
GA.def('lib_battle_rope_slams',Object.assign({
  title:'Golpes con cuerdas de batalla',
  muscles:{frontdelts:1,lats:.6,abs:.6,glutes:.4,forearms:.4},labels:['Deltoides anterior','Dorsales','Abdomen'],init:{p:0,act:.9},
  timeline:[X(.45,'Sube las cuerdas sobre la cabeza',.75,{p:1}),X(.33,'Golpea el suelo con fuerza',1,{p:0,ease:'sin'}),X(.17,'Cadera atrás · repite',.9)],
  build(c,b,E){const p=c.p,h={},ph=(c.t/this._tl.total+.15)%1;
   ST(b,{x:.05,fz:.2,toe:14,hl:10*p,kf:mix(52,10,p),tl:mix(40,2,p),sp:[mix(8,-4,p)],hd:mix(-30,-6,p),sc:[.03*p,.02],
    arms:b=>{for(const[s,k]of SS){b.armFK(s,{flex:mix(28,172,p),abd:mix(12,6,p),elbow:mix(20,12,p),rot:mix(0,-20,p)});h[s]=b.j(s,'grip');}}});
   ROPE(E,h,{R:ph,L:ph},{amp:.3,lam:2.2});SH(E,0,0);}
},RFB,{fitBox:[[-.5,0,-.45],[1.15,2.2,.45]]}));

// ═══ MARCHA EN EL SITIO ═══ el suelo se desplaza a v (marcas); talón → planta → punta, o sólo metatarsos (o.ball). back = hacia atrás
const FLOOR=(E,x,S)=>{const o=((x%S)+S)%S;for(let i=-5;i<=6;i++){const X=i*S-o;E.line([X,.002,-.45],[X,.002,.45],.006,'#cfd8e0',{alpha:.25*Math.max(0,1-Math.abs(X-.3)/2),layer:-1});}};
const GAIT=(b,E,cy,o)=>{const T=o.T,v=o.v,d=o.d||.62,L=v*T*d,xh=(o.x||0)+L*.5+(o.ball?-.12:.03),fz=o.fz||.1,B=o.ball;
 const pose=(s,k,u)=>{const t=u*T,hx=xh-v*t,z=k*fz;let a,ax;   // a + = talón arriba (pivota en metatarsos), - = punta arriba (pivota en el talón)
  if(B){a=mix(B[0],B[1],Math.pow(u/d,1.3));}else a=u<.1?-15*(1-u/.1)**2:u<.4?0:40*Math.pow((u-.4)/(d-.4),1.6);
  const r=a*K.D,f=[cos(r),-sin(r),0],n=[sin(r),cos(r),0];ax=a>=0?hx+.2-.145*cos(r)+.075*sin(r):hx+.055*cos(r)+.075*sin(r);
  return K.footOn(b,s,[ax,0,z],f,n);};
 for(const[s,k,of]of[['R',1,0],['L',-1,.5]]){let u=(cy+of)%1;if(o.back)u=1-u;
  if(u<d)pose(s,k,u);else{const w=(u-d)/(1-d),e=GA._.EASE.mj(w),A0=pose(s,k,d),A1=pose(s,k,0),a1=B?B[1]:40,a0=B?B[0]:-15,
   a=(w<.5?mix(a1,-4,GA._.EASE.mj(w/.5)):mix(-4,a0,GA._.EASE.mj((w-.5)/.5)))*K.D;
   b.foot(s,V.add(V.lerp(A0,A1,e),[0,(o.lift||.075)*Math.pow(sin(PI*Math.min(1,w*1.08)),1.3)*(1-.35*w),0]),[cos(a),-sin(a),0],[sin(a),cos(a),0]);}}
 const reach=s=>{const a=b.j(s,'ank'),dz=a[2]-K.sd(s)*DM.hipW;return a[1]+Math.sqrt(Math.max(.01,K.legD(3)**2-(a[0]-(o.x||0))**2-dz*dz));};
 const W=TAU*cy;b.pelvis([o.x||0,Math.min(o.H+.014*cos(2*W-(o.back?.8:2.6)),reach('R'),reach('L')),.012*sin(W)],{tilt:o.tl||3,yaw:(o.yw==null?4:o.yw)*cos(W),roll:1.5*sin(W)});
 K.trunk(b,{sp:[o.sp||0,o.side||0,-(o.tw==null?7:o.tw)*cos(W)],hd:o.hd==null?-3:o.hd,sc:o.sc});K.legs(b,{up:o.up==null?.1:o.up});FLOOR(E,(o.back?-1:1)*v*T*cy,v*T/2);return W;};

// ═══ TRINEO ═══ empuje: tronco a 45°, brazos casi rectos a los postes, metatarsos | arrastre: de cara al trineo, marcha atrás con cinchas
GA.def('lib_sled_push',{
  title:'Empuje de trineo',cam:{yaw:30,pitch:9},cycle:{period:.9},fitBox:[[-.9,0,-.5],[1.55,1.6,.5]],
  muscles:{quads:1,glutes:.8,calves:.5,triceps:.3,frontdelts:.3},labels:['Cuádriceps','Glúteos','Gemelos'],note:'≈ 20 m',
  init:{act:.9},timeline:[X(.9,'Pasos cortos y potentes',.9)],
  build(c,b,E){const sl=K.sled(E,[.95,0,0],{plates:3}),R=K.armD(14),Y=.84,TL=46,po=x=>{b.pelvis([x,Y,0],{tilt:TL});b.spine(2);b.head(-30);b.scap('both',.01,.03);};
   const x=K.memo(this,'x',()=>K.root(x=>{po(x);return V.dist(b.sho('R'),sl.hi[0])-R;},-.9,.3));
   GAIT(b,E,c.cyc,{T:.9,v:.95,d:.58,x,H:Y,ball:[6,40],lift:.13,tl:TL,yw:3,tw:4,sp:2,hd:-30,sc:[.01,.03],up:.3});
   for(const[s,k]of SS)b.arm(s,sl.hi[s==='R'?0:1],[-.5,-1,k*.6],sl.ax[s==='R'?0:1]);}
});
GA.def('lib_sled_drag',{
  title:'Arrastre de trineo',cam:{yaw:34,pitch:10},cycle:{period:1},fitBox:[[-.55,0,-.5],[1.9,1.75,.5]],
  muscles:{quads:1,glutes:.7,hams:.4,calves:.4},labels:['Cuádriceps','Glúteos','Isquiotibiales'],note:'≈ 20 m',
  init:{act:.85},timeline:[X(1,'Hacia atrás · rodillas flexionadas',.85)],
  build(c,b,E){const sl=K.sled(E,[2.25,0,0],{yaw:180,plates:2}),hk=sl.hook;
   GAIT(b,E,c.cyc,{T:1,v:.7,d:.66,H:.83,back:1,tl:-4,yw:3,tw:4,sp:-2,hd:4,sc:[-.01,.02],lift:.06,up:.25});
   for(const[s,k]of SS){const sh=b.sho(s),g=V.madd(sh,V.norm(V.sub([hk[0],hk[1],k*.05],sh)),K.armD(8));g[2]=k*.15;b.arm(s,g,[-.4,-1,k*.4],[0,0,1]);
    E.handle(g,[0,0,1]);E.cyl(V.add(g,[0,0,-k*.06]),hk,.01,K.COL.strap);}}
});

// ═══ PASEOS CON CARGA ═══ marcha a ~1 m/s con pasos cortos; cargas colgando (agarre neutro) o en rack
const CARRY=(c,b,E,o)=>{const W=GAIT(b,E,c.cyc,{T:1.05,v:.95,d:.62,H:.92,tl:2,tw:o.tw==null?4:o.tw,yw:3,sc:[-.014,-.012],hd:-2}),R=K.armD(4);
 for(const[s,k]of SS){if(o.rack){const kb=K.kettlebell(E,b.tpt(k*.08,.02,.21),{kg:o.kg,up:b.tdir(-k*.9,.42,-.1),ax:[.4,0,k]});b.arm(s,kb.h,[.6,-1,-k*.3],kb.ax);continue;}
  const sh=b.sho(s);if(o.one&&s==='L'){b.armFK(s,{flex:-6*cos(W),abd:12,elbow:12,rot:5});continue;}
  const dz=k*o.z-sh[2],g=[sh[0]+.01,sh[1]-Math.sqrt(R*R-dz*dz),k*o.z];b.arm(s,g,[-1,0,k*.3],[1,0,0]);
  if(o.kg)K.kettlebell(E,g,{kg:o.kg,ax:[1,0,0]});else E.dumbbell(g,[1,0,0],{r:.08,hl:.08,len:.13});}
 E.shadow([0,0,0],.45,.35,.5);};
const CT={cam:{yaw:30,pitch:8},fitBox:[[-.5,0,-.4],[.55,1.85,.4]],cycle:{period:1.05},note:'pasos cortos',init:{act:.7}};
GA.def('lib_farmer_walk_db',Object.assign({
  title:'Paseo del granjero con mancuernas',muscles:{forearms:1,traps:1,abs:.5,glutes:.3,quads:.3},labels:['Antebrazo','Trapecio','Abdomen'],
  timeline:[X(1.05,'Hombros atrás · sin balanceo',.7)],build(c,b,E){CARRY(c,b,E,{z:.26});}},CT));
GA.def('lib_kb_farmer_carry',Object.assign({
  title:'Paseo del granjero con kettlebells',muscles:{forearms:1,traps:1,abs:.5,obliques:.4,glutes:.3},labels:['Antebrazo','Trapecio','Abdomen'],
  timeline:[X(1.05,'Hombros atrás y abajo',.7)],build(c,b,E){CARRY(c,b,E,{z:.28,kg:20});}},CT));
GA.def('lib_suitcase_carry_db',Object.assign({
  title:'Paseo de maleta con mancuerna',muscles:{obliques_L:1,obliques_R:.5,forearms_R:.8,traps_R:.5,abs:.4,abductors:.3},labels:['Oblicuos','Antebrazo','Trapecio'],
  timeline:[X(1.05,'Erguido · no te inclines',.7)],build(c,b,E){CARRY(c,b,E,{z:.26,one:1,tw:3});}},CT));
GA.def('lib_kb_rack_carry',Object.assign({
  title:'Paseo en rack con kettlebells',muscles:{abs:1,obliques:.7,midback:.5,forearms:.5,traps:.4},labels:['Abdomen','Oblicuos','Romboides'],
  timeline:[X(1.05,'Codos pegados · costillas abajo',.7)],build(c,b,E){CARRY(c,b,E,{rack:1,kg:16,tw:2});}},CT));

})(window.GymAnim);
