/* ex/n_new_floor_bar.js */
/* En el suelo sin banco (esterilla): aperturas y pullover con mancuernas, press francés y pullover con barra recta, press de
   suelo con kettlebell. Boca arriba con la cabeza hacia -X, rodillas flexionadas y pies planos; abajo los codos (o la carga)
   llegan al suelo y eso limita el recorrido */
(function(GA){
const K=GA._.kit,V=GA._.V,DM=GA._.DIM,SS=K.SS,mix=K.mix,sst=K.sst,D=K.D,Z=[0,0,1],AL=DM.fa+DM.grip;
const PE='Pectoral',DO='Dorsales',TR='Tríceps';
const TL=(a,la,b,lb,c,lc,d,ld)=>[{p:1,dur:a,label:la,act:.8},{dur:b,label:lb,act:.9},{p:0,dur:c,label:lc,act:1},{dur:d,label:ld,act:.5}];
const EY=.04,CAM={yaw:-30,pitch:24};
const lie=(b,E,o)=>{const Y=K.mat(E,[-.1,0,0],[1.75,.62]).top;
  K.supine(b,Object.assign({y:Y,x:-.42,at:'sho',hd:'rest',sp:[-2],sc:[-.01,-.025]},o));
  for(const[s,k]of SS){b.footFlat(s,[b.hip(s)[0]+.42,Y,k*.18],-k*6);b.leg(s,null,[0,1,k*.25]);}
  E.shadow([-.1,0,0],.95,.4,.45);return Y;};
const BAR={len:1.5,inner:.45,plates:[.12]},PR=.12;
const once=(spec,key,b,f,lo,hi)=>K.memo(spec,key,()=>{const e0=b.ikErr,r=K.root(f,lo,hi);b.ikErr=e0;return r;});

const slerp=(a,b,t)=>{const w=Math.acos(K.clamp(V.dot(a,b),-1,1));if(w<1e-4)return a;const s=Math.sin(w);return V.add(V.mul(a,Math.sin((1-t)*w)/s),V.mul(b,Math.sin(t*w)/s));};
const ray=(c,P0,F,R)=>{const q=V.sub(P0,c),bq=V.dot(F,q);return V.madd(P0,F,-bq+Math.sqrt(Math.max(0,bq*bq-V.dot(q,q)+R*R)));};
const FR=K.armD(24);
const fly=(b,p,v)=>SS.map(([s,k])=>{const sh=b.sho(s),A=V.norm(V.sub(ray(sh,b.tpt(k*.085,-.17,0),b.tf.F,FR),sh)),B=V.norm(b.tdir(k*Math.cos(v*D),-.18,-Math.sin(v*D))),
  d=slerp(A,B,p),T=V.norm(V.cross(V.norm(V.cross(A,B)),d));b.arm(s,V.madd(sh,d,FR),V.add(T,[0,-.35,0]),b.tdir(0,1,0));return b.j(s,'grip');});
GA.def('lib_fly_floor_db',{title:'Aperturas en el suelo con mancuernas',cam:CAM,muscles:{pecs:1,frontdelts:.4},labels:[PE,'Deltoides anterior'],
  timeline:TL(2.2,'Abre en arco · codos suaves',.4,'Codos al suelo · sin rebote',1.4,'Junta en arco sobre el pecho',.5,'Arriba · sin chocar'),
  build(c,b,E){lie(b,E);const v=once(this,'v',b,x=>{fly(b,1,x);return b.j('R','elb')[1]-EY;},-25,45);
    fly(b,c.p,v).forEach((g,i)=>{E.dumbbell(g,b.tdir(0,1,0),{r:.05});if(!i)E.trace('mancuerna',g);});}});

const pull=(b,p,ph1,o)=>{b.scap('both',.02*sst(.25,1,p),-.02);const ph=mix(-4,ph1,p)*D,a=b.tdir(0,Math.sin(ph),Math.cos(ph)),pl=b.tdir(0,-Math.cos(ph),Math.sin(ph)),
  Rr=b.tdir(1,0,0),sm=V.lerp(b.sho('R'),b.sho('L'),.5),dz=V.dot(V.sub(b.sho('R'),sm),Rr)-o.hw,hm=V.madd(sm,a,Math.sqrt(K.armD(o.el)**2-dz*dz));
  for(const[s,k]of SS)b.arm(s,V.madd(hm,Rr,k*o.hw),V.add(pl,V.mul(Rr,k*o.fl)),Rr);return{hm,a,Rr};};
const PTL=(l2,l3)=>TL(2.6,'Baja tras la cabeza en arco',.4,l2,1.4,l3,.5,'Arriba · codos suaves'),PCAM={yaw:-20,pitch:22};
const DBP={el:20,hw:.055,fl:1},dbC=P=>V.madd(P.hm,P.a,-.04);
const dbLow=P=>{const a=P.a,c=dbC(P),sy=Math.sqrt(Math.max(0,1-a[1]*a[1]));return Math.min(...[.1075,-.1075].map(t=>c[1]+a[1]*t-.075*sy-.0375*Math.abs(a[1])));};
GA.def('lib_pullover_floor_db',{title:'Pullover en el suelo con mancuerna',cam:PCAM,muscles:{lats:1,pecs:.6,triceps:.4},labels:[DO,PE],
  timeline:PTL('Estira · costillas abajo','Sube sobre el pecho'),
  build(c,b,E){const Y=lie(b,E,{sc:[0,-.02]}),ph=once(this,'ph',b,x=>dbLow(pull(b,1,x,DBP))-Y-.012,50,115),P=pull(b,c.p,ph,DBP);
    E.dumbbell(dbC(P),P.a,{r:.075,hl:.075,len:.14});E.trace('mancuerna',V.madd(P.hm,P.a,.1));}});
const BBP={el:16,hw:.21,fl:.25};
GA.def('lib_pullover_bb',{title:'Pullover con barra',cam:PCAM,muscles:{lats:1,pecs:.6,triceps:.4},labels:[DO,PE],
  timeline:PTL('Estira · discos sin tocar','Tira hasta sobre el pecho'),
  build(c,b,E){const Y=lie(b,E,{sc:[0,-.02]}),ph=once(this,'ph',b,x=>pull(b,1,x,BBP).hm[1]-PR-Y-.012,50,115),P=pull(b,c.p,ph,BBP);
    K.barbell(E,P.hm,P.Rr,BAR);E.trace('barra',V.madd(P.hm,P.Rr,.75));}});

const arm=(b,s,a,ab,fl,zt)=>{const k=K.sd(s),u=V.norm([Math.sin(a*D),-Math.cos(a*D),k*ab]),el=V.madd(b.sho(s),u,DM.ua),
  fz=K.clamp((k*zt-el[2])/AL,-.8,.8),q=Math.sqrt(1-fz*fz),ph=(a+fl)*D;b.armDir(s,u,[q*Math.sin(ph),-q*Math.cos(ph),fz],Z);return b.j(s,'grip');};
GA.def('lib_skull_crusher_bb',{title:'Press francés con barra recta',cam:{yaw:22,pitch:20},fitBox:[[-.95,0,-.3],[.78,.78,.3]],muscles:{triceps:1},labels:[TR],
  timeline:TL(2.4,'Baja a la frente en 2,4 s',.3,'Codos al techo · quietos',1.2,'Extiende completo',.5,'Arriba · húmeros fijos'),
  build(c,b,E){lie(b,E);const G=SS.map(([s])=>arm(b,s,190,-.06,mix(3,110,c.p),.14)),m=V.lerp(G[0],G[1],.5);
    K.barbell(E,m,Z,BAR);E.trace('barra',V.madd(m,Z,.75));}});

const KG=16;
const kbPress=(b,p)=>{const sh=b.sho('R'),dn=Math.asin((sh[1]-EY)/DM.ua),hd=V.norm(V.perp(b.tdir(Math.SQRT1_2,-Math.SQRT1_2,0),[0,1,0])),
  hb=V.add(V.mul(hd,Math.cos(dn)),[0,-Math.sin(dn),0]),bot=V.add(V.madd(sh,hb,DM.ua),[0,AL,0]),R=K.armD(8),w=1-p,
  top=[sh[0]+.03,sh[1]+Math.sqrt(R*R-.0013),sh[2]-.02],g=[mix(bot[0],top[0],w),mix(bot[1],top[1],w),mix(bot[2],top[2],Math.pow(w,1.5))];
  b.arm('R',g,hb,Z);const S=b.S.R,fd=V.norm(V.sub(S.grip,S.elb)),wv=V.norm(V.perp(V.lerp(Z,b.tdir(0,1,0),.55*w),fd));
  S.gripAx=V.norm(V.cross(fd,wv));return{g:S.grip,ax:S.gripAx,bd:V.norm(V.add(V.mul(fd,-Math.cos(50*D)),V.mul(wv,Math.sin(50*D))))};};
GA.def('lib_kb_floor_press',{title:'Press de suelo con kettlebell',cam:CAM,muscles:{pecs_R:1,triceps_R:.7,frontdelts_R:.4},labels:[PE,TR],
  timeline:TL(2.2,'Baja hasta apoyar el codo',.6,'Codo en el suelo · pausa',1.2,'Empuja al techo',.6,'Arriba · muñeca recta'),
  build(c,b,E){lie(b,E);K.armsFloor(b,E,{y:0,spread:40,sides:['L']});const q=kbPress(b,c.p);
    K.kettlebell(E,q.g,{kg:KG,up:V.neg(q.bd),ax:q.ax});E.trace('pesa',q.g);}});

})(window.GymAnim);
