#!/usr/bin/env node
// Resume la salida del smoke: pasos, fallos y ERRORS de cada pasada.
// Uso: node tools/test/sum.js <salida.txt>   (o desde kit.js, que lo llama al acabar)
//
// Fallos conocidos: dependen de la fecha del día (el resumen «Wrapped» del mes en curso) y salen en la línea base de
// 163050c (con datos: wrapped14r1bFixes y cortes18; usuario nuevo: wrapped14r1bFixes y menores16c). Se enseñan, pero no
// cuentan como fallo. entrenoDock16 puede fallar si la máquina está muy cargada: se repite la pasada antes de tocar nada.
'use strict';
const CONOCIDOS = new Set(['wrapped14r1bFixes', 'cortes18', 'menores16c']);

function resumen(t) {
  const lineas = []; let ok = true, pasadas = 0, pendiente = false, fin = false;
  // Cada pasada («== título ==», salvo la guarda y el resumen) tiene que traer su RESULT: una salida vacía (Chrome se quedó
  // sin tiempo virtual antes de que la página escribiera) es un fallo, no una pasada limpia
  const cierra = () => { if (pendiente) { ok = false; lineas.push('  sin RESULT: la pasada salió vacía (¿se acabó el tiempo virtual? ¿máquina cargada?)'); } pendiente = false; };
  t.split(/\n(?=RESULT:|ERRORS:|==|NO OUTPUT)/).forEach(l => {
    if (fin || (l.startsWith('== resumen') && (fin = true))) return; // una salida guardada de smoke.sh ya trae su resumen
    if (l.startsWith('RESULT:')) {
      pasadas++; pendiente = false;
      let o; try { o = JSON.parse(l.slice(7).trim()); } catch (e) { lineas.push('  RESULT ilegible: ' + l.slice(0, 300)); ok = false; return; }
      const ks = Object.keys(o), bad = ks.filter(k => o[k] !== 'ok' && k !== 'anims');
      const nuevos = bad.filter(k => !CONOCIDOS.has(k));
      if (nuevos.length) ok = false;
      lineas.push('  pasos ' + ks.length + ' · fallos ' + bad.length + (bad.length - nuevos.length ? ' (' + (bad.length - nuevos.length) + ' conocidos)' : '') + ' · anims ' + o.anims);
      bad.forEach(k => lineas.push('    ✗ ' + k + (CONOCIDOS.has(k) ? ' [conocido: depende de la fecha]' : '') + ': ' + JSON.stringify(o[k]).slice(0, 260)));
    } else if (l.startsWith('ERRORS:')) {
      const e = l.slice(7).split('\n')[0].trim(); // solo su línea (detrás puede venir «(62 s)»)
      if (e !== '[]') ok = false;
      lineas.push('  ERRORS ' + e.slice(0, 600));
    } else if (l.startsWith('NO OUTPUT')) { ok = false; pasadas++; pendiente = false; lineas.push('  ' + l.slice(0, 200)); }
    else if (l.startsWith('==')) {
      const cab = l.split('\n')[0];
      if (/^== guarda/.test(cab)) return;
      cierra(); pendiente = true; lineas.push(cab);
    }
  });
  cierra();
  if (!pasadas) ok = false;
  return { ok, texto: lineas.join('\n') };
}
module.exports = resumen;
if (require.main === module) {
  if (!process.argv[2]) { console.error('Uso: node sum.js <salida.txt>'); process.exit(2); }
  const r = resumen(require('fs').readFileSync(process.argv[2], 'utf8'));
  console.log(r.texto); process.exit(r.ok ? 0 : 1);
}
