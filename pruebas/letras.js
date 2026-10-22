/* ══════════════════════════════════════════════════════════════════
   MOSTRAR LA TIPOGRAFÍA, NO DESCRIBIRLA
   uso:  node pruebas/letras.js <carpeta> [carpeta-de-salida]

   Ya pasó tres veces: se cambia la familia por descripción —"algo más
   redondeado", "más elegante"— y tres veces no era. A la cuarta se
   montó la MISMA portada con siete tipografías y se mandaron las siete
   capturas: eligió mirando, en un minuto.

   Esto hace eso solo. Para cada pareja de la lista de abajo:
     · se interceptan el HTML y se le cambian las dos variables de
       familia (`--titulos` y `--texto-f`), que por eso existen;
     · se saca una captura de la portada y otra de una sección clara.

   LAS FUENTES VAN INCRUSTADAS, y no es un lujo: desde acá el navegador
   RECHAZA fonts.googleapis.com —el proxy firma los certificados—, así
   que una captura hecha sin esto sale con la letra de respaldo del
   sistema y muestra justo lo que no es. Se bajan con `fetch` (que sí
   pasa por el proxy), se pegan en base64 y recién ahí se mira.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

const CARPETA = process.argv[2];
if (!CARPETA){ console.log('uso: node pruebas/letras.js <carpeta> [salida]'); process.exit(2); }
const SALIDA = process.argv[3] || path.join(require('os').tmpdir(), 'letras');
const BASE = process.env.BASE || 'http://127.0.0.1:8099';
const URL  = BASE + '/' + CARPETA + '/';

/* Las candidatas. `pedir` es lo que se le pide a Google —y tiene que
   ser EXACTAMENTE lo que usa el CSS: un peso que no esté pedido se lo
   inventa el navegador, y eso no avisa—. */
const CANDIDATAS = [
  { id:'a', nombre:'Fraunces + Hanken Grotesk',
    titulos:"'Fraunces',Georgia,serif", texto:"'Hanken Grotesk',system-ui,sans-serif",
    pedir:'family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500'
        + '&family=Hanken+Grotesk:ital,wght@0,300;0,400;0,500;0,600;1,400' },
  { id:'b', nombre:'Lora + Nunito Sans',
    titulos:"'Lora',Georgia,serif", texto:"'Nunito Sans',system-ui,sans-serif",
    pedir:'family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500'
        + '&family=Nunito+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400' },
  { id:'c', nombre:'Hanken Grotesk sola (como la página)',
    titulos:"'Hanken Grotesk',system-ui,sans-serif", texto:"'Hanken Grotesk',system-ui,sans-serif",
    pedir:'family=Hanken+Grotesk:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,500' },
  { id:'d', nombre:'Petrona + Poppins',
    titulos:"'Petrona',Georgia,serif", texto:"'Poppins',system-ui,sans-serif",
    pedir:'family=Petrona:ital,wght@0,400;0,500;0,600;1,400;1,500'
        + '&family=Poppins:ital,wght@0,300;0,400;0,500;0,600;1,400' }
];

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/* El CSS de Google viene partido por alfabeto. Nos quedamos con latin
   y latin-ext: el resto son megabytes de cirílico y vietnamita que no
   se usan, y la captura tarda el triple. */
async function incrustar(pedir){
  const css = await (await fetch('https://fonts.googleapis.com/css2?' + pedir + '&display=swap',
                                 {headers:{'User-Agent':UA}})).text();
  const bloques = css.split('@font-face').slice(1)
    .map(b => '@font-face' + b.slice(0, b.indexOf('}') + 1))
    .filter(b => /U\+0000-00FF|U\+0100-02[A-F0-9]{2}/.test(b) || !/unicode-range/.test(b));
  const salida = [];
  for (const b of bloques){
    const m = b.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/);
    if (!m){ salida.push(b); continue; }
    const buf = Buffer.from(await (await fetch(m[1], {headers:{'User-Agent':UA}})).arrayBuffer());
    salida.push(b.replace(m[1], 'data:font/woff2;base64,' + buf.toString('base64')));
  }
  return salida.join('\n');
}

(async () => {
  fs.mkdirSync(SALIDA, {recursive:true});
  const navegador = await chromium.launch();
  for (const c of CANDIDATAS){
    const fuentes = await incrustar(c.pedir);
    const ctx = await navegador.newContext({viewport:{width:390,height:844},
      deviceScaleFactor:2, hasTouch:true, isMobile:true});
    const pag = await ctx.newPage();
    await pag.route('**/*', async r => {
      const u = r.request().url();
      if (/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(u))
        return r.fulfill({status:200, contentType:'text/css', body:''});
      if (r.request().resourceType() === 'document' &&
          u.replace(/[?#].*/,'').replace(/\/$/,'') === URL.replace(/\/$/,'')){
        const res = await r.fetch();
        let html = await res.text();
        html = html.replace(/--titulos:[^;]+;/, '--titulos:' + c.titulos + ';')
                   .replace(/--texto-f:[^;]+;/, '--texto-f:' + c.texto + ';')
                   .replace('</head>', '<style>' + fuentes + '</style></head>');
        return r.fulfill({response:res, body:html});
      }
      return r.continue();
    });
    await pag.goto(URL, {waitUntil:'domcontentloaded'});
    await pag.waitForTimeout(500);
    try{ await pag.evaluate(() => document.fonts.ready); }catch(e){}
    await pag.waitForTimeout(400);
    await pag.screenshot({path: path.join(SALIDA, c.id + '-1-sobre.png')});
    if (await pag.locator('#abrir').count()){ await pag.click('#abrir'); await pag.waitForTimeout(2300); }
    await pag.screenshot({path: path.join(SALIDA, c.id + '-2-portada.png')});
    /* Una sección clara, que es donde se lee el texto largo. */
    const sec = await pag.$('#donde');
    if (sec){ await sec.scrollIntoViewIfNeeded(); await pag.waitForTimeout(900);
              await pag.screenshot({path: path.join(SALIDA, c.id + '-3-seccion.png')}); }
    const cargadas = await pag.evaluate(() => [...document.fonts].map(f => f.family + ' ' + f.weight).length);
    console.log(c.id + ' · ' + c.nombre + ' · ' + cargadas + ' fuentes cargadas');
    await ctx.close();
  }
  await navegador.close();
  console.log('capturas en ' + SALIDA);
})();
