# Kit de equipamiento y posturas (`ex/_kit.js` → `GA._.kit`)

`_kit.js` es un IIFE que **no registra ejercicios**: expone helpers en `GymAnim._.kit` para las familias nuevas
(barra, kettlebell, suelo, bandas, TRX, fitball, rueda, comba, step/cajón, balón medicinal, dominadas, fondos,
trineo, cuerdas de batalla, remoergómetro, escaladora, bici de aire, SkiErg, landmine). Medidas reales en metros.

- **Carga**: `build.js` lo mete el primero (antes de `ref.js`) y después de la lista fija añade por orden alfabético
  cualquier otro `ex/*.js` (familias nuevas sin tocar `build.js`). En el lab (`lab.html`, `shot.sh`) hay que nombrarlo: `files=ex/_kit.js,ex/mi_familia.js`.
- **Uso** en una familia:
  ```js
  (function(GA){
  const K=GA._.kit,V=GA._.V,C=GA._.COL,DM=GA._.DIM,SS=K.SS,mix=K.mix;   // SS = [['R',1],['L',-1]]
  GA.def('lib_xxx',{ …, build(c,b,E){ … } });                           // build con sintaxis de método (this = spec)
  })(window.GymAnim);
  ```
- Convenciones del motor (README): metros, Y arriba, suelo y=0, la persona mira a **+X**, su derecha es **+Z**,
  `k = s==='R'?1:-1`. Equipamiento `K.xxx(E,…)`: dibuja con `E.*` y **devuelve los puntos de contacto** (centros de
  puño, ejes de mango, superficies) para hacer IK. Posturas `K.xxx(b,…)`: colocan el cuerpo respetando el orden
  pelvis → columna → cabeza → escápulas → miembros; después puedes sobrescribir cualquier miembro.
- Demos de cada pieza: `demo/kit_demo.js` (NO entra en el build). Ver:
  `bash shot.sh demo_rower ex/_kit.js,demo/kit_demo.js shots/kit_rower.png "" 1440,720`.

---------------------------------------------------------------------------------------------------------------
## 1. Utilidades

| Helper | Qué hace / devuelve |
|---|---|
| `K.memo(this,key,fn)` | Caché por definición (WeakMap con clave el objeto spec). `fn()` se evalúa una vez por spec/alias. **Lanza un error** si el primer argumento no es un spec con `build` (p. ej. `this` de un `build` con flecha = `window`/`undefined`): antes caía en una caché común a todas las variantes. Ver §5. |
| `K.root(f,lo,hi,tol?)` | Raíz de `f` en `[lo,hi]` por regula falsi (Illinois): ~5 evaluaciones si `f` es casi lineal (CdM, alturas, ángulos) frente a 40 de `E.solve`. Sin cambio de signo cae en `E.solve`. **El estado de `b` queda en la última evaluación: vuelve a posar con el valor devuelto.** |
| `K.legD(kf)` / `K.kneeFor(d)` | Distancia cadera→tobillo con la rodilla a `kf`° / inversa. |
| `K.armD(ef)` | Distancia hombro→centro del puño con el codo a `ef`° (`armD(4)` ≈ brazo estirado, .628). |
| `K.com(b,xm)` | Centro de masas (fracciones de Winter) + masas externas `xm=[[pos,fracción del peso]]` (kg/75). Necesita brazos y piernas ya colocados. |
| `K.ells(b)` | Elipsoides de contacto `{pel,gluR,gluL,lum,tho,shd,head,face,hair,hipR,hipL,shoR,shoL}` (`[centro,[3 semiejes]]`), idénticas a las que dibuja el motor (+ esferas en raíz de muslos y hombros). `K.TORSO`, `K.HEAD` = listas por defecto. |
| `K.gap(e,o,n)` / `K.sgap(e,c,r)` / `K.low(b,parts,o,n)` | Holgura elipsoide↔plano (punto `o`, normal `n`), ↔esfera, y mínima de varias partes. |
| `K.rest(b,parts,o,n)` / `K.restBall(b,parts,c,r)` | Traslada el tronco para que la parte más baja toque el plano / la esfera. |
| `K.shift(b,d)` | Traslada pelvis+tronco+cabeza. **Antes** de colocar brazos y piernas. |
| `K.frame(b,pos,U,F)` | Pelvis por ejes (U hacia la cabeza, F hacia el pecho). Para tumbados/de lado. |
| `K.trunk(b,{sp,hd,sc})` | `spine(...sp)`, `head(...hd)`, `scap('both',...sc)` con valores por defecto 0. |
| `K.shoe(ank,f,u)` | Elipsoides de la zapatilla. |
| `K.footOn(b,s,P,f,u,n?)` | Fija el pie con orientación `f` (punta) / `u` (normal de suela) y lo apoya: el punto más bajo de la zapatilla toca el plano por `P`. Devuelve el tobillo. (`footFlat` del motor hunde la suela .8 cm: convención de los 46 ejercicios.) |
| `K.footBallOn(b,s,P,yaw,pitch)` | De puntillas: metatarsos en `P.xz`, talón elevado `pitch`°, la zapatilla apoya en `y=P[1]`. Sustituye a `b.footBall` cuando importa no hundir el pie. |
| `K.legs(b,{up,out})` | IK de las dos piernas a los pies ya fijados, rodilla siguiendo la punta del pie. |
| `K.palm(b,E,s,P,{fd,n,pole,draw})` | Mano plana apoyada (patrón de `lib_pushup`): `P` = punto de la superficie bajo la palma, `fd` dedos, `n` normal. Hace el IK y dibuja la palma en el grupo `fa`+s. |
| `K.palmT(P,{fd,n})` | Centro del puño que usa `K.palm` para esa palma (`P − .05·fd + .029·n`). Punto de partida del brazo que se suelta del apoyo (bird-dog): sin salto. |
| `K.armsFloor(b,E,{y,spread,elbow,sides})` | Tumbado: brazos estirados con las palmas en el suelo a alcance completo, abiertos `spread`° desde el eje del cuerpo hacia los pies (0 pegados, 90 en cruz). |
| `K.COL`, `K.BAND` | Colores (hierro, madera, foam, correas, cuerda, cinta, fitball, esterilla, puño) y bandas por resistencia (`yellow red green blue black purple orange`). |
| `K.SS`, `K.sd(s)`, `K.D`, `K.mix`, `K.clamp`, `K.sst` | Atajos. |

---------------------------------------------------------------------------------------------------------------
## 2. Posturas

Todas aceptan `sp:[flex,side,twist]`, `hd:[flex,turn,tilt]` (o número) y `sc:[elev,prot]`. Las que resuelven
(equilibrio, alcance, apoyo) guardan y restauran `b.ikErr`: lo que veas en `IK x cm` es sólo la pose final.

### `K.stand(b,o)` → `{x,y}` (cadera)  · alias `K.standOnFeet`
De pie con pies planos. `o`: `fx` (x de talones, -.05), `fz` (semi-separación .12), `toe` (apertura 8°),
`feet:{R:[x,z,y?],L:[x,z,y?]}` (talones; `y` para pies a distinta altura), `y` (suelo), `kf` (flexión de rodilla, 4°) o
`hy` (altura de cadera), `x` (cadera) **o** `balance:true` (+ `xm` masas extra o función que las devuelve, `bx` x
objetivo del CdM; por defecto medio pie), `tilt/yaw/roll`, `sp/hd/sc`, `arms(b)` (se llama dentro del bucle de
equilibrio: pon aquí los brazos y actualiza la posición de la carga), `pole:{up,out}`.
```js
let h=[0,.5,0];
const arms=b=>{const sm=V.lerp(b.sho('R'),b.sho('L'),.5);h=[sm[0],sm[1]-K.armD(3),0];
  for(const[s,k]of SS)b.arm(s,V.add(h,[0,0,k*.05]),[-.2,0,k],[0,0,1]);};
K.stand(b,{fz:.17,toe:14,kf:mix(5,60,p),tilt:mix(2,44,p),balance:true,arms,xm:()=>[[h,24/75]]});
K.kettlebell(E,h,{kg:24});                        // demo_kettlebell, demo_barbell, demo_trapbar, demo_wall
```

### `K.lie(b,o)` → b  · `K.supine` / `K.prone` / `K.sideLie` (alias `supineOnFloor`, `proneOnFloor`)
Tumbado sobre el plano `y` (suelo o `mat.top`). `face:'up'|'down'|'L'|'R'` (de lado: lado apoyado), `dir` ±1 (cabeza hacia
±X; por defecto -1 boca arriba, +1 boca abajo), `incl` (° del eje del cuerpo, + cabeza más alta; puente de glúteo =
negativo; de lado `'auto'` por defecto: hombro y cadera apoyan a la vez), `roll`, `hd` (número o `'rest'` = la cabeza
apoya en `headY`; de lado la inclina; si no, sólo se corrige si atravesaría el suelo), `parts` (qué elipsoides pueden
tocar, `K.TORSO`), `x` + `at:'pelvis'|'sho'|'head'` (qué punto queda en esa x), `z`. Después coloca piernas y brazos.
```js
const mt=K.mat(E,[0,0,0],[1.7,.6]);
K.supine(b,{y:mt.top,x:-.42,at:'sho',incl:-mix(0,24,p),hd:'rest'});   // puente: hombros fijos, cadera sube
for(const[s,k]of SS){b.footFlat(s,[.36,mt.top,k*.15],-k*4);b.leg(s,null,[0,1,k*.25]);}
K.armsFloor(b,E,{y:mt.top,spread:16});                                 // demo_bridge, demo_prone, demo_side
```

### `K.kneel(b,o)` → `{knees,hip}`
De rodillas (rodilla a `y+.056`: la rótula toca). `x` (rodillas), `kz`, `thigh` (° desde la vertical, + cadera adelantada),
`tilt`, `toes:'flat'|'tuck'`, `half:'R'|'L'` (esa pierna adelantada con el pie plano = semiarrodillado), `fwd`.
Uso: rueda abdominal (`thigh` y `tilt` según p), landmine semiarrodillado.

### `K.quad(b,E,o)` → `{hands,knees,tilt}`
Cuadrupedia: rodillas bajo la cadera, manos (palmas) bajo los hombros; la inclinación del tronco se resuelve para el
alcance. `x,y,kz,hz,thigh,sp,hd,sc,hx,elbow,toes`, `arms:false|'R'|'L'` (qué manos apoya: deja libre la que vas a mover).
```js
// bird-dog: la palma R sigue apoyada hasta p=.06; desde ahí el puño sale (sst, velocidad 0) del objetivo de K.palm
const q=K.quad(b,E,{x:-.25,y:mt.top,arms:p>.06?'L':true}),qa=K.sst(.06,1,p);
if(p>.06){const g=V.lerp(K.palmT(q.hands.R),V.madd(b.sho('R'),V.norm([1,.08,-.05]),.6),qa);b.arm('R',g,V.lerp([-1,.3,.45],[0,-1,.2],qa),[0,0,1]);}
```
No uses `arms:p>0?'L':true` con el brazo moviéndose desde `p` (salto de palma a puño en el primer fotograma), ni
`q.hands` como objetivo del puño: `hands` es el punto de la superficie, `K.palmT(hands)` el del puño (+.029 en `n`).

### `K.plank(b,E,o)` → `{th,hands}` · alias `K.pushupBody`
Cuerpo rígido entre apoyos, cabeza hacia +X. `xT` (x de la punta del pie; con `knees` x de la rodilla), `fy` (altura del
apoyo de pies: declinada), `hy` (apoyo de manos: inclinada sobre banco/cajón), `hx` (x de las palmas; por defecto
brazos verticales arriba, `dhx` las desplaza), `zF,zH`, `p` (0 arriba → 1 abajo con el pecho a `clr` del apoyo), `top`
(alcance arriba), `pr:[arriba,abajo]` protracción, `pole`, `knees` (+`shin`), `forearm` (plancha de antebrazos: codo bajo
el hombro; devuelve `{th,elbows}`), **`k`: objeto de caché** (`K.memo(this,'pl',()=>({}))`).
```js
const pl=K.plank(b,E,{xT:-1.15,hy:.45,p:c.p,k:K.memo(this,'pl',()=>({}))});
K.box(E,[pl.hands.R[0]+.18,0,0],[.42,.45,1.1],{kind:'bench'});           // demo_pushup(_incline/_knees), demo_plank_forearm
```
**Con `hy` (manos en banco/cajón) el apoyo debe acabar como mucho 3 cm detrás del centro de las palmas**
(`hands.R[0] − .03`): `K.plank` sólo comprueba el pecho contra un plano infinito a `hy`, así que abajo la pelvis y los
muslos atraviesan cualquier borde que quede más atrás (con el banco centrado en `hands+.1`, 2,7 cm).

### `K.hang(b,o)` → `{x,y}` (hombros)
Colgado de una barra en `(x,y)`: `w` (semi-agarre), `p` (0 colgado activo → 1 barbilla sobre la barra), `grip:'pro'|'sup'|'neu'`,
`lean` (° atrás arriba), `hip`, `knee`, `sc0/sc1`, `legs(b)`. La x se resuelve para que el CdM quede bajo la barra.
```js
const bar=K.pullupBar(E,{x:0,y:2.3});K.hang(b,{x:0,y:bar.y,w:.4,p:c.p});             // demo_hang, demo_hang_door
```

### `K.support(b,o)` → `{dx}`
Apoyo en paralelas (fondos): manos en `(x,y,±w)`, `p` (0 brazos extendidos → 1 codo a `e1`=92°), `lean0/lean1`, `hip`, `knee`,
`legs(b)`. CdM sobre las manos. `const ds=K.dipStation(E,{});K.support(b,{y:ds.y,w:ds.w,p:c.p});`

### `K.seat(b,P,o)` → cadera · alias `K.seatOnBox`
Sentado: los glúteos tocan la superficie horizontal que pasa por `P` (cajón, banco, sillín, asiento del remo) o, con
`ball:{c,r}`, la esfera de un fitball. `dx, tilt, yaw, sp, hd, sc, parts`, `feet:{x,z,toe,y}` o `legs:false`.
```js
const fb=K.fitball(E,[0,.31,0],.325,{sq:.045});K.seat(b,fb.top,{ball:fb,feet:{x:.5,z:.22}});
K.seat(b,[sx,G.SY,0],{tilt,legs:false});                                  // remo: piernas a las placas a mano
```
Sólo apoyan las `parts` (glúteos y pelvis): los muslos que bajan hacia las rodillas entran algo en superficies blandas
(fitball 4,8 cm, asiento del remo 2,5 cm; quedan tapados porque el soporte va con `layer:-1`). Añadir `'hipR','hipL'` no
lo cambia (las caderas ya quedan fuera); para evitarlo baja el apoyo respecto a las rodillas (balón más pequeño o pies más altos).

---------------------------------------------------------------------------------------------------------------
## 3. Equipamiento (medidas reales)

| Helper | Medidas | Devuelve |
|---|---|---|
| `K.kettlebell(E,h,{kg,up,ax,col})` — `h` = centro del asa (puño) | bola r = .085 (8 kg) … .125 (32 kg) (`K.kbR`), asa Ø33 mm, ventana 6,8 cm | `{h,c,r,up,ax,hw,dc,bot,horns:[R,L],floorH}`; `K.kbFloorH(kg)` = altura del asa apoyada |
| `K.barbell(E,c,ax,{len,r,inner,plates,clip,col})` | 2,2 m, Ø28 mm, camisas Ø50 desde ±.655; discos `[r|{r,th,col}]` de dentro a fuera (`K.plateTh`) | `{c,ax,R,ends,grip(w)→[R,L]}` (R = altura de la barra apoyada en el suelo) |
| `K.ezbar(E,c,ax,{bend,plates})` | 1,2 m, W con 2 tramos inclinados por lado | `{grips:{narrow,wide},axes:{narrow,wide},R}`; agarre estrecho a ±.1475 |
| `K.trapbar(E,c,{yaw,hi,plates})` — `c` = punto medio entre mangos | hexágono 1,0×0,72, mangos a ±.31, altos +.10 | `{grip:[R,L],ax,R,base}`; abajo `c.y = R+hi` |
| `K.rack(E,{x,z,h,hook,depth,safety,pull})` | montantes 75 mm a ±.6, 2,25 m; ganchos J (la cuna toca la barra: cara superior en `hook−.012`); vigas de base apoyadas en el suelo | `{hooks,bar,hook,safety}` (`bar` = centro de la barra en los ganchos) |
| `K.box(E,c,[l,h,w],{kind,yaw,col})` — `c` = centro de la base | `wood` (cajón con asas), `soft` (foam), `step` (aeróbic con elevadores), `bench` (banco tapizado: las dos patas van a lo largo del lado mayor, sea `l` o `w`) | `{top,y,fwd,side}` |
| `K.fitball(E,c,r,{sq})` | r .325 (65 cm), `sq` aplastado | `{c,r,top,at(dir)}` |
| `K.abWheel(E,c,ax)` | rueda r .09, puños de .11 a .165 | `{c,ax,R,hands:[R,L]}` |
| `K.band(E,a,b,{col,w,L0,loop,flat,handle})` | tubo/banda tensa; más fina cuanto más estira (`L0`); `handle` = eje del asa en b | `{len,end}` (acepta polilínea `[p0,p1,…]`) |
| `K.miniband(E,pR,pL,{r,axis,col})` | lazo alrededor de las dos piernas (centros de pierna); cada lazo queda ⟂ a su eje. Si las piernas no son paralelas (almeja, abducción) pasa `axis:[axR,axL]` con el mismo sentido (p. ej. cadera→rodilla en las dos); un solo eje (o la media) inclina el lazo de la otra pierna | `{len}` |
| `K.trx(E,anchor,hR,hL,{split,ax,feet})` — alias `K.suspension` | correa única → mosquetón → dos correas con asas; `feet`: cunas | `{J,att}` |
| `K.pullupBar(E,{x,y,w,kind,neutral})` | `posts` (2 postes + travesaño), `tower` (postes detrás), `door` (marco de puerta, 2,0 m) | `{x,y,w,grip(w),neutral}` |
| `K.dipStation(E,{x,y,w,len})` | barras Ø40 de 0,6 m de largo (`len`) a ±.26 y 1,2 m de alto (`y`); funda de agarre de 20 cm centrada en `x` (donde `grip()` y `K.support` ponen las manos) | `{y,w,grip(x)}` |
| `K.mat(E,c,[l,w],{th,yaw})` | 8 mm | `{top}` (la y donde se apoya el cuerpo) |
| `K.landmine(E,pivot,end,{L,plates})` | barra fija de 1,95 m desde el pivote | `{ax,tip,collar,grip,R,L}` (la longitud se impone: haz IK a `grip`) |
| `K.medball(E,c,r,{kind})` | `med` r .12, `slam`, `wall` r .17 | `{c,r,palm(dir)}` |
| `K.plate(E,c,n,{r,th})` | | `{c,n,r,th,top}` |
| `K.sled(E,c,{yaw,plates,post})` | patines 1,06 m, postes 1,15 m atrás (-X) | `{hi:[R,L],lo:[R,L],ax:[R,L],hook}` |
| `K.battleRope(E,anchor,hand,phase,{amp,lam,r})` | Ø38 mm; onda que viaja al anclaje | `{pts}`; mano: `y += K.ropeHand(phase,amp)` |
| `K.jumpRope(E,hR,hL,phase,{ax,R,y})` | 0 abajo (bajo los pies) → .25 detrás → .5 arriba | `{pts,low}`; salto máximo en phase 0 |
| `K.wall(E,{x,h,w,target})` | pared en x mirando a -X, diana opcional | `{x,n}` |

### Máquinas de cardio
- `K.rowerGeo({x})` → `{X,SY (.36 asiento),RY,feet:{R,L}:{heel,f,u},exit,rest,hw}` (geometría sin dibujar: úsala para
  colocar el cuerpo) y `K.rower(E,{x,seatX,handle})` (dibuja raíl, volante, monitor, placas, asiento en `seatX`, cadena y
  maneral en `handle`). Pies: `b.footFlat(s,G.feet[s].heel,0,G.feet[s].u)`. Manos: `handle ± [0,0,.17]`. (demo_rower)
- `K.stairClimber(E,{x,y0,rise,run,w,phase,n})` → `{steps,step(i),rail(x,s),railAx,rs,rn}`; los escalones bajan un
  escalón por `phase` 0→1. Con un ciclo de dos pasos usa `phase=(2*cyc)%1` y posiciones continuas
  `x=X+(j-2cyc)·run, y=y0+(j-2cyc)·rise` para el pie apoyado. **El pie en vuelo debe ir al escalón que sigue bajando**
  (`pos(j0+2,t)`, no `pos(j0+2,1)`), llegar antes del final del vuelo y no bajar nunca de su huella: si no, aterriza
  dentro del escalón. Asas laterales casi horizontales de `x-.2` a `x+.55`, ~0,95–1,05 m sobre el escalón 1 (cintura),
  unidas a la consola; `rail(x,s)` da el punto del asa a esa x. (demo_stair)
- `K.airBike(E,{cyc})` → `{seat,ped:{R,L},crank:{R,L},hand:{R,L},hax:{R,L},BB}` (brazos acoplados a las bielas). Pedales
  a z ±.14, por fuera de la biela; la palanca baja y la biela de unión van por dentro (z ±.05) y no cruzan el pie. (demo_airbike)
- `K.skiErg(E,{x,hR,hL})` → `{top:{R,L},x,base}` (cuerdas a los puños; de pie sobre `base` = .05, plataforma de
  1,2 × 0,6 m de `x-1.05` a `x+.15`). Pon los talones ≈ .83 m detrás de la columna (`fx = x-.83`): más cerca, la cabeza
  entra en el monitor al hacer la bisagra. (demo_skierg)

---------------------------------------------------------------------------------------------------------------
## 4. Receta de un ejercicio con el kit
1. Elige la postura base (`stand`/`lie`/`quad`/`plank`/`hang`/`support`/`seat`/`kneel`) y anima sus parámetros con `c.p`.
2. Dibuja el equipamiento **con la geometría que salga del cuerpo** (barra en `b.tpt(0,-.03,-.064)`, mancuerna en el puño…)
   o coloca el cuerpo a partir de lo que devuelve el equipo (pedales, asas, escalones, placas del remo).
3. IK de los miembros que falten a los puntos de contacto devueltos (`grip`, `hands`, `horns`, `hi`, `ped`…).
4. Comprueba con `shot.sh` (vistas de control) y que `max IK err` sea 0.

## 5. Trampas conocidas
- **Cachés y `GA.alias`**: `GA.alias(key,target,patch)` crea `Object.assign({},base,patch)` → `this` en `build` es ese
  objeto. Una caché de módulo (`let gob=null`, `const PU={}`) calculada con la geometría de la base es **incorrecta** para
  una alias que cambia parámetros, y una propiedad guardada en `this` se **copia por referencia** a la alias si la base ya se
  pintó antes de resolverla (comparten el mismo objeto). Usa `K.memo(this,'clave',()=>…)`: WeakMap con clave el spec, no se
  copia. Escribe `build(c,b,E){…}` (método), nunca `build:(c,b,E)=>{…}` (`this` no sería el spec: en un archivo sin
  `'use strict'` sería `window` y todas las variantes compartirían la caché). `K.memo` lanza un error en ese caso. Los
  helpers que reciben el spec como `ctx` (p. ej. `SQ(this,b,…)`) deben pasarlo desde el `build` método.
- **`b.ikErr` es un máximo acumulado**: cualquier `E.solve`/`K.root` que llame a `b.arm`/`b.leg` en valores extremos lo
  ensucia. Los helpers del kit lo restauran; en tus propias resoluciones (p. ej. dentro de `K.memo`) pon `b.ikErr=0` antes
  de la pose final (ver `demo_kettlebell`, `demo_trapbar`).
- **Orden**: `K.shift`/`K.rest` mueven el tronco: llámalos antes de brazos/piernas. Si un helper ya colocó un miembro y lo
  quieres distinto, vuelve a llamarlo después (bird-dog). `K.quad`/`K.plank`/`K.armsFloor` dibujan palmas: no apoyes con
  ellos un brazo que luego vas a mover (`arms:'L'`).
- **Coste por fotograma**: `build` se ejecuta ~62 veces al encuadrar (`fitCam`) y en cada fotograma. Evita bisecciones
  anidadas de 40 pasos (`K.hang` costaba 40 ms con ellas; con `K.root` 6 ms). Memoiza lo que no depende de `c`.
  Coste medido de las demos: 0,3–6 ms por fotograma (`lib_rdl_db` 7,8 ms como referencia).
- **Contactos con el suelo**: `b.footFlat` hunde la suela .8 cm (convención del motor); `K.footOn`/`K.footBallOn` apoyan
  exacto (si mezclas los dos en el mismo pie, resta .008 a `K.footBallOn` para que no salte al cambiar). Rodilla en el
  suelo a `y+.056`. Tumbado de lado el hombro es más ancho que la cadera: `incl:'auto'`; apoya la cabeza en el brazo con
  `headY`. El pie de la pierna de abajo (de lado) se apoya resolviendo la tibia: `K.root` sobre su componente y con
  `K.gap` de `K.shoe(ank,S.ffwd,S.fup)` contra la esterilla (demo_side). Cuerpo sobre esterilla: pasa `y:mat.top` (y `fy/hy`
  en `K.plank`). Boca abajo con los brazos en Y apoyados: objetivo del puño a alcance completo (`armD(6)`) a `y+.045`.
- **Trayectorias que cruzan el equipo**: una interpolación recta entre dos poses no rodea nada. Kettlebell por encima de la
  cabeza: arco hacia delante (`+.12·sin(π·e)` en x, demo_seat_box). Pie que sube al cajón: primero en vertical hasta la
  altura del cajón y luego adelante (demo_box: la punta salva el borde con ≈5 cm). Barra Z abajo: ≥22° de antebrazo para
  que el eje quede delante de los muslos.
- **Grupos de pintado**: soportes bajo el cuerpo (esterilla, cajón, banco, fitball) van con `layer:-1` (ya lo hacen los
  helpers). Las cuerdas de batalla son un grupo por cuerda (sin contornos entre tramos); no agrupes piezas largas que deban
  quedar a la vez delante y detrás del cuerpo.
- **Cámaras para el suelo** (persona ≈1,8 m a lo largo de X y ≈0,5 m de alto en un cuadro 340×200):
  - Boca abajo / plancha / flexión / cuadrupedia (cabeza hacia +X): `yaw 25–35, pitch 10–18` (3/4 desde delante-derecha:
    se ven cara, brazos y la línea del cuerpo). Boca arriba con la cabeza hacia -X: `yaw -25…-35, pitch 14–20` (la cara
    hacia la cámara). Evita `yaw 0` (el lado lejano desaparece y queda plano) y `yaw 90` (escorzo total).
  - De lado (mirando a +Z): cámara frente al pecho, `yaw 0–20, pitch 20–26`.
  - La esterilla no debe ser mucho más larga que el cuerpo (entra en el encuadre y encoge a la persona); usa `fitBox` con
    `y` de 0 a ~0,7 si sobra altura.
  - Equipos altos o largos (dominadas 2,4 m, escaladora, SkiErg, cuerdas de batalla de 3 m, remo de 2,4 m): `fitBox`
    alrededor de la persona; deja fuera el anclaje lejano si hace falta (se dibuja igual).
  - Postes en primer plano (dominadas `posts`, rack): gira la cámara para que el poste cercano quede a un lado del cuerpo
    o usa `kind:'tower'`.
- **Anclajes**: el extremo de una banda va a la cara del poste/anclaje (no en el aire delante); en demo_band, cincha
  `K.COL.strap` alrededor del poste y los dos ramales salen de su cara.
- **Equipos en la misma escena** (galerías): comprueba las huellas en la vista cenital; el trineo con `yaw:90` ocupa
  ≈1,06 m en z desde su centro.

## 6. Demos (`demo/kit_demo.js`, claves `demo_*`)
kettlebell (stand+balance+kettlebell) · band (band+handle, poste) · trx (footOn, cuerpo rígido, trx) · pushup ·
pushup_incline (plank hy + box bench) · pushup_knees · plank_forearm · quadruped (quad + bird-dog) ·
bridge (supine incl + armsFloor + miniband + mat) · prone (prone + mat) · side (sideLie auto + miniband) ·
hang (pullupBar posts + hang) · hang_door (door + supino) · dip (dipStation + support) · fitball (seat ball + medball) ·
abwheel (kneel + abWheel) · jumprope (footBallOn + jumpRope) · rower · stair · airbike · skierg · sled ·
battlerope · landmine (kneel half) · barbell (rack + barbell + balance) · trapbar · ezbar · box (step-up) · plate ·
wall (wall + medball wall) · seat_box (seat + box + horns) · gallery_a / gallery_b (variantes sin persona).
