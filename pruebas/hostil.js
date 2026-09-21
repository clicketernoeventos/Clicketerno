/* Condiciones hostiles: lo que pasa cuando nada sale como en la demo.
   Fiestas enormes, nombres imposibles, red que se corta a mitad,
   navegador con la memoria bloqueada, dedos apurados y relojes mal puestos. */
const { chromium } = require('playwright');
const { crearFake } = require('./fakesb');
const BASE='http://127.0.0.1:8099';
const fallas=[]; const mal=m=>{fallas.push(m);console.log('  ✗ '+m);};
const bien=m=>console.log('  ✓ '+m);
const COD='QUI-7FCE64', CLAVE='ABC123';

const FOTO=c=>'data:image/svg+xml;utf8,'+encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="80"><rect width="60" height="80" fill="${c}"/></svg>`);

async function pagina(browser,{claves=true,sinMemoria=false,viewport={width:390,height:844}}={}){
  const ctx=await browser.newContext({viewport});
  const p=await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  if(sinMemoria){
    // como una ventana privada con el almacenamiento bloqueado
    await ctx.addInitScript(()=>{
      const romper=o=>['getItem','setItem','removeItem','clear'].forEach(m=>{
        Object.defineProperty(o,m,{value:()=>{throw new DOMException('bloqueado','SecurityError');}});
      });
      try{ romper(window.localStorage); romper(window.sessionStorage); }catch(e){}
    });
  }
  await p.route('**/cdnjs.cloudflare.com/**',r=>r.fulfill({status:200,contentType:'application/javascript',
    body:'window.QRCode=function(n,o){n.innerHTML="<canvas></canvas>";};window.QRCode.CorrectLevel={M:0};'}));
  const fake=crearFake('ok');
  await fake.instalar(p);
  if(claves){
    fake.claves[COD]=CLAVE;
    await ctx.addInitScript(c=>{ try{ localStorage.setItem('ce:claves',JSON.stringify(c)); }catch(e){} },{[COD]:CLAVE});
  }
  return {ctx,p,errs,fake};
}
const evento=extra=>Object.assign({codigo:COD,nombre:'Delfina',fecha:'2026-08-21',tipo:'XV',
  tono:'#D9AE72',moderar:false,cerrado:false,creado:1},extra||{});

(async()=>{
  const browser=await chromium.launch();

  // ═══ 1. una fiesta enorme: más de mil recuerdos ═══
  console.log('\n─── 1400 recuerdos (la base corta en 1000) ───');
  {
    const {ctx,p,errs,fake}=await pagina(browser);
    fake.db.ce_eventos.push(evento());
    for(let i=0;i<1400;i++) fake.db.ce_items.push({id:'f'+i,codigo:COD,kind:'foto',
      url:FOTO('#2'+String(i%9)+'3329'),autor:'Inv '+i,texto:'',estado:'aprobado',ts:1000+i});
    await p.goto(BASE+'/muro.html#evento/'+COD,{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(3500);
    const cifra=await p.locator('[data-kind="foto"]').getAttribute('data-cifra').catch(()=>'0');
    if(Number(cifra)!==1400) mal(`el panel cuenta ${cifra} de 1400: se pierden recuerdos`);
    else bien('el panel cuenta los 1400');
    if(fake.pedidos.items<2) mal('pidió todo en una sola tanda: la base habría cortado en 1000');
    else bien(`los pide de a tandas (${fake.pedidos.items} pedidos)`);

    await p.goto('about:blank');
    await p.goto(BASE+'/muro.html#album/'+COD,{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(4000);
    const enAlbum=await p.evaluate(()=>{
      const t=document.querySelector('#aFotos');
      return t?t.querySelectorAll('img').length:0;});
    if(enAlbum<1400) mal(`el álbum muestra ${enAlbum} de 1400`);
    else bien('el álbum muestra las 1400');
    if(errs.length) mal('errores JS: '+errs.slice(0,2).join(' | '));
    await ctx.close();
  }

  // ═══ 2. nombres y textos imposibles ═══
  console.log('\n─── nombres imposibles ───');
  {
    const {ctx,p,errs,fake}=await pagina(browser);
    const NOMBRES=[
      'A'.repeat(200),
      '🎉🎂✨ Delfina 👑 15 🥂',
      'مرحبا بالعالم',
      '   ',
      'Ñandú — «Añoranza» · Ößé',
      'a\nb\nc\nd',
    ];
    for(const [i,n] of NOMBRES.entries()){
      fake.db.ce_eventos.push(evento({codigo:'QUI-N'+i, nombre:n, creado:i}));
      fake.claves['QUI-N'+i]=CLAVE;
    }
    await p.evaluate(()=>{}).catch(()=>{});
    await ctx.addInitScript(c=>{ try{ localStorage.setItem('ce:claves',JSON.stringify(c)); }catch(e){} },
      Object.fromEntries(NOMBRES.map((_,i)=>['QUI-N'+i,CLAVE])));
    for(const [i,n] of NOMBRES.entries()){
      await p.goto('about:blank');
      await p.goto(BASE+'/muro.html#evento/QUI-N'+i,{waitUntil:'domcontentloaded'});
      await p.waitForTimeout(900);
      const r=await p.evaluate(()=>({
        vivo:(document.getElementById('app').innerText||'').trim().length>0,
        desborda:document.documentElement.scrollWidth>window.innerWidth+1}));
      const et=JSON.stringify(n).slice(0,26);
      if(!r.vivo) mal(`la app queda en blanco con el nombre ${et}`);
      else if(r.desborda) mal(`el nombre ${et} desborda la pantalla a lo ancho`);
      else bien(`aguanta el nombre ${et}`);
    }
    if(errs.length) mal('errores JS: '+errs.slice(0,2).join(' | '));
    await ctx.close();
  }

  // ═══ 3. el navegador no deja guardar nada (ventana privada) ═══
  console.log('\n─── navegador con la memoria bloqueada ───');
  {
    const {ctx,p,errs,fake}=await pagina(browser,{claves:false,sinMemoria:true});
    fake.db.ce_eventos.push(evento());
    await p.goto(BASE+'/muro.html',{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(1200);
    let vivo=await p.evaluate(()=>(document.getElementById('app').innerText||'').trim().length>0);
    if(!vivo) mal('la portada queda en blanco sin almacenamiento');
    else bien('la portada abre igual');
    await p.goto(BASE+'/muro.html#panel',{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(900);
    await p.fill('#pin','4321'); await p.click('#entrar'); await p.waitForTimeout(900);
    const msg=await p.locator('#recado').innerText().catch(()=>'');
    const entro=await p.evaluate(()=>!!document.querySelector('#crear'));
    if(entro) bien('deja entrar igual');
    else if(/privad|guardar/i.test(msg)) bien('avisa por qué no puede: "'+msg.trim()+'"');
    else mal(`no entra y no explica por qué (dijo: "${msg.trim()}")`);
    vivo=await p.evaluate(()=>(document.getElementById('app').innerText||'').trim().length>0);
    if(!vivo) mal('la app queda en blanco al intentar guardar la clave');
    if(errs.length) mal('errores JS: '+errs.slice(0,2).join(' | '));
    await ctx.close();
  }

  // ═══ 4. la base contesta basura ═══
  console.log('\n─── la base contesta cualquier cosa ───');
  for(const [qué,resp] of [
    ['una página de error HTML',{status:502,contentType:'text/html',body:'<html><body>502 Bad Gateway</body></html>'}],
    ['JSON cortado a la mitad',{status:200,contentType:'application/json',body:'[{"codigo":"QUI-1","nom'}],
    ['un objeto donde va una lista',{status:200,contentType:'application/json',body:'{"message":"nope"}'}],
    ['vacío con estado 200',{status:200,contentType:'application/json',body:''}],
  ]){
    const ctx=await browser.newContext({viewport:{width:390,height:844}});
    const p=await ctx.newPage();
    const errs=[]; p.on('pageerror',e=>errs.push(e.message));
    await p.route('**/cdnjs.cloudflare.com/**',r=>r.fulfill({status:200,contentType:'application/javascript',
      body:'window.QRCode=function(n){n.innerHTML="";};window.QRCode.CorrectLevel={M:0};'}));
    await p.route('**/rest/v1/**',r=>r.fulfill(resp));
    await p.goto(BASE+'/muro.html',{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(1400);
    const vivo=await p.evaluate(()=>(document.getElementById('app').innerText||'').trim().length>0);
    if(!vivo) mal(`la app queda en blanco con ${qué}`);
    else bien(`sobrevive a ${qué}`);
    if(errs.length) mal(`${qué} tira error JS: `+errs[0]);
    await ctx.close();
  }

  // ═══ 5. dedos apurados: doble y triple toque ═══
  console.log('\n─── dedos apurados ───');
  {
    const {ctx,p,errs,fake}=await pagina(browser,{claves:false});
    await p.goto(BASE+'/muro.html#panel',{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(900);
    await p.fill('#pin','4321'); await p.click('#entrar'); await p.waitForTimeout(800);
    await p.fill('#n','Triple toque');
    await p.locator('#aceptoT').check().catch(()=>{});
    await Promise.all([p.click('#crear'),p.click('#crear').catch(()=>{}),p.click('#crear').catch(()=>{})]);
    await p.waitForTimeout(2200);
    if(fake.db.ce_eventos.length!==1)
      mal(`el triple toque creó ${fake.db.ce_eventos.length} eventos`);
    else bien('el triple toque crea un solo evento');
    if(errs.length) mal('errores JS: '+errs.slice(0,2).join(' | '));
    await ctx.close();
  }

  // ═══ 6. relojes mal puestos ═══
  console.log('\n─── relojes y fechas rotas ───');
  {
    const {ctx,p,errs,fake}=await pagina(browser);
    const FECHAS=[null,'','no-es-una-fecha','0000-00-00','2026-13-45','9999-12-31',
      '2026-08-21T99:99','<img src=x onerror=alert(1)>'];
    for(const [i,f] of FECHAS.entries()){
      const c='QUI-F'+i;
      fake.db.ce_eventos.push(evento({codigo:c,fecha:f,lanza:f,creado:i}));
      fake.claves[c]=CLAVE;
    }
    await ctx.addInitScript(c=>{ try{ localStorage.setItem('ce:claves',JSON.stringify(c)); }catch(e){} },
      Object.fromEntries(FECHAS.map((_,i)=>['QUI-F'+i,CLAVE])));
    for(const [i,f] of FECHAS.entries()){
      await p.goto('about:blank');
      await p.goto(BASE+'/muro.html#subir/QUI-F'+i,{waitUntil:'domcontentloaded'});
      await p.waitForTimeout(800);
      const r=await p.evaluate(()=>({
        vivo:(document.getElementById('app').innerText||'').trim().length>0,
        xss:!!window.__XSS,
        nan:/NaN|Invalid|undefined|null/.test(document.getElementById('app').innerText||'')}));
      const et=JSON.stringify(f);
      if(!r.vivo) mal(`pantalla en blanco con la fecha ${et}`);
      else if(r.xss) mal(`la fecha ${et} ejecutó código`);
      else if(r.nan) mal(`la fecha ${et} muestra basura en pantalla`);
      else bien(`aguanta la fecha ${et}`);
    }
    if(errs.length) mal('errores JS: '+errs.slice(0,2).join(' | '));
    await ctx.close();
  }

  // ═══ 7. borrar una fiesta con 1200 archivos ═══
  console.log('\n─── borrar una fiesta enorme ───');
  {
    const {ctx,p,errs,fake}=await pagina(browser,{claves:false});
    fake.db.ce_eventos.push(evento());
    for(let i=0;i<1200;i++) fake.archivos.push({name:'f'+i+'.jpg'});
    for(let i=0;i<1200;i++) fake.db.ce_items.push({id:'f'+i,codigo:COD,kind:'foto',
      url:'https://x/ce-medios/'+COD+'/f'+i+'.jpg',autor:'A',texto:'',estado:'aprobado',ts:i});
    await p.goto(BASE+'/muro.html#panel',{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(900);
    await p.click('#modoAdmin'); await p.waitForTimeout(200);
    await p.fill('#pin','CLAVE-MAESTRA-DE-PRUEBA'); await p.click('#entrar'); await p.waitForTimeout(900);
    await p.goto('about:blank');
    await p.goto(BASE+'/muro.html#evento/'+COD,{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(3000);
    await p.click('[data-sol="pAjustes"]'); await p.waitForTimeout(600);
    await p.click('#pedirBorrar'); await p.waitForTimeout(400);
    await p.fill('#confirmaCod',COD); await p.waitForTimeout(250);
    await p.click('#borrarYa'); await p.waitForTimeout(6000);
    if(fake.pedidos.archivosBorrados<1200)
      mal(`borró ${fake.pedidos.archivosBorrados} de 1200 archivos: quedan ocupando lugar`);
    else bien('borra los 1200 archivos');
    if(fake.pedidos.tandasBorrado<2)
      mal('mandó los 1200 en un solo pedido: la base lo rechaza entero');
    else bien(`los borra de a tandas (${fake.pedidos.tandasBorrado} pedidos)`);
    if(errs.length) mal('errores JS: '+errs.slice(0,2).join(' | '));
    await ctx.close();
  }

  await browser.close();
  console.log(fallas.length?`\n${fallas.length} FALLAS`:'\n✓ Sin fallas');
  process.exit(fallas.length?1:0);
})();
