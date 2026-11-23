import test from 'node:test';
import assert from 'node:assert/strict';
import {
  switchLevels, createSwitchRound, routeFor, switchesFor, toggleSwitch, departTrain, switchHint, isSwitchRoundDone, currentTrain,
  routeSegments, SWITCH_LAYOUTS, TRAIN_STOP_U, TRAIN_WAIT_U,
} from '../../src/games/puzzles/switch-platform.js';

const AGES = ['3-4', '5-6', '7-8'];
const rank = l => [l.switches, l.trains, l.attrs === 'both' ? 1 : 0];
const notBelow = (a, b) => a[0] > b[0] || (a[0] === b[0] && (a[1] > b[1] || (a[1] === b[1] && a[2] >= b[2])));

/** Plays a round the way a child would: toggle only the switches that differ, then depart. */
function solve(round) {
  let r = round, toggles = 0;
  while (!isSwitchRoundDone(r)) {
    const want = switchesFor(r.layout, currentTrain(r).target, r.switches);
    for (const id of Object.keys(want)) if (want[id] !== r.switches[id]) { r = toggleSwitch(r, id); toggles++; }
    const { round: next, result } = departTrain(r);
    assert.equal(result.kind, 'arrived');
    r = next;
  }
  return { r, toggles };
}

test('R48 switch platform: six levels per age, harder each step, 2 → 3 switches and colour → colour+shape', () => {
  for (const age of AGES) {
    const levels = switchLevels(age);
    assert.equal(levels.length, 6);
    for (let i = 1; i < 6; i++) assert.ok(notBelow(rank(levels[i]), rank(levels[i - 1])), `${age} level ${i + 1} is not easier than ${i}`);
    assert.ok(levels.some(l => l.switches === 2) && levels.some(l => l.switches === 3), `${age} must grow from 2 to 3 switches`);
  }
  assert.ok(switchLevels('3-4').every(l => l.attrs === 'color'), '3～4 歲 only match colours');
  assert.equal(switchLevels('7-8')[0].switches, 2);
  assert.ok(switchLevels('7-8').filter(l => l.attrs === 'both').length >= 3);
  assert.deepEqual(switchLevels('7-8').map(l => l.trains), [1, 2, 1, 2, 3, 4]);
});

test('R48 switch platform: every generated round is fair and fully solvable', () => {
  for (const age of AGES) for (let level = 0; level < 6; level++) for (let seed = 1; seed <= 40; seed++) {
    const round = createSwitchRound({ age, level, seed: seed * 977 });
    const layout = SWITCH_LAYOUTS[round.layout];
    assert.equal(round.platforms.length, Object.keys(layout.platforms).length);
    const plates = round.platforms.map(p => `${p.color}/${p.shape}`);
    assert.equal(new Set(plates).size, plates.length, 'no two platforms share both colour and shape');
    if (round.attrs === 'color') assert.equal(new Set(round.platforms.map(p => p.color)).size, plates.length);
    else {
      assert.equal(new Set(round.platforms.map(p => p.color)).size, 2, 'colour alone is not enough');
      assert.equal(new Set(round.platforms.map(p => p.shape)).size, 2, 'shape alone is not enough');
    }
    assert.equal(new Set(round.trains.map(t => t.target)).size, round.trains.length);
    for (const t of round.trains) { const p = round.platforms.find(x => x.id === t.target); assert.equal(t.color, p.color); assert.equal(t.shape, p.shape); }
    assert.notEqual(routeFor(round.layout, round.switches).platform, round.trains[0].target, 'the first train always needs a switch turned');
    const { r, toggles } = solve(round);
    assert.ok(toggles >= 1);
    assert.equal(Object.keys(r.parked).length, round.trains.length);
  }
});

test('R48 switch platform: wrong platforms are a rehearsal with a method hint, never the switch to press', () => {
  const round = createSwitchRound({ age: '5-6', level: 0, seed: 3 });
  const { round: after, result } = departTrain(round);
  assert.equal(result.kind, 'wrong');
  assert.equal(after.current, 0, 'the same train tries again');
  assert.equal(after.tries, 1);
  const hint = switchHint(after, result);
  assert.match(hint, /沿著亮起來的路/);
  assert.doesNotMatch(hint, /道岔 ?\d|第 ?\d 個道岔|往上|往下/);
});

test('R48 switch platform: colour+shape levels explain which attribute was missed; parked platforms are occupied', () => {
  let found = { shape: false, color: false, occupied: false };
  for (let seed = 1; seed <= 60 && !(found.shape && found.color && found.occupied); seed++) {
    const round = createSwitchRound({ age: '7-8', level: 4, seed });
    const train = currentTrain(round), target = round.platforms.find(p => p.id === train.target);
    for (const p of round.platforms) {
      if (p.id === train.target) continue;
      const states = switchesFor(round.layout, p.id, round.switches);
      const { result } = departTrain({ ...round, switches: states });
      if (p.color === target.color) { assert.equal(result.reason, 'shape'); assert.match(switchHint(round, result), /形狀/); found.shape = true; }
      else if (p.shape === target.shape) { assert.equal(result.reason, 'color'); assert.match(switchHint(round, result), /顏色/); found.color = true; }
    }
    const first = departTrain({ ...round, switches: switchesFor(round.layout, train.target, round.switches) }).round;
    const second = departTrain({ ...first, switches: switchesFor(round.layout, train.target, first.switches) });
    assert.equal(second.result.kind, 'occupied');
    assert.match(switchHint(first, second.result), /已經停了列車/);
    found.occupied = true;
  }
  assert.deepEqual(found, { shape: true, color: true, occupied: true });
});

test('R48 switch platform: the animated route starts at the waiting spot and stops at the platform', () => {
  for (const id of Object.keys(SWITCH_LAYOUTS)) for (const platform of Object.keys(SWITCH_LAYOUTS[id].platforms)) {
    const route = routeFor(id, switchesFor(id, platform));
    assert.equal(route.platform, platform);
    const segments = routeSegments(id, route.nodes);
    assert.deepEqual(segments[0].to, [TRAIN_WAIT_U, SWITCH_LAYOUTS[id].entry[1]]);
    assert.deepEqual(segments.at(-1).to, [TRAIN_STOP_U, SWITCH_LAYOUTS[id].platforms[platform].v]);
  }
});
