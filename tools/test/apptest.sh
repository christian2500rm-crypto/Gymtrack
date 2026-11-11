#!/usr/bin/env bash
# Ejecuta JS (corto) dentro de la app con datos sembrados y muestra RESULT (valor devuelto, admite Promise) y ERRORS.
# Uso: bash tools/test/apptest.sh "<js>" ["&empty=1" | "&fresh=1" | "&wait=1500"]
exec node "$(dirname "$0")/kit.js" prueba "$@"
