# Pruebas

Se corren con el sitio servido en `http://127.0.0.1:8099`:

    python3 -m http.server 8099 --bind 127.0.0.1
    node pruebas/stress.js      # recorrido completo, 4 escenarios
    node pruebas/extras.js      # bajar publicados, datos, hashtag y lugar
    node pruebas/nuevas.js      # clave maestra, horario, pantalla del salón
    node pruebas/borrar.js      # eliminar eventos
    node pruebas/xss.js         # inyección de código
    node pruebas/hostil.js      # fiestas enormes, nombres imposibles, red rota
    node pruebas/diagnostico.js # el autodiagnóstico de la app

`fakesb.js` es una base falsa en memoria que imita a Supabase, claves
incluidas, y sabe fallar a propósito (500, sin red, datos envenenados).

Los permisos de la base se prueban aparte, contra un Postgres de verdad:

    psql -f sql/esquema_falso.sql && psql -f sql/claves.sql && psql -f sql/probar.sql

## Autodiagnóstico

La app trae el suyo, contra la base de verdad: en la portada, tres toques
en el número de versión. Revisa qué está instalado y, con un botón,
prueba los permisos creando un evento `PRUEBA-XXXXXX` que borra al salir.
`pruebas/diagnostico.js` comprueba que ese autodiagnóstico funcione,
incluso cuando la base se cae a la mitad.

## Una trampa que ya mordió tres veces

`innerText` devuelve el texto **ya transformado por el CSS**. Media app
está en mayúsculas, así que comparar contra `'Probar de nuevo'` falla
aunque en pantalla diga exactamente eso. Comparar siempre en minúsculas.
