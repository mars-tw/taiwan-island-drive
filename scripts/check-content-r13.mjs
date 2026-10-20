import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE||'C:/Users/digimkt/Desktop/遊戲/storm-apocalypse/node_modules/playwright/index.mjs').href);
const base=process.env.BASE_URL||'http://127.0.0.1:5286/',out='docs/content/r13',scope=process.env.R13_SCOPE||'play';
await mkdir(out,{recursive:true});const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']}),rows=[],shots=[],errors=[],external=[],responses=[];
const a=(p,id)=>p.locator(`[data-action="${id}"]`),diag=p=>p.locator('.content-scene').evaluate(e=>({...e.dataset})),check=(label,detail={})=>{rows.push({label,status:'VERIFIED',...detail});console.log('VERIFIED '+label);};
const record=(p,k)=>p.evaluate(k=>JSON.parse(localStorage.getItem('island-transport:student:v2')).sections.contentR1[k],k);
function watch(p){p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(/^https?:/.test(r.url())&&new URL(r.url()).origin!==new URL(base).origin)external.push(r.url());});p.on('response',r=>{if(r.status()>=400)responses.push({url:r.url(),status:r.status()});});}
async function enter(p,k){await p.locator('#content-start').click();await p.locator(`[data-content=${k}]`).click();}
async function key(p,id,on){await a(p,id).dispatchEvent(on?'keydown':'keyup',{key:' '});}
async function hold(p,id,ms){const r=await a(p,id).boundingBox();await p.mouse.move(r.x+r.width/2,r.y+r.height/2);await p.mouse.down();await p.waitForTimeout(ms);await p.mouse.up();await p.waitForTimeout(100);}
async function freeze(p,fn){
 if(await p.evaluate(()=>!!window.__r13Capture))return fn();
 await p.evaluate(()=>new Promise(resolve=>{
  if(!window.__r13Scheduler){const cancel=cancelAnimationFrame.bind(window);window.__r13Scheduler={next:-1,ids:new Map(),cancel};window.cancelAnimationFrame=id=>{const s=window.__r13Scheduler;cancel(s.ids.get(id)??id);s.ids.delete(id);};}
  const original=requestAnimationFrame.bind(window),queued=[],scheduler=window.__r13Scheduler;
  window.__r13Capture={original,queued};window.requestAnimationFrame=cb=>{const id=scheduler.next--;queued.push({id,cb});return id;};original(()=>original(resolve));
 }));
 try{return await fn();}finally{await p.evaluate(()=>{const {original,queued}=window.__r13Capture,s=window.__r13Scheduler;window.requestAnimationFrame=original;delete window.__r13Capture;for(const {id,cb} of queued){const real=original(t=>{s.ids.delete(id);cb(t);});s.ids.set(id,real);}});}
}
async function geometry(p){return p.locator('.content-scene').evaluate(e=>{const rect=x=>{const r=x.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};return {scene:rect(e),car:rect(e.querySelector('.content-car')),bay:rect(e.querySelector('.cake-bay-mark')),step:{box:rect(e.querySelector('.ticket-boarding-bridge')),hidden:e.querySelector('.ticket-boarding-bridge').hidden,transform:getComputedStyle(e.querySelector('.ticket-boarding-bridge')).transform},markers:[...e.querySelectorAll('[data-stop] b')].map(x=>({id:x.parentElement.dataset.stop,box:rect(x)})),people:[...e.querySelectorAll('.boarding-friend,.ticket-seated,.content-walker:not([hidden]),.crossing-waiting>div,.crossing-arrived>div')].filter(x=>x.getClientRects().length).map(x=>({id:x.dataset.friend||x.dataset.person||x.dataset.waiting||x.dataset.arrivedFriend,kind:x.className||x.parentElement.className,progress:x.dataset.progress,box:rect(x)})),door:rect(e.querySelector('.ticket-door')),signs:[...e.querySelectorAll('[data-platform]')].map(x=>({id:x.dataset.platform,box:rect(x),pole:getComputedStyle(x,'::after').height})),checks:[...e.querySelectorAll('.crossing-arrived b')].map(x=>({id:x.parentElement.dataset.arrivedFriend,box:rect(x)}))};});}
async function shot(p,name,folder=out){return freeze(p,async()=>{await p.evaluate(async()=>Promise.all([...document.images].filter(i=>i.getClientRects().length).map(i=>i.decode().catch(()=>{}))));const path=`${folder}/${name}.png`;await p.screenshot({path});const b=await readFile(path),s={path,width:b.readUInt32BE(16),height:b.readUInt32BE(20),sha256:createHash('sha256').update(b).digest('hex'),phase:await p.locator('#content-r1').getAttribute('data-phase'),state:await diag(p),hint:await p.locator('#content-hint').innerText(),controls:await p.locator('#content-controls button').evaluateAll(es=>es.map(e=>({action:e.dataset.action,text:e.innerText,needed:e.dataset.needed,held:e.dataset.held,release:e.dataset.release,checked:e.dataset.checked,color:getComputedStyle(e).backgroundColor}))),geometry:await geometry(p),proof:await proof(p),native:false,method:'Original headless runtime PNG; RAF paused during capture only; no game state assignments or pixel edits'};shots.push(s);return s;});}
async function proof(p){return p.locator('.content-scene').evaluate(e=>{const r=x=>{if(!x)return null;const b=x.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,right:b.right,bottom:b.bottom};};const flag=e.querySelector('.cake-closeup .cake-flag-tip');return {statusFont:getComputedStyle(e.querySelector('.force-readout small')||e).fontSize,miniFlag:r(e.querySelector('.cake-miniature .cake-flag-tip')),meter:+(e.querySelector('[role=meter]')?.getAttribute('aria-valuenow')||0),flag:r(flag),cakeWidth:108*.96,rigid:e.querySelector('.cake-rigid').style.transform,queue:e.querySelector('.ticket-queue-path').innerHTML,counts:r(e.querySelector('.ticket-counts')),train:r(e.querySelector('.ticket-vehicle')),carSource:e.querySelector('.content-car').getAttribute('src'),trainSource:e.querySelector('.content-train').getAttribute('src'),pastArrow:getComputedStyle(e,'::after').content,waiting:[...e.querySelectorAll('.crossing-waiting b')].map(x=>({text:x.textContent,box:r(x)}))};});}
const intersects=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y));
async function reachable(p,label){const bad=await p.locator('#content-r1 button').evaluateAll(es=>es.filter(e=>e.getClientRects().length&&!e.disabled).map(e=>{const r=e.getBoundingClientRect(),points=[[r.x+r.width/2,r.y+r.height/2],[r.x+4,r.y+4],[r.right-4,r.bottom-4]];return {id:e.id||e.dataset.action||e.dataset.platform||e.dataset.content,width:r.width,height:r.height,hits:points.map(([x,y])=>{const h=document.elementFromPoint(x,y);return h?.outerHTML.slice(0,220);}),bad:r.width<59.8||r.height<59.8||r.x<-.5||r.y<-.5||r.right>innerWidth+.5||r.bottom>innerHeight+.5||points.some(([x,y])=>{const h=document.elementFromPoint(x,y);return h!==e&&!e.contains(h);})};}));assert.ok(bad.length);assert.deepEqual(bad.filter(x=>x.bad),[],label);check(label,{controls:bad.length});}
async function saved(p,k){await shot(p,`phone-${k}-complete`);await writeFile(`${out}/saved-${k}.json`,JSON.stringify(await record(p,k),null,2));assert.equal((await record(p,k)).completed,true);await p.locator('#content-back').click();await p.reload();await enter(p,k);assert.equal(await p.locator('#content-r1').getAttribute('data-phase'),'done');assert.equal(await p.locator('.content-scene-cue').isVisible(),true);assert.doesNotMatch(await p.locator('.content-scene-cue').innerText(),/第 3 站/);const final=await shot(p,`phone-${k}-saved-result`);if(k==='tickets'){assert.equal(final.proof.counts.height,0);assert.ok(Math.abs(final.proof.train.width/final.proof.train.height-2.42)<.02);assert.equal(new URL(final.proof.trainSource,base).pathname,'/art/content-r3/train-side.webp');}if(k==='cake')assert.equal(new URL(final.proof.carSource,base).pathname,'/art/content-r11/car-rear.png');for(const [w,h] of [[320,568],[568,320],[844,390],[768,1024],[1024,768],[1366,600],[1280,640]]){await p.setViewportSize({width:w,height:h});await reachable(p,`${k} saved result ${w}x${h}`);await shot(p,`device-${w}x${h}-${k}-saved`);}await p.setViewportSize({width:390,height:844});await p.locator('#content-back').click();check(`${k}: three stations completed and saved reload`);}
async function confirm(p){await a(p,'look-left').click();await a(p,'look-right').click();const d=await diag(p);await a(p,d.person==='bike'?'look-right':'look-left').click();}
async function ticketsArrival(p,stage,wrong=false){const correct=['藍圓形','橘三角形','綠正方形'][stage];await (wrong?p.locator(`[data-platform="${[1,0,0][stage]}"]`):p.getByRole('button',{name:correct+'月台',exact:true})).click();await hold(p,'go',5700);await hold(p,'brake',1600);}
let status='EXECUTED';
const wait=p=>p.waitForTimeout(100);
async function cakeRun(p){
 await enter(p,'cake');await a(p,'begin').click();await shot(p,'phone-cake-start');
 await key(p,'go',true);await p.waitForFunction(()=>+document.querySelector('.content-scene').dataset.balanceLean<=-20,null,{timeout:5000,polling:10}).catch(async e=>{console.log(await diag(p),errors);await shot(p,'phone-cake-debug');throw e;});
 const lean=await shot(p,'phone-cake-release-1');await key(p,'go',false);
 await p.waitForFunction(()=>Math.abs(+document.querySelector('.content-scene').dataset.balanceLean)<=11,null,{polling:10});const halfway=await shot(p,'phone-cake-recovering-2');
 await p.waitForFunction(()=>Math.abs(+document.querySelector('.content-scene').dataset.balanceLean)<2,null,{polling:10});const steady=await shot(p,'phone-cake-steady-3');
 for(const s of [lean,halfway,steady]){assert.equal(s.controls.find(b=>b.action==='go').text,'踏板');assert.ok(parseFloat(s.proof.statusFont)>=14);assert.ok(s.controls.filter(b=>b.needed==='true').length<=1);}
 for(const [before,after] of [[lean,halfway],[halfway,steady]]){assert.ok(after.proof.meter-before.proof.meter>=15);assert.ok(after.proof.flag.x-before.proof.flag.x>=20);assert.ok(after.proof.miniFlag.x>before.proof.miniFlag.x);}
 check('cake release alone recovers, three meter frames +15pp and flag +20px, roof flag synchronized');
 for(let stage=0;stage<3;stage++){
  let go=false,steer='',captured=new Set();
  for(let n=0;n<1600&&+(await diag(p)).distance<55;n++){
   const d=await diag(p),distance=+d.distance,roll=+d.balanceLean;
   const road=distance>15&&distance<=40?(+d.bend<0?'left':'right'):'';
   if(steer!==road){if(steer)await key(p,steer,false);if(road)await key(p,road,true);steer=road;}
   if(stage===2&&distance>=42&&d.bayStopped==='false'){
    if(go){await key(p,'go',false);go=false;}if(steer){await key(p,steer,false);steer='';}
    await hold(p,'brake',1700);await p.waitForTimeout(2200);const s=await shot(p,'phone-cake-bay-stopped');assert.equal(s.state.bayStopped,'true');assert.equal(s.state.speed,'0.00');const coverage=intersects(s.geometry.car,s.geometry.bay)/(s.geometry.car.width*s.geometry.car.height);assert.ok(coverage>=.8);check('R11 bay containment regression',{coverage});assert.equal(s.controls.find(x=>x.needed==='true').action,'go');assert.equal(await p.locator('.cake-recovery').innerText(),'');
   }else{const next=Math.abs(roll)<(go?20:3);if(next!==go){await key(p,'go',next);go=next;}}
   if(stage===1&&road&&Math.abs(roll)>12&&roll*(road==='left'?1:-1)>0&&!captured.has(road)){
    const s=await shot(p,`phone-cake-${road}-bend`);assert.equal(s.state.bend,road==='left'?'-1':'1');assert.ok(+s.state.balanceLean*(road==='left'?1:-1)>12);captured.add(road);
   }
   if(stage===0&&distance>10&&!captured.has('slope')){await shot(p,'phone-cake-slope-progress');captured.add('slope');}
   if(stage===2&&d.bayRestarted==='true'&&!captured.has('restart')){await shot(p,'phone-cake-bay-restarted');captured.add('restart');}
   await p.waitForTimeout(150);
  }
  if(go)await key(p,'go',false);if(steer)await key(p,steer,false);assert.equal(+(await diag(p)).distance,55);
  await hold(p,'brake',1800);await shot(p,`phone-cake-stage-${stage+1}-result`);assert.equal((await record(p,'cake')).stage,Math.min(stage+1,2));if(stage<2)await a(p,'next').click();
  check(`cake stage ${stage+1}: completed through actual controls and saved`);
 }
 await saved(p,'cake');
}
function noOverlaps(s){const people=s.geometry.people.filter(x=>x.kind==='crossing-arrived');for(let i=0;i<people.length;i++)for(let j=i+1;j<people.length;j++)assert.equal(intersects(people[i].box,people[j].box),0);for(const person of people){const b=person.box,r=s.geometry.scene;assert.ok(b.x>=r.x&&b.right<=r.right&&b.y>=r.y&&b.bottom<=r.bottom);}assert.equal(s.geometry.checks.length,people.length);}
async function crossingRun(p){
 await enter(p,'crossing');await a(p,'begin').click();
 for(let stage=0;stage<3;stage++){
  await hold(p,'brake',1400);await shot(p,`phone-crossing-stage-${stage+1}-start`);
  for(let n=0;n<3;n++){
   assert.equal((await diag(p)).lookedLeft,'false');assert.equal((await diag(p)).lookedRight,'false');
   await a(p,'look-left').click();await a(p,'depart').click({force:true});const missing=await shot(p,`phone-crossing-stage-${stage+1}-missing-right-${n+1}`);
   assert.equal(missing.controls.find(x=>x.needed==='true').action,'look-right');assert.notEqual(missing.proof.pastArrow,'"←"');assert.equal(missing.state.crossed,String(n));
   await a(p,'look-right').click();const who=(await diag(p)).person;await a(p,who==='bike'?'look-right':'look-left').click();
   if(n===0){const car=await shot(p,`phone-crossing-stage-${stage+1}-traffic`);assert.equal(car.state.trafficActive,'true');assert.equal(car.state.crossTime,'0.000');assert.match(car.hint,/等一等/);assert.equal(await p.locator('.crossing-traffic').isVisible(),true);}
   for(const [i,lo,hi] of [[1,.2,.32],[2,.48,.63],[3,.85,.98]]){
    await p.waitForFunction(({lo,hi})=>{const d=document.querySelector('.content-scene').dataset,t=+d.crossTime/+d.crossDuration;return t>=lo&&t<hi;},{lo,hi},{polling:10});
    const s=await shot(p,`phone-crossing-stage-${stage+1}-${who}-moving-${i}`),person=s.geometry.people.find(x=>x.kind==='content-walker');assert.ok(person);assert.equal(s.state.crossed,String(n));
    if(i<3){const foot=(person.box.bottom-s.geometry.scene.y)/s.geometry.scene.height;assert.ok(foot>=.60&&foot<=.68);}noOverlaps(s);
   }
   await p.waitForFunction(n=>+document.querySelector('.content-scene').dataset.crossed===n+1,n);const arrival=await shot(p,`phone-crossing-stage-${stage+1}-arrived-${n+1}`);noOverlaps(arrival);
   const ids=arrival.geometry.people.map(x=>x.id);assert.equal(new Set(ids).size,ids.length);
  }
  const ready=await shot(p,`phone-crossing-stage-${stage+1}-ready-depart`);noOverlaps(ready);assert.equal(ready.controls.find(x=>x.action==='depart').needed,'true');await a(p,'depart').click();await p.waitForTimeout(420);
  const departing=await shot(p,`phone-crossing-stage-${stage+1}-departing`);noOverlaps(departing);assert.ok(departing.geometry.car.y<ready.geometry.car.y-20);
  await p.waitForFunction(()=>['checkpoint','done'].includes(document.querySelector('#content-r1').dataset.phase));if(stage<2)await a(p,'next').click();check(`crossing stage ${stage+1}: visible car, three fresh observations, zebra route, no overlap or clipping`);
 }
 await saved(p,'crossing');
}
async function ticketsRun(p){
 await enter(p,'tickets');await a(p,'begin').click();const stops=[];
 for(let stage=0;stage<3;stage++){
  await ticketsArrival(p,stage,true);const wrong=await shot(p,`phone-tickets-stage-${stage+1}-wrong`);assert.equal(wrong.proof.queue,'');assert.equal(await a(p,'door').isDisabled(),true);assert.equal(await p.locator('[data-platform][data-choose=true]').count(),3);await reachable(p,`tickets stage ${stage+1} wrong station signs`);
  await ticketsArrival(p,stage);const stopped=await shot(p,`phone-tickets-stage-${stage+1}-stopped`);const selected=stopped.geometry.signs.find(x=>x.id===String([0,2,1][stage]));const error=Math.abs(selected.box.x+selected.box.width/2-stopped.geometry.door.x-stopped.geometry.door.width/2);assert.ok(error<=15,{error});stops.push(stopped);check(`tickets stage ${stage+1} sign-to-door alignment <=15px`,{error});
  const railGap=Math.max(...[756/809,755/809].map(wheel=>Math.abs(stopped.proof.train.y+stopped.proof.train.height*wheel-(stopped.geometry.scene.y+3+(stopped.geometry.scene.height-6)*1186/1536))));assert.ok(railGap<=3);check(`tickets stage ${stage+1} actual wheel-bottom to front rail <=3px`,{railGap});
  await a(p,'door').click();await p.waitForFunction(()=>document.querySelector('.content-scene').dataset.doorState==='open');const open=await shot(p,`phone-tickets-stage-${stage+1}-open`);assert.ok(Math.abs(open.proof.counts.y-wrong.proof.counts.y)<=4);
  for(let n=0;n<3;n++){
   await p.waitForFunction(n=>{const f=document.querySelector(`.boarding-friend[data-friend="${n}"]`);return f&&+f.dataset.progress>=.57&&+f.dataset.progress<.72;},n,{polling:10});const s=await shot(p,`phone-tickets-stage-${stage+1}-doorway-${n+1}`),person=s.geometry.people.find(x=>x.kind==='boarding-friend'&&x.id===String(n));assert.ok(intersects(person.box,s.geometry.door)>0);assert.ok(person.box.y>=s.proof.train.y);assert.equal(s.geometry.people.length,3);
  }
  await p.waitForFunction(()=>document.querySelector('.content-scene').dataset.doorState==='retracting',null,{polling:10});await shot(p,`phone-tickets-stage-${stage+1}-retracting`);
  await p.waitForFunction(()=>document.querySelector('.content-scene').dataset.doorState==='closing',null,{polling:10});const closing=await shot(p,`phone-tickets-stage-${stage+1}-closing`);assert.equal(closing.state.step,'0');assert.equal(await p.locator('.ticket-boarding-bridge').isVisible(),false);
  await p.waitForFunction(()=>document.querySelector('.content-scene').dataset.doorState==='closed'&&document.querySelector('#content-r1').dataset.phase==='boarding');const closed=await shot(p,`phone-tickets-stage-${stage+1}-closed`);assert.equal(closed.geometry.people.filter(x=>x.kind==='ticket-seated').length,3);assert.equal(closed.proof.queue,'');assert.ok(Math.abs(closed.proof.counts.y-open.proof.counts.y)<=4);
  if(stage<2){await a(p,'next').waitFor();await a(p,'next').click();}else await p.waitForFunction(()=>document.querySelector('#content-r1').dataset.phase==='done');check(`tickets stage ${stage+1}: doorway, seats, retract then close`);
 }
 assert.ok(Math.abs(stops[1].proof.train.x-stops[2].proof.train.x)>=100);check('platform 2 versus 3 moves the whole train >=100px',{delta:Math.abs(stops[1].proof.train.x-stops[2].proof.train.x)});await saved(p,'tickets');
}
try{
 if(['cake','crossing','tickets','probe','play'].includes(scope)){const c=await browser.newContext({viewport:{width:390,height:844},hasTouch:true}),p=await c.newPage();watch(p);await p.goto(base);if(scope==='probe'){await enter(p,'tickets');await a(p,'begin').click();await ticketsArrival(p,0);await a(p,'door').click();await p.waitForTimeout(300);await shot(p,'phone-tickets-probe');await p.locator('#content-back').click();await enter(p,'crossing');await a(p,'begin').click();await hold(p,'brake',1500);await shot(p,'phone-crossing-probe');}else if(scope==='play'){for(const fn of [cakeRun,crossingRun,ticketsRun])await fn(p);}else await ({cake:cakeRun,crossing:crossingRun,tickets:ticketsRun}[scope])(p);await c.close();}
 if(scope==='matrix')for(const [name,w,h] of [['se',320,568],['phone',390,844],['small-landscape',568,320],['landscape',844,390],['ipad',768,1024],['ipad-landscape',1024,768],['laptop',1366,600],['short-laptop',1280,640]]){
  const c=await browser.newContext({viewport:{width:w,height:h},hasTouch:true}),p=await c.newPage();watch(p);await p.goto(base);await p.locator('#content-start').click();await reachable(p,`${name} picker`);await p.locator('#content-back').click();
  for(const k of ['cake','crossing','tickets']){await enter(p,k);await reachable(p,`${name} ${k} intro`);await a(p,'begin').click();await reachable(p,`${name} ${k} playing`);assert.doesNotMatch(await p.locator('#content-r1').innerText(),/WASD|鍵盤|方向鍵|空白鍵/);await shot(p,`${name==='phone'?'phone':'device-'+name}-${k}-layout`);if(k==='tickets'){await ticketsArrival(p,0);await reachable(p,`${name} station sign controls`);await a(p,'door').click();await p.waitForTimeout(600);await shot(p,`device-${name}-tickets-boarding`);}await p.locator('#content-pause').click();await reachable(p,`${name} ${k} rest`);await p.waitForTimeout(150);const before=await diag(p);await p.waitForTimeout(200);assert.deepEqual(await diag(p),before);await p.locator('#content-resume').click();await p.locator('#content-back').click();}await c.close();
 }
 if(scope==='resilience'){
  const c=await browser.newContext({viewport:{width:390,height:844},hasTouch:true}),p=await c.newPage();watch(p);await p.goto(base);await p.evaluate(()=>navigator.serviceWorker.ready);await p.reload();await p.waitForFunction(()=>!!navigator.serviceWorker.controller);await c.setOffline(true);await p.reload();await enter(p,'crossing');await a(p,'begin').click();
  for(let s=0;s<3;s++){await hold(p,'brake',1500);for(let n=0;n<3;n++){await confirm(p);await p.waitForFunction(n=>+document.querySelector('.content-scene').dataset.crossed===n+1,n);}await a(p,'depart').click();await p.waitForFunction(()=>['checkpoint','done'].includes(document.querySelector('#content-r1').dataset.phase));if(s<2)await a(p,'next').click();}await shot(p,'phone-crossing-offline-result');await p.reload();await enter(p,'crossing');assert.equal(await p.locator('#content-r1').getAttribute('data-phase'),'done');await shot(p,'phone-crossing-offline-saved');await c.close();check('offline full three stations and completed reload');
  const d=await browser.newContext({viewport:{width:320,height:568},hasTouch:true,reducedMotion:'reduce'});await d.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw Error('storage disabled');}}));const q=await d.newPage();watch(q);await q.goto(base);await enter(q,'crossing');await a(q,'begin').click();await hold(q,'brake',1500);for(let n=0;n<3;n++){await confirm(q);await q.waitForFunction(n=>+document.querySelector('.content-scene').dataset.crossed===n+1,n);}await a(q,'depart').click();await pWaitCheckpoint(q);assert.match(await q.locator('#content-save').innerText(),/無法儲存/);await shot(q,'phone-crossing-storage-denied');await d.close();check('denied storage and reduced motion still complete');
 }
 if(scope==='store')for(const [w,h,dpr] of [[430,932,3],[1032,1376,2]]){const c=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:dpr,hasTouch:true}),p=await c.newPage();watch(p);await p.goto(base);await enter(p,'tickets');await a(p,'begin').click();await ticketsArrival(p,0);await a(p,'door').click();await p.waitForFunction(()=>{const f=document.querySelector('.boarding-friend[data-friend="0"]');return f&&+f.dataset.progress>=.57&&+f.dataset.progress<.72;},null,{polling:10});const folder='docs/store/screenshots/content-r13';await mkdir(folder,{recursive:true});await shot(p,`tickets-boarding-${w*dpr}x${h*dpr}`,folder);await c.close();check(`store original ${w*dpr}x${h*dpr}`);}
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert.deepEqual(responses,[]);status='VERIFIED';
}finally{await browser.close();await writeFile(`${out}/browser-${scope}.json`,JSON.stringify({status,rows,shots,errors,external,responses},null,2));}
async function pWaitCheckpoint(p){await p.waitForFunction(()=>document.querySelector('#content-r1').dataset.phase==='checkpoint');}
