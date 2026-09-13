# Pruebas

Se corren con el sitio servido en `http://127.0.0.1:8099`:

    python3 -m http.server 8099 --bind 127.0.0.1
    node pruebas/stress.js      # recorrido completo, 4 escenarios
    node pruebas/extras.js      # bajar publicados, datos, hashtag y lugar
    node pruebas/nuevas.js      # clave maestra, horario, pantalla del salón
    node pruebas/borrar.js      # eliminar eventos
    node pruebas/xss.js         # inyección de código

`fakesb.js` es una base falsa en memoria que imita a Supabase, claves
incluidas, y sabe fallar a propósito (500, sin red, datos envenenados).

Los permisos de la base se prueban aparte, contra un Postgres de verdad:

    psql -f sql/esquema_falso.sql && psql -f sql/claves.sql && psql -f sql/probar.sql
