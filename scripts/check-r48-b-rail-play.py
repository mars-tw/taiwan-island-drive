"""R48 B line browser check: plays one full level of each new rail puzzle / math game in three sizes.

Usage (software rendering only, the GPU stays free for the video line):
  npx vite --host 127.0.0.1 --port 5182 --strictPort      # in another terminal
  python scripts/check-r48-b-rail-play.py [--base http://127.0.0.1:5182/] [--shots]

Checks per size: every visible button >= 60 px, inside the viewport, not overlapping another button,
board not clipped; each game is opened from the train page's temporary entry once, then one level is
played to the win card (including one wrong try that must show a method hint).
Writes docs/evidence/r48/b/layout-report.json and, with --shots, the evidence screenshots.
"""
import argparse, json, os, sys, time
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from pathlib import Path
from playwright.sync_api import sync_playwright

SIZES = [('portrait', 390, 844), ('landscape', 844, 390), ('desktop', 1366, 768)]
# (game, {size: (age, level index)})
PLAN = [
    ('switch-platform', {'portrait': ('3-4', 5), 'landscape': ('5-6', 3), 'desktop': ('7-8', 3)}),
    ('shunting-yard', {'portrait': ('3-4', 3), 'landscape': ('5-6', 3), 'desktop': ('7-8', 3)}),
    ('single-line-meet', {'portrait': ('5-6', 1), 'landscape': ('5-6', 3), 'desktop': ('7-8', 3)}),
    ('boarding-count', {'portrait': ('3-4', 3), 'landscape': ('5-6', 3), 'desktop': ('7-8', 5)}),
    ('platform-timetable', {'portrait': ('3-4', 2), 'landscape': ('5-6', 4), 'desktop': ('7-8', 3)}),
]
OUT = Path('docs/evidence/r48/b')

HELPERS = r"""
window.__rp48 = (() => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const $ = s => document.querySelector(s);
  const state = async () => (await import('/src/games/puzzles/index.js')).railPlayState();
  async function idle(timeout = 20000) {
    const t0 = performance.now();
    while (performance.now() - t0 < timeout) { const d = $('#rail-play'); if (d && !d.classList.contains('is-busy')) return true; await sleep(60); }
    return false;
  }
  function layout() {
    const d = $('#rail-play'), vw = innerWidth, vh = innerHeight;
    const name = b => (b.getAttribute('aria-label') || b.textContent || b.className).trim().slice(0, 24);
    const shown = [...d.querySelectorAll('button')].filter(b => { const r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !b.closest('[hidden],[inert]') && getComputedStyle(b).visibility !== 'hidden'; });
    const rects = shown.map(b => ({ b, r: b.getBoundingClientRect() }));
    const small = rects.filter(x => x.r.width < 59.5 || x.r.height < 59.5).map(x => `${name(x.b)} ${Math.round(x.r.width)}x${Math.round(x.r.height)}`);
    const outside = rects.filter(x => x.r.left < -1 || x.r.top < -1 || x.r.right > vw + 1 || x.r.bottom > vh + 1).map(x => name(x.b));
    const overlaps = [];
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i].r, b = rects[j].r, w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (w > 2 && h > 2) overlaps.push(`${name(rects[i].b)} × ${name(rects[j].b)}`);
    }
    const stage = $('.rp-stage')?.getBoundingClientRect(), board = $('.rp-board')?.getBoundingClientRect();
    const clipped = !!(stage && board && (board.left < stage.left - 1 || board.right > stage.right + 1 || board.top < stage.top - 1 || board.bottom > stage.bottom + 1));
    const dialog = d.getBoundingClientRect();
    return { buttons: rects.length, minW: Math.round(Math.min(...rects.map(x => x.r.width))), minH: Math.round(Math.min(...rects.map(x => x.r.height))), small, outside, overlaps, boardClipped: clipped,
      dialogInside: dialog.left >= -1 && dialog.top >= -1 && dialog.right <= vw + 1 && dialog.bottom <= vh + 1, pageScroll: document.scrollingElement.scrollHeight > vh + 1 && getComputedStyle(document.body).overflow !== 'hidden' ? 'page' : 'none',
      coach: $('.rp-cue')?.textContent || '', retry: !!$('.rp-coach.is-retry') };
  }
  async function open(id, age, level) { const m = await import('/src/games/puzzles/index.js'); m.openRailPlay(id, { age, level, seed: 4242 }); await sleep(900); await idle(); return true; }
  // ---------- switch platform
  async function switchWrong() { $('.rp-go').click(); await sleep(2300); return layout(); }
  async function switchSet() {
    const L = await import('/src/games/puzzles/switch-platform.js'), r = (await state()).game.round;
    if (L.isSwitchRoundDone(r)) return 'done';
    const want = L.switchesFor(r.layout, L.currentTrain(r).target, r.switches);
    for (const id of Object.keys(want)) if (want[id] !== (await state()).game.round.switches[id]) { $(`[data-switch="${id}"]`).click(); await sleep(120); }
    return r.trains.length - r.current;
  }
  async function switchGo(wait = true) { $('.rp-go').click(); if (wait) { await sleep(300); await idle(); } return true; }
  // ---------- shunting
  async function shuntPlan() {
    const L = await import('/src/games/puzzles/shunting-yard.js'), start = (await state()).game.round;
    const key = r => ['a', 'b', 'out'].map(t => r.tracks[t].join(',')).join('|');
    const queue = [[start, []]], seen = new Set([key(start)]);
    while (queue.length) {
      const [r, path] = queue.shift();
      if (L.isShuntingSolved(r)) return path;
      for (const f of ['a', 'b', 'out']) for (const t of ['a', 'b', 'out']) { const s = L.shuntMove(r, f, t); if (s.ok && !seen.has(key(s.round))) { seen.add(key(s.round)); queue.push([s.round, [...path, [f, t]]]); } }
    }
    return [];
  }
  async function shuntWrong() {
    // Tap an empty track first: the coach explains instead of moving anything.
    const empty = ['a', 'b', 'out'].find(t => $(`[data-track="${t}"]`).getAttribute('aria-label').includes('空的'));
    $(`[data-track="${empty || 'out'}"]`).click(); await sleep(300); return layout();
  }
  async function shuntStep(wait = true) { const [f, t] = (await shuntPlan())[0]; $(`[data-track="${f}"]`).click(); await sleep(150); $(`[data-track="${t}"]`).click(); if (wait) { await sleep(200); await idle(); } return (await shuntPlan()).length; }
  // ---------- single-line meet
  async function meetPlan() {
    const L = await import('/src/games/puzzles/single-line-meet.js'), start = (await state()).game.round;
    const key = r => r.trains.map(t => `${t.pos}${t.track || '-'}${t.arrived ? 'A' : ''}`).join('|') + '#' + r.arrivals.join(',');
    const queue = [[start, []]], seen = new Set([key(start)]);
    while (queue.length) {
      const [r, path] = queue.shift(); const status = L.meetStatus(r);
      if (status === 'won') return path;
      if (status !== 'playing') continue;
      for (const t of r.trains) { const c = L.canMove(r, t.id); if (!c.ok) continue; for (const o of c.options) { const n = L.moveTrain(r, t.id, o ?? undefined).round; if (!seen.has(key(n))) { seen.add(key(n)); queue.push([n, [...path, [t.id, o]]]); } } }
    }
    return [];
  }
  async function meetWrong() { const red = $('.rp-train-hit.is-wait'); if (!red) return null; red.click(); await sleep(300); return layout(); }
  async function meetStep(wait = true) {
    const [id, track] = (await meetPlan())[0];
    $(`.rp-train-hit[data-train="${id}"]`).click(); await sleep(200);
    if ($('.rp-choose-main')) { $(track === 'side' ? '.rp-choose-side' : '.rp-choose-main').click(); }
    if (wait) { await sleep(200); await idle(); }
    return (await meetPlan()).length;
  }
  // ---------- boarding
  async function boardTick(mode) {
    // mode: 'wrong' clicks a wrong answer once; 'auto' answers right / presses the next-station button.
    const t0 = performance.now();
    while (performance.now() - t0 < 30000) {
      await idle();
      const st = await state(), q = st.game.question, answers = [...document.querySelectorAll('.rp-answer:not(:disabled)')];
      if ($('.rp-overlay:not([hidden])')) return 'won';
      if (q && answers.length) {
        if (mode === 'wrong') { answers.find(b => b.textContent !== `${q.answer} 人`).click(); await sleep(300); return layout(); }
        const last = st.game.trip.questions.at(-1) === q;
        answers.find(b => b.textContent === `${q.answer} 人`).click(); await sleep(900);
        if (last) return 'last-answered';
        continue;
      }
      const next = $('.rp-controls .rp-primary:not(:disabled)');
      if (next) { next.click(); await sleep(300); }
      await sleep(150);
    }
    return 'timeout';
  }
  // ---------- timetable
  async function ttWrong() { const row = (await state()).game.row; [...document.querySelectorAll('.rp-time-answer:not(:disabled)')].find(b => Number(b.dataset.value) !== row.answer).click(); await sleep(300); const step = $('.rp-step'); if (step) { step.click(); await sleep(200); } return layout(); }
  async function ttRight(wait = true) { const st = await state(), row = st.game.row, left = st.game.round.rows.length - st.game.round.rows.indexOf(row) - 1; document.querySelector(`.rp-time-answer[data-value="${row.answer}"]`).click(); if (wait) { await sleep(300); await idle(); await sleep(200); } return left; }
  const won = () => !!$('.rp-overlay:not([hidden]) .rp-win') || !!$('.rp-overlay:not([hidden])');
  return { sleep, idle, layout, open, switchWrong, switchSet, switchGo, shuntPlan, shuntWrong, shuntStep, meetPlan, meetWrong, meetStep, boardTick, ttWrong, ttRight, won };
})();
"""


def shot(page, name, enabled):
    if enabled:
        OUT.mkdir(parents=True, exist_ok=True)
        page.screenshot(path=str(OUT / f'{name}.jpg'), type='jpeg', quality=80)


def wait_win(page, timeout=20):
    t0 = time.time()
    while time.time() - t0 < timeout:
        if page.evaluate('window.__rp48.won()'):
            return True
        page.wait_for_timeout(200)
    return False


def play(page, game, size, shots):
    ev = page.evaluate
    record = {'states': {}}
    record['states']['start'] = ev('window.__rp48.layout()')
    shot(page, f'{game}-{size}-play', shots)
    if game == 'switch-platform':
        record['states']['retry'] = ev('window.__rp48.switchWrong()')
        if size == 'portrait': shot(page, f'{game}-{size}-retry', shots)
        ev('window.__rp48.idle()')
        while True:
            left = ev('window.__rp48.switchSet()')
            if left == 1:
                ev('window.__rp48.switchGo(false)'); page.wait_for_timeout(1100); shot(page, f'{game}-{size}-moving', shots and size == 'desktop'); break
            ev('window.__rp48.switchGo(true)')
    elif game == 'shunting-yard':
        record['states']['retry'] = ev('window.__rp48.shuntWrong()')
        plan = ev('window.__rp48.shuntPlan()')
        if len(plan) > 1:  # first move by real mouse drag
            f, t = plan[0]
            a = page.locator(f'[data-track="{f}"]').bounding_box(); b = page.locator(f'[data-track="{t}"]').bounding_box()
            page.mouse.move(a['x'] + a['width'] * 0.8, a['y'] + a['height'] / 2); page.mouse.down()
            page.mouse.move(a['x'] + a['width'] * 0.6, (a['y'] + b['y']) / 2 + 20, steps=6)
            page.mouse.move(b['x'] + b['width'] * 0.6, b['y'] + b['height'] / 2, steps=6); page.mouse.up()
            page.wait_for_timeout(300); ev('window.__rp48.idle()')
            record['dragWorked'] = len(ev('window.__rp48.shuntPlan()')) == len(plan) - 1
        while len(ev('window.__rp48.shuntPlan()')) > 1:
            ev('window.__rp48.shuntStep(true)')
        record['states']['beforeLast'] = ev('window.__rp48.layout()')
        ev('window.__rp48.shuntStep(false)'); page.wait_for_timeout(2600); shot(page, f'{game}-{size}-moving', shots and size == 'landscape')
    elif game == 'single-line-meet':
        while len(ev('window.__rp48.meetPlan()')) > 1:
            if 'retry' not in record['states']:
                r = ev('window.__rp48.meetWrong()')
                if r:
                    record['states']['retry'] = r
                    if size == 'desktop': shot(page, f'{game}-{size}-retry', shots)
            ev('window.__rp48.meetStep(true)')
        ev('window.__rp48.meetStep(false)'); page.wait_for_timeout(700); shot(page, f'{game}-{size}-moving', shots and size == 'portrait')
    elif game == 'boarding-count':
        record['states']['retry'] = ev('window.__rp48.boardTick("wrong")')
        if size in ('portrait', 'desktop'): shot(page, f'{game}-{size}-retry', shots)
        assert ev('window.__rp48.boardTick("auto")') == 'last-answered'
        ev('window.__rp48.idle()'); page.locator('.rp-controls .rp-primary').click(); page.wait_for_timeout(700)
        shot(page, f'{game}-{size}-moving', shots and size == 'landscape')
    elif game == 'platform-timetable':
        record['states']['retry'] = ev('window.__rp48.ttWrong()')
        if size in ('portrait', 'desktop'): shot(page, f'{game}-{size}-retry', shots)
        while ev('window.__rp48.ttRight(false)') > 0:
            ev('window.__rp48.idle()'); page.wait_for_timeout(400)
        page.wait_for_timeout(1000); shot(page, f'{game}-{size}-moving', shots and size == 'landscape')
    record['won'] = wait_win(page)
    record['states']['win'] = ev('window.__rp48.layout()')
    # The win card leads to the level list; it must fit too.
    record['states']['levels'] = ev("(async()=>{[...document.querySelectorAll('.rp-overlay button')].find(b=>b.textContent==='選關卡')?.click();await window.__rp48.sleep(300);return window.__rp48.layout()})()")
    if game == 'switch-platform' and size == 'portrait': shot(page, f'{game}-{size}-win', shots)
    return record


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--base', default='http://127.0.0.1:5182/'); ap.add_argument('--shots', action='store_true'); ap.add_argument('--only', default='')
    args = ap.parse_args()
    report = {'base': args.base, 'when': time.strftime('%Y-%m-%d %H:%M:%S'), 'renderer': 'chromium --disable-gpu (SwiftShader)', 'runs': []}
    launch = {'headless': True, 'args': ['--disable-gpu', '--use-gl=swiftshader']}
    if os.environ.get('PLAYWRIGHT_CHROMIUM'): launch['executable_path'] = os.environ['PLAYWRIGHT_CHROMIUM']
    failures = []
    with sync_playwright() as p:
        browser = p.chromium.launch(**launch)
        for size, w, h in SIZES:
            ctx = browser.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1, has_touch=True)
            page = ctx.new_page(); errors = []
            page.on('pageerror', lambda e: errors.append(str(e)))
            # Temporary entry: train page → 路線／課程 → 火車謎題與數學（試玩）.
            page.goto(args.base + 'train/'); page.wait_for_timeout(1500)
            page.evaluate("document.getElementById('settings-dialog').showModal()")
            page.locator('#rail-play-trial').click(); page.wait_for_timeout(400)
            entry_buttons = page.evaluate("[...document.querySelectorAll('#rail-play-trial-dialog button')].map(b=>{const r=b.getBoundingClientRect();return [Math.round(r.width),Math.round(r.height)]})")
            shot(page, f'trial-entry-{size}', args.shots and size != 'landscape')
            page.locator('#rail-play-trial-dialog [data-game="switch-platform"]').click(); page.wait_for_timeout(900)
            opened = page.evaluate("!!document.querySelector('#rail-play[open]')")
            page.locator('#rail-play .rp-back').click(); page.wait_for_timeout(300)
            back_to_picker = page.evaluate("document.querySelector('#rail-play-trial-dialog').open")
            report['runs'].append({'size': size, 'entry': {'buttons': entry_buttons, 'openedFromTrainPage': opened, 'backToPicker': back_to_picker}})
            if not (opened and back_to_picker) or any(min(b) < 60 for b in entry_buttons): failures.append(f'{size}: trial entry')
            page.goto(args.base); page.wait_for_timeout(1200)
            page.evaluate(HELPERS)
            for game, ages in PLAN:
                if args.only and args.only != game: continue
                age, level = ages[size]
                page.evaluate(f"window.__rp48.open('{game}', '{age}', {level})")
                try:
                    rec = play(page, game, size, args.shots)
                except Exception as exc:  # keep going; the report says what broke
                    rec = {'error': str(exc)[:300], 'won': False, 'states': {}}
                rec.update({'game': game, 'size': size, 'age': age, 'level': level + 1})
                for name, st in rec['states'].items():
                    if not isinstance(st, dict): continue
                    if st['small'] or st['outside'] or st['overlaps'] or st['boardClipped'] or not st['dialogInside']:
                        failures.append(f"{game} {size} {name}: small={st['small']} outside={st['outside']} overlaps={st['overlaps']} clipped={st['boardClipped']}")
                if 'retry' in rec['states'] and isinstance(rec['states']['retry'], dict) and not rec['states']['retry']['retry']:
                    failures.append(f'{game} {size}: wrong try did not show the retry coach')
                if not rec['won']: failures.append(f"{game} {size}: level not finished {rec.get('error', '')}")
                report['runs'].append(rec)
                page.evaluate("document.querySelector('#rail-play .rp-back')?.click()"); page.wait_for_timeout(300)
                print(f"{size:9} {game:20} age {age} L{level + 1}: won={rec['won']} buttons60={all(not s['small'] for s in rec['states'].values() if isinstance(s, dict))}", flush=True)
            report['runs'].append({'size': size, 'pageErrors': errors})
            if errors: failures.append(f'{size}: page errors {errors[:3]}')
            ctx.close()
        browser.close()
    report['failures'] = failures
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / 'layout-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding='utf8')
    print('FAILURES:' if failures else 'ALL CHECKS PASSED', *failures, sep='\n')
    sys.exit(1 if failures else 0)


if __name__ == '__main__':
    main()
