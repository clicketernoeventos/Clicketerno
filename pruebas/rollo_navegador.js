const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const RAIZ='/home/user/Clicketerno';
const SUPA='**/kuqlqgrwsospwjexodqa.supabase.co/**';

async function nuevaPagina(browser, opciones={}) {
  const ctx = await browser.newContext({ viewport:{width:420,height:880}, permissions:['camera'] });
  const page = await ctx.newPage();
  const errores=[]; const avisos=[];
  page.on('pageerror', e=>errores.push('PAGEERROR: '+e.message));
  /* La librería del QR viene de un CDN. Si el entorno donde corren estas
     pruebas no tiene salida a internet, el navegador avisa que no pudo
     bajarla: eso no es un fallo del rollo, y si lo contáramos taparía los
     errores de verdad. */
  const deCDN=t=>/ERR_TUNNEL_CONNECTION_FAILED|ERR_NAME_NOT_RESOLVED|ERR_INTERNET_DISCONNECTED|cdnjs|fonts\.googleapis/i.test(t);
  page.on('console', m=>{ if(m.type()==='error' && !deCDN(m.text())) errores.push('CONSOLE: '+m.text()); });
  return { page, ctx, errores, avisos };
}

const estadoBase = () => ({ token:'tok', nombre:'Ana', disparos:0, cupo:3, camara:true, cerrado:false, revelado:false, revela_en:null });

async function montarRutas(page, cfg) {
  const st = cfg.estado;
  const llamadas = cfg.llamadas;
  await page.route(SUPA, async route => {
    const url = route.request().url(), method = route.request().method();
    const cuerpo = () => { try { return JSON.parse(route.request().postData()||'{}'); } catch(e){ return {}; } };
    if (url.includes('/rest/v1/ce_eventos')) {
      return route.fulfill({status:200, contentType:'application/json',
        body: JSON.stringify([{codigo:'TEST-1', nombre:'Fiesta', tono:'#D9AE72', camara:true, cerrado:false}])});
    }
    if (url.includes('/rpc/ce_mi_rollo')) {
      llamadas.mi_rollo = (llamadas.mi_rollo||0)+1;
      return route.fulfill({status:200, contentType:'application/json', body: JSON.stringify(st)});
    }
    if (url.includes('/rpc/ce_tomar_foto')) {
      llamadas.tomar = (llamadas.tomar||0)+1;
      llamadas.rutas = llamadas.rutas||[]; llamadas.rutas.push(cuerpo().p_ruta);
      if (st.disparos >= st.cupo) {
        return route.fulfill({status:400, contentType:'application/json',
          body: JSON.stringify({message:'Ya usaste todas tus fotos'})});
      }
      st.disparos++;
      return route.fulfill({status:200, contentType:'application/json', body: JSON.stringify({restantes: st.cupo - st.disparos})});
    }
    if (url.includes('/storage/v1/object/ce-rollos/')) {
      llamadas.subidas = (llamadas.subidas||0)+1;
      if (cfg.fallaSubida) return route.fulfill({status:500, body:'boom'});
      return route.fulfill({status:200, contentType:'application/json', body:'{}'});
    }
    if (url.includes('/rpc/ce_devolver_foto')) {
      llamadas.devueltas = (llamadas.devueltas||0)+1; st.disparos = Math.max(0, st.disparos-1);
      return route.fulfill({status:200, contentType:'application/json', body: JSON.stringify({devueltas:1})});
    }
    if (url.includes('/rpc/ce_album_de')) {
      return route.fulfill({status:200, contentType:'application/json',
        body: JSON.stringify(cfg.album||{revelado:true, mias:[], todas:[], total_fotos:0, total_invitados:0})});
    }
    if (url.includes('/storage/v1/object/sign/ce-rollos')) {
      const b=cuerpo();
      llamadas.firmas=(llamadas.firmas||0)+1;
      llamadas.tamFirma=(llamadas.tamFirma||[]); llamadas.tamFirma.push((b.paths||[]).length);
      return route.fulfill({status:200, contentType:'application/json',
        body: JSON.stringify((b.paths||[]).map(p=>({path:p, signedURL:'/object/sign/ce-rollos/'+p+'?token=x'})))});
    }
    return route.fulfill({status:404, body:'no mockeado'});
  });
}

(async () => {
  const browser = await chromium.launch({
    executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']
  });
  const R=[]; const ok=(t,c,d='')=>R.push((c?'  ✓ ':'  ✗ ')+t+(c||!d?'':'   ['+d+']'));

  // ── 1. doble toque rápido en el obturador ──
  {
    const {page,ctx,errores} = await nuevaPagina(browser);
    const llamadas={}, estado=estadoBase();
    await montarRutas(page,{estado,llamadas});
    await page.goto('http://127.0.0.1:8890/rollo.html?e=TEST-1');
    await page.evaluate(()=>localStorage.setItem('ce:rollo:TEST-1',JSON.stringify({token:'tok',nombre:'Ana'})));
    await page.reload(); await page.waitForTimeout(800);
    // cinco toques en 100ms
    await page.evaluate(()=>{ const b=document.querySelector('#disparo'); for(let i=0;i<5;i++) b.click(); });
    await page.waitForTimeout(1200);
    ok('doble toque no gasta más de una foto por toque procesado',
       (llamadas.tomar||0)<=1, 'ce_tomar_foto llamado '+(llamadas.tomar||0)+' veces con 5 clicks');
    ok('sin errores de JS en el disparo', errores.length===0, errores[0]||'');
    await ctx.close();
  }

  // ── 2. la subida falla después de gastar la foto ──
  {
    const {page,ctx,errores} = await nuevaPagina(browser);
    const llamadas={}, estado=estadoBase();
    await montarRutas(page,{estado,llamadas,fallaSubida:true});
    await page.goto('http://127.0.0.1:8890/rollo.html?e=TEST-1');
    await page.evaluate(()=>localStorage.setItem('ce:rollo:TEST-1',JSON.stringify({token:'tok',nombre:'Ana'})));
    await page.reload(); await page.waitForTimeout(800);
    await page.click('#disparo'); await page.waitForTimeout(1500);
    const contador = await page.textContent('#cRestan').catch(()=>null);
    const aviso = await page.textContent('#aviso-toast').catch(()=>null);
    ok('si falla la subida, avisa al invitado', !!(aviso&&/no se pudo|fall/i.test(aviso)), 'aviso='+aviso);
    ok('si falla la subida, el contador NO baja', contador==='3', 'contador quedó en '+contador);
    ok('si falla la subida, se le devuelve la foto al invitado', (llamadas.devueltas||0)===1,
       'ce_devolver_foto se llamó '+(llamadas.devueltas||0)+' veces');
    ok('el botón vuelve a estar disponible', !(await page.locator('#disparo').isDisabled()));
    await ctx.close();
  }

  // ── 3. cámara denegada → alternativa nativa ──
  {
    const ctx2 = await browser.newContext({viewport:{width:420,height:880}, permissions:[]});
    const page = await ctx2.newPage();
    const errores=[]; page.on('pageerror',e=>errores.push(e.message));
    const llamadas={}, estado=estadoBase();
    await montarRutas(page,{estado,llamadas});
    await page.addInitScript(()=>{ navigator.mediaDevices.getUserMedia=()=>Promise.reject(new Error('NotAllowedError')); });
    await page.goto('http://127.0.0.1:8890/rollo.html?e=TEST-1');
    await page.evaluate(()=>localStorage.setItem('ce:rollo:TEST-1',JSON.stringify({token:'tok',nombre:'Ana'})));
    await page.reload(); await page.waitForTimeout(900);
    const altVisible = await page.locator('#altNativa').isVisible().catch(()=>false);
    ok('si la cámara no abre, ofrece la del teléfono', altVisible);
    ok('no explota con la cámara denegada', errores.length===0, errores[0]||'');
    await ctx2.close();
  }

  // ── 4. álbum vacío ──
  {
    const {page,ctx,errores} = await nuevaPagina(browser);
    const estado={...estadoBase(), revelado:true};
    await montarRutas(page,{estado,llamadas:{},album:{revelado:true,mias:[],todas:[],total_fotos:0,total_invitados:0}});
    await page.goto('http://127.0.0.1:8890/rollo.html?e=TEST-1');
    await page.evaluate(()=>localStorage.setItem('ce:rollo:TEST-1',JSON.stringify({token:'tok',nombre:'Ana'})));
    await page.reload(); await page.waitForTimeout(1000);
    const txt = await page.textContent('#grillaMias').catch(()=>'');
    ok('álbum sin fotos no queda en blanco', /todavía no hay/i.test(txt||''), 'texto="'+(txt||'').trim().slice(0,40)+'"');
    ok('sin errores en el álbum vacío', errores.length===0, errores[0]||'');
    await ctx.close();
  }

  // ── 5. álbum grande: ¿cuántas rutas manda a firmar de una? ──
  {
    const {page,ctx,errores} = await nuevaPagina(browser);
    const muchas = Array.from({length:400},(_,i)=>({id:'f'+i, ruta:'TEST-1/t/'+i+'.jpg', filtro:'bn', ts:i, nombre:'Alguien', mia:false}));
    const estado={...estadoBase(), revelado:true};
    const llamadas={};
    await montarRutas(page,{estado,llamadas,album:{revelado:true,mias:muchas.slice(0,24),todas:muchas,total_fotos:2400,total_invitados:100}});
    await page.goto('http://127.0.0.1:8890/rollo.html?e=TEST-1');
    await page.evaluate(()=>localStorage.setItem('ce:rollo:TEST-1',JSON.stringify({token:'tok',nombre:'Ana'})));
    await page.reload(); await page.waitForTimeout(1200);
    await page.click('[data-t="todas"]'); await page.waitForTimeout(1500);
    const max = Math.max(...(llamadas.tamFirma||[0]));
    ok('no manda cientos de rutas a firmar en una sola llamada', max<=200,
       'la llamada más grande pidió '+max+' rutas de una');
    ok('sin errores con 400 fotos', errores.length===0, errores[0]||'');
    await ctx.close();
  }

  // ── 6. nombre hostil (inyección) ──
  {
    const {page,ctx,errores} = await nuevaPagina(browser);
    const malo = '<img src=x onerror="window.__hackeado=1">';
    const estado={...estadoBase(), revelado:true, nombre:malo};
    await montarRutas(page,{estado,llamadas:{},album:{revelado:true,
      mias:[{id:'1',ruta:'TEST-1/t/1.jpg',filtro:'bn',ts:1}],
      todas:[{id:'1',ruta:'TEST-1/t/1.jpg',filtro:'bn',ts:1,nombre:malo,mia:true}],
      total_fotos:1,total_invitados:1}});
    await page.goto('http://127.0.0.1:8890/rollo.html?e=TEST-1');
    await page.evaluate(()=>localStorage.setItem('ce:rollo:TEST-1',JSON.stringify({token:'tok',nombre:'Ana'})));
    await page.reload(); await page.waitForTimeout(1000);
    await page.click('[data-t="todas"]'); await page.waitForTimeout(900);
    const hackeado = await page.evaluate(()=>!!window.__hackeado);
    ok('un nombre con HTML no ejecuta nada', !hackeado);
    await ctx.close();
  }

  // ── 7. el organizador revela a mano mientras el invitado espera ──
  {
    const {page,ctx,errores} = await nuevaPagina(browser);
    const estado={...estadoBase(), disparos:3, revela_en:new Date(Date.now()+3*3600*1000).toISOString()};
    await montarRutas(page,{estado,llamadas:{},album:{revelado:true,mias:[],todas:[],total_fotos:0,total_invitados:1}});
    await page.goto('http://127.0.0.1:8890/rollo.html?e=TEST-1');
    await page.evaluate(()=>localStorage.setItem('ce:rollo:TEST-1',JSON.stringify({token:'tok',nombre:'Ana'})));
    await page.reload(); await page.waitForTimeout(900);
    const esperando = await page.textContent('body');
    // el organizador revela ahora: cambia el estado del servidor
    estado.revelado = true;
    await page.waitForTimeout(25000);   // 25s: más que cualquier poll razonable
    const hayTabs = await page.locator('.tabs [data-t="todas"]').count();
    ok('con hora programada, un revelado a mano igual se detecta',
       hayTabs>0, 'a los 25s la pantalla sigue en la cuenta regresiva');
    await ctx.close();
  }

  // ── 8. la cámara se cuelga: no gastar la foto ──
  {
    const {page,ctx,errores} = await nuevaPagina(browser);
    const llamadas={}, estado=estadoBase();
    await montarRutas(page,{estado,llamadas});
    await page.goto('http://127.0.0.1:8890/rollo.html?e=TEST-1');
    await page.evaluate(()=>localStorage.setItem('ce:rollo:TEST-1',JSON.stringify({token:'tok',nombre:'Ana'})));
    await page.reload(); await page.waitForTimeout(900);
    // simulamos lo que hace iOS al bloquear el teléfono: corta la pista
    await page.evaluate(()=>{ document.querySelector('#video').srcObject.getVideoTracks().forEach(t=>t.stop()); });
    await page.waitForTimeout(300);
    await page.click('#disparo'); await page.waitForTimeout(1200);
    ok('con la cámara colgada, el disparo NO gasta una foto', (llamadas.tomar||0)===0,
       'ce_tomar_foto se llamó '+(llamadas.tomar||0)+' veces');
    const aviso = await page.textContent('#aviso-toast').catch(()=>'');
    ok('y le avisa que la reinició', /colgado|reinici/i.test(aviso||''), 'aviso="'+aviso+'"');
    await ctx.close();
  }

  // ── 9. la foto QUE SE GUARDA sale filtrada (sin depender de ctx.filter) ──
  {
    const {page,ctx} = await nuevaPagina(browser);
    const llamadas={}, estado={...estadoBase(), cupo:10};
    const subidas=[];
    await montarRutas(page,{estado,llamadas});
    await page.route('**/storage/v1/object/ce-rollos/**', async r=>{
      subidas.push((r.request().postDataBuffer()||Buffer.alloc(0)).length);
      return r.fulfill({status:200,contentType:'application/json',body:'{}'});
    });
    await page.goto('http://127.0.0.1:8890/rollo.html?e=TEST-1');
    await page.evaluate(()=>localStorage.setItem('ce:rollo:TEST-1',JSON.stringify({token:'tok',nombre:'Ana'})));
    await page.reload(); await page.waitForTimeout(900);
    // comparamos los píxeles que produce cada filtro, sin usar ctx.filter
    const distintas = await page.evaluate(()=>{
      const c=document.createElement('canvas'); c.width=64; c.height=48;
      const x=c.getContext('2d');
      x.fillStyle='#c04020'; x.fillRect(0,0,64,48);
      const leer=css=>{ const k=document.createElement('canvas'); k.width=64;k.height=48;
        const y=k.getContext('2d'); y.drawImage(c,0,0); aplicarFiltro(y,64,48,css);
        return y.getImageData(30,20,1,1).data.join(','); };
      const nat=leer('none'), bn=leer(FILTROS[2].css), oro=leer(FILTROS[4].css);
      return {nat, bn, oro, bnEsGris: bn.split(',')[0]===bn.split(',')[1]};
    });
    ok('el filtro se aplica a la foto guardada, no solo a la vista previa',
       distintas.nat!==distintas.bn && distintas.nat!==distintas.oro,
       'natural='+distintas.nat+' bn='+distintas.bn);
    ok('blanco y negro sale realmente gris', distintas.bnEsGris, 'bn='+distintas.bn);
    await ctx.close();
  }

  // ── 10. el visor de fotos ──
  {
    const {page,ctx,errores} = await nuevaPagina(browser);
    const fotos=[
      {id:'1',ruta:'T/t/1.jpg',filtro:'clasico',ts:1,nombre:'Lucía',mia:true},
      {id:'2',ruta:'T/t/2.jpg',filtro:'bn',ts:2,nombre:'Nico',mia:false},
      {id:'3',ruta:'T/t/3.jpg',filtro:'dorado',ts:3,nombre:'Sofi',mia:false}];
    const estado={...estadoBase(), revelado:true};
    await montarRutas(page,{estado,llamadas:{},album:{revelado:true,mias:fotos.slice(0,1),todas:fotos,total_fotos:3,total_invitados:3}});
    await page.goto('http://127.0.0.1:8890/rollo.html?e=TEST-1');
    await page.evaluate(()=>localStorage.setItem('ce:rollo:TEST-1',JSON.stringify({token:'tok',nombre:'Ana'})));
    await page.reload(); await page.waitForTimeout(1100);
    await page.click('[data-t="todas"]'); await page.waitForTimeout(1000);
    await page.click('#grillaTodas figure:nth-child(2)'); await page.waitForTimeout(500);
    ok('tocar una foto la abre a pantalla completa', await page.locator('.visorf').isVisible().catch(()=>false));
    const pie1 = await page.textContent('#pieF').catch(()=>'');
    ok('el visor dice de quién es y en cuál va', /Nico/.test(pie1)&&/2 \/ 3/.test(pie1), 'pie="'+pie1+'"');
    await page.click('.visorf .der'); await page.waitForTimeout(400);
    const pie2 = await page.textContent('#pieF').catch(()=>'');
    ok('la flecha pasa a la siguiente', /Sofi/.test(pie2)&&/3 \/ 3/.test(pie2), 'pie="'+pie2+'"');
    ok('en la última no hay flecha para seguir',
       await page.locator('.visorf .der').evaluate(e=>getComputedStyle(e).visibility==='hidden').catch(()=>false));
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    ok('se cierra con Escape', (await page.locator('.visorf').count())===0);
    ok('sin errores en el visor', errores.length===0, errores[0]||'');
    await ctx.close();
  }

  console.log(R.join('\n'));
  await browser.close();
})();
