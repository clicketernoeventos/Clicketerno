/* ═══════════════════════════════════════════════════════════════
   EL TABLERO EN UN TELÉFONO

   El tablero está pensado para un proyector: la foto grande a la
   izquierda y una columna de "entrando ahora" a la derecha. En un
   celular de 390px esa columna se lleva 190 —su mínimo— y a la foto
   principal le quedan unos 160 de ancho contra todo el alto. Con
   `object-fit:cover` eso no achica la foto: la RECORTA. De una foto
   vertical de teléfono se ve una tajada, y lo mismo las tres del
   costado.

   Lo reportó el dueño mirándolo en su iPhone.

   Lo que se mide acá no es el CSS, es cuánto de la foto se ve: con
   `cover`, la parte visible es la razón entre la forma de la caja y
   la forma de la imagen. Abajo del 60% ya no es un encuadre, es una
   tajada.

   Contra el código anterior falla: la principal mostraba ~35%.
   ═══════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:8099';
const TELEFONO = { width: 390, height: 844 };
const PROYECTOR = { width: 1920, height: 1080 };

const fallas = [];
const mal = (m) => { fallas.push(m); console.log('  ✗ ' + m); };
const bien = (m) => console.log('  ✓ ' + m);
const titulo = (t) => console.log('\n─── ' + t + ' ───');

/* Qué fracción de la imagen entra en su caja. Con object-fit:cover se
   recorta lo que sobra del lado largo; con contain se ve entera. */
const visible = (p, sel) => p.evaluate((s) => {
  const out = [];
  for (const n of document.querySelectorAll(s)) {
    const c = n.getBoundingClientRect();
    const iw = n.naturalWidth || n.videoWidth || 0, ih = n.naturalHeight || n.videoHeight || 0;
    if (!c.width || !c.height || !iw || !ih) continue;
    const ajuste = getComputedStyle(n).objectFit;
    if (ajuste === 'contain' || ajuste === 'scale-down') { out.push(1); continue; }
    const rc = c.width / c.height, ri = iw / ih;
    /* con cover se ve la fracción menor entre las dos formas */
    out.push(rc > ri ? ri / rc : rc / ri);
  }
  return out;
}, sel);

async function abrirTablero(browser, viewport) {
  const ctx = await browser.newContext({ viewport });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`${BASE}/muro.html?demo=1#pantalla/DEMO-FIESTA`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3500);
  /* la demostración entra proyectando el muro: hay que pedir el tablero */
  await p.click('[data-modo="tablero"]').catch(() => {});
  await p.waitForTimeout(2500);
  return { ctx, p, errs };
}

(async () => {
  const browser = await chromium.launch();

  titulo('en un teléfono las fotos del tablero no salen cortadas');
  {
    const { ctx, p, errs } = await abrirTablero(browser, TELEFONO);
    const hay = await p.evaluate(() => {
      const t = document.querySelector('#salaTablero');
      return !!t && !t.hidden && t.getBoundingClientRect().height > 100;
    });
    if (!hay) { mal('no se abrió el tablero: no se puede medir nada'); }
    else {
      bien('el tablero abre en el teléfono');
      /* La proyección rota cada siete segundos y a veces toca un saludo
         escrito, que no tiene imagen. Se espera a que toque una foto: medir
         lo que justo había es medir el azar. */
      await p.waitForSelector('.tab-foto img, .tab-foto video', { timeout: 30000 }).catch(() => {});
      const caja = await p.evaluate(() => {
        const f = document.querySelector('.tab-foto');
        const c = f && f.getBoundingClientRect();
        return c ? { w: Math.round(c.width), h: Math.round(c.height) } : null;
      });
      if (caja) {
        /* Una caja mucho más alta que ancha recorta cualquier foto, saque
           uno como saque. Es el problema de fondo, antes que el encuadre. */
        const forma = caja.w / caja.h;
        if (forma < 0.5)
          mal(`la caja de la foto principal es una rendija: ${caja.w}x${caja.h}`);
        else bien(`la caja de la foto principal tiene forma de foto: ${caja.w}x${caja.h}`);
      }
      const grande = await visible(p, '.tab-foto img, .tab-foto video');
      if (!grande.length) mal('no llegó a tocar ninguna foto en 30 s: no se pudo medir');
      else {
        const peor = Math.min(...grande);
        if (peor < 0.6)
          mal(`de la foto principal se ve el ${Math.round(peor * 100)}%: sale cortada`);
        else bien(`de la foto principal se ve el ${Math.round(peor * 100)}%`);
      }
      const lado = await visible(p, '.tab-cola .prox img, .tab-cola .prox video');
      if (!lado.length) mal('no hay fotos en "entrando ahora" para medir');
      else {
        const peor = Math.min(...lado);
        if (peor < 0.6)
          mal(`de las de "entrando ahora" se ve el ${Math.round(peor * 100)}%: salen cortadas`);
        else bien(`de las de "entrando ahora" se ve el ${Math.round(peor * 100)}% (${lado.length} fotos)`);
      }
      /* Y que no se salga nada por el costado, que es lo otro que pasa
         cuando una columna tiene un mínimo más ancho que la pantalla. */
      const sobra = await p.evaluate(() => {
        const t = document.querySelector('#salaTablero');
        return Math.round(t.scrollWidth - t.clientWidth);
      });
      if (sobra > 2) mal(`el tablero se sale ${sobra}px por el costado`);
      else bien('y no se sale por el costado');
    }
    if (errs.length) mal('errores JS: ' + errs[0]);
    await ctx.close();
  }

  /* La otra mitad: el proyector es para lo que está hecho y no se puede
     romper por arreglar el teléfono. */
  titulo('y en el proyector sigue siendo el tablero de siempre');
  {
    const { ctx, p, errs } = await abrirTablero(browser, PROYECTOR);
    const caja = await p.evaluate(() => {
      const f = document.querySelector('.tab-foto'), l = document.querySelector('.tab-lado');
      if (!f || !l) return null;
      const cf = f.getBoundingClientRect(), cl = l.getBoundingClientRect();
      return { foto: Math.round(cf.width), lado: Math.round(cl.width),
               aLaDerecha: cl.left > cf.left + cf.width - 5 };
    });
    if (!caja) mal('no encontré el tablero en el proyector');
    else if (!caja.aLaDerecha)
      mal(`en 1920 la columna dejó de estar al costado (foto ${caja.foto}, lado ${caja.lado})`);
    else bien(`en 1920 sigue a dos columnas: foto ${caja.foto}px, lado ${caja.lado}px`);
    if (errs.length) mal('errores JS en el proyector: ' + errs[0]);
    await ctx.close();
  }

  await browser.close();
  console.log(fallas.length ? `\n${fallas.length} FALLAS` : '\n✓ Sin fallas');
  process.exit(fallas.length ? 1 : 0);
})().catch((e) => { console.log('SE CORTÓ: ' + e.message); process.exit(1); });
