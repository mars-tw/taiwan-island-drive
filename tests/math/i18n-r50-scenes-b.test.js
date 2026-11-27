// R50 L2 group b: the ported playroom scenes (activities, adventure, boarding sums, counting, souvenirs)
// show no Chinese in English mode, and the adventure questions' Chinese prompts all have English.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { setLanguage, HAN } from '../../src/shared/i18n.js';
import { tx } from '../../src/games/math/room-text.js';
import { questionFor, allowedGames, LEVELS, seededRandom, randomInt, shuffle, newMemoryState, memoryTurn, SHAPES } from '../../src/games/math/engine.js';
import { activityScene, patternToken, patternName, clockFace } from '../../src/games/math/activities.js';
import { adventureScene, giftDetailMarkup, souvenirMarkup, souvenirCollection } from '../../src/games/math/adventure-ui.js';
import { createAdventureQuestion, newAdventureState, giftChoices, SOUVENIRS, SOUVENIR_THEMES, DIRECTIONS } from '../../src/games/math/adventure.js';
import { arithmeticScene } from '../../src/games/math/arithmetic-ui.js';
import { countingScene, discoveryMarkup } from '../../src/games/math/learning-ui.js';

const english = fn => { setLanguage('en', { persist: false }); try { return fn(); } finally { setLanguage('zh-Hant', { persist: false }); } };
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
// Train names come from data/trains.json (translated with the data, not here): use plain English stand-ins.
const train = id => ({ id, name: 'Test Train', model: 'EMU1', cardLabel: 'Test Train EMU1', image: 'x.webp' });
const extras = { byId: train, image: () => '<img alt="">', esc };

/** Visible text (tags stripped) plus aria-label / alt / title / placeholder / label values of an HTML string. */
function chinese(html) {
  const found = [];
  const text = html.replace(/<[^>]*>/g, ' ');
  if (HAN.test(text)) found.push(text.replace(/\s+/g, ' ').trim());
  for (const m of html.matchAll(/\s(?:aria-label|alt|title|placeholder|label)\s*=\s*"([^"]*)"/g)) if (HAN.test(m[1])) found.push(m[1]);
  return found;
}
const levels = Object.keys(LEVELS);
const { trains } = JSON.parse(readFileSync(new URL('../../src/games/math/data/trains.json', import.meta.url), 'utf8'));
const make = (game, level, seed) => allowedGames(level).includes(game) ? questionFor({ game, level, train: trains[seed % trains.length], trains, rng: seededRandom(Math.imul(seed + 1, 2654435761)) }) : null;

test('R50 b: every ported scene renders without Chinese in English mode', () => english(() => {
  const leaks = [];
  const check = (label, html) => { for (const piece of chinese(html)) leaks.push(`${label}: ${piece}`); };
  let rendered = 0;
  for (const level of levels) for (let seed = 0; seed < 24; seed++) {
    const rng = seededRandom(seed + 7);
    const tracks = make('tracks', level, seed);
    if (tracks) {
      const base = newAdventureState(tracks);
      for (const rotations of [base.rotations, tracks.tiles.map(tile => tile.solution), tracks.tiles.map(() => Math.floor(rng() * 4))])
        for (const solved of [false, true]) { check('tracks', adventureScene(tracks, { ...base, rotations, solved })); rendered++; }
    }
    const sharing = make('sharing', level, seed);
    if (sharing) {
      const shares = newAdventureState(sharing).shares;
      for (let n = 0; n <= sharing.total; n++) {
        for (const solved of [false, true]) { check('sharing', adventureScene(sharing, { ...newAdventureState(sharing), shares: [...shares], solved })); rendered++; }
        if (n < sharing.total) shares[n % sharing.friends]++;
      }
    }
    const treasure = make('treasure', level, seed);
    if (treasure) {
      const found = new Set();
      for (let i = -1; i < treasure.items.length; i++) {
        if (i >= 0) found.add(i);
        for (const solved of [false, true]) { check('treasure', adventureScene(treasure, { ...newAdventureState(treasure), found: new Set(found), solved })); rendered++; }
      }
    }
    const pattern = make('pattern', level, seed);
    if (pattern) {
      for (const solved of [false, true]) { check('pattern', activityScene(pattern, { solved }, extras)); rendered++; }
      for (const value of pattern.choices) { check('patternToken', patternToken(pattern, value)); check('patternName', patternName(pattern, value)); }
    }
    const cargo = make('cargo', level, seed);
    if (cargo) for (let load = 0; load <= cargo.max; load++) for (const solved of [false, true]) { check('cargo', activityScene(cargo, { cargo: load, solved }, extras)); rendered++; }
    const memory = make('memory', level, seed);
    if (memory) {
      let state = newMemoryState();
      for (let step = 0; step < 12; step++) {
        for (const memoryPeek of [false, true]) for (const solved of [false, true]) { check('memory', activityScene(memory, { memory: state, memoryPeek, solved }, extras)); rendered++; }
        state = memoryTurn(state.open.length === 2 ? { ...state, open: [] } : state, Math.floor(rng() * memory.deck.length), memory.deck);
      }
    }
    const clock = make('clock', level, seed);
    if (clock) for (const solved of [false, true]) { check('clock', activityScene(clock, { solved }, extras)); rendered++; }
    const boarding = make('boarding', level, seed);
    if (boarding) for (const solved of [false, true]) for (const touch of [false, true]) { check('boarding', arithmeticScene(boarding, { solved, touch, input: '3' })); rendered++; }
    const count = make('count', level, seed);
    if (count) {
      const counted = new Set();
      for (let i = -1; i < count.count; i++) {
        if (i >= 0) counted.add(i);
        for (const solved of [false, true]) { check('count', countingScene(count, { counted: new Set(counted), solved })); rendered++; }
      }
    }
  }
  for (let hour = 1; hour <= 12; hour++) for (const minute of [0, 30]) {
    check('clockFace', clockFace({ hour, minute }));
    check('clock solved', activityScene({ game: 'clock', hour, minute, answer: hour * 60 + minute }, { solved: true }, extras));
  }
  for (const value of Object.keys(SHAPES)) check('shape', patternToken({ kind: 'shape' }, value) + patternName({ kind: 'shape' }, value));
  for (const start of [0, 1, 7]) for (const operation of ['add', 'subtract']) check('boarding grid', arithmeticScene({ operation, start, change: 1, answer: 1 }, { solved: start === 1 }));
  check('count zero', countingScene({ count: 0 }));
  for (const kind of ['place', 'train', 'general']) for (const native of [false, true])
    check('discovery', discoveryMarkup({ kind, text: 'A fact.', place: { region: 'Hualien' }, sources: [{ title: 'Source', url: 'https://example.org/' }] }, { native }));
  // Souvenir envelope, detail and book.
  for (const item of SOUVENIRS) { check('gift', giftDetailMarkup(item)); check('gift opened', souvenirMarkup({ gift: item })); }
  check('gift fallback', giftDetailMarkup({ id: 'x', name: 'X', story: 'Y', theme: 'none', playKind: 'none' }));
  check('envelope', souvenirMarkup({}));
  for (let trips = 0; trips < 12; trips++) {
    const progress = { trips, souvenirs: SOUVENIRS.filter((_, i) => (i + trips) % 3 === 0).map(item => item.id) };
    check('choices', souvenirMarkup({ giftChoices: giftChoices(progress, 't0', seededRandom(trips)) }));
    check('book', souvenirCollection(progress));
  }
  for (const progress of [{}, { souvenirs: SOUVENIRS.map(item => item.id) }]) check('book edge', souvenirCollection(progress));
  assert.ok(rendered > 1500, `rendered ${rendered} scenes`);
  assert.deepEqual([...new Set(leaks)], []);
}));

test('R50 b: adventure prompts, hints and souvenir data have English through tx()', () => english(() => {
  const leaks = [];
  for (const game of ['tracks', 'sharing', 'treasure']) for (const level of levels) for (let seed = 0; seed < 40; seed++) {
    const q = createAdventureQuestion({ game, level, max: LEVELS[level].max, rng: seededRandom(seed * 31 + 5), randomInt, shuffle });
    for (const text of [q.prompt, q.hint]) if (HAN.test(tx(text))) leaks.push(`${game}: ${text} → ${tx(text)}`);
  }
  for (const text of [...DIRECTIONS, ...SOUVENIRS.flatMap(item => [item.name, item.story]), ...SOUVENIR_THEMES.flatMap(theme => [theme.name, theme.description])])
    if (HAN.test(tx(text))) leaks.push(text);
  assert.deepEqual(leaks, []);
  // Counted names read naturally: plural in sentences, singular for one spot.
  assert.equal(tx('山海風景裡，找出 3 個星星。'), 'Find 3 stars in the picture.');
  assert.equal(tx('只找葉子，每個點一次。找到的會亮起來；其他小東西可以下次再看。'), 'Only look for leaves. Tap each one once. Found ones light up. The rest can wait.');
  const treasure = adventureScene({ game: 'treasure', target: 'shell', answer: 2, items: ['shell', 'star'] }, { found: new Set([0]), solved: false });
  assert.match(treasure, /Look for <b>🐚 shells<\/b>/);
  assert.match(treasure, /aria-label="Spot 1: shell, found"/);
  assert.match(treasure, /src="assets\/images\/railway-world-v2\.webp" alt="[^"]+"/, 'the room swaps this image by its src');
  assert.match(arithmeticScene({ operation: 'add', start: 1, change: 2, answer: 3 }), /1<span> friend<\/span>.*2<span> friends<\/span>/s);
}));

test('R50 b: logic stays Chinese and a switch back gives the original Chinese scene', () => {
  const q = createAdventureQuestion({ game: 'sharing', level: 'medium', max: 10, rng: seededRandom(3), randomInt, shuffle });
  const before = adventureScene(q, { ...newAdventureState(q), solved: false });
  const englishScene = english(() => adventureScene(q, { ...newAdventureState(q), solved: false }));
  assert.notEqual(englishScene, before);
  assert.equal(adventureScene(q, { ...newAdventureState(q), solved: false }), before);
  assert.match(q.prompt, /^把 \d+ 份點心，分給 \d 位朋友，讓每位一樣多。$/);
  const treasure = english(() => createAdventureQuestion({ game: 'treasure', level: 'small', max: 5, rng: seededRandom(1), randomInt, shuffle }));
  assert.match(treasure.prompt, /^山海風景裡，找出 \d 個(星星|葉子|貝殼)。$/, 'questions made in English mode still carry the Chinese source');
});
