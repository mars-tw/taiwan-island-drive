// Headless, public controls only: advance timers, never write game state.
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {CROSSING_ROADS} from '../src/shared/content-r37-scene.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'./playwright-cpu-r34.mjs');
assert.ok(!process.env.PLAYWRIGHT_MODULE||process.env.PLAYWRIGHT_MODULE.endsWith('playwright-cpu-r34.mjs'),'R37 requires the silent CPU browser launcher');
const base=process.env.BASE_URL||'http://127.0.0.1:5286/r37-reference/',scope=process.env.R37_SCOPE||'all',baseline=true,out='docs/content/r37'+(baseline?'/comparison-baseline':'')+(scope==='all'?'':'/'+scope);
await mkdir(out,{recursive:true});
const startedFingerprint={};for(const f of ['src/shared/content-r31.js','tests/shared/content-r31.test.js','src/shared/content-r31-scene.js','src/shared/content-r32-scene.js','src/shared/content-r1-ui.js','src/shared/content-r35.js','src/shared/content-r35-scene.js','src/shared/content-r35-ui.js','src/shared/content-r35.css','scripts/check-content-r37-reference.mjs','src/shared/content-r37-scene.js','src/shared/content-r37-ui.js','src/shared/content-r37.css','scripts/playwright-cpu-r34.mjs'])startedFingerprint[f]=createHash('sha256').update(await readFile(f)).digest('hex');
const browser=await chromium.launch({headless:true,args:['--mute-audio']}),shots=[],checks=[],errors=[],external=[];
let touch,held=[];
const state=p=>p.locator('.content-scene').evaluate(e=>({...e.dataset})),phase=p=>p.locator('#content-r1').getAttribute('data-phase'),a=(p,id)=>p.locator(`[data-action="${id}"]`),tick=(p,ms=96)=>p.clock.runFor(ms);
async function make(w=390,h=844,dpr=1){const c=await browser.newContext({viewport:{width:w,height:h},hasTouch:true,deviceScaleFactor:dpr}),p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});p.on('request',r=>{if(/^https?:/.test(r.url())&&new URL(r.url()).origin!==new URL(base).origin)external.push(r.url());});await p.clock.install({time:new Date('2026-10-18T00:00:00Z')});await p.goto(base);await p.locator('#content-start').waitFor();await p.evaluate(()=>{window.__r37AudioChecks={speechCalls:0,mediaPlayCalls:0};const speak=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=utterance=>{window.__r37AudioChecks.speechCalls++;return speak(utterance);};const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){window.__r37AudioChecks.mediaPlayCalls++;return play.call(this);};});await p.clock.pauseAt(await p.evaluate(()=>Date.now()+100));touch=await c.newCDPSession(p);held=[];return {c,p};}
async function keys(p,ids){if(ids.join()===held.join())return;if(held.length)await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});held=[];if(ids.length){const points=[];for(let i=0;i<ids.length;i++){const b=await a(p,ids[i]).boundingBox();assert.ok(b,ids[i]);points.push({x:b.x+b.width/2,y:b.y+b.height/2,id:i+1});}await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});held=ids;}}
async function tapLocator(p,loc){const b=await loc.boundingBox();await p.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);await tick(p);}
async function tap(p,id){await keys(p,[]);const b=await a(p,id).boundingBox();assert.ok(b,id);await p.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);await tick(p);}
async function until(p,fn,max=50000,step=64){for(let i=0;i<max;i+=step){if(await fn(await state(p)))return;await tick(p,step);}throw Error('timeout '+JSON.stringify(await state(p)));}
function ok(label,details={}){checks.push({status:'VERIFIED',label,...details});console.log('VERIFIED '+label);}
async function shot(p,name,folder=out){if(!new Set(['phone-cake-wrong-support','phone-cake-late-brake-edge','phone-cake-rescued','phone-cake-stage-2-finished','phone-cake-complete','phone-crossing-stage-2-unobserved','phone-crossing-stage-2-car-approach','phone-crossing-stage-2-only-source-main','phone-crossing-stage-2-turning-right','phone-crossing-stage-2-departing','phone-crossing-stage-2-joined-right-lane','phone-tickets-stage-3-wrong-shape','phone-tickets-stage-3-wrong-color','phone-tickets-stage-3-hold-half-0','phone-tickets-stage-3-hold-paused-0','phone-tickets-stage-3-closed-departing']).has(name))return state(p);if(['layout','store'].includes(scope)&&folder===out){const v=p.viewportSize();name=`${v.width}x${v.height}-`+name;}await mkdir(folder,{recursive:true});await p.evaluate(async()=>Promise.all([...document.images].filter(i=>i.getClientRects().length).map(i=>i.decode().catch(()=>{}))));
 const controls=await p.locator('#content-r1 button').evaluateAll(es=>es.filter(e=>!e.disabled&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').map(e=>{const r=e.getBoundingClientRect(),h=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {id:e.dataset.action||e.dataset.platform||e.id,w:r.width,h:r.height,bad:r.width<59.8||r.height<59.8||r.x<-.5||r.y<-.5||r.right>innerWidth+.5||r.bottom>innerHeight+.5||h!==e&&!e.contains(h)};}));
 const s=await state(p),kind=await p.locator('#content-r1').getAttribute('data-kind'),text=await p.locator('#content-r1').innerText();
 if(controls.some(c=>c.bad))await p.screenshot({path:out+'/diagnostic-'+name+'.png'});assert.deepEqual(controls.filter(c=>c.bad),[],name+' controls');assert.doesNotMatch(text,/WASD|方向鍵|空白鍵|鍵盤|\?\?\?/);
 if(kind==='cake'&&await phase(p)==='playing'){assert.equal(await p.locator('#content-hint').innerText(),s.stateText);const angle=+await p.locator('.cake-closeup').evaluate(e=>e.style.getPropertyValue('--lean-angle')),fill=+await p.locator('[role=meter]').getAttribute('aria-valuenow');assert.equal(angle===0&&Math.abs(+s.slide)<.5,fill===100);assert.equal(+await p.locator('.cake-miniature').evaluate(e=>e.style.getPropertyValue('--lean-angle')),angle);const expected=s.support;if(expected){const target=p.locator('[data-action="recover-'+expected+'"]');assert.equal(await target.getAttribute('data-correct'),'true');assert.equal(await target.evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(255, 211, 68)');const edge=await p.locator('.r33-tray').evaluate(e=>getComputedStyle(e,e.dataset.warning==='left'?'::before':'::after').backgroundColor);assert.equal(edge,'rgb(213, 74, 50)');}}
 if(kind==='crossing'){if(!baseline){await assertObservation(p);await assertMainScene(p);}assert.equal(await p.locator('.depart-reasons').isVisible(),false);const hints=await p.locator('#content-hint').innerText();if(hints)assert.equal(text.split(hints).length-1,1,'one primary sentence');}
 const clipping=await p.locator('#content-r1').evaluate(root=>{const bad=[],w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);while(w.nextNode()){const n=w.currentNode,e=n.parentElement;if(!n.textContent.trim()||e.closest('svg'))continue;let visible=true;for(let a=e;a;a=a.parentElement){const c=getComputedStyle(a);if(a.hidden||c.display==='none'||c.visibility==='hidden')visible=false;}if(!visible)continue;const range=document.createRange();range.selectNodeContents(n);for(const r of range.getClientRects()){if(!r.width||!r.height)continue;if(r.x<-.6||r.y<-.6||r.right>innerWidth+.6||r.bottom>innerHeight+.6)bad.push(n.textContent);for(let a=e;a&&a!==document.body;a=a.parentElement){const c=getComputedStyle(a),b=a.getBoundingClientRect();if((['clip','hidden','auto','scroll'].includes(c.overflowX)&&(r.x<b.x-1||r.right>b.right+1))||(['clip','hidden','auto','scroll'].includes(c.overflowY)&&(r.y<b.y-1||r.bottom>b.bottom+1)))bad.push(n.textContent);}}}return [...new Set(bad)];});if(clipping.length)await p.screenshot({path:out+'/diagnostic-'+name+'.png'});assert.deepEqual(clipping,[],name+' text clipping');
 let geometry={};
 if(kind==='cake'&&await phase(p)==='playing')geometry=await p.locator('.content-scene').evaluate(root=>{const box=e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height};};const car=box(root.querySelector('.content-carrier')),tray=box(root.querySelector('.r33-tray')),cake=box(root.querySelector('.cake-miniature .cake-rigid'));return {car,tray,cake,displacement:cake.x+cake.w/2-tray.x-tray.w/2,angle:root.querySelector('.cake-miniature').style.getPropertyValue('--lean-angle'),road:root.querySelector('.cake-road-view').style.getPropertyValue('--r32-road-image'),pan:root.querySelector('.cake-road-view').style.getPropertyValue('--bay-pan')};});

 if(kind==='crossing'){
  geometry=await p.locator('.content-scene').evaluate(root=>{const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};},visible=e=>e&&!e.hidden&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden',line=root.querySelector('.r33-stop-line'),actors=[...root.querySelectorAll('.content-walker,.crossing-waiting [data-waiting],.crossing-arrived [data-arrived-friend]')].filter(visible),markers=[line,root.querySelector('.crossing-traffic:not([hidden]) b')].filter(visible),overlap=(a,b)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));return {line:visible(line)?rect(line):null,car:rect(root.querySelector('.crossing-traffic')),actors:actors.map(rect),overlaps:markers.flatMap(m=>actors.map(c=>overlap(rect(m),rect(c)))).filter(n=>n>0)};});assert.deepEqual(geometry.overlaps,[],name+' markers must not overlap people');if(geometry.line){const l=geometry.line,c=geometry.car;assert.ok(l.x+l.w<=c.x||c.x+c.w<=l.x,name+' line ahead of car');}
 }
 if(kind==='crossing'){
  const road=CROSSING_ROADS[+await p.locator('#content-r1').getAttribute('data-stage')];
  const lane=await p.locator('.crossing-traffic').evaluate(e=>({visible:!e.hidden,lane:e.dataset.lane,source:e.dataset.source,heading:e.dataset.heading,top:parseFloat(e.style.top),height:e.getBoundingClientRect().height,scene:e.parentElement.getBoundingClientRect().height,scale:e.querySelector('img').style.scale}));
  if(lane.visible){
   const east=lane.source==='left';assert.equal(lane.lane,east?'lower':'upper');assert.equal(lane.heading,east?'right':'left');assert.equal(lane.scale,east?'1':'-1 1');
   assert.ok(east?lane.top>road.center:lane.top+lane.height/lane.scene*100<road.center,name+' full car in right-hand lane');
   assert.ok(lane.top>=road.top&&lane.top+lane.height/lane.scene*100<=road.bottom,name+' car within road');
   const thumb=p.locator('.r30-side-views section[data-car=true] .r32-road-thumb');if(await thumb.count())assert.equal(await thumb.getAttribute('data-lane'),lane.lane);else if(!baseline)assert.equal(await p.locator('.r30-side-views section[data-side='+lane.source+']').getAttribute('data-observed'),'false');
  }
  if(await p.locator('.r35-observation').isVisible()){
   const zoom=await p.locator('.r35-observation').evaluate(e=>({height:e.getBoundingClientRect().height,scene:e.parentElement.clientHeight,background:getComputedStyle(e.querySelector('.r35-zoom-road')).backgroundImage}));
   assert.ok(zoom.height>=zoom.scene*.5);assert.match(zoom.background,/crossing-(harbor|banyan|lighthouse)/);geometry.observation=zoom;
   const lanes=await p.locator('.r35-zoom-road').evaluate(e=>{const im=e.querySelector('img');return im?{top:parseFloat(im.style.top),height:parseFloat(im.style.height),laneTop:+e.dataset.laneTop,laneBottom:+e.dataset.laneBottom}:null;});
   if(lanes)assert.ok(lanes.top>=lanes.laneTop&&lanes.top+lanes.height<=lanes.laneBottom,'enlarged car entirely in the same right-hand lane');
  }
  geometry.lane=lane;geometry.player=await p.locator('.content-coach').evaluate(e=>{const b=e.getBoundingClientRect(),s=e.parentElement.getBoundingClientRect();return {translate:e.style.translate,rotate:e.style.rotate,scale:e.style.scale,joined:e.dataset.joined==='true',heading:e.dataset.heading,asset:e.getAttribute('src'),centerY:(b.y+b.height/2-s.y-3)/(s.height-6)*100,top:(b.y-s.y-3)/(s.height-6)*100,bottom:(b.bottom-s.y-3)/(s.height-6)*100};});
  if(await phase(p)==='departing'){assert.ok(geometry.player.centerY>road.center,name+' player turns into lower eastbound lane');geometry.exitArrow=await p.locator('.crossing-exit-path path').nth(1).getAttribute('d');assert.match(geometry.exitArrow,new RegExp('M72 '+((road.center+road.bottom)/2)+' '));if(name.includes('joined-right-lane')||name.includes('right-turn-lower-lane'))assert.equal(geometry.player.joined,true);if(geometry.player.joined){assert.equal(geometry.player.heading,'right');assert.match(geometry.player.asset,/traffic-car/);assert.ok(geometry.player.top>=road.center&&geometry.player.bottom<=road.bottom,name+' entire joined player car within lower lane');}}
  if(await phase(p)==='done'){
   geometry.finale=await p.locator('.content-scene').evaluate(e=>{const b=e.getBoundingClientRect(),f=e.querySelector('.content-finale'),r=f.getBoundingClientRect();return {inset:[r.x-b.x,r.y-b.y,b.right-r.right,b.bottom-r.bottom],borders:['Left','Top','Right','Bottom'].map(side=>parseFloat(getComputedStyle(e)['border'+side+'Width'])),pictures:f.querySelectorAll('img').length,panorama:getComputedStyle(e.querySelector('.crossing-panorama')).display};});
   assert.equal(geometry.finale.panorama,'none');assert.equal(geometry.finale.pictures,1);assert.deepEqual(geometry.finale.inset,geometry.finale.borders,'one painting covers the entire inner frame');
  }
 }
 if(kind==='tickets'&&await phase(p)==='boarding'){
  const seats=await p.locator('.r32-cabin [data-seated=true]').count();
  if(s.doorStage==='boarding'){const ring=await p.locator('[data-action=escort] .hold-progress').boundingBox();assert.ok(ring.width>=52&&ring.height>=52,'visible progress ring on escort button');}assert.equal(await p.locator('.ticket-counts').innerText(),'已入座 '+seats+'/3 人');
  for(const im of await p.locator('.r32-cabin [data-seated=true] img').all())assert.match(await im.getAttribute('src'),/content-r33.*seated/);
  assert.equal(await p.locator('.ticket-seats').isVisible(),false,'no external clone');assert.match(await p.locator('.r33-cabin-caption').innerText(),/號月台/);if(s.escortWaiting==='true'&&s.doorStage==='boarding'){assert.equal(await p.locator('.r35-standing').getAttribute('data-waiting'),'true');assert.equal(await p.locator('.r35-standing').getAttribute('aria-valuenow'),String(Math.round(+s.escortStable/.65*100)));}
 }
 if(kind==='cake'&&await phase(p)==='playing'){
  const matrices=await p.locator('.cake-rigid').evaluateAll(es=>es.filter(e=>e.getClientRects().length&&!e.closest('.cake-upright')).map(e=>{const m=new DOMMatrix(getComputedStyle(e).transform);return Math.atan2(m.b,m.a)*180/Math.PI;}));
  assert.ok(matrices.every(v=>Math.abs(v-parseFloat(s.stateAngle))<.01),name+' actual cake rotation equals readout');geometry.rotation=matrices;
 }
 if(kind==='tickets'&&await phase(p)==='boarding'){
  const people=await p.locator('.r35-queue img,.r32-cabin-friend img').count();assert.equal(people,3,'each friend visible once');
  const ghost=await p.locator('.r35-queue button').evaluateAll(es=>es.filter(e=>getComputedStyle(e).opacity!=='1'||getComputedStyle(e).filter!=='none'));assert.deepEqual(ghost,[],'no translucent queue');
 }
 if(kind==='crossing')geometry.observationCards=await p.locator('.r30-side-views section').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {side:e.dataset.side,observed:e.dataset.observed,x:r.x,y:r.y,width:r.width,height:r.height,text:e.innerText,images:e.querySelectorAll('img').length};}));
 const audio=await p.evaluate(()=>({harness:window.__silentTestAudio,speech:speechSynthesis.speaking,pending:speechSynthesis.pending,media:[...document.querySelectorAll('audio,video')].map(e=>({muted:e.muted,paused:e.paused,volume:e.volume})),calls:window.__r37AudioChecks}));
 if(!baseline){assert.equal(audio.harness?.suppressed,true);assert.equal(audio.speech,false);assert.equal(audio.pending,false);assert.ok(audio.media.every(e=>e.paused||e.muted));}
 const path=folder+'/'+name+'.png';await p.screenshot({path});const bytes=await readFile(path);shots.push({path,width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),sha256:createHash('sha256').update(bytes).digest('hex'),state:s,text,controls,clipping,geometry,audio});return s;
}
async function assertMainScene(p){
 const s=await state(p),source=s.trafficSource,phaseNow=await phase(p);
 const main=p.locator('.crossing-traffic'),side=p.locator('.r30-side-views section[data-side='+source+']');
 if(['playing','departing'].includes(phaseNow)){
  const observed=await side.getAttribute('data-observed');
  assert.equal(await main.isVisible(),phaseNow==='playing'&&s.trafficActive==='true'&&observed==='true','main scene and observation card reveal together');
  for(const direction of ['left','right'])assert.equal(await p.locator('.r37-sight[data-side='+direction+']').isVisible(),await p.locator('.r30-side-views section[data-side='+direction+']').getAttribute('data-observed')==='false','same unknown mask in main scene');
  const coach=p.locator('.content-coach');assert.equal(await coach.getAttribute('data-appearance-id'),'alu-deep-blue-r11');assert.match(await coach.getAttribute('src'),/content-r11\/car-rear/);assert.equal(await p.locator('.r37-you').innerText(),'你');
 }
}
async function assertObservation(p){
 const rows=await p.locator('.r30-side-views section').evaluateAll(es=>es.map(e=>({side:e.dataset.side,observed:e.dataset.observed,text:e.innerText,car:e.dataset.car,confirmed:e.dataset.confirmed,images:e.querySelectorAll('img').length,background:getComputedStyle(e.querySelector('.r32-road-thumb')).backgroundImage,marks:getComputedStyle(e.querySelector('.r32-road-thumb'),'::after').display})));
 for(const r of rows)if(r.observed==='false'){assert.doesNotMatch(r.text,/淨空|有車|來車|接近|通過|離開|停在線前|讓行|我看過|✓/);assert.match(r.text,/還沒看/);assert.equal(r.images,0);assert.equal(r.car,'false');assert.equal(r.confirmed,'false');assert.equal(r.background,'none');assert.equal(r.marks,'none');}else {assert.equal(r.observed,'true');if(r.car==='true'){assert.equal(r.confirmed,'false');assert.doesNotMatch(r.text,/✓|我看過/);}}
}
async function enter(p,kind,stage=0){await p.locator('#content-start').click();await p.locator(`[data-content=${kind}]`).click();if(await phase(p)==='done')await tap(p,'replay');if(stage)await p.locator(`[data-stage-choice="${stage}"]`).click();await shot(p,`phone-${kind}-select-stations`);await tap(p,'practice');await shot(p,`phone-${kind}-opening`);}
async function save(p,kind){assert.equal(await phase(p),'done');await shot(p,`phone-${kind}-complete`);const saved=await p.evaluate(k=>JSON.parse(localStorage.getItem('island-transport:student:v2')).sections.contentR1[k],kind);assert.equal(saved.completed,true);assert.equal(saved.contentVersion,33);assert.deepEqual(saved.visited.slice().sort(),[0,1,2]);await p.locator('#content-back').click();await p.reload();await p.locator('#content-start').click();await p.locator(`[data-content=${kind}]`).click();assert.equal(await phase(p),'done');assert.deepEqual(await p.evaluate(k=>JSON.parse(localStorage.getItem('island-transport:student:v2')).sections.contentR1[k],kind),saved);await shot(p,`phone-${kind}-saved`);await tap(p,'replay');await shot(p,`phone-${kind}-replay-new-conditions`);await tap(p,'practice');await shot(p,`phone-${kind}-replay-opening`);assert.equal((await state(p)).layoutSeed,'1');if(kind==='crossing'&&scope!=='offline'&&!baseline)await crossing(p,true);await p.locator('#content-back').click();ok(kind+' completed all stations; exact save reload and actual replay opening',saved);}
async function cake(p){await enter(p,'cake');await tap(p,'magnify');
 // Real wrong support, continued speed and late brake; no model injection.
 await keys(p,['go']);await tick(p,1800);const initial=await shot(p,'phone-cake-before-wrong');
 await keys(p,['go','recover-left']);await tick(p,900);const wrong=await shot(p,'phone-cake-wrong-support');assert.ok(Math.abs(+wrong.balanceLean)>Math.abs(+initial.balanceLean));
 await tick(p,1200);const edge=await shot(p,'phone-cake-late-brake-edge');assert.equal(edge.edge,'true');assert.ok(Math.abs(+edge.slide)>24);
 await keys(p,['brake','recover-right']);await until(p,s=>Math.abs(+s.balanceLean)<.4&&Math.abs(+s.slide)<.4&&+s.speed===0);await keys(p,[]);await tick(p,200);await shot(p,'phone-cake-rescued');assert.equal(await p.locator('[role=meter]').getAttribute('aria-valuenow'),'100');ok('wrong direction worsens, late brake slides to edge, opposite support rescues to 100');
 for(let stage=0;stage<3;stage++){
  const captured=new Set();
  if(stage>0){
   const turn='left',wrong=turn==='left'?'recover-right':'recover-left';
   await keys(p,['go',turn]);await until(p,s=>+s.speed>=4,8000,32);await shot(p,`phone-cake-stage-${stage+1}-high-speed`);
   await keys(p,['go',turn,wrong]);await until(p,s=>s.edge==='true',12000,32);await shot(p,`phone-cake-stage-${stage+1}-tray-edge`);
   const lean=+(await state(p)).balanceLean;await keys(p,['brake',lean>0?'recover-left':'recover-right']);await until(p,s=>Math.abs(+s.balanceLean)<.4&&Math.abs(+s.slide)<.4&&+s.speed===0);await keys(p,[]);await shot(p,`phone-cake-stage-${stage+1}-stopped`);
  }else{await shot(p,'phone-cake-stage-1-stopped');}
  for(let i=0;i<3500&&await phase(p)==='playing';i++){
   const s=await state(p),lean=+s.balanceLean,dist=+s.distance,ids=[];
   if(stage===2&&dist>=42&&s.bayStopped==='false'||dist>=55)ids.push('brake');
   else if(s.bayStopped==='true'&&s.bayRestarted==='false'){if(s.restReady==='true')ids.push('go');}
   else if(s.inBend==='true')ids.push(+s.bend>0?'right':'left');else ids.push('go');
   if(Math.abs(lean)>1){ids.push(lean>0?'recover-left':'recover-right');if(Math.abs(lean)>9)ids.push('brake');}
   const key=s.cakeStage;
   if(stage===1&&s.inBend==='true'&&!captured.has('bend-'+s.bend)){await shot(p,`phone-cake-stage-2-bend-${s.bend}`);captured.add('bend-'+s.bend);}
   if(stage===2&&['parked','leaving','main-road'].includes(key)&&!captured.has(key)&&(key!=='leaving'||+s.bayExit>.46)){await shot(p,`phone-cake-bay-${key}`);captured.add(key);const b=await p.locator('.content-carrier').boundingBox(),r=await p.locator('.cake-road-view').boundingBox();assert.ok(b.x>=r.x&&b.x+b.width<=r.x+r.width);const cake=await p.locator('.cake-miniature .cake-rigid').boundingBox();assert.ok(cake.y>=r.y&&cake.y+cake.height<=r.y+r.height,'roof cake fully visible');}
   await keys(p,[...new Set(ids)]);await tick(p,96);
  }
  await keys(p,[]);assert.equal(await phase(p),'delivering','cake '+JSON.stringify(await state(p)));await tick(p,1800);await shot(p,`phone-cake-stage-${stage+1}-finished`);if(stage===2)assert.equal(captured.size,3);if(stage<2)await tap(p,'next');
 }await save(p,'cake');
}
async function crossing(p,resume=false){if(!resume)await enter(p,'crossing');const snap=(p,name)=>shot(p,resume?name.replace('phone-crossing','phone-crossing-mirror'):name);
 for(let stage=0;stage<3;stage++){
  await tap(p,'depart');assert.equal(await phase(p),'playing');await snap(p,`phone-crossing-stage-${stage+1}-unsafe-start`);await snap(p,`phone-crossing-stage-${stage+1}-unobserved`);
  await keys(p,['brake']);await until(p,s=>+s.speed===0);await keys(p,[]);const source=(await state(p)).trafficSource;await tap(p,'look-'+source);
  await snap(p,`phone-crossing-stage-${stage+1}-car-approach`);await tick(p,1450);await snap(p,`phone-crossing-stage-${stage+1}-only-source-main`);await tick(p,850);await snap(p,`phone-crossing-stage-${stage+1}-car-passing`);await until(p,s=>+s.trafficTime>[2.8,3.8,3.2][stage]*.83);await snap(p,`phone-crossing-stage-${stage+1}-car-leaving`);await until(p,s=>s.trafficActive==='false');await snap(p,`phone-crossing-stage-${stage+1}-car-left`);await tap(p,'look-'+(source==='left'?'right':'left'));
  const captured=new Set();
  for(let n=0;n<1500&&+(await state(p)).crossed<3;n++){
   const s=await state(p),who=s.person,key=`${stage+1}-${who}`;
   if(+s.crossTime>0&&!captured.has(key+'start')){await snap(p,`phone-crossing-${key}-before`);captured.add(key+'start');}
   const progress=+s.crossTime/+s.crossDuration;
   if(who==='grandma'&&progress>.32&&progress<.46&&!captured.has('grandma-a')){await snap(p,`phone-crossing-stage-${stage+1}-grandma-waiting-a`);captured.add('grandma-a');}
   if(who==='grandma'&&progress>.70&&progress<.84&&!captured.has('grandma-b')){await snap(p,`phone-crossing-stage-${stage+1}-grandma-waiting-b`);captured.add('grandma-b');}

   if(progress>.46&&progress<.70&&!captured.has(key+'middle')){await tap(p,'depart');await snap(p,`phone-crossing-${key}-on-zebra`);assert.equal(await phase(p),'playing');assert.match(await p.locator('#content-hint').innerText(),/等.+走到對岸/);captured.add(key+'middle');}
   for(const who of ['child','bike','grandma'])if(await p.locator(`[data-arrived-friend=${who}]`).count()&&!captured.has(who+'arrived')){await snap(p,`phone-crossing-${stage+1}-${who}-arrived`);captured.add(who+'arrived');}
   if(s.newTraffic==='true'&&!captured.has('new')){assert.ok(s.staleSide);assert.equal(s[s.staleSide==='left'?'lookedLeft':'lookedRight'],'false');await snap(p,`phone-crossing-stage-${stage+1}-new-car-yields`);const car=await p.locator('.content-coach').evaluate(e=>e.style.translate);await tap(p,'depart');assert.equal(await phase(p),'playing');assert.equal(await p.locator('.content-coach').evaluate(e=>e.style.translate),car);await snap(p,`phone-crossing-stage-${stage+1}-new-car-blocked`);captured.add('new');}
   if(s.staleSide&&s.trafficActive==='false'){await snap(p,`phone-crossing-stage-${stage+1}-clear-needs-recheck`);const other=s.staleSide==='left'?'right':'left';assert.equal(s[other==='left'?'lookedLeft':'lookedRight'],'true');await tap(p,'look-'+s.staleSide);assert.equal((await state(p)).staleSide,'');await snap(p,`phone-crossing-stage-${stage+1}-recheck-restored`);}
   else if(+s.crossTime===0&&!s.staleSide){if(s.lookedLeft==='false')await tap(p,'look-left');if(s.lookedRight==='false')await tap(p,'look-right');}
   await tick(p,96);
  }
  for(const who of ['child','bike','grandma'])if(!captured.has(who+'arrived'))await snap(p,`phone-crossing-${stage+1}-${who}-arrived`);
  assert.equal((await state(p)).crossed,'3');await snap(p,`phone-crossing-stage-${stage+1}-ready`);await tap(p,'depart');await tick(p,80);await snap(p,`phone-crossing-stage-${stage+1}-turning-right`);await tick(p,240);await snap(p,`phone-crossing-stage-${stage+1}-departing`);await tick(p,350);await snap(p,`phone-crossing-stage-${stage+1}-joined-right-lane`);await tick(p,1800);assert.ok(['checkpoint','done'].includes(await phase(p)));await snap(p,`phone-crossing-stage-${stage+1}-finished`);if(stage<2)await tap(p,'next');
 }if(!resume)await save(p,'crossing');}
async function ticketApproach(p){await p.getByRole('button',{name:(await state(p)).targetName+'月台',exact:true}).click();await keys(p,['go']);await until(p,s=>+s.distance>=28);await keys(p,['brake']);await until(p,s=>+s.speed===0);await keys(p,[]);await tap(p,'door');await until(p,s=>s.doorStage==='awaiting');}
async function tickets(p){await enter(p,'tickets');
 for(let stage=0;stage<3;stage++){
  const target=(await state(p)).targetName,buttons=await p.locator('[data-platform]').evaluateAll(es=>es.map(e=>({id:e.dataset.platform,name:e.getAttribute('aria-label')})));
  for(const b of buttons.filter(b=>b.name!==target+'月台')){await p.locator(`[data-platform="${b.id}"]`).click();await tick(p);const rows=await p.locator('.r32-compare-row').allTextContents();await shot(p,`phone-tickets-stage-${stage+1}-${rows[0].includes('不同')?'wrong-shape':'wrong-color'}`);assert.equal(await p.locator('[data-platform][data-hint=true]').count(),0);}
  await ticketApproach(p);
  for(let n=0;n<3;n++){
   await shot(p,`phone-tickets-stage-${stage+1}-invitation-${n}`);assert.equal(await p.locator('.r35-queue button:not([disabled])').count(),1);await tapLocator(p,p.locator(`.r35-queue [data-passenger="${n}"]`));await tick(p);assert.match(await a(p,'board').innerText(),new RegExp(['小安','小晴','小宇'][n]));await tap(p,'board');
   await keys(p,['escort']);await until(p,s=>s.escortWaiting==='true',20000,16);await shot(p,`phone-tickets-stage-${stage+1}-hold-start-${n}`);
   await tick(p,288);const mid=await shot(p,`phone-tickets-stage-${stage+1}-hold-half-${n}`);assert.ok(+mid.escortStable>.25&&+mid.escortStable<.4);
   await keys(p,[]);await tick(p,64);const paused=await shot(p,`phone-tickets-stage-${stage+1}-hold-paused-${n}`);assert.ok(+paused.escortBump>0);assert.equal(await p.locator(`[data-cabin-friend="${n}"]`).getAttribute('data-pose'),'balancing');
   await tick(p,800);const frozen=await state(p);assert.equal(frozen.escortStable,paused.escortStable);assert.equal(frozen.boardTime,paused.boardTime);
   await keys(p,['escort']);await until(p,s=>+s.escortStable>=.65,3000,16);await shot(p,`phone-tickets-stage-${stage+1}-hold-full-${n}`);assert.equal(await p.locator(`[data-cabin-friend="${n}"]`).getAttribute('data-pose'),'standing');
   await tick(p,700);await shot(p,`phone-tickets-stage-${stage+1}-walking-${n}`);
   await until(p,s=>s.doorStage!=='boarding');await keys(p,[]);await shot(p,`phone-tickets-stage-${stage+1}-seated-${n+1}`);assert.equal(await p.locator('.r32-cabin [data-seated=true]').count(),n+1);
  }
  await tap(p,'retract');await until(p,s=>s.doorStage==='close-ready');await tap(p,'close-door');await until(p,s=>s.doorStage==='closed');await tap(p,'train-depart');await shot(p,`phone-tickets-stage-${stage+1}-closed-departing`);await tick(p,1800);if(stage<2)await tap(p,'next');
 }await save(p,'tickets');}
async function layoutRightTurn(p,w,h){
 for(let stage=0;stage<3;stage++){
  await keys(p,['brake']);await until(p,s=>+s.speed===0);await keys(p,[]);
  for(let i=0;i<1000&&+(await state(p)).crossed<3;i++){
   const s=await state(p);
   if(s.staleSide&&s.trafficActive==='false')await tap(p,'look-'+s.staleSide);
   else if(+s.crossTime===0&&!s.staleSide){if(s.lookedLeft==='false')await tap(p,'look-left');if(s.lookedRight==='false')await tap(p,'look-right');}
   await tick(p,96);
  }
  assert.equal((await state(p)).crossed,'3');await tap(p,'depart');await tick(p,900);
  assert.equal(await phase(p),'departing');await shot(p,`device-${w}x${h}-stage-${stage+1}-right-turn-lower-lane`,out+'/layout');
  await tick(p,800);if(stage<2)await tap(p,'next');
 }
 assert.equal(await phase(p),'done');await shot(p,`device-${w}x${h}-crossing-single-background`,out+'/layout');
}
let success=false;
try{
 if(['all','cake','crossing','tickets','offline'].includes(scope)){const {p,c}=await make();if(scope==='offline'){await p.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(r=>navigator.serviceWorker.addEventListener('controllerchange',r,{once:true}));});await c.setOffline(true);await p.reload();ok('offline service-worker reload');}if(['all','cake','offline'].includes(scope))await cake(p);if(['all','crossing','offline'].includes(scope))await crossing(p);if(['all','tickets','offline'].includes(scope))await tickets(p);await c.close();}
 else if(scope==='layout')for(const [w,h] of [[320,568],[568,320],[390,844],[844,390],[768,1024],[1024,768],[1366,600],[1280,640]]){const {p,c}=await make(w,h);for(const kind of ['cake','crossing','tickets']){await enter(p,kind);await shot(p,`device-${w}x${h}-${kind}-playing`,out+'/layout');if(kind==='tickets'){await ticketApproach(p);await tapLocator(p,p.locator('.r35-queue [data-passenger="0"]'));await tap(p,'board');await keys(p,['escort']);await tick(p,1000);await keys(p,[]);await shot(p,`device-${w}x${h}-cabin`,out+'/layout');}if(kind==='crossing')await layoutRightTurn(p,w,h);await p.locator('#content-back').click();}await c.close();ok('responsive '+w+'x'+h);}
 else if(scope==='store')for(const [w,h,dpr] of [[430,932,3],[1032,1376,2]]){const {p,c}=await make(w,h,dpr);await enter(p,'crossing',1);await keys(p,['brake']);await until(p,s=>+s.speed===0);await keys(p,[]);await tap(p,'look-'+(await state(p)).trafficSource);await shot(p,`crossing-observation-${w*dpr}x${h*dpr}`,'docs/store/screenshots/content-r37');await c.close();ok('store '+w*dpr+'x'+h*dpr);}
 else if(scope==='performance'){const rows=[];for(const [w,h] of [[390,844],[768,1024],[1366,600]]){const c=await browser.newContext({viewport:{width:w,height:h}}),p=await c.newPage();await p.goto(base);await p.locator('#content-start').click();await p.locator('[data-content=cake]').click();await a(p,'practice').click();const b=await a(p,'go').boundingBox();await p.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.mouse.down();const runs=[];for(let i=0;i<3;i++)runs.push(await p.evaluate(()=>new Promise(resolve=>{const samples=[];let last=performance.now();function frame(now){samples.push(now-last);last=now;if(samples.length===180){const s=samples.slice(10).sort((a,b)=>a-b);resolve({p95:s[Math.floor(s.length*.95)],max:s.at(-1)});}else requestAnimationFrame(frame);}requestAnimationFrame(frame);})));await p.mouse.up();const p95=runs.map(r=>r.p95).sort((a,b)=>a-b)[1];rows.push({w,h,p95,runs});await c.close();}await writeFile(out+'/performance.json',JSON.stringify({status:rows.every(r=>r.p95<=18)?'VERIFIED':'BLOCKED',method:'concurrent workstation RAF; three samples x180 frames per viewport',rows},null,2));}
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);success=true;
}finally{await browser.close();const sourceFingerprint={};for(const f of ['src/shared/content-r31.js','tests/shared/content-r31.test.js','src/shared/content-r31-scene.js','src/shared/content-r32-scene.js','src/shared/content-r1-ui.js','src/shared/content-r35.js','src/shared/content-r35-scene.js','src/shared/content-r35-ui.js','src/shared/content-r35.css','scripts/check-content-r37-reference.mjs','src/shared/content-r37-scene.js','src/shared/content-r37-ui.js','src/shared/content-r37.css','scripts/playwright-cpu-r34.mjs'])sourceFingerprint[f]=createHash('sha256').update(await readFile(f)).digest('hex');assert.deepEqual(sourceFingerprint,startedFingerprint,'tested source files changed during the run');await writeFile(out+'/browser-'+scope+'.json',JSON.stringify({status:success?'VERIFIED':'EXECUTED',sourceFingerprint,checks,shots,errors,external},null,2));}
console.log('VERIFIED '+checks.length+' checks, '+shots.length+' raw captures');
