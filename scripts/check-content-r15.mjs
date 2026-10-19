// Public UI only. Playwright's clock drives the real RAF/timers; no game-state
// assignment, completion flags, screenshot pixel edits, or artificial saves.
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE||'C:/Users/digimkt/Desktop/遊戲/storm-apocalypse/node_modules/playwright/index.mjs').href);
const base=process.env.BASE_URL||'http://127.0.0.1:5286/',out=process.env.R15_OUT||'docs/content/r15',scope=process.env.R15_SCOPE||'all';
await mkdir(out,{recursive:true});const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']});
const rows=[],shots=[],errors=[],external=[],http=[];
const a=(p,id)=>p.locator(`[data-action="${id}"]`),diag=p=>p.locator('.content-scene').evaluate(e=>({...e.dataset}));
const check=(label,detail={})=>{rows.push({label,status:'VERIFIED',...detail});console.log('VERIFIED '+label);};
const tick=(p,ms)=>p.clock.runFor(ms);
async function make(width=390,height=844,dpr=1){const c=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,hasTouch:true});const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(/^https?:/.test(r.url())&&new URL(r.url()).origin!==new URL(base).origin)external.push(r.url());});p.on('response',r=>{if(r.status()>=400)http.push({url:r.url(),status:r.status()});});await p.clock.install();await p.goto(base);await p.locator('#content-start').waitFor();await p.clock.pauseAt(await p.evaluate(()=>Date.now()+100));return {c,p};}
async function tap(p,id){await a(p,id).click();await tick(p,96);}
async function enter(p,k){await p.locator('#content-start').click();await p.locator(`[data-content=${k}]`).click();await tap(p,'begin');}
async function hold(p,id,ms){const b=await a(p,id).boundingBox();await p.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.mouse.down();await tick(p,ms);await p.mouse.up();await tick(p,96);}
async function down(p,id){const b=await a(p,id).boundingBox();await p.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.mouse.down();}
async function until(p,fn,limit=30000,step=96){for(let t=0;t<limit;t+=step){if(fn(await diag(p)))return;await tick(p,step);}throw Error('Timed out '+JSON.stringify(await diag(p)));}
async function geometry(p){return p.locator('.content-scene').evaluate(e=>{const r=x=>{if(!x)return null;const b=x.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,right:b.right,bottom:b.bottom};};return {scene:r(e),car:r(e.querySelector('.content-car')),carrier:r(e.querySelector('.content-carrier')),train:r(e.querySelector('.ticket-vehicle')),door:r(e.querySelector('.ticket-door')),signs:[...e.querySelectorAll('[data-platform]')].map(x=>({id:x.dataset.platform,text:x.innerText,box:r(x)})),people:[...e.querySelectorAll('.boarding-friend,.ticket-seated,.content-walker:not([hidden]),.crossing-arrived>div,.crossing-waiting>div')].filter(x=>x.getClientRects().length).map(x=>({id:x.dataset.friend||x.dataset.person||x.dataset.waiting||x.dataset.arrivedFriend,kind:x.className||x.parentElement.className,box:r(x)})),counts:e.querySelector('.ticket-counts').innerText,queue:e.querySelector('.ticket-queue-path').innerHTML,mini:e.querySelector('.cake-miniature .cake-rigid').style.transform,large:e.querySelector('.cake-closeup .cake-rigid').style.transform,meter:e.querySelector('[role=meter]')?.getAttribute('aria-valuenow'),route:e.querySelectorAll('.content-route i.complete').length,controls:r(document.querySelector('#content-controls')),trainSource:e.querySelector('.content-train').getAttribute('src')};});}
async function shot(p,name,folder=out){await p.evaluate(async()=>Promise.all([...document.images].filter(i=>i.getClientRects().length).map(i=>i.decode().catch(()=>{}))));const path=`${folder}/${name}.png`;await p.screenshot({path});const b=await readFile(path),s={path,width:b.readUInt32BE(16),height:b.readUInt32BE(20),sha256:createHash('sha256').update(b).digest('hex'),state:await diag(p),phase:await p.locator('#content-r1').getAttribute('data-phase'),hint:await p.locator('#content-hint').innerText(),controls:await p.locator('#content-controls button').evaluateAll(es=>es.map(e=>({id:e.dataset.action,text:e.innerText,needed:e.dataset.needed,held:e.dataset.held,color:getComputedStyle(e).backgroundColor,disabled:e.disabled}))),geometry:await geometry(p),method:'Unmodified headless Chromium PNG; real public UI with Playwright clock controlling RAF/timers; no game state or save assignments',native:false};shots.push(s);return s;}
async function reachable(p,label){const bad=await p.locator('#content-r1 button').evaluateAll(es=>es.filter(e=>e.getClientRects().length&&!e.disabled).map(e=>{const r=e.getBoundingClientRect(),pts=[[r.x+r.width/2,r.y+r.height/2],[r.x+3,r.y+3],[r.right-3,r.bottom-3]];return {id:e.id||e.dataset.action||e.dataset.platform||e.dataset.content,width:r.width,height:r.height,hits:pts.map(([x,y])=>document.elementFromPoint(x,y)?.outerHTML.slice(0,140)),bad:r.width<59.8||r.height<59.8||r.x<-.5||r.y<-.5||r.right>innerWidth+.5||r.bottom>innerHeight+.5||pts.some(([x,y])=>{const h=document.elementFromPoint(x,y);return h!==e&&!e.contains(h);})};}));assert.ok(bad.length);if(bad.some(x=>x.bad))await shot(p,'failed-'+label.replace(/[^a-z0-9-]/gi,'-'));assert.deepEqual(bad.filter(x=>x.bad),[],label);assert.doesNotMatch(await p.locator('#content-r1').innerText(),/WASD|方向鍵|空白鍵|鍵盤/);check(label,{controls:bad.length});}
const record=(p,k)=>p.evaluate(k=>JSON.parse(localStorage.getItem('island-transport:student:v2')).sections.contentR1[k],k);
async function saved(p,k){assert.equal((await record(p,k)).completed,true);await shot(p,`phone-${k}-complete`);await p.locator('#content-back').click();await p.reload();await p.locator('#content-start').click();await p.locator(`[data-content=${k}]`).click();assert.equal(await p.locator('#content-r1').getAttribute('data-phase'),'done');const s=await shot(p,`phone-${k}-saved-result`);assert.equal(await p.locator('.lesson-route-proof>div').count(),3);assert.equal(await p.locator('#content-controls button').count(),2);await reachable(p,`${k} saved buttons`);await writeFile(`${out}/saved-${k}.json`,JSON.stringify(await record(p,k),null,2));check(`${k} complete and saved reload`);return s;}
async function departure(p,kind,action,stage){
 const frames=[];if(action)await tap(p,action);
 for(let n=0;n<3;n++){frames.push(await shot(p,`phone-${kind}-stage-${stage+1}-departing-${n+1}`));if(n<2)await tick(p,560);}
 const b=frames.map(s=>kind==='tickets'?s.geometry.train:s.geometry.car);
 const move=Math.hypot(b[2].x-b[0].x,b[2].y-b[0].y),size=Math.max(Math.abs(b[2].width/b[0].width-1),Math.abs(b[2].height/b[0].height-1));assert.ok(move>=100,`${kind} move ${move}`);assert.ok(size<=.1,`${kind} size ${size}`);check(`${kind} stage ${stage+1} continuous departure`,{move,size});await tick(p,700);
}
async function cake(p){
 await enter(p,'cake');await reachable(p,'cake controls');const captures=new Set(),turnStarts={};let held='';
 for(let stage=0;stage<3;stage++){
  for(let n=0;n<3500;n++){
   const phase=await p.locator('#content-r1').getAttribute('data-phase');if(phase!=='playing')break;
   const d=await diag(p),side=d.inBend==='true'?(+d.bend<0?'left':'right'):'',id=d.cue;
   if(stage===1&&side&&!captures.has(side+'-ready')&&id===side){
    if(held){await p.mouse.up();held='';await tick(p,96);}
    await until(p,d=>Math.abs(+d.balanceLean)<3);const before=await shot(p,`phone-cake-stage-2-${side}-ready`);assert.equal(before.controls.filter(x=>x.needed==='true').length,1);assert.equal(before.controls.find(x=>x.needed==='true').id,side);captures.add(side+'-ready');turnStarts[side]=before.geometry.car;
    if(side==='left'){
     const distance=+(await diag(p)).distance;await down(p,'right');await tick(p,350);const wrong=await shot(p,'phone-cake-stage-2-wrong-turn');assert.equal(+wrong.state.distance,distance);assert.ok(Math.abs(+wrong.state.balanceLean)>=12);await p.mouse.up();await tick(p,3500);check('wrong turn has no progress and recovers after release');
    }
   }
   if(stage===1&&side&&!captures.has(side+'-driving')&&d.inBend==='true'&&Math.abs(+d.balanceLean)>12&&held===side){
    const s=await shot(p,`phone-cake-stage-2-${side}-driving`);assert.equal(s.geometry.mini,s.geometry.large);const move=Math.hypot(s.geometry.car.x-turnStarts[side].x,s.geometry.car.y-turnStarts[side].y);assert.ok(move>=15,side+' visible turn movement '+move);check(side+' turn moves car visibly with matching cake angles',{move});assert.ok(+d.balanceLean*(side==='left'?1:-1)>12);captures.add(side+'-driving');await p.mouse.up();held='';await tick(p,2200);await shot(p,`phone-cake-stage-2-${side}-recovered`);captures.add(side+'-recovered');
   }
   if(stage===2&&d.bayStopped==='true'&&!captures.has('bay')){await p.mouse.up();held='';await shot(p,'phone-cake-stage-3-bay-stopped');captures.add('bay');}
   if(stage===2&&d.bayRestarted==='true'&&!captures.has('restart')){await shot(p,'phone-cake-stage-3-bay-restarted');captures.add('restart');}
   const next=(await diag(p)).cue;
   if(next!==held){if(held)await p.mouse.up();held='';if(next){await down(p,next);held=next;}}
   if(stage===0&&n===8)await shot(p,'phone-cake-stage-1-driving');
   if(d.hazard==='true'&&!captures.has('hazard')){await shot(p,'phone-cake-tray-edge-stop');captures.add('hazard');}
   await tick(p,144);
  }
  if(held){await p.mouse.up();held='';}
  assert.equal(await p.locator('#content-r1').getAttribute('data-phase'),'delivering');await departure(p,'cake',null,stage);assert.equal(await p.locator('#content-r1').getAttribute('data-phase'),stage===2?'done':'checkpoint');check(`cake stage ${stage+1} driven with real controls`);if(stage<2)await tap(p,'next');
 }
 for(const id of ['left-driving','right-driving','left-recovered','right-recovered','bay','restart'])assert.ok(captures.has(id),id);
 await saved(p,'cake');
}
async function crossing(p){
 await enter(p,'crossing');
 for(let stage=0;stage<3;stage++){
  await hold(p,'brake',1500);await shot(p,`phone-crossing-stage-${stage+1}-start`);
  for(let n=0;n<3;n++){
   let d=await diag(p);assert.equal(d.lookedLeft,'false');assert.equal(d.lookedRight,'false');assert.equal(d.crossTime,'0.000');const who=d.person;
   await tick(p,700);assert.equal((await diag(p)).crossed,String(n));await tap(p,'look-left');await shot(p,`phone-crossing-stage-${stage+1}-${who}-look-left`);await tick(p,400);assert.equal((await diag(p)).crossTime,'0.000');assert.equal(await a(p,'depart').isDisabled(),true);
   await tap(p,'look-right');await shot(p,`phone-crossing-stage-${stage+1}-${who}-look-right`);
   if(n===0){assert.equal((await diag(p)).trafficActive,'true');assert.equal((await diag(p)).crossTime,'0.000');assert.equal(await a(p,'depart').innerText(),'正在等來車');await shot(p,`phone-crossing-stage-${stage+1}-traffic`);await until(p,d=>d.trafficActive==='false');await shot(p,`phone-crossing-stage-${stage+1}-ready-cross`);}
   for(const [i,lo] of [[1,.23],[2,.52],[3,.88]]){await until(p,d=>+d.crossTime/+d.crossDuration>=lo,10000,32);const s=await shot(p,`phone-crossing-stage-${stage+1}-${who}-moving-${i}`);assert.equal(s.state.crossed,String(n));assert.equal(s.controls.find(x=>x.id==='depart').text,'正在過街');}
   await until(p,d=>+d.crossed===n+1,10000,32);const s=await shot(p,`phone-crossing-stage-${stage+1}-${who}-arrived`);assert.equal(s.state.crossed,String(n+1));check(`crossing stage ${stage+1} ${who}: individual left/right, one arrival`);
  }
  await reachable(p,`crossing stage ${stage+1} departure controls`);await shot(p,`phone-crossing-stage-${stage+1}-ready-depart`);await departure(p,'crossing','depart',stage);if(stage<2)await tap(p,'next');
 }
 assert.equal((await record(p,'crossing')).facts.leftViews,9);assert.equal((await record(p,'crossing')).facts.rightViews,9);await saved(p,'crossing');
}
async function arrive(p,stage,wrong=false){
 const name=['藍圓形','橘三角形','綠正方形'][stage];const target=p.getByRole('button',{name:name+'月台',exact:true});if(wrong){const i=await target.getAttribute('data-platform');await p.locator(`[data-platform="${(+i+1)%3}"]`).click();}else await target.click();await hold(p,'go',5800);await hold(p,'brake',1700);
}
async function tickets(p){
 await enter(p,'tickets');const correct=[];
 for(let stage=0;stage<3;stage++){
  await arrive(p,stage,true);await shot(p,`phone-tickets-stage-${stage+1}-wrong`);assert.equal(await a(p,'door').isDisabled(),true);await arrive(p,stage);correct.push(await p.locator('[data-platform][data-arrived=true]').getAttribute('data-platform'));await shot(p,`phone-tickets-stage-${stage+1}-stopped`);await tap(p,'door');await until(p,d=>d.doorStage==='awaiting');
  for(let n=0;n<3;n++){
   const before=await shot(p,`phone-tickets-stage-${stage+1}-invite-${n+1}`),t=before.state.boardTime;await tick(p,1600);assert.equal((await diag(p)).boardTime,t);await reachable(p,`tickets stage ${stage+1} invitation ${n+1}`);await tap(p,'board');await tick(p,360);const start=await shot(p,`phone-tickets-stage-${stage+1}-boarding-${n+1}-1`);assert.equal(start.geometry.counts,`月台 ${3-n} 人\n車內 ${n} 人`);
   await tick(p,300);await shot(p,`phone-tickets-stage-${stage+1}-boarding-${n+1}-2`);await until(p,d=>['awaiting','retract-ready'].includes(d.doorStage));const end=await shot(p,`phone-tickets-stage-${stage+1}-seated-${n+1}`);assert.equal(end.geometry.counts,`月台 ${2-n} 人\n車內 ${n+1} 人`);check(`tickets stage ${stage+1}: one invitation only moves rider ${n+1}`);
  }
  await tap(p,'retract');await tick(p,200);await shot(p,`phone-tickets-stage-${stage+1}-retracting`);await until(p,d=>d.doorStage==='close-ready');await shot(p,`phone-tickets-stage-${stage+1}-close-ready`);await tap(p,'close-door');await tick(p,250);await shot(p,`phone-tickets-stage-${stage+1}-closing`);await until(p,d=>d.doorStage==='closed');await shot(p,`phone-tickets-stage-${stage+1}-closed`);await departure(p,'tickets','train-depart',stage);if(stage<2)await tap(p,'next');
 }
 assert.ok(new Set(correct).size>=2);await saved(p,'tickets');await tap(p,'replay');await tap(p,'begin');const second=await p.getByRole('button',{name:'藍圓形月台',exact:true}).getAttribute('data-platform');assert.notEqual(second,correct[0]);await shot(p,'phone-tickets-replay-layout');check('three station slots vary and replay changes layout',{first:correct,second});
}
async function matrix(){for(const [w,h] of [[320,568],[568,320],[390,844],[844,390],[768,1024],[1024,768],[1366,600],[1280,640]]){const {c,p}=await make(w,h);try{for(const kind of ['cake','crossing','tickets']){await enter(p,kind);await reachable(p,`${w}x${h} ${kind} controls`);await shot(p,`device-${w}x${h}-${kind}`);if(kind==='tickets'){await arrive(p,0);await tap(p,'door');await until(p,d=>d.doorStage==='awaiting');await reachable(p,`${w}x${h} invitation`);await shot(p,`device-${w}x${h}-tickets-invite`);}await p.locator('#content-back').click();}}finally{await c.close();}}}
async function negatives(){
 const {c,p}=await make();try{
  await enter(p,'cake');await down(p,'go');await until(p,d=>d.inBend==='true');
  const ready=await shot(p,'phone-cake-bend-pedal-held');assert.equal(ready.controls.find(x=>x.id==='go').color,'rgb(20, 121, 184)');assert.equal(ready.controls.filter(x=>x.needed==='true').length,1);await p.mouse.up();await tick(p,2400);
  await down(p,'right');await until(p,d=>d.hazard==='true');await shot(p,'phone-cake-tray-edge-sliding');await tick(p,1800);const stopped=await shot(p,'phone-cake-tray-edge-stopped');assert.equal(stopped.state.speed,'0.00');const distance=stopped.state.distance;await tick(p,1000);assert.equal((await diag(p)).distance,distance);await p.mouse.up();await tick(p,3000);const recovered=await shot(p,'phone-cake-tray-edge-recovered');assert.equal(recovered.state.hazard,'false');assert.ok(Math.abs(+recovered.state.balanceLean)<3);check('held direction slides to edge, slows to zero, release is required');
  await p.locator('#content-pause').click();const paused=await diag(p);await tick(p,3000);assert.deepEqual(await diag(p),paused);await p.locator('#content-resume').click();await tick(p,96);await p.locator('#content-back').click();
  await p.emulateMedia({reducedMotion:'reduce'});await enter(p,'crossing');await hold(p,'brake',1500);await tap(p,'look-left');await tap(p,'look-right');await until(p,d=>+d.crossTime>0);assert.equal(await p.locator('.content-walker').getAttribute('data-pose'),'0');await shot(p,'phone-crossing-reduced-motion');check('pause preserves state and reduced motion preserves crossing');
 }finally{await c.close();}
 const fresh=await make();try{const {p}=fresh;await p.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('denied','QuotaExceededError');};});await enter(p,'crossing');await hold(p,'brake',1500);await tap(p,'look-left');await tap(p,'look-right');await until(p,d=>+d.crossed===1);await p.locator('#content-pause').click();assert.match(await p.locator('#content-save').textContent(),/無法儲存/);await p.locator('#content-resume').click();await shot(p,'phone-crossing-storage-denied');check('denied storage is explicit and play can continue');}finally{await fresh.c.close();}
}
let status='EXECUTED';
try{
 if(['cake','crossing','tickets','all'].includes(scope)){const {c,p}=await make();try{for(const k of ['cake','crossing','tickets'].filter(k=>scope==='all'||scope===k)){if(k==='cake')await cake(p);if(k==='crossing')await crossing(p);if(k==='tickets')await tickets(p);await p.locator('#content-back').click();}}finally{await c.close();}}
 if(scope==='matrix'||scope==='all')await matrix();
 if(scope==='negative')await negatives();
 if(scope==='state'){const {c,p}=await make();try{await enter(p,'tickets');await arrive(p,0);await tap(p,'door');assert.equal((await diag(p)).doorStage,'opening');assert.equal(await a(p,'status').innerText(),'正在開門');await shot(p,'phone-tickets-opening-state');await until(p,d=>d.doorStage==='awaiting');assert.match(await a(p,'board').innerText(),/請小安上車/);check('opening status and next passenger use the same boarding state');}finally{await c.close();}}
 if(scope==='offline'){const {c,p}=await make();try{await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForFunction(async()=>{const cache=await caches.open((await caches.keys()).find(k=>k.startsWith('island-transport-')));return (await cache.keys()).length>=233;});await c.setOffline(true);await p.reload();for(const k of ['cake','crossing','tickets']){if(k==='cake')await cake(p);if(k==='crossing')await crossing(p);if(k==='tickets')await tickets(p);await p.locator('#content-back').click();}check('all three lessons complete and reload without network');}finally{await c.close();}}
 if(scope==='store'){const folder='docs/store/screenshots/content-r15';await mkdir(folder,{recursive:true});for(const [w,h,dpr] of [[430,932,3],[1032,1376,2]]){const {c,p}=await make(w,h,dpr);try{await enter(p,'tickets');await arrive(p,0);await tap(p,'door');await until(p,d=>d.doorStage==='awaiting');await tap(p,'board');await tick(p,550);await shot(p,`tickets-player-boarding-${w*dpr}x${h*dpr}`,folder);}finally{await c.close();}}}
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert.deepEqual(http,[]);status='VERIFIED';
}finally{await browser.close();await writeFile(`${out}/browser-${scope}.json`,JSON.stringify({status,rows,shots,errors,external,http},null,2));}
