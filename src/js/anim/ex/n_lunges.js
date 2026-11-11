/* ex/n_lunges.js */
/* Zancadas y unilaterales de pierna: estáticas, frontales, inversas, caminando, laterales, cruzadas, búlgaras, subidas, TRX, banda, Smith */
(function(GA){
const K=GA._.kit,V=GA._.V,C=GA._.COL,DM=GA._.DIM,SS=K.SS,mix=K.mix,sst=K.sst,PI=Math.PI,sd=K.sd,sin=Math.sin;
const FT=(b,s,f)=>K.footBallOn(b,s,[f[0],f[3]||0,f[1]],f[4]||0,f[2]||0);
const HL=(b,s,x,z,yw,a)=>{const f0=V.yaw(yw),sv=V.norm(V.cross([0,1,0],f0));return K.footOn(b,s,[x,0,z],V.rot(f0,sv,-a*K.D),V.rot([0,1,0],sv,-a*K.D));};
const PO=(b,h,o)=>{b.pelvis(h,{tilt:o.tl||0,yaw:o.yw||0,roll:o.rl||0});b.spine(o.sp==null?-2:o.sp);b.head(o.hd==null?-(o.tl||0)*.5:o.hd);
  b.scap('both',-.008,-.01);for(const[s,k]of SS)b.leg(s,null,o.pl&&o.pl[s]||[1,.15,k*.1]);};
const reach=(b,s,kf,h)=>{const a=b.j(s,'ank'),dx=h[0]-a[0],dz=(h[2]||0)+sd(s)*DM.hipW-a[2];return a[1]+Math.sqrt(Math.max(.01,K.legD(kf)**2-dx*dx-dz*dz));};
const U=(m,r)=>{const o={};for(const k in m){o[k+'_R']=m[k];o[k+'_L']=+(m[k]*(r||.6)).toFixed(2);}return o;};
const TL=(a,b,l1,l2,l3)=>[{p:1,dur:a,label:l1,act:.85},{dur:.3,label:l2,act:.9},{p:0,dur:b,label:l3,act:1},{dur:.5,label:'Arriba · torso erguido',act:.5}];

const SPLIT=(ctx,b,p,o)=>{const f=o.f||'R',k=sd(f),r=f==='R'?'L':'R',z=o.z||.11;
  const ft=q=>{FT(b,f,[o.F,k*z,0]);if(o.rf)o.rf(b,r,q);else FT(b,r,[o.B,k*(o.zb==null?-z:o.zb),mix(o.pt[0],o.pt[1],q),0,k*(o.yb||0)]);};
  const po=(h,q)=>PO(b,h,Object.assign({},o,{tl:mix(o.tl[0],o.tl[1],q),pl:{[f]:[1,.2,k*.1],[r]:o.pr||[.4,-1,0]}}));
  const g=K.memo(ctx,'sp',()=>{ft(0);const x0=o.hx[0],h0=[x0,Math.min(reach(b,f,o.kt||5,[x0]),reach(b,r,8,[x0])),0];
    ft(1);const x1=o.hx[1],y1=o.hb||K.root(y=>{po([x1,y,0],1);return b.j(r,'kne')[1]-(o.kb||.1);},.3,.85);return[h0,[x1,y1,0]];});
  ft(p);b.ikErr=0;po(V.lerp(g[0],g[1],p),p);return g;};

const STEP=(ctx,b,c,o)=>{const g=SPLIT(ctx,b,c.p,o);if(c.s>=.999)return;
  const q=c.s,fw=o.mv==='f',z=o.z||.11,st=fw?'L':'R',sw=fw?'R':'L',x0=fw?o.B:o.F,pr=mix(o.pt[0],o.pt[1],c.p),P1=fw?[o.F,z,0,0,0]:[o.B,o.zb==null?-z:o.zb,pr,0,o.yb||0];
  FT(b,st,fw?[o.B,-z,pr*sst(.4,1,q)]:[o.F,z,0]);
  const cx=o.zb!=null;FT(b,sw,[mix(x0,P1[0],cx?sst(0,.75,q):q),mix(fw?.1:-.1,P1[1],cx?sst(.5,1,q):q),mix(0,P1[2],q)+(fw?22*sin(2*PI*q):14*sin(PI*q)),.09*sin(PI*q),P1[4]*q]);
  const h=V.lerp([x0-.115,.94,0],V.lerp(g[0],g[1],c.p),sst(0,1,q));h[1]=Math.min(h[1],reach(b,st,3,h));b.ikErr=0;
  const rp=V.lerp([1,.2,0],o.pr||[.4,-1,0],sst(.3,1,q));PO(b,h,Object.assign({},o,{tl:mix(o.tl[0],o.tl[1],c.p),pl:{[sw]:fw?[1,.2,.1]:rp,[st]:fw?rp:[1,.2,.1]}}));};

const WALK=(ctx,b,E,c,o)=>{const w=c.w%2,n=w<1?0:1,q=w-n,f=n?'L':'R',r=n?'R':'L',k=sd(f),z=o.z||.11,S=o.F-o.B;
  const g=SPLIT(ctx,b,c.p,Object.assign({},o,{f}));
  if(q>.001){FT(b,f,[o.F-S*q,k*z,o.pt[0]*sst(.45,1,q)]);
    FT(b,r,[o.B+S*q,-k*z,mix(o.pt[0],0,sst(0,.5,q))-16*sin(PI*sst(.5,1,q)),.11*sin(PI*q)]);
    const h=g[0].slice();h[1]=Math.min(h[1]+.1*sin(PI*q),reach(b,f,3,h));b.ikErr=0;PO(b,h,Object.assign({},o,{tl:o.tl[0],pl:{[f]:[1,.1,0],[r]:[1,.3,0]}}));}
  for(let i=-4;i<=4;i++){const x=(i-2*q%1)*S/2;E.line([x,.002,-.5],[x,.002,.5],.006,'#cfd8e0',{alpha:.22*Math.max(0,1-Math.abs(x)/1.5),layer:-1});}};

const LAT=(b,c)=>{const k=c.s<0?-1:1,s=k>0?'R':'L',t=k>0?'L':'R',q=Math.abs(c.s),p=c.p,W=.9;
  FT(b,t,[.15,-k*.1,0,0,k*8]);FT(b,s,[mix(.15,.2,q),k*mix(.1,W,q),22*sin(2*PI*q)*(q<1),.08*sin(PI*q),-k*mix(8,20,q)]);
  const h=[mix(0,-.2,p),0,k*mix(mix(0,.38,q),.62,p)];h[1]=Math.min(.94,reach(b,t,3,h),reach(b,s,3,h));b.ikErr=0;
  PO(b,h,{tl:mix(4,38,sst(0,.6,p)),hd:-mix(2,20,sst(0,.6,p)),pl:{[s]:[1,.1,k*.4*q],[t]:[1,.2,0]}});return k;};

const DBS=(b,E,W)=>{W=W||.25;const R=K.armD(5);for(const[s,k]of SS){const sh=b.sho(s),dz=W-Math.abs(sh[2]-b.pf.o[2]),g=[sh[0]+.01,sh[1]-Math.sqrt(R*R-dz*dz),b.pf.o[2]+k*W];
  b.arm(s,g,[-1,0,k*.25],[1,0,0]);E.dumbbell(g,[1,0,0],{r:.058,hl:.055,len:.13});}};
const OUT=(b,g,F)=>{for(const s of['R','L']){const A=b.hip(s),ab=V.sub(b.j(s,'kne'),A);for(const dx of[-.12,0,.12]){const P=[g[0]+dx,g[1],g[2]],u=K.clamp(V.dot(V.sub(P,A),ab)/V.dot(ab,ab),0,1),
  d=V.sub(P,V.madd(A,ab,u)),L=V.len(d),cl=.158-.028*u;if(L<cl){const h=V.norm([d[0]+(F?.2:0),0,d[2]]);g[0]+=h[0]*(cl-L);g[2]+=h[2]*(cl-L);}}}};
const BAR=b=>{const c=b.tpt(0,-.03,-.064);for(const[s,k]of SS)b.arm(s,[c[0],c[1],k*.42],[-.45,-1,k*.3],[0,0,1]);return c;};
const BB=(b,E)=>{const c=BAR(b);K.barbell(E,c,[0,0,1],{plates:[.225]});};
const HIPS=b=>{for(const[s,k]of SS)b.arm(s,b.ppt(k*.19,.1,.01),[-.5,0,k],[0,1,0]);};
const CLASP=(b,u,f)=>{for(const[s,k]of SS)b.arm(s,b.tpt(k*.035,u||-.22,f||.34),[-.2,-1,k*.6],[0,1,0]);};
const SMITH=(E,c)=>{const X=c[0],Y=c[1];for(const k of[-1,1]){E.beam([X,0,k*.62],[X,2.1,k*.62],.06,C.frame);E.beam([X-.5,.03,k*.62],[X+.55,.03,k*.62],.07,C.frameD,{layer:-1});
    E.boxA([X,Y,k*.62],[.1,.13,.1],C.frameD);E.cyl([X,Y,k*.66],[X,Y,k*.69],.04,C.chrome);E.plate([X,Y,k*.725],[0,0,1],.225);}
  E.beam([X,2.1,-.65],[X,2.1,.65],.07,C.frame);E.bar([X,Y,-.95],[X,Y,.95],{r:.0145});};
const BENCH=(E,x)=>K.box(E,[x,0,0],[1.1,.45,.3],{kind:'bench',yaw:90});
const ONB=(X,Y)=>(b,s)=>K.footOn(b,s,[X,Y,sd(s)*.11],[-1,-.3,0],[0,-1,0]);

const SQ={F:.58,B:-.5,pt:[42,62],hx:[0,-.02],tl:[3,8]};
GA.def('lib_split_squat_db',{
  title:'Zancada estática con mancuernas',cam:{yaw:30,pitch:8},
  muscles:U({quads:1,glutes:.8,adductors:.4,hams:.3}),labels:['Cuádriceps','Glúteos'],init:{p:0,act:.5},
  timeline:TL(2,1.3,'Baja la rodilla trasera','Casi al suelo','Sube con el talón'),
  build(c,b,E){SPLIT(this,b,c.p,SQ);DBS(b,E);E.shadow([0,0,0],.7,.35,.5);}
});
GA.def('lib_lunge_smith',{
  title:'Zancada en Smith',cam:{yaw:48,pitch:8},fitBox:[[-.7,0,-.4],[.7,1.75,.4]],
  muscles:U({quads:1,glutes:.8,adductors:.4,hams:.3}),labels:['Cuádriceps','Glúteos'],init:{p:0,act:.5},
  timeline:TL(2,1.3,'Baja · pies fijos','Rodilla casi al suelo','Sube con el talón'),
  build(c,b,E){SPLIT(this,b,c.p,{F:.58,B:-.5,pt:[42,62],hx:[-.01,-.01],tl:[4,4],sp:-3});const c0=BAR(b);SMITH(E,c0);E.shadow([0,0,0],.7,.35,.5);}
});
GA.def('lib_band_lunge',{
  title:'Zancada con banda elástica',cam:{yaw:30,pitch:8},
  muscles:U({quads:1,glutes:.8,hams:.3,adductors:.3}),labels:['Cuádriceps','Glúteos'],init:{p:0,act:.5},
  timeline:TL(2,1.2,'Baja la rodilla trasera','Abajo · sin rebotar','Sube con el talón'),
  build(c,b,E){SPLIT(this,b,c.p,SQ);const H=[];
    for(const[s,k]of SS){H.push(b.tpt(k*.22,-.04,.12));b.arm(s,H[H.length-1],[.1,-1,k*.5],[0,0,1]);}
    const a=b.j('R','ank'),m=[a[0]+.04,.004,a[2]];
    SS.forEach(([s,k],i)=>K.band(E,[m,V.add(m,[0,0,k*.06]),b.j(s,'grip')],null,{handle:[0,0,1],col:K.BAND.green,L0:.8}));
    E.shadow([0,0,0],.7,.35,.5);}
});

const BG={F:.48,B:0,hx:[-.12,-.1],tl:[6,14],hb:.56,kt:8,pr:[.3,-1,0],rf:ONB(-.62,.45)};
const bulg=(t,cam,mus,load,fit,o)=>({title:t,cam,fitBox:fit,muscles:U(mus),labels:['Cuádriceps','Glúteos'],init:{p:0,act:.5},
  timeline:TL(2.2,1.3,'Baja vertical','Muslo paralelo','Empuja con el talón'),
  build(c,b,E){SPLIT(this,b,c.p,Object.assign({},BG,o));load(b,E);BENCH(E,-.72);E.shadow([-.1,0,0],.75,.35,.5);}});
const BGM={quads:1,glutes:.9,adductors:.4,hams:.3},LM={quads:1,glutes:.8,adductors:.4,hams:.3};
GA.def('lib_bulgarian_squat_db',bulg('Sentadilla búlgara con mancuernas',{yaw:30,pitch:8},BGM,DBS));
GA.def('lib_bulgarian_bw',bulg('Sentadilla búlgara con peso corporal',{yaw:30,pitch:8},{quads:1,glutes:.85,adductors:.4,hams:.25},HIPS));
GA.def('lib_bulgarian_bb',bulg('Sentadilla búlgara con barra',{yaw:34,pitch:8},BGM,BB,[[-.95,0,-.45],[.7,1.8,.45]]));
GA.def('lib_bulgarian_smith',bulg('Sentadilla búlgara en Smith',{yaw:48,pitch:8},BGM,(b,E)=>SMITH(E,BAR(b)),[[-.95,0,-.4],[.7,1.75,.4]],{tl:[6,6],hx:[-.11,-.11],sp:-3}));

const GOB=(b,E)=>{const kb=K.kettlebell(E,b.tpt(0,-.14,.24),{kg:16});SS.forEach(([s,k],i)=>b.arm(s,kb.horns[i],[0,-1,k*.4],[0,1,0]));};
const LG=(a,d,l)=>[{s:1,p:.3,dur:.9,label:a,act:.75},{p:1,dur:1.2,label:l||'Baja la rodilla trasera',act:.85},{dur:.25,label:'Casi al suelo',act:.9},{p:.25,dur:.7,label:'Empuja con el talón',act:1},{s:0,p:0,dur:.8,label:d,act:.7},{dur:.4,label:'De pie · torso erguido',act:.5}];
const LF=Object.assign({mv:'f'},SQ),LR=Object.assign({mv:'r'},SQ),CU={mv:'r',F:.45,B:-.32,zb:.24,pt:[40,58],hx:[0,-.03],tl:[4,10],kb:.15};
const lunge=(t,o,mus,load,lb,cam,fit)=>({title:t,cam:cam||{yaw:30,pitch:8},fitBox:fit,muscles:U(mus),labels:lb||['Cuádriceps','Glúteos'],init:{p:0,s:0,act:.5},
  timeline:o===LF?LG('Paso largo al frente','Vuelve atrás'):o===LR?LG('Paso largo atrás','Vuelve al frente'):LG('Pie atrás y cruzado','Vuelve al centro','Baja · cadera de frente'),
  build(c,b,E){STEP(this,b,c,o);load(b,E);E.shadow([0,0,0],.7,.35,.5);}});
GA.def('lib_lunge_db',lunge('Zancada frontal con mancuernas',LF,LM,DBS));
GA.def('lib_reverse_lunge_db',lunge('Zancada inversa con mancuernas',LR,{quads:1,glutes:.9,hams:.4,adductors:.4},DBS));
GA.def('lib_forward_lunge_bw',lunge('Zancada frontal con peso corporal',LF,{quads:1,glutes:.8,adductors:.35,hams:.25},HIPS));
GA.def('lib_reverse_lunge_bw',lunge('Zancada inversa con peso corporal',LR,{quads:1,glutes:.9,adductors:.35,hams:.3},HIPS));
GA.def('lib_lunge_bb',lunge('Zancada con barra',LF,{quads:1,glutes:.9,adductors:.4,hams:.3},BB,0,{yaw:34,pitch:8},[[-.75,0,-.45],[.75,1.8,.45]]));
GA.def('lib_kb_lunge',lunge('Zancada con kettlebell',LF,LM,GOB));
const CL=['Glúteos','Cuádriceps','Glúteo medio'];
GA.def('lib_curtsy_lunge_db',lunge('Zancada cruzada con mancuernas',CU,{glutes:1,quads:.9,abductors:.5,adductors:.5},DBS,CL,{yaw:58,pitch:10}));
GA.def('lib_curtsy_lunge_bw',lunge('Zancada cruzada con peso corporal',CU,{glutes:1,quads:.8,abductors:.5,adductors:.35},b=>CLASP(b),CL,{yaw:58,pitch:10}));

const WT=[];for(const l of[1,2])WT.push({p:1,dur:1.3,label:'Baja la rodilla trasera',act:.85},{dur:.2,label:'Casi al suelo',act:.9},{p:0,dur:.8,label:'Empuja con el talón',act:1},{w:l,dur:.9,label:'Pasa el pie al frente',act:.6});
const walk=(t,mus,load)=>({title:t,cam:{yaw:30,pitch:10},fitBox:[[-.75,0,-.5],[.75,1.85,.5]],muscles:mus,labels:['Cuádriceps','Glúteos'],init:{p:0,w:0,act:.6},timeline:WT,
  build(c,b,E){WALK(this,b,E,c,SQ);load(b,E);E.shadow([0,0,0],.7,.35,.5);}});
GA.def('lib_walking_lunge_db',walk('Zancada caminando con mancuernas',{quads:1,glutes:.9,adductors:.4,hams:.4,calves:.3},DBS));
GA.def('lib_walking_lunge_bw',walk('Zancada caminando con peso corporal',{quads:1,glutes:.85,adductors:.35,hams:.3},HIPS));

const LL=[{s:1,dur:.8,label:'Paso amplio al lado',act:.7},{p:1,dur:1.5,label:'Cadera atrás · pie plano',act:.85},{dur:.3,label:'Otra pierna estirada',act:.9},{p:0,dur:1,label:'Empuja para volver',act:1},{s:0,dur:.7,label:'Junta los pies',act:.6}];
GA.def('lib_lateral_lunge_db',{
  title:'Zancada lateral con mancuernas',cam:{yaw:62,pitch:10},
  muscles:U({quads:1,adductors:.8,glutes:.8,hams:.3}),labels:['Cuádriceps','Aductores','Glúteos'],init:{p:0,s:0,act:.5},
  timeline:LL.concat({dur:.4,label:'De pie',act:.5}),
  build(c,b,E){const k=LAT(b,c),p=c.p,R=K.armD(5),kn=b.j(k>0?'R':'L','kne'),tr=k>0?'L':'R';
    for(const[s,kk]of SS){const sh=b.sho(s),g=[sh[0]+.01,0,mix(b.pf.o[2]+kk*.25,kn[2]+kk*.15,p)],Y=()=>g[1]=Math.max(.1,sh[1]-Math.sqrt(Math.max(.01,R*R-(g[0]-sh[0])**2-(g[2]-sh[2])**2)));
      for(let i=0;i<5;i++){Y();OUT(b,g,s===tr);}Y();
      b.arm(s,g,[-1,0,kk*.25],[1,0,0]);E.dumbbell(g,[1,0,0],{r:.058,hl:.055,len:.13});}
    E.shadow([0,0,.4],.5,.8,.5);}
});
GA.def('lib_side_lunge_bw',{
  title:'Zancada lateral con peso corporal',cam:{yaw:70,pitch:10},
  muscles:{quads:1,glutes:.7,adductors:.7},labels:['Cuádriceps','Aductores','Glúteos'],init:{p:0,s:0,act:.5},
  timeline:LL.concat(LL.map(x=>x.s?{s:-1,dur:.8,label:x.label,act:.7}:x)),
  build(c,b,E){LAT(b,c);CLASP(b,-.25,.4);E.shadow([0,0,0],.5,.9,.5);}
});
GA.def('lib_cossack_squat',{
  title:'Sentadilla cosaca',cam:{yaw:72,pitch:10},
  muscles:{adductors:1,quads:.8,glutes:.7},labels:['Aductores','Cuádriceps','Glúteos'],init:{p:0,act:.5},
  timeline:[{p:1,dur:2,label:'Baja a un lado · talón abajo',act:.85},{dur:.3,label:'Pierna estirada · punta arriba',act:.9},{p:0,dur:1.3,label:'Sube · pecho alto',act:1},{dur:.3,label:'Centro',act:.5},
    {p:-1,dur:2,label:'Baja al otro lado',act:.85},{dur:.3,label:'Pecho alto',act:.9},{p:0,dur:1.3,label:'Sube',act:1},{dur:.3,label:'Centro',act:.5}],
  build(c,b,E){const k=c.p<0?-1:1,s=k>0?'R':'L',t=k>0?'L':'R',q=Math.abs(c.p),W=.5,TO=22;
    HL(b,s,0,k*W,-k*TO,0);const h=[mix(0,-.12,q),0,k*mix(0,.4,q)],a=mix(0,72,sst(.3,1,q));HL(b,t,0,-k*W,k*TO*(1-q),a);
    h[1]=Math.min(reach(b,t,2,h),reach(b,s,4,h));b.ikErr=0;
    b.pelvis(h,{tilt:mix(4,30,q)});b.spine(-3);b.head(-mix(2,22,q));b.scap('both',-.008,0);b.leg(s,null,V.add(V.yaw(-k*TO),[0,.2,0]));b.leg(t,null,[a/72,1,-k*.3]);
    CLASP(b,-.25,.38);E.shadow([0,0,0],.5,.8,.5);}
});

const SUP=(b,c,X,T)=>{const p=c.p,q=sst(.1,1,p),pt=mix(26*sst(0,.15,p),0,sst(.6,1,q)),r=pt*K.D;
  FT(b,'L',[X+.13,-.11,0,T]);const Ab=b.j('L','ank').slice();FT(b,'L',[-.25,-.11,pt]);const Af=b.j('L','ank').slice();FT(b,'R',[X+.13,.11,0,T]);
  const h=[mix(-.08,X-.02,sst(0,.85,p)),0,0];h[1]=reach(b,'R',mix(102,3,sst(0,.9,p)),h);b.ikErr=0;
  PO(b,h,{tl:mix(16,3,p),hd:-mix(10,3,p),pl:{R:[1,.3,.1],L:[1,.2,0]}});
  let A=[mix(Af[0],Ab[0],sst(.3,1,q)),mix(Af[1],Ab[1],sst(0,.6,q))+.08*sin(PI*q),Af[2]];const hp=b.hip('L'),d=V.sub(A,hp);
  const lm=K.legD(mix(25,5,sst(.75,1,q))+35*sin(PI*Math.min(1,q/.8)));if(V.len(d)>lm)A=V.madd(hp,V.norm(d),lm);b.ikErr=0;b.foot('L',A,[Math.cos(r),-Math.sin(r),0],[Math.sin(r),Math.cos(r),0]);b.leg('L',null,[1,.2,0]);};
const SUT=[{p:1,dur:1.3,label:'Sube con la pierna de arriba',act:1},{dur:.4,label:'Arriba · cadera extendida',act:.8},{p:0,dur:1.8,label:'Baja controlado',act:.75},{dur:.4,label:'Abajo · pie entero arriba',act:.55}];
GA.def('lib_step_up_db',{
  title:'Subida al banco con mancuernas',cam:{yaw:32,pitch:8},
  muscles:U({quads:1,glutes:.9,hams:.3,calves:.3}),labels:['Cuádriceps','Glúteos'],init:{p:0,act:.55},timeline:SUT,
  build(c,b,E){K.box(E,[.38,0,0],[.5,.45,.6]);SUP(b,c,.38,.45);DBS(b,E);E.shadow([.1,0,0],.6,.45,.5);}
});
GA.def('lib_step_up_bw',{
  title:'Subida al banco con peso corporal',cam:{yaw:32,pitch:8},
  muscles:U({quads:1,glutes:.9,hams:.3,calves:.25}),labels:['Cuádriceps','Glúteos'],init:{p:0,act:.55},timeline:SUT,
  build(c,b,E){BENCH(E,.43);SUP(b,c,.38,.45);
    for(const[s,k]of SS)b.armFK(s,{flex:k*mix(-22,10,c.p)+6,abd:7,elbow:mix(35,15,c.p)});E.shadow([.1,0,0],.6,.45,.5);}
});
GA.def('lib_box_lateral_step_down',{
  title:'Bajada lateral desde el step',cam:{yaw:125,pitch:12},fitBox:[[-.35,0,-.35],[.45,2.03,.4]],
  muscles:U({quads:1,glutes:.6,abductors:.35},.3),labels:['Cuádriceps','Glúteos','Glúteo medio'],init:{p:0,act:.5},
  timeline:[{p:1,dur:2.2,label:'Baja el talón al suelo',act:.85},{dur:.25,label:'Roza sin apoyar',act:.9},{p:0,dur:1.3,label:'Sube con la pierna de apoyo',act:1},{dur:.5,label:'Rodilla alineada con el pie',act:.5}],
  build(c,b,E){const T=.25,p=c.p;K.box(E,[.05,0,.17],[.95,T,.38],{kind:'step'});FT(b,'R',[.16,.06,0,T,-4]);
    const pose=(y,q)=>{b.pelvis([-.03,y,-.03],{tilt:mix(4,22,sst(0,1,q))});b.spine(-2);b.head(-mix(2,14,q));b.scap('both',-.008,0);
      b.leg('R',null,[1,.25,.05]);b.legFK('L',{flex:mix(4,26,q),knee:mix(10,4,q),abd:mix(3,8,q)});b.footRelax('L',-mix(0,14,q));};
    const yb=K.memo(this,'yb',()=>K.root(y=>{pose(y,1);return Math.min(...K.shoe(b.j('L','ank'),b.S.L.ffwd,b.S.L.fup).map(e=>K.gap(e,[0,0,0],[0,1,0])));},.6,1.1));
    const y0=reach(b,'R',3,[-.03,0,-.03]);b.ikErr=0;pose(mix(y0,yb,p),p);
    for(const[s,k]of SS)b.armFK(s,{flex:mix(10,62,p),abd:mix(8,4,p),elbow:mix(20,8,p)});E.shadow([0,0,0],.55,.5,.5);}
});

const TA=[-.4,2.3,-.11],TS=1.806,tc=q=>{const a=mix(4.6,14.3,q)*K.D;return[TA[0]-TS*Math.sin(a),TA[1]-TS*Math.cos(a),TA[2]];};
GA.def('lib_trx_lunge',{
  title:'Zancada suspendida en TRX',cam:{yaw:30,pitch:8},fitBox:[[-.95,0,-.5],[.75,1.85,.5]],
  muscles:U({quads:1,glutes:.8,hams:.3,adductors:.3}),labels:['Cuádriceps','Glúteos'],init:{p:0,act:.5},
  timeline:TL(2.2,1.3,'Baja · el pie se va atrás','Muslo paralelo','Empuja con el talón'),
  build(c,b,E){SPLIT(this,b,c.p,{F:.5,hx:[-.1,-.12],tl:[5,12],hb:.56,kt:8,pr:[.3,-1,0],rf:(b,s,q)=>{const P=tc(q);K.footOn(b,s,[P[0]+.078,P[1],P[2]],[-1,-.35,0],[0,-1,0]);}});
    HIPS(b);const P=tc(c.p),d=V.norm(V.sub(TA,P)),h=V.madd(P,d,-.02);K.trx(E,TA,h,h,{feet:true});E.shadow([0,0,0],.7,.35,.5);}
});

})(window.GymAnim);
