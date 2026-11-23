// Ported from Taiwan Train Math 1.11.0 (tests/learning-ui.test.mjs), Copyright 2026 mars-tw. Apache-2.0.
// Changed: import/data paths for src/games/math; see docs/r48-math-room-assets.json for any adjusted assertion.
import test from "node:test";
import assert from "node:assert/strict";
import { countingScene, discoveryMarkup } from "../../src/games/math/learning-ui.js";

test("counting marks never report a running count, even when every person has been touched", () => {
  const q = { count: 5, get answer() { throw new Error("Do not read the answer"); } };
  for (const counted of [new Set(), new Set([0, 2]), new Set([0, 1, 2, 3, 4])]) {
    const markup = countingScene(q, { counted });
    assert.equal([...markup.matchAll(/data-count=/g)].length, 5);
    assert.equal([...markup.matchAll(/class="person counted"/g)].length, counted.size);
    assert.doesNotMatch(markup, /已經點過|5 位|一共|第 \d/);
    assert.equal([...markup.matchAll(/<span aria-hidden="true">✓<\/span>/g)].length, counted.size);
  }
  assert.match(countingScene(q, { solved: true }), /月台一共有 5 位乘客/);
  assert.equal([...countingScene(q, { solved: true }).matchAll(/ disabled/g)].length, 5);
});

test("zero, invalid values and counting marks remain safe without solving or changing them", () => {
  assert.match(countingScene({ count: 0 }), /月台還沒有人/);
  for (const count of [-1, 21, null, "3", NaN]) assert.equal(countingScene({ count }), "");
  const marks = new Set([1]); countingScene({ count: 2 }, { counted: marks }); assert.deepEqual([...marks], [1]);
});

test("real places are labelled independently and external source text is escaped", () => {
  const markup = discoveryMarkup({ kind: "place", text: '<img src=x onerror="alert(1)">', place: { region: '嘉義"' }, sources: [
    { title: '<script>bad</script>', url: 'https://www.taiwan.net.tw/?x="unsafe' }, { title: "bad", url: "javascript:alert(1)" },
  ] });
  assert.match(markup, /認識真實臺灣/); assert.match(markup, /嘉義&quot;/);
  assert.doesNotMatch(markup, /<img|<script>|javascript:|onerror="/);
  assert.match(markup, /target="_blank" rel="noopener"/); assert.match(markup, /id="learning-read"/);
  assert.equal(discoveryMarkup(null), "");
});
