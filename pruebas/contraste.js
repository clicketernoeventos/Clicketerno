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

const { MEDIDOR, DESTAPAR } = require('./contraste_medidor');

/* La página pública revela cada bloque al bajar (.ap). Sin esto, todo lo
   que está abajo del primer pantallazo tiene opacidad 0 y la prueba lo
   daba por "apagado a propósito": se medían 41 textos de una página que
   tiene cientos, y el error que la trajo quedaba justo afuera. */


async function mirar(p, url, nombre, piso, prep){
  await p.goto(url,{waitUntil:'domcontentloaded'});
  await p.addStyleTag({content:DESTAPAR});
  await p.waitForTimeout(900);
  /* Lo que nace `hidden` no se mide, y ahí se esconde justo lo que importa:
     los paneles de prueba de cada servicio y la pantalla con las cinco
     invitaciones juntas están cerrados al cargar. El panel de la prueba
     cayó en la sección CLARA con la tinta de la parte negra —1,6:1, las
     cuatro líneas de "qué incluye" no estaban— y esta suite pasaba en
     verde. Lo que está cerrado se abre antes de medir. */
  if(prep){ await prep(p); await p.waitForTimeout(700); }
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
    await mirar(p, S+'/index.html', 'la página pública, con las pruebas abiertas', null,
      async(pg)=>{ await pg.evaluate(()=>{
        document.querySelectorAll('.prueba').forEach(x=>{ x.hidden=false; });
      }); });
    await mirar(p, S+'/index.html', 'las cinco invitaciones juntas', null,
      async(pg)=>{ await pg.evaluate(()=>{
        const b=document.getElementById('verTodas'); if(b) b.click();
      }); });
    await mirar(p, S+'/invitaciones', 'la página de invitaciones');
    await mirar(p, S+'/guia-listado', 'la guía del listado');
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
