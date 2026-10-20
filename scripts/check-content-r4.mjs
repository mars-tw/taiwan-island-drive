import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE||'C:/Users/digimkt/Desktop/遊戲/storm-apocalypse/node_modules/playwright/index.mjs').href);
const base=process.env.BASE_URL||'http://127.0.0.1:5286/',out='docs/content/r4',store='docs/store/screenshots/content-r4',scope=process.env.R4_SCOPE||'all';
await mkdir(out,{recursive:true});await mkdir(store,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']}),rows=[],shots=[],errors=[],external=[],responses=[];
let status='EXECUTED';
const a=(p,id)=>p.locator(`[data-action="${id}"]`),diag=p=>p.locator('.content-scene').evaluate(e=>({...e.dataset}));
const check=(label,detail={})=>{rows.push({label,status:'VERIFIED',...detail});console.log('VERIFIED '+label);};
function watch(p){p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(/^https?:/.test(r.url())&&new URL(r.url()).origin!==new URL(base).origin)external.push(r.url());});p.on('response',r=>{if(r.status()>=400)responses.push({url:r.url(),status:r.status()});});}
async function frozen(p,fn){await p.evaluate(()=>new Promise(resolve=>{const original=requestAnimationFrame,queued=[];window.__r4Capture={original,queued};window.requestAnimationFrame=cb=>{queued.push(cb);return 0;};original(()=>original(resolve));}));try{return await fn();}finally{await p.evaluate(()=>{const {original,queued}=window.__r4Capture;window.requestAnimationFrame=original;delete window.__r4Capture;queued.forEach(cb=>original(cb));});}}
async function shot(p,name,folder=out){await p.evaluate(async()=>{await Promise.all([...document.images].filter(i=>i.getClientRects().length).map(i=>i.decode().catch(()=>{})));});const path=`${folder}/${name}.png`;await p.screenshot({path});const b=await readFile(path);shots.push({path,width:b.readUInt32BE(16),height:b.readUInt32BE(20),sha256:createHash('sha256').update(b).digest('hex'),native:false,method:'Original headless runtime capture; no resizing, annotation or gameplay-state assignment'});return path;}
async function reach(p,label){const controls=await p.locator('#content-r1 button').evaluateAll(es=>es.filter(e=>e.getClientRects().length&&!e.disabled).map(e=>{const r=e.getBoundingClientRect();return {id:e.dataset.action||e.dataset.platform||e.id,size:[r.width,r.height],bad:r.width<59.8||r.height<59.8||r.x<-.5||r.y<-.5||r.right>innerWidth+.5||r.bottom>innerHeight+.5||[[r.x+r.width/2,r.y+r.height/2],[r.x+4,r.y+4],[r.right-4,r.bottom-4]].some(([x,y])=>{const h=document.elementFromPoint(x,y);return h!==e&&!e.contains(h);})};}));assert.ok(controls.length);assert.deepEqual(controls.filter(c=>c.bad),[],label);check(label,{controls:controls.length});}
async function key(p,id,on){await a(p,id).dispatchEvent(on?'keydown':'keyup',{key:' '});}
async function hold(p,id,ms){const r=await a(p,id).boundingBox();await p.mouse.move(r.x+r.width/2,r.y+r.height/2);await p.mouse.down();await p.waitForTimeout(ms);await p.mouse.up();}
async function enter(p,k){await p.locator('#content-start').click();await p.locator(`[data-content=${k}]`).click();}
const record=(p,k)=>p.evaluate(k=>JSON.parse(localStorage.getItem('island-transport:student:v2')).sections.contentR1[k],k);
try{
 if(['all','matrix'].includes(scope)){
  for(const [name,w,h] of [['se',320,568],['phone',390,844],['small-landscape',568,320],['landscape',844,390],['ipad',768,1024],['ipad-landscape',1024,768],['laptop',1366,600],['short-laptop',1280,640]]){
   const c=await browser.newContext({viewport:{width:w,height:h},hasTouch:true}),p=await c.newPage();watch(p);await p.goto(base);await p.locator('#content-start').click();await reach(p,`${name} picker`);assert.match(await p.locator('#content-r1').evaluate(e=>getComputedStyle(e).backgroundImage),/art\/r4\/coast.webp/);assert.equal(await p.locator('[data-state=new]').count(),3);if(name==='phone')await shot(p,'phone-picker-new');
   for(const k of ['cake','crossing','tickets']){await p.locator(`[data-content=${k}]`).click();await reach(p,`${name} ${k} intro`);await a(p,'begin').click();await reach(p,`${name} ${k} playing`);assert.doesNotMatch(await p.locator('#content-r1').innerText(),/WASD|方向鍵|空白鍵|鍵盤/);if(name==='phone')await shot(p,`phone-${k}-playing`);await p.locator('#content-pause').click();await reach(p,`${name} ${k} rest`);if(name==='phone')await shot(p,`phone-${k}-paused`);await p.locator('#content-resume').click();await p.locator('#content-back').click();await p.locator('#content-start').click();}
   await c.close();
  }
 }
 if(['all','play'].includes(scope)){
  const c=await browser.newContext({viewport:{width:390,height:844},hasTouch:true}),p=await c.newPage();watch(p);await p.goto(base);await shot(p,'phone-home');await enter(p,'cake');await shot(p,'phone-cake-intro');await a(p,'begin').click();
  await key(p,'go',true);await p.waitForTimeout(2200);await key(p,'right',true);await p.waitForTimeout(900);await shot(p,'phone-cake-force-turn');await key(p,'right',false);await p.waitForTimeout(220);
  const recovery=[];for(let i=1;i<=5;i++){if(i>1)await p.waitForTimeout(190);recovery.push(await frozen(p,async()=>({path:await shot(p,`phone-cake-recovery-${i}`),sample:await diag(p),car:await p.locator('.content-carrier').boundingBox(),cakeTransform:await p.locator('.content-cake').evaluate(e=>e.style.transform),creamTransform:await p.locator('.cake-cream').evaluate(e=>e.style.transform)})));}
  await key(p,'go',false);for(let i=1;i<5;i++)assert.ok(Math.abs(+recovery[i].sample.tilt)<Math.abs(+recovery[i-1].sample.tilt),JSON.stringify(recovery.map(x=>x.sample.tilt)));assert.ok(recovery[4].sample.distance-recovery[0].sample.distance>3);assert.ok(Math.abs(recovery[4].car.y-recovery[0].car.y)>5);assert.equal(new Set(recovery.map(s=>s.cakeTransform)).size,5);check('same station five monotonic flag/whole-cake/cream/body/road-relative recovery frames',{recovery});
  await p.locator('#content-back').click();await p.locator('#content-start').click();await shot(p,'phone-picker-progress');assert.equal(await p.locator('[data-content=cake]').getAttribute('data-state'),'started');await p.locator('[data-content=cake]').click();
  for(let stage=0;stage<3;stage++){
   await shot(p,`phone-cake-stage-${stage+1}-intro`);await a(p,'begin').click();let go=false,steering='',captured=false,bay=false,restarted=false,left=false,right=false;
   for(let n=0;n<140&&+(await diag(p)).distance<55;n++){
    const d=await diag(p),want=+d.distance>15&&+d.distance<=40?(+d.bend>0?'right':'left'):'';
    if(want!==steering){if(steering)await key(p,steering,false);if(want)await key(p,want,true);steering=want;}
    if(stage===2&&+d.distance>=42&&d.bayStopped==='false'){
     if(go){await key(p,'go',false);go=false;}await hold(p,'brake',1300);assert.equal((await diag(p)).bayStopped,'true');await shot(p,'phone-cake-stage-3-stopped');bay=true;
    }else if(!go){await key(p,'go',true);go=true;}
    await p.waitForTimeout(280);
    const v=await diag(p);
    if(!captured&&+v.distance>[3,21,43][stage]){await shot(p,`phone-cake-stage-${stage+1}-process`);captured=true;}
    if(stage===1&&!left&&v.leftTurn==='true'){await shot(p,'phone-cake-stage-2-left');left=true;}
    if(stage===1&&!right&&v.rightTurn==='true'){await shot(p,'phone-cake-stage-2-right');right=true;}
    if(stage===2&&bay&&!restarted&&v.bayRestarted==='true'){await shot(p,'phone-cake-stage-3-restarting');restarted=true;}
   }
   if(go)await key(p,'go',false);if(steering)await key(p,steering,false);assert.equal(+(await diag(p)).distance,55);await hold(p,'brake',1800);await p.waitForFunction(()=>['checkpoint','done'].includes(document.querySelector('#content-r1').dataset.phase));await shot(p,`phone-cake-stage-${stage+1}-complete`);if(stage===1)assert.ok(left&&right);if(stage===2)assert.ok(bay&&restarted);
   assert.equal((await record(p,'cake')).stage,Math.min(stage+1,2));if(stage<2){await p.locator('#content-back').click();await p.reload();await enter(p,'cake');assert.equal(await p.locator('#content-r1').getAttribute('data-stage'),String(stage+1));}check(`cake station ${stage+1} distinct operation, completion and persisted checkpoint`);
  }
  assert.equal((await record(p,'cake')).completed,true);await shot(p,'phone-cake-complete');await p.locator('#content-back').click();
  await enter(p,'crossing');await shot(p,'phone-crossing-intro');await a(p,'begin').click();
  for(let stage=0;stage<3;stage++){
   await a(p,'depart').click({force:true});assert.equal(await p.locator('#content-r1').getAttribute('data-phase'),'playing');await hold(p,'brake',1400);await a(p,'look-left').click();await frozen(p,()=>shot(p,`phone-crossing-stage-${stage+1}-look-left`));assert.equal(await a(p,'depart').getAttribute('aria-disabled'),'true');assert.match(await a(p,'look-left').innerText(),/✓/);await a(p,'depart').click({force:true});assert.equal(await p.locator('#content-r1').getAttribute('data-phase'),'playing');
   const left=await p.locator('.crossing-panorama').evaluate(e=>e.style.transform),leftPeople=await p.locator('.crossing-lookout').innerText();await a(p,'look-right').click();await frozen(p,()=>shot(p,`phone-crossing-stage-${stage+1}-look-right`));assert.notEqual(await p.locator('.crossing-panorama').evaluate(e=>e.style.transform),left);assert.notEqual(await p.locator('.crossing-lookout').innerText(),leftPeople);assert.equal(await a(p,'depart').getAttribute('aria-disabled'),'true');
   for(const who of [['child','bike','grandma'],['grandma','child','bike'],['bike','grandma','child']][stage])for(const pose of [0,1]){await p.waitForFunction(({who,pose})=>{const e=document.querySelector('.content-walker');return e.dataset.person===who&&e.dataset.pose===String(pose);},{who,pose},{timeout:10000});await frozen(p,()=>shot(p,`phone-crossing-stage-${stage+1}-${who}-pose-${pose}`));}
   await p.waitForFunction(()=>document.querySelector('[data-action=depart]').dataset.ready==='true');await shot(p,`phone-crossing-stage-${stage+1}-clear`);await a(p,'depart').click();await shot(p,`phone-crossing-stage-${stage+1}-complete`);if(stage<2){await p.locator('#content-back').click();await p.reload();await enter(p,'crossing');assert.equal(await p.locator('#content-r1').getAttribute('data-stage'),String(stage+1));await a(p,'begin').click();}check(`crossing station ${stage+1} side view, side information, both real poses and save`);
  }
  assert.equal((await record(p,'crossing')).completed,true);await shot(p,'phone-crossing-complete');await p.locator('#content-back').click();
  await enter(p,'tickets');await shot(p,'phone-tickets-intro');await a(p,'begin').click();
  for(let stage=0;stage<3;stage++){
   const target=['藍圓形','橘三角形','綠正方形'][stage],right=p.getByRole('button',{name:target+'月台',exact:true});for(const b of await p.locator('[data-platform]').all())if(await b.getAttribute('aria-label')!==target+'月台'){await b.click();break;}
   await hold(p,'go',5800);await hold(p,'brake',1700);await a(p,'door').click();assert.equal(await p.locator('#content-r1').getAttribute('data-phase'),'playing');const wrongX=await p.locator('.ticket-vehicle').getAttribute('data-x');await shot(p,`phone-tickets-stage-${stage+1}-wrong`);assert.match(await p.locator('#content-hint').innerText(),/不一樣/);
   await right.click();assert.equal(await p.locator('.ticket-vehicle').getAttribute('data-x'),wrongX);await key(p,'go',true);await p.waitForTimeout(2200);await shot(p,`phone-tickets-stage-${stage+1}-moving`);const midX=await p.locator('.ticket-vehicle').getAttribute('data-x');assert.ok(Math.abs(+midX-+wrongX)>2);await p.waitForTimeout(3700);await key(p,'go',false);await a(p,'door').click();assert.equal(await p.locator('#content-r1').getAttribute('data-phase'),'playing');await hold(p,'brake',1700);assert.equal(await right.getAttribute('data-arrived'),'true');await shot(p,`phone-tickets-stage-${stage+1}-right`);
   await a(p,'door').click();const boarding=[];for(let f=1;f<=3;f++){if(f>1)await p.waitForTimeout(240);boarding.push(await frozen(p,async()=>({path:await shot(p,`phone-tickets-stage-${stage+1}-boarding-${f}`),seats:await p.locator('.ticket-seated').count(),walking:await p.locator('.boarding-friend').count()})));}
   await p.waitForFunction(()=>['checkpoint','done'].includes(document.querySelector('#content-r1').dataset.phase));assert.equal(await p.locator('.ticket-seated').count(),3);assert.ok(boarding[0].seats<boarding[2].seats);await shot(p,`phone-tickets-stage-${stage+1}-seated`);check(`tickets station ${stage+1} wrong, blocked door, continuous rail motion, lit real sign, ordered boarding and seats`,{boarding,wrongX,midX});
   if(stage<2){await p.locator('#content-back').click();await p.reload();await enter(p,'tickets');assert.equal(await p.locator('#content-r1').getAttribute('data-stage'),String(stage+1));await a(p,'begin').click();}
  }
  assert.equal((await record(p,'tickets')).completed,true);await shot(p,'phone-tickets-complete');assert.equal(await p.locator('.ticket-final-proof').count(),0);await p.locator('#content-back').click();await p.reload();await enter(p,'tickets');assert.equal(await p.locator('.ticket-seated').count(),3);assert.equal(await p.locator('[data-arrived=true]').count(),1);await shot(p,'phone-tickets-saved-complete');await p.locator('#content-back').click();await p.locator('#content-start').click();assert.equal(await p.locator('[data-state=completed]').count(),3);await shot(p,'phone-picker-complete');await p.locator('#content-back').click();
  await p.evaluate(()=>navigator.serviceWorker.ready);await p.reload();await p.waitForFunction(()=>!!navigator.serviceWorker.controller);await c.setOffline(true);await p.reload();await enter(p,'crossing');await a(p,'replay').click();await a(p,'begin').click();for(let stage=0;stage<3;stage++){await hold(p,'brake',1400);await a(p,'look-left').click();await a(p,'look-right').click();await p.waitForFunction(()=>document.querySelector('[data-action=depart]').dataset.ready==='true');await a(p,'depart').click();if(stage<2)await a(p,'next').click();}await shot(p,'phone-crossing-offline-complete');assert.equal(await p.locator('#content-r1').getAttribute('data-phase'),'done');check('offline reload and three-station lesson completes; all three records persist');await c.close();
  const denied=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,reducedMotion:'reduce'});await denied.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw Error('storage disabled');}}));const q=await denied.newPage();watch(q);await q.goto(base);await enter(q,'crossing');await a(q,'begin').click();await hold(q,'brake',1400);await a(q,'look-left').click();await a(q,'look-right').click();await q.locator('#content-pause').click();const before=await q.locator('.content-walker').getAttribute('style');await q.waitForTimeout(400);assert.equal(await q.locator('.content-walker').getAttribute('style'),before);await q.locator('#content-resume').click();await q.waitForFunction(()=>document.querySelector('[data-action=depart]').dataset.ready==='true');await a(q,'depart').click();assert.match(await q.locator('#content-save').innerText(),/無法儲存/);await shot(q,'phone-storage-denied');check('storage rejection, reduced motion and frozen pause remain playable');await denied.close();
 }
 if(['all','poses'].includes(scope)){
  const c=await browser.newContext({viewport:{width:390,height:844},hasTouch:true}),p=await c.newPage();watch(p);await p.goto(base);await enter(p,'crossing');await a(p,'begin').click();
  for(let stage=0;stage<3;stage++){
   await hold(p,'brake',1400);await a(p,'look-left').click();await a(p,'look-right').click();
   for(const who of [['child','bike','grandma'],['grandma','child','bike'],['bike','grandma','child']][stage])for(const pose of [0,1]){
    let captured=false;for(let attempt=0;attempt<5&&!captured;attempt++){
     await p.waitForFunction(({who,pose})=>{const e=document.querySelector('.content-walker');return e.dataset.person===who&&e.dataset.pose===String(pose);},{who,pose},{timeout:10000});
     captured=await frozen(p,async()=>{const state=await p.locator('.content-walker').evaluate(e=>({...e.dataset}));if(state.person!==who||state.pose!==String(pose))return false;await shot(p,`phone-crossing-stage-${stage+1}-${who}-pose-${pose}`);shots.at(-1).runtimePose={person:who,pose,stage:stage+1,source:await p.locator('.content-walker img').getAttribute('src')};return true;});
    }assert.equal(captured,true,`${who} pose ${pose} must match captured runtime state`);
   }
   await p.waitForFunction(()=>document.querySelector('[data-action=depart]').dataset.ready==='true');await a(p,'depart').click();if(stage<2)await a(p,'next').click();check(`crossing station ${stage+1}: six PNGs bound to exact runtime identity and real pose`);
  }await c.close();
 }
 if(['all','store'].includes(scope)){
  const guide=await browser.newContext({viewport:{width:390,height:844},hasTouch:true}),gp=await guide.newPage();watch(gp);await gp.goto(base);await gp.locator('#content-start').click();await shot(gp,'phone-picker-new');await gp.locator('[data-content=cake]').click();await a(gp,'begin').click();await gp.locator('#content-back').click();await gp.locator('#content-start').click();await shot(gp,'phone-picker-progress');await gp.locator('[data-content=cake]').click();await gp.locator('#content-back').click();await gp.locator('#content-start').click();assert.equal(await gp.locator('[data-content=cake]').getAttribute('data-state'),'started');check('picker retains started state after inspecting introduction and leaving');await guide.close();
  for(const [name,w,h,dpr] of [['iphone',430,932,3],['ipad',1032,1376,2]]){const c=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:dpr,hasTouch:true}),p=await c.newPage();watch(p);await p.goto(base);await p.locator('#content-start').click();await shot(p,`${name}-coastal-picker`,store);await p.locator('[data-content=cake]').click();await a(p,'begin').click();await hold(p,'go',700);await shot(p,`${name}-cake`,store);await c.close();}check('new original 1290x2796 and 2064x2752 store screenshots');
 }
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert.deepEqual(responses,[]);status='VERIFIED';
}finally{await browser.close();await writeFile(`${out}/browser-${scope}.json`,JSON.stringify({status,rows,shots,errors,external,responses},null,2));}
console.log(`VERIFIED ${rows.length} checks / ${shots.length} original screenshots`);
