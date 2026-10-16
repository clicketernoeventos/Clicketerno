"""Pega la escena y las fuentes en un solo escena.html que render.js abre."""
import sys
import json, os
escena = sys.argv[1]
css = open('fuentes.css').read()
js = open(escena).read()
# Las posiciones de los anillos salen de capturar.js, que las mide del
# DOM de la invitacion de verdad. Inyectadas aca, la escena no las tiene
# escritas a mano: si manana la invitacion mueve el boton "Si, voy", el
# anillo se mueve con el. Sin el archivo, la escena usa sus valores por
# defecto y sigue andando.
cajas = {}
if os.path.exists('img/cajas.json'):
    cajas = json.load(open('img/cajas.json'))
js = 'window.__CAJAS=' + json.dumps(cajas) + ';\n' + js

# Lo mismo para el muro: capturar-muro.js mide del DOM dónde cae el
# boton "Enviar a la pantalla" y el "Aprobar" del panel. Van aparte de
# las de la invitacion porque son otra app y otras pantallas; con un
# solo diccionario, el dia que las dos tengan un "enviar" una pisaria a
# la otra y el anillo señalaria cualquier cosa.
cajas_muro = {}
if os.path.exists('img-muro/cajas.json'):
    cajas_muro = json.load(open('img-muro/cajas.json'))
js = 'window.__CAJAS_MURO=' + json.dumps(cajas_muro) + ';\n' + js

# Fotos de verdad para el rollo. Si la carpeta video/fotos/ tiene
# imagenes, se incrustan en base64 y la escena las usa en vez de las
# dibujadas; si esta vacia, sigue andando igual con las dibujadas. Van
# incrustadas y no por ruta porque render.js abre la pagina con file://
# y una ruta relativa a veces no resuelve.
import base64, glob
TIPOS = {'.jpg': 'jpeg', '.jpeg': 'jpeg', '.png': 'png', '.webp': 'webp'}
fotos = []
for ruta in sorted(glob.glob('fotos/*')):
    ext = os.path.splitext(ruta)[1].lower()
    if ext not in TIPOS:
        continue
    with open(ruta, 'rb') as f:
        datos = f.read()
    if len(datos) > 4_000_000:
        print(f'  · {os.path.basename(ruta)} pesa {len(datos)//1024} KB: salteada')
        continue
    fotos.append(f'data:image/{TIPOS[ext]};base64,' + base64.b64encode(datos).decode())
js = 'window.__FOTOS=' + json.dumps(fotos) + ';\n' + js
if fotos:
    print(f'  {len(fotos)} foto(s) de verdad incrustadas')

# Las DIEZ fotos de demo/, que son las que ya se publican con el sitio y
# las que ve cualquiera que entre a "Probar la demostración". El
# comercial del muro las usa como contenido: son fotos de verdad de una
# fiesta de verdad, no stock. Van aparte de window.__FOTOS —que es la
# carpeta privada video/fotos/, gitignoreada— porque son dos conjuntos
# con dos permisos distintos y mezclarlos sería perder cuál es cuál.
demo = []
for ruta in sorted(glob.glob('../demo/*')):
    ext = os.path.splitext(ruta)[1].lower()
    if ext not in TIPOS:
        continue
    with open(ruta, 'rb') as f:
        demo.append(f'data:image/{TIPOS[ext]};base64,' + base64.b64encode(f.read()).decode())
js = 'window.__DEMO=' + json.dumps(demo) + ';\n' + js
if demo:
    print(f'  {len(demo)} foto(s) de demo/ incrustadas')

# La marca, para el cierre. Incrustada y no por ruta porque render.js
# abre la pagina con file:// y una relativa a veces no resuelve.
marca = ''
if os.path.exists('../marca.webp'):
    with open('../marca.webp', 'rb') as f:
        marca = 'data:image/webp;base64,' + base64.b64encode(f.read()).decode()
js = 'window.__MARCA=' + json.dumps(marca) + ';\n' + js
open('escena.html', 'w', encoding='utf-8').write(
    '<!doctype html><meta charset="utf-8"><title>Click Eterno</title>\n'
    '<style>' + css + '\n'
    'html,body{margin:0;background:#0A0806} #lienzo{display:block}</style>\n'
    '<canvas id="lienzo"></canvas>\n'
    '<script>' + js + '</script>')
print('  montada', escena)
