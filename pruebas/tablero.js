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
const { crearFake } = require('./fakesb');
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

  /* La vitrina de la página pública. La notebook dibujada del inicio abre
     la pantalla del salón con ?marco=1, y ahí arrancaba en el CARTEL: una
     notebook con un QR gigante adentro, que no dice nada de lo que hace el
     producto y que encima nadie puede escanear desde una maqueta. Lo que
     vende es el tablero. */
  titulo('la vitrina del inicio abre en el tablero, no en el QR');
  {
    /* El camino de verdad: la notebook del inicio abre una fiesta REAL, sin
       ?demo=1. Ese es el caso que hay que medir, y no se puede medir con la
       demostración: en demostración la sala ya arrancaba en el muro, así que
       el QR no aparecía y la comprobación pasaba con el código viejo también.
       Con una fiesta de verdad el código viejo abre el cartel del QR. */
    const ctx = await browser.newContext({ viewport: { width: 1200, height: 750 } });
    const p = await ctx.newPage();
    const fake = crearFake('ok');
    await fake.instalar(p);
    const COD = 'BOD-VITRIN';
    fake.db.ce_eventos.push({ codigo: COD, nombre: 'Casamiento de muestra', tipo: 'Boda',
      fecha: '2026-12-05', moderar: false, cerrado: false, tono: '#D9AE72' });
    const FOTO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    for (let i = 0; i < 4; i++)
      fake.db.ce_items.push({ id: 'it' + i, codigo: COD, kind: 'foto', url: FOTO,
        autor: 'Invitado ' + i, texto: '', estado: 'aprobado', ts: 1000 + i });
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.goto(`${BASE}/muro.html?marco=1#pantalla/${COD}`, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(3500);
    const v = await p.evaluate(() => {
      const t = document.querySelector('#salaTablero'), c = document.querySelector('#salaCartel');
      const alto = n => (n ? Math.round(n.getBoundingClientRect().height) : 0);
      return { tablero: !!t && !t.hidden, altoTab: alto(t),
               cartel: !!c && !c.hidden, altoCartel: alto(c),
               modos: !!document.querySelector('.modos-sala:not([hidden])') };
    });
    if (!v.tablero || v.altoTab < 100)
      mal(`la vitrina no abre en el tablero (alto ${v.altoTab})`);
    else bien(`la vitrina abre en el tablero (${v.altoTab}px de alto)`);
    if (v.cartel && v.altoCartel > 10) mal('la vitrina sigue mostrando el cartel del QR');
    else bien('y el cartel del QR no está a la vista');
    /* Una maqueta no se toca: si los botones de modo se dibujaran, el
       cliente los tocaría adentro del marco y no pasaría nada. */
    if (v.modos) mal('la vitrina dibuja los botones de modo, que adentro del marco no sirven');
    else bien('sin los botones de modo, que adentro de la maqueta no se tocan');
    /* Que adentro haya una foto de verdad y la caja tenga forma de foto.
       Acá NO se mide cuánto se recorta, como sí se mide en el teléfono: la
       vitrina es una pantalla apaisada y ahí `cover` recorta a propósito,
       igual que el proyector de verdad. Medido: en 1920x1080 se ve el 43%
       y en el marco el 52%, así que exigirle 60% a la vitrina sería
       exigirle más que a la pantalla que está mostrando. Una caja con
       forma de rendija sí es un problema, y eso sí se mide. */
    await p.waitForSelector('.tab-foto img, .tab-foto video', { timeout: 30000 }).catch(() => {});
    const foto = await p.evaluate(() => {
      const n = document.querySelector('.tab-foto img, .tab-foto video');
      if (!n) return null;
      const c = n.getBoundingClientRect();
      return { w: Math.round(c.width), h: Math.round(c.height) };
    });
    if (!foto || !foto.w || !foto.h) mal('en la vitrina no llegó a tocar ninguna foto en 30 s');
    else if (foto.w / foto.h < 0.5 || foto.w / foto.h > 3)
      mal(`en la vitrina la foto principal quedó en una rendija: ${foto.w}x${foto.h}`);
    else bien(`en la vitrina se está proyectando una foto: ${foto.w}x${foto.h}`);
    if (errs.length) mal('errores JS en la vitrina: ' + errs[0]);
    await ctx.close();
  }

  await browser.close();
  console.log(fallas.length ? `\n${fallas.length} FALLAS` : '\n✓ Sin fallas');
  process.exit(fallas.length ? 1 : 0);
})().catch((e) => { console.log('SE CORTÓ: ' + e.message); process.exit(1); });
