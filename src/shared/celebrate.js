// Procedural celebration feedback shared by all modes: confetti burst, a big
// sticker pop and a short major-chord chime. No image or audio files needed.
import { readSettings } from './settings.js';

export const CHIMES = Object.freeze({
  star: [[784, 0, 0.12], [1047, 0.08, 0.18]],
  station: [[523.25, 0, 0.14], [659.25, 0.1, 0.14], [783.99, 0.2, 0.26]],
  finish: [[523.25, 0, 0.14], [659.25, 0.12, 0.14], [783.99, 0.24, 0.14], [1046.5, 0.36, 0.42]],
  tap: [[660, 0, 0.07]]
});
export const CONFETTI_COLORS = ['#ff5d73', '#ffc23d', '#3ec7a7', '#4aa8ff', '#b07bff', '#ff8f3d'];

/** Returns the notes for a chime kind; unknown kinds fall back to "star". */
export function chimeNotes(kind = 'star') { return (CHIMES[kind] || CHIMES.star).map(([frequency, at, duration]) => ({ frequency, at, duration })); }

let context = null;
function audioContext() {
  if (context) return context;
  const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AudioContext) return null;
  try { context = new AudioContext(); } catch { context = null; }
  return context;
}
/** Must be called from a user gesture once so iOS allows later chimes. */
export function unlockCelebrationAudio() {
  const ctx = audioContext();
  if (ctx?.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function playChime(kind = 'star', { muted = readSettings().muted, volume = 0.16 } = {}) {
  if (muted) return 0;
  const ctx = audioContext();
  if (!ctx || ctx.state === 'closed') return 0;
  const notes = chimeNotes(kind), now = ctx.currentTime;
  for (const note of notes) {
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = 'triangle'; osc.frequency.setValueAtTime(note.frequency, now + note.at);
    gain.gain.setValueAtTime(0.0001, now + note.at);
    gain.gain.exponentialRampToValueAtTime(volume, now + note.at + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + note.at + note.duration);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now + note.at); osc.stop(now + note.at + note.duration + 0.02);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  }
  return notes.length;
}

const STYLE_ID = 'academy-celebrate-style';
const CSS = `.academy-celebrate{position:fixed;inset:0;pointer-events:none;z-index:90;overflow:hidden;contain:strict}
.academy-confetti{position:absolute;left:var(--x);top:var(--y);width:10px;height:14px;border-radius:3px;background:var(--c);transform:translate(-50%,-50%);animation:academy-confetti 1.15s cubic-bezier(.2,.7,.4,1) forwards;will-change:transform,opacity}
.academy-confetti.round{border-radius:50%;width:11px;height:11px}
@keyframes academy-confetti{0%{opacity:1;transform:translate(-50%,-50%) rotate(0) scale(.6)}70%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) rotate(var(--r)) scale(1)}}
.academy-sticker{position:absolute;left:var(--x);top:var(--y);transform:translate(-50%,-50%);display:flex;align-items:center;gap:.35em;padding:.42em .9em .42em .55em;border-radius:999px;background:#fff8d6;color:#5a3b00;border:4px solid #ffc23d;box-shadow:0 10px 0 rgba(120,70,0,.18),0 18px 34px rgba(0,0,0,.18);font:900 clamp(20px,4.6vmin,34px)/1.1 'Microsoft JhengHei','PingFang TC',sans-serif;white-space:nowrap;animation:academy-sticker 1.6s cubic-bezier(.2,1.4,.4,1) forwards}
.academy-sticker b{font-size:1.35em;line-height:1;filter:drop-shadow(0 2px 0 #c98a00)}
.academy-sticker.big{font-size:clamp(26px,6.4vmin,46px);background:#fff;border-color:#3ec7a7;color:#0f4d43}
@keyframes academy-sticker{0%{opacity:0;transform:translate(-50%,-50%) scale(.3)}18%{opacity:1;transform:translate(-50%,-50%) scale(1.12)}30%{transform:translate(-50%,-50%) scale(1)}80%{opacity:1;transform:translate(-50%,-62%) scale(1)}100%{opacity:0;transform:translate(-50%,-80%) scale(.92)}}
@media (prefers-reduced-motion:reduce){.academy-confetti{display:none}.academy-sticker{animation:academy-fade 1.6s linear forwards}@keyframes academy-fade{0%,80%{opacity:1}100%{opacity:0}}}`;

function ensureLayer() {
  if (typeof document === 'undefined') return null;
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style'); style.id = STYLE_ID; style.textContent = CSS; document.head.append(style);
  }
  let layer = document.querySelector('.academy-celebrate');
  if (!layer) { layer = document.createElement('div'); layer.className = 'academy-celebrate'; layer.setAttribute('aria-hidden', 'true'); }
  // A modal dialog lives in the top layer, so the burst must join it to stay visible.
  const host = [...document.querySelectorAll('dialog[open]')].at(-1) || document.body;
  if (layer.parentNode !== host) host.append(layer);
  return layer;
}

/**
 * Shows a celebration. Returns the number of confetti pieces created.
 * x/y are viewport fractions (0-1) for where the burst starts.
 */
export function celebrate({ text = '', kind = 'star', x = 0.5, y = 0.42, pieces = 26, big = false, sound = true } = {}) {
  if (sound) playChime(kind);
  const layer = ensureLayer();
  if (!layer) return 0;
  while (layer.childElementCount > 120) layer.firstElementChild.remove();
  const px = `${Math.round(x * 100)}%`, py = `${Math.round(y * 100)}%`;
  const created = [];
  for (let i = 0; i < pieces; i++) {
    const piece = document.createElement('i');
    const angle = (i / pieces) * Math.PI * 2 + Math.random() * 0.4, distance = 90 + Math.random() * (big ? 220 : 140);
    piece.className = `academy-confetti${i % 3 === 0 ? ' round' : ''}`;
    piece.style.cssText = `--x:${px};--y:${py};--c:${CONFETTI_COLORS[i % CONFETTI_COLORS.length]};--dx:${Math.round(Math.cos(angle) * distance)}px;--dy:${Math.round(Math.sin(angle) * distance + 60)}px;--r:${Math.round(Math.random() * 720 - 360)}deg`;
    created.push(piece);
  }
  if (text) {
    layer.querySelectorAll('.academy-sticker').forEach(old => old.remove());
    const sticker = document.createElement('div');
    sticker.className = `academy-sticker${big ? ' big' : ''}`;
    sticker.style.cssText = `--x:${px};--y:${py}`;
    sticker.innerHTML = `<b>${kind === 'station' ? '🎉' : kind === 'finish' ? '🏆' : '⭐'}</b><span></span>`;
    sticker.querySelector('span').textContent = text;
    created.push(sticker);
  }
  layer.append(...created);
  setTimeout(() => created.forEach(node => node.remove()), 1700);
  return pieces;
}
