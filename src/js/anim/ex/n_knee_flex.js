/* ex/n_knee_flex.js */
(function(GA){
const K=GA._.kit,V=GA._.V,C=GA._.COL,DM=GA._.DIM,SS=K.SS,mix=K.mix,UP=[0,1,0],Z=[0,0,1],SH=DM.sh,RD=K.D,M=Math,L={layer:-1},FR=C.frame;
const T=(u,a,h,b,d,c,r,e)=>[{p:1,dur:u,label:a,act:1},{dur:h,label:b,act:1},{p:0,dur:d,label:c,act:.75},{dur:r,label:e,act:.5}];
const B=(E,a,b,w,c,l)=>E.beam(a,b,w,c||C.frameD,l?L:0);
const base=(E,x0,x1,xs,w)=>{B(E,[x0,.03,0],[x1,.03,0],.08,0,1);for(const x of xs)B(E,[x,.03,-w],[x,.03,w],.06,0,1);};
const low=(f,u,n)=>{let m=1e9,r;for(const e of K.shoe([0,0,0],f,u)){const x=M.sqrt(e[1].reduce((s,a)=>s+V.dot(a,n)**2,0)),v=V.dot(e[0],n)-x;
  if(v<m){m=v;r=V.sub(e[0],V.mul(e[1].reduce((s,a)=>V.madd(s,a,V.dot(a,n)),[0,0,0]),1/x));}}return r;};

function sup(b,a,hf,an){K.supine(b,{y:.008,x:-.62,at:'sho',incl:-a,sp:[0],sc:[0,-.01],hd:'rest'});let q=0;
  for(const[s,k]of SS){const t=V.norm([...V.xy(a+hf).slice(0,2),k*.03]),kn=V.madd(b.hip(s),t,DM.th),A=an(kn);
    b.legDir(s,t,[A[0]-kn[0],A[1]-kn[1],0]);q=(M.atan2(t[1],t[0])-M.atan2(A[1]-kn[1],A[0]-kn[0]))/RD;}
  return q;}
function supC(b,E,me,p,o){const m=K.memo(me,'a',()=>[0,1].map(i=>K.root(a=>sup(b,a,o.hf[i],o.an(i))-o.kf[i],-10,60)));
  b.ikErr=0;sup(b,mix(m[0],m[1],p),mix(o.hf[0],o.hf[1],p),o.an(p));K.armsFloor(b,E,{y:.008,spread:22});
  K.mat(E,[-.6,0,0],[1.2,.62]);E.shadow([.1,0,0],1,.3,.45);}
const onY=y=>kn=>[kn[0]+M.sqrt(M.max(0,SH*SH-(y-kn[1])**2)),y];
const ft=(sg,n)=>{const f=V.xy(sg),u=V.xy(sg+90);return{f,u,s:low(f,u,n||UP)};};

GA.def('lib_slider_leg_curl',{
  title:'Curl femoral deslizante',
  cam:{yaw:-22,pitch:8},
  muscles:{hams:1,glutes:.6,calves:.25},
  labels:['Isquiotibiales','Glúteos'],
  timeline:T(1.5,'Talones hacia ti · cadera alta',.6,'Aprieta arriba',3,'Estira en 3 s · cadera alta',.5,'Cadera sin tocar el suelo'),
  build(c,b,E){const F=q=>ft(mix(78,28,q));supC(b,E,this,c.p,{hf:[-10,-2],kf:[8,112],an:q=>onY(.012-F(q).s[1])});const f=F(c.p);
    for(const[s]of SS){const A=b.j(s,'ank'),P=V.add(A,f.s);b.foot(s,A,f.f,f.u);E.disc([P[0],.006,P[2]],UP,.085,.012,K.BAND.blue,L);}}
});

const TA=[.62,2.3,0],TL=1.84,BR=.275;
const cc=(P,r1,Q,r2)=>{const dx=Q[0]-P[0],dy=Q[1]-P[1],d=M.hypot(dx,dy),a=(r1*r1-r2*r2+d*d)/(2*d),h=M.sqrt(M.max(0,r1*r1-a*a));
  return[P[0]+a*dx/d+h*dy/d,P[1]+a*dy/d-h*dx/d];};
GA.def('lib_trx_leg_curl',{
  title:'Curl femoral en TRX',
  cam:{yaw:-30,pitch:10},
  fitBox:[[-1.05,0,-.45],[.95,.95,.45]],
  muscles:{hams:1,glutes:.6,calves:.3},
  labels:['Isquiotibiales','Glúteos'],
  timeline:T(1.4,'Talones al glúteo · cadera alta',.6,'Aprieta arriba',3,'Estira lento · sin bajar cadera',.5,'Cuerpo en línea'),
  build(c,b,E){supC(b,E,this,c.p,{hf:[0,25],kf:[4,100],an:()=>kn=>cc(kn,SH,TA,TL)});const H=[];
    for(const[s]of SS){b.footRelax(s,-14);const S=b.S[s],A=S.ank;H.push(V.madd(V.add(A,low(S.ffwd,S.fup,UP)),V.norm(V.sub(TA,A)),.042));}
    K.trx(E,TA,H[0],H[1],{feet:true});E.beam([TA[0],TA[1]+.04,-.5],[TA[0],TA[1]+.04,.5],.08,FR);}
});

GA.def('lib_ball_leg_curl',{
  title:'Curl femoral en fitball',
  cam:{yaw:-30,pitch:10},
  muscles:{hams:1,glutes:.6,calves:.3},
  labels:['Isquiotibiales','Glúteos'],
  timeline:T(1.4,'Rueda el balón al glúteo',.6,'Aprieta · cadera alta',3,'Vuelve lento en 3 s',.5,'Cuerpo en línea'),
  build(c,b,E){const n=q=>V.xy(mix(90,118,q)),F=q=>ft(mix(100,28,q),n(q));
    supC(b,E,this,c.p,{hf:[0,30],kf:[5,100],an:q=>onY(BR+n(q)[1]*BR-F(q).s[1])});const f=F(c.p),N=n(c.p);let x=0,q=null;
    for(const[s]of SS){const A=b.j(s,'ank');b.foot(s,A,f.f,f.u);x=A[0]+f.s[0]-N[0]*BR;}
    const fb=K.fitball(E,[x,BR,0],BR),e=V.mul(V.xy(-x/BR/RD),BR*1.004);
    for(let i=0;i<17;i++){const t=i*M.PI/8,P=V.add(V.madd(fb.c,e,M.cos(t)),[0,0,.276*M.sin(t)]);q&&E.line(q,P,.006,'#2f6aa8',{layer:-1,outline:false});q=P;}}
});

function st1(b,tl,hf,kf,y0,fd){b.footFlat('L',[-.07,y0,-.12],7);const A=b.j('L','ank'),d=K.legD(5);
  b.pelvis([0,A[1]+M.sqrt(d*d-A[0]*A[0]-(A[2]+DM.hipW)**2),0],{tilt:tl});K.trunk(b,{sp:[-2],hd:-4-tl*.5,sc:[0,.015]});
  b.leg('L',null,[1,.1,-.15]);const t=V.xy(hf-90),s=V.xy(hf-90-kf);b.legDir('R',[t[0],t[1],.02],[s[0],s[1],.02]);b.footRelax('R',-fd);
  return{t,s,K:b.j('R','kne'),po:V.xy(hf-180-kf)};}
const route=(E,q,z)=>{for(let i=0;i<q.length-1;i++){E.cable([...q[i],z],[...q[i+1],z]);if(i)E.pulley([...q[i],z],Z,.035);}};

GA.def('lib_leg_curl_standing',{
  title:'Curl femoral de pie en máquina',
  cam:{yaw:-30,pitch:8},
  fitBox:[[-.45,0,-.35],[.9,1.8,.4]],
  muscles:{hams_R:1,calves_R:.3},
  labels:['Isquiotibiales','Gemelos'],
  timeline:T(1.3,'Talón al glúteo · muslo quieto',1,'Aprieta 1 s',3,'Baja lento en 3 s',.5,'Abajo · sin soltar el peso'),
  build(c,b,E){const kf=mix(10,118,c.p),g=st1(b,16,12,kf,.09,6),Kn=g.K,PZ=.27,CZ=.31,PY=b.sho('R')[1]-.25;let hx=0;
    for(const[s]of SS){const S=b.sho(s);b.armDir(s,[M.sqrt(.09-(S[1]-PY-.04)**2),PY+.04-S[1],0],[1,0,0],UP);
      const h=b.j(s,'grip');hx=h[0];E.cyl(V.madd(h,UP,-.07),V.madd(h,UP,.07),.017,C.rubber);}
    E.pad([hx-.42,PY-.035,0],[hx+.03,PY-.035,0],.5,.07,C.pad,{up:UP,layer:-1});
    const o=V.mul(V.xy(12),.098),fa=V.add(V.madd(Kn,g.t,-.06),o),fb=V.add(V.madd(Kn,g.t,-.2),o),tp=V.lerp(fa,fb,.5),CX=hx+.1;
    E.pad(fa,fb,.2,.07,C.pad,{up:V.xy(192)});B(E,[CX,0,0],[CX,PY-.03,0],.08,FR,1);B(E,tp,[CX,tp[1],0],.05);
    const P=[Kn[0],Kn[1],PZ],Q=[Kn[0],Kn[1],CZ],rc=V.madd(V.madd(P,g.s,.37),g.po,.088);
    B(E,[CX,Kn[1],PZ],P,.06,FR);E.disc(Q,Z,.1,.03,C.frameD,{hub:.3});E.cyl(P,Q,.016,C.chrome);
    B(E,P,rc,.045,FR);E.cyl(rc,[rc[0],rc[1],.02],.046,C.pad);
    const SX=CX+.26,top=E.stack([SX,0,CZ],{h:1.3,lift:.02+(kf-10)*RD*.1,n:12,sel:5,w:.24,bias:.2});
    route(E,[[Kn[0]-.1,Kn[1]],[Kn[0]-.1,.035],[SX+.14,.035],[SX+.14,1.36],[SX,1.36],[SX,top[1]+.02]],CZ);
    B(E,[SX+.18,0,CZ],[SX+.18,1.42,CZ],.06,FR,1);B(E,[SX+.2,1.42,CZ],[SX-.04,1.42,CZ],.05,FR,1);
    base(E,-.35,SX+.25,[CX],.4);
    E.boxA([-.02,.045,-.13],[.42,.09,.26],'#2a2f36',L);E.shadow([.2,0,0],.7,.45,.55);}
});

GA.def('lib_leg_curl_cable',{
  title:'Curl femoral de pie en cable',
  cam:{yaw:-30,pitch:8},
  fitBox:[[-.45,0,-.35],[.85,1.75,.35]],
  muscles:{hams_R:1,calves_R:.3},
  labels:['Isquiotibiales','Gemelos'],
  timeline:T(1.3,'Talón al glúteo · muslo quieto',.8,'Aprieta arriba',3,'Baja en 3 s',.5,'Abajo · cable tenso'),
  build(c,b,E){const KF=[15,118],X=.66,LP=[.5,.11,.1],g=st1(b,22,10,mix(KF[0],KF[1],c.p),.05,8);
    for(const[s,k]of SS)b.arm(s,[X,1.08,k*.2],[-.3,-1,k*.6],UP);
    const ring=q=>V.madd(V.madd(g.K,V.xy(-80-q),SH-.04),V.xy(10-q),.05),r=ring(mix(KF[0],KF[1],c.p)),A=b.j('R','ank'),sd=V.norm(V.sub(A,g.K));
    E.cyl(V.madd(A,sd,-.085),V.madd(A,sd,-.025),.043,K.COL.strap);E.sph(r,.012,C.chrome);E.cable(r,LP);E.pulley(LP,Z,.035);
    const top=E.stack([X,0,0],{h:1.6,lift:V.dist(r,LP)-V.dist(ring(KF[0]),LP)+.02,n:14,sel:5,w:.26,bias:.2});
    E.cable([X,1.92,0],[X,top[1]+.02,0]);E.pulley([X,1.92,0],Z,.04);E.cable([LP[0]+.03,LP[1]-.03,.1],[X-.06,.06,0]);
    for(const k of[-1,1])B(E,[X,0,k*.2],[X,2.02,k*.2],.06,FR);B(E,[X,2.02,-.24],[X,2.02,.24],.06);B(E,[LP[0]-.02,LP[1],.1],[X,.06,.1],.04);
    base(E,X-.3,X+.3,[X],.32);E.boxA([-.02,.025,-.14],[.38,.05,.22],'#22262c',L);E.shadow([.15,0,0],.6,.4,.55);}
});

GA.def('lib_leg_curl_db',{
  title:'Curl femoral tumbado con mancuerna',
  cam:{yaw:-28,pitch:16},
  muscles:{hams:1,calves:.4},
  labels:['Isquiotibiales','Gemelos'],
  timeline:T(1.3,'Dobla · cadera pegada',.8,'Aprieta arriba',3,'Baja lento en 3 s',.5,'Abajo · pies juntos'),
  build(c,b,E){const BY=.44,kf=mix(12,95,c.p),ff=[];K.prone(b,{y:BY,x:0,at:'pelvis',hd:-4,sc:[.01,.02]});
    for(const[s,k]of SS){const h=b.hip(s),dy=BY+.06-h[1],t=V.norm([-M.sqrt(DM.th**2-dy*dy),dy,-k*.01]),sa=M.atan2(t[1],t[0])/RD-kf,S=b.S[s],
      q=(k*.069-h[2]-DM.th*t[2])/SH;b.legDir(s,t,[...V.xy(sa).slice(0,2),q/M.sqrt(1-q*q)]);b.foot(s,S.ank,V.xy(sa+94),V.xy(sa+184));ff.push(V.madd(V.madd(S.ank,S.ffwd,.075),S.fup,-.035));b.arm(s,[b.sho('R')[0]+.24,BY-.05,k*.16],[0,-1,k*.6],[1,0,0]);}
    E.dumbbell(V.lerp(ff[0],ff[1],.5),b.S.R.fup,{len:.1,hl:.04,r:.058});
    K.box(E,[b.j('R','kne')[0]+.685,0,0],[1.22,BY,.3],{kind:'bench'});E.shadow([.1,0,0],.95,.35,.5);}
});

GA.def('lib_nordic_curl',{
  title:'Curl nórdico',
  cam:{yaw:-18,pitch:10},
  muscles:{hams:1,glutes:.3,calves:.25},
  labels:['Isquiotibiales','Glúteos'],
  init:{p:0,h:0},
  timeline:[{p:.84,dur:3.4,label:'Baja lo más lento posible',act:.85,ease:'sin'},{p:1,h:1,dur:.6,label:'Frena con las manos',act:.9},
    {p:.86,dur:.5,label:'Empuja con las manos',act:1},{p:0,h:0,dur:1.5,label:'Sube con los femorales',act:1},{dur:.6,label:'Arriba · cuerpo recto',act:.5}],
  build(c,b,E){const th=mix(4,68,c.p),h=c.h||0;
    K.kneel(b,{x:0,y:.05,thigh:th,tilt:th,sp:[0],hd:mix(-4,-30,c.p),sc:[.01,.02],toes:'flat'});
    for(const[s,k]of SS){const S=b.sho(s),d=V.sub([1.02,0,k*.2],S),l=V.len(d);
      K.palm(b,E,s,V.lerp(b.tpt(k*.15,-.17,.3),V.madd(S,d,M.min(1,.66/l)),h),{n:V.lerp(b.tdir(0,0,-1),UP,h),fd:V.lerp(b.tdir(0,1,0),[1,0,-k*.15],h),pole:V.lerp([-.3,-1,k*.5],[-.5,0,k*.7],h),draw:h>.997&&l<.66});}
    K.box(E,[-.3,0,0],[.9,.05,.5],{kind:'soft'});
    const A=b.j('R','ank'),x=A[0]+.06,y=A[1]+.08;E.cyl([x,y,-.22],[x,y,.22],.045,C.pad);
    for(const k of[-1,1]){B(E,[x,y,k*.24],[x-.12,.03,k*.24],.04,FR);E.cyl([x,y,k*.22],[x,y,k*.25],.018,C.chrome);}
    B(E,[x-.16,.03,-.3],[x-.16,.03,.3],.06,0,1);E.shadow([.3,0,0],.9,.35,.5);}
});

GA.def('lib_ghr',{
  title:'Glute ham raise (GHD)',
  cam:{yaw:-30,pitch:6},
  fitBox:[[-.6,0,-.38],[1.35,2.22,.38]],
  muscles:{hams:1,glutes:.6,calves:.3,lowback:.3},
  labels:['Isquiotibiales','Glúteos','Lumbares'],
  timeline:T(1.6,'Sube tirando con femorales',.5,'Arriba · cadera extendida',3,'Baja el torso recto en 3 s',.6,'Abajo · cuerpo horizontal'),
  build(c,b,E){const KY=.98,O=[0,KY,0],th=mix(0,84,c.p),U=V.xy(th),R=.125,A0=V.xy(174,SH),A=V.add(O,A0),Cp=V.madd(O,V.xy(-85),R+.056);
    K.frame(b,V.madd(O,U,DM.th),U,V.xy(th-90));K.trunk(b,{sp:[0],hd:-6,sc:[0,.02]});
    for(const[s,k]of SS){const kn=[0,KY,k*.1];b.legDir(s,V.sub(kn,b.hip(s)),A0);b.foot(s,V.add(kn,A0),[0,-1,0],[1,0,0]);b.arm(s,b.tpt(-k*.1,-.12,.18+(k<0)*.05),b.tdir(k*.3,-1,.5),b.tdir(1,0,0));}
    E.cyl(V.madd(Cp,Z,-.24),V.madd(Cp,Z,.24),R,C.pad,L);E.boxA([A[0]-.095,A[1]-.05,0],[.024,.3,.36],'#2a2f36');
    for(const j of[-1,1]){const P=V.madd(V.madd(A,V.xy(-6),.08),V.xy(84),j*.083);E.cyl([P[0],P[1],-.2],[P[0],P[1],.2],.045,C.pad);}
    B(E,[Cp[0],0,0],[Cp[0],Cp[1],0],.07,FR,1);const x=A[0]-.15;B(E,[x,0,0],[x,A[1]+.1,0],.07,FR,1);B(E,[x,A[1]-.04,0],[x+.07,A[1]-.04,0],.05);
    base(E,A[0]-.4,Cp[0]+.4,[A[0]-.35,Cp[0]+.35],.35);E.shadow([0,0,0],.9,.4,.5);}
});
})(window.GymAnim);
