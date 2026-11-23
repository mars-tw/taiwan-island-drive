// Ported from Taiwan Train Math 1.11.0 (src/adventure.js), Copyright 2026 mars-tw.
// Code: Apache-2.0; original educational text: CC-BY-4.0.
// Changed for the academy: header added, line endings normalised; logic unchanged.
// See public/licenses/taiwan-train-math/NOTICE.txt and docs/r48-math-room-assets.json.
export const DIRECTIONS = ["上", "右", "下", "左"];
export const SOUVENIR_THEMES = [
  { id: "station", name: "車站工具", icon: "🎟", description: "小站長的口袋裡，裝著出發的準備。" },
  { id: "toys", name: "列車玩具", icon: "🚂", description: "把喜歡的鐵道，帶回自己的小小世界。" },
  { id: "forest", name: "山林朋友", icon: "🍃", description: "穿過山谷，遇見葉子、小鳥和森林的朋友。" },
  { id: "seaside", name: "海邊發現", icon: "🐚", description: "下一站靠海，沙灘上有好多小發現。" },
  { id: "sky", name: "天空風景", icon: "☁", description: "抬頭看看，把今天的天空收進口袋。" },
  { id: "treats", name: "旅途美味", icon: "🍎", description: "帶點小點心，和旅途中的朋友分享。" },
];
export const SOUVENIRS = [
  {
    id: "star-letter",
    icon: "✉",
    name: "星光信封",
    story: "把今天的新發現，寄給明天的自己。",
    theme: "station",
    playKind: "stamp",
  },
  {
    id: "lighthouse",
    icon: "🗼",
    name: "海邊燈塔",
    story: "小小一道光，陪列車找到海邊小站。",
    theme: "seaside",
    playKind: "glow",
  },
  {
    id: "forest-leaf",
    icon: "🍃",
    name: "森林葉子",
    story: "葉子說：慢慢走，也會發現漂亮的風景。",
    theme: "forest",
    playKind: "wind",
  },
  {
    id: "cloud",
    icon: "☁",
    name: "山谷雲朵",
    story: "軟軟的雲，像一張舒服的列車小枕頭。",
    theme: "sky",
    playKind: "wind",
  },
  {
    id: "ticket",
    icon: "🎟",
    name: "冒險車票",
    story: "這張車票，記得你完成的一趟旅行。",
    theme: "station",
    playKind: "stamp",
  },
  {
    id: "apple",
    icon: "🍎",
    name: "分享蘋果",
    story: "和朋友分享，開心也變成兩份。",
    theme: "treats",
    playKind: "bounce",
  },
  {
    id: "mountain",
    icon: "⛰",
    name: "青山徽章",
    story: "小小工程師，謝謝你讓列車順利出發。",
    theme: "forest",
    playKind: "glow",
  },
  {
    id: "bird",
    icon: "🐦",
    name: "唱歌小鳥",
    story: "啾啾！今天你又認識一台漂亮列車。",
    theme: "forest",
    playKind: "bounce",
  },
  {
    id: "clock",
    icon: "◷",
    name: "車站小鐘",
    story: "不用趕時間，想一想也沒關係。",
    theme: "station",
    playKind: "wind",
  },
  {
    id: "rainbow",
    icon: "🌈",
    name: "雨後彩虹",
    story: "每一次再試，都可能帶來新的發現。",
    theme: "sky",
    playKind: "glow",
  },
  {
    id: "shell",
    icon: "🐚",
    name: "海浪貝殼",
    story: "把耳朵靠近，好像聽見下一站的海浪。",
    theme: "seaside",
    playKind: "glow",
  },
  {
    id: "spark",
    icon: "✦",
    name: "小站星星",
    story: "每位小站長，都有自己閃亮的地方。",
    theme: "sky",
    playKind: "glow",
  },
  { id: "signal", icon: "🚦", name: "出發號誌", story: "小燈換了顏色，列車準備出發囉。", theme: "station", playKind: "signal" },
  { id: "station-sign", icon: "🚉", name: "小站名牌", story: "替自己的小車站，掛上一塊歡迎名牌。", theme: "station", playKind: "stamp" },
  { id: "whistle", icon: "📯", name: "站長口哨", story: "嗶！小站長和月台上的朋友說再見。", theme: "station", playKind: "bounce" },
  { id: "train-toy", icon: "🚂", name: "積木小火車", story: "今天搭過的列車，變成桌上的小玩伴。", theme: "toys", playKind: "bounce" },
  { id: "wooden-carriage", icon: "🚃", name: "木頭車廂", story: "替小火車接上一節車廂，再往下一站走。", theme: "toys", playKind: "bounce" },
  { id: "windmill", icon: "🌬", name: "彩色風車", story: "車窗吹來一陣風，風車轉呀轉。", theme: "toys", playKind: "wind" },
  { id: "spinning-top", icon: "🌀", name: "小小陀螺", story: "輕輕轉一下，看看誰能站得最久。", theme: "toys", playKind: "wind" },
  { id: "toy-bridge", icon: "🌉", name: "積木鐵橋", story: "搭好一座小橋，讓玩具列車越過小河。", theme: "toys", playKind: "bounce" },
  { id: "mini-track", icon: "🛤", name: "口袋鐵軌", story: "兩條小鐵軌，接起下一趟想像旅行。", theme: "toys", playKind: "bounce" },
  { id: "pinecone", icon: "🌲", name: "山路松果", story: "小松果躺在步道邊，等你發現它的花紋。", theme: "forest", playKind: "bounce" },
  { id: "forest-flower", icon: "🌼", name: "森林小花", story: "列車經過時，小花向車窗裡的你點點頭。", theme: "forest", playKind: "wind" },
  { id: "acorn", icon: "🌰", name: "松鼠橡實", story: "這顆小橡實，像松鼠藏好的旅行點心。", theme: "forest", playKind: "bounce" },
  { id: "sea-glass", icon: "💎", name: "海色玻璃", story: "海浪磨出圓圓的邊，留下透亮的海色。", theme: "seaside", playKind: "glow" },
  { id: "crab", icon: "🦀", name: "沙灘小蟹", story: "小螃蟹橫著走，在沙灘畫出自己的路。", theme: "seaside", playKind: "bounce" },
  { id: "sailboat", icon: "⛵", name: "海風帆船", story: "帆船迎著海風，和岸邊的列車一起旅行。", theme: "seaside", playKind: "wind" },
  { id: "pebble", icon: "🪨", name: "圓圓海石", story: "握在手裡的小石頭，記得海浪的聲音。", theme: "seaside", playKind: "bounce" },
  { id: "moon", icon: "🌙", name: "晚安月亮", story: "天色暗了，月亮陪最後一班列車回家。", theme: "sky", playKind: "glow" },
  { id: "balloon", icon: "🎈", name: "遠行氣球", story: "氣球飄過車站，好像也在找下一站。", theme: "sky", playKind: "wind" },
  { id: "kite", icon: "🪁", name: "山谷風箏", story: "拉住一條細線，就能和山谷的風玩一會兒。", theme: "sky", playKind: "wind" },
  { id: "riceball", icon: "🍙", name: "旅行飯糰", story: "打開小飯糰，車窗外剛好是一片稻田。", theme: "treats", playKind: "bounce" },
  { id: "milk", icon: "🥛", name: "牧場鮮奶", story: "經過綠綠的牧場，帶一瓶小小的白色點心。", theme: "treats", playKind: "bounce" },
  { id: "pudding", icon: "🍮", name: "搖搖布丁", story: "列車晃一下，布丁也跟著搖一下。", theme: "treats", playKind: "bounce" },
  { id: "biscuit", icon: "🍪", name: "車輪餅乾", story: "圓圓的小餅乾，像列車不停轉動的輪子。", theme: "treats", playKind: "bounce" },
  { id: "berry", icon: "🍓", name: "紅紅草莓", story: "把山腳下的小草莓，留一顆給同行的朋友。", theme: "treats", playKind: "bounce" },
];
export function giftChoices(progress, trainId, rng = Math.random) {
  const collected = new Set(progress?.souvenirs || []);
  const remaining = SOUVENIRS.filter((item) => !collected.has(item.id));
  const pool = remaining.length ? remaining : SOUVENIRS;
  const hash = [...String(trainId || "")].reduce(
    (n, char) => n + char.charCodeAt(0),
    (progress?.trips || 0) * 17,
  );
  const offset = hash % pool.length;
  const shuffled = [...pool.slice(offset), ...pool.slice(0, offset)];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const at = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[at]] = [shuffled[at], shuffled[i]];
  }
  const choices = [], themes = new Set();
  for (const item of shuffled) {
    if (themes.has(item.theme)) continue;
    choices.push(item);
    themes.add(item.theme);
    if (choices.length === 3) return choices;
  }
  for (const item of shuffled) {
    if (!choices.includes(item)) choices.push(item);
    if (choices.length === Math.min(3, pool.length)) break;
  }
  return choices;
}
export function pickSouvenir(progress, trainId) {
  return giftChoices(progress, trainId, () => 0)[0];
}
export function railLinks(kind, rotation) {
  if (kind === "empty") return [];
  return (kind === "straight" ? [0, 2] : [0, 1]).map((d) => (d + rotation) % 4);
}
export function trackConnected(q, rotations) {
  if (
    !Array.isArray(rotations) ||
    rotations.length !== q.tiles.length ||
    rotations.some((v) => !Number.isInteger(v) || v < 0 || v > 3)
  )
    return false;
  let cell = q.start,
    incoming = 3;
  const visited = new Set();
  while (!visited.has(cell)) {
    visited.add(cell);
    const links = railLinks(q.tiles[cell].kind, rotations[cell]);
    if (links.length !== 2 || !links.includes(incoming)) return false;
    const outgoing = links.find((d) => d !== incoming);
    const x = cell % q.columns,
      y = Math.floor(cell / q.columns);
    const nx = x + [0, 1, 0, -1][outgoing],
      ny = y + [-1, 0, 1, 0][outgoing];
    if (nx < 0 || nx >= q.columns || ny < 0 || ny >= q.rows)
      return cell === q.finish && outgoing === 1;
    cell = ny * q.columns + nx;
    incoming = (outgoing + 2) % 4;
  }
  return false;
}
export function newAdventureState(q) {
  return {
    rotations: q.tiles?.map((tile) => tile.initial) || [],
    shares: Array(q.friends || 0).fill(0),
    found: new Set(),
    trackHint: false,
    treasureHint: false,
  };
}
export function changeShare(q, shares, index, delta) {
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= q.friends ||
    ![-1, 1].includes(delta) ||
    shares.length !== q.friends
  )
    return shares;
  if (delta === 1 && shares.reduce((a, b) => a + b, 0) >= q.total)
    return shares;
  if (delta === -1 && shares[index] === 0) return shares;
  return shares.map((n, i) => n + (i === index ? delta : 0));
}
export function createAdventureQuestion({
  game,
  level,
  max,
  rng,
  randomInt,
  shuffle,
}) {
  if (game === "tracks") {
    const columns = level === "small" ? 2 : 3,
      rows = columns;
    const paths =
      level === "small"
        ? [[0, 1, 3], [0, 2, 3]]
        : level === "medium"
          ? [
              [0, 1, 2, 5, 8],
              [0, 1, 4, 5, 8],
              [0, 1, 4, 7, 8],
              [0, 3, 4, 5, 8],
              [0, 3, 4, 7, 8],
              [0, 3, 6, 7, 8],
            ]
          : [[0, 3, 4, 1, 2, 5, 8], [0, 1, 4, 3, 6, 7, 8]];
    const path = paths[randomInt(0, paths.length - 1, rng)];
    const direction = (from, to) =>
      to === from - columns
        ? 0
        : to === from + 1
          ? 1
          : to === from + columns
            ? 2
            : 3;
    const tiles = Array.from({ length: columns * rows }, (_, index) => {
      const at = path.indexOf(index);
      if (at === -1) return { kind: "empty", initial: 0, solution: 0 };
      const inDir = at === 0 ? 3 : direction(index, path[at - 1]),
        outDir = at === path.length - 1 ? 1 : direction(index, path[at + 1]);
      const kind = (inDir + 2) % 4 === outDir ? "straight" : "curve";
      const solution = [0, 1, 2, 3].find(
        (r) =>
          railLinks(kind, r).includes(inDir) &&
          railLinks(kind, r).includes(outDir),
      );
      return { kind, solution, initial: randomInt(0, 3, rng) };
    });
    const q = {
      game,
      level,
      columns,
      rows,
      path,
      tiles,
      start: path[0],
      finish: path.at(-1),
      answer: "connected",
      prompt: "轉轉軌道，把列車接到小站。",
      hint: "從起點跟著軌道走，檢查兩格交界的鐵軌有沒有接在一起。",
    };
    if (
      trackConnected(
        q,
        tiles.map((t) => t.initial),
      )
    )
      tiles[q.start].initial = (tiles[q.start].initial + 1) % 4;
    return q;
  }
  if (game === "sharing") {
    const friends = level === "small" ? 2 : randomInt(2, 3, rng);
    const each = randomInt(1, Math.floor(max / friends), rng);
    const food = ["🍎", "🍓", "🍊"][randomInt(0, 2, rng)];
    return {
      game,
      level,
      friends,
      total: friends * each,
      food,
      answer: Array(friends).fill(each),
      prompt: `把 ${friends * each} 份點心，分給 ${friends} 位朋友，讓每位一樣多。`,
      hint: "一次給每位朋友一份，再分下一輪。多了可以搬回點心籃。",
    };
  }
  if (game === "treasure") {
    const target = randomInt(
        2,
        level === "small" ? 3 : level === "medium" ? 4 : 5,
        rng,
      ),
      size = level === "small" ? 9 : 12;
    const icons = shuffle(["star", "leaf", "shell"], rng),
      kind = icons[0];
    const items = shuffle(
      [
        ...Array(target).fill(kind),
        ...Array.from({ length: size - target }, (_, i) => icons[1 + (i % 2)]),
      ],
      rng,
    );
    const names = { star: "星星", leaf: "葉子", shell: "貝殼" };
    return {
      game,
      level,
      items,
      target: kind,
      answer: target,
      prompt: `山海風景裡，找出 ${target} 個${names[kind]}。`,
      hint: `只找${names[kind]}，每個點一次。找到的會亮起來；其他小東西可以下次再看。`,
    };
  }
  throw new Error("Unknown adventure");
}
