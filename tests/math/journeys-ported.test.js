// Ported from Taiwan Train Math 1.11.0 (tests/journeys.test.mjs), Copyright 2026 mars-tw. Apache-2.0.
// Changed: import/data paths for src/games/math; see docs/r48-math-room-assets.json for any adjusted assertion.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
// R48 adjustment: the 1.11.0 image files stay in the source archive until the photo batch (C line).
// existsSync now checks the byte-hashed 1.11.0 asset inventory instead of the working directory.
const sourceAssets = new Set(JSON.parse(readFileSync(new URL("../../src/games/math/data/source-assets.json", import.meta.url), "utf8")).files.map(file => file.path));
const existsSync = path => sourceAssets.has(path);
import { JOURNEYS, journeyById, journeyGames, journeyMarkup } from "../../src/games/math/journeys.js";

const gameIds = ["count", "identify", "boarding", "order", "compare", "pattern", "cargo", "memory", "clock",
  "tracks", "sharing", "treasure", "puzzle", "luggage", "maze", "program", "differences", "mosaic", "balance"];
// Check the most restrictive small-age case; optional balance access cannot
// make any route depend on arithmetic that is not available to a young child.
const smallIds = gameIds.filter(id => !["boarding", "compare", "clock", "balance"].includes(id));
const pools = {
  forest: ["tracks", "maze", "program", "identify", "puzzle", "count"],
  coast: ["differences", "compare", "clock", "mosaic", "treasure", "puzzle"],
  freight: ["luggage", "cargo", "balance", "order", "boarding", "count"],
  engineer: ["program", "tracks", "mosaic", "pattern", "puzzle", "maze"],
  picnic: ["sharing", "count", "boarding", "compare", "memory", "balance"],
  depot: ["memory", "identify", "puzzle", "differences", "order", "mosaic"],
};

test("six unique story journeys use the specified task pools and existing local illustrations", () => {
  assert.equal(JOURNEYS.length, 6);
  assert.deepEqual([...JOURNEYS.map(route => route.id)].sort(), Object.keys(pools).sort());
  assert.equal(new Set(JOURNEYS.map(route => route.id)).size, 6);
  assert.equal(new Set(JOURNEYS.map(route => route.themeCSS)).size, 6);
  for (const route of JOURNEYS) {
    assert.deepEqual(route.games, pools[route.id]);
    assert.ok(route.games.length >= 5 && route.games.every(id => gameIds.includes(id)));
    assert.equal(new Set(route.games).size, route.games.length);
    assert.ok(existsSync(route.image));
    assert.match(route.image, /^assets\/images\/[a-z0-9-]+\.webp$/);
    assert.match(route.themeCSS, /^journey-[a-z]+$/);
    assert.equal(journeyById(route.id), route);
    assert.ok(Object.isFrozen(route) && Object.isFrozen(route.games) && Object.isFrozen(route.stationLabels));
  }
  for (const id of [undefined, null, "unknown", "__proto__", {}, 3]) assert.equal(journeyById(id), null);
});

test("each age-filtered pool has enough different activities for a complete journey", () => {
  for (const [level, available, count] of [["small", smallIds, 3], ["medium", gameIds, 5], ["large", gameIds, 5]]) {
    for (const route of JOURNEYS) {
      assert.ok(route.games.filter(id => available.includes(id)).length >= count, `${route.id}/${level}`);
      assert.equal(route.stationLabels[level].length, count);
      assert.equal(new Set(route.stationLabels[level]).size, count);
      assert.ok(route.stationLabels[level].every(label => typeof label === "string" && label.length >= 3 && label.length <= 6));
    }
    const markup = journeyMarkup({ level, availableGames: available });
    assert.equal((markup.match(/data-journey=/g) || []).length, 6);
    assert.doesNotMatch(markup, /\sdisabled(?:\s|>)/);
    assert.match(markup, new RegExp(`${count} 站主題旅程`));
  }
});

test("new ticket stops extend current journeys without changing previous route recipes", () => {
  for (const route of JOURNEYS) {
    for (const version of ["1.6.0", "1.7.0"]) assert.deepEqual(journeyGames(route, version), pools[route.id]);
    const current = journeyGames(route);
    assert.equal(current.includes("tickets"), ["freight", "picnic"].includes(route.id));
    assert.deepEqual(route.games, pools[route.id]);
  }
  const markup = journeyMarkup({ level: "large", availableGames: [...gameIds, "tickets"] });
  assert.equal((markup.match(/分配車票/g) || []).length, 2);
});

test("the short narratives have a concrete problem, a task and an arrival rather than answers or real-route claims", () => {
  for (const route of JOURNEYS) {
    const count = (route.description.match(/\p{Script=Han}/gu) || []).length;
    assert.ok(count >= 30 && count <= 45, `${route.id}: ${count} Chinese characters`);
    assert.match(route.description, /等著|還暗著|混在一起|還不能|還沒|散開/);
    assert.match(route.description, /沿路|沿途|幫忙|試著|一起|找回/);
    assert.ok(route.departureText.length >= 15 && route.arrivalText.length >= 15);
    assert.match(route.arrivalText, /送到了|拼好了|送上車|試車完成|整理好了/);
    assert.doesNotMatch([route.description, route.departureText, route.arrivalText].join(""),
      /\d|答案|等於|免費抽獎|付費|倒數|限時|真實路線|實際鐵路|營運路線/);
  }
  assert.match(journeyMarkup({ availableGames: smallIds }), /想像的主題旅程/);
});

test("travelled badges describe collection while keeping every completed route playable", () => {
  const markup = journeyMarkup({ level: "large", availableGames: gameIds, completed: ["forest", "forest", "depot"] });
  assert.equal((markup.match(/class="journey-badge"/g) || []).length, 2);
  assert.equal((markup.match(/journey-travelled/g) || []).length, 2);
  assert.equal((markup.match(/已旅行，可以再次出發/g) || []).length, 2);
  assert.doesNotMatch(markup, /\sdisabled(?:\s|>)/);
  const fresh = journeyMarkup({ level: "large", availableGames: gameIds });
  assert.doesNotMatch(fresh, /class="journey-badge"|journey-travelled|✓ 已旅行/);
});

test("markup filters external values, uses the supplied escaper and refuses insufficient task pools", () => {
  const hostile = '"><script>alert(1)</script><img src=x onerror=alert(1)>';
  const markup = journeyMarkup({ level: "small", availableGames: [...smallIds, hostile], completed: [hostile, "forest"] });
  assert.doesNotMatch(markup, /<script|onerror=|alert\(/);
  assert.equal((markup.match(/class="journey-badge"/g) || []).length, 1);
  assert.equal(journeyMarkup({ level: hostile, availableGames: gameIds }), "");
  assert.equal(journeyMarkup({ level: "constructor", availableGames: gameIds }), "");
  const calls = [];
  const escaped = journeyMarkup({ level: "large", availableGames: gameIds, esc(value) {
    calls.push(String(value));
    return String(value).replace(/郵/g, "&#x90F5;");
  } });
  assert.ok(calls.includes("今天想去哪裡？") && calls.includes("forest") && calls.includes("assets/images/alishan.webp"));
  assert.match(escaped, /森林&#x90F5;差/);
  const unavailable = journeyMarkup({ level: "large", availableGames: ["puzzle"] });
  assert.equal((unavailable.match(/\sdisabled\s/g) || []).length, 6);
  assert.match(unavailable, /換個難度再出發/);
});
