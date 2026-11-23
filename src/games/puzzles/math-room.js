// R48 B line → A line adapter: registerMathGame entries (docs/MATH_ROOM.md on isl-r48-a).
// Integration (one line in installAcademy(), src/shared/academy-ui.js):
//   import { registerRailGames } from '../games/puzzles/math-room.js';
//   registerRailGames(registerMathGame);
// The game screens load only when a card is tapped; the room stays visible until the game is ready,
// then hides itself (ctx.hideRoom) exactly like the dispatch table does.
import { RAIL_CATALOG } from './catalog.js';

export const ROOM_AGE = Object.freeze({ small: '3-4', medium: '5-6', large: '7-8' });
export const ROOM_CATEGORY = Object.freeze({ 拼搭與方向: 'build', 數學: 'math' });

/** One cleared level = one round = one stamp (ctx.complete). Closing the game returns to the room (ctx.exit). */
export function railRoomEntries({ load = () => import('./index.js') } = {}) {
  return RAIL_CATALOG.map(game => ({
    id: game.id,
    category: ROOM_CATEGORY[game.room],
    name: game.title,
    icon: game.icon,
    description: game.blurb,
    levels: [...game.roomLevels],
    order: game.order,
    open(ctx) {
      let handle = null, gone = false;
      Promise.resolve().then(load).then(module => {
        if (gone) return;
        ctx.hideRoom();
        handle = module.openRailPlay(game.id, {
          age: ROOM_AGE[ctx.level] || '5-6',
          backLabel: '遊戲室',
          onWin: () => ctx.complete(),
          onClose: () => { handle = null; ctx.exit(); },
        });
      }).catch(() => { if (!gone) ctx.exit(); });
      return () => { gone = true; const open = handle; handle = null; open?.close({ silent: true }); };
    },
  }));
}

/** Registers all five games; returns the unregister functions. */
export const registerRailGames = (registerMathGame, options) => railRoomEntries(options).map(entry => registerMathGame(entry));
