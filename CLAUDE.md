# Gymteca

PWA de entrenamiento de gimnasio, en español de España, sin cuenta ni servidor: los datos viven en el `localStorage` del
móvil. Se publica en https://gymteca.app con GitHub Pages, que sirve tal cual la raíz de la rama `main` (hay `.nojekyll`):
`index.html`, `sw.js`, `manifest.webmanifest`, `assets/`, `CNAME` y `robots.txt`.

## `index.html` es un fichero generado

No se edita a mano. El código vive en `src/` y `tools/build.js` lo monta en un único `index.html`:

- `src/index.plantilla.html`: el esqueleto HTML con marcas `<!-- @incluye NOMBRE -->`.
- `src/manifiesto.txt`: qué ficheros van en cada marca y **en qué orden** (el orden importa; no es el alfabético).
- `src/css/`, `src/js/app/` (la app), `src/js/anim/` (motor 3D `GymAnim`) y `src/js/gen/` (generador `GymGen`).

Sin módulos ni envoltorios: los ficheros de un mismo `<script>` se concatenan y comparten el ámbito global (los
`onclick="…"` del HTML llaman a funciones globales). Para añadir un fichero, ponlo en el manifiesto en su sitio.

```bash
node tools/build.js           # monta index.html
node tools/build.js --check   # comprueba que index.html coincide con src/ (sin escribir)
```

Después de editar `src/`, monta y versiona `index.html` junto con `src/` en el mismo commit. Todo va en UTF-8 con LF y
`.gitattributes` impide que git convierta finales de línea en `index.html`, `src/` y `tools/`.

Partes generadas por herramientas (no se editan en `src/`, sino en su herramienta, que reescribe su fichero; cada
una tiene `--check` y un README):
- `src/js/anim/`: desde el laboratorio 3D, `node tools/lab/build.js`. `GymAnim` no se toca sin el laboratorio.
- `src/js/gen/`: desde el prototipo del generador, `node tools/gen/build.js`. `GymGen` no se toca sin su prototipo
  (`tools/gen/sim`) y su arnés, que comprueba que prototipo y app dan las mismas rutinas.
- `src/js/app/catalogo-filas.js` (`LIB_ROWS`): desde `tools/catalog/catalog.json`, `node tools/catalog/rows.js`.

## Pruebas

```bash
bash tools/test/smoke.sh
```

Con Node y Chrome basta (ruta de Chrome en la variable `CHROME` si no está en el sitio habitual). Comprueba el montaje,
arranca su propio servidor, pasa el smoke con datos sembrados y como usuario nuevo, y resume. Línea base: 299 pasos por
pasada y fallos conocidos de «Wrapped» que dependen de la fecha (ver `tools/test/README.md`). Toda mejora añade sus
pasos a `tools/test/smoke.js` y deja el smoke en la línea base antes del commit.

`tools/test/__seed.html` escribe datos de prueba con la clave real de la app y también se publica: su guarda (no hace
nada fuera de `localhost` y `127.0.0.1`) no se quita nunca, y el smoke comprueba que sigue funcionando.

## Reglas

- No cambiar la clave `gymtrack_v3` de `localStorage` ni romper las migraciones: hay datos reales de usuarios.
- Textos de la app, comentarios y mensajes de commit en español de España.
- Un commit por mejora, con mensaje «Gymteca: …» como los del historial. Sin push salvo que el usuario lo pida: publicar
  es subir `main`, y lo decide el usuario.
- El repositorio se publica entero en la web: nada personal ni notas internas dentro (ni datos, ni capturas, ni salidas
  de pruebas). Las notas de trabajo van fuera del repositorio o en `.claude/`, que git ignora.
