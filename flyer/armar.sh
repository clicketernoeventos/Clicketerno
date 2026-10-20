#!/usr/bin/env bash
# Arma el flyer del listado: el PDF para mandar o imprimir y las hojas en
# imagen, que es lo que se ve en el chat sin abrir nada.
#
#     bash flyer/armar.sh
#
# Sale de flyer/listado.html, que NO se publica: el día que cambie el
# tablero se rehace con este comando en vez de volver a dibujarlo.
set -e
cd "$(dirname "$0")/.."
node flyer/armar.js
