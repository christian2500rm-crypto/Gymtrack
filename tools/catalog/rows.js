// catalog.json → filas compactas LIB_ROWS de la app, en src/js/app/catalogo-filas.js (con sus marcas LIB-ROWS:BEGIN/END).
// Uso: node tools/catalog/rows.js [catalog.json] [--check]
//   sin --check escribe src/js/app/catalogo-filas.js (luego: node tools/build.js); con --check no escribe y comprueba que
//   ese fichero es exactamente lo que sale del catálogo. Por defecto, el catalog.json de esta carpeta.
// Formato de cada fila (19 columnas, separadas por «|»):
// id|n|ic|eq|muscle|s|r|lt|mat|pl|dif|x|pat|mus|alt|why|up|al|tip
//   eq vacío = etiqueta del material · x: C multiarticular, U unilateral, L admite lastre · mus «quads:1,glutes:.8»
//   alt/up sin el prefijo «lib_» · alt/al separados por «,» · why: razones de las 2 primeras alt · why por «~» (alineado con alt) · r: número de reps, «30s», «20m» o «10 min»
const fs=require('fs'),path=require('path');
const MATL={barra:'Barra',barraz:'Barra Z',mancuernas:'Mancuernas',kettlebell:'Kettlebell',disco:'Disco',maquina:'Máquina',polea:'Polea',smith:'Smith',
  corporal:'Peso corporal',dominadas:'Barra de dominadas',banda:'Banda elástica',minibanda:'Minibanda',trx:'TRX o anillas',fitball:'Fitball',
  rueda:'Rueda abdominal',comba:'Comba',step:'Step o cajón',balon:'Balón medicinal',cardio:'Máquina de cardio',otro:'Otro material'};
const WHY_N=2; // razones solo de las 2 primeras alternativas (las que enseña el Coach)
const LASTRE_T=new Set(['lib_plank','lib_wall_sit','lib_dead_hang']);
const ARGS=process.argv.slice(2).filter(a=>!a.startsWith('--')),CHECK=process.argv.includes('--check');
const C=JSON.parse(fs.readFileSync(ARGS[0]||path.join(__dirname,'catalog.json'),'utf8'));
const num=v=>{const s=String(+(+v).toFixed(2));return s.replace(/^0\./,'.');};
const bad=s=>/[|`\n]|\$\{/.test(String(s));
const rows=C.map(e=>{
  const legacy=!!e.ex;
  let r=String(e.r);if(e.lt==='t')r=r.replace(/\s+/g,'');if(e.lt==='d')r=r.replace(/\s*m$/,'m');
  const x=(e.c?'C':'')+(e.u?'U':'')+((e.lt==='bw'||(e.lt==='t'&&LASTRE_T.has(e.id)))?'L':'');
  const eq=(!legacy&&e.eq===MATL[e.mat])?'':e.eq;
  const mus=Object.entries(e.mus).sort((a,b)=>b[1]-a[1]).map(([k,v])=>k+':'+num(v)).join(',');
  const cols=[e.id,e.n,e.ic||'',eq,e.grp,e.s,r,e.lt,e.mat,e.pl,e.dif,x,e.pat,mus,(e.alt||[]).map(a=>a.replace(/^lib_/,'')).join(','),(e.why||[]).slice(0,WHY_N).join('~'),(e.up||'').replace(/^lib_/,''),(e.al||[]).join(','),e.tip];
  cols.forEach((c,i)=>{if(bad(c))throw new Error('carácter no válido en '+e.id+' col '+i+': '+c);});
  if((e.al||[]).some(a=>a.includes(',')))throw new Error('coma en alias '+e.id);
  if((e.why||[]).some(a=>a.includes('~')))throw new Error('~ en why '+e.id);
  return cols.join('|');
});
const block='const LIB_ROWS=String.raw`\n'+rows.join('\n')+'\n`;';
console.log('filas',rows.length,'bytes',Buffer.byteLength(block),'media',Math.round(Buffer.byteLength(block)/rows.length));
const DEST=path.join(__dirname,'..','..','src','js','app','catalogo-filas.js');
const file='// LIB-ROWS:BEGIN\n'+block+'\n// LIB-ROWS:END\n';
if(CHECK){const ok=fs.existsSync(DEST)&&fs.readFileSync(DEST).equals(Buffer.from(file,'utf8'));
  console.log(ok?'rows --check: src/js/app/catalogo-filas.js coincide byte a byte con el catálogo':'rows --check: src/js/app/catalogo-filas.js NO coincide con el catálogo');process.exit(ok?0:1);}
fs.writeFileSync(DEST,file);console.log('escrito: src/js/app/catalogo-filas.js · ahora: node tools/build.js');
