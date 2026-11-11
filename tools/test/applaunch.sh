#!/usr/bin/env bash
# Ejecuta un fichero JS (grande) dentro de la app con datos sembrados e imprime RESULT:<json> y ERRORS:[...].
# Uso: bash tools/test/applaunch.sh <fichero.js> ["&empty=1&wait=600" ...]
# El JS viaja comprimido en el fragmento de la URL (sin el límite de la línea de órdenes de Windows). Ver kit.js.
exec node "$(dirname "$0")/kit.js" lanza "$@"
