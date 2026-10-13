#!/usr/bin/env bash
# El video para el estado de WhatsApp: la invitación digital, vertical,
# 1080x1920, 30 s, con música.
#
#     bash video/estado.sh      -> video/estado-invitaciones.mp4
#
# Graba de nuevo las dos invitaciones de muestra (claraybruno y
# juliayfranco) cada vez, a propósito: guardadas, el día que una cambie
# el video seguiría mostrando la versión vieja y nadie se enteraría.
set -euo pipefail
cd "$(dirname "$0")"
command -v ffmpeg >/dev/null && export FFMPEG="${FFMPEG:-$(command -v ffmpeg)}"
if [ -z "${FFMPEG:-}" ]; then
  python3 -c 'import imageio_ffmpeg' 2>/dev/null || pip install --quiet imageio-ffmpeg
  export FFMPEG="$(python3 -c 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())')"
fi
[ -z "${NODE_PATH:-}" ] && export NODE_PATH="$(npm root -g)"
python3 bajar_fuentes.py

PUERTO=8096
(cd .. && python3 pruebas/servidor.py "$PUERTO" >/dev/null 2>&1) &
SERVIDOR=$!
trap 'kill $SERVIDOR 2>/dev/null || true' EXIT
sleep 2
echo "  grabando las dos invitaciones..."
BASE="http://127.0.0.1:$PUERTO" node capturar-estado.js
python3 musica-estado.py img-estado/musica.wav
python3 montar.py escena-estado.js
node render.js "$PWD/estado-invitaciones.mp4" "$PWD/img-estado/musica.wav"
# WhatsApp recomprime lo pesado y lo arruina: se entrega liviano
"$FFMPEG" -loglevel error -y -i estado-invitaciones.mp4 -c:v libx264 -preset slow -crf 23 \
  -profile:v high -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart estado-whatsapp.mp4
ls -lh estado-whatsapp.mp4
