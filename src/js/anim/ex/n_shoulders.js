/* ex/n_shoulders.js */
/* Hombros (biblioteca): press con barra/Smith/landmine/kettlebell/banda/Arnold, remos al mentón, elevaciones laterales, frontales, en Y y halo */
(function(GA){
const K=GA._.kit,V=GA._.V,C=GA._.COL,DM=GA._.DIM,SS=K.SS,mix=K.mix,sst=K.sst,D=Math.PI/180,PI=Math.PI,UP=[0,1,0];
const R4=K.armD(4),sh=(E,x)=>E.shadow([x||0,0,0],.5,.38,.55);
const TL=(a,l1,b,l2,c,l3,d,l4,ac)=>[{p:1,dur:a,label:l1,act:1},{dur:b,label:l2,act:.9},{p:0,dur:c,label:l3,act:.75},{dur:d,label:l4,act:ac||.55}];
const kbDir=(b,s,n,a)=>{const S=b.S[s],fd=V.norm(V.sub(S.grip,S.elb)),w=V.norm(V.perp(n,fd));return V.norm(V.add(V.mul(fd,-Math.cos(a*D)),V.mul(w,Math.sin(a*D))));};
const bandUp=(E,b,s,A,ax,col)=>{const S=b.S[s],fd=V.norm(V.sub(S.grip,S.elb)),w=V.norm(V.perp(b.tdir(K.sd(s),0,0),fd));
  return K.band(E,[A,V.madd(S.elb,w,.052),V.madd(S.wri,w,.05),S.grip],null,{handle:ax,col:col||K.BAND.red,w:.009,L0:1.15});};
const DA='Deltoides anterior',DL='Deltoides lateral',TR='Tríceps',TP='Trapecio';
const front=(b,y)=>{let x=-9;for(const[s]of SS){const S=b.S[s];for(const[a,z,r]of[[S.hip,S.kne,.088],[S.kne,S.ank,.056]])
  if(y<=a[1]&&y>=z[1]){const t=(a[1]-y)/(a[1]-z[1]);x=Math.max(x,mix(a[0],z[0],t)+r);}}return x;};
const hang=(b,s,W,cl,ef)=>{const k=K.sd(s),S=b.sho(s),R=K.armD(ef||6),dz=k*W-S[2],L=Math.sqrt(R*R-dz*dz);let x=S[0],y=S[1]-L;
  for(let i=0;i<4;i++){x=Math.max(S[0],front(b,y)+cl);y=S[1]-Math.sqrt(Math.max(.01,L*L-(x-S[0])**2));}return[x,y,k*W];};
const tower=(E,P,u,lift)=>{const s=V.cross(u,UP),Q=V.madd([P[0],0,P[2]],u,-.12),y=Math.atan2(-u[2],u[0])/D,T=2.05,at=(a,h,c)=>V.add(V.madd(V.madd(Q,s,a),u,c||0),[0,h,0]);
  for(const k of[-1,1])E.beam(at(k*.21,0),at(k*.21,T+.05),.07,C.frame);E.beam(at(-.25,T+.05),at(.25,T+.05),.07,C.frame);
  E.boxA(at(0,.02),[.55,.04,.6],C.frameD,{layer:-1,yaw:y});const top=E.stack(at(0,0,-.07),{h:1.7,lift,n:14,sel:5,yaw:y,w:.28,bias:.1});
  E.pulley(P,s,.04);E.cable(V.madd(P,u,-.04),at(0,P[1]-.04,.03));E.cable(at(0,P[1],.03),at(0,T-.05,.03));E.pulley(at(0,T-.05,-.02),s,.05);E.cable(at(0,T-.05,-.07),top);};
const dH=(E,g,ax,d)=>{const ap=V.madd(g,d,.085);E.cyl(V.madd(g,ax,-.06),V.madd(g,ax,.06),.016,'#2a2f35');for(const k of[-1,1])E.cap(V.madd(g,ax,k*.06),ap,.008,.006,C.chrome);E.sph(ap,.012,C.chrome);return ap;};

const OHP=(c,b,E,o)=>{const p=c.p,W=.27,q=sst(.45,1,p);let m=[0,1.4,0];
  const arms=b=>{const G=[];for(const[s,k]of SS){const S=b.sho(s),dz=k*W-S[2],L=Math.sqrt(R4*R4-dz*dz),r=V.add(b.tpt(0,-.04,.17),[0,0,k*W]);
      const g=[mix(r[0],S[0]-.005,q),mix(r[1],S[1]+Math.sqrt(L*L-.0004),p),k*W];b.arm(s,g,V.lerp(b.tdir(k*.5,-.7,1),b.tdir(k,-.1,-.2),sst(0,.9,p)),[0,0,1]);G.push(g);}
    m=V.lerp(G[0],G[1],.5);};
  K.stand(b,{fz:.15,toe:10,kf:c.kf||4,tilt:-2*(1-p),sp:[-2*(1-p)],hd:-14*Math.sin(PI*sst(0,.8,p)),sc:[.025*sst(.6,1,p),0],balance:true,arms,xm:()=>[[m,o.kg/75]]});
  K.barbell(E,m,[0,0,1],{plates:o.pl});E.trace('barra',[m[0],m[1],.8]);sh(E);};
GA.def('lib_ohp_bb',{title:'Press militar con barra',cam:{yaw:40,pitch:8},
  muscles:{frontdelts:1,triceps:.6,sidedelts:.5,upperpecs:.3,abs:.25},labels:[DA,TR],init:{p:0,act:.7},
  timeline:TL(1.5,'Empuja recto · cabeza atrás',.4,'Bloquea · cabeza al frente',2.2,'Baja controlando al pecho',.4,'Rack · glúteos y abdomen',.7),
  build(c,b,E){OHP(c,b,E,{kg:40,pl:[.225]});}});
GA.def('lib_push_press',{title:'Push press con barra',cam:{yaw:40,pitch:8},
  muscles:{frontdelts:1,triceps:.6,sidedelts:.4,quads:.4,glutes:.3},labels:[DA,TR,'Cuádriceps'],init:{p:0,kf:4,act:.65},
  timeline:[{kf:48,dur:.45,label:'Flexiona · tronco vertical',act:.8},{kf:4,p:.4,dur:.25,label:'Extiende rápido las piernas',act:1,ease:'in'},
    {p:1,dur:.35,label:'Empuja y bloquea arriba',act:1,ease:'out'},{dur:.45,label:'Bloquea arriba',act:.85},
    {p:0,dur:1.6,label:'Baja controlando al rack',act:.75},{dur:.5,label:'Barra en los hombros',act:.65}],
  build(c,b,E){OHP(c,b,E,{kg:50,pl:[.225,.17]});}});

GA.def('lib_landmine_press',{title:'Press landmine',cam:{yaw:28,pitch:10},fitBox:[[-.5,0,-.55],[1.1,1.95,.55]],
  muscles:{frontdelts_R:1,upperpecs_R:.7,triceps_R:.5,obliques:.25},labels:[DA,'Pectoral sup.',TR],init:{p:0,act:.7},
  timeline:TL(1.2,'Empuja arriba y adelante',.4,'Arriba · sin girar el torso',2,'Baja controlando al hombro',.4,'Abdomen firme',.7),
  build(c,b,E){const p=c.p,Lg=1.95-.07,R=K.armD(7);
    K.stand(b,{feet:{R:[-.3,.13],L:[.12,-.12]},toe:6,kf:6,tilt:12,x:-.12,sp:[-2],hd:-8,sc:[0,.02*p]});
    const sh=b.sho('R'),h0=b.tpt(.13,-.07,.19),PV=K.memo(this,'pv',()=>[h0[0]+Math.sqrt(Lg*Lg-(h0[1]-.05)**2-h0[2]**2),.05,0]);
    const dh=V.norm([h0[0]-PV[0],0,h0[2]-PV[2]]),g=th=>V.madd(PV,V.add(V.mul(dh,Math.cos(th)),[0,Math.sin(th),0]),Lg);
    const t0=Math.asin((h0[1]-.05)/Lg),sh1=V.madd(sh,b.tdir(0,0,1),.02*(1-p)),t1=K.memo(this,'t1',()=>E.solve(t=>V.dist(g(t),sh1)-R,t0,1.3)),G=g(mix(t0,t1,p));
    b.arm('R',G,V.lerp(b.tdir(.5,-1,.1),b.tdir(.6,-.4,-.2),p),V.norm(V.sub(G,PV)));b.arm('L',b.ppt(-.19,.1,.03),[-.5,0,-1],UP);
    K.landmine(E,PV,G,{plates:[.225]});E.trace('barra',G);E.shadow([.5,0,0],1,.4,.5);}});

const SMITH=(E,X,Y)=>{for(const k of[-1,1]){E.beam([X,0,k*.62],[X,2.2,k*.62],.06,C.frame);E.beam([X-.5,.03,k*.62],[X+.55,.03,k*.62],.07,C.frameD,{layer:-1});
    E.boxA([X,Y,k*.62],[.1,.13,.1],C.frameD);E.cyl([X,Y,k*.66],[X,Y,k*.69],.04,C.chrome);E.plate([X,Y,k*.725],[0,0,1],.225);E.plate([X,Y,k*.78],[0,0,1],.165,{th:.035});}
  E.beam([X,2.2,-.65],[X,2.2,.65],.07,C.frame);E.bar([X,Y,-1.02],[X,Y,1.02],{r:.0145});};
const SEAT=(b,E,inc)=>{E.bench({at:[0,0,0],dir:0,h:.45,seat:.42,back:.74,inc:inc||85,w:.3});b.pelvis([.125,.538,0],{tilt:-4});b.spine(-3);b.head(1);
  for(const[s,k]of SS){b.footFlat(s,[.49,0,k*.2],k*-16);b.leg(s,null,[1,.15,k*.35]);}};
GA.def('lib_ohp_smith',{title:'Press militar en Smith',cam:{yaw:52,pitch:8},fitBox:[[-.35,0,-.75],[.65,1.9,.75]],
  muscles:{frontdelts:1,sidedelts:.6,triceps:.6},labels:['Deltoides ant. y lat.',TR],init:{p:0,act:.7},
  timeline:TL(1.4,'Empuja vertical · sin bloquear',.4,'Arriba · espalda apoyada',2.5,'Baja al mentón en 2,5 s',.4,'Abajo · codos bajo la barra',.7),
  build(c,b,E){const p=c.p,W=.29,R=K.armD(10);SEAT(b,E);b.scap('both',.012*p,0);
    const S=b.sho('R'),X=b.headC[0]+.155,dx=X-S[0],y0=S[1]+.12,y1=S[1]+Math.sqrt(R*R-dx*dx-(W-S[2])**2),Y=mix(y0,y1,p);
    for(const[s,k]of SS)b.arm(s,[X,Y,k*W],V.lerp(b.tdir(k*.7,-1,.3),b.tdir(k,-.2,-.1),p),[0,0,1]);
    SMITH(E,X,Y);E.trace('barra',[X,Y,1.02]);sh(E,.15);}});

GA.def('lib_arnold_press_db',{title:'Press Arnold con mancuernas',cam:{yaw:62,pitch:8},fitBox:[[-.3,0,-.6],[.66,1.75,.6]],
  muscles:{frontdelts:1,sidedelts:.7,triceps:.5,upperpecs:.3},labels:['Deltoides ant. y lat.',TR],init:{p:0,act:.7},
  timeline:TL(1.6,'Gira y empuja arriba',.4,'Arriba · palmas al frente',2.6,'Baja girando · palmas a ti',.4,'Abajo · codos delante',.7),
  build(c,b,E){const p=c.p,a=sst(0,.62,p),u=sst(.28,1,p),SP=25*D;SEAT(b,E);b.scap('both',.015*u,.01*(1-a));
    const th=mix(-8.5,65,a)*D,rho=mix(.202,.298,a),up=mix(.09,.3,a),ps=-165*a*D;
    for(const[s,k]of SS){const S=b.sho(s),B=[k*.27,.3,.126],T=[k*.012,.623,.03],r=[k*rho*Math.sin(th),up,rho*Math.cos(th)];
      const g=V.add(S,b.tdir(...r.map((x,i)=>x+(T[i]-B[i])*u))),ed=b.tdir(k*Math.cos(SP),-.1,Math.sin(SP));
      const ax=b.tdir(k*Math.cos(ps),0,Math.sin(ps));b.arm(s,g,V.lerp(V.lerp(b.tdir(0,-1,.35),ed,a),b.tdir(k,-.15,.3),u),ax);
      E.dumbbell(b.j(s,'grip'),ax,{r:.05,hl:.055});if(k>0)E.trace('mancuerna',b.j(s,'grip'));}
    sh(E,.15);}});

GA.def('lib_kb_press',{title:'Press de hombros con kettlebell',cam:{yaw:58,pitch:8},
  muscles:{frontdelts_R:1,triceps_R:.6,sidedelts_R:.5,abs:.3},labels:[DA,TR],init:{p:0,act:.7},
  timeline:TL(1.4,'Empuja recto · glúteos firmes',.4,'Bloquea arriba',2.2,'Baja controlado al rack',.5,'Rack · codo pegado',.7),
  build(c,b,E){const p=c.p,q=sst(0,.75,p),kg=16;let G=[0,1.4,0],bd=[0,-1,0],ax=[0,0,1];
    const arms=b=>{const S=b.sho('R'),dz=.2-S[2],L=Math.sqrt(R4*R4-dz*dz),r=b.tpt(.12,-.1,.22),t=[S[0]-.02,S[1]+Math.sqrt(L*L-.0004),.2];
      G=[mix(r[0],t[0],sst(.2,1,p)),mix(r[1],t[1],p),mix(r[2],t[2],q)+.14*Math.sin(PI*p)];ax=V.norm(V.lerp([.6,0,1],[.2,0,1],p));b.arm('R',G,V.lerp(V.lerp(b.tdir(.08,-1,.25),b.tdir(.4,-1,.1),sst(0,.4,p)),[-.4,0,1],sst(.75,1,p)),ax);bd=kbDir(b,'R',V.lerp(b.tdir(1,0,-.15),[-1,0,.1],q),58);b.armFK('L',{abd:14,flex:4,elbow:16,rot:-8});};
    K.stand(b,{fz:.15,toe:10,kf:4,sp:[0,-2*p],hd:-4,sc:[0,0],balance:true,arms,xm:()=>[[V.madd(G,bd,.15),kg/75]]});
    K.kettlebell(E,G,{kg,up:V.neg(bd),ax});E.trace('pesa',G);sh(E);}});

GA.def('lib_band_shoulder_press',{title:'Press de hombros con banda elástica',cam:{yaw:52,pitch:8},
  muscles:{frontdelts:1,sidedelts:.55,triceps:.5},labels:['Deltoides ant. y lat.',TR],init:{p:0,act:.65},
  timeline:TL(1.3,'Empuja arriba · sin arquear',.4,'Arriba · brazos estirados',2.2,'Baja lento',.4,'Asas a los hombros',.65),
  build(c,b,E){const p=c.p,SP=30*D,dr=42*D,FZ=.17;K.stand(b,{fz:FZ,toe:8,kf:4,sp:[-1],hd:-3,sc:[.015*p,0]});
    for(const[s,k]of SS){const S=b.sho(s),ed=b.tdir(k*Math.cos(SP)*Math.cos(dr),-Math.sin(dr),Math.sin(SP)*Math.cos(dr));
      const B=V.add(V.madd(S,ed,DM.ua),b.tdir(0,DM.fa+DM.grip,0)),T=V.add(S,b.tdir(k*.012,.623,.03)),g=V.lerp(B,T,p);
      const ax=b.tdir(k*Math.cos(SP),0,Math.sin(SP)*(1-.4*p));b.arm(s,g,V.lerp(ed,b.tdir(k,-.15,.3),p),ax);
      bandUp(E,b,s,[b.j(s,'ank')[0]+.05,.006,k*(FZ+.06)],ax);}
    E.boxA([b.j('R','ank')[0]+.05,.003,0],[.05,.006,2*FZ+.12],K.BAND.red,{layer:-1,outline:false});sh(E);}});

const UR=(c,b,o)=>{const p=c.p,q=sst(0,.5,p),G={},H={};K.stand(b,{fz:.14,toe:8,kf:6,tilt:3,sp:[-1],hd:-4,sc:[.022*sst(.5,1,p),.012*p]});
  for(const[s,k]of SS){H[s]=hang(b,s,o.W,o.cl);const g=V.lerp(H[s],b.tpt(k*o.W,-.27,o.f||.15),p);b.arm(s,g,V.lerp(b.tdir(k,-.1,-.4),b.tdir(k,.6,-.15),q),[0,0,1]);G[s]=g;}
  return{G,H};};
const URM={sidedelts:1,traps:.7,frontdelts:.35,biceps:.3},URT=(l)=>TL(1.2,'Codos arriba y afuera',.4,'Altura del hombro · no más',2,l,.4,'Abajo · brazos largos',.55);
GA.def('lib_upright_row_bb',{title:'Remo al mentón con barra',cam:{yaw:42,pitch:8},muscles:URM,labels:[DL,TP],init:{p:0,act:.55},
  timeline:URT('Baja controlando la barra'),
  build(c,b,E){const{G}=UR(c,b,{W:.2,cl:.04}),m=V.lerp(G.R,G.L,.5);K.barbell(E,m,[0,0,1],{plates:[.2]});E.trace('barra',[m[0],m[1],.75]);sh(E);}});
GA.def('lib_upright_row_db',{title:'Remo al mentón con mancuernas',cam:{yaw:46,pitch:8},muscles:{sidedelts:1,traps:.8,frontdelts:.4,biceps:.3},labels:[DL,TP],init:{p:0,act:.55},
  timeline:URT('Baja controlando'),
  build(c,b,E){const{G}=UR(c,b,{W:.18,cl:.055,f:.17});for(const[s]of SS){const S=b.S[s],ax=V.norm(V.lerp([0,0,1],V.norm(V.perp([0,0,1],V.norm(V.sub(S.grip,S.elb)))),.45*c.p));S.gripAx=ax;E.dumbbell(G[s],ax,{r:.048,hl:.05});}E.trace('mancuerna',G.R);sh(E);}});
GA.def('lib_upright_row_cable',{title:'Remo al mentón en cable',cam:{yaw:22,pitch:9},fitBox:[[-.4,0,-.5],[.75,1.85,.5]],
  muscles:{sidedelts:1,traps:.7,frontdelts:.4,biceps:.3},labels:[DL,TP],init:{p:0,act:.55},timeline:URT('Baja controlando · sin soltar'),
  build(c,b,E){const{G,H}=UR(c,b,{W:.2,cl:.04}),m=V.lerp(G.R,G.L,.5),P=[.45,.1,0];
    E.bar(V.add(m,[0,0,-.27]),V.add(m,[0,0,.27]),{r:.014});for(const k of[-1,1])E.cyl(V.add(m,[0,0,k*.13]),V.add(m,[0,0,k*.27]),.017,K.COL.grip);
    const cl=V.madd(m,V.norm(V.sub(P,m)),.03);E.sph(cl,.014,C.chrome);E.cable(cl,P);tower(E,P,[-1,0,0],.02+V.dist(P,m)-V.dist(P,V.lerp(H.R,H.L,.5)));E.trace('barra',G.R);sh(E,.1);}});

const FR=(c,b,o)=>{const p=c.p,R=K.armD(8),G={},G0={};K.stand(b,{fz:o.fz||.13,toe:8,kf:5,tilt:mix(2,-2,p),sp:[-1],hd:-2-5*p,sc:[0,.01*p]});
  for(const[s,k]of SS){const S=b.sho(s),h=hang(b,s,o.W,o.cl,8),L=Math.hypot(h[0]-S[0],h[1]-S[1]),t0=Math.atan2(h[0]-S[0],S[1]-h[1]),at=t=>[S[0]+L*Math.sin(t),S[1]-L*Math.cos(t),k*o.W];
    G[s]=at(mix(t0,o.a1*D,p));G0[s]=at(t0);b.arm(s,G[s],b.tdir(k,-.5,-.2),o.ax||[0,0,1]);}
  return{G,G0};};
const FRM={frontdelts:1,sidedelts:.3,upperpecs:.3},FRT=(l1,l2)=>TL(1.3,l1,.4,l2,2.2,'Baja lento sin balancear',.4,'Abajo · brazos casi rectos',.55);
GA.def('lib_front_raise_bb',{title:'Elevación frontal con barra',cam:{yaw:40,pitch:8},muscles:FRM,labels:[DA],init:{p:0,act:.55},
  timeline:FRT('Sube · brazos casi rectos','Altura de los ojos'),
  build(c,b,E){const{G}=FR(c,b,{W:.2,cl:.04,a1:100}),m=V.lerp(G.R,G.L,.5);K.barbell(E,m,[0,0,1],{plates:[.165]});E.trace('barra',[m[0],m[1],.75]);sh(E);}});
GA.def('lib_plate_front_raise',{title:'Elevación frontal con disco',cam:{yaw:34,pitch:8},muscles:FRM,labels:[DA],init:{p:0,act:.55},
  timeline:FRT('Sube el disco · brazos rectos','Altura de los ojos'),
  build(c,b,E){const r=.19,{G}=FR(c,b,{W:r-.008,cl:.04,a1:100,ax:UP}),m=V.lerp(G.R,G.L,.5);K.plate(E,m,[1,0,0],{r,th:.035});E.trace('disco',V.add(m,[0,r,0]));sh(E);}});
GA.def('lib_front_raise_cable',{title:'Elevación frontal en cable',cam:{yaw:36,pitch:8},fitBox:[[-.75,0,-.5],[.85,1.85,.5]],muscles:FRM,labels:[DA],init:{p:0,act:.55},
  timeline:FRT('Sube · brazos rectos','Altura del hombro'),
  build(c,b,E){const{G,G0}=FR(c,b,{W:.055,cl:.08,a1:90,fz:.2}),P=[-.42,.1,0],cp=G=>{const m=V.lerp(G.R,G.L,.5);return V.madd(m,V.norm(V.sub(P,m)),.26);},cl=cp(G);
    E.rope(cl,G.R,G.L);E.cable(cl,P);tower(E,P,[1,0,0],.02+V.dist(P,cl)-V.dist(P,cp(G0)));E.trace('cuerda',G.R);sh(E,-.1);}});

GA.def('lib_band_lateral_raise',{title:'Elevación lateral con banda elástica',cam:{yaw:60,pitch:8},
  muscles:{sidedelts:1,frontdelts:.3,traps:.25},labels:[DL],init:{p:0,act:.5},
  timeline:TL(1.3,'Sube · lidera con el codo',.5,'Altura del hombro',2.4,'Baja lento',.4,'Abajo · banda en tensión',.5),
  build(c,b,E){const p=c.p;K.stand(b,{fz:.12,toe:8,kf:6,tilt:6,sp:[-2],hd:-5,sc:[-.004,0]});
    for(const[s,k]of SS){const o={abd:mix(12,90,p),hz:mix(14,24,p),elbow:mix(12,15,p),rot:mix(-5,8,p)};b.armFK(s,o);
      o.grip=V.norm(V.perp(b.tdir(0,0,1),V.norm(V.sub(b.j(s,'wri'),b.j(s,'elb')))));b.armFK(s,o);
      K.band(E,[[b.j(s,'ank')[0]+.05,.006,k*.18],b.j(s,'grip')],null,{handle:o.grip,col:K.BAND.green,w:.009,L0:.8});}
    E.boxA([b.j('R','ank')[0]+.05,.003,0],[.05,.006,.42],K.BAND.green,{layer:-1,outline:false});sh(E);}});

GA.def('lib_y_raise_cable',{title:'Elevación en Y en cable',cam:{yaw:72,pitch:9},fitBox:[[-.4,0,-.95],[.6,2.15,.95]],
  muscles:{sidedelts:1,traps:.6,frontdelts:.3},labels:[DL,TP],init:{p:0,act:.5},
  timeline:TL(1.5,'Sube en diagonal · Y',.4,'Arriba · sin encoger',2.6,'Baja lento cruzando',.4,'Abajo · manos cruzadas',.5),
  build(c,b,E){const p=c.p,R=K.armD(10);K.stand(b,{fz:.14,toe:8,kf:8,tilt:4,sp:[-1],hd:-4-4*p,sc:[.018*sst(.5,1,p),-.01*p]});
    for(const[s,k]of SS){const S=b.sho(s),P=[.3,.12,-k*.76],d0=V.norm(V.sub([.31+k*.07,.94-k*.02,-k*.07],S)),d1=b.tdir(k*.497,.819,.287),ax=V.norm(V.cross(d0,d1)),an=Math.acos(V.dot(d0,d1));
      const g=V.madd(S,V.rot(d0,ax,an*p),R),g0=V.madd(S,d0,R);b.arm(s,g,V.lerp(b.tdir(k,-.4,-.3),b.tdir(k*.4,.1,-1),p),[0,1,0]);
      const S2=b.S[s],fd=V.norm(V.sub(g,S2.wri)),d=V.norm(V.sub(P,g)),hx=V.norm(V.cross(fd,d));S2.gripAx=hx;
      E.cable(dH(E,g,hx,d),P);tower(E,P,[0,0,k],.02+V.dist(P,g)-V.dist(P,g0));if(k>0)E.trace('maneral',g);}
    sh(E);}});

GA.def('lib_lat_raise_machine',{title:'Elevación lateral en máquina',cam:{yaw:56,pitch:10},fitBox:[[-.5,0,-.7],[.6,1.6,.7]],
  muscles:{sidedelts:1,frontdelts:.25},labels:[DL],init:{p:0,act:.5},
  timeline:TL(1.3,'Sube con codos · sin encoger',.5,'Altura del hombro',3,'Baja lento en 3 s',.4,'Abajo · sin soltar',.5),
  build(c,b,E){const p=c.p,SY=.47,a0=12,a=mix(a0,86,p)*D;K.seat(b,[0,SY,0],{sp:[-2],hd:-4,sc:[-.006,0],feet:{x:.47,z:.2,toe:10}});
    const HX=b.sho('R')[0]-.2,HY=b.sho('R')[1];
    for(const[s,k]of SS){const S=b.sho(s),d=[0,-Math.cos(a),k*Math.sin(a)],n=[0,Math.sin(a),k*Math.cos(a)],e=V.madd(S,d,DM.ua),g=V.madd(e,[1,0,0],DM.fa+DM.grip);
      b.arm(s,g,d,d);const pc=V.madd(V.madd(e,n,.083),d,-.045),H=[HX,HY,S[2]],le=V.madd(V.madd(H,d,.255),n,.083);
      E.cyl([pc[0]-.08,pc[1],pc[2]],[pc[0]+.07,pc[1],pc[2]],.04,C.pad);E.beam(H,le,.045,C.frame);E.beam(le,[pc[0]-.08,le[1],le[2]],.04,C.frame);
      E.cyl(V.madd(g,d,-.06),V.madd(g,d,.06),.017,K.COL.grip);E.beam([pc[0]+.07,pc[1],pc[2]],V.madd(g,d,.075),.025,C.frameD);
      E.cyl([HX-.02,HY,S[2]],[HX-.02,HY,S[2]+k*.06],.045,C.frameD);}
    E.pad([-.16,SY-.04,0],[.16,SY-.04,0],.36,.08,C.pad,{up:UP,layer:-1});E.pad(b.tpt(0,-.62,-.15),b.tpt(0,-.16,-.15),.34,.08,C.pad,{up:b.tdir(0,0,1),layer:-1});
    E.beam([HX-.05,.03,0],[HX-.05,HY,0],.08,C.frame,{layer:-2});E.beam([HX-.05,HY,-.18],[HX-.05,HY,.18],.07,C.frame);E.beam([-.75,.035,0],[.3,.035,0],.08,C.frameD,{layer:-2});
    E.beam([.04,.03,0],[.04,SY-.08,0],.08,C.frame,{layer:-2});E.beam([-.17,b.tpt(0,-.4,-.2)[1],0],[HX-.05,b.tpt(0,-.4,-.2)[1],0],.06,C.frame,{layer:-2});
    const top=E.stack([-.62,.04,0],{h:1.5,lift:.11*(a-a0*D),n:12,sel:4,w:.26,bias:.1});E.cable(top,[-.62,HY+.05,0]);E.cable([-.62,HY+.05,0],[HX-.05,HY+.05,0]);
    E.trace('codo',b.j('R','elb'));E.shadow([-.1,0,0],.75,.5,.5);}});

const HK=[[.5,-1,.3],[.7,-.7,.2],[1,-.4,-.2],[.9,.35,.25],[.2,1,-.2],[.3,1,0],[.4,1,.1],[-.1,.5,.85]];
const HP=(k,f)=>{const x=((k*f/(2*PI))%1+1)%1*8,i=Math.floor(x),t=x-i,P=j=>HK[(i+j+8)%8];
  const v=[0,1,2].map(d=>{const a=P(-1)[d],b=P(0)[d],c=P(1)[d],e=P(2)[d];return .5*(2*b+(c-a)*t+(2*a-5*b+4*c-e)*t*t+(3*b-a-3*c+e)*t*t*t);});v[0]*=k;return v;};
GA.def('lib_kb_halo',{title:'Halo con kettlebell',cam:{yaw:40,pitch:8},
  muscles:{frontdelts:1,sidedelts:.6,triceps:.4,abs:.4,traps:.3},labels:['Deltoides ant. y lat.','Abdomen'],init:{a:0,p:0,act:.7},
  timeline:[{a:.25,p:1,dur:1.2,ease:'in',label:'Rodea la cabeza · derecha',act:.85},{a:.75,p:.5,dur:1.2,ease:'lin',label:'Por detrás · cerca de la nuca',act:.9},
    {a:1,p:0,dur:1.2,ease:'out',label:'Vuelve al frente',act:.8},{dur:.4,label:'Cambia de sentido',act:.7},
    {a:.75,dur:1.2,ease:'in',label:'Rodea la cabeza · izquierda',act:.85},{a:.25,dur:1.2,ease:'lin',label:'Por detrás · abdomen firme',act:.9},
    {a:0,dur:1.2,ease:'out',label:'Vuelve al frente',act:.8},{dur:.4,label:'Cambia de sentido',act:.7}],
  build(c,b,E){const f=2*PI*c.a,kg=12,cf=Math.cos(f),sf=Math.sin(f),be=-65*sf*D;K.stand(b,{fz:.15,toe:10,kf:6,sp:[-1],hd:[13*(1-cf)+18*sf**8,0,0],sc:[.012+.03*sf*sf+.01*(1-cf),0]});
    const M=b.tpt(.2*sf,.15-.025*cf-.145*Math.cos(2*f),.005+.245*cf+.12*sf*sf*Math.max(0,cf)+.08*sf*sf),ax=b.tdir(Math.cos(be),Math.sin(be),0);let fd=[0,0,0];
    for(const[s,k]of SS){const g=V.madd(M,ax,k*.088);b.arm(s,g,b.tdir(...HP(k,f)),ax);fd=V.add(fd,V.norm(V.sub(g,b.j(s,'elb'))));}
    const u=V.norm(V.perp(fd,ax));K.kettlebell(E,V.madd(M,u,-.051),{kg,up:V.neg(u),ax});sh(E);}});

})(window.GymAnim);
