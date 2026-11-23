import test from 'node:test';
import assert from 'node:assert/strict';
import { railRoomEntries, registerRailGames, ROOM_AGE } from '../../src/games/puzzles/math-room.js';

const tick = () => new Promise(resolve => setTimeout(resolve, 0));
// Same checks as registerMathGame on isl-r48-a (src/games/math/room-registry.js, docs/MATH_ROOM.md).
function roomRegistry() {
  const ids = new Set(), entries = [];
  const text = (value, max) => typeof value === 'string' && value.trim().length > 0 && [...value].length <= max;
  return {
    entries,
    registerMathGame(entry) {
      assert.match(entry.id, /^[a-z][a-z0-9-]{1,40}$/);
      assert.ok(!ids.has(entry.id), `duplicate ${entry.id}`);
      assert.ok(['math', 'observe', 'build', 'life'].includes(entry.category));
      assert.ok(text(entry.name, 16) && text(entry.icon, 4) && text(entry.description, 48), `${entry.id} text sizes`);
      assert.ok(Array.isArray(entry.levels) && entry.levels.length && entry.levels.every(l => ['small', 'medium', 'large'].includes(l)) && new Set(entry.levels).size === entry.levels.length);
      assert.ok(Number.isFinite(entry.order));
      assert.equal(typeof entry.open, 'function');
      ids.add(entry.id); entries.push(entry);
      return () => ids.delete(entry.id);
    },
  };
}
function fakeRoom(level = 'large') {
  const calls = [];
  return { calls, ctx: { level, stage: null, hideRoom: () => calls.push('hide'), complete: () => { calls.push('complete'); return calls.filter(c => c === 'complete').length; }, exit: () => calls.push('exit'), speak: () => {}, setTitle: () => {}, paused: false } };
}
function fakeGames() {
  const opened = [];
  return { opened, load: async () => ({ openRailPlay(id, options) { const handle = { id, options, closed: null, close(o) { handle.closed = o; } }; opened.push(handle); return handle; } }) };
}

test('R48 math room adapter: five entries that pass the room registry rules, puzzles in 拼搭與方向, math in 數學', () => {
  const registry = roomRegistry();
  const undo = registerRailGames(registry.registerMathGame);
  assert.equal(undo.length, 5);
  const byId = Object.fromEntries(registry.entries.map(e => [e.id, e]));
  assert.deepEqual(registry.entries.filter(e => e.category === 'build').map(e => e.id), ['switch-platform', 'shunting-yard', 'single-line-meet']);
  assert.deepEqual(registry.entries.filter(e => e.category === 'math').map(e => e.id), ['boarding-count', 'platform-timetable']);
  assert.deepEqual(byId['single-line-meet'].levels, ['medium', 'large'], '單線會車 is for 5～8 歲');
  assert.deepEqual(byId['boarding-count'].levels, ['small', 'medium', 'large']);
  assert.deepEqual(ROOM_AGE, { small: '3-4', medium: '5-6', large: '7-8' });
});

test('R48 math room adapter: open(ctx) loads the game, hides the room, maps the age, stamps each cleared level and returns on close', async () => {
  const games = fakeGames(), entry = railRoomEntries({ load: games.load }).find(e => e.id === 'boarding-count');
  const room = fakeRoom('small');
  const cleanup = entry.open(room.ctx);
  assert.equal(typeof cleanup, 'function');
  assert.deepEqual(room.calls, [], 'the room stays visible until the game is ready');
  await tick();
  assert.deepEqual(room.calls, ['hide']);
  const [handle] = games.opened;
  assert.equal(handle.id, 'boarding-count');
  assert.equal(handle.options.age, '3-4');
  assert.equal(handle.options.backLabel, '遊戲室');
  handle.options.onWin({ level: 0, age: '3-4' });
  handle.options.onWin({ level: 1, age: '3-4' });
  assert.deepEqual(room.calls, ['hide', 'complete', 'complete']);
  handle.options.onClose();
  assert.deepEqual(room.calls.at(-1), 'exit');
  cleanup();
  assert.equal(handle.closed, null, 'already closed by the child; cleanup does nothing more');
});

test('R48 math room adapter: leaving the room early never opens a game; cleanup closes an open game silently', async () => {
  const games = fakeGames(), entry = railRoomEntries({ load: games.load }).find(e => e.id === 'switch-platform');
  const early = fakeRoom('medium'), stop = entry.open(early.ctx);
  stop();
  await tick();
  assert.equal(games.opened.length, 0);
  assert.deepEqual(early.calls, []);
  const room = fakeRoom('large'), cleanup = entry.open(room.ctx);
  await tick();
  assert.equal(games.opened[0].options.age, '7-8');
  cleanup();
  assert.deepEqual(games.opened[0].closed, { silent: true });
  const broken = railRoomEntries({ load: async () => { throw new Error('offline'); } })[0], lost = fakeRoom();
  broken.open(lost.ctx);
  await tick(); await tick();
  assert.deepEqual(lost.calls, ['exit'], 'a failed load sends the child back to the room');
});
