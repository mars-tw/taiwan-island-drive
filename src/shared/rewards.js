// Shared sticker/star collection for the three transport modes.
// Kept as plain data so it works in node tests and in private browsing.
import {progressStorage} from './student-save.js';
export const REWARDS_KEY = 'island-transport:rewards:v1';
export const REWARD_MODES = Object.freeze(['car', 'train', 'flight']);
const subscribers = new Set();
const empty = () => ({ car: 0, train: 0, flight: 0, best: {} });
let memory = empty();

const count = value => Math.max(0, Math.min(99999, Math.floor(Number(value) || 0)));

export function normalizeRewards(value = {}) {
  const result = empty();
  for (const mode of REWARD_MODES) result[mode] = count(value?.[mode]);
  if (value && typeof value.best === 'object' && value.best) {
    for (const [key, stars] of Object.entries(value.best)) if (typeof key === 'string' && key.length < 80) result.best[key] = Math.min(3, count(stars));
  }
  return result;
}

function storage() { return progressStorage; }

export function readRewards() {
  try { const saved = storage()?.getItem(REWARDS_KEY); memory = normalizeRewards(saved ? JSON.parse(saved) : {}); }
  catch { /* Keep the last usable in-memory rewards. */ }
  return { ...memory, best: { ...memory.best } };
}

function write(next) {
  memory = normalizeRewards(next);
  try { storage()?.setItem(REWARDS_KEY, JSON.stringify(memory)); } catch { /* Private browsing still allows play. */ }
  const snapshot = readRewardsFromMemory();
  for (const listener of subscribers) listener(snapshot);
  return snapshot;
}
const readRewardsFromMemory = () => ({ ...memory, best: { ...memory.best } });

/** Adds collected stars to a mode. Unknown modes and non-positive counts are ignored. */
export function addStars(mode, amount = 1) {
  const current = readRewards();
  const stars = count(amount);
  if (!REWARD_MODES.includes(mode) || stars === 0) return current;
  return write({ ...current, [mode]: current[mode] + stars });
}

/** Keeps the best 1-3 star rating for a course key; returns true when it improved. */
export function recordBest(key, rating) {
  const current = readRewards(), value = Math.min(3, count(rating));
  if (!key || value <= (current.best[key] || 0)) return false;
  write({ ...current, best: { ...current.best, [key]: value } });
  return true;
}

export const totalStars = rewards => REWARD_MODES.reduce((sum, mode) => sum + count(rewards?.[mode]), 0);

/** Toddler-friendly rating: finishing always earns one star. */
export function starRating(collected, total) {
  const ratio = total > 0 ? count(collected) / total : 0;
  return ratio >= 0.75 ? 3 : ratio >= 0.4 ? 2 : 1;
}

export function subscribeRewards(listener) { subscribers.add(listener); return () => subscribers.delete(listener); }
export function resetRewardsForTest() { memory = empty(); try { storage()?.removeItem(REWARDS_KEY); } catch { /* ignore */ } }

if (typeof window !== 'undefined') window.addEventListener('storage', event => {
  if (event.key === REWARDS_KEY) { const value = readRewards(); for (const listener of subscribers) listener(value); }
});
