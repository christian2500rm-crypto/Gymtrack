# Pruebas de Gymteca

Necesitan Node y Google Chrome (o Chromium). Nada más: ni `npm install` ni un servidor aparte.

```bash
bash tools/test/smoke.sh        # o: node tools/test/kit.js smoke
```

Hace, en este orden: `node tools/build.js --check` (si `index.html` no coincide con `src/`, para), arranca un servidor
estático propio de la raíz del repositorio en un puerto libre, comprueba la guarda de `__seed.html`, pasa `smoke.js`
dos veces (con 6 meses de datos sembrados y como usuario nuevo) y resume pasos y fallos. Tarda unos minutos.

Línea base (noviembre de 2026, tras el bloque A del repaso del reparto y la mejora del Coach): **308 pasos por pasada** y estos fallos conocidos, que dependen de la fecha (el «Wrapped» del mes
en curso): con datos `wrapped14r1bFixes` y `cortes18`; usuario nuevo `wrapped14r1bFixes` y `menores16c`. No cuentan
como fallo. `entrenoDock16` puede fallar si la máquina está muy cargada: repite antes de buscar el error. Una
pasada que sale vacía (Chrome agotó el tiempo virtual, también por carga) se repite una vez sola; si vuelve a salir
vacía, cuenta como fallo. Mejor no pasar el smoke con otras tareas pesadas en marcha.

Desde la mejora visual, los pasos de siempre corren con tres cosas fijadas al principio de `smoke.js`: las filas de «Más detalle»
del Coach abiertas, todos los avisos de Inicio a la vista y las entradas animadas apagadas (miden pantallas y hojas recién
abiertas). El estado de serie de cada una lo cubren `b3Coach`, `b3Inicio` y `b3Movimiento`.

Desde la mejora del Coach hay una cuarta: el nivel con el que el Coach mide el progreso va fijado en «Empiezo» (`_coachLvPin='P'`),
porque los pasos de siempre montan sus casos con 4 sesiones y 3 semanas sin mejora. El nivel deducido, el elegido en «Tu nivel» y
sus umbrales los cubre `coachNivel`; los pasos de la mejora empiezan por `coach` (`coachAlLimite`, `coachTopesSeries`, `coachEscalera`…).

Variables de entorno: `PORT` (usar un servidor que ya sirve la raíz en `localhost:PORT`), `CHROME` (ruta de Chrome; por
defecto la habitual en Windows, macOS o Linux) y `VTB` (tiempo virtual de Chrome por pasada, en ms).

## Ficheros

- `kit.js`: servidor, Chrome y las órdenes `smoke`, `lanza`, `prueba`, `captura`, `guarda` y `servidor`.
- `smoke.sh`, `applaunch.sh`, `apptest.sh`, `appshot.sh`: atajos de `kit.js` con el uso de siempre.
  - `bash tools/test/apptest.sh "S.sessions.length" "&empty=1"`: ejecuta JS dentro de la app y muestra RESULT y ERRORS.
  - `bash tools/test/applaunch.sh fichero.js "&wait=600"`: lo mismo con un fichero grande (viaja comprimido en el
    fragmento de la URL, sin el límite de la línea de órdenes de Windows).
  - `bash tools/test/appshot.sh /tmp/x.png "S.tab='prog';render()" 2200`: captura a 390 px. Las capturas, fuera del repo.
- `smoke.js`: la prueba que recorre toda la app. Se ejecuta DENTRO de la app y devuelve `{paso: 'ok' | 'FAIL …'}`.
  Los pasos de cada mejora ya están dentro; los nuevos se añaden como `await safe('nombre', async()=>{…});` antes de
  `await safe('animsAll'`, que tiene que seguir siendo el último.
- `sum.js`: resume una salida guardada (`node tools/test/sum.js salida.txt`) y lleva la lista de fallos conocidos.
- `__seed.html`: siembra datos de prueba en `localStorage`, abre la app (`../../index.html`) en un iframe y ejecuta
  `?run=` dentro. Parámetros: `&empty=1`, `&fresh=1`, `&keep=1`, `&tab=`, `&w=`, `&h=`, `&wait=`.
- `guarda.html`: comprobación de la guarda (solo lee `localStorage`).

## La guarda de `__seed.html`

El repositorio se publica entero, así que `__seed.html` también está en `gymteca.app/tools/test/__seed.html`, en el
mismo origen que la app, y escribe con la clave real (`gymtrack_v3`). Fuera de `localhost` y `127.0.0.1` no hace nada.
`node tools/test/kit.js guarda` (y `smoke.sh`, antes de las pasadas) lo demuestra: abre `guarda.html` en un host ajeno
resuelto a 127.0.0.1 (`gymteca-prueba.test`), donde la siembra no puede escribir ni cargar la app, y en `localhost`, donde
sí escribe (así se sabe que la comprobación detecta una escritura de verdad). Si se toca la guarda, esa comprobación
tiene que seguir dando `ok`.
