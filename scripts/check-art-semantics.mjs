// Visual regression for the MUSE-reported answer hint and real passenger assets.
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE||'C:/Users/digimkt/Desktop/遊戲/storm-apocalypse/node_modules/playwright/index.mjs').href);
const base=process.env.BASE_URL||'http://127.0.0.1:5286/',out='docs/store/screenshots/art-r4';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});const rows=[],shots=[],errors=[],external=[];
try{for(const [name,width,height,dpr] of [['iphone-store',430,932,3],['ipad-store',1032,1376,2],['se-landscape',568,320,1]]){
 const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,hasTouch:true,serviceWorkers:'block'}),page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url())&&new URL(r.url()).origin!==new URL(base).origin)external.push(r.url());});
 async function shot(label){await page.waitForFunction(()=>!document.querySelector('.academy-sticker'));const dir=name.endsWith('store')?out:'docs/art/evidence';await mkdir(dir,{recursive:true});const path=`${dir}/${name}-${label}.png`;await page.screenshot({path});const b=await readFile(path);shots.push({path,width:b.readUInt32BE(16),height:b.readUInt32BE(20),sha256:createHash('sha256').update(b).digest('hex')});}
 await page.goto(base);await page.locator('#academy-start').click();await page.locator('[data-dispatch=learn]').click();for(let i=0;i<5;i++)await page.locator('[data-dispatch=add]').click();
 await page.waitForFunction(()=>[...document.querySelectorAll('.passenger-face')].every(i=>i.complete&&i.naturalWidth>0));assert.equal(await page.locator('.passenger-face').count(),5);await shot('math-load');
 await page.locator('[data-dispatch=check]').click();await page.locator('[data-dispatch=to-rear]').click();assert.equal(await page.locator('.passenger-face').count(),5);await shot('math-split');
 await page.locator('[data-dispatch=check]').click();
 const styles=await page.locator('[data-dispatch^="answer:"]').evaluateAll(els=>els.map(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {text:e.textContent,background:s.backgroundColor,color:s.color,border:s.borderColor,width:r.width,height:r.height};}));
 assert.equal(new Set(styles.map(x=>[x.background,x.color,x.border].join('/'))).size,1,'All answers must have identical styling');assert.equal(styles[0].background,'rgb(255, 255, 255)');assert.ok(styles.every(s=>s.width>=60&&s.height>=60));await shot('math-answers');
 await page.locator('[data-dispatch="answer:4"]').click();await page.locator('#math-next').waitFor();await shot('math-done');
 await page.goto(base+'car/');await page.locator('#start-button:not([disabled])').waitFor({timeout:60000});assert.doesNotMatch(await page.locator('#start-hint').innerText(),/鍵盤/);assert.ok(await page.locator('kbd').evaluateAll(es=>es.every(e=>!e.getClientRects().length)));
 rows.push({name,passengerCount:5,answers:styles,mobileKeyboardHints:false,status:'VERIFIED'});await ctx.close();
}}finally{await browser.close();await writeFile('docs/art/visual-semantics.json',JSON.stringify({status:errors.length||external.length?'BLOCKED':'VERIFIED',rows,errors,external,shots},null,2));}
assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log(`VERIFIED ${rows.length} viewports: 5 real passenger faces, equal answer styling, 60px answers; ${shots.length} captures; no external requests`);
