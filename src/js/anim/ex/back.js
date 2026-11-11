/* ex/back.js */
/* Espalda: remos, pullover, face pull, aperturas inversas */
(function(GA){
const C=GA._.COL,D=Math.PI/180;
const circ=(A,B,py)=>{const m=[(A[0]+B[0])/2,(A[1]+B[1])/2],dx=A[0]-B[0],dy=A[1]-B[1],l=Math.hypot(dx,dy);let n=[-dy/l,dx/l];if(n[1]<0)n=[-n[0],-n[1]];
  const t=(py-m[1])/n[1],P=[m[0]+n[0]*t,m[1]+n[1]*t];return{P,R:Math.hypot(A[0]-P[0],A[1]-P[1]),a0:Math.atan2(A[1]-P[1],A[0]-P[0]),a1:Math.atan2(B[1]-P[1],B[0]-P[0])};};
const bz=(V,A,K,B,t)=>{const Cc=V.sub(V.mul(K,2),V.mul(V.add(A,B),.5)),u=1-t;return V.norm(V.add(V.add(V.mul(A,u*u),V.mul(Cc,2*t*u)),V.mul(B,t*t)));};
const seatLegs=(b,x,zw,yw)=>{for(const s of['R','L']){const k=s==='R'?1:-1;b.footFlat(s,[x,0,k*zw],-k*yw);b.leg(s,null,[1,.3,k*.15]);}};

GA.def('lib_row_machine',{
  title:'Remo sentado en máquina',
  cam:{yaw:-40,pitch:9},
  fitBox:[[-.38,0,-.4],[1.12,1.7,.4]],
  muscles:{midback:1,lats:.8,reardelts:.5,biceps:.4},
  labels:['Romboides','Dorsales','Deltoides post.'],
  init:{p:0,act:.5},
  timeline:[
    {p:1,dur:1.3,label:'Tira hacia el ombligo',act:1},
    {dur:1,label:'Aprieta omóplatos 1 s',act:1},
    {p:0,dur:3,label:'Regreso en 3 s',act:.75},
    {dur:.5,label:'Estira · escápulas adelante',act:.5}
  ],
  build(c,b,E){
    const V=E.V,p=c.p,SY=.47,HY=SY+.09,HZ=.2,LZ=.265;
    const pose=q=>{b.pelvis([0,HY,0],{tilt:5});b.spine(-3);b.head(-3);b.scap('both',-.006*q,E.mix(.025,-.035,q));};
    pose(0);const s0=b.sho('R'),S=[s0[0]+.623*Math.cos(16*D),s0[1]-.623*Math.sin(16*D)];
    pose(1);const F1=b.tpt(HZ,-.35,.11);
    pose(p);
    const cc=circ(S,F1,1.58),P=cc.P,th=E.mix(cc.a0,cc.a1,p),u=[Math.cos(th),Math.sin(th),0];
    const g0=[P[0]+cc.R*u[0],P[1]+cc.R*u[1],0];
    for(const s of['R','L']){const k=s==='R'?1:-1,g=[g0[0],g0[1],k*HZ],ha=V.rot(u,[0,0,1],-32*D);
      b.arm(s,g,V.lerp([-.25,-1,k*.3],[-1,-.3,k*.12],p),ha);
      E.beam([P[0],P[1],k*LZ],[P[0]+u[0]*(cc.R+.1),P[1]+u[1]*(cc.R+.1),k*LZ],.045,C.frame);
      E.cyl(V.madd(g,ha,-.075),V.madd(g,ha,.075),.017,C.rubber);
      for(const e of[-.085,.085]){const q=V.madd(g,ha,e),P3=[P[0],P[1],0],r=V.madd(P3,u,V.dot(V.sub(q,P3),u));E.beam(q,[r[0],r[1],k*LZ],.025,C.frameD);}
      if(s==='R')E.trace('maneral',g);
    }
    seatLegs(b,.42,.17,6);
    E.pad([-.24,SY-.04,0],[.17,SY-.04,0],.36,.08,C.pad);
    E.beam([0,0,0],[0,SY-.08,0],.08,C.frame);
    E.beam([-.35,.03,0],[1.46,.03,0],.09,C.frameD,{layer:-1});
    const pc=b.tpt(0,-.16,.167),T=b.tdir(1,0,0),Fd=b.tdir(0,0,1);
    E.pad(V.madd(pc,T,-.13),V.madd(pc,T,.13),.3,.08,C.pad,{up:Fd});
    E.beam(V.madd(pc,Fd,.05),[.66,pc[1],0],.05,C.frame);E.beam([.66,pc[1],0],[.66,0,0],.06,C.frame);
    const TY=P[1]+.22;E.beam([1.02,0,0],[1.02,TY+.05,0],.1,C.frame);E.beam([P[0],TY,0],[1.46,TY,0],.08,C.frame);E.beam([1.42,0,0],[1.42,TY-.04,0],.07,C.frame);
    E.beam([P[0],TY,0],[P[0],P[1],0],.06,C.frame);
    E.cyl([P[0],P[1],-LZ-.05],[P[0],P[1],LZ+.05],.03,C.chrome);
    E.pulley([P[0],P[1],0],[0,0,1],.15);
    const lift=(cc.a0-th)*.15;
    const top=E.stack([1.25,0,0],{h:1.45,lift,n:12,sel:6,w:.28,bias:.2,yaw:90}),PB=[1.13,P[1]-.11,0],PT=[1.21,TY-.09,0];
    E.cable([P[0],P[1]-.15,0],[PB[0],P[1]-.15,0]);E.pulley(PB,[0,0,1],.04);E.beam([1.07,PB[1],0],PB,.03,C.frameD);
    E.cable([1.17,PB[1],0],[1.17,PT[1],0]);E.pulley(PT,[0,0,1],.04);E.cable([1.25,PT[1],0],top);
    E.shadow([.2,0,0],.75,.45,.55);
  }
});

GA.def('lib_row_db',{
  title:'Remo con mancuerna',
  cam:{yaw:32,pitch:16},
  muscles:{lats_R:1,midback:.7,reardelts_R:.5,biceps_R:.4},
  labels:['Dorsales','Romboides','Deltoides post.'],
  init:{p:0,act:.5},
  timeline:[
    {p:1,dur:1.2,label:'Tira hacia la cadera',act:1},
    {dur:.6,label:'Aprieta · codo atrás',act:1},
    {p:0,dur:2.5,label:'Baja en 2,5 s · estira',act:.75},
    {dur:.4,label:'Abajo · escápula suelta',act:.5}
  ],
  build(c,b,E){
    const V=E.V,p=c.p,BH=.45,BZ=-.15,HY=.89;
    const pose=q=>{b.pelvis([0,HY,0],{tilt:72});b.spine(-2,0,-3*q);b.head(-6);b.scap('R',-.008*q,E.mix(.03,-.03,q));b.scap('L',0,0);};
    pose(0);const gB=V.add(b.sho('R'),[.02,-.62,.02]),sl=b.sho('L'),hy=BH+.028,hL=[sl[0]+Math.sqrt(Math.max(.618*.618-(sl[1]-hy)**2,0)),hy,-.19];
    pose(1);const gT=b.tpt(.24,-.36,.10);
    pose(p);
    const ey=Math.pow(p,.85),ex=Math.pow(p,.8);
    const g=[E.mix(gB[0],gT[0],ex),E.mix(gB[1],gT[1],ey),E.mix(gB[2],gT[2],p)];
    const ax=V.norm(V.lerp([1,0,0],b.tdir(0,1,0),.5));
    b.arm('R',g,[-.3,1,.35],ax);
    E.dumbbell(b.j('R','grip'),ax,{r:.06,hl:.06});E.trace('mancuerna',g);
    b.arm('L',hL,[-1,0,-.2],[0,0,1]);
    const hl=b.hip('L'),kn=[0,BH+.055,-.12];kn[0]=hl[0]+Math.sqrt(Math.max(.44*.44-(kn[1]-hl[1])**2-(kn[2]-hl[2])**2,.01));
    const shd=[-Math.sqrt(.43*.43-.02*.02),-.02,0];
    b.legDir('L',V.sub(kn,hl),shd);b.footRelax('L',60);
    const hr=b.hip('R');b.footFlat('R',[hr[0]-.08,0,.33],-15);b.leg('R',null,[1,.1,.25]);
    E.bench({at:[.92,0,BZ],dir:0,h:BH,seat:0,back:1.14,inc:0,w:.28});
    E.shadow([.2,0,0],.8,.45,.55);
  }
});

GA.def('lib_row_cable',{
  title:'Remo en cable sentado',
  cam:{yaw:-32,pitch:10},
  fitBox:[[-.3,0,-.3],[1.0,1.3,.3]],
  muscles:{midback:1,lats:.9,biceps:.4,reardelts:.4},
  labels:['Romboides','Dorsales','Bíceps'],
  init:{p:0,act:.5},
  timeline:[
    {p:1,dur:1.3,label:'Tira hacia el pecho bajo',act:1},
    {dur:.8,label:'Contrae la espalda',act:1},
    {p:0,dur:2.8,label:'Regresa lento · estira',act:.75},
    {dur:.4,label:'Estira sin redondear',act:.5}
  ],
  build(c,b,E){
    const V=E.V,p=c.p,SY=.42,HY=SY+.09,PX=.8,PUL=[PX+.12,.34,0],n=V.norm([-.94,.34,0]),fu=V.norm([.34,.94,0]);
    const pose=q=>{const ln=E.mix(12,0,E.sstep(0,.85,q));b.pelvis([0,HY,0],{tilt:ln});b.spine(E.mix(1,-2,q));b.head(-ln*.5);b.scap('both',-.006*q,E.mix(.022,-.035,q));};
    pose(0);const sm0=V.lerp(b.sho('R'),b.sho('L'),.5),h0=V.madd(sm0,V.norm(V.sub(PUL,sm0)),.612);
    pose(1);const h1=b.tpt(0,-.29,.155);
    pose(p);
    const hm=V.lerp(h0,h1,p);hm[1]+=.02*Math.sin(Math.PI*p);
    const fw=V.norm(V.sub(PUL,hm)),ga=V.norm(V.perp([0,1,0],fw)),apex=V.madd(hm,fw,.16);
    for(const s of['R','L']){const k=s==='R'?1:-1,g=V.add(hm,[0,0,k*.055]);
      b.arm(s,g,[-1,-.55,k*.4],ga);
      E.cyl(V.madd(g,ga,-.065),V.madd(g,ga,.065),.016,C.rubber);
      E.bar(V.madd(g,ga,.065),apex,{r:.009});E.bar(V.madd(g,ga,-.065),apex,{r:.009});}
    E.sph(apex,.016,C.chrome);E.trace('maneral',hm);
    for(const s of['R','L']){const k=s==='R'?1:-1;b.footFlat(s,[PX,.12,k*.14],-k*5,n);b.leg(s,null,[.2,1,k*.3]);}
    E.pad([-.75,SY-.04,0],[.32,SY-.04,0],.3,.08,C.pad);
    E.beam([-.05,0,0],[-.05,SY-.08,0],.08,C.frame);E.beam([-.6,0,0],[-.6,SY-.08,0],.07,C.frame);
    E.beam([-.75,.03,0],[1.5,.03,0],.09,C.frameD,{layer:-1});
    for(const k of[-1,1]){const fc=V.madd(V.madd([PX,.12,k*.14],fu,.13),n,-.02);
      E.box(fc,[V.mul(n,.02),V.mul(fu,.16),[0,0,.075]],C.frameD);
      E.beam(V.madd(fc,n,-.03),[PX+.1,.05,k*.14],.04,C.frame);}
    E.pulley(PUL,[0,0,1],.045);E.beam([PUL[0],PUL[1],0],[PUL[0]+.05,.05,0],.05,C.frame);
    E.beam([1.25,0,0],[1.25,1.95,0],.1,C.frame);E.beam([1.2,1.95,0],[1.62,1.95,0],.07,C.frame);E.beam([1.62,0,0],[1.62,1.95,0],.08,C.frame);
    const lift=V.dist(PUL,hm)-V.dist(PUL,h0);
    const top=E.stack([1.45,0,0],{h:1.75,lift,n:13,sel:5,w:.26,bias:.2,yaw:90});
    E.cable(apex,PUL);E.cable(PUL,[1.25,PUL[1],0]);E.cable([1.45,1.88,0],top);E.pulley([1.45,1.88,0],[0,0,1],.04);
    E.shadow([.2,0,0],.9,.4,.55);
  }
});

GA.def('lib_pullover_db',{
  title:'Pullover con mancuerna',
  cam:{yaw:22,pitch:18},
  muscles:{lats:1,pecs:.6,triceps:.4},
  labels:['Dorsales','Pectoral','Tríceps'],
  init:{p:0,act:.5},
  timeline:[
    {p:1,dur:3,label:'Baja tras la cabeza en 3 s',act:.8},
    {dur:.4,label:'Estira · costillas abajo',act:.9},
    {p:0,dur:1.5,label:'Sube sobre el pecho',act:1},
    {dur:.5,label:'Arriba · codos fijos',act:.5}
  ],
  build(c,b,E){
    const V=E.V,p=c.p;
    E.bench({at:[0,0,0],dir:0,h:.44,seat:.42,back:.82,inc:0});
    b.pelvis([.13,.552,0],{tilt:-86});b.spine(-3);b.head(-11);b.scap('both',E.mix(0,.018,p),E.mix(.012,-.004,p));
    const ph=(E.mix(88,174,p)-90)*D,a=b.tdir(0,Math.sin(ph),Math.cos(ph)),pl=b.tdir(0,-Math.cos(ph),Math.sin(ph));
    const hm=V.madd(V.lerp(b.sho('R'),b.sho('L'),.5),a,.605),Rr=b.tdir(1,0,0);
    for(const s of['R','L']){const k=s==='R'?1:-1;b.arm(s,V.madd(hm,Rr,k*.035),V.add(pl,V.mul(Rr,k*.8)),Rr);}
    E.dumbbell(V.madd(hm,a,-.04),a,{r:.075,hl:.075,len:.14});E.trace('mancuerna',V.madd(hm,a,.1));
    for(const s of['R','L']){const k=s==='R'?1:-1;b.footFlat(s,[.62,0,k*.21],k*-10);b.leg(s,null,[.3,1,k*.2]);}
    E.shadow([0,0,0],.9,.45,.55);
  }
});

GA.def('lib_face_pull',{
  title:'Face pull en cable',
  cam:{yaw:40,pitch:14},
  fitBox:[[-.35,0,-.55],[1.3,1.95,.55]],
  muscles:{reardelts:1,midback:.8,traps:.4},
  labels:['Deltoides post.','Romboides','Trapecio'],
  init:{p:0,act:.5},
  timeline:[
    {p:1,dur:1.3,label:'Tira hacia la cara · rota afuera',act:1},
    {dur:1,label:'Doble bíceps · aprieta 1 s',act:1},
    {p:0,dur:2.2,label:'Regresa lento · codos altos',act:.7},
    {dur:.4,label:'Brazos largos · sin soltar',act:.5}
  ],
  build(c,b,E){
    const V=E.V,p=c.p,PUL=[1.18,1.78,0],RL=.35;
    for(const s of['R','L']){const k=s==='R'?1:-1;b.footFlat(s,[-.06,0,k*.14],-k*8);}
    b.pelvis([-.03,.935,0],{tilt:-4});b.spine(-2);b.head(5);
    for(const s of['R','L'])b.leg(s,null,[1,0,s==='R'?.1:-.1]);
    const arms=q=>{b.scap('both',E.mix(.012,0,q),E.mix(.02,-.035,q));const H=[];
      for(const s of['R','L']){const k=s==='R'?1:-1,td=(r,u,f)=>b.tdir(k*r,u,f);
        b.armDir(s,bz(V,td(0,.29,.956),td(.702,.12,.702),td(.93,.02,.37),q),bz(V,td(-.23,.34,.91),td(-.52,.42,.74),td(-.55,.83,-.08),q));H.push(b.j(s,'grip'));}
      const hm=V.lerp(H[0],H[1],.5),hs=V.dist(H[0],H[1])/2,dp=V.norm(V.sub(PUL,hm));
      return{H,clip:V.madd(hm,dp,Math.sqrt(Math.max(RL*RL-hs*hs,.003)))};};
    const A0=arms(0),A=arms(p);
    for(const s of['R','L']){const i=s==='R'?0:1;b.S[s].gripAx=V.norm(V.sub(A.H[i],A.clip));}
    E.rope(A.clip,A.H[0],A.H[1]);E.cable(PUL,A.clip);E.trace('cuerda',A.clip);
    E.beam([1.3,0,0],[1.3,2.15,0],.11,C.frame);E.boxA([1.27,PUL[1],0],[.1,.14,.12],C.frameD);
    E.beam([1.22,PUL[1],0],[PUL[0]+.03,PUL[1],0],.04,C.frameD);E.pulley(PUL,[0,0,1],.045);
    E.beam([1.25,2.15,0],[1.6,2.15,0],.07,C.frame);E.beam([1.62,0,0],[1.62,2.15,0],.08,C.frame);
    E.beam([.95,.03,0],[1.75,.03,0],.08,C.frameD,{layer:-1});
    const lift=(V.dist(PUL,A.clip)-V.dist(PUL,A0.clip))/2;
    const top=E.stack([1.46,0,0],{h:1.9,lift,n:14,sel:4,w:.2,yaw:90,bias:.2});
    E.cable([1.235,PUL[1]+.045,0],[1.235,2.08,0]);E.pulley([1.275,2.08,0],[0,0,1],.04);E.cable([1.275,2.12,0],[1.46,2.12,0]);
    E.cable([1.46,2.08,0],top);E.pulley([1.46,2.08,0],[0,0,1],.04);
    E.shadow([0,0,0],.45,.32,.55);
  }
});

GA.def('lib_rev_fly_machine',{
  title:'Aperturas inversas en máquina',
  cam:{yaw:-48,pitch:26,zoom:1.12},
  muscles:{reardelts:1,midback:.8,traps:.3},
  labels:['Deltoides post.','Romboides','Trapecio'],
  init:{p:0,act:.5},
  timeline:[
    {p:1,dur:1.3,label:'Abre en arco · codos suaves',act:1},
    {dur:1,label:'Aprieta 1 s · sin encoger',act:1},
    {p:0,dur:2.5,label:'Regresa en 2,5 s',act:.7},
    {dur:.4,label:'Adelante · sin soltar',act:.5}
  ],
  build(c,b,E){
    const V=E.V,p=c.p,SY=.47,HY=SY+.09,TOP=1.5,CX=.86,RH=.622;
    b.pelvis([0,HY,0],{tilt:3});b.spine(-3);b.head(-3);b.scap('both',0,.005);
    const s0=b.sho('R'),PX=s0[0],PZ=s0[2],HH=s0[1]-.02;
    b.scap('both',E.mix(0,-.006,p),E.mix(.005,-.03,E.sstep(.62,1,p)));
    const th=E.mix(-12,88,p)*D;
    for(const s of['R','L']){const k=s==='R'?1:-1,g=[PX+RH*Math.cos(th),HH,k*(PZ+RH*Math.sin(th))];
      b.arm(s,g,[-Math.sin(th),.35,k*Math.cos(th)],[0,1,0]);
      const hub=[PX,TOP,k*PZ],e=[g[0],TOP,g[2]];
      E.cyl([PX,TOP-.05,k*PZ],[PX,TOP+.07,k*PZ],.05,C.frameD);
      const CY=TOP+.045,Q=[CX-.05,CY,0],dq=[Q[0]-PX,-k*PZ],ta=Math.atan2(dq[1],dq[0])+k*Math.acos(.1/Math.hypot(dq[0],dq[1]));
      E.disc([PX,CY,k*PZ],[0,1,0],.1,.02,C.frameD);E.cable([PX+.1*Math.cos(ta),CY,k*PZ+.1*Math.sin(ta)],Q);
      E.beam(hub,e,.045,C.frame);E.beam(e,[g[0],HH+.09,g[2]],.035,C.frame);
      E.cyl([g[0],HH+.09,g[2]],[g[0],HH-.09,g[2]],.018,C.rubber);
      if(s==='R')E.trace('maneral',g);}
    seatLegs(b,.42,.17,8);
    E.pad([-.24,SY-.04,0],[.17,SY-.04,0],.36,.08,C.pad);
    E.beam([0,0,0],[0,SY-.08,0],.08,C.frame);
    E.beam([-.35,.03,0],[CX+.3,.03,0],.09,C.frameD,{layer:-1});
    const pc=b.tpt(0,-.22,.167),T=b.tdir(1,0,0),Fd=b.tdir(0,0,1);
    E.pad(V.madd(pc,T,-.12),V.madd(pc,T,.12),.26,.08,C.pad,{up:Fd});
    E.beam(V.madd(pc,Fd,.05),[CX,pc[1],0],.05,C.frame);
    E.beam([CX,0,0],[CX,TOP+.12,0],.1,C.frame);E.beam([CX,TOP+.1,0],[PX,TOP+.1,0],.07,C.frame);
    E.beam([PX,TOP+.1,-PZ-.04],[PX,TOP+.1,PZ+.04],.07,C.frame);
    const lift=(th+12*D)*.1;
    const top=E.stack([CX+.22,0,0],{h:1.5,lift,n:12,sel:4,w:.26,bias:.2,yaw:90});
    E.cable([CX+.22,TOP+.005,0],top);E.pulley([CX+.22,TOP+.005,0],[0,0,1],.04);E.cable([CX-.05,TOP+.045,0],[CX+.22,TOP+.045,0]);
    E.shadow([.15,0,0],.7,.45,.55);
  }
});

})(window.GymAnim);
