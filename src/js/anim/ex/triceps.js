/* ex/triceps.js */
/* Tríceps: extensión sobre cabeza (cable), máquina de extensión, skull crusher con mancuernas */
(function(GA){
const C=GA._.COL;
const fore=(V,u,a,e)=>V.add(V.mul(u,Math.cos(e*Math.PI/180)),V.mul(a,Math.sin(e*Math.PI/180)));

GA.def('lib_tricep_overhead_cable',{
  title:'Extensión tríceps sobre cabeza (cable)',
  cam:{yaw:35,pitch:8},
  fitBox:[[-.9,0,-.45],[.8,1.96,.45]],
  muscles:{triceps:1},
  labels:['Tríceps (porción larga)'],
  init:{p:0,act:.7},
  timeline:[
    {p:1,dur:1.2,label:'Extiende · codos fijos',act:1},
    {dur:.5,label:'Aprieta · brazos rectos',act:1},
    {p:0,dur:2.8,label:'Baja lento tras la cabeza',act:.75},
    {dur:.4,label:'Gran estiramiento',act:.7}
  ],
  build(c,b,E){
    const V=E.V,p=c.p,PX=-.92,PY=.8;
    b.footFlat('L',[.22,0,-.12],8);b.footBall('R',[-.305,.009,.13],-6,9);
    b.pelvis([-.02,.865,0],{tilt:33});b.spine(-3);b.head(-2);b.scap('both',.035,.015);
    b.leg('L',null,[1,.1,-.15]);b.leg('R',null,[1,-.1,.1]);
    const T=b.tdir(1,0,0),pul=[PX+.05,PY,0];
    const arm=(s,pp)=>{const k=s==='R'?1:-1,e=E.mix(140,5,pp);
      const u=V.norm(b.tdir(-k*.13,1,.03)),a=V.norm(V.perp(b.tdir(0,0,-1),u)),elb=V.madd(b.sho(s),u,E.DIM.ua);
      let h=V.madd(elb,fore(V,u,a,e),E.DIM.fa+E.DIM.grip);h=V.madd(h,T,k*E.mix(.05,.10,E.sstep(0,1,pp))-V.dot(V.sub(h,b.neckB),T));
      return[u,V.norm(V.sub(h,elb))];};
    const clipAt=pp=>{const m=V.lerp(...['R','L'].map(s=>{const[u,f]=arm(s,pp);return V.madd(V.madd(b.sho(s),u,E.DIM.ua),f,E.DIM.fa+E.DIM.grip);}),.5);return V.madd(m,V.norm(V.sub(pul,m)),.17);};
    const hands=['R','L'].map(s=>{const[u,f]=arm(s,p);b.armDir(s,u,f,V.cross(f,T));return b.j(s,'grip');});
    const clip=clipAt(p);
    E.rope(clip,hands[0],hands[1]);E.cable(clip,pul);
    for(const k of[-1,1])E.beam([PX-.36,0,k*.18],[PX-.36,2.2,k*.18],.06,C.frame,{bias:.3});
    E.beam([PX,0,0],[PX,2.2,0],.075,C.frame,{bias:.3});E.boxA([PX-.18,2.22,0],[.46,.07,.44],C.frameD,{bias:.3});
    E.boxA([PX-.1,.025,0],[.66,.05,.48],C.frameD,{layer:-1});
    E.boxA([PX+.005,PY,0],[.08,.14,.1],C.frameD,{bias:.2});E.pulley(pul,[0,0,1],.042);
    const lift=.05+V.dist(clip,pul)-V.dist(clipAt(0),pul);
    const top=E.stack([PX-.18,0,0],{h:1.8,lift,n:13,sel:5,yaw:0,w:.27,bias:.4});
    E.cable([PX+.03,PY+.07,0],[PX+.03,2.15,0]);E.pulley([PX,2.15,0],[0,0,1],.035);E.cable([PX-.18,2.18,0],top);
    E.trace('cuerda',hands[0]);
    E.shadow([-.05,0,0],.55,.3,.55);
  }
});

GA.def('lib_tricep_machine',{
  title:'Extensión tríceps en máquina',
  cam:{yaw:22,pitch:5},
  fitBox:[[-.8,0,-.42],[.68,1.4,.36]],
  muscles:{triceps:1},
  labels:['Tríceps'],
  timeline:[
    {p:1,dur:1.2,label:'Extiende completo',act:1},
    {dur:.5,label:'Aprieta · codos apoyados',act:1},
    {p:0,dur:2.5,label:'Vuelve en 2,5 s',act:.75},
    {dur:.4,label:'Sin soltar el peso',act:.55}
  ],
  build(c,b,E){
    const V=E.V,p=c.p,SY=.48,UA=-30,E0=105,D=Math.PI/180,e=E.mix(E0,3,p);
    b.pelvis([0,SY+.09,0],{tilt:-8});b.spine(2);b.head(6);b.scap('both',-.01,.01);
    for(const s of['R','L']){const k=s==='R'?1:-1;b.footFlat(s,[.43,0,k*.16],k*-8);b.leg(s,null,[1,.4,k*.12]);}
    const A={};
    for(const s of['R','L']){const k=s==='R'?1:-1,u=V.norm([Math.cos(UA*D),Math.sin(UA*D),k*.03]),an=V.norm(V.perp(V.add(V.xy(UA+90),[0,0,-k*.36]),u)),
      dir=t=>V.add(V.mul(u,Math.cos(t*D)),V.mul(an,Math.sin(t*D))),N=V.cross(u,an);
      A[s]={n:V.norm(V.mul(N,k)),ga:V.norm(V.cross(N,dir(e)))};b.armDir(s,u,dir(e),A[s].ga);}
    const el=b.j('R','elb'),EX=el[0],EY=el[1],HZ=el[2],ud=V.xy(UA),un=V.xy(UA+90),sh=b.sho('R');
    const ap=(t,o,z)=>{const q=V.madd(V.madd(sh,ud,t),un,o);return[q[0],q[1],z];};
    for(const k of[-1,1])E.pad(ap(.19,-.088,k*HZ),ap(.335,-.088,k*HZ),.14,.09,C.pad,{up:un,grp:k>0?'uaR':'uaL'});
    E.pad(ap(.23,-.12,0),ap(.36,-.12,0),2*HZ,.05,C.frameD,{up:un,layer:-1});
    const XU=EX+.1;E.beam(ap(.24,-.16,-HZ),[XU,EY-.2,-.36],.05,C.frame,{layer:-1});E.beam([XU,0,-.36],[XU,EY-.18,-.36],.08,C.frame,{layer:-1});
    E.pad([-.24,SY-.04,0],[.27,SY-.04,0],.36,.08,C.pad,{up:[0,1,0],layer:-1});
    E.pad(b.tpt(0,-.53,-.15),b.tpt(0,.03,-.15),.36,.08,C.pad,{up:b.tdir(0,0,1),layer:-1});
    const bk=b.tpt(0,-.3,-.2);E.beam([bk[0],SY-.06,0],bk,.06,C.frame,{layer:-2});
    E.beam([-.02,0,0],[-.02,SY-.08,0],.08,C.frame,{layer:-1});E.beam([-.3,SY-.08,0],[.24,SY-.08,0],.06,C.frameD,{layer:-1});
    E.beam([-.95,.03,-.36],[.7,.03,-.36],.08,C.frameD,{layer:-1});E.beam([-.02,.03,-.36],[-.02,.03,.25],.07,C.frameD,{layer:-1});E.beam([.1,.03,-.40],[.1,.03,.40],.07,C.frameD,{layer:-1});
    E.beam([-.02,SY-.08,0],[-.02,SY-.08,-.36],.05,C.frame,{layer:-1});
    const SX=-.74,R=.065,lift=.02+(E0-e)*D*R;
    for(const s of['R','L']){const k=s==='R'?1:-1,a=A[s],g=b.j(s,'grip'),H=V.madd(b.j(s,'elb'),a.n,.115),lo=V.madd(g,a.ga,-.085),le=V.madd(lo,a.n,.115),
        Cm=V.madd(H,a.n,.035),dn=V.norm(V.perp([0,-1,0],a.n)),rr=V.norm(V.cross(a.n,dn)),T=V.madd(Cm,rr,rr[0]>0?-R:R),B2=V.madd(T,dn,.13),
        P=[B2[0]-.035,.15,B2[2]],G=[SX+.185,.15,k*.06],pn=V.norm(V.cross(V.norm(V.sub(G,P)),[0,1,0]));
      E.beam(ap(.35,-.14,k*HZ),H,.04,C.frameD,{layer:-1});E.cyl(V.madd(H,a.n,-.03),V.madd(H,a.n,.02),.045,C.frameD,{hub:.3});
      E.beam(H,le,.034,C.frame);E.disc(Cm,a.n,R,.03,C.frameD,{hub:.3});if(k>0)E.cyl(V.madd(Cm,a.n,.015),V.madd(Cm,a.n,.027),.02,C.accent);
      E.cyl(le,lo,.015,C.chrome);E.cyl(lo,V.madd(g,a.ga,.065),.019,C.rubber);
      const o=k>0?{}:{layer:-1},Q=V.madd(B2,V.norm(V.sub([0,-1,0],dn)),.022),YT=B2[1]-.03;
      E.beam(H,Q,.025,C.frameD,o);E.beam([P[0],.03,P[2]],[P[0],P[1]-.035,P[2]],.035,C.frameD,o);E.beam([B2[0],.19,B2[2]],[B2[0],YT,B2[2]],.032,C.frame,o);
      E.cable(T,B2);E.pulley(Q,V.norm(V.cross(dn,[0,-1,0])),.022);E.cable(B2,[B2[0],YT,B2[2]]);E.cable([B2[0],.19,B2[2]],[B2[0],.15,B2[2]]);
      E.pulley(P,pn,.035);E.cable(V.add(P,[0,-.035,0]),V.add(G,[0,-.035,0]));E.pulley(G,pn,.035);
      E.cable([SX+.15,.15,k*.06],[SX+.15,1.4,k*.06]);E.pulley([SX+.075,1.4,k*.06],[0,0,1],.075);}
    const top=E.stack([SX,0,0],{h:1.35,lift,n:12,sel:5,yaw:0,w:.26}),FP=V.add(top,[0,.075,0]);
    E.line(top,FP,.012,C.chrome);E.pulley(FP,[1,0,0],.06);for(const k of[-1,1])E.cable([SX,1.4,k*.06],[SX,FP[1],k*.06]);
    for(const k of[-1,1])E.beam([SX,0,k*.17],[SX,1.45,k*.17],.05,C.frame);E.beam([SX,1.47,-.2],[SX,1.47,.2],.06,C.frame);
    E.beam([SX,.03,-.36],[SX,.03,.2],.08,C.frameD,{layer:-1});
    E.trace('maneral',b.j('R','grip'));
    E.shadow([0,0,0],.75,.42,.55);
  }
});

GA.def('lib_skull_crusher_db',{
  title:'Skull crusher (mancuernas)',
  cam:{yaw:30,pitch:18},
  fitBox:[[-.92,0,-.42],[.78,1.2,.42]],
  muscles:{triceps:1},
  labels:['Tríceps'],
  timeline:[
    {p:1,dur:2.5,label:'Baja en 2,5 s · codos fijos',act:.8},
    {dur:.3,label:'Junto a la cabeza',act:.85},
    {p:0,dur:1.2,label:'Extiende completo',act:1},
    {dur:.5,label:'Arriba · húmeros quietos',act:.55}
  ],
  build(c,b,E){
    const V=E.V,p=c.p,UA=102,D=Math.PI/180;
    E.bench({at:[0,0,0],dir:0,h:.44,seat:.42,back:.82,inc:0});
    b.pelvis([.13,.567,0],{tilt:-90});b.spine(1);b.head(-12);b.scap('both',-.01,-.005);
    const e=E.mix(3,110,p)*D;
    for(const s of['R','L']){const k=s==='R'?1:-1,u=V.norm([Math.cos(UA*D),Math.sin(UA*D),-k*.07]),an=V.norm(V.perp(V.xy(UA+90),u)),
      fa=V.add(V.mul(u,Math.cos(e)),V.mul(an,Math.sin(e))),gax=V.cross([0,0,1],fa);
      b.armDir(s,u,fa,gax);E.dumbbell(b.j(s,'grip'),gax,{r:.05,hl:.05});
      if(s==='R')E.trace('mancuerna',b.j(s,'grip'));}
    for(const s of['R','L']){const k=s==='R'?1:-1;b.footFlat(s,[.6,0,k*.3],k*-18);b.leg(s,null,[.3,1,k*.4]);}
    E.shadow([0,0,0],.9,.45,.55);
  }
});

})(window.GymAnim);
