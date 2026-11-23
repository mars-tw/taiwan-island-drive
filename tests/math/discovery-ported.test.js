// Ported from Taiwan Train Math 1.11.0 (tests/discovery.test.mjs), Copyright 2026 mars-tw. Apache-2.0.
// Changed: import/data paths for src/games/math; see docs/r48-math-room-assets.json for any adjusted assertion.
import test from "node:test";
import assert from "node:assert/strict";
import { seededRandom } from "../../src/games/math/engine.js";
import {
  MOSAIC_PALETTE, DIFFERENCE_THEMES, createMosaicQuestion, createDifferencesQuestion,
  newDiscoveryState, selectMosaicColor, paintMosaicCell, resetMosaic, findDifference, discoveryScene,
} from "../../src/games/math/discovery.js";

const levels = [["small", 3, 2], ["medium", 4, 3], ["large", 5, 4]];
const rngFor = (seed) => seededRandom(Math.imul(seed, 2654435761));
test("mosaics offer twelve real patterns at every age, with legal, varied colors and exact solutions", () => {
  assert.equal(MOSAIC_PALETTE.length, 3);
  assert.equal(new Set(MOSAIC_PALETTE.map((color) => color.symbol)).size, 3);
  const legal = new Set(["empty", ...MOSAIC_PALETTE.map((color) => color.id)]);
  for (const [level, size] of levels) {
    const templates = new Set(), patterns = new Set(), mirrors = new Set(), rotations = new Set();
    for (let seed = 0; seed < 300; seed++) {
      const q = createMosaicQuestion({ level, rng: rngFor(seed) });
      assert.equal(q.game, "mosaic");
      assert.equal(q.columns, size);
      assert.equal(q.rows, size);
      assert.equal(q.target.length, size * size);
      assert.ok(q.target.every((color) => legal.has(color)));
      assert.ok(new Set(q.target.filter((color) => color !== "empty")).size >= 2);
      assert.deepEqual(q.answer, q.target);
      assert.deepEqual(q.palette, MOSAIC_PALETTE);
      assert.ok(q.palette.every((color) => color.name && color.symbol && /^#[0-9a-f]{6}$/i.test(color.color)));
      const initial = newDiscoveryState(q);
      assert.ok(initial.mosaicCells.every((color) => color === "empty"));
      assert.notDeepEqual(initial.mosaicCells, q.answer);
      let state = initial;
      for (let index = 0; index < q.target.length; index++) {
        state = selectMosaicColor(q, state, q.target[index]);
        state = paintMosaicCell(q, state, index);
      }
      assert.deepEqual(state.mosaicCells, q.answer, "every target can be built using only the public paint tools");
      assert.ok(initial.mosaicCells.every((color) => color === "empty"));
      templates.add(q.templateId);
      patterns.add(q.target.join(","));
      mirrors.add(q.mirrored);
      rotations.add(q.colorRotation);
    }
    assert.equal(templates.size, 12, level);
    assert.ok(patterns.size >= 24, `${level} varies the actual board`);
    assert.equal(mirrors.size, 2);
    assert.equal(rotations.size, 3);
  }
});

test("painting, erasing and reset are immutable and one action only paints one cell", () => {
  const q = createMosaicQuestion({ level: "large", rng: rngFor(19) });
  const target = [...q.target], initial = newDiscoveryState(q);
  Object.freeze(initial.mosaicCells);
  Object.freeze(initial);
  const selected = selectMosaicColor(q, initial, "blue");
  assert.notEqual(selected, initial);
  assert.equal(initial.mosaicColor, "green");
  const painted = paintMosaicCell(q, selected, 7);
  assert.equal(painted.mosaicCells[7], "blue");
  assert.equal(painted.mosaicCells.filter((color) => color !== "empty").length, 1);
  assert.notEqual(painted.mosaicCells, initial.mosaicCells);
  assert.equal(paintMosaicCell(q, painted, 7), painted);
  const erased = paintMosaicCell(q, selectMosaicColor(q, painted, "empty"), 7);
  assert.equal(erased.mosaicCells[7], "empty");
  assert.equal(painted.mosaicCells[7], "blue");
  const reset = resetMosaic(q, painted);
  assert.equal(reset.mosaicColor, q.palette[0].id);
  assert.ok(reset.mosaicCells.every((color) => color === "empty"));
  assert.equal(reset.differencesFound, painted.differencesFound);
  assert.deepEqual(q.target, target);
  for (const value of ["red", '<img src=x onerror="bad()">', null, {}, 0])
    assert.equal(selectMosaicColor(q, painted, value), painted);
  for (const index of [-1, 25, 1.5, "0", NaN, Infinity, null, {}])
    assert.equal(paintMosaicCell(q, painted, index), painted);
  assert.equal(paintMosaicCell(q, { ...painted, mosaicCells: [] }, 0).mosaicCells.length, 0);
});

test("four station scenes have exactly the age's distinct shape changes, never color-only differences", () => {
  for (const [level, , count] of levels) {
    const themes = new Set(), layouts = new Set();
    for (let seed = 0; seed < 300; seed++) {
      const q = createDifferencesQuestion({ level, rng: rngFor(seed) });
      assert.equal(q.game, "differences");
      assert.equal(q.columns, 3);
      assert.equal(q.rows, 3);
      assert.equal(q.itemsLeft.length, 9);
      assert.equal(q.itemsRight.length, 9);
      assert.equal(q.answer, count);
      assert.equal(q.differences.length, count);
      assert.equal(new Set(q.differences).size, count);
      assert.ok(q.differences.every((index) => Number.isInteger(index) && index >= 0 && index < 9));
      const actual = [];
      for (let index = 0; index < 9; index++) {
        const left = q.itemsLeft[index], right = q.itemsRight[index];
        assert.notEqual(left, right, "left and right specs do not share mutable objects");
        assert.equal(left.kind, right.kind);
        assert.equal(left.accent, right.accent);
        assert.ok([0, 1].includes(left.variant) && [0, 1].includes(right.variant));
        if (left.variant !== right.variant) actual.push(index);
      }
      assert.deepEqual(actual, q.differences);
      let state = newDiscoveryState(q);
      for (const index of q.differences) state = findDifference(q, state, index);
      assert.equal(state.differencesFound.size, q.answer);
      themes.add(q.sceneTheme);
      layouts.add(JSON.stringify([q.itemsLeft, q.itemsRight]));
    }
    assert.equal(themes.size, DIFFERENCE_THEMES.length);
    assert.equal(themes.size, 4);
    assert.ok(layouts.size >= 100, `${level} varies the actual objects and changed areas`);
  }
});

test("wrong and repeated difference selections preserve the original state and found set", () => {
  const q = createDifferencesQuestion({ level: "small", rng: rngFor(6) });
  const initial = newDiscoveryState(q), first = q.differences[0];
  const wrong = q.itemsRight.findIndex((_, index) => !q.differences.includes(index));
  assert.equal(findDifference(q, initial, wrong), initial);
  const found = findDifference(q, initial, first);
  assert.notEqual(found, initial);
  assert.notEqual(found.differencesFound, initial.differencesFound);
  assert.deepEqual([...found.differencesFound], [first]);
  assert.equal(initial.differencesFound.size, 0);
  assert.equal(findDifference(q, found, first), found);
  assert.equal(findDifference(q, found, wrong), found);
  for (const value of [-1, 9, 0.25, "0", NaN, Infinity, null, '<script>bad()</script>'])
    assert.equal(findDifference(q, found, value), found);
  assert.equal(newDiscoveryState(q).differencesFound.size, 0);
});

test("mosaic rendering shows the reference without filling, grading or disclosing the paint board", () => {
  const q = createMosaicQuestion({ level: "large", rng: rngFor(11) });
  const trip = { discovery: newDiscoveryState(q), solved: false };
  Object.defineProperty(q, "answer", { get() { assert.fail("render must not read the correct answer"); } });
  const html = discoveryScene(q, trip);
  assert.equal((html.match(/data-mosaic-cell=/g) || []).length, 25);
  assert.equal((html.match(/data-mosaic-color=/g) || []).length, 4);
  const board = html.split('class="mosaic-paint-board"')[1].split('<p class="discovery-help">')[0];
  assert.equal((board.match(/class="mosaic-paint-cell mosaic-empty"/g) || []).length, 25);
  assert.doesNotMatch(board, /mosaic-green|mosaic-orange|mosaic-blue|data-answer|data-correct/);
  assert.match(html, /id="mosaic-submit"/);
  assert.match(html, /id="mosaic-reset"/);
  assert.match(html, /選擇橡皮擦/);
  for (const color of q.palette) assert.ok(html.includes(`選擇${color.name}`));
});

test("differences render nine generic selectable regions without reading or marking the hidden indices", () => {
  const q = createDifferencesQuestion({ level: "medium", rng: rngFor(9) });
  const trip = { discovery: newDiscoveryState(q), solved: false };
  Object.defineProperty(q, "differences", { get() { assert.fail("render must not read difference indices"); } });
  Object.defineProperty(q, "answer", { get() { assert.fail("render must not read the answer"); } });
  const html = discoveryScene(q, trip);
  assert.equal((html.match(/data-difference-cell=/g) || []).length, 9);
  assert.equal((html.match(/aria-label="右圖第 \d 區"/g) || []).length, 9);
  assert.doesNotMatch(html, /data-correct|data-answer|difference-found|difference-check|data-variant|車窗不同|屋頂不同/);
  assert.match(html, /已找到 <strong>0／3/);
  assert.equal((html.match(/<svg /g) || []).length, 10);
  trip.discovery.differencesFound = new Set([2]);
  const marked = discoveryScene(q, trip);
  assert.equal((marked.match(/class="difference-check"/g) || []).length, 1);
  assert.match(marked, /aria-label="右圖第 3 區，已找到" disabled/);
});

test("scene captions and palette text are escaped, and malformed styles and object names stay inert", () => {
  const mosaic = createMosaicQuestion({ level: "small", rng: rngFor(2) });
  mosaic.templateName = '<img src=x onerror="bad()">';
  mosaic.hint = '<script>bad()</script>';
  mosaic.palette[0].name = '" onmouseover="bad()';
  mosaic.palette[0].symbol = "<svg onload=bad()>";
  mosaic.palette[0].color = "red;background-image:url(javascript:bad())";
  mosaic.target[0] = '<script>bad()</script>';
  const html = discoveryScene(mosaic, { discovery: newDiscoveryState(mosaic) });
  assert.doesNotMatch(html, /<img |<script>|<svg onload=|background-image:|javascript:/);
  assert.match(html, /&lt;img /);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /&quot; onmouseover=&quot;/);
  const differences = createDifferencesQuestion({ level: "small", rng: rngFor(2) });
  differences.hint = '<script>bad()</script>';
  differences.sceneTheme = '" onload="bad()';
  differences.itemsRight[0] = { kind: '<script>bad()</script>', variant: '<img src=x>', accent: 'red" onload="bad()' };
  assert.doesNotMatch(discoveryScene(differences, {}), /<script>|onload="bad|<img /);
  for (const level of ["constructor", "__proto__", "unknown", null]) {
    assert.throws(() => createMosaicQuestion({ level }));
    assert.throws(() => createDifferencesQuestion({ level }));
  }
});
