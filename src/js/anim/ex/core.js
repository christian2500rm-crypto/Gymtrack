/* ex/core.js */
/* Core: crunch en cable, crunch en máquina, plancha, elevación de piernas colgado */
(function(GA){
const C=GA._.COL,RD=Math.PI/180;
const thAng=b=>{const u=b.tdir(0,1,0);return Math.atan2(u[0],u[1])/RD;};

GA.def('lib_crunch_cable',{
  title:'Crunch en cable',
  cam:{yaw:30,pitch:10},
  fitBox:[[-.7,0,-.3],[1.15,1.68,.3]],
  muscles:{abs:1,obliques:.5},
  labels:['Abdomen','Oblicuos'],
  timeline:[
    {p:1,dur:1.3,label:'Curva la columna · exhala',act:1},
    {dur:1,label:'Aprieta · codos a rodillas',act:1},
    {p:0,dur:2.3,label:'Vuelve controlando',act:.75},
    {dur:.5,label:'Estira · cadera fija',act:.55}
  ],
  build(c,b,E){
    const V=E.V,p=c.p,MT=.03,KY=MT+.052,TH=E.DIM.th,TT=36,TB=3;
    const PX=TH*Math.sin(TB*RD),PY=KY+TH*Math.cos(TB*RD);
    const pose=q=>{b.pelvis([PX,PY,0],{tilt:TT});b.spine(E.mix(-6,76,q));b.head(E.mix(2,16,q));b.scap('both',.015,.015);};
    const hands=()=>[b.tpt(.118,.15,.07),b.tpt(-.118,.15,.07)];
    pose(0);let hh=hands();const m0=V.lerp(hh[0],hh[1],.5);
    pose(1);hh=hands();const m1=V.lerp(hh[0],hh[1],.5);
    const pul=[Math.max(m0[0],m1[0])+.15,1.95,0],R=.045;
    const clipOf=m=>V.madd(m,V.norm(V.sub(pul,m)),.2);
    const cab=cl=>{const d=V.sub(cl,pul),L=Math.hypot(d[0],d[1]),a=Math.atan2(-d[0],-d[1]),g=Math.acos(R/L),f=1.5*Math.PI-a-g;
      return{L:Math.sqrt(L*L-R*R)+R*(Math.PI-a-g),t:[pul[0]+R*Math.cos(f),pul[1]+R*Math.sin(f),0]};};
    pose(p);hh=hands();const mid=V.lerp(hh[0],hh[1],.5),clip=clipOf(mid),cb=cab(clip);
    for(const s of['R','L']){const k=s==='R'?1:-1,h=hh[s==='R'?0:1];
      b.arm(s,h,b.tdir(-k*.3,0,1),V.norm(V.sub(h,clip)));
      const hp=b.hip(s),kn=[0,KY,k*.1];
      b.legDir(s,V.sub(kn,hp),[-Math.cos(2.5*RD),-Math.sin(2.5*RD),0]);b.footRelax(s,78);}
    E.rope(clip,hh[0],hh[1]);
    const XC=pul[0]+.34,TY=pul[1]+.065;
    E.pulley(pul,[0,0,1],R);E.cable(cb.t,clip);
    E.beam([pul[0]-.05,TY,0],[XC+.06,TY,0],.06,C.frame);E.pulley([XC-R,pul[1],0],[0,0,1],R);
    E.cable([pul[0],pul[1]+R,0],[XC-R,pul[1]+R,0]);
    for(const k of[-1,1])E.beam([XC,0,k*.19],[XC,TY+.03,k*.19],.06,C.frame);
    E.beam([XC,TY+.03,-.22],[XC,TY+.03,.22],.06,C.frameD);
    const lift=.03+Math.max(0,cb.L-cab(clipOf(m0)).L);
    const top=E.stack([XC,0,0],{h:pul[1]-.05,lift,n:14,sel:5,yaw:0,w:.26,bias:.15});
    E.cable([XC,pul[1],0],[XC,top[1]+.02,0]);
    E.beam([XC-.3,.03,0],[XC+.25,.03,0],.08,C.frameD,{layer:-1});E.beam([XC,.03,-.3],[XC,.03,.3],.08,C.frameD,{layer:-1});
    E.boxA([-.24,MT/2,0],[1.08,MT,.56],'#1d2127',{layer:-1});
    E.shadow([0,0,0],.6,.35,.55);
  }
});

GA.def('lib_crunch_machine',{
  title:'Crunch en máquina',
  cam:{yaw:42,pitch:10},
  fitBox:[[-.66,0,-.42],[.78,1.4,.42]],
  muscles:{abs:1,obliques:.4},
  labels:['Abdomen','Oblicuos'],
  timeline:[
    {p:1,dur:1.3,label:'Exhala · costillas a la pelvis',act:1},
    {dur:1,label:'Aprieta · pausa',act:1},
    {p:0,dur:2.5,label:'Regresa controlando',act:.75},
    {dur:.5,label:'Arriba · sin soltar',act:.55}
  ],
  build(c,b,E){
    const V=E.V,p=c.p,SY=.47,HY=SY+.09;
    const pose=q=>{b.pelvis([0,HY,0],{tilt:-4-3*q});b.spine(E.mix(-2,58,q));b.head(E.mix(0,14,q));b.scap('both',0,E.mix(0,.02,q));};
    pose(0);const a0=b.tpt(0,0,0),g0=thAng(b);pose(1);const a1=b.tpt(0,0,0),g1=thAng(b);
    const dA=(g1-g0)*RD,cs=Math.cos(dA),sn=Math.sin(dA);
    const rx=a1[0]-(a0[0]*cs+a0[1]*sn),ry=a1[1]-(-a0[0]*sn+a0[1]*cs);
    const det=(1-cs)*(1-cs)+sn*sn,PV=[((1-cs)*rx+sn*ry)/det,(-sn*rx+(1-cs)*ry)/det];
    pose(p);const ang=thAng(b)-g0,T=(r,u,f)=>b.tpt(r,u,f);
    for(const s of['R','L']){const k=s==='R'?1:-1;
      b.arm(s,T(k*.19,-.07,.16),b.tdir(k*.25,-1,-.1),b.tdir(0,0,1));
      b.footFlat(s,[.44,0,k*.12],-k*5);b.leg(s,null,[1,.4,k*.08]);}
    E.pad([-.26,SY-.04,0],[.2,SY-.04,0],.38,.08,C.pad,{up:[0,1,0],layer:-1});
    E.beam([-.02,0,0],[-.02,SY-.08,0],.08,C.frame);
    E.beam([-.55,.03,0],[.72,.03,0],.09,C.frameD,{layer:-1});
    E.pad([-.165,HY-.03,0],[-.165,HY+.22,0],.3,.07,C.pad,{up:[1,0,0],layer:-1});
    const Z=-.33,hub=[PV[0],PV[1],Z],RX=-.4;
    E.beam([RX,0,0],[RX,hub[1]+.04,0],.08,C.frame);E.beam([-.2,HY+.1,0],[RX,HY+.1,0],.05,C.frame);
    E.beam([RX,hub[1],0],[RX,hub[1],Z],.06,C.frame);E.beam([RX,hub[1],Z],[hub[0],hub[1],Z],.06,C.frame);
    const an=b.j('R','ank'),rk=[an[0]+.085,an[1]+.045,0];
    E.cyl([rk[0],rk[1],-.21],[rk[0],rk[1],.21],.042,C.pad);
    E.beam([rk[0],rk[1],-.21],[rk[0],rk[1],-.25],.03,C.frameD);E.beam([rk[0],rk[1],-.25],[rk[0]+.06,.03,-.25],.04,C.frame);
    E.beam([rk[0]+.06,.03,-.25],[rk[0]+.06,.03,0],.05,C.frameD,{layer:-1});
    E.cyl([hub[0],hub[1],Z-.02],[hub[0],hub[1],Z+.05],.07,C.frameD,{hub:.3});
    const A=T(Z,-.07,.25),B=T(.25,-.07,.25);
    E.beam(V.add(hub,[0,0,.02]),A,.05,C.frame);E.beam(A,B,.04,C.frame);
    E.pad(T(-.15,-.14,.163),T(.15,-.14,.163),.14,.07,C.pad,{up:b.tdir(0,0,1)});
    E.beam(T(0,-.13,.2),T(0,-.07,.25),.035,C.frameD);
    for(const k of[-1,1]){const g=T(k*.19,-.07,.16);E.handle(g,b.tdir(0,0,1));E.beam(V.madd(g,b.tdir(0,0,1),.06),T(k*.19,-.07,.25),.028,C.frameD);}
    const camR=.12,lift=Math.max(0,ang*RD*camR),ZC=Z-.06,SX=-.56,SZ=.37;
    E.disc([hub[0],hub[1],ZC],[0,0,1],camR,.025,C.frameD,{hub:.25});
    const fl=[hub[0],.1,ZC],up=[SX+.1,.1,SZ],dr=V.norm(V.sub(up,fl)),pn=[dr[2],0,-dr[0]],r=.035;
    E.beam(V.add(fl,[0,-.07,0]),V.add(up,[0,-.07,0]),.07,C.frameD,{layer:-1});
    E.cable([hub[0],hub[1]-camR,ZC],V.madd(fl,[0,1,0],r));E.pulley(V.madd(V.madd(fl,dr,r),[0,1,0],r),pn,r);
    E.cable(V.madd(fl,dr,r),V.madd(up,dr,-r));E.pulley(V.madd(V.madd(up,dr,-r),[0,1,0],r),pn,r);
    E.cable(V.madd(up,[0,1,0],r),[SX+.1,1.2,SZ]);E.pulley([SX+.05,1.2,SZ],[0,0,1],.05);
    const top=E.stack([SX,0,SZ],{h:1.3,lift,n:12,sel:5,yaw:0,w:.24,bias:.2});E.cable([SX,1.2,SZ],top);
    for(const k of[-1,1])E.beam([SX,0,SZ+k*.15],[SX,1.25,SZ+k*.15],.06,C.frame);E.beam([SX,1.25,SZ-.18],[SX,1.25,SZ+.18],.06,C.frameD);
    E.beam([SX,.03,0],[SX,.03,SZ+.18],.08,C.frameD,{layer:-1});
    E.shadow([0,0,0],.75,.45,.55);
  }
});

GA.def('lib_plank',{
  title:'Plancha',
  cam:{yaw:32,pitch:10},
  fitBox:[[-1.5,0,-.22],[.5,.5,.22]],
  muscles:{abs:1,obliques:.6,glutes:.4,frontdelts:.3},
  labels:['Abdomen','Oblicuos','Glúteos'],
  init:{p:0,act:1},
  timeline:[
    {p:1,dur:2,label:'Mantén · inhala',act:.85,ease:'sin'},
    {p:0,dur:2,label:'Mantén · exhala',act:1,ease:'sin'}
  ],
  build(c,b,E){
    const V=E.V,p=c.p,EY=.042,SH=E.DIM.ua,PA=74,sa=Math.sin(PA*RD),ca=Math.cos(PA*RD);
    const AY=.004+.07*sa+.039*ca+Math.hypot(.138*sa,.042*ca)+.002;
    const pose=(th,q,o)=>{b.pelvis(o||[0,0,0],{tilt:90-th-5});b.spine(5);b.head(-8);b.scap('both',.003*q,.02+.022*q);};
    const place=(th,q)=>{pose(th,q);pose(th,q,V.sub([0,EY+SH,.183],b.sho('R')));};
    const ankOf=()=>{const h=b.ppt(0,0,0);return V.madd(h,V.norm(V.sub(h,V.lerp(b.sho('R'),b.sho('L'),.5))),.8698);};
    const fit=q=>{place(E.solve(th=>{place(th,q);return ankOf()[1]-AY;},0,20),q);return ankOf();};
    const a0=fit(0);fit(p);
    for(const s of['R','L']){const k=s==='R'?1:-1;
      b.armVia(s,[0,EY,k*.183],[.328,.03,k*.15],[0,0,1]);
      b.foot(s,[a0[0],a0[1],k*.09],[ca,-sa,0],[sa,ca,0]);b.leg(s,null,[0,-1,k*.05]);}
    E.boxA([-.45,.003,0],[2.1,.006,.62],'#283a4a',{layer:-1,outline:false});
    E.shadow([-.4,0,0],1.05,.3,.5);
    const k1=V.add(b.j('R','ank'),[0,0,.035]),k2=V.add(b.sho('R'),[0,0,.035]),ld=V.norm(V.sub(k2,k1)),A=V.madd(k1,ld,-.05),B=V.madd(k2,ld,.24);
    for(let i=0;i<16;i++)E.line(V.lerp(A,B,i/16),V.lerp(A,B,(i+.55)/16),.007,C.accent,{alpha:.6,layer:1});
  }
});

GA.def('lib_leg_raise',{
  title:'Elevación de piernas (colgado)',
  cam:{yaw:32,pitch:4},
  fitBox:[[-.45,0,-.3],[.98,2.46,.3]],
  muscles:{abs:1,obliques:.5,quads:.3},
  labels:['Abdomen','Oblicuos','Cuádriceps'],
  timeline:[
    {p:1,dur:1.5,label:'Sube · enrolla la pelvis',act:1},
    {dur:.5,label:'Pausa arriba',act:1},
    {p:0,dur:3,label:'Baja lento · sin balanceo',act:.75},
    {dur:.5,label:'Abajo · hombros activos',act:.55}
  ],
  build(c,b,E){
    const V=E.V,p=c.p,BX=0,BY=2.3,GZ=.27,AL=.628;
    const sf=E.mix(-2,17,E.sstep(.35,1,p)),thT=E.mix(0,-5,p),tilt=thT-sf;
    const tw=E.mix(6,110,p),kn=E.mix(18,24,p);
    const pose=(o)=>{b.pelvis(o,{tilt});b.spine(sf);b.head(4);b.scap('both',-.02,0);
      for(const s of['R','L'])b.legFK(s,{flex:tw+tilt,knee:kn,abd:3});};
    const com=()=>{const S=b.S,h=b.headC,sm=V.lerp(b.sho('R'),b.sho('L'),.5),tr=V.lerp(b.ppt(0,.05,0),b.neckB,.5);
      let x=.08*h[0]+.5*tr[0]+.1*sm[0];
      for(const s of['R','L'])x+=.1*(S[s].hip[0]+S[s].kne[0])/2+.06*(S[s].kne[0]*.55+S[s].ank[0]*.45);
      return x/(.08+.5+.1+.32);};
    const placeAt=d=>{pose([0,0,0]);const sm=V.lerp(b.sho('R'),b.sho('L'),.5),dz=GZ-b.sho('R')[2];
      const sy=BY-Math.sqrt(AL*AL-d*d-dz*dz);pose(V.sub([BX-d,sy,0],sm));};
    const d=E.solve(dd=>{placeAt(dd);return com()-BX;},-.15,.35);
    placeAt(d);
    for(const s of['R','L']){const k=s==='R'?1:-1;b.arm(s,[BX,BY,k*GZ],[-.4,.1,k],[0,0,1]);b.footRelax(s,35);}
    const UX=-.75,PZ=.55,TY=2.42;
    for(const k of[-1,1]){E.beam([UX,0,k*PZ],[UX,TY+.03,k*PZ],.075,C.frame);E.beam([UX-.32,.03,k*PZ],[UX+.4,.03,k*PZ],.07,C.frameD,{layer:-1});
      E.beam([UX,TY,k*PZ],[BX+.07,TY,k*PZ],.065,C.frame);E.beam([BX,TY,k*PZ],[BX,BY,k*PZ],.045,C.frameD);}
    for(const y of[TY,.15])E.beam([UX,y,-PZ],[UX,y,PZ],.06,C.frameD);
    E.bar([BX,BY,-PZ-.03],[BX,BY,PZ+.03],{r:.016});
    E.trace('pies',V.lerp(b.j('R','ank'),b.j('L','ank'),.5));
    E.shadow([BX,0,0],.5,.35,.45);
  }
});

})(window.GymAnim);
