/* ══════════════════════════════════════════════════════════════════
   La demostración del rollo, en un teléfono.

   Dos cosas:
     1. La cinta es una capa fija y la cámara, el cuarto oscuro y el visor
        de fotos se dibujan con inset:0. Sin correrlos, la cinta les tapa
        la barra de arriba. Y con el alto de la cinta clavado en 38px, en
        cuanto envuelve en dos líneas el ✕ y "Salir" se salían de la
        pantalla: no había forma de cerrarla ni de volver al sitio.
     2. La prueba entra por el ÁLBUM REVELADO, que es el momento del
        producto, y desde ahí se puede pasar al otro lado —el invitado
        gastando fotos sin ver ninguna— y volver. Antes a ese otro lado
        solo se llegaba escribiendo ?camara=1 a mano.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const BASE='http://127.0.0.1:8890';
const TELEFONO={width:390,height:844};
const fallas=[]; const mal=m=>{fallas.push(m);console.log('  ✗ '+m);};
const bien=m=>console.log('  ✓ '+m);

const caja=(p,sel)=>p.evaluate(s=>{
  const n=document.querySelector(s); if(!n) return null;
  const r=n.getBoundingClientRect();
  return {x:Math.round(r.left),y:Math.round(r.top),
          x2:Math.round(r.right),y2:Math.round(r.bottom),alto:Math.round(r.height)};
},sel);
const dentro=(c,v)=>!!(c&&c.x>=-1&&c.y>=-1&&c.x2<=v.width+1&&c.y2<=v.height+1);
/* Lo que se ve, ya pasado por el CSS y en minúsculas: media app está en
   mayúsculas y comparar tal cual da falsos negativos. */
const texto=async p=>(await p.evaluate(()=>document.body.innerText||'')).toLowerCase();

(async()=>{
/* Sin cámara de mentira el disparador no hace nada: la app no le gasta una
   foto al invitado si el cuadro viene negro, que es lo correcto. Mismos
   argumentos que rollo_hostil y rollo_navegador. */
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
const ctx=await b.newContext({viewport:TELEFONO});
const p=await ctx.newPage();
const errs=[]; p.on('pageerror',e=>errs.push(e.message));

console.log('\n─── la cinta en un celular ───');
await p.goto(BASE+'/rollo.html?demo=1',{waitUntil:'domcontentloaded'});
await p.waitForTimeout(3500);

const cinta=await caja(p,'#cinta-demo');
const equis=await caja(p,'#plegarCinta');
const salir=await caja(p,'#cinta-demo a[href="/"]');
if(!cinta) { mal('no se dibujó la cinta'); }
for(const [q,c] of [['la cinta',cinta],['el ✕',equis],['el enlace de salir',salir]]){
  if(!dentro(c,TELEFONO)) mal(`${q}: se sale de la pantalla ${JSON.stringify(c)}`);
  else bien(`${q}: entra en la pantalla`);
}

console.log('\n─── entra por el revelado ───');
/* Nace revelado, así que lo que se ve es el revelado o el álbum, nunca el
   formulario de alta: "Crear el rollo de mi fiesta" no es una prueba. */
const t=await texto(p);
if(/crear el rollo/.test(t)) mal('la prueba cae en el formulario de alta');
else bien('no cae en el alta');
/* Ojo con esta: "álbum" a secas aparece en un botón del panel del
   organizador, así que buscarla nomás pasaba también con el código viejo
   —que caía justo ahí— y no medía nada. Lo que hay que descartar es el
   panel: "Mostrá este código en la fiesta" es la pantalla del que vende,
   no la del que mira la prueba. */
if(/mostr[áa] este c[óo]digo|sacando fotos/.test(t))
  mal('la prueba cae en el panel del organizador, no en el álbum');
else bien('no cae en el panel del organizador');
if(!/revelando|toc[áa] para saltear|tus fotos|las de todos/.test(t))
  mal('no cae en el revelado: "'+t.slice(0,90)+'"');
else bien('cae en el revelado');
if(/#ev\//.test(p.url())) mal('quedó en la dirección del panel: '+p.url());
else bien('y la dirección no es la del panel');

console.log('\n─── plegar y volver ───');
/* Si el ✕ no está, esto tiene que FALLAR, no quedarse treinta segundos
   esperándolo y después colgar el proceso con el navegador abierto: una
   prueba que se muere no es una prueba que falla. */
const hayEquis = !!(await p.locator('#plegarCinta').count());
if(!hayEquis) mal('la cinta no tiene con qué achicarse');
if(hayEquis){
await p.click('#plegarCinta'); await p.waitForTimeout(500);
const chica=await caja(p,'#cinta-demo');
if(!chica||chica.alto>=cinta.alto) mal(`el ✕ no achica la cinta (${chica&&chica.alto}px)`);
else bien(`el ✕ la achica de ${cinta.alto} a ${chica.alto}px`);
if(!chica||chica.alto<10) mal('plegada queda invisible y no hay forma de volver');
else bien('plegada sigue estando');
await p.click('#cinta-demo'); await p.waitForTimeout(500);
const otra=await caja(p,'#cinta-demo');
if(!otra||otra.alto!==cinta.alto) mal('tocándola no se vuelve a abrir');
else bien('tocándola vuelve a abrirse');
}

console.log('\n─── los dos lados del rollo ───');
const hayLado = !!(await p.locator('#otroLado').count());
if(!hayLado) mal('no hay forma de pasar al otro lado del rollo');
if(hayLado){
const bo=await p.locator('#otroLado').innerText().catch(()=>'');
if(!/c[áa]mara/i.test(bo)) mal(`desde el álbum no ofrece ver la cámara (dice "${bo}")`);
else bien('desde el álbum ofrece ver la cámara: "'+bo.trim()+'"');
await p.click('#otroLado'); await p.waitForTimeout(3500);
const t2=await texto(p);
if(!/quedan|usar la cámara|sacar/.test(t2)) mal('no llegó a la cámara del invitado: "'+t2.slice(0,90)+'"');
else bien('llega a la cámara del invitado');
const bo2=await p.locator('#otroLado').innerText().catch(()=>'');
if(!/[áa]lbum/i.test(bo2)) mal(`desde la cámara no ofrece volver al álbum (dice "${bo2}")`);
else bien('y desde ahí se puede volver: "'+bo2.trim()+'"');
await p.click('#otroLado'); await p.waitForTimeout(3500);
const t3=await texto(p);
if(/quedan fotos|usar la cámara del/.test(t3)&&!/revelando|álbum/.test(t3))
  mal('no volvió al álbum');
else bien('vuelve al álbum');
}

/* La primera pestaña se cierra ACÁ y no al final. Dejándola abierta, la
   que viene —que usa el reloj falso— no terminaba de cargar nunca: tres
   corridas seguidas colgadas en el mismo punto, y cerrándola pasa siempre.
   La causa probable son los sondeos y la cámara que quedan andando en la
   primera; lo comprobado es que cerrarla lo arregla. */
await ctx.close();

console.log('\n─── el rollo de la prueba se vuelve a llenar ───');
/* La demostración pasa de mano en mano en el teléfono del negocio. Sin
   esto, el tercer cliente se encuentra las 24 fotos gastadas por los dos
   anteriores y la cámara no le abre. Se mide con el reloj falso para no
   esperar dos minutos de verdad en cada corrida. */
{
  const c2=await b.newContext({viewport:TELEFONO,permissions:['camera']});
  const p2=await c2.newPage();
  const e2=[]; p2.on('pageerror',e=>e2.push(e.message));
  await p2.clock.install();
  /* Derecho a la dirección final, con el ?e= puesto. Sin él, el arranque
     hace un location.replace para agregarlo y la navegación se pisa con la
     que estamos esperando: el goto se queda colgado a veces sí y a veces
     no. Una prueba que falla una de cada tres veces es ruido. */
  const CAMARA=BASE+'/rollo.html?demo=1&camara=1&e=DEMO-ROLLO';
  /* En dos pasos: con el reloj falso puesto, esperar el
     'domcontentloaded' DESDE el goto se queda colgado los 30 segundos,
     y esperarlo aparte vuelve en 60 ms. Medido, no supuesto. */
  const irALaCamara=async()=>{
    await p2.goto(CAMARA,{waitUntil:'commit'});
    await p2.waitForLoadState('domcontentloaded');
    await p2.clock.runFor(3000); await p2.waitForTimeout(1500);
  };
  await irALaCamara();
  const quedan=async()=>Number((await p2.locator('#cRestan').innerText().catch(()=>'')).trim());
  const antes=await quedan();
  if(!(antes>0)) mal('no se ve el contador de fotos que quedan: '+antes);
  else{
    bien('el rollo de prueba arranca con '+antes);
    /* SIN recargar. Recargando, la demostración se resiembra sola y el
       cupo vuelve a estar entero con arreglo o sin él: escrita así, la
       prueba pasaba también contra el código de antes y no medía nada.
       Lo que la distingue es sacar una SEGUNDA foto después del plazo: si
       la primera se devolvió, el contador vuelve a marcar lo mismo; si no
       se devolvió, marca uno menos. */
    const disparar=async()=>{
      await p2.click('#disparo').catch(()=>{});
      await p2.clock.runFor(2500); await p2.waitForTimeout(1500);
      return quedan();
    };
    const gastada=await disparar();
    if(!(gastada<antes)) mal(`sacar una foto no gasta el cupo (${antes} → ${gastada})`);
    else{
      bien(`sacar una foto gasta el cupo: ${antes} → ${gastada}`);
      await p2.clock.fastForward('02:30'); await p2.waitForTimeout(800);
      const segunda=await disparar();
      if(segunda!==gastada)
        mal(`la primera foto no se devolvió a los dos minutos: la segunda dejó ${segunda}, esperaba ${gastada}`);
      else bien(`a los dos minutos la primera se devuelve sola: la segunda vuelve a dejar ${segunda}`);
    }
    const pie=(await p2.locator('.pie-camara').innerText().catch(()=>'')).toLowerCase();
    if(!/se vuelve a llenar/.test(pie)) mal('no le avisa al visitante que se repone: "'+pie+'"');
    else bien('y se lo avisa al visitante');
  }
  if(e2.length) mal('errores JS en la cámara: '+e2.join(' | '));
  await c2.close();
}

console.log('\nerrores JS: '+(errs.length?errs.join(' | '):'ninguno'));
if(errs.length) mal('errores JS: '+errs.join(' | '));
await b.close();
console.log(fallas.length?`\n${fallas.length} FALLAS`:'\n✓ Sin fallas');
process.exit(fallas.length?1:0);
})();
