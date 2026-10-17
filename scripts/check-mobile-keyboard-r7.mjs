// Verify the actual gated settings UI does not expose desktop keyboard help on phones.
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {writeFile} from 'node:fs/promises';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE||'C:/Users/digimkt/Desktop/遊戲/storm-apocalypse/node_modules/playwright/index.mjs').href);
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']}),rows=[];
try{for(const [width,height] of [[320,568],[390,844],[844,390]]){
 const context=await browser.newContext({viewport:{width,height},hasTouch:true,serviceWorkers:'block'}),page=await context.newPage();
 await page.goto((process.env.BASE_URL||'http://127.0.0.1:5286/')+'car/');await page.locator('#start-button:not([disabled])').waitFor();await page.waitForFunction(()=>!document.querySelector('#loading-screen'));
 await page.locator('#settings-button').click();const values=(await page.locator('#parent-gate-question').innerText()).match(/\d+/g).map(Number);await page.locator('#parent-gate-answer').fill(String(values[0]+values[1]));await page.locator('#parent-gate-submit').click();await page.locator('#settings-dialog').waitFor();
 assert.equal(await page.locator('.controls-guide .keyboard-help').count(),1);assert.equal(await page.locator('.controls-guide .keyboard-help').isVisible(),false);assert.doesNotMatch(await page.locator('#settings-dialog').innerText(),/W／|Shift|Esc|電腦：/);
 const screenshot=`docs/art/evidence/r7/keyboard-${width}x${height}.png`;await page.screenshot({path:screenshot});rows.push({width,height,status:'VERIFIED',parentGateSolvedThroughUI:true,desktopKeyboardHelpVisible:false,screenshot});await context.close();
}}finally{await browser.close();await writeFile('docs/art/keyboard-r7.json',JSON.stringify({status:rows.length===3?'VERIFIED':'BLOCKED',rows},null,2));}
console.log(`VERIFIED ${rows.length} mobile settings views; no desktop keyboard instructions`);
