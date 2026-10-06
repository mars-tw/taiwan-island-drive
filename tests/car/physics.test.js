import test from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera, Vector3 } from 'three';
import { MAPS, VEHICLES, TRACK_LENGTH, ROAD_HALF_WIDTH } from '../../src/games/car/config.js';
import {
  createPhysicsState, stepPhysics, calculateScore, timeAttackLimit,
  roadCenter, roadHeading, routeAltitude,
} from '../../src/games/car/physics.js';
import { Game } from '../../src/games/car/game.js';

const coupe = VEHICLES.find(vehicle => vehicle.id === 'coupe');
const cruise = { steer: 0, throttle: 1, brake: 0, boost: false };
const coast = { steer: 0, throttle: 0, brake: 0, boost: false };

function simulate(vehicle, input, seconds, initial = createPhysicsState(), map = 'taipei') {
  let state = initial;
  for (let tick = 0; tick < Math.ceil(seconds / 0.02); tick++) {
    state = stepPhysics(state, input, vehicle, map, 0.02);
  }
  return state;
}

function assertFiniteState(state) {
  for (const [key, value] of Object.entries(state)) {
    if (typeof value === 'number') assert.ok(Number.isFinite(value), `${key} must stay finite`);
  }
}

test('starting without throttle stays stationary; a moving car loses speed while coasting', () => {
  const stationary = simulate(coupe, coast, 5);
  assert.equal(stationary.speed, 0);
  assert.equal(stationary.distance, 0);
  const moving = simulate(coupe, coast, 2, { ...createPhysicsState(), speed: 20 });
  assert.ok(moving.speed > 0 && moving.speed < 20);
  assert.ok(moving.distance > 0);
});

test('throttle accelerates, brake reduces speed, and specs affect performance', () => {
  const fast = simulate(coupe, cruise, 5);
  const van = simulate(VEHICLES.find(vehicle => vehicle.id === 'van'), cruise, 5);
  assert.ok(fast.speed > van.speed && van.speed > 0);
  assert.ok(fast.distance > van.distance);
  const braked = simulate(coupe, { ...coast, brake: 1 }, 1, fast);
  const unbraked = simulate(coupe, coast, 1, fast);
  assert.ok(braked.speed < unbraked.speed);
  assert.ok(braked.speed >= 0);
});

test('right touch/key/tilt input moves screen-right in the forward-facing chase camera', () => {
  const initial = { ...createPhysicsState(), lateral: 0, speed: 22 };
  const left = simulate(coupe, { ...cruise, steer: -1 }, 0.5, initial);
  const right = simulate(coupe, { ...cruise, steer: 1 }, 0.5, initial);
  const straight = simulate(coupe, cruise, 0.5, initial);
  const camera = new PerspectiveCamera(55, 1, 0.1, 1800);
  camera.position.set(0, 4.2, -9.2); camera.lookAt(0, 1.15, 15); camera.updateMatrixWorld();
  const screenX = state => new Vector3(state.lateral, 0.8, state.distance).project(camera).x;
  assert.ok(screenX(left) < screenX(straight), 'left must move to the left side of the rendered view');
  assert.ok(screenX(right) > screenX(straight), 'right must move to the right side of the rendered view');
  assert.ok(right.yaw < 0 && left.yaw > 0, '+Z travel reverses world-X relative to screen-right');
});

test('boost increases speed, spends charge, recovers charge, and is disabled while braking', () => {
  const plain = simulate(coupe, cruise, 2);
  const boosted = simulate(coupe, { ...cruise, boost: true }, 2);
  assert.ok(boosted.speed > plain.speed);
  assert.ok(boosted.boost < plain.boost);
  assert.ok(boosted.boostTime > 0);
  const recovered = simulate(coupe, coast, 1, boosted);
  assert.ok(recovered.boost > boosted.boost);
  const braking = simulate(coupe, { ...cruise, brake: 1, boost: true }, 1);
  assert.equal(braking.boostTime, 0);
});

test('leaving the road slows the car and guardrails bound lateral travel', () => {
  const initial = { ...createPhysicsState(), speed: 25, lateral: 0 };
  const onRoad = simulate(coupe, cruise, 1, initial);
  const offRoad = simulate(coupe, cruise, 1, {
    ...initial, lateral: ROAD_HALF_WIDTH + 0.5, offRoad: true,
  });
  assert.ok(offRoad.offRoad);
  assert.ok(offRoad.speed < onRoad.speed);
  const impact = stepPhysics({ ...initial, lateral: ROAD_HALF_WIDTH + 4 }, coast, coupe, 'taipei', 0.02);
  assert.equal(impact.collisions, 1);
  assert.equal(impact.collision, true);
  assert.ok(Math.abs(impact.lateral) <= ROAD_HALF_WIDTH + 1.5);
  assert.ok(impact.speed < initial.speed);
  const cooldown = stepPhysics(impact, cruise, coupe, 'taipei', 0.02, [
    { z: impact.distance, lateral: impact.lateral, radius: 2 },
  ]);
  assert.equal(cooldown.collisions, 1);
});

test('an obstacle impact is localized and penalizes score', () => {
  const initial = { ...createPhysicsState(), distance: 100, speed: 20, lateral: 0 };
  const clean = stepPhysics(initial, cruise, coupe, 'taipei', 0.02, [{ z: 150, lateral: 0, radius: 1 }]);
  const hit = stepPhysics(initial, cruise, coupe, 'taipei', 0.02, [{ z: 100, lateral: 0, radius: 1 }]);
  assert.equal(clean.collisions, 0);
  assert.equal(hit.collisions, 1);
  assert.ok(hit.speed < clean.speed);
  assert.ok(calculateScore(hit) < calculateScore(clean));
  assert.equal(calculateScore({ ...initial, distance: 0, cleanTime: 0, collisions: 10 }), 0);
});

test('simulation is deterministic and does not mutate state or controls', () => {
  const initial = Object.freeze(createPhysicsState());
  const controls = Object.freeze({ ...cruise, steer: 0.3 });
  const original = { ...initial };
  const first = simulate(coupe, controls, 5, initial, 'coast');
  const second = simulate(coupe, controls, 5, initial, 'coast');
  assert.deepEqual(first, second);
  assert.deepEqual(initial, original);
  assert.notStrictEqual(first, initial);
});

test('invalid and oversized dt values cannot move time or produce unstable simulation', () => {
  const initial = { ...createPhysicsState(), speed: 20 };
  for (const invalid of [NaN, Infinity, -1, 0, undefined]) {
    const state = stepPhysics(initial, cruise, coupe, 'coast', invalid);
    assert.equal(state.distance, initial.distance);
    assert.equal(state.elapsed, 0);
    assertFiniteState(state);
  }
  const clamped = stepPhysics(initial, cruise, coupe, 'coast', 10);
  const fixed = stepPhysics(initial, cruise, coupe, 'coast', 0.05);
  assert.deepEqual(clamped, fixed);
  const inputs = stepPhysics(initial, { throttle: Infinity, steer: NaN, brake: -4 }, coupe, 'coast', 0.02);
  assertFiniteState(inputs);
});

test('every route and vehicle reaches the finish inside its time attack budget', () => {
  for (const map of MAPS) {
    for (const vehicle of VEHICLES) {
      const limit = timeAttackLimit(vehicle, map.id);
      assert.ok(Number.isFinite(limit) && limit > 0);
      const final = simulate(vehicle, cruise, limit, createPhysicsState(), map.id);
      assertFiniteState(final);
      assert.equal(final.completed, true, `${map.id}/${vehicle.id} must finish within ${limit}s`);
      assert.equal(final.distance, TRACK_LENGTH);
      assert.ok(final.speed <= vehicle.maxSpeed / 3.6);
      const stopped = stepPhysics(final, { ...cruise, boost: true }, vehicle, map.id, 0.02);
      assert.equal(stopped.distance, final.distance);
      assert.equal(stopped.elapsed, final.elapsed);
    }
  }
});

test('road heading matches the derivative of the route used by the renderer', () => {
  for (const map of MAPS) {
    assert.equal(roadCenter(0, map.id), 0);
    for (const distance of [0, 100, 800, 1600, 2400]) {
      const delta = 0.001;
      const derivative = (roadCenter(distance + delta, map.id) - roadCenter(distance - delta, map.id)) / (delta * 2);
      assert.ok(Math.abs(Math.atan(derivative) - roadHeading(distance, map.id)) < 1e-7);
      assert.ok(Number.isFinite(routeAltitude(distance, map.id)));
    }
  }
  assert.equal(roadCenter(100, 'unknown'), roadCenter(100, 'coast'));
});

// Exercise the real game clock with rendering/audio replaced by inert adapters.
// This verifies lifecycle decisions without pretending to test WebGL or browser UI.
function withGameClock(run) {
  const previousRAF = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = () => 0;
  const results = [];
  const game = new Game({ canvas: {}, onFinish: result => results.push(result) });
  game.initialized = true;
  game.placeVehicle = () => {};
  game.updateCamera = () => {};
  game.world = { obstacles: [], update() {} };
  game.renderer = { render() {} };
  game.audio = { unlock: () => Promise.resolve(), beep() {}, update() {} };
  let timestamp = 1;
  const advance = seconds => {
    for (let tick = 0; tick < Math.ceil(seconds * 60); tick++) {
      timestamp += 1000 / 60;
      game.frame(timestamp);
    }
  };
  try { run(game, advance, results); }
  finally {
    if (previousRAF === undefined) delete globalThis.requestAnimationFrame;
    else globalThis.requestAnimationFrame = previousRAF;
  }
}

test('countdown and running pause independently; restart clears the previous journey', () => {
  withGameClock((game, advance) => {
    game.start('timeattack');
    advance(1);
    assert.equal(game.phase, 'countdown');
    assert.equal(game.physics.elapsed, 0);
    const countdown = game.countdownRemaining;
    game.pause(); advance(2);
    assert.equal(game.phase, 'paused');
    assert.equal(game.countdownRemaining, countdown);
    game.resume();
    assert.equal(game.phase, 'countdown');
    advance(3);
    assert.equal(game.phase, 'running');
    game.input.throttle = 1; advance(2);
    assert.ok(game.physics.distance > 0);
    const elapsed = game.physics.elapsed;
    game.pause(); advance(2);
    assert.equal(game.physics.elapsed, elapsed);
    assert.equal(game.input.throttle, 0);
    game.resume(); advance(1);
    assert.ok(game.physics.elapsed > elapsed);
    game.reset();
    assert.equal(game.mode, 'timeattack');
    assert.equal(game.phase, 'countdown');
    assert.equal(game.physics.distance, 0);
    assert.equal(game.physics.elapsed, 0);
  });
});

test('time attack expires once, freezes journey time, and can return to the menu', () => {
  withGameClock((game, advance, results) => {
    game.start('timeattack');
    advance(timeAttackLimit(coupe, 'coast') + 5);
    assert.equal(game.phase, 'finished');
    assert.equal(results.length, 1);
    assert.equal(results[0].completed, false);
    assert.equal(game.getState().timeLeft, 0);
    const elapsed = game.physics.elapsed;
    advance(2);
    assert.equal(results.length, 1);
    assert.equal(game.physics.elapsed, elapsed);
    game.returnToMenu();
    assert.equal(game.phase, 'menu');
    assert.equal(game.physics.elapsed, 0);
  });
});

test('a completed trip wins before timeout and emits exactly one finish result', () => {
  withGameClock((game, advance, results) => {
    game.start('timeattack');
    advance(3.1);
    game.physics = { ...createPhysicsState(), distance: TRACK_LENGTH - 0.1, speed: 30 };
    game.input.throttle = 1;
    advance(0.1);
    assert.equal(game.phase, 'finished');
    assert.equal(results.length, 1);
    assert.equal(results[0].completed, true);
    assert.equal(results[0].distance, TRACK_LENGTH);
    advance(1);
    assert.equal(results.length, 1);
  });
});
