// R48 B line puzzle 3 screen: tap a train to move it one section; signals show who may go.
import { openRailGame, createBoard, colorFilters, svgEl, htmlEl, moveAlong } from './rail-shell.js';
import { drawTrack, drawTrain, drawSignal } from './rail-art.js';
import { RAIL_COLORS } from './common.js';
import {
  MEET_GAME, meetLevels, createMeetRound, canMove, moveTrain, meetStatus, meetMessage, meetTrainLabel, locationName, trainById,
} from './single-line-meet.js';

const FOCUS = ['看號誌會車', '長列車走主線', '慢車讓快車', '三列車會車', '兩個會車站', '讓快車又會車', '四列車', '四列車大挑戰'];
const MAIN_V = 290, SIDE_V = 150, SLOT = 82, H = 510, LOCO = 110;
const trainLength = cars => LOCO + Math.max(0, cars - 2) * (LOCO * 0.52 + 2);
const sideHalf = cap => 34 + 26 * cap;

function mount(ctx) {
  const start = createMeetRound({ age: ctx.age, level: ctx.level });
  let round = start, portrait = false, W = 1000, map = (u, v) => [u, v], pending = null;
  const history = [];
  const legend = htmlEl('div', { class: 'rp-meet-legend' }, ctx.stage);
  const board = createBoard(ctx.stage, 'rp-meet-board');
  const last = round.kinds.length - 1;
  const uOf = i => 110 + (i * (W - 220)) / last;

  function slots() {
    // Terminal parking: the next train to leave sits on the main line; others wait or rest below it.
    const result = new Map();
    for (const end of [0, last]) {
      const here = round.trains.filter(t => t.pos === end);
      const queued = here.filter(t => !t.arrived), done = here.filter(t => t.arrived).sort((a, b) => round.arrivals.indexOf(a.id) - round.arrivals.indexOf(b.id));
      [...queued, ...done].forEach((t, k) => result.set(t.id, k));
    }
    return result;
  }
  function pointOf(t, slotMap = slots()) {
    if (round.kinds[t.pos] === 'end') return [uOf(t.pos), MAIN_V + SLOT * (slotMap.get(t.id) || 0)];
    if (round.kinds[t.pos] === 'station' && t.track === 'side') return [uOf(t.pos), SIDE_V];
    return [uOf(t.pos), MAIN_V];
  }
  const sidePath = (pos, dir, entering) => {
    const us = uOf(pos), half = sideHalf(round.stations[pos].side), s = entering ? -dir : dir;
    const a = [us + s * (half + 70), MAIN_V], b = [us + s * half, SIDE_V];
    return entering
      ? [['L', a], ['C', [a[0] - s * 40, MAIN_V], [b[0] + s * 40, SIDE_V], b], ['L', [us, SIDE_V]]]
      : [['L', b], ['C', [b[0] + s * 40, SIDE_V], [a[0] - s * 40, MAIN_V], a]];
  };
  const toD = (start, parts) => {
    const [x, y] = map(...start); let d = `M${x.toFixed(1)} ${y.toFixed(1)}`;
    for (const [cmd, ...pts] of parts) d += ` ${cmd}${pts.map(p => map(...p).map(n => n.toFixed(1)).join(' ')).join(' ')}`;
    return d;
  };
  const pose = (t, x, y, angle) => {
    const flip = t.dir < 0;
    return `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(flip ? angle - 180 : angle).toFixed(1)})${flip ? ' scale(-1 1)' : ''}`;
  };
  const baseAngle = t => (portrait ? (t.dir > 0 ? 90 : -90) : (t.dir > 0 ? 0 : 180));

  function draw() {
    const box = ctx.stage.getBoundingClientRect();
    portrait = box.width < box.height * 0.9;
    W = round.line === 'twoLoop' ? 1400 : 1000;
    map = portrait ? (u, v) => [v, u] : (u, v) => [u, v];
    board.setView(portrait ? H : W, portrait ? W : H);
    const svg = board.svg; svg.replaceChildren(); board.hits.replaceChildren();
    colorFilters(svg, Object.values(RAIL_COLORS));
    svgEl('rect', { x: 0, y: 0, width: portrait ? H : W, height: portrait ? W : H, rx: 28, class: 'rp-grass' }, svg);
    const slotMap = slots();
    // Platforms and names.
    round.kinds.forEach((kind, i) => {
      if (kind === 'block') return;
      const u = uOf(i), v = kind === 'end' ? MAIN_V - 44 : SIDE_V - 44, half = kind === 'end' ? 100 : sideHalf(round.stations[i].side);
      const [ax, ay] = map(u - half, v), [bx, by] = map(u + half, v - 26);
      svgEl('rect', { x: Math.min(ax, bx), y: Math.min(ay, by), width: Math.abs(bx - ax), height: Math.abs(by - ay), class: 'rp-platform' }, svg);
      // Upright phones: names sit after the platform so they never run off the left edge.
      const [nx, ny] = portrait ? map(u + half + 42, v - 13) : map(u, v - 52);
      const name = svgEl('text', { x: nx, y: ny, class: 'rp-map-label', 'text-anchor': 'middle' }, svg); name.textContent = `${locationName(round, i)}站`;
      if (kind === 'station') {
        const [cx, cy] = map(u, portrait ? (SIDE_V + MAIN_V) / 2 : SIDE_V + 50);
        const cap = svgEl('text', { x: cx, y: cy, class: 'rp-side-cap', 'text-anchor': 'middle' }, svg);
        if (portrait) { svgEl('tspan', { x: cx, dy: -6 }, cap).textContent = '避車道'; svgEl('tspan', { x: cx, dy: 26 }, cap).textContent = `停 ${round.stations[i].side} 節`; }
        else cap.textContent = `避車道・停 ${round.stations[i].side} 節`;
      }
    });
    // Rails: the single main line, the passing loops and terminal parking stubs.
    drawTrack(svg, toD([20, MAIN_V], [['L', [W - 20, MAIN_V]]]), { width: 0.75 });
    round.kinds.forEach((kind, i) => {
      if (kind === 'station') {
        const us = uOf(i), half = sideHalf(round.stations[i].side);
        drawTrack(svg, toD([us - half - 70, MAIN_V], [['C', [us - half - 30, MAIN_V], [us - half - 40, SIDE_V], [us - half, SIDE_V]], ['L', [us + half, SIDE_V]], ['C', [us + half + 40, SIDE_V], [us + half + 30, MAIN_V], [us + half + 70, MAIN_V]]]), { width: 0.75 });
      }
      if (kind === 'end') for (let k = 1; k <= 2; k++) drawTrack(svg, toD([uOf(i) - 110, MAIN_V + SLOT * k], [['L', [uOf(i) + 110, MAIN_V + SLOT * k]]]), { width: 0.6, dim: true });
    });
    // Trains, signals and the tap rings.
    for (const t of round.trains) {
      const [u, v] = pointOf(t, slotMap), [x, y] = map(u, v);
      const g = drawTrain(svg, { color: t.color, length: LOCO, extraCars: Math.max(0, t.cars - 2), anchor: 'center', className: t.arrived ? 'is-arrived' : '' });
      g.dataset.train = t.id;
      g.setAttribute('transform', pose(t, x, y, baseAngle(t)));
      if (t.kind) { const [lx, ly] = map(u, v + 42); const tag = svgEl('text', { x: lx, y: ly + (portrait ? 0 : 10), class: 'rp-train-tag', 'text-anchor': 'middle' }, svg); tag.textContent = t.kind === 'express' ? '快車' : '慢車'; }
      if (t.arrived) { const [cx, cy] = map(u + t.dir * (trainLength(t.cars) / 2 + 26), v); const ok = svgEl('text', { x: cx, y: cy + 12, class: 'rp-arrived-mark', 'text-anchor': 'middle' }, svg); ok.textContent = '✓'; continue; }
      const check = canMove(round, t.id);
      if (check.reason === 'queue') continue;
      const [sx, sy] = map(u + t.dir * (trainLength(t.cars) / 2 + 30), v - 52);
      drawSignal(svg, sx, sy, check.ok ? 'green' : 'red', 0.9);
      const ring = ctx.button('', {
        parent: board.hits, className: `rp-train-hit ${check.ok ? 'is-go' : 'is-wait'}`,
        ariaLabel: `${meetTrainLabel(t)}，在${locationName(round, t.pos)}，${check.ok ? '綠燈，可以往前開' : '紅燈，要等一等'}`,
        onClick: () => tapTrain(t.id),
      });
      ring.dataset.train = t.id;
      ring.innerHTML = `<span aria-hidden="true">${portrait ? (t.dir > 0 ? '↓' : '↑') : (t.dir > 0 ? '→' : '←')}</span>`;
      const long = `${Math.max(64, Math.round(trainLength(t.cars) * board.scale + 16))}px`;
      ring.style[portrait ? 'height' : 'width'] = long;
      board.place(ring, x, y);
    }
    renderLegend();
  }

  function renderLegend() {
    legend.replaceChildren();
    const goal = round.goal ? `${meetTrainLabel(trainById(round, round.goal[0]))}要先到` : '每列車都開到對面的車站';
    htmlEl('span', {}, legend, `目標：${goal}`);
    htmlEl('span', { class: 'rp-legend-lamps' }, legend, '綠燈走・紅燈等');
  }

  function controls(mode = 'normal') {
    if (mode === 'choice') {
      ctx.setControls([
        { label: '走主線', className: 'rp-choose-main', onClick: () => choose('main') },
        { label: '進避車道', className: 'rp-choose-side', primary: true, onClick: () => choose('side') },
        { label: '先不要', className: 'rp-choose-cancel', onClick: () => { pending = null; controls(); ctx.say('好，先想一想。', { voice: false }); } },
      ]);
      return;
    }
    const stuck = ['stuck', 'order-miss'].includes(meetStatus(round));
    ctx.setControls([
      { label: '↶ 倒回一步', primary: stuck, className: 'rp-undo', onClick: undo },
      { label: '重來', className: 'rp-reset', onClick: () => { history.length = 0; round = start; pending = null; draw(); controls(); ctx.say(meetMessage(round)); } },
      { label: '提示', className: 'rp-hint', onClick: () => ctx.say(round.tip) },
    ]);
  }
  function undo() {
    if (!history.length) { ctx.say('已經是一開始的樣子了。', { voice: false }); return; }
    round = history.pop(); pending = null; draw(); controls(); ctx.say('倒回一步了。看看號誌，換個順序。', { voice: false });
  }

  function tapTrain(id) {
    const status = meetStatus(round);
    if (status !== 'playing') { ctx.say(meetMessage(round, { ok: true, status, to: trainById(round, id) }), { retry: true }); return; }
    const result = moveTrain(round, id);
    if (result.needsChoice) { pending = id; controls('choice'); ctx.say(`${meetTrainLabel(trainById(round, id))}${meetMessage(round, result)}`); return; }
    if (!result.ok) { ctx.say(meetMessage(round, result), { retry: true }); return; }
    void animate(result);
  }
  function choose(track) {
    const id = pending; pending = null;
    if (!id) return;
    const result = moveTrain(round, id, track);
    if (!result.ok) { controls(); ctx.say(meetMessage(round, result), { retry: true }); return; }
    void animate(result);
  }

  async function animate(result) {
    ctx.setBusy(true);
    const before = round, from = result.from, to = result.to, slotsBefore = slots();
    const startPt = pointOf(from, slotsBefore);
    round = result.round;
    const end = round.kinds[to.pos] === 'end' ? [uOf(to.pos), MAIN_V] : pointOf(to);
    let parts = [];
    if (before.kinds[from.pos] === 'station' && from.track === 'side') parts.push(...sidePath(from.pos, from.dir, false));
    if (round.kinds[to.pos] === 'station' && to.track === 'side') parts.push(...sidePath(to.pos, to.dir, true));
    else parts.push(['L', end]);
    round = before; draw(); round = result.round;
    const g = board.svg.querySelector(`[data-train="${from.id}"]`);
    board.hits.querySelectorAll('button').forEach(b => { b.disabled = true; });
    const path = svgEl('path', { d: toD(startPt, parts), class: 'rp-route-ghost' }, board.svg);
    board.svg.append(g); ctx.tap();
    const ok = await moveAlong(g, path, { duration: 1300, alive: ctx.alive, transform: (p, a) => pose(from, p.x, p.y, a) });
    if (!ok) return;
    history.push(before);
    draw(); controls(); ctx.setBusy(false);
    const status = meetStatus(round), message = meetMessage(round, result);
    if (status === 'won') { ctx.win(round.goal ? '快車先到，慢車也平安到站。會車成功！' : '全部列車平安到站，號誌都看對了！'); return; }
    if (status === 'stuck' || status === 'order-miss') { ctx.say(message, { retry: true }); board.hits.querySelectorAll('button').forEach(b => { b.disabled = true; }); return; }
    ctx.say(message, { voice: !!to.arrived || to.track === 'side' });
  }

  draw(); controls();
  ctx.onResize(() => { if (!ctx.isBusy()) draw(); else board.fit(); });
  ctx.say(meetMessage(round));
  return { destroy() {}, get round() { return round; } };
}

export function openSingleLineMeet(options = {}) {
  return openRailGame({ id: MEET_GAME.id, title: MEET_GAME.title, levels: age => meetLevels(age).map(l => ({ ...l, focus: FOCUS[l.index + (age === '7-8' ? 2 : 0)] })), mount }, options);
}
