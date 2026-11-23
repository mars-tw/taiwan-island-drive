import test from 'node:test';
import assert from 'node:assert/strict';
import { LESSONS } from '../../src/games/train/config.js';
import {
  meetLevels, createMeetRound, canMove, moveTrain, meetStatus, meetMessage, solveMeet, meetHasTrap,
} from '../../src/games/puzzles/single-line-meet.js';

const go = (round, id, track) => { const r = moveTrain(round, id, track); assert.ok(r.ok, `${id} should move: ${r.reason || 'choice'}`); return r.round; };

test('R48 meet: six levels per age, more trains and loops later; every level solvable', () => {
  for (const age of ['3-4', '5-6', '7-8']) {
    const levels = meetLevels(age);
    assert.equal(levels.length, 6);
    let lastMoves = 0;
    for (let i = 0; i < 6; i++) {
      if (i) { assert.ok(levels[i].trainCount >= levels[i - 1].trainCount || levels[i].loops > levels[i - 1].loops); assert.ok(levels[i].loops >= levels[i - 1].loops); }
      const solved = solveMeet(createMeetRound({ age, level: i }));
      assert.ok(Number.isFinite(solved.moves), `${age} L${i + 1} must be solvable`);
      assert.ok(solved.moves >= lastMoves);
      lastMoves = solved.moves;
    }
  }
  assert.equal(meetLevels('7-8')[0].trainCount, 2);
  assert.equal(meetLevels('7-8')[5].trainCount, 4);
});

test('R48 meet: the intro has no trap; every later level hides a deadlock or an order trap', () => {
  assert.equal(meetHasTrap(createMeetRound({ age: '5-6', level: 0 })), false);
  for (let i = 1; i < 6; i++) assert.equal(meetHasTrap(createMeetRound({ age: '5-6', level: i })), true, `5～6 L${i + 1}`);
  for (let i = 0; i < 6; i++) assert.equal(meetHasTrap(createMeetRound({ age: '7-8', level: i })), true, `7～8 L${i + 1}`);
});

test('R48 meet: a single-track block holds one train, in the words of train lesson 3', () => {
  assert.match(LESSONS.lesson3.description, /前方列車尚未離開/);
  let round = createMeetRound({ age: '5-6', level: 0 });
  round = go(round, 't1');
  round = go(round, 't2');
  round = go(round, 't1', 'main');
  const blocked = moveTrain(round, 't1');
  assert.equal(blocked.ok, false);
  assert.equal(blocked.reason, 'block');
  const message = meetMessage(round, blocked);
  assert.match(message, /前方列車尚未離開/);
  assert.match(message, /紅燈/);
  assert.equal(canMove(round, 't1').ok, false, 'the signal ahead of t1 shows red');
});

test('R48 meet: a passing station asks main or siding; long trains cannot use a short siding', () => {
  let round = createMeetRound({ age: '5-6', level: 1 });
  round = go(round, 't2');
  const ask = moveTrain(round, 't2');
  assert.equal(ask.needsChoice, true);
  assert.deepEqual(ask.options, ['main', 'side']);
  round = go(round, 't2', 'main');
  round = go(round, 't1');
  const tooLong = canMove(round, 't1');
  assert.equal(tooLong.reason, 'short');
  assert.match(meetMessage(round, { ok: false, train: 't1', ...tooLong }), /太長/);
  assert.equal(moveTrain(round, 't1').ok, false);
  assert.equal(meetStatus(round), 'stuck', 'short train on the main line + long train waiting = nobody can move');
  assert.match(meetMessage(round, { ok: true, status: 'stuck', to: round.trains[0] }), /倒回一步/);
});

test('R48 meet: the slow train must step aside, or the order goal is missed', () => {
  let round = createMeetRound({ age: '5-6', level: 2 });
  assert.deepEqual(round.goal, ['t2', 't1']);
  const queued = moveTrain(round, 't2');
  assert.equal(queued.reason, 'queue', 'the express waits behind the local at the start');
  let miss = round;
  miss = go(miss, 't1'); miss = go(miss, 't1', 'main'); miss = go(miss, 't1'); miss = go(miss, 't1');
  assert.equal(meetStatus(miss), 'order-miss');
  let win = round;
  win = go(win, 't1'); win = go(win, 't1', 'side');
  for (const step of [['t2'], ['t2'], ['t2'], ['t2'], ['t1'], ['t1']]) win = go(win, ...step);
  assert.equal(meetStatus(win), 'won');
});
