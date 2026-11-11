#!/usr/bin/env bash
# Pruebas completas de Gymteca, desde cualquier sitio y sin nada más que Node y Chrome:
#   bash tools/test/smoke.sh
# 1) comprueba que index.html coincide con src/ (node tools/build.js --check); 2) arranca un servidor estático propio en
# un puerto libre (o usa el de PORT); 3) comprueba la guarda de __seed.html; 4) pasa smoke.js con datos sembrados y como
# usuario nuevo; 5) resume pasos y fallos. Sale con 0 si solo hay fallos conocidos (ver sum.js).
# Variables: PORT (servidor ya en marcha en la raíz), CHROME (ruta de Chrome), VTB (tiempo virtual por pasada, ms).
exec node "$(dirname "$0")/kit.js" smoke "$@"
