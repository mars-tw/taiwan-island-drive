// Ported from Taiwan Train Math 1.11.0 (src/learning-guide.js), Copyright 2026 mars-tw.
// Code: Apache-2.0; original educational text: CC-BY-4.0.
// Changed for the academy: header added, line endings normalised; logic unchanged.
// R50: sentences built from parts use zh() (same Chinese output) so the room can show them in English.
// See public/licenses/taiwan-train-math/NOTICE.txt and docs/r48-math-room-assets.json.
// Presentation only: use public question descriptions and work already visible
// on screen. Do not inspect solutions, option banks, routes or hidden matches.
import { zh } from "./room-text.js";
const GUIDES = {
  count: { title: "月台有幾位乘客？", action: "數一數，再選一樣多的答案。", help: "每位只數一次；點過的可以做記號。", success: "一位配一個數，最後的數表示總人數。" },
  identify: { title: "找題目中的列車。", action: "點你找到的列車卡。", help: "看看車頭和車身，再對照列車名稱。", success: "列車的外形、名稱和型號能幫你辨認。" },
  boarding: { title: "車上現在有幾人？", action: "輸入你算出的人數。", help: "上車會增加人數，下車會減少人數。", success: "上車用加法，下車用減法。" },
  order: { title: "車廂號碼從小排到大。", action: "點剩下最小的數字。", help: "每排好一個，再找剩下最小的。", success: "車廂號碼從小到大排好了。" },
  compare: { title: "哪邊比較多，還是一樣多？", action: "選左邊、右邊或一樣多。", help: "一張對一張看看，哪邊還有剩下。", success: "比較數量時，也要看看是不是一樣多。" },
  pattern: { title: "下一節放哪個圖形？", action: "選下一節的圖形。", help: "看看哪一小組一直重複。", success: "圖形會按同一小組反覆出現。" },
  cargo: { title: "幫列車裝貨物。", action: "點「＋ 1 箱」放貨物。", help: "每箱算一個；多了可以點貨物搬回。", success: "每放一箱，就多一箱。" },
  memory: { title: "找出一樣的兩張列車卡。", action: "先翻一張卡。", help: "記住看過的樣子和位置，再找另一張。", success: "記住看過的位置，就能找到配對。" },
  clock: { title: "時鐘是幾點？", action: "選你看到的時間。", help: "短針看幾點，長針分辨整點、半點。", success: "短針看小時，長針看分鐘。" },
  tracks: { title: "接通列車到小站的軌道。", action: "點一格軌道轉方向。", help: "從起點看，檢查兩格的接縫。", success: "軌道連好了，列車能到站。" },
  sharing: { title: "點心全部分完，每位一樣多。", action: "先給一位朋友 1 份。", help: "一輪各給一份，再開始下一輪。", success: "點心全分完，每位得到一樣多。" },
  treasure: { title: "找題目中的寶物。", action: "點一個你找到的寶物。", help: "對照要找的圖案，逐個找。", success: "仔細分辨圖案，就能找到同類寶物。" },
  puzzle: { title: "把列車照片拼回來。", action: "先點一片拼圖。", help: "看看車頭、天空和邊緣，找能接上的圖。", success: "相接的線條和風景，能拼回完整照片。" },
  luggage: { title: "把相同的行李放一起。", action: "先點一件行李。", help: "看看籃子標示，再比一比行李。", success: "照同一個條件，就能把行李分類。" },
  maze: { title: "帶列車走到終點站。", action: "按一個方向，走一格。", help: "先看牆；走不通可以回頭。", success: "你找到了通往小站的路。" },
  program: { title: "先排方向，再讓列車出發。", action: "先按一個方向排計畫。", help: "想好每一步；點指令可刪掉，再重新排。", success: "先排計畫，再照順序走，就能檢查你的方法。" },
  balance: { title: "配到和右邊的貨物一樣重。", action: "選一箱放上天平。", help: "比較每箱重量，試不同搭配。", success: "兩邊一樣重，天平就會水平。" },
  mosaic: { title: "照小圖拼出圖形。", action: "點一格，放上目前的色塊。", help: "想換色先點色塊；畫錯可用橡皮擦。", success: "比對位置和色塊，就能組成同樣的圖案。" },
  differences: { title: "比一比，找出不同。", action: "點右圖中不同的一區。", help: "一次比較一區的形狀、方向和數量。", success: "分區仔細比較，就能看出不同。" },
  tickets: { title: "用代幣付剛好的票價。", action: "先點要付款的車票。", help: "看每枚寫幾點；可以搭配好幾枚。", success: "不同點數的代幣，也能搭配出同樣的票價。" },
};
const FALLBACK = { title: "一起玩列車", action: "先看看題目。", help: "想一想，再試一次。", success: "一起完成了。" };
const TARGET_TITLES = new Set(["identify", "boarding", "cargo", "sharing", "treasure", "puzzle", "luggage", "balance", "mosaic", "differences", "tickets"]);
const isIndex = value => Number.isInteger(value) && value >= 0;
const hasValues = values => Array.isArray(values) && values.length > 0;

function publicTitle(game, prompt, fallback) {
  if (typeof prompt !== "string" || !prompt.trim()) return fallback;
  const text = prompt.trim().replace(/^請/, "");
  let found;
  if (game === "boarding" && (found = text.match(/^車上有\s*(\d+)\s*人，(又上來|下車)\s*(\d+)\s*人，(?:現在有|還有)幾人[？?]$/)))
    return zh(found[2] === "下車" ? "車上 {start} 人，下車 {change} 人。還有幾人？" : "車上 {start} 人，上車 {change} 人。現在幾人？", { start: found[1], change: found[3] });
  if (game === "cargo" && (found = text.match(/裝\s*(\d+)\s*箱貨物/))) return zh("裝 {n} 箱貨物。", { n: found[1] });
  if (game === "sharing" && (found = text.match(/把\s*(\d+)\s*份點心，分給\s*(\d+)\s*位朋友/))) return zh("{snacks} 份給 {friends} 位，全分完、一樣多。", { snacks: found[1], friends: found[2] });
  if (game === "treasure" && (found = text.match(/找出\s*(\d+)\s*個(.+?)[。.]?$/))) return zh("找 {n} 個{item}。", { n: found[1], item: found[2].replace(/[。.]$/, "") });
  if (game === "puzzle" && (found = text.match(/^把(.+)的照片拼回來[。.]?$/))) return zh("拼回{train}的照片。", { train: found[1] });
  if (game === "balance" && (found = text.match(/和\s*(\d+)\s*公斤(?:的貨物)?一樣重/))) return zh("配到和 {n} 公斤一樣重。", { n: found[1] });
  if (game === "mosaic" && (found = text.match(/^照著小樣本，把(.+)的圖形拼出來[。.]?$/))) return zh("照小圖拼{shape}。", { shape: found[1] });
  if (game === "differences" && (found = text.match(/^比較兩幅(.+)圖，找出\s*(\d+)\s*處不同[。.]?$/))) return zh("{scene}：找 {n} 處不同。", { scene: found[1], n: found[2] });
  if (game === "identify") return text.replace(/^找到型號是\s*/, "找型號 ").replace(/^找到/, "找");
  if (game === "tickets" && !/\d/.test(text)) return text.includes("兩張") ? "幫兩張車票付剛好的點數。" : "用代幣付剛好的票價。";
  // Unknown older/newer wording keeps every public fact, including a train
  // name or number. Avoid guessing hidden operands to shorten the title.
  return TARGET_TITLES.has(game) || /\d/.test(text) ? text : fallback;
}

export function learningGuide(q, trip = {}) {
  const game = q?.game;
  if (typeof game !== "string" || !Object.hasOwn(GUIDES, game)) return { ...FALLBACK };
  const guide = { ...GUIDES[game] };
  const prompt = q.prompt;
  guide.title = publicTitle(game, prompt, guide.title);
  if (game === "count") guide.action = q.level === "small" ? "一位數一次，再選點點。" : "一位數一次，再選人數。";
  if (game === "boarding" && ["add", "subtract"].includes(q.operation)) {
    guide.help = q.operation === "subtract" ? "下車會變少，從原本的人數往下減。" : "上車會變多，從原本的人數往上加。";
    guide.success = q.operation === "subtract" ? "下車用減法，人數會減少。" : "上車用加法，人數會增加。";
  }
  if (game === "pattern" && q.kind === "number") {
    guide.title = publicTitle(game, prompt, "下一節是幾號？");
    guide.action = "選下一節的數字。";
    guide.help = "比較相鄰數字，找每次多了多少。";
    guide.success = "前後數字增加同樣的量。";
  }
  if (game === "memory") {
    const open = trip?.memory?.open;
    if (trip?.memoryPeek === true) guide.action = "按「記住了」開始配對。";
    else if (Array.isArray(open) && open.length >= 2) guide.action = "按「再試一組」蓋回卡片。";
    else if (Array.isArray(open) && open.length === 1) guide.action = "再翻一張卡。";
  }
  if (game === "puzzle" && isIndex(trip?.puzzle?.selectedPiece)) guide.action = "點一個空格放進去。";
  if (game === "luggage") {
    const criterion = q.criteria === "color" ? "顏色" : q.criteria === "shape" ? "形狀" : q.criteria === "both" ? "顏色和形狀" : null;
    if (criterion) {
      const basicPrompt = typeof prompt !== "string" || !prompt.trim() || [
        "看看顏色，把行李放進同色的籃子。", "看看形狀，把行李放進同形狀的籃子。", "顏色和形狀都要相同，幫行李找到籃子。",
      ].includes(prompt.trim().replace(/^請/, ""));
      if (basicPrompt) guide.title = q.criteria === "both" ? "同色又同形狀的行李放一起。" : q.criteria === "color" ? "同色的行李放一起。" : "同形狀的行李放一起。";
      guide.help = q.criteria === "both" ? "先比顏色，再比形狀，兩個都要相同。" : zh("看看{criterion}，再跟籃子標示比一比。", { criterion });
      guide.success = zh("按照{criterion}，把行李分好了。", { criterion });
    }
    if (isIndex(trip?.explorer?.luggageSelected)) guide.action = "點想放的籃子。";
  }
  if (game === "program") {
    if (trip?.programRunning === true) guide.action = "想改計畫，先按「停車」。";
    else if (trip?.workshop?.programChecked === true && !trip?.solved) guide.action = "點一個指令刪掉。";
    else if (hasValues(trip?.workshop?.commands)) guide.action = "按「出發」看火車走。";
  }
  if (game === "balance" && hasValues(trip?.workshop?.weights)) guide.action = "按「秤秤看」檢查。";
  if (game === "tickets") {
    if (trip?.tickets?.checked === true && !trip?.solved) guide.action = "點票上的代幣，把它取回。";
    else if (isIndex(trip?.tickets?.activeTicket)) guide.action = "點一枚代幣，放上選好的票。";
  }
  return guide;
}
