// Compara las salidas del arnés (carpeta temporal) con las del prototipo (./sim): mismas rutinas para las mismas entradas.
// Uso: node comparar.js <carpeta del arnés> [ficheros…]   (por defecto ejemplos.json, ejemplos-dias.json y personas-comparacion*.json)
'use strict';
const fs = require('fs'), path = require('path');
const [dir, ...files] = process.argv.slice(2);
const SIM = path.join(__dirname, 'sim');
const list = files.length ? files : ['ejemplos.json', 'ejemplos-dias.json', 'personas-comparacion.json', 'personas-comparacion-dias.json'];
let bad = 0;
for (const f of list) {
  const a = path.join(SIM, f), b = path.join(dir, f);
  if (!fs.existsSync(b)) { console.log('falta en el arnés:', f); bad++; continue; }
  const ja = fs.readFileSync(a, 'utf8'), jb = fs.readFileSync(b, 'utf8');
  if (ja === jb) { console.log('idéntico:', f); continue; }
  // sin las marcas de tiempo, por si las hay
  const norm = s => JSON.stringify(JSON.parse(s), (k, v) => /^(ts|fecha|date|generado)$/.test(k) ? undefined : v);
  if (norm(ja) === norm(jb)) { console.log('igual (salvo fechas):', f); continue; }
  console.log('DISTINTO:', f); bad++;
}
process.exit(bad ? 1 : 0);
