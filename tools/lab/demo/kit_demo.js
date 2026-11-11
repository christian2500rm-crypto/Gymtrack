/* Demos TEMPORALES del kit (_kit.js): cada primitiva y postura en uso. NO forman parte del build (demo/, no ex/).
   Ver: bash shot.sh demo_xxx ex/_kit.js,demo/kit_demo.js shots/kit_xxx.png "" 1440,720 */
(function(GA){
const K=GA._.kit,V=GA._.V,C=GA._.COL,DM=GA._.DIM,SS=K.SS,mix=K.mix,sst=K.sst;
const TL=(a,b,l1,l2)=>[{p:1,dur:a||1.5,label:l1||'Va',act:1},{dur:.4,label:'Pausa',act:1},{p:0,dur:b||2,label:l2||'Vuelve',act:.7},{dur:.4,label:'Inicio',act:.5}];

// ═══ KETTLEBELL: peso muerto (stand + balance + kettlebell) ═════════════════
GA.def('demo_kettlebell',{
  title:'Demo · kettlebell',cam:{yaw:30,pitch:8},muscles:{glutes:1,hams:.8},labels:['Glúteos','Isquios'],init:{p:0,act:.5},
  timeline:TL(2,1.3,'Baja · cadera atrás','Sube'),
  build(c,b,E){const p=c.p,kg=24,R=K.armD(3),TB=44,kr=K.kbR(kg);let h=[0,.5,0];
    // borde delantero de las piernas a la altura y (la bola no atraviesa los muslos)
    const front=y=>{let x=-1;for(const[s]of SS){const S=b.S[s];for(const[a,z,r]of[[S.hip,S.kne,.075],[S.kne,S.ank,.05]])if(y<=a[1]&&y>=z[1]){const t=(a[1]-y)/(a[1]-z[1]);x=Math.max(x,mix(a[0],z[0],t)+r);}}return x;};
    const arms=b=>{const sm=V.lerp(b.sho('R'),b.sho('L'),.5),dz=b.sho('R')[2]-sm[2]-.05;let x=sm[0],y=sm[1]-R;
      for(let i=0;i<3;i++){x=Math.max(sm[0],front(y-.068-kr)+kr+.005);y=sm[1]-Math.sqrt(Math.max(.01,R*R-dz*dz-(x-sm[0])**2));}
      h=[x,y,0];for(const[s,k]of SS)b.arm(s,V.add(h,[0,0,k*.05]),[-.2,0,k],[0,0,1]);};
    const pose=(kf,tl)=>K.stand(b,{fz:.17,toe:14,kf,tilt:tl,sp:[2],hd:-tl*.45,sc:[-.012,0],balance:true,arms,xm:()=>[[V.add(h,[0,-.18,0]),kg/75]]});
    const fh=K.kbFloorH(kg),kB=K.memo(this,'kB',()=>E.solve(kf=>{pose(kf,TB);return h[1]-fh;},5,110));
    b.ikErr=0;pose(mix(5,kB,p),mix(2,TB,p));
    K.kettlebell(E,h,{kg});E.trace('kb',h);
    E.shadow([0,0,0],.45,.35,.55);
  }
});

// ═══ BANDA: remo de pie anclado a un poste (band + handle) ═════════════════════
GA.def('demo_band',{
  title:'Demo · banda',cam:{yaw:-38,pitch:8},muscles:{midback:1,lats:.8},labels:['Romboides','Dorsales'],init:{p:0,act:.5},
  timeline:TL(1.2,2,'Rema','Vuelve'),
  build(c,b,E){const p=c.p,AN=[1.36,1.02,0];
    K.stand(b,{fx:-.12,fz:.15,toe:8,kf:16,tilt:10,sp:[-2],hd:-6,sc:[-.008,mix(.03,-.035,p)],x:-.1});
    for(const[s,k]of SS){const sh=b.sho(s),g0=V.madd(sh,V.norm(V.sub([AN[0],AN[1],k*.1],sh)),.6),g1=b.tpt(k*.2,-.33,.1),g=V.lerp(g0,g1,p);
      g[1]+=.03*Math.sin(Math.PI*p);b.arm(s,g,[-1,-.5,k*.35],[0,1,0]);
      K.band(E,[AN[0]-.005,AN[1],k*.03],b.j(s,'grip'),{handle:[0,1,0],col:K.BAND.red,L0:1.05});}
    // poste de .08 (cara delantera en AN.x) con la cincha de anclaje: los dos ramales salen de ella
    E.beam([AN[0]+.04,0,0],[AN[0]+.04,2.0,0],.08,C.frame);E.boxA([AN[0]+.04,AN[1],0],[.094,.035,.094],K.COL.strap);E.boxA([AN[0]+.04,.02,0],[.4,.04,.4],C.frameD,{layer:-1});
    E.shadow([0,0,0],.45,.35,.55);
  }
});

// ═══ TRX: remo inclinado (trx + cuerpo rígido sobre los talones) ═════════════
GA.def('demo_trx',{
  title:'Demo · TRX',cam:{yaw:-40,pitch:6},muscles:{midback:1,lats:.8,biceps:.4},labels:['Romboides','Dorsales'],init:{p:0,act:.5},
  timeline:TL(1.3,2.2,'Tira · pecho a las manos','Baja'),
  build(c,b,E){const p=c.p,A=[1.1,2.35,0],XF=.78,LT=1.6,R=K.armD(4);
    const body=th=>{const r=th*Math.PI/180,f=[Math.cos(r),Math.sin(r),0],u=[-Math.sin(r),Math.cos(r),0];
      for(const[s,k]of SS)K.footOn(b,s,[XF,0,k*.12],f,u);
      const am=V.lerp(b.j('R','ank'),b.j('L','ank'),.5),LL=Math.sqrt(K.legD(3)**2-(.12-DM.hipW)**2);
      b.pelvis(V.madd(am,u,LL),{tilt:-th});b.spine(-2);b.head(4);b.scap('both',-.01,mix(.02,-.035,p));K.legs(b,{up:0});};
    const hands=()=>SS.map(([s,k])=>b.tpt(k*.21,-.2,.15));
    const k0=K.memo(this,'k0',()=>({t0:E.solve(t=>{body(t);return V.dist(A,b.sho('R'))-(LT+R);},5,70),
      t1:E.solve(t=>{body(t);return V.dist(A,V.lerp(...hands(),.5))-LT;},0,70)}));
    body(mix(k0.t0,k0.t1,p));const sm=V.lerp(b.sho('R'),b.sho('L'),.5),dA=V.norm(V.sub(sm,A)),H1=hands(),H=[];
    SS.forEach(([s,k],i)=>{const g0=V.madd(b.sho(s),V.norm(V.sub(A,b.sho(s))),R-.002),g=V.madd(A,V.norm(V.sub(V.lerp(g0,H1[i],p),A)),LT);H.push(g);
      b.arm(s,g,[-.4,-.6,k*.9],[0,0,1]);});
    K.trx(E,A,H[0],H[1]);E.beam([A[0],A[1]+.03,-.5],[A[0],A[1]+.03,.5],.08,C.frame);
    E.shadow([.2,0,0],.6,.35,.55);
  }
});

// ═══ FLEXIÓN (plank) ═════════════════════════════════════════════════════════
GA.def('demo_pushup',{
  title:'Demo · flexión',cam:{yaw:28,pitch:14},muscles:{pecs:1,triceps:.6},labels:['Pectoral','Tríceps'],init:{p:0,act:.5},
  timeline:TL(2,1,'Baja','Empuja'),
  build(c,b,E){K.plank(b,E,{xT:-1,p:c.p,k:K.memo(this,'pl',()=>({}))});E.shadow([-.15,0,0],1,.35,.5);}
});

// ═══ CUADRUPEDIA: bird-dog (quad + extensión brazo/pierna) ═══════════════════
GA.def('demo_quadruped',{
  title:'Demo · cuadrupedia',cam:{yaw:34,pitch:14},muscles:{glutes_L:1,lowback:.6,frontdelts_R:.5},labels:['Glúteo','Lumbares'],init:{p:0,act:.5},
  timeline:TL(1.5,1.5,'Extiende brazo y pierna','Vuelve'),
  build(c,b,E){const p=c.p,mt=K.mat(E,[.05,0,0],[1.6,.62]);
    // la palma R se dibuja hasta p=.06; desde ahí el puño arranca (sst) del MISMO objetivo que usaba K.palm (K.palmT): sin salto
    const q=K.quad(b,E,{x:-.25,y:mt.top,arms:p>.06?'L':true}),qa=sst(.06,1,p);
    if(p>.06){const sh=b.sho('R'),t0=K.palmT(q.hands.R),t1=V.madd(sh,V.norm([1,.08,-.05]),.6);
      const g=V.lerp(t0,t1,qa);g[1]+=.12*Math.sin(Math.PI*qa);b.arm('R',g,V.lerp([-1,.3,.45],[0,-1,.2],qa),[0,0,1]);}
    if(p>0){const hp=b.hip('L'),kn=q.knees.L,td=V.norm(V.lerp(V.norm(V.sub(kn,hp)),[-1,.05,0],p)),sd0=V.norm(V.sub(b.j('L','ank'),kn)),sd=V.norm(V.lerp(sd0,[-1,.02,0],p));
      b.legDir('L',td,sd);b.footRelax('L',mix(79,35,p));}
    E.shadow([-.1,0,0],.7,.3,.5);
  }
});

// ═══ PUENTE DE GLÚTEO con minibanda en esterilla (supine + miniband + mat) ═══
GA.def('demo_bridge',{
  title:'Demo · puente',cam:{yaw:-28,pitch:16},muscles:{glutes:1,hams:.5,abductors:.5},labels:['Glúteos','Glúteo medio'],init:{p:0,act:.5},
  timeline:TL(1.2,2,'Sube la cadera','Baja'),
  build(c,b,E){const p=c.p,mt=K.mat(E,[0,0,0],[1.7,.6]),Y=mt.top;
    K.supine(b,{y:Y,x:-.42,at:'sho',incl:-mix(0,24,p),sp:[0],sc:[0,-.01],hd:'rest'});
    for(const[s,k]of SS){b.footFlat(s,[.36,Y,k*.15],-k*4);b.leg(s,null,[0,1,k*.25]);}
    K.armsFloor(b,E,{y:Y,spread:16});
    const at=s=>V.lerp(b.j(s,'kne'),b.hip(s),.14),ax=s=>V.sub(b.hip(s),b.j(s,'kne'));
    K.miniband(E,at('R'),at('L'),{axis:[ax('R'),ax('L')],r:.064});
    E.shadow([0,0,0],.85,.3,.5);
  }
});

// ═══ DOMINADA (pullupBar + hang) ═════════════════════════════════════════════
GA.def('demo_hang',{
  title:'Demo · dominada',cam:{yaw:30,pitch:4},fitBox:[[-.45,.3,-.5],[.45,2.45,.5]],muscles:{lats:1,biceps:.6},labels:['Dorsales','Bíceps'],init:{p:0,act:.5},
  timeline:TL(1.3,2.4,'Sube · barbilla arriba','Baja'),
  build(c,b,E){const bar=K.pullupBar(E,{x:0,y:2.3,w:.62});K.hang(b,{x:0,y:bar.y,w:.4,p:c.p});E.shadow([0,0,0],.4,.3,.45);}
});
// dominada supina en el marco de una puerta, rodillas flexionadas (pullupBar door + hang sup)
GA.def('demo_hang_door',{
  title:'Demo · dominada en puerta',cam:{yaw:-32,pitch:4},fitBox:[[-.45,.3,-.55],[.45,2.15,.55]],muscles:{lats:1,biceps:.9},labels:['Dorsales','Bíceps'],init:{p:0,act:.5},
  timeline:TL(1.3,2.4,'Sube','Baja'),
  build(c,b,E){const bar=K.pullupBar(E,{x:0,kind:'door'});K.hang(b,{x:0,y:bar.y,w:.18,p:c.p,grip:'sup',hip:15,knee:mix(80,95,c.p)});}
});

// ═══ FONDOS EN PARALELAS (dipStation + support) ══════════════════════════════
GA.def('demo_dip',{
  title:'Demo · fondos',cam:{yaw:34,pitch:6},muscles:{triceps:1,lowerpecs:.7},labels:['Tríceps','Pectoral inf.'],init:{p:0,act:.5},
  timeline:TL(2,1.2,'Baja','Empuja'),
  build(c,b,E){const ds=K.dipStation(E,{x:0,y:1.22,w:.26});K.support(b,{x:0,y:ds.y,w:ds.w,p:c.p});E.shadow([0,0,0],.45,.35,.45);}
});

// ═══ FITBALL: sentado, empuje de balón medicinal (fitball + seat ball + medball) ═
GA.def('demo_fitball',{
  title:'Demo · fitball + balón',cam:{yaw:40,pitch:10},muscles:{abs:.6,frontdelts:.7,pecs:.5},labels:['Core','Deltoides'],init:{p:0,act:.5},
  timeline:TL(1.1,1.6,'Empuja el balón','Recoge'),
  build(c,b,E){const p=c.p,fb=K.fitball(E,[0,.31,0],.325,{sq:.045}),r=.12,R=K.armD(8);
    K.seat(b,fb.top,{ball:fb,tilt:3,sp:[-2],hd:-3,sc:[0,mix(0,.035,p)],feet:{x:.5,z:.22,toe:14}});
    const sm=V.lerp(b.sho('R'),b.sho('L'),.5),F=b.tdir(0,0,1),c0=b.tpt(0,-.2,.27),dz=b.sho('R')[2]-sm[2]-(r+.028),c1=V.madd(V.madd(sm,b.tdir(0,1,0),-.04),F,Math.sqrt(R*R-dz*dz-.0016));
    const mc=V.lerp(c0,c1,p),mb=K.medball(E,mc,r);
    for(const[s,k]of SS)b.arm(s,mb.palm([0,0,k]),[-.2,-1,k*.6],[0,1,0]);
  }
});

// ═══ RUEDA ABDOMINAL: de rodillas (kneel + abWheel + mat) ════════════════════
GA.def('demo_abwheel',{
  title:'Demo · rueda abdominal',cam:{yaw:30,pitch:12},muscles:{abs:1,lats:.5},labels:['Abdomen','Dorsales'],init:{p:0,act:.5},
  timeline:TL(2.2,1.6,'Rueda adelante','Vuelve'),
  build(c,b,E){const p=c.p,mt=K.mat(E,[.25,0,0],[1.7,.6]),Y=mt.top,R=K.armD(3);
    K.kneel(b,{x:-.42,y:Y,thigh:mix(4,58,p),tilt:mix(64,84,p),sp:[mix(14,2,p)],hd:mix(-24,-14,p),sc:[.01,.02],toes:'tuck'});
    const sh=b.sho('R'),dy=sh[1]-Y-.09,dz=sh[2]-.11,w=[sh[0]+Math.sqrt(Math.max(.0,R*R-dy*dy-dz*dz)),Y+.09,0],aw=K.abWheel(E,w,[0,0,1]);
    for(const[s,k]of SS)b.arm(s,aw.hands[s==='R'?0:1],[-1,-.2,k*.4],[0,0,1]);
    E.shadow([0,0,0],.8,.3,.5);
  }
});

// ═══ COMBA (jumpRope) ════════════════════════════════════════════════════════
GA.def('demo_jumprope',{
  title:'Demo · comba',cam:{yaw:28,pitch:6},cycle:{period:.5},muscles:{calves:1,quads:.4},labels:['Gemelos','Cuádriceps'],note:'120 saltos/min',
  init:{act:.7},timeline:[{dur:.5,label:'Saltos cortos · sobre metatarsos',act:.7}],
  build(c,b,E){const ph=c.cyc,a=Math.pow(Math.cos(Math.PI*ph),2),hop=.045*a;
    for(const[s,k]of SS)K.footBallOn(b,s,[.06,hop,k*.1],-k*4,mix(16,32,a));
    const am=V.lerp(b.j('R','ank'),b.j('L','ank'),.5),d=K.legD(mix(20,8,a));
    b.pelvis([am[0]-.04,am[1]+Math.sqrt(d*d-.0001-.0016),0],{tilt:3});b.spine(0);b.head(-2);b.scap('both',-.01,0);K.legs(b,{up:.3});
    const H=[];for(const[s,k]of SS){const w=2*Math.PI*ph,h=V.add(b.ppt(k*.3,.0,.12),[.03*Math.cos(w),.03*Math.sin(w),0]);b.arm(s,h,[-.6,-.3,k*.5],V.norm([.15,-1,k*.4]));H.push(h);}
    K.jumpRope(E,H[0],H[1],ph,{ax:[V.norm([.15,-1,.4]),V.norm([.15,-1,-.4])]});
    E.shadow([.05,0,0],.3,.25,.5*(1-.4*a));
  }
});

// ═══ REMOERGÓMETRO (rower + seat + footrests) ════════════════════════════════
GA.def('demo_rower',{
  title:'Demo · remo ergómetro',cam:{yaw:28,pitch:10},cycle:{period:2.4},muscles:{quads:.8,lats:.8,midback:.7,glutes:.6},labels:['Piernas','Espalda'],note:'25 pal/min',
  init:{act:.8},timeline:[{dur:2.4,label:'Piernas · tronco · brazos',act:.8}],
  build(c,b,E){const u=c.cyc,G=K.rowerGeo(),R=K.armD(4),dr=u<.36;
    const L=dr?sst(0,.22,u):1-sst(.55,1,u),T=dr?sst(.06,.3,u):1-sst(.42,.66,u),A=dr?sst(.18,.36,u):1-sst(.36,.52,u);
    const sit=(x,tl)=>{K.seat(b,[x,G.SY,0],{tilt:tl,sp:[mix(6,-2,T)],hd:-tl*.3,sc:[0,mix(.03,-.03,A)],legs:false});};
    const ank=V.add(G.feet.R.heel,V.add(V.mul(G.feet.R.f,DM.heel),V.mul(G.feet.R.u,DM.ankH)));
    const xs=K.memo(this,'xs',()=>({c:E.solve(x=>{sit(x,28);return V.dist(b.hip('R'),ank)-K.legD(118);},-1,.3),f:E.solve(x=>{sit(x,-18);return V.dist(b.hip('R'),ank)-K.legD(6);},-1.2,.3)}));
    const sx=mix(xs.c,xs.f,L);sit(sx,mix(28,-18,T));
    for(const[s,k]of SS){b.footFlat(s,G.feet[s].heel,0,G.feet[s].u);b.leg(s,null,[.2,1,k*.12]);}
    const sm=V.lerp(b.sho('R'),b.sho('L'),.5),dy=sm[1]-.64,hs=[sm[0]+Math.sqrt(Math.max(.01,R*R-dy*dy-.0002)),.64,0],hf=V.madd(b.tpt(0,-.32,.13),b.tdir(0,0,1),.08);
    const hc=V.lerp(hs,hf,A);hc[1]+=.02*Math.sin(Math.PI*A);
    for(const[s,k]of SS)b.arm(s,V.add(hc,[0,0,k*.17]),[-1,-.25,k*.55],[0,0,1]);
    K.rower(E,{seatX:sx,handle:hc});E.trace('maneral',hc);
  }
});

// ═══ ESCALADORA (stairClimber): escalones que bajan, pies que suben ═══════════
GA.def('demo_stair',{
  title:'Demo · escaladora',cam:{yaw:-36,pitch:10},cycle:{period:1.3},muscles:{glutes:1,quads:.8,calves:.4},labels:['Glúteos','Cuádriceps'],note:'≈ 90 esc/min',
  init:{act:.8},timeline:[{dur:1.3,label:'Pisa entero · tronco alto',act:.8}],
  build(c,b,E){const u=c.cyc,X=-.1,Y0=.25,rs=.2,rn=.25,st=K.stairClimber(E,{x:X,y0:Y0,phase:(2*u)%1,rise:rs,run:rn,n:5});
    const pos=(j,t)=>[X+(j-2*t)*rn-.02,Y0+(j-2*t)*rs];
    // vuelo: el objetivo es el escalón j0+2 MIENTRAS baja (pos(j0+2,t)); llega al 85 % y lo acompaña; nunca por debajo de su huella
    const foot=(j0,t)=>{if(t<.5)return pos(j0,t);const v=(t-.5)/.5,w=Math.min(1,v/.85),A=pos(j0,.5),B=pos(j0+2,t),e=GA._.EASE.mj(w);
      return[mix(A[0],B[0],e),Math.max(B[1],mix(A[1],B[1],e)+.17*Math.sin(Math.PI*w))];};
    for(const[s,k,o]of[['R',1,0],['L',-1,.5]]){const P=foot(1,(u+o)%1),t=(u+o)%1,pt=t<.5?0:12*Math.sin(Math.PI*(t-.5)/.5);
      if(pt>.5)b.footBall(s,[P[0]+DM.heel+DM.toe-.06,P[1]+.01,k*.12],-k*4,pt);else b.footFlat(s,[P[0],P[1],k*.12],-k*4);}
    b.pelvis([X+.06,Y0+.86+.012*Math.cos(4*Math.PI*u),0],{tilt:10,yaw:4*Math.cos(2*Math.PI*u)});b.spine(0);b.head(-8);b.scap('both',0,.01);K.legs(b,{up:.3});
    for(const[s,k]of SS)b.arm(s,st.rail(b.sho(s)[0]+.28,s),[-.6,-1,k*.4],st.railAx);
  }
});

// ═══ BICI DE AIRE (airBike) ══════════════════════════════════════════════════
GA.def('demo_airbike',{
  title:'Demo · bici de aire',cam:{yaw:30,pitch:8},cycle:{period:1},muscles:{quads:1,glutes:.6,pecs:.4,lats:.4},labels:['Piernas','Brazos'],note:'60 RPM',
  init:{act:.8},timeline:[{dur:1,label:'Empuja y tira a la vez',act:.8}],
  build(c,b,E){const ab=K.airBike(E,{cyc:c.cyc});
    K.seat(b,ab.seat,{tilt:16,sp:[4],hd:-12,legs:false});
    for(const[s,k]of SS){const P=ab.ped[s],a=22+10*Math.cos(ab.crank[s]-4.9),uu=[Math.sin(a*Math.PI/180),Math.cos(a*Math.PI/180),0];
      b.footBall(s,V.madd(P,uu,.02),0,a);b.leg(s,null,[1,.15,k*.03]);b.arm(s,ab.hand[s],[-.5,-.6,k],ab.hax[s]);}
  }
});

// ═══ SKI ERG ═════════════════════════════════════════════════════════════════
GA.def('demo_skierg',{
  title:'Demo · ski erg',cam:{yaw:-40,pitch:6},muscles:{lats:1,triceps:.6,abs:.6},labels:['Dorsales','Tríceps','Core'],init:{p:0,act:.5},
  timeline:TL(1,1.4,'Tira abajo · bisagra','Vuelve arriba'),
  build(c,b,E){const p=c.p,SX=.67,Y=.05;   // talones .83 m detrás de la columna: en la bisagra la cabeza no llega al monitor
    K.stand(b,{y:Y,fx:-.16,fz:.15,kf:mix(8,40,p),tilt:mix(2,38,p),sp:[mix(-4,10,p)],hd:mix(-10,-20,p),sc:[mix(.03,-.02,p),mix(.01,-.02,p)],x:-.08});
    const H=[];for(const[s,k]of SS){const sh=b.sho(s),h0=[SX-.18,sh[1]+.5,k*.2],h1=V.add(b.hip(s),[.12,-.08,k*.12]),q=sst(0,1,p),h=V.lerp(h0,h1,q);h[0]+=.18*Math.sin(Math.PI*q);
      const d=V.dist(sh,h),R=K.armD(5);if(d>R)V.lerp(sh,h,R/d).forEach((v,i)=>h[i]=v);b.arm(s,h,[-.4,-.4,k],[0,1,0]);H.push(b.j(s,'grip'));}
    K.skiErg(E,{x:SX,hR:H[0],hL:H[1]});
  }
});

// ═══ TRINEO (sled): empuje con postes altos ═══════════════════════════════════
GA.def('demo_sled',{
  title:'Demo · trineo',cam:{yaw:30,pitch:8},cycle:{period:.9},muscles:{quads:1,glutes:.9,calves:.6},labels:['Cuádriceps','Glúteos'],
  init:{act:.9},timeline:[{dur:.9,label:'Empuja · pasos cortos',act:.9}],
  build(c,b,E){const u=c.cyc,sl=K.sled(E,[.95,0,0],{plates:3}),R=K.armD(14),Y=.86,TL=46;
    const pose=x=>{b.pelvis([x,Y,0],{tilt:TL});b.spine(2);b.head(-28);b.scap('both',.01,.03);};
    const x=K.memo(this,'x',()=>E.solve(x=>{pose(x);return V.dist(b.sho('R'),sl.hi[0])-R;},-.8,.3));pose(x);
    for(const[s,k,o]of[['R',1,0],['L',-1,.5]]){const t=(u+o)%1;let bx,by,pit;
      if(t<.55){bx=mix(x+.12,x-.4,t/.55);by=0;pit=mix(18,46,t/.55);}else{const v=(t-.55)/.45,e=GA._.EASE.mj(v);bx=mix(x-.4,x+.12,e);by=.16*Math.sin(Math.PI*v);pit=mix(46,18,e);}
      K.footBallOn(b,s,[bx,by,k*.13],-k*3,pit);b.leg(s,null,[1,.2,k*.05]);}
    for(const[s,k]of SS)b.arm(s,sl.hi[s==='R'?0:1],[-.5,-1,k*.6],sl.ax[s==='R'?0:1]);
  }
});

// ═══ CUERDAS DE BATALLA (battleRope) ═════════════════════════════════════════
GA.def('demo_battlerope',{
  title:'Demo · cuerdas de batalla',cam:{yaw:32,pitch:10},fitBox:[[-.7,0,-.8],[2.0,1.7,.8]],cycle:{period:.6},muscles:{frontdelts:1,abs:.5,quads:.4},labels:['Hombros','Core'],
  init:{act:.85},timeline:[{dur:.6,label:'Ondas alternas · rodillas flexionadas',act:.85}],
  build(c,b,E){const u=c.cyc,AN=[3.2,.12,0];
    K.stand(b,{fx:-.12,fz:.21,toe:14,kf:40,tilt:24,sp:[2],hd:-18,sc:[0,.02],balance:true});
    for(const[s,k,o]of[['R',1,0],['L',-1,.5]]){const ph=(u+o)%1,h=V.add(b.ppt(k*.2,.12,.3),[0,K.ropeHand(ph,.2),0]);
      b.arm(s,h,[-.6,-.4,k*.7],[0,0,1]);K.battleRope(E,[AN[0],AN[1],k*.1],h,ph,{amp:.2});}
    E.beam([AN[0]+.08,0,0],[AN[0]+.08,.45,0],.1,C.frameD);E.shadow([0,0,0],.5,.4,.5);
  }
});

// ═══ LANDMINE: press a una mano semiarrodillado (kneel half + landmine) ══════
GA.def('demo_landmine',{
  title:'Demo · landmine',cam:{yaw:-30,pitch:10},muscles:{frontdelts_R:1,upperpecs_R:.6,triceps_R:.5},labels:['Deltoides ant.','Pectoral sup.'],init:{p:0,act:.5},
  timeline:TL(1.2,2,'Empuja arriba y adelante','Baja'),
  build(c,b,E){const p=c.p,Lg=1.95-.07,R=K.armD(6);
    K.kneel(b,{x:-.1,thigh:0,tilt:3,sp:[-3,0,-6*p],hd:-6,half:'L',fwd:.4,toes:'tuck',sc:[0,0]});
    const sh=b.sho('R'),h0=b.tpt(.15,-.07,.2),PV=[h0[0]+Math.sqrt(Lg*Lg-(h0[1]-.05)**2-.0036),.05,h0[2]-.06];
    const dh=V.norm([h0[0]-PV[0],0,h0[2]-PV[2]]),g=th=>V.madd(PV,V.add(V.mul(dh,Math.cos(th)),[0,Math.sin(th),0]),Lg);
    const t0=Math.asin((h0[1]-.05)/Lg),t1=E.solve(t=>V.dist(g(t),sh)-R,t0,1.4),G=g(mix(t0,t1,p));
    b.arm('R',G,[-.1,-1,.5],V.norm(V.sub(G,PV)));b.arm('L',V.lerp(b.j('L','kne'),b.hip('L'),.25),[-1,-.3,-.6],[1,0,0]);
    K.landmine(E,PV,G,{plates:[.17]});E.shadow([.5,0,0],1.1,.35,.5);
  }
});

// ═══ SENTADILLA TRASERA: barra + rack (barbell + rack + stand balance) ═══════
GA.def('demo_barbell',{
  title:'Demo · barra y rack',cam:{yaw:-34,pitch:8},muscles:{quads:1,glutes:.9},labels:['Cuádriceps','Glúteos'],init:{p:0,act:.5},
  timeline:TL(2.4,1.4,'Baja','Sube'),
  build(c,b,E){const p=c.p,M=60/75;let bar=[0,1.4,0];
    const arms=b=>{bar=b.tpt(0,-.03,-.064);for(const[s,k]of SS)b.arm(s,[bar[0],bar[1],k*.42],[-.45,-1,k*.3],[0,0,1]);};
    K.stand(b,{fz:.17,toe:16,kf:mix(5,108,p),tilt:mix(4,42,p),sp:[-4],hd:-mix(2,22,p),sc:[.012,-.03],balance:true,arms,xm:()=>[[bar,M]]});
    K.barbell(E,bar,[0,0,1],{plates:[.225,.225]});K.rack(E,{x:.62,hook:1.36});E.trace('barra',V.add(bar,[0,0,1.1]));
    E.shadow([0,0,0],.6,.4,.55);
  }
});

// ═══ PESO MUERTO CON BARRA HEXAGONAL (trapbar) ═══════════════════════════════
GA.def('demo_trapbar',{
  title:'Demo · barra hexagonal',cam:{yaw:34,pitch:12},muscles:{quads:.8,glutes:1,hams:.6},labels:['Glúteos','Cuádriceps'],init:{p:0,act:.5},
  timeline:TL(2,1.3,'Baja','Sube'),
  build(c,b,E){const p=c.p,M=80/75,R=K.armD(3),TB=36;let g=[0,.5,0];
    const arms=b=>{const S=b.sho('R'),sm=V.lerp(S,b.sho('L'),.5),dz=.31-(S[2]-sm[2]);g=[sm[0],sm[1]-Math.sqrt(R*R-dz*dz),0];
      for(const[s,k]of SS)b.arm(s,[g[0],g[1],k*.31],[-.3,0,k],[1,0,0]);};
    const pose=(kf,tl)=>K.stand(b,{fz:.13,toe:8,kf,tilt:tl,sp:[0],hd:-tl*.35,sc:[-.01,-.01],balance:true,arms,xm:()=>[[g,M]]});
    const kB=K.memo(this,'kB',()=>E.solve(kf=>{pose(kf,TB);return g[1]-(.225+.1);},5,120));
    b.ikErr=0;pose(mix(4,kB,p),mix(2,TB,p));K.trapbar(E,g,{hi:.1});
    E.shadow([0,0,0],.7,.5,.55);
  }
});

// ═══ CURL CON BARRA Z (ezbar) ════════════════════════════════════════════════
GA.def('demo_ezbar',{
  title:'Demo · barra Z',cam:{yaw:40,pitch:8},muscles:{biceps:1,forearms:.4},labels:['Bíceps'],init:{p:0,act:.5},
  timeline:TL(1.2,2.6,'Sube · codos fijos','Baja'),
  build(c,b,E){const p=c.p,a=mix(22,138,p)*Math.PI/180,G=[],F=[];   // 22° abajo: la barra queda delante de los muslos
    K.stand(b,{fz:.12,kf:4,tilt:2,sp:[-2],hd:4,sc:[-.01,-.015]});
    for(const[s,k]of SS){const u=V.norm([.06,-1,k*.07]),el=V.madd(b.sho(s),u,DM.ua),fz=(k*.1475-el[2])/(DM.fa+DM.grip),q=Math.sqrt(1-fz*fz),f=[q*Math.sin(a),-q*Math.cos(a),fz];
      b.armDir(s,u,f);G.push(b.j(s,'grip'));F.push(f);}
    const ax=V.norm(V.sub(G[0],G[1])),bend=V.norm(V.cross(ax,F[0])),ez=K.ezbar(E,V.madd(V.lerp(G[0],G[1],.5),bend,-.017),ax,{bend});
    SS.forEach(([s],i)=>b.S[s].gripAx=ez.axes.narrow[i]);E.trace('barra',V.add(ez.grips.narrow[0],[0,0,.45]));
    E.shadow([0,0,0],.4,.3,.55);
  }
});

// ═══ SUBIDA AL CAJÓN (box) ═══════════════════════════════════════════════════
GA.def('demo_box',{
  title:'Demo · cajón',cam:{yaw:30,pitch:8},muscles:{quads_R:1,glutes_R:.9},labels:['Cuádriceps','Glúteos'],init:{p:0,act:.5},
  timeline:TL(1.4,2,'Sube · empuja con el talón','Baja'),
  build(c,b,E){const p=c.p,bx=K.box(E,[.36,0,0],[.5,.45,.6]),T=bx.y,q=sst(.45,1,p);
    b.footFlat('R',[.2,T,.11],-6);
    // pie izquierdo: sube casi en vertical (a la altura del cajón al 42 %) y avanza después; la punta salva el borde (x .11) con
    // ≈5 cm. El talón se despega y vuelve a apoyar sin salto (pitch 0 en los extremos; -.008 = hundido de footFlat)
    const LA=[mix(-.3,.2,GA._.EASE.mj(q)),T*sst(0,.42,q)+.06*Math.sin(Math.PI*q),-.11],pit=25*sst(0,.1,q)*(1-sst(.55,1,q));
    if(q<1&&q>0)K.footBallOn(b,'L',[LA[0]+.2,LA[1]-.008,-.11],6,pit);else b.footFlat('L',LA,6);
    const hx=mix(-.02,.26,sst(0,.85,p)),ra=b.j('R','ank'),la=b.j('L','ank');
    const hy=Math.min(ra[1]+Math.sqrt(K.legD(mix(98,5,sst(0,.9,p)))**2-(hx-ra[0])**2-.0005),la[1]+Math.sqrt(Math.max(.01,K.legD(4)**2-(hx-la[0])**2)));
    b.pelvis([hx,hy,0],{tilt:mix(18,3,p)});b.spine(-2);b.head(-mix(14,4,p));K.legs(b,{up:.2});
    for(const[s,k]of SS)b.armFK(s,{flex:k*mix(-12,8,p)+4,abd:8,elbow:mix(30,15,p)});
    E.shadow([.1,0,0],.6,.4,.55);
  }
});

// ═══ SUPERMAN BOCA ABAJO (prone + mat) ═══════════════════════════════════════
GA.def('demo_prone',{
  title:'Demo · boca abajo',cam:{yaw:-30,pitch:16},muscles:{lowback:1,glutes:.7,midback:.5},labels:['Lumbares','Glúteos'],init:{p:0,act:.5},
  timeline:TL(1.2,1.6,'Eleva brazos y piernas','Baja'),
  build(c,b,E){const p=c.p,mt=K.mat(E,[0,0,0],[2,.62]),Y=mt.top,ex=mix(0,20,p);
    K.prone(b,{y:Y,x:0,sp:[-ex],hd:-ex*.5,sc:[0,-.015]});
    // brazos en Y a alcance completo (codo a 6°): en reposo el puño apoya en la esterilla (centro a .045)
    const R=K.armD(6);
    for(const[s,k]of SS){const sh=b.sho(s),hp=b.hip(s),ty=Y+.045+mix(0,.17,p),dz=k*.4-sh[2],dy=ty-sh[1];
      b.arm(s,[sh[0]+Math.sqrt(Math.max(.01,R*R-dz*dz-dy*dy)),ty,k*.4],[0,1,0],[1,0,0]);
      const ly=Y+.075+mix(0,.17,p),lx=-Math.sqrt(K.legD(3)**2-(ly-hp[1])**2-.0001);b.leg(s,[hp[0]+lx,ly,k*.1],[0,-1,0]);b.footRelax(s,62);}
  }
});

// ═══ ALMEJA DE LADO con minibanda (sideLie + miniband + mat) ═════════════════
GA.def('demo_side',{
  title:'Demo · de lado',cam:{yaw:14,pitch:26},muscles:{abductors_R:1,glutes_R:.7},labels:['Glúteo medio'],init:{p:0,act:.5},
  timeline:TL(1,1.6,'Abre la rodilla','Cierra'),
  build(c,b,E){const p=c.p,mt=K.mat(E,[0,0,0],[1.8,.7]),Y=mt.top,rd=x=>x*Math.PI/180;
    K.sideLie(b,{down:'L',dir:1,y:Y,x:0,hd:'rest',headY:Y+.085,sc:[0,0]});
    // pierna de abajo apoyada: cadera 45°, rodilla 95° (ángulos en el plano del suelo)
    // la componente y de la tibia se resuelve para que el canto de la zapatilla apoye justo en la esterilla
    const hl=b.hip('L'),kn=[hl[0]-.44*Math.cos(rd(45)),Y+.06,hl[2]+.44*Math.sin(rd(45))];
    const shin=dy=>{b.legDir('L',V.sub(kn,hl),[-Math.cos(rd(50)),dy,-Math.sin(rd(50))]);b.footRelax('L',20);
      return Math.min(...K.shoe(b.j('L','ank'),b.S.L.ffwd,b.S.L.fup).map(e=>K.gap(e,[0,Y,0],[0,1,0])));};
    shin(K.memo(this,'dy',()=>K.root(shin,-.3,.3)));
    const la=b.j('L','ank'),up=[0,1,0],kd=V.norm(V.sub(b.j('L','kne'),b.hip('L')));
    b.leg('R',V.add(la,[0,.1,0]),V.norm(V.lerp(V.perp(kd,up),up,mix(.05,.75,p))));b.footRelax('R',20);
    // brazo de abajo estirado bajo la cabeza; el de arriba apoyado en la cadera
    const sl=b.sho('L');b.arm('L',[sl[0]+.58,Y+.045,sl[2]+.08],[0,1,0],[0,0,1]);
    b.arm('R',V.add(b.hip('R'),[.05,.08,.05]),[-.3,.2,.8],[1,0,0]);
    const at=s=>V.lerp(b.j(s,'kne'),b.hip(s),.2),ax=s=>V.sub(b.j(s,'kne'),b.hip(s));K.miniband(E,at('R'),at('L'),{axis:[ax('R'),ax('L')],r:.066});
  }
});

// ═══ ELEVACIÓN FRONTAL CON DISCO (plate) ═════════════════════════════════════
GA.def('demo_plate',{
  title:'Demo · disco',cam:{yaw:52,pitch:8},muscles:{frontdelts:1},labels:['Deltoides ant.'],init:{p:0,act:.5},
  timeline:TL(1.3,2.2,'Sube a la altura de los ojos','Baja'),
  build(c,b,E){const p=c.p,r=.225,R=K.armD(8),th=mix(12,98,p)*Math.PI/180;
    K.stand(b,{fz:.13,kf:5,tilt:mix(2,-3,p),sp:[-2],hd:2,sc:[-.01,.0]});
    const sm=V.lerp(b.sho('R'),b.sho('L'),.5),hz=r-.02,dz=hz-(b.sho('R')[2]-sm[2]),Rp=Math.sqrt(R*R-dz*dz),cc=[sm[0]+Rp*Math.sin(th),sm[1]-Rp*Math.cos(th),0];
    for(const[s,k]of SS)b.arm(s,V.add(cc,[0,0,k*hz]),[-.3,-.2,k],[0,1,0]);
    K.plate(E,V.add(cc,[.0,0,0]),[1,0,0],{r,th:.04});E.trace('disco',V.add(cc,[0,r,0]));
    E.shadow([0,0,0],.4,.3,.55);
  }
});

// ═══ SENTADILLA CON BALÓN DE PARED (wall + medball wall) ═════════════════════
GA.def('demo_wall',{
  title:'Demo · pared y balón',cam:{yaw:22,pitch:6},fitBox:[[-.55,0,-.6],[.95,2.0,.6]],muscles:{quads:1,glutes:.8,frontdelts:.4},labels:['Cuádriceps','Glúteos'],init:{p:0,act:.5},
  timeline:TL(1.6,1,'Baja con el balón al pecho','Sube'),
  build(c,b,E){const p=c.p,r=.17;let mc=[.3,1.2,0];
    const arms=b=>{mc=b.tpt(0,-.16,.115+r+.02);const mb=K.medball(E,mc,r,{kind:'wall'});for(const[s,k]of SS)b.arm(s,mb.palm(V.norm(V.add(b.tdir(0,-.6,0),[0,0,k]))),[-.2,-1,k*.5],[1,0,0]);};
    const pose=()=>K.stand(b,{fz:.2,toe:18,kf:mix(5,112,p),tilt:mix(3,30,p),sp:[-3],hd:-mix(0,12,p),sc:[0,.02],balance:true,arms:b=>{mc=b.tpt(0,-.16,.115+r+.02);},xm:()=>[[mc,.08]]});
    pose();arms(b);K.wall(E,{x:1.0,target:3.05,h:3.3});
    E.shadow([0,0,0],.5,.4,.55);
  }
});

// ═══ FLEXIÓN INCLINADA: manos en un banco (plank hy + box bench) ═════════════
GA.def('demo_pushup_incline',{
  title:'Demo · flexión inclinada',cam:{yaw:30,pitch:12},muscles:{lowerpecs:1,triceps:.6},labels:['Pectoral inf.','Tríceps'],init:{p:0,act:.5},
  timeline:TL(1.8,1,'Baja al banco','Empuja'),
  build(c,b,E){const pl=K.plank(b,E,{xT:-1.15,hy:.45,p:c.p,k:K.memo(this,'pl',()=>({}))});
    // borde trasero del banco 3 cm detrás del centro de las palmas: abajo la pelvis y los muslos pasan por detrás
    K.box(E,[pl.hands.R[0]+.18,0,0],[.42,.45,1.1],{kind:'bench'});E.shadow([-.3,0,0],.9,.4,.5);}
});

// ═══ FLEXIÓN DE RODILLAS (plank knees + mat) ═════════════════════════════════
GA.def('demo_pushup_knees',{
  title:'Demo · flexión de rodillas',cam:{yaw:30,pitch:14},muscles:{pecs:1,triceps:.6},labels:['Pectoral','Tríceps'],init:{p:0,act:.5},
  timeline:TL(1.8,1,'Baja','Empuja'),
  build(c,b,E){const mt=K.mat(E,[-.05,0,0],[1.4,.62]);K.plank(b,E,{knees:true,xT:-.45,fy:mt.top,hy:mt.top,p:c.p,k:K.memo(this,'pl',()=>({}))});E.shadow([-.1,0,0],.7,.35,.5);}
});

// ═══ PLANCHA DE ANTEBRAZOS (plank forearm) ═══════════════════════════════════
GA.def('demo_plank_forearm',{
  title:'Demo · plancha',cam:{yaw:32,pitch:10},muscles:{abs:1,obliques:.5},labels:['Abdomen','Oblicuos'],init:{p:0,act:1},
  timeline:[{p:1,dur:2,label:'Mantén · inhala',act:.85,ease:'sin'},{p:0,dur:2,label:'Mantén · exhala',act:1,ease:'sin'}],
  build(c,b,E){const mt=K.mat(E,[-.4,0,0],[2,.62]);K.plank(b,E,{forearm:true,xT:-1.3,fy:mt.top,hy:mt.top,p:c.p,pr:[.02,.04],k:K.memo(this,'pl',()=>({}))});E.shadow([-.4,0,0],1,.3,.5);}
});

// ═══ SENTADO EN CAJÓN: press con kettlebell por los cuernos (seat + box + horns) ═
GA.def('demo_seat_box',{
  title:'Demo · sentado en cajón',cam:{yaw:36,pitch:10},muscles:{frontdelts:1,triceps:.6},labels:['Deltoides','Tríceps'],init:{p:0,act:.5},
  timeline:TL(1.3,2,'Empuja arriba','Baja al pecho'),
  build(c,b,E){const p=c.p,kg=16,bx=K.box(E,[-.05,0,0],[.4,.45,.4]);
    K.seat(b,[0,bx.y,0],{tilt:2,sp:[-3],hd:mix(-2,6,p),sc:[mix(0,.03,p),.01],feet:{x:.42,z:.2,toe:12}});
    // la bola sube por delante de la cara (arco en +x) y acaba delante y por encima de la cabeza
    const sm=V.lerp(b.sho('R'),b.sho('L'),.5),h0=b.tpt(0,-.06,.27),h1=V.add(sm,[.13,.6,0]),e=GA._.EASE.sin(p),h=V.add(V.lerp(h0,h1,e),[.12*Math.sin(Math.PI*e),0,0]);
    const kb=K.kettlebell(E,h,{kg,ax:[0,0,1]});
    for(const[s,k]of SS)b.arm(s,kb.horns[s==='R'?0:1],[-.3,-1,k*.7],[0,1,0]);
    E.shadow([0,0,0],.5,.4,.55);
  }
});

// ═══ GALERÍAS (sin persona): variantes de equipamiento ═══════════════════════
GA.def('demo_gallery_a',{
  title:'Demo · galería A',cam:{yaw:38,pitch:16},init:{p:0},timeline:[{dur:2,label:'Jaula · barra · cajones · balones · banda'}],
  build(c,b,E){b.hidden=true;const rk=K.rack(E,{x:.3,depth:1.1,h:2.3,hook:1.4,safety:.85});K.barbell(E,rk.bar,[0,0,1],{plates:[{r:.225,col:'#7a2f2a'},.17]});
    K.box(E,[-.9,0,.75],[.6,.25,.35],{kind:'step'});K.box(E,[-.9,0,-.7],[.5,.5,.6],{kind:'soft'});K.box(E,[-1.6,0,0],[.5,.6,.6],{kind:'wood',yaw:20});
    K.medball(E,[-.5,.12,0],.12,{kind:'slam'});K.medball(E,[-.5,.17,.45],.17,{kind:'wall'});K.medball(E,[-.5,.11,-.4],.11);
    K.band(E,[.3,1.1,.6],[-.4,1.0,1.0],{loop:true,col:K.BAND.purple});K.kettlebell(E,[-1.2,K.kbFloorH(32),.9],{kg:32});K.kettlebell(E,[-1.2,K.kbFloorH(8),1.15],{kg:8});
    E.shadow([0,0,0],1.6,1,.4);}
});
GA.def('demo_gallery_b',{
  title:'Demo · galería B',cam:{yaw:32,pitch:12},init:{p:0},timeline:[{dur:2,label:'Torre de dominadas · TRX con cunas · paralelas'}],
  build(c,b,E){b.hidden=true;K.pullupBar(E,{x:0,kind:'tower',neutral:.27});K.trx(E,[0,2.3,.0],[.55,.35,.1],[.55,.35,-.1],{feet:true});
    K.dipStation(E,{x:-1.3,y:1.2});K.abWheel(E,[1,.09,-.15],[0,0,1]);K.landmine(E,[1.6,.05,-.6],[.4,.2,-.6]);K.sled(E,[1.2,0,.9],{plates:1,yaw:90});
    E.shadow([0,0,0],1.6,1,.4);}
});

})(window.GymAnim);
