/* Saca las tres portadas de la galería de Trabajos de index.html, que
   es donde viven los tres modelos con la paleta de cada fiesta.

   Key y Xiomara están alojadas en Netlify y desde esta máquina NO se
   llega (el proxy las corta, igual que a Supabase), así que el marco en
   vivo no carga: lo que queda es la portada DIBUJADA que la propia
   galería pone debajo para ese caso. No es un invento del video — es el
   diseño de la página, con el nombre, el tipo y los colores reales de
   cada fiesta. Pía vive en el repo, así que ésa sí carga de verdad.

   El día que Key y Xiomara estén en el repo, esto captura las tres en
   vivo sin cambiarle una línea. */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://127.0.0.1:8097';
const DEST = path.join(__dirname, 'img-reel');

(async () => {
  fs.mkdirSync(DEST, { recursive: true });
  const nav = await chromium.launch();
  const ctx = await nav.newContext({ viewport: { width: 1280, height: 1400 }, deviceScaleFactor: 3 });
  const pag = await ctx.newPage();
  /* Que no se quede esperando a Netlify: aborta y la galería cae sola
     a la portada dibujada, que es lo que vamos a capturar. */
  await pag.route('**netlify.app**', r => r.abort());
  await pag.goto(BASE + '/index.html#trabajos', { waitUntil: 'load' });
  await pag.waitForTimeout(6000);

  const n = await pag.locator('.trabajo').count();
  if (n !== 3) console.log(`  ojo: la galería tiene ${n} tarjetas, no 3`);
  for (let i = 0; i < n; i++) {
    const t = pag.locator('.trabajo').nth(i);
    const nombre = (await t.locator('.pie-t b').innerText().catch(() => 'x'))
      .trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    await t.locator('.cuerpo-t, .pantalla-t').first()
      .screenshot({ path: path.join(DEST, nombre + '.png') });
    console.log('  · ' + nombre);
  }
  await nav.close();
})().catch(e => { console.log('SE CORTÓ: ' + e.message); process.exit(1); });
