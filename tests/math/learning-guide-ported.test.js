// Ported from Taiwan Train Math 1.11.0 (tests/learning-guide.test.mjs), Copyright 2026 mars-tw. Apache-2.0.
// Changed: import/data paths for src/games/math; see docs/r48-math-room-assets.json for any adjusted assertion.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GAMES, allowedGames, createTrip, seededRandom } from "../../src/games/math/engine.js";
import { learningGuide } from "../../src/games/math/learning-guide.js";
const trains = JSON.parse(readFileSync(new URL("../../src/games/math/data/trains.json", import.meta.url), "utf8")).trains;
const hidden = ["answer", "solution", "target", "path", "step", "unit", "sequence", "choices", "count", "left", "right", "start", "finish", "change", "hour", "minute", "numbers", "walls", "tiles", "differences", "itemsLeft", "itemsRight", "pairs", "deck", "image"];
function guardQuestion(q) {
  for (const key of hidden) Object.defineProperty(q, key, { configurable: true, get() { assert.fail(`guide must not read hidden ${key}`); } });
  return Object.freeze(q);
}
function guideShape(guide) {
  assert.deepEqual(Object.keys(guide).sort(), ["action", "help", "success", "title"]);
  for (const value of Object.values(guide)) assert.equal(typeof value, "string");
  assert.ok(Object.values(guide).every(value => value.trim().length > 0));
}

test("all twenty games and all age-appropriate older recipes receive complete guidance without hidden answers", () => {
  const seen = new Set();
  for (const contentVersion of ["1.5.0", "1.6.0", "1.7.0", "1.8.0"]) for (const level of ["small", "medium", "large"]) for (const game of allowedGames(level)) {
    if (contentVersion !== "1.8.0" && game === "tickets" || contentVersion === "1.5.0" && ["program", "balance", "mosaic", "differences"].includes(game)) continue;
    const questions = createTrip({ level, train: trains[0], trains, practice: game, contentVersion, rng: seededRandom(125) });
    for (const q of questions) {
      const original = JSON.stringify(q), guide = learningGuide(q);
      guideShape(guide); assert.equal(JSON.stringify(q), original, "presentation must not change the recipe");
      const protectedQ = guardQuestion(q); guideShape(learningGuide(protectedQ));
      seen.add(game);
    }
  }
  assert.deepEqual([...seen].sort(), Object.keys(GAMES).sort());
});

test("short titles keep necessary public operands, quantities and named targets", () => {
  const examples = [
    [{ game: "boarding", operation: "add", prompt: "車上有 2 人，又上來 3 人，現在有幾人？" }, ["2", "3", "上車"]],
    [{ game: "boarding", operation: "subtract", prompt: "車上有 20 人，下車 7 人，還有幾人？" }, ["20", "7", "下車"]],
    [{ game: "cargo", prompt: "請幫貨運列車裝 12 箱貨物。" }, ["12", "箱"]],
    [{ game: "sharing", prompt: "把 12 份點心，分給 3 位朋友，讓每位一樣多。" }, ["12", "3", "全分完", "一樣多"]],
    [{ game: "treasure", prompt: "山海風景裡，找出 5 個貝殼。" }, ["5", "貝殼"]],
    [{ game: "balance", prompt: "幫貨運列車配好重量，和 10 公斤的貨物一樣重。" }, ["10", "公斤"]],
    [{ game: "identify", prompt: "請找到型號是 EMU600 的列車。" }, ["EMU600"]],
    [{ game: "puzzle", prompt: "把DR1000 柴油客車的照片拼回來。" }, ["DR1000 柴油客車"]],
    [{ game: "mosaic", prompt: "照著小樣本，把小火車的圖形拼出來。" }, ["小火車"]],
    [{ game: "differences", prompt: "比較兩幅森林小站圖，找出 4 處不同。" }, ["森林小站", "4"]],
  ];
  for (const [q, words] of examples) {
    const title = learningGuide(guardQuestion(q)).title;
    for (const word of words) assert.ok(title.includes(word), `${q.game} title should keep ${word}`);
  }
  assert.equal(learningGuide({ game: "cargo", prompt: "舊題：裝 8 箱，再檢查訂單。" }).title, "舊題：裝 8 箱，再檢查訂單。");
  assert.equal(learningGuide({ game: "luggage", criteria: "color", prompt: "請把 3 件紅色行李放入籃子。" }).title, "把 3 件紅色行李放入籃子。");
});

test("methods do not supply the arithmetic result, pattern increment, matching location or route", () => {
  const math = learningGuide(guardQuestion({ game: "boarding", operation: "add", prompt: "車上有 2 人，又上來 3 人，現在有幾人？" }));
  assert.doesNotMatch(math.help, /5|五|等於/); assert.doesNotMatch(math.success, /5|五/);
  const pattern = learningGuide(guardQuestion({ game: "pattern", kind: "number", prompt: "每次多一樣多，下一節車廂是幾號？" }));
  assert.match(pattern.help, /比較相鄰數字/); assert.doesNotMatch(pattern.help, /\d|答案|下一個是/);
  for (const game of ["puzzle", "tracks", "maze", "program", "memory", "differences", "tickets"]) {
    const guide = learningGuide(guardQuestion({ game }));
    assert.doesNotMatch(guide.help, /第\s*\d|先往[上下左右]|接著往|放第|還差\s*\d|已付|答案是/);
  }
  assert.match(learningGuide({ game: "compare" }).action, /左邊、右邊或一樣多/);
  assert.match(learningGuide({ game: "tickets" }).help, /每枚寫幾點.*好幾枚/);
  assert.match(learningGuide({ game: "count", level: "small" }).action, /數一次，再選點點/);
  assert.match(learningGuide({ game: "count", level: "medium" }).action, /數一次，再選人數/);
  assert.match(learningGuide({ game: "boarding" }).help, /上車.*下車/);
});

test("dynamic next actions depend only on already visible selections and retain zero as a valid selection", () => {
  const qPuzzle = guardQuestion({ game: "puzzle", prompt: "把EMU700的照片拼回來。" });
  assert.match(learningGuide(qPuzzle, { puzzle: { selectedPiece: 0 } }).action, /點一個空格/);
  for (const selectedPiece of [null, -1, "0", undefined]) assert.match(learningGuide(qPuzzle, { puzzle: { selectedPiece } }).action, /先點一片/);
  assert.match(learningGuide({ game: "luggage", criteria: "color" }, { explorer: { luggageSelected: 0 } }).action, /點想放的籃子/);
  assert.match(learningGuide({ game: "luggage", criteria: "both" }).help, /顏色.*形狀.*兩個/);
  assert.match(learningGuide({ game: "memory" }, { memory: { open: [] } }).action, /先翻一張/);
  assert.match(learningGuide({ game: "memory" }, { memory: { open: [0] } }).action, /再翻一張/);
  assert.match(learningGuide({ game: "memory" }, { memory: { open: [0, 3] } }).action, /再試一組.*蓋回/);
  assert.match(learningGuide({ game: "memory" }, { memoryPeek: true }).action, /記住了/);
  assert.match(learningGuide({ game: "program" }, { workshop: { commands: ["right"] } }).action, /按「出發」/);
  assert.match(learningGuide({ game: "program" }, { programRunning: true }).action, /停車/);
  assert.match(learningGuide({ game: "program" }, { workshop: { programChecked: true } }).action, /刪掉/);
  assert.match(learningGuide({ game: "tickets" }, { tickets: { activeTicket: 0 } }).action, /點一枚代幣/);
  assert.match(learningGuide({ game: "tickets" }, { tickets: { checked: true } }).action, /取回/);
});

test("guidance preserves visible work and never calculates or grades it", () => {
  const trip = { puzzle: { selectedPiece: 0 }, memory: { open: [0, 1] }, tickets: { activeTicket: 0, checked: true }, workshop: { commands: ["up"], weights: [5], programChecked: false } };
  for (const [object, key] of [[trip.puzzle, "placements"], [trip.memory, "matched"], [trip.tickets, "assignments"], [trip.workshop, "programTrace"], [trip.workshop, "programPosition"], [trip.workshop, "balanceTilt"]]) Object.defineProperty(object, key, { get() { assert.fail(`guide must not infer from ${key}`); } });
  Object.freeze(trip.puzzle); Object.freeze(trip.memory.open); Object.freeze(trip.memory); Object.freeze(trip.tickets); Object.freeze(trip.workshop.commands); Object.freeze(trip.workshop.weights); Object.freeze(trip.workshop); Object.freeze(trip);
  for (const game of Object.keys(GAMES)) guideShape(learningGuide(guardQuestion({ game }), trip));
  assert.deepEqual(trip.workshop.commands, ["up"]); assert.deepEqual(trip.workshop.weights, [5]); assert.equal(trip.tickets.checked, true);
});

test("malformed or unsupported inputs have neutral guidance and returned values are independent", () => {
  for (const q of [undefined, null, {}, { game: "__proto__" }, { game: "constructor" }, { game: "unknown" }]) guideShape(learningGuide(q));
  const original = learningGuide({ game: "count", level: "small" }); original.title = "changed";
  assert.notEqual(learningGuide({ game: "count", level: "small" }).title, original.title);
  for (const trip of [undefined, null, {}, { puzzle: null, memory: null, explorer: null, workshop: null, tickets: null }]) {
    for (const game of Object.keys(GAMES)) guideShape(learningGuide({ game }, trip));
  }
});
