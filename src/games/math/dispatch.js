// Ported unchanged from Taiwan Train Math, Copyright 2026 mars-tw.
// Code: Apache-2.0; original educational text: CC-BY-4.0.
// See public/licenses/taiwan-train-math/NOTICE.txt and docs/merge-assets.json.
// Quantity conservation is the lesson: moving between carriages never creates passengers.
const integer = (value, max) => Number.isSafeInteger(value) && value >= 0 && value <= max;
export function dispatchLesson(level = "small", completed = 0) {
  const cycle = integer(completed, 9999) ? completed : 0;
  const totals = level === "large" ? [12, 14, 11, 13] : level === "medium" ? [8, 10, 7, 9] : [5, 4, 3, 5];
  const total = totals[cycle % totals.length];
  const rear = 1 + cycle % Math.min(4, total - 1);
  return { total, rear, front: total - rear, capacity: total > 10 ? 20 : total > 5 ? 10 : 5 };
}
export function normalizeDispatch(raw) {
  const completed = integer(raw?.completed, 9999) ? raw.completed : 0;
  if (!raw?.active || typeof raw.active !== "object") return { completed, active: null };
  const a = raw.active;
  if (!["small", "medium", "large"].includes(a.level) || !["intro", "load", "split", "subtract", "done"].includes(a.phase)) return { completed, active: null };
  const q = dispatchLesson(a.level, a.phase === "done" ? Math.max(0, completed - 1) : completed);
  if (!integer(a.front, q.total) || !integer(a.rear, q.total) || a.front + a.rear > q.total
    || (["intro", "load"].includes(a.phase) && a.rear !== 0)
    || (["split", "subtract", "done"].includes(a.phase) && a.front + a.rear !== q.total)
    || (["subtract", "done"].includes(a.phase) && a.rear !== q.rear)
    || (a.phase === "done" && completed === 0)) return { completed, active: null };
  return { completed, active: { level: a.level, phase: a.phase, front: a.front, rear: a.rear } };
}
export function dispatchAction(raw, action, level = "small") {
  const state = normalizeDispatch(raw);
  if (action === "start" && (!state.active || state.active.phase === "done")) {
    if (state.completed === 9999) return { state, message: "已完成 9999 班，可以到遊戲室繼續練習。" };
    state.active = { level: ["small", "medium", "large"].includes(level) ? level : "small", phase: "intro", front: 0, rear: 0 };
    return { state, message: "先看看玩法，再把乘客請上車。" };
  }
  const a = state.active;
  if (!a || a.phase === "done") return { state, message: "這趟已經完成，可以再開一班。" };
  const q = dispatchLesson(a.level, state.completed);
  let message = "再看看車廂裡的人數，慢慢來。";
  if (action === "learn" && a.phase === "intro") { a.phase = "load"; message = `請讓 ${q.total} 位乘客上車。`; }
  if (a.phase === "load") {
    if (action === "add" && a.front < q.total) a.front++;
    if (action === "remove" && a.front > 0) a.front--;
    if (action === "check" && a.front === q.total) { a.phase = "split"; message = "人數剛剛好！把一部分乘客移到後車廂。"; }
    else if (action === "check") message = `現在有 ${a.front} 人，還需要 ${q.total - a.front} 人。`;
  } else if (a.phase === "split") {
    if (action === "to-rear" && a.front > 0) { a.front--; a.rear++; }
    if (action === "to-front" && a.rear > 0) { a.front++; a.rear--; }
    if (action === "check" && a.rear === q.rear) { a.phase = "subtract"; message = "後車廂留在小站，看看前車廂還有幾人。"; }
    else if (action === "check") message = `後車廂現在 ${a.rear} 人，請分成 ${q.rear} 人。總數仍是 ${q.total} 人。`;
  } else if (a.phase === "subtract" && /^answer:\d+$/.test(action)) {
    if (Number(action.slice(7)) === a.front) {
      a.phase = "done"; state.completed = Math.min(9999, state.completed + 1);
      message = "三站完成！同一班列車，練會了合起來和分開算。";
    } else message = "前車廂的座位還在，數一數，再選一次。";
  }
  return { state, message };
}
export function dispatchEntry(raw) {
  const state = normalizeDispatch(raw), resume = state.active && state.active.phase !== "done";
  return `<section class="dispatch-entry" aria-labelledby="dispatch-entry-title"><div class="dispatch-entry-copy"><small>數學動手玩 · 數量與拆合</small><h1 id="dispatch-entry-title">拆合車廂調度台</h1><p>同一班列車，裝滿、分車，再算剩下。</p></div><a id="dispatch-open" href="#dispatch">${resume ? "繼續調度" : "我來調度"}<span aria-hidden="true"> →</span></a><small class="dispatch-entry-record">已完成 ${state.completed} 班 · 不計時，慢慢試</small></section>`;
}
export function dispatchMarkup(raw, message = "") {
  const state = normalizeDispatch(raw), a = state.active;
  if (!a) return "";
  const q = dispatchLesson(a.level, a.phase === "done" ? Math.max(0, state.completed - 1) : state.completed);
  const button = (action, text, disabled = false) => `<button type="button" data-dispatch="${action}" ${disabled ? "disabled" : ""}>${text}</button>`;
  const carriage = (name, count, rear = false) => `<section class="dispatch-carriage ${rear ? "rear" : "front"}" aria-label="${name} ${count} 人"><h2>${name}<strong>${count}<small> 人</small></strong></h2><div class="dispatch-seats" aria-hidden="true">${Array.from({ length: q.capacity }, (_, i) => `<span class="${i < count ? "occupied" : "empty"}">${i < count ? "●" : "·"}</span>`).join("")}</div><div class="dispatch-wheels" aria-hidden="true">●　　　　　　　●</div></section>`;
  const phaseIndex = ["intro", "load"].includes(a.phase) ? 1 : a.phase === "split" ? 2 : 3;
  let heading, instruction, controls, equation;
  if (a.phase === "intro") {
    heading = "用車廂，把數學玩出來"; instruction = "每個圓點代表一位乘客。按一次，就上車或移動一人。";
    controls = button("learn", "知道了，先裝滿列車 →"); equation = "裝滿 → 分成兩車 → 算剩下";
  } else if (a.phase === "load") {
    heading = `第 1 站：請 ${q.total} 人上車`; instruction = "按「上車 1 人」，看座位一格一格填滿。";
    controls = button("remove", "下車 1 人", a.front === 0) + button("add", "上車 1 人", a.front === q.total) + button("check", "人數好了，去分車 →");
    equation = `${a.front} 人上車了 · 目標 ${q.total} 人`;
  } else if (a.phase === "split") {
    heading = `第 2 站：後車廂分 ${q.rear} 人`; instruction = "移動乘客，觀察兩節車廂合起來的人數。移錯也可以搬回來。";
    controls = button("to-front", "← 移回前車 1 人", a.rear === 0) + button("to-rear", "移到後車 1 人 →", a.front === 0) + button("check", "分好了，車廂分開 →");
    equation = `${a.front} ＋ ${a.rear} ＝ ${q.total}`;
  } else {
    heading = a.phase === "done" ? "調度完成！一班列車，兩種算法" : "第 3 站：前車廂帶走幾人？";
    instruction = a.phase === "done" ? `分車時總數不變，後車留下 ${a.rear} 人，前車帶走 ${a.front} 人。` : `後車廂的 ${a.rear} 人留在站裡。數一數前車廂，選出帶走的人數。`;
    controls = a.phase === "done" ? button("start", "再開一班，換個數量 →") : [...new Set([Math.max(0, a.front - 1), a.front, a.front + 1])].sort((x,y)=>x-y).map(n => button(`answer:${n}`, `${n} 人`)).join("");
    equation = a.phase === "done" ? `${a.front} ＋ ${a.rear} ＝ ${q.total}　｜　${q.total} − ${a.rear} ＝ ${a.front}` : `${q.total} − ${a.rear} ＝ ？`;
  }
  return `<section class="dispatch-page" aria-labelledby="dispatch-title"><header class="dispatch-top"><a id="dispatch-pause" href="#home">← 暫停／返回</a><span>拆合車廂調度台</span><strong>${a.phase === "done" ? "三站完成" : `${phaseIndex}／3 站`}</strong></header><div class="dispatch-body"><ol class="dispatch-route" aria-label="數學任務"><li ${phaseIndex===1?'aria-current="step"':""}>1 裝滿</li><li ${phaseIndex===2?'aria-current="step"':""}>2 分車</li><li ${phaseIndex===3?'aria-current="step"':""}>3 算剩下</li></ol><h1 id="dispatch-title" tabindex="-1">${heading}</h1><p class="dispatch-instruction">${instruction}</p><div class="dispatch-train ${["subtract","done"].includes(a.phase) ? "uncoupled" : ""}">${carriage("前車廂", a.front)}<span class="dispatch-coupler" aria-hidden="true">${["subtract","done"].includes(a.phase) ? "⋯" : "━"}</span>${carriage("後車廂", a.rear, true)}</div><p class="dispatch-equation">${equation}</p><p class="dispatch-feedback" role="status">${message.replace(/[<>&"]/g, "") || "可以一直試，沒有倒數，也不扣分。"}</p>${a.phase === "done" ? `<p class="dispatch-completed">已完成 ${state.completed} 班調度，進度保存在這台裝置。</p>` : ""}</div><footer class="dispatch-controls">${controls}</footer></section>`;
}
