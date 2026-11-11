/* Balísticos / cuerpo completo: swings, cargadas, arranques, thrusters, wall ball, burpee, volteo de llanta, get-up */
(function(GA){
const{sin,cos,sqrt,min,max,PI,atan2}=Math,V=GA._.V,{add,sub,madd,lerp,norm,mul,len,cross,rot,perp,neg,dot,dist}=V;
const K=GA._.kit,DM=GA._.DIM,SS=K.SS,mix=K.mix,sst=K.sst,D=PI/180,R0=K.armD(4),EZ=GA._.EASE.mj,UPV=[0,1,0];
const OA=Object.assign,sp=x=>sin(PI*x),smid=b=>lerp(b.sho('R'),b.sho('L'),.5);
// spec compacto: labels por letras (LB), cámara {yaw, pitch 8} salvo que x la sustituya (cam, fitBox)
const LB={G:'Glúteos',I:'Isquiotibiales',L:'Lumbares',D:'Deltoides ant.',T:'Trapecio',C:'Cuádriceps',X:'Tríceps',P:'Pectoral',O:'Oblicuos',A:'Abdomen'};
const SP=(title,yaw,muscles,lb,init,timeline,build,x)=>OA({title,cam:{yaw,pitch:8},muscles,labels:[...lb].map(c=>LB[c]),init,timeline,build},x);
// paso de timeline: X(duración, etiqueta, activación, {canales, ease})
const X=(dur,label,act,o)=>OA({dur,label,act},o);
// de pie con talones elevables: metatarsos en (bx,±fz), hl = talón arriba (°), kf rodilla, tl inclinación; equilibrio del CdM
const st=(b,o)=>{const Y=o.y||0,hl=o.hl||0,to=o.toe==null?10:o.toe,BX=o.bx||.16;
 for(const[s,k]of SS)K.footBallOn(b,s,[BX,Y,k*(o.fz||.15)],-k*to,hl);
 const A={R:b.j('R','ank').slice(),L:b.j('L','ank').slice()},d=K.legD(o.kf==null?4:o.kf);
 const pose=hx=>{const hy=min(...SS.map(([s,k])=>A[s][1]+sqrt(max(.01,d*d-(hx-A[s][0])**2-(A[s][2]-k*DM.hipW)**2))));
 b.pelvis([hx,hy,0],{tilt:o.tl||0});K.trunk(b,o);K.legs(b,o.pole);if(o.arms)o.arms(b);};
 const cx=mix(BX-.11,BX-.01,sst(0,25,hl)),e0=b.ikErr,hx=K.root(x=>{pose(x);return K.com(b,o.xm&&o.xm())[0]-cx;},cx-.7,cx+.45);
 b.ikErr=e0;pose(hx);return hx;};

// ═══ SWING (kettlebell / mancuerna): bisagra explosiva, brazos como cuerdas ═══
// p 0 = pesa atrás entre las piernas (cadera cargada) → 1 = arriba (pecho u overhead). La cadera se extiende en la
// primera mitad y los brazos la siguen: al bajar, la cadera espera a que los brazos toquen los muslos.
const SW=o=>(c,b,E)=>{const p=c.p,q=sst(0,.62,p),top=o.top||88,kg=o.kg||20;let h=[0,0,0],u=[0,1,0];
 const arms=b=>{const sm=smid(b),dz=b.sho('R')[2]-sm[2]-.045,L=sqrt(R0*R0-dz*dz),cr=sub(b.ppt(0,-.6,.5),sm),a0=atan2(cr[0],-cr[1])/D;
 const a=mix(a0,top,p)*D,dr=[sin(a),-cos(a),0];h=madd(sm,dr,L);u=neg(dr);
 for(const[s,k]of SS)b.arm(s,add(h,[0,0,k*.045]),[-dr[1]*.3-.2,dr[0]*.3,k],[0,0,1]);};
 st(b,{bx:.12,fz:.25,toe:15,kf:mix(26,3,q),tl:mix(54,-3,q),sp:[mix(2,-2,q)],hd:mix(-30,-4,q)+(top>120?-10*sst(.6,1,p):0),
 sc:[top>120?.025*sst(.6,1,p):-.01,mix(.01,.02,p)],arms,xm:()=>[[h,kg/75*.6]]});
 if(o.db){const ax=neg(u);E.dumbbell(madd(h,ax,.035),ax,{r:.058,hl:.07,len:.13});}
 else K.kettlebell(E,h,{kg,up:u});
 E.trace('pesa',madd(h,u,-.1));E.shadow([0,0,0],.5,.4,.55);};
const SWT=(l1,l2,d=[.55,.18,.62])=>[X(d[0],'Extiende la cadera de golpe',1,{p:1}),X(d[1],l1,.85),
 X(d[2],'Cadera atrás · '+l2,.75,{p:0}),X(.08,'Carga la cadera',.8)],SW0={p:0,act:.8};
GA.def('lib_kb_swing',SP('Swing con kettlebell',32,{glutes:1,hams:.8,lowback:.5,abs:.3,forearms:.3},'GIL',SW0,
 SWT('Pesa a la altura del pecho','pesa entre piernas'),SW({})));
GA.def('lib_kb_swing_american',SP('Swing americano con kettlebell',32,{glutes:1,hams:.8,lowback:.5,frontdelts:.4,abs:.3},'GID',SW0,
 SWT('Arriba · brazos estirados','sin arquear',[.7,.2,.75]),SW({top:180,kg:16})));
GA.def('lib_db_swing',SP('Swing con mancuerna',32,{glutes:1,hams:.8,lowback:.5,forearms:.4,abs:.3},'GIL',SW0,
 SWT('Mancuerna a la altura del pecho','entre piernas'),SW({db:1})));

// ═══ LEVANTAMIENTOS DE PIE POR FOTOGRAMAS CLAVE ═══════════════════════════════
// Canales: kf rodilla, tl inclinación, hl talones, r posición de la carga a lo largo de o.seq (0..n-1, interpolada entre
// puntos clave relativos al cuerpo: hang colgando/suelo, hike entre las piernas, rack, hp tirón alto, oh sobre la cabeza).
const front=(b,y)=>{let x=-9;for(const[s]of SS){const S=b.S[s];for(const[a,z,r]of[[S.hip,S.kne,.08],[S.kne,S.ank,.056]])
 if(y<=a[1]&&y>=z[1]){const t=(a[1]-y)/(a[1]-z[1]);x=max(x,mix(a[0],z[0],t)+r);}}return x;};
// cada punto clave → [puño, polo del codo, eje del agarre, dirección asa→bola (kettlebell)]; rack kb: bola por fuera del antebrazo
const KP={
 hang(b,s,o){const k=K.sd(s),sh=b.sho(s),W=k*o.W,dz=W-sh[2],L=sqrt(R0*R0-dz*dz);let x=sh[0],y=sh[1]-L;
 if(o.cl)for(let i=0;i<3;i++){x=max(sh[0],front(b,y-o.cl)+o.cl);y=sh[1]-sqrt(max(.01,L*L-(x-sh[0])**2));}
 return[[x,max(y,o.fy||0),W],[-.2,0,k],o.ax0||[0,0,1],[0,-1,0]];},
 hike(b,s,o){const k=K.sd(s),sm=smid(b),cr=sub(b.ppt(0,-.6,.5),sm),d=mul(cr,1/len(cr)),dz=b.sho(s)[2]-sm[2];
 return[madd(sm,d,sqrt(R0*R0-dz*dz)),[-.3,0,k],[0,0,1],d];},
 sw(b,s,o){const k=K.sd(s),sh=b.sho(s),dz=k*.02-sh[2],a=(o.sw||35)*D,d=[sin(a),-cos(a),0];
 return[add(madd(sh,d,sqrt(K.armD(18)**2-dz*dz)),[0,0,dz]),[-.3,0,k],[0,0,1],d];},
 rack(b,s,o){const k=K.sd(s);return o.db?[b.tpt(k*.2,0,.12),[.4,-1,k*.4],[1,0,k*.3],0]:o.kb?[b.tpt(k*.06,-.11,.2),[.1,-1,k*.2],[.6,0,k],b.tdir(k*.62,-.78,.06)]:
 (q=>(q[2]=k*o.W,[q,b.tdir(k*.2,-.45,1),[0,0,1],0]))(add(b.sho(s),b.tdir(0,.07,.1)));},
 hp(b,s,o){const k=K.sd(s),c=b.tpt(o.one?k*.16:0,-.2,.2);return[o.one?c:[c[0],c[1],k*o.W],[-.3,.9,k*.9],[0,0,1],[0,-1,0]];},
 oh(b,s,o){const k=K.sd(s),sh=b.sho(s),W=o.one||o.db?k*.2:k*o.W,dz=W-sh[2],L=sqrt(R0*R0-dz*dz);
 return[[sh[0]-.025,sh[1]+sqrt(L*L-.0006),W],[-.4,0,k],o.ohAx||(o.db?[1,0,0]:[0,0,1]),[-.75,-.65,0]];}};
// kettlebell en rack/arriba: bola en el dorso del antebrazo (relativa al antebrazo real); u 0 rack → 1 arriba
const dors=(b,s,u)=>{const S=b.S[s],fd=norm(sub(S.grip,S.elb)),w=norm(perp(lerp(b.tdir(K.sd(s),0,.35),[-1,0,.1],u),fd));return norm(add(mul(fd,-cos(55*D)),mul(w,sin(55*D))));};
const LF=o=>(c,b,E)=>{const sq=o.seq,n=sq.length,i=min(n-2,Math.floor(c.r)),t=c.r-i,G={},side=o.one?['R']:['R','L'],ms=o.kg/75*(o.bm||1);
 const toOH=sq[i+1]==='oh',tx=toOH?sst(.3,1,t):t,hd=toOH&&o.bar?-20*sp(min(1,t*1.4)):0,ohw=sq[n-1]==='oh'?sst(n-2.5,n-1,c.r):0;
 const arms=b=>{for(const s of side){const dr=c.d>0&&c.r>1,T=dr?(c.r-1)/2:t,A=dr?KP.sw(b,s,o):KP[sq[i]](b,s,o),B=dr?KP.oh(b,s,o):KP[sq[i+1]](b,s,o);let g;
 // arco centrado en el hombro: hike ↔ swing y, con el canal d (arranque kb), caída con el brazo estirado de arriba al swing
 if(dr||sq[i]==='hike'||sq[i]==='sw'&&sq[i+1]==='hike'){const sh=b.sho(s),va=sub(A[0],sh),vb=sub(B[0],sh),l=mix(len(va),len(vb),T),dz=mix(va[2],vb[2],T),
 an=v=>{const a=atan2(v[0],-v[1]);return a<-PI/2?a+2*PI:a;},a=mix(an(va),an(vb),T);g=madd(add(sh,[0,0,dz]),[sin(a),-cos(a),0],sqrt(l*l-dz*dz));}
 else{g=lerp(A[0],B[0],t);g[0]=mix(A[0][0],B[0][0],tx);}
 if(o.bulge)g[0]+=o.bulge*sp(t)*(sq[i]==='hang');if((o.bar||o.bo)&&toOH)g[0]+=(o.bo||.09)*sp(t);
 const ax=norm(lerp(A[2],B[2],T));G[s]={g,ax,bd:A[3]&&B[3]?norm(lerp(A[3],B[3],T)):0};b.arm(s,g,madd(lerp(A[1],B[1],T),[0,0,K.sd(s)],/^(hprack|rackhp)$/.test(sq[i]+sq[i+1])?1.5*sp(T):0),ax);if(dr)G[s].bd=norm(lerp(B[3],norm(sub(g,b.sho(s))),sst(0,.4,1-T)));
 const ro=/^(rack|oh)$/.test(sq[i]);if(o.kb&&!dr&&(ro||sq[i]==='sw')&&/^(rack|oh)$/.test(sq[i+1])){const dv=dors(b,s,sq[i]==='oh'?1-t:sq[i+1]==='oh'?t:0);G[s].bd=ro?dv:norm(lerp(A[3],dv,t));}}
 if(o.one)b.armFK('L',{abd:mix(10+sst(10,60,c.tl)*24,45,ohw),flex:mix(c.tl*.9+6,20,ohw),elbow:mix(12,25,ohw),rot:-10});};
 const xm=()=>side.map(s=>[G[s].g,ms]);
 st(b,{bx:.12,fz:o.fz||.16,toe:o.toe||10,kf:c.kf,tl:c.tl,hl:c.hl,sp:[0],hd:-c.tl*.5+hd,sc:[.03*sst(4,20,c.hl)+.02*ohw,0],arms,xm});
 if(o.bar){const m=lerp(G.R.g,G.L.g,.5);K.barbell(E,[m[0],m[1],0],[0,0,1],{plates:o.bar});E.trace('barra',[m[0],m[1],.75]);}
 else for(const s of side){const q=G[s];if(o.kb)K.kettlebell(E,q.g,{kg:o.kg,up:neg(q.bd),ax:q.ax});else E.dumbbell(q.g,q.ax,{r:.06,hl:.075,len:.13});}
 E.shadow([.05,0,0],.55,.4,.55);return G;};
const TH=o=>LF(OA({seq:['rack','oh'],fz:.2,toe:18},o)),BP=th=>[{r:.225,th,col:K.COL.bumper}];

// ═══ CARGADA / ARRANQUE DE POTENCIA ═══ suelo → rodilla (espalda fija) → triple extensión y encogimiento → codos rápidos al
// frente (rack, media sentadilla) o barra pegada con codos altos (arriba, brazos rectos) → de pie → baja controlada.
const OP=(e,o)=>LF(OA({seq:['hang','hp',e],cl:.03,fy:.225,bm:.3},o)),OL=(k0,t0,a,r,lr,ls,d)=>[X(a[2],'Despega · espalda fija',.9,{p:.3,kf:a[0],tl:a[1]}),X(.28,'Extiende cadera · encoge',1,{p:.6,kf:12,tl:-6,hl:20,r:.1,ease:'in'}),
 X(r[3],lr,1,{p:1,kf:r[0],tl:r[1],hl:0,r:r[2],ease:'out'}),X(d[0],'Ponte de pie',.8,{kf:4,tl:0}),X(d[1],ls,d[2]),
 X(d[3],'Baja a la cadera',.6,{r:0,kf:10,tl:4}),X(1.3,'Baja al suelo · espalda neutra',.65,{p:0,kf:k0,tl:t0}),X(.3,'Prepara',.6)];
GA.def('lib_power_clean',SP('Cargada de potencia con barra',42,{glutes:1,hams:.8,traps:.8,quads:.7,lowback:.5},'GIT',{p:0,kf:96,tl:64,hl:0,r:0,act:.6},
 OL(96,64,[32,56,.5],[58,16,2,.32],'Codos al frente · recibe','Barra en los hombros',[.8,.4,.6,.7]),
 OP('rack',{W:.24,fz:.13,kg:60,bar:BP(.065),bulge:.04})));
GA.def('lib_power_snatch',SP('Arranque de potencia con barra',42,{glutes:1,hams:.8,traps:.8,quads:.6,frontdelts:.6,lowback:.5},'GIT',{p:0,kf:108,tl:62,hl:0,r:0,act:.6},
 OL(108,62,[36,58,.55],[56,14,2,.4],'Métete debajo · brazos rectos','Bloquea arriba',[.9,.5,.7,.9]),
 OP('oh',{W:.44,kg:40,bar:BP(.05),bulge:.03})));

// ═══ THRUSTERS ═══ rack → sentadilla profunda (codos al frente, tronco erguido) → sube y, sin pausa, empuja arriba
const THR=(lb,ld)=>[X(1.3,'Baja · '+lb,.8,{p:.5,kf:116,tl:26}),X(.45,'Sube con fuerza',1,{p:.75,kf:32,tl:8,r:.15,ease:'in'}),
 X(.45,'Empuja arriba',1,{p:1,kf:4,tl:0,r:1,ease:'out'}),X(.3,'Bloquea arriba',.8),X(.8,ld,.7,{p:0,r:0})],I0={p:0,kf:4,tl:0,hl:0,r:0,act:.7};
GA.def('lib_thruster_bb',SP('Thruster con barra',42,{quads:1,frontdelts:.8,glutes:.7,triceps:.5,abs:.3},'CDG',I0,THR('codos al frente','Barra a los hombros'),
 TH({W:.24,kg:40,bm:.6,bar:BP(.05)})));
GA.def('lib_thruster_db',SP('Thruster con mancuernas',38,{quads:1,frontdelts:.8,glutes:.7,triceps:.5,sidedelts:.3},'CDG',I0,THR('mancuernas en hombros','Mancuernas a los hombros'),
 TH({db:1,kg:15})));
GA.def('lib_kb_thruster',SP('Thruster con kettlebell',38,{quads:1,frontdelts_R:.8,glutes:.7,triceps_R:.5,abs:.3},'CDG',I0,THR('pesa en rack','Pesa al rack'),
 TH({kb:1,one:1,kg:16})));

// ═══ KETTLEBELL A UNA MANO ═══ swing corto → la pesa sube pegada y la mano la rodea (rack / arriba) → vuelve entre las piernas
const KB0={p:0,kf:26,tl:54,hl:0,r:0,act:.8},DROP=(r,l,x,d)=>[X(d||.35,l,.75,{p:.3,r,kf:5,tl:0}),X(.5,'Cadera atrás · entre las piernas',.8,OA({p:0,r:0,kf:26,tl:54},x)),X(.08,'Carga la cadera',.8)],
 K1=(seq,sw)=>LF({seq,kb:1,one:1,fz:.25,toe:12,kg:16,sw});
GA.def('lib_kb_clean',SP('Cargada con kettlebell',34,{glutes:1,hams:.7,traps:.5,forearms_R:.5,lowback:.4},'GIT',KB0,
 [X(.4,'Extiende la cadera · pegada',1,{p:.6,kf:6,tl:-2,r:1,ease:'in'}),X(.28,'Gira la mano · recibe',1,{p:1,kf:12,tl:0,r:2,ease:'out'}),
 X(.6,'Rack · codo pegado',.7,{kf:4}),...DROP(1,'Suelta la pesa')],K1(['hike','sw','rack'],22)));
GA.def('lib_kb_clean_press',SP('Cargada y press con kettlebell',34,{frontdelts_R:1,glutes:.7,triceps_R:.6,hams:.5,traps:.4},'DGX',KB0,
 [X(.4,'Extiende la cadera',1,{p:.3,kf:6,tl:-2,r:1,ease:'in'}),X(.28,'Recibe en rack',1,{p:.5,kf:12,tl:0,r:2,ease:'out'}),
 X(.4,'Rack · codo pegado',.8,{kf:4}),X(.8,'Empuja recto arriba',1,{p:1,r:3}),X(.4,'Bloquea arriba',.85),
 X(1.1,'Baja al rack',.75,{p:.5,r:2}),...DROP(1,'Suelta la pesa')],K1(['hike','sw','rack','oh'],22)));
GA.def('lib_kb_snatch',SP('Arranque con kettlebell',34,{glutes:1,hams:.8,frontdelts_R:.5,traps:.5,lowback:.4},'GID',OA({d:0},KB0),
 [X(.38,'Extiende la cadera de golpe',1,{p:.4,kf:6,tl:-3,r:1,ease:'in'}),X(.18,'Codo alto · pesa pegada',1,{p:.7,r:2,ease:'lin'}),
 X(.24,'Mete la mano · bloquea',1,{p:1,kf:9,r:3,ease:'out'}),X(.4,'Arriba · brazo estirado',.8,{kf:4,d:1}),...DROP(1,'Déjala caer en arco',{d:0},.5)],K1(['hike','sw','hp','oh'],30)));

// ═══ MANCUERNAS: arranque a una mano desde el suelo · cargada y press ═══
GA.def('lib_snatch_db',SP('Arranque con mancuerna',34,{glutes:1,hams:.7,frontdelts_R:.6,traps:.6,quads:.5},'GID',{p:0,kf:100,tl:56,hl:0,r:0,act:.7},
 [X(.45,'Extiende la cadera con fuerza',1,{p:.5,kf:12,tl:-5,hl:18,r:.1,ease:'in'}),X(.35,'Pegada al cuerpo · arriba',1,{p:1,kf:30,tl:6,hl:0,r:2,ease:'out'}),
 X(.5,'Bloquea el brazo arriba',.8,{kf:4,tl:0}),X(.9,'Baja controlada',.7,{p:.5,r:0,kf:24,tl:30}),X(.9,'Al suelo entre los pies',.7,{p:0,kf:100,tl:56}),X(.25,'Prepara',.7)],
 LF({seq:['hang','hp','oh'],one:1,W:.06,cl:.09,fy:.06,ax0:[0,0,1],bo:.12,ohAx:[.3,0,1],fz:.22,toe:22,kg:15})));
GA.def('lib_clean_press_db',SP('Cargada y press con mancuernas',38,{frontdelts:1,glutes:.7,hams:.5,triceps:.5,traps:.5},'DGX',{p:0,kf:4,tl:0,hl:0,r:0,act:.6},
 [X(.6,'Cadera atrás',.75,{p:.1,kf:26,tl:32}),X(.3,'Tirón de cadera',1,{p:.3,kf:8,tl:-4,hl:15,r:.15,ease:'in'}),
 X(.3,'Recibe en los hombros',1,{p:.5,kf:30,tl:6,hl:0,r:1,ease:'out'}),X(.5,'De pie · core firme',.8,{kf:4,tl:0}),
 X(.9,'Empuja arriba',1,{p:1,r:2}),X(.3,'Bloquea arriba',.85),X(1.2,'Baja a los hombros',.75,{p:.5,r:1}),X(.9,'Baja controlado',.6,{p:0,r:0})],
 LF({seq:['hang','rack','oh'],db:1,W:.22,ax0:[1,0,0],kg:15})));

// ═══ WALL BALL ═══ balón al pecho y sentadilla profunda → extensión explosiva y lanzamiento a la diana (3,05 m) → el
// balón sube hasta la pared, cae y se recibe arriba para bajar directo a la siguiente sentadilla. Vuelo en el paso 4 (c.u).
GA.def('lib_mb_wall_ball',SP('Wall ball con balón medicinal',0,{quads:1,glutes:.8,frontdelts:.6,triceps:.4,abs:.3},'CGD',{p:0,kf:60,tl:12,hl:0,a:0,act:.7},
 [X(.55,'Sentadilla profunda',.8,{p:.5,kf:128,tl:30,ease:'out'}),X(.4,'Sube con fuerza',1,{p:.8,kf:24,tl:5,a:.65,ease:'in'}),
 X(.2,'Lanza a la diana',1,{p:1,kf:4,tl:-2,hl:14,a:1,ease:'out'}),X(.86,'Al punto alto de la pared',.6,{hl:0,a:.78,ease:'sin'}),
 X(.45,'Recibe y baja',.7,{p:0,a:0,kf:60,tl:12,ease:'in'})],
 (c,b,E)=>{const r=.17,WX=.78,TY=3.05,fl=c.stepIdx===3?c.u*.86:-1;let mc=[0,1.2,0],H={};
 const arms=b=>{const sm=smid(b),a=c.a,th=mix(62,158,a)*D,d=[sin(th),-cos(th),0];mc=b.tpt(0,-.18,.15+r);
 if(a>0)mc=lerp(mc,madd(sm,d,.55+r*.8),sst(0,.6,a));
 for(const[s,k]of SS){H[s]=madd(mc,norm(add(mul(mul(d,-1),.8*a),[0,-.6*(1-a),k])),r+.028);b.arm(s,H[s],[-.3,-.6+a,k],[1,0,0]);}};
 st(b,{bx:.12,fz:.2,toe:16,kf:c.kf,tl:c.tl,hl:c.hl,sp:[-3],hd:-c.tl*.4-18*c.a,arms,xm:()=>[[mc,.12]]});
 if(fl>=0){const P=mc,T=[WX-r,TY,0],tu=sqrt(2*(TY-P[1])/9.81),td=.86-tu;
 if(fl<tu){const q=fl/tu;mc=[mix(P[0],T[0],q),TY-(TY-P[1])*(1-q)*(1-q),0];}else{const q=min(1,(fl-tu)/td);mc=[mix(T[0],P[0],q),TY-(TY-P[1])*q*q,0];}}
 K.medball(E,mc,r,{kind:'wall'});K.wall(E,{x:WX,target:TY,h:3.3,w:.9});E.trace('balón',mc);E.shadow([0,0,0],.5,.4,.55);},
 {cam:{yaw:-28,pitch:6},fitBox:[[-.55,0,-.5],[.85,3.2,.5]]}));

// ═══ POSES POR INSTANTÁNEAS ═══ snap guarda pelvis, columna, pies y polos de rodilla + modo de brazos (P palma en H, hang, oh);
// blend interpola entre la pose de origen y la de destino del paso (canal de texto k: c.step.from.k → c.step.to.k) con c.u suavizado.
const snap=(b,am,dy)=>{const o={o:add(b.pf.o,[0,dy||0,0]),U:b.pf.U.slice(),F:b.pf.F.slice(),sp:b.sp.slice(),hd:b.hd.slice(),sc:b.sc.R.slice(),am};
 for(const[s]of SS){const T=b.S[s];o[s]={a:add(T.ank,[0,dy||0,0]),f:T.ffwd.slice(),u:T.fup.slice(),kp:sub(T.kne,lerp(T.hip,T.ank,.5))};}return o;};
const AM={hang:(b,s,k)=>[add(b.sho(s),[.03,-.62,k*.04]),[-.3,0,k],[1,0,0]],oh:(b,s,k)=>[add(b.sho(s),[.06,.62,k*.03]),[-.3,0,k],[1,0,0]]};
const blend=(c,b,E,SN,H,hop)=>{const A=SN[c.step.from.k],B=SN[c.step.to.k],e=EZ(c.u),L=(x,y)=>lerp(x,y,e);
 K.frame(b,L(A.o,B.o),L(A.U,B.U),L(A.F,B.F));
 // salto de plancha ↔ cuclillas: cadera arriba (pica sobre los hombros) para que las rodillas no rocen el suelo
 if(hop){const sm=smid(b),th=-30*D*sp(e),Z=[0,0,1];K.frame(b,add(sm,rot(sub(b.pf.o,sm),Z,th)),rot(b.pf.U,Z,th),rot(b.pf.F,Z,th));}
 b.spine(...L(A.sp,B.sp));b.head(...L(A.hd,B.hd));b.scap('both',mix(A.sc[0],B.sc[0],e),mix(A.sc[1],B.sc[1],e));
 // rodilla ⟂ a la pierna en el plano sagital (el polo interpolado de dos posturas puede quedar paralelo a cadera→tobillo)
 for(const[s]of SS){const a=L(A[s].a,B[s].a),Rr=b.pdir(1,0,0);a[1]+=(hop||0)*sp(e)*(A[s].a[0]!==B[s].a[0]);b.foot(s,a,L(A[s].f,B[s].f),L(A[s].u,B[s].u));
 b.leg(s,null,madd(cross(Rr,norm(sub(a,b.hip(s)))),Rr,K.sd(s)*.2));}
 for(const[s,k]of SS){if(A.am==='P'&&B.am==='P'){K.palm(b,E,s,H[s]);continue;}
 const f=(m)=>m==='P'?[add(H[s],[-.05,.029,0]),[-1,.25,k*.6],[0,0,1]]:AM[m](b,s,k),X=f(A.am),Y=f(B.am),g=L(X[0],Y[0]);
 if(A.am==='oh'||B.am==='oh')g[0]+=.35*sp(e);const sh=b.sho(s),v=sub(g,sh),l=len(v);b.arm(s,l>R0?madd(sh,v,R0/l):g,L(X[1],Y[1]),L(X[2],Y[2]));}
 return e;};

// ═══ BURPEE ═══ de pie → manos al suelo → salto atrás a plancha → flexión → recoge los pies → salto con brazos arriba
GA.def('lib_burpee',SP('Burpees',30,{quads:1,pecs:.6,glutes:.6,frontdelts:.45,triceps:.4},'CPG',{k:'A',p:0,act:.6},
 [X(.45,'Manos al suelo',.75,{k:'B',p:.2}),X(.3,'Salta atrás a plancha',.85,{k:'C',p:.3}),
 X(.45,'Flexión · pecho abajo',.8,{k:'D',p:.45}),X(.4,'Empuja el suelo',1,{k:'C',p:.55}),X(.3,'Recoge los pies',.9,{k:'B',p:.7}),
 X(.42,'Salta · brazos arriba',1,{k:'G',p:1}),X(.3,'Aterriza suave',.8,{k:'L',p:.1}),X(.3,'De pie',.6,{k:'A',p:0})],
 function(c,b,E){const HX=.36,ZH=.22,H={R:[HX,0,ZH],L:[HX,0,-ZH]};
 const SN=K.memo(this,'sn',()=>{const S={},pk={};
 K.stand(b,{fz:.13,toe:8,kf:4});S.A=snap(b,'hang');K.stand(b,{fz:.13,toe:8,kf:45,tilt:22});S.L=snap(b,'hang');
 K.stand(b,{fz:.13,toe:8,kf:135,tilt:65,x:-.15});S.B=snap(b,'P');
 K.plank(b,null,{xT:-1.02,hx:HX,zH:ZH,zF:.1,p:0,k:pk});S.C=snap(b,'P');
 K.plank(b,null,{xT:-1.02,hx:HX,zH:ZH,zF:.1,p:1,k:pk});S.D=snap(b,'P');
 st(b,{bx:.12,fz:.13,toe:8,kf:3,hl:38,hd:-8,arms:b=>{for(const[s,k]of SS)b.arm(s,AM.oh(b,s,k)[0],[-.3,0,k]);}});S.G=snap(b,'oh',.14);
 b.ikErr=0;return S;});
 const hop=(c.step.from.k==='B')!==(c.step.to.k==='B')&&'BC'.includes(c.step.from.k)&&'BC'.includes(c.step.to.k)?.15:0;
 blend(c,b,E,SN,H,hop);E.shadow([-.25,0,0],.8,.4,.5);},{cam:{yaw:30,pitch:12}}));

// ═══ VOLTEO DE LLANTA ═══ llanta de 1,44 m × 0,40 (anillo de cápsulas con tacos) que pivota sobre la banda lejana; al caer avanza
// 2·TR y la escena se desplaza lo mismo mientras el atleta camina hasta ella (cámara que le sigue) → bucle sin saltos.
// Contactos en el marco de la llanta (relativos al pivote S, antes de girar): agarre bajo la banda cercana / palma en su cara.
// Cadera: hy (altura) por canal; x resuelta para que el brazo llegue con el codo c.el (con rel>0 sólo hacia atrás de hx).
const TR=.52,TT=.2,TD=2*TR,rz=(a,v)=>[v[0]*cos(a)-v[1]*sin(a),v[0]*sin(a)+v[1]*cos(a),v[2]];
GA.def('lib_tire_flip',SP('Volteo de llanta',-22,{glutes:1,quads:.8,hams:.6,lowback:.6,frontdelts:.4},'GCI',
 {p:0,th:0,fR:-.3,fL:-.3,hy:.38,hx:.07,tl:80,el:90,ar:0,rel:0,act:.8},
 [X(.9,'Empuja con piernas y cadera',1,{p:.4,th:30,hy:.76,tl:38,el:72}),
 X(.45,'Pecho y manos a empujar',1,{p:.7,th:58,ar:1,el:118,hy:.66,tl:20,fR:.15}),
 X(.55,'Remata con los brazos',1,{p:1,th:98,el:4,hy:.74,hx:.33,tl:24,fR:.5,fL:.12}),
 X(.5,'La llanta cae',.7,{p:.6,th:180,rel:1,ar:0,el:10,hy:.9,hx:.05,tl:0,ease:'in'}),
 X(.55,'Camina hasta la llanta',.6,{fL:.74,p:.4}),X(.45,'Camina hasta la llanta',.6,{fR:.74,p:.2}),
 X(.9,'Pecho a la llanta · manos debajo',.75,{p:0,rel:0,el:90,hy:.38,hx:.07,tl:80}),X(.3,'Prepara',.8)],
 function(c,b,E){const tl=this._tl,st=tl.steps,T=tl.total,
 G=(q,sv)=>{const tt=((q.t%T)+T)%T,off=-TD*sst(st[3].t0,st[6].t0+st[6].dur,tt),S=[1+TR+off,TT,0],fl=q.th>179.9,ac=fl?0:-min(q.th,98)*D,Sc=fl?add(S,[TD,0,0]):S,A={},PL={},W=v=>add(Sc,rz(ac,v));
 for(const[s,k]of SS){const z=k*.2,q2=sqrt(1-z*z/TR/TR),nr=[-q2,0,z/TR],Q=[-TR-TR*q2,0,z],pp=W(add(Q,[nr[0]*.03,-TT,nr[2]*.03])),n=rz(ac,[0,-1,0]),fd=rz(ac,nr);
 PL[s]=[pp,{fd,n,pole:[-.4,-1,k*.8]}];A[s]=[lerp(W(add(Q,[nr[0]*.176,-.148,nr[2]*.176])),K.palmT(pp,{fd,n}),q.ar),lerp([-1,-.2,k*.6],[-.4,-1,k*.8],q.ar),lerp(rz(ac,[-nr[2],0,nr[0]]),cross(fd,n),q.ar)];}
 const ft={};for(const[s,k]of SS){const ch='f'+s;ft[s]=[q[ch]+off,k*.2,q.step.from[ch]!==q.step.to[ch]?.08*sp(q.u):0];}
 const mid=(ft.R[0]+ft.L[0])/2,pose=x=>K.stand(b,{feet:ft,toe:16,hy:min(q.hy,...SS.map(([s,k])=>.075+ft[s][2]+sqrt(max(.01,.74-(x-ft[s][0]-.053)**2-(k*.112)**2)))),x,tilt:q.tl,sp:[-4*(1-q.rel)],hd:-q.tl*.5,sc:[.01,.025*q.ar-.01]});
 const fr=mid+q.hx,f=x=>{pose(x);return dist(b.sho('R'),A.R[0])-K.armD(q.el);},up=q.rel>0&&q.step.to.rel?fr:min(A.R[0][0]-.5*sin(q.tl*D)+.05+q.hx,mid+.6);let hx=fr;
 if(sv&&q.rel<1){const e0=b.ikErr;hx=mix(f(up)<0?K.root(f,mid-.7,up):up,fr,q.rel);b.ikErr=e0;}return{S,A,PL,mid,pose,hx};};
 // pasos agarrado (rel 0→0): la cadera interpola entre las soluciones de los extremos del paso (la raíz del codo es plana a mitad)
 const fx=!c.step.from.rel&&!c.step.to.rel,g=G(c,!fx),A=g.A,S=g.S;let hx=g.hx;
 if(fx){const i=c.stepIdx,s=st[i],M=K.memo(this,'hx',()=>({})),e0=b.ikErr;M[i]=M[i]||[0,.9999].map(u=>G(GA._.evalTL(tl,this,s.t0+s.dur*u),1).hx);b.ikErr=e0;hx=mix(M[i][0],M[i][1],s.ease(c.u));}
 g.pose(hx);
 const a=-c.th*D,yw=this.cam.yaw*D,cd=[sin(yw),0,cos(yw)],tp=(f,r,y)=>add(S,rz(a,[(TR+r)*cos(f)-TR,y,(TR+r)*sin(f)])),ctr=tp(0,-TR,0);
 for(let i=0;i<20;i++){const f=i*PI/10,h=f+PI/10,P=tp(f,0,0),Q=tp(h,0,0),m=tp(f+.15,.21,0);
 E.cap(P,Q,TT,TT,'#30353b',{grp:dot(sub(lerp(P,Q,.5),ctr),cd)>0?'tN':'tF'});for(const y of[.13,-.13])E.line(tp(f,.15,y),m,.022,'#1b1e22');}
 // brazos: agarre/palma ↔ colgando (rel) pasando por un punto delante de la banda (la mano entra por debajo sin cruzarla)
 for(const[s,k]of SS){if(c.ar>=1&&!c.rel){K.palm(b,E,s,...g.PL[s]);continue;}const sh=b.sho(s),H=[sh[0]+.05,sh[1]-.6,sh[2]+k*.06],G0=A[s][0],Ap=add(G0,[-.2,.1,0]),r=mix(c.step.from.rel,c.step.to.rel,EZ(c.u)),P=r<.35?lerp(G0,Ap,r/.35):lerp(Ap,H,(r-.35)/.65),v=sub(P,sh),l=len(v);
 b.arm(s,madd(sh,v,min(1,R0/l)),lerp(A[s][1],[-.3,0,k],r),lerp(A[s][2],[1,0,0],r));}
 E.shadow([g.mid+.1,0,0],.45,.35,.5);E.shadow([ctr[0],0,0],.8,.75,.35);},{cam:{yaw:-22,pitch:12}}));

// ═══ LEVANTAMIENTO TURCO ═══ 7 posturas clave (tumbado · codo · mano · puente · rodilla · media rodilla · de pie) resueltas una
// vez con apoyos exactos: palma izquierda fija en P (brazo a 45° en '0', codo en el suelo en '1'), pie derecho fijo, pierna
// izquierda estirada con el talón fijo hasta el barrido; brazo de la pesa siempre vertical sobre el hombro (bola en el dorso).
const PT=['pel','gluR','gluL'];
GA.def('lib_kb_turkish_getup',SP('Levantamiento turco con kettlebell',20,{obliques:1,frontdelts_R:.8,abs:.7,glutes:.6,triceps_R:.4,quads:.4},'ODA',{k:'0',p:0,act:.5},
 [X(1.2,'Al codo · mira la pesa',.85,{k:'1',p:.3}),X(1,'A la mano · brazo bloqueado',.9,{k:'2',p:.55}),
 X(1,'Puente alto de cadera',1,{k:'3',p:1}),X(1.3,'Pierna atrás · rodilla al suelo',.9,{k:'4',p:.8}),
 X(1.1,'Tronco arriba · media rodilla',.85,{k:'5',p:.7}),X(1.3,'Ponte de pie',.8,{k:'6',p:.6}),X(.8,'Arriba · brazo bloqueado',.7),
 X(1.4,'Baja a media rodilla',.8,{k:'5',p:.7}),X(1.2,'Mano al suelo',.85,{k:'4',p:.8}),X(1.4,'Pierna delante · puente',.9,{k:'3',p:1}),
 X(1.2,'Cadera al suelo',.85,{k:'2',p:.55}),X(1.2,'Al codo',.8,{k:'1',p:.3}),X(1.4,'Túmbate · pesa arriba',.6,{k:'0',p:0}),
 X(.6,'Abajo · mira la pesa',.5)],
 function(c,b,E){const G=K.memo(this,'g',()=>{const S={},sn=(n,o)=>S[n]=OA(snap(b,o.am||'P'),o),lp=[-.6,.3,-1];let AL,FL,UL;
 const legs=()=>{b.footFlat('R',[.3,0,.16],-4);b.leg('R',null,[.3,1,.4]);b.foot('L',AL,FL,UL);b.leg('L',null,[0,1,-.3]);},dv=q=>dist(b.sho('L'),fP)-R0;
 K.supine(b,{x:0,at:'pelvis',hd:'rest'});const hl=b.hip('L'),dl=norm([.92,0,-.4]),s0=b.sho('L'),fd=norm([1,0,-1]);FL=norm([0,1,-.25]);UL=neg(dl);
 AL=K.footOn(b,'L',[hl[0]+dl[0]*.8,0,hl[2]+dl[2]*.8],FL,UL);
 const fP=madd([s0[0],.029,s0[2]],fd,sqrt(R0*R0-(s0[1]-.029)**2)),P=madd([fP[0],0,fP[2]],fd,.05),E1=add(madd(fP,fd,-.33),[0,.016,0]);
 legs();sn('0',{rest:1,lp:UPV});
      // tronco girado y apoyado en los glúteos: incl x, giro y (hacia el codo), roll r
 const pz=(x,y,r)=>{K.supine(b,{x:0,at:'pelvis',incl:x,roll:r,parts:PT});K.frame(b,b.pf.o,rot(b.pf.U,UPV,y*D),rot(b.pf.F,UPV,y*D));K.rest(b,PT);return b.sho('L');};
 const p1=y=>{pz(K.root(x=>pz(x,y,38)[1]-.33,5,75),y,38);const q=b.sho('L');return Math.hypot(q[0]-E1[0],q[2]-E1[2])-.094;},Y1=K.root(p1,-45,0);p1(Y1);
 b.head(-20,-35,0);legs();sn('1',{rest:1,lp:sub(E1,b.sho('L'))});
 const p2=x=>pz(x,Y1,22)&&dv();p2(K.root(p2,30,89));b.head(-30,-30,0);legs();sn('2',{rest:1,lp});
 const o2=S['2'].o,p3=h=>{let o=add(o2,[0,h,0]);for(let i=0;i<3;i++){const U=sub(add(fP,[0,.72,0]),o);K.frame(b,o,U,cross(U,[0,1,.5]));const d=sub(AL,b.hip('L')),l=len(d);o=madd(o,d,(l-.85)/l);}
 K.trunk(b,{});return dv();};p3(K.root(p3,0,.5));b.head(-35,-30,0);legs();sn('3',{lp});
 const kn=K.kneel(b,{x:-.163,half:'R',fwd:.44,fz:.16,kz:.1,thigh:3,toes:'tuck',hd:-35}).knees.L;sn('5',{am:'F',kn});
 K.stand(b,{feet:{R:[.3,.16],L:[.3,-.1]},toe:4,kf:4,hd:-10});sn('6',{am:'F'});
 const Q=S['5'];K.frame(b,Q.o,Q.U,Q.F);const h5=b.hip('L'),dP=norm(sub(fP,h5));
 const p4=x=>{const U=norm(lerp(Q.U,dP,x)),F=norm(perp(Q.F,U));K.frame(b,madd(h5,cross(F,U),DM.hipW),U,F);K.trunk(b,{});return dv();};
 p4(K.root(p4,0,1));b.head(-40,-25,0);S['4']=OA(snap(b,'P'),{R:Q.R,L:Q.L,kn,lp});
 b.ikErr=0;return{S,P,fd,fP,E1};});
 const A=G.S[c.step.from.k],B=G.S[c.step.to.k],e=EZ(c.u),L=(x,y)=>lerp(x,y,e);
 K.frame(b,L(A.o,B.o),L(A.U,B.U),L(A.F,B.F));b.spine(...L(A.sp,B.sp));b.head(...L(A.hd,B.hd));if(A.rest&&B.rest)K.rest(b,PT);
 for(const[s]of SS){const a=L(A[s].a,B[s].a),fw=L(A[s].f,B[s].f),up=L(A[s].u,B[s].u);
 if(s==='L'&&A.kn&&B.kn){const n=L(A.kn,B.kn);b.legDir(s,sub(n,b.hip(s)),sub(a,n));b.foot(s,b.j(s,'ank'),fw,up);continue;}
 if(s==='L'&&(A.kn||B.kn))a[1]+=.12*sp(e);b.foot(s,a,fw,up);b.leg(s,null,L(A[s].kp,B[s].kp));}
 const h=add(b.sho('R'),[0,K.armD(3),0]),pd=norm(perp(sub(b.pf.F,b.pf.U),UPV)),ax=cross(UPV,pd);
 b.arm('R',h,b.tf.R,ax);K.kettlebell(E,h,{kg:12,up:norm(add(mul(pd,.85),[0,.5,0])),ax});
 const sh=b.sho('L');
 if(A.am==='P'&&B.am==='P'){let pl=L(A.lp,B.lp);
      // tumbado ↔ codo: el codo va al punto de su círculo (IK) que está a la altura del suelo, del lado de E1
 if(/^[01]+$/.test(c.step.from.k+c.step.to.k)){const d=sub(G.fP,sh),l=len(d),n=mul(d,1/l),a=(l*l-.0189)/(2*l),C=madd(sh,n,a),r=sqrt(max(0,.09-a*a)),
 u=norm(perp([0,-1,0],n)),w=cross(n,u),cs=K.clamp((.045-C[1])/(r*u[1]||-1e-9),-1,1);
 pl=add(mul(u,cs),mul(w,sqrt(1-cs*cs)*(dot(w,sub(G.E1,C))<0?-1:1)));}
 K.palm(b,E,'L',G.P,{fd:G.fd,pole:pl});}
 else{const tg=m=>m.am==='P'?G.fP:madd(sh,b.tdir(-.3,-.95,.05),.58),v=sub(L(tg(A),tg(B)),sh),l=len(v);b.arm('L',madd(sh,v,min(1,R0/l)),[-.3,0,-1],[1,0,0]);}
 E.shadow([b.pf.o[0],0,b.pf.o[2]],.7,.5,.45);},{cam:{yaw:-15,pitch:16}}));

})(window.GymAnim);
