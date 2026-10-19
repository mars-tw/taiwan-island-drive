import {pathToFileURL} from 'node:url';
import {writeFile} from 'node:fs/promises';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE||'C:/Users/digimkt/Desktop/遊戲/storm-apocalypse/node_modules/playwright/index.mjs').href);
const base=process.env.BASE_URL||'http://127.0.0.1:5286/',rows=[];
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']});
const a=(p,id)=>p.locator(`[data-action=${id}]`);
async function down(p,id){const b=await a(p,id).boundingBox();await p.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.mouse.down();}
async function hold(p,id,ms){await down(p,id);await p.waitForTimeout(ms);await p.mouse.up();}
try{
 for(const [viewport,width,height] of [['desktop',1366,768],['portrait',390,844],['landscape',844,390]])for(const kind of ['cake','crossing','tickets']){
  const runs=[];
  for(let i=0;i<3;i++){
   const context=await browser.newContext({viewport:{width,height},hasTouch:true}),p=await context.newPage();await p.goto(base);await p.locator('#content-start').click();await p.locator(`[data-content=${kind}]`).click();await a(p,'begin').click();
   if(kind==='crossing'){await hold(p,'brake',1500);await a(p,'look-left').click();await a(p,'look-right').click();await p.waitForFunction(()=>+document.querySelector('.content-scene').dataset.crossTime>0);}
   else if(kind==='tickets'){await p.getByRole('button',{name:'藍圓形月台',exact:true}).click();await hold(p,'go',5700);await hold(p,'brake',1600);await a(p,'door').click();await p.waitForFunction(()=>document.querySelector('.content-scene').dataset.doorStage==='awaiting');await p.locator('[data-passenger="0"]').click();await a(p,'board').click();}
   else await down(p,'go');
   const v=await p.evaluate(()=>new Promise(resolve=>{const values=[];let last=0,start=0;function frame(t){if(last)values.push(t-last);last=t;start||=t;if(t-start<2000)requestAnimationFrame(frame);else{values.sort((a,b)=>a-b);resolve(+values[Math.floor(values.length*.95)].toFixed(1));}}requestAnimationFrame(frame);}));runs.push(v);await context.close();
  }
  const p95=[...runs].sort((a,b)=>a-b)[1];rows.push({viewport,kind,activeState:kind==='tickets'?'single-scene serial boarding':kind==='crossing'?'friend crossing zebra':'pedal and cake balance',runs,p95});console.log(`${viewport} ${kind}: median p95 ${p95}ms`);
 }
}finally{await browser.close();await writeFile('docs/content/r20/performance.json',JSON.stringify({status:'EXECUTED',method:'Three real-time 2000ms RAF samples per course/viewport, median p95. R20: each train sample explicitly invites the first rider. Train is measured while the single-scene doorway and passengers are active. One headless browser/context at a time; concurrent host load, reference only, not clean/native performance.',rows,limitMs:18,withinReferenceLimit:rows.length===9&&rows.every(r=>r.p95<=18)},null,2));}
if(rows.length!==9||rows.some(r=>r.p95>18))process.exitCode=1;
