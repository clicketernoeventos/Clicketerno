const { chromium } = require('playwright');
const BASE='http://127.0.0.1:8099';
const fallas=[]; const mal=m=>{fallas.push(m);console.log('  ✗ '+m);};
const bien=m=>console.log('  ✓ '+m);

/* base falsa que registra qué se borró y puede negarse */
function fake({niegaBorrado=false}={}){
  const db={ce_eventos:[{codigo:'QUI-7FCE64',nombre:'Delfina',fecha:'2026-08-21',tono:'#D9AE72',
    moderar:false,cerrado:false,creado:1},{codigo:'BOD-AAA111',nombre:'Flor y Juan',
    fecha:'2026-09-05',tono:'#D9AE72',moderar:false,cerrado:false,creado:2}],
    ce_items:[0,1,2].map(i=>({id:'f'+i,codigo:'QUI-7FCE64',kind:'foto',
      url:'https://x.supabase.co/storage/v1/object/public/ce-medios/QUI-7FCE64/f'+i+'.jpg',
      autor:'Tomás',texto:'',estado:'aprobado',ts:i}))
      .concat([{id:'m0',codigo:'BOD-AAA111',kind:'foto',url:'https://x/ce-medios/BOD-AAA111/m0.jpg',
        autor:'Otro',texto:'',estado:'aprobado',ts:9}])};
  const borrado={tablas:[],archivos:[]};
  return {db,borrado,instalar:async p=>{
    await p.route('**/storage/v1/object/list/**',r=>r.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify([{name:'f0.jpg'},{name:'f1.jpg'},{name:'f2.jpg'},{name:'portada.jpg'}])}));
    await p.route('**/storage/v1/object/ce-medios**',r=>{
      const req=r.request();
      if(req.method()==='DELETE'){
        if(niegaBorrado) return r.fulfill({status:403,contentType:'application/json',
          body:JSON.stringify({message:'new row violates row-level security policy'})});
        borrado.archivos.push(...(JSON.parse(req.postData()||'{}').prefixes||[]));
        return r.fulfill({status:200,contentType:'application/json',body:'[]'});
      }
      r.fulfill({status:200,contentType:'application/json',body:'{}'});
    });
    await p.route('**/rest/v1/**',r=>{
      const req=r.request(), u=req.url();
      const tabla=u.includes('ce_items')?'ce_items':'ce_eventos';
      const cod=(u.match(/codigo=eq\.([^&]+)/)||[])[1];
      if(req.method()==='DELETE'){
        if(niegaBorrado) return r.fulfill({status:403,contentType:'application/json',
          body:JSON.stringify({message:'new row violates row-level security policy'})});
        borrado.tablas.push(tabla+':'+decodeURIComponent(cod||''));
        db[tabla]=db[tabla].filter(f=>f.codigo!==decodeURIComponent(cod||''));
        return r.fulfill({status:204,body:''});
      }
      let out=db[tabla].slice();
      if(cod) out=out.filter(f=>f.codigo===decodeURIComponent(cod));
      const id=(u.match(/id=eq\.([^&]+)/)||[])[1];
      if(id) out=db[tabla].filter(f=>String(f.id)===decodeURIComponent(id));
      r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(out)});
    });
  }};
}

async function entrarComoAdmin(p){
  await p.goto(BASE+'/app.html#panel',{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(900);
  await p.fill('#pin','166774'); await p.click('#entrar'); await p.waitForTimeout(900);
}

(async()=>{
  const browser=await chromium.launch();

  // ═══ 1a. sin la clave del evento no se entra ═══
  console.log('\n─── sin la clave del evento ───');
  {
    const ctx=await browser.newContext({viewport:{width:390,height:844}});
    const p=await ctx.newPage();
    await p.route('**/cdnjs.cloudflare.com/**',r=>r.fulfill({status:200,contentType:'application/javascript',
      body:'window.QRCode=function(n){n.innerHTML="";};window.QRCode.CorrectLevel={M:0};'}));
    const f=fake(); await f.instalar(p);
    await p.goto(BASE+'/app.html#panel',{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(800);
    await p.fill('#pin','4321'); await p.click('#entrar'); await p.waitForTimeout(800);
    await p.goto('about:blank');
    await p.goto(BASE+'/app.html#evento/QUI-7FCE64',{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(1300);
    const r=await p.evaluate(()=>({
      pide:!!document.querySelector('#claveEv'),
      ajustes:!!document.querySelector('[data-sol="pAjustes"]'),
      borrar:!!document.querySelector('#pedirBorrar')}));
    if(!r.pide||r.ajustes) mal('alguien sin la clave del evento entra igual a manejarlo');
    else bien('sin la clave del evento la app la pide y no deja pasar');
    if(r.borrar) mal('se ve el botón de eliminar sin clave');
    await ctx.close();
  }

  // ═══ 1b. con la clave del evento se entra, pero sin borrar ═══
  console.log('\n─── con la clave del evento (organizador común) ───');
  {
    const ctx=await browser.newContext({viewport:{width:390,height:844}});
    const p=await ctx.newPage();
    await ctx.addInitScript(()=>{ try{
      localStorage.setItem('ce:claves',JSON.stringify({'QUI-7FCE64':'ABC123'}));
    }catch(e){} });
    await p.route('**/cdnjs.cloudflare.com/**',r=>r.fulfill({status:200,contentType:'application/javascript',
      body:'window.QRCode=function(n){n.innerHTML="";};window.QRCode.CorrectLevel={M:0};'}));
    const f=fake(); await f.instalar(p);
    await p.goto(BASE+'/app.html#panel',{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(800);
    await p.fill('#pin','4321'); await p.click('#entrar'); await p.waitForTimeout(800);
    await p.goto('about:blank');
    await p.goto(BASE+'/app.html#evento/QUI-7FCE64',{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(1300);
    await p.click('[data-sol="pAjustes"]'); await p.waitForTimeout(400);
    if(!(await p.locator('#pAjustes').count())) mal('con la clave del evento no se puede entrar a ajustes');
    else bien('con la clave del evento entra a manejar la fiesta');
    if(await p.locator('#pedirBorrar').count()) mal('un organizador común ve el botón de eliminar');
    else bien('un organizador común NO ve el botón de eliminar');
    await ctx.close();
  }

  // ═══ 2. con admin: borra de verdad ═══
  console.log('\n─── modo administrador ───');
  {
    const ctx=await browser.newContext({viewport:{width:390,height:844}});
    const p=await ctx.newPage();
    const errs=[]; p.on('pageerror',e=>errs.push(e.message));
    await p.route('**/cdnjs.cloudflare.com/**',r=>r.fulfill({status:200,contentType:'application/javascript',
      body:'window.QRCode=function(n){n.innerHTML="";};window.QRCode.CorrectLevel={M:0};'}));
    const f=fake(); await f.instalar(p);
    await entrarComoAdmin(p);
    await p.goto('about:blank');
    await p.goto(BASE+'/app.html#evento/QUI-7FCE64',{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(1300);
    await p.click('[data-sol="pAjustes"]'); await p.waitForTimeout(500);
    if(!(await p.locator('#pedirBorrar').count())) return mal('el admin no ve el botón'), ctx.close();
    bien('el admin ve la zona de peligro');
    const resumen=await p.locator('.peligro ul').innerText();
    if(!/3/.test(resumen)) mal('no dice cuántos recuerdos se van a borrar: '+resumen.replace(/\n/g,' '));
    else bien('avisa qué se pierde: '+resumen.replace(/\n/g,' · ').trim());

    await p.click('#pedirBorrar'); await p.waitForTimeout(400);
    let dis=await p.evaluate(()=>document.querySelector('#borrarYa').disabled);
    if(!dis) mal('el botón definitivo arranca habilitado sin escribir el código');
    else bien('arranca bloqueado hasta escribir el código');

    await p.fill('#confirmaCod','QUI-0000'); await p.waitForTimeout(250);
    dis=await p.evaluate(()=>document.querySelector('#borrarYa').disabled);
    if(!dis) mal('se habilita con un código equivocado');
    else bien('con el código equivocado sigue bloqueado');

    await p.fill('#confirmaCod','qui-7fce64'); await p.waitForTimeout(250);
    dis=await p.evaluate(()=>document.querySelector('#borrarYa').disabled);
    if(dis) mal('no acepta el código en minúsculas');
    else bien('acepta el código sin importar mayúsculas');

    await p.click('#borrarYa'); await p.waitForTimeout(2200);
    const arch=f.borrado.archivos, tab=f.borrado.tablas;
    if(arch.length!==4) mal(`borró ${arch.length} archivos, esperaba 4 (${arch.join(', ')})`);
    else bien('borró los 4 archivos del depósito, incluida la portada');
    if(!tab.includes('ce_items:QUI-7FCE64')) mal('no borró los recuerdos');
    else bien('borró los recuerdos de la base');
    if(!tab.includes('ce_eventos:QUI-7FCE64')) mal('no borró el evento');
    else bien('borró el evento de la base');
    if(tab.some(t=>t.includes('BOD-AAA111'))) mal('¡TOCÓ OTRO EVENTO!');
    else bien('no tocó el otro evento');
    const quedan=f.db.ce_eventos.map(e=>e.codigo);
    if(quedan.join()!=='BOD-AAA111') mal('quedaron mal los eventos: '+quedan.join());
    else bien('en la lista queda solo el otro evento');
    const donde=await p.evaluate(()=>location.hash);
    if(!/panel/.test(donde)) mal('no vuelve al panel después de borrar (quedó en '+donde+')');
    else bien('vuelve al panel');
    if(errs.length) mal('errores JS: '+errs.join(' | '));
    await ctx.close();
  }

  // ═══ 3. la base se niega a borrar ═══
  console.log('\n─── la base no permite borrar ───');
  {
    const ctx=await browser.newContext({viewport:{width:390,height:844}});
    const p=await ctx.newPage();
    const errs=[]; p.on('pageerror',e=>errs.push(e.message));
    await p.route('**/cdnjs.cloudflare.com/**',r=>r.fulfill({status:200,contentType:'application/javascript',
      body:'window.QRCode=function(n){n.innerHTML="";};window.QRCode.CorrectLevel={M:0};'}));
    const f=fake({niegaBorrado:true}); await f.instalar(p);
    await entrarComoAdmin(p);
    await p.goto('about:blank');
    await p.goto(BASE+'/app.html#evento/QUI-7FCE64',{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(1300);
    await p.click('[data-sol="pAjustes"]'); await p.waitForTimeout(400);
    await p.click('#pedirBorrar'); await p.waitForTimeout(350);
    await p.fill('#confirmaCod','QUI-7FCE64'); await p.waitForTimeout(250);
    await p.click('#borrarYa'); await p.waitForTimeout(2000);
    const msg=await p.locator('#recado').innerText().catch(()=>'');
    const vivo=await p.evaluate(()=>(document.getElementById('app').innerText||'').trim().length>0);
    if(!vivo) mal('la app queda en blanco si la base se niega');
    else bien('la app sigue viva');
    if(/eliminado/i.test(msg)) mal(`DICE QUE BORRÓ Y NO BORRÓ: "${msg.trim()}"`);
    else if(!/no se pudo/i.test(msg)) mal(`no avisa el fallo (dijo: "${msg.trim()}")`);
    else bien('avisa el fallo: "'+msg.trim()+'"');
    if(f.db.ce_eventos.length!==2) mal('se perdió un evento pese al rechazo');
    else bien('no se perdió nada');
    if(errs.length) mal('errores JS: '+errs.join(' | '));
    await ctx.close();
  }

  await browser.close();
  console.log(fallas.length?`\n${fallas.length} FALLAS`:'\n✓ Sin fallas');
})();
