// Deterministic visual regression. These captures are comparison intermediates;
// review-set gameplay proof comes from the independent complete journey run.
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium} from './playwright-cpu-r34.mjs';
const root='docs/content/r36/visual-comparison',rows=[],base=process.env.BASE_URL||'http://127.0.0.1:5286/';
const browser=await chromium.launch({headless:true,args:['--mute-audio']});
async function journey(reference){
 const folder=`${root}/${reference?'r35':'r36'}`;await mkdir(folder,{recursive:true});
 const c=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,serviceWorkers:'block'}),p=await c.newPage(),cdp=await c.newCDPSession(p);
 const when=new Date('2026-10-18T00:00:00.000Z');await p.clock.install({time:when});await p.goto(base+(reference?'r36-reference/':''));await p.locator('#content-start').waitFor();await p.clock.pauseAt(new Date(+when+5000));
 const a=id=>p.locator(`[data-action="${id}"]`),state=()=>p.locator('.content-scene').evaluate(e=>({...e.dataset}));let held=[];
 async function keys(ids){if(held.length)await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});held=ids;if(ids.length){const touchPoints=[];for(let i=0;i<ids.length;i++){const b=await a(ids[i]).boundingBox();touchPoints.push({x:b.x+b.width/2,y:b.y+b.height/2,id:i+1});}await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints});}}
 async function tick(ms=96){await p.clock.runFor(ms);}
 async function tap(id){await keys([]);await a(id).click();await tick();}
 async function enter(kind,stage=0){await p.locator('#content-start').click();await p.locator(`[data-content=${kind}]`).click();if(stage)await p.locator(`[data-stage-choice="${stage}"]`).click();await tap('practice');}
 async function until(fn,max=40000){for(let n=0;n<max;n+=64){if(fn(await state()))return;await tick(64);}throw Error('visual operation timeout');}
 async function shot(name){await p.evaluate(async()=>Promise.all([...document.images].filter(i=>i.getClientRects().length).map(i=>i.decode().catch(()=>{}))));
  const cards=await p.locator('.r30-side-views section').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {side:e.dataset.side,observed:e.dataset.observed,x:r.x,y:r.y,width:r.width,height:r.height};}));
  const presentation=await p.locator('#content-r1').evaluate(root=>{
   const scene=root.querySelector('.content-scene'),unknown=['left','right'].filter(side=>scene.dataset[side==='left'?'lookedLeft':'lookedRight']==='false');
   const normalize=s=>s.replaceAll('/r36-reference/','/'),path=e=>e===root?'root':path(e.parentElement)+'/'+e.tagName+':'+[...e.parentElement.children].indexOf(e);
   return [root,...root.querySelectorAll('*')].filter(e=>{
    const card=e.closest('.r30-side-views section');if(card&&unknown.includes(card.dataset.side))return false;
    const c=getComputedStyle(e);return e.getClientRects().length&&c.display!=='none'&&c.visibility!=='hidden';
   }).map(e=>{const r=e.getBoundingClientRect(),c=getComputedStyle(e),styles={};for(const k of ['display','position','left','right','top','bottom','width','height','transform','translate','rotate','scale','opacity','visibility','background','backgroundImage','backgroundPosition','backgroundSize','border','borderRadius','boxShadow','filter','color','font','lineHeight','textAlign','objectFit','objectPosition','overflow','zIndex','padding','margin','gap','gridTemplateColumns','gridTemplateRows'])styles[k]=normalize(c[k]);return {path:path(e),tag:e.tagName,classes:e.getAttribute('class'),text:[...e.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.textContent).join(''),src:normalize(e.getAttribute('src')||''),rect:[r.x,r.y,r.width,r.height],styles};});
  });
  const path=`${folder}/${name}.png`;await p.screenshot({path,animations:'disabled'});rows.push({reference,name,path,cards,state:await state(),presentation,sha256:createHash('sha256').update(await readFile(path)).digest('hex')});
 }
 await enter('cake');await tap('magnify');await keys(['go']);await tick(1800);await shot('01-cake-moving');await keys(['go','recover-left']);await tick(900);await shot('02-cake-wrong');await tick(1200);await shot('03-cake-edge');await keys(['brake','recover-right']);await until(s=>Math.abs(+s.balanceLean)<.4&&Math.abs(+s.slide)<.4&&+s.speed===0);await keys([]);await tick(200);await shot('04-cake-rescued');await p.locator('#content-back').click();await enter('cake',1);await keys(['go','left']);await tick(2000);await shot('05-cake-second-station');await keys([]);await p.locator('#content-back').click();
 await enter('crossing',1);await keys(['brake']);await until(s=>+s.speed===0);await keys([]);await shot('06-crossing-unobserved');await tap('look-right');await shot('07-crossing-only-right');await tick(400);await shot('08-crossing-right-car');await tap('look-left');await shot('09-crossing-both-observed');await tick(1600);await shot('10-crossing-wait');await p.locator('#content-back').click();
 await enter('tickets',2);const target=(await state()).targetName,buttons=await p.locator('[data-platform]').evaluateAll(es=>es.map(e=>({id:e.dataset.platform,name:e.getAttribute('aria-label')})));
 for(const b of buttons.filter(b=>b.name!==target+'月台')){await p.locator(`[data-platform="${b.id}"]`).click();await tick();const shape=(await p.locator('.r32-compare-row').allTextContents())[0].includes('不同');await shot(shape?'11-tickets-wrong-shape':'12-tickets-wrong-color');}
 await p.getByRole('button',{name:target+'月台',exact:true}).click();await shot('13-tickets-matched');await keys(['go']);await until(s=>+s.distance>=28);await keys(['brake']);await until(s=>+s.speed===0);await keys([]);await tap('door');await until(s=>s.doorStage==='awaiting');await p.locator('.r35-queue [data-passenger="0"]').click();await tap('board');await keys(['escort']);await until(s=>s.escortWaiting==='true');await tick(288);await shot('14-tickets-partial');await keys([]);await tick(64);await shot('15-tickets-paused');await c.close();
}
try{await journey(true);await journey(false);}finally{await browser.close();}
assert.equal(rows.length,30);await writeFile(`${root}/captures.json`,JSON.stringify({status:'EXECUTED',method:'same fixed clock, same public controls, CSS animations disabled only during comparison screenshots; R35 runtime from Git with normalized version label',rows},null,2));
console.log('EXECUTED 15 paired visual states from R35 and R36');
