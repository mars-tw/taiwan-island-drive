import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { ROOM_CATEGORIES, ROUND_GAMES, PHOTO_GAMES, registerMathGame, mathGames } from '../../src/games/math/room-registry.js';
import { GAME_ICON_IDS, TAB_ICON_IDS, gameIconPath, tabIconPath } from '../../src/games/math/room-icons.js';
import { registerRailGames } from '../../src/games/puzzles/math-room.js';

const read = path => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const publicFile = path => new URL(`../../public/${path}`, import.meta.url);
/** Width/height of a WebP file (lossy VP8, lossless VP8L or extended VP8X) and whether it can carry alpha. */
function webpInfo(url) {
  const b = readFileSync(url);
  assert.equal(b.toString('ascii', 0, 4), 'RIFF', `${url.pathname} is RIFF`);
  assert.equal(b.toString('ascii', 8, 12), 'WEBP', `${url.pathname} is WebP`);
  const kind = b.toString('ascii', 12, 16);
  if (kind === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3), alpha: !!(b[20] & 0x10), bytes: b.length };
  if (kind === 'VP8L') { const bits = b.readUInt32LE(21); return { w: 1 + (bits & 0x3fff), h: 1 + ((bits >> 14) & 0x3fff), alpha: !!((bits >> 28) & 1), bytes: b.length }; }
  return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff, alpha: false, bytes: b.length };
}

test('R49 every game registered in the math room has its own icon file, and so does every tab', () => {
  // The 17 ported games register on import; the five rail games and the dispatch table register in installAcademy().
  const undo = registerRailGames(registerMathGame);
  try {
    const academy = read('src/shared/academy-ui.js');
    const academyIds = [...academy.matchAll(/registerMathGame\(\{id:'([a-z0-9-]+)'/g)].map(m => m[1]);
    assert.deepEqual(academyIds, ['dispatch'], 'the academy registers the dispatch table itself');
    const registered = [...mathGames().map(g => g.id), ...academyIds];
    assert.equal(registered.length, 23, '17 ported + 5 rail + dispatch');
    assert.deepEqual([...registered].sort(), [...GAME_ICON_IDS].sort(), 'one icon per registered game, no extras');
    for (const id of registered) {
      const path = gameIconPath(id);
      assert.ok(path, `${id} has an icon path`);
      assert.ok(existsSync(publicFile(path)), `${path} exists`);
    }
  } finally { undo.forEach(fn => fn()); }
  assert.deepEqual(ROOM_CATEGORIES.map(c => c.id), [...TAB_ICON_IDS]);
  for (const { id } of ROOM_CATEGORIES) assert.ok(existsSync(publicFile(tabIconPath(id))), `tab ${id} icon exists`);
  for (const id of PHOTO_GAMES) assert.equal(gameIconPath(id), null, `${id} waits for the photo batch and keeps its text symbol`);
  assert.equal(ROUND_GAMES.every(id => GAME_ICON_IDS.includes(id)), true);
});

test('R49 icons are small square WebP badges (≤ 40 KB each) and the room actually shows them', () => {
  let total = 0;
  for (const path of [...GAME_ICON_IDS.map(gameIconPath), ...TAB_ICON_IDS.map(tabIconPath)]) {
    const info = webpInfo(publicFile(path));
    assert.equal(info.w, info.h, `${path} is square`);
    assert.ok(info.w >= 128, `${path} is at least 128 px for sharp 56 px circles on 2x screens`);
    assert.ok(info.bytes <= 40 * 1024, `${path} is ${info.bytes} bytes`);
    total += info.bytes;
  }
  assert.ok(total <= 27 * 40 * 1024);
  const ui = read('src/games/math/room-ui.js');
  assert.match(ui, /class="room-card-icon\$\{gameIconPath\(game\.id\) \? ' has-art' : ''\}" aria-hidden="true">\$\{gameIcon\(game\.id, game\.icon\)\}/, 'cards use the icon image');
  assert.match(ui, /class="room-tab-icon" aria-hidden="true">\$\{tabIcon\(group\.id, group\.icon\)\}/, 'tabs use the icon image');
  assert.match(ui, /alt="" width="\$\{size\}" height="\$\{size\}"/, 'icons are decorative; the card name stays the accessible label');
  const css = read('src/games/math/room.css');
  assert.match(css, /\.room-tab-icon\{display:block;flex:none;width:44px;height:44px/, 'tab icons are as big as the 123 label was bold');
  assert.match(css, /\.room-icon-img\{display:block;width:100%;height:100%;object-fit:cover;border-radius:50%\}/, 'square art is cropped to a circle');
});

test('R49 the speaker buttons are a solid yellow button with a navy icon, still at least 60 px', () => {
  const room = read('src/games/math/room.css'), rail = read('src/games/puzzles/rail-play.css');
  assert.match(room, /#math-room button\{min-width:60px;min-height:60px\}/, 'room buttons stay child-sized');
  assert.match(rail, /#rail-play button\{[^}]*min-width:60px;min-height:60px/, 'rail game buttons stay child-sized');
  assert.match(room, /#math-room \.room-speak\{padding:0;display:grid;place-items:center;background:var\(--room-yellow\);border:3px solid var\(--room-navy\)/);
  assert.match(rail, /#rail-play \.rp-speak\{padding:0;display:grid;place-items:center;background:var\(--rp-gold\);border-color:var\(--rp-ink\)/);
  for (const sheet of [room, rail]) assert.doesNotMatch(sheet, /\.r[op]-speak\{[^}]*(?:min-width|min-height|width|height):(?:[0-5]?\d)px/, 'no smaller size on the speaker');
  for (const file of ['src/games/math/room-ui.js', 'src/games/puzzles/rail-shell.js']) {
    const src = read(file);
    assert.match(src, /SPEAKER_ICON/, `${file} uses the shared speaker icon`);
    assert.doesNotMatch(src, /🔊'/, `${file} no longer uses the pale emoji`);
  }
  assert.match(read('src/shared/speaker-icon.js'), /fill="#143b61"/);
  assert.match(rail, /#rail-play \.rp-switch\{width:66px;height:66px;min-width:66px;min-height:66px/, 'switch buttons stay 66 px');
});

test('R49 card and hint text is one step bigger, and the R48 landscape two-row guard still holds', () => {
  const css = read('src/games/math/room.css'), rail = read('src/games/puzzles/rail-play.css');
  assert.match(css, /\.room-card-copy span\{font-size:15px;/, 'card description 13 → 15 px');
  assert.match(css, /\.room-card-copy small\{font-size:13px;/, 'age line 12 → 13 px');
  assert.match(css, /\.room-coach\{[^}]*font-size:18px;/, 'room hint bubble 16 → 18 px');
  assert.match(rail, /\.rp-coach\{[^}]*font-size:19px;/, 'rail hint bubble 17 → 19 px');
  assert.match(rail, /@media \(max-width:600px\) and \(orientation:portrait\)\{[^@]*\.rp-coach\{font-size:17px;/, 'phone upright 15 → 17 px');
  assert.match(rail, /@media \(max-height:520px\) and \(orientation:landscape\)\{[^@]*\.rp-coach\{[^}]*font-size:16px;/, 'phone sideways 14 → 16 px');
  // R48 guard (tests/math/room-polish-r48.test.js) extended to the new icons: short landscape keeps cards short so six fit.
  const landscape = css.slice(css.indexOf('@media (max-height:500px) and (orientation:landscape){'));
  assert.match(landscape, /\.room-card-copy>span\{display:none\}/, 'descriptions still drop out on a short landscape screen');
  assert.match(landscape, /#math-room \.room-card\{min-height:72px;grid-template-columns:46px minmax\(0,1fr\) 22px/);
  assert.match(landscape, /\.room-card-icon\{width:44px;height:44px/);
  assert.match(landscape, /\.room-play \.room-coach\{[^}]*font-size:16px;/, 'sideways hint bubble 14 → 16 px');
  assert.match(landscape, /#math-room \.room-tabs button\{flex-direction:column;[^}]*\}\s*\.room-tab-icon\{width:34px;height:34px\}/, 'tab icon above its name so the 60 px tab keeps one-line names');
  assert.match(css, /@media \(max-height:500px\) and \(orientation:landscape\) and \(min-width:760px\)\{[^}]*\.room-home \.room-body\{display:grid/, 'heading and tabs still share one row when wide enough');
});

test('R49 the switch-platform trains are drawn from above in both orientations', () => {
  const shell = read('src/games/puzzles/rail-shell.js'), art = read('src/games/puzzles/rail-art.js'), ui = read('src/games/puzzles/switch-platform-ui.js');
  assert.match(shell, /trainTop: 'art\/r49\/train-top\.webp'/);
  const info = webpInfo(publicFile('art/r49/train-top.webp'));
  assert.ok(info.alpha, 'train-top.webp keeps its transparent background');
  assert.ok(info.bytes <= 40 * 1024, `train-top.webp is ${info.bytes} bytes`);
  const [, h, w] = art.match(/TRAIN_TOP_RATIO = (\d+) \/ (\d+);/).map(Number);
  assert.deepEqual([w, h], [info.w, info.h], 'ratio constant matches the file');
  assert.match(art, /if \(view === 'top'\)/);
  assert.match(ui, /const VIEW = 'top';/);
  assert.equal((ui.match(/drawTrain\(svg, \{[^}]*view: VIEW \}\)/g) || []).length, 2, 'parked and waiting trains both use the top view');
});
