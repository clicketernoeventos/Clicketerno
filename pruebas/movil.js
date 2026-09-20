/* ══════════════════════════════════════════════════════════════════
   Que desde un teléfono se llegue a todo.

   Tres cosas que no se ven desde una pantalla de escritorio y que en un
   celular rompían el producto:

     1. La cinta de la demostración es una capa fija de arriba. Las otras
        capas fijas —la pantalla del salón, sus botones— se corrían 38px
        a mano, un número escrito en el CSS. En cuanto la cinta envuelve
        en dos líneas ese número miente y vuelve a taparlos. Ahora se mide.
     2. Los mandos del salón son dos grupos fijos, uno a cada lado,
        pensados para una pantalla ancha. En 390px se montan y "Completa"
        se sale del borde: desde el celular no se podía cambiar de modo.
     3. El que ya contrató no tenía por dónde entrar a crear su evento.
        Había un enlace al panel del muro escondido en el pie, a media
        opacidad, y del rollo no había nada.

   Se mide con las cajas de verdad (getBoundingClientRect), no mirando el
   CSS: lo que importa es si en la pantalla se pisan, no lo que dice la
   hoja de estilos.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const BASE='http://127.0.0.1:8099';
const TELEFONO={width:390,height:844};
const fallas=[]; const mal=m=>{fallas.push(m);console.log('  ✗ '+m);};
const bien=m=>console.log('  ✓ '+m);

/* La caja de un elemento, en píxeles de pantalla. null si no está. */
const caja=(p,sel)=>p.evaluate(s=>{
  const n=document.querySelector(s); if(!n) return null;
  const r=n.getBoundingClientRect();
  return {x:Math.round(r.left),y:Math.round(r.top),
          x2:Math.round(r.right),y2:Math.round(r.bottom),
          alto:Math.round(r.height),ancho:Math.round(r.width)};
},sel);
const seMontan=(a,b)=>!!(a&&b&&a.x<b.x2&&b.x<a.x2&&a.y<b.y2&&b.y<a.y2);
const dentro=(c,v)=>!!(c&&c.x>=-1&&c.y>=-1&&c.x2<=v.width+1&&c.y2<=v.height+1);

(async()=>{
  const browser=await chromium.launch();

  // ═══ 1. la pantalla del salón en un teléfono ═══
  console.log('\n─── la pantalla del salón en un celular ───');
  {
    const ctx=await browser.newContext({viewport:TELEFONO});
    const p=await ctx.newPage();
    const errs=[]; p.on('pageerror',e=>errs.push(e.message));
    await p.goto(BASE+'/muro.html?demo=1',{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(3000);

    const cinta=await caja(p,'#cinta-demo');
    const modos=await caja(p,'.modos-sala');
    const btns =await caja(p,'.botones-sala');
    const equis=await caja(p,'#plegarCinta');
    /* Sin esto, una pantalla que no se dibujó cortaba la suite con un
       "return" y el proceso quedaba colgado con el navegador abierto: la
       prueba no fallaba, se moría. Que falte es una falla más. */
    const haySala = !!(cinta&&modos&&btns);
    if(!haySala) mal('no se dibujó la pantalla del salón: la demostración no cae ahí');
    if(haySala){
    /* Lo primero: que nada de esto quede fuera de la pantalla. El ✕ de la
       cinta se salía por el costado y no había forma de tocarlo. */
    for(const [q,c] of [['la cinta',cinta],['el ✕ de la cinta',equis],
                        ['las solapas de modo',modos],['los botones del salón',btns]]){
      if(!dentro(c,TELEFONO)) mal(`${q}: se sale de la pantalla ${JSON.stringify(c)}`);
      else bien(`${q}: entra en la pantalla`);
    }
    /* Y que no se pisen entre ellos. */
    if(seMontan(cinta,modos)) mal('la cinta le tapa las solapas de modo');
    else bien('la cinta no tapa las solapas de modo');
    if(seMontan(cinta,btns)) mal('la cinta le tapa los botones del salón');
    else bien('la cinta no tapa los botones del salón');
    if(seMontan(modos,btns)) mal('las solapas de modo y los botones se montan');
    else bien('las solapas y los botones no se montan');

    /* ── el cartel: lo que se proyecta, visto desde el celular ──
       De una foto de la pantalla del dueño: el QR ocupaba media pantalla
       y el nombre, el código y el "ya mandaron" estaban tan chicos que no
       se leían, porque estaban medidos en vw (1.3vw en 390px son cinco
       píxeles) y caían todos al mínimo del clamp. Y los dos grupos de
       mandos le tapaban el logo y el título. Se mide, no se mira. */
    /* La demostración entra proyectando el muro, no el QR: hay que pedirle
       el cartel. Sin esto se medía un .sala-cartel escondido, que da una
       caja de 0x0 en 0,0 — y una caja de cero PASA todas las cuentas: la
       prueba decía "el QR mide 0px, no se come la pantalla" sin estar
       midiendo nada. */
    await p.click('.modos-sala button[data-modo="cartel"]');
    await p.waitForTimeout(700);
    const marca=await caja(p,'.sala-cartel .marca-c2');
    const nombre=await caja(p,'.sala-cartel h1');
    /* El marco blanco del QR, ya con el cartel a la vista. La librería
       deja el <canvas> en display:none y pone un <img>, así que apuntarle
       al dibujo con un selector doble agarra el canvas escondido y da
       cero: se mide el marco, que es lo que ocupa en la pantalla. */
    const qr=await caja(p,'.sala-cartel .qr-g');
    const cod=await caja(p,'.sala-cartel .cod-g');
    if(!(marca&&nombre&&qr&&cod)) mal('el cartel del salón no se dibujó entero');
    else if(!(qr.alto>40)) mal(`el QR del cartel no se dibujó (mide ${qr.alto}px)`);
    else{
      for(const [q,c] of [['el logo',marca],['el nombre de la fiesta',nombre],
                          ['el QR',qr],['el código',cod]]){
        if(!dentro(c,TELEFONO)) mal(`${q} del cartel se sale de la pantalla ${JSON.stringify(c)}`);
        else if(seMontan(c,modos)||seMontan(c,btns)) mal(`${q} del cartel queda tapado por los mandos`);
        else bien(`${q} del cartel se ve entero`);
      }
      /* El QR no puede comerse la pantalla: con 253px de alto no entraba
         nada más y el resto quedaba apretado abajo. */
      if(qr.alto>TELEFONO.height*0.28)
        mal(`el QR ocupa ${qr.alto}px de ${TELEFONO.height}: se come la pantalla`);
      else bien(`el QR mide ${qr.alto}px, no se come la pantalla`);
      /* Y el código de la fiesta —lo que la gente tipea— tiene que leerse.
         Estaba en 12px con 0.42em de separación. */
      const tam=await p.evaluate(()=>parseFloat(getComputedStyle(
        document.querySelector('.sala-cartel .cod-g')).fontSize));
      if(tam<15) mal(`el código del evento se dibuja en ${tam}px: no se lee`);
      else bien(`el código se dibuja en ${tam}px`);
    }

    /* Que se pueda cambiar de modo de verdad, no solo que se vea. */
    await p.click('.modos-sala button[data-modo="tablero"]');
    await p.waitForTimeout(700);
    const enTablero=await p.evaluate(()=>!document.querySelector('#salaTablero').hidden);
    if(!enTablero) mal('desde el celular no se puede cambiar de modo');
    else bien('desde el celular se cambia de modo');

    // ── plegar y desplegar ──
    await p.click('#plegarCinta'); await p.waitForTimeout(500);
    const chica=await caja(p,'#cinta-demo');
    const modos2=await caja(p,'.modos-sala');
    if(!chica||chica.alto>=cinta.alto) mal(`el ✕ no achica la cinta (${chica&&chica.alto}px)`);
    else bien(`el ✕ la achica de ${cinta.alto} a ${chica.alto}px`);
    if(!(modos2.y<modos.y)) mal('al achicar la cinta los controles no suben');
    else bien(`los controles suben de ${modos.y} a ${modos2.y}px`);
    /* Plegada no puede desaparecer: es la única salida al sitio. */
    if(!chica||chica.alto<10) mal('plegada queda invisible y no hay forma de volver');
    else bien('plegada sigue estando, para poder volver a abrirla');

    await p.click('#cinta-demo'); await p.waitForTimeout(500);
    const otra=await caja(p,'#cinta-demo');
    if(!otra||otra.alto!==cinta.alto) mal('tocando la cinta plegada no se vuelve a abrir');
    else bien('tocándola vuelve a abrirse');
    if(!(await p.locator('#cinta-demo a[href="/"]').count()))
      mal('no queda forma de salir de la demostración');
    else bien('vuelve con el enlace de salir');

    }
    if(errs.length) mal('errores JS: '+errs.join(' | '));
    await ctx.close();
  }

  // ═══ 2. por dónde entra el que ya contrató ═══
  // ═══ 1b. la presentación: los tres andando, arriba de todo ═══
  /* Decisión del dueño: lo primero que tiene que ver el que entra son los
     tres servicios funcionando de verdad, no una lista de lo que hacemos.
     Si alguna vez esa sección se va abajo, esto avisa. */
  console.log('\n─── los tres, andando, arriba de todo ───');
  {
    const ctx=await browser.newContext({viewport:TELEFONO});
    const p=await ctx.newPage();
    const errs=[]; p.on('pageerror',e=>errs.push(e.message));
    await p.goto(BASE+'/',{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(1200);
    const orden=await p.$$eval('section[id]',ns=>ns.map(n=>n.id));
    if(orden[0]!=='app')
      mal('la presentación no es lo primero: '+orden.slice(0,3).join(' · '));
    else bien('los tres andando son la primera sección');
    const piezas=await p.$$eval('#app .pieza',ns=>ns.map(n=>
      (n.querySelector('.pie-p b')||{}).textContent||'?'));
    if(piezas.length!==3) mal(`la presentación tiene ${piezas.length} piezas, no 3`);
    else bien('están las tres: '+piezas.join(' · '));
    /* Que cada una se toque y abra su demostración. */
    const abren=await p.$$eval('#app .pieza[data-abrir]',ns=>ns.map(n=>n.dataset.abrir));
    if(abren.length!==3) mal('alguna pieza no abre nada: '+abren.join(', '));
    else bien('las tres abren su prueba: '+abren.join(' · '));
    for(const d of abren){
      const r=await p.request.get(BASE+'/'+d.split('?')[0].replace(/\/$/,'/'));
      if(!r.ok()) mal(`${d} da ${r.status()}`);
      else bien(`${d} abre (${r.status()})`);
    }
    /* Y que en un teléfono no se salga ninguna de la pantalla. */
    const anchoDoc=await p.evaluate(()=>document.documentElement.scrollWidth);
    if(anchoDoc>TELEFONO.width+1)
      mal(`la página se va de ancho: ${anchoDoc}px en ${TELEFONO.width}`);
    else bien('nada se sale de ancho');
    for(const sel of ['#app .pieza.sala','#app .pieza.tel']){
      const c=await caja(p,sel);
      if(!dentro({...c,y:0,y2:1},TELEFONO)) mal(`${sel} se sale de la pantalla`);
      else bien(`${sel} entra a lo ancho`);
    }
    if(errs.length) mal('errores JS: '+errs.join(' | '));
    await ctx.close();
  }

  console.log('\n─── el que ya contrató ───');
  {
    const ctx=await browser.newContext({viewport:TELEFONO});
    const p=await ctx.newPage();
    const errs=[]; p.on('pageerror',e=>errs.push(e.message));
    await p.goto(BASE+'/',{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(1200);
    const hayEntrar = !!(await p.locator('#entrar').count());
    if(!hayEntrar) mal('la página no tiene apartado para el que ya contrató');
    else bien('la página tiene el apartado "Ya contrataste"');
    if(hayEntrar){
    const destinos=await p.$$eval('#entrar a[href]',ns=>ns.map(n=>n.getAttribute('href')));
    if(!destinos.some(h=>/^muro/.test(h))) mal('no lleva al panel del muro: '+destinos.join(', '));
    else bien('lleva al panel del muro');
    if(!destinos.some(h=>/^rollo/.test(h))) mal('no lleva al rollo: '+destinos.join(', '));
    else bien('lleva al rollo');
    /* Un enlace que da 404 es peor que no tenerlo. */
    for(const h of destinos){
      const u=BASE+'/'+h.split('#')[0];
      const r=await p.request.get(u);
      if(!r.ok()) mal(`${h} da ${r.status()}`);
      else bien(`${h} abre (${r.status()})`);
    }
    if(!(await p.locator('#nav .links a[href="#entrar"]').count()))
      mal('no se llega desde el menú');
    else bien('está en el menú de arriba');
    }
    if(errs.length) mal('errores JS: '+errs.join(' | '));
    await ctx.close();
  }

  // ═══ 3. el cliente entra con su código y su clave ═══
  console.log('\n─── entrar con el código, desde un teléfono nuevo ───');
  /* Así se vende: el evento lo arma Click Eterno y al cliente se le pasa
     el código y la clave. El rollo ya tenía esta puerta; el muro no, y
     había que mandarle el enlace largo armado a mano. */
  {
    const { crearFake } = require('./fakesb');
    const COD='QUI-7FCE64', CLAVE='ABC123';
    const ctx=await browser.newContext({viewport:TELEFONO});
    const p=await ctx.newPage();
    const errs=[]; p.on('pageerror',e=>errs.push(e.message));
    await p.route('**/cdnjs.cloudflare.com/**',r=>r.fulfill({status:200,
      contentType:'application/javascript',
      body:'window.QRCode=function(n){n.innerHTML="";};window.QRCode.CorrectLevel={M:0};'}));
    const fake=crearFake('ok'); await fake.instalar(p);
    fake.claves[COD]=CLAVE;
    fake.db.ce_eventos.push({codigo:COD,nombre:'Delfina',fecha:'2026-08-21',tipo:'XV',
      tono:'#D9AE72',moderar:false,cerrado:false,creado:1});

    /* Un teléfono donde nadie creó nada: sin claves guardadas y sin PIN. */
    await p.goto(BASE+'/muro.html#codigo',{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(1200);
    if(!(await p.locator('#codigoEv').count())){
      mal('no hay pantalla para entrar con el código');
    }else{
      bien('hay pantalla para entrar con el código, sin pedir el PIN del panel');
      /* Un código que no existe no puede dejarlo en la nada. */
      await p.fill('#codigoEv','QUI-0000'); await p.click('#irEvento');
      await p.waitForTimeout(1600);
      const perdido=await p.evaluate(()=>location.hash);
      if(!/codigo/.test(perdido)) mal('con un código equivocado queda en '+perdido);
      else bien('con un código equivocado vuelve a pedirlo');

      await p.goto(BASE+'/muro.html#codigo',{waitUntil:'domcontentloaded'});
      await p.waitForTimeout(1000);
      await p.fill('#codigoEv',COD.toLowerCase());   // lo va a escribir como venga
      await p.click('#irEvento'); await p.waitForTimeout(1800);
      if(!(await p.locator('#claveEv').count())) mal('con el código bueno no le pide la clave');
      else bien('con el código bueno le pide la clave');
      /* La clave equivocada no puede abrir el evento de un cliente. */
      await p.fill('#claveEv','NOPE'); await p.click('#entrarEv');
      await p.waitForTimeout(1600);
      if(await p.locator('[data-sol="pAjustes"]').count())
        mal('¡ENTRÓ CON LA CLAVE EQUIVOCADA!');
      else bien('con la clave equivocada no entra');

      await p.fill('#claveEv',CLAVE); await p.click('#entrarEv');
      await p.waitForTimeout(2000);
      if(!(await p.locator('[data-sol="pAjustes"]').count()))
        mal('con la clave buena tampoco entra');
      else bien('con la clave buena entra a manejar su evento');
    }
    /* Y se llega desde el panel, para el que ya está adentro. */
    await p.goto(BASE+'/muro.html#panel',{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(900);
    await p.fill('#pin','4321').catch(()=>{});
    await p.click('#entrar').catch(()=>{});
    await p.waitForTimeout(1400);
    if(!(await p.locator('[data-ir="codigo"]').count()))
      mal('desde el panel no se llega a entrar con un código');
    else bien('y desde el panel también se llega');
    if(errs.length) mal('errores JS: '+errs.join(' | '));
    await ctx.close();
  }

  await browser.close();
  console.log(fallas.length?`\n${fallas.length} FALLAS`:'\n✓ Sin fallas');
  process.exit(fallas.length?1:0);
})();
