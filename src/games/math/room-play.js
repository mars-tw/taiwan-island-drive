// R48 數學遊戲室：一輪的出題、作答與回饋（不碰畫面，方便測試）。
// 作答規則改寫自 Taiwan Train Math 1.11.0 src/app.js 的點擊處理（Copyright 2026 mars-tw，Apache-2.0）；
// 改動：拆成純函式、答錯時直接給「方法提示」、整輪結束交給遊戲室集章。其餘學院新程式為 MIT。
import { createTrip, isCorrect, GAMES, LEVELS } from './engine.js';
import { newAdventureState, changeShare, trackConnected } from './adventure.js';
import { newExplorerState, selectLuggage, putLuggage, moveMaze } from './explorers.js';
import { newWorkshopState, appendCommand, removeCommand, evaluateProgram, addWeight, removeWeight, weightTotal } from './workshop.js';
import { newDiscoveryState, selectMosaicColor, paintMosaicCell, resetMosaic, findDifference } from './discovery.js';
import { newTicketsState, selectTicket, payToken, returnToken, ticketTotals } from './tickets.js';
import { learningGuide } from './learning-guide.js';
import { parseArithmeticAnswer } from './arithmetic-ui.js';
import { ROUND_GAMES } from './room-registry.js';
// R50：回饋句子留在中文（測試與畫面都靠它），遊戲室畫面顯示時才翻成英文。
import { zh } from './room-text.js';

function questionState(q) {
  return {
    solved: false, attempts: 0, assisted: false, feedback: '', tone: '',
    order: [], cargo: 0, counted: new Set(), boardingInput: '', nativeKeyboard: false, programRunning: false,
    ...newAdventureState(q),
    explorer: ['luggage', 'maze'].includes(q.game) ? newExplorerState(q) : null,
    workshop: ['program', 'balance'].includes(q.game) ? newWorkshopState(q) : null,
    discovery: ['mosaic', 'differences'].includes(q.game) ? newDiscoveryState(q) : null,
    tickets: q.game === 'tickets' ? newTicketsState(q) : null,
  };
}
/** 開一輪：同一種玩法，3～4 歲 3 題、5～8 歲 5 題（原版每趟站數）。 */
export function createRound({ game, level, recentQuestions = [], rng = Math.random } = {}) {
  if (!ROUND_GAMES.includes(game)) throw new Error('Unknown math room game');
  if (!Object.hasOwn(LEVELS, level) || !GAMES[game].levels.includes(level)) throw new Error('Game not available for this level');
  const questions = createTrip({ level, train: null, trains: [], practice: game, rng, recentQuestions });
  return { game, level, questions, index: 0, finished: false, ...questionState(questions[0]) };
}
export const currentQuestion = round => round.questions[round.index];
export const roundGuide = round => learningGuide(currentQuestion(round), round);

const result = (kind, round, extra = {}) => ({ kind, message: round.feedback, ...extra });
function say(round, tone, text) { round.tone = tone; round.feedback = text; }
function answer(round, value) {
  const q = currentQuestion(round);
  if (round.solved) return result('noop', round);
  if (isCorrect(q, value)) {
    round.solved = true;
    say(round, 'success', zh('完成了！{text}', { text: learningGuide(q, round).success }));
    return result('correct', round);
  }
  round.attempts++;
  // 答錯只教方法：用玩法的「這樣想」提示，不出現答案。
  say(round, 'retry', zh('再想一次。{text}', { text: learningGuide(q, round).help }));
  return result('wrong', round);
}
function changed(round, update) {
  update();
  round.feedback = '';
  round.tone = '';
  return result('changed', round);
}

/**
 * 小朋友的一個動作。action = { type, value }，回傳 { kind, message }：
 * kind 是 correct／wrong／changed／blocked／run／next／finished／noop。
 */
export function act(round, action = {}) {
  if (!round || round.finished) return { kind: 'noop', message: '' };
  const q = currentQuestion(round), { type, value } = action, index = Number(value);
  if (type === 'next') {
    if (!round.solved) return result('noop', round);
    if (round.index < round.questions.length - 1) {
      round.index++;
      Object.assign(round, questionState(currentQuestion(round)));
      return result('next', round);
    }
    round.finished = true;
    return result('finished', round);
  }
  if (type === 'hint') {
    if (round.solved) return result('noop', round);
    round.assisted = true;
    say(round, 'hint', q.hint);
    return result('hint', round);
  }
  if (round.solved) return result('noop', round);
  if (round.programRunning && !['program-step', 'program-done', 'program-stop'].includes(type)) return result('noop', round);
  switch (type) {
    case 'answer':
      return answer(round, ['count', 'boarding', 'clock'].includes(q.game) ? Number(value) : String(value));
    case 'count':
      if (q.game !== 'count' || round.counted.has(index)) return result('noop', round);
      return changed(round, () => round.counted.add(index));
    // 排車廂
    case 'order':
      if (q.game !== 'order' || round.order.includes(index) || !q.numbers.includes(index)) return result('noop', round);
      return changed(round, () => round.order.push(index));
    case 'remove-order':
      if (q.game !== 'order') return result('noop', round);
      if (round.order[index] === undefined) { say(round, 'hint', '先點下面的數字車廂，它會排進空位。'); return result('blocked', round); }
      return changed(round, () => round.order.splice(index, 1));
    case 'order-reset': return changed(round, () => { round.order = []; });
    case 'order-submit':
      return round.order.length === q.answer.length ? answer(round, [...round.order]) : result('noop', round);
    // 上車下車
    case 'digit': {
      if (q.game !== 'boarding') return result('noop', round);
      const current = /^\d{0,2}$/.test(round.boardingInput) ? round.boardingInput : '';
      round.boardingInput = value === 'clear' ? '' : value === 'backspace' ? current.slice(0, -1)
        : /^\d$/.test(String(value)) ? (current === '0' ? String(value) : current + value).slice(0, 2) : current;
      return result('changed', round);
    }
    case 'boarding-input':
      if (q.game !== 'boarding') return result('noop', round);
      round.boardingInput = /^\d{0,2}$/.test(String(value)) ? String(value) : round.boardingInput;
      return result('changed', round);
    case 'keyboard': round.nativeKeyboard = !round.nativeKeyboard; return result('changed', round);
    case 'boarding-submit': {
      if (q.game !== 'boarding') return result('noop', round);
      const number = parseArithmeticAnswer(round.boardingInput, LEVELS[q.level].max);
      if (number === null) { say(round, 'hint', zh('請輸入 0 到 {max} 的數字。', { max: LEVELS[q.level].max })); return result('blocked', round); }
      return answer(round, number);
    }
    // 貨物裝箱
    case 'load':
      if (q.game !== 'cargo' || round.cargo + index > q.max || ![1, 5].includes(index)) return result('noop', round);
      return changed(round, () => { round.cargo += index; });
    case 'unload': return q.game === 'cargo' ? changed(round, () => { round.cargo = Math.max(0, round.cargo - 1); }) : result('noop', round);
    case 'cargo-reset': return changed(round, () => { round.cargo = 0; });
    case 'cargo-submit': return q.game === 'cargo' ? answer(round, round.cargo) : result('noop', round);
    // 路線小工程師
    case 'rotate':
      if (q.game !== 'tracks' || !q.tiles[index] || q.tiles[index].kind === 'empty') return result('noop', round);
      return changed(round, () => { round.rotations[index] = (round.rotations[index] + 1) % 4; });
    case 'tracks-reset': return changed(round, () => { round.rotations = q.tiles.map(tile => tile.initial); });
    case 'tracks-submit': return q.game === 'tracks' ? answer(round, trackConnected(q, round.rotations) ? 'connected' : 'disconnected') : result('noop', round);
    // 點心公平分
    case 'share': case 'return-snack':
      if (q.game !== 'sharing') return result('noop', round);
      return changed(round, () => { round.shares = changeShare(q, round.shares, index, type === 'share' ? 1 : -1); });
    case 'sharing-reset': return changed(round, () => { round.shares = Array(q.friends).fill(0); });
    case 'sharing-submit': return q.game === 'sharing' ? answer(round, [...round.shares]) : result('noop', round);
    // 山海尋寶
    case 'find':
      if (q.game !== 'treasure' || round.found.has(index) || !Number.isInteger(index) || index < 0 || index >= q.items.length) return result('noop', round);
      if (q.items[index] !== q.target) { say(round, 'hint', '這也是風景裡的小發現。再看看，我們要找題目裡的寶物。'); return result('blocked', round); }
      round.found.add(index);
      if (round.found.size === q.answer) return answer(round, q.answer);
      say(round, 'progress', zh('找到第 {n} 個了！', { n: round.found.size }));
      return result('changed', round);
    // 行李分類
    case 'luggage-item': return q.game === 'luggage' ? changed(round, () => { round.explorer = selectLuggage(q, round.explorer, index); }) : result('noop', round);
    case 'luggage-bin': return q.game === 'luggage' ? changed(round, () => { round.explorer = putLuggage(q, round.explorer, String(value)); }) : result('noop', round);
    case 'luggage-reset': return changed(round, () => { round.explorer = newExplorerState(q); });
    case 'luggage-submit':
      if (q.game !== 'luggage' || round.explorer.luggageAssignments.includes(null)) return result('noop', round);
      return answer(round, [...round.explorer.luggageAssignments]);
    // 車站迷宮
    case 'maze': {
      if (q.game !== 'maze') return result('noop', round);
      const before = round.explorer;
      round.explorer = moveMaze(q, before, String(value));
      if (before === round.explorer) { say(round, 'hint', '這邊有牆，換個方向試試看。'); return result('blocked', round); }
      if (round.explorer.mazePosition === q.finish) return answer(round, 'arrived');
      round.feedback = ''; round.tone = '';
      return result('changed', round);
    }
    case 'maze-reset': return changed(round, () => { round.explorer = newExplorerState(q); });
    // 指令小司機
    case 'program-direction': return q.game === 'program' ? changed(round, () => { round.workshop = appendCommand(q, round.workshop, String(value)); }) : result('noop', round);
    case 'program-remove': return q.game === 'program' ? changed(round, () => { round.workshop = removeCommand(q, round.workshop, index); }) : result('noop', round);
    case 'program-reset': return changed(round, () => { round.workshop = newWorkshopState(q); });
    case 'program-run': {
      if (q.game !== 'program' || !round.workshop.commands.length) return result('noop', round);
      round.programRunning = true;
      round.workshop = { ...round.workshop, programChecked: false };
      say(round, 'progress', '火車正在照你排的方向走，看看每一步。');
      return result('run', round, { run: evaluateProgram(q, round.workshop.commands) });
    }
    case 'program-step':
      if (!round.programRunning) return result('noop', round);
      round.workshop = { ...round.workshop, programPosition: value.position, programTrace: [...value.trace] };
      return result('changed', round);
    case 'program-stop':
      if (!round.programRunning) return result('noop', round);
      round.programRunning = false;
      say(round, 'hint', '火車停在這裡，指令都還在；按出發會從起點重新走。');
      return result('changed', round);
    case 'program-done': {
      if (!round.programRunning) return result('noop', round);
      const run = value;
      round.programRunning = false;
      round.workshop = { ...round.workshop, programChecked: true, programPosition: run.position, programTrace: [...run.trace] };
      if (run.arrived) return answer(round, 'arrived');
      round.attempts++;
      say(round, 'retry', run.blocked ? '這一步碰到牆了。點指令修改，再按出發試一次。' : '這段走完了，還沒到站。可以再接幾個方向，按出發試一次。');
      return result('wrong', round);
    }
    // 貨運天平
    case 'balance-weight': return q.game === 'balance' ? changed(round, () => { round.workshop = addWeight(q, round.workshop, index); }) : result('noop', round);
    case 'balance-remove': return q.game === 'balance' ? changed(round, () => { round.workshop = removeWeight(q, round.workshop, index); }) : result('noop', round);
    case 'balance-reset': return changed(round, () => { round.workshop = newWorkshopState(q); });
    case 'balance-check': {
      if (q.game !== 'balance') return result('noop', round);
      const total = weightTotal(q, round.workshop.weights);
      if (total === null || !round.workshop.weights.length) return result('noop', round);
      round.workshop = { ...round.workshop, balanceChecked: true, balanceTilt: total > q.target ? -1 : total < q.target ? 1 : 0 };
      return answer(round, total);
    }
    // 圖形拼搭
    case 'mosaic-color': return q.game === 'mosaic' ? changed(round, () => { round.discovery = selectMosaicColor(q, round.discovery, String(value)); }) : result('noop', round);
    case 'mosaic-cell': return q.game === 'mosaic' ? changed(round, () => { round.discovery = paintMosaicCell(q, round.discovery, index); }) : result('noop', round);
    case 'mosaic-reset': return changed(round, () => { round.discovery = resetMosaic(q, round.discovery); });
    case 'mosaic-submit':
      if (q.game !== 'mosaic' || round.discovery.mosaicCells.every(cell => cell === 'empty')) return result('noop', round);
      return answer(round, [...round.discovery.mosaicCells]);
    // 眼力找不同
    case 'difference': {
      if (q.game !== 'differences') return result('noop', round);
      const previous = round.discovery;
      round.discovery = findDifference(q, previous, index);
      if (previous === round.discovery) { say(round, 'hint', '這一區看起來一樣，再比一比其他地方。'); return result('blocked', round); }
      if (round.discovery.differencesFound.size === q.answer) return answer(round, q.answer);
      say(round, 'progress', '找到一處了！再看看其他地方。');
      return result('changed', round);
    }
    // 車票小幫手
    case 'ticket-select': return q.game === 'tickets' ? changed(round, () => { round.tickets = selectTicket(q, round.tickets, index); }) : result('noop', round);
    case 'ticket-pay': return q.game === 'tickets' ? changed(round, () => { round.tickets = payToken(q, round.tickets, index); }) : result('noop', round);
    case 'ticket-remove': return q.game === 'tickets' ? changed(round, () => { round.tickets = returnToken(q, round.tickets, index); }) : result('noop', round);
    case 'tickets-reset': return changed(round, () => { round.tickets = newTicketsState(q); });
    case 'tickets-check': {
      if (q.game !== 'tickets') return result('noop', round);
      const totals = ticketTotals(q, round.tickets.assignments);
      if (totals === null || !q.tickets.every((_ticket, at) => round.tickets.assignments.includes(at))) return result('noop', round);
      round.tickets = { ...round.tickets, checked: true };
      return answer(round, totals);
    }
    default:
      return result('noop', round);
  }
}
