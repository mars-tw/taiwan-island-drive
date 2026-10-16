// Local review rehearsal; all interactions use real UI and real elapsed time.
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:5113/';
const out=process.env.EVIDENCE_FOLDER||'docs/evidence/merge',screens='docs/store/screenshots';
await mkdir(`${out}/after`,{recursive:true});await mkdir(screens,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']});
const rows=[],errors=[],external=[],shots=[];
function watch(page){page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url())&&new URL(r.url()).origin!==new URL(base).origin)external.push(r.url());});}
async function reachable(page,label,selector,min=60){
 const result=await page.locator(selector).evaluateAll((els,min)=>els.filter(el=>!el.hidden&&el.getClientRects().length&&!el.disabled).map(el=>{
  const r=el.getBoundingClientRect(),problems=[];
  if(r.width<min-.2||r.height<min-.2)problems.push(`size ${r.width}x${r.height}`);
  if(r.left<-.5||r.top<-.5||r.right>innerWidth+.5||r.bottom>innerHeight+.5)problems.push('outside viewport');
  for(const [x,y] of [[r.x+r.width/2,r.y+r.height/2],[r.left+4,r.top+4],[r.right-4,r.bottom-4]]){const h=document.elementFromPoint(x,y);if(h!==el&&!el.contains(h))problems.push('covered');}
  return {id:el.id||el.className,problems};
 }),min);
 assert.ok(result.length,`${label}: missing controls`);rows.push({label,controls:result.length,problems:result.filter(x=>x.problems.length)});
 assert.deepEqual(rows.at(-1).problems,[],label);
}
async function capture(page,name,store=false){const path=`${store?screens:out+'/after'}/${name}.png`;await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await page.screenshot({path});const b=await readFile(path);shots.push({path,width:b.readUInt32BE(16),height:b.readUInt32BE(20),sha256:createHash('sha256').update(b).digest('hex'),kind:'unmodified_headless_chromium_runtime_capture',native:false});}
async function holdBrake(page){const r=await page.locator('#safety-brake').boundingBox();await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down();await page.waitForFunction(()=>document.querySelector('#safety-detail').textContent.includes('速度 0'));await page.mouse.up();}
async function gate(page){await page.locator('#home-settings').click();await page.locator('#parent-gate-answer').fill('0');await page.locator('#parent-gate-submit').click();assert.equal(await page.locator('#family-dialog').isVisible(),false);await page.locator('#parent-gate-cancel').click();assert.equal(await page.locator('#family-dialog').isVisible(),false);
 await page.locator('#home-settings').click();const n=(await page.locator('#parent-gate-question').innerText()).match(/\d+/g).map(Number);await page.locator('#parent-gate-answer').fill(String(n[0]+n[1]));await page.locator('#parent-gate-submit').click();assert.equal(await page.locator('#family-dialog').isVisible(),true);await page.locator('.done-button').click();}
try{
 const sizes=[['se',320,568,1],['se-landscape',568,320,1],['phone',390,844,1],['phone-landscape',844,390,1],['large',440,956,1],['laptop',1366,600,1],['short-laptop',1280,640,1],['ipad',768,1024,1],['ipad-landscape',1024,768,1],['ipad13-landscape',1376,1032,1],['iphone-store',430,932,3],['ipad13-store',1032,1376,2]];
 for(const [name,width,height,scale] of sizes.filter(size=>!process.env.REVIEW_SIZE||size[0]===process.env.REVIEW_SIZE)){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:scale,hasTouch:true});const page=await context.newPage();watch(page);
  const started=Date.now(),store=name.endsWith('store');await page.goto(base);await page.locator('#safety-start').waitFor();
  await reachable(page,`${name} home`,'#safety-start,.card-action,[data-open-passport]');
  await capture(page,`${name}-01-home`,store);
  if(store)await gate(page);
  await page.locator('#safety-start').click();await reachable(page,`${name} intro`,'.safety-controls button:not([hidden])');
  await page.locator('#safety-begin').click();await page.locator('#safety-depart').click();assert.match(await page.locator('#safety-hint').innerText(),/先停穩/);
  await reachable(page,`${name} road`,'#safety-brake,#safety-depart');
  // A cancelled touch must release the brake, and a background event must pause.
  if(store){const b=await page.locator('#safety-brake').boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.locator('#safety-brake').dispatchEvent('pointercancel',{pointerId:1});await page.mouse.up();assert.equal(await page.locator('#safety-brake').getAttribute('aria-pressed'),'false');
   await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.locator('#safety-resume').waitFor();await reachable(page,`${name} pause`,'#safety-resume,#safety-leave');const text=await page.locator('#safety-detail').textContent();await page.waitForTimeout(200);assert.equal(await page.locator('#safety-detail').textContent(),text);await page.locator('#safety-resume').click();}
  await holdBrake(page);if(store)await capture(page,`${name}-02-road-wait`,true);
  await page.waitForFunction(()=>document.querySelector('#safety-signal').textContent.includes('綠燈'));
  await page.locator('#safety-depart').click();await reachable(page,`${name} checkpoint`,'#safety-next');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('island-transport:safety:v1')).completed),1);
  // Close and reload: no direct save manipulation, resume the second station.
  await page.locator('#safety-back').click();await page.reload();await page.locator('#safety-start').click();assert.match(await page.locator('#safety-step').innerText(),/第 2 站/);
  await page.locator('#safety-begin').click();await page.locator('#safety-door').click();assert.match(await page.locator('#safety-hint').innerText(),/還在移動/);
  await reachable(page,`${name} train`,'#safety-brake,#safety-door,#safety-depart');await holdBrake(page);await page.locator('#safety-door').click();
  if(store)await capture(page,`${name}-03-train-boarding`,true);
  await page.locator('#safety-door').click();assert.match(await page.locator('#safety-hint').innerText(),/朋友還在上車/);
  await page.waitForFunction(()=>document.querySelector('#safety-signal').textContent==='朋友上車了');await page.locator('#safety-door').click();await page.locator('#safety-depart').click();await page.locator('#safety-next').click();await page.locator('#safety-begin').click();
  await reachable(page,`${name} runway`,'#safety-wait,#safety-depart');await page.locator('#safety-wait').click();await page.waitForFunction(()=>document.querySelector('#safety-signal').textContent==='跑道空了');
  if(store)await capture(page,`${name}-04-runway-clear`,true);
  await page.locator('#safety-depart').click();await reachable(page,`${name} stamp`,'#safety-replay,#safety-finish');if(store)await capture(page,`${name}-05-stamp`,true);
  await page.locator('#safety-finish').click();await page.reload();assert.match(await page.locator('#safety-start').innerText(),/安全觀察章/);
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('island-transport:safety:v1')));assert.deepEqual(saved,{completed:3});
  rows.push({label:`${name} full review path`,durationMs:Date.now()-started,save:saved,problems:[]});
  if(store){
   console.log(`${name}: checking installed offline cache`);
   await page.evaluate(async()=>{await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(new Error('Offline cache not ready after 15s')),15000))]);});await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller);await context.setOffline(true);await page.reload();await page.locator('#safety-start').click();await page.locator('#safety-replay').click();await page.locator('#safety-begin').click();await page.locator('#safety-pause').click();await page.locator('#safety-resume').click();await reachable(page,`${name} offline replay`,'#safety-brake,#safety-depart');await page.locator('#safety-back').click();
   for(const mode of ['car','train','flight']){await page.goto(base+mode+'/');await page.waitForSelector({car:'#start-button:not([disabled])',train:'#child-prepare',flight:'#start:not([disabled])'}[mode],{timeout:60000});
    if(mode==='car'){await page.locator('#start-button').click();await page.waitForFunction(()=>window.__islandDrive.game.phase==='running');}
    if(mode==='train'){await page.locator('#child-prepare').click();await page.locator('#child-go').click();}
    if(mode==='flight')await page.locator('#start').click();await page.waitForTimeout(500);await capture(page,`${name}-06-${mode}-offline`,true);
   }
  }
  await context.close();console.log(`PASS ${name}: full cold-start / observation / first goal / resume / persistence path`);
 }
 const context=await browser.newContext();await context.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked by test');}}));const page=await context.newPage();watch(page);await page.goto(base);await page.locator('#safety-start').click();await page.locator('#safety-begin').click();await holdBrake(page);await page.waitForFunction(()=>document.querySelector('#safety-signal').textContent.includes('綠燈'));await page.locator('#safety-depart').click();assert.match(await page.locator('#safety-save').innerText(),/無法儲存/);rows.push({label:'storage failure stays playable and warns',problems:[]});await context.close();
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
}finally{await browser.close();await writeFile(`${out}/review-path.json`,JSON.stringify({rows,errors,externalRequests:external},null,2));await writeFile(`${screens}/manifest.json`,JSON.stringify({sourceVersion:JSON.parse(await readFile('package.json','utf8')).version,status:'EXECUTED',native:false,buildWorkerSha256:createHash('sha256').update(await readFile('dist/sw.js')).digest('hex'),method:'headless Chromium; UI actions and wall-clock waits; no modified progress or completion flags; offline 3D captures after SW install',shots},null,2));}
const manifest=JSON.parse(await readFile(`${screens}/manifest.json`,'utf8'));manifest.status='VERIFIED';await writeFile(`${screens}/manifest.json`,JSON.stringify(manifest,null,2));
console.log(`PASS ${rows.length} checks; ${shots.length} unmodified screenshots; zero runtime errors and external requests`);
