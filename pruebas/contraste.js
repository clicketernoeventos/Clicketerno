/* ══════════════════════════════════════════════════════════════════
   ¿Se LEE lo que dice la página?

   Vino de una foto de la pantalla del dueño: en la sección clara los
   títulos de las tarjetas no se veían. Texto claro sobre fondo crema,
   y en el monitor donde se escribió el CSS no se notaba porque la
   sección de arriba es negra y uno mira la de arriba.

   "Eso lo tenés que prever" — y se puede: el contraste no se opina, se
   calcula. Esta prueba recorre TODO el texto de todas las pantallas,
   le pregunta al navegador de qué color quedó y sobre qué fondo cayó,
   y saca la razón de contraste de la WCAG. Abajo de 3 no se lee: no es
   "poco contraste", es que no está.

   Mide el color EFECTIVO (con la opacidad heredada y las capas
   translúcidas encima), no el que dice la hoja de estilos, que es
   justamente donde se escondía el error.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const { crearFake } = require('./fakesb');
const S='http://127.0.0.1:8099';
const COD='QUI-7FCE64', CLAVE='ABC123';
const fallas=[]; const mal=m=>{fallas.push(m);console.log('  ✗ '+m);};
const bien=m=>console.log('  ✓ '+m);

/* El mínimo de la WCAG para texto normal es 4.5 y para texto grande 3.
   Acá el piso es 3 para todo: no venimos a certificar accesibilidad,
   venimos a que no haya texto invisible. Lo que baja de 3 está roto. */
const PISO=3;

const MEDIDOR=`(${function(){
  const num=s=>{ const m=String(s).match(/[\d.]+/g)||[]; return m.map(Number); };
  const mezclar=(fr,at)=>{ // fr con alfa sobre at, opaco
    const a=fr[3]===undefined?1:fr[3];
    return [0,1,2].map(i=>fr[i]*a + at[i]*(1-a)).concat(1);
  };
  const luz=c=>{ const f=c.slice(0,3).map(v=>{ const s=v/255;
      return s<=0.03928 ? s/12.92 : Math.pow((s+0.055)/1.055,2.4); });
    return 0.2126*f[0]+0.7152*f[1]+0.0722*f[2]; };
  const razon=(a,b)=>{ const l1=luz(a), l2=luz(b);
    return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05); };
  /* el fondo que de verdad queda atrás: el primer ancestro que pinte */
  const fondoDe=n=>{
    /* Se sube hasta el primer fondo OPACO: ese es el piso que pinta.
       Si antes de llegar aparece un degradé o una foto, no sabemos de
       qué color quedó y no lo juzgamos (mejor callar que inventar una
       falla). Antes se cortaba con CUALQUIER degradé del árbol, aunque
       estuviera por encima de un fondo opaco, y así se salteaba media
       página: por eso la primera corrida decía "41 textos" en una
       página que tiene cientos. */
    let pila=[];
    for(let e=n; e; e=e.parentElement){
      const cs=getComputedStyle(e);
      if(cs.backgroundImage && cs.backgroundImage!=='none') return null;
      let c=num(cs.backgroundColor);
      if(c.length>=3){
        if(c.length===3) c=c.concat(1);
        if(c[3]>0) pila.push(c);
        if(c[3]>=1){ let sobre=pila.pop();
          for(let i=pila.length-1;i>=0;i--) sobre=mezclar(pila[i],sobre);
          return sobre; }
      }
    }
    let sobre=[255,255,255,1];
    for(let i=pila.length-1;i>=0;i--) sobre=mezclar(pila[i],sobre);
    return sobre;
  };
  const visible=e=>{
    const cs=getComputedStyle(e);
    if(cs.display==='none'||cs.visibility==='hidden') return false;
    const r=e.getBoundingClientRect();
    return r.width>2 && r.height>2;
  };
  /* la opacidad que le cae encima por herencia */
  const opacidadDe=n=>{ let o=1; for(let e=n;e;e=e.parentElement){
      const v=parseFloat(getComputedStyle(e).opacity); if(!isNaN(v)) o*=v; } return o; };
  const salida=[];
  for(const e of document.querySelectorAll('body *')){
    const propio=[...e.childNodes].some(n=>n.nodeType===3 && n.textContent.trim().length>1);
    if(!propio) continue;
    if(!visible(e)) continue;
    const cs=getComputedStyle(e);
    const fondo=fondoDe(e); if(!fondo) continue;
    let tinta=num(cs.color); if(tinta.length===3) tinta=tinta.concat(1);
    const op=opacidadDe(e);
    if(op<0.08) continue;               // está apagado a propósito
    tinta=[tinta[0],tinta[1],tinta[2], (tinta[3]===undefined?1:tinta[3])*op];
    const r=razon(mezclar(tinta,fondo), fondo);
    salida.push({ r:Math.round(r*100)/100,
      que:(e.tagName.toLowerCase()+(e.className&&typeof e.className==='string'?'.'+e.className.trim().split(/\s+/).join('.'):'')).slice(0,70),
      txt:e.textContent.trim().replace(/\s+/g,' ').slice(0,42) });
  }
  return salida.sort((a,b)=>a.r-b.r);
}})()`;

/* La página pública revela cada bloque al bajar (.ap). Sin esto, todo lo
   que está abajo del primer pantallazo tiene opacidad 0 y la prueba lo
   daba por "apagado a propósito": se medían 41 textos de una página que
   tiene cientos, y el error que la trajo quedaba justo afuera. */
const DESTAPAR=`.ap,.ap *{opacity:1!important;transform:none!important;filter:none!important}
  *{animation-duration:0s!important;transition-duration:0s!important}`;

async function mirar(p, url, nombre, piso){
  await p.goto(url,{waitUntil:'domcontentloaded'});
  await p.addStyleTag({content:DESTAPAR});
  await p.waitForTimeout(900);
  const lista=await p.evaluate(MEDIDOR);
  const flojos=lista.filter(x=>x.r<(piso||PISO));
  if(flojos.length){
    mal(`${nombre}: ${flojos.length} textos no se leen`);
    for(const f of flojos.slice(0,8))
      console.log(`      ${f.r.toFixed(2)}:1  <${f.que}>  "${f.txt}"`);
  } else bien(`${nombre}: los ${lista.length} textos se leen`);
  /* PEORES=1 lista los diez más flojos aunque pasen: sirve para ver si
     algo quedó al borde antes de que se caiga del todo. */
  if(process.env.PEORES) for(const f of lista.slice(0,10))
    console.log(`      ${f.r.toFixed(2)}:1  <${f.que}>  "${f.txt}"`);
}

(async()=>{
  const browser=await chromium.launch();
  for(const vp of [{width:390,height:844,n:'teléfono'},{width:1280,height:860,n:'escritorio'}]){
    console.log(`\n── ${vp.n} (${vp.width}px) ──`);
    const ctx=await browser.newContext({viewport:{width:vp.width,height:vp.height}});
    await ctx.addInitScript(c=>{ try{
      localStorage.setItem('ce:claves',JSON.stringify(c));
      localStorage.setItem('ce:pin','4321');
      sessionStorage.setItem('ce:pinOK','1');
    }catch(e){} },{[COD]:CLAVE});
    const p=await ctx.newPage();
    await p.route('**/cdnjs.cloudflare.com/**',r=>r.fulfill({status:200,
      contentType:'application/javascript',
      body:'window.QRCode=function(n){n.innerHTML="";};window.QRCode.CorrectLevel={M:0};'}));
    const fake=crearFake('ok'); await fake.instalar(p); fake.claves[COD]=CLAVE;
    fake.db.ce_eventos.push({codigo:COD,nombre:'Los 15 de Delfina',fecha:'2026-10-18',
      tipo:'XV',tono:'#D9AE72',moderar:false,cerrado:false,creado:Date.now(),
      camara:true,cupo_fotos:24,cupo_invitados:100,revelado:true});

    await mirar(p, S+'/index.html', 'la página pública');
    await mirar(p, S+'/privacidad', 'la política de privacidad');
    await mirar(p, S+'/terminos', 'los términos y condiciones');
    await mirar(p, S+'/muro.html#panel', 'el panel del muro');
    await mirar(p, S+'/muro.html#evento/'+COD, 'el evento');
    await mirar(p, S+'/muro.html#subir/'+COD, 'lo que ve el invitado');
    await mirar(p, S+'/rollo.html?demo=1', 'el rollo, demostración');
    await mirar(p, S+'/rollo.html#nuevo', 'el alta del rollo');
    await ctx.close();
  }
  await browser.close();
  console.log(fallas.length?`\n${fallas.length} FALLAS`:'\n✓ Sin fallas');
  process.exit(fallas.length?1:0);
})();
