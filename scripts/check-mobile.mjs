// R2 full-rectangle reachability + real-physics short-outing E2E. Headless only.
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:5109/';
const folder=process.env.EVIDENCE_FOLDER||'docs/evidence/r2-mobile';await mkdir(`${folder}/after`,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']});
const rows=[],errors=[],requests=[];
async function check(page,name,selectors,min=60){
 const result=await page.evaluate(({selectors,min})=>{
  const problems=[];let checked=0;
  for(const selector of selectors){const elements=[...document.querySelectorAll(selector)];if(!elements.length)problems.push(`${selector}: missing`);
   for(const el of elements){if(el.disabled)continue;const r=el.getBoundingClientRect();checked++;
    if(r.width<min-.1||r.height<min-.1)problems.push(`${selector}: ${r.width.toFixed(1)}x${r.height.toFixed(1)} < ${min}`);
    if(r.left<-.5||r.top<-.5||r.right>innerWidth+.5||r.bottom>innerHeight+.5)problems.push(`${selector}: outside ${JSON.stringify(r.toJSON())}`);
    for(const [x,y] of [[r.x+r.width/2,r.y+r.height/2],[r.x+10,r.y+10],[r.right-10,r.bottom-10],[r.x+r.width/2,r.bottom-2],[r.x+r.width/2,r.top+2],[r.left+2,r.y+r.height/2],[r.right-2,r.y+r.height/2]]){const hit=document.elementFromPoint(x,y);if(!hit||!(el===hit||el.contains(hit)))problems.push(`${selector}: covered at ${x},${y} by ${hit?.tagName}#${hit?.id}`);}
   }
  }
  if(document.documentElement.scrollWidth>innerWidth)problems.push('Horizontal overflow');
  return {checked,problems};
 },{selectors,min});rows.push({name,...result});
 if(result.problems.length)console.error(name,result.problems.join('\n'));
}
try{
 for(const [width,height] of [[390,844],[844,390],[1366,600],[1280,640]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:width<900,hasTouch:true,deviceScaleFactor:1});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('request',request=>{if(!request.url().startsWith('data:')&&new URL(request.url()).origin!==new URL(base).origin)requests.push(request.url());});
  const label=`${width}x${height}`;
  for(const mode of ['home','car','train','flight']){
   await page.goto(base+(mode==='home'?'':`${mode}/`));await page.waitForSelector(({home:'.card-action',car:'#start-button:not([disabled])',train:'#child-prepare',flight:'#start:not([disabled])'})[mode],{timeout:60000});
   await page.waitForTimeout(600);
   const outgoing=await page.evaluate(()=>[...document.querySelectorAll('a[href],a[data-parent-url]')].map(a=>a.getAttribute('href')||a.dataset.parentUrl).filter(href=>{const url=new URL(href,location.href);return url.origin!==location.origin||/\/downloads\//.test(url.pathname);}));assert.deepEqual(outgoing,[],`${mode}: child UI has outgoing destinations`);
   await check(page,`${label} ${mode}-menu`,mode==='home'?['.academy-card','.card-action','[data-open-passport]']:mode==='car'?['.academy-nav a','[data-open-passport]','#start-button','[data-map]','[data-vehicle]','[data-paint]','[data-mode]']:mode==='train'?['.academy-nav a','[data-open-passport]','#pause','.child-console>button']:['.academy-nav a','[data-open-passport]','#start','#map-choice','#plane-choice','[data-lesson]:not([hidden])','#lesson-prev','#lesson-next']);
   if(mode==='flight')for(let index=0;index<2;index++){await page.locator('#lesson-next').click();await check(page,`${label} flight-activity-page-${index+2}`,['[data-lesson]:not([hidden])','#lesson-prev','#lesson-next','#start']);}
   await page.locator('[data-open-passport]').first().click();
   for(const tab of ['car','train','flight']){await page.locator(`[data-passport-mode=${tab}]`).click();await check(page,`${label} ${mode}-passport-${tab}`,['#passport-close','[data-passport-mode]','.passport-chapter:not(:disabled)']);assert.equal(await page.locator('.passport-chapter').count(),4);assert.equal(await page.locator('.passport-chapter:disabled').count(),3);}
   await page.locator('#passport-close').click();
   if(mode==='car'){
    await page.locator('#start-button').click();await page.waitForFunction(()=>window.__islandDrive.game.phase==='running');
    await check(page,`${label} car-drive`,['#pause-button','[data-input=left]','[data-input=right]','[data-input=throttle]','[data-input=brake]','#auto-throttle']);
    await page.locator('#auto-throttle').tap();assert.equal(await page.evaluate(()=>window.__islandDrive.game.input.throttle),1);
    const brake=await page.locator('[data-input=brake]').boundingBox();await page.mouse.move(brake.x+brake.width/2,brake.y+brake.height/2);await page.mouse.down();
    assert.equal(await page.evaluate(()=>window.__islandDrive.game.input.throttle),0);assert.equal(await page.evaluate(()=>window.__islandDrive.game.input.brake),1);await page.mouse.up();
    const left=await page.locator('[data-input=left]').boundingBox();await page.mouse.move(left.x+left.width/2,left.y+left.height/2);await page.mouse.down();await page.locator('[data-input=left]').dispatchEvent('pointercancel',{pointerId:1,pointerType:'mouse'});await page.mouse.up();
    assert.equal(await page.evaluate(()=>window.__islandDrive.game.input.steer),0);
    await page.locator('#pause-button').tap();assert.equal(await page.evaluate(()=>window.__islandDrive.game.input.throttle),0);assert.equal(await page.locator('#auto-throttle').getAttribute('aria-pressed'),'false');
    await check(page,`${label} car-pause`,['#resume-button','#restart-button','#back-button']);
   }
   if(mode==='flight'){
    await page.locator('#start').click();await page.waitForTimeout(400);await check(page,`${label} flight-play`,['#child-left','#child-action','#child-right','#pause','#return-home']);
    await page.locator('#pause').click();await page.waitForTimeout(150);await check(page,`${label} flight-pause`,['#continue','#replay','#home']);
   }
  }
  // Complete one outing per mode from a genuinely fresh save, via the public UI.
  if(width<900)for(const mode of ['car','train','flight']){
   await page.goto(base);await page.locator('[data-open-passport]').click();await page.locator(`[data-passport-mode=${mode}]`).click();await page.locator(`[data-journey=${mode}-1]`).click();
   await page.waitForFunction(mode=>mode==='car'?window.__islandDrive?.game.phase==='running':mode==='train'?!!window.__trainSchool:window.__flightSchool?.game.mode==='playing',mode,{timeout:60000});
   if(mode==='car'){
    await page.locator('#auto-throttle').tap();
    await page.evaluate(()=>{const g=window.__islandDrive.game,raf=window.requestAnimationFrame;window.requestAnimationFrame=()=>0;try{let now=performance.now();g.lastTime=0;for(let tick=0;tick<60*120&&g.phase!=='finished';tick++)g.frame(now+=1000/60);g.lastTime=0;}finally{window.requestAnimationFrame=raf;}});
   }else if(mode==='train'){
    await page.locator('#child-prepare').tap();await page.locator('#child-go').tap();await page.locator('#child-help-stop').tap();
    await page.evaluate(()=>{const g=window.__trainSchool.game;for(let tick=0;tick<60*200&&!g.completed;tick++){const s=g.getState();if(Math.abs(s.distance)<12&&Math.abs(s.speed)<.5&&!s.controls.doors)document.querySelector('#child-doors').click();if(g.serviced)document.querySelector('#child-doors').click();g.update(1/60);}});
   }else{
    await page.evaluate(()=>{const g=window.__flightSchool.game,raf=window.requestAnimationFrame;window.requestAnimationFrame=()=>0;try{let now=performance.now();g.last=now;for(let tick=0;tick<60*180&&g.mode==='playing';tick++)g.frame(now+=1000/60);g.last=performance.now();}finally{window.requestAnimationFrame=raf;}});
   }
   await page.waitForSelector('#journey-next',{timeout:10000});await page.waitForTimeout(800);
   await check(page,`${label} ${mode}-result`,['#journey-next',...(mode==='car'?['#again-button','#choose-button']:mode==='train'?['#replay']:['#replay','#home'])]);
   await page.screenshot({path:`${folder}/after/${label}-${mode}-complete.png`});
   const save=await page.evaluate(()=>JSON.parse(localStorage.getItem('island-transport:passport:v1')));assert.ok(save.ratings[`${mode}-1`]);
   // Replaying keeps the short-course contract and awards no free completion.
   await page.locator(mode==='car'?'#again-button':'#replay').click();await page.waitForTimeout(100);
   const replay=await page.evaluate(mode=>mode==='car'?{progress:window.__islandDrive.game.physics.distance,length:window.__islandDrive.game.journeyDistance}:mode==='train'?{progress:window.__trainSchool.game.stops.length,lesson:window.__trainSchool.game.lessonId}:{progress:window.__flightSchool.game.mission.passed,total:window.__flightSchool.game.mission.total},mode);
   assert.equal(replay.progress,0);if(mode==='car')assert.equal(replay.length,360);if(mode==='train')assert.equal(replay.lesson,'outing1');if(mode==='flight')assert.equal(replay.total,2);
   await page.goto(base);await page.reload();await page.locator('[data-open-passport]').click();await page.locator(`[data-passport-mode=${mode}]`).click();assert.equal(await page.locator(`[data-journey=${mode}-2]`).isEnabled(),true);await page.locator(`[data-journey=${mode}-2]`).click();
   await page.waitForURL(`**/${mode}/?journey=${mode}-2`);await page.waitForFunction(mode=>mode==='car'?window.__islandDrive?.game.journeyDistance===600:mode==='train'?window.__trainSchool?.game.lessonId==='outing2':window.__flightSchool?.game.mission.total===1,mode,{timeout:60000});
   rows.push({name:`${label} ${mode} completion-save-replay-next`,checked:1,problems:[]});
  }
  await context.close();
 }
}finally{await browser.close();await writeFile(`${folder}/mobile-check.json`,JSON.stringify({rows,errors,externalRequests:requests},null,2));}
assert.equal(errors.length,0,JSON.stringify(errors));assert.equal(requests.length,0,JSON.stringify(requests));assert.equal(rows.flatMap(row=>row.problems).length,0,'See mobile-check.json');
console.log(`PASS ${rows.length} scenarios; ${rows.reduce((n,row)=>n+row.checked,0)} control checks; 0 runtime errors; 0 external requests`);
