import test from 'node:test';
import assert from 'node:assert/strict';
import {
  timetableLevels, createTimetableRound, checkTimetable, timetableHint, helperSteps, handAngles, timeWords, digital, rideWords, choiceGrid, clockParts,
} from '../../src/games/math/platform-timetable.js';

const AGES = ['3-4', '5-6', '7-8'];

test('R48 timetable: whole hours for 3～4, half hours for 5～6, minutes and elapsed time for 7～8', () => {
  for (const age of AGES) assert.equal(timetableLevels(age).length, 6);
  assert.ok(timetableLevels('3-4').every(l => l.starts === 'hour' && (l.rides || [60, 120]).every(r => r % 60 === 0)));
  const mid = timetableLevels('5-6');
  assert.ok(mid.some(l => l.starts === 'half') && mid.some(l => (l.rides || []).includes(30)));
  assert.ok(mid.every(l => ['hour', 'half', 'hourOrHalf'].includes(l.starts)));
  const big = timetableLevels('7-8').map(l => l.ask);
  assert.deepEqual(big.slice(-2), ['ride', 'depart']);
  assert.ok(timetableLevels('7-8').some(l => l.cross === true));
});

test('R48 timetable: rows stay on a 1:00–12:55 clock with three on-grid choices', () => {
  for (const age of AGES) for (const level of timetableLevels(age)) for (let seed = 1; seed <= 60; seed++) {
    const round = createTimetableRound({ age, level: level.index, seed });
    assert.equal(round.rows.length, level.rows);
    const grid = choiceGrid(level);
    for (const row of round.rows) {
      assert.equal(row.arrive, row.depart + row.ride);
      assert.ok(row.depart >= 60 && row.arrive <= 12 * 60 + 55);
      assert.equal(row.choices.length, 3);
      assert.equal(new Set(row.choices).size, 3);
      assert.ok(row.choices.includes(row.answer));
      assert.ok(row.choices.every(c => c % grid === 0), `${age} L${level.index + 1}: ${row.choices}`);
      if (level.cross === false) assert.ok(clockParts(row.depart).minute + row.ride < 60);
      if (level.cross === true) assert.ok(clockParts(row.depart).minute + row.ride > 60);
      if (level.starts === 'hour') assert.equal(row.depart % 60, 0);
      if (level.starts === 'half') assert.equal(row.depart % 60, 30);
    }
  }
});

test('R48 timetable: answers checked by question type; hints explain the clock, helper steps match the level', () => {
  for (const age of AGES) for (const level of timetableLevels(age)) {
    const round = createTimetableRound({ age, level: level.index, seed: 9 });
    round.rows.forEach((row, i) => {
      const expected = { read: row.depart, arrive: row.arrive, ride: row.ride, depart: row.depart }[round.ask];
      assert.equal(row.answer, expected);
      assert.equal(checkTimetable(round, i, expected).correct, true);
      const wrong = row.choices.find(c => c !== expected), result = checkTimetable(round, i, wrong);
      assert.equal(result.correct, false);
      assert.equal(result.hint, timetableHint(round, i));
      assert.match(result.hint, /針|分|整點/);
    });
    const steps = helperSteps(round);
    if (round.ask === 'read') assert.deepEqual(steps, []);
    if (round.ask === 'depart') assert.ok(steps.every(s => s < 0));
    if (age === '3-4' && round.ask === 'arrive') assert.deepEqual(steps, [60]);
  }
});

test('R48 timetable: clock words and hands', () => {
  assert.equal(timeWords(3 * 60), '3 點');
  assert.equal(timeWords(3 * 60 + 30), '3 點半');
  assert.equal(timeWords(8 * 60 + 15), '8 點 15 分');
  assert.equal(digital(8 * 60 + 5), '8:05');
  assert.equal(rideWords(90), '1 個半小時');
  assert.equal(rideWords(45), '45 分鐘');
  assert.deepEqual(handAngles(3 * 60), { hour: 90, minute: 0 });
  assert.deepEqual(handAngles(6 * 60 + 30), { hour: 195, minute: 180 });
  assert.deepEqual(handAngles(12 * 60), { hour: 0, minute: 0 });
});
