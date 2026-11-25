---
name: seo-audit
description: Revisión SEO corta de la página pública de Click Eterno (index.html, invitaciones.html, privacidad, términos). No aplica a tarjetas de clientes, que llevan noindex a propósito.
---

# SEO, versión corta

Revisar solo páginas públicas; **nunca** sacar el `noindex` de tarjetas, muro ni rollo.

1. `<title>` único (≤60 car.) y `meta description` (≤155), `lang="es-AR"`, un solo `<h1>`.
2. `og:title`, `og:description`, `og:image` (1200x630, sin 404) y `canonical`.
3. Encabezados en orden; imágenes con `alt` y tamaño; enlaces sin `#` vacíos.
4. `robots`/sitemap: confirmar qué existe antes de proponer nada.
5. Velocidad: peso de imágenes y recursos bloqueantes; sin terceros (la CSP no los deja).
6. Datos locales: Rosario, WhatsApp 341 250-6451, `LocalBusiness` en JSON-LD solo con datos reales.

Salida: lista breve, ordenada por impacto, con "arreglo rápido" vs "después". Marcar A CONFIRMAR lo que dependa del dueño. Los cambios en `index.html` los hace el chat de la página.
