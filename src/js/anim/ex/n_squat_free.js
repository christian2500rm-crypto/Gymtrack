/* ex/n_squat_free.js */
/* Sentadillas libres: barra, landmine, mancuernas, kettlebell, peso corporal, bandas, TRX, polea y belt squat */
(function(GA){
const K=GA._.kit,V=GA._.V,C=GA._.COL,DM=GA._.DIM,SS=K.SS,mix=K.mix,sst=K.sst,UP=[0,1,0];
const TL=(d,u,l)=>[{p:1,dur:d,label:l[0],act:.85},{dur:.35,label:l[1],act:.95},{p:0,dur:u,label:l[2],act:1},{dur:.6,label:l[3],act:.45}];
const SQ=(ctx,b,p,o)=>{const t=o.t,st=(kf,tl,x)=>K.stand(b,{fz:o.fz,toe:o.toe,fx:o.fx,feet:o.feet,z:o.z,y:o.y,kf,tilt:tl,x,sp:o.sp||[-3],
    hd:o.hd==null?-tl*.4:o.hd,sc:o.sc,balance:x==null,arms:o.arms,xm:o.xm,bx:o.bx}),
  pose=(kf,tl)=>{if(!o.fit)return st(kf,tl);const x=K.root(x=>{st(kf,tl,x);return o.fit(b);},-.8,.5);b.ikErr=0;return st(kf,tl,x);};
  const kB=o.kB||K.memo(ctx,'kB',()=>K.root(kf=>{pose(kf,t[1]);return o.bot?o.bot(b):b.hip('R')[1]-b.j('R','kne')[1]+(o.dep||0);},60,150));
  b.ikErr=0;return pose(mix(o.kf0||5,kB,p),mix(t[0],t[1],p));};
const reach=(b,a)=>{const r=a*Math.PI/180;for(const[s,k]of SS){const d=[Math.cos(r),Math.sin(r),k*mix(.14,.05,sst(-60,0,a))];b.armDir(s,d,d);}};
const clasp=b=>{for(const[s,k]of SS)b.arm(s,b.tpt(k*.034,-.2,.215),b.tdir(k,-.7,-.1),[0,1,0]);};
const free=(b,s,a,kn)=>{const r=a*Math.PI/180,q=(a-kn)*Math.PI/180;b.legDir(s,[Math.sin(r),-Math.cos(r),0],[Math.sin(q),-Math.cos(q),0]);b.footRelax(s,12);};
const tower=(E,X,lift,o)=>{o=o||{};for(const k of[-1,1])E.beam([X,0,k*.2],[X,2.1,k*.2],.07,C.frame);E.beam([X,2.1,-.23],[X,2.1,.23],.08,C.frame);
  E.boxA([X,.03,0],[.5,.06,.5],C.frameD,{layer:-1});const top=E.stack([X,.06,0],{h:1.7,lift,n:14,sel:6,w:.28});
  const P=[X-.2,o.py||.12,0];E.beam([X-.2,0,0],[X-.2,P[1]+.04,0],.05,C.frameD);E.pulley(P,[0,0,1],.04);E.pulley([X+.12,.08,0],[0,0,1],.035);E.pulley([X+.1,2.02,0],[0,0,1],.05);
  E.cable([X-.2,P[1]-.04,0],[X+.12,.045,0]);E.cable([X+.155,.08,0],[X+.15,2.02,0]);E.cable([X+.05,2.02,0],top);return P;};

GA.def('lib_back_squat',{title:'Sentadilla con barra',cam:{yaw:30,pitch:8},
  muscles:{quads:1,glutes:.8,adductors:.5,lowback:.35},labels:['Cuádriceps','Glúteos','Aductores'],init:{p:0,act:.45},
  timeline:TL(2.4,1.4,['Baja · rodillas afuera','Abajo · muslos paralelos','Sube desde el medio pie','Arriba · abdomen firme']),
  build(c,b,E){let bar=[0,1.4,0];
    SQ(this,b,c.p,{fz:.17,toe:18,t:[4,40],sc:[.012,-.03],arms:b=>{bar=b.tpt(0,-.03,-.064);
      for(const[s,k]of SS)b.arm(s,[bar[0],bar[1],k*.36],[-.45,-1,k*.3],[0,0,1]);},xm:()=>[[bar,100/75]]});
    K.barbell(E,bar,[0,0,1],{plates:[.225,.225]});E.trace('barra',V.add(bar,[0,0,1.1]));E.shadow([0,0,0],.6,.4,.55);}});

GA.def('lib_front_squat',{title:'Sentadilla frontal con barra',cam:{yaw:34,pitch:8},
  muscles:{quads:1,glutes:.6,adductors:.4,abs:.35,midback:.3},labels:['Cuádriceps','Glúteos','Abdomen'],init:{p:0,act:.45},
  timeline:TL(2.4,1.4,['Baja · torso erguido','Abajo · codos altos','Sube sin bajar los codos','Arriba · abdomen firme']),
  build(c,b,E){let bar=[0,1.4,0];
    SQ(this,b,c.p,{fz:.16,toe:16,t:[2,22],dep:.04,sp:[-4],hd:-4,sc:[.01,.01],arms:b=>{bar=b.tpt(0,-.035,.115);
      for(const[s,k]of SS)b.arm(s,V.add(bar,b.tdir(-k*.13,.036+(k>0?.022:0),k>0?.018:0)),b.tdir(0,.4,1));},xm:()=>[[bar,80/75]]});
    K.barbell(E,bar,[0,0,1],{plates:[.225,.17]});E.trace('barra',V.add(bar,[0,0,1.1]));E.shadow([0,0,0],.6,.4,.55);}});

const LG=1.88,PV=[1.66,.05,0],hp=b=>b.tpt(0,-.2+.1*K.clamp((.94-b.pf.o[1])/.45,0,1),.24);   // la punta sube del esternón a la clavícula al bajar
GA.def('lib_landmine_squat',{title:'Sentadilla landmine',cam:{yaw:38,pitch:10},fitBox:[[-.6,0,-.6],[1.2,1.8,.6]],
  muscles:{quads:1,glutes:.7,adductors:.35,abs:.25},labels:['Cuádriceps','Glúteos'],init:{p:0,act:.45},
  timeline:TL(2.3,1.3,['Baja · cadera entre piernas','Abajo · pecho alto','Sube con los talones','Arriba · aprieta glúteos']),
  build(c,b,E){let g=[0,1.2,0],ax=[1,0,0];
    SQ(this,b,c.p,{fz:.17,toe:16,t:[3,12],dep:.02,sc:[0,.01],fit:b=>V.dist(hp(b),PV)-LG,arms:b=>{const h=hp(b);ax=V.norm(V.sub(h,PV));g=V.madd(PV,ax,LG);
      for(const[s,k]of SS)b.arm(s,V.add(g,b.tdir(k*.045,0,0)),b.tdir(k*.35,-1,-.1),ax);}});
    K.landmine(E,PV,g,{plates:[.225]});E.trace('punta',g);E.shadow([.3,0,0],.9,.4,.5);}});

GA.def('lib_squat_db',{title:'Sentadilla con mancuernas',cam:{yaw:32,pitch:8},
  muscles:{quads:1,glutes:.8,adductors:.5,hams:.3},labels:['Cuádriceps','Glúteos','Aductores'],init:{p:0,act:.45},
  timeline:TL(2.4,1.3,['Baja · pecho alto','Abajo · muslos paralelos','Sube desde los talones','Arriba · brazos relajados']),
  build(c,b,E){const H={};
    SQ(this,b,c.p,{fz:.14,toe:12,t:[3,34],sc:[-.01,0],arms:b=>{for(const[s,k]of SS){const S=b.sho(s);H[s]=[S[0]+.02,S[1]-Math.sqrt(K.armD(4)**2-.117**2-.0004),k*.30];
      b.arm(s,H[s],[-1,0,k*.3],[1,0,0]);}},xm:()=>[[H.R,16/75],[H.L,16/75]]});
    for(const[s]of SS)E.dumbbell(b.j(s,'grip'),[1,0,0],{r:.055,hl:.05,len:.12});E.shadow([0,0,0],.55,.4,.55);}});

const hang=(b,w,f)=>{const sm=V.lerp(b.sho('R'),b.sho('L'),.5),R=K.armD(5),dz=b.sho('R')[2]-sm[2]-w,h=[sm[0]+f,sm[1]-Math.sqrt(R*R-dz*dz-f*f),0];
  for(const[s,k]of SS)b.arm(s,V.add(h,[0,0,k*w]),[-.3,0,k],[0,1,0]);return h;};
GA.def('lib_sumo_squat_db',{title:'Sentadilla sumo con mancuerna',cam:{yaw:52,pitch:8},
  muscles:{quads:1,adductors:.8,glutes:.8,hams:.3},labels:['Cuádriceps','Aductores','Glúteos'],init:{p:0,act:.45},
  timeline:TL(2.3,1.3,['Baja · rodillas afuera','Abajo · tronco erguido','Sube apretando glúteos','Arriba · pies firmes']),
  build(c,b,E){let h=[0,.8,0];
    SQ(this,b,c.p,{fz:.36,toe:42,t:[2,16],bot:b=>Math.min(b.hip('R')[1]-b.j('R','kne')[1],h[1]-.2),sc:[-.01,.01],arms:b=>{h=hang(b,.042,.19);},xm:()=>[[h,22/75]]});
    E.dumbbell(V.add(h,[0,-.035,0]),UP,{r:.078,hl:.07,len:.13});E.shadow([0,0,0],.6,.45,.55);}});

GA.def('lib_kb_goblet_squat',{title:'Sentadilla goblet con kettlebell',cam:{yaw:34,pitch:9},
  muscles:{quads:1,glutes:.8,adductors:.5,abs:.3},labels:['Cuádriceps','Glúteos','Aductores'],init:{p:0,act:.45},
  timeline:TL(2.5,1.3,['Baja entre las rodillas','Abajo · codos dentro','Sube con todo el pie','Arriba · pecho alto']),
  build(c,b,E){let h=[0,1.2,0],up=UP;const kg=16;
    SQ(this,b,c.p,{fz:.19,toe:20,t:[3,27],dep:.05,sc:[-.005,-.008],arms:b=>{up=V.norm(V.lerp(b.tdir(0,1,0),UP,.6));h=V.madd(b.tpt(0,-.12,.13+K.kbR(kg)),up,.03);
      const r=K.kbR(kg),hw=r*.62+.018;for(const[s,k]of SS)b.arm(s,V.add(V.madd(h,up,-.05),b.tdir(k*(hw+.012),0,.012)),b.tdir(-k*.25,-1,.6),up);},xm:()=>[[h,kg/75]]});
    K.kettlebell(E,h,{kg,up});E.shadow([0,0,0],.55,.4,.55);}});

GA.def('lib_kb_sumo_squat',{title:'Sentadilla sumo con kettlebell',cam:{yaw:36,pitch:8},
  muscles:{quads:1,glutes:.8,adductors:.8,hams:.3},labels:['Cuádriceps','Aductores','Glúteos'],init:{p:0,act:.45},
  timeline:TL(2.3,1.3,['Baja recto · pesa colgando','Abajo · tronco erguido','Sube · rodillas afuera','Arriba · aprieta glúteos']),
  build(c,b,E){let h=[0,.8,0];const kg=20;
    SQ(this,b,c.p,{fz:.36,toe:42,t:[2,16],bot:b=>Math.min(b.hip('R')[1]-b.j('R','kne')[1],h[1]-K.kbFloorH(kg)-.012),sc:[-.01,.01],arms:b=>{h=hang(b,.042,.1);},xm:()=>[[V.add(h,[0,-.17,0]),kg/75]]});
    K.kettlebell(E,h,{kg});E.shadow([0,0,0],.6,.45,.55);}});

GA.def('lib_air_squat',{title:'Sentadilla con peso corporal',cam:{yaw:32,pitch:8},
  muscles:{quads:1,glutes:.7,adductors:.4},labels:['Cuádriceps','Glúteos','Aductores'],init:{p:0,act:.45},
  timeline:TL(2,1.2,['Baja · brazos al frente','Abajo · muslos paralelos','Sube empujando el suelo','Arriba · cadera extendida']),
  build(c,b,E){SQ(this,b,c.p,{fz:.15,toe:12,t:[2,36],arms:b=>reach(b,mix(-84,2,sst(0,.8,c.p)))});E.shadow([0,0,0],.5,.4,.55);}});

const chair=(E,x,h)=>{const w=K.COL.wood,d=K.COL.woodD;E.boxA([x,h-.02,0],[.42,.04,.42],w,{layer:-1});
  for(const a of[-1,1])for(const z of[-1,1])E.beam([x+a*.18,0,z*.18],[x+a*.18,h-.04,z*.18],.035,d,{layer:-2});
  for(const z of[-1,1])E.beam([x-.19,h,z*.18],[x-.22,h+.42,z*.18],.035,d,{layer:-2});E.boxA([x-.215,h+.33,0],[.03,.14,.42],w,{layer:-2,pitch:-4});};
GA.def('lib_chair_squat',{title:'Sentadilla a la silla',cam:{yaw:34,pitch:9},
  muscles:{quads:1,glutes:.75,adductors:.35},labels:['Cuádriceps','Glúteos'],init:{p:0,act:.45},
  timeline:[{p:1,dur:2.4,label:'Siéntate atrás despacio',act:.85},{dur:.4,label:'Roza la silla · sin caer',act:.9},
    {p:0,dur:1.4,label:'Levántate con los talones',act:1},{dur:.6,label:'Arriba',act:.45}],
  build(c,b,E){const SH=.45,cx=K.memo(this,'cx',()=>{SQ(this,b,1,{fz:.15,toe:10,t:[2,40],bot:b=>K.low(b,['gluR','gluL','pel'],[0,SH,0])-.004,arms:b=>reach(b,0)});return b.pf.o[0]-.04;});
    SQ(this,b,c.p,{fz:.15,toe:10,t:[2,40],bot:b=>K.low(b,['gluR','gluL','pel'],[0,SH,0])-.004,arms:b=>reach(b,mix(-84,0,sst(0,.8,c.p)))});
    chair(E,cx,SH);E.shadow([-.1,0,0],.6,.4,.55);}});

GA.def('lib_sumo_squat_bw',{title:'Sentadilla sumo con peso corporal',cam:{yaw:46,pitch:8},
  muscles:{quads:1,adductors:.8,glutes:.8},labels:['Cuádriceps','Aductores','Glúteos'],init:{p:0,act:.45},
  timeline:TL(2.2,1.2,['Baja recto · rodillas afuera','Abajo · tronco erguido','Sube apretando glúteos','Arriba']),
  build(c,b,E){SQ(this,b,c.p,{fz:.36,toe:42,t:[2,14],dep:0,arms:clasp});E.shadow([0,0,0],.6,.45,.55);}});

GA.def('lib_pistol_squat',{title:'Sentadilla pistol',cam:{yaw:40,pitch:8},
  muscles:{quads_R:1,glutes_R:.8,adductors_R:.35,abs:.3},labels:['Cuádriceps','Glúteos'],init:{p:0,act:.5},
  timeline:[{p:1,dur:2.8,label:'Baja controlando',act:.85},{dur:.3,label:'Abajo · talón apoyado',act:.95},
    {p:0,dur:1.6,label:'Sube sobre una pierna',act:1},{dur:.7,label:'Arriba · equilibrio',act:.5}],
  build(c,b,E){const p=c.p;SQ(this,b,p,{feet:{R:[-.03,.045],L:[-.03,-.09]},toe:6,z:.055,t:[3,38],kB:142,
    arms:b=>{free(b,'L',mix(46,86,sst(0,.9,p)),mix(18,6,sst(0,.9,p)));reach(b,mix(-12,6,sst(0,.7,p)));}});E.shadow([.15,0,0],.55,.35,.55);}});

GA.def('lib_wall_sit',{title:'Sentadilla isométrica en pared',cam:{yaw:42,pitch:8},fitBox:[[-.3,0,-.45],[.5,1.3,.45]],
  muscles:{quads:1,glutes:.45,adductors:.3},labels:['Cuádriceps','Glúteos'],init:{p:0,act:.95},note:'Aguanta 45 s',
  timeline:[{p:1,dur:2.2,label:'Aguanta · inhala',act:.9,ease:'sin'},{p:0,dur:2.2,label:'Aguanta · exhala',act:1,ease:'sin'}],
  build(c,b,E){const p=c.p,AX=.3,ky=DM.ankH+DM.sh,hx=AX-Math.sqrt(DM.th**2-(.11-DM.hipW)**2);
    b.pelvis([hx,ky,0],{tilt:4});b.spine(-1-1.5*p);b.head(2);b.scap('both',.004*p,-.01);
    for(const[s,k]of SS){b.footFlat(s,[AX-DM.heel,0,k*.11],-k*6);b.leg(s,null,[1,.2,k*.1]);b.arm(s,b.tpt(-k*.11,-.12,.17+.004*p),b.tdir(k*.6,-1,.5));}
    const wx=K.memo(this,'wx',()=>K.low(b,['gluR','gluL','tho','shd'],[0,0,0],[1,0,0]));K.wall(E,{x:wx-.1,h:1.5,w:.6});E.shadow([0,0,0],.55,.4,.5);}});

GA.def('lib_band_squat',{title:'Sentadilla con banda elástica',cam:{yaw:34,pitch:8},
  muscles:{quads:1,glutes:.8,adductors:.4},labels:['Cuádriceps','Glúteos','Aductores'],init:{p:0,act:.45},
  timeline:TL(2.2,1.3,['Baja · pecho alto','Abajo · muslos paralelos','Sube contra la banda','Arriba · tensión máxima']),
  build(c,b,E){SQ(this,b,c.p,{fz:.14,toe:12,t:[3,32],sc:[.01,0],arms:b=>{for(const[s,k]of SS)b.arm(s,b.tpt(k*.235,-.03,.14),b.tdir(k*.3,-1,.5),[0,0,1]);}});
    for(const[s,k]of SS){const a=b.j(s,'ank'),kn=b.j(s,'kne');K.band(E,[[a[0]+.03,.004,a[2]],V.add(kn,[.02,0,k*.07]),b.j(s,'grip')],null,{handle:[0,0,1],col:K.BAND.green,L0:1.2});}
    E.cap([b.j('R','ank')[0]+.03,.004,.1],[b.j('L','ank')[0]+.03,.004,-.1],.007,.007,K.BAND.green);E.shadow([0,0,0],.5,.4,.55);}});

GA.def('lib_miniband_squat',{title:'Sentadilla con minibanda',cam:{yaw:40,pitch:8},
  muscles:{quads:1,glutes:.8,abductors:.45},labels:['Cuádriceps','Glúteos','Glúteo medio'],init:{p:0,act:.5},
  timeline:TL(2.2,1.3,['Baja · rodillas afuera','Abajo · tensa la banda','Sube sin juntar rodillas','Arriba']),
  build(c,b,E){SQ(this,b,c.p,{fz:.15,toe:14,t:[2,34],arms:clasp});
    const P={};for(const[s]of SS)P[s]=V.lerp(b.hip(s),b.j(s,'kne'),.84);K.miniband(E,P.R,P.L,{axis:[V.sub(b.j('R','kne'),b.hip('R')),V.sub(b.j('L','kne'),b.hip('L'))],r:.058});E.shadow([0,0,0],.5,.4,.55);}});

const TA=[1.45,2.45,0];
const trx=(ctx,b,E,p,o)=>{const R=K.armD(4),q=Object.assign({bx:mix(.03,-.1,p)},o),L=K.memo(ctx,'L',()=>{SQ(ctx,b,1,Object.assign({},q,{bx:-.1,arms:b=>{if(o.leg)o.leg(b);reach(b,35);}}));
    return V.dist(V.add(TA,[0,0,.06]),b.sho('R'))-R+(o.m||.01);});
  q.arms=b=>{if(o.leg)o.leg(b);for(const[s,k]of SS){const S=b.sho(s),d=V.sub(V.add(TA,[0,0,k*.06]),S),D=V.len(d),u=V.mul(d,1/D),ca=K.clamp((R*R+D*D-L*L)/(2*R*D),-1,1);
    b.arm(s,V.add(S,V.add(V.mul(u,R*ca),V.mul(V.norm(V.perp([0,-1,0],u)),R*Math.sqrt(1-ca*ca)))),[-.2,-1,k*.3],[0,0,1]);}};
  SQ(ctx,b,p,q);
  K.trx(E,TA,b.j('R','grip'),b.j('L','grip'));E.beam([TA[0],TA[1]+.04,-.4],[TA[0],TA[1]+.04,.4],.08,C.frame);};
GA.def('lib_trx_squat',{title:'Sentadilla en TRX',cam:{yaw:34,pitch:7},fitBox:[[-.7,0,-.5],[1.15,1.9,.5]],
  muscles:{quads:1,glutes:.7,adductors:.3},labels:['Cuádriceps','Glúteos'],init:{p:0,act:.45},
  timeline:TL(2.2,1.3,['Baja · cadera atrás','Abajo · muslos paralelos','Sube con las piernas','Arriba · brazos estirados']),
  build(c,b,E){trx(this,b,E,c.p,{fz:.15,toe:12,t:[3,24]});E.shadow([0,0,0],.6,.4,.55);}});

GA.def('lib_trx_pistol',{title:'Sentadilla pistol asistida en TRX',cam:{yaw:38,pitch:7},fitBox:[[-.7,0,-.5],[1.15,1.9,.5]],
  muscles:{quads_R:1,glutes_R:.8,adductors_R:.3,calves_R:.25},labels:['Cuádriceps','Glúteos'],init:{p:0,act:.5},
  timeline:[{p:1,dur:2.8,label:'Baja lento · una pierna',act:.85},{dur:.3,label:'Abajo · controla',act:.95},
    {p:0,dur:1.5,label:'Sube · brazos solo de ayuda',act:1},{dur:.6,label:'Arriba',act:.5}],
  build(c,b,E){const p=c.p;trx(this,b,E,p,{feet:{R:[-.03,.045],L:[-.03,-.09]},toe:6,z:.055,m:.03,t:[3,30],kB:122,leg:b=>free(b,'L',mix(46,84,sst(0,.9,p)),mix(18,8,sst(0,.9,p)))});E.shadow([0,0,0],.55,.35,.55);}});

GA.def('lib_squat_cable',{title:'Sentadilla en cable',cam:{yaw:30,pitch:8},fitBox:[[-.55,0,-.45],[1.25,1.9,.45]],
  muscles:{quads:1,glutes:.8,adductors:.4},labels:['Cuádriceps','Glúteos','Aductores'],init:{p:0,act:.45},
  timeline:TL(2.3,1.3,['Baja · pecho alto','Abajo · muslos paralelos','Sube desde los talones','Arriba · cable tenso']),
  build(c,b,E){let cl=[0,1,0];const P=[.85,.12,0],o={fz:.16,toe:14,t:[3,26],dep:.02,bx:-.01,sc:[-.005,0],arms:b=>{const m=b.tpt(0,-.2,.21);
      for(const[s,k]of SS)b.arm(s,V.add(m,b.tdir(k*.055,0,0)),b.tdir(k*.3,-1,.2),UP);cl=V.madd(m,V.norm(V.sub(P,m)),.13);}};
    const d0=K.memo(this,'d0',()=>{SQ(this,b,1,o);return V.dist(P,cl);});SQ(this,b,c.p,o);
    E.rope(cl,b.j('R','grip'),b.j('L','grip'));E.cable(cl,V.add(P,[-.03,.03,0]));tower(E,1.05,V.dist(P,cl)-d0+.03);E.shadow([.2,0,0],.6,.4,.55);}});

GA.def('lib_belt_squat',{title:'Sentadilla con cinturón en máquina',cam:{yaw:30,pitch:9},fitBox:[[-.6,0,-.6],[1.3,2.0,.6]],
  muscles:{quads:1,glutes:.8,adductors:.5},labels:['Cuádriceps','Glúteos','Aductores'],init:{p:0,act:.45},
  timeline:TL(2.4,1.3,['Baja · pecho alto','Abajo · muslos paralelos','Sube empujando el suelo','Arriba']),
  build(c,b,E){const PH=.2,HB=[.4,1.2],o={fz:.2,toe:16,y:PH,t:[3,22],sc:[0,.01],arms:b=>{for(const[s,k]of SS)b.arm(s,[HB[0],HB[1],k*.22],[-.3,-1,k*.3],[0,0,1]);},xm:()=>[[b.ppt(0,-.1,.1),60/75]]};
    const y0=K.memo(this,'y0',()=>{SQ(this,b,1,o);return b.ppt(0,-.03,.14)[1];});SQ(this,b,c.p,o);
    const hk=b.ppt(0,-.03,.14),fp=[.04,.05,0],el=K.ells(b),bo=b.ppt(0,.1,-.01),BR='#7a5232';let q=null,f0;
    for(let i=0;i<=16;i++){const d=b.pdir(Math.sin(i*Math.PI/8),0,Math.cos(i*Math.PI/8));let r=.15;   // cinturón ceñido a pelvis y glúteos
      for(let j=0;j<4;j++)r-=Math.min(...['pel','gluR','gluL','lum'].map(k=>K.sgap(el[k],V.madd(bo,d,r),.02)));
      const n=V.madd(bo,d,r);if(q)E.cap(q,n,.022,.022,BR);else f0=n;q=n;}
    E.cap(f0,hk,.012,.012,BR);E.sph(hk,.016,C.chrome);E.line(hk,V.add(fp,[-.035,0,0]),.016,C.chrome);E.pulley(fp,[0,0,1],.035);E.cable(V.add(fp,[0,-.035,0]),[.88,.015,0]);
    for(const[s,k]of SS){E.boxA([0,PH/2,k*.25],[.75,PH,.32],C.frameD,{layer:-1});E.boxA([0,PH-.003,k*.25],[.72,.006,.3],'#1d2126',{layer:-1,outline:false});}
    E.beam([HB[0]+.03,0,0],[HB[0]+.03,HB[1],0],.06,C.frame);E.bar([HB[0],HB[1],-.4],[HB[0],HB[1],.4],{r:.016});tower(E,1.12,hk[1]-y0+.03,{py:.05});E.shadow([0,0,0],.6,.45,.4);}});

})(window.GymAnim);
