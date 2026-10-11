/* Saca el afiche que se le manda por WhatsApp a quien pregunta por una
   invitación: 1080x1920, los cuatro pasos, qué hace falta de él, y tres
   capturas REALES de pia/nueva — no un mockup dibujado.
 *
 *     python3 video/bajar_fuentes.py          (una vez: incrusta las fuentes)
 *     BASE=http://127.0.0.1:8099 node video/capturar.js
 *     BASE=http://127.0.0.1:8099 node video/afiche.js
 *
 * Las capturas se regeneran a propósito: guardadas, el día que la
 * invitación cambie el afiche seguiría mostrando la versión vieja.
 * Y se comprueba que la Bodoni haya entrado: un afiche con la tipografía
 * de reemplazo no avisa, sale mal y listo. */
const { chromium } = require('playwright');
const SALIDA = __dirname + '/afiche-invitaciones.jpg';

(async () => {
  const nav = await chromium.launch();
  const ctx = await nav.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));

  await p.goto((process.env.BASE || 'http://127.0.0.1:8099') + '/video/afiche.html', { waitUntil: 'load' });
  await p.waitForTimeout(1200);

  const est = await p.evaluate(() => ({
    familia: getComputedStyle(document.querySelector('h1')).fontFamily,
    bodoni: document.fonts && document.fonts.check('40px "Bodoni Moda"'),
    alto: document.body.scrollHeight,
    fotos: [...document.querySelectorAll('.tel img')].filter(i => i.naturalWidth > 0).length,
  }));
  console.log(`  tipografía: ${est.familia} · Bodoni: ${est.bodoni} · alto: ${est.alto} · capturas: ${est.fotos}/3`);
  if (!est.bodoni) console.log('  ⚠ la Bodoni NO entró: corré python3 video/bajar_fuentes.py');
  if (est.fotos < 3) console.log('  ⚠ faltan capturas: corré node video/capturar.js');
  if (est.alto !== 1920) console.log(`  ⚠ el contenido mide ${est.alto}, no 1920: algo se desbordó`);
  if (errs.length) console.log('  ⚠ errores:', errs.slice(0, 2));

  await p.screenshot({ path: SALIDA, type: 'jpeg', quality: 92 });
  await nav.close();
  console.log('  ✓ ' + SALIDA);
})();
