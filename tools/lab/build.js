// Genera el motor 3D de la app (bloque GymAnim) en src/js/anim/ desde engine.js + ex/*.js de este laboratorio.
// Uso:  node tools/lab/build.js            escribe src/js/anim/ (luego: node tools/build.js para montar index.html)
//       node tools/lab/build.js --check    no escribe: comprueba que src/js/anim/ es exactamente lo que sale de aquí
//
// Un fichero de src/js/anim/ por fichero del laboratorio, con la marca «/* ruta */», sin las líneas de comentario «//»
// y sin líneas en blanco repetidas; y firma.js con la huella del bloque (versiona las miniaturas guardadas en IndexedDB,
// GymAnim.thumb). El orden: _kit.js (ayudas, sin ejercicios) primero, la lista fija y después, por orden alfabético, los
// demás ex/*.js (familias nuevas sin tocar este fichero). La sección [anim] de src/manifiesto.txt tiene que llevar ese
// mismo orden: si no, lo dice y sale con error.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const LAB=__dirname,RAIZ=path.join(LAB,'..','..'),DEST=path.join(RAIZ,'src','js','anim');
const CHECK=process.argv.includes('--check');
const FIX=['_kit.js','ref.js','ref2.js','legs_mach.js','legs_free.js','chest.js','back.js','shoulders.js','biceps.js','triceps.js','core.js','cardio.js'];
const ORDER=FIX.concat(fs.readdirSync(path.join(LAB,'ex')).filter(f=>f.endsWith('.js')&&!FIX.includes(f)).sort());
const files=['engine.js',...ORDER.map(f=>'ex/'+f).filter(f=>fs.existsSync(path.join(LAB,f)))];
const strip=src=>src.split('\n').filter(l=>!/^\s*\/\/(?!#)/.test(l)).join('\n').replace(/\n{3,}/g,'\n\n').trim();
const partes=files.map(f=>'/* '+f+' */\n'+strip(fs.readFileSync(path.join(LAB,f),'utf8').replace(/\r\n/g,'\n')));
const js=partes.join('\n');
// (11) huella del bloque (motor + ejercicios), antes de escapar «</script»
const BH=crypto.createHash('md5').update(js).digest('hex').slice(0,12);
const firma='/* build */\ntry{GymAnim._.buildHash='+JSON.stringify(BH)+';}catch(e){}';
// comprobación: ejecutar en un sandbox y contar definiciones
const sb={window:{},performance:{now:()=>0},document:{hidden:false,querySelectorAll:()=>[]},matchMedia:null,requestAnimationFrame:()=>0};
sb.window=sb;sb.globalThis=sb;vm.createContext(sb);
try{vm.runInContext(js+'\n'+firma,sb,{filename:'gymanim.js'});}catch(e){console.error('ERROR JS:',e.message);process.exit(1);}
const keys=sb.GymAnim.keys();
console.log('archivos:',files.length,'· ejercicios:',keys.length,'· huella:',BH);
// Ficheros de src/js/anim/: ruta → contenido (cada uno termina en salto de línea; montados seguidos dan el bloque)
const esc=s=>s.replace(/<\/script/gi,'<\\/script');
const salida=new Map(files.map((f,i)=>[f,esc(partes[i])+'\n']));
salida.set('firma.js',firma+'\n');
// El orden del manifiesto tiene que ser este
const man=fs.readFileSync(path.join(RAIZ,'src','manifiesto.txt'),'utf8').split(/\r?\n/);
const ini=man.findIndex(l=>l.trim()==='[anim]');
const enMan=[];for(let i=ini+1;i<man.length&&!/^\s*\[/.test(man[i]);i++){const s=man[i].replace(/(^|\s)#.*$/,'').trim();if(s)enMan.push(s);}
const esperado=[...salida.keys()].map(f=>'js/anim/'+f);
const ordenOk=ini>=0&&enMan.join('\n')===esperado.join('\n');
// Ficheros de más en src/js/anim/
const sobran=[];(function rec(d,rel){for(const n of fs.readdirSync(d)){const p=path.join(d,n),r=rel?rel+'/'+n:n;if(fs.statSync(p).isDirectory())rec(p,r);else if(!salida.has(r))sobran.push(r);}})(DEST,'');
if(CHECK){
  const dif=[];for(const[f,c]of salida){const p=path.join(DEST,f);if(!fs.existsSync(p)||!fs.readFileSync(p).equals(Buffer.from(c,'utf8')))dif.push(f);}
  if(!dif.length&&ordenOk&&!sobran.length){console.log('lab --check: src/js/anim/ coincide byte a byte con el laboratorio ('+salida.size+' ficheros)');process.exit(0);}
  if(dif.length)console.error('lab --check: distintos o ausentes en src/js/anim/: '+dif.join(', '));
  if(sobran.length)console.error('lab --check: sobran en src/js/anim/: '+sobran.join(', '));
  if(!ordenOk)console.error('lab --check: la sección [anim] de src/manifiesto.txt no lleva el orden del laboratorio');
  process.exit(1);
}
for(const[f,c]of salida){const p=path.join(DEST,f);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,c);}
console.log('escrito: src/js/anim/ ('+salida.size+' ficheros, '+Math.round(js.length/1024)+' KB)');
if(sobran.length)console.log('AVISO: sobran en src/js/anim/ (bórralos y quítalos del manifiesto): '+sobran.join(', '));
if(!ordenOk){console.error('La sección [anim] de src/manifiesto.txt tiene que ser exactamente:\n'+esperado.join('\n'));process.exit(1);}
console.log('Ahora: node tools/build.js');
