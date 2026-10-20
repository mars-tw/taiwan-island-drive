// Real ten-minute UI playthrough. No clock emulation or game/save mutation.
import {pathToFileURL} from 'node:url';
import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE||'C:/Users/digimkt/Desktop/遊戲/storm-apocalypse/node_modules/playwright/index.mjs').href);
const base='http://127.0.0.1:5286/',out='docs/art/compare/r8-before';
await mkdir(out,{recursive:true});await mkdir('docs/evidence/deep-r1',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']});
const context=await browser.newContext({viewport:{width:430,height:932},deviceScaleFactor:3,hasTouch:true}),page=await context.newPage(),start=Date.now(),events=[],errors=[];
page.on('pageerror',e=>errors.push(e.message));
async function record(label){const row={seconds:+((Date.now()-start)/1000).toFixed(1),label,url:page.url(),state:await page.evaluate(()=>{const f=window.__flightSchool?.getState(),c=window.__islandDrive?.game?.getState();return f?{mode:f.mode,time:f.time,position:f.position,grounded:f.grounded,passed:f.mission.passed,target:f.mission.target,stage:f.pilot?.stage,hint:document.querySelector('#hint')?.textContent}:c?{phase:c.phase,speed:c.speed,distance:c.distance,stars:c.stars}:document.querySelector('#math-lesson')?.dataset.phase;})};events.push(row);console.log(JSON.stringify(row));await writeFile('docs/evidence/deep-r1/playtest.json',JSON.stringify({status:'EXECUTED',elapsedSeconds:(Date.now()-start)/1000,events,errors},null,2));}
async function shot(label){await page.screenshot({path:`${out}/iphone-${label}.png`});await record(label);}
try{
 await page.goto(base);await page.locator('#academy-start').waitFor();await page.waitForTimeout(1000);await shot('01-home');
 await page.locator('#academy-start').click();await page.locator('[data-dispatch=learn]').click();
 await page.locator('[data-dispatch=check]').click();await record('early check with empty carriage');
 for(let i=0;i<5;i++){await page.locator('[data-dispatch=add]').click();await page.waitForTimeout(900);}
 await shot('08-load');await page.locator('[data-dispatch=check]').click();await page.locator('[data-dispatch=to-rear]').click();await page.waitForTimeout(900);await shot('06-split');
 await page.locator('[data-dispatch=check]').click();await page.locator('[data-dispatch="answer:3"]').click();await record('wrong answer encourages recount');await page.locator('[data-dispatch="answer:4"]').click();await page.waitForTimeout(1500);await shot('07-complete');
 await page.locator('#math-back').click();await page.goto(base+'car/');await page.locator('#start-button:not([disabled])').waitFor({timeout:60000});await page.locator('#start-button').click();await page.waitForFunction(()=>window.__islandDrive.game.phase==='running');await page.locator('#auto-throttle').click();await page.waitForTimeout(4000);await shot('02-driving');
 for(let i=0;i<6;i++){await page.waitForTimeout(22000);const running=await page.evaluate(()=>window.__islandDrive.game.phase==='running');if(running){const target=page.locator(i%2?'.touch-right':'.touch-left');if(await target.count()){const r=await target.boundingBox();await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down();await page.waitForTimeout(240);await page.mouse.up();}}await record('car road exploration '+i);}
 await shot('03-car-later');await page.goto(base+'flight/');await page.locator('#start:not([disabled])').waitFor({timeout:60000});await page.locator('#start').click();await page.waitForTimeout(1800);await shot('04-takeoff');
 for(let i=0;i<8;i++){await page.waitForTimeout(20000);const mode=await page.evaluate(()=>window.__flightSchool.game.mode);if(mode==='result')await page.locator('#replay').click();else if(mode==='paused')await page.locator('#continue').click();else await page.locator('#child-action').click();await record('flight goal exploration '+i);if(i===2)await shot('05-airborne');}
 await page.goto(base+'train/');await page.locator('#child-prepare').waitFor();await page.locator('#child-prepare').click();await page.locator('#child-go').click();await record('train depart');
 for(let i=0;i<6;i++){await page.waitForTimeout(20000);if(i===2&&await page.locator('#child-stop').isVisible())await page.locator('#child-stop').click();await record('train observation '+i);}
 await page.goto(base);await page.locator('#math-practice').click();await record('return to saved classroom');
 while(Date.now()-start<601000){await page.waitForTimeout(12000);const add=page.locator('[data-dispatch=add]:not(:disabled)'),next=page.locator('[data-dispatch=start]');if(await next.isVisible())await next.click();else if(await page.locator('[data-dispatch=learn]').isVisible())await page.locator('[data-dispatch=learn]').click();else if(await add.isVisible())await add.click();else if(await page.locator('[data-dispatch=check]').isVisible())await page.locator('[data-dispatch=check]').click();await record('repeat play');}
 await writeFile('docs/evidence/deep-r1/playtest.json',JSON.stringify({status:'VERIFIED',method:'Wall-clock ten minutes, real UI, no game state writes; adult technical playtest, not child study',elapsedSeconds:(Date.now()-start)/1000,events,errors},null,2));
}finally{await browser.close();}
