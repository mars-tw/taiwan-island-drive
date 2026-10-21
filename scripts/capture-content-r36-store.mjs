// Actual UI, silent headless CPU rendering, native store dimensions.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium} from './playwright-cpu-r34.mjs';
const base=process.env.BASE_URL||'http://127.0.0.1:5286/';
const out='docs/store/screenshots/content-r36',shots=[];
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--mute-audio']});
try{
 for(const [width,height,dpr] of [[430,932,3],[1032,1376,2]]){
  const c=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,hasTouch:true}),p=await c.newPage();
  await p.clock.install();await p.goto(base);await p.locator('#content-start').waitFor();await p.clock.pauseAt(await p.evaluate(()=>Date.now()+100));
  await p.locator('#content-start').click();await p.locator('[data-content=crossing]').click();await p.locator('[data-action=practice]').click();
  const brake=p.locator('[data-action=brake]'),box=await brake.boundingBox();
  await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.clock.runFor(2500);await p.mouse.up();
  await p.locator('[data-action=look-right]').click();await p.clock.runFor(96);
  const hidden=p.locator('.r30-side-views section[data-side=left]');
  assert.equal(await hidden.getAttribute('data-observed'),'false');assert.doesNotMatch(await hidden.innerText(),/淨空|來車|接近|通過|停在線前|✓/);assert.equal(await hidden.locator('img').count(),0);
  assert.equal(await p.locator('.r30-side-views section[data-side=right]').getAttribute('data-observed'),'true');
  assert.equal(await p.evaluate(()=>speechSynthesis.speaking),false);
  await p.evaluate(async()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));
  const path=`${out}/crossing-look-before-reveal-${width*dpr}x${height*dpr}.png`;
  await p.screenshot({path});const bytes=await readFile(path);
  assert.equal(bytes.readUInt32BE(16),width*dpr);assert.equal(bytes.readUInt32BE(20),height*dpr);
  shots.push({path,width:width*dpr,height:height*dpr,sha256:createHash('sha256').update(bytes).digest('hex'),
   kind:'original headless runtime capture',state:await hidden.innerText(),audio:await p.evaluate(()=>window.__silentTestAudio)});
  await c.close();
 }
}finally{await browser.close();}
await writeFile('docs/content/r36/store-captures.json',JSON.stringify({status:'VERIFIED',sourceVersion:'2.47.1',nativeDevice:false,shots},null,2));
console.log('VERIFIED new crossing store screenshots: 1290x2796 and 2064x2752');
