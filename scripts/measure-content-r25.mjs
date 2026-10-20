import {pathToFileURL} from 'node:url';
import {writeFile} from 'node:fs/promises';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href),renderArgs=['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist'],browser=await chromium.launch({headless:true,args:renderArgs}),rows=[];
const base=process.env.BASE_URL||'http://127.0.0.1:5286/',a=(p,id)=>p.locator(`[data-action="${id}"]`);
async function down(p,id){const b=await a(p,id).boundingBox();await p.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.mouse.down();}
async function hold(p,id,ms){await down(p,id);await p.waitForTimeout(ms);await p.mouse.up();}
try{
 for(const [viewport,width,height] of [['desktop',1366,768],['portrait',390,844],['landscape',844,390]])for(const kind of ['cake','crossing','tickets']){
  const runs=[];for(let run=0;run<3;run++){
   const c=await browser.newContext({viewport:{width,height},hasTouch:true}),p=await c.newPage();await p.goto(base);await p.locator('#content-start').click();await p.locator(`[data-content=${kind}]`).click();await a(p,'begin').click();
   if(kind==='cake'){await hold(p,'go',700);await p.waitForTimeout(150);const lean=await p.locator('.content-scene').getAttribute('data-balance-lean');await down(p,+lean>0?'recover-left':'recover-right');}
   if(kind==='crossing'){await hold(p,'brake',1500);await a(p,'look-left').click();await a(p,'look-right').click();}
   if(kind==='tickets'){const target=await p.locator('.content-scene').getAttribute('data-target-name');await p.getByRole('button',{name:target+'月台',exact:true}).click();await hold(p,'go',5700);await hold(p,'brake',1600);await a(p,'door').click();await p.locator('[data-passenger="0"]').waitFor();await p.locator('[data-passenger="0"]').click();await a(p,'board').click();await down(p,'escort');}
   const p95=await p.evaluate(()=>new Promise(resolve=>{const values=[];let last=0,start=0;function frame(t){if(last)values.push(t-last);last=t;start||=t;if(t-start<2000)requestAnimationFrame(frame);else{values.sort((a,b)=>a-b);resolve(+values[Math.floor(values.length*.95)].toFixed(1));}}requestAnimationFrame(frame);}));runs.push(p95);await p.mouse.up();await c.close();
  }
  const p95=[...runs].sort((a,b)=>a-b)[1];rows.push({viewport,kind,runs,p95});console.log(`${viewport} ${kind}: ${p95}ms`);
 }
}finally{await browser.close();await writeFile('docs/content/r25/performance.json',JSON.stringify({status:rows.length===9&&rows.every(r=>r.p95<=18)?'VERIFIED':'BLOCKED',renderArgs,method:'Same D3D11 browser rendering arguments as the required merge/store regressions. Three real 2000ms RAF samples per lesson/viewport; median p95. Concurrent host load, one browser/context at a time; reference only, not clean hardware or native-device performance.',limitMs:18,rows},null,2));}
if(rows.length!==9||rows.some(r=>r.p95>18))process.exitCode=1;
