const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx=await b.newContext({viewport:{width:414,height:896},deviceScaleFactor:2,acceptDownloads:true});
const p=await ctx.newPage();
const err=[]; p.on('pageerror',e=>err.push(e.message));
/* La librería del zip viene de un CDN. Si este entorno no tiene salida a
   internet, servimos una copia local; si la tiene, la deja pasar. Va antes
   de la primera carga, porque después el <script> ya se pidió una sola vez. */
await p.route('**/jszip.min.js', r=>{
  try{ r.fulfill({status:200,contentType:'application/javascript',
    body:fs.readFileSync('/tmp/qa/jszip.min.js','utf8')}); }catch(e){ r.continue(); }
});
const FOTO_ZIP=Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==','base64');
const FOTOS_ZIP=Array.from({length:7},(_,i)=>({id:''+i,ruta:'T/t/'+i+'.jpg',nombre:'Invitado '+(i%3),ts:i}));
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
  if(u.includes('/rpc/ce_album_de')) return r.fulfill({status:200,contentType:'application/json',
    body:JSON.stringify({revelado:true,mias:[],todas:FOTOS_ZIP,total_fotos:7,total_invitados:3})});
  if(u.includes('/object/sign/ce-rollos')&&met==='POST') return r.fulfill({status:200,contentType:'application/json',
    body:JSON.stringify((body().paths||[]).map(x=>({path:x,signedURL:'/object/sign/ce-rollos/'+x+'?t=1'})))});
  if(u.includes('/object/sign/ce-rollos/')) return r.fulfill({status:200,contentType:'image/jpeg',body:FOTO_ZIP});
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

/* llevarse todas las fotos: el zip se arma en el navegador */
await p.goto('http://127.0.0.1:8890/rollo.html#ev/'+creado.codigo);
await p.reload();
await p.waitForTimeout(1400);
if(await p.locator('#bajarTodas').count()){
  const [dl]=await Promise.all([p.waitForEvent('download',{timeout:25000}).catch(()=>null), p.click('#bajarTodas')]);
  console.log('ZIP     →', dl? 'bajó '+dl.suggestedFilename()+' ('+fs.statSync(await dl.path()).size+' bytes)' : 'NO bajó ✗');
} else console.log('ZIP     → no aparece el botón ✗');
console.log('errores:', err.length?err:'ninguno ✓');
await b.close();
})();
