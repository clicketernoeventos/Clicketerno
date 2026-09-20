/* ══════════════════════════════════════════════════════════════════
   Las miniaturas.

   El álbum bajaba las fotos ENTERAS para mostrarlas del tamaño de una
   uña. Con 1500 recuerdos eso son cientos de megas cada vez que alguien
   lo abre, y el tráfico es lo único que puede hacer pasar el límite de
   Supabase: el depósito no, las fotos guardadas entran de sobra.

   Cuatro cosas, y las cuatro importan:
     1. que el álbum pese mucho menos;
     2. que las fotos de ANTES —que no tienen miniatura— se sigan viendo:
        el respaldo no puede dejar el álbum de un cliente en blanco;
     3. que al subir se genere y sea de verdad más chica;
     4. y que lo que se PROYECTA siga siendo la foto entera. Una
        miniatura de 420px en un proyector de salón se ve horrible, y
        ese es el producto.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const BASE='http://127.0.0.1:8099';
const COD='QUI-7FCE64', CLAVE='ABC123';
const fallas=[]; const mal=m=>{fallas.push(m);console.log('  ✗ '+m);};
const bien=m=>console.log('  ✓ '+m);

/* JPEG de verdad, estirado hasta el peso que se quiere. Con bytes
   inventados el navegador no puede decodificar, da la foto por rota y
   dispara el respaldo: medido así, las miniaturas parecían gastar MÁS. */
const JPEG=Buffer.from(
 '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a'+
 'HBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAA'+
 'AAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==','base64');
const pesar=kb=>Buffer.concat([JPEG,Buffer.alloc(Math.max(0,kb*1024-JPEG.length),0)]);
const GRANDE=pesar(441), CHICA=pesar(38);     // 441 KB es el promedio medido
const N=30;

const items=()=>Array.from({length:N},(_,i)=>({id:'f'+i,codigo:COD,kind:'foto',
  url:`https://kuqlqgrwsospwjexodqa.supabase.co/storage/v1/object/public/ce-medios/${COD}/f${i}.jpg`,
  autor:'Invitado '+i,texto:'',estado:'aprobado',ts:i}));

/* Abre el álbum con o sin miniaturas en el depósito y cuenta los bytes
   que el navegador pide de verdad. */
async function album(browser,{hayMini}){
  const ctx=await browser.newContext({viewport:{width:390,height:844}});
  await ctx.addInitScript(c=>{try{localStorage.setItem('ce:claves',JSON.stringify(c));}catch(e){}},{[COD]:CLAVE});
  const p=await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  let bytes=0;
  await p.route('**/cdnjs.cloudflare.com/**',r=>r.fulfill({status:200,
    contentType:'application/javascript',
    body:'window.QRCode=function(n){n.innerHTML="";};window.QRCode.CorrectLevel={M:0};'}));
  await p.route('**/storage/v1/object/public/ce-medios/**',r=>{
    const esMini=/-min\.jpg/.test(r.request().url());
    if(esMini && !hayMini) return r.fulfill({status:404,body:''});
    const cuerpo=esMini?CHICA:GRANDE;
    bytes+=cuerpo.length;
    r.fulfill({status:200,contentType:'image/jpeg',body:cuerpo});
  });
  await p.route('**/kuqlqgrwsospwjexodqa.supabase.co/rest/v1/**',r=>{
    const u=r.request().url();
    if(u.includes('ce_items')) return r.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify(items())});
    if(u.includes('ce_eventos')) return r.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify([{codigo:COD,nombre:'Los 15 de Delfina',fecha:'2026-10-18',
        tono:'#D9AE72',moderar:false,cerrado:false,creado:1}])});
    return r.fulfill({status:200,contentType:'application/json',body:'[]'});
  });
  await p.goto(BASE+'/muro.html#album/'+COD,{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(1500);
  for(let i=0;i<12;i++){ await p.mouse.wheel(0,2000); await p.waitForTimeout(240); }
  await p.waitForTimeout(1800);
  const r=await p.evaluate(()=>{
    const im=[...document.querySelectorAll('#aFotos img')];
    return {dibujadas:im.length, rotas:im.filter(i=>i.complete&&i.naturalWidth===0).length};
  });
  await ctx.close();
  return {mb:bytes/1048576, ...r, errs};
}

(async()=>{
  const browser=await chromium.launch();

  console.log('\n─── cuánto pesa abrir el álbum ───');
  const sin=await album(browser,{hayMini:false});
  const con=await album(browser,{hayMini:true});
  console.log(`    sin miniaturas: ${sin.mb.toFixed(1)} MB · con miniaturas: ${con.mb.toFixed(1)} MB`);
  if(sin.dibujadas!==N) mal(`sin miniaturas dibuja ${sin.dibujadas} fotos de ${N}`);
  else bien(`dibuja las ${N} fotos`);
  const veces = sin.mb/Math.max(con.mb,0.001);
  if(veces<4) mal(`el álbum solo baja ${veces.toFixed(1)} veces menos: las miniaturas no se están usando`);
  else bien(`el álbum baja ${veces.toFixed(1)} veces menos (${sin.mb.toFixed(1)} MB → ${con.mb.toFixed(1)} MB)`);

  console.log('\n─── las fotos de antes se siguen viendo ───');
  /* Las que ya están subidas NO tienen miniatura: si el respaldo falla,
     el álbum de un cliente queda en blanco y no hay arreglo. */
  if(sin.rotas) mal(`¡${sin.rotas} fotos rotas cuando no hay miniatura!`);
  else bien('sin miniatura en el depósito, se ven igual las 30: cae a la foto entera');
  if(con.rotas) mal(`${con.rotas} fotos rotas con las miniaturas puestas`);
  else bien('y con miniatura tampoco se rompe ninguna');
  if(sin.errs.length||con.errs.length) mal('errores JS: '+[...sin.errs,...con.errs][0]);
  else bien('sin errores de JavaScript');

  console.log('\n─── se genera al subir, y es más chica ───');
  {
    const ctx=await browser.newContext({viewport:{width:390,height:844}});
    await ctx.addInitScript(c=>{try{localStorage.setItem('ce:claves',JSON.stringify(c));}catch(e){}},{[COD]:CLAVE});
    const p=await ctx.newPage();
    const errs=[]; p.on('pageerror',e=>errs.push(e.message));
    const subidas=[];
    await p.route('**/cdnjs.cloudflare.com/**',r=>r.fulfill({status:200,
      contentType:'application/javascript',
      body:'window.QRCode=function(n){n.innerHTML="";};window.QRCode.CorrectLevel={M:0};'}));
    await p.route('**/storage/v1/object/ce-medios/**',r=>{
      const u=r.request().url();
      subidas.push({ruta:u.split('/ce-medios/')[1], bytes:(r.request().postDataBuffer()||{length:0}).length});
      r.fulfill({status:200,contentType:'application/json',body:'{"Key":"ok"}'});
    });
    await p.route('**/storage/v1/object/public/ce-medios/**',r=>
      r.fulfill({status:200,contentType:'image/jpeg',body:GRANDE}));
    await p.route('**/kuqlqgrwsospwjexodqa.supabase.co/rest/v1/**',r=>{
      const u=r.request().url();
      if(u.includes('ce_eventos')) return r.fulfill({status:200,contentType:'application/json',
        body:JSON.stringify([{codigo:COD,nombre:'Los 15 de Delfina',fecha:'2026-10-18',
          tono:'#D9AE72',moderar:false,cerrado:false,creado:1}])});
      return r.fulfill({status:200,contentType:'application/json',body:'[]'});
    });
    await p.goto(BASE+'/muro.html#subir/'+COD,{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(1600);
    /* Una foto de 1600x1200 de verdad, dibujada en la propia página: así
       el canvas tiene algo real que achicar. */
    const archivo=await p.evaluate(async()=>{
      const c=document.createElement('canvas'); c.width=1600; c.height=1200;
      const x=c.getContext('2d');
      const g=x.createLinearGradient(0,0,1600,1200);
      g.addColorStop(0,'#b47'); g.addColorStop(1,'#1a3'); x.fillStyle=g; x.fillRect(0,0,1600,1200);
      for(let i=0;i<400;i++){ x.fillStyle=`hsl(${i*7%360} 70% 60%)`;
        x.fillRect(Math.random()*1600,Math.random()*1200,40,40); }
      const b=await new Promise(r=>c.toBlob(r,'image/jpeg',.92));
      return {bytes:b.size, data:await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(b);})};
    });
    await p.setInputFiles('#file', {name:'foto.jpg', mimeType:'image/jpeg',
      buffer:Buffer.from(archivo.data.split(',')[1],'base64')});
    await p.waitForTimeout(1500);
    await p.fill('#autor','Tomás');
    await p.click('#enviar');
    await p.waitForTimeout(3500);
    const entera=subidas.find(s=>!/-min\.jpg$/.test(s.ruta));
    const mini  =subidas.find(s=>/-min\.jpg$/.test(s.ruta));
    if(!entera) mal('no subió la foto');
    else bien('sube la foto: '+entera.ruta);
    if(!mini) mal('NO generó la miniatura: el álbum va a seguir bajando todo entero');
    else{
      bien('y sube la miniatura: '+mini.ruta);
      /* Que la miniatura sea el mismo nombre + "-min.jpg" es lo que hace
         que el álbum la encuentre sin preguntarle nada a la base. */
      if(mini.ruta!==entera.ruta.replace(/\.[a-z0-9]+$/i,'')+'-min.jpg')
        mal(`el nombre no coincide: ${entera.ruta} → ${mini.ruta}`);
      else bien('con el nombre que el álbum sabe buscar');
      if(!(mini.bytes < entera.bytes*0.5))
        mal(`la miniatura pesa ${Math.round(mini.bytes/1024)} KB y la foto ${Math.round(entera.bytes/1024)} KB: no ahorra nada`);
      else bien(`pesa ${Math.round(mini.bytes/1024)} KB contra ${Math.round(entera.bytes/1024)} KB de la foto`);
    }
    if(errs.length) mal('errores JS: '+errs.join(' | '));
    await ctx.close();
  }

  console.log('\n─── lo que se proyecta sigue siendo la foto entera ───');
  {
    const ctx=await browser.newContext({viewport:{width:1280,height:800}});
    await ctx.addInitScript(c=>{try{localStorage.setItem('ce:claves',JSON.stringify(c));}catch(e){}},{[COD]:CLAVE});
    const p=await ctx.newPage();
    const pedidas=[];
    await p.route('**/cdnjs.cloudflare.com/**',r=>r.fulfill({status:200,
      contentType:'application/javascript',
      body:'window.QRCode=function(n){n.innerHTML="";};window.QRCode.CorrectLevel={M:0};'}));
    await p.route('**/storage/v1/object/public/ce-medios/**',r=>{
      pedidas.push(r.request().url().split('/ce-medios/')[1]);
      r.fulfill({status:200,contentType:'image/jpeg',body:GRANDE});
    });
    await p.route('**/kuqlqgrwsospwjexodqa.supabase.co/rest/v1/**',r=>{
      const u=r.request().url();
      if(u.includes('ce_items')) return r.fulfill({status:200,contentType:'application/json',
        body:JSON.stringify(items())});
      if(u.includes('ce_eventos')) return r.fulfill({status:200,contentType:'application/json',
        body:JSON.stringify([{codigo:COD,nombre:'Los 15 de Delfina',fecha:'2026-10-18',
          tono:'#D9AE72',moderar:false,cerrado:false,creado:1}])});
      return r.fulfill({status:200,contentType:'application/json',body:'[]'});
    });
    await p.goto(BASE+'/muro.html#pantalla/'+COD,{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(2200);
    await p.click('.modos-sala button[data-modo="muro"]').catch(()=>{});
    await p.waitForTimeout(2500);
    /* Lo que está EN el muro proyectado: si pidiera la miniatura, en un
       proyector se vería una foto de 420px estirada a tres metros. */
    const enPantalla=await p.evaluate(()=>{
      const i=document.querySelector('.sala .marco img, .sala img');
      return i?i.getAttribute('src'):'';
    });
    if(!enPantalla) mal('no se está proyectando ninguna foto');
    else if(/-min\.jpg/.test(enPantalla)) mal('¡el salón está proyectando la MINIATURA!: '+enPantalla.slice(-40));
    else bien('el salón proyecta la foto entera, no la miniatura');
    await ctx.close();
  }

  await browser.close();
  console.log(fallas.length?`\n${fallas.length} FALLAS`:'\n✓ Sin fallas');
  process.exit(fallas.length?1:0);
})();
