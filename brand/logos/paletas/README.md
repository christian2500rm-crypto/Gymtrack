# Gymteca · Paletas de color (con Teca, la pesa)

Seis paletas para la app con el logo elegido, **05 · Teca**. Ábrelas en `index.html` con un servidor local (`npx serve .` desde la raíz y entra en `/brand/logos/paletas/`). La captura completa está en `captura-paletas.jpg`.

Cada paleta incluye:

- **Teca en sus colores:** `icono.svg`, `favicon.svg`, `logo-horizontal.svg` (fondo oscuro) y `logo-claro.svg`, más PNG de 1024 a 16 px.
- **Una maqueta de la app** (HOY TOCA, series con récord, descanso, volumen semanal y barra inferior) pintada con esos colores.
- **Los roles con el nombre de variable de la app** (`--bg`, `--bg2`, `--green`, `--amber`, `--blue`, `--red`…) y comprobación de contraste WCAG.
- **`paletas.css`**: cada paleta como bloque de variables listo para pegar en el `:root` de `index.html`.

## Las paletas

| # | Paleta | Marca | Idea |
|---|---|---|---|
| 00 | **Verde actual** | `#22c55e` | Referencia. Funciona, pero es el verde por defecto de Tailwind y se ve en muchas apps. |
| 01 | **Lima voltio** | `#c8f031` sobre grafito `#0e0f0c` | Evoluciona el verde actual hacia un lima eléctrico, como la cinta de agarre o la ropa de entreno. Récord en rosa `#ff6bd6`. |
| 02 | **Lámpara de biblioteca** | latón `#e8b84a` sobre verde botella `#1d5a3d` | Verde botella, latón y crema, como las lámparas de las bibliotecas clásicas. La más premium y la que mejor cuenta la «-teca». |
| 03 | **Discos de competición** | amarillo `#ffc81e` | Los colores oficiales de los discos: 25 rojo, 20 azul, 15 amarillo, 10 verde y 5 blanco. El amarillo es la marca y el resto colorea los gráficos. |
| 04 | **Tiza y menta** | menta `#4fe3c1` sobre verde azulado `#0b1514` | Calmada y limpia. Récord en coral `#ff8a65`. |
| 05 | **Violeta 20 kg** | `#8b5cf6` / acento `#a78bfa` | El morado de la kettlebell de competición de 20 kg, con rosa para los récords. La más distinta de las apps de gimnasio. |

**Contraste:** en todas las paletas, el texto, los botones y los colores de aviso, info, error y récord pasan **AA (≥ 4,5:1)** sobre el fondo y las tarjetas. Ajusté el azul y el rojo de «Discos» porque se quedaban en 4,4. Teca sobre su icono pasa el mínimo para gráficos (≥ 3:1) en todas. Las más justas son Lámpara (4,4) y Violeta (4,6), que por eso se ven algo más suaves como favicon.

## Recomendación

**Elegiría la 01 · Lima voltio.**

- **Migración sencilla:** es la evolución natural del verde actual. Los roles no cambian (el acento sigue siendo verde-lima y el texto sobre él, oscuro), así que la app no cambia de carácter.
- **Más propia:** deja de ser el verde genérico que comparten muchas apps.
- **Máxima visibilidad:** tiene el contraste más alto de todas (botón 14:1). Teca negra sobre lima destaca muchísimo en la tienda, en el avatar de @gymteca y en TikTok.
- **Récords en rosa:** al ser un color distinto del acento, el «¡Récord!» destaca más que el ámbar de ahora.

**Alternativa con más personalidad: la 02 · Lámpara de biblioteca**, si quieres que la marca hable de colección y biblioteca y suene más premium (útil para el plan Pro). Pierde algo de energía «gym», y el favicon es más suave.

**Idea que se puede usar con cualquiera:** los colores de **Discos de competición** (03) para los gráficos y para marcar series por peso. Es un código que cualquiera que vaya al gimnasio reconoce.

## Si se cambia la app (siguiente paso, no hecho)

He revisado `index.html` sin modificarlo. Antes de cambiar la paleta conviene convertir los verdes fijos en variables, porque hoy hay unos 68 valores escritos a mano:

- 17 × `#22c55e`
- 45 × `rgba(34,197,94,…)`
- 4 × `#16a34a`
- 2 × `#4ade80`

Además, habría que:

- Añadir `--accent-ink` (el texto sobre el botón) y `--pr` (el color de récord).
- Actualizar `theme_color`, los iconos y el favicon (hoy son SVG en línea con la mancuerna) y la web de `web/`.
