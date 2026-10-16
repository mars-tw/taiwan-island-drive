import {progressStorage,readStudent} from './student-save.js';
export const SETTINGS_KEY = 'island-transport:settings:v1';
export const DEFAULT_SETTINGS = Object.freeze({ childMode: true, muted: false, quality: 'high' });
const subscribers = new Set();
let memory = { ...DEFAULT_SETTINGS };
function normalize(value = {}) {
  return { childMode: value.childMode !== false, muted: value.muted === true, quality: value.quality === 'low' ? 'low' : 'high' };
}
export function readSettings() {
  try { const saved = progressStorage.getItem(SETTINGS_KEY); memory = normalize(saved ? JSON.parse(saved) : {}); }
  catch { /* Keep the last usable in-memory preferences. */ }
  return { ...memory };
}
export function updateSettings(partial) {
  const next = normalize({ ...readSettings(), ...partial });
  memory = { ...next };
  try { progressStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); } catch { /* Private browsing still allows play. */ }
  for (const listener of subscribers) listener({ ...next });
  return next;
}
export function subscribeSettings(listener) { subscribers.add(listener); return () => subscribers.delete(listener); }
// The old native settings key is a migration input, never a competing writer.
export function restoreLegacySettings(value) { return readStudent().sections.settings ? readSettings() : updateSettings(value); }
if (typeof window !== 'undefined') window.addEventListener('storage', event => {
  if (event.key === SETTINGS_KEY) for (const listener of subscribers) listener(readSettings());
});
