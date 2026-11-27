// R50 L2：數學遊戲室外框、回合回饋、學習引導、出題句子與拆合車廂調度台的英文。
// 原則：出題與回饋留在中文（既有測試比對中文），畫面用 tx() 換成英文；這裡在英文模式把每一句都跑過，不能留下中文。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { setLanguage, t, HAN } from '../../src/shared/i18n.js';
import { tx, zh } from '../../src/games/math/room-text.js';
import { createRound, act, currentQuestion, roundGuide } from '../../src/games/math/room-play.js';
import { learningGuide } from '../../src/games/math/learning-guide.js';
import { GAMES, LEVELS, SHAPES, clockLabel, seededRandom } from '../../src/games/math/engine.js';
import { ROOM_CATEGORIES, AGE_BANDS, ROUND_GAMES, agesText, mathGames } from '../../src/games/math/room-registry.js';
import { dispatchAction, dispatchLesson, dispatchMarkup, dispatchEntry, normalizeDispatch } from '../../src/games/math/dispatch.js';
import { phraseHtml } from '../../src/shared/phrase-wrap.js';

const english = fn => { setLanguage('en', { persist: false }); try { return fn(); } finally { setLanguage('zh-Hant', { persist: false }); } };
/** Visible text and translated attribute values of an HTML string. */
const visible = html => [...String(html).matchAll(/\s(?:aria-label|alt|title|placeholder)="([^"]*)"/g)].map(m => m[1]).join(' ') + ' ' + String(html).replace(/<[^>]*>/g, ' ');
const noChinese = (text, where) => assert.ok(!HAN.test(text), `${where}: ${text}`);

function roundTexts(game, level, seed) {
  const round = createRound({ game, level, rng: seededRandom(seed) });
  const texts = [];
  for (let i = 0; i < round.questions.length; i++) {
    const q = currentQuestion(round), guide = roundGuide(round);
    texts.push(q.prompt, q.hint, guide.title, guide.action, guide.help, guide.success);
    texts.push(zh('完成了！{text}', { text: guide.success }), zh('再想一次。{text}', { text: guide.help }));
    texts.push(act(round, { type: 'hint' }).message);
    if (['count', 'compare', 'pattern', 'clock'].includes(game)) {
      const wrong = q.choices.find(choice => String(choice) !== String(q.answer));
      if (wrong !== undefined) texts.push(act(round, { type: 'answer', value: wrong }).message);
      texts.push(...q.choices.map(choice => game === 'clock' ? clockLabel(choice) : ''));
    }
    if (game === 'order') texts.push(act(round, { type: 'remove-order', value: 0 }).message);
    if (game === 'boarding') texts.push(act(round, { type: 'boarding-submit' }).message);
    if (game === 'treasure') {
      const other = q.items.findIndex(kind => kind !== q.target), hit = q.items.indexOf(q.target);
      if (other >= 0) texts.push(act(round, { type: 'find', value: other }).message);
      if (hit >= 0 && q.answer > 1) texts.push(act(round, { type: 'find', value: hit }).message);
    }
    if (game === 'luggage') for (const criteria of ['color', 'shape', 'both']) { const g = learningGuide({ ...q, criteria, prompt: '' }, round); texts.push(g.title, g.help, g.success); }
    for (const state of [{ programRunning: true }, { workshop: { programChecked: true, commands: ['up'] } }, { workshop: { weights: [1] } }, { tickets: { checked: true } }, { tickets: { activeTicket: 0 } }, { memoryPeek: true }, { memory: { open: [0, 1] } }, { puzzle: { selectedPiece: 0 } }, { explorer: { luggageSelected: 0 } }])
      texts.push(learningGuide(q, state).action);
    // Move on: mark solved and go to the next question.
    round.solved = true;
    act(round, { type: 'next' });
  }
  return texts.filter(Boolean);
}

test('R50 L2 room: every prompt, hint, guide line and feedback of the 17 playroom games reads in English', () => {
  let count = 0;
  english(() => {
    for (const game of ROUND_GAMES) for (const level of GAMES[game].levels) for (let seed = 1; seed <= 12; seed++)
      for (const text of roundTexts(game, level, seed)) { noChinese(tx(text), `${game}/${level}/${seed}`); count++; }
  });
  assert.ok(count > 3000, `checked ${count} sentences`);
});

test('R50 L2 room: game names, descriptions, tabs, age bands, shapes and clock labels have English', () => {
  english(() => {
    for (const game of mathGames().filter(g => ROUND_GAMES.includes(g.id))) { noChinese(tx(game.name), game.id); noChinese(tx(game.description), game.id); }
    for (const group of ROOM_CATEGORIES) noChinese(t(group.name), group.id);
    for (const band of AGE_BANDS) { noChinese(t(band.label), band.id); noChinese(t(band.range), band.id); }
    for (const levels of [['small'], ['medium', 'large'], ['small', 'medium', 'large']]) noChinese(tx(agesText(levels)), levels.join());
    for (const level of Object.values(LEVELS)) for (const key of ['name', 'age', 'label']) noChinese(t(level[key]), level[key]);
    for (const shape of Object.values(SHAPES)) noChinese(t(shape.name), shape.name);
    assert.equal(tx(clockLabel(150)), '2:30');
    assert.equal(tx(clockLabel(180)), "3 o'clock");
    assert.equal(tx(agesText(['medium', 'large'])), 'Ages 5–8');
    assert.equal(tx(zh('{name}適合 {ages}。請家長在「家長設定」換年齡再玩。', { name: '數數看', ages: '5～8 歲' })), 'Count them: Ages 5–8. Ask a grown-up to change the age in Parent Settings.');
  });
});

test('R50 L2 tx(): exact keys first, the most specific {param} sentence next, Chinese params translated, Chinese mode untouched', () => {
  assert.equal(tx('完成了！一位配一個數，最後的數表示總人數。'), '完成了！一位配一個數，最後的數表示總人數。', 'Chinese mode returns the text');
  assert.equal(zh('請讓 {n} 位乘客上車。', { n: 4 }), '請讓 4 位乘客上車。');
  english(() => {
    assert.equal(tx('完成了！一位配一個數，最後的數表示總人數。'), 'You did it! One number for each friend. The last number is how many.');
    assert.equal(tx('請讓 1 位乘客上車。'), 'Help 1 friend get on.');
    assert.equal(tx('請讓 4 位乘客上車。'), 'Help 4 friends get on.');
    assert.equal(tx('  數數看 '), '  Count them ', 'surrounding spaces are kept');
    assert.equal(tx('Already English'), 'Already English');
    assert.equal(tx(42), '42');
  });
});

test('R50 L2 dispatch: the Split & Join Train Cars lesson reads in English at every step, and its messages stay Chinese', () => {
  for (const level of ['small', 'medium', 'large']) {
    let s = normalizeDispatch(), seen = 0;
    const step = action => { const r = dispatchAction(s, action, level); s = r.state; assert.ok(HAN.test(r.message), 'the lesson message itself stays Chinese'); english(() => { noChinese(tx(r.message), `${level} ${action}`); noChinese(visible(dispatchMarkup(s, r.message)), `${level} ${action}`); noChinese(visible(dispatchEntry(s)), level); }); seen++; };
    for (let cycle = 0; cycle < 4; cycle++) {
      const q = dispatchLesson(level, cycle);
      step('start'); step('check'); step('learn'); step('check');
      for (let n = 0; n < q.total; n++) step('add');
      step('check'); step('to-rear'); step('check');
      for (let n = 1; n < q.rear; n++) step('to-rear');
      step('check'); step(`answer:${q.front + 1}`); step(`answer:${q.front}`); step('check');
    }
    assert.ok(seen > 40);
  }
  english(() => {
    const done = dispatchAction(normalizeDispatch(), 'start', 'small').state;
    assert.match(visible(dispatchMarkup(done, '')), /Try as much as you like/);
  });
});

test('R50 L2 English text wraps at spaces (no Chinese word-glue <wbr>), Chinese wrapping unchanged', () => {
  const sentence = 'Tap the friends and count them. The last number is how many.';
  assert.equal(phraseHtml(sentence), sentence);
  assert.equal(phraseHtml('Say "hi" & <go>'), 'Say &quot;hi&quot; &amp; &lt;go&gt;');
  const css = readFileSync(new URL('../../src/games/math/room.css', import.meta.url), 'utf8');
  assert.match(css, /html\[lang=en\] \.room-later>summary::after\{content:'Show me ▾'\}/, 'CSS content is not translated by t(); English has its own rule');
  assert.match(css, /html\[lang=en\] \.room-later\[open\]>summary::after\{content:'Hide ▴'\}/);
});

test('R50 L2 the room reads and speaks in the chosen language', () => {
  const ui = readFileSync(new URL('../../src/games/math/room-ui.js', import.meta.url), 'utf8');
  assert.doesNotMatch(ui, /lang: 'zh-TW'/, 'speech follows the chosen language');
  assert.match(ui, /speakNative\(tx\(text\)/);
  assert.match(ui, /onLanguageChange\(\(\) => \{/, 'an open room redraws in place when the language changes');
  assert.match(ui, /localize\(dialog\)/);
  const academy = readFileSync(new URL('../../src/shared/academy-ui.js', import.meta.url), 'utf8');
  assert.match(academy, /cue\.textContent=tx\(guide\.cue\)/, 'the dispatch coach shows the lesson message in the chosen language');
});
