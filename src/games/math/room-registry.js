// R48 數學遊戲室：分類、年齡級距與「註冊新玩法」介面（學院新程式，MIT）。
// 原版 17 種不需實車照片的玩法用同一個 registerMathGame 登記；別的模組（例如 B 線火車謎題）
// 也用它把自己的玩法放進四個分類之一。說明見 docs/MATH_ROOM.md。
import { GAMES } from './engine.js';

export const AGE_BANDS = Object.freeze([
  Object.freeze({ id: 'small', label: '3～4 歲', range: '5 以內' }),
  Object.freeze({ id: 'medium', label: '5～6 歲', range: '10 以內' }),
  Object.freeze({ id: 'large', label: '7～8 歲', range: '20 以內' }),
]);
export const LEVEL_IDS = Object.freeze(AGE_BANDS.map(band => band.id));
export const ageBand = level => AGE_BANDS.find(band => band.id === level) || AGE_BANDS[0];
/** ['medium','large'] → '5～8 歲'。 */
export function agesText(levels) {
  const bands = AGE_BANDS.filter(band => levels.includes(band.id));
  if (!bands.length) return '';
  return `${bands[0].label.split('～')[0]}～${bands.at(-1).label.split('～')[1]}`;
}

export const ROOM_CATEGORIES = Object.freeze([
  Object.freeze({ id: 'math', name: '數學', icon: '123' }),
  Object.freeze({ id: 'observe', name: '觀察與記憶', icon: '◎' }),
  Object.freeze({ id: 'build', name: '拼搭與方向', icon: '⌁' }),
  Object.freeze({ id: 'life', name: '生活與分享', icon: '🎟' }),
]);
// Same grouping as the 1.11.0 playroom (src/home.js PLAYROOM_CATEGORIES), minus the
// three games that need verified train photographs (identify, memory, puzzle).
export const PORTED_GAMES = Object.freeze({
  math: Object.freeze(['count', 'order', 'compare', 'boarding', 'pattern', 'clock']),
  observe: Object.freeze(['differences', 'treasure']),
  build: Object.freeze(['tracks', 'maze', 'program', 'mosaic']),
  life: Object.freeze(['cargo', 'luggage', 'sharing', 'balance', 'tickets']),
});
export const PHOTO_GAMES = Object.freeze(['identify', 'memory', 'puzzle']);
export const ROUND_GAMES = Object.freeze(Object.values(PORTED_GAMES).flat());

const registry = new Map();
const ID = /^[a-z][a-z0-9-]{1,40}$/;
const text = (value, max) => typeof value === 'string' && value.trim().length > 0 && [...value].length <= max;

/**
 * 註冊一種遊戲室玩法。回傳取消註冊的函式。
 * entry: { id, category, name, icon, description, levels, order?, open(ctx) }
 *  - id：小寫英數與連字號，例如 'harbor-boarding'；不可和現有玩法重複。
 *  - category：'math' | 'observe' | 'build' | 'life'。
 *  - levels：可玩的年齡級距，'small'（3～4 歲）、'medium'（5～6 歲）、'large'（7～8 歲）。
 *  - order：同一分類內的排序（越小越前面，預設 100；原版玩法是 10、20、30…）。
 *  - open(ctx)：小朋友點卡片時呼叫，ctx 說明見 docs/MATH_ROOM.md；可回傳清理函式。
 *  - status()：選填，回傳 { stamps?, note?, highlight? } 讓卡片顯示章數或「主線第 1 章」之類的小標。
 */
export function registerMathGame(entry) {
  if (!entry || typeof entry !== 'object') throw new TypeError('registerMathGame needs an entry object');
  const { id, category, name, icon, description, levels, order = 100, open, status = null, kind = 'external' } = entry;
  if (typeof id !== 'string' || !ID.test(id)) throw new TypeError(`Invalid math game id: ${id}`);
  if (registry.has(id)) throw new Error(`Math game already registered: ${id}`);
  if (!ROOM_CATEGORIES.some(group => group.id === category)) throw new TypeError(`Unknown math room category: ${category}`);
  if (!text(name, 16) || !text(icon, 4) || !text(description, 48)) throw new TypeError(`Math game ${id} needs a short name, icon and description`);
  if (!Array.isArray(levels) || !levels.length || levels.some(level => !LEVEL_IDS.includes(level)) || new Set(levels).size !== levels.length)
    throw new TypeError(`Math game ${id} needs levels from ${LEVEL_IDS.join(', ')}`);
  if (!Number.isFinite(order)) throw new TypeError(`Math game ${id} order must be a number`);
  if (kind === 'round' ? !ROUND_GAMES.includes(id) : typeof open !== 'function') throw new TypeError(`Math game ${id} needs open(ctx)`);
  if (status !== null && typeof status !== 'function') throw new TypeError(`Math game ${id} status must be a function`);
  const frozen = Object.freeze({ id, category, name, icon, description, levels: Object.freeze([...levels]), order, kind: kind === 'round' ? 'round' : 'external', open: kind === 'round' ? null : open, status });
  registry.set(id, frozen);
  return () => { if (registry.get(id) === frozen) registry.delete(id); };
}
export const mathGame = id => registry.get(id) || null;
export function mathGames({ category, level } = {}) {
  return [...registry.values()]
    .filter(game => !category || game.category === category)
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
    .map(game => ({ ...game, playable: !level || game.levels.includes(level) }));
}

ROOM_CATEGORIES.forEach(group => PORTED_GAMES[group.id].forEach((id, index) => registerMathGame({
  id, category: group.id, name: GAMES[id].name, icon: GAMES[id].icon, description: GAMES[id].description,
  levels: GAMES[id].levels, order: (index + 1) * 10, kind: 'round',
})));
