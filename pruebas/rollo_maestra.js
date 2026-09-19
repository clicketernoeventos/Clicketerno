/* ══════════════════════════════════════════════════════════════════
   La clave maestra en el rollo.

   Dos cosas que estaban mal y son la misma:

   1. El rollo NUNCA mandaba la maestra. La base sí la acepta para
      cualquier evento —ce_permitido la chequea antes que la del evento—,
      pero claveDe() solo miraba las guardadas en ese teléfono. Resultado:
      un rollo solo se podía manejar desde el aparato donde se creó. Si se
      pierde o se limpia el navegador, no hay forma de entrar.

   2. Y si igual se escribía la maestra en el campo "Clave" —que es lo
      natural para entrar al rollo de un cliente desde otro teléfono—, se
      guardaba en ce:claves, en localStorage, como si fuera la clave de
      ese evento. Ahí queda para siempre, en el disco, la llave que abre
      TODOS los eventos de todos los clientes.

   La maestra va a sessionStorage y se muere al cerrar la pestaña. Nunca
   al disco.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const BASE='http://127.0.0.1:8890';
const MAESTRA='CLAVE-MAESTRA-DE-PRUEBA';
const SUYA='ABC234';
const COD='BOD-M1';
const fallas=[]; const mal=m=>{fallas.push(m);console.log('  ✗ '+m);};
const bien=m=>console.log('  ✓ '+m);

const ev={codigo:COD,nombre:'Flor y Juan',fecha:'2026-09-01',tipo:'Casamiento',
  tono:'#D9AE72',camara:true,cerrado:false,cupo_fotos:24,revelado:false,revela_en:null};

async function abrir(b){
  const ctx=await b.newContext({viewport:{width:414,height:896}});
  const p=await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.route('**/kuqlqgrwsospwjexodqa.supabase.co/**',r=>{
    const req=r.request(), u=req.url();
    const clave=req.headers()['x-clave']||'';
    /* Como la base: la maestra abre cualquier evento, la del evento solo
       el suyo, y sin clave no se toca nada. */
    const puede = clave===MAESTRA || clave===SUYA;
    if(u.includes('/rpc/ce_quien_soy'))
      return r.fulfill({status:200,contentType:'application/json',
        body:JSON.stringify({llego_la_clave:!!clave, es_maestra:clave===MAESTRA,
                             puede_editar:puede})});
    if(u.includes('/rest/v1/ce_eventos')&&req.method()==='PATCH')
      return puede ? r.fulfill({status:204,body:''})
                   : r.fulfill({status:403,contentType:'application/json',
                       body:JSON.stringify({message:'new row violates row-level security policy'})});
    if(u.includes('/rest/v1/ce_eventos'))
      return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify([ev])});
    if(u.includes('/rpc/ce_evento_publico'))
      return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(ev)});
    if(u.includes('/rpc/ce_camara_stats'))
      return r.fulfill({status:200,contentType:'application/json',
        body:JSON.stringify({invitados:3,fotos:9,revelado:false})});
    return r.fulfill({status:200,contentType:'application/json',body:'[]'});
  });
  return {ctx,p,errs};
}
const guardado=p=>p.evaluate(()=>{
  let l='',s='';
  try{ l=localStorage.getItem('ce:claves')||''; }catch(e){ l='(no pude leer)'; }
  try{ s=sessionStorage.getItem('ce:maestra')||''; }catch(e){}
  return {disco:l, sesion:s};
});

(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});

console.log('\n─── entrar con la clave maestra ───');
{
  const {ctx,p,errs}=await abrir(b);
  await p.goto(BASE+'/rollo.html#clave',{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(1200);
  if(!(await p.locator('#laClave').count())) mal('no hay pantalla para entrar con la clave');
  else{
    bien('hay pantalla para entrar con la clave');
    await p.fill('#codClave',COD);
    await p.fill('#laClave',MAESTRA);
    await p.click('#entrarClave'); await p.waitForTimeout(2200);
    const g=await guardado(p);
    if(g.disco.includes(MAESTRA)) mal('¡LA MAESTRA QUEDÓ ESCRITA EN EL DISCO!: '+g.disco);
    else bien('la maestra no queda en localStorage: '+(g.disco||'(vacío)'));
    if(g.sesion!==MAESTRA) mal('tampoco quedó en sessionStorage: no se puede seguir trabajando');
    else bien('queda en sessionStorage, que se borra al cerrar la pestaña');
    if(!/#ev\//.test(await p.evaluate(()=>location.hash)))
      mal('con la maestra no entró al rollo: '+(await p.evaluate(()=>location.hash)));
    else bien('y entra igual a manejar el rollo');
    /* Lo que faltaba de verdad: que a partir de acá el rollo la MANDE. */
    const manda=await p.evaluate(()=>{
      try{ return typeof claveDe==='function' ? claveDe('CUALQUIER-OTRO') : 'no existe'; }
      catch(e){ return 'error'; }});
    if(manda!==MAESTRA) mal('el rollo no usa la maestra para los demás eventos: '+manda);
    else bien('y la usa para cualquier otro evento, sin tener su clave');
  }
  if(errs.length) mal('errores JS: '+errs.join(' | '));
  await ctx.close();
}

console.log('\n─── y la clave del evento sigue guardándose ───');
{
  const {ctx,p,errs}=await abrir(b);
  await p.goto(BASE+'/rollo.html#clave',{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(1200);
  await p.fill('#codClave',COD);
  await p.fill('#laClave',SUYA);
  await p.click('#entrarClave'); await p.waitForTimeout(2200);
  const g=await guardado(p);
  if(!g.disco.includes(SUYA)) mal('la clave del evento NO se guardó: hay que escribirla cada vez');
  else bien('la clave del evento sí se guarda, como siempre');
  if(g.sesion) mal('una clave común quedó marcada como maestra: '+g.sesion);
  else bien('y no se confunde con la maestra');
  if(errs.length) mal('errores JS: '+errs.join(' | '));
  await ctx.close();
}

console.log('\n─── una clave equivocada no entra ───');
{
  const {ctx,p,errs}=await abrir(b);
  await p.goto(BASE+'/rollo.html#clave',{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(1200);
  await p.fill('#codClave',COD);
  await p.fill('#laClave','NOPE99');
  await p.click('#entrarClave'); await p.waitForTimeout(2200);
  const g=await guardado(p);
  if(/#ev\//.test(await p.evaluate(()=>location.hash))) mal('¡ENTRÓ CON LA CLAVE EQUIVOCADA!');
  else bien('con la clave equivocada no entra');
  if(g.disco.includes('NOPE99')) mal('y encima la guardó');
  else bien('y no la guarda');
  if(errs.length) mal('errores JS: '+errs.join(' | '));
  await ctx.close();
}

await b.close();
console.log(fallas.length?`\n${fallas.length} FALLAS`:'\n✓ Sin fallas');
process.exit(fallas.length?1:0);
})();
