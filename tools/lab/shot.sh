#!/usr/bin/env bash
# Uso: bash shot.sh <exKey[,key2]> <files(coma, relativos a lab/)> <out.png> [query extra] [ancho,alto ventana]
# Ej.: bash shot.sh lib_squat_smith ex/legs.js shots/squat.png "&n=6" 1440,1000
LAB="$(cd "$(dirname "$0")" && (pwd -W 2>/dev/null || pwd))"
case "$LAB" in /*) URLBASE="file://$LAB";; *) URLBASE="file:///$LAB";; esac  # macOS/Linux: /ruta · Windows: C:/ruta
KEY="$1"; FILES="$2"; OUT="$3"; EXTRA="${4:-}"; WIN="${5:-1440,1000}"
WIN="${WIN/x/,}"
PROF="$LAB/.prof_$$_$RANDOM"
CHROME="${CHROME:-/c/Program Files/Google/Chrome/Application/chrome.exe}"  # ruta configurable con la variable CHROME
[ -f "$CHROME" ] || CHROME="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
case "$OUT" in /*|?:*) ABSOUT="$OUT";; *) ABSOUT="$LAB/$OUT";; esac
rm -f "$ABSOUT"; mkdir -p "$(dirname "$ABSOUT")"
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --user-data-dir="$PROF" --virtual-time-budget=3000 --window-size="$WIN" \
  --screenshot="$ABSOUT" "$URLBASE/lab.html?ex=$KEY&files=$FILES$EXTRA" >/dev/null 2>&1
rm -rf "$PROF" 2>/dev/null
[ -f "$ABSOUT" ] && echo "OK $ABSOUT" || echo "FAIL"
