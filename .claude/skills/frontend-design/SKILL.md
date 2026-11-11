---
name: frontend-design
description: Criterios cortos de diseño para pantallas HTML de Click Eterno (tarjetas, página pública). Usar al diseñar o retocar la cara de una pantalla.
---

# Diseño de pantallas

- Sin build ni CDN: HTML/CSS/JS sueltos, iconos dibujados a mano (SVG inline).
- Una jerarquía clara: un título, un llamado. Peso y tamaño marcan el orden, no más colores.
- Paleta corta en variables `:root`; contraste calculado (mín. 4,5:1 texto, 3:1 grande). Si un bloque trae su fondo, trae su tinta.
- Tipografías en dos variables; pocas, con el peso pedido en el `<link>`.
- Móvil primero (320 a 430 px), `svh` y no `vh`, áreas táctiles de 44x44, sin `:hover` pegado (`@media(hover:hover)`).
- Movimiento sutil: una vez o atado al scroll; apagar con `prefers-reduced-motion`.
- Mirar la pantalla terminada en el aparato más chico antes de dar por buena una foto o un recorte.
