/* ex/n_squat_mach_calf.js */
/* Familia squat_mach_calf: sentadillas en máquina (hack, péndulo, V), prensa a una pierna, gemelos (de pie, sentado,
   en prensa), sentadilla sissy y extensión de rodilla con banda. */
(function(GA){
const K=GA._.kit,V=GA._.V,C=GA._.COL,DM=GA._.DIM,SS=K.SS,mix=K.mix,D=Math.PI/180,UP=[0,1,0],X=[1,0,0],Z=[0,0,1],KC=K.COL;
const st=(dur,label,act,p)=>p==null?{dur,label,act}:{p,dur,label,act};
const TL=(a,b,c,d)=>[st(a[0],a[1],a[2]||1,1),st(b[0],b[1],b[2]||1),st(c[0],c[1],c[2]||.75,0),st(d[0],d[1],d[2]||.5)];
const CALF=TL([1.1,'Sube al máximo'],[1,'Aguanta 1 s arriba'],[2.6,'Baja lento · estira'],[.6,'Abajo · estira sin rebote',.55]);
const tip=(b,s,Ed,n,f0,a,bo)=>{const sv=V.norm(V.cross(n,f0)),r=Math.max(a,0)*D,f=V.rot(f0,sv,r),u=V.rot(n,sv,r),
    an=V.add(V.madd(Ed,f0,bo==null?.035:bo),V.add(V.mul(f,.06-DM.toe),V.mul(u,DM.ankH)));
  K.footOn(b,s,V.madd(an,n,-V.dot(V.sub(an,Ed),n)),f,u,n);
  if(a<0){const q=a*D;b.foot(s,V.add(Ed,V.rot(V.sub(b.j(s,'ank'),Ed),sv,q)),V.rot(f,sv,q),V.rot(u,sv,q));}
  return b.j(s,'ank');};
const wallL=(b,E,y)=>{E.boxA([.05,1.2,-.53],[1.5,2.4,.06],'#2a333d',{layer:-2});K.palm(b,E,'L',[.12,y,-.5],{fd:UP,n:Z,pole:[-.3,-1,-.6]});};
const onHip=(b,s)=>{const k=K.sd(s);b.arm(s,b.ppt(k*.2,.09,.01),b.pdir(k,0,-.8),b.pdir(0,1,0));};

const calfStand=(b,E,p,o)=>{const T=.2,a=mix(-16,30,p),one=o.one;
  for(const[s,k]of SS)if(!one||k>0)tip(b,s,[0,T,one?.1:k*.11],UP,X,a);
  const A=b.j('R','ank').slice(),L=K.legD(5),z=one?.035:0;
  const pose=x=>{const dz=A[2]-z-DM.hipW,h=Math.sqrt(L*L-(x-A[0])**2-dz*dz);b.pelvis([x,A[1]+h,z],{tilt:Math.atan2(x-A[0],h)/D,roll:one?-2:0});
    K.trunk(b,{sp:[-1,one?2:0],hd:2,sc:o.sc});
    if(one){b.leg('R',null,[1,.1,.08]);b.legDir('L',[.12,-1,.05],[-1,-.5,.04]);b.footRelax('L',25);}else K.legs(b,{up:.1});
    o.arms(b);return o.res?o.res(b):K.com(b,o.xm&&o.xm())[0]-.03;};
  const e0=b.ikErr,x=K.root(pose,A[0]-.3,A[0]+.3);b.ikErr=e0;pose(x);
  K.box(E,[.19,0,0],[.38,T,.9],{kind:'step'});E.shadow([.05,0,0],.45,.35,.5);};
const CAM={yaw:-36,pitch:8},FB=[[-.3,.08,-.3],[.3,1.95,.3]];
const calfDef=(key,title,mus,labels,o)=>GA.def(key,Object.assign({title,cam:CAM,fitBox:FB,muscles:mus,labels,timeline:CALF},o));

calfDef('lib_calf_raise_bb','Elevación de talones con barra',{calves:1},['Gemelos'],{
  build(c,b,E){let bar;calfStand(b,E,c.p,{sc:[.012,-.03],xm:()=>[[bar,60/75]],
      arms:b=>{bar=b.tpt(0,-.03,-.064);for(const[s,k]of SS)b.arm(s,[bar[0],bar[1],k*.42],[-.45,-1,k*.3],Z);}});
    K.barbell(E,bar,Z,{plates:[.225]});K.rack(E,{x:.85,hook:1.4});E.trace('barra',V.add(bar,[0,0,1.1]));}});

const BX=-.03;
calfDef('lib_calf_smith','Elevación de talones en Smith',{calves:1},['Gemelos'],{
  build(c,b,E){let bar;calfStand(b,E,c.p,{sc:[.012,-.03],res:()=>bar[0]-BX,
      arms:b=>{bar=b.tpt(0,-.03,-.064);for(const[s,k]of SS)b.arm(s,[bar[0],bar[1],k*.42],[-.45,-1,k*.3],Z);}});
    for(const k of[-1,1]){E.beam([BX,0,k*.6],[BX,2.2,k*.6],.06,C.frame);E.beam([BX-.5,.03,k*.6],[BX+.55,.03,k*.6],.07,C.frameD,{layer:-1});
      E.boxA([BX,bar[1],k*.6],[.1,.13,.1],C.frameD);E.cyl([BX,bar[1],k*.66],[BX,bar[1],k*.69],.04,C.chrome);E.plate([BX,bar[1],k*.725],Z,.225);}
    E.beam([BX,2.2,-.63],[BX,2.2,.63],.07,C.frame);E.bar([BX,bar[1],-1.02],[BX,bar[1],1.02],{r:.0145});E.trace('barra',[BX,bar[1],1.02]);}});

const dbHang=(b,s)=>{b.armFK(s,{abd:9,elbow:6,grip:X});return b.j(s,'grip');};
calfDef('lib_calf_raise_db','Elevación de talones con mancuernas',{calves:1,forearms:.3},['Gemelos','Antebrazo'],{
  build(c,b,E){const g={};calfStand(b,E,c.p,{xm:()=>[[g.R,.2],[g.L,.2]],arms:b=>{for(const[s]of SS)g[s]=dbHang(b,s);}});
    for(const[s]of SS)E.dumbbell(g[s],X,{r:.055,hl:.065});}});

calfDef('lib_calf_raise_single_db','Elevación de talones a una pierna con mancuerna',{calves_R:1,forearms_R:.25},['Gemelos','Antebrazo'],{
  build(c,b,E){let g;calfStand(b,E,c.p,{one:1,xm:()=>[[g,.2]],arms:b=>{g=dbHang(b,'R');K.palm(b,null,'L',[.12,1.36,-.5],{fd:UP,n:Z,pole:[-.3,-1,-.6]});}});
    wallL(b,E,1.36);E.dumbbell(g,X,{r:.055,hl:.065});}});

calfDef('lib_calf_raise_bw','Elevación de talones con peso corporal',{calves:1},['Gemelos'],{
  build(c,b,E){calfStand(b,E,c.p,{arms:b=>{for(const[s]of SS)onHip(b,s);}});}});

calfDef('lib_calf_raise_single','Elevación de talones a una pierna con peso corporal',{calves_R:1},['Gemelos'],{
  build(c,b,E){calfStand(b,E,c.p,{one:1,arms:b=>{onHip(b,'R');K.palm(b,null,'L',[.12,1.36,-.5],{fd:UP,n:Z,pole:[-.3,-1,-.6]});}});wallL(b,E,1.36);}});

const calfSeat=(b,p,SY,EX,FY)=>{K.seat(b,[0,SY,0],{tilt:4,sp:[2],hd:4,sc:[0,.01],legs:false});const a=mix(-20,30,p);
  for(const[s,k]of SS){tip(b,s,[EX,FY,k*.12],UP,X,a);b.leg(s,null,[.2,1,k*.02]);}
  return s=>{const h=b.hip(s),kn=b.j(s,'kne');return V.madd(V.lerp(h,kn,.8),V.norm(V.perp(UP,V.sub(kn,h))),.062);};};
const SCAM={yaw:-14,pitch:12};
GA.def('lib_calf_seated',{title:'Elevación de talones sentado en máquina',cam:SCAM,fitBox:[[-.3,0,-.3],[.95,1.35,.3]],muscles:{calves:1},labels:['Gemelos'],timeline:CALF,
  build(c,b,E){const SY=.48,EX=.5,FY=.12,q=calfSeat(b,c.p,SY,EX,FY),PR=.045,qr=q('R'),Q=[qr[0],qr[1]+PR,0],P=[-.14,.27];
    E.cyl([Q[0],Q[1],-.22],[Q[0],Q[1],.22],PR,C.pad);E.cyl([Q[0],Q[1],-.29],[Q[0],Q[1],.29],.014,C.chrome);
    const dr=V.norm([Q[0]-P[0],Q[1]-P[1],0]),en=V.madd(Q,dr,.38);
    for(const k of[-1,1]){const z=[0,0,k*.27],pv=[P[0],P[1],k*.27];
      E.beam([P[0],0,k*.27],pv,.06,C.frame,{layer:-1});E.disc(pv,Z,.045,.03,C.frameD,{hub:.4});
      E.beam(pv,V.add(en,z),.05,C.frame);E.cyl(V.add(en,z),V.add(en,[0,0,k*.5]),.025,C.chrome);
      E.plate(V.add(en,[0,0,k*.34]),Z,.225);E.plate(V.add(en,[0,0,k*.39]),Z,.165,{th:.035});
      K.palm(b,E,k>0?'R':'L',[Q[0]-.02,Q[1]+PR,k*.17],{fd:X,n:UP});}
    E.pad([-.25,SY-.04,0],[.15,SY-.04,0],.38,.08,C.pad,{up:UP,layer:-1});E.beam([-.05,0,0],[-.05,SY-.08,0],.08,C.frame,{layer:-2});
    E.boxA([EX+.12,FY/2,0],[.24,FY,.5],C.frame,{layer:-1});E.boxA([EX+.12,FY-.002,0],[.23,.006,.48],'#1d2127',{layer:-1,outline:false});
    E.beam([-.35,.03,0],[EX+.3,.03,0],.08,C.frameD,{layer:-2});E.beam([-.14,.03,-.3],[-.14,.03,.3],.06,C.frameD,{layer:-2});
    E.shadow([.15,0,0],.6,.4,.5);}});
GA.def('lib_calf_seated_db',{title:'Elevación de talones sentado con mancuerna',cam:SCAM,fitBox:[[-.3,0,-.4],[.85,1.35,.4]],muscles:{calves:1},labels:['Gemelos'],timeline:CALF,
  build(c,b,E){const SY=.45,EX=.47,FY=.14,q=calfSeat(b,c.p,SY,EX,FY),R=.06,qr=q('R'),g=[qr[0],qr[1]+R,0];
    E.dumbbell(g,Z,{r:R,hl:.08,len:.13});
    for(const[s,k]of SS)K.palm(b,E,s,[g[0],g[1]+R,k*.105],{fd:X,n:UP,pole:[-1,-.4,k*.5]});
    K.box(E,[-.3,0,0],[1.1,SY,.3],{kind:'bench'});K.box(E,[EX+.19,0,0],[.38,FY,.8],{kind:'step'});E.shadow([.05,0,0],.7,.4,.5);}});

const R2=Math.SQRT1_2,PD=[R2,R2,0],PN=[-R2,R2,0],PF=V.xy(110),PP=V.xy(200),PH=[0,.6,0];
const pAt=(u,w,z)=>[PH[0]+PD[0]*u+PN[0]*w,PH[1]+PD[1]*u+PN[1]*w,z||0];
const pressBody=b=>{b.pelvis(PH,{tilt:-58});b.spine(0);b.head(-4);b.scap('both',0,-.01);
  for(const[s,k]of SS)b.arm(s,b.ppt(k*.3,-.03,.06),b.pdir(k,.1,-.5),b.pdir(0,0,1));};
const B=(bias,o)=>Object.assign({layer:-1,bias},o);
const plates=(E,c,k,u)=>{for(const[d,r]of[[0,.225],[.05,.225],[.095,.165]])E.plate(V.add(c,[0,0,k*(u+d)]),Z,r,{th:r<.2?.035:.045});};
const pressMachine=(b,E,O,hu)=>{const F=b.pdir(0,0,1),L1={layer:-1},L2={layer:-2},RN=-.53,dn=(u,w,z)=>V.add(V.add(O,V.add(V.mul(PD,u),V.mul(PN,w))),[0,0,z]);
  E.pad(b.ppt(0,-.07,-.17),b.ppt(0,.86,-.17),.44,.08,C.pad,{up:F,layer:-1});E.pad(b.ppt(0,-.135,-.15),b.ppt(0,-.135,.07),.44,.08,C.pad,{up:b.pdir(0,1,0),layer:-1});
  const sb=b.ppt(0,-.2,.02),bb=b.ppt(0,.48,-.24);E.beam([sb[0],0,0],sb,.07,C.frame,L2);E.beam([bb[0],0,0],bb,.07,C.frame,L2);E.beam(b.ppt(0,-.2,-.2),bb,.06,C.frameD,L2);
  for(const k of[-1,1]){const g=b.ppt(k*.3,-.03,.06);
    E.cyl(V.madd(g,F,.045),V.madd(g,F,.075),.017,C.rubber);E.cyl(V.madd(g,F,-.075),V.madd(g,F,-.045),.017,C.rubber);E.beam(V.madd(g,F,-.08),b.ppt(k*.22,-.13,-.06),.025,C.frameD);
    E.beam(pAt(-.25,RN-.06,k*.2),pAt(1.3,RN-.06,k*.2),.07,C.frame,L1);E.cyl(pAt(0,RN,k*.2),pAt(1.3,RN,k*.2),.02,C.chrome,L1);
    const tp=pAt(1.3,RN-.06,k*.2);E.beam([tp[0]+.03,0,k*.2],[tp[0]+.03,tp[1]+.05,k*.2],.07,C.frame,L1);E.boxA(pAt(.4,RN+.03,k*.2),[.05,.06,.07],C.accent,{pitch:45});}
  E.beam(pAt(1.25,RN-.06,-.2),pAt(1.25,RN-.06,.2),.06,C.frameD,L1);E.beam([-.7,.03,0],[1.45,.03,0],.09,C.frameD,L2);
  for(const x of[-.62,.14,1.4])E.beam([x,.03,-.34],[x,.03,.34],.06,C.frameD,L2);
  const PC=V.add(V.madd(O,PP,-.075),V.mul(PF,.07));
  E.box(V.madd(PC,PP,-.018),[V.mul(PP,.018),V.mul(PF,.33),[0,0,.38]],'#6a7482',L1);E.box(dn(.2,-.35,0),[V.mul(PD,.22),V.mul(PN,.04),[0,0,.25]],C.frameD,B(.4));
  for(const k of[-1,1]){const g1=V.add(V.madd(V.madd(PC,PF,.31),PP,-.035),[0,0,k*.25]),g2=V.add(V.madd(V.madd(PC,PF,-.31),PP,-.035),[0,0,k*.25]),hc=dn(hu||.02,-.42,0);
    E.poly([g1,g2,dn(0,-.33,k*.25),dn(.4,-.33,k*.25)],C.frameD,B(.3));for(const u of[-.12,.36])E.boxA(dn(u,-.41,k*.2),[.09,.05,.07],'#2a3038',{pitch:45,layer:-1,bias:.3});
    E.cyl(V.add(hc,[0,0,k*.25]),V.add(hc,[0,0,k*.62]),.025,C.chrome);plates(E,hc,k,.36);}
  E.shadow([.25,0,0],1.1,.5,.55);};
const PCAM={yaw:-30,pitch:20};
const calfGlow=(b,E,c,pf)=>{const w=c.act==null?.6:c.act;for(const[S,k]of SS){const kn=b.j(S,'kne'),an=b.j(S,'ank'),sd=V.norm(V.sub(an,kn)),po=V.neg(V.norm(V.perp(pf,sd)));
  E.over({k:'glow',grp:'sh'+S,c:V.add(V.lerp(kn,an,.3),V.add([0,0,k*.035],V.mul(po,.025))),ax:[V.mul(sd,.11),V.mul(po,.03),[0,0,.03]],n:V.norm(V.add([0,0,k*.9],V.mul(po,.4))),w:w*.8});}};
GA.def('lib_leg_press_single',{title:'Prensa a una pierna',cam:PCAM,fitBox:[[-.62,0,-.4],[1.25,1.62,.36]],
  muscles:{quads_R:1,glutes_R:.8,adductors_R:.4},labels:['Cuádriceps','Glúteos','Aductores'],
  timeline:TL([3,'Baja en 3 s · rodilla a 90°',.8],[.3,'Pausa · cadera apoyada',.9],[1.4,'Empuja con todo el pie'],[.6,'Arriba · sin bloquear']),
  build(c,b,E){pressBody(b);const FZ=.04,dz=FZ-DM.hipW,sOf=t=>Math.sqrt(K.legD(t)**2-.0144-dz*dz),O=pAt(mix(sOf(12),sOf(90),c.p),-.12),a=10*D;
    const fw=V.add(V.mul(PF,Math.cos(a)),[0,0,Math.sin(a)]);b.foot('R',[O[0],O[1],FZ],fw,PP);b.leg('R',null,fw);
    b.footFlat('L',[.4,0,-.38],14);b.leg('L',null,[1,.5,-.4]);pressMachine(b,E,O);}});
GA.def('lib_calf_leg_press',{title:'Elevación de talones en prensa',cam:PCAM,fitBox:[[-.62,0,-.36],[1.25,1.62,.36]],muscles:{calves:1},labels:['Gemelos'],timeline:CALF,
  build(c,b,E){pressBody(b);const a=mix(-15,28,c.p),L=K.legD(8),eg=(s,z)=>V.add(V.madd(V.madd(pAt(s,-.12),PP,-.075),PF,-.26),[0,0,z]);
    const w=V.sub(tip(b,'R',eg(0,.13),PP,PF,a),b.hip('R')),wd=V.dot(w,PD),s=-wd+Math.sqrt(wd*wd-V.dot(w,w)+L*L);
    for(const[S,k]of SS){tip(b,S,eg(s,k*.13),PP,PF,a);b.leg(S,null,V.add(PF,[0,0,k*.1]));}
    pressMachine(b,E,pAt(s,-.12),.3);calfGlow(b,E,c,PF);}});

const tower=(E,Cp,P1,base,lift)=>{const T=E.stack(base,{h:1.7,lift,n:12,sel:6,w:.26,bias:.3}),P2=[base[0],P1[1],base[2]],L2={layer:-2};
  for(const k of[-1,1])E.beam([base[0],0,base[2]+k*.17],[base[0],P1[1]+.06,base[2]+k*.17],.06,C.frame,L2);
  E.beam([base[0],P1[1]+.08,base[2]-.2],[base[0],P1[1]+.08,base[2]+.2],.06,C.frame,L2);E.beam([P1[0],P1[1]+.08,0],[base[0],P1[1]+.08,base[2]],.05,C.frameD,L2);
  E.pulley(P1,Z,.045);E.pulley(P2,[1,0,0],.045);E.cable(Cp,P1);E.cable(P1,P2);E.cable(P2,T);};
const sqm=(sp,b,E,p,o)=>{const np=V.xy(90+o.phi),fv=V.xy(o.phi);
  for(const[s,k]of SS){const f=V.rot(fv,np,-k*o.to*D);K.footOn(b,s,V.add(V.madd(V.madd(o.P,fv,o.hx),f,DM.heel),[0,0,k*o.fw]),f,np,np);}
  const A=b.j('R','ank').slice(),pose=q=>{const h=o.path(q);b.pelvis([h[0],h[1],0],{tilt:h[2]});K.trunk(b,o);return V.dist(b.hip('R'),A);};
  const qq=K.memo(sp,'q',()=>[o.kT,o.kB].map(kf=>K.root(q=>pose(q)-K.legD(kf),0,1)));
  const q=mix(qq[0],qq[1],p);pose(q);for(const[s,k]of SS)b.leg(s,null,V.add(b.S[s].ffwd,[0,.5,k*.1]));
  E.box(V.madd(o.P,np,-.02),[V.mul(fv,.3),V.mul(np,.02),[0,0,.36]],'#5d6673',{layer:-1});
  E.shadow([0,0,0],.8,.5,.5);return q-qq[0];};
const sled=(b,E)=>{const U=b.tdir(0,1,0),A=b.ppt(0,0,-.13),Bk=b.tpt(0,-.15,-.105),ax=V.norm(V.sub(Bk,A)),n=V.norm(V.perp(b.pdir(0,0,1),ax));
  E.pad(V.madd(V.madd(A,ax,-.12),n,-.04),V.madd(V.madd(A,ax,.62),n,-.04),.4,.08,C.pad,{up:n,layer:-1});
  for(const[s,k]of SS){const G=b.tpt(k*.27,-.08,.13),F=b.tdir(0,0,1);
    E.pad(b.tpt(k*.13,.055,-.1),b.tpt(k*.13,.055,.09),.09,.07,C.pad,{up:U});E.beam(b.tpt(k*.13,.09,-.1),b.tpt(k*.13,.09,-.2),.04,C.frameD);
    E.beam(b.tpt(k*.2,.09,-.15),b.tpt(k*.27,-.08,-.15),.03,C.frameD);E.beam(b.tpt(k*.27,-.08,-.15),V.madd(G,F,-.06),.03,C.frameD);
    E.cyl(V.madd(G,F,-.065),V.madd(G,F,.06),.017,C.rubber);b.arm(s,G,b.tdir(k*.35,-1,-.3),F);}
  return V.madd(V.madd(A,ax,.25),n,-.12);};

GA.def('lib_hack_squat',{title:'Sentadilla hack',cam:{yaw:38,pitch:8},fitBox:[[-.75,0,-.4],[.65,1.75,.4]],
  muscles:{quads:1,glutes:.7,adductors:.4},labels:['Cuádriceps','Glúteos','Aductores'],
  timeline:TL([2.6,'Baja controlando',.8],[.4,'Abajo · espalda pegada',.9],[1.4,'Empuja con todo el pie'],[.6,'Arriba · sin bloquear']),
  build(c,b,E){const m=V.xy(-50),U=V.neg(m);
    const u=sqm(this,b,E,c.p,{phi:12,P:[.4,.11,0],hx:-.12,fw:.13,to:12,kT:12,kB:112,sp:[0],hd:-4,sc:[.01,0],path:q=>{const h=V.madd([-.32,1.02,0],m,.65*q);return[h[0],h[1],-40];}});
    const S=sled(b,E),R0=V.madd(S,U,(.12-S[1])/U[1]),R1=V.madd(S,U,(1.9-S[1])/U[1]);
    for(const k of[-1,1]){const z=[0,0,k*.22];
      E.cyl(V.add(R0,z),V.add(R1,z),.022,C.chrome,{layer:-1});E.beam(V.add(V.madd(R0,m,-.02),[-.07,0,k*.22]),V.add(R1,[-.07,0,k*.22]),.06,C.frame,{layer:-2});
      E.beam([R1[0]-.07,0,k*.22],[R1[0]-.07,R1[1],k*.22],.07,C.frame,{layer:-2});E.beam([R0[0]-.2,.03,k*.22],[.75,.03,k*.22],.07,C.frameD,{layer:-2});
      for(const t of[-.15,.25])E.boxA(V.add(V.madd(S,U,t),[0,0,k*.22]),[.08,.06,.06],C.frameD);}
    E.box(S,[V.mul(U,.42),V.mul(m,0),[0,0,.24]],C.frameD,{layer:-1});E.beam(V.add(R1,[-.07,0,-.26]),V.add(R1,[-.07,0,.26]),.06,C.frame,{layer:-2});
    tower(E,V.madd(S,U,.42),R1,[R1[0]+.25,0,-.62],u*.65);}});

const PV=[-1.36,.9],PH0=[0,1.08];
GA.def('lib_pendulum_squat',{title:'Sentadilla péndulo',cam:{yaw:40,pitch:8},fitBox:[[-.9,0,-.4],[.7,1.74,.4]],
  muscles:{quads:1,glutes:.6,adductors:.4},labels:['Cuádriceps','Glúteos','Aductores'],
  timeline:TL([2.8,'Baja · rodillas al frente',.8],[.4,'Abajo · espalda apoyada',.9],[1.4,'Sube sin bloquear'],[.6,'Arriba · sin bloquear']),
  build(c,b,E){const d=V.sub(PH0,PV);
    sqm(this,b,E,c.p,{phi:10,P:[.3,.16,0],hx:-.08,fw:.13,to:12,kT:10,kB:120,sp:[0],hd:-4,sc:[.01,0],
      path:q=>{const a=-q*28*D,ca=Math.cos(a),sa=Math.sin(a);return[PV[0]+d[0]*ca-d[1]*sa,PV[1]+d[0]*sa+d[1]*ca,-12+q*28];}});
    const S=sled(b,E),P3=[PV[0],PV[1],0],ar=V.norm(V.sub(S,P3)),hc=V.madd(P3,ar,.5),L2={layer:-2};
    E.beam(P3,S,.08,C.frame,{layer:-1});E.box(S,[V.mul(ar,.06),V.mul(V.cross(Z,ar),.25),[0,0,.2]],C.frameD,{layer:-1});
    E.cyl([PV[0],PV[1],-.2],[PV[0],PV[1],.2],.03,C.chrome,L2);E.cyl(V.add(hc,[0,0,-.42]),V.add(hc,[0,0,.42]),.025,C.chrome);
    for(const k of[-1,1]){E.beam([PV[0]-.3,.03,k*.2],[PV[0],PV[1]+.05,k*.2],.07,C.frame,L2);E.beam([PV[0]+.3,.03,k*.2],[PV[0],PV[1]+.05,k*.2],.07,C.frame,L2);
      E.disc([PV[0],PV[1],k*.2],Z,.06,.04,C.frameD,{hub:.4,layer:-2});E.beam([PV[0]-.35,.03,k*.2],[.7,.03,k*.2],.07,C.frameD,L2);
      plates(E,hc,k,.14);}
    E.beam([.3,.03,0],[.3,.12,0],.1,C.frameD,L2);E.beam([PV[0]-.35,.03,-.2],[PV[0]-.35,.03,.2],.06,C.frameD,L2);}});

const VP=[1.05,.95],VA=[-.02,1.62],VR=Math.hypot(VA[0]-VP[0],VA[1]-VP[1]),VB=Math.atan2(VA[1]-VP[1],VP[0]-VA[0]);
const vArc=q=>{const a=VB-q*.42;return[VP[0]-VR*Math.cos(a),VP[1]+VR*Math.sin(a),0];};
GA.def('lib_vsquat',{title:'Sentadilla en V-squat',cam:{yaw:32,pitch:16},fitBox:[[-.6,0,-.45],[.7,1.75,.45]],
  muscles:{quads:1,glutes:.7,adductors:.4},labels:['Cuádriceps','Glúteos','Aductores'],
  timeline:TL([2.6,'Baja controlado',.8],[.4,'Abajo · rodilla a 90° o más',.9],[1.3,'Empuja con los talones'],[.6,'Arriba · sin bloquear']),
  build(c,b,E){const o={phi:6,P:[-.02,.1,0],hx:-.14,fw:.14,to:14,kT:10,kB:102,sp:[-2],hd:-3,sc:[.012,0]};
    o.path=q=>{const t=mix(6,30,q),A=vArc(q);o.hd=-3-t*.3;b.pelvis([0,0,0],{tilt:t});K.trunk(b,o);const c0=b.tpt(0,.055,0);return[A[0]-c0[0],A[1]-c0[1],t];};
    sqm(this,b,E,c.p,o);const A=b.tpt(0,.055,0),dr=V.norm(V.sub(A,[VP[0],VP[1],0])),U=b.tdir(0,1,0),L2={layer:-2};
    for(const[s,k]of SS){const z=[0,0,k*.3],ar=V.add(A,z),G=V.add(V.madd(ar,dr,-.3),[0,-.1,-k*.035]);
      E.beam(V.add([VP[0],VP[1],0],z),V.madd(ar,dr,.17),.06,C.frame);E.pad(b.tpt(k*.12,.055,-.1),b.tpt(k*.12,.055,.1),.1,.07,C.pad,{up:U});
      E.beam(b.tpt(k*.17,.055,0),ar,.04,C.frameD);E.beam(V.madd(ar,dr,-.3),V.add(G,[0,0,k*.035]),.03,C.frameD);
      E.cyl(V.add(G,[0,-.06,0]),V.add(G,[0,.06,0]),.017,C.rubber);b.arm(s,G,[-.2,-1,k*.6],UP);
      const ht=V.madd(ar,dr,.14),hc=V.madd(ht,[-dr[1],dr[0],0],.42);E.beam(ht,hc,.05,C.frame);E.cyl(hc,V.add(hc,[0,0,k*.28]),.025,C.chrome);plates(E,hc,k,.08);
      E.beam([VP[0]+.05,0,k*.38],[VP[0]+.05,VP[1]+.05,k*.38],.08,C.frame,L2);E.beam([-.45,.03,k*.38],[VP[0]+.2,.03,k*.38],.07,C.frameD,L2);}
    E.cyl([VP[0],VP[1],-.42],[VP[0],VP[1],.42],.03,C.chrome);E.beam([-.02,.03,-.38],[-.02,.03,.38],.06,C.frameD,L2);E.beam([-.45,.03,-.38],[-.45,.03,.38],.06,C.frameD,L2);}});

GA.def('lib_sissy_squat',{title:'Sentadilla sissy',cam:{yaw:30,pitch:8},fitBox:[[-.45,0,-.45],[.55,1.75,.3]],
  muscles:{quads:1,abs:.3},labels:['Cuádriceps','Abdomen'],
  timeline:TL([2.6,'Baja · rodillas al frente',.8],[.4,'Abajo · cadera estirada',.9],[1.6,'Sube con los cuádriceps'],[.6,'Arriba · de puntillas']),
  build(c,b,E){const p=c.p,kf=mix(5,118,p),G=[.17,.95,-.4];
    for(const[s,k]of SS)K.footBallOn(b,s,[.14,0,k*.12],-k*6,mix(18,36,p));
    const A=b.j('R','ank').slice(),pose=sg=>{const t=kf-sg,kn=[A[0]+DM.sh*Math.sin(sg*D),A[1]+DM.sh*Math.cos(sg*D)];
      b.pelvis([kn[0]-DM.th*Math.sin(t*D),kn[1]+DM.th*Math.cos(t*D),0],{tilt:-t});K.trunk(b,{sp:[-3],hd:t*.55,sc:[0,.01]});
      for(const[s,k]of SS)b.leg(s,null,[1,.3,k*.08]);b.arm('L',G,[-.2,-1,-.6],UP);b.armFK('R',{flex:80-t,abd:8,elbow:12});
      return K.com(b)[0]-.12+.08*p;};
    const e0=b.ikErr,sg=K.root(pose,0,85);b.ikErr=e0;pose(sg);
    E.cyl([G[0],0,G[2]],[G[0],1.9,G[2]],.022,C.frame);E.disc([G[0],.01,G[2]],UP,.16,.02,C.frameD,{layer:-1});E.shadow([.1,0,0],.45,.35,.5);}});

const chair=(E,x,h)=>{const w=KC.wood,d=KC.woodD;E.boxA([x,h-.02,0],[.42,.04,.42],w,{layer:-1});
  for(const a of[-1,1])for(const z of[-1,1])E.beam([x+a*.18,0,z*.18],[x+a*.18,h-.04,z*.18],.035,d,{layer:-2});
  for(const z of[-1,1])E.beam([x-.19,h,z*.18],[x-.22,h+.44,z*.18],.035,d,{layer:-2});E.boxA([x-.215,h+.35,0],[.03,.14,.42],w,{layer:-2,pitch:-4});};
GA.def('lib_band_leg_ext',{title:'Extensión de cuádriceps con banda elástica',cam:{yaw:34,pitch:12},fitBox:[[-.3,0,-.3],[.95,1.32,.3]],
  muscles:{quads_R:1},labels:['Cuádriceps'],
  timeline:TL([1.5,'Estira la rodilla del todo'],[1,'Aprieta 1 s'],[3,'Baja lento en 3 s'],[.5,'Abajo · sin apoyar el pie']),
  build(c,b,E){const SH=.46,h=K.seat(b,[-.04,SH,0],{tilt:-3,sp:[2],hd:5,sc:[0,-.01],legs:false}),th=mix(80,3,c.p);
    b.footFlat('L',[h[0]+.42,0,-.15],8);b.leg('L',null,[1,.5,-.1]);b.legDir('R',[1,-.02,.02],V.xy(-1-th));b.footRelax('R',-8);
    for(const[s,k]of SS)K.palm(b,E,s,[h[0]+.06,SH,k*.205],{fd:X,n:UP,pole:[-.4,0,k]});
    const a=b.j('R','ank'),ax=V.norm(V.sub(b.j('R','kne'),a)),cf=V.madd(a,ax,.04),an=[-.22,.12,.165],r=V.madd(cf,V.norm(V.perp(V.sub(an,cf),ax)),.052),L=V.dist(an,r),w=.009/Math.sqrt(L/.6);
    E.cyl(V.madd(cf,ax,-.028),V.madd(cf,ax,.028),.046,KC.strap);E.sph(r,.01,C.chrome);E.cap(an,r,w,w,K.BAND.green,{layer:-2});E.cyl([-.22,.1,.18],[-.22,.14,.18],.024,K.BAND.green,{layer:-2});
    chair(E,-.04,SH);E.trace('tobillo',a);E.shadow([.1,0,0],.6,.4,.5);}});

})(window.GymAnim);
