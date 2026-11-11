/* Ejercicios de referencia (patrones para el resto) */
(function(GA){
const C=GA._.COL;

// ═══ SENTADILLA EN SMITH ════════════════════════════════════════════════════
// Barra alta sobre trapecios, trayectoria vertical (guías), pies ~10 cm por delante
// de la barra, cadera atrás y abajo, rodillas siguen la punta del pie, tronco ~30°
// al fondo, muslos paralelos, talones apoyados, arriba sin bloquear rodillas.
GA.def('lib_squat_smith',{
  title:'Sentadilla en Smith',
  cam:{yaw:42,pitch:8},
  fitBox:[[-.6,0,-.8],[.45,1.8,.8]],
  muscles:{quads:1,glutes:1,adductors:.5},
  labels:['Cuádriceps','Glúteos','Aductores'],
  timeline:[
    {p:1,dur:2.4,label:'Baja controlando',act:.85},
    {dur:.35,label:'Pausa · muslos paralelos',act:.95},
    {p:0,dur:1.3,label:'Sube · empuja con talones',act:1},
    {dur:.8,label:'Arriba · sin bloquear',act:.45}
  ],
  build(c,b,E){
    const V=E.V,p=c.p,BX=-.05,TO=14,FX=-.05;
    // 1) pies fijos (talón, apertura)
    b.footFlat('R',[FX,0,.165],-TO);b.footFlat('L',[FX,0,-.165],TO);
    const ank=b.j('R','ank'),ankL=b.j('L','ank');
    // 2) tronco: inclinación según profundidad; la barra se apoya en trapecios
    const LB=35,lean=8+(LB-8)*p;
    const barOf=(hip,ln)=>{b.pelvis(hip,{tilt:ln});b.spine(-4);b.head(-ln*.6);return b.tpt(0,-.03,-.062);};
    const hxOf=ln=>BX-barOf([0,1,0],ln)[0];   // barra siempre sobre la guía (x fijo)
    const hx=hxOf(lean),hx1=hxOf(LB);
    const dz=b.hip('R')[2]-ank[2];
    const hTop=ank[1]+Math.sqrt(Math.max(.868*.868-(hx-ank[0])**2-dz*dz,.05));
    // 3) profundidad (postura final): cadera a la altura de la rodilla (muslo paralelo)
    const hBot=E.solve(hy=>{b.pelvis([hx1,hy,0],{tilt:LB});b.leg('R',ank,V.yaw(-TO-4));return hy-b.j('R','kne')[1]-.01;},.3,.8);
    const bar=barOf([hx,E.mix(hTop,hBot,p),0],lean);
    b.leg('R',ank,V.yaw(-TO-4));b.leg('L',ankL,V.yaw(TO+4));
    // 4) manos en la barra (más anchas que hombros), codos abajo/atrás
    b.arm('R',[bar[0],bar[1],.36],[-.45,-1,.35],[0,0,1]);b.arm('L',[bar[0],bar[1],-.36],[-.45,-1,-.35],[0,0,1]);
    // ── máquina Smith ──
    const RZ=.6;
    for(const k of[-1,1]){
      E.beam([BX,0,k*RZ],[BX,2.2,k*RZ],.06,C.frame);
      E.beam([BX-.5,.03,k*RZ],[BX+.55,.03,k*RZ],.07,C.frameD,{layer:-1});
      E.boxA([BX,bar[1],k*RZ],[.1,.13,.1],C.frameD);
    }
    E.beam([BX,2.2,-RZ-.03],[BX,2.2,RZ+.03],.07,C.frame);
    E.bar([bar[0],bar[1],-1.02],[bar[0],bar[1],1.02],{r:.0145});
    for(const k of[-1,1]){
      E.cyl([bar[0],bar[1],k*.66],[bar[0],bar[1],k*.69],.04,C.chrome);
      E.plate([bar[0],bar[1],k*.725],[0,0,1],.225);
      E.plate([bar[0],bar[1],k*.78],[0,0,1],.165,{th:.035});
    }
    E.trace('barra',[bar[0],bar[1],1.02]);
    E.shadow([0,0,0],.5,.35,.55);
  }
});

// ═══ EXTENSIÓN DE CUÁDRICEPS ════════════════════════════════════════════════
// Rodilla alineada con el eje de la máquina, rodillo sobre la parte baja de la tibia,
// espalda apoyada, manos en las asas. De 90° a casi extensión completa (sin bloquear),
// 2 s sube · 1 s aprieta · 3 s baja.
GA.def('lib_leg_ext',{
  title:'Extensión de cuádriceps',
  cam:{yaw:38,pitch:10},
  muscles:{quads:1},
  labels:['Cuádriceps'],
  timeline:[
    {p:1,dur:2,label:'Sube',act:1},
    {dur:1,label:'Aprieta · sin bloquear',act:1},
    {p:0,dur:3,label:'Baja controlando',act:.75},
    {dur:.5,label:'Abajo · sin soltar el peso',act:.5}
  ],
  build(c,b,E){
    const V=E.V,p=c.p,SY=.5,HX=0,HY=SY+.09;
    // tronco reclinado contra el respaldo (~12°), cabeza neutra
    b.pelvis([HX,HY,0],{tilt:-12});b.spine(0);b.head(8);
    // muslo horizontal → rodilla en el eje de la máquina
    const knee=(s)=>[HX+E.DIM.th,HY,s==='R'?.1:-.1];
    const flex=90-80*p;                                  // flexión de rodilla 90°→10°
    const sh=V.xy(-flex),sa=V.xy(90-flex);               // tibia y su cara anterior (plano XY)
    for(const s of['R','L']){const kn=knee(s);
      b.leg(s,V.madd(kn,sh,E.DIM.sh),[.2,1,0]);b.footRelax(s,-8);}
    // manos en las asas laterales
    b.arm('R',[-.02,SY+.02,.3],[-1,-.2,.6],[1,0,0]);b.arm('L',[-.02,SY+.02,-.3],[-1,-.2,-.6],[1,0,0]);
    // ── máquina ──
    const PX=HX+E.DIM.th,PY=HY,CZ=-.36,CR=.11;
    E.pad([-.24,SY-.04,0],[.36,SY-.04,0],.42,.08,C.pad,{up:[0,1,0]});           // asiento
    const bb=[-.16,SY+.02,0],bt=V.add(bb,V.xy(102,.62));
    E.pad(bb,bt,.4,.08,C.pad,{up:[1,0,0]});                                    // respaldo
    E.beam([.05,0,0],[.05,SY-.08,0],.08,C.frame);E.beam([-.36,.03,0],[-.27,.78,0],.07,C.frame);
    E.beam([-.55,.03,0],[.65,.03,0],.08,C.frameD,{layer:-1});E.beam([-.78,.03,-.42],[PX+.05,.03,-.42],.06,C.frameD,{layer:-1});E.beam([-.75,.03,-.45],[-.75,.03,.27],.06,C.frameD,{layer:-1});
    E.beam([PX,0,-.44],[PX,PY,-.44],.07,C.frame);
    for(const k of[-1,1]){E.beam([-.06,SY-.02,k*.27],[.08,SY-.02,k*.27],.025,C.frameD);E.cyl([-.06,SY+.02,k*.3],[.04,SY+.02,k*.3],.018,C.rubber);}
    // eje alineado con la rodilla + leva (r 11 cm) + brazo de palanca con rodillo sobre la tibia baja
    E.cyl([PX,PY,-.46],[PX,PY,-.27],.025,C.chrome);
    E.disc([PX,PY,CZ],[0,0,1],CR,.03,C.frameD,{hub:.3});
    E.sph(V.madd([PX,PY,CZ+.016],V.xy(-flex+180),CR*.72),.012,C.chrome);
    E.cyl([PX,PY,.16],[PX,PY,.19],.028,C.accent);                                // marca de alineación
    const rc=V.madd(V.madd([PX,PY,0],sh,.33),sa,.085);
    E.beam([PX,PY,-.3],[rc[0],rc[1],-.3],.045,C.frame);
    E.cyl([rc[0],rc[1],-.3],[rc[0],rc[1],-.05],.05,C.pad,{bias:-.05});E.cyl([rc[0],rc[1],-.05],[rc[0],rc[1],.2],.05,C.pad,{bias:-.05});
    // cable: leva → polea suelo → torre → polea alta → pila (lift = ángulo × radio de leva)
    const SX=-.75,SZ=.05,top=E.stack([SX,0,SZ],{h:1.25,lift:(90-flex)*Math.PI/180*CR,n:12,sel:5,yaw:0,w:.26});
    const cx=PX+CR,rp=.035,TX=SX+.13;
    const fd=V.norm([TX-cx,0,SZ-CZ]),fn=V.cross(fd,[0,1,0]),f1=V.madd([cx,.09,CZ],fd,rp),f2=V.madd([TX,.09,SZ],fd,-rp);  // tramo de suelo en diagonal
    E.pulley(f1,fn,rp);E.pulley(f2,fn,rp);E.pulley([SX+.065,1.32,SZ],[0,0,1],.065);
    E.cable([cx,PY,CZ],[cx,.09,CZ]);E.cable(V.add(f1,[0,-rp,0]),V.add(f2,[0,-rp,0]));E.cable([TX,.09,SZ],[TX,1.32,SZ]);E.cable([SX,1.32,SZ],top);
    for(const k of[-1,1])E.beam([SX,0,SZ+k*.17],[SX,1.42,SZ+k*.17],.05,C.frame);E.beam([SX,1.42,SZ-.2],[SX,1.42,SZ+.2],.06,C.frame);
    E.shadow([-.1,0,0],.75,.4,.55);
  }
});

// ═══ JALÓN AL PECHO ═════════════════════════════════════════════════════════
// Agarre prono ancho (~1,5× hombros), muslos bajo los rodillos, tronco ~15° atrás fijo,
// pecho arriba. Barra por delante de la cara hasta la clavícula: codos abajo y atrás,
// escápulas deprimidas y retraídas. Arriba: extensión completa con elevación escapular.
GA.def('lib_lat_pulldown',{
  title:'Jalón al pecho',
  cam:{yaw:-26,pitch:6},
  fitBox:[[-.45,0,-.62],[.85,1.88,.62]],
  muscles:{lats:1,midback:.7,biceps:.45,reardelts:.35},
  labels:['Dorsales','Romboides','Bíceps'],
  timeline:[
    {p:1,dur:1.4,label:'Tira hacia el pecho',act:1},
    {dur:.6,label:'Aprieta · escápulas abajo',act:1},
    {p:0,dur:2.6,label:'Sube controlando',act:.7},
    {dur:.5,label:'Estira arriba',act:.45}
  ],
  build(c,b,E){
    const V=E.V,p=c.p,SY=.47,HY=SY+.09,LN=-11;
    const pose=pp=>{b.pelvis([0,HY,0],{tilt:LN});b.spine(-2-2*pp);b.head(-8+4*pp);b.scap('both',E.mix(.035,-.018,pp),E.mix(.012,-.03,pp));};
    // anclas: barra arriba (brazos casi extendidos) y abajo (clavícula); tronco fijo ~15° atrás
    pose(0);const s0=b.sho('R');const top=[s0[0]+.06,s0[1]+.595,0];
    pose(1);const bot=b.tpt(0,-.09,.16);
    pose(p);
    const bar=V.lerp(top,bot,p);bar[0]+=.025*Math.sin(Math.PI*p);
    const HZ=.37,pl=E.mix(.55,1.3,p);
    b.arm('R',[bar[0],bar[1],HZ],[-.3,-pl,.8],[0,0,1]);b.arm('L',[bar[0],bar[1],-HZ],[-.3,-pl,-.8],[0,0,1]);
    // piernas: muslos horizontales bajo los rodillos, pies apoyados
    for(const s of['R','L']){const k=s==='R'?1:-1;b.footFlat(s,[.43,0,k*.15],k*-6);b.leg(s,null,[1,.3,k*.1]);}
    // ── máquina ──
    E.pad([-.25,SY-.04,0],[.2,SY-.04,0],.38,.08,C.pad);
    E.beam([0,0,0],[0,SY-.08,0],.08,C.frame);
    E.beam([-.35,.03,0],[.95,.03,0],.09,C.frameD,{layer:-1});
    // rodillos sobre los muslos (poste desde la base)
    const ky=HY+.065;E.beam([.62,.03,0],[.62,ky,0],.05,C.frame);
    E.cyl([.36,ky,-.22],[.36,ky,.22],.05,C.pad);E.beam([.36,ky,0],[.62,ky,0],.04,C.frame);
    // torre (dos montantes enmarcan la pila) + viga superior + poleas
    for(const k of[-1,1])E.beam([.8,0,k*.18],[.8,2.38,k*.18],.06,C.frame);
    E.beam([.8,2.38,-.21],[.8,2.38,.21],.07,C.frame);E.beam([-.02,2.38,0],[.88,2.38,0],.08,C.frame);
    const pul=[0,2.3,0],po=[-.05,2.3,0];E.pulley(pul,[0,0,1],.05);E.pulley([.75,2.3,0],[0,0,1],.05);
    const bc=[bar[0],bar[1]+.05,0];
    E.cable(po,bc);E.cable([0,2.35,0],[.75,2.35,0]);
    const lift=V.dist(po,bc)-V.dist(po,[top[0],top[1]+.05,0]);
    const st=E.stack([.8,0,0],{h:1.5,lift,n:14,sel:6,yaw:0,w:.28,bias:.25});
    E.cable([.8,2.3,0],st);
    // barra de jalón con extremos curvados
    const BL=.55;E.bar([bar[0],bar[1],-BL],[bar[0],bar[1],BL],{r:.013});
    for(const k of[-1,1])E.bar([bar[0],bar[1],k*BL],[bar[0]-.04,bar[1]-.07,k*(BL+.06)],{r:.013});
    E.line([bar[0],bar[1],-.12],[bc[0],bc[1],0],.006,C.cable);E.line([bar[0],bar[1],.12],[bc[0],bc[1],0],.006,C.cable);
    E.trace('barra',[bar[0],bar[1],.45]);
    E.shadow([.2,0,0],.75,.45,.55);
  }
});

// ═══ CAMINADORA (calentamiento) ═════════════════════════════════════════════
// 4,5 km/h sin inclinación: talón→planta→punta, pie de apoyo se desplaza con la cinta
// (sin deslizar), talón despega al ~30 % y la punta al 60 %; rodilla ~10° al contactar, ~18° en
// respuesta de carga, ~7° en apoyo medio, ~40° al despegue, ~65° en balanceo; braceo opuesto.
GA.def('lib_cardio_walk',{
  title:'Calentamiento — caminadora',
  cam:{yaw:28,pitch:7},
  cycle:{period:1.14},
  muscles:{quads:.45,hams:.35,calves:.5,glutes:.35},
  labels:['Piernas · cardio suave'],
  note:'4,5 km/h · 0 %',
  timeline:[{dur:1.14,label:'Paso natural · talón → punta',act:.55}],
  build(c,b,E){
    const T=1.14,v=1.25,ph=c.cyc,W2=2*Math.PI*ph,sn=x=>Math.sin(2*Math.PI*x);
    GA._.walkOnTreadmill(c,b,E,{speed:v,incline:0,period:T});   // cinta (la pose se rehace abajo)
    // pelvis: máx. en apoyo medio (~23 % y 73 %), oscilación ±1,6 cm, giro y caída pélvica; braceo contralateral
    b.pelvis([0,.2+.927+.016*Math.cos(2*Math.PI*(2*ph-.46)),.014*sn(ph-.05)],{tilt:3,yaw:4.5*Math.cos(W2),roll:2*sn(ph-.05)});
    b.spine(0,0,-8*Math.cos(W2));b.head(-4,4*Math.cos(W2));
    for(const[s,k]of[['R',1],['L',-1]]){const sw=-k*Math.cos(W2);b.armFK(s,{flex:3+17*sw,abd:8,elbow:28+10*Math.max(0,sw),rot:10});}
    const V=E.V,D=E.DIM,M=E.EASE,DY=.2,sHS=.24,t1=.1*T,t2=.3*T,Ts=.6*T,FL=D.heel+D.toe,PHS=-17,PTO=55,KV=.7;
    // pose del pie: punto de apoyo (talón o punta) en la cinta + inclinación (+ = talón arriba)
    const pose=(x,z,pit,toe)=>{const a=-pit*Math.PI/180,f=[Math.cos(a),Math.sin(a),0],u=[-Math.sin(a),Math.cos(a),0];
      return[V.add([x,DY,z],V.add(V.mul(f,toe?-D.toe:D.heel),V.mul(u,D.ankH))),f,u];};
    const hm=(s,a,b,m,n)=>{const s2=s*s,s3=s2*s;return(2*s3-3*s2+1)*a+(s3-2*s2+s)*m+(3*s2-2*s3)*b+(s3-s2)*n;};  // Hermite cúbico
    const foot=(ph,z)=>{const t=ph*T,sT=sHS+FL,st=t=>pose(sT-v*t,z,PTO*Math.pow((t-t2)/(Ts-t2),2),1);
      if(t<t1)return pose(sHS-v*t,z,PHS*(1-M.sin(t/t1)),0);
      if(t<t2)return pose(sHS-v*t,z,0,0);
      if(t<Ts)return st(t);
      // balanceo: velocidades continuas al despegar (tobillo + giro del pie) y al contactar (talón ya a la velocidad de la cinta)
      const Tw=T-Ts,u=(t-Ts)/Tw,A=st(Ts),B=pose(sHS,z,PHS,0),m0=V.mul(V.sub(A[0],st(Ts-1e-3)[0]),Tw/1e-3);
      const an=[hm(u,A[0][0],B[0][0],m0[0],-KV*v*Tw),hm(u,A[0][1],B[0][1],m0[1],0),z];an[1]+=.075*Math.pow(Math.sin(Math.PI*Math.min(1,u*1.08)),1.3)*(1-.35*u);
      const pit=u<.5?hm(u/.5,PTO,-4,PTO*Tw/(Ts-t2),0):E.mix(-4,PHS,M.mj((u-.5)/.5)),q=pose(0,z,pit,0);return[an,q[1],q[2]];};
    b.ikErr=0;
    for(const[s,k,o]of[['R',1,0],['L',-1,.5]]){const F=foot((ph+o)%1,k*.075);b.foot(s,F[0],F[1],F[2]);b.leg(s,null,[1,.05,k*.06]);}
  }
});

// ═══ ELEVACIÓN LATERAL CON MANCUERNAS ═══════════════════════════════════════
// Ligera inclinación del tronco (~8°), rodillas suaves, codos algo flexionados (~15°)
// y fijos, sube en el plano escapular (~25° por delante) hasta la altura del hombro,
// lidera con el codo, muñeca neutra, sin encoger trapecios. Baja en 2-3 s.
GA.def('lib_lat_raise_db',{
  title:'Elevación lateral con mancuernas',
  cam:{yaw:62,pitch:8},
  muscles:{sidedelts:1,frontdelts:.3},
  labels:['Deltoides lateral'],
  timeline:[
    {p:1,dur:1.4,label:'Sube · lidera con el codo',act:1},
    {dur:.5,label:'Pausa a la altura del hombro',act:1},
    {p:0,dur:2.6,label:'Baja controlando',act:.7},
    {dur:.4,label:'Abajo · sin descansar',act:.5}
  ],
  build(c,b,E){
    const V=E.V,p=c.p;
    for(const s of['R','L']){const k=s==='R'?1:-1;b.footFlat(s,[-.06,0,k*.13],k*-8);}
    b.pelvis([-.02,.94,0],{tilt:8});b.spine(-2);b.head(-6);
    for(const s of['R','L']){b.leg(s,null,[1,0,0]);}
    const abd=E.mix(12,92,p),hz=E.mix(14,26,p);
    for(const s of['R','L']){
      const o={abd,hz,elbow:E.mix(12,16,p),rot:E.mix(-5,8,p)};b.armFK(s,o);
      // mango perpendicular al antebrazo (puño neutro-prono), en el plano escapular
      o.grip=V.norm(V.perp(b.tdir(0,0,1),V.norm(V.sub(b.j(s,'wri'),b.j(s,'elb')))));b.armFK(s,o);
      const g=b.j(s,'grip');E.dumbbell(g,o.grip,{r:.05,hl:.055});
      if(s==='R')E.trace('mancuerna',g);
    }
    E.shadow([0,0,0],.4,.3,.55);
  }
});

})(window.GymAnim);
