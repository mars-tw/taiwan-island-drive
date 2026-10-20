// Actual runtime artwork, pose interpolation, reduced motion, and precise store captures.
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE||'C:/Users/digimkt/Desktop/遊戲/storm-apocalypse/node_modules/playwright/index.mjs').href);
const base=process.env.BASE_URL||'http://127.0.0.1:5286/',out='docs/art/evidence/r5',store='docs/store/screenshots/art-r5';
await mkdir(out,{recursive:true});await mkdir(store,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']}),rows=[],shots=[],errors=[],external=[];
const sizes=[['se',320,568,1],['phone',390,844,1],['landscape',844,390,1],['se-landscape',568,320,1],['ipad',768,1024,1],['ipad-landscape',1024,768,1],['short-laptop',1366,600,1],['desktop',1920,1080,1],['iphone-store',430,932,3],['ipad-store',1032,1376,2]];
try{for(const [name,width,height,dpr] of sizes.filter(v=>!process.env.ART_SIZE||v[0]===process.env.ART_SIZE)){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,hasTouch:true,serviceWorkers:'block'}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url())&&new URL(r.url()).origin!==new URL(base).origin)external.push(r.url());});
 async function capture(label,wait=true){await page.evaluate(()=>document.fonts.ready);if(wait){await page.waitForFunction(()=>!document.querySelector('.academy-sticker'));await page.waitForTimeout(800);}const path=`${name.endsWith('store')?store:out}/${name}-${label}.png`;await page.screenshot({path});const b=await readFile(path);shots.push({path,width:b.readUInt32BE(16),height:b.readUInt32BE(20),sha256:createHash('sha256').update(b).digest('hex'),native:false});}
 async function characters(){const stats=await page.locator('.dispatch-seats .passenger-figure').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect(),b=e.closest('.dispatch-body').getBoundingClientRect();return {width:r.width,height:r.height,x:r.x,y:r.y,inside:r.top>=b.top-.5&&r.bottom<=b.bottom+.5&&r.left>=b.left-.5&&r.right<=b.right+.5,images:[...e.querySelectorAll('img')].map(i=>({src:i.currentSrc,loaded:i.complete&&i.naturalWidth>0}))};}));assert.ok(stats.every(s=>s.width>=40&&s.height>=60&&s.images.every(i=>i.loaded)),'40px characters and two loaded poses');assert.ok(stats.every(s=>s.inside),'All seated friends visible above the fixed controls');return stats;}
 await page.goto(base);await page.locator('#academy-start').waitFor();await page.waitForFunction(()=>[...document.querySelectorAll('.card-image>img')].every(i=>i.complete));assert.ok(await page.locator('.card-image>img').evaluateAll(es=>es.every(i=>i.currentSrc.includes('/r5/'))));await capture('01-home');
 await page.locator('#academy-start').click();await page.locator('[data-dispatch=learn]').click();await page.waitForTimeout(250);
 let motion=null;
 if(name==='phone'){
  // Start on a rendered frame; avoid Playwright screenshot stabilisation before sampling.
  await page.locator('[data-dispatch=add]').evaluate(e=>e.click());
  motion=await page.locator('.dispatch-seats .passenger-figure').evaluate(e=>({duration:e.getAnimations()[0]?.effect.getTiming().duration,poses:[...e.querySelectorAll('img')].map(i=>i.src)}));assert.equal(motion.duration,700);assert.notEqual(...motion.poses);
  const samples=[];for(const delay of [60,180,230]){await page.waitForTimeout(delay);samples.push(await page.locator('.dispatch-seats .passenger-figure').evaluate(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,opacity:[...e.querySelectorAll('img')].map(i=>getComputedStyle(i).opacity)};}));}
  assert.ok(Math.abs(samples[0].y-samples[2].y)+Math.abs(samples[0].x-samples[2].x)>4);motion.samples=samples;
 }else await page.locator('[data-dispatch=add]').click();
 for(let i=1;i<5;i++)await page.locator('[data-dispatch=add]').click();await page.waitForTimeout(800);assert.equal(await page.locator('.passenger-face').count(),5);await characters();await capture('02-load');
 await page.locator('[data-dispatch=check]').click();await page.locator('[data-dispatch=to-rear]').click();await page.waitForTimeout(800);assert.equal(await page.locator('.passenger-face').count(),5);await characters();await capture('03-split');
 await page.locator('[data-dispatch=check]').click();assert.equal(await page.locator('.stay-sign').innerText(),'留在海風站');await capture('04-subtract');
 const answers=await page.locator('[data-dispatch^="answer:"]').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {w:r.width,h:r.height,bg:getComputedStyle(e).backgroundColor};}));assert.ok(answers.every(a=>a.w>=60&&a.h>=60));assert.equal(new Set(answers.map(a=>a.bg)).size,1);
 await page.locator('[data-dispatch="answer:4"]').click();assert.equal(await page.locator('.math-award').count(),2);await capture('05-awards');await page.locator('#math-back').click();
 await page.locator('.passport-open').click();await capture('06-passport');await page.locator('#passport-close').click();
 await page.goto(base+'train/');await page.waitForFunction(()=>window.__trainSchool?.world?.assetsReady&&window.__trainSchool.world.pictureSky.image?.complete);await capture('07-train');
 const scene=await page.locator('.scene').boundingBox();const live=await page.evaluate(()=>({cabVisible:window.__trainSchool.world.cabRoot.visible,sky:window.__trainSchool.world.scene.background.isTexture}));assert.equal(live.cabVisible,false);assert.equal(live.sky,true);assert.doesNotMatch(await page.locator('body').innerText(),/SPEED|POWER|BRAKE|SIGNAL|鍵盤/);
 rows.push({name,status:'VERIFIED',motion,answers,sceneFraction:scene.width*scene.height/(width*height),live});await context.close();console.log(`VERIFIED ${name}`);
}
 const ctx=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'}),p=await ctx.newPage();await p.goto(base);await p.locator('#academy-start').click();await p.locator('[data-dispatch=learn]').click();await p.locator('[data-dispatch=add]').click();assert.equal(await p.locator('.passenger-figure').evaluateAll(es=>es.flatMap(e=>e.getAnimations({subtree:true})).length),0);rows.push({name:'reduced-motion',status:'VERIFIED',animations:0});await ctx.close();
}finally{await browser.close();await writeFile('docs/art/visual-r5.json',JSON.stringify({status:errors.length||external.length?'BLOCKED':'VERIFIED',rows,shots,errors,external,method:'Unmodified headless Chromium runtime. No native/device/independent-review claim.'},null,2));}
assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
await writeFile(store+'/manifest.json',JSON.stringify({version:'2.9.0',status:'VERIFIED',shots:shots.filter(s=>s.path.startsWith(store)),method:'Unmodified headless web capture, not native screenshots'},null,2));
console.log(`VERIFIED ${rows.length} cases, ${shots.length} images`);
