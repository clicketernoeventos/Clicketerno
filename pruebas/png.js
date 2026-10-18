/* ═══════════════════════════════════════════════════════════════
   Leer un PNG sin dependencias. Solo lo que saca Playwright:
   8 bits por canal, en gris (0 y 4) o en color (2 y 6), sin
   entrelazado.

   Existe para una sola cosa, y es la que ninguna otra prueba puede
   hacer: medir el contraste de un texto que cae SOBRE UNA FOTO.
   El medidor de contraste sube por el árbol buscando el primer
   fondo opaco, y con una portada a sangre ese fondo es el
   `background-color` del contenedor —no la foto—, así que da un
   número perfecto y falso. Lo único que no miente es el píxel.
   ═══════════════════════════════════════════════════════════════ */
const zlib = require('zlib');

function leerPNG(buf){
  if (buf.readUInt32BE(0) !== 0x89504E47) throw new Error('no es un PNG');
  let i = 8, ancho = 0, alto = 0, bits = 0, tipo = 0, trozos = [];
  while (i < buf.length){
    const largo = buf.readUInt32BE(i), nombre = buf.toString('ascii', i+4, i+8);
    const datos = buf.subarray(i+8, i+8+largo);
    if (nombre === 'IHDR'){
      ancho = datos.readUInt32BE(0); alto = datos.readUInt32BE(4);
      bits = datos[8]; tipo = datos[9];
      if (datos[12] !== 0) throw new Error('PNG entrelazado');
    } else if (nombre === 'IDAT') trozos.push(datos);
    else if (nombre === 'IEND') break;
    i += 12 + largo;
  }
  const CANALES = {0:1, 2:3, 4:2, 6:4};
  if (bits !== 8 || !CANALES[tipo]) throw new Error('PNG ' + bits + '/' + tipo + ' no soportado');
  const canales = CANALES[tipo];
  const crudo = zlib.inflateSync(Buffer.concat(trozos));
  const linea = ancho * canales;
  const pix = Buffer.alloc(alto * linea);
  let p = 0;
  for (let y = 0; y < alto; y++){
    const filtro = crudo[p++];
    const ent = crudo.subarray(p, p + linea); p += linea;
    const sal = pix.subarray(y * linea, (y+1) * linea);
    const arr = y ? pix.subarray((y-1) * linea, y * linea) : null;
    for (let x = 0; x < linea; x++){
      const a = x >= canales ? sal[x - canales] : 0;
      const b = arr ? arr[x] : 0;
      const c = (arr && x >= canales) ? arr[x - canales] : 0;
      let v = ent[x];
      if (filtro === 1) v += a;
      else if (filtro === 2) v += b;
      else if (filtro === 3) v += (a + b) >> 1;
      else if (filtro === 4){
        const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2*c);
        v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
      }
      sal[x] = v & 255;
    }
  }
  /* En gris, el canal único ES el color: devolverlo como si fuera
     el rojo de un RGB daría luminancias de un cuarto de lo real. */
  return { ancho, alto, canales, gris: tipo === 0 || tipo === 4, pix };
}

/* El píxel MÁS CLARO de un rectángulo. Para una tinta clara —que es
   la que se usa sobre una foto— el peor caso es el fondo más claro
   que haya quedado debajo, no el promedio: el promedio esconde
   justo el reflejo que se come la letra. */
function masClaro(img, x, y, w, h){
  const { ancho, alto, canales, gris, pix } = img;
  const x0 = Math.max(0, Math.round(x)), y0 = Math.max(0, Math.round(y));
  const x1 = Math.min(ancho, Math.round(x + w)), y1 = Math.min(alto, Math.round(y + h));
  let mejor = null, lum = -1;
  for (let yy = y0; yy < y1; yy++){
    for (let xx = x0; xx < x1; xx++){
      const o = (yy * ancho + xx) * canales;
      const c = gris ? [pix[o], pix[o], pix[o]] : [pix[o], pix[o+1], pix[o+2]];
      const l = .2126*c[0] + .7152*c[1] + .0722*c[2];
      if (l > lum){ lum = l; mejor = c; }
    }
  }
  return mejor;
}

const luminancia = c => { const f = v => { v /= 255; return v <= .03928 ? v/12.92 : Math.pow((v+.055)/1.055, 2.4); };
  return .2126*f(c[0]) + .7152*f(c[1]) + .0722*f(c[2]); };

function razon(a, b){
  const x = luminancia(a), y = luminancia(b);
  return (Math.max(x,y) + .05) / (Math.min(x,y) + .05);
}

module.exports = { leerPNG, masClaro, razon };
