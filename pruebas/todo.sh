#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════
#  Corre TODO: las del muro, las del rollo y las de la base.
#
#  Levanta lo que haga falta (los dos servidores, y un Postgres de
#  juguete si encuentra uno instalado), corre todo, y apaga solo lo
#  que haya levantado.
#
#      bash pruebas/todo.sh              todo
#      bash pruebas/todo.sh rollo        solo las del rollo
#      bash pruebas/todo.sh muro         solo las del muro
#      bash pruebas/todo.sh sql          solo las de la base
#
#  Existe porque poner esto a mano son seis pasos y olvidarse de uno
#  no da un error: da una prueba que falla por el motivo equivocado.
#  Ya nos comimos una tarde entera por un servidor sirviendo el
#  archivo de otra rama.
# ══════════════════════════════════════════════════════════════════
set -uo pipefail
cd "$(dirname "$0")/.."
RAIZ="$(pwd)"
QUE="${1:-todo}"

MURO=(stress extras nuevas borrar xss hostil diagnostico invitaciones)
ROLLO=(rollo_navegador rollo_organizador rollo_hora rollo_hostil)

azul(){ printf '\n\033[1m%s\033[0m\n' "$*"; }
falla(){ printf '\033[31m%s\033[0m\n' "$*"; }
FALLARON=()
MIOS=()          # lo que levantamos nosotros y hay que apagar al salir

limpiar(){ for pid in "${MIOS[@]:-}"; do kill "$pid" 2>/dev/null; done; }
trap limpiar EXIT

# ── playwright, esté donde esté ──
if [ -z "${NODE_PATH:-}" ] && [ ! -d node_modules/playwright ]; then
  export NODE_PATH="$(npm root -g 2>/dev/null)"
fi

# ── los servidores: uno por puerto, y solo si no hay nada ya ──
servidor(){
  local puerto=$1
  if curl -sf -o /dev/null "http://127.0.0.1:$puerto/" 2>/dev/null; then
    echo "  puerto $puerto: ya había algo sirviendo (no lo toco)"
    return 0
  fi
  python3 -m http.server "$puerto" --bind 127.0.0.1 >/dev/null 2>&1 &
  MIOS+=($!)
  for _ in $(seq 20); do
    curl -sf -o /dev/null "http://127.0.0.1:$puerto/" 2>/dev/null && { echo "  puerto $puerto: levantado"; return 0; }
    sleep 0.3
  done
  falla "  puerto $puerto: no pude levantarlo"
  return 1
}

# Algunas suites cuentan como "falla" cosas que rompen a propósito: stress
# recorre la app en cuatro modos y suma cada console.error, y en los modos
# "fail" (la base no responde) y "net" (la red cortada) que la app registre
# el error ES lo correcto. Esas observaciones conocidas viven en
# pruebas/linea-base y solo avisamos cuando CAMBIAN: una prueba
# permanentemente en rojo deja de ser información y pasa a ser ruido que uno
# aprende a ignorar, que es por donde después se cuela un bug de verdad.
base_de(){ grep -E "^$1=" "$RAIZ/pruebas/linea-base" 2>/dev/null | head -1 | cut -d= -f2; }

correr(){                      # correr <archivo.js>
  local t=$1
  printf '  %-22s' "$t"
  local salida; salida=$(cd "$RAIZ" && timeout 600 node "pruebas/$t.js" 2>&1)
  local esperadas; esperadas=$(base_de "$t")
  if [ -n "$esperadas" ]; then
    # Las observaciones se comparan POR MODO. Con un total suelto, una falla
    # nueva en "ok" y una que desaparece en "net" se cancelan y nadie se
    # entera; por modo, eso salta.
    local visto_modos; visto_modos=$(echo "$salida" | grep -oE '✗ \[[a-z]+/' | sed 's/✗ \[//;s|/||' | sort | uniq -c | awk '{print $2":"$1}' | paste -sd, -)
    if [ "$visto_modos" = "$esperadas" ]; then
      echo "ok  (${esperadas//,/ · }, las conocidas de siempre)"
      return 0
    fi
    falla "CAMBIARON las observaciones"
    echo "      esperaba: ${esperadas:-ninguna}"
    echo "      vinieron: ${visto_modos:-ninguna}"
    echo "$salida" | grep '✗' | head -8 | sed 's/^/      /'
    FALLARON+=("$t")
    return 0
  fi
  # Cada suite informa distinto; nos quedamos con lo que todas coinciden
  # en decir cuando algo salió mal.
  if echo "$salida" | grep -qE '✗|FALLARON|FALLÓ|Error:|PAGEERROR'; then
    falla "FALLA"
    echo "$salida" | grep -E '✗|FALLARON|FALLÓ|Error:|PAGEERROR' | head -6 | sed 's/^/      /'
    FALLARON+=("$t")
  else
    # No todas las suites marcan cada comprobación con un ✓: algunas cuentan
    # el recorrido en prosa. Así que esto es "cuántos ✓ imprimió", no una
    # medida de cobertura, y por eso va con el símbolo y no con la palabra.
    local n; n=$(echo "$salida" | grep -c '✓')
    [ "$n" -gt 0 ] && echo "ok  ($n ✓)" || echo "ok"
  fi
  echo "$salida" | grep -i 'salteada' | sed 's/^/      /'
}

# ── la base: solo si hay un Postgres a mano ──
hay_postgres(){
  command -v psql >/dev/null 2>&1 || return 1
  psql -c 'select 1' >/dev/null 2>&1 && return 0
  # ¿hay uno de juguete nuestro, apagado?
  local bin; bin=$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | tail -1)
  [ -n "$bin" ] || return 1
  local datos=/tmp/ce-pg
  if [ ! -d "$datos/base" ]; then
    mkdir -p "$datos" && chmod 777 "$datos" 2>/dev/null
    id postgres >/dev/null 2>&1 && chown postgres "$datos" 2>/dev/null
    if [ "$(id -u)" = 0 ] && id postgres >/dev/null 2>&1; then
      su postgres -c "PGDATA=$datos $bin/initdb -U postgres -A trust" >/dev/null 2>&1
    else
      PGDATA=$datos "$bin/initdb" -U postgres -A trust >/dev/null 2>&1
    fi
  fi
  if [ "$(id -u)" = 0 ] && id postgres >/dev/null 2>&1; then
    su postgres -c "PGDATA=$datos $bin/pg_ctl -o '-k $datos -h \"\"' -l $datos/log start" >/dev/null 2>&1
  else
    PGDATA=$datos "$bin/pg_ctl" -o "-k $datos -h ''" -l "$datos/log" start >/dev/null 2>&1
  fi
  export PGHOST=$datos PGUSER=postgres
  sleep 1
  psql -c 'select 1' >/dev/null 2>&1
}

sql(){
  azul "── la base ──"
  if ! hay_postgres; then
    echo "  no encontré un Postgres para probar: saltadas"
    echo "  (no es un error del producto; en Supabase no se puede probar sin tocar producción)"
    return 0
  fi
  for par in "esquema_falso claves rollo:probar" "esquema_falso claves rollo:rollo_probar"; do
    local instalar="${par%%:*}" prueba="${par##*:}"
    local args=(); for f in $instalar; do args+=(-f "sql/$f.sql"); done
    printf '  %-22s' "$prueba"
    psql -q -v ON_ERROR_STOP=1 "${args[@]}" >/dev/null 2>&1 || { falla "FALLA (no instaló el esquema)"; FALLARON+=("$prueba"); continue; }
    local salida; salida=$(psql -q -f "sql/$prueba.sql" 2>&1)
    local mal; mal=$(echo "$salida" | grep -c '✗')
    if [ "$mal" -gt 0 ] || echo "$salida" | grep -q '^ERROR'; then
      falla "FALLA"
      echo "$salida" | grep -E '✗|^ERROR' | head -6 | sed 's/^/      /'
      FALLARON+=("$prueba")
    else
      echo "ok  ($(echo "$salida" | grep -c '✓') ✓)"
    fi
  done
}

case "$QUE" in
  muro)  azul "── el muro (puerto 8099) ──";  servidor 8099 && for t in "${MURO[@]}";  do correr "$t"; done ;;
  rollo) azul "── el rollo (puerto 8890) ──"; servidor 8890 && for t in "${ROLLO[@]}"; do correr "$t"; done ;;
  sql)   sql ;;
  inv)   azul "── las invitaciones ──"; correr invitaciones ;;   # suelta: no necesita servidor
  todo)
    azul "── el muro (puerto 8099) ──";  servidor 8099 && for t in "${MURO[@]}";  do correr "$t"; done
    azul "── el rollo (puerto 8890) ──"; servidor 8890 && for t in "${ROLLO[@]}"; do correr "$t"; done
    sql ;;
  *) echo "uso: bash pruebas/todo.sh [todo|muro|rollo|sql|inv]"; exit 2 ;;
esac

if [ ${#FALLARON[@]} -eq 0 ]; then
  printf '\n\033[32m✓ todo en pie\033[0m\n'
else
  printf '\n\033[31m✗ fallaron: %s\033[0m\n' "${FALLARON[*]}"
  exit 1
fi
