import test from 'node:test';
import assert from 'node:assert/strict';
import {ContentLesson,STAND_HOLD_SECONDS} from '../../src/shared/content-r35.js';
import {boardingScene} from '../../src/shared/content-r35-scene.js';
import {boardingSceneR43} from '../../src/shared/content-r43-scene.js';

function atThreshold(stable, bump=0) {
  const g = new ContentLesson('tickets');
  Object.assign(g, {
    phase: 'boarding', doorStage: 'boarding', boardingIndex: 1, boardTime: .41,
    escortWaiting: true, escortStable: stable, escortBump: bump,
  });
  return g;
}

test('R43 uses a different planted-feet frame only after the full threshold hold', () => {
  assert.equal(boardingSceneR43(atThreshold(STAND_HOLD_SECONDS - .01))[1].pose, 'standing');
  const full = boardingSceneR43(atThreshold(STAND_HOLD_SECONDS));
  const base = boardingScene(atThreshold(STAND_HOLD_SECONDS));
  assert.equal(full[1].pose, 'steady');
  assert.deepEqual({...full[0]}, {...base[0]});
  assert.deepEqual({...full[2]}, {...base[2]});
  assert.deepEqual({...full[1], pose: base[1].pose}, {...base[1]});
});

test('R43 early-release bump remains the original balancing frame; release at 100% keeps steady visible', () => {
  assert.equal(boardingSceneR43(atThreshold(.3, .4))[1].pose, 'balancing');
  const g = atThreshold(STAND_HOLD_SECONDS);
  g.input.escort = false;
  const frame = boardingSceneR43(g)[1];
  const base = boardingScene(g)[1];
  assert.equal(frame.pose, 'steady');
  assert.equal(frame.surface, 'threshold');
  assert.equal(frame.x, base.x);
  assert.equal(frame.bottom, base.bottom);
  assert.equal(frame.progress, base.progress);
});

test('R43 visual pose does not change boarding position, progress, counts, or the saved-game schema', () => {
  const g = atThreshold(STAND_HOLD_SECONDS);
  const before = boardingSceneR43(g).map(({index, pose, x, bottom, progress, seated}) => ({index, pose, x, bottom, progress, seated}));
  const base = boardingScene(g).map(({index, pose, x, bottom, progress, seated}) => ({index, pose, x, bottom, progress, seated}));
  assert.equal(before[1].pose, 'steady');
  assert.deepEqual(before.map((frame, i) => ({...frame, pose: i === 1 ? base[i].pose : frame.pose})), base);
  assert.equal(before[1].seated, false);
  assert.equal(g.snapshot().contentVersion, 33);
  assert.equal(g.boardingIndex, 1);
});
