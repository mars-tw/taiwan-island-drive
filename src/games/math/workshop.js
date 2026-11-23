// Ported from Taiwan Train Math 1.11.0 (src/workshop.js), Copyright 2026 mars-tw.
// Code: Apache-2.0; original educational text: CC-BY-4.0.
// Changed for the academy: header added, line endings normalised; logic unchanged.
// See public/licenses/taiwan-train-math/NOTICE.txt and docs/r48-math-room-assets.json.
export const PROGRAM_DIRECTIONS = {
  up: { bit: 1, opposite: 4, dx: 0, dy: -1, name: "上", symbol: "↑" },
  right: { bit: 2, opposite: 8, dx: 1, dy: 0, name: "右", symbol: "→" },
  down: { bit: 4, opposite: 1, dx: 0, dy: 1, name: "下", symbol: "↓" },
  left: { bit: 8, opposite: 2, dx: -1, dy: 0, name: "左", symbol: "←" },
};
const LEVELS = {
  small: { size: 3, commands: 6, maxWeight: 5, weights: [1, 2], boxes: 6 },
  medium: { size: 4, commands: 10, maxWeight: 10, weights: [1, 2, 5], boxes: 8 },
  large: { size: 5, commands: 16, maxWeight: 20, weights: [2, 3, 5], boxes: 8 },
};
const escHtml = value => String(value).replace(/[&<>"']/g, character =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
function indexFor(length, rng) {
  const value = rng();
  return Number.isFinite(value) ? Math.max(0, Math.min(length - 1, Math.floor(value * length))) : 0;
}
function levelFor(level) {
  if (!Object.hasOwn(LEVELS, level)) throw new Error("Unknown workshop level");
  return LEVELS[level];
}
function neighbours(position, size) {
  const x = position % size, y = Math.floor(position / size);
  return Object.entries(PROGRAM_DIRECTIONS).flatMap(([name, direction]) => {
    const nx = x + direction.dx, ny = y + direction.dy;
    return nx < 0 || nx >= size || ny < 0 || ny >= size ? []
      : [{ name, direction, next: ny * size + nx }];
  });
}
function carve(walls, from, direction, next) {
  walls[from] &= ~direction.bit;
  walls[next] &= ~direction.opposite;
}
function maze(size, rng) {
  const walls = Array(size * size).fill(15), visited = new Set([0]), stack = [0];
  while (stack.length) {
    const from = stack.at(-1), available = neighbours(from, size).filter(({ next }) => !visited.has(next));
    if (!available.length) { stack.pop(); continue; }
    const { direction, next } = available[indexFor(available.length, rng)];
    carve(walls, from, direction, next);
    visited.add(next); stack.push(next);
  }
  return walls;
}
function distance(walls, size) {
  const queue = [[0, 0]], visited = new Set([0]);
  for (let i = 0; i < queue.length; i++) {
    const [from, steps] = queue[i];
    if (from === walls.length - 1) return steps;
    for (const { direction, next } of neighbours(from, size))
      if (!(walls[from] & direction.bit) && !(walls[next] & direction.opposite) && !visited.has(next)) {
        visited.add(next); queue.push([next, steps + 1]);
      }
  }
  return Infinity;
}
export function createProgramQuestion({ level, rng = Math.random }) {
  const cfg = levelFor(level), size = cfg.size;
  let walls;
  // Eight finite candidates preserve winding routes without an unbounded retry.
  for (let attempt = 0; attempt < 8; attempt++) {
    walls = maze(size, rng);
    if (distance(walls, size) <= cfg.commands) break;
  }
  if (distance(walls, size) > cfg.commands) {
    // Add a randomly interleaved right/down route to the last maze. It is
    // bounded by 2 * (size - 1), while the other branches remain explorable.
    let from = 0;
    while (from !== walls.length - 1) {
      const possible = neighbours(from, size).filter(({ name }) => name === "right" || name === "down");
      const { direction, next } = possible[indexFor(possible.length, rng)];
      carve(walls, from, direction, next); from = next;
    }
  }
  // An optional extra connection gives another choice of route, particularly
  // in the small grid, without making the shortest plan longer.
  if (rng() < 0.5) {
    const closed = walls.flatMap((_wall, from) => neighbours(from, size)
      .filter(({ name, direction }) => ["right", "down"].includes(name) && walls[from] & direction.bit)
      .map(edge => ({ from, ...edge })));
    if (closed.length) {
      const { from, direction, next } = closed[indexFor(closed.length, rng)];
      carve(walls, from, direction, next);
    }
  }
  return {
    game: "program", level, columns: size, rows: size, start: 0, finish: walls.length - 1,
    walls, maxCommands: cfg.commands, answer: "arrived",
    prompt: "先排好方向指令，再讓小火車出發。",
    hint: "從起點想好每一步，遇到牆就換個方向；可以改指令後再跑一次。",
  };
}
function reachableWeights(values, maxBoxes, maxWeight) {
  const all = new Set(), current = new Set([0]);
  let layer = current;
  for (let box = 0; box < maxBoxes; box++) {
    const next = new Set();
    for (const sum of layer) for (const value of values)
      if (sum + value <= maxWeight) { next.add(sum + value); all.add(sum + value); }
    layer = next;
  }
  return [...all].sort((a, b) => a - b);
}
export function createBalanceQuestion({ level, rng = Math.random }) {
  const cfg = levelFor(level);
  const bank = reachableWeights(cfg.weights, cfg.boxes, cfg.maxWeight);
  const target = bank[indexFor(bank.length, rng)];
  return {
    game: "balance", level, target, allowedWeights: [...cfg.weights], maxBoxes: cfg.boxes,
    answer: target, prompt: `幫貨運列車配好重量，和 ${target} 公斤的貨物一樣重。`,
    hint: "看看每箱的重量，試著搭配不同的貨物；檢查後可以搬回來調整。",
  };
}
export function newWorkshopState(q) {
  const start = Number.isInteger(q?.start) && q.start >= 0 ? q.start : 0;
  return {
    commands: [], programPosition: start, programTrace: [start], programChecked: false,
    weights: [], balanceChecked: false, balanceTilt: 0,
  };
}
export const resetWorkshopState = q => newWorkshopState(q);
function programValid(q) {
  const cfg = typeof q?.level === "string" && Object.hasOwn(LEVELS, q.level) ? LEVELS[q.level] : null;
  return q?.game === "program" && cfg && q.columns === cfg.size && q.rows === cfg.size
    && Array.isArray(q.walls) && q.walls.length === q.columns * q.rows
    && Array.from(q.walls).every(wall => Number.isInteger(wall) && wall >= 0 && wall <= 15)
    && [q.start, q.finish].every(position => Number.isInteger(position) && position >= 0 && position < q.walls.length)
    && q.start !== q.finish && Number.isInteger(q.maxCommands) && q.maxCommands > 0 && q.maxCommands <= cfg.commands;
}
function commandsValid(q, commands) {
  return programValid(q) && Array.isArray(commands) && commands.length <= q.maxCommands
    && Array.from(commands).every(direction => typeof direction === "string" && Object.hasOwn(PROGRAM_DIRECTIONS, direction));
}
function programStateValid(q, state) {
  return commandsValid(q, state?.commands) && typeof state.programChecked === "boolean"
    && Number.isInteger(state.programPosition) && state.programPosition >= 0 && state.programPosition < q.walls.length
    && Array.isArray(state.programTrace) && state.programTrace.length >= 1 && state.programTrace.length <= q.maxCommands + 1
    && state.programTrace[0] === q.start && state.programTrace.at(-1) === state.programPosition
    && Array.from(state.programTrace).every(position => Number.isInteger(position) && position >= 0 && position < q.walls.length);
}
function unrun(q, state, commands) {
  return { ...state, commands, programPosition: q.start, programTrace: [q.start], programChecked: false };
}
export function appendCommand(q, state, direction) {
  if (!programStateValid(q, state) || typeof direction !== "string" || !Object.hasOwn(PROGRAM_DIRECTIONS, direction) || state.commands.length >= q.maxCommands) return state;
  // Extending the plan does not undo the train's last actual journey. The
  // next departure restarts at the beginning; deleting/resetting still unrun.
  return { ...state, commands: [...state.commands, direction], programChecked: false };
}
export function removeCommand(q, state, index) {
  if (!programStateValid(q, state)) return state;
  if (index === null) return state.commands.length || state.programChecked ? unrun(q, state, []) : state;
  const at = index === undefined ? state.commands.length - 1 : index;
  if (!Number.isInteger(at) || at < 0 || at >= state.commands.length) return state;
  return unrun(q, state, state.commands.filter((_direction, i) => i !== at));
}
export function evaluateProgram(q, commands) {
  const start = Number.isInteger(q?.start) && q.start >= 0 && Array.isArray(q?.walls) && q.start < q.walls.length ? q.start : 0;
  if (!commandsValid(q, commands)) return { arrived: false, position: start, trace: [start], blocked: true };
  let position = q.start, blocked = false;
  const trace = [position];
  for (const name of commands) {
    const direction = PROGRAM_DIRECTIONS[name], x = position % q.columns, y = Math.floor(position / q.columns);
    const nx = x + direction.dx, ny = y + direction.dy, next = ny * q.columns + nx;
    if (q.walls[position] & direction.bit || nx < 0 || nx >= q.columns || ny < 0 || ny >= q.rows || q.walls[next] & direction.opposite) {
      blocked = true; break;
    }
    position = next; trace.push(position);
  }
  return { arrived: !blocked && position === q.finish, position, trace, blocked };
}
function balanceValid(q) {
  const cfg = typeof q?.level === "string" && Object.hasOwn(LEVELS, q.level) ? LEVELS[q.level] : null;
  return q?.game === "balance" && cfg && Array.isArray(q.allowedWeights)
    && q.allowedWeights.length === cfg.weights.length && new Set(q.allowedWeights).size === q.allowedWeights.length
    && Array.from(q.allowedWeights).every(value => cfg.weights.includes(value))
    && Number.isInteger(q.maxBoxes) && q.maxBoxes > 0 && q.maxBoxes <= cfg.boxes
    && Number.isInteger(q.target) && q.target >= 1 && q.target <= cfg.maxWeight
    && reachableWeights(q.allowedWeights, q.maxBoxes, cfg.maxWeight).includes(q.target);
}
export function weightTotal(q, weights) {
  if (!balanceValid(q) || !Array.isArray(weights) || weights.length > q.maxBoxes
    || !Array.from(weights).every(value => Number.isInteger(value) && q.allowedWeights.includes(value))) return null;
  return weights.reduce((total, value) => total + value, 0);
}
function balanceStateValid(q, state) {
  return weightTotal(q, state?.weights) !== null && typeof state.balanceChecked === "boolean" && [-1, 0, 1].includes(state.balanceTilt);
}
export function addWeight(q, state, value) {
  if (!balanceStateValid(q, state) || !q.allowedWeights.includes(value) || state.weights.length >= q.maxBoxes) return state;
  return { ...state, weights: [...state.weights, value], balanceChecked: false, balanceTilt: 0 };
}
export function removeWeight(q, state, index) {
  if (!balanceStateValid(q, state) || !Number.isInteger(index) || index < 0 || index >= state.weights.length) return state;
  return { ...state, weights: state.weights.filter((_value, at) => at !== index), balanceChecked: false, balanceTilt: 0 };
}
function scale(q, state) {
  const tilt = state.balanceChecked ? state.balanceTilt : 0;
  const left = 58 - tilt * 10, right = 58 + tilt * 10;
  const freight = state.weights.map((value, index) => {
    const x = 23 + index % 4 * 19, y = left + 41 - Math.floor(index / 4) * 19;
    return `<g><rect x="${x}" y="${y}" width="17" height="17" rx="3" fill="#efd29b" stroke="#685338"/><text x="${x + 8.5}" y="${y + 12}" text-anchor="middle">${value}</text></g>`;
  }).join("");
  return `<svg class="cargo-balance" viewBox="0 0 320 166" role="img" aria-label="貨運天平，${!state.balanceChecked ? "待檢查，先保持水平" : tilt < 0 ? "左邊比較重" : tilt > 0 ? "右邊比較重" : "兩邊平衡"}"><path d="M160 49 139 144h42Z" fill="#8db3a4" stroke="#42675d" stroke-width="3"/><path d="M58 ${left} 262 ${right}" fill="none" stroke="#365e53" stroke-width="7" stroke-linecap="round"/><circle cx="160" cy="58" r="7" fill="#df6939"/><path d="M58 ${left} 18 ${left + 63}h82Z M262 ${right} 222 ${right + 63}h82Z" fill="none" stroke="#78958a" stroke-width="2"/><rect x="13" y="${left + 61}" width="92" height="10" rx="5" fill="#365e53"/><rect x="217" y="${right + 61}" width="92" height="10" rx="5" fill="#365e53"/>${freight}<rect x="240" y="${right + 22}" width="44" height="37" rx="5" fill="#d9e6ee" stroke="#547687" stroke-width="2"/><text class="balance-goal-number" x="262" y="${right + 45}" text-anchor="middle">${q.target}</text><text x="262" y="${right + 56}" text-anchor="middle">公斤</text><path d="M123 146h74" stroke="#365e53" stroke-width="7" stroke-linecap="round"/></svg>`;
}
export function workshopScene(q, trip, { esc = escHtml } = {}) {
  if (!q || !["program", "balance"].includes(q.game)) return "";
  const solved = Boolean(trip?.solved), fallback = newWorkshopState(q);
  if (q.game === "program") {
    if (!programValid(q)) return "";
    const state = programStateValid(q, trip?.workshop) ? trip.workshop : fallback;
    const running = trip?.programRunning === true, locked = solved || running;
    // Evaluate only a submitted plan after it finishes. During execution or
    // after extending a plan, show only the supplied trace already travelled.
    const execution = state.programChecked && !running ? evaluateProgram(q, state.commands) : null;
    const pastJourney = !state.programChecked && state.programTrace.length > 1;
    const position = running || pastJourney ? state.programPosition : execution ? execution.position : q.start;
    const visited = new Set(running || pastJourney ? state.programTrace : execution ? execution.trace : []);
    const place = `第 ${Math.floor(position / q.columns) + 1} 排、第 ${position % q.columns + 1} 格`;
    const phase = running ? "running" : !execution ? "planning" : execution.arrived ? "arrived" : execution.blocked ? "blocked" : "stopped";
    const status = running ? `正在走第 ${Math.max(1, state.programTrace.length - 1)} 步，想改計畫可以先按「停車」。` : !execution
      ? pastJourney ? "指令和停車位置還在，按「出發」從起點再走一次。"
        : state.commands.length ? `已排 ${state.commands.length} 步，按「出發」看火車走。` : "列車還沒出發。先按方向排計畫。"
      : execution.arrived ? "照計畫到站了！列車停在終點站。"
        : execution.blocked ? `第 ${execution.trace.length} 步遇到牆，列車停在${place}。改好指令，再按「出發」。`
          : `指令跑完了，列車停在${place}，還沒到站。改好指令，再按「出發」。`;
    const board = q.walls.map((walls, index) => `<span class="program-cell ${Object.entries(PROGRAM_DIRECTIONS).filter(([, direction]) => walls & direction.bit).map(([name]) => `wall-${name}`).join(" ")} ${visited.has(index) ? "program-visited" : ""}" data-program-cell="${index}" aria-label="第 ${Math.floor(index / q.columns) + 1} 排，第 ${index % q.columns + 1} 格${index === position ? "，列車在這裡" : ""}${index === q.finish ? "，終點" : ""}">${index === position ? '<span class="program-train" aria-hidden="true">🚆</span>' : index === q.start ? '<span aria-hidden="true">起</span>' : ""}${index === q.finish ? '<span class="program-finish" aria-hidden="true">站</span>' : ""}</span>`).join("");
    return `<div class="workshop-stage program-stage"><ol class="program-steps" aria-label="玩法步驟"><li><span aria-hidden="true">①</span> 按方向排計畫</li><li><span aria-hidden="true">②</span> 按出發看火車走</li></ol><div class="program-map" style="--program-columns:${q.columns}" role="group" aria-label="指令路線圖">${board}</div><div class="program-plan"><p class="program-status" data-program-phase="${phase}" role="status">${esc(status)}</p><div class="program-queue" role="group" aria-label="已排好的指令，按出發才會依序執行">${state.commands.map((direction, index) => `<button type="button" class="program-command ${execution?.blocked && index === execution.trace.length - 1 ? "program-command-blocked" : running && index === Math.max(0, state.programTrace.length - 2) ? "program-command-current" : ""}" data-program-remove="${index}" aria-label="第 ${index + 1} 步，往${PROGRAM_DIRECTIONS[direction].name}，刪除這一步" ${locked ? "disabled" : ""}><small>${index + 1}</small>${PROGRAM_DIRECTIONS[direction].symbol}</button>`).join("") || '<span class="program-plan-empty">計畫空空的，先按方向排一步。</span>'}</div><div class="program-directions" role="group" aria-label="排方向指令，按出發才會移動"><span class="program-pad-label" aria-hidden="true">排指令</span>${Object.entries(PROGRAM_DIRECTIONS).map(([name, direction]) => `<button type="button" data-program-direction="${name}" aria-label="排一個往${direction.name}的指令" ${locked || state.commands.length >= q.maxCommands ? "disabled" : ""}>${direction.symbol}<span>排往${direction.name}</span></button>`).join("")}</div><p class="program-limit">${state.commands.length >= q.maxCommands ? `計畫已滿 ${q.maxCommands} 步，點指令刪除或按「重排」。` : `已排 ${state.commands.length}／${q.maxCommands} 步，點指令可以刪除。`}</p><div class="workshop-actions"><button type="button" id="program-reset" class="text-btn" ${locked ? "disabled" : ""}>清空計畫</button><button type="button" id="program-run" class="primary-btn" ${locked || !state.commands.length ? "disabled" : ""}>出發，看火車走 →</button></div></div></div>`;
  }
  if (q.game === "balance") {
    if (!balanceValid(q)) return "";
    const state = balanceStateValid(q, trip?.workshop) ? trip.workshop : fallback;
    const status = solved ? `總共 ${weightTotal(q, state.weights)} 公斤，剛好一樣重。`
      : !state.balanceChecked ? "貨物放好再檢查，天平現在保持水平。"
        : state.balanceTilt < 0 ? "你放的這一邊比較重，調整貨物再試。"
          : state.balanceTilt > 0 ? "你放的這一邊比較輕，調整貨物再試。" : "天平水平了，可以再檢查一次。";
    return `<div class="workshop-stage balance-stage"><div class="balance-display">${scale(q, state)}<p class="balance-status ${solved ? "balance-success" : ""}" role="status">${esc(status)}</p></div><div class="balance-work"><p class="workshop-note">選一箱放上左邊；點已放的貨物可以搬回。</p><div class="balance-supply" role="group" aria-label="可選的貨物重量">${q.allowedWeights.map(value => `<button type="button" data-balance-weight="${value}" ${solved || state.weights.length >= q.maxBoxes ? "disabled" : ""}><span aria-hidden="true">▣</span><strong>${value}</strong><small>公斤</small></button>`).join("")}</div><div class="balance-load" role="group" aria-label="已放的貨物">${state.weights.map((value, index) => `<button type="button" data-balance-remove="${index}" aria-label="搬回第 ${index + 1} 箱，${value} 公斤" ${solved ? "disabled" : ""}><span aria-hidden="true">▣</span><strong>${value}</strong><small>公斤 · 搬回</small></button>`).join("") || '<p class="balance-empty">左邊還沒放貨物。</p>'}</div><div class="workshop-actions"><button type="button" id="balance-reset" class="text-btn" ${solved ? "disabled" : ""}>全部搬回</button><button type="button" id="balance-check" class="primary-btn" ${solved || !state.weights.length ? "disabled" : ""}>放好了，秤秤看 ✓</button></div></div></div>`;
  }
  return "";
}
