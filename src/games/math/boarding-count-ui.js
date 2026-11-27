// R48 B line math 1 screen: the train stops station by station; friends get off, then on.
// R50: sentences stay Chinese in the game state. The shell translates what it is handed (say, win, button
// labels); this file's own text goes through show(), which keeps the Chinese and redraws after a language switch.
import { openRailGame, htmlEl, wait, reducedMotion } from '../puzzles/rail-shell.js';
import { appUrl } from '../../shared/paths.js';
import { artImage } from '../../shared/art-refresh.js';
import { onLanguageChange } from '../../shared/i18n.js';
import { zh, tx } from './room-text.js';
import { BOARDING_GAME, boardingLevels, createBoardingTrip, checkBoarding, stopSentence, questionText } from './boarding-count.js';

const head = id => appUrl(`art/r4/passenger-${(id % 6) + 1}.png`);

/** Text (or one attribute) shown in the current language; relabel() repaints everything after a switch. */
function textBook() {
  const items = new Map();
  const paint = (el, attr, text) => { if (attr) el.setAttribute(attr, tx(text)); else el.textContent = tx(text); };
  return {
    show(el, text, attr = '') { if (!items.has(el)) items.set(el, {}); items.get(el)[attr] = text; paint(el, attr, text); return el; },
    relabel() { for (const [el, texts] of items) { if (!el.isConnected) { items.delete(el); continue; } for (const [attr, text] of Object.entries(texts)) paint(el, attr, text); } },
  };
}

function mount(ctx) {
  const trip = createBoardingTrip({ age: ctx.age, level: ctx.level, seed: ctx.seed });
  const perCar = trip.max === 5 ? 5 : 10, carCount = trip.max === 20 ? 2 : 1;
  let riders = [], nextId = 0, qIndex = 0;
  const { show, relabel } = textBook();

  const route = show(htmlEl('ol', { class: 'rp-ride-route' }, ctx.stage), '路線', 'aria-label');
  trip.stops.forEach(stop => show(htmlEl('li', {}, route), stop.station));
  const scene = htmlEl('div', { class: `rp-ride-scene seats-${perCar}${trip.hidden ? ' is-curtained' : ''}` }, ctx.stage);
  const sign = htmlEl('div', { class: 'rp-ride-sign' }, scene);
  const signName = htmlEl('b', {}, sign);
  const pills = htmlEl('div', { class: 'rp-ride-pills', 'aria-live': 'polite' }, sign);
  const count = htmlEl('div', { class: 'rp-ride-count', 'aria-live': 'polite' }, scene);
  const train = htmlEl('div', { class: `rp-ride-train cars-${carCount}` }, scene);
  const seats = [];
  for (let c = 0; c < carCount; c++) {
    const car = htmlEl('div', { class: 'rp-ride-car' }, train);
    const grid = htmlEl('div', { class: 'rp-ride-seats' }, car);
    for (let s = 0; s < perCar; s++) seats.push(htmlEl('span', { class: 'rp-seat' }, grid));
    htmlEl('img', { class: 'rp-ride-shell', src: appUrl('art/r5/carriage-blue.png'), alt: '', 'aria-hidden': 'true' }, car);
    if (trip.hidden) show(htmlEl('div', { class: 'rp-curtain', 'aria-hidden': 'true' }, car), '拉上窗簾・用想的');
  }
  const platform = htmlEl('div', { class: 'rp-ride-platform', 'aria-hidden': 'true' }, scene);
  const log = show(htmlEl('ol', { class: 'rp-trip-log' }, ctx.stage), '乘車紀錄', 'aria-label');

  function paintSeats() {
    seats.forEach((seat, i) => {
      seat.replaceChildren();
      seat.classList.toggle('is-taken', i < riders.length);
      if (i < riders.length) htmlEl('img', { src: head(riders[i]), alt: '' }, seat);
    });
    const n = riders.length;
    show(count, trip.hidden ? '車上：？ 人' : zh('車上：{n} 人', { n }));
    show(count, trip.hidden ? '車上的人數藏起來了' : zh('車上 {n} 人', { n }), 'aria-label');
  }
  function setStation(i) {
    route.querySelectorAll('li').forEach((li, k) => { li.toggleAttribute('aria-current', k === i); li.classList.toggle('is-past', k < i); });
    show(signName, zh('{name}站', { name: trip.stops[i].station }));
  }
  function showPills(stop, i, hideOn = false) {
    pills.replaceChildren();
    if (stop.off) show(htmlEl('span', { class: 'rp-pill is-off' }, pills), zh('下車 {n} 人', { n: stop.off }));
    if (stop.on || hideOn) show(htmlEl('span', { class: 'rp-pill is-on' }, pills), hideOn ? '上車 ？ 人' : zh('上車 {n} 人', { n: stop.on }));
    if (!i && !stop.off) pills.firstChild?.classList.add('is-first');
  }
  function addLog(stop, i, hideOn = false) {
    // Hidden 「上車 ？ 人」: the reverse question always sits at a later stop where friends got off first.
    const hidden = () => (i && stop.off ? zh('{station}站下車 {off} 人，上車 {on} 人', { station: stop.station, off: stop.off, on: '？' }) : zh('{station}站上車 {n} 人', { station: stop.station, n: '？' }));
    show(htmlEl('li', {}, log), hideOn ? hidden() : stopSentence(stop, i));
  }

  async function walk(kind, n) {
    // A walker is presentation only: the seat count changes one friend at a time.
    for (let k = 0; k < n; k++) {
      if (!ctx.alive()) return false;
      const id = kind === 'off' ? riders[riders.length - 1] : nextId++;
      const walker = htmlEl('span', { class: `rp-walker is-${kind}` }, platform);
      walker.append(artImage(`passenger-${(id % 6) + 1}-0`, '', 'rp-walk-a'), artImage(`passenger-${(id % 6) + 1}-1`, '', 'rp-walk-b'));
      if (kind === 'off') { riders.pop(); paintSeats(); }
      ctx.tap();
      const frames = kind === 'off' ? [{ transform: 'translateX(0)', opacity: 1 }, { transform: 'translateX(260%)', opacity: 0 }] : [{ transform: 'translateX(-260%)', opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }];
      if (!reducedMotion() && walker.animate) await walker.animate(frames, { duration: 520, easing: 'ease-in-out' }).finished.catch(() => {});
      walker.remove();
      if (kind === 'on') { riders.push(id); paintSeats(); }
      await wait(90);
    }
    return true;
  }
  async function drive(direction) {
    if (reducedMotion() || !train.animate) return true;
    const frames = direction === 'in' ? [{ transform: 'translateX(-115%)' }, { transform: 'translateX(0)' }] : [{ transform: 'translateX(0)' }, { transform: 'translateX(120%)' }];
    await train.animate(frames, { duration: 1300, easing: direction === 'in' ? 'ease-out' : 'ease-in' }).finished.catch(() => {});
    return ctx.alive();
  }

  async function runStop(i) {
    ctx.setBusy(true); ctx.setControls([]);
    const stop = trip.stops[i], q = trip.questions[qIndex], missing = q?.type === 'missing' && q.after === i;
    setStation(i); showPills(stop, i, missing);
    const sentence = missing ? zh('{station}站下車 {n} 人，又上來一些人。', { station: stop.station, n: stop.off }) : `${stopSentence(stop, i)}。`;
    const intro = trip.hidden ? '這一趟拉上窗簾，看不到車裡。記住每一站上車、下車的人數。{stop}' : '看看每一站有幾人下車、幾人上車。{stop}';
    ctx.say(i === 0 ? zh(intro, { stop: sentence }) : sentence, { voice: true });
    if (!(await drive('in'))) return;
    if (stop.off && !(await walk('off', stop.off))) return;
    if (missing) { riders.push(...Array.from({ length: stop.on }, () => nextId++)); paintSeats(); show(count, zh('車上：{n} 人', { n: stop.after })); }
    else if (stop.on && !(await walk('on', stop.on))) return;
    addLog(stop, i, missing);
    ctx.setBusy(false);
    if (q && q.after === i) ask(i); else nextButton(i);
  }
  function nextButton(i) {
    const lastStop = i >= trip.stops.length - 1;
    ctx.setControls([{ label: lastStop ? '列車出發 ▶' : zh('開往{station}站 ▶', { station: trip.stops[i + 1].station }), primary: true, onClick: () => leave(i) }]);
    ctx.controls.querySelector('button')?.focus();
  }
  function ask(i) {
    const q = trip.questions[qIndex];
    ctx.say(questionText(trip, qIndex));
    const buttons = ctx.setControls(q.choices.map(value => ({ label: zh('{n} 人', { n: value }), className: 'rp-answer', onClick: () => answer(i, value) })));
    // The shell translates the label, so answers are matched by value, not by the text on the button.
    buttons.forEach((b, k) => { if (b) b.dataset.value = String(q.choices[k]); });
    buttons[0]?.focus();
  }
  async function answer(i, value) {
    const q = trip.questions[qIndex], result = checkBoarding(trip, qIndex, value);
    if (!result.correct) {
      ctx.say(result.hint, { retry: true });
      ctx.controls.querySelectorAll('button').forEach(b => { if (b.dataset.value === String(value)) { b.classList.add('is-tried'); b.disabled = true; } });
      return;
    }
    ctx.chime('star');
    ctx.controls.querySelectorAll('button').forEach(b => { b.disabled = true; if (b.dataset.value === String(value)) b.classList.add('is-right'); });
    if (q.type === 'missing') { show(log.lastChild, stopSentence(trip.stops[i], i)); showPills(trip.stops[i], i); ctx.say(zh('答對了！{station}站上車 {n} 人。', { station: trip.stops[i].station, n: q.answer })); }
    else { show(count, zh('車上：{n} 人', { n: q.answer })); count.classList.add('is-solved'); ctx.say(zh('答對了！車上有 {n} 人。', { n: q.answer })); }
    qIndex += 1;
    await wait(700); if (!ctx.alive()) return;
    nextButton(i);
  }
  async function leave(i) {
    ctx.setBusy(true); ctx.setControls([]); count.classList.remove('is-solved');
    if (!(await drive('out'))) return;
    if (i >= trip.stops.length - 1) {
      train.style.transform = 'translateX(120%)'; ctx.setBusy(false);
      ctx.win(trip.questions.length > 1 ? '每一站的人數都算對了！' : '人數算對了，列車開往下一站！');
      return;
    }
    await runStop(i + 1);
  }

  paintSeats();
  const stopListening = onLanguageChange(relabel);
  void runStop(0);
  return { destroy() { stopListening(); }, get trip() { return trip; }, get question() { return trip.questions[qIndex] || null; } };
}

export function openBoardingCount(options = {}) {
  return openRailGame({ id: BOARDING_GAME.id, title: BOARDING_GAME.title, levels: age => boardingLevels(age), mount }, options);
}
