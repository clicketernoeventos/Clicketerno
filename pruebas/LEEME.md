# Pruebas

Todo junto:

    bash pruebas/todo.sh

Levanta los servidores que hagan falta, corre las del muro, las del rollo y
las de la base, y apaga solo lo que haya levantado. También `todo.sh muro`,
`todo.sh rollo`, `todo.sh sql`.

Existe porque ponerlo a mano son seis pasos, y olvidarse de uno no da un
error: da una prueba que falla por el motivo equivocado.

## Una por una

Las del muro, con el sitio servido en `http://127.0.0.1:8099`:

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

## Las del rollo

Van en el puerto **8890**, no en el 8099:

    python3 -m http.server 8890 --bind 127.0.0.1
    node pruebas/rollo_navegador.js    # el invitado: cámara colgada, señal cortada
    node pruebas/rollo_organizador.js  # el organizador, de la puerta al revelado
    node pruebas/rollo_hora.js         # que la hora del revelado no se corra de zona
    node pruebas/rollo_hostil.js       # todo saliendo mal, con el reloj en Argentina

Las dos que arman el zip necesitan JSZip de verdad. `jszip_local.js` lo
busca en `.cache/`, y si no está y hay internet lo baja una vez y lo deja
ahí. Si no lo consigue, esas pruebas dicen `salteada` en vez de dar error:
una dependencia que falta no es un bug del producto. Nunca poner una ruta
de tu carpeta de borradores en una prueba — ya pasó, y el resultado fue una
prueba que decía "roto" en toda máquina que no fuera la de quien la
escribió.
