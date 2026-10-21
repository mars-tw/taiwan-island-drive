import {chromium} from './playwright-cpu-r34.mjs';
import {mkdir} from 'node:fs/promises';
const out='docs/content/r35/before';await mkdir(out,{recursive:true});
const browser=await chromium.launch();
try{const c=await browser.newContext({viewport:{width:390,height:844},hasTouch:true}),p=await c.newPage();
 await p.clock.install();await p.goto('http://127.0.0.1:5286');await p.clock.pauseAt(await p.evaluate(()=>Date.now()+100));
 for(const kind of ['cake','crossing','tickets']){await p.locator('#content-start').click();await p.locator(`[data-content=${kind}]`).click();await p.locator('[data-action=practice]').click();await p.clock.runFor(100);await p.screenshot({path:`${out}/phone-${kind}-playing.png`});await p.locator('#content-back').click();}
}finally{await browser.close();}
