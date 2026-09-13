# Clicketerno

Sitio estático (Cloudflare) + Supabase. Sin build ni dependencias: cada
pantalla es un HTML suelto que habla directo con Supabase.

| Dirección | Archivo | Qué es |
|---|---|---|
| `/` | `index.html` | la página pública |
| `/muro` | `muro.html` | **Muro en vivo**: fotos y saludos proyectados en el salón, + el panel del organizador |
| `/rollo` | `rollo.html` | **Rollo eterno**: la cámara descartable de cada invitado |
| `/app` | `app.html` | redirección a `/muro` (los QR viejos apuntan acá; no borrar) |

## Rollo eterno

Cada invitado saca una cantidad limitada de fotos (24 por defecto) con uno
de 5 filtros, y nadie ve ninguna —ni quien la sacó— hasta que se revela el
rollo: a una hora que fija el organizador, o a mano con "Revelar ahora".
Al revelarse, primero cada uno ve las suyas y después el álbum completo.

Se activa desde el panel del evento en `/muro` (pestaña **Rollo**).

### Instalación en Supabase

Se corre una vez en el SQL Editor, en este orden:

1. `sql/claves.sql` — sistema de clave por evento (si no está corrido).
2. `sql/rollo.sql` — tablas, funciones y el depósito privado `ce-rollos`.
3. `sql/rollo_revisar.sql` — confirma que quedó todo instalado.

### Probar sin tocar producción

`sql/esquema_falso.sql` arma una copia del esquema en un Postgres local y
después `sql/probar.sql` y `sql/rollo_probar.sql` atacan la base como si
fueran un invitado curioso (¿puede revelar el rollo antes de hora?, ¿puede
sacar más fotos que las del cupo?, ¿puede leer las fotos de otro?).

```bash
psql -f sql/esquema_falso.sql -f sql/claves.sql -f sql/rollo.sql
psql -f sql/probar.sql
psql -f sql/rollo_probar.sql     # 41 comprobaciones
```

Y del lado del navegador, con el sitio servido en el puerto 8890:

```bash
npx http-server -p 8890 -c-1 &
node pruebas/rollo_navegador.js  # cámara denegada, señal cortada, álbum gigante…
```
