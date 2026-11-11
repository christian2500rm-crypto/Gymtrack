/* ex/n_rows_free.js */
/* Remos libres y encogimientos: barra (inclinado, Pendlay, supino, en T, Meadows), Smith, mancuernas, renegado, kettlebell, mochila */
(function(GA){
const K=GA._.kit,V=GA._.V,C=GA._.COL,SS=K.SS,mix=K.mix,sst=K.sst,D=K.D,Z=[0,0,1],X=[1,0,0];
const front=(b,y,z0,zr)=>{let x=-9;for(const[s]of SS){const S=b.S[s];for(const[a,z,r0,r1]of[[S.hip,S.kne,.09,.06],[S.kne,S.ank,.058,.04]])
  if(y<=a[1]&&y>=z[1]){const t=(a[1]-y)/(a[1]-z[1]),d=V.norm(V.sub(z,a)),r=mix(r0,r1,t);
    if(zr==null||Math.abs(mix(a[2],z[2],t)-z0)<zr+r)x=Math.max(x,mix(a[0],z[0],t)+r*Math.sqrt(1+(d[0]/Math.min(-.3,d[1]))**2));}}return x;};
const hang=(b,s,z,cl,zr)=>{const S=b.sho(s),R=K.armD(3),dz=z-S[2];let x=S[0],y=S[1]-R;
  for(let i=0;i<3;i++){x=Math.max(S[0],cl==null?-9:front(b,y,z,zr)+cl);y=S[1]-Math.sqrt(Math.max(.01,R*R-dz*dz-(x-S[0])**2));}return[x,y,z];};
const TL=(a,la,b2,lb,c2,lc,d,ld)=>[{p:1,dur:a,label:la,act:1},{dur:b2,label:lb,act:1},{p:0,dur:c2,label:lc,act:.75},{dur:d,label:ld,act:.5}];
const prot=q=>mix(.025,-.035,sst(0,.9,q));
const ROW=(ctx,b,p,o)=>{let G;
  const pose=(q,x,kf)=>{G={};const arms=b=>{b.scap('both',0,.025);const H={R:hang(b,'R',o.w,o.cl,o.zr),L:hang(b,'L',-o.w,o.cl,o.zr)};b.scap('both',0,prot(q));
      for(const[s,k]of SS){const g=V.lerp(H[s],b.tpt(k*(o.tw==null?o.w:o.tw),o.u,o.f),q);
        if(o.cl!=null)g[0]=Math.max(g[0],front(b,g[1],g[2],o.zr)+o.cl);G[s]=g;b.arm(s,g,o.el(k,b),o.ax||Z);}};
    K.stand(b,Object.assign({},o,{kf,x,balance:x==null,arms,xm:()=>G.R?[[G.R,o.M/2],[G.L,o.M/2]]:null}));return G;};
  const kf=o.floor==null?o.kf:K.memo(ctx,'kf',()=>K.root(k=>pose(0,null,k).R[1]-o.floor,8,95));
  const hx=K.memo(ctx,'hx',()=>{pose(0,null,kf);return b.pf.o[0];});b.ikErr=0;return pose(p,hx,kf);};
const mid=G=>V.lerp(G.R,G.L,.5);
const inT=(b,pts,m)=>{const E=K.ells(b);return['tho','lum','shd','head','face'].some(k=>{const[c,ax]=E[k];return pts.some(q=>ax.reduce((s,a)=>{const l=V.len(a);return s+(V.dot(V.sub(q,c),a)/l/(l+m))**2;},0)<1);});};
const sh=(E,x)=>E.shadow([x||.05,0,0],.6,.4,.55);
const hip=a=>({tilt:a,sp:[-2],hd:-a*.38});
const BB=(E,g,pl)=>{K.barbell(E,g,Z,{plates:pl||[.225]});E.trace('barra',V.add(g,[0,0,.3]));};
const fax=(b,s,ax)=>V.norm(V.perp(ax||X,V.norm(V.sub(b.S[s].grip,b.S[s].elb))));
const DBS=(E,b,G,o)=>{for(const[s]of SS)E.dumbbell(G[s],fax(b,s),o||{r:.055});E.trace('mancuerna',G.R);};
const elPro=(k,b)=>b.tdir(k*.6,-.15,-1),elSup=(k,b)=>b.tdir(k*.2,-.45,-1),elDb=(k,b)=>b.tdir(k*.25,-.35,-1);
const smith=(E,x,y)=>{for(const k of[-1,1]){E.beam([x,0,k*.62],[x,2.1,k*.62],.055,C.frame);E.beam([x-.55,.035,k*.62],[x+.55,.035,k*.62],.07,C.frameD,{layer:-1});
    E.boxA([x,y,k*.62],[.1,.13,.1],C.frameD);E.cyl([x,y,k*.67],[x,y,k*.7],.04,C.chrome);E.plate([x,y,k*.735],Z,.225);}
  E.beam([x,2.1,-.65],[x,2.1,.65],.07,C.frame);E.bar([x,y,-1.02],[x,y,1.02],{r:.0145});E.trace('barra',[x,y,.4]);};
const CR={yaw:-38,pitch:14},CF={yaw:38,pitch:12};
const LA='Dorsales',RO='Romboides',DP='Deltoides post.',BI='Bíceps',TR='Trapecio',AN='Antebrazo';

GA.def('lib_bb_row',{title:'Remo con barra',cam:CR,
  muscles:{lats:1,midback:1,reardelts:.45,biceps:.45,lowback:.4},labels:[LA,RO,DP],init:{p:0,act:.5},
  timeline:TL(1.1,'Tira hacia el ombligo',.7,'Junta los omóplatos',2.2,'Baja controlando',.4,'Abajo · espalda neutra'),
  build(c,b,E){const G=ROW(this,b,c.p,Object.assign(hip(46),{fz:.13,toe:8,kf:22,w:.25,u:-.36,f:.15,cl:.03,el:elPro,M:.8}));BB(E,mid(G));sh(E);}
});

GA.def('lib_pendlay_row',{title:'Remo Pendlay con barra',cam:{yaw:-40,pitch:12},
  muscles:{midback:1,lats:.9,reardelts:.5,lowback:.5,biceps:.4},labels:[RO,LA,DP],init:{p:0,act:.45},
  timeline:[{p:1,dur:.65,label:'Tirón explosivo al pecho',act:1},{dur:.35,label:'Codos arriba · aprieta',act:1},
    {p:0,dur:1.3,label:'Baja controlando',act:.75},{dur:.8,label:'Apoya en el suelo · resetea',act:.45}],
  build(c,b,E){const G=ROW(this,b,c.p,Object.assign(hip(86),{fz:.14,toe:8,floor:.225,bx:.01,w:.27,u:-.27,f:.15,cl:.03,el:elPro,M:.8}));BB(E,mid(G));sh(E);}
});

GA.def('lib_yates_row',{title:'Remo supino con barra',cam:{yaw:-42,pitch:10},
  muscles:{lats:1,midback:.8,biceps:.6,lowback:.3},labels:[LA,RO,BI],init:{p:0,act:.5},
  timeline:TL(1.1,'Al ombligo · codos pegados',.7,'Aprieta los dorsales',2.2,'Baja controlando',.4,'Abajo · brazos largos'),
  build(c,b,E){const G=ROW(this,b,c.p,Object.assign(hip(33),{fz:.13,toe:8,kf:18,w:.2,u:-.38,f:.15,cl:.02,el:elSup,M:.8}));BB(E,mid(G));sh(E);}
});

GA.def('lib_row_bent_db',{title:'Remo inclinado con mancuernas',cam:CR,
  muscles:{lats:1,midback:1,reardelts:.4,biceps:.4,lowback:.4},labels:[LA,RO,DP],init:{p:0,act:.5},
  timeline:TL(1.1,'Tira hacia la cadera',.7,'Junta las escápulas',2.2,'Baja controlando',.4,'Abajo · estira'),
  build(c,b,E){const G=ROW(this,b,c.p,Object.assign(hip(46),{fz:.13,toe:8,kf:22,w:.21,tw:.24,u:-.42,f:.04,cl:.145,zr:.055,el:elDb,ax:X,M:.53}));DBS(E,b,G);sh(E);}
});

const bag=(E,b,h)=>{const ok=a=>{const dn=[Math.sin(a),-Math.cos(a),0],fw=[Math.cos(a),Math.sin(a),0];
    for(const d of[.08,.2,.32,.46]){const q=V.madd(V.madd(h,dn,d),fw,-.105);if(q[0]<front(b,q[1],0,.15)+.006)return 0;}return 1;};
  let a=0;while(a<1.2&&!ok(a))a+=.05;if(a>0){let lo=a-.05;for(let i=0;i<6;i++){const m=(lo+a)/2;if(ok(m))a=m;else lo=m;}}const dn=[Math.sin(a),-Math.cos(a),0],fw=[Math.cos(a),Math.sin(a),0],c=V.madd(h,dn,.26),t=V.madd(h,dn,.05),col='#3c5a4e';
  E.box(c,[V.mul(fw,.085),V.mul(dn,.21),[0,0,.15]],col,{round:7});E.box(V.add(V.madd(c,dn,.08),V.mul(fw,.1)),[V.mul(fw,.03),V.mul(dn,.1),[0,0,.11]],'#33493f',{round:5});
  for(const k of[-1,1]){E.cap(V.add(h,[0,0,k*.045]),V.add(t,[0,0,k*.05]),.008,.008,K.COL.strap);
    E.cap(V.add(V.madd(t,fw,-.09),[0,0,k*.09]),V.add(V.madd(V.madd(t,dn,.36),fw,-.1),[0,0,k*.1]),.012,.012,K.COL.strap);}
  E.cap(V.add(h,[0,0,-.05]),V.add(h,[0,0,.05]),.009,.009,K.COL.strap);E.trace('mochila',h);};
GA.def('lib_backpack_row',{title:'Remo con mochila',cam:CF,
  muscles:{lats:1,midback:.8,biceps:.5,reardelts:.4,lowback:.3},labels:[LA,RO,BI],init:{p:0,act:.5},
  timeline:TL(1.1,'Tira hacia el ombligo',.7,'Aprieta la espalda',2.2,'Baja controlando',.4,'Abajo · espalda recta'),
  build(c,b,E){const G=ROW(this,b,c.p,Object.assign(hip(46),{fz:.14,toe:8,kf:22,w:.065,u:-.37,f:.15,cl:.03,el:(k,b)=>b.tdir(k*.45,-.25,-1),M:.13}));bag(E,b,mid(G));sh(E);}
});

GA.def('lib_row_smith',{title:'Remo en Smith',cam:{yaw:-62,pitch:14},fitBox:[[-.5,0,-.8],[.55,1.5,.8]],
  muscles:{midback:1,lats:.8,reardelts:.5,biceps:.5,lowback:.3},labels:[RO,LA,DP],init:{p:0,act:.5},
  timeline:TL(1.1,'Tira hacia el ombligo',.7,'Aprieta los omóplatos',2.2,'Baja lento',.4,'Abajo · espalda recta'),
  build(c,b,E){const p=c.p,BX=.1,W=.25,R=K.armD(3),o=Object.assign(hip(52),{fz:.13,toe:8,kf:24}),T=()=>b.tpt(0,-.36,.15);
    const pose=(x,q)=>K.stand(b,Object.assign({},o,{x,sc:[0,prot(q)]}));
    const hx=K.memo(this,'hx',()=>K.root(x=>{pose(x,1);return T()[0]-BX;},-.7,.3));
    pose(hx,1);const y1=T()[1];pose(hx,0);const S=b.sho('R'),y0=S[1]-Math.sqrt(R*R-(BX-S[0])**2-(W-S[2])**2),y=mix(y0,y1,p);
    pose(hx,p);for(const[s,k]of SS)b.arm(s,[BX,y,k*W],elPro(k,b),Z);smith(E,BX,y);sh(E);}
});

GA.def('lib_tbar_row_landmine',{title:'Remo en T con barra',cam:{yaw:30,pitch:14},fitBox:[[-.45,0,-.45],[.62,1.4,.45]],
  muscles:{midback:1,lats:.9,biceps:.5,reardelts:.4,lowback:.4},labels:[RO,LA,BI],init:{p:0,act:.5},
  timeline:TL(1.1,'Tira hacia el pecho bajo',.7,'Aprieta la espalda',2.2,'Baja controlando',.4,'Abajo · estira'),
  build(c,b,E){const p=c.p,LA_=1.49,PY=.045,DR=.07,o=Object.assign(hip(60),{fz:.2,toe:14,kf:28});
    const hx=K.memo(this,'hx',()=>K.stand(b,Object.assign({},o,{balance:true})).x);
    K.stand(b,Object.assign({},o,{x:hx,sc:[0,.025]}));const A0=V.add(V.lerp(hang(b,'R',.065),hang(b,'L',-.065),.5),[0,DR,0]);
    b.scap('both',0,prot(p));const P=[A0[0]-Math.sqrt(LA_*LA_-(A0[1]-PY)**2),PY,0],a0=Math.asin((A0[1]-PY)/LA_);
    const rim=a=>{const ax=[Math.cos(a),Math.sin(a),0],n=[-ax[1],ax[0],0],q=[];for(const u of[1.552,1.611,1.67]){const c=V.madd(P,ax,u);for(let i=0;i<24;i++){const f=Math.PI*i/4,rr=.11*(1+(i>>3))/3;q.push(V.add(V.madd(c,n,rr*Math.sin(f)),[0,0,rr*Math.cos(f)]));}}for(let u=1.7;u<1.98;u+=.1)q.push(V.madd(P,ax,u));return q;};
    const a1=K.memo(this,'a1',()=>{b.scap('both',0,prot(1));let a=Math.asin(Math.min(.95,(b.tpt(0,-.2,.17)[1]+DR-PY)/LA_));while(a>a0&&inT(b,rim(a),.012))a-=.004;b.scap('both',0,prot(p));return a;});
    const a=mix(a0,a1,p),ax=[Math.cos(a),Math.sin(a),0],n=[-ax[1],ax[0],0];
    const A=V.madd(P,ax,LA_),g=V.madd(A,n,-DR);K.landmine(E,P,A,{plates:[.11,.11,.11,.11]});
    for(const[s,k]of SS){const gs=V.add(g,[0,0,k*.065]);b.arm(s,gs,b.tdir(k*.3,-.3,-1),ax);E.cyl(V.madd(gs,ax,-.06),V.madd(gs,ax,.06),.017,K.COL.grip);
      E.cap(V.add(V.madd(g,n,.035),[0,0,k*.065]),A,.011,.011,C.frameD);}
    E.cyl(V.madd(A,ax,-.035),V.madd(A,ax,.035),.02,C.frameD);E.trace('maneral',g);sh(E);}
});

GA.def('lib_meadows_row',{title:'Remo landmine a una mano',cam:{yaw:52,pitch:10},fitBox:[[-.45,0,-.55],[.6,1.35,.25]],
  muscles:{lats_R:1,midback:.7,biceps_R:.5,reardelts_R:.45},labels:[LA,RO,BI],init:{p:0,act:.5},
  timeline:TL(1.1,'Codo atrás y arriba',.6,'Aprieta el dorsal',2.2,'Baja y estira',.4,'Abajo · hombro largo'),
  build(c,b,E){const p=c.p,LG=1.88,PY=.045;
    K.stand(b,{feet:{R:[-.42,.2],L:[.24,-.2]},toe:10,kf:30,x:-.13,tilt:62,sp:[-2,0,-4*p],hd:-22});
    b.scap('R',0,.03);const H0=hang(b,'R',.25),h=Math.sqrt(LG*LG-(H0[1]-PY)**2),P=[H0[0]-h*Math.sin(35*D),PY,H0[2]+h*Math.cos(35*D)];
    b.scap('R',.005*p,mix(.03,-.035,sst(0,.9,p)));b.scap('L',.005,.01);const g=V.madd(P,V.norm(V.sub(V.lerp(H0,b.tpt(.27,-.36,-.02),p),P)),LG);
    b.arm('R',g,[-.8,.35,.6],V.sub(P,g));K.landmine(E,P,g,{plates:[.225]});E.trace('camisa',g);
    const S=b.S.L,td=V.norm(V.sub(S.kne,S.hip)),nt=V.norm(V.perp([0,1,0],td));K.palm(b,E,'L',V.madd(V.lerp(S.kne,S.hip,.2),nt,.063),{fd:td,n:nt,pole:[-.2,.3,-1]});
    sh(E,-.1);}
});

GA.def('lib_row_incline_db',{title:'Remo con mancuernas apoyado en banco',cam:{yaw:-36,pitch:16},
  muscles:{midback:1,lats:.8,reardelts:.5,biceps:.4},labels:[RO,LA,DP],init:{p:0,act:.5},
  timeline:TL(1.1,'Codos atrás · junta escápulas',1,'Aprieta 1 s',2.2,'Baja controlado',.4,'Abajo · estira'),
  build(c,b,E){const p=c.p,a=38*D,U=[Math.cos(a),Math.sin(a),0],N=[-U[1],U[0],0],B0=[0,.6,0],BL=.62;
    K.frame(b,[0,1,0],U,V.neg(N));K.trunk(b,{sp:[-2],hd:-8,sc:[0,prot(p)]});K.rest(b,['tho','lum','pel'],B0,N);
    const sm=V.lerp(b.sho('R'),b.sho('L'),.5);K.shift(b,V.mul(U,BL+.035-V.dot(V.sub(sm,B0),U)));
    b.scap('both',0,.025);const H={R:hang(b,'R',.2),L:hang(b,'L',-.2)},G={};b.scap('both',0,prot(p));
    for(const[s,k]of SS){G[s]=V.lerp(H[s],b.tpt(k*.235,-.36,.07),p);b.arm(s,G[s],elDb(k,b),X);
      const hp=b.hip(s),d=K.legD(14),dy=hp[1]-.075;b.footFlat(s,[hp[0]-Math.sqrt(d*d-dy*dy-.0016)-.055,0,k*.13],-k*6);b.leg(s,null,[.3,1,k*.2]);}
    DBS(E,b,G);
    E.pad(V.madd(V.madd(B0,U,.12),N,-.04),V.madd(V.madd(B0,U,BL),N,-.04),.28,.08,C.pad,{up:N,layer:-1});
    const m=V.madd(V.madd(B0,U,BL*.55),N,-.08);E.beam(m,[m[0],.04,0],.07,C.frame,{layer:-2});
    E.beam(V.madd(V.madd(B0,U,BL*.95),N,-.08),[m[0]+.35,.04,0],.05,C.frame,{layer:-2});
    E.beam([m[0]-.3,.035,0],[m[0]+.45,.035,0],.07,C.frameD,{layer:-2});for(const x of[m[0]-.3,m[0]+.45])E.beam([x,.035,-.22],[x,.035,.22],.07,C.frameD,{layer:-2});
    sh(E,.1);}
});

GA.def('lib_renegade_row_db',{title:'Remo renegado con mancuernas',cam:{yaw:28,pitch:16},
  muscles:{lats:1,midback:.7,obliques:.6,abs:.5,biceps:.3},labels:[LA,'Oblicuos','Abdomen'],init:{p:0,q:0,act:.6},
  timeline:[{p:1,dur:1,label:'Rema derecha · cadera quieta',act:1},{dur:.4,label:'Aprieta arriba',act:1},{p:0,dur:1.3,label:'Baja controlando',act:.75},
    {q:1,dur:1,label:'Rema izquierda · sin girar',act:1},{dur:.4,label:'Aprieta arriba',act:1},{q:0,dur:1.3,label:'Baja controlando',act:.75},{dur:.3,label:'Plancha firme',act:.6}],
  build(c,b,E){const R=.085,zH=.2;const pl=K.plank(b,null,{xT:-1.05,hy:R-.029,zF:.3,zH,k:K.memo(this,'pl',()=>({}))});const hx=pl.hands.R[0]-.05;
    for(const[s,k]of SS){const q=s==='R'?c.p:c.q,G0=[hx,R,k*zH];b.scap(s,-.01,mix(.03,-.03,q));
      const g=V.lerp(G0,b.tpt(k*.26,-.34,.05),q);g[1]+=.02*Math.sin(Math.PI*q);b.arm(s,g,V.lerp([-1,.2,k*.35],[-.5,1,k*.3],sst(0,.4,q)),X);
      E.dumbbell(g,V.norm(V.lerp(X,fax(b,s),sst(0,.3,q))),{r:R,hl:.065,len:.13});if(s==='R')E.trace('mancuerna',g);}
    sh(E,-.4);}
});

GA.def('lib_kb_row',{title:'Remo con kettlebell',cam:{yaw:32,pitch:16},
  muscles:{lats_R:1,midback:.8,biceps_R:.5,reardelts_R:.4,forearms_R:.3},labels:[LA,RO,BI],init:{p:0,act:.5},
  timeline:TL(1.2,'Tira hacia la cadera',.6,'Aprieta · codo atrás',2.4,'Baja lento · estira',.4,'Abajo · escápula suelta'),
  build(c,b,E){const p=c.p,BH=.45,BZ=-.15,HY=.89,kg=16;
    const pose=q=>{b.pelvis([0,HY,0],{tilt:72});b.spine(-2,0,-3*q);b.head(-6);b.scap('R',-.008*q,mix(.03,-.03,q));b.scap('L',0,0);};
    pose(0);const gB=V.add(b.sho('R'),[.02,-.62,.02]),sl=b.sho('L'),hy=BH+.028,hL=[sl[0]+Math.sqrt(Math.max(.618*.618-(sl[1]-hy)**2,0)),hy,-.19];
    pose(1);const gT=b.tpt(.25,-.34,.06);pose(p);
    const g=[mix(gB[0],gT[0],Math.pow(p,.8)),mix(gB[1],gT[1],Math.pow(p,.85)),mix(gB[2],gT[2],p)];
    b.arm('R',g,[-.3,1,.25],X);K.kettlebell(E,g,{kg,ax:X});E.trace('kettlebell',g);
    K.palm(b,E,'L',[hL[0]+.05,BH,-.19],{fd:X,n:[0,1,0],pole:[-1,0,-.2]});
    const hl=b.hip('L'),kn=[0,BH+.055,-.12];kn[0]=hl[0]+Math.sqrt(Math.max(.44*.44-(kn[1]-hl[1])**2-(kn[2]-hl[2])**2,.01));
    b.legDir('L',V.sub(kn,hl),[-Math.sqrt(.43*.43-.0004),-.02,0]);b.footRelax('L',60);
    const hr=b.hip('R');b.footFlat('R',[hr[0]-.08,0,.33],-15);b.leg('R',null,[1,.1,.25]);
    E.bench({at:[.92,0,BZ],dir:0,h:BH,seat:0,back:1.14,inc:0,w:.28});sh(E,.2);}
});

const SHT=[{p:1,dur:.9,label:'Sube hacia las orejas',act:1},{dur:1,label:'Aguanta 1 s',act:1},{p:0,dur:2,label:'Baja lento',act:.75},{dur:.5,label:'Abajo · brazos rectos',act:.5}];
const SHM=f=>({traps:1,forearms:f}),SHL=[TR,AN],CS={yaw:-40,pitch:18};
const shrug=(p,x)=>({x,fz:.12,toe:8,kf:4,tilt:2,sp:[-1],hd:2,sc:[mix(-.008,.05,p),-.004]});
const stand2=(b,p,w,cl,ax,ctx)=>{const hx=K.memo(ctx,'hx',()=>K.stand(b,Object.assign(shrug(0),{balance:true,x:null})).x);K.stand(b,shrug(p,hx));
  const G={};for(const[s,k]of SS){G[s]=hang(b,s,k*w,cl);b.arm(s,G[s],[-1,0,k*.25],ax);}return G;};
GA.def('lib_shrug_bb',{title:'Encogimientos con barra',cam:CS,muscles:SHM(.35),labels:SHL,timeline:SHT,
  build(c,b,E){const G=stand2(b,c.p,.24,.016,Z,this);BB(E,mid(G));sh(E);}
});
GA.def('lib_shrug_db',{title:'Encogimientos con mancuernas',cam:CS,muscles:SHM(.4),labels:SHL,timeline:SHT,
  build(c,b,E){DBS(E,b,stand2(b,c.p,.255,null,X,this),{r:.06,hl:.065});sh(E);}
});
GA.def('lib_shrug_smith',{title:'Encogimientos en Smith',cam:CS,fitBox:[[-.3,0,-.68],[.4,1.75,.68]],muscles:SHM(.3),labels:SHL,timeline:SHT,
  build(c,b,E){const BX=.16,W=.24,R=K.armD(3),y=()=>{const S=b.sho('R');return S[1]-Math.sqrt(R*R-(BX-S[0])**2-(W-S[2])**2);};
    const hx=K.memo(this,'hx',()=>K.root(x=>{K.stand(b,shrug(0,x));return front(b,y())+.016-BX;},-.4,.3));K.stand(b,shrug(c.p,hx));
    const Y=y();for(const[s,k]of SS)b.arm(s,[BX,Y,k*W],[-1,0,k*.25],Z);smith(E,BX,Y);sh(E);}
});
GA.def('lib_shrug_cable',{title:'Encogimientos en cable',cam:CS,fitBox:[[-.35,0,-.42],[.9,1.82,.42]],muscles:SHM(.3),labels:SHL,timeline:SHT,
  build(c,b,E){const G=stand2(b,c.p,.22,.016,Z,this),g=mid(G),P=[.5,.12,0];
    E.bar(V.add(g,[0,0,-.3]),V.add(g,[0,0,.3]),{r:.0145});for(const k of[-1,1])E.cyl(V.add(g,[0,0,k*.14]),V.add(g,[0,0,k*.29]),.018,K.COL.grip);
    E.sph(g,.02,C.chrome);E.cable(g,P);E.pulley(P,Z,.045);E.trace('barra',V.add(g,[0,0,.3]));
    E.beam([.62,0,0],[.62,2.05,0],.1,C.frame);E.beam([.57,2.05,0],[1.02,2.05,0],.07,C.frame);E.beam([1.02,0,0],[1.02,2.05,0],.08,C.frame);
    E.beam([.45,.045,0],[1.1,.045,0],.09,C.frameD,{layer:-1});E.beam([P[0],P[1],0],[.6,.06,0],.05,C.frameD);
    const lift=V.dist(P,g)-V.dist(P,V.add(g,[0,-.058*c.p,0])),top=E.stack([.82,0,0],{h:1.8,lift,n:13,sel:5,w:.24,bias:.2,yaw:90});
    E.cable(P,[.68,P[1]-.04,0]);E.pulley([.68,P[1],0],Z,.04);E.cable([.72,P[1],0],[.72,1.95,0]);E.pulley([.77,1.95,0],Z,.05);E.cable([.82,1.95,0],top);sh(E);}
});

})(window.GymAnim);
