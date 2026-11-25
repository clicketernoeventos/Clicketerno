---
name: cierre-de-chat
description: Usar cuando el dueño diga "cerrar" o "cierre", o pida un resumen para seguir en un chat nuevo. Devuelve un resumen de máximo 15 líneas.
---

# Cierre de chat

Devolver **máximo 15 líneas**, en castellano, sin explicar el cómo. Orden:

1. **Contexto**: qué se estaba haciendo y para quién (1-2 líneas).
2. **Decisiones**: lo que el dueño decidió y no se vuelve a discutir.
3. **Estado actual**: qué quedó publicado y qué no (rama, PR, check de Cloudflare).
4. **Archivos y links**: carpetas tocadas y links publicados, completos (`https://clicketerno.com.ar/...`).
5. **Próximos pasos**: lo que falta, de quién es (dueño, cliente o chat).

Marcar **A CONFIRMAR** todo lo dudoso: datos que no mandó el cliente, cosas sin verificar en lo publicado, pruebas sin correr. Nunca inventar un dato para cerrar la lista. No incluir claves ni contraseñas.
