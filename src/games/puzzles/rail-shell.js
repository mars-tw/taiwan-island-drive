// R48 B line: one dialog shell shared by the rail puzzles and the new math games.
// No timers decide anything: every step waits for the child. Animations only show results.
import './rail-play.css';
import { artImage } from '../../shared/art-refresh.js';
import { appUrl } from '../../shared/paths.js';
import { readSettings } from '../../shared/settings.js';
import { speakNative, stopNativeSpeech, registerNativeOverlay } from '../../shared/native.js';
import { celebrate, playChime } from '../../shared/celebrate.js';
import { SPEAKER_ICON } from '../../shared/speaker-icon.js';
import { phraseHtml } from '../../shared/phrase-wrap.js';
import { t, onLanguageChange } from '../../shared/i18n.js';
import { zh, tx } from '../math/room-text.js';
import { normalizeAge, ageFromSettings, AGE_LABELS, newSeed } from './common.js';
import { readProgress, recordClear, unlockedLevel } from './progress.js';

export const RAIL_ART = Object.freeze({
  train: 'art/content-r3/train-side.webp',
  trainTop: 'art/r49/train-top.webp', // R49：從正上方看的兩節列車（轉轍器分月台用）
  carBlue: 'art/r5/carriage-blue.png',
  carOrange: 'art/r5/carriage-orange.png',
});
export const artUrl = key => appUrl(RAIL_ART[key] || key);
export const SVG_NS = 'http://www.w3.org/2000/svg';
export function svgEl(name, attrs = {}, parent = null) {
  const el = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) el.setAttribute(k, String(v));
  if (parent) parent.append(el);
  return el;
}
export function htmlEl(name, attrs = {}, parent = null, text = '') {
  const el = document.createElement(name);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = v; else if (k === 'dataset') Object.assign(el.dataset, v); else el.setAttribute(k, v === true ? '' : String(v));
  }
  if (text) el.textContent = text;
  if (parent) parent.append(el);
  return el;
}
export const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
export const wait = ms => new Promise(resolve => setTimeout(resolve, reducedMotion() ? Math.min(ms, 60) : ms));

/** Hue filters (sRGB) that recolour the academy train and carriage art. */
export function colorFilters(svg, colors) {
  const defs = svgEl('defs', {}, svg);
  for (const c of colors) {
    const f = svgEl('filter', { id: `rp-hue-${c.id}`, 'color-interpolation-filters': 'sRGB', x: '-5%', y: '-5%', width: '110%', height: '110%' }, defs);
    svgEl('feColorMatrix', { type: 'hueRotate', values: c.hue }, f);
  }
  return defs;
}

let dialog = null, current = null, overlayRegistered = false;
/** The open game (or null): lets the math room and browser checks see which game and level are showing. */
export const railPlayState = () => current;

function ensureDialog() {
  if (dialog && dialog.isConnected) return dialog;
  dialog = htmlEl('dialog', { id: 'rail-play', class: 'rail-play', 'aria-labelledby': 'rail-play-title' }, document.body);
  dialog.addEventListener('cancel', event => { event.preventDefault(); current?.close(); });
  if (!overlayRegistered) { registerNativeOverlay({ isOpen: () => !!dialog?.open, close: () => current?.close() }); overlayRegistered = true; }
  return dialog;
}

/**
 * Opens a game in the shared dialog.
 * def: { id, title, levels(age) -> [{focus?}], mount(ctx) -> { destroy?() } }
 * options: { age, level, seed, onClose, onWin, backLabel }
 *  - onWin({ level, age }): a level was cleared (the math room stamps it and shows its own celebration).
 * R50: games hand the shell Chinese source text (say, win, button labels and aria-labels, title, focus, backLabel);
 * the shell shows and speaks it in the current language with tx(), and re-labels itself when the language changes.
 */
export function openRailGame(def, options = {}) {
  if (current) current.close({ silent: true });
  const settings = readSettings();
  const fallback = ageFromSettings(settings);
  const age = normalizeAge(options.age ?? fallback, fallback);
  const levels = def.levels(age);
  const box = ensureDialog();
  const opener = document.activeElement;
  let level = Number.isInteger(options.level) ? Math.max(0, Math.min(levels.length - 1, options.level)) : unlockedLevel(readProgress(), def.id, age);
  let game = null, token = 0, busy = false, cue = '', resizeFns = [], languageFns = [], observer = null, closed = false, overlayBuild = null;
  const buttonSources = new WeakMap(); // button → its Chinese label / aria-label and what was last painted

  box.dataset.game = def.id;
  box.innerHTML = '';
  const page = htmlEl('section', { class: 'rp-page' }, box);
  const top = htmlEl('header', { class: 'rp-top' }, page);
  const backText = () => tx(options.backLabel || '回去');
  const back = htmlEl('button', { type: 'button', class: 'rp-back', 'aria-label': backText() }, top, `← ${backText()}`);
  const heading = htmlEl('div', { class: 'rp-heading' }, top);
  const titleEl = htmlEl('h1', { id: 'rail-play-title', tabindex: '-1' }, heading, tx(def.title));
  const levelTag = htmlEl('span', { class: 'rp-level' }, heading);
  const listButton = htmlEl('button', { type: 'button', class: 'rp-list', 'aria-label': t('選關卡') }, top, t('關卡'));
  const speakButton = htmlEl('button', { type: 'button', class: 'rp-speak', 'aria-label': t('再唸一次') }, top);
  speakButton.innerHTML = SPEAKER_ICON; // R49：固定墨藍色喇叭圖，取代會變淡灰的 🔊 表情符號
  const stage = htmlEl('div', { class: 'rp-stage' }, page);
  const coach = htmlEl('div', { class: 'rp-coach', role: 'status', 'aria-live': 'polite' }, page);
  const coachImg = artImage('coach', t('阿路教練'), 'rp-coach-img');
  coach.append(coachImg);
  const cueText = htmlEl('span', { class: 'rp-cue' }, coach);
  const controls = htmlEl('footer', { class: 'rp-controls' }, page);
  const overlay = htmlEl('section', { class: 'rp-overlay', hidden: true, 'aria-modal': 'true', role: 'dialog', 'aria-label': t('關卡') }, box);

  // R50: speech and the cue follow the current language; `cue` keeps the Chinese source for a later switch.
  function speak(text) { if (!readSettings().muted && text) void speakNative(tx(text), { rate: 0.8 }); }
  function say(text, { retry = false, voice = true } = {}) {
    cue = text; text = tx(text); cueText.innerHTML = phraseHtml(text); // R49 修正輪：只在詞和詞之間換行
    coach.classList.toggle('is-retry', retry);
    if (retry) { coach.classList.remove('nudge'); void coach.offsetWidth; coach.classList.add('nudge'); }
    if (voice) speak(text);
  }
  function setBusy(flag) { busy = !!flag; box.classList.toggle('is-busy', busy); }
  // Labels and aria-labels are Chinese source (or already English); html: true labels are ready-made HTML and stay as given.
  function button(label, { onClick, primary = false, className = '', ariaLabel, disabled = false, parent = controls, html = false } = {}) {
    const b = htmlEl('button', { type: 'button', class: `${primary ? 'rp-primary ' : ''}${className}`.trim(), 'aria-label': typeof ariaLabel === 'string' ? tx(ariaLabel) : ariaLabel, disabled }, parent);
    if (html) b.innerHTML = label; else b.textContent = tx(label);
    buttonSources.set(b, { label, ariaLabel, html, text: b.textContent, aria: b.getAttribute('aria-label') });
    if (onClick) b.addEventListener('click', event => { if (busy || closed) return; onClick(event); });
    return b;
  }
  function setControls(list) { controls.replaceChildren(); return list.map(item => item && button(item.label, item)); }

  // The card covers the play area only, so 回去／關卡／🔊 in the top bar always stay reachable.
  const behind = () => [stage, coach, controls];
  function showOverlay(build) {
    overlayBuild = build;
    overlay.replaceChildren(); overlay.hidden = false; for (const el of behind()) { el.setAttribute('aria-hidden', 'true'); el.inert = true; }
    const card = htmlEl('div', { class: 'rp-card' }, overlay); build(card);
    card.querySelector('button')?.focus();
  }
  function hideOverlay() { overlayBuild = null; overlay.hidden = true; overlay.replaceChildren(); for (const el of behind()) { el.removeAttribute('aria-hidden'); el.inert = false; } }

  function showLevels() {
    const unlocked = unlockedLevel(readProgress(), def.id, age);
    showOverlay(card => {
      htmlEl('h2', {}, card, t('{title}・選關卡', { title: tx(def.title) }));
      htmlEl('p', { class: 'rp-card-note' }, card, t('{age} · 完成一關就打開下一關。', { age: t(AGE_LABELS[age]) }));
      const grid = htmlEl('div', { class: 'rp-level-grid' }, card);
      levels.forEach((info, i) => {
        const open = i <= unlocked;
        const aria = info.focus ? (open ? '第 {n} 關，{focus}' : '第 {n} 關，{focus}，還沒打開') : (open ? '第 {n} 關' : '第 {n} 關，還沒打開');
        const b = button(zh(open ? '第 {n} 關' : '第 {n} 關 🔒', { n: i + 1 }), { parent: grid, disabled: !open, className: i === level ? 'is-current' : '', ariaLabel: zh(aria, { n: i + 1, focus: info.focus }), onClick: () => { hideOverlay(); start(i); } });
        if (info.focus) htmlEl('small', {}, b, tx(info.focus));
      });
      button('回到這一關', { parent: card, className: 'rp-card-back', onClick: hideOverlay });
    });
  }

  function win(text = '全部完成了！') {
    const myToken = token, saved = recordClear(def.id, age, level);
    if (options.onWin) { try { options.onWin({ level, age }); } catch { /* The host's stamp must never block the win card. */ } }
    else celebrate({ text: t('第 {n} 關完成！', { n: level + 1 }), kind: 'station', sound: !readSettings().muted, big: true });
    say(text, { voice: true });
    setTimeout(() => {
      if (myToken !== token || closed) return;
      const last = level >= levels.length - 1;
      showOverlay(card => {
        card.classList.add('rp-win');
        card.append(artImage('coach-cheer', t('阿路教練舉起綠旗'), 'rp-win-coach'));
        htmlEl('h2', {}, card, last ? t('{n} 關全部完成！', { n: levels.length }) : t('第 {n} 關完成！', { n: level + 1 }));
        htmlEl('p', {}, card, tx(text));
        if (!saved) htmlEl('p', { class: 'rp-card-note save-failed' }, card, t('這次無法儲存，關閉後可能不會保留。'));
        const row = htmlEl('div', { class: 'rp-card-actions' }, card);
        if (!last) button('下一關 →', { parent: row, primary: true, onClick: () => { hideOverlay(); start(level + 1); } });
        button('再玩一次', { parent: row, primary: last, onClick: () => { hideOverlay(); start(level); } });
        button('選關卡', { parent: row, onClick: showLevels });
      });
    }, reducedMotion() ? 200 : 1300);
  }

  function start(index, seed = newSeed()) {
    token += 1; setBusy(false);
    try { game?.destroy?.(); } catch { /* A broken teardown must not trap the child in the dialog. */ }
    resizeFns = []; languageFns = []; stage.replaceChildren(); controls.replaceChildren(); coach.classList.remove('is-retry');
    level = Math.max(0, Math.min(levels.length - 1, index));
    showLevelTag();
    box.dataset.level = String(level + 1);
    const myToken = token;
    const ctx = {
      age, level, info: levels[level], levels, seed, stage, controls, dialog: box,
      say, speak, button, setControls, setBusy, isBusy: () => busy, win,
      alive: () => myToken === token && !closed,
      tap: () => playChime('tap', { volume: 0.06 }),
      chime: kind => playChime(kind),
      onResize: fn => resizeFns.push(fn),
      // R50: fn() runs after a language switch while this level is open (redraw stage text); cleared on restart and close.
      onLanguageChange: fn => languageFns.push(fn),
      restart: () => start(level),
    };
    game = def.mount(ctx) || null;
  }

  function showLevelTag() { levelTag.textContent = t('{age} · 第 {n}／{total} 關', { age: t(AGE_LABELS[age]), n: level + 1, total: levels.length }); }
  /** R50 language switch: the shell's own words, the cue, the game's stage (if it asked), an open card, then the buttons. */
  function relabel() {
    back.setAttribute('aria-label', backText()); back.textContent = `← ${backText()}`;
    titleEl.textContent = tx(def.title);
    listButton.setAttribute('aria-label', t('選關卡')); listButton.textContent = t('關卡');
    speakButton.setAttribute('aria-label', t('再唸一次'));
    coachImg.alt = t('阿路教練');
    overlay.setAttribute('aria-label', t('關卡'));
    showLevelTag();
    if (cue) cueText.innerHTML = phraseHtml(tx(cue));
    for (const fn of languageFns) { try { fn(); } catch (error) { console.error(error); } }
    if (!overlay.hidden && overlayBuild) showOverlay(overlayBuild);
    for (const b of box.querySelectorAll('button')) {
      const src = buttonSources.get(b);
      if (!src) continue;
      // Only words the shell painted itself: a game that drew its own icon or text inside the button keeps it.
      if (!src.html && src.label && !b.childElementCount && b.textContent === src.text) b.textContent = src.text = tx(src.label);
      if (typeof src.ariaLabel === 'string' && b.getAttribute('aria-label') === src.aria) { src.aria = tx(src.ariaLabel); b.setAttribute('aria-label', src.aria); }
    }
  }
  const stopLanguage = onLanguageChange(() => { if (!closed) relabel(); });

  function close({ silent = false } = {}) {
    if (closed) return;
    closed = true; token += 1; stopLanguage();
    try { game?.destroy?.(); } catch { /* ignore */ }
    observer?.disconnect();
    void stopNativeSpeech();
    if (box.open) box.close();
    box.innerHTML = ''; delete box.dataset.game;
    current = null;
    if (!silent) { if (options.onClose) options.onClose(); else if (opener?.isConnected) opener.focus?.(); }
  }

  back.addEventListener('click', () => close());
  listButton.addEventListener('click', () => { if (!closed && !busy) showLevels(); });
  speakButton.addEventListener('click', () => speak(cue));
  let frame = 0;
  if (typeof ResizeObserver === 'function') {
    observer = new ResizeObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => resizeFns.forEach(fn => fn())); });
    observer.observe(stage);
  }
  current = { close, start, id: def.id, get level() { return level; }, get age() { return age; }, get game() { return game; } };
  if (!box.open) box.showModal();
  start(level, options.seed);
  box.querySelector('#rail-play-title')?.focus();
  return current;
}

/** Fits a fixed viewBox board inside the stage and returns helpers to place HTML buttons on it. */
export function createBoard(parent, className = '') {
  const wrap = htmlEl('div', { class: `rp-board ${className}`.trim() }, parent);
  const svg = svgEl('svg', { class: 'rp-svg', 'aria-hidden': 'true' }, wrap);
  const hits = htmlEl('div', { class: 'rp-hits' }, wrap);
  let width = 1000, height = 600;
  const board = {
    wrap, svg, hits,
    setView(w, h) { width = w; height = h; svg.setAttribute('viewBox', `0 0 ${w} ${h}`); board.fit(); },
    fit() {
      const box = parent.getBoundingClientRect(), extra = [...parent.children].filter(c => c !== wrap && !c.hidden).reduce((sum, c) => sum + c.getBoundingClientRect().height, 0);
      const availW = Math.max(120, box.width - 8), availH = Math.max(120, box.height - extra - 8);
      const scale = Math.min(availW / width, availH / height);
      wrap.style.width = `${Math.floor(width * scale)}px`; wrap.style.height = `${Math.floor(height * scale)}px`;
      board.scale = scale;
    },
    place(el, x, y) { el.style.left = `${(x / width) * 100}%`; el.style.top = `${(y / height) * 100}%`; },
    scale: 1,
  };
  return board;
}

/** Moves an SVG group along a path element; front = path tangent. Resolves when done. */
export function moveAlong(group, path, { from = 0, to = 1, duration = 1600, alive = () => true, transform } = {}) {
  const total = path.getTotalLength();
  const pose = t => {
    const at = Math.max(0, Math.min(total, total * t));
    const p = path.getPointAtLength(at), q = path.getPointAtLength(Math.min(total, at + 2)), r = path.getPointAtLength(Math.max(0, at - 2));
    const angle = Math.atan2(q.y - r.y, q.x - r.x) * 180 / Math.PI;
    group.setAttribute('transform', transform ? transform(p, angle) : `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${angle.toFixed(1)})`);
    return p;
  };
  const span = reducedMotion() ? 1 : duration;
  return new Promise(resolve => {
    const t0 = performance.now();
    const step = now => {
      if (!alive()) return resolve(false);
      const k = Math.min(1, (now - t0) / span), eased = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      pose(from + (to - from) * eased);
      if (k < 1) requestAnimationFrame(step); else resolve(true);
    };
    pose(from);
    requestAnimationFrame(step);
  });
}
