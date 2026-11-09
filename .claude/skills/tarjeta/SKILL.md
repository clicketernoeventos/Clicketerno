---
name: tarjeta
description: Hacer, retocar o publicar una invitación digital de Click Eterno — lo que el dueño llama "la tarjeta". Usala cuando el pedido sea armar una invitación nueva para un cliente, cambiarle algo a una que ya existe (portada, fotos, canción, sobre, iconos, dress code, regalo, confirmación), poner una referencia que mandó por captura, o dejarla publicada. También cuando mande datos de una fiesta (fecha, salón, alias, colores, dress code) o archivos de una clienta sin decir qué hacer con ellos.
---

# Hacer una tarjeta

Esto es el procedimiento: en qué orden se hace, qué pide el dueño siempre
sin decirlo, y qué tiene que llevar toda tarjeta antes de publicarse.

Las razones de cada regla **no están acá**: están en los tres archivos del
punto 0. Esto es la receta, no el manual.

---

## 0. Antes de escribir una línea

1. **`invitaciones/COMO-SE-HACE.md`** — el manual: la CSP, los topes de
   peso, los nombres de carpeta prohibidos, cómo funciona el RSVP.
2. **`invitaciones/HISTORIA.md`**, la crónica de **la invitación de la que
   vas a copiar** — qué pidió ese cliente con sus palabras, qué se
   descartó y por qué. Una tarjeta nueva es una copia de la anterior: lo
   que se queda viejo nunca es el código, es el dato escrito a mano en el
   renglón que nadie vuelve a mirar (ya se publicó el nombre de una
   clienta en la fiesta de otra).
3. **`CLAUDE.md`**, "Reglas que ya nos costaron caro".

Y traer lo último: `git fetch origin main && git merge origin/main`.

---

## 1. Lo que el dueño pide SIEMPRE, sin decirlo

Esto no hay que preguntarlo. Es el pedido de base de cualquier tarjeta.

- **La planilla va con la tarjeta.** Dicho el 22/10/2026: *"Hace la
  planilla. Siempre que hagas la tarjeta tenés que hacer la planilla. No
  hace falta aclararlo."* Ver punto 6.
- **Termina PUBLICADA, no "lista para publicar".** *"siempre que te pida
  algo dale hasta que esté publicado"*. El camino entero —cambio, pruebas,
  commit, merge a `main`— va de corrido y no se le pide permiso en el
  último paso.
- **Lo que sí necesita su decisión es el CONTENIDO.** Un dato que no mandó
  el cliente no se inventa. Ver punto 2.
- **Movimiento, pero sin molestar.** *"Fíjate de poner animaciones o
  transiciones copadas para que se sorprendan pero que tampoco sea muy
  molesto"*. La regla que las separa: **cada animación pasa una sola vez,
  o va atada al scroll.** Nada que se repita solo delante de los ojos.
- **Que se vea lujosa.** *"que haya iconos aesthetic para cada cosa, que
  sea súper lujosa"*. Cada sección con su emblema; nada de una librería de
  iconos (la CSP no deja bajar un CDN).
- **Que no sea igual a la anterior.** Pide la misma base con otra cara:
  *"misma paleta de colores pero con otras animaciones"*. Lo que se copia
  es la maquinaria, no el aspecto.
- **Informe corto y en castellano.** *"No me des mucho detalle que yo no sé
  programación."* Qué cambió, qué se ve distinto, qué falta de su lado.
  Nombres de archivo, selectores y números de pruebas no le dicen nada.
- **No gastarle la sesión.** Dos comandos de prueba, una vez y al final
  (punto 7).
  *"Optimizá tokens"*: capturas sólo para mirar lo nuevo, nada de
  volcar archivos, y el informe en pocas líneas.

---

## 2. El pedido: lo que llega y lo que falta

De una fiesta hacen falta: **quién festeja, qué festeja, fecha, horario,
salón, dress code, alias para regalos y hasta cuándo se puede confirmar.**

**El dato que no llegó no se inventa y tampoco se deja en blanco.** Una
hora puesta a ojo manda a la gente a la hora equivocada; una fecha límite
inventada le cierra las mesas al invitado el día que no es. Las dos formas
de resolverlo, y las dos están escritas en el código:

- **Su renglón no se dibuja.** Es el caso normal: `CONFIG.confirmarHasta`
  vacío no escribe nada, en vez de inventar una fecha.
- **La píldora de "falta".** Con `CONFIG.borrador` en `true` se dibuja un
  cartelito que dice qué falta, y desaparece sola cuando el dato existe.
  Es para cuando el dueño pide *"hacé todo y dejá los huecos así vamos
  viendo qué modificar"*. **Antes de repartir el link se apaga.**

**Dos datos que se escriben TAL CUAL llegan**, sin "arreglarlos":

- **El alias.** En una tarjeta el punto del final resultó ser parte del
  alias y por poco se lo sacamos: copiado de menos, la transferencia del
  invitado va a otra cuenta. Y lleva el rótulo *"Alias para transferir"*
  arriba, porque el dueño lo pasa diciendo "el cbu" y pegar un alias donde
  el banco pide un CBU no entra.
- **La frase del cliente.** Lo que escribió la quinceañera o la pareja va
  casi literal: es la voz de quien invita, no la nuestra. No se mejora.

**Lo que SIEMPRE falta y hay que pedir:** el **titular de la cuenta** del
alias —el nombre que le muestra el banco al invitado cuando lo pega—. Sin
él ese renglón no existe; un nombre inventado al lado de un alias es peor
que ninguno.

---

## 3. Cómo se crea

**Se copia la invitación más parecida y se le cambia la cara.** No se
arranca de cero.

- La base más completa y mejor medida es **`ambar15/`** (sobre que se abre,
  medallones, cortes, canción, afiche de portada, franjas de foto,
  confirmación entera). Para una sin sobre, **`facuymaxi/`**.
- La carpeta va en la **raíz**, en minúscula, sin espacios ni acentos:
  `<nombre>/index.html` → `clicketerno.com.ar/<nombre>`. Los nombres
  prohibidos están en `COMO-SE-HACE.md`.
- **Se puede renombrar mientras el link no se haya repartido.** Repartido,
  no: un link repartido no se puede mover.

**Los `id` NO se renombran.** `pruebas/invitacion_mirar.js` los busca por
nombre, y lo que no encuentra lo informa como *"esta invitación no tiene
eso"* y queda en verde: una tarjeta con otros nombres se mide a medias.

    #abrir   #portada   #cD #cH #cM #cS   #calendario .elDia
    #rsvp    #fNombre   #fLugares   #fComida   #fMensaje
    #enviar  #aviso

**Y la confirmación se copia ENTERA**, que es la única parte medida contra
una fiesta de verdad: una comida **por persona**, el que dice que no no
manda "Cuántos", el mensaje sigue a la vista aunque conteste que no, y **un
solo viaje** al Apps Script.

---

## 4. Lo que toda tarjeta lleva sí o sí

Checklist. Cada renglón es una falla que ya pasó.

- [ ] **`<meta name="color-scheme" content="light dark">`** más el bloque
      `@media (prefers-color-scheme: dark)` que no cambia nada. Sin eso, el
      Android de la madre de la clienta la da vuelta entera y se la manda
      así a todos los invitados. Chrome y Samsung Internet necesitan
      señales opuestas: ésta es la que sirve para los dos.
- [ ] **`noindex`.** Es la fiesta de un cliente y hay menores en las fotos.
      No la esconde del que tiene el link; la saca de los buscadores.
- [ ] **Su `og.jpg` propia (1200x630), TIPOGRÁFICA.** Nunca una foto de la
      fiesta: viajaría en la vista previa de cada chat por el que pase el
      link.
- [ ] **`html:not(.js) #sobre{display:none}`** más el script de una línea
      en el `<head>` que pone la clase. Sin las dos, si el JS no corre el
      sobre tapa la invitación entera y no hay forma de abrirlo.
- [ ] **Cada `<img>` lo crea el JS, no el HTML**, y la sección aparece
      recién cuando la foto cargó de verdad. Un `<img>` con `src` vacío
      vuelve a pedir la página entera, y una foto caída deja un cuadrado
      roto sin un solo error.
- [ ] **Lo que se dibuja al azar sale de una semilla fija** (la fecha de la
      fiesta): si no, dos capturas de la misma invitación salen distintas.
- [ ] **El peso**: 1600 px y 300 KB por foto, 12 MB la carpeta. Las fotos
      en `.webp`; los PNG que manda el dueño pesan 1 o 2 MB cada uno.
- [ ] **Los recortes.** Encuadrar una foto que va a tener texto, un borde o
      una curva encima se hace **mirando la pantalla terminada en el
      aparato más chico**, no mirando la foto. El encuadre se arregla en el
      archivo, no en el CSS.
- [ ] **El aviso del artículo 6** adentro del formulario, y si se agrega o
      se saca una pregunta, ese párrafo se mira: es lo que lo vuelve
      verdadero o una formalidad que miente.
- [ ] **No entra en la galería de Trabajos ni en `/invitaciones`.** Esas
      dos muestran las muestras nuestras, no las fiestas de los clientes.

---

## 5. Las decisiones que vuelven en cada tarjeta

- **Una referencia se copia por el RECURSO, no por el color.** El dueño
  manda capturas y dice *"hacela igual pero con nuestro estilo para que no
  sea copia fiel"*. Lo que se toma es el armado —el cuenta atrás en línea,
  el encaje de borde, la cápsula de los detalles—; la paleta la manda el
  cliente. **Y un detalle de una referencia no se puede copiar solo: viene
  con lo que lo hace cierto** (un sobre abierto sin lacre no es un sobre
  abierto con lacre).
- **De una referencia NO se copia nunca**: el logo de una marca registrada
  —va el monograma del cliente— ni fotos de personas sacadas de internet
  (artículo 53, que está en nuestros propios Términos).
- **Si el cliente ya tiene su logo, su afiche o su empapelado, se usa EL
  SUYO.** Antes de dibujar una pieza de la marca de un cliente: preguntar
  si la tiene. Se perdieron seis vueltas dibujando alas para terminar con
  algo que no se le parecía.
- **La tipografía y los dibujos se eligen MIRANDO, no describiendo.**
  `node pruebas/letras.js <carpeta>` monta la misma portada con cada
  candidata y deja las capturas. Lo mismo un icono o un monograma: se
  montan cinco versiones al tamaño real y al de un teléfono y se compara.
  Cambiar una familia "por descripción" falló tres veces seguidas.
- **Las familias viven en dos variables** (`--titulos`, `--texto-f`), no
  escritas quince veces. Y el peso que se pide en el `<link>` es el que usa
  el CSS.
- **La paleta del cliente casi siempre tiene que CRECER.** Manda dos o tres
  colores y uno sobre otro no se lee: hay que calcular el contraste **antes**
  de escribir una línea de CSS y agregar la versión que se lee sobre cada
  fondo. *Si un bloque trae su propio fondo, trae su propia tinta.*
- **Las fotos van en blanco y negro con el filtro en el CSS**, no quemado en
  el archivo — salvo el dress code, donde el color es el dato. Cuatro fotos
  a color meten cuatro paletas y la tarjeta deja de tener la del cliente.
- **La canción suena, con tres mandos y los tres hacen algo**, suena **una
  sola vez** y al terminar **se rebobina** (parada en el final, el primer
  toque del play no sonaría). Dos archivos (AAC + Opus) y una sola
  descarga; `preload="metadata"`. Arranca con el toque que abre el sobre; si
  no hay sobre, se intenta al cargar y si el navegador la bloquea suena con
  el primer gesto en cualquier parte.
- **El sobre no puede estar revelado.** La carta vive DETRÁS de un frente
  opaco, no adentro. Y de la carta a la portada va un **cruce**, no un
  corte: las dos cosas pasan a la vez. Lo que entra con el sobre se va con
  el sobre, y lo que viaja adentro de la carta se va antes que la carta.
- **Un emblema no se pone donde entra: se pone donde se lee.** Y si el
  archivo falta, queda el dibujo de siempre, nunca un cuadrado roto.
- **Lo que no se lee a 42 px no va.** Un icono no es una foto: de tres
  detalles hay que elegir dos.
- **Todo se apaga con "menos movimiento"**, y el estado por defecto —el que
  se ve sin JavaScript— es el bueno.
- **Un renglón que se agrega o se saca de una portada con foto no es un
  renglón**: es todo lo que estaba abajo, movido. El velo se vuelve a medir
  cada vez que cambia el texto de la portada.

---

## 6. La planilla y el tablero

Van con la tarjeta, sin que lo pida.

- **Planilla propia por fiesta**, que es como decidió manejarse el dueño el
  01/11/2026: *"Un sheet para cada fiesta. Siempre separado."* Entonces
  `CONFIG.evento` queda **vacío** y el `endpoint` es el `/exec` suyo. Con
  las dos puestas, la fila cae en el archivo de otro y la pantalla dice
  "listo".
- El código a pegar es **`apps-script/evento-nuevo.gs.txt`** entero.
- **El tablero** es una copia de `invitaciones/plantilla-listado/index.html`
  en `<carpeta>/listado/`, con sus dos líneas de `CONFIG`. **No se le
  cambia el estilo**: la plantilla es una sola y la prueba falla si una
  copia se separa. Y **no se crea antes** de que exista la dirección
  `/exec`: vacío no traería nada.
- **La clave del tablero la inventa la planilla.** Si el cliente manda un
  correo para usar de contraseña, se le dice el riesgo y se hace — y el
  valor **nunca** va al repositorio: vive en `CLAVE_ELEGIDA` de la copia
  del editor del dueño. Hay una prueba que falla si lo versionado deja de
  estar vacío.

**Al terminar la tarjeta, el sheet se entrega LISTO PARA PEGAR**, sin
que lo pida (dicho el 09/11/2026: *"al terminar crea el sheet, esto
memorizalo"*). Es una copia de `evento-nuevo.gs.txt` con las dos claves
ya escritas —`CLAVE_ELEGIDA` con la que eligió el cliente (o vacía si no
eligió) y `CLAVE_MAESTRA_ELEGIDA` con la maestra—, hecha en la carpeta
de borradores, **nunca en el repo**, y mandada como archivo con los
cinco pasos abajo. Cuando vuelve la `/exec`: `CONFIG.endpoint`, la
carpeta `listado/` y publicar, de corrido.

**Los cinco pasos del lado de Google los hace el dueño** (crear la
planilla, pegar el código, correr `preparar()`, implementar, pasar la
`/exec`). Dos avisos que se le dan al entregar el código, porque sin ellos
se rompe callado:

- **Volver a implementar es "Administrar implementaciones → editar →
  Versión: nueva"**, no "Nueva implementación": eso cambia la dirección y
  la invitación publicada sigue escribiendo en la planilla vieja.
- **Pegar el código no alcanza: hay que correr `preparar()`.** Sin eso el
  invitado confirma bien y el cliente no puede entrar a su tablero.

---

## 7. Probar: dos comandos, una vez y al final

    python3 pruebas/servidor.py 8099        # en segundo plano
    node pruebas/invitacion_mirar.js <carpeta>
    node pruebas/invitaciones.js

**Y nada más.** De las 31 suites del muro, una sola puede ver una
invitación. Dicho por el dueño: *"¿Para qué ejecutás muro si estás con una
invitación?"*

Se suman **sólo si el cambio las toca**: `listado` y `rsvp` si se toca el
tablero o el Apps Script; `vitrina`, `contraste` y `guia` no ven una
invitación de cliente. En cuanto se toca algo de **afuera** de la carpeta
—`lib/`, `index.html`, las apps, `_headers`, `pruebas/`— va `bash
pruebas/todo.sh` entero.

**Si escribís una comprobación nueva, rompela a propósito y mirá que
falle.** Una prueba que pasa de los dos lados no mide tu cambio. Y
corrella contra **todas** las invitaciones: una trampa que se arregla en
una hay que ir a buscarla a las otras.

---

## 8. Publicar

1. Commit en la rama de trabajo, con el mensaje en castellano diciendo qué
   cambió y qué se midió.
2. `git push -u origin <rama>`.
3. Pull request y **merge a `main`** (squash). Cloudflare publica `main`.
4. **Verificar lo publicado**, no suponerlo: bajar la página de
   `clicketerno.com.ar/<carpeta>` y mirar que el cambio esté.

**Borrar un archivo que el HTML ya publicado nombra deja una imagen rota en
el navegador de todo el que tenga ese HTML guardado.** Sacar una foto de la
invitación no es lo mismo que borrarla del servidor.

---

## 9. El informe y el link

**El informe**: tres cosas y cortas — qué cambió, qué se ve distinto, qué
falta de su lado. Si algo salió mal, eso sí se dice.

**El link nunca se entrega pelado.** Va con un texto **en la voz de quien
invita**, que diga por qué querría que esa persona esté; los datos van
abajo y cortos, porque la invitación ya los tiene. Lo mismo el link del
tablero que se le manda al cliente. **El dato no se toca**: una hora, un
lugar o una fecha que no mandó el cliente no se inventan para que la frase
cierre mejor.

**"Pasame el listado" es el texto para el cliente, ya armado.** Dicho el
09/11/2026: *"siempre que te pida listado me armás el texto con el link y
la contraseña que le corresponde"*. Siempre se refiere a **la tarjeta que
se está haciendo en ese chat**: no se pregunta de cuál. Va en nuestra voz
(Click Eterno al cliente), con el link completo
`https://clicketerno.com.ar/<carpeta>/listado` y **la contraseña de esa
fiesta escrita** —la que eligió el cliente, o la que se le pasó al
dueño—, listo para copiar, más el instructivo (`bash flyer/armar.sh`) si
no se lo mandó todavía. La contraseña va en el chat, **nunca** en el repo.

---

## 10. Lo que nunca

- Inventar un dato que no mandó el cliente.
- Publicar una imagen de licencia desconocida, el logo de otra marca, o
  fotos de personas sacadas de internet.
- Escribir una clave —la maestra, la del tablero de un cliente— en el
  repositorio. Sacarla después del archivo no la saca del historial.
- Poner un correo o un dato real de un cliente como dato de prueba.
- Un CDN, un píxel de terceros o grabación de sesión.
- Tocar `index.html`, las dos apps, `_headers`, `lib/`, `sql/` o
  `pruebas/` desde un chat dedicado a una tarjeta.
- Cambiar el número de WhatsApp (**341 250-6451**) ni `app.html`.

---

## 11. Que el chat no se llene

Una tarjeta son muchas vueltas —referencias, capturas, ajustes— y un chat
tiene un límite. Cuando se llena, lo que estaba más atrás se resume: queda
la idea y se pierde el detalle. **Lo que no esté escrito en el repositorio
en ese momento, se pierde.**

Por eso, en este trabajo:

- **La crónica se escribe en CADA vuelta publicada, no al final.** Es la
  diferencia entre que el detalle quede guardado o que quede en un resumen.
  Vale igual para lo que falta del lado del cliente: va a "Pendiente" en
  `CLAUDE.md` el día que aparece, no cuando se acuerde alguien.
- **Al chat no se le vuelcan archivos enteros ni salidas largas.** Se busca
  el pedazo que hace falta y se trabaja sobre eso. Un volcado de mil
  líneas llena el chat y no aporta nada que no se pueda volver a leer.
- **Las pruebas se corren una vez y al final**, y se informa el resultado
  en un renglón, no la salida completa.
- **Después de cada cosa publicada se cierra el tema en una línea** y no se
  vuelve sobre lo ya decidido: re-explicar lo que está escrito en el
  repositorio es pagar dos veces por lo mismo.

Claude Code resume solo cuando hace falta, así que no hay nada que el dueño
tenga que hacer. Si igual lo quiere forzar —porque lo nota lento— el
comando es **`/compact`**, y no se pierde nada: lo que vale está en los
archivos. Y si prefiere arrancar un chat limpio, también: la crónica de
cada tarjeta se lee y el trabajo sigue donde estaba.

---

## 12. Toda tarjeta termina mostrándose en la página

Decisión del dueño: *"todas las invitaciones que hagamos se muestren en
invitaciones de muestra en la página. Sirve para que los clientes vean
todas las que hicimos y para que le genere confianza que hagamos
muchas."* **Entonces una tarjeta no está terminada hasta que entra en la
galería.**

**Y entra ENTERA.** La primera versión de esta regla decía que entraba una
muestra sin las fotos de personas, y el dueño la bajó con el argumento que
manda: *"pierde la magia. No se muestra lo que hacemos."* Tiene razón — en
varias tarjetas la portada ES la foto o el afiche, así que sin eso lo que
se muestra no es la pieza que hicimos. Lo que vende es la pieza.

**Dos cosas se cambian igual, y ninguna se ve:**

- **El formulario no escribe en la planilla del cliente.** Es lo único que
  de verdad no puede quedar abierto: la galería se le manda a cualquiera
  que pregunta, y un desconocido metiendo confirmaciones falsas le ensucia
  la lista con la que el cliente arma las mesas y encarga la comida. Se ve
  y se completa igual; lo que cambia es a dónde va.
- **El `noindex` se queda.** Saca la tarjeta de los buscadores sin sacarla
  de la galería: el que entra por la página la abre igual, y el que no fue
  invitado no la encuentra buscando el nombre de la clienta.

**Y se le pregunta al cliente.** No es cautela nuestra: son fotos de su
hija en una dirección pública, y el artículo 53 está escrito en nuestros
propios Términos. Es un mensaje corto, en la voz de quien pregunta, y a la
mayoría le gusta:

> *"Quedó hermosa la invitación. ¿Te molesta si la mostramos en nuestra
> página, en la galería de trabajos? Sirve para que los que nos consultan
> vean lo que hacemos. Si preferís que no, no hay problema."*

**La respuesta se anota en la crónica**, con fecha. Mientras no esté —o si
dice que no— entra su **versión de muestra**: la misma pieza con la portada
tipográfica, nombre y fecha inventados y sin alias. Los tres caminos ya
existen y están medidos en cada tarjeta (vacío el `CONFIG` de cada cosa, no
se dibuja), así que es una bandera que los enciende juntos.

**En la galería va marcada según lo que sea**: la de un cliente con permiso
es una invitación real y no lleva píldora; una muestra nuestra sí
(`muestra:true`), porque la sección promete *"las mismas que recibieron los
invitados"* y de una muestra eso no es cierto.

**La ficha la suma el chat de la página**, no el de la tarjeta: la galería
vive en `lib/trabajos.js` y en `index.html`. Cuando la tarjeta está lista
se avisa, con el nombre de la carpeta, el tipo de fiesta y los tres colores
de la portada dibujada.

---

## 13. Al terminar

- **Escribir la crónica** en `invitaciones/HISTORIA.md`: qué pidió el
  cliente con sus palabras, qué se descartó y por qué, y las fallas que se
  dibujaban perfectas y estaban mal. Es lo que hace que la próxima tarjeta
  no repita la vuelta.
- Si una lección pasa a valer para **todo** el proyecto, su lugar es
  `CLAUDE.md`, en "Reglas que ya nos costaron caro".
- **Anotar en "Pendiente" lo que quedó del lado del cliente o del dueño**
  —el titular de la cuenta, la fecha límite, un paso en el editor de Apps
  Script—. Un pendiente que vive sólo en el chat se pierde; y uno que ya se
  hizo y sigue escrito es peor que no tener la lista.
