"""Música del video para el estado de WhatsApp (escena-estado.js).
Sin samples: todo sale de osciladores, ruido y envolventes calculadas acá.

LA REJILLA MANDA. 96 BPM, negra = 0,625 s, compás = 2,5 s, doce compases
= 30,000 s exactos. Los tramos del video caen en esos compases.

Re mayor, I–V–vi–IV (Re – La – Si menor – Sol), tres vueltas. Es la
progresión de medio pop romántico y eso no es un defecto: en treinta
segundos no hay tiempo para que el oído aprenda nada raro.

El arco sigue al video:
  c0        el gancho: piano solo, en voz baja
  c1        entra el celular: se suma el bajo
  c2–c5     el recorrido: pulso suave, arpegio, campanitas
  c5 final  subida (riser) hacia el giro del celular
  c6–c9     la segunda invitación: todo arriba, con palmas
  c10–c11   el cierre: vuelve al piano y el acorde final queda sonando

    python3 video/musica-estado.py video/img-estado/musica.wav
"""
import struct
import sys
import wave

import numpy as np

SR = 48000
BPM = 96.0
NEGRA = 60.0 / BPM            # 0,625
COMPAS = NEGRA * 4            # 2,5
DUR = COMPAS * 12             # 30,000
N = int(round(DUR * SR))
rng = np.random.default_rng(7)


def hz(midi):
    return 440.0 * 2.0 ** ((midi - 69) / 12.0)


def poner(x, ini, señal):
    i0 = int(ini * SR)
    if i0 >= N:
        return
    fin = min(N, i0 + len(señal))
    x[i0:fin] += señal[:fin - i0]


def piano(midi, largo, vol):
    """Un piano de fieltro: armónicos que se apagan cada uno a su ritmo,
    un ataque blando y un poco de desafinado entre dos cuerdas."""
    n = int((largo + 1.6) * SR)
    t = np.arange(n) / SR
    f = hz(midi)
    s = np.zeros(n)
    for k, a in enumerate([1.0, .42, .2, .11, .06, .03], start=1):
        dec = 2.6 / (k ** .8)
        for d in (-.0012, .0012):
            s += a * np.sin(2 * np.pi * f * k * (1 + d) * t) * np.exp(-t / dec)
    ataque = np.minimum(1, t / .006)
    soltar = np.where(t > largo, np.exp(-(t - largo) / .35), 1.0)
    return vol * s * ataque * soltar / 3.5


def colchon(midis, largo, vol):
    n = int((largo + .8) * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for m in midis:
        f = hz(m)
        for d in (-.004, 0, .004):
            s += np.sin(2 * np.pi * f * (1 + d) * t + 3 * d * np.sin(2 * np.pi * .3 * t))
    env = np.minimum(1, t / .9) * np.where(t > largo, np.exp(-(t - largo) / .4), 1.0)
    return vol * s * env / (3 * len(midis))


def bajo(midi, largo, vol):
    n = int((largo + .2) * SR)
    t = np.arange(n) / SR
    s = np.tanh(1.6 * np.sin(2 * np.pi * hz(midi) * t)) * np.minimum(1, t / .01)
    return vol * s * np.where(t > largo, np.exp(-(t - largo) / .08), 1.0) * np.exp(-t / 3)


def bombo(vol):
    n = int(.45 * SR)
    t = np.arange(n) / SR
    f = 42 + 110 * np.exp(-t / .045)
    fase = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(fase) * np.exp(-t / .16)
    s[:int(.004 * SR)] += rng.normal(0, .4, int(.004 * SR))
    return vol * s


def palma(vol):
    n = int(.3 * SR)
    t = np.arange(n) / SR
    ruido = rng.normal(0, 1, n)
    ruido = np.convolve(ruido, [1, -.9], 'same')                    # quita graves
    env = sum(np.exp(-np.maximum(0, t - d) / .012) * (t >= d) for d in (0, .011, .022)) / 3
    env += .4 * np.exp(-t / .09)
    return vol * ruido * env * .5


def sonajero(vol):
    n = int(.08 * SR)
    t = np.arange(n) / SR
    r = np.convolve(rng.normal(0, 1, n), [1, -1], 'same')
    return vol * r * np.exp(-t / .02) * .3


def campana(midi, vol):
    n = int(2.4 * SR)
    t = np.arange(n) / SR
    f = hz(midi)
    s = sum(a * np.sin(2 * np.pi * f * k * t) * np.exp(-t / d)
            for k, a, d in ((1, 1, 1.4), (2.76, .35, .5), (5.4, .12, .2)))
    return vol * s * np.minimum(1, t / .002)


def subida(ini, largo, vol):
    n = int(largo * SR)
    t = np.arange(n) / SR
    r = rng.normal(0, 1, n)
    # ruido que se va aclarando: un filtro de un polo que se abre
    a = np.linspace(.02, .45, n)
    y = np.zeros(n)
    for i in range(1, n):
        y[i] = y[i - 1] + a[i] * (r[i] - y[i - 1])
    return ini, vol * y * (t / largo) ** 2


def golpe(vol):
    n = int(2.2 * SR)
    t = np.arange(n) / SR
    r = rng.normal(0, 1, n)
    y = np.zeros(n)
    for i in range(1, n):
        y[i] = y[i - 1] + .05 * (r[i] - y[i - 1])
    return vol * (y * 3 * np.exp(-t / .5) + .6 * np.sin(2 * np.pi * 50 * t) * np.exp(-t / .5))


def reverb(x, segundos=2.2, mezcla=.28):
    n = int(segundos * SR)
    t = np.arange(n) / SR
    ir = rng.normal(0, 1, n) * np.exp(-t / (segundos / 6.5))
    ir /= np.sqrt(np.sum(ir ** 2))
    L = 1 << int(np.ceil(np.log2(len(x) + n)))
    mojado = np.fft.irfft(np.fft.rfft(x, L) * np.fft.rfft(ir, L), L)[:len(x)]
    return (1 - mezcla) * x + mezcla * mojado * 2.2


def componer():
    seco = np.zeros(N)
    #            raíz   acorde (voces del piano, cómodas en el registro medio)
    VUELTA = [(50, [62, 66, 69, 74]),     # Re
              (45, [61, 64, 69, 73]),     # La
              (47, [62, 66, 71, 74]),     # Si menor
              (43, [62, 67, 71, 74])]     # Sol
    MELODIA = [78, 76, 74, 76,  73, 76, 81, 76,  74, 78, 83, 81,  79, 78, 76, 74]
    for c in range(12):
        ini = c * COMPAS
        raiz, ac = VUELTA[c % 4]
        cierre = c >= 10
        fuerte = 6 <= c <= 9
        # piano: el acorde al principio y un arpegio en corcheas
        poner(seco, ini, piano(ac[0] - 12, COMPAS, .55 if not cierre else .45))
        patron = [0, 1, 2, 3, 2, 1, 2, 3]
        for k, v in enumerate(patron):
            vol = .22 if c == 0 else (.3 if not fuerte else .34)
            if cierre and c == 11 and k > 0:
                break
            poner(seco, ini + k * NEGRA / 2, piano(ac[v], NEGRA * .9, vol))
        # melodía de campanitas desde el compás 2
        if 2 <= c <= 9:
            for k in range(4):
                m = MELODIA[(c * 4 + k) % 16]
                if (c + k) % 3 != 2:
                    poner(seco, ini + k * NEGRA, campana(m + 12, .06 if not fuerte else .075))
        # el colchón y el bajo
        if c >= 1:
            poner(seco, ini, colchon([raiz + 24, ac[1], ac[2]], COMPAS, .16 if fuerte else .11))
            poner(seco, ini, bajo(raiz - 12 if raiz > 45 else raiz, COMPAS * .95, .32 if not cierre else .22))
        # el pulso
        if 2 <= c <= 9:
            for b in range(4):
                if fuerte or b in (0, 2):
                    poner(seco, ini + b * NEGRA, bombo(.62 if fuerte else .45))
                if fuerte and b in (1, 3):
                    poner(seco, ini + b * NEGRA, palma(.42))
            for k in range(8):
                poner(seco, ini + k * NEGRA / 2, sonajero(.5 if k % 2 else .28))
    # el acorde final, largo
    poner(seco, 11 * COMPAS, colchon([62, 66, 69, 74], 2.6, .14))
    poner(seco, 11 * COMPAS + NEGRA * 2, campana(86, .07))
    # la subida hacia el giro (15 s) y el golpe del giro y del cierre
    ini, s = subida(15.0 - 2.4, 2.4, .12); poner(seco, ini, s)
    poner(seco, 15.0, golpe(.22))
    poner(seco, 25.0, golpe(.14))
    return reverb(seco)


def masterizar(x):
    # un paso bajo suave: en el parlante de un teléfono los agudos raspan
    y = np.zeros_like(x)
    a = 1 - np.exp(-2 * np.pi * 7000 / SR)
    for i in range(1, len(x)):
        y[i] = y[i - 1] + a * (x[i] - y[i - 1])
    y = np.tanh(y * 1.3) / np.tanh(1.3)
    # -2,5 dBFS: el AAC del MP4 reconstruye la onda y se pasa si se deja en -1
    y *= 10 ** (-2.5 / 20) / np.max(np.abs(y))
    fade = int(.6 * SR)
    y[-fade:] *= np.linspace(1, 0, fade) ** 2
    return y


def guardar(x, ruta):
    est = np.stack([x, np.roll(x, int(.011 * SR)) * .97 + x * .03], axis=1)   # un poco de ancho
    datos = (np.clip(est, -1, 1) * 32767).astype('<i2').tobytes()
    with wave.open(ruta, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(datos)


if __name__ == '__main__':
    salida = sys.argv[1] if len(sys.argv) > 1 else 'musica-estado.wav'
    guardar(masterizar(componer()), salida)
    print(f'  musica: {DUR:.3f}s · {BPM:g} BPM · compás {COMPAS:.3f}s → {salida}')
