/* ══════════════════════════════════════════════════════════════════
   Las tarjetas para cortar y repartir.

   Era lo único del producto que el cliente necesita EN LA MANO y no se
   podía entregar: el cartel de mesa es una tarjeta por hoja —para diez
   mesas, diez impresiones— y el rollo no tenía nada, así que el
   organizador le sacaba una captura al QR de la pantalla.

   Lo que se mide acá no es cómo se ve en el monitor: es cómo sale
   IMPRESO. La hoja tiene que ser una A4 exacta, las tarjetas tienen que
   repartirse en partes iguales, y todo lo que no va al papel —botones,
   cabeceras, la cinta de la demostración— tiene que desaparecer. Un
   milímetro de más y la cuarta tarjeta se va sola a la segunda hoja.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const { crearFake } = require('./fakesb');
const BASE='http://127.0.0.1:8099';
const COD='QUI-7FCE64', CLAVE='ABC123';
const fallas=[]; const mal=m=>{fallas.push(m);console.log('  ✗ '+m);};
const bien=m=>console.log('  ✓ '+m);

/* A4 a 96 dpi. Es la medida contra la que se compara todo. */
const A4={ancho:794, alto:1123};

async function abrir(browser){
  const ctx=await browser.newContext({viewport:{width:A4.ancho,height:A4.alto}});
  const p=await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  /* Un QR de mentira, pero con el tamaño que le piden: lo que se mide es
     que entre en la tarjeta, no que el código sea legible. */
  await p.route('**/cdnjs.cloudflare.com/**',r=>r.fulfill({status:200,
    contentType:'application/javascript',
    body:'window.QRCode=function(n,o){var c=document.createElement("canvas");'
        +'c.width=o.width;c.height=o.height;n.appendChild(c);};'
        +'window.QRCode.CorrectLevel={M:0};'}));
  const fake=crearFake('ok'); await fake.instalar(p);
  fake.claves[COD]=CLAVE;
  fake.db.ce_eventos.push({codigo:COD,nombre:'Los 15 de Delfina',fecha:'2026-10-18',
    tipo:'XV',tono:'#D9AE72',moderar:false,cerrado:false,creado:1});
  await ctx.addInitScript(c=>{ try{ localStorage.setItem('ce:claves',JSON.stringify(c)); }catch(e){} },{[COD]:CLAVE});
  return {ctx,p,errs};
}
const medir=p=>p.evaluate(()=>{
  const h=document.querySelector('.hoja-tarjetas');
  if(!h) return null;
  const r=h.getBoundingClientRect();
  const t=[...document.querySelectorAll('.tarjeta-qr')].map(n=>{
    const c=n.getBoundingClientRect();
    return {x:Math.round(c.left),y:Math.round(c.top),
            an:Math.round(c.width),al:Math.round(c.height)};
  });
  return {hoja:{x:Math.round(r.left),y:Math.round(r.top),
                an:Math.round(r.width),al:Math.round(r.height)}, tarjetas:t};
});

(async()=>{
  const browser=await chromium.launch();
  const {ctx,p,errs}=await abrir(browser);

  console.log('\n─── en la pantalla ───');
  await p.goto(BASE+'/muro.html#tarjetas/'+COD,{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(2200);
  const n0=await p.locator('.tarjeta-qr').count();
  if(n0!==4) mal(`arranca con ${n0} tarjetas, esperaba 4`);
  else bien('arranca con cuatro tarjetas');
  const qrs=await p.locator('.tarjeta-qr .qr-t canvas').count();
  if(qrs!==4) mal(`${qrs} QR para ${n0} tarjetas: alguna sale sin código`);
  else bien('cada tarjeta tiene su QR');
  const dice=(await p.locator('.hoja-tarjetas').innerText()).toLowerCase();
  for(const q of ['los 15 de delfina', COD.toLowerCase(), 'escaneá con la cámara']){
    if(!dice.includes(q)) mal(`la tarjeta no dice "${q}"`);
    else bien(`dice "${q}"`);
  }

  console.log('\n─── cómo sale impreso ───');
  await p.emulateMedia({media:'print'});
  await p.waitForTimeout(500);
  for(const cuantas of [2,4,8]){
    await p.emulateMedia({media:'screen'});
    await p.click(`.cuantas button[data-n="${cuantas}"]`);
    await p.waitForTimeout(700);
    await p.emulateMedia({media:'print'});
    await p.waitForTimeout(400);
    const m=await medir(p);
    if(!m){ mal(`con ${cuantas} por hoja no se dibujó la hoja`); continue; }
    /* La hoja, una A4 exacta y pegada al borde. Con el padding del body
       se corría más de un centímetro y la última tarjeta se salía del
       papel: eso no se ve en la pantalla, solo al imprimir. */
    const bordes = m.hoja.x===0 && m.hoja.y===0;
    const tamano = Math.abs(m.hoja.an-A4.ancho)<=2 && Math.abs(m.hoja.al-A4.alto)<=2;
    if(!bordes) mal(`con ${cuantas} por hoja la hoja no arranca en el borde: ${m.hoja.x},${m.hoja.y}`);
    else if(!tamano) mal(`con ${cuantas} por hoja la hoja mide ${m.hoja.an}x${m.hoja.al}, esperaba ${A4.ancho}x${A4.alto}`);
    else bien(`con ${cuantas} por hoja: una A4 exacta, pegada al borde`);
    if(m.tarjetas.length!==cuantas)
      mal(`pidió ${cuantas} y hay ${m.tarjetas.length}`);
    /* Y que entren TODAS en la hoja: una que empiece más abajo de 1123px
       se imprime en la segunda página. */
    const afuera=m.tarjetas.filter(t=>t.y+t.al>A4.alto+2 || t.x+t.an>A4.ancho+2);
    if(afuera.length) mal(`con ${cuantas} por hoja se salen ${afuera.length} del papel`);
    else bien(`con ${cuantas} por hoja entran todas en una sola hoja`);
    /* Todas iguales: si una mide distinto, al cortar no coinciden. */
    const distintas=m.tarjetas.filter(t=>t.an!==m.tarjetas[0].an||t.al!==m.tarjetas[0].al);
    if(distintas.length) mal(`con ${cuantas} por hoja no son todas del mismo tamaño`);
    else bien(`con ${cuantas} por hoja son todas iguales (${m.tarjetas[0].an}x${m.tarjetas[0].al})`);
  }
  /* Lo que no va al papel. */
  const sobra=await p.evaluate(()=>[...document.querySelectorAll('.no-imprime,.top')]
    .filter(n=>getComputedStyle(n).display!=='none').length);
  if(sobra) mal(`se imprimen ${sobra} cosas que no van al papel (botones, cabecera)`);
  else bien('no se imprimen los botones ni la cabecera');
  await p.emulateMedia({media:'screen'});

  console.log('\n─── la regla de la hoja no queda pegada ───');
  /* @page{size:A4} puesta a mano: si queda después de salir, el "Guardar
     en PDF" del álbum sale en tamaño A4 forzado. Ya pasó con la postal. */
  if(!(await p.evaluate(()=>!!document.getElementById('hojaA4'))))
    mal('no se puso la regla de página A4');
  else bien('mientras se ven las tarjetas, la hoja es A4');
  await p.goto(BASE+'/muro.html#evento/'+COD,{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(1600);
  if(await p.evaluate(()=>!!document.getElementById('hojaA4')))
    mal('la regla A4 queda puesta al salir: le cambia el tamaño a todo lo demás');
  else bien('y al salir se saca');
  if(!(await p.locator('[data-ir^="tarjetas/"]').count()))
    mal('no se llega a las tarjetas desde el panel del evento');
  else bien('se llega desde el panel del evento');

  if(errs.length) mal('errores JS: '+errs.join(' | '));
  await ctx.close();
  await browser.close();
  console.log(fallas.length?`\n${fallas.length} FALLAS`:'\n✓ Sin fallas');
  process.exit(fallas.length?1:0);
})();
