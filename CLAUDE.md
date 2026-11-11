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

Partes generadas por herramientas (no se editan en `src/`, sino en su herramienta, que reescribe su fichero):
- `src/js/anim/`: desde el laboratorio 3D. `GymAnim` no se toca sin el laboratorio.
- `src/js/gen/`: desde el prototipo del generador. `GymGen` no se toca sin su prototipo y su arnés, que comprueba que
  prototipo y app dan las mismas rutinas.
- `src/js/app/catalogo-filas.js` (`LIB_ROWS`): desde el catálogo `catalog.json`.

## Reglas

- No cambiar la clave `gymtrack_v3` de `localStorage` ni romper las migraciones: hay datos reales de usuarios.
- Textos de la app, comentarios y mensajes de commit en español de España.
- Un commit por mejora, con mensaje «Gymteca: …» como los del historial. Sin push salvo que el usuario lo pida: publicar
  es subir `main`, y lo decide el usuario.
- El repositorio se publica entero en la web: nada personal ni notas internas dentro (ni datos, ni capturas, ni salidas
  de pruebas). Las notas de trabajo van fuera del repositorio o en `.claude/`, que git ignora.
