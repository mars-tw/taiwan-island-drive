// Public UI only. Playwright's clock drives the real RAF/timers; no game-state
// assignment, completion flags, screenshot pixel edits, or artificial saves.
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE||'C:/Users/digimkt/Desktop/遊戲/storm-apocalypse/node_modules/playwright/index.mjs').href);
const base=process.env.BASE_URL||'http://127.0.0.1:5286/',out=process.env.R18_OUT||'docs/content/r18',scope=process.env.R18_SCOPE||'all';
await mkdir(out,{recursive:true});const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']});
const rows=[],shots=[],errors=[],external=[],http=[];
const a=(p,id)=>p.locator(`[data-action="${id}"]`),diag=p=>p.locator('.content-scene').evaluate(e=>({...e.dataset}));
const check=(label,detail={})=>{rows.push({label,status:'VERIFIED',...detail});console.log('VERIFIED '+label);};
const tick=(p,ms)=>p.clock.runFor(ms);
async function make(width=+(process.env.R18_WIDTH||390),height=+(process.env.R18_HEIGHT||844),dpr=1){const c=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,hasTouch:true});const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(/^https?:/.test(r.url())&&new URL(r.url()).origin!==new URL(base).origin)external.push(r.url());});p.on('response',r=>{if(r.status()>=400)http.push({url:r.url(),status:r.status()});});await p.clock.install();await p.goto(base);await p.locator('#content-start').waitFor();await p.clock.pauseAt(await p.evaluate(()=>Date.now()+100));return {c,p};}
async function tap(p,id){if(id==='board'&&p.viewportSize().width===390&&p.viewportSize().height===844&&(await diag(p)).boardingIndex==='0'){const stage=+(await p.locator('#content-r1').getAttribute('data-stage'))+1;await shot(p,`phone-tickets-stage-${stage}-chosen`);}await a(p,id).click();await tick(p,96);}
async function enter(p,k){await p.locator('#content-start').click();await p.locator(`[data-content=${k}]`).click();await shot(p,`device-${p.viewportSize().width}x${p.viewportSize().height}-${k}-ready`);await tap(p,'begin');}
async function hold(p,id,ms){const b=await a(p,id).boundingBox();await p.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.mouse.down();await tick(p,ms);await p.mouse.up();await tick(p,96);}
async function down(p,id){const b=await a(p,id).boundingBox();await p.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.mouse.down();}
async function until(p,fn,limit=30000,step=96){for(let t=0;t<limit;t+=step){if(fn(await diag(p)))return;await tick(p,step);}throw Error('Timed out '+JSON.stringify(await diag(p)));}
async function geometry(p){return p.locator('.content-scene').evaluate(e=>{const r=x=>{if(!x)return null;const b=x.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,right:b.right,bottom:b.bottom};};return {scene:r(e),car:r(e.querySelector(document.querySelector('#content-r1').dataset.kind==='crossing'?'.content-coach':'.content-car')),carrier:r(e.querySelector('.content-carrier')),train:r(e.querySelector('.ticket-vehicle')),door:r(e.querySelector('.ticket-door')),signs:[...e.querySelectorAll('[data-platform]')].map(x=>({id:x.dataset.platform,text:x.innerText,box:r(x)})),people:[...e.querySelectorAll('.boarding-friend,.ticket-seated,.content-walker:not([hidden]),.crossing-arrived>div,.crossing-waiting>div')].filter(x=>x.getClientRects().length).map(x=>({id:x.dataset.friend||x.dataset.person||x.dataset.waiting||x.dataset.arrivedFriend,kind:x.className||x.parentElement.className,box:r(x)})),labels:[...e.querySelectorAll('.content-scene-cue,.ticket-counts span,.boarding-friend>b,.content-stations button>span')].filter(x=>x.getClientRects().length&&x.textContent.trim()).map(x=>({text:x.textContent,box:r(x),clipped:x.scrollWidth>x.clientWidth+1})),look:e.querySelector('.driver-view').innerHTML,panorama:getComputedStyle(e.querySelector('.crossing-panorama'),'::before').transform,road:getComputedStyle(e.querySelector('.cake-road-view')).getPropertyValue('--road-travel'),counts:e.querySelector('.ticket-counts').innerText,queue:e.querySelector('.ticket-queue-path').innerHTML,mini:e.querySelector('.cake-miniature .cake-rigid').style.transform,large:e.querySelector('.cake-closeup .cake-rigid').style.transform,meter:e.querySelector('[role=meter]')?.getAttribute('aria-valuenow'),route:e.querySelectorAll('.content-route i.complete').length,controls:r(document.querySelector('#content-controls')),trainSource:e.querySelector('.content-train').getAttribute('src')};});}
async function shot(p,name,folder=out){await p.evaluate(async()=>Promise.all([...document.images].filter(i=>i.getClientRects().length).map(i=>i.decode().catch(()=>{}))));const path=`${folder}/${name}.png`;await p.screenshot({path});const b=await readFile(path),s={path,width:b.readUInt32BE(16),height:b.readUInt32BE(20),sha256:createHash('sha256').update(b).digest('hex'),state:await diag(p),phase:await p.locator('#content-r1').getAttribute('data-phase'),hint:await p.locator('#content-hint').innerText(),controls:await p.locator('#content-controls button').evaluateAll(es=>es.map(e=>({id:e.dataset.action,text:e.innerText,needed:e.dataset.needed,held:e.dataset.held,color:getComputedStyle(e).backgroundColor,disabled:e.disabled}))),geometry:await geometry(p),method:'Unmodified headless Chromium PNG; real public UI with Playwright clock controlling RAF/timers; no game state or save assignments',native:false};if(s.phase==='boarding'){const ids=await p.locator('[data-zoom-friend]').evaluateAll(es=>es.map(e=>e.dataset.zoomFriend));assert.ok(ids.every(id=>id===s.state.boardingIndex),'Doorway focus must remain on the invited passenger');}await regression(p,s);await screenContracts(p,s);shots.push(s);return s;}
async function regression(p,s){
 const kind=await p.locator('#content-r1').getAttribute('data-kind');
 const proof=await p.locator('.content-scene').evaluate(e=>{
  const r=x=>{if(!x||!x.getClientRects().length)return null;const b=x.getBoundingClientRect();return {x:b.x,y:b.y,right:b.right,bottom:b.bottom,width:b.width,height:b.height};};
  const visible=x=>!!x&&getComputedStyle(x).display!=='none'&&!x.hidden&&x.getClientRects().length;
  return {traffic:visible(e.querySelector('.crossing-traffic'))?r(e.querySelector('.crossing-traffic')):null,
   trafficLabel:visible(e.querySelector('.crossing-traffic'))?r(e.querySelector('.crossing-traffic b')):null,
   ellipse:e.querySelector('.driver-view ellipse')?{x:+e.querySelector('ellipse').getAttribute('cx'),y:+e.querySelector('ellipse').getAttribute('cy'),rx:13,ry:7}:null,
   labels:[...e.querySelectorAll('.friend-number')].filter(visible).map(x=>({text:x.textContent,box:r(x)})),
   riders:[...e.querySelectorAll('.boarding-friend')].filter(visible).map(x=>({id:x.dataset.friend,box:r(x),image:r(x.querySelector('img')),entering:x.dataset.entering,clip:getComputedStyle(x).clipPath})),
   playerSource:e.querySelector('.content-coach').getAttribute('src'),playerCount:[e.querySelector('.content-coach'),e.querySelector('.content-carrier')].filter(visible).length,
   turn:getComputedStyle(e.querySelector('.content-car')).transform,zoomVisible:visible(e.querySelector('.ticket-closeup'))};
 });
 const overlap=(a,b)=>Math.min(a.right,b.right)>Math.max(a.x,b.x)+.1&&Math.min(a.bottom,b.bottom)>Math.max(a.y,b.y)+.1;
 if(kind==='crossing'&&s.phase==='playing'){
  for(let i=0;i<s.geometry.people.length;i++)for(let j=i+1;j<s.geometry.people.length;j++)assert.equal(overlap(s.geometry.people[i].box,s.geometry.people[j].box),false,'waiting, walking and arrived people never overlap');
  for(const label of proof.labels)assert.ok(label.box.x>=s.geometry.scene.x+2&&label.box.right<=s.geometry.scene.right-2&&label.box.bottom<=s.geometry.scene.bottom-2,'friend label remains fully inside scene');
  for(let i=0;i<proof.labels.length;i++)for(let j=i+1;j<proof.labels.length;j++)assert.equal(overlap(proof.labels[i].box,proof.labels[j].box),false,'friend names never overlap');
  assert.equal(proof.playerCount,1,'exactly one player vehicle');assert.match(proof.playerSource,/car-rear/);
  if(+s.state.crossTime>0)assert.equal(proof.ellipse,null,'walking hides observation');
  if(proof.traffic){for(const person of s.geometry.people)assert.equal(overlap(proof.traffic,person.box),false,'traffic never overlaps a person');
   const top=(proof.traffic.y-s.geometry.scene.y)/s.geometry.scene.height,bottom=(proof.traffic.bottom-s.geometry.scene.y)/s.geometry.scene.height;
   assert.ok(top>=.25&&bottom<=.41,'traffic stays on horizontal asphalt');}
  if(proof.ellipse){const e=proof.ellipse,b=s.geometry.scene,box={x:b.x+(e.x-e.rx)/100*b.width,right:b.x+(e.x+e.rx)/100*b.width,y:b.y+(e.y-e.ry)/100*b.height,bottom:b.y+(e.y+e.ry)/100*b.height};for(const label of proof.labels)assert.equal(overlap(box,label.box),false,'observation never cuts a friend name');if(proof.trafficLabel)assert.equal(overlap(box,proof.trafficLabel),false,'observation never crosses traffic label');}
 }
 if(kind==='tickets'){
  assert.equal(proof.zoomVisible,false,'no duplicate inset passengers');assert.equal(new Set(s.geometry.people.map(x=>x.id)).size,s.geometry.people.length,'one physical person per identity');
  const door=s.geometry.door;for(const rider of proof.riders){assert.ok(door.height>=rider.image.height*1.1-.5,'door is taller than a child');if(rider.entering==='true')assert.notEqual(rider.clip,'none');}
  if(s.path.endsWith('-wrong.png'))for(const rider of proof.riders)assert.equal(overlap(rider.image,s.geometry.train),false,'wrong-stop friends stay clear of train');
 }
 s.regression=proof;
}
async function screenContracts(p,s){
 const proof=await p.locator('#content-r1').evaluate(root=>{
  const visible=e=>{for(let p=e;p;p=p.parentElement){const c=getComputedStyle(p);if(p.hidden||c.display==='none'||c.visibility==='hidden')return false;}return e.getClientRects().length>0;};
  const rect=r=>({x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height});
  const failures=[],texts=[],walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  while(walker.nextNode()){
   const n=walker.currentNode,e=n.parentElement;if(!n.textContent.trim()||!visible(e)||e.closest('svg'))continue;
   const range=document.createRange();range.selectNodeContents(n);
   for(const r of range.getClientRects()){
    if(!r.width||!r.height)continue;texts.push({text:n.textContent,box:rect(r)});
    for(let a=e;a&&a!==document.body;a=a.parentElement){
     const c=getComputedStyle(a),b=a.getBoundingClientRect();
     const clipsX=['hidden','clip','auto','scroll'].includes(c.overflowX),clipsY=['hidden','clip','auto','scroll'].includes(c.overflowY);
     if(clipsX&&(r.x<b.x-1||r.right>b.right+1)||clipsY&&(r.y<b.y-1||r.bottom>b.bottom+1))failures.push({text:n.textContent,ancestor:a.className||a.id,style:e.closest('.cake-timing')?{top:getComputedStyle(e.closest('.cake-timing')).top,translate:getComputedStyle(e.closest('.cake-timing')).translate,transform:getComputedStyle(e.closest('.cake-timing')).transform}:null,box:rect(r),clip:rect(b)});
    }
    if(r.x<-.5||r.right>innerWidth+.5||r.y<-.5||r.bottom>innerHeight+.5)failures.push({text:n.textContent,reason:'outside viewport',box:rect(r)});
   }
  }
  const selectors='.content-scene-cue,.content-observe,.crossing-lookout,.crossing-traffic b,.friend-number,.ticket-counts span,.content-stations button,.boarding-friend>b,.cake-timing b,.cake-recovery,.force-readout';
  const labels=[...root.querySelectorAll(selectors)].filter(e=>visible(e)&&e.textContent.trim()).map(e=>({text:e.innerText,box:rect(e.getBoundingClientRect())}));
  const overlaps=[];
  for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){const a=labels[i],b=labels[j];if(Math.min(a.box.right,b.box.right)>Math.max(a.box.x,b.box.x)+.5&&Math.min(a.box.bottom,b.box.bottom)>Math.max(a.box.y,b.box.y)+.5)overlaps.push([a.text,b.text]);}
  return {failures,overlaps,textCount:texts.length,labels,stageDots:root.querySelectorAll('.content-route i.complete').length,progress:root.querySelector('.content-observe').innerText};
 });
 s.screenContract=proof;
 if(await p.locator('#content-r1').getAttribute('data-kind')==='tickets'&&s.geometry.counts){const nums=[...s.geometry.counts.matchAll(/(\d) 人/g)].map(x=>+x[1]);assert.equal(nums.reduce((n,x)=>n+x,0),3,'platform + boarding + seated = three distinct friends');const seated=await p.locator('.ticket-seated[data-entering=false]').count();assert.match(s.geometry.counts,new RegExp('已入座 '+seated+' 人'));}
 assert.deepEqual(proof.failures,[],s.path+' text clipping');assert.deepEqual(proof.overlaps,[],s.path+' label overlaps');
 if(await p.locator('#content-r1').getAttribute('data-kind')==='crossing'){
  const count=Number(proof.progress.match(/路口完成 (\d)/)?.[1]||0);assert.equal(proof.stageDots,count,s.path+' station count/dots');
 }
}
async function reachable(p,label){const covered=await p.locator('.ticket-closeup').evaluate(z=>{if(z.hidden||!z.getClientRects().length)return [];const a=z.getBoundingClientRect();return [...document.querySelectorAll('[data-platform]')].filter(e=>{const b=e.getBoundingClientRect();return Math.min(a.right,b.right)-Math.max(a.x,b.x)>.1&&Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y)>.1;}).map(e=>e.innerText);});assert.deepEqual(covered,[],'Magnifier must leave all platform cards visible');const bad=await p.locator('#content-r1 button').evaluateAll(es=>es.filter(e=>e.getClientRects().length&&!e.disabled).map(e=>{const r=e.getBoundingClientRect(),pts=[[r.x+r.width/2,r.y+r.height/2],[r.x+3,r.y+3],[r.right-3,r.bottom-3]];return {id:e.id||e.dataset.action||e.dataset.platform||e.dataset.content,width:r.width,height:r.height,hits:pts.map(([x,y])=>document.elementFromPoint(x,y)?.outerHTML.slice(0,140)),bad:r.width<59.8||r.height<59.8||r.x<-.5||r.y<-.5||r.right>innerWidth+.5||r.bottom>innerHeight+.5||pts.some(([x,y])=>{const h=document.elementFromPoint(x,y);return h!==e&&!e.contains(h);})};}));assert.ok(bad.length);if(bad.some(x=>x.bad))await shot(p,'failed-'+label.replace(/[^a-z0-9-]/gi,'-'));assert.deepEqual(bad.filter(x=>x.bad),[],label);assert.doesNotMatch(await p.locator('#content-r1').innerText(),/WASD|方向鍵|空白鍵|鍵盤/);check(label,{controls:bad.length});}
const record=(p,k)=>p.evaluate(k=>JSON.parse(localStorage.getItem('island-transport:student:v2')).sections.contentR1[k],k);
async function saved(p,k){assert.equal((await record(p,k)).completed,true);await shot(p,`phone-${k}-complete`);await p.locator('#content-back').click();await p.reload();await p.locator('#content-start').click();await p.locator(`[data-content=${k}]`).click();assert.equal(await p.locator('#content-r1').getAttribute('data-phase'),'done');const s=await shot(p,`phone-${k}-saved-result`);assert.equal(await p.locator('.lesson-route-proof>div').count(),3);assert.equal(await p.locator('#content-controls button').count(),2);await reachable(p,`${k} saved buttons`);await writeFile(`${out}/saved-${k}.json`,JSON.stringify(await record(p,k),null,2));check(`${k} complete and saved reload`);return s;}
async function departure(p,kind,action,stage){
 const frames=[];if(action)await tap(p,action);
 for(let n=0;n<3;n++){frames.push(await shot(p,`phone-${kind}-stage-${stage+1}-departing-${n+1}`));if(n<2)await tick(p,560);}
 const b=frames.map(s=>kind==='tickets'?s.geometry.train:s.geometry.car);
 const move=Math.hypot(b[2].x-b[0].x,b[2].y-b[0].y),size=Math.max(Math.abs(b[2].width/b[0].width-1),Math.abs(b[2].height/b[0].height-1));assert.ok(move>=100,`${kind} move ${move}`);assert.ok(size<=.1,`${kind} size ${size}`);check(`${kind} stage ${stage+1} continuous departure`,{move,size});await tick(p,700);await shot(p,`phone-${kind}-stage-${stage+1}-checkpoint`);
}
async function cake(p){
 await enter(p,'cake');await shot(p,'phone-cake-first-start');await reachable(p,'cake controls');const captures=new Set(),turnStarts={};let held='';
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
   if(stage===1&&side&&!captures.has(side+'-half-second')&&held===side){await tick(p,500);const s=await shot(p,`phone-cake-stage-2-${side}-half-second`);assert.equal(await p.locator('.force-meter').getAttribute('data-tone'),'green');captures.add(side+'-half-second');}
   if(stage===1&&side&&!captures.has(side+'-driving')&&d.inBend==='true'&&Math.abs(+d.balanceLean)>3&&held===side){
    const s=await shot(p,`phone-cake-stage-2-${side}-driving`);assert.equal(await p.locator('.force-meter').getAttribute('data-tone'),'green');assert.doesNotMatch(await p.locator('.force-readout').innerText(),/蛋糕歪了|回穩 \d+ 次/);assert.equal(s.geometry.mini,s.geometry.large);const move=Math.hypot(s.geometry.car.x-turnStarts[side].x,s.geometry.car.y-turnStarts[side].y);assert.ok(move>=1,side+' visible turn movement '+move);check(side+' turn moves car visibly with matching cake angles',{move});assert.ok(+d.balanceLean*(side==='left'?1:-1)>3);captures.add(side+'-driving');await p.mouse.up();held='';await tick(p,2200);await shot(p,`phone-cake-stage-2-${side}-recovered`);captures.add(side+'-recovered');
   }
   if(stage===2&&d.bayStopped==='true'&&!captures.has('bay')){await p.mouse.up();held='';await shot(p,'phone-cake-stage-3-bay-stopped');captures.add('bay');}
   if(stage===2&&d.bayRestarted==='true'&&!captures.has('restart')){await shot(p,'phone-cake-stage-3-bay-restarted');captures.add('restart');}
   const next=(await diag(p)).cue;
   if(next!==held){if(held)await p.mouse.up();held='';if(next){await down(p,next);held=next;}}
   if(stage===0&&n===8)await shot(p,'phone-cake-stage-1-driving');if(stage===0&&side&&!captures.has('first-bend')){await shot(p,'phone-cake-first-bend');captures.add('first-bend');}
   if(d.hazard==='true'&&!captures.has('hazard')){await shot(p,'phone-cake-tray-edge-stop');captures.add('hazard');}
   await tick(p,144);
  }
  if(held){await p.mouse.up();held='';}
  assert.equal(await p.locator('#content-r1').getAttribute('data-phase'),'delivering');await departure(p,'cake',null,stage);assert.equal(await p.locator('#content-r1').getAttribute('data-phase'),stage===2?'done':'checkpoint');check(`cake stage ${stage+1} driven with real controls`);if(stage<2)await tap(p,'next');
 }
 for(const id of ['left-driving','right-driving','left-recovered','right-recovered','bay','restart'])assert.ok(captures.has(id),id);
 await saved(p,'cake');await tap(p,'replay');await tap(p,'begin');await down(p,'go');await until(p,d=>d.inBend==='true');await p.mouse.up();await tick(p,2500);const replay=await shot(p,'phone-cake-replay-bend');assert.equal(replay.state.bend,'-1');const before=+replay.state.distance;await down(p,'right');await tick(p,400);const wrong=await shot(p,'phone-cake-replay-old-direction');assert.equal(+wrong.state.distance,before);await p.mouse.up();check('cake replay swaps first bend and rejects old direction');
}
async function crossing(p){
 await enter(p,'crossing');
 for(let stage=0;stage<3;stage++){
  await hold(p,'brake',1500);const startScene=(await shot(p,`phone-crossing-stage-${stage+1}-start`)).geometry.scene;
  for(let n=0;n<3;n++){
   if(stage===0&&n===0){await tap(p,'look-right');const wrong=await shot(p,'phone-crossing-wrong-side');assert.match(wrong.hint,/先看左/);}let d=await diag(p);assert.equal(d.lookedLeft,'false');assert.equal(d.lookedRight,'false');assert.equal(d.crossTime,'0.000');const who=d.person;
   await tick(p,700);assert.equal((await diag(p)).crossed,String(n));await tap(p,'look-left');await shot(p,`phone-crossing-stage-${stage+1}-${who}-look-left`);if(n===0)await shot(p,`phone-crossing-stage-${stage+1}-traffic-moving-1`);await tick(p,400);if(n===0)await shot(p,`phone-crossing-stage-${stage+1}-traffic-moving-2`);assert.equal((await diag(p)).crossTime,'0.000');assert.equal(await a(p,'depart').isDisabled(),true);
   await tap(p,'look-right');const rightScene=await shot(p,`phone-crossing-stage-${stage+1}-${who}-look-right`);assert.deepEqual(rightScene.geometry.scene,startScene);
   if(n===0){assert.equal((await diag(p)).trafficActive,'true');assert.equal((await diag(p)).crossTime,'0.000');assert.equal(await a(p,'depart').innerText(),'正在等來車');await shot(p,`phone-crossing-stage-${stage+1}-traffic`);await tick(p,400);await shot(p,`phone-crossing-stage-${stage+1}-traffic-moving-3`);if(stage===0){await until(p,d=>+d.trafficTime>=1.9);const seen=await shot(p,'phone-crossing-same-station-right-has-car');assert.match(seen.hint,/右邊有車/);}await until(p,d=>d.trafficActive==='false');await shot(p,`phone-crossing-stage-${stage+1}-ready-cross`);}
   for(const [i,lo] of [[1,.23],[2,.52],[3,.88]]){await until(p,d=>+d.crossTime/+d.crossDuration>=lo,10000,32);const s=await shot(p,`phone-crossing-stage-${stage+1}-${who}-moving-${i}`);assert.equal(s.state.crossed,String(n));assert.equal(s.controls.find(x=>x.id==='depart').text,i===3?'已到岸':'正在過街');if(i===3)assert.match(s.hint,/到了/);}
   await until(p,d=>+d.crossed===n+1,10000,32);const s=await shot(p,`phone-crossing-stage-${stage+1}-${who}-arrived`);assert.equal(s.state.crossed,String(n+1));check(`crossing stage ${stage+1} ${who}: individual left/right, one arrival`);
  }
  await reachable(p,`crossing stage ${stage+1} departure controls`);assert.equal(await p.locator('.content-route i.complete').count(),stage+1);assert.match(await p.locator('.content-observe').innerText(),new RegExp('路口完成 '+(stage+1)+'/3'));await shot(p,`phone-crossing-stage-${stage+1}-ready-depart`);await departure(p,'crossing','depart',stage);if(stage<2)await tap(p,'next');
 }
 assert.equal((await record(p,'crossing')).facts.leftViews,9);assert.equal((await record(p,'crossing')).facts.rightViews,9);await saved(p,'crossing');await tap(p,'replay');await tap(p,'begin');await hold(p,'brake',1500);await tap(p,'look-left');const again=await shot(p,'phone-crossing-replay-traffic');assert.equal(again.state.layoutSeed,'1');check('crossing replay changes car approach direction');
}
async function arrive(p,stage,wrong=false){
 const name=(await diag(p)).targetName;const target=p.getByRole('button',{name:name+'月台',exact:true});if(wrong){const i=await target.getAttribute('data-platform');await p.locator(`[data-platform="${(+i+1)%3}"]`).click();}else await target.click();await hold(p,'go',5800);await hold(p,'brake',1700);
}
async function tickets(p){
 await enter(p,'tickets');const correct=[];await shot(p,'phone-tickets-unselected');assert.equal(await p.locator('[data-arrived=true]').count(),0);assert.equal(await p.locator('[data-platform][data-choose=true]').count(),0);
 for(let stage=0;stage<3;stage++){
  await arrive(p,stage,true);await shot(p,`phone-tickets-stage-${stage+1}-wrong`);assert.equal(await a(p,'door').isDisabled(),true);await arrive(p,stage);correct.push(await p.locator('[data-platform][data-arrived=true]').getAttribute('data-platform'));await shot(p,`phone-tickets-stage-${stage+1}-stopped`);await tap(p,'door');await until(p,d=>d.doorStage==='awaiting');
  for(let n=0;n<3;n++){
   if(stage===0&&n===0){await p.locator('[data-passenger="1"]').click();const wrong=await shot(p,'phone-tickets-wrong-friend');assert.match(wrong.hint,/先上車/);assert.equal((await diag(p)).boardingIndex,'0');}
   const before=await shot(p,`phone-tickets-stage-${stage+1}-invite-${n+1}`),t=before.state.boardTime;await tick(p,1600);assert.equal((await diag(p)).boardTime,t);await reachable(p,`tickets stage ${stage+1} invitation ${n+1}`);await p.locator(`[data-passenger="${(await diag(p)).boardingIndex}"]`).click();await tap(p,'board');await tick(p,360);const start=await shot(p,`phone-tickets-stage-${stage+1}-boarding-${n+1}-1`);assert.equal(start.geometry.counts,`月台 ${2-n} 人\n上車中 1 人\n已入座 ${n} 人`);
   await tick(p,300);await shot(p,`phone-tickets-stage-${stage+1}-boarding-${n+1}-2`);await until(p,d=>['awaiting','retract-ready'].includes(d.doorStage));const end=await shot(p,`phone-tickets-stage-${stage+1}-seated-${n+1}`);assert.equal(end.geometry.counts,`月台 ${2-n} 人\n已入座 ${n+1} 人`);check(`tickets stage ${stage+1}: one invitation only moves rider ${n+1}`);
  }
  await tap(p,'retract');await tick(p,200);await shot(p,`phone-tickets-stage-${stage+1}-retracting`);await until(p,d=>d.doorStage==='close-ready');await shot(p,`phone-tickets-stage-${stage+1}-close-ready`);await tap(p,'close-door');await tick(p,250);await shot(p,`phone-tickets-stage-${stage+1}-closing`);await until(p,d=>d.doorStage==='closed');await shot(p,`phone-tickets-stage-${stage+1}-closed`);await departure(p,'tickets','train-depart',stage);if(stage<2)await tap(p,'next');
 }
 assert.ok(new Set(correct).size>=2);await saved(p,'tickets');await tap(p,'replay');await tap(p,'begin');const second=await p.getByRole('button',{name:(await diag(p)).targetName+'月台',exact:true}).getAttribute('data-platform');assert.notEqual(second,correct[0]);await shot(p,'phone-tickets-replay-layout');await p.locator(`[data-platform="${correct[0]}"]`).click();await hold(p,'go',5800);await hold(p,'brake',1700);const old=await shot(p,'phone-tickets-replay-old-position');assert.match(old.hint,/形狀|顏色/);assert.equal(await a(p,'door').isDisabled(),true);check('three station slots vary and replay changes layout',{first:correct,second});
}
async function matrix(){for(const [w,h] of [[320,568],[568,320],[390,844],[844,390],[768,1024],[1024,768],[1366,600],[1280,640]]){const {c,p}=await make(w,h);try{for(const kind of ['cake','crossing','tickets']){await enter(p,kind);await reachable(p,`${w}x${h} ${kind} controls`);await shot(p,`device-${w}x${h}-${kind}`);if(kind==='tickets'){await arrive(p,0);await tap(p,'door');await until(p,d=>d.doorStage==='awaiting');await reachable(p,`${w}x${h} invitation`);await shot(p,`device-${w}x${h}-tickets-invite`);}await p.locator('#content-back').click();}}finally{await c.close();}}}
async function finishCakeStation(p){
 let held='';for(let n=0;n<3500&&await p.locator('#content-r1').getAttribute('data-phase')==='playing';n++){
  const id=(await diag(p)).cue;if(id!==held){if(held)await p.mouse.up();held='';if(id){await down(p,id);held=id;}}await tick(p,144);
 }
 if(held)await p.mouse.up();assert.equal(await p.locator('#content-r1').getAttribute('data-phase'),'delivering');await tick(p,1700);await tap(p,'next');
}
async function negatives(){
 const {c,p}=await make();try{
  await enter(p,'cake');await finishCakeStation(p);await down(p,'go');await until(p,d=>d.inBend==='true');
  const ready=await shot(p,'phone-cake-bend-pedal-held');assert.equal(ready.controls.find(x=>x.id==='go').color,'rgb(255, 211, 68)');assert.equal(ready.controls.filter(x=>x.needed==='true').length,1);await p.mouse.up();await tick(p,2400);
  const wrongStart=(await diag(p)).distance;await down(p,(await diag(p)).bend==='1'?'left':'right');await tick(p,2200);const wrongHeld=await shot(p,'phone-cake-long-wrong-held');assert.match(wrongHeld.hint,/方向相反/);assert.equal(wrongHeld.state.distance,wrongStart);assert.equal(wrongHeld.state.wrongTurn,'true');await p.mouse.up();await tick(p,3000);await down(p,(await diag(p)).bend==='1'?'right':'left');await tick(p,500);await shot(p,'phone-cake-positive-half-second');assert.equal(await p.locator('.force-meter').getAttribute('data-tone'),'green');await until(p,d=>d.hazard==='true');const edge=await shot(p,'phone-cake-tray-edge-sliding');assert.ok(edge.controls.filter(b=>['left','right','go'].includes(b.id)).every(b=>b.held==='false')); const roadMove=Math.abs(parseFloat(edge.geometry.road)-parseFloat(ready.geometry.road));assert.ok(roadMove>=40,`road landmark move ${roadMove}`);await p.mouse.up();await tick(p,600);await shot(p,'phone-cake-tray-edge-recovering');await tick(p,1200);const stopped=await shot(p,'phone-cake-tray-edge-stopped');assert.equal(stopped.state.speed,'0.00');await p.mouse.up();await tick(p,3000);const recovered=await shot(p,'phone-cake-tray-edge-recovered');assert.equal(recovered.state.hazard,'false');assert.ok(Math.abs(+recovered.state.balanceLean)<3);check('held direction slides to edge, slows to zero, release is required',{roadMove});
  await p.locator('#content-pause').click();const paused=await diag(p);await tick(p,3000);assert.deepEqual(await diag(p),paused);await p.locator('#content-resume').click();await tick(p,96);await p.locator('#content-back').click();
  await p.emulateMedia({reducedMotion:'reduce'});await enter(p,'crossing');await hold(p,'brake',1500);await tap(p,'look-left');await tap(p,'look-right');await until(p,d=>+d.crossTime>0);assert.equal(await p.locator('.content-walker').getAttribute('data-pose'),'0');await shot(p,'phone-crossing-reduced-motion');check('pause preserves state and reduced motion preserves crossing');
 }finally{await c.close();}
 const fresh=await make();try{const {p}=fresh;await p.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('denied','QuotaExceededError');};});await enter(p,'crossing');await hold(p,'brake',1500);await tap(p,'look-left');await tap(p,'look-right');await until(p,d=>+d.crossed===1);await p.locator('#content-pause').click();assert.match(await p.locator('#content-save').textContent(),/無法儲存/);await p.locator('#content-resume').click();await shot(p,'phone-crossing-storage-denied');check('denied storage is explicit and play can continue');}finally{await fresh.c.close();}
}
async function layoutProof(){
 for(const [w,h] of [[320,568],[390,844],[568,320]]){
  const {c,p}=await make(w,h);try{
   await enter(p,'tickets');
   for(let stage=0;stage<3;stage++){
    await arrive(p,stage);await arrive(p,stage,true);await shot(p,`device-${w}x${h}-tickets-stage-${stage+1}-wrong`);await arrive(p,stage);const s=await shot(p,`${w===390?'phone':'device-'+w+'x'+h}-tickets-stage-${stage+1}-labels`);
    const labels=s.geometry.labels;assert.ok(labels.some(x=>x.text.includes('第 '+(stage+1)+' 站')));
    for(let i=0;i<labels.length;i++){const a=labels[i];assert.equal(a.clipped,false,a.text);for(let j=i+1;j<labels.length;j++){const b=labels[j];assert.ok(a.box.right<=b.box.x||b.box.right<=a.box.x||a.box.bottom<=b.box.y||b.box.bottom<=a.box.y,`${w} labels overlap: ${a.text}/${b.text}`);}}
    await tap(p,'door');await until(p,d=>d.doorStage==='awaiting');await reachable(p,`${w}x${h} scene passenger choice stage ${stage+1}`);
    for(let n=0;n<3;n++){await p.locator(`[data-passenger="${n}"]`).click();await tap(p,'board');await until(p,d=>['awaiting','retract-ready'].includes(d.doorStage));}
    await tap(p,'retract');await until(p,d=>d.doorStage==='close-ready');await tap(p,'close-door');await until(p,d=>d.doorStage==='closed');await tap(p,'train-depart');await tick(p,1600);if(stage<2)await tap(p,'next');
   }
   check(`${w}x${h} three station labels complete and pairwise nonoverlapping`);
  }finally{await c.close();}
 }
}
let status='EXECUTED';
try{
 if(scope==='layout')await layoutProof();
 if(['cake','crossing','tickets','all','journeys'].includes(scope)){const {c,p}=await make();try{for(const k of ['cake','crossing','tickets'].filter(k=>scope==='all'||scope==='journeys'||scope===k)){if(k==='cake')await cake(p);if(k==='crossing')await crossing(p);if(k==='tickets')await tickets(p);await p.locator('#content-back').click();}}finally{await c.close();}}
 if(scope==='matrix'||scope==='all')await matrix();
 if(scope==='negative')await negatives();
 if(scope==='state'){const {c,p}=await make();try{await enter(p,'tickets');await arrive(p,0);await tap(p,'door');assert.equal((await diag(p)).doorStage,'opening');assert.equal(await a(p,'status').innerText(),'正在開門');await shot(p,'phone-tickets-opening-state');await until(p,d=>d.doorStage==='awaiting');assert.equal(await a(p,'status').innerText(),'先點一位朋友');check('opening status and next passenger use the same boarding state');}finally{await c.close();}}
 if(scope==='offline'||scope==='offline-crossing'){const {c,p}=await make();try{await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForFunction(async()=>{const cache=await caches.open((await caches.keys()).find(k=>k.startsWith('island-transport-')));return (await cache.keys()).length>=233;});await c.setOffline(true);await p.reload();for(const k of (scope==='offline-crossing'?['crossing']:['cake','crossing','tickets'])){if(k==='cake')await cake(p);if(k==='crossing')await crossing(p);if(k==='tickets')await tickets(p);await p.locator('#content-back').click();}check(scope==='offline-crossing'?'crossing completes and reloads without network':'all three lessons complete and reload without network');}finally{await c.close();}}
 if(scope==='store'){const folder='docs/store/screenshots/content-r18';await mkdir(folder,{recursive:true});for(const [w,h,dpr] of [[430,932,3],[1032,1376,2]]){const {c,p}=await make(w,h,dpr);try{await enter(p,'tickets');await arrive(p,0);await tap(p,'door');await until(p,d=>d.doorStage==='awaiting');await p.locator(`[data-passenger="${(await diag(p)).boardingIndex}"]`).click();await tap(p,'board');await tick(p,550);await shot(p,`tickets-player-boarding-${w*dpr}x${h*dpr}`,folder);}finally{await c.close();}}}
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert.deepEqual(http,[]);status='VERIFIED';
}finally{await browser.close();await writeFile(`${out}/browser-${scope}.json`,JSON.stringify({status,rows,shots,errors,external,http},null,2));}
