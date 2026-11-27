// Ported from Taiwan Train Math 1.11.0 (src/discovery.js), Copyright 2026 mars-tw.
// Code: Apache-2.0; original educational text: CC-BY-4.0.
// Changed for the academy: header added, line endings normalised; logic unchanged.
// See public/licenses/taiwan-train-math/NOTICE.txt and docs/r48-math-room-assets.json.
// R50 (academy): Chinese/English switch. Questions keep Chinese text (filled with zh()); the
// scene translates at display time with t()/tx(). Chinese output is unchanged.
import { t } from "../../shared/i18n.js";
import { zh, tx } from "./room-text.js";

export const MOSAIC_PALETTE = [
  { id: "green", name: "綠色圓點", symbol: "●", color: "#79a68a" },
  { id: "orange", name: "橘色三角", symbol: "▲", color: "#edaf71" },
  { id: "blue", name: "藍色方塊", symbol: "■", color: "#82b8cb" },
];
const SIZES = { small: 3, medium: 4, large: 5 };
const DIFFERENCE_COUNTS = { small: 2, medium: 3, large: 4 };
const MOSAIC_TEMPLATES = [
  { id: "train", name: "小火車", grids: ["120/111/202", "0120/0111/1111/0202", "01220/01110/11111/02020/00000"] },
  { id: "ticket", name: "小車票", grids: ["121/131/121", "1221/1331/1331/1221", "12221/13331/13031/13331/12221"] },
  { id: "house", name: "小車站", grids: ["020/222/131", "0220/2222/1331/1311", "00200/02220/22222/13331/13131"] },
  { id: "star", name: "小星星", grids: ["020/212/020", "0200/2122/0210/0020", "00200/02220/22122/02220/00200"] },
  { id: "tree", name: "山林樹", grids: ["010/111/020", "0110/1111/0110/0220", "00100/01110/11111/00200/00200"] },
  { id: "boat", name: "小帆船", grids: ["030/330/222", "0300/0330/3330/2222", "00300/00330/00333/00300/02220"] },
  { id: "flower", name: "小花朵", grids: ["020/212/010", "0220/2112/0110/0100", "00200/02120/00200/00100/01110"] },
  { id: "heart", name: "愛心", grids: ["202/222/010", "2002/2222/0220/0100", "22022/22222/02220/00100/00000"] },
  { id: "bridge", name: "小鐵橋", grids: ["222/101/303", "2222/1001/1331/3333", "22222/11011/10001/13331/33333"] },
  { id: "fish", name: "小魚", grids: ["031/333/030", "0331/3333/0331/0000", "00330/03331/33311/03331/00330"] },
  { id: "flag", name: "車站小旗", grids: ["122/122/100", "1222/1220/1000/1000", "12220/12330/12220/10000/10000"] },
  { id: "mountain", name: "小山峰", grids: ["030/131/111", "0030/0310/1311/1111", "00300/03130/13111/11111/22222"] },
];
export const DIFFERENCE_THEMES = [
  { id: "city", name: "城市車站", sky: "#e4eef0", ground: "#dfd8c6", distant: "#c1d3cf" },
  { id: "forest", name: "森林小站", sky: "#edf2db", ground: "#d9e6c2", distant: "#afc6a0" },
  { id: "seaside", name: "海邊月台", sky: "#e3f1f4", ground: "#d2e8e8", distant: "#9ecad5" },
  { id: "mountain", name: "山谷車站", sky: "#edf0f8", ground: "#dddccc", distant: "#bdc9c4" },
];
const OBJECT_KINDS = ["roof", "flag", "tree", "engine", "carriage", "caboose", "bench", "signal", "flower"];
const OBJECT_COLORS = ["orange", "orange", "green", "blue", "blue", "blue", "orange", "green", "orange"];

function checkLevel(level) {
  if (!Object.hasOwn(SIZES, level)) throw new Error("Unknown discovery level");
}
function roll(rng, count) {
  const value = rng();
  if (!Number.isFinite(value) || value < 0 || value >= 1) throw new Error("Invalid random source");
  return Math.floor(value * count);
}
export function createMosaicQuestion({ level, rng = Math.random }) {
  checkLevel(level);
  const columns = SIZES[level], template = MOSAIC_TEMPLATES[roll(rng, MOSAIC_TEMPLATES.length)];
  const mirrored = roll(rng, 2) === 1, colorRotation = roll(rng, MOSAIC_PALETTE.length);
  const lines = template.grids[columns - 3].split("/");
  const target = lines.flatMap((line) => {
    const cells = [...line];
    if (mirrored) cells.reverse();
    return cells.map((value) => value === "0" ? "empty" : MOSAIC_PALETTE[(Number(value) - 1 + colorRotation) % 3].id);
  });
  return {
    game: "mosaic", level, columns, rows: columns,
    palette: MOSAIC_PALETTE.map((color) => ({ ...color })),
    templateId: template.id, templateName: template.name, mirrored, colorRotation,
    target, answer: [...target],
    prompt: zh("照著小樣本，把{name}的圖形拼出來。", { name: template.name }),
    hint: "先看小圖的空格和色塊，再從一排慢慢拼。畫錯時，可以選橡皮擦。",
  };
}
export function createDifferencesQuestion({ level, rng = Math.random }) {
  checkLevel(level);
  const theme = DIFFERENCE_THEMES[roll(rng, DIFFERENCE_THEMES.length)];
  const itemsLeft = OBJECT_KINDS.map((kind, index) => ({ kind, variant: roll(rng, 2), accent: OBJECT_COLORS[index] }));
  const indices = Array.from({ length: 9 }, (_, index) => index);
  for (let i = indices.length - 1; i > 0; i--) {
    const index = roll(rng, i + 1);
    [indices[i], indices[index]] = [indices[index], indices[i]];
  }
  const differences = indices.slice(0, DIFFERENCE_COUNTS[level]).sort((a, b) => a - b);
  const changed = new Set(differences);
  const itemsRight = itemsLeft.map((item, index) => ({ ...item, variant: changed.has(index) ? 1 - item.variant : item.variant }));
  return {
    game: "differences", level, columns: 3, rows: 3, sceneTheme: theme.id,
    itemsLeft, itemsRight, differences, answer: differences.length,
    prompt: zh("比較兩幅{name}圖，找出 {n} 處不同。", { name: theme.name, n: differences.length }),
    hint: "看看形狀、方向和數量，找到不同就點右圖。一次比較一區就好。",
  };
}
export function newDiscoveryState(q) {
  return {
    mosaicColor: q.palette?.[0]?.id || "empty",
    mosaicCells: Array(q.columns * q.rows).fill("empty"),
    differencesFound: new Set(),
  };
}
function mosaicColor(q, colorId) {
  return colorId === "empty" || (MOSAIC_PALETTE.some((color) => color.id === colorId)
    && Array.isArray(q.palette) && q.palette.some((color) => color.id === colorId));
}
export function selectMosaicColor(q, state, colorId) {
  if (q?.game !== "mosaic" || !state || !mosaicColor(q, colorId) || state.mosaicColor === colorId) return state;
  return { ...state, mosaicColor: colorId };
}
export function paintMosaicCell(q, state, index) {
  if (q?.game !== "mosaic" || !state || !Number.isInteger(index) || index < 0 || index >= q.columns * q.rows
    || !Array.isArray(state.mosaicCells) || state.mosaicCells.length !== q.columns * q.rows
    || !mosaicColor(q, state.mosaicColor) || state.mosaicCells[index] === state.mosaicColor) return state;
  return { ...state, mosaicCells: state.mosaicCells.map((color, at) => at === index ? state.mosaicColor : color) };
}
export function resetMosaic(q, state) {
  if (q?.game !== "mosaic" || !state || !Array.isArray(q.palette) || !q.palette.length) return state;
  return { ...state, mosaicColor: q.palette[0].id, mosaicCells: Array(q.columns * q.rows).fill("empty") };
}
export function findDifference(q, state, index) {
  if (q?.game !== "differences" || !state || !(state.differencesFound instanceof Set)
    || !Number.isInteger(index) || index < 0 || index >= 9
    || state.differencesFound.has(index) || !Array.isArray(q.differences) || !q.differences.includes(index)) return state;
  return { ...state, differencesFound: new Set([...state.differencesFound, index]) };
}

const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]);
function paintMetadata(id) {
  return MOSAIC_PALETTE.find((color) => color.id === id) || { id: "empty", name: "空白", symbol: "", color: "#fffdf5" };
}
function sceneBackdrop(theme, index) {
  const row = Math.floor(index / 3);
  if (row === 0) {
    const distant = theme.id === "city"
      ? '<path d="M0 80V58h20V43h18v37h13V54h26v26h13V48h30v32Z"/>'
      : theme.id === "forest" ? '<path d="m0 80 20-29 21 29 21-38 24 38 18-24 16 24Z"/>'
        : theme.id === "mountain" ? '<path d="m0 80 34-31 25 21 28-35 33 45Z"/>'
          : '<path d="M0 77q15-9 30 0t30 0 30 0 30 0v13H0Z"/>';
    return `<rect width="120" height="90" fill="${theme.sky}"/><g fill="${theme.distant}">${distant}</g>`;
  }
  const base = `<rect width="120" height="90" fill="${row === 1 ? theme.sky : theme.ground}"/>`;
  return row === 1 ? `${base}<path d="M0 72h120v18H0Z" fill="${theme.ground}"/><path d="M0 76h120m-120 8h120" stroke="#718477" stroke-width="3"/>`
    : `${base}<path d="M0 81h120" stroke="#b8bd9b" stroke-width="3"/>`;
}
function objectDrawing(item = {}) {
  const variant = item.variant === 1, accent = paintMetadata(item.accent).color;
  let art;
  switch (item.kind) {
    case "roof":
      art = `<rect x="27" y="43" width="66" height="40" rx="3" fill="#fff5d8"/><path d="${variant ? "M21 45V30h78v15Z" : "m19 44 41-28 41 28Z"}" fill="${accent}"/><rect x="53" y="57" width="14" height="26" fill="#5e898a"/><rect x="35" y="53" width="11" height="12" fill="#a1cad4"/><rect x="74" y="53" width="11" height="12" fill="#a1cad4"/>`;
      break;
    case "flag":
      art = `<path d="M37 16v66M22 82h31" stroke-width="4"/><path d="${variant ? "m40 18 43 19-43 19Z" : "M40 18h43v37H40Z"}" fill="${accent}"/>`;
      break;
    case "tree":
      art = `<path d="M60 53v31" stroke="#826743" stroke-width="9"/>${variant ? `<circle cx="60" cy="37" r="27" fill="${accent}"/>` : `<path d="m60 11 27 34H77l15 18H28l15-18H33Z" fill="${accent}"/>`}`;
      break;
    case "engine":
      art = `<g${variant ? ' transform="translate(120 0) scale(-1 1)"' : ""}><path d="M12 57 28 31h35V20h39v50H12Z" fill="${accent}"/><rect x="69" y="28" width="23" height="20" rx="3" fill="#fff5d8"/><path d="M23 43h26v13H15Z" fill="#fff5d8"/><path d="M13 58h88v11H13Z" fill="#e1b86f"/><circle cx="33" cy="70" r="9" fill="#395d57"/><circle cx="84" cy="70" r="9" fill="#395d57"/></g>`;
      break;
    case "carriage": {
      const windows = variant ? [20, 50, 80] : [29, 69];
      art = `<rect x="6" y="29" width="108" height="39" rx="4" fill="${accent}"/><path d="M5 27h110" stroke-width="5"/><path d="M6 57h108" stroke="#e1b86f" stroke-width="5"/>${windows.map((x) => `<rect x="${x}" y="35" width="20" height="17" rx="2" fill="#fff5d8"/>`).join("")}<circle cx="27" cy="70" r="8" fill="#395d57"/><circle cx="93" cy="70" r="8" fill="#395d57"/>`;
      break;
    }
    case "caboose":
      art = `<path d="M7 29h81l18 18v21H7Z" fill="${accent}"/><path d="M7 26h${variant ? "56v-9h26v9h18" : "91"}" stroke-width="5"/><rect x="19" y="36" width="22" height="17" rx="2" fill="#fff5d8"/><rect x="53" y="36" width="22" height="17" rx="2" fill="#fff5d8"/><path d="M7 59h98" stroke="#e1b86f" stroke-width="5"/><circle cx="26" cy="70" r="8" fill="#395d57"/><circle cx="89" cy="70" r="8" fill="#395d57"/>`;
      break;
    case "bench":
      art = `<path d="M31 61v19m58-19v19" stroke-width="5"/><rect x="23" y="51" width="74" height="13" rx="3" fill="${accent}"/>${variant ? `<rect x="28" y="27" width="64" height="15" rx="3" fill="${accent}"/><path d="M34 41v12m52-12v12"/>` : ""}`;
      break;
    case "signal":
      art = `<path d="M60 64v20M47 84h26" stroke-width="5"/><rect x="43" y="15" width="34" height="51" rx="9" fill="#486e62"/>${variant ? `<circle cx="60" cy="29" r="8" fill="${accent}"/><circle cx="60" cy="51" r="8" fill="${accent}"/>` : `<circle cx="60" cy="40" r="12" fill="${accent}"/>`}`;
      break;
    case "flower":
      art = `<path d="M60 46v35m0-11L43 57m17 6 17-12" stroke="#71926d" stroke-width="4"/><g fill="${accent}">${variant ? '<circle cx="60" cy="24" r="12"/><circle cx="60" cy="52" r="12"/><circle cx="46" cy="38" r="12"/><circle cx="74" cy="38" r="12"/>' : '<circle cx="60" cy="23" r="13"/><circle cx="46" cy="46" r="13"/><circle cx="74" cy="46" r="13"/>'}</g><circle cx="60" cy="38" r="10" fill="#fff5d8"/>`;
      break;
    default: art = '<rect x="32" y="22" width="56" height="54" rx="9" fill="#fff5d8"/>';
  }
  return `<g fill="none" stroke="#365e53" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">${art}</g>`;
}
function sceneCell(item, index, theme) {
  return `${sceneBackdrop(theme, index)}${objectDrawing(item)}`;
}
function referenceScene(q, theme) {
  return `<svg class="difference-reference-art" viewBox="0 0 360 270" aria-hidden="true" focusable="false">${q.itemsLeft.slice(0, 9).map((item, index) => `<g transform="translate(${(index % 3) * 120} ${Math.floor(index / 3) * 90})">${sceneCell(item, index, theme)}</g>`).join("")}</svg>`;
}
export function discoveryScene(q, trip = {}, { esc = escapeHTML } = {}) {
  const state = trip.discovery || newDiscoveryState(q), solved = Boolean(trip.solved);
  if (q.game === "mosaic") {
    const columns = Number.isInteger(q.columns) && q.columns >= 3 && q.columns <= 5 ? q.columns : 3;
    const cells = Array.from({ length: columns * columns }, (_, index) => paintMetadata(state.mosaicCells?.[index]));
    const filled = cells.some((color) => color.id !== "empty");
    const brush = paintMetadata(state.mosaicColor);
    return `<div class="discovery-stage mosaic-stage" style="--mosaic-columns:${columns}"><div class="mosaic-tools"><figure class="mosaic-sample"><figcaption>${t("參考小圖 · {name}", { name: esc(tx(q.templateName)) })}</figcaption><div class="mosaic-reference-grid" role="img" aria-label="${esc(t("參考圖案，照著位置與色塊拼搭"))}">${q.target.map((id) => { const color = paintMetadata(id); return `<span class="mosaic-mark mosaic-${color.id}" aria-hidden="true">${color.symbol}</span>`; }).join("")}</div></figure><div class="mosaic-palette" role="group" aria-label="${esc(t("選擇色塊或橡皮擦"))}">${q.palette.map((color) => `<button type="button" class="mosaic-color-choice" data-mosaic-color="${esc(color.id)}" aria-label="${esc(t("選擇{name}", { name: tx(color.name) }))}" aria-pressed="${state.mosaicColor === color.id}" ${solved ? "disabled" : ""}><span class="mosaic-swatch mosaic-${paintMetadata(color.id).id}" aria-hidden="true">${esc(color.symbol)}</span><span>${esc(tx(color.name))}</span></button>`).join("")}<button type="button" class="mosaic-color-choice mosaic-eraser" data-mosaic-color="empty" aria-label="${esc(t("選擇橡皮擦"))}" aria-pressed="${state.mosaicColor === "empty"}" ${solved ? "disabled" : ""}><span aria-hidden="true">⌫</span><span>${t("橡皮擦")}</span></button></div></div><p class="mosaic-brush-status" role="status">${t("現在使用：{name}。每點一下，畫一格。", { name: brush.id === "empty" ? t("橡皮擦") : tx(brush.name) })}</p><div class="mosaic-paint-board" role="group" aria-label="${esc(t("圖形拼搭畫板"))}">${cells.map((color, index) => `<button type="button" class="mosaic-paint-cell mosaic-${color.id}" data-mosaic-cell="${index}" aria-label="${esc(t("畫板第 {n} 格，{name}", { n: index + 1, name: tx(color.name) }))}" ${solved ? "disabled" : ""}><span aria-hidden="true">${color.symbol || "＋"}</span></button>`).join("")}</div><p class="discovery-help">${esc(tx(q.hint))}</p><div class="discovery-actions"><button type="button" id="mosaic-reset" class="text-btn" ${solved || !filled ? "disabled" : ""}>${t("全部清空")}</button><button type="button" id="mosaic-submit" class="primary-btn" ${solved || !filled ? "disabled" : ""}>${t("拼好了，送出 ✓")}</button></div></div>`;
  }
  if (q.game === "differences") {
    const theme = DIFFERENCE_THEMES.find((item) => item.id === q.sceneTheme) || DIFFERENCE_THEMES[0];
    const found = state.differencesFound instanceof Set ? state.differencesFound : new Set();
    const goal = DIFFERENCE_COUNTS[q.level] || 3;
    return `<div class="discovery-stage differences-stage"><div class="differences-progress" role="status" aria-live="polite">${t("已找到 {open}{found}／{goal}{close} 處", { open: "<strong>", found: found.size, goal, close: "</strong>" })}</div><div class="difference-compare"><figure class="difference-reference"><div class="difference-reference-picture" role="img" aria-label="${esc(t("左圖，作為比較參考"))}">${referenceScene(q, theme)}</div><figcaption><strong>${t("左圖 · 看看原樣")}</strong><span>${t("比一比形狀，再點右圖。")}</span></figcaption></figure><div class="difference-right"><strong class="difference-right-label">${t("右圖 · 點不同的地方")}</strong><div class="difference-grid" role="group" aria-label="${esc(t("右圖，分成九個區域"))}">${q.itemsRight.slice(0, 9).map((item, index) => `<button type="button" class="difference-cell ${found.has(index) ? "difference-found" : ""}" data-difference-cell="${index}" aria-label="${esc(t(found.has(index) ? "右圖第 {n} 區，已找到" : "右圖第 {n} 區", { n: index + 1 }))}" ${solved || found.has(index) ? "disabled" : ""}><svg viewBox="0 0 120 90" aria-hidden="true" focusable="false">${sceneCell(item, index, theme)}</svg>${found.has(index) ? '<span class="difference-check" aria-hidden="true">✓</span>' : ""}</button>`).join("")}</div></div></div><p class="discovery-help">${esc(tx(q.hint))}</p></div>`;
  }
  return "";
}
