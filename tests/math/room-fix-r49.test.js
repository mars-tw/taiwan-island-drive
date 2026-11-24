import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { phraseHtml } from '../../src/shared/phrase-wrap.js';
import { registerMathGame, mathGames } from '../../src/games/math/room-registry.js';
import { registerRailGames } from '../../src/games/puzzles/math-room.js';
import { createSwitchRound, switchHint } from '../../src/games/puzzles/switch-platform.js';

const read = path => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const unwrap = html => html.replaceAll('<wbr>', '');
// Words the R49 reviewer saw split across lines, plus a few more that ICU word breaking cuts into single characters.
const KEEP = ['分車', '月台', '代幣', '色塊', '一樣多', '下一節', '自己', '列車', '方向', '哪裡', '車廂', '調車單', '剩下'];

test('R49 fix: phraseHtml only allows a break between two real words, never inside one, and keeps the text unchanged', () => {
  const samples = ['同一班列車，裝滿、分車，再算剩下。', '看看車廂的規律，接上下一節。', '照著小圖，選色塊拼出自己的圖案。',
    '選目的地，分配有限的代幣，幫每張車票付剛好。', '親手分點心，讓朋友們一樣多。', '點黃色的箭頭換軌道，讓列車開到一樣顏色的月台。'];
  const undo = registerRailGames(registerMathGame);
  try {
    for (const game of mathGames()) samples.push(game.description);
  } finally { undo.forEach(fn => fn()); }
  for (const age of ['3-4', '5-6', '7-8']) samples.push(switchHint(createSwitchRound({ age, level: 0, seed: 3 })));
  for (const text of samples) {
    const html = phraseHtml(text);
    assert.equal(unwrap(html), text, 'only <wbr> is added');
    for (const word of KEEP) {
      const at = text.indexOf(word);
      if (at >= 0) assert.ok(!html.split('<wbr>').some((part, i, all) => i > 0 && (all.slice(0, i).join('').length > at && all.slice(0, i).join('').length < at + word.length)), `${word} stays together in ${text}`);
    }
  }
  assert.equal(phraseHtml('<b>"&'), '&lt;b&gt;&quot;&amp;', 'still escapes');
  assert.equal(phraseHtml('數一數', { segment: null }), '數一數', 'no Segmenter: punctuation-only breaks');
});

test('R49 fix: card text, hints and the switch coach use keep-all wrapping with even line lengths', () => {
  const room = read('src/games/math/room.css'), rail = read('src/games/puzzles/rail-play.css');
  const wrap = 'word-break:keep-all;overflow-wrap:anywhere;text-wrap:balance';
  assert.ok(room.includes(`.room-card-copy span,.room-coach span,#room-question-title{${wrap}}`));
  assert.ok(rail.includes(`.rp-cue{${wrap}}`));
  const ui = read('src/games/math/room-ui.js'), shell = read('src/games/puzzles/rail-shell.js');
  assert.match(ui, /<span>\$\{phraseHtml\(game\.description\)\}<\/span>/);
  assert.match(ui, /<span>\$\{phraseHtml\(text\)\}<\/span><\/p>/);
  assert.match(shell, /cueText\.innerHTML = phraseHtml\(text\)/);
});

test('R49 fix: answer dots follow dice layouts (4 = 2×2, 3 = triangle)', () => {
  const ui = read('src/games/math/room-ui.js'), css = read('src/games/math/room.css');
  const dice = JSON.parse(ui.match(/const DICE = (\{[^;]+\});/)[1].replace(/(\d+):/g, '"$1":'));
  assert.deepEqual(dice['4'], [1, 3, 7, 9], 'four is a 2×2 square');
  assert.deepEqual(dice['3'], [2, 7, 9], 'three is a triangle');
  assert.deepEqual(dice['5'], [1, 3, 5, 7, 9]);
  assert.deepEqual(dice['6'], [1, 3, 4, 6, 7, 9]);
  for (const [n, cells] of Object.entries(dice)) assert.equal(cells.length, Number(n));
  for (let cell = 1; cell <= 9; cell++) assert.ok(css.includes(`.dot-p${cell}{grid-area:${Math.ceil(cell / 3)}/${(cell - 1) % 3 + 1}}`), `cell ${cell} placed`);
});

test('R49 fix: one hint label everywhere, bigger counting passengers, and room text at least 12 px', () => {
  const ui = read('src/games/math/room-ui.js'), css = read('src/games/math/room.css');
  assert.match(ui, /class="room-hint"><span aria-hidden="true">☀<\/span> 想一想<\/button>/);
  assert.doesNotMatch(ui, /wide-only/, 'no short/long label switch between phone and desktop');
  assert.doesNotMatch(css, /wide-only/);
  assert.match(ui, /q\.count <= 6 \? 'few ' : ''/);
  assert.match(css, /@media \(min-height:501px\)\{#math-room \.passengers\.few \.person\{width:78px;height:118px\}\.passengers\.few \.room-person\{width:66px;height:105px\}\}/, 'about 1.5× the 44×70 passenger');
  assert.match(css, /#math-room \.room-age span,#math-room \.room-stamp-button span\{font-size:13px;/, '家長換年齡／集章冊 13 px');
  assert.match(css, /\.room-card-copy small\{font-size:13px;/, 'age line on cards 13 px');
  for (const [, size] of css.matchAll(/font-size:(\d+(?:\.\d+)?)px/g)) assert.ok(Number(size) >= 12, `room.css font-size ${size}px`);
});
