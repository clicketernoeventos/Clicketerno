/* ══════════════════════════════════════════════════════════════════
   El rollo también vence, y también tiene que avisarlo.

   El muro ya lo decía; el rollo guardaba el "vence" en la base desde el
   día uno y no lo mostraba en ningún lado. El organizador se iba a enterar
   el día que abriera el álbum y no estuviera, y el zip es la ÚNICA copia
   que le queda: el aviso tiene que llegar antes.

   Las fechas se calculan desde hoy, no escritas a mano.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const BASE='http://127.0.0.1:8890';
const fallas=[]; const mal=m=>{fallas.push(m);console.log('  ✗ '+m);};
const bien=m=>console.log('  ✓ '+m);

const enDias=n=>{
  const h=new Date(); h.setDate(h.getDate()+n);
  const dd=x=>String(x).padStart(2,'0');
  return `${h.getFullYear()}-${dd(h.getMonth()+1)}-${dd(h.getDate())}`;
};

(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});

for(const caso of [
  {dias:200, hay:false, dice:null,             que:'faltan 200 días: no molesta'},
  {dias:9,   hay:true,  dice:/9 d[ií]as/,      que:'a nueve días avisa y dice cuántos quedan'},
  {dias:0,   hay:true,  dice:/hoy/,            que:'el último día dice que se borra hoy'},
  {dias:-3,  hay:true,  dice:/ya venci[oó]/,   que:'vencido lo dice con todas las letras'},
]){
  const ctx=await b.newContext({viewport:{width:414,height:896}});
  await ctx.addInitScript(()=>{ try{
    localStorage.setItem('ce:claves',JSON.stringify({'BOD-V1':'ABC123'}));
  }catch(e){} });
  const p=await ctx.newPage();
  const err=[]; p.on('pageerror',e=>err.push(e.message));
  const fila={codigo:'BOD-V1',nombre:'Flor y Juan',fecha:enDias(caso.dias-90),
    vence:enDias(caso.dias),camara:true,cerrado:false,cupo_fotos:24,
    revelado:true,revela_en:null,tono:'#D9AE72'};
  await p.route('**/kuqlqgrwsospwjexodqa.supabase.co/**',r=>{
    const u=r.request().url();
    if(u.includes('/rest/v1/ce_eventos')) return r.fulfill({status:200,
      contentType:'application/json',body:JSON.stringify([fila])});
    if(u.includes('/rpc/ce_camara_stats')) return r.fulfill({status:200,
      contentType:'application/json',body:JSON.stringify({invitados:3,fotos:9,revelado:true})});
    return r.fulfill({status:200,contentType:'application/json',body:'[]'});
  });
  await p.goto(BASE+'/rollo.html#ev/BOD-V1',{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(1500);
  const n=await p.locator('.aviso-vence').count();
  if(!!n!==caso.hay){
    mal(`${caso.que} — pero el aviso ${n?'está':'no está'}`);
  }else if(caso.dice){
    const t=((await p.locator('.aviso-vence').first().innerText())||'')
      .replace(/\s+/g,' ').trim().toLowerCase();
    if(!caso.dice.test(t)) mal(`${caso.que} — dice "${t}"`);
    else bien(`${caso.que}: "${t.slice(0,72)}…"`);
  }else bien(caso.que);
  if(err.length) mal('errores JS: '+err.join(' | '));
  await ctx.close();
}

await b.close();
console.log(fallas.length?`\n${fallas.length} FALLAS`:'\n✓ Sin fallas');
process.exit(fallas.length?1:0);
})();
