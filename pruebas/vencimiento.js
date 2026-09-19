/* ══════════════════════════════════════════════════════════════════
   Los 90 días: que se avisen y que se ejecuten.

   Dos mitades, y las dos hacen falta. El aviso solo no borra nada —el
   depósito seguiría creciendo para siempre— y el borrado solo, sin aviso,
   se lleva puesto el álbum de un cliente que nunca se bajó su copia.

     1. El organizador ve el aviso en Compartir cuando falta poco, no lo ve
        cuando falta mucho, y cuando ya venció le cambia el tono.
     2. La pantalla de limpieza es del administrador: un organizador común
        no llega, aunque escriba la dirección.
     3. Borrar los vencidos borra LOS VENCIDOS: filas, archivos, y nada de
        lo que todavía vive.
     4. Si la base se niega, no dice "Listo".

   Las fechas se calculan desde HOY, no escritas a mano: una prueba con
   fechas fijas empieza a mentir el mes que viene.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const BASE='http://127.0.0.1:8099';
const MAESTRA='CLAVE-MAESTRA-DE-PRUEBA';
const fallas=[]; const mal=m=>{fallas.push(m);console.log('  ✗ '+m);};
const bien=m=>console.log('  ✓ '+m);

/* Fecha local a N días de hoy, en YYYY-MM-DD. A mano y no con
   toISOString: después de las nueve de la noche en Rosario, toISOString ya
   devuelve la fecha de mañana. */
const enDias=n=>{
  const h=new Date(); h.setDate(h.getDate()+n);
  const dd=x=>String(x).padStart(2,'0');
  return `${h.getFullYear()}-${dd(h.getMonth()+1)}-${dd(h.getDate())}`;
};

const EVS=[
  {codigo:'VEN-A00001',nombre:'Ya vencida',      dias:-5 },
  {codigo:'VEN-A00002',nombre:'Vencida ayer',    dias:-1 },
  {codigo:'PRO-B00001',nombre:'Vence en nueve',  dias: 9 },
  {codigo:'LEJ-C00001',nombre:'Falta un montón', dias:200},
];

function fake({niega=[],relleno=0}={}){
  const db={
    ce_eventos:EVS.map((e,i)=>({codigo:e.codigo,nombre:e.nombre,fecha:enDias(e.dias-90),
      vence:enDias(e.dias),tono:'#D9AE72',moderar:false,cerrado:false,
      portada:null,creado:i+1}))
      /* Los de relleno van PRIMERO en el orden (creado más alto = más
         nuevo), así los vencidos quedan más allá de la fila 1000: es la
         única forma de que se note si alguien pide la tabla de un saque. */
      .concat(Array.from({length:relleno},(_,i)=>({codigo:'REL-'+String(i).padStart(6,'0'),
        nombre:'Relleno '+i,fecha:enDias(-10),vence:enDias(80),tono:'#D9AE72',
        moderar:false,cerrado:false,portada:null,creado:1000+i})))
      /* Una fiesta de las de antes: la columna 'vence' se agregó después,
         así que en la base está en null. La cuenta tiene que salir de la
         fecha, igual en el aviso que en la limpieza. */
      .concat([{codigo:'VIE-000001',nombre:'De las de antes',fecha:enDias(-95),
        vence:null,tono:'#D9AE72',moderar:false,cerrado:false,portada:null,creado:0}]),
    ce_items:EVS.map((e,i)=>({id:'f'+i,codigo:e.codigo,kind:'foto',
      url:`https://x.supabase.co/storage/v1/object/public/ce-medios/${e.codigo}/f${i}.jpg`,
      autor:'Tomás',texto:'',estado:'aprobado',ts:i})),
  };
  const borrado={tablas:[],archivos:[]};
  return {db,borrado,instalar:async p=>{
    await p.route('**/cdnjs.cloudflare.com/**',r=>r.fulfill({status:200,
      contentType:'application/javascript',
      body:'window.QRCode=function(n){n.innerHTML="";};window.QRCode.CorrectLevel={M:0};'}));
    await p.route('**/storage/v1/object/list/**',r=>{
      const pre=(JSON.parse(r.request().postData()||'{}').prefix||'').replace(/\/$/,'');
      r.fulfill({status:200,contentType:'application/json',
        body:JSON.stringify(pre?[{name:'f.jpg'}]:[])});
    });
    await p.route('**/storage/v1/object/ce-medios**',r=>{
      const req=r.request();
      if(req.method()==='DELETE'){
        const pres=JSON.parse(req.postData()||'{}').prefixes||[];
        if(pres.some(x=>niega.some(c=>String(x).startsWith(c))))
          return r.fulfill({status:403,contentType:'application/json',
            body:JSON.stringify({message:'new row violates row-level security policy'})});
        borrado.archivos.push(...pres);
        return r.fulfill({status:200,contentType:'application/json',body:'[]'});
      }
      r.fulfill({status:200,contentType:'application/json',body:'{}'});
    });
    await p.route('**/storage/v1/object/ce-rollos**',r=>r.fulfill({status:200,
      contentType:'application/json',body:'[]'}));
    await p.route('**/rest/v1/**',r=>{
      const req=r.request(), u=req.url();
      if(u.includes('/rpc/ce_quien_soy')){
        const clave=req.headers()['x-clave']||'';
        return r.fulfill({status:200,contentType:'application/json',
          body:JSON.stringify({llego_la_clave:!!clave,es_maestra:clave===MAESTRA,
                               puede_editar:!!clave})});
      }
      if(u.includes('/rpc/ce_rutas_rollo'))
        return r.fulfill({status:200,contentType:'application/json',body:'[]'});
      if(u.includes('/rpc/'))
        return r.fulfill({status:404,contentType:'application/json',
          body:JSON.stringify({message:'function does not exist'})});
      const tabla=u.includes('ce_items')?'ce_items':'ce_eventos';
      const cod=(u.match(/codigo=eq\.([^&]+)/)||[])[1];
      const quien=cod?decodeURIComponent(cod):'';
      if(req.method()==='DELETE'){
        if(niega.includes(quien)) return r.fulfill({status:403,
          contentType:'application/json',
          body:JSON.stringify({message:'new row violates row-level security policy'})});
        borrado.tablas.push(tabla+':'+quien);
        db[tabla]=db[tabla].filter(f=>f.codigo!==quien);
        return r.fulfill({status:204,body:''});
      }
      let out=db[tabla].slice();
      if(quien) out=out.filter(f=>f.codigo===quien);
      /* sin clave no se ve nada, igual que la base blindada */
      if(!req.headers()['x-clave']) out=[];
      /* como PostgREST: ordena, y CORTA EN 1000 aunque nadie se lo pida.
         Ese corte silencioso es justo lo que hay que poder ver desde acá. */
      if(tabla==='ce_eventos') out.sort((a,b)=>(b.creado||0)-(a.creado||0)
        || String(a.codigo).localeCompare(String(b.codigo)));
      const off=Number((u.match(/[?&]offset=(\d+)/)||[])[1]||0);
      const lim=Math.min(Number((u.match(/[?&]limit=(\d+)/)||[])[1]||1000),1000);
      out=out.slice(off, off+lim);
      r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(out)});
    });
  }};
}

async function abrir(browser,{admin=false,claves=null}={}){
  const ctx=await browser.newContext({viewport:{width:390,height:844}});
  await ctx.addInitScript(([admin,claves,maestra])=>{
    try{
      if(claves) localStorage.setItem('ce:claves',JSON.stringify(claves));
      if(admin){ sessionStorage.setItem('ce:admin','1');
                 sessionStorage.setItem('ce:maestra',maestra);
                 sessionStorage.setItem('ce:pinOK','1'); }
    }catch(e){}
  },[admin,claves,MAESTRA]);
  const p=await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  const f=fake.ultimo; await f.instalar(p);
  return {ctx,p,errs,f};
}

const texto=async(p,sel)=>((await p.locator(sel).first().innerText().catch(()=>''))||'')
  .replace(/\s+/g,' ').trim().toLowerCase();

(async()=>{
  const browser=await chromium.launch();

  // ═══ 1. el aviso en el panel del organizador ═══
  console.log('\n─── el aviso de vencimiento ───');
  for(const caso of [
    {cod:'LEJ-C00001', hay:false, dice:null,          que:'faltan 200 días: no molesta con el aviso'},
    {cod:'PRO-B00001', hay:true,  dice:/9 d[ií]as/,   que:'a nueve días avisa, y dice cuántos quedan'},
    {cod:'VEN-A00001', hay:true,  dice:/ya venci[oó]/,que:'vencido hace cinco días lo dice con todas las letras'},
    {cod:'VIE-000001', hay:true,  dice:/ya venci[oó]/,que:'una fiesta sin "vence" guardado igual avisa, contando desde la fecha'},
  ]){
    fake.ultimo=fake();
    const {ctx,p,errs}=await abrir(browser,{claves:{[caso.cod]:'ABC123'}});
    await p.goto(BASE+'/muro.html#evento/'+caso.cod,{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(1400);
    const n=await p.locator('.aviso-vence').count();
    if(!!n!==caso.hay){
      mal(`${caso.que} — pero el aviso ${n?'está':'no está'}`);
    }else if(caso.dice){
      const t=await texto(p,'.aviso-vence');
      if(!caso.dice.test(t)) mal(`${caso.que} — dice "${t}"`);
      else bien(caso.que);
      /* y tiene que llevar a bajarse el álbum: avisar sin dar la salida no
         sirve de nada */
      if(!(await p.locator('.aviso-vence [data-ir^="album/"]').count()))
        mal('el aviso no ofrece descargar el álbum');
    }else bien(caso.que);
    if(errs.length) mal('errores JS: '+errs.join(' | '));
    await ctx.close();
  }

  // ═══ 2. la limpieza es del administrador ═══
  console.log('\n─── quién entra a la limpieza ───');
  {
    fake.ultimo=fake();
    const {ctx,p,errs}=await abrir(browser,{claves:{'VEN-A00001':'ABC123'}});
    await p.goto(BASE+'/muro.html#panel',{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(900);
    await p.fill('#pin','4321'); await p.click('#entrar'); await p.waitForTimeout(900);
    if(await p.locator('[data-ir="limpieza"]').count())
      mal('un organizador común ve el botón de limpieza');
    else bien('un organizador común no ve el botón de limpieza');
    await p.goto(BASE+'/muro.html#limpieza',{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(1200);
    if(await p.locator('.fila-vence').count())
      mal('¡ENTRA A LA LIMPIEZA SIN SER ADMINISTRADOR!');
    else bien('escribiendo la dirección a mano tampoco entra');
    if(errs.length) mal('errores JS: '+errs.join(' | '));
    await ctx.close();
  }

  // ═══ 3. el administrador ve qué vence y qué venció ═══
  console.log('\n─── la lista del administrador ───');
  {
    fake.ultimo=fake();
    const {ctx,p,errs}=await abrir(browser,{admin:true});
    await p.goto(BASE+'/muro.html#panel',{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(1300);
    const boton=await texto(p,'[data-ir="limpieza"]');
    if(!/3 vencidos/.test(boton)) mal(`el panel no avisa cuántos hay vencidos (dice "${boton}")`);
    else bien('desde el panel ya se ve que hay 3 vencidos');
    await p.click('[data-ir="limpieza"]'); await p.waitForTimeout(1300);
    const grupos=await p.$$eval('.seccion-a',ns=>ns.map(n=>
      (n.querySelector('h2').textContent+':'+(n.querySelector('span')||{}).textContent).toLowerCase()));
    const esperado='ya vencidos:3,vencen pronto:1,el resto:1';
    if(grupos.join(',')!==esperado) mal(`los grupos dan "${grupos.join(', ')}", esperaba "${esperado}"`);
    else bien('los agrupa bien: 3 vencidos, 1 por vencer, 1 tranquilo');
    const soloVencidos=await p.$$eval('.peligro [data-borra]',ns=>ns.map(n=>n.dataset.borra).sort());
    if(soloVencidos.join()!=='VEN-A00001,VEN-A00002,VIE-000001')
      mal('el botón de borrar no está solo en los vencidos: '+soloVencidos.join());
    else bien('solo los vencidos tienen botón de borrar, la vieja incluida');
    if(errs.length) mal('errores JS: '+errs.join(' | '));
    await ctx.close();
  }

  // ═══ 4. borrar los vencidos ═══
  console.log('\n─── borrar los vencidos ───');
  {
    fake.ultimo=fake();
    const {ctx,p,errs,f}=await abrir(browser,{admin:true});
    await p.goto(BASE+'/muro.html#limpieza',{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(1400);
    await p.click('#pedirTodos'); await p.waitForTimeout(400);
    if(!(await p.evaluate(()=>document.querySelector('#todosYa').disabled)))
      mal('el botón definitivo arranca habilitado sin escribir nada');
    else bien('arranca bloqueado hasta escribir BORRAR');
    await p.fill('#confBorrar','borra'); await p.waitForTimeout(250);
    if(!(await p.evaluate(()=>document.querySelector('#todosYa').disabled)))
      mal('se habilita con una palabra que no es');
    else bien('con la palabra equivocada sigue bloqueado');
    await p.fill('#confBorrar','borrar'); await p.waitForTimeout(250);
    if(await p.evaluate(()=>document.querySelector('#todosYa').disabled))
      mal('no acepta la palabra en minúsculas');
    else bien('acepta la palabra sin importar mayúsculas');
    await p.click('#todosYa'); await p.waitForTimeout(3500);
    const quedan=f.db.ce_eventos.map(e=>e.codigo).sort();
    if(quedan.join()!=='LEJ-C00001,PRO-B00001')
      mal('quedaron mal los eventos: '+quedan.join()+' (esperaba LEJ-C00001, PRO-B00001)');
    else bien('borró los tres vencidos y no tocó los otros dos');
    if(!f.borrado.tablas.includes('ce_items:VEN-A00001')
       ||!f.borrado.tablas.includes('ce_items:VEN-A00002'))
      mal('dejó los recuerdos de un evento borrado en la base');
    else bien('borró también sus recuerdos');
    if(!f.borrado.archivos.length) mal('no borró ningún archivo del depósito');
    else if(f.borrado.archivos.some(a=>/LEJ-|PRO-/.test(a)))
      mal('¡BORRÓ ARCHIVOS DE UN EVENTO QUE NO VENCIÓ!: '+f.borrado.archivos.join(', '));
    else bien('borró sus archivos y solo los suyos: '+f.borrado.archivos.join(', '));
    const msg=await texto(p,'#recado');
    if(!/3 eventos eliminados/.test(msg)) mal(`el resumen no dice qué pasó: "${msg}"`);
    else bien('avisa: "'+msg+'"');
    const lista=await texto(p,'.wrap-inv');
    if(/ya vencida|vencida ayer/.test(lista)) mal('la lista sigue mostrando los borrados');
    else bien('la lista se vuelve a dibujar sin ellos');
    if(errs.length) mal('errores JS: '+errs.join(' | '));
    await ctx.close();
  }

  // ═══ 5. si la base se niega, no dice "Listo" ═══
  console.log('\n─── la base se niega con uno de los tres ───');
  {
    fake.ultimo=fake({niega:['VEN-A00002']});
    const {ctx,p,errs,f}=await abrir(browser,{admin:true});
    await p.goto(BASE+'/muro.html#limpieza',{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(1400);
    await p.click('#pedirTodos'); await p.waitForTimeout(350);
    await p.fill('#confBorrar','BORRAR'); await p.waitForTimeout(250);
    await p.click('#todosYa'); await p.waitForTimeout(3500);
    const msg=await texto(p,'#recado');
    if(/^listo/.test(msg)) mal(`DICE QUE BORRÓ TODO Y NO BORRÓ: "${msg}"`);
    else if(!/2 de 3/.test(msg)||!/ven-a00002/.test(msg))
      mal(`no dice cuál quedó sin borrar: "${msg}"`);
    else bien('avisa cuántos pudo y cuál no: "'+msg+'"');
    if(f.db.ce_eventos.some(e=>e.codigo==='VEN-A00001'))
      mal('el rechazo de uno cortó la tanda y el otro quedó sin borrar');
    else bien('el rechazo de uno no impide borrar el otro');
    const vivo=await p.evaluate(()=>(document.getElementById('app').innerText||'').trim().length>0);
    if(!vivo) mal('la app queda en blanco cuando la base se niega');
    else bien('la app sigue viva');
    if(errs.length) mal('errores JS: '+errs.join(' | '));
    await ctx.close();
  }

  // ═══ 6. con más de mil eventos, los vencidos no se pierden ═══
  console.log('\n─── 1205 eventos: el corte de las mil filas ───');
  {
    fake.ultimo=fake({relleno:1200});
    const {ctx,p,errs}=await abrir(browser,{admin:true});
    await p.goto(BASE+'/muro.html#limpieza',{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(3500);
    const cuantos=await p.$$eval('[data-borra]',ns=>ns.map(n=>n.dataset.borra).sort());
    if(cuantos.join()!=='VEN-A00001,VEN-A00002,VIE-000001')
      mal(`con 1205 eventos la limpieza encuentra ${cuantos.length} vencidos, `
         +`esperaba los 3 (${cuantos.join(', ')||'ninguno'}) — se está comiendo el corte de las mil filas`);
    else bien('pide de a tandas: encuentra los 3 vencidos aunque estén después de la fila mil');
    if(errs.length) mal('errores JS: '+errs.join(' | '));
    await ctx.close();
  }

  await browser.close();
  console.log(fallas.length?`\n${fallas.length} FALLAS`:'\n✓ Sin fallas');
  process.exit(fallas.length?1:0);
})();
