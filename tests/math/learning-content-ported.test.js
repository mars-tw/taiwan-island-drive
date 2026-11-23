// Ported from Taiwan Train Math 1.11.0 (tests/learning-content.test.mjs), Copyright 2026 mars-tw. Apache-2.0.
// Changed: import/data paths for src/games/math; see docs/r48-math-room-assets.json for any adjusted assertion.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { LEARNING_SOURCES, TRAIN_DISCOVERIES, PLACE_DISCOVERIES, learningDiscovery } from "../../src/games/math/learning-content.js";
const { trains } = JSON.parse(readFileSync(new URL("../../src/games/math/data/trains.json", import.meta.url), "utf8"));

test("every catalogue ID has one brief vehicle fact with traceable source metadata", () => {
  assert.equal(trains.length, 59);
  assert.deepEqual(Object.keys(TRAIN_DISCOVERIES).sort(), trains.map(train => train.id).sort());
  for (const train of trains) {
    const facts = TRAIN_DISCOVERIES[train.id];
    assert.ok(Object.isFrozen(facts)); assert.equal(facts.length, 1);
    const item = facts[0];
    assert.equal(item.kind, "train"); assert.equal(item.label, "認識火車");
    assert.ok([...item.text].length <= 60, item.text);
    assert.equal((item.text.match(/。/g) || []).length, 1, "one sentence per small discovery");
    assert.doesNotMatch(item.text, /[<>\r\n]|答案|乘客有|正確數字|下一步往|今日|目前|已抵|未營運|開始營運/);
    assert.ok(item.sourceIds.length > 0);
    assert.deepEqual(item.sources, item.sourceIds.map(id => LEARNING_SOURCES[id]));
    assert.ok(Object.isFrozen(item) && Object.isFrozen(item.sources) && Object.isFrozen(item.sourceIds));
  }
  for (const source of Object.values(LEARNING_SOURCES)) {
    const url = new URL(source.url);
    assert.equal(url.protocol, "https:");
    assert.match(url.hostname, /(?:\.gov\.tw|\.taiwan\.net\.tw|\.taisugar\.com\.tw|\.thsrc\.com\.tw|\.jreast\.co\.jp|\.jr-central\.co\.jp|\.jr-central-global\.com)$/);
    assert.equal(source.checkedAt, "2026-10-06"); assert.ok(source.title && Object.isFrozen(source));
  }
});

test("six actual Taiwan places span mountain, sea, field and city without borrowing a story image or itinerary", () => {
  assert.equal(PLACE_DISCOVERIES.length, 6);
  assert.equal(new Set(PLACE_DISCOVERIES.map(item => item.id)).size, 6);
  assert.deepEqual([...new Set(PLACE_DISCOVERIES.map(item => item.place.landscape))].sort(), ["city", "field", "mountain", "sea"]);
  for (const item of PLACE_DISCOVERIES) {
    assert.equal(item.kind, "place"); assert.equal(item.label, "真實台灣");
    assert.ok(Object.isFrozen(item.place)); assert.ok(item.place.name && item.place.region);
    assert.ok([...item.text].length <= 60); assert.ok(item.sources.length > 0);
    assert.equal(item.image, undefined); assert.equal(item.route, undefined); assert.equal(item.trainId, undefined);
    assert.doesNotMatch(item.text, /星光|想像|下一站|這台|搭這|照片|票價|時刻|每天|營運|可搭乘/);
    for (const source of item.sources) assert.match(new URL(source.url).hostname, /\.gov\.tw$|\.taiwan\.net\.tw$|\.taisugar\.com\.tw$/);
  }
  assert.match(PLACE_DISCOVERIES.find(item => item.id === "place-guishan").text, /宜蘭外海/);
  assert.match(PLACE_DISCOVERIES.find(item => item.id === "place-suantou").text, /以前.*甘蔗/);
});

test("post-task selection is deterministic, cycles topics and requires no question or random source", () => {
  for (const { id } of trains) {
    assert.equal(learningDiscovery(id).kind, "train");
    for (let index = 0; index < 100; index++) {
      const first = learningDiscovery(id, { index }), second = learningDiscovery(id, { index });
      assert.equal(first, second);
      assert.equal(learningDiscovery(id, { index, topic: "train" }), TRAIN_DISCOVERIES[id][0]);
      if (!["e5", "n700s", "l0"].includes(id)) assert.equal(learningDiscovery(id, { index, topic: "place" }).kind, "place");
    }
  }
  assert.deepEqual([0,1,2,3].map(index => learningDiscovery("700t", { index }).kind), ["train", "place", "place", "place"]);
  assert.equal(learningDiscovery("700t", { index:4 }), learningDiscovery("700t", { index:0 }));
  for (const id of ["e5", "n700s", "l0"]) assert.equal(learningDiscovery(id, { topic:"place" }).kind,"general");
});

test("aliases, preserved cars and future designs do not invent separate models, missing photos or current service", () => {
  assert.equal(TRAIN_DISCOVERIES.dr1000, TRAIN_DISCOVERIES.drc1000);
  assert.equal(learningDiscovery("dr1000"), learningDiscovery("drc1000"));
  assert.match(learningDiscovery("drc1000").text, /同一批/);
  assert.match(learningDiscovery("n700st").text, /T 代表台灣/);
  assert.doesNotMatch(learningDiscovery("n700st").text, /2027|載客|營運|抵台/);
  assert.match(learningDiscovery("l0").text, /日本.*試驗/);
  assert.doesNotMatch(learningDiscovery("ldk59").text, /照片|車頭|今天|復駛|可搭/);
  for (const id of ["ct273","dt668","ck124","ck101","ldk59"]) assert.match(learningDiscovery(id).text,/車號/);
});

test("unknown or unsafe identifiers cannot insert unchecked names, places or markup", () => {
  const fallback = learningDiscovery("unknown");
  assert.equal(fallback.kind, "general"); assert.deepEqual(fallback.sources, []);
  for (const id of [null,undefined,0,false,Symbol("id"),[],{id:"700t"},"__proto__","constructor","toString","<script>unknown</script>","star-express","railway-map"]) {
    assert.equal(learningDiscovery(id), fallback);
    assert.doesNotMatch(learningDiscovery(id).text, /unknown|script|星光|宜蘭|嘉義|高美/);
  }
  const unsafe = { toString(){ throw Error("never coerce an identifier"); } };
  assert.equal(learningDiscovery(unsafe),fallback);
  for (const options of [null, false, "place", [], {index:-1}, {index:NaN}, {index:Infinity}, {index:"2"}, {index:1.5}])
    assert.equal(learningDiscovery("700t", options), learningDiscovery("700t"));
  assert.throws(() => { TRAIN_DISCOVERIES["700t"][0].text = "tampered"; }, TypeError);
  assert.equal(learningDiscovery("700t").kind,"train");
});
