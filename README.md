# Clicketerno

Sitio estático (Cloudflare) + Supabase. Sin build ni dependencias: cada
pantalla es un HTML suelto que habla directo con Supabase.

| Dirección | Archivo | Qué es |
|---|---|---|
| `/` | `index.html` | la página pública |
| `/muro` | `muro.html` | **Muro en vivo**: fotos y saludos proyectados en el salón, + su panel |
| `/rollo` | `rollo.html` | **Rollo eterno**: la cámara descartable, + su panel |
| `/app` | `app.html` | redirección a `/muro` (los QR viejos apuntan acá; no borrar) |

## Rollo eterno

Cada invitado saca una cantidad limitada de fotos (24 por defecto) con uno
de 5 filtros, y nadie ve ninguna —ni quien la sacó— hasta que se revela el
rollo: a una hora que fija el organizador, o a mano con "Revelar ahora".
Al revelarse, primero cada uno ve las suyas y después el álbum completo.

**Son dos servicios aparte y cada uno se maneja solo.** En `/rollo` el
organizador crea el rollo (cuatro preguntas, una por pantalla), saca el QR,
ve cómo va y lo revela, sin pasar nunca por el muro. La regla de esas
pantallas: en cada una hay **una** cosa importante para tocar, y arriba
dice en palabras qué hacer. Los dos comparten la misma tabla de eventos y el mismo
sistema de clave, así que un evento puede tener los dos servicios, o uno
solo: en la lista de `/rollo` aparecen también los eventos creados en el
muro, con la opción de prenderles el rollo.

### Instalación en Supabase

Se corre una vez en el SQL Editor, en este orden:

1. `sql/claves.sql` — sistema de clave por evento (si no está corrido).
2. `sql/rollo.sql` — tablas, funciones y el depósito privado `ce-rollos`.
3. `sql/rollo_revisar.sql` — confirma que quedó todo instalado.

### Si el depósito quedó pendiente

Desde 2025 Supabase no deja crear reglas sobre `storage.objects` desde el
SQL Editor: la tabla es de `supabase_storage_admin`, no del proyecto. Si
`rollo.sql` avisó "PENDIENTE", o si las filas 13 a 15 del verificador dan
`false`, hay que crear esto a mano una sola vez. (El editor corre todo en
una transacción, así que un error acá deshace hasta lo que ya funcionaba:
por eso el script atrapa el error y sigue en vez de cortar.)

**El depósito** — Storage → New bucket:

| | |
|---|---|
| Nombre | `ce-rollos` |
| Público | **no** (queda privado, es lo que sostiene el revelado) |

**Las tres reglas** — Storage → Policies → `ce-rollos` → New policy → *For
full customization*. En las tres, marcar los roles `anon` y `authenticated`:

| Nombre | Operación | Expresión |
|---|---|---|
| `ce rollos subir` | INSERT (WITH CHECK) | `bucket_id = 'ce-rollos' and public.ce_ruta_reservada(name)` |
| `ce rollos leer` | SELECT (USING) | `bucket_id = 'ce-rollos' and (public.ce_camara_revelada(split_part(name, '/', 1)) or not exists (select 1 from public.ce_eventos e where e.codigo = split_part(name, '/', 1)))` |
| `ce rollos borrar` | DELETE (USING) | `bucket_id = 'ce-rollos' and not exists (select 1 from public.ce_eventos e where e.codigo = split_part(name, '/', 1))` |

Qué hace cada una: **subir** solo deja escribir en un camino que
`ce_tomar_foto` ya reservó, así nadie llena el depósito con archivos
sueltos. **Leer** es el candado del revelado: sin ella no se puede ni
firmar una URL antes de hora. **Borrar** deja limpiar solo los archivos de
un evento que ya no existe.

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
node pruebas/rollo_navegador.js    # 24 pruebas del invitado: cámara colgada, señal cortada…
node pruebas/rollo_organizador.js  # el recorrido del organizador, de la puerta al revelado
```
