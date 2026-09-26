/* ═══════════════════════════════════════════════════════════════
   LA CÁMARA DEL INVITADO

   Es la pantalla donde el invitado pasa la noche, y lo que se pidió
   de ella son tres cosas:

     · que se note que es un ROLLO —que las fotos se acaban—,
     · que haya UNA cosa para tocar,
     · y que la app guíe sola, sin que haya que preguntarle.

   Las tres se miden acá, y las tres fallan contra el código
   anterior: antes el contador era un número chico en un rincón de
   abajo, los cinco filtros estaban siempre abiertos —seis cosas
   tocables del mismo tamaño que el disparador— y el pie era un
   párrafo fijo que decía lo mismo toda la noche.

   Corre contra la demostración, que no toca Supabase ni el
   almacenamiento: la cámara de ahí es la misma del invitado.
   ═══════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:8890';
const TELEFONO = { width: 390, height: 844 };

const fallas = [];
const mal = (m) => { fallas.push(m); console.log('  ✗ ' + m); };
const bien = (m) => console.log('  ✓ ' + m);
const titulo = (t) => console.log('\n─── ' + t + ' ───');

/* Todo lo que la cámara está diciendo en este momento, de una. */
const mirar = (p) => p.evaluate(() => {
  const q = (s) => document.querySelector(s);
  const visible = (n) => !!n && !n.hidden && n.getClientRects().length > 0;
  return {
    hayCamara: !!q('#disparo'),
    quedan: Number((q('#cRestan') || {}).textContent),
    cuadros: document.querySelectorAll('#cuadros i').length,
    gastados: document.querySelectorAll('#cuadros i.gastado').length,
    clases: ((q('#rolloTira') || {}).className || ''),
    pie: ((q('#pieCamara') || {}).innerText || '').split('\n')[0],
    tira: visible(q('#filtros')),
    ficha: visible(q('#filtroChip')),
    fichaDice: ((q('#filtroNombre') || {}).textContent || ''),
    /* Lo que de verdad importa de "una cosa para tocar": cuántos
       controles VISIBLES hay en la mitad de abajo de la pantalla. */
    tocablesAbajo: [...document.querySelectorAll('button,[role=button],label.native-alt')]
      .filter((n) => {
        if (n.hidden || !n.getClientRects().length) return false;
        if (n.closest('#cinta-demo')) return false;      // el andamio no cuenta
        const c = n.getBoundingClientRect();
        return c.top > innerHeight / 2 && c.width > 0;
      }).length,
  };
});

async function abrir(browser, args = '?demo=1&camara=1') {
  const ctx = await browser.newContext({ viewport: TELEFONO, permissions: ['camera'] });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(BASE + '/rollo.html' + args, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(4000);
  return { ctx, p, errs };
}

const disparar = async (p) => { await p.click('#disparo').catch(() => {}); await p.waitForTimeout(1200); };

(async () => {
  const browser = await chromium.launch({
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });

  /* ══ 1 · SE VE QUE ES UN ROLLO ══ */
  titulo('se ve que las fotos se acaban');
  const { ctx, p, errs } = await abrir(browser);
  let e = await mirar(p);
  if (!e.hayCamara) { mal('no abrió la cámara: no se puede medir nada'); }
  else {
    if (!e.cuadros) mal('no hay cuadraditos: el rollo no se ve, solo se lee un número');
    else bien(`el rollo se dibuja: ${e.cuadros} cuadraditos`);
    if (e.gastados !== e.cuadros - e.quedan)
      mal(`los apagados no coinciden: ${e.gastados} apagados, ${e.quedan} de ${e.cuadros} quedan`);
    else bien(`y los ${e.gastados} ya gastados están apagados`);
    /* "21 de 24" se lee de las dos maneras. La palabra no se presta. */
    const cuenta = (await p.locator('.rollo-cuenta').innerText().catch(() => '')).toLowerCase();
    if (!/quedan/.test(cuenta)) mal(`el contador no dice "quedan", se puede leer al revés: "${cuenta}"`);
    else bien('y dice "quedan", que no se presta a leerlo al revés');
  }

  /* ══ 2 · UNA COSA PARA TOCAR ══ */
  titulo('abajo hay una sola cosa para tocar');
  if (e.hayCamara) {
    if (!e.tira) mal('la tira de filtros no se muestra al entrar: es lo mejor que tiene la pantalla');
    else bien('al entrar, los cinco filtros en vivo están a la vista');
    await disparar(p);
    e = await mirar(p);
    if (e.tira) mal('después de la primera foto la tira sigue abierta: cinco cosas más para tocar');
    else bien('sacada la primera, la tira se pliega sola');
    if (!e.ficha) mal('se plegó pero no dejó cómo volver a abrirla');
    else bien(`y deja la ficha para cambiarlo: "${e.fichaDice}"`);
    /* La medida, no la opinión: el disparador y la ficha. Antes eran seis. */
    if (e.tocablesAbajo > 2)
      mal(`abajo quedan ${e.tocablesAbajo} cosas para tocar, se esperaban 2 (el disparador y la ficha)`);
    else bien(`abajo quedan ${e.tocablesAbajo} controles: el disparador y la ficha`);
  }

  /* ══ 3 · LA APP GUÍA SOLA ══ */
  titulo('la pantalla dice qué está pasando');
  if (e.hayCamara) {
    if (!/sali[óo]/i.test(e.pie)) mal(`después de la foto no acusa recibo: "${e.pie}"`);
    else bien(`acusa la foto: "${e.pie}"`);
    if (!new RegExp('\\b' + e.quedan + '\\b').test(e.pie))
      mal(`el acuse no dice cuántas quedan: "${e.pie}"`);
    else bien('y dice cuántas quedan');
    /* Un acuse que se queda puesto toda la noche deja de ser un acuse. */
    await p.waitForTimeout(3800);
    const luego = (await mirar(p)).pie;
    if (/sali[óo]/i.test(luego)) mal(`el acuse se quedó pegado: "${luego}"`);
    else bien(`y vuelve solo a la línea de siempre: "${luego}"`);
  }

  /* ══ 4 · EL FILTRO SE ELIGE UNA VEZ ══ */
  titulo('el filtro se elige una vez');
  if (e.hayCamara) {
    await p.click('#filtroChip'); await p.waitForTimeout(500);
    if (!(await mirar(p)).tira) mal('la ficha no vuelve a abrir la tira');
    else bien('la ficha vuelve a abrir la tira');
    await p.click('.filtro-op[data-f=bn]'); await p.waitForTimeout(500);
    const t = await mirar(p);
    if (t.tira) mal('eligiendo un filtro la tira no se pliega');
    else bien('eligiendo uno se vuelve a plegar');
    if (!/blanco y negro/i.test(t.fichaDice))
      mal(`la ficha no dice el nombre entero: "${t.fichaDice}"`);
    else bien(`y la ficha dice el nombre entero: "${t.fichaDice}"`);
    /* Que se recuerde es lo que evita elegir de nuevo en cada vuelta. */
    await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(4000);
    const v = await p.evaluate(() => {
      const s = document.querySelector('.filtro-op[aria-pressed=true] span');
      return s ? s.textContent : null;
    });
    if (!/b y n|blanco/i.test(v || '')) mal(`al volver no recordó el filtro: quedó "${v}"`);
    else bien('y al volver a entrar lo recuerda');
  }
  if (errs.length) mal('errores JS: ' + errs[0]);
  await ctx.close();

  /* ══ 5 · EL FINAL DEL ROLLO ══ */
  titulo('el final del rollo se siente');
  {
    const { ctx: c2, p: p2, errs: e2 } = await abrir(browser);
    let s = await mirar(p2);
    if (!s.hayCamara) mal('no abrió la cámara para medir el final');
    else {
      let pocas = null, ultima = null;
      /* De a una hasta vaciarlo. La demostración repone a los dos
         minutos, así que esto tiene que tardar menos que eso. */
      for (let i = 0; i < 40 && s.hayCamara && s.quedan > 0; i++) {
        await disparar(p2);
        s = await mirar(p2);
        if (!s.hayCamara) break;
        if (s.quedan === 3) pocas = s.clases;
        if (s.quedan === 1) ultima = s;
      }
      if (!pocas || !/poquitas/.test(pocas))
        mal('con tres fotas restantes no avisa nada');
      else bien('con tres restantes el contador cambia de tono');
      if (!ultima || !/ultima/.test(ultima.clases))
        mal('en la última foto no avisa nada');
      else bien('y en la última lo marca aparte');
      if (ultima && !/[úu]ltima/i.test(ultima.pie))
        mal(`en la última el pie no lo dice: "${ultima.pie}"`);
      else if (ultima) bien(`y se lo dice: "${ultima.pie}"`);
      if (s.hayCamara && s.quedan > 0)
        mal(`no llegué al final del rollo: quedaron ${s.quedan}`);
      else bien('vaciado el rollo, la cámara se cierra sola');
    }
    if (e2.length) mal('errores JS al vaciar el rollo: ' + e2[0]);
    await c2.close();
  }

  /* ══ 6 · SE PUEDE SALIR SIN GASTAR EL ROLLO ══
     Probado en un iPhone de verdad: entrabas a la cámara y no había forma
     de salir hasta gastar las 24. Una fiesta dura seis horas y nadie saca
     veinticuatro fotos seguidas; el invitado quiere sacar dos, guardar el
     teléfono, y volver en el brindis. Y mientras tanto la cámara quedaba
     PRENDIDA, comiéndole la batería toda la noche. */
  titulo('se puede salir de la cámara sin gastarla');
  {
    const { ctx: c3, p: p3, errs: e3 } = await abrir(browser);
    const hay = (sel) => p3.evaluate((s) => {
      const n = document.querySelector(s);
      return !!n && !n.hidden && n.getClientRects().length > 0;
    }, sel);

    if (!(await hay('#disparo'))) mal('no abrió la cámara para medir la salida');
    else {
      if (!(await hay('#salirCam')))
        mal('no hay por dónde salir de la cámara: hay que gastar las 24 fotos');
      else {
        bien('hay un botón para salir de la cámara');
        const c = await p3.evaluate(() => {
          const r = document.querySelector('#salirCam').getBoundingClientRect();
          return { w: r.width, h: r.height };
        });
        if (c.w < 44 || c.h < 44) mal(`el botón de salir mide ${Math.round(c.w)}x${Math.round(c.h)}, no llega a 44x44`);
        else bien(`y llega a 44x44 (${Math.round(c.w)}x${Math.round(c.h)})`);

        /* Se sale con fotos SIN gastar: eso es lo que no se podía. */
        await disparar(p3);
        const antes = (await mirar(p3)).quedan;
        await p3.click('#salirCam');
        await p3.waitForTimeout(1200);

        if (await hay('#disparo')) mal('tocando salir sigue en la cámara');
        else bien('sale de la cámara');
        if (!(await hay('#pausa'))) mal('salió de la cámara pero no muestra nada');
        else {
          const dice = (await p3.evaluate(() => document.body.innerText)).toLowerCase();
          if (!new RegExp('\\b' + antes + '\\b').test(dice))
            mal(`la pantalla de pausa no dice cuántas le quedan (${antes}): "${dice.slice(0, 110)}"`);
          else bien(`y le dice cuántas le quedan (${antes})`);
        }
        /* La cámara tiene que APAGARSE: si no, sigue comiendo batería. */
        const viva = await p3.evaluate(() => !!document.querySelector('#video'));
        if (viva) mal('salió pero el visor sigue en la pantalla: la cámara quedó prendida');
        else bien('y apaga la cámara');

        /* Y no puede rebotarlo solo a la cámara: el sondeo de estado llama
           a rutear() cada 15 s, que es justo lo que lo devolvía. */
        await p3.waitForTimeout(18000);
        if (await hay('#disparo')) mal('a los 18 s el sondeo lo devolvió solo a la cámara');
        else bien('y se queda en pausa aunque el sondeo siga andando');

        /* Volver tiene que ser un toque. */
        if (!(await hay('#seguir'))) mal('desde la pausa no hay cómo volver a sacar fotos');
        else {
          await p3.click('#seguir');
          await p3.waitForTimeout(2500);
          if (!(await hay('#disparo'))) mal('el botón de volver no reabre la cámara');
          else bien('y vuelve a la cámara de un toque');
          const luego = (await mirar(p3)).quedan;
          if (luego !== antes) mal(`al volver le cambió el cupo: ${antes} → ${luego}`);
          else bien(`y le conserva las ${luego} que le quedaban`);
        }
      }
    }
    if (e3.length) mal('errores JS al salir de la cámara: ' + e3[0]);
    await c3.close();
  }

  await browser.close();
  console.log(fallas.length ? `\n${fallas.length} FALLAS` : '\n✓ Sin fallas');
  process.exit(fallas.length ? 1 : 0);
})().catch((err) => { console.log('SE CORTÓ: ' + err.message); process.exit(1); });
