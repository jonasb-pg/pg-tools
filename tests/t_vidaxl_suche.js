const fs=require('fs'); const md=fs.readFileSync(__dirname+'/../docs/vidaxl/such-waechter-2026-11-06.md','utf8'); const src=md.split('```js')[1].split('```')[0];
function make(){
  const env={log:[],calls:[],pending:[],screen:'',btn:'',listeners:{}};
  let T=0, timers=[];
  const ctx={
    document:{hidden:false,addEventListener:(n,f)=>env.listeners[n]=f},
    navigator:{userAgent:'Test'},
    Date:{now:()=>T},
    setTimeout:(f,ms)=>{const t={at:T+ms,f,on:true};timers.push(t);return t},
    clearTimeout:(t)=>{if(t)t.on=false},
    $:(id)=>({value:env.sku||'',focus(){}}),
    hideSaveBanner(){}, newItem:()=>({}), clearResult(){}, gotoManual:(v)=>env.screen='manual', toast(){},
    applyProduct(p){}, renderProduct:()=>env.screen='product:'+env.lastV, renderCandidates:()=>env.screen='cand', renderNotFound:()=>env.screen='nf',
    renderError:(m)=>env.screen='error:'+m, setSearching:(on)=>env.btn=on?'Suche':'Suchen',
    call:(fn,...a)=>{ if(fn==='clientLog'){env.log.push(a[0]+' | '+a[1]);return Promise.resolve(true);} return new Promise((res,rej)=>{env.calls.push(a[0]);env.pending.push({v:a[0],res,rej});}); },
  };
  const keys=Object.keys(ctx);
  const f=new Function(...keys,'let item={}, candidates=[];'+src+';return {submitSku,SUCHE};');
  const api=f(...keys.map(k=>ctx[k]));
  env.tick=async(ms)=>{T+=ms; for(const t of timers.slice()) if(t.on&&t.at<=T){t.on=false;t.f();} await new Promise(r=>setImmediate(r));};
  env.answer=async(i,found=true)=>{const p=env.pending[i]; env.lastV=p.v; p.res({code:{raw:p.v,type:'sku'},found,product:found?{name:'x'}:null}); await new Promise(r=>setImmediate(r));};
  return {env,api};
}
const assert=require('assert'); let n=0; const ok=(c,m)=>{assert(c,m);n++;};
(async()=>{
 // 1 normal
 let {env,api}=make(); env.sku='123456'; api.submitSku(); ok(env.btn==='Suche','sucht'); await env.tick(3000); await env.answer(0); ok(env.screen==='product:123456','produkt'); ok(env.btn==='Suchen','frei');
 await env.tick(30000); ok(env.calls.length===1 && env.log.length===0,'kein Wächter nach Antwort');
 // 2 doppelt
 ({env,api}=make()); env.sku='123456'; api.submitSku(); api.submitSku(); ok(env.calls.length===1,'doppelt ignoriert');
 // 3 verlorene Antwort -> Wiederholung -> Antwort
 ({env,api}=make()); env.sku='555555'; api.submitSku(); await env.tick(20000); ok(env.calls.length===2,'wiederholt'); ok(env.btn==='Suche','noch suchend'); await env.answer(1); ok(env.screen==='product:555555','produkt nach wiederholung'); ok(env.log.some(l=>l.startsWith('Keine Antwort'))&&env.log.some(l=>l.startsWith('Antwort nach Wiederholung')),'protokoll');
 // späte erste Antwort darf nichts mehr tun
 env.screen='x'; await env.answer(0); ok(env.screen==='x','späte antwort ignoriert');
 // 4 zweimal keine Antwort -> Fehler
 ({env,api}=make()); env.sku='777777'; api.submitSku(); await env.tick(20000); await env.tick(20000); ok(env.screen.startsWith('error:Keine Antwort'),'fehlermeldung'); ok(env.btn==='Suchen','knopf frei'); await env.answer(1); ok(env.screen.startsWith('error'),'späte antwort nach fehler ignoriert');
 // erneut versuchen geht
 api.submitSku(); ok(env.calls.length===3,'nochmals versuchen');
 // 5 erste Antwort kommt während Wiederholung -> genommen
 ({env,api}=make()); env.sku='888888'; api.submitSku(); await env.tick(20000); await env.answer(0); ok(env.screen==='product:888888','erste antwort genommen'); await env.tick(25000); ok(!env.screen.startsWith('error'),'kein fehler danach');
 // 6 andere SKU während Suche
 ({env,api}=make()); env.sku='111111'; api.submitSku(); env.sku='222222'; api.submitSku(); ok(env.calls.length===2,'neue sku sucht'); await env.answer(0); ok(env.screen==='','alte antwort verworfen'); await env.answer(1); ok(env.screen==='product:222222','neue antwort');
 // 7 Rückkehr aus Hintergrund
 ({env,api}=make()); env.sku='333333'; api.submitSku(); await env.tick(5000); env.listeners.visibilitychange(); ok(env.calls.length===2,'neustart nach rückkehr'); await env.answer(1); ok(env.screen==='product:333333','antwort nach rückkehr');
 // 8 Fehler vom Server
 ({env,api}=make()); env.sku='444444'; api.submitSku(); env.pending[0].rej(new Error('Boom')); await new Promise(r=>setImmediate(r)); ok(env.screen==='error:Suche fehlgeschlagen: Boom','serverfehler'); ok(env.btn==='Suchen','frei nach fehler');
 // 9 Text -> Handeingabe, laufende Suche verworfen
 ({env,api}=make()); env.sku='555'; api.submitSku(); env.sku='Teppich'; api.submitSku(); ok(env.screen==='manual','text'); await env.answer(0); ok(env.screen==='manual','alte antwort ignoriert'); await env.tick(45000); ok(env.screen==='manual','kein wächter');
 console.log('OK', n, 'Prüfungen');
})().catch(e=>{console.error('FEHLER',e.message);process.exit(1)});
