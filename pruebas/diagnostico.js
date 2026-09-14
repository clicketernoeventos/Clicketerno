/* El autodiagnóstico probado contra la base falsa: tiene que detectar lo que
   falta, y tiene que limpiar el evento de prueba siempre. */
const { chromium } = require('playwright');
const { crearFake } = require('./fakesb');
const BASE='http://127.0.0.1:8099';
const fallas=[]; const mal=m=>{fallas.push(m);console.log('  ✗ '+m);};
const bien=m=>console.log('  ✓ '+m);

async function abrir(browser,{sinClaves=false,admin=false}={}){
  const ctx=await browser.newContext({viewport:{width:390,height:844}});
  const p=await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.route('**/cdnjs.cloudflare.com/**',r=>r.fulfill({status:200,contentType:'application/javascript',
    body:'window.QRCode=function(n){n.innerHTML="";};window.QRCode.CorrectLevel={M:0};'}));
  const fake=crearFake('ok'); await fake.instalar(p);
  if(sinClaves) await p.route('**/rest/v1/rpc/ce_quien_soy',r=>r.fulfill({status:404,
    contentType:'application/json',
    body:JSON.stringify({code:'PGRST202',message:'Could not find the function public.ce_quien_soy'})}));
  if(admin) await ctx.addInitScript(()=>{ try{
    sessionStorage.setItem('ce:admin','1'); sessionStorage.setItem('ce:maestra','166774');
    sessionStorage.setItem('ce:pinOK','1'); }catch(e){} });
  return {ctx,p,errs,fake};
}
/* innerText devuelve el texto YA transformado por el CSS: media app está en
   mayúsculas, así que comparar tal cual da falsos negativos. Siempre así. */
const texto=async p=>(await p.evaluate(()=>document.getElementById('app').innerText||'')).toLowerCase();
const dice=(t,frase)=>t.includes(frase.toLowerCase());

(async()=>{
  const browser=await chromium.launch();

  console.log('\n─── la revisión de arranque ───');
  {
    const {ctx,p,errs,fake}=await abrir(browser);
    await p.goto(BASE+'/muro.html#diagnostico',{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(2500);
    const t=await texto(p);
    for(const [q,frase] of [
      ['informa si la base contesta','la base contesta'],
      ['revisa que la clave pegada sea la pública, no la de servicio','clave de la página es la pública'],
      ['comprueba que la clave llegue a la base','la clave viaja entera hasta la base'],
      ['cierra con un resumen','resumen'],
    ]) dice(t,frase)?bien(q):mal('no '+q);
    if(errs.length) mal('errores JS: '+errs[0]);
    await ctx.close();
  }

  console.log('\n─── con el SQL de claves sin correr ───');
  {
    const {ctx,p,errs,fake}=await abrir(browser,{sinClaves:true});
    await p.goto(BASE+'/muro.html#diagnostico',{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(2500);
    const t=await texto(p);
    dice(t,'✗ el sistema de claves está instalado')
      ? bien('detecta que falta el sistema de claves')
      : mal('no detecta que falta el sistema de claves');
    dice(t,'falta correr sql/claves.sql')
      ? bien('dice exactamente qué hay que correr')
      : mal('no dice qué hay que correr');
    if(errs.length) mal('errores JS: '+errs[0]);
    await ctx.close();
  }

  console.log('\n─── la prueba de fondo ───');
  {
    const {ctx,p,errs,fake}=await abrir(browser,{admin:true});
    await p.goto(BASE+'/muro.html#diagnostico',{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(2200);
    await p.click('#probarTodo');
    await p.waitForTimeout(6000);
    const t=await texto(p);
    for(const [q,frase] of [
      ['exige clave para crear','✓ sin clave no se puede crear'],
      ['comprueba que el invitado no se autoaprueba','✓ un invitado no puede autoaprobarse'],
      ['comprueba que sin clave no se renombra','✓ sin clave no se puede renombrar'],
      ['comprueba que sin clave no se borra','✓ sin clave no se puede borrar'],
      ['comprueba que la clave vieja deja de servir','✓ la clave vieja deja de servir'],
      ['comprueba la clave de administrador','✓ la clave de administrador abre'],
      ['deja todo limpio','✓ el evento de prueba quedó borrado'],
    ]){
      if(!dice(t,frase)) mal('no '+q+'\n     '+t.split('\n').filter(l=>l.includes('✗')).join('\n     '));
      else bien(q);
    }
    // y de verdad no quedó nada en la base
    const quedan=fake.db.ce_eventos.filter(e=>/^PRUEBA-/.test(e.codigo));
    if(quedan.length) mal('quedó un evento de prueba colgado: '+quedan.map(e=>e.codigo).join(', '));
    else bien('no deja basura en la base');
    const items=fake.db.ce_items.length;
    if(items) mal(`quedaron ${items} recuerdos de prueba sin borrar`);
    else bien('tampoco deja recuerdos sueltos');
    if(errs.length) mal('errores JS: '+errs[0]);
    await ctx.close();
  }

  console.log('\n─── la prueba de fondo cuando la base se cae a la mitad ───');
  {
    const {ctx,p,errs,fake}=await abrir(browser,{admin:true});
    await p.goto(BASE+'/muro.html#diagnostico',{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(2200);
    // la base se cae a partir del quinto pedido: siempre en el mismo punto
    let n=0;
    await p.route('**/rest/v1/ce_eventos**',r=>(++n>4)?r.abort('failed'):r.fallback());
    await p.click('#probarTodo');
    await p.waitForTimeout(9000);
    const t=await texto(p);
    if(!t.trim().length) mal('la pantalla queda en blanco si la base se cae a la mitad');
    else bien('la pantalla sobrevive');
    if(!(dice(t,'se cortó')||dice(t,'fallaron'))) mal('no avisa que se cortó');
    else bien('avisa que se cortó y qué pasó');
    const btn=(await p.locator('#probarTodo').innerText().catch(()=>'')).toLowerCase();
    const trabado=await p.evaluate(()=>document.querySelector('#probarTodo').disabled);
    if(trabado||!btn.includes('probar')) mal(`el botón queda trabado ("${btn}")`);
    else bien('el botón queda listo para reintentar');
    if(!dice(t,'borralo a mano')&&!dice(t,'✓ el evento de prueba quedó borrado'))
      mal('no dice si el evento de prueba quedó o no');
    else bien('dice si el evento de prueba quedó colgado');
    await ctx.close();
  }

  await browser.close();
  console.log(fallas.length?`\n${fallas.length} FALLAS`:'\n✓ Sin fallas');
})();
