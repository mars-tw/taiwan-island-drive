// Ported from Taiwan Train Math 1.11.0 (tests/adventure-ui.test.mjs), Copyright 2026 mars-tw. Apache-2.0.
// Changed: import/data paths for src/games/math; see docs/r48-math-room-assets.json for any adjusted assertion.
import test from "node:test";
import assert from "node:assert/strict";
import { adventureScene } from "../../src/games/math/adventure-ui.js";

test("unfinished track and treasure scenes cannot reveal the solution through old hint flags", () => {
  const tiles = [0, 1].map(() => ({ kind: "straight", get solution() { throw new Error("Do not draw the solution"); } }));
  const tracks = adventureScene({ game: "tracks", columns: 2, rows: 1, start: 0, finish: 1, tiles }, { rotations: [0, 0], solved: false, trackHint: true });
  assert.doesNotMatch(tracks, /rail-ghost/);
  const treasure = adventureScene({ game: "treasure", target: "star", answer: 1, items: ["star", "leaf"] }, { found: new Set(), solved: false, treasureHint: true });
  assert.doesNotMatch(treasure, /treasure-highlight/);
});

test("sharing waits for the whole basket without giving away or accepting the fair allocation", () => {
  const q = { game: "sharing", total: 4, friends: 2, food: "🍎" };
  const button = shares => adventureScene(q, { shares, solved: false }).match(/<button id="sharing-submit"[^>]*>/)[0];
  assert.match(button([1, 1]), /disabled/);
  assert.doesNotMatch(button([3, 1]), /disabled/, "unequal full baskets must remain a child's attempt to check");
  assert.doesNotMatch(button([2, 2]), /disabled/);
});
