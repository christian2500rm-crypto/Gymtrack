// Generador de rutinas de la app (bloque GymGen) construido desde el prototipo (./sim): una sola fuente de verdad, así la
// app da exactamente las mismas rutinas que el prototipo para la misma entrada.
// Escribe src/js/gen/: cabecera.js abre una función que cierra exporta.js (window.GymGen = {catalogo, menus, generador,
// textos, seguridad, UNI, VERSION, REVISADO}); en medio, un fichero por módulo del prototipo:
//   - catalogo.js: catalogo(C, opts), catalogo.js sin node (el catálogo lo pasa la app: EXERCISE_DB con c = compound y
//     u = unilateral). Etiquetas de seguridad, presets y placeCan. PENDIENTE DE REVISIÓN HUMANA (decisión D2).
//   - menus.js, generador.js, textos.js, seguridad.js: los módulos del prototipo tal cual.
//   - UNI (en exporta.js): los ejercicios unilaterales (campo u de catalog.json, que LIB_ROWS no lleva).
// Uso: node tools/gen/build.js [--catalog=<catalog.json>] [--check]
//   sin --check escribe src/js/gen/ (luego: node tools/build.js); con --check no escribe y comprueba que src/js/gen/ es
//   exactamente lo que sale del prototipo. Comprueba antes que las listas del catálogo no nombran ejercicios que no existen.
'use strict';
const fs = require('fs'), path = require('path');
const SIM = path.join(__dirname, 'sim');
const DEST = path.join(__dirname, '..', '..', 'src', 'js', 'gen');
const arg = k => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : null; };
const CHECK = process.argv.includes('--check');
const CAT = arg('catalog') || path.join(__dirname, '..', 'catalog', 'catalog.json');

// Cada módulo de node pasa a una IIFE que devuelve su fábrica; los require('./x.js') a las fábricas ya construidas
function modulo(file, nombre) {
  let s = fs.readFileSync(path.join(SIM, file), 'utf8').replace(/\r\n/g, '\n');
  s = s.replace(/^'use strict';\n/m, '');
  s = s.replace(/^const fs = require\('fs'\);\n/m, '').replace(/^const path = require\('path'\);\n/m, '');
  s = s.replace(/^const CAT_DEF = .*\n/m, '');
  s = s.replace(/^module\.exports = function \(/m, 'return function (');
  s = s.replace(/require\('\.\/menus\.js'\)/g, '_menus');
  if (file === 'catalogo.js') {
    s = s.replace('return function (catPath, opts) {', 'return function (C0, opts) {');
    s = s.replace("const C = JSON.parse(fs.readFileSync(catPath || CAT_DEF, 'utf8'));", 'const C = C0;');
  }
  const left = s.split('\n').filter(l => !/^\s*\/\//.test(l) && /require\(|module\.exports|\bfs\.|readFileSync/.test(l));
  if (left.length) throw new Error(file + ': queda algo de node: ' + left.join(' | ').slice(0, 200));
  return 'const ' + nombre + ' = (function () {\n' + s + '\n})();\n';
}
// Comprobación del catálogo con el prototipo de node: ninguna lista nombra un ejercicio que no existe
const K = require(path.join(SIM, 'catalogo.js'))(CAT);
if (K.faltan.length || K.maqSinFam.length || K.cardSinTipo.length) {
  console.error('Listas del catálogo con ids que no existen:', K.faltan, K.maqSinFam, K.cardSinTipo); process.exit(1);
}
const cat = JSON.parse(fs.readFileSync(CAT, 'utf8'));
const UNI = cat.filter(e => e.u).map(e => e.id);
const genVer = (fs.readFileSync(path.join(SIM, 'generador.js'), 'utf8').match(/const GEN_VERSION = (\d+)/) || [])[1] || '0';
const ficheros = new Map([
  ['cabecera.js', '// Generado por tools/gen/build.js desde el prototipo (tools/gen/sim): no editar a mano.\n' +
    '// Etiquetas de seguridad del catálogo: PENDIENTES DE REVISIÓN HUMANA (decisión D2).\n' +
    '(function () {\n\'use strict\';\n'],
  ['catalogo.js', modulo('catalogo.js', '_catalogo')],
  ['menus.js', modulo('menus.js', '_menus')],
  ['generador.js', modulo('generador.js', '_generador')],
  ['textos.js', modulo('textos.js', '_textos')],
  ['seguridad.js', modulo('seguridad.js', '_seguridad')],
  ['exporta.js', 'window.GymGen = {catalogo: _catalogo, menus: _menus, generador: _generador, textos: _textos, seguridad: _seguridad' +
    ', UNI: ' + JSON.stringify(UNI) + ', VERSION: ' + (+genVer) + ', REVISADO: false};\n})();\n'],
]);
const body = [...ficheros.values()].join('');
// Sintaxis del bloque entero y que no cierre el <script>
new (require('vm').Script)(body, { filename: 'GymGen' });
if (/<\/script/i.test(body)) { console.error('el bloque contiene «</script»'); process.exit(1); }
console.log('GymGen (generador v' + genVer + '): ' + Math.round(body.length / 1024) + ' KB, unilaterales ' + UNI.length);
if (CHECK) {
  const dif = [...ficheros].filter(([f, c]) => { const p = path.join(DEST, f); return !fs.existsSync(p) || !fs.readFileSync(p).equals(Buffer.from(c, 'utf8')); }).map(([f]) => f);
  if (!dif.length) { console.log('gen --check: src/js/gen/ coincide byte a byte con el prototipo (' + ficheros.size + ' ficheros)'); process.exit(0); }
  console.error('gen --check: distintos o ausentes en src/js/gen/: ' + dif.join(', ')); process.exit(1);
}
fs.mkdirSync(DEST, { recursive: true });
for (const [f, c] of ficheros) fs.writeFileSync(path.join(DEST, f), c);
console.log('escrito: src/js/gen/ (' + ficheros.size + ' ficheros) · ahora: node tools/build.js');
