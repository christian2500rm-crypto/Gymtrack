/* engine.js */
/* ═══════════════════════════════════════════════════════════════════════════
   GymAnim — motor de animación biomecánica 3D para GymTrack (Canvas 2D)
   · Maniquí con proporciones antropométricas reales (≈1.76 m)
   · Cinemática inversa de 2 huesos (brazos/piernas) → longitudes óseas constantes,
     pies y manos anclados al equipamiento
   · Perfil de velocidad minimum-jerk (movimiento humano voluntario)
   · Tempo real por fases (excéntrica / pausa / concéntrica) + músculo objetivo
   Convenciones: metros, Y arriba. La persona mira a +X por defecto (yaw 0).
   Su derecha es +Z. Cámara yaw 0 = vista lateral desde la derecha de la persona,
   yaw 90 = vista frontal, yaw -90 = vista trasera, yaw 180 = lateral izquierda.
   ═══════════════════════════════════════════════════════════════════════════ */
(function(G){
'use strict';
const PI=Math.PI,D=PI/180,TAU=PI*2;
const clamp=(x,a,b)=>x<a?a:x>b?b:x;
const mix=(a,b,t)=>a+(b-a)*t;
const sstep=(e0,e1,x)=>{const t=clamp((x-e0)/(e1-e0),0,1);return t*t*(3-2*t);};
const EASE={
  mj:t=>{t=clamp(t,0,1);return t*t*t*(10+t*(6*t-15));},   // minimum jerk
  lin:t=>clamp(t,0,1),
  sin:t=>{t=clamp(t,0,1);return .5-.5*Math.cos(PI*t);},
  in:t=>{t=clamp(t,0,1);return t*t*(2-t)*t;},
  out:t=>{t=clamp(t,0,1);const u=1-t;return 1-u*u*(2-u)*u;}
};

const V={
  add:(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],
  sub:(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],
  mul:(a,s)=>[a[0]*s,a[1]*s,a[2]*s],
  madd:(a,b,s)=>[a[0]+b[0]*s,a[1]+b[1]*s,a[2]+b[2]*s],
  dot:(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],
  cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],
  len:a=>Math.hypot(a[0],a[1],a[2]),
  dist:(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]),
  norm:a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return[a[0]/l,a[1]/l,a[2]/l];},
  lerp:(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t],
  neg:a=>[-a[0],-a[1],-a[2]],
  perp:(v,n)=>{const d=v[0]*n[0]+v[1]*n[1]+v[2]*n[2];return[v[0]-n[0]*d,v[1]-n[1]*d,v[2]-n[2]*d];},
  rot:(v,k,a)=>{const c=Math.cos(a),s=Math.sin(a),d=(k[0]*v[0]+k[1]*v[1]+k[2]*v[2])*(1-c);
    return[v[0]*c+(k[1]*v[2]-k[2]*v[1])*s+k[0]*d,v[1]*c+(k[2]*v[0]-k[0]*v[2])*s+k[1]*d,v[2]*c+(k[0]*v[1]-k[1]*v[0])*s+k[2]*d];},
  yaw:deg=>[Math.cos(deg*D),0,-Math.sin(deg*D)],
  xy:(deg,l=1)=>[Math.cos(deg*D)*l,Math.sin(deg*D)*l,0],
  chain:(o,...segs)=>{let p=o;for(const[d,l]of segs)p=V.madd(p,d,l);return p;}
};
const W_UP=[0,1,0];

function frot(fr,k,a){return{o:fr.o,R:V.rot(fr.R,k,a),U:V.rot(fr.U,k,a),F:V.rot(fr.F,k,a)};}
function fpt(fr,r,u,f){const R=fr.R,U=fr.U,F=fr.F,o=fr.o;return[o[0]+R[0]*r+U[0]*u+F[0]*f,o[1]+R[1]*r+U[1]*u+F[1]*f,o[2]+R[2]*r+U[2]*u+F[2]*f];}
function fdir(fr,r,u,f){const R=fr.R,U=fr.U,F=fr.F;return[R[0]*r+U[0]*u+F[0]*f,R[1]*r+U[1]*u+F[1]*f,R[2]*r+U[2]*u+F[2]*f];}
function basis(ax,up){const a=V.norm(ax);let u=V.perp(up||W_UP,a);if(V.len(u)<1e-5)u=V.perp([1,0,0],a);if(V.len(u)<1e-5)u=V.perp([0,0,1],a);u=V.norm(u);return[a,u,V.cross(a,u)];}

function ik2(root,target,l1,l2,pole){
  const d=V.sub(target,root),dist=V.len(d);
  const dir=dist>1e-6?V.mul(d,1/dist):[0,-1,0];
  const reach=clamp(dist,Math.abs(l1-l2)+1e-4,l1+l2-1e-4);
  const ca=clamp((l1*l1+reach*reach-l2*l2)/(2*l1*reach),-1,1),a=Math.acos(ca);
  let pd=V.perp(pole||[0,0,1],dir);
  if(V.len(pd)<1e-6)pd=V.perp([0,0,1],dir);
  if(V.len(pd)<1e-6)pd=V.perp([1,0,0],dir);
  pd=V.norm(pd);
  const mid=V.add(root,V.add(V.mul(dir,l1*Math.cos(a)),V.mul(pd,l1*Math.sin(a))));
  const end=V.madd(root,dir,reach);
  return{mid,end,err:Math.max(0,dist-reach,0)+Math.max(0,(Math.abs(l1-l2)+1e-4)-dist)};
}
function solve(f,lo,hi,it=40){let flo=f(lo);for(let i=0;i<it;i++){const m=(lo+hi)/2,fm=f(m);if((fm<0)===(flo<0)){lo=m;flo=fm;}else hi=m;}return(lo+hi)/2;}

const DIM={hipW:.088,sacUp:.07,sacBack:.03,lumb:.14,thor:.30,shW:.183,shDn:.035,neck:.085,
  ua:.30,fa:.255,grip:.075,th:.44,sh:.43,ankH:.075,heel:.055,toe:.205};
DIM.hipH=DIM.th+DIM.sh+DIM.ankH; // altura de cadera de pie (0.945)

function themeHex(v,fb){try{const x=getComputedStyle(document.documentElement).getPropertyValue(v).trim();if(/^#[0-9a-f]{6}$/i.test(x))return x;}catch(e){}return fb;}
function hexA(h,a){const n=parseInt(h.slice(1),16);return'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+a+')';}

const COL={
  skin:'#d39a72',hair:'#2b1e16',shirt:'#3f5674',shorts:'#232b37',shoe:'#e4e7eb',sole:'#8b95a1',
  frame:'#56606e',frameD:'#3b4450',pad:'#2b313a',chrome:'#c4ccd4',plate:'#30363e',plateRim:'#4d5662',
  rubber:'#17191d',cable:'#b5bec8',accent:themeHex('--green','#4fe3c1'),glow:'255,78,46',wood:'#6b5440',screen:'#0b1220',
  outline:'#07090c',stage0:themeHex('--bg3','#182b28'),stage1:themeHex('--bg','#0b1514')
};
const _cc={};
function rgb(h){if(_cc[h])return _cc[h];const n=parseInt(h.slice(1),16);return(_cc[h]=[(n>>16)&255,(n>>8)&255,n&255]);}
function shade(h,f){const c=rgb(h);let r,g,b;
  if(f>=1){const t=Math.min(f-1,1);r=c[0]+(255-c[0])*t;g=c[1]+(255-c[1])*t;b=c[2]+(255-c[2])*t;}
  else{r=c[0]*f;g=c[1]*f;b=c[2]*f;}
  return'rgb('+(r|0)+','+(g|0)+','+(b|0)+')';}

const MUS={
  quads:{seg:'th',t:.56,a:.05,l:.008,ax:[.17,.045,.062]},
  hams:{seg:'th',t:.55,a:-.05,ax:[.17,.042,.056]},
  adductors:{seg:'th',t:.3,a:.005,l:-.058,ax:[.13,.045,.03]},
  calves:{seg:'sh',t:.28,a:-.048,ax:[.12,.034,.046]},
  biceps:{seg:'ua',t:.56,a:.034,ax:[.1,.03,.032]},
  triceps:{seg:'ua',t:.5,a:-.036,ax:[.115,.03,.034]},
  frontdelts:{seg:'ua',t:.1,a:.042,l:.01,ax:[.07,.03,.042]},
  sidedelts:{seg:'ua',t:.08,l:.05,ax:[.07,.042,.03]},
  reardelts:{seg:'ua',t:.1,a:-.042,l:.01,ax:[.07,.03,.042]},
  forearms:{seg:'fa',t:.3,a:.02,ax:[.09,.034,.036]},
  glutes:{seg:'P',o:[.068,-.005,-.088],ax:[.07,.085,.04],n:[.25,0,-1]},
  abductors:{seg:'P',o:[.128,.06,-.015],ax:[.03,.06,.06],n:[1,.2,-.1]},
  abs:{seg:'L',o:[0,.08,.102],ax:[.075,.15,.03],n:[0,0,1],mid:1},
  obliques:{seg:'L',o:[.112,.06,.05],ax:[.03,.11,.06],n:[1,0,.45]},
  lowback:{seg:'L',o:[.036,.06,-.092],ax:[.028,.12,.025],n:[.1,0,-1]},
  pecs:{seg:'T',o:[.074,.185,.107],ax:[.074,.06,.03],n:[.25,.1,1]},
  upperpecs:{seg:'T',o:[.07,.222,.1],ax:[.068,.038,.03],n:[.2,.35,1]},
  lowerpecs:{seg:'T',o:[.072,.155,.1],ax:[.07,.035,.03],n:[.2,-.2,1]},
  lats:{seg:'T',o:[.118,.1,-.04],ax:[.05,.13,.072],n:[.65,0,-.75]},
  midback:{seg:'T',o:[.058,.2,-.105],ax:[.058,.08,.025],n:[.1,0,-1]},
  traps:{seg:'T',o:[.075,.298,-.025],ax:[.06,.03,.042],n:[0,1,-.35]}
};

class Body{
  constructor(){
    this.sp=[0,0,0];this.hd=[0,0,0];this.sc={L:[0,0],R:[0,0]};
    this.S={L:{},R:{}};this.ikErr=0;this.hidden=false;this.col=Object.assign({},COL);
    this.pelvis([0,DIM.hipH,0]);
  }
  pelvis(pos,o){o=o||{};let fr={o:pos.slice(),R:[0,0,1],U:[0,1,0],F:[1,0,0]};
    if(o.yaw)fr=frot(fr,W_UP,o.yaw*D);
    if(o.tilt)fr=frot(fr,fr.R,-o.tilt*D);
    if(o.roll)fr=frot(fr,fr.F,o.roll*D);
    this.pf=fr;this._torso();return this;}
  spine(flex,side,twist){this.sp=[flex||0,side||0,twist||0];this._torso();return this;}
  head(flex,turn,tilt){this.hd=[flex||0,turn||0,tilt||0];this._torso();return this;}
  scap(side,elev,prot){const v=[elev||0,prot||0];if(side==='L'||side==='R')this.sc[side]=v;else{this.sc.L=v;this.sc.R=v.slice();}this._torso();return this;}
  _torso(){
    const p=this.pf,[fx,sx,tx]=this.sp;
    let lf={o:fpt(p,0,DIM.sacUp,-DIM.sacBack),R:p.R,U:p.U,F:p.F};
    lf=frot(lf,lf.R,-fx*.42*D);lf=frot(lf,lf.F,sx*.45*D);lf=frot(lf,lf.U,tx*.35*D);
    const waist=V.madd(lf.o,lf.U,DIM.lumb);
    let tf={o:waist,R:lf.R,U:lf.U,F:lf.F};
    tf=frot(tf,tf.R,-fx*.58*D);tf=frot(tf,tf.F,sx*.55*D);tf=frot(tf,tf.U,tx*.65*D);
    const neckB=V.madd(waist,tf.U,DIM.thor);
    let hf={o:neckB,R:tf.R,U:tf.U,F:tf.F};
    const[hx,ht,hl]=this.hd;
    hf=frot(hf,hf.U,ht*D);hf=frot(hf,hf.R,-hx*D);hf=frot(hf,hf.F,hl*D);
    this.lf=lf;this.tf=tf;this.hf=hf;this.waist=waist;this.neckB=neckB;
    this.neckT=fpt(hf,0,DIM.neck,.012);
    this.headC=V.add(this.neckT,fdir(hf,0,.085,.018));
    for(const s of['L','R']){const k=s==='R'?1:-1,sc=this.sc[s];
      this.S[s].sho=fpt(tf,k*DIM.shW,DIM.thor-DIM.shDn+sc[0],sc[1]-.005);
      this.S[s].hip=fpt(p,k*DIM.hipW,0,0);}
  }
  sho(s){return this.S[s].sho;}
  hip(s){return this.S[s].hip;}
  j(s,name){return this.S[s][name];}
  ppt(r,u,f){return fpt(this.pf,r,u,f);}
  tpt(r,u,f){const T=this.tf;return fpt({o:this.neckB,R:T.R,U:T.U,F:T.F},r,u,f);}
  hpt(r,u,f){const H=this.hf;return fpt({o:this.headC,R:H.R,U:H.U,F:H.F},r,u,f);}
  tdir(r,u,f){return fdir(this.tf,r,u,f);}
  pdir(r,u,f){return fdir(this.pf,r,u,f);}
  arm(s,target,pole,gripAxis){const k=s==='R'?1:-1,T=this.tf;
    pole=pole||V.add(V.mul(T.F,-1),V.add(V.mul(T.R,.35*k),V.mul(T.U,-.25)));
    const S=this.S[s],r=ik2(S.sho,target,DIM.ua,DIM.fa+DIM.grip,pole);
    this.ikErr=Math.max(this.ikErr,r.err);
    S.elb=r.mid;S.grip=r.end;S.wri=V.madd(r.mid,V.norm(V.sub(r.end,r.mid)),DIM.fa);
    S.armPole=V.norm(V.perp(pole,V.norm(V.sub(r.mid,S.sho))));
    S.gripAx=gripAxis||null;return this;}
  armFK(s,o){o=o||{};const k=s==='R'?1:-1,T=this.tf,S=this.S[s];
    let u=V.neg(T.U),a=T.F.slice();
    const rr=(ax,ang)=>{u=V.rot(u,ax,ang);a=V.rot(a,ax,ang);};
    if(o.flex)rr(T.R,o.flex*D);
    if(o.abd)rr(T.F,-k*o.abd*D);
    if(o.hz)rr(T.U,k*o.hz*D);
    if(o.rot)a=V.rot(a,u,-k*o.rot*D);
    const e=(o.elbow||0)*D,f=V.add(V.mul(u,Math.cos(e)),V.mul(a,Math.sin(e)));
    S.elb=V.madd(S.sho,u,DIM.ua);S.wri=V.madd(S.elb,f,DIM.fa);S.grip=V.madd(S.elb,f,DIM.fa+DIM.grip);
    S.armPole=V.neg(a);S.gripAx=o.grip||null;return this;}
  armDir(s,uDir,fDir,gripAxis){const S=this.S[s];const u=V.norm(uDir),f=V.norm(fDir);
    S.elb=V.madd(S.sho,u,DIM.ua);S.wri=V.madd(S.elb,f,DIM.fa);S.grip=V.madd(S.elb,f,DIM.fa+DIM.grip);
    const pp=V.perp(V.neg(f),u);S.armPole=V.len(pp)>1e-4?V.norm(pp):(S.armPole||V.neg(this.tf.F));S.gripAx=gripAxis||null;return this;}
  armVia(s,elbow,target,gripAxis){const S=this.S[s];const u=V.norm(V.sub(elbow,S.sho));const e=V.madd(S.sho,u,DIM.ua);
    const f=V.norm(V.sub(target,e));const err=Math.abs(V.dist(e,target)-(DIM.fa+DIM.grip));this.ikErr=Math.max(this.ikErr,err);
    return this.armDir(s,u,f,gripAxis);}
  legDir(s,tDir,sDir){const S=this.S[s];const t=V.norm(tDir),d=V.norm(sDir);
    S.kne=V.madd(S.hip,t,DIM.th);S.ank=V.madd(S.kne,d,DIM.sh);const pp=V.perp(V.neg(d),t);
    S.legPole=V.len(pp)>1e-4?V.norm(pp):(S.legPole||this.pf.F);if(!S.footSet)this._autoFoot(s,0);return this;}
  foot(s,ankle,fwd,up){const S=this.S[s];up=V.norm(up||W_UP);fwd=V.norm(V.perp(fwd,up));
    S.ank=ankle.slice();S.ffwd=fwd;S.fup=up;S.footSet=true;return this;}
  footFlat(s,heel,yaw,up){up=up?V.norm(up):W_UP;const f=V.norm(V.perp(V.yaw(yaw||0),up));
    return this.foot(s,V.add(heel,V.add(V.mul(f,DIM.heel),V.mul(up,DIM.ankH))),f,up);}
  footBall(s,ball,yaw,pitch,up){up=up?V.norm(up):W_UP;const f0=V.norm(V.perp(V.yaw(yaw||0),up));
    const side=V.norm(V.cross(up,f0)),a=(pitch||0)*D;
    const f=V.rot(f0,side,a),u=V.rot(up,side,a);
    const ank=V.add(ball,V.add(V.mul(f,-(DIM.toe-.06)),V.mul(u,DIM.ankH)));
    return this.foot(s,ank,f,u);}
  leg(s,ankle,pole){const S=this.S[s],P=this.pf;ankle=ankle||S.ank;
    pole=pole||P.F;const r=ik2(S.hip,ankle,DIM.th,DIM.sh,pole);
    this.ikErr=Math.max(this.ikErr,r.err);S.kne=r.mid;S.ank=r.end;
    S.legPole=V.norm(V.perp(pole,V.norm(V.sub(r.mid,S.hip))));
    if(!S.footSet)this._autoFoot(s,0);return this;}
  legFK(s,o){o=o||{};const k=s==='R'?1:-1,P=this.pf,S=this.S[s];
    let u=V.neg(P.U),a=P.F.slice();
    const rr=(ax,ang)=>{u=V.rot(u,ax,ang);a=V.rot(a,ax,ang);};
    if(o.flex)rr(P.R,o.flex*D);
    if(o.abd)rr(P.F,-k*o.abd*D);
    if(o.rot)a=V.rot(a,u,-k*o.rot*D);
    const kn=(o.knee||0)*D,sh=V.sub(V.mul(u,Math.cos(kn)),V.mul(a,Math.sin(kn)));
    S.kne=V.madd(S.hip,u,DIM.th);S.ank=V.madd(S.kne,sh,DIM.sh);S.legPole=a;
    if(!S.footSet||o.ankle!=null)this._autoFoot(s,o.ankle||0);return this;}
  _legFr(s){const S=this.S[s],td=V.norm(V.sub(S.kne,S.hip)),sd=V.norm(V.sub(S.ank,S.kne));
    const ap=V.perp(S.legPole,td),np=V.cross(V.len(ap)>1e-6?V.norm(ap):this.pf.F,td);
    const nL=V.norm(V.add(V.cross(td,sd),V.mul(np,.06)));
    return{td,sd,nL,ta:V.norm(V.cross(td,nL)),sa:V.norm(V.cross(sd,nL))};}
  _armFr(s){const S=this.S[s],ud=V.norm(V.sub(S.elb,S.sho)),fd=V.norm(V.sub(S.wri,S.elb));
    const ap=V.neg(V.perp(S.armPole,ud));const a0=V.len(ap)>1e-6?V.norm(ap):this.tf.F;
    const ua=V.norm(V.add(V.perp(fd,ud),V.mul(a0,.08)));
    const fa=V.norm(V.add(V.perp(V.neg(ud),fd),V.mul(V.perp(ua,fd),.08)));
    return{ud,fd,ua,fa};}
  _autoFoot(s,ang){const S=this.S[s];const L=this._legFr(s);
    const f=V.rot(L.sa,L.nL,(ang||0)*D);const up=V.norm(V.perp(V.neg(L.sd),f));
    S.ffwd=V.norm(f);S.fup=up;S.footSet=false;}
  footRelax(s,ang){this._autoFoot(s,ang);return this;}
  draw(E,mus,act){
    if(this.hidden)return;const C=this.col,P=this.pf,L=this.lf,T=this.tf,H=this.hf;
    const SL=this.S.L,SR=this.S.R;
    for(const s of['L','R'])if(!this.S[s].elb)this.armFK(s,{elbow:8});
    for(const s of['L','R'])if(!this.S[s].kne)this.legFK(s,{});
    const tg={grp:'torso'};
    E.ell(fpt(P,0,.035,-.014),[V.mul(P.R,.152),V.mul(P.U,.1),V.mul(P.F,.108)],C.shorts,tg);
    for(const k of[-1,1])E.ell(fpt(P,k*.066,-.01,-.066),[V.mul(P.R,.07),V.mul(P.U,.085),V.mul(P.F,.062)],C.shorts,tg);
    E.ell(fpt(L,0,.075,.012),[V.mul(L.R,.136),V.mul(L.U,.12),V.mul(L.F,.1)],C.shirt,tg);
    E.ell(fpt(T,0,.15,.012),[V.mul(T.R,.155),V.mul(T.U,.165),V.mul(T.F,.115)],C.shirt,tg);
    const sm=V.lerp(SL.sho,SR.sho,.5),sax=V.mul(V.sub(SR.sho,SL.sho),.5);
    E.ell(V.add(V.madd(sm,T.U,-.035),V.mul(T.F,-.012)),[V.mul(sax,1.02),V.mul(T.U,.07),V.mul(T.F,.088)],C.shirt,tg);
    E.ell(fpt(T,0,DIM.thor+.004,-.03),[V.mul(T.R,.085),V.mul(T.U,.045),V.mul(T.F,.052)],C.shirt,tg);
    const hg={grp:'head'};
    E.cap(V.madd(this.neckB,H.U,-.02),this.neckT,.05,.046,C.skin,hg);
    const hc=this.headC;
    const skAx=[V.mul(H.R,.078),V.mul(H.U,.108),V.mul(H.F,.096)];
    const skull=E.ell(hc,skAx,C.skin,hg);
    const jaw=E.ell(V.add(hc,fdir(H,0,-.052,.028)),[V.mul(H.R,.062),V.mul(H.U,.058),V.mul(H.F,.072)],C.skin,hg);
    E.over(Object.assign({k:'ell',c:V.add(hc,fdir(H,0,.04,-.045)),ax:[V.mul(H.R,.086),V.mul(H.U,.1),V.mul(H.F,.094)],col:C.hair},hg));
    const cut=(m,off)=>({m,rim:ellCut(hc,skAx,m,off)});
    E.over(Object.assign({k:'face',c:hc,ax:skAx,cuts:[cut(V.norm(V.sub(H.F,V.mul(H.U,.85))),.016)],skin:[skull,jaw]},hg));
    for(const k of[-1,1])E.over(Object.assign({k:'ell',c:fpt({o:hc,R:H.R,U:H.U,F:H.F},k*.076,-.006,-.004),ax:[V.mul(H.R,.012),V.mul(H.U,.026),V.mul(H.F,.018)],col:shadeHex(C.skin,.85),n:V.mul(H.R,k)},hg));
    for(const s of['L','R']){const S=this.S[s],k=s==='R'?1:-1,g1={grp:'ua'+s},g2={grp:'fa'+s};
      const AF=this._armFr(s),ud=AF.ud,fd=AF.fd,ant=AF.ua,lat=V.norm(V.cross(ud,ant));
      const latO=V.dot(lat,T.R)*k>=0?lat:V.neg(lat);
      S._ua={o:S.sho,ax:ud,a:ant,l:latO,len:DIM.ua};
      E.cap(V.madd(S.sho,ud,.04),S.elb,.046,.037,C.skin,g1);
      E.ell(V.add(V.madd(S.sho,ud,.045),V.mul(latO,.012)),[V.mul(ud,.085),V.mul(ant,.056),V.mul(latO,.058)],C.shirt,g1);
      E.cap(V.madd(S.sho,ud,.06),V.madd(S.sho,ud,.135),.054,.05,C.shirt,g1);
      E.cap(S.elb,S.wri,.039,.026,C.skin,g2);
      let ga=S.gripAx?V.norm(V.perp(S.gripAx,fd)):null;
      if(!ga||V.len(ga)<.1)ga=V.norm(V.perp(latO,fd));
      const pn=V.norm(V.cross(fd,ga));
      const fc=V.madd(S.wri,fd,.052);
      E.ell(fc,[V.mul(fd,.05),V.mul(ga,.044),V.mul(pn,.03)],C.skin,g2);
      S._fa={o:S.elb,ax:fd,a:AF.fa,l:V.norm(V.cross(fd,AF.fa)),len:DIM.fa};
    }
    for(const s of['L','R']){const S=this.S[s],k=s==='R'?1:-1,g1={grp:'th'+s},g2={grp:'sh'+s};
      const LF=this._legFr(s),td=LF.td,sd=LF.sd,ant=LF.ta;let lat=V.norm(V.cross(td,ant));if(V.dot(lat,P.R)*k<0)lat=V.neg(lat);
      S._th={o:S.hip,ax:td,a:ant,l:lat,len:DIM.th};
      E.cap(S.hip,S.kne,.084,.056,C.skin,g1);
      E.cap(V.madd(S.hip,td,-.01),V.madd(S.hip,td,.23),.09,.072,C.shorts,g1);
      const sant=LF.sa;let slat=V.norm(V.cross(sd,sant));if(V.dot(slat,lat)<0)slat=V.neg(slat);
      S._sh={o:S.kne,ax:sd,a:sant,l:slat,len:DIM.sh};
      E.cap(S.kne,S.ank,.054,.034,C.skin,g2);
      E.ell(V.add(V.madd(S.kne,sd,.13),V.mul(sant,-.016)),[V.mul(sd,.12),V.mul(sant,.046),V.mul(lat,.046)],C.skin,g2);
      const f=S.ffwd,u=S.fup,sl=V.norm(V.cross(f,u));
      const heel=V.add(S.ank,V.add(V.mul(f,-DIM.heel),V.mul(u,-DIM.ankH)));
      S.heel=heel;S.toe=V.madd(heel,f,DIM.heel+DIM.toe);S.ball=V.madd(heel,f,DIM.heel+DIM.toe-.06);
      E.ell(V.add(V.madd(heel,f,.125),V.mul(u,.036)),[V.mul(f,.138),V.mul(u,.042),V.mul(sl,.05)],C.shoe,g2);
      E.ell(V.add(V.madd(heel,f,.03),V.mul(u,.06)),[V.mul(f,.05),V.mul(u,.05),V.mul(sl,.046)],C.shoe,g2);
      E.over(Object.assign({k:'ell',c:V.add(V.madd(heel,f,.125),V.mul(u,.004)),ax:[V.mul(f,.142),V.mul(u,.012),V.mul(sl,.052)],col:C.sole,n:V.neg(u),nv:-.6},g2));
    }
    if(mus){const gcf=this.glowCol;for(const key in mus){const w=mus[key];if(!w)continue;
      let name=key,sides=['L','R'];const m=key.match(/^(.*)_(L|R)$/);if(m){name=m[1];sides=[m[2]];}
      const M=MUS[name];if(!M)continue;const gc=gcf?gcf(w):null;
      for(const s of sides){const k=s==='R'?1:-1,S=this.S[s];
        if(M.seg==='th'||M.seg==='sh'||M.seg==='ua'||M.seg==='fa'){
          const sg=S['_'+M.seg];if(!sg)continue;
          const c=V.add(V.madd(sg.o,sg.ax,M.t*sg.len),V.add(V.mul(sg.a,M.a||0),V.mul(sg.l,M.l||0)));
          let n=V.add(V.mul(sg.a,M.a||0),V.mul(sg.l,M.l||0));n=V.len(n)>1e-6?V.norm(n):sg.a;
          const gname=(M.seg==='th'?'th':M.seg==='sh'?'sh':M.seg==='ua'?'ua':'fa')+s;
          E.over({k:'glow',grp:gname,c,ax:[V.mul(sg.ax,M.ax[0]),V.mul(sg.a,M.ax[1]),V.mul(sg.l,M.ax[2])],n,w:w*act,m:name,gc});
        }else{
          const fr=M.seg==='P'?P:M.seg==='L'?L:{o:this.waist,R:T.R,U:T.U,F:T.F};
          const kk=M.mid?1:k;if(M.mid&&s==='L')continue;
          const c=fpt(fr,M.o[0]*kk,M.o[1],M.o[2]);
          const n=V.norm(fdir(fr,M.n[0]*kk,M.n[1],M.n[2]));
          E.over({k:'glow',grp:'torso',c,ax:[V.mul(fr.R,M.ax[0]),V.mul(fr.U,M.ax[1]),V.mul(fr.F,M.ax[2])],n,w:w*act,m:name,gc});
        }
      }
    }}
  }
}
function shadeHex(h,f){const c=rgb(h);const t=x=>('0'+Math.round(clamp(x*f,0,255)).toString(16)).slice(-2);return'#'+t(c[0])+t(c[1])+t(c[2]);}

class Scene{
  constructor(){this.items=[];this.overs=[];this.traces={};this.marks=[];}
  push(p,o){if(o){if(o.grp)p.grp=o.grp;if(o.layer)p.layer=o.layer;if(o.bias)p.bias=o.bias;if(o.outline===false)p.noOL=1;if(o.flat)p.flat=1;if(o.alpha!=null)p.alpha=o.alpha;if(o.round)p.round=o.round;}this.items.push(p);return p;}
}
function makeE(sc){
  const E={
    C:COL,V,D,
    cap:(a,b,ra,rb,col,o)=>sc.push({k:'cap',a,b,ra,rb:rb==null?ra:rb,col},o),
    sph:(c,r,col,o)=>sc.push({k:'ell',c,ax:[[r,0,0],[0,r,0],[0,0,r]],col},o),
    ell:(c,ax,col,o)=>sc.push({k:'ell',c,ax,col},o),
    box:(c,ax,col,o)=>sc.push({k:'box',c,ax,col},o),
    boxA:(c,size,col,o)=>{o=o||{};let ax=[[size[0]/2,0,0],[0,size[1]/2,0],[0,0,size[2]/2]];
      const rr=(k,a)=>{ax=ax.map(v=>V.rot(v,k,a));};
      if(o.roll)rr([1,0,0],o.roll*D);if(o.pitch)rr([0,0,1],o.pitch*D);if(o.yaw)rr(W_UP,o.yaw*D);
      return sc.push({k:'box',c,ax,col},o);},
    beam:(a,b,w,col,o)=>{o=o||{};const[ax,u,s]=basis(V.sub(b,a),o.up);const h=V.dist(a,b)/2;
      return sc.push({k:'box',c:V.lerp(a,b,.5),ax:[V.mul(ax,h),V.mul(u,(o.h||w)/2),V.mul(s,w/2)],col:col||COL.frame},o);},
    pad:(a,b,w,th,col,o)=>{o=Object.assign({round:3},o||{});const[ax,u,s]=basis(V.sub(b,a),o.up);const h=V.dist(a,b)/2;
      return sc.push({k:'box',c:V.lerp(a,b,.5),ax:[V.mul(ax,h),V.mul(u,th/2),V.mul(s,w/2)],col:col||COL.pad},o);},
    cyl:(a,b,r,col,o)=>sc.push({k:'cyl',a,b,r,col,cap:o&&o.cap},o),
    disc:(c,axis,r,th,col,o)=>{const n=V.norm(axis);return sc.push({k:'cyl',a:V.madd(c,n,-th/2),b:V.madd(c,n,th/2),r,col:col||COL.plate,hub:(o&&o.hub!=null)?o.hub:.22,rim:1},o);},
    plate:(c,axis,r,o)=>E.disc(c,axis,r||.225,(o&&o.th)||.045,(o&&o.col)||COL.plate,Object.assign({hub:.16},o)),
    line:(a,b,w,col,o)=>sc.push({k:'line',a,b,w:w||.008,col:col||COL.cable},o),
    poly:(pts,col,o)=>sc.push({k:'poly',pts,col},o),
    shadow:(c,rx,rz,alpha)=>sc.push({k:'shadow',c:[c[0],0.001,c[2]],rx,rz:rz||rx,alpha:alpha==null?.5:alpha,layer:-50}),
    over:p=>{sc.overs.push(p);return p;},
    trace:(key,p)=>{sc.marks.push([key,p]);},
    bar:(a,b,o)=>E.cyl(a,b,(o&&o.r)||.014,(o&&o.col)||COL.chrome,o),
    cable:(a,b,o)=>E.line(a,b,(o&&o.w)||.007,(o&&o.col)||COL.cable,o),
    pulley:(c,axis,r,o)=>E.disc(c,axis,r||.045,.025,COL.frameD,Object.assign({hub:.35},o)),
    dumbbell:(c,axis,o)=>{o=o||{};const n=V.norm(axis),hl=o.hl||.06,len=o.len||.135,r=o.r||.058;
      E.cyl(V.madd(c,n,-len/2-.01),V.madd(c,n,len/2+.01),.016,COL.chrome,o);
      for(const k of[-1,1]){const a=V.madd(c,n,k*(len/2)),b=V.madd(c,n,k*(len/2+hl));
        E.cyl(a,b,r,o.col||'#262b31',Object.assign({rim:1},o));}},
    stack:(base,o)=>{o=o||{};const yaw=o.yaw||0,f=V.yaw(yaw),s=V.yaw(yaw-90);const h=o.h||1.9,w=o.w||.3,n=o.n||14,ph=.028,lift=clamp(o.lift||0,0,h*.55),sel=o.sel||5;
      for(const k of[-1,1]){const g=V.madd(base,s,k*w*.42);E.cyl(V.add(g,[0,.05,0]),V.add(g,[0,h*.82,0]),.008,COL.chrome,{bias:o.bias});}
      const top=.06+n*ph;
      E.box(V.add(base,[0,.06+(n-sel)*ph/2,0]),[V.mul(f,.06),[0,(n-sel)*ph/2,0],V.mul(s,w/2)],'#2a3038',{bias:o.bias});
      E.box(V.add(base,[0,.06+(n-sel)*ph+sel*ph/2+lift,0]),[V.mul(f,.061),[0,sel*ph/2,0],V.mul(s,w/2+.002)],'#39424d',{bias:o.bias});
      E.box(V.add(base,[0,.06+(n-sel)*ph+sel*ph+lift+.01,0]),[V.mul(f,.04),[0,.012,0],V.mul(s,.03)],COL.accent,{bias:o.bias?o.bias-.01:-.01});
      return V.add(base,[0,top+lift,0]);},
    rope:(clip,a,b,o)=>{o=o||{};const col=o.col||'#3b4048';
      for(const h of[a,b]){const end=V.madd(h,V.norm(V.sub(h,clip)),.05);E.cap(clip,end,.011,.012,col,o);E.sph(V.madd(end,V.norm(V.sub(h,clip)),.015),.02,'#22262b',o);}
      E.sph(clip,.016,COL.chrome,o);},
    handle:(c,axis,o)=>{const n=V.norm(axis);E.cyl(V.madd(c,n,-.06),V.madd(c,n,.06),.016,'#2a2f35',o);},
    bench:(o)=>{o=o||{};const at=o.at||[0,0,0],yaw=o.dir||0,h=o.h||.45,sl=o.seat==null?.42:o.seat,bl=o.back==null?.8:o.back,inc=(o.inc||0)*D,w=o.w||.28,th=.075;
      const sd=V.yaw(yaw),bd=V.add(V.mul(sd,-Math.cos(inc)),[0,Math.sin(inc),0]);const hinge=V.add(at,[0,h,0]);
      const up=[0,1,0],bn=V.norm(V.cross(V.cross(bd,up),bd));const bnn=V.dot(bn,up)<0?V.neg(bn):bn;
      if(sl>0)E.pad(V.madd(V.madd(hinge,up,-th/2),sd,.0),V.madd(V.madd(hinge,up,-th/2),sd,sl),w,th,o.col||COL.pad,{up:[0,1,0],layer:o.layer==null?-1:o.layer});
      if(bl>0)E.pad(V.madd(V.madd(hinge,bnn,-th/2),bd,.01),V.madd(V.madd(hinge,bnn,-th/2),bd,bl),w,th,o.col||COL.pad,{up:bnn,layer:o.layer==null?-1:o.layer});
      const fl=V.madd(at,sd,sl*.85),rl=V.madd(at,bd,-0)/*dummy*/;const back2=V.add(at,V.mul(V.yaw(yaw),-Math.max(.35,bl*Math.cos(inc)*.85)));
      E.beam(V.add(fl,[0,.02,0]),V.add(back2,[0,.02,0]),.06,COL.frameD,{layer:-2});
      E.beam(V.add(at,[0,.02,0]),V.add(at,[0,h-th-.01,0]),.06,COL.frame,{layer:-2});
      if(sl>0)E.beam(V.add(fl,[0,.02,0]),V.add(V.madd(at,sd,sl*.8),[0,h-th-.01,0]),.05,COL.frame,{layer:-2});
      if(inc>.05)E.beam(V.add(back2,[0,.02,0]),V.madd(V.madd(hinge,bnn,-th-.01),bd,bl*.55),.05,COL.frame,{layer:-2});
      else E.beam(V.add(back2,[0,.02,0]),V.add(back2,[0,h-th-.01,0]),.06,COL.frame,{layer:-2});
      for(const p of[fl,back2])E.beam(V.add(p,[0,.02,-w*.75]),V.add(p,[0,.02,w*.75]),.05,COL.frameD,{layer:-2});
      return{hinge,sd,bd,n:bnn,top:h};},
    at:(x,y,z)=>[x,y,z],
    fpt,fdir,frot,DIM,
    solve,ik2,basis,clamp,mix,sstep,EASE
  };
  return E;
}

function walkOnTreadmill(c,b,E,o){
  o=o||{};const v=o.speed||1.25,T=o.period||1.14,inc=(o.incline||0)*D,duty=.6,t=c.t||0;
  const dir=[Math.cos(inc),Math.sin(inc),0],nrm=[-Math.sin(inc),Math.cos(inc),0],Z=[0,0,1],DY=.2;
  const deck=(s,z,h)=>[dir[0]*s+nrm[0]*(h||0),DY+dir[1]*s+nrm[1]*(h||0),z];
  const sHS=o.hs||.25,Ts=duty*T,t1=.12*T,t2=.42*T,ballOff=DIM.heel+DIM.toe-.06;
  const PHS=-17,PTO=o.toePitch||44;
  function footAt(ph,z){const tt=ph*T;let ank,f,u;
    const rotF=pitch=>{const th=-pitch*D;return[V.rot(dir,Z,th),V.rot(nrm,Z,th)];};
    const heelPose=(sH,pitch)=>{const[ff,uu]=rotF(pitch);const H=deck(sH,z);return[V.add(H,V.add(V.mul(ff,DIM.heel),V.mul(uu,DIM.ankH))),ff,uu];};
    const ballPose=(sB,pitch)=>{const[ff,uu]=rotF(pitch);const B=deck(sB,z);return[V.add(B,V.add(V.mul(ff,-(DIM.toe-.06)),V.mul(uu,DIM.ankH))),ff,uu];};
    const sBall2=sHS-v*t2+ballOff;
    if(tt<t1){return heelPose(sHS-v*tt,PHS*(1-EASE.sin(tt/t1)));}
    if(tt<t2){return heelPose(sHS-v*tt,0);}
    if(tt<Ts){const u2=(tt-t2)/(Ts-t2);return ballPose(sBall2-v*(tt-t2),PTO*Math.pow(u2,1.5));}
    const u2=(tt-Ts)/(T-Ts);const A=ballPose(sBall2-v*(Ts-t2),PTO),B=heelPose(sHS,PHS);
    const e=EASE.mj(u2);let a=V.lerp(A[0],B[0],e);
    const lift=(o.lift||.075)*Math.pow(Math.sin(PI*Math.min(1,u2*1.08)),1.3)*(1-.35*u2);a=V.madd(a,nrm,lift);
    const pitch=u2<.5?mix(PTO,-4,EASE.mj(u2/.5)):mix(-4,PHS,EASE.mj((u2-.5)/.5));
    const[ff,uu]=rotF(pitch);return[a,ff,uu];}
  const ph=c.cyc,phR=ph,phL=(ph+.5)%1,W2=TAU*ph;
  const lean=(o.lean||3)+inc/D*.6;
  const hy=DY+(o.hipH||.905)+.015*Math.cos(TAU*(2*ph-.62))+Math.sin(inc)*0;
  b.pelvis([.0,hy,.014*Math.sin(TAU*(ph-.05))],{tilt:lean,yaw:4.5*Math.cos(W2),roll:2*Math.sin(TAU*(ph-.05))});
  b.spine(0,0,-8*Math.cos(W2));b.head(-4-inc/D*.3,4*Math.cos(W2));
  for(const[s,p2,k]of[['R',phR,1],['L',phL,-1]]){const F=footAt(p2,k*.075);b.foot(s,F[0],F[1],F[2]);b.leg(s,null,[1,.05,k*.06]);}
  for(const[s,k]of[['R',1],['L',-1]]){const sw=-k*Math.cos(W2);b.armFK(s,{flex:3+(o.arm||17)*sw,abd:8,elbow:28+10*Math.max(0,sw),rot:10});}
  const C=COL,hw=.31;
  const corners=[deck(-.86,-hw-.06),deck(.86,-hw-.06),deck(.86,hw+.06),deck(-.86,hw+.06)];
  E.box(deck(0,0,-.06),[V.mul(dir,.9),V.mul(nrm,.06),[0,0,.42]],C.frameD,{layer:-2});
  E.poly([deck(-.84,-hw,.001),deck(.84,-hw,.001),deck(.84,hw,.001),deck(-.84,hw,.001)],'#16191d',{layer:-1,flat:1});
  for(const k of[-1,1])E.box(deck(0,k*(hw+.05),.0),[V.mul(dir,.88),V.mul(nrm,.012),[0,0,.05]],'#5b6573',{layer:-1});
  const sp=.28,off=((v*t)%sp+sp)%sp;
  for(let s=.84-off;s>-.84;s-=sp)E.line(deck(s,-hw+.02,.003),deck(s,hw-.02,.003),.012,'#262b31',{layer:-1,outline:false});
  const fr=deck(.98,0,.06);E.box(fr,[V.mul(dir,.16),V.mul(nrm,.11),[0,0,.43]],C.frame,{layer:-1});
  const con=V.add(deck(.82,0),[0,1.08,0]);
  for(const k of[-1,1]){const base=deck(.95,k*.38,.1);E.beam(base,[con[0]+.02,con[1]-.05,k*.36],.05,C.frame);
    E.beam([con[0]-.04,con[1]-.22,k*.37],[con[0]-.62,con[1]-.28,k*.37],.035,'#6b7685');}
  E.boxA(con,[.12,.26,.74],C.frameD,{pitch:22});
  E.boxA(V.add(con,[-.05,.02,0]),[.01,.16,.42],C.screen,{pitch:22,outline:false});
  E.shadow(deck(0,0),.95,.5,.6);
}

function makeCam(cam){
  const yaw=(cam.yaw||0)*D,pit=(cam.pitch||0)*D;
  const d=[Math.sin(yaw)*Math.cos(pit),Math.sin(pit),Math.cos(yaw)*Math.cos(pit)];
  const R=V.norm(V.cross(W_UP,d)),U=V.cross(d,R);
  return{d,R,U,t:cam.target||[0,.9,0],persp:cam.persp==null?.06:cam.persp,zoom:1,ox:0,oy:0,
    L:V.norm(V.add(V.add(V.mul(R,-.45),V.mul(U,.75)),V.mul(d,.5)))};
}
function proj(cm,p){const q=[p[0]-cm.t[0],p[1]-cm.t[1],p[2]-cm.t[2]];
  const z=-(q[0]*cm.d[0]+q[1]*cm.d[1]+q[2]*cm.d[2]);const s=1/(1+z*cm.persp);
  const k=cm.zoom*s;
  return[cm.ox+(q[0]*cm.R[0]+q[1]*cm.R[1]+q[2]*cm.R[2])*k,cm.oy-(q[0]*cm.U[0]+q[1]*cm.U[1]+q[2]*cm.U[2])*k,z,k];}
function pvec(cm,v,k){return[(v[0]*cm.R[0]+v[1]*cm.R[1]+v[2]*cm.R[2])*k,-(v[0]*cm.U[0]+v[1]*cm.U[1]+v[2]*cm.U[2])*k];}
function ellipse2(cm,c,ax){const P=proj(cm,c);let sxx=0,sxy=0,syy=0;
  for(const v of ax){const q=pvec(cm,v,P[3]);sxx+=q[0]*q[0];sxy+=q[0]*q[1];syy+=q[1]*q[1];}
  const tr=(sxx+syy)/2,det=sxx*syy-sxy*sxy,dsc=Math.sqrt(Math.max(tr*tr-det,0));
  return{x:P[0],y:P[1],z:P[2],a:Math.sqrt(tr+dsc),b:Math.sqrt(Math.max(tr-dsc,0)),r:.5*Math.atan2(2*sxy,sxx-syy)};}

const L2=[-.56,-.83];
function prepare(cm,sc){
  const out=[];
  for(const it of sc.items){
    let z=0;
    if(it.k==='cap'){const A=proj(cm,it.a),B=proj(cm,it.b);it._A=A;it._B=B;it._ra=it.ra*A[3];it._rb=it.rb*B[3];z=(A[2]+B[2])/2;}
    else if(it.k==='ell'){const e=ellipse2(cm,it.c,it.ax);it._e=e;z=e.z;}
    else if(it.k==='box'){const c=it.c,[a,b,d]=it.ax;const P=[];
      for(let i=0;i<8;i++){const sa=i&1?1:-1,sb=i&2?1:-1,sd=i&4?1:-1;
        P.push(proj(cm,[c[0]+a[0]*sa+b[0]*sb+d[0]*sd,c[1]+a[1]*sa+b[1]*sb+d[1]*sd,c[2]+a[2]*sa+b[2]*sb+d[2]*sd]));}
      it._P=P;z=proj(cm,c)[2];}
    else if(it.k==='cyl'){const A=proj(cm,it.a),B=proj(cm,it.b);it._A=A;it._B=B;z=(A[2]+B[2])/2;}
    else if(it.k==='line'){const A=proj(cm,it.a),B=proj(cm,it.b);it._A=A;it._B=B;z=(A[2]+B[2])/2;}
    else if(it.k==='poly'){it._P=it.pts.map(p=>proj(cm,p));z=it._P.reduce((s,p)=>s+p[2],0)/it._P.length;}
    else if(it.k==='shadow'){const e=ellipse2(cm,it.c,[[it.rx,0,0],[0,0,0],[0,0,it.rz]]);it._e=e;z=e.z;}
    it._z=z+(it.bias||0);out.push(it);
  }
  for(const o of sc.overs){o._e=ellipse2(cm,o.c,o.ax);}
  return out;
}
function bounds(cm,sc,bb){
  const ext=(x,y,r)=>{if(x-r<bb[0])bb[0]=x-r;if(y-r<bb[1])bb[1]=y-r;if(x+r>bb[2])bb[2]=x+r;if(y+r>bb[3])bb[3]=y+r;};
  for(const it of sc.items){
    if(it.k==='cap'){ext(it._A[0],it._A[1],it._ra);ext(it._B[0],it._B[1],it._rb);}
    else if(it.k==='ell'||it.k==='shadow'){if(it.k==='shadow')continue;ext(it._e.x,it._e.y,it._e.a);}
    else if(it.k==='box'||it.k==='poly'){for(const p of it._P)ext(p[0],p[1],0);}
    else if(it.k==='cyl'){const r=it.r*it._A[3];ext(it._A[0],it._A[1],r);ext(it._B[0],it._B[1],r);}
    else if(it.k==='line'){ext(it._A[0],it._A[1],0);ext(it._B[0],it._B[1],0);}
  }
}
function capPath(ctx,A,ra,B,rb){
  const dx=B[0]-A[0],dy=B[1]-A[1],d=Math.hypot(dx,dy);
  if(d<=Math.abs(ra-rb)+.01){const big=ra>rb?A:B;ctx.arc(big[0],big[1],Math.max(ra,rb),0,TAU);return;}
  const th=Math.atan2(dy,dx),ph=Math.acos(clamp((ra-rb)/d,-1,1));
  ctx.arc(A[0],A[1],ra,th+ph,th-ph+TAU);ctx.arc(B[0],B[1],rb,th-ph,th+ph);ctx.closePath();
}
function cylGeom(cm,it){const A=it._A,B=it._B;const r=it.r;
  const w0=r*A[3],w1=r*B[3];const ax=V.norm(V.sub(it.b,it.a));const cz=Math.abs(V.dot(ax,cm.d));
  let ex=B[0]-A[0],ey=B[1]-A[1];const L=Math.hypot(ex,ey);
  if(L<1e-4){ex=1;ey=0;}else{ex/=L;ey/=L;}
  return{A,B,w0,w1,m0:w0*cz,m1:w1*cz,ex,ey,rot:Math.atan2(ey,ex),capB:V.dot(ax,cm.d)>0,L};}
function cylPath(ctx,g,o){const{A,B,ex,ey,rot}=g,nx=-ey,ny=ex;const w0=g.w0+o,w1=g.w1+o,m0=g.m0+o,m1=g.m1+o;
  ctx.moveTo(A[0]+nx*w0,A[1]+ny*w0);ctx.lineTo(B[0]+nx*w1,B[1]+ny*w1);
  ctx.ellipse(B[0],B[1],Math.max(m1,.01),w1,rot,PI/2,-PI/2,true);
  ctx.lineTo(A[0]-nx*w0,A[1]-ny*w0);
  ctx.ellipse(A[0],A[1],Math.max(m0,.01),w0,rot,-PI/2,-3*PI/2,true);ctx.closePath();}
function boxFaces(cm,it){const[a,b,d]=it.ax;const F=[];
  const fs=[[a,1,[1,3,7,5]],[a,-1,[0,4,6,2]],[b,1,[2,6,7,3]],[b,-1,[0,1,5,4]],[d,1,[4,5,7,6]],[d,-1,[0,2,3,1]]];
  for(const[ax,sg,idx]of fs){const n=V.norm(V.mul(ax,sg));if(V.dot(n,cm.d)>.002)F.push([n,idx]);}
  return F;}

function toneOf(z){return 1-clamp(z/.6,-1,1)*.12;}
function drawScene(ctx,cm,sc,W,H,opt){
  const items=prepare(cm,sc);
  const groups=new Map();const solo=[];
  for(const it of items){if(it.grp){let g=groups.get(it.grp);if(!g){g={items:[],z:0,layer:0,overs:[]};groups.set(it.grp,g);}g.items.push(it);g.layer=Math.max(g.layer,it.layer||0);}else solo.push({items:[it],z:it._z,layer:it.layer||0,overs:[]});}
  for(const o of sc.overs){const g=groups.get(o.grp);if(g)g.overs.push(o);}
  const list=solo;for(const g of groups.values()){g.z=g.items.reduce((s,i)=>s+i._z,0)/g.items.length;list.push(g);}
  list.sort((a,b)=>(a.layer-b.layer)||(b.z-a.z));
  const OL=opt.ol;
  for(const g of list){
    const ol=g.items.some(i=>!i.noOL&&i.k!=='shadow'&&i.k!=='line');
    if(ol){ctx.fillStyle=COL.outline;ctx.strokeStyle=COL.outline;
      for(const it of g.items){if(it.noOL)continue;shapePath(ctx,cm,it,OL,true);}}
    for(const it of g.items)fillItem(ctx,cm,it);
    if(g.overs.length){ctx.save();ctx.beginPath();for(const it of g.items){if(it.k==='cap'||it.k==='ell')shapePath(ctx,cm,it,0,false,true);}ctx.clip();
      for(const o of g.overs)drawOver(ctx,cm,o);ctx.restore();}
  }
}
function shapePath(ctx,cm,it,o,fill,clipOnly){
  if(!clipOnly)ctx.beginPath();
  if(it.k==='cap'){capPath(ctx,it._A,it._ra+o,it._B,it._rb+o);}
  else if(it.k==='ell'){const e=it._e;ctx.moveTo(e.x+(e.a+o)*Math.cos(e.r),e.y+(e.a+o)*Math.sin(e.r));ctx.ellipse(e.x,e.y,e.a+o,e.b+o,e.r,0,TAU);}
  else if(it.k==='cyl'){cylPath(ctx,cylGeom(cm,it),o);}
  else if(it.k==='box'){const F=boxFaces(cm,it);for(const[n,idx]of F){const P=it._P;ctx.moveTo(P[idx[0]][0],P[idx[0]][1]);for(let i=1;i<4;i++)ctx.lineTo(P[idx[i]][0],P[idx[i]][1]);ctx.closePath();}
    if(!clipOnly){ctx.lineJoin='round';ctx.lineWidth=o*2+(it.round||0);ctx.stroke();ctx.fill();}return;}
  else if(it.k==='poly'){const P=it._P;ctx.moveTo(P[0][0],P[0][1]);for(let i=1;i<P.length;i++)ctx.lineTo(P[i][0],P[i][1]);ctx.closePath();
    if(!clipOnly){ctx.lineJoin='round';ctx.lineWidth=o*2;ctx.stroke();ctx.fill();}return;}
  else return;
  if(!clipOnly)ctx.fill();
}
function fillItem(ctx,cm,it){
  const tn=toneOf(it._z-(it.bias||0));const col=it.col;
  if(it.alpha!=null)ctx.globalAlpha=it.alpha;
  if(it.k==='cap'){const A=it._A,B=it._B;let nx=-(B[1]-A[1]),ny=B[0]-A[0];const l=Math.hypot(nx,ny);
    if(l<1e-3){nx=L2[0];ny=L2[1];}else{nx/=l;ny/=l;}
    if(nx*L2[0]+ny*L2[1]<0){nx=-nx;ny=-ny;}
    const R=Math.max(it._ra,it._rb),mx=(A[0]+B[0])/2,my=(A[1]+B[1])/2;
    const g=ctx.createLinearGradient(mx+nx*R,my+ny*R,mx-nx*R,my-ny*R);
    g.addColorStop(0,shade(col,tn*1.22));g.addColorStop(.38,shade(col,tn*1.0));g.addColorStop(1,shade(col,tn*.62));
    ctx.fillStyle=g;ctx.beginPath();capPath(ctx,A,it._ra,B,it._rb);ctx.fill();}
  else if(it.k==='ell'){const e=it._e;if(e.a<.05){ctx.globalAlpha=1;return;}
    ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.r);ctx.scale(e.a,Math.max(e.b,.05));
    const cr=Math.cos(-e.r),sr=Math.sin(-e.r);let lx=(L2[0]*cr-L2[1]*sr)/e.a,ly=(L2[0]*sr+L2[1]*cr)/Math.max(e.b,.05);const ll=Math.hypot(lx,ly)||1;lx=lx/ll*.42;ly=ly/ll*.42;
    const g=ctx.createRadialGradient(lx,ly,0,lx*.4,ly*.4,1.32);
    g.addColorStop(0,shade(col,tn*1.2));g.addColorStop(.5,shade(col,tn*.98));g.addColorStop(1,shade(col,tn*.6));
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,1,0,TAU);ctx.fill();ctx.restore();}
  else if(it.k==='cyl'){const g=cylGeom(cm,it);const nx=-g.ey,ny=g.ex;let sx=nx,sy=ny;if(sx*L2[0]+sy*L2[1]<0){sx=-sx;sy=-sy;}
    const w=Math.max(g.w0,g.w1),mx=(g.A[0]+g.B[0])/2,my=(g.A[1]+g.B[1])/2;
    const gr=ctx.createLinearGradient(mx+sx*w,my+sy*w,mx-sx*w,my-sy*w);
    const metal=col===COL.chrome;
    gr.addColorStop(0,shade(col,tn*(metal?1.35:1.18)));gr.addColorStop(metal?.22:.4,shade(col,tn));gr.addColorStop(metal?.55:.8,shade(col,tn*(metal?.55:.72)));gr.addColorStop(1,shade(col,tn*(metal?.8:.6)));
    ctx.fillStyle=gr;ctx.beginPath();cylPath(ctx,g,0);ctx.fill();
    const P=g.capB?g.B:g.A,m=g.capB?g.m1:g.m0,w2=g.capB?g.w1:g.w0;
    if(m>.6){ctx.fillStyle=shade(col,tn*(it.rim?1.08:1.12));ctx.beginPath();ctx.ellipse(P[0],P[1],m,w2,g.rot,0,TAU);ctx.fill();
      if(it.rim){ctx.strokeStyle=shade(col,tn*1.35);ctx.lineWidth=Math.max(.6,w2*.06);ctx.beginPath();ctx.ellipse(P[0],P[1],m*.86,w2*.86,g.rot,0,TAU);ctx.stroke();}
      if(it.hub){ctx.fillStyle=shade(COL.chrome,tn*.9);ctx.beginPath();ctx.ellipse(P[0],P[1],m*it.hub,w2*it.hub,g.rot,0,TAU);ctx.fill();}}}
  else if(it.k==='box'){const F=boxFaces(cm,it),P=it._P;
    for(const[n,idx]of F){const lam=.58+.5*Math.max(0,V.dot(n,cm.L));
      ctx.fillStyle=shade(col,tn*lam);ctx.beginPath();ctx.moveTo(P[idx[0]][0],P[idx[0]][1]);for(let i=1;i<4;i++)ctx.lineTo(P[idx[i]][0],P[idx[i]][1]);ctx.closePath();ctx.fill();
      if(it.round){ctx.strokeStyle=ctx.fillStyle;ctx.lineJoin='round';ctx.lineWidth=it.round;ctx.stroke();}}
  }
  else if(it.k==='poly'){const P=it._P;let n=V.norm(V.cross(V.sub(it.pts[1],it.pts[0]),V.sub(it.pts[2],it.pts[0])));if(V.dot(n,cm.d)<0)n=V.neg(n);
    const lam=it.flat?1:.6+.45*Math.max(0,V.dot(n,cm.L));ctx.fillStyle=shade(col,tn*lam);ctx.beginPath();ctx.moveTo(P[0][0],P[0][1]);for(let i=1;i<P.length;i++)ctx.lineTo(P[i][0],P[i][1]);ctx.closePath();ctx.fill();}
  else if(it.k==='line'){const A=it._A,B=it._B;ctx.strokeStyle=shade(col,tn);ctx.lineCap='round';ctx.lineWidth=Math.max(.8,it.w*(A[3]+B[3])/2);ctx.beginPath();ctx.moveTo(A[0],A[1]);ctx.lineTo(B[0],B[1]);ctx.stroke();}
  else if(it.k==='shadow'){const e=it._e;if(e.a<.5){ctx.globalAlpha=1;return;}ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.r);ctx.scale(e.a,Math.max(e.b,.3));
    const g=ctx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,'rgba(0,0,0,'+it.alpha+')');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,1,0,TAU);ctx.fill();ctx.restore();}
  ctx.globalAlpha=1;
}
function drawOver(ctx,cm,o){const e=o._e;o._vis=0;if(e.a<.3)return;
  let vis=1;if(o.n){const dn=V.dot(o.n,cm.d);vis=o.nv!=null?(dn<o.nv?0:1):sstep(-.28,.42,dn);}o._vis=vis;if(vis<=.01)return;
  if(o.k==='glow'&&o.w<.005)return; // brillo nulo (el mapa muscular lo usa solo como zona para tocar)
  if(o.k==='face'){drawCap(ctx,cm,o);return;}
  ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.r);ctx.scale(e.a,Math.max(e.b,.2));
  if(o.k==='glow'){const a=clamp(o.w,0,1.2)*vis,gc=o.gc||COL.glow;const g=ctx.createRadialGradient(0,0,0,0,0,1);
    g.addColorStop(0,'rgba('+gc+','+Math.min(.92,.95*a).toFixed(3)+')');g.addColorStop(.6,'rgba('+gc+','+(.62*a).toFixed(3)+')');g.addColorStop(1,'rgba('+gc+',0)');ctx.fillStyle=g;}
  else{ctx.globalAlpha=vis;const tn=toneOf(e.z);const cr=Math.cos(-e.r),sr=Math.sin(-e.r);let lx=(L2[0]*cr-L2[1]*sr)/e.a,ly=(L2[0]*sr+L2[1]*cr)/Math.max(e.b,.2);const ll=Math.hypot(lx,ly)||1;lx=lx/ll*.4;ly=ly/ll*.4;
    const g=ctx.createRadialGradient(lx,ly,0,0,0,1.3);g.addColorStop(0,shade(o.col,tn*1.25));g.addColorStop(1,shade(o.col,tn*.7));ctx.fillStyle=g;}
  ctx.beginPath();ctx.arc(0,0,1,0,TAU);ctx.fill();ctx.restore();ctx.globalAlpha=1;}
function ellCut(c,ax,m,off){const w=ax.map(a=>V.dot(a,m)),w2=V.dot(w,w)||1e-9,s0=V.mul(w,off/w2),rho=Math.sqrt(Math.max(0,1-off*off/w2));
  const wn=V.norm(w),e1=V.norm(V.perp(Math.abs(wn[0])<.9?[1,0,0]:[0,1,0],wn)),e2=V.cross(wn,e1);
  const A=s=>V.add(V.add(V.mul(ax[0],s[0]),V.mul(ax[1],s[1])),V.mul(ax[2],s[2]));
  return{c:V.add(c,A(s0)),u1:V.mul(A(e1),rho),u2:V.mul(A(e2),rho)};}
function capPasses(cm,o,cut){const ax=o.ax,r=cut.rim,md=V.dot(cut.m,cm.d),re=ellipse2(cm,r.c,[r.u1,r.u2,[0,0,0]]);
  const Q=x=>ax.reduce((s,a)=>V.add(s,V.mul(a,V.dot(a,x)/Math.pow(V.dot(a,a),2))),[0,0,0]);
  const dc=V.sub(r.c,o.c),A=V.dot(Q(r.u1),cm.d),B=V.dot(Q(r.u2),cm.d),C0=V.dot(Q(dc),cm.d),Rr=Math.hypot(A,B);
  if(Rr<1e-9||Math.abs(C0)>=Rr){const seen=V.dot(Q(V.add(dc,r.u1)),cm.d)>0;
    return seen?[[{k:md>=0?'in':'out',e:re}]]:md>=0?[[]]:[];}
  const ph=Math.atan2(B,A),dl=Math.acos(clamp(-C0/Rr,-1,1));
  const T=[ph+dl,ph-dl].map(t=>proj(cm,V.add(r.c,V.add(V.mul(r.u1,Math.cos(t)),V.mul(r.u2,Math.sin(t))))));
  const pm=pvec(cm,cut.m,1),vx=T[1][0]-T[0][0],vy=T[1][1]-T[0][1],L=Math.hypot(vx,vy);
  let nx,ny;if(L>1e-6){nx=-vy/L;ny=vx/L;}else{const l=Math.hypot(pm[0],pm[1])||1;nx=pm[0]/l;ny=pm[1]/l;}
  if(nx*pm[0]+ny*pm[1]<0){nx=-nx;ny=-ny;}
  const half={k:'half',x:T[0][0],y:T[0][1],nx,ny};
  return md>=0?[[half],[{k:'in',e:re}]]:[[half,{k:'out',e:re}]];}
function drawCap(ctx,cm,o){let P=[[]];
  for(const cut of o.cuts){const Q=capPasses(cm,o,cut),N=[];for(const p of P)for(const q of Q)N.push(p.concat(q));P=N;if(!P.length)return;}
  const S=1e4,clip=op=>{ctx.beginPath();
    if(op.k==='half'){const vx=-op.ny,vy=op.nx;ctx.moveTo(op.x+vx*S,op.y+vy*S);ctx.lineTo(op.x+vx*S+op.nx*S,op.y+vy*S+op.ny*S);
      ctx.lineTo(op.x-vx*S+op.nx*S,op.y-vy*S+op.ny*S);ctx.lineTo(op.x-vx*S,op.y-vy*S);ctx.closePath();ctx.clip();return;}
    const e=op.e;if(op.k==='out')ctx.rect(-S,-S,2*S,2*S);ctx.ellipse(e.x,e.y,Math.max(e.a,.01),Math.max(e.b,.01),e.r,0,TAU);ctx.clip(op.k==='out'?'evenodd':'nonzero');};
  for(const p of P){ctx.save();p.forEach(clip);for(const it of o.skin)fillItem(ctx,cm,it);ctx.restore();}}

const RESERVED={dur:1,label:1,ease:1};
function compileTL(spec){
  const steps=spec.timeline&&spec.timeline.length?spec.timeline:[{dur:(spec.cycle&&spec.cycle.period)||2}];
  let lastAct=.55;for(const s of steps)if(s.act!=null)lastAct=s.act;
  let cur=Object.assign({p:0,act:lastAct},spec.init||{});const out=[];let t0=0;
  for(const s of steps){const from=Object.assign({},cur),to=Object.assign({},cur);
    for(const k in s)if(!RESERVED[k])to[k]=s[k];
    out.push({t0,dur:s.dur,from,to,ease:EASE[s.ease||'mj']||EASE.mj,label:s.label||''});t0+=s.dur;cur=to;}
  return{steps:out,total:t0};}
function evalTL(tl,spec,t){const T=tl.total;let tt=((t%T)+T)%T;let st=tl.steps[tl.steps.length-1];
  for(const s of tl.steps){if(tt<s.t0+s.dur){st=s;break;}}
  const u=clamp((tt-st.t0)/st.dur,0,1),e=st.ease(u),c={};
  for(const k in st.to){const a=st.from[k],b=st.to[k];c[k]=(typeof a==='number'&&typeof b==='number')?a+(b-a)*e:b;}
  c.t=t;c.u=u;c.step=st;c.stepIdx=tl.steps.indexOf(st);
  if(spec.cycle){const per=spec.cycle.period||1;c.cyc=((t/per)%1+1)%1;}
  return c;}

const DEFS={},ALIAS={};
function def(key,spec){spec.key=key;spec._tl=compileTL(spec);DEFS[key]=spec;return spec;}
function alias(key,target,patch){ALIAS[key]={target,patch:patch||null};}
function getDef(key){if(DEFS[key])return DEFS[key];const a=ALIAS[key];if(!a)return null;const base=DEFS[a.target];if(!base)return null;
  if(!a.patch)return base;if(!a._m){a._m=Object.assign({},base,a.patch);a._m.key=key;a._m._tl=compileTL(a._m);}return a._m;}
function buildFrame(spec,c){const sc=new Scene(),E=makeE(sc),b=new Body();
  if(spec.style)Object.assign(b.col,spec.style);
  spec.build(c,b,E);
  b.draw(E,spec.muscles,c.act==null?.6:c.act);
  return{sc,b};}

function fitCam(spec,W,H,pad,ov){
  const cm=makeCam(ov?Object.assign({},spec.cam,ov):(spec.cam||{}));const wn=[1e9,1e9,1e9],wx=[-1e9,-1e9,-1e9];
  const wp=p=>{for(let k=0;k<3;k++){if(p[k]<wn[k])wn[k]=p[k];if(p[k]>wx[k])wx[k]=p[k];}};const bb=[1e9,1e9,-1e9,-1e9];const tl=spec._tl;const N=14;
  const traces={};
  if(spec.fitBox){const[a,b]=spec.fitBox;for(let i=0;i<8;i++){const P=proj(cm,[i&1?b[0]:a[0],i&2?b[1]:a[1],i&4?b[2]:a[2]]);
      if(P[0]<bb[0])bb[0]=P[0];if(P[1]<bb[1])bb[1]=P[1];if(P[0]>bb[2])bb[2]=P[0];if(P[1]>bb[3])bb[3]=P[1];}}
  else for(let i=0;i<N;i++){const c=evalTL(tl,spec,tl.total*i/N+.0001);const{sc}=buildFrame(spec,c);prepare(cm,sc);bounds(cm,sc,bb);
    for(const it of sc.items){if(it.k==='shadow')continue;if(it.a)wp(it.a);if(it.b)wp(it.b);if(it.c)wp(it.c);if(it.pts)it.pts.forEach(wp);}}
  cm.wc=spec.fitBox?V.lerp(spec.fitBox[0],spec.fitBox[1],.5):V.lerp(wn,wx,.5);
  const bw=bb[2]-bb[0],bh=bb[3]-bb[1];
  const availW=W-pad.l-pad.r,availH=H-pad.t-pad.b;
  let z=Math.min(availW/bw,availH/bh)*(spec.cam&&spec.cam.zoom||1);
  cm.zoom=z;cm.ox=pad.l+availW/2-(bb[0]+bw/2)*z;cm.oy=pad.t+availH/2-(bb[1]+bh/2)*z;
  const M=48;
  for(let i=0;i<=M;i++){const c=evalTL(tl,spec,tl.total*i/M+.0001);const{sc}=buildFrame(spec,c);
    for(const[k,p]of sc.marks){(traces[k]=traces[k]||[]).push(proj(cm,p));}}
  cm.traces=traces;
  return cm;}

function drawHUD(ctx,spec,c,W,H,font){
  const tl=spec._tl;
  ctx.save();
  if(spec.labels&&spec.labels.length){ctx.font='600 10.5px '+font;ctx.textBaseline='middle';
    const txt=spec.labels.join(' · ');ctx.fillStyle='rgba('+COL.glow+',.95)';ctx.beginPath();ctx.arc(12,13,3,0,TAU);ctx.fill();
    ctx.fillStyle='rgba(235,238,242,.82)';ctx.fillText(txt,20,13.5);}
  const st=c.step;if(st&&st.label){ctx.font='600 11px '+font;ctx.textBaseline='middle';ctx.fillStyle='rgba(245,247,250,.92)';
    ctx.fillText(st.label,11,H-14);
    if(!spec.cycle||spec.showDur){const w=ctx.measureText(st.label).width;ctx.font='500 10px "DM Mono",ui-monospace,monospace';ctx.fillStyle='rgba(160,168,180,.85)';
      ctx.fillText(st.dur.toFixed(st.dur%1?1:0)+' s',11+w+6,H-14);}}
  if(spec.note){ctx.font='500 10px '+font;ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillStyle='rgba(160,168,180,.85)';ctx.fillText(spec.note,W-10,H-14);ctx.textAlign='left';}
  if(tl.steps.length>1){const y=H-3.5,x0=10,x1=W-10,gap=3,tot=tl.total,avail=x1-x0-gap*(tl.steps.length-1);let x=x0;
    for(const s of tl.steps){const w=avail*s.dur/tot;ctx.fillStyle='rgba(255,255,255,.09)';ctx.fillRect(x,y,w,2);
      if(s===st){ctx.fillStyle=COL.accent;ctx.fillRect(x,y,w*c.u,2);}else if(s.t0<st.t0){ctx.fillStyle=hexA(COL.accent,.45);ctx.fillRect(x,y,w,2);}
      x+=w+gap;}}
  ctx.restore();}

function drawBG(ctx,W,H){const g=ctx.createRadialGradient(W*.5,H*.42,10,W*.5,H*.5,Math.max(W,H)*.75);
  g.addColorStop(0,COL.stage0);g.addColorStop(1,COL.stage1);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);}
function drawFloor(ctx,cm,spec){const f=spec.floor;if(f===false)return;const y=(f&&f.y)||0;
  const c=cm.t,e=ellipse2(cm,[c[0],y,c[2]],[[2.2,0,0],[0,0,0],[0,0,2.2]]);
  ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.r);ctx.scale(e.a,Math.max(e.b,1));
  const g=ctx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,'rgba(255,255,255,.055)');g.addColorStop(.6,'rgba(255,255,255,.025)');g.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,1,0,TAU);ctx.fill();ctx.restore();}
function drawTraces(ctx,cm){if(!cm.traces)return;ctx.save();ctx.setLineDash([2.5,3.5]);ctx.lineWidth=1.3;ctx.strokeStyle=hexA(COL.accent,.42);ctx.lineCap='round';
  for(const k in cm.traces){const P=cm.traces[k];ctx.beginPath();P.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();}
  ctx.restore();}

const PAD={l:10,r:10,t:24,b:26};
const PADM={l:3,r:3,t:4,b:3},MINI_W=170,MINI_H=110,MINI_OPT={hud:false,traces:false,ol:.8};
function renderTo(ctx,spec,cm,c,W,H,opt){
  opt=opt||{};drawBG(ctx,W,H);drawFloor(ctx,cm,spec);
  const{sc,b}=buildFrame(spec,c);
  drawScene(ctx,cm,sc,W,H,{ol:opt.ol||1.15});
  if(opt.traces!==false)drawTraces(ctx,cm);
  if(opt.hud!==false)drawHUD(ctx,spec,c,W,H,opt.font||'"DM Sans",system-ui,sans-serif');
  return b;}

const live=new Set();let raf=0;const t0s={};let io=null,hintUntil=0;
const RM=()=>{try{return G.matchMedia&&G.matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){return false;}};
const NOW=()=>(G.performance?performance.now():Date.now());
const kick=()=>{if(!raf&&G.requestAnimationFrame)raf=requestAnimationFrame(loop);};
const ariaOf=(spec,el)=>(spec.title||'Animación del ejercicio')+(spec.labels?'. Músculos: '+spec.labels.join(', '):'')+(el&&el.hasAttribute&&el.hasAttribute('data-ga-notap')?'. Arrastra para girar.':'. Toca para pausar, arrastra para girar.');
function mount(el,key,o){
  const spec=getDef(key);if(!spec||!el)return null;o=o||{};
  let cv=el.querySelector('canvas.ga-cv');if(!cv){cv=document.createElement('canvas');cv.className='ga-cv';el.appendChild(cv);}
  cv.setAttribute('role','img');cv.setAttribute('aria-label',ariaOf(spec,el));
  const inst={el,cv,spec,key,W:0,H:0,cm:null,base:null,ctx:cv.getContext('2d'),vis:true,cost:0,skip:0,rm:RM(),
    paused:false,pausedAt:0,pauseAcc:0,dyaw:0,dpitch:0,drag:false,anim:null,dirty:1,touched:false};
  if(t0s[key]==null)t0s[key]=NOW()/1000;
  if(!hintUntil)hintUntil=NOW()+4500;
  resize(inst);live.add(inst);el._ga=inst;bindInput(inst);
  if(ensureIO())io.observe(el);
  if(inst.rm)drawStatic(inst);else kick();
  return inst;}
function ensureIO(){
  if(!io&&G.IntersectionObserver)io=new IntersectionObserver(es=>{for(const e of es){const t=e.target,i=t._gm||t._ga;if(!i)continue;
    const was=i.vis;i.vis=e.isIntersecting;
    if(i.kind==='map'){if(i.vis&&!was){i.lastAct=NOW();i.dirty=1;kick();}}
    else if(i.vis&&!i.rm)kick();}});
  return io;}
function camOf(inst){const c=inst.spec.cam||{};return{yaw:(c.yaw||0)+inst.dyaw,pitch:clamp((c.pitch||0)+inst.dpitch,-20,80)};}
function resize(inst){const r=inst.el.getBoundingClientRect();const W=Math.max(48,Math.round(r.width||inst.el.clientWidth||320)),H=Math.max(40,Math.round(r.height||inst.el.clientHeight||190));
  if(W===inst.W&&H===inst.H&&inst.cm)return;
  inst.mini=W<MINI_W||H<MINI_H;inst.pad=inst.mini?PADM:PAD;
  const dpr=Math.min(G.devicePixelRatio||1,2.5);inst.cv.width=Math.round(W*dpr);inst.cv.height=Math.round(H*dpr);inst.cv.style.width=W+'px';inst.cv.style.height=H+'px';
  inst.W=W;inst.H=H;inst.dpr=dpr;inst.base=fitCam(inst.spec,W,H,inst.pad);
  inst.cm=(inst.dyaw||inst.dpitch)?fitCam(inst.spec,W,H,inst.pad,camOf(inst)):inst.base;inst.dirty=1;if(inst.rm)drawStatic(inst);}
function dragCam(inst){const b=inst.base,cm=makeCam(Object.assign({},inst.spec.cam,camOf(inst)));cm.zoom=b.zoom;
  const P0=proj(b,b.wc);cm.ox=0;cm.oy=0;const P1=proj(cm,b.wc);cm.ox=P0[0]-P1[0];cm.oy=P0[1]-P1[1];cm.traces=null;return cm;}
function lerpCam(a,b,e){return Object.assign({},b,{zoom:mix(a.zoom,b.zoom,e),ox:mix(a.ox,b.ox,e),oy:mix(a.oy,b.oy,e),traces:e>=1?b.traces:null});}
function settle(inst){const to=(inst.dyaw||inst.dpitch)?fitCam(inst.spec,inst.W,inst.H,inst.pad||PAD,camOf(inst)):inst.base;
  if(inst.rm){inst.cm=to;drawStatic(inst);return;}inst.anim={k:'fit',from:inst.cm,to,t0:NOW(),d:260};inst.dirty=1;kick();}
function resetView(inst){if(!inst.dyaw&&!inst.dpitch)return;
  if(inst.rm){inst.dyaw=inst.dpitch=0;inst.cm=inst.base;drawStatic(inst);return;}
  inst.anim={k:'ret',dy:inst.dyaw,dp:inst.dpitch,t0:NOW(),d:420};kick();}
function togglePause(inst){if(inst.rm)return;const n=NOW();if(inst.paused)inst.pauseAcc+=n-inst.pausedAt;else inst.pausedAt=n;inst.paused=!inst.paused;inst.dirty=1;kick();}
function bindInput(inst){const el=inst.cv,cs=el.style;cs.touchAction='pan-y';cs.cursor='grab';cs.userSelect=cs.webkitUserSelect='none';cs.webkitTouchCallout='none';cs.webkitTapHighlightColor='transparent';
  let st=null,tapT=null,lastEnd=0;
  el.addEventListener('touchend',e=>{if(inst.mini)return;const n=NOW();if(n-lastEnd<350&&e.cancelable)e.preventDefault();lastEnd=n;},{passive:false});
  el.addEventListener('dblclick',e=>e.preventDefault());
  el.addEventListener('pointerdown',e=>{if(inst.mini){st=null;return;}st={x:e.clientX,y:e.clientY,t:NOW(),dy:inst.dyaw,dp:inst.dpitch,id:e.pointerId,type:e.pointerType,drag:false,mv:0};});
  el.addEventListener('pointermove',e=>{if(!st||e.pointerId!==st.id)return;const dx=e.clientX-st.x,dy=e.clientY-st.y;st.mv=Math.max(st.mv,Math.hypot(dx,dy));
    if(!st.drag&&Math.abs(dx)>7&&Math.abs(dx)>Math.abs(dy)*1.2){st.drag=true;inst.drag=true;inst.touched=true;inst.anim=null;el.style.cursor='grabbing';try{el.setPointerCapture(e.pointerId);}catch(_){}}
    if(st.drag){inst.dyaw=st.dy+dx*.55;if(st.type==='mouse')inst.dpitch=clamp(st.dp+dy*.35,-30,60);inst.cm=dragCam(inst);inst.dirty=1;if(inst.rm)drawStatic(inst);else kick();if(e.cancelable)e.preventDefault();}});
  const end=e=>{if(!st||e.pointerId!==st.id)return;const s=st;st=null;inst.drag=false;el.style.cursor='grab';
    try{if(el.hasPointerCapture&&el.hasPointerCapture(e.pointerId))el.releasePointerCapture(e.pointerId);}catch(_){}
    if(s.drag){settle(inst);return;}if(e.type!=='pointerup')return;
    const r=el.getBoundingClientRect(),inP=(x,y)=>x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom,inR=inP(e.clientX,e.clientY);
    if(NOW()-s.t<350&&s.mv<10&&!inR&&!inP(s.x,s.y)&&G.document){const t=document.elementFromPoint(e.clientX,e.clientY),
      b=t&&t!==el&&t.closest&&t.closest('button,a,[role="radio"],[onclick]');if(b&&!el.contains(b))b.click();return;}
    if(NOW()-s.t<350&&s.mv<10&&inR){inst.touched=true;if(tapT){clearTimeout(tapT);tapT=null;resetView(inst);}
      else if(!inst.el.hasAttribute('data-ga-notap'))tapT=setTimeout(()=>{tapT=null;togglePause(inst);},280);else tapT=setTimeout(()=>{tapT=null;},280);}};
  el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);el.addEventListener('lostpointercapture',e=>{if(st&&e.pointerId===st.id&&!st.drag)st=null;});}
function frame(inst,t){const{ctx,spec,cm,W,H,dpr}=inst;ctx.setTransform(dpr,0,0,dpr,0,0);
  const c=evalTL(spec._tl,spec,t);renderTo(ctx,spec,cm,c,W,H,inst.mini?MINI_OPT:null);if(!inst.mini)drawUI(inst);}
function drawUI(inst){const{ctx,W,H}=inst;ctx.save();
  if(inst.paused){ctx.fillStyle='rgba(0,0,0,.5)';ctx.beginPath();ctx.arc(W/2,H/2,19,0,TAU);ctx.fill();ctx.fillStyle='rgba(255,255,255,.92)';ctx.fillRect(W/2-6.5,H/2-7,4.5,14);ctx.fillRect(W/2+2,H/2-7,4.5,14);}
  let txt='';if(inst.dyaw||inst.dpitch)txt='↺ Doble toque: vista recomendada';else if(!inst.touched&&NOW()<hintUntil)txt='↔ Arrastra para girar';
  if(txt&&!inst.drag){ctx.font='600 9.5px "DM Sans",system-ui,sans-serif';const w=ctx.measureText(txt).width+12;
    ctx.font='600 10.5px "DM Sans",system-ui,sans-serif';const lw=inst.spec.labels?ctx.measureText(inst.spec.labels.join(' · ')).width+28:0;
    const y=lw+w+16>W?H-44:5;ctx.fillStyle='rgba(0,0,0,.5)';ctx.beginPath();if(ctx.roundRect)ctx.roundRect(W-10-w,y,w,16,8);else ctx.rect(W-10-w,y,w,16);ctx.fill();
    ctx.font='600 9.5px "DM Sans",system-ui,sans-serif';ctx.fillStyle='rgba(235,238,242,.9)';ctx.textBaseline='middle';ctx.fillText(txt,W-4-w,y+8.5);}
  ctx.restore();}
function drawStatic(inst){const{ctx,spec,cm,W,H,dpr}=inst;ctx.setTransform(dpr,0,0,dpr,0,0);
  renderTo(ctx,spec,cm,peakC(spec),W,H,inst.mini?MINI_OPT:null);}
function peakC(spec){const tl=spec._tl;let best=tl.steps[0];for(const s of tl.steps)if((s.to.p||0)>(best.to.p||0))best=s;
  return evalTL(tl,spec,best.t0+best.dur*.999);}
function loop(){raf=0;if(document.hidden){kick();return;}
  const n=NOW();let any=false;
  for(const inst of live){if(!inst.el.isConnected){live.delete(inst);if(io)io.unobserve(inst.el);continue;}
    if(inst.rm||!inst.vis)continue;
    const A=inst.anim;if(A){const e=EASE.mj((n-A.t0)/A.d);
      if(A.k==='fit')inst.cm=lerpCam(A.from,A.to,e);
      else{inst.dyaw=A.dy*(1-e);inst.dpitch=A.dp*(1-e);inst.cm=e>=1?inst.base:dragCam(inst);if(e>=1)inst.dyaw=inst.dpitch=0;}
      if(e>=1)inst.anim=null;inst.dirty=1;}
    const moving=!inst.paused||inst.anim||inst.drag;
    if(!moving&&!inst.dirty&&!(NOW()<hintUntil))continue;
    any=any||moving||NOW()<hintUntil;
    if(moving&&!inst.drag&&inst.cost>12&&(inst.skip=(inst.skip+1)%2))continue;
    const w=inst.el.clientWidth,h=inst.el.clientHeight;if((w&&w!==inst.W)||(h&&h!==inst.H))resize(inst);
    const t=((inst.paused?inst.pausedAt:n)-inst.pauseAcc)/1000-t0s[inst.key];
    const a=NOW();frame(inst,t);inst.dirty=0;if(moving)inst.cost=inst.cost*.9+(NOW()-a)*.1;}
  if(mapTick(n))any=true;
  if(any)kick();}
function mountAll(root){(root||document).querySelectorAll('[data-gym-anim]').forEach(el=>{if(!el._gaMounted){el._gaMounted=1;mount(el,el.getAttribute('data-gym-anim'));}else if(el._ga)revive(el._ga);});}
function revive(inst){if(!inst.el.isConnected)return false;if(!live.has(inst)){live.add(inst);if(ensureIO())io.observe(inst.el);}
  resize(inst);inst.dirty=1;if(inst.rm)drawStatic(inst);else kick();return true;}
function refresh(el){const i=el&&el._ga;return i?revive(i):false;}
function swap(el,key){
  if(!el)return null;const spec=getDef(key);if(!spec)return null;
  const i=el._ga;el.setAttribute('data-gym-anim',key);
  if(!i||el._gm){if(el._gm)unmount(el);el._gaMounted=1;return mount(el,key);}
  if(i.key===key)return i;
  i.spec=spec;i.key=key;i.dyaw=i.dpitch=0;i.anim=null;i.drag=false;i.paused=false;i.pausedAt=i.pauseAcc=0;i.cost=0;i.skip=0;
  i.cm=null;i.base=null;i.W=i.H=0; // obliga a reencuadrar con el ejercicio nuevo
  if(t0s[key]==null)t0s[key]=NOW()/1000;
  i.cv.setAttribute('aria-label',ariaOf(spec,el));
  if(el.isConnected){if(!live.has(i)){live.add(i);if(ensureIO())io.observe(el);}resize(i);}
  i.dirty=1;if(!i.rm)kick(); // con movimiento reducido, resize() ya pintó la imagen fija nueva
  return i;}
function unmount(el){if(!el)return false;let ok=false;
  const m=el._gm;if(m){maps.delete(m);if(m.cv.parentNode)m.cv.parentNode.removeChild(m.cv);el._gm=null;ok=true;}
  const i=el._ga;if(i){live.delete(i);if(i.cv.parentNode)i.cv.parentNode.removeChild(i.cv);el._ga=null;el._gaMounted=0;ok=true;}
  if(ok&&io)io.unobserve(el);
  return ok;}

const maps=new Set();
const MAP_VIEWS={front:[{yaw:90,lbl:'Frente'}],back:[{yaw:-90,lbl:'Espalda'}],both:[{yaw:90,lbl:'Frente'},{yaw:-90,lbl:'Espalda'}]};
const MAP_PERIOD=4.8,MAP_PAD={l:6,r:6,t:10,b:22};
const HEAT=[[0,[253,224,71]],[.5,[251,146,60]],[1,[239,68,68]]];
function heatRGB(t){t=clamp(t,0,1);let i=0;while(i<HEAT.length-2&&t>HEAT[i+1][0])i++;const[a,ca]=HEAT[i],[b,cb]=HEAT[i+1],u=(t-a)/(b-a);
  return Math.round(mix(ca[0],cb[0],u))+','+Math.round(mix(ca[1],cb[1],u))+','+Math.round(mix(ca[2],cb[2],u));}
const MAP_STYLE={skin:'#8f99a6',hair:'#4b535e',shirt:'#5d6775',shorts:'#4d5562',shoe:'#c3c9d0',sole:'#77818c'};
const MAP_LO=.3; // brillo mínimo visible de un músculo con algo de trabajo
const mapGlowCol=w=>w<.01?null:heatRGB((w-MAP_LO)/(1-MAP_LO));
function standPose(b,br){
  b.pelvis([0,DIM.hipH-.012+.002*br,0],{tilt:1});
  b.spine(-1.2*br,0,0);b.head(2-1.5*br,0,0);b.scap('both',.009*br,-.004*br);
  for(const s of['R','L']){const k=s==='R'?1:-1;
    b.footFlat(s,[-.052,0,k*.108],-k*7);b.leg(s,null,[1,0,k*.14]);
    b.armFK(s,{abd:14+1.5*br,flex:3,elbow:14,rot:-12});}
}
function _mapW(w){const o={};if(w&&typeof w==='object')for(const k in w){const v=+w[k];if(isFinite(v)&&v>0&&(MUS[k]||MUS[k.replace(/_(L|R)$/,'')]))o[k]=Math.min(1,v);}return o;}
function _mapDrawW(w){const o={};for(const k in MUS)o[k]=1e-4;for(const k in w){const v=w[k];if(v>0)o[k]=MAP_LO+(1-MAP_LO)*v;}return o;}
function muscleMap(el,o){
  if(!el||typeof document==='undefined')return null;o=o||{};
  if(el._gm&&el._gm.cv.parentNode!==el)unmount(el); // alguien vació el elemento: se vuelve a montar
  if(el._gm){const h=el._gm.h;if('onPick'in o)el._gm.onPick=o.onPick||null;if(o.label!=null)h.setLabel(o.label);if(o.view)h.setView(o.view);if(o.weights)h.setWeights(o.weights);return h;}
  if(el._ga)unmount(el);
  const cv=document.createElement('canvas');cv.className='ga-cv ga-map';el.appendChild(cv);
  const n0=NOW();
  const m={kind:'map',el,cv,ctx:cv.getContext('2d'),w:{},dw:_mapDrawW({}),view:MAP_VIEWS[o.view]?o.view:'both',breathe:o.breathe!==false,rm:RM(),
    onPick:o.onPick||null,bg:o.bg||null,pitch:o.pitch==null?5:o.pitch,W:0,H:0,dpr:1,views:[],dyaw:0,dpitch:0,drag:false,anim:null,
    dirty:1,vis:true,frames:0,t0:n0,lastAct:n0,lastTick:0,env:0,idleMs:o.idleMs==null?12000:o.idleMs,fps:Math.min(60,o.fps||15),lastDraw:0,
    hintUntil:o.hint===false?0:n0+4000,touched:false,hits:[]};
  const h={el,cv,
    setWeights(w){m.w=_mapW(w);m.dw=_mapDrawW(m.w);m.dirty=1;kick();return h;},
    setView(v){if(MAP_VIEWS[v]&&v!==m.view){m.view=v;m.W=0;resizeMap(m);m.dirty=1;kick();}return h;},
    setLabel(t){cv.setAttribute('aria-label',String(t||'Mapa muscular'));return h;},
    redraw(){m.dirty=1;kick();return h;},
    draw(){if(!m.cv.isConnected)return h;const w=m.el.clientWidth,hh=m.el.clientHeight;if(!m.views.length||(w&&w!==m.W)||(hh&&hh!==m.H))resizeMap(m);drawMap(m);m.dirty=0;m.lastDraw=NOW();return h;},
    wake(){m.lastAct=NOW();m.dirty=1;kick();return h;},
    unmount(){return unmount(el);},
    pick(x,y){return mapHit(m,x,y);},
    get weights(){return Object.assign({},m.w);},
    get frames(){return m.frames;},
    get breathing(){return m.env>0||(m.breathe&&!m.rm&&NOW()-m.lastAct<m.idleMs);},
    get view(){return m.view;}};
  m.h=h;el._gm=m;
  cv.setAttribute('role','img');h.setLabel(o.label);
  h.setWeights(o.weights);
  resizeMap(m);maps.add(m);bindMapInput(m);
  if(ensureIO())io.observe(el);
  kick();return h;}
function fitStand(w,H,yaw,pitch){const cm=makeCam({yaw,pitch});const bb=[1e9,1e9,-1e9,-1e9];
  for(const br of[0,1]){const sc=new Scene(),E=makeE(sc),b=new Body();standPose(b,br);b.draw(E,null,1);prepare(cm,sc);bounds(cm,sc,bb);}
  const P=MAP_PAD,aw=Math.max(10,w-P.l-P.r),ah=Math.max(10,H-P.t-P.b),bw=bb[2]-bb[0],bh=bb[3]-bb[1];
  const z=Math.min(aw/bw,ah/bh);cm.zoom=z;cm.ox=P.l+aw/2-(bb[0]+bw/2)*z;cm.oy=P.t+ah/2-(bb[1]+bh/2)*z;cm.wc=[0,.9,0];cm.traces=null;return cm;}
function resizeMap(m){const r=m.el.getBoundingClientRect();
  const W=Math.max(120,Math.round(r.width||m.el.clientWidth||300)),H=Math.max(100,Math.round(r.height||m.el.clientHeight||220));
  if(W===m.W&&H===m.H&&m.views.length)return;
  const dpr=Math.min(G.devicePixelRatio||1,2.5);m.cv.width=Math.round(W*dpr);m.cv.height=Math.round(H*dpr);m.cv.style.width=W+'px';m.cv.style.height=H+'px';
  m.W=W;m.H=H;m.dpr=dpr;const vs=MAP_VIEWS[m.view],n=vs.length;
  m.views=vs.map((v,i)=>{const x0=Math.round(W*i/n),w=Math.round(W*(i+1)/n)-x0,base=fitStand(w,H,v.yaw,m.pitch);base.ox+=x0;return{yaw:v.yaw,lbl:v.lbl,x0,w,base};});
  m.dirty=1;}
function mapCam(m,v){if(!m.dyaw&&!m.dpitch)return v.base;const b=v.base,cm=makeCam({yaw:v.yaw+m.dyaw,pitch:clamp(m.pitch+m.dpitch,-20,60)});cm.zoom=b.zoom;
  const P0=proj(b,b.wc);cm.ox=0;cm.oy=0;const P1=proj(cm,b.wc);cm.ox=P0[0]-P1[0];cm.oy=P0[1]-P1[1];cm.wc=b.wc;cm.traces=null;return cm;}
function drawMap(m){const{ctx,W,H,dpr}=m;ctx.setTransform(dpr,0,0,dpr,0,0);
  if(m.bg){ctx.fillStyle=m.bg;ctx.fillRect(0,0,W,H);}else drawBG(ctx,W,H);
  const br=m.env>0?m.env*(.5-.5*Math.cos(TAU*((NOW()-m.t0)/1000)/MAP_PERIOD)):0;
  const hits=[];
  let txt='';if(m.dyaw||m.dpitch)txt='↺ Doble toque: vista inicial';else if(!m.touched&&m.hintUntil&&NOW()<m.hintUntil)txt='↔ Arrastra para girar';
  if(m.drag)txt='';
  for(const v of m.views){const cm=mapCam(m,v);ctx.save();ctx.beginPath();ctx.rect(v.x0,0,v.w,H);ctx.clip();
    drawFloor(ctx,cm,{});
    const sc=new Scene(),E=makeE(sc),b=new Body();Object.assign(b.col,MAP_STYLE);b.glowCol=mapGlowCol;standPose(b,br);b.draw(E,m.dw,1);
    drawScene(ctx,cm,sc,W,H,{ol:1.05});
    for(const o of sc.overs)if(o.m&&o._e)hits.push({m:o.m,e:o._e,vis:o._vis||0,x0:v.x0,x1:v.x0+v.w});
    if(m.views.length>1&&!txt&&!m.dyaw&&!m.dpitch){ctx.font='600 9.5px "DM Sans",system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillStyle='rgba(160,168,180,.8)';ctx.fillText(v.lbl.toUpperCase(),v.x0+v.w/2,H-10);ctx.textAlign='left';}
    ctx.restore();}
  m.hits=hits;
  if(txt){ctx.save();ctx.font='600 9.5px "DM Sans",system-ui,sans-serif';const tw=ctx.measureText(txt).width+12,x=Math.round((W-tw)/2);
    ctx.fillStyle='rgba(0,0,0,.55)';ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,H-18,tw,16,8);else ctx.rect(x,H-18,tw,16);ctx.fill();
    ctx.fillStyle='rgba(235,238,242,.9)';ctx.textBaseline='middle';ctx.fillText(txt,x+6,H-9.5);ctx.restore();}
  m.frames++;}
function mapHit(m,x,y){let best=null,bd=1.3;
  for(const h of m.hits){if(x<h.x0||x>=h.x1||h.vis<.35)continue;const e=h.e;if(!(e.a>.5))continue;
    const dx=x-e.x,dy=y-e.y,c=Math.cos(-e.r),s=Math.sin(-e.r),u=(dx*c-dy*s)/Math.max(e.a,9),v=(dx*s+dy*c)/Math.max(e.b,7),d=u*u+v*v;
    if(d<bd){bd=d;best=h.m;}}
  return best;}
function resetMapView(m){if(!m.dyaw&&!m.dpitch)return;if(m.rm){m.dyaw=m.dpitch=0;m.dirty=1;kick();return;}m.anim={dy:m.dyaw,dp:m.dpitch,t0:NOW(),d:420};kick();}
function bindMapInput(m){const el=m.cv,cs=el.style;cs.touchAction='pan-y';cs.cursor='grab';cs.userSelect=cs.webkitUserSelect='none';cs.webkitTouchCallout='none';cs.webkitTapHighlightColor='transparent';
  let st=null,tapT=null,lastEnd=0;
  el.addEventListener('touchend',e=>{const n=NOW();if(n-lastEnd<350&&e.cancelable)e.preventDefault();lastEnd=n;},{passive:false});
  el.addEventListener('dblclick',e=>e.preventDefault());
  el.addEventListener('pointerdown',e=>{st={x:e.clientX,y:e.clientY,t:NOW(),dy:m.dyaw,dp:m.dpitch,id:e.pointerId,type:e.pointerType,drag:false,mv:0};m.lastAct=NOW();kick();});
  el.addEventListener('pointermove',e=>{if(!st||e.pointerId!==st.id)return;const dx=e.clientX-st.x,dy=e.clientY-st.y;st.mv=Math.max(st.mv,Math.hypot(dx,dy));
    if(!st.drag&&Math.abs(dx)>7&&Math.abs(dx)>Math.abs(dy)*1.2){st.drag=true;m.drag=true;m.touched=true;m.anim=null;el.style.cursor='grabbing';try{el.setPointerCapture(e.pointerId);}catch(_){}}
    if(st.drag){m.dyaw=st.dy+dx*.55;if(st.type==='mouse')m.dpitch=clamp(st.dp+dy*.35,-25,50);m.lastAct=NOW();m.dirty=1;kick();if(e.cancelable)e.preventDefault();}});
  const end=e=>{if(!st||e.pointerId!==st.id)return;const s=st;st=null;m.drag=false;el.style.cursor='grab';m.lastAct=NOW();
    try{if(el.hasPointerCapture&&el.hasPointerCapture(e.pointerId))el.releasePointerCapture(e.pointerId);}catch(_){}
    if(s.drag){m.dirty=1;kick();return;}if(e.type!=='pointerup')return;
    const r=el.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
    if(NOW()-s.t>=350||s.mv>=10||x<0||y<0||x>r.width||y>r.height)return;m.touched=true;m.dirty=1;kick();
    const fire=()=>{const k=mapHit(m,x,y);if(k&&m.onPick){try{m.onPick(k);}catch(err){if(G.console)console.error(err);}}};
    if(tapT){clearTimeout(tapT);tapT=null;resetMapView(m);return;}
    if(!m.dyaw&&!m.dpitch)fire();else tapT=setTimeout(()=>{tapT=null;fire();},280);};
  el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);el.addEventListener('lostpointercapture',e=>{if(st&&e.pointerId===st.id&&!st.drag)st=null;});}
function mapTick(n){let more=false;
  for(const m of maps){
    if(!m.el.isConnected||!m.cv.isConnected){maps.delete(m);if(io)io.unobserve(m.el);continue;}
    if(m.hintUntil&&n>=m.hintUntil){m.hintUntil=0;m.dirty=1;}
    const dt=m.lastTick?Math.min(250,n-m.lastTick):16;m.lastTick=n;
    const active=m.breathe&&!m.rm&&m.vis&&(n-m.lastAct<m.idleMs);
    const env0=m.env;m.env+=((active?1:0)-m.env)*Math.min(1,dt/700);if(!active&&m.env<.03)m.env=0;
    if(env0>0&&m.env===0)m.dirty=1; // último fotograma, ya en reposo
    if(!m.vis)continue;
    const A=m.anim;if(A){const e=EASE.mj((n-A.t0)/A.d);m.dyaw=A.dy*(1-e);m.dpitch=A.dp*(1-e);if(e>=1){m.anim=null;m.dyaw=m.dpitch=0;}m.dirty=1;}
    if(m.anim||m.drag||m.env>0||active||m.hintUntil)more=true;
    if(!m.dirty&&!(m.env>0&&n-m.lastDraw>=1000/m.fps-2))continue;
    const w=m.el.clientWidth,hh=m.el.clientHeight;if((w&&w!==m.W)||(hh&&hh!==m.H))resizeMap(m);
    drawMap(m);m.dirty=0;m.lastDraw=n;}
  return more;}
function mapStats(){let fr=0;for(const m of maps)fr+=m.frames;return{maps:maps.size,anims:live.size,running:!!raf,frames:fr};}

const TH_RVER=2,TH_DB='gymanim',TH_DBV=2,TH_ST='th2',TH_OLD='thumbs',TH_FMT=2,TH_META='#sweep',
  TH_WAIT=500,TH_OPEN_MAX=8000,TH_SLICE_MS=8,TH_SLICE_N=4,TH_TRIES=3,TH_RETRY=2000,TH_MEM=160,TH_PF=24,TH_PUTMAX=120,
  TH_DAY=864e5,TH_TOUCH=7*TH_DAY,TH_KEEP=60*TH_DAY,TH_SWEEP=7*TH_DAY,
  BODY_G=/^(torso|head|ua[LR]|fa[LR]|th[LR]|sh[LR])$/;
const thMem=new Map();       // ck → {v, data, src}; el orden es el de uso (la última, la más reciente)
let thDb=null,thIdbState='idle',thTries=0,thRetryT=0,thOpenEp=0,thOpenTo=0,thClearPend=false,thSweepT=0,thIdbF=null; // 'idle' | 'pending' | 'ok' | 'none'
let thIO=null,thT=0,thPutT=0,thRdSend=0,thPfN=0;const thQ=[],thPut=new Map(),thRd=new Map(); // thPut: ck → valor; thRd: ck → lectura en curso
const thStat={gen:0,ms:0,maxMs:0,idbHit:0,applied:0,slices:0,reads:0,miss:0,stale:0,late:0,prefetch:0,evict:0,writes:0,opens:0,fails:0,blocked:0,swept:0};
function fnv(s,h){h=h==null?0x811c9dc5:h>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return(h>>>0).toString(36);}
const fnv2=s=>fnv(s)+'.'+fnv(s,0x9e3779b1);
let _thEng=null;
function thEngFns(){return{thumbRender,peakC,makeCam,proj,pvec,ellipse2,prepare,bounds,drawScene,shapePath,fillItem,
  drawOver,drawCap,capPasses,ellCut,drawBG,drawFloor,capPath,cylGeom,cylPath,boxFaces,toneOf,shade,shadeHex,rgb,hexA,sstep,clamp};}
function thEngHash(){if(!_thEng){const F=thEngFns();
  _thEng=fnv2(TH_RVER+'|'+Object.keys(F).map(k=>k+':'+F[k]).join('|')+'|'+Object.keys(V).map(k=>k+':'+V[k]).join('|')+JSON.stringify([COL,L2]));}
  return _thEng;}
const thNum=(k,x)=>k&&k.charCodeAt(0)===95?undefined:typeof x==='number'?Math.round(x*1e5)/1e5:x;
function thFp(spec){const{sc}=buildFrame(spec,peakC(spec));return JSON.stringify([sc.items,sc.overs,spec.cam,spec.fitBox,spec.floor,spec.style],thNum);}
function thVer(spec){if(!spec._thv){let fp;try{fp=thFp(spec);}catch(e){const GA=G.GymAnim;let b='';try{b=String(spec.build);}catch(_){}fp='!'+b+'|'+(GA&&GA._&&GA._.buildHash||'');}
  spec._thv=fnv2(thEngHash()+'|'+spec.key+'|'+fp);}
  return spec._thv;}
function thOpt(w,h,o){o=o||{};const W=Math.max(16,Math.min(640,Math.round(+w||96))),H=Math.max(16,Math.min(640,Math.round(+h||W)));
  const dpr=Math.min(2,Math.max(1,+o.dpr||G.devicePixelRatio||1));
  return{w:W,h:H,fit:o.fit==='body'?'body':'scene',bg:o.bg?String(o.bg):null,dpr:Math.round(dpr*4)/4,q:+o.q>0&&+o.q<=1?+o.q:.86};}
function thCk(key,o){return key+'|'+o.w+'x'+o.h+'@'+o.dpr+'|'+o.fit+'|'+(o.bg||'-');}
function thumbRender(spec,o){
  if(typeof document==='undefined')return null;
  const W=o.w,H=o.h,dpr=o.dpr,cv=document.createElement('canvas');cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);
  const ctx=cv.getContext('2d');if(!ctx)return null;
  const{sc}=buildFrame(spec,peakC(spec)),cm=makeCam(spec.cam||{});
  prepare(cm,sc);let bb=[1e9,1e9,-1e9,-1e9];
  if(o.fit==='body'){const ext=(x,y,r)=>{if(x-r<bb[0])bb[0]=x-r;if(y-r<bb[1])bb[1]=y-r;if(x+r>bb[2])bb[2]=x+r;if(y+r>bb[3])bb[3]=y+r;};
    for(const it of sc.items){if(!it.grp||!BODY_G.test(it.grp))continue;
      if(it.k==='cap'){ext(it._A[0],it._A[1],it._ra);ext(it._B[0],it._B[1],it._rb);}else if(it.k==='ell')ext(it._e.x,it._e.y,it._e.a);}}
  else if(spec.fitBox){const[a,b]=spec.fitBox;for(let i=0;i<8;i++){const P=proj(cm,[i&1?b[0]:a[0],i&2?b[1]:a[1],i&4?b[2]:a[2]]);
      if(P[0]<bb[0])bb[0]=P[0];if(P[1]<bb[1])bb[1]=P[1];if(P[0]>bb[2])bb[2]=P[0];if(P[1]>bb[3])bb[3]=P[1];}}
  else bounds(cm,sc,bb);
  if(!(bb[2]>bb[0]&&bb[3]>bb[1])){bb=[1e9,1e9,-1e9,-1e9];bounds(cm,sc,bb);}
  const body=o.fit==='body',pd=body?{l:W*.07,r:W*.07,t:H*.06,b:H*.05}:{l:W*.05,r:W*.05,t:H*.07,b:H*.05};
  const bw=bb[2]-bb[0],bh=bb[3]-bb[1],aw=W-pd.l-pd.r,ah=H-pd.t-pd.b;
  const z=Math.min(aw/bw,ah/bh)*(body?1:(spec.cam&&spec.cam.zoom||1));
  cm.zoom=z;cm.ox=pd.l+aw/2-(bb[0]+bw/2)*z;cm.oy=pd.t+ah/2-(bb[1]+bh/2)*z;cm.traces=null;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  if(o.bg==='scene'){drawBG(ctx,W,H);drawFloor(ctx,cm,spec);}else if(o.bg){ctx.fillStyle=o.bg;ctx.fillRect(0,0,W,H);}
  drawScene(ctx,cm,sc,W,H,{ol:W<120||H<100?.8:1.05});
  let d='';try{d=cv.toDataURL('image/webp',o.q);}catch(e){d='';}
  if(!/^data:image\/(webp|png)/.test(d)){try{d=cv.toDataURL('image/png');}catch(e){d='';}}
  return d||null;}
function thSrc(data){try{if(!G.URL||!URL.createObjectURL||typeof Blob==='undefined'||typeof atob!=='function')return data;
  const i=data.indexOf(','),mime=data.slice(5,data.indexOf(';')),bin=atob(data.slice(i+1)),u=new Uint8Array(bin.length);
  for(let k=0;k<bin.length;k++)u[k]=bin.charCodeAt(k);return URL.createObjectURL(new Blob([u],{type:mime}));}catch(e){return data;}}
function thFree(e){if(e&&e.src&&e.src!==e.data&&/^blob:/.test(e.src)){try{URL.revokeObjectURL(e.src);}catch(_){}}}
function thMemGet(spec,ck){const m=thMem.get(ck);if(!m)return null;
  if(m.v!==thVer(spec)){thMem.delete(ck);thFree(m);return null;}
  thMem.delete(ck);thMem.set(ck,m);return m;}
function thMemSet(ck,v,data){const o=thMem.get(ck);
  if(o&&o.v===v){if(!o.data)o.data=data;thMem.delete(ck);thMem.set(ck,o);return o;}
  if(o){thMem.delete(ck);thFree(o);}
  const e={v,data,src:thSrc(data)};thMem.set(ck,e);if(thMem.size>TH_MEM)thTrim();return e;}
function thTrim(){let used=new Set();
  try{if(typeof document!=='undefined')document.querySelectorAll('img[data-ga-thumb]').forEach(im=>{const s=im.getAttribute('src');if(s)used.add(s);});}catch(e){used=null;}
  const goal=Math.floor(TH_MEM*.8);let n=thMem.size;
  for(const[ck,e]of thMem){if(n<=goal)break;
    if(!used||used.has(e.src)){if(e.src!==e.data&&e.data)e.data=null;continue;}
    thMem.delete(ck);thFree(e);thStat.evict++;n--;}}
function thumb(key,w,h,o){
  const spec=getDef(key);if(!spec||typeof document==='undefined')return null;
  o=thOpt(w,h,o);const ck=thCk(key,o);let e=thMemGet(spec,ck);if(e&&e.data)return e.data;
  const t0=NOW();let d=null;try{d=thumbRender(spec,o);}catch(err){d=null;}
  const ms=NOW()-t0;if(!d)return null;
  thStat.gen++;thStat.ms+=ms;if(ms>thStat.maxMs)thStat.maxMs=ms;
  e=thMemSet(ck,thVer(spec),d);thStore(ck,e.v,d);return d;}
function thumbCached(key,w,h,o){const spec=getDef(key);if(!spec)return null;o=thOpt(w,h,o);const ck=thCk(key,o),e=thMemGet(spec,ck);if(e)return e.src;
  if(thIdbState!=='none'&&!thRd.has(ck)&&thPfN<TH_PF&&typeof document!=='undefined'){if(!thPfN)setTimeout(()=>{thPfN=0;},0);thPfN++;thStat.prefetch++;thRead(ck,spec,null);}
  return null;}
function thFactory(){if(thIdbF)return thIdbF;try{return G.indexedDB||null;}catch(e){return null;}}
function thInit(){
  if(thIdbState!=='idle')return;
  const idb=thFactory();
  if(!idb||typeof idb.open!=='function'){thIdbState='none';thTries=TH_TRIES;thPut.clear();thRdAll();return;}
  thIdbState='pending';thStat.opens++;const ep=++thOpenEp;
  clearTimeout(thOpenTo);thOpenTo=setTimeout(()=>thOpenFail(ep),TH_OPEN_MAX);
  let rq;try{rq=idb.open(TH_DB,TH_DBV);}catch(e){thOpenFail(ep);return;}
  rq.onupgradeneeded=()=>{try{const db=rq.result,N=db.objectStoreNames;if(N.contains(TH_OLD))db.deleteObjectStore(TH_OLD);
    if(!N.contains(TH_ST))db.createObjectStore(TH_ST).createIndex('t','t');}catch(e){}};
  rq.onblocked=()=>{thStat.blocked++;}; // otra pestaña con la versión vieja abierta: mientras, se dibuja sin IndexedDB
  rq.onerror=ev=>{try{if(ev&&ev.preventDefault)ev.preventDefault();}catch(e){}thOpenFail(ep);};
  rq.onsuccess=()=>{let db=null;try{db=rq.result;}catch(e){db=null;}
    if(ep!==thOpenEp||thIdbState!=='pending'||!db){try{if(db)db.close();}catch(e){}return;}
    clearTimeout(thOpenTo);thDb=db;thIdbState='ok';thTries=0;
    db.onversionchange=()=>{try{db.close();}catch(e){}thLost(db);};
    db.onclose=()=>thLost(db);
    if(thClearPend){thClearPend=false;thTx('readwrite',os=>{os.clear();});}
    thRdKick();thPutSoon();thSweepSoon();};}
function thOpenFail(ep){if(ep!==thOpenEp||thIdbState!=='pending')return;thOpenEp++;clearTimeout(thOpenTo);
  thIdbState='none';thDb=null;thStat.fails++;thRdAll();thRetry();}
function thLost(db){if(db&&thDb!==db)return;thDb=null;if(thIdbState==='ok')thIdbState='none';thRdAll();thRetry();}
function thRetry(){if(thRetryT)return;if(thTries>=TH_TRIES){thPut.clear();return;}thTries++;
  thRetryT=setTimeout(()=>{thRetryT=0;if(thIdbState==='none'){thIdbState='idle';thInit();}},TH_RETRY*thTries);}
function thTx(mode,fn,done){const db=thDb;let tx=null;
  try{tx=db.transaction(TH_ST,mode);fn(tx.objectStore(TH_ST),tx);}
  catch(e){if(tx){try{tx.abort();}catch(_){}}if(done)done(false);if(!tx)thLost(db);return false;}
  tx.oncomplete=()=>{if(done)done(true);};
  tx.onabort=()=>{if(done)done(false);};
  return true;}
function thRead(ck,spec,el){let r=thRd.get(ck);
  if(!r){r={ck,spec,els:[],sent:false,done:false,dead:false,to:0};thRd.set(ck,r);thStat.reads++;
    r.to=setTimeout(()=>thRdEnd(r,null,'late'),TH_WAIT);}
  if(el&&r.els.indexOf(el)<0)r.els.push(el);
  thRdKick();}
function thRdKick(){if(!thRd.size)return;
  if(thIdbState==='idle')thInit();
  if(thIdbState==='none'){thRdAll();return;}
  if(thIdbState==='ok'&&!thRdSend){thRdSend=1;Promise.resolve().then(thRdGo);}} // las pedidas en la misma tarea, en una transacción
function thRdGo(){thRdSend=0;if(thIdbState!=='ok')return;
  const L=[];thRd.forEach(r=>{if(!r.sent){r.sent=true;L.push(r);}});if(!L.length)return;
  thTx('readonly',os=>{L.forEach(r=>{const q=os.get(r.ck);q.onsuccess=()=>thRdEnd(r,q.result,'got');
      q.onerror=ev=>{try{if(ev&&ev.preventDefault)ev.preventDefault();}catch(e){}thRdEnd(r,null,'err');};});},
    fine=>{if(!fine)L.forEach(r=>thRdEnd(r,null,'err'));});}
function thRdAll(){[...thRd.values()].forEach(r=>thRdEnd(r,null,'none'));}
function thRdEnd(r,val,why){
  if(r.dead)return;
  const first=!r.done;
  if(first){r.done=true;clearTimeout(r.to);if(thRd.get(r.ck)===r)thRd.delete(r.ck);}
  if(why==='late'){if(first){thStat.late++;thRdToQ(r);}return;}
  let e=null;
  if(why==='got'&&val){const v=thVer(r.spec);
    if(val.f===TH_FMT&&val.v===v&&typeof val.d==='string'&&val.d.startsWith('data:image/')){
      thStat.idbHit++;e=thMemSet(r.ck,v,val.d);
      if(!(val.t>Date.now()-TH_TOUCH&&val.t<=Date.now()+TH_DAY))thStore(r.ck,v,val.d); // marca de uso, como mucho cada 7 días
    }else thStat.stale++;}
  else if(why==='got')thStat.miss++;
  if(e)thFill(r,e);           // también si llegó tarde: las que aún esperan la toman
  else if(first)thRdToQ(r);}  // no está (o no vale): a dibujar
function thRdToQ(r){let n=0;for(const el of r.els)if(el.isConnected&&el.getAttribute('data-ga-st')==='w'&&thQ.indexOf(el)<0){thQ.push(el);n++;}if(n)thKick();}
function thFill(r,e){const key=r.spec.key,done=new Set();
  const put=el=>{if(done.has(el))return;done.add(el);if(!el.isConnected||el.getAttribute('data-ga-st')!=='w')return;
    if(thObs.has(el)){thObs.delete(el);if(thIO)thIO.unobserve(el);}thApply(el,e.src);};
  r.els.forEach(put);
  try{document.querySelectorAll('img[data-ga-st="w"][data-ga-thumb]').forEach(el=>{if(el.getAttribute('data-ga-thumb')===key&&thCk(key,thOptEl(el))===r.ck)put(el);});}catch(err){}}
function thStore(ck,v,d){if(thIdbState==='none'&&!thRetryT)return; // sin IndexedDB (ni reintento pendiente): solo memoria
  thPut.delete(ck);thPut.set(ck,{f:TH_FMT,v,d,t:Date.now()});
  if(thIdbState==='idle')thInit();
  if(thIdbState==='ok'&&thPut.size>=32){thFlush();return;}
  while(thPut.size>TH_PUTMAX)thPut.delete(thPut.keys().next().value);
  thPutSoon();}
function thPutSoon(){if(!thPutT&&thPut.size)thPutT=setTimeout(thFlush,300);}
function thFlush(){clearTimeout(thPutT);thPutT=0;if(!thPut.size)return;
  if(thIdbState!=='ok'){if(thIdbState==='none'&&!thRetryT)thPut.clear();return;} // al abrir se escriben (thPutSoon)
  const L=[...thPut];thPut.clear();
  thTx('readwrite',os=>{L.forEach(([k,v])=>os.put(v,k));},fine=>{if(fine)thStat.writes+=L.length;});}
function thSweepSoon(){if(!thSweepT)thSweepT=setTimeout(()=>{thIdle(thSweep);},6000);}
function thSweep(){if(thIdbState!=='ok')return;const now=Date.now();
  thTx('readonly',os=>{const q=os.get(TH_META);q.onsuccess=()=>{const m=q.result;if(m&&m.t>now-TH_SWEEP&&m.t<=now)return;thSweepRun(now);};});}
function thSweepRun(now){let n=0;
  thTx('readwrite',os=>{
    if(os.openKeyCursor){const c1=os.openKeyCursor();c1.onsuccess=()=>{const c=c1.result;if(!c)return;const k=String(c.key);
      if(k!==TH_META&&!getDef(k.split('|')[0])){os.delete(c.primaryKey);n++;}c.continue();};}
    const KR=G.IDBKeyRange;
    if(KR&&os.indexNames&&os.indexNames.contains('t')){const c2=os.index('t').openKeyCursor(KR.upperBound(now-TH_KEEP));
      c2.onsuccess=()=>{const c=c2.result;if(!c)return;if(String(c.primaryKey)!==TH_META){os.delete(c.primaryKey);n++;}c.continue();};}
    os.put({t:now},TH_META);},fine=>{if(fine)thStat.swept+=n;});}
function thOptEl(el){return thOpt(+el.getAttribute('data-gw'),+el.getAttribute('data-gh'),{fit:el.getAttribute('data-gfit')||'scene',bg:el.getAttribute('data-gbg')||null});}
function thApply(el,src){if(el.getAttribute('src')!==src){try{el.decoding='async';}catch(e){}el.src=src;}el.setAttribute('data-ga-st','ok');thStat.applied++;
  if(el.complete&&el.naturalWidth)el.classList.add('ga-on');else el.addEventListener('load',()=>el.classList.add('ga-on'),{once:true});}
const thObs=new Set();
function thNear(el){if(!el.isConnected)return false;const r=el.getBoundingClientRect();if(!(r.width>0&&r.height>0))return false;
  const H=G.innerHeight||800,Wd=G.innerWidth||400;return r.bottom>-200&&r.top<H+200&&r.right>-50&&r.left<Wd+50;}
function thWant(el){if(thIO)thIO.unobserve(el);thObs.delete(el);
  if(!el.isConnected||el.getAttribute('data-ga-st')!=='w')return;
  const key=el.getAttribute('data-ga-thumb'),spec=getDef(key);if(!spec){el.setAttribute('data-ga-st','x');return;}
  const ck=thCk(key,thOptEl(el)),e=thMemGet(spec,ck);if(e){thApply(el,e.src);return;}
  thRead(ck,spec,el);}
let thScT=0;
function thRecheck(){thScT=0;thObs.forEach(el=>{if(!el.isConnected){if(thIO)thIO.unobserve(el);thObs.delete(el);}else if(thNear(el))thWant(el);});}
function ensureThIO(){if(!thIO&&G.IntersectionObserver){thIO=new IntersectionObserver(es=>{
    for(const e of es)if(e.isIntersecting&&thObs.has(e.target))thWant(e.target);},{rootMargin:'200px 0px'});
    try{document.addEventListener('scroll',()=>{if(thObs.size&&!thScT)thScT=setTimeout(thRecheck,150);},{capture:true,passive:true});}catch(e){}}
  return thIO;}
function thumbLazy(root){
  if(typeof document==='undefined')return 0;let n=0;
  if(thObs.size)thRecheck();
  (root||document).querySelectorAll('img[data-ga-thumb]').forEach(el=>{
    const st=el.getAttribute('data-ga-st');if(st==='ok'||st==='x'||st==='w')return;
    const key=el.getAttribute('data-ga-thumb'),spec=getDef(key);if(!spec){el.setAttribute('data-ga-st','x');return;}
    const e=thMemGet(spec,thCk(key,thOptEl(el)));if(e){thApply(el,e.src);return;}
    el.setAttribute('data-ga-st','w');n++;
    if(thNear(el)||!ensureThIO())thWant(el);else{thIO.observe(el);thObs.add(el);}});
  return n;}
const thIdle=f=>{if(G.requestIdleCallback)G.requestIdleCallback(f,{timeout:600});else setTimeout(()=>{const t0=NOW();f({timeRemaining:()=>Math.max(0,12-(NOW()-t0)),didTimeout:true});},40);};
function thKick(){if(thT||!thQ.length)return;thT=1;thIdle(thWork);}
function thMore(dl,drew,t0){
  const rem=dl&&dl.timeRemaining?+dl.timeRemaining()||0:0;
  if(rem>10)return true;
  return !!(dl&&(dl.didTimeout||rem<=0))&&drew<TH_SLICE_N&&NOW()-t0<TH_SLICE_MS;}
function thWork(dl){thT=0;thStat.slices++;let drew=0;const t0=NOW();
  while(thQ.length){
    const el=thQ[0];
    if(!el||!el.isConnected||el.getAttribute('data-ga-st')!=='w'){thQ.shift();if(el&&!el.isConnected&&el.getAttribute('data-ga-st')==='w')el.removeAttribute('data-ga-st');continue;}
    const key=el.getAttribute('data-ga-thumb'),spec=getDef(key),o=thOptEl(el),ck=spec?thCk(key,o):'';
    let e=spec?thMemGet(spec,ck):null;
    if(!e&&spec){if(drew&&!thMore(dl,drew,t0))break;
      drew++;thumb(key,o.w,o.h,o);e=thMemGet(spec,ck);}
    thQ.shift();
    if(e)thApply(el,e.src);else el.setAttribute('data-ga-st','x');}
  if(thQ.length)thKick();}
function thumbReady(){thInit();return new Promise(res=>{let n=0;const ck=()=>{if(thIdbState==='ok'||thIdbState==='none')return res(thIdbState);
  if(++n*20>=TH_WAIT)return res('pending');setTimeout(ck,20);};ck();});}
function thumbStats(){return Object.assign({mem:thMem.size,memData:[...thMem.values()].filter(e=>e.data).length,reading:thRd.size,writing:thPut.size,queue:thQ.length,idb:thIdbState,tries:thTries},thStat);}
function thumbReset(o){o=o||{};thMem.forEach(thFree);thMem.clear();thPfN=0;
  const wait=[];thRd.forEach(r=>{r.dead=true;clearTimeout(r.to);r.els.forEach(el=>wait.push(el));});thRd.clear();
  if(o.idb){thPut.clear();if(thDb&&thIdbState==='ok')thTx('readwrite',os=>{os.clear();});else if(thIdbState!=='none')thClearPend=true;}
  if(o.reopen){if('factory' in o)thIdbF=o.factory||null;
    thOpenEp++;clearTimeout(thOpenTo);clearTimeout(thRetryT);thRetryT=0;clearTimeout(thSweepT);thSweepT=0;
    const db=thDb;thDb=null;if(db){try{db.close();}catch(e){}}thIdbState='idle';thTries=0;}
  Object.keys(thStat).forEach(k=>{thStat[k]=0;});
  wait.forEach(el=>{if(el.isConnected&&el.getAttribute('data-ga-st')==='w'&&thQ.indexOf(el)<0)thQ.push(el);});thKick();
  return true;}

G.GymAnim={def,alias,has:k=>!!getDef(k),get:getDef,keys:()=>Object.keys(DEFS).concat(Object.keys(ALIAS)),mount,mountAll,unmount,refresh,swap,muscleMap,
  thumb,thumbCached,thumbLazy,thumbReady,
  muscles:()=>Object.keys(MUS),
  _:{V,Body,Scene,makeE,makeCam,fitCam,evalTL,compileTL,renderTo,buildFrame,DIM,COL,MUS,EASE,solve,ik2,PAD,fpt,fdir,frot,basis,walkOnTreadmill,heatRGB,standPose,mapStats,mapTick,
    peakC,thumbRender,thumbStats,thumbReset,thVer,thFp,thEngHash,thEngNames:()=>Object.keys(thEngFns()),thCk,thOpt,thMore,thConf:{wait:TH_WAIT,sliceMs:TH_SLICE_MS,sliceN:TH_SLICE_N,mem:TH_MEM,pf:TH_PF,db:TH_DB,dbv:TH_DBV,store:TH_ST,fmt:TH_FMT,rver:TH_RVER},buildHash:''}};
})(typeof window!=='undefined'?window:globalThis);
