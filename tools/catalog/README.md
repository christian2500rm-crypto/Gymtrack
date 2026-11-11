# Catálogo de ejercicios

`catalog.json` es la fuente de la biblioteca de ejercicios (420 hoy): nombre, emoji, material, lugar, dificultad, patrón,
músculos, alternativas, alias y consejo de cada uno. La app no lo lee: lleva una fila compacta por ejercicio en `LIB_ROWS`.

## Cómo produce su bloque de la app

```bash
node tools/catalog/rows.js           # escribe src/js/app/catalogo-filas.js (LIB_ROWS con sus marcas LIB-ROWS:BEGIN/END)
node tools/build.js                  # monta index.html
node tools/catalog/rows.js --check   # sin escribir: catalogo-filas.js coincide byte a byte con catalog.json
```

En noviembre de 2026 (163050c) `rows.js` reproduce `src/js/app/catalogo-filas.js` byte a byte. Antes escribía en
`index.html` entre las marcas; ahora escribe ese fichero entero. El formato de las 19 columnas está al principio de
`rows.js` y lo lee `_parseLib` en `src/js/app/catalogo-lector.js`. Un comentario de `src/js/app/catalogo.js` aún nombra la
ruta antigua (`.claude/gymtrack-work/catalog/rows.js`): se puede corregir en cualquier cambio que ya toque `index.html`.

## Otras comprobaciones

- `node tools/catalog/animcheck.js tools/catalog/catalog.json`: cada ejercicio tiene animación en el laboratorio
  (`tools/lab`) con el mismo título y los mismos músculos, y se dibuja sin errores.
- El generador (`tools/gen`) lee también `catalog.json`: tras cambiarlo, monta GymGen otra vez (`node tools/gen/build.js`)
  porque lleva la lista de ejercicios unilaterales, y pasa su arnés.
