# Mudar las invitaciones de Netlify al repo, sin romper los links

Los clientes ya tienen el link de Netlify en la mano y las fiestas no
pasaron todavía. Así que el link **no puede dejar de funcionar**, ni
ahora ni cuando se dé de baja la suscripción.

La salida no es mover el link: es dejar el sitio de Netlify **vacío,
redirigiendo**. Un sitio así no compila nada, y lo que te dejó offline
fueron los **minutos de compilación**, no el tráfico. Un sitio de puras
redirecciones no puede volver a quedarse sin eso.

## El orden importa y no es libre

Si se pone la redirección antes de que el contenido esté en el repo, el
cliente abre el link y encuentra un 404 nuestro. Peor que antes.

1. **Pasar la carpeta entera al repo.** El HTML, las fotos y la música.
   Con el HTML solo, las fotos siguen saliendo de Netlify y el problema
   es el mismo. Las reglas están en `invitaciones/LEEME.md`.
2. **Comprobar que abre** en `clicketerno.com.ar/key` y
   `clicketerno.com.ar/xiomara`, con el teléfono, con la música y las
   fotos.
3. **Recién ahí**, en Netlify: *Deploys → Drag and drop*, y soltar la
   carpeta `key/` (o `xiomara/`) de acá. Son dos archivos: el
   `_redirects` y un `index.html` de respaldo. Netlify no compila nada:
   no hay build command.
4. **Probar el link viejo**, el que tiene el cliente. Tiene que llevar a
   la invitación nueva.
5. **Ahí sí** dar de baja la suscripción de la cuenta alternativa. El
   sitio de redirecciones anda en el plan gratis: no gasta minutos de
   compilación.

## Por qué `301!` y no `301`

Sin el signo, Netlify sirve el archivo si existe y redirige solo si no
existe. Con `!` redirige siempre, aunque haya quedado algo subido. Es lo
que se quiere: que no haya dos copias vivas de la misma invitación, una
vieja en Netlify y una nueva acá.

El `:splat` es "todo lo que venga después de la barra", así que una foto
pedida a mano (`/fotos/3.jpg`) también cae en su lugar.

## El `index.html` de respaldo

Si por lo que sea el `_redirects` no se aplica, el visitante ve una
pantalla que dice que se mudó y un enlace. Nunca una página en blanco.

## No borrar el sitio de Netlify

Borrado, el link del cliente deja de existir. Vacío y redirigiendo, vive
gratis todo lo que haga falta. Recién se puede borrar cuando las dos
fiestas hayan pasado y nadie abra más ese link.
