/* Gymteca · service worker (etapa 15)
 *
 * Qué hace
 * - Guarda la app (index.html, manifest, iconos y fuentes) en una caché con versión al instalarse.
 * - Abre la app desde esa caché al momento (también sin conexión) y, a la vez, mira en segundo plano si hay un
 *   index.html nuevo. Si lo hay, lo guarda y avisa a las pestañas abiertas ({type:'gt-update', hash}): la app enseña
 *   «Nueva versión disponible · Actualizar» y solo recarga cuando la persona lo toca (nunca a mitad de un entreno ni
 *   con una hoja abierta). Si no se toca, la próxima vez que se abra ya sale la versión nueva.
 * - Nunca toca peticiones de otros dominios ni las que no son GET. Lo que no es la app (p. ej. /brand/, robots.txt)
 *   va a la red como siempre.
 *
 * Cuándo cambiar VERSION
 * - NO hace falta para publicar un index.html nuevo: se detecta solo, comparando su huella (SHA-256).
 * - SÍ al cambiar este fichero o la lista de ficheros de la app (SHELL). La versión nueva se instala en una caché
 *   nueva y espera; la app avisa y, al tocar «Actualizar», la activa (skipWaiting) y recarga. Al activarse borra las
 *   cachés viejas de Gymteca.
 */
'use strict';
const VERSION = '15.1';
const PREFIX = 'gymteca-';
const CACHE = PREFIX + 'app-' + VERSION;
const HASH_H = 'X-Gymteca-Hash';            // huella del index.html guardado (cabecera propia en la copia de la caché)
const SHELL = [
  'manifest.webmanifest',
  'assets/icons/icono.svg', 'assets/icons/favicon.svg', 'assets/icons/favicon-32.png',
  'assets/icons/icono-180.png', 'assets/icons/icono-192.png', 'assets/icons/icono-512.png',
  'assets/fonts/dm-sans.woff2', 'assets/fonts/dm-mono-400.woff2', 'assets/fonts/dm-mono-500.woff2'
];
const ASSET_TTL = 6 * 3600e3;                // revisar cada fichero de la app como mucho cada 6 h

const scopeUrl = () => self.registration.scope;              // https://gymteca.app/
const DOC = () => scopeUrl();                                // el documento se guarda bajo la raíz del alcance
const abs = p => new URL(p, scopeUrl()).href;
const assetSet = () => new Set(SHELL.map(p => new URL(abs(p)).pathname));
const served = new Map();                    // id de pestaña → huella del index.html con el que se abrió
const lastAsset = new Map();                 // url → última revisión en segundo plano
let reval = null;                            // revisión del documento en marcha (una sola a la vez)

async function digest(buf) {
  try {
    const d = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(d), b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    // Sin crypto.subtle: tamaño + suma sencilla (basta para notar un cambio)
    const u = new Uint8Array(buf); let h = 0;
    for (let i = 0; i < u.length; i++) h = (h * 31 + u[i]) | 0;
    return 'n' + u.length + '-' + (h >>> 0).toString(16);
  }
}
// Copia del documento para la caché: cuerpo ya leído, sin cabeceras de compresión/longitud y con su huella
function docResponse(buf, res, hash) {
  const h = new Headers(res.headers);
  h.delete('content-encoding'); h.delete('content-length');
  h.set(HASH_H, hash);
  if (!h.get('content-type')) h.set('content-type', 'text/html; charset=utf-8');
  return new Response(buf, { status: 200, statusText: 'OK', headers: h });
}
const okDoc = r => !!(r && r.ok && r.type === 'basic' && /html/i.test(r.headers.get('content-type') || 'text/html'));
const okAsset = r => !!(r && r.ok && r.type === 'basic');

async function windows() {
  try { return await self.clients.matchAll({ type: 'window', includeUncontrolled: false }); } catch (e) { return []; }
}
async function currentHash() {
  try { const c = await caches.open(CACHE), r = await c.match(DOC()); return r ? r.headers.get(HASH_H) : null; }
  catch (e) { return null; }
}

// ── Instalar: guardar la app entera. Sin index.html no se instala (nunca se activa una caché sin la app). ──
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const res = await fetch(DOC(), { cache: 'reload', credentials: 'same-origin' });
    if (!okDoc(res)) throw new Error('Gymteca: no se pudo guardar la app');
    const buf = await res.arrayBuffer();
    await cache.put(DOC(), docResponse(buf, res, await digest(buf)));
    // Los demás ficheros, uno a uno: si falta alguno (quien publica solo index.html), la app sigue funcionando
    await Promise.all(SHELL.map(async p => {
      try { const r = await fetch(abs(p), { cache: 'reload', credentials: 'same-origin' }); if (okAsset(r)) { await cache.put(abs(p), r); lastAsset.set(abs(p), Date.now()); } }
      catch (err) { /* sin ese fichero */ }
    }));
  })());
});

// ── Activar: borrar las cachés viejas de Gymteca y controlar ya las pestañas abiertas ──
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
    // Pestañas que se abrieron sin pasar por aquí (primera visita): van con lo que se acaba de guardar
    const h = await currentHash();
    if (h) (await windows()).forEach(c => { if (!served.has(c.id)) served.set(c.id, h); });
  })());
});

// ── Revisar el documento en segundo plano: si cambió, guardarlo y avisar ──
function revalidateDoc() {
  if (reval) return reval;
  reval = (async () => {
    try {
      const res = await fetch(DOC(), { cache: 'no-cache', credentials: 'same-origin' });
      if (!okDoc(res)) return;
      const buf = await res.arrayBuffer(), h = await digest(buf);
      const cache = await caches.open(CACHE), old = await cache.match(DOC());
      const oh = old ? old.headers.get(HASH_H) : null;
      if (oh === h) return;
      await cache.put(DOC(), docResponse(buf, res, h));
      // Con un index.html nuevo, los demás ficheros también se miran ya (sin esperar a las 6 h)
      SHELL.forEach(p => refreshAsset(abs(p), true));
      if (oh) (await windows()).forEach(c => { try { c.postMessage({ type: 'gt-update', hash: h }); } catch (err) {} });
    } catch (err) { /* sin conexión o servidor caído: se queda la copia guardada */ }
    finally { reval = null; }
  })();
  return reval;
}
function refreshAsset(url, force) {
  const now = Date.now();
  if (!force && now - (lastAsset.get(url) || 0) < ASSET_TTL) return Promise.resolve();
  lastAsset.set(url, now);
  return (async () => {
    try {
      const r = await fetch(url, { cache: 'no-cache', credentials: 'same-origin' });
      if (okAsset(r)) await (await caches.open(CACHE)).put(url, r);
    } catch (err) {}
  })();
}

async function serveDoc(e) {
  const cid = e.resultingClientId || e.clientId;
  let hit = null;
  try { hit = await (await caches.open(CACHE)).match(DOC()); } catch (err) {}
  if (hit) {
    const h = hit.headers.get(HASH_H);
    if (cid && h) served.set(cid, h);
    e.waitUntil(revalidateDoc());
    return hit;
  }
  // Sin copia (caché borrada a mano): red, y se guarda para la próxima
  e.waitUntil(revalidateDoc().then(async () => {
    const h = await currentHash();
    if (cid && h && !served.has(cid)) served.set(cid, h);
  }));
  return fetch(e.request);
}
async function serveAsset(e, url) {
  let hit = null;
  try { hit = await (await caches.open(CACHE)).match(url, { ignoreSearch: true }); } catch (err) {}
  if (hit) { e.waitUntil(refreshAsset(url)); return hit; }
  const res = await fetch(e.request);
  if (okAsset(res) && !res.redirected) {
    const copy = res.clone();
    e.waitUntil(caches.open(CACHE).then(c => c.put(url, copy)).catch(() => {}));
  }
  return res;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // nunca POST, PUT…
  let url; try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;        // nunca otros dominios
  if (req.headers.has('range')) return;
  const sp = new URL(scopeUrl()).pathname;
  if (req.mode === 'navigate') {
    // Solo la ventana principal: la app dentro de un iframe (el banco de pruebas __seed.html) va siempre a la red
    if (req.destination === 'document' && (url.pathname === sp || url.pathname === sp + 'index.html')) e.respondWith(serveDoc(e));
    return;                                               // otras páginas (p. ej. /brand/): a la red
  }
  if (assetSet().has(url.pathname)) e.respondWith(serveAsset(e, url.origin + url.pathname));
});

// ── Mensajes de la app ──
// gt-hello: «¿con qué versión me abriste?» · gt-check: revisar ahora y decir la última guardada · gt-skip: activar ya
self.addEventListener('message', e => {
  const d = e.data || {}, src = e.source;
  const reply = m => { try { src && src.postMessage(m); } catch (err) {} };
  if (d.type === 'gt-skip') { e.waitUntil(self.skipWaiting()); return; }
  if (d.type === 'gt-hello') {
    e.waitUntil((async () => {
      let h = src && served.get(src.id);
      if (!h && d.fresh) { h = await currentHash(); if (h && src) served.set(src.id, h); }
      reply({ type: 'gt-hello', hash: h || null, version: VERSION });
    })());
    return;
  }
  if (d.type === 'gt-check') {
    e.waitUntil(revalidateDoc().then(currentHash).then(h => reply({ type: 'gt-state', hash: h, version: VERSION })));
  }
});
