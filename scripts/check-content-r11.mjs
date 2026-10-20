import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE||'C:/Users/digimkt/Desktop/遊戲/storm-apocalypse/node_modules/playwright/index.mjs').href);
const base=process.env.BASE_URL||'http://127.0.0.1:5286/',out='docs/content/r11',scope=process.env.R11_SCOPE||'play';
await mkdir(out,{recursive:true});const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']}),rows=[],shots=[],errors=[],external=[],responses=[];
const a=(p,id)=>p.locator(`[data-action="${id}"]`),diag=p=>p.locator('.content-scene').evaluate(e=>({...e.dataset})),check=(label,detail={})=>{rows.push({label,status:'VERIFIED',...detail});console.log('VERIFIED '+label);};
const record=(p,k)=>p.evaluate(k=>JSON.parse(localStorage.getItem('island-transport:student:v2')).sections.contentR1[k],k);
function watch(p){p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(/^https?:/.test(r.url())&&new URL(r.url()).origin!==new URL(base).origin)external.push(r.url());});p.on('response',r=>{if(r.status()>=400)responses.push({url:r.url(),status:r.status()});});}
async function enter(p,k){await p.locator('#content-start').click();await p.locator(`[data-content=${k}]`).click();}
async function key(p,id,on){await a(p,id).dispatchEvent(on?'keydown':'keyup',{key:' '});}
async function hold(p,id,ms){const r=await a(p,id).boundingBox();await p.mouse.move(r.x+r.width/2,r.y+r.height/2);await p.mouse.down();await p.waitForTimeout(ms);await p.mouse.up();await p.waitForTimeout(100);}
async function freeze(p,fn){
 if(await p.evaluate(()=>!!window.__r11Capture))return fn();
 await p.evaluate(()=>new Promise(resolve=>{
  if(!window.__r11Scheduler){const cancel=cancelAnimationFrame.bind(window);window.__r11Scheduler={next:-1,ids:new Map(),cancel};window.cancelAnimationFrame=id=>{const s=window.__r11Scheduler;cancel(s.ids.get(id)??id);s.ids.delete(id);};}
  const original=requestAnimationFrame.bind(window),queued=[],scheduler=window.__r11Scheduler;
  window.__r11Capture={original,queued};window.requestAnimationFrame=cb=>{const id=scheduler.next--;queued.push({id,cb});return id;};original(()=>original(resolve));
 }));
 try{return await fn();}finally{await p.evaluate(()=>{const {original,queued}=window.__r11Capture,s=window.__r11Scheduler;window.requestAnimationFrame=original;delete window.__r11Capture;for(const {id,cb} of queued){const real=original(t=>{s.ids.delete(id);cb(t);});s.ids.set(id,real);}});}
}
async function geometry(p){return p.locator('.content-scene').evaluate(e=>{const rect=x=>{const r=x.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};return {scene:rect(e),car:rect(e.querySelector('.content-car')),bay:rect(e.querySelector('.cake-bay-mark')),step:{box:rect(e.querySelector('.ticket-boarding-bridge')),hidden:e.querySelector('.ticket-boarding-bridge').hidden,transform:getComputedStyle(e.querySelector('.ticket-boarding-bridge')).transform},markers:[...e.querySelectorAll('[data-stop] b')].map(x=>({id:x.parentElement.dataset.stop,box:rect(x)})),people:[...e.querySelectorAll('.boarding-friend,.ticket-seated,.content-walker:not([hidden]),.crossing-waiting>div,.crossing-arrived>div')].filter(x=>x.getClientRects().length).map(x=>({id:x.dataset.friend||x.dataset.person||x.dataset.waiting||x.dataset.arrivedFriend,kind:x.className||x.parentElement.className,progress:x.dataset.progress,box:rect(x)})),door:rect(e.querySelector('.ticket-door')),signs:[...e.querySelectorAll('[data-platform]')].map(x=>({id:x.dataset.platform,box:rect(x),pole:getComputedStyle(x,'::after').height})),checks:[...e.querySelectorAll('.crossing-arrived b')].map(x=>({id:x.parentElement.dataset.arrivedFriend,box:rect(x)}))};});}
async function shot(p,name,folder=out){return freeze(p,async()=>{await p.evaluate(async()=>Promise.all([...document.images].filter(i=>i.getClientRects().length).map(i=>i.decode().catch(()=>{}))));const path=`${folder}/${name}.png`;await p.screenshot({path});const b=await readFile(path),s={path,width:b.readUInt32BE(16),height:b.readUInt32BE(20),sha256:createHash('sha256').update(b).digest('hex'),phase:await p.locator('#content-r1').getAttribute('data-phase'),state:await diag(p),hint:await p.locator('#content-hint').innerText(),controls:await p.locator('#content-controls button').evaluateAll(es=>es.map(e=>({action:e.dataset.action,text:e.innerText,needed:e.dataset.needed,held:e.dataset.held,release:e.dataset.release,checked:e.dataset.checked,color:getComputedStyle(e).backgroundColor}))),geometry:await geometry(p),native:false,method:'Original headless runtime PNG; RAF paused during capture only; no game state assignments or pixel edits'};shots.push(s);return s;});}
const intersects=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y));
async function reachable(p,label){const bad=await p.locator('#content-r1 button').evaluateAll(es=>es.filter(e=>e.getClientRects().length&&!e.disabled).map(e=>{const r=e.getBoundingClientRect(),points=[[r.x+r.width/2,r.y+r.height/2],[r.x+4,r.y+4],[r.right-4,r.bottom-4]];return {id:e.id||e.dataset.action||e.dataset.platform||e.dataset.content,width:r.width,height:r.height,bad:r.width<59.8||r.height<59.8||r.x<-.5||r.y<-.5||r.right>innerWidth+.5||r.bottom>innerHeight+.5||points.some(([x,y])=>{const h=document.elementFromPoint(x,y);return h!==e&&!e.contains(h);})};}));assert.ok(bad.length);assert.deepEqual(bad.filter(x=>x.bad),[],label);check(label,{controls:bad.length});}
async function saved(p,k){await shot(p,`phone-${k}-complete`);assert.equal((await record(p,k)).completed,true);await p.locator('#content-back').click();await p.reload();await enter(p,k);assert.equal(await p.locator('#content-r1').getAttribute('data-phase'),'done');assert.equal(await p.locator('.content-scene-cue').isVisible(),true);assert.doesNotMatch(await p.locator('.content-scene-cue').innerText(),/第 3 站/);await shot(p,`phone-${k}-saved-result`);for(const [w,h] of [[320,568],[568,320],[844,390],[768,1024],[1024,768],[1366,600],[1280,640]]){await p.setViewportSize({width:w,height:h});await reachable(p,`${k} saved result ${w}x${h}`);await shot(p,`device-${w}x${h}-${k}-saved`);}await p.setViewportSize({width:390,height:844});await p.locator('#content-back').click();check(`${k}: three stations completed and saved reload`);}
async function confirm(p){await a(p,'look-left').click();await a(p,'look-right').click();const d=await diag(p);await a(p,d.person==='bike'?'look-right':'look-left').click();}
async function ticketsArrival(p,stage,wrong=false){const correct=['藍圓形','橘三角形','綠正方形'][stage];await (wrong?p.locator(`[data-platform="${[1,0,0][stage]}"]`):p.getByRole('button',{name:correct+'月台',exact:true})).click();await hold(p,'go',5700);await hold(p,'brake',1600);}
let status='EXECUTED';
try{
 if(['play','probe','cake','crossing','tickets'].includes(scope)){
  const c=await browser.newContext({viewport:{width:390,height:844},hasTouch:true}),p=await c.newPage();watch(p);await p.goto(base);
  if(['play','probe','cake'].includes(scope)){
   await enter(p,'cake');await a(p,'begin').click();await shot(p,'phone-cake-pedal-ready');
   await key(p,'go',true);await p.waitForTimeout(100);await shot(p,'phone-cake-pedal-held');
   await p.waitForTimeout(1200);
   await p.waitForFunction(()=>document.querySelector('.content-scene').dataset.balanceStatus==='danger',null,{timeout:5000});
   const danger=await shot(p,'phone-cake-tilting-1');assert.equal(danger.state.balanceStatus,'danger');assert.match(danger.hint,/放開/);assert.equal(danger.controls.find(x=>x.action==='go').text,'請放開');assert.notEqual(danger.controls.find(x=>x.action==='go').color,'rgb(220, 228, 233)');
   await key(p,'go',false);await key(p,'right',true);await p.waitForTimeout(200);const fixing=await shot(p,'phone-cake-correcting-2');assert.equal(fixing.controls.find(x=>x.action==='go').text,'已放開');assert.equal(fixing.controls.find(x=>x.action==='right').held,'true');assert.ok(Math.abs(+fixing.state.balanceLean)<Math.abs(+danger.state.balanceLean));
   for(let n=0;n<60&&+(await diag(p)).recoveries===0;n++){const d=await diag(p);await key(p,'right',+d.balanceLean< -3);await key(p,'left',+d.balanceLean>3);await p.waitForTimeout(80);}await key(p,'right',false);await key(p,'left',false);await p.waitForTimeout(90);const fixed=await shot(p,'phone-cake-recovered-3');assert.ok(+fixed.state.recoveries>0);assert.ok(Math.abs(+fixed.state.balanceLean)<5);assert.equal(fixed.state.balanceStatus,'steady');check('cake live danger -> released pedal and correct direction -> recovered event');
   if(scope!=='probe'){
    for(let stage=0;stage<3;stage++){
     let go=false,steer='',bay=false;
     for(let n=0;n<1200&&+(await diag(p)).distance<55;n++){
      const d=await diag(p),lean=+d.balanceLean;
      if(+d.recoveries>0&&!shots.some(s=>s.path.endsWith(`phone-cake-recovery-${d.recoveries}.png`)))await shot(p,`phone-cake-recovery-${d.recoveries}`);
      const road=+d.distance>15&&+d.distance<=40?(+d.bend>0?'right':'left'):'';
      const want=Math.abs(lean)>7?(lean<0?'right':'left'):road;
      if(want!==steer){if(steer)await key(p,steer,false);if(want)await key(p,want,true);steer=want;}
      if(stage===2&&+d.distance>=42&&d.bayStopped==='false'){
       if(go){await key(p,'go',false);go=false;}if(steer){await key(p,steer,false);steer='';}
       await hold(p,'brake',1600);await p.waitForTimeout(900);const s=await shot(p,'phone-cake-bay-stopped');assert.equal(s.state.bayStopped,'true');assert.equal(s.state.speed,'0.00');assert.equal(s.state.cue,'go');const coverage=intersects(s.geometry.car,s.geometry.bay)/(s.geometry.car.width*s.geometry.car.height);assert.ok(coverage>=.8);check('car is at least 80% inside bay',{coverage});bay=true;
      }else{const desired=+d.speed<4.5&&Math.abs(lean)<16;if(go!==desired){await key(p,'go',desired);go=desired;}}
      if(stage===0&&+d.distance>10&&!shots.some(s=>s.path.endsWith('phone-cake-slope-timing.png')))await shot(p,'phone-cake-slope-timing');
      if(stage===1&&+d.distance>18&&!shots.some(s=>s.path.endsWith('phone-cake-bends-timing.png')))await shot(p,'phone-cake-bends-timing');
      if(stage===2&&bay&&(await diag(p)).bayRestarted==='true'&&!shots.some(s=>s.path.endsWith('phone-cake-bay-restarted.png')))await shot(p,'phone-cake-bay-restarted');
      await p.waitForTimeout(100);
     }
     if(go)await key(p,'go',false);if(steer)await key(p,steer,false);assert.equal(+(await diag(p)).distance,55);await hold(p,'brake',1800);await shot(p,`phone-cake-stage-${stage+1}-result`);if(stage<2)await a(p,'next').click();check(`cake ${stage+1}: real completed stage and checkpoint`);
    }await saved(p,'cake');
   }
  }
  if(scope==='play'||scope==='crossing'){
   await enter(p,'crossing');await a(p,'begin').click();
   for(let stage=0;stage<3;stage++){
    await hold(p,'brake',1400);
    for(let n=0;n<3;n++){
     const reset=await shot(p,`phone-crossing-stage-${stage+1}-reset-${n+1}`);assert.equal(reset.state.lookedLeft,'false');assert.equal(reset.state.lookedRight,'false');assert.equal(reset.controls.filter(x=>x.checked==='true').length,0);
     await a(p,'look-left').click();await a(p,'depart').click({force:true});const missing=await shot(p,`phone-crossing-stage-${stage+1}-missing-right-${n+1}`);assert.equal(missing.state.crossed,String(n));assert.equal(missing.state.speed,'0.00');assert.match(missing.hint,/右/);assert.equal(missing.controls.filter(x=>x.needed==='true').length,1);assert.equal(missing.controls.find(x=>x.needed==='true').action,'look-right');assert.doesNotMatch(await p.locator('.content-observe').innerText(),/看左/);
     await confirm(p);
     if(stage===1&&n===0){for(const [i,lo,hi] of [[1,.10,.24],[2,.45,.60],[3,.82,.96]]){await p.waitForFunction(({lo,hi})=>{const d=document.querySelector('.content-scene').dataset,t=+d.crossTime/+d.crossDuration;return t>=lo&&t<hi;},{lo,hi},{polling:10});await shot(p,`phone-crossing-grandma-moving-${i}`);}}
     else{await p.waitForFunction(()=>+document.querySelector('.content-scene').dataset.crossTime>.2);await shot(p,`phone-crossing-stage-${stage+1}-${missing.state.person}-moving`);}
     await p.waitForFunction(n=>+document.querySelector('.content-scene').dataset.crossed===n+1,n);await shot(p,`phone-crossing-stage-${stage+1}-arrived-${n+1}`);
    }
    await a(p,'depart').click();await shot(p,`phone-crossing-stage-${stage+1}-result`);if(stage<2)await a(p,'next').click();check(`crossing ${stage+1}: three resets, missing-side blocks and three safe arrivals`);
   }await saved(p,'crossing');
  }
  if(scope==='play'||scope==='tickets'){
   await enter(p,'tickets');await a(p,'begin').click();
   for(let stage=0;stage<3;stage++){
    await ticketsArrival(p,stage,true);await a(p,'door').click();const wrong=await shot(p,`phone-tickets-stage-${stage+1}-wrong-closed`);assert.equal(wrong.state.step,'0');assert.equal(await p.locator('.ticket-boarding-bridge').isVisible(),false);assert.equal(await p.locator('.ticket-vehicle').getAttribute('data-doors'),'false');
    await ticketsArrival(p,stage);await shot(p,`phone-tickets-stage-${stage+1}-stopped`);await a(p,'door').click();await p.waitForFunction(()=>document.querySelector('.content-scene').dataset.doorState==='open');const open=await shot(p,`phone-tickets-stage-${stage+1}-open`);const marker=open.geometry.markers.find(x=>x.id===String([0,2,1][stage]));const align=Math.abs(marker.box.x+marker.box.width/2-open.geometry.door.x-open.geometry.door.width/2),floorGap=Math.abs(open.geometry.step.box.y-(open.geometry.scene.y+open.geometry.scene.height*.69));assert.ok(align<=20);assert.ok(floorGap<=2);assert.ok(open.geometry.people.every(f=>f.box.x>=open.geometry.scene.x&&f.box.right<=open.geometry.scene.right));check(`tickets ${stage+1}: doorway marker <=20px, horizontal step meets platform, queue within scene`,{align,floorGap});
    for(let n=0;n<3;n++){
     await p.waitForFunction(n=>{const f=document.querySelector(`.boarding-friend[data-friend="${n}"]`);return f&&+f.dataset.progress>=.57&&+f.dataset.progress<.72;},n,{polling:10});
     const s=await shot(p,`phone-tickets-stage-${stage+1}-doorway-${n+1}`),f=s.geometry.people.find(x=>x.kind==='boarding-friend'&&x.id===String(n));assert.ok(intersects(f.box,s.geometry.door)>0);assert.equal(s.geometry.people.length,3);
    }
    await p.waitForFunction(()=>document.querySelector('.content-scene').dataset.doorState==='retracting',null,{polling:10});await shot(p,`phone-tickets-stage-${stage+1}-retracting`);
    await p.waitForFunction(()=>document.querySelector('.content-scene').dataset.doorState==='closing',null,{polling:10});const closing=await shot(p,`phone-tickets-stage-${stage+1}-closing`);assert.equal(closing.state.step,'0');assert.equal(await p.locator('.ticket-boarding-bridge').isVisible(),false);
    await p.waitForFunction(()=>document.querySelector('.content-scene').dataset.doorState==='closed'&&document.querySelector('#content-r1').dataset.phase==='boarding');const closed=await shot(p,`phone-tickets-stage-${stage+1}-closed`);assert.equal(closed.geometry.people.filter(x=>x.kind==='ticket-seated').length,3);assert.match(closed.controls.find(x=>x.action==='door').text,/門關好了/);if(stage<2){await a(p,'next').waitFor();await a(p,'next').click();}else await p.waitForFunction(()=>document.querySelector('#content-r1').dataset.phase==='done');check(`tickets ${stage+1}: wrong closed, open, three thresholds, retract before door, closed`);
   }await saved(p,'tickets');
  }await c.close();
 }
 if(scope==='matrix')for(const [name,w,h] of [['se',320,568],['phone',390,844],['small-landscape',568,320],['landscape',844,390],['ipad',768,1024],['ipad-landscape',1024,768],['laptop',1366,600],['short-laptop',1280,640]]){
  const c=await browser.newContext({viewport:{width:w,height:h},hasTouch:true}),p=await c.newPage();watch(p);await p.goto(base);await p.locator('#content-start').click();await reachable(p,`${name} picker`);await p.locator('#content-back').click();
  for(const k of ['cake','crossing','tickets']){await enter(p,k);await reachable(p,`${name} ${k} intro`);await a(p,'begin').click();await reachable(p,`${name} ${k} playing`);assert.doesNotMatch(await p.locator('#content-r1').innerText(),/WASD|鍵盤|方向鍵|空白鍵/);await shot(p,`${name==='phone'?'phone':'device-'+name}-${k}-layout`);await p.locator('#content-pause').click();await reachable(p,`${name} ${k} rest`);await p.locator('#content-resume').click();await p.locator('#content-back').click();}await c.close();
 }
 if(scope==='resilience'){
  const c=await browser.newContext({viewport:{width:390,height:844},hasTouch:true}),p=await c.newPage();watch(p);await p.goto(base);await p.evaluate(()=>navigator.serviceWorker.ready);await p.reload();await p.waitForFunction(()=>!!navigator.serviceWorker.controller);await c.setOffline(true);await p.reload();await enter(p,'crossing');await a(p,'begin').click();
  for(let stage=0;stage<3;stage++){await hold(p,'brake',1400);for(let n=0;n<3;n++){await confirm(p);await p.waitForFunction(n=>+document.querySelector('.content-scene').dataset.crossed===n+1,n);}await a(p,'depart').click();if(stage<2)await a(p,'next').click();}assert.equal((await record(p,'crossing')).facts.waited,9);await shot(p,'phone-crossing-offline-result');await p.reload();await enter(p,'crossing');assert.equal(await p.locator('#content-r1').getAttribute('data-phase'),'done');await shot(p,'phone-crossing-offline-saved');check('installed offline reload, nine fresh observations and saved completion');await c.close();
  const denied=await browser.newContext({viewport:{width:320,height:568},hasTouch:true,reducedMotion:'reduce'});await denied.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw Error('storage disabled');}}));const q=await denied.newPage();watch(q);await q.goto(base);await enter(q,'crossing');await a(q,'begin').click();await hold(q,'brake',1400);await confirm(q);await q.locator('#content-pause').click();await q.waitForTimeout(150);const d=await diag(q);await q.waitForTimeout(300);assert.deepEqual(await diag(q),d);await q.locator('#content-resume').click();await q.waitForFunction(()=>document.querySelector('.content-scene').dataset.crossed==='1');for(let n=1;n<3;n++){await confirm(q);await q.waitForFunction(n=>+document.querySelector('.content-scene').dataset.crossed===n+1,n);}await a(q,'depart').click();assert.match(await q.locator('#content-save').innerText(),/無法儲存/);await shot(q,'phone-crossing-storage-denied');check('storage denied remains playable; pause freezes; reduced motion completes station');await denied.close();
 }
 if(scope==='store')for(const [w,h,dpr] of [[430,932,3],[1032,1376,2]]){const c=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:dpr,hasTouch:true}),p=await c.newPage();watch(p);await p.goto(base);await enter(p,'tickets');await a(p,'begin').click();await ticketsArrival(p,0);await a(p,'door').click();await p.waitForFunction(()=>{const f=document.querySelector('.boarding-friend[data-friend="0"]');return f&&+f.dataset.progress>=.57&&+f.dataset.progress<.72;},null,{polling:10});const folder='docs/store/screenshots/content-r11';await mkdir(folder,{recursive:true});await shot(p,`tickets-boarding-${w*dpr}x${h*dpr}`,folder);await c.close();check(`store ${w*dpr}x${h*dpr} original runtime`);}
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert.deepEqual(responses,[]);status='VERIFIED';
}finally{await browser.close();await writeFile(`${out}/browser-${scope}.json`,JSON.stringify({status,rows,shots,errors,external,responses},null,2));}
