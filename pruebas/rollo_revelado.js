/* ═══════════════════════════════════════════════════════════════
   EL CUARTO OSCURO SE TIENE QUE VER

   El revelado es EL momento del producto: es lo que el invitado
   esperó toda la noche sin poder mirar una sola foto. Y estaba
   pasando demasiado rápido — probado en un iPhone de verdad.

   El problema no era la duración total, era otra cosa: las copias
   caen TODAS en el mismo lugar de la bandeja, una encima de la
   otra. La imagen tarda unos dos segundos en subir desde el papel,
   pero la copia siguiente caía a los 680 ms: o sea que tapaba a la
   anterior cuando todavía estaba a medio revelar. De las cinco
   copias, el invitado veía revelarse UNA, la última.

   Lo que se mide acá:
     · que entre una copia y la siguiente pase el tiempo suficiente
       para verla revelarse (si no, el efecto existe y no se ve)
     · que la imagen suba despacio, no de golpe
     · que igual se pueda saltear, y pronto
     · que termine: un cuarto oscuro que no abre el álbum es una
       pantalla negra para siempre

   Contra el código anterior falla: las copias caían cada 680 ms
   con un revelado de 2 s encima.
   ═══════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:8890';
const TELEFONO = { width: 390, height: 844 };

const fallas = [];
const mal = (m) => { fallas.push(m); console.log('  ✗ ' + m); };
const bien = (m) => console.log('  ✓ ' + m);
const titulo = (t) => console.log('\n─── ' + t + ' ───');

(async () => {
  const browser = await chromium.launch({
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
  const ctx = await browser.newContext({ viewport: TELEFONO, permissions: ['camera'] });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));

  titulo('cada copia se alcanza a ver revelar');
  /* La demostración entra al álbum ya revelado y deja el cuarto oscuro a un
     toque: es el único lugar donde se puede mirar el efecto sin una fiesta
     de verdad. */
  await p.goto(`${BASE}/rollo.html?demo=1`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3500);

  const hayBoton = await p.$('#verRevelado');
  if (!hayBoton) { mal('no encontré "Ver cómo se revela" en la demostración'); }
  else {
    /* Se anota CUÁNDO cae cada copia y cuándo empieza a revelarse, mirando
       el DOM de verdad en vez de suponer los tiempos del código. */
    await p.evaluate(() => {
      window.__revelado = { copias: [], reveladas: [], fin: null, inicio: performance.now() };
      const obs = new MutationObserver((ms) => {
        for (const m of ms) {
          for (const n of m.addedNodes) {
            if (n.nodeType === 1 && n.classList && n.classList.contains('copia'))
              window.__revelado.copias.push(performance.now());
          }
          if (m.type === 'attributes' && m.target.classList
              && m.target.classList.contains('copia')
              && m.target.classList.contains('revelada')
              && !m.target.__anotada) {
            m.target.__anotada = true;
            window.__revelado.reveladas.push(performance.now());
          }
        }
      });
      obs.observe(document.body, { childList: true, subtree: true,
                                   attributes: true, attributeFilter: ['class'] });
    });

    await p.click('#verRevelado');
    await p.waitForTimeout(600);
    await p.evaluate(() => { window.__revelado.inicio = performance.now(); });

    /* La duración del subir de la imagen se lee del CSS aplicado, no del
       archivo: es lo que de verdad va a correr en el teléfono. */
    await p.waitForTimeout(1500);
    const trans = await p.evaluate(() => {
      const im = document.querySelector('.copia img');
      if (!im) return null;
      const s = getComputedStyle(im);
      return (s.transitionDuration || '').split(',').map((t) => parseFloat(t) || 0);
    });
    if (!trans) mal('no cayó ninguna copia en la bandeja');
    else {
      const masLenta = Math.max(...trans);
      if (masLenta < 2) mal(`la imagen sube en ${masLenta}s: es un golpe, no un revelado`);
      else bien(`la imagen sube en ${masLenta}s`);
    }

    /* El "saltear" tiene que estar a mano: alargar el efecto sin dar la
       salida es hacerle esperar a quien no lo quiere ver. */
    /* Se mira la CLASE, no la opacidad: la opacidad se lee a mitad de la
       transición y da un número distinto en cada corrida. Una prueba que
       depende de cuándo la mirás no mide nada. */
    const saltea = await p.evaluate(() => {
      const s = document.querySelector('#saltear');
      return s ? s.classList.contains('visible') : null;
    });
    if (saltea === null) mal('no hay forma de saltear el revelado');
    else if (!saltea) mal('a los 2 s el "saltear" todavía no apareció');
    else bien('y el "saltear" ya está a la vista a los 2 s');

    /* Se espera a que termine solo. El tope es generoso a propósito: lo que
       se mide es el RITMO, no la paciencia de la prueba. */
    await p.waitForFunction(() => !document.querySelector('.cuarto'), null,
      { timeout: 40000 }).catch(() => {});
    const r = await p.evaluate(() => window.__revelado);

    if (!r || r.copias.length < 2) {
      mal(`cayeron ${r ? r.copias.length : 0} copias: no se puede medir el ritmo`);
    } else {
      const huecos = r.copias.slice(1).map((t, i) => Math.round(t - r.copias[i]));
      const menor = Math.min(...huecos);
      /* La imagen tarda ~2,4 s en subir. Si la siguiente cae antes de 1,2 s,
         la de abajo se ve tapada a mitad de camino y el efecto se pierde. */
      if (menor < 1200)
        mal(`entre copia y copia pasan ${menor} ms: la siguiente tapa a la anterior ` +
            `antes de que se revele (huecos: ${huecos.join(', ')})`);
      else bien(`entre copia y copia pasan ${menor} ms, alcanza para verla revelar`);

      if (r.reveladas.length < r.copias.length)
        mal(`cayeron ${r.copias.length} copias pero solo ${r.reveladas.length} llegaron a revelarse`);
      else bien(`las ${r.copias.length} copias llegan a revelarse`);
    }

    const terminoEnAlbum = await p.evaluate(() => !!document.querySelector('.grilla'));
    if (!terminoEnAlbum) mal('el cuarto oscuro terminó y no quedó el álbum dibujado');
    else bien('y al apagarse queda el álbum');
  }

  if (errs.length) mal('errores JS en el revelado: ' + errs[0]);
  await ctx.close();
  await browser.close();
  console.log(fallas.length ? `\n${fallas.length} FALLAS` : '\n✓ Sin fallas');
  process.exit(fallas.length ? 1 : 0);
})().catch((e) => { console.log('SE CORTÓ: ' + e.message); process.exit(1); });
