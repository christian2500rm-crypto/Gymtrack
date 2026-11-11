// ══════════════════════════════════════════════════════════
// AJUSTES · Export/Import · Editar peso · Reset · Onboarding
// ══════════════════════════════════════════════════════════
// (M1) Texto de «Sonido del temporizador»: con el descanso apagado solo queda el cronómetro del cardio
function timerSoundDesc(){
  return(_restOn()?'Pitidos suaves 3-2-1 al acabar el descanso y el cardio':'Pitidos suaves 3-2-1 al acabar el cardio')+(Beep._AC()?'':' · este navegador no admite sonido');
}
// Sonido del temporizador (S.timerSound). Al activarlo suena un pitido de prueba (y se desbloquea el audio).
function toggleTimerSound(){
  S.timerSound=S.timerSound===false;
  saveState();
  if(S.timerSound){Beep.preview();RT._resched();}
  else{Beep.cancel();Beep.release();}
  // Actualizar solo la fila (sin re-render: la hoja no salta)
  const row=document.getElementById('set-sound');
  if(row){row.setAttribute('aria-checked',String(S.timerSound));const sw=row.querySelector('.sw');if(sw)sw.classList.toggle('on',S.timerSound);}
  toast(S.timerSound?'🔔 Sonido activado':'🔕 Sonido desactivado');
}
function openSettings(){S.settingsOpen=true;_routineEdOpen=false;_edDragging=false;renderSettings();}
function closeSettings(){S.settingsOpen=false;if(_setRerender){_setRerender=false;render();return;}renderSettings();} // (M1) con el descanso cambiado, la lista de detrás también
function renderSettings(){
  const root=document.getElementById('settings-root');
  if(!root)return;
  if(!S.settingsOpen){
    // El editor de rutina vive en el mismo contenedor: si está abierto se repinta en su sitio (no se cierra)
    // (si algo vació el contenedor, el editor ya no está: cuenta como cerrado)
    if(_routineEdOpen&&root.querySelector('#routine-ed')){if(!_edDragging)renderRoutineEditor();}
    else{_routineEdOpen=false;root.innerHTML='';}
    return;
  }
  _routineEdOpen=false;
  const lw=S.weights.length?S.weights[S.weights.length-1]:null;
  const firstW=S.weights.length?S.weights[0]:null;
  const totalSessions=S.sessions.length;
  const dataSize=new Blob([JSON.stringify(S)]).size;
  const dataSizeKb=(dataSize/1024).toFixed(1);
  // (15b) copia antigua o ninguna con sesiones: la línea de la última copia, en ámbar
  const bkLast=_bkSafeTs(),bkOld=totalSessions>0&&(bkLast==null||Date.now()-bkLast>=BK_DAYS*DAY_MS);
  root.innerHTML=`<div class="hist-over" onclick="if(event.target===this)closeSettings()"><div class="hist-sheet" style="max-height:90vh;max-height:90dvh">
    <div class="hist-sheet-head">
      <div class="hist-sheet-hdl"></div>
      <div class="hist-sheet-title">Ajustes</div>
      <div class="hist-sheet-sub">Datos y preferencias</div>
      <button class="hist-sheet-close" onclick="closeSettings()" aria-label="Cerrar">✕</button>
    </div>
    <div class="hist-sheet-body">
      <div class="sh" style="margin-top:2px">Tu entrenamiento</div>
      <div class="set-section" id="set-train">${trainSectionHtml()}</div>
      <div class="sh">Rutina</div>
      <div class="set-section">
        <div class="set-row" onclick="closeSettings();openRoutineEditor()">
          <div class="set-row-info">
            <div class="set-row-t">Editar rutina</div>
            <div class="set-row-d">Cambia, añade o elimina ejercicios · Ajusta series y reps</div>
          </div>
          <span class="set-row-arrow">›</span>
        </div>
        <div class="set-row" role="button" tabindex="0" onclick="openMyMaterial()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openMyMaterial()}">
          <div class="set-row-info">
            <div class="set-row-t">Mi material</div>
            <div class="set-row-d">${esc(placesSummaryTxt())}</div>
          </div>
          <span class="set-row-arrow">›</span>
        </div>
        ${S.profile&&S.profile.mode==='gen'?'':`        <div class="set-row" onclick="settingsChangeWeeklyTarget()">
          <div class="set-row-info">
            <div class="set-row-t">Días de entrenamiento por semana</div>
            <div class="set-row-d">Tu objetivo semanal · Inicio y Coach se ajustan a este número</div>
          </div>
          <span class="set-row-v">${getWeeklyTarget()} día${getWeeklyTarget()!==1?'s':''}</span>
          <span class="set-row-arrow">›</span>
        </div>
        `}
        ${(()=>{const ar=getActiveRest(),dl=getActiveDeload(),left=dl?Math.max(0,Math.ceil((dl.endTs-Date.now())/86400000)):ar?restDaysLeft(ar):0;
          // (13b) descarga y descanso en una sola fila: sin ninguna, elige; con una en marcha, la termina
          return`<div class="set-row" id="set-recovery" role="button" tabindex="0" onclick="${dl?'endDeload()':ar?'endRestWeek()':'openRecoveryChooser()'}" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click();}">
          <div class="set-row-info">
            <div class="set-row-t">Descarga o descanso</div>
            <div class="set-row-d">${dl?`${esc(deloadTitle(dl))} · ${esc(deloadBackOnTxt(dl))} · toca para terminarla`:ar?'Semana de descanso · el Coach no penaliza tu constancia · toca para terminarla':'Una semana más suave (menos series o menos peso) o sin entrenar · vuelve sola'}</div>
          </div>
          <span class="set-row-v">${dl||ar?plural(left,'día'):'—'}</span>
          <span class="set-row-arrow">›</span>
        </div>`;})()}
      </div>
      <div class="sh">Durante el entreno</div>
      <div class="set-section">
        ${(()=>{const on=_restOn();return`<div class="set-row" id="set-rest" role="switch" tabindex="0" aria-checked="${on}" onclick="toggleRestOn()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleRestOn();}">
          <div class="set-row-info">
            <div class="set-row-t">Descanso entre series</div>
            <div class="set-row-d">Cuenta atrás al marcar cada serie. Apágalo si prefieres descansar a tu aire</div>
          </div>
          <span class="sw${on?' on':''}" aria-hidden="true"><span class="sw-k"></span></span>
        </div>`;})()}
        ${(()=>{const on=_rpeOn();return`<div class="set-row" id="set-rpe" role="switch" tabindex="0" aria-checked="${on}" onclick="toggleRpeOn()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleRpeOn();}">
          <div class="set-row-info">
            <div class="set-row-t">Esfuerzo de cada serie</div>
            <div class="set-row-d">Fácil, justo o al límite tras cada serie: el Coach lo usa para ajustar el salto. Apágalo si no quieres apuntarlo</div>
          </div>
          <span class="sw${on?' on':''}" aria-hidden="true"><span class="sw-k"></span></span>
        </div>`;})()}
        ${(()=>{const on=S.timerSound!==false;return`<div class="set-row" id="set-sound" role="switch" tabindex="0" aria-checked="${on}" onclick="toggleTimerSound()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleTimerSound();}">
          <div class="set-row-info">
            <div class="set-row-t">Sonido del temporizador</div>
            <div class="set-row-d">${timerSoundDesc()}</div>
          </div>
          <span class="sw${on?' on':''}" aria-hidden="true"><span class="sw-k"></span></span>
        </div>`;})()}
        ${(()=>{const on=S.keepAwake!==false;return`<div class="set-row" id="set-awake" role="switch" tabindex="0" aria-checked="${on}" onclick="toggleKeepAwake()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleKeepAwake();}">
          <div class="set-row-info">
            <div class="set-row-t">Pantalla encendida</div>
            <div class="set-row-d">Mientras entrenas, el móvil no se bloquea solo entre series${WL.supported()?'':' · este navegador no lo admite'}</div>
          </div>
          <span class="sw${on?' on':''}" aria-hidden="true"><span class="sw-k"></span></span>
        </div>`;})()}
      </div>
      ${loadStepsSettingsHtml()}
      <div class="sh">Datos personales</div>
      <div class="set-section">
        <div class="set-row" onclick="openEditWeight('first')">
          <div class="set-row-info">
            <div class="set-row-t">Peso corporal inicial</div>
            <div class="set-row-d">Punto de partida para calcular progreso</div>
          </div>
          <span class="set-row-v">${firstW?firstW.v+' kg':'—'}</span>
          <span class="set-row-arrow">›</span>
        </div>
        <div class="set-row" onclick="openEditWeight('last')">
          <div class="set-row-info">
            <div class="set-row-t">Peso corporal actual</div>
            <div class="set-row-d">${lw?(lw.ts&&sameDayTs(lw.ts,Date.now())?'Registrado hoy · tócalo para corregirlo':`Último registro: ${esc(lw.ts?fmtDate(new Date(lw.ts)):(lw.d||'—'))} · tócalo para apuntar el de hoy`):'Apunta tu peso de hoy'}</div>
          </div>
          <span class="set-row-v">${lw?lw.v+' kg':'—'}</span>
          <span class="set-row-arrow">›</span>
        </div>
        <div class="set-row" onclick="settingsChangeStartDay()">
          <div class="set-row-info">
            <div class="set-row-t">Próxima sesión</div>
            <div class="set-row-d">Cambiar si te has saltado un día</div>
          </div>
          <span class="set-row-v">${esc(dayLabel(hoyDayKey()))}</span>
          <span class="set-row-arrow">›</span>
        </div>
      </div>
      <div class="sh">Tus datos</div>
      <div class="set-section">
        <div class="set-row" onclick="exportData()">
          <div class="set-row-info">
            <div class="set-row-t">Guardar copia (JSON)</div>
            <div class="set-row-d">Descarga un archivo JSON con todo tu historial<span class="set-bk${bkOld?' set-bk-old':''}" id="set-bk">${esc(backupLineTxt())}</span></div>
          </div>
          <span class="set-row-v">${dataSizeKb} KB</span>
          <span class="set-row-arrow">›</span>
        </div>
        <div class="set-row" onclick="importData()">
          <div class="set-row-info">
            <div class="set-row-t">Restaurar copia</div>
            <div class="set-row-d">Restaura desde un archivo JSON exportado</div>
          </div>
          <span class="set-row-arrow">›</span>
        </div>
        <div class="set-row" onclick="exportCSV()">
          <div class="set-row-info">
            <div class="set-row-t">Exportar CSV (Excel)</div>
            <div class="set-row-d">Hoja de cálculo con tu historial de fuerza y peso corporal</div>
          </div>
          <span class="set-row-arrow">›</span>
        </div>
        <div class="set-row" onclick="copyDataToClipboard()">
          <div class="set-row-info">
            <div class="set-row-t">Copiar datos (JSON)</div>
            <div class="set-row-d">Útil para trasladar entre dispositivos</div>
          </div>
          <span class="set-row-arrow">›</span>
        </div>
        <div class="set-row" id="set-persist" style="display:none" onclick="storagePersistAsk()" onkeydown="if(event.target===this&&(event.key==='Enter'||event.key===' ')){event.preventDefault();storagePersistAsk()}">
          <div class="set-row-info">
            <div class="set-row-t">Almacenamiento</div>
            <div class="set-row-d"></div>
          </div>
          <span class="set-row-v"></span>
          <span class="set-row-arrow" aria-hidden="true">›</span>
        </div>
      </div>
      <div class="sh">Estadísticas</div>
      <div class="set-section">
        <div class="set-row" style="cursor:default">
          <div class="set-row-info">
            <div class="set-row-t">Sesiones totales</div>
          </div>
          <span class="set-row-v">${totalSessions}</span>
        </div>
        <div class="set-row" style="cursor:default">
          <div class="set-row-info">
            <div class="set-row-t">Registros de peso</div>
          </div>
          <span class="set-row-v">${S.weights.length}</span>
        </div>
        <div class="set-row" style="cursor:default">
          <div class="set-row-info">
            <div class="set-row-t">Mesociclos completados</div>
          </div>
          <span class="set-row-v">${S.mesocycles?.length||0}</span>
        </div>
      </div>
      <div class="sh">Zona de peligro</div>
      <div class="set-section">
        <div class="set-row danger" onclick="resetAllData()">
          <div class="set-row-info">
            <div class="set-row-t">Borrar todos los datos</div>
            <div class="set-row-d">Elimina historial, pesos, sesiones — irreversible</div>
          </div>
          <span class="set-row-arrow">›</span>
        </div>
      </div>
      <div style="text-align:center;padding:18px 14px 24px;font-size:11px;color:var(--text3);font-family:'DM Mono',monospace">
        <div class="set-links" style="margin-bottom:14px"><a href="https://gymteca.com/privacidad" target="_blank" rel="noopener" style="color:var(--text2)">Privacidad</a> · <a href="https://gymteca.com/soporte" target="_blank" rel="noopener" style="color:var(--text2)">Soporte</a> · <a href="https://gymteca.com/" target="_blank" rel="noopener" style="color:var(--text2)">gymteca.com</a></div>
        Gymteca · Schema ${SCHEMA_VERSION}
      </div>
    </div>
  </div></div>`;
  _setPersistFill();
}

function openEditWeight(which){
  const rec=which==='first'?S.weights[0]:S.weights[S.weights.length-1];
  const current=rec?rec.v:'';
  const label=which==='first'?'Peso inicial (kg)':'Peso actual (kg)';
  // «Actual» corrige la pesada de hoy si ya existe; si la última es de otro día, se guarda como pesada nueva de hoy
  const lastIsToday=!!(rec&&rec.ts&&sameDayTs(rec.ts,Date.now()));
  const note=which==='first'?'Corrige tu primer registro (punto de partida).'
    :lastIsToday?'Corrige la pesada de hoy.'
    :rec?`Se guarda como tu peso de hoy. Tu registro del ${esc(rec.ts?fmtDate(new Date(rec.ts)):(rec.d||''))} no cambia.`:'Se guarda como tu peso de hoy.';
  _editWeightTarget=which;
  // Usamos un prompt estilizado mediante confirmModal custom — creamos un modal con input
  const root=document.getElementById('cmodal-root');
  root.innerHTML=`<div class="cmov" onclick="if(event.target===this){document.getElementById('cmodal-root').innerHTML=''}"><div class="cmod">
    <div class="cmod-hdl"></div>
    <div class="cmod-t">${esc(label)}</div>
    <div class="cmod-b" style="margin-bottom:10px">${note}</div>
    <div style="margin-bottom:16px">
      <input class="ob-inp" id="edit-w-inp" type="number" value="${current}" step="0.1" inputmode="decimal" autofocus onkeydown="if(event.key==='Enter')saveEditWeight()"/>
    </div>
    <div class="cmod-btns">
      <button class="btn bs" onclick="document.getElementById('cmodal-root').innerHTML=''">Cancelar</button>
      <button class="btn bp" onclick="saveEditWeight()">Guardar</button>
    </div>
  </div></div>`;
  setTimeout(()=>{const i=document.getElementById('edit-w-inp');if(i)i.focus();},100);
}
let _editWeightTarget=null;
function saveEditWeight(){
  const inp=document.getElementById('edit-w-inp');
  if(!inp)return;
  const v=parseFloat(inp.value);
  if(!v||v<30||v>300){
    inp.classList.add('shake');
    inp.style.borderColor='var(--red)';
    setTimeout(()=>{inp.classList.remove('shake');inp.style.borderColor='';},600);
    toast('Peso fuera de rango (30-300 kg)');
    return;
  }
  let added=false;
  if(_editWeightTarget==='first'&&S.weights.length>0){
    S.weights[0].v=v;
  }else if(_editWeightTarget==='last'&&S.weights.length>0&&S.weights[S.weights.length-1].ts&&sameDayTs(S.weights[S.weights.length-1].ts,Date.now())){
    S.weights[S.weights.length-1].v=v; // corrige la pesada de hoy
  }else{
    // Pesada nueva de hoy: no había registros, o el último es de otro día (ese no se toca)
    S.weights.push({d:fmtDate(new Date()),v,ts:Date.now()});
    added=true;
  }
  saveState();
  document.getElementById('cmodal-root').innerHTML='';
  toast(added?'Peso de hoy guardado':'Peso actualizado');
  renderSettings();render();
}

function settingsChangeStartDay(){
  const root=document.getElementById('cmodal-root');
  root.innerHTML=`<div class="cmov" onclick="if(event.target===this){document.getElementById('cmodal-root').innerHTML=''}"><div class="cmod">
    <div class="cmod-hdl"></div>
    <div class="cmod-t">Próxima sesión</div>
    <div class="cmod-b">Elige el día con el que quieres entrenar la próxima vez.</div>
    <div class="ob-days ob-days3" role="group" aria-label="Días de tu rutina" style="margin-bottom:14px">
      ${(()=>{const p=getPlan(),cur=hoyDayKey();return dayKeys(p).map(d=>{const live=_dayLive(p[d]),f=String(p[d].focus||'').split(/\s*[—–]\s*/)[0].trim();
        return`<button type="button" class="ob-day ${cur===d?'sel':''}" aria-pressed="${cur===d}"${live?` onclick="pickNextDay('${d}')"`:' disabled'}>
        <div class="di" aria-hidden="true">${dayEmoji(p[d])}</div>
        <div class="dn">${esc(dayLabel(d,p))}</div>
        <div class="df">${live?esc(f):'Sin ejercicios'}</div>
      </button>`;}).join('');})()}
    </div>
    <div class="cmod-btns">
      <button class="btn bs" onclick="document.getElementById('cmodal-root').innerHTML=''">Cerrar</button>
    </div>
  </div></div>`;
}
// (E1a) Emoji de un día según su grupo principal (el que más ejercicios de fuerza tiene; a igualdad, el primero), no
// según su letra: con el plan de fábrica sale lo de siempre (A 🦵, B 🏋️, C 🚣)
const DAY_EMOJI={piernas:'🦵',pecho:'🏋️',espalda:'🚣',hombros:'🏋️',biceps:'💪',triceps:'💪',core:'⚡'};
function dayEmoji(day){
  const str=_isPlanDay(day)?day.ex.filter(e=>_isPlainObj(e)&&!e.cardio):[],cnt={};let best=null;
  str.forEach(e=>{const m=e.muscle;if(!m)return;cnt[m]=(cnt[m]||0)+1;if(!best||cnt[m]>cnt[best])best=m;});
  return DAY_EMOJI[best]||(str.length?'🏋️':_isPlanDay(day)&&day.ex.length?'🏃':'📝');
}
function pickNextDay(d){
  if(!_dayLive(getPlan()[d]))return; // (E1a) un día vacío no entra en la rotación
  S.nextDay=d;saveState();
  document.getElementById('cmodal-root').innerHTML='';
  toast(`Próxima sesión: ${dayLabel(d)}`);
  renderSettings();render();
}

function settingsChangeWeeklyTarget(){
  const root=document.getElementById('cmodal-root');
  if(!root)return;
  const cur=getWeeklyTarget();
  const opts=[],ns=[];
  for(let n=WEEKLY_PICK_MIN;n<=WEEKLY_PICK_MAX;n++)ns.push(n);
  if(cur<WEEKLY_PICK_MIN)ns.unshift(cur);else if(cur>WEEKLY_PICK_MAX)ns.push(cur); // (E1b) el 1 o el 7 que ya tenías
  for(const n of ns){
    const sel=n===cur;
    opts.push(`<button onclick="pickWeeklyTarget(${n})" style="flex:0 0 auto;width:46px;height:52px;border-radius:var(--rsm);border:1px solid ${sel?'var(--green)':'var(--border2)'};background:${sel?'var(--green-bg2)':'var(--bg3)'};color:${sel?'var(--green)':'var(--text2)'};font-family:'DM Mono',monospace;font-size:20px;font-weight:600;cursor:pointer;transition:all .15s" aria-label="${n} días por semana" aria-pressed="${sel}">${n}</button>`);
  }
  root.innerHTML=`<div class="cmov" onclick="if(event.target===this){document.getElementById('cmodal-root').innerHTML=''}"><div class="cmod">
    <div class="cmod-hdl"></div>
    <div class="cmod-t">Días por semana</div>
    <div class="cmod-b">¿Cuántas sesiones quieres hacer cada semana? La pantalla de Inicio y el Coach se ajustarán a tu objetivo. La rotación de tus días y tu historial no cambian. Para añadir o quitar días de tu rutina, usa «Editar rutina».</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:16px">
      ${opts.join('')}
    </div>
    <div class="cmod-btns">
      <button class="btn bs" onclick="document.getElementById('cmodal-root').innerHTML=''">Cerrar</button>
    </div>
  </div></div>`;
}
function pickWeeklyTarget(n){
  const v=Math.min(WEEKLY_TARGET_MAX,Math.max(WEEKLY_TARGET_MIN,parseInt(n)||WEEKLY_TARGET_DEFAULT));
  S.weeklyTarget=v;
  saveState();
  document.getElementById('cmodal-root').innerHTML='';
  toast(`Objetivo: ${v} día${v!==1?'s':''} por semana`);
  renderSettings();render();
}

