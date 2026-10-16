#!/usr/bin/env bash
# Arma un video de punta a punta: baja las fuentes de la marca, las
# incrusta, renderiza los cuadros y los encodea a MP4.
#
#     bash video/armar.sh rollo          -> video/rollo-eterno.mp4
#     bash video/armar.sh muro           -> video/muro-en-vivo.mp4
#     bash video/armar.sh invitaciones   -> video/invitaciones.mp4
#     bash video/armar.sh reel           -> video/reel-invitaciones.mp4
#     bash video/armar.sh vivo           -> video/muro-vivo-comercial.mp4
#     bash video/armar.sh                -> los cinco
#
# El reel y el comercial del muro llevan musica: se compone y se
# sintetiza sin samples (video/musica.py y video/musica-vivo.py), y dura
# exactamente lo mismo que el video — el reel 8 compases a 128 BPM
# (15,000 s) y el comercial 13 compases a 120 BPM (26,000 s).
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
  local nombre="$1" salida="$2" audio="${3:-}"
  python3 montar.py "escena-$nombre.js"
  node render.js "$PWD/$salida" ${audio:+"$PWD/$audio"}
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

if [ "$QUE" = "muro" ] || [ "$QUE" = "todos" ]; then
  # Todas las pantallas del muro son capturas de la app de verdad,
  # recorrida contra el Supabase falso de las pruebas (no contra la
  # demostracion: ahi todo lo del organizador cae en la pantalla del
  # salon y ademas arrastra la cinta de "la fiesta es inventada", que
  # en una pieza de venta no puede aparecer). Se sacan de nuevo en
  # cada armado a proposito: guardadas, el dia que el muro cambie el
  # video seguiria mostrando la version vieja y nadie se enteraria.
  PUERTO=8097
  LEVANTE=""
  if ! (command -v ss >/dev/null && ss -ltn 2>/dev/null | grep -q ":$PUERTO "); then
    (cd .. && python3 pruebas/servidor.py "$PUERTO" >/dev/null 2>&1 &)
    sleep 2
    LEVANTE="si"
  fi
  echo "  capturando las pantallas del muro..."
  BASE="http://127.0.0.1:$PUERTO" node capturar-muro.js
  if [ -n "$LEVANTE" ]; then pkill -f "servidor.py $PUERTO" 2>/dev/null || true; fi
  armar_uno muro muro-en-vivo.mp4
fi

if [ "$QUE" = "vivo" ] || [ "$QUE" = "todos" ]; then
  # El comercial del Muro en vivo. El contenido son las DIEZ fotos de
  # demo/ —las mismas que ya se publican con el sitio— y las pantallas
  # de app son capturas de verdad sacadas por capturar-muro.js, igual
  # que el video del muro. Las dos cosas las incrusta montar.py.
  PUERTO=8097
  LEVANTE=""
  if ! (command -v ss >/dev/null && ss -ltn 2>/dev/null | grep -q ":$PUERTO "); then
    (cd .. && python3 pruebas/servidor.py "$PUERTO" >/dev/null 2>&1 &)
    sleep 2
    LEVANTE="si"
  fi
  if [ ! -f img-muro/sala.ancha.full.jpg ]; then
    echo "  capturando las pantallas del muro..."
    BASE="http://127.0.0.1:$PUERTO" node capturar-muro.js
  fi
  if [ -n "$LEVANTE" ]; then pkill -f "servidor.py $PUERTO" 2>/dev/null || true; fi
  python3 musica-vivo.py musica-vivo.wav
  CRF=21 armar_uno vivo muro-vivo-comercial.mp4 musica-vivo.wav
fi

if [ "$QUE" = "reel" ] || [ "$QUE" = "todos" ]; then
  # Las tres portadas salen de la galeria de la pagina, con la paleta de
  # cada fiesta; las pantallas de adentro son capturas de pia/nueva.
  PUERTO=8097
  LEVANTE=""
  if ! (command -v ss >/dev/null && ss -ltn 2>/dev/null | grep -q ":$PUERTO "); then
    python3 ../pruebas/servidor.py "$PUERTO" .. >/dev/null 2>&1 &
    LEVANTE=$!
    sleep 2
  fi
  echo "  capturando los tres modelos de la galeria..."
  BASE="http://127.0.0.1:$PUERTO" node capturar-reel.js
  # las pantallas de adentro de Pia las saca capturar.js
  if [ ! -f img/cuenta.jpg ]; then BASE="http://127.0.0.1:$PUERTO" node capturar.js; python3 achicar.py; fi
  cp -f img/cuenta.jpg img/rsvp.jpg img/gracias.jpg img-reel/ 2>/dev/null || true
  if [ -n "$LEVANTE" ]; then kill "$LEVANTE" 2>/dev/null || true; fi
  python3 musica.py musica.wav
  armar_uno reel reel-invitaciones.mp4 musica.wav
fi
