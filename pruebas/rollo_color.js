/* ═══════════════════════════════════════════════════════════════
   EL COLOR DE LA FIESTA

   La otra mitad de "darle forma al rollo": que la cámara del
   invitado se parezca a ESA fiesta y no a todas las demás. Hasta
   acá todos los rollos nacían del mismo dorado y el organizador no
   tenía dónde cambiarlo.

   Lo que se mide:
     · que el organizador pueda elegir, y que quede guardado
     · que el color le LLEGUE al invitado, que es el punto
     · que el disparador no quede de dos colores distintos
     · que si no se pudo guardar, no le mienta
     · que el tono de un evento no se le pegue al siguiente

   Contra el código anterior falla entera: no existía el selector.
   ═══════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:8890';
const TELEFONO = { width: 390, height: 844 };
const COD = 'QUI-COLOR1', COD2 = 'QUI-COLOR2', CLAVE = 'clave-color';
const SALVIA = '#9FB39B';

const fallas = [];
const mal = (m) => { fallas.push(m); console.log('  ✗ ' + m); };
const bien = (m) => console.log('  ✓ ' + m);
const titulo = (t) => console.log('\n─── ' + t + ' ───');

/* Una base de mentira con dos rollos, para poder mirar también que el
   color de uno no se le quede pegado al otro. */
function baseFalsa({ fallaGuardar = false } = {}) {
  const db = [
    { codigo: COD, nombre: 'Los 15 de Delfina', fecha: '2026-12-20', tono: '#D9AE72',
      camara: true, cerrado: false, revelado: false, revela_en: null, cupo_fotos: 24,
      portada: '', creado: Date.now() },
    { codigo: COD2, nombre: 'Casamiento de Ana', fecha: '2026-12-27', tono: '#D8A0A6',
      camara: true, cerrado: false, revelado: false, revela_en: null, cupo_fotos: 24,
      portada: '', creado: Date.now() },
  ];
  return {
    db,
    instalar: async (page) => {
      await page.route('**/kuqlqgrwsospwjexodqa.supabase.co/**', (r) => {
        const req = r.request(), u = req.url(), m = req.method();
        const json = (b, s = 200) => r.fulfill({ status: s, contentType: 'application/json',
          body: JSON.stringify(b) });
        const cual = () => db.find((e) => u.includes(encodeURIComponent(e.codigo)) || u.includes(e.codigo));
        if (u.includes('/rpc/ce_quien_soy')) return json({ llego_la_clave: true, es_maestra: false });
        if (u.includes('/rpc/ce_mi_rollo')) {
          const e = cual() || db[0];
          return json({ nombre: 'Vos', cupo: e.cupo_fotos, disparos: 0,
            revelado: false, revela_en: null, cerrado: false });
        }
        if (u.includes('/rpc/')) return json([]);
        if (u.includes('ce_eventos')) {
          if (m === 'PATCH') {
            if (fallaGuardar) return r.fulfill({ status: 500, contentType: 'application/json',
              body: '{"message":"la base dijo que no"}' });
            const e = cual();
            if (e) Object.assign(e, JSON.parse(req.postData() || '{}'));
            return r.fulfill({ status: 204, body: '' });
          }
          const e = cual();
          return json(e ? [e] : []);
        }
        return json([]);
      });
    },
  };
}

async function abrir(browser, fake, { conClave = true } = {}) {
  const ctx = await browser.newContext({ viewport: TELEFONO, permissions: ['camera'] });
  if (conClave) await ctx.addInitScript((c) => {
    try { localStorage.setItem('ce:rollo:claves', JSON.stringify(c)); } catch (e) {}
    try { localStorage.setItem('ce:claves', JSON.stringify(c)); } catch (e) {}
  }, { [COD]: CLAVE, [COD2]: CLAVE });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await fake.instalar(p);
  return { ctx, p, errs };
}

/* Los dos colores que de verdad se dibujan, leídos del documento. */
const colores = (p) => p.evaluate(() => {
  const s = getComputedStyle(document.documentElement);
  return { oro: (s.getPropertyValue('--oro') || '').trim(),
           hondo: (s.getPropertyValue('--oro-hondo') || '').trim() };
});

(async () => {
  const browser = await chromium.launch({
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });

  /* ══ 1 · EL ORGANIZADOR ELIGE ══ */
  titulo('el organizador puede elegir el color');
  const fake = baseFalsa();
  const { ctx, p, errs } = await abrir(browser, fake);
  await p.goto(`${BASE}/rollo.html#ajustes/${COD}`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2500);
  const pastillas = await p.locator('#tonos .tono').count();
  if (pastillas < 2) { mal(`no hay dónde elegir el color: ${pastillas} pastillas`); }
  else {
    bien(`hay ${pastillas} colores para elegir`);
    /* Los 44px de toque: es un círculo chico y es justo donde se escapan. */
    const chicas = await p.$$eval('#tonos .tono', (ns) => ns.filter((n) => {
      const c = n.getBoundingClientRect(); return c.width < 44 || c.height < 44; }).length);
    if (chicas) mal(`${chicas} pastillas de color no llegan a 44x44`);
    else bien('y todas llegan a 44x44');

    const antes = await colores(p);
    await p.click(`#tonos .tono[data-c="${SALVIA}"]`);
    await p.waitForTimeout(1200);
    const guardado = (fake.db.find((e) => e.codigo === COD) || {}).tono;
    if (guardado !== SALVIA) mal(`no lo guardó en la base: quedó "${guardado}"`);
    else bien('lo guarda en la base');
    const luego = await colores(p);
    if (luego.oro === antes.oro) mal(`la pantalla no cambió de color: sigue en ${luego.oro}`);
    else bien(`y la pantalla se pinta en el acto: ${antes.oro} → ${luego.oro}`);
    /* El disparador es un degradé de --oro y --oro-hondo: si solo cambia
       uno, el botón queda de dorado a verde en el mismo círculo. */
    if (luego.hondo === antes.hondo)
      mal(`el color hondo no acompañó: quedó ${luego.hondo}, del dorado de antes`);
    else bien(`y el hondo lo acompaña: ${antes.hondo} → ${luego.hondo}`);
  }
  if (errs.length) mal('errores JS: ' + errs[0]);
  await ctx.close();

  /* ══ 2 · LE LLEGA AL INVITADO ══
     Es el punto de todo esto: el organizador no elige un color para su
     panel, lo elige para la cámara de los invitados. */
  titulo('el color le llega al invitado');
  {
    const { ctx: c2, p: p2, errs: e2 } = await abrir(browser, fake, { conClave: false });
    await p2.goto(`${BASE}/rollo.html?e=${COD}`, { waitUntil: 'domcontentloaded' });
    await p2.waitForTimeout(3000);
    const c = await colores(p2);
    if (c.oro.toLowerCase() !== SALVIA.toLowerCase())
      mal(`el invitado ve ${c.oro}, no el color de la fiesta (${SALVIA})`);
    else bien('el invitado abre la cámara en el color de la fiesta');
    if (e2.length) mal('errores JS del invitado: ' + e2[0]);
    await c2.close();
  }

  /* ══ 3 · NO SE LE PEGA AL SIGUIENTE ══ */
  titulo('el color de una fiesta no se le queda pegado a la otra');
  {
    const { ctx: c3, p: p3, errs: e3 } = await abrir(browser, fake);
    await p3.goto(`${BASE}/rollo.html#ajustes/${COD}`, { waitUntil: 'domcontentloaded' });
    await p3.waitForTimeout(2500);
    const uno = (await colores(p3)).oro;
    await p3.evaluate((c) => { location.hash = 'ajustes/' + c; }, COD2);
    await p3.waitForTimeout(2500);
    const dos = (await colores(p3)).oro;
    if (dos === uno) mal(`las dos fiestas se ven del mismo color (${dos})`);
    else bien(`cada fiesta con el suyo: ${uno} y ${dos}`);
    if (e3.length) mal('errores JS: ' + e3[0]);
    await c3.close();
  }

  /* ══ 4 · SI NO SE GUARDÓ, NO SE MIENTE ══ */
  titulo('si la base se niega, no le miente');
  {
    const roto = baseFalsa({ fallaGuardar: true });
    const { ctx: c4, p: p4, errs: e4 } = await abrir(browser, roto);
    await p4.goto(`${BASE}/rollo.html#ajustes/${COD}`, { waitUntil: 'domcontentloaded' });
    await p4.waitForTimeout(2500);
    const antes = (await colores(p4)).oro;
    await p4.click(`#tonos .tono[data-c="${SALVIA}"]`);
    await p4.waitForTimeout(1500);
    const texto = (await p4.evaluate(() => document.body.innerText)).toLowerCase();
    if (!/no se pudo/.test(texto)) mal(`no avisa que falló: "${texto.slice(0, 120)}"`);
    else bien('avisa que no se pudo guardar');
    const luego = (await colores(p4)).oro;
    if (luego !== antes)
      mal(`quedó pintado de un color que NO se guardó: ${luego}`);
    else bien('y vuelve al color que de verdad está guardado');
    const marcada = await p4.$$eval('#tonos .tono[aria-pressed=true]',
      (ns) => ns.map((n) => n.dataset.c));
    if (marcada.length !== 1 || marcada[0].toLowerCase() === SALVIA.toLowerCase())
      mal(`la pastilla marcada no dice la verdad: ${marcada.join(', ') || 'ninguna'}`);
    else bien(`y la pastilla marcada sigue siendo la guardada (${marcada[0]})`);
    if (e4.length) mal('errores JS: ' + e4[0]);
    await c4.close();
  }

  await browser.close();
  console.log(fallas.length ? `\n${fallas.length} FALLAS` : '\n✓ Sin fallas');
  process.exit(fallas.length ? 1 : 0);
})().catch((e) => { console.log('SE CORTÓ: ' + e.message); process.exit(1); });
