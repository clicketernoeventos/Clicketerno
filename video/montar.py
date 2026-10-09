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
open('escena.html', 'w', encoding='utf-8').write(
    '<!doctype html><meta charset="utf-8"><title>Click Eterno</title>\n'
    '<style>' + css + '\n'
    'html,body{margin:0;background:#0A0806} #lienzo{display:block}</style>\n'
    '<canvas id="lienzo"></canvas>\n'
    '<script>' + js + '</script>')
print('  montada', escena)
