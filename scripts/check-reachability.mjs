// Headless control-reachability guard (R1). Needs a running dev/preview server
// and Playwright, which is not a project dependency:
//   PLAYWRIGHT_MODULE=/path/to/node_modules/playwright/index.mjs \
//   BASE_URL=http://127.0.0.1:5108/ node scripts/check-reachability.mjs
// Every primary toddler control must sit inside the viewport, be at least
// 44x44 CSS px and not be covered by another element, at desktop 1366x768,
// phone portrait 390x844 and phone landscape 844x390. No browser window opens.
import { pathToFileURL } from 'node:url';

const moduleUrl = process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright';
const { chromium } = await import(moduleUrl);
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5108/';
const VIEWPORTS = {
  desktop: { viewport: { width: 1366, height: 768 } },
  portrait: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  landscape: { viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }
};
const touch = name => name !== 'desktop';
const SCENARIOS = [
  { name: 'lobby', path: '', ready: '.card-action', controls: () => ['.car-card', '.train-card', '.flight-card', '#home-settings'] },
  { name: 'car-menu', path: 'car/', ready: '#start-button:not([disabled])', controls: () => ['#start-button', '[data-paint]', '[data-mode]', '[data-map]', '[data-vehicle]'] },
  { name: 'car-drive', path: 'car/', ready: '#start-button:not([disabled])', act: async page => { await page.click('#start-button'); await page.waitForTimeout(3500); },
    controls: vp => ['#pause-button', ...(touch(vp) ? ['[data-input=left]', '[data-input=right]', '[data-input=throttle]', '[data-input=brake]'] : [])] },
  { name: 'car-finish', path: 'car/', ready: '#start-button:not([disabled])', act: async page => {
      await page.click('#start-button'); await page.waitForTimeout(3300);
      await page.evaluate(() => { const g = window.__islandDrive.game; g.physics = { ...g.physics, distance: 2399, speed: 20 }; setInterval(() => { g.input.throttle = 1; }, 16); });
      await page.waitForFunction(() => window.__islandDrive.game.phase === 'finished'); await page.waitForTimeout(900); },
    controls: () => ['#again-button', '#choose-button'] },
  { name: 'train', path: 'train/', ready: '#child-prepare', noScroll: true, controls: () => ['#child-prepare', '#child-go', '#child-stop', '#child-help-stop', '#child-doors', '#child-emergency', '#pause'] },
  { name: 'flight-menu', path: 'flight/', ready: '#start:not([disabled])', controls: () => ['#start', '[data-flight-map]', '[data-flight-plane]', '[data-lesson="treasure"]'] },
  { name: 'flight-play', path: 'flight/', ready: '#start:not([disabled])', act: async page => { await page.click('#start'); await page.waitForTimeout(1500); },
    controls: () => ['#child-left', '#child-action', '#child-right', '#pause'] }
];

const browser = await chromium.launch({ headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const failures = [], summary = [];
for (const [vp, options] of Object.entries(VIEWPORTS)) {
  for (const scenario of SCENARIOS) {
    const context = await browser.newContext(options);
    const page = await context.newPage();
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(BASE + scenario.path);
    await page.waitForSelector(scenario.ready, { timeout: 60000 });
    if (scenario.act) await scenario.act(page);
    const result = await page.evaluate(({ selectors, noScroll }) => {
      const problems = [];
      const doc = document.documentElement;
      if (doc.scrollWidth > innerWidth + 1) problems.push(`horizontal scroll ${doc.scrollWidth}>${innerWidth}`);
      if (noScroll && doc.scrollHeight > innerHeight + 1) problems.push(`vertical scroll ${doc.scrollHeight}>${innerHeight}`);
      let checked = 0;
      for (const selector of selectors) {
        const elements = [...document.querySelectorAll(selector)];
        if (!elements.length) { problems.push(`${selector}: missing`); continue; }
        for (const element of elements) {
          checked++;
          const box = element.getBoundingClientRect(), label = `${selector}${elements.length > 1 ? `[${elements.indexOf(element)}]` : ''}`;
          if (box.width < 44 || box.height < 44) problems.push(`${label}: ${Math.round(box.width)}x${Math.round(box.height)} < 44`);
          const x = box.left + box.width / 2, y = box.top + box.height / 2;
          if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) { problems.push(`${label}: outside viewport`); continue; }
          const hit = document.elementFromPoint(x, y);
          if (!hit || !(hit === element || element.contains(hit))) problems.push(`${label}: covered by ${hit?.tagName}.${hit?.className}`);
        }
      }
      return { problems, checked };
    }, { selectors: scenario.controls(vp), noScroll: !!scenario.noScroll });
    summary.push(`${vp.padEnd(9)} ${scenario.name.padEnd(12)} ${result.checked} controls ${result.problems.length ? 'FAIL' : 'ok'}`);
    for (const problem of [...result.problems, ...errors.map(e => `page error: ${e}`)]) failures.push(`${vp} ${scenario.name}: ${problem}`);
    await context.close();
  }
}
await browser.close();
console.log(summary.join('\n'));
if (failures.length) { console.error(`\n${failures.length} reachability problem(s):\n${failures.join('\n')}`); process.exit(1); }
console.log('\nAll primary controls reachable.');
