/* ═══════════════════════════════════════════════════════════════
   EL ROLLO EN CONDICIONES FEAS
   Las otras pruebas miran que el camino feliz funcione. Esta mira
   qué pasa cuando algo sale mal: la base devuelve datos raros, el
   salón se queda sin señal, el organizador cambia de opinión a
   mitad de camino, el teléfono no deja prender la cámara.

   Todo corre con el reloj en Argentina, que es donde se usa: la
   zona fue la que rompió el rollo la primera vez.
   ═══════════════════════════════════════════════════════════════ */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const SUPA='**/kuqlqgrwsospwjexodqa.supabase.co/**';
const ZONA='America/Argentina/Buenos_Aires';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAKklEQVR4nO3BAQ0AAADCoPdPbQ43oAAAAAAAAAAAAAAAAAAAAAAAAADvBnI0AAHU9wLtAAAAAElFTkSuQmCC','base64');

const R=[]; let fallas=0;
const ok=(t,c,d='')=>{ if(!c) fallas++; R.push((c?'  ✓ ':'  ✗ ')+t+(c||!d?'':'   ['+d+']')); };
const titulo=t=>R.push('\n── '+t+' ──');

async function nuevaPagina(browser, opciones={}){
  const ctx = await browser.newContext({
    viewport:{width:420,height:880}, timezoneId:ZONA, locale:'es-AR',
    permissions: opciones.sinCamara?[]:['camera']
  });
  const page = await ctx.newPage();
  const errores=[];
  page.on('pageerror', e=>errores.push('PAGEERROR: '+e.message));
  /* "Failed to load resource" no es un error del rollo: acá lo provocamos
     nosotros a propósito (cortamos la señal, rechazamos una clave). Lo que
     no se perdona es un error de JavaScript. */
  const ruido=t=>/Failed to load resource|ERR_TUNNEL|ERR_NAME_NOT_RESOLVED|ERR_INTERNET|ERR_ABORTED|cdnjs|fonts\.googleapis|favicon|marca\.webp/i.test(t);
  page.on('console', m=>{ if(m.type()==='error' && !ruido(m.text())) errores.push('CONSOLE: '+m.text()); });
  return { page, ctx, errores };
}

/* Un Supabase de mentira que se puede torcer a gusto desde cada prueba. */
function montar(page, cfg){
  const c = Object.assign({
    evento:{codigo:'TEST-1', nombre:'Fiesta', tono:'#D9AE72', camara:true, cerrado:false, cupo_fotos:3},
    estado:{token:'tok', nombre:'Ana', disparos:0, cupo:3, camara:true, cerrado:false, revelado:false, revela_en:null},
    album:{revelado:true, mias:[], todas:[], total_fotos:0, total_invitados:0},
    sinFirmar:[],       // rutas que el depósito se niega a firmar
    caidaEventos:0,     // cuántas veces falla el pedido del evento antes de andar
    caidaMiRollo:0,
    cuenta:{}
  }, cfg||{});
  page.route(SUPA, async route=>{
    const url=route.request().url(), met=route.request().method();
    const cuerpo=()=>{ try{ return JSON.parse(route.request().postData()||'{}'); }catch(e){ return {}; } };
    const json=o=>route.fulfill({status:200, contentType:'application/json', body:JSON.stringify(o)});
    const error=(s,m)=>route.fulfill({status:s, contentType:'application/json', body:JSON.stringify({message:m})});

    if(url.includes('/rest/v1/ce_eventos')){
      c.cuenta.eventos=(c.cuenta.eventos||0)+1;
      if(met==='PATCH'){
        const cl=route.request().headers()['x-clave']||'';
        if(c.claveBuena && cl!==c.claveBuena) return error(403,'new row violates row-level security policy');
        Object.assign(c.evento, cuerpo()); return route.fulfill({status:204, body:''});
      }
      if(met==='POST'){ return route.fulfill({status:201, body:''}); }
      if(c.caidaEventos-- > 0) return route.abort('failed');
      return json(c.evento?[c.evento]:[]);
    }
    if(url.includes('/rpc/ce_mi_rollo')){
      c.cuenta.mi_rollo=(c.cuenta.mi_rollo||0)+1;
      if(c.caidaMiRollo-- > 0) return route.abort('failed');
      return json(typeof c.estado==='function'?c.estado(c.cuenta.mi_rollo):c.estado);
    }
    if(url.includes('/rpc/ce_tomar_foto')){
      c.cuenta.tomar=(c.cuenta.tomar||0)+1;
      const st=c.estado;
      if(st.disparos>=st.cupo) return error(400,'Ya usaste todas tus fotos');
      st.disparos++; return json({restantes: st.cupo-st.disparos});
    }
    if(url.includes('/rpc/ce_devolver_foto')){ c.estado.disparos=Math.max(0,c.estado.disparos-1); return json({devueltas:1}); }
    if(url.includes('/rpc/ce_album_de')){
      c.cuenta.album=(c.cuenta.album||0)+1;
      return json(typeof c.album==='function'?c.album(c.cuenta.album):c.album);
    }
    if(url.includes('/rpc/ce_camara_stats')) return json({fotos:0, invitados:0});
    /* bajar TODAS pide de a tandas: acá servimos la tanda que toque */
    if(url.includes('/rpc/ce_album_pagina')){
      const b=cuerpo(), lista=(typeof c.album==='function'?c.album(1):c.album).todas||[];
      c.cuenta.tandas=(c.cuenta.tandas||[]); c.cuenta.tandas.push(b.p_desde);
      return json(lista.slice(b.p_desde||0, (b.p_desde||0)+(b.p_cuanto||500)));
    }
    if(url.includes('/storage/v1/object/sign/ce-rollos') && met==='POST' && !url.includes('.jpg')){
      const b=cuerpo();
      return json((b.paths||[]).filter(p=>!c.sinFirmar.includes(p))
        .map(p=>({path:p, signedURL:'/object/sign/ce-rollos/'+p+'?token=x'})));
    }
    if(url.includes('/storage/v1/object/sign/ce-rollos/'))
      return route.fulfill({status:200, contentType:'image/png', body:PNG});
    if(url.includes('/storage/v1/object/ce-rollos/')){
      c.cuenta.subidas=(c.cuenta.subidas||0)+1;
      return c.fallaSubida?route.fulfill({status:500, body:'boom'}):json({});
    }
    return route.fulfill({status:404, body:'no mockeado'});
  });
  return c;
}

const servirZip=require('./jszip_local.js').servir;

const conRollo=(page,cod='TEST-1',v={token:'tok',nombre:'Ana'})=>
  page.addInitScript(([k,val])=>localStorage.setItem(k,val), ['ce:rollo:'+cod, JSON.stringify(v)]);

const texto=page=>page.evaluate(()=>document.body.innerText.replace(/\s+/g,' ').trim());

const corrida=async(nombre,fn)=>{
  titulo(nombre);
  try{ await fn(); }
  catch(e){ fallas++; R.push('  ✗ la prueba se cortó: '+String(e.message||e).split('\n')[0]); }
};

(async()=>{
/* Sin el sitio servido en el 8890 no hay prueba que valga, y el error que
   tira Playwright (CONNECTION_REFUSED, una vez por prueba) no lo dice. */
try{ await fetch('http://127.0.0.1:8890/rollo.html'); }
catch(e){
  console.log('\nNo hay nada sirviendo el sitio en el puerto 8890.');
  console.log('Levantalo primero:  npx http-server -p 8890 -c-1 &\n');
  process.exit(2);
}

const browser = await chromium.launch({
  executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']
});

/* ══ 1. la columna del cupo vacía ══
   Era el mismo síntoma que el error de zona: el invitado entraba y en vez
   de la cámara le decía que ya había sacado todas sus fotos. */
await corrida('el cupo viene vacío de la base', async()=>{
    const {page,errores}=await nuevaPagina(browser);
    montar(page,{estado:{token:'tok',nombre:'Ana',disparos:0,cupo:null,camara:true,cerrado:false,revelado:false,revela_en:null}});
    await conRollo(page);
    await page.goto('http://127.0.0.1:8890/rollo.html?e=TEST-1');
    await page.waitForTimeout(1200);
    const t=await texto(page);
    ok('con el cupo vacío igual se abre la cámara', await page.locator('#disparo').count()===1, t.slice(0,70));
    ok('no dice "ya sacaste tus fotos"', !/Ya sacaste/i.test(t));
    ok('el contador muestra 24, no vacío ni NaN', (await page.locator('#cRestan').textContent())==='24');
    ok('sin errores de JS', errores.length===0, errores[0]||'');
    await page.context().close();
});

/* ══ 2. el rollo cerrado y después revelado ══
   Antes esta pantalla no preguntaba nunca más: el invitado se quedaba
   mirando "la cámara ya cerró" aunque el organizador revelara. */
await corrida('cerrado primero, revelado después', async()=>{
    const {page,errores}=await nuevaPagina(browser);
    const c=montar(page,{
      estado:n=> n<2
        ? {token:'tok',nombre:'Ana',disparos:1,cupo:3,camara:true,cerrado:true,revelado:false,revela_en:null}
        : {token:'tok',nombre:'Ana',disparos:1,cupo:3,camara:true,cerrado:true,revelado:true,revela_en:null},
      album:{revelado:true, mias:[{id:'1',ruta:'TEST-1/tok/1.jpg',filtro:'bn',ts:1,nombre:'Ana',mia:true}],
             todas:[{id:'1',ruta:'TEST-1/tok/1.jpg',filtro:'bn',ts:1,nombre:'Ana',mia:true}],
             total_fotos:1, total_invitados:1}
    });
    await conRollo(page);
    /* sin el cuarto oscuro: acá lo que se mira es que la pantalla cambie */
    await page.addInitScript(()=>localStorage.setItem('ce:revelado:TEST-1','1'));
    await page.goto('http://127.0.0.1:8890/rollo.html?e=TEST-1');
    await page.waitForTimeout(800);
    ok('primero dice que la cámara cerró', /cerró/i.test(await texto(page)));
    await page.waitForTimeout(17000);
    const t=await texto(page);
    ok('al revelarse, la pantalla cambia sola al álbum', /reveló el rollo/i.test(t), t.slice(0,80));
    ok('preguntó de nuevo sin que el invitado toque nada', (c.cuenta.mi_rollo||0)>=2);
    ok('sin errores de JS', errores.length===0, errores[0]||'');
    await page.context().close();
});

/* ══ 3. sin señal al entrar ══
   El caso del salón con el wifi caído. Antes quedaba la pantalla en
   blanco y el invitado no sabía si esperar o recargar. */
await corrida('el salón se queda sin señal', async()=>{
    const {page,errores}=await nuevaPagina(browser);
    const c=montar(page,{caidaMiRollo:1});
    await conRollo(page);
    await page.goto('http://127.0.0.1:8890/rollo.html?e=TEST-1');
    await page.waitForTimeout(1000);
    const t=await texto(page);
    ok('no queda la pantalla en blanco', t.length>20, '"'+t.slice(0,60)+'"');
    ok('le dice que no pudo conectar', /No pude conectar/i.test(t), t.slice(0,80));
    ok('le deja un botón para reintentar', await page.locator('#reintentar').count()===1);
    await page.locator('#reintentar').click();
    await page.waitForTimeout(1200);
    ok('al volver la señal entra a la cámara', await page.locator('#disparo').count()===1, (await texto(page)).slice(0,60));
    ok('sin errores de JS', errores.length===0, errores[0]||'');
    await page.context().close();
});

/* ══ 4. una foto que el depósito no firma ══
   Pasa si la subida se cortó por la mitad. Antes se veía un cuadro roto
   en el álbum, que parece una foto perdida. */
await corrida('una foto no se puede traer', async()=>{
    const {page,errores}=await nuevaPagina(browser);
    const fotos=[1,2,3].map(i=>({id:''+i, ruta:`TEST-1/tok/${i}.jpg`, filtro:'bn', ts:i, nombre:'Ana', mia:true}));
    montar(page,{
      estado:{token:'tok',nombre:'Ana',disparos:3,cupo:3,camara:true,cerrado:false,revelado:true,revela_en:null},
      album:{revelado:true, mias:fotos, todas:fotos, total_fotos:3, total_invitados:1},
      sinFirmar:['TEST-1/tok/2.jpg']
    });
    await conRollo(page);
    await page.addInitScript(()=>localStorage.setItem('ce:revelado:TEST-1','1'));  // sin cuarto oscuro
    await page.goto('http://127.0.0.1:8890/rollo.html?e=TEST-1');
    await page.waitForTimeout(1500);
    const figuras=await page.locator('#grillaMias figure').count();
    ok('la foto que no se pudo traer no se dibuja', figuras===2, 'figuras='+figuras);
    const vacias=await page.evaluate(()=>[...document.querySelectorAll('#grillaMias img')].filter(i=>!i.getAttribute('src')).length);
    ok('ninguna imagen queda con la dirección vacía', vacias===0);
    await page.locator('#grillaMias figure').first().click();
    await page.waitForTimeout(400);
    ok('el visor abre y cuenta solo las que están', /1 \/ 2/.test(await texto(page)), (await texto(page)).slice(0,60));
    ok('sin errores de JS', errores.length===0, errores[0]||'');
    await page.context().close();
});

/* ══ 5. el álbum vuelve a esconderse ══ */
await corrida('el organizador vuelve a ocultar las fotos', async()=>{
    const {page,errores}=await nuevaPagina(browser);
    montar(page,{
      estado:{token:'tok',nombre:'Ana',disparos:3,cupo:3,camara:true,cerrado:false,revelado:true,revela_en:null},
      album:{revelado:false}
    });
    await conRollo(page);
    await page.goto('http://127.0.0.1:8890/rollo.html?e=TEST-1');
    await page.waitForTimeout(1200);
    const t=await texto(page);
    ok('lo dice con palabras, no con un error', /se guardó de nuevo|ocultó/i.test(t), t.slice(0,90));
    ok('sin errores de JS', errores.length===0, errores[0]||'');
    await page.context().close();
});

/* ══ 6. el álbum llega sin las listas ══
   Si la base devuelve algo raro, el álbum no puede explotar. */
await corrida('el álbum llega incompleto', async()=>{
    const {page,errores}=await nuevaPagina(browser);
    montar(page,{
      estado:{token:'tok',nombre:'Ana',disparos:3,cupo:3,camara:true,cerrado:false,revelado:true,revela_en:null},
      album:{revelado:true, mias:null, todas:null, total_fotos:null, total_invitados:null}
    });
    await conRollo(page);
    await page.goto('http://127.0.0.1:8890/rollo.html?e=TEST-1');
    await page.waitForTimeout(1200);
    ok('no explota', errores.length===0, errores[0]||'');
    ok('muestra el álbum igual', /reveló el rollo/i.test(await texto(page)));
    await page.context().close();
});

/* ══ 7. la cámara denegada ══
   El botón grande tiene que hacer algo. Antes quedaba muerto y el
   invitado no encontraba el renglón chiquito de abajo. */
await corrida('el teléfono no deja prender la cámara', async()=>{
    const {page,errores}=await nuevaPagina(browser,{sinCamara:true});
    await page.addInitScript(()=>{
      navigator.mediaDevices.getUserMedia=()=>Promise.reject(new DOMException('Denegado','NotAllowedError'));
    });
    montar(page);
    await conRollo(page);
    await page.goto('http://127.0.0.1:8890/rollo.html?e=TEST-1');
    await page.waitForTimeout(1200);
    ok('igual entra a la pantalla de la cámara', await page.locator('#disparo').count()===1);
    ok('ofrece la cámara del teléfono', await page.locator('#altNativa').isVisible());
    const abrio=await page.evaluate(()=>new Promise(res=>{
      const inp=document.querySelector('#altNativa input');
      inp.addEventListener('click',()=>res(true),{once:true});
      document.querySelector('#disparo').click();
      setTimeout(()=>res(false),600);
    }));
    ok('el botón grande abre la cámara del teléfono', abrio);
    ok('sin errores de JS', errores.length===0, errores[0]||'');
    await page.context().close();
});

/* ══ 8. entrar y salir de la cámara varias veces ══
   Cada entrada dejaba un oído pegado al navegador. Al volver a la
   pestaña, el viejo le apagaba la cámara al nuevo. */
await corrida('entrar y salir de la cámara', async()=>{
    const {page,errores}=await nuevaPagina(browser);
    montar(page);
    await conRollo(page);
    /* llevamos la cuenta de los oídos de "volví a la pestaña": si se
       acumulan, el de la vista vieja le apaga la cámara a la nueva. */
    await page.addInitScript(()=>{
      window.__oidos=0;
      const alta=document.addEventListener.bind(document), baja=document.removeEventListener.bind(document);
      document.addEventListener=(t,f,o)=>{ if(t==='visibilitychange') window.__oidos++; return alta(t,f,o); };
      document.removeEventListener=(t,f,o)=>{ if(t==='visibilitychange') window.__oidos--; return baja(t,f,o); };
    });
    await page.goto('http://127.0.0.1:8890/rollo.html?e=TEST-1');
    await page.waitForTimeout(1000);
    for(let i=0;i<3;i++){
      await page.evaluate(()=>rutear(
        {codigo:'TEST-1',nombre:'Fiesta'},
        {token:'tok',nombre:'Ana'},
        {token:'tok',nombre:'Ana',disparos:0,cupo:3,camara:true,cerrado:false,revelado:false,revela_en:null}));
      await page.waitForTimeout(500);
    }
    const oidos=await page.evaluate(()=>window.__oidos||0);
    ok('queda un solo oído de la cámara, no uno por entrada', oidos===1, 'quedaron '+oidos);
    ok('la cámara sigue viva después de tres entradas',
       await page.evaluate(()=>!!(stream && stream.getVideoTracks()[0] && stream.getVideoTracks()[0].readyState==='live')));
    ok('sin errores de JS', errores.length===0, errores[0]||'');
    await page.context().close();
});

/* ══ 9. el filtro elegido y el resaltado ══ */
await corrida('el filtro elegido no se pierde', async()=>{
    const {page,errores}=await nuevaPagina(browser);
    montar(page);
    await conRollo(page);
    await page.goto('http://127.0.0.1:8890/rollo.html?e=TEST-1');
    await page.waitForTimeout(1000);
    await page.locator('[data-f="bn"]').click();
    await page.waitForTimeout(200);
    await page.evaluate(()=>rutear({codigo:'TEST-1',nombre:'Fiesta'},{token:'tok',nombre:'Ana'},
      {token:'tok',nombre:'Ana',disparos:0,cupo:3,camara:true,cerrado:false,revelado:false,revela_en:null}));
    await page.waitForTimeout(600);
    const marcado=await page.evaluate(()=>{
      const b=document.querySelector('[aria-pressed="true"][data-f]');
      return b?b.dataset.f:null;
    });
    ok('el resaltado sigue en el filtro que eligió', marcado==='bn', 'marcado='+marcado);
    ok('y es el mismo que se va a aplicar', await page.evaluate(()=>filtroActual.id)==='bn');
    ok('sin errores de JS', errores.length===0, errores[0]||'');
    await page.context().close();
});

/* ══ 10. el visor y una navegación ══
   El visor cuelga del body, no de la pantalla: al cambiar de vista se
   quedaba tapando lo nuevo. */
await corrida('apretar atrás con una foto abierta', async()=>{
    const {page,errores}=await nuevaPagina(browser);
    const fotos=[1,2].map(i=>({id:''+i, ruta:`TEST-1/tok/${i}.jpg`, filtro:'bn', ts:i, nombre:'Ana', mia:true}));
    montar(page,{
      estado:{token:'tok',nombre:'Ana',disparos:2,cupo:3,camara:true,cerrado:false,revelado:true,revela_en:null},
      album:{revelado:true, mias:fotos, todas:fotos, total_fotos:2, total_invitados:1}
    });
    await conRollo(page);
    await page.addInitScript(()=>localStorage.setItem('ce:revelado:TEST-1','1'));
    await page.goto('http://127.0.0.1:8890/rollo.html?e=TEST-1');
    await page.waitForTimeout(1400);
    await page.locator('#grillaMias figure').first().click();
    await page.waitForTimeout(300);
    ok('la foto se abre', await page.locator('.visorf').count()===1);
    await page.evaluate(()=>{ location.hash='codigo'; });
    await page.waitForTimeout(500);
    ok('al cambiar de pantalla el visor se va', await page.locator('.visorf').count()===0);
    ok('sin errores de JS', errores.length===0, errores[0]||'');
    await page.context().close();
});

/* ══ 11. la fecha que propone el formulario ══
   A las 10 de la noche en Argentina ya es mañana en UTC. */
await corrida('la fecha del formulario, de noche', async()=>{
    const {page,errores}=await nuevaPagina(browser);
    montar(page);
    await page.goto('http://127.0.0.1:8890/rollo.html#nuevo/2');
    await page.waitForTimeout(600);
    const r=await page.evaluate(()=>{
      const real=Date;
      /* 14 de septiembre, 22:30 en Argentina = 15 de septiembre 01:30 UTC */
      const falso=new real('2026-09-15T01:30:00Z').getTime();
      Date=class extends real{ constructor(...a){ super(...(a.length?a:[falso])); } static now(){ return falso; } };
      const propuesta=hoy();
      const d=new real(falso);
      const esperado=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      Date=real;
      return {propuesta, esperado};
    });
    ok('propone el día de hoy acá, no el de UTC', r.propuesta===r.esperado, r.propuesta+' vs '+r.esperado);
    ok('sin errores de JS', errores.length===0, errores[0]||'');
    await page.context().close();
});

/* ══ 12. la clave de emergencia ══ */
await corrida('el organizador entra desde otro teléfono', async()=>{
    const {page,errores}=await nuevaPagina(browser);
    montar(page,{claveBuena:'ABC234'});
    await page.goto('http://127.0.0.1:8890/rollo.html#ev/TEST-1');
    await page.waitForTimeout(700);
    ok('sin la clave guardada, la pide en vez de fallar botón por botón',
       /clave/i.test(await texto(page)) && await page.locator('#laClave').count()===1, (await texto(page)).slice(0,80));
    await page.locator('#codClave').fill('TEST-1');
    await page.locator('#laClave').fill('MALMAL');
    await page.locator('#entrarClave').click();
    await page.waitForTimeout(900);
    ok('con la clave equivocada lo dice en castellano', /no es de este evento/i.test(await texto(page)), (await texto(page)).slice(-90));
    await page.locator('#laClave').fill('ABC234');
    await page.locator('#entrarClave').click();
    await page.waitForTimeout(1400);
    ok('con la clave buena entra al panel', /Mostrá este código|Tu rollo/i.test(await texto(page)), (await texto(page)).slice(0,80));
    ok('y queda guardada para la próxima',
       await page.evaluate(()=>JSON.parse(localStorage.getItem('ce:claves')||'{}')['TEST-1'])==='ABC234');
    ok('sin errores de JS', errores.length===0, errores[0]||'');
    await page.context().close();
});

/* ══ 13. la clave sin crypto ══
   En un navegador viejo el respaldo daba seis letras iguales: "KKKKKK". */
await corrida('la clave cuando el navegador no tiene crypto', async()=>{
    const {page}=await nuevaPagina(browser);
    montar(page);
    await page.goto('http://127.0.0.1:8890/rollo.html');
    await page.waitForTimeout(400);
    const claves=await page.evaluate(()=>{
      const antes=crypto.getRandomValues;
      crypto.getRandomValues=()=>{ throw new Error('no existe'); };
      const salida=[]; for(let i=0;i<40;i++) salida.push(nuevaClave());
      crypto.getRandomValues=antes;
      return salida;
    });
    const todasIguales=claves.filter(k=>new Set(k).size===1).length;
    ok('sin crypto igual sale una clave de 6', claves.every(k=>k.length===6));
    ok('y no son seis letras iguales', todasIguales===0, todasIguales+' de 40 salieron "AAAAAA"');
    ok('y no se repiten entre sí', new Set(claves).size>=38, new Set(claves).size+' distintas de 40');
    await page.context().close();
});

/* ══ 14. el zip con una foto que no se puede traer ══ */
await corrida('descargar todas, con una rota', async()=>{
    const {page,errores}=await nuevaPagina(browser);
    const fotos=[1,2,3].map(i=>({id:''+i, ruta:`TEST-1/tok/${i}.jpg`, filtro:'bn', ts:i, nombre:'Ana', mia:true}));
    montar(page,{
      evento:{codigo:'TEST-1', nombre:'Fiesta', tono:'#D9AE72', camara:true, cerrado:false, cupo_fotos:3, revelado:true},
      album:{revelado:true, mias:fotos, todas:fotos, total_fotos:3, total_invitados:1},
      sinFirmar:['TEST-1/tok/2.jpg']
    });
if(!await servirZip(page)){
      R.push('  · salteada: no conseguí JSZip (ni en pruebas/.cache ni por internet)');
      return await page.context().close();
    }
    await page.addInitScript(()=>localStorage.setItem('ce:claves', JSON.stringify({'TEST-1':'ABC234'})));
    await page.goto('http://127.0.0.1:8890/rollo.html#ev/TEST-1');
    await page.waitForTimeout(1200);
    const bajada=page.waitForEvent('download',{timeout:20000}).catch(()=>null);
    await page.locator('#bajarTodas').click();
    const d=await bajada;
    await page.waitForTimeout(600);
    ok('el zip se baja igual', !!d, 'no bajó nada');
    const t=await texto(page);
    ok('le avisa cuántas no pudo traer', /1 no se (pudo|pudieron)/i.test(t), t.slice(-120));
    ok('sin errores de JS', errores.length===0, errores[0]||'');
    await page.context().close();
});

/* ══ 15. un nombre hostil ══ */
await corrida('un invitado con mala intención en el nombre', async()=>{
    const {page,errores}=await nuevaPagina(browser);
    const malo='<img src=x onerror=window.__roto=1>ñ😀'.repeat(2);
    const fotos=[{id:'1', ruta:'TEST-1/tok/1.jpg', filtro:'bn', ts:1, nombre:malo, mia:true}];
    montar(page,{
      evento:{codigo:'TEST-1', nombre:malo, tono:'#D9AE72', camara:true, cerrado:false, cupo_fotos:3},
      estado:{token:'tok',nombre:malo,disparos:1,cupo:3,camara:true,cerrado:false,revelado:true,revela_en:null},
      album:{revelado:true, mias:fotos, todas:fotos, total_fotos:1, total_invitados:1}
    });
    await conRollo(page,'TEST-1',{token:'tok',nombre:malo});
    await page.addInitScript(()=>localStorage.setItem('ce:revelado:TEST-1','1'));
    await page.goto('http://127.0.0.1:8890/rollo.html?e=TEST-1');
    await page.waitForTimeout(1400);
    ok('no ejecuta nada', await page.evaluate(()=>!window.__roto));
    ok('el nombre se ve como texto', (await texto(page)).includes('<img src=x'));
    ok('sin errores de JS', errores.length===0, errores[0]||'');
    await page.context().close();
});


/* ══ 16. el código del evento ══
   Es un "upsert": dos códigos iguales no dan error, uno pisa al otro. */
await corrida('el código que se le da a cada fiesta', async()=>{
  const {page,errores}=await nuevaPagina(browser);
  montar(page);
  await page.goto('http://127.0.0.1:8890/rollo.html');
  await page.waitForTimeout(500);
  const cods=await page.evaluate(()=>Array.from({length:500},()=>nuevoCodigo('XV')));
  ok('todos tienen el largo de siempre', cods.every(c=>/^QUI-[A-Z2-9]{6}$/.test(c)),
     'el más corto: '+cods.slice().sort((a,b)=>a.length-b.length)[0]);
  ok('no se repite ninguno entre 500', new Set(cods).size===500, (500-new Set(cods).size)+' repetidos');
  ok('sin errores de JS', errores.length===0, errores[0]||'');
  await page.context().close();
});

/* ══ 17. se corta la señal justo al crear ══
   Si el pedido llega pero la respuesta se pierde, el evento queda creado.
   Sin la clave guardada de antes, el organizador lo perdía para siempre. */
await corrida('se corta la señal justo al crear el rollo', async()=>{
  const {page,errores}=await nuevaPagina(browser);
  let corte=true;
  await page.route(SUPA, async route=>{
    const url=route.request().url(), met=route.request().method();
    if(url.includes('/rest/v1/ce_eventos') && met==='POST'){
      if(corte){ corte=false; return route.abort('failed'); }   // llegó, no volvió
      return route.fulfill({status:201, body:''});
    }
    if(url.includes('/rest/v1/ce_eventos'))
      return route.fulfill({status:200, contentType:'application/json',
        body:JSON.stringify(met==='GET'?[]:[])});
    if(url.includes('/rpc/ce_camara_stats'))
      return route.fulfill({status:200, contentType:'application/json', body:'{"fotos":0,"invitados":0}'});
    return route.fulfill({status:404, body:'no mockeado'});
  });
  await page.goto('http://127.0.0.1:8890/rollo.html#nuevo/1');
  await page.waitForTimeout(500);
  await page.locator('#dato').fill('Los 15 de Delfina');
  /* Hasta el final sin contar pasos: contar clicks rompió esta prueba
     cuando el alta pasó de cuatro pasos a seis, y falló por el motivo
     equivocado. El click que no dice "Siguiente" es el de crear. */
  for(let i=0;i<10;i++){
    const t=((await page.locator('#sig').innerText().catch(()=>''))||'').trim().toLowerCase();
    await page.locator('#sig').click(); await page.waitForTimeout(400);
    if(!/siguiente/.test(t)) break;      // ese fue el de crear, y se corta
  }
  await page.waitForTimeout(900);
  const guardadas=await page.evaluate(()=>JSON.parse(localStorage.getItem('ce:claves')||'{}'));
  const cods=Object.keys(guardadas);
  ok('la clave quedó guardada igual', cods.length===1, cods.length+' claves');
  ok('le avisa que no se pudo', /No se pudo crear/i.test(await texto(page)), (await texto(page)).slice(-70));
  /* el aviso no puede quedar encima del botón grande */
  const tapa=await page.evaluate(()=>{
    const b=document.querySelector('#sig'), n=document.querySelector('#aviso-toast');
    if(!b||!n) return 'falta uno';
    const rb=b.getBoundingClientRect(), rn=n.getBoundingClientRect();
    return !(rn.bottom<rb.top||rn.top>rb.bottom||rn.right<rb.left||rn.left>rb.right);
  });
  ok('el aviso no le tapa el botón de crear', tapa===false, 'se superponen');
  await page.locator('#sig').click();     // reintenta
  await page.waitForTimeout(1200);
  const despues=Object.keys(await page.evaluate(()=>JSON.parse(localStorage.getItem('ce:claves')||'{}')));
  ok('al reintentar NO crea un segundo evento', despues.length===1, despues.length+' claves');
  ok('y es el mismo código de antes', despues[0]===cods[0], cods[0]+' → '+despues[0]);
  ok('sin errores de JS', errores.length===0, errores[0]||'');
  await page.context().close();
});

/* ══ 18. irse a otro lado mientras revela ══
   El cuarto oscuro cuelga del body y tenía relojes propios: ocho segundos
   después le pisaba la pantalla al invitado, estuviera donde estuviera. */
await corrida('irse de la pantalla mientras se revela', async()=>{
  const {page,errores}=await nuevaPagina(browser);
  const fotos=[1,2,3].map(i=>({id:''+i, ruta:`TEST-1/tok/${i}.jpg`, filtro:'bn', ts:i, nombre:'Ana', mia:true}));
  montar(page,{
    estado:{token:'tok',nombre:'Ana',disparos:3,cupo:3,camara:true,cerrado:false,revelado:true,revela_en:null},
    album:{revelado:true, mias:fotos, todas:fotos, total_fotos:3, total_invitados:1}
  });
  await conRollo(page);
  await page.goto('http://127.0.0.1:8890/rollo.html?e=TEST-1');
  await page.waitForTimeout(1800);
  ok('el cuarto de revelado arrancó', await page.locator('.cuarto').count()===1);
  ok('las copias llegan con la foto puesta',
     await page.evaluate(()=>[...document.querySelectorAll('.cuarto .copia img')].every(i=>i.complete && i.naturalWidth>0)));
  await page.evaluate(()=>{ location.hash='codigo'; });
  await page.waitForTimeout(600);
  ok('al cambiar de pantalla el cuarto se va', await page.locator('.cuarto').count()===0);
  const antes=await texto(page);
  await page.waitForTimeout(9000);        // más de lo que dura toda la animación
  const ahora=await texto(page);
  ok('y no vuelve a pisar la pantalla después', ahora===antes, '"'+ahora.slice(0,60)+'"');
  ok('sin errores de JS', errores.length===0, errores[0]||'');
  await page.context().close();
});

/* ══ 19. un álbum grande ══
   Las direcciones firmadas duran una hora: con miles de fotos, las últimas
   se vencían antes de que les llegara el turno. */
await corrida('bajar un álbum grande', async()=>{
  const {page,errores}=await nuevaPagina(browser);
  const fotos=Array.from({length:220},(_,i)=>({id:''+i, ruta:`TEST-1/tok/${i}.jpg`, filtro:'bn', ts:i, nombre:'Ana', mia:true}));
  const c=montar(page,{
    evento:{codigo:'TEST-1', nombre:'Fiesta', tono:'#D9AE72', camara:true, cerrado:false, cupo_fotos:3, revelado:true},
    album:{revelado:true, mias:[], todas:fotos, total_fotos:220, total_invitados:1}
  });
  const tandas=[];
  await page.route('**/storage/v1/object/sign/ce-rollos', async r=>{
    const b=JSON.parse(r.request().postData()||'{}');
    tandas.push((b.paths||[]).length);
    r.fulfill({status:200, contentType:'application/json',
      body:JSON.stringify((b.paths||[]).map(p=>({path:p, signedURL:'/object/sign/ce-rollos/'+p+'?token=x'})))});
  });
if(!await servirZip(page)){
    R.push('  · salteada: no conseguí JSZip (ni en pruebas/.cache ni por internet)');
    return await page.context().close();
  }
  await page.addInitScript(()=>localStorage.setItem('ce:claves', JSON.stringify({'TEST-1':'ABC234'})));
  await page.goto('http://127.0.0.1:8890/rollo.html#ev/TEST-1');
  await page.waitForTimeout(1200);
  const bajada=page.waitForEvent('download',{timeout:90000}).catch(()=>null);
  await page.locator('#bajarTodas').click();
  const d=await bajada;
  ok('el zip se baja', !!d, 'no bajó nada');
  ok('firma de a tandas, no todo de una', tandas.length>=3 && Math.max(...tandas)<=100, 'tandas: '+tandas.join('+'));
  ok('y firma las 220', tandas.reduce((a,b)=>a+b,0)===220, 'firmó '+tandas.reduce((a,b)=>a+b,0));
  ok('sin errores de JS', errores.length===0, errores[0]||'');
  await page.context().close();
});

await browser.close();
console.log(R.join('\n'));
console.log('\n'+(fallas?`FALLARON ${fallas}`:'todo en pie ✓'));
process.exit(fallas?1:0);
})();
