import { TRACK_LENGTH, ROAD_HALF_WIDTH } from './config.js';

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const MAP_PROFILES = {
  coast: { curve: 20, wave: 245, phase: 0.8, hill: 2.2, elevation: 1.5 },
  alishan: { curve: 29, wave: 125, phase: 0.4, hill: 7, elevation: 4 },
  taipei: { curve: 11, wave: 240, phase: 0, hill: 0.4, elevation: 0.3 },
  kenting: { curve: 17, wave: 290, phase: 1.2, hill: 1.8, elevation: 0.8 },
};

/** Road coordinates are shared by rendering and simulation. Metres, +Z forward. */
export function roadCenter(distance, map = 'coast') {
  const p = MAP_PROFILES[map] || MAP_PROFILES.coast;
  return p.curve * (Math.sin(distance / p.wave + p.phase) - Math.sin(p.phase))
    + p.curve * 0.32 * Math.sin(distance / (p.wave * 0.61));
}
export function roadHeading(distance, map = 'coast') {
  const p = MAP_PROFILES[map] || MAP_PROFILES.coast;
  return Math.atan(p.curve / p.wave * Math.cos(distance / p.wave + p.phase)
    + p.curve * 0.32 / (p.wave * 0.61) * Math.cos(distance / (p.wave * 0.61)));
}
export function routeAltitude(distance, map = 'coast') {
  const p = MAP_PROFILES[map] || MAP_PROFILES.coast;
  return p.elevation + p.hill * (0.45 + 0.45 * Math.sin(distance / 190))
    + p.hill * 0.12 * Math.sin(distance / 70);
}

export function createPhysicsState() {
  return { distance: 0, speed: 0, lateral: -2.7, yaw: 0, steer: 0, elapsed: 0,
    boost: 1, offRoad: false, collisions: 0, cleanTime: 0, boostTime: 0,
    collisionCooldown: 0, collision: false, completed: false };
}

export function timeAttackLimit(vehicle, map = 'coast') {
  const speed = (vehicle?.maxSpeed || 180) / 3.6;
  return Math.ceil(TRACK_LENGTH / (speed * (map === 'alishan' ? 0.63 : 0.68)) + 20);
}

/** Deterministic arcade handling. A new state is returned; input is never mutated. */
export function stepPhysics(previous, input, vehicle, map, dt, obstacles = []) {
  const s = { ...previous, collision: false };
  const step = clamp(Number.isFinite(dt) ? dt : 0, 0, 0.05);
  if (s.completed || step === 0) return s;
  const throttle = clamp(Number(input?.throttle) || 0, 0, 1);
  const brake = clamp(Number(input?.brake) || 0, 0, 1);
  const targetSteer = clamp(Number(input?.steer) || 0, -1, 1);
  const max = (vehicle?.maxSpeed || 180) / 3.6;
  const handling = vehicle?.handling || 0.9;
  const acceleration = (vehicle?.acceleration || 28) / 3.6;
  s.steer += (targetSteer - s.steer) * Math.min(1, step * 8);
  const boosting = !!input?.boost && s.boost > 0.02 && throttle > 0 && !brake;
  const drag = 0.45 + s.speed * s.speed * 0.00085;
  const engine = throttle * acceleration * (1 - 0.32 * s.speed / max);
  s.speed = clamp(s.speed + (engine - drag - brake * 12 + (boosting ? 7.5 : 0)
    - (s.offRoad ? 2.5 + s.speed * 0.16 : 0)) * step, 0, max * (boosting ? 1.2 : 1));
  s.boost = clamp(s.boost + (boosting ? -0.145 : 0.048) * step, 0, 1);
  if (boosting) s.boostTime += step;
  // A gently stabilising heading keeps touch steering forgiving at highway speeds.
  const desiredYaw = s.steer * (0.31 * handling) / (1 + s.speed * 0.008);
  const oldHeading = roadHeading(s.distance, map);
  s.yaw += (desiredYaw - s.yaw) * Math.min(1, step * 4.5);
  const advance = Math.cos(s.yaw) * s.speed * step;
  s.distance = Math.min(TRACK_LENGTH, s.distance + advance);
  s.lateral += Math.sin(s.yaw) * s.speed * step;
  // Curves exert a small centrifugal drift, without forcing constant corrections.
  const curvature = (roadHeading(s.distance, map) - oldHeading) / Math.max(advance, 0.01);
  s.lateral -= curvature * s.speed * s.speed * step * 0.038;
  s.offRoad = Math.abs(s.lateral) > ROAD_HALF_WIDTH - 0.7;
  s.collisionCooldown = Math.max(0, s.collisionCooldown - step);
  const railHit = Math.abs(s.lateral) > ROAD_HALF_WIDTH + 1.55;
  const obstacleHit = obstacles.some(o => Math.abs(o.z - s.distance) < (o.radius || 1) + 1.5
    && Math.abs(o.lateral - s.lateral) < (o.radius || 1) + 0.75);
  if ((railHit || obstacleHit) && s.collisionCooldown === 0) {
    s.speed *= railHit ? 0.56 : 0.35;
    s.lateral = clamp(s.lateral, -ROAD_HALF_WIDTH - 1.45, ROAD_HALF_WIDTH + 1.45);
    s.yaw *= -0.3;
    s.collisions += 1;
    s.collisionCooldown = 1.1;
    s.collision = true;
  }
  s.lateral = clamp(s.lateral, -ROAD_HALF_WIDTH - 1.5, ROAD_HALF_WIDTH + 1.5);
  s.elapsed += step;
  if (!s.offRoad) s.cleanTime += step;
  s.completed = s.distance >= TRACK_LENGTH;
  return s;
}

export function calculateScore(state) {
  return Math.max(0, Math.floor(state.distance * 10 + state.cleanTime * 6
    + state.boostTime * 15 - state.collisions * 250));
}
