// R26 public-UI playthrough. The clock advances real timers/RAF only.
import {inspectLayout} from './content-r26-layout.mjs';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {mkdir,readFile,writeFile,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE||'C:/Users/digimkt/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs').href);
const base=process.env.BASE_URL||'http://127.0.0.1:5286/',scope=process.env.R26_SCOPE||'all',out=`docs/content/r26${scope==='all'?'':'/'+scope}`;
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true}),rows=[],shots=[],errors=[],external=[],http=[];
const a=(p,id)=>p.locator(`[data-action="${id}"]`),diag=p=>p.locator('.content-scene').evaluate(e=>({...e.dataset}));
const tick=(p,ms)=>p.clock.runFor(ms),check=(label,detail={})=>{rows.push({status:'VERIFIED',label,...detail});console.log('VERIFIED '+label);};
async function make(w=390,h=844,dpr=1){const c=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:dpr,hasTouch:true}),p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)http.push({url:r.url(),status:r.status()});});p.on('request',r=>{if(/^https?:/.test(r.url())&&new URL(r.url()).origin!==new URL(base).origin)external.push(r.url());});await p.clock.install();await p.goto(base);await p.locator('#content-start').waitFor();await p.clock.pauseAt(await p.evaluate(()=>Date.now()+100));return {c,p};}
async function tap(p,id){await a(p,id).click();await tick(p,96);}
async function down(p,id){const b=await a(p,id).boundingBox();assert.ok(b,id);await p.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.mouse.down();}
async function hold(p,id,ms){await down(p,id);await tick(p,ms);await p.mouse.up();await tick(p,96);}
async function until(p,fn,max=30000,step=96){for(let t=0;t<max;t+=step){if(fn(await diag(p)))return;await tick(p,step);}throw Error('UI timeout '+JSON.stringify(await diag(p)));}
async function enter(p,kind){await p.locator('#content-start').click();await p.locator(`[data-content=${kind}]`).click();await shot(p,`phone-${kind}-instructions`);await tap(p,'begin');}
async function contracts(p){
 const proof=await p.locator('#content-r1').evaluate(root=>{
  const visible=e=>{for(let x=e;x;x=x.parentElement){const c=getComputedStyle(x);if(x.hidden||c.display==='none'||c.visibility==='hidden')return false;}return e.getClientRects().length>0;};
  const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
  const controls=[...root.querySelectorAll('button')].filter(e=>visible(e)&&!e.disabled).map(e=>{const b=rect(e),pts=[[b.x+b.width/2,b.y+b.height/2],[b.x+3,b.y+3],[b.right-3,b.bottom-3]];return {id:e.dataset.action||e.dataset.passenger||e.id,w:b.width,h:b.height,bad:b.width<59.8||b.height<59.8||b.x<-.5||b.y<-.5||b.right>innerWidth+.5||b.bottom>innerHeight+.5||pts.some(([x,y])=>{const h=document.elementFromPoint(x,y);return h!==e&&!e.contains(h);})};});
  const clipping=[],walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);while(walker.nextNode()){const n=walker.currentNode,e=n.parentElement;if(!n.textContent.trim()||!visible(e)||e.closest('svg'))continue;const r=document.createRange();r.selectNodeContents(n);for(const b of r.getClientRects()){if(!b.width||!b.height)continue;for(let x=e;x&&x!==document.body;x=x.parentElement){const c=getComputedStyle(x),a=x.getBoundingClientRect();if((['hidden','clip','auto','scroll'].includes(c.overflowX)&&(b.x<a.x-1||b.right>a.right+1))||(['hidden','clip','auto','scroll'].includes(c.overflowY)&&(b.y<a.y-1||b.bottom>a.bottom+1)))clipping.push(n.textContent);}if(b.x<-.5||b.y<-.5||b.right>innerWidth+.5||b.bottom>innerHeight+.5)clipping.push(n.textContent);}}
  return {controls,clipping,kind:root.dataset.kind,phase:root.dataset.phase,text:root.innerText,metres:root.querySelectorAll('[role=meter]').length,rings:root.querySelectorAll('.recovery-ring').length,progress:root.querySelector('.content-observe').innerText,needed:[...root.querySelectorAll('#content-controls [data-needed=true]')].map(e=>e.dataset.action),riders:[...root.querySelectorAll('.boarding-friend')].map(e=>({id:e.dataset.friend,progress:e.dataset.progress,image:rect(e.querySelector('img')),box:rect(e),opacity:getComputedStyle(e.querySelector('img')).opacity,display:getComputedStyle(e.querySelector('img')).display})),step:root.querySelector('.ticket-boarding-bridge').hidden?null:rect(root.querySelector('.ticket-boarding-bridge')),numbers:[...root.querySelectorAll('.friend-number')].filter(visible).map(e=>e.textContent),counts:root.querySelector('.ticket-counts').innerText};
 });
 assert.deepEqual(proof.controls.filter(x=>x.bad),[],'60px controls visible and hit-testable');assert.deepEqual(proof.clipping,[],'text fully inside viewport and clipping ancestors');assert.doesNotMatch(proof.text,/等待回穩|WASD|方向鍵|空白鍵|鍵盤/);assert.ok(proof.needed.every(x=>['recover-left','recover-right','depart','go','brake','left','right','door','board','escort','retract','close-door','train-depart','next'].includes(x)),'only available next actions highlighted');
 if(proof.kind==='cake'){assert.equal(proof.metres,1);assert.ok(proof.rings===0);assert.ok(await p.locator('.hold-progress').count()>0||['ready','done','checkpoint','delivering'].includes(proof.phase));}
 if(proof.kind==='crossing'){const lamp=a(p,'brake').locator('svg:not(.hold-progress)>circle');if(await a(p,'brake').count())assert.equal(await lamp.getAttribute('fill'),'#e54b35','the stop icon has a complete red signal');assert.doesNotMatch(proof.text,/\u8d77\u9ede/);assert.match(proof.progress,/^已到對岸 [0-3]\/3 人$/);assert.equal((proof.progress.match(/\/3/g)||[]).length,1);for(const name of proof.numbers)assert.doesNotMatch(name,/\d/,'names have no sequence numbers');}
 if(proof.kind==='tickets'){for(const rider of proof.riders){assert.ok(rider.image.width>1&&rider.image.height>1);assert.equal(rider.opacity,'1');assert.notEqual(rider.display,'none');}const nums=[...proof.counts.matchAll(/(\d) 人/g)].map(x=>+x[1]);assert.match(proof.counts,/^已入座 [0-3]\/3 人$/);assert.equal((proof.counts.match(/\/3/g)||[]).length,1);}
 if(proof.kind==='cake'&&proof.phase==='playing'){const state=await diag(p);if(state.recoveryActive==='false'&&state.wrongTurn==='false'&&state.cue){const pressed=a(p,state.cue);if(await pressed.count()&&await pressed.getAttribute('data-held')==='true')assert.equal(await pressed.evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(255, 211, 68)','correct held driving controls retain their positive feedback');}}
 proof.highlights=[];for(const id of proof.needed){const color=await a(p,id).evaluate(e=>getComputedStyle(e).backgroundColor);proof.highlights.push({id,color});assert.equal(color,'rgb(255, 211, 68)','the actual next-action button visibly lights yellow');}
 if(proof.kind==='cake'&&+(await p.locator('[role=meter]').getAttribute('aria-valuenow'))<100)assert.doesNotMatch(proof.text,/✓ 蛋糕坐穩了/,'upright text and check never appear before 100%');
 const d=await diag(p),hint=await p.locator('#content-hint').innerText();
 if(proof.kind==='cake'&&proof.phase==='playing'){
  assert.deepEqual(proof.needed,d.cue?[d.cue]:[],'highlight equals actual next action');
  if(hint.includes('越扶越歪'))assert.equal(d.semanticStatus,'越來越歪');
  if(hint.includes('可以出發')){assert.equal(d.cue,'go');assert.ok(!proof.needed.includes('brake'));}
  if(+d.balanceLean===0)assert.equal(d.semanticStatus,'坐穩了');
  if(+await p.locator('[role=meter]').getAttribute('aria-valuenow')>=95)assert.notEqual(d.semanticStatus,'傾斜中');
 }
 if(proof.kind==='crossing'){const labels=await p.locator('.content-scene').evaluate(root=>[...root.querySelectorAll('.content-observe,.content-scene-cue,.crossing-checks,.crossing-direction span,.crossing-traffic b,.station-rule,.crossing-lookout')].filter(e=>{const b=e.getBoundingClientRect(),s=getComputedStyle(e);return !e.hidden&&s.display!=='none'&&s.visibility!=='hidden'&&b.width&&b.height&&e.innerText.trim();}).length);assert.ok(labels<=4,'at most four upper scene labels');}
 if(proof.kind==='crossing'&&+d.crossTime>0){const count=await p.locator('.content-scene').evaluate(root=>[...root.querySelectorAll('.content-observe,.content-scene-cue,.crossing-checks,.crossing-direction span,.friend-number')].filter(e=>{const b=e.getBoundingClientRect(),s=getComputedStyle(e);return b.width&&b.height&&s.display!=='none'&&s.visibility!=='hidden';}).length);assert.ok(count<=4,'including all person name tags, at most four scene labels while crossing');proof.visibleCrossingLabels=count;assert.equal(await a(p,'depart').isDisabled(),true);assert.match(hint,+d.crossTime/+d.crossDuration>=.82?/到對岸了，等他站好/:/還有人在過街/);assert.equal(await a(p,'depart').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(220, 228, 232)');}
 if(proof.kind==='tickets'&&proof.phase==='boarding'){
  for(const rider of proof.riders)assert.ok(rider.image.height>=40,'full-body friend at least 40px');
  if(+d.holdProgress===0)assert.doesNotMatch(hint,/放開了/);
 }
 proof.actualYellow=await p.locator('#content-controls [data-action]').evaluateAll(es=>es.filter(e=>getComputedStyle(e).backgroundColor==='rgb(255, 211, 68)').map(e=>e.dataset.action));
 if(proof.kind==='cake'&&proof.phase==='playing')assert.deepEqual(proof.actualYellow,proof.needed,'all actual yellow buttons match the displayed next action');
 if(proof.kind==='tickets'){const seats=await p.locator('.ticket-seated img').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().height));for(const h of seats)assert.ok(h>=24,'seated head and shoulders at least 24px');}
 proof.semantic={status:d.semanticStatus,next:d.nextAction,hint,highlights:proof.needed};
 return proof;
}
async function consistency(p){
 const kind=await p.locator('#content-r1').getAttribute('data-kind'),d=await diag(p),hint=await p.locator('#content-hint').innerText();
 if(kind==='tickets'&&!['boarding','done'].includes(await p.locator('#content-r1').getAttribute('data-phase'))){const signs=await p.locator('[data-platform]').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect(),s=document.querySelector('.content-scene').getBoundingClientRect(),floor=document.querySelector('.ticket-platform-surface').getBoundingClientRect();return {top:r.top,bottom:r.bottom+25,floor:floor.top,scene:s.bottom,post:getComputedStyle(e,'::after').display};}));assert.equal(signs.length,3);for(const s of signs){assert.notEqual(s.post,'none');assert.ok(s.bottom>=s.floor-1&&s.bottom<=s.scene+1,'sign base touches paving inside scene');}}
 if(kind==='cake'){
  assert.doesNotMatch(hint,/前方直路/);
  assert.equal(await p.locator('.content-road-sign').getAttribute('data-road-shape'),d.roadShape);
  if(hint.includes('前方'))assert.ok(hint.includes({left:'左彎',right:'右彎',uphill:'上坡'}[d.roadShape]));
 }
 if(kind==='crossing'){
  const destination=await p.locator('.crossing-direction').innerText();
  const landed=+(await p.locator('.content-observe').innerText()).match(/(\d)\/3/)[1];
  assert.equal(destination.includes('✓'),landed===3);
  const overlaps=await p.locator('.content-scene').evaluate(root=>{
   const arrow=root.querySelector('.crossing-arrow')?.getBoundingClientRect();if(!arrow?.width)return [];
   return [...root.querySelectorAll('.content-walker img,.crossing-arrived img,.crossing-waiting img,.crossing-checks span,.content-scene-cue,.content-observe')].filter(e=>{const b=e.getBoundingClientRect();return b.width&&b.height&&b.x<arrow.right&&b.right>arrow.x&&b.y<arrow.bottom&&b.bottom>arrow.y;}).map(e=>e.alt||e.textContent);
  });assert.deepEqual(overlaps,[],'direction plaque never covers people or state labels');
  const car=p.locator('.crossing-traffic');
  if(await car.isVisible()){
   const overlap=await p.locator('.content-scene').evaluate(root=>{const a=root.querySelector('.crossing-traffic b').getBoundingClientRect(),b=root.querySelector('.lane-direction').getBoundingClientRect();return a.x<b.right&&a.right>b.x&&a.y<b.bottom&&a.bottom>b.y;});assert.equal(overlap,false,'moving car label and lane direction never overlap');
   const pose=await car.evaluate(e=>({x:parseFloat(e.style.left),top:parseFloat(e.style.top),...e.dataset,rotate:getComputedStyle(e.querySelector('img')).rotate,scale:getComputedStyle(e.querySelector('img')).scale}));
   assert.ok(['none','0deg'].includes(pose.rotate),'zero vehicle rotation');assert.ok(pose.top>=40&&pose.top<=60);
   assert.equal(pose.scale,pose.heading==='right'?'-1 1':'1');
   if(hint.includes('左邊又有車'))assert.equal(pose.source,'left');
  }
 }
 if(kind==='tickets'){
  if(+d.distance>=28&&!['departing','done'].includes(await p.locator('#content-r1').getAttribute('data-phase'))){const bounds=await p.locator('.ticket-vehicle').evaluate(e=>{const r=e.getBoundingClientRect(),s=document.querySelector('.content-scene').getBoundingClientRect();return {left:r.x-s.x,right:r.right-s.right};});assert.ok(bounds.left>=-.5&&bounds.right<=.5,'same-scale stopped train remains fully visible');}
  const geometry=await p.locator('.content-scene').evaluate(root=>{
   const b=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height};};
   const platform=b(root.querySelector('.ticket-platform-surface')),step=root.querySelector('.ticket-boarding-bridge');
   return {platform,step:step.hidden?null:b(step),side:step.dataset.side,riders:[...root.querySelectorAll('.boarding-friend')].map(e=>({progress:+e.dataset.progress,feet:b(e.querySelector('img')),center:b(e).x+b(e).w/2}))};
  });
  assert.equal(geometry.side,'front');
  if(geometry.step){assert.ok(geometry.step.bottom>=geometry.platform.y);assert.ok(geometry.step.y<geometry.platform.y);}
  for(const r of geometry.riders){
   if(r.progress<.35)assert.ok(r.feet.bottom>=geometry.platform.y-.5,'waiting feet on foreground paving');
   else if(geometry.step&&r.progress<=.82){assert.ok(r.feet.bottom>=geometry.step.y-.5);assert.ok(r.center>=geometry.step.x-1&&r.center<=geometry.step.right+1,'feet follow step at actual door');}
  }
 }
}
async function shot(p,name,folder=out){if(['layout','store'].includes(scope)&&name.startsWith('phone-'))name=`device-${p.viewportSize().width}x${p.viewportSize().height}-${name}`;await p.evaluate(async()=>Promise.all([...document.images].filter(i=>i.getClientRects().length).map(i=>i.decode().catch(()=>{}))));const proof=await contracts(p);proof.layout=await p.evaluate(inspectLayout);if(proof.layout.overlaps.length||proof.layout.signOcclusion.length)await writeFile(`${out}/layout-failure.json`,JSON.stringify(proof.layout,null,2));assert.deepEqual(proof.layout.overlaps,[],'all rendered labels/buttons/banners/road signs/counters have zero intersection');assert.deepEqual(proof.layout.iconOverlaps,[],'control glyphs and progress never touch text');assert.deepEqual(proof.layout.signOcclusion,[],'people never cover platform signs');assert.deepEqual(proof.layout.counterOcclusion,[],'people never cover seated counts');if(proof.layout.carOffset!==null)assert.ok(proof.layout.carOffset<=20,'car label follows actual car center');const path=`${folder}/${name}.png`;await mkdir(folder,{recursive:true});await consistency(p);await p.screenshot({path});const b=await readFile(path);const s={path,width:b.readUInt32BE(16),height:b.readUInt32BE(20),sha256:createHash('sha256').update(b).digest('hex'),state:await diag(p),phase:await p.locator('#content-r1').getAttribute('data-phase'),hint:await p.locator('#content-hint').innerText(),proof};shots.push(s);return s;}
async function saved(p,kind){assert.equal(await p.locator('#content-r1').getAttribute('data-phase'),'done');await shot(p,`phone-${kind}-complete`);const before=await p.evaluate(k=>JSON.parse(localStorage.getItem('island-transport:student:v2')).sections.contentR1[k],kind);assert.equal(before.completed,true);await p.locator('#content-back').click();await p.reload();await p.locator('#content-start').click();await p.locator(`[data-content=${kind}]`).click();assert.equal(await p.locator('#content-r1').getAttribute('data-phase'),'done');const after=await p.evaluate(k=>JSON.parse(localStorage.getItem('island-transport:student:v2')).sections.contentR1[k],kind);assert.deepEqual(after,before);await shot(p,`phone-${kind}-saved`);check(`${kind} three stops complete and restore exact saved facts`,before);await p.locator('#content-back').click();}
async function cake(p){
 await enter(p,'cake');let held='',tested=false,bay=false;
 for(let stage=0;stage<3;stage++){
  for(let n=0;n<5000;n++){
   if(await p.locator('#content-r1').getAttribute('data-phase')!=='playing')break;
   let d=await diag(p);
   if(stage===1&&d.inBend==='true'&&d.recoveryActive==='false'&&!tested){
    if(held){await p.mouse.up();held='';}
    const wrong=+d.bend<0?'right':'left';await down(p,wrong);await tick(p,400);const w=await shot(p,'phone-cake-stage-2-wrong');assert.match(w.hint,/再選一次/);await p.mouse.up();await tick(p,96);
    d=await diag(p);assert.equal(d.recoveryActive,'true');const start=+d.balanceLean,dist=d.distance;
    await tick(p,400);assert.equal((await diag(p)).balanceLean,d.balanceLean,'idle does not auto-recover');
    await down(p,start>0?'recover-right':'recover-left');await tick(p,200);assert.ok(Math.abs(+(await diag(p)).balanceLean)>Math.abs(+d.balanceLean),'wrong press visibly adds tilt');const wrongRecovery=await shot(p,'phone-cake-wrong-recovery');assert.match(wrongRecovery.hint,/越扶越歪/);await p.mouse.up();await tick(p,96);
    const frames=[];
    for(const target of [62,80,100]){
     await down(p,start>0?'recover-left':'recover-right');
     let found=false;
     for(let ms=0;ms<4000;ms+=16){const value=+(await p.locator('[role=meter]').getAttribute('aria-valuenow'));if(value===target&&(target!==100||(await diag(p)).balanceLean==='0.00')){found=true;break;}if(value>target)throw Error('missed centre '+target+' at '+value);await tick(p,16);}
     assert.ok(found,'centre '+target);await p.mouse.up();await tick(p,16);
     frames.push(await shot(p,`phone-cake-stage-2-centre-${target}`));
     if(target===80){await down(p,start>0?'recover-left':'recover-right');await tick(p,96);const correct=await shot(p,'phone-cake-stage-2-correct-recovery');assert.equal(correct.proof.semantic.status,'回穩中');await p.mouse.up();await tick(p,16);}
    }
    assert.ok(frames.every(s=>s.state.distance===dist));assert.equal(frames[2].state.balanceLean,'0.00');tested=true;
   }
   d=await diag(p);
   if(stage===2&&+d.distance>=42&&d.bayStopped==='false'&&d.recoveryActive==='false'&&!shots.some(s=>s.path.endsWith('phone-cake-stage-3-braking.png')))await shot(p,'phone-cake-stage-3-braking');
   if(stage===2&&d.bayStopped==='true'&&d.recoveryActive==='false'&&d.cue===''&&!shots.some(s=>s.path.endsWith('phone-cake-stage-3-resting.png')))await shot(p,'phone-cake-stage-3-resting');
   if(stage===2&&d.bayStopped==='true'&&d.recoveryActive==='false'&&d.cue==='go'&&!bay){if(held){await p.mouse.up();held='';}await shot(p,'phone-cake-stage-3-bay');assert.match(await p.locator('#content-hint').innerText(),/休息好了，可以出發了/);await down(p,'go');await tick(p,500);await shot(p,'phone-cake-stage-3-restart');await p.mouse.up();bay=true;}
   const next=d.cue;
   if(next!==held){if(held)await p.mouse.up();held='';if(next){await down(p,next);held=next;}}
   if(stage===0&&n===8)await shot(p,'phone-cake-stage-1-playing');
   await tick(p,144);
  }
  if(held){await p.mouse.up();held='';}assert.equal(await p.locator('#content-r1').getAttribute('data-phase'),'delivering');
  for(let f=1;f<=3;f++){await shot(p,`phone-cake-stage-${stage+1}-delivery-${f}`);await tick(p,560);}await tick(p,200);check(`cake stage ${stage+1} driven by controls`);if(stage<2)await tap(p,'next');
 }
 assert.ok(tested&&bay);await saved(p,'cake');
}
async function crossing(p){
 await enter(p,'crossing');
 for(let stage=0;stage<3;stage++){
  await hold(p,'brake',1500);await shot(p,`phone-crossing-stage-${stage+1}-decision`);
  await tap(p,'depart');assert.match(await p.locator('#content-hint').innerText(),/還在/);await shot(p,`phone-crossing-stage-${stage+1}-wrong-depart`);
  const sequence=stage===0?['left','right']:stage===1?['right','left']:['left','right','left'];
  for(let person=0;person<3;person++){
   for(let i=0;i<sequence.length;i++){await tap(p,'look-'+sequence[i]);if(stage===1&&person===0&&i===0)await shot(p,'phone-crossing-stage-2-right-first');if(person===0&&i===0){await tick(p,650);}if(person===0&&i===0)await shot(p,`phone-crossing-stage-${stage+1}-car`);if(stage===2&&person===0&&i===1){await shot(p,'phone-crossing-stage-3-recheck');await tick(p,800);await shot(p,'phone-crossing-stage-3-recheck-2');await tick(p,1000);await shot(p,'phone-crossing-stage-3-recheck-3');await until(p,d=>d.trafficActive==='false');await shot(p,'phone-crossing-stage-3-recheck-4');}}
   await until(p,d=>+d.crossTime>0);await tap(p,'look-right');assert.equal((await diag(p)).focus,'right');
   const distance=(await diag(p)).distance;await down(p,'depart');await tick(p,96);await p.mouse.up();assert.equal((await diag(p)).distance,distance,'real pointer on disabled departure cannot move the car');assert.equal(await p.locator('#content-r1').getAttribute('data-phase'),'playing');await shot(p,`phone-crossing-stage-${stage+1}-${person+1}-start`);
   for(const [label,t] of [['middle',.50],['pavement',.84]]){await until(p,d=>+d.crossTime/+d.crossDuration>=t,30000,16);const s=await shot(p,`phone-crossing-stage-${stage+1}-${person+1}-${label}`);assert.equal(s.proof.progress,`已到對岸 ${person+(label==='pavement'?1:0)}/3 人`);if(label==='pavement')assert.match(s.hint,/到對岸了/);}
   await until(p,d=>+d.crossed>person);await shot(p,`phone-crossing-stage-${stage+1}-arrived-${person+1}`);
  }
  assert.equal(await a(p,'depart').isEnabled(),true);await shot(p,`phone-crossing-stage-${stage+1}-ready-depart`);await tap(p,'depart');
  for(let f=1;f<=3;f++){await shot(p,`phone-crossing-stage-${stage+1}-departing-${f}`);await tick(p,480);}await tick(p,300);check(`crossing stage ${stage+1} observations, wait, three arrivals, departure`);if(stage<2)await tap(p,'next');
 }
 await saved(p,'crossing');
}
async function tickets(p){
 await enter(p,'tickets');const positions=[];
 for(let stage=0;stage<3;stage++){
  await shot(p,`phone-tickets-stage-${stage+1}-decision`);assert.equal(await p.locator('[data-platform][aria-pressed=true]').count(),0,'no answer selected initially');assert.equal(await p.locator('[data-platform][data-arrived=true]').count(),0);const target=(await diag(p)).targetName;
  const signs=await p.locator('[data-platform]').evaluateAll(es=>es.map(e=>({id:e.dataset.platform,label:e.getAttribute('aria-label')}))),right=signs.find(s=>s.label===target+'月台');positions.push(right.id);
  const wrong=signs.find(s=>s.id!==right.id);await p.locator(`[data-platform="${wrong.id}"]`).click();await tick(p,96);await hold(p,'go',5700);await hold(p,'brake',1600);assert.match(await p.locator('#content-hint').innerText(),/形狀|顏色/);await shot(p,`phone-tickets-stage-${stage+1}-wrong`);
  await p.locator(`[data-platform="${right.id}"]`).click();await tick(p,96);await shot(p,`phone-tickets-stage-${stage+1}-right`);await hold(p,'go',5700);await hold(p,'brake',1600);await tap(p,'door');await until(p,d=>d.doorStage==='awaiting');
  for(let n=0;n<3;n++){
   await p.locator(`[data-passenger="${n}"]`).click();await tick(p,96);await tap(p,'board');const before=(await diag(p)).boardTime;await tick(p,400);assert.equal((await diag(p)).boardTime,before,'boarding waits for the player hold');
   if(n===0)await shot(p,`phone-tickets-stage-${stage+1}-board-start`);await down(p,'escort');await tick(p,200);assert.ok(+(await diag(p)).boardTime>+before);if(n===0){for(const [label,progress] of [['walking',.28],['boarding-2',.58],['inside',.82]]){await until(p,d=>+d.holdProgress>=progress,12000,16);await shot(p,`phone-tickets-stage-${stage+1}-${label}`);}}
   if(n===0)await until(p,d=>+d.holdProgress>=.5);await p.mouse.up();await tick(p,96);if(n===0)await shot(p,`phone-tickets-stage-${stage+1}-paused`);const paused=(await diag(p)).boardTime;await tick(p,1000);assert.equal((await diag(p)).boardTime,paused,'release pauses boarding');await down(p,'escort');if(n===0){await until(p,d=>+d.holdProgress>=.88,12000,16);await shot(p,`phone-tickets-stage-${stage+1}-aisle`);}await until(p,d=>d.doorStage!=='boarding');await p.mouse.up();await tick(p,96);await shot(p,`phone-tickets-stage-${stage+1}-seated-${n+1}`);assert.equal((await p.locator('.ticket-counts').innerText()),`\u5df2\u5165\u5ea7 ${n+1}/3 \u4eba`);
  }
  const geometry=await p.locator('.ticket-door').evaluate(e=>{const door=e.getBoundingClientRect(),sign=document.querySelector('.content-stations [aria-pressed=true]').getBoundingClientRect();return Math.abs(door.x+door.width/2-sign.x-sign.width/2);});assert.ok(geometry<=20,'door aligned '+geometry);check('platform '+(stage+1)+' door alignment',{errorPx:geometry});const step=await shot(p,`phone-tickets-stage-${stage+1}-step-out`);assert.ok(step.proof.step?.height>=12);await tap(p,'retract');await until(p,d=>d.doorStage==='close-ready');const noStep=await shot(p,`phone-tickets-stage-${stage+1}-step-in`);assert.equal(noStep.proof.step,null);await tap(p,'close-door');await until(p,d=>d.doorStage==='closed');await shot(p,`phone-tickets-stage-${stage+1}-closed`);await tap(p,'train-depart');
  for(let f=1;f<=3;f++){await shot(p,`phone-tickets-stage-${stage+1}-departing-${f}`);await tick(p,480);}await tick(p,300);check(`tickets stage ${stage+1} wrong choice, reselect, escort three friends, step/door/depart`);if(stage<2)await tap(p,'next');
 }
 assert.equal(new Set(positions).size,3);check('ticket answers move through all three platform positions',{positions});await saved(p,'tickets');
 const record=await p.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('island-transport:student:v2')).sections.contentR1.tickets));
 await p.locator('#content-start').click();await p.locator('[data-content=tickets]').click();await tap(p,'replay');await tap(p,'begin');
 const replayTarget=(await diag(p)).targetName;await p.getByRole('button',{name:replayTarget+'月台',exact:true}).click();await hold(p,'go',5700);await hold(p,'brake',1600);await tap(p,'door');await until(p,d=>d.doorStage==='awaiting');await p.locator('[data-passenger="0"]').click();await tap(p,'board');await down(p,'escort');await until(p,d=>+d.holdProgress>=.28,12000,16);await p.mouse.up();await tick(p,96);await shot(p,'phone-tickets-replay-walking');await p.locator('#content-back').click();
 assert.equal(await p.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('island-transport:student:v2')).sections.contentR1.tickets)),record,'unfinished replay preserves the completed save');check('ticket replay keeps continuous foreground walking and the completed save');
}
async function layout(){for(const [w,h] of [[320,568],[568,320],[390,844],[844,390],[768,1024],[1024,768],[1366,600],[1280,640]]){const {c,p}=await make(w,h);for(const kind of ['cake','crossing','tickets']){await enter(p,kind);if(kind==='cake'){await hold(p,'go',700);await tick(p,96);if((await diag(p)).recoveryActive==='true')await shot(p,`device-${w}x${h}-${kind}-recovery`);}if(kind==='crossing'){await hold(p,'brake',1500);await tap(p,'depart');}if(kind==='tickets'){const name=(await diag(p)).targetName;await p.getByRole('button',{name:name+'月台',exact:true}).click();await tick(p,96);await hold(p,'go',5700);await hold(p,'brake',1600);await tap(p,'door');await until(p,d=>d.doorStage==='awaiting');await p.locator('[data-passenger="0"]').click();await tap(p,'board');await down(p,'escort');await tick(p,1700);await p.mouse.up();}await shot(p,`device-${w}x${h}-${kind}-playing`);await p.locator('#content-back').click();check(`${w}x${h} ${kind} touch controls, clipping, visible play`);}await c.close();}}
try{
 if(scope==='layout')await layout();
 else if(scope==='store'){for(const [w,h,dpr] of [[430,932,3],[1032,1376,2]]){const {c,p}=await make(w,h,dpr);await enter(p,'tickets');const name=(await diag(p)).targetName;await p.getByRole('button',{name:name+'月台',exact:true}).click();await tick(p,96);await hold(p,'go',5700);await hold(p,'brake',1600);await tap(p,'door');await until(p,d=>d.doorStage==='awaiting');await p.locator('[data-passenger="0"]').click();await tap(p,'board');await down(p,'escort');await tick(p,1700);await shot(p,`tickets-escort-${w*dpr}x${h*dpr}`,'docs/store/screenshots/content-r26');await p.mouse.up();await c.close();check(`store ${w*dpr}x${h*dpr} live escort`);}}
 else {const {c,p}=await make();if(scope==='offline'){await p.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(r=>navigator.serviceWorker.addEventListener('controllerchange',r,{once:true}));});await c.setOffline(true);}for(const kind of (process.env.R26_COURSES||(scope==='supplement'?'cake':'cake,crossing,tickets')).split(','))await ({cake,crossing,tickets}[kind])(p);await c.close();}
 assert.deepEqual(errors,[]);assert.deepEqual(http,[]);assert.deepEqual(external,[]);check('no script errors, failed local requests, or external network');
}catch(error){try{const p=browser.contexts().at(-1)?.pages().at(-1);if(p)await p.screenshot({path:`${out}/failure.png`});}catch{}throw error;}
finally{await browser.close();await writeFile(`${out}/browser.json`,JSON.stringify({status:rows.some(r=>r.label==='no script errors, failed local requests, or external network')?'VERIFIED':'BLOCKED',scope,method:'Headless Chromium; public UI; real timers/RAF advanced by Playwright clock; no game-state assignments or synthetic saves',rows,shots,errors,http,external},null,2));}
