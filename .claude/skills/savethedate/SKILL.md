---
name: savethedate
description: Hacer, retocar o publicar un save the date de Click Eterno — el modelo "afiche" que nació con lola15 (negro y hueso, letras enormes, entrada con palabras que golpean, tramas de puntos). Usala cuando el dueño pida un save the date, "el modelo de Lola", "el afiche", o mande datos de una fiesta para ese modelo. Para una invitación clásica (con sobre, fotos, canción) va la skill tarjeta.
---

# Hacer un save the date

Es un apartado propio desde el 16/11/2026. El modelo es **`lola15/`**
(copia en `tarjetas/lola15.html`, crónica en `invitaciones/HISTORIA.md`).
Las reglas fijas de `CLAUDE.md` y la skill `/tarjeta` valen enteras
(planilla, pruebas, publicar, lo que nunca). Acá va solo lo propio de
este modelo.

## 1. Qué es y qué pidió el dueño

Salió de un video de referencia y de esta frase: *"Tiene mucho punch. No
es algo así nomás. Tiene que tener el mismo impacto, si no parece un
PowerPoint."* La vara es esa: **si no golpea, no sirve.**

De dónde sale el golpe, en orden de importancia:

1. **La entrada** (`#sobre`): tres palabras que caen de a una, torcidas,
   con un destello que invierte la pantalla en la segunda.
2. **El nombre que se derrite** en otra palabra y vuelve, una sola vez.
3. **Títulos de afiche**: cada renglón llena el ancho de borde a borde y
   entra de abajo, de un saque.
4. **Tramas de puntos** dibujadas en el momento (lluvia de grano, bola de
   espejos, haces de luz) en lugar de fotos.
5. **Lo que se mueve con el dedo**: las cintas, la ruta del mapa, el riel
   del plan, la bola.
6. **El cierre** con una palabra manuscrita en el acento, cruzada sobre
   el título.

## 2. Cómo se hace uno nuevo

1. `git fetch origin main && git merge origin/main`.
2. Copiar `lola15/` a `<carpeta>/` (minúscula, sin espacios ni acentos).
3. Cambiar **solo el `CONFIG`** y los textos fijos que nombran la fiesta:
   - las tres palabras de la entrada (`.golpes`, con su `--s`: más letras,
     número más chico; que la palabra no pase del 80 % del ancho);
   - la segunda palabra del derretido (`.goo .b`) y su tamaño;
   - el título de la portada ("Estás en la lista") y "Los XV de";
   - `<title>`, `description`, los `og:` y el texto de Agendar.
4. **Un campo vacío no se dibuja**: `plan: []` y `trivia: []` sacan su
   sección; sin `alias` no hay regalo; sin `lugar` ni `calle` no hay mapa;
   sin `dressTitulo` no hay dress code; sin `confirmarHasta` no hay renglón.
5. Sacar del pie el renglón **"Invitación de muestra"**: es solo de Lola.
6. `og.jpg` nueva, tipográfica, 1200x630: se arma con el mismo `tramar()`
   de la página y una captura (así se hizo la de Lola).
7. Planilla y tablero como en toda tarjeta (`CONFIG.endpoint`, `listado/`).
   En Lola está vacío porque es muestra.
8. Probar, publicar, crónica, pendientes y copia en `tarjetas/`.

**Los datos no se inventan.** El plan de la noche y la trivia de Lola son
de ejemplo: los de un cliente los manda el cliente, y si no los manda la
sección no va. El mapa es un dibujo genérico, no el plano del lugar: el
dato cierto es el botón con el enlace de Maps que mande.

## 3. Cómo está hecho (para no romperlo)

- **Paleta**: negro `#0A0A0A`, hueso `#ECE7DC` y **un** acento. El acento
  de Lola (`#FF3D8B`) va **solo sobre negro**: sobre hueso da 2,7:1 y no
  sirve de texto. Si el cliente pide otro color, se cambia `--acento` y se
  mide contra el negro antes de escribir nada.
- **Tipografías**: Montserrat 900 (títulos), Space Grotesk (texto y cifras
  finas, peso 300) y Reenie Beanie (la palabra a mano).
- **Los renglones que llenan el ancho** los mide `ajustar()`: pone el
  texto a 100 px, mide y le da el tamaño justo. Corre de nuevo cuando
  cargan las fuentes y al cambiar el ancho. `--f` es el tamaño sin JS.
- **Las tramas**: `tramar(canvas, luz, paso)`. `luz(x, y, w, h)` devuelve
  de 0 a 1 y la trama tira un punto con esa probabilidad. La semilla es la
  fecha. El canvas va **transparente** sobre un padre negro, y se pinta
  recién cuando está por verse. Un dibujo nuevo es una función `luz` nueva.
- **El derretido** es desenfoque en la letra + `contrast(40)` en la caja.
  Dos trampas: con contraste alto el hueso **se tiñe de naranja** (mientras
  dura va en `#fff`) y el negro de la caja queda distinto al de al lado
  (por eso la entrada va en `#000`). Al terminar se saca la clase
  `liquido`: en reposo deja el borde serruchado.
- **La apertura es un cruce**: la entrada se apaga mientras la portada se
  enciende, y `#sobre` **se saca del DOM** al terminar. La prueba lo mide
  así; un barrido o un corte no pasan.
- **Un elemento tapado entero por su `clip-path` no despierta al
  observador.** La palabra manuscrita se destapa por el título de al lado
  (`.tit.entro ~ .ahi`), no por sí misma.
- **Lo decorativo que se desborda lleva `pointer-events:none`** (cintas,
  cruces, canvas); si no, la prueba lo cuenta como algo que se sale. La
  marca del día del calendario tiene que entrar en su celda.
- **El cartel del mapa** se acomoda por JS pegado al pin: a mano quedaba
  encima.
- Un texto sobre un canvas lleva **su propio fondo negro**: el medidor de
  contraste no ve el dibujo, pero el ojo sí.
- **La confirmación y el pie se copiaron enteros de `lucia15/`** y no se
  rearman (ver `/tarjeta`, punto 4).
- Con "menos movimiento" todo queda quieto y a la vista, sin entrada.

## 3b. El sonido

Pedido del dueño (16/11/2026): *"sonidos llamativos de acuerdo a los
impactos y una música acorde, así armo una publicidad"*.

- **No hay archivos**: todo lo fabrica el navegador (objeto `SONIDO`).
  Golpe en cada palabra de la entrada, chasquido en el destello, subida
  antes del nombre, "gota" en cada derretido, golpe chico en cada título
  que entra, acierto y error en la trivia.
- **Los siete woosh** (`WOOSH`) se rehicieron midiendo un muestrario que
  mandó el dueño; no se usó el audio ajeno. Cada uno tiene su lugar: los
  tres "limpios" en las palabras de la entrada, "oscuro" cuando aparece
  el nombre, "hueco" en el derretido, "hondo" en "Entrar a la fiesta" y
  "aireado" en cada título que entra. `woosh(nombre, t)`: `t` es el
  **pico**, que es lo que cae con la imagen.
- **La canción** (`CONFIG.cancion`): dos archivos y `entra`, el segundo
  donde la canción levanta (se busca midiendo el volumen cada 0,05 s). Pasa
  por el filtro: apagada en la entrada, abierta al entrar, y al entrar
  **salta a `entra` menos medio segundo**. Suena una vez y se rebobina. El
  salto no anda en el servidor de pruebas: se mira en la página publicada.
  Sin archivos suena la base de pista de abajo.
- **La música** es una base de pista a 124 que suena **apagada** en la
  entrada y **se abre** con "Entrar a la fiesta".
- **Sin un toque no suena nada**: por eso la entrada arranca con "Tocá
  para empezar" (`#empezar`). `#abrir` sigue abriendo de un toque.
- **Los tiempos de `intro()` son los de las animaciones del CSS**: si se
  mueve un `animation-delay` de la entrada, se mueve su golpe.
- Hay un botón de silencio fijo (`#sonido`). Al esconder la pestaña se
  calla sola.
- **No se puede escuchar desde el chat.** Se vuelca a un archivo con
  `OfflineAudioContext` usando `SONIDO._` y se miden picos y volumen por
  segundo (que no pase de 1, que la parte apagada quede más baja). El
  oído lo pone el dueño: preguntarle cómo suena.

## 4. Lo que este modelo NO tiene todavía

- **Fotos**: no lleva. Si el cliente manda las suyas van en blanco y negro
  con el filtro en el CSS; nunca fotos de internet, que es lo que tenía la
  referencia.
- **Lista de regalos con "reservar"**: es maquinaria nueva. Lo simple es
  el alias.
- **"Subí tus fotos"**: eso es el Muro; va un botón que lleve ahí.

## 5. Probar y publicar

    python3 pruebas/servidor.py 8099        # en segundo plano
    node pruebas/invitacion_mirar.js <carpeta>
    node pruebas/invitaciones.js

Y **mirarlo**: capturas de la entrada a varios tiempos (0,5 s, 1,2 s,
1,9 s, 3,4 s, 5,5 s, 8,5 s) y de cada sección en 390 de ancho. Lo que más
se rompe sin dar error es la entrada, y solo se ve mirando.

Publicar como siempre (`CLAUDE.md`). El informe al dueño: qué tiene, qué
es distinto y qué falta de su lado, corto.
