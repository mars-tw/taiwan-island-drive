import test from 'node:test';
import assert from 'node:assert/strict';
import { rewardForEvent } from '../../src/games/flight/rewards.js';

test('flight mission events that a child achieves earn one star with a short cheer', () => {
  for (const type of ['star', 'mail', 'landmark', 'ring']) {
    const reward = rewardForEvent({ id: 1, type });
    assert.equal(reward.stars, 1); assert.ok(reward.text.length <= 12);
  }
  assert.equal(rewardForEvent({ type: 'landmark', label: '燈塔' }).text, '到了，燈塔！');
  assert.equal(rewardForEvent({ type: 'mail-missed' }), null, 'a missed drop is not punished, but not rewarded');
  assert.equal(rewardForEvent(null), null);
});
