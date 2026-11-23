// R48 數學遊戲室存檔：學生證 sections.mathRoom（學院新程式，MIT）。
// 年齡級距、各玩法的集章數、最近題目（避免重複）與接回的小小列車長舊紀錄都放這裡。
import { readStudent, updateStudentSection } from '../../shared/student-save.js';
import { readSettings } from '../../shared/settings.js';
import { HISTORY_LIMITS, STORAGE_KEY as LEGACY_KEY, readProgress, rememberTrip } from './engine.js';
import { SOUVENIRS } from './adventure.js';
import { JOURNEYS } from './journeys.js';
import { LEVEL_IDS } from './room-registry.js';
import { LEGACY_TRAIN_NAMES } from './legacy-trains.js';

export const ROOM_SECTION = 'mathRoom';
export { LEGACY_KEY };
const count = value => Number.isSafeInteger(value) && value >= 0 ? Math.min(value, 99999) : 0;
const strings = (value, allowed) => Array.isArray(value) ? [...new Set(value.filter(item => typeof item === 'string' && allowed(item)))] : [];
const isTrain = id => Object.hasOwn(LEGACY_TRAIN_NAMES, id);
const isSouvenir = id => SOUVENIRS.some(item => item.id === id);
const isJourney = id => JOURNEYS.some(route => route.id === id);
const emptyLegacy = () => ({ completed: [], trips: 0, souvenirs: [], journeysCompleted: [], sources: [] });

function normalizeLegacy(raw = {}) {
  return {
    completed: strings(raw?.completed, isTrain), trips: count(raw?.trips),
    souvenirs: strings(raw?.souvenirs, isSouvenir), journeysCompleted: strings(raw?.journeysCompleted, isJourney),
    sources: strings(raw?.sources, source => ['archive', 'local'].includes(source)),
  };
}
export function normalizeRoom(raw = {}) {
  const stamps = {};
  if (raw && typeof raw.stamps === 'object' && !Array.isArray(raw.stamps))
    for (const [id, value] of Object.entries(raw.stamps)) if (/^[a-z][a-z0-9-]{1,40}$/.test(id) && count(value)) stamps[id] = count(value);
  const history = readProgress({ getItem: () => JSON.stringify({ version: 1, recentQuestions: raw?.recentQuestions, recentGames: raw?.recentGames }) });
  return {
    ageBand: LEVEL_IDS.includes(raw?.ageBand) ? raw.ageBand : null,
    stamps, rounds: count(raw?.rounds),
    recentQuestions: history.recentQuestions, recentGames: history.recentGames,
    legacy: normalizeLegacy(raw?.legacy),
  };
}
export const readRoom = (record = readStudent()) => normalizeRoom(record.sections?.[ROOM_SECTION]);
const writeRoom = room => updateStudentSection(ROOM_SECTION, normalizeRoom(room));

/** 年齡級距：家長選過就用家長的；沒選過依幼兒模式（開＝3～4 歲，關＝5～6 歲）。 */
export function roomLevel(room = readRoom(), settings = readSettings()) {
  return room.ageBand || (settings.childMode ? 'small' : 'medium');
}
export function setAgeBand(level) {
  if (!LEVEL_IDS.includes(level)) throw new TypeError('Unknown age band');
  return writeRoom({ ...readRoom(), ageBand: level });
}

/** 玩完一輪：該玩法蓋一個章，題目記進最近紀錄。回傳這個玩法目前的章數。 */
export function recordRound(game, questions = []) {
  const room = readRoom();
  const progress = { recentQuestions: room.recentQuestions, recentGames: room.recentGames };
  if (questions.length) rememberTrip(progress, questions);
  room.stamps[game] = Math.min(99999, (room.stamps[game] || 0) + 1);
  room.rounds = Math.min(99999, room.rounds + 1);
  room.recentQuestions = progress.recentQuestions.slice(-HISTORY_LIMITS.questions);
  room.recentGames = progress.recentGames.slice(-HISTORY_LIMITS.games);
  const saved = writeRoom(room);
  return { stamps: room.stamps[game], saved };
}

// ---- 舊進度接回 ----------------------------------------------------------
/** 解開學生證 academy.archive 裡的小小列車長備份；格式不對就回傳 null。 */
export function decodeLegacyArchive(text) {
  if (typeof text !== 'string' || text.length > 262144) return null;
  try {
    const data = JSON.parse(text);
    if (data?.format !== 'taiwan-train-math.backup' || data.version !== 1 || data.passport?.version !== 1) return null;
    return readProgress({ getItem: () => JSON.stringify(data.passport) });
  } catch { return null; }
}
/** 同網域舊存檔鍵 taiwan-train-math.v1；讀不到、壞掉或沒有內容都回傳 null，不丟錯。 */
export function readLegacyLocal(storage) {
  try {
    const store = storage === undefined ? globalThis.localStorage : storage;
    const text = store?.getItem?.(LEGACY_KEY);
    if (typeof text !== 'string' || !text || text.length > 262144) return null;
    const progress = readProgress({ getItem: () => text });
    return JSON.parse(text)?.version === 1 ? progress : null;
  } catch { return null; }
}
const hasHistory = p => p && (p.trips > 0 || p.completed.length || p.souvenirs.length || p.journeysCompleted.length);
export function mergeLegacy(...parts) {
  const merged = emptyLegacy();
  for (const [source, part] of parts) {
    if (!hasHistory(part)) continue;
    const clean = normalizeLegacy(part);
    merged.completed = [...new Set([...merged.completed, ...clean.completed])];
    merged.souvenirs = [...new Set([...merged.souvenirs, ...clean.souvenirs])];
    merged.journeysCompleted = [...new Set([...merged.journeysCompleted, ...clean.journeysCompleted])];
    // The archive and the old browser key may be the same passport, so trips never add up.
    merged.trips = Math.max(merged.trips, clean.trips);
    merged.sources = [...new Set([...merged.sources, ...(source === 'saved' ? clean.sources : [source])])];
  }
  return merged;
}
/**
 * 把舊集章接回遊戲室：學生證保存的舊備份（archive）＋同網域舊存檔鍵＋已接回的紀錄。
 * 有新東西才寫回學生證；任何來源讀不到都只是略過。
 */
export function syncLegacy({ storage } = {}) {
  const record = readStudent(), room = readRoom(record);
  const merged = mergeLegacy(['saved', room.legacy], ['archive', decodeLegacyArchive(record.sections?.academy?.archive)], ['local', readLegacyLocal(storage)]);
  if (JSON.stringify(merged) !== JSON.stringify(room.legacy)) writeRoom({ ...room, legacy: merged });
  return merged;
}
export function legacySummary(legacy = readRoom().legacy) {
  return {
    trains: legacy.completed.map(id => LEGACY_TRAIN_NAMES[id]),
    trips: legacy.trips,
    souvenirs: legacy.souvenirs.map(id => SOUVENIRS.find(item => item.id === id)).filter(Boolean),
    journeys: legacy.journeysCompleted.map(id => JOURNEYS.find(route => route.id === id)).filter(Boolean),
    sources: legacy.sources,
    any: legacy.sources.length > 0,
  };
}
