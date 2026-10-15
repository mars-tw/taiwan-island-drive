// Headless frame-time sampling (R1). Same Playwright setup as check-reachability.mjs.
// Samples requestAnimationFrame intervals while each mode is actively playing,
// three runs per mode/viewport, and reports the median p95. Headless Chromium is
// capped at the display refresh rate (60 Hz => 16.7 ms), so values near 16.7 ms
// mean the frame budget was met; software rendering (SwiftShader) is not valid.
import { pathToFileURL } from 'node:url';

const moduleUrl = process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright';
const { chromium } = await import(moduleUrl);
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5108/';
const RUNS = Number(process.env.RUNS || 3), SAMPLE_MS = Number(process.env.SAMPLE_MS || 4000);
const VIEWPORTS = {
  desktop: { viewport: { width: 1366, height: 768 } },
  portrait: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  landscape: { viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }
};
const MODES = {
  car: { path: 'car/', start: async page => { await page.waitForSelector('#start-button:not([disabled])', { timeout: 60000 }); await page.click('#start-button'); await page.waitForTimeout(3300); await page.evaluate(() => { const g = window.__islandDrive.game; setInterval(() => { g.input.throttle = 1; }, 16); }); await page.waitForTimeout(1500); } },
  train: { path: 'train/', start: async page => { await page.waitForSelector('#child-prepare'); await page.waitForTimeout(3000); await page.click('#child-prepare'); await page.click('#child-go'); await page.waitForTimeout(1500); } },
  flight: { path: 'flight/', start: async page => { await page.waitForSelector('#start:not([disabled])', { timeout: 60000 }); await page.click('#start'); await page.waitForTimeout(1500); await page.click('#child-action'); await page.waitForTimeout(2500); } }
};
const browser = await chromium.launch({ headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const renderer = await (async () => { const page = await browser.newPage(); const name = await page.evaluate(() => { const gl = document.createElement('canvas').getContext('webgl2'); const info = gl?.getExtension('WEBGL_debug_renderer_info'); return info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : 'unknown'; }); await page.close(); return name; })();
console.log(`renderer: ${renderer}`);
const rows = [];
for (const [vp, options] of Object.entries(VIEWPORTS)) for (const [mode, spec] of Object.entries(MODES)) {
  const p95s = [], p50s = [];
  for (let run = 0; run < RUNS; run++) {
    const context = await browser.newContext(options); const page = await context.newPage();
    await page.goto(BASE + spec.path); await spec.start(page);
    const stats = await page.evaluate(ms => new Promise(resolve => { const d = []; let last = performance.now(); const t0 = last; const f = now => { d.push(now - last); last = now; if (now - t0 < ms) requestAnimationFrame(f); else { d.sort((a, b) => a - b); resolve({ p50: d[Math.floor(d.length * 0.5)], p95: d[Math.floor(d.length * 0.95)] }); } }; requestAnimationFrame(f); }), SAMPLE_MS);
    p95s.push(stats.p95); p50s.push(stats.p50); await context.close();
  }
  const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
  rows.push({ viewport: vp, mode, p50: +median(p50s).toFixed(1), p95: +median(p95s).toFixed(1), runs: p95s.map(v => +v.toFixed(1)) });
}
await browser.close();
console.table(rows);
console.log(JSON.stringify({ renderer, rows }));
