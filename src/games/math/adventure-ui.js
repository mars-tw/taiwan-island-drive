// Ported from Taiwan Train Math 1.11.0 (src/adventure-ui.js), Copyright 2026 mars-tw.
// Code: Apache-2.0; original educational text: CC-BY-4.0.
// Changed for the academy: header added, "?v=1.11.0" import cache queries removed, line endings normalised; logic unchanged.
// See public/licenses/taiwan-train-math/NOTICE.txt and docs/r48-math-room-assets.json.
// R50: on-screen text goes through t()/tx() for the Chinese/English switch; the Chinese output is unchanged.
import { railLinks, DIRECTIONS, SOUVENIRS, SOUVENIR_THEMES } from "./adventure.js";
import { t, isEnglish } from "../../shared/i18n.js";
import { tx } from "./room-text.js";
const treasureIcons = {
  star: { icon: "✦", name: "星星" },
  leaf: { icon: "🍃", name: "葉子" },
  shell: { icon: "🐚", name: "貝殼" },
};
const FRIENDS = ["小熊", "小兔", "小貓熊"];
function arrivingTrain(q) {
  const direction = (from, to) =>
    to === from - q.columns
      ? 0
      : to === from + 1
        ? 1
        : to === from + q.columns
          ? 2
          : 3;
  const edges = [
    [0, -50],
    [50, 0],
    [0, 50],
    [-50, 0],
  ];
  let route = "M-15 50 L0 50";
  q.path.forEach((i, at) => {
    const x = (i % q.columns) * 100 + 50,
      y = Math.floor(i / q.columns) * 100 + 50;
    const outgoing =
      at === q.path.length - 1 ? 1 : direction(i, q.path[at + 1]);
    const [dx, dy] = edges[outgoing];
    const exit = `${x + dx - (at === q.path.length - 1 ? 16 : 0)} ${y + dy}`;
    route += q.tiles[i].kind === "curve" ? ` Q${x} ${y} ${exit}` : ` L${exit}`;
  });
  const finishY = Math.floor(q.finish / q.columns) * 100 + 50;
  const train =
    '<rect x="-16" y="-8" width="32" height="16" rx="7" fill="#fffaf0" stroke="#27503b" stroke-width="1.5"/><path d="M-13 5 H9 Q16 5 16 0" fill="none" stroke="#e89b45" stroke-width="3"/><rect x="-7" y="-5" width="12" height="7" rx="2" fill="#396777"/><circle cx="11" cy="-3" r="1.5" fill="#fff0a7"/>';
  return `<svg class="track-vehicle" viewBox="0 0 ${q.columns * 100} ${q.rows * 100}" aria-hidden="true"><g class="rail-arrival-moving"><animateMotion dur="2.4s" repeatCount="1" fill="freeze" rotate="auto" path="${route}"/>${train}</g><g class="rail-arrival-still" transform="translate(${q.columns * 100 - 16} ${finishY})">${train}</g></svg>`;
}
export function railDrawing(kind, rotation, ghost = false) {
  const path = kind === "straight" ? "M50 0 V100" : "M50 0 Q50 50 100 50";
  return `<g transform="rotate(${rotation * 90} 50 50)" ${ghost ? 'class="rail-ghost"' : ""}><path d="${path}" fill="none" stroke="${ghost ? "#cc8b28" : "#536c60"}" stroke-width="20"/><path d="${path}" fill="none" stroke="${ghost ? "#ffe4a3" : "#fff9df"}" stroke-width="12"/><path d="${path}" fill="none" stroke="${ghost ? "#cc8b28" : "#89997d"}" stroke-width="4" ${ghost ? 'stroke-dasharray="5 5"' : ""}/></g>`;
}
export function adventureScene(q, trip) {
  if (q.game === "tracks")
    return `<div class="tracks-stage"><div class="track-signs"><span>🚆 ${t("起點")} →</span><span>${t("終點小站")} 🏠</span></div><div class="rail-puzzle ${trip.solved ? "connected" : ""}" style="--columns:${q.columns}">${q.tiles
      .map(
        (tile, i) =>
          `<button class="rail-tile ${tile.kind === "empty" ? "scenery-tile" : ""} ${i === q.start ? "rail-start" : ""} ${i === q.finish ? "rail-finish" : ""}" data-rotate="${i}" ${tile.kind === "empty" || trip.solved ? "disabled" : ""} aria-label="${giftEsc(
            tile.kind === "empty"
              ? t("第 {n} 格，草地", { n: i + 1 })
              : t(tile.kind === "curve" ? "第 {n} 格，彎軌道，接往{dirs}，點一下轉向" : "第 {n} 格，直軌道，接往{dirs}，點一下轉向", {
                  n: i + 1,
                  dirs: railLinks(
                    tile.kind,
                    trip.rotations[i],
                  )
                    .map((d) => t(DIRECTIONS[d]))
                    .join(isEnglish() ? " and " : "和"),
                }),
          )}">${tile.kind === "empty" ? '<span aria-hidden="true">🌳</span>' : `<svg viewBox="0 0 100 100" aria-hidden="true">${railDrawing(tile.kind, trip.rotations[i])}</svg>`}${i === q.start ? `<i class="track-endpoint" aria-hidden="true">${t("起")}</i>` : i === q.finish ? `<i class="track-endpoint" aria-hidden="true">${t("站")}</i>` : ""}</button>`,
      )
      .join(
        "",
      )}${trip.solved ? arrivingTrain(q) : ""}</div>${trip.solved ? `<div class="track-arrival"><span aria-hidden="true">🚄</span><strong>${t("路接通了，列車到站！")}</strong></div>` : `<p class="track-instruction">${t("每點一下，軌道轉四分之一圈。從「起」跟著走到「站」。")}</p>`}<div class="adventure-actions"><button class="text-btn" id="tracks-reset" ${trip.solved ? "disabled" : ""}>${t("重新鋪一次")}</button><button class="primary-btn" id="tracks-submit" ${trip.solved ? "disabled" : ""}>${t("讓列車出發 →")}</button></div></div>`;
  if (q.game === "sharing") {
    const left = q.total - trip.shares.reduce((a, b) => a + b, 0);
    return `<div class="sharing-stage"><div class="picnic-basket"><span class="stage-label">${t("列車點心籃 · 還有 {n} 份", { n: left })}</span><div>${Array.from({ length: left }, () => `<span aria-hidden="true">${q.food}</span>`).join("") || `<strong>${t("點心都分好了，看看每位是否一樣多。")}</strong>`}</div></div><div class="picnic-friends" style="--friends:${q.friends}">${trip.shares.map((n, i) => `<div class="picnic-friend"><span class="friend-face" aria-hidden="true">${["🐻", "🐰", "🐼"][i]}</span><strong>${t("{name} · {n} 份", { name: t(FRIENDS[i]), n })}</strong><div class="picnic-plate">${Array.from({ length: n }, (_, j) => `<button data-return-snack="${i}" ${trip.solved ? "disabled" : ""} aria-label="${giftEsc(t("從{name}搬回第 {n} 份點心", { name: t(FRIENDS[i]), n: j + 1 }))}">${q.food}</button>`).join("") || `<span>${t("小盤子")}</span>`}</div><button class="secondary-btn" data-share="${i}" ${left === 0 || trip.solved ? "disabled" : ""}>${t("給{name} 1 份", { name: t(FRIENDS[i]) })}</button></div>`).join("")}</div><div class="adventure-actions"><button id="sharing-reset" class="text-btn" ${trip.solved ? "disabled" : ""}>${t("全部放回籃子")}</button><button id="sharing-submit" class="primary-btn" ${trip.solved || left > 0 ? "disabled" : ""}>${t("大家一樣多了 ✓")}</button></div></div>`;
  }
  if (q.game === "treasure") {
    const found = trip.found.size;
    return `<div class="treasure-stage"><div class="treasure-toolbar"><span>${t("尋找 {item}", { item: `<b>${treasureIcons[q.target].icon} ${t(treasureIcons[q.target].name)}</b>` })}</span><strong>${t("已找到 {found} / {total}", { found, total: q.answer })}</strong></div><div class="treasure-landscape ${trip.solved ? "treasure-complete" : ""}" style="--treasure-columns:${q.items.length === 9 ? 3 : 4}"><img src="assets/images/railway-world-v2.webp" alt="${giftEsc(t("想像鐵道樂園尋寶風景"))}" width="1672" height="941" loading="lazy"><div class="treasure-items">${q.items.map((kind, i) => `<button class="treasure-item kind-${kind} ${trip.found.has(i) ? "found" : ""} " data-find="${i}" ${trip.solved || trip.found.has(i) ? "disabled" : ""} aria-label="${giftEsc(t(trip.found.has(i) ? "第 {n} 個，{name}，已找到" : "第 {n} 個，{name}", { n: i + 1, name: t(treasureIcons[kind].name, { n: 1 }) }))}"><span aria-hidden="true">${treasureIcons[kind].icon}</span>${trip.found.has(i) ? '<i aria-hidden="true">✓</i>' : ""}</button>`).join("")}</div>${trip.solved ? `<div class="treasure-message"><span aria-hidden="true">✉ ✦</span><strong>${t("寶物都找到了！")}</strong></div>` : ""}</div><p class="treasure-help">${t("找到的會留下亮亮記號，慢慢找就好。")}</p></div>`;
  }
  return "";
}
const giftEsc = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]);
const giftPlayHelp = {
  signal: "點一下，讓小燈變個顏色。",
  wind: "點一下，吹一陣小小的風。",
  stamp: "點一下，蓋上你的旅程印章。",
  glow: "點一下，把小禮物點亮。",
  bounce: "點一下，讓小禮物跳跳。",
};
const giftShapes = {
  "star-letter": '<rect x="20" y="28" width="80" height="49" rx="6" fill="#fff4d5"/><path d="m21 31 39 28 39-28M22 74l27-24m49 24L72 50"/><path d="m60 36 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" fill="#f1bd4f"/>',
  lighthouse: '<path class="gift-glow" d="M61 31 16 12v36l45-12m0-5 44-19v36L61 36" fill="#f6d677" stroke="none"/><path d="m45 79 6-43h19l6 43Z" fill="#fff4d5"/><path d="M49 60h23v11H47Z" fill="#d9674c"/><path d="M48 36h25V22H48Z" fill="#f6d677"/><path d="m44 22 16-11 17 11Z" fill="#d9674c"/><path d="M37 80h47M58 80V68h7v12"/>',
  "forest-leaf": '<path d="M31 73C18 44 47 24 91 20c-1 44-21 66-48 57Z" fill="#7aab73"/><path d="M27 84 81 31M44 65l-5-20m19 6 20 1m-9-14-1-11"/>',
  cloud: '<path d="M28 74c-23-2-24-29-2-34 2-26 32-30 43-9 24-8 38 16 27 29 15 13 2 21-9 20Z" fill="#dceff4"/><path d="M37 56h1m24 0h1" stroke-width="5" stroke-linecap="round"/><path d="M43 66q9 8 17 0"/>',
  ticket: '<path d="M18 30h84v13c-10 0-10 14 0 14v17H18V57c10 0 10-14 0-14Z" fill="#f6d677"/><path d="M79 30v44" stroke-dasharray="3 4"/><path d="M32 43h34m-34 9h24m-24 10h30"/>',
  apple: '<path d="M61 35C30 12 10 47 28 72c10 18 25 13 34 9 10 4 27 8 37-12 12-28-8-54-38-34Z" fill="#da725d"/><path d="M61 34q-6-13 1-21"/><path d="M63 26c15-20 29-10 27-4-7 9-20 9-27 4Z" fill="#88ad69"/><path d="M33 43q-8 10-4 19" stroke="#fff3ce" stroke-width="5" stroke-linecap="round"/>',
  mountain: '<circle cx="60" cy="49" r="36" fill="#cde5c8"/><path d="m25 69 23-39 12 20 12-30 25 49Z" fill="#73a186"/><path d="m42 42 6-12 7 13-6-3Zm24-6 6-16 10 18-10-5Z" fill="#fff4d5"/><path d="m42 81-4 13 22-7 22 7-4-13" fill="#e8bc5f"/>',
  bird: '<path d="m33 59-18 10 19 7" fill="#e9b358"/><ellipse cx="61" cy="55" rx="29" ry="24" fill="#82b6b4"/><path d="M60 51q-29-9-18 13 9 9 20 0" fill="#f6d677"/><path d="m87 51 15 7-17 7" fill="#e9b358"/><circle cx="75" cy="48" r="3" fill="#2b5148"/><path d="M53 78v8m13-8v8"/>',
  clock: '<circle cx="60" cy="48" r="34" fill="#ebc069"/><circle cx="60" cy="48" r="27" fill="#fff4d5"/><path d="M60 25v5m23 18h-5m-18 23v-5m-23-18h5"/><g class="gift-rotor"><path d="M60 48V33m0 15 12 8" stroke-width="4" stroke-linecap="round"/></g><path d="M43 79v8m34-8v8" stroke-width="6"/>',
  rainbow: '<path d="M17 75a43 43 0 0 1 86 0" stroke="#dc7b66" stroke-width="9"/><path d="M26 75a34 34 0 0 1 68 0" stroke="#f1bf59" stroke-width="9"/><path d="M35 75a25 25 0 0 1 50 0" stroke="#85b387" stroke-width="9"/><path d="M44 75a16 16 0 0 1 32 0" stroke="#7dabc2" stroke-width="9"/><path d="M9 76h25m52 0h25" stroke="#fff4d5" stroke-width="12" stroke-linecap="round"/>',
  shell: '<path d="M60 78C16 73 13 37 29 32c3-17 19-17 26-8 12-17 25-11 30 4 26 0 22 39-25 50Z" fill="#f1c3a6"/><path d="M60 77 29 35m31 42L47 28m13 49 2-51m-2 51 22-43m-30 48h18"/>',
  spark: '<path d="m60 13 12 23 27 4-20 20 5 27-24-13-25 13 5-27-20-20 28-4Z" fill="#f3c75c"/><circle cx="53" cy="50" r="2" fill="#2b5148"/><circle cx="67" cy="50" r="2" fill="#2b5148"/><path d="M54 61q6 5 12 0"/>',
  signal: '<path d="M60 69v19M44 89h32" stroke-width="7"/><rect x="40" y="10" width="40" height="65" rx="14" fill="#446e68"/><circle class="gift-signal-red" cx="60" cy="28" r="10" fill="#dc785f"/><circle class="gift-signal-green" cx="60" cy="56" r="10" fill="#8caba1"/>',
  "station-sign": '<path d="M29 69v18m62-18v18" stroke-width="6"/><rect x="13" y="24" width="94" height="45" rx="7" fill="#fff4d5"/><rect x="20" y="31" width="80" height="31" rx="4" fill="#86b8b3"/><path d="M30 46h49m-9-9 10 9-10 9" stroke="#fff4d5" stroke-width="4"/>',
  whistle: '<path d="M26 44h45V31h29v18H79c-3 30-50 39-53 9Z" fill="#e8bf63"/><circle cx="49" cy="54" r="13" fill="#fff4d5"/><path d="M26 46c-22-13-26 18-8 19"/><path d="m87 16 3-8m11 12 8-3" stroke-width="3"/>',
  "train-toy": '<path d="M19 58h74v17H19Z" fill="#d97857"/><rect x="53" y="25" width="33" height="38" rx="5" fill="#89b8b1"/><rect x="61" y="32" width="16" height="16" rx="2" fill="#fff4d5"/><path d="M24 58V39h29v19m-22-20V23h10v16" fill="#e7bd60"/><circle cx="36" cy="75" r="9" fill="#446e68"/><circle cx="76" cy="75" r="9" fill="#446e68"/><path d="M16 85h84"/>',
  "wooden-carriage": '<rect x="18" y="26" width="83" height="45" rx="7" fill="#d9a976"/><path d="M16 28h88" stroke-width="5"/><rect x="26" y="35" width="18" height="19" rx="3" fill="#cce5e5"/><rect x="51" y="35" width="18" height="19" rx="3" fill="#cce5e5"/><rect x="76" y="35" width="17" height="19" rx="3" fill="#cce5e5"/><circle cx="36" cy="76" r="9" fill="#446e68"/><circle cx="84" cy="76" r="9" fill="#446e68"/><path d="M24 63h69"/>',
  windmill: '<path d="M60 43v48" stroke="#b88c5f" stroke-width="7"/><g class="gift-rotor"><path d="M60 43V9L34 26Z" fill="#e6a76c"/><path d="M60 43h34L77 17Z" fill="#8dbcb5"/><path d="M60 43v34l26-17Z" fill="#e6ce72"/><path d="M60 43H26l17 26Z" fill="#d38a80"/><circle cx="60" cy="43" r="5" fill="#fff4d5"/></g>',
  "spinning-top": '<path d="M56 31V14h8v17" fill="#e6b559"/><path d="m24 53 36-27 36 27-36 34Z" fill="#dd8266"/><path d="m24 53 36 13 36-13M36 44l24 9 24-9"/><path d="M60 87v8" stroke-width="5"/><path d="m17 35-7 14m91-3 9-12" stroke="#91b8b0"/>',
  "toy-bridge": '<path d="M16 47h88v13H16Z" fill="#d2a46c"/><path d="M20 60v25h16V73a24 24 0 0 1 48 0v12h16V60Z" fill="#87b5ad"/><path d="M20 28v19m16-19v19m16-19v19m16-19v19m16-19v19m16-19v19M20 28h80"/><path d="M39 88h43" stroke="#8fbac8" stroke-width="5" stroke-linecap="round"/>',
  "mini-track": '<path d="m22 71 15-15 37 14-15 15Zm10-22 15-15 37 14-15 15Zm10-22 15-15 37 14-15 15Z" fill="#cba776"/><path d="m33 81 34-61m-7 73 35-61" stroke="#628781" stroke-width="7" stroke-linecap="round"/>',
  pinecone: '<path d="M60 14c-26 19-41 54-17 67 19 13 42 1 42-18 0-17-13-37-25-49Z" fill="#c28f62"/><path d="m38 43 22 10 19-9m-42 16 22 10 24-11M49 29l12 9 8-8m-26 45 17 8 17-7" stroke="#795f4b"/>',
  "forest-flower": '<path d="M59 55v34" stroke="#82a36b" stroke-width="5"/><path d="M58 77c-14-23-31-13-18-4Z" fill="#82a36b"/><g class="gift-sway"><ellipse cx="60" cy="29" rx="12" ry="18" fill="#f0c763"/><ellipse cx="38" cy="47" rx="18" ry="12" fill="#f0c763"/><ellipse cx="81" cy="47" rx="18" ry="12" fill="#f0c763"/><ellipse cx="60" cy="62" rx="12" ry="18" fill="#f0c763"/><circle cx="60" cy="47" r="13" fill="#d98962"/></g>',
  acorn: '<path d="M38 44h44c4 30-10 45-22 45S34 72 38 44Z" fill="#c99b68"/><path d="M30 43q0-27 30-27t30 27Z" fill="#a77a50"/><path d="M59 16q1-9 10-12M38 32l5 6 8-11 8 11 8-11 8 11 8-6"/>',
  "sea-glass": '<path d="M51 17 83 26l18 28-20 31-39-3L24 50Z" fill="#9ed2c4"/><path d="m51 17-9 65m41-56-41 56m59-28-77-4" stroke="#dff5e6" stroke-width="4"/>',
  crab: '<ellipse cx="60" cy="58" rx="28" ry="19" fill="#df8b69"/><path d="m35 53-15-15m65 15 15-15m-64 25L19 78m23-12L30 85m55-22 17 15M78 66l12 19"/><path d="m20 38-10-14 1-14 13 13 10-11 3 20Zm80 0 10-14-1-14-13 13-10-11-3 20Z" fill="#df8b69"/><path d="M51 42v-7m18 7v-7" stroke-width="4"/><circle cx="51" cy="33" r="4" fill="#2b5148"/><circle cx="69" cy="33" r="4" fill="#2b5148"/>',
  sailboat: '<path d="m20 67 19 18h41l20-18Z" fill="#d8a36f"/><path d="M60 15v52" stroke-width="3"/><path d="M54 22 26 60h28Z" fill="#fff4d5"/><path class="gift-sway" d="m65 21 28 39H65Z" fill="#e7bf62"/><path d="M27 89q12 8 24 0t24 0 22 0" stroke="#7eb2c0" stroke-width="4"/>',
  pebble: '<path d="M25 55C29 24 75 19 93 45c19 28-13 41-40 35-24 9-43-7-28-25Z" fill="#b9bfb0"/><path d="M39 42c11-7 27-4 35 3m-41 15q22 15 42 4" stroke="#e6e5d5" stroke-width="5" stroke-linecap="round"/>',
  moon: '<path d="M78 17a35 35 0 1 0 22 54c-33 11-55-21-22-54Z" fill="#f0cc70"/><path d="m86 33 4 8 9 1-7 6 2 9-8-4-8 4 2-9-7-6 9-1Z" fill="#fff4d5"/>',
  balloon: '<path d="M60 67q-13 12 0 23"/><ellipse cx="60" cy="39" rx="26" ry="31" fill="#d88d79"/><path d="m55 69 5-8 5 8Z" fill="#d88d79"/><path d="M46 24q-8 10-5 22" stroke="#fff4d5" stroke-width="5" stroke-linecap="round"/>',
  kite: '<path d="m60 9 30 29-30 38-30-38Z" fill="#edbf64"/><path d="m60 9 30 29H60Z" fill="#80b4b1"/><path d="m60 76-30-38h30Z" fill="#df8c73"/><path d="M60 9v67M30 38h60m-30 38q25 12 5 20"/><path d="m68 82-6 5 10 3m-4 2 6 5-10 2" fill="#80b4b1"/>',
  riceball: '<path d="M45 19c6-10 25-10 31 1l26 48c5 11-1 17-12 17H29c-13 0-16-10-9-19Z" fill="#fff4d5"/><rect x="46" y="57" width="28" height="29" rx="4" fill="#507969"/><path d="m43 39 2 1m13-8 2 1m14 11 2 1m-44 19 2 1" stroke="#c1bb9d" stroke-width="3"/>',
  milk: '<path d="M43 20h34v17l10 15v36H33V52l10-15Z" fill="#fff4d5"/><rect x="42" y="13" width="36" height="10" rx="3" fill="#85b6b2"/><path d="M34 60h52v17H34Z" fill="#b1d6d5"/><path d="M44 33h32"/><circle cx="60" cy="68" r="7" fill="#fff4d5"/>',
  pudding: '<ellipse cx="60" cy="81" rx="43" ry="9" fill="#d6e6d7"/><path d="m36 36-8 42q32 14 64 0l-8-42Z" fill="#f2cf75"/><ellipse cx="60" cy="36" rx="24" ry="9" fill="#b77f55"/><path d="M40 38v11q6 7 11-1v-8m19 0v16q6 5 9-1V40" fill="#b77f55"/><circle cx="60" cy="25" r="7" fill="#d67b64"/>',
  biscuit: '<circle cx="60" cy="49" r="35" fill="#d8ac70"/><circle cx="60" cy="49" r="26" stroke="#b48355" stroke-dasharray="2 5"/><circle cx="60" cy="49" r="8" fill="#fff4d5"/><path d="m45 31 4 3m24 0-4 3m-31 20 5-2m37-1-5-1m-22 21 2-4" stroke="#895f45" stroke-width="4" stroke-linecap="round"/>',
  berry: '<path d="M34 34c-21 10 10 55 26 57 19-5 48-46 25-58Z" fill="#d87865"/><path d="m60 37-22-17 20 4 8-15 4 15 19-5-15 20Z" fill="#88aa69"/><path d="m40 45 2 4m19-2 1 4m19-7-2 4m-32 13 2 4m22-2-2 4m-8 8v4" stroke="#fff2c8" stroke-width="3" stroke-linecap="round"/>',
};
function souvenirArt(item) {
  const shape = giftShapes[item.id] || giftShapes.spark;
  const wind = item.playKind === "wind" && !shape.includes("gift-rotor") && !shape.includes("gift-sway") ? " gift-sway" : "";
  return `<div class="gift-visual theme-${giftEsc(item.theme)}" aria-hidden="true"><svg class="gift-svg" viewBox="0 0 120 100" focusable="false"><ellipse class="gift-halo gift-glow" cx="60" cy="52" rx="48" ry="42" fill="#f7d965"/><ellipse class="gift-shadow" cx="60" cy="91" rx="33" ry="4" fill="#2b5148" opacity=".12"/><g class="gift-object${wind}" stroke="#2b5148" stroke-width="2.5" stroke-linejoin="round" fill="none">${shape}</g><g class="gift-stamp-mark" transform="translate(86 26) rotate(-15)"><circle r="18" fill="#fff4d5" stroke="#c36e4a" stroke-width="3"/><text y="5" text-anchor="middle" fill="#a64e31" font-size="16" font-weight="700">${t("旅")}</text></g></svg></div>`;
}
export function giftDetailMarkup(item, { esc = giftEsc, titleId = "gift-detail-title" } = {}) {
  if (!item) return "";
  const theme = SOUVENIR_THEMES.find((entry) => entry.id === item.theme);
  return `<div class="gift-detail gift-widget theme-${esc(item.theme)}" data-gift-widget="${esc(item.id)}" data-play-kind="${esc(item.playKind)}">${souvenirArt(item)}<span class="gift-theme-label">${esc(tx(theme?.name || "旅途小禮物"))}</span><h2 id="${esc(titleId)}">${esc(tx(item.name))}</h2><p class="gift-story">${esc(tx(item.story))}</p><button type="button" class="secondary-btn gift-play-button" data-play-gift="${esc(item.id)}">${t("玩玩小禮物")}</button><p class="gift-play-feedback" data-gift-feedback role="status" aria-live="polite">${t(giftPlayHelp[item.playKind] || "點一下，和小禮物玩一會兒。")}</p></div>`;
}
export function souvenirMarkup(trip, { esc = giftEsc } = {}) {
  if (trip.gift)
    return `<div class="souvenir-envelope gift-opened"><span class="gift-collected-note">${t("已放進你的鐵道護照 ✓")}</span>${giftDetailMarkup(trip.gift, { esc, titleId: "trip-gift-title" })}<a href="#stamps" class="text-link">${t("打開旅途收藏冊 →")}</a></div>`;
  if (trip.giftChoices?.length) {
    const choices = trip.giftChoices.slice(0, 3);
    return `<div class="souvenir-envelope gift-choice-envelope"><span class="gift-envelope-label">${t("這趟旅程的小發現")}</span><h2>${t("挑一份，帶回收藏冊")}</h2><p>${t("選好小禮物後，還可以點一下玩玩看。")}</p><div class="gift-choices">${choices.map((item) => {
      const theme = SOUVENIR_THEMES.find((entry) => entry.id === item.theme);
      return `<button type="button" class="souvenir-choice theme-${esc(item.theme)}" data-gift-choice="${esc(item.id)}" aria-label="${esc(t("收藏{name}", { name: tx(item.name) }))}">${souvenirArt(item)}<span class="gift-theme-label">${esc(tx(theme?.name || "旅途小禮物"))}</span><strong>${esc(tx(item.name))}</strong><span class="gift-choice-story">${esc(tx(item.story))}</span><span class="gift-choice-action">${t("收藏這份 →")}</span></button>`;
    }).join("")}</div><small>${t("每趟任選一份；所有列車和遊戲都能直接玩。")}</small></div>`;
  }
  return `<div class="souvenir-envelope gift-ready"><svg class="gift-envelope-art" viewBox="0 0 120 90" aria-hidden="true" focusable="false"><rect x="12" y="20" width="96" height="60" rx="8" fill="#fff7dc" stroke="#537b70" stroke-width="3"/><path d="m14 24 46 31 46-31m-92 52 31-29m59 29-30-29" fill="none" stroke="#537b70" stroke-width="3"/><circle cx="60" cy="51" r="13" fill="#df995b"/><path d="m60 41 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" fill="#fff7dc"/></svg><h2>${t("旅途的小禮物，到了！")}</h2><p>${t("打開信封，挑一份喜歡的小發現。")}</p><button id="gift-open" class="primary-btn">${t("打開紀念信封 →")}</button><small>${t("每趟任選一份；所有列車和遊戲都能直接玩。")}</small></div>`;
}
export function souvenirCollection(progress, { esc = giftEsc } = {}) {
  const collected = new Set(progress?.souvenirs || []);
  const count = SOUVENIRS.filter((item) => collected.has(item.id)).length;
  return `<section class="souvenir-collection souvenir-book" aria-labelledby="souvenir-title"><div class="souvenir-book-heading"><div><span class="gift-envelope-label">${t("把小發現，收成一本書")}</span><h2 id="souvenir-title">${t("旅途收藏冊")}</h2></div><div class="souvenir-total"><strong>${count} / ${SOUVENIRS.length}</strong><span>${t("已收藏")}</span></div></div><p>${t("收齊一頁，就多一枚套組小印章。已收藏的小禮物，隨時可以點開玩。")}</p>${count ? "" : `<p class="souvenir-empty-note">${t("完成一趟旅程，打開信封，挑你的第一份小禮物吧。")}</p>`}<div class="souvenir-theme-pages">${SOUVENIR_THEMES.map((theme) => {
    const items = SOUVENIRS.filter((item) => item.theme === theme.id);
    const owned = items.filter((item) => collected.has(item.id)).length;
    return `<section class="souvenir-theme-page theme-${esc(theme.id)}" aria-labelledby="souvenir-theme-${esc(theme.id)}"><div class="souvenir-theme-heading"><span class="souvenir-theme-icon" aria-hidden="true">${theme.icon}</span><div><h3 id="souvenir-theme-${esc(theme.id)}">${esc(tx(theme.name))}</h3><p>${esc(tx(theme.description))}</p></div></div><div class="souvenir-theme-progress"><progress value="${owned}" max="${items.length}" aria-label="${esc(t("{theme}已收藏 {owned} 款，共 {total} 款", { theme: tx(theme.name), owned, total: items.length }))}"></progress><span>${owned} / ${items.length}</span></div><div class="souvenir-grid souvenir-theme-grid">${items.map((item, index) => collected.has(item.id)
      ? `<button type="button" class="souvenir-slot gift-owned" data-inspect-gift="${esc(item.id)}" aria-label="${esc(t("打開{name}，已收藏", { name: tx(item.name) }))}">${souvenirArt(item)}<strong>${esc(tx(item.name))}</strong><span class="souvenir-slot-note">${t("點開玩玩")}</span></button>`
      : `<div class="souvenir-slot gift-locked" aria-label="${esc(t("{theme}第 {n} 格，還沒收藏", { theme: tx(theme.name), n: index + 1 }))}"><div class="gift-silhouette">${souvenirArt(item)}</div><strong>${t("還沒遇見")}</strong><span class="souvenir-slot-note">${t("旅途中找找看")}</span></div>`).join("")}</div>${owned === items.length ? `<div class="souvenir-set-stamp" role="status"><span aria-hidden="true">✦</span> ${t("全套收藏")} <span aria-hidden="true">✓</span></div>` : `<p class="souvenir-page-note">${t("這一頁還有 {n} 份小發現。", { n: items.length - owned })}</p>`}</section>`;
  }).join("")}</div></section>`;
}
