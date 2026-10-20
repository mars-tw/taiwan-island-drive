// Headless integration: only public UI for math and time-stepped real physics for transport.
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:5286/';
const folder=process.env.EVIDENCE_FOLDER||'docs/evidence/merge',screens=process.env.SCREENSHOT_FOLDER||'docs/store/screenshots/merge';
await mkdir(`${folder}/after`,{recursive:true});await mkdir(screens,{recursive:true});
const rows=[],shots=[],errors=[],external=[];
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']});
const key='island-transport:student:v2';
async function check(page,label,selectors){
 const result=await page.locator(selectors).evaluateAll(els=>els.filter(e=>!e.hidden&&e.getClientRects().length&&!e.disabled).map(e=>{
  const r=e.getBoundingClientRect(),problems=[];
  if(r.width<59.8||r.height<59.8)problems.push(`size ${r.width}x${r.height}`);
  if(r.left<-.5||r.top<-.5||r.right>innerWidth+.5||r.bottom>innerHeight+.5)problems.push('outside viewport');
  for(const [x,y] of [[r.x+r.width/2,r.y+r.height/2],[r.left+3,r.top+3],[r.right-3,r.bottom-3]]){const hit=document.elementFromPoint(x,y);if(hit!==e&&!e.contains(hit))problems.push(`covered by ${hit?.id||hit?.tagName}`);}
  return {id:e.id||e.dataset.dispatch,problems};
 }));assert.ok(result.length,`${label} controls missing`);rows.push({label,controls:result.length,problems:result.filter(r=>r.problems.length)});assert.deepEqual(rows.at(-1).problems,[],label);
}
async function capture(page,name,store=false){const path=`${store?screens:folder+'/after'}/${name}.png`;await page.waitForFunction(()=>!document.querySelector('.academy-sticker'));await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await page.screenshot({path});const b=await readFile(path);shots.push({path,width:b.readUInt32BE(16),height:b.readUInt32BE(20),sha256:createHash('sha256').update(b).digest('hex'),native:false,kind:'unmodified_headless_runtime_capture'});}
const save=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
async function gate(page){await page.locator('#home-settings').click();assert.equal(await page.locator('#family-dialog').isVisible(),false);await page.locator('#parent-gate-answer').fill('0');await page.locator('#parent-gate-submit').click();assert.equal(await page.locator('#family-dialog').isVisible(),false);await page.locator('#parent-gate-cancel').click();await page.locator('#home-settings').click();const [a,b]=(await page.locator('#parent-gate-question').innerText()).match(/\d+/g).map(Number);await page.locator('#parent-gate-answer').fill(String(a+b));await page.locator('#parent-gate-submit').click();await page.locator('#family-dialog').waitFor();}
async function simulateTransport(page,mode){
 await page.waitForFunction(mode=>mode==='train'?!!window.__trainSchool:mode==='car'?window.__islandDrive?.game.phase==='running':window.__flightSchool?.game.mode==='playing',mode,{timeout:60000});
 if(mode==='train'){
  await page.locator('#child-prepare').click();await page.locator('#child-go').click();await page.locator('#child-help-stop').click();
  await page.evaluate(()=>{const g=window.__trainSchool.game;for(let i=0;i<60*250&&!g.completed;i++){const s=g.getState();if(Math.abs(s.distance)<12&&Math.abs(s.speed)<.5&&!s.controls.doors)document.querySelector('#child-doors').click();if(g.serviced)document.querySelector('#child-doors').click();g.update(1/60);}});
 }else if(mode==='car'){
  await page.locator('#auto-throttle').click();await page.evaluate(()=>{const g=window.__islandDrive.game,raf=requestAnimationFrame;window.requestAnimationFrame=()=>0;try{let n=performance.now();g.lastTime=0;for(let i=0;i<60*120&&g.phase!=='finished';i++)g.frame(n+=1000/60);g.lastTime=0;}finally{window.requestAnimationFrame=raf;}});
 }else await page.evaluate(()=>{const g=window.__flightSchool.game,raf=requestAnimationFrame;window.requestAnimationFrame=()=>0;try{let n=performance.now();g.last=n;for(let i=0;i<60*180&&g.mode==='playing';i++)g.frame(n+=1000/60);g.last=performance.now();}finally{window.requestAnimationFrame=raf;}});
 await page.locator('#journey-next').waitFor({timeout:15000});
}
try{
 const sizes=[['se',320,568,1],['se-landscape',568,320,1],['phone',390,844,1],['phone-landscape',844,390,1],['laptop',1366,600,1],['short-laptop',1280,640,1],['ipad',768,1024,1],['ipad-landscape',1024,768,1],['ipad13-landscape',1376,1032,1],['iphone-store',430,932,3],['ipad13-store',1032,1376,2]];
 for(const [name,width,height,dpr] of sizes.filter(s=>!process.env.MERGE_SIZE||s[0]===process.env.MERGE_SIZE)){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,hasTouch:true});let page=await context.newPage();
  const watch=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(/^https?:/.test(r.url())&&new URL(r.url()).origin!==new URL(base).origin)external.push(r.url());});};watch(page);
  const started=Date.now(),store=name.endsWith('store');await page.goto(base);await page.locator('#academy-start').waitFor();
  await check(page,`${name} home`,'#academy-start,#safety-start,#math-practice,.card-action,[data-open-passport]');await capture(page,`${name}-01-mainline`,store);
  await page.locator('#academy-start').click();const firstMathMs=Date.now()-started;assert.ok(firstMathMs<180000);await check(page,`${name} math-intro`,'#math-back,#math-pause,[data-dispatch]');await page.locator('[data-dispatch=learn]').click();
  await page.locator('[data-dispatch=add]').click();assert.equal((await save(page)).sections.academy.dispatch.active.front,1);
  await page.locator('#math-pause').click();await check(page,`${name} pause`,'#math-resume,#math-leave');await page.locator('#math-resume').click();
  await page.locator('#math-back').click();await page.close();page=await context.newPage();watch(page);await page.goto(base);await page.locator('#academy-start').click();assert.equal(await page.locator('.dispatch-carriage.front strong').innerText(),'1 人');
  for(let i=0;i<4;i++)await page.locator('[data-dispatch=add]').click();await check(page,`${name} loaded`,'#math-back,#math-pause,[data-dispatch]');
  if(store)await capture(page,`${name}-02-load`,true);
  await page.locator('[data-dispatch=check]').click();await page.locator('[data-dispatch=to-rear]').click();await page.locator('[data-dispatch=to-front]').click();await page.locator('[data-dispatch=to-rear]').click();
  await check(page,`${name} split`,'#math-back,#math-pause,[data-dispatch]');if(store)await capture(page,`${name}-03-split`,true);
  await page.locator('[data-dispatch=check]').click();await page.locator('[data-dispatch="answer:3"]').click();assert.equal(await page.locator('#math-lesson').getAttribute('data-phase'),'subtract');
  await check(page,`${name} subtract`,'#math-back,#math-pause,[data-dispatch]');if(store)await capture(page,`${name}-04-subtract`,true);
  await page.locator('[data-dispatch="answer:4"]').click();await check(page,`${name} math-result`,'#math-back,#math-pause,#math-next,[data-dispatch]');
  const completed=await save(page);assert.equal(completed.sections.academy.dispatch.completed,1);assert.equal(completed.sections.rewards.train,1);assert.equal(completed.sections.academy.delivered,4);
  if(store)await capture(page,`${name}-05-handoff`,true);
  await page.locator('#math-next').click();await page.waitForURL('**/train/?journey=train-1&academy=1');
  assert.match(await page.locator('.academy-nav [aria-current]').innerText(),/調度 4 人/);await check(page,`${name} train-handoff`,'.academy-nav a,[data-open-passport],#pause,.child-console>button');
  const secondModeMs=Date.now()-started;assert.ok(secondModeMs<600000);
  if(store)await capture(page,`${name}-06-train`,true);
  await simulateTransport(page,'train');await check(page,`${name} train-result`,'#journey-next');assert.ok((await save(page)).sections.passport.ratings['train-1']);assert.match(await page.locator('#journey-next').innerText(),/公路送補給/);
  await page.locator('#journey-next').click();await page.waitForURL('**/car/?journey=car-1&academy=1');await simulateTransport(page,'car');
  await check(page,`${name} road-result`,'#journey-next,#again-button,#choose-button');assert.match(await page.locator('#journey-next').innerText(),/空中找路標/);if(store)await capture(page,`${name}-07-road-result`,true);
  await page.locator('#journey-next').click();await page.waitForURL('**/flight/?journey=flight-1&academy=1');await simulateTransport(page,'flight');
  await check(page,`${name} flight-result`,'#journey-next');await page.locator('#journey-next').click();await page.waitForURL(base);assert.match(await page.locator('#academy-record').innerText(),/山海同行章/);
  await page.close();page=await context.newPage();watch(page);await page.goto(base);assert.match(await page.locator('#academy-record').innerText(),/4／4/);if(store)await capture(page,`${name}-08-student`,true);
  if(store){
   await gate(page);const imported=JSON.stringify({format:'taiwan-train-math.backup',version:1,passport:{version:1,dispatch:{completed:0,active:null},completed:['historic']},session:null});
   await page.locator('#train-backup').setInputFiles({name:'old-passport.json',mimeType:'application/json',buffer:Buffer.from(imported)});await page.waitForFunction(()=>document.getElementById('train-import-status').textContent.includes('已保留原備份'));
   assert.equal((await save(page)).sections.academy.dispatch.completed,1);assert.equal((await save(page)).sections.academy.archive,imported);await page.locator('.done-button').click();
   await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller);await context.setOffline(true);await page.reload();
   await page.locator('#math-practice').click();await page.locator('[data-dispatch=learn]').click();await page.locator('[data-dispatch=add]').click();await page.locator('#math-back').click();await page.reload();await page.locator('#math-practice').click();assert.equal(await page.locator('.dispatch-carriage.front strong').innerText(),'1 人');await page.locator('#math-back').click();
   await page.locator('.train-card').click();await page.locator('#child-prepare').waitFor();await page.locator('.academy-nav a').first().click();await page.locator('#academy-start').waitFor();
  }
  rows.push({label:`${name} complete-mainline-save-reopen`,firstMathMs,secondModeMs,durationMs:Date.now()-started,physics:'time-stepped original simulation; no position, completion or save manipulation',problems:[]});
  await context.close();console.log(`PASS ${name}: math → train → car → flight → persisted student badge`);
 }
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
}finally{
 await browser.close();await writeFile(`${folder}/merge-path.json`,JSON.stringify({status:'EXECUTED',rows,errors,externalRequests:external},null,2));
 await writeFile(`${screens}/manifest.json`,JSON.stringify({status:'EXECUTED',sourceVersion:JSON.parse(await readFile('package.json','utf8')).version,method:'headless Chromium actual UI; math uses UI only, transport uses original physics with accelerated ticks',native:false,shots},null,2));
}
console.log(`PASS ${rows.length} integration checks; ${shots.length} screenshots; 0 runtime errors / external requests`);
