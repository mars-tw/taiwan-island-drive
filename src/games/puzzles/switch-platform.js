// R48 B line puzzle 1: 轉轍器分月台. DOM-free rules, levels and track geometry.
// Coordinates are abstract: u runs along the travel direction (0..1000), v runs across (0..600).
import { normalizeAge, createRng, shuffled, RAIL_COLORS, RAIL_SHAPES } from './common.js';
import { zh } from '../math/room-text.js';

export const SWITCH_GAME = Object.freeze({ id: 'switch-platform', title: '轉轍器分月台', room: '拼搭與方向', ages: '4～8 歲' });

export const SWITCH_LAYOUTS = Object.freeze({
  one: { id: 'one', entry: [0, 300], switches: { s1: { u: 280, v: 300, legs: ['p1', 'p2'] } }, platforms: { p1: { v: 150 }, p2: { v: 450 } } },
  two: { id: 'two', entry: [0, 300], switches: { s1: { u: 220, v: 300, legs: ['p1', 's2'] }, s2: { u: 500, v: 400, legs: ['p2', 'p3'] } }, platforms: { p1: { v: 110 }, p2: { v: 290 }, p3: { v: 500 } } },
  three: { id: 'three', entry: [0, 300], switches: { s1: { u: 200, v: 300, legs: ['s2', 's3'] }, s2: { u: 460, v: 165, legs: ['p1', 'p2'] }, s3: { u: 460, v: 435, legs: ['p3', 'p4'] } }, platforms: { p1: { v: 85 }, p2: { v: 240 }, p3: { v: 360 }, p4: { v: 515 } } },
});
export const TRACK_END_U = 960, TRAIN_STOP_U = 950, TRAIN_WAIT_U = 190, LEG_U = 160;

// One ladder; each age band plays six consecutive rungs. 3～4 歲 always matches colour only.
const LADDER = Object.freeze([
  { layout: 'one', trains: 1, attrs: 'color' },
  { layout: 'one', trains: 2, attrs: 'color' },
  { layout: 'two', trains: 1, attrs: 'color' },
  { layout: 'two', trains: 2, attrs: 'color' },
  { layout: 'three', trains: 1, attrs: 'color' },
  { layout: 'three', trains: 2, attrs: 'both' },
  { layout: 'three', trains: 3, attrs: 'both' },
  { layout: 'three', trains: 4, attrs: 'both' },
]);
const AGE_START = Object.freeze({ '3-4': 0, '5-6': 1, '7-8': 2 });
const PAIRED_SHAPE = Object.freeze({ blue: 'circle', red: 'triangle', green: 'square', purple: 'star' });
const PUZZLE_COLORS = Object.freeze(['blue', 'red', 'green', 'purple']);

export function switchLevels(age) {
  const band = normalizeAge(age), start = AGE_START[band];
  return LADDER.slice(start, start + 6).map((rung, index) => ({
    ...rung, attrs: band === '3-4' ? 'color' : rung.attrs, index, age: band,
    switches: Object.keys(SWITCH_LAYOUTS[rung.layout].switches).length,
    platforms: Object.keys(SWITCH_LAYOUTS[rung.layout].platforms).length,
  }));
}

/** Follows the switch arrows from the entry; returns the platform and the nodes passed. */
export function routeFor(layoutId, switches) {
  const layout = SWITCH_LAYOUTS[layoutId];
  const nodes = ['entry'];
  let at = 's1';
  for (let guard = 0; guard < 8; guard++) {
    nodes.push(at);
    if (layout.platforms[at]) return { platform: at, nodes };
    const sw = layout.switches[at];
    at = sw.legs[switches?.[at] === 1 ? 1 : 0];
  }
  throw new Error('Broken switch layout');
}

/** Switch states that route the entry to a platform (only switches on the path matter). */
export function switchesFor(layoutId, platform, base = {}) {
  const layout = SWITCH_LAYOUTS[layoutId], ids = Object.keys(layout.switches);
  for (let mask = 0; mask < 1 << ids.length; mask++) {
    const states = Object.fromEntries(ids.map((id, i) => [id, (mask >> i) & 1]));
    const route = routeFor(layoutId, states);
    if (route.platform !== platform) continue;
    // Keep switches off the route where the child left them.
    for (const id of ids) if (!route.nodes.includes(id) && base[id] !== undefined) states[id] = base[id];
    return states;
  }
  return null;
}

const plateFor = (attrs, colors, shapes, i) => attrs === 'both'
  ? { color: colors[i >> 1], shape: shapes[i & 1] }
  : { color: colors[i], shape: PAIRED_SHAPE[colors[i]] };

export function createSwitchRound({ age = '5-6', level = 0, seed = 1 } = {}) {
  const levels = switchLevels(age), cfg = levels[Math.max(0, Math.min(levels.length - 1, level | 0))];
  const rng = createRng(seed), layout = SWITCH_LAYOUTS[cfg.layout];
  const platformIds = Object.keys(layout.platforms);
  const colors = shuffled(rng, PUZZLE_COLORS), shapes = shuffled(rng, ['circle', 'triangle', 'square', 'star']).slice(0, 2);
  const plates = shuffled(rng, platformIds.map((_, i) => plateFor(cfg.attrs, colors, shapes, i)));
  const platforms = platformIds.map((id, i) => ({ id, ...plates[i] }));
  const targets = shuffled(rng, platformIds).slice(0, cfg.trains);
  const trains = targets.map((target, i) => { const p = platforms.find(x => x.id === target); return { id: `t${i + 1}`, color: p.color, shape: p.shape, target }; });
  const switches = Object.fromEntries(Object.keys(layout.switches).map(id => [id, rng() < 0.5 ? 0 : 1]));
  if (routeFor(cfg.layout, switches).platform === trains[0].target) switches.s1 = 1 - switches.s1;
  return { game: SWITCH_GAME.id, age: cfg.age, level: cfg.index, seed, layout: cfg.layout, attrs: cfg.attrs, platforms, trains, switches, current: 0, parked: {}, tries: 0 };
}

const clone = round => ({ ...round, switches: { ...round.switches }, parked: { ...round.parked } });
export function toggleSwitch(round, id) {
  if (!(id in round.switches) || isSwitchRoundDone(round)) return round;
  const next = clone(round); next.switches[id] = 1 - next.switches[id]; return next;
}
export const isSwitchRoundDone = round => round.current >= round.trains.length;
export const currentTrain = round => round.trains[round.current] || null;

export const plateLabel = (plate, attrs) => `${RAIL_COLORS[plate.color].name}${attrs === 'both' ? RAIL_SHAPES[plate.shape].name : ''}`;
// R50: whole labels are dictionary keys (「藍色圓形列車」→ "blue circle train"), so no short {x}列車 pattern is needed.
export const trainLabel = (train, attrs) => plateLabel(train, attrs) + '列車';
export const platformLabel = (platform, attrs) => plateLabel(platform, attrs) + '月台';

/** Sends the waiting train along the lit route. Wrong platforms are a rehearsal: the train backs up. */
export function departTrain(round) {
  const train = currentTrain(round);
  if (!train) return { round, result: { kind: 'done' } };
  const route = routeFor(round.layout, round.switches), platform = round.platforms.find(p => p.id === route.platform);
  const next = clone(round);
  let kind = 'arrived', reason = null;
  if (round.parked[route.platform]) kind = 'occupied';
  else if (route.platform !== train.target) {
    kind = 'wrong';
    if (round.attrs === 'both') reason = platform.color === train.color ? 'shape' : platform.shape === train.shape ? 'color' : 'both';
  }
  if (kind === 'arrived') { next.parked[route.platform] = train.id; next.current += 1; }
  else next.tries += 1;
  return { round: next, result: { kind, reason, train, platform, route } };
}

export function switchHint(round, result) {
  const attrs = round.attrs, train = result?.train || currentTrain(round);
  if (!train) return '全部列車都停好了！';
  const target = round.platforms.find(p => p.id === train.target);
  if (!result || result.kind === 'start') return zh('{train}要開到{platform}。點黃色的箭頭換方向，看亮起來的路通到哪裡。', { train: trainLabel(train, attrs), platform: platformLabel(target, attrs) });
  if (result.kind === 'arrived') return isSwitchRoundDone(round) ? '全部列車都停好了！' : zh('{train}到站了！下一列車也要找跟自己一樣的月台。', { train: trainLabel(train, attrs) });
  if (result.kind === 'occupied') return '那個月台已經停了列車。換一條路，找和列車一樣的牌子。';
  if (result.reason === 'shape') return '顏色對了，形狀不一樣。看看月台牌子上的形狀，再點黃色的箭頭。';
  if (result.reason === 'color') return '形狀對了，顏色不一樣。看看月台牌子上的顏色，再點黃色的箭頭。';
  return zh('{train}要停{platform}。從起點沿著亮起來的路走，看看哪個黃色箭頭要換方向。', { train: trainLabel(train, attrs), platform: platformLabel(target, attrs) });
}

/** Geometry for drawing and for the departure animation, in abstract (u, v) units. */
export function legSegments(layoutId, from, to) {
  const layout = SWITCH_LAYOUTS[layoutId];
  const start = from === 'entry' ? layout.entry : [layout.switches[from].u, layout.switches[from].v];
  const end = layout.platforms[to] ? [TRACK_END_U, layout.platforms[to].v] : [layout.switches[to].u, layout.switches[to].v];
  if (from === 'entry' || start[1] === end[1]) return [{ type: 'L', to: end }];
  const bendEnd = [start[0] + LEG_U, end[1]];
  return [{ type: 'C', c1: [start[0] + LEG_U * 0.5, start[1]], c2: [start[0] + LEG_U * 0.5, end[1]], to: bendEnd }, { type: 'L', to: end }];
}
export function routeSegments(layoutId, nodes, stopU = TRAIN_STOP_U) {
  const layout = SWITCH_LAYOUTS[layoutId], segments = [{ type: 'M', to: [TRAIN_WAIT_U, layout.entry[1]] }];
  for (let i = 0; i < nodes.length - 1; i++) segments.push(...legSegments(layoutId, nodes[i], nodes[i + 1]));
  const last = segments.at(-1);
  if (last.type === 'L' && layout.platforms[nodes.at(-1)]) last.to = [stopU, last.to[1]];
  return segments;
}
