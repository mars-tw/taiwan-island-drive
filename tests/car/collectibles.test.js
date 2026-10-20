import test from 'node:test';
import assert from 'node:assert/strict';
import { MAPS, VEHICLES, TRACK_LENGTH, ROAD_HALF_WIDTH } from '../../src/games/car/config.js';
import { STAR_COUNT, starLayout, touchedStars } from '../../src/games/car/collectibles.js';
import { createPhysicsState, stepPhysics } from '../../src/games/car/physics.js';
import { Game } from '../../src/games/car/game.js';

test('every map has twelve deterministic road stars, on the road and inside the course', () => {
  for (const map of MAPS) {
    const stars = starLayout(map.id);
    assert.equal(stars.length, STAR_COUNT);
    assert.deepEqual(stars, starLayout(map.id));
    for (const star of stars) {
      assert.ok(star.z > 100 && star.z < TRACK_LENGTH - 100);
      assert.ok(Math.abs(star.lateral) < ROAD_HALF_WIDTH - 0.7, 'stars stay on the paved road');
    }
  }
  const blocked = starLayout('coast', [{ z: 150, lateral: -2.7, radius: 1 }]);
  assert.notEqual(blocked[0].lateral, -2.7, 'a star moves away from an obstacle');
});

test('a star is collected once when the car drives through it', () => {
  const [star] = starLayout('coast');
  const collected = new Set();
  const near = { distance: star.z + 1, lateral: star.lateral + 1 };
  assert.deepEqual(touchedStars(near, [star], collected), [star.id]);
  collected.add(star.id);
  assert.deepEqual(touchedStars(near, [star], collected), []);
  assert.deepEqual(touchedStars({ distance: star.z, lateral: star.lateral + 4 }, [star], new Set()), []);
});

test('holding only the pedal still collects some stars; steering is needed for all of them', () => {
  const coupe = VEHICLES.find(v => v.id === 'coupe');
  for (const map of MAPS) {
    const stars = starLayout(map.id), collected = new Set();
    let state = createPhysicsState();
    for (let tick = 0; tick < 60 * 120 && !state.completed; tick++) {
      state = stepPhysics(state, { steer: 0, throttle: 1, brake: 0, boost: false }, coupe, map.id, 1 / 60);
      for (const id of touchedStars(state, stars, collected)) collected.add(id);
    }
    assert.ok(state.completed, `${map.id} completes with pedal only`);
    assert.ok(collected.size >= 2 && collected.size < STAR_COUNT, `${map.id}: pedal-only collects ${collected.size}`);
  }
});

test('the car game reports collected stars in its state and finish result', () => {
  const events = [];
  const game = new Game({ canvas: null, onCollect: event => events.push(event) });
  game.starLayout = starLayout('coast'); game.starMeshes = [];
  const [first] = game.starLayout;
  game.physics = { ...createPhysicsState(), distance: first.z, lateral: first.lateral };
  game.collectStars(); game.collectStars();
  assert.equal(events.length, 1);
  assert.deepEqual(events[0], { collected: 1, total: STAR_COUNT, id: first.id });
  const state = game.getState();
  assert.equal(state.stars, 1); assert.equal(state.starTotal, STAR_COUNT);
  let result; game.onFinish = value => { result = value; }; game.onUpdate = () => {};
  game.finish(true);
  assert.equal(result.stars, 1); assert.equal(result.starTotal, STAR_COUNT);
});
