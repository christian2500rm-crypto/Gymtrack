/* ex/ref2.js */
/* Referencias 2: tumbado en banco + polea alta con cuerda */
(function(GA){
const C=GA._.COL;

GA.def('lib_press_flat_db',{
  title:'Press plano con mancuernas',
  cam:{yaw:-30,pitch:26},
  muscles:{pecs:1,frontdelts:.55,triceps:.55},
  labels:['Pectoral','Deltoides ant.','Tríceps'],
  timeline:[
    {p:1,dur:2.4,label:'Baja controlando',act:.8},
    {dur:.35,label:'Pausa · estira el pecho',act:.9},
    {p:0,dur:1.2,label:'Empuja y junta',act:1},
    {dur:.6,label:'Arriba · sin chocar',act:.5}
  ],
  build(c,b,E){
    const V=E.V,p=c.p;
    const bn=E.bench({at:[0,0,0],dir:0,h:.44,seat:.42,back:.82,inc:0});
    b.pelvis([.13,.44+.112,0],{tilt:-82});b.spine(-8);b.head(2);b.scap('both',-.012,-.03);
    for(const s of['R','L']){const k=s==='R'?1:-1;
      const w=1-(1-p)*(1-p),g=b.tpt(k*E.mix(.15,.37,w),E.mix(-.12,-.215,p),E.mix(.575,.21,p)),ax=b.tdir(1,-k*.3,0);
      b.arm(s,g,b.tdir(k*.8,-.7,-.45),ax);
      E.dumbbell(b.j(s,'grip'),ax,{r:.056});
      if(s==='R')E.trace('mancuerna',b.j(s,'grip'));
    }
    for(const s of['R','L']){const k=s==='R'?1:-1;b.footFlat(s,[.5,0,k*.27],k*-15);b.leg(s,null,[.3,1,k*.4]);}
    E.shadow([0,0,0],.9,.45,.55);
  }
});

GA.def('lib_tricep_pushdown',{
  title:'Jalón de tríceps en cable',
  cam:{yaw:-38,pitch:8},
  fitBox:[[-.5,0,-.6],[.9,2.05,.6]],
  muscles:{triceps:1},
  labels:['Tríceps'],
  timeline:[
    {p:1,dur:1.2,label:'Extiende · codos pegados',act:1},
    {dur:.6,label:'Aprieta y abre la cuerda',act:1},
    {p:0,dur:2.4,label:'Sube controlando',act:.7},
    {dur:.4,label:'Arriba · 90°',act:.5}
  ],
  build(c,b,E){
    const V=E.V,p=c.p;
    for(const s of['R','L']){const k=s==='R'?1:-1;b.footFlat(s,[-.08,0,k*.12],k*-8);}
    b.pelvis([-.03,.94,0],{tilt:12});b.spine(-2);b.head(-10);
    for(const s of['R','L'])b.leg(s,null,[1,0,0]);
    const pul=[.3,2.0,0];
    const pose=pp=>{const th=E.mix(96,12,pp)*Math.PI/180,u=[],f=[],h=[];
      for(const[s,k]of[['R',1],['L',-1]]){u.push([.08,-1,k*.06]);f.push([Math.sin(th),-Math.cos(th),k*E.mix(-.42,.12,pp)]);b.armDir(s,u[u.length-1],f[f.length-1]);h.push(b.j(s,'grip'));}
      const m=V.lerp(h[0],h[1],.5),hw=V.dist(h[0],h[1])/2;          // cada ramal de cuerda mide 30 cm (clip → puño)
      return{u,f,h,clip:V.madd(m,V.norm(V.sub(pul,m)),Math.sqrt(Math.max(.09-hw*hw,.01)))};};
    const D0=V.dist(pul,pose(0).clip),P=pose(p);
    ['R','L'].forEach((s,i)=>b.armDir(s,P.u[i],P.f[i],V.sub(P.h[i],P.clip)));
    E.rope(P.clip,P.h[0],P.h[1]);
    const d=V.norm(V.sub(P.clip,pul));E.pulley(pul,[0,0,1],.045);E.cable(V.madd(pul,[d[1],-d[0],0],.045),P.clip);
    E.beam([.66,0,0],[.66,2.1,0],.1,C.frame);E.beam([.3,2.05,0],[.86,2.05,0],.06,C.frame);
    E.beam([.3,.03,0],[1.0,.03,0],.08,C.frameD,{layer:-1});
    E.pulley([.755,2.0,0],[0,0,1],.045);E.cable([.3,2.045,0],[.755,2.045,0]);
    const top=E.stack([.8,0,0],{h:1.9,lift:V.dist(pul,P.clip)-D0+.03,n:14,sel:4,yaw:0,w:.26,bias:.2});
    E.cable([.8,2.0,0],top);
    E.trace('cuerda',P.h[0]);
    E.shadow([.1,0,0],.6,.35,.55);
  }
});
})(window.GymAnim);
