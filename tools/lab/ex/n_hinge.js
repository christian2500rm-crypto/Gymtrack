/* Bisagra de cadera: pesos muertos, rumanos, buenos días, a una pierna, con banda y pull-through en polea */
(function(GA){
const K=GA._.kit,V=GA._.V,C=GA._.COL,SS=K.SS,mix=K.mix,sst=K.sst,D=K.D;
// x del borde delantero de las piernas a la altura y (muslo con pantalón / tibia) que se solapan en z con [z0-zr, z0+zr]
const front=(b,y,z0,zr)=>{let x=-9;for(const[s]of SS){const S=b.S[s];for(const[a,z,r0,r1]of[[S.hip,S.kne,.09,.06],[S.kne,S.ank,.058,.04]])
  if(y<=a[1]&&y>=z[1]){const t=(a[1]-y)/(a[1]-z[1]),d=V.norm(V.sub(z,a)),r=mix(r0,r1,t);
    if(zr==null||Math.abs(mix(a[2],z[2],t)-z0)<zr+r)x=Math.max(x,mix(a[0],z[0],t)+r*Math.sqrt(1+(d[0]/Math.min(-.3,d[1]))**2));}
  else if(r0>.08&&y>a[1]&&y<a[1]+r0&&(zr==null||Math.abs(a[2]-z0)<zr+r0))x=Math.max(x,a[0]+Math.sqrt(r0*r0-(y-a[1])**2));}return x;};
// puño con el brazo estirado colgando del hombro s hasta z=w; con o.cl la carga roza las piernas (cl holgura, yo desfase en y, zr semiancho);
// o.v: nunca por detrás de la vertical del hombro (cuelga libre) · o.fa: el antebrazo también pasa por delante del muslo
const hang=(b,w,o,s)=>{const S=b.sho(s||'R'),R=K.armD(3),dz=w-S[2];let x=S[0],y=S[1]-R;o=o||{};
  for(let i=0;i<4;i++){if(o.cl!=null){const f=front(b,y+(o.yo||0),o.z0==null?w:o.z0,o.zr);x=f>-5?f+o.cl:S[0];if(o.v)x=Math.max(x,S[0]);
    if(o.fa)for(const u of[.08,.16,.24]){const fz=front(b,y+u,mix(w,S[2],u/(S[1]-y)),.04);if(fz>-5)x=Math.max(x,S[0]+(fz+.045-S[0])*(S[1]-y)/(S[1]-y-u));}}
    y=S[1]-Math.sqrt(Math.max(.01,R*R-dz*dz-(x-S[0])**2));}return[x,y,w];};
// agarre simétrico colgando (barra, mancuernas, asas): devuelve el centro de la carga
const both=o=>b=>{const g=hang(b,o.w,o);for(const[s,k]of SS)b.arm(s,[g[0],g[1],k*o.w],[-.3,0,k],o.ax||[0,0,1]);return[g[0],g[1],0];};
// bisagra bilateral equilibrada (K.stand + CdM con la carga). o: opciones de K.stand + hold(b) | w,cl,yo,ax ; M = kg/75
const hinge=(b,o)=>{let g=[0,.5,0];const f=o.hold||both(o);K.stand(b,Object.assign({balance:true,arms:b=>{g=f(b);},xm:()=>g?[[g,o.M||0]]:null},o));return g;};
// flexión de rodilla del fondo para que la carga llegue a y0 (una vez por definición)
const bottom=(ctx,b,o,y0)=>{const k=K.memo(ctx,'kB',()=>K.root(kf=>hinge(b,Object.assign({},o,{kf}))[1]-y0,5,112));b.ikErr=0;return k;};
// a una pierna: apoyo R, pierna L atrás en línea con el tronco; equilibrio del CdM sobre el medio pie. o:{tilt,kf,fk,sp,hd,sc,hold,M}
const one=(b,o)=>{b.footFlat('R',[-.05,0,.06],-4);const A=b.j('R','ank').slice(),d=K.legD(o.kf);let g=null;
  const pose=hx=>{b.pelvis([hx,A[1]+Math.sqrt(Math.max(.01,d*d-(hx-A[0])**2-(A[2]-.068)**2)),-.02],{tilt:o.tilt});K.trunk(b,o);b.leg('R',A,[1,.1,.15]);
    const a=(6+o.tilt)*D,k=a+o.fk*D;b.legDir('L',[-Math.sin(a),-Math.cos(a),-.03],[-Math.sin(k),-Math.cos(k),-.03]);b.footRelax('L',-15);
    g=o.hold(b);return K.com(b,g?[[g,o.M]]:null)[0]-A[0]-.05;};
  const e=b.ikErr,x=K.root(pose,-.6,.3);b.ikErr=e;pose(x);return g;};
// brazo libre colgando
const free=(b,s)=>{b.arm(s,hang(b,K.sd(s)*.235,0,s),[-.3,0,K.sd(s)]);return null;};
const TL=(a,la,b2,lb,c2,lc,d,ld)=>[{p:1,dur:a,label:la,act:.8},{dur:b2,label:lb,act:.9},{p:0,dur:c2,label:lc,act:1},{dur:d,label:ld,act:.6}];
const sh=(E,x)=>E.shadow([x||.05,0,0],.55,.38,.55);
const BB=(E,g,pl)=>{K.barbell(E,g,[0,0,1],{plates:pl});E.trace('barra',V.add(g,[0,0,.3]));};
const tilt=a=>({tilt:a,sp:[-2],hd:-a*.3,sc:[-.008,-.006]});
// cámara 3/4 trasera: se ve la bisagra (cadera atrás, espalda neutra)
const CB={yaw:-40,pitch:8};
const H='Isquiotibiales',G='Glúteos',L='Lumbares';

// ═══ PESO MUERTO CONVENCIONAL ═══ pies a la anchura de cadera, agarre por fuera de las piernas, barra sobre el medio pie rozando
// tibias y muslos; al subir las rodillas se extienden primero (la barra pasa las rodillas) y la cadera termina el bloqueo.
GA.def('lib_deadlift',{title:'Peso muerto con barra',cam:CB,
  muscles:{glutes:1,hams:.8,lowback:.8,quads:.5,traps:.4,forearms:.35},labels:[G,H,L],
  timeline:TL(2,'Baja rozando las piernas',.5,'Apoya · espalda neutra',1.4,'Empuja el suelo',.6,'Bloquea · aprieta glúteos'),
  build(c,b,E){const p=c.p,o=q=>Object.assign(tilt(mix(1,70,sst(0,.6,q))),{fz:.12,toe:8,w:.26,cl:.018,M:1.33});
    const kB=bottom(this,b,o(1),.225),g=hinge(b,Object.assign(o(p),{kf:mix(4,kB,sst(.35,1,p))}));BB(E,g,[.225,.225]);sh(E);}
});

// ═══ PESO MUERTO SUMO ═══ pies muy abiertos (puntas ~40° fuera), manos por dentro de las rodillas, tronco más erguido;
// las rodillas siguen la punta del pie (se abren) y la barra sube pegada a las tibias.
GA.def('lib_sumo_deadlift',{title:'Peso muerto sumo con barra',cam:CB,
  muscles:{glutes:1,quads:.7,adductors:.7,hams:.6,lowback:.5,forearms:.3},labels:[G,'Aductores','Cuádriceps'],
  timeline:TL(2,'Baja · rodillas afuera',.5,'Pecho arriba',1.4,'Empuja el suelo abriendo',.6,'Bloquea · aprieta glúteos'),
  build(c,b,E){const p=c.p,o=q=>Object.assign(tilt(mix(1,52,sst(0,.7,q))),{fx:-.1,fz:.3,toe:40,pole:{up:.1,out:.1},w:.19,cl:.018,M:1.33});
    const kB=bottom(this,b,o(1),.225),g=hinge(b,Object.assign(o(p),{kf:mix(4,kB,sst(.2,1,p))}));BB(E,g,[.225,.225]);sh(E);}
});

// ═══ PESO MUERTO CON BARRA HEXAGONAL ═══ dentro del hexágono, asas altas a los lados (agarre neutro), brazos verticales,
// cadera a media altura y tronco ~40°: sube empujando el suelo hasta quedar erguido.
GA.def('lib_trap_bar_deadlift',{title:'Peso muerto con barra hexagonal',cam:{yaw:40,pitch:16},
  muscles:{glutes:1,quads:.9,hams:.6,lowback:.5,traps:.4,forearms:.3},labels:[G,'Cuádriceps',H],
  timeline:TL(1.8,'Baja · cadera atrás y abajo',.4,'Espalda neutra',1.3,'Empuja el suelo',.6,'Arriba · erguido'),
  build(c,b,E){const p=c.p,o=q=>Object.assign(tilt(mix(1,47,sst(0,.8,q))),{fz:.13,toe:8,w:.31,ax:[1,0,0],M:1.33});
    const kB=bottom(this,b,o(1),.325),g=hinge(b,Object.assign(o(p),{kf:mix(4,kB,sst(.1,1,p))}));K.trapbar(E,g,{hi:.1,plates:[.225,.225]});sh(E,g[0]);}
});

// ═══ PESO MUERTO RUMANO CON BARRA ═══ rodillas suaves casi fijas, cadera atrás, barra pegada a los muslos hasta bajo la rodilla
GA.def('lib_rdl_bb',{title:'Peso muerto rumano con barra',cam:CB,
  muscles:{hams:1,glutes:.9,lowback:.55,forearms:.3},labels:[H,G,L],
  timeline:TL(3,'Baja · cadera atrás',.3,'Estira isquios',1.5,'Sube · empuja la cadera',.6,'Arriba · aprieta glúteos'),
  build(c,b,E){const p=c.p,g=hinge(b,Object.assign(tilt(mix(2,80,p)),{fz:.12,toe:6,kf:mix(10,20,sst(0,.45,p)),w:.24,cl:.018,M:.8}));BB(E,g,[.225]);sh(E);}
});

// ═══ PESO MUERTO PIERNAS RÍGIDAS ═══ rodillas casi extendidas (~5°), columna neutra, la barra baja más (hasta media tibia)
GA.def('lib_stiff_leg_deadlift',{title:'Peso muerto de piernas rígidas con barra',cam:CB,
  muscles:{hams:1,glutes:.7,lowback:.6,forearms:.3},labels:[H,G,L],
  timeline:TL(3,'Baja · piernas casi rectas',.4,'Estira el femoral',1.5,'Sube · cadera adelante',.6,'Arriba · aprieta glúteos'),
  build(c,b,E){const p=c.p,g=hinge(b,Object.assign(tilt(mix(2,95,p)),{fz:.11,toe:5,kf:mix(4,7,p),w:.24,cl:.018,M:.8}));BB(E,g,[.225]);sh(E);}
});

// ═══ BUENOS DÍAS CON BARRA ═══ barra sobre los trapecios, agarre ancho, codos abajo; rodillas suaves, cadera atrás hasta ~75°
GA.def('lib_good_morning',{title:'Buenos días con barra',cam:CB,
  muscles:{hams:1,lowback:.8,glutes:.6},labels:[H,L,G],
  timeline:TL(2.5,'Inclina · cadera atrás',.3,'Espalda neutra',1.5,'Sube sin redondear',.6,'Arriba · rodillas suaves'),
  build(c,b,E){const p=c.p,g=hinge(b,Object.assign(tilt(mix(2,75,p)),{hd:-p*12,sc:[.01,-.03],fz:.14,toe:10,kf:mix(8,18,p),M:.53,
      hold:b=>{const g=b.tpt(0,-.03,-.064);for(const[s,k]of SS)b.arm(s,V.add(g,[0,0,k*.42]),b.tdir(k*.3,-1,-.5),[0,0,1]);return g;}}));
    K.barbell(E,g,[0,0,1],{plates:[.225]});sh(E);}
});

// ═══ PESO MUERTO RUMANO EN SMITH ═══ la barra va guiada en vertical: la cadera se coloca para que roce los muslos
const smith=(E,X,y)=>{for(const k of[-1,1]){E.beam([X,0,k*.62],[X,2.15,k*.62],.055,C.frame);E.beam([X-.55,.035,k*.62],[X+.55,.035,k*.62],.07,C.frameD,{layer:-1});
    E.boxA([X,y,k*.62],[.1,.13,.1],C.frameD);E.cyl([X,y,k*.67],[X,y,k*.7],.04,C.chrome);E.plate([X,y,k*.735],[0,0,1],.225);}
  E.beam([X,2.15,-.65],[X,2.15,.65],.07,C.frame);E.bar([X,y,-1.02],[X,y,1.02],{r:.0145});E.trace('barra',[X,y,1.02]);};
GA.def('lib_rdl_smith',{title:'Peso muerto rumano en Smith',cam:CB,fitBox:[[-.6,0,-.8],[.5,1.8,.8]],
  muscles:{hams:1,glutes:.9,lowback:.5},labels:[H,G,L],
  timeline:TL(3,'Baja · cadera atrás',.3,'Estira isquios',1.5,'Sube · aprieta glúteos',.6,'Arriba · rodillas suaves'),
  build(c,b,E){const p=c.p,X=.08,R=K.armD(3);let y;
    const pose=hx=>{K.stand(b,Object.assign(tilt(mix(2,78,p)),{x:hx,fz:.12,toe:6,kf:mix(10,20,sst(0,.45,p)),arms:b=>{const S=b.sho('R');
      y=S[1]-Math.sqrt(R*R-(X-S[0])**2-(.24-S[2])**2);for(const[s,k]of SS)b.arm(s,[X,y,k*.24],[-.3,0,k],[0,0,1]);}}));return front(b,y)+.018-X;};
    const e=b.ikErr,hx=K.root(pose,-.5,.2);b.ikErr=e;pose(hx);smith(E,X,y);sh(E);}
});

// ═══ RACK PULL ═══ barra en los soportes de seguridad a la altura de la rodilla; extiende la cadera hasta quedar erguido
// con los hombros atrás; baja controlando hasta apoyar (sin rebote).
GA.def('lib_rack_pull',{title:'Rack pull (peso muerto parcial)',cam:CB,fitBox:[[-.55,0,-.8],[.55,1.8,.8]],
  muscles:{lowback:1,glutes:.8,traps:.8,hams:.5,forearms:.4},labels:[L,G,'Trapecio'],
  timeline:TL(1.8,'Baja a los soportes',.4,'Apoya · sin rebote',1.2,'Extiende la cadera',.6,'Hombros atrás · bloquea'),
  build(c,b,E){const p=c.p,Y=.5,o=q=>Object.assign(tilt(mix(1,60,q)),{sc:[-.006*q,mix(-.025,0,q)],fz:.12,toe:8,w:.25,cl:.018,M:1.87});
    const kB=bottom(this,b,o(1),Y),g=hinge(b,Object.assign(o(p),{kf:mix(4,kB,p)}));
    K.rack(E,{x:.5,hook:1.3,safety:Y-.04,pull:false});BB(E,g,[.225,.225,.225]);sh(E);}
});

// ═══ PESO MUERTO A UNA PIERNA CON MANCUERNA ═══ apoyo derecho con la rodilla suave, mancuerna en la mano contraria (izq.)
// bajando delante de la pierna de apoyo; la pierna libre sube atrás en línea con el tronco, cadera nivelada.
const SL=(a,la)=>TL(2.5,a||'Baja · pierna atrás',.4,'Cadera nivelada',1.5,'Sube · aprieta glúteo',.6,la||'Arriba · equilibrio');
const SLM={hams_R:1,hams_L:.5,glutes_R:1,glutes_L:.5,lowback:.4,abductors_R:.4};
const CF={yaw:150,pitch:10};
const slo=p=>Object.assign(tilt(mix(2,80,p)),{kf:mix(12,22,p),fk:mix(14,5,p)});
GA.def('lib_single_leg_rdl_db',{title:'Peso muerto a una pierna con mancuerna',cam:CF,
  muscles:SLM,labels:[H,G,'Glúteo medio'],timeline:SL(),
  build(c,b,E){const p=c.p,g=one(b,Object.assign(slo(p),{M:.2,hold:b=>{const g=hang(b,-.1,{cl:.062,zr:.11,v:1,fa:1},'L');b.arm('L',g,[-.3,0,-1],[0,0,1]);free(b,'R');return g;}}));
    E.dumbbell(g,[0,0,1],{r:.055});E.trace('mancuerna',g);sh(E);}
});

// ═══ PESO MUERTO CON MANCUERNAS ═══ mancuernas a los lados (agarre neutro), cadera atrás, pecho alto, cabezas al suelo junto a los pies
GA.def('lib_deadlift_db',{title:'Peso muerto con mancuernas',cam:CB,
  muscles:{glutes:1,hams:.8,quads:.6,lowback:.6,traps:.4,forearms:.3},labels:[G,H,'Cuádriceps'],
  timeline:TL(2,'Baja · cadera atrás',.4,'Pecho alto',1.3,'Empuja el suelo',.6,'Arriba · aprieta glúteos'),
  build(c,b,E){const p=c.p,o=q=>Object.assign(tilt(mix(1,80,sst(0,.8,q))),{fz:.1,toe:6,w:.3,ax:[1,0,0],M:.8});
    const kB=bottom(this,b,o(1),.102);hinge(b,Object.assign(o(p),{kf:mix(4,kB,sst(.15,1,p))}));
    for(const s of['R','L'])E.dumbbell(b.j(s,'grip'),[1,0,0],{r:.1,hl:.075,len:.13,hex:1});sh(E);}
});

// ═══ PESO MUERTO CON KETTLEBELL ═══ pies algo más anchos, kettlebell entre los pies con las dos manos, espalda recta
GA.def('lib_kb_deadlift',{title:'Peso muerto con kettlebell',cam:{yaw:35,pitch:14},
  muscles:{glutes:1,hams:.8,lowback:.6,quads:.4,forearms:.3},labels:[G,H,L],
  timeline:TL(2,'Baja · cadera atrás',.4,'Espalda recta',1.3,'Sube · aprieta glúteos',.6,'Arriba · erguido'),
  build(c,b,E){const p=c.p,r=K.kbR(24),o=q=>Object.assign(tilt(mix(2,60,sst(0,.8,q))),{fz:.2,toe:16,w:.05,z0:0,cl:r+.006,yo:-.068-r,zr:r,M:.32});
    const kB=bottom(this,b,o(1),K.kbFloorH(24)),g=hinge(b,Object.assign(o(p),{kf:mix(5,kB,sst(.15,1,p))}));K.kettlebell(E,g,{kg:24});sh(E);}
});

// ═══ PESO MUERTO A UNA PIERNA CON KETTLEBELL ═══ igual que con mancuerna: pesa en la mano contraria a la pierna de apoyo
GA.def('lib_kb_sl_rdl',{title:'Peso muerto a una pierna con kettlebell',cam:CF,
  muscles:SLM,labels:[H,G,'Glúteo medio'],timeline:SL('Baja · cadera atrás','Arriba · sin girar'),
  build(c,b,E){const p=c.p,r=K.kbR(16),g=one(b,Object.assign(slo(p),{M:.21,hold:b=>{const g=hang(b,-.1,{cl:r+.006,yo:-.068-r,zr:r,v:1,fa:1},'L');b.arm('L',g,[-.3,0,-1],[0,0,1]);free(b,'R');return g;}}));
    K.kettlebell(E,g,{kg:16});E.trace('kb',g);sh(E);}
});

// ═══ BUENOS DÍAS CON PESO CORPORAL ═══ manos en la nuca con los codos abiertos, rodillas suaves, cadera atrás con la espalda recta
GA.def('lib_good_morning_bw',{title:'Buenos días con peso corporal',cam:CB,
  muscles:{hams:1,glutes:.6,lowback:.6},labels:[H,G,L],
  timeline:TL(2,'Cadera atrás · espalda recta',.3,'Estira isquios',1.3,'Sube · aprieta glúteos',.5,'Arriba · rodillas suaves'),
  build(c,b,E){const p=c.p;hinge(b,Object.assign(tilt(mix(2,72,p)),{hd:-p*10,sc:[.005,-.03],fz:.13,toe:8,kf:mix(8,16,p),
    hold:b=>{for(const[s,k]of SS)b.arm(s,b.hpt(k*.05,-.03,-.135),b.tdir(k,.25,-.1),b.tdir(0,1,0));return null;}}));sh(E);}
});

// ═══ PESO MUERTO A UNA PIERNA SIN PESO ═══ brazos colgando hacia el suelo, pierna libre atrás en línea, cadera nivelada
GA.def('lib_sl_rdl_bw',{title:'Peso muerto a una pierna con peso corporal',cam:CF,
  muscles:{hams_R:1,hams_L:.4,glutes_R:.8,glutes_L:.4,lowback:.3,abductors_R:.3},labels:[H,G,'Glúteo medio'],
  timeline:SL('Inclina · pierna atrás','Arriba · equilibrio'),
  build(c,b,E){const p=c.p;one(b,Object.assign(slo(p),{hold:b=>{free(b,'R');free(b,'L');return null;}}));sh(E);}
});

// ═══ PESO MUERTO CON BANDA ═══ de pie sobre los tubos (medio pie), asas en las manos con los brazos estirados por fuera de las piernas
GA.def('lib_band_deadlift',{title:'Peso muerto con banda elástica',cam:CB,
  muscles:{glutes:1,hams:.8,lowback:.5,quads:.3},labels:[G,H,L],
  timeline:TL(2,'Baja · cadera atrás',.3,'Espalda neutra',1.3,'Sube · aprieta glúteos',.6,'Arriba · máxima tensión'),
  build(c,b,E){const p=c.p;hinge(b,Object.assign(tilt(mix(2,74,p)),{fz:.12,toe:6,kf:mix(5,45,sst(.2,1,p)),w:.21,cl:.03}));
    for(const[s,k]of SS){const a=b.j(s,'ank');K.band(E,[a[0]+.07,.01,k*.2],b.j(s,'grip'),{handle:[0,0,1],col:K.BAND.green,w:.011,L0:.38});}
    E.boxA([.07,.003,0],[.05,.006,.42],K.BAND.green,{layer:-1,outline:false});sh(E);}
});

// ═══ BUENOS DÍAS CON BANDA ═══ banda bajo el medio pie y sobre los trapecios (no el cuello), manos sujetándola en los hombros
GA.def('lib_band_good_morning',{title:'Buenos días con banda elástica',cam:CB,
  muscles:{hams:1,glutes:.7,lowback:.6},labels:[H,G,L],
  timeline:TL(2.2,'Cadera atrás · rodillas suaves',.3,'Espalda recta',1.3,'Sube contra la banda',.6,'Arriba · aprieta glúteos'),
  build(c,b,E){const p=c.p,P={};hinge(b,Object.assign(tilt(mix(2,72,p)),{hd:-p*10,sc:[.012,0],fz:.12,toe:6,kf:mix(6,16,p),
      hold:b=>{for(const[s,k]of SS){P[s]=b.tpt(k*.15,.0,.1);b.arm(s,P[s],b.tdir(k*.4,-1,-.1),b.tdir(k*.2,0,1));}return null;}}));
    const pts=[];for(const[s,k]of SS){const a=b.j(s,'ank'),f=[a[0]+.07,.01,k*.2],t=P[s],q=[f];
      for(const y of[b.j(s,'kne')[1],b.hip(s)[1]-.05]){const u=(y-f[1])/(t[1]-f[1]),x=mix(f[0],t[0],u),m=front(b,y)+.012;if(u>0&&u<1&&x<m)q.push([m,y,mix(f[2],t[2],u)]);}
      q.push(t,b.tpt(k*.11,-.01,-.035));pts.push(k>0?q:q.reverse());}
    K.band(E,pts[0].concat([b.tpt(0,-.035,-.07)],pts[1]),null,{col:K.BAND.red,w:.012,L0:1.4});
    E.boxA([.07,.003,0],[.05,.006,.42],K.BAND.red,{layer:-1,outline:false});sh(E);}
});

// ═══ PULL-THROUGH EN POLEA ═══ de espaldas a la polea baja, cuerda entre las piernas, brazos estirados: la cadera va atrás
// (las manos pasan entre los muslos) y sube apretando glúteos hasta bloquear; la pila sube lo que se alarga el cable.
GA.def('lib_pull_through_cable',{title:'Pull-through en cable',cam:{yaw:-58,pitch:10},fitBox:[[-1.2,0,-.45],[.6,1.85,.45]],
  muscles:{glutes:1,hams:.7,lowback:.3},labels:[G,H],
  timeline:TL(2,'Cadera atrás · brazos rectos',.3,'Estira isquios',1.2,'Aprieta glúteos y sube',.6,'Arriba · bloquea la cadera'),
  build(c,b,E){const p=c.p,PU=[-.85,.2,0],Q=Math.sqrt(K.armD(3)**2-.155**2),h={},cl=()=>{const m=V.lerp(h.R,h.L,.5);return V.madd(m,V.norm(V.sub(PU,m)),.26);};
    hinge(b,Object.assign(tilt(mix(2,68,p)),{fz:.25,toe:16,kf:mix(6,28,p),bx:.11,hold:b=>{const a=mix(-21,34,p)*D;
      for(const[s,k]of SS){h[s]=V.add(b.sho(s),[-Q*Math.sin(a),-Q*Math.cos(a),-k*.155]);b.arm(s,h[s],[-.3,0,k],[0,1,0]);}return null;}}));
    const cp=cl();E.rope(cp,h.R,h.L);E.pulley(PU,[0,0,1],.045);let q=PU;for(const t of[.5,.8,1]){const n=V.lerp(PU,cp,t);E.cable(q,n);q=n;}
    E.beam([-.95,0,0],[-.95,2.1,0],.1,C.frame);E.beam([-1.25,.04,0],[-.7,.04,0],.08,C.frameD,{layer:-1});E.beam([-.95,2.05,0],[-1.25,2.05,0],.06,C.frame);
    E.cable(PU,[-.95,.2,0]);E.pulley([-1.18,1.98,0],[0,0,1],.045);E.cable([-.95,2.025,0],[-1.18,2.025,0]);
    E.cable([-1.225,1.98,0],E.stack([-1.225,0,0],{h:1.9,lift:V.dist(PU,cp)-.62,n:14,sel:5,w:.26,bias:.2}));E.trace('cuerda',h.R);sh(E,.02);}
});

})(window.GymAnim);
