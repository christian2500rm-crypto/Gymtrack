// ═══════════════════════════════════════════════════════════
// ICONOS DE LÍNEA
// ═══════════════════════════════════════════════════════════
// Un solo juego de iconos (24×24, trazo de 1,9 px, extremos redondos) que toma el color del texto. Sustituye a los emojis que
// hacían de icono: cada móvil los dibuja distinto y no siguen la paleta. Los emojis se quedan donde son contenido (frases del
// «Wrapped» y lo que escribes tú). Donde un concepto no tiene un icono que se entienda sin leer, no lleva ninguno.
//   ic('trophy')        → el icono, para escribirlo en una plantilla
//   icE('🏆')           → el icono de un emoji que viene en los datos (propuestas e ideas del Coach guardan su emoji); si no
//                         tiene icono, devuelve el propio carácter escapado
//   icT('🧘 Descarga…') → un texto para pintar como HTML: lo escapa, cambia por su icono el emoji que lo abre y quita el de adorno
//                         que lo cierra ({fin:false} lo deja; {html:true} si el texto ya es HTML)
const ICONOS={
  trophy:'<path d="M7.5 4h9v5a4.5 4.5 0 0 1-9 0z"/><path d="M7.5 6H5v1.2A3.3 3.3 0 0 0 8 10.5M16.5 6H19v1.2a3.3 3.3 0 0 1-3 3.3M12 13.5V17M8.5 20h7M9.5 17h5"/>',
  target:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>',
  flame:'<path d="M12 3c.6 3 4.8 5.2 4.8 10.2a4.8 4.8 0 0 1-9.6 0c0-1.8.7-3.2 1.7-4.3.4 1.6 1.2 2.3 2 2.3-.5-2.8-.2-5.7 1.1-8.2z"/>',
  leaf:'<path d="M5 19C5 10.5 10 5.5 19 5c0 9-5 14-13.5 14"/><path d="M5 19c2.5-4.5 5.5-7.5 9.5-9.5"/>',
  moon:'<path d="M19.5 14.2A8 8 0 1 1 9.8 4.5a6.3 6.3 0 0 0 9.7 9.7z"/>',
  scale:'<rect x="4" y="4.5" width="16" height="15" rx="3.5"/><path d="M8.5 9.5a5 5 0 0 1 7 0M12 9.5l1.6-2.2"/>',
  check:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  done:'<circle cx="12" cy="12" r="8.5"/><path d="m8.3 12.3 2.5 2.5 4.9-5.3"/>',
  clock:'<circle cx="12" cy="13" r="7.5"/><path d="M12 9.5V13l2.3 1.8M9.5 3h5"/>',
  hourglass:'<path d="M7 4h10M7 20h10M8 4c0 4 4 5 4 8s-4 4-4 8M16 4c0 4-4 5-4 8s4 4 4 8"/>',
  trend:'<path d="m3.5 17 5.5-5.5 4 4 7.5-8"/><path d="M15.5 7.5h5v5"/>',
  trenddown:'<path d="m3.5 7 5.5 5.5 4-4 7.5 8"/><path d="M15.5 16.5h5v-5"/>',
  chart:'<path d="M4 20h16M7.5 20v-6.5M12 20V6M16.5 20v-10"/>',
  bulb:'<path d="M9.5 18.5h5M10.5 21h3M12 3.5a6 6 0 0 0-3.6 10.8c.6.5.9 1.1.9 1.8h5.4c0-.7.3-1.3.9-1.8A6 6 0 0 0 12 3.5z"/>',
  sparkles:'<path d="m11 4.5 1.7 4.3 4.3 1.7-4.3 1.7-1.7 4.3-1.7-4.3L5 10.5l4.3-1.7z"/><path d="m18.5 15 .7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
  refresh:'<path d="M19 12a7 7 0 0 1-12.3 4.6M5 12a7 7 0 0 1 12.3-4.6"/><path d="M17.5 3.5v4h-4M6.5 20.5v-4h4"/>',
  alert:'<path d="M12 4.5 20.5 19h-17z"/><path d="M12 10v4.2M12 16.7v.2"/>',
  bolt:'<path d="M13 3 5.5 13.5H11L10 21l8-11h-5.5z"/>',
  calendar:'<rect x="4" y="5.5" width="16" height="14.5" rx="3"/><path d="M4 10h16M8.5 3.5V7M15.5 3.5V7"/>',
  flag:'<path d="M6 21V4h11l-2.2 4 2.2 4H6"/>',
  activity:'<path d="M3 12h4l2.5-6.5 4.5 13 2.5-6.5H21"/>',
  wrench:'<path d="M15.5 4.5a4.2 4.2 0 0 0-3.9 5.8l-6.8 6.8a1.5 1.5 0 0 0 2.1 2.1l6.8-6.8a4.2 4.2 0 0 0 5.8-3.9l-2.8 2.3-2.5-.7-.7-2.5z"/>',
  plus:'<path d="M12 5.5v13M5.5 12h13"/>',
  sprout:'<path d="M12 20v-8M12 12c0-3.5-2.5-5.5-6.5-5.5 0 3.5 2.5 5.5 6.5 5.5zM12 14c0-3 2-4.8 6-4.8 0 3-2 4.8-6 4.8z"/>',
  note:'<path d="M7 3.5h7.5L18 7v13.5H7z"/><path d="M10 11h5M10 14.5h5"/>',
  pause:'<path d="M9 6v12M15 6v12"/>',
  bell:'<path d="M6.5 17v-6a5.5 5.5 0 0 1 11 0v6l1.5 1.5H5zM10.5 20.5h3"/>',
  belloff:'<path d="M6.5 17v-6a5.5 5.5 0 0 1 11 0v6l1.5 1.5H5zM10.5 20.5h3M4 4l16 16"/>',
  sun:'<circle cx="12" cy="12" r="3.8"/><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M18 6l-1.4 1.4M7.4 16.6 6 18"/>',
  dumbbell:'<path d="M6.5 6v12M17.5 6v12M3.5 9v6M20.5 9v6M6.5 12h11"/>',
  expand:'<path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/>',
  // Onboarding y «Mi material»: opciones del cuestionario, tipos de sitio y estados vacíos
  clipboard:'<rect x="5.5" y="4.5" width="13" height="16" rx="2.5"/><path d="M9.5 4.5v-1h5v1M9 10h6M9 13.5h6M9 17h3.5"/>',
  upload:'<path d="M12 15.5V4.5M7.5 9 12 4.5 16.5 9M5 19.5h14"/>',
  heart:'<path d="M12 19.5S4.8 15.3 4.8 9.8A3.9 3.9 0 0 1 12 7.7a3.9 3.9 0 0 1 7.2 2.1c0 5.500-7.200 9.700-7.200 9.700z"/>',
  battery:'<rect x="3.500" y="8" width="15.500" height="8" rx="2.200"/><path d="M21.200 11v2M7.200 11v2M10.700 11v2M14.200 11v2"/>',
  kettlebell:'<path d="M8 10V8.300a4 4 0 0 1 8 0V10"/><path d="M7 10h10a6.500 6.500 0 0 1 1.800 4.500 6.800 6 0 0 1-13.600 0A6.500 6.500 0 0 1 7 10z"/>',
  balance:'<path d="M12 4.500v15M8.500 19.500h7M5.500 7.500h13M5.500 7.500 3.200 13a2.500 2.500 0 0 0 4.600 0zM18.500 7.500 16.200 13a2.500 2.500 0 0 0 4.600 0z"/>',
  plant:'<path d="M12 20.500V8M12 14.200c0-2.600-1.900-4.200-5-4.200 0 2.600 1.900 4.200 5 4.200zM12 16.800c0-2.400 1.800-3.800 4.800-3.800 0 2.400-1.800 3.800-4.800 3.800zM12 8c0-2.200 1.300-3.700 3.600-4.200.1 2.400-1.200 3.800-3.600 4.200z"/>',
  question:'<circle cx="12" cy="12" r="8.500"/><path d="M9.600 9.700a2.500 2.500 0 1 1 3.700 2.200c-.8.500-1.300 1-1.300 1.900M12 16.700v.200"/>',
  sofa:'<path d="M6 11V8.500A2.500 2.500 0 0 1 8.500 6h7A2.500 2.500 0 0 1 18 8.500V11"/><path d="M3.500 13a2 2 0 0 1 4 0v2h9v-2a2 2 0 0 1 4 0v4.500h-17zM6 17.500V19.500M18 17.500V19.500"/>',
  walk:'<circle cx="12.500" cy="4.500" r="1.700"/><path d="M12.500 8.500 11 14l-2.500 6M11 14l3 2.200 1 4.300M12.500 8.500 9.200 10.300 8.500 13.500M12.500 8.500l2.300 3 2.700.800"/>',
  run:'<circle cx="15" cy="4.500" r="1.700"/><path d="m13.500 8-2.700 5 3.700 2.500-1 5M10.800 13 8.500 16.500H4.500M13.500 8l-3.700.500L7.500 11.500M13.500 8l2.500 3.200h3.500"/>',
  waves:'<path d="M3 8c1.500-1.500 3-1.500 4.500 0s3 1.500 4.500 0 3-1.500 4.500 0 3 1.500 4.500 0M3 12.500c1.500-1.500 3-1.500 4.500 0s3 1.500 4.500 0 3-1.500 4.500 0 3 1.500 4.500 0M3 17c1.500-1.500 3-1.500 4.500 0s3 1.500 4.500 0 3-1.500 4.500 0 3 1.500 4.500 0"/>',
  home:'<path d="M4 11.500 12 4.500l8 7M6 10v9.500h12V10M10 19.500v-5h4v5"/>',
  building:'<rect x="5" y="3.500" width="14" height="17" rx="1.800"/><path d="M9 7.500h1.500M13.500 7.500H15M9 11h1.500M13.500 11H15M9 14.500h1.500M13.500 14.500H15M10.500 20.500V18h3v2.500"/>',
  store:'<path d="M4.500 9.500 6 4.500h12l1.500 5M4.500 9.500a2.500 2.500 0 0 0 5 0 2.500 2.500 0 0 0 5 0 2.500 2.500 0 0 0 5 0M6 12v7.500h12V12M10 19.500v-4h4v4"/>',
  bed:'<path d="M3.500 18.500V6M3.500 14.500h17v4M20.500 14.500v-2a3 3 0 0 0-3-3h-6v5"/><circle cx="7.500" cy="11.500" r="1.600"/>',
  person:'<circle cx="12" cy="5" r="2"/><path d="M12 9v6.500M7.500 11.500h9M12 15.500 9 20.500M12 15.500l3 5"/>',
  bench:'<rect x="3.500" y="9" width="17" height="3.500" rx="1.500"/><path d="M7 12.500V19M17 12.500V19M5 19h4M15 19h4"/>',
  rack:'<path d="M6.500 3.500v17M17.500 3.500v17M4.500 20.500h4M15.500 20.500h4M6.500 9h11M3.500 7v4M20.500 7v4"/>',
  tree:'<path d="M12 20.500v-6M12 14.500c-3.200 0-5.500-2.300-5.500-5.300S8.800 3.500 12 3.500s5.500 2.700 5.500 5.700-2.300 5.300-5.500 5.300zM9 20.500h6"/>',
  pencil:'<path d="m4.500 19.500 1-4L16 5a2.100 2.100 0 0 1 3 3L8.500 18.500zM14.500 6.500l3 3"/>',
  search:'<circle cx="11" cy="11" r="6.500"/><path d="m16 16 4 4"/>',
  // Esfuerzo de la serie: una, dos o tres barras (fácil, justo, al límite)
  e1:'<path d="M6 18v-3"/><path d="M12 18v-7.5" opacity=".28"/><path d="M18 18V6" opacity=".28"/>',
  e2:'<path d="M6 18v-3"/><path d="M12 18v-7.5"/><path d="M18 18V6" opacity=".28"/>',
  e3:'<path d="M6 18v-3"/><path d="M12 18v-7.5"/><path d="M18 18V6"/>',
};
function ic(n,cls){const p=ICONOS[n];return p?`<svg class="ic ic-${n}${cls?' '+cls:''}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${p}</svg>`:'';}
// Emoji → icono. Solo los que hacen de icono en la app; el resto se pinta tal cual.
const ICONO_DE={'🏆':'trophy','🎖':'trophy','🎯':'target','🔥':'flame','🧘':'leaf','🌴':'moon','💤':'moon','⚖':'scale','✅':'done','⏱':'clock','⏳':'hourglass',
  '📈':'trend','📉':'trenddown','📊':'chart','🧠':'chart','💡':'bulb','🎉':'sparkles','✨':'sparkles','🚀':'sparkles','🔄':'refresh','🔀':'refresh','⚠':'alert','⚡':'bolt',
  '📅':'calendar','⏰':'flag','🚶':'activity','🏃':'activity','🚴':'activity','🔧':'wrench','➕':'plus','🌱':'sprout','📝':'note','⏸':'pause','🔔':'bell','🔕':'belloff',
  '🔆':'sun','💪':'dumbbell'};
const _icKey=e=>String(e==null?'':e).replace(/[️‍]/g,'');
function icE(e,cls){const n=ICONO_DE[_icKey(e)];return n?ic(n,cls):esc(e==null?'':e);}
// Emojis de adorno al final de una frase («…No pasa nada. 💪», «Una más 🔥»): con iconos de línea sobran, se quitan
const _IC_FIN=/\s*(?:💪|👍|✊|🎯|🧘|🌴|🔥|🎉|👋)️?\s*$/u;
const _IC_INI=new RegExp('^\\s*('+Object.keys(ICONO_DE).join('|')+')\\uFE0F?\\s*','u');
// Frases que nombran la escala de esfuerzo con sus caritas (las escribe el generador: «Esfuerzo: 💪 Justo, te sobran 1-2.»):
// al pintarlas, cada carita pasa a sus barras
function icEsf(h){return String(h==null?'':h).replace(/😌|💪|🥵/gu,m=>ic({'😌':'e1','💪':'e2','🥵':'e3'}[m]));}
// Texto ya montado (HTML) con emojis de adorno al final de sus frases: se quitan todos
function icSin(h){return String(h==null?'':h).replace(/\s*(?:💪|👍|✊|🎯|🧘|🌴|🔥|🎉|👋)\uFE0F?(?=\s|<|$)/gu,'');}
function icT(t,o){
  let s=String(t==null?'':t),pre='';const m=_IC_INI.exec(s);
  if(m){pre=ic(ICONO_DE[m[1]])+' ';s=s.slice(m[0].length);}
  if(!(o&&o.fin===false))s=s.replace(_IC_FIN,'');
  return pre+(o&&o.html?s:o&&o.f?o.f(esc(s)):esc(s)); // o.f: retoque del texto ya escapado (p. ej. _nwX, que junta «80 kg»)
}
