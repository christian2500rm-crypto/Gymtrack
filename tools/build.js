#!/usr/bin/env node
// Monta index.html desde src/: la plantilla src/index.plantilla.html con cada «<!-- @incluye NOMBRE -->» sustituido por
// los ficheros de la sección [NOMBRE] de src/manifiesto.txt, concatenados tal cual y en ese orden.
// Trabaja con bytes: no toca finales de línea ni codificación (todo es UTF-8 con LF; ver .gitattributes).
//
// Uso:
//   node tools/build.js             escribe index.html
//   node tools/build.js --check     no escribe: compara con el index.html del disco y sale con error si difieren
//   node tools/build.js --out=RUTA  escribe en otra ruta (pruebas)
// Sin dependencias.
'use strict';
const fs = require('fs'), path = require('path');

const RAIZ = path.join(__dirname, '..');
const SRC = path.join(RAIZ, 'src');
const PLANTILLA = path.join(SRC, 'index.plantilla.html');
const MANIFIESTO = path.join(SRC, 'manifiesto.txt');
const arg = k => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : null; };
const CHECK = process.argv.includes('--check');
const SALIDA = path.resolve(arg('out') || path.join(RAIZ, 'index.html'));

function fallo(msg) { console.error('build: ' + msg); process.exit(1); }
const rel = p => path.relative(RAIZ, p).split(path.sep).join('/');

// ── Manifiesto: secciones [nombre] y una ruta por línea (relativa a src/); «#» empieza un comentario
function leerManifiesto() {
  const sec = new Map(); let cur = null;
  fs.readFileSync(MANIFIESTO, 'utf8').split(/\r?\n/).forEach((l, i) => {
    const s = l.replace(/(^|\s)#.*$/, '').trim();
    if (!s) return;
    const m = s.match(/^\[([a-z0-9-]+)\]$/);
    if (m) { if (sec.has(m[1])) fallo(`manifiesto, línea ${i + 1}: sección [${m[1]}] repetida`); cur = []; sec.set(m[1], cur); return; }
    if (!cur) fallo(`manifiesto, línea ${i + 1}: «${s}» fuera de una sección`);
    if (/\s/.test(s)) fallo(`manifiesto, línea ${i + 1}: «${s}» no es una ruta`);
    cur.push(s);
  });
  return sec;
}

// ── Lectura de cada fuente, con las comprobaciones que hacen que el montaje sea reproducible
function leerFuente(r, vistos) {
  if (vistos.has(r)) fallo(`${r} aparece dos veces en el manifiesto`);
  vistos.add(r);
  const p = path.join(SRC, r);
  if (!fs.existsSync(p)) fallo(`no existe src/${r} (está en el manifiesto)`);
  const b = fs.readFileSync(p);
  if (!b.length) fallo(`src/${r} está vacío`);
  if (b[b.length - 1] !== 0x0a) fallo(`src/${r} no termina en salto de línea: se pegaría a la línea siguiente`);
  const cr = b.indexOf(0x0d);
  if (cr >= 0) fallo(`src/${r} tiene finales de línea CRLF (byte ${cr}). Las fuentes van en LF: guárdalo en LF ` +
    `desde el editor (ver .gitattributes)`);
  return b;
}

const sec = leerManifiesto();
const plantilla = fs.readFileSync(PLANTILLA);
if (plantilla.indexOf(0x0d) >= 0) fallo('src/index.plantilla.html tiene finales de línea CRLF');
const RE = /^<!-- @incluye ([a-z0-9-]+) -->$/;
const trozos = [], mapa = []; // mapa: [inicio, fin, origen, línea inicial del origen] en el resultado, para --check
const usadas = new Set(), vistos = new Set();
let pos = 0, lineaPl = 1;
const empuja = (b, origen, l0) => { trozos.push(b); mapa.push([pos, pos + b.length, origen, l0]); pos += b.length; };
{ // la plantilla, línea a línea: las marcas se sustituyen y el resto pasa tal cual
  let i = 0, ini = 0, iniL = 1;
  while (i < plantilla.length) {
    let j = plantilla.indexOf(0x0a, i); if (j < 0) j = plantilla.length - 1;
    const m = plantilla.slice(i, j).toString('utf8').match(RE);
    if (m) {
      if (i > ini) empuja(plantilla.slice(ini, i), 'src/index.plantilla.html', iniL);
      const nombre = m[1];
      if (!sec.has(nombre)) fallo(`la plantilla incluye «${nombre}» y el manifiesto no tiene [${nombre}]`);
      if (usadas.has(nombre)) fallo(`la plantilla incluye «${nombre}» dos veces`);
      usadas.add(nombre);
      const enScript = /<script>\n$/.test(Buffer.concat(trozos.slice(-1)).toString('utf8'));
      for (const r of sec.get(nombre)) {
        const b = leerFuente(r, vistos);
        if (enScript && /<\/script/i.test(b.toString('utf8'))) fallo(`src/${r} contiene «</script»: cerraría el bloque (escríbelo <\\/script)`);
        empuja(b, 'src/' + r, 1);
      }
      ini = j + 1; iniL = lineaPl + 1;
    }
    i = j + 1; lineaPl++;
  }
  if (ini < plantilla.length) empuja(plantilla.slice(ini), 'src/index.plantilla.html', iniL);
}
for (const n of sec.keys()) if (!usadas.has(n)) fallo(`la sección [${n}] del manifiesto no se incluye en la plantilla`);
const html = Buffer.concat(trozos);

if (!CHECK) {
  fs.writeFileSync(SALIDA, html);
  console.log(`build: ${rel(SALIDA)} montado desde ${vistos.size + 1} ficheros (${html.length} bytes)`);
  process.exit(0);
}

// ── --check: el resultado debe ser idéntico, byte a byte, al index.html del disco
if (!fs.existsSync(SALIDA)) fallo(`--check: no existe ${rel(SALIDA)}`);
const disco = fs.readFileSync(SALIDA);
if (disco.equals(html)) { console.log(`build --check: ${rel(SALIDA)} coincide con src/ (${html.length} bytes)`); process.exit(0); }
let k = 0; const n = Math.min(disco.length, html.length);
while (k < n && disco[k] === html[k]) k++;
const lineaDe = (b, off) => { let l = 1; for (let i = 0; i < off; i++) if (b[i] === 0x0a) l++; return l; };
const textoLinea = (b, off) => { const a = b.lastIndexOf(0x0a, off - 1) + 1; let z = b.indexOf(0x0a, off); if (z < 0) z = b.length;
  return JSON.stringify(b.slice(a, z).toString('utf8').slice(0, 160)); };
const l = lineaDe(html, k);
const m = mapa.find(([a, z]) => k >= a && k < z) || mapa[mapa.length - 1];
const lo = m[3] + lineaDe(html.slice(m[0]), k - m[0]) - 1;
console.error(`build --check: ${rel(SALIDA)} NO coincide con lo que se monta desde src/`);
console.error(`  tamaños: disco ${disco.length} bytes, montaje ${html.length} bytes`);
console.error(`  primera diferencia en el byte ${k}, línea ${l} (en el montaje viene de ${m[2]}, línea ${lo})`);
if (disco.indexOf(0x0d) >= 0) console.error('  el index.html del disco tiene CRLF: va en LF, como en git: «node tools/build.js» lo deja bien');
console.error('  disco:   ' + (k < disco.length ? textoLinea(disco, k) : '(fin del fichero)'));
console.error('  montaje: ' + (k < html.length ? textoLinea(html, k) : '(fin del fichero)'));
console.error('  Si has editado src/, monta con «node tools/build.js». Si has editado index.html a mano, lleva el cambio a src/.');
process.exit(1);
