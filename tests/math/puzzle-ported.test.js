// Ported from Taiwan Train Math 1.11.0 (tests/puzzle.test.mjs), Copyright 2026 mars-tw. Apache-2.0.
// Changed: import/data paths for src/games/math; see docs/r48-math-room-assets.json for any adjusted assertion.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
// R48 adjustment: the 1.11.0 image files stay in the source archive until the photo batch (C line).
// existsSync now checks the byte-hashed 1.11.0 asset inventory instead of the working directory.
const sourceAssets = new Set(JSON.parse(readFileSync(new URL("../../src/games/math/data/source-assets.json", import.meta.url), "utf8")).files.map(file => file.path));
const existsSync = path => sourceAssets.has(path);
import {
  createPuzzleQuestion, newPuzzleState, resetPuzzleState,
  selectPuzzlePiece, placePuzzlePiece, puzzleScene,
} from "../../src/games/math/puzzle.js";

const { trains } = JSON.parse(readFileSync(new URL("../../src/games/math/data/trains.json", import.meta.url), "utf8"));
const qFor = (level = "small", rng = () => 0) =>
  createPuzzleQuestion({ level, train: trains[0], trains, rng });
const sorted = (values) => [...values].sort((a, b) => a - b);
function assertConserved(q, state) {
  const placed = state.placements.filter((piece) => piece !== null);
  const tray = q.pieces.filter((piece) => !placed.includes(piece));
  assert.equal(new Set(placed).size, placed.length);
  assert.deepEqual(sorted([...placed, ...tray]), q.answer);
}

test("puzzles use the selected catalogue image and each age's piece count", () => {
  for (const [level, [columns, rows]] of Object.entries({ small: [2, 2], medium: [3, 2], large: [3, 3] }))
    for (const train of trains)
      for (const rng of [() => 0, () => 0.99999, () => 1, () => NaN]) {
        const q = createPuzzleQuestion({ level, train, trains, rng });
        assert.equal(q.game, "puzzle");
        assert.equal(q.target, train.id);
        assert.equal(q.image, train.image);
        assert.equal(q.trainName, train.name);
        assert.equal(q.columns, columns);
        assert.equal(q.rows, rows);
        assert.equal(q.pieces.length, columns * rows);
        assert.deepEqual(sorted(q.pieces), q.answer);
        assert.deepEqual(q.answer, Array.from({ length: columns * rows }, (_, index) => index));
        assert.notDeepEqual(q.pieces, q.answer, "even an identity shuffle must start unsolved");
        assert.ok(existsSync(q.image));
        assert.doesNotMatch(q.hint, /\d|第|左上|右上|左下|右下|這片放/);
      }
});

test("selection and placement are immutable and never snap a piece into its correct slot", () => {
  const q = qFor();
  const initial = newPuzzleState(q);
  Object.freeze(initial.placements);
  Object.freeze(initial);
  assert.deepEqual(initial, { placements: [null, null, null, null], selectedPiece: null, moves: 0, preview: false });
  const selected = selectPuzzlePiece(q, initial, 0);
  assert.equal(selected.selectedPiece, 0);
  assert.equal(initial.selectedPiece, null);
  assert.equal(selected.moves, 0);
  const placed = placePuzzlePiece(q, selected, 3);
  assert.deepEqual(placed.placements, [null, null, null, 0]);
  assert.equal(placed.selectedPiece, null);
  assert.equal(placed.moves, 1);
  assert.deepEqual(initial.placements, [null, null, null, null]);
  assertConserved(q, placed);
  const cancelled = selectPuzzlePiece(q, selected, 0);
  assert.equal(cancelled.selectedPiece, null);
  assert.equal(cancelled.moves, 0);
});

test("placed pieces can move, exchange positions and return to the tray without duplicates", () => {
  const q = qFor();
  let state = newPuzzleState(q);
  state = placePuzzlePiece(q, selectPuzzlePiece(q, state, 0), 2);
  state = placePuzzlePiece(q, selectPuzzlePiece(q, state, 1), 3);
  assert.deepEqual(state.placements, [null, null, 0, 1]);
  const swapped = placePuzzlePiece(q, selectPuzzlePiece(q, state, 0), 3);
  assert.deepEqual(swapped.placements, [null, null, 1, 0]);
  assert.deepEqual(state.placements, [null, null, 0, 1]);
  assert.equal(swapped.moves, state.moves + 1);
  assertConserved(q, swapped);
  const moved = placePuzzlePiece(q, selectPuzzlePiece(q, swapped, 0), 0);
  assert.deepEqual(moved.placements, [0, null, 1, null]);
  assertConserved(q, moved);
  const retrieved = placePuzzlePiece(q, moved, 2);
  assert.deepEqual(retrieved.placements, [0, null, null, null]);
  assert.equal(retrieved.selectedPiece, 1);
  assertConserved(q, retrieved);
  const replaced = placePuzzlePiece(q, selectPuzzlePiece(q, moved, 2), 0);
  assert.deepEqual(replaced.placements, [2, null, 1, null]);
  assert.equal(replaced.selectedPiece, null);
  assertConserved(q, replaced);
});

test("complete placements match the answer and reset clears all child actions", () => {
  const q = qFor("large");
  let state = newPuzzleState(q);
  for (const piece of q.pieces) {
    state = placePuzzlePiece(q, selectPuzzlePiece(q, state, piece), piece);
    assertConserved(q, state);
  }
  assert.deepEqual(state.placements, q.answer);
  assert.equal(state.moves, 9);
  state = { ...state, preview: true, selectedPiece: 4 };
  const reset = resetPuzzleState(q);
  assert.deepEqual(reset, newPuzzleState(q));
  assert.ok(reset.placements.every((piece) => piece === null));
  assert.equal(reset.preview, false);
  assert.equal(state.preview, true);
});

test("invalid input and no-op actions preserve puzzle state", () => {
  const q = qFor(), initial = newPuzzleState(q);
  for (const id of [-1, 4, 1.5, NaN, Infinity, "0", null, undefined]) {
    assert.equal(selectPuzzlePiece(q, initial, id), initial);
    assert.equal(placePuzzlePiece(q, initial, id), initial);
  }
  assert.equal(placePuzzlePiece(q, initial, 0), initial);
  const placed = placePuzzlePiece(q, selectPuzzlePiece(q, initial, 0), 0);
  const selected = selectPuzzlePiece(q, placed, 0);
  assert.equal(placePuzzlePiece(q, selected, 0), selected);
  for (const invalid of [
    null, {}, { ...initial, placements: [] }, { ...initial, placements: [0, 0, null, null] },
    { ...initial, placements: [99, null, null, null] }, { ...initial, selectedPiece: "0" },
    { ...initial, moves: -1 }, { ...initial, moves: 1.5 }, { ...initial, preview: "true" },
  ]) {
    assert.equal(selectPuzzlePiece(q, invalid, 0), invalid);
    assert.equal(placePuzzlePiece(q, invalid, 0), invalid);
  }
  assert.equal(selectPuzzlePiece({ ...q, columns: 99 }, initial, 0), initial);
  assert.equal(placePuzzlePiece({ ...q, columns: 99 }, initial, 0), initial);
  assert.throws(() => qFor("unknown"));
});

test("unsolved markup starts blank, exposes touch and keyboard controls and withholds the reference", () => {
  for (const level of ["small", "medium", "large"]) {
    const q = qFor(level), trip = { puzzle: newPuzzleState(q), solved: false };
    Object.defineProperty(q, "answer", { get() { assert.fail("unsolved markup must not inspect the solution"); } });
    const markup = puzzleScene(q, trip);
    assert.equal((markup.match(/data-puzzle-slot=/g) || []).length, q.pieces.length);
    assert.equal((markup.match(/data-puzzle-piece=/g) || []).length, q.pieces.length);
    assert.equal((markup.match(/class="puzzle-slot is-empty/g) || []).length, q.pieces.length);
    assert.match(markup, /id="puzzle-preview"[^>]*aria-expanded="false"/);
    assert.match(markup, />看看原圖<\/button>/);
    assert.match(markup, /id="puzzle-reference" hidden/);
    assert.doesNotMatch(markup, /class="puzzle-reference"|class="puzzle-complete-photo"|data-answer=|background-image:|正確位置|第 0 片/);
    assert.match(markup, /id="puzzle-submit"[^>]*disabled/);
    const buttons = [...markup.matchAll(/<button\b[^>]*>/g)].map((match) => match[0]);
    assert.ok(buttons.every((button) => button.includes('type="button"')));
    const trayLabels = [...markup.matchAll(/data-puzzle-piece="\d+" aria-label="([^"]+)"/g)].map((match) => match[1]);
    assert.deepEqual(trayLabels, q.pieces.map((_piece, index) => `拼圖盤第 ${index + 1} 片，選取這片`));
  }
});

test("placed pieces disappear from the tray; preview is explicit and solving reveals the full photo", () => {
  const q = qFor();
  let state = newPuzzleState(q);
  state = placePuzzlePiece(q, selectPuzzlePiece(q, state, 0), 2);
  const partial = puzzleScene(q, { puzzle: state });
  assert.doesNotMatch(partial, /data-puzzle-piece="0"/);
  assert.match(partial, /data-puzzle-slot="2"[^>]*aria-label="拼圖格，第 3 格，取回這片拼圖"/);
  const preview = puzzleScene(q, { puzzle: { ...state, preview: true } });
  assert.match(preview, /class="puzzle-reference" id="puzzle-reference"/);
  assert.match(preview, /aria-expanded="true"/);
  assert.match(preview, />收起原圖<\/button>/);
  const complete = puzzleScene(q, { puzzle: { ...state, placements: [...q.answer] } });
  assert.match(complete, /id="puzzle-submit" class="primary-btn" >/);
  assert.doesNotMatch(complete, /puzzle-complete-photo/);
  const solved = puzzleScene(q, { puzzle: state, solved: true });
  assert.match(solved, /puzzle-complete-photo/);
  assert.match(solved, /4 片拼好了/);
  assert.doesNotMatch(solved, /data-puzzle-slot=|data-puzzle-piece=|puzzle-submit|puzzle-preview/);
});

test("photo crops keep their identity after movement and scale as one 16:9 image", () => {
  const q = qFor("medium");
  const initial = puzzleScene(q, { puzzle: newPuzzleState(q) });
  assert.match(initial, /--puzzle-columns:3;--puzzle-rows:2;--puzzle-cell-ratio:32\/27/);
  const photo = '--puzzle-piece-x:2;--puzzle-piece-y:1';
  assert.ok(initial.includes(photo), "piece 5 must contain the bottom-right crop");
  const moved = placePuzzlePiece(q, selectPuzzlePiece(q, newPuzzleState(q), 5), 0);
  const markup = puzzleScene(q, { puzzle: moved });
  assert.match(markup, /data-puzzle-slot="0"[^>]*><span class="puzzle-piece-photo" style="--puzzle-piece-x:2;--puzzle-piece-y:1"/);
  const css = readFileSync(new URL("../../src/games/math/styles/puzzle.css", import.meta.url), "utf8");
  assert.match(css, /width: calc\(var\(--puzzle-columns\) \* 100%\)/);
  assert.match(css, /height: calc\(var\(--puzzle-rows\) \* 100%\)/);
  assert.match(css, /left: calc\(var\(--puzzle-piece-x\) \* -100%\)/);
  assert.match(css, /top: calc\(var\(--puzzle-piece-y\) \* -100%\)/);
  assert.match(css, /aspect-ratio: var\(--puzzle-cell-ratio\)/);
  assert.match(css, /aspect-ratio: 16 \/ 9/);
  assert.match(css, /minmax\(0, 1fr\)/);
  assert.match(css, /min-width: 48px/);
  assert.match(css, /min-height: 48px/);
  assert.match(css, /object-fit: contain/);
  assert.match(css, /\.puzzle-stage button:focus-visible/);
});

test("images stay local and train text cannot inject markup", () => {
  for (const image of [
    "https://example.com/train.webp", "//example.com/train.webp", "javascript:alert(1)",
    "assets/images/../secret.webp", "assets/images/x.webp?evil=1", 'assets/images/x.webp" onerror="alert(1)',
  ]) {
    assert.throws(() => createPuzzleQuestion({ level: "small", train: { ...trains[0], image } }));
    assert.throws(() => puzzleScene({ ...qFor(), image }, {}));
  }
  assert.throws(() => createPuzzleQuestion({ level: "small", train: trains[0], trains: [] }));
  const q = createPuzzleQuestion({ level: "small", train: { ...trains[0], name: '<img src=x onerror="bad">' } });
  const markup = puzzleScene(q, { solved: true });
  assert.match(markup, /&lt;img src=x onerror=&quot;bad&quot;&gt;/);
  assert.doesNotMatch(markup, /<img src=x/);
  assert.equal((markup.match(/<img\b/g) || []).length, 1);
});
