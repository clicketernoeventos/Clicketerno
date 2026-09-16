const { chromium } = require('playwright');
const B='http://127.0.0.1:8099/pia/nueva/';
/* El sobre tiene una animación de flote infinita, así que Playwright nunca
   lo ve "estable" y se queda esperando. Un dedo de verdad lo toca igual:
   por eso el click va forzado. No es un problema del producto. */
const fallas=[]; const mal=m=>{fallas.push(m);console.log('  ✗ '+m);};
const bien=m=>console.log('  ✓ '+m);

async function abrir(browser,{rutaApps=null,reduce=false}={}){
  const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,
    reducedMotion:reduce?'reduce':'no-preference'});
  const p=await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.route('**/script.google.com/**', rutaApps || (r=>r.fulfill({status:200,
    contentType:'application/json',body:JSON.stringify({invitados:[]})})));
  await p.goto(B,{waitUntil:'load'});
  await p.waitForTimeout(900);
  return {ctx,p,errs};
}

(async()=>{
  const browser=await chromium.launch();

  console.log('\n─── el sobre y la entrada ───');
  {
    const {ctx,p,errs}=await abrir(browser);
    if(!(await p.locator('#tapa').isVisible())) mal('no se ve el sobre');
    else bien('arranca con el sobre cerrado');
    const antes=await p.evaluate(()=>getComputedStyle(document.querySelector('#papel')).opacity);
    if(antes!=='0') mal('la invitación se ve antes de abrir el sobre');
    else bien('lo de adentro está tapado hasta abrir');
    await p.click('#tapa',{force:true}); await p.waitForTimeout(2600);
    const desp=await p.evaluate(()=>({
      op:getComputedStyle(document.querySelector('#papel')).opacity,
      sobre:!!document.querySelector('#sobre'),
      letras:[...document.querySelectorAll('#letras .l')].map(l=>l.textContent).join(''),
      musica:!!document.querySelector('#musica.ver')}));
    if(desp.op!=='1'||desp.sobre) mal('el sobre no termina de abrirse');
    else bien('el sobre se abre y desaparece');
    if(desp.letras!=='Pia') mal('el nombre no se arma: '+desp.letras);
    else bien('el nombre se escribe letra por letra');
    if(!desp.musica) mal('no aparece el botón de música');
    else bien('aparece el botón de música');
    if(errs.length) mal('errores JS: '+errs[0]);
    await ctx.close();
  }

  console.log('\n─── que no mienta al confirmar ───');
  {
    // la planilla NO devuelve al invitado: tiene que avisar, no decir gracias
    const {ctx,p,errs}=await abrir(browser,{rutaApps:r=>{
      if(r.request().method()==='POST') return r.fulfill({status:200,body:''});
      return r.fulfill({status:200,contentType:'application/json',
        body:JSON.stringify({invitados:[]})});
    }});
    await p.click('#tapa',{force:true}); await p.waitForTimeout(1500);
    await p.fill('[name="persona1_nombre"]','Delfina');
    await p.fill('[name="persona1_apellido"]','Sosa');
    await p.click('#enviar'); await p.waitForTimeout(2200);
    const r=await p.evaluate(()=>({
      gracias:!!document.querySelector('#gracias.ver'),
      estado:(document.querySelector('#estado')||{}).textContent||'',
      boton:(document.querySelector('#enviar')||{}).disabled}));
    if(r.gracias) mal('dice "gracias" aunque la confirmación no llegó');
    else bien('no dice gracias si no llegó');
    if(!/no nos llegó/i.test(r.estado)) mal('no explica qué pasó: "'+r.estado.trim()+'"');
    else bien('avisa: "'+r.estado.trim().slice(0,58)+'…"');
    if(r.boton) mal('el botón queda trabado y no se puede reintentar');
    else bien('se puede reintentar');
    if(errs.length) mal('errores JS: '+errs[0]);
    await ctx.close();
  }

  console.log('\n─── cuando sí llega ───');
  {
    const {ctx,p,errs}=await abrir(browser,{rutaApps:r=>{
      if(r.request().method()==='POST') return r.fulfill({status:200,body:''});
      return r.fulfill({status:200,contentType:'application/json',
        body:JSON.stringify({invitados:[{'Persona 1 - Nombre':'Delfina'}]})});
    }});
    await p.click('#tapa',{force:true}); await p.waitForTimeout(1500);
    await p.fill('[name="persona1_nombre"]','Delfina');
    await p.fill('[name="persona1_apellido"]','Sosa');
    await p.click('#enviar'); await p.waitForTimeout(2200);
    if(!(await p.locator('#gracias.ver').count())) mal('no muestra el agradecimiento');
    else bien('agradece solo cuando de verdad llegó');
    if(errs.length) mal('errores JS: '+errs[0]);
    await ctx.close();
  }

  console.log('\n─── el formulario manda lo mismo que antes ───');
  {
    let enviado=null;
    const {ctx,p,errs}=await abrir(browser,{rutaApps:r=>{
      if(r.request().method()==='POST'){ enviado=r.request().postData()||''; return r.fulfill({status:200,body:''}); }
      return r.fulfill({status:200,contentType:'application/json',
        body:JSON.stringify({invitados:[{'Persona 1 - Nombre':'Ana'}]})});
    }});
    await p.click('#tapa',{force:true}); await p.waitForTimeout(1200);
    await p.selectOption('#personas','3'); await p.waitForTimeout(400);
    for(const i of [1,2,3]){
      await p.fill(`[name="persona${i}_nombre"]`, i===1?'Ana':'Otro'+i);
      await p.fill(`[name="persona${i}_apellido"]`,'Perez');
    }
    await p.selectOption('[name="persona2_alimentacion"]','Otro'); await p.waitForTimeout(300);
    const otroVisible=await p.locator('[data-otro="2"]').isVisible();
    if(!otroVisible) mal('elegir "Otro" no abre el campo para escribirlo');
    else bien('"Otro" abre el campo de texto');
    await p.fill('[data-otro="2"]','sin sal');
    await p.fill('[name="cancion"]','Despacito');
    await p.fill('[name="mensaje"]','Felicidades');
    await p.click('#enviar'); await p.waitForTimeout(2200);
    const esperados=['personas','persona1_nombre','persona1_apellido','persona1_alimentacion',
      'persona1_alimentacion_otro','persona2_nombre','persona3_nombre','confirma','cancion','mensaje'];
    const faltan=esperados.filter(n=>!(enviado||'').includes('name="'+n+'"'));
    if(faltan.length) mal('faltan campos en el envío: '+faltan.join(', '));
    else bien('manda los '+esperados.length+' campos con los nombres de siempre');
    if(!/name="confirma"[\s\S]{0,40}Confirmo/.test(enviado||''))
      mal('el valor de "confirma" cambió');
    else bien('"Confirmo" se manda igual que antes');
    if(errs.length) mal('errores JS: '+errs[0]);
    await ctx.close();
  }

  console.log('\n─── que entre en la pantalla ───');
  for(const [an,al] of [[320,568],[390,844],[430,932],[768,1024]]){
    const ctx=await browser.newContext({viewport:{width:an,height:al}});
    const p=await ctx.newPage();
    await p.route('**/script.google.com/**',r=>r.fulfill({status:200,
      contentType:'application/json',body:JSON.stringify({invitados:[]})}));
    await p.goto(B,{waitUntil:'load'});
    await p.click('#tapa',{force:true}); await p.waitForTimeout(1600);
    await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
    await p.waitForTimeout(700);
    const d=await p.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
    if(d) mal(`se va de ancho en ${an}x${al}`);
    else bien(`entra en ${an}x${al}`);
    await ctx.close();
  }

  console.log('\n─── quien pidió menos movimiento ───');
  {
    const {ctx,p,errs}=await abrir(browser,{reduce:true});
    await p.click('#tapa',{force:true}); await p.waitForTimeout(1200);
    const r=await p.evaluate(()=>{
      const l=document.querySelector('#letras .l'), s=document.querySelector('.sube');
      return {letra:getComputedStyle(l).opacity, bloque:getComputedStyle(s).opacity};
    });
    if(r.letra!=='1'||r.bloque!=='1') mal('con movimiento reducido queda contenido invisible');
    else bien('todo se ve igual, sin animaciones');
    if(errs.length) mal('errores JS: '+errs[0]);
    await ctx.close();
  }

  await browser.close();
  console.log(fallas.length?`\n${fallas.length} FALLAS`:'\n✓ Sin fallas');
  process.exit(fallas.length?1:0);
})();
