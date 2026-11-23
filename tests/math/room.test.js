import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GAMES, LEVELS, seededRandom, questionSignature } from '../../src/games/math/engine.js';
import { railLinks } from '../../src/games/math/adventure.js';
import { MAZE_DIRECTIONS } from '../../src/games/math/explorers.js';
import { PROGRAM_DIRECTIONS } from '../../src/games/math/workshop.js';
import { ROOM_CATEGORIES, PORTED_GAMES, PHOTO_GAMES, ROUND_GAMES, AGE_BANDS, registerMathGame, mathGames, mathGame } from '../../src/games/math/room-registry.js';
import { createRound, act, currentQuestion } from '../../src/games/math/room-play.js';
import { readRoom, roomLevel, setAgeBand, recordRound, syncLegacy, readLegacyLocal, decodeLegacyArchive, legacySummary, LEGACY_KEY, ROOM_SECTION } from '../../src/games/math/room-store.js';
import { LEGACY_TRAIN_NAMES } from '../../src/games/math/legacy-trains.js';
import { STUDENT_KEY, readStudent } from '../../src/shared/student-save.js';
import { updateSettings } from '../../src/shared/settings.js';
import { importTrainBackup, readAcademy } from '../../src/shared/academy.js';

const read = name => readFileSync(new URL(`../../${name}`, import.meta.url), 'utf8');
function storage(entries = []) {
  const m = new Map(entries);
  globalThis.localStorage = { getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) };
  return m;
}
const done = () => { delete globalThis.localStorage; };

// ---- a child who knows the answer: only public controls, one action at a time ----
function path(q, directions) {
  const queue = [[q.start, []]], seen = new Set([q.start]);
  while (queue.length) {
    const [cell, steps] = queue.shift();
    if (cell === q.finish) return steps;
    for (const [name, d] of Object.entries(directions)) {
      const x = cell % q.columns + d.dx, y = Math.floor(cell / q.columns) + d.dy, next = y * q.columns + x;
      if (x < 0 || y < 0 || x >= q.columns || y >= q.rows || q.walls[cell] & d.bit || q.walls[next] & d.opposite || seen.has(next)) continue;
      seen.add(next); queue.push([next, [...steps, name]]);
    }
  }
  throw Error('no route');
}
function weights(q) {
  const ways = new Map([[0, []]]);
  for (let box = 0; box < q.maxBoxes; box++)
    for (const [sum, list] of [...ways]) for (const w of q.allowedWeights) if (sum + w <= q.target && !ways.has(sum + w)) ways.set(sum + w, [...list, w]);
  return ways.get(q.target);
}
function tokens(q) {
  const assign = Array(q.wallet.length).fill(null), totals = Array(q.tickets.length).fill(0);
  const go = i => {
    if (i === q.wallet.length) return totals.every((t, k) => t === q.tickets[k].fare);
    for (const target of [null, ...q.tickets.keys()]) {
      if (target !== null && totals[target] + q.wallet[i].value > q.tickets[target].fare) continue;
      assign[i] = target; if (target !== null) totals[target] += q.wallet[i].value;
      if (go(i + 1)) return true;
      if (target !== null) totals[target] -= q.wallet[i].value;
    }
    assign[i] = null; return false;
  };
  assert.ok(go(0), 'tickets solvable'); return assign;
}
function solve(round) {
  const q = currentQuestion(round), $ = (type, value) => act(round, { type, value });
  switch (q.game) {
    case 'count': case 'compare': case 'pattern': case 'clock': return $('answer', q.answer);
    case 'order': q.answer.forEach(n => $('order', n)); return $('order-submit');
    case 'boarding': [...String(q.answer)].forEach(d => $('digit', d)); return $('boarding-submit');
    case 'cargo': while (round.cargo < q.answer) $('load', q.level === 'large' && q.answer - round.cargo >= 5 ? 5 : 1); return $('cargo-submit');
    case 'tracks':
      q.tiles.forEach((tile, i) => {
        if (tile.kind === 'empty') return;
        const want = railLinks(tile.kind, tile.solution).sort().join();
        for (let n = 0; n < 4 && railLinks(tile.kind, round.rotations[i]).sort().join() !== want; n++) $('rotate', i);
      });
      return $('tracks-submit');
    case 'sharing': q.answer.forEach((n, i) => { for (let k = 0; k < n; k++) $('share', i); }); return $('sharing-submit');
    case 'treasure': { let last; q.items.forEach((kind, i) => { if (kind === q.target) last = $('find', i); }); return last; }
    case 'luggage': q.items.forEach((_item, i) => { $('luggage-item', i); $('luggage-bin', q.answer[i]); }); return $('luggage-submit');
    case 'maze': { let last; for (const step of path(q, MAZE_DIRECTIONS)) last = $('maze', step); return last; }
    case 'program': {
      path(q, PROGRAM_DIRECTIONS).forEach(step => $('program-direction', step));
      const run = $('program-run'); assert.equal(run.kind, 'run');
      return $('program-done', run.run);
    }
    case 'balance': weights(q).forEach(w => $('balance-weight', w)); return $('balance-check');
    case 'mosaic': q.target.forEach((color, i) => { if (color !== 'empty') { $('mosaic-color', color); $('mosaic-cell', i); } }); return $('mosaic-submit');
    case 'differences': { let last; q.differences.forEach(i => { last = $('difference', i); }); return last; }
    case 'tickets': {
      const plan = tokens(q);
      q.tickets.forEach((_ticket, t) => { $('ticket-select', t); plan.forEach((owner, i) => { if (owner === t) $('ticket-pay', i); }); });
      return $('tickets-check');
    }
  }
  throw Error(`no solver for ${q.game}`);
}

test('R48 room lists the 17 photo-free games from the 1.11.0 playroom in four tabs', () => {
  assert.deepEqual(ROOM_CATEGORIES.map(c => c.name), ['數學', '觀察與記憶', '拼搭與方向', '生活與分享']);
  assert.equal(ROUND_GAMES.length, 17);
  assert.deepEqual([...ROUND_GAMES, ...PHOTO_GAMES].sort(), Object.keys(GAMES).sort(), 'the 20 original games are 17 here plus 3 photo games');
  for (const id of PHOTO_GAMES) assert.equal(mathGame(id), null, `${id} waits for the licensed photo batch`);
  for (const category of ROOM_CATEGORIES) {
    const listed = mathGames({ category: category.id }).filter(g => g.kind === 'round').map(g => g.id);
    assert.deepEqual(listed, PORTED_GAMES[category.id]);
    for (const id of listed) { const g = mathGame(id); assert.equal(g.name, GAMES[id].name); assert.deepEqual(g.levels, GAMES[id].levels); }
  }
  assert.deepEqual(mathGames({ category: 'math', level: 'small' }).filter(g => !g.playable).map(g => g.id), ['compare', 'boarding', 'clock']);
  assert.equal(mathGames({ level: 'medium' }).filter(g => g.kind === 'round' && g.playable).length, 17);
});

test('R48 register interface adds an outside game to a tab and validates its entry', () => {
  const opened = [];
  const unregister = registerMathGame({ id: 'harbor-boarding-test', category: 'math', name: '海風站上下車', icon: '🚉', description: '每站有人上下車，算算車上幾人。', levels: ['medium', 'large'], order: 65, open: ctx => opened.push(ctx.level) });
  try {
    const list = mathGames({ category: 'math', level: 'small' });
    const entry = list.find(g => g.id === 'harbor-boarding-test');
    assert.equal(entry.playable, false);
    assert.equal(list.indexOf(entry), list.findIndex(g => g.id === 'clock') + 1, 'order 65 sorts after clock (60)');
    entry.open({ level: 'large' }); assert.deepEqual(opened, ['large']);
    assert.throws(() => registerMathGame({ ...entry, id: 'harbor-boarding-test' }), /already registered/);
    for (const bad of [{ id: 'Bad Id' }, { category: 'music' }, { name: '' }, { levels: ['tiny'] }, { levels: [] }, { open: null }, { description: 'x'.repeat(49) }])
      assert.throws(() => registerMathGame({ id: 'another-game', category: 'build', name: '轉轍器', icon: '⑂', description: '撥道岔。', levels: ['small'], open() {}, ...bad }));
  } finally { unregister(); }
  assert.equal(mathGame('harbor-boarding-test'), null);
});

test('R48 every one of the 17 games plays a whole round at every age it is offered', () => {
  for (const id of ROUND_GAMES) for (const level of GAMES[id].levels) for (const seed of [1, 7]) {
    const round = createRound({ game: id, level, rng: seededRandom(seed * 97 + id.length) });
    assert.equal(round.questions.length, LEVELS[level].stops, `${id} ${level} length`);
    for (let n = 0; n < round.questions.length; n++) {
      assert.equal(round.solved, false);
      const outcome = solve(round);
      assert.equal(outcome.kind, 'correct', `${id} ${level} q${n}: ${outcome.message}`);
      assert.match(outcome.message, /^完成了！/);
      const next = act(round, { type: 'next' });
      assert.equal(next.kind, n === round.questions.length - 1 ? 'finished' : 'next');
    }
    assert.equal(round.finished, true);
    assert.equal(act(round, { type: 'answer', value: 1 }).kind, 'noop', 'a finished round ignores taps');
  }
});

test('R48 a wrong answer keeps the question, counts a retry and only explains the method', () => {
  for (const id of ['count', 'compare', 'boarding', 'pattern', 'clock', 'order', 'cargo', 'sharing']) {
    const level = GAMES[id].levels.at(-1), round = createRound({ game: id, level, rng: seededRandom(5) }), q = currentQuestion(round);
    let outcome;
    if (id === 'boarding') { [...String((q.answer + 1) % (LEVELS[level].max + 1))].forEach(d => act(round, { type: 'digit', value: d })); outcome = act(round, { type: 'boarding-submit' }); }
    else if (id === 'order') { [...q.answer].reverse().forEach(n => act(round, { type: 'order', value: n })); outcome = act(round, { type: 'order-submit' }); }
    else if (id === 'cargo') { act(round, { type: 'load', value: 1 }); if (q.answer === 1) act(round, { type: 'load', value: 1 }); outcome = act(round, { type: 'cargo-submit' }); }
    else if (id === 'sharing') { for (let k = 0; k < q.total; k++) act(round, { type: 'share', value: 0 }); outcome = act(round, { type: 'sharing-submit' }); }
    else outcome = act(round, { type: 'answer', value: (q.choices || []).find(c => c !== q.answer) });
    assert.equal(outcome.kind, 'wrong', id);
    assert.equal(round.solved, false); assert.equal(round.attempts, 1);
    assert.match(outcome.message, /^再想一次。/);
    assert.doesNotMatch(outcome.message, /\d/, `${id} retry text must not carry numbers or the answer`);
    assert.equal(act(round, { type: 'next' }).kind, 'noop', 'no skipping ahead before solving');
    assert.equal(act(round, { type: 'hint' }).kind, 'hint');
    assert.equal(round.feedback, q.hint);
  }
});

test('R48 parents pick 3～4, 5～6 or 7～8; the default follows child mode and question ranges follow the age', () => {
  storage();
  try {
    assert.deepEqual(AGE_BANDS.map(b => b.label), ['3～4 歲', '5～6 歲', '7～8 歲']);
    updateSettings({ childMode: true }); assert.equal(roomLevel(), 'small');
    updateSettings({ childMode: false }); assert.equal(roomLevel(), 'medium');
    setAgeBand('large'); assert.equal(roomLevel(), 'large'); assert.equal(readRoom().ageBand, 'large');
    updateSettings({ childMode: true }); assert.equal(roomLevel(), 'large', 'an explicit parent choice wins over child mode');
    assert.throws(() => setAgeBand('baby'));
    const largest = level => Math.max(...Array.from({ length: 60 }, (_, seed) => createRound({ game: 'count', level, rng: seededRandom(seed) }).questions.map(q => q.answer)).flat());
    assert.equal(largest('small'), 5); assert.equal(largest('medium'), 10); assert.equal(largest('large'), 20);
    const boarding = Array.from({ length: 40 }, (_, seed) => createRound({ game: 'boarding', level: 'large', rng: seededRandom(seed) }).questions).flat();
    assert.ok(boarding.some(q => q.answer > 10) && boarding.every(q => q.answer <= 20), '7～8 歲 adds numbers within 20');
    assert.ok(Array.from({ length: 40 }, (_, seed) => createRound({ game: 'boarding', level: 'medium', rng: seededRandom(seed) }).questions).flat().every(q => q.answer <= 10));
    assert.throws(() => createRound({ game: 'boarding', level: 'small' }), /not available/);
    updateSettings({ childMode: true });
  } finally { done(); }
});

test('R48 finishing a round stamps that game once and remembers its tasks to avoid repeats', () => {
  const m = storage();
  try {
    const round = createRound({ game: 'count', level: 'medium', rng: seededRandom(3) });
    assert.deepEqual(recordRound('count', round.questions), { stamps: 1, saved: true });
    assert.equal(recordRound('count', []).stamps, 2);
    const room = JSON.parse(m.get(STUDENT_KEY)).sections[ROOM_SECTION];
    assert.equal(room.stamps.count, 2); assert.equal(room.rounds, 2);
    assert.deepEqual(room.recentQuestions, round.questions.map(questionSignature));
    const next = createRound({ game: 'count', level: 'medium', rng: seededRandom(3), recentQuestions: readRoom().recentQuestions });
    assert.ok(next.questions.every(q => !room.recentQuestions.includes(questionSignature(q))));
  } finally { done(); }
});

const backup = passport => JSON.stringify({ format: 'taiwan-train-math.backup', version: 1, passport: { version: 1, ...passport }, session: null });
test('R48 an imported 小小列車長 backup in the student card archive comes back as stamps', () => {
  storage();
  try {
    importTrainBackup(backup({ completed: ['700t', 'e5', 'not-a-train', 42], trips: 6, souvenirs: ['apple', 'bogus'], journeysCompleted: ['forest'] }));
    assert.ok(readAcademy().archive);
    const legacy = syncLegacy({ storage: null });
    assert.deepEqual(legacy, { completed: ['700t', 'e5'], trips: 6, souvenirs: ['apple'], journeysCompleted: ['forest'], sources: ['archive'] });
    assert.deepEqual(readStudent().sections[ROOM_SECTION].legacy, legacy, 'kept in the student card even if the archive changes later');
    const summary = legacySummary();
    assert.deepEqual(summary.trains, [LEGACY_TRAIN_NAMES['700t'], LEGACY_TRAIN_NAMES.e5]);
    assert.equal(summary.souvenirs[0].name, '分享蘋果'); assert.equal(summary.journeys[0].name, '森林郵差'); assert.equal(summary.any, true);
    assert.equal(decodeLegacyArchive('{"format":"other"}'), null); assert.equal(decodeLegacyArchive('{broken'), null);
  } finally { done(); }
});

test('R48 the same-origin taiwan-train-math.v1 key is joined when readable and ignored quietly when not', () => {
  const old = JSON.stringify({ version: 1, level: 'large', completed: ['e5', 'temu1000'], trips: 4, souvenirs: ['shell'], journeysCompleted: [] });
  storage([[LEGACY_KEY, old]]);
  try {
    assert.deepEqual(readLegacyLocal().completed, ['e5', 'temu1000']);
    importTrainBackup(backup({ completed: ['700t', 'e5'], trips: 6 }));
    const legacy = syncLegacy();
    assert.deepEqual(legacy.completed, ['700t', 'e5', 'temu1000']);
    assert.equal(legacy.trips, 6, 'the same passport seen twice never adds trips together');
    assert.deepEqual(legacy.sources, ['archive', 'local']);
    localStorage.removeItem(LEGACY_KEY);
    assert.deepEqual(syncLegacy().completed, ['700t', 'e5', 'temu1000'], 'stamps already joined stay after the old key disappears');
  } finally { done(); }
  for (const store of [null, { getItem: () => { throw Error('SecurityError'); } }, { getItem: () => '{broken' }, { getItem: () => '{"version":2}' }, { getItem: () => 'x'.repeat(300000) }])
    assert.equal(readLegacyLocal(store), null);
  globalThis.localStorage = { getItem: () => { throw Error('denied'); }, setItem: () => { throw Error('denied'); }, removeItem() {} };
  try { assert.doesNotThrow(() => syncLegacy()); assert.equal(legacySummary(readRoom()?.legacy).any, false); } finally { done(); }
});

test('R48 stamp names stay in sync with the ported 1.11.0 catalogue', () => {
  const { trains } = JSON.parse(read('src/games/math/data/trains.json'));
  assert.deepEqual(Object.keys(LEGACY_TRAIN_NAMES).sort(), trains.map(t => t.id).sort());
  for (const t of trains) assert.equal(LEGACY_TRAIN_NAMES[t.id], t.displayCardLabel || t.cardLabel || t.name);
});

test('R48 both home math entries open the game room and the dispatch lesson is registered as its first math game', () => {
  const html = read('index.html'), ui = read('src/shared/academy-ui.js'), home = read('src/home.js');
  assert.match(html, /<button id="math-practice">數學遊戲室<\/button>/);
  assert.match(ui, /import \{installMathRoom\} from '\.\.\/games\/math\/room-ui\.js'/);
  assert.match(ui, /start\.onclick=\(\)=>\{const s=academySummary\(\);if\(s\.next&&s\.index>0\)\{launchJourney\(journeyById\(s\.next\.id\),\{academy:true\}\);return;\}room\.open\('math'\);\};/, '列車數學課 opens the room while chapter 1 (or the finished badge) is current');
  assert.match(ui, /practice\.onclick=\(\)=>room\.open\('math'\)/, '數學遊戲室 button opens the room');
  assert.match(ui, /registerMathGame\(\{id:'dispatch',category:'math',name:'拆合車廂調度台'[^]*?order:5,/);
  assert.match(ui, /open:ctx=>\{ctx\.hideRoom\(\);openDispatch\(\(\)=>ctx\.exit\(\)\);\}/, 'closing the dispatch lesson returns to the room');
  assert.match(ui, /next\.onclick=\(\)=>\{returnTo=null;close\(\);launchJourney/, 'the mainline hand-off still goes to the train chapter');
  assert.equal((ui.match(/childMode\?'small':'medium'/g) || []).length, 0, 'dispatch level follows the parent age band');
  assert.match(ui, /performDispatch\('start',roomLevel\(\)\)/);
  assert.match(html, /<select id="math-age"><option value="small">3～4 歲<\/option><option value="medium">5～6 歲<\/option><option value="large">7～8 歲<\/option><\/select>/);
  assert.match(home, /\$\('math-age'\)\.value = roomLevel\(readRoom\(\), value\);/);
  assert.match(home, /\$\('math-age'\)\.onchange = event => setAgeBand\(event\.target\.value\);/);
  assert.match(home, /addEventListener\('academy:open-family-settings'/);
});

test('R48 the room screen has four real tabs, a parent-gated age button, a stamp book and child-sized controls', () => {
  const ui = read('src/games/math/room-ui.js'), css = read('src/games/math/room.css');
  assert.match(ui, /role="tablist" aria-label="遊戲分類"/);
  assert.match(ui, /ROOM_CATEGORIES\.map\(group => `<button type="button" role="tab"/);
  assert.match(ui, /data-room="age" data-parent-action/, 'changing age goes through the existing parent gate');
  assert.match(ui, /recordRound\(round\.game, round\.questions\)/, 'a finished round stamps the collection');
  assert.match(ui, /syncLegacy\(\)/);
  const ctx = ui.slice(ui.indexOf('const ctx = Object.freeze({'), ui.indexOf('try { const cleanup = game.open(ctx);'));
  for (const name of ['level:', 'ageLabel:', 'stage,', 'setTitle(', 'complete()', 'exit()', 'hideRoom()', 'speak:', 'get paused()']) assert.ok(ctx.includes(name), `ctx.${name}`);
  assert.match(ui, /speakNative\(/, 'questions can be read aloud with the existing voice');
  assert.match(css, /#math-room button\{min-width:60px;min-height:60px\}/);
  assert.match(css, /@media \(max-height:500px\) and \(orientation:landscape\)/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)/);
  assert.doesNotMatch(ui, /setTimeout|setInterval|倒數|計時/, 'no timers or countdowns in the room');
});
