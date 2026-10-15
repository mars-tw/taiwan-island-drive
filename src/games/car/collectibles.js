import { TRACK_LENGTH } from './config.js';

// Golden stars along the road. Half sit in the starting lane so a child who
// only holds the pedal still collects some; the rest reward gentle steering.
export const STAR_COUNT = 12;
export const STAR_HIT = Object.freeze({ along: 2.6, across: 2.1 });
const LANE_PATTERN = [-2.7, -2.7, -1.4, 0, 1.4, 2.7, 2.7, 1.4, 0, -1.4, -2.7, -2.7];

const blocked = (z, lateral, obstacles) => obstacles.some(o => Math.abs(o.z - z) < (o.radius || 1) + 6 && Math.abs(o.lateral - lateral) < (o.radius || 1) + 2.4);

/** Deterministic star positions; a star never sits on top of a roadside obstacle. */
export function starLayout(mapId = 'coast', obstacles = []) {
  const shift = { coast: 0, alishan: 3, taipei: 6, kenting: 9 }[mapId] ?? 0;
  const first = 150, last = TRACK_LENGTH - 130, gap = (last - first) / (STAR_COUNT - 1);
  return Array.from({ length: STAR_COUNT }, (_, i) => {
    const z = Math.round(first + gap * i);
    let lateral = LANE_PATTERN[(i + shift) % LANE_PATTERN.length];
    if (blocked(z, lateral, obstacles)) lateral = [-2.7, 0, 2.7, -1.4, 1.4].find(lane => !blocked(z, lane, obstacles)) ?? lateral;
    return { id: i, z, lateral };
  });
}

/** Returns ids of stars touched by the car that are not yet in `collected`. */
export function touchedStars(physics, stars, collected) {
  const hits = [];
  for (const star of stars) {
    if (collected.has(star.id)) continue;
    if (Math.abs(star.z - physics.distance) < STAR_HIT.along && Math.abs(star.lateral - physics.lateral) < STAR_HIT.across) hits.push(star.id);
  }
  return hits;
}
