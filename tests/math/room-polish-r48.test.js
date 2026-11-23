import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createSwitchRound, departTrain, switchHint } from '../../src/games/puzzles/switch-platform.js';
import { RAIL_CATALOG } from '../../src/games/puzzles/catalog.js';

const read = path => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('R48 polish: kid-facing switch hints say "黃色的箭頭" instead of the railway word 道岔', () => {
  for (const age of ['3-4', '5-6', '7-8']) {
    const round = createSwitchRound({ age, level: 0, seed: 3 });
    const start = switchHint(round);
    assert.match(start, /黃色的箭頭/);
    assert.doesNotMatch(start, /道岔/);
    const { round: after, result } = departTrain(round);
    if (result.kind === 'wrong') assert.doesNotMatch(switchHint(after, result), /道岔/);
  }
  assert.doesNotMatch(RAIL_CATALOG.find(game => game.id === 'switch-platform').blurb, /道岔/);
});

test('R48 polish: short landscape room shows at least two rows of cards and the "older kids" list says it opens', () => {
  const css = read('src/games/math/room.css');
  const landscape = css.slice(css.indexOf('@media (max-height:500px) and (orientation:landscape){'));
  assert.match(landscape, /\.room-card-copy>span\{display:none\}/, 'card descriptions drop out on a short landscape screen');
  assert.match(landscape, /#math-room \.room-card\{min-height:72px/);
  assert.match(css, /@media \(max-height:500px\) and \(orientation:landscape\) and \(min-width:760px\)\{[^}]*\.room-home \.room-body\{display:grid/, 'heading and tabs share one row when wide enough');
  assert.match(css, /\.room-later>summary::after\{content:'打開看看 ▾'/);
  assert.match(css, /\.room-later\[open\]>summary::after\{content:'收起 ▴'\}/);
  assert.match(css, /#math-room button\{min-width:60px;min-height:60px\}/, 'buttons stay child-sized');
});
