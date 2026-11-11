/* Cargas variadas: elevación lateral con disco, paseo del granjero con discos, curl con kettlebell por los cuernos
   y jalón con banda por encima de la cabeza (banda sin anclaje) */
(function(GA){
const K=GA._.kit,V=GA._.V,C=GA._.COL,DM=GA._.DIM,SS=K.SS,mix=K.mix,sst=K.sst,D=K.D,PI=Math.PI,TAU=2*PI,sin=Math.sin,cos=Math.cos,UP=[0,1,0],Z=[0,0,1];
const TL=(u,lu,t,lt,d,ld,r,lr)=>[{p:1,dur:u,label:lu,act:1},{dur:t,label:lt,act:1},{p:0,dur:d,label:ld,act:.75},{dur:r,label:lr,act:.5}];
const sh=(E,x)=>E.shadow([x||0,0,0],.45,.33,.55);
// disco en pinza por el borde: cuelga vertical bajo el puño g (el borde entra 1,2 cm en el puño) en el plano que contiene el eje
// de agarre ax; bias: se pinta detrás del antebrazo (la mano queda sobre el borde)
const PLATE=(E,g,ax,r,th)=>{const a=V.norm(V.perp(ax,UP)),c=V.madd(g,UP,-(r-.012));E.plate(c,V.cross(a,UP),r,{th,bias:.05});return c;};

// ═══ ELEVACIÓN LATERAL CON DISCO ═══ como la de mancuernas (ref.js): tronco algo inclinado, codos suaves (~15°) y fijos, sube en
// el plano escapular hasta la altura del hombro liderando con el codo, sin encoger. Un disco de 5 kg en cada mano cogido en pinza
// por el borde: abajo cuelga junto al muslo (plano sagital) y arriba sigue colgando bajo la mano
GA.def('lib_plate_lateral_raise',{
  title:'Elevación lateral con disco',cam:{yaw:62,pitch:8},
  muscles:{sidedelts:1,frontdelts:.3,forearms:.3},labels:['Deltoides lateral','Antebrazo'],init:{p:0,act:.5},
  timeline:TL(1.4,'Sube · lidera con el codo',.5,'Pausa a la altura del hombro',2.6,'Baja lento · sin encoger',.4,'Abajo · pinza firme'),
  build(c,b,E){const p=c.p,r=.15;K.stand(b,{fx:-.06,fz:.13,toe:8,kf:6,tilt:7,sp:[-2],hd:-6,sc:[-.008,0]});
    for(const[s,k]of SS){const o={abd:mix(10,92,p),hz:mix(14,26,p),elbow:mix(12,16,p),rot:mix(-5,8,p)};b.armFK(s,o);
      o.grip=V.norm(V.perp(b.tdir(0,0,1),V.norm(V.sub(b.j(s,'wri'),b.j(s,'elb')))));b.armFK(s,o);
      const g=b.j(s,'grip');PLATE(E,g,o.grip,r,.03);if(k>0)E.trace('disco',g);}
    sh(E);}
});

// ═══ PASEO DEL GRANJERO CON DISCOS ═══ marcha de n_plyo_carry.js (~1 m/s, pasos cortos; el suelo se desplaza): un disco pesado en
// cada mano cogido en pinza por el borde, brazos rectos a los lados, hombros atrás y abajo; los discos cuelgan por fuera de las piernas
const FLOOR=(E,x,S)=>{const o=((x%S)+S)%S;for(let i=-5;i<=6;i++){const X=i*S-o;E.line([X,.002,-.45],[X,.002,.45],.006,'#cfd8e0',{alpha:.25*Math.max(0,1-Math.abs(X-.3)/2),layer:-1});}};
const GAIT=(b,E,cy,o)=>{const T=o.T,v=o.v,d=o.d||.62,L=v*T*d,xh=(o.x||0)+L*.5+.03,fz=o.fz||.1,M=GA._.EASE.mj;
 const pose=(s,k,u)=>{const t=u*T,hx=xh-v*t,z=k*fz,a=u<.1?-15*(1-u/.1)**2:u<.4?0:40*Math.pow((u-.4)/(d-.4),1.6);   // a + = talón arriba, - = punta arriba
  const r=a*D,f=[cos(r),-sin(r),0],n=[sin(r),cos(r),0],ax=a>=0?hx+.2-.145*cos(r)+.075*sin(r):hx+.055*cos(r)+.075*sin(r);
  return K.footOn(b,s,[ax,0,z],f,n);};
 for(const[s,k,of]of[['R',1,0],['L',-1,.5]]){const u=(cy+of)%1;
  if(u<d)pose(s,k,u);else{const w=(u-d)/(1-d),e=M(w),A0=pose(s,k,d),A1=pose(s,k,0),a=(w<.5?mix(40,-4,M(w/.5)):mix(-4,-15,M((w-.5)/.5)))*D;
   b.foot(s,V.add(V.lerp(A0,A1,e),[0,.075*Math.pow(sin(PI*Math.min(1,w*1.08)),1.3)*(1-.35*w),0]),[cos(a),-sin(a),0],[sin(a),cos(a),0]);}}
 const reach=s=>{const a=b.j(s,'ank'),dz=a[2]-K.sd(s)*DM.hipW;return a[1]+Math.sqrt(Math.max(.01,K.legD(3)**2-(a[0]-(o.x||0))**2-dz*dz));};
 const W=TAU*cy;b.pelvis([o.x||0,Math.min(o.H+.014*cos(2*W-2.6),reach('R'),reach('L')),.012*sin(W)],{tilt:o.tl||3,yaw:o.yw*cos(W),roll:1.5*sin(W)});
 K.trunk(b,{sp:[0,0,-o.tw*cos(W)],hd:o.hd,sc:o.sc});K.legs(b,{up:.1});FLOOR(E,v*T*cy,v*T/2);return W;};
GA.def('lib_farmer_walk_plates',{
  title:'Paseo del granjero con discos',cam:{yaw:30,pitch:8},fitBox:[[-.5,0,-.42],[.55,1.85,.42]],cycle:{period:1.05},note:'pasos cortos',
  muscles:{forearms:1,traps:1,abs:.5,glutes:.3,quads:.3},labels:['Antebrazo','Trapecio','Abdomen'],init:{act:.7},
  timeline:[{dur:1.05,label:'Pinza firme · hombros atrás',act:.7}],
  build(c,b,E){GAIT(b,E,c.cyc,{T:1.05,v:.95,d:.62,H:.92,tl:2,tw:4,yw:3,sc:[-.014,-.012],hd:-2});const R=K.armD(4),r=.19,HZ=.27;
    for(const[s,k]of SS){const S=b.sho(s),dz=k*HZ-S[2],g=[S[0]+.01,S[1]-Math.sqrt(R*R-dz*dz),k*HZ];b.arm(s,g,[-1,0,k*.3],[1,0,0]);PLATE(E,g,[1,0,0],r,.035);}
    E.shadow([0,0,0],.45,.35,.5);}
});

// ═══ CURL CON KETTLEBELL ═══ de pie, una kettlebell cogida por los cuernos con las dos manos (bola colgando por debajo, delante de los
// muslos), codos pegados a los costados (húmero casi vertical, deriva 3→9°): sube hasta el pecho y baja lento. Las manos van a los
// cuernos: la pesa se coloca a partir de los puños; arriba se inclina (la bola se aleja del pecho, como hacen las muñecas)
const AL=DM.fa+DM.grip;
// codo fijo (n_curls.js): húmero a a° de la vertical (+ adelante) y separación ab; antebrazo a a+fl° con la componente z que lleva el puño a ±zt
const CARM=(b,s,a,ab,fl,zt)=>{const k=K.sd(s),u=V.norm([sin(a*D),-cos(a*D),k*ab]),el=V.madd(b.sho(s),u,DM.ua),
  fz=K.clamp((k*zt-el[2])/AL,-.8,.8),q=Math.sqrt(1-fz*fz),ph=(a+fl)*D;b.armDir(s,u,[q*sin(ph),-q*cos(ph),fz],Z);return b.j(s,'grip');};
GA.def('lib_kb_curl',{
  title:'Curl con kettlebell',cam:{yaw:38,pitch:8},
  muscles:{biceps:1,forearms:.5},labels:['Bíceps','Antebrazo'],init:{p:0,act:.5},
  timeline:TL(1.2,'Sube · codos pegados',.5,'Aprieta arriba',2.6,'Baja lento · sin balanceo',.4,'Abajo · brazos estirados'),
  build(c,b,E){const p=c.p,kg=12,r=K.kbR(kg),hw=r*.62+.018,dc=r+.068,ou=-.0238+.3*(r*.74-dc),oa=.7*(hw+.01)+.168*r;   // cuernos: h + up·ou ± ax·oa
    K.stand(b,{fz:.12,toe:8,kf:5,tilt:1,sp:[-2],hd:4,sc:[-.012,-.015]});
    const G=SS.map(([s])=>CARM(b,s,mix(3,9,p*p),.06,mix(31,135,p),oa)),up=V.rot(UP,Z,mix(10,38,sst(0,1,p))*D);
    const kb=K.kettlebell(E,V.madd(V.lerp(G[0],G[1],.5),up,-ou),{kg,up,ax:Z});
    SS.forEach(([s,k])=>{b.S[s].gripAx=V.norm(V.add(V.mul(up,r*.74+.034-dc),V.mul(Z,k*(r*.56-hw-.01))));});
    E.trace('kettlebell',kb.c);sh(E);}
});

// ═══ JALÓN CON BANDA POR ENCIMA DE LA CABEZA ═══ de pie, banda (lazo) tensa entre las manos con los brazos estirados arriba, algo más
// abiertas que los hombros: abre la banda y baja los codos a los costados hasta que quede delante de la barbilla/pecho alto (por delante
// de la cara), escápulas abajo y atrás; vuelve lento a brazos estirados. La banda se alarga y adelgaza al estirarse
const clearHead=(b,P,g)=>{const e=K.ells(b),f=x=>Math.min(...K.HEAD.map(n=>K.sgap(e[n],[x,P[1],e[n][0][2]],.012)))-g;
  return f(P[0])>=0?P:[K.root(f,P[0],P[0]+.4),P[1],P[2]];};
GA.def('lib_band_overhead_pulldown',{
  title:'Jalón con banda por encima de la cabeza',cam:{yaw:-45,pitch:8},
  muscles:{lats:1,midback:.6,reardelts:.4,biceps:.3},labels:['Dorsales','Romboides'],init:{p:0,act:.5},
  timeline:TL(1.2,'Abre y baja · codos abajo',.6,'Aprieta · escápulas abajo',2.4,'Sube lento con tensión',.5,'Arriba · brazos estirados'),
  build(c,b,E){const p=c.p,pose=q=>K.stand(b,{fx:-.06,fz:.14,toe:8,kf:6,tilt:1,sp:[mix(-2,-5,q)],hd:mix(-3,-1,q),sc:[mix(.035,-.018,q),mix(.012,-.03,q)]});
    const tb=K.memo(this,'tb',()=>{const R=K.armD(5),T=[0,0,.3],B=[0,0,.44];pose(0);let S=b.sho('R');T[0]=S[0]+.06;T[1]=S[1]+Math.sqrt(R*R-(.3-S[2])**2-.0036);
      pose(1);S=b.sho('R');B[0]=S[0]+.17;B[1]=S[1]+.04;return[T,B];});
    pose(p);let h=V.lerp(tb[0],tb[1],p);h[0]+=.03*sin(PI*p);h=clearHead(b,h,.03);
    const G=SS.map(([s,k])=>{const g=[h[0],h[1],k*h[2]];b.arm(s,g,[-.25,-1,k*.9],Z);return g;});
    K.band(E,V.add(G[0],[0,0,-.03]),V.add(G[1],[0,0,.03]),{loop:1,flat:UP,col:K.BAND.green,w:.012,L0:.42});sh(E);}
});

})(window.GymAnim);
