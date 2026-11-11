/* ex/n_triceps_forearm.js */
/* Tríceps y antebrazo: press francés y extensión con barra Z, jalones en polea (barra, una mano, supino), patadas (cable, mancuerna),
   extensión sobre la cabeza (mancuerna, banda), TRX; curls de muñeca (barra, mancuernas, inverso) y pinza con discos */
(function(GA){
const K=GA._.kit,V=GA._.V,C=GA._.COL,DM=GA._.DIM,SS=K.SS,mix=K.mix,D=K.D,Z=[0,0,1],UP=[0,1,0],AL=DM.fa+DM.grip;
const TR='Tríceps',FA='Antebrazo',AB='Abdomen',DP='Deltoides post.',I0={p:0};
const TL=(e,a,la,b,lb,c,lc,d,ld)=>{const A=e?[.8,.85,1,.55]:[1,1,.75,.5];
  return[{p:1,dur:a,label:la,act:A[0]},{dur:b,label:lb,act:A[1]},{p:0,dur:c,label:lc,act:A[2]},{dur:d,label:ld,act:A[3]}];};
const arm=(b,s,a,ab,fl,zt,r)=>{const k=K.sd(s),u=V.norm([Math.sin(a*D),-Math.cos(a*D),k*ab]),el=V.madd(b.sho(s),u,DM.ua),
  fz=K.clamp((k*zt-el[2])/AL,-.8,.8),q=Math.sqrt(1-fz*fz),ph=(a+fl)*D,f=[q*Math.sin(ph),-q*Math.cos(ph),fz];
  b.armDir(s,u,f,V.rot(V.norm(V.cross(Z,f)),f,k*(r||0)*D));return b.j(s,'grip');};
const ST=(b,o)=>K.stand(b,Object.assign({fz:.12,toe:8,kf:5,tilt:1,sp:[-2],hd:4,sc:[-.012,-.015]},o));
const SH=(E,x)=>E.shadow([x||0,0,0],.45,.32,.55);
const EZ=(b,E,G)=>{const ax=V.norm(V.sub(G[0],G[1])),bend=V.norm(V.cross(ax,V.sub(G[0],b.j('R','elb')))),ez=K.ezbar(E,V.madd(V.lerp(G[0],G[1],.5),bend,-.017),ax,{bend,plates:[.12]});
  SS.forEach(([s],i)=>b.S[s].gripAx=ez.axes.narrow[i]);E.trace('barra',ez.grips.narrow[0]);};
const FIST=(b,E)=>{if(E._wr)return;const e0=E.ell;E._wr=1;E.ell=(c,ax,col,o)=>{const g=o&&o.grp,T=g&&g.length===3&&g[0]==='f'&&b.S[g[2]];
  if(!T||!(T._h||T._th)||Math.abs(V.len(ax[0])-.05)>1e-4)return e0(c,ax,col,o);
  const h=T._h||V.norm(ax[0]),ga=V.norm(V.perp(T._h?T.gripAx||ax[1]:ax[1],h)),pn=V.cross(h,ga),fc=T._h?V.madd(T.wri,h,.052):c,r=e0(fc,[V.mul(h,.05),V.mul(ga,.044),V.mul(pn,.03)],col,o);
  if(T._th){const t=V.dot(ga,T._th)<0?V.neg(ga):ga,pm=V.mul(V.norm(V.cross(t,h)),g[2]==='R'?1:-1),P=(a,x,y)=>V.madd(V.madd(V.madd(fc,pm,a),h,x),t,y);
    e0(P(.02,-.012,0),[V.mul(h,.034),V.mul(t,.034),V.mul(pm,.011)],'#ecbc98',Object.assign({outline:false},o));
    e0(P(.022,.02,.03),[V.mul(t,.017),V.mul(h,.022),V.mul(pm,.012)],col,o);}return r;};};
const HAND=(b,E,s,h)=>{const S=b.S[s];S._h=V.norm(h);S.grip=V.madd(S.wri,S._h,DM.grip);FIST(b,E);return S.grip;};
const TH=(b,E,th)=>{for(const[s,k]of SS)b.S[s]._th=[0,0,k*th];FIST(b,E);};

GA.def('lib_skull_crusher_ez',{title:'Press francés con barra Z',cam:{yaw:28,pitch:22},fitBox:[[-.92,0,-.42],[.78,1.2,.42]],muscles:{triceps:1},labels:[TR],init:I0,
  timeline:TL(1,2.5,'Baja a la frente en 2,5 s',.3,'Codos al techo',1.2,'Extiende completo',.5,'Arriba · húmeros quietos'),
  build(c,b,E){E.bench({at:[0,0,0],dir:0,h:.44,seat:.42,back:.82,inc:0});b.pelvis([.13,.567,0],{tilt:-90});K.trunk(b,{sp:[1],hd:-12,sc:[-.01,-.005]});
    EZ(b,E,SS.map(([s])=>arm(b,s,181,-.07,mix(3,116,c.p),.1475,90)));
    for(const[s,k]of SS){b.footFlat(s,[.6,0,k*.3],k*-18);b.leg(s,null,[.3,1,k*.4]);}E.shadow([0,0,0],.9,.45,.55);}});

GA.def('lib_overhead_ext_ez',{title:'Extensión de tríceps sobre la cabeza con barra Z',cam:{yaw:45,pitch:8},muscles:{triceps:1,abs:.25},labels:[TR,AB],init:I0,
  timeline:TL(1,2.5,'Baja tras la nuca',.3,'Codos arriba · estira',1.2,'Extiende sin arquear',.5,'Arriba · abdomen firme'),
  build(c,b,E){ST(b,{fz:.13,kf:7,sp:[-1],hd:2,sc:[.03,.01]});EZ(b,E,SS.map(([s])=>arm(b,s,172,-.08,mix(4,128,c.p),.1475,90)));SH(E);}});

GA.def('lib_overhead_ext_db',{title:'Extensión de tríceps sobre la cabeza con mancuerna',cam:{yaw:38,pitch:12},muscles:{triceps:1,abs:.25},labels:[TR,AB],init:I0,
  timeline:TL(1,2.5,'Baja tras la nuca',.3,'Codos arriba · estira',1.2,'Extiende completo',.5,'Arriba · costillas abajo'),
  build(c,b,E){const p=c.p;ST(b,{fz:.13,kf:7,sp:[-1],hd:2,sc:[.03,.01]});
    const G=SS.map(([s,k])=>{arm(b,s,173,-.14,mix(4,130,p),.09,0);b.S[s].gripAx=Z;const f=V.norm(V.sub(b.j(s,'wri'),b.j(s,'elb')));return HAND(b,E,s,V.rot(f,Z,mix(30,-40,p)*D));}),
      m=V.lerp(G[0],G[1],.5);E.dumbbell(V.add(m,[0,.03-.0675,0]),UP,{r:.085,hl:.07});E.trace('mancuerna',m);SH(E);}});

const tower=(E,R,f,py,g,g0,ax,wr)=>{const s=[-f[2],0,f[0]],P=(a,y,c)=>[R[0]+f[0]*a+s[0]*c,y,R[1]+f[2]*a+s[2]*c],yw=Math.atan2(-f[2],f[0])/D,T=2.05,B=-.36,Q=P(.09,py,0);
  let cl=g;if(ax){let d=V.norm(V.perp(V.sub(Q,g),ax));if(wr){const w=V.norm(V.perp(V.sub(wr,g),ax)),l=V.norm(V.cross(ax,w));d=V.add(V.mul(w,-.42),V.mul(l,l[2]<0?-.91:.91));}cl=V.madd(g,d,.075);E.handle(g,ax);for(const k of[-1,1])E.line(V.madd(g,ax,k*.06),cl,.006,'#1b1e22');E.sph(cl,.009,C.chrome);}
  const d=V.norm(V.sub(cl,Q));E.beam(P(0,0,0),P(0,T,0),.08,C.frame);E.boxA(P(.045,py,0),[.05,.15,.12],C.frameD,{yaw:yw});
  E.pulley(Q,V.norm(V.cross(d,f)),.04);E.cable(V.madd(Q,d,.04),cl);
  for(const k of[-1,1]){E.beam(P(B,0,k*.22),P(B,T,k*.22),.06,C.frame,{bias:.2});E.beam(P(B,.03,k*.3),P(B,.03,-k*.3),.08,C.frameD,{layer:-1});}
  E.beam(P(.04,T,0),P(B-.04,T,0),.07,C.frame);E.beam(P(.18,.03,0),P(B-.12,.03,0),.08,C.frameD,{layer:-1});
  const top=E.stack(P(B,0,0),{h:1.6,lift:V.dist(Q,g)-V.dist(Q,g0)+.03,n:14,sel:5,yaw:yw,w:.26,bias:.25});
  E.pulley(P(B,T-.07,0),s,.04);E.cable(P(0,T-.03,0),P(B,T-.03,0));E.cable(P(B,T-.07,0),V.add(top,[0,.02,0]));};
const PQ=[.41,2,0],PTL=TL(0,1.2,'Extiende · codos pegados',.6,'Aprieta abajo',2.4,'Sube lento hasta 90°',.4,'Arriba · codos fijos');
const PD=(b,q,zt,r,one)=>{ST(b,{fx:-.1,tilt:12,kf:8,sp:[-2],hd:-8,sc:[-.01,0]});if(one)b.armFK('L',{abd:8,elbow:14});
  return(one?[['R']]:SS).map(([s])=>arm(b,s,5,.1,mix(92,6,q),zt,r));};
const CL=G=>{const m=V.lerp(G[0],G[1],.5);return V.madd(m,V.norm(V.sub(PQ,m)),.06);};
const BAR=(E,G)=>{const m=V.lerp(G[0],G[1],.5),ax=V.norm(V.sub(G[0],G[1])),cl=CL(G);E.bar(V.madd(m,ax,-.28),V.madd(m,ax,.28),{r:.0145});
  for(const k of[-1,1])E.cyl(V.madd(m,ax,k*.27),V.madd(m,ax,k*.3),.019,C.rubber);E.cyl(m,cl,.011,C.chrome);E.sph(m,.02,C.frameD);E.sph(cl,.013,C.chrome);return cl;};

GA.def('lib_tricep_pushdown_bar',{title:'Jalón de tríceps en cable con barra recta',cam:{yaw:30,pitch:8},fitBox:[[-.4,0,-.45],[.95,2.1,.45]],muscles:{triceps:1,forearms:.25},labels:[TR,FA],init:I0,
  o:{zt:.16,r:90,th:-1},timeline:PTL,
  build(c,b,E){const o=this.o,c0=K.memo(this,'c0',()=>CL(PD(b,0,o.zt,o.r))),G=PD(b,c.p,o.zt,o.r);TH(b,E,o.th);tower(E,[.5,0],[-1,0,0],2,BAR(E,G),c0);E.trace('barra',G[0]);SH(E);}});
GA.alias('lib_tricep_pushdown_rev','lib_tricep_pushdown_bar',{title:'Jalón de tríceps en cable con agarre supino',cam:{yaw:45,pitch:14},muscles:{triceps:1,forearms:.35},o:{zt:.17,r:-90,th:1},
  timeline:TL(0,1.2,'Extiende · palmas arriba',.6,'Aprieta abajo',2.4,'Sube lento · codos fijos',.4,'Arriba · muñecas rectas')});
GA.def('lib_tricep_pushdown_one_arm',{title:'Jalón de tríceps en cable a una mano',cam:{yaw:30,pitch:8},fitBox:[[-.4,0,-.4],[.95,2.1,.6]],muscles:{triceps_R:1,forearms_R:.25},labels:[TR,FA],init:I0,
  timeline:TL(0,1.1,'Extiende por completo',.6,'Aprieta abajo',2.4,'Sube lento · codo pegado',.4,'Arriba · 90°'),
  build(c,b,E){const g0=K.memo(this,'g0',()=>PD(b,0,.21,90,1)[0]),g=PD(b,c.p,.21,90,1)[0];tower(E,[.5,.21],[-1,0,0],2,g,g0,b.S.R.gripAx);E.trace('maneral',g);SH(E);}});

GA.def('lib_band_tricep_pushdown',{title:'Jalón de tríceps con banda elástica',cam:{yaw:30,pitch:8},fitBox:[[-.4,0,-.4],[.6,2.1,.4]],muscles:{triceps:1,forearms:.25},labels:[TR,FA],init:I0,
  timeline:TL(0,1.2,'Extiende · codos pegados',.6,'Aprieta abajo',2.4,'Sube lento contra la banda',.4,'Arriba · 90°'),
  build(c,b,E){const AN=[.5,1.95,0];PD(b,c.p,.19,0).forEach((g,i)=>K.band(E,[AN[0]-.005,AN[1],SS[i][1]*.03],g,{handle:b.S[SS[i][0]].gripAx,col:K.BAND.green,L0:.75}));
    E.beam([AN[0]+.04,0,0],[AN[0]+.04,2.15,0],.08,C.frame);E.boxA([AN[0]+.04,AN[1],0],[.094,.035,.094],K.COL.strap);E.boxA([AN[0]+.04,.02,0],[.4,.04,.4],C.frameD,{layer:-1});
    E.trace('asa',b.j('R','grip'));SH(E);}});

const taut=(F,P,m)=>{const o=[F];let a=F;while(a!==m){let w=m,bs=(m[0]-a[0])/Math.max(1e-3,m[1]-a[1]);for(const q of P)if(q[1]>a[1]+.01){const s=(q[0]-a[0])/(q[1]-a[1]);if(s<bs){bs=s;w=q;}}o.push(w);a=w;}return o;};
GA.def('lib_band_tricep_overhead',{title:'Extensión de tríceps sobre la cabeza con banda elástica',cam:{yaw:-30,pitch:8},muscles:{triceps:1,forearms:.25},labels:[TR,FA],init:I0,
  timeline:TL(1,2.4,'Baja tras la nuca',.3,'Codos junto a la cabeza',1.1,'Estira hacia arriba',.5,'Arriba · aprieta'),
  build(c,b,E){ST(b,{feet:{R:[-.42,.1],L:[.18,-.11]},kf:6,tilt:3,sp:[-1],hd:2,sc:[.03,.01]});
    const G=SS.map(([s])=>arm(b,s,174,-.14,mix(4,130,c.p),.035,90)),m=V.lerp(G[0],G[1],.5),a=b.j('R','ank'),F=[a[0]+.07,.006,a[2]-.06];
    K.band(E,[F,...taut(V.add(b.j('R','kne'),[-.03,0,-.075]),[b.ppt(0,-.03,-.15),b.tpt(0,-.12,-.125),b.hpt(0,.02,-.16)],m)],0,{col:K.BAND.red,w:.009,L0:1.3});E.trace('manos',m);SH(E,-.1);}});

GA.def('lib_kickback_db',{title:'Patada de tríceps con mancuerna',cam:{yaw:30,pitch:14},muscles:{triceps_R:1,reardelts_R:.3},labels:[TR,DP],init:I0,
  timeline:TL(0,1,'Extiende atrás · codo fijo',.8,'Aprieta · brazo recto',2.2,'Vuelve lento a 90°',.4,'Codo alto y quieto'),
  build(c,b,E){const BH=.45;b.pelvis([0,.89,0],{tilt:72});K.trunk(b,{sp:[-2],hd:-6,sc:[0,-.015]});
    const sl=b.sho('L');K.palm(b,E,'L',[sl[0]+.05+Math.sqrt(Math.max(K.armD(8)**2-(sl[1]-BH-.029)**2-(sl[2]+.19)**2,0)),BH,-.19],{pole:[-1,.1,-.3]});
    const hl=b.hip('L'),kn=[0,BH+.056,-.12];kn[0]=hl[0]+Math.sqrt(Math.max(DM.th**2-(kn[1]-hl[1])**2-(kn[2]-hl[2])**2,.01));
    b.legDir('L',V.sub(kn,hl),[-1,-.05,0]);b.footRelax('L',60);const hr=b.hip('R');b.footFlat('R',[hr[0]-.05,0,.16],-15);b.leg('R',null,[1,.1,.25]);
    const g=arm(b,'R',-84,.1,mix(96,4,c.p),.25,0);E.dumbbell(g,b.S.R.gripAx,{r:.05,hl:.05});E.trace('mancuerna',g);
    E.bench({at:[.92,0,-.15],dir:0,h:BH,seat:0,back:1.14,inc:0,w:.28});E.shadow([.2,0,0],.8,.45,.55);}});

GA.def('lib_tricep_kickback_cable',{title:'Patada de tríceps en cable',cam:{yaw:28,pitch:10},fitBox:[[-.7,0,-.35],[1.0,1.6,.5]],muscles:{triceps_R:1,reardelts_R:.25},labels:[TR,DP],init:I0,
  timeline:TL(0,1,'Extiende atrás',.7,'Aprieta · brazo recto',2.2,'Vuelve lento',.4,'Codo fijo al costado'),
  build(c,b,E){const pose=q=>{ST(b,{feet:{R:[-.36,.13],L:[.2,-.12]},kf:16,tilt:55,sp:[2],hd:-14,sc:[0,-.01]});
      const hl=b.hip('L'),kl=b.j('L','kne'),td=V.norm(V.sub(kl,hl));K.palm(b,E,'L',V.madd(V.lerp(hl,kl,.8),V.norm(V.perp(UP,td)),.064),{fd:td,n:V.perp(UP,td),pole:[-.2,.3,-1],draw:q!=null});
      return arm(b,'R',-74,.1,mix(90,4,q||0),.22,0);};
    const g0=K.memo(this,'g0',()=>pose()),g=pose(c.p);tower(E,[.9,.27],[-1,0,0],.22,g,g0,b.S.R.gripAx,b.S.R.wri);E.trace('maneral',g);SH(E,-.05);}});

GA.def('lib_trx_tricep_ext',{title:'Extensión de tríceps en TRX',cam:{yaw:24,pitch:6},fitBox:[[-.4,0,-.45],[.95,2.2,.45]],muscles:{triceps:1,abs:.3},labels:[TR,AB],init:I0,
  timeline:TL(1,2.4,'Manos a la frente · baja',.3,'Codos al frente',1.2,'Estira fuerte',.5,'Cuerpo rígido'),
  build(c,b,E){const A=[-.6,2.5,0],LT=2.05,q=c.p,LL=Math.sqrt(K.legD(2)**2-(.12-DM.hipW)**2);let G;
    const pose=th=>{const r=th*D,u=[Math.sin(r),Math.cos(r),0];for(const[s,k]of SS)K.footBallOn(b,s,[0,0,k*.12],0,Math.max(0,th-18));
      b.pelvis(V.madd(V.lerp(b.j('R','ank'),b.j('L','ank'),.5),u,LL),{tilt:th});K.trunk(b,{sp:[0],hd:-4,sc:[.02,.02]});K.legs(b,{up:0});
      G=SS.map(([s])=>arm(b,s,mix(110,120,q)-th,-.02,mix(4,120,q),.15,90));return V.dist(A,V.lerp(G[0],G[1],.5))-LT;};
    const th=K.root(pose,5,60);b.ikErr=0;pose(th);K.trx(E,A,G[0],G[1],{ax:[b.S.R.gripAx,b.S.L.gripAx]});E.trace('asa',G[0]);E.shadow([.3,0,0],.7,.35,.55);}});

const WR=(b,E,A,w)=>SS.map(([s])=>{const[El,W]=A[s],f=V.norm(V.sub(W,El));b.armDir(s,V.sub(El,b.sho(s)),f,Z);return HAND(b,E,s,V.rot(f,V.norm(V.cross(f,UP)),w*D));});
const thighs=(ctx,b,E)=>{K.box(E,[-.6,0,0],[1.1,.45,.3],{kind:'bench'});
  const pose=t=>{K.seat(b,[-.15,.45,0],{tilt:t,sp:[6],hd:-14,sc:[.005,.03],feet:{x:.25,z:.2,toe:12}});const A={};
    for(const[s,k]of SS){const H=b.hip(s),Kn=b.j(s,'kne'),td=V.norm(V.sub(Kn,H)),n=V.norm(V.perp(UP,td)),W=V.madd(V.madd(Kn,td,.08),n,.083);
      A[s]=[V.madd(V.madd(H,td,DM.th+.08-Math.sqrt(DM.fa**2-.03**2)),n,.113),W];}return A;};
  const t=K.memo(ctx,'t',()=>K.root(t=>{const e=pose(t).R[0];return V.dist(b.sho('R'),e)-DM.ua;},15,75));return pose(t);};
const kneelB=(ctx,b,E)=>{const X0=.74,top=K.box(E,[X0,0,0],[.3,.44,1.2],{kind:'bench'}).y;
  const pose=t=>{K.kneel(b,{x:0,kz:.13,thigh:8,tilt:t,sp:[8],hd:-18,sc:[.01,.035]});const A={};
    for(const[s,k]of SS){const W=[X0+.165,top+.026,k*.16];A[s]=[V.add(W,[-Math.sqrt(DM.fa**2-.013**2),.013,0]),W];}return A;};
  const t=K.memo(ctx,'t',()=>K.root(t=>{const e=pose(t).R[0];return V.dist(b.sho('R'),e)-DM.ua;},25,85));return pose(t);};
const WTL=(a,b)=>[{p:1,dur:1,label:a,act:1},{dur:.5,label:'Aprieta arriba',act:1},{p:0,dur:2,label:b,act:.75},{dur:.4,label:'Abajo · estira',act:.5}];

GA.def('lib_wrist_curl_bb',{title:'Curl de muñeca con barra',cam:{yaw:34,pitch:16},muscles:{forearms:1},labels:[FA],init:I0,
  timeline:WTL('Flexiona las muñecas','Baja lento hasta estirar'),
  build(c,b,E){const G=WR(b,E,kneelB(this,b,E),mix(-55,45,c.p));TH(b,E,1);K.barbell(E,V.lerp(G[0],G[1],.5),Z,{len:1.7,inner:.63,plates:[.15]});E.trace('barra',G[0]);E.shadow([.35,0,0],.7,.4,.55);}});
GA.def('lib_wrist_curl_db',{title:'Curl de muñeca con mancuernas',cam:{yaw:40,pitch:26},muscles:{forearms:1},labels:[FA],init:I0,
  timeline:WTL('Sube sólo con la muñeca','Baja lento hasta estirar'),
  build(c,b,E){TH(b,E,1);WR(b,E,thighs(this,b,E),mix(-55,45,c.p)).forEach((g,i)=>{E.dumbbell(g,Z,{r:.045,hl:.045});if(!i)E.trace('mancuerna',g);});E.shadow([0,0,0],.7,.4,.55);}});
GA.def('lib_reverse_wrist_curl_db',{title:'Curl de muñeca inverso con mancuernas',cam:{yaw:44,pitch:24},muscles:{forearms:1},labels:[FA],init:I0,
  timeline:WTL('Sube el dorso de la mano','Baja lento'),
  build(c,b,E){TH(b,E,-1);WR(b,E,kneelB(this,b,E),mix(-45,38,c.p)).forEach((g,i)=>{E.dumbbell(g,Z,{r:.04,hl:.04});if(!i)E.trace('mancuerna',g);});E.shadow([.35,0,0],.7,.4,.55);}});

GA.def('lib_plate_pinch',{title:'Agarre de pinza con discos',cam:{yaw:40,pitch:6},muscles:{forearms:1},labels:[FA],init:{p:0},note:'Aguanta 30 s',
  timeline:[{p:1,dur:1,label:'Pellizca · hombros abajo',act:1},{dur:3,label:'Aprieta los dedos',act:1},{p:0,dur:1,label:'Respira sin soltar',act:.9},{dur:.6,label:'Brazos rectos',act:.9}],
  build(c,b,E){const p=c.p;ST(b,{fz:.13,sc:[mix(.005,-.018,p),-.02]});
    for(const[s,k]of SS){b.armDir(s,[.02,-1,k*.12],[.03,-1,k*.13],[1,0,0]);const g=b.j(s,'grip'),r=.155;
      for(const j of[-1,1])K.plate(E,[g[0],g[1]-r+.012,g[2]+j*.0145],Z,{r,th:.028});}E.shadow([0,0,0],.45,.38,.55);}});

})(window.GymAnim);
