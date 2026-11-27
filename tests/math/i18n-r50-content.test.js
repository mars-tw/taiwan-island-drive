// R50 L2 group D: the data ported from Taiwan Train Math (journeys, learning cards, story chapters,
// old passport stamp names) has English for every Chinese piece, and English mode shows no Chinese.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { setLanguage, getLanguage, hasTranslation } from '../../src/shared/i18n.js';
import { tx } from '../../src/games/math/room-text.js';
import { chineseFragments } from '../helpers/i18n-scan.js';
import { JOURNEYS, journeyMarkup } from '../../src/games/math/journeys.js';
import { LEARNING_SOURCES, TRAIN_DISCOVERIES, PLACE_DISCOVERIES, learningDiscovery } from '../../src/games/math/learning-content.js';
import { CHAPTERS } from '../../src/games/math/story-model.js';
import { LEGACY_TRAIN_NAMES } from '../../src/games/math/legacy-trains.js';

const HAN = /[㐀-䶿一-鿿豈-﫿]/; // CJK ideographs (same ranges as src/shared/i18n.js)
const FILES = ['src/games/math/journeys.js', 'src/games/math/learning-content.js', 'src/games/math/story-model.js', 'src/games/math/legacy-trains.js'];
const read = path => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const ATTRIBUTES = /\s(?:aria-label|alt|title|placeholder|label)\s*=\s*(["'])(.*?)\1/g;
const GAMES = ['count', 'identify', 'boarding', 'order', 'compare', 'pattern', 'cargo', 'memory', 'clock', 'tracks', 'sharing', 'treasure', 'puzzle', 'luggage', 'maze', 'program', 'differences', 'mosaic', 'balance', 'tickets'];

function english(fn) {
  setLanguage('en', { persist: false });
  try { return fn(); } finally { setLanguage('zh-Hant', { persist: false }); }
}
/** Chinese left in visible text or in translated attributes of an HTML string. */
function chineseIn(html) {
  const found = [];
  for (const m of html.matchAll(ATTRIBUTES)) if (HAN.test(m[2])) found.push(`${m[0].trim()}`);
  const text = html.replace(/<[^>]*>/g, ' ');
  if (HAN.test(text)) found.push(text.split(/\s{2,}/).filter(part => HAN.test(part)).join(' | '));
  return found;
}

test('R50 group D source: every Chinese string has English and no ${} template hides Chinese', () => {
  const problems = [];
  for (const file of FILES) for (const fragment of chineseFragments(read(file))) {
    if (fragment.dynamic) problems.push(`${file}:${fragment.line} Chinese inside a \${} template: ${fragment.text}`);
    else if (!hasTranslation(fragment.text)) problems.push(`${file}:${fragment.line} ${fragment.text}`);
  }
  assert.deepEqual(problems, []);
});

test('R50 English journey cards: no Chinese in text or labels, for every level, history and task pool', () => {
  assert.equal(getLanguage(), 'zh-Hant');
  const ids = JOURNEYS.map(route => route.id);
  let seed = 7;
  const random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const problems = [];
  english(() => {
    for (let s = 0; s < 24; s++) for (const level of ['small', 'medium', 'large']) {
      const availableGames = s === 0 ? GAMES : s === 1 ? [] : GAMES.filter(() => random() < 0.6);
      const completed = s === 0 ? ids : ids.filter(() => random() < 0.5);
      const html = journeyMarkup({ level, completed, availableGames });
      assert.match(html, /data-journey="forest"/);
      for (const left of chineseIn(html)) problems.push(`${level} s${s}: ${left}`);
    }
    const sample = journeyMarkup({ level: 'medium', completed: ['coast'], availableGames: GAMES });
    assert.match(sample, /Where shall we go today\?/);
    assert.match(sample, /aria-label="Seaside Lighthouse, 5-stop trip, already traveled, you can go again"/);
    assert.match(sample, /Forest Mail Carrier, 5-stop trip, start the trip/);
    assert.match(sample, /Join tracks, Maze, Plan moves/);
    assert.match(sample, /5 stops · 6 tasks take turns/);
    assert.match(journeyMarkup({ level: 'large', availableGames: ['puzzle'] }), /Try another level/);
  });
  assert.deepEqual(problems, []);
  // Back in Chinese the same call is the original Chinese markup.
  const zh = journeyMarkup({ level: 'small', completed: ['forest'], availableGames: GAMES });
  assert.match(zh, /<small>選一趟故事旅程<\/small>/);
  assert.match(zh, /aria-label="森林郵差，3 站主題旅程，已旅行，可以再次出發"/);
  assert.match(zh, /3 站 · 6 種任務輪替/);
  assert.match(zh, /接軌道、走迷宮、排指令/);
});

test('R50 English data: journeys, stamp names, learning cards and story chapters have no Chinese left', () => {
  const values = [];
  for (const route of JOURNEYS) values.push(route.name, route.description, route.departureText, route.arrivalText, ...Object.values(route.stationLabels).flat());
  values.push(...Object.values(LEGACY_TRAIN_NAMES));
  for (const source of Object.values(LEARNING_SOURCES)) values.push(source.title);
  const cards = [...PLACE_DISCOVERIES, ...Object.values(TRAIN_DISCOVERIES).flat(), learningDiscovery('unknown')];
  for (const id of Object.keys(TRAIN_DISCOVERIES)) for (let index = 0; index < 4; index++) for (const topic of ['train', 'place', 'mixed']) cards.push(learningDiscovery(id, { index, topic }));
  for (const card of cards) values.push(card.label, card.text, ...(card.place ? [card.place.name, card.place.region] : []), ...card.sources.map(source => source.title));
  for (const chapter of CHAPTERS) values.push(chapter.title, chapter.text, chapter.short, chapter.place);
  assert.ok(values.length > 300);
  const problems = english(() => values.map(value => [value, tx(value)]).filter(([, text]) => HAN.test(text) || !text.trim()));
  assert.deepEqual(problems, []);
  english(() => {
    assert.equal(tx(LEGACY_TRAIN_NAMES['700t']), 'THSR 700T');
    assert.equal(tx(LEGACY_TRAIN_NAMES.temu1000), 'Taroko Express TEMU1000');
    assert.equal(tx(JOURNEYS.find(route => route.id === 'coast').stationLabels.small[2]), 'Lighthouse Stop');
  });
  // The data itself stays Chinese (logic and tests read it).
  assert.equal(JOURNEYS[0].name, '森林郵差');
  assert.equal(LEGACY_TRAIN_NAMES['700t'], '台灣高鐵 700T');
  assert.equal(learningDiscovery('700t').label, '認識火車');
});
