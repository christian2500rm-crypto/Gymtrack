/* ex/n_new_towel.js */
/* En casa con toalla, puerta y pared: remo con toalla en la manilla de una puerta, jalón boca abajo con toalla, curl
   isométrico con toalla, elevación lateral isométrica contra la pared y flexiones pike de rodillas */
(function(GA){
const K=GA._.kit,V=GA._.V,C=GA._.COL,DM=GA._.DIM,SS=K.SS,mix=K.mix,sst=K.sst,M=Math,RD=K.D,UP=[0,1,0],Z=[0,0,1],X=[1,0,0];
const T=(u,a,h,b,d,c,r,e)=>[{p:1,dur:u,label:a,act:1},{dur:h,label:b,act:1},{p:0,dur:d,label:c,act:.75},{dur:r,label:e,act:.5}];
const ISO=(a,b)=>[{p:1,dur:2.2,label:a,act:.95,ease:'sin'},{p:0,dur:2.2,label:b,act:1,ease:'sin'}];
const TW='#d9cfc0',TR=.022;
const towel=(E,pts,g)=>{const o=g?{grp:g}:undefined;for(let i=1;i<pts.length;i++)E.cap(pts[i-1],pts[i],TR,TR,TW,o);};
const fist=(b,s)=>{const S=b.S[s],fd=V.norm(V.sub(S.wri,S.elb)),ga=V.norm(V.perp(S.gripAx||Z,fd));return{g:S.grip,fd,ga,pn:V.norm(V.cross(fd,ga)),fc:V.madd(S.wri,fd,.052)};};
const tail=(E,p,d,l,g)=>towel(E,[p,V.add(p,V.add(V.mul(d,.012),[0,-l*.45,0])),V.add(p,V.add(V.mul(d,.02),[0,-l,0]))],g);

const XD=.42,HY=1.0,AN=[XD-.035,HY,0],LR=.03,DA=33;   // cara de la puerta, altura de la manilla, lazo (centro y radio), inclinación
const dlean=(b,th,q)=>{const r=th*RD,u=[-M.sin(r),M.cos(r),0];
  for(const[s,k]of SS)K.footOn(b,s,[XD-.45,0,k*.1],X,UP);
  const am=V.lerp(b.j('R','ank'),b.j('L','ank'),.5),LL=M.sqrt(K.legD(3)**2-(.1-DM.hipW)**2);
  b.pelvis(V.madd(am,u,LL),{tilt:-th});K.trunk(b,{sp:[-2],hd:4,sc:[-.008*q,mix(.025,-.035,q)]});K.legs(b,{up:0});};
const dch=b=>SS.map(([s,k])=>b.tpt(k*.12,-.27,.168));
const door=E=>{const W=K.COL.wood,WD=K.COL.woodD,z0=.075,z1=z0-.8,DH=2.03,zc=(z0+z1)/2,L2={layer:-2};
  E.boxA([XD+.02,DH/2+.005,zc],[.04,DH-.01,z0-z1],W,L2);
  for(const[y,h]of[[.25,.62],[1.42,.92]])E.boxA([XD-.002,y+h/2,zc],[.006,h,.56],'#86664a',{layer:-1,outline:false});
  for(const z of[z0+.04,z1-.04])E.beam([XD+.03,0,z],[XD+.03,DH+.07,z],.07,WD,{h:.12,layer:-2});
  E.beam([XD+.03,DH+.035,z1-.075],[XD+.03,DH+.035,z0+.075],.12,WD,{h:.07,layer:-2});
  for(const y of[.3,1.75])E.boxA([XD-.004,y,z1+.012],[.012,.1,.024],C.frameD,{layer:-1});
  E.disc([XD-.004,HY,0],X,.028,.008,C.chrome,{hub:0});E.cyl([XD,HY,0],[XD-.062,HY,0],.009,C.chrome);
  E.cyl([XD-.062,HY,.012],[XD-.062,HY,-.125],.011,C.chrome);E.sph([XD-.062,HY,.012],.012,C.chrome);};
GA.def('lib_towel_door_row',{title:'Remo con toalla en el marco de una puerta',cam:{yaw:-38,pitch:8},fitBox:[[-1.0,0,-.45],[XD+.05,1.7,.45]],
  muscles:{midback:1,lats:.7,biceps:.5,reardelts:.4},labels:['Romboides','Dorsales','Bíceps'],
  timeline:T(1.3,'Pecho hacia la puerta',.8,'Junta escápulas',2.4,'Baja controlado',.4,'Brazos estirados'),
  build(c,b,E){const p=c.p,R=K.armD(4),
    G=K.memo(this,'g',()=>{dlean(b,DA,0);const LT=V.dist(AN,b.sho('R'))-R,t1=K.root(t=>{dlean(b,t,1);return V.dist(AN,dch(b)[0])-LT;},0,DA);b.ikErr=0;return{LT,t1};});
    dlean(b,mix(DA,G.t1,p),p);const h1=dch(b),up=b.tdir(0,1,0);
    SS.forEach(([s,k],i)=>{const sh=b.sho(s),g0=V.madd(sh,V.norm(V.sub(AN,sh)),R-.002),g=V.madd(AN,V.norm(V.sub(V.lerp(g0,h1[i],p),AN)),G.LT);
      b.arm(s,g,b.tdir(k*.3,-.5,-.8),up);const F=fist(b,s),top=V.madd(F.g,F.ga,.03),d=V.norm(V.sub(top,AN));
      towel(E,[V.madd(AN,V.norm(V.perp(d,X)),LR),top]);tail(E,V.madd(F.g,F.ga,-.03),V.neg(X),.13,'tt'+s);});
    const ring=[];for(let i=0;i<=10;i++){const a=i*M.PI/5;ring.push(V.add(AN,[0,LR*M.cos(a),LR*M.sin(a)]));}towel(E,ring,'tring');
    door(E);E.shadow([XD-.6,0,0],.6,.35,.5);}
});

const ZH=.26,htop=b=>{const L=K.ells(b);return M.max(...K.HEAD.map(k=>-K.gap(L[k],[0,0,0],[0,-1,0])));};   // y máxima de la cabeza
const drape=(E,p,o,Y,g)=>{const e=V.add(V.madd(p,o,.045),[0,-.09,0]);e[1]=M.max(e[1],Y+TR);towel(E,[p,V.add(V.madd(p,o,.03),[0,-.035,0]),e],g);};
const prone=(b,Y,q)=>K.prone(b,{y:Y,x:-.2,sp:[-mix(10,12,q)],hd:-2,sc:[-.006*q,mix(.02,-.03,q)]});
GA.def('lib_towel_pulldown_floor',{title:'Jalón en el suelo con toalla',cam:{yaw:30,pitch:14},
  muscles:{lats:1,midback:.6,reardelts:.4,biceps:.3,lowback:.3},labels:['Dorsales','Romboides','Deltoides post.'],
  timeline:T(1.3,'Codos a las costillas',.8,'Aprieta la espalda',2.4,'Estira lento',.4,'Brazos largos'),
  build(c,b,E){const p=c.p,mt=K.mat(E,[-.3,0,0],[1.95,.66]),Y=mt.top,R=K.armD(6),e=sst(0,1,p);
    const G=K.memo(this,'g',()=>{prone(b,Y,0);const S0=b.sho('R'),dy=.06,dz=ZH-S0[2];prone(b,Y,1);
      return{h0:[S0[0]+M.sqrt(R*R-dy*dy-dz*dz),S0[1]+dy,ZH],h1:[b.headC[0]-.06,htop(b)+TR+.012,ZH]};});
    prone(b,Y,p);
    for(const[s,k]of SS){const h=V.lerp(G.h0,G.h1,e);h[1]+=.04*M.sin(M.PI*e);b.arm(s,[h[0],h[1],k*ZH],V.lerp([-.2,1,k*.5],[-.7,0,k*.7],e),Z);
      const hp=b.hip(s),ly=Y+.075,lx=-M.sqrt(K.legD(3)**2-(ly-hp[1])**2-.0001);b.leg(s,[hp[0]+lx,ly,k*.1],[0,-1,0]);b.footRelax(s,62);}
    const FR=fist(b,'R'),FL=fist(b,'L');towel(E,[V.madd(FR.g,Z,-.03),V.madd(FL.g,Z,.03)]);
    drape(E,V.madd(FR.g,Z,.03),Z,Y,'ttR');drape(E,V.madd(FL.g,Z,-.03),V.neg(Z),Y,'ttL');
    E.trace('toalla',V.lerp(FR.g,FL.g,.5));E.shadow([0,0,0],1,.3,.5);}
});

const FX=.16,FZ=.06;
GA.def('lib_towel_curl_iso',{title:'Curl de bíceps con toalla',cam:{yaw:50,pitch:8},fitBox:[[-.3,0,-.42],[.5,1.85,.42]],
  muscles:{biceps:1,forearms:.4},labels:['Bíceps','Antebrazo'],note:'Aguanta 30 s',
  timeline:ISO('Tira hacia arriba · aguanta','Codos pegados · respira'),
  build(c,b,E){const p=c.p,ea=mix(88,91,p)*RD,mx=FX+DM.heel+.07;
    K.stand(b,{feet:{R:[FX,FZ,.012],L:[-.08,-.12]},toe:8,kf:6,tilt:1,sp:[-1-1.2*p],hd:2,sc:[.004*p,-.012]});
    E.boxA([mx,.008,FZ],[.075,.014,.15],TW,{layer:-1});   // centro de la toalla, aplastado bajo el arco del pie
    for(const[s,k]of SS){const u=b.tdir(k*.06,-1,.06),a=V.norm(V.perp(b.tdir(-k*.15,0,1),u));b.armDir(s,u,V.add(V.mul(u,M.cos(ea)),V.mul(a,M.sin(ea))),Z);
      const F=fist(b,s),A=[mx,.016,FZ+k*.052],B=[mx+.006,.05,FZ+k*.06],g={grp:'tw'+s};E.cap(A,B,.03,.028,TW,g);E.cap(B,V.madd(F.g,F.pn,.015),.028,.018,TW,g);}
    E.shadow([.05,0,0],.45,.35,.55);}
});

const WZ=.34;
const fmax=(b,s)=>{const F=fist(b,s);return F.fc[2]+M.hypot(.05*F.fd[2],.044*F.ga[2],.03*F.pn[2]);};
GA.def('lib_wall_lateral_raise_iso',{title:'Elevación lateral isométrica en la pared',cam:{yaw:72,pitch:10},fitBox:[[-.35,0,-.42],[.35,1.85,.42]],
  muscles:{sidedelts_R:1,traps_R:.3,frontdelts_R:.2},labels:['Deltoides lateral','Trapecio'],note:'Aguanta 30 s por lado',
  timeline:ISO('Empuja la pared · aguanta','Hombro abajo · respira'),
  build(c,b,E){const p=c.p;K.stand(b,{fz:.12,toe:8,kf:4,tilt:1,sp:[-1-1.2*p],hd:[0,4],sc:[0,0]});b.scap('R',-.006-.004*p,0);
    const ar=a=>{b.armFK('R',{abd:a,flex:3,elbow:4,grip:X});return fmax(b,'R')-WZ+.001;};ar(K.root(ar,0,30));
    b.arm('L',b.ppt(-.19,.1,-.01),[-.35,0,-1],UP);
    E.boxA([-1.47,1.1,WZ+.05],[3.06,2.2,.1],'#26303a',{layer:-2});E.boxA([-1.47,.04,WZ-.006],[3.06,.08,.012],'#323d49',{layer:-1});
    E.shadow([0,0,0],.4,.3,.55);}
});

const XK=-.45,HZ=.23,TH0=3,TL0=112,TH1=42;
const kn=(b,Y,th,tl,q)=>K.kneel(b,{x:XK,y:Y,thigh:th,tilt:tl,sp:[2],hd:mix(-6,-14,q),sc:[mix(.03,.012,q),.005],toes:'tuck'});
GA.def('lib_pike_pushup_knee',{title:'Flexiones pike de rodillas',cam:{yaw:28,pitch:12},
  muscles:{frontdelts:1,triceps:.6,sidedelts:.35,upperpecs:.35},labels:['Deltoides anterior','Tríceps'],
  timeline:[{p:1,dur:2,label:'Baja la cabeza al suelo',act:.85},{dur:.3,label:'Abajo · codos a 45°',act:.95},
    {p:0,dur:1.3,label:'Empuja arriba',act:1},{dur:.6,label:'Cadera alta',act:.5}],
  build(c,b,E){const p=c.p,mt=K.mat(E,[-.11,0,0],[1.8,.62]),Y=mt.top;
    const G=K.memo(this,'g',()=>{const e0=b.ikErr;kn(b,Y,TH0,TL0,0);const S=b.sho('R'),R=K.armD(5),dy=S[1]-Y-.029,dz=HZ-S[2],XH=S[0]+.05+M.sqrt(R*R-dy*dy-dz*dz);
      const tl1=K.root(t=>{kn(b,Y,TH1,t,1);return K.low(b,K.HEAD,[0,Y,0])-.02;},TL0,170);b.ikErr=e0;return{XH,tl1};});
    kn(b,Y,mix(TH0,TH1,p),mix(TL0,G.tl1,p),p);
    for(const[s,k]of SS)K.palm(b,E,s,[G.XH,Y,k*HZ],{pole:[0,1,k*.85]});
    E.shadow([-.05,0,0],.8,.35,.5);}
});

})(window.GymAnim);
