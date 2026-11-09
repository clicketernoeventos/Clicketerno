# La crónica de cada invitación

Esto es la memoria de las invitaciones de clientes y de las muestras:
carpeta por carpeta, qué pidió cada uno con sus palabras, qué se descartó
y por qué, y las fallas que se dibujaban perfectas y estaban mal.

**Se lee la crónica de la carpeta que se va a tocar, antes de tocarla.**
Hacer una invitación nueva es copiar la anterior, así que lo que se queda
viejo no es el código: es el dato escrito a mano en el renglón que nadie
vuelve a mirar — ya pasó con el nombre de una clienta en la fiesta de
otra.

Vivía adentro de `CLAUDE.md` y eran 260 KB, el 60% de ese archivo, que se
carga en cada sesión del proyecto —incluida la que viene a tocar el muro,
el rollo o la página pública, que no puede ver ninguna invitación—. No se
borró nada: se mudó. `CLAUDE.md` se quedó con lo que vale para cualquier
tanda, y ahí apunta a este archivo.

**Las reglas de cómo entra una carpeta nueva** están en
`invitaciones/LEEME.md`, y el manual para un chat dedicado a hacer UNA
invitación, en `invitaciones/COMO-SE-HACE.md`. Este archivo es el
historial, no el manual.

Está en `.assetsignore` por el `*.md` y por `invitaciones/`: no se
publica.

## Las seis crónicas

### `mateoylucas/`: la boda de dos hombres

Pedido del dueño (15/10/2026): *"una invitación para una boda gay, que sea
emotiva y que se trate el tema con emoción y respeto"*, con algo simbólico
de dos hombres y una frase de amor. Mandó dos referencias: una foto de dos
novios en blanco y negro, y una tarjeta de stock con dos smokings
dibujados sobre glitter.

**De las dos, la segunda NO.** Dos smokings dibujados dicen "boda gay" como
*género*, igual que un cotillón: reemplazan a la pareja por el símbolo de
la categoría. La foto dice "estos dos". Tratar el tema con respeto es
exactamente eso, y es la misma regla de siempre dicha de otra forma: el
cliente no es una categoría.

**La idea, en una línea: dos metales iguales que se encuentran.** Uno es
oro, el otro plata, y **todo va de a dos y del mismo tamaño** — los
nombres, los anillos, las columnas de "cuándo y dónde"—. En una invitación
hétero hay un orden heredado (la novia primero, los padres de cada lado);
acá cualquier jerarquía sería una declaración, así que no hay ninguna.
**Eso es lo simbólico de verdad**, cuesta una línea de CSS, y no se lee
como un adorno: se lee como que está bien hecha.

Lo simbólico, concreto: **dos alianzas idénticas entrelazadas** —no un
anillo de compromiso y una alianza—, el `&` en el degradé de los dos
metales, dos moños (uno de cada metal) en el dress code, y **el espectro
una sola vez**, apagado dentro de la paleta. Dicho una vez es una caricia;
repetido es un disfraz.

**Lo que NO tiene, a propósito**: caligrafía —es el registro de la novia;
acá va capitular espaciada y una serif de transición, que es el registro
del smoking— y **ninguna foto**. No se pueden inventar fotos de dos
personas que no existen, y poner una de stock como si fueran ellos es
mentirle al que mira, más el artículo 53. Los huecos quedan cableados en
`CONFIG.historia`: vacío no dibuja la sección —nada de huecos en blanco— y
el día que llegan las fotos de una pareja real, aparece sola. **Que la
pieza se sostenga sin una sola foto es lo que demuestra**: se vende antes
de que el cliente mande nada.

**La frase es de Walt Whitman** (*Canto del camino abierto*, 1856) y no
está elegida por bonita: es el poeta del amor entre hombres, murió en 1892
—así que es de dominio público— y **la traducción es nuestra**, con lo que
no hay derechos de nadie en el medio (las traducciones publicadas tienen
los suyos). El verso que importa es el tercero: *"me doy entero, antes que
cualquier sermón y cualquier ley"*.

**Y tiene una sección que es el corazón de la pieza: "No siempre se
pudo".** Hasta el 15 de julio de 2010 (Ley 26.618) dos personas como ellos
no se podían casar en Argentina. Tres renglones, dichos por ellos, sin
bajada de línea, y termina en *"Vení a festejarla con nosotros"*. Es la
única sección donde el espectro significa algo y por eso es la única donde
aparece. **Para una pareja de verdad es opcional**: se saca borrando el
bloque, y hay que preguntarlo — a algunas les va a encantar y otras van a
querer que su invitación no hable de eso.

Cuatro cosas que se rompieron armándola, y **ninguna tiraba un error**:

- **Los `<defs>` vivían adentro del SVG del sobre, que se REMUEVE al
  abrir.** Los anillos de la portada y del cierre apuntan a `url(#gOro)`:
  se quedaban sin pintura y desaparecían. Un degradé compartido va en un
  SVG suelto que no se saca nunca.
- **Los anillos no estaban entrelazados.** La máscara recortaba el arco
  equivocado —el de un círculo que no era ninguno de los dos— y la plata
  quedaba mordida como una medialuna. Se arregla sin máscara: los dos
  círculos enteros y **encima el trocito del de oro** que vuelve a pasar
  por delante en el cruce de arriba.
- **El `<select>` repetía la flecha SEIS VECES** encima del texto de la
  opción. `background` es el ATAJO y resetea `background-repeat`,
  `-position` y `-size`: la regla de la sección clara, que viene después,
  le borraba el `no-repeat` a la de arriba. Va `background-color`.
  Es la enésima versión de *dos reglas para lo mismo, gana la última*.
- **El botón del sobre latía con un `scale`** y Playwright no lo podía
  tocar nunca: *"element is not stable"*, treinta segundos colgada contra
  un botón que está perfecto. El latido va en un halo alrededor
  (`:after`), no en la caja que se toca.

Medido, no a ojo: **85 textos y ninguno abajo de 3:1** (el peor, 4,24),
nada abajo de 44px, nada se sale de ancho, la consola limpia —o sea que la
CSP no bloqueó nada— y **los siete versos entran en una línea a 320, 360,
390 y 430**. Eso último tiene su propia medición porque los versos van
cortados a mano: uno partido al medio (*"más precioso que el / dinero"*)
se lee como un error de maqueta, no como un poema.

Pesa **76 KB entera**, con la imagen de la vista previa incluida.

#### Después: la foto, el salón y el calendario

El dueño mandó la foto que había usado de referencia y pidió ponerla, con
**La Mansión del Rey** de Rosario como lugar y un calendario de "guardá la
fecha" para 2027.

**La foto se puso y después se SACÓ, y el motivo queda escrito.** Son dos
personas reales e identificables, sacadas de una captura, y la invitación
vive en una dirección pública que cualquiera baja y un buscador indexa:
es el artículo 53, el que está escrito en nuestros propios Términos, y si
además es de un banco de imágenes, la licencia casi nunca cubre usarla
como si fueran los novios. Se le dijo al dueño las dos veces que lo pidió
y la tercera contestó *"sacala entonces"*.

**Lo que NO se tiró es el camino.** La portada con foto quedó entera,
apagada detrás de `CONFIG.portada`: vacío es la portada tipográfica —que
se sostiene sola— y con un archivo la portada pasa a ser la foto a
pantalla completa, con los nombres abajo y su velo. **Es una línea.** El
`<img>` lo crea el JS y no el HTML: un `<img>` con `src` vacío le pide al
servidor la página entera de nuevo, y eso no avisa.

**La dirección del salón NO se escribió.** La única fuente que apareció
era un directorio sin confirmar. Va el nombre y "Rosario · Santa Fe", y el
mapa busca el salón por su nombre: mandar a los invitados a una calle
sacada de un directorio dudoso no se arregla la noche de la fiesta.

**El calendario sale de la CADENA de `CONFIG.ceremonia`, no de
`new Date(...)`.** `new Date("2027-11-13T19:00:00-03:00").getDate()`
devuelve el día **en el reloj del que mira**: un invitado en Madrid veía
marcado el 14. La fecha de una fiesta es la del lugar de la fiesta y de
nadie más. Las cuentas del mes se hacen con `new Date(anio, mes-1, 1)`,
que se construye por componentes y no mete zona horaria. La semana
arranca el lunes. El día va marcado con los dos metales y **no con un
corazón rojo** como la referencia: sería el único rojo de la pieza, y lo
que la sostiene es que todo va de a dos.

Y tres cosas más que no tiraban ningún error. **Las tres eran de
medición, no de código**, que es lo que las hace peligrosas:

- **La portada no puede pasar por el observador.** El `IntersectionObserver`
  descuenta un 12% abajo (`rootMargin`) para que un bloque entre cuando ya
  se ve bien. La portada mide exactamente una pantalla y su texto quedó
  abajo: "Rosario · Santa Fe" y "Deslizá" caían DEBAJO de esa raya y no
  intersecaban nunca — **opacidad 0 para siempre**, y justo "Deslizá" es lo
  único que avisa que hay más abajo. Lo que ya está en la primera pantalla
  entra solo, sin esperar a que alguien scrollee.
- **`visibility:hidden` en el padre esconde también su `::before`.** Para
  medir el contraste sobre una foto hay que fotografiar el fondo SIN el
  texto; escondiendo `.port` se escondía además el velo que es justamente
  lo que hace que el texto se lea. Resultado: el medidor decía 1,09:1
  sobre un fondo que el visitante no ve nunca, y **cambiar el velo no
  movía un solo número**. Se esconden los HIJOS. Corregido, los cinco
  renglones dan entre 6,0 y 8,6:1 en teléfono y en escritorio.
- **Comparar el ancho del documento contra `innerWidth` no mide nada.** El
  velo se desborda 60vw por lado a propósito y, sin `overflow:hidden`, la
  página pasó a medir **578px en vez de 390**: ahí el navegador del
  teléfono se aleja solo para que entre todo y la invitación entera se ve
  más chica. Como `innerWidth` ya viene achicado, `ancho == innerWidth` y
  la comprobación pasaba en verde con la página rota. **Se compara contra
  el ancho PEDIDO.** Es la regla de la caja de 0x0 otra vez, con el zoom
  del navegador en el medio.

**El velo del texto va atado al TEXTO, no a un porcentaje de la
pantalla.** Medido en porcentajes, el renglón de la fecha caía sobre la
camisa blanca y daba 2,36:1 en el teléfono y 1,29:1 en escritorio: el
alto del bloque cambia con la pantalla y la raya del degradé no. Pegado al
bloque (`.port:before`), el piso es el mismo en cualquier aparato.

### `mia15/`: la primera invitación de un cliente de verdad

29 de enero de 2028, La Mansión del Rey (Vera Mujica 68, Rosario).
Lo que mandó la cumpleañera fue corto: **blanco, dorado y negro**,
*"elegante o formal"*, que se marque si asisten y que tenga cuenta
regresiva.

**Se armó SIN publicar**, a pedido del dueño: vive en la rama de
trabajo hasta que el cliente la apruebe. Cloudflare publica `main`,
así que mientras no se mergee no existe en el sitio. Y el
`CONFIG.endpoint` va vacío a propósito: la confirmación se ve y se
completa entera y **dice con todas las letras que no se mandó a
ningún lado**, así la tarjeta se revisa antes de que exista la
planilla.

**Hubo cuatro versiones y las tres primeras se tiraron.** Vale
anotar por qué, porque es la misma lección tres veces:

1. Negra con oro. *"Parece hecha a lo Click Eterno y no al pedido
   de la quinceañera"*, y tenía razón: **esa es NUESTRA paleta** —la
   del muro, la del rollo, la del sitio— y el blanco, que era uno de
   los tres colores que ella pidió, había quedado de relleno.
2. Papel marfil con tipografía negra. Correcta y sosa.
3. Con la referencia que eligió él (BOMA): tipografía gigante como
   gráfico, títulos manuscritos y una línea vertical al costado.
4. Con la segunda referencia: **bandas que alternan blanco y negro
   con el borde RASGADO**, que es lo que usa el blanco y el negro
   como estructura y no como detalle.

**El atajo para elegir tipografía: mostrarla, no describirla.** Tres
veces se cambió la familia por descripción y tres veces no era. A la
cuarta se montó la MISMA portada con siete tipografías y se le
mandaron las siete capturas. Eligió mirando. Está en
`pruebas/invitacion_mirar.js` la forma de hacerlo: interceptar el
HTML y cambiarle el `<link>` y la variable, igual que hace
`puertas.js` con `MUESTRA_MURO`.

**Los bordes rasgados se ponen SOLOS**, y solo donde cambia el
color. Escritos a mano en el HTML, el día que una sección se
esconda —el regalo se esconde si no hay alias— quedarían dos bandas
del mismo color pegadas con un rasgado en el medio. Los caminos SVG
se generan con la fecha de la fiesta de semilla, así salen iguales
en cada armado.

**Lo que NO se escribió hasta tenerlo confirmado.** La cumpleañera
mandó el día y no la hora, y una hora inventada manda a la gente a
la hora equivocada: quedó apagada en `CONFIG.mostrarHora` hasta que
el dueño la pasó el 18/10/2026 — **de 21 a 4**. **La fecha para
confirmar NO tuvo ese cuidado y debería haberlo tenido**: salió
publicada con un "29 de diciembre" que puse yo y que la clienta nunca
mandó. Ahora `CONFIG.confirmarHasta` vacío **no dibuja el renglón**
en vez de inventar una fecha, que es lo mismo que hace la hora; el
valor sigue puesto y está preguntado. Va como un RANGO
(`CONFIG.hastaHora`), y el final es una hora suelta y no una fecha a
propósito: las 4 son del día siguiente, y escribirlas como fecha
completa haría que la invitación dijera "30 de enero" en algún
lado — la fiesta es el 29 y eso es lo que tiene que leer el
invitado. Se escribe como se dice: *"de 21 a 4 h"*, sin los
`:00` que nadie pronuncia.
**Y Mia va sin apellido**, dicho por el dueño el mismo día: no es un
dato que falte, es una decisión.

**El "Te invito" lo escribió la clienta.** Pidió por WhatsApp (18/10/2026)
que dijera *"me encantaría que formes parte de esta noche tan especial
para mi"* en lugar de lo que había. Va casi literal: *"Vengo esperando
este día hace mucho. Me encantaría que formes parte de esta noche tan
especial para mí."* — lo único que se tocó fue no repetir "noche" dos
veces en la misma frase. **Esa línea no se mejora**: es la voz de la que
invita, no la nuestra.
El alias del regalo estuvo en
la misma lista hasta que el dueño lo confirmó (17/10/2026), y
**cambió al día siguiente**: era `Ceci.montenegro.11` y pasó a ser
`Aneley.1974`, de otra cuenta. Va con el rótulo "Alias para
transferir" arriba, y ese rótulo hace falta por los dos lados: los
dos se leen igual que un usuario de Instagram, y el dueño lo pasó
diciendo *"es el cbu para regalos"* —no es un CBU, es un alias, y
pegar un alias donde el banco pide un CBU no entra—. El que pega el
dato equivocado manda la plata a cualquier parte. El **titular** —el
nombre que le va a mostrar el banco al pegarlo— sigue sin saberse y
por eso no se escribe nada: un nombre inventado al lado de un alias
es peor que ninguno. **Y ahora hay que preguntarlo de nuevo**: la
cuenta no es la misma, así que el titular tampoco tiene por qué
serlo.

#### Las cuatro fotos

**La primera va en la portada, a sangre, y las otras tres pasan
solas** en un marco con sus puntitos. Tres decisiones que no son de
gusto:

- **La portada es la foto, a pantalla completa.** La primera
  versión la puso arriba, en una franja, con la tipografía abajo
  sobre el papel — justamente para no apostarle el contraste de un
  "15" negro a lo que hubiera salido en la imagen. El dueño mandó la
  de Julia y Franco: *"algo así hace"*. Ahí la foto ES la portada y
  el texto va encima. Lo que lo hace posible es dar vuelta la tinta:
  crema para el texto, el oro de las bandas negras para el acento, y
  **un velo** que hace de piso. El velo no es un adorno, es lo único
  que sostiene la promesa de que esos cinco renglones se leen.
  **Y el velo TERMINA en la tinta**, que es el color de la banda que
  sigue: la foto se funde con la sección de abajo, así que ahí no va
  ningún borde rasgado —el rasgado separa papel de tinta y acá no
  hay papel—. Lo saltea solo el bloque de los bordes, mirando la
  clase `con-foto`.
  **Las dos líneas verticales se esconden**: dicen "Mis quince años"
  y la fecha, que es exactamente lo que dicen dos renglones del
  medio. Al costado del papel eran un adorno; encima de la foto son
  dos textos más tapando la cara.
- **Van en blanco y negro, y el grayscale está en el CSS.** La
  paleta que pidió son tres colores; cuatro fotos a color meten los
  suyos —el beige del salón, el amarillo de un vestido de princesa—
  y la tarjeta deja de ser blanca, dorada y negra. En el CSS y no
  quemado en el archivo: el original queda entero por si algún día
  se quiere a color.
- **Las cuatro se recortaron, y eso es la mitad del trabajo.** La
  de la portada era la captura de una historia, con el marco, el
  globo de respuesta y la foto de perfil pegados abajo; las dos de
  Mia chiquita traían las franjas negras y la marca de agua de la
  app con que se sacaron. Puesto tal cual, eso dice que la tarjeta
  se hizo con lo que había. Las cuatro quedaron en `mia15/fotos/`,
  en `.webp`, 240 KB las cuatro juntas.

**Tres cosas que se rompieron poniéndolas**, y ninguna tiraba un
error:

- **El marco de las fotos no tomaba el CSS.** El contenedor se
  llamaba `.fotos` de cuando eran dos encimadas y las reglas nuevas
  son `.pase`: las tres fotos salieron apiladas, a color y a ancho
  completo. Se ve enseguida en una captura y no se ve nunca mirando
  el código.
- **"Deslizá" es `position:absolute` y una capa absoluta no empuja
  a nadie.** Con el bloque de texto abajo de todo, "ROSARIO · SANTA
  FE" quedó con "DESLIZÁ" montado encima. El lugar se lo tiene que
  dejar el `padding-bottom` de la portada, y en una pantalla baja
  además se achica el 15.
  **Y la segunda vuelta de lo mismo fue peor**: la regla que sube el
  texto por encima del velo (`#portada.con-foto > :not(.port-foto)`)
  le pone `position:relative` a TODO, "Deslizá" incluido — y le gana
  en especificidad. Un `bottom:30px` en `relative` no ancla abajo:
  **sube el elemento 30px**, o sea justo encima del renglón de
  arriba. Se arregla devolviéndole el `absolute` en una regla
  posterior. Dos reglas para lo mismo, gana la última, otra vez.
- **El color del titular estaba escrito en el propio tag.** Un
  estilo en línea le gana a `.oscura`, así que ese renglón sobre la
  banda negra daba 1,6:1. Vacío no se notaba; el día que llegue el
  nombre del titular, sí. Es *si un bloque trae su propio fondo,
  trae su propia tinta* otra vez, por el lado del estilo en línea.

**Con "menos movimiento" las fotos no pasan solas, pero se llega a
las tres con los puntitos**: apagar el movimiento no puede esconder
contenido. Y al tocar un punto el pase **se detiene**: si sigue
corriendo, la foto que eligió el invitado se le va sola a los tres
segundos y parece que el toque no entró.

**El texto sobre una foto NO lo mide el medidor de contraste, y da
verde igual.** Es la trampa más cara de todo este archivo puesta en
una pantalla nueva: el medidor sube por el árbol buscando el primer
fondo opaco, y en una portada a sangre ese fondo es el
`background-color` del contenedor —no la foto—. Informa "crema
sobre tinta, 14:1" mientras el renglón puede estar cayendo sobre una
pared blanca. Lo midió igual de bien con velo y sin velo.
Por eso `invitacion_mirar.js` tiene ahora una medición aparte, y es
**con el píxel, que es lo único que no miente**: esconde los HIJOS
de la portada —no la portada, que se llevaría puesto el velo, que es
su `::after`—, saca una captura y busca el píxel **MÁS CLARO** abajo
de cada renglón. El más claro y no el promedio: el promedio esconde
justo el reflejo que se come la letra. La captura se lee con
`pruebas/png.js`, un lector de PNG de setenta líneas sin
dependencias (zlib de Node y los cinco filtros), porque en este
proyecto no hay `npm install`.
Verificada rompiendo a propósito: **sacado el velo da 16 fallas**
(el "15" a 1,53:1 y el manuscrito a 1,08:1) y con el velo puesto el
peor renglón da 3,26:1 en un iPhone SE.
**Y encontró una falla de verdad en una invitación publicada**: en
`juliayfranco/`, "20 NOVIEMBRE 2027" cae sobre el vestido blanco de
la novia y da **1,15:1 en un teléfono de 390** — o sea que la fecha
de la boda no está. Se ve en la captura que mandó el dueño y nadie
lo había notado. Esa invitación tiene además otras fallas de la
misma suite (desborde y los años de la línea de tiempo a 1,00:1):
le falta una pasada entera, que es un trabajo aparte.

#### Los iconos, y la foto entera

Dos pedidos del dueño del 18/10/2026: *"que haya iconos aesthetic
para cada cosa, que sea súper lujosa"* y *"la foto de portada que
esté entera"*.

**Ocho iconos de línea, dibujados en el JS y no escritos ocho veces
en el HTML**: una tiara (te invito), una cámara (las fotos), un
reloj de arena (cuánto falta), un pin con un rombo adentro (el
lugar), un vestido largo (dress code), una caja con moño (el
regalo), un sobre (¿venís?) y un destello (el cierre). Son SVG de
24×24 con `stroke:currentColor`, así que **el color lo pone la
banda**: `--oro` sobre el papel (4,6:1) y `--oro-neg` sobre el negro
(10:1). Es *cada bloque con su propia tinta* aplicado a un dibujo.
Van con `aria-hidden` y `pointer-events:none`, que es la definición
estricta con la que el medidor saltea un adorno.
Nada de una librería de iconos: la CSP no deja bajar un CDN, y acá
no hay build. Un `stroke` y listo.
**La galería no tiene `.caja`**, así que el icono va en la sección y
no en el primer hijo — metido ahí quedaría ENCIMA de la foto.

**La foto de la portada va `contain`, no `cover`.** `cover` llenaba
la pantalla recortándole los costados: en un teléfono le comía el
13% del ancho. Ahora se ve entera, apoyada arriba, y lo que sobra
abajo es negro — que es justo donde cae el texto. Dos cosas que
hubo que arreglar para que eso no se note:

- **El fondo de la caja de la foto es la TINTA y no el papel.** Lo
  que sobra es ese fondo, y el velo lo deja ver a un 12%: un papel
  crema ahí es una banda más clara pegada al pie de la foto, una
  juntura a lo ancho de toda la pantalla.
- **El velo se hace macizo en el 86% y no recién en el 100%.** Con
  la foto entera, su borde de abajo cae en un punto distinto en
  cada pantalla (el 79% de un iPhone, el 96% de un SE), y un velo
  que todavía deja pasar un 10% ahí dibuja una raya. De paso el
  texto sobre la foto pasó de 3,26:1 a **7,31:1** en el peor caso.

En una pantalla ancha la foto queda como una columna centrada con
negro a los costados. Es lo que pasa cuando se muestra entera una
foto vertical en un monitor apaisado, y se ve editorial.

#### Lo que se mueve, y los márgenes

*"Fíjate de poner animaciones o transiciones copadas para que se
sorprendan pero que tampoco sea muy molesto."* Son cuatro, y la
regla que las separa de lo molesto es la misma en todas: **cada una
pasa una sola vez, o va atada al scroll.** Nada que se repita solo
delante de los ojos.

- **El zoom lento de la portada.** La foto entra 7% agrandada y se
  acomoda sola en **nueve segundos**. Nueve es a propósito: un zoom
  que se nota es un zoom molesto; éste se percibe sin poder
  señalarlo. El estado agrandado cuelga de `body.cerrado`, la clase
  que pone el JS al dibujar el sobre: **sin JS no hay zoom y la foto
  está entera desde el principio**, que es el estado bueno.
- **La cascada de la portada**, 160 ms entre renglón y renglón:
  el nombre, el 15, el manuscrito, la fecha, el lugar, "Deslizá".
  Y entra **cuando se abre el sobre, no al cargar**: con el sobre
  encima, una cascada que corre detrás no la ve nadie — se gasta el
  único momento de sorpresa que tiene la pieza contra una capa
  opaca. El retardo se saca cuando terminó: dejado puesto, lo
  hereda cualquier transición futura de ese elemento.
- **Los iconos se dibujan solos** al entrar en pantalla, en 1,15 s.
  Con el largo REAL de cada trazo (`getTotalLength`), no con un
  número a ojo: con un largo inventado el dibujo arranca por la
  mitad o termina antes. El navegador que no tenga `getTotalLength`
  se queda con el icono dibujado, que es el estado bueno.
- **La foto de la portada se queda atrás al bajar**, a un quinto de
  la velocidad de la página. Se mueve la CAJA y no la imagen: la
  imagen ya tiene su propio `transform` con el zoom, y dos cosas
  peleando por la misma propiedad es una que gana y otra que
  desaparece. El velo se queda quieto, que es lo que hace que se
  note. Un solo oyente con `requestAnimationFrame` y `passive`, y
  se corta apenas la portada sale de pantalla: mover algo que nadie
  ve es batería del invitado.

Las cuatro están medidas (el zoom de 1,07 a 1 en 9 s; la cascada
con "MIA" en 0,42 de opacidad y el resto en 0 a los 260 ms; el
trazo del icono de 6,7 a 0; el paralaje en 22, 66, 132 y 198 px a
100, 300, 600 y 900 de scroll) y **las cuatro se apagan con "menos
movimiento"**.

**Los márgenes, medidos con las cajas de verdad en tres aparatos**:
simétricos en todas las secciones, 36px de borde a 320 y 390, 360 a
1280. Lo único que estaba flojo: **la portada tenía 26px de borde y
las secciones 22** abajo de 400px de ancho. Cuatro píxeles no se
ven de a uno; se ven al scrollear, porque el texto de la portada
arranca más adentro que todo el resto.

#### El marco de la foto, y los nombres de los que vienen

Lo primero que reportó el dueño con la invitación ya publicada, y
las dos son de producto, no de diseño:

**El marco estaba mal, y el motivo es de bulto.** Era un filete
corrido dibujado con un `:before` de `.pase` — y `.pase` no es la
foto: es la foto **más los puntitos**. El filete terminaba 14px
abajo de los puntitos y asomaba por la derecha de la imagen, así
que no se leía como un marco sino como un rectángulo suelto mal
puesto. En una captura de escritorio pasa por una decisión de
diseño; en un teléfono se ve que está roto. Ahora el marco es una
caja de verdad alrededor del `figure` (`.pase-marco`, un pasepartú
de 10px con su filete) y **lo que mide es lo que encierra**.
Hay una medición que exige las tres cosas: que rodee la foto, que
sea simétrico y que no se coma los puntitos.

**"¿Cuántos son?" decía cuántos y no quiénes.** Para lo único que
entra el que organiza —armar las mesas— un número no sirve: al otro
día hay que escribirle a cada uno preguntándole con quién viene.
Eligiendo 5 se abren los otros cuatro renglones, así son cinco
nombres en total con el suyo.

- **No son obligatorios, a propósito.** El que no se acuerda del
  apellido de uno abandona la pantalla, y una confirmación sin un
  nombre vale más que ninguna confirmación.
- **El nombre del campo ES el título de la columna**, y el Apps
  Script crea la columna sola la primera vez que llega una que no
  conocía: del otro lado no hay nada que configurar.
- **Lo escrito se conserva al cambiar el número**, y el caso que
  importa no es bajar de 5 a 3: es contestar **"no voy a poder"**,
  que borra los renglones, y volver al "sí". Con el guardado
  adentro de la función que redibuja, al volver ya no había de
  dónde leerlos. Medido: cuatro nombres puestos volvían en blanco.
  El guardado vive afuera.

#### El que dice que NO no llena lo que no es suyo

Al elegir *"No voy a poder"* desaparecían los renglones de los
acompañantes —eso ya estaba— pero la pantalla **seguía preguntando
cuántos son, qué comida no puede y qué tema quiere**: tres renglones
después de haber dicho que no va. Desde afuera se lee como que la
pantalla no lo escuchó.

**Y lo caro no es cómo se ve.** `new FormData(form)` manda **todo lo
que esté en el formulario**, esté a la vista o no, así que a la
planilla le llegaba una fila que dice NO VIENE con **"Cuántos: 4"** —
y ésa es exactamente la columna con la que el que organiza arma las
mesas. Medido: con "No", antes viajaban `Nombre, Confirma, Cuántos,
Comida, Canción`; ahora viajan `Nombre, Confirma`.

Por eso **no alcanza con esconderlos**: van `hidden` *y*
`disabled`, que es lo único que hace que no viajen. Y volviendo al
"sí" vuelve todo, con los nombres de los acompañantes ya escritos —
el mismo caso que ya había costado una vuelta.

Lo mide `pruebas/invitacion_mirar.js` por **las dos mitades**: que no
se vea Y que no se mande. Esconder sin deshabilitar arregla la
pantalla y deja la planilla mintiendo, y una prueba que sólo mirara
la pantalla daría verde. Contra el código publicado da **2 fallas**.

#### Que los campos del formulario encajen en la planilla

El Apps Script crea cada columna **con el nombre del campo que le
llega**, así que lo que decide si la planilla sale bien es cómo se
llaman los `name=` del formulario — y eso no lo mira nadie hasta que
el cliente abre la planilla después de la fiesta.

`pruebas/rsvp.js` corre el `.gs.txt` de verdad con los campos de
mia15 **leídos del HTML publicado** y comprueba que la planilla cree
sola las columnas (`Nombre`, `Confirma`, `Cuántos`, `Comida`,
`Canción` y los `Invitado N` que arma el JS), que el resumen cuente
bien, que el que no viene no deje número en "Cuántos" y que la puerta
`?confirmado=` reconozca el nombre con espacios y en minúscula.

**La primera versión no medía nada y hay que decir por qué**, porque
es una trampa nueva: posteaba los nombres **escritos a mano** en la
prueba y aparte comprobaba que el formulario tuviera dos de ellos.
Renombrar un campo la dejaba en VERDE, porque la prueba seguía
posteando el nombre viejo contra un Apps Script que lo aceptaba
igual. Ahora postea **los que lee del HTML**. Verificada rompiéndola
a propósito: renombrar `Confirma` da **3 fallas**, y el síntoma que
destapa es el que importa — *"2 invitados · 0 confirmados"* con la
planilla llena, que es la misma falla que ya está escrita para el
listado.

**Es una verificación, no un guardián de regresión**: pasa igual
contra el código anterior, porque antes nadie había medido esto. Lo
que la hace valer es que está atada al formulario y no a una lista
escrita a mano.

#### La clave del tablero de Mia es un correo, y es una excepción

La regla de este archivo es que **la clave la inventa la planilla**, y
el `.gs.txt` explica por qué: *"un correo es público y adivinable — y
esa clave abre la lista entera de invitados"*. Para mia15 **no se
cumple, y es decisión del dueño**: la cumpleañera mandó un correo de
la familia como contraseña para ver las confirmaciones y él lo pidió
dos veces. Se le dijo el riesgo las dos y lo sostuvo.

Quedó anotado acá para que nadie —yo el mes que viene incluido— lo
"arregle" volviéndolo a generar al azar.

**El valor NO se escribe en el repo**, que es la otra mitad de la
regla y ésa sigue en pie: vive en `CLAVE_ELEGIDA`, en la copia del
editor de Apps Script del dueño, y en las propiedades de ese
proyecto. El `.gs.txt` versionado sigue con la cadena vacía.

Tres cosas medidas corriendo el `.gs.txt` de verdad, porque del otro
lado no se depura:

- Poner `CLAVE_ELEGIDA` y volver a correr `preparar()` **pisa la
  clave que se había inventado**, y la vieja deja de servir.
- **No hace falta volver a implementar.** La clave vive en las
  propiedades del proyecto, que la implementación lee en cada
  pedido; lo que queda congelado al implementar es el CÓDIGO. La
  dirección `/exec` no cambia.
- **La comparación distingue mayúsculas** (`igualesSinApuro_` compara
  byte a byte, que es lo que la hace no filtrar cuántas letras
  acertaste). Medido: con la clave guardada en `Gabi…`, escribir
  `gabi…` **no abre**. Por eso se guarda toda en minúscula: el campo
  es `type="password"`, que en iPhone no autocapitaliza, así que lo
  que se escribe es lo que se guardó.

#### El tablero no puede existir antes que el Apps Script

`pruebas/invitaciones.js` falla si una carpeta `<evento>/listado/`
tiene el `appsScriptUrl` vacío: *"no va a traer nada"*. Está bien que
falle. Quiere decir que **`mia15/listado/` no se crea por adelantado**
— se crea el día que existe la dirección `/exec`, y es copiar la
plantilla con sus dos líneas de `CONFIG`. **No se le cambia el
estilo** para que combine con la invitación: la plantilla es una sola
y la prueba falla si una copia se separa.

#### El que ya confirmó

*"Si Juan Pérez se registró, que no pueda volver a registrarse. Más
que nada para no llenarle de duplicados el formulario a quien lo
chequea."* Son **dos puertas** y hacen falta las dos, porque tapan
agujeros distintos:

1. **En ese aparato.** El caso que de verdad llena la planilla es el
   mismo invitado volviendo a abrir el link de WhatsApp dos días
   después y completando todo otra vez. Confirmado una vez, la
   pantalla le muestra un cartel con su nombre **en lugar del
   formulario**: dejarlo abierto abajo es invitarlo a llenarlo de
   nuevo. Queda el botón "Cambiar mi respuesta", que es el otro caso
   real —el que pasó de "no" a "sí"— y ésa no se puede cerrar.
   **Se guarda solo cuando la confirmación llegó de verdad**:
   guardarlo en la muestra sería decirle "ya confirmaste" cuando no
   se mandó a ningún lado.
2. **En la planilla.** Antes de mandar se pregunta si ese nombre ya
   está (`?confirmado=`, la puerta que ya existía). Si está, **no se
   manda**: se lo dice y recién el segundo toque actualiza la fila.
   Esto agarra lo que la memoria del aparato no ve — el que confirma
   desde el teléfono de la madre, o el que borró los datos del
   navegador.

**La comparación es la MISMA que usa el Apps Script**:
`trim().toLowerCase()`, sin tocar los acentos. Si la pantalla
normalizara más que la planilla, diría "ya estás anotado" y la
planilla igual crearía una segunda fila — justo lo que se vino a
evitar. Si alguna vez cambia de un lado, cambia en los dos.

**Si la pregunta falla, se manda igual.** Sin señal o con el
servidor caído, bloquear por no haber podido preguntar sería perder
una confirmación de verdad para evitar un duplicado que **la
planilla ya no hace**: el `doPost` pisa la fila del mismo nombre
desde siempre. Esto es para que el invitado se entere, no para tapar
un agujero de la planilla.

**Y el formulario escondido vuelve invisible.** `#rsvp` tiene `.ap`:
escondido nunca interseca, así que el observador no le pone `.entro`
y al mostrarlo de nuevo aparece en opacidad 0 — sin un solo error.
Se lo deja entrar a mano, igual que al cartel, que lo dibuja el JS
cuando el observador ya pasó.

Medido contra el código publicado, que es el que no lo tenía: con el
nombre ya anotado **manda igual y contesta "¡Listo, Juan!"**; con
esto, no manda nada y lo dice. Y el recorrido entero —primera vez,
recarga, cambiar la respuesta, otro aparato con `"  juan pérez  "`,
segundo toque— corre contra un Apps Script interceptado, igual que
`pruebas/listado.js`.

#### Lo que se rompió la primera noche que lo usó gente de verdad

El dueño repartió el link, entraron las primeras confirmaciones y
aparecieron **cuatro cosas**, todas en la misma pantalla. Ninguna tiraba
un error: las cuatro se dibujaban perfecto.

**1 · La cuenta contaba RESPUESTAS y no PERSONAS.** Dos filas que decían
"Cuántos: 2" y "Cuántos: 4" son seis personas y el tablero marcaba 2.
Dicho por él: *"confirmaron dos personas pero en la cuenta figura como
1"*. Para lo único que el cliente entra al tablero —saber cuánta gente
va— el número estaba mal, y el error se descubre el día de la fiesta con
comida encargada de menos. Ahora el número grande son **personas**
(suma de "Cuántos" en las que dijeron que sí, 1 si está vacía) y al lado
quedan "No vienen" y "Respuestas", que es el dato viejo sin perderse.
Lo cuenta la planilla (`resumen.personas`, en `evento-nuevo.gs.txt`) y,
**si el Apps Script publicado todavía es el de antes, lo cuenta la
pantalla con las filas que ya tiene**: así se arregló sin que el dueño
tuviera que volver a pegar nada esa misma noche.
**El "no" no suma su número**: alguien que eligió 4 y después cambió la
respuesta dejaba cuatro personas escritas en una fila que dice que no va.

**2 · La comida era un campo libre y era UNA SOLA para toda la mesa.**
Dicho por él: *"si elegís 5 personas no sale la opción para elegir la
alimentación de las 5; te toma solo 1 y te pone 5 celiacos"*. Esa columna
se le pasa al salón tal cual, así que eso son cinco platos sin TACC y
cuatro personas que no los pidieron. Ahora cada acompañante es un
**bloque con su nombre y su comida**, elegida de la lista de siempre
(Ninguno · Vegetariano · Celíaco · Diabético · Hipertenso · No tolerante
a la lactosa · Otro), que es la que ya usaban `pia/nueva` y
`juliayfranco`. Las columnas son `Comida 2`…`Comida 5` y **las crea sola
la planilla**: del otro lado no hay nada que configurar.
Y **"Otro" manda lo que escribieron**, no la palabra "Otro": el que le
pasa las comidas al salón necesita leer *"sin frutos secos"*.

**3 · Tardaba una eternidad.** Eran **tres viajes al Apps Script** por
confirmación —preguntar si ese nombre ya estaba, mandar, y volver a
preguntar si llegó— más una espera fija de 1,2 s. Cada viaje a Google es
uno o dos segundos: seis u ocho en total, y *"la gente no es de esperar
mucho las cargas"*. Se fue la pregunta de "¿ya estaba?", que **no
protegía de nada**: el `doPost` pisa la fila del mismo nombre desde
siempre, así que el duplicado no existe; lo único que hacía era cobrar un
viaje antes de cada envío. Y el POST ahora se manda **pidiendo leer la
respuesta**: el Apps Script contesta `{"ok":true}` con los permisos
puestos, así que en un solo viaje ya se sabe si entró. Si el navegador no
deja leerla, cae al camino viejo. Medido en el navegador: **un viaje y
~1,5 s** contra tres viajes.
**Lo que no cambia es la regla más vieja**: si no sabemos que llegó, la
pantalla no dice que llegó.

**4 · El alias le faltaba el punto del final.** Es `Aneley.1974.`, con
punto, y estaba escrito `Aneley.1974`. **El punto es parte del alias**:
copiado sin él, la transferencia del invitado va a otra cuenta o no
encuentra ninguna. Se le preguntó cuál de los dos era antes de tocarlo
—un alias no se adivina— y avisándole que la mayoría de los bancos no
aceptan uno que termine en punto; lo confirmó igual. Queda anotado para
que nadie lo "arregle" sacándoselo.

Lo miden `pruebas/rsvp.js` (las columnas por persona y el resumen en
personas: **2 fallas** contra el código anterior),
`pruebas/listado.js` (el tablero, con la planilla contándolo y sin
contarlo: **2 fallas**, y la que importa decía *"dio 2"*) y
`pruebas/invitacion_mirar.js` (que la comida sea una lista y que haya una
por persona, medido por **lo que viaja** y no por lo que se ve: **2
fallas**).

**La lección, y es la de siempre dicha de otra forma**: las cuatro
estaban a la vista y ninguna rompía nada. Las agarró una persona
repartiendo el link de verdad, no una suite — igual que las dos del
iPhone. Lo que una suite no puede medir es si algo SIRVE.

#### Una fila por PERSONA, no una por respuesta

Lo siguiente que reportó el dueño, probando él mismo: la cuenta ya daba
bien, pero *"esas personas no forman parte de una misma columna sino que
cada una sea una fila diferente. Que no estén todos juntos, ya que hace
más difícil contabilizar quién respondió y es más difícil para imprimir
la lista"*.

Tenía razón y es de producto: una respuesta que dice "somos 3" llegaba
como **una** fila con los otros dos metidos en columnas de al costado
—`Invitado 2`, `Comida 2`, `Invitado 3`, `Comida 3`—, así que para saber
quién va a la fiesta había que leer **a lo ancho**. Y lo que se imprime y
se le pasa al salón es una lista de GENTE.

**La planilla NO cambia.** Sigue guardando una fila por respuesta, que es
lo que hace que confirmar dos veces no deje dos filas y lo que usa la
puerta `?confirmado=`. Lo que se abre es la PANTALLA: `porPersona()`
toma cada respuesta y la parte en una fila por persona, con su nombre y
su comida. Por eso esto no necesitó volver a pegar el Apps Script.

**Funciona sin saber cómo se llaman las columnas de esa invitación.** Se
buscan las que terminan en un número (`Comida 2`) y se las entiende como
la misma pregunta hecha a la persona 2; el nombre es el caso especial,
porque en la persona 1 la columna se llama distinto (`Nombre` contra
`Invitado 2`). Una invitación que no pregunta por acompañantes no tiene
ninguna columna así y **queda exactamente igual que antes** — hay una
comprobación para eso, porque el listado de Pía ya anda y no se puede
romper.

**Cuántas filas salen**: lo que diga "Cuántos", y si escribieron más
nombres que ese número, mandan los nombres — hay gente escrita que si no
no aparecería. Tope de 20, por si alguien tipea 999. El que dijo que
**no** es siempre una sola fila.

**No se agrega ninguna columna que diga con quién vino cada uno**, y
quedó escrito porque se probaron dos. Primero `Vino con`, que no se
entendía en la fila del que contestó (*"Cris vino con Cris"*); después
`Mesa sugerida`, que el dueño pidió con esas palabras y al verla sacó:
*"va a ser mucho relleno"*. Tiene razón para lo que esto es —una lista
para imprimir y pasarle al salón, donde cada renglón repetido en todas
las filas es una columna más que no se lee—. **El grupo se ve por el
orden**: las personas de una misma respuesta salen una debajo de la
otra. Y en la planilla sigue entero, porque allá cada respuesta es una
sola fila. Hay una comprobación que falla si vuelve a aparecer una
columna así.

**Y "Cuántos" tampoco se muestra**, por lo mismo: con una fila por
persona ese número ya está contado —son las filas— y repetido en cada
renglón del grupo es una columna más que no se lee. Sigue entero en la
planilla, y los números de arriba lo siguen usando cuando el listado es
de una invitación que no se abre por persona.

**Y los dos números de arriba salen de listas distintas a propósito**:
"Respuestas" cuenta familias (las filas de la planilla) y "Vienen" cuenta
**las filas dibujadas** que dicen que sí — así el número de arriba es
exactamente lo que se ve abajo. Si dijera otra cosa que lo que está
dibujado, el que mira no sabe a cuál creerle.

Lo mide `pruebas/listado.js`: que dos respuestas (3 personas + 1) den
**4 filas**, que no quede ninguna columna "Invitado 2 / Comida 2" a lo
ancho, que cada fila lleve SU comida, que diga el grupo, que los tres
números sigan separando gente de respuestas, y que **el Excel se baje con
esas mismas filas** — medido interceptando el archivo, no contando otra
vez las filas de la tabla, que daría verde con el Excel roto porque
estaría midiendo dos veces lo mismo. Contra el código publicado da
**6 fallas**.

#### Un mensaje para Mia

Pedido del dueño: *"estaría bueno que le pongas mensaje, una pestaña
para escribirle un mensaje o deseo"*. Es un `textarea` al final del
formulario, opcional, con tope de 500 caracteres.

**NO se apaga al contestar que no viene**, que es lo contrario de lo que
hace el resto del formulario: el que no llega es justamente el que más
quiere dejar escrito algo, y esconderle el campo ahí es perder el
saludo. Por eso no está en `soloSiViene`, y hay una comprobación para
las dos mitades —que se vea Y que viaje— porque esconder bien y mandar
mal da verde igual.

**En el tablero aparece UNA sola vez**, en la fila del que contestó. Con
una fila por persona, un mensaje largo repetido en las de sus
acompañantes son tres párrafos iguales uno abajo del otro — el mismo
relleno que el dueño ya había sacado. La regla quedó general: lo que
contestó la respuesta (cuándo, el tema, el mensaje) va solo en su fila;
**el sí/no es la excepción** y va en todas, porque vienen o no vienen
todos.

**Y el aviso del artículo 6 tuvo que cambiar con el campo.** Decía que
lo que se escribe se usa "solo para organizar la fiesta: saber cuántos
son, armar las mesas y pasarle al salón las comidas especiales" — un
mensaje para la cumpleañera no es ninguna de esas tres. Ahora lo dice.
Si se agrega una pregunta, ese párrafo se mira: es lo que convierte al
aviso en verdadero o en una formalidad que miente.

**La del tablero es un guardián de regresión** (contra el código
anterior da 1 falla: el mensaje repetido en las tres filas). **La de la
invitación es una verificación**: si el campo no está, lo dice y no
mide — vale para mia15, no impide que alguien lo saque.

#### La portada volvió a ser tipográfica, y el 15 se llena de tinta

A la clienta **no le gustó la foto de portada** (18/10/2026), así que
`CONFIG.portada` quedó vacío un rato y con eso volvió la portada
tipográfica — **el mismo día se arrepintió y la foto está de vuelta**
(ver más abajo); lo de acá queda escrito porque el camino tipográfico
sigue entero y vaciar esa línea es volver a él — que para esto se dejó entera y probada: el camino con
foto sigue completo, es una línea volver. De la galería salió además
**la foto de Mia más grande**: quedaron las dos de chiquita, y así la
sección entera dice una sola cosa —"la que era"— en vez de tres fotos
sueltas. Los dos archivos se borraron del repo: una foto de una menor
que ya no se usa, sentada en una dirección pública, es peso y es
exposición sin nada a cambio.

**La animación de portada**, pedida con esas palabras: *"qué idea
podemos hacer para alguna animación de portada, así ponemos algo con
onda"*. El 15 entra **dibujado en oro** y la tinta negra lo llena **de
abajo hacia arriba** en 1,8 s, como un sello que se apoya en el papel.
Pasa una vez y después no se mueve nada.

**Son DOS capas y no un color que cambia**, y el motivo no es de
gusto. Con `background-clip:text` —que es la forma obvia de hacer que
un relleno suba por adentro de una letra— el relleno viaja en el
fondo y el `color` del texto queda en `transparent` **para siempre**:
el medidor de contraste lee el color, no lo que se ve, así que
informaría el "15" a 1,00:1 y tendría razón según lo que mide. Es la
misma trampa del "15" en contorno de `mateoylucas`. Con dos capas
cada una tiene su color de verdad: la de abajo es el oro que SE LEE
(4,6:1 sobre el papel) y la de arriba es la tinta, recortada con
`clip-path` y declarada decoración (`aria-hidden` +
`pointer-events:none`), que es como el medidor saltea un adorno sin
quedarse ciego. La suite sigue midiendo 85 textos.

El oro de la capa de abajo **lo pone el JS** al armar la de arriba:
sin JS no hay animación y el 15 es negro, que es el estado bueno. Con
"menos movimiento" tampoco se crea la capa.

**Dos selectores que se rompieron solos al agregar esa capa**, y las
dos son la misma lección —*agregar un nodo cambia a quién le pega un
selector*—:

- **`.quince-big span:last-child`** dejó de matchear el "5": la capa
  de tinta es el último hijo del `h1`, así que el "5" de abajo perdió
  su margen negativo y **las dos capas quedaron corridas 8px** una de
  otra. Va `span + span`.
- **`.quince-big.con-tinta span{color:var(--oro)}`** le llegaba
  también a las cifras de ARRIBA —son descendientes del mismo `h1`—
  y la tinta no se veía nunca: la animación corría perfecta y el 15
  quedaba dorado de principio a fin. Va `> span`.

Y el manuscrito de abajo entra con el **interletrado cerrándose**
(.08em → 0 en 1,4 s): la misma idea de que algo se asienta, en el
renglón de al lado.

#### Una foto que no carga se va, no deja el cuadrado roto

Lo reportó el dueño con una captura, y es lo que se ve cuando chocan las
dos cosas de arriba: el HTML viejo, servido por el
`stale-while-revalidate`, pidiendo `fotos/portada.webp` y `fotos/1.webp`,
que ese deploy había borrado. **Dos cuadrados grises con un `?`**, uno
arriba de todo en la portada y otro adentro del pasepartú dorado.

**No tiraba ningún error de JavaScript y las pruebas daban verde**: una
imagen rota es un dibujo del navegador, no una excepción. Es la familia de
siempre —*se dibuja perfecto y está mal*— y por eso ahora se mide.

Arreglado el caché, esto no debería volver a pasar; se pone igual porque
**la próxima vez que se saque una foto va a volver a pasar durante el
minuto del `max-age`**, y porque un archivo puede faltar por cualquier
otro motivo.

- En el pase, la foto que no carga **se saca, y se saca su puntito**: un
  punto que no lleva a ninguna foto es la misma mentira más chica. Si no
  queda ninguna, se esconde la sección entera, que es exactamente lo que
  ya hacía `CONFIG.fotos` vacío — un marco dorado alrededor de nada es
  peor que no estar.
- **Qué foto es cada punto se pregunta al TOCAR**, no se captura al
  dibujar: sacada una, las de atrás se corren un lugar y el número
  guardado señalaría la equivocada.
- **A la que ya falló hay que preguntarle.** Si la imagen se cayó antes de
  que llegáramos a escuchar, el evento `error` no vuelve a dispararse
  nunca: se mira `complete && !naturalWidth`.
- En la portada, si falta la foto se vuelve a la **portada tipográfica**,
  que se sostiene sola. Y hay que **volver a rasgar**: el borde del pie de
  la portada se saltea justamente cuando hay foto, así que sacada la clase
  `con-foto` quedaría una juntura recta entre el negro y el papel. Por eso
  ese bloque dejó de ser un IIFE y es `rasgar()`, que **primero borra los
  rasgados que ya estaban** — corrido dos veces sin eso, quedan dos
  pegados.

Lo mide `pruebas/invitacion_mirar.js` haciendo que el servidor conteste
404: una foto, después todas, y después la de la portada (encendida
interceptando el HTML, igual que `puertas.js` con `MUESTRA_MURO`, porque
mirar la constante publicada ataría la prueba a lo que hoy está elegido).
Contra el código anterior da **5 fallas**.

**Y esa prueba primero no medía nada.** Preguntaba `window.CONFIG` para
saber cuántas fotos declara la invitación, y `CONFIG` es un `const` de
script: **no cuelga de `window`**. Daba 0, la prueba se salteaba sola
informando *"esta invitación no tiene fotos: nada que medir"* y la suite
quedaba verde. La caja de 0x0 otra vez, disfrazada de atajo amable.

#### Volvió la foto de portada, y la animación tuvo que cambiar

La clienta la sacó el 18/10/2026 y el mismo día se arrepintió. La foto
**se recuperó del historial** (`git show 11335bc~1:mia15/fotos/portada.webp`)
en vez de recortarla de nuevo de la captura: es el mismo archivo que ya
estaba recortado —sin el marco de la historia, sin el globo de respuesta y
sin la foto de perfil— y ya medido. Recortar otra vez era rehacer a mano un
trabajo que estaba hecho, y con el riesgo de que saliera distinto.

**Y el pedido era que la animación del 15 se mantuviera.** Estaba apagada
justo en ese caso: `if (!h || CONFIG.portada) return`. O sea que poner la
foto la perdía sin que nada avisara.

**Encenderla tal cual no servía, y el motivo es de medición.** Sobre el
papel el 15 entra en ORO y la tinta lo llena; sobre la foto el 15 termina
en CREMA con borde de oro, así que el relleno habría sido negro sobre un
15 claro: no lo llena, lo borra. Y el camino obvio —oro abajo, crema
llenando— **falla de verdad**: medido con el píxel más claro debajo del
15, el fondo cambia con la pantalla (gris medio `121,120,120` en un iPhone
SE, casi negro en un Max) y ahí el oro da **2,31:1**. La suite lo agarró
sola: *"sobre la foto no se leen: 2,96:1 «1» · 2,93:1 «5»"*.

Probados los seis colores de la paleta contra ese fondo, **el único que
pasa de 3:1 en los cuatro aparatos es la crema** — o sea el color con el
que el 15 TERMINA. Sobre esta foto no existen dos colores que se lean.

Así que sobre la foto **el 15 no cambia de color: se revela** de abajo
hacia arriba, en su crema de siempre y con su borde de oro, con el mismo
recorte y el mismo tiempo. Es el mismo gesto —algo que sube y se asienta—
y es el único que no le apuesta la legibilidad a dos segundos. De paso no
crea ninguna capa: lo que se anima es el `clip-path` de las propias
cifras, así que el color que mide el medidor es el de verdad.

**La tentación que había que esquivar**: dejar la crema abajo (que mide
7,31:1) y poner el oro de capa de ARRIBA, declarada decoración. El
medidor habría dado verde y el que mira habría visto igual dos segundos
de oro a 2,31:1. Esconderle un color al medidor no es arreglarlo — es la
misma trampa que este archivo ya tiene escrita tres veces.

Lo mide `pruebas/invitacion_mirar.js`, **con el píxel y no con una clase**:
cuenta cuánta tinta clara hay dibujada adentro de la caja del 15 a los 0,7 s
y a los 3,3 s. Así da igual cómo esté hecha la animación —dos capas de
color o un recorte— y lo que se comprueba es lo único que importa: que el
15 entre y termine entero. La foto se **fuerza interceptando el HTML**, no
se lee de `CONFIG.portada`: si mirara la constante publicada, el día que
se vacíe la prueba dejaría de medir y nadie se enteraría. Contra el código
publicado da **1 falla**: *"el 15 NO se anima con foto: 4268 → 4312
píxeles, no se movió"*.

#### El pie es la puerta de entrada del próximo cliente

*"Cuando toquen Click Eterno que vayan directo al WhatsApp y que me
diga de qué invitación viene"* (18/10/2026). Es el único renglón
nuestro en toda la invitación y es por donde entra el que la recibe
y le gusta. Llevaba a la página de inicio: de ahí hay que encontrar
el botón, elegir el servicio y recién entonces escribir. Ahora abre
el chat con el mensaje puesto —*"Vi la invitación de Mia y quiero
consultar por una invitación para mi fiesta"*— y el nombre sale de
`CONFIG.quien`, no escrito a mano: la próxima invitación que se
copie de ésta lo trae bien sin que nadie se acuerde de cambiarlo.
Es la misma decisión que ya estaba tomada en los botones de la
página pública: *el que escribe ya eligió, y del otro lado se sabe
qué pide sin tener que preguntarlo.*

El `href` del HTML sigue apuntando al sitio a propósito —si el JS no
corre, el enlace lleva igual a algún lado— y **el logo de WhatsApp se
pone en el mismo lugar donde se arma el enlace**: sin JS el enlace va
al sitio, y ahí un logo de WhatsApp sería una promesa que no se
cumple.

#### Tocar un punto NO detiene el pase de fotos

*"Que la foto vaya pasando sola así la gente no tiene que clickear
en vano."* La primera versión paraba el pase al tocar un punto, y el
motivo parecía bueno: que la foto elegida no se fuera a los tres
segundos. El resultado fue el contrario. El que toca un punto —y el
dueño fue el primero— deja la cinta clavada para siempre y se va
creyendo que **las fotos no pasan solas**; y el que no toca nada,
que es casi todo el mundo, nunca se entera de que podía tocar. Ahora
el toque lleva a esa foto y **reprograma** el pase con una espera más
larga (7 s en vez de 4,2).
Va con un `setTimeout` que se vuelve a programar y no con un
`setInterval`: la espera larga vale una vez y vuelve sola al ritmo
de siempre. Con un intervalo habría que tirarlo y crear otro, y el
largo quedaría puesto para siempre.
Medido: entra en la 1, a los 4,6 s está en la 2, a los 9 en la 3;
tocando la 1 sigue en la 1 a los 4 s y **a los 8 ya pasó sola**.
Contra el código anterior, ese último paso no ocurría nunca.

#### El borde dorado de los títulos

Pedido del dueño: *"a las letras le pones borde dorado, a todas las
que tengan fuente blanca y sean títulos"*. Son los que caen sobre
negro —el "15" y la fecha de la portada, los títulos de las bandas
oscuras, el salón, el alias y el "Mia" manuscrito del cierre—; los
que están sobre el papel ya son negros y no llevan nada.

Dos cosas que no son opcionales, y las dos dejan la pantalla sin un
solo error:

- **`paint-order:stroke fill`, o el borde se come la letra.** Sin
  eso el trazo va CENTRADO sobre el contorno y se mete la mitad para
  adentro: en una Yeseva, que ya tiene partes finas, los finos se
  cierran y la palabra se empasta. Por eso todo vive adentro de un
  `@supports (paint-order: stroke)`: el navegador que no lo tenga se
  queda con la letra crema de siempre —que se lee perfecta— en vez
  de con una letra empastada. Es la regla del `animation-timeline`
  otra vez: **el estado por defecto tiene que ser el bueno.**
- **El grosor va en `em`, y el `em` es el del ELEMENTO.** El tamaño
  del "15" no vive en el `h1`, vive en el `span` de adentro: puesto
  en el padre, `.022em` se resuelve contra los 32px del `h1` y sale
  un hilo de **0,70px en un número de 140**. Se ve igual que si el
  borde no se hubiera puesto, y en una captura chica no se nota.
  Pasó, y lo agarró la prueba.

Por eso `invitacion_mirar.js` mide ahora los bordes de letra, y solo
donde hay: que el trazo resuelto llegue a 0,8px —abajo de eso es una
declaración que no hace nada— y que haya `paint-order:stroke`.
Verificada rompiendo las dos cosas a propósito: el borde en el `h1`
da 4 fallas (una por aparato) y sin `paint-order` da 8.

**El grosor se subió una vez** (18/10/2026): *"es muy sutil, ponele
un poquitito más"*. De `.05em` a `.072em` en los títulos y de
`.022em` a `.033em` en el "15" — en pantalla, de 1,25px a 1,80 y de
3,1 a 4,6. El manuscrito del cierre va aparte y más fino
(`.026em`): la Pinyon tiene hairlines de un píxel y el mismo grosor
que en una capitular se las come.

**Lleva `noindex`, y es la primera invitación que lo lleva.** Son
fotos de una menor en una dirección pública. El `noindex` no la
esconde —el que tiene el link entra igual— pero la saca de los
buscadores, que es por donde llega el que no fue invitado. La imagen
de la vista previa sigue siendo la tipográfica: la cara de Mia
viajaría en cada chat por el que pase el link, que es la misma
decisión ya escrita para `muro.html` y `rollo.html`.

**Es la primera invitación con el aviso del artículo 6** adentro del
formulario. Acá hace falta de verdad: se piden nombres de invitados
y comidas especiales, que es información de salud.

### `almi15/`: la segunda invitación de un cliente

19 de junio de 2027, La Mansión del Rey, de 21 a 4 h. Quince años.
Lo que pidió: **la misma que la de Pia** —*"misma paleta de colores
pero con otras animaciones"*—, dress code **formal**, alias
`nancyvaldez1976`.

**La paleta y las letras son las de Pia, tal cual** (`--vino`,
`--rosa`, `--oro`, Cormorant Garamond + Jost). Lo que NO se copió de
Pia son los **IDs**: van los de `mia15` (`#abrir`, `#cD`…`#cS`,
`#calendario .elDia`, `#rsvp`, `#fNombre`, `#fLugares`, `#fComida`,
`#fMensaje`, `#enviar`, `#aviso`), porque son los que mide
`pruebas/invitacion_mirar.js`. Una invitación con los nombres de Pia
se dibuja igual y **la suite la mide a medias**: lo que no encuentra
lo informa como "esta invitación no tiene eso" y queda verde.

**Y la confirmación es la de mia15 entera**, que es la única medida
contra una fiesta de verdad: una comida POR PERSONA, el que dice que
no no manda "Cuántos: 4", el mensaje sigue a la vista aunque conteste
que no, y un solo viaje al Apps Script.

**Lo que tiene de distinto es el movimiento**, que es lo que se pidió.
Son cuatro y todas pasan una vez o van atadas al scroll: la **solapa
del sobre** se abre sobre su bisagra y la tarjeta sale de adentro; el
nombre **cierra su interletrado** (.26em → el suyo) mientras el hilo de
abajo se abre desde el centro; cada bloque se revela como un **telón
que sube** (`clip-path`) en vez de subir él; y el **anillo del día del
calendario se dibuja** (`stroke-dasharray` con el perímetro de verdad).
Las cuatro se apagan con "menos movimiento" y el estado por defecto —el
que se ve sin JavaScript— es el bueno.

**El telón se escondía tan bien que no se destapaba nunca, y de paso
se comía los clics.** Esto costó la vuelta entera y es una trampa
nueva: Chrome **tiene en cuenta el `clip-path` para calcular la
intersección**, así que un bloque recortado a cero NO INTERSECA, el
`IntersectionObserver` no lo ve y no le pone nunca su `.entro`. Y un
recorte a cero tampoco responde a un dedo: el formulario entero estaba
dibujado ahí abajo y **no se podía tocar ni el "Sí" ni el botón de
confirmar**, sin un solo error en la consola. Se arregla observando la
**sección**, que no está recortada, y que sea ella la que destapa a los
suyos. La regla, para la próxima: **el que se mira no puede ser el que
se esconde.**

**Y un control escondido se esconde, no se desconecta.** El radio de
`¿Vas a asistir?` se achica a 1x1 detrás de su label —el blanco del
dedo es el label, que mide 52— y llevaba además `pointer-events:none`.
Con eso el navegador no se lo puede dar a nadie: marcar la opción con
el teclado deja de andar, y desde una prueba es imposible. Alcanza con
achicarlo y dejarlo transparente.

**El oro no es el mismo en las dos mitades.** `--oro` (#B8935A) vive
sobre el vino y ahí se lee 5,5:1; sobre el papel claro da **2,38:1**, o
sea que el rótulo de cada sección clara no estaría. Las secciones
claras usan `--oro-tierra` (#8A6B39, 4,45:1). Es *si un bloque trae su
propio fondo, trae su propia tinta* otra vez — y vale la pena mirarlo
en la de Pia, que tiene el mismo rótulo dorado sobre el mismo papel.

**Y el botón principal es un dorado MACIZO, no un degradé.** El
medidor de contraste no juzga lo que cae sobre un degradé opaco de
punta a punta: con el degradé de Pia, el texto del botón es
exactamente un bloque que la suite no puede medir. Sólido, se mide y
da 9:1.

**Lo que NO se escribió porque no lo mandó la clienta**: la fecha
límite para confirmar (vacía no dibuja el renglón, no se inventa una),
y el **titular de la cuenta** del alias — el nombre que le va a mostrar
el banco al pegarlo. Un nombre inventado al lado de un alias es peor
que ninguno, así que ese renglón no existe hasta que llegue.

**`almi15/listado/` todavía no existe, y eso está bien.** Se crea el
día que exista la dirección `/exec` de su planilla: copiar la plantilla
y llenarle las dos líneas de `CONFIG`. `pruebas/invitaciones.js` falla
si una carpeta de listado tiene el `appsScriptUrl` vacío, porque esa
pantalla no traería nada. Mientras tanto `CONFIG.endpoint` de la
invitación está vacío y la confirmación **dice con todas las letras que
no se manda a ningún lado**.

**No está en la galería de Trabajos ni en `/invitaciones`**, por lo
mismo que mia15: es la fiesta de una clienta de verdad, lleva `noindex`
y en el formulario se juntan nombres de invitados y comidas. La página
que se le manda a cualquiera que pregunta muestra las muestras
nuestras, no las fiestas de los clientes.

**Lleva su propia `og.jpg`** (1200x630, 24 KB), tipográfica como la de
mia15: nunca una foto de la fiesta, que viajaría en la vista previa de
cada chat por el que pase el link.

#### La segunda pasada: "es muy básica y de poco vuelo"

El dueño la miró publicada y la bajó entera, con cinco reparos y ninguno
de gusto: *"la presentación es mala. El sobre debería tener mejor
animación. Que se vea la carta por fuera queda feo. La portada debería
ser más linda. Necesito que haya mejor desmarque entre cada sector.
Quiero emoticones más lujosos y con animación. Es muy básica y de poco
vuelo."* Los cinco se arreglaron y los cinco dejaron algo escrito.

**1 · La carta se veía por fuera, y el motivo es de geometría.** Un
sobre cerrado se dibujaba con DOS capas —el cuerpo y la solapa en
triángulo— y el triángulo se angosta hacia abajo: por los dos costados
de arriba asomaban dos cuñas de papel crema. Un sobre de verdad tiene
**cuatro pliegues** en la espalda: el grande de arriba, dos laterales y
el de abajo. Puestos los cuatro no queda un solo punto por donde se vea
lo de adentro. Es el mismo error que *una caja de 0x0 pasa todas las
cuentas*, al revés: lo que no se tapa, se ve.

**2 · El sobre se abre de verdad.** El sello se apaga, la solapa gira
sobre su bisagra (`rotateX`, con `perspective` en el padre), la carta
—con su monograma— sale de atrás del frente, el sobre se acerca un
paso y recién ahí se funde. **Y el `z-index` de la solapa cambia a los
0,45 s**: una solapa abierta va DETRÁS de la carta. Cambiado de entrada,
la carta se ve un cuadro antes de que la solapa se mueva; no cambiado
nunca, la carta sale tapada por el triángulo y el gesto no se entiende.
`z-index` no se interpola, pero `transition:z-index 0s linear .45s`
hace el salto en el momento justo.
**El fundido arranca cuando la carta YA salió.** Pisados, se ven las dos
cosas a la vez —el sobre translúcido encima de la portada— y eso no se
lee como una transición sino como una pantalla a medio cargar.

**3 · El desmarque entre secciones es una CURVA, no un borde.** Cada
sección sube sobre la anterior con un radio en porcentaje —una elipse
achatada— y apoya una filigrana en la cumbre. Dos franjas de color
pegadas por una línea recta se leen como una página web; una curva con
su ornamento se lee como que empezó otra cosa. No pesa nada, no se
pixela y se adapta a cualquier ancho.
**El marco de la portada tiene que esquivar esa curva**: sin ese
respiro, la cumbre del arco le come las dos esquinas de abajo y el
filete termina cortado contra una curva que no es suya.

**4 · Los medallones.** Siete iconos de línea —reloj de arena,
calendario, pin, vestido, regalo, sobre, destello— adentro de un anillo
con dos rombos, y **el anillo y el icono se dibujan solos** al entrar la
sección, con el largo REAL de cada trazo (`getTotalLength`). Se dibujan
en el JS desde una tabla y no se escriben siete veces en el HTML. El
color lo pone la banda, así que el mismo dibujo se lee sobre el vino y
sobre el papel.

**5 · El marco de la portada se dibuja, y por eso son cuatro líneas y
no un `border`.** Un borde de CSS no se puede recorrer: o está o no
está. Cuatro rayas de un píxel que se estiran en cadena —arriba,
derecha, abajo, izquierda— es el gesto de alguien trazando el marco con
una regla, y cuesta cuatro divs. Las cuatro esquinas floreadas entran
después. Sin JS quedan enteras, que es el estado bueno.

**Y la cascada de la portada entra AL ABRIR EL SOBRE, no al cargar.**
Con el sobre encima, una animación que corre detrás no la ve nadie: se
gasta el único momento de sorpresa que tiene la pieza contra una capa
opaca. Por eso el observador saltea la portada mientras el sobre exista
y es el sobre el que la destapa. Es la misma decisión que ya estaba
tomada en `mia15/`.

**Y volvió a aparecer la de siempre, por enésima vez**: la tarjeta de
papel crema vive adentro de una sección oscura, así que el botón de
contorno heredaba ahí una tinta pensada para el vino y daba **1,55:1** —
o sea que "Copiar alias" no estaba. *Si un bloque trae su propio fondo,
trae su propia tinta.* No lo vio el ojo: lo agarró el medidor.

#### Las fotos, y el sobre que se abre de verdad

Tercera pasada, con tres fotos que mandó el dueño y una captura de otra
invitación como referencia: *"La primera foto va en la portada. El sobre
mejorarlo. Busca una animación de apertura que sea copada y no tan
genérica. La segunda foto va antes de la ubicación... quiero que quede
como la tercera foto. Y la cuarta foto quiero que sea en el final con el
'te espero'."*

**Las tres van en blanco y negro, y el filtro está en el CSS.** La paleta
de esta tarjeta son tres colores; una foto a color mete los suyos —el
verde de los árboles, el rojo de la remera— y la pieza deja de ser la de
Pia. En el CSS y no quemado en el archivo: el original queda entero por
si algún día se quiere a color. Es la misma decisión que ya estaba tomada
en `mia15/`.

**La portada va `cover` y no `contain`**, al revés que mia15, y el motivo
es la foto: ésta es apaisada y la pantalla de un teléfono es alta, así que
entera dejaría dos bandas enormes. Lo que se recorta son los costados, no
la cara: el `object-position` la sostiene arriba, que es donde no cae el
texto. **El velo va atado al TEXTO**, no a un porcentaje de la pantalla —
el alto del bloque cambia con el aparato y la raya del degradé no—, y se
hace macizo en el 88% y no en el 100%, porque el borde de abajo de la
foto cae en un punto distinto en cada pantalla.

**Las dos franjas son el pedido de la captura**: una foto a todo lo ancho
con el borde de arriba RASGADO en el color de la sección que viene
arriba, que abajo se funde con la que viene después. No llevan marco ni
título: la foto ES la sección, y por eso la sección que sigue a la
primera franja perdió su curva — la franja ya hace el corte y dos cortes
pegados se leen como un error de maqueta.

Cuatro cosas que costaron una vuelta cada una, y **ninguna tiraba un
error**:

- **La sierra se llenaba del lado equivocado.** El camino rellenaba de la
  cresta para ABAJO, así que entre la sección de arriba y el rasgado
  quedaba una tira de la foto metida en el medio: se leía como una raya
  mal puesta, no como un borde. Va lleno de arriba —del borde de la
  pantalla hasta la cresta— y ahí el rasgado cuelga sobre la foto, que es
  lo que hace la referencia.
- **Una sierra de rectas no es una montaña, es un cotillón.** La primera
  versión eran triángulos y se veía de papel picado. La cresta va con
  curvas y seis cumbres.
- **El camino sale de una SEMILLA fija** —la fecha de la fiesta—, no de
  `Math.random()`: cambiando en cada carga, dos capturas de la misma
  invitación saldrían distintas. Es la regla de `mia15/`.
- **El pie vive FUERA de la franja.** La franja se esconde entera si la
  foto no carga, y con el pie adentro se iría con ella el único renglón
  nuestro de toda la invitación — el que le abre el WhatsApp al próximo
  cliente. Y si esa franja falta, el papel claro del cierre chocaría con
  el pie oscuro en una juntura recta, así que ahí el pie se pone su
  curva: el mismo cuidado que ya costó una vuelta en mia15, donde sacar
  la foto dejaba el borde sin rasgar.

**El sobre: la carta VUELA.** Que la carta salga y el sobre se funda no
es un gesto, es una transición — y eso era lo "genérico". Ahora el sello
se PARTE en dos mitades que se separan y se caen con su polvo de oro, la
solapa gira, la carta sale de atrás del frente y después **se abre sobre
la pantalla hasta que el papel ES la portada**. Cuánto tiene que crecer
lo calcula el JS con la caja de verdad contra la pantalla de verdad: un
número escrito a mano se queda corto en una tablet y se pasa en un iPhone
SE, y en los dos casos se ve el borde del papel cruzando la pantalla a
mitad de la animación. Y el quiebre del sello va en una capa aparte y no
en el botón: moviendo la caja que se toca, el navegador la da por
inestable y una prueba se cuelga treinta segundos contra un botón que
está perfecto.

#### Lo que la prueba de las invitaciones no estaba midiendo

almi15 es la primera invitación PUBLICADA con foto en la portada, y con
eso aparecieron tres agujeros en `pruebas/invitacion_mirar.js`. Los tres
daban verde.

- **"0 renglones sobre la foto" no es un cero, es que no miró.** La
  comprobación que mide con el píxel lo que cae sobre la foto corre
  DESPUÉS de la que recorre la invitación entera para que el observador
  destape, así que la pantalla estaba en el pie: la portada quedaba fuera
  de la vista y todos sus renglones se descartaban por estar arriba. Se
  vuelve al principio antes de medir. Con eso pasó de 0 a **3 renglones
  en almi15 y 7 en mia15** — o sea que esa comprobación llevaba desde que
  se escribió sin medir un solo píxel de mia15 tampoco. Es la caja de 0x0
  otra vez, con el scroll en el medio.
- **Contaba las fotos de una sola manera.** Miraba `CONFIG.fotos` —el
  pase de mia15— y no las franjas, así que una invitación con franjas se
  salteaba sola informando *"no tiene fotos"*. Ahora cuenta las dos, y
  con todas las fotos caídas exige además que **no quede un solo cuadrado
  roto dibujado en ningún lado** y que las franjas se escondan enteras.
  Verificado rompiéndolo a propósito —dibujando la franja antes de saber
  si la foto cargó—: da 2 fallas.
- **Le exigía bordes rasgados a una invitación que no los usa.** El
  rasgado es la forma que eligió mia15 para el corte; almi15 lo resuelve
  con una curva. Lo que hay que medir es que la que LOS USA no se quede
  sin ellos al volver a la portada tipográfica; exigírselos a una que no
  los tiene es inventar una falla.

#### La letra, los medallones y el deslizar

Cuarto reporte del dueño, mirándola publicada: *"El sobre dice A. Podría
decir te invito a mi fiesta. Después me gustaría que haya otra fuente.
Algo más redondeado y más legible. No tan finita como la que está. Me
gustaría que haya unos iconos más llamativos y algo de animación al
deslizar. Para que no sean genéricas."*

**La carta dice lo que tiene que decir.** Era una inicial; ahora dice
*"Te invito a mi fiesta"*. Se ve un segundo —mientras sale del sobre y
se abre sobre la pantalla—, así que va corta y grande: una frase larga
ahí no la lee nadie.

**La letra: Cormorant Garamond + Jost → Fraunces + Hanken Grotesk.** Es
el mismo diagnóstico que ya está escrito para la página pública, ahora
en una invitación: la Cormorant es una **didone** —el contraste entre el
trazo grueso y el fino es enorme a propósito— y en un teléfono los finos
se parten; la Jost tiene la **equis baja**, así que el texto chico
parece más chico de lo que es. Fraunces es una serif de trazo parejo y
formas redondas, con bastardilla de verdad, y Hanken Grotesk tiene la
equis alta. **Los pesos subieron un escalón** (300 → 400, 400 → 500),
que es la otra mitad de "no tan finita", y lo que se pide en el link es
exactamente lo que usa el CSS: un `font-weight` que no esté pedido se lo
inventa el navegador y eso no avisa.

**Las dos familias viven en DOS VARIABLES** (`--titulos`, `--texto-f`).
Estaban escritas quince veces en el CSS; cambiarlas a mano es garantizar
que alguna se quede atrás y la pieza muestre dos letras para la misma
cosa. Además es lo que hace posible lo que sigue.

**`pruebas/letras.js`: mostrar la tipografía, no describirla.** Ya está
escrito más arriba que con mia15 se cambió la familia por descripción
tres veces y las tres no era, y que a la cuarta se montó la misma
portada con siete letras y eligió mirando. Eso ahora es un comando:
`node pruebas/letras.js <carpeta>` arma la invitación con cada pareja
candidata y deja las capturas. **Las fuentes van INCRUSTADAS en base64 y
no es un lujo**: desde acá el navegador rechaza `fonts.googleapis.com`
—el proxy firma los certificados—, así que una captura hecha sin eso
sale con la letra de respaldo del sistema y muestra justo lo que no es.
Se bajan con `fetch`, que sí pasa por el proxy. La primera corrida salió
con Georgia en las cuatro y parecían todas iguales.

**Los medallones.** Eran contorno puro de un píxel: un plano, no una
insignia. Ahora llevan un disco de oro a muy poca opacidad —el mismo oro
del contorno, así que no mete un color nuevo—, un anillo de afuera
punteado, cuatro rombos macizos en vez de dos, y el trazo del icono pasó
de 1 a 1,7. **El anillo punteado NO se dibuja**, y no es un olvido: el
dibujo anima el `stroke-dasharray`, que es justamente lo que le da los
puntos. Las dos cosas en el mismo trazo se pelean y gana una.

**Lo que se mueve al deslizar: las fotos se quedan atrás.** La página
sube y las franjas suben más despacio, así que la foto parece estar
detrás del papel en vez de pegada a él. Es el único efecto de la pieza
que no pasa una sola vez, y por eso va **atado a la posición y no a un
reloj**: si frenás a mitad de camino, frena ahí. Un solo oyente con
`requestAnimationFrame` y `passive`.

Tres cosas de eso que no son opcionales:

- **La foto es más alta que su marco** (126%, corrida −13%). Sin ese
  sobrante, al correrla queda un hueco arriba o abajo, y un hueco en el
  medio de una foto a sangre se lee como un error de carga.
- **La portada queda AFUERA del paralaje.** Su foto ya tiene el zoom
  lento, que es un `transform`, y dos cosas peleando por la misma
  propiedad es una que gana y otra que desaparece. Moverle la caja
  tampoco sirve: el velo que hace que el texto se lea es un `::after` de
  esa caja y se iría con ella.
- **Se mide lo que importa: que la foto esté corrida DISTINTO en dos
  puntos del scroll** (−52 → 54 px), no que exista una clase ni un
  oyente. Así da igual cómo esté hecho. Apagado el paralaje, da 1 falla.

**Y una que dejó la letra nueva al pasar**: el enlace del pie medía
43,6px de alto y dejó de llegar al mínimo de 44. El `padding` estaba
calculado contra la altura de UNA tipografía, así que dejó de valer el
día que se cambió la tipografía. Se ve igual y no se toca igual; lo
agarró la prueba, no el ojo.

#### La frase de la portada, y el velo que hubo que volver a medir

*"Que en la portada diga alguna frase como te invito a festejar esta
noche inolvidable o algo así."* Dice **"Vení a festejar conmigo una
noche inolvidable"**, y el cambio de arranque no es de gusto: *"Te
invito"* es lo que dice la carta del sobre, que el que mira acaba de
ver dos segundos antes. Dicho dos veces seguidas se lee como un error
de copiar y pegar, no como una invitación; así la segunda continúa a la
primera.

**Y agregar dos renglones sobre una foto corrió todo el bloque hacia
arriba, a la parte clara de la cara.** El nombre pasó de 5,85:1 a
**2,58:1 en un iPhone SE** — o sea que "Almi" dejó de estar—. No se ve
en un escritorio, donde la pantalla es más alta y el bloque no sube
tanto: lo agarró la medición con el píxel, en el aparato más chico.
El velo hubo que volver a repartirlo y volver a medirlo hasta 4,28:1,
que es cómodo sin apagarle la cara a la foto.
**La regla, que vale para cualquier invitación con foto a sangre: un
renglón que se agrega encima de una foto no es sólo un renglón más — es
todo lo que estaba abajo, subido.** El velo se vuelve a medir cada vez
que cambia el texto de la portada.

#### Dos caras tapadas, y por qué el recorte no se elige por el ancho

*"La foto de portada está muy tapada la cara con las letras. Y la del
final está tapada la cara con el zócalo blanco."* Las dos son el mismo
error con dos disfraces: **se encuadró la foto sin mirar qué le cae
encima**.

**La portada.** Con `cover` en una pantalla alta la foto se escala por
el ALTO, así que `object-position` vertical **no hace nada**: la cara
queda donde la puso el fotógrafo, y ahí es justo donde va el nombre.
Se arregla moviendo la caja de la imagen (`top:-17%`), no la posición
del objeto. Lo que sube es la cara; abajo queda la ropa, que es donde
el velo y las letras no tapan nada.

**Y en una pantalla BAJA volvía a pasar**, porque el bloque de texto
mide casi lo mismo en todas y en 568px de alto se lleva la mitad de la
pantalla. Abajo de 720px de alto la portada achica un escalón —el
nombre, los aires, el pie— y la foto sube más. **El recorte no se
elige por el ancho: se elige por lo que queda libre arriba.**

**La franja del final.** Ahí el culpable no era el rasgado sino el
**sobrante del paralaje**: la foto es más alta que su marco y lo que
se recorta arriba es exactamente la cabeza. Se bajó el sobrante de 26%
a 16%, se recortó la foto de origen con aire arriba —130 píxeles más
de espejo— y la cresta quedó menos honda. Un borde que cuelga sobre
una foto tiene que ser un borde, no una tapa.

**La lección, y es la tercera vez que aparece en esta invitación**: una
foto encima de la cual va a caer texto —o un borde, o una curva— no se
encuadra mirando la foto. Se encuadra mirando la pantalla terminada, y
en el aparato más chico, que es donde el texto pesa más.

#### El sobre se va cuando la carta sale, y la portada se limpia

*"Cuando sale la carta del sobre y hace la animación debería desaparecer
el sobre"* y *"en la portada borrá toda la info del salón y del día
porque eso está más abajo"*.

**El sobre.** Se fundía la capa ENTERA —carta incluida— recién al final,
así que la carta se abría sobre la pantalla con el sobre todavía
dibujado detrás: dos cosas pasando a la vez, no una transición. Ahora el
fondo y el papel del sobre se funden apenas la carta arranca a volar, y
lo único que queda en pantalla es la carta creciendo sobre la portada.
**Por eso el fondo vive en su propia capa** (`#sobre:before`) y no en
`#sobre`: fundiendo `#sobre` se funde también la carta, que es su hija.
Es la misma forma del problema que ya está escrita para el `z-index` de
la solapa — *lo que se mueve no puede ser lo que se esconde*.

**La portada.** Salieron la fecha, el salón y el horario: los tres están
más abajo, cada uno en su sección con su medallón. Quedan el nombre, "mis
quince años" y la frase. **Y eso destapó la cara sola**: con tres
renglones menos el bloque bajó, así que la foto volvió a subir mucho
menos (de −17% a −8%) y se ve la cabeza entera. De paso el texto pasó a
caer sobre la ropa y no sobre la piel: el contraste sobre la foto subió
de **4,28:1 a 11,3:1**.
**La regla, al revés de la de más arriba**: sacar un renglón de una
portada con foto tampoco es sacar un renglón — es todo lo de arriba
bajando, y el encuadre se vuelve a mirar.

#### La carta no salta a la portada: el cruce

*"Me gustaría que sea menos brusca la transición de la carta y la
portada."* La carta volaba **creciendo hasta 6,1x** —o sea hasta tapar
la pantalla entera— y recién ahí se cortaba a la portada, que estaba
puesta en opacidad 1 desde el primer cuadro. Son dos pantallas pegadas
con un corte, y un corte **no tira ningún error**: las dos se dibujan
perfectas y lo único que pasa es que el único momento de sorpresa que
tiene la pieza se siente barato.

Ahora es un **cruce**: la carta crece hasta 2,7x y se disuelve
(1,25 s desacelerando, el fundido entrando a los 0,3), el papel y el
fondo del sobre se van con ella, y la portada **se asienta** —entra al
45% y apenas agrandada (1,035) y llega a su tamaño en 1,1 s—. Medido en
un iPhone: a los 1,3 s la carta va en 2,2x y la portada ya está en
0,77; a los 1,7 la carta en 0,16 y la portada en 0,97. Las dos cosas
pasan **a la vez**, que es lo que hace que no se note el empalme.

**Y la cascada de la portada corría detrás del sobre opaco.** El nombre
cerrando su interletrado, el hilo abriéndose y los bloques entrando
arrancaban en el click: con el sobre todavía encima, **eso no lo veía
nadie** — se gastaba la animación contra una capa opaca. Ahora se
destapa a los 1,05 s, cuando el sobre ya se está yendo. Es la misma
decisión que ya estaba escrita para `mia15/`, que no se había aplicado
acá.

**Lo que se mide es el CRUCE, no una clase ni un tiempo.** La suite
muestrea cada 150 ms desde el click y pide tres cosas: que haya al
menos dos instantes en que la portada esté **a medio camino con el
sobre todavía en pantalla** (si no, aparece de golpe), que la carta no
pase de 4x (si crece más, tapa todo y lo que se ve es un corte), y que
al final no quede nada a medias. Así da igual cómo esté hecho. Contra
el código anterior da **2 fallas**: *"la portada APARECE de golpe"* y
*"la carta se agranda hasta 6.1x"*.

### `ambar15/`: la tercera de un cliente — Ámbar Zoe Balbi

10 de abril de 2027 · La Mansión del Rey · de 21 a 4 h. Quince años.
Alias `ambar.balbi.rc`, dress code **Elegante sport**, y los colores de
la fiesta —**rosa, negro y plateado**— que ella mandó escritos a mano.

**La carpeta se llamaba `nueva15` y se renombró el día que llegó el
nombre**, que era exactamente para lo que se había dejado así: la
dirección es `clicketerno.com.ar/ambar15` y el link todavía no se había
repartido. Un link repartido no se puede mover; uno que nadie tiene, sí.

**La referencia la eligió la clienta** y la mandó el dueño: dos
capturas y un video de TikTok de una invitación de Etsy, todo en la
estética de **Victoria's Secret** — rayas rosa y blanco, encaje negro,
moño de raso, perlas, y una foto adentro de un óvalo con alas. El
pedido fue *"hacela igual pero con nuestro estilo para que no sea copia
fiel"*.

**Dos cosas de la referencia NO se copian, y no es una opinión:**

- **El monograma de alas con la V y la S es el logo de Victoria's
  Secret**, una marca registrada. Una invitación publicada con el logo
  de otro es un problema nuestro, no de la clienta. En el óvalo va **la
  inicial de ella** —y si no hay foto, esa inicial es el centro de la
  portada—. Visualmente no pierde nada: lo que hace la estética son las
  rayas, el encaje, el moño y las alas, no las dos letras.
- **El moodboard de dress code de la referencia son fotos de personas
  reales sacadas de internet.** Es el artículo 53 otra vez, el que está
  escrito en nuestros propios Términos. Acá el dress code va
  **dibujado** —vestido, taco, cartera, moño—, que dice lo mismo, pesa
  cero y es nuestro. El día que la clienta mande sus fotos, se cambia.

**Lo que se hereda de `almi15`, que a su vez lo heredó de `mia15`**: el
sobre que se abre y la carta que vuela, los medallones, el corte en
curva, y **la confirmación entera** —una comida por persona, el que
dice que no no manda "Cuántos", el mensaje a la vista aunque conteste
que no, y un solo viaje al Apps Script—. Son los IDs que mide
`pruebas/invitacion_mirar.js`: una invitación con otros nombres se
dibuja igual y la suite la mide a medias.

**LOS HUECOS.** Esta salió a propósito a medio llenar: el dueño la
pidió así —*"hacé todo y dejá los huecos así vamos viendo qué
modificar"*— porque la clienta todavía no mandó los datos. Lo que falta
no se inventa **y tampoco se deja en blanco**: cada dato ausente se
dibuja como una **píldora que dice qué falta** (`falta()` + `.falta`),
y la píldora desaparece sola en cuanto el dato existe. Lo que la
enciende es que todavía no haya pestaña de planilla (`CONFIG.evento`
vacío), o sea exactamente "esto es un borrador", así que no puede
quedarse puesta el día que esto se reparta.
Eran cinco —nombre, foto, dress code, alias y titular— y **hoy no
queda ninguna píldora dibujada**: lo que falta son el **titular de la
cuenta** y **hasta cuándo se puede confirmar**, y esos dos no llevan
píldora sino que **no dibujan su renglón**, que es lo que ya hacían
`mia15` y `almi15`. Un renglón que no está no le miente a nadie; una
fecha puesta a ojo le cierra las mesas al invitado el día que no es.

**Y la dirección de la planilla se enciende sola** cuando `CONFIG.evento`
tiene valor. Con dirección y sin pestaña, la confirmación se manda, la
planilla contesta `sin_evento` y el invitado ve un error que no es
suyo: es la misma trampa que ya costó una vuelta en el listado.

Cuatro cosas que costaron una vuelta cada una, y **ninguna tiraba un
error**:

- **`.hueco` ya existía**: es el botón de contorno de las tres
  invitaciones. La píldora de los datos que faltan se llamó `.falta`.
  Es la regla escrita dos veces en este archivo y por poco la piso una
  tercera: antes de inventar un nombre, `grep`.
- **El encaje y el marco de la portada desaparecían.** La portada tiene
  `#portada > *{position:relative}` para que el texto quede por encima
  del velo, y eso le pisaba el `position:absolute` a las dos capas: de
  capas pasaron a ser filas de la grilla, con `justify-items:center` y
  ancho de contenido, o sea **0 de ancho**. La caja de 0x0 otra vez,
  ahora por un selector demasiado ancho. La regla exime a las dos.
- **El ala no se dibuja con trazos.** La primera versión eran cinco
  arcos paralelos y se leía como un rayado; la segunda, cinco plumas
  sueltas, y se leía como dos pestañas. Lo que hace que sea un ala es
  la **silueta**: una sola forma rellena con las muescas de las plumas
  en el borde de abajo, y encima tres hilos claros. Se ve mirando, no
  leyendo el código.
- **Un ancho en `vw` adentro de una sección con padding se sale.** Las
  alas iban `min(440px,92vw)` y la portada tiene su propio padding: 36
  píxeles afuera de la pantalla en un iPhone. Va `width:100%` con
  `max-width`. Un número que depende del padding de otro no se escribe
  dos veces — lo agarró la suite, no el ojo.

**Los iconos son PRODUCTOS DE LA TIENDA**, pedido del dueño con esas
palabras: *"los quiero personalizados con onda Victoria's Secret, como
si fueran de productos"*. Son siete y cada uno sigue diciendo de qué
habla su sección: el reloj de arena **con su moño**, el calendario
**atado con un moño**, el pin **con una perla** adentro, el vestido
**colgado de su percha**, la **bolsa a rayas** (el producto más
reconocible de los dos), el sobre **cerrado con un moño** y el **frasco
de perfume** con su atomizador. La filigrana de cada corte dejó de ser
un rombo y es un **moño entre dos hilos de perlas**.

**El moño es UNO SOLO** (`MONO(cx,cy,ancho,alto)`) y se usa en los
cuatro lugares: escrito cuatro veces, el día que se cambie alguno se
queda atrás y la pieza muestra dos moños distintos para la misma cosa.

Y tres cosas que sólo se ven MIRANDO, no leyendo el código:

- **Un icono con quince líneas a 42px no es un dibujo, es una mancha.**
  La primera tanda tenía percha + vestido + moño + cintura en el mismo
  dibujo y se leía como un borrón. Lo que no se lee a 42 no va.
- **El moño dibujado con dos curvas en S se lee como un garabato
  cruzado.** Son dos hojas que se tocan en el nudo, y el nudo se
  dibuja: sin él son dos gotas sueltas.
- **Una hoja del moño mide 0,75 del ancho que se le pasa.** Con 3,4
  quedaba de cuatro píxeles en pantalla y parecía una nube. Y la bolsa
  con los lados en diagonal se leía como un **tacho de basura**: va
  recta y con las rayas de punta a punta.

**La tarjeta de dress code acepta FOTOS** (`CONFIG.dressFotos`, hasta
cuatro), que es el detalle de la referencia que el dueño marcó como
bueno: cuatro recortes enmarcados y apenas torcidos, como pegados en un
tablero. Vacío deja los cuatro dibujos. Cada foto aparece recién cuando
cargó de verdad, la que falla se saca y si no queda ninguna vuelve el
dibujo — nunca un marco alrededor de un cuadrado roto.
**Van EN COLOR**, al revés que las de la portada de `mia15` y `almi15`:
en un dress code el color es el dato, y una foto en blanco y negro no
dice si el vestido es negro o es verde.

**EL ENCAJE ES ENCAJE, no un festón.** El dueño mandó dos capturas —
una tira de encaje negro fruncido arriba y abajo de las rayas, y una
tarjeta con **textura** de encaje negro— y pidió las dos. Están hechas
con SVG que se repite, no con imágenes: pesan 23 KB y 15 KB, no se
pixelan y se adaptan a cualquier pantalla.

**Lo que hace que un recorte parezca TELA es la red fina.** La primera
versión eran festones con tres ojalitos y se leía como un toldo; la
segunda tenía la malla con el punto grande y se leía como lunares. El
encaje es **red fina MÁS motivo grande**, los dos tamaños a la vez: una
malla de puntos de 0,6 y rosetas de seis pétalos. Con un tamaño solo no
hay encaje. Se ve mirando, no leyendo el código.

**Y en la textura, cuatro elipses cruzadas no son una flor: son un
moño.** La primera versión del motivo giraba cuatro elipses sobre el
mismo centro y salían aspas. La flor son **seis pétalos alrededor de un
centro**, separados. Va en un negro apenas más claro que el fondo
(`#2C2029` sobre `#140B10`): tiene que sentirse, no verse — si se ve,
le compite a los títulos y a las tarjetas, que es justo lo que va
encima.

**La bolsa costó tres vueltas y es la lección de siempre**: el dueño
mandó la foto de la bolsa de verdad —rayas, dos asas de cinta y el
papel de seda asomando— y las tres cosas juntas a 42px son una mancha.
Con las asas colgando POR ADENTRO se perdían contra las rayas; con el
papel de seda arriba, los picos y las asas formaban una cara. Quedó lo
que identifica a la bolsa y se lee: el cuerpo ancho, **las dos asas
sobre el borde** y las rayas. **Un icono no es una foto: lo que no se
lee a 42 no va**, y de tres detalles hay que elegir dos.

**Y una cuarta vuelta, porque seguía sin parecerse**: el dueño volvió
con la foto —*"no podés hacer un icono parecido al de la bolsa de
VS"*—. Lo que faltaba no era un detalle más, era la PROPORCIÓN: las
asas eran dos arcos cortos apoyados en el borde, y en la bolsa de
verdad las cintas suben casi tanto como el cuerpo y se cruzan arriba.
Con las cintas altas la bolsa se reconoce de un vistazo. **Se eligió
mirando**: se montaron cinco versiones a 150px y a 42 y se comparó —es
lo mismo que ya está escrito para la tipografía, y es lo único que
sirve cuando el problema es que algo "no se parece". El papel de seda
volvió a quedar afuera y por el mismo motivo de siempre.

**Y los POMPONES del dress code.** Estaban marcados en la referencia y
no se habían hecho: son tres plumas —crema, rosa y negro— atadas con
el moño de la pieza, y ahora son el dibujo de la tarjeta de dress code
mientras no lleguen las fotos de la clienta. Reemplazan a los cuatro
productos en fila que había antes: lo que dice qué ponerse es el
texto, el dibujo es decoración, y la decoración es la que él señaló.
Tres cosas que costaron una vuelta cada una, y **las tres se ven
mirando, no leyendo el código**:
- **Con lóbulos parejos un pompón es un chupetín.** Lo que lo vuelve
  pluma es el borde: muchos bultos chiquitos e irregulares. Quince
  lóbulos iguales y un mango largo y recto se leían como algodón de
  azúcar.
- **Los tres mangos tienen que CONVERGER en el nudo.** Sueltos, cada
  pompón era una flor aparte y eso no es un ramo; y el moño, dibujado
  lejos de donde se juntan, quedaba flotando sin atar nada.
- **Las siluetas van escritas ya calculadas, de una semilla fija.**
  Con `Math.random()` dos capturas de la misma invitación saldrían
  distintas — la misma regla que la sierra de las franjas.

**El ramo después se tiró entero**, y con él el moño y los mangos: los
pompones pasaron ARRIBA y CORTADOS, haciendo de marco. Está abajo, en
*"Los tres pompones haciendo de marco"*, y ahí el dibujo se rehizo de
cero — lo único que sobrevive de esta vuelta es la lección del
chupetín, que volvió a aparecer.

**El medidor de contraste no ve esta textura** —mide el
`background-color`, no la imagen—, y acá eso no esconde nada porque los
dos negros están a menos de un punto de luminancia. Si alguna vez se
aclara el motivo, ese texto hay que volver a mirarlo con el píxel, como
en la portada de `mia15`.

**No está en la galería de Trabajos ni en `/invitaciones`**, por lo
mismo que `mia15` y `almi15`: es la fiesta de una clienta de verdad,
lleva `noindex` y en el formulario se juntan nombres de invitados y
comidas.

#### El monograma AZB, el sobre de la referencia y la bolsa

El dueño mandó los datos, cinco fotos y dos capturas más, con tres
pedidos: *"que el sobre sea igual al que te mandé y con la misma
fuente"*, *"la parte del Dresscode y eso que sea como la última foto"*
y *"hacé un juego con las iniciales de la quinceañera y que parezca el
logo de Victoria's Secret; las iniciales son AZB"*.

**El monograma se eligió MIRANDO, no describiendo**, que es la misma
regla ya escrita para la tipografía y para la bolsa de los iconos. Se
montaron doce armados a 72, 34 y 20 píxeles y adentro del lacre, y se
eligió el que se lee en los cuatro tamaños: la Z al 122% entre una A y
una B al 74%, tocándose apenas. Y la conclusión que se sacó de ahí
—*"solapar tres capitulares de una didona no se lee"*— era cierta a
medias, y el dueño lo destapó con una referencia.
**Son SUS iniciales**, no la V y la S de una marca registrada: eso
último sigue prohibido y por el mismo motivo de siempre —una invitación
publicada con el logo de otro es un problema nuestro, no de la clienta.
Y va como **texto y no como dibujo**, así que el medidor de contraste
lo mide de verdad: dibujado en un SVG sin color propio informaría
1,00:1 y tendría razón según lo que mide.

##### Y después mandó el logo que quería, y la conclusión estaba a medias

*"Prefiero este logo en vez del que hiciste. Ponerlo como la cera de la
carta y al final de la invitación así en negro como en la segunda
foto."* La referencia es una **A y una B de didona ENTRELAZADAS**, con
una lazada caligráfica cruzando por el medio, en oro rosa.

Acá arriba estaba escrito que con tres letras no se puede entrelazar, y
**lo medido era verdad pero la conclusión sobraba**: lo que no se lee
son tres capitulares **de la misma didona**, porque las tres pelean por
el mismo peso y la del medio se la come la de al lado. Con la Z en la
**manuscrita** —la Pinyon, que ya estaba cargada para el nombre— la del
medio deja de ser una capitular y pasa a ser la LAZADA: la A y la B se
entrelazan como en la referencia y la Z las cose, sin taparse. Se
probaron cuatro armados y se eligió mirando, igual que la vez anterior.

**La lección, que es nueva**: una medición dice que algo *no funcionó*,
no que *no se puede*. La primera vuelta probó doce variantes de un solo
camino —tres capitulares de la misma familia— y escribió la conclusión
como si cubriera todos. El camino que faltaba lo señaló el dueño con una
imagen en dos segundos.

**El lacre pasó a ser de ORO ROSA**, que es el metal de la referencia
—y le queda, porque se llama Ámbar—, con el monograma en cobre hondo
encima (4,8:1). Ese número **hay que calcularlo a mano**: el medidor no
juzga lo que cae sobre un degradé opaco de punta a punta, así que ahí
da verde mire lo que mire.

**Y al final de la invitación va la misma marca en NEGRO**, con el
nombre completo abajo en versalitas espaciadas, que es la segunda
referencia. Sobre el papel claro el oro rosa da 2,2:1 —no estaría—, así
que ahí la marca es tinta: *si un bloque trae su propio fondo, trae su
propia tinta*, enésima vez.
**Y el cierre perdió su medallón**: la marca ES su emblema, y dos
emblemas apilados se leen como un error de maqueta.
*(Más abajo: esa marca dibujada pasó a ser el RESPALDO, porque el dueño
mandó después la pieza ya hecha.)*

**El sobre sale de la captura: las alas a los costados y el lacre
dorado.** ~~Abierto, con la carta asomando.~~ **Eso duró poco y está
contado abajo**, en *"El sobre estaba revelado"*: la carta afuera
mostraba el nombre y la fecha antes de tocar nada, y encima peleándose
con el lacre. Lo que no puede verse nunca es lo que el sobre dice que
está tapando.
El lacre es **dorado** y no negro —en la referencia lo es, y además le
queda: se llama Ámbar—, con el monograma en tinta encima (5,9:1).

**El sobre es más ANGOSTO que la pantalla, y no es un ajuste de gusto**:
las alas no son un adorno que se pueda recortar, son la mitad de la
referencia, y un ala cortada contra el borde se lee como un error de
maqueta. Con el sobre a 78vw las dos quedaban mochas; a 66vw entran
enteras hasta en un iPhone SE.
**Y el ala es UNA sola**, en un `<symbol>` que usan la portada (negra)
y el sobre (blanca). Un selector de CSS no entra adentro de un `<use>`,
así que el color viaja por propiedades que SÍ heredan: `color` para la
silueta y `--pluma` para los nervios.

**El dress code y el regalo pasaron a ser LA BOLSA de papel a rayas**,
que es la segunda captura. Antes eran dos tarjetas de papel. Son las
asas, el pliegue de la boca y las rayas lo que la hace leer como la
tienda; **lo que NO se copia es el texto en ARCO** de la referencia,
que es lindo en una captura y en un teléfono es un párrafo que hay que
girar la cabeza para leer.
Adentro van las **muestras de color** —rosa, negro y plateado, cada una
con su nombre: una fila de cuadraditos sin rótulo es un adorno, y esto
es un dato— y el renglón que dice que *son una guía, no una
obligación*, porque a cómo se visten contestó **"como quieran"**.
Las muestras salen de `CONFIG.dressColores` y no del HTML: escritas en
los dos lados, el día que cambie un color uno de los dos se queda viejo.

**Y la bolsa trae su propio fondo, así que trae su propia tinta** —
enésima vez—: vive adentro de una sección oscura y sin eso heredaba el
crema del texto sobre negro, o sea crema sobre papel rosa. Ojo con un
detalle de especificidad que ya costó una vuelta: `.bolsa-cuerpo p`
pesa más que `.bolsa-marca`, así que el monograma heredaba el gris de
los párrafos **y las alas con él**. Se dibujaba y no era el color.

**El ancho de una muestra lo decide el RÓTULO, no el cuadradito**:
"PLATEADO" espaciado mide 58px y la primera versión le daba 55. Lo
agarró la prueba, no el ojo.

**El medidor de contraste no ve las rayas de la bolsa** —mide el
`background-color`, no la imagen—, y acá eso no esconde nada porque la
raya rosa y el papel están a menos de cinco puntos de luminancia y el
texto es oscuro. Si alguna vez se oscurece la raya, ese texto hay que
volver a mirarlo con el píxel.

#### El monograma con alas, y los besos

Dos pedidos más, con dos capturas: *"Pone ese diseño en algún lado y
unos labios iguales a esos en algunas partes de la invitación"*.

**El diseño con alas va al FINAL**, que es el único lugar donde entra
entero y en grande sin competirle a nada: la A y la B negras entre las
dos alas, el nombre completo abajo en versalitas y, debajo, el beso.
Ahí las alas van **blancas** —son las de la referencia— con los
nervios en rosa y su sombra: sobre el papel claro, un blanco sin
sombra no se ve. Es el mismo dibujo de siempre, el del `<symbol>`.

**El beso va DIBUJADO, no es la imagen de la captura.** Una imagen de
la que no sabemos la licencia no se publica —la regla de siempre—, y
además así pesa cero, no se pixela y se puede teñir donde haga falta.
Está en cuatro lugares: el fondo del sobre, la portada, la bolsa y el
cierre, cada uno con su propia semilla para que no sean el mismo
dibujo repetido cuatro veces.

**Lo que hace que se lea como un SELLO y no como una boca de dibujito
son tres cosas, y las tres se vieron mirando:**

- **El HUECO entre los dos labios.** La primera versión los pegaba con
  una línea fina y quedaba un globo rosa.
- **Las ESTRÍAS claras**, y **recortadas con un `clipPath`**. Sueltas
  asoman por fuera del labio y lo que se ve son rayones blancos
  colgando, no un sello. Eso costó una vuelta entera.
- **El borde IRREGULAR**, de una semilla fija como la sierra: al azar
  en cada carga, dos capturas de la misma invitación saldrían
  distintas.

**Y volvió la trampa del selector demasiado ancho, por tercera vez.**
`#portada > *` y `.bolsa-cuerpo > *` les ponen `position:relative` a
todos sus hijos para subirlos por encima del velo — y con eso el beso
deja de ser una capa y pasa a ser una fila del flujo: el `top/right`
no vale nada y se planta donde caiga. Ya había pasado con el encaje y
con el marco. Las dos reglas eximen ahora a `.beso`.

#### Las fotos, y la que no se usó

Son cinco selfies que mandó ella. **Van tres**: una en el óvalo de la
portada y dos en las franjas, todas en blanco y negro por el CSS —la
paleta son tres colores y una foto a color mete los suyos—. Las otras
dos son casi la misma pose con otra ropa, así que no suman nada y no se
versionan: una foto de una menor sentada en una dirección pública es
peso y es exposición sin nada a cambio.

**El recorte del óvalo se hizo DOS veces.** El primero entraba 900px de
ancho y la cara quedaba en el cuarto de arriba del óvalo: el óvalo
recorta apenas un 10% del alto, así que `object-position` casi no
mueve nada — **el encuadre se arregla en el archivo, no en el CSS**.

#### ~~Los tres pompones haciendo de marco~~

**SACADOS el 30/10/2026**, con el monograma con alas de la misma
tarjeta: *"Esta parte quedó fea. Esos pompones no se parecen en nada a
lo que te pedí. Lo mejor sería sacar eso y el logo horrendo ese que
hiciste"*. Lo que hay ahí ahora son las tres estrellas; está abajo, en
*"Las tres estrellas, de emblema del dress code"*. Lo de acá queda
escrito por la lección de la pluma, que es lo único que sobrevive.


Pedido del dueño con una captura —una tarjeta de RSVP con tres
pompones de pluma asomando por detrás del borde de arriba—:
*"Esto mismo para la parte del Dresscode. Los 3 pompones esos
haciendo de marco en la parte de arriba."*

Los pompones ya existían, pero estaban ABAJO del texto, atados en un
ramo con su moño. **Lo que cambia no es dónde se ponen: es que ahora
están CORTADOS.** Un ramo entero es un dibujo más adentro de la
bolsa; tres pompones que se ven a medias se leen como que hay algo
adelante, y ese algo es el bloque. El corte lo hace la CAJA —alto fijo
más `overflow:hidden`— y no el dibujo, y la raya de abajo es el borde
del que asoman: sin ella el corte se lee como un recorte mal hecho.

**Y dejaron de ser el dibujo que espera a las fotos.** Antes se
escondían el día que llegaran las del dress code. La corona es el
MARCO del bloque, así que se queda: las fotos entran abajo, que es el
moodboard.

**Los colores pasaron a ser los TRES QUE MANDÓ LA CLIENTA** —rosa,
negro y plateado— en vez del crema de antes. Son los mismos de las
muestras que están dos renglones más abajo, así que el adorno dice lo
mismo que el dato; y el plateado se ve sobre el papel rayado, donde un
crema casi no existe. Lo mismo el rosa y el plateado del dibujo, que
van un tono más hondos que la muestra: sobre el papel rosa claro, el
rosa de la muestra no se despega del fondo.

##### Una pluma se dibuja con PELO, no con silueta

Esto costó cuatro vueltas y es la lección que queda. **Cualquier forma
rellena de borde limpio se lee como otra cosa**, y las tres primeras
versiones fallaron todas por lo mismo:

- con lóbulos redondos y parejos sale una **margarita** —es la misma
  falla que ya estaba anotada para los pompones del ramo, "con lóbulos
  parejos un pompón es un chupetín"—;
- con el borde en puntas, una **corona de espinas**;
- con lóbulos grandes y blandos, un **loto**;
- y con barbas rectas y parejas, un **helecho**.

Lo que hace a la pluma es el raquis y las BARBAS que salen de él, y lo
que hace al pompón es que **el borde quede peludo**, o sea que la
silueta NO se cierre. Tres cosas que no son de gusto:

- **Las barbas se arquean** —el punto de control cae hacia la base— y
  se van parando hacia la punta.
- **Adentro hay un núcleo relleno MÁS ANGOSTO Y MÁS CORTO que las
  barbas**: denso abajo y pura pelusa arriba, como el de verdad. Sin
  núcleo se transparenta; con el núcleo del largo de la pluma sale una
  hoja con punta y el pompón se lee como una **planta de interior**.
- **El abanico va aplanado** —todas las plumas casi del mismo largo y
  muy abiertas—, que es lo que lo vuelve un montículo. Con la del
  medio larga y las de afuera cortas sale una **palmera**.

Todo sale de una semilla fija, como la sierra y los besos, y los
parámetros viven en una sola constante (`PLUMA`) —que es lo que
permitió probar los armados **interceptando el HTML**, igual que
`puertas.js` con `MUESTRA_MURO`, en vez de editar el archivo cada
vez—. **Se eligió mirando**, montado al tamaño real y al de un
teléfono, que es lo único que sirve cuando el problema es que algo
"no se parece". Es la misma forma de trabajar que la tipografía, el
monograma y la bolsa.

##### Y la regla de los nombres repetidos también vale para un script de edición

Haciendo esto se perdieron 32 KB del archivo y no hubo ningún error.
El script de edición buscaba un comentario por su título
(`/* ── LA CORONA DE PLUMAS DEL DRESS CODE ──`) y reemplazaba hasta
otro ancla — pero ese título había quedado **dos veces**, una en el
CSS y otra en el JS, así que `index()` encontró la primera y se llevó
puesto todo lo que había en el medio: el CSS, el HTML de dos secciones
y la mitad del JS. El archivo quedó válido, se sirvió con 200 y la
página dibujó sin una sola excepción en la consola; lo único que
delataba era que `#detalles` ya no existía.

Es *antes de inventar un nombre, `grep`* —la regla que ya está escrita
dos veces para el código y una para las pruebas— aplicada a los
scripts que EDITAN el código. Un ancla se busca con
`assert s.count(ancla) == 1`, nunca con el primer `index()`, y después
se mira el tamaño del archivo.

#### Las tres estrellas, de emblema del dress code

*"Esta parte quedó fea. Esos pompones no se parecen en nada a lo que te
pedí. Lo mejor sería sacar eso y el logo horrendo ese que hiciste y
hacer algo como lo de la segunda foto"* — y la segunda foto son las
**tres estrellas apiladas**: la de atrás en animal print, la del medio
rosa y la de adelante plateada con glitter, sobre el papel a rayas.

De la tarjeta se fueron las dos cosas: la corona de pompones y el
monograma con alas que encabezaba el bloque. En su lugar van las
estrellas, **que ya estaban dibujadas en el archivo**: son las de la
portada tipográfica, que hoy no se ven porque manda el afiche. Es la
misma regla de siempre —*dos dibujos para lo mismo es uno que se queda
atrás*—, así que las dos las hace `estrellasSVG()`.

**Lo que las hacía no parecerse a la referencia era el RIBETE BLANCO.**
Sin él las tres se tocan y lo que se ve es una mancha con varias
puntas; el borde blanco es lo que dice que hay tres cosas pegadas, y es
lo primero que salta de la captura. Lo demás fue el leopardo —pocas
rosetas GRANDES en vez de muchas chiquitas, que a este tamaño se leen
como lunares— y el glitter, que pasó de 54 granos a 300: un degradé
liso con cuatro burbujas se lee como plástico gris, no como brillo.
Y abajo del grupo va una sombra suave, que es lo que despega al rosa
del papel rayado.

**El animal print sigue en NEGRO sobre rosa claro y no en marrón**,
aunque la referencia sea tan: lo que hace leer un animal print es el
DIBUJO y no el color, y el marrón sería un cuarto color en una paleta
de tres. Si alguna vez se pide tal cual, es una línea.

##### Y el mismo dibujo dos veces en la página son `id` repetidos

Esto no se vio, se razonó, y es la regla de los nombres repetidos
llevada a un SVG: el dibujo lleva adentro dos recortes, dos degradés y
una sombra, cada uno con su `id`. Puesto dos veces —la portada y la
tarjeta— el navegador resuelve `url(#…)` contra el **primero** que
encuentra. Hoy los dos son iguales y no se notaría; el día que uno
cambie, se pintaría con las piezas del otro. `estrellasSVG(suf)` lleva
sufijo, igual que el beso.

**Y ponerle el sufijo rompió el dibujo, sin un solo error.** Se
renombraron los `id` de los degradés y quedaron sin tocar los dos
`fill="url(#estRosa)"` que los nombran: una referencia que no resuelve
no es un error en SVG, es un relleno vacío. El rosa y el plateado
salieron **blancos**, con el ribete y la sombra perfectos. Lo agarró la
captura, no la consola — las pruebas daban verde igual. Es *mirar que
el cambio haya ENTRADO*, y acá entró a medias.

#### Y una que nadie había medido: el nombre de otra clienta

Esta invitación salió copiando `almi15`, y el nombre de la clienta
anterior se quedó escrito a mano en **tres renglones**: el cierre, el
rótulo del mensaje y el aviso de datos. *"Un mensaje para Almi"* en la
fiesta de Ámbar. Se dibujaba perfecto, no tiraba ningún error, y lo
primero que ve la clienta es el nombre de otra.

Ahora esos tres salen de `CONFIG.quien` como todo lo demás (`.elNom`),
y lo cuida `pruebas/invitaciones.js`: ninguna invitación puede nombrar
a la clienta de otra. Se mira el HTML **sin los comentarios** —lo que
explica de dónde salió la pieza puede nombrar a la otra; lo que se
publica, no— y el borde de la palabra no es `\b` sino "ni letra ni
dígito", para que la carpeta `almi15` no cuente como nombrar a Almi.
Verificada rompiéndola a propósito: con el "Almi" del cierre puesto da
**1 falla**.

**La lección, que es la de siempre con otra cara**: hacer una
invitación nueva es copiar la anterior, así que lo que se queda viejo
no es el código — es el DATO escrito a mano en el renglón que nadie
vuelve a mirar.

#### Y después mandó la marca ya dibujada

*"Esto ponelo."* — un PNG con la A y la B en negro y oro rosa entre dos
alas de pluma, que es el emblema del cierre pero hecho como una pieza
terminada: las plumas con volumen y las letras con su biselado.

**Va en el cierre y reemplaza a la dibujada, pero la dibujada se
queda.** Se pone recién cuando el archivo cargó de verdad; si faltara
—o si el día de mañana alguien lo borra— queda la de siempre, que se
sostiene sola, y no un cuadrado roto donde va el emblema. Es lo mismo
que ya hacen la portada y las franjas, y es por lo que el `<img>` lo
crea el JS y no el HTML: un `<img>` con `src` vacío le pide al servidor
la página entera de nuevo, y eso no avisa.

**Y va SOLO en el cierre, no en todos lados.** Sus plumas son casi
blancas, así que se lee sobre el papel claro del final —con su sombra,
igual que la dibujada— y se perdería sobre las rayas de la bolsa, que
es claro también. En la bolsa y en la portada las alas siguen siendo
las dibujadas, que ahí van en negro. **Un emblema no se pone donde
entra: se pone donde se lee.**

Pesa **53 KB** en `.webp` a 820px de ancho, que es el doble de lo que
se dibuja en pantalla. El PNG que llegó pesaba 1,5 MB.

#### El sobre estaba revelado, y la bolsa de la fiesta

Dos cosas que marcó el dueño mirando la invitación publicada.

**1 · "El sobre ya está revelado. Eso está mal."** Y tenía razón por
partida doble. La carta asomaba por arriba del bolsillo con **el
nombre, "mis quince años" y la fecha a la vista**: el que llega ya leyó
la invitación antes de tocar nada, así que abrir el sobre no le muestra
nada nuevo — se gasta el único momento de sorpresa que tiene la pieza
antes de empezar. Y además era contradictorio: **el lacre dice sellado y
el papel afuera dice abierto.**

Esto *parece* contradecir lo que está escrito más arriba —que acá el
sobre está abierto porque así es la referencia— y no lo contradice: la
referencia es un sobre abierto **sin lacre**. Copiado el lacre encima,
las dos mitades se pelean. **Un detalle de una referencia no se puede
copiar solo: viene con lo que lo hace cierto.**

Se arregla como en `almi15`: **la carta vive DETRÁS de un cuerpo
opaco**. Adentro, cualquier parte que los pliegues no tapen se ve y hay
que acertarle al apilado; atrás no hay nada que tapar. El sobre pasó a
ser uno cerrado de verdad —la proporción de un C6, los cuatro pliegues
de la espalda y la solapa doblada hacia abajo con el lacre en su punta—
y al abrir la solapa se levanta sobre su bisagra de arriba.

**Y al salir la carta SIGUE DETRÁS del sobre**, que es lo que pasa de
verdad: lo que todavía está adentro queda oculto, y lo que se lee es la
parte que ya salió. Recién cuando empieza a volar pasa adelante. Son
dos saltos de `z-index` —la solapa cae, la carta sube— y ninguno de los
dos se interpola: se hacen con una transición de 0 s y retardo, el mismo
truco que ya costó una vuelta en `almi15`.
**Corolario del relleno**: la carta se centra contra lo que se VE de
ella, no contra su caja. Centrada en la caja entera, el último renglón
—la fecha— queda adentro del sobre todo el tiempo que dura el gesto.

**2 · La bolsa de la fiesta, de icono del regalo.** El dueño mandó una
foto de la bolsa a rayas con **"ÁMBAR FEST"** impreso: *"poné la primera
foto en donde dice regalos, como si fuera un icono"*.

**Va RECORTADA, sin el fondo de la foto.** Un recuadro ahí se lee como
una captura pegada en el medio de la tarjeta, no como un icono; y la
juntura de un rectángulo contra el papel rayado se ve a la legua. El
fondo se sacó con un relleno por inundación desde las cuatro esquinas,
que acá funciona porque el borde de la bolsa es negro y el fondo un
degradé parejo.
**Y la sombra no es adorno**: una bolsa rosa a rayas sobre un papel rosa
a rayas se funde con el fondo. Pesa **19 KB** en `.webp` a 420px; el PNG
que llegó pesaba 1,8 MB.
Como la marca del cierre, se pone recién cuando el archivo cargó de
verdad: si faltara, el bloque queda como estaba y no un cuadrado roto
arriba del título.

#### La canción, el cuenta atrás y el dress code sin colores

Tres cosas de una vez, con dos capturas y un video de referencia.

**1 · El dress code se quedó sin los colores.** *"Esos colores no van en
el dress code. Solo elegante."* Las muestras de rosa, negro y plateado
estaban debajo de "Elegante sport" como si fueran una instrucción, y la
clienta nunca dijo cómo quiere que se vistan —a eso contestó *"como
quieran"*—. Los tres colores siguen estando en toda la pieza: son la
paleta, los pompones del marco y las rayas. Lo que se fue es la fila de
cuadraditos, **y con ella el renglón que la explicaba**: "son una guía,
no una obligación" sin ninguna muestra arriba no se entiende de qué
habla. Y el dress code pasó a decir **"Elegante"**, no "Elegante sport".

**2 · El cuenta atrás, como la captura.** El "faltan…" en manuscrita y
las cuatro cifras **en una sola línea** separadas por dos puntos, con su
rótulo abajo. Antes eran cuatro fichas con sus esquinitas: cuatro
recuadros se leen como un tablero, una línea corrida se lee como un
reloj.
Dos cosas que no son de gusto: **el rótulo chico de la sección se fue**
—"Falta poco" arriba de "faltan…" dice dos veces lo mismo—, y **el dos
puntos se alinea con las CIFRAS y no con la caja**: su caja mide
exactamente el alto de una cifra, así que queda sobre la misma línea
aunque los días pasen a tres dígitos. Esa es justamente la falla que ya
está anotada para esta suite —*"469" pintado encima del dos puntos de al
lado*— y por eso acá el separador vive en el hueco entre casilla y
casilla, no pegado a un número.

**3 · La canción, con su reproductor.** El dueño mandó un video y una
línea: *"la música del video ese. No el video"*. El audio se sacó con
`ffmpeg`, normalizado y con un fundido de entrada de un cuarto de
segundo para que el bucle no haga clic.

**ARRANCA CON EL TOQUE QUE ABRE EL SOBRE.** Safari no deja sonar nada
sin un gesto de la persona, y ese gesto ya existe: no hay que inventarle
otro botón ni dejar la invitación muda esperando que alguien descubra el
play. Si el navegador se niega igual, el reproductor queda en "play" y
decide el invitado.

**SON TRES BOTONES Y LOS TRES HACEN ALGO.** La captura tiene cinco
—mezclar y repetir además— y con UNA sola canción esos dos no pueden
hacer nada: *un botón que no puede hacer su trabajo molesta más que no
estar*. "Anterior" y "siguiente" sí valen, porque con un solo tema los
dos vuelven al principio, que es lo que hace un reproductor de verdad. **La
línea con el corazón no es un control**: es el avance, y va con
`aria-hidden` y sin atajar el dedo.
*(Más abajo, en "El fondo de rayas": los cinco se dibujan igual que en
la captura, y los dos de los extremos son DIBUJO y no botones.)*

**Dos archivos y UNA sola descarga.** El `<audio>` lleva dos `<source>`:
AAC para el iPhone —que es donde están los invitados— y Opus para el que
no puede con ese formato. El navegador baja uno solo. Son 170 KB y 150 KB
en el repo, no 320 para la misma persona.
**Y hubo que ponerlo así para poder MEDIRLO**: el Chromium de las pruebas
no decodifica AAC, así que con un `src` suelto el reproductor se borraba
solo —que es lo que tiene que pasar cuando el archivo no sirve— y la
suite veía una sección vacía sin saber por qué. Con los dos `<source>`,
el error llega al elemento recién cuando fallaron TODAS las fuentes.
**Y el dibujo se AGREGA, no reemplaza**: con `innerHTML` se borraba el
`<audio>` que acababa de colgarse ahí adentro.

##### La canción no es nuestra, y eso queda escrito

Más arriba, para `facuymaxi/`, dice que **la canción no suena adentro de
la invitación** porque *"el archivo no es nuestro"*. Acá suena. La mitad
técnica de aquel motivo sigue en pie y se respeta —no hay ningún
reproductor de un tercero: la CSP no lo deja y además sería un tercero
corriendo código en la pantalla del invitado—, pero **la otra mitad no**:
el audio es una grabación comercial sacada de un video y queda publicada
en una dirección nuestra, que cualquiera puede bajar.

**Lo decidió el dueño y se le dijo.** Queda anotado para que nadie —yo el
mes que viene incluido— lo "arregle" sacándolo, y para que la próxima
invitación no copie el criterio sin saber que es una excepción: en
`facuymaxi/` el play LLEVA a escucharla y no suena, y ahí sigue siendo
lo correcto porque ellos no pidieron otra cosa.

#### El fondo de rayas, los cinco mandos y una sola vuelta

*"Pone ese fondo y usa el mismo reproductor y la misma frase. Y el audio
es el de este video. Que se reproduzca una sola vez. Después si quieren
repetirlo que toque el play."* — con la captura de la referencia, que es
el mismo reproductor sobre el **papel de rayas rosa** y no sobre negro.

**La sección pasó de la banda oscura al papel de rayas**, que es el
fondo de la portada y de la bolsa: no entra ningún fondo nuevo a la
pieza, se reusa el que ya existe (`.rayado`) con la tinta clara
(`.claro`), así que los rótulos, la filigrana y el arco toman solos su
color. Y lleva el **mismo velo claro de la portada**: una raya fuerte
detrás de una capitular espaciada es un texto que no se lee, y **eso el
medidor no lo mide** —mide el fondo, no el dibujo—.

**Los CINCO mandos se dibujan y TRES son botones.** Mezclar y repetir
están en la captura, pero con una sola canción —y sonando una sola vez—
no pueden hacer nada: van con `aria-hidden` y `pointer-events:none`, o
sea como adorno declarado, que es exactamente como el medidor de
contraste y el barrido saltean un dibujo. Se ve igual que la referencia
y no queda nada que se toque y no responda. Es la misma salida que ya
se había usado para el "15" en contorno de `mia15`.

**Suena UNA sola vez.** El audio deja de ir en bucle y, al terminar, se
**rebobina solo**: parado en el final, el primer toque del play no
sonaría — y eso no tira ningún error, sólo un botón que parece roto. El
`pause()` del final tampoco sobra: el navegador ya dejó el audio
parado, pero así el botón queda bien dibujado venga el final de donde
venga.

**Y un Ogg todavía sin bajar entero devuelve `Infinity` de duración**,
no un número: la cuenta del avance daba 0 para siempre y el corazón se
quedaba clavado a la izquierda. En el iPhone —que es donde están los
invitados— suena el AAC y la duración se sabe, así que esto no se veía
nunca desde acá.

##### El corazón salía cortado al medio, y el culpable era el telón

El corazón del avance se dibujaba **sin la mitad de arriba**: lo que se
veía colgando de la línea era media gota. No había ningún error, el
camino SVG estaba perfecto —montado solo se dibuja entero— y nada lo
tapaba.

Lo tapaba **el telón de `.ap`**, la animación de entrada: es un
`clip-path` recortado **a la caja del bloque**, y el corazón está
centrado sobre una línea de 2px pegada al borde de arriba, así que su
mitad superior caía fuera de la caja y desaparecía. Se arregla dándole
al bloque 9px de aire arriba —que no es aire: es lo que hace que el
corazón quepa—.

**La regla, que es pariente de la de `almi15`** (*el que se mira no
puede ser el que se esconde*): **el que recorta no puede ser más chico
que lo que tiene que mostrar.** Y la de siempre: se ve mirando, no
leyendo el código — el camino, los tamaños y las posiciones estaban
todos bien.

**Y volvió por CUARTA vez el selector `> *` que pisa un `absolute`.**
El velo nuevo obligó a subir el contenido con `#cancion > *
{position:relative}`, y eso le pisó el `position:absolute` a la
filigrana del corte: de capa pasó a ser una fila y se le montó encima a
"La canción". Ya había pasado con el encaje, con el marco y con el
beso. La regla exime a `.orna`.

Lo mide `pruebas/invitacion_mirar.js` con una comprobación nueva y
genérica —se saltea sola en una invitación sin canción—: que el audio
**no quede en bucle**, que al terminar **se rebobine** y que el botón
vuelva a decir "escuchar". El final se **fuerza**, porque en el camino
normal hay que esperar la canción entera. Contra el código anterior da
**3 fallas**.

#### El encaje, de borde de la cuenta regresiva

*"Podés ponerle el diseño de abajo a la fecha. Esa tela"* — con la
captura de una cuenta regresiva sobre el papel a rayas, con la tira de
**encaje negro** arriba y abajo.

**El encaje ya existía y no se veía nunca.** Es el de la portada, y la
portada se esconde entera desde que manda el afiche: una pieza
dibujada, medida y publicada que ningún invitado iba a ver. Ahora es el
borde de la cuenta regresiva, que además pasó al papel a rayas.

**Y el encaje REEMPLAZA al corte en curva, no se suma.** Son dos formas
de cortar y puestas juntas se leen como un error de maqueta: por eso
esta sección perdió su `arco` —y con él su filigrana, porque el encaje
es el remate— y **la de la canción también**. Con las dos puestas
quedaba la costura del arco justo encima de la tira y la filigrana
enterrada debajo del encaje: dibujada y tapada, que es lo peor de los
dos mundos.

##### Dos rayas finas que aparecieron por ser dos secciones rayadas

Ninguna de las dos existía antes, y las dos aparecieron por lo mismo:
**la sección de arriba pasó a ser rayada, así que lo que antes caía
sobre un fondo liso ahora cae sobre un dibujo que sigue del otro lado.**

- **El velo de la canción no llegaba a cero en su propio borde.**
  Estaba centrado en el 46% y con el radio corto, así que en su fila de
  arriba todavía valía un 22% de blanco: una raya clara de punta a
  punta, como si las dos mitades fueran de dos papeles distintos. Se
  arregla centrándolo y poniendo la parada transparente EXACTAMENTE
  donde cae el borde (50/78 = 64%).
- **El encaje del pie dado vuelta dejaba una fila oscura por encima.**
  `transform:scaleY(-1)` a secas deja el borde de arriba de la tira a
  medio píxel y Chrome pinta ahí una fila al 13%: medido, **28 puntos
  de escalón**. Con `translateZ(0)` la tira va en su propia capa y
  queda alineada a píxeles enteros — **escalón 0 ó 1**, medido en los
  cuatro anchos. No es un amuleto: se probaron seis variantes y sólo
  las dos que promueven la capa lo arreglan.

**Las dos se midieron con el píxel, no con el ojo.** Una fila de un
píxel al 13% no se ve en una captura de escritorio y sí en un teléfono,
y ninguna de las dos tira un error.

##### Y el papel a rayas también era un punto ciego de la suite

La comprobación del texto sobre un fondo dibujado buscaba `url(...)`, y
el rayado es un `repeating-linear-gradient`: o sea que **la portada, la
canción y ahora la cuenta regresiva no se medían con el píxel**, y el
medidor compartido las juzga contra `--papel`, ignorando la raya. La
raya cuesta **un punto** de contraste —medido: 5,82 → 4,87 para el gris
de los párrafos— así que hoy no escondía nada, pero el agujero es el
mismo. Ahora entra también el `repeating-gradient`, y con eso la suite
pasó de **55 a 74 renglones medidos** en ambar15, el peor en 5,49:1.
Verificado rompiéndolo a propósito —el contador en rosa claro— da
**4 fallas**, una por aparato, con el "162" a 1,10:1. Y verificado que
no inventa fallas en las otras: `almi15` y `facuymaxi` quedan limpias y
`mia15` informa sólo la suya de antes.

#### El pase VIP, de emblema de "dónde nos vemos"

*"Esto quiero que lo pongas como icono en donde va el icono de la
ubicación"* — una credencial VIP con su cintita, el moño, los dijes y
la marca AB entre alas, con "ÁMBAR FEST" y "VIP ALL ACCESS".

**Reemplaza al medallón de esa sección, y no se mete adentro del
anillo.** El medallón lleva un icono de línea de 42px, y una credencial
llena de brillantes a ese tamaño es una mancha —*lo que no se lee a 42
no va*, la lección que este archivo ya tiene escrita tres veces—. Va del
tamaño al que se LEEN las dos líneas de la tarjeta, que es lo único que
la hace valer la pena. La credencial además dice lo que la sección dice:
es la entrada a la fiesta.

**Va recortada, sin el fondo de la foto**, por lo mismo que la bolsa del
regalo: un recuadro oscuro en el medio del papel rosa se lee como una
captura pegada. Acá el recorte funciona porque la tarjeta tiene su borde
dorado y la cinta es rosa maciza, así que el relleno por inundación
desde las esquinas corta justo. Pesa **89 KB** en `.webp`; el PNG que
llegó pesaba 2,6 MB.

Y como la marca del cierre y la bolsa del regalo, **se pone recién
cuando el archivo cargó de verdad**: si faltara queda el medallón con el
pin dibujado, que se sostiene solo.

#### El sobre con alas, y el papel que se cortaba

*"Me gustaría que el sobre sea algo así. Que se abra y que corrijas
cuando aparezca el papel porque queda medio cortado lo que dice y la
transición mejórala."* — con una referencia de sobre rosa con alas de
pluma blancas, su lacre y la carta asomando.

**De la referencia NO va el logo**: es el de Victoria's Secret, marca
registrada, y vale lo de siempre —una invitación publicada con el logo
de otro es un problema nuestro—. Va el monograma AB. **Y la carta
asomando tampoco**: eso ya se sacó una vez, por pedido del dueño, y está
contado arriba en *"El sobre estaba revelado"*.

**Las alas tuvieron que REDIBUJARSE.** El ala que había es la del
monograma, dibujada para 60 o 70 píxeles; en el sobre mide tres veces
eso y a ese tamaño una silueta lisa se lee como un **pétalo**. Se probó
subirla, abrirla y ponerle una segunda capa corrida —dos hileras de
plumas por el precio de un `use`— y no alcanzó: lo que falta no es
cantidad, es que **tenga plumas**.

La nueva son tres hileras que salen del mismo hombro, la de afuera
larga y las de adentro cortas. Tres cosas, y las tres se vieron
mirando:

- **La punta va REDONDEADA.** En aguja, el dibujo se lee como un
  abanico de cuchillas.
- **El hombro lleva una mancha** que tapa donde convergen las plumas;
  sin ella se ve el pico de la convergencia. Y va CHICA: grande y
  blanca, asomando por arriba del sobre, se lee como dos huevos.
- **La postura es la mitad del asunto.** El barrido hacia arriba es lo
  que las vuelve alas; apoyadas de costado son dos hojas. Costó seis
  vueltas acertarle al par ángulo/altura que además **entra en la
  pantalla**: hay una medición que falla si se salen, porque un ala
  cortada contra el borde se lee como un error de maqueta.

Va de **símbolo, y el HTML sigue apuntando al ala chica**: sin JS
quedan las de siempre, que es el estado bueno.

##### El papel se cortaba, y no era la escala: era la CAJA

La carta volaba hasta `(ancho de pantalla / ancho de la carta) × 1,7`,
o sea que se salía por los dos costados **justo cuando más se lee** —
medido, 165px afuera—. Ahora el tope sale de la caja de verdad contra
la pantalla de verdad, con 18px de aire a cada lado, y nunca baja de
1,25: con menos no se lee como que la carta se acerca.

Y la transición es más larga y más suave (1,5 s con una curva que
desacelera, el fundido entrando a los 0,22 s en vez de 0,3), así que la
portada se ve aparecer alrededor de la carta en vez de debajo de ella.

**Lo mide la suite por la CAJA, no por la escala**: el ancho de la
carta cambia con el aparato, así que una cota sobre `--esc` no dice
nada. Mientras la carta se ve, su caja no puede salirse de la pantalla.
Verificada rompiéndola a propósito —el cálculo anterior— da **1 falla**,
*"la carta SE SALE 165px de la pantalla"*.

#### Las alas dibujadas se cayeron: el emblema es SU logo

*"Fíjate que el sobre nada que ver. Además las alas están feas y al
revés. Presta atención a los detalles. Por otro lado la carta está
desfasada. No está centrada. Y ese logo que hiciste es horrible. Pone
el logo de la última foto."* Y después, con dos recortes del lacre y
de la carta: *"Debes cambiar ese logo por los dos AB."*

Las alas de la vuelta anterior estaban **al revés de verdad, no de
gusto**: el dibujo sale de un hombro abajo a la derecha y barre hacia
arriba, pero el CSS les ponía `rotate(-40deg)`, que es **antihorario**,
o sea que les sumaba cuarenta grados y las pasaba de la horizontal
hacia el piso. Y los dos hombros caían juntos en el centro, así que lo
que se veía no eran dos alas: era un moño. Se dibuja perfecto y está
mal, que es la familia de siempre.

**Y la lección más cara es la otra: el dibujo no hacía falta.** El logo
de la fiesta —la A y la B entrelazadas, con su corona, entre dos alas—
ya existía, es de ella, está en su afiche y en el empapelado, y el
dueño lo tenía a mano. Nosotros estábamos aproximándolo a mano, seis
vueltas de plumas, para terminar con algo que no se le parece. **Antes
de dibujar una pieza de la marca de un cliente: preguntar si la
tiene.**

Así que el emblema del sobre es el logo recortado (`fotos/logo.webp`,
88 KB), y las alas dibujadas quedan de respaldo —con el giro
corregido—: si el archivo falta no queda un cuadrado roto. Es lo mismo
que ya hacen la marca del cierre, la bolsa, el pase VIP y la bata.

**Va ARRIBA del sobre y no detrás**, que es lo que haría la
referencia. El motivo es de geometría: en su logo las alas vienen
pegadas a las letras, así que agrandarlo hasta que flanqueen el sobre
deja un monograma **más alto que el sobre entero**. Arriba, entero y
apenas más ancho que el sobre, se lee de una y las alas igual asoman a
los costados. El margen negativo lo pega al sobre: separados son dos
piezas sueltas.

**Y el fondo dejó de ser las rayas.** Acá estaba escrito que el sobre
vivía sobre las rayas "porque son las de la portada" — y eso dejó de
ser cierto el día que la portada pasó a ser el afiche que mandó el
dueño, cuyo fondo es un rosa fuerte. Encima el logo es rosa PÁLIDO:
sobre las rayas claras no estaría. Ahora el fondo es ese mismo rosa
(`#C85075`) con la luz de estudio de la referencia, y el que abre
sigue sin cambiar de mundo — ahora de verdad.
**Los dos rótulos del sobre hay que medirlos A MANO**: su fondo es un
`:before`, o sea un pseudoelemento, que ningún `querySelectorAll`
devuelve, así que el medidor los juzga contra el negro del `body` y da
verde mire lo que mire. Medido con el píxel sobre la captura: en crema
daban 3,2:1 y por eso van en blanco puro (3,7:1 y 4,2:1).

##### El monograma de la carta y el del lacre son el suyo, recortado

Los dos AB que señaló son los dos lugares donde el monograma se ve
chico. Ahí **las alas no entran** —en un lacre de 62px serían dos
manchas—, así que va una segunda pieza: el mismo logo **sin alas y en
rosa hondo** (`fotos/sello.webp`, 17 KB), que se lee tanto sobre el oro
rosa del lacre como sobre el papel crema de la carta. Una sola
descarga para los dos: el segundo es un clon.

**Recortarle las alas a una imagen no es recortar un rectángulo.** Las
alas pasan POR DETRÁS de las letras, así que no hay un corte vertical
que las separe; lo que sí hay, mirando el alfa fila por fila, es un
HUECO entre donde termina el ala y donde empieza la letra, y ese hueco
se mueve con la altura. El recorte es una frontera por tramos sacada de
esa medición, y después se tiran las islas sueltas que quedan —las
puntas de pluma que caían del lado de adentro— quedándose sólo con las
dos grandes: las letras y la corona.

##### Y el monograma dibujado perdió la Z

El de texto sigue existiendo, porque es el respaldo de los dos
anteriores, pero ahora es **A + B**. Acá estaba escrito —y bien medido—
que la Z en manuscrita era la lazada que dejaba leer tres capitulares;
lo que estaba de más era la decisión: **el logo de la fiesta no tiene
Z**, nunca la tuvo, y el monograma de la pieza tiene que ser el de
ella. Es la misma lección que la de las alas, en chiquito.

##### La carta estaba desfasada porque el relleno era para otra escena

El texto de la carta vive arriba a propósito: mientras ASOMA del sobre,
lo que se ve es sólo su parte de arriba, y centrado en la caja entera
el último renglón queda adentro. Eso es cierto durante el asomo **y
deja de serlo en cuanto vuela**: afuera se ve la carta entera, y el
texto arriba con medio papel en blanco abajo se lee como una tarjeta
mal armada. Ahora el relleno de abajo se va con el vuelo, en el mismo
tiempo que la escala, así que el texto se acomoda al medio mientras
crece. **Un valor que es correcto en una escena no lo es en la
siguiente: si la escena cambia, el valor se anima con ella.**

##### Y al final de la transición quedaba una capa pegada

*"Tenés que ver que al finalizar la transición no queda bien."* Y no
quedaba: mientras el papel del sobre se deshacía y la portada se
encendía, **el logo y el beso seguían OPACOS encima de ella** —el
monograma alado estampado sobre la foto de Ámbar y los labios
flotando en una esquina— hasta que el sobre entero se sacaba de un
saque. Lo que tendría que leerse como un cruce se leía como dos capas
mal superpuestas y un corte al final.

**El motivo es de bulto: las dos capas eran NUEVAS y no estaban en la
lista que se funde.** El sobre apaga sus piezas con una enumeración
de selectores, y el logo se agregó la vuelta anterior sin entrar ahí;
el beso nunca había estado. Se dibuja perfecto y está mal, que es la
familia de siempre. **Lo que entra con el sobre se va con el sobre.**

**Y lo que lo cuida NO es la lista**, porque fue justamente una lista
la que se quedó corta. `pruebas/invitacion_mirar.js` recorre ahora
todos los descendientes del sobre mientras la portada ya está más de
la mitad encendida y se queda con el más opaco, midiendo la opacidad
**efectiva** —multiplicada por la de todos sus padres—; cuenta sólo
al que PINTA algo propio (un fondo, una imagen, un dibujo o su
texto), así que un contenedor vacío no inventa una falla, y saltea la
carta, que vuela sola. Verificada rompiéndola a propósito: con el
logo sin fundido da **1 falla**, *"algo del sobre se queda OPACO
sobre la portada: 1.00 en «IMG» con la portada en 0.66"*.

**Y encontró la misma falla en una invitación ya publicada**:
`facuymaxi/` dejaba pegados los dos renglones del sobre y su botón,
exactamente igual. De paso, el tope de la carta de `almi15/` era el
cálculo viejo, así que **se salía 159px de la pantalla** justo cuando
más se lee — que es el *"queda medio cortado lo que dice"* que el
dueño ya había marcado en ambar15, sin arreglar en la de al lado.
Las dos se arreglaron con esto. Es la lección de siempre: **una
trampa que se arregla en un lugar hay que ir a buscarla a los otros**,
y una medición nueva se corre contra TODAS las invitaciones, no sólo
contra la que la motivó.

##### Y lo que la carta lleva adentro se va antes que la carta

*"El problema está en que en la transición se agranda ese logo y queda
mal cuando desaparece."* La carta crece hasta **1,7x** mientras vuela,
y lo de adentro crece con ella: el AB del lacre —lo único oscuro y
macizo que lleva— llegaba a **34,8px, OPACO, con la portada ya en
1,00**, y recién ahí desaparecía de golpe. Agrandado un 83% encima del
afiche, que tiene su propio empapelado de monogramas, no se lee como
un sello: se lee como una mancha.

**Se va primero**, en 0,24 s, apenas arranca el vuelo: mientras se ve,
crece un 24% y no más. El texto de la carta sí se queda —es lo que se
lee mientras se acerca, y para eso se le animó el relleno de abajo—;
el AB ya hizo su trabajo en el lacre.

**La regla, que es pariente de las otras dos del sobre** (*lo que entra
con el sobre se va con el sobre*, *lo que se mueve no puede ser lo que
se esconde*): **lo que viaja adentro de algo que se agranda también se
agranda**, y un dibujo macizo agrandado y medio transparente encima de
otra cosa es una mancha, no una transición.

Lo mide `pruebas/invitacion_mirar.js`: mientras la portada ya está más
de la mitad encendida, el emblema de la carta no puede seguir a la
vista, y la falla dice cuánto creció. Se saltea sola en una carta sin
emblema. Contra el código anterior da **1 falla**: *"el emblema de la
carta sigue a la vista sobre la portada: opacidad 1.00 y 36% más
grande, con la portada en 0.66"*.

#### La bata, de emblema de "para la noche"

*"Donde dice para la noche y está el icono quiero que lo cambies por la
primera imagen"* — una bata de raso a rayas rosas, con su ribete negro
y su moño.

**Reemplaza al medallón de la percha**, igual que el pase VIP y el
afiche de la fecha, y por el mismo motivo: un icono de línea de 42px no
es lo que se pidió. Va del tamaño al que se leen las rayas, el ribete y
el moño.

**Acá no hubo nada que recortar**: vino ya con fondo transparente, así
que lo único que se le hizo fue sacarle el aire de alrededor. Se
comprobó que no trajera motas sueltas —una sola isla opaca en todo el
archivo— y pesa **27 KB** contra 1,4 MB del PNG.

**Y no lleva sombra, al revés que la bolsa del regalo.** La bolsa es
rosa sobre papel rosa y sin sombra se funde; la bata cae sobre la banda
oscura, donde el rosa claro se despega solo. *Un emblema no se pone
donde entra: se pone donde se lee* — y cómo se lo prepara depende de
sobre qué cae.

Como las otras tres piezas que mandó ya hechas, **se pone recién cuando
el archivo cargó de verdad**: si faltara queda el medallón con la
percha dibujada, que se sostiene sola.

#### El empapelado de "¿Venís?"

*"Esto es para la parte del ¿Venís?"* — el monograma alado repetido
sobre el rosa, como un papel de pared.

**Va de a BALDOSA, no la imagen entera estirada.** Probado y
descartado: una foto de 1024x1536 puesta a `cover` en una sección tan
larga como un formulario escala los monogramas a 300px, y lo que se ve
no es un empapelado — son dos alas gigantes detrás de las letras.

**Y la baldosa no es un recorte de la captura.** Sus bordes no
coinciden —la luz de la imagen cae de un lado—, así que repetida deja
una raya cada pantalla. Se recortó UN monograma, se lo fundió contra el
rosa plano con un velo radial, y se lo plantó **cinco veces** en la
baldosa: al centro y en las cuatro esquinas. Eso es un *medio paso*
seamless — las filas salen corridas la mitad, igual que en la captura, y
no queda un solo borde que empalmar. Pesa **15 KB**.

**El formulario NO va sobre el empapelado: va sobre una tarjeta negra.**
Dos motivos y ninguno es de gusto. Uno, el texto: todo lo de adentro
está escrito para la banda oscura y sobre el rosa no se leería nada.
Dos, el MEDIDOR: la tarjeta es un color **macizo** y no un degradé,
porque un degradé opaco de punta a punta es un bloque que la suite no
puede medir — la misma decisión que ya está escrita para el panel de la
página pública.

##### Y la tarjeta se puso TRANSLÚCIDA, para que se vea el empapelado

*"A este formulario deberías ponerlo con transparencia así se ve el
diseño de abajo"*, mirándola publicada. El empapelado estaba y la
tarjeta negra lo tapaba entero justo donde más superficie hay.

**La tarjeta no se puede sacar** —todo lo de adentro está escrito para
la banda oscura y sobre el rosa no se leería nada—, pero sí dejar pasar
luz: queda en `rgba(20,11,16,.78)`. **El número no es a ojo**: la
tarjeta es casi negra, así que la transparencia cuesta poquísimo
contraste. Medido contra el píxel MÁS CLARO del empapelado —que es casi
blanco— el peor texto da 6,4:1 en la cuenta, y con el píxel de verdad
la suite informa **55 renglones y el peor en 5,5:1**.

**Y lo que lo cuida de acá en adelante no es esa cuenta.** Translúcida,
la tarjeta deja de ser un fondo opaco, así que el medidor compartido la
atraviesa y cada renglón del formulario pasa a medirse CON EL PÍXEL
contra lo que de verdad quedó atrás. El día que se aclare el empapelado
o se suba la transparencia, la suite lo dice sola. Verificado
rompiéndolo a propósito: con la tarjeta sin fondo da **4 fallas**, una
por aparato, y el "¿Venís?" en 1,08:1.

El filete de afuera subió de `.08` a `.16`: translúcida, la tarjeta se
funde con el rosa en los bordes y deja de leerse como una tarjeta
apoyada encima.

###### Y el `<details>` cerrado volvió a morder, ahora en el medidor del píxel

Apenas se puso la transparencia la suite informó **cuatro renglones a
1,13:1** en los cuatro aparatos, y los cuatro eran del aviso de datos
—*"Lo que ponés se usa solo para organizar la fiesta"*, *"voluntario"*,
*"la familia de Ámbar"*—. Su color es `#E8CBD6` y se lee perfecto: con
el `<details>` abierto a propósito, esos nueve renglones miden **5,5:1**
como todos los demás.

Lo de adentro de un `<details>` cerrado **no está dibujado**, pero en
Chrome tiene caja igual: el navegador lo esconde con
`content-visibility`, no con `display:none`, para que el buscador de la
página lo encuentre. Así que la comprobación comparaba el color de un
texto que no se pinta contra el píxel de lo que hubiera abajo.

**Es la MISMA trampa que esta suite ya tenía escrita y resuelta** para
la comprobación de los controles tapados, aplicada a la mitad de las
comprobaciones. Es la regla de la caja de 0x0 otra vez: *antes de medir
algo, comprobar que ESTÉ*. Y la lección que deja: una trampa que se
arregla en un lugar hay que ir a buscarla a los otros, porque el que la
descubre es el que la escribió y no vuelve a pasar por ahí.

Verificado que el arreglo no la deja ciega: con la tarjeta sin fondo
sigue dando las 4 fallas.

##### Una sección empapelada es un PUNTO CIEGO de la suite

Y es la lección que deja esto. El medidor compartido sube por el árbol
hasta el primer `background-color` opaco y, si ese mismo elemento trae
además un `url(...)`, **el número que informa es el del color y no el
del dibujo**. O sea que cualquier texto apoyado sobre un fondo dibujado
da verde mire lo que mire. Comprobado: con el formulario entero cayendo
sobre el rosa fuerte —1,1:1, o sea que no estaba— la suite seguía
diciendo *"sin fallas"*.

Ahora `pruebas/invitacion_mirar.js` lo mide **con el píxel**, igual que
el texto sobre la foto de la portada, y sólo donde hace falta: un
renglón que tenga entre él y la sección un ancestro con fondo opaco
propio ya lo midió bien el medidor compartido y se saltea. Lo que queda
es exactamente lo que se apoya sobre el dibujo. Contra el código
anterior —con la tarjeta sin su fondo— da **4 fallas**, una por aparato.

**Y la primera versión de esa comprobación no medía lo que importaba.**
Sacaba una captura POR RENGLÓN y cortaba en 24 para no tardar una
eternidad — y los 24 primeros caían todos en las secciones de arriba,
así que el formulario, que era justo el que estaba en riesgo, no se
medía nunca. Daba verde con el texto sobre el rosa. Ahora es **una
captura por PANTALLA**: se baja de a 85% de la ventana y se miden todos
los renglones que entran enteros. Es la regla de siempre —*una prueba
que pasa siempre no prueba nada*— con un tope de tiempo de disfraz.

#### El reloj de arena sobraba

*"Ese icono queda feo. Sácalo"*, mirándola publicada: el medallón del
reloj de arena, arriba de la cuenta regresiva.

Tenía razón y el motivo se puede decir en una línea: **un reloj de
arena dibujado arriba de un reloj que corre dice dos veces lo mismo, y
el de verdad es el que está abajo.** En las otras secciones el medallón
es lo único que anuncia de qué habla el bloque antes de leerlo; acá el
bloque ES un reloj andando, así que el dibujo no anuncia nada y encima
le compite al dato, que es lo único que se mira.

Se saca quitándole el `data-ico` a esa sección —el medallón lo pone el
JS para cualquiera que lo lleve— y el icono, que quedaba sin usar, se
fue de la tabla. **La canción y el cierre ya estaban así**, cada uno
por el mismo motivo: donde el bloque trae su propio emblema (el
reproductor, la marca), un medallón arriba son dos emblemas apilados.

#### El afiche de "guardá la fecha"

*"Este ponelo en el icono de guardá la fecha"* — un afiche de "ÁMBAR
FEST 2027" en negro sobre rosa, con el monograma alado y su corona.

**Reemplaza al medallón del calendario**: un afiche que dice el nombre
de la fiesta y el año ES guardar la fecha, así que va donde estaba el
icono de línea. Abajo quedan "Anotalo · Guardá la fecha", el mes de
abril con el 10 marcado y el horario.

**Acá NO se recorta, al revés que el pase VIP y la bolsa.** Su tinta es
NEGRA y la banda de esta sección también: sin su papel rosa no quedaría
nada a la vista. Se apoya como un afiche impreso sobre la banda oscura,
con la esquina apenas redondeada y su sombra, que es lo que lo despega
del fondo. Es la regla de siempre vista al revés: **un emblema no se
pone donde entra, se pone donde se lee** — y cómo se lo prepara depende
de sobre qué cae, no de lo que se hizo la vez anterior.

Pesa **21 KB** en `.webp`; el PNG que llegó pesaba 1,1 MB. Y como las
otras tres piezas que mandó ya hechas, **se pone recién cuando el
archivo cargó de verdad**: si faltara queda el medallón con el
calendario dibujado, que se sostiene solo.

#### La portada es un afiche, y el afiche manda

*"Esta va a ser la portada."* — una pieza ya terminada: la foto de ella
sobre un rosa fuerte, "ÁMBAR · MIS XV AÑOS" en una didona cromada y el
monograma alado con su corona.

**Con el afiche puesto, la portada no vuelve a decir nada de eso.** El
nombre, el hilo, el renglón de abajo, las alas, el óvalo, el encaje, el
marco y el beso se esconden: repetirlos sería decir dos veces lo mismo,
una de ellas con otra letra. Lo único que queda encima es el "Deslizá".

**Va ENTERO, no recortado.** El afiche es 3:4 y un teléfono es 9:19.5:
recortándolo para llenar la pantalla se le van las dos puntas de
"ÁMBAR" y la mitad del monograma. Y el ancho sale del ALTO que queda,
no de un porcentaje del ancho — la misma regla que la ficha de celular
del carrusel del sitio—, porque medido por el ancho, en una pantalla
baja el pie del afiche cae abajo del borde. Y sin esquinas
redondeadas, que ahí dibujarían cuatro esquinitas rosas donde no hay
ningún borde.
**Como nunca tiene la forma del teléfono, SIEMPRE queda una banda**, y
qué se pone ahí depende del BORDE del afiche. Con el primero, que
tenía el fondo plano, alcanzaba con el mismo rosa sacado de sus
esquinas y el afiche iba centrado. Con el de ahora no: está más abajo,
en *"La foto nueva, y la banda que tuvo que aprender a dibujar"*.

**El nombre no se borra: se esconde.** Es el `h1` de la página y lo que
el afiche dice lo dice DIBUJADO — un lector de pantalla no lee una
imagen. Queda de 1x1 con `clip-path`, a la vista de nadie y presente
para quien lo necesita.

**Y si el archivo falta, no queda una pantalla vacía**: no se pone la
clase y vuelve la portada tipográfica entera, que se sostiene sola. Es
lo mismo que ya hacen la marca del cierre, la bolsa y el pase VIP, y por
eso el `<img>` lo crea el JS y nunca el HTML.
**La foto del óvalo se pide RECIÉN si el afiche no vino**: con el afiche
puesto el óvalo está escondido, así que bajarla igual son 29 KB que el
invitado paga por una foto que no va a ver nunca.

Lo mide `pruebas/invitacion_mirar.js` con una comprobación nueva, y las
dos mitades: con el afiche, que cargue, que entre entero en la pantalla
y que **el nombre no se escriba dos veces**; y sin él —forzado con un
404, porque en el camino normal no se recorre nunca— que no quede un
cuadrado roto, que no se quede en modo afiche y que el nombre vuelva a
la vista. Verificada rompiéndola a propósito —poniendo la clase y el
`<img>` sin esperar a que cargue— da **3 fallas**.

#### La foto nueva, y la banda que tuvo que aprender a dibujar

*"Necesito que cambiemos esta foto para la portada. Ajústala y que
quede bien."* — el mismo afiche con otra foto, y con una diferencia que
cambia todo: **el empapelado le llega hasta el borde.** El anterior
tenía el fondo plano, así que las bandas de arriba y abajo con ese
mismo rosa desaparecían. Acá el relleno plano deja una juntura a lo
ancho de la pantalla: el dibujo arranca de golpe.

Son tres decisiones y ninguna es de gusto:

- **El afiche se apoya ABAJO y va a todo el ancho.** Medido, su borde
  de arriba es un rosa parejo (±8 a lo ancho) y el de abajo es la
  remera y el pelo. Así que todo el sobrante va arriba, donde un
  relleno puede pasar desapercibido, y la figura termina en el borde
  de la pantalla: una figura que sale por abajo se lee como algo
  pensado, y cortada contra una banda se lee como una foto pegada en
  el medio.
- **La banda CONTINÚA el empapelado, con una baldosa recortada del
  propio afiche.** Los períodos se midieron comparando parches, no a
  ojo: **325 x 351**. Se corta un período exacto de una zona limpia y
  se lo **rueda 70px** para que su borde izquierdo caiga en la misma
  fase que el borde izquierdo del afiche; va colgada del borde de
  arriba del afiche (`bottom:100%` + `background-position:left
  bottom`), así la fase sigue enganchada sea cual sea el alto de la
  pantalla. El `29.926%` es `325/1086`: escrito como fracción del
  ancho del afiche, la trama se dibuja siempre a su misma escala.
  Pesa **7,5 KB**.
- **La baldosa del formulario NO servía**, y es lo primero que se
  probó: es el mismo dibujo, pero con otra escala, otro rosa y su
  propio viñeteado, que a este tamaño deja los cuadrados a la vista.
  Mismo monograma no es misma trama.

**Y volvió el selector `> *`, por QUINTA vez.** La flecha de "Deslizá"
tenía que pasar a `position:absolute` para no empujar al afiche hacia
arriba —y devolver la banda que vinimos a sacar—, y
`#portada > :not(.encaje):not(.marco):not(.beso)` le ganaba en
especificidad y la dejaba en `relative`: ahí un `bottom` no ancla
abajo, **sube el elemento**, que es exactamente la trampa ya escrita
para `mia15`. Se arregla eximiéndola de esa regla y dándole su propia
`position:relative`, como ya estaban el encaje, el marco y el beso.
De paso la flecha cambia de color: cae sobre la ropa oscura y el negro
de siempre ahí no existe.

##### La juntura se mide por la TEXTURA, no comparando dos filas

La primera versión de la comprobación restaba la fila de arriba contra
la de abajo del borde, y **daba MENOR diferencia con la banda rota**
(4,9) que con la trama puesta (9,3): el borde del afiche también es
liso, así que dos filas pegadas son casi iguales en los dos casos — el
dibujo empieza unos píxeles más abajo. Lo que se ve es **plano arriba
contra dibujo abajo**, así que se mide el desvío de la luminancia en
una franja de 70px a cada lado y se compara. Con la trama da **0,50**;
con la banda plana, **0,06**. El tope quedó en 0,25.

Se saltea sola donde no aplica: sin banda, o con un afiche de borde
liso —que es justamente el caso del afiche anterior, donde la banda
plana era la respuesta correcta—. Verificada rompiéndola a propósito:
con la banda sin su trama da **1 falla**.

#### Lo que quedó debajo del afiche

Dos cosas de la vuelta anterior quedaron hechas y **no se ven**, porque
el afiche llegó después y las reemplaza. No son un sobrante: son la
portada tipográfica, que es a donde cae todo si el archivo falta.

- **El nombre pasó de la manuscrita a CAPITULARES espaciadas**, que es
  la forma de una etiqueta de perfume: "ÁMBAR" grande y "XV AÑOS" chico
  debajo son un solo bloque que se lee *"Ámbar XV años"*. Se probaron
  cinco familias mirándolas (`pruebas/letras.js`) y la mejor era la
  **Bodoni Moda** — pero va la **Playfair**, que ya está cargada para
  los títulos: bajarle a cada invitado una familia entera por un texto
  que sólo aparece si el archivo falta es peso regalado.
- **Las tres estrellas apiladas** que había pedido con una captura —la
  de atrás en animal print, la del medio rosa y la de adelante plateada,
  los tres colores que mandó la clienta—. Van dibujadas y no es la
  imagen de la referencia: una imagen de la que no sabemos la licencia
  no se publica. Están donde estaba el moño, que salió de ahí porque ya
  está en los cuatro cortes, en el sobre y en tres iconos, y dos adornos
  apilados entre el óvalo y el nombre se leen como un error de maqueta.
  **Ponerlas encima del afiche no se hizo a propósito**: el afiche es un
  diseño cerrado y pegarle estrellas arriba lo arruina.

**Y un animal print chiquito se lee como una VACA.** Costó seis vueltas
y la lección es la de siempre —se ve mirando, no leyendo el código—:
manchas macizas dan vaca; rayitas sueltas dan granos de arroz. Lo que lo
vuelve leopardo son tres cosas juntas: el anillo ROTO (dibujado con UN
círculo punteado, no con cuatro elipses sueltas, que se separan), el
centro del anillo TEÑIDO un tono más hondo, y las rosetas repartidas en
una **grilla sacudida** y no al azar puro —al azar se amontonan de un
lado y media estrella queda lisa—. Y el print va en negro sobre rosa
claro, no en marrón: el marrón sería un cuarto color en una paleta de
tres.
**Y la composición importaba más que el dibujo**: la estrella de atrás
estaba tapada en un 80% por las otras dos, así que su print no se veía
por fino que se dibujara. Separadas, se lee.

#### El teléfono de la madre la daba vuelta entera

La clienta avisó que la invitación *"sale así"* en el teléfono de la
madre, y que **a todos los que se la manda les sale igual**. Esa
segunda mitad es la que dice qué pasa: si le pasara a un solo aparato
sería una configuración suya; si le pasa a todos, es la pieza.

Es el **modo oscuro de Android**. Cuando una página no declara de qué
color es, Chrome en Android y Samsung Internet le **invierten la
luminosidad a todo**, y el tema oscuro del sistema viene prendido en
casi todos los teléfonos. Reproducido acá y medido: el papel rosa a
rayas sale **marrón oscuro**, el **encaje negro sale blanco**, el sobre
sale bordó y el texto queda lavado. **No tira ningún error**: la
invitación se dibuja perfecta y equivocada.

**Las fotos no se invierten** —el modo oscuro no las toca— y eso es lo
que lo hace difícil de ver: la portada de Ámbar es el afiche, o sea una
imagen, así que la primera pantalla se ve bien y lo dado vuelta empieza
al segundo scroll. Es la misma familia de siempre: *se dibuja perfecto
y está mal*.

Se apaga con una línea, `<meta name="color-scheme" content="only
light">`, que quiere decir *"esta pieza es clara y así va"*. **No
cambia nada de lo que vemos nosotros**: lo único que hace es sacarle al
navegador el permiso de adaptarla.

**Está puesto en las ocho invitaciones y en los seis listados** (y en
la plantilla), no sólo en la de Ámbar: es la regla de siempre —*una
trampa que se arregla en un lugar hay que ir a buscarla a los otros*—.
Medido una por una, lo que el teléfono les cambiaba: `juliayfranco`
**100%**, `mia15` 50%, `ambar15` 44%, `almi15` 40%, `magali15` y
`facuymaxi` entre 3 y 10%.

**Y está puesto también en la página pública y en las dos apps**
—`index.html`, `invitaciones.html`, `muro.html`, `rollo.html`,
`404.html`, `privacidad.html`, `terminos.html` y `empezar.html`—, que
tenían lo mismo: `/` cambiaba **28,8%**, que es donde cae el tráfico
pagado, y `/muro?demo=1` un 8,9%. El único que NO lleva la línea es
`app.html`, que es una redirección y no dibuja nada.

**Lo que no se puede arreglar desde acá son Key y Xiomara**, que viven
en Netlify: son documentos de otro, el modo oscuro los da vuelta y
nosotros no podemos declararles nada. Se ven dados vuelta adentro de
la galería de `/invitaciones` y del inicio, en un teléfono con el tema
oscuro puesto. Lo arregla traer sus carpetas al repo, que ya estaba
pendiente por otro motivo. Por eso la prueba las **reemplaza por un
marco quieto**: midiéndolas estaría midiendo a Chrome y no a nuestra
página.

**Lo mide `pruebas/invitacion_mirar.js`, y mide el EFECTO y no la
etiqueta**: dibuja la invitación dos veces —normal y con el modo oscuro
automático pedido por CDP, que es el mismo que aplica el teléfono— y
compara los píxeles. Así da igual cómo esté apagado. Dos cosas que
costaron una vuelta cada una:

- **Mirando sólo la primera pantalla daba 0%** con la invitación dada
  vuelta de la mitad para abajo, porque arriba hay una foto y las fotos
  no se invierten. Se mide la pieza entera, pantalla por pantalla.
- **Y no se puede sacar una captura `fullPage`**: para eso el navegador
  le cambia la medida a la ventana, y **eso borra el modo oscuro que
  acabamos de pedir**. Medido: con `fullPage`, 0% de diferencia con la
  página rota; de a pantallas, 43,5%. Es la caja de 0x0 otra vez — la
  medición apagaba sola lo que venía a medir.

Verificado sacando la línea a propósito: con el `meta` puesto da
**0,0%** y sin él **43,5%**, contra un tope del 4%.

##### Y seguía pasando: Samsung Internet no mira lo mismo que Chrome

Con el arreglo ya publicado, la clienta volvió a avisar que la madre
la seguía viendo mal. Se comprobó primero lo obvio: se bajó
`clicketerno.com.ar/ambar15/` desde acá y el archivo que sirve
Cloudflare es **idéntico** al del repo, con la línea puesta. O sea que
no era el caché.

**El modo oscuro de Chrome y el de Samsung Internet no son el mismo**,
y no se apagan igual. Samsung —que es el navegador que viene en los
Android de Samsung— repinta, según su propia documentación, las
páginas **que no declaran tener versión oscura**. Con `only light` le
estábamos diciendo exactamente eso: *no tengo versión oscura*. Lo que
apagaba a Chrome era lo que lo encendía a él.

Así que se declara al revés: `content="light dark"` más un bloque
`@media (prefers-color-scheme: dark)` — **esta pieza sabe de oscuro, y
su versión oscura es la misma**. Declararlo y no cambiar nada es
exactamente lo que queremos: el papel es papel.

**Y eso NO es gratis en cualquier pantalla, así que se midió una por
una.** Con `light dark` el navegador usa el esquema oscuro para los
controles que dibuja ÉL —campos, listas, barras—, y eso sí se ve:
medido, el **tablero del listado cambia un 3,4%** y
**`/invitaciones` un 14,7%**. Por eso el cambio es sólo para las
invitaciones, donde da **0,0%** en las nueve (el peor, `claraybruno`,
0,6%); los listados, la página pública y las dos apps se quedan en
`only light`, que ahí está medido y alcanza.

**Lo que no se puede medir desde acá es Samsung**: no hay un Samsung
Internet en esta máquina. Lo que sí se mide es que declararlo no rompa
nada, y eso es lo que mide la suite: la invitación tiene que verse
igual **con el tema oscuro del sistema puesto** —que es lo nuevo,
porque ahora decimos que lo soportamos— y también con el repintado
automático encima.

Verificada rompiéndola a propósito —metiéndole una versión oscura que
SÍ cambia los colores— da **25,4%** contra un tope del 4%; como está
hoy da **0,0%**. Y la mitad de siempre, el repintado automático, sigue
dando 0,0% contra el 43,5% de antes del primer arreglo.

**La lección**: dos navegadores pueden tener la misma función y la
señal para apagarla puede ser la OPUESTA. Una medición contra uno solo
no dice nada del otro, por más que el síntoma se vea igual.


**Y la misma medición, para las ocho pantallas de afuera de las
invitaciones, vive en `pruebas/arranque.js`** —que es la suite de
*cómo le llega la página al teléfono*—. Verificada igual, sacando la
línea: da **3 fallas** (`/` 37%, `/invitaciones` 15,6% y
`/muro?demo=1` 8,8%).

#### Lo que sigue faltando

**El titular de la cuenta** del alias —el nombre que le muestra el
banco al invitado cuando lo pega— y **hasta cuándo se puede
confirmar**: a esa pregunta contestó *"confirmar asistencia"*, que no
es una fecha. Los dos siguen como huecos con su píldora, y vacíos no
dibujan el renglón en vez de inventarlo.

### `facuymaxi/`: el casamiento de Facundo y Maximiliano

Sábado 22 de mayo de 2027 · La Mansión del Rey (Vera Mujica 68, Rosario)
· de 21 a 4 h. La ceremonia civil es **durante la fiesta y en el mismo
salón**, así que va en un solo bloque: partida en dos —"ceremonia" y
"fiesta"— el invitado lee dos lugares y dos horarios donde hay uno
solo, y aparece temprano en una puerta cerrada.

Lo que pidieron ellos, por escrito: *"moderna y elegante, pero cálida,
romántica y descontracturada… diseño limpio, buena tipografía,
transiciones delicadas y una presentación atractiva de nuestras
fotografías… sin demasiados adornos ni elementos innecesarios"*.

#### Las seis referencias, y dónde está cada una

La primera vuelta salió **sin sobre** y con una estructura propia. El
dueño miró y mandó **seis capturas** con una línea: *"usá todos estos
recursos para cada una de las cosas que dice ahí"*. Así que la pieza se
rehizo alrededor de ellas, y **cada captura tiene su lugar**:

| Referencia | Qué se tomó | Dónde está |
|---|---|---|
| Alejandra y Mateo | el monograma de iniciales en su marco de ramas, "NOS CASAMOS", la **fecha en una línea** con separadores, la ramita, la foto con el **borde ondulado**, la frase en cursiva y el **reproductor** de la canción | la portada y la tarjeta de la canción |
| Darya y Nikolay | la **galería en trío** escalonado (después la reemplazó la tira a sangre) | `#galeria` |
| Timing / Dress code | el **cronograma** de horas colgando de una línea, los **títulos con eco** y los **círculos** de la paleta | `#timing` y la tarjeta de dress code |
| El calendario | el **arco** oscuro y el día marcado con un **corazón** | `#fecha` |
| Confirmación y contactos | la **cuenta regresiva en fichas** y la sección de **contacto** con WhatsApp | `#invitacion` y `#contacto` |
| Mark & Esenia | **el sobre** con su sello de lacre y "tocá el sobre para abrirlo" | `#sobre` |

**Lo que se copia es el RECURSO, no el color de otro.** Las capturas son
casi todas blanco y negro o verde inglés; la paleta la mandaron los
novios —verde salvia, marfil cálido, champagne, dorado suave y gris
antracita— y es la que manda. Los círculos del dress code son esa
paleta, no el "total black" de la referencia.

**Y lo que se sostiene de la primera vuelta, porque es de esta pareja y
no de una referencia**: los dos nombres **entran desde los costados y se
encuentran en el medio** —ahora al abrirse el sobre, que es cuando hay
alguien mirando—, el **hilo** de un píxel con su rombo que cose las
secciones, y que **todo vaya de a dos y del mismo tamaño**: las dos
iniciales del monograma, los dos nombres, las dos tarjetas de los
detalles. Es la regla que ya está escrita para `mateoylucas/`: en una
invitación hétero hay un orden heredado (la novia primero, los padres de
cada lado); acá cualquier jerarquía sería una declaración, así que no
hay ninguna.
**La sección "No siempre se pudo"** de `mateoylucas` **no** se puso: ahí
mismo dice que para una pareja de verdad es opcional **y hay que
preguntarlo**. Está preguntado.

#### Lo que costó una vuelta, y ninguna tiraba un error

- **El sobre dejaba ver la carta.** La carta vivía ADENTRO del sobre y
  pintaba por encima de los pliegues laterales: dos cuñas de papel crema
  asomando arriba. La primera corrección fue acomodar el apilado; la
  buena fue mover la carta **DETRÁS** de un frente opaco. Adentro,
  cualquier parte que los cuatro pliegues no tapen se ve, y hay que
  acertarle al apilado y al tamaño; atrás no hay nada que tapar. El
  `z-index` salta a los 0,45 s con una transición de 0 s y retardo —no se
  interpola— así que la carta pasa adelante justo cuando el sobre ya se
  está yendo.
- **`#portada > *` le gana a una clase.** Esa regla sube el texto por
  encima del velo y de paso le pisó el `position:absolute` a la caja de
  la foto y a "Deslizá": la capa absoluta pasó a ser una fila más y
  "Deslizá" quedó montado arriba del renglón de abajo. Es exactamente lo
  que ya había pasado en `mia15`. Las dos recuperan el suyo en una regla
  con el id adelante.
- **El día marcado del calendario llevaba su fondo DETRÁS**, en un `<i>`
  posicionado, y el medidor informó el "22" a **1,00:1**. Tenía razón
  según lo que mide: sube por el árbol buscando el primer fondo OPACO, y
  el del `<td>` es transparente, así que encontraba el papel de la
  tarjeta. Es la misma trampa del `background-clip:text`.
  **Con el corazón de la referencia 4 el problema vuelve**, porque un
  corazón es una forma y no un rectángulo de color. Se resuelve
  eligiendo un color de texto que funcione contra LAS DOS COSAS: el
  corazón va en oro hondo y el número en marfil, que se lee sobre el
  corazón (3,99:1) y sobre el fondo del arco (10,8:1). El medidor ve una
  y el invitado ve la otra, y las dos pasan.
- **El eco del título solo sirve en UNA línea.** La palabra en cursiva
  corrida encima funciona cuando el título no envuelve; envuelto a dos
  líneas el eco cae en el hueco del medio y se lee como un error de
  maqueta. No se adivina por la cantidad de letras —depende del ancho y
  de la tipografía—: se MIDE la caja ya dibujada y, si envolvió, el eco
  se saca.
- **La tarjeta del dress code decía dos veces lo mismo** ("Elegante
  sport" de título y "Elegante sport · elegante de fiesta" abajo). El
  título y el detalle van partidos en el CONFIG. Y el icono tuvo su
  vuelta: la camisa a 28px se leía como un libro abierto. Se eligió
  mirando, entre cuatro a 26px: quedó la **percha**, que es la que se lee
  y además es la que no promete etiqueta.

#### Lo que no se inventa

**La paleta tuvo que crecer para que el texto exista**: el dorado que
mandaron (`#B79A68`) sobre el marfil da **2,38:1**. Sobre el papel va
`#8E7342` (3,99:1) y sobre la tinta el de ellos (4,54:1). Los
contrastes se calcularon ANTES de escribir una línea de CSS.

**Las letras son Newsreader + Figtree**, elegidas MIRANDO con
`pruebas/letras.js` contra cuatro parejas: la Newsreader es una serif de
trazo parejo —no una didone, que en un teléfono se parte— y la Figtree
tiene la equis alta. Con Lora, *"Sábado 22 de mayo de 2027, de 21 a 4
h"* se partía y dejaba un `h.` solo en el renglón de abajo. La tercera
familia (Parisienne) es **solo** para la "y" y la frase manuscrita: no
lleva un solo texto largo.

**La canción SUENA** desde el 01/11/2026 — está contado abajo, en
*"Sin sobre, con las fotos, con la canción sonando y con SU paleta"*.
Hasta ese día el reproductor era un dibujo y el play LLEVABA a
escucharla, porque *el archivo no es nuestro*; el dueño pidió lo
contrario y es la misma excepción que `ambar15/`. Lo que no se afloja
es la mitad técnica: ningún reproductor de un tercero, que la CSP no
lo deja y además sería un tercero corriendo código en la pantalla del
invitado.

**El cronograma solo tiene lo que mandaron**: la ceremonia a las 21 y el
final a las 4. Una hora inventada manda a la gente a la hora
equivocada.

**El contacto del día de la fiesta está vacío a propósito.** El WhatsApp
de Click Eterno **no va ahí**: nosotros no organizamos la fiesta, y un
invitado con un problema a las dos de la mañana tiene que caer en
alguien que esté en el salón.

**El texto del regalo es de ELLOS, casi literal**, igual que el "Te
invito" de `mia15`: es su voz, no la nuestra. El corazón que escribieron
va dibujado en el dorado de la paleta en vez de ir como emoji: un ❤️
rojo sería el único rojo de toda la pieza. Y el alias, **`FACUYMAXI.BODA`,
se escribe tal cual lo mandaron.**

**LOS HUECOS.** `CONFIG.borrador` dibuja una píldora donde falta un
dato, igual que en `ambar15` — un dato que no mandaron no se inventa y
tampoco se deja en blanco, porque en blanco nadie se acuerda y se
publica así. **Hoy la bandera está en `false`** y no se dibuja
ninguna: las mandó sacar el dueño el 02/11/2026. Lo que falta sigue
siendo lo mismo y sigue sin inventarse —su renglón no se dibuja—,
pero el recordatorio ya no está en la pantalla, sólo en este archivo.
Son tres: **hasta cuándo se puede confirmar**
(dijeron "durante marzo de 2027, confirmamos el día exacto", y eso no
es una fecha), **el titular de la cuenta** del alias y **a quién le
escriben los invitados el día de la fiesta**. Eran cinco: las fotos
llegaron el 01/11 y los horarios el 02/11, y cada píldora desapareció
sola el día que el dato existió —que es lo único que hace que esto no
se publique con un hueco olvidado—. Acá la píldora cuelga de una bandera explícita y no
de `CONFIG.evento` como en `ambar15`, porque esta invitación nace con su
pestaña de planilla andando: la confirmación entra desde el primer día.

**Sin fotos no queda ningún hueco visible**: la banda de la portada y la
galería se esconden enteras y la portada tipográfica se sostiene sola.
Con ellas, la galería va en trío sin marcos y **sin puntitos**: las
fotos son el contenido. Por eso `pruebas/invitacion_mirar.js` dejó de
exigir un puntito por foto siempre y lo exige **solo si la galería tiene
puntitos** — lo que hay que agarrar es un punto que no lleva a ninguna
foto (el pase de `mia15`, que sigue medido), no que una galería esté
hecha con pase.

`facuymaxi` está en `lib/planillas.json` y tiene su `facuymaxi/listado/`,
así que el tablero de confirmaciones funciona desde el día uno sin un
solo paso del lado de Google. Lleva `noindex` y **no está en la galería
de Trabajos ni en `/invitaciones`**, por lo mismo que `mia15`, `almi15` y
`ambar15`.

**La carpeta se llama `facuymaxi` y se puede renombrar** mientras el
link no se haya repartido: la dirección es
`clicketerno.com.ar/facuymaxi` y sale del alias que eligieron ellos. Un
link repartido no se puede mover; uno que nadie tiene, sí.

#### Las tres referencias nuevas, y lo que cambió con ellas

El dueño mandó tres capturas más —una portada rusa con el reproductor
arriba, un timing marrón con el calendario enmarcado y un cronograma
que serpentea, y una galería en mosaico con sus preguntas— y una
línea: *"me gustaría que haya ese estilo y pongas todo lo que te piden
en ese texto"*. La pieza se rehizo alrededor de ellas; lo que piden
los novios ya estaba y no se tocó.

**La portada es otra.** Ahora es el REPRODUCTOR arriba de todo sobre
el papel, la FOTO a sangre en el medio, y abajo una BANDA DE TINTA con
el monograma de dos iniciales separadas por una raya, los nombres en
capitulares espaciadas, la fecha en números (`22.05.2027`) y la
flecha. Se fueron el marco de ramas y el borde ondulado de la foto:
eran de la referencia anterior y la nueva corta derecho, que además es
lo que hace que la foto y la banda se lean como una sola pieza.

**Es UNA sola maqueta, con foto y sin foto.** Lo único que se esconde
es la foto; todo lo demás está en los dos casos. Así no hay dos
portadas que medir y el día que llegue el archivo no se mueve nada
más — al revés de `mia15`, donde la portada con foto y la tipográfica
son dos caminos distintos y cada cambio hay que mirarlo dos veces.

**El reproductor se mudó y por eso se fue de la ficha.** Estaba
dibujado en la tarjeta de "nuestra canción" y ahora vive en la
portada; la tarjeta quedó con el nombre, el autor y un botón que lleva
al mismo lado. Dibujarlo en los dos lugares es *dos dibujos para lo
mismo, y uno se queda atrás*. Y los dos mandos de los costados van
declarados decoración (`aria-hidden` + `pointer-events:none`): con una
sola canción no pueden hacer nada, y *un botón que no puede hacer su
trabajo molesta más que no estar*.

**La frase y el lugar se fueron de la portada, y no es de gusto.**
Medido: con los dos renglones puestos la portada daba **973px en un
iPhone de 844**, así que "Deslizá" —lo único que avisa que hay más
abajo— quedaba debajo del borde. La frase bajó a "Queremos que estés",
donde encima se lee mejor, y el lugar ya vivía en "dónde y cuándo".
Con eso la portada mide **836** y entra entera. Es la misma lección ya
escrita para `ambar15`: *un renglón que se agrega a una portada no es
un renglón, es todo lo que estaba abajo, movido*.

**El calendario pasó del arco al MARCO**, con sus cuatro esquinas
floreadas y la barra del horario de inicio abajo ("EMPIEZA · 21:00",
que es el "START 14:30" de la captura). Y el corazón del día pasó a
ser **de contorno**, que además arregla una medición: con uno relleno
hay que elegir un color de número que funcione contra el corazón Y
contra el fondo, porque *el medidor ve una cosa y el invitado ve la
otra*; de contorno no hay dos cosas, el número cae sobre el fondo
macizo de la tarjeta y lo que informa el medidor es lo que se ve.
**Las dos cosas se dieron vuelta después**, con otra referencia del
dueño: está abajo, en *"El calendario vuelve a su arco"*.

**El cronograma serpentea**, con los iconos dibujados a los costados y
los nodos de corazón sobre la línea. Tres cosas que costaron una
vuelta cada una y **ninguna tiraba un error**:

- **La línea se MIDE, no se estira.** La primera versión era un SVG de
  `viewBox` fijo estirado al alto de la lista con
  `preserveAspectRatio:none`: estirada así, la curva cruza el centro
  en los BORDES de cada renglón y no en su medio, así que los
  corazones —que van centrados en su renglón— caían justo donde la
  curva está más lejos y se veían **flotando al costado de la línea**.
  Y los renglones no miden todos lo mismo, porque el texto envuelve.
  Ahora el camino se arma con las cajas de verdad (`offsetTop` +
  `offsetHeight/2`) y se vuelve a dibujar al cambiar el tamaño y
  **cuando terminan de bajar las letras**: una curva medida contra la
  tipografía de respaldo pasa al lado de los corazones.
- **`nth-of-type` y no `nth-child`.** El primer hijo de la lista es el
  SVG de la línea, así que contando HIJOS el primer renglón salía del
  lado equivocado — y eso se ve perfecto, sólo que espejado.
- **Un icono que no está en la tabla no dibuja nada y el renglón igual
  se ve.** Los iconos van por NOMBRE en `CONFIG.timing`: agregar una
  hora del resto de la noche tiene que ser una línea, no un dibujo.

**La galería es un MOSAICO con su visor.** Una alta a la izquierda,
dos cuadradas a la derecha y el resto fluyendo. **La ancha de cierre
no es decoración**: la alta se come dos filas de la columna
izquierda, así que con una cantidad PAR de fotos queda siempre un
hueco al final, y la última ocupando las dos columnas es lo que lo
tapa — con cualquier cantidad el mosaico no tiene un agujero. La
altura de las filas la fijan las cuadradas, así que la alta se estira
sola sin que nadie calcule nada.

**Y el botón "Ver todas las fotos" hace un trabajo de verdad**: en el
mosaico van recortadas y en el visor se ven enteras. Las imágenes son
LAS MISMAS que ya están en la página, así que abrirlo no baja un solo
byte más. Cierra con ✕ y con Escape, y devuelve el scroll del body.
Si no hay fotos el botón no existe.

**Las preguntas, y SOLO las que ellos contestaron.** "¿Pueden ir
chicos?" y "¿hay estacionamiento?" están en la captura y no van: una
respuesta inventada ahí hace venir a una familia entera a una fiesta
donde no la esperan. Son cinco y las cinco salen de lo que mandaron
—la hora, el lugar, el dress code, "durante marzo de 2027" y el
alias—. Entran solas agregando un renglón el día que manden más.

#### Sin sobre, con las fotos, con la canción sonando y con SU paleta

Cuatro pedidos del dueño el 01/11/2026, con las fotos y el audio.

**1 · "No quiero que tenga sobre. Que arranque directo en la portada.
Va a quedar más prolijo."** Se fue entero: la capa, su CSS y su JS, y
la cascada de la portada —que esperaba a que el sobre se abriera—
arranca ahora al cargar, en el cuadro SIGUIENTE y no en éste (puesta
en el mismo, el navegador junta los dos estados y no hay transición
que ver, sin un solo error que lo diga).
De paso se fue sola la falla de abajo: **acá ya no hay capa fija que
pueda tapar nada si el script no corre.**

**2 · Las cinco fotos.** La del jardín al atardecer es la portada —la
que eligieron ellos— y las otras cuatro son el mosaico. **Las cinco
van en BLANCO Y NEGRO**, con el filtro en el CSS y no quemado en el
archivo: el original queda entero. La primera versión las puso a
color, razonando que la paleta que mandaron es cálida y natural; el
dueño bajó las dos cosas, primero la portada (*"es muy apagada"*) y
después el mosaico (*"así tienen que ir las otras fotos"*, con la
referencia al lado). Tenía razón las dos veces y el motivo es el
mismo: **una foto a color mete SU paleta**, y cuatro fotos distintas
meten cuatro —el verde del pasto, el azul de un traje, el beige del
salón—, así que el bloque se lee como un collage y no como una pieza.
En blanco y negro las cinco son lo mismo, luz y sombra, y lo que
queda de color es la paleta de ellos: el champagne del filete, el oro
de los rótulos, la salvia de las bandas.
**Y el visor va en blanco y negro también**: tocar una miniatura
monocroma y que se abra a color se lee como un error de carga.

**Los recortes son la mitad del trabajo.** La de la portada se recortó
a 1,1:1 alrededor de las caras: entera es vertical de cuerpo entero y
en la banda de la portada se habría visto una tira de torsos. Y **la
ancha del mosaico pasó de 2,1:1 a 1,55:1**, porque las cuatro son
selfies verticales y en una banda tan angosta no entra una cara
entera: *el ancho de la ranura se elige por lo que hay que mostrar, no
al revés*.

**3 · La canción SUENA.** Más arriba está escrito que acá no sonaba
porque *"el archivo no es nuestro"*; el dueño pidió lo contrario, igual
que en `ambar15`, y es la misma excepción: se le dijo y la sostuvo. La
mitad técnica no se afloja —ningún reproductor de un tercero: la CSP
no lo deja y además sería un tercero corriendo código en la pantalla
del invitado—. El audio sale del video que mandó, normalizado, en AAC
y en Opus: el navegador baja UNO.

**`preload="metadata"`, y no es un detalle**: son 2,3 MB que no se
bajan hasta que alguien toca el corazón. Y el reproductor **trae
escrito cuánto dura**, porque un Ogg todavía sin bajar entero devuelve
`Infinity` de duración y ahí la cuenta del avance da 0 para siempre —
la rayita se queda clavada a la izquierda toda la canción, sin un solo
error que lo diga.
**Y el reproductor es UNO**: la tarjeta de "nuestra canción" perdió su
botón y dice dónde suena. Dos botones para escuchar la misma canción no
son dos entradas, son dos cosas haciendo lo mismo.

**4 · "Necesito que juegues con estos colores. Los bordes, las letras,
todo. No improvises."** Ninguna raya de la invitación es un gris
inventado: hay **una variable de borde por cada fondo**
(`--borde-papel`, `--borde-tinta`, `--borde-verde`), sacadas del
dorado, del champagne y de la salvia que mandaron ellos, y las usan el
hilo que cose las secciones, el filete de la banda de la portada, el
contorno de cada foto del mosaico, las dos tarjetas, las preguntas, el
marco del calendario, la barra del horario, las fichas de la cuenta
regresiva, la caja del alias y los botones.
**El hilo dejó de ir en `currentColor`**, que ahí era el color del
texto, o sea un gris: va en el dorado sobre el papel, en el champagne
sobre la tinta y en la salvia honda sobre el verde.

#### El cierre es la foto del mar, con "te esperamos" encima

*"Esta foto quiero que sea como la primera pero que diga te esperamos
y la fecha con las iniciales de ellos. Que sea en color champagne con
ese código el borde en gris"*, con la referencia al lado: una foto a
sangre y el saludo escrito encima, abajo.

**Sale del mosaico.** Era la ancha del cierre del mosaico; puesta
además acá sería la misma foto dos veces. Con tres el mosaico no tiene
agujero igual —la alta se come dos filas y las dos cuadradas las
llenan—, que es justo lo que la regla del "ancha" estaba cuidando.

**Se RECORTÓ de nuevo del original**, y es la mitad del trabajo: la
que estaba en el repo ya venía recortada a 1,55:1 para la ranura
ancha, así que el saludo aterrizaba **sobre las dos caras**. El
recorte nuevo deja las caras arriba y los hombros abajo, que es donde
cae el texto. *El encuadre se arregla en el archivo, no en el CSS.*

**El velo se midió CON EL PÍXEL, no a ojo.** El texto va en champagne
—un color claro— y debajo hay un cielo, el pasto y la piel de los dos.
Con el primer velo, en un monitor ancho *"Te esperamos"* caía sobre un
gris de 126 y daba **2,38:1**, o sea que no estaba; en un teléfono el
MISMO velo daba 4,7. La foto escala distinto en cada pantalla y la
raya del degradé no — la misma lección del velo de `almi15`. Con el
velo repartido: **4,45 a 9,48:1** en los cuatro aparatos.

**Y esto es un PUNTO CIEGO del medidor compartido**, igual que la
portada de `mia15`: `.cierre-foto` tiene un `background-color` opaco,
así que el medidor informa champagne sobre casi negro y da un número
perfecto mientras el renglón puede estar cayendo sobre el cielo. Por
eso se midió a mano con `pruebas/png.js`.

**El borde gris de la letra lo pidió el dueño**, y de paso protege el
caso en que el velo no alcance. Va adentro de `@supports (paint-order:
stroke)` y con `paint-order:stroke fill`: sin eso el trazo se centra
sobre el contorno, se mete para adentro y empasta la manuscrita.
**Y el grosor va en `em`, que es el del ELEMENTO**: `.055em` en un
rótulo de 9,5px es un hilo de medio píxel, o sea una declaración que
no hace nada. Lo agarró la prueba, no el ojo — es exactamente la misma
falla ya escrita para el "15" de `mia15`.

**Las iniciales salen de `CONFIG.quien`**, como el monograma de la
portada: escritas a mano, la próxima invitación que se copie de ésta
las trae de otra pareja — que es lo que ya pasó en `ambar15` con el
nombre de Almi.

**Y el renglón "Te esperamos el 22 de mayo" se va cuando la foto
carga**: la foto lo dice, y dicho dos veces una encima de la otra es
un error de maqueta. Si el archivo falta, el cierre queda como estaba
y no un cuadrado roto.

#### El dress code, con los círculos encimados

*"Esto para el dress code con la paleta que te pidieron"*, con la
referencia: el título, una línea corta, el nombre del dress code en
**capitular espaciada** y abajo tres discos **encimados**.

**En fila y separados, cinco bolitas son una leyenda de colores;
encimados son una paleta.** Es el mismo gesto que una carta de
pinturas, y cuesta un margen negativo.

**Cada disco lleva un aro del color de la ficha, y no es un adorno**:
encimados sin aro, dos colores vecinos parecidos —acá el champagne y
el dorado— se funden en una sola mancha y la paleta deja de tener
cinco colores. El marfil lleva además su filete gris, porque un
círculo del color del fondo no es un círculo.

**El rótulo va ARRIBA de los círculos**, que es donde la referencia
pone la línea que los explica: una fila de bolitas sin rótulo es un
adorno, y esto es un DATO — la misma lección ya escrita para
`ambar15`. Y dice *"los colores de la boda"* y no *"vestite así"*:
ellos mandaron su paleta, nunca dijeron cómo tiene que ir vestido el
invitado, y eso no se inventa.

**El nombre del dress code va en capitular espaciada por `id` y no en
el `h3`**: el otro `h3` de la fila es el nombre de la canción, que en
mayúsculas sería otra cosa.

**Y de paso se encontró un verde que había quedado suelto.** El botón
"Cómo llegar" seguía con `--borde-verde` y `--salvia-honda`, que es
la piel que esta invitación ya no tiene: se dibujaba perfecto, no
tiraba ningún error, y era el único verde de toda la pieza. Es la de
siempre: **una variable que sobrevive a la skin que la creó no
avisa**.

#### "Que sea así en general": dos colores y el borde rasgado

Cuarta corrección seguida del dueño sobre la misma invitación, con
una referencia de bandas **blancas y negras que se alternan con el
borde RASGADO**. Las tres anteriores —la portada, el mosaico, el
calendario— eran la misma observación en pedazos; ésta la dice
entera.

**Las pieles pasaron de tres a DOS.** Eran marfil, salvia y
antracita. La salvia era "el respiro", y en una pieza de dos colores
es exactamente lo que no deja que haya dos colores: tres grises
cálidos apilados no hacen contraste, hacen barro — la misma lección
que ya había costado la portada. Y el antracita `#333638` subió al
casi negro de la portada (`--tinta-port`), así que **la pieza entera
tiene un solo negro y un solo blanco**.

**Lo que queda de la paleta que ellos mandaron son los ACENTOS**: el
oro de los rótulos sobre el papel, el champagne sobre la tinta, los
hilos, los filetes de las fotos — y la salvia, que sigue entera en
los círculos del dress code, donde es un DATO y no una decoración.
Esto no contradice *"jugá con estos colores, no improvises"*: los
cinco siguen estando, lo que cambió es cuál manda.

**El borde rasgado se pone SOLO, y SOLO donde el color cambia.**
Escrito a mano en el HTML, el día que una sección se esconda —la
galería si no hay fotos, las preguntas si no hay ninguna— quedarían
dos bandas del mismo color pegadas con un rasgado en el medio. Y por
eso `rasgar()` **es una función y no un IIFE**: la galería aparece
recién cuando las fotos cargaron, o sea después de la primera
pasada, así que hay que volver a rasgar o queda una juntura recta de
los dos lados.

**Y la sección que se rasga PIERDE SU HILO.** El hilo con su rombo y
el rasgado son dos separadores; puestos juntos se leen como un error
de maqueta. Es la misma lección ya escrita para el encaje de
`ambar15`, que *reemplaza* al corte en curva y no se suma. Además el
rasgado se dibuja encima y le comería la mitad.

**Un rasgado no es una sierra**, y eso costó una vuelta. La primera
versión ponía cada punto al azar entre 9 y 39: picos independientes,
y lo que se ve es papel picado —la misma falla que ya está anotada
para la sierra de `ambar15`—. Un papel rasgado es un camino que
**camina**: cada punto cerca del anterior, con alguna muesca más
honda de vez en cuando. Y tiene que **volver al medio**: un paseo
aleatorio puro se pega al tope y deja una recta de doscientos
píxeles, que es justo lo que un rasgado no tiene. Los caminos salen
de una **semilla fija** —la fecha de la boda—, como en `mia15`: con
`Math.random()` dos capturas de la misma invitación saldrían
distintas.

#### El calendario vuelve a su arco, y el corazón se rellena

*"Así el calendario pero en la paleta que pidieron"*, con una
referencia: un **arco** oscuro, el mes y el año arriba, la grilla en
serif clara y el día marcado con un **corazón relleno** con el número
adentro. Los colores siguen siendo los de ellos —antracita, champagne
y marfil—; lo que cambia es la forma.

**El arco no es un `border-radius` a ojo.** El radio horizontal es el
**50%** —o sea la mitad del ancho, siempre— y el vertical un **34%
del alto**, que es lo que lo deja apenas achatado como en la captura.
Escrito en píxeles se vuelve un semicírculo en una tarjeta angosta y
una cúpula en una ancha. Y el relleno de arriba tiene que ser grande:
el mes vive ADENTRO del arco, debajo de su corona, y con el relleno
de antes quedaba montado sobre la curva.

**Y el corazón relleno trae de vuelta la trampa que el de contorno
esquivaba.** El medidor de contraste sube por el árbol hasta el
primer fondo OPACO, y **un corazón es una forma, no un fondo**: así
que informaría el número contra el antracita del arco —**1,00:1**, o
sea que el número no está— y tendría razón según lo que mide,
mientras el invitado lo ve en marfil sobre marfil. Dos párrafos más
arriba, en la vuelta anterior, eso se había resuelto **sacando el
relleno**; ahora el relleno es el pedido, así que se resuelve al
revés: el número vive adentro de un `<b>` que lleva **el marfil del
corazón de fondo de verdad**, metido entero en la panza del corazón,
donde no se nota porque es el mismo color. No es esconderle un color
al medidor —que es la trampa que este archivo ya tiene escrita tres
veces—: es **decirle la verdad**, porque ése ES el color sobre el que
el número está.
Verificado sacándole ese fondo al `<b>`: da **4 fallas**, una por
aparato, con el "22" a 1,00:1.

**Y el corazón va corrido ABAJO a propósito.** Su panza —la parte
ancha— queda entonces a la altura del número. Centrado, el número
aterriza justo en la muesca de arriba y el `<b>` asoma por los dos
costados: deja de leerse como un corazón y pasa a leerse como una
insignia. Se ve mirando, no leyendo el código.

#### "Es muy apagada. Cero diseño": la portada en blanco y negro

El dueño la miró publicada y la bajó con tres palabras. Tenía razón y
el motivo se puede decir en una línea: **la portada eran tres grises
cálidos apilados** —el papel crema arriba, la foto a color de un
atardecer en el medio, la banda en antracita abajo—, y tres cosas
cálidas y medias una encima de otra no hacen contraste, hacen barro.
En una captura de escritorio pasa por sobria; en un teléfono se lee
como una pantalla sin terminar.

Son tres decisiones y ninguna es de gusto:

- **La foto va en BLANCO Y NEGRO**, con el filtro en el CSS y no
  quemado en el archivo — el original queda entero por si algún día se
  la quiere a color. Acá estaba escrito lo contrario (*"van en COLOR…
  el atardecer y las guirnaldas SON el champagne y el dorado de su
  lista"*) y era justamente eso lo que el dueño rechazó: el dorado de
  la foto no suma a la paleta, **se funde con ella**.
- **La portada es oscura de punta a punta.** El papel no entra: el
  reproductor, la foto y la banda caen sobre el mismo casi negro
  (`--tinta-port`, `#101214`), así que la foto y el bloque de texto se
  leen como UNA pieza y no como dos franjas pegadas. El antracita
  `#333638` es un gris cálido y apagaba las dos.
- **El monograma va en el corte DISPLAY de la misma tipografía.**
  `opsz` es el eje de tamaño óptico de la Newsreader: en 72 los finos
  se afinan y los gruesos engordan, que es el contraste de una didona.
  Acá se puede y en el cuerpo del texto no —*lo que se parte en un
  teléfono es una didona a 15px, y esto mide noventa*— y **no cuesta
  una descarga más**, porque es la misma familia que ya está pedida.

Dos cosas que costaron una vuelta cada una:

- **El degradé de abajo de la foto no es un adorno.** Sin él queda una
  juntura recta a lo ancho de la pantalla justo donde la foto termina,
  y ahí se vuelven a leer como dos cosas pegadas. Con la foto fundida
  en el negro, el monograma parece salir de ella.
- **El botón del corazón va AL REVÉS que antes**: círculo claro y
  corazón oscuro. Sobre el casi negro, un círculo de tinta no existe —
  es *si un bloque trae su propio fondo, trae su propia tinta* por el
  lado del fondo que cambió abajo del bloque.

**Y el aire alrededor de la "y" quedó torcido.** El `letter-spacing`
de los nombres deja su espacio DESPUÉS de la última letra de
"FACUNDO", así que un padding simétrico en la "y" da más hueco de un
lado que del otro. Se ve en una captura y no leyendo el código.

Medido: la portada mide **799px en un iPhone de 844**, así que
"Deslizá" —lo único que avisa que hay más abajo— sigue entrando
entero, y la suite informa **122 textos y ninguno abajo de 3:1**.

##### Dos cosas que la suite medía con el selector de OTRA invitación

Las dos daban verde o una falla falsa, y las dos son la misma lección
—*una comprobación escrita para una invitación mide a esa invitación*—:

- **La foto que se tira tenía que ser una de la GALERÍA.** La prueba
  404ea la PRIMERA imagen de `fotos/` que pide el navegador, y acá esa
  es la de la PORTADA: la galería quedaba entera y la cuenta informaba
  *"quedaron 4 de las 3"*. Parecía que la foto caída no se iba, cuando
  lo que no se había caído era una foto de la galería. Ahora saltea la
  portada, que tiene su propio bloque.
- **El reproductor se buscaba por `.repro audio`**, que es la clase de
  `ambar15`. Acá es `.player`, así que la suite informaba *"esta
  invitación no trae canción"* con la canción puesta y las tres
  comprobaciones del bucle y el rebobinado **no se corrían**. Se busca
  el `<audio>`, que es lo único que toda invitación con canción tiene
  sí o sí.

#### Y midiendo eso apareció otra, en CINCO invitaciones a la vez

**Sin JavaScript, el sobre tapaba la invitación entera y no se podía
abrir.** `#sobre` es una capa `position:fixed` que cubre la pantalla y
su botón lo abre el JS: si el script no corre —o revienta en la
primera línea— el invitado se queda mirando un sobre cerrado y un
botón que no hace nada, **para siempre y sin un solo error a la
vista**. Comprobado preguntándole al navegador quién ataja el dedo en
el medio de la pantalla con el JS apagado: en `mia15`, `almi15`,
`ambar15`, `mateoylucas` y `facuymaxi` contestaba el sobre.

Y el comentario del propio archivo decía lo contrario —*"sin JS no
existe: el CSS lo esconde"*—, así que estaba escrito como resuelto. En
`facuymaxi` el JS hasta hacía `sobre.hidden = false`, o sea que la
intención estaba: lo que fallaba es que **`#sobre{display:grid}` le
gana al `hidden` del HTML**, que es exactamente la trampa de abajo.

Se arregla con `html:not(.js) #sobre{display:none}` **más un script de
una línea en el `<head>`** que pone esa clase. Los dos juntos: sin la
clase puesta antes de pintar, la invitación se vería un cuadro y
después aparecería el sobre encima, que es peor que el bug.
`claraybruno` y `juliayfranco` ya estaban bien.

**La lección es la de siempre y por eso vale repetirla**: una trampa
que se arregla en un lugar hay que ir a buscarla a los otros, y un
comentario que dice que algo está resuelto no es una medición. Ésta
apareció midiendo otra cosa.

**Una trampa de CSS que volvió a morder: `hidden` lo pisa cualquier
`display` escrito después.** `.port-foto{display:block}` y
`.btn[hidden]` sin su regla hacían que la foto vacía y el botón de la
galería se dibujaran igual estando ocultos. No tira ningún error: lo
que se ve es una caja negra donde no va nada. No se puede arreglar con
un `[hidden]{display:none!important}` global, porque el sobre depende
justamente de que su `display:grid` le gane al `hidden` del HTML.

#### El countdown en fila, la tira de fotos y los horarios en columnas

Tres pedidos de una vez, con cinco capturas: el countdown ruso
(*"ese quiero que sea el countdown y que sea color marfil con borde
color champagne las letras"*), la tira de fotos de abajo de una
página de wedding planner (*"hacé lo mismo que en la primera foto
con las otras tres"*) y el bloque de columnas de arriba de esa misma
página (*"arriba lo de la ceremonia quiero que lo copies para la
parte donde dice los horarios"*). Y, por fin, **los horarios de
verdad**: 21 h apertura de puertas, 21:30 ceremonia, 22 h comienza
la fiesta, 4 am finaliza el evento. Con eso se fue la píldora de
*"falta: los horarios del resto de la noche"*, que era uno de los
cinco huecos.

**1 · El countdown pasó de fichas a una fila, y el COLOR eligió la
banda.** Cuatro recuadros con su rayita se leen como un tablero; los
cuatro números corridos, en serif grande y con su rótulo chico
abajo, se leen como un reloj. Pero *"marfil con borde champagne"*
sobre el papel marfil es texto que no está: así que **`#invitacion`
pasó a ser de TINTA**. Es la regla de siempre —*si un bloque trae su
propio fondo, trae su propia tinta*— vista al revés: **el color de
letra que se pide es el que elige sobre qué puede caer.** De paso la
portada y la invitación quedaron en un solo bloque oscuro de
apertura, y el papel empieza en "guardá la fecha"; los bordes
rasgados se recalculan solos, porque los pone `rasgar()` y sólo
donde el color cambia (8 antes, 8 ahora).
**El borde va en `em` y el `em` es el del ELEMENTO**: el tamaño del
número vive en el `b`, así que escrito en la fila se resolvía contra
16px y salía un hilo de medio píxel. Es la misma falla ya escrita
para el "15" de `mia15` y para el rótulo del cierre. Y el rótulo de
abajo **no lleva borde**: ya es champagne, y un trazo champagne
alrededor de una letra champagne es una declaración que no hace
nada.

**2 · La tira de fotos va A SANGRE, y eso NO es sacarle el padding a
la sección.** La primera versión le puso los márgenes negativos de
siempre y en un teléfono quedó perfecta; en un monitor la tira medía
**730 de 1280**, encerrada en el medio. El culpable es `.caja`, que
está topada en 640px: adentro de ella, el margen negativo descuenta
el padding de la sección y nada más. La tira pasó a ser **hija
directa de la sección**, con el rótulo arriba en su caja y el botón
abajo en otra.
**Y la ranura es 4:5, no una tira fina, y eso lo deciden las FOTOS.**
Dos de las tres son cuadradas con las dos caras una al lado de la
otra: con una ranura angosta —que es lo lindo de la referencia— una
de las dos caras queda cortada en cada foto. Es la regla que esta
misma invitación ya tenía escrita para la foto ancha del mosaico:
*el ancho de la ranura se elige por lo que hay que mostrar, no al
revés.*
**El alto sale del ancho con `aspect-ratio`, no de un alto escrito**:
un alto fijo cambia la proporción de la ranura en cada pantalla, así
que un recorte que en el teléfono deja las dos caras adentro en un
monitor las corta. Y la cantidad de columnas la pone el JS (`--n`),
porque sólo él sabe cuántas fotos CARGARON: con el número escrito en
el CSS, una foto que falla deja un hueco donde estaba.

**3 · Los horarios son columnas con una raya fina en el medio, y las
rayas son `border-left`.** Un separador puesto a mano entre columna y
columna deja una raya colgando al final de la fila el día que entre
un horario más; con `border-left` se saca en el primero de cada fila
y listo: el impar en un teléfono (dos columnas) y el `4n+1` arriba de
700px (cuatro). Se fue con esto la línea que serpenteaba y su
`pintarHilo`, que medía las cajas de verdad para que los corazones no
quedaran flotando — un trabajo bien hecho que el pedido dejó sin uso.

**Y el icono de la fiesta se leía como una TIJERA.** Eran dos
monigotes bailando: a 36px las dos cabezas son los ojos y las piernas
cruzadas, las hojas. Va una corchea doble, que se reconoce de un
vistazo. *Lo que no se lee a 36 no va* — la misma lección que ya
costó cuatro vueltas con la bolsa de `ambar15`, y que no se descubre
leyendo el código: se descubre mirando la captura.

#### Las manos con los anillos, el corazón descentrado y los huecos

Tres cosas de un reporte: *"probá poner esta imagen en donde está el
cuenta atrás. Fíjate que el corazón del calendario está descentrado.
Borrá lo que dice falta tal información."*

**1 · La foto de las manos va ENMARCADA y no a sangre.** Es una foto
de fondo BLANCO y la sección de la cuenta regresiva es casi negra: a
sangre, ese blanco es un agujero del tamaño de la pantalla y se lee
como un error de carga. Contenida, con su hilo de champagne, se lee
como una copia apoyada sobre una pared oscura — que es lo que es.
**El hilo va por AFUERA y no `inset`**, al revés que las fotos de la
tira: por dentro cae sobre el blanco de la foto y no se ve, o sea una
declaración que no hace nada.
No lleva el `grayscale` del CSS: **ya viene en blanco y negro**, así
que el filtro sería una capa que no cambia nada. Y se recortó a 4:5
alrededor de los anillos: entera son 941x1672 y en la sección se
habría visto una tira de brazo. Pesa 29 KB contra 1,8 MB del PNG.
Como todas las demás, se pone recién cuando el archivo cargó de
verdad: si faltara, la sección queda como estaba.

**2 · El corazón del calendario se ubica por la FORMA, no por la
caja.** Su `viewBox` es `0 0 24 24` y el dibujo vive en x 3,6..20,4 e
y 5,2..21,2: la forma **no está centrada en su propia caja**, le sobra
aire arriba y a los costados. Posicionado contra la caja —que es lo
que parece obvio— el número caía al **28% del alto del corazón**,
pegado a la muesca de arriba, y la punta se metía en la fila de abajo.
Ahora los números salen de esa cuenta: la caja mide 52 para dibujar 36
de ancho y el `-26px` sube el corazón hasta que el número queda al
**42% de la forma**, que es donde se ve centrado — y de paso el
corazón se lee como un corazón y no como un cuadrado con punta.
**La caja va CUADRADA a propósito**: con una rectangular, el `meet`
del SVG mete un recorte más en la cuenta y hay que volver a resolver
todo. Si se cambia el tamaño, se recalcula: a ojo vuelve a quedar
descentrado y no lo dice nadie.

**3 · Se fueron las píldoras de "falta".** `CONFIG.borrador` pasó a
`false` por pedido del dueño. **Lo que NO cambia es que el dato no se
inventa**: el titular de la cuenta, la fecha límite para confirmar y
el contacto del día de la fiesta siguen sin escribirse, y sus
renglones simplemente **no se dibujan** — que es lo que ya hacían
`mia15` y `almi15`. Lo que se pierde es el recordatorio en pantalla,
así que el pendiente vive ahora sólo en este archivo.

##### Y una foto suelta en `fotos/` rompió la prueba del 404

La comprobación que tira una foto y mira que se vaya elegía **la
primera que pidiera el navegador**, salteando la portada a mano. Con
la foto de las manos —que vive en `fotos/` y no es de la galería— la
que se tiraba era ésa: la galería quedaba entera y la prueba informaba
*"quedaron 3 de las 2"*, como si la foto caída no se hubiera ido.
Excluir la portada a mano era la misma curita una foto tarde. Ahora la
prueba lee de `CONFIG` **cuáles son las de la galería** y tira una de
ésas. Contra el código anterior da **1 falla**.

#### La cuenta regresiva pasa al papel, y la foto que se recortaba sola

Dos capturas del dueño, mirándola publicada: *"mejora la foto porque
queda recortado"* y *"la foto de las manos debe ir como en la foto 3.
El contador también"* — la referencia es una cuenta regresiva en serif
oscura sobre papel crema y, debajo, una foto a sangre.

**1 · `#invitacion` pasó de TINTA a PAPEL**, y con eso se cayó solo el
motivo por el que la foto de las manos iba enmarcada. Acá estaba
escrito —y era cierto— que *"una foto de fondo BLANCO a sangre sobre
antracita es un agujero del tamaño de la pantalla"*. Con la sección en
crema, el agujero no existe. **Un argumento puede ser correcto y
caducar el día que cambia lo que había debajo.**
Esto da vuelta la decisión de *"marfil con borde champagne"* de la
vuelta anterior, que había sido del dueño y para la banda oscura.

**El número toma la tinta de SU banda** (`color:inherit`) y el borde de
letra vive sólo sobre la oscura: el champagne alrededor de una cifra ya
champagne no hace nada, y alrededor de una cifra oscura sobre papel la
empasta. Es *si un bloque trae su propio fondo, trae su propia tinta*
vista al revés — no cambió el bloque, cambió el fondo de abajo.

**2 · El blanco de la foto se funde con el papel, y NO se tocó el
archivo.** El fondo de la foto es `#F8F8F8` y el papel es `#F6F1E8`: a
sangre quedaría un rectángulo blanco con su juntura a lo ancho de la
pantalla. Con **`mix-blend-mode:multiply`** sobre el crema, el blanco se
multiplica por el papel y desaparece —queda el papel— mientras los
negros de las manos no se mueven. Es la misma decisión que el
`grayscale` del resto: el filtro va en el CSS y el original queda
entero. El `isolation:isolate` no es un adorno: sin él la mezcla se va
a buscar lo que haya más atrás en la página.

**3 · Un recorte que depende del ALTO de la ventana recorta distinto en
cada aparato, y no lo decide nadie.** Eso era lo de *"queda
recortado"*. La foto del cierre iba `width:100%` con `max-height:74svh`
y `object-fit:cover`: en una pantalla ancha se agrandaba hasta el ancho
entero y después el alto la cortaba. **Medido: en un monitor de 1280 se
veía el 35% de la foto; en un teléfono con la barra del navegador, el
83%** —que es exactamente la captura que mandó—. Se topa el **ancho** y
no el alto: así el alto sale de la proporción de la foto y se ve el
100% en cualquier pantalla. A sangre en un teléfono y como una columna
centrada sobre la banda oscura en un monitor, que es lo que ya hace la
portada entera de `mia15` y se lee editorial.

**Y el velo hubo que volver a medirlo**, porque lo que cae debajo del
texto cambió: antes se medía contra un recorte y ahora contra la foto
entera. Es el punto ciego de siempre —`.cierre-foto` trae su propio
`background-color` opaco, así que el medidor compartido informa
champagne sobre antracita y da un número perfecto y falso—, así que se
mide a mano con `pruebas/png.js`, escondiendo los HIJOS del texto y no
el contenedor, que se llevaría el velo. Da **5,93 a 6,80:1** en los
cuatro aparatos.

**Lo que NO se pudo arreglar: la canción no arranca del principio.**
Pedido del dueño, y el archivo no da. Medido con `ffmpeg`: los
primeros 0,4 s son el fundido de entrada y **del 0,4 en adelante entra
a todo volumen** (−17,6 dB, lo mismo que en el minuto uno), o sea que
empieza en medio de una frase; el final, en cambio, baja solo
(−21,7 dB), así que lo que falta está al principio y no al final. El
audio salió de un video que el dueño mandó y ese video arrancaba con
la canción empezada. **No se baja de ningún lado**: es una grabación
comercial, y vale lo ya escrito. Hace falta que mande el tema desde el
principio; cambiarlo es reemplazar los dos archivos y nada más.

#### La escena de la fecha: foto, arco y foto

*"Proba este diseño con esas fotos"*, con la referencia —una foto a
sangre arriba, un ARCO oscuro montado encima con el calendario adentro
y el día marcado con un corazón, y otra foto a sangre abajo— más la
foto de las manos y una **foto nueva de los dos en el lobby de un
hotel**, que entró como `fotos/juntos.webp` (900x1490, 69 KB, el
original queda entero: el blanco y negro va en el CSS).

**Lo que hace que se lea como UNA pieza es que el arco SE SUPERPONE a
las dos fotos.** Pegadas borde con borde son tres rectángulos
apilados. El arco ya existía; lo que faltaba era la escena.

**La foto de las manos se mudó de `#invitacion` a `#fecha`** y con eso
no cambió de lugar en la pantalla —las dos secciones son de papel y
van una detrás de la otra—, pero ahora el arco puede montársele
encima.

**EL ARCO VA ARRIBA EN EL APILADO, y eso no es un detalle de gusto**:
la foto de las manos se funde con el papel con
`mix-blend-mode:multiply`, así que dibujado DEBAJO el arco sería el
fondo de esa mezcla y las manos se multiplicarían contra el antracita
hasta desaparecer. El `isolation:isolate` de `.manos` mantiene la
mezcla adentro de su caja y el arco la tapa por delante.
Medido con el píxel, de paso: el blanco de la foto multiplicado da
**exactamente** el papel (246,241,232 de los dos lados, ni un píxel más
claro en toda la banda), así que no hay ninguna juntura a lo ancho.

**Cuánto monta se eligió mirando LAS FOTOS, no la referencia.** Arriba
el arco sube 68 a 94px, que es lo que deja al antebrazo tatuado debajo
de la cúpula y a las manos enteras arriba; abajo baja 20 a 30px, que
es lo que el aire que la foto tiene sobre las cabezas aguanta sin que
el pie del arco les tape la cara. **Un encuadre no se mira solo: se
mira con lo que le va a caer encima** — es la misma lección de las dos
caras tapadas de `ambar15`, ahora por el lado del borde y no del
texto.

**El manuscrito pasó a vivir ADENTRO del arco**, como en la
referencia, y su texto viaja en un `data-` de `#calendario`: el JS le
pisa el `innerHTML` entero, así que escrito como hijo en el HTML se
perdería sin que nada avise.

**Y el ancho se topa**, igual que en el cierre: a sangre en un monitor
la foto de los dos mediría 2100 de alto. Topada en 440, en un teléfono
llena el ancho y en un monitor queda como una columna centrada con el
arco —más angosto— encima.

##### El corazón del día se quedó en `scale(0)`, y no avisó

El arco dejó de llevar su propio `.ap` —entra con la escena entera, que
es lo que hace que la composición no aparezca en tres pedazos
escalonados—, y el latido del corazón colgaba de
`#calendario.entro`. Sin ese `.entro`, el corazón se quedó en
`scale(0)` **para siempre**: lo que quedaba era el número del 22
flotando en un rectangulito blanco, perfecto y al revés. Ningún error.
Ahora cuelga de la SECCIÓN (`#fecha.entro`), que nunca está escondida
— es *el que se mira no puede ser el que se esconde* otra vez.

**Y ahora se mide**, genérico y por la CAJA de verdad y no por que el
nodo exista: la marca del día marcado tiene que llegar a 20x20. Se
saltea sola en una invitación cuyo calendario no dibuja marca.
Verificada rompiéndola a propósito: da **1 falla**, *"la marca del día
está dibujada (0x0)"*.

**Y la primera versión de esa comprobación inventaba la falla**:
preguntaba sin haber scrolleado hasta el calendario, y quien destapa es
un `.entro` que pone el observador, que avisa en otra vuelta del reloj.
Sin llegar, la marca da 0x0 esté bien o mal el código. Es la regla ya
escrita para la comprobación de los controles tapados —*preguntaba sin
llegar*— por segunda vez en la misma suite.

#### La tira de fotos, sobre papel y con su filete dorado

*"La primera foto quiero que lleve el estilo de la segunda. Igual los
marcos pero con el borde dorado del código que te pasé (#b79a68) y el
fondo sea color marfil (#f6f1e8)"* — con la captura de la tira
publicada y una referencia donde las tres fotos van sobre una banda de
papel claro.

Los dos colores que pidió **son los que ya tiene la pieza**:
`--oro` es `#B79A68` y `--marfil` es `#F6F1E8`, o sea la paleta que
mandaron los novios. No entra ningún color nuevo.

**Lo que la hace leer como tres copias apoyadas —y no como tres
recortes pegados— son las dos cosas juntas**: el marfil que las separa
y las rodea, y el filete. Con el marfil solo son tres fotos flotando;
con el filete solo, sobre el antracita, el dorado casi no se despega
del fondo. Por eso el pedido trae las dos.

**La banda va A SANGRE y el papel nace y muere con ella.** No es un
cambio de SECCIÓN, así que ahí no entra ningún borde rasgado: ésos los
pone `rasgar()` sólo donde cambia el color de una sección, y los dos de
`#galeria` siguen donde estaban.

**El `padding` del bloque y el `gap` son lo mismo** —el margen del
passepartout—, escritos aparte porque el de los costados descuenta el
medio píxel del filete: si uno cambia, se miran los dos.

**Y el filete no lo juzga el medidor de contraste**, porque es un
borde y no texto. El marfil de la banda sí entra en la cuenta de todo
lo que cae encima, y ahí no cae ningún texto: lo único que hay adentro
son las tres fotos.

#### La canción arranca sola apenas se entra

*"Que la música suene apenas entras a la invitación."* Acá no hay
sobre que abrir —se lo sacó el dueño el 01/11— así que no existe el
gesto con el que la canción arranca en `ambar15` y en `magali15`.

**Y el navegador la va a bloquear, que es lo normal en un teléfono**:
ni Safari ni Chrome dejan sonar nada antes de que la persona toque
algo. Medido acá: el Chromium de las pruebas la bloquea igual.
Así que son **dos caminos y hacen falta los dos**: se intenta al
cargar, y si rebota suena con el **primer gesto** que haga la persona,
en cualquier parte de la pantalla. Desde afuera eso es "apenas
entrás", porque nadie mira una invitación sin tocarla.

**Un scroll no alcanza**, y por eso no está en la lista de gestos: el
navegador no lo cuenta como activación para esto. Los que sí valen son
el toque y la tecla (`pointerdown`, `touchend`, `click`, `keydown`).

**Y el primer toque en el propio reproductor no cuenta.** El oyente va
en CAPTURA, o sea que corre antes que el botón: sin cuidarlo, el toque
arranca la canción y después el `click` del play la encuentra sonando
y la pausa — el botón se vería muerto justo en el único toque que de
verdad lo usa. Se desarma y se deja pasar.

**`preload="metadata"` se queda.** Bloqueada la primera vez, los 2,3 MB
no se bajan hasta el gesto; y cuando suena, el audio arranca mientras
se sigue bajando.

**Lo que mide la suite es lo que hace la PÁGINA, no lo que decide el
navegador**: comprobar "suena" mediría la política de Chromium. Se le
pisa `play()` y se cuenta. Tres cosas: que al cargar se INTENTE sin
que nadie toque nada; que, bloqueada, suene con el primer toque en
cualquier parte; y que si ese primer toque cae en el play el botón no
quede muerto. Se saltea sola en una invitación sin canción, y en una
**con sobre** —ahí el gesto es abrirlo y eso ya está medido—.
Verificada rompiéndola a propósito: sacar el arranque da **2 fallas**
y sacar la exención del reproductor da **1**.

#### Los detalles, en UNA cápsula

*"Que esas dos tarjetas estén dentro del modelo ese de la primera
foto"*, con la referencia: una sola pieza de papel con los extremos
redondeados y los dos bloques adentro. Dos recuadros sueltos sobre la
banda oscura se leen como dos avisos; una cápsula se lee como una
tarjeta. Es el mismo armado que ya tiene `magali15`.

**El radio horizontal va en porcentaje y el vertical en una medida que
sigue al ANCHO, no al alto.** La mitad está escrita en `magali15`: los
dos en píxeles dan un semicírculo en una pantalla angosta y una cúpula
en una ancha. La otra mitad es nueva y aparece acá porque **adentro
hay dos bloques de texto**: un vertical en porcentaje se mide contra
el ALTO, así que una línea más y la cúpula crece. La altura de la
cúpula es una decisión de forma y tiene que depender de lo ancha que
sea la tarjeta, no de cuánto texto le toque.

**Y la cúpula se eligió MIRANDO.** La primera versión tenía el radio
vertical en la mitad y lo que se veía no era una cápsula: era una
lápida con las esquinas apenas redondeadas. En la referencia el alto
de la cúpula es como tres cuartos de la mitad del ancho; con la mitad
de eso el gesto no existe. No se ve leyendo el código.

**El relleno de arriba y abajo tiene que ser más alto que una tarjeta
común**: con el de antes, el primer icono aterriza sobre la curva.

**Va en una sola columna siempre**, y por eso además se topa el ancho
en 460: en dos columnas la cápsula queda ancha y baja y los extremos
redondeados se leen como un botón gigante. La referencia es una
cápsula vertical.

**Lo que separa a los dos bloques es el aire**, como en la referencia:
una raya en el medio volvería a partir en dos lo que la cápsula vino a
juntar.

**Y el `.ap` pasó a la cápsula.** Lo tenían las dos fichas, con sus
retardos escalonados: una pieza continua que aparece en dos pedazos
se lee como un error de carga. Es la misma decisión que la escena de
la fecha.

#### Más verde, que es uno de los cinco que mandaron

*"Necesito que agregues más del verde solicitado porque todo es
mayoría blanco y grafito."* Tenía razón, y la cuenta lo dice: de las
trece bandas de la invitación, diez eran crema y tres grafito. El
verde salvia era uno de los cinco colores que mandaron los novios y
había quedado sólo en los círculos del dress code.

**La banda verde NO es una piel nueva: es la oscura con otro fondo.**
El camino obvio —una tercera piel con sus propias reglas de tinta— es
el que ya falló cuando la salvia era una de tres: son quince reglas
`.tinta X` que hay que repetir, y a la que se escape le queda el texto
invisible. Acá el fondo viaja en una variable (`--banda`) y `.verde`
sólo la cambia, así que **toda** la tinta de la banda oscura —el
rótulo champagne, el cuerpo, los filetes, los botones— sigue valiendo
sin tocar una línea.

**Y la banda es la salvia HONDA, no la clara.** Calculado antes de
escribir una línea de CSS: sobre `--salvia` (#A3AD95) el champagne da
**1,4:1** y el oro **1,9:1**, o sea que el rótulo de cada sección no
estaría. `--verde-banda` (#46513C) es el mismo tinte bajado de
luminosidad: marfil 7,6:1, champagne 5,0:1, oro 3,2:1. La salvia clara
se queda donde es un DATO —los círculos del dress code— y la banda usa
la honda.

**Dónde va, y es una decisión de ritmo.** Tres bandas —la galería, los
detalles y el contacto— **y el ARCO del calendario**, que es la pieza
más grande de la mitad de arriba y donde la invitación era toda crema
de punta a punta. El arco costó una línea porque su tinta ya era la de
la banda oscura. Y no van dos verdes pegados: `#timing` también era
candidato y está justo antes de la galería, así que los dos juntos
serían un solo bloque verde en vez de un ritmo.

**El rasgado tuvo que aprender a contar hasta tres.** `rasgar()`
preguntaba "¿es papel?" y pintaba el borde en antracita o en marfil:
con el verde puesto, una banda verde contra una de papel se rasgaba en
**antracita**, o sea una raya negra entre dos colores que no son el
negro. Ahora se pregunta por el COLOR, no por la piel.

#### Las flechas del visor no respondían, y se dibujaban perfectas

*"No está bien puestas las flechas para pasar las fotos."* Medido con
`elementFromPoint`, que es lo único que no miente: en un teléfono,
**quien atajaba el dedo en el centro de las dos flechas era la IMG**.
O sea que no se podía pasar de foto, con los dos botones dibujados y
sin un solo error en la consola.

**El culpable es el `filter` de la foto.** Un elemento con filtro se
pinta **en la capa de los posicionados** aunque no esté posicionado; la
foto lleva `grayscale(...)` y viene DESPUÉS en el HTML, así que le
ganaba a las flechas, que son `absolute` sin `z-index`. Un `z-index:2`
lo arregla. **En un monitor no pasa** —ahí la foto no llega al borde y
las flechas quedan en el negro de los costados—, y por eso nadie lo
vio: es la regla de siempre, lo que se mide angosto se rompe angosto.

**Y el disco de la flecha pasó de claro a oscuro.** Puesta por encima
de la foto, una flecha marfil adentro de un disco al 10% de marfil
desaparece sobre cualquier zona clara de la imagen.

#### Y en un teléfono lo que se hace es DESLIZAR

Las flechas quedan en los dos bordes de la pantalla y acertarles con
el pulgar es un trámite. **Dos cosas se comían el deslizamiento y
ninguna tira un error**, las dos medidas —llega el `pointerdown` y el
`pointerup` no llega NUNCA—:

- **Un `<img>` es arrastrable de fábrica.** El dedo que empieza encima
  de la foto inicia un arrastre nativo y el navegador se queda con el
  gesto. Pasa igual en un escritorio con el mouse. Se apaga con
  `-webkit-user-drag:none` y el `draggable="false"`.
- **El `touch-action` del contenedor.** Sin `pan-y`, el navegador toma
  el gesto horizontal por un paneo y en vez del `pointerup` manda un
  `pointercancel`. Es la misma trampa que ya costó una vuelta en el
  carrusel del sitio, **del otro lado**: allá había que CANCELAR el
  toque y acá hay que quedarse con él.

**Y el deslizamiento cancela el click que viene después**: sin eso, un
dedo que arranca sobre la foto y termina sobre el fondo dispara el
`click` del fondo y el visor se cierra justo cuando la persona quiso
pasar de foto.

**Lo mide `pruebas/invitacion_mirar.js`**, y hubo que ABRIR el visor
para medirlo: cerrado, sus flechas no las ve ni el barrido de los 44px
ni el de los controles tapados. Con cada foto abierta se pregunta
quién ataja el dedo, y después se arrastra y se exige que la foto
CAMBIE —no que exista un oyente—. Se saltea sola en una invitación sin
visor. Verificada rompiendo las dos cosas a propósito: sacar el
`z-index` da **1 falla** (*".ant lo tapa IMG"*) y dejar la foto
arrastrable da **1** (*"deslizando no pasa nada"*).

#### Once cambios de una vez, y tres que no eran lo que parecían

Pedido del dueño el 07/11/2026, en una lista. Nueve son de texto y de
sacar cosas; tres obligaron a decidir algo.

**Lo que se sacó, y por qué cada cosa deja un agujero que hay que
tapar:**

- **El nombre de la canción.** Estaba debajo del reproductor (*"Es
  Bellísimo así, de Laura Pausini"*). Se fue el renglón, y con él la
  tarjeta entera de *"Nuestra canción"*, que era lo mismo dicho otra
  vez. **El reproductor sigue sonando**: lo que se cambió es que ya
  no depende del NOMBRE para dibujarse —lo decide que haya archivo—,
  porque atar el reproductor a un dato que ya no se ve es dejarlo
  colgado del próximo que borre esa línea. El nombre y el autor
  quedan en el `CONFIG` con un comentario: son el dato de qué archivo
  suena.
- **Los colores de la boda.** La fila de círculos de la paleta. La
  paleta de ellos sigue entera en la pieza —los rótulos, los filetes,
  las bandas—; lo que se fue es decirla como un dato. Con eso se fue
  también su CSS, que si no queda dando vueltas sin que nadie lo use.
- **"Un tema que no puede faltar"**, el campo del formulario. Una
  columna menos en la planilla, y el aviso de datos **tuvo que
  cambiar con él**: decía *"podés confirmar sin decir nada de la
  comida ni de la música"* y ya no hay música que decir. Es la regla
  que ya está escrita para `mia15`: si se agrega o se saca una
  pregunta, ese párrafo se mira.
- **"Con ustedes mirando"** y **"Después de un montón de años
  juntos"**, las dos frases que no los convencían. La segunda se
  reescribió entera: *"Elegimos una fecha, un lugar y la gente que
  queremos cerca. Esa noche nos damos el sí, y después se baila."*

**Y LA CÁPSULA NO ERA SACAR UNA FICHA Y YA.** Con la canción afuera
queda un solo bloque adentro, y el relleno y la cúpula estaban
medidos para dos: lo que se veía era un huevo de papel con tres
renglones en el medio. Van los dos a dos tercios y el ancho se topa
más angosto. **Y el título de la sección, que decía "Dos cosas",
pasó a mentir**: ahora dice "Dress code", que es lo que quedó —y el
rótulo de adentro, que decía lo mismo, se fue.

**Las iniciales van al revés** y ahora salen de **una sola función**
(`inicialesAlReves`): las usan el monograma de la portada y la foto
del cierre, y escritas dos veces el día que se cambie una la pieza
muestra dos monogramas distintos.

**"Facu y Maxi"** reemplaza a "Facundo y Maximiliano" en todos lados
—el título, la vista previa, la portada, el cierre, el aviso de datos
y los textos alternativos de las fotos—. Las iniciales no cambian,
porque salen de `CONFIG.quien`.

**Las preguntas se fueron al final**, después del contacto y antes
del cierre. No hubo que tocar ningún borde rasgado: los pone
`rasgar()` y sólo donde cambia el color de la sección.

**La fecha límite va debajo de "así armamos las mesas"**, y **se
sigue sin inventar**: no mandaron el día exacto, así que se escribe
lo que SÍ dijeron —*"durante marzo de 2027, confirmamos el día
exacto"*—. El renglón vive en `CONFIG.confirmarPlazo`; el día que
llegue la fecha se llena `confirmarHasta` y pasa a decir *"La fecha
límite para confirmar es el …"*. Una fecha puesta a ojo le cierra las
mesas al invitado el día que no es.

##### La foto de las manos: lo que costó no fue sacarla, fue con qué

*"Cambiar la foto de las manos"*, y el inventario tenía una sola foto
sin usar — la del mar, que resultó ser **casi la misma** que la del
cierre: mismo día, mismo lugar, misma pose. Puesta grande en la
escena de la fecha, la invitación cerraba con la misma imagen dos
veces.

Lo que entró en su lugar es **la de ellos dos MOSTRANDO los anillos**,
que dice lo mismo que las manos y además son ellos; **y sale de la
tira**, porque la misma foto grande en la escena y chica tres
secciones más arriba se lee como un error de maqueta. La del mar
estrena el hueco que dejó en la tira, donde va chica y no le compite
al cierre.

**Cuál foto va arriba y cuál abajo NO es indistinto**, y es la regla
que esta misma invitación ya tenía escrita: el arco se monta sobre el
PIE de la de arriba y apoya su base sobre la CABEZA de la de abajo.
Arriba va una con aire abajo —acá la mesa— y abajo una con aire
arriba. La del mar no servía arriba por eso: el arco le cortaba el
mentón a uno de los dos.

**Y se fue con ella el `mix-blend-mode:multiply`**, que no era un
efecto general: era de ESA foto, para que su fondo blanco de estudio
se fundiera con el papel. Dejado puesto sobre una foto normal, la
oscurece contra el fondo sin que nada avise.

### `magali15/`: la cuarta de un cliente — Magali

13 de febrero de 2027 · Salón Valmar · de 21 a 5 h. Quince años.
Alias `magali.loor`, dress code **Elegante sport** —*"el outfit con el
que te sientas más cómodo para bailar toda la noche"*— y dos colores
que mandó escritos: **#7B5354 y #3D2E2B**.

**La portada es el armado de SU PROPIA TARJETA.** El dueño mandó la
captura de la invitación de Canva que ella ya tenía: "MIS XV" en
capitular espaciada y **"Magali" en una manuscrita grande cruzándolo
por encima**. Eso es la portada, y el cruce es lo que la hace — sin él
son dos renglones apilados. El margen negativo que lo produce va en
`em` y no en píxeles: en `em` se mueve con la letra, así que el cruce
es el mismo en un iPhone SE y en un monitor. Y el `em` es el **del
elemento**: escrito en el padre se resolvería contra los 16px del body
y el cruce no existiría, que es la misma trampa del borde de letra de
`mia15`.

**Y "una planta entre secciones"**, con esas palabras. El lugar es la
cumbre de cada corte en curva, que es exactamente donde iba la
filigrana de rombos de `almi15`: la curva ya dice que empezó otra cosa
y la planta es lo que la remata.

#### De las cinco tipografías que pidió, TRES no existen

Pidió *"Gilda display / Parfumerie script pro / Frasa display / Bebas
neue / Bright"*. Comprobado contra `fonts.googleapis.com`: **Gilda
Display y Bebas Neue contestan 200; Parfumerie Script Pro, Frasa,
Frasa Display y Bright contestan 400.** Son de Canva o comerciales y
no se pueden servir desde acá — y meterlas en el `<link>` igual no
tira ningún error: el navegador cae a la letra de respaldo del sistema
y la pieza sale con otra tipografía sin que nadie se entere.

Así que van las dos que existen y **la manuscrita se eligió MIRANDO**,
montando la misma portada con seis candidatas (`pruebas/letras.js`).
Quedó **Mrs Saint Delafield**, que es la que reproduce el cruce de
swashes de la referencia. Es la misma forma de trabajar que ya está
escrita para la tipografía de `mia15`, para el monograma y para la
bolsa de `ambar15`: *mostrar, no describir*. "Bright" —que es un sans
de texto— se reemplaza por Hanken Grotesk, que es la del resto del
proyecto.

**Gilda Display viene en UN solo peso (400) y SIN bastardilla.** Los
cinco `font-weight:500` que heredaba la pieza y los tres
`font-style:italic` eran, los ocho, pedirle al navegador que invente
una negrita o una oblicua — y eso no avisa. Los pesos bajaron a 400 y
**lo que iba en cursiva pasó a la manuscrita**, que además es el gesto
de la referencia: capitular más letra escrita a mano. El arreglo y el
diseño van para el mismo lado.
Y los rótulos chicos en versalitas van en **Bebas Neue**, que es la
otra que pidió y la única de las cinco que sirve para eso: no tiene
minúsculas y acá está todo en mayúsculas igual. Sube un punto de
tamaño porque es condensada, y va en 400 por lo mismo de arriba.

#### Los dos colores que mandó, uno sobre el otro, dan 1,99:1

O sea que **el texto no está**. Calculado, no opinado. Por eso la
paleta tuvo que CRECER, exactamente como ya había pasado en
`facuymaxi`:

- **#3D2E2B** es la banda oscura y la tinta sobre el papel (10,8:1).
- **#7B5354** es el acento **sobre el papel** (5,47:1).
- **#C9A3A4**, un malva claro, es el acento **sobre la banda oscura**
  (5,70:1). El de ella ahí daría 1,99; el claro sobre el papel daría
  1,97 — la misma trampa dada vuelta.
- **#F2E9E3** es el papel y **#6B5856** el gris de los párrafos
  (5,56:1).

Es la regla de siempre: *si un bloque trae su propio fondo, trae su
propia tinta*. La suite mide 32 textos y el más flojo da **5,47:1**.

#### El dibujo del salón reemplaza al medallón

Lo mandó con la referencia: el lugar se anuncia con el dibujo del
salón en línea, no con un icono genérico. Así que el dibujo **ocupa el
lugar del medallón** de "dónde nos vemos" — donde el bloque trae su
propio emblema, un medallón arriba son dos emblemas apilados, que es
la misma decisión ya tomada en `ambar15` con el pase VIP.

**Va con el fondo blanco SACADO y las líneas teñidas** en el malva de
la clienta: puesto tal cual, un rectángulo blanco en el medio del
papel crema se ve a la legua. Pesa 74 KB. Y se pone recién cuando el
archivo CARGÓ de verdad, y recién entonces se saca el medallón: si
faltara queda el pin dibujado, que se sostiene solo, y nunca un
cuadrado roto arriba del título.

#### La planta se eligió mirando, y tiene dos reglas

Se montaron **ocho armados** al tamaño al que se ve de verdad (132px)
sobre el papel y sobre el marrón. Ganó la rama doble con hojas
alternadas y un brote en el medio. Las dos cosas que la hacían fallar
no se ven leyendo el código:

- **Una hoja SALE del tallo, no lo cruza.** La elipse va corrida casi
  un radio entero a lo largo de su eje; centrada en el tallo lo
  atraviesa y lo que se ve no es una hoja, es un lazo. La primera
  versión eran nueve lazos.
- **Y las hojas no se tocan entre ellas.** Amontonadas, el conjunto se
  lee como una greca y no como una planta: las de afuera van más
  chicas y más separadas.

#### Una capa de foto VACÍA es un velo opaco sobre la portada

Lo más caro de esta pieza, y no tiraba ningún error. `.port-foto` es
un `position:absolute` con fondo **opaco** que existe siempre, haya
foto o no. Y una capa posicionada pinta por encima de todo lo que
**no** está posicionado: lo que lleva `.ap` se salva —su `transform`
le arma su propio contexto— y lo que no, desaparece.

Acá desaparecieron dos cosas. El **swash de abajo del nombre**, que se
dibujaba perfecto —con su color, su geometría y su caja en el lugar
justo, comprobado con `getBoundingClientRect`— y no se veía; y el
**degradé de la portada**, que quedaba tapado por un marrón plano.
Media hora buscando por qué un trazo que el DOM declara dibujado no
aparece en la captura. Ahora, sin foto, esa capa **se saca**.

Es la caja de 0x0 otra vez, al revés: la caja estaba, lo que faltaba
era que se PINTARA. Y vale para cualquier invitación con una capa de
foto condicional.

#### Y un color de la piel vieja sobrevivió URL-encodeado

El barrido de colores pedía todos los `#RRGGBB` del archivo y exigía
que estuvieran en la paleta nueva — y daba limpio. Pero la flecha de
los `<select>` es un SVG en un `data:` URI, donde el `#` va escrito
`%23`: ahí quedó el **dorado** de la pieza anterior, el único amarillo
de toda la tarjeta, en la pantalla donde el invitado confirma. Se ve
en una captura y no se ve en un `grep`. Un barrido de colores tiene
que pedir las dos formas.

#### Lo que NO se inventó

- **La dirección del salón.** La mandó el dueño el 05/11/2026 —**Salón
  Valmar, Campo Timbó**— y recién ahí se escribió. Hasta ese día el
  renglón de la calle no se dibujaba: mandar a los invitados a una
  calle adivinada no se arregla la noche de la fiesta, y el link corto
  de Google que había desde acá no se puede resolver porque el proxy
  lo rechaza.
- **El titular de la cuenta** del alias `magali.loor`: sin él ese
  renglón no existe. Y el alias se escribe **tal cual lo mandó**, sin
  "arreglarle" nada: en `mia15` el punto del final resultó ser parte
  del alias.
- **El valor de la tarjeta ($50.000) sale de SU PROPIA tarjeta de
  Canva**, no del mensaje del dueño; queda anotado para que se sepa de
  dónde salió y se pueda sacar con una palabra. **La fecha para
  confirmar la mandó el dueño** el 05/11/2026: 10 de enero de 2027.
- **La primera línea de "¿Venís?" es de ella**, también de su Canva:
  *"Tu compañía hace que este día sea aún más especial."* Es su voz y
  no la nuestra.

#### "Forzá las fuentes": dos son de ella y tres no existen para web

Segunda vuelta del dueño: *"quiero que fuerces lo de utilizar esas
fuentes, son requisitos de la cumpleañera"*. Se forzó todo lo que se
puede forzar, y lo que no se puede queda escrito con su precio:

- **Gilda Display y Bebas Neue son de ella y están puestas.** Esas dos
  existen y son gratis.
- **Parfumerie Script Pro es PAGA.** La vende Typesenses en MyFonts y
  Fontspring, y la licencia web se compra aparte. Publicarla sin
  licencia es el mismo problema que publicar el logo de otro: es un
  problema nuestro, no de la clienta.
- **Frasa Display y Bright no existen como fuente web**: son de Canva,
  cuya licencia cubre usarlas adentro de Canva y no incrustarlas en un
  sitio. El papel de Frasa Display —una serif de display— lo hace
  Gilda Display, que también pidió ella; el de Bright —un sans de
  texto— lo hace Hanken Grotesk.

**La manuscrita se volvió a elegir MIRANDO**, ahora contra doce
candidatas y buscando lo que tiene Parfumerie: contraste fuerte,
formas redondas y swashes en las capitulares. Quedó **Great Vibes**,
que es más gruesa y más redonda que la primera elección (Mrs Saint
Delafield, que al lado de su tarjeta se ve un pelo fina). Al cambiarla
hubo que bajar un escalón los tres lugares donde vive: Great Vibes
llena mucho más la caja, así que el mismo tamaño en píxeles se ve
bastante más grande.

**Y el día que se compre la licencia web de Parfumerie Script Pro esto
es UNA línea**: el archivo va en la carpeta, su `@font-face` al lado
del `:root` y `--mano` pasa a nombrarla. Para eso las familias viven
en variables y no escritas quince veces en el CSS. Lo que NO se hace
es bajar el archivo de cualquier lado y subirlo igual.

#### La canción suena

El dueño mandó el tema —*Loving Life Again*, de Ella Langley— con
*"ese es el tema que debe sonar, poné un reproductor"*. Es el mismo
reproductor de `ambar15` y `facuymaxi`: **tres mandos y los tres hacen
algo** —con una sola canción, los de los costados vuelven al
principio—, la línea con la flor es el AVANCE y va declarada
decoración, **suena una sola vez** y al terminar **se rebobina** (
parada en el final, el primer toque del play no sonaría, y eso no tira
ningún error: sólo un botón que parece roto).

**Arranca con el toque que abre el sobre.** Safari no deja sonar nada
sin un gesto de la persona, y ese gesto ya existe: no hace falta
inventarle otro botón ni dejar la invitación muda esperando que
alguien descubra el play.

Van **dos archivos y UNA sola descarga**: AAC para el iPhone —que es
donde están los invitados— y Opus para el que no puede con ese
formato. Con `preload="metadata"` no se baja nada hasta que alguien
toca el play. Y el largo del tema va **escrito en el CONFIG**: un Ogg
todavía sin bajar entero devuelve `Infinity` de duración y ahí la
rayita del avance se queda clavada a la izquierda toda la canción.

**El archivo NO es nuestro**, y vale la misma excepción ya escrita
para `ambar15` y `facuymaxi`: es una grabación comercial publicada en
una dirección nuestra. Lo decidió el dueño y se le dijo. Lo que no se
afloja es la mitad técnica: ningún reproductor de un tercero, que la
CSP no lo deja y además sería un tercero corriendo código en la
pantalla del invitado.

#### Los detalles, en UNA cápsula

Pedido con una captura: el dress code, el valor de la tarjeta y el
regalo dejan de ser dos tarjetas sueltas sobre la banda oscura y pasan
a ser **una sola pieza de papel con los extremos redondeados**, con su
guirnalda arriba y abajo y los tres bloques separados por una ramita.

- **El radio va en PORCENTAJE** —50% del ancho por 9% del alto—, no en
  píxeles: escrito en píxeles se vuelve un semicírculo en una pantalla
  angosta y una cúpula en una ancha.
- **El relleno de arriba y abajo tiene que dejar entrar la
  guirnalda**: es una capa absoluta, así que no empuja a nadie, y sin
  ese aire se le monta al primer título.
- **El botón va MACIZO y no de contorno.** Adentro de la cápsula —que
  es papel crema dentro de una sección oscura— el contorno hereda una
  tinta pensada para la banda oscura y no se lee. Es la regla de
  siempre, y acá además es lo que pide la referencia.
- **El valor es un DATO, no una frase.** La primera versión decía *"El
  valor de la tarjeta es de $50.000."* abajo de un título que ya dice
  "Valor de la tarjeta": dos veces lo mismo, y encima partido en dos
  renglones. Dice **$50.000**.
- **Y el bloque del regalo se fue: son DOS bloques, no tres.** Lo pidió
  el dueño el 05/11/2026 —*"la parte del regalo hay que sacarla, poner
  sólo valor de la tarjeta y abajo el alias"*—. Tiene razón: el alias
  es dónde se paga el valor que está justo arriba, así que partidos en
  dos se leían como dos pedidos de plata distintos. Ahora el bloque
  desaparece sólo si no hay NI valor NI alias: escondido por falta de
  valor se llevaría puesto el único dato para transferir.
- **El cierre va al revés: primero "te espero el 13 de febrero" y abajo
  el nombre.** También del 05/11. El renglón chico es la frase y el
  manuscrito grande es la firma, que es el orden en que se escribe una
  tarjeta a mano.
- **Y ahí la M del nombre salía CORTADA.** Lo vio el dueño. Los swashes
  de la manuscrita suben bastante más que su línea —o sea que la letra
  se sale de su propia caja— y el telón de `.ap` recorta JUSTO en la
  caja: la M quedaba cortada al ras, sin un solo error y perfecta en
  todo lo demás. Se arregla dándole aire arriba al bloque, con un
  margen negativo que le devuelve el lugar para que en pantalla no se
  mueva nada. **Es la misma regla que ya costó una vuelta en `ambar15`
  con el corazón del reproductor: el que recorta no puede ser más chico
  que lo que tiene que mostrar** — y vale para cualquier manuscrita
  metida adentro de un bloque con telón.

#### El dibujo de flor del final, y por qué un adorno de esquina se queda en la esquina

También con una captura: una composición botánica en los rincones de
abajo del cierre. Sale del mismo **herbario** que la planta de los
cortes y la guirnalda de la cápsula —hoja, flor, capullo—, así que las
tres usan el mismo trazo y ninguna se queda atrás el día que se
cambie. La hoja es una **almendra** y no una elipse: a este tamaño una
elipse se lee como un lazo.

**La primera versión era alta y angosta y le cruzaba el texto.** El
tallo subía desde la esquina hasta pasarle por encima al nombre y al
"te espero": el dibujo se lee perfecto y el texto queda encima de una
flor. Un adorno de esquina tiene que quedarse en la esquina, así que
la composición pasó a ser **ancha y baja**.

**Y después quedaba cortada por la curva del pie.** Pegada al borde de
abajo, el arco oscuro del pie le comía la mitad de las flores — y una
flor cortada por una curva que no es suya se lee como un error de
maqueta. Se levanta sobre esa curva.

El rincón de la derecha es el mismo dibujo **espejado por CSS**: dos
dibujos para lo mismo es uno que se queda atrás. Y el cierre **perdió
su medallón**: la flor es su emblema, y dos emblemas apilados se leen
como un error de maqueta.

#### Va con su propia planilla, no con la central

Como decidió el dueño el 01/11/2026 —*"un sheet para cada fiesta,
siempre separado"*—. Por eso `CONFIG.evento` no existe y la dirección
de `lib/planilla.js` **no se carga**: con la central puesta y sin
pestaña, la planilla contesta `sin_evento` y el invitado ve un error
que no es suyo.

**IMPLEMENTADA el 05/11/2026.** El dueño creó la planilla, pegó
`apps-script/evento-nuevo.gs.txt`, corrió `preparar()` e implementó: su
`/exec` está en `CONFIG.endpoint` y en `magali15/listado/`, que se armó
copiando la plantilla con sus dos líneas de `CONFIG`.
`pruebas/invitaciones.js` falla si una carpeta de listado tiene el
`appsScriptUrl` vacío, porque esa pantalla no traería nada.

**Y conectarla destapó dos renglones que habrían ensuciado la planilla
de la clienta, los dos heredados de `almi15`, que va con la central.**
Ninguno tira un error:

- **`CONFIG.evento` acá no existe, y mandado igual viaja como la cadena
  `"undefined"`.** `fd.set('evento', CONFIG.evento)` le habría dejado a
  Magali una columna **"evento"** llena de `undefined` en su planilla: el
  `doPost` crea una columna con el nombre de cada campo que le llega. Va
  sólo si hay evento, igual que en `ambar15`. Lo mismo la pregunta de
  *"¿llegó lo mío?"*, que salía con `?evento=undefined&confirmado=…`.
- **La regla, que es la de siempre con otra cara**: una invitación nueva
  se copia de la anterior, así que lo que se queda viejo no es el código
  — es el renglón escrito para la planilla de la OTRA.

**Y volver a pegar el código CAMBIA la dirección si se crea una
implementación NUEVA.** Pasó el mismo día: el dueño volvió al editor a
llenar las dos claves y, en vez de *Administrar implementaciones →
editar → Versión: nueva*, hizo *Nueva implementación*. La `/exec` vieja
sigue viva y vacía, y la invitación publicada seguía apuntando ahí: la
confirmación entraba en una planilla que ya no mira nadie. **No tira
ningún error** —las dos direcciones contestan 200—, y desde acá se vio
porque la dirección nueva contestaba `sin_clave_configurada` y la vieja
no. El aviso ya estaba escrito en la cabecera del `.gs.txt`; lo que
faltaba era decirlo al entregar el código.

**Y la segunda mitad: pegar el código NO alcanza, hay que correr
`preparar()`.** Es lo que escribe las claves en las propiedades del
proyecto. Sin eso la puerta del listado contesta
`sin_clave_configurada` para cualquier clave, la maestra incluida —
mientras la confirmación del invitado entra perfecto, porque el
`doPost` no depende de ninguna clave. O sea: **el invitado anda y el
cliente no puede entrar a su tablero**, que es exactamente la clase de
falla que no se descubre hasta que alguien la busca. Es *un paso de
instalación que no se puede saltear sin que algo avise, se va a
saltear*, por tercera vez.

**El correo que mandó la clienta es la clave de su tablero**, cuarta
vez después de `mia15`, `almi15` y `ambar15`, y vale la misma
advertencia: un correo es público y adivinable, y lo que abre es la
lista entera de invitados con sus nombres y sus comidas. **En el
repositorio no va nunca**: como ésta tiene su propio proyecto, vive en
`CLAVE_ELEGIDA` de la copia del editor del dueño —no en
`CLAVES_ELEGIDAS`, que es el mapa de la central—, y `pruebas/rsvp.js`
falla si lo versionado deja de estar vacío.

**No está en la galería de Trabajos ni en `/invitaciones`**, por lo
mismo que las otras cuatro: es la fiesta de una clienta de verdad,
lleva `noindex` y en el formulario se juntan nombres de invitados y
comidas. Y lleva su propia `og.jpg` (1200x630, 33 KB), tipográfica:
nunca una foto de la fiesta, que viajaría en la vista previa de cada
chat por el que pase el link.

**No mandó ninguna foto**, así que la portada es la tipográfica —que
es justamente el armado de su Canva— y las dos franjas se esconden
enteras. El día que lleguen es un renglón en `CONFIG`; ahí hay que
sacarle la curva a la sección que sigue a la franja, y eso lo hace el
JS solo.

### `maricel50/`: los 50 de Maricel

Pedido del dueño el 08/11/2026: *"Maricel - Mis 50"*, canción *"Girls
just want to have fun"*, **Salón de eventos Mi Cande, Rondeau 75, Villa
Astolfi**, cuenta regresiva al **20 de diciembre de 2026**, tres fotos
(llegaron seis, pero eran tres repetidas) y un video de 20 s de ella con
la torta: *"que esté ese video en el reproductor y que suene esa
música"*.

**La base es `magali15/`** (sobre, curvas, cápsula, franjas,
confirmación entera) y **la cara es otra**: el tema lo pusieron la
canción y las fotos —anteojos de sol, el 50 dorado, remeras blancas,
mantel negro—. Negro, marfil, dorado y un fucsia de los ochenta;
**destellos** donde Magali tenía plantas, y en la cápsula **un par de
anteojos de sol**. Letras: DM Serif Display, Yellowtail (la manuscrita
retro, década de la canción) y Bebas Neue.

**El reproductor ES el video.** El `<audio>` de las otras pasó a ser un
`<video>` vertical en su pantallita, con los mismos tres mandos, que
arranca con el toque del sobre, suena una vez y se rebobina. Dos
detalles: `playsinline`, porque sin eso el iPhone lo abre a pantalla
completa apenas arranca —o sea, tapando la invitación al abrirla—; y
**el servidor de pruebas no sirve pedazos de archivo** (sin `Range`),
así que adelantar el video en una prueba lo manda al principio: el
"suena una vez" se midió acelerándolo, no saltando al final. Cloudflare
sí los sirve. `invitacion_mirar.js` mide la canción sólo si es un
`<audio>`, así que de este video dice "no trae canción": lo medí aparte.

**Sin hora.** Mandó el día y no la hora, así que `CONFIG.fiesta` va con
la fecha sola y ningún renglón dice una hora. Eso obligó a dos cosas: la
fecha sin hora se lee en UTC (`new Date("2026-12-20")` es el 19 a las
21 en Rosario), así que la cuenta va al principio de ese día con la
zona de acá; y el "Ya casi llega la noche" pasó a "llega el día".
**El 20/12/2026 cae domingo**: vale confirmarlo junto con la hora.

**Sin dress code, sin valor y sin alias**: la cápsula entera no se
dibuja. Las dos secciones claras que quedan pegadas (dónde y la
canción) se separan con el destello, y se ve como un corte.

**El marco de esquinas de la portada tipográfica no va con foto**: con
la foto puesta una esquina caía exactamente entre "MIS" y "50" y se
leía como un símbolo. Lo encontró la captura, no una prueba.

La frase de la confirmación —*"Cumplo 50 y los quiero festejar con
vos"*— es **nuestra**: no mandó ninguna.

#### Segunda vuelta (08/11/2026)

Tres pedidos del dueño: *"centrá un poco más la imagen de portada"*,
*"el video que se reproduzca en loop"* y *"la ubicación que sea la
dirección porque cuando abro la que pusiste no me aparece una ubicación
puntual"*.

- **La portada**: Maricel está un poco a la derecha del centro de la
  foto; el encuadre pasó a 57% y la foto sube menos, así entran las
  cabezas de atrás. Mirado en 390x844 y en 375x667.
- **El video va en bucle.** Es la excepción al "suena una vez" de
  siempre, y la pidió él: son 20 s y cortado ahí la sección se queda
  quieta.
- **El mapa busca la DIRECCIÓN**, no el nombre del salón: "Mi Cande" no
  da un punto. Va *Rondeau 75, Villa Astolfi, Pilar, Buenos Aires*: Villa
  Astolfi es de Pilar, y sin la localidad el buscador puede caer en otra
  Rondeau 75 del país. En la pantalla se lee tal cual la mandaron.

#### La planilla (08/11/2026)

Implementada por el dueño con su propia planilla, como todas desde el
01/11: su `/exec` está en `CONFIG.endpoint` y en `maricel50/listado/`,
que es la plantilla con sus dos líneas de `CONFIG`. La clave del
tablero la eligió él —`CLAVE_ELEGIDA`, en su copia del editor, nunca
acá— y se le dijo el riesgo: es el nombre de la carpeta, o sea que se
lee en el link de la invitación. **No se probó de punta a punta**: esta
sesión no tenía salida a `script.google.com`.

### `valentinaegreso/`: el egreso de Valentina

Pedido del 09/11/2026, con el formulario completado por la clienta:
**Valentina Ferreyra**, egreso, **5 de diciembre de 2026** (sábado),
**Club Atlético Unión Pampayasta Sud** con su enlace de Google Maps,
*"tonos lilas, blancos o negros"*, canciones *"Forever Young"* y
*"Sign of the Times"*. Una referencia del dueño: un sobre con un **sello
de lacre con un birrete**. Y la foto de la promo tirando las camperas.

**Base `maricel50/`, cara nueva.** Negro, blanco lila y dos lilas: el
hondo (#5E3591) es la tinta sobre el blanco y el claro (#C6AEE8) la del
negro. Cormorant Garamond, Pinyon Script —la manuscrita de la
referencia— y Cinzel para los rótulos. El sello pasó de 62 a 84 px,
lleva el birrete dibujado y un aro hundido de lacre; el nombre va
debajo, en la manuscrita, como en la referencia. En la cápsula, el
birrete reemplaza a los anteojos de Maricel.

**Lo que no llegó y no se dibuja**: la hora, el dress code (*"ahí le
paso bien"*), el alias y su titular (quiere regalos), las fotos (*"ya
se las paso después"*, más una de chica que ofreció) y los ARCHIVOS de
las dos canciones. La portada es tipográfica y la única franja es la de
la promo.

**Marcó que NO quería confirmación**, pero el dueño pidió la planilla y
ella mandó un correo de acceso, que es la clave del tablero. Quedó con
el formulario; sacarlo es vaciar una sección.


**La frase de la portada** (09/11/2026), pedida por el dueño con sus
palabras: *"¡Me egreso! Se termina una etapa hermosa y no me imagino
festejarla sin vos"*, debajo de la fecha. Va sin el emoji del birrete:
el birrete ya está en el sello.

**La planilla** (09/11/2026): implementada por el dueño, su `/exec` en
`CONFIG.endpoint` y en `valentinaegreso/listado/`. La clave del tablero
es el correo que mandó ella, en `CLAVE_ELEGIDA` de la copia del editor
(nunca acá). No se probó de punta a punta: sin salida a Google.

**La canción** (09/11/2026): llegó en un video y se sacó el audio
(AAC 96k + Opus 64k, 4:53). El reproductor es un **vinilo negro con
la etiqueta lila y el birrete**, que gira sólo mientras suena, y la
puntita del avance es **un birrete** —pedido del dueño—. El renglón
"Es ..., de ..." no se dibuja: eligió dos canciones y no sabemos cuál
es ésta.

**Tercera vuelta** (09/11/2026), tres pedidos del dueño:

- *"No pongas mis canciones. Solo el nombre"*: el título de la sección
  es la canción —**Sign of the Times**, con **Harry Styles** arriba— y
  el renglón de abajo no va, para no repetirlo.
- *"Falta el countdown… algún diseño lindo y sofisticado"*: la cuenta
  ya estaba, pero eran cuatro números con esquinitas y no se leía como
  algo. Ahora son **cuatro anillos lilas** que se cierran con su unidad
  (horas sobre 24, minutos y segundos sobre 60; el de los días va
  entero, con un punto en la cima). Los dibuja un bloque aparte que LEE
  lo que escribió el reloj: dos cuentas son una que se separa.
  **Trampa**: `vector-effect:non-scaling-stroke` rompe `pathLength` en
  Chrome — los anillos marcaban cualquier cosa (00 minutos dibujaba tres
  cuartos). Sin esa propiedad, y con el trazo en unidades del dibujo.
- *"La imagen… quedan personas afuera"*: la foto de la promo es apaisada
  y la franja era alta, así que se comía los costados. El marco ahora
  tiene **la forma de la foto** y el fundido de abajo es corto. Eso dejó
  la franja baja, y el paralaje se clavaba apenas salía de la pantalla
  (lo agarró `invitacion_mirar.js`): se sigue calculando una pantalla
  más allá, con un tope que no pasa del sobrante de la foto.

**Dress code y fecha límite** (09/11/2026), del dueño: *"elegante y en
tonos oscuros"* y *"tienen tiempo de avisar hasta el 2 de diciembre"*.
El renglón de la confirmación dice **hasta el 2** y no *"antes del 2"*,
que es como venía escrito de las otras: eso habría dejado el día 2 afuera.
