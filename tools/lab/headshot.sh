#!/usr/bin/env bash
# Hoja de cabezas ampliadas (headlab.html) con todos los ex/ en el orden de build.js.
# Uso: bash headshot.sh <out.png> "<query: &keys=a,b | &from=0&count=60, &n=2, &yaw=60>" [ancho,alto ventana]
LAB="$(cd "$(dirname "$0")" && (pwd -W 2>/dev/null || pwd))"
case "$LAB" in /*) URLBASE="file://$LAB";; *) URLBASE="file:///$LAB";; esac  # macOS/Linux: /ruta · Windows: C:/ruta
OUT="$1"; EXTRA="${2:-}"; WIN="${3:-1500,2400}"
FIX="_kit.js ref.js ref2.js legs_mach.js legs_free.js chest.js back.js shoulders.js biceps.js triceps.js core.js cardio.js"
FILES=""; for f in $FIX; do FILES="$FILES,ex/$f"; done
for f in $(cd "$LAB/ex" && ls *.js | sort); do case " $FIX " in *" $f "*) ;; *) FILES="$FILES,ex/$f";; esac; done
FILES="${FILES#,}"
PROF="$LAB/.prof_h$$_$RANDOM"
CHROME="${CHROME:-/c/Program Files/Google/Chrome/Application/chrome.exe}"  # ruta configurable con la variable CHROME
case "$OUT" in /*|?:*) ABSOUT="$OUT";; *) ABSOUT="$LAB/$OUT";; esac
rm -f "$ABSOUT"; mkdir -p "$(dirname "$ABSOUT")"
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --user-data-dir="$PROF" --virtual-time-budget=20000 --window-size="$WIN" \
  --screenshot="$ABSOUT" "$URLBASE/headlab.html?files=$FILES$EXTRA" >/dev/null 2>&1
rm -rf "$PROF" 2>/dev/null
[ -f "$ABSOUT" ] && echo "OK $ABSOUT" || echo "FAIL"
