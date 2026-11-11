/* ex/n_pull_vertical.js */
(function(GA){
const K=GA._.kit,V=GA._.V,C=GA._.COL,DM=GA._.DIM,SS=K.SS,mix=K.mix,sst=K.sst,M=Math,RD=K.D,L={layer:-1},FR=C.frame,FD=C.frameD,X=[1,0,0],Z=[0,0,1];
const T=(u,a,h,b,d,c,r,e)=>[{p:1,dur:u,label:a,act:1},{dur:h,label:b,act:1},{p:0,dur:d,label:c,act:.75},{dur:r,label:e,act:.5}];
const BM=(E,a,b,w,c,o)=>E.beam(a,b,w,c||FR,o);
const mid=b=>V.lerp(b.sho('R'),b.sho('L'),.5);
const clear=(b,P,d,g)=>{const e=K.ells(b),f=x=>M.min(...K.HEAD.map(n=>K.sgap(e[n],[x,P[1],e[n][0][2]],.015)))-g;
  return f(P[0])>=0?P:[K.root(f,P[0],P[0]+d*.4),P[1],P[2]];};

const SY=.47,HY=SY+.09;
function station(E,b,clip,c0,px,rx){
  E.pad([-.25,SY-.04,0],[.2,SY-.04,0],.38,.08,C.pad);BM(E,[0,0,0],[0,SY-.08,0],.08);BM(E,[-.35,.03,0],[.95,.03,0],.09,FD,L);
  const ky=HY+.065,sx=rx+.26;BM(E,[sx,.03,0],[sx,ky,0],.05);E.cyl([rx,ky,-.22],[rx,ky,.22],.05,C.pad);BM(E,[rx,ky,0],[sx,ky,0],.04);
  for(const k of[-1,1])BM(E,[.8,0,k*.18],[.8,2.38,k*.18],.06);BM(E,[.8,2.38,-.21],[.8,2.38,.21],.07);BM(E,[px-.07,2.38,0],[.88,2.38,0],.08);
  const po=[px-.05,2.3,0];E.pulley([px,2.3,0],Z,.05);E.pulley([.75,2.3,0],Z,.05);E.cable(po,clip);E.cable([px,2.35,0],[.75,2.35,0]);
  E.cable([.8,2.3,0],E.stack([.8,0,0],{h:1.5,lift:V.dist(po,clip)-V.dist(po,c0),n:14,sel:6,yaw:0,w:.28,bias:.25}));
  for(const[s,k]of SS){b.footFlat(s,[.43,0,k*.15],-k*6);b.leg(s,null,[1,.3,k*.1]);}
  E.shadow([.2,0,0],.75,.45,.55);}
function attach(E,h,v,up){if(!v){const BL=.55,cl=V.add(h,[0,.05,0]);E.bar([h[0],h[1],-BL],[h[0],h[1],BL],{r:.013});
    for(const k of[-1,1]){E.bar([h[0],h[1],k*BL],[h[0]-.04,h[1]-.07,k*(BL+.06)],{r:.013});E.line([h[0],h[1],k*.12],cl,.006,C.cable);}return cl;}
  const ga=V.norm(V.perp(X,up)),ap=V.madd(h,up,.17);
  for(const k of[-1,1]){const g=V.add(h,[0,0,k*.055]);E.cyl(V.madd(g,ga,-.065),V.madd(g,ga,.065),.016,C.rubber);
    for(const e of[-1,1])E.bar(V.madd(g,ga,e*.065),ap,{r:.009});}
  E.sph(ap,.016,C.chrome);return ap;}
function PD(t,mus,lab,tl,o){return{title:t,cam:o.cam||{yaw:-26,pitch:6},fitBox:[[-.45,0,-.62],[.85,1.88,.62]],muscles:mus,labels:lab,timeline:tl,
  build(c,b,E){const p=c.p,hd=o.hd||[-8,-4],R=.622;
    const pose=q=>{b.pelvis([o.x||0,HY,0],{tilt:o.ln});b.spine(-2-2*q);b.head(mix(hd[0],hd[1],q));b.scap('both',mix(.035,-.018,q),mix(.012,-.03,q));};
    pose(0);const s0=b.sho('R'),dz=o.hz-s0[2],tx=o.tx||.06,top=[s0[0]+tx,s0[1]+M.sqrt(R*R-dz*dz-tx*tx),0];
    pose(1);const bot=o.bot(b);pose(p);
    let h=V.lerp(top,bot,p);h[0]+=o.d*.02*M.sin(M.PI*p);h=clear(b,h,o.d,o.v?.1:.025);
    const up=V.norm(V.sub([o.px||0,2.3,0],h)),P0=o.pl[0],P1=o.pl[1];
    for(const[s,k]of SS){const pl=V.lerp(P0,P1,p);b.arm(s,[h[0],h[1],k*o.hz],[pl[0],pl[1],k*pl[2]],o.v?V.norm(V.perp(X,up)):Z);}
    const cl=attach(E,h,o.v,up);station(E,b,cl,V.add(top,o.v?V.mul(up,.17):[0,.05,0]),o.px||0,.36+(o.x||0));E.trace('agarre',V.add(h,[0,0,o.v?.12:.45]));}};}

GA.def('lib_pulldown_close',PD('Jalón al pecho con agarre cerrado',{lats:1,midback:.6,biceps:.6,reardelts:.3},['Dorsales','Romboides','Bíceps'],
  T(1.3,'Tira hacia el pecho · codos abajo',.6,'Aprieta · pecho arriba',2.6,'Sube lento · estira el dorsal',.5,'Estira arriba'),
  {hz:.055,ln:-16,v:1,d:1,bot:b=>b.tpt(0,-.17,.2),pl:[[.1,-.3,1],[-.25,-1,.35]]}));
GA.def('lib_pulldown_supine',PD('Jalón al pecho con agarre supino',{lats:1,biceps:.7,midback:.5},['Dorsales','Bíceps','Romboides'],
  T(1.3,'Tira hacia el pecho · codos pegados',.6,'Aprieta abajo',2.6,'Sube lento',.5,'Brazos estirados'),
  {hz:.2,ln:-13,d:1,bot:b=>b.tpt(0,-.08,.17),pl:[[.6,-.3,.6],[.25,-1,.3]]}));
GA.def('lib_lat_pulldown_behind',PD('Jalón tras nuca',{lats:1,midback:.7,biceps:.4,reardelts:.4,traps:.3},['Dorsales','Romboides','Deltoides post.'],
  T(1.4,'Baja a la nuca · cabeza quieta',.5,'Aprieta · codos abajo',2.6,'Sube lento',.5,'Estira arriba'),
  {hz:.42,ln:3,x:.1,d:-1,tx:-.03,hd:[0,8],px:-.06,cam:{yaw:-52,pitch:8},bot:b=>b.tpt(0,.03,-.1),pl:[[0,-.3,1],[-.15,-1,.7]]}));

const legsH=(hf,kn,ft)=>b=>{for(const[s,k]of SS){b.legFK(s,{flex:hf,knee:kn,abd:2});b.footRelax(s,ft==null?32:ft);}};
function hang(b,o){const X0=o.X||0,Y=o.Y,W=o.W,q=o.q||0,R0=K.armD(o.e==null?4:o.e),sc=o.sc||[0,0],g=o.g||'pro',e0=b.ikErr;
  const pl=g==='sup'?[.8,-.4,.35]:g==='neu'?[.45,-.35,.7]:[.15,-.25,1],ax=g==='neu'?X:Z;let cx=X0-.05,cy=Y-.6;
  const place=x=>{b.pelvis([0,0,0],{tilt:o.t||0});b.spine(o.sp||0);b.head(o.hd||0);b.scap('both',sc[0],sc[1]);
    const sm=mid(b);K.shift(b,[x-sm[0],cy-sm[1],-sm[2]]);(o.legs||legsH(4,6))(b);
    for(const[s,k]of SS)b.arm(s,[X0,Y,k*W],[pl[0],pl[1],k*pl[2]],ax);};
  for(let i=0;i<2;i++){place(cx);const S=b.S.R.sho,sm=mid(b),chin=b.hpt(0,-.105,.065)[1]-sm[1],dz=W-(S[2]-sm[2]),dx=X0-S[0];
    cy=mix(Y-M.sqrt(M.max(.01,R0*R0-dz*dz-dx*dx)),Y+.025-chin,q);cx=K.root(x=>{place(x);return K.com(b)[0]-X0-(o.cm||0);},X0-.45,X0+.3);
    if(o.fix){place(cx);if(o.fix(b)<0)cx=K.root(x=>{place(x);return o.fix(b);},cx,cx-.35);}}
  b.ikErr=e0;place(cx);return{x:cx,y:cy};}
const BAR=(E,o)=>K.pullupBar(E,Object.assign({x:0,y:2.3,w:.62},o));
const HB=[[-.55,0,-.68],[.5,2.5,.68]],HBT=(X,x1)=>[[(X||0)-1.07,0,-.64],[x1||.5,2.5,.64]];
const HB2=(b,x,Y)=>{const e=K.ells(b);return M.min(...K.HEAD.map(n=>K.sgap(e[n],[x,Y,e[n][0][2]],.016)))-.012;};
const NS=E=>{const Y=2.3;K.pullupBar(E,{kind:'tower',x:-.3,y:Y,w:.62});for(const k of[-1,1]){const z=k*.25;E.cyl([-.3,Y,z],[.13,Y,z],.016,C.chrome);E.cyl([.01,Y,z],[.12,Y,z],.019,K.COL.grip);}return{y:Y};};
function PU(t,mus,lab,tl,o){return{title:t,cam:{yaw:30,pitch:4},fitBox:o.neu?HBT(-.3):o.kind==='tower'?HBT():HB,muscles:mus,labels:lab,timeline:tl,
  build(c,b,E){const p=c.p,bar=o.neu?NS(E):BAR(E,{kind:o.kind});
    hang(b,{Y:bar.y,W:o.w,g:o.g,X:o.neu?.065:0,q:p,fix:o.neu?null:b=>HB2(b,0,bar.y),t:-o.ln*p,sp:-3*p,hd:-10*p,sc:[mix(.03,-.02,p),mix(.012,-.03,p)],legs:legsH(mix(4,8,p)-o.ln*p+(o.kn?6:0),o.kn?mix(70,80,p):6+10*p)});
    E.trace('barbilla',b.hpt(0,-.105,.065));E.shadow([0,0,0],.4,.3,.45);}};}
GA.def('lib_pullup',PU('Dominadas con agarre prono',{lats:1,midback:.6,biceps:.55,reardelts:.35,forearms:.3},['Dorsales','Romboides','Bíceps'],
  T(1.3,'Sube hasta pasar la barbilla',.5,'Arriba · pecho a la barra',2.4,'Baja controlando · estira',.5,'Abajo · hombros activos'),{w:.36,ln:14}));
GA.def('lib_chinup',PU('Dominadas con agarre supino',{lats:1,biceps:.8,midback:.5,forearms:.3},['Dorsales','Bíceps','Romboides'],
  T(1.3,'Sube · pecho a la barra',.5,'Aprieta arriba',2.4,'Baja controlado',.5,'Brazos estirados'),{w:.2,ln:10,g:'sup',kind:'tower',kn:1}));
GA.def('lib_pullup_neutral',PU('Dominadas con agarre neutro',{lats:1,biceps:.7,midback:.55,forearms:.35},['Dorsales','Bíceps','Romboides'],
  T(1.3,'Sube · pecho alto',.5,'Barbilla sobre las asas',2.4,'Baja hasta estirar',.5,'Abajo · hombros activos'),{w:.25,ln:10,g:'neu',neu:.25,kind:'tower'}));

GA.def('lib_scap_pullup',{title:'Dominadas escapulares',cam:{yaw:-45,pitch:6},fitBox:HB,muscles:{midback:1,lats:.6},labels:['Romboides','Dorsales'],
  timeline:T(1,'Baja hombros · junta escápulas',1,'Aprieta 1 s · codos rectos',1.5,'Sube los hombros lento',.5,'Colgado · brazos rectos'),
  build(c,b,E){const p=c.p,bar=BAR(E,{});hang(b,{Y:bar.y,W:.34,sp:-4*p,hd:-3,sc:[mix(.045,-.025,p),mix(.02,-.03,p)],legs:legsH(3,8)});
    E.trace('hombro',b.sho('R'));E.shadow([0,0,0],.4,.3,.45);}});
GA.def('lib_dead_hang',{title:'Colgarse de la barra (dead hang)',cam:{yaw:30,pitch:4},fitBox:HB,muscles:{forearms:1,lats:.4},labels:['Antebrazo','Dorsales'],
  init:{p:0,act:.9},timeline:[{p:1,dur:2,label:'Aguanta · inhala',act:.85,ease:'sin'},{p:0,dur:2,label:'Hombros activos · exhala',act:1,ease:'sin'}],
  build(c,b,E){const p=c.p,bar=BAR(E,{});hang(b,{Y:bar.y,W:.33,sp:-1-2*p,hd:-2,sc:[.012+.006*p,.005],legs:legsH(3,6+3*p)});E.shadow([0,0,0],.4,.3,.45);}});

const rp=(b,o)=>{const t=o.th-o.sf;hang(b,{Y:2.3,W:.32,t,cm:o.cm,sp:o.sf,hd:o.hd||3,sc:o.sc||[-.015,0],legs:legsH(o.tw+t,o.kn,o.ft)});};
const instep=(b,s)=>{const S=b.S[s];return V.madd(V.madd(S.ank,S.ffwd,.15),S.fup,.04);};
function raise(b,E,o){BAR(E,{kind:'tower'});rp(b,o);E.trace('pies',V.lerp(b.j('R','ank'),b.j('L','ank'),.5));E.shadow([0,0,0],.45,.32,.45);}
GA.def('lib_hanging_knee_raise',{title:'Elevación de rodillas (colgado)',cam:{yaw:34,pitch:4},fitBox:HBT(0,.7),
  muscles:{abs:1,obliques:.45,forearms:.3,quads:.25},labels:['Abdomen','Oblicuos'],
  timeline:T(1.2,'Rodillas al pecho · enrolla',.5,'Pausa arriba',2.5,'Baja controlado · sin balanceo',.5,'Abajo · hombros activos'),
  build(c,b,E){const p=c.p;raise(b,E,{th:mix(0,-8,p),sf:mix(-2,28,sst(.3,1,p)),tw:mix(4,128,p),kn:mix(10,118,p),ft:mix(30,45,p)});}});
GA.def('lib_toes_to_bar',{title:'Pies a la barra (toes to bar)',cam:{yaw:34,pitch:4},fitBox:HBT(0,.6),
  muscles:{abs:1,obliques:.5,lats:.4,quads:.3,forearms:.3},labels:['Abdomen','Oblicuos','Dorsales'],
  timeline:T(1,'Pies a la barra · dorsal firme',.3,'Toca la barra',1.8,'Baja controlando el balanceo',.5,'Colgado · cuerpo hueco'),
  build(c,b,E){const p=c.p,o=(q,tw)=>({th:-34*q,tw:mix(6,tw,q),sf:mix(-2,30,sst(.15,1,q)),kn:mix(6,35,q),ft:mix(30,20,q),cm:-.13*q,sc:[mix(-.015,-.025,q),mix(0,-.02,q)]});
    const tw=K.memo(this,'tw',()=>{const e0=b.ikErr,r=K.root(w=>{rp(b,o(1,w));return instep(b,'R')[0]+.01;},120,195);b.ikErr=e0;return r;});
    raise(b,E,o(p,tw));}});

GA.def('lib_l_sit',{title:'L-sit (escuadra)',cam:{yaw:36,pitch:6},muscles:{abs:1,quads:.6,triceps:.5,obliques:.3},labels:['Abdomen','Cuádriceps','Tríceps'],
  timeline:[{p:1,dur:1.2,label:'Sube las piernas rectas',act:1},{dur:3,label:'Aguanta · hombros abajo',act:1},{p:0,dur:1.4,label:'Baja controlando',act:.7},{dur:.8,label:'Brazos bloqueados',act:.5}],
  build(c,b,E){const p=c.p,ds=K.dipStation(E,{x:0,y:1.2,w:.26}),t=mix(6,-8,p);
    K.support(b,{y:ds.y,w:ds.w,p:0,lean0:t,sp:mix(4,14,p),hd:mix(4,-2,p),legs:legsH(mix(14,92,p)+t,mix(70,2,p),mix(28,42,p))});
    E.shadow([0,0,0],.45,.35,.45);}});

GA.def('lib_pullover_machine',{title:'Pullover en máquina',cam:{yaw:58,pitch:12},fitBox:[[-.75,0,-.55],[.6,1.75,.55]],muscles:{lats:1,pecs:.3,triceps:.3},labels:['Dorsales','Pectoral','Tríceps'],
  timeline:T(1.6,'Codos en arco hasta la cadera',.6,'Aprieta el dorsal',2.8,'Vuelve lento · estira arriba',.5,'Estira · espalda pegada'),
  build(c,b,E){const p=c.p,S2=.48,H2=S2+.09,th=mix(184,-8,p),a=th*RD,f=V.xy(th+2),m=V.mul(V.xy(th),-1),LZ=.38;
    b.pelvis([0,H2,0],{tilt:-8});b.spine(-2);b.head(-2);b.scap('both',0,0);const P=mid(b),G=[];
    for(const[s,k]of SS){const u=V.norm([M.sin(a),-M.cos(a),k*.16]);b.armDir(s,u,f,Z);const el=b.j(s,'elb'),g=b.j(s,'grip');G.push(g);
      const pc=V.madd(V.madd(el,u,-.07),m,.075),hub=[P[0],P[1],k*LZ],ln=V.madd(hub,V.xy(th-90),.27);
      E.pad(V.madd(pc,u,-.13),V.madd(pc,u,.05),.1,.05,C.pad,{up:V.mul(m,-1)});BM(E,hub,ln,.05);BM(E,ln,V.madd(pc,m,.03),.035,FD);
      BM(E,ln,[g[0],g[1],k*LZ],.035,FD);E.cyl([P[0],P[1],k*(LZ-.03)],[P[0],P[1],k*(LZ+.06)],.05,FD);
      BM(E,[P[0]-.05,0,k*(LZ+.06)],[P[0]-.05,P[1]+.06,k*(LZ+.06)],.07);BM(E,[P[0]-.4,.03,k*(LZ+.06)],[P[0]+.35,.03,k*(LZ+.06)],.07,FD,L);}
    E.bar([G[0][0],G[0][1],LZ],[G[1][0],G[1][1],-LZ],{r:.014});
    for(const[s,k]of SS){b.footFlat(s,[.44,0,k*.15],-k*6);b.leg(s,null,[1,.3,k*.1]);}
    E.pad([-.2,S2-.04,0],[.22,S2-.04,0],.38,.08,C.pad,{up:[0,1,0],layer:-1});BM(E,[0,0,0],[0,S2-.08,0],.08);BM(E,[-.8,.03,0],[.5,.03,0],.09,FD,L);
    const bc=b.tpt(0,-.25,-.14),Ud=b.tdir(0,1,0);E.pad(V.madd(bc,Ud,-.26),V.madd(bc,Ud,.2),.34,.07,C.pad,{up:b.tdir(0,0,1),layer:-1});
    BM(E,V.madd(bc,b.tdir(0,0,-1),.05),[-.42,bc[1],0],.05);BM(E,[-.42,0,0],[-.42,P[1]+.06,0],.08);BM(E,[-.42,P[1]+.06,-LZ-.06],[-.42,P[1]+.06,LZ+.06],.07);
    const kn=b.j('R','kne');E.cap([kn[0]-.16,kn[1]+.075,-.2],[kn[0]-.16,kn[1]+.075,.2],.012,.012,'#202429');
    const CR=.14,cz=-LZ-.12,SX=-.7;E.disc([P[0],P[1],cz],Z,CR,.03,FD,{hub:.3});E.sph(V.madd([P[0],P[1],cz+.02],V.xy(th-90),CR*.75),.014,C.chrome);
    E.cable([P[0],P[1]-CR,cz],[SX+.05,P[1]-CR,cz]);E.pulley([SX+.05,P[1]-CR+.04,cz],Z,.04);
    E.cable([SX,P[1]-.14,cz],E.stack([SX,0,cz],{h:1.25,lift:(184-th)*RD*CR*.45,n:12,sel:5,yaw:0,w:.24,bias:.2}));
    for(const k of[-1,1])BM(E,[SX,0,cz+k*.15],[SX,1.35,cz+k*.15],.05);E.shadow([0,0,0],.7,.45,.55);}});

const circX=(A,B,px)=>{const m=[(A[0]+B[0])/2,(A[1]+B[1])/2],dx=A[0]-B[0],dy=A[1]-B[1],l=M.hypot(dx,dy),n=[-dy/l,dx/l],t=(px-m[0])/n[0],P=[px,m[1]+n[1]*t];
  return{P,R:M.hypot(A[0]-P[0],A[1]-P[1]),a0:M.atan2(A[1]-P[1],A[0]-P[0]),a1:M.atan2(B[1]-P[1],B[0]-P[0])};};
GA.def('lib_pulldown_machine_uni',{title:'Jalón a una mano en máquina',cam:{yaw:38,pitch:8},fitBox:[[-.8,0,-.62],[.6,1.95,.62]],
  muscles:{lats_R:1,midback_R:.6,biceps_R:.45,reardelts_R:.3},labels:['Dorsales','Romboides','Bíceps'],
  timeline:T(1.3,'Codo a la cadera',.6,'Aprieta el dorsal',2.6,'Sube lento · estira completo',.5,'Estira arriba'),
  build(c,b,E){const p=c.p,HZ=.3,LZ=.44;
    const pose=q=>{b.pelvis([0,HY,0],{tilt:5});b.spine(-3);b.head(-6);b.scap('R',mix(.035,-.02,q),mix(.015,-.03,q));b.scap('L',.035,.015);};
    pose(0);const s0=b.sho('R'),A=[s0[0]+.14,s0[1]+M.sqrt(.385-.0196-(HZ-s0[2])**2)];pose(1);const s1=b.sho('R'),B=[s1[0]+.12,s1[1]+.04];pose(p);
    const G=circX(A,B,-.52),P=G.P;
    for(const[s,k]of SS){const a=s==='R'?mix(G.a0,G.a1,p):G.a0,d=[M.cos(a),M.sin(a),0],h=[P[0]+G.R*d[0],P[1]+G.R*d[1],k*HZ],e1=[h[0],h[1],k*LZ],hub=[P[0],P[1],k*LZ];
      b.arm(s,h,s==='R'?[-.2,-mix(.3,1,p),.8]:[-.2,-.3,-.8],X);E.cyl(V.madd(h,X,-.065),V.madd(h,X,.065),.017,C.rubber);
      for(const e of[-1,1])BM(E,V.madd(h,X,e*.07),V.madd(e1,X,e*.07),.022,FD);BM(E,V.madd(e1,X,-.07),V.madd(e1,X,.07),.03,FD);
      BM(E,hub,e1,.05);const rr=V.madd(hub,d,-.32);BM(E,hub,rr,.05);E.cyl(rr,V.add(rr,[0,0,k*.2]),.025,C.chrome);
      E.plate(V.add(rr,[0,0,k*.07]),Z,.225);E.plate(V.add(rr,[0,0,k*.12]),Z,.165,{th:.035});E.cyl(V.add(hub,[0,0,-k*.03]),V.add(hub,[0,0,k*.06]),.045,FD);
      if(s==='R')E.trace('maneral',h);}
    for(const[s,k]of SS){b.footFlat(s,[.43,0,k*.15],-k*6);b.leg(s,null,[1,.3,k*.1]);}
    E.pad([-.25,SY-.04,0],[.2,SY-.04,0],.38,.08,C.pad);BM(E,[0,0,0],[0,SY-.08,0],.08);BM(E,[P[0]-.2,.03,0],[.75,.03,0],.09,FD,L);
    const pc=b.tpt(0,-.2,.165),Fd=b.tdir(0,0,1),Ud=b.tdir(0,1,0);E.pad(V.madd(pc,Ud,-.13),V.madd(pc,Ud,.12),.24,.07,C.pad,{up:V.mul(Fd,-1)});
    BM(E,V.madd(pc,Fd,.05),[.62,pc[1],0],.05);BM(E,[.62,pc[1],0],[.62,0,0],.06);
    for(const k of[-1,1])BM(E,[P[0],0,k*.36],[P[0],P[1]+.06,k*.36],.07);BM(E,[P[0],P[1]+.06,-.4],[P[0],P[1]+.06,.4],.07);BM(E,[P[0],.03,-.45],[P[0],.03,.45],.07,FD,L);
    E.shadow([.1,0,0],.75,.45,.55);}});

GA.def('lib_assisted_pullup',{title:'Dominadas asistidas en máquina',cam:{yaw:-36,pitch:5},fitBox:[[-.5,.15,-.55],[.8,2.5,.55]],
  muscles:{lats:1,midback:.6,biceps:.6,reardelts:.3},labels:['Dorsales','Romboides','Bíceps'],
  timeline:T(1.4,'Sube hasta pasar la barbilla',.5,'Arriba · pecho alto',2.6,'Baja lento · estira',.5,'Abajo · rodillas apoyadas'),
  build(c,b,E){const p=c.p,Y=2.25,W=.33,CX=.62,PV=[.5,.92,0];
    const legs=b=>{for(const[s,k]of SS){b.legDir(s,[M.sin(6*RD),-M.cos(6*RD),k*.03],[-1,-.02,0]);b.footRelax(s,45);}};
    hang(b,{Y,W,q:p,t:-10*p,sp:-3*p,hd:-10*p,sc:[mix(.03,-.02,p),mix(.012,-.03,p)],legs,fix:b=>HB2(b,0,Y)});
    const kn=b.j('R','kne'),ky=kn[1]-.056,dy=ky-.04-PV[1],RL=.45,ax=PV[0]-M.sqrt(RL*RL-dy*dy),pd=[ax,ky-.04,0];
    E.pad([kn[0]-.18,ky-.04,0],[kn[0]+.1,ky-.04,0],.44,.08,C.pad,{up:[0,1,0],layer:-1});BM(E,pd,PV,.06,FR,L);BM(E,[kn[0]-.1,ky-.08,0],[kn[0]+.05,ky-.08,0],.05,FD,L);
    E.cyl([PV[0],PV[1],-.12],[PV[0],PV[1],.12],.04,FD);
    for(const k of[-1,1]){BM(E,[CX,0,k*.2],[CX,2.45,k*.2],.07);BM(E,[0,2.45,k*.46],[CX,2.45,k*.46],.06);BM(E,[0,2.45,k*.46],[0,Y,k*.46],.045,FD);
      BM(E,[-.05,.5,k*.32],[CX,.5,k*.32],.04,FD);E.boxA([.02,.52,k*.32],[.22,.025,.13],'#22262b');}
    BM(E,[CX,2.45,-.48],[CX,2.45,.48],.07);BM(E,[CX-.3,.03,0],[CX+.3,.03,0],.09,FD,L);BM(E,[CX,.03,-.4],[CX,.03,.4],.08,FD,L);
    E.bar([0,Y,-.5],[0,Y,.5],{r:.016});for(const k of[-1,1])E.cyl([0,Y,k*.22],[0,Y,k*.45],.019,K.COL.grip);
    const at=V.lerp(PV,pd,.4),tp=[CX-.08,1.3,0],tq=[CX-.08,2.3,0];E.pulley(tp,Z,.04);E.pulley(tq,Z,.04);E.cable(at,tp);E.cable([CX-.04,1.3,0],[CX-.04,2.3,0]);E.cable([CX-.08,2.34,0],[CX,2.34,0]);
    E.cable([CX+.04,2.3,0],E.stack([CX+.04,0,0],{h:1.6,lift:V.dist(tp,at)-.33,n:14,sel:4,yaw:0,w:.26,bias:.2}));
    E.trace('barbilla',b.hpt(0,-.105,.065));E.shadow([.1,0,0],.6,.4,.5);}});

function tower(E,PU,lift){const z=PU[2],X0=PU[0]+.1,TY=PU[1]+.22,SX=X0+.24,q=[X0+.03,TY-.06,z],r=[SX,TY-.06,z];
  BM(E,[X0,0,z],[X0,TY,z],.1);E.boxA([X0-.05,PU[1],z],[.06,.12,.1],FD);E.pulley(PU,Z,.045);BM(E,[X0,TY,z],[SX+.16,TY,z],.07);BM(E,[SX+.16,0,z],[SX+.16,TY,z],.07);
  BM(E,[X0-.35,.03,z],[SX+.3,.03,z],.08,FD,L);E.pulley(q,Z,.035);E.pulley(r,Z,.035);
  E.cable([PU[0]+.045,PU[1],z],[q[0]-.035,q[1],z]);E.cable(V.add(q,[0,.035,0]),V.add(r,[0,.035,0]));
  E.cable([SX+.035,r[1],z],E.stack([SX+.035,0,z],{h:TY-.3,lift,n:13,sel:5,w:.22,yaw:90,bias:.2}));}
const dH=(E,g,ax,d)=>{const r=V.madd(g,d,.09);E.cyl(V.madd(g,ax,-.06),V.madd(g,ax,.06),.016,C.rubber);for(const k of[-1,1])E.bar(V.madd(g,ax,k*.066),r,{r:.007});E.sph(r,.012,C.chrome);return r;};

GA.def('lib_pulldown_one_arm',{title:'Jalón a una mano en cable',cam:{yaw:-30,pitch:8},fitBox:[[-.5,0,-.45],[.95,2.2,.5]],
  muscles:{lats_R:1,midback_R:.5,biceps_R:.45},labels:['Dorsales','Romboides','Bíceps'],
  timeline:T(1.2,'Codo hacia la cadera',.6,'Aprieta · tronco quieto',2.4,'Sube lento · estira arriba',.5,'Estira el dorsal'),
  build(c,b,E){const p=c.p,PU=[.48,2.22,.2],mt=K.mat(E,[-.2,0,0],[1.2,.6]);
    K.kneel(b,{x:0,y:mt.top,thigh:2,tilt:-4,sp:[-2],hd:-6});b.scap('R',mix(.04,-.02,p),mix(.02,-.03,p));b.scap('L',0,.005);
    const sR=b.sho('R'),g0=V.madd(sR,V.norm(V.sub(PU,sR)),.615),g=V.lerp(g0,b.tpt(.25,-.16,.07),p);g[0]+=.03*M.sin(M.PI*p);
    const d=V.norm(V.sub(PU,g)),ax=V.norm(V.perp(V.lerp(Z,X,p),d));b.arm('R',g,[-.3,-mix(.4,1.2,p),.7],ax);const r=dH(E,g,ax,d);
    K.palm(b,E,'L',b.ppt(-.152,.05,0),{fd:V.norm(b.pdir(0,-1,.35)),n:b.pdir(-1,0,0),pole:[-.5,0,-1]});
    E.cable(r,PU);tower(E,PU,V.dist(PU,r)-V.dist(PU,V.madd(g0,V.norm(V.sub(PU,g0)),.09)));E.trace('maneral',g);E.shadow([0,0,0],.5,.35,.5);}});

GA.def('lib_straight_arm_pulldown_cable',{title:'Jalón con brazos rectos en cable',cam:{yaw:-38,pitch:8},fitBox:[[-.5,0,-.45],[1.05,2.1,.45]],
  muscles:{lats:1,triceps:.3,abs:.25},labels:['Dorsales','Tríceps','Abdomen'],
  timeline:T(1.4,'Cuerda a los muslos',.6,'Aprieta el dorsal',2.6,'Sube lento · codos fijos',.5,'Estira arriba · brazos largos'),
  build(c,b,E){const p=c.p,PU=[.95,1.98,0],R=K.armD(14),RL=.3;
    K.stand(b,{fx:-.16,fz:.14,toe:8,kf:16,tilt:28,sp:[-2],hd:-12,sc:[mix(.025,-.015,p),mix(.025,-.01,p)],balance:true});
    const sm=mid(b),f0=M.atan2(PU[0]-sm[0],sm[1]-PU[1])/RD-8,hand=(f,s,k)=>{const a=f*RD,hz=mix(.07,.12,p),S=b.sho(s),dz=S[2]*k-hz,r=M.sqrt(R*R-dz*dz);
      return[S[0]+r*M.sin(a),S[1]-r*M.cos(a),k*hz];},fi=mix(f0,-4,p),H=[],H0=[];
    for(const[s,k]of SS){const a=fi*RD;H.push(hand(fi,s,k));H0.push(hand(f0,s,k));b.arm(s,H[H.length-1],[-M.cos(a),-M.sin(a),k*.6],Z);}
    const cl=hs=>{const m=V.lerp(hs[0],hs[1],.5),w=V.dist(hs[0],hs[1])/2;return V.madd(m,V.norm(V.sub(PU,m)),M.sqrt(RL*RL-w*w));},C1=cl(H);
    for(const[s,k]of SS)b.S[s].gripAx=V.norm(V.sub(H[k>0?0:1],C1));
    E.rope(C1,H[0],H[1]);E.cable(C1,PU);tower(E,PU,V.dist(PU,C1)-V.dist(PU,cl(H0)));E.trace('cuerda',C1);E.shadow([0,0,0],.45,.32,.55);}});

GA.def('lib_pullup_negative',{title:'Dominadas negativas',cam:{yaw:34,pitch:5},fitBox:[[-.5,0,-.5],[.5,2.45,.5]],
  muscles:{lats:1,biceps:.6,midback:.55,forearms:.3},labels:['Dorsales','Bíceps','Romboides'],init:{p:0,f:0},
  timeline:[{p:.98,dur:.8,label:'Salta desde el cajón',act:.8},{p:1,f:1,dur:.5,label:'Barbilla arriba · pies fuera',act:1},
    {p:0,dur:5,label:'Baja en 5 s hasta estirar',act:.9},{f:0,dur:.9,label:'Apoya los pies en el cajón',act:.5}],
  build(c,b,E){const p=c.p,e=sst(0,1,c.f),BH=.45,FX=-.07,Lm=K.legD(3);BAR(E,{kind:'tower'});K.box(E,[-.12,0,0],[.5,BH,.6],{kind:'wood'});
    const legs=b=>{for(const[s,k]of SS){b.legFK(s,{flex:12,knee:82,abd:2});b.footRelax(s,40);const S=b.S[s],A1=S.ank.slice(),f1=S.ffwd.slice(),u1=S.fup.slice(),f0=V.yaw(-k*6);
      const A0=K.footOn(b,s,[FX,BH,k*.12],f0,[0,1,0]),h=b.hip(s),d=V.dist(h,A0),A=V.lerp(d>Lm?V.madd(h,V.norm(V.sub(A0,h)),Lm):A0,A1,e),eo=sst(.35,1,e);
      const fw=V.norm(V.lerp(f0,f1,eo)),up=V.norm(V.lerp([0,1,0],u1,eo));let lo=9;for(const q of K.shoe(A,fw,up))lo=M.min(lo,q[0][1]-M.hypot(...q[1].map(a=>a[1])));
      if(A[0]>-.42)A[1]+=M.max(0,BH-lo);b.foot(s,A,fw,up);b.leg(s,null,[1,.2,k*.15]);}};
    hang(b,{Y:2.3,W:.34,q:p,t:-12*p,sp:-3*p,hd:-10*p,sc:[mix(.03,-.02,p),mix(.012,-.03,p)],legs,fix:b=>HB2(b,0,2.3)});
    E.trace('barbilla',b.hpt(0,-.105,.065));E.shadow([0,0,0],.45,.35,.45);}});

GA.def('lib_pullup_band',{title:'Dominadas asistidas con banda elástica',cam:{yaw:36,pitch:4},fitBox:HBT(0,.55),
  muscles:{lats:1,midback:.6,biceps:.55,reardelts:.3,forearms:.3},labels:['Dorsales','Romboides','Bíceps'],
  timeline:T(1.3,'Sube · la banda ayuda abajo',.5,'Barbilla sobre la barra',2.4,'Baja lento · rodilla en banda',.5,'Abajo · brazos estirados'),
  build(c,b,E){const p=c.p,Y=2.3,t=-10*p;BAR(E,{kind:'tower'});
    const legs=b=>{b.legFK('R',{flex:52+t,knee:100,abd:4});b.footRelax('R',40);b.legFK('L',{flex:6+t,knee:24,abd:2});b.footRelax('L',35);};
    const lp=b=>{const S=b.S.R,sd=V.norm(V.sub(S.ank,S.kne));return V.madd(V.madd(S.kne,sd,.09),V.norm(V.perp([0,-1,0],sd)),.05);};
    const fix=b=>{const P=lp(b),e=K.ells(b);let g=1;for(let i=1;i<8;i++){const q=V.lerp([0,Y,0],P,i/8);for(const n of['face','head','tho','shd'])g=M.min(g,K.sgap(e[n],[q[0],q[1],e[n][0][2]],.012));}return M.min(g-.012,HB2(b,0,Y));};
    hang(b,{Y,W:.34,q:p,t,sp:-3*p,hd:-8*p,sc:[mix(.03,-.02,p),mix(.012,-.03,p)],legs,fix});
    const P=lp(b),Q=V.add(P,[0,-.012,0]);K.band(E,[[0,Y+.005,-.022],V.add(P,[0,0,-.05]),Q,V.add(P,[0,0,.05]),[0,Y+.005,.022]],null,{col:K.BAND.purple,w:.012,L0:1.3,flat:[1,0,0]});
    E.cyl([0,Y,-.03],[0,Y,.03],.022,K.BAND.purple);E.trace('barbilla',b.hpt(0,-.105,.065));E.shadow([0,0,0],.45,.35,.45);}});

GA.def('lib_band_pulldown',{title:'Jalón al pecho con banda elástica',cam:{yaw:-32,pitch:8},fitBox:[[-.55,0,-.55],[.8,2.15,.55]],
  muscles:{lats:1,midback:.6,biceps:.45,reardelts:.3},labels:['Dorsales','Romboides','Bíceps'],
  timeline:T(1.2,'Codos abajo a los costados',.6,'Aprieta · hombros abajo',2.4,'Sube lento · sin encoger',.5,'Brazos arriba · banda tensa'),
  build(c,b,E){const p=c.p,AN=[.6,1.98,0],mt=K.mat(E,[-.2,0,0],[1.2,.6]);
    K.kneel(b,{x:0,y:mt.top,thigh:2,tilt:-6,sp:[-3],hd:-8,sc:[mix(.03,-.018,p),mix(.012,-.03,p)]});
    for(const[s,k]of SS){const sh=b.sho(s),g0=V.madd(sh,V.norm(V.sub([AN[0],AN[1],k*.1],sh)),.6),g=V.lerp(g0,b.tpt(k*.25,-.13,.1),p);g[0]+=.03*M.sin(M.PI*p);
      b.arm(s,g,[-.3,-mix(.5,1.2,p),k*.8],Z);K.band(E,[AN[0],AN[1],k*.02],b.j(s,'grip'),{handle:Z,col:K.BAND.green,L0:1.05});}
    for(const k of[-1,1])BM(E,[AN[0]+.06,0,k*.48],[AN[0]+.06,2.1,k*.48],.08,K.COL.wood);BM(E,[AN[0]+.06,2.1,-.52],[AN[0]+.06,2.1,.52],.08,K.COL.wood);
    E.boxA([AN[0]+.07,1.03,0],[.04,2.06,.88],'#5a4634',L);E.boxA([AN[0]+.02,AN[1],0],[.04,.05,.07],K.COL.strap);E.boxA([AN[0]+.07,2.07,0],[.06,.02,.06],K.COL.strap);
    E.shadow([0,0,0],.5,.35,.5);}});

const MU={sy:[-.61,-.2,.15,.24,.61],tl:[0,-24,30,26,10],sp:[-2,4,12,8,2],tw:[8,40,10,0,-4],kn:[8,20,12,8,6],px:[.15,-.5,-1,-1,-1],py:[-.25,-.6,.1,.4,.15],
  e:[.03,-.02,0,.02,-.02],pr:[.012,-.03,.02,.02,0],hd:[0,-8,8,6,2]};
const cr=(A,t)=>{const n=A.length-1,x=K.clamp(t,0,1)*n,i=M.min(n-1,M.floor(x)),u=x-i,a=A[M.max(0,i-1)],q=A[i],r=A[i+1],d=A[M.min(n,i+2)];
  return .5*(2*q+(r-a)*u+(2*a-5*q+4*r-d)*u*u+(3*q-a-3*r+d)*u*u*u);};
GA.def('lib_muscle_up',{title:'Muscle-up en barra',cam:{yaw:32,pitch:4},fitBox:[[-1.07,0,-.64],[.5,3.05,.64]],
  muscles:{lats:1,triceps:.7,biceps:.6,lowerpecs:.5,frontdelts:.4},labels:['Dorsales','Tríceps','Bíceps'],
  timeline:[{p:.45,dur:.9,label:'Dominada explosiva',act:1,ease:'in'},{p:.7,dur:.25,label:'Pecho sobre la barra',act:1,ease:'lin'},
    {p:1,dur:.6,label:'Fondo · bloquea arriba',act:1,ease:'out'},{dur:.6,label:'Arriba · brazos bloqueados',act:.9},{p:0,dur:2.6,label:'Baja controlando',act:.7},{dur:.6,label:'Colgado · hombros activos',act:.5}],
  build(c,b,E){const p=c.p,Y=2.3,W=.28,q=k=>cr(MU[k],p),e0=b.ikErr;BAR(E,{kind:'tower',y:Y});
    const pose=x=>{b.pelvis([0,0,0],{tilt:q('tl')});b.spine(q('sp'));b.head(q('hd'));b.scap('both',q('e'),q('pr'));const sm=mid(b);K.shift(b,[x-sm[0],Y+q('sy')-sm[1],-sm[2]]);
      for(const[s,k]of SS){b.legFK(s,{flex:q('tw')+q('tl'),knee:q('kn'),abd:2});b.footRelax(s,30);b.arm(s,[0,Y,k*W],[q('px'),q('py'),k*.45],Z);}};
    const sg=(A,B)=>{const ax=B[0]-A[0],ay=B[1]-A[1],t=K.clamp((-A[0]*ax+(Y-A[1])*ay)/(ax*ax+ay*ay),0,1);return M.hypot(A[0]+ax*t,A[1]+ay*t-Y);};
    const gap=()=>{const e=K.ells(b);let g=1;for(const n of['tho','lum','pel','shd','face','head','hair'])g=M.min(g,K.sgap(e[n],[0,Y,e[n][0][2]],.016));
      for(const[s]of SS)g=M.min(g,sg(b.S[s].hip,b.S[s].kne)-.1);return g;};
    let x=K.root(x=>{pose(x);return K.com(b)[0];},-.45,.35);pose(x);if(gap()<.01)x=K.root(x=>{pose(x);return gap()-.01;},x,x-.5);
    b.ikErr=e0;pose(x);E.trace('pecho',b.tpt(0,-.15,.13));E.shadow([0,0,0],.45,.35,.45);}});

})(window.GymAnim);
