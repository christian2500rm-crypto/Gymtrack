/* Cardio (biblioteca): cinta, bicis, remo, escaladora, SkiErg, marcha/trote/carrera, escaleras, step, comba, boxeo, HIIT, baile, natación */
(function(GA){
const K=GA._.kit,V=GA._.V,C=GA._.COL,DM=GA._.DIM,SS=K.SS,mix=K.mix,sst=K.sst,cl=K.clamp,D=Math.PI/180,PI=Math.PI,TAU=2*PI,ZV=[0,0,1],UP=[0,1,0],MJ=GA._.EASE.mj;
// spec cíclico compacto
const CY=(title,yaw,pitch,T,muscles,labels,label,note,act,build,x)=>Object.assign({title,cam:{yaw,pitch},cycle:{period:T},muscles,labels,note,init:{act},timeline:[{dur:T,label,act}],build},x);
const ss=t=>sst(0,1,t),sn=x=>Math.sin(TAU*x),cs=x=>Math.cos(TAU*x);
// Hermite por claves [[t,v…]] (tangentes de Catmull-Rom; m0/m1 = derivadas en los extremos)
const spl=(Q,t,m0,m1)=>{const n=Q.length-1;let i=0;while(i<n-1&&t>Q[i+1][0])i++;const a=Q[i],b=Q[i+1],h=b[0]-a[0],s=cl((t-a[0])/h,0,1),s2=s*s,s3=s2*s;
 const tg=(j,e)=>{const p=Q[Math.max(0,j-1)],q=Q[Math.min(n,j+1)];return(q[e]-p[e])/(q[0]-p[0]);};
 return a.slice(1).map((_,e)=>{const ma=h*(i===0&&m0?m0[e]:tg(i,e+1)),mb=h*(i===n-1&&m1?m1[e]:tg(i+1,e+1));
  return(2*s3-3*s2+1)*a[e+1]+(s3-2*s2+s)*ma+(3*s2-2*s3)*b[e+1]+(s3-s2)*mb;});};
const PL0={o:[0,0,0],d:[1,0,0],n:UP},plane=(y,inc)=>{const a=inc*D;return{o:[0,y,0],d:[Math.cos(a),Math.sin(a),0],n:[-Math.sin(a),Math.cos(a),0]};};
// zapatilla sobre el plano P: la suela toca exacta (h = holgura mínima; sin h se apoya)
const lift=(P,a,f,u,h)=>{let g=1e9;for(const e of K.shoe(a,f,u))g=Math.min(g,K.gap(e,P.o,P.n));return h==null||g<h?V.madd(a,P.n,(h||0)-g):a;};
// pie con pitch° (+ talón arriba): pivota en el talón (pit<0, talón en x) o en los metatarsos (x+.2)
const fpose=(P,x,pit,z)=>{const q=-pit*D,f=V.rot(P.d,ZV,q),u=V.rot(P.n,ZV,q),pv=V.add(P.o,V.mul(P.d,x+(pit<0?0:.2)));pv[2]=z;
 return[lift(P,V.add(pv,V.add(V.mul(f,pit<0?DM.heel:.06-DM.toe),V.mul(u,DM.ankH))),f,u),f,u];};
const arms=(b,W,r)=>{for(const[s,k]of SS){const w=-k*Math.cos(W);b.armFK(s,{flex:r[0]+r[1]*w,abd:r[4]||9,elbow:r[2]+r[3]*w,rot:12});}};
// ═══ MARCHA / CARRERA: el pie de apoyo viaja con el suelo a v m/s (0 = en el sitio). Fase 0 = contacto del pie R ═══
// o:{v,T,du apoyo,hs x del talón al contactar,z,st:[pitch contacto,w1,w2,pitch despegue,pitch medio],sw:[[u,x,y,pitch]] vuelo
//  (tobillo en el plano, x rel. cadera),hy,bob:[amp,fase],tl,yw,ar:[flex,amp,codo,codoAmp],P,f0 (desfase)}
const gait=(c,b,o)=>{const P=o.P||PL0,ph=(c.cyc+(o.f0||0))%1,W=TAU*ph,T=o.T,du=o.du,z=o.z||.08,S=o.st,pm=S[4]||0;
 const pit=w=>w<S[1]?mix(S[0],pm,ss(w/S[1])):w<S[2]?pm:mix(pm,S[3],Math.pow((w-S[2])/(1-S[2]),1.6));
 const st=(w,zz)=>fpose(P,o.hs-o.v*w*du*T,pit(w),zz||0),pc=w=>{const r=V.sub(st(w)[0],P.o);return[V.dot(r,P.d),V.dot(r,P.n),pit(w)];};
 const A=pc(1),B=pc(0),e=1e-3,sc=(1-du)/du,dA=pc(1-e).map((v,i)=>(A[i]-v)/e*sc),dB=pc(e).map((v,i)=>(v-B[i])/e*sc),Q=[[0,...A],...o.sw,[1,...B]];
 const F={};for(const[s,k]of SS){const f=(ph+(k<0?.5:0))%1;if(f<du){F[s]=st(f/du,k*z);continue;}
  const u=(f-du)/(1-du),[x,y,p]=spl(Q,u,dA,dB),q=-p*D,ff=V.rot(P.d,ZV,q),uu=V.rot(P.n,ZV,q),a=V.add(P.o,V.add(V.mul(P.d,x),V.mul(P.n,y)));a[2]=k*z;
  F[s]=[lift(P,a,ff,uu,.012*Math.sin(PI*u)),ff,uu];}
 b.pelvis([0,P.o[1]+o.hy+o.bob[0]*cs(2*ph-o.bob[1]),.012*Math.sin(W-.3)],{tilt:o.tl,yaw:o.yw*Math.cos(W),roll:1.5*Math.sin(W-.3)});
 b.spine(o.sp||0,0,-1.6*o.yw*Math.cos(W));b.head(-o.tl,.8*o.yw*Math.cos(W));
 let dr=0;for(const[s]of SS){const a=F[s][0],h=b.hip(s),L=K.legD(5),d2=(h[0]-a[0])**2+(h[2]-a[2])**2;dr=Math.max(dr,h[1]-a[1]-Math.sqrt(Math.max(0,L*L-d2)));}
 if(dr>0)K.shift(b,[0,-dr,0]);
 for(const[s,k]of SS){b.foot(s,...F[s]);b.leg(s,null,[1,.05,k*.06]);}arms(b,W,o.ar);return F;};
const RUN={v:2.78,T:.72,du:.37,hs:.14,z:.07,st:[-8,.15,.45,52],sw:[[.25,-.38,.4,80],[.45,-.18,.46,62],[.7,.12,.25,15],[.88,.26,.13,-4]],
 hy:.9,bob:[.035,.87],tl:9,yw:6,ar:[8,34,88,10]};
const WALK={v:1.6,T:1,du:.6,hs:.3,z:.08,st:[-17,.17,.5,62],sw:[[.35,-.12,.17,30],[.62,.17,.14,0],[.86,.35,.12,-12]],hy:.92,bob:[.022,.6],tl:4,yw:5,ar:[6,26,40,22]};
// camino al aire libre que avanza con el ciclo (sp divide v·T → bucle sin salto)
const path=(E,c,v,T,sp)=>{const W=.7,s=(c.cyc*v*T)%sp;
 E.poly([[-2.4,0,-W],[2.4,0,-W],[2.4,0,W],[-2.4,0,W]],'#2f3438',{layer:-1,flat:1});
 for(const k of[-1,1])E.poly([[-2.4,0,k*W],[2.4,0,k*W],[2.4,0,k*(W+.35)],[-2.4,0,k*(W+.35)]],'#2a4333',{layer:-1,flat:1});
 for(let x=2.4-s;x>-2.4;x-=sp){E.line([x,.001,-W+.04],[x,.001,W-.04],.012,'#3d4349',{layer:-1,outline:false});
  for(const k of[-1,1])E.line([x+.17,.001,k*(W+.12)],[x+.2,.04,k*(W+.14)],.012,'#4a7a55',{layer:-1,outline:false});}
 E.shadow([0,0,0],.45,.25,.5);};
const OUT={fitBox:[[-.75,-.12,-1.05],[.75,1.82,1.05]]};

GA.def('lib_cardio_treadmill_run',CY('Cardio — correr en caminadora',30,8,RUN.T,{quads:1,glutes:.7,calves:.7,hams:.5},['Cuádriceps','Glúteos','Gemelos'],
 'Pisa bajo la cadera · zancada corta','10 km/h · 1 %',.85,(c,b,E)=>{GA._.walkOnTreadmill(c,b,E,{speed:RUN.v,incline:.57,period:RUN.T});b.ikErr=0;
 gait(c,b,Object.assign({P:plane(.2,.57)},RUN));}));
GA.def('lib_cardio_walk_outdoor',CY('Cardio — caminata al aire libre',30,8,WALK.T,{quads:1,calves:.7,glutes:.6,hams:.5},['Cuádriceps','Gemelos','Glúteos'],
 'Paso ligero · brazos activos','≈ 6 km/h',.7,(c,b,E)=>{gait(c,b,WALK);path(E,c,WALK.v,WALK.T,.4);},OUT));
GA.def('lib_cardio_run_outdoor',CY('Cardio — correr al aire libre',30,8,RUN.T,{quads:1,glutes:.7,calves:.7,hams:.6},['Cuádriceps','Glúteos','Gemelos'],
 'Zancada corta · pisa bajo la cadera','≈ 10 km/h',.85,(c,b,E)=>{gait(c,b,RUN);path(E,c,RUN.v,RUN.T,.5);},OUT));
GA.def('lib_cardio_march',CY('Cardio — marcha en el lugar',30,8,1.1,{quads:1,glutes:.4,calves:.4,hams:.3},['Cuádriceps','Glúteos','Gemelos'],
 'Sube rodillas · braceo activo','≈ 110 pasos/min',.7,(c,b,E)=>{gait(c,b,{v:0,T:1.1,du:.56,hs:-.08,z:.1,st:[14,.2,.7,22],f0:.78,
 sw:[[.25,.17,.25,24],[.5,.33,.32,22],[.75,.17,.24,22]],hy:.94,bob:[.01,.5],tl:2,yw:3,ar:[8,40,80,8]});E.shadow([0,0,0],.4,.3,.5);}));
GA.def('lib_cardio_jog_in_place',CY('Cardio — trote en el lugar',30,8,.72,{calves:1,quads:.7,glutes:.4,hams:.3},['Gemelos','Cuádriceps','Glúteos'],
 'Sobre las puntas · brazos activos','≈ 165 pasos/min',.8,(c,b,E)=>{gait(c,b,{v:0,T:.72,du:.42,hs:-.09,z:.09,st:[24,.35,.6,36,12],f0:.65,
 sw:[[.4,-.12,.3,58],[.75,.02,.2,30]],hy:.935,bob:[.02,.84],tl:4,yw:3,ar:[6,30,85,8]});E.shadow([0,0,0],.4,.3,.5);}));

// ═══ ESCALONES QUE BAJAN (escaladora / escalera): huella j en x=X+(j-2u)·rn, y=Y0+(j-2u)·rs. Cada pie apoya medio ciclo
// en su escalón y vuela al escalón j+2 (que sigue bajando): primero sube (salva la nariz del intermedio) y luego avanza ═══
const climb=(b,u,X,Y0,rs,rn,z)=>{const pos=(j,t)=>[X+(j-2*t)*rn,Y0+(j-2*t)*rs];
 for(const[s,k]of SS){const t=(u+(k<0?.5:0))%1;let P=pos(1,t),pt=0;
  if(t>=.5){const v=(t-.5)/.5,A=pos(1,t),B=pos(3,t);P=[mix(A[0],B[0],MJ(sst(.25,.95,v))),mix(A[1],B[1],MJ(sst(0,.7,v)))+.04*Math.sin(PI*v)];pt=16*Math.sin(PI*Math.min(1,v/.85));}
  K.footBallOn(b,s,[P[0]+.2,P[1],k*z],-k*4,pt);}};
GA.def('lib_cardio_stair_machine',CY('Cardio — escaladora',-18,8,1.3,{quads:1,glutes:1,calves:.6,hams:.4},['Cuádriceps','Glúteos','Gemelos'],
 'Paso completo · tronco erguido','≈ 90 escalones/min',.85,(c,b,E)=>{const u=c.cyc,X=-.1,Y0=.25,st=K.stairClimber(E,{x:X,y0:Y0,phase:(2*u)%1,n:5});
 climb(b,u,X-.035,Y0,.2,.25,.12);b.pelvis([X+.06,Y0+.86+.012*cs(2*u),0],{tilt:10,yaw:4*cs(u)});b.spine(0);b.head(-8);b.scap('both',0,.01);K.legs(b,{up:.3});
 for(const[s,k]of SS)b.arm(s,st.rail(b.sho(s)[0]+.28,s),[-.6,-1,k*.4],st.railAx);},{fitBox:[[-.5,.18,-.42],[.75,2.08,.42]]}));
GA.def('lib_cardio_stairs',CY('Cardio — subir escaleras',-36,12,1.4,{quads:1,glutes:.9,calves:.6,hams:.4},['Cuádriceps','Glúteos','Gemelos'],
 'Apoya todo el pie · empuja arriba','≈ 85 escalones/min',.85,(c,b,E)=>{const u=c.cyc,X=-.1,Y0=.3,rs=.175,rn=.28,Wd=.45,G='#4b525b';
 for(let i=-6;i<13;i++){const x=X+(i-2*u)*rn,y=Y0+(i-2*u)*rs;E.boxA([x+rn/2,y-rs/2,0],[rn,rs,2*Wd],G,{layer:-1});E.line([x+.01,y+.001,-Wd],[x+.01,y+.001,Wd],.012,'#6b737c',{layer:-1,outline:false});
  if(i%2===0){const p=[x+.06,y,-Wd+.05];E.cyl(p,V.add(p,[0,.9+.06*rs/rn,0]),.012,C.chrome,{layer:-1});}}
 const ry=x=>Y0+.9+(x-X)*rs/rn,r0=[X-1.2,ry(X-1.2),-Wd+.05],r1=[X+2.2,ry(X+2.2),-Wd+.05];E.bar(r0,r1,{r:.02,layer:-1});
 E.beam([X-1.2,ry(X-1.2)-1.08,Wd+.02],[X+2.2,ry(X+2.2)-1.08,Wd+.02],.04,'#3a4048',{h:.3});
 climb(b,u,X-.01,Y0,rs,rn,.11);b.pelvis([X+.1,Y0+.86+.012*cs(2*u),0],{tilt:12,yaw:4*cs(u)});b.spine(2);b.head(-10);K.legs(b,{up:.3});
 const hx=b.sho('L')[0]+.3;b.arm('L',[hx,ry(hx)+.035,-Wd+.05],[-.3,-1,-.5],V.norm([rn,rs,0]));
 b.armFK('R',{flex:12-22*cs(u),abd:10,elbow:40+15*cs(u),rot:10});},{floor:false,fitBox:[[-.6,.3,-.45],[.65,2.15,.45]]}));

// ═══ MÁQUINAS DEL KIT ═══
GA.def('lib_cardio_rower',CY('Cardio — máquina de remo',28,10,2.4,{quads:1,glutes:.7,lats:.7,midback:.6,hams:.4},['Cuádriceps','Glúteos','Dorsales'],
 'Piernas → cadera → brazos','25 paladas/min',.8,function(c,b,E){const u=c.cyc,G=K.rowerGeo(),R=K.armD(4),dr=u<.36;
 const L=dr?sst(0,.22,u):1-sst(.55,1,u),T=dr?sst(.06,.3,u):1-sst(.42,.66,u),A=dr?sst(.18,.36,u):1-sst(.36,.52,u);
 const sit=(x,tl)=>{K.seat(b,[x,G.SY,0],{tilt:tl,sp:[mix(6,-2,T)],hd:-tl*.3,sc:[0,mix(.03,-.03,A)],legs:false});};
 const ank=V.add(G.feet.R.heel,V.add(V.mul(G.feet.R.f,DM.heel),V.mul(G.feet.R.u,DM.ankH)));
 const xs=K.memo(this,'xs',()=>({c:K.root(x=>{sit(x,28);return V.dist(b.hip('R'),ank)-K.legD(118);},-1,.3),f:K.root(x=>{sit(x,-18);return V.dist(b.hip('R'),ank)-K.legD(6);},-1.2,.3)}));
 const sx=mix(xs.c,xs.f,L);sit(sx,mix(28,-18,T));b.ikErr=0;
 for(const[s,k]of SS){b.footFlat(s,G.feet[s].heel,0,G.feet[s].u);b.leg(s,null,[.2,1,k*.12]);}
 const sm=V.lerp(b.sho('R'),b.sho('L'),.5),dy=sm[1]-.64,hs=[sm[0]+Math.sqrt(Math.max(.01,R*R-dy*dy-.0002)),.64,0],hf=V.madd(b.tpt(0,-.32,.13),b.tdir(0,0,1),.08);
 const hc=V.lerp(hs,hf,A);hc[1]+=.02*Math.sin(PI*A);
 for(const[s,k]of SS)b.arm(s,V.add(hc,[0,0,k*.17]),[-1,-.25,k*.55],[0,0,1]);
 K.rower(E,{seatX:sx,handle:hc});E.trace('maneral',hc);}));
GA.def('lib_cardio_air_bike',CY('Cardio — bicicleta de aire',30,8,1,{quads:1,glutes:.6,hams:.4,lats:.4,pecs:.3},['Cuádriceps','Glúteos','Dorsales'],
 'Empuja y tira a la vez','60 RPM',.85,(c,b,E)=>{const ab=K.airBike(E,{cyc:c.cyc}),st=V.add(ab.seat,[-.02,.05,0]);E.cyl(ab.seat,st,.02,C.chrome);E.ell(V.add(st,[0,-.03,0]),[[.13,0,0],[0,.035,0],[0,0,.09]],'#3a414b',{layer:-1});K.seat(b,st,{tilt:19,sp:[4],hd:-14,legs:false});
 for(const[s,k]of SS){const P=ab.ped[s],a=22+10*Math.cos(ab.crank[s]-4.9);b.footBall(s,V.madd(P,V.xy(90-a),.02),0,a);b.leg(s,null,[1,.15,k*.03]);b.arm(s,ab.hand[s],[-.5,-.6,k],ab.hax[s]);}}));
GA.def('lib_cardio_ski_erg',{title:'Cardio — ergómetro de esquí',cam:{yaw:-25,pitch:6},fitBox:[[-.7,0,-.4],[.8,2.1,.4]],muscles:{lats:1,triceps:.6,abs:.6,glutes:.4,hams:.3},labels:['Dorsales','Tríceps','Abdomen'],
 note:'≈ 38 tirones/min',init:{p:0,act:.6},timeline:[{p:1,dur:.65,label:'Tira abajo · cadera atrás',act:1},{dur:.08,label:'Brazos a los muslos',act:.9},{p:0,dur:.8,label:'Vuelve arriba estirándote',act:.6},{dur:.1,label:'Arriba',act:.6}],
 build(c,b,E){const p=c.p,SX=.67;
 K.stand(b,{y:.05,fx:-.16,fz:.15,kf:mix(8,40,p),tilt:mix(2,38,p),sp:[mix(-4,10,p)],hd:mix(-10,-20,p),sc:[mix(.03,-.02,p),mix(.01,-.02,p)],x:-.08});
 const H=[],R=K.armD(16),th=mix(135,-18,p)*D,r=R-(R-K.armD(85))*Math.sin(PI*p);
 for(const[s,k]of SS){const h=V.add(b.sho(s),[r*Math.sin(th),-r*Math.cos(th),k*mix(-.03,.08,p)]);b.arm(s,h,[-.3,-.3,k],[0,1,0]);H.push(h);}
 K.skiErg(E,{x:SX,hR:H[0],hL:H[1]});}});
GA.def('lib_cardio_jump_rope',CY('Cardio — saltar la cuerda',28,6,.5,{calves:1,quads:.4,glutes:.3,forearms:.3,frontdelts:.3},['Gemelos','Cuádriceps','Antebrazo'],
 'Saltos bajos · gira con las muñecas','120 saltos/min',.75,(c,b,E)=>{const ph=(c.cyc+.62)%1,q=(ph+.2)%1,fl=q<.4,v=fl?q/.4:(q-.4)/.6,hop=fl?.18*v*(1-v):0,a=fl?0:Math.sin(PI*v);
 for(const[s,k]of SS)K.footBallOn(b,s,[.06,hop,k*.1],-k*4,mix(30,12,a));
 const am=V.lerp(b.j('R','ank'),b.j('L','ank'),.5),d=K.legD(mix(8,26,a));
 b.pelvis([am[0]-.04,am[1]+Math.sqrt(d*d-.0017),0],{tilt:3});b.spine(0);b.head(-2);b.scap('both',-.01,0);K.legs(b,{up:.3});
 const H=[];for(const[s,k]of SS){const h=V.add(b.ppt(k*.3,0,.05),[.03*cs(ph),.03*sn(ph),0]);b.arm(s,h,[-.6,-.3,k*.5],V.norm([.15,-1,k*.4]));H.push(h);}
 K.jumpRope(E,H[0],H[1],ph,{ax:[V.norm([.15,-1,.4]),V.norm([.15,-1,-.4])],R:(H[0][1]+H[1][1])/2-.0954+.15*(1-cs(ph))});E.shadow([.05,0,0],.3,.25,.5-4.4*hop);}));

// ═══ BICIS: bielas + pedales con el pie (bola sobre el eje, ankling an = a0 + aA·cos(a − ap)); la pierna R (cerca) en capa 2 ═══
const pedals=(b,E,BB,th,o)=>{const R=o.R||.17,z=o.z||.12,P={};
 for(const[s,k]of SS){const a=th+(k<0?PI:0),p=[BB[0]+R*Math.sin(a),BB[1]+R*Math.cos(a),k*z],an=o.a0+o.aA*Math.cos(a-o.ap),g={grp:'sh'+s,layer:k>0?2:0};
  b.footBall(s,V.madd(p,V.xy(90-an),.02),0,an);b.leg(s,null,[o.pl[0],o.pl[1],k*o.pl[2]]);P[s]=p;
  E.cyl([BB[0],BB[1],k*.045],[BB[0],BB[1],k*.075],.024,C.frameD,g);E.beam([BB[0],BB[1],k*.062],[p[0],p[1],k*.062],.024,C.frameD,Object.assign({up:ZV},g));
  E.cyl([p[0],p[1],k*.055],[p[0],p[1],k*.08],.011,C.chrome,g);E.boxA(p,[.11,.024,.09],'#2a2f36',Object.assign({pitch:-an},g));}
 E.sph(b.hip('R'),.001,C.frameD,{grp:'thR',layer:2,outline:false,alpha:0});E.trace('pedal',P.R);return P;};
const legsBike=(b,E,BB,c,o)=>pedals(b,E,BB,c.cyc*TAU+PI/2,o);
const casco=(b,E)=>{const H=b.hf,m=V.mul;E.ell(b.hpt(0,.04,-.012),[m(H.R,.098),m(H.U,.082),m(H.F,.128)],C.accent,{bias:-.2});
 for(const r of[-.035,.035])E.line(b.hpt(r,.115,.08),b.hpt(r,.105,-.11),.008,'#1f2a28',{bias:-.25,outline:false});};
GA.def('lib_cardio_spinning',CY('Cardio — spinning',30,10,.67,{quads:1,glutes:.7,hams:.5,calves:.4},['Cuádriceps','Glúteos','Isquiotibiales'],
 'Rodillas alineadas con los pies','90 RPM',.85,(c,b,E)=>{const BB=[0,.3,0],FR=C.frame,FD=C.frameD,FW=[.46,.38,0],q=-c.cyc*TAU*3;
 K.seat(b,[-.22,1.03,0],{tilt:36,sp:[8],hd:-30,sc:[0,.02],legs:false});legsBike(b,E,BB,c,{a0:22,aA:12,ap:5.06,pl:[1,.15,.02]});
 for(const[s,k]of SS)b.arm(s,[.47,1.13,k*.19],[-.2,-.7,k],[0,0,1]);
 for(const x of[-.6,.7]){E.beam([x,.035,-.27],[x,.035,.27],.06,FD,{layer:-1});for(const k of[-1,1])E.boxA([x,.012,k*.25],[.07,.024,.05],C.rubber,{layer:-1});}
 E.beam([-.6,.06,0],[.02,.36,0],.07,FR,{bias:-.05});E.beam([.7,.06,0],[.36,.62,0],.07,FR);E.beam([.02,.33,0],[.36,.62,0],.075,FR);
 E.beam([.02,.3,0],[-.17,.86,0],.075,FR,{bias:-.05});E.cyl([-.17,.86,0],[-.2,1,0],.018,C.chrome);E.cyl([.36,.6,0],[.42,1.02,0],.03,FR);E.cyl([.42,1.02,0],[.45,1.11,0],.02,C.chrome);
 E.cyl([.39,.92,0],[.39,.98,0],.022,'#b83a2e');E.ell([-.29,1.01,0],[[.09,0,0],[0,.025,0],[0,0,.085]],'#3a414b',{layer:-1});E.ell([-.15,1.01,0],[[.1,0,0],[0,.02,0],[0,0,.035]],'#3a414b',{layer:-1});
 E.disc(FW,ZV,.23,.05,'#8f99a4',{hub:.2});E.line(V.add(FW,[.19*Math.cos(q),.19*Math.sin(q),.027]),V.add(FW,[.19*Math.cos(q-.6),.19*Math.sin(q-.6),.027]),.018,C.accent,{outline:false});
 E.beam([.03,.31,.05],[FW[0],FW[1],.05],.02,'#323943',{h:.12,layer:1,round:6});
 E.bar([.45,1.12,-.22],[.45,1.12,.22]);for(const k of[-1,1]){E.cyl([.45,1.12,k*.22],[.62,1.18,k*.17],.016,C.chrome);E.cyl([.45,1.12,k*.13],[.45,1.12,k*.22],.02,C.rubber);}
 E.shadow([.05,0,0],.75,.35,.55);}));
GA.def('lib_cardio_recumbent',CY('Cardio — bicicleta reclinada',30,10,.75,{quads:1,glutes:.5,hams:.4,calves:.3},['Cuádriceps','Glúteos','Isquiotibiales'],
 'Espalda apoyada · piernas casi estiradas','80 RPM',.8,(c,b,E)=>{const X=.345,BB=[X,.5,0],FR=C.frame,FD=C.frameD,nb=V.xy(24);
 K.seat(b,[-.42,.56,0],{tilt:-24,sp:[2],hd:20,legs:false});legsBike(b,E,BB,c,{a0:-62,aA:10,ap:4.71,pl:[.2,1,.06]});
 const g=K.low(b,['tho','lum','shd'],[-1,0,0],nb),o=V.madd([-1,0,0],nb,g-.035);
 E.pad(V.madd(o,V.xy(114),.34),V.madd(o,V.xy(114),1.0),.42,.07,C.pad,{up:nb,layer:-1});E.beam([-.44,.5,0],V.madd(V.madd(o,V.xy(114),.6),nb,-.06),.05,FR,{layer:-1});
 for(const[s,k]of SS)b.arm(s,[-.28,.66,k*.29],[-.3,-1,k*.3],[1,0,0]);
 E.pad([-.58,.53,0],[-.2,.53,0],.42,.06,C.pad,{up:UP,layer:-1});E.beam([-.42,.04,0],[-.44,.5,0],.07,FR,{layer:-1});
 E.beam([-.95,.04,0],[.7,.04,0],.07,FD,{layer:-1});for(const x of[-.92,.67]){E.beam([x,.035,-.3],[x,.035,.3],.06,FD,{layer:-1});}
 for(const k of[-1,1]){E.cyl([-.38,.66,k*.29],[-.18,.66,k*.29],.019,C.rubber);E.beam([-.38,.66,k*.29],[-.42,.5,k*.2],.03,FR);}
 E.ell([X+.12,.45,0],[[.26,0,0],[0,.32,0],[0,0,.085]],FR);E.beam([X+.18,.72,0],[X+.04,1.08,0],.05,FR);
 E.boxA([X+.02,1.12,0],[.05,.14,.3],FD,{pitch:28});E.boxA([X,1.13,0],[.005,.1,.22],C.screen,{pitch:28,outline:false});
 E.shadow([-.1,0,0],.95,.4,.55);}));
// rueda de carretera (anillos + radios que giran) en un grupo
const wheel=(E,c,a,g)=>{const n=20,R=.335,o={grp:g,outline:false};
 for(let i=0;i<n;i++){const q0=i*TAU/n,q1=q0+TAU/n,P=(q,r)=>V.add(c,[r*Math.cos(q),r*Math.sin(q),0]);E.line(P(q0,R-.014),P(q1,R-.014),.028,'#1b1e22',o);E.line(P(q0,R-.035),P(q1,R-.035),.012,'#9aa3ad',o);}
 for(let i=0;i<8;i++){const q=a+i*TAU/8;E.line(c,V.add(c,[.3*Math.cos(q),.3*Math.sin(q),0]),.004,'#c4ccd4',o);}E.cyl(V.add(c,[0,0,-.04]),V.add(c,[0,0,.04]),.018,C.frameD,{grp:g});};
GA.def('lib_cardio_cycling_outdoor',CY('Cardio — ciclismo al aire libre',30,8,.67,{quads:1,glutes:.6,hams:.4,calves:.4},['Cuádriceps','Glúteos','Isquiotibiales'],
 'Cadencia fluida · siempre con casco','90 RPM · ≈ 22 km/h',.85,(c,b,E)=>{const BB=[0,.27,0],RA=[-.41,.335,0],FA=[.6,.335,0],FR='#2f6f73',a=-c.cyc*TAU*2;
 path(E,c,6.3,.67,.7035);wheel(E,RA,a,'wr');wheel(E,FA,a,'wf');
 K.seat(b,[-.21,.98,0],{tilt:50,sp:[12],hd:-48,sc:[0,.03],legs:false});legsBike(b,E,BB,c,{a0:24,aA:12,ap:5.06,pl:[1,.15,.02],z:.11});
 for(const[s,k]of SS)b.arm(s,[.63,.935,k*.2],[-.1,-.7,k*.7],[1,.2,0]);casco(b,E);
 const S=[-.16,.8,0],H1=[.47,.86,0],H0=[.53,.66,0],tb=(p,q,w)=>E.beam(p,q,w||.035,FR);
 tb(BB,S,.04);tb(S,H1);tb(BB,H0,.045);tb(H0,H1,.045);for(const k of[-1,1]){tb([BB[0],BB[1],k*.03],[RA[0],RA[1],k*.05],.022);tb([S[0],S[1],k*.02],[RA[0],RA[1],k*.05],.02);tb([H0[0],H0[1],k*.03],[FA[0],FA[1],k*.05],.025);}
 E.cyl(S,[-.21,.95,0],.014,C.chrome);E.ell([-.24,.975,0],[[.13,0,0],[0,.02,0],[0,0,.07]],'#1c2024',{layer:-1});
 E.cyl(H1,[.57,.9,0],.016,C.frameD);E.bar([.57,.9,-.2],[.57,.9,.2],{r:.012});
 for(const k of[-1,1]){const z=k*.2;E.cyl([.57,.9,z],[.66,.93,z],.016,'#1c2024');E.cyl([.66,.93,z],[.69,.82,z],.012,'#1c2024');E.cyl([.69,.82,z],[.62,.76,z],.012,'#1c2024');}
 E.disc([BB[0],BB[1],.05],ZV,.1,.01,'#5a636e',{hub:.5});E.line([.02,.37,.055],[RA[0],RA[1]+.04,.055],.006,'#2a2e33',{outline:false});
 E.line([.02,.17,.055],[RA[0],RA[1]-.04,.055],.006,'#2a2e33',{outline:false});},{fitBox:[[-.8,-.12,-1.05],[1,1.65,1.05]]}));

// ═══ STEP AERÓBICO: R/L = nivel de cada pie (0 suelo · 1 step), p = cuerpo sobre el step (0 · .5 · 1) ═══
const stepFoot=(b,s,lv,T,mov)=>{const k=K.sd(s),ey=sst(0,.6,lv),x=mix(-.47,-.05,sst(.3,1,lv)),y=T*ey+(mov?.05*Math.sin(PI*lv):0);
 K.footBallOn(b,s,[x+.2,y,k*.13],-k*6,mov?18*Math.sin(PI*lv):0);};
GA.def('lib_cardio_step',{title:'Cardio — step aeróbico',cam:{yaw:52,pitch:14},muscles:{quads:1,glutes:.7,calves:.5,hams:.3},labels:['Cuádriceps','Glúteos','Gemelos'],note:'≈ 125 bpm',
 init:{R:0,L:0,p:0,act:.6},timeline:[['R',.5,'Sube con la derecha',1],['L',1,'Sube la izquierda',1],['R',.5,'Baja la derecha',.7],['L',0,'Baja la izquierda',.7],
  ['L',.5,'Ahora guía la izquierda',1],['R',1,'Sube la derecha',1],['L',.5,'Baja la izquierda',.7],['R',0,'Baja la derecha',.7]].map(([s,p,label,act],i)=>({[s]:i%4<2?1:0,p,dur:.48,label,act})),
 build(c,b,E){const T=.2,bx=K.box(E,[.12,0,0],[.4,T,1.05],{kind:'step'}),mv=c.step.label.includes('derecha')?'R':'L';
 for(const[s]of SS)stepFoot(b,s,c[s],T,s===mv);
 const[hx,hy,tl]=spl([[0,-.4,.935,4],[.5,-.2,.9,12],[1,.0,.935+T,4]],c.p);b.pelvis([hx,hy,.03*(c.R-c.L)],{tilt:tl,roll:3*(c.R-c.L)});b.spine(0);b.head(-tl-4);
 let dr=0;for(const[s]of SS){const a=b.j(s,'ank'),h=b.hip(s),L=K.legD(5),d2=(h[0]-a[0])**2+(h[2]-a[2])**2;dr=Math.max(dr,h[1]-a[1]-Math.sqrt(Math.max(0,L*L-d2)));}
 if(dr>0)K.shift(b,[0,-dr,0]);K.legs(b,{up:.2,out:.05});
 for(const[s,k]of SS){const w=(s==='R'?c.L-c.R:c.R-c.L);b.armFK(s,{flex:10+30*w,abd:10,elbow:70+10*w,rot:10});}
 E.shadow([-.15,0,0],.55,.4,.5);}});

// ═══ BOXEO (guardia ortodoxa: izquierda delante). j = jab, p = cross (cadera y pie de atrás rotan); saco opcional ═══
const box=(c,b,E,bag)=>{const j=c.j,p=c.p,bo=Math.pow(sn(c.t/.8),2),hl=mix(14,24,bo);
 K.footOn(b,'L',[.2+.03*j,0,-.1],V.yaw(-18),UP);K.footBallOn(b,'R',[-.08,0,.2],mix(-42,-8,p),hl+8*p);
 const kf=mix(26,14,bo),ry=mix(-32,10,p)+6*j,hx=-.02+.06*j+.1*p;
 const pose=y=>{b.pelvis([hx,y,.04],{yaw:ry,tilt:6});b.spine(4,0,mix(-6,10,p)-4*j);b.head(-6,-ry*.8-mix(-6,10,p)*.5);b.scap('L',.03-.02*j,.02+.04*j);b.scap('R',.03,.02+.04*p);};
 pose(1);let y=9;for(const[s,k]of SS){const a=b.j(s,'ank'),h=b.hip(s),L=K.legD(kf);y=Math.min(y,a[1]+Math.sqrt(L*L-(h[0]-a[0])**2-(h[2]-a[2])**2));}pose(y);K.legs(b,{up:.25,out:.1});
 const T=[bag?bag-.075:.95,b.sho('R')[1]+.02,.03],R5=K.armD(4),G={};
 for(const[s,k]of SS){const q=s==='L'?j:p,g0=b.hpt(k*.075,-.07,s==='L'?.24:.17),sh=b.sho(s),d=V.sub(T,sh),L=V.len(d),hit=V.madd(sh,d,Math.min(1,R5/L)),e=q;
  const t=V.lerp(g0,hit,e);b.arm(s,t,V.lerp([.1,-1,k*.4],[0,-.3,k],e),V.lerp([0,1,0],[0,0,1],e));G[s]=b.j(s,'grip');}
 return G;};
const BX=[{j:1,dur:.16,label:'Jab · suelta el aire',act:1},{j:0,dur:.2,label:'Vuelve a la guardia',act:.7},{p:1,dur:.2,label:'Cross · rota cadera y pie',act:1},
 {p:0,dur:.26,label:'Guardia alta',act:.7},{dur:.78,label:'Muévete sobre las puntas',act:.55}];
GA.def('lib_cardio_shadow_boxing',{title:'Cardio — boxeo de sombra',cam:{yaw:26,pitch:6},muscles:{frontdelts:1,obliques:.5,calves:.5,triceps:.4,abs:.3},labels:['Deltoides anterior','Oblicuos'],
 note:'Combos 1-2',init:{j:0,p:0,act:.55},timeline:BX,build(c,b,E){box(c,b,E);E.shadow([0,0,0],.45,.35,.5);}});
GA.def('lib_cardio_boxing_bag',{title:'Cardio — saco de boxeo',cam:{yaw:24,pitch:6},fitBox:[[-.55,0,-.4],[1.05,1.9,.4]],muscles:{frontdelts:1,obliques:.6,triceps:.5,calves:.4,abs:.4},labels:['Deltoides anterior','Oblicuos'],
 note:'Combos 1-2',init:{j:0,p:0,act:.55},timeline:BX,build(c,b,E){const t=c.t%1.6,sw=.03*Math.max(sst(.15,.26,t)*(1-sst(.26,.9,t)),sst(.55,.66,t)*(1-sst(.66,1.4,t))),X=.92+.17+sw;
 const G=box(c,b,E,X-.17);E.cyl([X,.58,0],[X,1.75,0],.17,'#7a2f2a',{rim:1});E.cyl([X,1.7,0],[X,1.78,0],.172,'#2a2e33');E.line([X,1.78,0],[X-sw*.3,2.4,0],.01,C.chrome);
 for(const[s]of SS){const w=b.j(s,'wri'),f=V.norm(V.sub(b.j(s,'grip'),w));E.ell(V.madd(G[s],f,.012),[V.mul(f,.075),V.mul(V.norm(V.perp(UP,f)),.062),[0,0,.06]],'#c23b33',{bias:-.06});}
 E.shadow([.2,0,0],.65,.35,.5);}});

// ═══ HIIT: escaladores (plancha alta, rodilla al pecho alterna) ═══
GA.def('lib_cardio_hiit',CY('Cardio — HIIT con peso corporal',28,14,.7,{quads:1,glutes:.7,calves:.5,pecs:.4,abs:.4},['Cuádriceps','Glúteos','Pectoral'],
 'Escaladores · rodilla al pecho','40 s a tope · 20 s pausa',.9,function(c,b,E){const pl=K.plank(b,E,{xT:-.95,p:0,zF:.1,k:K.memo(this,'pl',()=>({}))});
 for(const[s,k]of SS){const d=.5-.5*cs(c.cyc+(k<0?.5:0)),e=MJ(d),A=[-1.055,0,k*.1],B=[b.hip(s)[0]-.09,0,k*.12],P=V.lerp(A,B,e);P[1]=.07*Math.sin(PI*d);
  K.footBallOn(b,s,[P[0]+.08,P[1],P[2]],0,mix(64,52,e));b.leg(s,null,V.lerp([.3,-1,k*.2],[1,-.3,k*.15],e));}
 E.shadow([-.2,0,0],.9,.35,.5);}));

// ═══ BAILE: paso y toque lateral con palmadas (z = centro del cuerpo, a = palmada) ═══
GA.def('lib_cardio_dance',{title:'Cardio — baile',cam:{yaw:40,pitch:8},muscles:{quads:1,glutes:.6,calves:.5,abs:.3,obliques:.3},labels:['Cuádriceps','Glúteos','Gemelos'],note:'≈ 128 bpm',
 init:{R:.13,L:-.13,z:0,tR:1,tL:0,a:1,act:.7},timeline:[{R:.43,z:.15,tR:0,a:0,dur:.47,label:'Paso a la derecha',act:.9},{L:.17,z:.3,tL:1,a:1,dur:.47,label:'Junta y palmada',act:.7},
  {L:-.13,z:.15,tL:0,a:0,dur:.47,label:'Paso a la izquierda',act:.9},{R:.13,z:0,tR:1,a:1,dur:.47,label:'Junta y palmada',act:.7}],
 build(c,b,E){const st=c.step,bo=Math.sin(PI*c.u),w=Math.sin(PI*(c.z/.3-.5));
 for(const[s,k]of SS){const h=st.to[s]!==st.from[s]?.05*bo:0;K.footBallOn(b,s,[.08,h,c[s]],-k*8,28*c['t'+s]+300*h);}
 b.pelvis([-.05,1,c.z],{yaw:8*w,roll:-5*w});b.spine(2,5*w,-8*w);b.head(-4,4*w);
 let y=9;for(const[s]of SS){const a=b.j(s,'ank'),h=b.hip(s),L=K.legD(14+14*bo);y=Math.min(y,a[1]+Math.sqrt(L*L-(h[0]-a[0])**2-(h[2]-a[2])**2));}
 K.shift(b,[0,y-1,0]);K.legs(b,{up:.25,out:.15});
 const a=c.a,cp=b.tpt(0,-.05,.36);for(const[s,k]of SS){const o=V.add(b.sho(s),[.12,.22,k*.45]),t=V.lerp(o,V.add(cp,[0,0,k*.04]),a);b.arm(s,t,V.lerp([-.2,-1,k*.3],[0,-.6,k],a),V.lerp([1,0,0],[0,1,0],a));}
 E.shadow([0,0,c.z],.45,.4,.5);}});

// ═══ NATACIÓN (crol): cuerpo boca abajo con rolido, brazada alterna (fase 0 = entrada R), patada de 6 tiempos ═══
const SWK=[[-.2,.5,-.05,.04],[0,.2,.62,.04],[.15,.22,.5,.3],[.35,.12,.06,.36],[.55,.2,-.4,.16],[.65,.25,-.46,-.06],[.8,.5,-.05,.04],[1,.2,.62,.04],[1.15,.22,.5,.3]];
GA.def('lib_cardio_swim',CY('Cardio — natación',22,24,1.5,{lats:1,frontdelts:.7,triceps:.5,abs:.5,glutes:.4,quads:.4},['Dorsales','Deltoides anterior'],
 'Crol · exhala bajo el agua','≈ 40 brazadas/min',.8,(c,b,E)=>{const u=c.cyc,ro=38*Math.sin(TAU*(u-.15)),Y=-.12;
 K.frame(b,[-.45,Y-.02,0],[1,.03,0],V.rot([0,-1,0],[1,0,0],ro*D));b.spine(0,0,-ro*.25);b.head(-25,ro*.4+48*Math.pow(Math.max(0,Math.sin(TAU*(u-.6))),3),0);b.scap('both',.02,.02);
 for(const[s,k]of SS){const q=(u+(k<0?.5:0))%1,[r,uu,f]=spl(SWK,q),sh=b.sho(s),g=b.tpt(k*r,uu,f),d=V.dist(sh,g),R=K.armD(8);
  b.arm(s,d>R?V.lerp(sh,g,R/d):g,V.lerp(b.tdir(k,-.3,-.5),b.tdir(k*.6,.35,-.9),sst(.5,.6,q)*(1-sst(.9,1,q))),b.tdir(0,0,1));
  b.legFK(s,{flex:7*sn(3*u+(k<0?.5:0)),knee:12+12*Math.max(0,sn(3*u+(k<0?.5:0)+.2)),abd:3});b.footRelax(s,62);}
 const S=(u*1.2*1.5)%.6,Wl='#1d5f7d';E.poly([[-1.6,-.9,-1],[1.6,-.9,-1],[1.6,-.9,1],[-1.6,-.9,1]],'#2b5d73',{layer:-2,flat:1});
 for(let x=1.6-S;x>-1.6;x-=.6)E.line([x,-.899,-.06],[x-.3,-.899,-.06],.06,'#1b3442',{layer:-2,outline:false});
 for(const z of[-.9,.9])for(let i=0,x=1.6-S;x>-1.6;i++,x-=.15)E.sph([x,0,z],.035,i%2?'#d84a3a':'#e8e3d8',{layer:-1});
 E.poly([[-1.6,0,-1],[1.6,0,-1],[1.6,0,1],[-1.6,0,1]],'#2f8fb5',{layer:3,flat:1,alpha:.42,outline:false});
 for(const[s]of SS){const g=b.j(s,'grip');if(g[1]>-.12&&g[1]<.02)E.ell([g[0],.005,g[2]],[[.09,0,0],[0,.004,0],[0,0,.06]],'#dff3fb',{layer:4,alpha:.55,outline:false});}},
 {floor:false,fitBox:[[-1.3,-.45,-.55],[1.05,.35,.55]],style:{shoe:C.skin,sole:C.skin,shirt:'#1f3f5a'}}));

})(window.GymAnim);
