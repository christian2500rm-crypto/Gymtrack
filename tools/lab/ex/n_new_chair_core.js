/* Silla, mesa y core sin material: puente con talones en una silla, plancha inclinada en una mesa,
   rodilla al codo de pie y levantarse de la silla rápido */
(function(GA){
const K=GA._.kit,V=GA._.V,C=GA._.COL,DM=GA._.DIM,SS=K.SS,mix=K.mix,sst=K.sst,D=K.D,M=Math,UP=[0,1,0];
// silla de madera: asiento .42 × .42 centrado en x con la cara superior a h; respaldo en el lado bk (-1 → -X, +1 → +X)
const chair=(E,x,h,bk)=>{bk=bk||-1;const w=K.COL.wood,d=K.COL.woodD;E.boxA([x,h-.02,0],[.42,.04,.42],w,{layer:-1});
  for(const a of[-1,1])for(const z of[-1,1])E.beam([x+a*.18,0,z*.18],[x+a*.18,h-.04,z*.18],.035,d,{layer:-2});
  for(const z of[-1,1])E.beam([x+bk*.19,h,z*.18],[x+bk*.22,h+.42,z*.18],.035,d,{layer:-2});
  E.boxA([x+bk*.215,h+.33,0],[.03,.14,.42],w,{layer:-2,pitch:-bk*4});};
// brazos cruzados sobre el pecho (manos en los hombros contrarios)
const cross=b=>{for(const[s,k]of SS)b.arm(s,b.tpt(-k*.11,-.06-(k+1)*.012,.15+(k+1)*.012),b.tdir(k*.55,-.75,.4),b.tdir(0,1,0));};
// mano en la nuca (dedos rozándose) con el codo abierto; a 0-1: la mano se desliza tras la oreja y el codo va adelante y abajo
const nape=(b,s,a)=>{const k=K.sd(s);b.arm(s,b.hpt(k*mix(.045,.08,a),mix(-.02,-.03,a),mix(-.15,-.1,a)),b.tdir(k,.1-2.34*a,.25+.63*a),b.tdir(0,1,0));};
// punto más bajo de la zapatilla en la dirección n, relativo al tobillo
const low=(f,u,n)=>{let m=1e9,r;for(const e of K.shoe([0,0,0],f,u)){const x=M.sqrt(e[1].reduce((s,a)=>s+V.dot(a,n)**2,0)),v=V.dot(e[0],n)-x;
  if(v<m){m=v;r=V.sub(e[0],V.mul(e[1].reduce((s,a)=>V.madd(s,a,V.dot(a,n)),[0,0,0]),1/x));}}return r;};
const mid=(b,j)=>V.lerp(j==='sho'?b.sho('R'):j==='hip'?b.hip('R'):b.j('R',j),j==='sho'?b.sho('L'):j==='hip'?b.hip('L'):b.j('L',j),.5);

// ═══ PUENTE CON TALONES EN UNA SILLA ════════════════════════════════════════
// Boca arriba (cabeza hacia -X) con los talones sobre el borde cercano del asiento (respaldo al otro lado) y las rodillas
// algo dobladas (~41-42° abajo y arriba); empuja con los talones hasta alinear hombros, cadera y rodillas sin despegar los
// hombros. El talón apoya siempre en el mismo punto del asiento (cx) con el pie quieto (puntas arriba): sólo gira el tobillo.
const SH=.45,YM=.008,XS=-.62,FZ=.12,FA=95;
const hb=(b,i,cx)=>{K.supine(b,{y:YM,x:XS,at:'sho',incl:-i,sp:[0],sc:[0,-.01],hd:'rest'});
  const f=V.xy(FA),u=V.xy(FA+90);for(const[s,k]of SS){const F=[f[0],f[1],k*.1],lo=low(V.norm(F),V.norm(V.perp(u,V.norm(F))),UP);
    K.footOn(b,s,[cx-lo[0],SH,k*FZ-lo[2]],F,u);b.leg(s,null,[0,1,k*.15]);}};
GA.def('lib_heel_bridge_chair',{title:'Puente con talones en una silla',cam:{yaw:-30,pitch:17},
  muscles:{hams:1,glutes:.7,lowback:.2},labels:['Isquiotibiales','Glúteos'],
  timeline:[{p:1,dur:1.4,label:'Sube con los talones',act:1},{dur:.8,label:'Arriba · aprieta',act:1},
    {p:0,dur:2.2,label:'Baja despacio',act:.75},{dur:.5,label:'Abajo',act:.5}],
  build(c,b,E){const p=c.p,G=K.memo(this,'g',()=>{
      const hipA=()=>{const S=mid(b,'sho'),H=mid(b,'hip'),N=mid(b,'kne');return M.atan2(N[1]-H[1],N[0]-H[0])-M.atan2(H[1]-S[1],H[0]-S[0]);};
      const knA=()=>{const S=b.S.R;return M.acos(V.dot(V.norm(V.sub(S.kne,S.hip)),V.norm(V.sub(S.ank,S.kne))))/D;};
      const top=cx=>K.root(i=>{hb(b,i,cx);return hipA();},4,50),cx=K.root(x=>{hb(b,top(x),x);return knA()-42;},XS+.9,XS+1.8);
      const i0=K.root(i=>{K.supine(b,{y:YM,x:XS,at:'sho',incl:-i,sp:[0],sc:[0,-.01],hd:'rest'});
        return K.low(b,['pel','gluR','gluL'],[0,YM,0])-K.low(b,['shd','tho'],[0,YM,0]);},-8,12),i1=top(cx);
      b.ikErr=0;return{i0,i1,cx};});
    hb(b,mix(G.i0,G.i1,p),G.cx);K.armsFloor(b,E,{y:YM,spread:16});
    K.mat(E,[XS+.3,0,0],[1.45,.6]);chair(E,G.cx+.17,SH,1);E.shadow([XS+.6,0,0],1.1,.35,.5);}
});

// ═══ PLANCHA INCLINADA EN UNA MESA ══════════════════════════════════════════
// Manos en el borde de una mesa firme (.75 m), brazos estirados, cuerpo recto a ~45° sobre las puntas de los pies;
// isométrico: p sólo mueve una respiración mínima (columna y escápulas).
const TH=.75,table=(E,x0)=>{const L=.8,W=1.2;E.boxA([x0+L/2,TH-.015,0],[L,.03,W],K.COL.wood,{layer:-1});
  for(const x of[x0+.06,x0+L-.06])for(const k of[-1,1])E.beam([x,0,k*(W/2-.06)],[x,TH-.03,k*(W/2-.06)],.05,K.COL.woodD,{layer:-1});};
GA.def('lib_incline_plank_table',{title:'Plancha inclinada en una mesa',cam:{yaw:28,pitch:12},fitBox:[[-1.45,0,-.5],[.42,1.4,.5]],
  muscles:{abs:1,obliques:.5,frontdelts:.3,glutes:.3},labels:['Abdomen','Oblicuos'],note:'Aguanta 30 s',
  timeline:[{p:1,dur:2.2,label:'Aguanta · inhala',act:.9,ease:'sin'},{p:0,dur:2.2,label:'Abdomen firme · exhala',act:1,ease:'sin'}],
  build(c,b,E){const p=c.p,HX=0,o=q=>({hy:TH,hx:HX,sp:[mix(1,0,q)],hd:-8,pr:[.03+.005*q,-.02]});
    const xT=K.memo(this,'xT',()=>{const r=K.root(x=>K.plank(b,null,Object.assign(o(0),{xT:x,k:{}})).th-45,-1.55,-.6);b.ikErr=0;return r;});
    const pl=K.plank(b,E,Object.assign(o(p),{xT,k:K.memo(this,'pl',()=>({}))}));
    table(E,pl.hands.R[0]-.03);E.shadow([xT+.75,0,0],.9,.35,.5);}
});

// ═══ RODILLA AL CODO DE PIE ═════════════════════════════════════════════════
// Manos en la nuca y codos abiertos; pasa el peso a un pie y sube la otra rodilla cruzándola hacia el codo contrario:
// el tronco se flexiona en diagonal (flexión sf, inclinación al lado del codo SB°, giro TW° hacia la rodilla) y ese codo
// baja hasta rozar la rodilla. Vuelve y cambia. El CdM queda sobre el pie de apoyo, que no se mueve.
const KX=-.05,KZ=.11,KT=8,HF=118,KN=100,HZ=15,TW=30,SB=20,PY=8;
const kePose=(b,s,q,sf,hx,hz)=>{const k=K.sd(s),o=s==='R'?'L':'R',ko=-k,lq=sst(.1,1,q),w=sst(0,.4,q),Pp=pt=>[KX,0,pt*KZ];
  b.footFlat(o,Pp(ko),-ko*KT);const A=b.j(o,'ank').slice(),po={tilt:mix(2,-4,lq),yaw:k*PY*lq,roll:-k*2*lq};
  b.pelvis([hx,1,hz],po);const hp=b.hip(o),d=K.legD(mix(4,8,w));b.pelvis([hx,1+A[1]-hp[1]+M.sqrt(d*d-(hp[0]-A[0])**2-(hp[2]-A[2])**2),hz],po);
  K.trunk(b,{sp:[sf*lq,-k*SB*lq,-k*TW*lq],hd:[mix(2,10,lq),k*6*lq]});b.scap(o,-.02*lq,0);
  nape(b,s,0);nape(b,o,lq);b.leg(o,null,[1,.15,ko*.1]);
  // pierna que sube: talón arriba sobre los metatarsos (pit) y despega hacia la pose FK (cadera HF°, rodilla KN°, cruzada HZ°)
  const P=b.pf,f0=V.yaw(-k*KT),ball=V.madd(Pp(k),f0,DM.heel+DM.toe-.06),pit=34*sst(0,.32,q),v=sst(.3,.62,q);
  b.footBall(s,ball,-k*KT,pit);const S=b.S[s],A0=S.ank.slice(),fa=S.ffwd.slice(),ua=S.fup.slice(),pole0=V.add(fa,[0,.15,0]);
  if(v<=0){b.leg(s,null,pole0);return;}
  const a=HF*lq*D,kn=mix(4,KN,lq)*D,dir=x=>V.rot(V.add(V.mul(P.U,-M.cos(x)),V.mul(P.F,M.sin(x))),P.U,k*HZ*lq*D),td=dir(a),sd=dir(a-kn);
  b.legDir(s,td,sd);b.footRelax(s,18);const A1=S.ank.slice(),An=V.lerp(A0,A1,v),f=V.norm(V.lerp(fa,S.ffwd,v)),u=V.norm(V.lerp(ua,S.fup,v));
  const g=M.min(...K.shoe(An,f,u).map(e=>K.gap(e,[0,-.008,0],UP)));if(g<0)An[1]-=g;
  b.foot(s,An,f,u);b.leg(s,null,V.lerp(pole0,td,v));};
// holgura codo (lado o) ↔ muslo (lado s) · CdM: x sobre el medio pie; z desde el centro hacia el pie de apoyo (peso w)
const gapEK=(b,s,o)=>{const e=b.j(o,'elb'),h=b.hip(s),d=V.sub(b.j(s,'kne'),h),t=M.max(0,M.min(1,V.dot(V.sub(e,h),d)/V.dot(d,d)));
  return V.dist(e,V.madd(h,d,t))-mix(.084,.056,t)-.04;};
const ke=(ctx,b,s,q)=>{const k=K.sd(s),w=sst(0,.4,q),bx=KX+.1,bz=-k*mix(0,KZ-.01,w),e0=b.ikErr;
  const sf=K.memo(ctx,'sf',()=>K.root(f=>{kePose(b,'R',1,f,0,0);return gapEK(b,'R','L')-.008;},20,55));
  let hx=0,hz=0;for(let i=0;i<2;i++){hx=K.root(x=>{kePose(b,s,q,sf,x,hz);return K.com(b)[0]-bx;},bx-.5,bx+.4);
    hz=K.root(z=>{kePose(b,s,q,sf,hx,z);return K.com(b)[2]-bz;},-.2,.2);}
  b.ikErr=e0;kePose(b,s,q,sf,hx,hz);};
GA.def('lib_standing_knee_elbow',{title:'Rodilla al codo de pie',cam:{yaw:50,pitch:8},
  muscles:{obliques:1,abs:.7},labels:['Oblicuos','Abdomen'],init:{R:0,L:0,p:0,act:.5},
  timeline:[{R:1,p:1,dur:1,label:'Rodilla derecha al otro codo',act:1},{dur:.3,label:'Gira y aprieta · exhala',act:1},{R:0,p:0,dur:1.2,label:'Vuelve al centro',act:.6},
    {L:1,dur:1,label:'Rodilla izquierda al otro codo',act:1},{dur:.3,label:'Gira y aprieta · exhala',act:1},{L:0,dur:1.2,label:'Vuelve al centro',act:.5}],
  build(c,b,E){const R=c.R||0,L=c.L||0;ke(this,b,R>=L?'R':'L',M.max(R,L));E.shadow([0,0,0],.45,.35,.55);}
});

// ═══ LEVANTARSE DE LA SILLA RÁPIDO ══════════════════════════════════════════
// Sentado en la parte delantera de la silla, pies apoyados ~12 cm por detrás de las rodillas, brazos cruzados. p 1 sentado →
// .8 tronco adelante (TB°) con los glúteos aún en el asiento y el CdM sobre los talones (BX: el impulso lo lleva al medio pie)
// → 0 de pie con cadera y rodillas extendidas. Bajada al revés: despacio hasta tocar el asiento y se sienta (tronco a TS°).
const PC=.8,TB=50,TS=8,BX=-.04,SO={fz:.15,toe:10};
GA.def('lib_chair_stand_fast',{title:'Levantarse de la silla rápido',cam:{yaw:34,pitch:9},
  muscles:{quads:1,glutes:.7,adductors:.3},labels:['Cuádriceps','Glúteos'],init:{p:0},
  timeline:[{p:1,dur:.6,label:'Levántate rápido',act:1},{dur:.5,label:'De pie · cadera estirada',act:.5},
    {p:0,dur:2.6,label:'Siéntate despacio',act:.8},{dur:.6,label:'Sentado · pies firmes',act:.5}],
  // canal p: 1 = de pie (así la miniatura y la imagen fija, que usan el pico de p, enseñan a la persona levantada); dentro, 1 = sentado
  build(c,b,E){const p=1-c.p,up=(kf,tl,bx)=>K.stand(b,Object.assign({kf,tilt:tl,sp:[-3],hd:-tl*.4,balance:true,arms:cross,bx},SO));
    const G=K.memo(this,'g',()=>{const kB=K.root(kf=>{up(kf,TB,BX);return K.low(b,['gluR','gluL','pel'],[0,SH,0]);},60,130);
      const h=up(kB,TB,BX);b.ikErr=0;return{kB,h};});
    if(p<=PC){const s=p/PC;up(mix(4,G.kB,s),mix(2,TB,s),mix(.05,BX,s));}
    else{const s=sst(0,1,(p-PC)/(1-PC)),tl=mix(TB,TS,s);b.pelvis([G.h.x-.03*s,G.h.y,0],{tilt:tl});K.trunk(b,{sp:[-3],hd:-tl*.4});
      K.rest(b,['gluR','gluL','pel'],[0,SH,0]);for(const[s2,k]of SS)b.footFlat(s2,[-.05,0,k*SO.fz],-k*SO.toe);K.legs(b);cross(b);}
    chair(E,G.h.x-.09,SH,-1);E.shadow([-.05,0,0],.55,.4,.55);}
});

})(window.GymAnim);
