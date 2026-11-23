// R48 B line: one registry for the five games. Puzzles belong to 「拼搭與方向」, math to 「數學」.
// Each entry opens in the shared #rail-play dialog: open({ age: '3-4' | '5-6' | '7-8', level, onClose, onWin }).
import { openSwitchPlatform } from './switch-platform-ui.js';
import { openShuntingYard } from './shunting-yard-ui.js';
import { openSingleLineMeet } from './single-line-meet-ui.js';
import { openBoardingCount } from '../math/boarding-count-ui.js';
import { openPlatformTimetable } from '../math/platform-timetable-ui.js';
import { RAIL_CATALOG } from './catalog.js';

const OPENERS = Object.freeze({
  'switch-platform': openSwitchPlatform,
  'shunting-yard': openShuntingYard,
  'single-line-meet': openSingleLineMeet,
  'boarding-count': openBoardingCount,
  'platform-timetable': openPlatformTimetable,
});
export const RAIL_PLAY_GAMES = Object.freeze(RAIL_CATALOG.map(game => Object.freeze({ ...game, open: OPENERS[game.id] })));
export const railGamesForRoom = room => RAIL_PLAY_GAMES.filter(game => game.room === room);
export function openRailPlay(id, options = {}) {
  const game = RAIL_PLAY_GAMES.find(g => g.id === id);
  if (!game) throw new Error(`Unknown rail game: ${id}`);
  return game.open(options);
}
export { openSwitchPlatform, openShuntingYard, openSingleLineMeet, openBoardingCount, openPlatformTimetable };
export { railPlayState } from './rail-shell.js';
