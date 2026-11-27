// Ported from Taiwan Train Math 1.11.0 (src/activities.js), Copyright 2026 mars-tw.
// Code: Apache-2.0; original educational text: CC-BY-4.0.
// Changed for the academy: header added, "?v=1.11.0" import cache queries removed, line endings normalised; logic unchanged.
// See public/licenses/taiwan-train-math/NOTICE.txt and docs/r48-math-room-assets.json.
// R50: on-screen text goes through t()/tx() for the Chinese/English switch; the Chinese output is unchanged.
import { SHAPES, clockLabel } from "./engine.js";
import { t } from "../../shared/i18n.js";
import { tx } from "./room-text.js";

const escapeText = value => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

export function patternToken(q, value) {
  return q.kind === "number"
    ? `<span class="pattern-number">${value}</span>`
    : `<span class="pattern-shape shape-${value}" aria-label="${escapeText(tx(SHAPES[value].name))}">${SHAPES[value].symbol}</span>`;
}
export function patternName(q, value) {
  return q.kind === "number" ? t("數字 {n}", { n: value }) : tx(SHAPES[value].name);
}
function boxes(n, interactive, solved = false) {
  return `<div class="cargo-boxes">${Array.from({ length: n }, (_, i) => (interactive ? `<button class="cargo-box" data-unload="${i}" aria-label="${escapeText(t("搬回第 {n} 箱", { n: i + 1 }))}" ${solved ? "disabled" : ""}><span aria-hidden="true">▣</span><small>${i + 1}</small></button>` : '<span class="cargo-box target-box" aria-hidden="true">▣</span>')).join("")}</div>`;
}
export function clockFace(q) {
  const ticks = Array.from(
    { length: 60 },
    (_, i) =>
      `<line x1="100" y1="${i % 5 ? 17 : 13}" x2="100" y2="${i % 5 ? 20 : 21}" transform="rotate(${i * 6} 100 100)" stroke="${i % 5 ? "#bdc8c0" : "#45655e"}" stroke-width="${i % 5 ? 1 : 2}"/>`,
  ).join("");
  const numbers = Array.from({ length: 12 }, (_, i) => {
    const n = i + 1,
      angle = (n * Math.PI) / 6;
    return `<text x="${100 + Math.sin(angle) * 64}" y="${105 - Math.cos(angle) * 64}" text-anchor="middle">${n}</text>`;
  }).join("");
  return `<svg class="station-clock" viewBox="0 0 200 200" role="img" aria-label="${escapeText(q.minute ? t("車站類比時鐘：短時針在 {a} 與 {b} 之間，長分針指向 {m}", { a: q.hour, b: q.hour === 12 ? 1 : q.hour + 1, m: 6 }) : t("車站類比時鐘：短時針在 {h}，長分針指向 {m}", { h: q.hour, m: 12 }))}"><circle cx="100" cy="100" r="96" fill="#fffdf5" stroke="#36564c" stroke-width="7"/>${ticks}${numbers}<line class="hour-hand" x1="100" y1="100" x2="100" y2="58" transform="rotate(${(q.hour % 12) * 30 + q.minute / 2} 100 100)" stroke="#285c51" stroke-width="9" stroke-linecap="round"/><line class="minute-hand" x1="100" y1="100" x2="100" y2="36" transform="rotate(${q.minute * 6} 100 100)" stroke="#b14b26" stroke-width="5" stroke-linecap="round"/><circle cx="100" cy="100" r="7" fill="#285c51"/></svg>`;
}
export function activityScene(q, trip, { byId, image, esc }) {
  if (q.game === "pattern")
    return `<div class="pattern-stage"><span class="stage-label">${t(q.kind === "number" ? "看看相鄰車廂，每次多了多少？" : "形狀和顏色一起看，找出重複的一組")}</span><div class="pattern-track"><span class="pattern-engine" aria-hidden="true">🚂</span>${q.sequence.map((value, i) => `<div class="pattern-carriage" aria-label="${escapeText(t("第 {n} 節，{name}", { n: i + 1, name: patternName(q, value) }))}">${patternToken(q, value)}</div>`).join("")}<div class="pattern-carriage missing" aria-label="${escapeText(t("下一節待填車廂"))}">${trip.solved ? patternToken(q, q.answer) : "?"}</div></div></div>`;
  if (q.game === "cargo")
    return `<div class="cargo-stage"><div class="cargo-order"><span class="stage-label">${t("貨運委託單")}</span><strong>${t("需要 {n} 箱", { n: `<b>${q.answer}</b>` })}</strong>${q.level === "small" ? boxes(q.answer, false) : `<small>${t("每箱算一個，裝到剛剛好。")}</small>`}</div><div class="cargo-wagon"><span class="stage-label">${t("貨運車廂 · 點貨物可以搬回來")}</span>${trip.cargo ? boxes(trip.cargo, true, trip.solved) : `<p class="cargo-empty">${t("車廂還是空的，放一箱試試看。")}</p>`}<div class="cargo-counter">${t("已裝 {n} 箱", { n: `<strong>${trip.cargo}</strong>` })}</div></div><div class="cargo-actions"><button class="secondary-btn" data-load="1" ${trip.solved || trip.cargo >= q.max ? "disabled" : ""}>${t("＋ 放 1 箱")}</button>${q.level === "large" ? `<button class="secondary-btn" data-load="5" ${trip.solved || trip.cargo + 5 > q.max ? "disabled" : ""}>${t("＋ 放 5 箱")}</button>` : ""}<button class="text-btn" id="cargo-reset" ${trip.solved || !trip.cargo ? "disabled" : ""}>${t("全部搬回")}</button><button class="primary-btn" id="cargo-submit" ${trip.solved ? "disabled" : ""}>${t("裝好了 ✓")}</button></div></div>`;
  if (q.game === "memory")
    return `<div class="memory-stage"><div class="memory-status">${t("找到 {found} / {total} 對", { found: trip.memory.matched.length / 2, total: q.pairs.length })} · ${t(trip.memoryPeek ? "一起看看，按「記住了」再配對" : "點兩張卡看看")}</div><div class="memory-grid pairs-${q.pairs.length}">${q.deck
      .map((id, i) => {
        const matched = trip.memory.matched.includes(i),
          shown = matched || trip.memory.open.includes(i) || trip.memoryPeek,
          train = byId(id);
        return `<button class="memory-card ${shown ? "revealed" : ""} ${matched ? "matched" : ""}" data-memory="${i}" ${trip.solved || matched || trip.memoryPeek || trip.memory.open.includes(i) || trip.memory.open.length === 2 ? "disabled" : ""} aria-label="${esc(shown ? t(matched ? "第 {n} 張，{name}，已配對" : "第 {n} 張，{name}", { n: i + 1, name: tx(train.cardLabel) }) : t("第 {n} 張，翻開列車卡", { n: i + 1 }))}">${shown ? `${image(train)}<strong>${esc(tx(train.name))}</strong><small>${esc(tx(train.model))}</small>${matched ? '<span class="memory-check" aria-hidden="true">✓</span>' : ""}` : `<span class="memory-back" aria-hidden="true">🚆</span><small>${t("第 {n} 張", { n: i + 1 })}</small>`}</button>`;
      })
      .join(
        "",
      )}</div>${trip.memoryPeek ? `<button id="memory-hide" class="secondary-btn">${t("記住了，開始配對 →")}</button>` : trip.memory.open.length === 2 ? `<p>${t("這兩張不一樣，慢慢記住它們的位置。")}</p><button id="memory-hide" class="secondary-btn">${t("再試一組 ↺")}</button>` : `<p class="memory-help">${t("相同的兩張會留在車庫，沒有時間限制。")}</p>`}</div>`;
  if (q.game === "clock")
    return `<div class="clock-stage"><span class="stage-label">${t("看短時針，再看長分針")}</span>${clockFace(q)}<div class="clock-key"><span><i class="hand-key hour"></i>${t("短短的：時針")}</span><span><i class="hand-key minute"></i>${t("長長的：分針")}</span></div>${trip.solved ? `<strong class="clock-result">${t("列車在 {time} 出發", { time: tx(clockLabel(q.answer)) })}</strong>` : ""}</div>`;
  return "";
}
