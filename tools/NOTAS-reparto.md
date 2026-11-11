# Bitácora del reparto de index.html en src/

Noviembre de 2026. Objetivo: repartir el `index.html` escrito a mano en ficheros de fuentes **sin reescribir nada**, con un
montaje que genera el mismo `index.html` byte a byte, y versionar el kit de pruebas y herramientas.

## Pasos

- [x] **R1 · Fuentes y montaje.** `src/` (plantilla, manifiesto, CSS, `js/anim`, `js/gen`, `js/app`), `tools/build.js`,
  `.gitattributes` y `CLAUDE.md`.
- [ ] **R2 · Pruebas versionadas** en `tools/test/`, de un solo comando.
- [ ] **R3 · Laboratorio 3D, catálogo y prototipo del generador** en `tools/lab`, `tools/catalog` y `tools/gen`.

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

## Cómo retomar

1. `node tools/build.js --check` debe pasar y `git diff 163050c -- index.html sw.js manifest.webmanifest` no mostrar nada.
2. Ver qué paso falta en la lista de arriba y seguir por él.

## Pendientes

(se rellena al terminar)
