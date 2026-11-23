// Ported from Taiwan Train Math 1.11.0 (src/journeys.js), Copyright 2026 mars-tw.
// Code: Apache-2.0; original educational text: CC-BY-4.0.
// Changed for the academy: header added, line endings normalised; logic unchanged.
// See public/licenses/taiwan-train-math/NOTICE.txt and docs/r48-math-room-assets.json.
// Story places are imaginary. Keep this module independent of the game engine
// so both journey generation and home rendering can read the same route data.
const routeData = [
  {
    id: "forest", name: "森林郵差", icon: "✉", themeCSS: "journey-forest",
    image: "assets/images/alishan.webp",
    description: "森林朋友等著收信。沿路接軌、探路，認出送信列車，把郵袋送到山裡的小站。",
    departureText: "郵袋收好了，森林朋友在等信，一起出發吧！",
    arrivalText: "信件送到了，森林朋友可以拆信囉！",
    games: ["tracks", "maze", "program", "identify", "puzzle", "count"],
    stationLabels: {
      small: ["收信月台", "林間路口", "森林郵局"],
      medium: ["收信月台", "樹蔭鐵道", "林間路口", "山谷小站", "森林郵局"],
      large: ["收信月台", "樹蔭鐵道", "林間路口", "山谷小站", "森林郵局"],
    },
  },
  {
    id: "coast", name: "海邊燈塔", icon: "☀", themeCSS: "journey-coast",
    image: "assets/images/story-coast-v3.webp",
    description: "海邊的小燈塔還暗著。沿途收好零件、找出線索，再拼好窗花，讓海邊小站亮起來。",
    departureText: "帶上燈塔的小零件，我們去海邊幫忙吧！",
    arrivalText: "窗花拼好了，燈塔亮起來，海邊小站也收到光了！",
    games: ["differences", "compare", "clock", "mosaic", "treasure", "puzzle"],
    stationLabels: {
      small: ["海風月台", "貝殼廣場", "燈塔小站"],
      medium: ["海風月台", "沙灘路口", "貝殼廣場", "窗花工坊", "燈塔小站"],
      large: ["海風月台", "沙灘路口", "貝殼廣場", "窗花工坊", "燈塔小站"],
    },
  },
  {
    id: "freight", name: "貨運工作日", icon: "▣", themeCSS: "journey-freight",
    image: "assets/images/switcher.webp",
    description: "行李和箱子混在一起了。幫忙分類、排好車廂，再把貨物送上列車，讓倉庫恢復整齊。",
    departureText: "倉庫開門了，今天一起整理行李和貨物吧！",
    arrivalText: "貨物都送上車了，整齊的倉庫準備好迎接下一趟。",
    games: ["luggage", "cargo", "balance", "order", "boarding", "count"],
    stationLabels: {
      small: ["收貨月台", "整理倉庫", "發車小站"],
      medium: ["收貨月台", "行李櫃台", "編組車庫", "裝貨倉庫", "發車小站"],
      large: ["收貨月台", "行李櫃台", "編組車庫", "裝貨倉庫", "發車小站"],
    },
  },
  {
    id: "engineer", name: "列車工程學校", icon: "⚙", themeCSS: "journey-engineer",
    image: "assets/images/electric-loco.webp",
    description: "新列車還不能出發。試著排指令、接軌道、拼好圖形，找出通往小站的路，完成第一次試車。",
    departureText: "工具收好了，今天一起幫新列車完成試車！",
    arrivalText: "試車完成，列車找到通往小站的路了！",
    games: ["program", "tracks", "mosaic", "pattern", "puzzle", "maze"],
    stationLabels: {
      small: ["工具月台", "接軌工坊", "試車小站"],
      medium: ["工具月台", "指令教室", "圖形工坊", "接軌工坊", "試車小站"],
      large: ["工具月台", "指令教室", "圖形工坊", "接軌工坊", "試車小站"],
    },
  },
  {
    id: "picnic", name: "點心旅行", icon: "🍎", themeCSS: "journey-picnic",
    image: "assets/images/tourism-green.webp",
    description: "朋友都上車了，野餐籃還沒整理。一起數乘客、分點心、找好朋友，讓大家帶著點心出發。",
    departureText: "朋友集合好了，一起整理野餐籃、準備出發吧！",
    arrivalText: "野餐籃整理好了，朋友都帶著點心到站囉！",
    games: ["sharing", "count", "boarding", "compare", "memory", "balance"],
    stationLabels: {
      small: ["集合月台", "點心廣場", "野餐小站"],
      medium: ["集合月台", "朋友車廂", "點心廣場", "野餐倉庫", "野餐小站"],
      large: ["集合月台", "朋友車廂", "點心廣場", "野餐倉庫", "野餐小站"],
    },
  },
  {
    id: "depot", name: "車庫大巡遊", icon: "🚆", themeCSS: "journey-depot",
    image: "assets/images/railway-world-v2.webp",
    description: "車庫裡的列車卡和照片散開了。找回相同列車、補好照片，再整理圖形和車廂，準備迎接下一班。",
    departureText: "車庫要開門迎接列車了，一起把卡片和照片整理好！",
    arrivalText: "卡片和照片都整理好了，車庫可以迎接下一班列車囉！",
    games: ["memory", "identify", "puzzle", "differences", "order", "mosaic"],
    stationLabels: {
      small: ["車庫入口", "照片工坊", "整備月台"],
      medium: ["車庫入口", "翻卡小屋", "照片工坊", "圖形倉庫", "整備月台"],
      large: ["車庫入口", "翻卡小屋", "照片工坊", "圖形倉庫", "整備月台"],
    },
  },
];
export const JOURNEYS = Object.freeze(routeData.map(route => Object.freeze({
  ...route,
  games: Object.freeze([...route.games]),
  stationLabels: Object.freeze(Object.fromEntries(Object.entries(route.stationLabels)
    .map(([level, labels]) => [level, Object.freeze([...labels])]))),
})));
export function journeyById(id) {
  return JOURNEYS.find(route => route.id === id) || null;
}
export function journeyGames(route, contentVersion = "1.8.0") {
  if (!route) return [];
  return contentVersion === "1.8.0" && ["freight", "picnic"].includes(route.id)
    ? [...route.games, "tickets"] : route.games;
}
const STOPS = { small: 3, medium: 5, large: 5 };
const GAME_LABELS = {
  tracks: "接軌道", maze: "走迷宮", program: "排指令", identify: "認火車", puzzle: "拼火車", count: "數數",
  differences: "找不同", compare: "比車票", clock: "看時鐘", mosaic: "拼圖形", treasure: "找寶物",
  luggage: "分行李", cargo: "裝貨", balance: "秤一秤", order: "排車廂", boarding: "上車下車",
  pattern: "找規律", sharing: "分點心", memory: "翻卡配對", tickets: "分配車票",
};
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character]);

export function journeyMarkup({ level = "small", completed = [], availableGames = [], esc = escapeHtml } = {}) {
  if (!Object.hasOwn(STOPS, level)) return "";
  const escape = typeof esc === "function" ? esc : escapeHtml;
  const available = new Set(Array.isArray(availableGames) ? availableGames.filter(game => typeof game === "string") : []);
  const travelled = new Set(Array.isArray(completed) ? completed.filter(id => journeyById(id)) : []);
  const stops = STOPS[level];
  return `<section class="journeys-section" id="theme-journeys" aria-labelledby="journeys-title"><div class="journeys-heading"><div><small>選一趟故事旅程</small><h2 id="journeys-title">${escape("今天想去哪裡？")}</h2></div><p>${escape(`每趟 ${stops} 站，沿途換個任務，幫小站完成一件事。`)}</p></div><p class="journeys-note">${escape("這些是想像的主題旅程，圖片是情境插圖。每站的任務會輪替，玩過也能再出發。")}</p><div class="journey-grid">${JOURNEYS.map(route => {
    const games = journeyGames(route).filter(game => available.has(game));
    const playable = games.length >= stops, completed = travelled.has(route.id);
    return `<button type="button" class="journey-card ${escape(route.themeCSS)} ${completed ? "journey-travelled" : ""}" data-journey="${escape(route.id)}" ${playable ? "" : "disabled"} aria-label="${escape(`${route.name}，${stops} 站主題旅程${completed ? "，已旅行，可以再次出發" : "，開始旅行"}`)}"><span class="journey-photo"><img src="${escape(route.image)}" alt="" aria-hidden="true" width="1200" height="675" loading="lazy" decoding="async"><span class="journey-icon" aria-hidden="true">${escape(route.icon)}</span>${completed ? `<span class="journey-badge">${escape("✓ 已旅行")}</span>` : ""}</span><span class="journey-card-copy"><strong>${escape(route.name)}</strong><span class="journey-description">${escape(route.description)}</span><span class="journey-task-list">${escape(games.map(game => GAME_LABELS[game]).join("、"))}</span><span class="journey-card-footer"><span>${escape(`${stops} 站 · ${games.length} 種任務輪替`)}</span><b>${escape(playable ? completed ? "再出發 →" : "開始旅行 →" : "換個難度再出發")}</b></span></span></button>`;
  }).join("")}</div></section>`;
}
