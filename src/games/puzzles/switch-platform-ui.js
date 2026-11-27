// R48 B line puzzle 1 screen: tap a switch to turn the lit route, then send the train.
import { openRailGame, createBoard, colorFilters, svgEl, htmlEl, moveAlong, wait } from './rail-shell.js';
import { drawTrack, drawPlate, drawTrain, segmentsToPath } from './rail-art.js';
import { RAIL_COLORS } from './common.js';
import { t } from '../../shared/i18n.js';
import { zh, tx } from '../math/room-text.js';
import {
  SWITCH_GAME, SWITCH_LAYOUTS, TRACK_END_U, TRAIN_STOP_U, TRAIN_WAIT_U, LEG_U, switchLevels, createSwitchRound, routeFor, toggleSwitch,
  departTrain, switchHint, currentTrain, isSwitchRoundDone, legSegments, routeSegments, trainLabel, platformLabel,
} from './switch-platform.js';

const W = 1060, H = 600, TRAIN_LEN = 170;
// R49: the board is a map seen from above, so the trains are drawn from above too (portrait and landscape).
const VIEW = 'top';
// Level notes stay Chinese source; the shell shows them with tx().
const focusOf = l => zh(l.attrs === 'both' ? '{switches} 個道岔・{trains} 列車・顏色和形狀' : '{switches} 個道岔・{trains} 列車', { switches: l.switches, trains: l.trains });

function mount(ctx) {
  let round = createSwitchRound({ age: ctx.age, level: ctx.level, seed: ctx.seed });
  const layout = SWITCH_LAYOUTS[round.layout];
  const queue = htmlEl('div', { class: 'rp-queue', 'aria-label': t('等一下要出發的列車') }, ctx.stage);
  const board = createBoard(ctx.stage, 'rp-switch-board');
  let portrait = false, map = (u, v) => [u, v], trainGroup = null, plateGroup = null;

  const edges = () => {
    const list = [['entry', 's1']];
    for (const [id, sw] of Object.entries(layout.switches)) for (const leg of sw.legs) list.push([id, leg]);
    return list;
  };
  const poseTrain = (p, angle) => {
    trainGroup?.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${angle.toFixed(1)})`);
    if (plateGroup) {
      // The plate rides above the middle of the train and never rotates, so shapes stay readable.
      const rad = angle * Math.PI / 180, cx = p.x - Math.cos(rad) * TRAIN_LEN * 0.5, cy = p.y - Math.sin(rad) * TRAIN_LEN * 0.5;
      plateGroup.setAttribute('transform', `translate(${(cx - (portrait ? 58 : 0)).toFixed(1)} ${(cy - (portrait ? 0 : 58)).toFixed(1)})`);
    }
  };

  function draw() {
    const box = ctx.stage.getBoundingClientRect();
    portrait = box.width < box.height * 0.9;
    map = portrait ? (u, v) => [v, u] : (u, v) => [u, v];
    board.setView(portrait ? H : W, portrait ? W : H);
    const svg = board.svg; svg.replaceChildren(); board.hits.replaceChildren();
    colorFilters(svg, Object.values(RAIL_COLORS));
    svgEl('rect', { x: 0, y: 0, width: portrait ? H : W, height: portrait ? W : H, rx: 28, class: 'rp-grass' }, svg);
    const route = routeFor(round.layout, round.switches);
    const lit = new Set(route.nodes.slice(1).map((n, i) => `${route.nodes[i]}>${n}`));
    // Platforms first (under the rails), then rails, so trains sit on top.
    for (const p of Object.values(layout.platforms)) {
      const [ax, ay] = map(700, p.v - 34), [bx, by] = map(TRACK_END_U, p.v - 34), [cx, cy] = map(TRACK_END_U, p.v - 58), [dx, dy] = map(700, p.v - 58);
      svgEl('polygon', { points: `${ax},${ay} ${bx},${by} ${cx},${cy} ${dx},${dy}`, class: 'rp-platform' }, svg);
      svgEl('line', { x1: ax, y1: ay, x2: bx, y2: by, class: 'rp-platform-edge' }, svg);
      const [sx, sy] = map(TRACK_END_U + 6, p.v);
      svgEl('rect', { x: sx - (portrait ? 26 : 5), y: sy - (portrait ? 5 : 26), width: portrait ? 52 : 10, height: portrait ? 10 : 52, rx: 4, class: 'rp-buffer' }, svg);
    }
    for (const [from, to] of edges()) {
      const d = segmentsToPath([{ type: 'M', to: from === 'entry' ? layout.entry : [layout.switches[from].u, layout.switches[from].v] }, ...legSegments(round.layout, from, to)], map);
      const on = lit.has(`${from}>${to}`);
      drawTrack(svg, d, { lit: on, dim: !on && from !== 'entry' });
    }
    for (const p of round.platforms) {
      const [x, y] = map(TRACK_END_U + 52, layout.platforms[p.id].v);
      drawPlate(svg, x, y, 34, p.color, p.shape, 'rp-sign');
    }
    const [ex, ey] = portrait ? map(30, layout.entry[1] + 92) : map(30, layout.entry[1] + 82);
    const startTag = svgEl('text', { x: ex, y: ey, class: 'rp-map-label', 'text-anchor': portrait ? 'middle' : 'start' }, svg); startTag.textContent = t('起點');
    // Parked trains.
    for (const [platform, trainId] of Object.entries(round.parked)) {
      const t = round.trains.find(x => x.id === trainId), [x, y] = map(TRAIN_STOP_U, layout.platforms[platform].v);
      const g = drawTrain(svg, { color: t.color, length: TRAIN_LEN, view: VIEW });
      g.setAttribute('transform', `translate(${x} ${y}) rotate(${portrait ? 90 : 0})`);
      drawPlate(svg, x - (portrait ? 58 : TRAIN_LEN * 0.5), y - (portrait ? TRAIN_LEN * 0.5 : 58), 26, t.color, t.shape, 'rp-train-plate is-parked');
    }
    // Waiting train.
    const train = currentTrain(round);
    trainGroup = plateGroup = null;
    if (train) {
      trainGroup = drawTrain(svg, { color: train.color, length: TRAIN_LEN, className: 'is-waiting', view: VIEW });
      plateGroup = drawPlate(svg, 0, 0, 28, train.color, train.shape, 'rp-train-plate');
      const [x, y] = map(TRAIN_WAIT_U, layout.entry[1]);
      poseTrain({ x, y }, portrait ? 90 : 0);
    }
    // Switch buttons on the board (≥64 px).
    for (const [id, sw] of Object.entries(layout.switches)) {
      const leg = sw.legs[round.switches[id]], target = layout.platforms[leg] ? layout.platforms[leg].v : layout.switches[leg].v;
      const [x, y] = map(sw.u, sw.v), [tx, ty] = map(sw.u + LEG_U, target), angle = Math.atan2(ty - y, tx - x) * 180 / Math.PI;
      const onRoute = route.nodes.includes(id);
      const b = ctx.button('', {
        parent: board.hits, className: `rp-switch${onRoute ? ' is-on-route' : ''}`,
        ariaLabel: zh(round.switches[id] ? (portrait ? '道岔 {n}：現在往右，點一下換方向' : '道岔 {n}：現在往下，點一下換方向') : (portrait ? '道岔 {n}：現在往左，點一下換方向' : '道岔 {n}：現在往上，點一下換方向'), { n: id.slice(1) }),
        onClick: () => flip(id),
      });
      b.innerHTML = `<svg viewBox="-32 -32 64 64" aria-hidden="true"><g transform="rotate(${angle.toFixed(0)})"><path d="M-18 0H14" /><path d="M4 -12L18 0L4 12" /></g></svg>`;
      b.dataset.switch = id;
      board.place(b, x, y);
    }
    renderQueue();
  }

  function renderQueue() {
    queue.replaceChildren();
    const waiting = round.trains.slice(round.current + 1);
    queue.hidden = !waiting.length;
    if (!waiting.length) return;
    htmlEl('span', {}, queue, t('下一班：'));
    for (const train of waiting) {
      const chip = htmlEl('span', { class: 'rp-chip', 'aria-label': tx(trainLabel(train, round.attrs)) }, queue);
      const svg = svgEl('svg', { viewBox: '-30 -30 60 60', 'aria-hidden': 'true' }, chip);
      drawPlate(svg, 0, 0, 27, train.color, train.shape);
    }
  }

  function flip(id) {
    round = toggleSwitch(round, id); ctx.tap();
    const route = routeFor(round.layout, round.switches), p = round.platforms.find(x => x.id === route.platform);
    draw();
    ctx.say(zh(round.parked[p.id] ? '路通到{platform}。那裡已經有列車了。' : '路通到{platform}。', { platform: platformLabel(p, round.attrs) }), { voice: true });
    board.hits.querySelector(`[data-switch="${id}"]`)?.focus();
  }

  async function go() {
    if (isSwitchRoundDone(round)) return;
    const before = round, { round: next, result } = departTrain(round);
    ctx.setBusy(true);
    const stopU = result.kind === 'occupied' ? 640 : TRAIN_STOP_U;
    const path = svgEl('path', { d: segmentsToPath(routeSegments(before.layout, result.route.nodes, stopU), map), class: 'rp-route-ghost' }, board.svg);
    board.svg.append(trainGroup, plateGroup);
    ctx.say(zh('{train}出發！', { train: trainLabel(result.train, before.attrs) }), { voice: false });
    const ok = await moveAlong(trainGroup, path, { duration: 2000, alive: ctx.alive, transform: (p, a) => { poseTrain(p, a); return trainGroup.getAttribute('transform'); } });
    if (!ok) return;
    if (result.kind === 'arrived') {
      round = next; ctx.chime('star');
      if (isSwitchRoundDone(round)) { draw(); ctx.setBusy(false); ctx.win(round.trains.length > 1 ? '每一列車都開到自己的月台了！' : '列車開到對的月台了！'); return; }
      ctx.say(switchHint(round, result), { voice: true });
      await wait(500); if (!ctx.alive()) return;
      draw(); ctx.setBusy(false); return;
    }
    round = next;
    const bubble = svgEl('text', { class: 'rp-puzzled', 'text-anchor': 'middle' }, board.svg); bubble.textContent = '？';
    const end = path.getPointAtLength(path.getTotalLength());
    bubble.setAttribute('x', end.x - (portrait ? 0 : 80)); bubble.setAttribute('y', end.y - (portrait ? 80 : 40));
    ctx.say(switchHint(round, result), { retry: true });
    await wait(1100); if (!ctx.alive()) return;
    bubble.remove();
    const back = await moveAlong(trainGroup, path, { from: 1, to: 0, duration: 1500, alive: ctx.alive, transform: (p, a) => { poseTrain(p, a); return trainGroup.getAttribute('transform'); } });
    if (!back) return;
    draw(); ctx.setBusy(false);
  }

  ctx.setControls([{ label: '出發 ▶', primary: true, className: 'rp-go', onClick: go }]);
  draw();
  ctx.onResize(() => { if (!ctx.isBusy()) draw(); else board.fit(); });
  // R50: a language switch redraws the board text (the shell re-labels the cue and the buttons).
  ctx.onLanguageChange?.(() => { queue.setAttribute('aria-label', t('等一下要出發的列車')); if (!ctx.isBusy()) draw(); });
  ctx.say(switchHint(round, { kind: 'start' }));
  return { destroy() {}, get round() { return round; } };
}

export function openSwitchPlatform(options = {}) {
  return openRailGame({ id: SWITCH_GAME.id, title: SWITCH_GAME.title, levels: age => switchLevels(age).map(l => ({ ...l, focus: focusOf(l) })), mount }, options);
}
