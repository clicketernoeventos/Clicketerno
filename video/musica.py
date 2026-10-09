"""Compone y sintetiza la música del reel. Sin samples: todo sale de
osciladores, ruido y envolventes calculados acá.

LA REJILLA MANDA. 128 BPM, negra = 0,46875 s, compás = 1,875 s, ocho
compases = 15,000 s exactos. Los cortes del video caen en esos compases
a propósito: un corte fuera de tiempo se nota aunque nadie sepa por qué.

Armonía: La menor. Am – F – C – G – Am, que es la progresión más usada
del mundo y eso no es un defecto: en quince segundos no hay tiempo de
que el oído aprenda nada raro.

    python3 video/musica.py video/musica.wav
"""
import math
import struct
import sys
import wave

import numpy as np

SR = 48000
BPM = 128.0
NEGRA = 60.0 / BPM            # 0.46875
COMPAS = NEGRA * 4            # 1.875
DUR = COMPAS * 8              # 15.000 exactos
N = int(round(DUR * SR))

t = np.arange(N) / SR


# ── herramientas ───────────────────────────────────────────────────
def nota(semis, base=440.0):
    """Hz de un intervalo en semitonos sobre La 440."""
    return base * (2.0 ** (semis / 12.0))


def env(ini, ataque, caida, sostiene, nivel, suelta):
    """Envolvente ADSR dibujada sobre la línea de tiempo entera."""
    e = np.zeros(N)
    i0 = int(ini * SR)
    for tramo, (largo, desde, hasta) in enumerate([
            (ataque, 0.0, 1.0), (caida, 1.0, nivel),
            (sostiene, nivel, nivel), (suelta, nivel, 0.0)]):
        n = int(largo * SR)
        if n <= 0 or i0 >= N:
            continue
        n = min(n, N - i0)
        e[i0:i0 + n] = np.linspace(desde, hasta, n)
        i0 += n
    return e


def pluck(hz, ini, largo, vol=0.5, detune=0.004, brillo=2600.0, armonicos=8):
    """Cuerda pulsada: dos sierras apenas desafinadas + una sinusoide de
    cuerpo, con la envolvente corta de algo que se puntea. El detune es
    lo que la saca de sonar a pitido de computadora."""
    e = env(ini, 0.004, largo * 0.55, 0.0, 0.0, largo * 0.45) * vol
    fase1 = 2 * np.pi * hz * (1 - detune) * t
    fase2 = 2 * np.pi * hz * (1 + detune) * t
    # sierra por serie de armónicos, recortada antes de Nyquist
    s = np.zeros(N)
    k = 1
    while hz * k < brillo and k < armonicos:
        s += (np.sin(fase1 * k) + np.sin(fase2 * k)) / (k * k)   # /k² baja el brillo
        k += 1
    s *= 0.6
    s += 1.1 * np.sin(2 * np.pi * hz * t)          # fundamental con cuerpo
    return s * e


def pad(hzs, ini, largo, vol=0.12):
    """Colchón: varias sinusoides con vibrato lento y entrada larga."""
    e = env(ini, largo * 0.35, largo * 0.1, largo * 0.35, 0.8, largo * 0.2) * vol
    vib = 1 + 0.0025 * np.sin(2 * np.pi * 4.7 * t)
    s = np.zeros(N)
    for i, hz in enumerate(hzs):
        s += np.sin(2 * np.pi * hz * vib * t + i * 1.7) / (i + 1.4)
        s += 0.35 * np.sin(2 * np.pi * hz * 2 * vib * t + i)   # octava, aire
    return s * e


def sub(hz, ini, largo, vol=0.55):
    """Bajo: sinusoide con un poco de saturación para que se oiga en un
    parlante de celular, que es donde se va a escuchar esto."""
    e = env(ini, 0.006, 0.05, largo * 0.7, 0.85, largo * 0.3) * vol
    s = np.sin(2 * np.pi * hz * t)
    return np.tanh(s * 1.8) * e


def golpe(ini, vol=0.9, desde=150.0, hasta=42.0, largo=0.42):
    """Bombo: una sinusoide que cae de golpe en frecuencia. El clic del
    ataque es ruido muy corto; sin eso no se escucha en un teléfono."""
    e = env(ini, 0.002, largo, 0.0, 0.0, 0.02) * vol
    i0 = int(ini * SR)
    k = np.zeros(N)
    n = min(int(largo * SR), N - i0)
    if n > 0:
        tt = np.arange(n) / SR
        f = hasta + (desde - hasta) * np.exp(-tt * 26)
        k[i0:i0 + n] = np.sin(2 * np.pi * np.cumsum(f) / SR)
    clic = np.zeros(N)
    nc = min(int(0.006 * SR), N - i0)
    if nc > 0:
        rng = np.random.default_rng(7)
        clic[i0:i0 + nc] = rng.standard_normal(nc) * np.linspace(1, 0, nc) * 0.5
    return k * e + clic * vol


def impacto(ini, vol=0.75, largo=1.8):
    """El golpe de los títulos: ruido filtrado que se abre y se cierra,
    más un sub que lo sostiene."""
    i0 = int(ini * SR)
    n = min(int(largo * SR), N - i0)
    s = np.zeros(N)
    if n <= 0:
        return s
    rng = np.random.default_rng(11)
    r = rng.standard_normal(n)
    # paso bajo de un polo, barriendo: de brillante a oscuro
    y = np.zeros(n)
    a = np.linspace(0.45, 0.02, n)
    prev = 0.0
    for i in range(n):
        prev = prev + a[i] * (r[i] - prev)
        y[i] = prev
    caida = np.exp(-np.arange(n) / SR * 3.2)
    s[i0:i0 + n] = y * caida * 2.2
    return s * vol + sub(nota(-24), ini, largo * 0.8, vol * 0.5)


def riser(ini, largo, vol=0.3):
    """Subida: ruido con un pasa-banda que trepa. Es el truco más viejo
    del mundo y sigue siendo el que avisa que viene algo."""
    i0 = int(ini * SR)
    n = min(int(largo * SR), N - i0)
    s = np.zeros(N)
    if n <= 0:
        return s
    rng = np.random.default_rng(3)
    r = rng.standard_normal(n)
    y = np.zeros(n)
    a = np.linspace(0.015, 0.55, n)     # el filtro se abre
    prev = 0.0
    for i in range(n):
        prev = prev + a[i] * (r[i] - prev)
        y[i] = prev
    sube = np.linspace(0, 1, n) ** 2.3
    s[i0:i0 + n] = y * sube * 3.0
    return s * vol


def brillo(ini, largo, hz, vol=0.09):
    """Campanita: sinusoides en armónicos no enteros, como una campana.
    Marca los momentos sin pisar la melodía."""
    e = env(ini, 0.002, largo, 0.0, 0.0, 0.01) * vol
    s = np.zeros(N)
    for mult, peso in [(1, 1), (2.76, .55), (5.4, .3), (8.9, .16)]:
        s += peso * np.sin(2 * np.pi * hz * mult * t)
    return s * e


def reverb(x, segundos=1.9, mezcla=0.30):
    """Reverb por convolución con una cola de ruido que decae. Con FFT
    es instantáneo y suena mucho mejor que un delay realimentado."""
    n = int(segundos * SR)
    rng = np.random.default_rng(23)
    cola = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 3.4)
    cola[0] = 1.0
    # un poco de paso bajo: una cola brillante suena a lata
    suave = np.convolve(cola, np.ones(12) / 12, mode='same')
    mojado = np.fft.irfft(np.fft.rfft(x, N + n) * np.fft.rfft(suave, N + n))[:N]
    mojado /= (np.max(np.abs(mojado)) + 1e-9)
    return x * (1 - mezcla) + mojado * mezcla * np.max(np.abs(x))


# ── la pieza ───────────────────────────────────────────────────────
def componer():
    mezcla = np.zeros(N)
    c = COMPAS

    # acordes: Am – Am – F – F – C – C – G – Am
    ACORDES = [
        [nota(0), nota(3), nota(7)],        # Am   (La do mi)
        [nota(0), nota(3), nota(7)],
        [nota(-4), nota(0), nota(3)],       # F    (fa la do)
        [nota(-4), nota(0), nota(3)],
        [nota(3), nota(7), nota(10)],       # C    (do mi sol)
        [nota(3), nota(7), nota(10)],
        [nota(-2), nota(2), nota(5)],       # G    (sol si re)
        [nota(0), nota(3), nota(7)],        # Am
    ]
    RAICES = [-24, -24, -28, -28, -21, -21, -26, -24]

    # 1 · colchón: entra desde el principio y sostiene toda la pieza
    for i, ac in enumerate(ACORDES):
        peso = [0.07, 0.11, 0.15, 0.17, 0.19, 0.21, 0.22, 0.17][i]
        mezcla += pad([h / 2 for h in ac], i * c, c * 1.15, vol=peso)

    # 2 · subida del primer compás: avisa el golpe del título
    mezcla += riser(0.0, c * 0.98, vol=0.17)
    mezcla += impacto(c * 1.0, vol=0.37, largo=1.15)   # golpe del título, compás 2

    # 3 · arpegio: arranca en el compás 2 y es la melodía de la pieza.
    #     Corcheas, con la nota más alta acentuada.
    paso = NEGRA / 2
    for compas in range(1, 8):
        ac = ACORDES[compas]
        grados = [0, 1, 2, 1, 2, 1, 0, 1]        # sube y baja, no es una escalera
        for k, g in enumerate(grados):
            inicio = compas * c + k * paso
            if inicio >= DUR:
                break
            octava = 2 if (k in (2, 4) and compas >= 3) else 1
            acento = 1.0 if k in (0, 4) else 0.62
            # en el último compás se va apagando
            if compas == 7:
                acento *= max(0.0, 1 - k / 7)
            # sube de 0,30 a 0,52 entre el compás 2 y el 7
            peso = 0.30 + 0.22 * min(1.0, (compas - 1) / 5.0)
            mezcla += pluck(ac[g] * octava, inicio, paso * 2.4,
                            vol=peso * acento)

    # 4 · bajo: la raíz en cada compás, y un rebote en el contratiempo
    for i, r in enumerate(RAICES):
        mezcla += sub(nota(r), i * c, c * 0.92, vol=0.5)
        if 2 <= i <= 6:
            mezcla += sub(nota(r + 12), i * c + NEGRA * 2.5, NEGRA * 0.8, vol=0.18)

    # 5 · bombo: desde el compás 3, en 1 y 3. Antes no, para que la
    #     entrada de los tres modelos se sienta como una entrada.
    for compas in range(2, 8):
        for beat in (0, 2):
            peso = 0.70 + 0.30 * min(1.0, (compas - 2) / 4.0)
            mezcla += golpe(compas * c + beat * NEGRA,
                            vol=peso * (1.0 if beat == 0 else 0.62))
    # el golpe final, en el último compás
    mezcla += golpe(7 * c, vol=1.0, largo=0.7)

    # 6 · campanitas en los cortes del video
    for seg, hz in [(c * 1, nota(12)), (c * 2, nota(15)), (c * 4, nota(19)),
                    (c * 6, nota(12)), (c * 7, nota(24))]:
        mezcla += brillo(seg, 2.2, hz, vol=0.085)

    # 7 · un impacto suave en el cierre
    mezcla += impacto(c * 7, vol=0.45, largo=1.9)

    return mezcla


def masterizar(x):
    """Reverb, un poco de compresión blanda y normalizado. El límite en
    -1 dBFS deja aire: un máster que toca 0 cruje al recomprimirlo las
    redes."""
    x = reverb(x, 1.9, 0.26)
    # Paso bajo de un polo a ~6,5 kHz. El ruido del riser y del impacto
    # deja la mezcla con más agudos que graves, y eso en el parlante de
    # un teléfono raspa. Medido antes de esto: agudos 138,5 dB contra
    # graves 126,0.
    corte = 6500.0
    a = 1 - math.exp(-2 * math.pi * corte / SR)
    y = np.empty_like(x)
    prev = 0.0
    for i in range(len(x)):
        prev += a * (x[i] - prev)
        y[i] = prev
    x = y * 0.78 + x * 0.22                      # no del todo seco
    x = np.tanh(x * 1.25) / 1.25                 # compresión blanda
    # fundido de entrada y salida, para que no haya un clic en los bordes
    nf = int(0.012 * SR)
    x[:nf] *= np.linspace(0, 1, nf)
    nf2 = int(0.35 * SR)
    x[-nf2:] *= np.linspace(1, 0, nf2)
    pico = np.max(np.abs(x))
    # El AAC del MP4 reconstruye la onda y puede pasarse del pico del
    # WAV: con el máster a -1,0 dBFS el archivo final medía 0,0 y
    # clippeaba. -2,5 deja el aire que ese paso necesita.
    return x / pico * (10 ** (-2.5 / 20))


def guardar(x, ruta):
    """Estéreo con un ensanchado mínimo: el mismo material corrido unas
    milésimas en un canal. Más que eso y en mono se cancela."""
    d = int(0.008 * SR)
    izq = x.copy()
    der = np.concatenate([np.zeros(d), x[:-d]]) * 0.96 + x * 0.04
    inter = np.empty(N * 2)
    inter[0::2] = izq
    inter[1::2] = der
    datos = (np.clip(inter, -1, 1) * 32767).astype('<i2').tobytes()
    with wave.open(ruta, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(datos)


if __name__ == '__main__':
    salida = sys.argv[1] if len(sys.argv) > 1 else 'musica.wav'
    pieza = masterizar(componer())
    guardar(pieza, salida)
    rms = float(np.sqrt(np.mean(pieza ** 2)))
    print(f'  musica: {DUR:.3f}s · {BPM:g} BPM · compás {COMPAS:.4f}s '
          f'· pico {20*math.log10(np.max(np.abs(pieza))):.1f} dBFS '
          f'· RMS {20*math.log10(rms):.1f} dBFS')
