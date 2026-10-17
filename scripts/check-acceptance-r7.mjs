// R7 targeted acceptance: rendered target hierarchy, actual reward, shared navigation.
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE||'C:/Users/digimkt/Desktop/遊戲/storm-apocalypse/node_modules/playwright/index.mjs').href);
const base=process.env.BASE_URL||'http://127.0.0.1:5286/',out='docs/art/evidence/r7',store='docs/store/screenshots/art-r7';
await mkdir(out,{recursive:true});await mkdir(store,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']}),rows=[],errors=[],shots=[];
const modelBytes=await readFile('public/models/coupe.glb'),modelDoc=JSON.parse(modelBytes.subarray(20,20+modelBytes.readUInt32LE(12)).toString('utf8'));
const expectedTriangles=modelDoc.nodes.reduce((n,node)=>n+(node.mesh===undefined?0:modelDoc.meshes[node.mesh].primitives.reduce((sum,p)=>sum+modelDoc.accessors[p.indices??p.attributes.POSITION].count/3,0)),0);
const nav=async(page,selector)=>page.locator(selector+'>a').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {label:e.textContent,href:e.href,x:r.x,y:r.y,w:r.width,h:r.height};}));
async function shot(page,path){await page.screenshot({path});const b=await readFile(path);shots.push({path,width:b.readUInt32BE(16),height:b.readUInt32BE(20),sha256:createHash('sha256').update(b).digest('hex'),method:'Unmodified headless Chromium. Actual UI and elapsed time only.',native:false});}
try{
for(const [name,width,height,dpr] of [['phone',390,844,1],['iphone-store',430,932,3],['ipad-store',1032,1376,2]]){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,hasTouch:true,serviceWorkers:'block'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);await page.locator('#academy-start').waitFor();const home=await nav(page,'body>.academy-nav');assert.equal(home.length,4);
 await page.locator('#academy-start').click();const math=await nav(page,'.dispatch-top');assert.deepEqual(math.map(({href,x,y,w,h})=>({href,x,y,w,h})),home.map(({href,x,y,w,h})=>({href,x,y,w,h})));
 await page.locator('[data-dispatch=learn]').click();for(let i=0;i<5;i++){await page.locator('[data-dispatch=add]').click();await page.waitForTimeout(760);}
 await page.locator('[data-dispatch=check]').click();await page.locator('[data-dispatch=to-rear]').click();await page.waitForTimeout(260);
 if(name.endsWith('store'))await shot(page,`${store}/${name}-05-split-action.png`);
 await page.waitForTimeout(600);await page.locator('[data-dispatch=check]').click();await page.locator('[data-dispatch="answer:4"]').click();await page.waitForTimeout(3600);
 const train=await page.locator('.departure-train').boundingBox();assert.ok(train.x>=0&&train.x+train.width<=width&&train.y>=64&&train.y+train.height<=height);assert.equal(await page.locator('.departure-train').evaluate(e=>getComputedStyle(e).transform),'matrix(1, 0, 0, 1, 0, 0)');await shot(page,`${out}/${name}-celebration-settled.png`);
 await page.locator('#math-back').click();await page.locator('#safety-start').click();const safety=await nav(page,'.safety-header');assert.deepEqual(safety.map(({href,x,y,w,h})=>({href,x,y,w,h})),home.map(({href,x,y,w,h})=>({href,x,y,w,h})));await page.locator('#safety-back').click();
 await page.goto(base+'car/');await page.locator('#start-button:not([disabled])').waitFor();await page.waitForFunction(()=>!document.querySelector('#loading-screen'));await page.locator('#start-button').click();await page.waitForFunction(()=>window.__islandDrive.game.phase==='running');await page.locator('#auto-throttle').click();
 const actualTriangles=await page.evaluate(()=>{let n=0;window.__islandDrive.game.car.traverse(o=>{if(o.isMesh)n+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;});return n;});assert.equal(actualTriangles,expectedTriangles,'The actual live car must be the rounded Blender export');
 assert.equal(await page.locator('[data-input=boost]').isVisible(),false);assert.equal(await page.locator('#camera-button').isVisible(),false);assert.equal(await page.locator('#tilt-toggle').isVisible(),false);assert.equal(await page.locator('#speed').isVisible(),false);
 const reward=await page.waitForFunction(()=>Number(document.querySelector('#star-count').textContent)>0,{},{timeout:45000});await reward.dispose();await page.waitForFunction(()=>document.querySelector('.drive-coach').dataset.pose==='reward');await page.waitForTimeout(420);
 const coach=await page.evaluate(()=>{const g=window.__islandDrive.game,s=g.coachSprite;const p=s.position.clone();g.vehicleRoot.localToWorld(p);const a=p.clone(),b=p.clone();a.x-=s.scale.x/2;b.x+=s.scale.x/2;a.y-=s.scale.y/2;b.y+=s.scale.y/2;a.project(g.camera);b.project(g.camera);return {width:Math.abs(b.x-a.x)*g.canvas.clientWidth/2,height:Math.abs(b.y-a.y)*g.canvas.clientHeight/2,visible:s.visible,seatAttached:s.parent===g.vehicleRoot,pose:s.userData.pose};});assert.ok(coach.width>=40&&coach.height>=40);assert.equal(coach.visible,true);assert.equal(coach.seatAttached,true);assert.equal(coach.pose,'reward');
 await shot(page,`${name.endsWith('store')?store:out}/${name}-02-car-reward.png`);
 await page.locator('#pause-button').click();assert.equal(await page.locator('#camera-button').isVisible(),true);assert.equal(await page.locator('#tilt-toggle').isVisible(),true);await page.locator('#camera-button').click();await page.locator('#resume-button').click();
 await page.goto(base+'flight/');await page.locator('#start:not([disabled])').waitFor();await page.locator('#start').click();await page.waitForTimeout(2000);
 const hierarchy=await page.evaluate(()=>{const w=window.__flightSchool.game.world;return w.gates.filter(g=>g.visible).map(g=>({current:g.userData.current,scale:g.scale.x,label:g.userData.label.visible,kind:g.userData.kind}));});assert.equal(hierarchy.filter(g=>g.current).length,1);assert.ok(hierarchy.every(g=>g.label===false));assert.match(await page.locator('.flying-coach img').getAttribute('src'),/coach-radio/);assert.match(await page.locator('#hint').innerText(),/第 1 顆/);await shot(page,`${name.endsWith('store')?store:out}/${name}-03-flight-target.png`);
 rows.push({name,status:'VERIFIED',navigation:home,train,coach,roundedModel:{actualTriangles,expectedTriangles,sha256:createHash('sha256').update(modelBytes).digest('hex')},starHierarchy:hierarchy,reward:'Natural collision event after UI auto-throttle, no state mutation; 420ms into the coach reward pose',secondaryEquipment:'Available in existing pause'});await context.close();console.log('VERIFIED '+name+' navigation / actual reward / target hierarchy / rounded model');
}
}finally{await browser.close();await writeFile('docs/art/acceptance-r7.json',JSON.stringify({status:errors.length||rows.length!==3?'BLOCKED':'VERIFIED',rows,errors,shots,limits:'No independent score or child perception study; not native screenshots.'},null,2));}
assert.deepEqual(errors,[]);
