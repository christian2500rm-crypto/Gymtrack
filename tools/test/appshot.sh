#!/usr/bin/env bash
# Captura la app (marco de móvil de 390 px) con 6 meses de datos sembrados.
# Uso: bash tools/test/appshot.sh <salida.png> "<js a ejecutar dentro de la app>" [alto=844] [extra, p. ej. &empty=1]
# Ej.: bash tools/test/appshot.sh /tmp/prog.png "S.tab='prog';render()" 2200
# Las capturas no se versionan: guárdalas fuera del repositorio.
exec node "$(dirname "$0")/kit.js" captura "$@"
