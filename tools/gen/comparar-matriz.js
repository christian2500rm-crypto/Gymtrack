// Compara una pasada de la matriz hecha con el arnés (bloque GymGen de index.html) con la misma pasada hecha con el prototipo (./sim):
// mismos resultados perfil a perfil (comprobaciones duras, de seguridad y de calidad) y mismo resumen salvo los tiempos de cálculo.
// Uso: node comparar-matriz.js <carpeta del arnés> <carpeta del prototipo>   (cada una con matriz-*.json y matriz-*-perfiles.json)
'use strict';
const fs = require('fs'), path = require('path');
const [da, ds] = process.argv.slice(2);
if (!da || !ds) { console.error('Uso: node comparar-matriz.js <arnés> <prototipo>'); process.exit(1); }
const pick = (d, re) => { const f = fs.readdirSync(d).filter(x => re.test(x)); if (f.length !== 1) throw new Error(d + ': ' + f.length + ' ficheros ' + re); return path.join(d, f[0]); };
const sinTiempos = (k, v) => /^(segundos|ms|ms_\w+|generado|fecha)$/.test(k) ? undefined : v;
let bad = 0;
{ const a = fs.readFileSync(pick(da, /-perfiles\.json$/), 'utf8'), b = fs.readFileSync(pick(ds, /-perfiles\.json$/), 'utf8');
  if (a === b) console.log('perfiles idénticos (' + JSON.parse(a).length + ')');
  else { const A = JSON.parse(a), B = JSON.parse(b); const dif = A.filter((x, i) => JSON.stringify(x) !== JSON.stringify(B[i])); console.log('PERFILES DISTINTOS: ' + dif.length + ' (p. ej. ' + dif.slice(0, 3).map(x => x.id).join(', ') + ')'); bad++; } }
{ const a = JSON.parse(fs.readFileSync(pick(da, /^matriz-(?!.*perfiles).*\.json$/), 'utf8')), b = JSON.parse(fs.readFileSync(pick(ds, /^matriz-(?!.*perfiles).*\.json$/), 'utf8'));
  const sa = JSON.stringify(a, sinTiempos), sb = JSON.stringify(b, sinTiempos);
  if (sa === sb) console.log('resumen idéntico (salvo tiempos de cálculo)'); else { console.log('RESUMEN DISTINTO'); bad++; } }
process.exit(bad ? 1 : 0);
