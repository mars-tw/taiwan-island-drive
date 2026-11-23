import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// A tiny in-memory localStorage so the student record can be written in Node.
const store = new Map();
globalThis.localStorage = { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
const { normalizeAge, ageFromSettings, numberChoices, createRng } = await import('../../src/games/puzzles/common.js');
const { readProgress, recordClear, unlockedLevel, normalizeProgress, PROGRESS_SECTION } = await import('../../src/games/puzzles/progress.js');
const { readStudent } = await import('../../src/shared/student-save.js');

const read = path => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('R48 age bands: accepts the math room spellings and falls back on childMode', () => {
  assert.equal(normalizeAge('3-4'), '3-4');
  assert.equal(normalizeAge('5～6'), '5-6');
  assert.equal(normalizeAge('7–8 歲'), '7-8');
  assert.equal(normalizeAge(4), '3-4');
  assert.equal(normalizeAge(8), '7-8');
  assert.equal(normalizeAge('nonsense'), '5-6');
  assert.equal(ageFromSettings({ childMode: true }), '3-4');
  assert.equal(ageFromSettings({ childMode: false }), '5-6');
  assert.equal(ageFromSettings({ childMode: true, ageBand: '7-8' }), '7-8');
  assert.equal(ageFromSettings({}), '3-4');
});

test('R48 answer choices: three distinct, sorted, inside the range', () => {
  const rng = createRng(5);
  for (let answer = 0; answer <= 20; answer++) {
    const choices = numberChoices(answer, { min: 0, max: 20, rng, near: [answer + 7, -3] });
    assert.equal(choices.length, 3);
    assert.equal(new Set(choices).size, 3);
    assert.ok(choices.includes(answer));
    assert.deepEqual([...choices].sort((a, b) => a - b), choices);
    assert.ok(choices.every(c => c >= 0 && c <= 20));
  }
});

test('R48 progress: levels unlock one by one per game and age, damaged data is ignored', () => {
  assert.equal(unlockedLevel(readProgress(), 'switch-platform', '5-6'), 0);
  assert.equal(recordClear('switch-platform', '5-6', 0), true);
  assert.equal(unlockedLevel(readProgress(), 'switch-platform', '5-6'), 1);
  recordClear('switch-platform', '5-6', 5);
  assert.equal(unlockedLevel(readProgress(), 'switch-platform', '5-6'), 5, 'the last level stays playable');
  assert.equal(readProgress().games['switch-platform']['5-6'].cleared, 6);
  assert.equal(unlockedLevel(readProgress(), 'switch-platform', '3-4'), 0, 'ages keep separate progress');
  assert.equal(recordClear('unknown-game', '5-6', 1), false);
  assert.ok(readStudent().sections[PROGRESS_SECTION], 'saved in the one student record');
  const fixed = normalizeProgress({ games: { 'shunting-yard': { '3-4': { cleared: 99, plays: -1 } } } });
  assert.deepEqual(fixed.games['shunting-yard']['3-4'], { cleared: 0, plays: 0 });
});

test('R48 registry: three puzzles for 拼搭與方向, two math games for 數學, each with an open function', () => {
  const index = read('src/games/puzzles/index.js');
  for (const fn of ['openSwitchPlatform', 'openShuntingYard', 'openSingleLineMeet', 'openBoardingCount', 'openPlatformTimetable', 'openRailPlay', 'railGamesForRoom']) assert.match(index, new RegExp(`\\b${fn}\\b`));
  const rooms = ['switch-platform', 'shunting-yard', 'single-line-meet'].map(f => read(`src/games/puzzles/${f}.js`).match(/room: '([^']+)'/)[1]);
  assert.deepEqual(rooms, ['拼搭與方向', '拼搭與方向', '拼搭與方向']);
  const math = ['boarding-count', 'platform-timetable'].map(f => read(`src/games/math/${f}.js`).match(/room: '([^']+)'/)[1]);
  assert.deepEqual(math, ['數學', '數學']);
});

test('R48 temporary entry: one button in the train page settings, not on the home page', () => {
  const train = read('train/index.html');
  assert.match(train, /id="rail-play-trial"[^>]*>火車謎題與數學（試玩）</);
  assert.match(train, /src="\/src\/games\/puzzles\/trial-entry\.js"/);
  assert.doesNotMatch(read('index.html'), /rail-play/, 'home page entry belongs to the math room line');
  assert.doesNotMatch(read('src/games/train/main.js'), /rail-play|puzzles\//, 'train driving code is untouched');
});

test('R48 child-safe screen contract: big buttons, no timers, three layouts, reduced motion', () => {
  const css = read('src/games/puzzles/rail-play.css');
  assert.match(css, /#rail-play button\{[^}]*min-width:60px;min-height:60px/);
  assert.match(css, /@media \(max-width:600px\) and \(orientation:portrait\)/);
  assert.match(css, /@media \(max-height:520px\) and \(orientation:landscape\)/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  for (const file of ['puzzles/rail-shell.js', 'puzzles/switch-platform-ui.js', 'puzzles/shunting-yard-ui.js', 'puzzles/single-line-meet-ui.js', 'math/boarding-count-ui.js', 'math/platform-timetable-ui.js']) {
    const source = read(`src/games/${file}`);
    assert.doesNotMatch(source, /setInterval|倒數|countdown|扣分/, `${file} must not time or punish`);
  }
  const shell = read('src/games/puzzles/rail-shell.js');
  assert.match(shell, /再玩一次/);
  assert.match(shell, /speakNative/);
  assert.match(read('src/games/puzzles/shunting-yard-ui.js'), /pointerdown[\s\S]*pointerup/, 'shunting works by drag as well as tap');
});
