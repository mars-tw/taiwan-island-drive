// R48 B line: per-game, per-age progress in the shared student record (section railPlayR48).
// Unknown or damaged data is ignored, never thrown; levels unlock one after another.
import { readStudent, updateStudentSection } from '../../shared/student-save.js';
import { AGE_BANDS } from './common.js';

export const PROGRESS_SECTION = 'railPlayR48';
const GAME_IDS = Object.freeze(['switch-platform', 'shunting-yard', 'single-line-meet', 'boarding-count', 'platform-timetable']);

export function normalizeProgress(raw) {
  const games = {};
  for (const id of GAME_IDS) {
    const entry = raw?.games?.[id];
    games[id] = {};
    for (const age of AGE_BANDS) {
      const cleared = entry?.[age]?.cleared, plays = entry?.[age]?.plays;
      games[id][age] = { cleared: Number.isInteger(cleared) && cleared >= 0 && cleared <= 6 ? cleared : 0, plays: Number.isInteger(plays) && plays >= 0 ? Math.min(plays, 99999) : 0 };
    }
  }
  return { v: 1, games };
}
export function readProgress() {
  try { return normalizeProgress(readStudent().sections?.[PROGRESS_SECTION]); } catch { return normalizeProgress(null); }
}
/** Marks level index as cleared; returns true when the record was saved on this device. */
export function recordClear(gameId, age, level) {
  if (!GAME_IDS.includes(gameId) || !AGE_BANDS.includes(age)) return false;
  const progress = readProgress(), entry = progress.games[gameId][age];
  entry.cleared = Math.max(entry.cleared, Math.min(6, (level | 0) + 1));
  entry.plays += 1;
  try { return updateStudentSection(PROGRESS_SECTION, progress); } catch { return false; }
}
export const unlockedLevel = (progress, gameId, age) => Math.min(5, progress.games[gameId]?.[age]?.cleared ?? 0);
