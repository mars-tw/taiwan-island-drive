import {pathToFileURL} from 'node:url';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE||'C:/Users/digimkt/Desktop/遊戲/storm-apocalypse/node_modules/playwright/index.mjs').href);
const phase=process.env.ART_PHASE||'before',base=process.env.BASE_URL||'http://127.0.0.1:5286/';
const out=`docs/art/compare/${phase}`;await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']});
const shots=[],errors=[];
try{for(const [name,width,height,dpr] of [['phone',390,844,1],['landscape',844,390,1],['ipad',768,1024,1],['desktop',1366,768,1],...(phase==='after'?[['iphone-store',430,932,3],['ipad-store',1032,1376,2]]:[])].filter(v=>!process.env.ART_SIZES||process.env.ART_SIZES.split(',').includes(v[0]))){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,hasTouch:width<1100,serviceWorkers:'block'});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 async function shot(screen){await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(250);const path=`${out}/${name}-${screen}.png`;await page.screenshot({path});const b=await readFile(path);shots.push({path,width:b.readUInt32BE(16),height:b.readUInt32BE(20),sha256:createHash('sha256').update(b).digest('hex')});if(name.endsWith('store')){await mkdir('docs/store/screenshots/art-r4',{recursive:true});await page.screenshot({path:`docs/store/screenshots/art-r4/${name}-${screen}.png`});}}
 await page.goto(base);await page.locator('#academy-start').waitFor();await shot('home');
 await page.locator('#academy-start').click();await shot('math');await page.locator('#math-back').click();
 await page.locator('.passport-open').first().click();await shot('passport');await page.locator('#passport-close').click();
 await page.locator('#safety-start').click();await shot('safety');await page.locator('#safety-back').click();
 if(['phone','desktop','iphone-store','ipad-store'].includes(name))for(const mode of ['car','train','flight']){await page.goto(base+mode+'/');await page.locator({car:'#start-button:not([disabled])',train:'#child-prepare',flight:'#start:not([disabled])'}[mode]).waitFor({timeout:60000});if(mode==='car')await page.waitForFunction(()=>!document.querySelector('#loading-screen'));await shot(mode);}
 await context.close();console.log(`${phase} ${name} captured`);
}}finally{await browser.close();await writeFile(`${out}/manifest.json`,JSON.stringify({phase,status:errors.length?'BLOCKED':'VERIFIED',method:'Unmodified headless Chromium runtime; cold local student record',errors,shots},null,2));}
if(errors.length)throw Error(errors.join('\n'));
