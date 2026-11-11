// Coherencia animaciones ↔ catálogo: cada ejercicio con animación, título = nombre, músculos = mus del catálogo.
// Uso: node animcheck.js <catalog.json>
const fs=require('fs'),path=require('path'),vm=require('vm');
const LAB=path.join(__dirname,'..','lab');
const C=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const FIX=['_kit.js','ref.js','ref2.js','legs_mach.js','legs_free.js','chest.js','back.js','shoulders.js','biceps.js','triceps.js','core.js','cardio.js'];
const files=['engine.js',...FIX.concat(fs.readdirSync(path.join(LAB,'ex')).filter(f=>f.endsWith('.js')&&!FIX.includes(f)).sort()).map(f=>'ex/'+f)];
const sb={window:{},performance:{now:()=>0},document:{hidden:false,querySelectorAll:()=>[]},matchMedia:null,requestAnimationFrame:()=>0};
sb.window=sb;sb.globalThis=sb;vm.createContext(sb);
for(const f of files)vm.runInContext(fs.readFileSync(path.join(LAB,f),'utf8'),sb,{filename:f});
const G=sb.GymAnim,keys=new Set(G.keys()),bad=[],noAnim=[];
for(const e of C){
  if(!keys.has(e.id)){noAnim.push(e.id);continue;}
  const sp=G.get(e.id);
  if(sp.title!==e.n)bad.push(`${e.id}: título «${sp.title}» ≠ «${e.n}»`);
  const m={};for(const k in sp.muscles){const b=k.replace(/_(L|R)$/,'');m[b]=Math.max(m[b]||0,+sp.muscles[k]);}
  const ks=new Set([...Object.keys(m),...Object.keys(e.mus)]);
  for(const k of ks)if(Math.abs((m[k]||0)-(e.mus[k]||0))>.011)bad.push(`${e.id}: músculo ${k} anim ${m[k]||0} ≠ cat ${e.mus[k]||0}`);
  // tiempos: un fotograma en t=0 y en la mitad sin excepción
  try{const tl=sp._tl;for(const t of[0,tl.total/2]){const c=sb.GymAnim._.evalTL(tl,sp,t);if(sb.GymAnim._.buildFrame)sb.GymAnim._.buildFrame(sp,c);}}catch(err){bad.push(`${e.id}: error al dibujar ${err.message}`);}
}
const extra=[...keys].filter(k=>!C.some(e=>e.id===k));
console.log('catálogo',C.length,'animaciones',keys.size,'sin animación',noAnim.length,'claves fuera del catálogo',extra.length);
if(noAnim.length)console.log('SIN ANIMACIÓN:',noAnim.join(', '));
if(extra.length)console.log('EXTRA:',extra.join(', '));
console.log(bad.length?'PROBLEMAS ('+bad.length+'):\n'+bad.join('\n'):'sin problemas de título ni músculos');
