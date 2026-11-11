# Bitácora del reparto de index.html en src/

Noviembre de 2026. Objetivo: repartir el `index.html` escrito a mano en ficheros de fuentes **sin reescribir nada**, con un
montaje que genera el mismo `index.html` byte a byte, y versionar el kit de pruebas y herramientas.

## Pasos

- [x] **R1 · Fuentes y montaje.** `src/` (plantilla, manifiesto, CSS, `js/anim`, `js/gen`, `js/app`), `tools/build.js`,
  `.gitattributes` y `CLAUDE.md`.
- [x] **R2 · Pruebas versionadas** en `tools/test/`, de un solo comando (`bash tools/test/smoke.sh`).
- [x] **R3 · Laboratorio 3D, catálogo y prototipo del generador** en `tools/lab`, `tools/catalog` y `tools/gen`.
- [x] **R4 · Remates.** `robots.txt` excluye `/src/`, `/tools/` y `/CLAUDE.md` (y sigue `/brand/`); los dos comentarios
  de `index.html` con rutas `.claude/gymtrack-work/…` pasan a las de `tools/` (son las únicas líneas que cambian).

## Decisiones

- **Finales de línea.** En git, `index.html` siempre ha estado en LF (lo publicado es LF); el CRLF solo existía en las
  copias de trabajo de Windows por `core.autocrlf=true`. El reparto parte del blob LF de 163050c y todo `src/` va en LF.
  `.gitattributes` marca `/index.html`, `/src/**`, `/tools/**` y `/CLAUDE.md` como `-text`: git no convierte nada y el
  montaje sale igual en Windows, macOS o un clon limpio. `tools/build.js` se niega a montar si una fuente tiene CRLF.
  En una copia de trabajo antigua, `index.html` puede seguir en CRLF hasta que se monte o se vuelva a sacar de git.
- **Dónde se corta.** En los rótulos de sección del código (los recuadros `═══` y los `── … ──` de nivel superior). Cada
  fichero de `js/app/` compila por separado (`vm.Script`), lo que demuestra que ningún corte cae dentro de una función,
  un objeto o una plantilla; en el CSS, cada corte está fuera de cualquier regla (llaves a cero).
- **Bloques generados.** `js/anim/` se corta por las marcas `/* engine.js */`, `/* ex/….js */` y `/* build */` que ya
  pone el laboratorio: un fichero de `src/` por fichero del laboratorio (ya sin comentarios `//`, como los deja su
  montaje), y `firma.js` con la huella. `js/gen/` se corta por módulos del prototipo; `cabecera.js` abre la función que
  cierra `exporta.js`, así que esos ficheros solo compilan juntos. `LIB_ROWS` va solo en `js/app/catalogo-filas.js`,
  con sus marcas `LIB-ROWS:BEGIN/END`.
- **Tamaños.** La app queda en 25 ficheros de 52 a 1.981 líneas. Tres son pequeños a propósito, porque rodean a
  `LIB_ROWS` (`catalogo.js`, `catalogo-lector.js`) o son una pieza suelta (`fuentes.css`).
- **Manifiesto** en texto (`src/manifiesto.txt`), con una línea por fichero y un comentario de qué lleva cada uno.
- **Kit de pruebas.** `kit.js` (Node, sin dependencias) hace de servidor estático y lanza Chrome con los argumentos en
  una lista (sin pasar por el shell), así que funciona en Windows, macOS y Linux; los `.sh` son atajos con el uso de
  siempre. `smoke.js` se copió tal cual de la versión más reciente (la de M3b, con los pasos de M1, M2, M3 y M2b ya
  dentro): las fuentes sueltas de esos pasos y sus scripts de montaje no se versionan porque ya no hacen falta.
- **Página de siembra.** Vive en `tools/test/__seed.html` (no en la raíz) y abre la app con `../../index.html`; así no
  hay que copiarla a ningún sitio. Lleva una guarda: fuera de `localhost`/`127.0.0.1` no hace nada. `guarda.html` y
  `kit.js guarda` lo comprueban con un host ajeno resuelto a 127.0.0.1 y con `localhost` como control (y se probó que
  detecta una página sin guarda). La entrada de `.gitignore` pasa a `/__seed.html` (sin la barra
  ignoraba también la de `tools/test/`) y se queda por las copias antiguas en la raíz.
- **Fallos conocidos** en `sum.js`: se enseñan pero no hacen fallar `smoke.sh`; cualquier otro fallo, sí, y también una
  pasada sin RESULT (Chrome sin tiempo virtual por carga de la máquina: se repite una vez sola, avisándolo).
- **Herramientas (R3).** Copiadas de su versión más reciente (worktree objective-lewin-4ffc5f) solo las fuentes y la
  documentación: sin `shots/`, salidas de la matriz y las personas, `sim/versiones/`, scripts de un solo uso
  (`edit-e14*`, `sync-e13`, `add-e14*`, `revision-d2.js`) ni copias de catálogos antiguos. Antes de redirigirlas se
  comprobó, en copias, que las tres reproducían su bloque de 163050c byte a byte; ahora escriben su fichero de `src/` y
  tienen `--check`. Las salidas que aún escriben dentro de `tools/` están en `.gitignore`.

## Cómo retomar

1. `node tools/build.js --check` debe pasar y `git diff 163050c -- index.html sw.js manifest.webmanifest` no mostrar nada.
2. Ver qué paso falta en la lista de arriba y seguir por él.

## Pendientes

- En copias de trabajo ya existentes en Windows, `index.html` está en CRLF y, con `.gitattributes`, saldrá como
  modificado aunque no lo esté: `node tools/build.js` lo deja en LF, igual que en git.
- Revisión D2 de las etiquetas de seguridad del generador (pendiente de antes, `REVISADO: false`).
