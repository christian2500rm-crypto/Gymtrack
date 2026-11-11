/* Cardio: caminadora inclinada, bicicleta estática, elíptica */
(function(GA){
const C=GA._.COL,TAU5=Math.PI*.4;

// ═══ CAMINADORA INCLINADA ═══════════════════════════════════════════════════
// Marcha (no carrera) a 5 km/h con 2,8° (≈4,9 %): ~118 pasos/min de 0,71 m, talón → planta → punta
// sobre el plano inclinado, pie de apoyo arrastrado por la cinta (sin deslizar), rodilla ~15° al
// contactar y en apoyo medio, despegue con flexión plantar; tronco ~8° adelante, sin agarrarse.
// En el balanceo el pie cuelga con el tobillo neutro (≤12° de flexión dorsal). Braceo enérgico con
// codos 36–72°: la mano adelantada pasa claramente por encima de la barandilla.
const RUN_T=1.02;
GA.def('lib_cardio_run',{
  title:'Cardio — caminadora',
  cam:{yaw:30,pitch:8},
  cycle:{period:RUN_T},
  muscles:{glutes:.6,quads:.5,hams:.4,calves:.6},
  labels:['Glúteos · Piernas · cardio'],
  note:'5 km/h · 3–5 %',
  init:{act:.65},timeline:[{dur:RUN_T,label:'Sin agarrarte · talón → punta',act:.65}],
  build(c,b,E){
    const V=E.V,IN=2.8*Math.PI/180,Z=[0,0,1],dir=[Math.cos(IN),Math.sin(IN),0],nrm=[-Math.sin(IN),Math.cos(IN),0];
    GA._.walkOnTreadmill(c,b,E,{speed:1.39,incline:IN*180/Math.PI,period:RUN_T});   // cinta y consola (la marcha se rehace abajo)
    // altura de la suela (punto más bajo de la zapatilla) sobre la cinta
    const sole=(a,f,u)=>V.dot(V.sub(V.add(a,V.add(V.mul(f,.07),V.mul(u,-.039))),[0,.2,0]),nrm)-Math.hypot(.138*V.dot(f,nrm),.042*V.dot(u,nrm))+.006;
    {const T=RUN_T,v=1.39,ph=c.cyc,W2=2*Math.PI*ph,sn=x=>Math.sin(2*Math.PI*x),D=E.DIM,M=E.EASE,DY=.2,sHS=.25,t1=.1*T,t2=.3*T,Ts=.6*T,FL=D.heel+D.toe,PHS=-17,PTO=55,dk=(x,z)=>[dir[0]*x,DY+dir[1]*x,z];
    // pelvis: máx. en apoyo medio, oscilación ±1,6 cm, giro y caída pélvica; tronco ~8° adelante (pendiente)
    b.pelvis([0,DY+.915+.016*Math.cos(2*Math.PI*(2*ph-.46)),.014*sn(ph-.05)],{tilt:8,yaw:4.5*Math.cos(W2),roll:2*sn(ph-.05)});b.spine(0,0,-8*Math.cos(W2));b.head(-5,4*Math.cos(W2));
    // pie en el plano de la cinta: punto de apoyo (talón o punta) + inclinación (+ = talón arriba); la suela de la zapatilla queda justo en la cinta
    const pose=(x,z,pit,toe)=>{const q=-pit*Math.PI/180,f=V.rot(dir,Z,q),u=V.rot(nrm,Z,q),a=V.add(dk(x,z),V.add(V.mul(f,toe?-D.toe:D.heel),V.mul(u,D.ankH)));return[V.madd(a,nrm,-sole(a,f,u)),f,u];};
    const foot=(ph,z)=>{const t=ph*T,sT=sHS+FL;
      if(t<t1)return pose(sHS-v*t,z,PHS*(1-M.sin(t/t1)),0);
      if(t<t2)return pose(sHS-v*t,z,0,0);
      if(t<Ts)return pose(sT-v*t,z,PTO*Math.pow((t-t2)/(Ts-t2),2),1);
      const u=(t-Ts)/(T-Ts),A=pose(sT-v*Ts,z,PTO,1),B=pose(sHS,z,PHS,0),e=M.mj(u);
      const an=V.madd(V.lerp(A[0],B[0],e),nrm,.075*Math.pow(Math.sin(Math.PI*Math.min(1,u*1.08)),1.3)*(1-.35*u));
      const pit=u<.5?E.mix(PTO,-4,M.mj(u/.5)):E.mix(-4,PHS,M.mj((u-.5)/.5)),q=pose(0,z,pit,0);return[an,q[1],q[2]];};
    b.ikErr=0;for(const[s,k,o]of[['R',1,0],['L',-1,.5]]){const F=foot((ph+o)%1,k*.075);b.foot(s,F[0],F[1],F[2]);b.leg(s,null,[1,.05,k*.06]);}}
    // braceo enérgico de marcha en pendiente: la mano adelantada queda ~6 cm por encima de la barandilla
    for(const[s,k]of[['R',1],['L',-1]]){const sw=-k*Math.cos(2*Math.PI*c.cyc);b.armFK(s,{flex:3+17*sw,abd:7,elbow:36+36*Math.max(0,sw),rot:10});}
    for(const[s,o,k]of[['R',0,1],['L',.5,-1]]){const S=b.S[s],sk=V.norm(V.sub(S.kne,S.ank));
      // balanceo: pie colgando con tobillo ≤12° de flexión dorsal (sin que la punta baje a <1,2 cm de la cinta)
      if((c.cyc+o)%1>=.6){const fu=q=>[V.rot(dir,Z,-q),V.rot(nrm,Z,-q)],an=q=>Math.acos(V.dot(sk,fu(q)[0])),clr=q=>sole(S.ank,...fu(q))-.012;
        const q0=-Math.atan2(V.dot(S.ffwd,nrm),V.dot(S.ffwd,dir)),AM=78*Math.PI/180;
        if(an(q0)<AM){let q=E.solve(x=>an(x)-AM,q0,q0+1.2);if(clr(q)<0)q=clr(q0)<0?q0:E.solve(clr,q0,q);const[f,u]=fu(q);b.foot(s,S.ank,f,u);}}
      // apoyo: la suela queda exactamente sobre la cinta (contacto de talón, despegue de talón y punta sin hundirse ni flotar)
      const dz=-sole(S.ank,S.ffwd,S.fup);if(dz>0||(c.cyc+o)%1<.6){b.foot(s,V.madd(S.ank,nrm,dz),S.ffwd,S.fup);b.leg(s,null,[1,.05,k*.06]);}}
  }
});

// ═══ BICICLETA ESTÁTICA ═════════════════════════════════════════════════════
// Sillín: rodilla ~32° flexionada en el punto más bajo; rodilla sobre el eje del pedal
// a las 3 (KOPS). Tronco ~24° adelante, columna neutra, codos suaves. Bola del pie
// sobre el eje del pedal con "ankling" suave (talón nunca cae: ≤15° de flexión dorsal).
// 80 RPM, rodillas alineadas con el pie. Transmisión por correa bajo cubrecadena, volante ×3.
GA.def('lib_cardio_bike',{
  title:'Cardio — bicicleta estática',
  cam:{yaw:32,pitch:10},
  cycle:{period:.75},
  muscles:{quads:1,glutes:.6,hams:.4,calves:.4},
  labels:['Cuádriceps','Glúteos','Isquiotibiales'],
  note:'80 RPM',
  init:{act:.8},
  timeline:[{dur:.75,label:'Pedaleo redondo · sin rebotar',act:.8}],
  build(c,b,E){
    const V=E.V,D=Math.PI/180,BB=[0,.3,0],CR=.17,H=[-.23,1.09,0],th=c.cyc*360,FD=C.frameD,FR=C.frame;
    b.pelvis(H,{tilt:22});b.spine(8);b.head(-22);b.scap('both',0,.015);
    // ── piernas: pedal → bola del pie → IK. Biela/pedal en el grupo del pie (siempre bajo la zapatilla) ──
    const sp={};
    for(const s of['R','L']){const k=s==='R'?1:-1,f=th+90+(s==='L'?180:0),g={grp:'sh'+s};
      const P=[BB[0]+CR*Math.sin(f*D),BB[1]+CR*Math.cos(f*D),k*.12];
      const a=24+12*Math.cos((f-290)*D),u=[Math.sin(a*D),Math.cos(a*D),0];
      const bl=V.madd(P,u,.02);b.footBall(s,bl,0,a);b.leg(s,null,[1,.15,k*.02]);sp[s]=P;
      E.cyl([BB[0],BB[1],k*.048],[BB[0],BB[1],k*.074],.024,FD,g);
      E.beam([BB[0],BB[1],k*.062],[P[0],P[1],k*.062],.024,FD,Object.assign({up:[0,0,1]},g));
      E.cyl([P[0],P[1],k*.055],[P[0],P[1],k*.08],.011,C.chrome,g);
      const fw=[Math.cos(a*D),-Math.sin(a*D),0];
      E.boxA(P,[.11,.024,.09],'#2a2f36',Object.assign({pitch:-a,layer:k>0?2:0},g));
      E.over({k:'ell',grp:'sh'+s,c:V.madd(V.madd(bl,u,.05),fw,-.01),ax:[V.mul(fw,.022),V.mul(u,.045),[0,0,.07]],col:'#1b1f24'});
    }
    E.sph(b.hip('R'),.001,FD,{grp:'thR',layer:2,outline:false,alpha:0});   // muslo cercano en la misma capa que su pierna
    // brazos al manillar
    for(const s of['R','L']){const k=s==='R'?1:-1;b.arm(s,[.5,1.21,k*.23],[-.25,-.6,k*1],[0,0,1]);}
    // activación por pierna según el ángulo de biela (0 = arriba): vasto ~45°, glúteo ~100°, isquios ~150°
    const ph=(s,c0)=>.5+.5*Math.cos((th+90+(s==='L'?180:0)-c0)*D),m={calves:.4};
    for(const s of['R','L']){m['quads_'+s]=.45+.55*ph(s,45);m['glutes_'+s]=.3+.4*ph(s,100);m['hams_'+s]=.2+.3*ph(s,150);}
    this.muscles=m;
    // ── bicicleta ──
    for(const x of[-.56,.64]){E.beam([x,.035,-.27],[x,.035,.27],.06,FD,{layer:-1});
      for(const k of[-1,1])E.boxA([x,.012,k*.25],[.07,.024,.05],C.rubber,{layer:-1});}
    // orden de pintado: pierna lejana → cuadro (sesgo: delante del pie lejano) → cubrecadena (capa 1) → pierna cercana (capa 2)
    E.beam([-.56,.06,0],[-.31,.28,0],.06,FR,{bias:-.06});E.beam([-.31,.28,0],[-.06,.5,0],.06,FR,{bias:-.1});   // trasero
    E.beam([-.04,.24,0],[.64,.06,0],.07,FR);                      // inferior
    E.beam([.02,.26,0],[-.17,.78,0],.075,FR,{bias:-.05});         // tubo del sillín
    E.cyl([-.17,.78,0],[-.255,1.0,0],.018,C.chrome);              // tija
    E.cyl([-.16,.75,.03],[-.16,.75,.07],.016,C.accent,{bias:-.06});
    E.cyl([BB[0],BB[1],-.04],[BB[0],BB[1],.04],.04,FD,{bias:-.05}); // caja de pedalier
    // sillín (algo más claro y con borde trasero visible bajo la pelvis)
    E.ell([-.31,1.0,0],[[.095,0,0],[0,.03,0],[0,0,.095]],'#3a414b',{layer:-1});
    E.ell([-.17,.997,0],[[.11,0,0],[0,.022,0],[0,0,.038]],'#3a414b',{layer:-1});
    E.beam([-.31,.97,0],[-.13,.97,0],.03,C.chrome,{layer:-1});
    // horquilla, volante (gira con la biela, relación 3:1) y cubrecadena
    const F0=[.67,.06],F1=[.42,1.08],FW=[.58,.42],RF=.205;
    for(const k of[-1,1])E.beam([F0[0],F0[1],k*.058],[F1[0],F1[1],k*.058],.05,FR);
    E.disc([FW[0],FW[1],0],[0,0,1],RF,.045,'#2a3038',{hub:.18});
    const ang=-th*3*D;
    for(let i=0;i<5;i++){const q=ang+i*TAU5;E.line([FW[0],FW[1],.024],[FW[0]+RF*.8*Math.cos(q),FW[1]+RF*.8*Math.sin(q),.024],.012,'#58616d',{outline:false});}
    E.line([FW[0]+RF*.92*Math.cos(ang),FW[1]+RF*.92*Math.sin(ang),.024],[FW[0]+RF*.92*Math.cos(ang-.5),FW[1]+RF*.92*Math.sin(ang-.5),.024],.014,C.accent,{outline:false});
    const bt=V.norm([FW[0]-BB[0],FW[1]-BB[1],0]),bn=[-bt[1],bt[0],0],gp=[];
    const arc=(o,r,q0)=>{for(let i=0;i<=8;i++){const q=q0+i*Math.PI/8;gp.push([o[0]+r*(bt[0]*Math.cos(q)+bn[0]*Math.sin(q)),o[1]+r*(bt[1]*Math.cos(q)+bn[1]*Math.sin(q)),.044]);}};
    arc(BB,.1,Math.PI/2);arc(V.madd([FW[0],FW[1],0],bt,-.062),.04,-Math.PI/2);E.poly(gp,'#323943',{layer:1});
    // manillar + consola
    E.beam([F1[0],F1[1],0],[.5,1.19,0],.05,FR);
    E.cyl([.43,1.04,0],[.4,1.12,0],.022,'#b83a2e');
    E.bar([.5,1.21,-.28],[.5,1.21,.28],{r:.016});
    for(const k of[-1,1]){E.cyl([.5,1.21,k*.17],[.5,1.21,k*.29],.022,C.rubber);E.bar([.5,1.21,k*.28],[.58,1.27,k*.3],{r:.016});}
    E.beam([.53,1.19,0],[.59,1.29,0],.04,FD);
    E.boxA([.6,1.32,0],[.04,.13,.22],FD,{pitch:-28});
    E.boxA([.578,1.33,0],[.005,.09,.16],C.screen,{pitch:-28,outline:false});
    E.trace('pedal',sp.R);
    E.shadow([.05,0,0],.75,.35,.55);
  }
});

// ═══ ELÍPTICA (tracción delantera) ══════════════════════════════════════════
// Biela delantera (r 23,5 cm) + brazo de pedal con rodillo sobre carril trasero: el pie
// describe una elipse ~48×18 cm. Pedales a 180°, manillares móviles (eje sobre el carenado,
// palanca inferior accionada dentro del carenado) opuestos a la pierna del mismo lado.
// Tronco erguido; talón apoyado salvo en el cuarto trasero-alto, donde se despega
// pivotando sobre la bola (tobillo ≤ ~23° de flexión dorsal). Agarres a la altura del pecho.
GA.def('lib_cardio_elliptical',{
  title:'Cardio — elíptica',
  cam:{yaw:36,pitch:8},
  cycle:{period:1.1},
  muscles:{quads:.7,glutes:.7,hams:.4,calves:.3,lats:.3,pecs:.3},
  labels:['Cuerpo completo · cardio'],
  note:'≈ 55 RPM',
  init:{act:.7},
  timeline:[{dur:1.1,label:'Empuja y tira · tronco erguido',act:.7}],
  build(c,b,E){
    const V=E.V,D=Math.PI/180,Cc=[.62,.55],CR=.235,AL=1.22,TF=.62,RY=.16,MEAN=28,HL=22,PZ=.12,Z=[0,0,1],FR=C.frame,FD=C.frameD;
    const W=c.cyc*2*Math.PI,cR=Math.cos(W),m={hams:.4,calves:.3};
    // pelvis estable: leve oscilación, giro hacia la pierna adelantada, tronco contrarrota
    b.pelvis([-.18,1.245+.005*Math.cos(2*W),.008*Math.cos(W-.6)],{tilt:6,yaw:4*cR,roll:-1.5*Math.cos(W-.6)});
    b.spine(2,0,-7*cR);b.head(-6,3*cR);
    for(const s of['R','L']){const k=s==='R'?1:-1,f=s==='R'?-W:Math.PI-W,z=k*PZ,ws=W+(s==='L'?Math.PI:0);
      const A=[Cc[0]+CR*Math.cos(f),Cc[1]+CR*Math.sin(f),z],B=[A[0]-Math.sqrt(AL*AL-(RY-A[1])**2),RY,z];
      const P=V.lerp(A,B,TF),an=Math.atan2(A[1]-B[1],A[0]-B[0]),nA=[-Math.sin(an),Math.cos(an),0];
      const pa=an/D-MEAN,fp=[Math.cos(pa*D),Math.sin(pa*D),0],up=[-fp[1],fp[0],0];
      const Pc=V.madd(P,nA,.05),top=V.madd(Pc,up,.016),g={grp:'sh'+s};
      // pie: bola fija sobre el pedal; el talón se despega solo en el cuarto trasero-alto
      const hr=HL*Math.pow(Math.max(0,Math.cos(ws-3.9)),1.2)*D,bl=V.madd(top,fp,.07),f2=V.rot(fp,Z,-hr),u2=V.rot(up,Z,-hr);
      b.foot(s,V.add(bl,V.add(V.mul(f2,-.145),V.mul(u2,.075))),f2,u2);b.leg(s,null,[1,.1,k*.06]);
      // brazo de pedal (tramo bajo el pie en el grupo del pie → siempre debajo), pedal, rodillo, biela
      const dA=V.norm(V.sub(A,B)),P0=V.madd(P,dA,-.22),P1=V.madd(P,dA,.22);
      E.beam(P0,P1,.05,FR,Object.assign({up:nA},g));E.beam(P,Pc,.04,FD,g);
      E.boxA(Pc,[.4,.03,.15],'#2a2f36',Object.assign({pitch:pa},g));
      E.boxA(V.add(V.madd(Pc,fp,.19),V.mul(up,.03)),[.02,.035,.15],'#2a2f36',Object.assign({pitch:pa},g));
      E.beam(P1,A,.05,FR,{up:nA});E.beam(B,P0,.05,FR,{up:nA});
      E.cyl(V.add(B,[0,0,-.025]),V.add(B,[0,0,.025]),.045,C.rubber,{hub:.4});
      E.beam([Cc[0],Cc[1],k*.105],[A[0],A[1],k*.105],.045,FD,{up:[0,0,1]});
      E.cyl([A[0],A[1],k*.1],[A[0],A[1],k*.14],.018,C.chrome);
      // manillar móvil: eje sobre el carenado; palanca inferior entra en el carenado (biela interna) → opuesto a la pierna
      const ps=.24*Math.cos(f),Pv=[.47,.78,k*.16],rt=q=>V.add(Pv,V.rot(V.sub(q,Pv),Z,ps));
      const G=rt([.24,1.5,k*.25]),T=rt([.183,1.64,k*.25]),S=rt([.52,.66,k*.16]),ax=V.norm(V.sub(T,G));
      E.cyl(S,Pv,.021,FR);E.cyl(S,[S[0],S[1],k*.04],.017,FD);E.cyl(Pv,V.madd(G,ax,-.1),.02,FR);E.cyl(V.madd(G,ax,-.1),T,.021,C.rubber);
      E.cyl([Pv[0],Pv[1],k*.135],[Pv[0],Pv[1],k*.185],.031,FD);
      b.arm(s,G,[-1,-.9,k*.25],ax);   // codos cerca del cuerpo, en línea con los agarres
      b.scap(s,0,-.016*Math.cos(f));
      // activación: piernas en el empuje (abajo-atrás), pectoral al empujar el agarre, dorsal al tirar
      m['quads_'+s]=m['glutes_'+s]=.45+.35*Math.max(0,Math.sin(ws));
      m['pecs_'+s]=.15+.3*Math.max(0,-Math.sin(f));m['lats_'+s]=.15+.3*Math.max(0,Math.sin(f));
    }
    this.muscles=m;
    // ── estructura ──
    E.beam([-.92,.04,0],[.95,.04,0],.07,FD,{layer:-1});
    for(const x of[-.9,.92]){E.beam([x,.035,-.3],[x,.035,.3],.06,FD,{layer:-1});for(const k of[-1,1])E.boxA([x,.012,k*.28],[.07,.024,.05],C.rubber,{layer:-1});}
    for(const k of[-1,1]){E.beam([-.9,.09,k*PZ],[-.2,.09,k*PZ],.05,'#5b6573',{layer:-1});E.beam([-.6,.04,k*PZ],[-.6,.07,k*PZ],.04,FD,{layer:-1});}
    E.beam([-.6,.05,-PZ],[-.6,.05,PZ],.04,FD,{layer:-1});
    E.ell([.69,.56,0],[[.29,0,0],[0,.34,0],[0,0,.095]],FR);
    for(const k of[-1,1])E.disc([Cc[0],Cc[1],k*.096],[0,0,1],.12,.012,FD,{hub:.25});
    E.beam([.5,.08,0],[.7,.3,0],.08,FD);
    E.beam([.62,.84,0],[.5,1.42,0],.065,FR);
    E.cyl([.47,.78,-.14],[.47,.78,.14],.02,C.chrome);                  // eje de los manillares
    E.bar([.53,1.3,0],[.4,1.27,0],{r:.015});E.bar([.4,1.27,-.09],[.4,1.27,.09],{r:.015});
    E.boxA([.5,1.48,0],[.06,.16,.32],FD,{pitch:-30});
    E.boxA([.47,1.49,0],[.005,.11,.22],C.screen,{pitch:-30,outline:false});
    E.trace('pie',b.j('R','ank'));
    E.shadow([0,0,0],1.05,.4,.55);
  }
});

})(window.GymAnim);
