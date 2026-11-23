import test from 'node:test';
import assert from 'node:assert/strict';
import { ROUTES } from '../../src/games/train/config.js';
import { boardingLevels, createBoardingTrip, checkBoarding, boardingHint, BOARDING_MAX, questionText, stopSentence } from '../../src/games/math/boarding-count.js';

const AGES = ['3-4', '5-6', '7-8'];
const names = new Set(Object.values(ROUTES).flatMap(r => r.stationNames));

test('R48 boarding: age ranges are 5 / 10 / 20, six levels each, longer trips later', () => {
  assert.deepEqual(BOARDING_MAX, { '3-4': 5, '5-6': 10, '7-8': 20 });
  for (const age of AGES) {
    const levels = boardingLevels(age);
    assert.equal(levels.length, 6);
    for (let i = 1; i < 6; i++) assert.ok(levels[i].stops >= levels[i - 1].stops || levels[i].hidden || levels[i - 1].cross, `${age} L${i + 1}`);
    assert.equal(levels[0].hidden, false, 'every age starts with passengers in sight');
  }
  assert.equal(boardingLevels('3-4')[0].stops, 1, 'the first 3～4 歲 level is plain counting');
  assert.ok(boardingLevels('3-4').every(l => !l.hidden), '3～4 歲 can always see and count');
  assert.ok(boardingLevels('7-8').filter(l => l.hidden).length >= 3);
});

test('R48 boarding: every trip stays inside the age range and uses train-route station names', () => {
  for (const age of AGES) for (let level = 0; level < 6; level++) for (let seed = 1; seed <= 120; seed++) {
    const trip = createBoardingTrip({ age, level, seed });
    let count = 0;
    trip.stops.forEach((stop, i) => {
      assert.ok(names.has(stop.station), stop.station);
      assert.ok(stop.off <= count, 'nobody gets off an empty seat');
      if (i === 0) assert.equal(stop.off, 0);
      count = count - stop.off + stop.on;
      assert.equal(stop.after, count);
      assert.ok(count >= 1 && count <= BOARDING_MAX[age], `${age} L${level + 1}: ${count}`);
    });
    assert.ok(trip.stops[0].station === ROUTES[trip.route].stationNames[0]);
    for (const q of trip.questions) {
      assert.equal(q.choices.length, 3);
      assert.equal(new Set(q.choices).size, 3);
      assert.ok(q.choices.includes(q.answer));
      assert.ok(q.choices.every(c => c >= 0 && c <= BOARDING_MAX[age]));
    }
  }
});

test('R48 boarding: 7～8 歲 crosses ten both ways, then works backwards', () => {
  for (let seed = 1; seed <= 40; seed++) {
    const up = createBoardingTrip({ age: '7-8', level: 0, seed }), down = createBoardingTrip({ age: '7-8', level: 1, seed });
    assert.ok(up.stops[0].after < 10 && up.stops[1].after > 10);
    assert.ok(down.stops[0].after > 10 && down.stops[1].after < 10);
    const reverse = createBoardingTrip({ age: '7-8', level: 5, seed });
    const q = reverse.questions[0], stop = reverse.stops[q.stop];
    assert.equal(q.type, 'missing');
    assert.equal(q.answer, stop.on);
    assert.match(questionText(reverse, 0), /上車幾人/);
  }
});

test('R48 boarding: answers are checked; wrong answers get a counting method, not the number', () => {
  for (const age of AGES) for (let level = 0; level < 6; level++) {
    const trip = createBoardingTrip({ age, level, seed: 42 });
    trip.questions.forEach((q, i) => {
      assert.equal(checkBoarding(trip, i, q.answer).correct, true);
      const wrong = q.choices.find(c => c !== q.answer);
      const result = checkBoarding(trip, i, wrong);
      assert.equal(result.correct, false);
      assert.equal(result.hint, boardingHint(trip, i));
      assert.match(result.hint, /數|算|補到|減到/);
      assert.doesNotMatch(result.hint, new RegExp(`(有|是) ${q.answer} 人`));
    });
  }
  assert.equal(stopSentence({ station: '藍灣', on: 3, off: 2 }, 1), '藍灣站下車 2 人，上車 3 人');
});
