/* ══════════════════════════════════════════════════════════════════
   EL RECORRIDO DEL ROLLO · una cámara descartable, de punta a punta.

   El invitado llega por el QR sin ninguna clave, agarra su cámara,
   gasta sus fotos, y no ve ninguna. El organizador entra con la clave
   desde otro teléfono, ve cuántas hay y revela. Recién ahí el invitado
   ve el álbum.

   Va contra la base BLINDADA: ce_eventos solo se lee con la clave del
   evento, ce_tomar_foto exige que el camino del archivo sea
   CODIGO/TOKEN/algo.jpg, y el token tiene que tener forma de token.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const B=process.env.BASE||'http://127.0.0.1:8890';
let mal=0,bien=0;
const ok=t=>{bien++;console.log('   ✓ '+t)};
const no=(t,x)=>{mal++;console.log('   ✗ '+t+(x?' → '+String(x).replace(/\s+/g,' ').slice(0,110):''))};
const af=(c,t,x)=>c?ok(t):no(t,x);
const T=async p=>{try{return (await p.locator('body').innerText()).replace(/\s+/g,' ')}catch(e){return ''}};

/* Supabase de mentira, con la base ya blindada: ce_eventos solo se lee con
   la clave del evento, y todo lo demás pasa por funciones. */
function base(){
  const ev={codigo:'BOD-RECO01',nombre:'Casamiento Flor y Juan',tono:'#D9AE72',
            camara:true,cerrado:false,revelado:false,revela_en:null,portada:null,
            cupo_fotos:3,cupo_invitados:300,fecha:'2026-10-10',creado:1};
  const rollos={}, disparos=[], objetos=new Set();
  const CLAVE='ROLLO1';
  return {ev,rollos,disparos,objetos,CLAVE,
  async instalar(p){
    await p.route('**/storage/v1/**', r=>{
      const u=r.request().url();
      if(u.includes('/object/sign/')){
        const b=JSON.parse(r.request().postData()||'{}');
        return r.fulfill({status:200,contentType:'application/json',
          body:JSON.stringify((b.paths||[]).map(x=>({path:x,signedURL:'/o/'+x})))});
      }
      if(r.request().method()==='POST'){ objetos.add(u.split('/ce-rollos/')[1]||''); }
      return r.fulfill({status:200,contentType:'application/json',body:'{}'});
    });
    await p.route('**/rest/v1/**', r=>{
      const u=r.request().url(), m=r.request().method();
      const clave=r.request().headers()['x-clave']||'';
      const cuerpo=()=>{try{return JSON.parse(r.request().postData()||'{}')}catch(e){return {}}};
      const J=o=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(o)});
      const E=msg=>r.fulfill({status:400,contentType:'application/json',body:JSON.stringify({message:msg})});
      if(u.includes('/rpc/ce_evento_publico')) return J(cuerpo().p_codigo===ev.codigo?ev:null);
      if(u.includes('/rpc/ce_mi_rollo')){
        const b=cuerpo();
        if(!/^[A-Za-z0-9._-]{8,64}$/.test(b.p_token||'')) return E('Rollo inválido');
        if(!rollos[b.p_token]) rollos[b.p_token]={nombre:(b.p_nombre||'Invitado').slice(0,40),disparos:0};
        const r0=rollos[b.p_token];
        return J({token:b.p_token,nombre:r0.nombre,disparos:r0.disparos,cupo:ev.cupo_fotos,
                  camara:ev.camara,cerrado:ev.cerrado,
                  revelado:!!ev.revelado||(ev.revela_en&&new Date(ev.revela_en)<=new Date()),
                  revela_en:ev.revela_en});
      }
      if(u.includes('/rpc/ce_tomar_foto')){
        const b=cuerpo(), r0=rollos[b.p_token];
        if(!r0) return E('Ese rollo no existe');
        const ok=new RegExp('^'+ev.codigo+'/'+b.p_token+'/[A-Za-z0-9._-]+\\.jpg$').test(b.p_ruta||'');
        if(!ok) return E('Camino de archivo inválido');
        if(r0.disparos>=ev.cupo_fotos) return E('Ya usaste todas tus fotos');
        r0.disparos++; disparos.push({ruta:b.p_ruta,token:b.p_token,nombre:r0.nombre,filtro:b.p_filtro,ts:Date.now()});
        return J({restantes:ev.cupo_fotos-r0.disparos});
      }
      if(u.includes('/rpc/ce_devolver_foto')){
        const b=cuerpo(), i=disparos.findIndex(d=>d.ruta===b.p_ruta);
        if(i>=0){ disparos.splice(i,1); rollos[b.p_token].disparos--; }
        return J({devueltas:1});
      }
      if(u.includes('/rpc/ce_camara_stats'))
        return J({fotos:disparos.length,invitados:Object.keys(rollos).length,revelado:!!ev.revelado});
      if(u.includes('/rpc/ce_album_de')){
        if(!ev.revelado) return E('Todavía no se reveló');
        const b=cuerpo();
        return J({revelado:true,
          mias:disparos.filter(d=>d.token===b.p_token).map((d,i)=>({id:'m'+i,ruta:d.ruta,filtro:d.filtro,ts:d.ts})),
          todas:disparos.map((d,i)=>({id:'t'+i,ruta:d.ruta,filtro:d.filtro,ts:d.ts,nombre:d.nombre})),
          total_fotos:disparos.length,total_invitados:Object.keys(rollos).length});
      }
      if(u.includes('/rpc/ce_album_pagina')){
        if(clave!==CLAVE) return J([]);
        const b=cuerpo(), d=b.p_desde||0;
        return J(disparos.slice(d,d+(b.p_cuanto||500)).map((x,i)=>({id:'p'+i,ruta:x.ruta,filtro:x.filtro,ts:x.ts,nombre:x.nombre})));
      }
      if(u.includes('/rpc/')) return r.fulfill({status:404,contentType:'application/json',
        body:JSON.stringify({code:'PGRST202',message:'Could not find the function'})});
      if(u.includes('/ce_eventos')){
        if(m==='GET') return J(clave===CLAVE?[ev]:[]);      // blindada
        if(m==='POST'){ Object.assign(ev,cuerpo()); return r.fulfill({status:201,body:''}); }
        if(m==='PATCH'){ if(clave!==CLAVE) return r.fulfill({status:403,contentType:'application/json',
              body:JSON.stringify({message:'row-level security'})});
          Object.assign(ev,cuerpo()); return r.fulfill({status:204,body:''}); }
      }
      return J([]);
    });
  }};
}

(async()=>{
 const br=await chromium.launch({args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
 const bd=base(); const errs=[];
 const mirar=(p,q)=>{p.on('pageerror',e=>errs.push(q+' '+e.message));
   p.on('console',m=>{if(m.type()==='error'&&!/net::ERR|Failed to load/.test(m.text()))errs.push(q+' '+m.text())})};

 console.log('\n═══ EL INVITADO AGARRA SU CÁMARA ═══');
 const ctx=await br.newContext({viewport:{width:390,height:844},permissions:['camera']});
 const inv=await ctx.newPage(); await bd.instalar(inv); mirar(inv,'INV');
 await inv.goto(`${B}/rollo.html?e=${bd.ev.codigo}`,{waitUntil:'domcontentloaded'});
 await inv.waitForTimeout(2000);
 af((await T(inv)).includes('Casamiento Flor y Juan'),'entra por el QR sin ninguna clave',await T(inv));
 af(/3 fotos|tenés 3/i.test(await T(inv)),'le dice cuántas fotos tiene',await T(inv));
 await inv.fill('#nombreG','Nélida'); await inv.click('#entrar'); await inv.waitForTimeout(3000);
 af(/quedan/i.test(await T(inv)),'se abre la cámara con el contador',await T(inv));

 const disp=inv.locator('#disparo, .disparo, [id*=disparo]').first();
 for(let i=1;i<=3;i++){ await disp.click({force:true}); await inv.waitForTimeout(2200); }
 af(bd.disparos.length===3,'saca sus 3 fotos',bd.disparos.length);
 af(bd.disparos.every(d=>d.ruta.startsWith(bd.ev.codigo+'/')),
    'y cada foto va a la carpeta de SU evento y SU rollo',bd.disparos[0]&&bd.disparos[0].ruta);
 await inv.waitForTimeout(1500);
 af(/ya sacaste|complet/i.test(await T(inv)),'con el rollo lleno le avisa y cierra la cámara',await T(inv));

 console.log('\n═══ EL ORGANIZADOR REVELA ═══');
 const ctx2=await br.newContext({viewport:{width:390,height:844}});
 const org=await ctx2.newPage(); await bd.instalar(org); mirar(org,'ORG');
 await org.goto(`${B}/rollo.html#ev/${bd.ev.codigo}`,{waitUntil:'domcontentloaded'});
 await org.waitForTimeout(1800);
 af(/clave/i.test(await T(org)),'sin la clave guardada, se la pide',await T(org));
 const c1=org.locator('#laClave');
 if(await c1.count()){
   await org.fill('#codClave',bd.ev.codigo).catch(()=>{});
   await c1.fill(bd.CLAVE);
   await org.locator('#entrarClave').click(); await org.waitForTimeout(2600);
 }
 af((await T(org)).includes('Casamiento Flor y Juan'),'con la clave entra a su rollo',await T(org));
 af(/3 fotos de 1 invitado/i.test(await T(org)),'y ve cuántas fotos hay',await T(org));
 await org.click('#revelar'); await org.waitForTimeout(2200);
 af(bd.ev.revelado===true,'revela el rollo');

 console.log('\n═══ EL INVITADO VE SUS FOTOS ═══');
 await inv.reload({waitUntil:'domcontentloaded'}); await inv.waitForTimeout(3000);
 for(let i=0;i<3;i++){ await inv.mouse.click(195,420).catch(()=>{}); await inv.waitForTimeout(1200); }
 await inv.waitForTimeout(2500);
 const tInv=await T(inv);
 af(/3 fotos/.test(tInv),'el álbum le dice cuántas hay',tInv);
 af(await inv.locator('.grilla img').count()>0,'y se ven las fotos');

 console.log('\n─── errores de JavaScript ───');
 console.log(errs.length?errs.slice(0,6).join('\n'):'   ninguno');
 console.log(`\n${bien} bien · ${mal} mal`);
 await br.close(); process.exit(mal||errs.length?1:0);
})().catch(e=>{console.log('SE CORTÓ: '+e.message);process.exit(1)});
