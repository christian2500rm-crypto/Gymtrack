// Resumen de una carpeta de matriz (o varias): perfiles, ok=false, reglas duras (invariantes), seguridad (medición 5), determinismo y
// algunas métricas blandas. Uso: node sum-matriz.js <carpeta> [<carpeta de comparación>]
const fs = require('fs'), path = require('path');
const load = d => { const f = fs.readdirSync(d).find(x => /^matriz-.*\.json$/.test(x) && !/perfiles/.test(x)); return f ? JSON.parse(fs.readFileSync(path.join(d, f))) : null; };
const cnt = o => Object.entries(o || {}).map(([k, v]) => k + ':' + (v && v.n != null ? v.n : typeof v === 'object' ? JSON.stringify(v).slice(0, 60) : v)).join(' ') || '0';
const line = j => {
  const m5 = j.medicion5 || {}, bs = m5.bloque_seguridad || {}, seg = j.segmentos && j.segmentos.todos || {};
  return `perfiles ${j.perfiles} ok_false ${j.ok_false} · duras [${cnt(j.invariantes)}] · seguridad 4200 [${cnt(m5.invariantes)}] bloque ${bs.perfiles} [${cnt(bs.invariantes)}] det ${j.determinismo}/${bs.determinismo} · remo_mesa ${seg.remo_mesa} · vol_alto ${seg.vol_alto} · rareza ${seg.rareza_gym} · grupos_obj ${j.volumen_grupos_en_objetivo}`;
};
const [a, b] = process.argv.slice(2);
for (const v of fs.readdirSync(a).filter(x => fs.statSync(path.join(a, x)).isDirectory())) {
  const ja = load(path.join(a, v)); if (!ja) { console.log(v, 'sin resultado'); continue; }
  console.log(v.padEnd(16), line(ja));
  if (b && fs.existsSync(path.join(b, v))) { const jb = load(path.join(b, v)); if (jb) console.log(''.padEnd(16), 'antes: ' + line(jb)); }
}
