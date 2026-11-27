"""Música del instructivo de la lista de invitados (escena-lista.js).
Usa los instrumentos de musica-estado.py; acá solo cambia la partitura.
Es un fondo: piano, colchón y bajo, sin palmas, para que manden las letras.
96 BPM, compás 2,5 s, 22 compases = 55,000 s. Un golpe suave en cada paso.

    python3 musica-lista.py musica-lista.wav
"""
import importlib.util, sys
import numpy as np

spec = importlib.util.spec_from_file_location('me', __file__.replace('musica-lista.py', 'musica-estado.py'))
me = importlib.util.module_from_spec(spec); spec.loader.exec_module(me)
COMPAS, NEGRA, SR = me.COMPAS, me.NEGRA, me.SR
me.DUR = DUR = COMPAS * 22
me.N = N = int(round(DUR * SR))


def componer():
    seco = np.zeros(N)
    VUELTA = [(50, [62, 66, 69, 74]), (45, [61, 64, 69, 73]),
              (47, [62, 66, 71, 74]), (43, [62, 67, 71, 74])]
    for c in range(22):
        ini = c * COMPAS
        raiz, ac = VUELTA[c % 4]
        final = c == 21
        me.poner(seco, ini, me.piano(ac[0] - 12, COMPAS, .45))
        for k, v in enumerate([0, 1, 2, 3, 2, 1, 2, 3]):
            if final and k > 0:
                break
            me.poner(seco, ini + k * NEGRA / 2, me.piano(ac[v], NEGRA * .9, .2 if c in (0, 21) else .25))
        if c >= 1:
            me.poner(seco, ini, me.colchon([raiz + 24, ac[1], ac[2]], COMPAS, .1))
            me.poner(seco, ini, me.bajo(raiz - 12 if raiz > 45 else raiz, COMPAS * .95, .26))
        if 2 <= c <= 18:
            for b in (0, 2):
                me.poner(seco, ini + b * NEGRA, me.bombo(.3))
            for k in range(8):
                me.poner(seco, ini + k * NEGRA / 2, me.sonajero(.3 if k % 2 else .16))
    me.poner(seco, 21 * COMPAS, me.colchon([62, 66, 69, 74], 2.6, .12))
    for s in (5.0, 10.0, 17.5, 27.5, 35.0, 40.0, 47.5):
        me.poner(seco, s, me.campana(86, .05))
    return me.reverb(seco)


if __name__ == '__main__':
    salida = sys.argv[1] if len(sys.argv) > 1 else 'musica-lista.wav'
    me.guardar(me.masterizar(componer()), salida)
    print(f'  musica: {DUR:.3f}s → {salida}')
