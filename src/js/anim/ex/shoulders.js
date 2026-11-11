/* ex/shoulders.js */
/* Hombros: elevación lateral en cable, press mancuernas, press máquina, elevación frontal */
(function(GA){
const C=GA._.COL;
function dHandle(E,g,ax,d){const V=E.V,n=V.norm(ax),ap=V.madd(g,d,.085);
  E.cyl(V.madd(g,n,-.06),V.madd(g,n,.06),.016,'#2a2f35');
  for(const k of[-1,1])E.cap(V.madd(g,n,k*.06),ap,.008,.006,C.chrome);
  E.sph(ap,.012,C.chrome);return ap;}

GA.def('lib_lat_raise_cable',{
  title:'Elevación lateral en cable',
  cam:{yaw:74,pitch:8},
  fitBox:[[-.3,0,-.75],[.45,1.88,.95]],
  muscles:{sidedelts_R:1,frontdelts_R:.25},
  labels:['Deltoides lateral'],
  init:{p:0,act:.5},
  timeline:[
    {p:1,dur:1.3,label:'Sube · lidera con el codo',act:1},
    {dur:.5,label:'Pausa a la altura del hombro',act:1},
    {p:0,dur:3,label:'Baja en 3 s · sin encoger',act:.7},
    {dur:.4,label:'Abajo · mantén tensión',act:.5}
  ],
  build(c,b,E){
    const V=E.V,p=c.p,TX=.14,FZ=-.54,TZ=FZ-.17,RX=TX,RZ=FZ+.04;
    b.footFlat('R',[-.04,0,-.02],-8);b.footFlat('L',[-.04,0,-.15],8);
    b.pelvis([-.005,.9325,.03],{roll:2});b.spine(0,4);b.head(-4,0,-5);
    b.scap('R',-.006,.004);b.scap('L',.004,.01);
    for(const s of['R','L'])b.leg(s,null,[1,0,0]);
    const pose=q=>{b.armFK('R',{flex:E.mix(17,0,q),abd:E.mix(-9,91,q),hz:E.mix(4,25,q),elbow:E.mix(14,12,q),rot:E.mix(-10,3,q)});return b.j('R','grip').slice();};
    const g0=pose(0),g=pose(p);
    b.arm('L',[RX,1.02,RZ],[-.35,-1,.25],[0,1,0]);
    const pul=[RX,.17,RZ+.05],d=V.norm(V.sub(g,pul));
    const fd=V.norm(V.sub(g,b.j('R','wri')));let ax=V.norm(V.cross(fd,d));if(V.dot(ax,b.tdir(0,0,1))<0)ax=V.neg(ax);b.S.R.gripAx=ax;
    const ap=dHandle(E,g,ax,V.neg(d));
    E.boxA([TX,.025,TZ],[.44,.05,.46],C.frameD,{layer:-1});
    for(const kx of[-1,1])for(const kz of[-1,1])E.beam([TX+kx*.16,0,TZ+kz*.17],[TX+kx*.16,2.25,TZ+kz*.17],.06,C.frame);
    for(const kx of[-1,1])E.beam([TX+kx*.16,2.22,TZ-.2],[TX+kx*.16,2.22,TZ+.2],.07,C.frame);
    const st=E.stack([TX,.05,TZ],{h:1.95,lift:.015+(V.dist(pul,g)-V.dist(pul,g0))/2,n:16,sel:3,yaw:0,w:.27,bias:.12});
    E.beam([RX,.06,RZ],[RX,2.15,RZ],.06,C.frameD,{bias:.06});
    for(let y=.36;y<2.1;y+=.12)if(Math.abs(y-1.01)>.07)E.line([RX,y,RZ+.032],[RX,y+.022,RZ+.032],.014,'#1a1e23',{bias:.03,outline:false});
    E.boxA([RX,.17,RZ+.02],[.1,.13,.05],C.frame);
    const pn=V.norm(V.cross([0,1,0],d));E.pulley(pul,pn,.045);
    E.cable(ap,pul);E.cable(st,[TX,2.2,TZ],{bias:.12});E.cable([RX,2.2,RZ+.03],[RX,.24,RZ+.03],{bias:.05});
    E.trace('maneral',g);
    E.shadow([0,0,-.05],.45,.4,.55);
  }
});

GA.def('lib_shoulder_press_db',{
  title:'Press de hombros con mancuernas',
  cam:{yaw:68,pitch:8},
  fitBox:[[-.28,0,-.58],[.66,1.72,.58]],
  muscles:{frontdelts:1,sidedelts:.7,triceps:.6},
  labels:['Deltoides ant. y lat.','Tríceps'],
  init:{p:0,act:.8},
  timeline:[
    {p:1,dur:1.4,label:'Empuja arriba · sin bloquear',act:1},
    {dur:.4,label:'Arriba · sin chocar',act:.85},
    {p:0,dur:2.5,label:'Baja en 2,5 s · controla',act:.75},
    {dur:.35,label:'Abajo · codos a 90°',act:.8}
  ],
  build(c,b,E){
    const V=E.V,p=c.p,SH=.45,SP=25*Math.PI/180;
    const bn=E.bench({at:[0,0,0],dir:0,h:SH,seat:.42,back:.8,inc:85,w:.3});
    b.pelvis([.118,SH+.088,0],{tilt:-4});b.spine(-3);b.head(-2);
    b.scap('both',E.mix(-.005,.018,p),E.mix(0,.01,p));
    for(const s of['R','L']){const k=s==='R'?1:-1;b.footFlat(s,[.49,0,k*.2],k*-16);b.leg(s,null,[1,.15,k*.35]);}
    for(const s of['R','L']){const k=s==='R'?1:-1,sh=b.sho(s);
      const dr=6*Math.PI/180,ed=[Math.sin(SP)*Math.cos(dr),-Math.sin(dr),k*Math.cos(SP)*Math.cos(dr)];
      const bot=V.add(V.madd(sh,ed,E.DIM.ua),[0,E.DIM.fa+E.DIM.grip,0]);
      const top=V.add(sh,[.03,.623,k*.012]);
      const e=E.EASE.in(p);const g=[E.mix(bot[0],top[0],p),E.mix(bot[1],top[1],p),E.mix(bot[2],top[2],e)];
      const ax=V.norm([Math.sin(SP)*(1-p*.35),0,k*Math.cos(SP)]);
      b.arm(s,g,V.norm(V.lerp(ed,[.3,-.1,k],p)),ax);
      E.dumbbell(b.j(s,'grip'),ax,{r:.052,hl:.07});
      if(s==='R')E.trace('mancuerna',b.j(s,'grip'));
    }
    E.shadow([.15,0,0],.6,.45,.55);
  }
});

GA.def('lib_shoulder_press_machine',{
  title:'Press de hombros en máquina',
  cam:{yaw:48,pitch:10},
  fitBox:[[-.7,0,-.57],[.66,1.68,.57]],
  muscles:{frontdelts:1,sidedelts:.6,triceps:.6},
  labels:['Deltoides ant. y lat.','Tríceps'],
  init:{p:0,act:.7},
  timeline:[
    {p:1,dur:1.4,label:'Empuja · sigue el arco',act:1},
    {dur:.4,label:'Arriba · sin bloquear',act:.85},
    {p:0,dur:2.5,label:'Baja en 2,5 s · controla',act:.75},
    {dur:.35,label:'Abajo · altura del hombro',act:.7}
  ],
  build(c,b,E){
    const V=E.V,p=c.p,SY=.45,HX=.13,HZ=.44,LZ=.53,CR=.25;
    b.pelvis([HX,SY+.088,0],{tilt:-6});b.spine(-2);b.head(0);
    b.scap('both',-.005,-.008);const S=b.sho('R').slice();
    b.scap('both',E.mix(-.005,.014,p),E.mix(-.008,.006,p));
    for(const s of['R','L']){const k=s==='R'?1:-1;b.footFlat(s,[.5,0,k*.19],k*-14);b.leg(s,null,[1,.15,k*.3]);}
    const H0=[S[0]+.07,S[1]+.18],H1=[S[0]+.14,S[1]+.575],R=.85;
    const M=[(H0[0]+H1[0])/2,(H0[1]+H1[1])/2],cd=[H1[0]-H0[0],H1[1]-H0[1]],cl=Math.hypot(cd[0],cd[1]);
    const hh=Math.sqrt(R*R-cl*cl/4),P=[M[0]-cd[1]/cl*hh,M[1]+cd[0]/cl*hh];
    const a0=Math.atan2(H0[1]-P[1],H0[0]-P[0]),a1=Math.atan2(H1[1]-P[1],H1[0]-P[0]),a=E.mix(a0,a1,p);
    const H=[P[0]+R*Math.cos(a),P[1]+R*Math.sin(a)];
    for(const s of['R','L']){const k=s==='R'?1:-1;
      b.arm(s,[H[0],H[1],k*HZ],V.norm(V.lerp(b.tdir(k*.85,-.7,.35),b.tdir(k,-.15,.3),p)),[0,0,1]);
      const le=[H[0]+.01,H[1]-.01,k*LZ];
      E.beam([P[0],P[1],k*LZ],V.madd(le,[Math.cos(a),Math.sin(a),0],.03),.05,C.frame);
      E.cyl([H[0],H[1],k*(LZ+.01)],[H[0],H[1],k*(HZ-.075)],.017,C.rubber);
      E.cyl([H[0],H[1],k*(LZ-.005)],[H[0],H[1],k*(LZ+.03)],.024,C.frameD);
    }
    E.pad([-.07,SY-.04,0],[.36,SY-.04,0],.4,.08,C.pad,{up:[0,1,0],layer:-1});
    const bk=b.tpt(0,-.15,-.103),bn=b.tdir(0,0,1),bu=b.tdir(0,1,0);
    E.pad(V.madd(V.madd(bk,bn,-.04),bu,-.36),V.madd(V.madd(bk,bn,-.04),bu,.4),.36,.08,C.pad,{up:bn,layer:-1});
    const bb=V.madd(V.madd(bk,bn,-.1),bu,-.1);
    E.beam([bb[0],.03,0],bb,.07,C.frame,{layer:-2});
    E.beam([.12,.03,0],[.12,SY-.08,0],.08,C.frame,{layer:-2});
    E.beam([-1.0,.035,0],[.42,.035,0],.08,C.frameD,{layer:-2});
    E.beam([.3,.03,-.3],[.3,.03,.3],.07,C.frameD,{layer:-2});
    const SX=P[0]-CR;
    for(const k of[-1,1]){E.beam([SX,.03,k*.24],[SX,P[1]+.06,k*.24],.07,C.frame);E.beam([SX-.2,.03,k*.24],[SX+.2,.03,k*.24],.07,C.frameD,{layer:-2});}
    E.beam([SX,P[1]+.06,-.27],[SX,P[1]+.06,.27],.07,C.frame);
    E.beam([SX,P[1]+.02,.0],[P[0],P[1],0],.06,C.frame);
    E.cyl([P[0],P[1],-LZ-.03],[P[0],P[1],LZ+.03],.03,C.frameD,{hub:.4});
    E.disc([P[0],P[1],0],[0,0,1],CR,.03,C.frameD,{hub:.3});
    const top=E.stack([SX,.05,0],{h:1.3,lift:(a-a0)*CR,n:14,sel:5,yaw:0,w:.3,bias:.1});
    E.cable([SX,P[1]-.0,0],top);
    E.trace('maneral',[H[0],H[1],LZ+.05]);
    E.shadow([-.1,0,0],.95,.5,.55);
  }
});

GA.def('lib_front_raise_db',{
  title:'Elevación frontal con mancuernas',
  cam:{yaw:40,pitch:8},
  muscles:{frontdelts_R:1,frontdelts_L:1,sidedelts_R:.3,sidedelts_L:.3},
  labels:['Deltoides anterior'],
  init:{R:0,L:0,p:0,act:.5},
  timeline:[
    {R:1,p:1,dur:1.2,label:'Brazo derecho · sin balanceo',act:1},
    {dur:.4,label:'Pausa a la altura del hombro',act:1},
    {R:0,p:0,dur:2,label:'Baja en 2 s · sin balanceo',act:.75},
    {dur:.3,label:'Cambia al izquierdo',act:.5},
    {L:1,dur:1.2,label:'Brazo izquierdo · sin balanceo',act:1},
    {dur:.4,label:'Pausa a la altura del hombro',act:1},
    {L:0,dur:2,label:'Baja en 2 s · sin balanceo',act:.75},
    {dur:.3,label:'Cambia al derecho',act:.5}
  ],
  build(c,b,E){
    const V=E.V;
    for(const s of['R','L']){const k=s==='R'?1:-1;b.footFlat(s,[-.06,0,k*.12],k*-8);}
    b.pelvis([-.03,.94,0],{tilt:3});b.spine(-1);b.head(-5);b.scap('both',-.004,0);
    for(const s of['R','L'])b.leg(s,null,[1,0,0]);
    const m={};
    for(const s of['R','L']){const q=c[s]||0;
      b.armFK(s,{flex:E.mix(15,87,q),abd:E.mix(0,-2,q),elbow:E.mix(9,11,q),rot:E.mix(12,22,q),grip:b.tdir(1,0,0)});
      E.dumbbell(b.j(s,'grip'),b.tdir(1,0,0),{r:.05,hl:.06});
      if(s==='R')E.trace('mancuerna',b.j(s,'grip'));
      const w=.35+.65*E.sstep(0,.15,q);m['frontdelts_'+s]=w;m['sidedelts_'+s]=.3*w;}
    this.muscles=m;
    E.shadow([0,0,0],.4,.3,.55);
  }
});

})(window.GymAnim);
