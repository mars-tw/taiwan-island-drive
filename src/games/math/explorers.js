// Ported from Taiwan Train Math 1.11.0 (src/explorers.js), Copyright 2026 mars-tw.
// Code: Apache-2.0; original educational text: CC-BY-4.0.
// Changed for the academy: header added, line endings normalised; logic unchanged.
// See public/licenses/taiwan-train-math/NOTICE.txt and docs/r48-math-room-assets.json.
// R50 (academy): Chinese/English switch. Questions keep Chinese text; the scene translates at
// display time with t()/tx(). Chinese output is unchanged.
import { t } from "../../shared/i18n.js";
import { tx } from "./room-text.js";

const COLORS = [
  { id: "red", name: "紅色", paint: "#c84f45" },
  { id: "blue", name: "藍色", paint: "#397fa3" },
  { id: "green", name: "綠色", paint: "#428569" },
  { id: "yellow", name: "黃色", paint: "#d3a329" },
  { id: "purple", name: "紫色", paint: "#89689d" },
  { id: "orange", name: "橘色", paint: "#d17b38" },
];
const SHAPES = [
  { id: "circle", name: "圓形" },
  { id: "square", name: "正方形" },
  { id: "triangle", name: "三角形" },
  { id: "diamond", name: "菱形" },
];
const SIZES = { small: 3, medium: 4, large: 5 };

// A set bit means there is a wall in that direction.
export const MAZE_DIRECTIONS = {
  up: { bit: 1, opposite: 4, dx: 0, dy: -1, name: "上", symbol: "↑" },
  right: { bit: 2, opposite: 8, dx: 1, dy: 0, name: "右", symbol: "→" },
  down: { bit: 4, opposite: 1, dx: 0, dy: 1, name: "下", symbol: "↓" },
  left: { bit: 8, opposite: 2, dx: -1, dy: 0, name: "左", symbol: "←" },
};
function shuffled(values, rng) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const index = Math.floor(rng() * (i + 1));
    [result[i], result[index]] = [result[index], result[i]];
  }
  return result;
}
function checkLevel(level) {
  if (!SIZES[level]) throw new Error("Unknown explorer level");
}

export function createLuggageQuestion({ level, rng = Math.random }) {
  checkLevel(level);
  const colors = shuffled(COLORS, rng);
  const shapes = shuffled(SHAPES, rng);
  const criteria = level === "small" ? "color" : level === "medium" ? "shape" : "both";
  const rules = criteria === "color"
    ? colors.slice(0, 2).map((color) => ({ color }))
    : criteria === "shape"
      ? shapes.slice(0, 3).map((shape) => ({ shape }))
      : colors.slice(0, 2).flatMap((color) => shapes.slice(0, 2).map((shape) => ({ color, shape })));
  const bins = shuffled(rules, rng).map(({ color, shape }, index) => ({
    id: `bin-${index}`,
    label: `${color?.name || ""}${shape?.name || ""}`,
    ...(color ? { color: color.id, colorName: color.name } : {}),
    ...(shape ? { shape: shape.id, shapeName: shape.name } : {}),
  }));
  const items = shuffled(bins.flatMap((bin, index) => Array.from({ length: 2 }, (_, copy) => {
    const color = COLORS.find((value) => value.id === bin.color) || colors[(index + copy) % colors.length];
    const shape = SHAPES.find((value) => value.id === bin.shape) || shapes[(index + copy) % shapes.length];
    return {
      id: `luggage-${index * 2 + copy}`,
      color: color.id, colorName: color.name,
      shape: shape.id, shapeName: shape.name,
    };
  })), rng);
  const answer = items.map((item) => bins.find((bin) =>
    (!bin.color || bin.color === item.color) && (!bin.shape || bin.shape === item.shape),
  ).id);
  return {
    game: "luggage", level, criteria, items, bins, answer,
    prompt: criteria === "color" ? "看看顏色，把行李放進同色的籃子。"
      : criteria === "shape" ? "看看形狀，把行李放進同形狀的籃子。"
        : "顏色和形狀都要相同，幫行李找到籃子。",
    hint: criteria === "both" ? "先比顏色，再比形狀，兩個條件都要符合。放錯了可以搬回來。"
      : criteria === "color" ? "先看籃子的顏色標示，再跟手上的行李比一比。放錯了可以搬回來。"
        : "先看籃子的形狀標示，再跟手上的行李比一比。放錯了可以搬回來。",
  };
}

export function createMazeQuestion({ level, rng = Math.random }) {
  checkLevel(level);
  const columns = SIZES[level], rows = columns;
  const walls = Array(columns * rows).fill(15);
  const visited = new Set([0]), stack = [0];
  while (stack.length) {
    const current = stack.at(-1), x = current % columns, y = Math.floor(current / columns);
    const available = Object.values(MAZE_DIRECTIONS).flatMap((direction) => {
      const nx = x + direction.dx, ny = y + direction.dy;
      if (nx < 0 || nx >= columns || ny < 0 || ny >= rows) return [];
      const next = ny * columns + nx;
      return visited.has(next) ? [] : [{ direction, next }];
    });
    if (!available.length) {
      stack.pop();
      continue;
    }
    const { direction, next } = available[Math.floor(rng() * available.length)];
    walls[current] &= ~direction.bit;
    walls[next] &= ~direction.opposite;
    visited.add(next);
    stack.push(next);
  }
  return {
    game: "maze", level, columns, rows, walls,
    start: 0, finish: walls.length - 1, answer: "arrived",
    prompt: "帶列車走過車站迷宮，找到終點小站。",
    hint: "看看哪邊沒有牆，再走一步。遇到死路可以回頭，慢慢找另一條路。",
  };
}

export function newExplorerState(q) {
  return {
    luggageSelected: null,
    luggageAssignments: Array(q.items?.length || 0).fill(null),
    mazePosition: q.start ?? 0,
    mazeMoves: 0,
    mazeVisited: new Set([q.start ?? 0]),
  };
}
function luggageStateValid(q, state) {
  return q?.game === "luggage" && Array.isArray(q.items) && Array.isArray(q.bins)
    && Array.isArray(state?.luggageAssignments) && state.luggageAssignments.length === q.items.length
    && state.luggageAssignments.every((id) => id === null || q.bins.some((bin) => bin.id === id))
    && (state.luggageSelected === null || (Number.isInteger(state.luggageSelected)
      && state.luggageSelected >= 0 && state.luggageSelected < q.items.length));
}
export function selectLuggage(q, state, itemIndex) {
  if (!luggageStateValid(q, state) || !Number.isInteger(itemIndex)
    || itemIndex < 0 || itemIndex >= q.items.length) return state;
  const assignments = [...state.luggageAssignments];
  assignments[itemIndex] = null;
  return {
    ...state,
    luggageSelected: state.luggageSelected === itemIndex ? null : itemIndex,
    luggageAssignments: assignments,
  };
}
export function putLuggage(q, state, binId) {
  if (!luggageStateValid(q, state) || state.luggageSelected === null
    || !q.bins.some((bin) => bin.id === binId)) return state;
  const assignments = [...state.luggageAssignments];
  assignments[state.luggageSelected] = binId;
  return { ...state, luggageSelected: null, luggageAssignments: assignments };
}

function mazeStateValid(q, state) {
  return q?.game === "maze" && Number.isInteger(q.columns) && q.columns >= 2
    && Number.isInteger(q.rows) && q.rows >= 2 && Array.isArray(q.walls)
    && q.walls.length === q.columns * q.rows
    && q.walls.every((wall) => Number.isInteger(wall) && wall >= 0 && wall <= 15)
    && Number.isInteger(q.start) && q.start >= 0 && q.start < q.walls.length
    && Number.isInteger(q.finish) && q.finish >= 0 && q.finish < q.walls.length
    && Number.isInteger(state?.mazePosition) && state.mazePosition >= 0 && state.mazePosition < q.walls.length
    && Number.isSafeInteger(state.mazeMoves) && state.mazeMoves >= 0
    && state.mazeVisited instanceof Set
    && state.mazeVisited.has(state.mazePosition)
    && [...state.mazeVisited].every((position) => Number.isInteger(position) && position >= 0 && position < q.walls.length);
}
export function moveMaze(q, state, direction) {
  if (!Object.hasOwn(MAZE_DIRECTIONS, direction)) return state;
  const movement = MAZE_DIRECTIONS[direction];
  if (!movement || !mazeStateValid(q, state) || state.mazePosition === q.finish
    || q.walls[state.mazePosition] & movement.bit) return state;
  const x = state.mazePosition % q.columns, y = Math.floor(state.mazePosition / q.columns);
  const nx = x + movement.dx, ny = y + movement.dy;
  if (nx < 0 || nx >= q.columns || ny < 0 || ny >= q.rows) return state;
  const next = ny * q.columns + nx;
  if (q.walls[next] & movement.opposite) return state;
  return {
    ...state,
    mazePosition: next,
    mazeMoves: state.mazeMoves + 1,
    mazeVisited: new Set([...state.mazeVisited, next]),
  };
}

function luggageSymbol(colorId, shapeId) {
  const paint = COLORS.find((color) => color.id === colorId)?.paint || "#526c61";
  const drawing = {
    circle: '<circle cx="30" cy="30" r="19"/>',
    square: '<rect x="12" y="12" width="36" height="36" rx="4"/>',
    triangle: '<path d="M30 9 51 48H9Z"/>',
    diamond: '<path d="M30 6 53 30 30 54 7 30Z"/>',
  }[shapeId] || '<rect x="9" y="14" width="42" height="34" rx="7"/><path d="M22 14V9h16v5" fill="none"/>';
  return `<svg class="luggage-symbol" viewBox="0 0 60 60" aria-hidden="true"><g fill="${paint}" stroke="#304d43" stroke-width="2">${drawing}</g></svg>`;
}
function luggageItem(q, state, index, solved, esc) {
  const item = q.items[index], selected = state.luggageSelected === index;
  return `<button class="luggage-item ${selected ? "luggage-selected" : ""}" data-luggage-item="${index}" aria-pressed="${selected}" ${solved ? "disabled" : ""} aria-label="${esc(t(state.luggageAssignments[index] ? "第 {n} 件，{color}{shape}行李，點一下搬回行李區" : "第 {n} 件，{color}{shape}行李，點一下選取", { n: index + 1, color: tx(item.colorName), shape: tx(item.shapeName) }))}">${luggageSymbol(item.color, item.shape)}<span>${esc(tx(item.colorName))}<br>${esc(tx(item.shapeName))}</span>${selected ? `<small>${t("已選取")}</small>` : ""}</button>`;
}
// One whole sentence per maze square (the train and the end stop can share a square).
const mazeCellLabel = (train, finish) => train && finish ? "第 {row} 排、第 {col} 格，列車在這裡，終點小站"
  : train ? "第 {row} 排、第 {col} 格，列車在這裡" : finish ? "第 {row} 排、第 {col} 格，終點小站" : "第 {row} 排、第 {col} 格";
export function explorerScene(q, trip, { esc }) {
  const state = trip.explorer, solved = Boolean(trip.solved);
  if (q.game === "luggage") {
    const waiting = q.items.flatMap((_, index) => state.luggageAssignments[index] === null ? [index] : []);
    return `<div class="explorer-stage luggage-stage"><p class="explorer-instruction">${t("先點一件行李，再點籃子。籃子裡的行李也能點一下搬回來。")}</p><div class="luggage-rack" role="group" aria-label="${esc(t("等待分類的行李"))}">${waiting.map((index) => luggageItem(q, state, index, solved, esc)).join("") || `<p class="luggage-empty">${t("行李都放好了，再確認一次。")}</p>`}</div><p class="luggage-selection" role="status">${state.luggageSelected === null ? t("選一件行李，看看籃子的標示。") : t("拿好了{color}{shape}行李，想放在哪個籃子？", { color: esc(tx(q.items[state.luggageSelected].colorName)), shape: esc(tx(q.items[state.luggageSelected].shapeName)) })}</p><div class="luggage-bins">${q.bins.map((bin) => `<div class="luggage-bin"><button class="luggage-bin-label" data-luggage-bin="${esc(bin.id)}" ${solved || state.luggageSelected === null ? "disabled" : ""} aria-label="${esc(t("放入{label}籃子", { label: tx(bin.label) }))}">${luggageSymbol(bin.color, bin.shape)}<strong>${esc(tx(bin.label))}</strong><span>${t(state.luggageSelected === null ? "先選行李" : "放進這裡 ↓")}</span></button><div class="luggage-bin-items" role="group" aria-label="${esc(t("{label}籃子中的行李", { label: tx(bin.label) }))}">${q.items.flatMap((_, index) => state.luggageAssignments[index] === bin.id ? [luggageItem(q, state, index, solved, esc)] : []).join("") || `<span class="luggage-empty">${t("還沒放行李")}</span>`}</div></div>`).join("")}</div><div class="explorer-actions"><button id="luggage-reset" class="text-btn" ${solved ? "disabled" : ""}>${t("全部搬回來")}</button><button id="luggage-submit" class="primary-btn" ${solved || waiting.length ? "disabled" : ""}>${t("分好了，看看結果 ✓")}</button></div></div>`;
  }
  if (q.game === "maze") {
    return `<div class="explorer-stage maze-stage"><p class="explorer-instruction">${t("按方向鈕，或用鍵盤方向鍵，帶列車走到「站」。")}</p><div id="maze-board" class="maze-board" role="grid" tabindex="0" aria-label="${esc(t("車站迷宮，目前列車在第 {row} 排、第 {col} 格", { row: Math.floor(state.mazePosition / q.columns) + 1, col: state.mazePosition % q.columns + 1 }))}" style="--maze-columns:${q.columns}">${q.walls.map((walls, index) => `<div class="maze-cell ${Object.entries(MAZE_DIRECTIONS).filter(([, direction]) => walls & direction.bit).map(([name]) => `wall-${name}`).join(" ")} ${index === state.mazePosition ? "maze-current" : ""}" role="gridcell" aria-label="${esc(t(mazeCellLabel(index === state.mazePosition, index === q.finish), { row: Math.floor(index / q.columns) + 1, col: index % q.columns + 1 }))}">${index === state.mazePosition ? '<span class="maze-train" aria-hidden="true">🚆</span>' : ""}${index === q.finish ? `<span class="maze-station" aria-hidden="true">${t("站")}</span>` : ""}${index === q.start && index !== state.mazePosition ? `<span class="maze-start" aria-hidden="true">${t("起")}</span>` : ""}</div>`).join("")}</div><p class="maze-status" role="status">${t(solved ? "列車到站了！" : "遇到牆就換個方向，也可以走回原來的地方。")}</p><div class="maze-controls" role="group" aria-label="${esc(t("列車移動方向"))}">${Object.entries(MAZE_DIRECTIONS).map(([name, direction]) => `<button class="maze-direction move-${name}" data-maze-direction="${name}" aria-label="${esc(t("往{dir}走一格", { dir: tx(direction.name) }))}" ${solved ? "disabled" : ""}>${direction.symbol}</button>`).join("")}</div><div class="explorer-actions"><button id="maze-reset" class="text-btn" ${solved ? "disabled" : ""}>${t("回到起點")}</button></div></div>`;
  }
  return "";
}
