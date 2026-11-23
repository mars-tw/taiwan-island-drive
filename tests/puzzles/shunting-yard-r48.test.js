import test from 'node:test';
import assert from 'node:assert/strict';
import {
  shuntingLevels, createShuntingRound, shuntMove, isShuntingSolved, shuntingMinMoves, shuntingHint, SHUNTING_TRACKS,
} from '../../src/games/puzzles/shunting-yard.js';

const AGES = ['3-4', '5-6', '7-8'];

/** Test-only breadth-first search that returns the move list, to replay through shuntMove. */
function plan(round) {
  const key = t => SHUNTING_TRACKS.map(k => t[k].join(',')).join('|');
  const goal = round.target.join(',');
  const queue = [{ tracks: round.tracks, path: [] }], seen = new Set([key(round.tracks)]);
  while (queue.length) {
    const { tracks, path } = queue.shift();
    if (tracks.out.join(',') === goal) return path;
    for (const from of SHUNTING_TRACKS) for (const to of SHUNTING_TRACKS) {
      if (from === to || !tracks[from].length) continue;
      const next = { a: [...tracks.a], b: [...tracks.b], out: [...tracks.out] };
      next[to].push(next[from].pop());
      const k = key(next);
      if (!seen.has(k)) { seen.add(k); queue.push({ tracks: next, path: [...path, [from, to]] }); }
    }
  }
  return null;
}

test('R48 shunting: six levels per age; more cars and more moves as levels rise; 3～4 歲 simplified', () => {
  for (const age of AGES) {
    const levels = shuntingLevels(age);
    assert.equal(levels.length, 6);
    for (let i = 1; i < 6; i++) {
      assert.ok(levels[i].cars >= levels[i - 1].cars);
      assert.ok(levels[i].band[0] >= levels[i - 1].band[0] && levels[i].band[1] >= levels[i - 1].band[1]);
    }
  }
  const little = shuntingLevels('3-4');
  assert.ok(little.every(l => l.cars <= 3 && !l.numbers), '3～4 歲: at most three cars, colours only');
  assert.deepEqual([...new Set(shuntingLevels('5-6').map(l => l.cars))], [2, 3, 4]);
  assert.deepEqual([...new Set(shuntingLevels('7-8').map(l => l.cars))], [3, 4, 5]);
  assert.ok(shuntingLevels('7-8').some(l => l.order === 'card'), '7～8 歲 also follow a mixed dispatch card');
});

test('R48 shunting: generated yards land in their move band and replay to a solved train', () => {
  for (const age of AGES) for (const level of shuntingLevels(age)) for (let seed = 1; seed <= 25; seed++) {
    const round = createShuntingRound({ age, level: level.index, seed: seed * 131 });
    const ids = round.cars.map(c => c.id);
    assert.deepEqual([...round.target].sort(), [...ids].sort());
    assert.equal(round.tracks.out.length, 0);
    assert.equal(round.tracks.a.length + round.tracks.b.length, level.cars);
    assert.ok(round.fewest >= level.band[0] && round.fewest <= level.band[1], `${age} L${level.index + 1} seed ${seed}: ${round.fewest} moves`);
    assert.equal(shuntingMinMoves(round.tracks, round.target), round.fewest);
    if (age === '5-6') assert.deepEqual(round.target, ids, '5～6 歲 count 1, 2, 3 from the buffer stop');
    const path = plan(round);
    assert.equal(path.length, round.fewest);
    let r = round;
    for (const [from, to] of path) { const step = shuntMove(r, from, to); assert.ok(step.ok); r = step.round; }
    assert.ok(isShuntingSolved(r));
    assert.equal(r.moves, round.fewest);
  }
});

test('R48 shunting: moves follow stub-siding rules and give gentle feedback', () => {
  const round = createShuntingRound({ age: '5-6', level: 1, seed: 5 });
  assert.equal(shuntMove(round, 'out', 'a').reason, 'empty');
  assert.equal(shuntMove(round, 'a', 'a').reason, 'same');
  const from = round.tracks.a.length ? 'a' : 'b';
  const outer = round.tracks[from].at(-1);
  const step = shuntMove(round, from, 'out');
  assert.equal(step.car, outer, 'only the outer car moves');
  assert.equal(step.round.tracks.out.at(-1), outer);
  assert.equal(step.round.moves, 1);
  assert.equal(round.moves, 0, 'the old state is untouched, so undo is just going back');
  const expected = outer === round.target[0] ? 'good' : 'oops';
  assert.equal(step.kind, expected);
  if (expected === 'oops') assert.match(shuntingHint(step.round), /拉出來/);
});

test('R48 shunting: hints describe the method (find the next car, clear the blockers)', () => {
  let blocked = false, free = false;
  for (let seed = 1; seed <= 40; seed++) {
    const round = createShuntingRound({ age: '7-8', level: 3, seed });
    const hint = shuntingHint(round);
    if (/前面有 \d+ 節車廂擋住/.test(hint)) { blocked = true; assert.match(hint, /移到另一條側線/); }
    if (/沒有被擋住/.test(hint)) free = true;
    assert.doesNotMatch(hint, /側線一.*側線二.*出發線/, 'never a full move list');
  }
  assert.ok(blocked && free);
});
