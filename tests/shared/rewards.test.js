import test from 'node:test';
import assert from 'node:assert/strict';
import { addStars, readRewards, recordBest, starRating, totalStars, normalizeRewards, subscribeRewards, resetRewardsForTest } from '../../src/shared/rewards.js';
import { chimeNotes, playChime, celebrate, CHIMES } from '../../src/shared/celebrate.js';
import { shouldPlayMusic, isAudioResponse } from '../../src/shared/lobby-music.js';

test('shared stars add up per mode, ignore bad input and survive missing storage', () => {
  resetRewardsForTest();
  let seen;
  const stop = subscribeRewards(value => { seen = value; });
  addStars('car', 3); addStars('train'); addStars('flight', 2);
  addStars('boat', 5); addStars('car', -4); addStars('car', 'x');
  const rewards = readRewards();
  assert.deepEqual([rewards.car, rewards.train, rewards.flight], [3, 1, 2]);
  assert.equal(totalStars(rewards), 6);
  assert.equal(seen.car, 3);
  stop(); resetRewardsForTest();
  assert.equal(totalStars(readRewards()), 0);
});

test('best ratings only improve and are capped at three stars', () => {
  resetRewardsForTest();
  assert.equal(recordBest('car:coast', 2), true);
  assert.equal(recordBest('car:coast', 1), false);
  assert.equal(recordBest('car:coast', 9), true);
  assert.equal(readRewards().best['car:coast'], 3);
  assert.deepEqual(normalizeRewards({ car: -2, train: 'a', best: { x: 7 } }), { car: 0, train: 0, flight: 0, best: { x: 3 } });
  resetRewardsForTest();
});

test('finishing always earns at least one star; collecting most stars earns three', () => {
  assert.equal(starRating(0, 12), 1);
  assert.equal(starRating(5, 12), 2);
  assert.equal(starRating(9, 12), 3);
  assert.equal(starRating(3, 0), 1);
});

test('celebration chimes are rising major-chord notes and respect mute', () => {
  for (const kind of Object.keys(CHIMES)) {
    const notes = chimeNotes(kind);
    assert.ok(notes.length >= 1);
    for (let i = 1; i < notes.length; i++) {
      assert.ok(notes[i].frequency > notes[i - 1].frequency);
      assert.ok(notes[i].at >= notes[i - 1].at);
    }
  }
  assert.deepEqual(chimeNotes('unknown'), chimeNotes('star'));
  const started = [];
  class FakeContext {
    constructor() { this.currentTime = 0; this.state = 'running'; this.destination = {}; }
    createOscillator() { return { frequency: { setValueAtTime: f => started.push(f) }, connect() {}, start() {}, stop() {}, disconnect() {} }; }
    createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
  }
  globalThis.AudioContext = FakeContext;
  assert.equal(playChime('station', { muted: true }), 0);
  assert.equal(started.length, 0);
  assert.equal(playChime('station', { muted: false }), 3);
  assert.deepEqual(started, CHIMES.station.map(([f]) => f));
  assert.equal(celebrate({ text: 'x', sound: false }), 0, 'no DOM in node: no confetti, no crash');
  delete globalThis.AudioContext;
});

test('lobby music needs sound on, family consent and a real audio file', () => {
  assert.equal(shouldPlayMusic({ muted: false, preference: 'on' }), true);
  assert.equal(shouldPlayMusic({ muted: true, preference: 'on' }), false);
  assert.equal(shouldPlayMusic({ muted: false, preference: 'off' }), false);
  const response = type => ({ ok: true, headers: { get: () => type } });
  assert.equal(isAudioResponse(response('audio/mp4')), true);
  assert.equal(isAudioResponse(response('text/html')), false, 'SPA fallback page is not music');
  assert.equal(isAudioResponse({ ok: false, headers: { get: () => 'audio/mp4' } }), false);
});
