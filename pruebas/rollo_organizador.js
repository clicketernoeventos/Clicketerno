const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx=await b.newContext({viewport:{width:414,height:896},deviceScaleFactor:2});
const p=await ctx.newPage();
const err=[]; p.on('pageerror',e=>err.push(e.message));
const base={codigo:'BOD-X1',nombre:'',camara:true,cerrado:false,cupo_fotos:24,revelado:false,revela_en:null};
let creado=null;
await p.route('**/kuqlqgrwsospwjexodqa.supabase.co/**', async r=>{
  const u=r.request().url(), met=r.request().method();
  const body=()=>{try{return JSON.parse(r.request().postData()||'{}')}catch(e){return{}}};
  if(u.includes('/rest/v1/ce_eventos')&&met==='POST'){ creado=body(); Object.assign(base,creado); return r.fulfill({status:201,body:''}); }
  if(u.includes('/rest/v1/ce_eventos')&&met==='PATCH'){ Object.assign(base,body()); return r.fulfill({status:204,body:''}); }
  if(u.includes('/rest/v1/ce_eventos')) return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify([base])});
  if(u.includes('/rpc/ce_camara_stats')) return r.fulfill({status:200,contentType:'application/json',
    body:JSON.stringify({invitados:12,fotos:83,revelado:false})});
  return r.fulfill({status:404,body:'x'});
});
const ver=async(n,sel)=>{ await p.waitForTimeout(700); await p.screenshot({path:'/tmp/qa/g-'+n+'.png'});
  return (await p.textContent(sel)).replace(/\s+/g,' ').trim(); };

await p.goto('http://127.0.0.1:8890/rollo.html');
console.log('PUERTA  →', await ver('0-puerta','.portada-r h1'));
console.log('         botón:', (await p.textContent('#crear')).trim(), '·', (await p.textContent('.ayudita')).trim());

await p.click('#crear');
console.log('PASO 1  →', await ver('1','h2'));
await p.fill('#dato','Los 15 de Delfina'); await p.click('#sig');
console.log('PASO 2  →', await ver('2','h2'));
await p.click('[data-t="Casamiento"]'); await p.click('#sig');
console.log('PASO 3  →', await ver('3','h2'));
console.log('         recomendado:', (await p.textContent('.reco')).trim());
await p.click('#sig');
console.log('PASO 4  →', await ver('4','h2'));
await p.click('#sig'); await p.waitForTimeout(1200);

console.log('ROLLO   →', (await p.textContent('.instruccion')).trim());
console.log('         estado:', (await p.textContent('.estado')).trim());
console.log('         botón grande:', (await p.textContent('#compartir')).trim());
console.log('         números:', (await p.textContent('#stats')).trim());
console.log('         abajo:', (await p.textContent('#revelar')).trim());
await p.screenshot({path:'/tmp/qa/g-5-rollo.png'});

await p.click('#revelar'); await p.waitForTimeout(1300);
console.log('REVELADO→', (await p.textContent('.instruccion')).trim(), '·', (await p.textContent('.estado')).trim());
console.log('         botón grande:', (await p.textContent('#compartir')).trim());
await p.screenshot({path:'/tmp/qa/g-6-revelado.png'});

await p.click('#ajustes'); await p.waitForTimeout(900);
console.log('AJUSTES →', (await p.textContent('.cab-p .tit')).trim());
await p.click('[data-ir^="ev/"]'); await p.waitForTimeout(900);
console.log('vuelve al rollo:', (await p.textContent('.instruccion')).trim());
await p.goto('http://127.0.0.1:8890/rollo.html'); await p.waitForTimeout(1200);
console.log('LA PUERTA ahora lista:', (await p.textContent('.fila-ev')).replace(/\s+/g,' ').trim());
console.log('errores:', err.length?err:'ninguno ✓');
await b.close();
})();
