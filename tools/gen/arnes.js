// Arnés del generador: ejecuta las pruebas del prototipo (personas.js y matriz.js) contra el bloque GymGen de index.html, no
// contra los ficheros de ./sim. Así se comprueba que la app da exactamente las mismas rutinas que el prototipo.
// Uso: node tools/gen/arnes.js index.html personas|matriz [args de matriz.js…]
//   Crea una carpeta temporal con módulos «puente» (catalogo.js, menus.js, generador.js, textos.js, seguridad.js) que exportan las
//   fábricas del bloque, copia personas.js y matriz.js del prototipo y los ejecuta allí; las salidas (ejemplos*.json,
//   personas-comparacion*.json, metricas…) quedan en esa carpeta para compararlas con las del prototipo (comparar.js).
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), vm = require('vm'), cp = require('child_process');
const [idx, que, ...rest] = process.argv.slice(2);
if (!idx || !que) { console.error('Uso: node arnes.js <index.html> personas|matriz [args]'); process.exit(1); }
const SIM = path.join(__dirname, 'sim');
const html = fs.readFileSync(idx, 'utf8');
const m = html.match(/<!-- GYM-GEN:START -->\s*<script>([\s\S]*?)<\/script>\s*<!-- GYM-GEN:END -->/);
if (!m) { console.error('index.html sin bloque GYM-GEN'); process.exit(1); }
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gymgen-'));
fs.writeFileSync(path.join(dir, 'bloque.js'), m[1]);
// El bloque se evalúa una vez con un window falso; los puentes reutilizan sus fábricas
fs.writeFileSync(path.join(dir, '_gen.js'), `
const vm=require('vm'),fs=require('fs'),path=require('path');
// en el mismo contexto que node (mismos Array, Set…: un instanceof entre contextos fallaría), con un window global
global.window=global.window||{};vm.runInThisContext(fs.readFileSync(path.join(__dirname,'bloque.js'),'utf8'),{filename:'GymGen'});
module.exports=global.window.GymGen;`);
const CAT = path.join(__dirname, '..', 'catalog', 'catalog.json');
fs.writeFileSync(path.join(dir, 'catalogo.js'), `const G=require('./_gen.js'),fs=require('fs');
module.exports=function(p,o){return G.catalogo(JSON.parse(fs.readFileSync(p||${JSON.stringify(CAT)},'utf8')),o);};`);
fs.writeFileSync(path.join(dir, 'menus.js'), "module.exports=require('./_gen.js').menus;");
fs.writeFileSync(path.join(dir, 'generador.js'), "module.exports=require('./_gen.js').generador;");
fs.writeFileSync(path.join(dir, 'textos.js'), "module.exports=require('./_gen.js').textos;");
fs.writeFileSync(path.join(dir, 'seguridad.js'), "module.exports=require('./_gen.js').seguridad;");
for (const f of ['personas.js', 'matriz.js']) fs.copyFileSync(path.join(SIM, f), path.join(dir, f));
const file = que === 'personas' ? 'personas.js' : 'matriz.js';
const r = cp.spawnSync(process.execPath, [file, ...(que === 'matriz' ? rest.concat(rest.some(a => a.startsWith('--out=')) ? [] : ['--out=' + dir]) : rest)], { cwd: dir, encoding: 'utf8', maxBuffer: 1 << 28 });
process.stdout.write(r.stdout || ''); process.stderr.write(r.stderr || '');
console.log('\n[arnés] carpeta: ' + dir);
process.exit(r.status || 0);
