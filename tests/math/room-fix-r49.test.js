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

// ---- 上線前小修（獨立複評 8.4 之後） ----
import { LABEL_COLORS, LABEL_SHAPES, LABEL_NOUNS } from '../../src/shared/phrase-wrap.js';
import { RAIL_COLORS, RAIL_SHAPES } from '../../src/games/puzzles/common.js';
import { departTrain, switchLevels } from '../../src/games/puzzles/switch-platform.js';
import { createRound, roundGuide } from '../../src/games/math/room-play.js';
import { seededRandom } from '../../src/games/math/engine.js';

test('R49 上線前: colour and shape names stay glued to 列車／月台 and the first line is never a single word', () => {
  for (const c of Object.values(RAIL_COLORS)) assert.ok(LABEL_COLORS.includes(c.name), `${c.name} covered`);
  for (const s of Object.values(RAIL_SHAPES)) assert.ok(LABEL_SHAPES.includes(s.name), `${s.name} covered`);
  const names = [];
  for (const c of LABEL_COLORS) for (const s of ['', ...LABEL_SHAPES]) for (const n of LABEL_NOUNS) names.push(c + s + n);
  const hints = new Set();
  for (const name of names) for (const other of names) hints.add(`${name}要開到${other}。點黃色的箭頭換方向，看亮起來的路通到哪裡。`);
  for (const age of ['3-4', '5-6', '7-8']) for (let level = 0; level < switchLevels(age).length; level++) for (let seed = 1; seed < 25; seed++) {
    let round = createSwitchRound({ age, level, seed });
    hints.add(switchHint(round));
    for (let n = 0; n < 4; n++) { const step = departTrain(round); hints.add(switchHint(step.round, step.result)); round = step.round; }
  }
  for (const text of hints) {
    const html = phraseHtml(text), parts = html.split('<wbr>');
    let at = 0;
    for (const part of parts.slice(0, -1)) {
      at += part.length;
      for (const name of names) for (let i = text.indexOf(name); i >= 0; i = text.indexOf(name, i + 1))
        assert.ok(at <= i || at >= i + name.length, `「${name}」 split in ${text}`);
    }
    if (parts.length > 1) {
      const first = parts[0].replace(/[，、。！？]/g, '');
      assert.ok(!names.includes(first) && !LABEL_COLORS.includes(first) && [...first].length > 2, `first line could be just 「${first}」 in ${text}`);
    }
  }
});

test('R49 上線前: zero is a picture (empty dice frame with a big 0), the label still says 沒有', () => {
  const ui = read('src/games/math/room-ui.js'), css = read('src/games/math/room.css');
  assert.match(ui, /n === 0 \? '<span class="dot-card dice dice-zero" aria-hidden="true"><b>0<\/b><\/span>'/);
  assert.doesNotMatch(ui, /zero-dots|>沒有</, 'no 沒有 text on the button face');
  assert.match(ui, /Number\(value\) === 0 \? '答案 0，沒有'/, 'screen readers still hear 沒有');
  assert.match(css, /\.dot-card\.dice-zero\{[^}]*border:3px dashed/);
  assert.match(css, /\.dot-card\.dice-zero b\{font:900 30px/);
});

test('R49 上線前: the counting hint uses the full-width comma at every age', () => {
  for (const level of ['small', 'medium', 'large']) {
    const round = createRound({ game: 'count', level, rng: seededRandom(5) });
    const action = roundGuide(round).action;
    assert.match(action, /^一位數一次，再選(點點|人數)。$/, action);
    assert.doesNotMatch(action, /[・·•]/);
  }
});
