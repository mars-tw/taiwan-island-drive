// R48 B line puzzle 3: 單線會車. DOM-free block-signal rules shared with train lesson 3 (號誌與限速).
// A single-track block holds one train. A passing station has a main track and a shorter 避車道.
import { normalizeAge, RAIL_COLORS } from './common.js';

export const MEET_GAME = Object.freeze({ id: 'single-line-meet', title: '單線會車', room: '拼搭與方向', ages: '5～8 歲' });

const LINES = Object.freeze({
  oneLoop: { id: 'oneLoop', names: ['海風', '藍灣', '山海'], kinds: ['end', 'block', 'station', 'block', 'end'] },
  twoLoop: { id: 'twoLoop', names: ['河畔', '星光', '雲霧', '森林'], kinds: ['end', 'block', 'station', 'block', 'station', 'block', 'end'] },
});
const T = (id, color, cars, dir, kind = null) => ({ id, color, cars, dir, kind });
// Hand-made scenes, each checked by the breadth-first solver in tests: solvable, and from rung 2 a trap exists.
const LADDER = Object.freeze([
  { line: 'oneLoop', sides: [3], trains: [T('t1', 'blue', 2, 1), T('t2', 'red', 2, -1)], tip: '單線一次只能走一列車。兩列車要在有避車道的車站會車。' },
  { line: 'oneLoop', sides: [2], trains: [T('t1', 'blue', 4, 1), T('t2', 'red', 2, -1)], tip: '長列車進不了短短的避車道。讓短的列車去避車道等。' },
  { line: 'oneLoop', sides: [2], trains: [T('t1', 'green', 2, 1, 'local'), T('t2', 'purple', 3, 1, 'express')], goal: ['t2', 't1'], tip: '慢車先進避車道等候，快車從主線開過去。' },
  { line: 'oneLoop', sides: [2], trains: [T('t1', 'blue', 2, 1), T('t2', 'red', 2, 1), T('t3', 'green', 2, -1)], tip: '車站只有兩條線。對面的列車還沒進站前，別讓兩列車都擠進去。' },
  { line: 'twoLoop', sides: [2, 2], trains: [T('t1', 'blue', 4, 1), T('t2', 'red', 2, -1), T('t3', 'green', 2, -1)], tip: '長列車只能走主線。短的列車要先進避車道讓路。' },
  { line: 'twoLoop', sides: [2, 2], trains: [T('t1', 'green', 2, 1, 'local'), T('t2', 'purple', 3, 1, 'express'), T('t3', 'red', 2, -1)], goal: ['t2', 't1'], tip: '慢車進避車道讓快車；對面來車時，先看哪一站還有空的線。' },
  { line: 'twoLoop', sides: [2, 2], trains: [T('t1', 'blue', 4, 1), T('t2', 'green', 2, 1), T('t3', 'red', 2, -1), T('t4', 'purple', 2, -1)], tip: '長列車只能走主線。一次只放一列車進單線，車站留一條空線給對面的車。' },
  { line: 'twoLoop', sides: [2, 3], trains: [T('t1', 'green', 2, 1, 'local'), T('t2', 'purple', 3, 1, 'express'), T('t3', 'blue', 4, -1), T('t4', 'red', 2, -1)], goal: ['t2', 't1'], tip: '先看每列車有多長，再決定在哪一站會車。慢車要讓快車。' },
]);
const AGE_START = Object.freeze({ '3-4': 0, '5-6': 0, '7-8': 2 });

export function meetLevels(age) {
  const band = normalizeAge(age), start = AGE_START[band];
  return LADDER.slice(start, start + 6).map((rung, index) => ({ ...rung, index, age: band, trainCount: rung.trains.length, loops: rung.sides.length }));
}

export function createMeetRound({ age = '5-6', level = 0 } = {}) {
  const levels = meetLevels(age), cfg = levels[Math.max(0, Math.min(levels.length - 1, level | 0))];
  const line = LINES[cfg.line], last = line.kinds.length - 1;
  const stations = {};
  let s = 0;
  line.kinds.forEach((kind, i) => { if (kind === 'station') stations[i] = { name: line.names[1 + s], main: 6, side: cfg.sides[s++] }; });
  const trains = cfg.trains.map(t => ({ ...t, pos: t.dir > 0 ? 0 : last, track: null, arrived: false }));
  return { game: MEET_GAME.id, age: cfg.age, level: cfg.index, line: line.id, kinds: [...line.kinds], names: [...line.names], stations, trains, goal: cfg.goal || null, tip: cfg.tip, arrivals: [], moves: 0 };
}

export const trainById = (round, id) => round.trains.find(t => t.id === id);
export const locationName = (round, pos) => {
  if (round.kinds[pos] === 'end') return round.names[pos === 0 ? 0 : round.names.length - 1];
  if (round.kinds[pos] === 'station') return round.stations[pos].name;
  return '單線區間';
};
export function meetTrainLabel(train) {
  const kind = train.kind === 'express' ? '快車' : train.kind === 'local' ? '慢車' : train.cars >= 4 ? '長列車' : '列車';
  return `${RAIL_COLORS[train.color].name}${kind}`;
}
const occupant = (round, pos, track = null) => round.trains.find(t => !t.arrived && t.pos === pos && (track === null || t.track === track));
const departed = (round, t) => t.pos !== (t.dir > 0 ? 0 : round.kinds.length - 1);

/** Signal aspect for one train: green when the next place is free, otherwise the reason it waits. */
export function canMove(round, id) {
  const train = trainById(round, id);
  if (!train || train.arrived) return { ok: false, reason: 'arrived' };
  if (!departed(round, train)) {
    const ahead = round.trains.find(t => t.dir === train.dir && !t.arrived && !departed(round, t));
    if (ahead && ahead.id !== train.id) return { ok: false, reason: 'queue', waitFor: ahead.id };
  }
  const next = train.pos + train.dir, kind = round.kinds[next];
  if (kind === 'end') return { ok: true, next, options: [null] };
  if (kind === 'block') {
    const other = occupant(round, next);
    return other ? { ok: false, reason: 'block', next, waitFor: other.id } : { ok: true, next, options: [null] };
  }
  const station = round.stations[next];
  const free = ['main', 'side'].filter(track => !occupant(round, next, track));
  const fits = free.filter(track => station[track] >= train.cars);
  if (fits.length) return { ok: true, next, options: fits };
  return { ok: false, reason: free.length ? 'short' : 'full', next };
}

export function meetStatus(round) {
  if (round.goal) {
    const [first, then] = round.goal;
    if (round.arrivals.includes(then) && !round.arrivals.includes(first)) return 'order-miss';
  }
  if (round.trains.every(t => t.arrived)) return 'won';
  return round.trains.some(t => canMove(round, t.id).ok) ? 'playing' : 'stuck';
}

/** Moves one train one place. A passing station with two free tracks asks which track first. */
export function moveTrain(round, id, track) {
  if (meetStatus(round) !== 'playing') return { round, ok: false, reason: 'over' };
  const check = canMove(round, id);
  if (!check.ok) return { round, ok: false, train: id, reason: check.reason, waitFor: check.waitFor, next: check.next };
  if (check.options.length > 1 && !check.options.includes(track)) return { round, ok: false, train: id, needsChoice: true, options: check.options, next: check.next };
  const chosen = check.options.length > 1 ? track : check.options[0];
  const trains = round.trains.map(t => t.id !== id ? { ...t } : { ...t, pos: check.next, track: chosen, arrived: round.kinds[check.next] === 'end' });
  const moved = trains.find(t => t.id === id);
  const next = { ...round, trains, arrivals: moved.arrived ? [...round.arrivals, id] : [...round.arrivals], moves: round.moves + 1 };
  return { round: next, ok: true, from: trainById(round, id), to: moved, status: meetStatus(next) };
}

export function meetMessage(round, result) {
  const station = pos => `${locationName(round, pos)}站`;
  if (!result) return round.goal ? `${meetTrainLabel(trainById(round, round.goal[0]))}要比${meetTrainLabel(trainById(round, round.goal[1]))}先到站。點列車往前開，紅燈要停。` : '點列車往前開一段。綠燈可以走，紅燈要停車等候。';
  if (result.needsChoice) return `進${station(result.next)}：要走主線，還是進避車道等？`;
  if (!result.ok) {
    const train = trainById(round, result.train);
    if (result.reason === 'block') return '前方列車尚未離開，紅燈停車等候。';
    if (result.reason === 'full') return `${station(result.next)}兩條線都有列車，紅燈等一等。`;
    if (result.reason === 'short') return `${train ? meetTrainLabel(train) : '這列車'}太長，進不了避車道；主線上有車，紅燈等一等。`;
    if (result.reason === 'queue') return '前面的列車還沒出發，排隊等一等。';
    return '這列車已經到站了。';
  }
  if (result.status === 'won') return '全部列車平安到站！號誌都看對了。';
  if (result.status === 'order-miss') return `${meetTrainLabel(trainById(round, round.goal[1]))}先到了，可是${meetTrainLabel(trainById(round, round.goal[0]))}要先到喔。倒回幾步，讓慢車進避車道。`;
  if (result.status === 'stuck') return '大家都在等紅燈，誰也動不了。按「倒回一步」，換個順序試試。';
  if (result.to.arrived) return `${meetTrainLabel(result.to)}到${station(result.to.pos)}了！`;
  if (result.to.track === 'side') return `${meetTrainLabel(result.to)}進避車道等候，主線讓給別的列車。`;
  if (round.kinds[result.to.pos] === 'block') return `${meetTrainLabel(result.to)}開進單線，號誌轉紅，對面的車要等。`;
  return `${meetTrainLabel(result.to)}停在${station(result.to.pos)}主線。`;
}

/** Breadth-first search over whole-line states: fewest moves to a win, and whether a trap exists. */
export function solveMeet(round, limit = 200000) {
  const keyOf = r => r.trains.map(t => `${t.pos}${t.track || '-'}${t.arrived ? 'A' : ''}`).join('|') + '#' + r.arrivals.join(',');
  const seen = new Set([keyOf(round)]);
  let frontier = [round], depth = 0, trap = false;
  while (frontier.length && seen.size < limit) {
    const next = [];
    for (const state of frontier) {
      const status = meetStatus(state);
      if (status === 'won') return { moves: depth, trap };
      if (status !== 'playing') { trap = true; continue; }
      for (const t of state.trains) {
        const check = canMove(state, t.id);
        if (!check.ok) continue;
        for (const option of check.options) {
          const moved = moveTrain(state, t.id, option ?? undefined).round;
          const k = keyOf(moved);
          if (!seen.has(k)) { seen.add(k); next.push(moved); }
        }
      }
    }
    frontier = next; depth++;
  }
  return { moves: Infinity, trap };
}

/** Finds whether any reachable state is stuck or misses the order goal (the lesson's trap). */
export function meetHasTrap(round, limit = 200000) {
  const keyOf = r => r.trains.map(t => `${t.pos}${t.track || '-'}${t.arrived ? 'A' : ''}`).join('|') + '#' + r.arrivals.join(',');
  const seen = new Set([keyOf(round)]), stack = [round];
  while (stack.length && seen.size < limit) {
    const state = stack.pop(), status = meetStatus(state);
    if (status === 'stuck' || status === 'order-miss') return true;
    if (status !== 'playing') continue;
    for (const t of state.trains) {
      const check = canMove(state, t.id);
      if (!check.ok) continue;
      for (const option of check.options) {
        const moved = moveTrain(state, t.id, option ?? undefined).round, k = keyOf(moved);
        if (!seen.has(k)) { seen.add(k); stack.push(moved); }
      }
    }
  }
  return false;
}
