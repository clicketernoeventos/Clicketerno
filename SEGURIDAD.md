# Protocolo de seguridad · Click Eterno

Este archivo es la **política de seguridad documentada** que la Resolución 47/2018 de
la AAIP espera de quien trata datos personales en medios informatizados. Está armado
con las ocho secciones del Anexo I de esa resolución, en el mismo orden, y dice en cada
una **qué hay puesto de verdad**, no qué nos gustaría.

No se publica: está en `.assetsignore` junto con el resto de los `.md`.

**Regla de este archivo: si algo no está hecho, se escribe que no está hecho.** Un
documento de seguridad que declara controles inexistentes es peor que no tenerlo —
ante un incidente, es prueba en contra.

---

## DP A · Recolección de datos

**Qué pide.** Que se recolecte solo lo necesario, con el consentimiento y la
información del artículo 6 de la Ley 25.326, y que el dato viaje protegido.

**Qué hay.**

- Se pide el mínimo: al invitado, un nombre de fantasía (26 caracteres) y lo que quiera
  mandar. **Nunca DNI, domicilio, correo, teléfono ni datos bancarios.**
- El aviso del artículo 6 está **en la misma pantalla donde se pide el dato**
  (`.aviso-datos`, en `muro.html` y en `rollo.html`), no en un enlace al pie: dice para
  qué es, quién es el responsable, que es voluntario, cuánto dura y cómo pedir el
  borrado. Lo cuida `pruebas/legales.js`.
- Todo viaja por HTTPS. `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  en `_headers`, más `upgrade-insecure-requests` en la CSP.
- La clave del evento **nunca viaja en la dirección** ni se guarda en la fila: va en la
  cabecera `x-clave` y la base solo guarda su hash bcrypt.
- Los topes son del lado del servidor, no del navegador: tamaño y tipo de archivo en el
  depósito, cupo de fotos por invitado y cupo de invitados por evento
  (`cupo_fotos`, `cupo_invitados`, con la restricción `ce_cupos_sanos`).

**Lo que falta.** Nada identificado.

---

## DP B · Control de acceso

**Qué pide.** Que cada quien acceda únicamente a lo suyo, con identificación y
autenticación, y que los permisos sean los mínimos.

**Qué hay.**

- **RLS encendido y sin políticas abiertas.** En Postgres, una tabla con seguridad a
  nivel de fila y sin políticas quiere decir *nadie*. `ce_claves`, `ce_ajustes`,
  `ce_rollos` y `ce_disparos` están así: no se llegan desde internet de ninguna forma.
- Todo pasa por funciones `security definer` acotadas (`ce_mi_rollo`, `ce_tomar_foto`,
  `ce_album_de`, `ce_album_pagina`, `ce_evento_publico`, `ce_items_de`). Cada una
  valida antes de responder.
- **Una clave por evento**, verificada por `ce_permitido()` contra el hash bcrypt.
  El organizador ve su evento; el de al lado no existe para él.
- **Clave maestra** solo para administración. Vive en `sessionStorage`, nunca en
  `localStorage`: se muere al cerrar la pestaña. La base dice cuál es (`es_maestra` en
  `ce_quien_soy`) y la app respeta esa respuesta en vez de guardar cualquier clave que
  funcione. Lo cuidan `pruebas/nuevas.js` y `pruebas/rollo_maestra.js`.
- **El depósito del rollo es privado.** Antes del revelado no se puede ni firmar una
  URL. Después, enlaces firmados que caducan en una hora.
- **Los caminos de archivo los valida la base**, no el teléfono: `ce_tomar_foto` exige
  `CODIGO/TOKEN/archivo.jpg` con el código y el token de quien está sacando la foto.
- La clave `anon` de Supabase está escrita en el HTML **a propósito**: es pública por
  diseño. Lo que protege son las políticas, no el secreto de esa clave.
- **El muro cerrado lo aplica la base** (`blindaje2.sql`). Hasta ahí, el candado
  del organizador lo respetaba solamente el navegador: la app le escondía el
  formulario al invitado y la base seguía aceptando. Lo mismo las fotos en un
  evento que no existe, que quedaban huérfanas y sin forma de limpiarlas.

**Lo que falta.**

- **Verificación en dos pasos en las cuentas de Supabase, Cloudflare y el correo del
  negocio.** Es el eslabón más débil de todo el sistema: quien entre ahí entra a todo.
  Pendiente de que lo active el dueño.
- **Rotar la clave maestra.** Hay función para hacerlo (`ce_cambiar_maestra`) y no se
  usó nunca.

---

## DP C · Control de cambios

**Qué pide.** Que los cambios en los sistemas queden registrados, revisados y
reversibles.

**Qué hay.**

- Todo el código vive en Git. Cada cambio es un commit con su motivo escrito y se puede
  volver atrás.
- **El SQL no se corre desde ninguna máquina de desarrollo.** Va pegado en el chat, en
  un bloque listo para copiar, y lo ejecuta una persona en el SQL Editor de Supabase.
  Desde el entorno de trabajo no hay credenciales de producción.
- El orden de los archivos SQL es fijo y está escrito: `claves.sql` → `rollo.sql` →
  `blindaje.sql`, y `blindaje.sql` va último siempre.
- **El orden entre la web y la base tampoco es libre: primero la web, después el SQL.**
  La app nueva aguanta la base vieja; la vieja no aguanta la base nueva. Está medido en
  `pruebas/seguridad.js` ("el día antes" y "el día después").
- `sql/estado.sql` responde en trece filas qué hay puesto en producción, para no
  trabajar sobre suposiciones.

**Lo que falta.**

- No hay un registro de auditoría de quién tocó qué en el panel de Supabase más allá
  del que trae Supabase por defecto.

---

## DP D · Respaldo y recuperación

**Qué pide.** Que exista un proceso de respaldo que permita recuperar la información
ante un incidente, y que se pruebe.

**Qué hay.**

- El código y el SQL están íntegros en Git, en un remoto. Reconstruir el sitio entero
  es clonar y publicar.
- El esquema de la base se reconstruye corriendo los tres archivos SQL en orden.
- El organizador puede **descargarse su álbum completo** en cualquier momento, y se le
  avisa 15 días antes del vencimiento. Ese es, hoy, el respaldo real de las fotos de
  un cliente.

**Lo que falta — y es lo más importante de este documento.**

- **No hay respaldo automático del contenido.** Las fotos viven en un único lugar
  (el depósito de Supabase). Si esa cuenta se pierde, se suspende o se borra por error,
  **las fotos no están en ningún otro lado**.
- El plan gratuito de Supabase no incluye respaldos diarios. Contratar el plan pago
  —que ya está decidido por otros motivos de capacidad— es también lo que resuelve esto.
- **Nunca se probó una restauración.** Un respaldo que no se probó no es un respaldo.

---

## DP E · Gestión de vulnerabilidades

**Qué pide.** Un proceso continuo para identificar, analizar y corregir
vulnerabilidades.

**Qué hay.**

- **No hay dependencias.** No hay `npm install`, no hay framework, no hay árbol de
  paquetes: no existe la clase de vulnerabilidad que llega por una dependencia
  transitiva.
- **Las librerías (QR, zip, excel) están en el repo**, en `lib/`, en versiones fijas.
  Antes venían de un CDN, que es darle a un tercero permiso para correr código en la
  página que tiene a mano la clave del evento y la maestra.
- **CSP restrictiva** en `_headers`, servida también en las pruebas
  (`pruebas/servidor.py`) para que un bloqueo salte acá y no en la fiesta de un cliente.
  Sin hosts externos de scripts; `connect-src` acotado; `object-src 'none'`;
  `base-uri 'none'`; `frame-ancestors 'self'`.
- Cabeceras: `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` con cámara y
  micrófono solo para el propio sitio.
- **Batería de pruebas hostiles.** `pruebas/hostil.js` (27), `pruebas/rollo_hostil.js`
  (69) y `pruebas/xss.js` atacan la app como lo haría un invitado curioso.
  `sql/probar.sql` (47) y `sql/rollo_probar.sql` (63) atacan la base: ¿puede revelar
  antes de hora?, ¿puede sacar más fotos que las del cupo?, ¿puede ver las de otro?,
  ¿puede subir a la carpeta de otro evento?
- Todo el contenido que escribe un invitado se escapa al dibujarlo (`esc()`).

**Lo que falta.**

- No hay análisis automático de la superficie publicada (tipo escaneo periódico). Para
  un sitio estático sin dependencias el riesgo es bajo, pero no es cero.

---

## DP F · Destrucción de la información

**Qué pide.** Procesos de eliminación que aseguren que el contenido confidencial se
destruya de verdad, con control del proceso.

**Qué hay.**

- **Los 90 días.** Cada evento nace con `vence` a 90 días corridos de la fecha de la
  fiesta (`DIAS_QUE_VIVE`). Cumple el artículo 4 inciso 7 de la Ley 25.326: el dato se
  destruye cuando deja de ser necesario.
- **Se avisa antes de borrar** (`AVISAR_DESDE`, 15 días), con el botón de descarga al
  lado. Borrar sin avisar es perderle las fotos a un cliente; avisar sin dar la salida
  no sirve.
- **El borrado es completo**: filas de `ce_eventos`, `ce_items`, `ce_rollos` y
  `ce_disparos` (en cascada), más los archivos de los dos depósitos, `ce-medios` y
  `ce-rollos`. No queda copia.
- **El borrado en tanda no miente.** Va de a uno, no corta si uno falla, y al final
  informa cuántos pudo y cuáles no. Decir "Listo" cuando quedó algo sin borrar es
  exactamente lo que este control tiene que impedir. Lo cuida `pruebas/vencimiento.js`.
- La limpieza se ejecuta desde `/muro#central`, **solo con la clave de administrador**.

**Lo que falta.**

- **La limpieza es a mano, una vez por mes.** No hay nada automático del lado del
  servidor. Si se atrasa, los datos viven más de lo declarado, y lo declarado es una
  obligación. Si algún día se automatiza, va como tarea programada en la base, nunca
  en el navegador de nadie.

---

## DP G · Incidentes de seguridad

**Qué pide.** Detección, evaluación, contención, respuesta, escalamiento y corrección.
Y notificar a la autoridad.

### Qué es un incidente acá

Cualquiera de estas cosas:

- Que alguien acceda a fotos de un rollo **sin revelar**.
- Que alguien vea eventos que no son suyos, o la tabla de eventos completa.
- Que se filtre la clave maestra, o la clave de un evento.
- Que se pierdan o se borren fotos de un cliente sin que él lo haya pedido.
- Que aparezca contenido que nadie del negocio subió.
- Que un proveedor (Supabase, Cloudflare, Google) informe una brecha que nos alcance.

### Qué se hace, en orden

1. **Contener.** Lo primero es cortar el acceso, no entender qué pasó. Según el caso:
   cerrar el evento (`cerrado`), volver a ocultar el rollo (`revelado=false`), rotar la
   clave del evento, o rotar la clave maestra con `ce_cambiar_maestra`.
2. **Anotar.** Fecha y hora (hora de Rosario), qué se vio, cómo se detectó, qué datos
   pudo alcanzar, cuántos titulares. Antes de tocar nada más.
3. **Evaluar el alcance.** Qué eventos, qué personas, qué tipo de dato. Si hay fotos de
   menores involucradas, el alcance se trata como grave por definición.
4. **Corregir.** El arreglo va con su prueba: primero la prueba que falla contra el
   código actual, después el arreglo. Sin eso, no se sabe si se arregló.
5. **Notificar a la AAIP.** Con, como mínimo: la naturaleza de la violación, la
   categoría de datos afectados, la identificación de los titulares alcanzados, las
   medidas adoptadas para mitigarlo y las adoptadas para que no vuelva a pasar
   (Resolución 47/2018).
6. **Avisarle a los afectados.** Al organizador siempre; a los invitados, por medio del
   organizador, que es quien tiene el contacto. Enterarse y callarse no es una opción,
   y además está escrito en la Política de Privacidad.
7. **Cerrar.** Qué lo causó, qué se cambió, qué prueba lo cuida de ahora en más. La
   lección va a `CLAUDE.md`, en "Reglas que ya nos costaron caro".

### A quién se avisa

- **AAIP** — Agencia de Acceso a la Información Pública: argentina.gob.ar/aaip
- **Titulares afectados** — por el canal que haya.
- **Proveedor** — si el incidente es de ellos, por su canal de soporte.

---

## DP H · Entorno de desarrollo

**Qué pide.** Que el desarrollo y las pruebas no se hagan con datos personales reales,
y que el entorno esté separado del de producción.

**Qué hay.**

- **Ninguna prueba toca producción.** Las del navegador corren contra un Supabase
  inventado (`pruebas/fakesb.js`), blindado por defecto igual que el de verdad. Las de
  la base corren contra una copia local del esquema (`sql/esquema_falso.sql`) en un
  Postgres de juguete.
- **La demostración pública vive entera en memoria.** No toca Supabase ni el
  almacenamiento del navegador. En el rollo, `SB.pedir` está tapiado a propósito: si
  quedó algún camino sin reemplazar, revienta en la prueba en vez de irse callado a la
  base de verdad. Lo cuida `pruebas/demo.js`.
- **No hay datos personales reales en el repo.** Ni volcados, ni capturas con nombres,
  ni claves.
- **`.assetsignore` decide qué se publica.** `sql/`, `pruebas/`, `apps-script/`, los
  `.md` y `wrangler.json` no salen a la web. Sin ese archivo,
  `clicketerno.com.ar/sql/claves.sql` se bajaba desde el navegador — y ese archivo
  llevaba la clave maestra escrita en texto plano. Lo cuida `pruebas/legales.js`.
- La clave maestra de las pruebas se fija en `sql/probar.sql` y no es la de producción.

**Lo que falta.** Nada identificado.

---

## Lo que se revisó y está sano

Repaso hecho a propósito, no de casualidad:

- **Inyección en la pantalla (XSS).** `esc()` escapa `< > & " '`, que cubre texto y
  atributo, y todo lo que escribe un invitado pasa por ahí. Las direcciones pasan
  además por `urlSegura()`, que solo deja `http(s):`, `data:` de imagen, video o
  audio, `blob:` y nombres de archivo con extensión conocida — un `javascript:` no
  llega nunca a un `href`. Lo atacan `pruebas/xss.js`, `hostil.js` (27) y
  `rollo_hostil.js` (69).
- **Sin `eval`, sin `new Function`, sin `document.write`, sin `srcdoc`, sin oyentes
  de `postMessage`.** No hay por dónde entrar código.
- **Sin dependencias.** No hay `npm install`: no existe la clase de vulnerabilidad
  que llega por un paquete transitivo.
- **El depósito ya estaba bien**: subir exige `ce_evento_abierto(carpeta)`, no hay
  regla de UPDATE (no se puede pisar un archivo que ya está), y el tamaño y el tipo
  los limita el depósito, no la página.
- **Borrar un recuerdo exige la clave del evento**, y reusar el `id` de otro choca
  contra la clave primaria en vez de pisarlo.

## Lo que sigue abierto y se acepta a sabiendas

- **El código del evento es la llave.** Son seis dígitos al azar y
  `ce_evento_publico` contesta "existe / no existe": con paciencia se pueden probar
  códigos. Es inherente a un producto sin cuentas, donde el invitado entra
  escaneando un QR. Lo que lo hace tolerable es que con el código se ve *un* evento
  y nunca una lista, y que un rollo sin revelar no se puede mirar igual. Si algún
  día molesta, la salida es un código más largo, no una cuenta por invitado.
- **El PIN del panel no es una barrera de seguridad**, es una traba de conveniencia:
  vive en el navegador y se saltea. No importa: el panel solo muestra los eventos
  cuya clave está guardada en ese aparato, y eso lo valida la base.
- **`ce_evento_publico` devuelve la fila entera**, con columnas que el invitado no
  necesita. Angostarla toca lo que lee la pantalla del invitado y, por la regla de
  "primero la web", no va en la misma tanda que un blindaje de la base.

## Lo que hay que hacer, en orden de urgencia

0. **Correr `sql/blindaje2.sql`** en el SQL Editor. Hasta que no se corra, el muro
   sigue sin tope, acepta con el candado puesto y deja elegir el orden de la
   proyección.
1. **Verificación en dos pasos** en Supabase, en Cloudflare y en el correo del negocio.
   Es gratis, son diez minutos, y es lo que más reduce el riesgo de todo este
   documento.
2. **Respaldo del contenido.** Hoy las fotos están en un solo lugar. Contratar el plan
   pago de Supabase (ya decidido por capacidad) trae respaldos diarios.
3. **Probar una restauración.** Una vez. Un respaldo sin probar no es un respaldo.
4. **Rotar la clave maestra**, que nunca se cambió.
5. **Inscribir la base de datos en el Registro Nacional de Bases de Datos** de la AAIP.
   Es gratis y se hace por Trámites a Distancia. Es una obligación del artículo 21 de
   la Ley 25.326 para cualquiera que trate datos más allá del uso personal.
6. **Completar la identificación fiscal** en `privacidad.html` y `terminos.html`.
7. **Correr la limpieza de vencidos** (`/muro#central`) una vez por mes. Lo declarado
   sobre los 90 días es una obligación, no una intención.
