#!/usr/bin/env bash
# Arma el video del rollo de punta a punta: baja las fuentes de la marca,
# las incrusta, renderiza los 660 cuadros y los encodea a MP4.
#
#     bash video/armar.sh            → video/rollo-eterno.mp4
#
# El MP4 NO va al repo (pesa 6 MB y se regenera en un minuto). Para
# cambiar el video se toca escena.js y se vuelve a correr esto.
set -euo pipefail
cd "$(dirname "$0")"

# ffmpeg no viene en la máquina; imageio-ffmpeg trae un binario armado.
python3 -c 'import imageio_ffmpeg' 2>/dev/null || pip install --quiet imageio-ffmpeg
FFMPEG="$(python3 -c 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())')"
export FFMPEG
[ -z "${NODE_PATH:-}" ] && export NODE_PATH="$(npm root -g)"

# ── las fuentes de la marca, incrustadas ──
# Desde la máquina de desarrollo el NAVEGADOR no puede bajar nada de
# fonts.googleapis.com (el proxy firma los certificados y Chromium lo
# rechaza), así que un @import no sirve: el video saldría con la
# tipografía de reemplazo y nadie se enteraría hasta verlo. curl sí
# llega, así que se bajan acá y se pegan en base64.
python3 - <<'PY'
import re, subprocess, base64, os
UA = ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/120.0 Safari/537.36')
URL = ('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@'
       '0,6..96,400;0,6..96,600;1,6..96,400&family=Jost:wght@300;400;600&display=swap')
if os.path.exists('fuentes.css') and os.path.getsize('fuentes.css') > 100_000:
    raise SystemExit('fuentes.css ya está')
css = subprocess.run(['curl','-sf','--max-time','30','-A',UA,URL],
                     capture_output=True, text=True).stdout
caras = []
for b in re.findall(r'@font-face\s*\{(.*?)\}', css, re.S):
    ur = re.search(r'unicode-range: ([^;]+);', b)
    if ur and 'U+0000-00FF' not in ur.group(1): continue   # solo el latino
    fam = re.search(r"font-family: '([^']+)'", b).group(1)
    sty = re.search(r'font-style: (\w+)', b).group(1)
    wgt = re.search(r'font-weight: ([\d ]+)', b).group(1).strip()
    url = re.search(r'url\((https[^)]+)\)', b).group(1)
    d = subprocess.run(['curl','-sf','--max-time','30',url], capture_output=True).stdout
    if len(d) < 2000: raise SystemExit(f'no bajó {fam} {sty} {wgt}')
    caras.append("@font-face{font-family:'%s';font-style:%s;font-weight:%s;"
                 "font-display:block;src:url(data:font/woff2;base64,%s) format('woff2')}"
                 % (fam, sty, wgt, base64.b64encode(d).decode()))
if len(caras) < 6: raise SystemExit(f'faltan caras: bajaron {len(caras)} de 6')
open('fuentes.css','w').write('\n'.join(caras))
print(f'  fuentes: {len(caras)} caras')
PY

python3 - <<'PY'
css = open('fuentes.css').read(); js = open('escena.js').read()
open('escena.html','w',encoding='utf-8').write(
  f'''<!doctype html><meta charset="utf-8"><title>Rollo eterno</title>
<style>{css}
html,body{{margin:0;background:#0A0806}} #lienzo{{display:block}}</style>
<canvas id="lienzo"></canvas>
<script>{js}</script>''')
PY

node render.js "$PWD/rollo-eterno.mp4"
ls -lh rollo-eterno.mp4
