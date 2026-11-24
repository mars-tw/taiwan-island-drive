// R49 數學遊戲室圖示：每種玩法、每個分頁各一張圓形徽章圖（學院新程式，MIT）。
// 圖檔在 public/art/r49/icons/，來源、模型、提示與挑選理由見 docs/content/r49/art/manifest.json。
// 卡片把方圖用 CSS 裁成圓形；沒有圖的玩法（之後才搬的照片玩法）仍顯示原本的文字符號。
export const ROOM_ICON_DIR = 'art/r49/icons';

/** 每個註冊在遊戲室的玩法 id（17 種移植、調度台、5 種火車謎題與新數學）。 */
export const GAME_ICON_IDS = Object.freeze([
  'dispatch', 'count', 'order', 'compare', 'boarding', 'pattern', 'clock', 'boarding-count', 'platform-timetable',
  'differences', 'treasure',
  'tracks', 'maze', 'program', 'mosaic', 'switch-platform', 'shunting-yard', 'single-line-meet',
  'cargo', 'luggage', 'sharing', 'balance', 'tickets',
]);
/** 四個分頁（ROOM_CATEGORIES 的 id）。 */
export const TAB_ICON_IDS = Object.freeze(['math', 'observe', 'build', 'life']);

export const gameIconPath = id => (GAME_ICON_IDS.includes(id) ? `${ROOM_ICON_DIR}/${id}.webp` : null);
export const tabIconPath = id => (TAB_ICON_IDS.includes(id) ? `${ROOM_ICON_DIR}/tab-${id}.webp` : null);
