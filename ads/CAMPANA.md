# Campaña de Google Ads · todo lo que hace falta para seguirla

Este archivo existe para **abrir un chat nuevo y seguir desde acá** sin
volver a contar nada. No se publica: `ads/` y `*.md` están los dos en
`.assetsignore`.

Última actualización: **12/10/2026**.

---

## 1. Lo que ya está hecho

| Cosa | Estado |
|---|---|
| Cuenta de Google Ads en **modo experto** | hecha |
| Campaña **de Búsqueda** (no Máximo rendimiento) | creada |
| 3 grupos de anuncios con 29 palabras clave | cargados |
| 3 anuncios adaptables (RSA), uno por grupo | cargados, **en revisión** |
| Etiqueta de Google en la web | **puesta y andando** |
| Conversión "clic a WhatsApp" | **medida** |
| Política de privacidad actualizada por la etiqueta | hecha |
| 49 palabras clave negativas | **FALTA** (ver §7) |
| Facturación y el crédito de 300.000 | **FALTA** |
| Extensiones (vínculos, textos destacados, teléfono) | **FALTA** |

**Por qué Búsqueda y no Máximo rendimiento.** Google empuja PMax en el
alta y es lo peor que le puede pasar a una cuenta nueva: no deja ver por
qué palabra entró cada clic, así que no se puede aprender nada ni cortar
lo que no sirve. Con Búsqueda se ve el término de búsqueda real de cada
clic, que es lo único que hace que la campaña mejore sola. PMax recién
tiene sentido cuando ya hay conversiones suficientes para alimentarlo.

---

## 2. Los números de la cuenta

- **Presupuesto diario:** $2.000 (lo puso el dueño en el alta).
- **Estrategia de oferta:** Clics, con **tope de CPC de $600**.
- **Crédito promocional:** $300.000, pendiente de leer la letra chica
  (casi siempre es "gastá X en Y días y te acreditamos X"; si se vence
  sin gastar el mínimo, no se acredita nada).
- **Moneda:** pesos argentinos. **Zona horaria de la cuenta:** la del
  negocio, Rosario (UTC−3) — todo informe se lee desde ahí.

**Verificar en la cuenta, que no quedó anotado en su momento:**
ubicación segmentada (recomendado: **Argentina**, o Rosario + 50 km si
se quiere arrancar chico) e idioma (**español**). En Redes, **Socios de
búsqueda y Display tienen que estar DESTILDADOS**: en una campaña nueva
se llevan la mitad del presupuesto con clics que no compran.

---

## 3. La medición · esto es lo que más importa

```
ID de la etiqueta   AW-18506407119
Etiqueta de conversión   AW-18506407119/MLT-CPSS65gdEM-5xfhE
```

Las dos están escritas en `index.html` (`ADS_ID` y `ADS_CONV`).

**Qué se cuenta como conversión: el clic en cualquier botón de
WhatsApp.** No el clic en el anuncio —eso ya lo cuenta Google— ni la
visita. Sin esto Google optimiza para clics baratos en vez de para
clientes. Está enganchado con **un solo oyente en el documento** sobre
`a[href*="wa.me"]`, no botón por botón: los botones de WhatsApp se
dibujan en cinco lugares y alguno se iba a quedar sin contar.

**La etiqueta va SOLO en `index.html`.** En `muro.html` y `rollo.html`
no entra nunca: son las pantallas donde un menor saca una foto en una
fiesta, y no cargar terceros ahí es parte de lo que vendemos (es
exactamente lo que le criticamos al competidor, que mete píxel de Meta y
de TikTok con grabación de sesión). **Hay una prueba que lo cuida**
(`pruebas/ads.js`): si alguna vez aparece la etiqueta en una de esas dos,
la suite falla.

Esa misma prueba cuida la otra mitad: `privacidad.html` decía "no hay
publicidad, ni analítica, ni píxeles" y eso se volvió mentira en el
momento de pegar el ID. Ya está corregida —nombra la cookie `_gcl_aw` y
sus 90 días, y a Google como destinatario—. Frente a la Ley 25.326 una
política falsa es peor que no tener ninguna.

---

## 4. La estructura de la campaña

Campaña: **`Invitaciones · Búsqueda · AR`**
URL final de los tres anuncios: `https://clicketerno.com.ar/#invitaciones`
Rutas visibles: `/invitaciones/digitales`

| Grupo | Palabras | Intención |
|---|---|---|
| **Invitaciones digitales** | 11 (8 frase + 3 exacta) | genérica |
| **XV años** | 9 (6 frase + 3 exacta) | quinceañera |
| **Casamiento** | 9 (6 frase + 3 exacta) | boda |

**Solo frase y exacta, ninguna amplia.** La amplia con presupuesto chico
es tirar la plata: Google la estira hasta "tarjetas de cumpleaños para
imprimir" y se gasta el día en gente que no compra. Cuando haya datos
—200 o 300 clics— se puede probar una amplia suelta, con su propio grupo
y vigilada por el informe de términos de búsqueda.

El archivo para importar es **`ads/campana-google-ads.csv`** (81 filas:
49 negativas + 29 palabras + 3 anuncios). Se sube con **Google Ads
Editor** (Cuenta → Importar → Desde archivo), que es la única forma de
cargar todo de una.

---

## 5. Los anuncios

Tres RSA, uno por grupo, con **15 títulos y 4 descripciones** cada uno,
todos dentro de los límites (30 y 90 caracteres).

**El título 1 va fijado (pinned) en la posición 1** y es distinto en cada
grupo: es lo que hace que el que buscó "invitación digital 15 años" lea
exactamente eso en el anuncio. Lo demás rota libre, que es como Google
aprende cuál funciona.

**Diez de los quince títulos son propios de cada grupo.** Los cinco que
se repiten son a propósito —la firma y las tres promesas centrales—:

    Click Eterno · Rosario · Confirman desde el celular
    Diseño a medida, sin plantilla · Se abre como un sobre
    Un link por WhatsApp

Los ángulos, que es lo que diferencia un anuncio de un relleno:

- **Genérica** → *no es una imagen, es una web*. Pelea contra la
  tarjetita JPG que manda todo el mundo.
- **XV años** → *su foto, su música, la cuenta regresiva*. Es emocional
  y es de la quinceañera, no de la madre.
- **Casamiento** → *la logística*: quién viene, quién come qué, la lista
  a Excel. Es lo que de verdad desvela a los novios y ningún competidor
  lo dice.

Todo lo que dicen los anuncios **está en el producto**: la confirmación
por invitado, el campo de alimentación por persona, la exportación a
Excel, la cuenta regresiva, la playlist, el mapa y el alias para
regalos. Nada inventado — si mañana se saca una función, hay que sacar
el título.

---

## 6. La página a la que llegan

`clicketerno.com.ar/#invitaciones`. Lo que importa de ella para la
campaña:

- Arriba de todo está **`#app`**: los tres servicios funcionando de
  verdad adentro de un marco, no capturas. Es lo primero que ve el que
  llega del anuncio.
- Cada producto cierra con el **mismo par de botones**: el dorado de
  presupuesto primero y la demostración al lado. Cada uno manda **su
  propio mensaje de WhatsApp** prellenado, así del otro lado se sabe qué
  piden.
- Hay sección **`#combo`** (los tres juntos) y **`#entrar`** para el que
  ya contrató.
- **Sin precios**, por decisión del dueño: el presupuesto se cierra
  hablando.
- La demostración muestra **fotos de una fiesta de verdad** y mezcla
  fotos con saludos escritos.

Antes de esto el muro y el rollo no se vendían y el motivo no era el
texto: el menú no los nombraba, no tenían botón de comprar y el WhatsApp
mandaba siempre el mismo mensaje. Está contado en `CLAUDE.md`, en "Por
qué sólo compraban invitaciones".

---

## 7. Lo que falta, en orden

1. **Las 49 negativas.** No las ofreció el alta. Van a nivel campaña:
   Campaña → Palabras clave → Negativas → Agregar → pegar la lista.
   Están en el CSV (`Criterion Type = Campaign Negative Broad`) y acá:

   ```
   app para, aprender, bautismo religioso, canva, como hacer,
   como se hace, curso, descarga, descargar, diseñar yo, editable,
   editables, empleo, fondos, free, funeral, gratis, gratuitas,
   gratuito, hacerla yo, ideas, imagenes, imprenta, imprimible,
   imprimibles, imprimir, jpg, papeleria, para imprimir, pdf,
   photoshop, plantilla, plantillas, png, powerpoint, programa para,
   psd, que es, significado, sobres de papel, sueldo,
   tarjetas impresas, template, templates, trabajo, tutorial,
   vacante, velatorio, word
   ```

   Son tres familias y cada una tapa una fuga distinta: **el que quiere
   hacerla él** (canva, plantilla, editable, photoshop), **el que quiere
   papel** (imprimir, imprenta, sobres de papel) y **el que no es
   cliente** (trabajo, sueldo, curso, velatorio). Sin esto una campaña
   chica se come el presupuesto en una mañana.

2. **Facturación** y leer la letra chica del crédito de 300.000.

3. **Extensiones.** Son gratis y suben el porcentaje de clics bastante:
   - *Vínculos a sitios*: Invitaciones · Muro en vivo · Rollo eterno ·
     Ya contraté (`#invitaciones`, `#muro`, `#rollo`, `#entrar`).
   - *Textos destacados*: "Diseño a medida", "Confirmación de
     asistencia", "Entrega en días", "Rosario y todo el país".
   - *Teléfono*: 341 250-6451.

4. **Apagar las recomendaciones automáticas.** Google las aplica solo a
   los 14 días si nadie las toca, y la que más duele es "agregar
   palabras clave de concordancia amplia". Configuración → Aplicación
   automática → destildar todo.

---

## 8. Cómo se lee esto dentro de dos semanas

Con $2.000 por día y un CPC tope de $600 estamos hablando de **3 a 10
clics diarios**. Eso quiere decir que **antes de 100 clics no hay nada
que concluir**: cualquier lectura más temprana es ruido.

En orden de importancia:

1. **Informe de términos de búsqueda** (Palabras clave → Términos de
   búsqueda). Es el único informe que importa al principio: dice qué
   escribió la gente de verdad. Todo lo que no sea cliente se agrega
   como negativa; todo lo que compre y no esté, se agrega como palabra.
   Esto se hace **cada dos o tres días la primera semana**.
2. **Conversiones** (clics a WhatsApp). Si hay clics y cero
   conversiones después de 100 clics, el problema es la página o el
   precio, no la campaña.
3. **CTR por anuncio.** Abajo de 3% en búsqueda es un anuncio flojo.
4. **CPC medio.** Si está pegado a los 600, el tope está frenando y
   conviene subirlo antes que bajar el presupuesto.

**El seguimiento de métricas no lo puedo hacer yo solo**: desde acá no
hay acceso a la cuenta de Google Ads. La forma de que un chat lo
analice es que el dueño baje el informe (Google Ads → Informes →
Descargar CSV) y lo pegue o lo suba.

---

## 9. Reglas que valen para cualquier chat que siga esto

- **El negocio está en Rosario (UTC−3).** Las fechas y las horas se
  piensan desde ahí.
- **El teléfono es 341 250-6451** y no se cambia.
- **No se publican precios.** El presupuesto se cierra hablando.
- **Lo que diga un anuncio tiene que existir en el producto.** Y al
  revés: lo que la página anuncia como incluido no se puede cobrar
  aparte después (arts. 7 y 8 de la Ley 24.240). Por eso la
  confirmación de asistencia **no puede ser un adicional**: la página
  la anuncia como parte de la invitación.
- **La etiqueta no entra nunca en `muro.html` ni en `rollo.html`.**
- Antes de tocar `index.html`, correr `bash pruebas/todo.sh`:
  `pruebas/ads.js`, `pruebas/enlaces.js` y `pruebas/legales.js` cuidan
  justamente la etiqueta, los botones de WhatsApp y la política.

---

## 10. Los archivos

| Archivo | Qué es |
|---|---|
| `ads/CAMPANA.md` | este archivo |
| `ads/campana-google-ads.csv` | la campaña entera para Google Ads Editor |
| `ads/imagenes/logo-1200x1200.png` | logo cuadrado |
| `ads/imagenes/cuadrada-1200x1200.png` | imagen cuadrada, marca |
| `ads/imagenes/cuadrada-1200x1200-pia.png` | cuadrada con foto de portada |
| `ads/imagenes/horizontal-1200x628.png` | horizontal, marca |
| `ads/imagenes/horizontal-1200x628-pia.png` | horizontal con foto |

Las imágenes **no las usa la campaña de Búsqueda**: están para el día que
se arme una de Display, Performance Max o una publicación en redes.
