// Ported from Taiwan Train Math 1.11.0 (src/engine.js), Copyright 2026 mars-tw.
// Code: Apache-2.0; original educational text: CC-BY-4.0.
// Changed for the academy: header added, "?v=1.11.0" import cache queries removed, line endings normalised; logic unchanged.
// R50: sentences with numbers or names use zh() (same Chinese output) so the room can show them in English.
// See public/licenses/taiwan-train-math/NOTICE.txt and docs/r48-math-room-assets.json.
import { createAdventureQuestion, SOUVENIRS } from "./adventure.js";
import { createPuzzleQuestion } from "./puzzle.js";
import { createLuggageQuestion, createMazeQuestion } from "./explorers.js";
import { createProgramQuestion, createBalanceQuestion } from "./workshop.js";
import { createMosaicQuestion, createDifferencesQuestion } from "./discovery.js";
import { journeyById, journeyGames } from "./journeys.js";
import { photoGameTrains, puzzlePhotoTrains, samePhotoIdentity } from "./train-images.js";
import { createTicketsQuestion } from "./tickets.js";
import { zh } from "./room-text.js";
export const V15_GAME_IDS = Object.freeze(["count", "identify", "boarding", "order", "compare", "pattern", "cargo", "memory", "clock", "tracks", "sharing", "treasure", "puzzle", "luggage", "maze"]);
export const V17_GAME_IDS = Object.freeze([...V15_GAME_IDS, "program", "balance", "mosaic", "differences"]);
export const LEVELS = {
  small: {
    name: "小小站長",
    age: "3–4 歲",
    label: "數數與配對",
    max: 5,
    stops: 3,
  },
  medium: {
    name: "火車助手",
    age: "5–6 歲",
    label: "10 以內加減",
    max: 10,
    stops: 5,
  },
  large: {
    name: "小小列車長",
    age: "7–8 歲",
    label: "20 以內加減",
    max: 20,
    stops: 5,
  },
};
export const GAMES = {
  count: {
    name: "數數看",
    icon: "●",
    description: "點點乘客，數一數有幾位。",
    levels: ["small", "medium", "large"],
  },
  identify: {
    name: "找火車",
    icon: "🚆",
    description: "看列車、聽名字，找到好朋友。",
    levels: ["small", "medium", "large"],
  },
  boarding: {
    name: "上車下車",
    icon: "＋",
    description: "讀乘客紀錄，自己算出上車下車的人數。",
    levels: ["medium", "large"],
  },
  order: {
    name: "排車廂",
    icon: "123",
    description: "點選數字，把車廂從小到大排好。",
    levels: ["small", "medium", "large"],
  },
  compare: {
    name: "比一比",
    icon: "⇄",
    description: "把車票配對，找出哪邊比較多。",
    levels: ["medium", "large"],
  },
  pattern: {
    name: "規律小火車",
    icon: "◆",
    description: "看看車廂的規律，接上下一節。",
    levels: ["small", "medium", "large"],
  },
  cargo: {
    name: "貨物裝箱",
    icon: "▣",
    description: "親手放入貨物，裝到剛剛好的數量。",
    levels: ["small", "medium", "large"],
  },
  memory: {
    name: "列車記憶翻卡",
    icon: "▧",
    description: "翻開兩張卡，找出一樣的列車。",
    levels: ["small", "medium", "large"],
  },
  clock: {
    name: "車站時鐘",
    icon: "◷",
    description: "看時針和分針，找到出發時間。",
    levels: ["medium", "large"],
  },
  tracks: {
    name: "路線小工程師",
    icon: "⌁",
    description: "轉轉軌道，接通列車到小站的路。",
    levels: ["small", "medium", "large"],
  },
  sharing: {
    name: "列車點心派對",
    icon: "🍎",
    description: "親手分點心，讓朋友們一樣多。",
    levels: ["small", "medium", "large"],
  },
  treasure: {
    name: "山海尋寶",
    icon: "✦",
    description: "探索風景，找到藏起來的小寶物。",
    levels: ["small", "medium", "large"],
  },
  puzzle: {
    name: "火車拼圖",
    icon: "🧩",
    description: "看圖片的線條和風景，把火車一片片拼回來。",
    levels: ["small", "medium", "large"],
  },
  luggage: {
    name: "行李分類站",
    icon: "▰",
    description: "看看顏色和形狀，把行李分進合適的籃子。",
    levels: ["small", "medium", "large"],
  },
  maze: {
    name: "車站迷宮",
    icon: "↱",
    description: "自己找一條路，帶小火車走到終點站。",
    levels: ["small", "medium", "large"],
  },
  program: {
    name: "指令小司機", icon: "↗", description: "先排好方向指令，再讓列車照計畫走。",
    levels: ["small", "medium", "large"],
  },
  balance: {
    name: "貨運天平", icon: "⚖", description: "選好不同重量的貨物，讓兩邊一樣重。",
    levels: ["small", "medium", "large"],
  },
  mosaic: {
    name: "圖形拼搭", icon: "▦", description: "照著小圖，選色塊拼出自己的圖案。",
    levels: ["small", "medium", "large"],
  },
  differences: {
    name: "眼力找不同", icon: "◎", description: "比較兩幅車站風景，找出不同的地方。",
    levels: ["small", "medium", "large"],
  },
  tickets: {
    name: "車票小幫手", icon: "🎟", description: "選目的地，分配有限的代幣，幫每張車票付剛好。",
    levels: ["small", "medium", "large"],
  },
};
export const allowedGames = (level) =>
  Object.keys(GAMES).filter((id) => GAMES[id].levels.includes(level));
export const SHAPES = {
  circle: { symbol: "●", name: "圓形" },
  diamond: { symbol: "◆", name: "菱形" },
  square: { symbol: "■", name: "正方形" },
  triangle: { symbol: "▲", name: "三角形" },
};
export function clockLabel(value) {
  const hour = Math.floor(value / 60);
  return zh(value % 60 ? "{hour} 點半" : "{hour} 點整", { hour });
}
export function newMemoryState() {
  return { open: [], matched: [], turns: 0 };
}
export function memoryTurn(state, index, deck) {
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= deck.length ||
    state.open.length === 2 ||
    state.open.includes(index) ||
    state.matched.includes(index)
  )
    return state;
  const open = [...state.open, index];
  if (open.length === 2 && deck[open[0]] === deck[open[1]])
    return {
      open: [],
      matched: [...state.matched, ...open],
      turns: state.turns + 1,
    };
  return { ...state, open, turns: state.turns + (open.length === 2 ? 1 : 0) };
}
export function seededRandom(seed) {
  let n = seed >>> 0;
  return () => {
    n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
    return n / 4294967296;
  };
}
export function shuffle(values, rng = Math.random) {
  const a = [...values];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function randomInt(min, max, rng = Math.random) {
  return min + Math.floor(rng() * (max - min + 1));
}
function options(answer, max, count, rng) {
  const pool = shuffle(
    Array.from({ length: max + 1 }, (_, i) => i).filter((n) => n !== answer),
    rng,
  );
  return shuffle([answer, ...pool.slice(0, count - 1)], rng);
}
export const HISTORY_LIMITS = { questions: 96, games: 48 };

// Store the task itself, never the shuffled answer buttons or decorative text.
export function questionSignature(q) {
  const details = {
    count: () => q.count,
    cargo: () => q.answer,
    boarding: () => [q.operation, q.start, q.change],
    order: () => [...q.answer].sort((a, b) => a - b),
    compare: () => [q.left, q.right],
    pattern: () => [q.kind, q.sequence],
    clock: () => [q.hour, q.minute],
    identify: () => q.target,
    memory: () => [...q.pairs].sort(),
    sharing: () => [q.friends, q.total],
    treasure: () => [q.target, q.items],
    puzzle: () => [q.image, q.columns, q.rows],
    luggage: () => [q.bins.map(bin => [bin.label, bin.color, bin.shape]), q.items.map(item => [item.color, item.shape])],
    maze: () => [q.columns, q.rows, q.walls],
    program: () => [q.columns, q.rows, q.walls, q.start, q.finish, q.maxCommands],
    balance: () => [q.target, q.allowedWeights, q.maxBoxes],
    mosaic: () => [q.columns, q.rows, q.target],
    differences: () => [q.sceneTheme, q.itemsLeft.map(item => [item.kind, item.variant, item.accent]), q.itemsRight.map(item => [item.kind, item.variant, item.accent])],
    tickets: () => [q.tickets.map(ticket => ticket.fare).sort((a,b) => a-b), q.wallet.map(token => token.value).sort((a,b) => a-b)],
    tracks: () => [
      q.columns,
      q.rows,
      q.start,
      q.finish,
      q.tiles.map((tile) => [
        tile.kind,
        tile.kind === "straight" ? tile.initial % 2 : tile.initial,
      ]),
    ],
  };
  if (!LEVELS[q.level] || !details[q.game]) throw new Error("Unknown question");
  return JSON.stringify([q.level, q.game, details[q.game]()]);
}
function questionHistory(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((entry) => {
    if (typeof entry !== "string" || entry.length > 1024) return false;
    try {
      const parsed = JSON.parse(entry);
      return Array.isArray(parsed) && parsed.length === 3 &&
        Boolean(LEVELS[parsed[0]]) && allowedGames(parsed[0]).includes(parsed[1]);
    } catch {
      return false;
    }
  }).slice(-HISTORY_LIMITS.questions);
}
function gameHistory(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((entry) => {
    if (typeof entry !== "string") return false;
    const parts = entry.split(":");
    const [level, game] = parts;
    return parts.length === 2 && Boolean(LEVELS[level]) && allowedGames(level).includes(game);
  }).slice(-HISTORY_LIMITS.games);
}
function combinations(values, length) {
  const result = [];
  function choose(from, selected) {
    if (selected.length === length) {
      result.push(selected);
      return;
    }
    for (let i = from; i <= values.length - length + selected.length; i++)
      choose(i + 1, [...selected, values[i]]);
  }
  choose(0, []);
  return result;
}
const orderBanks = new Map();
function orderBank(level) {
  if (!orderBanks.has(level)) {
    const first = level === "small" ? 1 : 0;
    orderBanks.set(level, combinations(
      Array.from({ length: LEVELS[level].max - first + 1 }, (_, i) => first + i),
      level === "small" ? 3 : 5,
    ));
  }
  return orderBanks.get(level);
}
// Scan a finite bank once. If it is exhausted, reuse its least recent task.
// A task already in this journey is always the last choice.
function chooseFresh(bank, signature, rng, recent, excluded) {
  if (!bank.length) throw new Error("No questions available");
  const indices = new Map(recent.map((key, index) => [key, index]));
  const blocked = new Set(excluded);
  const offset = randomInt(0, bank.length - 1, rng);
  let best, bestBlocked = Infinity, bestAge = Infinity;
  for (let i = 0; i < bank.length; i++) {
    const value = bank[(offset + i) % bank.length];
    const key = signature(value);
    const inTrip = blocked.has(key) ? 1 : 0;
    const age = indices.get(key) ?? -1;
    if (!inTrip && age === -1) return value;
    if (inTrip < bestBlocked || (inTrip === bestBlocked && age < bestAge)) {
      best = value;
      bestBlocked = inTrip;
      bestAge = age;
    }
  }
  return best;
}
function distinctTrains(trains) {
  return trains.filter((t, index, all) =>
    t.status !== "future" && all.findIndex((other) =>
      other.status !== "future" && (other.image === t.image || other.name === t.name),
    ) === index,
  );
}
export function questionFor({
  level,
  game,
  train,
  trains,
  rng = Math.random,
  challenge = false,
  recentQuestions = [],
  excludedQuestions = [],
  contentVersion = "1.8.0",
}) {
  const cfg = LEVELS[level];
  if (!Object.hasOwn(LEVELS, level)) throw new Error("Unknown level");
  if (!allowedGames(level).includes(game))
    throw new Error("Game not available for this level");
  const recent = questionHistory(recentQuestions);
  const excluded = questionHistory(excludedQuestions);
  const realPhotos = ["1.7.0", "1.8.0"].includes(contentVersion);
  if (realPhotos && ["identify", "memory", "puzzle"].includes(game)) {
    trains = game === "puzzle" ? puzzlePhotoTrains(trains) : photoGameTrains(trains);
    if (trains.length < 4) throw new Error("Photo games need four verified exterior train photos");
    train = trains.find(t => t.id === train.id) || trains[0];
  }
  const pick = (bank, fields) => chooseFresh(bank,
    (value) => questionSignature({ game, level, ...fields(value) }),
    rng, recent, excluded,
  );
  if (["program", "balance", "mosaic", "differences", "tickets"].includes(game)) {
    const seed = randomInt(0, 0xffffffff, rng);
    const create = { program: createProgramQuestion, balance: createBalanceQuestion, mosaic: createMosaicQuestion, differences: createDifferencesQuestion, tickets: createTicketsQuestion }[game];
    const bank = Array.from({ length: 64 }, (_, i) => create({ level, rng: seededRandom((seed + Math.imul(i, 2654435761)) >>> 0) }));
    return pick(bank, q => q);
  }
  if (game === "puzzle") {
    const bank = distinctTrains(trains).map(target => createPuzzleQuestion({ level, train: target, trains, rng }));
    return pick(bank, q => q);
  }
  if (["luggage", "maze"].includes(game)) {
    const seed = randomInt(0, 0xffffffff, rng);
    const create = game === "luggage" ? createLuggageQuestion : createMazeQuestion;
    const bank = Array.from({ length: 64 }, (_, i) => create({
      level, rng: seededRandom((seed + Math.imul(i, 2654435761)) >>> 0),
    }));
    return pick(bank, q => q);
  }
  if (["tracks", "sharing", "treasure"].includes(game)) {
    // Adventure layouts have many states. A fixed-size candidate bank keeps
    // generation bounded even with a deterministic or unusually unlucky RNG.
    const seed = randomInt(0, 0xffffffff, rng);
    const bank = Array.from({ length: 64 }, (_, i) => createAdventureQuestion({
      game, level, max: cfg.max,
      rng: seededRandom((seed + Math.imul(i, 2654435761)) >>> 0),
      randomInt, shuffle,
    }));
    return pick(bank, (q) => q);
  }
  if (game === "pattern") {
    if (level === "large") {
      const bank = [2, 3].flatMap((step) =>
        Array.from({ length: cfg.max - step * 4 + 1 }, (_, start) => ({ step, start })),
      );
      const { step, start } = pick(bank, ({ step, start }) => ({
        kind: "number",
        sequence: Array.from({ length: 4 }, (_, i) => String(start + i * step)),
      }));
      const sequence = Array.from({ length: 4 }, (_, i) =>
        String(start + i * step),
      );
      const answer = String(start + step * 4);
      return {
        game,
        level,
        kind: "number",
        sequence,
        step,
        answer,
        choices: options(Number(answer), cfg.max, 3, rng).map(String),
        prompt: "每次多一樣多，下一節車廂是幾號？",
        hint: "先比較相鄰兩個數字，看每次增加多少，再用同樣的方法往後推。",
      };
    }
    const shapes = Object.keys(SHAPES);
    const pairs = shapes.flatMap((first) =>
      shapes.filter((second) => second !== first).map((second) => [first, second]),
    );
    const bank = level === "small" ? pairs : [
      ...pairs.map(([first, second]) => [first, first, second]),
      ...pairs.flatMap(([first, second]) =>
        shapes.filter((third) => ![first, second].includes(third))
          .map((third) => [first, second, third]),
      ),
    ];
    const unit = pick(bank, (unit) => ({
      kind: "shape", sequence: [...unit, ...unit],
    }));
    const sequence = Array.from(
      { length: unit.length * 2 },
      (_, i) => unit[i % unit.length],
    );
    return {
      game,
      level,
      kind: "shape",
      sequence,
      unit,
      answer: unit[0],
      choices: shuffle([...new Set(unit)], rng),
      prompt: "看看重複的規律，下一節車廂放什麼？",
      hint: "找出一直重複的小組，看看空位在下一組的哪個位置。",
    };
  }
  if (game === "cargo") {
    const answer = pick(Array.from({ length: cfg.max }, (_, i) => i + 1),
      (answer) => ({ answer }));
    return {
      game,
      level,
      answer,
      max: cfg.max,
      prompt: zh("請幫貨運列車裝 {n} 箱貨物。", { n: answer }),
      hint: zh("每箱算一個。目標是 {n} 箱，多了可以點貨物搬回來。", { n: answer }),
    };
  }
  if (game === "memory") {
    const count = { small: 2, medium: 3, large: 4 }[level];
    const pool = [
      train,
      ...shuffle(
        trains.filter((t) => t.id !== train.id && t.status !== "future"),
        rng,
      ),
    ];
    const unique = pool
      .filter(
        (t, i) =>
          pool.findIndex(
            (other) => other.image === t.image || other.name === t.name,
          ) === i,
      )
      .slice(0, count);
    const remainder = pool.filter((t, i) =>
      pool.findIndex((other) => other.image === t.image || other.name === t.name) === i,
    ).slice(1, realPhotos ? 13 : undefined);
    const bank = combinations(remainder.map((t) => t.id), unique.length - 1)
      .map((ids) => [unique[0].id, ...ids]);
    const pairs = pick(bank, (pairs) => ({ pairs }));
    return {
      game,
      level,
      pairs,
      deck: shuffle([...pairs, ...pairs], rng),
      answer: pairs.length,
      prompt: "翻開兩張卡，找出一樣的列車。",
      hint: "一起看看列車長什麼樣子。記住位置，再試著翻出一對。",
    };
  }
  if (game === "clock") {
    const pool = Array.from(
      { length: level === "large" ? 24 : 12 },
      (_, i) =>
        (Math.floor(i / (level === "large" ? 2 : 1)) + 1) * 60 +
        (level === "large" ? (i % 2) * 30 : 0),
    );
    const answer = pick(pool, (value) => ({
      hour: Math.floor(value / 60), minute: value % 60,
    }));
    const hour = Math.floor(answer / 60), minute = answer % 60;
    return {
      game,
      level,
      hour,
      minute,
      answer,
      choices: shuffle(
        [
          answer,
          ...shuffle(
            pool.filter((n) => n !== answer),
            rng,
          ).slice(0, 2),
        ],
        rng,
      ),
      prompt: "車站時鐘指向幾點？找到列車出發時間。",
      hint: "先看短短的時針在哪個數字附近，再看長長的分針，分辨是整點還是半點。",
    };
  }
  if (game === "identify") {
    const targetTrain = pick(distinctTrains(trains), (targetTrain) => ({ target: targetTrain.id }));
    const candidates = trains.filter(
      (t) =>
        t.id !== targetTrain.id &&
        t.name !== targetTrain.name &&
        t.model !== targetTrain.model &&
        t.image !== targetTrain.image &&
        (!realPhotos || !samePhotoIdentity(t, targetTrain)) &&
        (!realPhotos || targetTrain.modelKind !== "type" || t.referencePhoto?.vehicleModel !== targetTrain.model) &&
        t.status !== "future",
    );
    const choices = shuffle(
      [
        targetTrain.id,
        ...shuffle(distinctTrains(candidates), rng)
          .slice(0, level === "small" ? 1 : 2)
          .map((t) => t.id),
      ],
      rng,
    );
    return {
      game,
      level,
      target: targetTrain.id,
      prompt:
        level === "large" && targetTrain.modelKind === "type"
          ? zh("請找到型號是 {model} 的列車。", { model: targetTrain.model })
          : zh("請找到{name}。", { name: targetTrain.name }),
      answer: targetTrain.id,
      choices,
      hint: "看看車頭和車身的樣子，再對照題目中的列車名稱或型號。",
    };
  }
  if (game === "count") {
    const first = level === "small" ? 1 : 0;
    const count = pick(Array.from({ length: cfg.max - first + 1 }, (_, i) => first + i),
      (count) => ({ count }));
    return {
      game,
      level,
      count,
      answer: count,
      choices: options(count, cfg.max, level === "small" ? 2 : 3, rng),
      prompt:
        level === "small"
          ? "月台有幾位乘客？選一樣多的點點。"
          : "月台有幾位乘客？",
      hint: "每位乘客只數一次，已經數過的可以做記號，再自己確認總共有幾位。",
    };
  }
  if (game === "compare") {
    const amounts = Array.from({ length: Math.min(cfg.max, 10) }, (_, i) => i + 1);
    const { left, right } = pick(amounts.flatMap((left) =>
      amounts.map((right) => ({ left, right }))), (value) => value);
    return {
      game,
      level,
      left,
      right,
      answer: left === right ? "equal" : left > right ? "left" : "right",
      choices: ["left", "equal", "right"],
      prompt: "哪一邊的車票比較多？",
      hint: "把兩邊的車票一張一張配對，看看哪邊還有剩下的。",
    };
  }
  if (game === "boarding") {
    if (level === "small") throw new Error("No arithmetic in small level");
    const bank = [];
    for (const operation of ["add", "subtract"])
      for (let start = 1; start <= cfg.max; start++) {
        const cap = operation === "subtract" ? start : cfg.max - start;
        const boundary = level === "large" && !challenge
          ? Math.min(cap, operation === "add" ? 10 - (start % 10) : start % 10)
          : cap;
        for (let change = 1; change <= boundary; change++)
          bank.push({ operation, start, change });
      }
    const { operation, start, change } = pick(bank, (value) => value);
    const answer = operation === "add" ? start + change : start - change;
    return {
      game,
      level,
      start,
      change,
      operation,
      answer,
      choices: options(answer, cfg.max, 3, rng),
      prompt:
        operation === "add"
          ? zh("車上有 {start} 人，又上來 {change} 人，現在有幾人？", { start, change })
          : zh("車上有 {start} 人，下車 {change} 人，還有幾人？", { start, change }),
      hint: operation === "add"
        ? "上車會讓人數增加。從原本的人數往上加，把增加的人數算進去。"
        : "下車會讓人數減少。從原本的人數往下減，把離開的人數扣掉。",
    };
  }
  if (game === "order") {
    const answer = pick(orderBank(level), (answer) => ({ answer }));
    let numbers = shuffle(answer, rng);
    if (numbers.every((n, i) => n === answer[i])) numbers.reverse();
    return {
      game,
      level,
      numbers,
      answer,
      prompt: "請把車廂從小到大排好。",
      hint: "先找出最小的數字，再從剩下的數字裡找最小的，依序排好。",
    };
  }
  throw new Error("Unknown game");
}
export function createTrip({
  level,
  train,
  trains,
  rng = Math.random,
  challenge = false,
  practice = "mixed",
  recentQuestions = [],
  recentGames = [],
  journey = null,
  contentVersion = "1.8.0",
}) {
  if (!Object.hasOwn(LEVELS, level)) throw new Error("Unknown level");
  if (!["1.5.0", "1.6.0", "1.7.0", "1.8.0"].includes(contentVersion)) throw new Error("Unknown content version");
  const route = journey === null ? null : journeyById(journey);
  if (journey !== null && (!route || practice !== "mixed" || contentVersion === "1.5.0")) throw new Error("Unknown or incompatible journey");
  const pool = allowedGames(level).filter(game =>
    (contentVersion !== "1.5.0" || V15_GAME_IDS.includes(game)) &&
    (contentVersion === "1.8.0" || V17_GAME_IDS.includes(game)) && (!route || journeyGames(route, contentVersion).includes(game)),
  );
  if (practice === "mixed" && pool.length < LEVELS[level].stops) throw new Error("Journey needs more age-appropriate games");
  if (practice !== "mixed" && !pool.includes(practice))
    throw new Error("Game not available for this level");
  const games = gameHistory(recentGames);
  const sequence = [];
  if (practice === "mixed") {
    for (let i = 0; i < LEVELS[level].stops; i++) {
      const remaining = pool.filter((game) => !sequence.includes(game));
      const oldest = Math.min(...remaining.map((game) => games.lastIndexOf(`${level}:${game}`)));
      const available = remaining.filter((game) => games.lastIndexOf(`${level}:${game}`) === oldest);
      sequence.push(available[randomInt(0, available.length - 1, rng)]);
    }
  } else sequence.push(...Array(LEVELS[level].stops).fill(practice));
  const questions = [];
  const excludedQuestions = [];
  for (const game of practice === "mixed" ? shuffle(sequence, rng) : sequence) {
    const q = questionFor({
      level, game, train, trains, rng, challenge, recentQuestions, excludedQuestions, contentVersion,
    });
    questions.push(q);
    excludedQuestions.push(questionSignature(q));
  }
  return questions;
}
export function rememberTrip(progress, questions) {
  progress.recentQuestions = [
    ...questionHistory(progress.recentQuestions),
    ...questions.map(questionSignature),
  ].slice(-HISTORY_LIMITS.questions);
  progress.recentGames = [
    ...gameHistory(progress.recentGames),
    ...questions.map((q) => `${q.level}:${q.game}`),
  ].slice(-HISTORY_LIMITS.games);
  return progress;
}
export function isCorrect(q, answer) {
  return Array.isArray(q.answer)
    ? Array.isArray(answer) &&
        q.answer.length === answer.length &&
        q.answer.every((v, i) => v === answer[i])
    : q.answer === answer;
}
export const STORAGE_KEY = "taiwan-train-math.v1";
export const defaults = () => ({
  version: 1,
  level: "small",
  voice: false,
  effects: true,
  reduceMotion: false,
  challenge: false,
  completed: [],
  souvenirs: [],
  giftCredits: 0,
  giftOffer: [],
  trips: 0,
  recentQuestions: [],
  recentGames: [],
  journeysCompleted: [],
});
export function readProgress(storage) {
  try {
    const raw = JSON.parse(storage.getItem(STORAGE_KEY));
    if (!raw || raw.version !== 1) return defaults();
    const result = defaults();
    for (const key of ["voice", "effects", "reduceMotion", "challenge"])
      if (typeof raw[key] === "boolean") result[key] = raw[key];
    if (typeof raw.level === "string" && Object.hasOwn(LEVELS, raw.level)) result.level = raw.level;
    result.completed = Array.isArray(raw.completed)
      ? [...new Set(raw.completed.filter((id) => typeof id === "string"))]
      : [];
    result.souvenirs = Array.isArray(raw.souvenirs)
      ? [
          ...new Set(
            raw.souvenirs.filter((id) =>
              SOUVENIRS.some((item) => item.id === id),
            ),
          ),
        ]
      : [];
    result.trips =
      Number.isSafeInteger(raw.trips) && raw.trips >= 0 ? raw.trips : 0;
    result.giftCredits = Number.isSafeInteger(raw.giftCredits) && raw.giftCredits >= 0
      ? Math.min(raw.giftCredits, result.trips) : 0;
    result.giftOffer = result.giftCredits > 0 && Array.isArray(raw.giftOffer)
      ? [...new Set(raw.giftOffer.filter(id => SOUVENIRS.some(item => item.id === id)))].slice(0, 3)
      : [];
    result.recentQuestions = questionHistory(raw.recentQuestions);
    result.recentGames = gameHistory(raw.recentGames);
    result.journeysCompleted = Array.isArray(raw.journeysCompleted)
      ? [...new Set(raw.journeysCompleted.filter(id => typeof id === "string" && journeyById(id)))] : [];
    return result;
  } catch {
    return defaults();
  }
}
export function saveProgress(storage, value) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
