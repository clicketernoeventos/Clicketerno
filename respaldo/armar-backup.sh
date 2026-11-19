#!/usr/bin/env bash
# Arma el respaldo de TODAS las tarjetas en un solo .zip, para guardarlo en el Drive.
#
#     bash respaldo/armar-backup.sh
#
# Sale de lo que está en git (lo publicado), no de lo que haya suelto en la carpeta, y lleva adentro un LEEME con cómo
# volver a subir una tarjeta si algo falla. El .zip NO va al repositorio (pesa decenas de MB): se rehace cuando haga falta.
set -e
cd "$(dirname "$0")/.."
FECHA=$(TZ=America/Argentina/Buenos_Aires date +%Y-%m-%d)
SALIDA="respaldo/backup-tarjetas-$FECHA.zip"
TMP=$(mktemp -d)
mkdir -p "$TMP/tarjetas"
LISTA=""
for f in tarjetas/*.html; do
  n=$(basename "$f" .html)
  [ -d "$n" ] || continue
  git archive HEAD "$n" | tar -x -C "$TMP/tarjetas"
  LISTA="$LISTA\n  - $n   →   https://clicketerno.com.ar/$n"
done
{
printf 'RESPALDO DE LAS TARJETAS DE CLICK ETERNO · %s\n\n' "$FECHA"
printf 'Adentro de la carpeta "tarjetas" hay una carpeta por cada invitación, completa: el HTML, las fotos, la música,\nlos logos y, si lo tiene, su panel (listado o canciones). Es exactamente lo que está publicado.\n\n'
printf 'LAS TARJETAS QUE HAY:%b\n\n' "$LISTA"
cat <<'TXT'
SI ALGO FALLA, QUÉ HACER

1) Una tarjeta se ve mal o desapareció de la web, pero GitHub está bien:
   no hay nada que resubir. Avisale a Claude el nombre de la tarjeta: la restaura desde el historial y la publica.

2) Se perdió una carpeta entera (o la cuenta de GitHub):
   a. Descomprimí este .zip.
   b. Entrá al repositorio en GitHub → "Add file" → "Upload files".
   c. Arrastrá la carpeta de la tarjeta (con TODO lo de adentro: fotos, música, subcarpetas) a la raíz del repositorio.
   d. "Commit changes" a la rama principal (main). Cloudflare la publica sola en uno o dos minutos.
   e. Probá la dirección: https://clicketerno.com.ar/<nombre-de-la-carpeta>
   El nombre de la carpeta es la dirección: si cambia, el link que ya mandaste deja de andar. No la renombres.

3) Pasó algo más grave (no hay GitHub): subí las carpetas a un repositorio nuevo, conectalo con Cloudflare
   y pedile a Claude que verifique que cada link abre.

LO QUE ESTE ZIP NO TRAE (se respalda aparte)

  - Las respuestas de las PLANILLAS de Google (confirmaciones y canciones): bajalas a Excel de vez en cuando,
    y siempre al terminar cada fiesta (botón "Descargar Excel" del listado, o Archivo → Descargar en la planilla).
  - Las CLAVES de los paneles y las claves maestras: no se guardan en ningún archivo a propósito.
  - Las fotos del muro y del rollo (están en Supabase).
  - Los archivos ORIGINALES que mandaron los clientes (videos, audios, fotos): guardalos en tu Drive.
TXT
} > "$TMP/LEEME-RESTAURAR.txt"
rm -f "$SALIDA"
(cd "$TMP" && zip -qr "$OLDPWD/$SALIDA" .)
rm -rf "$TMP"
echo "Listo: $SALIDA ($(du -h "$SALIDA" | cut -f1))"
