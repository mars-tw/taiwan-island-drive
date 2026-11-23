// Ported from Taiwan Train Math 1.11.0 (tests/adventure.test.mjs), Copyright 2026 mars-tw. Apache-2.0.
// Changed: import/data paths for src/games/math; see docs/r48-math-room-assets.json for any adjusted assertion.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  questionFor,
  seededRandom,
  LEVELS,
  isCorrect,
  defaults,
  readProgress,
} from "../../src/games/math/engine.js";
import {
  railLinks,
  trackConnected,
  newAdventureState,
  changeShare,
  pickSouvenir,
  SOUVENIRS,
} from "../../src/games/math/adventure.js";
import {
  STORY_DURATION,
  newStoryState,
  storyProgress,
  storyChapter,
  advanceStory,
  goToChapter,
} from "../../src/games/math/story-model.js";
const { trains } = JSON.parse(
  readFileSync(new URL("../../src/games/math/data/trains.json", import.meta.url), "utf8"),
);
test("track puzzles always have a working route and begin unsolved", () => {
  for (const level of Object.keys(LEVELS))
    for (let seed = 0; seed < 400; seed++) {
      const q = questionFor({
        game: "tracks",
        level,
        train: trains[0],
        trains,
        rng: seededRandom(Math.imul(seed, 2654435761)),
      });
      const solution = q.tiles.map((tile) => tile.solution);
      assert.equal(trackConnected(q, solution), true);
      assert.equal(trackConnected(q, newAdventureState(q).rotations), false);
      assert.equal(trackConnected(q, []), false);
      assert.equal(
        trackConnected(
          q,
          solution.map((r) => r + 4),
        ),
        false,
      );
      for (const index of q.path) {
        const broken = [...solution];
        broken[index] = (broken[index] + 1) % 4;
        assert.equal(
          trackConnected(q, broken),
          false,
          `${level} ${seed} broken ${index}`,
        );
        if (q.tiles[index].kind === "straight") {
          const sameLine = [...solution];
          sameLine[index] = (sameLine[index] + 2) % 4;
          assert.equal(trackConnected(q, sameLine), true);
        }
      }
      assert.equal(new Set(q.path).size, q.path.length);
    }
  assert.deepEqual(railLinks("empty", 0), []);
});
test("young track players get different solvable routes without bigger puzzles", () => {
  for (const [level, columns, minimumRoutes] of [
    ["small", 2, 2],
    ["medium", 3, 4],
  ]) {
    const routes = new Set();
    for (let seed = 0; seed < 96; seed++) {
      const q = questionFor({
        game: "tracks",
        level,
        train: trains[0],
        trains,
        rng: seededRandom(Math.imul(seed, 2654435761)),
      });
      routes.add(q.path.join(","));
      assert.equal(q.columns, columns);
      assert.equal(q.rows, columns);
      assert.equal(q.tiles.length, columns * columns);
      assert.equal(q.start, 0, "the arrival animation enters the top-left tile");
      assert.equal(q.finish, q.tiles.length - 1);
      assert.equal(q.path.length, columns * 2 - 1, "keep beginner routes short");
      for (let at = 1; at < q.path.length; at++) {
        const from = q.path[at - 1], to = q.path[at];
        const distance =
          Math.abs((from % columns) - (to % columns)) +
          Math.abs(Math.floor(from / columns) - Math.floor(to / columns));
        assert.equal(distance, 1, "each track joins an adjacent tile");
      }
      assert.equal(trackConnected(q, q.tiles.map((tile) => tile.solution)), true);
      assert.equal(trackConnected(q, newAdventureState(q).rotations), false);
    }
    assert.ok(routes.size >= minimumRoutes, `${level} offers ${minimumRoutes} routes`);
  }
});
test("snacks conserve inventory, support take-back and require equal complete sharing", () => {
  for (const level of Object.keys(LEVELS))
    for (let seed = 0; seed < 400; seed++) {
      const q = questionFor({
        game: "sharing",
        level,
        train: trains[0],
        trains,
        rng: seededRandom(seed),
      });
      assert.ok(q.total <= LEVELS[level].max);
      assert.equal(q.total % q.friends, 0);
      let shares = newAdventureState(q).shares;
      assert.equal(changeShare(q, shares, 0, -1), shares);
      assert.equal(changeShare(q, shares, q.friends, 1), shares);
      shares = changeShare(q, shares, 0, 1);
      shares = changeShare(q, shares, 0, -1);
      assert.equal(
        shares.reduce((a, b) => a + b, 0),
        0,
      );
      for (let n = 0; n < q.total; n++)
        shares = changeShare(q, shares, n % q.friends, 1);
      assert.equal(isCorrect(q, shares), true);
      assert.equal(changeShare(q, shares, 0, 1), shares);
      assert.equal(
        isCorrect(
          q,
          shares.map((v) => v - 1),
        ),
        false,
      );
      if (q.friends === 2) assert.equal(isCorrect(q, [q.total, 0]), false);
    }
});
test("treasure has exactly the requested targets and distinct distractors", () => {
  for (const level of Object.keys(LEVELS))
    for (let seed = 0; seed < 400; seed++) {
      const q = questionFor({
        game: "treasure",
        level,
        train: trains[0],
        trains,
        rng: seededRandom(seed),
      });
      assert.equal(
        q.items.filter((kind) => kind === q.target).length,
        q.answer,
      );
      assert.ok(q.answer >= 2 && q.answer <= LEVELS[level].max);
      assert.equal(new Set(q.items).size, 3);
      const found = new Set(
        q.items.flatMap((kind, i) => (kind === q.target ? [i] : [])),
      );
      assert.equal(isCorrect(q, found.size), true);
    }
});
test("story advances gently, pauses, ends once and supports manual reading", () => {
  let state = newStoryState();
  assert.equal(storyChapter(state), 0);
  state = advanceStory(state, 12000);
  assert.equal(storyChapter(state), 1);
  const paused = { ...state, playing: false };
  assert.equal(advanceStory(paused, 60000), paused);
  assert.equal(advanceStory(state, -1), state);
  assert.equal(advanceStory(state, NaN), state);
  state = advanceStory(state, 60000);
  assert.equal(state.elapsed, STORY_DURATION);
  assert.equal(state.playing, false);
  assert.equal(storyProgress(state), 1);
  assert.equal(storyChapter(state), 3);
  for (let i = 0; i < 4; i++) {
    const chapter = goToChapter(state, i);
    assert.equal(storyChapter(chapter), i);
    assert.equal(chapter.playing, false);
  }
  assert.equal(goToChapter(state, 4), state);
});
test("old passports migrate safely; souvenirs are valid and avoid duplicates until complete", () => {
  const progress = readProgress({
    getItem: () =>
      JSON.stringify({
        version: 1,
        trips: 5,
        completed: ["700t"],
        level: "medium",
      }),
  });
  assert.deepEqual(progress.souvenirs, []);
  assert.equal(progress.trips, 5);
  assert.deepEqual(progress.completed, ["700t"]);
  const clean = readProgress({
    getItem: () =>
      JSON.stringify({
        ...defaults(),
        souvenirs: ["star-letter", "bogus", "star-letter", 7],
      }),
  });
  assert.deepEqual(clean.souvenirs, ["star-letter"]);
  const collection = defaults();
  for (let i = 0; i < SOUVENIRS.length; i++) {
    collection.trips++;
    const gift = pickSouvenir(collection, "700t");
    assert.ok(!collection.souvenirs.includes(gift.id));
    collection.souvenirs.push(gift.id);
  }
  assert.equal(collection.souvenirs.length, SOUVENIRS.length);
  assert.ok(
    SOUVENIRS.some((gift) => gift.id === pickSouvenir(collection, "700t").id),
  );
});
