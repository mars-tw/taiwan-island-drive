// R48 B line: shared, DOM-free helpers for the rail puzzles and the new math games.
// Age bands match the parent setting the math room introduces (3～4, 5～6, 7～8 歲).
import { ROUTES } from '../train/config.js';

export const AGE_BANDS = Object.freeze(['3-4', '5-6', '7-8']);
export const AGE_LABELS = Object.freeze({ '3-4': '3～4 歲', '5-6': '5～6 歲', '7-8': '7～8 歲' });

/** Accepts '3-4', '3～4', '7–8' or a single age number; anything else falls back. */
export function normalizeAge(value, fallback = '5-6') {
  if (typeof value === 'number' && Number.isFinite(value)) return value <= 4 ? '3-4' : value <= 6 ? '5-6' : '7-8';
  const text = String(value ?? '').replace(/[～~–—]/g, '-').replace(/\s|歲/g, '');
  if (AGE_BANDS.includes(text)) return text;
  return AGE_BANDS.includes(fallback) ? fallback : '5-6';
}

/** Reads the parent age band once the math room adds it; until then childMode means the youngest band. */
export function ageFromSettings(settings = {}) {
  if (settings && settings.ageBand !== undefined) return normalizeAge(settings.ageBand, settings.childMode === false ? '5-6' : '3-4');
  return settings && settings.childMode === false ? '5-6' : '3-4';
}

/** Deterministic RNG (mulberry32) so every round can be replayed and tested. */
export function createRng(seed = 1) {
  let a = (Number(seed) >>> 0) || 1;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const randInt = (rng, min, max) => min + Math.floor(rng() * (max - min + 1));
export const pickOne = (rng, list) => list[Math.floor(rng() * list.length)];
export function shuffled(rng, list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy;
}
export const newSeed = () => (Math.floor(Math.random() * 0xffffffff) >>> 0) || 1;

/** Station names come straight from the train mode routes, so the games share one map. */
export const stationNames = route => [...(ROUTES[route] || ROUTES.coast).stationNames];

/** Train and carriage colours are hue turns of the academy's own train art (sRGB). */
export const RAIL_COLORS = Object.freeze({
  blue: { id: 'blue', name: '藍色', hex: '#1f6fd1', hue: 0 },
  green: { id: 'green', name: '綠色', hex: '#1f9a3a', hue: -95 },
  purple: { id: 'purple', name: '紫色', hex: '#8e3fd6', hue: 60 },
  red: { id: 'red', name: '紅色', hex: '#d93a2b', hue: 140 },
  orange: { id: 'orange', name: '橘色', hex: '#f07a1a', hue: 0, art: 'orange' },
});
export const RAIL_SHAPES = Object.freeze({
  circle: { id: 'circle', name: '圓形' },
  triangle: { id: 'triangle', name: '三角形' },
  square: { id: 'square', name: '方形' },
  star: { id: 'star', name: '星星' },
});

/** Three answer buttons: the answer plus near misses inside [min, max], sorted for small hands. */
export function numberChoices(answer, { min = 0, max = 20, rng = Math.random, near = [], count = 3 } = {}) {
  const set = new Set([answer]);
  for (const value of near) if (set.size < count && Number.isInteger(value) && value >= min && value <= max) set.add(value);
  const steps = [1, -1, 2, -2, 3, -3];
  for (const step of shuffled(rng, steps)) { if (set.size >= count) break; const value = answer + step; if (value >= min && value <= max) set.add(value); }
  for (let value = min; set.size < count && value <= max; value++) set.add(value);
  return [...set].sort((a, b) => a - b);
}
