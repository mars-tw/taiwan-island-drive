// Supplementary public-touch proof: main road -> entering -> parked, no model writes.
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE||'C:/Users/digimkt/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs').href);
const out='docs/content/r33/approach';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true}),page=await context.newPage(),shots=[],errors=[],external=[];
page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url())&&new URL(r.url()).origin!=='http://127.0.0.1:5286')external.push(r.url());});
let held=[],success=false,cdp;
const state=()=>page.locator('.content-scene').evaluate(e=>({...e.dataset}));
async function keys(ids){if(ids.join()===held.join())return;if(held.length)await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});held=[];if(ids.length){const points=[];for(let i=0;i<ids.length;i++){const r=await page.locator(`[data-action="${ids[i]}"]`).boundingBox();points.push({x:r.x+r.width/2,y:r.y+r.height/2,id:i+1});}await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});held=ids;}}
async function capture(name){await page.evaluate(async()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));const s=await state(),pan=await page.locator('.cake-road-view').evaluate(e=>e.style.getPropertyValue('--bay-pan'));
 const controls=await page.locator('#content-r1 button').evaluateAll(es=>es.filter(e=>!e.disabled&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').map(e=>{const r=e.getBoundingClientRect(),h=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {id:e.id||e.dataset.action,w:r.width,h:r.height,bad:r.width<59.8||r.height<59.8||r.x<0||r.y<0||r.right>innerWidth+.5||r.bottom>innerHeight+.5||h!==e&&!e.contains(h)};}));assert.ok(controls.every(c=>!c.bad));
 const clipping=await page.locator('#content-r1').evaluate(root=>{const bad=[],walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);while(walker.nextNode()){const n=walker.currentNode,e=n.parentElement;if(!n.textContent.trim()||e.closest('svg'))continue;let visible=true;for(let a=e;a;a=a.parentElement){const c=getComputedStyle(a);if(a.hidden||c.display==='none'||c.visibility==='hidden')visible=false;}if(!visible)continue;const range=document.createRange();range.selectNodeContents(n);for(const r of range.getClientRects()){if(!r.width||!r.height)continue;if(r.x<-.6||r.y<-.6||r.right>innerWidth+.6||r.bottom>innerHeight+.6)bad.push(n.textContent);for(let a=e;a&&a!==document.body;a=a.parentElement){const c=getComputedStyle(a),b=a.getBoundingClientRect();if((['clip','hidden','auto','scroll'].includes(c.overflowX)&&(r.x<b.x-1||r.right>b.right+1))||(['clip','hidden','auto','scroll'].includes(c.overflowY)&&(r.y<b.y-1||r.bottom>b.bottom+1)))bad.push(n.textContent);}}}return [...new Set(bad)];});assert.deepEqual(clipping,[]);
 if(name==='main-road')assert.equal(pan,'0%');else assert.ok(+s.speed<2);if(name==='parked')assert.equal(+s.speed,0);
 const path=`${out}/phone-cake-approach-${name}.png`;await page.screenshot({path});const b=await readFile(path);shots.push({path,width:b.readUInt32BE(16),height:b.readUInt32BE(20),sha256:createHash('sha256').update(b).digest('hex'),state:s,pan,controls,clipping});
}
try{
 await page.clock.install();await page.goto('http://127.0.0.1:5286/');await page.locator('#content-start').waitFor();await page.clock.pauseAt(await page.evaluate(()=>Date.now()+100));cdp=await context.newCDPSession(page);
 await page.locator('#content-start').click();await page.locator('[data-content=cake]').click();await page.locator('[data-stage-choice="2"]').click();await page.locator('[data-action=practice]').click();await page.clock.runFor(96);await page.locator('[data-action=magnify]').click();
 const captured=new Set();
 for(let n=0;n<3500;n++){
  const s=await state(),dist=+s.distance,lean=+s.balanceLean;
  if(dist>=25&&dist<40&&!captured.has('main-road')){await capture('main-road');captured.add('main-road');}
  if(dist>=40.6&&dist<42&&!captured.has('entering')){await capture('entering');captured.add('entering');}
  if(s.bayStopped==='true'&&s.restReady==='true'){await keys([]);await capture('parked');captured.add('parked');break;}
  const ids=[];if(dist>=42&&s.bayStopped==='false')ids.push('brake');else if(s.bayStopped!=='true')ids.push(s.inBend==='true'?(+s.bend>0?'right':'left'):'go');
  if(Math.abs(lean)>1){ids.push(lean>0?'recover-left':'recover-right');if(Math.abs(lean)>9)ids.push('brake');}
  await keys([...new Set(ids)]);await page.clock.runFor(96);
 }
 assert.equal(captured.size,3);assert.deepEqual(errors,[]);assert.deepEqual(external,[]);success=true;
}finally{
 await browser.close();const sourceFingerprint={};for(const f of ['src/shared/content-r1-ui.js','src/shared/content-r33.js','src/shared/content-r33-scene.js','src/shared/content-r33.css','scripts/capture-content-r33-bay-entry.mjs'])sourceFingerprint[f]=createHash('sha256').update(await readFile(f)).digest('hex');
 await writeFile(out+'/browser-approach.json',JSON.stringify({status:success?'VERIFIED':'EXECUTED',sourceFingerprint,shots,errors,external},null,2));
}
console.log('VERIFIED three original bay entry frames');
