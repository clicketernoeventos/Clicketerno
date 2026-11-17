/* Arma la guía PDF del panel de canciones de UNA fiesta.
 *
 *     node flyer/armar-canciones.js <direccion-del-panel> [clave] [salida.pdf]
 *
 * La guía es genérica (flyer/canciones.html no nombra ninguna fiesta); acá se le escribe la dirección y la clave.
 * Sin clave, deja una línea en blanco para escribirla a mano: una clave que no tenemos no se inventa.
 * La captura sale de la demostración del propio panel (canciones de ejemplo, nada de ningún cliente). */
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const [,, direccion, clave, salida] = process.argv;
if (!direccion){ console.error('Falta la dirección del panel.'); process.exit(1); }
const esc = t => String(t).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
(async () => {
  const nav = await chromium.launch();
  const raiz = path.join(__dirname, '..');
  /* la captura del panel en demostración, sin el nombre de ninguna fiesta */
  const ctx = await nav.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto('file://' + path.join(raiz, 'julieta', 'canciones', 'index.html') + '?demo=1');
  await p.waitForTimeout(700);
  await p.evaluate(() => { document.getElementById('demo').hidden = true; document.getElementById('sub').textContent = 'Panel de administración · Tu fiesta'; });
  const png = await p.screenshot({ clip: { x: 0, y: 0, width: 390, height: 690 } });
  await ctx.close();
  let html = fs.readFileSync(path.join(__dirname, 'canciones.html'), 'utf8');
  html = html.replace('{{LINK}}', esc(direccion.replace(/^https?:\/\//, '')))
             .replace('{{CLAVE}}', clave ? '<b>' + esc(clave) + '</b>' : '<span class="blanco"></span>')
             .replace('{{CAPTURA}}', 'data:image/png;base64,' + png.toString('base64'));
  const tmp = path.join(__dirname, '.canciones-armada.html');
  fs.writeFileSync(tmp, html);
  const c2 = await nav.newContext(); const pg = await c2.newPage();
  await pg.goto('file://' + tmp, { waitUntil: 'networkidle' });
  await pg.emulateMedia({ media: 'print' });
  const destino = salida || path.join(__dirname, 'canciones.pdf');
  await pg.pdf({ path: destino, format: 'A4', printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } });
  fs.unlinkSync(tmp);
  await nav.close();
  console.log('Listo:', destino);
})();
