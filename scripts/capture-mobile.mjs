// Background-only before/after evidence. Reuse the installed Playwright module.
import { pathToFileURL } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const phase = process.argv[2] || 'after';
if (!['before', 'after'].includes(phase)) throw new Error('Use before or after');
const folder = `docs/evidence/r2-mobile/${phase}`;
await mkdir(folder, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const base = process.env.BASE_URL || 'http://127.0.0.1:5109/';
const rows = [];
try {
  for (const [name, width, height] of [['portrait',390,844], ['landscape',844,390], ['laptop',1366,600]]) {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
    for (const mode of ['home','car','train','flight']) {
      const page = await context.newPage();
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.goto(base + (mode === 'home' ? '' : `${mode}/`));
      await page.waitForSelector(({home:'.card-action',car:'#start-button:not([disabled])',train:'#child-prepare',flight:'#start:not([disabled])'})[mode], { timeout:60000 });
      await page.waitForTimeout(800);
      await page.screenshot({path:`${folder}/${name}-${mode}.png`});
      if (phase === 'after') {
        await page.locator('[data-open-passport]').first().click();
        await page.screenshot({path:`${folder}/${name}-${mode}-passport.png`});
        await page.locator('#passport-close').click();
        if(mode==='car'){
          await page.locator('#start-button').click();await page.waitForFunction(()=>window.__islandDrive.game.phase==='running');await page.locator('#auto-throttle').click();
        }else if(mode==='flight'){
          await page.locator('#start').click();await page.waitForTimeout(1200);
        }else if(mode==='train'){
          if(await page.evaluate(()=>window.__trainSchool.game.paused))await page.locator('#pause').click();await page.locator('#child-prepare').click();await page.locator('#child-go').click();
        }
        if(mode!=='home')await page.screenshot({path:`${folder}/${name}-${mode}-play.png`});
      }
      rows.push({name,width,height,mode,errors});
      await page.close();
    }
    await context.close();
  }
} finally { await browser.close(); }
await writeFile(`${folder}/capture.json`,JSON.stringify(rows,null,2));
if(rows.some(row=>row.errors.length))throw new Error('Runtime errors in capture.json');
console.log(`${phase}: ${rows.length} entry pages captured (each state saved separately), 0 runtime errors`);
