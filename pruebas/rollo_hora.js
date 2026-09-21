const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
// simulamos un teléfono en Argentina, que es donde el bug pegaba
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx=await b.newContext({viewport:{width:414,height:896},timezoneId:'America/Argentina/Buenos_Aires'});
const p=await ctx.newPage();
const err=[]; p.on('pageerror',e=>err.push(e.message));
let creado=null;
const base={codigo:'X',nombre:'Prueba',camara:true,cerrado:false,cupo_fotos:24,revelado:false,revela_en:null};
await p.route('**/kuqlqgrwsospwjexodqa.supabase.co/**', async r=>{
  const u=r.request().url(), met=r.request().method();
  const body=()=>{try{return JSON.parse(r.request().postData()||'{}')}catch(e){return{}}};
  if(u.includes('/rest/v1/ce_eventos')&&met==='POST'){ creado=body(); Object.assign(base,creado); return r.fulfill({status:201,body:''}); }
  if(u.includes('/rest/v1/ce_eventos')&&met==='PATCH'){ Object.assign(base,body()); return r.fulfill({status:204,body:''}); }
  if(u.includes('/rest/v1/ce_eventos')) return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify([base])});
  if(u.includes('/rpc/')) return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({invitados:0,fotos:0})});
  return r.fulfill({status:404,body:'x'});
});
/* las horas se calculan DENTRO del navegador: si no, uso la zona de Node
   (UTC) y comparo contra la del teléfono (Argentina), que no es lo mismo */
const localEnLaPagina=min=>p.evaluate(m=>{
  const d=new Date(Date.now()+m*60000), c=n=>String(n).padStart(2,'0');
  return {texto:`${d.getFullYear()}-${c(d.getMonth()+1)}-${c(d.getDate())}T${c(d.getHours())}:${c(d.getMinutes())}`,
          instante:d.toISOString()};
}, min);

/* Avanzar hasta el final del alta SIN contar pasos. Contar clicks es lo
   que rompió esta prueba cuando el asistente pasó de cuatro pasos a seis:
   se quedaba a mitad de camino y fallaba por el motivo equivocado. Se
   avanza mientras el botón diga "Siguiente"; el click que no lo dice es
   el de crear. */
const crearYa=async(pg)=>{
  for(let i=0;i<10;i++){
    const t=((await pg.locator('#sig').innerText().catch(()=>''))||'').trim().toLowerCase();
    /* Desde blindaje2: sin la casilla del organizador no se crea nada. Va
       antes de cada click porque solo el paso del resumen la tiene, y
       tocarla donde no está no cuesta nada. */
    await pg.locator('#aceptoT').check().catch(()=>{});
    await pg.locator('#sig').click();
    await pg.waitForTimeout(450);
    if(!/siguiente/.test(t)) return;
  }
  throw new Error('el alta no llegó nunca al botón de crear');
};

const irAPaso3=async()=>{
  await p.goto('http://127.0.0.1:8890/rollo.html'); await p.waitForTimeout(600);
  await p.click('#crear'); await p.waitForTimeout(400);
  await p.fill('#dato','Fiesta'); await p.click('#sig'); await p.waitForTimeout(400);
  await p.click('#sig'); await p.waitForTimeout(400);
  await p.click('[data-c="hora"]'); await p.waitForTimeout(300);
};
// A) una hora que ya pasó: NO debe dejar crear
await irAPaso3();
const ayer=await localEnLaPagina(-60);
await p.fill('#revela', ayer.texto);
await p.click('#sig'); await p.waitForTimeout(600);
console.log('A) hora pasada  → aviso:', ((await p.textContent('#aviso-toast').catch(()=>''))||'—'));
console.log('   ¿siguió igual?', (await p.textContent('h2')).trim());

// B) una hora futura: se manda en UTC, no en hora de pared
await irAPaso3();
const futuro=await localEnLaPagina(120);
const puesto=futuro.texto;
await p.fill('#revela', puesto);
await crearYa(p);
await p.waitForTimeout(900);
console.log('B) puse (hora local):', puesto);
console.log('   se guardó        :', creado.revela_en);
const guardado=new Date(creado.revela_en);
const dif=Math.abs(Math.round((guardado-new Date(futuro.instante))/60000));
console.log('   ese instante es el que quise (±1 min):', dif<=1?'✓':'✗ SE CORRIÓ '+dif+' min');
console.log('   ¿nace revelado?:', guardado<=new Date() ? 'SÍ ✗' : 'no ✓');

// C) el ajuste muestra de vuelta la hora local, no la UTC
await p.goto('http://127.0.0.1:8890/rollo.html#ajustes/'+creado.codigo);
await p.waitForTimeout(1000);
const enPantalla=await p.inputValue('#revela');
console.log('C) vuelve a mostrar:', enPantalla, enPantalla===puesto?'✓ igual a lo que puse':'✗ distinto');
console.log('errores:', err.length?err:'ninguno ✓');
await b.close();
})();
