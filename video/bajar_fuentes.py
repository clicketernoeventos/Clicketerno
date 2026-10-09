"""Baja el subconjunto latino de Bodoni Moda y Jost y lo deja incrustado
   en fuentes.css. Si bajan menos de seis caras, corta: un video con la
   tipografia de reemplazo no avisa, sale mal y listo."""
import re, subprocess, base64, os, sys

UA = ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/120.0 Safari/537.36')
URL = ('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@'
       '0,6..96,400;0,6..96,600;1,6..96,400&family=Jost:wght@300;400;600&display=swap')

if os.path.exists('fuentes.css') and os.path.getsize('fuentes.css') > 100_000:
    print('  fuentes: ya estaban')
    sys.exit(0)

css = subprocess.run(['curl', '-sf', '--max-time', '30', '-A', UA, URL],
                     capture_output=True, text=True).stdout
caras = []
for bloque in re.findall(r'@font-face\s*\{(.*?)\}', css, re.S):
    rango = re.search(r'unicode-range: ([^;]+);', bloque)
    if rango and 'U+0000-00FF' not in rango.group(1):
        continue                                    # solo el latino
    fam = re.search(r"font-family: '([^']+)'", bloque).group(1)
    sty = re.search(r'font-style: (\w+)', bloque).group(1)
    wgt = re.search(r'font-weight: ([\d ]+)', bloque).group(1).strip()
    url = re.search(r'url\((https[^)]+)\)', bloque).group(1)
    datos = subprocess.run(['curl', '-sf', '--max-time', '30', url], capture_output=True).stdout
    if len(datos) < 2000:
        sys.exit(f'no bajo {fam} {sty} {wgt}')
    caras.append("@font-face{font-family:'%s';font-style:%s;font-weight:%s;"
                 "font-display:block;src:url(data:font/woff2;base64,%s) format('woff2')}"
                 % (fam, sty, wgt, base64.b64encode(datos).decode()))
if len(caras) < 6:
    sys.exit(f'faltan caras: bajaron {len(caras)} de 6')
open('fuentes.css', 'w').write('\n'.join(caras))
print(f'  fuentes: {len(caras)} caras')
