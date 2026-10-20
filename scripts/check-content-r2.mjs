import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE||'C:/Users/digimkt/Desktop/遊戲/storm-apocalypse/node_modules/playwright/index.mjs').href);
const base=process.env.BASE_URL||'http://127.0.0.1:5286/',out='docs/content/r2',store='docs/store/screenshots/content-r2';
await mkdir(out,{recursive:true});await mkdir(store,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']}),rows=[],shots=[],errors=[],external=[];
let status='EXECUTED';
const a=(p,id)=>p.locator(`[data-action="${id}"]`),phase=p=>p.locator('#content-r1').getAttribute('data-phase');
const check=(label,details={})=>{rows.push({label,status:'VERIFIED',...details});console.log('VERIFIED '+label);};
function watch(p){p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(/^https?:/.test(r.url())&&new URL(r.url()).origin!==new URL(base).origin)external.push(r.url());});}
async function shot(p,name,folder=out){await p.evaluate(async()=>{await Promise.all([...document.images].filter(i=>i.getClientRects().length).map(i=>i.decode().catch(()=>{})));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});const path=`${folder}/${name}.png`;await p.screenshot({path});const b=await readFile(path);shots.push({path,width:b.readUInt32BE(16),height:b.readUInt32BE(20),sha256:createHash('sha256').update(b).digest('hex'),native:false,method:'unmodified headless Chromium runtime screenshot'});}
async function reach(p,label){const bad=await p.locator('#content-r1 button').evaluateAll(es=>es.filter(e=>e.getClientRects().length&&!e.disabled).map(e=>{const r=e.getBoundingClientRect();return {id:e.dataset.action||e.dataset.platform||e.id,size:[r.width,r.height],bad:r.width<59.8||r.height<59.8||r.x<-.5||r.y<-.5||r.right>innerWidth+.5||r.bottom>innerHeight+.5||[[r.x+r.width/2,r.y+r.height/2],[r.x+4,r.y+4],[r.right-4,r.bottom-4]].some(([x,y])=>{const h=document.elementFromPoint(x,y);return h!==e&&!e.contains(h);})};}).filter(x=>x.bad));assert.deepEqual(bad,[],label);check(label);}
async function hold(p,id,ms){const r=await a(p,id).boundingBox();await p.mouse.move(r.x+r.width/2,r.y+r.height/2);await p.mouse.down();await p.waitForTimeout(ms);await p.mouse.up();}
async function down(p,id){const r=await a(p,id).boundingBox();await p.mouse.move(r.x+r.width/2,r.y+r.height/2);await p.mouse.down();}
async function choose(p,kind){await p.locator('#content-start').click();await p.locator(`[data-content=${kind}]`).click();}
async function begin(p,kind){await choose(p,kind);await a(p,'begin').click();}
const record=(p,k)=>p.evaluate(k=>JSON.parse(localStorage.getItem('island-transport:student:v2')).sections.contentR1?.[k],k);
const diag=p=>p.locator('.content-scene').evaluate(e=>({...e.dataset}));
try{
 const sizes=[['se',320,568],['landscape-small',568,320],['phone',390,844],['phone-landscape',844,390],['ipad',768,1024],['ipad-landscape',1024,768],['laptop',1366,600],['laptop-short',1280,640]];
 for(const [name,w,h] of sizes.filter(()=>!process.env.CONTENT_PLAY_ONLY)){const c=await browser.newContext({viewport:{width:w,height:h},hasTouch:true}),p=await c.newPage();watch(p);await p.goto(base);await shot(p,`${name}-home`);
  await p.locator('#content-start').click();await reach(p,`${name} picker`);if(name==='phone')await shot(p,'phone-entry-picker');
  for(const k of ['cake','crossing','tickets']){await p.locator(`[data-content=${k}]`).click();await reach(p,`${name} ${k} ready`);await a(p,'begin').click();await reach(p,`${name} ${k} controls`);await shot(p,`${name}-${k}-playing`);await p.locator('#content-back').click();await p.locator('#content-start').click();}await c.close();
 }
 if(!process.env.CONTENT_SMOKE){
 const c=await browser.newContext({viewport:{width:390,height:844},hasTouch:true}),p=await c.newPage();watch(p);await p.goto(base);await begin(p,'cake');
 await down(p,'go');await p.waitForTimeout(400);await shot(p,'phone-cake-starting-1');const start=+(await diag(p)).tilt;assert.ok(start< -22);await p.mouse.up();
 await hold(p,'go',2900);await a(p,'left').dispatchEvent('keydown',{key:' '});await down(p,'go');await p.waitForTimeout(650);await shot(p,'phone-cake-turning-1');const turn=+(await diag(p)).tilt;await p.mouse.up();await a(p,'left').dispatchEvent('keyup',{key:' '});assert.ok(turn-start>30);
 await down(p,'brake');for(let i=1;i<=3;i++){await p.waitForTimeout(i===1?350:400);await shot(p,`phone-cake-braking-${i}`);}const brake=+(await diag(p)).tilt;await p.mouse.up();assert.ok(brake>5);
 for(let stage=0;stage<3;stage++){
  await shot(p,`phone-cake-stage-${stage+1}`);
  let steering='';for(let n=0;n<32&&+(await diag(p)).distance<55;n++){const d=await diag(p),want=Number(d.distance)>15&&Number(d.distance)<40?(Number(d.bend)>0?'right':'left'):'';if(want!==steering){if(steering)await a(p,steering).dispatchEvent('keyup',{key:' '});if(want)await a(p,want).dispatchEvent('keydown',{key:' '});steering=want;}await hold(p,'go',650);}
  if(steering)await a(p,steering).dispatchEvent('keyup',{key:' '});await hold(p,'brake',1700);await p.waitForFunction(()=>['checkpoint','done'].includes(document.querySelector('#content-r1').dataset.phase));assert.equal((await record(p,'cake')).stage,Math.min(stage+1,2));
  if(stage===0){await p.locator('#content-back').click();await p.reload();await begin(p,'cake');assert.equal(await p.locator('#content-r1').getAttribute('data-stage'),'1');check('cake checkpoint survives reload');}else if(stage<2)await a(p,'next').click();
 }
 assert.equal((await record(p,'cake')).completed,true);await shot(p,'phone-cake-complete');check('cake all three routes through held UI controls',{startTilt:start,turnTilt:turn,brakeTilt:brake});await p.locator('#content-back').click();
 await begin(p,'crossing');await a(p,'depart').click();assert.equal(await phase(p),'playing');await shot(p,'phone-crossing-blocked');
 for(let stage=0;stage<3;stage++){await hold(p,'brake',1400);await a(p,'look-left').click();await a(p,'depart').click();assert.equal(await phase(p),'playing');await a(p,'look-right').click();await a(p,'depart').click();assert.equal(await phase(p),'playing');
  for(let who=0;who<3;who++){if(who>0)await p.waitForFunction(prev=>document.querySelector('.content-walker').dataset.person!==prev,await p.locator('.content-walker').getAttribute('data-person'));
   if(who===0||stage===0){const person=await p.locator('.content-walker').getAttribute('data-person');for(let f=1;f<=3;f++){await p.waitForTimeout(210);await shot(p,`phone-crossing-stage-${stage+1}-${person}-${f}`);}}
  }
  await p.waitForFunction(()=>document.querySelector('[data-action=depart]').dataset.ready==='true',null,{timeout:12000});await shot(p,`phone-crossing-stage-${stage+1}-clear`);await a(p,'depart').click();if(stage<2)await a(p,'next').click();
 }
 assert.equal((await record(p,'crossing')).completed,true);await shot(p,'phone-crossing-complete');check('crossing three friends, distinct paths/poses, early departure gate, three stations persisted');await p.locator('#content-back').click();
 await begin(p,'tickets');const targets=['藍圓形','橘三角形','綠正方形'];
 for(let stage=0;stage<3;stage++){
  const correct=p.getByRole('button',{name:targets[stage]+'月台',exact:true});for(const b of await p.locator('[data-platform]').all())if(await b.getAttribute('aria-label')!==targets[stage]+'月台'){await b.click();break;}
  await hold(p,'go',5800);await hold(p,'brake',1700);await a(p,'door').click();assert.equal(await phase(p),'playing');await shot(p,`phone-tickets-stage-${stage+1}-wrong`);
  await correct.click();await a(p,'door').click();assert.equal(await phase(p),'playing');await hold(p,'go',5800);await a(p,'door').click();assert.equal(await phase(p),'playing');await hold(p,'brake',1700);await shot(p,`phone-tickets-stage-${stage+1}-right`);
  await a(p,'door').click();assert.equal(await phase(p),'boarding');for(let f=1;f<=3;f++){await shot(p,`phone-tickets-stage-${stage+1}-boarding-${f}`);await p.waitForTimeout(300);}await p.waitForFunction(()=>['checkpoint','done'].includes(document.querySelector('#content-r1').dataset.phase));if(stage<2){await shot(p,`phone-tickets-stage-${stage+1}-seated`);await a(p,'next').click();}
 }
 assert.equal((await record(p,'tickets')).completed,true);await shot(p,'phone-tickets-complete');check('tickets wrong/right platforms, stopped doors, boarding before next station, persisted completion');
 await p.locator('#content-back').click();await p.reload();await p.locator('#content-start').click();assert.equal(await p.locator('[data-record]').filter({hasText:'一起完成了'}).count(),3);await shot(p,'phone-save-all-three');await p.locator('#content-back').click();await p.evaluate(()=>navigator.serviceWorker.ready);await p.reload();await p.waitForFunction(()=>!!navigator.serviceWorker.controller);await c.setOffline(true);await p.reload();await choose(p,'crossing');await a(p,'replay').click();await a(p,'begin').click();await hold(p,'brake',1400);await a(p,'look-left').click();await a(p,'look-right').click();await p.waitForFunction(()=>document.querySelector('[data-action=depart]').dataset.ready==='true');await a(p,'depart').click();assert.equal(await phase(p),'checkpoint');await shot(p,'phone-offline-checkpoint');check('reload all completions and real offline first-station playthrough');await c.close();
 const denied=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,reducedMotion:'reduce'});await denied.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw Error('storage disabled');}}));const q=await denied.newPage();watch(q);await q.goto(base);await begin(q,'crossing');await hold(q,'brake',1400);await a(q,'look-left').click();await a(q,'look-right').click();await q.locator('#content-pause').click();const before=await q.locator('.content-walker').getAttribute('style');await q.waitForTimeout(350);assert.equal(await q.locator('.content-walker').getAttribute('style'),before);await shot(q,'phone-paused');await q.locator('#content-resume').click();await q.waitForFunction(()=>document.querySelector('[data-action=depart]').dataset.ready==='true');await a(q,'depart').click();assert.match(await q.locator('#content-save').innerText(),/無法儲存/);await shot(q,'phone-storage-denied');check('pause, reduced motion and denied storage still playable');await denied.close();
 for(const [name,w,h,dpr] of [['iphone',430,932,3],['ipad',1032,1376,2]]){const ctx=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:dpr,hasTouch:true}),s=await ctx.newPage();watch(s);await s.goto(base);for(const k of ['cake','crossing','tickets']){await begin(s,k);if(k==='cake')await hold(s,'go',500);if(k==='crossing'){await hold(s,'brake',1400);await a(s,'look-left').click();await a(s,'look-right').click();}if(k==='tickets')await s.getByRole('button',{name:'藍圓形月台',exact:true}).click();await shot(s,`${name}-${k}`,store);await s.locator('#content-back').click();}await ctx.close();}
 for(const [name,w,h] of [['phone',390,844],['landscape',844,390],['ipad',768,1024]]){const ctx=await browser.newContext({viewport:{width:w,height:h},hasTouch:true}),t=await ctx.newPage();watch(t);await t.goto(base+'train/');await t.locator('#asset-loading').waitFor({state:'hidden',timeout:60000});await t.locator('#child-prepare').click();await t.locator('#child-go').click();await t.waitForTimeout(700);const panels=await t.locator('.scene').evaluate(e=>[...e.children].filter(x=>x.tagName!=='CANVAS'&&x.getClientRects().length&&getComputedStyle(x).display!=='contents').map(x=>x.className));assert.ok(panels.length<=3,JSON.stringify(panels));await shot(t,`${name}-train-driving`);check(`${name} train floating panels <=3`,{panels});await ctx.close();}
 }
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);status='VERIFIED';
}finally{await browser.close();await writeFile(`${out}/browser${process.env.CONTENT_SMOKE?'-smoke':''}.json`,JSON.stringify({status,rows,shots,errors,external},null,2));}
console.log(`VERIFIED ${rows.length} checks / ${shots.length} original screenshots`);
