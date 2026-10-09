# Reel de invitaciones · qué decidí y qué descarté

**Entrega:** `video/reel-invitaciones.mp4` — 1920×1080, 60 fps, 15,000 s
exactos, H.264 + AAC estéreo 48 kHz, 6,3 MB.
**Se rehace con:** `bash video/armar.sh reel` (unos 3 minutos y medio).

---

## Lo primero: la rejilla

Todo lo demás sale de acá. **128 BPM**, negra 0,46875 s, compás 1,875 s,
**ocho compases = 15,000 s exactos**. No es una casualidad buscada
después: elegí el tempo para que ocho compases dieran los quince
segundos pedidos, y recién entonces escribí la música y el guion.

Los ocho cortes del video caen en los ocho compases:

| Compás | Segundo | Qué pasa |
|---|---|---|
| C1 | 0,000 | El título se arma letra por letra mientras sube un *riser* |
| C2 | 1,875 | **Golpe.** El título entra de una y los tres modelos suben |
| C3 | 3,750 | Los tres, cada nombre entrando en su negra |
| C4 | 5,625 | Uno toma el centro, los otros se van de foco |
| C5 | 7,500 | **Pico.** La cuenta regresiva |
| C6 | 9,375 | La confirmación: "Sí, voy" y el gracias |
| C7 | 11,250 | Los tres en perspectiva |
| C8 | 13,125 | Cierre |

Un corte fuera de tiempo se nota aunque el que mira no sepa por qué. Por
eso el nombre de cada modelo entra en una negra y no "cuando queda
lindo", y por eso hay un destello de un cuadro en cada cambio de compás.

## La música

Compuesta y sintetizada desde cero en `video/musica.py`, con numpy. **No
hay un solo sample**: todo sale de osciladores, ruido y envolventes
calculadas ahí.

- **Armonía:** La menor. Am – Am – F – F – C – C – G – Am. Es la
  progresión más usada del mundo y eso no es un defecto: en quince
  segundos no hay tiempo de que el oído aprenda nada raro.
- **Instrumentos**, todos escritos a mano: un *pluck* (dos sierras
  apenas desafinadas más una sinusoide de cuerpo), un colchón de
  sinusoides con vibrato, un bajo sinusoidal saturado con `tanh`, un
  bombo que es una sinusoide barriendo de 150 a 42 Hz con un clic de
  ruido de 6 ms, campanitas con armónicos no enteros, y ruido filtrado
  para el *riser* y el impacto.
- **Reverb** por convolución FFT con una cola de ruido que decae. Un
  delay realimentado habría sido más barato y suena a lata.
- **Arco:** la energía por compás es 26 · 30 · 17 · 20 · 39 · 40 · 28 ·
  34. Intro, caída, pico, resolución.

## Las tres iteraciones que importaron

### 1. La música arrancaba más fuerte que el cuerpo

Medí la envolvente por compás y el arco estaba al revés: los compases 3 y
4 quedaban **por debajo** de la intro, porque el impacto del compás 2 se
los comía. Bajé el impacto de 0,8 a 0,37, el *riser* de 0,34 a 0,17, y le
puse a cada elemento un peso que crece compás a compás en vez de un
volumen plano.

En la misma medición salió que había **más agudos que graves** (138,5 dB
contra 126,0). Para una pieza que se va a ver en un teléfono eso raspa:
le bajé los armónicos al *pluck* (de 14 a 8, y pesando 1/k² en vez de
1/k) y le puse un paso bajo de un polo a 6,5 kHz al máster.

### 2. El flash del golpe tapaba el título

El destello del compás 2 duraba 0,34 s con alfa 0,5. A mitad del golpe la
pantalla era un rectángulo crema y el título —lo único que hay que leer
ahí— no se veía. Quedó en 0,13 s y alfa 0,34.

### 3. El AAC clippeaba el audio

El WAV estaba masterizado a −1,0 dBFS, que parece prudente. Pero el AAC
del MP4 reconstruye la onda y se pasa: medí el audio **dentro del
archivo final** y daba **0,0 dBFS**. Bajé el máster a −2,5 y el archivo
quedó en −0,70 con cero muestras clipeadas.

Esto no se ve mirando el WAV. Es la misma disciplina que ya me había
agarrado un bug en los videos anteriores: **medir el archivo encodeado,
no el material de origen.**

## Lo que descarté

- **Las fotos del evento de prueba.** Viven en Supabase y desde esta
  máquina el proxy devuelve 403 al CONNECT: es política de la
  organización, no algo que pueda sortear. Lo verifiqué antes de
  prometer nada.
- **Key y Xiomara en vivo.** Están alojadas en Netlify, que también está
  bloqueado. Lo que se ve de ellas es la **portada dibujada de la propia
  galería**, con el nombre, el tipo y los colores reales de cada fiesta.
  No es un invento del video: es el diseño de la página. El día que esas
  dos carpetas estén en el repo, `capturar-reel.js` las captura en vivo
  sin cambiarle una línea.
- **Grabar en tiempo real** con `MediaRecorder`. Cada cuadro se pide por
  su tiempo exacto (`window.pintar(t)`) y se pipea a ffmpeg: sale parejo
  aunque la máquina vaya lenta y se puede volver a generar idéntico.
- **Locución.** En quince segundos compite con la música y obliga a
  subtítulos. El texto en pantalla hace el trabajo.
- **Más de un acento de color.** Cada modelo aporta el suyo (verde
  bosque, rosa, vino) y el oro de la marca los une. Meter un cuarto color
  habría sido ruido.

## Lo que queda por hacer, y no puedo hacer yo

1. **Las fotos reales.** Si me pasás las del evento de prueba, el reel y
   los otros dos videos las toman: hay una carpeta `video/fotos/` que, si
   tiene JPG o PNG, se usa en vez de las manchas de luz inventadas.
2. **Key y Xiomara en el repo.** Las carpetas enteras —HTML, fotos y
   música—, no solo el HTML. Ahí dejan de depender de Netlify, abren
   siempre, y el reel las muestra funcionando de verdad.

## Tiempo

**16 minutos** de punta a punta: investigar qué había disponible,
verificar los bloqueos de red, capturar los tres modelos, componer y
medir la música (dos iteraciones), escribir y corregir la escena (una
iteración de composición), renderizar los 900 cuadros, encontrar y
arreglar el clipping del AAC, y volver a armar todo de cero para
comprobar que es reproducible.

El render solo son 3 minutos y medio de esos 16.
