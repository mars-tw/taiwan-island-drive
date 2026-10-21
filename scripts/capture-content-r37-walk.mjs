// Three unobstructed walking frames, public controls only; no state injection.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium} from './playwright-cpu-r34.mjs';
const browser=await chromium.launch({headless:true,args:['--mute-audio']}),shots=[],errors=[];
const c=await browser.newContext({viewport:{width:390,height:844},hasTouch:true}),p=await c.newPage();
p.on('pageerror',e=>errors.push(e.message));
const state=()=>p.locator('.content-scene').evaluate(e=>({...e.dataset}));
const tick=ms=>p.clock.runFor(ms),a=id=>p.locator(`[data-action="${id}"]`);
async function until(fn){for(let i=0;i<1500;i++){if(await fn(await state()))return;await tick(32);}throw Error('walk capture timeout');}
async function tap(id){await a(id).click();await tick(96);}
async function shot(name){
 await p.evaluate(async()=>Promise.all([...document.images].filter(e=>e.getClientRects().length).map(e=>e.decode().catch(()=>{}))));
 assert.equal(await p.locator('.r35-observation').isVisible(),false,'full person visible, no observation overlay');
 const path=`docs/content/r37/phone-crossing-grandma-${name}.png`;await p.screenshot({path});
 shots.push({path,width:390,height:844,sha256:createHash('sha256').update(await readFile(path)).digest('hex'),state:await state()});
}
try{
 await p.clock.install();await p.goto('http://127.0.0.1:5286/');await p.locator('#content-start').waitFor();await p.clock.pauseAt(await p.evaluate(()=>Date.now()+100));
 await p.locator('#content-start').click();await p.locator('[data-content=crossing]').click();await p.locator('[data-stage-choice="1"]').click();await tap('practice');
 const box=await a('brake').boundingBox(),cdp=await c.newCDPSession(p);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2,id:1}]});await until(s=>+s.speed===0);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 const source=(await state()).trafficSource;await tap('look-'+source);await until(s=>s.trafficActive==='false');await tap('look-'+(source==='left'?'right':'left'));
 await until(async s=>s.person==='grandma'&&+s.crossTime/+s.crossDuration>=.3&&!await p.locator('.r35-observation').isVisible());await shot('front');
 await until(s=>+s.crossTime/+s.crossDuration>=.55);await shot('middle');await until(s=>s.crossed==='1');await shot('arrived');
 assert.deepEqual(shots.map(s=>s.state.crossed),['0','0','1']);assert.deepEqual(errors,[]);
}finally{await browser.close();}
const sourceFingerprint={};for(const f of ['src/shared/content-r1-ui.js','src/shared/content-r37-scene.js','src/shared/content-r37-ui.js','src/shared/content-r37.css','scripts/capture-content-r37-walk.mjs'])sourceFingerprint[f]=createHash('sha256').update(await readFile(f)).digest('hex');
await writeFile('docs/content/r37/walk-evidence.json',JSON.stringify({status:'VERIFIED',sourceFingerprint,shots,errors},null,2));
console.log('VERIFIED three unobstructed grandmother frames, arrived count 0/0/1');
