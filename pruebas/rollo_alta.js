/* ══════════════════════════════════════════════════════════════════
   El alta del rollo, de punta a punta, y sus tarjetas.

   Tres cosas nuevas:
     · sugerencias para el nombre, porque escribir en un teléfono es lo
       que más cuesta del alta;
     · "¿cuánta gente esperás?", que es el número con el que se cotiza y
       vivía solo en la base, en 300 por defecto, sin que nadie lo
       preguntara ni lo pudiera cambiar;
     · y el resumen antes de crear, que no es un trámite: es la pantalla
       que se le manda al cliente por WhatsApp antes de cobrarle. Si dice
       cualquier cosa, el presupuesto sale mal.

   Más las tarjetas para cortar, medidas como sale IMPRESO y no como se
   ve en el monitor.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const BASE='http://127.0.0.1:8890';
const A4={ancho:794, alto:1123};
const fallas=[]; const mal=m=>{fallas.push(m);console.log('  ✗ '+m);};
const bien=m=>console.log('  ✓ '+m);

const EV={codigo:'BOD-T1',nombre:'Flor y Juan',fecha:'2026-11-07',tipo:'Casamiento',
  tono:'#D9AE72',camara:true,cerrado:false,cupo_fotos:24,revelado:false,
  revela_en:null,cupo_invitados:300};

async function abrir(b,{viewport}={}){
  const ctx=await b.newContext({viewport:viewport||{width:414,height:896}});
  await ctx.addInitScript(()=>{ try{
    localStorage.setItem('ce:claves',JSON.stringify({'BOD-T1':'ABC'})); }catch(e){} });
  const p=await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.route('**/cdnjs.cloudflare.com/**',r=>r.fulfill({status:200,
    contentType:'application/javascript',
    body:'window.QRCode=function(n,o){var c=document.createElement("canvas");'
        +'c.width=o.width;c.height=o.height;n.appendChild(c);};'
        +'window.QRCode.CorrectLevel={M:0};'}));
  const visto={creado:null};
  await p.route('**/kuqlqgrwsospwjexodqa.supabase.co/**',r=>{
    const req=r.request(), u=req.url();
    const body=()=>{try{return JSON.parse(req.postData()||'{}')}catch(e){return{}}};
    if(u.includes('/rest/v1/ce_eventos')&&req.method()==='POST'){
      /* Como la base de verdad. "resolution=merge-duplicates" es un
         "insert ... on conflict do update", y Postgres evalúa el WITH
         CHECK de la política de UPDATE —ce_permitido(codigo)— en TODAS
         esas sentencias, haya conflicto o no. En un alta la clave todavía
         no existe para ce_permitido (es STABLE: no ve lo que acabó de
         escribir el disparador), así que rebota. El rollo se creaba así y
         en producción daba "new row violates row-level security policy
         for table ce_eventos"; acá pasaba, porque este falso decía 201 a
         todo. Medido contra Postgres 16 con el esquema entero. */
      if(/merge-duplicates/i.test(req.headers()['prefer']||''))
        return r.fulfill({status:403,contentType:'application/json',
          body:JSON.stringify({message:'new row violates row-level security policy for table "ce_eventos"'})});
      visto.creado=body(); return r.fulfill({status:201,body:''}); }
    if(u.includes('/rest/v1/ce_eventos')&&req.method()==='PATCH')
      return r.fulfill({status:204,body:''});
    if(u.includes('/rest/v1/ce_eventos'))
      return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify([EV])});
    if(u.includes('/rpc/ce_camara_stats'))
      return r.fulfill({status:200,contentType:'application/json',
        body:JSON.stringify({invitados:0,fotos:0,revelado:false})});
    return r.fulfill({status:200,contentType:'application/json',body:'[]'});
  });
  return {ctx,p,errs,visto};
}
const titulo=async p=>((await p.locator('h2').first().innerText().catch(()=>''))||'').trim();

(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});

console.log('\n─── el alta, paso por paso ───');
{
  const {ctx,p,errs,visto}=await abrir(b);
  await p.goto(BASE+'/rollo.html#nuevo/1',{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(1500);

  /* 1 · nombre, con sugerencias */
  if(!/c[óo]mo se llama/i.test(await titulo(p))) mal('el paso 1 no es el nombre');
  else bien('1 · el nombre');
  const sug=await p.locator('#sugerencias button').count();
  if(sug<3) mal(`solo ${sug} sugerencias de nombre`);
  else bien(`con ${sug} sugerencias, para no escribir en el teléfono`);
  await p.click('#sugerencias button[data-s="Casamiento de"]');
  await p.waitForTimeout(300);
  const arranque=await p.inputValue('#dato');
  /* Que la sugerencia EMPIECE el nombre y no lo reemplace: "Casamiento de"
     sin el espacio obliga a borrar y volver a escribir. */
  if(arranque!=='Casamiento de ') mal(`la sugerencia deja "${arranque}"`);
  else bien('la sugerencia deja el nombre empezado, listo para seguir');
  await p.fill('#dato','Flor y Juan'); await p.click('#sig'); await p.waitForTimeout(900);

  /* 2 · tipo y fecha */
  await p.click('[data-t="Casamiento"]').catch(()=>{});
  await p.fill('#fecha','2026-11-07'); await p.click('#sig'); await p.waitForTimeout(900);
  /* 3 · cuándo se ven */
  if(!/cu[áa]ndo se ven/i.test(await titulo(p))) mal('el paso 3 no es el revelado');
  else bien('3 · cuándo se ven las fotos');
  await p.click('#sig'); await p.waitForTimeout(900);
  /* 4 · cuántas fotos */
  await p.click('#sig'); await p.waitForTimeout(900);

  /* 5 · cuánta gente */
  if(!/cu[áa]nta gente/i.test(await titulo(p))) mal('falta el paso de cuánta gente: '+await titulo(p));
  else bien('5 · cuánta gente esperás');
  const chips=await p.locator('#cuantos button').count();
  if(chips<4) mal(`solo ${chips} atajos de cantidad`);
  else bien(`con ${chips} atajos (30, 50, 100…)`);
  await p.click('#cuantos button[data-g="100"]'); await p.waitForTimeout(300);
  if((await p.inputValue('#gente'))!=='100') mal('el atajo no completa el campo');
  else bien('el atajo completa el campo');
  /* El tope de la base es 2000: pasarse tiene que avisarse en castellano,
     no reventar con un error de Postgres al final del alta. */
  await p.fill('#gente','9999'); await p.click('#sig'); await p.waitForTimeout(700);
  if(!/cu[áa]nta gente/i.test(await titulo(p))) mal('deja pasar 9999 invitados: la base lo va a rechazar');
  else bien('no deja pasar más invitados de los que aguanta la base');
  await p.fill('#gente','100'); await p.click('#sig'); await p.waitForTimeout(900);

  /* 6 · el resumen */
  if(!/antes de crearlo/i.test(await titulo(p))) mal('no hay resumen antes de crear: '+await titulo(p));
  else bien('6 · el resumen, antes de crear');
  const res=((await p.locator('.resumen').innerText().catch(()=>''))||'').replace(/\s+/g,' ').toLowerCase();
  for(const [q,esp] of [['el nombre','flor y juan'],['la fecha','7 de noviembre de 2026'],
                        ['las fotos por invitado','24'],['los invitados','hasta 100'],
                        ['cuándo se revela','cuando vos lo digas'],['cuánto vive el álbum','90 días']]){
    if(!res.includes(esp)) mal(`el resumen no dice ${q} ("${esp}"): ${res.slice(0,120)}`);
    else bien(`el resumen dice ${q}: ${esp}`);
  }
  const boton=((await p.locator('#sig').innerText())||'').trim().toLowerCase();
  if(!/crear/.test(boton)) mal(`en el resumen el botón dice "${boton}"`);
  else bien('y el botón ya dice crear');

  await p.click('#sig'); await p.waitForTimeout(2500);
  const c=visto.creado;
  if(!c) mal('no llegó a crear el rollo');
  else{
    bien('crea el rollo');
    if(Number(c.cupo_invitados)!==100)
      mal(`guardó cupo_invitados=${c.cupo_invitados}, esperaba 100: lo que se eligió no se guardó`);
    else bien('y guarda la cantidad de invitados que se eligió');
    if(c.nombre!=='Flor y Juan') mal('guardó otro nombre: '+c.nombre);
    else bien('con el nombre correcto');
  }
  if(errs.length) mal('errores JS: '+errs.join(' | '));
  await ctx.close();
}

console.log('\n─── las tarjetas del rollo, como salen impresas ───');
{
  const {ctx,p,errs}=await abrir(b,{viewport:{width:A4.ancho,height:A4.alto}});
  await p.goto(BASE+'/rollo.html#tarjetas/BOD-T1',{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(2200);
  const n=await p.locator('.tarjeta-qr').count();
  if(n!==4) mal(`arranca con ${n} tarjetas, esperaba 4`);
  else bien('arranca con cuatro tarjetas');
  const qr=await p.locator('.tarjeta-qr .qr-t canvas').count();
  if(qr!==n) mal(`${qr} QR para ${n} tarjetas`);
  else bien('cada una con su QR');
  const dice=((await p.locator('.hoja-tarjetas').innerText())||'').toLowerCase();
  /* Lo que separa al rollo del muro: nadie ve nada hasta el revelado. Si
     la tarjeta no lo dice, el invitado saca fotos y cree que se perdieron. */
  if(!/nadie las ve hasta el revelado/.test(dice))
    mal('la tarjeta del rollo no avisa que nadie las ve hasta el revelado');
  else bien('avisa que nadie las ve hasta el revelado');
  if(!dice.includes('flor y juan')) mal('no dice el nombre de la fiesta');
  else bien('dice el nombre de la fiesta');

  await p.emulateMedia({media:'print'}); await p.waitForTimeout(500);
  const m=await p.evaluate(()=>{
    const h=document.querySelector('.hoja-tarjetas'); if(!h) return null;
    const r=h.getBoundingClientRect();
    const t=[...document.querySelectorAll('.tarjeta-qr')].map(n=>{
      const c=n.getBoundingClientRect();
      return {y:Math.round(c.top+c.height), x:Math.round(c.left+c.width)};});
    return {x:Math.round(r.left),y:Math.round(r.top),
            an:Math.round(r.width),al:Math.round(r.height),t};});
  if(!m) mal('no se dibujó la hoja');
  else{
    if(m.x!==0||m.y!==0) mal(`la hoja no arranca en el borde: ${m.x},${m.y}`);
    else if(Math.abs(m.an-A4.ancho)>2||Math.abs(m.al-A4.alto)>2)
      mal(`la hoja mide ${m.an}x${m.al}, esperaba ${A4.ancho}x${A4.alto}`);
    else bien('una A4 exacta, pegada al borde');
    const afuera=m.t.filter(t=>t.y>A4.alto+2||t.x>A4.ancho+2);
    if(afuera.length) mal(`se salen ${afuera.length} tarjetas del papel`);
    else bien('entran las cuatro en una sola hoja');
  }
  const sobra=await p.evaluate(()=>[...document.querySelectorAll('.no-imprime,.cab-p')]
    .filter(x=>getComputedStyle(x).display!=='none').length);
  if(sobra) mal(`se imprimen ${sobra} cosas que no van al papel`);
  else bien('no se imprimen los botones ni la cabecera');
  await p.emulateMedia({media:'screen'});

  if(!(await p.evaluate(()=>!!document.getElementById('hojaA4'))))
    mal('no se puso la regla de página A4');
  else bien('la hoja es A4 mientras se ven las tarjetas');
  await p.goto(BASE+'/rollo.html#ev/BOD-T1',{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(1600);
  if(await p.evaluate(()=>!!document.getElementById('hojaA4')))
    mal('la regla A4 queda puesta al salir');
  else bien('y al salir se saca');
  if(!(await p.locator('[data-ir^="tarjetas/"]').count()))
    mal('no se llega a las tarjetas desde el panel del rollo');
  else bien('se llega desde el panel del rollo');
  if(errs.length) mal('errores JS: '+errs.join(' | '));
  await ctx.close();
}

await b.close();
console.log(fallas.length?`\n${fallas.length} FALLAS`:'\n✓ Sin fallas');
process.exit(fallas.length?1:0);
})();
