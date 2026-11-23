// Ported from Taiwan Train Math 1.11.0 (tests/explorers.test.mjs), Copyright 2026 mars-tw. Apache-2.0.
// Changed: import/data paths for src/games/math; see docs/r48-math-room-assets.json for any adjusted assertion.
import test from "node:test";
import assert from "node:assert/strict";
import {
  createLuggageQuestion, createMazeQuestion, newExplorerState,
  selectLuggage, putLuggage, moveMaze, explorerScene,
} from "../../src/games/math/explorers.js";

const levels = ["small", "medium", "large"];
const directions = [
  { name: "up", bit: 1, opposite: 4, dx: 0, dy: -1 },
  { name: "right", bit: 2, opposite: 8, dx: 1, dy: 0 },
  { name: "down", bit: 4, opposite: 1, dx: 0, dy: 1 },
  { name: "left", bit: 8, opposite: 2, dx: -1, dy: 0 },
];
const esc = (text) => String(text).replace(/[&<>"']/g, (value) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[value]);
function random(seed) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

test("luggage questions use the age's classification rule and conserve every item", () => {
  for (const level of levels) {
    const variations = new Set();
    for (let seed = 0; seed < 200; seed++) {
      const q = createLuggageQuestion({ level, rng: random(Math.imul(seed + 1, 2654435761)) });
      assert.equal(q.game, "luggage");
      assert.equal(q.items.length, { small: 4, medium: 6, large: 8 }[level]);
      assert.equal(q.bins.length, { small: 2, medium: 3, large: 4 }[level]);
      assert.equal(new Set(q.items.map((item) => item.id)).size, q.items.length);
      assert.equal(new Set(q.bins.map((bin) => bin.id)).size, q.bins.length);
      assert.equal(q.answer.length, q.items.length);
      let state = newExplorerState(q);
      for (const [index, item] of q.items.entries()) {
        assert.ok(item.color && item.colorName && item.shape && item.shapeName);
        const matches = q.bins.filter((bin) => (!bin.color || bin.color === item.color)
          && (!bin.shape || bin.shape === item.shape));
        assert.equal(matches.length, 1, "a bag must fit exactly one basket");
        assert.equal(q.answer[index], matches[0].id);
        if (level === "small") assert.ok(q.bins.every((bin) => bin.color && !bin.shape));
        if (level === "medium") assert.ok(q.bins.every((bin) => bin.shape && !bin.color));
        if (level === "large") assert.ok(q.bins.every((bin) => bin.color && bin.shape));
        state = putLuggage(q, selectLuggage(q, state, index), matches[0].id);
      }
      assert.deepEqual(state.luggageAssignments, q.answer);
      for (const bin of q.bins) assert.equal(q.answer.filter((id) => id === bin.id).length, 2);
      variations.add(JSON.stringify([q.bins.map((bin) => [bin.color, bin.shape]),
        q.items.map((item) => [item.color, item.shape])]));
    }
    assert.ok(variations.size > 50, `${level}: classification tasks must vary across seeds`);
  }
  assert.throws(() => createLuggageQuestion({ level: "unknown" }));
});

test("luggage can be put in a wrong basket, taken back and corrected without mutating previous work", () => {
  const q = createLuggageQuestion({ level: "large", rng: random(10) });
  const empty = newExplorerState(q);
  assert.equal(putLuggage(q, empty, q.bins[0].id), empty, "choose a bag before a basket");
  let held = selectLuggage(q, empty, 0);
  assert.equal(empty.luggageSelected, null);
  assert.deepEqual(empty.luggageAssignments, Array(8).fill(null));
  assert.equal(held.luggageSelected, 0);
  const wrong = q.bins.find((bin) => bin.id !== q.answer[0]).id;
  const misplaced = putLuggage(q, held, wrong);
  assert.equal(held.luggageAssignments[0], null);
  assert.equal(misplaced.luggageAssignments[0], wrong, "classification is checked only on submission");
  assert.equal(misplaced.luggageSelected, null);
  const takenBack = selectLuggage(q, misplaced, 0);
  assert.equal(misplaced.luggageAssignments[0], wrong);
  assert.equal(takenBack.luggageAssignments[0], null);
  assert.equal(takenBack.luggageSelected, 0);
  const corrected = putLuggage(q, takenBack, q.answer[0]);
  assert.equal(corrected.luggageAssignments[0], q.answer[0]);
  assert.equal(selectLuggage(q, held, 0).luggageSelected, null, "selecting a held bag again cancels selection");
  for (const index of [-1, 8, 0.5, "0", null]) assert.equal(selectLuggage(q, held, index), held);
  for (const id of ["missing", null, "", 0]) assert.equal(putLuggage(q, held, id), held);
  for (const state of [null, {}, { ...held, luggageSelected: -1 },
    { ...held, luggageAssignments: [] }, { ...held, luggageAssignments: Array(8).fill("bogus") }]) {
    assert.equal(selectLuggage(q, state, 0), state);
    assert.equal(putLuggage(q, state, q.bins[0].id), state);
  }
});

function inspectMaze(q) {
  const seen = new Set([q.start]), routeTo = new Map([[q.start, []]]), queue = [q.start];
  let openings = 0;
  for (let current = 0; current < q.walls.length; current++) {
    const x = current % q.columns, y = Math.floor(current / q.columns);
    assert.ok(Number.isInteger(q.walls[current]) && q.walls[current] >= 0 && q.walls[current] <= 15);
    for (const direction of directions) {
      const nx = x + direction.dx, ny = y + direction.dy;
      const wall = Boolean(q.walls[current] & direction.bit);
      if (nx < 0 || nx >= q.columns || ny < 0 || ny >= q.rows) {
        assert.equal(wall, true, "the maze perimeter must have no exit off the board");
      } else {
        const next = ny * q.columns + nx;
        assert.equal(wall, Boolean(q.walls[next] & direction.opposite), "shared walls must agree on both sides");
        if (!wall) openings++;
      }
    }
  }
  while (queue.length) {
    const current = queue.shift();
    for (const direction of directions) {
      if (q.walls[current] & direction.bit) continue;
      const next = current + direction.dy * q.columns + direction.dx;
      if (!seen.has(next)) {
        seen.add(next);
        routeTo.set(next, [...routeTo.get(current), direction.name]);
        queue.push(next);
      }
    }
  }
  assert.equal(seen.size, q.columns * q.rows, "every maze cell must be reachable");
  assert.equal(openings / 2, q.walls.length - 1, "a perfect maze has one connected, cycle-free route network");
  return routeTo.get(q.finish);
}

test("each maze is connected, age-appropriate, symmetric and safe at its boundaries", () => {
  for (const level of levels) {
    const layouts = new Set();
    for (let seed = 0; seed < 200; seed++) {
      const q = createMazeQuestion({ level, rng: random(Math.imul(seed + 1, 2654435761)) });
      assert.equal(q.columns, { small: 3, medium: 4, large: 5 }[level]);
      assert.equal(q.rows, q.columns);
      assert.equal(q.start, 0);
      assert.equal(q.finish, q.columns * q.rows - 1);
      assert.equal(q.answer, "arrived");
      const path = inspectMaze(q);
      let state = newExplorerState(q);
      for (const [index, direction] of path.entries()) {
        assert.notEqual(state.mazePosition, q.finish, "reaching the goal must require the full route");
        const previous = state, oldVisited = [...previous.mazeVisited];
        state = moveMaze(q, state, direction);
        assert.notEqual(state, previous);
        assert.equal(previous.mazeMoves, index);
        assert.deepEqual([...previous.mazeVisited], oldVisited);
        assert.equal(state.mazeMoves, index + 1);
        assert.ok(state.mazePosition >= 0 && state.mazePosition < q.walls.length);
        assert.ok(state.mazeVisited.has(state.mazePosition));
      }
      assert.equal(state.mazePosition, q.finish);
      assert.equal(moveMaze(q, state, "left"), state, "arrival is terminal until reset");
      layouts.add(JSON.stringify(q.walls));
    }
    assert.ok(layouts.size >= (level === "small" ? 10 : 50), `${level}: the route must change across seeds`);
    for (const rng of [() => 0, () => 0.999999]) inspectMaze(createMazeQuestion({ level, rng }));
  }
  assert.throws(() => createMazeQuestion({ level: "unknown" }));
});

test("maze walls, malformed state and unknown directions are no-ops; valid travel can retrace steps", () => {
  const q = createMazeQuestion({ level: "small", rng: random(15) });
  const state = newExplorerState(q);
  for (const direction of ["up", "left", "diagonal", "constructor", "toString", "__proto__", null]) {
    assert.equal(moveMaze(q, state, direction), state);
  }
  for (const invalid of [null, {}, { ...state, mazePosition: -1 }, { ...state, mazePosition: 9 },
    { ...state, mazePosition: 0.5 }, { ...state, mazeMoves: -1 },
    { ...state, mazeVisited: [] }, { ...state, mazeVisited: new Set([-1]) }]) {
    assert.equal(moveMaze(q, invalid, "right"), invalid);
  }
  const direction = directions.find((value) => !(q.walls[0] & value.bit));
  const moved = moveMaze(q, state, direction.name);
  const opposite = directions.find((value) => value.bit === direction.opposite).name;
  const returned = moveMaze(q, moved, opposite);
  assert.equal(returned.mazePosition, 0);
  assert.equal(returned.mazeMoves, 2);
  assert.equal(returned.mazeVisited.size, 2);
  const broken = { ...q, walls: [...q.walls] };
  broken.walls[moved.mazePosition] |= direction.opposite;
  assert.equal(moveMaze(broken, state, direction.name), state, "a one-sided opening cannot be crossed");
  assert.equal(moveMaze({ ...q, walls: Array(9).fill(0) }, state, "left"), state, "an invalid boundary opening cannot wrap rows");
});

test("explorer markup gives usable controls and labels without reading the solution or highlighting mistakes", () => {
  const q = createLuggageQuestion({ level: "large", rng: random(1) });
  let state = selectLuggage(q, newExplorerState(q), 0);
  state = putLuggage(q, state, q.bins.find((bin) => bin.id !== q.answer[0]).id);
  Object.defineProperty(q, "answer", { get() { assert.fail("the classification scene must not read the answer"); } });
  const markup = explorerScene(q, { explorer: state, solved: false }, { esc });
  assert.equal((markup.match(/data-luggage-item=/g) || []).length, 8);
  assert.equal((markup.match(/data-luggage-bin=/g) || []).length, 4);
  assert.match(markup, /aria-pressed=/);
  assert.match(markup, /id="luggage-reset"/);
  assert.match(markup, /id="luggage-submit"/);
  assert.doesNotMatch(markup, /correct|incorrect|solution|data-answer=|答錯|放錯/);
  for (const item of q.items) {
    assert.ok(markup.includes(item.colorName) && markup.includes(item.shapeName), "shape and color names must remain visible");
  }
  const maze = createMazeQuestion({ level: "large", rng: random(2) });
  const mazeState = newExplorerState(maze);
  // Visited squares are the child's history, not a supplied route; do not paint either on the board.
  mazeState.mazeVisited = new Set(Array.from({ length: 25 }, (_, index) => index));
  Object.defineProperty(maze, "answer", { get() { assert.fail("the maze scene must not read its solution"); } });
  const mazeMarkup = explorerScene(maze, { explorer: mazeState, solved: false }, { esc });
  assert.equal((mazeMarkup.match(/role="gridcell"/g) || []).length, 25);
  assert.equal((mazeMarkup.match(/data-maze-direction=/g) || []).length, 4);
  assert.equal((mazeMarkup.match(/class="maze-train"/g) || []).length, 1);
  assert.match(mazeMarkup, /id="maze-board"[^>]*tabindex="0"/);
  assert.match(mazeMarkup, /id="maze-reset"/);
  assert.doesNotMatch(mazeMarkup, /solution|path=|visited|data-answer=|arrived|計時|倒數/);
  const solvedMarkup = explorerScene(maze, { explorer: mazeState, solved: true }, { esc });
  assert.match(solvedMarkup, /列車到站了/);
  assert.equal((solvedMarkup.match(/data-maze-direction="[^"]+"[^>]*disabled/g) || []).length, 4);
});
