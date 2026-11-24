// R48 數學遊戲室畫面：學院對話框裡的四分類遊戲室、一輪遊玩、集章冊（學院新程式，MIT）。
// 數數乘客、排車廂、比一比、答案按鈕與手機操作列的寫法改寫自 Taiwan Train Math 1.11.0
// src/app.js（Copyright 2026 mars-tw，Apache-2.0）；各玩法畫面直接用移植的 *Scene 函式。
import './styles/workshop.css';
import './styles/explorers.css';
import './styles/discovery.css';
import './styles/tickets.css';
import './room.css';
import { GAMES, LEVELS, clockLabel } from './engine.js';
import { activityScene, patternToken, patternName } from './activities.js';
import { adventureScene } from './adventure-ui.js';
import { explorerScene } from './explorers.js';
import { workshopScene } from './workshop.js';
import { discoveryScene } from './discovery.js';
import { ticketsScene } from './tickets.js';
import { countingScene } from './learning-ui.js';
import { arithmeticScene } from './arithmetic-ui.js';
import { createProgramPlayback } from './program-playback.js';
import { ROOM_CATEGORIES, ageBand, agesText, mathGame, mathGames } from './room-registry.js';
import { createRound, act, currentQuestion, roundGuide } from './room-play.js';
import { readRoom, roomLevel, recordRound, syncLegacy, legacySummary } from './room-store.js';
import { gameIconPath, tabIconPath } from './room-icons.js';
import { appUrl } from '../../shared/paths.js';
import { SPEAKER_ICON } from '../../shared/speaker-icon.js';
import { phraseHtml } from '../../shared/phrase-wrap.js';
import { celebrate, playChime } from '../../shared/celebrate.js';
import { readSettings, subscribeSettings } from '../../shared/settings.js';
import { studentSaved } from '../../shared/student-save.js';
import { speakNative, stopNativeSpeech, pauseNativeGames, registerGameLifecycle, registerNativeOverlay } from '../../shared/native.js';

const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const art = path => appUrl(`art/${path}`);
// R49：玩法與分頁的圓形徽章圖；沒有圖的玩法仍顯示原本的文字符號（都只是裝飾，名稱在旁邊的文字裡）。
const iconImg = (path, size) => `<img class="room-icon-img" src="${appUrl(path)}" alt="" width="${size}" height="${size}" decoding="async" draggable="false">`;
const gameIcon = (id, fallback, size = 56) => { const path = gameIconPath(id); return path ? iconImg(path, size) : esc(fallback); };
const tabIcon = (id, fallback) => { const path = tabIconPath(id); return path ? iconImg(path, 44) : esc(fallback); };
// Same submit/reset buttons the 1.11.0 phone layout moved into the bottom action dock.
const PRIMARY = { boarding: 'boarding-submit', luggage: 'luggage-submit', tracks: 'tracks-submit', sharing: 'sharing-submit', order: 'order-submit', cargo: 'cargo-submit', program: 'program-run', balance: 'balance-check', mosaic: 'mosaic-submit', tickets: 'tickets-check' };
const DOCK_RESET = { sharing: ['sharing-reset', '重分'], program: ['program-reset', '重排'], mosaic: ['mosaic-reset', '清空'], tickets: ['tickets-reset', '取回'], maze: ['maze-reset', '回起點'], luggage: ['luggage-reset', '重放'], tracks: ['tracks-reset', '重鋪'] };
const CHOICE_GAMES = ['count', 'compare', 'pattern', 'clock'];
const ID_ACTIONS = ['order-reset', 'order-submit', 'cargo-reset', 'cargo-submit', 'tracks-reset', 'tracks-submit', 'sharing-reset', 'sharing-submit', 'luggage-reset', 'luggage-submit', 'maze-reset', 'program-reset', 'balance-reset', 'balance-check', 'mosaic-reset', 'mosaic-submit', 'tickets-reset', 'tickets-check'];
const DATA_ACTIONS = [['answer', 'answer'], ['count', 'count'], ['order', 'order'], ['removeOrder', 'remove-order'], ['digit', 'digit'], ['load', 'load'], ['unload', 'unload'], ['rotate', 'rotate'], ['share', 'share'], ['returnSnack', 'return-snack'], ['find', 'find'], ['luggageItem', 'luggage-item'], ['luggageBin', 'luggage-bin'], ['mazeDirection', 'maze'], ['programDirection', 'program-direction'], ['programRemove', 'program-remove'], ['balanceWeight', 'balance-weight'], ['balanceRemove', 'balance-remove'], ['mosaicColor', 'mosaic-color'], ['mosaicCell', 'mosaic-cell'], ['differenceCell', 'difference'], ['ticketSelect', 'ticket-select'], ['ticketPay', 'ticket-pay'], ['ticketRemove', 'ticket-remove']];

// ---- 1.11.0 scene pieces not inside a ported *Scene function -------------
const passenger = index => `<img class="room-person" src="${art(`r5/passenger-${index % 6 + 1}-0.png`)}" alt="" width="48" height="76" draggable="false">`;
// R49 修正輪：答案點點照骰子排（4 是 2×2、5 是四角加中間、6 是兩直排），3 排成三角形；位置是 3×3 格子的 1～9 號。
const DICE = { 1: [5], 2: [3, 7], 3: [2, 7, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9], 7: [1, 3, 4, 5, 6, 7, 9], 8: [1, 2, 3, 4, 6, 7, 8, 9], 9: [1, 2, 3, 4, 5, 6, 7, 8, 9] };
const dotCard = n => n === 0 ? '<span class="zero-dots">沒有</span>' : DICE[n] ? `<span class="dot-card dice" aria-label="${n} 個點">${DICE[n].map(cell => `<i class="dot-p${cell}"></i>`).join('')}</span>` : `<span class="dot-card" aria-label="${n} 個點">${'<i></i>'.repeat(n)}</span>`;
const ticketPile = n => `<div class="ticket-pile">${'<span class="tiny-ticket" aria-hidden="true">🎟</span>'.repeat(n)}</div>`;
function scene(round) {
  const q = currentQuestion(round);
  if (q.game === 'tickets') return ticketsScene(q, round, { esc });
  if (['program', 'balance'].includes(q.game)) return workshopScene(q, round, { esc });
  if (['mosaic', 'differences'].includes(q.game)) return discoveryScene(q, round, { esc });
  if (['luggage', 'maze'].includes(q.game)) return explorerScene(q, round, { esc });
  if (['tracks', 'sharing', 'treasure'].includes(q.game))
    return adventureScene(q, round).replace('src="assets/images/railway-world-v2.webp" alt="想像鐵道樂園尋寶風景"', `src="${art('r6/coast.webp')}" alt="海岸鐵道風景"`);
  if (['pattern', 'cargo', 'clock'].includes(q.game)) return activityScene(q, round, { esc, byId: () => null, image: () => '' });
  // R49 修正輪：6 位以內的乘客放大約 1.5 倍（直式手機下方原本空一大片）。
  if (q.game === 'count') return countingScene(q, round, { person: passenger }).replace('class="passengers ', `class="passengers ${q.count <= 6 ? 'few ' : ''}`);
  if (q.game === 'compare') return `<div class="compare-stage"><div><span class="stage-label">左邊的車票</span>${ticketPile(q.left)}</div><div><span class="stage-label">右邊的車票</span>${ticketPile(q.right)}</div></div>`;
  if (q.game === 'boarding') return arithmeticScene(q, { solved: round.solved, input: round.boardingInput, touch: !round.nativeKeyboard });
  if (q.game === 'order') return `<div class="sorting-stage"><span class="stage-label">點下面的數字，排進車廂</span><div class="sorting-track"><span class="toy-engine" aria-hidden="true">🚂</span>${q.answer.map((_, i) => `<button type="button" class="carriage-slot ${round.order[i] !== undefined ? 'filled' : ''}" data-remove-order="${i}" ${round.solved ? 'disabled' : ''} aria-label="第 ${i + 1} 節${round.order[i] !== undefined ? `，數字 ${round.order[i]}，點一下拿回來` : '，空車廂'}">${round.order[i] ?? '?'}</button>`).join('')}</div><div class="sorting-bank">${q.numbers.map(n => `<button type="button" class="number-carriage" data-order="${n}" ${round.order.includes(n) || round.solved ? 'disabled' : ''} aria-label="放入數字 ${n}">${n}</button>`).join('')}</div><div class="sort-actions"><button type="button" class="text-btn" id="order-reset" ${round.solved || !round.order.length ? 'disabled' : ''}>重新排</button><button type="button" class="primary-btn" id="order-submit" ${round.order.length !== q.answer.length || round.solved ? 'disabled' : ''}>排好了 ✓</button></div></div>`;
  return '';
}
function choices(round) {
  const q = currentQuestion(round);
  if (!CHOICE_GAMES.includes(q.game)) return '';
  return `<div class="answers answers-${q.game}" role="group" aria-label="選一個答案">${q.choices.map(value => {
    const label = q.game === 'clock' ? clockLabel(value) : q.game === 'compare' ? { left: '左邊多', right: '右邊多', equal: '一樣多' }[value]
      : q.game === 'pattern' ? `${patternToken(q, value)}<small>${esc(patternName(q, value))}</small>` : q.level === 'small' ? dotCard(value) : value;
    const aria = q.game === 'pattern' ? patternName(q, value) : q.game === 'compare' || q.game === 'clock' ? label : `答案 ${value}`;
    return `<button type="button" class="answer-number" data-answer="${esc(value)}" aria-label="${esc(aria)}">${label}</button>`;
  }).join('')}</div>`;
}

// ---- the room dialog ------------------------------------------------------
export function installMathRoom() {
  if (typeof document === 'undefined') return null;
  const existing = document.getElementById('math-room');
  if (existing?.mathRoom) return existing.mathRoom;
  const dialog = document.createElement('dialog');
  dialog.id = 'math-room'; dialog.setAttribute('aria-label', '數學遊戲室');
  document.body.append(dialog);
  const ui = { view: 'home', category: 'math', round: null, game: null, paused: false, notice: '', external: null, hidden: false, last: null, opener: null };
  const playback = createProgramPlayback({ delay: () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 420 });
  const level = () => roomLevel();

  function speak(text) { if (!readSettings().muted && text) void speakNative(text, { lang: 'zh-TW', rate: .83, pitch: 1.08 }); }
  function nav() {
    // Same academy navigation the dispatch lesson rebuilds; the first link closes the room.
    const links = [...document.querySelectorAll('body>.academy-nav>a')].map(link => link.cloneNode(true));
    if (!links.length) return '<nav class="room-nav"><button type="button" data-room="close">← 回學院</button></nav>';
    const holder = document.createElement('nav'); holder.className = 'room-nav academy-nav'; holder.append(...links);
    holder.querySelector('a').dataset.room = 'close'; holder.querySelector('a').removeAttribute('aria-current');
    return holder.outerHTML;
  }
  const bar = (title, { back = '← 遊戲室', speakable = false, pausable = true, step = '' } = {}) =>
    `<header class="room-bar"><button type="button" data-room="back" class="room-back">${back}</button><h2 class="room-bar-title">${title}</h2>${step ? `<span class="room-bar-step" aria-hidden="true">${step}</span>` : ''}${speakable ? `<button type="button" data-room="speak" class="room-speak" aria-label="聽題目">${SPEAKER_ICON}</button>` : ''}${pausable ? '<button type="button" data-room="pause" class="room-pause">暫停</button>' : ''}</header>`;
  const coach = (text, tone = '') => `<p class="room-coach ${tone ? `is-${tone}` : ''}" role="status" aria-live="polite"><img src="${art(`r6/${tone === 'success' ? 'coach-cheer' : 'coach'}.png`)}" alt="" width="60" height="80"><span>${phraseHtml(text)}</span></p>`;
  const saveNote = () => studentSaved() ? '' : '<p class="room-save-note" role="status">這次無法儲存，關掉後集章可能不會保留。</p>';

  function stampsFor(game, room) {
    if (game.kind === 'external' && typeof game.status === 'function') { try { const s = game.status(); if (Number.isSafeInteger(s?.stamps)) return s.stamps; } catch { /* keep room count */ } }
    return room.stamps[game.id] || 0;
  }
  function statusFor(game) { try { return typeof game.status === 'function' ? game.status() || {} : {}; } catch { return {}; } }
  function card(game, room) {
    const status = statusFor(game), stamps = stampsFor(game, room), ageText = agesText(game.levels);
    return `<button type="button" class="room-card ${game.playable ? '' : 'room-card-later'} ${status.highlight ? 'room-card-highlight' : ''}" data-room-game="${esc(game.id)}" aria-label="${esc(`${game.name}，${game.description}${game.playable ? '' : `適合 ${ageText}。`}`)}"><span class="room-card-icon${gameIconPath(game.id) ? ' has-art' : ''}" aria-hidden="true">${gameIcon(game.id, game.icon)}</span><span class="room-card-copy"><strong>${esc(game.name)}</strong><span>${phraseHtml(game.description)}</span><small>${status.note ? `<b>${esc(status.note)}</b> · ` : ''}${esc(ageText)}${stamps ? ` · ✦ ${stamps} 章` : ''}</small></span><b class="room-card-go" aria-hidden="true">${game.playable ? '→' : '⚙'}</b></button>`;
  }
  function homeView() {
    const room = readRoom(), lvl = level(), band = ageBand(lvl);
    const total = mathGames().reduce((sum, game) => sum + stampsFor(game, room), 0);
    const tabs = ROOM_CATEGORIES.map(group => `<button type="button" role="tab" id="room-tab-${group.id}" data-room-tab="${group.id}" aria-selected="${group.id === ui.category}" aria-controls="room-panel" tabindex="${group.id === ui.category ? 0 : -1}"><span class="room-tab-icon" aria-hidden="true">${tabIcon(group.id, group.icon)}</span><strong>${esc(group.name)}</strong></button>`).join('');
    const games = mathGames({ category: ui.category, level: lvl });
    const now = games.filter(g => g.playable), later = games.filter(g => !g.playable);
    const resume = ui.round && !ui.round.finished ? `<section class="room-resume"><span class="room-resume-icon" aria-hidden="true">${gameIcon(ui.round.game, GAMES[ui.round.game].icon, 48)}</span><p><strong>繼續剛剛的${esc(GAMES[ui.round.game].name)}</strong><small>第 ${ui.round.index + 1}／${ui.round.questions.length} 題</small></p><button type="button" data-room="resume-round" class="room-primary">繼續玩 →</button></section>` : '';
    return `<section class="room-page room-home">${nav()}<div class="room-body"><header class="room-heading"><div><h1 id="math-room-title">數學遊戲室</h1><p>選一個遊戲，玩完一輪蓋一個章。</p></div><div class="room-heading-tools"><button type="button" class="room-age" data-room="age" data-parent-action aria-label="目前 ${band.label}，請家長在設定裡換年齡"><strong>${band.label}</strong><span>家長換年齡 ⚙</span></button><button type="button" class="room-stamp-button" data-room="stamps" aria-label="打開集章冊，已蓋 ${total} 個章"><strong>✦ ${total}</strong><span>集章冊</span></button></div></header>${resume}<div class="room-tabs" role="tablist" aria-label="遊戲分類">${tabs}</div><section class="room-panel" id="room-panel" role="tabpanel" aria-labelledby="room-tab-${ui.category}"><p class="room-panel-note">${band.label} · ${now.length} 種可以玩</p><div class="room-cards">${now.map(g => card(g, room)).join('')}</div>${later.length ? `<details class="room-later"><summary>大一點再玩 · ${later.length} 種</summary><div class="room-cards">${later.map(g => card(g, room)).join('')}</div></details>` : ''}<p class="room-notice" role="status">${esc(ui.notice)}</p></section>${saveNote()}</div></section>`;
  }
  function playView() {
    const round = ui.round, q = currentQuestion(round), guide = roundGuide(round), game = GAMES[q.game];
    const progress = round.questions.map((_, i) => `<li class="${i < round.index || (i === round.index && round.solved) ? 'done' : ''} ${i === round.index ? 'current' : ''}" aria-label="第 ${i + 1} 題${i < round.index ? '，完成' : ''}">${i < round.index || (i === round.index && round.solved) ? '✓' : i + 1}</li>`).join('');
    const last = round.index === round.questions.length - 1;
    const ready = !round.solved && ({ order: () => round.order.length === q.answer.length, luggage: () => !round.explorer.luggageAssignments.includes(null),
      sharing: () => round.shares.reduce((a, b) => a + b, 0) === q.total, tickets: () => q.tickets.every((_t, at) => round.tickets.assignments.includes(at)),
      cargo: () => round.cargo > 0, balance: () => round.workshop.weights.length > 0 }[q.game]?.() || false);
    const readyText = { order: '排好了，按「排好了 ✓」看看。', luggage: '都放好了，按「分好了」看看。', sharing: '點心分完了，按「分好了 ✓」看看。', tickets: '都放了代幣，按「付好了 ✓」看看。', cargo: '裝好了就按「裝好了 ✓」。', balance: '放好了就按「秤秤看」。' }[q.game];
    const text = round.feedback || (ready ? readyText : guide.action);
    const title = `<span class="room-title-icon" aria-hidden="true">${gameIcon(q.game, game.icon, 36)}</span> ${esc(game.name)}`;
    return `<section class="room-page room-play" data-game="${q.game}" data-solved="${round.solved}">${bar(title, { speakable: true, step: `${round.index + 1}／${round.questions.length}` })}<div class="room-body"><ol class="room-progress" aria-label="第 ${round.index + 1} 題，共 ${round.questions.length} 題">${progress}</ol><div class="question-head"><h1 id="room-question-title" tabindex="-1">${phraseHtml(guide.title)}</h1></div><div class="game-stage" id="room-stage">${scene(round)}</div></div><footer class="room-dock">${coach(text, round.tone)}${round.solved ? '' : choices(round)}<div class="room-dock-actions">${round.solved ? `<button type="button" data-room="next" class="room-primary room-next">${last ? '完成這一輪 ✦' : '下一題 →'}</button>` : '<button type="button" data-room="hint" class="room-hint"><span aria-hidden="true">☀</span> 想一想</button>'}</div></footer></section>`;
  }
  function finishView() {
    const g = mathGame(ui.game), count = ui.last?.stamps || 0;
    return `<section class="room-page room-finish">${bar('完成一輪！', { pausable: false })}<div class="room-body"><div class="room-finish-card"><span class="room-finish-stamp${gameIconPath(ui.game) ? ' has-art' : ''}" aria-hidden="true">${gameIcon(ui.game, g?.icon || '✦', 76)}</span><h1 tabindex="-1" id="room-finish-title">${esc(g?.name || '')}完成一輪！</h1><p>集章冊多了一個章，這個遊戲已經蓋了 <strong>${count}</strong> 個。</p><img class="room-finish-coach" src="${art('r6/coach-cheer.png')}" alt="阿路教練揮旗說做得好" width="120" height="160"></div>${saveNote()}</div><footer class="room-dock"><div class="room-dock-actions"><button type="button" data-room="again">再玩一輪</button><button type="button" data-room="home" class="room-primary">回遊戲室 →</button></div></footer></section>`;
  }
  function stampsView() {
    const room = readRoom(), legacy = legacySummary(syncLegacy());
    const games = mathGames();
    const tiles = games.map(g => { const n = stampsFor(g, room); return `<li class="${n ? 'has-stamp' : ''}"><span class="room-stamp-icon" aria-hidden="true">${gameIcon(g.id, g.icon, 48)}</span><strong>${esc(g.name)}</strong><small>${n ? `✦ ${n} 章` : '還沒蓋章'}</small></li>`; }).join('');
    const old = legacy.any ? `<section class="room-legacy" aria-labelledby="room-legacy-title"><h2 id="room-legacy-title">小小列車長的舊集章</h2><p>從${legacy.sources.map(s => s === 'archive' ? '家長帶入的備份' : '這個網站以前的存檔').join('和')}接回來了。</p><ul class="room-legacy-totals"><li><strong>${legacy.trips}</strong> 趟旅程</li><li><strong>${legacy.trains.length}</strong> 枚列車章</li><li><strong>${legacy.souvenirs.length}</strong> 份小禮物</li><li><strong>${legacy.journeys.length}</strong> 條主題旅程</li></ul>${legacy.trains.length ? `<ul class="room-legacy-trains">${legacy.trains.map(name => `<li>🚆 ${esc(name)}</li>`).join('')}</ul>` : ''}${legacy.souvenirs.length ? `<p class="room-legacy-gifts">${legacy.souvenirs.map(item => `<span>${esc(item.icon)} ${esc(item.name)}</span>`).join('')}</p>` : ''}${legacy.journeys.length ? `<p class="room-legacy-gifts">${legacy.journeys.map(route => `<span>${esc(route.icon)} ${esc(route.name)}</span>`).join('')}</p>` : ''}</section>` : '<p class="room-legacy-empty">玩過小小列車長嗎？家長可以在「家長設定」帶入舊備份，舊集章會出現在這裡。</p>';
    return `<section class="room-page room-stamps">${bar('集章冊', { pausable: false })}<div class="room-body"><p class="room-stamps-note">玩完一輪，就蓋一個章。</p><ul class="room-stamp-grid">${tiles}</ul>${old}</div></section>`;
  }
  function externalView() {
    const g = mathGame(ui.game);
    return `<section class="room-page room-external">${bar(`<span class="room-title-icon" aria-hidden="true">${gameIcon(g?.id, g?.icon || '', 36)}</span> <span class="room-external-title">${esc(g?.name || '')}</span>`)}<div class="room-body room-external-stage" id="room-external-stage"></div></section>`;
  }

  function moveToDock() {
    const round = ui.round; if (!round || round.solved) return;
    const q = currentQuestion(round), actions = dialog.querySelector('.room-dock-actions');
    const primary = PRIMARY[q.game] && dialog.querySelector(`#${PRIMARY[q.game]}`);
    const reset = DOCK_RESET[q.game] && dialog.querySelector(`#${DOCK_RESET[q.game][0]}`);
    if (reset) { reset.textContent = DOCK_RESET[q.game][1]; actions.append(reset); }
    if (primary) {
      if (q.game === 'boarding') primary.setAttribute('form', 'boarding-form');
      if (q.game === 'program') { primary.textContent = round.programRunning ? '停車 ▪' : '出發 →'; primary.disabled = round.programRunning ? false : primary.disabled; }
      if (q.game === 'sharing') primary.textContent = '分好了 ✓';
      if (q.game === 'tickets') primary.textContent = '付好了 ✓';
      if (q.game === 'mosaic') primary.textContent = '拼好了 ✓';
      primary.classList.add('room-primary');
      actions.append(primary);
    }
  }
  function focusKey(element) {
    if (!element || !dialog.contains(element)) return null;
    if (element.id) return `#${CSS.escape(element.id)}`;
    for (const [name, value] of Object.entries(element.dataset)) return `[data-${name.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`)}="${CSS.escape(value)}"]`;
    return null;
  }
  function render({ focus } = {}) {
    if (ui.view === 'external') return;
    const key = focus === undefined ? focusKey(document.activeElement) : null;
    const scroll = dialog.querySelector('.room-body')?.scrollTop || 0, sameView = dialog.dataset.view === ui.view && dialog.dataset.question === String(ui.round?.index);
    dialog.dataset.view = ui.view; dialog.dataset.question = String(ui.round?.index ?? '');
    dialog.innerHTML = ui.view === 'play' ? playView() : ui.view === 'finish' ? finishView() : ui.view === 'stamps' ? stampsView() : homeView();
    if (ui.view === 'play') moveToDock();
    if (sameView) { const body = dialog.querySelector('.room-body'); if (body) body.scrollTop = scroll; }
    if (ui.paused) dialog.append(pauseCover());
    const target = focus ? dialog.querySelector(focus) : key ? dialog.querySelector(`${key}:not(:disabled)`) : null;
    target?.focus({ preventScroll: true });
  }
  function pauseCover() {
    const cover = document.createElement('section'); cover.className = 'math-paused room-paused';
    cover.innerHTML = '<h2>休息一下</h2><p>遊戲停在這裡，等你回來。</p><button type="button" data-room="unpause">繼續玩</button><button type="button" data-room="close">回學院</button>';
    return cover;
  }

  // ---- playing ----
  function startRound(game) {
    playback.stop();
    ui.round = createRound({ game, level: level(), recentQuestions: readRoom().recentQuestions });
    ui.game = game; ui.view = 'play'; ui.notice = '';
    render({ focus: '#room-question-title' });
  }
  function handle(outcome) {
    const round = ui.round;
    if (outcome.kind === 'run') { runProgram(outcome.run); return; }
    if (outcome.kind === 'finished') {
      ui.last = recordRound(round.game, round.questions); ui.view = 'finish';
      render({ focus: '#room-finish-title' });
      celebrate({ text: '蓋好一個章！', kind: 'finish', big: true, sound: !readSettings().muted });
      speak(`${GAMES[round.game].name}完成一輪！`);
      return;
    }
    if (outcome.kind === 'correct') { playChime('station', { volume: .12 }); speak(outcome.message); }
    if (outcome.kind === 'wrong' || outcome.kind === 'blocked') speak(outcome.message);
    if (outcome.kind === 'changed') playChime('tap', { volume: .06 });
    render(outcome.kind === 'correct' ? { focus: '[data-room="next"]' } : outcome.kind === 'next' ? { focus: '#room-question-title' } : {});
    if (outcome.kind === 'next') speak(roundGuide(round).title);
  }
  function runProgram(run) {
    const round = ui.round, index = round.index;
    const current = () => ui.round === round && round.index === index && ui.view === 'play' && round.programRunning;
    render();
    playback.start(run, {
      onStep(step) { if (!current()) return; act(round, { type: 'program-step', value: step }); render(); },
      onDone(result) { if (!current()) return; handle(act(round, { type: 'program-done', value: result })); },
    });
  }
  function stopProgram() { if (ui.round?.programRunning) { playback.stop(); act(ui.round, { type: 'program-stop' }); } }
  function play(action) { if (!ui.round || ui.paused) return; handle(act(ui.round, action)); }

  // ---- outside games (registerMathGame entries with open(ctx)) ----
  function openExternal(game) {
    cleanupExternal();
    ui.view = 'external'; ui.game = game.id; ui.notice = '';
    dialog.dataset.view = 'external'; dialog.innerHTML = externalView();
    const stage = dialog.querySelector('#room-external-stage'), token = {};
    ui.external = { token, cleanup: null };
    const live = () => ui.external?.token === token;
    const ctx = Object.freeze({
      level: level(), ageLabel: ageBand(level()).label, stage,
      setTitle(text) { if (live()) dialog.querySelector('.room-external-title').textContent = String(text); },
      complete() {
        if (!live()) return 0;
        const result = recordRound(game.id, []);
        celebrate({ text: '蓋好一個章！', kind: 'finish', big: true, sound: !readSettings().muted });
        return result.stamps;
      },
      exit() { if (live()) { cleanupExternal(); showHome(); } },
      hideRoom() { if (live()) { ui.hidden = true; if (dialog.open) dialog.close(); } },
      speak: text => speak(String(text)),
      get paused() { return ui.paused; },
    });
    try { const cleanup = game.open(ctx); if (live() && typeof cleanup === 'function') ui.external.cleanup = cleanup; }
    catch (error) { console.error(error); cleanupExternal(); ui.notice = '這個遊戲暫時打不開，先玩別的吧。'; showHome(); }
  }
  function cleanupExternal() {
    const current = ui.external; ui.external = null;
    if (current?.cleanup) try { current.cleanup(); } catch (error) { console.error(error); }
  }

  // ---- navigation ----
  function showHome() {
    stopProgram(); ui.view = 'home'; ui.paused = false;
    if (ui.hidden || !dialog.open) { ui.hidden = false; if (!dialog.open) dialog.showModal(); }
    render({ focus: `[data-room-tab="${ui.category}"]` });
  }
  function open(category = 'math') {
    if (!dialog.open) ui.opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    pauseNativeGames(); void stopNativeSpeech();
    if (ROOM_CATEGORIES.some(group => group.id === category)) ui.category = category;
    syncLegacy();
    cleanupExternal(); stopProgram();
    ui.view = 'home'; ui.paused = false; ui.notice = ''; ui.hidden = false;
    if (!dialog.open) dialog.showModal();
    render({ focus: `[data-room-tab="${ui.category}"]` });
  }
  function close() {
    stopProgram(); cleanupExternal(); void stopNativeSpeech();
    ui.paused = false; ui.hidden = false; if (ui.view !== 'play') ui.view = 'home';
    if (dialog.open) dialog.close();
    (ui.opener?.isConnected ? ui.opener : document.getElementById('math-practice'))?.focus();
  }
  function back() {
    if (ui.paused) { unpause(); return; }
    if (ui.view === 'home') { close(); return; }
    if (ui.view === 'external') cleanupExternal();
    showHome();
  }
  function pause() {
    if (!dialog.open || ui.paused || !['play', 'external'].includes(ui.view)) return;
    stopProgram(); void stopNativeSpeech(); ui.paused = true;
    if (ui.view === 'play') render({ focus: '[data-room="unpause"]' });
    else { dialog.append(pauseCover()); dialog.querySelector('[data-room="unpause"]').focus(); }
  }
  function unpause() {
    ui.paused = false;
    if (ui.view === 'play') render({ focus: '#room-question-title' }); else dialog.querySelector('.room-paused')?.remove();
  }
  function chooseGame(id) {
    const game = mathGame(id); if (!game) return;
    if (!game.levels.includes(level())) {
      ui.notice = `${game.name}適合 ${agesText(game.levels)}。請家長在「家長設定」換年齡再玩。`;
      render(); speak(ui.notice); return;
    }
    if (game.kind === 'round') startRound(id); else openExternal(game);
  }

  dialog.addEventListener('click', event => {
    const target = event.target.closest('button,a[data-room]');
    if (!target || !dialog.contains(target) || target.disabled) return;
    const d = target.dataset;
    if (d.room) {
      if (target.tagName === 'A') event.preventDefault();
      switch (d.room) {
        case 'close': close(); return;
        case 'back': back(); return;
        case 'home': showHome(); return;
        case 'pause': pause(); return;
        case 'unpause': unpause(); return;
        case 'stamps': ui.view = 'stamps'; render({ focus: '[data-room="back"]' }); return;
        case 'age': document.dispatchEvent(new CustomEvent('academy:open-family-settings')); return;
        case 'resume-round': ui.view = 'play'; render({ focus: '#room-question-title' }); return;
        case 'again': startRound(ui.game); return;
        case 'speak': { const q = ui.round && currentQuestion(ui.round), guide = ui.round && roundGuide(ui.round); if (q) speak(`${q.prompt} ${ui.round.feedback || guide.action}`); return; }
        case 'next': play({ type: 'next' }); return;
        case 'hint': play({ type: 'hint' }); return;
      }
      return;
    }
    if (d.roomTab) { ui.category = d.roomTab; ui.notice = ''; render({ focus: `[data-room-tab="${d.roomTab}"]` }); return; }
    if (d.roomGame) { chooseGame(d.roomGame); return; }
    if (ui.view !== 'play' || !ui.round) return;
    if (target.id === 'program-run') { play({ type: ui.round.programRunning ? 'program-stop' : 'program-run' }); if (!ui.round.programRunning) { playback.stop(); render(); } return; }
    if (target.id === 'arithmetic-keyboard') { play({ type: 'keyboard' }); dialog.querySelector('#boarding-input')?.focus(); return; }
    if (ID_ACTIONS.includes(target.id)) { play({ type: target.id }); return; }
    for (const [key, type] of DATA_ACTIONS) if (d[key] !== undefined) { play({ type, value: d[key] }); return; }
  });
  dialog.addEventListener('submit', event => {
    if (event.target.id !== 'boarding-form') return;
    event.preventDefault();
    const input = dialog.querySelector('#boarding-input');
    if (input && !input.readOnly) act(ui.round, { type: 'boarding-input', value: input.value });
    play({ type: 'boarding-submit' });
  });
  dialog.addEventListener('input', event => { if (event.target.id === 'boarding-input' && ui.round) act(ui.round, { type: 'boarding-input', value: event.target.value.replace(/\D/g, '').slice(0, 2) }); });
  dialog.addEventListener('keydown', event => {
    if (ui.view === 'home' && event.target.matches?.('[role="tab"]') && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
      const ids = ROOM_CATEGORIES.map(g => g.id), next = ids[(ids.indexOf(ui.category) + (event.key === 'ArrowRight' ? 1 : ids.length - 1)) % ids.length];
      event.preventDefault(); ui.category = next; render({ focus: `[data-room-tab="${next}"]` }); return;
    }
    const direction = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[event.key];
    if (direction && ui.view === 'play' && !ui.paused && ui.round && currentQuestion(ui.round).game === 'maze' && !event.target.matches?.('input')) { event.preventDefault(); play({ type: 'maze', value: direction }); }
  });
  dialog.addEventListener('cancel', event => { event.preventDefault(); back(); });
  addEventListener('blur', pause);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  addEventListener('studentchange', () => { if (dialog.open && ['home', 'stamps'].includes(ui.view)) render(); });
  subscribeSettings(() => { if (dialog.open && ui.view === 'home') render(); });
  registerGameLifecycle({ getState: () => ({ paused: !dialog.open || ui.paused || !['play', 'external'].includes(ui.view) }), pause });
  registerNativeOverlay({ isOpen: () => dialog.open, close: back });

  const api = { open, close, pause, get view() { return ui.view; }, get round() { return ui.round; } };
  dialog.mathRoom = api;
  return api;
}
