# Generador de rutinas (GymGen) y su prototipo

`sim/` es el prototipo en Node del generador de rutinas del cuestionario: `catalogo.js` (etiquetas de seguridad, presets
de material, placeCan), `menus.js`, `generador.js`, `textos.js` y `seguridad.js`, más las pruebas `personas.js` (personas
con lo que debe y no debe salir) y `matriz.js` (miles de perfiles con invariantes). La especificación es `30-algoritmo.md`.
La app lleva estos mismos módulos tal cual: lo que se cambie en el generador se cambia aquí, se prueba aquí y se monta.

## Cómo produce su bloque de la app

```bash
node tools/gen/build.js           # escribe src/js/gen/ desde sim/ (y la lista de unilaterales de tools/catalog/catalog.json)
node tools/build.js               # monta index.html
node tools/gen/build.js --check   # sin escribir: src/js/gen/ coincide byte a byte con el prototipo
```

En noviembre de 2026 (163050c) `build.js` reproduce `src/js/gen/` byte a byte (generador v11). Antes escribía en
`index.html` entre las marcas `GYM-GEN`; ahora escribe un fichero por módulo: `cabecera.js` abre una función que cierra
`exporta.js` (`window.GymGen`), así que solo compilan juntos. La cabecera generada conserva la ruta antigua del script
(`.claude/gymtrack-work/onboarding/gen/build.js`) para no cambiar `index.html`; se puede corregir en el próximo cambio de
GymGen. La opción `--solo-catalogo` (de la etapa E3a) ya no existe.

## Pruebas

```bash
node tools/gen/sim/personas.js --quiet                     # el prototipo: todas las reglas de las personas
node tools/gen/sim/matriz.js --out=<carpeta temporal>      # la matriz de perfiles (tarda; salida fuera del repositorio)
node tools/gen/arnes.js index.html personas --quiet        # las mismas pruebas contra el GymGen de index.html
node tools/gen/comparar.js <carpeta que dice el arnés>     # app y prototipo dan exactamente lo mismo
node tools/gen/comparar-matriz.js <arnés> <prototipo>      # lo mismo con dos pasadas de la matriz
node tools/gen/sum-matriz.js <carpeta> [<otra>]            # resumen de una o varias pasadas de la matriz
```

Por defecto `personas.js` y `matriz.js` escriben sus resultados (`*.json`, `revision-*.txt`) en `sim/`, que no se
versionan. Las versiones antiguas del prototipo (`sim/versiones/`, para `matriz.js --ver=N` y `--cat=N`) no se versionan.
Las etiquetas de seguridad del catálogo siguen **pendientes de revisión humana** (decisión D2, `REVISADO: false`).
