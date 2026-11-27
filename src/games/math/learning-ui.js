// Ported from Taiwan Train Math 1.11.0 (src/learning-ui.js), Copyright 2026 mars-tw.
// Code: Apache-2.0; original educational text: CC-BY-4.0.
// Changed for the academy: header added, line endings normalised; logic unchanged.
// See public/licenses/taiwan-train-math/NOTICE.txt and docs/r48-math-room-assets.json.
// R50: on-screen text goes through t()/tx() for the Chinese/English switch; the Chinese output is unchanged.
import { t } from "../../shared/i18n.js";
import { tx } from "./room-text.js";
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

// Marks help a child avoid counting twice; they never count aloud for them.
export function countingScene(q, { counted = new Set(), solved = false } = {}, { person = () => '<span aria-hidden="true">●</span>' } = {}) {
  if (!Number.isInteger(q?.count) || q.count < 0 || q.count > 20) return "";
  const marks = counted instanceof Set ? counted : new Set();
  const passengers = q.count === 0
    ? `<div class="no-passengers">${t("月台還沒有人")} <span aria-hidden="true">○</span></div>`
    : `<div class="passengers ${q.count > 10 ? "many" : ""}">${Array.from({ length: q.count }, (_, index) => {
      const marked = marks.has(index);
      return `<button type="button" class="person ${marked ? "counted" : ""}" data-count="${index}" aria-label="${escapeHtml(t(marked ? "乘客，已數過" : "乘客，點一下作記號"))}" aria-pressed="${marked}" ${solved ? "disabled" : ""}>${person(index, marked)}<span aria-hidden="true">${marked ? "✓" : ""}</span></button>`;
    }).join("")}</div>`;
  return `<div class="stage-label">${t("一位乘客，數一次")}</div>${passengers}<div class="count-status">${solved ? t("月台一共有 {n} 位乘客。", { n: q.count }) : t("點過會留下 ✓，請你自己數，再選答案。")}</div>`;
}

export function discoveryMarkup(card, { esc = escapeHtml, native = false } = {}) {
  if (!card || typeof card.text !== "string" || !card.text) return "";
  const kind = ["train", "place"].includes(card.kind) ? card.kind : "general";
  const icon = kind === "train" ? "🚆" : kind === "place" ? "🌿" : "💡";
  const label = t(kind === "place" ? "認識真實臺灣" : kind === "train" ? "認識真實列車" : "旅途小發現");
  const sources = Array.isArray(card.sources) ? card.sources.filter(source => /^https:\/\//.test(source?.url || "") && typeof source.title === "string") : [];
  return `<aside class="learning-discovery" aria-label="${escapeHtml(label)}"><span class="learning-discovery-icon" aria-hidden="true">${icon}</span><div><small>${escapeHtml(label)}${card.place?.region ? ` · ${esc(tx(card.place.region))}` : ""}</small><p class="learning-discovery-text">${esc(tx(card.text))}</p>${!native && sources.length ? `<details class="learning-sources"><summary>${t("家長看來源")}</summary>${sources.map(source => `<a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.title)} ↗</a>`).join("")}</details>` : ""}</div><button type="button" id="learning-read" class="icon-btn" aria-label="${escapeHtml(t("聽這個小發現"))}">🔊</button></aside>`;
}
