/* Arma el flyer del listado: un PDF A4 para mandar o imprimir, y las
   mismas hojas en imagen, que es lo que se ve sin abrir nada en el chat.

       bash flyer/armar.sh

   Por qué sale de un HTML y no de un diseño hecho a mano: el día que el
   tablero cambie, el flyer se rehace con un comando en vez de volver a
   dibujarlo — y así lo puede medir una prueba. Es la misma decisión que
   las piezas de video: no se publican, se arman acá y se mandan.

   Las imágenes se cortan POR SECCIÓN, no en pedazos iguales: cortar cada
   N píxeles parte un renglón al medio y el que lo recibe ve media
   palabra arriba y media abajo. Se le pregunta al navegador dónde
   termina cada bloque y se corta ahí. */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const AQUI = __dirname;
const FUENTE = 'file://' + path.join(AQUI, 'listado.html');
const ANCHO = 1080;              // ancho cómodo para WhatsApp
const ALTO_MAX = 2200;           // lo que entra de una en una pantalla sin marear

(async () => {
  const navegador = await chromium.launch();

  /* ── el PDF ── */
  const ctxPdf = await navegador.newContext();
  const pPdf = await ctxPdf.newPage();
  await pPdf.goto(FUENTE, { waitUntil: 'networkidle' });
  await pPdf.emulateMedia({ media: 'print' });
  await pPdf.pdf({
    path: path.join(AQUI, 'listado.pdf'),
    format: 'A4', printBackground: true,
    margin: { top: '14mm', bottom: '14mm', left: '14mm', right: '14mm' },
  });
  await ctxPdf.close();

  /* ── las imágenes ── */
  const ctx = await navegador.newContext({
    viewport: { width: ANCHO, height: 1400 }, deviceScaleFactor: 2,
  });
  const p = await ctx.newPage();
  await p.goto(FUENTE, { waitUntil: 'networkidle' });
  await p.waitForTimeout(400);

  /* Los botones no van en una imagen: no se tocan. */
  await p.addStyleTag({ content: '.no-papel{display:none}' });
  await p.waitForTimeout(100);

  /* Dónde termina cada bloque, para cortar sin partir un renglón. */
  const cortes = await p.evaluate((altoMax) => {
    const fin = [...document.querySelectorAll('header, section, footer')]
      .map((e) => Math.round(e.getBoundingClientRect().bottom + scrollY));
    const total = document.body.scrollHeight;
    const hojas = [];
    let desde = 0;
    while (desde < total - 2) {
      const cabe = fin.filter((y) => y > desde && y - desde <= altoMax);
      const hasta = cabe.length ? Math.max(...cabe) : Math.min(desde + altoMax, total);
      hojas.push({ y: desde, alto: hasta - desde });
      desde = hasta;
    }
    /* Una última hoja de dos dedos es un recorte, no una hoja: el que
       la recibe ve una tira con el pie de página y nada más. Si lo que
       sobra al final es poco, se le suma a la anterior. */
    if (hojas.length > 1 && hojas[hojas.length - 1].alto < 420) {
      const sobra = hojas.pop();
      hojas[hojas.length - 1].alto += sobra.alto;
    }
    return hojas;
  }, ALTO_MAX);

  fs.readdirSync(AQUI).filter((f) => /^listado-\d+\.png$/.test(f))
    .forEach((f) => fs.unlinkSync(path.join(AQUI, f)));

  for (let i = 0; i < cortes.length; i++) {
    const c = cortes[i];
    /* `fullPage` ADEMÁS del recorte: sin eso, un recorte más alto que
       la ventana cae afuera de la imagen y el navegador se niega. */
    await p.screenshot({
      path: path.join(AQUI, `listado-${i + 1}.png`),
      fullPage: true,
      clip: { x: 0, y: c.y, width: ANCHO, height: c.alto },
    });
  }

  await navegador.close();
  const pdf = fs.statSync(path.join(AQUI, 'listado.pdf')).size;
  console.log(`listado.pdf        ${(pdf / 1024).toFixed(0)} KB`);
  cortes.forEach((c, i) => {
    const k = fs.statSync(path.join(AQUI, `listado-${i + 1}.png`)).size;
    console.log(`listado-${i + 1}.png     ${ANCHO}x${c.alto}  ${(k / 1024).toFixed(0)} KB`);
  });
})().catch((e) => { console.log('SE CORTÓ: ' + e.message); process.exit(1); });
