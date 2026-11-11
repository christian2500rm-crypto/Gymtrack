/* Familia core en el suelo: crunches (libre, mancuerna, disco, inverso, bicicleta), sit-ups (suelo, declinado), V-up,
   elevación de piernas, tijeras, hollow, dead bug, dragon flag, bird dog, toques de talones */
(function(GA){
const K=GA._.kit,V=GA._.V,C=GA._.COL,SS=K.SS,mix=K.mix,sst=K.sst,D=K.D;
const AB={abs:1,obliques:.3},LA=['Abdomen','Oblicuos'],LQ=['Abdomen','Cuádriceps','Oblicuos'],LO=LA.concat('Cuádriceps');
const TL=(L,u,h,d,r)=>[{p:1,dur:u,label:L[0],act:1},{dur:h,label:L[1],act:1},{p:0,dur:d,label:L[2],act:.75},{dur:r,label:L[3],act:.5}];
const CRL=['Sube · exhala','Aprieta 1 s','Baja lento','Abajo · sin soltar'];
const CAM={yaw:-32,pitch:18},CAF={yaw:28,pitch:38};
const mat=(E,x,l)=>K.mat(E,[x||0,0,0],[l||1.75,.6]).top;
const sh=E=>E.shadow([-.2,0,0],.85,.3,.5);
// boca arriba (cabeza hacia -X) con la pelvis (o el punto 'at') en x
const up=(b,Y,o)=>K.supine(b,Object.assign({y:Y,x:0,at:'pelvis'},o));
// pies planos, rodillas dobladas
const feet=(b,Y,x,z,t)=>{for(const[s,k]of SS){K.footOn(b,s,[x+.055,Y,k*z],V.yaw(-k*(t||6)),[0,1,0]);b.leg(s,null,[0,1,k*.3]);}};
// piernas libres: elevación L (° sobre el suelo) con la pelvis inclinada i
const legs=(b,i,LR,kn,f)=>{for(const[s,k]of SS){b.legFK(s,{flex:LR[s==='R'?0:1]+i,knee:kn==null?2:kn,abd:2});b.footRelax(s,f==null?28:f);}};
// manos en la nuca (codos abiertos) · brazos cruzados sobre el pecho
const nape=(b,w)=>{for(const[s,k]of SS){const a=w?w[s]:0;b.arm(s,b.hpt(k*.045,-.01,-.13),b.tdir(k,.1-1.3*a,.25+.35*a),b.tdir(0,1,0));}};
const cross=b=>{for(const[s,k]of SS)b.arm(s,b.tpt(-k*.1,k>0?-.08:-.12,k>0?.15:.2),b.tdir(k*.3,-1,.6),b.tdir(0,1,0));};
// crunch: la columna se enrolla (retroversión ligera), lumbar en el suelo
const crunch=(b,Y,p,hd)=>{up(b,Y,{incl:-mix(0,8,p),sp:[mix(3,48,p)],hd:mix(hd==null?18:hd,22,p),sc:[0,mix(0,.02,p)]});feet(b,Y,.5,.13);};
const CRD=o=>Object.assign({cam:CAF,muscles:AB,labels:LA,timeline:TL(CRL,1.1,1,2,.5)},o);

GA.def('lib_crunch',CRD({
  title:'Crunch abdominal',muscles:{abs:1,obliques:.4},
  build(c,b,E){const Y=mat(E,-.2);crunch(b,Y,c.p);nape(b);sh(E);}
}));

GA.def('lib_crunch_db',CRD({
  title:'Crunch con mancuerna',
  build(c,b,E){const Y=mat(E,-.2);crunch(b,Y,c.p,6);const r=.062,ax=b.tdir(1,0,0),g=b.tpt(0,-.15,.125+r);
    E.dumbbell(g,ax,{r,len:.13,hl:.07});for(const[s,k]of SS)K.palm(b,E,s,V.madd(g,ax,k*.135),{fd:b.tdir(0,1,.2),n:V.mul(ax,k),pole:b.tdir(k,-.3,-.6)});sh(E);}
}));

GA.def('lib_plate_crunch',CRD({
  title:'Crunch con disco',
  build(c,b,E){const Y=mat(E,-.2);crunch(b,Y,c.p,6);const r=.17,n=b.tdir(0,0,1),R=b.tdir(1,0,0),pc=b.tpt(0,-.19,.125+.02);
    K.plate(E,pc,n,{r,th:.035});for(const[s,k]of SS)b.arm(s,V.madd(pc,R,k*(r-.012)),b.tdir(k,-.3,-.5),b.tdir(0,1,0));sh(E);}
}));

// crunch inverso: tórax fijo en el suelo, la pelvis se enrolla y las rodillas van al pecho
GA.def('lib_reverse_crunch',{
  title:'Crunch inverso',cam:CAM,muscles:{abs:1,obliques:.4,quads:.25},labels:LA,
  timeline:TL(['Rodillas al pecho','Despega la cadera','Baja sin impulso','Abajo · lumbar pegada'],1.2,.6,2.2,.4),
  build(c,b,E){const Y=mat(E,-.15),p=c.p,f=mix(0,28,p);
    up(b,Y,{x:-.55,at:'sho',incl:-f,sp:[f],hd:'rest',sc:[0,-.01]});
    for(const[s,k]of SS){b.legFK(s,{flex:mix(52,105,p),knee:mix(96,122,p),abd:3});b.footRelax(s,25);}
    K.armsFloor(b,E,{y:Y,spread:22});E.trace('rodilla',b.j('R','kne'));sh(E);}
});

// sit-up: primero se enrolla la columna, luego la cadera lleva el tronco a la vertical
GA.def('lib_situp',{
  title:'Abdominales completos (sit-up)',cam:CAM,muscles:{abs:1,obliques:.4,quads:.35},labels:LO,
  timeline:TL(['Enrolla y sube','Arriba · tronco erguido','Baja controlado','Abajo · sin tirar del cuello'],1.4,.4,2.4,.4),
  build(c,b,E){const Y=mat(E,-.15),p=c.p;
    up(b,Y,{incl:mix(0,62,sst(.12,1,p)),sp:[mix(2,36,sst(0,.4,p))-mix(0,16,sst(.55,1,p))],hd:mix(12,6,p),sc:[0,.01]});
    feet(b,Y,.48,.13);cross(b);E.trace('hombro',b.sho('L'));sh(E);}
});

// V-up: tronco y piernas rectas suben a la vez; equilibrio sobre los glúteos; abajo sin apoyar
GA.def('lib_v_up',{
  title:'Abdominal en V (V-up)',cam:CAM,muscles:{abs:1,quads:.4,obliques:.35},labels:LQ,
  timeline:TL(['Sube piernas y tronco','Manos hacia los pies','Baja lento','Abajo · sin apoyar'],1.1,.4,2,.4),
  build(c,b,E){const Y=mat(E,-.15),p=c.p,fx=mix(12,34,p),i=mix(8,58,p)-fx,L=mix(7,70,p),t=sst(.5,1,p);
    up(b,Y,{incl:i,sp:[fx],hd:mix(10,22,p)});legs(b,i,[L,L]);
    for(const[s,k]of SS){b.armFK(s,{flex:mix(172,86,p),abd:mix(10,6,p),elbow:5});
      if(t>0){const o=b.sho(s),h=V.add(V.lerp(b.j(s,'kne'),b.j(s,'ank'),.6),[0,0,k*.075]),R=K.armD(5);
        b.arm(s,V.lerp(b.j(s,'grip'),V.dist(h,o)>R?V.madd(o,V.norm(V.sub(h,o)),R):h,t),b.tdir(k,-.2,-.3),b.tdir(0,1,0));}}
    E.trace('mano',b.j('R','grip'));sh(E);}
});

// elevación de piernas tumbado: piernas rectas hasta 90°, lumbar pegada, abajo sin tocar
GA.def('lib_lying_leg_raise',{
  title:'Elevación de piernas (tumbado)',cam:CAM,muscles:{abs:1,quads:.35,obliques:.3},labels:LQ,
  timeline:TL(['Sube las piernas a 90°','Arriba · lumbar pegada','Baja lento','Abajo · sin tocar'],1.3,.4,2.6,.4),
  build(c,b,E){const Y=mat(E,-.15),p=c.p,i=-mix(0,10,sst(.4,1,p)),L=mix(7,88,p);
    up(b,Y,{incl:i,sp:[-i],hd:'rest'});legs(b,i,[L,L],3,20);K.armsFloor(b,E,{y:Y,spread:3});E.trace('pies',b.j('R','ank'));sh(E);}
});

// tijeras: piernas rectas a un palmo del suelo, patadas cortas alternas
GA.def('lib_flutter_kick',{
  title:'Tijeras abdominales',cam:CAM,muscles:{abs:1,quads:.4,obliques:.3},labels:LQ,
  timeline:[{p:1,dur:.45,label:'Patadas cortas · lumbar pegada',act:1,ease:'sin'},{p:0,dur:.45,label:'Patadas cortas · lumbar pegada',act:.9,ease:'sin'}],
  build(c,b,E){const Y=mat(E,-.15),s=2*c.p-1,i=-4;
    up(b,Y,{incl:i,sp:[12],hd:20});legs(b,i,[15+8*s,15-8*s],3,30);K.armsFloor(b,E,{y:Y,spread:10});sh(E);}
});

// hollow: lumbar pegada, hombros despegados, brazos y piernas estirados y elevados (isométrico: respiración)
GA.def('lib_hollow_hold',{
  title:'Posición hueca (hollow hold)',cam:CAM,muscles:{abs:1,obliques:.4,quads:.3},labels:LO,init:{p:0,act:1},
  timeline:[{p:1,dur:2,label:'Mantén · inhala',act:.85,ease:'sin'},{p:0,dur:2,label:'Mantén · exhala',act:1,ease:'sin'}],
  build(c,b,E){const Y=mat(E,-.15),q=c.p,i=-6,L=mix(24,22,q);
    up(b,Y,{incl:i,sp:[mix(27,25,q)],hd:12,sc:[.005*q,.02]});legs(b,i,[L,L],2,32);
    for(const[s,k]of SS)b.armFK(s,{flex:174,abd:8,elbow:4});sh(E);}
});

// dead bug: brazos al techo, rodillas a 90°; estira brazo y pierna contrarios sin despegar la lumbar
GA.def('lib_dead_bug',{
  title:'Dead bug (bicho muerto)',cam:CAM,muscles:{abs:1,obliques:.5},labels:LA,init:{p:0,q:0},
  timeline:[{p:1,dur:1.8,label:'Estira brazo y pierna',act:1},{dur:.4,label:'Lumbar pegada',act:1},{p:0,dur:1.4,label:'Vuelve',act:.7},
    {q:1,dur:1.8,label:'Cambia de lado',act:1},{dur:.4,label:'Lumbar pegada',act:1},{q:0,dur:1.4,label:'Vuelve',act:.6}],
  build(c,b,E){const Y=mat(E,-.15),i=-2;up(b,Y,{incl:i,sp:[2],hd:'rest'});
    for(const[s,k]of SS){const a=s==='R'?c.p:c.q,l=s==='R'?c.q:c.p;
      b.armFK(s,{flex:mix(90,172,a),abd:mix(6,10,a),elbow:4});b.legFK(s,{flex:mix(90,5,l)+i,knee:mix(90,3,l),abd:3});b.footRelax(s,mix(5,25,l));}
    sh(E);}
});

// dragon flag: tumbado en banco, manos al banco tras la cabeza; cuerpo recto que pivota sobre la espalda alta
GA.def('lib_dragon_flag',{
  title:'Dragon flag',cam:{yaw:-26,pitch:10},fitBox:[[-.95,.12,-.3],[.95,1.8,.3]],muscles:{abs:1,obliques:.5,lats:.4,lowback:.3},labels:['Abdomen','Oblicuos','Dorsales'],
  timeline:[{p:1,dur:1.4,label:'Sube el cuerpo recto',act:1},{dur:.5,label:'Arriba · sobre los hombros',act:1},
    {p:0,dur:3.5,label:'Baja lento · cadera recta',act:.85},{dur:.5,label:'Abajo · sin apoyar',act:.6}],
  build(c,b,E){const p=c.p,bn=K.box(E,[-.36,0,0],[1.2,.43,.3],{kind:'bench'}),Y=bn.y,xs=-.6;
    K.supine(b,{y:Y,x:xs,at:'sho',incl:-mix(9,66,p),sp:[mix(5,30,p)],hd:'rest',parts:['shd','tho','shoR','shoL'],sc:[0,-.01]});
    for(const[s,k]of SS){b.arm(s,[xs-.3,Y-.035,k*.175],[-.2,1,k*.5],[1,0,0]);b.legFK(s,{flex:2,knee:2,abd:2});b.footRelax(s,35);}
    E.trace('pies',b.j('R','ank'));E.shadow([-.2,0,0],.8,.3,.5);}
});

// bird dog: cuadrupedia; brazo y pierna contrarios en línea, cadera quieta
const bird=(b,q,A,L)=>{const k=K.sd(A),t=sst(.06,1,q.v);
  if(q.v>.06){const g=V.lerp(K.palmT(q.hands[A]),V.madd(b.sho(A),V.norm([1,.08,-k*.05]),.6),t);g[1]+=.12*Math.sin(Math.PI*t);b.arm(A,g,V.lerp([-1,.3,k*.45],[0,-1,k*.2],t),[0,0,1]);}
  if(q.v>0){const hp=b.hip(L),kn=q.knees[L];b.legDir(L,V.lerp(V.norm(V.sub(kn,hp)),[-1,.05,0],q.v),V.lerp(V.norm(V.sub(b.j(L,'ank'),kn)),[-1,.02,0],q.v));b.footRelax(L,mix(79,35,q.v));}};
GA.def('lib_bird_dog',{
  title:'Bird dog (perro de caza)',cam:{yaw:30,pitch:14},muscles:{lowback:1,glutes:.6,abs:.5,obliques:.4},labels:['Lumbares','Glúteos','Abdomen'],init:{p:0,q:0},
  timeline:[{p:1,dur:1.7,label:'Estira brazo y pierna',act:1},{dur:1,label:'Pausa · cadera quieta',act:1},{p:0,dur:1.8,label:'Vuelve controlando',act:.7},
    {q:1,dur:1.7,label:'Cambia de lado',act:1},{dur:1,label:'Pausa · espalda neutra',act:1},{q:0,dur:1.8,label:'Vuelve controlando',act:.6}],
  build(c,b,E){const Y=K.mat(E,[.05,0,0],[1.6,.62]).top,a=c.p>.06?'R':c.q>.06?'L':'';
    const q=K.quad(b,E,{x:-.25,y:Y,arms:a==='R'?'L':a==='L'?'R':true});
    if(c.p>0)bird(b,Object.assign(q,{v:c.p}),'R','L');else if(c.q>0)bird(b,Object.assign(q,{v:c.q}),'L','R');
    E.shadow([-.1,0,0],.7,.3,.5);}
});

// crunch bicicleta: hombros arriba, codo a la rodilla contraria girando el tronco; la otra pierna se estira
GA.def('lib_bicycle_crunch',{
  title:'Crunch bicicleta',cam:CAM,muscles:{obliques:1,abs:.8,quads:.25},labels:['Oblicuos','Abdomen'],
  timeline:[{p:1,dur:1.2,label:'Codo a la rodilla contraria',act:1},{p:0,dur:1.2,label:'Gira el tronco, no el cuello',act:1}],
  build(c,b,E){const Y=mat(E,-.15),p=c.p,s=2*p-1,i=-6;
    up(b,Y,{incl:i,sp:[54,0,42*s],hd:14,sc:[0,.025]});nape(b,{R:1.2*p,L:1.2-1.2*p});
    for(const[S,k]of SS){const u=S==='R'?p:1-p;b.legFK(S,{flex:mix(124,34,u)+i,knee:mix(120,6,u),abd:mix(-5,4,u)});b.footRelax(S,25);}
    sh(E);}
});

// toques de talones: hombros despegados, flexión lateral alterna hasta tocar cada talón
GA.def('lib_heel_touch',{
  title:'Toques de talones',cam:{yaw:-28,pitch:30},muscles:{obliques:1,abs:.6},labels:['Oblicuos','Abdomen'],
  timeline:[{p:1,dur:1.05,label:'Toca el talón derecho',act:1},{p:0,dur:1.05,label:'Toca el talón izquierdo',act:1}],
  build(c,b,E){const Y=mat(E,-.15),s=2*c.p-1;
    up(b,Y,{incl:-5,sp:[32,28*s],hd:16,sc:[0,.01]});feet(b,Y,.3,.2,10);
    for(const[S,k]of SS){const h=V.add(b.j(S,'ank'),[-.03,-.01,k*.065]),o=b.sho(S),R=K.armD(4),d=V.dist(h,o);
      b.arm(S,d>R?V.madd(o,V.norm(V.sub(h,o)),R):h,[0,1,0],[1,0,0]);}
    sh(E);}
});

// sit-up en banco declinado: pies sujetos en los rodillos, tronco hasta casi vertical; abajo sin apoyar
const A=24,dB=[-Math.cos(A*D),-Math.sin(A*D),0],nB=[-Math.sin(A*D),Math.cos(A*D),0],PB=[0,.72,0];
GA.def('lib_decline_situp',{
  title:'Abdominales en banco declinado',cam:{yaw:-34,pitch:12},fitBox:[[-.8,0,-.3],[.72,1.55,.3]],muscles:{abs:1,obliques:.4,quads:.3},labels:LO,
  timeline:TL(['Enrolla y sube','Casi vertical','Baja controlado','Abajo · sin apoyar'],1.4,.4,2.6,.4),
  build(c,b,E){const p=c.p,g=(mix(0,82,sst(.1,1,p))-A)*D;
    K.frame(b,[0,1,0],[-Math.cos(g),Math.sin(g),0],[Math.sin(g),Math.cos(g),0]);
    K.trunk(b,{sp:[mix(8,32,sst(0,.4,p))-mix(0,14,sst(.55,1,p))],hd:mix(10,6,p),sc:[0,.01]});
    K.rest(b,K.TORSO,PB,nB);K.shift(b,V.mul(dB,-V.dot(V.sub(b.pf.o,PB),dB)));
    const f=V.norm([1,.15,0]),u=V.norm([-.15,1,0]);
    for(const[s,k]of SS){b.foot(s,[.55,.6,k*.1],f,u);b.leg(s,null,[.3,1,k*.2]);}
    cross(b);
    const at=(s,w)=>V.madd(V.madd(PB,dB,s),nB,w);
    E.pad(at(-.36,-.04),at(.86,-.04),.3,.08,C.pad,{up:nB,layer:-1});
    const an=[.55,.6,0],R1=V.add(an,V.add(V.mul(f,.088),V.mul(u,.06))),R2=V.add(an,V.add(V.mul(f,-.1),V.mul(u,.07)));
    for(const r of[R1,R2])for(const k of[1,-1])E.cyl([r[0],r[1],0],[r[0],r[1],k*.19],.05,C.pad,{bias:k>0?-.08:0});
    E.beam([R1[0]-.03,.03,0],[R1[0]-.03,R1[1],0],.05,C.frame);E.beam([R2[0],R2[1],0],[R1[0]-.03,R2[1],0],.04,C.frameD);
    const t1=at(-.25,-.08),t2=at(.75,-.08);
    E.beam([t1[0],.03,0],t1,.06,C.frame,{layer:-2});E.beam([t2[0],.03,0],t2,.06,C.frame,{layer:-2});
    E.beam([t2[0]-.05,.03,0],[R1[0]+.1,.03,0],.07,C.frameD,{layer:-2});
    for(const x of[t2[0],R1[0]])E.beam([x,.025,-.25],[x,.025,.25],.05,C.frameD,{layer:-2});
    E.trace('hombro',b.sho('L'));E.shadow([-.1,0,0],.75,.35,.5);}
});

})(window.GymAnim);
