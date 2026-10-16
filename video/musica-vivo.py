"""Compone y sintetiza la música y el diseño de sonido del comercial del
Muro en vivo. Sin samples: todo sale de osciladores, ruido y envolventes
calculados acá, así que no hay licencia de nadie en el medio.

LA REJILLA MANDA, igual que en musica.py. 120 BPM, negra = 0,5 s,
compás = 2 s, TRECE compases = 26,000 s exactos. Los cortes de
escena-vivo.js caen en esos compases a propósito: un corte fuera de
tiempo se nota aunque el que mira no sepa por qué. Si cambia DUR acá,
cambia en la escena — están escritos los dos y tienen que dar igual.

    compás  0      arranque: negro, pulso digital
            1-2    entran las fotos
            3-4    el muro se arma, entra el bombo
            5-6    el teléfono se vuelve la pantalla del salón
            7-8    mosaico, cortes rápidos
            9      riser
            10-11  EL GOLPE: el muro entero + "Tus momentos. En vivo."
            12     cierre: la marca

No importa de musica.py a propósito: allá los ayudantes están atados a
su línea de tiempo fija de 15 s (N y t son globales del módulo), y
tocarlos para compartirlos acá arriesga el reel, que ya está aprobado.
Lo que se repite son cuatro envolventes; lo que cambia es todo lo demás
—aquello es púa y colchón acústico, esto es electrónico con bombo en
negras—.

    python3 video/musica-vivo.py video/musica-vivo.wav
"""
import sys
import wave

import numpy as np

SR = 48000
BPM = 120.0
NEGRA = 60.0 / BPM             # 0.5
COMPAS = NEGRA * 4             # 2.0
DUR = COMPAS * 13              # 26.000 exactos
N = int(round(DUR * SR))

t = np.arange(N) / SR

# Los momentos, en segundos. Son los mismos que usa la escena.
T_PULSO = 0.55                 # el primer latido, con la pantalla aún negra
T_FOTO1 = 1.00                 # aparece la primera foto
T_BEAT = 4.00                  # entra el bombo
T_SALA = 10.00                 # el teléfono se vuelve la pantalla del salón
T_MOSAICO = 14.00              # el mosaico
T_RISER = 18.00                # empieza a levantar
T_GOLPE = 20.00                # EL golpe: el muro entero
T_FRASE2 = 23.00               # "Todos comparten. Todos lo viven."
T_MARCA = 24.50                # la marca


# ── herramientas ───────────────────────────────────────────────────
def nota(semis, base=440.0):
    """Hz de un intervalo en semitonos sobre La 440."""
    return base * (2.0 ** (semis / 12.0))


def env(ini, ataque, caida, sostiene, nivel, suelta):
    """Envolvente ADSR dibujada sobre la línea de tiempo entera."""
    e = np.zeros(N)
    i0 = int(ini * SR)
    for largo, desde, hasta in [
            (ataque, 0.0, 1.0), (caida, 1.0, nivel),
            (sostiene, nivel, nivel), (suelta, nivel, 0.0)]:
        n = int(largo * SR)
        if n <= 0 or i0 >= N:
            continue
        n = min(n, N - i0)
        e[i0:i0 + n] = np.linspace(desde, hasta, n)
        i0 += n
    return e


def ruido(semilla):
    """Ruido blanco repetible: la misma semilla da el mismo archivo."""
    return np.random.default_rng(semilla).standard_normal(N)


def filtro(x, hz, modo='bajos', orden=2.0):
    """Pasabajos / pasaaltos por FFT.

    Sin scipy en la máquina, un IIR de un polo pide un bucle de 1,25
    millones de muestras en Python puro: tarda más que renderizar el
    video. En frecuencia es una multiplicación y sale en milisegundos.
    """
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1.0 / SR)
    with np.errstate(divide='ignore', invalid='ignore'):
        if modo == 'bajos':
            H = 1.0 / np.sqrt(1.0 + (f / hz) ** (2 * orden))
        else:
            H = 1.0 / np.sqrt(1.0 + (hz / np.maximum(f, 1e-9)) ** (2 * orden))
    return np.fft.irfft(X * H, n=len(x))


def sierra(hz, fase=0.0, armonicos=14, techo=12000.0):
    """Sierra por serie de armónicos, recortada antes de Nyquist. Hecha
    así y no con un módulo no suena a escalera digital."""
    s = np.zeros(N)
    for k in range(1, armonicos + 1):
        if hz * k > techo:
            break
        s += np.sin(2 * np.pi * hz * k * t + fase) / k
    return s * 0.55


# ── la batería ─────────────────────────────────────────────────────
def bombo(ini, vol=1.0):
    """El pitch cae de 150 a 45 Hz en 60 ms: eso es lo que lo hace
    sonar a bombo y no a pitido grave."""
    largo = 0.40
    i0, i1 = int(ini * SR), min(int((ini + largo) * SR), N)
    if i0 >= N:
        return np.zeros(N)
    n = i1 - i0
    tt = np.arange(n) / SR
    hz = 45 + 105 * np.exp(-tt / 0.055)
    cuerpo = np.sin(2 * np.pi * np.cumsum(hz) / SR) * np.exp(-tt / 0.13)
    clic = np.random.default_rng(int(ini * 1000)).standard_normal(n) * np.exp(-tt / 0.0035) * 0.5
    s = np.zeros(N)
    s[i0:i1] = (cuerpo + clic) * vol
    return s


def hat(ini, vol=0.22, largo=0.045, abierto=False):
    if abierto:
        largo = 0.20
    e = env(ini, 0.001, largo, 0.0, 0.0, 0.0) * vol
    return filtro(ruido(int(ini * 7919) % 10000) * e, 7200, 'altos')


def palmas(ini, vol=0.55):
    """Tres golpecitos de ruido separados 9 ms: así suena un clap y no
    un golpe de ruido pelado."""
    s = np.zeros(N)
    for k, g in enumerate([0.55, 0.85, 1.0]):
        e = env(ini + k * 0.009, 0.001, 0.012, 0.0, 0.0, 0.10) * g
        s += ruido(4242 + k) * e
    return filtro(s, 1400, 'altos') * vol


# ── bajos y sintetizadores ─────────────────────────────────────────
def sub(hz, ini, largo, vol=0.5):
    e = env(ini, 0.012, 0.05, largo * 0.8, 0.85, largo * 0.15) * vol
    return np.sin(2 * np.pi * hz * t) * e


def bajo(hz, ini, largo, vol=0.34, corte=320.0):
    """Sierra filtrada: el cuerpo del tema."""
    e = env(ini, 0.006, 0.08, largo * 0.7, 0.75, largo * 0.22) * vol
    return filtro(sierra(hz, armonicos=10) * e, corte, 'bajos', orden=1.6)


def arpa(hz, ini, largo, vol=0.16):
    """Nota corta y brillante del arpegio."""
    e = env(ini, 0.003, largo * 0.5, 0.0, 0.0, largo * 0.5) * vol
    s = sierra(hz * 2, armonicos=8) * 0.6 + np.sin(2 * np.pi * hz * 2 * t) * 0.8
    return filtro(s * e, 4800, 'bajos')


def colchon(hzs, ini, largo, vol=0.09):
    """Pad: varias sinusoides con vibrato lento y entrada larga."""
    e = env(ini, largo * 0.3, largo * 0.1, largo * 0.4, 0.85, largo * 0.2) * vol
    vib = 1 + 0.003 * np.sin(2 * np.pi * 4.3 * t)
    s = np.zeros(N)
    for hz in hzs:
        s += np.sin(2 * np.pi * hz * t * vib) + 0.35 * np.sin(2 * np.pi * hz * 2.003 * t)
    return s / max(len(hzs), 1) * e


# ── los efectos ────────────────────────────────────────────────────
def riser(ini, largo, vol=0.26):
    """Ruido que sube de corte + sinusoide que sube de tono. Lo que
    avisa, sin decirlo, que algo grande está por pasar."""
    i0, i1 = int(ini * SR), min(int((ini + largo) * SR), N)
    if i0 >= N:
        return np.zeros(N)
    n = i1 - i0
    x = np.linspace(0, 1, n)
    nz = np.random.default_rng(9001).standard_normal(n)
    sweep = np.sin(2 * np.pi * np.cumsum(220 + 1500 * x ** 2) / SR)
    s = np.zeros(N)
    s[i0:i1] = (nz * 0.6 + sweep * 0.5) * (x ** 2.2)
    return filtro(s, 900, 'altos', orden=1.2) * vol


def impacto(ini, vol=0.9, largo=2.4):
    """El golpe: un sub que cae, ruido grave y una cola larga."""
    i0, i1 = int(ini * SR), min(int((ini + largo) * SR), N)
    if i0 >= N:
        return np.zeros(N)
    n = i1 - i0
    tt = np.arange(n) / SR
    hz = 38 + 120 * np.exp(-tt / 0.09)
    s = np.zeros(N)
    s[i0:i1] = (np.sin(2 * np.pi * np.cumsum(hz) / SR) * np.exp(-tt / 0.55)
                + np.random.default_rng(777).standard_normal(n) * np.exp(-tt / 0.22) * 0.30)
    return s * vol


def whoosh(ini, largo=0.45, vol=0.18, sube=True):
    i0, i1 = int(ini * SR), min(int((ini + largo) * SR), N)
    if i0 >= N:
        return np.zeros(N)
    n = i1 - i0
    x = np.linspace(0, 1, n)
    campana = np.sin(np.pi * x) ** 1.4
    s = np.zeros(N)
    s[i0:i1] = np.random.default_rng(int(ini * 311) % 9999).standard_normal(n) * campana
    corte = 2600 if sube else 1200
    return filtro(s, corte, 'altos', orden=1.0) * vol


# ── el diseño de sonido de la interfaz ─────────────────────────────
def clic(ini, hz=2100, vol=0.10, largo=0.028):
    """El clic de la interfaz: corto, agudo y seco."""
    e = env(ini, 0.0008, largo, 0.0, 0.0, 0.004) * vol
    return (np.sin(2 * np.pi * hz * t) + 0.4 * np.sin(2 * np.pi * hz * 2.7 * t)) * e


def aviso(ini, vol=0.13):
    """La notificación: dos notas, la segunda una quinta arriba."""
    return (clic(ini, nota(16, 880), vol, 0.075)
            + clic(ini + 0.085, nota(23, 880), vol * 0.9, 0.11))


def obturador(ini, vol=0.16):
    """La cámara: dos chasquidos de ruido a 55 ms, que es lo que tarda
    una cortinilla de verdad."""
    s = np.zeros(N)
    for d, g in [(0.0, 1.0), (0.055, 0.7)]:
        e = env(ini + d, 0.0006, 0.014, 0.0, 0.0, 0.012) * g
        s += np.random.default_rng(int((ini + d) * 977) % 9999).standard_normal(N) * e
    return filtro(s, 2200, 'altos') * vol


def glitch(ini, vol=0.07, largo=0.07):
    """Un pedacito de ruido troceado: el detalle digital."""
    i0, i1 = int(ini * SR), min(int((ini + largo) * SR), N)
    if i0 >= N:
        return np.zeros(N)
    n = i1 - i0
    nz = np.random.default_rng(int(ini * 131) % 9999).standard_normal(n)
    paso = max(1, n // 7)
    for k in range(0, n, paso):            # se mantiene el valor: suena a bit roto
        nz[k:k + paso] = nz[k]
    s = np.zeros(N)
    s[i0:i1] = nz * np.linspace(1, 0, n)
    return filtro(s, 700, 'altos') * vol


# ── la mezcla ──────────────────────────────────────────────────────
def reverb(x, segundos=1.6, mezcla=0.22):
    """Reverb barata: ruido que decae, convolucionado por FFT."""
    n = int(segundos * SR)
    cola = (np.random.default_rng(31337).standard_normal(n)
            * np.exp(-np.arange(n) / (SR * segundos / 4.5)))
    cola[0] = 1.0
    cola /= np.abs(cola).sum() / 2.2
    largo = 1
    while largo < len(x) + n:
        largo *= 2
    y = np.fft.irfft(np.fft.rfft(x, largo) * np.fft.rfft(cola, largo))[:len(x)]
    return x * (1 - mezcla) + y * mezcla


def componer():
    mezcla = np.zeros(N)

    # ── 0 · el pulso digital, con la pantalla todavía negra ──
    mezcla += colchon([nota(-24), nota(-17), nota(-12)], 0.0, 6.0, 0.07)
    for k in range(5):                       # el latido que abre
        mezcla += clic(T_PULSO + k * NEGRA, 1400 - k * 120, 0.055 + k * 0.012, 0.05)
    mezcla += sub(nota(-36), T_PULSO, 3.2, 0.30)
    mezcla += obturador(T_FOTO1, 0.17)       # la primera foto entra con la cámara
    mezcla += whoosh(T_FOTO1 - 0.22, 0.34, 0.12)

    # ── 1-2 · entran las fotos, una por corchea ──
    for k in range(12):
        ti = 2.0 + k * (NEGRA / 2)
        mezcla += clic(ti, 1700 + (k % 4) * 260, 0.045, 0.02)
        if k % 3 == 0:
            mezcla += obturador(ti, 0.085)
    mezcla += whoosh(3.5, 0.5, 0.14)

    # ── 3-8 · el cuerpo: bombo en negras, bajo, arpegio ──
    # La menor otra vez, y por el mismo motivo que el reel: en veintiséis
    # segundos no hay tiempo de que el oído aprenda nada raro.
    GRADOS = [nota(-24), nota(-29), nota(-27), nota(-25)]   # Am F C G, por compás
    paso = 0
    ti = T_BEAT
    while ti < T_RISER:
        compas = int((ti - T_BEAT) // COMPAS)
        raiz = GRADOS[compas % 4]
        if paso % 4 == 0:                                   # negra: bombo
            mezcla += bombo(ti, 0.95)
            mezcla += bajo(raiz, ti, NEGRA * 0.92, 0.30)
        if paso % 8 == 4:                                   # 2 y 4: palmas
            mezcla += palmas(ti, 0.42)
        mezcla += hat(ti, 0.14 if paso % 2 else 0.20,
                      abierto=(paso % 8 == 6))              # corcheas
        if ti >= 8.0:                                       # el arpegio entra después
            g = [0, 3, 7, 12, 7, 3][paso % 6]
            mezcla += arpa(nota(-12 + g, raiz * 2), ti, NEGRA * 0.6, 0.11)
        paso += 1
        ti = T_BEAT + paso * (NEGRA / 2)
    mezcla += colchon([nota(-12), nota(-9), nota(-5)], T_BEAT, T_RISER - T_BEAT, 0.055)

    # el teléfono que se vuelve pantalla del salón, y el mosaico
    mezcla += whoosh(T_SALA - 0.3, 0.55, 0.19)
    mezcla += impacto(T_SALA, 0.34, 1.2)
    mezcla += glitch(T_SALA - 0.05)
    mezcla += whoosh(T_MOSAICO - 0.25, 0.45, 0.16)
    mezcla += impacto(T_MOSAICO, 0.26, 1.0)

    # los avisos de la interfaz, salteados para que no suenen a metrónomo
    for ti in [6.4, 7.9, 9.2, 11.6, 12.8, 15.3, 16.7]:
        mezcla += aviso(ti, 0.085)
    for ti in [5.2, 10.9, 13.4, 17.1]:
        mezcla += glitch(ti, 0.05)

    # ── 9 · el riser ──
    mezcla += riser(T_RISER, T_GOLPE - T_RISER, 0.30)
    for k in range(8):                       # redoble que se cierra
        mezcla += hat(T_RISER + k * 0.25 * (1 - k * 0.07), 0.10 + k * 0.012)
    mezcla += sub(nota(-36), T_RISER, 2.0, 0.22)

    # ── 10-11 · EL GOLPE ──
    mezcla += impacto(T_GOLPE, 1.0, 2.6)
    mezcla += whoosh(T_GOLPE - 0.35, 0.4, 0.22)
    paso = 0
    ti = T_GOLPE
    while ti < T_MARCA:
        compas = int((ti - T_GOLPE) // COMPAS)
        raiz = [nota(-24), nota(-29)][compas % 2]
        if paso % 4 == 0:
            mezcla += bombo(ti, 1.0)
            mezcla += bajo(raiz, ti, NEGRA * 0.9, 0.34, corte=420)
            mezcla += sub(raiz / 2, ti, NEGRA * 0.9, 0.30)
        if paso % 8 == 4:
            mezcla += palmas(ti, 0.5)
        mezcla += hat(ti, 0.16 if paso % 2 else 0.22, abierto=(paso % 8 == 6))
        g = [0, 7, 12, 16, 12, 7][paso % 6]
        mezcla += arpa(nota(g, raiz * 2), ti, NEGRA * 0.55, 0.14)
        paso += 1
        ti = T_GOLPE + paso * (NEGRA / 2)
    mezcla += colchon([nota(0), nota(4), nota(7), nota(12)], T_GOLPE, 4.2, 0.085)
    mezcla += aviso(T_FRASE2, 0.10)

    # ── 12 · la marca ──
    # Se cae la batería y queda el acorde: el logo no necesita ruido.
    mezcla += impacto(T_MARCA, 0.55, 1.6)
    mezcla += colchon([nota(-12), nota(-5), nota(0), nota(7)], T_MARCA, DUR - T_MARCA, 0.11)
    mezcla += clic(T_MARCA + 0.9, nota(12, 880), 0.05, 0.12)

    return mezcla


def forma():
    """La curva de volumen de la pieza entera.

    Sin esto el cuerpo salía PLANO: medido, de 4 a 18 segundos todo daba
    0,08 de RMS y el tema no crecía: llegaba al golpe sin haber subido
    nunca, que es justo lo que hace que un comercial se sienta barato.
    El hueco de los 18 a los 20 es a propósito — el silencio antes del
    golpe es lo que hace que el golpe pegue."""
    puntos = [(0.0, 0.50), (2.0, 0.62), (4.0, 0.70), (8.0, 0.80),
              (12.0, 0.88), (16.0, 0.97), (T_RISER, 0.82), (T_GOLPE - 0.25, 0.62),
              (T_GOLPE, 1.0), (T_MARCA, 1.0), (DUR, 1.0)]
    xs = np.array([p[0] for p in puntos])
    ys = np.array([p[1] for p in puntos])
    return np.interp(t, xs, ys)


def masterizar(x):
    """Forma, reverb corta, un compresor suave y normalizado con aire."""
    x = x * forma()
    x = reverb(x, 1.6, 0.20)
    # compresor de envolvente: se calcula el nivel suavizado y se baja
    # lo que se pase. Sin esto el golpe se come todo lo demás.
    nivel = np.abs(x)
    v = int(SR * 0.03)
    nivel = np.convolve(nivel, np.ones(v) / v, mode='same')
    # Umbral alto y relación suave: con 0,35 y 0,55 el compresor comía
    # la diferencia entre el cuerpo y el golpe, que es lo único que la
    # pieza tiene que contar.
    umbral = 0.52
    ganancia = np.ones(N)
    arriba = nivel > umbral
    ganancia[arriba] = (umbral / nivel[arriba]) ** 0.72
    x = x * ganancia
    pico = np.abs(x).max()
    if pico > 0:
        x = x / pico * 0.92
    # fundido de entrada y salida, que un corte seco se escucha
    e = np.ones(N)
    na, nb = int(0.02 * SR), int(0.45 * SR)
    e[:na] = np.linspace(0, 1, na)
    e[-nb:] = np.linspace(1, 0, nb) ** 1.5
    return x * e


def guardar(x, ruta):
    datos = (np.clip(x, -1, 1) * 32767).astype('<i2')
    estereo = np.repeat(datos[:, None], 2, axis=1).tobytes()
    with wave.open(ruta, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(estereo)
    print(f'  musica-vivo: {DUR:.3f}s · {BPM:.0f} BPM · {ruta}')


if __name__ == '__main__':
    guardar(masterizar(componer()), sys.argv[1] if len(sys.argv) > 1 else 'musica-vivo.wav')
