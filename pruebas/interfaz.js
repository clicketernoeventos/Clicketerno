/* ══════════════════════════════════════════════════════════════════
   La interfaz, medida.

   Cuatro cosas que no se opinan, se miden:

     1. TODO lo que se toca llega a 44x44 en un teléfono. Es la medida de
        Apple y de Google. Antes de esta pasada, 29 de 68 controles no
        llegaban: el "Volver" medía 56x27 y el "atrás" del rollo 23x26.
        En un teléfono eso es errarle.
     2. De 320px a 1440px no se sale nada de la pantalla, y la tipografía
        escala sola.
     3. Las fotos del álbum laten mientras cargan y TERMINAN VISIBLES. La
        primera versión de eso marcaba la foto cargada desde un oyente en
        `window`, y el "load" de un <img> NO llega a window: ninguna foto
        se marcaba nunca y el álbum entero quedaba invisible. Va en
        `document`.
     4. Con "menos movimiento" puesto, nada late ni se hunde.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const { crearFake } = require('./fakesb');
const M='http://127.0.0.1:8099';
const COD='QUI-7FCE64', CLAVE='ABC123';
const TEL={width:390,height:844};
const fallas=[]; const mal=m=>{fallas.push(m);console.log('  ✗ '+m);};
const bien=m=>console.log('  ✓ '+m);

const JPEG=Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a'+
 'HBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAA'+
 'AAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==','base64');

async function pagina(browser,{viewport,motion}={}){
  const ctx=await browser.newContext({viewport:viewport||TEL,
    reducedMotion: motion==='reduce'?'reduce':'no-preference'});
  await ctx.addInitScript(c=>{ try{
    localStorage.setItem('ce:claves',JSON.stringify(c));
    localStorage.setItem('ce:pin','4321');
    sessionStorage.setItem('ce:pinOK','1');
  }catch(e){} },{[COD]:CLAVE});
  const p=await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.route('**/cdnjs.cloudflare.com/**',r=>r.fulfill({status:200,
    contentType:'application/javascript',
    body:'window.QRCode=function(n){n.innerHTML="";};window.QRCode.CorrectLevel={M:0};'}));
  const fake=crearFake('ok'); await fake.instalar(p); fake.claves[COD]=CLAVE;
  fake.db.ce_eventos.push({codigo:COD,nombre:'Los 15 de Delfina',fecha:'2026-10-18',
    tipo:'XV',tono:'#D9AE72',moderar:false,cerrado:false,creado:1});
  return {ctx,p,errs,fake};
}
/* Lo que un dedo puede tocar, medido en la pantalla. */
const chicos=p=>p.evaluate(()=>
  [...document.querySelectorAll('button,a[href],input,select,textarea,[role="button"]')]
    .filter(n=>{const c=n.getBoundingClientRect(); const s=getComputedStyle(n);
      return c.width>0&&c.height>0&&s.visibility!=='hidden'&&(c.height<44||c.width<44);})
    .map(n=>{const c=n.getBoundingClientRect();
      return (n.className||n.tagName).toString().split(' ')[0]+' '+Math.round(c.width)+'x'+Math.round(c.height);}));

(async()=>{
  const browser=await chromium.launch();

  console.log('\n─── todo lo que se toca entra en un dedo ───');
  for(const [nombre,url] of [
    ['la página pública', M+'/'],
    ['el panel del evento', M+'/muro.html#evento/'+COD],
    ['la vista del invitado', M+'/muro.html#subir/'+COD],
    ['el panel', M+'/muro.html#panel'],
  ]){
    const {ctx,p}=await pagina(browser);
    await p.goto(url,{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(2300);
    const c=await chicos(p);
    if(c.length) mal(`${nombre}: ${c.length} por debajo de 44x44 → ${c.slice(0,3).join(' · ')}`);
    else bien(`${nombre}: ninguno por debajo de 44x44`);
    await ctx.close();
  }

  console.log('\n─── de un teléfono chico a un escritorio ───');
  {
    const {ctx,p,errs}=await pagina(browser);
    await p.goto(M+'/',{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(2200);
    const medidas=[];
    for(const an of [320,360,390,414,768,1024,1280,1440]){
      await p.setViewportSize({width:an,height:900});
      await p.waitForTimeout(420);
      medidas.push(await p.evaluate(()=>{
        const d=document.documentElement, t=document.querySelector('h1');
        return {desborde:d.scrollWidth-d.clientWidth,
                titulo:Math.round(parseFloat(getComputedStyle(t).fontSize))};
      }));
    }
    const salidos=medidas.filter(m=>m.desborde>1);
    if(salidos.length) mal(`se sale de la pantalla en ${salidos.length} anchos`);
    else bien('no se sale nada, de 320 a 1440');
    /* Que el título escale: si mide lo mismo en un teléfono que en un
       monitor, no es responsivo, está clavado. */
    const chico=medidas[0].titulo, grande=medidas[medidas.length-1].titulo;
    if(!(grande>chico*1.3)) mal(`el título no escala: ${chico}px en 320 y ${grande}px en 1440`);
    else bien(`el título escala solo: ${chico}px en 320 → ${grande}px en 1440`);
    if(errs.length) mal('errores JS: '+errs.join(' | '));
    await ctx.close();
  }

  console.log('\n─── las fotos del álbum terminan visibles ───');
  /* Esto es lo que casi se va a producción invisible: el latido tapa la
     foto hasta que carga, y si la marca no se pone, no se ve NADA. */
  {
    const {ctx,p,errs}=await pagina(browser);
    let lento=true;
    await p.route('**/storage/v1/object/public/ce-medios/**', async r=>{
      if(lento) await new Promise(x=>setTimeout(x,1200));   // wifi de salón
      r.fulfill({status:200,contentType:'image/jpeg',body:JPEG});
    });
    const items=Array.from({length:6},(_,i)=>({id:'f'+i,codigo:COD,kind:'foto',
      url:`https://kuqlqgrwsospwjexodqa.supabase.co/storage/v1/object/public/ce-medios/${COD}/f${i}.jpg`,
      autor:'Invitado '+i,texto:'',estado:'aprobado',ts:i}));
    await p.route('**/kuqlqgrwsospwjexodqa.supabase.co/rest/v1/**',r=>{
      const u=r.request().url();
      if(u.includes('ce_items')) return r.fulfill({status:200,contentType:'application/json',
        body:JSON.stringify(items)});
      if(u.includes('ce_eventos')) return r.fulfill({status:200,contentType:'application/json',
        body:JSON.stringify([{codigo:COD,nombre:'Delfina',fecha:'2026-10-18',tono:'#D9AE72',
          moderar:false,cerrado:false,creado:1}])});
      return r.fulfill({status:200,contentType:'application/json',body:'[]'});
    });
    await p.goto(M+'/muro.html#album/'+COD,{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(800);
    const mientras=await p.evaluate(()=>({
      fotos:document.querySelectorAll('.mosaico-a img').length,
      late:[...document.querySelectorAll('.mosaico-a a')]
        .filter(a=>getComputedStyle(a,'::before').animationName!=='none').length}));
    if(!mientras.fotos) mal('la grilla del álbum no se dibujó');
    else if(!mientras.late) mal('mientras cargan no late nada: el hueco queda negro');
    else bien(`mientras cargan, ${mientras.late} huecos laten`);
    await p.waitForTimeout(3000);
    const despues=await p.evaluate(()=>{
      const im=[...document.querySelectorAll('.mosaico-a img')];
      return {fotos:im.length,
              visibles:im.filter(i=>+getComputedStyle(i).opacity>0.9).length,
              late:[...document.querySelectorAll('.mosaico-a a')]
                .filter(a=>+getComputedStyle(a,'::before').opacity>0.1).length};});
    if(despues.visibles!==despues.fotos)
      mal(`¡${despues.fotos-despues.visibles} de ${despues.fotos} fotos quedaron INVISIBLES!`);
    else bien(`cargadas, se ven las ${despues.fotos}`);
    if(despues.late) mal(`${despues.late} huecos siguen latiendo abajo de una foto ya cargada`);
    else bien('y el latido se apaga');
    if(errs.length) mal('errores JS: '+errs.join(' | '));
    await ctx.close();
  }

  console.log('\n─── con "menos movimiento" no se mueve nada ───');
  {
    const {ctx,p}=await pagina(browser,{motion:'reduce'});
    await p.route('**/storage/v1/object/public/ce-medios/**',r=>
      r.fulfill({status:200,contentType:'image/jpeg',body:JPEG}));
    await p.goto(M+'/muro.html#album/'+COD,{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(2600);
    const r=await p.evaluate(()=>{
      const a=document.querySelector('.mosaico-a a');
      const im=[...document.querySelectorAll('.mosaico-a img')];
      return {late:a?getComputedStyle(a,'::before').animationName:'—',
              invisibles:im.filter(i=>+getComputedStyle(i).opacity<0.9).length};});
    if(r.late!=='none'&&r.late!=='—')
      mal('con "menos movimiento" el latido sigue andando: '+r.late);
    else bien('con "menos movimiento" no late');
    /* Y sobre todo: apagar el movimiento no puede esconder las fotos. */
    if(r.invisibles) mal(`con "menos movimiento" quedan ${r.invisibles} fotos invisibles`);
    else bien('y las fotos se ven igual');
    await ctx.close();
  }

  await browser.close();
  console.log(fallas.length?`\n${fallas.length} FALLAS`:'\n✓ Sin fallas');
  process.exit(fallas.length?1:0);
})();
