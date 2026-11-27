// R50 L2：海風站上下車、月台時刻表的英文版。
// 遊戲邏輯照舊產生中文；畫面（對話殼 ctx.say／win／按鈕，和遊戲自己的 DOM）顯示前用 tx() 翻成目前語言。
// 這裡在英文模式把每一關、每個 seed 會出現的句子（題目、提示、站名、時間、按鈕、aria-label）都翻一次，確認沒有中文留下。
// 兩個 *-ui.js 會載入 css、需要 DOM，node 不能直接 import：下面照它們組字的方式（同樣的中文 key）重組一次。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { setLanguage, hasTranslation, t } from '../../src/shared/i18n.js';
import { zh, tx } from '../../src/games/math/room-text.js';
import { RAIL_COLORS } from '../../src/games/puzzles/common.js';
import { chineseFragments, translationCalls, HAN } from '../helpers/i18n-scan.js';
import { BOARDING_GAME, boardingLevels, createBoardingTrip, checkBoarding, boardingHint, stopSentence, questionText } from '../../src/games/math/boarding-count.js';
import {
  TIMETABLE_GAME, timetableLevels, createTimetableRound, checkTimetable, timetableHint, helperSteps, rowQuestion, choiceWords, rideWords, timeWords,
} from '../../src/games/math/platform-timetable.js';

const AGES = ['3-4', '5-6', '7-8'];
const SEEDS = 25;
const FILES = ['boarding-count.js', 'boarding-count-ui.js', 'platform-timetable.js', 'platform-timetable-ui.js'].map(f => `src/games/math/${f}`);
const english = fn => { setLanguage('en', { persist: false }); try { return fn(); } finally { setLanguage('zh-Hant', { persist: false }); } };
const plain = html => String(html).replace(/<[^>]*>/g, ' ');

/** Translates each distinct Chinese text once and records any that still has Chinese afterwards. */
function checker() {
  const left = new Map(), seen = new Set();
  const check = (text, where) => {
    const key = String(text);
    if (seen.has(key)) return;
    seen.add(key);
    const out = plain(tx(key));
    if (HAN.test(out)) left.set(key, `${where} → ${out}`);
  };
  return { check, left };
}

test('R50 rail math: every Chinese piece in the four files has English', () => {
  const missing = [];
  for (const file of FILES) {
    const src = readFileSync(file, 'utf8');
    for (const f of chineseFragments(src)) {
      if (f.dynamic) missing.push(`${file}:${f.line} Chinese inside a \${} template: ${f.text}`);
      else if (!hasTranslation(f.text)) missing.push(`${file}:${f.line} ${f.text}`);
    }
    for (const c of translationCalls(src)) if (HAN.test(c.key) && !hasTranslation(c.key)) missing.push(`${file}:${c.line} t() ${c.key}`);
  }
  assert.deepEqual(missing, []);
});

test('R50 rail math: 海風站上下車 in English — every level, stop, question, hint and label', () => english(() => {
  const { check, left } = checker();
  check(BOARDING_GAME.title, 'title');
  for (const age of AGES) {
    for (const level of boardingLevels(age)) check(level.focus, `focus ${age}`);
    for (let level = 0; level < 6; level++) for (let seed = 1; seed <= SEEDS; seed++) {
      const trip = createBoardingTrip({ age, level, seed });
      const q0 = trip.questions.find(q => q.type === 'missing');
      check('路線', 'route aria-label'); check('乘車紀錄', 'log aria-label');
      if (trip.hidden) { check('拉上窗簾・用想的', 'curtain'); check('車上：？ 人', 'count'); check('車上的人數藏起來了', 'count aria-label'); }
      trip.stops.forEach((stop, i) => {
        const missing = q0 && q0.after === i;
        check(stop.station, 'route stop');
        check(zh('{name}站', { name: stop.station }), 'station sign');
        check(stopSentence(stop, i), 'trip log');
        check(zh('車上：{n} 人', { n: stop.after }), 'count');
        check(zh('車上 {n} 人', { n: stop.after }), 'count aria-label');
        if (stop.off) check(zh('下車 {n} 人', { n: stop.off }), 'pill');
        if (stop.on) check(zh('上車 {n} 人', { n: stop.on }), 'pill');
        if (missing) {
          check('上車 ？ 人', 'pill');
          check(i && stop.off ? zh('{station}站下車 {off} 人，上車 {on} 人', { station: stop.station, off: stop.off, on: '？' }) : zh('{station}站上車 {n} 人', { station: stop.station, n: '？' }), 'hidden log');
        }
        const sentence = missing ? zh('{station}站下車 {n} 人，又上來一些人。', { station: stop.station, n: stop.off }) : `${stopSentence(stop, i)}。`;
        const intro = trip.hidden ? '這一趟拉上窗簾，看不到車裡。記住每一站上車、下車的人數。{stop}' : '看看每一站有幾人下車、幾人上車。{stop}';
        check(i === 0 ? zh(intro, { stop: sentence }) : sentence, 'coach at the stop');
        check(i >= trip.stops.length - 1 ? '列車出發 ▶' : zh('開往{station}站 ▶', { station: trip.stops[i + 1].station }), 'next button');
      });
      trip.questions.forEach((q, qi) => {
        check(questionText(trip, qi), 'question');
        check(boardingHint(trip, qi), 'hint');
        for (const value of q.choices) {
          check(zh('{n} 人', { n: value }), 'answer button');
          const result = checkBoarding(trip, qi, value);
          if (!result.correct) check(result.hint, 'wrong answer');
        }
        const stop = trip.stops[q.after];
        check(q.type === 'missing' ? zh('答對了！{station}站上車 {n} 人。', { station: stop.station, n: q.answer }) : zh('答對了！車上有 {n} 人。', { n: q.answer }), 'right answer');
      });
      check(trip.questions.length > 1 ? '每一站的人數都算對了！' : '人數算對了，列車開往下一站！', 'win');
    }
  }
  assert.deepEqual([...left.values()], []);
  // A few exact sentences: plural forms, station names, answers matched by value.
  assert.equal(tx(stopSentence({ station: '藍灣', on: 3, off: 2 }, 1)), 'At Blue Bay Station: 2 off, 3 on');
  assert.equal(tx(stopSentence({ station: '海風', on: 1, off: 0 }, 0)), '1 friend gets on at Sea Breeze Station');
  assert.equal(tx(zh('{n} 人', { n: 1 })), '1 friend');
  assert.equal(tx(zh('{n} 人', { n: 4 })), '4 friends');
  assert.equal(tx('上車 ？ 人'), '? get on');
  assert.equal(tx(zh('{station}站下車 {off} 人，上車 {on} 人', { station: '森林', off: 7, on: '？' })), 'At Forest Station: 7 off, ? on');
}));

test('R50 rail math: 月台時刻表 in English — every level, row, question, hint, clock and button', () => english(() => {
  const { check, left } = checker();
  check(TIMETABLE_GAME.title, 'title');
  for (const header of ['列車', '開往', '出發', '坐多久', '到站', '出發：？', '到站：？', '轉轉看', '從頭', '從頭開始轉', '時刻表都排好了，每一班列車都準時！']) check(header, 'board');
  for (const age of AGES) {
    for (const level of timetableLevels(age)) check(level.focus, `focus ${age}`);
    for (const level of timetableLevels(age)) for (let seed = 1; seed <= SEEDS; seed++) {
      const round = createTimetableRound({ age, level: level.index, seed }), said = v => choiceWords(round, v);
      check(zh('{station}站月台時刻表', { station: round.station }), 'board aria-label');
      check(zh('{station}站 月台時刻表', { station: round.station }), 'board title');
      check(round.station, 'line sign');
      round.rows.forEach((row, i) => {
        check(row.train, 'train cell'); check(row.to, 'to cell');
        check(said(row.depart), 'depart cell'); check(rideWords(row.ride || 60), 'ride cell'); check(said(row.arrive), 'arrive cell');
        check(zh('出發 {time}', { time: said(row.depart) }), 'clock caption'); check(zh('到站 {time}', { time: said(row.arrive) }), 'clock caption');
        check(rowQuestion(round, i), 'question');
        check(timetableHint(round, i), 'hint');
        for (const value of row.choices) {
          check(round.ask === 'ride' ? `<b>${tx(rideWords(value))}</b>` : `<svg aria-hidden="true"></svg><b>${tx(said(value))}</b>`, 'answer button');
          check(round.ask === 'ride' ? rideWords(value) : timeWords(value), 'answer aria-label');
          const result = checkTimetable(round, i, value);
          if (!result.correct) check(result.hint, 'wrong answer');
        }
        check(round.ask === 'read' ? zh('答對了！{color}列車{time}出發。', { color: RAIL_COLORS[row.color].name, time: timeWords(row.depart) })
          : round.ask === 'ride' ? zh('答對了！坐了 {ride}。', { ride: rideWords(row.ride) })
            : round.ask === 'depart' ? zh('答對了！{time}出發。', { time: timeWords(row.depart) }) : zh('答對了！{time}到{station}。', { time: timeWords(row.arrive), station: row.to }), 'right answer');
      });
      const taps = {};
      for (const step of helperSteps(round)) {
        const abs = Math.abs(step), label = abs >= 60 ? zh(step < 0 ? '－{n} 小時' : '＋{n} 小時', { n: abs / 60 }) : zh(step < 0 ? '－{n} 分' : '＋{n} 分', { n: abs });
        check(label, 'helper step');
        taps[label] = 2;
      }
      const tally = t('轉了：{list}', { list: Object.entries(taps).map(([k, v]) => `${tx(k)} × ${v}`).join(', ') });
      if (HAN.test(tally)) left.set('tally', tally);
    }
  }
  assert.deepEqual([...left.values()], []);
  // Times: 「3 點」 3 o'clock, 「3 點半」 3:30, 「8 點 5 分」 8:05; ride times with plurals.
  assert.equal(tx(timeWords(3 * 60)), "3 o'clock");
  assert.equal(tx(timeWords(3 * 60 + 30)), '3:30');
  assert.equal(tx(timeWords(8 * 60 + 5)), '8:05');
  assert.equal(tx(rideWords(60)), '1 hour');
  assert.equal(tx(rideWords(90)), '1 hour 30 minutes');
  assert.equal(tx(rideWords(70)), '1 hour 10 minutes');
  assert.equal(tx(rideWords(45)), '45 minutes');
  assert.equal(tx(zh('＋{n} 分', { n: 5 })), '+5 minutes');
  assert.equal(tx(zh('－{n} 小時', { n: 1 })), '-1 hour');
}));

test('R50 rail math: Chinese mode keeps the Chinese sentences (logic is untouched by the switch)', () => {
  const trip = createBoardingTrip({ age: '7-8', level: 5, seed: 3 });
  const inChinese = [questionText(trip, 0), boardingHint(trip, 0), stopSentence(trip.stops[1], 1)];
  assert.deepEqual(english(() => [questionText(trip, 0), boardingHint(trip, 0), stopSentence(trip.stops[1], 1)]), inChinese, 'logic stays Chinese in English mode');
  assert.ok(inChinese.every(text => HAN.test(text)));
  assert.equal(tx(inChinese[0]), inChinese[0], 'tx() leaves Chinese alone in Chinese mode');
  const round = createTimetableRound({ age: '5-6', level: 2, seed: 4 });
  assert.equal(english(() => rowQuestion(round, 0)), rowQuestion(round, 0));
});
