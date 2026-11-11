/* ex/legs_mach.js */
/* Piernas en máquina: prensa, curl femoral (tumbado/sentado), abductor, aductor */
(function(GA){
const C=GA._.COL,RAD=Math.PI/180;
const legD=th=>Math.sqrt(.44*.44+.43*.43+2*.44*.43*Math.cos(th*RAD));
function backPad(b,E,lo,hi,w){const V=E.V,A=b.ppt(0,0,-.13),B=b.tpt(0,-.15,-.105),ax=V.norm(V.sub(B,A)),n=V.norm(V.perp(b.pdir(0,0,1),ax));
  E.pad(V.madd(V.madd(A,ax,lo),n,-.04),V.madd(V.madd(A,ax,hi),n,-.04),w,.08,C.pad,{up:n,layer:-1});return V.madd(V.madd(A,ax,.3),n,-.1);}

GA.def('lib_leg_press',{
  title:'Prensa de piernas',
  cam:{yaw:-30,pitch:20},
  fitBox:[[-.52,.45,-.22],[1.06,1.55,.22]],
  muscles:{quads:1,glutes:.8,adductors:.4},
  labels:['Cuádriceps','Glúteos','Aductores'],
  timeline:[
    {p:1,dur:3,label:'Baja en 3 s · rodilla a 90°',act:.8},
    {dur:.3,label:'Pausa · lumbar apoyada',act:.9},
    {p:0,dur:1.4,label:'Empuja con todo el pie',act:1},
    {dur:.6,label:'Arriba · sin bloquear',act:.5}
  ],
  build(c,b,E){
    const V=E.V,p=c.p,H=[0,.6,0],R2=Math.SQRT1_2,d=[R2,R2,0],n=[-R2,R2,0],e=-.12,FW=.13,TO=12;
    const fd=V.xy(110),pn=V.xy(200);                    // plataforma: dirección del pie y normal hacia la persona
    b.pelvis(H,{tilt:-58});b.spine(0);b.head(-4);b.scap('both',0,-.01);
    const dz=FW-E.DIM.hipW,sOf=th=>Math.sqrt(legD(th)**2-e*e-dz*dz);
    const sT=sOf(12),sB=sOf(90),s=E.mix(sT,sB,p);
    const at=(sd,sn,z)=>[H[0]+d[0]*sd+n[0]*sn,H[1]+d[1]*sd+n[1]*sn,z];
    const O=at(s,e,0);                                   // tobillos fijos a la plataforma
    for(const S of['R','L']){const k=S==='R'?1:-1,a=TO*RAD;
      const fw=V.add(V.mul(fd,Math.cos(a)),[0,0,k*Math.sin(a)]);
      b.foot(S,[O[0],O[1],k*FW],fw,pn);b.leg(S,null,fw);}
    for(const S of['R','L']){const k=S==='R'?1:-1;
      b.arm(S,b.ppt(k*.3,-.03,.06),b.pdir(k,.1,-.5),b.pdir(0,0,1));}
    E.pad(b.ppt(0,-.07,-.17),b.ppt(0,.86,-.17),.44,.08,C.pad,{up:b.pdir(0,0,1),layer:-1});
    E.pad(b.ppt(0,-.135,-.15),b.ppt(0,-.135,.07),.44,.08,C.pad,{up:b.pdir(0,1,0),layer:-1});
    const sb=b.ppt(0,-.2,.02),bb=b.ppt(0,.48,-.24);
    E.beam([sb[0],0,0],sb,.07,C.frame,{layer:-2});E.beam([bb[0],0,0],bb,.07,C.frame,{layer:-2});
    E.beam(b.ppt(0,-.2,-.2),bb,.06,C.frameD,{layer:-2});
    for(const k of[-1,1]){const g=b.ppt(k*.3,-.03,.06),ax=b.pdir(0,0,1);
      E.cyl(V.madd(g,ax,.045),V.madd(g,ax,.075),.017,C.rubber);E.cyl(V.madd(g,ax,-.075),V.madd(g,ax,-.045),.017,C.rubber);
      E.beam(V.madd(g,ax,-.08),b.ppt(k*.22,-.13,-.06),.025,C.frameD);}
    const RN=e-.41,r0=-.25,r1=sT+.45;
    for(const k of[-1,1]){
      E.beam(at(r0,RN-.06,k*.2),at(r1,RN-.06,k*.2),.07,C.frame,{layer:-1});
      E.cyl(at(r0+.25,RN,k*.2),at(r1,RN,k*.2),.02,C.chrome,{layer:-1});
      const tp=at(r1,RN-.06,k*.2);E.beam([tp[0]+.03,0,k*.2],[tp[0]+.03,tp[1]+.05,k*.2],.07,C.frame,{layer:-1});
      E.boxA(at(sB-.2,RN+.03,k*.2),[.05,.06,.07],C.accent,{pitch:45});}
    E.beam(at(r1-.05,RN-.06,-.2),at(r1-.05,RN-.06,.2),.06,C.frameD,{layer:-1});
    E.beam([-.7,.03,0],[1.45,.03,0],.09,C.frameD,{layer:-2});
    for(const x of[-.62,.14,1.4])E.beam([x,.03,-.34],[x,.03,.34],.06,C.frameD,{layer:-2});
    const dn=(u,w,z)=>V.add(V.add(O,V.add(V.mul(d,u),V.mul(n,w))),[0,0,z]);
    const PC=V.add(V.madd(O,pn,-.075),V.mul(fd,.07));
    E.box(V.madd(PC,pn,-.018),[V.mul(pn,.018),V.mul(fd,.33),[0,0,.38]],'#6a7482');
    E.box(dn(.2,-.35,0),[V.mul(d,.22),V.mul(n,.04),[0,0,.25]],C.frameD);
    for(const k of[-1,1]){
      const g1=V.add(V.madd(V.madd(PC,fd,.31),pn,-.035),[0,0,k*.25]),g2=V.add(V.madd(V.madd(PC,fd,-.31),pn,-.035),[0,0,k*.25]);
      E.poly([g1,g2,dn(.0,-.33,k*.25),dn(.4,-.33,k*.25)],C.frameD);
      for(const u of[-.12,.36])E.boxA(dn(u,-.41,k*.2),[.09,.05,.07],'#2a3038',{pitch:45});
      const hc=dn(.02,-.42,0);
      E.cyl(V.add(hc,[0,0,k*.25]),V.add(hc,[0,0,k*.62]),.025,C.chrome);
      E.plate(V.add(hc,[0,0,k*.36]),[0,0,1],.225);E.plate(V.add(hc,[0,0,k*.41]),[0,0,1],.225);
      E.plate(V.add(hc,[0,0,k*.455]),[0,0,1],.165,{th:.035});}
    E.shadow([.25,0,0],1.1,.5,.55);
  }
});

GA.def('lib_leg_curl',{
  title:'Curl femoral tumbado',
  cam:{yaw:-24,pitch:15},
  fitBox:[[-.95,.08,-.3],[.98,1.28,.3]],
  muscles:{hams:1,calves:.4},
  labels:['Isquiotibiales','Gemelos'],
  timeline:[
    {p:1,dur:1.3,label:'Dobla · caderas pegadas',act:1},
    {dur:1,label:'Aprieta 1 s',act:1},
    {p:0,dur:3,label:'Baja en 3 s',act:.75},
    {dur:.5,label:'Abajo · sin soltar el peso',act:.5}
  ],
  build(c,b,E){
    const V=E.V,p=c.p,HY=.82,TA=195,th=E.mix(10,125,p);
    b.pelvis([0,HY,0],{tilt:100});b.spine(0);b.head(-6);b.scap('both',.01,.015);
    const td=V.xy(TA),an=V.xy(TA+90),sd=V.xy(TA-th),po=V.xy(TA-th-90);
    for(const S of['R','L']){const k=S==='R'?1:-1;
      b.legDir(S,[td[0],td[1],k*.02],sd);b.footRelax(S,-12);}
    const K=V.madd([0,HY,0],td,.44);
    const hz=.25,hp=b.tpt(0,.27,.27);
    for(const S of['R','L']){const k=S==='R'?1:-1;
      b.arm(S,[hp[0],hp[1],k*hz],b.tdir(k*.7,-.4,1),[1,0,0]);}
    const pf=b.pdir(0,0,1);
    E.pad(b.ppt(0,-.06,.135),b.ppt(0,.56,.135),.36,.08,C.pad,{up:V.neg(pf),layer:-1});
    const a1=V.madd([0,HY,0],an,.084),a2=V.madd(K,an,.058),ta=V.norm(V.sub(a2,a1));
    E.pad(V.madd(V.madd(a1,an,.04),ta,.04),V.madd(V.madd(a1,an,.04),ta,.385),.36,.08,C.pad,{up:V.neg(an),layer:-1});
    const fb=b.ppt(0,.35,.25),hb=V.madd(a1,an,.12);
    E.beam([-.9,.03,0],[1.28,.03,0],.09,C.frameD,{layer:-2});
    E.beam([-.75,.03,-.33],[-.75,.03,.33],.06,C.frameD,{layer:-2});E.beam([1.28,.03,-.52],[1.28,.03,.33],.06,C.frameD,{layer:-2});
    E.beam([fb[0],0,0],fb,.07,C.frame,{layer:-2});E.beam([hb[0],0,0],hb,.07,C.frame,{layer:-2});
    E.beam(fb,hb,.06,C.frameD,{layer:-2});
    for(const k of[-1,1]){const g=[hp[0],hp[1],k*hz];
      E.cyl(V.add(g,[-.06,0,0]),V.add(g,[.06,0,0]),.017,C.rubber);
      E.beam(V.add(g,[.07,0,0]),V.add(b.ppt(0,.55,.2),[0,0,k*.14]),.025,C.frameD);}
    const PZ=-.33,CZ=-.385,P=[K[0],K[1],PZ];
    E.beam([K[0]+.05,0,PZ],[K[0]+.05,K[1]-.06,PZ],.07,C.frame,{layer:-1});E.beam([K[0]+.05,.03,PZ],[K[0]+.05,.03,0],.06,C.frameD,{layer:-2});
    E.disc([K[0],K[1],CZ],[0,0,1],.1,.03,C.frameD,{hub:.3});E.cyl([K[0],K[1],CZ],[K[0],K[1],-.29],.016,C.chrome);
    E.disc(P,[0,0,1],.045,.04,C.frame,{hub:.45});E.cyl([K[0],K[1],-.305],[K[0],K[1],-.29],.03,C.accent);
    const rc=V.madd(V.madd(K,sd,.375),po,.087);
    E.sph(V.madd([K[0],K[1],CZ+.017],V.xy(TA-th+90),.07),.012,C.chrome);
    E.beam(P,[rc[0],rc[1],PZ],.045,C.frame);E.cyl([rc[0],rc[1],PZ],[rc[0],rc[1],-.22],.012,C.chrome);
    E.cyl([rc[0],rc[1],-.22],[rc[0],rc[1],.22],.046,C.pad);
    const lift=.02+(th-10)*RAD*.1,SX=1.1,TX=1.24,FY=.035,top=E.stack([SX,0,CZ],{h:1.15,lift,n:12,sel:5,yaw:0,w:.26,bias:.2});
    E.beam([TX+.04,0,CZ],[TX+.04,1.3,CZ],.06,C.frame,{layer:-1});E.beam([TX+.07,1.3,CZ],[SX-.04,1.3,CZ],.05,C.frame,{layer:-1});
    const q=[[K[0]-.1,K[1]],[K[0]-.1,FY],[TX,FY],[TX,1.24],[SX,1.24],[SX,top[1]+.02]];
    for(let i=0;i<q.length-1;i++)E.cable([q[i][0],q[i][1],CZ],[q[i+1][0],q[i+1][1],CZ]);
    for(const i of[1,2,3,4])E.pulley([q[i][0],q[i][1],CZ],[0,0,1],.035);
    E.shadow([.05,0,0],1,.4,.55);
  }
});

GA.def('lib_leg_curl_seated',{
  title:'Curl femoral sentado',
  cam:{yaw:30,pitch:9},
  fitBox:[[-.42,.02,-.36],[1.0,1.4,.36]],
  muscles:{hams:1,calves:.3},
  labels:['Isquiotibiales','Gemelos'],
  timeline:[
    {p:1,dur:1.4,label:'Talones bajo el asiento',act:1},
    {dur:1,label:'Aprieta 1 s',act:1},
    {p:0,dur:3,label:'Vuelve en 3 s',act:.75},
    {dur:.5,label:'Casi estirada · sin soltar',act:.5}
  ],
  build(c,b,E){
    const V=E.V,p=c.p,SY=.5,HY=SY+.09,th=E.mix(12,115,p);
    b.pelvis([0,HY,0],{tilt:2});b.spine(2);b.head(4);b.scap('both',0,-.01);
    const sd=V.xy(-th),po=V.xy(-th-90);
    for(const S of['R','L']){const k=S==='R'?1:-1;
      b.legDir(S,[1,-.04,k*.02],sd);b.footRelax(S,-10);}
    const K=V.madd([0,HY,0],V.norm([1,-.04,0]),E.DIM.th);
    b.arm('R',[-.03,SY+.03,.3],[-1,-.2,.6],[1,0,0]);b.arm('L',[-.03,SY+.03,-.3],[-1,-.2,-.6],[1,0,0]);
    E.pad([-.2,SY-.04,0],[.3,SY-.04,0],.42,.08,C.pad,{up:[0,1,0],layer:-1});
    const bk=backPad(b,E,-.1,.7,.4);E.beam([bk[0],SY-.1,0],bk,.06,C.frame,{layer:-2});
    E.beam([-.05,0,0],[-.05,SY-.08,0],.08,C.frame,{layer:-2});E.beam([-.05,SY-.1,0],[bk[0],SY-.1,0],.06,C.frameD,{layer:-2});
    E.beam([-.84,.03,0],[.85,.03,0],.08,C.frameD,{layer:-2});
    for(const x of[-.84,.8])E.beam([x,.03,x<0?-.53:-.4],[x,.03,.3],.06,C.frameD,{layer:-2});
    for(const k of[-1,1]){E.beam([-.06,SY-.02,k*.27],[.08,SY-.02,k*.27],.025,C.frameD);E.cyl([-.09,SY+.03,k*.3],[.03,SY+.03,k*.3],.018,C.rubber);}
    const CZ=-.415,FZ=-.48,P=[K[0],K[1],CZ];
    E.beam([-.24,K[1],FZ],[K[0],K[1],FZ],.07,C.frame,{layer:-1});E.beam([-.24,K[1],FZ],[-.24,K[1],0],.05,C.frameD,{layer:-2});
    E.beam([.8,0,FZ],[K[0]+.05,K[1]-.04,FZ],.07,C.frame,{layer:-1});
    E.disc(P,[0,0,1],.1,.03,C.frameD,{hub:.3});E.cyl([K[0],K[1],FZ],[K[0],K[1],-.375],.016,C.chrome);
    const TX=.34,TY=HY+.092;
    E.cyl([TX,TY,-.33],[TX,TY,.25],.048,C.pad);
    E.beam([TX,TY,-.36],[TX,TY,FZ],.04,C.frameD);E.beam([TX,TY,FZ],[TX,K[1],FZ],.04,C.frameD);
    const rc=V.madd(V.madd(K,sd,.37),po,.088);
    E.sph(V.madd([K[0],K[1],CZ+.017],V.xy(-th-90),.07),.012,C.chrome);
    E.beam([K[0],K[1],-.375],[rc[0],rc[1],-.375],.045,C.frame);
    E.cyl([rc[0],rc[1],-.375],[rc[0],rc[1],.22],.046,C.pad);
    const lift=.02+(th-12)*RAD*.1,SX=-.62,TX2=-.76,FY=.035,top=E.stack([SX,0,CZ],{h:1.3,lift,n:12,sel:5,yaw:0,w:.26,bias:.2});
    E.beam([TX2-.04,0,CZ],[TX2-.04,1.42,CZ],.06,C.frame,{layer:-1});E.beam([TX2-.07,1.42,CZ],[SX+.04,1.42,CZ],.05,C.frame,{layer:-1});
    const q=[[K[0]-.1,K[1]],[K[0]-.1,FY],[TX2,FY],[TX2,1.36],[SX,1.36],[SX,top[1]+.02]];
    for(let i=0;i<q.length-1;i++)E.cable([q[i][0],q[i][1],CZ],[q[i+1][0],q[i+1][1],CZ]);
    for(const i of[1,2,3,4])E.pulley([q[i][0],q[i][1],CZ],[0,0,1],.035);
    E.shadow([0,0,0],.75,.4,.55);
    const w=c.act==null?.6:c.act;
    for(const S of['R','L']){const k=S==='R'?1:-1,h=b.hip(S),kn=b.j(S,'kne'),an=b.j(S,'ank'),ax=V.norm(V.sub(kn,h));
      E.over({k:'glow',grp:'th'+S,c:V.add(V.lerp(h,kn,.6),[0,-.025,k*.05]),ax:[V.mul(ax,.15),[0,.04,0],[0,0,.03]],n:V.norm([0,-.5,k*.85]),w});
      E.over({k:'glow',grp:'sh'+S,c:V.add(V.lerp(kn,an,.3),V.add([0,0,k*.04],V.mul(po,.02))),ax:[V.mul(sd,.1),V.mul(po,.03),[0,0,.03]],n:V.norm(V.add([0,0,k*.9],V.mul(po,.4))),w:w*.35});}
  }
});

function hipMachine(c,b,E,ang,abd,a0){
  const V=E.V,SY=.48,HY=SY+.09,TH=E.DIM.th,CY=SY-.23;
  b.pelvis([0,HY,0],{tilt:-7});b.spine(1);b.head(6);b.scap('both',0,-.012);
  for(const S of['R','L']){const k=S==='R'?1:-1;
    const t=V.yaw(-k*ang),lat=V.yaw(-k*ang-k*90),ls=abd?lat:V.neg(lat);
    b.legDir(S,t,[0,-1,0]);
    const P0=[0,SY-.15,k*E.DIM.hipW],AY=SY-.15,at=(u,l,y)=>[P0[0]+t[0]*u+ls[0]*l,y,P0[2]+t[2]*u+ls[2]*l];
    E.cyl([P0[0],CY,P0[2]],[P0[0],AY+.05,P0[2]],.04,C.frameD);
    E.beam(at(0,0,AY),at(.31,0,AY),.05,C.frame);
    E.pad(at(.24,0,HY-.093),at(.41,0,HY-.093),.12,.06,C.pad,{up:[0,1,0]});
    E.beam(at(.29,0,AY),at(.29,0,HY-.12),.035,C.frameD);
    const kp=at(TH-.035,.062+.025,HY+.01);
    E.pad(V.madd(kp,t,-.075),V.madd(kp,t,.075),.17,.05,C.pad,{up:ls});
    E.beam(at(.31,0,AY),at(.37,.087,AY),.035,C.frame);E.beam(at(.37,.087,AY),at(.37,.087,HY-.07),.035,C.frame);
    E.beam(at(.31,0,AY),at(.31,0,.06),.035,C.frame);
    E.box(at(.49,0,.052),[V.mul(t,.17),[0,.012,0],V.mul(lat,.055)],C.rubber);
  }
  b.arm('R',[-.13,SY+.05,.29],[-1,-.1,.7],[1,0,0]);b.arm('L',[-.13,SY+.05,-.29],[-1,-.1,-.7],[1,0,0]);
  E.pad([-.2,SY-.04,0],[.17,SY-.04,0],.42,.08,C.pad,{up:[0,1,0],layer:-1});
  const bk=backPad(b,E,-.1,.72,.42);E.beam([-.42,bk[1],0],bk,.06,C.frameD,{layer:-2});E.beam([-.42,0,0],[-.42,bk[1]+.03,0],.07,C.frame,{layer:-2});
  E.beam([-.2,0,0],[-.2,SY-.08,0],.08,C.frame,{layer:-2});
  E.beam([-.2,SY-.17,0],[0,SY-.17,0],.05,C.frameD,{layer:-2});
  E.beam([-.95,.03,0],[.75,.03,0],.08,C.frameD,{layer:-2});
  for(const x of[-.9,.7])E.beam([x,.03,-.38],[x,.03,.38],.06,C.frameD,{layer:-2});
  for(const k of[-1,1]){E.beam([-.2,SY-.02,k*.2],[-.2,SY-.02,k*.29],.025,C.frameD);E.cyl([-.19,SY+.05,k*.29],[-.07,SY+.05,k*.29],.018,C.rubber);
    E.beam([-.19,SY+.05,k*.29],[-.2,SY-.02,k*.29],.025,C.frameD);}
  const CR=.14,XR=-.6,lift=.015+Math.abs(ang-a0)*RAD*CR,top=E.stack([-.72,0,0],{h:1.35,lift,n:12,sel:5,yaw:0,w:.26,bias:.3});
  E.disc([0,CY,0],[0,1,0],CR,.03,C.frameD,{hub:.3,layer:-2});
  E.beam([-.89,0,0],[-.89,1.45,0],.06,C.frame,{layer:-2});E.beam([-.91,1.45,0],[XR-.03,1.45,0],.05,C.frame,{layer:-2});
  E.beam([XR,0,0],[XR,CY-.04,0],.04,C.frameD,{layer:-2});
  const ca=Math.acos(CR/-XR),q=[[XR,CY],[XR,1.4],[-.72,1.4],[-.72,top[1]+.02]];
  const L2={layer:-2};E.cable([-CR*Math.cos(ca),CY,CR*Math.sin(ca)],[XR,CY,0],L2);
  for(let i=0;i<q.length-1;i++)E.cable([q[i][0],q[i][1],0],[q[i+1][0],q[i+1][1],0],L2);
  for(const i of[0,1,2])E.pulley([q[i][0],q[i][1],0],[0,0,1],.035,L2);
  E.shadow([0,0,0],.75,.5,.55);
}
GA.def('lib_hip_abductor',{
  title:'Abductor de cadera',
  cam:{yaw:64,pitch:38},
  fitBox:[[-.15,.02,-.3],[.55,1.3,.3]],
  muscles:{abductors:1,glutes:.5},
  labels:['Glúteo medio','Glúteos'],
  timeline:[
    {p:1,dur:1.3,label:'Abre · sin rebotar',act:1},
    {dur:1,label:'Mantén 1 s',act:1},
    {p:0,dur:2.6,label:'Cierra lento · controla',act:.75},
    {dur:.4,label:'Sin tocar la pila',act:.5}
  ],
  build(c,b,E){hipMachine(c,b,E,E.mix(7,38,c.p),true,7);
    const V=E.V,w=c.act==null?.6:c.act,u=b.pdir(0,1,0),f=b.pdir(0,0,1);
    for(const S of['R','L']){const k=S==='R'?1:-1,la=b.pdir(k,0,0),n=V.norm(V.add(V.mul(la,.75),V.mul(u,.65)));
      const o={k:'glow',c:b.ppt(k*.165,.04,-.03),ax:[V.mul(u,.075),V.mul(f,.075),V.mul(la,.04)],n,w};
      for(const g of['torso','th'+S])E.over(Object.assign({grp:g},o));}}
});
GA.def('lib_hip_adductor',{
  title:'Aductor de cadera',
  cam:{yaw:64,pitch:38},
  fitBox:[[-.15,.02,-.3],[.55,1.3,.3]],
  muscles:{adductors:1},
  labels:['Aductores'],
  timeline:[
    {p:1,dur:1.4,label:'Cierra · espalda apoyada',act:1},
    {dur:1,label:'Aprieta 1 s',act:1},
    {p:0,dur:3,label:'Abre lento en 3 s',act:.75},
    {dur:.4,label:'Estira · sin tocar la pila',act:.5}
  ],
  build(c,b,E){hipMachine(c,b,E,E.mix(38,5,c.p),false,38);}
});

})(window.GymAnim);
