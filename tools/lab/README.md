# Laboratorio 3D (GymAnim)

## Cómo produce su bloque de la app

El motor 3D de la app sale de aquí: `engine.js` + `ex/*.js` → `src/js/anim/` (un fichero por fichero del laboratorio, sin
las líneas de comentario `//`, y `firma.js` con la huella que versiona las miniaturas guardadas).

```bash
node tools/lab/build.js           # escribe src/js/anim/ y comprueba que el bloque carga (420 ejercicios)
node tools/build.js               # monta index.html
node tools/lab/build.js --check   # sin escribir: src/js/anim/ coincide byte a byte con el laboratorio
```

En noviembre de 2026 (163050c) el laboratorio reproduce `src/js/anim/` byte a byte. El orden es `engine.js`, `_kit.js`, la
lista fija de `build.js` y después los demás `ex/*.js` por orden alfabético; la sección `[anim]` de `src/manifiesto.txt`
tiene que llevar ese orden (`build.js` lo comprueba y, si falta un fichero nuevo, dice la lista que hay que poner).
Antes escribía directamente en `index.html` entre las marcas `GYM-ANIM`; ya no, y la opción `--files=` desaparece (para
probar unas pocas familias está `lab.html`). Las capturas de `shot.sh` y `headshot.sh` van a `shots/`, que no se versiona;
la ruta de Chrome se puede cambiar con la variable `CHROME`. La coherencia con el catálogo la comprueba
`node tools/catalog/animcheck.js tools/catalog/catalog.json`.

---

# Guía de autoría de animaciones de ejercicios

Motor: `engine.js` (NO lo modifiques). Cada ejercicio se define con `GA.def(key, spec)` en un
archivo `ex/<grupo>.js`. Referencias que DEBES leer y copiar como patrón: `ex/ref.js`
(Smith squat, leg extension, lat pulldown, treadmill walk, DB lateral raise) y `ex/ref2.js`
(flat DB press tumbado en banco, tricep pushdown con cuerda).

## Verificación visual (obligatoria, iterativa)
```
cd <lab>
bash shot.sh <key> ex/<tu_archivo>.js shots/<prefijo>_<key>.png "" 1440,720
```
Luego abre el PNG con la herramienta Read (es una imagen). La hoja muestra:
- Fila(s) superiores: la cámara del ejercicio en momentos clave del timeline (tamaño real de la app ≈ 340×200).
- "ctrl": vistas de control ortogonales (lateral yaw0, frontal yaw90, cenital) en los dos extremos del movimiento.
  Úsalas para detectar errores 3D ocultos (manos que no tocan el agarre, piernas atravesando el banco, pies hundidos o flotando…).
- Arriba de cada cuadro: `IK x.xcm` en rojo si un brazo/pierna no alcanza su objetivo. Debe ser 0 (≤0.3 cm).
- Abajo: `max IK err`.
Parámetros extra útiles (4º argumento): `&w=700&h=420` (cuadros grandes para ver detalle), `&times=0.1,2.3` (tiempos concretos), `&ctrl=0`.
Usa SIEMPRE un nombre de PNG con tu prefijo para no pisar a otros agentes. Si un render sale negro o con "ERR", hay una excepción JS: revisa el código.

## Convenciones del mundo
- Metros. Y arriba. Suelo en y=0. La persona mira a **+X** por defecto; su **derecha es +Z**.
- Cámara: `cam:{yaw,pitch,zoom?,persp?}`. yaw 0 = vista lateral desde la derecha; 90 = frontal; -90 = espalda; 180 = lateral izquierda. pitch = elevación (grados). El encuadre es automático (todo lo dibujado durante el ciclo) o por `fitBox:[[x0,y0,z0],[x1,y1,z1]]` (recorta máquinas altas para que la persona se vea grande). Procura que la persona ocupe la mayor parte del alto.
- Lado R = derecho (z>0), L = izquierdo (z<0). `k = s==='R'?1:-1` es el patrón para reflejar.

## spec
```js
GA.def('lib_xxx',{
  title:'Nombre',                       // igual que en la app
  cam:{yaw:35,pitch:8}, fitBox:[[..],[..]],
  muscles:{quads:1,glutes:.6},          // overlays de músculo objetivo (peso 0-1). Sufijo _R/_L = solo un lado
  labels:['Cuádriceps','Glúteos'],      // texto HUD (español, corto, ≤ ~38 caracteres en total)
  init:{p:0},                           // valores iniciales de canales (por defecto p:0, act:.55)
  timeline:[                            // fases con duración REAL (tempo óptimo). Interpola cualquier canal numérico
    {p:1,dur:2,label:'Sube en 2 s',act:1},     // ease por defecto 'mj' (minimum-jerk) · también 'sin','lin','in','out'
    {dur:1,label:'Aprieta 1 s',act:1},          // sin canales = pausa
    {p:0,dur:3,label:'Baja en 3 s',act:.7},
    {dur:.5,label:'Abajo',act:.5}               // el último paso debe devolver los canales al valor inicial (bucle sin saltos)
  ],
  cycle:{period:1.1},                   // SOLO para movimientos cíclicos continuos (cardio): c.cyc ∈ [0,1) lineal
  note:'5 km/h · 4 %',                  // texto opcional a la derecha del HUD
  build(c,b,E){ ... }                   // se llama CADA fotograma: crea cuerpo + equipamiento a partir de c.p (y otros canales)
});
```
`act` = activación muscular (intensidad del resaltado): ~1 en concéntrica y contracción, ~.7-.8 en excéntrica, ~.45-.5 en reposo.
Labels de fase: verbos cortos en español con la clave técnica ("Baja en 3 s", "Aprieta · codos pegados", "Sube sin balanceo"). ≤ 30 caracteres.
Canales extra para ejercicios alternos: p.ej. `init:{R:0,L:0}` y pasos `{R:1,dur:1.2,...}`, `{L:1,...}`; en build lee `c.R`, `c.L`.

## Cuerpo `b` (llamar en este ORDEN: pelvis → spine → head → scap → brazos/piernas)
Proporciones ≈1,76 m: `E.DIM` = {ua:.30 húmero, fa:.255 antebrazo, grip:.075 muñeca→centro del puño, th:.44 fémur, sh:.43 tibia, ankH:.075 altura tobillo, heel:.055, toe:.205, hipW:.088 media separación caderas, shW:.183 media anchura hombros, hipH:.945 altura de cadera de pie}.
- `b.pelvis(pos,{yaw,tilt,roll})` pos = centro entre articulaciones de cadera. tilt + = inclinar adelante (bisagra de cadera con columna neutra). Tumbado boca arriba con cabeza hacia -X: `tilt:-90`. Boca abajo con cabeza hacia +X: `tilt:90`. Sentado reclinado: tilt negativo. yaw gira hacia la izquierda (+).
  Altura típica sentado: cadera ≈ superficie del asiento + 0.09. Tumbado boca arriba: cadera ≈ superficie + 0.11.
- `b.spine(flex,side,twist)` flexión de columna (+ redondear, - extender/arquear). Para crunches: la flexión va aquí (no en la cadera).
- `b.head(flex,turn,tilt)` relativa al tórax (+flex = barbilla abajo). Mantén cuello neutro según el ejercicio.
- `b.scap(side|'both',elev,prot)` en metros: elev + encoger (-.02 deprimir), prot + protracción (+.03 alcanzar) / - retracción (-.03 juntar escápulas). ¡Clave en remos, jalones, press!
- Puntos de referencia: `b.sho(s)`, `b.hip(s)`, `b.j(s,'grip'|'elb'|'wri'|'kne'|'ank'|'heel'|'toe'|'ball')`, `b.neckB`, `b.headC`,
  `b.tpt(r,u,f)` punto en el marco del tórax (origen base del cuello C7: r derecha, u hacia la cabeza, f hacia el pecho),
  `b.ppt(r,u,f)` marco pélvico, `b.hpt(r,u,f)` cabeza, `b.tdir(r,u,f)`/`b.pdir()` direcciones. Superficie del pecho ≈ f .12-.13; espalda ≈ f -.10.
- Brazos:
  - `b.arm(s,target,pole,gripAxis)` IK: target = centro del puño (lo que agarra), pole = dirección a la que apunta el CODO, gripAxis = eje del mango a través del puño (barra, mancuerna…).
  - `b.armFK(s,{flex,abd,hz,rot,elbow,grip})` grados relativos al tórax: flex (adelante), abd (hacia fuera), hz (horizontal hacia delante), rot (rotación interna +), elbow (flexión).
  - `b.armDir(s,uDir,fDir,gripAxis)` por direcciones de húmero y antebrazo (garantiza codo FIJO: tríceps, curls). `b.armVia(s,elbow,target)`.
- Piernas:
  - Fija primero el pie: `b.footFlat(s,heel,yaw)` (talón en el suelo, apertura en grados; derecha usa yaw negativo para abrir hacia fuera), `b.footBall(s,ball,yaw,pitch)` (pivota en metatarsos, pitch + = talón arriba), `b.foot(s,ankle,fwd,up)` genérico.
  - `b.leg(s,ankle?,pole)` IK de cadera a tobillo (sin ankle usa el del pie fijado). pole = hacia dónde apunta la RODILLA (debe seguir la punta del pie).
  - `b.legFK(s,{flex,abd,rot,knee,ankle})`, `b.legDir(s,tDir,sDir)`, `b.footRelax(s,ang)` (pie libre siguiendo la tibia, + flexión plantar).
- `b.ikErr` acumula el error si un objetivo es inalcanzable: ajusta la geometría hasta que sea 0.
- Brazos/piernas sin definir se dibujan colgando/rectos por defecto (evítalo: define siempre los 4 miembros).

## Equipamiento `E` (todo en coordenadas del mundo)
`E.V` (vectores: add, sub, mul, madd(a,b,s)=a+b*s, dot, cross, len, dist, norm, lerp, rot(v,eje,rad), yaw(deg)→dir horizontal, xy(deg,len)→dir en plano XY, perp), `E.C` colores (frame, frameD, pad, chrome, plate, rubber, cable, accent, wood, screen…), `E.mix`, `E.clamp`, `E.sstep`, `E.solve(f,lo,hi)` (bisección f=0), `E.DIM`, `E.fpt/fdir`.
- Primitivas: `E.cap(a,b,ra,rb,col)` cápsula · `E.sph(c,r,col)` · `E.ell(c,[axR,axU,axF],col)` elipsoide · `E.box(c,[ax,ay,az],col)` caja por semiejes · `E.boxA(c,[sx,sy,sz],col,{yaw,pitch,roll})` caja alineada · `E.beam(a,b,w,col)` viga cuadrada · `E.pad(a,b,w,th,col,{up})` cojín tapizado (eje largo a→b, `up` = normal de la cara superior) · `E.cyl(a,b,r,col)` · `E.disc(c,normal,r,th,col)` · `E.line(a,b,w,col)` · `E.poly(pts,col)` · `E.shadow(c,rx,rz,alpha)` sombra de contacto en el suelo.
- Compuestos: `E.bar(a,b,{r})` barra cromada · `E.plate(c,normal,r,{th})` disco de pesas · `E.dumbbell(c,axis,{r,hl,len})` (c = centro del mango = grip) · `E.cable(a,b)` · `E.pulley(c,normal,r)` · `E.rope(clip,manoR,manoL)` · `E.handle(c,axis)` maneral D · `E.stack(base,{h,lift,n,sel,yaw,w,bias})` pila de pesas (lift en metros = desplazamiento del cable; devuelve el punto superior) · `E.bench({at,dir,h,seat,back,inc,w})` banco plano/inclinado (devuelve {hinge,sd,bd,n}) · `GA._.walkOnTreadmill(c,b,E,{speed,incline,period})` marcha completa en cinta.
- Opciones comunes (último argumento): `{layer:-1}` fuerza dibujar antes (estructuras detrás/debajo del cuerpo: asientos, respaldos, bases), `{layer:1}` encima, `{bias:+m}` empuja más lejos en el orden de profundidad, `{outline:false}`, `{alpha:.5}`.
- Orden de pintado: por profundidad (lejos→cerca) por grupo. Si un cojín/banco tapa a la persona que está apoyada encima, ponle `layer:-1`. Si algo cerca de la cámara tapa demasiado (p.ej. un poste), muévelo, adelgázalo o cambia la cámara.
- `E.trace('nombre',punto)` dibuja la trayectoria discontinua (verde) de ese punto durante el ciclo: úsala para la trayectoria clave (barra, mancuerna, maneral) SI aporta (no sobre la cara).
- La pila de pesas DEBE moverse coherente con el cable: lift = cambio de la longitud de cable (o ángulo de la leva × radio en máquinas de palanca).

## Músculos disponibles (`muscles`)
quads, hams, adductors, abductors, glutes, calves, abs, obliques, lowback, pecs, upperpecs, lowerpecs, lats, midback, traps, frontdelts, sidedelts, reardelts, biceps, triceps, forearms. Sufijo `_R` / `_L` para un solo lado.
Labels HUD en español: Cuádriceps, Isquiotibiales, Glúteos, Glúteo medio, Aductores, Gemelos, Abdomen, Oblicuos, Lumbares, Pectoral, Pectoral superior, Pectoral inferior, Dorsales, Romboides, Trapecio, Deltoides anterior/lateral/posterior, Bíceps, Braquial, Tríceps, Antebrazo.

## Checklist de calidad (todas deben cumplirse)
1. Mecánica ÓPTIMA del ejercicio (ver brief): rango de movimiento, ángulos articulares, trayectoria, posición escapular, columna neutra, tempo realista (excéntrica más lenta que concéntrica salvo cardio).
2. Contactos: manos SIEMPRE en el agarre (puño sobre el mango/barra), pies apoyados (ni hundidos ni flotando), glúteos/espalda tocando asiento/respaldo/banco, rodillo sobre la zona correcta. Nada atraviesa el equipamiento ni el propio cuerpo.
3. Equipamiento reconocible, proporcionado (alturas reales) y que se mueve con el cuerpo (palancas, poleas, pila de pesas).
4. Cámara que muestra mejor la mecánica (ángulo 3/4 normalmente), persona grande en el cuadro, nada importante tapado.
5. `max IK err` ≈ 0. Bucle sin saltos (el último paso vuelve al estado inicial).
6. Sin errores JS. Código compacto (sin comentarios kilométricos), una `GA.def` por ejercicio, helpers locales dentro del IIFE del archivo.

## Mapa muscular (API del motor, etapa 06)
Maniquí de pie en pose neutra (gris, para que el brillo se lea igual sobre piel y ropa) con un brillo de calor por músculo
(ámbar → naranja → rojo). No es un ejercicio: no se registra con `def` y no cuenta en `keys()` (siguen siendo 46).
```js
const h=GymAnim.muscleMap(el,{
  weights:{quads:.8,hams:.3,lats_R:.5},  // intensidad 0-1 por músculo de MUS (sufijo _L/_R = un lado); >1 se recorta, lo demás se ignora
  view:'both',        // 'both' (frente + espalda en el mismo canvas) | 'front' | 'back'
  onPick:m=>{},       // toque sobre un músculo visible → su nombre ('hams', 'pecs'…)
  label:'…',          // aria-label del canvas (role="img")
  breathe:true, idleMs:12000, fps:15, hint:true, pitch:5, bg:null
});
h.setWeights(w); h.setView('front'); h.setLabel(t); h.redraw(); h.draw() /* síncrono */; h.wake(); h.unmount();
h.weights; h.frames; h.breathing; h.view; h.pick(x,y) /* músculo bajo un punto del canvas */
GymAnim.muscleMap(el,{weights}) // sobre un elemento ya montado = actualizar (mismo canvas, mismo handle)
GymAnim.unmount(el)            // mapas y animaciones de ejercicio: quita el canvas y deja de observarlo
GymAnim.muscles()              // nombres de MUS
GymAnim._.mapStats()           // {maps, anims, running, frames} · GymAnim._.mapTick(now) = un paso del bucle (pruebas)
```
- Interacción: arrastrar gira las dos figuras (ratón: también inclina), doble toque vuelve a la vista inicial (con giro, el
  toque simple espera 280 ms para distinguirlo), toque = `onPick` del músculo más cercano (zonas de al menos 9×7 px).
- Coste: se dibuja bajo demanda. Respiración suave (hombros/pecho, periodo 4,8 s) a ≤15 fps solo durante `idleMs` tras
  montarse, volver a estar en pantalla o tocarlo; se apaga con un fundido y queda imagen fija (0 fotogramas, el bucle
  global se detiene). Fuera de pantalla (IntersectionObserver) no dibuja. `prefers-reduced-motion`: sin respiración ni
  transiciones de cámara.
- Cambios internos: `Body.glowCol(w)` opcional da el color de cada brillo (las animaciones de ejercicio no lo usan: siguen
  con `COL.glow`); cada overlay lleva `m` (músculo) y `drawOver` guarda `_vis` para el toque.

## Miniatura y reutilización entre repintados (API del motor, etapa 07)
- **Miniatura automática**: si el contenedor mide menos de 170×110 px (`MINI_W`/`MINI_H`), la instancia pasa a `inst.mini=true`:
  márgenes mínimos (`PADM`), sin HUD (músculos, fase, barra de fases), sin trayectorias ni indicaciones, contorno más fino
  (`MINI_OPT`). En miniatura el canvas no responde al toque (ni pausa ni gira): el toque es de la app (en GymTrack, ampliar).
  Tamaño mínimo del canvas 48×40 (antes 200×120).
- El bucle detecta también los cambios de **alto** del contenedor (antes solo el ancho) y reencuadra.
- `GymAnim.mountAll(root)`: un elemento que YA estaba montado (`_gaMounted`) y la app ha vuelto a insertar en el documento
  se **reactiva** (`revive`): vuelve al bucle y al IntersectionObserver con su misma instancia (giro `dyaw/dpitch`, pausa y
  fase intactos). Así la app puede sacar el `.ex-anim` antes de repintar y volver a ponerlo después.
- `GymAnim.refresh(el)`: reencuadra y repinta al momento tras cambiar el tamaño del contenedor (también con movimiento
  reducido, donde no hay bucle). Devuelve false si el elemento no tiene animación o no está en el documento.

## Cambiar de ejercicio en el mismo canvas (API del motor, etapa 10)
- `GymAnim.swap(el, key)`: cambia el ejercicio de un elemento **ya montado** sin crear otro canvas ni más escuchadores
  (misma instancia): la vista girada, la pausa y el encuadre vuelven al inicio y se reencuadra con el ejercicio nuevo.
  Actualiza `data-gym-anim` y el `aria-label`. Si el elemento aún no estaba montado, lo monta (como `mount`). Clave
  desconocida → `null` sin tocar nada; la misma clave → no hace nada. Con el elemento fuera del documento solo cambia el
  ejercicio: se reencuadra al volver (`mountAll` → `revive`). Con movimiento reducido pinta al momento la imagen fija nueva.
- Lo usa la tarjeta «HOY TOCA» de Inicio: al tocar un ejercicio de la lista cambia la vista previa en su sitio, sin repintar.

## Miniaturas (API del motor, etapa 11; caché por ejercicio y lectura perezosa, etapa 15)
```js
GymAnim.thumb(key,w,h,{fit:'scene'|'body',bg:null|'scene'|'#hex',dpr,q}) // → data URL (webp; png si no hay webp) o null; dibuja si no está en memoria
GymAnim.thumbCached(key,w,h,o)  // URL blob: si está EN MEMORIA, o null; nunca dibuja ni espera. Si no está, la pide a IndexedDB por
                                // adelantado (como mucho 24 por tanda) y, al llegar, la pone en los <img> de esa miniatura en «w»
GymAnim.thumbLazy(root)         // rellena los <img data-ga-thumb="key" data-gw data-gh [data-gfit="body"] [data-gbg]> de root
GymAnim.thumbReady()            // Promise: 'ok' | 'none' | 'pending' (IndexedDB aún abriendo tras 500 ms: se sigue sin ella)
GymAnim._.thumbStats() / _.thumbReset({idb, reopen, factory}) / _.thVer(spec) / _.thFp(spec) / _.thEngHash() / _.thConf / _.peakC(spec)
```
- Dibuja FUERA de pantalla el fotograma de máxima contracción (`peakC`: el final del paso con `p` máxima, el mismo de la
  imagen fija con movimiento reducido), sin HUD, trayectorias ni indicaciones. `fit:'scene'` encuadra como la animación
  (respeta `fitBox` y `cam.zoom`); `fit:'body'` recorta a la figura (iconos: el equipo que sobresale queda cortado).
  `bg:null` = transparente; `'scene'` = el fondo y el suelo del motor. Tamaño × devicePixelRatio (máx. 2).
- **Versión de cada miniatura** (`thVer`, etapa 15): huella del dibujo de ESE ejercicio (`thFp`: la escena de su fotograma de
  máxima contracción —piezas, medidas, colores, brillos de músculos— + cámara, fitBox, suelo y estilo) + `thEngHash` (código
  de proyección y pintado del motor —la lista `thEngFns`, con cada función de nivel superior a la que llama—, los vectores
  `V`, `COL` y la constante `TH_RVER`). Una función de pintado nueva se añade a `thEngFns`: el paso `thEngDeps15` del
  smoke recorre el código del motor y falla si una función llamada desde esa lista no está en ella. **No** entra `_.buildHash`: reconstruir con otro
  ejercicio cambiado, un comentario o código que no dibuja conserva las miniaturas; cambiar el dibujo de uno (su build, una
  pieza del kit que usa, su cámara…) invalida solo ese. Sube `TH_RVER` si cambias el dibujo de las miniaturas por algo que
  ni la escena ni esas funciones recogen. Cuesta ~0,4 ms por ejercicio (una vez por sesión, solo los que se piden).
- **Caché**: memoria (data URL + URL `blob:` para meterla en el HTML sin repintar 10 KB por imagen), solo lo pedido en la
  sesión y como mucho 160 entradas (salen las menos usadas que no tiene puestas ningún `<img>`; a las puestas se les suelta
  el data URL). **IndexedDB** `gymanim` v2 → almacén `th2` (clave `key|WxH@dpr|fit|bg`, valor `{f:2, v, d, t}`, índice `t`): se
  lee UNA entrada cada vez (`get`; las pedidas en la misma tarea, en una transacción), nunca entera. El almacén `thumbs` de
  la etapa 11 se borra al subir a la v2. Lo nuevo se escribe por lotes. Una vez por semana (marca `#sweep`) se borran, con
  cursores de claves (sin leer imágenes), las de ejercicios que ya no existen y las que no se usan en 60 días (`t` se
  refresca al leerla si tiene más de 7).
- **IndexedDB lenta, rota o bloqueada**: una miniatura espera a IndexedDB (abrir o leer) como mucho 500 ms (`TH_WAIT`) y
  después se dibuja sin ella; si la lectura llega luego y vale, se aprovecha. Abrir que falla o no responde en 8 s se
  reintenta 3 veces (a los 2, 4 y 6 s); lo dibujado mientras se guarda al abrir. Bloqueada por una pestaña con la versión
  vieja: se dibuja sin ella y sigue al desbloquearse. Si otra versión pide la base (versionchange), se cierra y se reabre.
  Sin IndexedDB: solo memoria y sin esperas.
- Carga perezosa (`thumbLazy`): las que ya están en memoria se ponen al momento; las que se ven (o están a menos de 200 px)
  se buscan en IndexedDB y, si no están, van a la cola de dibujo; el resto espera a un IntersectionObserver (margen 200 px;
  de respaldo, al desplazar cualquier lista se revisan las pendientes). La cola se procesa en tiempo libre
  (`requestIdleCallback`; sin él, `setTimeout`): al menos una miniatura nueva por tanda y más mientras sobren >10 ms. Estado
  en `data-ga-st`: `w` (en espera), `ok`, `x` (clave desconocida). Al cargar, la imagen recibe la clase `ga-on`.
- Pruebas: `_.thumbReset({reopen:true, factory})` cambia la fábrica de IndexedDB (una falsa, lenta o rota; `null` = la del
  navegador). `thumbStats()`: `gen` (dibujadas), `reads`, `idbHit`, `miss`, `stale` (otra versión), `late` (no llegó a
  tiempo), `prefetch`, `mem`, `evict`, `writes`, `opens`, `fails`, `blocked`, `swept`, `idb`. Prueba real con varias
  construcciones en el mismo origen: `node --experimental-websocket runs/15c/th_cdp.js`.
- Coste medido (Chrome headless, tiempo real): ~1,8 ms por miniatura dibujada; recargar 24 de IndexedDB ≈ 35 ms (0
  dibujadas); Entreno en frío 88 ms y desde IndexedDB 15 ms; las filas visibles del selector, de IndexedDB en ~23 ms.
