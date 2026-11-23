// Ported from Taiwan Train Math 1.11.0 (src/arithmetic-ui.js), Copyright 2026 mars-tw.
// Code: Apache-2.0; original educational text: CC-BY-4.0.
// Changed for the academy: header added, line endings normalised; logic unchanged.
// See public/licenses/taiwan-train-math/NOTICE.txt and docs/r48-math-room-assets.json.
// Only the operands are visible before a child submits the correct answer.
// Keep the final total out of illustrations, labels and spoken feedback.
export function arithmeticScene(q, { solved = false, input = "", touch = false } = {}) {
  const adding = q.operation === "add";
  const value = /^\d{0,2}$/.test(String(input)) ? String(input) : "";
  return `<div class="boarding-stage arithmetic-stage">
    <div class="passenger-records" aria-label="乘客紀錄">
      <div class="passenger-record"><small>原本在車上</small><strong>${q.start}<span>人</span></strong></div>
      <span class="record-operation" aria-hidden="true">${adding ? "＋" : "−"}</span>
      <div class="passenger-record"><small>這一站${adding ? "上車" : "下車"}</small><strong>${q.change}<span>人</span></strong></div>
    </div>
    <div class="closed-carriage"><span aria-hidden="true">🚆</span><p>${solved ? "算好了，列車可以出發囉！" : "列車準備出發，請你算算車上的人數。"}</p></div>
    <div class="math-equation">${q.start} <span>${adding ? "＋" : "−"}</span> ${q.change} <span>＝</span> ${solved ? q.answer : "？"}</div>
    ${solved ? `<p class="arithmetic-result">答對了！現在車上有 ${q.answer} 人。</p>` : `<form id="boarding-form" class="arithmetic-answer" novalidate>
      <label for="boarding-input">我算出的人數</label>
      <div class="arithmetic-entry"><input id="boarding-input" name="answer" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" autocomplete="off" value="${value}" ${touch ? "readonly" : ""} aria-describedby="arithmetic-instruction"><span>人</span><button type="button" data-digit="clear" aria-label="清空答案">清空</button><button type="button" data-digit="backspace" aria-label="刪除最後一位">⌫</button></div>
      <p id="arithmetic-instruction">${touch ? "按下面的數字鍵，輸入你算出的人數。" : "按數字，或用鍵盤輸入。"}</p>
      <div class="number-keypad" role="group" aria-label="輸入答案的數字鍵盤">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(key => `<button type="button" data-digit="${key}" aria-label="輸入 ${key}">${key}</button>`).join("")}</div>
      <button type="button" id="arithmetic-keyboard" class="text-btn">${touch ? "使用裝置鍵盤" : "使用畫面數字鍵"}</button>
      <button type="submit" id="boarding-submit" class="primary-btn">算好了，送出 ✓</button>
    </form>`}
  </div>`;
}

export function parseArithmeticAnswer(value, max) {
  const text = String(value).trim();
  if (!/^\d{1,2}$/.test(text)) return null;
  const number = Number(text);
  return Number.isInteger(number) && number >= 0 && number <= max ? number : null;
}
