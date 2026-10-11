/* ══════════════════════════════════════════════════════════════════
   Todos los enlaces de la parte pública, uno por uno.

   Las 41 suites que ya existen miran las apps a fondo. La página
   pública no tenía ninguna que la recorriera entera, y es la única
   pantalla a la que ahora le vamos a mandar tráfico pagado: cada
   enlace roto acá es plata tirada, porque el clic ya se pagó.

   Un enlace muerto no tira ningún error. El ancla no existe y la
   página se queda quieta; la ruta devuelve 404 y el cliente ve la
   pantalla de error de Cloudflare. Las dos cosas se ven perfectas
   desde acá y sólo las descubre el que paga el clic.

   Qué mira, en /, /privacidad y /terminos:

     1. Que no haya un solo error de JavaScript al cargar.
     2. Que cada enlace llegue a algo vivo: el ancla existe en el
        documento, o la ruta contesta menos de 400.
     3. Que ningún enlace esté vacío — sin texto no se puede tocar ni
        leer con un lector de pantalla.
     4. Que no haya dos elementos con el mismo id: el segundo no se
        alcanza nunca por su ancla y nadie se entera.
     5. Que todo lo que abre en otra pestaña lleve rel="noopener".
     6. Que los tres productos tengan su botón de presupuesto, cada
        uno con SU mensaje. Esto no es decoración: el muro y el rollo
        estuvieron meses sin un solo botón de comprar, y por eso no
        los compraba nadie.
     7. Que esos botones terminen apuntando a wa.me DESPUÉS de que
        corra el JavaScript. En el HTML dicen #contacto a propósito,
        así que si el script se rompe el botón no se ve roto: se ve
        igual y no lleva a WhatsApp. Es la regla de siempre —mirar
        que el cambio haya entrado, no suponerlo—.
   ══════════════════════════════════════════════════════════════════ */
const { chromium, request } = require('playwright');
const S = process.env.BASE || 'http://127.0.0.1:8099';
const fallas=[]; const mal=m=>{fallas.push(m);console.log('  ✗ '+m);};
const bien=m=>console.log('  ✓ '+m);
const nota=m=>console.log('  · '+m);

/* La de 404 va en la lista como una más: es una pantalla del producto y
   se le exige lo mismo que a las otras. Cloudflare la sirve sola para
   cualquier dirección que no exista, y con QR impresos y tráfico pagado
   eso pasa todos los días. */
const PAGINAS=[['la página de inicio','/',200],
               ['la política de privacidad','/privacidad',200],
               ['los términos','/terminos',200],
               /* La que se le manda a cada cliente que pregunta. Si un enlace
                  de acá se rompe, se rompe en el medio de una venta. */
               ['cómo empezar','/empezar',200],
               ['la pantalla de 404','/esta-direccion-no-existe-jamas',404]];

/* Los tres productos y el pedazo de mensaje que tiene que llevar cada
   botón. Se busca por una palabra, no por la frase entera: el texto se
   va a seguir puliendo y la prueba no tiene que romperse por eso. */
const PRODUCTOS=[['#invitaciones','invitaci'],['#muro','muro'],['#rollo','rollo']];

(async()=>{
  const api = await request.newContext({ignoreHTTPSErrors:true});
  const nav = await chromium.launch();
  const cacheRutas = new Map();

  async function viva(url){
    if(cacheRutas.has(url)) return cacheRutas.get(url);
    let ok;
    try{ const r = await api.get(url,{maxRedirects:5}); ok = r.status()<400 ? true : r.status(); }
    catch(e){ ok = 'no respondió'; }
    cacheRutas.set(url,ok); return ok;
  }

  for(const [nombre,ruta,esperado] of PAGINAS){
    console.log(`\n─── ${nombre} ───`);
    const ctx = await nav.newContext();
    const pag = await ctx.newPage();
    const errores=[];
    pag.on('pageerror', e=>errores.push(String(e.message||e)));
    pag.on('console', m=>{ if(m.type()==='error') errores.push(m.text()); });

    const resp = await pag.goto(S+ruta,{waitUntil:'load'});
    const estado = resp ? resp.status() : 0;
    if(estado !== esperado){ mal(`${nombre}: contesta ${estado||'nada'} y tendría que contestar ${esperado}`); await ctx.close(); continue; }
    if(esperado===404) bien('contesta 404 de verdad, no un 200 disfrazado');
    await pag.waitForTimeout(700);   // que corra el JS que arma los href

    /* 1 · errores de JavaScript. Lo que no se puede bajar por el proxy
       no es una falla del producto: eso ya nos mandó a buscar un bug
       que no existía. Lo que no se perdona es un error del código. */
    /* En la pantalla de 404 el propio documento contesta 404 y el navegador
       lo anota como "Failed to load resource". Es lo que estamos buscando,
       no una falla: si no se filtra, la prueba se acusa a sí misma. */
    const propios = errores.filter(e=>!/net::|Failed to fetch|ERR_|fonts\.(googleapis|gstatic)|googletagmanager|favicon/i.test(e))
      .filter(e=>!(esperado===404 && /Failed to load resource.*404/i.test(e)));
    if(propios.length) mal(`${nombre}: ${propios.length} error(es) de JavaScript · ${propios[0].slice(0,120)}`);
    else bien('sin errores de JavaScript');

    /* 4 · ids repetidos */
    const repes = await pag.evaluate(()=>{
      const v={}, r=[];
      document.querySelectorAll('[id]').forEach(e=>{ v[e.id]=(v[e.id]||0)+1; });
      for(const k in v) if(v[k]>1) r.push(k+' ×'+v[k]);
      return r;
    });
    if(repes.length) mal(`${nombre}: ids repetidos · ${repes.join(', ')}`);
    else bien('ningún id repetido');

    /* 2, 3 y 5 · cada enlace */
    const enlaces = await pag.evaluate(()=>[...document.querySelectorAll('a')].map(a=>({
      href:a.getAttribute('href')||'', abs:a.href,
      texto:(a.textContent||'').trim() || a.getAttribute('aria-label') || (a.querySelector('img')||{}).alt || '',
      blank:a.getAttribute('target')==='_blank', rel:a.getAttribute('rel')||''
    })));
    const anclas = await pag.evaluate(()=>[...document.querySelectorAll('[id]')].map(e=>e.id));

    let vacios=0, rotos=0, sinRel=0, mirados=0;
    for(const a of enlaces){
      if(!a.texto) vacios++;
      if(a.blank && !/noopener/.test(a.rel)) sinRel++;
      if(!a.href || a.href==='#' || /^(mailto|tel|sms|javascript):/i.test(a.href)) continue;
      if(a.href.startsWith('#')){
        mirados++;
        if(!anclas.includes(a.href.slice(1))) { mal(`${nombre}: el ancla ${a.href} no existe`); rotos++; }
        continue;
      }
      if(/^https?:/i.test(a.abs) && !a.abs.startsWith(S)) continue;  // afuera: el proxy lo bloquea
      mirados++;
      const r = await viva(a.abs);
      if(r!==true){ mal(`${nombre}: ${a.href} devuelve ${r}`); rotos++; }
    }
    if(!rotos) bien(`los ${mirados} enlaces internos llegan a algo vivo`);
    if(vacios) mal(`${nombre}: ${vacios} enlace(s) sin texto ni etiqueta`); else bien('ningún enlace vacío');
    if(sinRel) mal(`${nombre}: ${sinRel} enlace(s) abren en otra pestaña sin rel="noopener"`);
    else bien('todo lo que abre en otra pestaña lleva noopener');

    /* 6 · botones sin nombre */
    const mudos = await pag.evaluate(()=>[...document.querySelectorAll('button')]
      .filter(b=>!((b.textContent||'').trim() || b.getAttribute('aria-label') || b.getAttribute('title'))).length);
    if(mudos) mal(`${nombre}: ${mudos} botón(es) sin nombre accesible`);
    else bien('todos los botones tienen nombre');

    await ctx.close();
  }

  /* ── el embudo: cada producto con su botón y su mensaje ── */
  console.log('\n─── cada producto pide presupuesto por su cuenta ───');
  const ctx = await nav.newContext();
  const pag = await ctx.newPage();
  await pag.goto(S+'/',{waitUntil:'load'});
  await pag.waitForTimeout(700);

  for(const [sec,palabra] of PRODUCTOS){
    const r = await pag.evaluate(sel=>{
      const s=document.querySelector(sel); if(!s) return {hay:false};
      const b=[...s.querySelectorAll('a[data-wsp]')];
      return {hay:true, n:b.length, hrefs:b.map(x=>x.href), msg:b.map(x=>x.dataset.wsp).join(' ')};
    }, sec);
    if(!r.hay){ mal(`no existe la sección ${sec}`); continue; }
    if(!r.n){ mal(`${sec} no tiene ningún botón de presupuesto`); continue; }
    if(!r.hrefs.every(h=>h.startsWith('https://wa.me/')))
      mal(`${sec}: el botón no terminó apuntando a WhatsApp (quedó en ${r.hrefs[0]})`);
    else if(!new RegExp(palabra,'i').test(r.msg))
      mal(`${sec}: el mensaje de WhatsApp no nombra el producto`);
    else bien(`${sec} pide presupuesto y el mensaje dice de qué`);
  }

  /* El combo: existía como frase suelta y no como oferta. */
  const combo = await pag.evaluate(()=>{
    const s=document.querySelector('#combo'); if(!s) return null;
    const b=s.querySelector('a[data-wsp]');
    return b ? b.href : '';
  });
  if(combo===null) mal('no existe la sección del combo');
  else if(!String(combo).startsWith('https://wa.me/')) mal('el combo no tiene botón que lleve a WhatsApp');
  else bien('el combo se puede pedir con un botón');

  /* Que los tres productos estén en el menú: dos de los tres faltaban. */
  const menu = await pag.evaluate(()=>[...document.querySelectorAll('nav .links a, #menuMovil a')]
    .map(a=>a.getAttribute('href')));
  for(const sec of ['#invitaciones','#muro','#rollo'])
    menu.includes(sec) ? bien(`el menú nombra ${sec}`) : mal(`el menú no nombra ${sec}`);

  await ctx.close();

  /* ── la pantalla de 404 devuelve al visitante ── */
  console.log('\n─── la dirección que no existe ───');
  {
    const ctx404 = await nav.newContext();
    const p404 = await ctx404.newPage();
    await p404.goto(S+'/tampoco-existe-esto',{waitUntil:'load'});
    const t = (await p404.title()) || '';
    const marca = await p404.locator('img[alt="Click Eterno"], img[alt*="Click"]').count();
    const salidas = await p404.evaluate(()=>[...document.querySelectorAll('a[href]')]
      .map(a=>a.getAttribute('href')).filter(h=>h && h!=='#'));
    if(!/click eterno/i.test(t)) mal(`la pantalla de 404 no es la nuestra (título: "${t}")`);
    else bien('la pantalla de 404 es la de la marca');
    if(!marca) mal('la pantalla de 404 no muestra el logo');
    else bien('muestra el logo');
    /* Las cuatro puertas más el inicio más WhatsApp. Lo que importa no es
       el número: es que no sea un callejón. */
    if(salidas.length < 4) mal(`la pantalla de 404 ofrece sólo ${salidas.length} salida(s)`);
    else bien(`ofrece ${salidas.length} salidas, ninguna es un callejón`);
    for(const sec of ['/#invitaciones','/#muro','/#rollo','/#entrar'])
      salidas.includes(sec) ? bien(`lleva a ${sec}`) : mal(`la pantalla de 404 no lleva a ${sec}`);
    await ctx404.close();
  }

  /* ── la tarjeta del chat ──
     Así se ve el link cuando alguien lo reenvía por WhatsApp, que es como
     se reparte este producto. Sin título, sin bajada o con una imagen que
     da 404, llega una dirección gris que parece un link trucho — y el
     invitado no la abre. No tira ningún error y no se ve desde acá: la
     única forma de saberlo es medirla. */
  console.log('\n─── la vista previa al compartir el link ───');
  const CARD=[['la página de inicio','/'],['el muro','/muro'],['el rollo','/rollo'],
              ['la política de privacidad','/privacidad'],['los términos','/terminos'],
              ['cómo empezar','/empezar']];
  for(const [nombre,ruta] of CARD){
    let html='';
    try{ html = await (await api.get(S+ruta)).text(); }catch(e){ mal(`${nombre}: no se pudo leer`); continue; }
    const meta = (prop)=>{
      const re = new RegExp('<meta[^>]+(?:property|name)=["\']'+prop+'["\'][^>]*>','i');
      const m = html.match(re); if(!m) return '';
      const c = m[0].match(/content=["']([^"']*)["']/i); return c?c[1]:'';
    };
    const t = (html.match(/<title>([^<]*)<\/title>/i)||[,''])[1].trim();
    const faltan=[];
    if(!t) faltan.push('<title>');
    if(!meta('description')) faltan.push('description');
    if(!meta('og:title')) faltan.push('og:title');
    if(!meta('og:description')) faltan.push('og:description');
    const img = meta('og:image');
    if(!img) faltan.push('og:image');
    if(faltan.length){ mal(`${nombre}: le falta ${faltan.join(', ')} para la vista previa`); continue; }
    /* La imagen se declara con el dominio de producción; acá se prueba la
       misma ruta contra el servidor de pruebas. Una og:image rota es peor
       que no declararla: deja el recuadro vacío. */
    const r = await viva(S + new URL(img,'https://clicketerno.com.ar/').pathname);
    if(r!==true) mal(`${nombre}: la imagen de la vista previa (${img}) devuelve ${r}`);
    else bien(`${nombre} comparte bien: título, bajada e imagen`);
  }

  await nav.close(); await api.dispose();

  console.log(fallas.length ? `\n\x1b[31m${fallas.length} FALLAS\x1b[0m` : '\n✓ Sin fallas');
  process.exit(fallas.length?1:0);
})().catch(e=>{ console.log('SE CORTÓ: '+(e&&e.message||e)); process.exit(1); });
