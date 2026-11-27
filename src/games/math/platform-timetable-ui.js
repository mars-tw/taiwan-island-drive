// R48 B line math 2 screen: a departure board, two clocks and a little line the train runs along.
// R50: sentences stay Chinese in the game state. The shell translates what it is handed (say, win, button
// labels, aria labels); this file's own text goes through show(), which keeps the Chinese and redraws after a
// language switch. The answer buttons are ready HTML, so their words are translated here.
import { openRailGame, htmlEl, svgEl, wait, reducedMotion, artUrl } from '../puzzles/rail-shell.js';
import { RAIL_COLORS } from '../puzzles/common.js';
import { onLanguageChange, isEnglish, t } from '../../shared/i18n.js';
import { zh, tx } from './room-text.js';
import {
  TIMETABLE_GAME, timetableLevels, createTimetableRound, checkTimetable, helperSteps, handAngles, rowQuestion, choiceWords, rideWords, timeWords,
} from './platform-timetable.js';

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = value => String(value).replace(/[&<>"']/g, c => ESC[c]);

/** Text (or one attribute) shown in the current language; relabel() repaints everything after a switch. */
function textBook() {
  const items = new Map();
  const paint = (el, attr, text) => { if (attr) el.setAttribute(attr, tx(text)); else if (el.nodeType === 3) el.nodeValue = tx(text); else el.textContent = tx(text); };
  return {
    show(el, text, attr = '') { if (!items.has(el)) items.set(el, {}); items.get(el)[attr] = text; paint(el, attr, text); return el; },
    relabel() { for (const [el, texts] of items) { if (!el.isConnected) { items.delete(el); continue; } for (const [attr, text] of Object.entries(texts)) paint(el, attr, text); } },
  };
}

/** Analog clock face; returns { el, set(minutes), unknown(flag) }. Pass `book` to repaint the caption on a language switch. */
export function clockFace(parent, { label = '', small = false, book = textBook() } = {}) {
  const wrap = htmlEl('figure', { class: `rp-clock${small ? ' is-small' : ''}` }, parent);
  const svg = svgEl('svg', { viewBox: '-100 -100 200 200', 'aria-hidden': 'true' }, wrap);
  svgEl('circle', { r: 94, class: 'rp-clock-face' }, svg);
  for (let i = 0; i < 60; i++) {
    const a = (i * 6 * Math.PI) / 180, r1 = i % 5 ? 84 : 78;
    svgEl('line', { x1: Math.sin(a) * r1, y1: -Math.cos(a) * r1, x2: Math.sin(a) * 89, y2: -Math.cos(a) * 89, class: i % 5 ? 'rp-tick' : 'rp-tick is-hour' }, svg);
  }
  if (!small) for (let n = 1; n <= 12; n++) {
    const a = (n * 30 * Math.PI) / 180, t = svgEl('text', { x: Math.sin(a) * 62, y: -Math.cos(a) * 62 + 9, class: 'rp-clock-num', 'text-anchor': 'middle' }, svg);
    t.textContent = String(n);
  }
  const hour = svgEl('line', { x1: 0, y1: 10, x2: 0, y2: -46, class: 'rp-hand-hour' }, svg);
  const minute = svgEl('line', { x1: 0, y1: 14, x2: 0, y2: -74, class: 'rp-hand-minute' }, svg);
  svgEl('circle', { r: 7, class: 'rp-clock-pin' }, svg);
  const mark = svgEl('text', { x: 0, y: 26, class: 'rp-clock-unknown', 'text-anchor': 'middle' }, svg); mark.textContent = '？';
  const caption = label ? book.show(htmlEl('figcaption', {}, wrap), label) : null;
  const api = {
    el: wrap, value: null,
    set(minutes) { api.value = minutes; const { hour: h, minute: m } = handAngles(minutes); hour.setAttribute('transform', `rotate(${h})`); minute.setAttribute('transform', `rotate(${m})`); wrap.classList.remove('is-unknown'); },
    unknown() { api.value = null; wrap.classList.add('is-unknown'); },
    caption(text) { if (caption) book.show(caption, text); },
  };
  return api;
}
function sweep(clock, from, to, duration, alive) {
  if (reducedMotion()) { clock.set(to); return Promise.resolve(true); }
  return new Promise(resolve => {
    const t0 = performance.now();
    const step = now => {
      if (!alive()) return resolve(false);
      const k = Math.min(1, (now - t0) / duration), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      clock.set(Math.round(from + (to - from) * e));
      if (k < 1) requestAnimationFrame(step); else { clock.set(to); resolve(true); }
    };
    requestAnimationFrame(step);
  });
}

function mount(ctx) {
  const round = createTimetableRound({ age: ctx.age, level: ctx.level, seed: ctx.seed });
  const ask = round.ask, said = value => choiceWords(round, value);
  let index = 0, helper = null, choiceButtons = [];
  const book = textBook(), { show } = book;

  const boardEl = show(htmlEl('section', { class: 'rp-timetable' }, ctx.stage), zh('{station}站月台時刻表', { station: round.station }), 'aria-label');
  show(htmlEl('h2', {}, boardEl), zh('{station}站 月台時刻表', { station: round.station }));
  const table = htmlEl('div', { class: `rp-tt-rows ask-${ask}`, role: 'table' }, boardEl);
  const headRow = htmlEl('div', { class: 'rp-tt-row is-head', role: 'row' }, table);
  for (const text of ['列車', '開往', '出發', ...(ask === 'read' ? [] : ['坐多久', '到站'])]) show(htmlEl('span', { role: 'columnheader' }, headRow), text);
  const rowEls = round.rows.map(row => {
    const el = htmlEl('div', { class: 'rp-tt-row', role: 'row' }, table);
    const name = htmlEl('span', { role: 'cell', class: 'rp-tt-train' }, el);
    htmlEl('i', { style: `background:${RAIL_COLORS[row.color].hex}`, 'aria-hidden': 'true' }, name); name.append(show(document.createTextNode(''), row.train));
    show(htmlEl('span', { role: 'cell' }, el), row.to);
    show(htmlEl('span', { role: 'cell', class: 'rp-tt-depart' }, el), ask === 'read' || ask === 'depart' ? '？' : said(row.depart));
    if (ask !== 'read') { show(htmlEl('span', { role: 'cell', class: 'rp-tt-ride' }, el), ask === 'ride' ? '？' : rideWords(row.ride)); show(htmlEl('span', { role: 'cell', class: 'rp-tt-arrive' }, el), ask === 'arrive' ? '？' : said(row.arrive)); }
    return el;
  });

  const clocks = htmlEl('div', { class: 'rp-tt-clocks' }, ctx.stage);
  const departClock = clockFace(clocks, { label: '出發', book });
  const arriveClock = ask === 'read' ? null : clockFace(clocks, { label: '到站', book });
  const stepper = htmlEl('div', { class: 'rp-tt-stepper', hidden: true }, ctx.stage);
  const line = htmlEl('div', { class: 'rp-tt-line', 'aria-hidden': 'true' }, ctx.stage);
  show(htmlEl('span', { class: 'rp-tt-sign is-from' }, line), round.station);
  const toSign = htmlEl('span', { class: 'rp-tt-sign is-to' }, line, '');
  const runner = htmlEl('img', { class: 'rp-tt-train-img', src: artUrl('train'), alt: '' }, line);

  function showRow(i) {
    const row = round.rows[i];
    rowEls.forEach((el, k) => { el.classList.toggle('is-current', k === i); el.toggleAttribute('aria-current', k === i); });
    show(toSign, row.to);
    runner.style.filter = `url(#rp-tt-hue-${row.color})`;
    runner.className = `rp-tt-train-img hue-${row.color}`; runner.getAnimations?.().forEach(a => a.cancel());
    if (ask === 'read') departClock.set(row.depart);
    else if (ask === 'arrive') { departClock.set(row.depart); arriveClock.unknown(); }
    else if (ask === 'ride') { departClock.set(row.depart); arriveClock.set(row.arrive); }
    else { departClock.unknown(); arriveClock.set(row.arrive); }
    departClock.caption(ask === 'read' || ask === 'depart' ? '出發：？' : zh('出發 {time}', { time: said(row.depart) }));
    arriveClock?.caption(ask === 'arrive' ? '到站：？' : zh('到站 {time}', { time: said(row.arrive) }));
    stepper.hidden = true; helper = null;
    ctx.say(rowQuestion(round, i));
    const buttons = ctx.setControls(row.choices.map(value => ({ label: choiceLabel(value), html: true, className: 'rp-answer rp-time-answer', ariaLabel: choiceAria(value), onClick: () => answer(value) })));
    buttons.forEach((b, k) => { b.dataset.value = String(row.choices[k]); });
    choiceButtons = buttons;
  }
  const choiceAria = value => (ask === 'ride' ? rideWords(value) : timeWords(value));
  function choiceLabel(value) {
    if (ask === 'ride') return `<b>${esc(tx(rideWords(value)))}</b>`;
    const { hour, minute } = handAngles(value);
    return `<svg viewBox="-50 -50 100 100" aria-hidden="true"><circle r="46" class="rp-mini-face"/><line y2="-24" transform="rotate(${hour})" class="rp-mini-hour"/><line y2="-38" transform="rotate(${minute})" class="rp-mini-minute"/></svg><b>${esc(tx(said(value)))}</b>`;
  }
  /** Ready-HTML answer buttons cannot be re-translated by the shell: repaint them here. */
  function relabelChoices() {
    for (const b of choiceButtons) if (b?.isConnected && b.dataset.value) { const value = Number(b.dataset.value); b.innerHTML = choiceLabel(value); b.setAttribute('aria-label', tx(choiceAria(value))); }
  }

  function openHelper() {
    const row = round.rows[index], steps = helperSteps(round);
    if (!steps.length) return;
    const target = ask === 'depart' ? departClock : arriveClock, startAt = ask === 'depart' ? row.arrive : row.depart;
    helper = { at: startAt, taps: {} };
    target.set(startAt); target.caption('轉轉看');
    stepper.hidden = false; stepper.replaceChildren();
    const tally = htmlEl('span', { class: 'rp-tt-tally', 'aria-live': 'polite' }, stepper);
    helper.tally = tally; paintTally();
    for (const step of steps) {
      const abs = Math.abs(step), text = stepLabel(step, abs);
      ctx.button(text, { parent: stepper, className: 'rp-step', onClick: () => {
        const next = helper.at + step;
        if (next < 60 || next > 12 * 60 + 59) return;
        helper.at = next; helper.taps[text] = (helper.taps[text] || 0) + 1; target.set(next); ctx.tap();
        paintTally();
      } });
    }
    ctx.button('從頭', { parent: stepper, className: 'rp-step', onClick: () => { helper.at = startAt; helper.taps = {}; target.set(startAt); paintTally(); } });
  }
  /** 「＋5 分」「－1 小時」: one key per sign and unit, so English gets its own plus/minus and plural. */
  function stepLabel(step, abs) {
    if (abs >= 60) return zh(step < 0 ? '－{n} 小時' : '＋{n} 小時', { n: abs / 60 });
    return zh(step < 0 ? '－{n} 分' : '＋{n} 分', { n: abs });
  }
  /** The tally is drawn from helper.taps (Chinese step labels), so a language switch can redraw it. */
  function paintTally() {
    const tally = helper?.tally, taps = Object.entries(helper?.taps || {});
    if (!tally) return;
    tally.textContent = taps.length ? t('轉了：{list}', { list: taps.map(([k, v]) => `${tx(k)} × ${v}`).join(isEnglish() ? ', ' : '，') }) : t('從頭開始轉');
  }

  async function answer(value) {
    const row = round.rows[index], result = checkTimetable(round, index, value);
    if (!result.correct) {
      ctx.say(result.hint, { retry: true });
      const tried = ctx.controls.querySelector(`[data-value="${value}"]`); if (tried) { tried.disabled = true; tried.classList.add('is-tried'); }
      if (!helper) openHelper();
      return;
    }
    ctx.setBusy(true); ctx.chime('star'); stepper.hidden = true;
    ctx.controls.querySelectorAll('button').forEach(b => { b.disabled = true; b.classList.toggle('is-right', b.dataset.value === String(value)); });
    // row.train is 「{color}列車」; the color goes in as its own value so English can find the time after it.
    ctx.say(ask === 'read' ? zh('答對了！{color}列車{time}出發。', { color: RAIL_COLORS[row.color].name, time: timeWords(row.depart) }) : ask === 'ride' ? zh('答對了！坐了 {ride}。', { ride: rideWords(row.ride) }) : ask === 'depart' ? zh('答對了！{time}出發。', { time: timeWords(row.depart) }) : zh('答對了！{time}到{station}。', { time: timeWords(row.arrive), station: row.to }));
    const cell = rowEls[index].querySelector(ask === 'read' || ask === 'depart' ? '.rp-tt-depart' : ask === 'ride' ? '.rp-tt-ride' : '.rp-tt-arrive');
    show(cell, ask === 'ride' ? rideWords(row.ride) : said(row.answer)); cell.classList.add('is-filled');
    // Show the result: the clock hands sweep while the train runs to the next station.
    const run = runner.animate && !reducedMotion() ? runner.animate([{ left: '2%' }, { left: 'calc(98% - var(--rp-runner-w))' }], { duration: 1800, easing: 'ease-in-out', fill: 'forwards' }).finished.catch(() => {}) : Promise.resolve();
    if (ask === 'arrive') { arriveClock.caption(zh('到站 {time}', { time: said(row.arrive) })); await sweep(arriveClock, row.depart, row.arrive, 1800, ctx.alive); }
    else if (ask === 'depart') { departClock.caption(zh('出發 {time}', { time: said(row.depart) })); await sweep(departClock, row.arrive, row.depart, 1800, ctx.alive); }
    else if (ask === 'ride') await sweep(arriveClock, row.depart, row.arrive, 1800, ctx.alive);
    else { departClock.caption(zh('出發 {time}', { time: said(row.depart) })); await wait(300); }
    await run; if (!ctx.alive()) return;
    rowEls[index].classList.add('is-done');
    await wait(500); if (!ctx.alive()) return;
    ctx.setBusy(false);
    index += 1;
    if (index >= round.rows.length) { ctx.win('時刻表都排好了，每一班列車都準時！'); return; }
    showRow(index);
  }

  // Hue filters for the little runner train (shared ids with the boards are fine: same values).
  const defs = svgEl('svg', { class: 'rp-defs', width: 0, height: 0, 'aria-hidden': 'true' }, ctx.stage);
  for (const c of Object.values(RAIL_COLORS)) { const f = svgEl('filter', { id: `rp-tt-hue-${c.id}`, 'color-interpolation-filters': 'sRGB' }, defs); svgEl('feColorMatrix', { type: 'hueRotate', values: c.hue }, f); }
  showRow(0);
  const stopListening = onLanguageChange(() => { book.relabel(); relabelChoices(); paintTally(); });
  return { destroy() { stopListening(); }, get round() { return round; }, get row() { return round.rows[index] || null; } };
}

export function openPlatformTimetable(options = {}) {
  return openRailGame({ id: TIMETABLE_GAME.id, title: TIMETABLE_GAME.title, levels: age => timetableLevels(age), mount }, options);
}
