// R50 L2 group c: the ported playroom scenes (discovery, explorers, workshop, tickets, photo puzzle,
// train photo captions) show no Chinese in English mode, and Chinese mode is unchanged after a switch.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { setLanguage } from '../../src/shared/i18n.js';
import { tx } from '../../src/games/math/room-text.js';
import * as discovery from '../../src/games/math/discovery.js';
import * as explorers from '../../src/games/math/explorers.js';
import * as workshop from '../../src/games/math/workshop.js';
import * as tickets from '../../src/games/math/tickets.js';
import * as puzzle from '../../src/games/math/puzzle.js';
import { photoLabel, puzzlePhotoTrains } from '../../src/games/math/train-images.js';

const HAN = /[㐀-䶿一-鿿豈-﫿]/;
const LEVELS = ['small', 'medium', 'large'];
const SEEDS = Array.from({ length: 20 }, (_, i) => i * 7919 + 11);
const { trains } = JSON.parse(readFileSync(new URL('../../src/games/math/data/trains.json', import.meta.url), 'utf8'));
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const rngFor = seed => { let a = seed >>> 0; return () => { a = a + 0x6d2b79f5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
const pick = (rng, list) => list[Math.floor(rng() * list.length)];
const inEnglish = fn => { setLanguage('en', { persist: false }); try { return fn(); } finally { setLanguage('zh-Hant', { persist: false }); } };

/** Collects Chinese left in the visible text or in aria-label/alt/title values, and attribute
 *  values broken by an unescaped quote in English text. */
function checker() {
  const problems = new Set();
  const html = (where, markup) => {
    for (const m of markup.matchAll(/\s(?:aria-label|alt|title|placeholder)="([^"]*)"/g)) if (HAN.test(m[1])) problems.add(`${where} attribute: ${m[1]}`);
    for (const piece of markup.replace(/<[^>]*>/g, '\n').split('\n')) if (HAN.test(piece)) problems.add(`${where} text: ${piece.trim()}`);
    const broken = /="[^"]*"[^\s>/]/.exec(markup.replace(/<g( transform="[^"]*")?>/g, '<g>'));
    if (broken) problems.add(`${where} broken attribute near: ${markup.slice(Math.max(0, broken.index - 40), broken.index + 40)}`);
  };
  const text = (where, value) => { const out = tx(value); if (HAN.test(out)) problems.add(`${where}: ${value} → ${out}`); };
  return { html, text, problems };
}

test('R50 discovery scenes (mosaic, differences) have no Chinese in English mode', () => inEnglish(() => {
  const c = checker();
  for (const color of discovery.MOSAIC_PALETTE) c.text('palette', color.name);
  for (const theme of discovery.DIFFERENCE_THEMES) c.text('theme', theme.name);
  for (const level of LEVELS) for (const seed of SEEDS) {
    const rng = rngFor(seed + 1);
    const q = discovery.createMosaicQuestion({ level, rng: rngFor(seed) });
    c.text('mosaic prompt', q.prompt); c.text('mosaic hint', q.hint); c.text('mosaic picture', q.templateName);
    let state = discovery.newDiscoveryState(q);
    for (let step = 0; step < 12; step++) {
      state = rng() < 0.3 ? discovery.selectMosaicColor(q, state, pick(rng, ['green', 'orange', 'blue', 'empty']))
        : discovery.paintMosaicCell(q, state, Math.floor(rng() * q.columns * q.rows));
      c.html('mosaic', discovery.discoveryScene(q, { discovery: state, solved: step === 11 }, { esc }));
    }
    const d = discovery.createDifferencesQuestion({ level, rng: rngFor(seed) });
    c.text('differences prompt', d.prompt); c.text('differences hint', d.hint);
    let found = discovery.newDiscoveryState(d);
    c.html('differences', discovery.discoveryScene(d, { discovery: found }, { esc }));
    for (const index of d.differences) {
      found = discovery.findDifference(d, found, index);
      c.html('differences', discovery.discoveryScene(d, { discovery: found, solved: found.differencesFound.size === d.answer }, { esc }));
    }
  }
  assert.deepEqual([...c.problems], []);
}));

test('R50 explorer scenes (bags, station maze) have no Chinese in English mode', () => inEnglish(() => {
  const c = checker();
  for (const direction of Object.values(explorers.MAZE_DIRECTIONS)) c.text('maze direction', direction.name);
  for (const level of LEVELS) for (const seed of SEEDS) {
    const rng = rngFor(seed + 5);
    const q = explorers.createLuggageQuestion({ level, rng: rngFor(seed) });
    c.text('luggage prompt', q.prompt); c.text('luggage hint', q.hint);
    for (const bin of q.bins) { c.text('basket', bin.label); if (bin.colorName) c.text('basket color', bin.colorName); if (bin.shapeName) c.text('basket shape', bin.shapeName); }
    for (const item of q.items) { c.text('bag color', item.colorName); c.text('bag shape', item.shapeName); }
    let state = explorers.newExplorerState(q);
    for (let step = 0; step < 16; step++) {
      state = rng() < 0.5 ? explorers.selectLuggage(q, state, Math.floor(rng() * q.items.length)) : explorers.putLuggage(q, state, pick(rng, q.bins).id);
      c.html('luggage', explorers.explorerScene(q, { explorer: state, solved: false }, { esc }));
    }
    c.html('luggage done', explorers.explorerScene(q, { explorer: { ...explorers.newExplorerState(q), luggageAssignments: [...q.answer] }, solved: true }, { esc }));
    const maze = explorers.createMazeQuestion({ level, rng: rngFor(seed) });
    c.text('maze prompt', maze.prompt); c.text('maze hint', maze.hint);
    let position = explorers.newExplorerState(maze);
    for (let step = 0; step < 20; step++) {
      position = explorers.moveMaze(maze, position, pick(rng, Object.keys(explorers.MAZE_DIRECTIONS)));
      c.html('maze', explorers.explorerScene(maze, { explorer: position, solved: position.mazePosition === maze.finish }, { esc }));
    }
    c.html('maze at the stop', explorers.explorerScene(maze, { explorer: { ...position, mazePosition: maze.finish, mazeVisited: new Set([maze.finish]) }, solved: true }, { esc }));
  }
  assert.deepEqual([...c.problems], []);
}));

test('R50 workshop scenes (arrow plan, cargo scale) have no Chinese in English mode', () => inEnglish(() => {
  const c = checker();
  const D = workshop.PROGRAM_DIRECTIONS;
  for (const direction of Object.values(D)) c.text('program direction', direction.name);
  for (const level of LEVELS) for (const seed of SEEDS) {
    const rng = rngFor(seed + 9);
    const q = workshop.createProgramQuestion({ level, rng: rngFor(seed) });
    c.text('program prompt', q.prompt); c.text('program hint', q.hint);
    // Shortest plan, so the arrived state is covered too; then random plans (blocked, stopped, full).
    const from = new Map([[q.start, null]]), queue = [q.start];
    while (queue.length) {
      const at = queue.shift();
      for (const [name, d] of Object.entries(D)) {
        const x = at % q.columns + d.dx, y = Math.floor(at / q.columns) + d.dy, next = y * q.columns + x;
        if (x < 0 || y < 0 || x >= q.columns || y >= q.rows || q.walls[at] & d.bit || q.walls[next] & d.opposite || from.has(next)) continue;
        from.set(next, [at, name]); queue.push(next);
      }
    }
    const route = []; for (let at = q.finish; from.get(at); at = from.get(at)[0]) route.unshift(from.get(at)[1]);
    const plans = [route, ...Array.from({ length: 4 }, () => Array.from({ length: 1 + Math.floor(rng() * q.maxCommands) }, () => pick(rng, Object.keys(D))))];
    for (const plan of plans) {
      let state = workshop.newWorkshopState(q);
      for (const name of plan) state = workshop.appendCommand(q, state, name);
      c.html('program planning', workshop.workshopScene(q, { workshop: state }, { esc }));
      const run = workshop.evaluateProgram(q, state.commands);
      const middle = Math.max(1, Math.ceil(run.trace.length / 2));
      c.html('program running', workshop.workshopScene(q, { workshop: { ...state, programPosition: run.trace[middle - 1], programTrace: run.trace.slice(0, middle) }, programRunning: true }, { esc }));
      const done = { ...state, programChecked: true, programPosition: run.position, programTrace: [...run.trace] };
      c.html('program checked', workshop.workshopScene(q, { workshop: done, solved: run.arrived }, { esc }));
      c.html('program extended', workshop.workshopScene(q, { workshop: workshop.appendCommand(q, done, 'up') }, { esc }));
    }
    const b = workshop.createBalanceQuestion({ level, rng: rngFor(seed) });
    c.text('balance prompt', b.prompt); c.text('balance hint', b.hint);
    let load = workshop.newWorkshopState(b);
    c.html('balance empty', workshop.workshopScene(b, { workshop: load }, { esc }));
    for (let step = 0; step < 6; step++) {
      load = workshop.addWeight(b, load, pick(rng, b.allowedWeights));
      const total = workshop.weightTotal(b, load.weights);
      for (const checked of [false, true]) {
        const state = { ...load, balanceChecked: checked, balanceTilt: checked ? Math.sign(b.target - total) : 0 };
        c.html('balance', workshop.workshopScene(b, { workshop: state, solved: checked && total === b.target }, { esc }));
      }
    }
    c.html('balance level', workshop.workshopScene(b, { workshop: { ...load, balanceChecked: true, balanceTilt: 0 } }, { esc }));
  }
  assert.deepEqual([...c.problems], []);
}));

test('R50 ticket helper scene has no Chinese in English mode', () => inEnglish(() => {
  const c = checker();
  for (const level of LEVELS) for (const seed of SEEDS) {
    const rng = rngFor(seed + 13);
    const q = tickets.createTicketsQuestion({ level, rng: rngFor(seed) });
    c.text('tickets prompt', q.prompt); c.text('tickets hint', q.hint);
    for (const ticket of q.tickets) c.text('destination', ticket.destination);
    let state = tickets.newTicketsState(q);
    for (let step = 0; step < 14; step++) {
      const op = rng();
      state = op < 0.2 ? tickets.selectTicket(q, state, Math.floor(rng() * q.tickets.length)) : op < 0.8 ? tickets.payToken(q, state, Math.floor(rng() * q.wallet.length))
        : tickets.returnToken(q, state, Math.floor(rng() * q.wallet.length));
      for (const checked of [false, true]) c.html('tickets', tickets.ticketsScene(q, { tickets: { ...state, checked }, solved: false }, { esc }));
      c.html('tickets solved', tickets.ticketsScene(q, { tickets: state, solved: true }, { esc }));
    }
  }
  assert.deepEqual([...c.problems], []);
}));

test('R50 photo puzzle and photo captions have no Chinese in English mode', () => inEnglish(() => {
  const c = checker();
  for (const train of trains) {
    c.text('photo caption', photoLabel(train));
    c.text('photo caption (future)', photoLabel({ ...train, status: 'future' }));
    if (train.referencePhoto) c.text('photo caption (inside)', photoLabel({ ...train, referencePhoto: { ...train.referencePhoto, view: 'interior' } }));
  }
  c.text('photo caption (none)', photoLabel({ id: 'none' }));
  // Train names are catalogue data translated with the train table; here every photo gets a name
  // from this group's dictionary, so the test checks the puzzle's own sentences.
  const photos = puzzlePhotoTrains(trains).map(train => ({ ...train, name: '小火車' }));
  assert.ok(photos.length > 0);
  for (const level of LEVELS) for (const seed of SEEDS) {
    const rng = rngFor(seed + 21);
    const q = puzzle.createPuzzleQuestion({ level, train: pick(rng, photos), rng: rngFor(seed) });
    c.text('puzzle prompt', q.prompt); c.text('puzzle hint', q.hint);
    let state = puzzle.newPuzzleState(q);
    for (let step = 0; step < 12; step++) {
      const op = rng();
      state = op < 0.4 ? puzzle.selectPuzzlePiece(q, state, pick(rng, q.pieces)) : op < 0.85 ? puzzle.placePuzzlePiece(q, state, Math.floor(rng() * q.pieces.length)) : { ...state, preview: !state.preview };
      c.html('puzzle', puzzle.puzzleScene(q, { puzzle: state }, { esc }));
    }
    c.html('puzzle all placed', puzzle.puzzleScene(q, { puzzle: { ...puzzle.newPuzzleState(q), placements: [...q.answer] } }, { esc }));
    c.html('puzzle solved', puzzle.puzzleScene(q, { solved: true }, { esc }));
  }
  assert.deepEqual([...c.problems], []);
}));

test('R50 a language switch redraws these scenes and Chinese comes back unchanged', () => {
  const q = tickets.createTicketsQuestion({ level: 'large', rng: rngFor(5) });
  const state = tickets.payToken(q, tickets.newTicketsState(q), 0);
  const program = workshop.createProgramQuestion({ level: 'medium', rng: rngFor(6) });
  const plan = workshop.appendCommand(program, workshop.newWorkshopState(program), 'right');
  const draw = () => [tickets.ticketsScene(q, { tickets: state }, { esc }), workshop.workshopScene(program, { workshop: plan }, { esc }), tx(q.prompt), tx(program.prompt)];
  const before = draw();
  const english = inEnglish(draw);
  assert.ok(english.every(markup => !HAN.test(markup.replace(/<[^>]*>/g, ''))));
  assert.match(english[0], /Shared coin tray/);
  assert.match(english[1], /aria-label="Step 1: go right\. Tap to delete it\."/);
  assert.deepEqual(draw(), before, 'Chinese output is the same before and after an English render');
  assert.match(before[0], /共用遊戲代幣盤/);
});
