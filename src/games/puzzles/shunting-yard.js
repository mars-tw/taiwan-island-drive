// R48 B line puzzle 2: 調車場排車廂. DOM-free rules, levels and a tiny breadth-first solver.
// Each track is a stub siding: index 0 is the buffer stop, the last car is next to the shunting engine.
import { normalizeAge, createRng, shuffled, randInt, RAIL_COLORS } from './common.js';

export const SHUNTING_GAME = Object.freeze({ id: 'shunting-yard', title: '調車場排車廂', room: '拼搭與方向', ages: '5～8 歲（3～4 歲簡化版）' });
export const SHUNTING_TRACKS = Object.freeze(['a', 'b', 'out']);
export const TRACK_NAMES = Object.freeze({ a: '側線一', b: '側線二', out: '出發線' });
const CAR_COLORS = Object.freeze(['blue', 'red', 'green', 'orange', 'purple']);

// [lowest, highest] fewest-move count of a fresh layout. Six rungs per age band.
const LADDER = Object.freeze([
  { cars: 2, band: [2, 2] }, { cars: 2, band: [3, 3] }, { cars: 3, band: [3, 4] }, { cars: 3, band: [5, 6] },
  { cars: 4, band: [5, 7] }, { cars: 4, band: [7, 9] }, { cars: 5, band: [7, 9] }, { cars: 5, band: [10, 12] },
]);
const LITTLE = Object.freeze([
  { cars: 2, band: [2, 2] }, { cars: 2, band: [3, 3] }, { cars: 3, band: [3, 3] }, { cars: 3, band: [4, 4] }, { cars: 3, band: [5, 5] }, { cars: 3, band: [6, 7] },
]);

export function shuntingLevels(age) {
  const band = normalizeAge(age);
  const rungs = band === '3-4' ? LITTLE : band === '5-6' ? LADDER.slice(0, 6) : LADDER.slice(2, 8);
  // 3～4 歲 match colours only; 5～6 歲 count 1, 2, 3…; 7～8 歲 follow any order on the dispatch card.
  return rungs.map((rung, index) => ({ ...rung, index, age: band, numbers: band !== '3-4', order: band === '7-8' && index >= 2 ? 'card' : 'counting' }));
}

const key = tracks => SHUNTING_TRACKS.map(t => tracks[t].join(',')).join('|');
export function shuntingMinMoves(tracks, target) {
  const goal = target.join(','), start = { a: [...tracks.a], b: [...tracks.b], out: [...tracks.out] };
  if (start.out.join(',') === goal) return 0;
  const seen = new Set([key(start)]);
  let frontier = [start];
  for (let depth = 1; depth <= 40 && frontier.length; depth++) {
    const next = [];
    for (const state of frontier) for (const from of SHUNTING_TRACKS) {
      if (!state[from].length) continue;
      for (const to of SHUNTING_TRACKS) {
        if (to === from) continue;
        const moved = { a: [...state.a], b: [...state.b], out: [...state.out] };
        moved[to].push(moved[from].pop());
        if (moved.out.join(',') === goal) return depth;
        const k = key(moved);
        if (!seen.has(k)) { seen.add(k); next.push(moved); }
      }
    }
    frontier = next;
  }
  return Infinity;
}

export function createShuntingRound({ age = '5-6', level = 0, seed = 1 } = {}) {
  const levels = shuntingLevels(age), cfg = levels[Math.max(0, Math.min(levels.length - 1, level | 0))];
  const rng = createRng(seed);
  const colors = shuffled(rng, cfg.numbers ? CAR_COLORS : CAR_COLORS.slice(0, 4)).slice(0, cfg.cars);
  const cars = colors.map((color, i) => ({ id: `c${i + 1}`, number: i + 1, color }));
  const ids = cars.map(c => c.id);
  let best = null;
  for (let attempt = 0; attempt < 400; attempt++) {
    const target = cfg.order === 'card' || !cfg.numbers ? shuffled(rng, ids) : [...ids];
    const mixed = shuffled(rng, ids), cut = randInt(rng, 0, mixed.length);
    const tracks = { a: mixed.slice(0, cut), b: mixed.slice(cut), out: [] };
    const moves = shuntingMinMoves(tracks, target);
    const miss = moves < cfg.band[0] ? cfg.band[0] - moves : moves > cfg.band[1] ? moves - cfg.band[1] : 0;
    if (!best || miss < best.miss) best = { tracks, target, moves, miss };
    if (miss === 0) break;
  }
  return { game: SHUNTING_GAME.id, age: cfg.age, level: cfg.index, seed, numbers: cfg.numbers, cars, target: best.target, tracks: best.tracks, start: { a: [...best.tracks.a], b: [...best.tracks.b], out: [] }, fewest: best.moves, moves: 0 };
}

export const carById = (round, id) => round.cars.find(c => c.id === id);
export const carLabel = (round, id) => { const car = carById(round, id); return `${round.numbers ? `${car.number} 號` : ''}${RAIL_COLORS[car.color].name}車廂`; };
export const isShuntingSolved = round => round.tracks.out.length === round.target.length && round.tracks.out.every((id, i) => id === round.target[i]);
export const shuntingPrefix = round => { let k = 0; while (k < round.tracks.out.length && round.tracks.out[k] === round.target[k]) k++; return k; };
export const movableCar = (round, track) => round.tracks[track]?.at(-1) || null;

/** The engine pulls the outermost car of one track and pushes it into another. */
export function shuntMove(round, from, to) {
  if (!SHUNTING_TRACKS.includes(from) || !SHUNTING_TRACKS.includes(to) || from === to) return { round, ok: false, reason: 'same' };
  if (!round.tracks[from].length) return { round, ok: false, reason: 'empty' };
  if (isShuntingSolved(round)) return { round, ok: false, reason: 'done' };
  const tracks = { a: [...round.tracks.a], b: [...round.tracks.b], out: [...round.tracks.out] };
  const car = tracks[from].pop(); tracks[to].push(car);
  const next = { ...round, tracks, moves: round.moves + 1 };
  let kind = 'moved';
  if (isShuntingSolved(next)) kind = 'solved';
  else if (to === 'out') kind = shuntingPrefix(next) === tracks.out.length ? 'good' : 'oops';
  return { round: next, ok: true, car, from, to, kind };
}

/** Method hints only: what to look for next, never the full move list. */
export function shuntingHint(round) {
  if (isShuntingSolved(round)) return '車廂排好了！調車機要把列車拉出去囉。';
  const k = shuntingPrefix(round);
  if (round.tracks.out.length > k) return '出發線最外面的車廂順序不對。先把它拉出來，放到側線。';
  const next = round.target[k], label = `${round.numbers ? ' ' : ''}${carLabel(round, next)}`;
  for (const track of ['a', 'b']) {
    const at = round.tracks[track].indexOf(next);
    if (at < 0) continue;
    const blockers = round.tracks[track].length - 1 - at;
    if (!blockers) return `看調車單，下一節是${label}。它沒有被擋住，可以推進出發線。`;
    return `下一節是${label}，前面有 ${blockers} 節車廂擋住。先把擋路的車廂移到另一條側線。`;
  }
  return '看調車單，從最裡面那一節開始排。';
}
export const shuntingIntro = round => round.numbers
  ? '照調車單排車廂：先推進去的車廂會停在最裡面。點車廂，再點要去的線。'
  : '照調車單的顏色排車廂：先推進去的停在最裡面。點車廂，再點要去的線。';
