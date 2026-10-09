/* Saca las capturas de la invitación de verdad (pia/nueva) que usa el
   video de invitaciones. Se regeneran en cada armado a propósito: si
   quedaran guardadas, el día que la invitación cambie el video seguiría
   mostrando la versión vieja y nadie se enteraría.

   NUNCA se envía el formulario. Esa invitación es de una clienta y el
   envío va a su planilla de Google: un "Camila Giménez" inventado le
   aparecería en la lista de invitados. Por eso se corta la salida a
   script.google.com y el "gracias" se muestra a mano, sin enviar nada. */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://127.0.0.1:8097';
const DEST = path.join(__dirname, 'img');

/* Fracciones que usa escena-invitaciones.js para poner los anillos.
   Se miden del DOM, no a ojo: la primera versión apuntaba al
   desplegable de "cuántas personas" en vez de al botón "Sí, voy". */
const medir = async (pag, selector) => pag.evaluate((sel) => {
  let n = document.querySelector(sel);
  if (!n) n = [...document.querySelectorAll('button,label,div')]
    .find(e => /^\s*s[ií],?\s*voy\s*$/i.test(e.textContent || ''));
  if (!n) return null;
  const r = n.getBoundingClientRect();
  return { fx: +( (r.left + r.width / 2) / innerWidth ).toFixed(3),
           fy: +( (r.top + r.height / 2) / innerHeight ).toFixed(3),
           fw: +(r.width / innerWidth).toFixed(3),
           fh: +(r.height / innerHeight).toFixed(3) };
}, selector);

(async () => {
  fs.mkdirSync(DEST, { recursive: true });
  const nav = await chromium.launch();
  const ctx = await nav.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
  const pag = await ctx.newPage();
  for (const patron of ['**script.google*', '**script.googleusercontent*'])
    await pag.route(patron, r => r.abort());
  const fallos = [];
  pag.on('pageerror', e => fallos.push(e.message));

  await pag.goto(BASE + '/pia/nueva/', { waitUntil: 'load' });
  await pag.waitForTimeout(3000);

  const tirar = async (nombre) => {
    await pag.screenshot({ path: path.join(DEST, nombre + '.png') });
    const { execFileSync } = require('child_process');
    return nombre;
  };
  /* Se guardan como JPG de 660x1428, que es el tamaño al que el video
     las dibuja: más grande es memoria tirada y más chico se ve blando. */
  const guardar = async (nombre) => {
    const buf = await pag.screenshot({ type: 'jpeg', quality: 92 });
    fs.writeFileSync(path.join(DEST, nombre + '.full.jpg'), buf);
    console.log('  · ' + nombre);
  };

  await guardar('sobre');
  await pag.locator('#tapa, #sobre').first().click({ force: true }).catch(() => {});
  await pag.waitForTimeout(3000);
  await guardar('portada');

  for (const [id, nombre] of [['reloj', 'cuenta'], ['musica', 'playlist'], ['dress', 'dress']]) {
    const l = pag.locator('#' + id);
    if (!await l.count()) { console.log('  (sin #' + id + ')'); continue; }
    await l.scrollIntoViewIfNeeded().catch(() => {});
    await pag.waitForTimeout(1400);
    await guardar(nombre);
  }

  /* el formulario lleno — sin tocar "Confirmar" en ningún momento */
  await pag.locator('#rsvp').scrollIntoViewIfNeeded();
  await pag.waitForTimeout(1000);
  await pag.evaluate(() => {
    for (const i of document.querySelectorAll('input[type=text]')) {
      if (/nombre/i.test(i.placeholder || '')) i.value = 'Camila';
      if (/apellido/i.test(i.placeholder || '')) i.value = 'Giménez';
    }
    for (const t of document.querySelectorAll('textarea'))
      if (/mensaje/i.test(t.previousElementSibling?.textContent || ''))
        t.value = '¡Qué ganas! Nos vemos ahí.';
    const si = [...document.querySelectorAll('button,label,div')]
      .find(n => /^\s*s[ií],?\s*voy\s*$/i.test(n.textContent || ''));
    if (si) si.click();
  });
  await pag.waitForTimeout(800);
  await guardar('rsvp');
  const caja = { reloj: null, siVoy: null };
  caja.siVoy = await medir(pag, '#NO-EXISTE');

  /* el "gracias", mostrado a mano: NO se envía nada */
  await pag.evaluate(() => {
    const f = document.querySelector('#form'); if (f) f.style.display = 'none';
    document.querySelector('#gracias')?.classList.add('ver');
  });
  await pag.locator('#rsvp').scrollIntoViewIfNeeded();
  await pag.waitForTimeout(1200);
  await guardar('gracias');

  await pag.locator('#reloj').scrollIntoViewIfNeeded();
  await pag.waitForTimeout(1200);
  caja.reloj = await medir(pag, '#reloj');

  await nav.close();
  fs.writeFileSync(path.join(DEST, 'cajas.json'), JSON.stringify(caja, null, 1));
  console.log('  anillos:', JSON.stringify(caja));
  if (fallos.length) console.log('  (errores JS en la invitación: ' + fallos[0].slice(0, 80) + ')');
})().catch(e => { console.log('SE CORTÓ: ' + e.message); process.exit(1); });
