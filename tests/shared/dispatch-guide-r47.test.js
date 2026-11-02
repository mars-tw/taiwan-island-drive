import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dispatchGuide } from '../../src/shared/dispatch-guide-r47.js';
import { dispatchAction, dispatchLesson } from '../../src/games/math/dispatch.js';

const read = name => readFileSync(new URL(`../../${name}`, import.meta.url), 'utf8');

function play(actions) {
  let state = null, message = '';
  for (const action of actions) ({ state, message } = dispatchAction(state, action, 'small'));
  return { a: state.active, message };
}

test('R47 load phase glows exactly one next button: add until full, then the go button', () => {
  assert.equal(dispatchGuide({ phase: 'load', front: 0, total: 5 }).nextStep, 'add');
  assert.equal(dispatchGuide({ phase: 'load', front: 4, total: 5 }).nextStep, 'add');
  assert.equal(dispatchGuide({ phase: 'load', front: 5, total: 5 }).nextStep, 'check');
  for (const phase of ['intro', 'split', 'subtract', 'done']) assert.equal(dispatchGuide({ phase, front: 2, total: 5 }).nextStep, null);
});

test('R47 a too-early load check is a visible retry that repeats the lesson message unchanged', () => {
  const { a, message } = play(['start', 'learn', 'add', 'add', 'check']);
  assert.equal(a.phase, 'load');
  const guide = dispatchGuide({ phase: a.phase, action: 'check', message, front: a.front, total: 5 });
  assert.equal(guide.retry, true);
  assert.equal(guide.cue, '現在有 2 人，還需要 3 人。');
});

test('R47 a wrong split check and a wrong subtraction answer are retries; the lesson state is untouched', () => {
  const total = dispatchLesson('small', 0).total, rear = dispatchLesson('small', 0).rear;
  const load = ['start', 'learn', ...Array(total).fill('add'), 'check'];
  const split = play([...load, 'to-rear', 'to-rear', 'check']);
  assert.equal(split.a.phase, 'split');
  assert.equal(split.a.front + split.a.rear, total, 'moving passengers never changes the total');
  const g1 = dispatchGuide({ phase: 'split', action: 'check', message: split.message });
  assert.equal(g1.retry, true);
  assert.equal(g1.cue, `後車廂現在 2 人，請分成 ${rear} 人。總數仍是 ${total} 人。`);
  const sub = play([...load, ...Array(rear).fill('to-rear'), 'check', `answer:${total - rear + 1}`]);
  assert.equal(sub.a.phase, 'subtract');
  assert.equal(dispatchGuide({ phase: 'subtract', action: `answer:${total - rear + 1}`, message: sub.message }).retry, true);
});

test('R47 successful steps and plain taps are never shown as retries', () => {
  assert.equal(dispatchGuide({ phase: 'split', action: 'check', message: '' }).retry, false);
  assert.equal(dispatchGuide({ phase: 'subtract', action: 'check', message: '後車廂留在小站，看看前車廂還有幾人。' }).retry, false);
  assert.equal(dispatchGuide({ phase: 'done', action: 'answer:4', message: '三站完成！' }).retry, false);
  assert.equal(dispatchGuide({ phase: 'load', action: 'add', message: '再看看車廂裡的人數，慢慢來。' }).retry, false);
  assert.equal(dispatchGuide({ phase: 'split', action: 'to-rear', message: '再看看車廂裡的人數，慢慢來。' }).retry, false);
});

test('R47 academy UI wires the guide, and the motion respects reduced-motion', () => {
  const ui = read('src/shared/academy-ui.js');
  assert.match(ui, /import \{dispatchGuide\} from '\.\/dispatch-guide-r47\.js'/);
  assert.match(ui, /import '\.\/dispatch-guide-r47\.css'/);
  assert.match(ui, /guide\.retry\)\{cue\.textContent=guide\.cue;coach\.classList\.add\('is-retry'\)/);
  assert.match(ui, /nextStep==='add'\)\{[^}]*not-ready[^}]*next-step/);
  const css = read('src/shared/dispatch-guide-r47.css');
  assert.match(css, /button\.not-ready:last-child\{background:#fff!important/);
  const motion = css.slice(css.indexOf('prefers-reduced-motion:no-preference'));
  assert.ok(css.indexOf('animation:') > css.indexOf('prefers-reduced-motion:no-preference'), 'animations only inside the no-preference block');
  assert.match(motion, /r47-next-glow/);
  assert.match(css, /max-height:520px\) and \(orientation:landscape\)[\s\S]*is-retry\{display:flex!important/);
});
