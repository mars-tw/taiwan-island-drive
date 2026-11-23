// R48 B line math 2: 月台時刻表. DOM-free timetable generator and checker on a 12-hour clock.
// Times are minutes after midnight, always between 1:00 and 12:55, so no board ever wraps past 12.
import { normalizeAge, createRng, randInt, pickOne, shuffled, stationNames, RAIL_COLORS } from '../puzzles/common.js';

export const TIMETABLE_GAME = Object.freeze({ id: 'platform-timetable', title: '月台時刻表', room: '數學', ages: '3～8 歲' });

// ask: read (look at the clock), arrive (departure + ride), ride (how long), depart (arrival − ride).
const PLANS = Object.freeze({
  '3-4': [
    { ask: 'read', starts: 'hour', rows: 2, focus: '看整點' },
    { ask: 'read', starts: 'hour', rows: 2, focus: '看整點' },
    { ask: 'arrive', starts: 'hour', rides: [60], rows: 2, focus: '過 1 小時' },
    { ask: 'arrive', starts: 'hour', rides: [60], rows: 2, focus: '過 1 小時' },
    { ask: 'arrive', starts: 'hour', rides: [120], rows: 2, focus: '過 2 小時' },
    { ask: 'arrive', starts: 'hour', rides: [60, 120], rows: 2, focus: '過 1 或 2 小時' },
  ],
  '5-6': [
    { ask: 'arrive', starts: 'hour', rides: [60, 120], rows: 3, focus: '整點加小時' },
    { ask: 'read', starts: 'half', rows: 3, focus: '看半點' },
    { ask: 'arrive', starts: 'half', rides: [60], rows: 3, focus: '半點加 1 小時' },
    { ask: 'arrive', starts: 'hour', rides: [30], rows: 3, focus: '整點加半小時' },
    { ask: 'arrive', starts: 'half', rides: [30], rows: 3, focus: '半點加半小時' },
    { ask: 'arrive', starts: 'hourOrHalf', rides: [60, 90, 120], rows: 3, focus: '小時和半小時' },
  ],
  '7-8': [
    { ask: 'arrive', starts: 'hourOrHalf', rides: [90, 120, 150], rows: 3, focus: '暖身：小時和半小時' },
    { ask: 'arrive', starts: 'quarter', rides: [15, 30, 45], rows: 3, focus: '一刻鐘：15 分鐘' },
    { ask: 'arrive', starts: 'five', rides: [10, 15, 20, 25], cross: false, rows: 3, focus: '經過幾分鐘' },
    { ask: 'arrive', starts: 'five', rides: [15, 20, 25, 30, 35, 40], cross: true, rows: 3, focus: '跨過整點' },
    { ask: 'ride', starts: 'five', rides: [15, 20, 25, 30, 35, 40, 45, 50, 55, 60], rows: 3, focus: '坐了幾分鐘' },
    { ask: 'depart', starts: 'five', rides: [15, 20, 25, 30, 35, 40, 45, 50], rows: 3, focus: '往回推出發時間' },
  ],
});

export function timetableLevels(age) {
  const band = normalizeAge(age);
  return PLANS[band].map((plan, index) => ({ ...plan, index, age: band }));
}

export const clockParts = minutes => ({ hour: Math.floor(minutes / 60), minute: minutes % 60 });
/** 3 點、3 點半、8 點 15 分 */
export function timeWords(minutes) {
  const { hour, minute } = clockParts(minutes);
  return minute === 0 ? `${hour} 點` : minute === 30 ? `${hour} 點半` : `${hour} 點 ${minute} 分`;
}
export const digital = minutes => { const { hour, minute } = clockParts(minutes); return `${hour}:${String(minute).padStart(2, '0')}`; };
export function rideWords(minutes) {
  const h = Math.floor(minutes / 60), m = minutes % 60;
  if (!h) return `${m} 分鐘`;
  if (!m) return `${h} 小時`;
  return m === 30 ? `${h} 個半小時` : `${h} 小時 ${m} 分鐘`;
}
const MIN = 60, MAX = 12 * 60 + 55;
const inRange = t => Number.isInteger(t) && t >= MIN && t <= MAX;

function startTime(rng, starts) {
  const hour = randInt(rng, 1, 11);
  if (starts === 'hour') return hour * 60;
  if (starts === 'half') return hour * 60 + 30;
  if (starts === 'hourOrHalf') return hour * 60 + pickOne(rng, [0, 30]);
  if (starts === 'quarter') return hour * 60 + pickOne(rng, [0, 15, 30, 45]);
  return hour * 60 + 5 * randInt(rng, 1, 11);
}

/** Wrong choices stay on the level's own grid (whole hours, half hours, quarters or 5 minutes). */
export function choiceGrid(cfg) {
  if (cfg.ask === 'ride' || cfg.starts === 'five') return 5;
  if (cfg.starts === 'quarter') return 15;
  return cfg.age === '3-4' ? 60 : 30;
}
function distractors(cfg, row, answer) {
  const grid = choiceGrid(cfg), near = [];
  if (cfg.ask === 'read') near.push(answer - 60, answer + 60, answer - 30);
  else if (cfg.ask === 'ride') near.push(answer - 5, answer + 5, answer + 10, answer - 10);
  else if (cfg.ask === 'depart') near.push(row.arrive + row.ride, answer + 5, answer - 5, answer + 10, answer - 10);
  else {
    const { minute } = clockParts(row.depart);
    if (minute + (row.ride % 60) > 60 || (minute + (row.ride % 60) === 60 && row.ride % 60)) near.push(answer - 60);
    near.push(answer - grid, answer + grid, answer - 2 * grid, answer + 2 * grid, answer - 60, answer + 60);
  }
  const valid = cfg.ask === 'ride' ? v => v > 0 && v <= 120 : inRange;
  const keep = list => [...new Set(list)].filter(v => v !== answer && v % grid === 0 && valid(v));
  const close = keep(near), far = [];
  for (let k = 1; k <= 8; k++) far.push(answer + k * grid, answer - k * grid);
  return { close, far: keep(far).filter(v => !close.includes(v)) };
}

export function createTimetableRound({ age = '5-6', level = 0, seed = 1 } = {}) {
  const levels = timetableLevels(age), cfg = levels[Math.max(0, Math.min(levels.length - 1, level | 0))];
  const rng = createRng(seed);
  const destinations = shuffled(rng, [...stationNames('coast').slice(1), ...stationNames('city'), ...stationNames('forest')]);
  const colors = shuffled(rng, ['blue', 'green', 'purple', 'red']);
  const rows = [], used = new Set();
  for (let attempt = 0; rows.length < cfg.rows && attempt < 400; attempt++) {
    const depart = startTime(rng, cfg.starts), ride = cfg.ask === 'read' ? 0 : pickOne(rng, cfg.rides), arrive = depart + ride;
    if (!inRange(depart) || !inRange(arrive) || used.has(depart)) continue;
    const { minute } = clockParts(depart);
    if (cfg.cross === false && minute + ride >= 60) continue;
    if (cfg.cross === true && minute + ride <= 60) continue;
    used.add(depart);
    const row = { id: `r${rows.length + 1}`, color: colors[rows.length], train: `${RAIL_COLORS[colors[rows.length]].name}列車`, to: destinations[rows.length], depart, ride, arrive, ask: cfg.ask };
    row.answer = cfg.ask === 'read' || cfg.ask === 'depart' ? depart : cfg.ask === 'ride' ? ride : arrive;
    const { close, far } = distractors(cfg, row, row.answer), others = [...close.slice(0, 1), ...shuffled(rng, close.slice(1)), ...far].slice(0, 2);
    row.choices = [row.answer, ...others].sort((a, b) => a - b);
    rows.push(row);
  }
  if (rows.length < cfg.rows) throw new Error('Could not build a timetable');
  rows.sort((a, b) => a.depart - b.depart);
  return { game: TIMETABLE_GAME.id, age: cfg.age, level: cfg.index, seed, ask: cfg.ask, starts: cfg.starts, focus: cfg.focus, station: stationNames('coast')[0], rows };
}

export const choiceWords = (round, value) => (round.ask === 'ride' ? rideWords(value) : round.age === '7-8' ? digital(value) : timeWords(value));
/** Time inside a sentence: 「3 點出發」 or 「8:15 出發」. */
const at = (round, value) => (round.age === '7-8' ? `${digital(value)} ` : timeWords(value));

export function checkTimetable(round, rowIndex, value) {
  const row = round.rows[rowIndex];
  if (!row) return { correct: false, hint: '' };
  const correct = Number(value) === row.answer;
  return { correct, hint: correct ? '' : timetableHint(round, rowIndex) };
}

/** Method hints only. */
export function timetableHint(round, rowIndex) {
  const row = round.rows[rowIndex];
  if (!row) return '';
  const { hour, minute } = clockParts(row.depart);
  if (round.ask === 'read') return minute === 30 ? '長針指著 6 是半點。短針在兩個數字中間，看它剛走過哪一個數字。' : '看短針指著哪個數字；長針指著 12，就是整點。';
  if (round.ask === 'ride') return '從出發時間開始，長針 5 分、5 分往前走，數到到站時間，一共走了幾分鐘？';
  if (round.ask === 'depart') return '從到站時間往回撥：長針倒退坐車的分鐘數，經過 12 時，短針也要退一格。';
  if (row.ride % 60 === 0) return `短針往前走 1 格，就是過了 1 小時。從 ${hour} 開始，往前數 ${row.ride / 60} 格。`;
  if (row.ride === 30) return minute === 30 ? '長針從 6 再走半圈，回到 12，就到下一個整點了。' : '長針走半圈是 30 分鐘，會從 12 走到 6。';
  if (row.ride % 30 === 0) return '先加整整的小時，再加 30 分鐘（長針走半圈）。';
  if (minute + row.ride > 60) return `先算到下一個整點還要幾分鐘，再加上剩下的分鐘。`;
  if (row.ride % 15 === 0) return '長針走 3 個數字是 15 分鐘，一刻鐘一刻鐘往前數。';
  return '長針每走 1 個數字是 5 分鐘。從出發時間 5 分、5 分往前數。';
}

/** Steps the helper clock offers after a wrong answer. Negative steps turn the clock back. */
export function helperSteps(round) {
  if (round.ask === 'read') return [];
  if (round.ask === 'depart') return [-5, -30, -60];
  if (round.starts === 'hour' && round.age === '3-4') return [60];
  if (['hour', 'half', 'hourOrHalf'].includes(round.starts)) return [30, 60];
  if (round.starts === 'quarter') return [15, 60];
  return [5, 30, 60];
}

/** Hour and minute hand angles in degrees, clockwise from 12. */
export function handAngles(minutes) {
  const { hour, minute } = clockParts(minutes);
  return { hour: ((hour % 12) + minute / 60) * 30, minute: minute * 6 };
}
export function rowQuestion(round, rowIndex) {
  const row = round.rows[rowIndex];
  if (!row) return '';
  if (round.ask === 'read') return `看時鐘：${row.train}幾點出發？`;
  if (round.ask === 'ride') return `${row.train} ${digital(row.depart)} 出發，${digital(row.arrive)} 到${row.to}。坐了多久？`;
  if (round.ask === 'depart') return `${row.train}坐 ${rideWords(row.ride)}，${at(round, row.arrive)}到${row.to}。幾點出發？`;
  return `${row.train} ${at(round, row.depart)}出發，坐 ${rideWords(row.ride)}。幾點到${row.to}？`;
}
