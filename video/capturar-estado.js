/* Graba las dos invitaciones de muestra andando de verdad, para el
   video del estado de WhatsApp.

   No se graba con recordVideo de Playwright: sale a un bitrate bajo y
   en movimiento se borronea. Se usa el screencast de Chrome (CDP), que
   entrega cada cuadro pintado como JPEG con su hora; después se
   arma una secuencia pareja de 30 cuadros por segundo tomando, para
   cada instante, el último cuadro pintado. Así lo que se ve en el
   video es la invitación de verdad, con sus animaciones reales.

   También anota DÓNDE y CUÁNDO se tocó (toques.json): la grabación no
   tiene dedo, y la escena dibuja uno ahí, para que se entienda qué
   hizo la persona.

       BASE=http://127.0.0.1:8099 node video/capturar-estado.js */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.env.BASE || 'http://127.0.0.1:8099';
const OUT = path.join(__dirname, 'img-estado');
const FPS = 30, DPR = 2, VW = 390, VH = 693;   // 9:16 → 780x1386

async function grabar(nombre, url, guion){
  const b = await chromium.launch();
  const c = await b.newContext({viewport:{width:VW,height:VH}, deviceScaleFactor:DPR, hasTouch:true, isMobile:true});
  const p = await c.newPage();
  const errores = []; p.on('pageerror', e => errores.push(e.message));
  await p.goto(BASE + url, {waitUntil:'networkidle'});
  await p.waitForTimeout(900);
  const cdp = await c.newCDPSession(p);
  const cuadros = [];
  cdp.on('Page.screencastFrame', f => {
    cuadros.push({t: f.metadata.timestamp, data: f.data});
    cdp.send('Page.screencastFrameAck', {sessionId: f.sessionId}).catch(()=>{});
  });
  const toques = [];
  const t0 = Date.now() / 1000;
  const ahora = () => Date.now() / 1000 - t0;
  await cdp.send('Page.startScreencast', {format:'jpeg', quality:92, maxWidth:VW*DPR, maxHeight:VH*DPR, everyNthFrame:1});
  /* la página puede quedarse quieta y entonces no manda cuadros: un
     cambio invisible cada tanto asegura que el primero llegue */
  await p.evaluate(()=>{ document.body.style.outline = '0 solid transparent'; });
  const h = {
    p, espera: ms => p.waitForTimeout(ms),
    async tocar(sel){ const r = await p.locator(sel).first().boundingBox();
      const x = r.x + r.width/2, y = r.y + r.height/2;
      toques.push({ini: ahora(), fin: ahora() + .25, x: x/VW, y: y/VH});
      await p.touchscreen.tap(x, y); },
    async mantener(sel, ms){ const r = await p.locator(sel).first().boundingBox();
      const x = r.x + r.width/2, y = r.y + r.height/2;
      const t = {ini: ahora(), x: x/VW, y: y/VH}; toques.push(t);
      await p.mouse.move(x, y); await p.mouse.down(); await p.waitForTimeout(ms); await p.mouse.up();
      t.fin = ahora(); },
    /* scroll suave, como un dedo: arranca y frena */
    async ir(sel, ms, bloque='start', extra=0){
      await p.evaluate(async ([sel,ms,bloque,extra])=>{
        const el = document.querySelector(sel), r = el.getBoundingClientRect();
        const destino = scrollY + r.top + extra - (bloque==='center' ? (innerHeight - r.height)/2 : 0);
        const y0 = scrollY, t0 = performance.now();
        await new Promise(ok=>{ (function f(t){ const k = Math.min(1,(t-t0)/ms), e = k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;
          scrollTo(0, y0 + (destino-y0)*e); k<1 ? requestAnimationFrame(f) : ok(); })(t0); });
      }, [sel,ms,bloque,extra]);
    }
  };
  await guion(h);
  const dur = ahora();
  await cdp.send('Page.stopScreencast');
  await b.close();
  if (!cuadros.length) throw new Error(nombre + ': no llegó ningún cuadro');
  /* de cuadros sueltos a 30 por segundo: en cada instante, el último pintado */
  const dir = path.join(OUT, nombre);
  fs.rmSync(dir, {recursive:true, force:true}); fs.mkdirSync(dir, {recursive:true});
  const base = cuadros[0].t;
  const total = Math.floor(dur * FPS);
  let j = 0;
  for (let i = 0; i < total; i++){
    const t = base + i / FPS;
    while (j + 1 < cuadros.length && cuadros[j+1].t <= t) j++;
    fs.writeFileSync(path.join(dir, String(i).padStart(4,'0') + '.jpg'), Buffer.from(cuadros[j].data, 'base64'));
  }
  const corrimiento = base - t0;   // los toques se midieron desde t0, los cuadros desde base
  const tq = toques.map(x => ({...x, ini: x.ini - corrimiento, fin: x.fin - corrimiento}));
  console.log(`  ${nombre}: ${cuadros.length} cuadros pintados → ${total} a ${FPS} fps (${dur.toFixed(1)} s)` +
              (errores.length ? ' · ERRORES JS: ' + errores.join(' | ') : ''));
  return {cuadros: total, dur: total / FPS, toques: tq};
}

(async () => {
  fs.mkdirSync(OUT, {recursive:true});
  const info = {};
  /* A · Clara y Bruno: el lacre, los nombres en oro, y la página */
  info.a = await grabar('a', '/claraybruno', async h => {
    await h.espera(900);
    await h.mantener('#lacre', 1050);
    await h.espera(4600);
    await h.ir('#cuenta', 1300); await h.espera(1500);
    await h.ir('#mazo', 1100, 'center'); await h.espera(500);
    await h.tocar('#mazo-sig'); await h.espera(1100);
    await h.tocar('#mazo-sig'); await h.espera(1000);
    const alto = await h.p.evaluate(()=>document.querySelector('#cielo').offsetHeight - innerHeight);
    await h.ir('#cielo', 900);
    await h.ir('#cielo', 3200, 'start', alto);
    await h.ir('#mapa', 1300, 'center'); await h.espera(3000);
    await h.ir('#noche', 1300); await h.espera(2600);
  });
  /* B · Julia y Franco: el telón, la portada, el calendario y el sí */
  info.b = await grabar('b', '/juliayfranco', async h => {
    await h.espera(900);
    await h.tocar('#telon'); await h.espera(4300);
    await h.ir('#calendario', 1400, 'center'); await h.espera(3600);
    await h.ir('#rsvp', 1600); await h.espera(700);
    await h.tocar('[data-va="si"]'); await h.espera(1300);
    await h.p.fill('#p1n', 'Sofía Ramos'); await h.espera(600);
    await h.tocar('#enviar'); await h.espera(2600);
  });
  fs.writeFileSync(path.join(OUT, 'toques.json'), JSON.stringify(info, null, 1));
  /* la escena se abre con file:// y ahí fetch() no lee un .json; un <script src> sí */
  fs.writeFileSync(path.join(OUT, 'toques.js'), 'window.__TOQUES=' + JSON.stringify(info) + ';');
})().catch(e => { console.log('SE CORTÓ: ' + e.message); process.exit(1); });
