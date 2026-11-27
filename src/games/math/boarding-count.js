// R48 B line math 1: 海風站上下車. DOM-free trip generator and checker.
// Each stop: some passengers get off, then some get on. Station names come from the train routes.
// R50: every sentence here stays Chinese (zh() only fills in values); the screen shows it through tx().
import { normalizeAge, createRng, randInt, numberChoices, stationNames } from '../puzzles/common.js';
import { zh } from './room-text.js';

export const BOARDING_GAME = Object.freeze({ id: 'boarding-count', title: '海風站上下車', room: '數學', ages: '3～8 歲' });
export const BOARDING_MAX = Object.freeze({ '3-4': 5, '5-6': 10, '7-8': 20 });
const STEP = Object.freeze({ '3-4': [1, 3], '5-6': [1, 5], '7-8': [2, 9] });

// events: 'on' only at the first station; later stops are 'on', 'off' or 'mix' (off, then on).
const PLANS = Object.freeze({
  '3-4': [
    { events: ['on'], ask: 'each', focus: '數一數' },
    { events: ['on', 'on'], ask: 'each', focus: '上車變多' },
    { events: ['on', 'off'], ask: 'each', focus: '下車變少' },
    { events: ['on', 'mix'], ask: 'each', focus: '先下車再上車' },
    { events: ['on', 'on', 'off'], ask: 'each', focus: '一站一站算' },
    { events: ['on', 'mix', 'mix'], ask: 'end', focus: '到終點再回答' },
  ],
  '5-6': [
    { events: ['on', 'on'], ask: 'end', focus: '10 以內加法' },
    { events: ['on', 'off'], ask: 'end', focus: '10 以內減法' },
    { events: ['on', 'mix'], ask: 'end', focus: '先減再加' },
    { events: ['on', 'mix', 'mix'], ask: 'each', focus: '一站一站算' },
    { events: ['on', 'mix', 'mix'], ask: 'end', focus: '連續兩站' },
    { events: ['on', 'mix', 'mix'], ask: 'end', hidden: true, focus: '拉上窗簾心算' },
  ],
  '7-8': [
    { events: ['on', 'on'], ask: 'end', cross: 'up', focus: '進位：湊成 10' },
    { events: ['on', 'off'], ask: 'end', cross: 'down', focus: '退位：先減到 10' },
    { events: ['on', 'mix', 'mix'], ask: 'end', focus: '20 以內連續兩站' },
    { events: ['on', 'mix', 'mix'], ask: 'end', hidden: true, focus: '拉上窗簾心算' },
    { events: ['on', 'mix', 'mix'], ask: 'end', hidden: true, big: true, focus: '人數更多' },
    { events: ['on', 'mix', 'mix'], ask: 'end', hidden: true, reverse: true, focus: '找出上車幾人' },
  ],
});
const ROUTES_BY_LEVEL = Object.freeze(['coast', 'coast', 'city', 'city', 'forest', 'forest']);

export function boardingLevels(age) {
  const band = normalizeAge(age);
  return PLANS[band].map((plan, index) => ({ ...plan, hidden: !!plan.hidden, index, age: band, max: BOARDING_MAX[band], stops: plan.events.length }));
}

const span = (rng, lo, hi) => (hi < lo ? NaN : randInt(rng, lo, hi));
function startRange(cfg) {
  if (cfg.cross === 'up') return [6, 9];
  if (cfg.cross === 'down') return [11, 18];
  if (cfg.big) return [9, 14];
  const next = cfg.events[1];
  if (cfg.age === '3-4') return next === 'on' ? [1, 3] : next ? [2, 4] : [2, 5];
  if (cfg.age === '5-6') return next === 'on' ? [2, 6] : [3, 8];
  return next === 'on' ? [4, 12] : [6, 14];
}
function buildEvents(cfg, rng) {
  const max = cfg.max, [lo, hi] = STEP[cfg.age], events = [];
  let count = 0;
  for (const [i, kind] of cfg.events.entries()) {
    let on = 0, off = 0;
    if (i === 0) on = span(rng, ...startRange(cfg));
    else if (kind === 'on') on = cfg.cross === 'up' ? span(rng, 11 - count, Math.min(hi, max - count)) : span(rng, lo, Math.min(hi, max - count));
    else if (kind === 'off') off = cfg.cross === 'down' ? span(rng, count - 9, Math.min(hi, count - 1)) : span(rng, lo, Math.min(hi, count - 1));
    else { off = span(rng, lo, Math.min(hi, count - 1)); on = span(rng, lo, Math.min(hi, max - (count - off))); }
    count = count - off + on;
    events.push({ on, off, after: count });
  }
  return events;
}
const validEvents = (cfg, events) => {
  const [lo, hi] = STEP[cfg.age];
  let count = 0;
  for (const [i, e] of events.entries()) {
    if (![e.on, e.off, e.after].every(Number.isInteger) || e.off > count || e.on < 0 || e.off < 0) return false;
    if (i > 0 && (e.on > hi || e.off > hi) && !cfg.cross) return false;
    if (i > 0 && cfg.events[i] === 'mix' && (e.on < lo || e.off < lo)) return false;
    count = count - e.off + e.on;
    if (count !== e.after || count < 1 || count > cfg.max) return false;
  }
  if (cfg.cross === 'up' && !(events[0].after < 10 && events[1].after > 10)) return false;
  if (cfg.cross === 'down' && !(events[0].after > 10 && events[1].after < 10)) return false;
  if (cfg.big && Math.max(...events.map(e => e.after)) < 12) return false;
  return true;
};

export function createBoardingTrip({ age = '5-6', level = 0, seed = 1 } = {}) {
  const levels = boardingLevels(age), cfg = levels[Math.max(0, Math.min(levels.length - 1, level | 0))];
  const rng = createRng(seed), route = ROUTES_BY_LEVEL[cfg.index], names = stationNames(route);
  let events = null;
  for (let attempt = 0; attempt < 500 && !events; attempt++) { const trial = buildEvents(cfg, rng); if (validEvents(cfg, trial)) events = trial; }
  if (!events) throw new Error('Could not build a boarding trip');
  const stops = events.map((e, i) => ({ station: names[i], ...e, before: i ? events[i - 1].after : 0 }));
  const questions = [];
  if (cfg.reverse) {
    const at = stops.length - 1, stop = stops[at];
    questions.push({ after: at, type: 'missing', stop: at, field: 'on', answer: stop.on, choices: numberChoices(stop.on, { min: 1, max: cfg.max, rng, near: [stop.after - stop.before, stop.on + stop.off] }) });
  } else {
    stops.forEach((stop, i) => {
      if (cfg.ask === 'each' || i === stops.length - 1) {
        const wrong = stop.off && stop.on ? stop.before + stop.off + stop.on : stop.off ? stop.before + stop.off : stop.before - stop.on;
        questions.push({ after: i, type: 'count', answer: stop.after, choices: numberChoices(stop.after, { min: 0, max: cfg.max, rng, near: [wrong] }) });
      }
    });
  }
  return { game: BOARDING_GAME.id, age: cfg.age, level: cfg.index, seed, route, max: cfg.max, hidden: cfg.hidden, ask: cfg.ask, cross: cfg.cross || null, focus: cfg.focus, stops, questions };
}

export function checkBoarding(trip, questionIndex, value) {
  const q = trip.questions[questionIndex];
  if (!q) return { correct: false, hint: '' };
  const correct = Number(value) === q.answer;
  return { correct, hint: correct ? '' : boardingHint(trip, questionIndex) };
}

/** Method hints only: how to count, never the number itself. */
export function boardingHint(trip, questionIndex) {
  const q = trip.questions[questionIndex];
  if (!q) return '';
  if (q.type === 'missing') {
    const stop = trip.stops[q.stop];
    return zh('先一站一站算：到{station}站下車後，車上剩幾人？再從那個數往上數到 {n}，數了幾個，就是上車的人數。', { station: stop.station, n: stop.after });
  }
  if (trip.ask === 'end' && q.after > 1) return zh('一站一站算：先算{first}站，記住人數，再算{last}站。下車往回數，上車往上數。', { first: trip.stops[1].station, last: trip.stops[q.after].station });
  const stop = trip.stops[q.after];
  if (q.after === 0 && trip.ask === 'each') return '一個一個數座位上的朋友，數到最後一個就是答案。';
  if (trip.cross === 'up') return zh('從 {from} 開始，先補到 10，再加上剩下的人。', { from: stop.before });
  if (trip.cross === 'down') return zh('從 {from} 開始，先減到 10，再減掉剩下的人。', { from: stop.before });
  if (stop.off && stop.on) return zh('先算下車：從 {from} 往回數 {off} 個；再算上車：往上數 {on} 個。', { from: stop.before, off: stop.off, on: stop.on });
  if (stop.off) return zh('從 {from} 開始，往回數 {n} 個。', { from: stop.before, n: stop.off });
  return zh('從 {from} 開始，往上數 {n} 個。', { from: stop.before, n: stop.on });
}

// One whole sentence per case (English word order differs), so no half sentences are glued together.
export function stopSentence(stop, index) {
  const station = stop.station;
  if (index === 0) return zh('{station}站上車 {n} 人', { station, n: stop.on });
  if (stop.off && stop.on) return zh('{station}站下車 {off} 人，上車 {on} 人', { station, off: stop.off, on: stop.on });
  if (stop.off) return zh('{station}站下車 {n} 人', { station, n: stop.off });
  if (stop.on) return zh('{station}站上車 {n} 人', { station, n: stop.on });
  return zh('{name}站', { name: station });
}
export function questionText(trip, questionIndex) {
  const q = trip.questions[questionIndex];
  if (!q) return '';
  if (q.type === 'missing') { const stop = trip.stops[q.stop]; return zh('{station}站下車 {off} 人，又上來一些人，現在車上有 {after} 人。{station}站上車幾人？', { station: stop.station, off: stop.off, after: stop.after }); }
  return q.after === trip.stops.length - 1 && trip.stops.length > 1 ? '列車要開往下一站了。現在車上有幾人？' : '現在車上有幾人？';
}
