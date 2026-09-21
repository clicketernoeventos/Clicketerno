/* ══════════════════════════════════════════════════════════════════
   ¿La web sabe dónde se abre?

   Pedido del dueño después de encontrar dos cosas rotas en su iPhone:
   "fijate que la web reconozca dónde se abre, que sea multidispositivo".
   No se mira, se mide: las mismas siete pantallas del producto abiertas
   en siete aparatos, de un iPhone SE de 320px a un proyector de 1920,
   pasando por el teléfono ACOSTADO y por las dos posiciones del iPad.
   Cuarenta y nueve combinaciones.

   Lo que se mide en cada una:

     1. Que nada se salga por el costado (sin contar lo que está adentro
        de algo que recorta a propósito, como la marquesina).
     2. Que las capas FIJAS que atajan el dedo no se monten entre ellas.
        Las decorativas tienen pointer-events:none y no cuentan; una capa
        que ocupa la pantalla entera es el fondo de esa pantalla, no un
        estorbo. Sin ese filtro el barrido informaba treinta choques por
        pantalla y ninguno era un problema.
     3. Que en un aparato táctil TODO lo que se toca llegue a 44x44.
        La regla existía pero era una lista de selectores escrita a mano,
        y la lista se queda corta sola: el "Salir" de la cinta medía
        26x11, y los mandos de la pantalla del salón, 29 de alto.
     4. Que los mandos fijos del salón no le tapen el cartel —el logo, el
        nombre de la fiesta, el QR y el código— en NINGÚN tamaño. En el
        teléfono parado ya estaba medido; acostado, el cartel no tiene su
        regla y los mandos vuelven a las esquinas.
     5. Que no haya un solo error de JavaScript en ninguna.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const { crearFake } = require('./fakesb');
/* Todo desde el mismo servidor: el de pruebas sirve la carpeta entera, y
   esta suite corre en la tanda del muro, donde el 8890 no está levantado. */
const M='http://127.0.0.1:8099', R=M;
const COD='QUI-7FCE64', CLAVE='ABC123';
const fallas=[]; const mal=m=>{fallas.push(m);console.log('  ✗ '+m);};
const bien=m=>console.log('  ✓ '+m);

const APARATOS=[
  {n:'iPhone SE',       w:320, h:568, dedo:true},
  {n:'iPhone',          w:390, h:844, dedo:true},
  {n:'iPhone acostado', w:844, h:390, dedo:true},
  {n:'iPad',            w:768, h:1024,dedo:true},
  {n:'iPad acostado',   w:1024,h:768, dedo:true},
  {n:'Notebook',        w:1280,h:800, dedo:false},
  {n:'Proyector',       w:1920,h:1080,dedo:false},
];

/* Todo lo que hay que saber de una pantalla, medido adentro del navegador. */
const MEDIR=`(${function(){
  const V={w:innerWidth,h:innerHeight};
  const caja=n=>{const b=n.getBoundingClientRect();
    return {x:Math.round(b.left),y:Math.round(b.top),x2:Math.round(b.right),
            y2:Math.round(b.bottom),w:Math.round(b.width),h:Math.round(b.height)};};
  const vis=n=>{const cs=getComputedStyle(n);
    return cs.display!=='none'&&cs.visibility!=='hidden'&&+cs.opacity>0.05
        && n.getBoundingClientRect().width>1;};
  const nombre=n=>n.tagName.toLowerCase()+(n.id?'#'+n.id:'')
    +(typeof n.className==='string'&&n.className?'.'+n.className.trim().split(/\s+/)[0]:'');
  /* ¿lo recorta algún padre? entonces no se sale de ningún lado */
  const recortado=n=>{
    for(let e=n.parentElement;e&&e!==document.body;e=e.parentElement)
      if(getComputedStyle(e).overflowX!=='visible') return true;
    return false;
  };
  const fijos=[...document.querySelectorAll('body *')].filter(n=>{
    const cs=getComputedStyle(n);
    if(cs.position!=='fixed'||!vis(n)||cs.pointerEvents==='none') return false;
    const b=n.getBoundingClientRect();
    if(b.height<=4) return false;
    if(b.width>=V.w-2 && b.height>=V.h-2) return false;
    return true;
  }).map(n=>({q:nombre(n),...caja(n)}));
  const chicos=[...document.querySelectorAll('button,a[href],[role=button],summary,input,select,[data-modo],[data-ir]')]
    .filter(vis).map(n=>({q:nombre(n),
      t:(n.textContent||n.getAttribute('aria-label')||'').trim().replace(/\s+/g,' ').slice(0,24),
      ...caja(n)})).filter(c=>c.w>0&&(c.w<44||c.h<44));
  const salidos=[...document.querySelectorAll('body *')].filter(n=>{
    if(!vis(n)) return false;
    const b=n.getBoundingClientRect();
    return b.width>2 && (b.right>V.w+1.5||b.left<-1.5) && !recortado(n);
  }).slice(0,5).map(n=>({q:nombre(n),...caja(n)}));
  /* el cartel del salón, si esta pantalla lo tiene */
  const cartel={};
  for(const [q,sel] of [['el logo','.sala-cartel .marca-c2'],['el nombre','.sala-cartel h1'],
                        ['el QR','.sala-cartel .qr-g'],['el código','.sala-cartel .cod-g']]){
    const n=document.querySelector(sel);
    if(n && vis(n)) cartel[q]=caja(n);
  }
  return {V,fijos,chicos,salidos,cartel};
}})()`;

const montan=(a,b)=>!!(a&&b&&a.x<b.x2&&b.x<a.x2&&a.y<b.y2&&b.y<a.y2);

(async()=>{
  const browser=await chromium.launch();
  const PANTALLAS=[
    ['la página pública',      M+'/index.html',                 2200],
    ['la política de privacidad', M+'/privacidad',              1400],
    ['los términos',           M+'/terminos',                   1400],
    ['la pantalla del salón',  M+'/muro.html#pantalla/'+COD,    2600],
    ['el panel',               M+'/muro.html#panel',            1600],
    ['el evento',              M+'/muro.html#evento/'+COD,      1800],
    ['lo que ve el invitado',  M+'/muro.html#subir/'+COD,       1600],
    ['el rollo revelado',      R+'/rollo.html?demo=1',          3000],
    ['el alta del rollo',      R+'/rollo.html#nuevo',           1600],
  ];
  for(const ap of APARATOS){
    console.log(`\n─── ${ap.n} · ${ap.w}x${ap.h}${ap.dedo?' · dedo':''} ───`);
    const ctx=await browser.newContext({viewport:{width:ap.w,height:ap.h},hasTouch:ap.dedo});
    await ctx.addInitScript(c=>{ try{
      localStorage.setItem('ce:claves',JSON.stringify(c));
      localStorage.setItem('ce:pin','4321'); sessionStorage.setItem('ce:pinOK','1');
    }catch(e){} },{[COD]:CLAVE});
    const p=await ctx.newPage();
    const errs=[]; p.on('pageerror',e=>errs.push(e.message));
    const fake=crearFake('ok'); await fake.instalar(p); fake.claves[COD]=CLAVE;
    fake.db.ce_eventos.push({codigo:COD,nombre:'Los 15 de Delfina',fecha:'2026-10-18',
      tipo:'XV',tono:'#D9AE72',moderar:false,cerrado:false,creado:Date.now(),
      camara:true,cupo_fotos:24,cupo_invitados:100,revelado:true});

    let sano=0;
    for(const [q,url,esp] of PANTALLAS){
      let d;
      try{
        await p.goto(url,{waitUntil:'domcontentloaded'});
        await p.waitForTimeout(esp);
        /* el cartel del salón no se muestra solo: la demostración entra
           proyectando el muro. Hay que pedirlo para poder medirlo. */
        if(/pantalla\//.test(url)){
          const b=await p.$('.modos-sala button[data-modo="cartel"]');
          if(b){ await b.click(); await p.waitForTimeout(700); }
        }
        d=await p.evaluate(MEDIR);
      }catch(e){ mal(`${q}: se cortó (${String(e.message).slice(0,70)})`); continue; }

      const problemas=[];
      if(d.salidos.length)
        problemas.push('se sale: '+d.salidos.map(s=>`${s.q}[${s.x}..${s.x2}]`).join(', '));
      for(let i=0;i<d.fijos.length;i++) for(let j=i+1;j<d.fijos.length;j++)
        if(montan(d.fijos[i],d.fijos[j]))
          problemas.push(`se montan ${d.fijos[i].q} y ${d.fijos[j].q}`);
      if(ap.dedo && d.chicos.length)
        problemas.push(`${d.chicos.length} sin área para el dedo: `
          +d.chicos.slice(0,3).map(c=>`"${c.t||c.q}" ${c.w}x${c.h}`).join(', '));
      /* El cartel del salón, tapado por los mandos. Ojo: si no se dibujó,
         no hay nada que medir y TODAS las cuentas de abajo darían bien
         sobre la nada. Que falte es una falla, no un silencio. */
      if(/pantalla\//.test(url)){
        const faltan=['el logo','el nombre','el QR','el código'].filter(k=>!d.cartel[k]);
        if(faltan.length) problemas.push('el cartel no se dibujó ('+faltan.join(', ')+')');
      }
      for(const [qc,c] of Object.entries(d.cartel)){
        for(const f of d.fijos) if(montan(c,f)) problemas.push(`${qc} del cartel queda tapado por ${f.q}`);
        if(c.x<-1||c.x2>d.V.w+1||c.y<-1||c.y2>d.V.h+1)
          problemas.push(`${qc} del cartel no entra en la pantalla`);
      }
      if(problemas.length) mal(`${q} — ${problemas.join('  ·  ')}`);
      else sano++;
    }
    if(sano===PANTALLAS.length) bien(`las ${sano} pantallas, bien`);
    if(errs.length) mal(`${ap.n}: errores de JavaScript · ${errs.slice(0,2).join(' | ')}`);
    await ctx.close();
  }
  await browser.close();
  console.log(fallas.length?`\n${fallas.length} FALLAS`:'\n✓ Sin fallas');
  process.exit(fallas.length?1:0);
})();
