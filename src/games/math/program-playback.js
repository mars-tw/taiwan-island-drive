// Ported from Taiwan Train Math 1.11.0 (src/program-playback.js), Copyright 2026 mars-tw.
// Code: Apache-2.0; original educational text: CC-BY-4.0.
// Changed for the academy: header added, line endings normalised; logic unchanged.
// See public/licenses/taiwan-train-math/NOTICE.txt and docs/r48-math-room-assets.json.
export function createProgramPlayback({ schedule = setTimeout, cancel = clearTimeout, delay = 420 } = {}) {
  let active = null;
  function stop() {
    if (active?.timer !== undefined) cancel(active.timer);
    active = null;
  }
  return {
    stop,
    start(result, { onStep, onDone }) {
      stop();
      if (!Array.isArray(result?.trace) || result.trace.length < 1 || result.trace.length > 64
        || Array.from(result.trace).some(position => !Number.isInteger(position) || position < 0)
        || result.position !== result.trace.at(-1) || typeof onStep !== "function" || typeof onDone !== "function")
        throw new Error("Invalid program playback");
      const run = { timer: undefined, index: 0, trace: [...result.trace] };
      active = run;
      function step() {
        if (active !== run) return;
        if (run.index >= run.trace.length) { active = null; onDone(result); return; }
        onStep({ position: run.trace[run.index], trace: run.trace.slice(0, run.index + 1), index: run.index });
        run.index++;
        if (active !== run) return;
        if (run.index === run.trace.length) { active = null; onDone(result); return; }
        run.timer = schedule(step, typeof delay === "function" ? delay() : delay);
      }
      step();
    },
  };
}
