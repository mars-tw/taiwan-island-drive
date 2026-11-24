"""R49 browser check: math room icons, tab icons, bigger card/coach text, speaker button, top-down switch train.

Usage (software rendering only, the GPU stays free for the video line):
  npx vite --host 127.0.0.1 --port 5186 --strictPort      # in another terminal
  python scripts/check-r49-room-icons.py [--base http://127.0.0.1:5186/] [--shots]

Per size (390x844, 844x390, 1366x768): the four room tabs (every card icon is a loaded image, tab icons loaded,
cards fully in view without scrolling, buttons >= 60 px, no horizontal overflow), one round of 數數看 (speaker
button colour, coach text size), then 轉轍器分月台 opened from the room card (top-down train art, speaker colour,
buttons >= 60 px inside the viewport, back to the room).
Writes docs/evidence/r49/room-check.json and, with --shots, the evidence screenshots (JPEG).
"""
import argparse, json, sys, time
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from pathlib import Path
from playwright.sync_api import sync_playwright

SIZES = [('phone', 390, 844), ('landscape', 844, 390), ('desktop', 1366, 768)]
TABS = ['math', 'observe', 'build', 'life']
OUT = Path('docs/evidence/r49')

MEASURE = r"""
(scope) => {
  const vw = innerWidth, vh = innerHeight, root = document.querySelector(scope);
  const visible = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !el.closest('[hidden],[inert]') && getComputedStyle(el).visibility !== 'hidden'; };
  const name = b => (b.getAttribute('aria-label') || b.textContent || b.className).trim().replace(/\s+/g, ' ').slice(0, 24);
  const buttons = [...root.querySelectorAll('button')].filter(visible).filter(b => !b.closest('details:not([open]) .room-cards'));
  const rects = buttons.map(b => ({ b, r: b.getBoundingClientRect() }));
  const body = root.querySelector('.room-body') || root;
  const box = body.getBoundingClientRect();
  const inBox = r => r.top >= box.top - 1 && r.bottom <= box.bottom + 1 && r.left >= box.left - 1 && r.right <= box.right + 1;
  const overlaps = [];
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
    const a = rects[i].r, c = rects[j].r, w = Math.min(a.right, c.right) - Math.max(a.left, c.left), h = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top);
    if (w > 2 && h > 2 && !rects[i].b.contains(rects[j].b) && !rects[j].b.contains(rects[i].b)) overlaps.push(`${name(rects[i].b)} × ${name(rects[j].b)}`);
  }
  return {
    buttons: rects.length,
    small: rects.filter(x => x.r.width < 59.5 || x.r.height < 59.5).map(x => `${name(x.b)} ${Math.round(x.r.width)}x${Math.round(x.r.height)}`),
    // A phone held upright shows the cards as a scrolling list, so a card below the fold is fine; anything else must be on screen.
    outsideViewport: rects.filter(x => x.r.left < -1 || x.r.right > vw + 1 || ((x.r.top < -1 || x.r.bottom > vh + 1) && !(x.b.classList.contains('room-card') && body.scrollHeight > body.clientHeight))).map(x => name(x.b)),
    belowFold: rects.filter(x => x.b.classList.contains('room-card') && x.r.bottom > vh + 1).length,
    overlaps,
    horizontalOverflow: root.scrollWidth > root.clientWidth + 1 || body.scrollWidth > body.clientWidth + 1,
    inBox: r => inBox(r),
  };
}
"""

ROOM = r"""
async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const d = document.getElementById('math-room');
  const body = d.querySelector('.room-body'), box = body.getBoundingClientRect();
  const inBox = r => r.top >= box.top - 1 && r.bottom <= box.bottom + 1 && r.left >= box.left - 1 && r.right <= box.right + 1;
  const imgs = [...d.querySelectorAll('img.room-icon-img')];
  await Promise.all(imgs.map(img => img.complete ? null : new Promise(r => { img.onload = img.onerror = r; })));
  const cards = [...d.querySelectorAll('.room-panel > .room-cards > .room-card')];
  const later = [...d.querySelectorAll('.room-later .room-card')];
  const tab = [...d.querySelectorAll('[role=tab]')].map(t => { const r = t.getBoundingClientRect(), i = t.querySelector('.room-tab-icon img'), ir = t.querySelector('.room-tab-icon')?.getBoundingClientRect();
    return { id: t.dataset.roomTab, w: Math.round(r.width), h: Math.round(r.height), inView: r.top >= 0 && r.bottom <= innerHeight, icon: i ? { src: i.getAttribute('src').split('/').pop(), loaded: i.naturalWidth > 0, w: Math.round(ir.width), h: Math.round(ir.height) } : null,
      labelOneLine: (() => { const s = t.querySelector('strong'); const lr = s.getBoundingClientRect(); return lr.height < parseFloat(getComputedStyle(s).fontSize) * 1.9; })() }; });
  const cardInfo = c => { const r = c.getBoundingClientRect(), i = c.querySelector('.room-card-icon img'), ir = c.querySelector('.room-card-icon').getBoundingClientRect();
    return { id: c.dataset.roomGame, h: Math.round(r.height), fullyInView: inBox(r), icon: i ? { src: i.getAttribute('src').split('/').pop(), loaded: i.naturalWidth > 0, w: Math.round(ir.width), h: Math.round(ir.height) } : null }; };
  const desc = d.querySelector('.room-card-copy > span'), descStyle = desc && getComputedStyle(desc);
  return { tabs: tab, cards: cards.map(cardInfo), later: later.map(c => ({ id: c.dataset.roomGame, icon: !!c.querySelector('.room-card-icon img') })),
    cardsInView: cards.filter(c => inBox(c.getBoundingClientRect())).length,
    cardDescFontPx: descStyle && descStyle.display !== 'none' ? parseFloat(descStyle.fontSize) : null };
}
"""

def measure(page, scope):
    js = MEASURE.replace('inBox: r => inBox(r),', '')
    return page.evaluate(js, scope)


def chrome_path(given):
    # Use the given browser, else Playwright's own, else the newest Chromium already in ms-playwright (no downloads).
    if given: return given
    base = Path.home() / 'AppData/Local/ms-playwright'
    found = sorted(base.glob('chromium-*/chrome-win*/chrome.exe'), key=lambda x: int(x.parts[-3].split('-')[1]))
    return str(found[-1]) if found else None


def run(base, shots, chrome=None):
    report = []
    with sync_playwright() as p:
        args = ['--disable-gpu', '--use-gl=swiftshader', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
        try:
            browser = p.chromium.launch(args=args)
        except Exception:
            browser = p.chromium.launch(args=args, executable_path=chrome_path(chrome))
        for tag, w, h in SIZES:
            ctx = browser.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1, reduced_motion='reduce')
            page = ctx.new_page()
            errors, devOnly = [], []
            page.on('pageerror', lambda e: errors.append(str(e)))
            # The worktree reaches node_modules through a junction; Vite's dev server refuses those @fs font files (403).
            # The built app bundles them, so these are recorded separately and not counted as page errors.
            page.on('response', lambda r: (devOnly if '/@fs/' in r.url and 'node_modules' in r.url else errors).append(f'{r.status} ' + (r.url.split('node_modules/', 1)[-1] if 'node_modules/' in r.url else r.url)) if r.status >= 400 else None)
            page.goto(base, wait_until='networkidle')
            page.wait_for_function("document.getElementById('math-room')?.mathRoom")
            page.evaluate("document.getElementById('math-room').mathRoom.open('math')")
            page.wait_for_timeout(500)
            row = {'tag': tag, 'w': w, 'h': h, 'tabs': {}}
            for tab in TABS:
                page.click(f'[data-room-tab="{tab}"]')
                page.wait_for_timeout(350)
                info = page.evaluate(ROOM)
                info['layout'] = measure(page, '#math-room')
                row['tabs'][tab] = info
                if shots:
                    page.screenshot(path=str(OUT / f'room-{tab}-{tag}.jpg'), type='jpeg', quality=82)
            # one round of 數數看: room speaker + coach bubble
            page.click('[data-room-tab="math"]'); page.wait_for_timeout(200)
            page.click('[data-room-game="count"]'); page.wait_for_timeout(500)
            row['play'] = page.evaluate("""() => { const s = document.querySelector('#math-room .room-speak'), r = s.getBoundingClientRect(), cs = getComputedStyle(s);
              const coach = document.querySelector('#math-room .room-coach span'), t = document.querySelector('.room-title-icon img');
              return { speaker: { w: Math.round(r.width), h: Math.round(r.height), bg: cs.backgroundColor, border: cs.borderTopColor, svg: !!s.querySelector('svg'), emoji: s.textContent.includes('🔊') },
                coachFontPx: parseFloat(getComputedStyle(coach).fontSize), titleIcon: t ? t.naturalWidth > 0 : null }; }""")
            row['play']['layout'] = measure(page, '#math-room')
            if shots:
                page.screenshot(path=str(OUT / f'play-count-{tag}.jpg'), type='jpeg', quality=82)
            page.click('#math-room [data-room="back"]'); page.wait_for_timeout(300)
            # 轉轍器分月台 from the room card
            page.click('[data-room-tab="build"]'); page.wait_for_timeout(300)
            page.click('[data-room-game="switch-platform"]')
            page.wait_for_function("document.getElementById('rail-play')?.open && !document.getElementById('math-room').open", timeout=15000)
            page.wait_for_timeout(1200)
            row['switch'] = page.evaluate("""() => { const d = document.getElementById('rail-play'), s = d.querySelector('.rp-speak'), r = s.getBoundingClientRect(), cs = getComputedStyle(s);
              const trains = [...d.querySelectorAll('.rp-train image')].map(i => i.getAttribute('href').split('/').pop());
              const board = d.querySelector('.rp-board').getBoundingClientRect(), coach = d.querySelector('.rp-coach');
              const waiting = d.querySelector('.rp-train.is-waiting'), m = waiting && waiting.getAttribute('transform');
              return { portraitBoard: board.height > board.width, trainArt: trains, topView: !!waiting && waiting.classList.contains('is-top'), waitingTransform: m,
                speaker: { w: Math.round(r.width), h: Math.round(r.height), bg: cs.backgroundColor, border: cs.borderTopColor, svg: !!s.querySelector('svg') },
                coachFontPx: parseFloat(getComputedStyle(coach).fontSize), coachText: d.querySelector('.rp-cue').textContent }; }""")
            row['switch']['layout'] = measure(page, '#rail-play')
            if shots:
                page.screenshot(path=str(OUT / f'switch-from-room-{tag}.jpg'), type='jpeg', quality=82)
            page.click('#rail-play .rp-back'); page.wait_for_timeout(600)
            row['backToRoom'] = page.evaluate("document.getElementById('math-room').open && !document.getElementById('rail-play').open")
            row['errors'] = errors
            row['devServerOnly'] = devOnly
            report.append(row)
            ctx.close()
        browser.close()
    return report


def summarize(report):
    problems = []
    for row in report:
        t = row['tag']
        for tab, info in row['tabs'].items():
            for c in info['cards'] + info['later']:
                if not (c['icon'] if isinstance(c['icon'], bool) else (c['icon'] and c['icon']['loaded'])): problems.append(f'{t} {tab} {c["id"]} icon missing')
            for tb in info['tabs']:
                if not tb['icon'] or not tb['icon']['loaded']: problems.append(f'{t} tab {tb["id"]} icon missing')
                if tb['h'] < 60 or not tb['inView']: problems.append(f'{t} tab {tb["id"]} {tb["w"]}x{tb["h"]} inView={tb["inView"]}')
            L = info['layout']
            for k in ('small', 'outsideViewport', 'overlaps'):
                if L[k]: problems.append(f'{t} {tab} {k}: {L[k]}')
            if L['horizontalOverflow']: problems.append(f'{t} {tab} horizontal overflow')
        if t in ('landscape', 'desktop'):
            for tab in ('math', 'build'):
                n = row['tabs'][tab]['cardsInView']; total = len(row['tabs'][tab]['cards'])
                if n < total: problems.append(f'{t} {tab}: only {n}/{total} cards in view (R48 guard)')
        sp = row['play']['speaker']
        if sp['emoji'] or not sp['svg'] or sp['w'] < 60 or sp['h'] < 60: problems.append(f'{t} room speaker {sp}')
        sw = row['switch']
        if not sw['topView'] or not all(a == 'train-top.webp' for a in sw['trainArt']): problems.append(f'{t} switch train art {sw["trainArt"]}')
        for k in ('small', 'outsideViewport', 'overlaps'):
            if sw['layout'][k]: problems.append(f'{t} switch {k}: {sw["layout"][k]}')
        if not row['backToRoom']: problems.append(f'{t} back to room failed')
        if row['errors']: problems.append(f'{t} errors: {row["errors"][:3]}')
    return problems


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--base', default='http://127.0.0.1:5186/')
    ap.add_argument('--shots', action='store_true')
    ap.add_argument('--chrome', default=None, help='Chromium executable to use when Playwright has no browser of its own')
    a = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    report = run(a.base, a.shots, a.chrome)
    problems = summarize(report)
    (OUT / 'room-check.json').write_text(json.dumps({'checkedAt': time.strftime('%Y-%m-%d %H:%M'), 'problems': problems, 'sizes': report}, ensure_ascii=False, indent=1), encoding='utf-8')
    for row in report:
        print(row['tag'], {tab: f"{i['cardsInView']}/{len(i['cards'])} in view, desc {i['cardDescFontPx']}px" for tab, i in row['tabs'].items()},
              'coach', row['play']['coachFontPx'], 'switch coach', row['switch']['coachFontPx'], 'portraitBoard', row['switch']['portraitBoard'])
    print('problems:', len(problems)); [print(' -', x) for x in problems]
    sys.exit(1 if problems else 0)


if __name__ == '__main__':
    main()
