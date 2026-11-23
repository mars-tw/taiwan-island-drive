// Ported from Taiwan Train Math 1.11.0 (tests/engine.test.mjs), Copyright 2026 mars-tw. Apache-2.0.
// Changed: import/data paths for src/games/math; see docs/r48-math-room-assets.json for any adjusted assertion.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
// R48 adjustment: the 1.11.0 image files stay in the source archive until the photo batch (C line).
// existsSync now checks the byte-hashed 1.11.0 asset inventory instead of the working directory.
const sourceAssets = new Set(JSON.parse(readFileSync(new URL("../../src/games/math/data/source-assets.json", import.meta.url), "utf8")).files.map(file => file.path));
const existsSync = path => sourceAssets.has(path);
import { trainImage } from "../../src/games/math/train-images.js";
import {
  LEVELS,
  questionFor,
  createTrip,
  seededRandom,
  isCorrect,
  readProgress,
  saveProgress,
  defaults,
  allowedGames,
  newMemoryState,
  memoryTurn,
  SHAPES,
  clockLabel,
  rememberTrip,
  questionSignature,
  HISTORY_LIMITS,
} from "../../src/games/math/engine.js";
const { trains } = JSON.parse(
  readFileSync(new URL("../../src/games/math/data/trains.json", import.meta.url), "utf8"),
);
test("catalogue has unique identities, source links and image assets", () => {
  assert.equal(new Set(trains.map((t) => t.id)).size, trains.length);
  for (const t of trains) {
    for (const k of [
      "id",
      "name",
      "model",
      "intro",
      "fact",
      "category",
      "modelKind",
      "imageKind",
    ])
      assert.ok(t[k], `${t.id}: ${k}`);
    assert.ok(existsSync(t.image), t.image);
    assert.ok(t.sources.every((s) => s.startsWith("https://")));
    assert.ok(["type", "fleet", "name"].includes(t.modelKind));
  }
  assert.ok(trains.find((t) => t.id === "l0" && t.status === "experimental"));
  assert.ok(trains.find((t) => t.id === "n700st" && t.status === "future"));
});
test("generated maths remain correct, distinct and within each age range", () => {
  for (const level of Object.keys(LEVELS))
    for (let seed = 0; seed < 500; seed++) {
      const trip = createTrip({
        level,
        train: trains[seed % trains.length],
        trains,
        rng: seededRandom(seed),
        challenge: seed % 2 === 0,
      });
      assert.equal(trip.length, LEVELS[level].stops);
      for (const q of trip) {
        assert.equal(isCorrect(q, q.answer), true);
        if (q.choices) {
          assert.equal(new Set(q.choices).size, q.choices.length);
          assert.ok(q.choices.includes(q.answer));
        }
        if (q.game === "count" || q.game === "boarding") {
          assert.ok(q.answer >= 0 && q.answer <= LEVELS[level].max);
          assert.ok(q.choices.every((x) => x >= 0 && x <= LEVELS[level].max));
        }
        if (q.game === "boarding") {
          assert.equal(
            q.answer,
            q.operation === "add" ? q.start + q.change : q.start - q.change,
          );
          assert.ok(q.change >= 1);
        }
        if (q.game === "order") {
          assert.deepEqual(
            [...q.numbers].sort((a, b) => a - b),
            q.answer,
          );
          assert.ok(q.answer.every((x) => x >= 0 && x <= LEVELS[level].max));
          assert.equal(isCorrect(q, [...q.answer].reverse()), false);
        }
        if (q.game === "compare")
          assert.equal(
            q.answer,
            q.left === q.right ? "equal" : q.left > q.right ? "left" : "right",
          );
      }
      if (level === "small")
        assert.ok(trip.every((q) => allowedGames("small").includes(q.game)));
    }
});
test("new activities generate solvable and age-appropriate tasks", () => {
  for (const level of Object.keys(LEVELS)) {
    for (let seed = 0; seed < 300; seed++) {
      for (const game of ["pattern", "cargo", "memory", "clock"].filter((g) =>
        allowedGames(level).includes(g),
      )) {
        const q = questionFor({
          level,
          game,
          train: trains[seed % trains.length],
          trains,
          rng: seededRandom(seed),
        });
        assert.equal(isCorrect(q, q.answer), true);
        if (q.choices) {
          assert.equal(new Set(q.choices).size, q.choices.length);
          assert.ok(q.choices.includes(q.answer));
          for (const wrong of q.choices.filter((v) => v !== q.answer))
            assert.equal(isCorrect(q, wrong), false);
        }
        if (game === "cargo") {
          assert.ok(q.answer >= 1 && q.answer <= LEVELS[level].max);
          assert.equal(q.max, LEVELS[level].max);
        }
        if (game === "pattern" && q.kind === "shape") {
          assert.ok(
            q.sequence.every((v, i) => v === q.unit[i % q.unit.length]),
          );
          assert.equal(q.answer, q.unit[q.sequence.length % q.unit.length]);
          assert.ok(q.choices.every((v) => SHAPES[v]));
          if (level === "small") assert.equal(q.unit.length, 2);
        }
        if (game === "pattern" && q.kind === "number") {
          assert.ok(
            q.sequence.every(
              (v, i) =>
                i === 0 || Number(v) - Number(q.sequence[i - 1]) === q.step,
            ),
          );
          assert.equal(Number(q.answer) - Number(q.sequence.at(-1)), q.step);
          assert.ok(Number(q.answer) <= 20);
        }
        if (game === "clock") {
          assert.ok(q.hour >= 1 && q.hour <= 12);
          assert.ok(q.minute === 0 || (level === "large" && q.minute === 30));
          assert.equal(q.answer, q.hour * 60 + q.minute);
          assert.ok(
            q.choices.every(
              (v) => v >= 60 && v <= 750 && [0, 30].includes(v % 60),
            ),
          );
          assert.equal(
            clockLabel(q.answer),
            `${q.hour} 點${q.minute ? "半" : "整"}`,
          );
        }
        if (game === "memory") {
          assert.equal(
            q.pairs.length,
            { small: 2, medium: 3, large: 4 }[level],
          );
          assert.equal(
            new Set(q.pairs.map((id) => trainImage(trains.find((t) => t.id === id))))
              .size,
            q.pairs.length,
          );
          assert.equal(q.deck.length, q.pairs.length * 2);
          let state = newMemoryState();
          for (const id of q.pairs) {
            const pair = q.deck.flatMap((v, i) => (v === id ? [i] : []));
            assert.equal(pair.length, 2);
            state = memoryTurn(
              memoryTurn(state, pair[0], q.deck),
              pair[1],
              q.deck,
            );
          }
          assert.equal(state.matched.length, q.deck.length);
          assert.equal(isCorrect(q, state.matched.length / 2), true);
        }
      }
    }
  }
});
test("memory blocks repeat flips, out-of-range input and a third unmatched card", () => {
  const deck = ["a", "b", "a", "b"];
  let state = newMemoryState();
  assert.equal(memoryTurn(state, -1, deck), state);
  assert.equal(memoryTurn(state, 4, deck), state);
  state = memoryTurn(state, 0, deck);
  assert.equal(memoryTurn(state, 0, deck), state);
  state = memoryTurn(state, 1, deck);
  assert.deepEqual(state.matched, []);
  assert.equal(memoryTurn(state, 2, deck), state);
  state = { ...state, open: [] };
  state = memoryTurn(memoryTurn(state, 0, deck), 2, deck);
  assert.deepEqual(state.matched, [0, 2]);
  assert.equal(memoryTurn(state, 0, deck), state);
});
test("mixed journeys rotate every age-appropriate activity and vary their order", () => {
  for (const level of Object.keys(LEVELS)) {
    const seen = new Set();
    const orders = new Set(), first = new Set(), last = new Set();
    const progress = defaults();
    for (let seed = 0; seed < 18; seed++) {
      const trip = createTrip({
        level,
        train: trains[0],
        trains,
        rng: seededRandom(Math.imul(seed, 2654435761)),
        recentQuestions: progress.recentQuestions,
        recentGames: progress.recentGames,
      });
      assert.equal(trip.length, LEVELS[level].stops);
      assert.equal(new Set(trip.map((q) => q.game)).size, trip.length);
      for (const q of trip) seen.add(q.game);
      orders.add(trip.map((q) => q.game).join(","));
      first.add(trip[0].game);
      last.add(trip.at(-1).game);
      rememberTrip(progress, trip);
      if (seed === Math.ceil(allowedGames(level).length / LEVELS[level].stops) - 1)
        assert.deepEqual([...seen].sort(), allowedGames(level).sort());
    }
    assert.deepEqual([...seen].sort(), allowedGames(level).sort());
    assert.ok(orders.size > 5);
    assert.ok(first.size > 2);
    assert.ok(last.size > 2);
  }
});
test("recognition avoids identical photos and ambiguous same models", () => {
  for (const t of trains) {
    const q = questionFor({
      level: "large",
      game: "identify",
      train: t,
      trains,
      rng: seededRandom(42),
    });
    assert.equal(q.choices.length, 3);
    const target = trains.find((t) => t.id === q.target);
    assert.equal(q.answer, target.id);
    assert.notEqual(target.status, "future");
    for (const id of q.choices.filter((id) => id !== q.target)) {
      const other = trains.find((t) => t.id === id);
      assert.notEqual(trainImage(other), trainImage(target));
      assert.notEqual(other.name, target.name);
      assert.notEqual(other.model, target.model);
      assert.notEqual(other.status, "future");
    }
    assert.equal(new Set(q.choices.map((id) => trainImage(trains.find((t) => t.id === id)))).size, q.choices.length);
  }
});
test("replaying recognition with the same train and RNG reveals different targets", () => {
  for (const level of Object.keys(LEVELS)) {
    const progress = defaults();
    const targets = [], images = [], names = [];
    for (let journey = 0; journey < 2; journey++) {
      const trip = createTrip({
        level, train: trains[0], trains, practice: "identify",
        rng: () => 0,
        recentQuestions: progress.recentQuestions,
      });
      for (const q of trip) {
        targets.push(q.target);
        const target = trains.find((t) => t.id === q.target);
        images.push(trainImage(target));
        names.push(target.name);
      }
      rememberTrip(progress, trip);
    }
    assert.equal(new Set(targets).size, targets.length);
    assert.equal(new Set(images).size, images.length);
    assert.equal(new Set(names).size, names.length);
    assert.ok(targets.some((id) => id !== trains[0].id));
  }
});
test("semantic question history ignores shuffled choices and decorative changes", () => {
  for (const game of allowedGames("large")) {
    const q = questionFor({ level: "large", game, train: trains[0], trains, rng: seededRandom(73) });
    const rearranged = {
      ...q,
      choices: q.choices ? [...q.choices].reverse() : undefined,
      deck: q.deck ? [...q.deck].reverse() : undefined,
      numbers: q.numbers ? [...q.numbers].reverse() : undefined,
      food: "different artwork",
      prompt: "different narration",
    };
    assert.equal(questionSignature(q), questionSignature(rearranged), game);
  }
});
test("practice generates distinct tasks and avoids previous tasks while a bank has room", () => {
  for (const level of Object.keys(LEVELS))
    for (const game of allowedGames(level)) {
      const progress = defaults();
      const first = createTrip({ level, train: trains[0], trains, practice: game, rng: () => 0 });
      const capacity = game === "sharing"
        ? Math.floor(LEVELS[level].max / 2) + (level === "small" ? 0 : Math.floor(LEVELS[level].max / 3))
        : Infinity;
      assert.equal(new Set(first.map(questionSignature)).size, Math.min(first.length, capacity), `${level}: ${game}`);
      rememberTrip(progress, first);
      const next = createTrip({
        level, train: trains[0], trains, practice: game, rng: () => 0,
        recentQuestions: progress.recentQuestions,
      });
      assert.equal(new Set(next.map(questionSignature)).size, Math.min(next.length, capacity), `${level}: ${game}`);
      assert.notEqual(questionSignature(next[0]), questionSignature(first.at(-1)), `${level}: ${game}`);
      // Small cargo/count and sharing have intentionally small age-limited banks.
      if (!(game === "sharing" && capacity < first.length * 2) && !(["count", "cargo", "balance"].includes(game) && level === "small"))
        assert.ok(next.every((q) => !first.map(questionSignature).includes(questionSignature(q))), `${level}: ${game}`);
    }
});
test("an exhausted small count bank reuses its oldest task without retry loops", () => {
  const bank = [1, 2, 3, 4, 5].map((count) => questionSignature({ level: "small", game: "count", count }));
  const q = questionFor({
    level: "small", game: "count", train: trains[0], trains,
    rng: () => 0.9, recentQuestions: bank,
  });
  assert.equal(q.answer, 1);
  const next = questionFor({
    level: "small", game: "count", train: trains[0], trains,
    rng: () => 0.9, recentQuestions: bank, excludedQuestions: [bank[0]],
  });
  assert.equal(next.answer, 2);
});
test("boarding uses meaningful changes and respects the no-cross-ten setting", () => {
  const progress = defaults();
  const observed = new Set();
  for (let seed = 0; seed < 350; seed++) {
    const q = questionFor({
      level: "large", game: "boarding", train: trains[0], trains,
      challenge: false, rng: seededRandom(seed), recentQuestions: progress.recentQuestions,
    });
    assert.ok(q.change >= 1);
    assert.ok(q.answer >= 0 && q.answer <= 20);
    if (q.operation === "add") assert.ok(q.change <= 10 - q.start % 10);
    else assert.ok(q.change <= q.start % 10);
    observed.add(q.operation);
    rememberTrip(progress, [q]);
  }
  assert.deepEqual([...observed].sort(), ["add", "subtract"]);
  let crossesTen = false;
  for (let seed = 0; seed < 200; seed++) {
    const q = questionFor({
      level: "large", game: "boarding", train: trains[0], trains,
      challenge: true, rng: seededRandom(seed),
    });
    if (q.change > (q.operation === "add" ? 10 - q.start % 10 : q.start % 10)) crossesTen = true;
  }
  assert.equal(crossesTen, true);
});
test("order tasks use varied number sets within each age range", () => {
  for (const level of Object.keys(LEVELS)) {
    const progress = defaults(), sets = new Set();
    let hasGap = false;
    for (let seed = 0; seed < 6; seed++) {
      const q = questionFor({
        level, game: "order", train: trains[0], trains, rng: () => 0,
        recentQuestions: progress.recentQuestions,
      });
      assert.equal(q.answer.length, level === "small" ? 3 : 5);
      assert.ok(q.answer.every((n) => n >= 0 && n <= LEVELS[level].max));
      assert.notDeepEqual(q.numbers, q.answer);
      sets.add(q.answer.join(","));
      hasGap ||= q.answer.some((n, i) => i > 0 && n - q.answer[i - 1] > 1);
      rememberTrip(progress, [q]);
    }
    assert.equal(sets.size, 6);
    assert.equal(hasGap, true);
  }
});
test("hints describe a method without spelling out answers", () => {
  for (const level of Object.keys(LEVELS))
    for (const game of ["count", "boarding", "order", "pattern", "clock", "compare"].filter((game) => allowedGames(level).includes(game)))
      for (let seed = 0; seed < 30; seed++) {
        const q = questionFor({ level, game, train: trains[0], trains, rng: seededRandom(seed) });
        assert.ok(q.hint.length > 0);
        assert.doesNotMatch(q.hint, /\d|零人|是零|就是|是答案/);
        if (game === "pattern" && q.kind === "shape")
          for (const shape of Object.values(SHAPES)) assert.ok(!q.hint.includes(shape.name));
      }
});
test("damaged or blocked storage never prevents play", () => {
  for (const level of ["constructor", "__proto__", "toString", {}, null])
    assert.equal(readProgress({ getItem: () => JSON.stringify({ version: 1, level }) }).level, "small");
  assert.deepEqual(readProgress({ getItem: () => "{broken" }), defaults());
  assert.deepEqual(
    readProgress({
      getItem: () => {
        throw Error();
      },
    }),
    defaults(),
  );
  assert.equal(
    saveProgress(
      {
        setItem: () => {
          throw Error();
        },
      },
      defaults(),
    ),
    false,
  );
  const valid = readProgress({
    getItem: () =>
      JSON.stringify({
        version: 1,
        level: "bogus",
        trips: -3,
        completed: ["e5", "e5", 42],
        voice: "true",
      }),
  });
  assert.equal(valid.level, "small");
  assert.equal(valid.trips, 0);
  assert.equal(valid.voice, false);
  assert.deepEqual(valid.completed, ["e5"]);
});
test("question and activity history persist, stay bounded and tolerate older saves", () => {
  const oldSave = readProgress({ getItem: () => JSON.stringify({ version: 1, level: "medium", trips: 4 }) });
  assert.deepEqual(oldSave.recentQuestions, []);
  assert.deepEqual(oldSave.recentGames, []);
  assert.equal(oldSave.trips, 4);
  const progress = defaults();
  for (let seed = 0; seed < 40; seed++) {
    const trip = createTrip({
      level: "medium", train: trains[0], trains,
      rng: seededRandom(seed), recentQuestions: progress.recentQuestions, recentGames: progress.recentGames,
    });
    assert.equal(rememberTrip(progress, trip), progress);
  }
  assert.equal(progress.recentQuestions.length, HISTORY_LIMITS.questions);
  assert.equal(progress.recentGames.length, HISTORY_LIMITS.games);
  let stored;
  assert.equal(saveProgress({ setItem: (_key, value) => { stored = value; } }, progress), true);
  const restored = readProgress({ getItem: () => stored });
  assert.deepEqual(restored.recentQuestions, progress.recentQuestions);
  assert.deepEqual(restored.recentGames, progress.recentGames);
  const malformed = readProgress({ getItem: () => JSON.stringify({
    version: 1,
    recentQuestions: [null, 23, "broken", "x".repeat(1100), "[\"small\",\"boarding\",3]", ...progress.recentQuestions],
    recentGames: [null, 23, "large:unknown", "small:boarding", "small:count:", ...progress.recentGames],
  }) });
  assert.deepEqual(malformed.recentQuestions, progress.recentQuestions);
  assert.deepEqual(malformed.recentGames, progress.recentGames);
  const corruptFields = readProgress({ getItem: () => JSON.stringify({ version: 1, recentQuestions: {}, recentGames: "count" }) });
  assert.deepEqual(corruptFields.recentQuestions, []);
  assert.deepEqual(corruptFields.recentGames, []);
});
test("practice mode and unsupported age choices are explicit", () => {
  assert.throws(() =>
    questionFor({ level: "small", game: "boarding", train: trains[0], trains }),
  );
  const trip = createTrip({
    level: "medium",
    train: trains[0],
    trains,
    practice: "count",
  });
  assert.ok(trip.every((q) => q.game === "count"));
});
