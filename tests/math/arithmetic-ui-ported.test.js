// Ported from Taiwan Train Math 1.11.0 (tests/arithmetic-ui.test.mjs), Copyright 2026 mars-tw. Apache-2.0.
// Changed: import/data paths for src/games/math; see docs/r48-math-room-assets.json for any adjusted assertion.
import test from "node:test";
import assert from "node:assert/strict";
import { arithmeticScene, parseArithmeticAnswer } from "../../src/games/math/arithmetic-ui.js";

function inputValue(markup) {
  const input = markup.match(/<input\b[^>]*\bid="boarding-input"[^>]*>/)?.[0];
  assert.ok(input, "an unsolved question must have an answer input");
  return input.match(/\bvalue="([^"]*)"/)?.[1];
}

function equation(markup) {
  const content = markup.match(/<div class="math-equation">([\s\S]*?)<\/div>/)?.[1];
  assert.ok(content, "the arithmetic question must show its equation");
  return content.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

test("unsolved arithmetic shows operands, while withholding the total and answer choices", () => {
  for (const operation of ["add", "subtract"]) {
    const q = {
      operation,
      start: 7,
      change: 2,
      get answer() {
        assert.fail("an unsolved scene must not read or illustrate the answer");
      },
      get choices() {
        assert.fail("arithmetic must ask the child to enter an answer, not choose one");
      },
    };
    const markup = arithmeticScene(q);
    assert.equal(equation(markup), `7 ${operation === "add" ? "＋" : "−"} 2 ＝ ？`);
    assert.equal(inputValue(markup), "");
    assert.match(markup, /原本在車上/);
    assert.match(markup, operation === "add" ? /這一站上車/ : /這一站下車/);
    assert.doesNotMatch(markup, /data-answer=|class="arithmetic-result"|<svg\b|class="passengers\b/);
    assert.equal((markup.match(/<input\b/g) || []).length, 1);
    assert.match(markup, /inputmode="numeric"/);
    assert.match(markup, /<button\b[^>]*type="submit"/);
    const digits = [...markup.matchAll(/data-digit="(\d)"/g)].map((match) => Number(match[1]));
    assert.deepEqual(digits.sort((a, b) => a - b), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  }
});

test("the total is revealed only after solving, and the answer form is removed", () => {
  for (const q of [
    { operation: "add", start: 2, change: 3, answer: 5 },
    { operation: "subtract", start: 8, change: 3, answer: 5 },
    { operation: "subtract", start: 4, change: 4, answer: 0 },
    { operation: "add", start: 13, change: 7, answer: 20 },
  ]) {
    const markup = arithmeticScene(q, { solved: true, input: "99" });
    assert.equal(equation(markup), `${q.start} ${q.operation === "add" ? "＋" : "−"} ${q.change} ＝ ${q.answer}`);
    assert.match(markup, new RegExp(`現在車上有 ${q.answer} 人`));
    assert.doesNotMatch(markup, /<input\b|<form\b|data-digit=|data-answer=/);
  }
});

test("a child's literal numeric entry survives a redraw without substituting the answer", () => {
  const q = { operation: "add", start: 2, change: 3, answer: 5 };
  for (const input of ["", "0", "00", "05", "7", "20", "99", 0, 20]) {
    const markup = arithmeticScene(q, { input });
    assert.equal(inputValue(markup), String(input));
    assert.equal(equation(markup), "2 ＋ 3 ＝ ？");
    assert.doesNotMatch(markup, /現在車上有 5 人/);
  }
});

test("invalid input cannot inject markup or input attributes during a redraw", () => {
  const q = { operation: "add", start: 2, change: 3, answer: 5 };
  for (const input of [
    '" autofocus onfocus="alert(1)',
    '"><img src=x onerror="alert(1)">',
    "<script>alert(1)</script>",
    "1&2", "-1", "2.5", "123", "undefined", " 5 ",
  ]) {
    const markup = arithmeticScene(q, { input });
    assert.equal(inputValue(markup), "");
    assert.doesNotMatch(markup, /autofocus|onfocus=|onerror=|<img\b|<script\b|alert\(/);
  }
});

test("arithmetic parsing preserves zero and the age limit without turning blanks into zero", () => {
  for (const [input, max, expected] of [
    ["0", 10, 0], [0, 10, 0], [" 0 ", 10, 0], ["00", 10, 0],
    ["05", 10, 5], ["10", 10, 10], ["20", 20, 20], [20, 20, 20],
    [" 20 ", 20, 20],
  ]) {
    assert.equal(parseArithmeticAnswer(input, max), expected, String(input));
  }
  for (const input of ["", " ", "\t\n", null, undefined, "-1", -1, "2.5", 2.5,
    "+5", "2 0", "1e1", "0x10", "NaN", NaN, "Infinity", Infinity,
    "五", "５", "abc", "21", 21, "100"]) {
    assert.equal(parseArithmeticAnswer(input, 20), null, String(input));
  }
  assert.equal(parseArithmeticAnswer("11", 10), null);
  assert.equal(parseArithmeticAnswer("20", 10), null);
});
test("touch arithmetic uses its own keypad without forcing the device keyboard", () => {
  const q = { operation: "add", start: 2, change: 3, get answer() { assert.fail("must not reveal answer"); } };
  const markup = arithmeticScene(q, { touch: true, input: "2" });
  assert.match(markup, /id="boarding-input"[^>]*readonly/);
  assert.match(markup, /id="arithmetic-keyboard"[^>]*>使用裝置鍵盤/);
  assert.match(markup, /id="boarding-submit"/);
  assert.equal(inputValue(markup), "2");
  assert.equal(equation(markup), "2 ＋ 3 ＝ ？");
  assert.doesNotMatch(arithmeticScene(q, { touch: false }), /\sreadonly(?:\s|>)/);
});
