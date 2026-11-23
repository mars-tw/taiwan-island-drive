// R48 B line math 2 screen: a departure board, two clocks and a little line the train runs along.
import { openRailGame, htmlEl, svgEl, wait, reducedMotion, artUrl } from '../puzzles/rail-shell.js';
import { RAIL_COLORS } from '../puzzles/common.js';
import {
  TIMETABLE_GAME, timetableLevels, createTimetableRound, checkTimetable, helperSteps, handAngles, rowQuestion, choiceWords, rideWords, timeWords,
} from './platform-timetable.js';

/** Analog clock face; returns { el, set(minutes), unknown(flag) }. */
export function clockFace(parent, { label = '', small = false } = {}) {
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
  const caption = label ? htmlEl('figcaption', {}, wrap, label) : null;
  const api = {
    el: wrap, value: null,
    set(minutes) { api.value = minutes; const { hour: h, minute: m } = handAngles(minutes); hour.setAttribute('transform', `rotate(${h})`); minute.setAttribute('transform', `rotate(${m})`); wrap.classList.remove('is-unknown'); },
    unknown() { api.value = null; wrap.classList.add('is-unknown'); },
    caption(text) { if (caption) caption.textContent = text; },
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
  let index = 0, helper = null;

  const boardEl = htmlEl('section', { class: 'rp-timetable', 'aria-label': `${round.station}站月台時刻表` }, ctx.stage);
  htmlEl('h2', {}, boardEl, `${round.station}站 月台時刻表`);
  const table = htmlEl('div', { class: `rp-tt-rows ask-${ask}`, role: 'table' }, boardEl);
  const headRow = htmlEl('div', { class: 'rp-tt-row is-head', role: 'row' }, table);
  for (const text of ['列車', '開往', '出發', ...(ask === 'read' ? [] : ['坐多久', '到站'])]) htmlEl('span', { role: 'columnheader' }, headRow, text);
  const rowEls = round.rows.map(row => {
    const el = htmlEl('div', { class: 'rp-tt-row', role: 'row' }, table);
    const name = htmlEl('span', { role: 'cell', class: 'rp-tt-train' }, el);
    htmlEl('i', { style: `background:${RAIL_COLORS[row.color].hex}`, 'aria-hidden': 'true' }, name); name.append(row.train);
    htmlEl('span', { role: 'cell' }, el, row.to);
    htmlEl('span', { role: 'cell', class: 'rp-tt-depart' }, el, ask === 'read' || ask === 'depart' ? '？' : said(row.depart));
    if (ask !== 'read') { htmlEl('span', { role: 'cell', class: 'rp-tt-ride' }, el, ask === 'ride' ? '？' : rideWords(row.ride)); htmlEl('span', { role: 'cell', class: 'rp-tt-arrive' }, el, ask === 'arrive' ? '？' : said(row.arrive)); }
    return el;
  });

  const clocks = htmlEl('div', { class: 'rp-tt-clocks' }, ctx.stage);
  const departClock = clockFace(clocks, { label: '出發' });
  const arriveClock = ask === 'read' ? null : clockFace(clocks, { label: '到站' });
  const stepper = htmlEl('div', { class: 'rp-tt-stepper', hidden: true }, ctx.stage);
  const line = htmlEl('div', { class: 'rp-tt-line', 'aria-hidden': 'true' }, ctx.stage);
  htmlEl('span', { class: 'rp-tt-sign is-from' }, line, round.station);
  const toSign = htmlEl('span', { class: 'rp-tt-sign is-to' }, line, '');
  const runner = htmlEl('img', { class: 'rp-tt-train-img', src: artUrl('train'), alt: '' }, line);

  function showRow(i) {
    const row = round.rows[i];
    rowEls.forEach((el, k) => { el.classList.toggle('is-current', k === i); el.toggleAttribute('aria-current', k === i); });
    toSign.textContent = row.to;
    runner.style.filter = `url(#rp-tt-hue-${row.color})`;
    runner.className = `rp-tt-train-img hue-${row.color}`; runner.getAnimations?.().forEach(a => a.cancel());
    if (ask === 'read') departClock.set(row.depart);
    else if (ask === 'arrive') { departClock.set(row.depart); arriveClock.unknown(); }
    else if (ask === 'ride') { departClock.set(row.depart); arriveClock.set(row.arrive); }
    else { departClock.unknown(); arriveClock.set(row.arrive); }
    departClock.caption(ask === 'read' || ask === 'depart' ? '出發：？' : `出發 ${said(row.depart)}`);
    arriveClock?.caption(ask === 'arrive' ? '到站：？' : `到站 ${said(row.arrive)}`);
    stepper.hidden = true; helper = null;
    ctx.say(rowQuestion(round, i));
    const buttons = ctx.setControls(row.choices.map(value => ({ label: choiceLabel(value), html: true, className: 'rp-answer rp-time-answer', ariaLabel: ask === 'ride' ? rideWords(value) : timeWords(value), onClick: () => answer(value) })));
    buttons.forEach((b, k) => { b.dataset.value = String(row.choices[k]); });
  }
  function choiceLabel(value) {
    if (ask === 'ride') return `<b>${rideWords(value)}</b>`;
    const { hour, minute } = handAngles(value);
    return `<svg viewBox="-50 -50 100 100" aria-hidden="true"><circle r="46" class="rp-mini-face"/><line y2="-24" transform="rotate(${hour})" class="rp-mini-hour"/><line y2="-38" transform="rotate(${minute})" class="rp-mini-minute"/></svg><b>${said(value)}</b>`;
  }

  function openHelper() {
    const row = round.rows[index], steps = helperSteps(round);
    if (!steps.length) return;
    const target = ask === 'depart' ? departClock : arriveClock, startAt = ask === 'depart' ? row.arrive : row.depart;
    helper = { at: startAt, taps: {} };
    target.set(startAt); target.caption('轉轉看');
    stepper.hidden = false; stepper.replaceChildren();
    const tally = htmlEl('span', { class: 'rp-tt-tally', 'aria-live': 'polite' }, stepper, '從頭開始轉');
    for (const step of steps) {
      const abs = Math.abs(step), text = `${step < 0 ? '－' : '＋'}${abs >= 60 ? `${abs / 60} 小時` : `${abs} 分`}`;
      ctx.button(text, { parent: stepper, className: 'rp-step', onClick: () => {
        const next = helper.at + step;
        if (next < 60 || next > 12 * 60 + 59) return;
        helper.at = next; helper.taps[text] = (helper.taps[text] || 0) + 1; target.set(next); ctx.tap();
        tally.textContent = `轉了：${Object.entries(helper.taps).map(([k, v]) => `${k} × ${v}`).join('，')}`;
      } });
    }
    ctx.button('從頭', { parent: stepper, className: 'rp-step', onClick: () => { helper.at = startAt; helper.taps = {}; target.set(startAt); tally.textContent = '從頭開始轉'; } });
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
    ctx.say(ask === 'read' ? `答對了！${row.train}${timeWords(row.depart)}出發。` : ask === 'ride' ? `答對了！坐了 ${rideWords(row.ride)}。` : ask === 'depart' ? `答對了！${timeWords(row.depart)}出發。` : `答對了！${timeWords(row.arrive)}到${row.to}。`);
    const cell = rowEls[index].querySelector(ask === 'read' || ask === 'depart' ? '.rp-tt-depart' : ask === 'ride' ? '.rp-tt-ride' : '.rp-tt-arrive');
    cell.textContent = ask === 'ride' ? rideWords(row.ride) : said(row.answer); cell.classList.add('is-filled');
    // Show the result: the clock hands sweep while the train runs to the next station.
    const run = runner.animate && !reducedMotion() ? runner.animate([{ left: '2%' }, { left: 'calc(98% - var(--rp-runner-w))' }], { duration: 1800, easing: 'ease-in-out', fill: 'forwards' }).finished.catch(() => {}) : Promise.resolve();
    if (ask === 'arrive') { arriveClock.caption(`到站 ${said(row.arrive)}`); await sweep(arriveClock, row.depart, row.arrive, 1800, ctx.alive); }
    else if (ask === 'depart') { departClock.caption(`出發 ${said(row.depart)}`); await sweep(departClock, row.arrive, row.depart, 1800, ctx.alive); }
    else if (ask === 'ride') await sweep(arriveClock, row.depart, row.arrive, 1800, ctx.alive);
    else { departClock.caption(`出發 ${said(row.depart)}`); await wait(300); }
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
  return { destroy() {}, get round() { return round; }, get row() { return round.rows[index] || null; } };
}

export function openPlatformTimetable(options = {}) {
  return openRailGame({ id: TIMETABLE_GAME.id, title: TIMETABLE_GAME.title, levels: age => timetableLevels(age), mount }, options);
}
