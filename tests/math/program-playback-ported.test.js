// Ported from Taiwan Train Math 1.11.0 (tests/program-playback.test.mjs), Copyright 2026 mars-tw. Apache-2.0.
// Changed: import/data paths for src/games/math; see docs/r48-math-room-assets.json for any adjusted assertion.
import test from "node:test";
import assert from "node:assert/strict";
import { createProgramPlayback } from "../../src/games/math/program-playback.js";
function fixture() {
  const timers=[],canceled=[],steps=[],done=[];
  const player=createProgramPlayback({schedule:callback=>{timers.push(callback);return timers.length-1;},cancel:id=>canceled.push(id)});
  const callbacks={onStep:step=>steps.push(step),onDone:result=>done.push(result)};
  return {player,timers,canceled,steps,done,callbacks};
}
test("a child's plan moves one actual cell per tick and completes only after the final visible step",()=>{
  const h=fixture(), result={position:4,trace:[0,1,4],arrived:true,blocked:false};
  h.player.start(result,h.callbacks);assert.deepEqual(h.steps.map(s=>s.position),[0]);assert.equal(h.done.length,0);
  h.timers[0]();assert.deepEqual(h.steps.at(-1).trace,[0,1]);assert.equal(h.done.length,0);
  h.timers[1]();assert.equal(h.steps.at(-1).position,4);assert.equal(h.done.length,1);
  h.player.stop();h.timers[1]();assert.equal(h.done.length,1,"arrival finishes immediately and cannot be lost or awarded twice");
});
test("stopping or replacing a plan prevents stale ticks from moving or finishing a different journey",()=>{
  const h=fixture();h.player.start({position:1,trace:[0,1]},h.callbacks);h.player.stop();h.timers[0]();
  assert.equal(h.steps.length,1);assert.equal(h.done.length,0);assert.deepEqual(h.canceled,[0]);
  h.player.start({position:2,trace:[0,2]},h.callbacks);h.player.start({position:3,trace:[0,3]},h.callbacks);
  h.timers[1]();assert.equal(h.steps.at(-1).position,0);h.timers[2]();assert.equal(h.steps.at(-1).position,3);
  assert.equal(h.done[0].position,3);
});
test("a blocked first command remains visibly at the start before reporting its stop",()=>{
  const h=fixture();h.player.start({position:0,trace:[0],blocked:true,arrived:false},h.callbacks);
  assert.equal(h.steps[0].position,0);assert.equal(h.done[0].blocked,true);
  assert.throws(()=>h.player.start({position:1,trace:[0,,1]},h.callbacks));
});
