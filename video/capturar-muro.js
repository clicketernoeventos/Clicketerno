/* Saca las capturas del muro de verdad: la pantalla del salón en sus
   tres modos, lo que ve el invitado, el panel del organizador moderando
   y el álbum del día después.

   NO USA LA DEMOSTRACIÓN. En modo demostración todo lo del organizador
   —panel, evento, invitado, cartel— cae en la pantalla del salón a
   propósito, así que de ahí no salen esas pantallas; y además arrastra
   la cinta de "la fiesta y las fotos son inventadas", que en una pieza
   de venta no puede aparecer. Se monta una fiesta en el Supabase falso
   de las pruebas, igual que hace pruebas/tablero.js, y se recorre la app
   de verdad.

   LAS FOTOS. Si en video/fotos/ hay JPG o PNG, usa ESOS: es la forma de
   poner las fotos de una fiesta real. Si no hay ninguna, dibuja manchas
   de luz para que la pieza se pueda armar igual.

   Desde esta máquina NO se llega a Supabase (el proxy contesta 403 al
   CONNECT, es política de la organización), así que las fotos del evento
   de prueba hay que dejarlas en video/fotos/ a mano. */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { crearFake } = require('../pruebas/fakesb');

const BASE = process.env.BASE || 'http://127.0.0.1:8097';
const DEST = path.join(__dirname, 'img-muro');
const FOTOS = path.join(__dirname, 'fotos');
const COD = 'QUI-MUESTRA', CLAVE = 'ABC234';

const NOMBRES = ['Sofía', 'Nacho', 'Lucía', 'Tomás', 'Martina', 'Joaquín',
                 'Delfina', 'Bauti', 'Cata', 'Feli', 'Pilar', 'Santi'];
const SALUDOS = [
  ['Que no se termine más.', 'Las primas'],
  ['Gracias por dejarnos ser parte de esto.', 'Nacho'],
  ['La mejor noche del año, sin discusión.', 'Lucía'],
  ['Quince años y ya nos hacés llorar a todos.', 'Francisca'],
];

const aDataURL = (f) => 'data:' +
  (path.extname(f).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg') +
  ';base64,' + fs.readFileSync(f).toString('base64');

/* Manchas de luz de fiesta, para cuando no hay fotos de verdad puestas.
   Se dibujan en el navegador porque acá no hay con qué generar un JPEG. */
const inventarFotos = (pag, cuantas) => pag.evaluate((n) => {
  const salida = [];
  for (let s = 0; s < n; s++) {
    let x = s * 9301 + 49297;
    const r = () => ((x = (x * 9301 + 49297) % 233280) / 233280);
    const vert = r() > .45;
    const c = document.createElement('canvas');
    c.width = vert ? 760 : 1000; c.height = vert ? 1000 : 760;
    const g = c.getContext('2d');
    const pares = [['#140E0A', '#53381C'], ['#0C0D14', '#2C3A4B'], ['#160D10', '#52252E'],
                   ['#0E1210', '#273B31'], ['#141014', '#432A40']];
    const p = pares[s % pares.length];
    const d = g.createLinearGradient(0, 0, c.width, c.height);
    d.addColorStop(0, p[0]); d.addColorStop(1, p[1]);
    g.fillStyle = d; g.fillRect(0, 0, c.width, c.height);
    const luces = ['#F3D9A6', '#FFE9C4', '#E8C79A', '#FFF4DF', '#D9AE72'];
    for (let i = 0; i < 26; i++) {
      g.globalAlpha = .08 + r() * .40;
      g.fillStyle = luces[Math.floor(r() * luces.length)];
      g.beginPath(); g.arc(r() * c.width, r() * c.height, 8 + r() * 70, 0, 7); g.fill();
    }
    g.globalAlpha = 1;
    const v = g.createRadialGradient(c.width / 2, c.height / 2, c.height * .2,
                                     c.width / 2, c.height / 2, c.height * .8);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.7)');
    g.fillStyle = v; g.fillRect(0, 0, c.width, c.height);
    salida.push(c.toDataURL('image/jpeg', .72));
  }
  return salida;
}, cuantas);

async function montarFiesta(ctx, fotos) {
  const pag = await ctx.newPage();
  const fake = crearFake('ok');
  await fake.instalar(pag);
  fake.claves[COD] = CLAVE;
  fake.db.ce_eventos.push({
    codigo: COD, nombre: 'Los 15 de Delfina', tipo: 'XV', fecha: '2026-11-21',
    lugar: 'Salón Las Acacias · Rosario', hashtag: '#Delfina15',
    tono: '#D9AE72', moderar: true, cerrado: false, portada: fotos[0] || '',
    creado: Date.now(),
  });
  /* Nueve aprobadas y dos esperando: el panel tiene que mostrar algo
     para moderar, que es media pieza. */
  let n = 0;
  for (let i = 0; i < fotos.length && i < 11; i++) {
    const esperando = i >= 9;
    fake.db.ce_items.push({
      id: 'f' + i, codigo: COD, kind: 'foto', url: fotos[i],
      autor: NOMBRES[i % NOMBRES.length], texto: '',
      estado: esperando ? 'pendiente' : 'aprobado', ts: 1000 + (n++),
    });
  }
  SALUDOS.forEach(([texto, autor], i) => fake.db.ce_items.push({
    id: 'm' + i, codigo: COD, kind: 'mensaje', url: '',
    autor, texto, estado: 'aprobado', ts: 1000 + (n++),
  }));
  /* La clave guardada en el aparato es lo que hace que la app lo trate
     como el organizador y no como un invitado. */
  await pag.addInitScript(([c, k]) => {
    try { localStorage.setItem('ce:claves', JSON.stringify({ [c]: k })); } catch (e) {}
  }, [COD, CLAVE]);
  return pag;
}

(async () => {
  fs.mkdirSync(DEST, { recursive: true });
  const propias = fs.existsSync(FOTOS)
    ? fs.readdirSync(FOTOS).filter(f => /\.(jpe?g|png)$/i.test(f)).sort()
        .map(f => path.join(FOTOS, f))
    : [];
  console.log(propias.length
    ? `  ${propias.length} fotos de video/fotos/`
    : '  sin video/fotos/: se dibujan manchas de luz');

  const nav = await chromium.launch();
  const fallos = [];

  /* ── el teléfono: el invitado y el álbum ── */
  const ctxTel = await nav.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
  const tel = await montarFiesta(ctxTel, []);
  tel.on('pageerror', e => fallos.push('tel: ' + e.message));
  await tel.goto(BASE + '/muro.html', { waitUntil: 'load' });
  const fotos = propias.length ? propias.map(aDataURL) : await inventarFotos(tel, 11);
  await ctxTel.close();

  const ctx2 = await nav.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
  const pag = await montarFiesta(ctx2, fotos);
  pag.on('pageerror', e => fallos.push('tel: ' + e.message));
  const guardar = async (p, nombre, sufijo = '') => {
    fs.writeFileSync(path.join(DEST, nombre + sufijo + '.full.jpg'),
      await p.screenshot({ type: 'jpeg', quality: 92 }));
    console.log('  · ' + nombre);
  };
  const ir = async (hash, espera = 3200) => {
    await pag.goto(BASE + '/muro.html#' + hash, { waitUntil: 'load' });
    await pag.waitForTimeout(espera);
  };
  /* Las posiciones de los anillos salen del DOM, no de mirar la imagen:
     puestas a ojo señalan cualquier cosa (ya pasó en el video de
     invitaciones, donde el anillo apuntaba al desplegable equivocado). */
  const cajas = {};
  const medir = async (nombre, sel) => {
    cajas[nombre] = await pag.evaluate((s) => {
      const n = document.querySelector(s);
      if (!n) return null;
      const r = n.getBoundingClientRect();
      return { fx: +((r.left + r.width / 2) / innerWidth).toFixed(3),
               fy: +((r.top + r.height / 2) / innerHeight).toFixed(3),
               fw: +(r.width / innerWidth).toFixed(3),
               fh: +(r.height / innerHeight).toFixed(3) };
    }, sel);
  };

  await ir('invitado/' + COD); await guardar(pag, 'invitado');
  await medir('entrar', '#entrar, button[type=submit], .btn-oro');
  await ir('evento/' + COD, 3600);
  /* el panel abre en Compartir; Moderar es lo que hay que mostrar */
  await pag.locator('[data-sol="pModerar"]').click({ timeout: 4000 }).catch(() => {});
  await pag.waitForTimeout(1800);
  await guardar(pag, 'panel');
  await medir('aprobar', '.pendiente button, [data-ok], button');
  await ir('album/' + COD, 4200); await guardar(pag, 'album');
  fs.writeFileSync(path.join(DEST, 'cajas.json'), JSON.stringify(cajas, null, 1));
  console.log('  anillos:', JSON.stringify(cajas));
  await ctx2.close();

  /* ── el proyector: las tres pantallas del salón ──
     1920x1080 porque la sala está hecha para eso; capturada en 390 se
     ve como no se ve nunca en una fiesta. */
  const ctxSala = await nav.newContext({ viewport: { width: 1920, height: 1080 } });
  const sala = await montarFiesta(ctxSala, fotos);
  sala.on('pageerror', e => fallos.push('sala: ' + e.message));
  await sala.goto(BASE + '/muro.html?marco=1#pantalla/' + COD, { waitUntil: 'load' });
  await sala.waitForTimeout(4000);
  const modo = async (cual, nombre, conFoto = false) => {
    await sala.evaluate((c) => document.querySelector(`[data-modo="${c}"]`)?.click(), cual);
    await sala.waitForTimeout(3000);
    /* La proyección rota entre fotos y saludos escritos. Para la pieza
       tiene que estar mostrando una FOTO: capturar lo que justo había
       deja, la mitad de las veces, una frase sobre negro. */
    if (conFoto) {
      for (let i = 0; i < 12; i++) {
        if (await sala.evaluate(() => !!document.querySelector('.toma img, .tab-foto img'))) break;
        await sala.keyboard.press('ArrowRight');
        await sala.waitForTimeout(850);
      }
      await sala.waitForTimeout(1100);
    }
    await guardar(sala, nombre, '.ancha');
  };
  /* Con ?marco=1 la sala arranca en el tablero, así que los botones de
     modo están ocultos: se los muestra para poder recorrer los tres. */
  await sala.evaluate(() => document.querySelector('.modos-sala')?.removeAttribute('hidden'));
  await modo('cartel', 'cartel');
  await modo('muro', 'sala', true);
  await modo('tablero', 'tablero', true);
  await sala.evaluate(() => document.querySelector('.modos-sala')?.setAttribute('hidden', ''));
  await sala.waitForTimeout(400);
  await guardar(sala, 'tablero-limpio', '.ancha');

  await nav.close();
  if (fallos.length) console.log('  (errores JS: ' + fallos[0].slice(0, 100) + ')');
})().catch(e => { console.log('SE CORTÓ: ' + e.message); process.exit(1); });
