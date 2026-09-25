/* ═══════════════════════════════════════════════════════════════
   LA SUBIDA QUE SÍ ENTRÓ

   El wifi del salón se corta dos segundos. La foto LLEGÓ al
   depósito y lo que se perdió fue la respuesta. El reintento va a
   la MISMA ruta y Storage contesta 409: "ya existe".

   Hasta acá eso se trataba como una negativa: 409 es 4xx, o sea
   que no se reintenta —bien—, pero se salía por el camino del
   error. Y ahí pasaban tres cosas, todas mentira:

     · ce_devolver_foto se negaba ("Esa foto ya está subida"),
       así que la foto NO se devolvía;
     · el mensaje le decía igual "la foto te la devolvimos";
     · y el contador se quedaba en el número de antes, porque
       pintarContador() está después del throw. El servidor ya
       había anotado el disparo: la pantalla decía 24 y la base 23.

   El invitado la saca de nuevo y gasta otra de las 24. Y en el
   depósito quedan las dos.

   Es la misma regla que ya estaba escrita para anotarItem() del
   muro: un "ya estaba" es un ÉXITO, no un error. Acá faltaba la
   mitad del rollo.

   Contra el código anterior da 3 fallas.
   ═══════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:8890';
const SUPA = '**/kuqlqgrwsospwjexodqa.supabase.co/**';
const TELEFONO = { width: 390, height: 844 };
const CUPO = 24;

const fallas = [];
const mal = (m) => { fallas.push(m); console.log('  ✗ ' + m); };
const bien = (m) => console.log('  ✓ ' + m);
const titulo = (t) => console.log('\n─── ' + t + ' ───');

/* Un Supabase de mentira que se porta como el de verdad en el único
   caso que importa acá: la subida entró y la respuesta se perdió. */
function montar(page, cfg) {
  const est = cfg.estado;
  return page.route(SUPA, async (route) => {
    const u = route.request().url();
    const cuerpo = () => { try { return JSON.parse(route.request().postData() || '{}'); } catch (e) { return {}; } };
    const json = (b, s = 200) => route.fulfill({ status: s, contentType: 'application/json', body: JSON.stringify(b) });

    if (u.includes('/rest/v1/ce_eventos'))
      return json([{ codigo: 'TEST-1', nombre: 'Fiesta', tono: '#D9AE72', camara: true, cerrado: false }]);
    if (u.includes('/rpc/ce_quien_soy')) return json({ llego_la_clave: false, es_maestra: false });
    if (u.includes('/rpc/ce_mi_rollo')) return json(est);

    if (u.includes('/rpc/ce_tomar_foto')) {
      cfg.tomar = (cfg.tomar || 0) + 1;
      est.disparos++;                       // la base reserva ANTES de subir
      return json({ restantes: est.cupo - est.disparos });
    }

    if (u.includes('/storage/v1/object/ce-rollos/')) {
      cfg.subidas = (cfg.subidas || 0) + 1;
      /* Primer intento: el wifi se corta DESPUÉS de que el archivo entró.
         Segundo: la misma ruta ya existe. Es el caso real, no uno feo. */
      if (cfg.subidas === 1) return route.abort('failed');
      return route.fulfill({ status: 409, contentType: 'application/json',
        body: JSON.stringify({ statusCode: '409', error: 'Duplicate',
                               message: 'The resource already exists' }) });
    }

    if (u.includes('/rpc/ce_devolver_foto')) {
      cfg.devueltas = (cfg.devueltas || 0) + 1;
      /* Lo que contesta la de verdad: se niega, porque el archivo está.
         (sql/rollo.sql, "Esa foto ya está subida", errcode 28000) */
      return json({ message: 'Esa foto ya está subida', code: '28000' }, 400);
    }

    if (u.includes('/rpc/ce_album_de'))
      return json({ revelado: false, mias: [], todas: [], total_fotos: 0, total_invitados: 0 });
    return route.fulfill({ status: 404, body: 'no mockeado' });
  });
}

const enPantalla = (p) => p.evaluate(() => ({
  contador: Number((document.querySelector('#cRestan') || {}).textContent),
  pie: ((document.querySelector('#pieCamara') || {}).innerText || ''),
  cuerpo: document.body.innerText.toLowerCase(),
}));

(async () => {
  const browser = await chromium.launch({
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });

  titulo('la subida que sí entró no se cuenta como perdida');
  const ctx = await browser.newContext({ viewport: TELEFONO, permissions: ['camera'] });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  const cfg = { estado: { token: 'tok', nombre: 'Ana', disparos: 0, cupo: CUPO,
                          camara: true, cerrado: false, revelado: false, revela_en: null } };
  await montar(p, cfg);

  await p.goto(`${BASE}/rollo.html?e=TEST-1`, { waitUntil: 'domcontentloaded' });
  await p.evaluate(() => localStorage.setItem('ce:rollo:TEST-1',
    JSON.stringify({ token: 'tok', nombre: 'Ana' })));
  await p.reload({ waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3500);

  const hayCamara = await p.$('#disparo');
  if (!hayCamara) { mal('no abrió la cámara: no se puede medir nada'); }
  else {
    const antes = await enPantalla(p);
    await p.click('#disparo');
    /* SB.subir espera 1,2 s antes del segundo intento: hay que dejarlo. */
    await p.waitForTimeout(4500);
    const luego = await enPantalla(p);

    if (cfg.subidas < 2) mal(`no llegó a reintentar la subida: ${cfg.subidas} intento(s)`);
    else bien(`reintentó la subida (${cfg.subidas} intentos) y la segunda dio 409`);

    /* 1 · el contador. La base ya anotó el disparo: la pantalla no puede
       seguir diciendo el número de antes. */
    const esperado = CUPO - 1;
    if (luego.contador !== esperado)
      mal(`el contador quedó en ${luego.contador} y la base ya anotó ${esperado}: ` +
          `la foto se sacó y la pantalla dice que no`);
    else bien(`el contador baja a ${esperado}, que es lo que tiene la base`);

    /* 2 · el mensaje. Es la regla de siempre: si no se devolvió, no se
       puede decir que se devolvió. */
    if (/te la devolvimos|no se pudo/i.test(luego.cuerpo))
      mal(`le avisa un error a una foto que SÍ entró: "${
        (luego.cuerpo.match(/[^.]*(?:te la devolvimos|no se pudo)[^.]*/i) || [''])[0].trim().slice(0, 90)}"`);
    else bien('no le avisa ningún error: la foto entró');

    /* 3 · no hay que pedir que la devuelvan: el archivo está arriba. */
    if (cfg.devueltas)
      mal(`pidió devolver una foto que está subida (${cfg.devueltas} vez/veces)`);
    else bien('no pide devolver una foto que está subida');

    /* 4 · y no se gasta otra del cupo. */
    if (cfg.tomar !== 1) mal(`gastó ${cfg.tomar} fotos del cupo en un solo disparo`);
    else bien('gastó una sola foto del cupo');

    if (antes.contador !== CUPO)
      mal(`la medición arranca mal: el contador decía ${antes.contador}, no ${CUPO}`);
  }
  if (errs.length) mal('errores JS: ' + errs[0]);
  await ctx.close();

  await browser.close();
  console.log(fallas.length ? `\n${fallas.length} FALLAS` : '\n✓ Sin fallas');
  process.exit(fallas.length ? 1 : 0);
})().catch((e) => { console.log('SE CORTÓ: ' + e.message); process.exit(1); });
