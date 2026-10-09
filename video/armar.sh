#!/usr/bin/env bash
# Arma un video de punta a punta: baja las fuentes de la marca, las
# incrusta, renderiza los cuadros y los encodea a MP4.
#
#     bash video/armar.sh rollo          -> video/rollo-eterno.mp4
#     bash video/armar.sh invitaciones   -> video/invitaciones.mp4
#     bash video/armar.sh                -> los dos
#
# El de invitaciones usa capturas de pia/nueva, la invitacion de verdad
# que esta en el repo, asi que primero levanta el servidor de pruebas y
# las saca de nuevo. Se regeneran siempre a proposito: guardadas, el dia
# que la invitacion cambie el video seguiria mostrando la version vieja
# y nadie se enteraria.
#
# Los MP4 NO van al repo (6 MB cada uno y se regeneran en un minuto).
# Para cambiar un video se toca su escena-*.js y se corre esto.
set -euo pipefail
cd "$(dirname "$0")"

# ffmpeg no viene en la maquina; imageio-ffmpeg trae un binario armado.
python3 -c 'import imageio_ffmpeg' 2>/dev/null || pip install --quiet imageio-ffmpeg
FFMPEG="$(python3 -c 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())')"
export FFMPEG
[ -z "${NODE_PATH:-}" ] && export NODE_PATH="$(npm root -g)"

# ── las fuentes de la marca, incrustadas ──
# Desde la maquina de desarrollo el NAVEGADOR no puede bajar nada de
# fonts.googleapis.com (el proxy firma los certificados y Chromium lo
# rechaza), asi que un @import no sirve: el video saldria con la
# tipografia de reemplazo y nadie se enteraria hasta verlo. curl si
# llega, asi que se bajan aca y se pegan en base64.
python3 bajar_fuentes.py

armar_uno() {
  local nombre="$1" salida="$2"
  python3 montar.py "escena-$nombre.js"
  node render.js "$PWD/$salida"
  ls -lh "$salida"
}

QUE="${1:-todos}"

if [ "$QUE" = "invitaciones" ] || [ "$QUE" = "todos" ]; then
  PUERTO=8097
  LEVANTE=""
  if ! (command -v ss >/dev/null && ss -ltn 2>/dev/null | grep -q ":$PUERTO "); then
    python3 ../pruebas/servidor.py "$PUERTO" .. >/dev/null 2>&1 &
    LEVANTE=$!
    sleep 2
  fi
  echo "  capturando pia/nueva..."
  BASE="http://127.0.0.1:$PUERTO" node capturar.js
  python3 achicar.py
  if [ -n "$LEVANTE" ]; then kill "$LEVANTE" 2>/dev/null || true; fi
  armar_uno invitaciones invitaciones.mp4
fi

if [ "$QUE" = "rollo" ] || [ "$QUE" = "todos" ]; then
  armar_uno rollo rollo-eterno.mp4
fi
