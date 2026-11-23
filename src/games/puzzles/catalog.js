// R48 B line: the five new games as plain data (no screens, no CSS), shared by the registry,
// the temporary trial entry and the math room adapter.
import { SWITCH_GAME } from './switch-platform.js';
import { SHUNTING_GAME } from './shunting-yard.js';
import { MEET_GAME } from './single-line-meet.js';
import { BOARDING_GAME } from '../math/boarding-count.js';
import { TIMETABLE_GAME } from '../math/platform-timetable.js';

const ALL = Object.freeze(['small', 'medium', 'large']);
// roomLevels use the math room's age ids: small = 3～4 歲, medium = 5～6 歲, large = 7～8 歲.
// order: after the ported games in each tab (build tab 10–40, math tab 5–60).
export const RAIL_CATALOG = Object.freeze([
  Object.freeze({ ...SWITCH_GAME, icon: '🔀', blurb: '點黃色的箭頭換軌道，讓列車開到一樣顏色的月台。', roomLevels: ALL, order: 50 }),
  Object.freeze({ ...SHUNTING_GAME, icon: '🛤️', blurb: '推拉車廂進出側線，排成調車單的順序。', roomLevels: ALL, order: 60 }),
  Object.freeze({ ...MEET_GAME, icon: '🚦', blurb: '一條鐵軌兩列車，看號誌在避車道會車。', roomLevels: Object.freeze(['medium', 'large']), order: 70 }),
  Object.freeze({ ...BOARDING_GAME, icon: '🚉', blurb: '每站有人下車、有人上車，算算車上還有幾人。', roomLevels: ALL, order: 70 }),
  Object.freeze({ ...TIMETABLE_GAME, icon: '🕒', blurb: '看出發時間和坐多久，算出幾點到站。', roomLevels: ALL, order: 80 }),
]);
