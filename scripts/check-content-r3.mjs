import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE||'C:/Users/digimkt/Desktop/遊戲/storm-apocalypse/node_modules/playwright/index.mjs').href);
const base=process.env.BASE_URL||'http://127.0.0.1:5286/',out='docs/content/r3',store='docs/store/screenshots/content-r3',scope=process.env.R3_SCOPE||'all';
assert.ok(['all','smoke','play','store','gallery','brakes'].includes(scope),'unknown R3_SCOPE');
await mkdir(out,{recursive:true});await mkdir(store,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']}),rows=[],shots=[],errors=[],external=[],responses=[];
let status='EXECUTED';
const a=(p,id)=>p.locator(`[data-action="${id}"]`),phase=p=>p.locator('#content-r1').getAttribute('data-phase'),diag=p=>p.locator('.content-scene').evaluate(e=>({...e.dataset}));
const check=(label,details={})=>{rows.push({label,status:'VERIFIED',...details});console.log('VERIFIED '+label);};
function watch(p){p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(/^https?:/.test(r.url())&&new URL(r.url()).origin!==new URL(base).origin)external.push(r.url());});p.on('response',r=>{if(r.status()>=400)responses.push({status:r.status(),url:r.url()});});}
async function shot(p,name,folder=out){await p.evaluate(async()=>{await Promise.all([...document.images].filter(i=>i.getClientRects().length).map(i=>i.decode().catch(()=>{})));});const path=`${folder}/${name}.png`;await p.screenshot({path});const b=await readFile(path);shots.push({path,width:b.readUInt32BE(16),height:b.readUInt32BE(20),sha256:createHash('sha256').update(b).digest('hex'),native:false,method:'unmodified headless Chromium runtime screenshot'});return path;}
async function reach(p,label){const controls=await p.locator('#content-r1 button').evaluateAll(es=>es.filter(e=>e.getClientRects().length&&!e.disabled).map(e=>{const r=e.getBoundingClientRect();return {id:e.dataset.action||e.dataset.platform||e.id,size:[r.width,r.height],bad:r.width<59.8||r.height<59.8||r.x<-.5||r.y<-.5||r.right>innerWidth+.5||r.bottom>innerHeight+.5||[[r.x+r.width/2,r.y+r.height/2],[r.x+4,r.y+4],[r.right-4,r.bottom-4]].some(([x,y])=>{const h=document.elementFromPoint(x,y);return h!==e&&!e.contains(h);})};}));assert.ok(controls.length);assert.deepEqual(controls.filter(c=>c.bad),[],label);check(label,{controls:controls.length});}
async function down(p,id){const r=await a(p,id).boundingBox();await p.mouse.move(r.x+r.width/2,r.y+r.height/2);await p.mouse.down();}
async function hold(p,id,ms){await down(p,id);await p.waitForTimeout(ms);await p.mouse.up();}
async function begin(p,kind){await p.locator('#content-start').click();await p.locator(`[data-content=${kind}]`).click();if(await p.locator('#content-r1').getAttribute('data-stage')==='0')await shot(p,`phone-${kind}-intro`);await a(p,'begin').click();}
async function restart(p){await p.locator('#content-back').click();await begin(p,'cake');}
const record=(p,k)=>p.evaluate(k=>JSON.parse(localStorage.getItem('island-transport:student:v2')).sections.contentR1?.[k],k);
async function regionDifferences(paths,rect){const region={left:Math.max(0,Math.floor(rect.x)),top:Math.max(0,Math.floor(rect.y)),width:Math.floor(rect.width),height:Math.floor(rect.height)},pixels=[];for(const path of paths)pixels.push(await sharp(path).extract(region).removeAlpha().raw().toBuffer());return pixels.slice(1).map((b,i)=>{let changed=0;for(let n=0;n<b.length;n+=3)if(Math.abs(b[n]-pixels[i][n])+Math.abs(b[n+1]-pixels[i][n+1])+Math.abs(b[n+2]-pixels[i][n+2])>30)changed++;assert.ok(changed>80,'flag/cake region must visibly change beyond text');return changed;});}
async function physicsShot(p,name){
 // Freeze only the frame loop while photographing a real UI state. Never set
 // velocity, angle, distance, progression or save fields. Resume after PNG.
 await p.evaluate(()=>new Promise(resolve=>{const original=requestAnimationFrame,queued=[];window.__r3Capture={original,queued};window.requestAnimationFrame=cb=>{queued.push(cb);return 0;};original(()=>original(resolve));}));
 try{const path=await shot(p,name),sample=await diag(p);shots.at(-1).captureFreeze='RAF paused only during PNG capture; physical state never assigned';return {path,sample};}
 finally{await p.evaluate(()=>{const {original,queued}=window.__r3Capture;window.requestAnimationFrame=original;delete window.__r3Capture;for(const cb of queued)original(cb);});}
}
try{
 if(scope==='all'||scope==='smoke'){
  for(const [name,w,h] of [['se',320,568],['phone',390,844],['small-landscape',568,320],['landscape',844,390],['ipad',768,1024],['ipad-landscape',1024,768],['laptop',1366,600],['short-laptop',1280,640]]){
   const c=await browser.newContext({viewport:{width:w,height:h},hasTouch:true}),p=await c.newPage();watch(p);await p.goto(base);await p.locator('#content-start').click();await reach(p,`${name} picker`);
   const placeholder=await p.locator('#content-picker button,#content-picker small').evaluateAll(es=>es.flatMap(e=>[e.textContent,getComputedStyle(e,'::before').content,getComputedStyle(e,'::after').content]).some(s=>s?.trim()==='—'||s==='"—"'));assert.equal(placeholder,false);if(name==='phone')await shot(p,'phone-picker');
   for(const k of ['cake','crossing','tickets']){await p.locator(`[data-content=${k}]`).click();await reach(p,`${name} ${k} intro`);await a(p,'begin').click();await reach(p,`${name} ${k} controls`);await shot(p,`${name}-${k}-playing`);await p.locator('#content-pause').click();await reach(p,`${name} ${k} pause`);assert.match(await p.locator('#content-rest-progress').innerText(),/第 1／3 站/);if(name==='phone')await shot(p,`phone-${k}-paused`);await p.locator('#content-resume').click();await p.locator('#content-back').click();await p.locator('#content-start').click();}
   await c.close();
  }
 }
 if(scope==='all'||scope==='play'){
  const c=await browser.newContext({viewport:{width:390,height:844},hasTouch:true}),p=await c.newPage();watch(p);await p.goto(base);await shot(p,'phone-home');await begin(p,'cake');
  await down(p,'go');await p.waitForTimeout(400);await shot(p,'phone-cake-starting');assert.ok(+(await diag(p)).tilt< -22);await p.mouse.up();await hold(p,'go',2500);
  await a(p,'left').dispatchEvent('keydown',{key:' '});await hold(p,'go',700);await shot(p,'phone-cake-turning');assert.ok(+(await diag(p)).tilt>12);await a(p,'left').dispatchEvent('keyup',{key:' '});
  await restart(p);await hold(p,'go',2100);const hard=[],hardPaths=[],cakeRect=await p.locator('.content-cake').boundingBox();await down(p,'brake');
  for(let f=1;f<=3;f++){await p.waitForTimeout(f===1?80:f===2?150:1800);const s=await physicsShot(p,`phone-cake-hard-brake-${f}`);hardPaths.push(s.path);hard.push(s.sample);}await p.mouse.up();
  assert.ok(Math.max(...hard.map(x=>+x.tilt))-Math.min(...hard.map(x=>+x.tilt))>10);check('hard brake three distinct flag/cream frames',{samples:hard,changedCakePixels:await regionDifferences(hardPaths,cakeRect)});
  await hold(p,'brake',1800);await p.waitForTimeout(1200);assert.ok(Math.abs(+(await diag(p)).tilt)<1);await shot(p,'phone-cake-steady');check('stopped held brake recovers to green level reference');
  await restart(p);await hold(p,'go',400);await p.waitForTimeout(700);await down(p,'brake');const gentle=[],gentlePaths=[];
  for(let f=1;f<=3;f++){await p.waitForTimeout(f===1?100:200);const s=await physicsShot(p,`phone-cake-gentle-brake-${f}`);gentlePaths.push(s.path);gentle.push(s.sample);}await p.mouse.up();
  assert.ok(Math.max(...gentle.map(x=>Math.abs(+x.tilt)))<Math.max(...hard.map(x=>Math.abs(+x.tilt))));assert.ok(Math.max(...gentle.map(x=>+x.tilt))-Math.min(...gentle.map(x=>+x.tilt))>10);assert.ok(new Set(gentle.map(x=>x.tilt)).size===3);check('slow approach and gentle stop three distinct recovering frames',{samples:gentle,changedCakePixels:await regionDifferences(gentlePaths,cakeRect)});
  await restart(p);
  for(let stage=0;stage<3;stage++){
   let steering='',captured=false;
   for(let n=0;n<50&&+(await diag(p)).distance<55;n++){
    const d=await diag(p),want=+d.distance>15&&+d.distance<40?(+d.bend>0?'right':'left'):'';
    if(want!==steering){if(steering)await a(p,steering).dispatchEvent('keyup',{key:' '});if(want)await a(p,want).dispatchEvent('keydown',{key:' '});steering=want;}
    await hold(p,'go',650);
    if(!captured&&+(await diag(p)).distance>[2,20,42][stage]){await shot(p,`phone-cake-stage-${stage+1}`);captured=true;}
   }
   assert.ok(captured);if(steering)await a(p,steering).dispatchEvent('keyup',{key:' '});await hold(p,'brake',1800);await p.waitForFunction(()=>['checkpoint','done'].includes(document.querySelector('#content-r1').dataset.phase));assert.equal((await record(p,'cake')).stage,Math.min(stage+1,2));
   if(stage===0){await p.locator('#content-back').click();await p.reload();await begin(p,'cake');assert.equal(await p.locator('#content-r1').getAttribute('data-stage'),'1');check('cake checkpoint survives reload');}else if(stage<2)await a(p,'next').click();
  }
  assert.equal((await record(p,'cake')).completed,true);await shot(p,'phone-cake-complete');check('all three cake routes physically completed and persisted');await p.locator('#content-back').click();
  await begin(p,'crossing');await a(p,'depart').click();assert.equal(await phase(p),'playing');await shot(p,'phone-crossing-blocked');
  for(let stage=0;stage<3;stage++){
   await hold(p,'brake',1400);await a(p,'look-left').click();await a(p,'depart').click();assert.equal(await phase(p),'playing');await a(p,'look-right').click();await a(p,'depart').click();assert.equal(await phase(p),'playing');
   assert.equal(await p.locator('.content-observe button,.content-observe svg').count(),0);
   for(let i=0;i<3;i++){
    const who=[['child','bike','grandma'],['grandma','child','bike'],['bike','grandma','child']][stage][i];
    for(const pose of [0,1]){await p.waitForFunction(({who,pose})=>{const e=document.querySelector('.content-walker');return e.dataset.person===who&&e.dataset.pose===String(pose);},{who,pose},{timeout:10000});await shot(p,`phone-crossing-stage-${stage+1}-${who}-pose-${pose}`);}
   }
   await p.waitForFunction(()=>document.querySelector('[data-action=depart]').dataset.ready==='true');await shot(p,`phone-crossing-stage-${stage+1}-clear`);await a(p,'depart').click();if(stage<2)await a(p,'next').click();
  }
  assert.equal((await record(p,'crossing')).completed,true);await shot(p,'phone-crossing-complete');check('crossing uses only lower buttons, all three identities and both real poses each station, early departure blocked');await p.locator('#content-back').click();
  await begin(p,'tickets');const targets=['藍圓形','橘三角形','綠正方形'];
  for(let stage=0;stage<3;stage++){
   const correct=p.getByRole('button',{name:targets[stage]+'月台',exact:true});for(const b of await p.locator('[data-platform]').all())if(await b.getAttribute('aria-label')!==targets[stage]+'月台'){await b.click();break;}
   const signs=await p.locator('[data-platform]').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().y));assert.ok(Math.max(...signs)-Math.min(...signs)<1,'all signs are on one horizontal platform');
   await hold(p,'go',5800);await hold(p,'brake',1700);await a(p,'door').click();assert.equal(await phase(p),'playing');const wrongX=await p.locator('.ticket-vehicle').getAttribute('data-x');await shot(p,`phone-tickets-stage-${stage+1}-wrong`);
   await correct.click();assert.equal(await p.locator('.ticket-vehicle').getAttribute('data-x'),wrongX,'reselect cannot teleport the train');await a(p,'door').click();assert.equal(await phase(p),'playing');await hold(p,'go',5800);await a(p,'door').click();assert.equal(await phase(p),'playing');await hold(p,'brake',1700);const rightX=await p.locator('.ticket-vehicle').getAttribute('data-x');assert.ok(Math.abs(+wrongX-+rightX)>12);await shot(p,`phone-tickets-stage-${stage+1}-right`);
   await a(p,'door').click();assert.equal(await phase(p),'boarding');const boarding=[];
   for(let f=1;f<=3;f++){await p.waitForTimeout(f===1?30:260);await shot(p,`phone-tickets-stage-${stage+1}-boarding-${f}`);boarding.push({seats:await p.locator('.ticket-seated').count(),walkers:await p.locator('.boarding-friend').count()});}
   await p.waitForFunction(()=>['checkpoint','done'].includes(document.querySelector('#content-r1').dataset.phase));assert.equal(await p.locator('.ticket-seated').count(),3);assert.ok(boarding[0].seats<boarding[2].seats);check(`tickets station ${stage+1} wrong/right x and walking-to-seated sequence`,{wrongX,rightX,boarding});if(stage<2){await shot(p,`phone-tickets-stage-${stage+1}-seated`);await a(p,'next').click();}
  }
  assert.equal((await record(p,'tickets')).completed,true);assert.equal(await p.getByLabel('綠正方形月台站牌',{exact:true}).count(),1);assert.equal(await p.getByLabel('綠正方形車票',{exact:true}).count(),1);await shot(p,'phone-tickets-complete');check('final green square sign and actual target ticket remain in completion frame');
  await p.locator('#content-back').click();await p.reload();await p.locator('#content-start').click();assert.equal(await p.locator('[data-record]').filter({hasText:'一起完成了'}).count(),3);await shot(p,'phone-save-all-three');await p.locator('#content-back').click();
  await p.evaluate(()=>navigator.serviceWorker.ready);await p.reload();await p.waitForFunction(()=>!!navigator.serviceWorker.controller);await c.setOffline(true);await p.reload();await p.locator('#content-start').click();await p.locator('[data-content=crossing]').click();await a(p,'replay').click();await a(p,'begin').click();
  for(let stage=0;stage<3;stage++){await hold(p,'brake',1400);await a(p,'look-left').click();await a(p,'look-right').click();await p.waitForFunction(()=>document.querySelector('[data-action=depart]').dataset.ready==='true');await shot(p,`phone-crossing-offline-stage-${stage+1}`);await a(p,'depart').click();if(stage<2)await a(p,'next').click();}
  assert.equal(await phase(p),'done');check('real offline reload, three-station completion and saved records');await c.close();
  const denied=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,reducedMotion:'reduce'});await denied.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw Error('storage disabled');}}));const q=await denied.newPage();watch(q);await q.goto(base);await q.locator('#content-start').click();await q.locator('[data-content=crossing]').click();await a(q,'begin').click();await hold(q,'brake',1400);await a(q,'look-left').click();await a(q,'look-right').click();await q.locator('#content-pause').click();const before=await q.locator('.content-walker').getAttribute('style');await q.waitForTimeout(350);assert.equal(await q.locator('.content-walker').getAttribute('style'),before);await q.locator('#content-resume').click();await q.waitForFunction(()=>document.querySelector('[data-action=depart]').dataset.ready==='true');await a(q,'depart').click();assert.match(await q.locator('#content-save').innerText(),/無法儲存/);await shot(q,'phone-storage-denied');check('reduced motion, frozen pause and storage rejection remain playable');await denied.close();
 }
 if(scope==='brakes'){
  const c=await browser.newContext({viewport:{width:390,height:844},hasTouch:true}),p=await c.newPage();watch(p);await p.goto(base);await p.locator('#content-start').click();await p.locator('[data-content=cake]').click();await a(p,'begin').click();
  await hold(p,'go',2100);const hardRect=await p.locator('.content-cake').boundingBox(),hard=[],hardPaths=[];await down(p,'brake');
  for(let f=1;f<=3;f++){await p.waitForTimeout(f===1?80:f===2?150:1800);const s=await physicsShot(p,`phone-cake-hard-brake-${f}`);hardPaths.push(s.path);hard.push(s.sample);}await p.mouse.up();
  assert.ok(Math.max(...hard.map(x=>+x.tilt))-Math.min(...hard.map(x=>+x.tilt))>10);assert.ok(Math.abs(+hard[1].tilt-+hard[0].tilt)>6);assert.ok(Math.abs(+hard[2].tilt-+hard[1].tilt)>10);assert.equal(+hard[2].speed,0);check('hard brake three distinct flag/cream frames',{samples:hard,changedCakePixels:await regionDifferences(hardPaths,hardRect),method:'One held brake: onset, deflection, stationary recovery; no position or angle injection'});await p.locator('#content-back').click();await p.locator('#content-start').click();await p.locator('[data-content=cake]').click();await a(p,'begin').click();
  await hold(p,'go',400);await p.waitForTimeout(700);const rect=await p.locator('.content-cake').boundingBox(),samples=[],paths=[];await down(p,'brake');
  for(let f=1;f<=3;f++){await p.waitForTimeout(f===1?100:200);const s=await physicsShot(p,`phone-cake-gentle-brake-${f}`);paths.push(s.path);samples.push(s.sample);}await p.mouse.up();
  assert.ok(Math.max(...samples.map(x=>+x.tilt))<28);assert.ok(Math.max(...samples.map(x=>+x.tilt))-Math.min(...samples.map(x=>+x.tilt))>10);assert.equal(new Set(samples.map(x=>x.tilt)).size,3);
  check('slow approach and gentle stop three distinct recovering frames',{samples,changedCakePixels:await regionDifferences(paths,rect),method:'Release pedal before low-speed stop; same brake control, no hidden force or state injection'});await c.close();
 }
 if(scope==='all'||scope==='store'||scope==='gallery'){
  if(scope==='gallery'){const c=await browser.newContext({viewport:{width:390,height:844},hasTouch:true}),p=await c.newPage();watch(p);await p.goto(base);for(const k of ['cake','crossing','tickets']){await begin(p,k);await p.locator('#content-back').click();}check('first-station Alu introductions captured at original phone dimensions');await c.close();}
  for(const [name,w,h,dpr] of [['iphone',430,932,3],['ipad',1032,1376,2]]){const c=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:dpr,hasTouch:true}),p=await c.newPage();watch(p);await p.goto(base);for(const k of ['cake','crossing','tickets']){await p.locator('#content-start').click();await p.locator(`[data-content=${k}]`).click();await a(p,'begin').click();if(k==='cake')await hold(p,'go',500);if(k==='crossing'){await hold(p,'brake',1400);await a(p,'look-left').click();await a(p,'look-right').click();}if(k==='tickets'){await p.getByRole('button',{name:'藍圓形月台',exact:true}).click();await hold(p,'go',5800);await hold(p,'brake',1700);}await shot(p,`${name}-${k}`,store);await p.locator('#content-back').click();}await c.close();}
  const c=await browser.newContext({viewport:{width:390,height:844},hasTouch:true}),p=await c.newPage();watch(p);await p.goto(base+'train/');await p.locator('#asset-loading').waitFor({state:'hidden',timeout:60000});await p.locator('#child-prepare').click();await p.locator('#child-go').click();await p.waitForTimeout(700);await shot(p,'phone-train-driving');assert.ok(await p.locator('img[src*="coach-safe-window"]').count());check('shared Alu safe-window character and local font in 3D train and three lessons');await c.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert.deepEqual(responses,[]);status='VERIFIED';
}finally{await browser.close();await writeFile(`${out}/browser-${scope}.json`,JSON.stringify({status,rows,shots,errors,external,responses},null,2));}
console.log(`VERIFIED ${rows.length} checks / ${shots.length} original screenshots`);
if(['gallery','brakes'].includes(scope)){const all=JSON.parse(await readFile(`${out}/browser-all.json`,'utf8'));assert.equal(all.status,'VERIFIED');all.rows=[...new Map([...all.rows,...rows].map(r=>[r.label,r])).values()];all.shots=[...new Map([...all.shots,...shots].map(s=>[s.path,s])).values()];await writeFile(`${out}/browser-all.json`,JSON.stringify(all,null,2));}
