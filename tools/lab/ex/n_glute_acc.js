/* Glúteo accesorio: patadas, abducciones y aducciones (máquina, polea, banda, minibanda, suelo) */
(function(GA){
const K=GA._.kit,V=GA._.V,C=GA._.COL,DM=GA._.DIM,SS=K.SS,mix=K.mix,D=Math.PI/180,UP=[0,1,0],Z=[0,0,1];
const TL=(a,h,b,l1,l2,l3,l4)=>[{p:1,dur:a,label:l1,act:1},{dur:h,label:l2,act:1},{p:0,dur:b,label:l3,act:.75},{dur:.5,label:l4,act:.5}];
// minibanda entre las dos piernas a la fracción f de rodilla→cadera (o tobillo→rodilla con lo)
const mband=(E,b,f,lo)=>{const at=s=>lo?V.lerp(b.j(s,'ank'),b.j(s,'kne'),f):V.lerp(b.j(s,'kne'),b.hip(s),f),
  ax=s=>V.norm(lo?V.sub(b.j(s,'kne'),b.j(s,'ank')):V.sub(b.hip(s),b.j(s,'kne')));K.miniband(E,at('R'),at('L'),{axis:V.norm(V.add(ax('R'),ax('L'))),r:lo?.05:.066});};

// ═══ CUADRUPEDIA: patada (donkey kick) y fire hydrant, pierna derecha ═══════
// Rodillas bajo la cadera, manos bajo los hombros, columna neutra. Patada: rodilla a 90° fija,
// el talón sube al techo hasta el muslo horizontal (sin arquear). Hydrant: rodilla a 90°, el muslo
// se abre al lado hasta la altura de la cadera (~75°) con la tibia paralela al suelo y la pelvis quieta.
function quad(c,b,E,hyd){const p=c.p,Y=K.mat(E,[-.18,0,0],[1.5,.62]).top;K.quad(b,E,{x:-.3,y:Y,hd:-12});
  if(hyd){const a=mix(4,76,p)*D;b.legDir('R',[-.03,-Math.cos(a),Math.sin(a)],[-1,0,0]);b.footRelax('R',72);}
  else{const a=mix(253,174,p);b.legDir('R',V.xy(a),V.xy(a-90));b.footRelax('R',-4);}
  E.trace(hyd?'rodilla':'talón',b.j('R',hyd?'kne':'ank'));if(this.mb)mband(E,b,.16);E.shadow([-.05,0,0],.7,.3,.5);}
GA.def('lib_donkey_kick',{
  title:'Patada de glúteo en cuadrupedia',
  cam:{yaw:-28,pitch:14},
  muscles:{glutes_R:1,hams_R:.4},
  labels:['Glúteos','Isquiotibiales'],
  timeline:TL(1.2,1,2,'Talón al techo · rodilla 90°','Aprieta el glúteo','Baja lento · sin arquear','Rodilla cerca del suelo'),
  build(c,b,E){quad.call(this,c,b,E,0);}
});
GA.alias('lib_miniband_kickback','lib_donkey_kick',{title:'Patada de glúteo en cuadrupedia con minibanda',mb:1});
GA.def('lib_fire_hydrant',{
  title:'Fire hydrant (abducción en cuadrupedia)',
  cam:{yaw:-118,pitch:20},
  muscles:{abductors_R:1,glutes_R:.6},
  labels:['Glúteo medio','Glúteos'],
  timeline:TL(1.2,.8,2,'Abre la rodilla al lado','Pausa · tronco quieto','Baja controlando','Abajo'),
  build(c,b,E){quad.call(this,c,b,E,1);}
});
GA.alias('lib_miniband_fire_hydrant','lib_fire_hydrant',{title:'Fire hydrant con minibanda',muscles:{abductors_R:1,glutes_R:.7},mb:1});

// ═══ TUMBADO DE LADO (lado izquierdo abajo, cabeza a +X, pecho a +Z) ════════
// Cabeza sobre el brazo de abajo; mano de arriba apoyada delante del pecho (o en la cadera).
function side(b,E,Y,hand){K.sideLie(b,{down:'L',dir:1,y:Y,x:0,hd:'rest',headY:Y+.085});
  const sl=b.sho('L');b.arm('L',[sl[0]+.58,Y+.045,sl[2]+.08],[0,1,0],Z);
  if(hand)K.palm(b,E,'R',[b.sho('R')[0]-.12,Y,.34],{fd:[1,0,-.3],pole:[-.2,1,.3]});else b.arm('R',V.add(b.hip('R'),[.06,.08,.05]),[-.3,.2,.8],[1,0,0]);}
const mat=E=>K.mat(E,[-.2,0,.05],[1.95,.7]).top;
// Abducción tumbado: pierna de abajo estirada en el suelo; la de arriba recta sube ~38° algo por detrás
// del cuerpo (extensión ~8°) con la punta al frente. Banda en los tobillos en la variante.
GA.def('lib_side_lying_abd',{
  title:'Abducción de cadera tumbado de lado',
  cam:{yaw:12,pitch:24},
  muscles:{abductors_R:1,glutes_R:.5},
  labels:['Glúteo medio','Glúteos'],
  timeline:TL(1.2,1,2.2,'Sube · punta al frente','Arriba 1 s','Baja lento','Sin apoyar del todo'),
  build(c,b,E){const p=c.p,Y=mat(E);side(b,E,Y,1);
    const hL=b.hip('L'),A=[hL[0]-.85,Y+.057,hL[2]-.02];b.leg('L',A,Z);b.footRelax('L',18);
    const hR=b.hip('R'),d=V.norm(V.sub(V.add(A,[0,.1,0]),hR)),r=V.rot(V.rot(d,Z,-mix(0,36,p)*D),UP,-mix(2,9,p)*D);
    b.leg('R',V.madd(hR,r,K.legD(3)),Z);b.footRelax('R',18);E.trace('tobillo',b.j('R','ank'));
    if(this.mb)mband(E,b,.14,1);E.shadow([-.2,0,.05],.95,.3,.5);}
});
GA.alias('lib_miniband_side_abduction','lib_side_lying_abd',{title:'Abducción de cadera tumbado de lado con minibanda',mb:1});
// Almeja: caderas a 45° y rodillas a 90°, pies juntos; la rodilla de arriba se abre sin rodar la pelvis.
GA.def('lib_clamshell',{
  title:'Almeja (clamshell)',
  cam:{yaw:14,pitch:26},
  muscles:{abductors_R:1,glutes_R:.5},
  labels:['Glúteo medio','Glúteos'],
  timeline:TL(1,1,2,'Abre la rodilla · pies juntos','Aprieta 1 s','Cierra lento','Sin rodar la pelvis'),
  build(c,b,E){const p=c.p,Y=mat(E);side(b,E,Y,0);
    const hl=b.hip('L'),kn=[hl[0]-.44*Math.cos(45*D),Y+.06,hl[2]+.44*Math.sin(45*D)];
    b.legDir('L',V.sub(kn,hl),[-Math.cos(50*D),0,-Math.sin(50*D)]);b.footRelax('L',20);
    const la=b.j('L','ank'),kd=V.norm(V.sub(b.j('L','kne'),hl));
    b.leg('R',V.add(la,[0,.1,0]),V.norm(V.lerp(V.perp(kd,UP),UP,mix(-.2,.45,p))));b.footRelax('R',20);
    if(this.mb)mband(E,b,.2);E.shadow([-.1,0,.1],.8,.35,.5);}
});
GA.alias('lib_miniband_clamshell','lib_clamshell',{title:'Almeja con minibanda',mb:1});
// Aducción tumbado: pierna de arriba cruzada con el pie plano delante de la rodilla de abajo; la de
// abajo, estirada y con la punta al frente, sube ~20 cm con el aductor y baja lenta.
GA.def('lib_side_lying_add',{
  title:'Aducción de cadera tumbado de lado',
  cam:{yaw:8,pitch:12},
  muscles:{adductors_L:1,obliques:.25},
  labels:['Aductores','Oblicuos'],
  timeline:TL(1.1,.8,2,'Sube la pierna de abajo','Pausa arriba','Baja lento','Roza el suelo'),
  build(c,b,E){const p=c.p,Y=mat(E);side(b,E,Y,0);
    const hL=b.hip('L'),A=[hL[0]-.85,Y+.057,hL[2]-.02],r=V.rot(V.norm(V.sub(A,hL)),Z,-mix(0,15,p)*D);
    b.leg('L',V.madd(hL,r,K.legD(3)),Z);b.footRelax('L',10);E.trace('tobillo',b.j('L','ank'));
    K.footOn(b,'R',[hL[0]-.3,Y,.3],V.yaw(-60),UP);b.leg('R',null,[.2,1,.4]);
    E.shadow([-.2,0,.1],.95,.35,.5);}
});
// Plancha Copenhague: antebrazo izquierdo bajo el hombro, cara interna del tobillo de arriba sobre el banco
// (con la cadera abajo, la tibia apoya en su borde) y la pierna de abajo libre bajo el banco. Sube la cadera
// hasta alinear hombro-cadera-tobillo y aguanta.
GA.def('lib_copenhagen',{
  title:'Plancha Copenhague',
  cam:{yaw:34,pitch:16},
  muscles:{adductors:1,obliques:.6,abs:.3},
  labels:['Aductores','Oblicuos','Abdomen'],
  timeline:TL(1.4,4,1.6,'Sube la cadera','Aguanta · cuerpo recto','Baja controlando','Abajo · sin soltar'),
  build(c,b,E){const p=c.p,BX=-1.12,BY=.43,Lg=K.legD(4),be=mix(24,5.3,p)*D;
    K.frame(b,[0,1,0],[Math.cos(be),Math.sin(be),0],Z);K.trunk(b,{sc:[0,.02]});K.shift(b,V.sub([0,.34,0],b.sho('L')));
    const H=b.hip('R'),t=Math.max(Math.atan2(BY-H[1],H[0]-BX)+Math.asin(.047/Math.hypot(BX-H[0],BY-H[1])),Math.asin((BY+.037-H[1])/Lg)),
      lg=(s,a)=>{b.leg(s,V.madd(b.hip(s),[-Math.cos(a),Math.sin(a),0],Lg),Z);b.footRelax(s,10);};
    lg('R',t);lg('L',t-7*D);
    b.arm('L',[.02,.04,.33],[0,-1,0],[1,0,0]);b.arm('R',b.ppt(.21,.1,.02),[0,1,-.4],[1,0,0]);
    K.box(E,[BX-.15,0,0],[1,BY,.3],{kind:'bench',yaw:90});E.shadow([-.4,0,0],.9,.3,.5);}
});

// ═══ MINIBANDA DE PIE: paso lateral y caminata de monstruo ══════════════════
// Semisentadilla (rodilla ~50°), tronco algo inclinado, manos en la cadera, rodillas hacia fuera.
// Lateral: p = anchura (pie que sale), s = desplazamiento; ida 2 pasos a la derecha y vuelta.
// Monstruo: p 0→1 = dos pasos en diagonal hacia delante (izq. y der.), y vuelta atrás igual.
function walk(c,b,E,lat){const p=c.p,F={},sn=Math.sin(Math.PI*p);
  if(lat){const w=mix(.24,.52,p),zc=c.s*.28,l=.035*sn;F.R=[-.05,zc+w/2,c.s<.5?l:0];F.L=[-.05,zc-w/2,c.s<.5?0:l];}
  else for(const[s,k,a,o]of[['L',-1,Math.min(p*2,1),-.1],['R',1,Math.max(p*2-1,0),.1]]){const e=Math.sin(Math.PI*a);F[s]=[o+.4*a,k*(.25+.05*e),.04*e];}
  K.stand(b,{feet:F,kf:56,toe:12,tilt:24,sp:[-2],hd:-12,sc:[0,.01],z:lat?c.s*.28:0,balance:true,pole:{out:.15},
    arms:b=>{for(const[s,k]of SS)b.arm(s,b.ppt(k*.205,.13,.01),[-.5,-.2,k],[0,1,0]);}});
  mband(E,b,lat?.16:.12,!lat);E.shadow([lat?0:.2,0,lat?.14:0],.55,.45,.5);}
GA.def('lib_miniband_lateral_walk',{
  title:'Paso lateral con minibanda',
  cam:{yaw:62,pitch:10},
  muscles:{abductors:1,glutes:.6,quads:.3},
  labels:['Glúteo medio','Glúteos','Cuádriceps'],
  init:{p:0,s:0},
  timeline:[{p:1,s:.5,dur:.8,label:'Paso a la derecha',act:1},{p:0,s:1,dur:.8,label:'Acerca · sin juntar los pies',act:.8},
    {p:1,s:.5,dur:.8,label:'Paso a la izquierda',act:1},{p:0,s:0,dur:.8,label:'Acerca · mantén la tensión',act:.8}],
  build(c,b,E){walk(c,b,E,1);}
});
GA.def('lib_miniband_monster_walk',{
  title:'Caminata de monstruo con minibanda',
  cam:{yaw:38,pitch:10},
  muscles:{abductors:1,glutes:.8,quads:.3},
  labels:['Glúteo medio','Glúteos','Cuádriceps'],
  timeline:[{p:.5,dur:.9,label:'Paso en diagonal · rodilla fuera',act:1},{p:1,dur:.9,label:'Otro paso · sin juntar pies',act:1},
    {p:.5,dur:.9,label:'Vuelve atrás igual',act:.85},{p:0,dur:.9,label:'Pies anchos · tensión',act:.85}],
  build(c,b,E){walk(c,b,E,0);}
});
// Sentado al borde del banco, minibanda sobre las rodillas, tronco algo inclinado, manos en el banco:
// las rodillas se abren hacia fuera (pies quietos), aguanta 1 s y cierran lento sin perder tensión.
GA.def('lib_miniband_seated_abd',{
  title:'Abducción de cadera sentado con minibanda',
  cam:{yaw:58,pitch:16},
  muscles:{abductors:1,glutes:.6},
  labels:['Glúteo medio','Glúteos'],
  timeline:TL(1,1,2,'Abre las rodillas','Aguanta 1 s','Cierra lento','Sin perder tensión'),
  build(c,b,E){const p=c.p,bx=K.box(E,[-.14,0,0],[1.1,.45,.32],{kind:'bench',yaw:90});
    K.seat(b,[-.05,bx.y,0],{tilt:14,sp:[2],hd:-6,feet:{x:.4,z:.15,toe:8}});
    for(const[s,k]of SS){b.leg(s,null,V.norm([1,.5,k*mix(.18,.85,p)]));K.palm(b,E,s,[-.13,bx.y,k*.25],{pole:[-1,.2,k*.6]});}
    mband(E,b,.2);E.shadow([.1,0,0],.6,.45,.5);}
});

// ═══ POLEA BAJA CON TOBILLERA y BANDA ═══════════════════════════════════════
// tobillera en el tobillo s; anilla del lado de 'to' → punto de enganche
const cax=(b,s)=>{const a=b.j(s,'ank'),ax=V.norm(V.sub(b.j(s,'kne'),a));return[V.madd(a,ax,.035),ax];},
  ring=(b,s,to)=>{const[c,ax]=cax(b,s);return V.madd(c,V.norm(V.perp(V.sub(to,c),ax)),.055);},
  cuff=(E,b,s,to)=>{const[c,ax]=cax(b,s);E.cyl(V.madd(c,ax,-.028),V.madd(c,ax,.028),.047,K.COL.strap);const r=ring(b,s,to);E.sph(r,.011,C.chrome);return r;};
// torre de polea: base en Q, u = hacia el usuario; la carga sube lo que se alarga el cable
function tower(E,Q,u,ring,lift){const s=V.cross(u,UP),P=V.add(V.madd(Q,u,.1),[0,.13,0]),y=Math.atan2(-u[2],u[0])/D,T=2.1,at=(a,h,c)=>V.add(V.madd(V.madd(Q,s,a),u,c||0),[0,h,0]);
  for(const k of[-1,1])E.beam(at(k*.22,0),at(k*.22,T),.07,C.frame);E.beam(at(-.26,T),at(.26,T),.07,C.frame);
  E.boxA([Q[0],.02,Q[2]],[.62,.04,.62],C.frameD,{layer:-1,yaw:y});
  const top=E.stack(V.madd(Q,u,-.06),{h:1.75,lift,n:14,sel:5,yaw:y,w:.3,bias:.1});
  E.cable(top,at(0,T-.1,-.06));E.cable(at(0,T-.06,-.06),at(0,T-.06,.1));E.cable(at(0,T-.1,.1),P);
  E.pulley(at(0,T-.1,.02),s,.05);E.pulley(P,s,.04);E.cable(P,ring);return P;}
// Patada de pie: inclinado ~30° agarrado a la torre/poste, rodilla de apoyo suave; la pierna derecha
// pasa de algo por delante (cadera ~40°) a ~15° de extensión con la rodilla casi recta, sin arquear.
function kick(c,b,E,band){const PX=.6,pose=q=>{K.stand(b,{feet:{R:[-.06,.1],L:[-.06,-.1]},kf:14,tilt:30,x:-.1,sp:[-2],hd:-10,sc:[0,.02]});
    b.legFK('R',{flex:mix(48,-14,q),knee:mix(36,8,q)+14*Math.sin(Math.PI*q),abd:2});b.footRelax('R',-18);return b.j('R','ank');};
  const P=[PX-.1,.13,.1];pose(0);const L0=V.dist(P,ring(b,'R',P));E.trace('tobillo',pose(c.p));
  for(const[s,k]of SS)b.arm(s,[PX-(band?.05:.035),1.08-(band&&k<0?.12:0),band?k*.03:k*.22+.1],[-.3,-.5,k],UP);
  if(band){const r=cuff(E,b,'R',[PX,.15,0]);E.cyl([PX,0,0],[PX,1.9,0],.04,C.frame);E.boxA([PX,.02,0],[.4,.04,.4],C.frameD,{layer:-1});
    K.band(E,[PX-.04,.15,0],r,{col:K.BAND.green,L0:.55});}
  else{const r=cuff(E,b,'R',P);tower(E,[PX,0,.1],[-1,0,0],r,.03+V.dist(P,r)-L0);}
  E.shadow([0,0,0],.5,.35,.55);}
GA.def('lib_glute_kickback_cable',{
  title:'Patada de glúteo en cable',
  cam:{yaw:-30,pitch:8},
  fitBox:[[-.95,0,-.35],[.9,1.6,.4]],
  muscles:{glutes_R:1,hams_R:.4},
  labels:['Glúteos','Isquiotibiales'],
  timeline:TL(1.2,1,2.2,'Pierna atrás · aprieta','Aprieta 1 s','Vuelve controlando','Sin soltar la carga'),
  build(c,b,E){kick(c,b,E,0);}
});
GA.def('lib_band_glute_kickback',{
  title:'Patada de glúteo con banda elástica',
  cam:{yaw:-30,pitch:8},
  fitBox:[[-.95,0,-.35],[.85,1.6,.4]],
  muscles:{glutes_R:1,hams_R:.4},
  labels:['Glúteos','Isquiotibiales'],
  timeline:TL(1.2,1,2.2,'Pierna atrás · sin arquear','Aprieta 1 s','Vuelve lento','Banda en tensión'),
  build(c,b,E){kick(c,b,E,1);}
});
// Abducción / aducción en polea: de lado a la torre (a la izquierda), tronco erguido, mano cercana en la
// torre y la otra en la cadera. Abd: tobillera en la pierna lejana, abre ~35°. Add: en la cercana,
// cruza por delante de la de apoyo.
function sideCable(c,b,E,add){const w=add?'L':'R',Z0=add?-.65:-.7,Q=[-.1,0,Z0],P=[-.1,.13,Z0+.1],
  pose=q=>{K.stand(b,{feet:{R:[-.06,.1],L:[-.06,-.1]},kf:6,tilt:2,x:-.03,z:add?.05:-.05,sp:[0,add?2:-2],hd:-4});
    b.legFK(w,add?{abd:mix(26,-13,q),flex:mix(4,30,q),knee:22+12*Math.sin(Math.PI*q)}:{abd:mix(0,36,q),flex:6,knee:22});b.footRelax(w,-20);return b.j(w,'ank');};
  pose(0);const L0=V.dist(P,ring(b,w,P));E.trace('tobillo',pose(c.p));
  b.arm('L',[.12,1.2,Z0],[-.3,-.6,-1],UP);b.arm('R',b.ppt(.2,.13,.01),[-.5,-.2,1],UP);
  const r=cuff(E,b,w,P);tower(E,Q,Z,r,.03+V.dist(P,r)-L0);E.shadow([0,0,0],.45,.4,.55);}
GA.def('lib_hip_abd_cable',{
  title:'Abducción de cadera en cable',
  cam:{yaw:70,pitch:10},
  fitBox:[[-.3,0,-.75],[.4,1.75,.7]],
  muscles:{abductors_R:1,glutes_R:.5},
  labels:['Glúteo medio','Glúteos'],
  timeline:TL(1.2,.8,2.2,'Abre la pierna · tronco recto','Pausa','Vuelve lento','Sin tocar la pila'),
  build(c,b,E){sideCable(c,b,E,0);}
});
GA.def('lib_hip_add_cable',{
  title:'Aducción de cadera en cable',
  cam:{yaw:72,pitch:9},
  fitBox:[[-.3,0,-.75],[.4,1.75,.5]],
  muscles:{adductors_L:1,abs:.25},
  labels:['Aductores','Abdomen'],
  timeline:TL(1.2,.8,2.2,'Cruza por delante','Aprieta','Controla la vuelta','Abierta · sin soltar'),
  build(c,b,E){sideCable(c,b,E,1);}
});

// ═══ MÁQUINA DE PATADA DE GLÚTEO ════════════════════════════════════════════
// De pie sobre la plataforma, pecho en el cojín inclinado y manos en los agarres. El eje de la
// palanca coincide con la cadera: el cojín de la palanca va tras el muslo (sobre la rodilla) y la
// pierna, con la rodilla a ~90°, empuja atrás y arriba hasta ~12° de extensión. Carga en disco.
GA.def('lib_glute_kickback_machine',{
  title:'Patada de glúteo en máquina',
  cam:{yaw:-145,pitch:12},
  muscles:{glutes_R:1,hams_R:.4},
  labels:['Glúteos','Isquiotibiales'],
  timeline:TL(1.2,1,2.4,'Empuja atrás · glúteo','Aprieta arriba','Vuelve en 2 s','Abajo · sin soltar'),
  build(c,b,E){const p=c.p,PY=.06;
    K.stand(b,{feet:{R:[-.1,.1,PY],L:[-.1,-.1,PY]},kf:12,tilt:48,x:-.12,sp:[-2],hd:-18,sc:[0,.025]});
    const f=mix(74,-12,p);b.legFK('R',{flex:f,knee:mix(92,84,p),abd:1});b.footRelax('R',-6);
    const H=b.hip('R'),t=V.norm(V.sub(b.j('R','kne'),H)),bk=V.rot(t,Z,-Math.PI/2),hb=[H[0],H[1],.27];
    const rc=V.madd(V.madd(H,t,.36),bk,.105),rz=[rc[0],rc[1],.27];
    E.cyl([rc[0],rc[1],.02],rz,.045,C.pad);E.beam(hb,V.madd(hb,t,.62),.05,C.frame);E.beam(rz,V.madd(rz,bk,-.06),.035,C.frameD);
    const he=V.madd(hb,t,.56);E.cyl(he,V.add(he,[0,0,.2]),.024,C.chrome);E.plate(V.add(he,[0,0,.08]),Z,.17,{th:.04});
    E.disc(hb,Z,.06,.06,C.frameD,{hub:.4});E.trace('rodilla',b.j('R','kne'));E.beam([H[0],0,.33],[H[0],H[1],.33],.07,C.frame,{layer:-1});E.beam([H[0],H[1],.33],hb,.04,C.frameD);
    const T=(r,u,f)=>b.tpt(r,u,f),n=b.tdir(0,0,-1);
    E.pad(T(0,-.44,.165),T(0,-.06,.165),.36,.08,C.pad,{up:n,layer:-1});
    const pb=T(0,-.26,.26);E.beam([pb[0],0,0],pb,.08,C.frame,{layer:-1});
    for(const[s,k]of SS){const g=T(k*.2,.02,.38);b.arm(s,g,b.tdir(k,-.3,-.4),b.tdir(0,1,0));E.handle(g,b.tdir(0,1,0));E.beam(V.madd(g,b.tdir(0,1,0),-.06),T(k*.12,-.1,.25),.03,C.frameD);}
    E.boxA([-.05,PY/2,-.05],[.55,PY,.5],C.frameD,{layer:-1});E.beam([-.3,.03,.33],[pb[0],.03,.33],.07,C.frameD,{layer:-1});E.beam([pb[0],.03,-.3],[pb[0],.03,.33],.07,C.frameD,{layer:-1});
    E.shadow([0,0,0],.6,.4,.55);}
});

})(window.GymAnim);
