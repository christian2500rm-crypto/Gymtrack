// ═══════════════════════════════════════════════════════════
// ICONOS DE LÍNEA
// ═══════════════════════════════════════════════════════════
// Un solo juego de iconos (24×24, trazo de 1,9 px, extremos redondos) que toma el color del texto. Sustituye a los emojis que
// hacían de icono: cada móvil los dibuja distinto y no siguen la paleta. Los emojis se quedan donde son contenido (frases del
// «Wrapped», pictograma de cada ejercicio y de cada material, opciones del cuestionario).
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
