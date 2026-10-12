/* El flyer cuadrado para el Marketplace de Facebook.
 *
 *     python3 video/bajar_fuentes.py          (una vez: incrusta las fuentes)
 *     BASE=http://127.0.0.1:8099 node video/capturar.js
 *     BASE=http://127.0.0.1:8099 node video/flyer.js
 *
 * 1200x1200 porque la grilla del Marketplace recorta a cuadrado.
 * Las capturas se regeneran a propósito: guardadas, el día que la
 * invitación cambie el flyer seguiría mostrando la versión vieja.
 * Y se comprueba que la Bodoni haya entrado y que nada se haya
 * desbordado: un flyer con la tipografía de reemplazo, o con el pie
 * cortado, no avisa — sale mal y listo. */
const { chromium } = require('playwright');
const SALIDA = __dirname + '/flyer-invitaciones.jpg';

(async () => {
  const nav = await chromium.launch();
  const ctx = await nav.newContext({ viewport: { width: 1200, height: 1200 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));

  await p.goto((process.env.BASE || 'http://127.0.0.1:8099') + '/video/flyer.html', { waitUntil: 'load' });
  await p.waitForTimeout(1200);

  const est = await p.evaluate(() => ({
    familia: getComputedStyle(document.querySelector('h1')).fontFamily,
    bodoni: document.fonts && document.fonts.check('600 40px "Bodoni Moda"'),
    alto: document.body.scrollHeight,
    fotos: [...document.querySelectorAll('.tel img')].filter(i => i.naturalWidth > 0).length,
    /* El pie es lo último y lo que más se desborda: si su borde de abajo
       se pasa de 1200, en la imagen no está el teléfono. */
    pie: Math.round(document.querySelector('.pie').getBoundingClientRect().bottom),
    /* Los teléfonos son `absolute` adentro de una caja flexible: si la
       caja queda corta se le montan a las fichas de abajo y les tapan
       los títulos. No se ve en ningún error, se ve en la imagen. */
    monta: (() => {
      const caja = document.querySelector('.fotos').getBoundingClientRect();
      const chips = document.querySelector('.chips').getBoundingClientRect();
      return [...document.querySelectorAll('.tel')]
        .map(t => Math.round(t.getBoundingClientRect().bottom))
        .filter(b => b > chips.top + 1).length + '/' + 3 +
        ' (caja hasta ' + Math.round(caja.bottom) + ', fichas desde ' + Math.round(chips.top) + ')';
    })(),
  }));
  console.log(`  tipografía: ${est.familia} · Bodoni: ${est.bodoni} · alto: ${est.alto} · capturas: ${est.fotos}/3 · pie termina en ${est.pie} · teléfonos encima de las fichas: ${est.monta}`);
  if (!est.bodoni) console.log('  ⚠ la Bodoni NO entró: corré python3 video/bajar_fuentes.py');
  if (est.fotos < 3) console.log('  ⚠ faltan capturas: corré node video/capturar.js');
  if (est.alto !== 1200) console.log(`  ⚠ el contenido mide ${est.alto}, no 1200: algo se desbordó`);
  if (est.pie > 1200) console.log(`  ⚠ el pie se sale: termina en ${est.pie}`);
  if (!est.monta.startsWith('0/')) console.log(`  ⚠ los teléfonos tapan las fichas: ${est.monta}`);
  if (errs.length) console.log('  ⚠ errores:', errs.slice(0, 2));

  await p.screenshot({ path: SALIDA, type: 'jpeg', quality: 93 });
  await nav.close();
  console.log('  ✓ ' + SALIDA);
})();
