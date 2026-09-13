const { chromium } = require('playwright');
const { crearFake } = require('./fakesb');
const BASE='http://127.0.0.1:8099';
const fallas=[]; const mal=m=>{fallas.push(m);console.log('  ✗ '+m);};
const bien=m=>console.log('  ✓ '+m);
const CLAVE='ABC123', COD='QUI-7FCE64';

async function pagina(browser,{romper=null}={}){
  const ctx=await browser.newContext({viewport:{width:390,height:844}});
  const p=await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.route('**/cdnjs.cloudflare.com/**',r=>r.fulfill({status:200,contentType:'application/javascript',
    body:'window.QRCode=function(n,o){n.innerHTML="<canvas></canvas>";};window.QRCode.CorrectLevel={M:0};'}));
  const fake=crearFake('ok');
  await fake.instalar(p);
  fake.claves[COD]=CLAVE;
  await ctx.addInitScript(c=>{ try{ localStorage.setItem('ce:claves',JSON.stringify(c)); }catch(e){} },{[COD]:CLAVE});
  if(romper){
    // la base todavía no tiene esa columna
    await p.route('**/rest/v1/ce_eventos*',async route=>{
      const req=route.request();
      if(req.method()==='POST' && (req.postData()||'').includes(`"${romper}"`))
        return route.fulfill({status:400,contentType:'application/json',
          body:JSON.stringify({code:'PGRST204',
            message:`Could not find the '${romper}' column of 'ce_eventos' in the schema cache`})});
      return route.fallback();
    });
  }
  fake.db.ce_eventos.push({codigo:COD,nombre:'Delfina',fecha:'2026-08-21',tipo:'XV',
    tono:'#D9AE72',moderar:false,cerrado:false,creado:1});
  const FOTO=c=>'data:image/svg+xml;utf8,'+encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="600" height="800" fill="${c}"/></svg>`);
  ['%23243329','%23241C14','%232B2233'].forEach((c,i)=>fake.db.ce_items.push({
    id:'p'+i,codigo:COD,kind:'foto',url:FOTO(c),autor:['Tomás','Mica','Nacho'][i],
    texto:'',estado:'aprobado',ts:1000+i}));
  return {ctx,p,errs,fake};
}

(async()=>{
  const browser=await chromium.launch();

  // ═══ 1. bajar algo que ya está en la pantalla ═══
  console.log('\n─── bajar un recuerdo ya publicado ───');
  {
    const {ctx,p,errs,fake}=await pagina(browser);
    await p.goto(BASE+'/app.html#evento/'+COD,{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(1400);
    await p.click('[data-sol="pModerar"]'); await p.waitForTimeout(600);
    const cuantos=await p.locator('.publi').count();
    if(cuantos!==3) mal(`la grilla muestra ${cuantos} publicados, esperaba 3`);
    else bien('se ven los 3 recuerdos publicados');

    // un toque NO tiene que bajar nada (evita el accidente)
    await p.locator('.publi').first().click(); await p.waitForTimeout(300);
    if(fake.db.ce_items.filter(i=>i.estado==='aprobado').length!==3)
      mal('un solo toque ya bajó la foto: se puede bajar algo sin querer');
    else bien('un toque solo pregunta, no baja nada');
    if(!(await p.locator('.publi .velo .sacar').count())) return mal('no aparece el botón de bajar'), ctx.close();

    await p.click('.publi .velo .sacar'); await p.waitForTimeout(1200);
    const bajada=fake.db.ce_items.find(i=>i.id==='p2');   // la más nueva va primera
    if(!bajada || bajada.estado!=='rechazado') mal('la foto no quedó bajada en la base');
    else bien('la foto queda fuera de la pantalla y del álbum');
    if(fake.db.ce_items.filter(i=>i.estado==='aprobado').length!==2)
      mal('bajó más de una foto de un solo toque');
    else bien('bajó solo la que toqué');

    // el muro del salón ya no la muestra
    await p.goto('about:blank');
    await p.goto(BASE+'/app.html#album/'+COD,{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(1300);
    const enAlbum=await p.evaluate(()=>document.querySelectorAll('#aFotos img,#aFotos .toma').length);
    if(enAlbum>2) mal(`el álbum sigue mostrando ${enAlbum}: la bajada no desapareció`);
    else bien('el álbum ya no la muestra');

    // deshacer
    await p.goto('about:blank');
    await p.goto(BASE+'/app.html#evento/'+COD,{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(1300);
    await p.click('[data-sol="pModerar"]'); await p.waitForTimeout(500);
    const quedan=await p.locator('.publi').count();
    if(quedan!==2) mal(`después de bajar una quedan ${quedan}, esperaba 2`);
    else bien('la grilla queda con 2');
    if(errs.length) mal('errores JS: '+errs.join(' | '));
    await ctx.close();
  }

  // ═══ 2. corregir los datos del evento ═══
  console.log('\n─── corregir nombre, fecha y tono ───');
  {
    const {ctx,p,errs,fake}=await pagina(browser);
    await p.goto(BASE+'/app.html#evento/'+COD,{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(1400);
    await p.click('[data-sol="pAjustes"]'); await p.waitForTimeout(500);

    await p.fill('#edNombre',''); await p.click('#guardarDatos'); await p.waitForTimeout(400);
    const aviso=await p.locator('#recado').innerText().catch(()=>'');
    if(!/vac/i.test(aviso)) mal('deja borrar el nombre del evento');
    else bien('no deja dejar el nombre vacío');

    await p.fill('#edNombre','Delfina Sosa');
    await p.fill('#edFecha','2026-09-19');
    await p.locator('#pAjustes .tono').nth(2).click();
    await p.click('#guardarDatos'); await p.waitForTimeout(1400);
    const ev=fake.db.ce_eventos[0];
    if(ev.nombre!=='Delfina Sosa') mal('no guardó el nombre nuevo: '+ev.nombre);
    else bien('guardó el nombre corregido');
    if(ev.fecha!=='2026-09-19') mal('no guardó la fecha nueva: '+ev.fecha);
    else bien('guardó la fecha corregida');
    if(ev.tono==='#D9AE72') mal('no guardó el tono nuevo');
    else bien('guardó el tono: '+ev.tono);
    if(ev.vence!=='2027-09-19') mal('el vencimiento no siguió a la fecha: '+ev.vence);
    else bien('el vencimiento se corrió con la fecha: '+ev.vence);
    const titulo=await p.locator('.quien-ev b').innerText().catch(()=>'');
    if(!/Delfina Sosa/.test(titulo)) mal('la pantalla no se actualizó: '+titulo);
    else bien('el panel ya muestra el nombre nuevo');
    if(errs.length) mal('errores JS: '+errs.join(' | '));
    await ctx.close();
  }

  // ═══ 3. hashtag y lugar ═══
  console.log('\n─── hashtag y lugar ───');
  {
    const {ctx,p,errs,fake}=await pagina(browser);
    await p.goto(BASE+'/app.html#evento/'+COD,{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(1400);
    await p.click('[data-sol="pAjustes"]'); await p.waitForTimeout(500);
    await p.fill('#edTag','Delfina 15');          // sin # y con espacio
    await p.fill('#edLugar','Salón Las Acacias · Rosario');
    await p.click('#guardarTag'); await p.waitForTimeout(1400);
    const ev=fake.db.ce_eventos[0];
    if(ev.hashtag!=='#Delfina15') mal('no acomodó el hashtag: '+ev.hashtag);
    else bien('le pone el # y saca los espacios: '+ev.hashtag);
    if(!ev.lugar) mal('no guardó el lugar');
    else bien('guardó el lugar');

    for(const [ruta,donde] of [['cartel','cartel de mesa'],['pantalla','pantalla del salón'],['album','álbum']]){
      await p.goto('about:blank');
      await p.goto(`${BASE}/app.html#${ruta}/${COD}`,{waitUntil:'domcontentloaded'});
      await p.waitForTimeout(1300);
      /* el diseño lo muestra en mayúsculas, así que comparamos sin distinguir */
      const t=(await p.evaluate(()=>document.getElementById('app').innerText||'')).toLowerCase();
      if(!t.includes('#delfina15')) mal(`el hashtag no aparece en el ${donde}`);
      else bien(`aparece en el ${donde}`);
    }
    if(errs.length) mal('errores JS: '+errs.join(' | '));
    await ctx.close();
  }

  // ═══ 4. la base todavía no tiene las columnas nuevas ═══
  console.log('\n─── base sin las columnas nuevas ───');
  {
    const {ctx,p,errs,fake}=await pagina(browser,{romper:'hashtag'});
    await p.goto(BASE+'/app.html#evento/'+COD,{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(1400);
    await p.click('[data-sol="pAjustes"]'); await p.waitForTimeout(500);
    await p.fill('#edTag','#Prueba');
    await p.click('#guardarTag'); await p.waitForTimeout(1600);
    const msg=await p.locator('#recado').innerText().catch(()=>'');
    const vivo=await p.evaluate(()=>(document.getElementById('app').innerText||'').trim().length>0);
    if(!vivo) mal('la app queda en blanco si falta la columna');
    else bien('la app sigue viva');
    if(/^guardado/i.test(msg.trim())) mal(`DICE QUE GUARDÓ Y NO GUARDÓ: "${msg.trim()}"`);
    else if(!/columna/i.test(msg)) mal(`no avisa qué pasó: "${msg.trim()}"`);
    else bien('avisa la verdad: "'+msg.trim()+'"');
    // y lo demás se tiene que poder seguir guardando
    await p.fill('#edNombre','Otro nombre'); await p.click('#guardarDatos'); await p.waitForTimeout(1400);
    if(fake.db.ce_eventos[0].nombre!=='Otro nombre')
      mal('con una columna faltante se rompe también guardar el nombre');
    else bien('el resto se sigue guardando igual');
    if(errs.length) mal('errores JS: '+errs.join(' | '));
    await ctx.close();
  }

  await browser.close();
  console.log(fallas.length?`\n${fallas.length} FALLAS`:'\n✓ Sin fallas');
})();
