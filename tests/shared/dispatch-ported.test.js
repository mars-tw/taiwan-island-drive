// Adapted from Taiwan Train Math tests/dispatch.test.mjs; Apache-2.0, Copyright 2026 mars-tw.
import test from 'node:test';
import assert from 'node:assert/strict';
import {dispatchLesson, dispatchAction, normalizeDispatch} from '../../src/games/math/dispatch.js';
const step = (s, a, level) => dispatchAction(s, a, level).state;
test('all age lessons conserve passengers, require three goals, retry freely and award once', () => {
  for(const level of ['small','medium','large']) {
    let s=normalizeDispatch();
    for(let cycle=0;cycle<12;cycle++) {
      s=step(s,'start',level); const q=dispatchLesson(level,cycle);
      assert.ok(q.capacity>=q.total, 'every passenger has a visible seat');
      s=step(s,'check'); assert.equal(s.active.phase,'intro');
      s=step(s,'learn');s=step(s,'check'); assert.equal(s.active.phase,'load');
      for(let n=0;n<q.total;n++)s=step(s,'add');
      s=step(s,'add');assert.equal(s.active.front,q.total);
      s=step(s,'check');assert.equal(s.active.phase,'split');
      s=step(s,'to-rear');s=step(s,'to-front');assert.equal(s.active.front+s.active.rear,q.total);
      for(let n=0;n<q.rear;n++) {s=step(s,'to-rear');assert.equal(s.active.front+s.active.rear,q.total);}
      s=step(s,'check');assert.equal(s.active.phase,'subtract');
      s=step(s,`answer:${q.front+1}`);assert.equal(s.active.phase,'subtract');
      s=step(s,`answer:${q.front}`);assert.equal(s.active.phase,'done');assert.equal(s.completed,cycle+1);
      s=step(s,`answer:${q.front}`);assert.equal(s.completed,cycle+1);
      assert.deepEqual(normalizeDispatch(JSON.parse(JSON.stringify(s))),s);
    }
  }
});
