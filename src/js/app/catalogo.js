// ══════════════════════════════════════════════════════════
// BIBLIOTECA DE EJERCICIOS (catálogo)
// Una fila por ejercicio en LIB_ROWS (la genera tools/catalog/rows.js desde tools/catalog/catalog.json), 19 columnas:
//   id|n|ic|eq|muscle|s|r|lt|mat|pl|dif|x|pat|mus|alt|why|up|al|tip
// Las 46 de siempre van primero y no cambian (ids, nombres y campos: están en tus planes, tu historial y tus backups).
// Objeto: {id,n,ic,eq,muscle,s,r,tip,compound|cardio, al,mat,pl,dif,lt,x,pat,mus,alt,why,up} (congelado). Las copias del
// plan solo llevan los campos de siempre (_libCopy): lo demás se lee del catálogo por su lib (exLib).
// ══════════════════════════════════════════════════════════
// Grupos musculares en orden y sus etiquetas (rec.muscle se guarda: nunca cambiar ni quitar un id)
const MUSCLE_GROUPS=[
  {id:'piernas',label:'Piernas'},
  {id:'pecho',label:'Pecho'},
  {id:'espalda',label:'Espalda'},
  {id:'hombros',label:'Hombros'},
  {id:'biceps',label:'Bíceps'},
  {id:'triceps',label:'Tríceps'},
  {id:'core',label:'Core / Abdomen'},
  {id:'cardio',label:'Cardio'},
];
// Tipo de registro: w peso × reps · bw peso corporal (lastre opcional) · r solo reps (bandas, TRX…) · t tiempo · d distancia · c cardio
const LT=['w','bw','r','t','d','c'];
// Material (una clave por ejercicio): l nombre · eq equipo que se enseña si la fila no trae otro (si falta, l) · cls clase de
// carga (loadEqClass; maq y polea según sea multiarticular, ver LOAD_EQ) · free no es una estación que se pueda ocupar
// («¿Máquina ocupada?») · home sale en «Mi material» (sin material siempre está) · ic su emoji (selector) · mach es una
// máquina del gimnasio (el filtro «Sin máquina» la quita)
const MAT={
  barra:{l:'Barra',ic:'🏋️',cls:'barra'},barraz:{l:'Barra Z',ic:'🏋️',cls:'barra',free:1},smith:{l:'Smith',ic:'🏗️',cls:'barra',mach:1},
  mancuernas:{l:'Mancuernas',ic:'💪',cls:'manc',free:1,home:1},kettlebell:{l:'Kettlebell',ic:'🔔',cls:'kb',free:1,home:1},
  disco:{l:'Disco',ic:'💿',cls:'disco',free:1},balon:{l:'Balón medicinal',ic:'🏐',cls:'disco',free:1,home:1},otro:{l:'Otro material',ic:'🧰',cls:'disco',home:1},
  mochila:{l:'Mochila, garrafas o chaleco',ic:'🎒',cls:'disco',free:1,home:1}, // (E14b, §K.3) carga en casa sin comprar nada
  maquina:{l:'Máquina',ic:'⚙️',cls:'maq',mach:1},polea:{l:'Polea',ic:'⚡',cls:'polea',mach:1},
  corporal:{l:'Sin material',ic:'🤸',eq:'Peso corporal',cls:'bw',free:1},dominadas:{l:'Barra de dominadas',ic:'🧗',cls:'bw',home:1},
  banda:{l:'Banda elástica',ic:'➰',cls:'banda',free:1,home:1},minibanda:{l:'Minibanda',ic:'⭕',cls:'banda',free:1,home:1},
  trx:{l:'TRX o anillas',ic:'🔗',cls:'none',free:1,home:1},fitball:{l:'Fitball',ic:'🔵',cls:'none',free:1,home:1},rueda:{l:'Rueda abdominal',ic:'🛞',cls:'none',free:1,home:1},
  comba:{l:'Comba',ic:'🪢',cls:'none',free:1,home:1},step:{l:'Step o cajón',ic:'📦',cls:'none',free:1,home:1},cardio:{l:'Máquina de cardio',ic:'🏃',cls:'none',mach:1}};
// Patrón de movimiento (alternativas de «¿Máquina ocupada?» y del Coach): nombre y patrones cercanos
const PAT_LBL={squat:'Sentadilla',lunge:'Zancada',knee_ext:'Extensión de rodilla',knee_flex:'Flexión de rodilla',hinge:'Bisagra de cadera',
  hip_ext:'Extensión de cadera',hip_abd:'Abducción',hip_add:'Aducción',calf:'Gemelo',push_h:'Empuje horizontal',fly:'Aperturas',pull_v:'Jalón vertical',
  pull_h:'Remo',rear:'Hombro posterior',raise:'Elevación lateral',raise_f:'Elevación frontal',push_v:'Empuje vertical',shrug:'Encogimiento',
  curl:'Curl de bíceps',tri:'Extensión de tríceps',forearm:'Antebrazo',core:'Flexión de tronco',core_iso:'Estabilidad',core_rot:'Rotación de tronco',
  carry:'Acarreo',plyo:'Pliometría',full:'Cuerpo completo',bal:'Equilibrio',cardio:'Cardio'};
const PAT_NEAR={squat:['knee_ext','lunge'],knee_ext:['squat'],knee_flex:['hinge'],hinge:['knee_flex','hip_ext'],push_h:['fly'],fly:['push_h'],push_v:['raise','push_h'],
  raise:['push_v','raise_f'],raise_f:['raise','push_v'],rear:['pull_h','raise'],pull_v:['pull_h'],pull_h:['pull_v','rear'],core:['core_iso'],core_iso:['core','carry'],
  lunge:['squat','hinge'],hip_ext:['hinge'],shrug:['pull_h'],forearm:['curl'],core_rot:['core','core_iso'],carry:['core_iso'],plyo:['squat','lunge'],full:['squat','hinge'],bal:[]};
// Músculos (las 21 claves del motor GymAnim, sin lado) y su nombre (fichas y búsqueda de los que no tienen animación)
const MUS_LBL={quads:'Cuádriceps',hams:'Isquiotibiales',adductors:'Aductores',calves:'Gemelos',biceps:'Bíceps',triceps:'Tríceps',
  frontdelts:'Deltoides ant.',sidedelts:'Deltoides lateral',reardelts:'Deltoides post.',forearms:'Antebrazo',glutes:'Glúteos',abductors:'Glúteo medio',
  abs:'Abdomen',obliques:'Oblicuos',lowback:'Lumbares',pecs:'Pectoral',upperpecs:'Pectoral superior',lowerpecs:'Pectoral inferior',
  lats:'Dorsales',midback:'Romboides',traps:'Trapecio'};
const MUS_KEYS=Object.keys(MUS_LBL);
// Filas que no valen: se apuntan aquí y se descartan (la app sigue). Va antes del parser (que escribe en ella).
const LIB_ERRORS=[];
