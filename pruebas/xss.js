const { chromium } = require('playwright');
const BASE='http://127.0.0.1:8099';

/* Cualquiera que tenga la clave pública puede escribir filas en la base.
   Simulamos exactamente eso: filas con payloads en cada campo. */
const CARGAS=[
  '"><img src=x onerror="window.__X=1">',
  "'><img src=x onerror='window.__X=1'>",
  'javascript:window.__X=1',
  '" onerror="window.__X=1" x="',
  '</script><script>window.__X=1</script>',
  'data:text/html,<script>window.__X=1</script>',
  'x" onload="window.__X=1',
];

(async()=>{
  const browser=await chromium.launch();
  const fallas=[];
  for(const carga of CARGAS){
    const ctx=await browser.newContext({viewport:{width:390,height:844}});
    const page=await ctx.newPage();
    page.on('pageerror',e=>fallas.push(`[${carga.slice(0,20)}] pageerror: ${e.message}`));
    await page.route('**/cdnjs.cloudflare.com/**',r=>r.fulfill({status:200,contentType:'application/javascript',
      body:'window.QRCode=function(n){n.innerHTML="";};window.QRCode.CorrectLevel={M:0};'}));

    const ev={codigo:'QUI-EVIL1',nombre:carga,fecha:carga,portada:carga,tono:carga,
              moderar:false,cerrado:false,consignas:[carga],creado:1};
    const items=[0,1,2].map(i=>({id:'ev'+i,codigo:'QUI-EVIL1',kind:['foto','video','mensaje'][i],
              url:carga,autor:carga,texto:carga,estado:'aprobado',ts:i}));

    await page.route('**/rest/v1/**',route=>{
      const u=route.request().url();
      const cuerpo=u.includes('ce_items')?items:[ev];
      route.fulfill({status:200,contentType:'application/json',
        body:route.request().method()==='GET'?JSON.stringify(cuerpo):''});
    });
    await page.route('**/storage/v1/**',r=>r.fulfill({status:200,body:'{}'}));

    for(const ruta of ['panel','evento/QUI-EVIL1','album/QUI-EVIL1','pantalla/QUI-EVIL1','subir/QUI-EVIL1','cartel/QUI-EVIL1']){
      await page.goto('about:blank');
      await page.goto(`${BASE}/muro.html#${ruta}`,{waitUntil:'domcontentloaded'});
      await page.waitForTimeout(700);
      const r=await page.evaluate(()=>({
        ejecutado: !!window.__X,
        vacio: !(document.getElementById('app').innerText||'').trim(),
        // ¿quedó algún atributo peligroso dentro del contenido pintado?
        // (se mira solo #app: el <link> de las fuentes usa onload a propósito)
        sucios: [...document.querySelectorAll('#app *, .recado *')].filter(e=>
          e.hasAttribute('onerror')||e.hasAttribute('onload')||
          /^(javascript|data:text\/html)/i.test(e.getAttribute('src')||'')||
          /^(javascript|data:text\/html)/i.test(e.getAttribute('href')||'')).length,
      }));
      if(r.ejecutado) fallas.push(`XSS EJECUTADO en ${ruta} con: ${carga}`);
      if(r.sucios)    fallas.push(`atributo peligroso en el DOM en ${ruta} con: ${carga}`);
      if(r.vacio)     fallas.push(`pantalla en blanco en ${ruta} con: ${carga}`);
    }
    await ctx.close();
  }
  await browser.close();
  console.log(fallas.length?'FALLAS:\n'+fallas.join('\n'):`Sin fallas · ${CARGAS.length} payloads × 6 vistas = ${CARGAS.length*6} combinaciones`);
})();
