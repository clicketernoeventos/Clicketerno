const { chromium } = require('playwright');
const { crearFake } = require('./fakesb');
const BASE='http://127.0.0.1:8099';
const fallas=[]; const mal=m=>{fallas.push(m);console.log('  ✗ '+m);};
const bien=m=>console.log('  ✓ '+m);

async function pagina(browser,{sinColumna=false,claves=null}={}){
  const ctx=await browser.newContext({viewport:{width:1280,height:800}});
  const p=await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.route('**/cdnjs.cloudflare.com/**',r=>r.fulfill({status:200,contentType:'application/javascript',
    body:'window.QRCode=function(n,o){n.innerHTML=`<canvas width=${o.width} height=${o.height}></canvas>`;};window.QRCode.CorrectLevel={M:0};'}));
  const fake=crearFake('ok');
  await fake.instalar(p);
  /* Eventos que ya existen con su clave: la base la reconoce y el aparato
     la tiene guardada, como quien creó la fiesta en este mismo celular. */
  if(claves){
    Object.assign(fake.claves,claves);
    await ctx.addInitScript(cl=>{ try{ localStorage.setItem('ce:claves',JSON.stringify(cl)); }catch(e){} },claves);
  }
  if(sinColumna){
    // la base rechaza la columna nueva, como si no se hubiera corrido el SQL
    await p.route('**/rest/v1/ce_eventos*',async route=>{
      const req=route.request();
      if(req.method()==='POST' && (req.postData()||'').includes('"lanza"'))
        return route.fulfill({status:400,contentType:'application/json',
          body:JSON.stringify({code:'PGRST204',message:"Could not find the 'lanza' column of 'ce_eventos' in the schema cache"})});
      return route.fallback();
    });
  }
  return {ctx,p,errs,fake};
}
const EVENTO=extra=>Object.assign({codigo:'QUI-7FCE64',nombre:'Delfina',fecha:'2026-08-21',
  tono:'#D9AE72',moderar:false,cerrado:false,creado:1},extra||{});

(async()=>{
  const browser=await chromium.launch();

  // ═══ 1. clave maestra ═══
  console.log('\n─── clave maestra ───');
  {
    const {ctx,p,errs,fake}=await pagina(browser);
    fake.db.ce_eventos.push(EVENTO());
    await p.goto(BASE+'/muro.html#panel',{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(900);
    await p.fill('#pin','999999'); await p.click('#entrar'); await p.waitForTimeout(800);
    const conOtra=await p.evaluate(()=>!!document.querySelector('#crear'));
    // con clave propia nueva entra igual (es la primera vez): eso es lo esperado
    if(!conOtra) mal('una clave nueva cualquiera no deja entrar la primera vez');
    else bien('una clave nueva propia entra y queda guardada');

    // ahora ya hay clave guardada: una equivocada NO debe entrar, la maestra SÍ
    await p.evaluate(()=>{sessionStorage.clear();});
    await p.goto('about:blank');   // ir al mismo hash no recarga
    await p.goto(BASE+'/muro.html#panel',{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(800);
    await p.fill('#pin','111111'); await p.click('#entrar'); await p.waitForTimeout(700);
    if(await p.evaluate(()=>!!document.querySelector('#crear'))) mal('una clave equivocada entró igual');
    else bien('una clave equivocada no entra');

    await p.click('#modoAdmin'); await p.waitForTimeout(200);
    await p.fill('#pin','CLAVE-MAESTRA-DE-PRUEBA'); await p.click('#entrar'); await p.waitForTimeout(900);
    const entroAdmin=await p.evaluate(()=>!!document.querySelector('#crear'));
    const sello=await p.evaluate(()=>!!document.querySelector('.sello-admin'));
    if(!entroAdmin) mal('la clave maestra NO entra');
    else bien('la clave maestra entra sin saber la clave del aparato');
    if(!sello) mal('no se ve la marca de administrador');
    else bien('se ve la marca de administrador');
    if(errs.length) mal('errores JS: '+errs.join(' | '));
    await ctx.close();
  }

  // ═══ 1b. la maestra NUNCA se guarda en el disco ═══
  console.log('\n─── la maestra no queda escrita en el teléfono ───');
  /* La clave maestra vive en sessionStorage y se muere al cerrar la
     pestaña: es la llave que abre TODOS los eventos de todos los
     clientes. Pero si se la escribía en el campo "clave de este evento"
     —que es lo natural cuando querés entrar a la fiesta de un cliente
     desde otro teléfono— se guardaba en ce:claves, en localStorage, como
     si fuera la clave de ese evento. Ahí queda para siempre. La base ya
     nos dice cuál es (es_maestra) y lo estábamos ignorando. */
  {
    const {ctx,p,errs,fake}=await pagina(browser);
    fake.db.ce_eventos.push(EVENTO());
    await p.goto(BASE+'/muro.html#evento/QUI-7FCE64',{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(1400);
    if(!(await p.locator('#claveEv').count())) mal('no pidió la clave del evento');
    else{
      bien('sin clave guardada, pide la clave del evento');
      await p.fill('#claveEv','CLAVE-MAESTRA-DE-PRUEBA');
      await p.click('#entrarEv'); await p.waitForTimeout(1800);
      const guardadas=await p.evaluate(()=>{
        try{ return localStorage.getItem('ce:claves')||''; }catch(e){ return 'no pude leer'; }});
      if(/CLAVE-MAESTRA-DE-PRUEBA/.test(guardadas))
        mal('¡LA MAESTRA QUEDÓ ESCRITA EN EL DISCO!: '+guardadas);
      else bien('la maestra no queda en localStorage: '+(guardadas||'(vacío)'));
      const enSesion=await p.evaluate(()=>{
        try{ return sessionStorage.getItem('ce:maestra')||''; }catch(e){ return ''; }});
      if(enSesion!=='CLAVE-MAESTRA-DE-PRUEBA')
        mal('tampoco quedó en sessionStorage: no se puede seguir trabajando');
      else bien('queda en sessionStorage, que se borra al cerrar la pestaña');
      if(!(await p.locator('[data-sol="pAjustes"]').count()))
        mal('con la maestra no entró a manejar el evento');
      else bien('y entra igual a manejar el evento');
    }
    if(errs.length) mal('errores JS: '+errs.join(' | '));
    await ctx.close();
  }

  // ═══ 2. programar apertura ═══
  console.log('\n─── programar la apertura ───');
  {
    const {ctx,p,errs,fake}=await pagina(browser);
    const enUnRato=new Date(Date.now()+3*3600e3);
    const iso=d=>new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);
    fake.db.ce_eventos.push(EVENTO({lanza:iso(enUnRato)}));
    // invitado: debe ver la cuenta, no el formulario
    await p.goto(BASE+'/muro.html#subir/QUI-7FCE64',{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(1100);
    const r=await p.evaluate(()=>({
      espera:!!document.querySelector('.espera-lanza'),
      form:!!document.querySelector('#enviar'),
      digitos:(document.querySelector('#cuentaEspera')||{}).textContent||''
    }));
    if(!r.espera||r.form) mal('antes de la hora el invitado ve el formulario igual');
    else bien('antes de la hora el invitado ve la cuenta regresiva');
    if(!/\d/.test(r.digitos)) mal('la cuenta regresiva no muestra números');
    else bien('la cuenta corre: '+r.digitos.replace(/\s+/g,' ').trim().slice(0,40));

    // ya pasada la hora: formulario normal
    fake.db.ce_eventos[0].lanza=iso(new Date(Date.now()-3600e3));
    await p.goto('about:blank');
    await p.goto(BASE+'/muro.html#subir/QUI-7FCE64',{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(1000);
    if(!(await p.evaluate(()=>!!document.querySelector('#enviar'))))
      mal('pasada la hora sigue sin dejar subir');
    else bien('pasada la hora el invitado puede subir');
    if(errs.length) mal('errores JS: '+errs.join(' | '));
    await ctx.close();
  }

  // ═══ 3. la base sin la columna nueva ═══
  console.log('\n─── base sin la columna "lanza" ───');
  {
    const {ctx,p,errs,fake}=await pagina(browser,{sinColumna:true,claves:{'QUI-7FCE64':'ABC123'}});
    fake.db.ce_eventos.push(EVENTO());
    await p.goto(BASE+'/muro.html#evento/QUI-7FCE64',{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(1300);
    await p.click('[data-sol="pAjustes"]'); await p.waitForTimeout(400);
    await p.fill('#lanza','2026-08-21T21:00');
    await p.click('#guardarL'); await p.waitForTimeout(1400);
    const msg=await p.locator('#recado').innerText().catch(()=>'');
    const vivo=await p.evaluate(()=>(document.getElementById('app').innerText||'').trim().length>0);
    if(!vivo) mal('la app queda en blanco si falta la columna');
    else bien('la app sigue viva si falta la columna');
    if(/^listo/i.test(msg.trim())) mal(`DICE QUE GUARDÓ Y NO GUARDÓ: "${msg.trim()}"`);
    else if(!/columna|horario/i.test(msg)) mal(`no avisa qué pasó (dijo: "${msg.trim()}")`);
    else bien('avisa que falta la columna: "'+msg.trim()+'"');
    // y lo demás se tiene que poder seguir guardando
    await p.click('[data-sol="pAjustes"]').catch(()=>{});
    await p.waitForTimeout(500);
    if(await p.locator('#guardarC').count()){
      await p.click('#guardarC'); await p.waitForTimeout(900);
      const m2=await p.locator('#recado').innerText().catch(()=>'');
      if(/no se pudo/i.test(m2)) mal('con la columna faltante se rompe también guardar consignas');
      else bien('las consignas se siguen guardando igual');
    }
    if(errs.length) mal('errores JS: '+errs.join(' | '));
    await ctx.close();
  }

  // ═══ 4. pantalla del salón: los tres modos ═══
  console.log('\n─── pantalla del salón: código, tablero y muro ───');
  {
    const {ctx,p,errs,fake}=await pagina(browser);
    fake.db.ce_eventos.push(EVENTO());
    const FOTO=(c)=>'data:image/svg+xml;utf8,'+encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1300"><rect width="900" height="1300" fill="${c}"/></svg>`);
    const COL=['%23243329','%23241C14','%232B2233','%231C2A3A','%233B2028'];
    COL.forEach((c,i)=>fake.db.ce_items.push({id:'p'+i,codigo:'QUI-7FCE64',kind:'foto',
      url:FOTO(c),autor:['Tomás','Mica y Juli','Nacho','Sofía','Las primas'][i],
      texto:i%2?'Qué noche':'',estado:'aprobado',ts:Date.now()-i*9000}));  // p0 es la más nueva
    ['Que sea una noche eterna','Nunca los vi tan felices','Qué viva la novia']
      .forEach((t,i)=>fake.db.ce_items.push({id:'m'+i,codigo:'QUI-7FCE64',kind:'mensaje',
        url:'',autor:['Tío Beto','Caro','Sofi'][i],texto:t,estado:'aprobado',ts:Date.now()-120000-i*4000}));

    await p.goto(BASE+'/muro.html#pantalla/QUI-7FCE64',{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(1800);

    const modos=await p.evaluate(()=>[...document.querySelectorAll('[data-modo]')].map(b=>b.dataset.modo));
    if(modos.join(',')!=='cartel,tablero,muro') mal('faltan modos: '+modos.join(','));
    else bien('hay tres modos: código · tablero · muro');

    // cartel
    let e=await p.evaluate(()=>({
      cartel:document.querySelector('#salaCartel').getBoundingClientRect().height>0,
      qr:!!document.querySelector('#qrGrande canvas')}));
    if(!e.cartel||!e.qr) mal('no arranca en el cartel con el QR');
    else bien('arranca en el cartel con el QR grande');

    // tablero
    await p.click('[data-modo="tablero"]'); await p.waitForTimeout(1500);
    e=await p.evaluate(()=>{
      const t=document.querySelector('#salaTablero');
      const alto=el=>el?el.getBoundingClientRect().height:0;
      return {visible:alto(t)>0,
        cartelTapando:alto(document.querySelector('#salaCartel'))>0,
        muroTapando:alto(document.querySelector('#tela'))>0,
        cuadro:!!document.querySelector('#telaT .toma'),
        foto:!!document.querySelector('#telaT .toma img'),
        autor:(document.querySelector('#telaT .autoria .quien')||{}).textContent||'',
        cuando:(document.querySelector('#telaT .cuando-f')||{}).textContent||'',
        avatar:(document.querySelector('#telaT .avatar')||{}).textContent||'',
        proximos:document.querySelectorAll('#colaTab .prox').length,
        qr:!!document.querySelector('#qrTab canvas'),
        dichos:document.querySelectorAll('#tiraTab .dicho').length,
        total:(document.querySelector('#totalTab')||{}).textContent||''};
    });
    if(!e.visible) mal('el tablero no se muestra');
    else bien('el tablero se muestra');
    if(e.cartelTapando) mal('el cartel sigue visible encima del tablero');
    else bien('el cartel desaparece al pasar al tablero');
    if(e.muroTapando) mal('el muro sigue visible encima del tablero');
    if(!e.cuadro) mal('el tablero no proyecta NADA en el recuadro grande');
    else if(!e.foto) mal('el recuadro grande no muestra la imagen');
    else bien('proyecta la foto grande');
    if(!e.autor||!e.cuando) mal('falta el autor o el "hace cuánto"');
    else bien(`muestra autor y tiempo: ${e.avatar} ${e.autor.trim()} · ${e.cuando.trim()}`);
    if(e.proximos<1) mal('el costado "entrando ahora" está vacío');
    else bien(`el costado muestra ${e.proximos} que vienen entrando`);
    if(!e.qr) mal('el QR del tablero no se dibuja');
    else bien('el QR queda a la vista mientras se proyecta');
    if(e.dichos<1) mal('la tira de dedicatorias está vacía');
    else bien(`la tira corre con ${e.dichos} dedicatorias`);
    if(!/\d/.test(e.total)) mal('no muestra el total de recuerdos');
    else bien('el total dice: '+e.total.replace(/\s+/g,' ').trim());

    // que entre en pantallas de proyector
    for(const [an,al] of [[1920,1080],[1366,768],[1280,720]]){
      await p.setViewportSize({width:an,height:al});
      await p.waitForTimeout(500);
      const corte=await p.evaluate(()=>{
        const r=el=>el?el.getBoundingClientRect():null;
        const cab=r(document.querySelector('.tab-cabeza'));
        const pil=r(document.querySelector('.modos-sala'));
        const sal=r(document.querySelector('.dejar'));
        const choca=(a,b)=>a&&b&&a.top<b.bottom&&a.bottom>b.top&&a.left<b.right&&a.right>b.left;
        return {alto:document.documentElement.scrollHeight>window.innerHeight+1,
                ancho:document.documentElement.scrollWidth>window.innerWidth+1,
                tapada:choca(cab,pil)||choca(cab,sal)};});
      if(corte.alto||corte.ancho) mal(`el tablero no entra en ${an}x${al}`);
      else if(corte.tapada) mal(`en ${an}x${al} los botones tapan la cabecera del tablero`);
      else bien(`el tablero entra y se lee entero en ${an}x${al}`);
    }
    await p.setViewportSize({width:1600,height:900}); await p.waitForTimeout(400);

    // muro
    await p.click('[data-modo="muro"]'); await p.waitForTimeout(1400);
    e=await p.evaluate(()=>{
      const alto=el=>el?el.getBoundingClientRect().height:0;
      return {muro:alto(document.querySelector('#tela'))>0,
        foto:!!document.querySelector('#tela .toma img'),
        tablero:alto(document.querySelector('#salaTablero'))>0};});
    if(!e.muro||e.tablero) mal('no pasa al muro');
    else bien('pasa al muro a pantalla completa');
    if(!e.foto) mal('el muro no muestra fotos');
    else bien('el muro proyecta');

    // la barra rota entre los tres
    await p.keyboard.press('Space'); await p.waitForTimeout(800);
    const tras=await p.evaluate(()=>[...document.querySelectorAll('[data-modo]')]
      .find(b=>b.getAttribute('aria-pressed')==='true').dataset.modo);
    if(tras!=='cartel') mal('la barra no rota los modos (quedó en '+tras+')');
    else bien('la barra rota los tres modos');

    if(errs.length) mal('errores JS: '+errs.join(' | '));
    await ctx.close();
  }

  // ═══ 5. base vieja: todavía no se corrió el SQL de claves ═══
  console.log('\n─── base sin las claves instaladas ───');
  {
    const {ctx,p,errs,fake}=await pagina(browser);
    fake.db.ce_eventos.push(EVENTO());
    // la función no existe, como en una base a la que no se le corrió el SQL
    await p.route('**/rest/v1/rpc/ce_quien_soy',r=>r.fulfill({status:404,
      contentType:'application/json',
      body:JSON.stringify({code:'PGRST202',message:'Could not find the function public.ce_quien_soy'})}));
    await p.goto(BASE+'/muro.html#evento/QUI-7FCE64',{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(1500);
    const r=await p.evaluate(()=>({
      pide:!!document.querySelector('#claveEv'),
      panel:!!document.querySelector('[data-sol="pAjustes"]')}));
    if(r.pide||!r.panel) mal('con la base vieja deja a todos afuera de sus eventos');
    else bien('con la base vieja no pide clave: nadie queda afuera');
    if(errs.length) mal('errores JS: '+errs.join(' | '));
    await ctx.close();
  }

  /* ══ la cinta de dedicatorias del tablero ══
     Reportado desde el proyector de verdad: "pasa rapidísimo y trabado
     como volviéndose loco". Medido en 1920: la animación duraba 44s
     fijos, así que la velocidad la mandaba el ANCHO —cuatro dedicatorias
     a 53 px/s, diez a 175, el triple— y encima había una sola copia, así
     que al terminar pegaba un salto. Y cada dedicatoria nueva reemplazaba
     el HTML y reiniciaba la animación desde cero. */
  {
    console.log('\n─── la cinta de dedicatorias ───');
    const ctx=await browser.newContext({viewport:{width:1920,height:1080}});
    await ctx.addInitScript(()=>{ try{
      localStorage.setItem('ce:pin','4321'); sessionStorage.setItem('ce:pinOK','1');
    }catch(e){} });
    const p=await ctx.newPage();
    const errs=[]; p.on('pageerror',e=>errs.push(e.message));
    await p.route('**/cdnjs.cloudflare.com/**',r=>r.fulfill({status:200,
      contentType:'application/javascript',
      body:'window.QRCode=function(n,o){n.innerHTML="<canvas></canvas>";};window.QRCode.CorrectLevel={M:0};'}));
    const COD='QUI-TIRA01';
    const fake=crearFake('ok'); await fake.instalar(p); fake.claves[COD]='ABC123';
    fake.db.ce_eventos.push({codigo:COD,nombre:'Los 15 de Delfina',fecha:'2026-10-18',
      tipo:'XV',tono:'#D9AE72',moderar:false,cerrado:false,creado:Date.now()});
    const meter=(n,desde)=>{ for(let i=0;i<n;i++) fake.db.ce_items.push({
      id:'t'+(desde+i),codigo:COD,kind:'mensaje',url:'',autor:'Invitado '+(desde+i),
      texto:'Qué noche increíble, no me la olvido más en la vida '+(desde+i),
      estado:'aprobado',ts:Date.now()+desde+i}); };

    meter(4,0);
    await p.goto(BASE+'/muro.html#pantalla/'+COD,{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(2000);
    await p.click('.modos-sala button[data-modo="tablero"]');
    await p.waitForTimeout(2200);

    /* La velocidad de verdad: una copia de la tira dividido el tiempo del
       giro. Dos copias recorren media tira por vuelta. */
    const medir=()=>p.evaluate(()=>{
      const t=document.querySelector('.tab-tira .pista-t');
      if(!t) return null;
      const quieta=t.classList.contains('quieta');
      const ancho=t.getBoundingClientRect().width;
      const seg=parseFloat(getComputedStyle(t).animationDuration)||0;
      const a=(t.getAnimations()[0])||null;
      return {quieta, hijos:t.children.length, ancho:Math.round(ancho), seg,
              px_s: seg? Math.round((ancho/2)/seg) : 0,
              reloj: a? Number(a.currentTime)||0 : 0};
    });

    const con4=await medir();
    if(!con4) mal('la cinta de dedicatorias no se dibujó');
    else{
      bien(`con 4 dedicatorias: ${con4.px_s} px/s`);
      /* Duplicada: sin la segunda copia el bucle pega un salto al volver. */
      if(con4.hijos!==8) mal(`la cinta no está duplicada (${con4.hijos} hijos para 4 dedicatorias)`);
      else bien('la cinta va duplicada, así el bucle no salta');

      meter(20,10);
      await p.waitForTimeout(9000);
      const con10=await medir();
      bien(`con el tope de 10: ${con10.px_s} px/s`);
      /* Lo que se rompió: la velocidad NO puede depender de cuántas haya. */
      const dif=Math.abs(con10.px_s-con4.px_s);
      if(dif>10) mal(`la velocidad cambia con la cantidad: ${con4.px_s} → ${con10.px_s} px/s`);
      else bien('la velocidad no cambia con la cantidad');

      /* Acá había una cuarta comprobación —"al llegar una dedicatoria
         nueva la cinta no vuelve al principio"— y se sacó porque PASABA
         CON EL CÓDIGO VIEJO TAMBIÉN: reemplazar los hijos con innerHTML
         NO reinicia la animación CSS del padre, que es quien la tiene.
         Era una hipótesis mía, la medición la desmintió, y una prueba que
         pasa de los dos lados no prueba nada. */
    }

    /* Una sola dedicatoria corta no tiene por qué desfilar. */
    const COD2='QUI-TIRA02';
    fake.claves[COD2]='ABC123';
    fake.db.ce_eventos.push({codigo:COD2,nombre:'Chica',fecha:'2026-10-18',tipo:'XV',
      tono:'#D9AE72',moderar:false,cerrado:false,creado:Date.now()});
    fake.db.ce_items.push({id:'u1',codigo:COD2,kind:'mensaje',url:'',autor:'Ana',
      texto:'Felicidades',estado:'aprobado',ts:Date.now()});
    await p.goto(BASE+'/muro.html#pantalla/'+COD2,{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(2000);
    await p.click('.modos-sala button[data-modo="tablero"]');
    await p.waitForTimeout(2200);
    const corta=await medir();
    if(corta && !corta.quieta) mal('una sola dedicatoria corta desfila igual, y no llena el ancho');
    else bien('una dedicatoria que entra en la pantalla se queda quieta');

    if(errs.length) mal('errores JS: '+errs.join(' | '));
    await ctx.close();
  }

  /* ══ las dos puertas: el que contrató y el invitado ══
     Entraban por la misma. "Soy invitado" mostraba la lista de eventos
     guardados EN ESE CELULAR, que en el teléfono de un invitado está
     vacía y le decía "Creá uno desde el panel del organizador", que no es
     lo suyo. Y al que contrató no había puerta que lo llevara: había que
     saberse la dirección #codigo de memoria.
     Y el código: el invitado lo lee del cartel con el teléfono en una
     mano. Minúscula, sin guión o solo los seis del final tienen que
     entrar igual — pedirle precisión a alguien en una fiesta no sirve. */
  {
    console.log('\n─── entrar: el que contrató y el invitado ───');
    const ctx=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});
    const p=await ctx.newPage();
    const errs=[]; p.on('pageerror',e=>errs.push(e.message));
    await p.route('**/cdnjs.cloudflare.com/**',r=>r.fulfill({status:200,
      contentType:'application/javascript',
      body:'window.QRCode=function(n){n.innerHTML="";};window.QRCode.CorrectLevel={M:0};'}));
    const COD='QUI-7FCE64';
    const fake=crearFake('ok'); await fake.instalar(p); fake.claves[COD]='ABC123';
    fake.db.ce_eventos.push({codigo:COD,nombre:'Los 15 de Delfina',fecha:'2026-10-18',
      tipo:'XV',tono:'#D9AE72',moderar:false,cerrado:false,creado:Date.now()});

    await p.goto(BASE+'/muro.html#portada',{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(1500);
    const puertas=await p.$$eval('.puerta',ns=>ns.map(n=>({
      t:(n.querySelector('b')||{}).textContent||'', ir:n.dataset.ir })));
    const dice=re=>puertas.find(x=>re.test(x.t));
    const pContrato=dice(/contrat/i), pInv=dice(/invitado/i);
    if(!pContrato) mal('la portada no tiene puerta para el que ya contrató');
    else if(pContrato.ir!=='codigo') mal(`la puerta del que contrató va a "${pContrato.ir}"`);
    else bien('la portada tiene la puerta del que contrató, y va al código');
    if(!pInv) mal('la portada no tiene puerta de invitado');
    else if(pInv.ir===pContrato?.ir) mal('el invitado y el que contrató entran por la misma puerta');
    else bien('la del invitado es otra');

    /* Las cinco maneras en que una persona escribe un código. */
    for(const [q,escrito] of [['tal cual','QUI-7FCE64'],['en minúscula','qui-7fce64'],
                              ['sin el guión','qui7fce64'],['solo los seis del final','7fce64'],
                              ['con espacios de más',' Qui 7fce64 ']]){
      await p.goto(BASE+'/muro.html#invitado',{waitUntil:'domcontentloaded'});
      await p.waitForTimeout(1100);
      if(!(await p.locator('#codInv').count())){
        mal('la pantalla del invitado no tiene dónde escribir el código');
        break;
      }
      await p.fill('#codInv',escrito);
      await p.click('#irFiesta');
      await p.waitForTimeout(2500);
      const h=await p.evaluate(()=>location.hash);
      if(h!=='#subir/'+COD) mal(`escrito ${q} ("${escrito}") no entra: quedó en ${h}`);
      else bien(`escrito ${q} entra igual`);
    }

    /* Un código cuyo prefijo NO conocemos tiene que sobrevivir entero.
       La primera versión del normalizador sacaba el guión de todo lo que
       no empezara con un prefijo de la lista, así que "TEST-1" quedaba
       "TEST1" y el evento dejaba de existir. Lo agarró rollo_navegador
       con un código de prueba: destruir un dato bueno es peor que no
       normalizar nada. */
    fake.db.ce_eventos.push({codigo:'TEST-1',nombre:'Rara',fecha:'2026-10-18',
      tipo:'XV',tono:'#D9AE72',moderar:false,cerrado:false,creado:Date.now()});
    await p.goto(BASE+'/muro.html#invitado',{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(1100);
    if(await p.locator('#codInv').count()){
      await p.fill('#codInv','test-1');
      await p.click('#irFiesta');
      await p.waitForTimeout(2500);
      const h=await p.evaluate(()=>location.hash);
      if(h!=='#subir/TEST-1') mal(`un código con prefijo desconocido se rompe: quedó en ${h}`);
      else bien('un código con prefijo desconocido entra entero');
    }

    /* Y lo más importante: al invitado NO se le pide ninguna clave. */
    const clavePedida=await p.evaluate(()=>
      document.querySelectorAll('input[type=password]').length);
    if(clavePedida) mal('al invitado le piden una clave para subir una foto');
    else bien('al invitado no le piden ninguna clave');

    /* Un código que no existe: se le dice, y no se lo manda a una pantalla
       rota. Antes iba derecho al evento y el error aparecía después. */
    /* Con guarda: si el campo no está, esta prueba tiene que INFORMARLO,
       no morirse. Una suite que revienta a la mitad tapa todo lo que
       venía después. */
    await p.goto(BASE+'/muro.html#invitado',{waitUntil:'domcontentloaded'});
    await p.waitForTimeout(1100);
    if(!(await p.locator('#codInv').count()))
      mal('no hay campo de código: no se puede probar el código inexistente');
    else{
      await p.fill('#codInv','zzz999');
      await p.click('#irFiesta');
      await p.waitForTimeout(3000);
      const quedo=await p.evaluate(()=>location.hash);
      const aviso=await p.evaluate(()=>/no encontr/i.test(document.body.innerText));
      if(quedo!=='#invitado') mal(`con un código inexistente se fue a ${quedo}`);
      else if(!aviso) mal('con un código inexistente no le dice nada');
      else bien('con un código inexistente se lo dice y lo deja donde estaba');
    }

    if(errs.length) mal('errores JS: '+errs.join(' | '));
    await ctx.close();
  }

  /* ══ SE PUEDE PONER EN LA PANTALLA DEL TELÉFONO ══
     El competidor lo tiene y nosotros no lo teníamos. Son cuatro piezas y
     si falta una el navegador se calla: ni un error, simplemente no
     ofrece instalarla. Por eso se prueban las cuatro, y contra el
     servidor de verdad (que manda el tipo de contenido correcto), no
     mirando el HTML. */
  {
    const ctx=await browser.newContext({viewport:{width:390,height:844}});
    const p=await ctx.newPage();
    for(const app of ['muro','rollo']){
      await p.goto(`${BASE}/${app}.html`,{waitUntil:'domcontentloaded'});
      await p.waitForTimeout(400);
      const href=await p.evaluate(()=>{
        const l=document.querySelector('link[rel=manifest]');
        return l?l.href:null;
      });
      if(!href){ mal(`${app}: no declara manifiesto, no se puede instalar`); continue; }
      const r=await p.request.get(href);
      if(!r.ok()){ mal(`${app}: el manifiesto da ${r.status()}`); continue; }
      if(!/manifest\+json|application\/json/.test(r.headers()['content-type']||''))
        mal(`${app}: el manifiesto se sirve como ${r.headers()['content-type']}, el navegador lo ignora`);
      let m=null; try{ m=JSON.parse(await r.text()); }catch(e){}
      if(!m){ mal(`${app}: el manifiesto no es JSON válido`); continue; }
      const faltan=['name','short_name','start_url','display','icons']
        .filter(k=>!m[k]||(Array.isArray(m[k])&&!m[k].length));
      if(faltan.length) mal(`${app}: al manifiesto le faltan ${faltan.join(', ')}`);
      else bien(`${app}: el manifiesto está completo`);
      if(m.display!=='standalone') mal(`${app}: display es "${m.display}", se abre con la barra del navegador`);
      /* Un icono declarado que da 404 es peor que no declararlo: el sistema
         pone un cuadrado gris con la inicial. */
      let rotos=0;
      for(const ic of m.icons||[]){
        const ri=await p.request.get(new URL(ic.src,href).href);
        if(!ri.ok()||!/^image\//.test(ri.headers()['content-type']||'')) rotos++;
      }
      if(rotos) mal(`${app}: ${rotos} iconos del manifiesto no se bajan`);
      else bien(`${app}: los ${(m.icons||[]).length} iconos se bajan`);
      if(!(m.icons||[]).some(i=>/maskable/.test(i.purpose||'')))
        mal(`${app}: sin icono "maskable", Android le recorta el logo`);
      /* iOS no lee el manifiesto: mira estas dos. Sin ellas, "Añadir a
         pantalla de inicio" guarda un acceso que abre Safari con su barra. */
      const ios=await p.evaluate(()=>({
        capaz:!!document.querySelector('meta[name="apple-mobile-web-app-capable"][content="yes"]'),
        icono:(document.querySelector('link[rel="apple-touch-icon"]')||{}).href||null
      }));
      if(!ios.capaz) mal(`${app}: en el iPhone se abriría con la barra de Safari`);
      if(!ios.icono) mal(`${app}: sin icono para el iPhone`);
      else{
        const ri=await p.request.get(ios.icono);
        if(!ri.ok()) mal(`${app}: el icono del iPhone da ${ri.status()}`);
        else bien(`${app}: el iPhone la puede poner en la pantalla de inicio`);
      }
    }
    await ctx.close();
  }

  await browser.close();
  console.log(fallas.length?`\n${fallas.length} FALLAS`:'\n✓ Sin fallas');
})();
