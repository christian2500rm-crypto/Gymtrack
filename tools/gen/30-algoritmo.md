# 30 · Algoritmo del generador de rutinas (especificación definitiva)

> Estado: **aprobada por el usuario el 6 nov 2026** (decisiones en §16 y en `30-propuesta-final.md` §M.0). **Sustituye a la sección E de `20-propuesta.md`** (E.0-E.16). Describe el algoritmo **tal como lo implementa el prototipo final** (`sim/`, versión **v11** = v10 más la protección de la prioridad de brazos en el último paso de tirón:empuje, que salió al probar D5; `generador.js`, `catalogo.js` v6, `menus.js`, `textos.js`, `seguridad.js`). Está comprobado con 23 personas (`personas.js`, las dos variantes de reparto) y con 4.200 perfiles más un bloque de seguridad de 1.500 (`matriz.js`, con y sin `--tope=no`), con **todas las invariantes duras a 0**.
> De dónde sale: §E de `20-propuesta.md` (paso 0), el diagnóstico (`44-diagnostico-algoritmo.md`), las revisiones de ciencia, código y requisitos (`41`, `42`, `43`), el juicio de entrenador (`45-juicio-entrenador.md`) y la ciencia (`05-ciencia-programacion.md`). Cada regla que cambió respecto a §E, con su motivo y su fuente, está en `40-simulacion.md` («Cambios a la especificación», 1-85); aquí se da la regla final.
> Decisiones del usuario (6 nov 2026): reparto `dias` por defecto (D1), modo corto (D3), `mayor4` (D4), pregunta para `topePrincipiante` (D5), `menor: tecnica` (D6), relleno (D7), dos sitios (D8), los 27 ejercicios nuevos antes de publicar (D9) y la revisión de las etiquetas por el usuario con una lista preparada (D2). Ver §16.

## Índice

0. Principios · 1. Entradas · 2. Perfil efectivo y modos · 3. Reparto · 4. Volumen · 5. Filtros (material y seguridad) · 6. Selección de ejercicios · 7. Series, repeticiones, esfuerzo y descansos · 8. Tiempo · 9. Calentamiento, equilibrio y cardio · 10. Equilibrios y protegidos · 11. Validaciones · 12. Semillas y «Otra propuesta» · 13. Explicaciones · 14. Salida · 15. Lo que tiene que cambiar el Coach · 16. Opciones y decisiones abiertas · 17. Métricas del prototipo · 18. Qué no se ha podido arreglar y por qué

---

## 0. Principios

| Principio | Cómo se cumple |
|---|---|
| **Función pura y determinista** | `genRoutine(respuestas, contexto)` no lee nada más; la misma entrada da la misma rutina (comprobado en 1.400 + 500 repeticiones). |
| **Catálogo y material reales** | Solo ejercicios del catálogo de 393 que la persona puede hacer **en el sitio de ese día** (gimnasio o casa, con su material guardado). |
| **Seguridad antes que todo** | Los filtros de seguridad son duros (§5); entre lo permitido, lo «con cuidado» pesa en contra (§6.2). Ninguna puntuación salta un filtro. |
| **Lo que pondría un entrenador** | La elección sale de **menús curados por hueco y clase de persona** (básicos según material y nivel, primero); la puntuación solo desempata dentro del escalón. |
| **Volumen según evidencia** | Series semanales por grupo con la cuenta fraccional de 05 §1.1 y los objetivos de 05 §1.2; techo y tope por sesión duros. |
| **El tiempo pedido, sin pasarse** | Presupuesto previo, ajuste a los minutos y relleno del tiempo sobrante; nunca por encima de lo pedido + 5 %. |
| **Explicaciones verdaderas** | Cada frase del «por qué» y de los avisos se construye con lo que hay en la rutina final; una lista de frases prohibidas no se dice nunca. |

Orden del proceso (§E.16 revisado): perfil efectivo → reparto (opciones y respaldo) → para cada opción y asignación de sitios: plantillas → huecos 1 (primero los levantamientos de fuerza) y huecos 2 → sustituciones (press de hombros, unilateral de 65+) → calentamiento, equilibrio y cardio → prescripción → tope de ejercicios y presupuesto de tiempo → volumen (o exprés / modo corto) → huecos 3 por déficit → ajuste al tiempo → relleno del sobrante → equilibrios finales → cardio que llena → motivos y avisos → orden en la sesión → validación → la mejor opción.

---

## 1. Entradas

Las respuestas del cuestionario (§C de `20-propuesta.md`) pasan por `desdeRespuestas`, que aplica los valores por defecto.

| Campo | Valores | Notas |
|---|---|---|
| `goal` | `musculo` · `fuerza` · `grasa` · `salud` · `aguante` | «Ganar músculo», «Ganar fuerza», «Perder grasa», «Salud y forma», «Aguantar más» |
| `exp` | `cero` · `lt6m` · `6m2a` · `gt2a` (+ `ritmo`: `semanas` · `meses`) · `paron` (+ `paron.antes`, `paron.fuera`: `2a6m` · `gt6m` · `gt2a`) | da el nivel (§2.1) |
| `levelManual`, `efectiva` | nivel elegido a mano en «Afinar» · `{sesiones, semanas}` registradas | nivel efectivo al regenerar (I-3) |
| `days` | 2-6 | días por semana que quiere entrenar |
| `min` | 15 · 20 · 30 · 45 · 60 · 75 · 90 | minutos por sesión |
| `consec` | sí/no | entrena días seguidos |
| `age` | `16` · `18` · `40` · `65` · `75` · `nd` | 16-17 · 18-39 · 40-64 · 65-74 · 75+ · «Prefiero no decirlo» |
| `screen` | `nada` · `enf` · `med` · `visto` · `superv` (varios) | enfermedad, medicación, visto bueno médico, supervisión |
| `huesos`, `posparto` | huesos frágiles · `alta` (posparto con el alta) | |
| `zones` | `rodilla` · `hombro` · `lumbar` · `muneca` · `cadera` · `otra`, cada una `ahora` · `antigua` · `op` · `reciente` | `reciente` = golpe, caída o tirón de las últimas 6 semanas o zona hinchada |
| `pref.floor`, `pref.impact` | «Mejor sin tumbarme en el suelo» · «Sin saltos ni impacto» | con valor por defecto visible y desmarcable (§2.2) |
| `sport` | `no` · `suave` · `piernas` · `agua` | deporte aparte |
| `prio` | hasta 2 de pecho, espalda, hombros, brazos, glúteos, piernas | |
| `style` | `igual` · `maq` · `libre` | máquinas o peso libre |
| `warm`, `cardioEnd`, `power` | calentamiento corto · cardio final `auto`/`si`/`no` · «Incluir ejercicios explosivos» | |
| `avoid` | ejercicios que no quiere | |
| `places` | `main` (`g` o `c`), `g` y `c`: cada uno `{preset, mats, acc, mach, card, dbMax, kb}` | material de cada sitio (9 presets y detalle) |
| `daysOther` | días en el segundo sitio | |
| contexto | `hist` (historial), `fav` (favoritos), `keep` (anclas), `alt` y `prev` («Otra propuesta») | |

---

## 2. Perfil efectivo y modos

### 2.1 Nivel y modos

| Respuesta | Nivel | Modos |
|---|---|---|
| Empiezo de cero | P0 | inicio |
| Menos de 6 meses | P | — |
| De 6 meses a 2 años | I | — |
| Más de 2 años · «Me cuesta semanas o meses» / «Casi cada semana» | A / I | — |
| Parón · antes < 6 meses | P0 | inicio |
| Parón · antes 6 m-2 a · fuera 2-6 meses / más de 6 meses | P / P0 | vuelta / inicio + vuelta |
| Parón · antes > 2 años · fuera 2-6 meses / más de 6 meses | I / P | vuelta |
| Parón · fuera **más de 2 años** | P0 | inicio (sin vuelta, I-4) |

- **Nivel efectivo** (I-3, al regenerar): P0 → P con 12 sesiones en 6 semanas o más (sin modo inicio); P → I con 48 en 26 o más; con su texto.
- **Edad**: `65`/`75` → **mayor** (`75` también mayor75); `nd` → **segmayor** (los filtros de 65+, C-14).
- **Prudente**: enfermedad o medicación marcadas, visto bueno o supervisión; «Prefiero no decirlo»; posparto con alta; **16-17 sin experiencia** (con experiencia, modo **menor**, §16).
- **Huesos frágiles** y **posparto** son modos propios (no prudentes por sí solos, salvo posparto).
- **Cauto** = inicio, prudente o mayor (esfuerzo «Fácil», series y descansos de cauto).
- **65+ con experiencia** (`mayorExp`, nivel I o A con 65+): nivel I para estructura y volumen, dificultad 2 en máquinas, Smith y mancuernas, 3 series en el principal y hasta 4 días (C-07).

### 2.2 Valores por defecto (visibles y desmarcables)

| Preferencia | Marcada por defecto con | Fuente |
|---|---|---|
| «Mejor sin tumbarme en el suelo» | 65 o más | I-11 |
| «Sin saltos ni impacto» | huesos frágiles, posparto y **cualquier zona** que duele ahora, operada o con lesión reciente | C-13, C-12, C-15, J-01 |

### 2.3 Días de pesas, dificultad, explosivos y clase de menús

| Concepto | Regla |
|---|---|
| **Días de pesas** (`wd`) | los pedidos; **3** con 65+, prudente o menor (16-17 con experiencia); **4** con 65+ con experiencia que pide 4 o más (opción `mayor4`); **4** con principiantes (P0/P) que piden 5-6 (C-21, opción `topePrincipiante`). Siempre con su texto y «Cambiar reparto» |
| **Dificultad máxima** | cauto 1; P0/P 1 (excepción de dificultad 2 en huecos sin otra opción, salvo «evitar» lumbar); I 2; A 3; menor ≤ 2; 65+ con experiencia: 2 en máquinas, Smith y mancuernas |
| **Explosivos** (`powerOk`) | solo si los pide, nivel I/A, sin prudente, sin filtros de 65+, sin huesos frágiles y **sin ninguna zona que duela ahora, operada o reciente** |
| **Modo corto** | 65+ o prudente con 15-20 min (C-17) |
| **Clase de menús** | **M** = 65+ y «Prefiero no decirlo» · **C** = inicio, prudente o huesos frágiles · **P** = principiante · **F** = «Ganar fuerza» I/A · **IA** = el resto. Cadena de respaldo: F → IA; M → C → P → IA |

---

## 3. Reparto

### 3.1 Plantillas (huecos por día)

Cada plantilla es una lista de huecos `[hueco, prioridad]` (1 = principal, 2 = secundario, 3 = accesorio que solo entra por déficit o relleno; entre corchetes, patrones añadidos).

| Plantilla | Huecos |
|---|---|
| **CCA** (cuerpo completo A) | SQ1 · PH1 · TV1 · HE2 · CO2 · RA3 · CU3 · TR3 |
| **CCB** | HI1 · PI1 [press de hombros] · TH1 · LU2 · RE2 · CO2 · TR3 · KF3 |
| **CCC** | SQ1 [zancada] · PH1 · TH1 [jalón] · KF2 [hip thrust] · PV2 [elevación] · CO2 · CU3 · CA3 |
| **T1** / **T2** / **T3** (torso) | PH1 · TH1 · PV2 · TV2 · RA2 · RE2 · TR3 · CU3 / TV1 · PI1 · TH2 · FL2 [press de hombros] · RA2 · RE3 · CU3 · TR3 / PH1 · TV1 · PV2 · TH2 · RA2 · RE3 · CU3 · TR3 |
| **P1** / **P2** / **P3** (pierna) | SQ1 · HI1 · LU2 · KF2 · CO2 · CA3 · HE3 / HE1 · SQ2 · LU2 · KF2 · CO2 · CA3 · KE3 / SQ1 · HE1 · LU2 · KF2 · CA2 · CO2 · KE3 |
| **E** (empuje) · **E1** · **E2** | PH1 · PV2 · PI2 · RA2 · TR2 · FL3 · TR3 · CO3 · (E2: PI1 · PV2 · FL2 · RA2 · TR2 · PH3 · TR3 · CO3) |
| **Ti** (tirón) · **Ti1** · **Ti2** | TV1 · TH1 · TH2 · RE2 · CU2 · **CO2 · CA2** · CU3 (Ti2: TH1 · TV1 · TV2 · …) |
| **Pi** (pierna) · **Pi1** · **Pi2** | SQ1 · HI1 · LU2 · KF2 · KE3 · CA3 (Pi2: HI1 · HE1 · SQ2 · KF2 · LU3 · CA3) |
| **TC** / **PC** (casa, fuerza con dos sitios) | TH1 · PI1 [press de hombros] · TV2 · RE2 · PV2 · RA3 · CU3 · TR3 / LU1 · HE1 · KF2 · HI2 · CA2 · CO2 |

Huecos: SQ sentadilla · LU zancada · HI bisagra · HE hip thrust o puente · KF curl femoral · KE extensión · CA gemelos · PH press plano · PI press inclinado · PV press de hombros · FL aperturas · TV jalón o dominada · TH remo · RA elevación lateral · RE hombro posterior · CU curl · TR tríceps · CO core · PW potencia · AB abductores · **RX** rotación externa · **EX** extensores de la espalda. Cada hueco exige su **músculo objetivo** (peso ≥ 0,8 en el catálogo; core ≥ 0,6); los huecos multiarticulares y los principales, solo multiarticulares.

Cambios de plantilla por persona: «Ganar fuerza» I/A usa `TPL_FUERZA` (CCB con PV1; CCC con PI1; T2 con PV1; P2 y Pi2 con HI1; E2 con PV1) y, con 2-3 entrenos que se repiten, `TPL_FUERZA_K2` (T1 con PH1 + PV1; E con PH1 + PV1); explosivos → PW2 al principio de CCA, P1, Pi y Pi1; prioridad glúteos → AB3 en los de pierna; **hombro que duele ahora → RA pasa a RX**; **huesos frágiles → EX2 cada día** (con más de 20 min); **prioridad de brazos → CU2 y TR2 en cada día de torso o cuerpo completo** (y el de su grupo en empuje o tirón), delante de los demás huecos 2; **fuerza con solo mancuernas de 20 kg o menos → SQ1 pasa a LU1**; 65+ y «Prefiero no decirlo» → el hueco LU es obligatorio (unilateral con apoyo; si ninguna plantilla lo tiene, se añade a la primera de pierna).

**Levantamientos de fuerza** («Ganar fuerza» I/A, no cautos): CCA sentadilla + banca · CCB peso muerto + militar · T1 banca (K2: banca + militar) · T2 militar · P1 sentadilla (K2: sentadilla + peso muerto) · P2 peso muerto · E banca (K2: + militar) · Pi sentadilla + peso muerto · E1 banca · E2 militar · Pi1 sentadilla · Pi2 peso muerto. Un levantamiento que es «con cuidado» de una zona que duele **ahora** deja de serlo (D-03). Sus huecos se llenan antes que nada y van los primeros en la sesión.

### 3.2 Tabla de reparto

**`recomendado`** (por defecto: 2-4 entrenos que rotan; lo que pide la ciencia, 05 §2.2):

| Caso | Reparto (entrenos) |
|---|---|
| 65+ o prudente | 2 días: CC A/B · 3 días: CC A/B/C con experiencia, CC A/B sin ella, **torso/pierna con días seguidos** (C-22) · 65+ con experiencia y 4 días: torso/pierna (2 entrenos, 4 sesiones) |
| 2 días | CC A/B |
| 3 días | días seguidos: torso/pierna; principiante o «Ganar fuerza» I/A: **CC A/B alternos** (A·B·A, luego B·A·B); si no, CC A/B/C |
| 4-5 días (de pesas) | principiante, «Ganar fuerza» I/A o «Salud y forma»: torso/pierna (2 entrenos); si no, torso/pierna ×2 (4 entrenos) |
| 6 días | principiante o salud: torso/pierna (2); si no, empuje/tirón/pierna (3); con 30 min o menos, torso/pierna (2 en fuerza, 4 en el resto) |
| «Ganar fuerza» I/A con **dos sitios** y 2 o más días de gimnasio | **`fz2`**: en el gimnasio, CC A (sentadilla + banca) y CC B (peso muerto + militar) **alternos**; en casa, TC (y PC con 2 días o más), accesorios (§3.4) |

**`dias`** (opción: tantos entrenos distintos como días de pesas, B-1): 2 → CC A/B · 3 → CC A/B/C; con días seguidos, torso/pierna/CC-B (con 65+ o prudente, torso/pierna de 2 entrenos, C-22) · 4 → torso/pierna ×2 · 5 → **torso/pierna/empuje/tirón/pierna** (principiantes: torso/pierna ×2 + CC) · 6 → **empuje/tirón/pierna ×2 con gemelas distintas** (E1/E2, Ti1/Ti2, Pi1/Pi2; principiantes: torso/pierna ×3). Las gemelas «ligeras» (T2, P2, E2, Ti2, Pi2) de un intermedio o avanzado llevan sus principales como secundarios (rango algo más alto).

**Cadena de respaldo** (solo por una validación dura o un hueco 1 vacío —«el material no da»—; nunca por avisos blandos, y nunca a cuerpo completo con días seguidos salvo 65+ y prudentes): `recomendado`: E/Ti/P → T/P ×2 → T/P → CC A/B/C → CC A/B. `dias`: cada reparto baja a los de menos entrenos (6: E/Ti/P ×2 → E/Ti/P → T/P ×2 → T/P → CC…). En `dias`, si el material no da para K entrenos distintos (hueco 1 vacío, con respaldo de otro patrón, con una rareza o, con 4-6 entrenos, **repetido de otro día**), K baja y se dice («Con tu material no salen 6 entrenos distintos…»).

### 3.3 Frecuencia por entreno

Cada entreno lleva **`f` = veces por semana que se hace** (con un sitio: días de pesas ÷ entrenos). El volumen semanal, V5, V8, tirón:empuje, rodilla:cadera, el freno y el relleno la usan. En `fz2`, los dos del gimnasio llevan días de gimnasio ÷ 2 (1,5 con 3 días) y los de casa, días de casa ÷ los entrenos de casa. Con 3 días y 2 entrenos (CC A/B, torso/pierna), la semana **alterna** (A·B·A, luego B·A·B). La salida da `meta.fd` por día y `meta.alternas`.

### 3.4 Dos sitios

- Con un segundo sitio (`daysOther` días), el número de entrenos que van a ese sitio debe ser entero (días del segundo sitio × K ÷ días de pesas); si no, se usa el reparto de `dias` para esos días de pesas.
- Se construyen **todas** las asignaciones de entrenos a sitios y gana la de mejor calidad: huecos 1 vacíos (+10), con respaldo de otro patrón (+5) o con una rareza (+3), el escalón de cada elección (los huecos 2, × 0,3), **levantamiento de fuerza perdido** (+5, también si su hueco ya no existe) y día solo de pierna en una casa sin barra y rack teniendo gimnasio (+6). A diferencias de menos de 1,5, la gemela «ligera» va al segundo sitio (§E.2).
- **`fz2`** («Ganar fuerza» I/A, `recomendado`, 2 o más días de gimnasio): sitios fijos (gimnasio: CC A y B; casa: TC y PC), que garantizan cada levantamiento 1,5 veces por semana con 3 días de gimnasio (J-10, C-06).

---

## 4. Volumen

### 4.1 Grupos y cuenta

Para **planificar**, 12 grupos: pecho, espalda, hombro anterior, **hombro lateral**, **hombro posterior**, bíceps, tríceps, abdomen, cuádriceps, isquios, glúteos, gemelos (el deltoides por cabezas, C-05; lo que ve la persona, los 10 grupos de la app). Cuenta **fraccional por patrón** (05 §1.1): una serie cuenta 1 en el grupo directo del patrón y 0,5 en los indirectos:

| Patrón | Directo (1) | Indirecto (0,5) |
|---|---|---|
| Press horizontal | pecho | tríceps, hombro anterior |
| Press vertical | hombro anterior | hombro lateral, tríceps, pecho |
| Jalón y remo | espalda | bíceps, hombro posterior |
| Sentadilla y zancada | cuádriceps | glúteos |
| Bisagra | isquios y glúteos | — |
| Hip thrust | glúteos | isquios |
| Hombro posterior | hombro posterior | espalda |
| Curl femoral, extensión, gemelos, aperturas, elevaciones, curl, tríceps, core | su grupo | — |

El catálogo solo decide si el músculo está (peso ≥ 0,6 directo; 0,3-0,6 la mitad) y el músculo principal de un ejercicio (≥ 0,8) cuenta 1 aunque el patrón no lo liste (fondos y press cerrado → tríceps). Volumen semanal = Σ series × f × peso.

### 4.2 Objetivos, rangos, techo y tope

| Grupo | Base P · I · A (series/semana) |
|---|---|
| Pecho | 8 · 11 · 13 |
| Espalda | 9 · 12 · 14 |
| Hombro lateral | 5 · 7 · 8 |
| Hombro posterior | 7 · 9 · 11 |
| Bíceps / tríceps | 4 · 6 · 8 |
| Abdomen | 3 · 5 · 6 |
| Cuádriceps | 8 · 11 · 13 |
| Isquios | 7 · 10 · 12 |
| Glúteos | 8 · 12 · 14 |
| Gemelos | 2 · 4 · 6 |

- **Objetivo** = base × objetivo (músculo 1 · fuerza 0,75 · grasa 0,9 · salud 0,65 · aguante 0,85; con 65+, como mucho 0,65; 65+ sin experiencia usa la base P y con experiencia la de I) × 0,75 en P0 × **1,25 prioritario** × 0,8 en pierna si hace deporte de piernas; los grandes, como poco 4. El hombro anterior no tiene objetivo (solo indirecto, 05 §5.3).
- **Lo alto del rango** (`top`) = máx(objetivo × 1,3 —× 1,5 prioritario—; objetivo + 2).
- **Relleno largo** (`topR`, intermedio o avanzado sin precaución con **60 min o más**) = objetivo × 1,4 (I) o × 1,5 (A), +0,15 prioritario: la parte alta del rango objetivo de 05 §1.2 (I 10-16, A 12-20), sin pasar del techo.
- **Techo semanal** (V8, duro, en fraccionales por grupo): P0/P 12 · I 18 · A 20; prioritarios × 1,2 (A: 24).
- **Tope por sesión** (V9, duro): 10 series fraccionales por grupo y sesión.

### 4.3 Cómo se llega al volumen

1. **Déficit** (de mayor a menor; los pequeños solo con más de 1,5): (a) encender un hueco 2-3 apagado de ese grupo (solo con más de 1,5 de déficit), (b) +1 serie al ejercicio con más peso en el grupo y menos series, (c) un hueco de **reserva** (pecho: PI, PH, FL · espalda: TH, TV · cuádriceps: KE, SQ, LU · glúteos: HE, AB · isquios: KF · hombro lateral: RA · posterior: RE · bíceps: CU · tríceps: TR · gemelos: CA · abdomen: CO; una reserva no repite un hueco que ya está en el día); principiantes y cautos, primero series (b) y como mucho 2 ejercicios distintos por grupo y semana. Todo lo que se añade **tiene que caber** en los minutos (sin el cardio final, salvo «Perder grasa») y en V8/V9; un empuje solo si tirón:empuje sigue ≥ 1 (si no, antes una serie o un hueco de tirón).
2. **Freno** (C-03): un grupo grande por encima de lo alto del rango baja 1 serie en un ejercicio donde es **directo** (primero los que no son hueco 1; un hueco 1 nunca por debajo de su arranque salvo con f ≥ 2); lo indirecto no quita básicos.
3. **V8 y V9**: −1 serie (mínimo 2) al que más aporta, primero fuera del hueco 1; si no basta, se apaga un accesorio o un secundario (nunca un hueco 1, un obligatorio ni lo que rompa V5).
4. **Relleno del tiempo sobrante** (§8.6) hasta `top` (I/A), `topR` (I/A con 60 min o más), objetivo × 1,15 (principiantes y cautos) o nada (inicio).

---

## 5. Filtros (material y seguridad)

### 5.1 Material (`placeCan`)

Un ejercicio se puede hacer en un sitio si su material está en el sitio (o un material alternativo: kettlebell por mancuerna en 17 ejercicios; remo invertido en la barra baja de un parque o en una barra con rack), sus accesorios también (banco, banco inclinado, rack, landmine, poleas dobles, mesa…), la máquina es de una familia que tiene el sitio (13 familias) y el cardio, de un tipo que tiene (9 tipos); en un gimnasio no salen ejercicios «solo de casa».

### 5.2 Seguridad (duros; un ejercicio que no pasa no sale nunca)

| Regla | Qué queda fuera |
|---|---|
| Lista de riesgo | 17 ejercicios (jalón tras nuca, remo al mentón, buenos días con barra, sentadilla sissy, cargadas y arrancadas, thruster…) |
| «No quiero» | lo que la persona evita |
| Explosivos | saltos y ejercicios de cuerpo entero sin `powerOk` (§2.3) |
| Zona marcada (cualquier tipo) | lo que el catálogo marca «evitar» (2) para esa zona |
| Zona operada o con lesión reciente | también lo «con cuidado» (1) de esa zona; la zona deja de pedirse en V5 y el recorte no la protege |
| «Sin saltos ni impacto» | impacto 2 (saltos, carrera, comba, burpees…) |
| 65+ y «Prefiero no decirlo» | impacto 2, saltos, dificultad 3, **flexión o giro de columna con carga** (16 ejercicios), **unilateral de pie con carga en las manos**, hip thrust con barra, **todo lo colgado** de una barra (dominadas, negativas, con banda, elevaciones colgado) |
| Huesos frágiles y posparto | flexión o giro de columna con carga; huesos frágiles, también sin carga (9: crunch, giros, elevaciones de piernas…) y **remos sin apoyo** (con barra, inclinado con mancuernas, en T, Meadows, Smith, renegado, mochila) |
| Prudente | dificultad 3, explosivos y HIIT |
| **Hombro que duele ahora** | todo empuje vertical **salvo el landmine**, lo colgado, la **barra en la espalda** (sentadilla trasera, frontal, en Smith, zancadas y gemelos con barra), fondos, dominadas asistidas, elevaciones laterales y frontales |
| **Rodilla que duele ahora** | sentadilla con barra, frontal, hack, péndulo, Smith, cinturón y landmine; búlgaras; zancadas largas, caminando, laterales o con carga; sentadillas sumo |

Etiquetas del catálogo que lo hacen posible (propuestas para la revisión humana de §K.2): `lim` por zona y carga (2 evitar, 1 con cuidado), con la **compresión** de la columna incluida (hack, péndulo, Smith, hip thrust con barra y todo salto con lumbar ≥ 1) y el hombro en la barra a la espalda y en lo colgado; `spine` (16), `spineFlex` (9), `suelo`, `colgado`, `hombroAhoraFuera`, `rodillaAhoraFuera`, `zancadaLarga`, `remoSinApoyo`, `excentrico`, `axialManos`, `extensores`.

### 5.3 Dificultad, suelo y repetición

- **Dificultad**: §2.3 (en un segundo pase, la excepción de dificultad 2 para principiantes, +1 escalón).
- **Suelo con «sin suelo»**: un ejercicio de suelo solo en un hueco 1, en el core o el hombro posterior protegidos, en el unilateral obligatorio o en los extensores, y siempre con su aviso; en un secundario o un accesorio, el hueco se queda vacío. Además pesa +5,5 escalones (§6.2) y, si en el hueco queda **cualquier** candidato sin suelo que no sea «con cuidado» de una zona que duele ahora, el suelo no sale aunque ese candidato sea peor o se repita en la semana: la nota «Pide tumbarse: no había otra opción» siempre es verdad (J-12). La variante rápida del ajuste al tiempo nunca es de suelo.
- **Unicidad**: un ejercicio **no se repite en el mismo día**; en la semana puede repetirse en otro día con +1,25 escalones (gana a una variante 2 escalones peor, al suelo y a lo «con cuidado» de una zona que duele; pierde ante otra igual de buena).

---

## 6. Selección de ejercicios

### 6.1 Menús por hueco y clase (la tabla de básicos)

Cada hueco tiene, por clase de persona, una lista de **escalones** (ejercicios equivalentes dentro de cada escalón; los de un escalón posterior solo salen si no queda ninguno anterior posible). El menú de un hueco = sus escalones + los de su patrón secundario + los de los patrones añadidos en la plantilla + (como último recurso, con aviso «En lugar de…») su respaldo de otro patrón; una clase hereda al final los escalones de las más prudentes (IA ← P ← C), nunca al revés ni en 65+. Las **rarezas** (lista `STD_C` de `menus.js`) van al final de cada menú. Primeros escalones (fuente completa: `sim/menus.js`):

| Hueco | IA (intermedio y avanzado) | F («Ganar fuerza» I/A) | P (principiante) | C (inicio, prudente, huesos frágiles) | M (65+, «Prefiero no decirlo») |
|---|---|---|---|---|---|
| SQ sentadilla | sentadilla con barra · hack, prensa | sentadilla con barra · frontal | goblet, prensa · Smith, sentadilla con mancuernas | prensa · goblet, Smith | prensa · goblet, Smith |
| LU zancada | búlgara, zancada atrás o estática con mancuernas | ídem | estática, atrás, subida con mancuernas | estática con mancuernas, subida y zancada atrás sin peso | **subida al banco y zancada atrás sin peso** (con apoyo) |
| HI bisagra | rumano con barra · rumano con mancuernas, peso muerto, hexagonal | peso muerto · rumano, hexagonal | rumano con mancuernas · hexagonal | rumano con mancuernas · hexagonal | rumano con mancuernas · hexagonal |
| HE glúteo | hip thrust con barra o máquina | ídem | hip thrust en máquina, con mancuerna o barra | hip thrust en máquina · con mancuerna, puente | hip thrust en máquina, patada en máquina · patada en polea |
| PH press plano | banca, press con mancuernas · máquina, Smith | banca · mancuernas, Smith | máquina, mancuernas, banca | máquina · mancuernas, Smith · banca · **flexiones inclinadas o press con banda de pie** · press en el suelo | como C |
| PI press inclinado | inclinado con mancuernas o barra · máquina, Smith | inclinado con barra · mancuernas, Smith | máquina, mancuernas | máquina · mancuernas, Smith | como C |
| PV press de hombros | militar con barra, con mancuernas · máquina, Smith, Arnold | militar · mancuernas, Smith | máquina, mancuernas · Smith | máquina · mancuernas, Smith | como C |
| TV jalón | dominadas, jalón · supinas, neutras, cerrado | ídem | jalón, asistidas · cerrado, supino, con banda | jalón · asistidas, cerrado, supino · con banda (**sin negativas ni dominadas con banda**) | jalón · cerrado, supino · con banda (nada colgado) |
| TH remo | polea, barra, mancuerna · máquina, T apoyado, inclinado | remo con barra · Pendlay, polea, mancuerna | polea, máquina, mancuerna | polea, máquina · inclinado apoyado, T apoyado, mancuerna | polea, máquina · apoyado · … · banda · TRX · **invertido y bajo una mesa al final** |
| KF curl femoral | sentado, tumbado · de pie, polea | ídem | ídem | ídem | solo máquina o polea (si no, la bisagra del día) |
| CO core | plancha, Pallof, elevación colgado · lateral, rueda, dead bug | plancha, colgado, rueda, Pallof · paseos | plancha, dead bug, Pallof | dead bug, plancha, Pallof | **Pallof · paseo de maleta · dead bug, plancha, lateral** (sin flexión ni giro con carga) |
| RA · RE · CU · TR | elevaciones laterales · face pull, contractora inversa, pájaros · curl · polea de tríceps, sobre la cabeza | ídem | ídem | máquinas primero; sin fondos en banco ni flexión diamante | como C |
| PW potencia | salto al cajón, sentadilla con salto · patinador, zancada con salto | ídem | — | — | — |
| RX rotación externa | rotación externa en polea o con banda · face pull · Y-T-W | ídem | ídem | ídem | ídem |
| EX extensores | extensión lumbar en máquina, banco romano · Y-T-W boca abajo, bird dog | ídem | ídem | ídem | ídem |

### 6.2 Escalón efectivo y desempate

Escalón efectivo = escalón del menú + ajustes (gana el menor):

| Ajuste | Escalones |
|---|---|
| «Con cuidado» (lim 1) de una zona que duele **ahora** / antigua | +2 / +0,5 |
| De la lista «amable» de una zona marcada (8 por zona) | −2,5 si duele ahora; si no, −0,5 |
| Impacto 1 con «sin saltos ni impacto» | +1 |
| Suelo con «sin suelo» | +5,5 (y fuera, +100, si queda un candidato sin suelo que no sea «con cuidado» de una zona que duele ahora) |
| Espalda operada o reciente: sentadilla, zancada o paseo con peso en las manos | +6 |
| Posparto: plancha frontal o rueda | +3 |
| Inicio, prudente y 65+: «evitar» de otra zona no marcada | +1,5 |
| 65+: barra libre en un hueco 1 | +3 |
| Estilo (máquinas o peso libre) | −1 (65+: −0,5) |
| Favorito · historial (3 o más veces) · ancla | −1 · −1 · −3 |
| Dificultad 2 por excepción (segundo pase) | +1 |
| «Ganar fuerza» con mancuernas ligeras: bisagra principal a una pierna | −1,5 |
| **Ya está en otro día de la semana** | +1,25 |

Desempate dentro del escalón: mismo patrón en el día −0,8 · mismo patrón y material otro día −0,8 · misma familia de máquina en el día −0,5 · unilateral con 45 min o menos −0,6 · barra con 30 min o menos −0,6 · cauto y máquina, polea o Smith +0,5 · «con cuidado» de alguna zona −0,5 · estilo +0,6 · favorito +0,5 · historial reciente +0,3 · fuera del hueco 1, grupo prioritario +0,5 (+0,3 si es «estirado») · «estirado» +0,1; después, el orden del menú.

### 6.3 Reglas del día

Como mucho 2 ejercicios del mismo patrón por día (el core aparte) y 2 de la misma familia de máquina; en cuerpo completo, una reserva o un accesorio no repite un patrón que ya está; el remo bajo una mesa, solo como último recurso (en un hueco secundario, no si la semana ya tiene 2 tirones); el hueco obligatorio de 65+ solo admite un unilateral de pierna; un press de hombros imposible se sustituye por un press inclinado (o plano). Orden de llenado: levantamientos de fuerza → huecos 1 de todos los días → huecos 2 → (después del volumen) huecos 3 por déficit, primero los de grupos prioritarios.

---

## 7. Series, repeticiones, esfuerzo y descansos

### 7.1 Repeticiones (valor objetivo por papel)

| Objetivo | Nivel | Principal · secundario · aislamiento · pequeños |
|---|---|---|
| Ganar músculo | P · I · A | 12·12·12·15 · 10·12·12·15 · 8·10·12·15 |
| Ganar fuerza | P · I · A | 8·10·10·15 · 6·8·10·15 · 5·6·10·15 |
| Perder grasa | P · I/A | 12·12·12·15 · 10·12·12·15 |
| Salud y forma | todos | 12·12·12·15 |
| Aguantar más | todos | 15·15·20·20 |
| Cautos (inicio, prudente, 65+) | — | 12·12·12·15 |

Papel: principal = hueco 1 (en una gemela ligera, el que no es levantamiento pasa a secundario); secundario = multiarticular en hueco 2-3; aislamiento; pequeños = elevaciones, hombro posterior, gemelos, core, abductores, paseos. Ajustes, en este orden:

| Caso | Repeticiones |
|---|---|
| Isométricos · distancia | segundos (cauto 20; P 30; I 40; A 45) · la del catálogo |
| Bandas, minibandas, TRX | las del catálogo |
| **Excéntricos** (negativas, nórdico, pistol) | las del catálogo (3-5 lentas; pistol 4-6), **2 series** |
| Peso corporal | máx(8, …) |
| Con carga y rango de 6 o menos | solo si el ejercicio admite rango pesado (bilateral con barra, Smith o máquina, o press con mancuernas); si no, 8 |
| **Mancuernas o kettlebell de 20 kg o menos, I/A** | como poco 15 (12-15) en pierna y bisagra con las dos piernas, 10 (8-10) a una pierna, 12 (10-12) en remos y 10 (8-10) en presses |
| **16-17 con experiencia** | como poco 8 (nunca 6 o menos) |
| «Con cuidado» de una zona que duele ahora | como poco 10 (8-10) y 3 series como mucho |
| **Hombro que duele ahora** | todos los empujes, como poco 10 y 3 series como mucho |
| **Espalda operada o reciente** | press de hombros con peso libre: 10 (8-10), sentado con respaldo |
| Potencia (PW) | 3 (3-5) rápidas, 2 series, descanso de fuerza |

**Rangos que se muestran** (solo los de 05 §3.2): multiarticulares 3-5 · 4-6 · 6-8 · 8-10 · 10-12 · 12-15 · 15-20 según el valor objetivo (≤ 5, 6, ≤ 8, ≤ 10, ≤ 12, ≤ 15, más); aislamientos 10-12 · 12-15 · 15-20; peso corporal 3-5 · 8-12 · 12-15 · 15-20.

### 7.2 Series

| Caso | Series de arranque |
|---|---|
| Intermedio o avanzado sin precaución, con 45 min o más | principal 3 (avanzado con 60 min o más, 4) · secundario multiarticular 3 desde 60 min (2 con 45) · aislamientos y pequeños 2 |
| El resto (inicio, principiantes, prudentes, 65+, 30 min o menos) | 2 (65+ con experiencia: el principal hasta 3) |

| Máximo por ejercicio (lo que pueden subir el volumen y el relleno) | Series |
|---|---|
| Inicio · 65+ sin experiencia | 2 (el Coach propone 3 al cerrar el primer ciclo) |
| 65+ con experiencia | principal 3, resto 2 |
| Principiante (P0/P) | 3 |
| Intermedio | principal 4, resto 3 |
| Avanzado | 4 |
| Siempre | **4 por ejercicio y sesión**; excéntricos 2; «con cuidado» con dolor ahora y empujes con el hombro doliendo 3 |

### 7.3 Esfuerzo (`meta.effort`)

| Persona | Objetivo | Dejando | Subidas |
|---|---|---|---|
| Inicio, prudente, 65+ | «Fácil» | 3 o más | lentas (un salto simple como mucho por semana y ejercicio) |
| Principiante · 16-17 con experiencia | «Justo» | 2-3 | normales |
| Intermedio y avanzado | «Justo» | 1-2 | normales |

Nunca «al límite en la última serie». En la barra, «Nunca al límite en la barra»; con prudente o 65+, «Respira durante el esfuerzo: no aguantes el aire» en los principales con peso.

### 7.4 Descansos

Base (aislamiento · multiarticular · pesado), × 0,85 en P0/P, × 1,1 en A, redondeado a 15 s: fuerza 90 · 150 · 180 (con «Ganar fuerza», el multiarticular de 7-12 usa el de hipertrofia, 120) · músculo 75 · 120 · 150 · grasa 60 · 105 · 120 · salud 60 · 90 · 120 · aguante 45 · 75 · 90. Suelos: 60 · 90 · 120 (aguante 45 · 60 · 120; exprés y modo corto, 75 en multiarticular y pesado). Con prudente o 65+, +15 s (en el multiarticular, sin pasar de 2:15).

| Serie | Descanso |
|---|---|
| Potencia · hasta 6 repeticiones con carga | pesado |
| Multiarticular con carga de 7 a 20 | multiarticular |
| Aislamiento | aislamiento |
| **Peso corporal sin lastre, bandas, TRX, paseos** (y dominadas o fondos de quien empieza, cautos o a una pierna) | **75-90 s** (60 en «Aguantar más»; +15 con prudente o 65+) |

**Aproximación** (en el tiempo): 4 min en el primer básico de fuerza en rango pesado; 150 s en el primer multiarticular con carga; 60 s en el exprés y el modo corto; nada en inicio, prudente y 65+.

---

## 8. Tiempo

### 8.1 Estimación

Minutos del día = calentamiento + equilibrio + Σ ejercicios + cardio final. Ejercicio = transición (120 s con barra o rack; 60 s si no) + aproximación + series × trabajo × (2 si es unilateral) + (series − 1) × descanso; trabajo = media del rango × 3,5 s + 12 s (isométricos: segundos + 12; distancia: 45 s).

### 8.2 Tope de ejercicios y presupuesto previo

- **Tope por sesión**: inicio 5 · 65+ con experiencia 7 · principiante o cauto 6 · I/A 8; y como mucho 3 · 4 · 5 con 15 · 20 · 30 min. Con **prioridad de brazos** (más de 20 min), uno más.
- **Presupuesto previo**: lo que no cabe ni con 2 series y los descansos en su suelo (calentamiento y equilibrio incluidos) sale antes del volumen, empezando por el día más largo. Se apagan huecos 2-3 por este orden: accesorios, lo que otro día de la semana ya cubre, el resto (core, elevaciones, aperturas, extensión, gemelos, curl, tríceps, abductores, hombro posterior, curl femoral, jalón, remo, presses, hip thrust, zancada, sentadilla, bisagra, press plano); nunca un hueco 1, uno obligatorio, uno fijo (extensores), el último core de la semana (con más de 20 min), lo que deje una familia por debajo de V5 o descuadre tirón:empuje o rodilla:cadera; el hombro posterior protegido con 6 o más series de empuje y el **trabajo directo de una prioridad de brazos**, los últimos.

### 8.3 Exprés (15 min) y modo corto (65+ o prudente con 15-20 min)

Exprés: 3 ejercicios de 2 series por día; en días de cuerpo completo, rodilla o cadera (según lo que lleve la semana; 65+, el unilateral obligatorio), un empuje y un tirón; en torso o pierna, uno de cada familia del día y el tercero, el que equilibra la semana (si no hay de la familia que falta, un neutro antes que la contraria). Si los elegidos no caben, el más lento deja su sitio a otro **de su familia** que quepa. Modo corto: 5 min de calentamiento (no se recortan), equilibrio en la sesión con 20 min o «en casa» con 15, y 2 (15 min) o 3 (20 min) ejercicios de 2 series; en esos modos V4 ≥ 2 y V5 ≥ 1 por familia.

### 8.4 Ajuste a los minutos

Mientras un día pase de los minutos pedidos, por orden: (1) descanso de aislamiento −15 s (toda la rutina); (2) cardio final a 10 min; (3) cardio final fuera (con «Perder grasa», antes se quitan accesorios); (4) accesorios a 2 series; (5) descanso de multiarticulares y pesados −15 s, hasta su suelo; (6) fuera accesorios y **explosivos**, el último primero; (7) calentamiento de 5 a 3 min (nunca con 65+ ni en el modo corto); (8) secundarios a 2 series; (9) fuera un secundario si otro día cubre su patrón (con 20 min o menos, sin descuadrar rodilla:cadera; el core puede salir el primero, con aviso); (10) principales a 2 series. Si aún no cabe, el ejercicio más lento (unilateral o con barra) se cambia por la variante más rápida de su hueco y **de su familia** (nunca de suelo con «sin suelo», nunca los extensores). Se acepta hasta +5 % como tolerancia de la estimación; por encima, el aviso «Tu Día X dura unos N min…».

### 8.5 Relleno del tiempo sobrante

En cada día, mientras sobre minuto y medio: +1 serie (primero lo que está por debajo de su objetivo; después principales, secundarios, accesorios) o un accesorio nuevo de 2 series del grupo de su zona con más sitio (primero un hueco de la plantilla, si no, uno de reserva), hasta lo alto del rango (`top`; I/A con 60 min o más, `topR`; principiantes y cautos, objetivo × 1,15; los pequeños, directas hasta su objetivo —× 1,5 con 60 min o más— y total × 1,5 —× 2—; inicio, nada); nunca por encima de los minutos pedidos, V8, V9, el máximo de series, el tope de ejercicios, tirón:empuje ≥ 1 ni rodilla:cadera 0,6-1,6 (un empuje prioritario o por debajo de su objetivo puede pedir antes una serie de tirón). Al terminar (después de tirón:empuje y de V8/V9), si a un día al que el ajuste le quitó el cardio final le quedan **8 min o más libres**, el cardio vuelve con los minutos que quepan (de 5 en 5, como mucho lo previsto), y «he quitado el cardio final» solo nombra los días que siguen sin él; después va el cardio que llena (§9).

### 8.6 Por qué sobra tiempo (el motivo que dice el texto)

`inicio` · `prudente` · `novato` (principiante: se empieza en la parte baja del rango) · **`rango`** («no hace falta más»: en cada día con 8 min o más libres, cada grupo grande de su zona está en lo alto del rango —con la tolerancia de un paso: una serie o, si ningún ejercicio del grupo admite otra ese día, un ejercicio de 2 series— o en el techo, o sin material, o el relleno ya no encontró nada que cupiera y el grupo está en lo alto del rango de siempre; y ningún grupo grande con material por debajo de su objetivo) · `tope` (queda volumen por poner que no cabe). Con 5-6 días y 20 min o más libres, el texto ofrece «Cambiar reparto».

---

## 9. Calentamiento, equilibrio y cardio

| Bloque | Regla |
|---|---|
| **Calentamiento** | 5 min (3 con 30 min o «corto»; nada con 15-20); 65+: 8 (5 con 30 min); modo corto: 5. En casa: marcha, sombra o baile; en gimnasio: cardio de su lista (de bajo impacto con rodilla, «sin impacto» o 65+). Con la **rodilla doliendo**: «Al final, 2 veces 30-45 s de sentadilla en la pared, en un ángulo sin dolor» |
| **Equilibrio** (tras el calentamiento; 3 ejercicios que progresan, junto a una pared o una silla) | 65+: 5 min (8 con 60 min o más); «Prefiero no decirlo»: 5 (3 con 30 min); **huesos frágiles: 5 (3 con 30 min)**; en el modo corto y con huesos frágiles a 15-20 min, «en casa, cualquier día» (aviso); con menos de 3 días de pesas, «5-10 minutos de equilibrio en casa otro día» |
| **Extensores** (huesos frágiles) | hueco EX cada día con más de 20 min (con 15-20, aviso «en casa»); al menos uno en la semana |
| **Cardio final** | «Perder grasa» 15 min (10 con deporte de piernas o agua) · «Salud y forma» 10 sin deporte · «Aguantar más» 10 (nada con deporte suave) · «Cardio al final: sí» 10; de bajo impacto con rodilla, «sin impacto», 65+, prudente o principiante que pierde grasa; sin HIIT a prudentes ni principiantes |
| **Cardio que llena** | con aguante, grasa o salud (sin «no» al cardio), si a un día le sobran 15 min o más, el cardio final crece hasta llenarlo (máx. 45 min; salud 30); en casa o en un parque, con 20 min o más, **caminar al aire libre**; si no hay ningún cardio posible, el aviso |

---

## 10. Equilibrios y protegidos

| Regla | Cómo |
|---|---|
| **Tirón:empuje ≥ 1** (series de tirón y hombro posterior ÷ empujes y aperturas) | al añadir (un empuje nuevo solo si sigue ≥ 1), tras el volumen (+1 serie a un tirón que quepa; si no, −1 a un empuje) y otra vez al final; último recurso: un empuje que no sea el primer levantamiento deja su sitio a otro hueco del día (tirón, la pierna que menos lleve, core) o un accesorio deja su sitio a un tirón; con su texto |
| **Rodilla:cadera 0,6-1,6** | +1 serie al lado corto sin pasar de lo alto del rango; si no, −1 al largo (mínimo 2, no hueco 1); el exprés y el recorte lo respetan |
| **Protegidos** | core ≥ 2 series directas por semana; hombro posterior ≥ 2 con 6 o más de empuje (con sesiones cortas, solo si cabe) |
| **Gemelas** | gemelas (A/B, T1/T2…) con 10 min o menos de diferencia (se mueve una serie, sin bajar un hueco 1 de su arranque) |
| **Mínimo por sesión** (I/A) | 3 · 4 · 5 · 6 ejercicios con 20 · 30 · 45 · 60+ min, si el volumen lo permite |

---

## 11. Validaciones

**Duras** (si fallan, se prueba el siguiente reparto de la cadena; la rutina final nunca las incumple):

| | Regla |
|---|---|
| V1 | Como mucho 6 entrenos |
| V2 | Ningún ejercicio dos veces en el mismo día |
| V3 | Material, seguridad y dificultad de cada ejercicio, del calentamiento y del cardio |
| V4 | Entre 3 y 8 ejercicios de fuerza por día (2 en el modo corto) |
| V5 | Rodilla, cadera, empuje y tirón 2 veces por semana (1 si el material solo da para una; rodilla y cadera 1 con 20 min o menos y con 65+ o «Prefiero no decirlo» a 30; 1 en el modo corto; nunca más que las veces que se entrena esa zona; exentas las de una zona operada o reciente); core ≥ 1 por semana (con 20 min o menos, aviso) |
| V6 | Series entre 1 y 6 y repeticiones bien formadas |
| V7 | Entre 2 y los días pedidos de entrenos |
| V8 | Techo semanal por grupo (fraccional, deltoides por cabezas) |
| V9 | ≤ 10 series fraccionales por grupo y sesión |

**Blandas** (avisos, no cambian el reparto): grupo grande por debajo de 4 · día por encima de +5 % · hueco 1-2 vacío · tirón:empuje < 1 · rodilla:cadera fuera de 0,6-1,6 · gemelas con más de 10 min de diferencia.

**Invariantes de la rutina final** (`sim/seguridad.js`, comprobadas en 4.200 + 1.500 perfiles y en las personas; deben dar 0): esfuerzo por modo y nunca «al límite en la última»; frases prohibidas; filtros de 65+ y «Prefiero no decirlo» (columna con carga, impacto, dificultad 3, unilateral de pie con carga, hip thrust con barra, unilateral con apoyo cada semana, equilibrio); 65+ sin barra libre en el hueco 1 y con sus series; huesos frágiles y posparto (columna, impacto, flexión sin carga, **equilibrio, extensores y remos con apoyo**); zona operada o reciente sin «con cuidado»; «me duele ahora» sin rango pesado, con 3 series como mucho y **a 8-12**; inicio con 2 series; prudente sin dificultad 3, explosivos ni HIIT; el modo prudente sale solo de lo que debe; topes de días con su texto; consulta del inactivo con enfermedad; parón de más de 2 años = inicio; modo corto con 5 min de calentamiento; suelo con su aviso; dificultad por modo; nada «evitar» de una zona marcada; **sin explosivos ni impacto con una zona activa; hombro que duele ahora sin nada por encima de la cabeza, colgado, con barra en la espalda ni empujes pesados; excéntricos a 3-5 y 2 series; 65+ sin nada colgado; cautos sin negativas; espalda operada o reciente sin compresión; rodilla que duele ahora sin sentadilla cargada ni zancadas largas, y el texto «sin zancadas largas» verdadero; muñeca con la nota de los puños; prioridad de brazos con trabajo directo (45 min o más y material de su menú); mancuernas de 20 kg o menos nunca a 8 o menos en I/A; ningún descanso de 2:30 o más con 10 repeticiones o más; aguante, grasa y salud sin 15 min libres con cardio posible; 16-17 sin rango de 6 o menos; explosivos pedidos y no dados, con su porqué; textos de 65+, de repeticiones y de datos verdaderos; avisos legibles**.

---

## 12. Semillas, determinismo y «Otra propuesta»

- **Semilla** = FNV-1a de la entrada canónica (objetivo, nivel, modos, días, minutos, días seguidos, edad, deporte, prioridades, preferencias, estilo, calentamiento, cardio, explosivos, «no quiero», sitios con su material, días del segundo sitio, zonas, prudente) + la versión del generador + la firma del catálogo. La propuesta normal **no sortea**: misma entrada, misma rutina (1.400/1.400 y 500/500 repeticiones idénticas).
- **«Otra propuesta»** (`alt` = 1, 2…): semilla derivada (FNV-1a de semilla:alt) y un sorteo de peso 0,9 entre los dos primeros escalones de cada hueco, −0,25 por escalón de diferencia y −0,5 a lo que salió en la anterior (`prev`). Cambia el 41-48 % de los ejercicios (objetivo de §E.14: 40-70 %).

---

## 13. Explicaciones

Todas se construyen con la **rutina final** (no con lo que el proceso intentó). Lista de frases prohibidas (`PROHIBIDAS` de `textos.js`: «seguro para tu…», «previene», «quema grasa», calorías, déficit, proteína, «óptimo», «sin constancia», «baja la tensión», «24 %», «Amable con», «es lo recomendado a partir», «al límite en la última»…): no salen nunca.

### 13.1 «Por qué» (en este orden)

| Tema | Frase (ejemplo) | Cuándo |
|---|---|---|
| Respaldo de reparto | «Con tu material (y tus molestias) no sale bien un día solo de tirón: te propongo torso y pierna» · «Con tu material no salen 6 entrenos distintos…» | solo si el reparto final no es el de la tabla (o K bajó en `dias`) |
| Reparto | «Empuje, tirón y pierna: con 6 días, cada músculo 2 veces por semana…» · «Dos entrenos de cuerpo completo que se alternan (A, B, A…)» · «Para ganar fuerza, los básicos van en el gimnasio: dos entrenos que se alternan…, así cada levantamiento sale 1,5 veces por semana; el día de casa, accesorios de torso» | siempre, con las veces por semana reales (coma decimal) |
| Fuerza | «Para ganar fuerza, cada básico se repite…» | si el reparto final repite los básicos |
| Topes de días | «Has dicho N días: 4 son de pesas…» (principiante) · «…para tu edad…» (65+) · «…como no sé tu edad / por lo que marcaste en tu seguridad / en tu vuelta tras el parto / mientras aprendes la técnica…» · «…con 16-17 años, 3 días de pesas bastan para progresar y recuperar…» | con su motivo y «Cambiar reparto» |
| Dos sitios | «El Día C es en casa, con tu material de casa; el resto, en el gimnasio» | con dos sitios |
| Volumen | «Unas N series por semana para cada músculo grande: buen punto de partida…» / «…algunos se quedan por debajo (te digo cuáles en los avisos)» / «…X recibe algo más porque trabaja en los básicos» | «buen punto de partida» solo sin grupos por debajo ni por encima de objetivo × 1,5 |
| Prioridades | «Bíceps y tríceps, como pediste: trabajo directo cada semana y un 25 % más de series que sin prioridad; cada día, antes que los demás ejercicios pequeños» · «Pecho, como pediste: … y va antes en el día» · «Bíceps: con tu material no hay ejercicios directos; los básicos ya lo trabajan» | cada parte solo si es verdad |
| Repeticiones | «Ganar músculo: 6-8 repeticiones en los principales, 8-10 en los secundarios y 12-15 en el resto; con tu peso, 8-12» · fuerza: «4-6 en los levantamientos…» | los rangos que hay, por papel |
| Descansos | «Descansos de 3 min en los básicos pesados: con menos rendirías menos…; en el resto, 1:30» / «Descansos de 2 min en los básicos y de 1:15 en los pequeños» | la primera solo con rango de 6 o menos |
| Mancuernas ligeras | «Con mancuernas de hasta 20 kg, (la fuerza máxima se entrena poco:) subo las repeticiones para que cada serie cueste…» | si se aplicó el suelo de repeticiones |
| Material | «Máquinas y mancuernas para empezar…» · «Empiezo por X: cuando te salga fácil, el Coach te sube…» · «No hay X con tu material: lo cubro con Y. Con una banda… tendrías N ejercicios más» | «máquinas» solo si las hay; «No hay» solo por material |
| Molestias | «Mientras te duela el hombro: nada por encima de la cabeza ni colgado…» · «Por tu lesión antigua de rodilla: sin saltos ni zancadas caminando…» · «Mientras dure la molestia, sin saltos ni impacto» · regla de dolor · «No cargo tu espalda baja hasta que te lo diga quien te operó…» · «Por tu lesión reciente…» · otra zona | por zona y tipo, con lo que se hace de verdad |
| Riesgo | «No incluyo el jalón tras nuca: carga el hombro…» | solo si lo hacía (historial o favorito) |
| Tiempo | «Para que quepa en N min he…» · «Los días duran entre A y B min (tú dijiste N)» / «Cabe en unos X min» · «Te sobran entre X y Y minutos: con este volumen no hace falta más / para empezar, con este volumen basta…» (+ los días en que sobra, si no son todos; + «añade cardio» solo si cabe, o «alarga unos minutos el cardio del final» si esos días ya lo tienen; + «Cambiar reparto» con 5-6 días) · exprés y modo corto | con el motivo de §8.6 |
| Cardio | «Entre 35 y 45 min de bici al final: con «Perder grasa», el tiempo que sobra va al cardio, de bajo impacto» · «Con N minutos no cabe el cardio: … (los días sin pesas / otro día)» · «Sigue con tus paseos» | |
| Modos | 65+ («Más calentamiento, N minutos de equilibrio o equilibrio en casa, máquinas o ejercicios estables y series que no llegan al límite: así se aconseja a partir de los 65») · 65+ con experiencia (con el material que sale) · equilibrio en casa · «Prefiero no decirlo» · rutina suave · 16-17 con experiencia · explosivos pedidos y no dados («Sin ejercicios explosivos por ahora: …») · fuerza general · parón largo · vuelta · nivel efectivo | |
| Esfuerzo y primera semana | «Esfuerzo: Fácil, te sobran unas 3» / «Justo, te sobran 1-2 (2 en 16-17)» · «La primera semana es de prueba: elige pesos (o la variante) con los que te sobren 2-3 (cautos: unas 3)…» | |

### 13.2 Avisos

Orden: **seguridad** (consulta del inactivo con enfermedad, rutina prudente, tensión no controlada, azúcar, huesos frágiles, posparto, lesión reciente, operación, otra zona, revisión por un fisio con 4 zonas, regla de dolor y su línea de alarma) → **material y tiempo** (suelo, mesa, sin cardio, sin calentamiento, core —«no cabe el core: 2 minutos de plancha en casa»; con «sin suelo», con las manos en una mesa o una encimera; en el posparto, dead bug o bird dog—, equilibrio y extensores en casa, «Tu día dura…») → **volumen** (una frase por motivo, con los grupos juntos y cifras enteras: tiempo, «para empezar», material, molestia, días; con 4 grupos o más, «cada músculo recibe unas N series por semana, menos de lo ideal para tu nivel»; a quien empieza, cautos y «Salud y forma», sin cabezas del deltoides ni grupos pequeños; a los demás, los pequeños solo si son su prioridad). **La app enseña los 3 primeros** y el resto en «ver más».

---

## 14. Salida

`genRoutine` devuelve `{ ok, days, weeklyTarget, meta, det }`:

- **`days`** (lo que guarda la app): `{ A: { label, focus, ex: [{ lib, s, r, note }] }, B: … }`; el calentamiento y el cardio, como filas de 1 serie en minutos.
- **`det`** (detalle): por día, `letra`, `role` (plantilla), `place`, `preset`, `ligero`, `nombre`, `minutos`, `sobraMotivo`, `empty` y las filas (`kind`: `warm` · `bal` (equilibrio, texto) · `str` · `cardio`) con series, rango, descanso, nota, hueco, prioridad, papel, patrón, material y dificultad.
- **`meta`**: `split`, `K`, `tpl`, `dayPlace`, **`fd`** (veces por semana de cada día), **`alternas`**, **`fz2`** (días de gimnasio y de casa), **`effort`** (§7.3), **`rampa`**, **`vuelta`**, `lifts`, `kMotivo`, `balMin`, `cargaLigera`, `cardioRelleno`, `seguridad` (banderas), `rest`, `est` (minutos por día), `vol` (por grupo: series, directas, objetivo, lo alto del rango, techo), `ratio` (tirón:empuje, rodilla:cadera), `why` y `warn` (códigos con sus datos, de los que salen los textos), `corto`, `seed`, `alt`, `modes`, `level`, `lvS`, `wd`, `validate`, `tried` (repartos y asignaciones probados), `cut`, `removed`, `reparto`.

---

## 15. Lo que tiene que cambiar el Coach de la app (§G)

| Qué | Por qué | Cómo |
|---|---|---|
| **Esfuerzo objetivo** (`meta.effort`) | Hoy el Coach acelera con «Fácil»; con el objetivo «Fácil» (cautos) no subiría nunca o subiría demasiado (C-01) | Las caritas se leen **respecto del objetivo**. Con `facil`: «Fácil» = en el objetivo → +1 repetición o un salto simple de peso (como mucho uno por semana y ejercicio); «Justo» = por encima → mantener; «Al límite» → bajar un salto. Con `justo`: «Justo» = en el objetivo → progresión normal; «Fácil» → puede subir más; «Al límite» en el tope del rango → mantener |
| **Vuelta tras un parón** (`meta.vuelta`) | Los pesos de antes del parón no valen (C-02, I-4) | `recalibrar` (más de 6 meses): sin peso propuesto; la primera sesión de cada ejercicio es para encontrar el peso dejando unas 3. `menos20` (2-6 meses): el último peso −20 %. `subirNivel`: al cerrar el primer ciclo, «¿Subimos a tu nivel?». Parón de más de 2 años: inicio, sin vuelta |
| **Rampa del primer ciclo** (`meta.rampa`) | 65+ e inicio empiezan con 2 series (C-07, C-08) | Al cerrar el primer ciclo, **propone** (no aplica solo): 65+ → 3 series y 8-12 repeticiones dejando unas 2 en máquinas y variantes estables, nunca al límite; inicio → 3 series |
| **Propuestas por objetivo** | Los rangos y las reglas de §7 dependen del objetivo y del modo | Fuerza: subir carga en los levantamientos dentro de 4-6 (3-5 en avanzados), accesorios por doble progresión; músculo: doble progresión en el rango y +1 serie por bloque mientras el grupo esté por debajo de lo alto del rango (`meta.vol.*.tope`) y del techo; grasa y salud: mantener cargas y subir antes los minutos de cardio (OMS: 150-300 min por semana); aguante: repeticiones y tiempo; **16-17**: nunca por debajo de 6 repeticiones; **mancuernas ligeras** (`meta.cargaLigera`): al llegar al tope del rango con el peso máximo, proponer la variante más difícil (a una pierna o una mano, pausa, tempo) o más peso, no más repeticiones sin fin; molestias: si la persona dice que ya no le duele, ofrecer regenerar (la rutina cambia) |
| **Semana y rotación** | Con 3 días y 2 entrenos la semana alterna; con `fz2`, gimnasio y casa tienen rotaciones distintas | El calendario usa `meta.alternas` (A·B·A, luego B·A·B) y, en `fz2`, alterna A/B en los días de gimnasio y pone los de casa en sus días; las veces por semana de cada entreno, de `meta.fd` |
| **Ejercicio repetido en la semana** | Un mismo ejercicio puede estar en dos entrenos (J-12, J-22), a veces con rangos distintos | La progresión se guarda por ejercicio y rango (o por ejercicio y entreno), no solo por ejercicio |
| **Dominadas** | A 8-12, muchos intermedios no llegan (J-21) | Si en la primera sesión no llega a 8, proponer las asistidas (máquina o banda) o las negativas a 3-5 |
| **Pantalla de la rutina** | Fila de equilibrio (texto), extensores, cardio de minutos variables, avisos | Enseñar las filas `bal`; los 3 primeros avisos y «ver más»; el enlace «Cambiar reparto» cuando el texto lo nombra |

---

## 16. Opciones del generador y decisiones del usuario (6 nov 2026)

| Opción | Valores (por defecto en negrita) | Decisión |
|---|---|---|
| `reparto` | `recomendado` · **`dias`** | **D1 (6 nov): `dias` por defecto en la app**: tantos entrenos como días de pesas (gemelas pesada/ligera en gimnasio; K baja, con su texto, si el material o la seguridad no dan). «Cambiar reparto» ofrece `recomendado`: 2-4 entrenos que rotan. Las dos cumplen las mismas invariantes (§17). El prototipo conserva `recomendado` como valor por defecto de sus herramientas (`matriz.js` lo mide sin opción y `dias` con `--reparto=dias`); la app usa `dias` |
| `menor` | **`tecnica`** · `prudente` | **D6 (6 nov): `tecnica`**: 16-17 con experiencia, básicos de su nivel sin modo clínico (§2); sin experiencia, siempre prudente |
| `mayor4` | **sí** · no | **D4 (6 nov): sí**: 65+ con experiencia y 4 o más días → 4 días de torso/pierna (C-07) |
| `topePrincipiante` | **sí** · no | **D5 (6 nov): lo elige la persona** con la pregunta de P4 («4 de pesas y el resto cardio suave», `sí`, marcada por defecto; «Todos de pesas», `no`). Las dos están probadas: `matriz.js --tope=no` da 0 fallos duros en los 4.200 + 1.500 perfiles, con `recomendado` y con `dias` (v11). Con `no`, un principiante con 5-6 días hace todos sus días de pesas: con `dias`, torso/pierna ×2 + cuerpo completo (5 días) o torso/pierna ×3 (6 días), como en §3.2; con `recomendado`, torso/pierna de 2 entrenos |
| `repetir` | **sí** · no | Repetir un ejercicio en la semana con +1,25 escalones (J-12, J-22); `no` = unicidad semanal de v7. Decidido por el equipo: sí |
| — | — | **D3 (6 nov): modo corto**: 15-20 min se ofrecen a todo el mundo, y con 65+ o prudente el generador usa el modo corto (§8.3) |
| — | — | **D7 (6 nov): relleno** hasta el rango objetivo de 05 con 60 min o más, core y gemelos al día de tirón y «Cambiar reparto» con 5-6 días |
| — | — | **D2 (6 nov): revisa el usuario con una lista preparada** las etiquetas nuevas del catálogo (compresión lumbar, hombro en barra a la espalda y colgados, listas de §5.2), como las molestias. **D9**: los 27 ejercicios nuevos de §K (con el remo con toalla y el equilibrio) antes de publicar |

---

## 17. Métricas del prototipo (v1 → final)

4.200 perfiles de `matriz.js` (5 objetivos × 6 experiencias × 5 días × 7 duraciones × 4, con material, zonas, edades, deporte, prioridades y dos sitios rotando) más, desde v7, un bloque aparte de 1.500 perfiles de seguridad. v1 = el prototipo literal de §E; v7 = el que juzgó el entrenador; **v10 = el final** (`metricas-v10.json` y `metricas-v10-dias.json`). Las definiciones de «volumen fuera» y «techo» cambiaron en la medición 4 (cuenta fraccional por patrón y deltoides por cabezas): sus cifras de v1 no son comparables con las siguientes.

| Métrica | v1 | v7 | **v10 `recomendado`** | **v10 `dias`** |
|---|---|---|---|---|
| Algún día por encima de los minutos + 5 % | 20,7 % | 0 | **0** | **0** |
| Validación dura fallida (V5 cobertura y las demás) | 16,1 % | 0 | **0** | **0** |
| Techo semanal (V8) · tope por sesión (V9) | 10,4 % · 2 % | 0 · 0 | **0 · 0** | **0 · 0** |
| Tirón:empuje < 1 | 5,9 % | 0 | **0** | **0** |
| Invariantes de seguridad y textos (`seguridad.js`), 4.200 + 1.500 | — | 0 de las de v7 (el juez halló 4 graves fuera de ellas) | **0** (73 comprobaciones: 51 de `seguridad.js` y 22 de `matriz.js`) | **0** |
| Volumen fuera de rango (medición 4) | (57,2 % con la medición 1) | 98,6 % | 96,3 % | 95,1 % |
| Grupos grandes en rango (≥ 30 min, con material) | — (v4b 44,6 %) | 49,8 % | 52,5 % | 57,4 % |
| Algún día con 20 min o más sin usar | 31,2 % | 30 % | **15,7 %** | **16,2 %** |
| … en I/A · sin motivo | — · — (v4b 6,4 %) | 6,2 % · 2,3 % | **3,1 % · 0,8 %** | **3,2 % · 1 %** |
| Uso del tiempo I/A (45 · 60 · 75 · 90 min) | 92 · 80 · 66 · 55 % | 93 · 88 · 77 · 67 % | **93 · 90 · 81 · 70 %** | 93 · 90 · 80 · 69 % |
| I/A con 60 min o más y un día por debajo del 60 % | — | — | **1,7 %** | 1,8 % |
| Principales con 2 series (I/A, 45 min o más) | 38,8 % | 9,8 % | **7,8 %** | 4,1 % |
| Remo bajo una mesa | 28,1 % | 11,4 % | 10,2 % | 10 % |
| Reparto de cuerpo completo A/B | 61 % | 41,8 % | 39,1 % | 24,6 % |
| Alguna rareza en el gimnasio | 18,6 % | 1,4 % | 1,9 % | 3,9 % |
| Ejercicios estándar en el gimnasio (todos · principales) | — | 89,8 · 95,1 % | 89 · 94,6 % | 86,5 · 92,6 % |
| Hueco 1 con respaldo evitable | 47 % | 1,3 % | **1 %** | 1,2 % |
| Hueco con un ejercicio que no carga su músculo | 22 % | 0 | 0 | 0 |
| Explicación falsa (medida en la matriz) | 16,3 % | 0 | **0** | **0** |
| 65+ con flexión o giro de columna con carga · con suelo | 7,1 % · 15,7 % | 0 · 6,8 % | **0 · 3,9 %** | 0 · 3,9 % |
| Hueco 1-2 que se queda vacío (con aviso) | 9,3 % | 17,7 % | 12,8 % | 12,7 % |
| Algún ejercicio repetido en otro día de la semana | 0 | 0 | 25,8 % | 50,1 % |
| Determinismo · «Otra propuesta» cambia | 100 % · 45 % | 100 % · 47 % | **100 % · 48 %** | 100 % · 41 % |
| Tiempo de cálculo (mediana · p95) | 5 · 19 ms | 4 · 16 ms | 4 · 15 ms | 6 · 27 ms |
| Personas con reglas «debe» y «no debe» | 6 (§N, comparadas a ojo) | 19, todas pasan | **23, todas pasan en las dos variantes** | |

**Búsquedas del juez** (sus scripts, sobre las mismas rutinas; v7 → v10): saltos con la espalda operada o recién lesionada 32 → **0**; hombro que duele ahora con press por encima de la cabeza, colgado o barra en la espalda 177 de 351 (+ 87 de 100 en el bloque) → **0**; negativas o nórdico a 8-11 682 → **0** (65+ colgados 232 de 840 → 0); huesos frágiles sin equilibrio 100 de 100 → **0**; prioridad de brazos sin trabajo directo 488 de 525 → **0** con 45 min o más; rangos raros (8-11, 10-13…) 9.463 filas → **0**; descansos de 2:30 o más con 10 repeticiones o más 1.901 → **0**; 5 series en un ejercicio 461 → **0**; avisos con decimales o «0 series» 801 y 912 → **0**; 6 o más avisos 886 → 387 (la app enseña 3); «elige pesos» sin pesos 817 → **0**; cautos con «te sobren 2-3» 2.650 → **0**; explosivos pedidos y no dados sin texto 331 → **0**; espalda operada con carga axial o en las manos 613 → 179 (ninguno con `lim.lumbar` ≥ 1: press de hombros sentado, paseos y, sin otra opción, goblet ligero).

**Lo que cambió en las personas del juicio**: David hace los cuatro básicos 1,5 veces por semana (gimnasio A/B alternos y casa de torso); Pablo, prensa con su nota, hip thrust en máquina y sentadilla con cinturón (sin hack ni hip thrust con barra); Lucas, básicos de su nivel a 6-8 dejando 2, salto al cajón 2 × 3-5 y sin «mientras aprendes la técnica»; Pilar, equilibrio, extensores y remos con apoyo; Javier, días de 51-65 min (antes 38-65) con curl, hombro posterior, core y gemelos en el tirón; Carmen, flexiones inclinadas en vez del press en el suelo; Rosa y Lucía, un aviso de volumen en vez de nueve o uno con «0 series»; y las cuatro personas nuevas de los graves (Raúl, Inés, Ramón, Jorge) pasan sus reglas.

---

## 18. Qué no se ha podido arreglar y por qué

| Pendiente | Por qué | Qué haría falta |
|---|---|---|
| **J-26**: en casa sin material, el único remo es bajo una mesa (10 % de las rutinas, casi todas «Sin material») | El remo con toalla en el marco de una puerta no existe en el catálogo, y el catálogo no se toca en este trabajo | Añadirlo al catálogo (§K) con su etiqueta de material «puerta» y menú de remo para casa |
| **Volumen en rango**: 52,5 % (`recomendado`) y 57,4 % (`dias`) de los grupos grandes, y «volumen fuera» en el 96 % de las rutinas | Estructural: 2-3 días de cuerpo completo no llegan al objetivo de un intermedio; la espalda y el glúteo suben **por lo indirecto** (tirón:empuje ≥ 1, face pulls, sentadillas) y «lo indirecto no quita básicos»; una sola elevación lateral con mancuernas. Lo evitable (grupo bajo con tiempo libre en su día) es < 1 % | Una decisión de especificación: medir el rango solo donde el tiempo alcanza, subir lo alto del rango de espalda y glúteo, o contar la espalda sin el 0,5 de los face pulls (ver «Paso 3 · notas») |
| **Uso del tiempo a 75-90 min**: 81 % y 70 % (I/A) | «Ganar fuerza» y «Salud y forma» tienen objetivos de volumen bajos (× 0,75 y × 0,65) y descansos largos; con 5-6 días el volumen se reparte. En aguante, grasa y salud lo que sobra va al cardio; en fuerza y músculo, el texto lo dice y ofrece «Cambiar reparto» | Si el usuario quiere días más llenos en fuerza: accesorios hasta el rango objetivo también en fuerza (hoy solo se rellena hasta su rango) |
| **6 avisos o más** en el 9 % de las rutinas | Personas con varias molestias, enfermedad o medicación: cada aviso de seguridad es necesario | La app enseña los 3 primeros (la seguridad va primero) y el resto en «ver más» |
| **Prioridad de brazos con 30 min o menos**: no siempre hay trabajo directo | Con 30 min caben los básicos, el core y el tirón que equilibra el hombro; el texto lo dice («en tus sesiones no caben ejercicios directos») | — (es el tiempo de la persona) |
| **Levantamientos de fuerza ≥ 1,5 veces por semana**: 84 % | Lo que falta son sesiones de 15-20 min (exprés: 3 ejercicios) o zonas que duelen ahora (el levantamiento deja de serlo) | — |
| **`dias`**: K = días de pesas en el 84-90 % de los gimnasios con 4-6 días (antes 91-93 %) y rarezas 3,9 % | Repetir un ejercicio en un hueco 1 cuenta como «no salen K distintos» (K baja con su texto); los gimnasios pequeños y los box no dan para 6 entrenos distintos sin variantes peores | Es el coste de la opción `dias` (decisión B-1) |
| **Suelo**: con «sin suelo», algún ejercicio de suelo en 195 de los 4.200 perfiles (4,6 %; 164 de ellos, 65+), sobre todo en casa sin material: el remo bajo una mesa o la plancha, con su aviso | En esos huecos no queda ningún otro ejercicio posible sin suelo (suelo evitable: 0 · 0): sin material, el único tirón es el de la mesa y todo el core es de suelo | El remo con toalla (J-26) y un core de pie sin material en el catálogo |
| **Etiquetas del catálogo** (compresión lumbar, hombro en barra a la espalda y colgados, `spine`, `suelo`, listas de §5.2) | Son heurísticas propuestas a partir de la revisión del juez; nadie las ha revisado en el catálogo real | Revisión humana de §K.2, como las molestias |
| **Equilibrio** como fila de texto | No hay ejercicios de equilibrio en el catálogo | Añadirlos (§K.3) para que el Coach los registre |
| **Minutos estimados** | La duración sale de una fórmula (§8.1), no de sesiones reales | Calibrarla con los tiempos reales de la app |
| **Tiempo de cálculo de la matriz** | 67 s (`recomendado`) y 91 s (`dias`) en la medición final, las dos a la vez; con el equipo cargado, `dias` llegó a 144 s, por la búsqueda de repeticiones con 4-6 entrenos distintos | — (en la app se calcula una rutina: 4-6 ms de mediana, p95 15-27 ms) |
| **Juicio independiente** | Las 55 rutinas del juicio se han repasado al arreglarlas (personas con reglas en código y las 31 de la matriz a mano), pero no las ha vuelto a juzgar un entrenador independiente | Un segundo juicio con la misma muestra antes de llevarlo a la app |
| **Decisiones del usuario** | B-1, J-11, M-4, C-17 y, si no está de acuerdo, J-15 | §16 |

---

## 19. Cambios de noviembre de 2026 (repaso del reparto, elegidos por el usuario el 13 nov)

Cada punto es una propuesta aprobada del repaso del creador de rutinas (P1-P12). Donde contradice a una sección anterior, manda esta.

| Propuesta | Regla | Dónde |
|---|---|---|
| **P11** · Tríceps fuera del día de tirón | Con prioridad de brazos, el curl y el tríceps directos (huecos 2) van los dos en los días de **torso** (T1, T2, T3, TC) y de cuerpo completo; en empuje, solo el tríceps; en **tirón, solo el curl**. Antes, la condición «empieza por T» metía también un tríceps en Ti, Ti1 y Ti2. Invariante nueva: `triceps_en_tiron` (ningún hueco TR en un día de tirón) | §3.1, `seguridad.js` |
| **P12** · Sin promesa de «Cambiar reparto» a quien no se le ofrece | Los textos del tope de días de la **rutina prudente** y de **16-17 años** ya no terminan en «cámbialo en "Cambiar reparto"»: la hoja solo deja quitar el tope a quien empieza (D5). El tope no se relaja (decisión del usuario). Sustituye a «con su motivo y cómo cambiarlo» de I-12 (§2.3, §13.1). Invariante nueva: `promesa_cambiar_reparto` | `textos.js`, `seguridad.js` |
| **P3** · Brazos directos en «Ganar músculo» | Con objetivo «Ganar músculo», sin precaución (ni inicio, ni prudente, ni 65+), sin «más glúteo», sin prioridad de brazos (ahí manda J-08) y con **45 min o más**, en los días de **torso** (T1, T2, T3, TC) el curl y el tríceps pasan de accesorios (hueco 3, solo por déficit) a **secundarios** (hueco 2), detrás de los demás. Son un **extra** (`xbr`): los primeros que quita el tope de ejercicios y el presupuesto de tiempo, y en el ajuste al tiempo salen con los accesorios (paso 6), antes de bajar series a nadie. Empuje y tirón ya llevaban el suyo. Medido (gimnasio grande, 4 días): de 0 a 4 series de curl y 4 de tríceps en intermedios y avanzados; quien empieza se queda con un tríceps (tope de 6 ejercicios); en cuerpo completo de 3 días no cambia nada. Coste: el relleno ya no añade el segundo ejercicio de hombro posterior (de 12 a 8 series fraccionales con 4 días de 60 min; el aviso de volumen lo dice) | §3.1, §4.3, §8.2, §8.4 |
| **P3** (ajuste) | El extra de brazos solo admite un **aislamiento** (curl o tríceps): unos fondos en ese hueco eran otro empuje y, con tres días de torso en un box, tirón:empuje bajaba de 1. Si no hay aislamiento posible, el hueco vuelve a ser el accesorio de siempre (no cuenta como hueco vacío) | §6.3 |
| **P1** · Reparto elegido por la persona | Entrada nueva **`plan`** (id de reparto). Solo con `dias` (un entreno distinto por día de pesas). `planes(inp)` da el recomendado (`rec`, el de la tabla de §3.2) y los que se ofrecen además (`otros`): 3 días → cuerpo completo ×3, torso/pierna/cuerpo completo, **torso/pierna/torso** (`tpt3`), empuje/tirón/pierna (`ppl3`); 4 → torso/pierna ×2, **empuje/tirón/pierna/torso** (`pplt4`), **empuje/tirón/pierna/cuerpo completo** (`pplc4`), **por músculos** (`grp4`: pecho y tríceps, espalda y bíceps, pierna, hombros y brazos); 5 → T/P/E/Ti/P, **T/P/T/P/T** (`tptpt5`), **E/Ti/P/E/Ti** (`pplet5`), **por músculos** (`grp5`: pecho, espalda, pierna, hombros, brazos); 6 → E/Ti/P ×2, T/P ×3, **E/Ti/P/E/Ti/hombros y brazos** (`pplg6`). **No se ofrece ninguno** (y un `plan` guardado se ignora) con 65 o más, rutina prudente, 16-17 años, menos de 30 min o «más glúteo»; «por músculos», tampoco a quien empieza (P0/P) ni con «Ganar fuerza»; cuerpo completo ×3, no con días seguidos. La cadena de respaldo es la del recomendado: si el material no da (validación dura, hueco 1 vacío o de respaldo), sale el de siempre y el texto dice «con tu material no sale bien el reparto que elegiste». Con un reparto elegido, repetir un ejercicio principal en otro día no lo descarta | §3.2, `generador.js` (`PLANES`, `planesDe`, `planes`) |
| **P1** · Tipos de día nuevos | `PU` (el único día de pierna: SQ1 · HI1 · LU2 · KF2 · HE2 · CO2 · CA2 · KE3; levantamientos de fuerza: sentadilla y peso muerto), `PT` (PH1 · PI1 · FL2 · TR2 · TR2 · CO2 · FL3; banca), `EB` (TV1 · TH1 · TH2 · RE2 · CU2 · CU2 · CA3), `HB` (PV1 · RA2 · RE2 · CU2 · TR2 · CO2 · RA3; militar), `PE` (PH1 · PI1 · FL2 · FL2 · CO2 · CA3), `ES` (TV1 · TH1 · TH2 · TV2 · RE2 · CO3), `HO` (PV1 · RA2 · RE2 · RA2 · CO2 · CA2), `BR` (CU2 · TR2 · CU2 · TR2 · CO2 · CU3 · TR3). Cada uno con su zona (el relleno solo añade lo de su zona) y su nombre (`NOMBRE_DIA`). En estos días, un músculo que ya toca el tope de 10 series por sesión (V9) cuenta como «lleno» para el motivo de que sobre tiempo | §3.1, §8.6 |
| **P1** · Coste de un solo día de pierna | No se impide: se dice. En una sesión caben como mucho 10 series fraccionales por músculo (V9), así que con un día de pierna de 60 min cuádriceps, isquios y glúteos se quedan en 7-10 series por semana (objetivo de intermedio: 10-12); el texto del reparto dice «un solo día de pierna» / «la pierna, 1» y el aviso de volumen da las cifras. Medido con `matriz.js --reparto=dias --plan=rota` (cada perfil pide uno de sus `otros`): 1.810 perfiles piden plan y 1.570 salen con él (87 %), con todas las invariantes duras y de seguridad a 0 | §4, §17 |
| **P1** · Invariantes y pruebas | `seguridad.js`: `plan_no_permitido`, `plan_sin_pedir`, `plan_dias`, `plan_texto`. `personas.js`: Dani, Nerea, Hugo, Paco, Iker y Lola (reglas en `debeAlt`: la variante `dias`). `matriz.js`: opción `--plan=rota`. **Para el Coach**: con un día de pierna, la pierna queda bajo su objetivo y cada «+1 serie» tiene que respetar el tope de 10 por músculo y sesión; con «Ganar fuerza», los levantamientos de los días nuevos llegan en `meta.lifts` como siempre | `seguridad.js`, `personas.js`, `matriz.js` |
| **P1** · La hoja «Cambiar reparto» (app) | Enseña una ficha por reparto que **sale de verdad** con el material de la persona (la app genera cada uno de `planes(inp).otros` y descarta el que acaba en otro reparto): los días por su nombre, los días de pierna, las veces por semana del torso y de la pierna y los músculos grandes por debajo de su objetivo (`textos.reparto(res, inp)`, sacado de la rutina generada). El recomendado va el primero y marcado; el elegido se guarda con las respuestas (`profile.plan`, también en el borrador) y se olvida si deja de ofrecerse (otros días, otra edad, pasar a 2-4 entrenos). Debajo siguen las formas de siempre (2-4 entrenos que se repiten, D1; el tope de quien empieza, D5) | `cuestionario.js` (`obSplitSheet`, `_obRepOpts`), `perfil-y-material.js` (`PROF_PLAN`) |
| **P4** · Por qué se recomienda y qué más hay | La tarjeta «Tu semana» lleva los días por su nombre y una frase: con el recomendado, «Es el reparto que te recomiendo para tus N días de pesas. Si prefieres otro (un solo día de pierna o un día para cada grupo de músculos), en "Cambiar reparto" tienes M más que también te valen» —M y los ejemplos salen de las fichas que la hoja enseña de verdad: no promete lo que no hay (lección de P12)—; con uno elegido, «Este reparto lo has elegido tú. El que te recomiendo… es …». La frase de torso/pierna ×2 de intermedios y avanzados dice ya el motivo («cada músculo trabaja 2 veces por semana, con un día más pesado y otro más ligero para cada zona»). La hoja cierra con «Con el mismo trabajo a la semana se progresa parecido con cualquiera: elige el que más te apetezca cumplir» | `textos.js` (`reparto`, §13.1), `cuestionario.js` (`_obRepWhy`) |
| **P2** · Cuánta pierna: la pregunta, para todos (**cambia D10**) | D10 (6 nov) ofrecía el enfoque «Más glúteo y pierna» solo a mujeres, justo después del objetivo. El usuario aprobó el 13 nov abrirlo a todos y añadir «Más torso». Ahora la pregunta «¿Cómo repartes la semana entre torso y pierna?» va **antes de las prioridades** (ya se saben los días, la edad y la salud) y tiene tres respuestas: «Equilibrado» (recomendado), **«Más torso»** y «Más glúteo y pierna». La respuesta se guarda en `profile.enfoque` (`gluteo` · `torso` · `igual`); lo ya guardado vale tal cual (quien tenía `gluteo` lo conserva; los demás, equilibrado). «Mujer u hombre» sigue preguntándose solo para no preguntar por el embarazo a un hombre | `cuestionario.js` (`ob-enfoque`), `perfil-y-material.js` |
| **P2** · «Más torso» en el generador | Entrada `masTorso` (= `enfoque: 'torso'`): con `dias` y sin `plan`, el reparto de salida es el de **un solo día de pierna** de sus días (`UNA_PIERNA`: 3 → `tpt3`, 4 → `pplt4`, 5 → `pplet5`, 6 → `pplg6`), con los mismos límites que un reparto elegido (nunca con 65 o más, rutina prudente, 16-17 años ni menos de 30 min: a esos perfiles la app ni siquiera les enseña la respuesta; con 2 días no cambia nada). El recomendado (`rec`) sigue siendo el equilibrado y un `plan` elegido en la hoja manda. `meta.plan` lleva el reparto pedido (en la hoja o con «Más torso»). En la app, elegir el reparto de un día de pierna en «Cambiar reparto» es responder «Más torso» (así sigue al cambiar de días) y elegir otro lo quita. No toca el volumen objetivo: el coste lo pone el tope de 10 series por músculo y sesión y lo dice el aviso. Medido con `matriz.js --reparto=dias --enfoque=torso`: 1.243 de 4.200 perfiles salen con un día de pierna, invariantes a 0. Personas: Tomás («Más torso», 5 días) y Marcos (hombre con «Más glúteo y pierna») | §2, §3.2, `generador.js`, `matriz.js`, `personas.js` |
| **P5** · Cambiar el reparto con la rutina ya aceptada (app) | Ajustes › Tu entrenamiento › **«Cambiar reparto»**: abre «Qué cambia en tu rutina» con tus respuestas tal cual y, encima, la hoja de repartos; elegir uno enseña qué se queda, qué cambia y qué sale antes de aplicar («Aplicar cambios» guarda la rutina de ahora para «Volver a mi rutina anterior» y cierra el ciclo en curso, como cualquier otro cambio; el historial no se toca). «Qué cambia» lleva siempre el enlace «Cambiar reparto ›» (también desde «Tus respuestas» y al cerrar un ciclo). Al rehacer la rutina desde Ajustes se respeta su forma (`planMeta.reparto`: un entreno distinto cada día o 2-4 que se repiten; antes se perdía). Sin consentimiento de salud guardado, antes se repasan P8 y P9, como en cualquier cambio (43 I-9). El generador no cambia | `cuestionario.js` (`openSplitChange`, `ob-resp-qc`, `_obPrefill`) |
| **P9** · Quien empieza de cero: 2 entrenos que se alternan (**cambia D1**) | D1 (6 nov) puso «un entreno distinto cada día» (`dias`) para todo el mundo. El usuario aprobó el 13 nov cambiarlo **solo para quien empieza de cero** (modo inicio): su forma de salida es `recomendado` (cuerpo completo A/B con 2-3 días, A·B·A y luego B·A·B con 3; torso/pierna que se alternan desde 4), porque con `dias` le salían 15 ejercicios distintos con 3 días y 20 con 4, cada uno una vez por semana (con `recomendado`, 10). `formaInicial(inp)` lo decide: `recomendado` con inicio y sin estructura pedida; `dias` para los demás y para quien pidió un reparto, «Más torso» o «Más glúteo y pierna» (solo existen con un entreno por día). «Cambiar reparto» sigue ofreciendo un entreno distinto cada día, y la forma elegida a mano se guarda con las respuestas (`profile.forma`). Quien ya tenía una rutina generada conserva su forma al rehacerla (`planMeta.reparto`). Las dos formas ya cumplían las mismas invariantes (§17): no hay combinaciones nuevas | §3.2, §16, `generador.js` (`formaInicial`), `cuestionario.js` (`_obForma`) |
| **P8** · Mover los días de orden | Contexto nuevo **`ctx.orden`** (para cada posición nueva, el índice del día en el orden del generador): `genRoutine` genera como siempre y `reordenar(res, orden)` cambia las letras. La rutina es la misma (misma semilla, mismos ejercicios y series): se remapean `days`, `det`, los mapas de `meta` (`tpl`, `dayPlace`, `fd`, `est`, `lifts`) y todo lo que nombra un día (`time_spare.dias`, `no_cabe.dia`, `cut`, `removed`, las validaciones), así los textos siguen siendo verdad. Un orden que no es una permutación de sus días se ignora. En la app: «‹ Antes» y «Después ›» al pie del día abierto en la rutina propuesta (lo fijado con ⇄ va con su día; se guarda en el borrador; se olvida al cambiar de reparto o de días) y en «Tus días» del editor con la rutina ya aceptada (re-letrado de siempre: el historial va con cada ejercicio y las sesiones hechas conservan su nombre). Si el orden nuevo deja la misma zona (pierna, empuje o tirón con 2 ejercicios o más) en dos días seguidos y antes no, se avisa sin impedirlo. Con «Ganar fuerza» en dos sitios (`planMeta.seq`) el orden lo marcan los sitios y el editor no lo ofrece | §12, §14, `generador.js` (`reordenar`), `cuestionario.js` (`obMoveDay`), `editor-rutina.js` (`moveDayUI`) |
| **P7** · Otro entreno solo para un día | `otroDia(inp, ctx, res, pos)`: con la rutina que la persona tiene delante, rehace todo con el **sorteo de «Otra propuesta» solo en ese día** (`ctx.altDia`: índice del día → vez; semilla propia por día y vez), cada hueco de los demás días **anclado** al ejercicio que ya tiene (`ctx.fijos`: clave del hueco → ejercicio; `det.rows[].key` lleva la clave) y lo que ese día llevaba, penalizado (`ctx.prev`). Es una rutina generada entera: las series de la semana se vuelven a cuadrar y pasan las mismas validaciones. Solo vale si los demás días conservan **exactamente sus ejercicios** y ese día cambia; si no, prueba otra vez del sorteo (hasta 8) y, si ninguna vale, devuelve `null` y la app lo dice sin cambiar nada. Medido en 3.600 perfiles (todos los materiales, 30-90 min, con 65+, rutina prudente y molestias): sale en el 93 % (lo que falta es casa sin material o parque, donde no hay otro ejercicio), 0 reglas rotas, 3 ejercicios nuevos de mediana y alguna serie distinta en otros días en el 8 %. En la app: «Otro entreno para este día ›» al pie del día abierto de la rutina propuesta (y de «Qué cambia»); lo fijado con ⇄ se respeta; `_ob.dia` guarda el contexto que reproduce la rutina (también en el borrador); «Otra propuesta» entera lo olvida. En el editor de una rutina ya aceptada no se ofrece todavía | §12, `generador.js` (`otroDia`, `pick`), `cuestionario.js` (`obOtherDay`) |
| **P6** · Cambiar el foco de un día: la semana a medida | Entrada nueva **`roles`**: el **tipo** de cada día (`torso`, `pierna`, `empuje`, `tiron`, `completo`, `pecho_triceps`, `espalda_biceps`, `hombros_brazos`, y `pecho`, `espalda`, `hombros`, `brazos`). `repartoDeTipos` lo pasa a plantillas: si la semana es la de un reparto con nombre, ese (con sus textos); si no, uno a medida (`x:…`) con una plantilla distinta por cada repetición del tipo (el único día de pierna de la semana es el completo, `PU`). Como mucho 3 de torso, de pierna o de cuerpo completo, 2 de empuje o de tirón y 1 de cada día por músculos. Manda sobre `plan` y sobre «Más torso», con los mismos límites (`puedeElegir`: nunca con 65 o más, rutina prudente, 16-17 años, menos de 30 min, «más glúteo» ni menos de 3 días; solo con `dias`). El recomendado (`rec`) no cambia y la cadena de respaldo es la suya | §3.2, `generador.js` (`TIPO_TPL`, `tipoDe`, `repartoDeTipos`, `puedeElegir`) |
| **P6** · La regla de la semana completa | (1) **Equilibrio del hombro**: una semana con días de empuje, de pecho o de hombros necesita algún día que tire (torso, tirón, cuerpo completo o espalda); sin él no es válida y se ignora (la app no la ofrece), y un reparto a medida solo se acepta si tirón:empuje queda ≥ 1. (2) **Semana sin una zona**: una semana a medida sin ningún ejercicio de pierna (o de empuje, o de tirón) **se permite y se dice sin rodeos**: aviso `semana_sin`, el primero de su grupo («Tu semana se queda sin pierna: ningún día la trabaja. Si no es lo que querías, cambia el foco de un día»); la app, además, lo avisa antes de aplicarlo («Tu semana se quedaría sin pierna» · «Cambiar igualmente» / «Elegir otro foco»). Los músculos de esa zona salen del aviso de volumen (ya están dichos). Invariantes nuevas: `plan_no_permitido` (a medida), `medida_tiron_empuje`, `semana_sin_aviso` (el aviso está si falta la zona y solo entonces); con prioridad de brazos, el trabajo directo se exige si la semana tiene un día de su familia. Medido con `matriz.js --reparto=dias --roles=azar` (semanas al azar): de 3.360 perfiles que la piden, 700 salen con ella (519 completas, 162 sin pierna, 19 sin empuje), invariantes a 0. Personas: Vera (torso, pierna, torso, hombros y brazos) y Saúl (semana sin pierna) | §11, §13.2, `seguridad.js`, `matriz.js`, `personas.js` |
| **P6** · En la app | «Cambiar el foco de este día ›» al pie del día abierto de la rutina propuesta (y de «Qué cambia»), solo para quien puede elegir reparto. La hoja ofrece los focos con los que la semana **sale de verdad** (genera cada candidata); al elegir, los días que no cambian de tipo conservan sus ejercicios (anclas de P7; al recuadrar la semana pueden ganar un accesorio), se conserva el orden dado a los días (P8) y la tarjeta dice «Esta semana la has montado tú, día a día» con el recomendado. Se guarda con las respuestas (`profile.roles`) y se olvida si deja de aplicarse; elegir un reparto en «Cambiar reparto» o cambiar la respuesta de torso y pierna la sustituye. De paso, el aviso «Tirón y empuje no quedan equilibrados» escribe el número con coma decimal | `cuestionario.js` (`obFocusSheet`, `obFocusPick`), `perfil-y-material.js` (`PROF_TIPOS`) |
| **P10** · Las prioridades sugieren un reparto | `textos.sugerencia(res, inp, otros)`: si con el reparto de ahora una zona **prioritaria** se queda por debajo de su objetivo (el mismo margen que el aviso de volumen: más de 0,75 series) y con otro de los repartos que se le ofrecen (`otros`: ya generados) **ninguna** prioridad se queda corta, devuelve la frase: «Con este reparto, el pecho no llega a lo que pide tu prioridad. Con empuje, tirón, pierna y torso sí (la pierna pasa a 1 día): lo tienes en "Cambiar reparto"». Dice qué zona, con qué reparto y qué cuesta; **no cambia nada sola**. La app la pone bajo el porqué de «Tu semana», solo con un entreno distinto cada día y con las fichas que la hoja enseña de verdad (así el reparto sugerido está siempre en la hoja). Ejemplos medidos (gimnasio grande, 60 min): pecho y brazos con 4 días → un día de pierna; piernas con un día de pierna → torso/pierna ×2; pecho y espalda con 5 días → T/P/T/P/T; glúteos con 4 días o pecho y brazos con 3 → nada que sugerir | §13.1, `textos.js` (`sugerencia`), `cuestionario.js` (`_obSugerencia`) |

## 20. El tipo de sesión en lugar de los minutos (elegido por el usuario el 13 nov 2026)

El creador de rutinas deja de preguntar «¿cuántos minutos tienes?» y pregunta **qué tipo de sesión quieres**; el tiempo aproximado se enseña
al lado, calculado con la rutina que sale. Motivo: con los minutos salían rutinas muy pobres o muy completas sin que la persona supiera por
qué, y los brazos directos no aparecían hasta 75-90 min. Una fila por decisión:

| Decisión | Regla |
|---|---|
| **T1** · Tipo de sesión (generador) | Entrada nueva **`sesion`**: `esencial`, `completa`, `fondo` (y `expres`, T5). El tipo fija la receta: su presupuesto interno de minutos (`SESION`: 30, 60 y 90; exprés 15, o 20 en el modo corto de 65 o más y rutina prudente) alimenta los escalones de siempre (series de arranque, calentamiento, relleno) y su tope de ejercicios (`capOf`): «Lo esencial» 5; «Completa» 7 en intermedios y avanzados; «A fondo» 8. Los topes de inicio (5), de principiante o modo prudente (6) y de 65 o más con experiencia (7) no cambian con el tipo, ni V8, V9 ni las reglas de seguridad. `meta.sesion` es el resumen de la sesión con la rutina final (`tipo`, `min` = el día más largo redondeado a 5, `ej` = ejercicios de fuerza por día, `biceps`, `triceps`, `abs`, `cardio`): es lo que pintan las tarjetas, así que el tiempo de la tarjeta es el de la rutina que sale. Los textos no hablan de «los minutos que dijiste» ni de «los que te sobran». Sin `sesion` (rutinas de antes) mandan los minutos, como siempre: mismas rutinas, byte a byte. |
| **T7** · Sin tipo guardado | `sesionDe(min)`: 15-20 exprés · 30 lo esencial · 45-60 completa · 75-90 a fondo. Sin pantallas ni avisos de migración. |
| Pruebas | Persona **Tina**; invariantes `sesion_texto_minutos` y `sesion_resumen` (`seguridad.js`); pasada **`--sesion`** de la matriz (cada perfil elige el tipo que corresponde a sus minutos; los de «Completa» se generan también con los otros dos tipos y se exige el orden esencial ≤ completa ≤ a fondo en ejercicios por día y en minutos cuando el reparto es el mismo). |
