// R48 B line: SVG drawing helpers. Trains and cars reuse the academy art (train-side, carriage shells);
// only rails, plates and signs are drawn as simple map symbols.
import { svgEl, artUrl } from './rail-shell.js';
import { RAIL_COLORS } from './common.js';

export const TRAIN_RATIO = 809 / 1942; // content-r3/train-side.webp height / width
export const TRAIN_TOP_RATIO = 135 / 640; // r49/train-top.webp height / width (seen from above, nose to the right)

/** Rail bed: ballast, sleepers, two rails. Returns the group. */
export function drawTrack(parent, d, { lit = false, dim = false, width = 1 } = {}) {
  const g = svgEl('g', { class: `rp-track${lit ? ' is-lit' : ''}${dim ? ' is-dim' : ''}` }, parent);
  if (lit) svgEl('path', { d, class: 'rp-track-glow', 'stroke-width': 50 * width }, g);
  svgEl('path', { d, class: 'rp-track-bed', 'stroke-width': 34 * width }, g);
  svgEl('path', { d, class: 'rp-track-ties', 'stroke-width': 28 * width, 'stroke-dasharray': `${7 * width} ${9 * width}` }, g);
  svgEl('path', { d, class: 'rp-track-rail', 'stroke-width': 17 * width }, g);
  svgEl('path', { d, class: 'rp-track-gap', 'stroke-width': 10 * width }, g);
  return g;
}

export function shapePath(shape, r) {
  if (shape === 'triangle') return `M0 ${-r} L${r * 0.95} ${r * 0.72} L${-r * 0.95} ${r * 0.72}Z`;
  if (shape === 'square') return `M${-r * 0.78} ${-r * 0.78}H${r * 0.78}V${r * 0.78}H${-r * 0.78}Z`;
  if (shape === 'star') {
    let d = '';
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; d += `${i ? 'L' : 'M'}${(Math.cos(a) * rr).toFixed(1)} ${(Math.sin(a) * rr).toFixed(1)}`; }
    return `${d}Z`;
  }
  return `M${-r * 0.85} 0a${r * 0.85} ${r * 0.85} 0 1 0 ${r * 1.7} 0a${r * 0.85} ${r * 0.85} 0 1 0 ${-r * 1.7} 0Z`;
}
/** Round white plate with a coloured shape: the sign language shared by trains and platforms. */
export function drawPlate(parent, x, y, r, color, shape, className = '') {
  const g = svgEl('g', { class: `rp-plate ${className}`.trim(), transform: `translate(${x} ${y})` }, parent);
  svgEl('circle', { r, class: 'rp-plate-back' }, g);
  svgEl('path', { d: shapePath(shape, r * 0.62), fill: RAIL_COLORS[color].hex, class: 'rp-plate-shape' }, g);
  return g;
}

/** A short carriage made from the two ends of the academy carriage art. */
export function drawCar(parent, x, y, w, color) {
  const art = RAIL_COLORS[color]?.art === 'orange' ? 'carOrange' : 'carBlue', url = artUrl(art), h = w * 0.36, half = w / 2;
  const g = svgEl('g', { class: 'rp-car', filter: RAIL_COLORS[color]?.art === 'orange' ? null : `url(#rp-hue-${color})` }, parent);
  const left = svgEl('svg', { x, y, width: half + 0.5, height: h, viewBox: '0 0 200 144', preserveAspectRatio: 'none' }, g);
  svgEl('image', { href: url, width: 768, height: 144 }, left);
  const right = svgEl('svg', { x: x + half, y, width: half, height: h, viewBox: '568 0 200 144', preserveAspectRatio: 'none' }, g);
  svgEl('image', { href: url, width: 768, height: 144 }, right);
  return g;
}

/**
 * A train facing +x. anchor 'front' puts the nose at (0,0); 'center' centres the whole consist.
 * Extra cars (beyond the two-car unit in the art) are coupled behind the engine.
 * view 'top' (R49) draws the two-car unit seen from straight above, so it sits on a map track the right way
 * whichever way the board turns (the side art turned 90° looked like a train lying beside the rails).
 */
export function drawTrain(parent, { color = 'blue', length = 170, extraCars = 0, anchor = 'front', className = '', view = 'side' } = {}) {
  if (view === 'top') {
    const g = svgEl('g', { class: `rp-train is-top ${className}`.trim() }, parent);
    const body = svgEl('g', { class: 'rp-train-body' }, g);
    const h = length * TRAIN_TOP_RATIO, front = anchor === 'front' ? 0 : length / 2;
    svgEl('image', { href: artUrl('trainTop'), x: front - length, y: -h / 2, width: length, height: h, filter: `url(#rp-hue-${color})`, preserveAspectRatio: 'none' }, body);
    g.dataset.length = String(length);
    return g;
  }
  const g = svgEl('g', { class: `rp-train ${className}`.trim() }, parent);
  const body = svgEl('g', { class: 'rp-train-body' }, g);
  const h = length * TRAIN_RATIO, carW = length * 0.52, total = length + extraCars * (carW + 2);
  const front = anchor === 'front' ? 0 : total / 2;
  for (let i = 0; i < extraCars; i++) drawCar(body, front - length - (i + 1) * (carW + 2), h * 0.47 - carW * 0.36, carW, color);
  svgEl('image', { href: artUrl('train'), x: front - length, y: -h / 2, width: length, height: h, filter: `url(#rp-hue-${color})`, preserveAspectRatio: 'none' }, body);
  g.dataset.length = String(total);
  return g;
}

/** Simple colour-light signal (red / green) drawn as a map symbol beside the track. */
export function drawSignal(parent, x, y, aspect, size = 1) {
  const g = svgEl('g', { class: `rp-signal is-${aspect}`, transform: `translate(${x} ${y}) scale(${size})` }, parent);
  svgEl('rect', { x: -14, y: -30, width: 28, height: 52, rx: 9, class: 'rp-signal-head' }, g);
  svgEl('circle', { cx: 0, cy: -16, r: 9, class: 'rp-lamp-red' }, g);
  svgEl('circle', { cx: 0, cy: 8, r: 9, class: 'rp-lamp-green' }, g);
  return g;
}

/** Path string from abstract segments, mapped through to(u, v) -> [x, y]. */
export function segmentsToPath(segments, map) {
  return segments.map(s => {
    const [x, y] = map(...s.to);
    if (s.type === 'M') return `M${x.toFixed(1)} ${y.toFixed(1)}`;
    if (s.type === 'L') return `L${x.toFixed(1)} ${y.toFixed(1)}`;
    const [ax, ay] = map(...s.c1), [bx, by] = map(...s.c2);
    return `C${ax.toFixed(1)} ${ay.toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
}
