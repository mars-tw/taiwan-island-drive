import test from 'node:test';
import assert from 'node:assert/strict';
import { stationReward, lessonRating, LESSON_BONUS } from '../../src/games/train/rewards.js';
import { TrainGame } from '../../src/games/train/game.js';

test('each newly served station earns one star; restarts never award negative stars', () => {
  assert.equal(stationReward(0, 1), 1);
  assert.equal(stationReward(1, 2), 1);
  assert.equal(stationReward(0, 2), 2);
  assert.equal(stationReward(2, 0), 0);
  assert.equal(LESSON_BONUS, 2);
});

test('lesson rating never drops below one star', () => {
  assert.equal(lessonRating(100), 3); assert.equal(lessonRating(85), 3);
  assert.equal(lessonRating(70), 2); assert.equal(lessonRating(0), 1);
});

test('the toddler hint always names exactly one existing child button or none', () => {
  const ids = new Set(['child-prepare', 'child-go', 'child-stop', 'child-help-stop', 'child-doors', 'child-emergency', '']);
  const game = new TrainGame();
  assert.equal(game.childHint().action, 'child-prepare');
  game.prepare(); assert.equal(game.childHint().action, 'child-go');
  game.childGo();
  for (let i = 0; i < 60 * 60; i++) { game.update(1 / 60); assert.ok(ids.has(game.childHint().action)); }
});
