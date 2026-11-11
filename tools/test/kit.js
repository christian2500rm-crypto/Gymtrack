#!/usr/bin/env node
// Kit de pruebas de Gymteca: servidor estático propio, Chrome sin interfaz y la página de siembra (__seed.html).
// Sin dependencias: Node y Google Chrome (o Chromium).
//
//   node tools/test/kit.js smoke                              pruebas completas (lo que hace smoke.sh)
//   node tools/test/kit.js lanza <fichero.js> ["&empty=1…"]   ejecuta un JS grande dentro de la app (applaunch.sh)
//   node tools/test/kit.js prueba "<js>" ["&empty=1…"]        ejecuta un JS corto dentro de la app (apptest.sh)
//   node tools/test/kit.js captura <salida.png> "<js>" [alto] ["&empty=1…"]   captura a 390 px (appshot.sh)
//   node tools/test/kit.js guarda                             comprueba que __seed.html no hace nada fuera de localhost
//   node tools/test/kit.js servidor [puerto]                  sirve la raíz del repositorio hasta Ctrl+C
//
// Variables de entorno:
//   PORT     usa un servidor que ya sirve la raíz del repositorio en localhost:PORT (si no, arranca uno propio en un
//            puerto libre mientras duran las pruebas)
//   CHROME   ruta del ejecutable de Chrome (por defecto la habitual en Windows, macOS o Linux)
//   VTB      presupuesto de tiempo virtual de Chrome en ms (lanza: 200000; prueba: 8000; captura: 4000)
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), http = require('http'), zlib = require('zlib');
const { spawn, spawnSync } = require('child_process');
const { pathToFileURL } = require('url');
const resumen = require('./sum.js');

const RAIZ = path.join(__dirname, '..', '..');
const SEED = '/tools/test/__seed.html';
const HOST_AJENO = 'gymteca-prueba.test'; // un host que no es de prueba, resuelto a 127.0.0.1 solo para la comprobación

// ── Chrome
function rutaChrome() {
  if (process.env.CHROME) return process.env.CHROME;
  const c = [];
  if (process.platform === 'win32') {
    for (const v of ['PROGRAMFILES', 'PROGRAMFILES(X86)', 'LOCALAPPDATA']) if (process.env[v]) c.push(path.join(process.env[v], 'Google', 'Chrome', 'Application', 'chrome.exe'));
    c.push('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe');
  } else if (process.platform === 'darwin') {
    c.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', path.join(os.homedir(), 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
      '/Applications/Chromium.app/Contents/MacOS/Chromium');
  } else {
    for (const d of (process.env.PATH || '').split(':')) for (const n of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) c.push(path.join(d, n));
  }
  const r = c.find(p => { try { return fs.statSync(p).isFile(); } catch (e) { return false; } });
  if (!r) { console.error('kit: no encuentro Chrome. Indica su ruta con la variable CHROME.'); process.exit(2); }
  return r;
}
function tmpDir(pref) { return fs.mkdtempSync(path.join(os.tmpdir(), 'gymteca-' + pref + '-')); }
function borra(p) { try { fs.rmSync(p, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch (e) { } }
// Chrome sin interfaz con un perfil nuevo (se borra al acabar). Devuelve lo que escribe por stdout (--dump-dom).
function chrome(args, { timeoutMs = 20 * 60e3 } = {}) {
  const prof = tmpDir('prof');
  return new Promise(res => {
    const p = spawn(rutaChrome(), ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
      '--user-data-dir=' + prof, ...args], { stdio: ['ignore', 'pipe', 'ignore'] });
    const out = []; p.stdout.on('data', d => out.push(d));
    const t = setTimeout(() => p.kill(), timeoutMs);
    p.on('close', () => { clearTimeout(t); borra(prof); res(Buffer.concat(out).toString('utf8')); });
    p.on('error', e => { clearTimeout(t); borra(prof); res(''); console.error('kit: Chrome no arranca: ' + e.message); });
  });
}
const desescapa = t => t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
function salida(dom, id) {
  const m = dom.match(new RegExp('<pre id="' + id + '"[^>]*>([\\s\\S]*?)</pre>'));
  return m ? desescapa(m[1]) : null;
}

// ── Servidor estático de la raíz del repositorio (sin caché)
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8' };
function servidor(puerto = 0) {
  const srv = http.createServer((req, res) => {
    let p; try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch (e) { res.writeHead(400); return res.end(); }
    let f = path.normalize(path.join(RAIZ, p));
    if (f !== RAIZ && !f.startsWith(RAIZ + path.sep)) { res.writeHead(403); return res.end(); }
    try { if (fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); } catch (e) { }
    fs.readFile(f, (err, b) => {
      if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('404'); }
      res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(req.method === 'HEAD' ? undefined : b);
    });
  });
  return new Promise((ok, ko) => { srv.on('error', ko); srv.listen(puerto, '127.0.0.1', () => ok({ puerto: srv.address().port, cierra: () => new Promise(r => srv.close(r)) })); });
}
// Un servidor para la duración de fn: el de PORT si lo hay, si no uno propio en un puerto libre
async function conServidor(fn) {
  if (process.env.PORT) return fn(+process.env.PORT);
  const s = await servidor(0);
  try { return await fn(s.puerto); } finally { await s.cierra(); }
}

// ── Las tres formas de ejecutar algo dentro de la app (sembrada por __seed.html)
// lanza: JS grande. Va comprimido (gzip+base64) en el FRAGMENTO de la URL (#…), que no llega al servidor ni tiene el
// límite de la línea de comandos de Windows (~32 K caracteres); el ?run= solo lleva el cargador. Una página local
// temporal (file://) navega a la app con ese fragmento. El fichero se lee entero como bytes (leerlo a trozos partía
// caracteres UTF-8 en el límite de 64 KB).
const CARGADOR = "(async()=>{const h=decodeURIComponent(String(top.location.hash).slice(1));const b=Uint8Array.from(atob(h),c=>c.charCodeAt(0));const s=new TextDecoder().decode(await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());return await (0,eval)(s);})()";
async function lanza(fichero, extra, puerto) {
  const b64 = zlib.gzipSync(fs.readFileSync(fichero), { level: 9 }).toString('base64');
  const url = `http://localhost:${puerto}${SEED}?out=1&run=${encodeURIComponent(CARGADOR)}${extra || ''}#${b64}`;
  const d = tmpDir('lanza'), html = path.join(d, 'lanza.html');
  fs.writeFileSync(html, '<!doctype html><meta charset="utf-8"><script>location.replace(' + JSON.stringify(url) + ');</script>');
  try {
    // (07-16) tope de tiempo virtual: los pasos del modo gym esperan al avance automático y cada pasada del smoke gasta
    // ~120 s virtuales; una página que acaba antes no espera más
    const dom = await chrome(['--virtual-time-budget=' + (process.env.VTB || 200000), '--window-size=390,844', '--dump-dom', pathToFileURL(html).href]);
    return salida(dom, 'out');
  } finally { borra(d); }
}
async function prueba(js, extra, puerto) {
  const url = `http://localhost:${puerto}${SEED}?out=1&run=${encodeURIComponent(js || '')}${extra || ''}`;
  return salida(await chrome(['--virtual-time-budget=' + (process.env.VTB || 8000), '--window-size=390,844', '--dump-dom', url]), 'out');
}
async function captura(fichero, js, alto, extra, puerto) {
  const h = +alto || 844, out = path.resolve(fichero);
  try { fs.unlinkSync(out); } catch (e) { }
  const url = `http://localhost:${puerto}${SEED}?h=${h}&run=${encodeURIComponent(js || '')}${extra || ''}`;
  await chrome(['--hide-scrollbars', '--force-device-scale-factor=1', '--virtual-time-budget=' + (process.env.VTB || 4000),
    '--window-size=390,' + h, '--screenshot=' + out, url]);
  return fs.existsSync(out) ? out : null;
}

// ── Guarda de __seed.html: fuera de localhost no escribe; en localhost sí (la comprobación detecta una escritura)
async function guarda(puerto) {
  const leer = async host => salida(await chrome(['--virtual-time-budget=6000', '--host-resolver-rules=MAP ' + HOST_AJENO + ' 127.0.0.1',
    '--dump-dom', `http://${host}:${puerto}/tools/test/guarda.html`]), 'res') || '(sin respuesta)';
  const ajeno = await leer(HOST_AJENO), local = await leer('localhost');
  const ok = /escrito:no app:no aviso:"BLOQUEADA/.test(ajeno) && /escrito:sí/.test(local);
  return { ok, texto: `fuera de localhost → ${ajeno}\n  en localhost → ${local}` };
}

// ── smoke: montaje, guarda y las dos pasadas (con datos y usuario nuevo)
async function smoke() {
  const b = spawnSync(process.execPath, [path.join(RAIZ, 'tools', 'build.js'), '--check'], { encoding: 'utf8' });
  process.stdout.write(b.stdout); process.stderr.write(b.stderr);
  if (b.status !== 0) { console.error('kit: index.html no coincide con src/. Monta con «node tools/build.js» antes de probar.'); return 1; }
  const smokeJs = path.join(__dirname, 'smoke.js');
  return conServidor(async puerto => {
    console.log('servidor: http://localhost:' + puerto + (process.env.PORT ? ' (PORT)' : ' (propio)') + ' · Chrome: ' + rutaChrome());
    const g = await guarda(puerto);
    console.log('== guarda de __seed.html: ' + (g.ok ? 'ok' : 'FALLO') + ' ==\n  ' + g.texto);
    let txt = '';
    for (const [titulo, extra] of [['con datos', '&wait=600'], ['usuario nuevo (empty)', '&empty=1&wait=600']]) {
      const t0 = Date.now();
      let r = await lanza(smokeJs, extra, puerto);
      // Salida vacía = Chrome agotó el tiempo virtual antes de que la página escribiera (pasa con la máquina cargada):
      // se repite UNA vez, avisándolo; si vuelve a salir vacía, el resumen lo cuenta como fallo
      if (r != null && !/RESULT:/.test(r)) {
        console.log('(«' + titulo + '» salió vacía en ' + Math.round((Date.now() - t0) / 1000) + ' s: se repite una vez)');
        r = await lanza(smokeJs, extra, puerto);
      }
      const bloque = '== ' + titulo + ' ==\n' + (r == null ? 'NO OUTPUT (¿cargó la app?)' : r) + '\n';
      process.stdout.write(bloque); txt += bloque;
      console.log('(' + Math.round((Date.now() - t0) / 1000) + ' s)');
    }
    console.log('\n== resumen ==');
    const s = resumen(txt);
    console.log(s.texto);
    const ok = g.ok && s.ok;
    console.log(ok ? 'RESULTADO: ok (solo fallos conocidos, si los hay)' : 'RESULTADO: HAY FALLOS');
    return ok ? 0 : 1;
  });
}

// ── Línea de órdenes
async function main() {
  const [orden, ...a] = process.argv.slice(2);
  switch (orden) {
    case 'smoke': return smoke();
    case 'lanza': if (!a[0]) break; return conServidor(async p => { const r = await lanza(a[0], a[1], p); console.log(r == null ? 'NO OUTPUT (¿cargó la app?)' : r); return r == null ? 1 : 0; });
    case 'prueba': return conServidor(async p => { const r = await prueba(a[0], a[1], p); console.log(r == null ? 'NO OUTPUT (¿cargó la app?)' : r); return r == null ? 1 : 0; });
    case 'captura': if (!a[0]) break; return conServidor(async p => { const r = await captura(a[0], a[1], a[2], a[3], p); console.log(r ? 'OK ' + r : 'FAIL (sin captura)'); return r ? 0 : 1; });
    case 'guarda': return conServidor(async p => { const g = await guarda(p); console.log((g.ok ? 'ok' : 'FALLO') + '\n  ' + g.texto); return g.ok ? 0 : 1; });
    case 'servidor': { const s = await servidor(+a[0] || 0); console.log('Sirviendo ' + RAIZ + ' en http://localhost:' + s.puerto + ' (Ctrl+C para parar)'); return new Promise(() => { }); }
  }
  console.error(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 19).map(l => l.replace(/^\/\/ ?/, '')).join('\n'));
  return 2;
}
if (require.main === module) main().then(c => process.exit(c), e => { console.error(e); process.exit(1); });
module.exports = { servidor, lanza, prueba, captura, guarda, rutaChrome };
