---
name: tarjeta
description: Hacer, retocar o publicar una invitación digital de Click Eterno — lo que el dueño llama "la tarjeta". Usala cuando el pedido sea armar una invitación nueva para un cliente, cambiarle algo a una que ya existe (portada, fotos, canción, sobre, iconos, dress code, regalo, confirmación), poner una referencia que mandó por captura, o dejarla publicada. También cuando mande datos de una fiesta (fecha, salón, alias, colores, dress code) o archivos de una clienta sin decir qué hacer con ellos.
---

# Hacer una tarjeta

El orden de trabajo. Las reglas fijas (qué lleva toda tarjeta, diseño,
planilla, pruebas, publicar, lo que nunca) están en **`CLAUDE.md`** y no
se repiten acá. Esto suma solo lo que CLAUDE.md no dice.

## 1. Antes de escribir una línea

1. `git fetch origin main && git merge origin/main`.
2. **`invitaciones/HISTORIA.md`**, la crónica de **la tarjeta de la que
   vas a copiar**. Lo que se queda viejo al copiar no es el código: es el
   dato escrito a mano en un renglón que nadie vuelve a mirar. Ya se
   publicó el nombre de una clienta en la fiesta de otra.
3. **`invitaciones/COMO-SE-HACE.md`** si hay dudas de CSP, pesos, nombres
   de carpeta prohibidos o RSVP.
4. **`PROYECTO.md`** solo si se va a tocar algo de afuera de la carpeta.

## 2. Lo que el dueño pide siempre sin decirlo

- **La planilla va con la tarjeta.** *"Siempre que hagas la tarjeta tenés
  que hacer la planilla. No hace falta aclararlo."*
- **Que sorprenda y que no sea igual a la anterior**: *"misma paleta pero
  con otras animaciones"*. Se copia la maquinaria, no el aspecto.
- **Que sea lujosa**: cada sección con su emblema.
- **Optimizar tokens**: capturas solo para mirar lo nuevo, nada de volcar
  archivos, informe en pocas líneas.

## 3. El pedido

**El dato que no llegó no se inventa y tampoco queda un hueco a la
vista.** Hay dos formas:

- **Lo normal**: el campo del `CONFIG` queda vacío y su renglón no se
  dibuja.
- **La píldora de "falta"**: con `CONFIG.borrador` en `true` se dibuja un
  cartelito con lo que falta, y se va solo cuando el dato existe. Sirve
  cuando el dueño pide *"hacé todo y dejá los huecos así vamos viendo"*.
  **Se apaga antes de repartir el link.**

**El alias lleva el rótulo "Alias para transferir"** arriba: el dueño lo
pasa diciendo "el cbu", y un alias pegado donde el banco pide un CBU no
entra.

**La frase del cliente va casi literal**: es la voz de quien invita. No se
mejora.

## 4. La confirmación se copia ENTERA

Es la única parte medida contra una fiesta de verdad, y no se rearma:

- una comida **por persona**;
- el que dice que no, no manda "Cuántos";
- el mensaje sigue a la vista aunque conteste que no;
- **un solo viaje** al Apps Script.

Si se agrega o se saca una pregunta, se relee el aviso de datos: es lo que
lo hace verdadero o una formalidad que miente.

## 5. Decisiones que vuelven

- **Un detalle de una referencia no se copia solo: viene con lo que lo
  hace cierto.** Un sobre abierto sin lacre no es un sobre abierto con
  lacre.
- **Antes de dibujar una pieza de la marca del cliente, preguntar si la
  tiene.** Se perdieron seis vueltas dibujando unas alas para terminar con
  algo que no se le parecía.
- **Un icono o un monograma se elige mirando**: cinco versiones al tamaño
  real y al de un teléfono, y se compara. Cambiar algo "por descripción"
  falló tres veces seguidas.
- **Lo que no se lee a 42 px no va.** De tres detalles de un icono, quedan
  dos. Y un emblema va donde se lee, no donde entra; si su archivo falta,
  queda el dibujo de siempre, nunca un cuadrado roto.
- **Fotos en blanco y negro con el filtro en el CSS**, no quemado en el
  archivo, salvo el dress code (ahí el color es el dato) o cuando el
  cliente pida color. Cuatro fotos a color meten cuatro paletas.
- **El encuadre se arregla en el archivo, no en el CSS.**
- **Sin sobre, la canción** se intenta al cargar; si el navegador la
  bloquea, suena con el primer toque en cualquier parte.
- **El sobre**: la carta vive DETRÁS de un frente opaco, no adentro. Lo
  que entra con el sobre se va con el sobre, y lo que viaja adentro de la
  carta se va antes que ella.
- **Un renglón que se agrega o se saca de una portada con foto mueve todo
  lo de abajo**: el velo se vuelve a medir cada vez que cambia el texto de
  la portada.
- **El estado sin JavaScript es el bueno**: lo que se ve sin JS tiene que
  verse bien.

## 6. La planilla, en la práctica

Lo fijo está en CLAUDE.md. Lo que suma esto:

- **El tablero no se crea antes de tener la `/exec`**: vacío no trae nada.
- **Si el cliente manda un correo para usar de contraseña**, se le dice el
  riesgo (es público y adivinable, y abre la lista entera de invitados con
  lo que comen) y se hace igual si lo sostiene. El correo va en
  `CLAVE_ELEGIDA` de la copia que se le entrega al dueño.
- **Probar que una fila entre de verdad** se puede desde acá (ver
  `PROYECTO.md`, "Probar el listado"). Lo que se escribe queda en la
  planilla del cliente: la fila de prueba se borra a mano.

## 7. Publicar y verificar

Los pasos están en CLAUDE.md. Dos cosas más:

- **Se puede renombrar la carpeta solo mientras el link no se repartió.**
- **Sacar una foto de la invitación no es lo mismo que borrarla del
  servidor**: el que tiene el HTML viejo guardado la sigue pidiendo.

## 8. El link y el informe

- **El link de la invitación** va con un texto en la voz de quien invita,
  que diga por qué querría que esa persona esté. Los datos abajo y cortos.
  El dato no se toca para que la frase cierre mejor.
- **"Pasame el listado"** (ver CLAUDE.md): texto en nuestra voz para el
  cliente, con el link completo y la contraseña de la fiesta del chat. Si
  todavía no se le mandó, va con el instructivo (`bash flyer/armar.sh`).
- **El informe**: qué cambió, qué se ve distinto, qué falta de su lado. Si
  algo salió mal, se dice.

## 9. La galería de la página

Decisión del dueño: *"todas las invitaciones que hagamos se muestren en
la página; sirve para que le genere confianza que hagamos muchas"*. Y se
muestran **enteras**: sin las fotos *"pierde la magia"*.

Para que entre:

1. **Se le pregunta al cliente**, porque son fotos de su familia en una
   dirección pública. El mensaje, en la voz de quien pregunta:

   > *"Quedó hermosa la invitación. ¿Te molesta si la mostramos en nuestra
   > página, en la galería de trabajos? Sirve para que los que nos
   > consultan vean lo que hacemos. Si preferís que no, no hay problema."*

   La respuesta se anota en la crónica, con fecha.
2. **En la galería el formulario no escribe en la planilla del cliente**:
   un desconocido le ensuciaría la lista con la que arma las mesas. Y el
   `noindex` se queda.
3. **Sin permiso, o si dice que no**, entra la versión de muestra: portada
   tipográfica, nombre y fecha inventados, sin alias.
4. La de un cliente con permiso no lleva píldora; una muestra nuestra sí
   (`muestra:true`).
5. **La ficha la suma el chat de la página** (`lib/trabajos.js`). Desde
   acá se avisa con el nombre de la carpeta, el tipo de fiesta y los tres
   colores de la portada dibujada.

## 10. Que el chat no se llene

Cuando el chat se llena se resume, y lo que no esté escrito en el
repositorio se pierde. Por eso:

- **La crónica se escribe en cada vuelta publicada**, no al final. Lo que
  falta del lado del cliente va a "Pendiente" de `PROYECTO.md` el día que
  aparece.
- Después de cada cosa publicada, el tema se cierra en una línea y no se
  vuelve sobre lo decidido.
- Si el dueño nota el chat lento puede usar `/compact` o abrir uno nuevo:
  lo que vale está en los archivos.

## 11. Al terminar

- La crónica en `invitaciones/HISTORIA.md`: qué pidió el cliente con sus
  palabras, qué se descartó y por qué, y lo que se veía bien y estaba mal.
- Si una lección vale para todo el proyecto, va a "Reglas que ya nos
  costaron caro" de `PROYECTO.md`.
- Los pendientes en `PROYECTO.md`, y la copia del HTML en
  `tarjetas/<nombre>.html`.
