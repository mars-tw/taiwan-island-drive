// R48 B line puzzle 2 screen: tap a track, then another track (or drag between them) to move the outer car.
import { openRailGame, createBoard, colorFilters, svgEl, htmlEl, moveAlong, wait } from './rail-shell.js';
import { drawTrack, drawCar, drawTrain } from './rail-art.js';
import { RAIL_COLORS } from './common.js';
import { t } from '../../shared/i18n.js';
import { zh, tx } from '../math/room-text.js';
import {
  SHUNTING_GAME, SHUNTING_TRACKS, TRACK_NAMES, shuntingLevels, createShuntingRound, shuntMove, isShuntingSolved, shuntingHint,
  shuntingIntro, shuntingPrefix, carById, carLabel, movableCar,
} from './shunting-yard.js';

const FOCUS_34 = ['兩節直接推', '兩節要讓路', '三節', '三節要讓路', '三節換順序', '三節大挑戰'];
const FOCUS = ['兩節直接推', '兩節要讓路', '三節', '三節要讓路', '四節', '四節要讓路', '五節', '五節大挑戰'];

// Abstract yard: u runs along the tracks (buffer stops at u≈x0, throat at high u), v runs across.
// Landscape draws (u, v) as (x, y); portrait phones turn the yard upright as (v, u) so cars stay large.
function geometry(portrait, n) {
  const g = { U: 1000, V: 560, rows: { a: 105, b: 275, out: 445 }, pitch: 124, cw: 116, x0: portrait ? 70 : 44, curveA: 250, curveB: 140, portrait };
  g.xEnd = g.x0 + Math.max(n, 3) * g.pitch + 14;
  if (portrait && g.xEnd + g.curveA + 40 > g.U) g.U = g.xEnd + g.curveA + 40;
  g.join = { a: [Math.min(g.U - 34, g.xEnd + g.curveA), g.rows.out], b: [g.xEnd + g.curveB, g.rows.out], out: [g.xEnd + 10, g.rows.out] };
  g.slot = i => g.x0 + 8 + i * g.pitch + g.cw / 2;
  g.map = portrait ? (u, v) => [v, u] : (u, v) => [u, v];
  g.P = (u, v) => g.map(u, v).map(n => n.toFixed(1)).join(' ');
  g.W = portrait ? g.V : g.U; g.H = portrait ? g.U : g.V;
  g.base = portrait ? 90 : 0;
  return g;
}
function legPath(g, track, forward = true) {
  // forward: from the track's throat end down to the lead line.
  const [su, sv] = [g.xEnd + 10, g.rows[track]], [ju, jv] = g.join[track];
  if (track === 'out') return forward ? `L${g.P(ju, jv)}` : `L${g.P(su, sv)}`;
  const span = ju - su;
  return forward ? `C${g.P(su + span * 0.55, sv)} ${g.P(su + span * 0.45, jv)} ${g.P(ju, jv)}` : `C${g.P(su + span * 0.45, jv)} ${g.P(su + span * 0.55, sv)} ${g.P(su, sv)}`;
}
const tilt = (g, a) => { let k = a - g.base; while (k > 180) k -= 360; while (k <= -180) k += 360; if (k > 90) k -= 180; if (k < -90) k += 180; return g.base + k * 0.6; };

function mount(ctx) {
  let round = createShuntingRound({ age: ctx.age, level: ctx.level, seed: ctx.seed });
  const history = [];
  let selected = null, portrait = false, g = null, carGroups = new Map(), drag = null, skipClick = false;
  const card = htmlEl('div', { class: 'rp-dispatch-card', 'aria-label': t('調車單') }, ctx.stage);
  const board = createBoard(ctx.stage, 'rp-shunt-board');

  function renderCard() {
    card.replaceChildren();
    htmlEl('b', {}, card, t('調車單'));
    const row = htmlEl('div', { class: 'rp-card-cars' }, card);
    htmlEl('small', {}, row, t('最裡面'));
    const done = shuntingPrefix(round);
    round.target.forEach((id, i) => {
      const car = carById(round, id), chip = htmlEl('span', { class: `rp-card-car${i < done ? ' is-done' : ''}`, 'aria-label': t(i < done ? '第 {n} 節：{car}，排好了' : '第 {n} 節：{car}', { n: i + 1, car: tx(carLabel(round, id)) }) }, row);
      const svg = svgEl('svg', { viewBox: '0 0 80 40', 'aria-hidden': 'true' }, chip);
      colorFilters(svg, [RAIL_COLORS[car.color]]);
      drawCar(svg, 2, 6, 76, car.color);
      if (round.numbers) { svgEl('circle', { cx: 40, cy: 16, r: 13, class: 'rp-car-badge' }, svg); const num = svgEl('text', { x: 40, y: 21.5, class: 'rp-car-number', 'text-anchor': 'middle' }, svg); num.textContent = String(car.number); }
      if (i < done) htmlEl('i', { 'aria-hidden': 'true' }, chip, '✓');
    });
    htmlEl('small', {}, row, t('出口'));
  }

  function carNode(svg, id) {
    const car = carById(round, id), grp = svgEl('g', { class: 'rp-shunt-car', 'data-car': id }, svg);
    const body = svgEl('g', { class: 'rp-shunt-body', transform: `rotate(${g.base})` }, grp);
    drawCar(body, -g.cw / 2, -g.cw * 0.18, g.cw, car.color);
    if (round.numbers) {
      const off = g.cw * 0.2 + 16, [bx, by] = g.portrait ? [-off, 0] : [0, -off];
      svgEl('circle', { cx: bx, cy: by, r: 17, class: 'rp-car-badge' }, grp);
      const t = svgEl('text', { x: bx, y: by + 6.5, class: 'rp-car-number', 'text-anchor': 'middle' }, grp); t.textContent = String(car.number);
    }
    return grp;
  }
  const at = (u, v) => { const [x, y] = g.map(u, v); return `translate(${x.toFixed(1)} ${y.toFixed(1)})`; };

  function draw() {
    const box = ctx.stage.getBoundingClientRect();
    portrait = box.width < box.height * 0.9;
    g = geometry(portrait, round.cars.length);
    board.setView(g.W, g.H);
    const svg = board.svg; svg.replaceChildren(); board.hits.replaceChildren(); carGroups = new Map();
    colorFilters(svg, Object.values(RAIL_COLORS));
    svgEl('rect', { x: 0, y: 0, width: g.W, height: g.H, rx: 26, class: 'rp-grass' }, svg);
    drawTrack(svg, `M${g.P(g.x0, g.rows.out)} L${g.P(g.U - 6, g.rows.out)}`, { width: 0.8, lit: selected === 'out' });
    for (const t of ['a', 'b']) drawTrack(svg, `M${g.P(g.x0, g.rows[t])} L${g.P(g.xEnd + 10, g.rows[t])} ${legPath(g, t)}`, { width: 0.8, lit: selected === t });
    for (const t of SHUNTING_TRACKS) {
      const v = g.rows[t], [bx, by] = g.map(g.x0 - 10, v);
      svgEl('rect', { x: bx - (portrait ? 22 : 6), y: by - (portrait ? 6 : 22), width: portrait ? 44 : 12, height: portrait ? 12 : 44, rx: 4, class: 'rp-buffer' }, svg);
      const [lx, ly] = portrait ? g.map(g.x0 - 34, v) : g.map(g.x0 + 4, v + 56);
      const label = svgEl('text', { x: lx, y: ly, class: 'rp-map-label rp-track-name', 'text-anchor': portrait ? 'middle' : 'start' }, svg); label.textContent = tx(TRACK_NAMES[t]);
      round.tracks[t].forEach((id, i) => {
        const node = carNode(svg, id);
        node.setAttribute('transform', at(g.slot(i), v));
        if (i === round.tracks[t].length - 1) node.classList.add('is-outer');
        if (selected === t && i === round.tracks[t].length - 1) node.classList.add('is-picked');
        carGroups.set(id, node);
      });
      const count = round.tracks[t].length, outer = movableCar(round, t);
      const hit = ctx.button('', {
        parent: board.hits, className: `rp-track-hit${selected === t ? ' is-selected' : ''}`,
        ariaLabel: zh(count ? (selected && selected !== t ? '{track}：{n} 節車廂，最外面是{car}。點這裡，把車廂移過來' : '{track}：{n} 節車廂，最外面是{car}') : (selected && selected !== t ? '{track}：空的。點這裡，把車廂移過來' : '{track}：空的'), { track: TRACK_NAMES[t], n: count, car: count ? carLabel(round, outer) : '' }),
        onClick: () => { if (skipClick) { skipClick = false; return; } choose(t); },
      });
      hit.dataset.track = t;
      const [hx, hy] = g.map((g.x0 + g.xEnd + 10) / 2, v), along = `${((g.xEnd + 10 - g.x0 + 24) / g.U) * 100}%`, across = `${(150 / g.V) * 100}%`;
      board.place(hit, hx, hy);
      hit.style.width = portrait ? across : along;
      hit.style.height = portrait ? along : across;
    }
    renderCard();
  }

  function choose(track) {
    if (selected === null) {
      if (!round.tracks[track].length) { ctx.say(zh('{track}沒有車廂。先點有車廂的線。', { track: TRACK_NAMES[track] }), { retry: true }); return; }
      selected = track; ctx.tap(); draw();
      ctx.say(zh(round.numbers ? '拉出 {car}。要推到哪一條線？' : '拉出{car}。要推到哪一條線？', { car: carLabel(round, movableCar(round, track)) }), { voice: false });
      board.hits.querySelector(`[data-track="${track}"]`)?.focus();
      return;
    }
    if (selected === track) { selected = null; draw(); ctx.say('放回原位了。再選一條線。', { voice: false }); return; }
    const from = selected; selected = null; void move(from, track);
  }

  async function move(from, to, dropPoint = null) {
    const result = shuntMove(round, from, to);
    if (!result.ok) { draw(); return; }
    ctx.setBusy(true);
    const node = carGroups.get(result.car), v0 = g.rows[from], u0 = g.slot(round.tracks[from].length - 1);
    const u1 = g.slot(result.round.tracks[to].length - 1), v1 = g.rows[to];
    const far = Math.max(g.join[from][0], g.join[to][0]) + 40;
    const d = dropPoint
      ? `M${dropPoint[0].toFixed(1)} ${dropPoint[1].toFixed(1)} L${g.P(u1, v1)}`
      : `M${g.P(u0, v0)} L${g.P(g.xEnd + 10, v0)} ${legPath(g, from)} L${g.P(far, g.rows.out)} L${g.P(g.join[to][0], g.rows.out)} ${legPath(g, to, false)} L${g.P(u1, v1)}`;
    const path = svgEl('path', { d, class: 'rp-route-ghost' }, board.svg);
    board.svg.append(node); node.classList.add('is-moving');
    const body = node.querySelector('.rp-shunt-body');
    ctx.tap();
    await moveAlong(node, path, { duration: dropPoint ? 350 : 1500, alive: ctx.alive, transform: (p, a) => { body?.setAttribute('transform', `rotate(${tilt(g, a).toFixed(1)})`); return `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`; } });
    if (!ctx.alive()) return;
    history.push(round); round = result.round;
    draw();
    if (result.kind === 'solved') { await departure(); return; }
    ctx.setBusy(false);
    if (result.kind === 'oops') ctx.say('這節不是調車單上的下一節。可以把它拉出來，再試一次。', { retry: true });
    else if (result.kind === 'good') { ctx.chime('star'); ctx.say(zh('排好 {n} 節了！看調車單的下一節。', { n: shuntingPrefix(round) })); }
    else ctx.say(zh({ a: '{car}停在側線一。', b: '{car}停在側線二。', out: '{car}停在出發線。' }[to], { car: carLabel(round, result.car) }), { voice: false });
  }

  async function departure() {
    ctx.say('車廂排好了！調車機來接，列車出發囉！', { voice: true });
    const consist = svgEl('g', { class: 'rp-consist' }, board.svg);
    for (const id of round.tracks.out) consist.append(carGroups.get(id));
    const len = 150, engine = drawTrain(consist, { color: 'blue', length: len, anchor: 'front' });
    const tail = g.slot(round.tracks.out.length - 1) + g.cw / 2 + 4;
    const path1 = svgEl('path', { d: `M${g.P(g.U + len, g.rows.out)} L${g.P(tail + len, g.rows.out)}`, class: 'rp-route-ghost' }, board.svg);
    await moveAlong(engine, path1, { duration: 1100, alive: ctx.alive, transform: p => `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${g.base})` });
    if (!ctx.alive()) return;
    ctx.chime('tap');
    const path2 = svgEl('path', { d: `M0 0 L${g.P(g.U, 0)}`, class: 'rp-route-ghost' }, board.svg);
    await moveAlong(consist, path2, { duration: 2200, alive: ctx.alive, transform: p => `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})` });
    if (!ctx.alive()) return;
    ctx.setBusy(false);
    ctx.win(zh(round.moves <= round.fewest ? '用 {n} 步就排好了，車廂照順序出發！' : '{n} 步排好了，車廂照順序出發！', { n: round.moves }));
  }

  // Drag between tracks: pointer down on one track, release over another.
  board.hits.addEventListener('pointerdown', event => {
    const hit = event.target.closest?.('[data-track]');
    if (!hit || ctx.isBusy() || !round.tracks[hit.dataset.track].length) return;
    drag = { from: hit.dataset.track, x: event.clientX, y: event.clientY, moved: false, id: event.pointerId };
  });
  board.hits.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 14) {
      drag.moved = true;
      const node = carGroups.get(movableCar(round, drag.from)), rect = board.wrap.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * g.W, y = ((event.clientY - rect.top) / rect.height) * g.H;
      node?.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`); node?.classList.add('is-picked');
    }
  });
  const endDrag = event => {
    if (!drag || event.pointerId !== drag.id) return;
    const info = drag; drag = null;
    if (!info.moved) return;
    skipClick = true; setTimeout(() => { skipClick = false; }, 400);
    const under = document.elementsFromPoint(event.clientX, event.clientY).find(el => el.dataset?.track && board.hits.contains(el));
    const rect = board.wrap.getBoundingClientRect();
    const drop = [((event.clientX - rect.left) / rect.width) * g.W, ((event.clientY - rect.top) / rect.height) * g.H];
    selected = null;
    if (under && under.dataset.track !== info.from) void move(info.from, under.dataset.track, drop);
    else draw();
  };
  board.hits.addEventListener('pointerup', endDrag);
  board.hits.addEventListener('pointercancel', event => { if (drag && event.pointerId === drag.id) { drag = null; draw(); } });

  ctx.setControls([
    { label: '↶ 倒回一步', className: 'rp-undo', onClick: () => { if (!history.length) { ctx.say('已經是一開始的樣子了。', { voice: false }); return; } round = history.pop(); selected = null; draw(); ctx.say('倒回一步了。', { voice: false }); } },
    { label: '重排', className: 'rp-reset', onClick: () => { history.length = 0; round = { ...round, tracks: { a: [...round.start.a], b: [...round.start.b], out: [] }, moves: 0 }; selected = null; draw(); ctx.say(shuntingIntro(round)); } },
    { label: '提示', className: 'rp-hint', onClick: () => ctx.say(shuntingHint(round)) },
  ]);
  draw();
  ctx.onResize(() => { if (!ctx.isBusy()) draw(); else board.fit(); });
  // R50: a language switch redraws the yard and the dispatch card (the shell re-labels the cue and the buttons).
  ctx.onLanguageChange?.(() => { card.setAttribute('aria-label', t('調車單')); if (!ctx.isBusy()) draw(); });
  ctx.say(shuntingIntro(round));
  return { destroy() { drag = null; }, get round() { return round; } };
}

export function openShuntingYard(options = {}) {
  return openRailGame({ id: SHUNTING_GAME.id, title: SHUNTING_GAME.title, levels: age => shuntingLevels(age).map(l => ({ ...l, focus: age === '3-4' ? FOCUS_34[l.index] : FOCUS[l.index + (age === '7-8' ? 2 : 0)] })), mount }, options);
}
export { isShuntingSolved };
