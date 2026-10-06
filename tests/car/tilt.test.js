import test from 'node:test';
import assert from 'node:assert/strict';
import { screenTilt, tiltSteering, smoothSteering, combineSteering, TiltController } from '../../src/games/car/tilt.js';

test('screen rotation maps portrait gamma and landscape beta into consistent right/left steering', () => {
  assert.equal(screenTilt(20, 10, 0), 10);
  assert.ok(Math.abs(screenTilt(20, 10, 90) - 20) < 1e-10);
  assert.ok(Math.abs(screenTilt(20, 10, -90) + 20) < 1e-10);
  assert.ok(Math.abs(screenTilt(20, 10, 180) + 10) < 1e-10);
  assert.ok(screenTilt(0, 25, 0) > 0, 'rightward portrait tilt is positive, same as the right touch button');
});

test('calibration, deadzone, full lock and wrapped angles are bounded without NaN', () => {
  assert.equal(tiltSteering(12, 12), 0);
  assert.equal(tiltSteering(15, 12), 0);
  assert.equal(tiltSteering(37, 12), 1);
  assert.equal(tiltSteering(-13, 12), -1);
  assert.equal(tiltSteering(500, 0), 1);
  assert.equal(tiltSteering(-179, 179), 0, 'a two-degree wrap is inside the deadzone');
  assert.equal(screenTilt(null, 0), null);
  assert.equal(screenTilt(0, NaN), null);
  assert.equal(tiltSteering(NaN), 0);
  assert.equal(tiltSteering(25, 0, 3, 3), 0);
});

test('steering smoothing responds equally at different update rates', () => {
  const single = smoothSteering(0, 1, 0.2);
  let stepped = 0;
  for (let i = 0; i < 20; i++) stepped = smoothSteering(stepped, 1, 0.01);
  assert.ok(Math.abs(single - stepped) < 1e-12);
  assert.equal(smoothSteering(NaN, NaN, 1), 0);
  assert.equal(smoothSteering(0.5, 1, -1), 0.5);
});

test('touch and keyboard steering overrides tilt, including opposing buttons', () => {
  assert.equal(combineSteering(true, false, true, 1), -1);
  assert.equal(combineSteering(false, true, true, -1), 1);
  assert.equal(combineSteering(true, true, true, 1), 0);
  assert.equal(combineSteering(false, false, true, 0.4), 0.4);
  assert.equal(combineSteering(false, false, false, 0.4), 0);
});

function fakeHost(permission) {
  const host = new EventTarget(), orientation = new EventTarget(); orientation.angle = 0;
  let clock = 0, nextId = 0;
  const frames = new Map(), timers = new Map();
  host.screen = { orientation }; host.isSecureContext = true;
  host.DeviceOrientationEvent = permission === undefined ? function Orientation() {} : { requestPermission: permission };
  host.performance = { now: () => clock };
  host.requestAnimationFrame = callback => { const id = ++nextId; frames.set(id, callback); return id; };
  host.cancelAnimationFrame = id => frames.delete(id);
  host.setTimeout = (callback, delay) => { const id = ++nextId; timers.set(id, { callback, at: clock + delay }); return id; };
  host.clearTimeout = id => timers.delete(id);
  host.advance = ms => {
    clock += ms;
    for (const [id, entry] of [...timers]) if (entry.at <= clock) { timers.delete(id); entry.callback(); }
    for (const [id, callback] of [...frames]) { frames.delete(id); callback(clock); }
  };
  host.sample = (beta, gamma) => {
    const event = new Event('deviceorientation'); Object.assign(event, { beta, gamma }); host.dispatchEvent(event);
  };
  return host;
}

test('controller waits for real values, calibrates and applies only fresh running samples', async () => {
  const host = fakeHost(), notices = [];
  const tilt = new TiltController({ host, onNotice: text => notices.push(text) });
  await tilt.enable(); assert.equal(tilt.getState().ready, false);
  host.sample(null, null); assert.equal(tilt.getState().ready, false);
  host.sample(0, 8); assert.equal(tilt.neutral, 8); assert.equal(tilt.getState().ready, true);
  host.sample(0, 35); host.advance(100); assert.equal(tilt.steer, 0, 'menu samples cannot steer');
  tilt.setActive(true); host.advance(100); assert.equal(tilt.steer, 0, 'resume waits for another sensor event');
  host.sample(0, 35); host.advance(100); assert.ok(tilt.steer > 0);
  tilt.setActive(false); assert.equal(tilt.steer, 0);
  tilt.setActive(true); host.advance(100); assert.equal(tilt.steer, 0);
  host.sample(0, 35); host.advance(100); host.advance(100); assert.ok(tilt.steer > 0);
  assert.equal(tilt.calibrate(), true); assert.equal(tilt.steer, 0); assert.equal(tilt.neutral, 35);
  host.advance(700); assert.equal(tilt.steer, 0, 'stale sensor data releases steering');
  tilt.disable(); assert.equal(tilt.enabled, false); assert.equal(tilt.steer, 0);
  assert.ok(notices.some(text => text.includes('回正')));
});

test('permission denial, unavailable hardware and insecure pages never report ready', async () => {
  let called = 0;
  const deniedHost = fakeHost(() => { called++; return Promise.resolve('denied'); });
  const denied = new TiltController({ host: deniedHost });
  const result = denied.enable(); assert.equal(called, 1, 'requestPermission is called before the first await');
  assert.equal(await result, false); assert.equal(denied.status, 'denied'); assert.equal(denied.enabled, false);
  const noSamplesHost = fakeHost(), noSamples = new TiltController({ host: noSamplesHost });
  await noSamples.enable(); noSamplesHost.advance(5001);
  assert.equal(noSamples.status, 'unavailable'); assert.equal(noSamples.getState().ready, false);
  const httpHost = fakeHost(); httpHost.isSecureContext = false;
  const http = new TiltController({ host: httpHost });
  assert.equal(await http.enable(), false); assert.equal(http.status, 'insecure');
});

test('rotating the screen recalibrates the next sample without another permission request', async () => {
  let requests = 0;
  const host = fakeHost(async () => { requests++; return 'granted'; });
  const tilt = new TiltController({ host }); await tilt.enable(); host.sample(0, 8);
  host.screen.orientation.angle = 90; host.screen.orientation.dispatchEvent(new Event('change'));
  assert.equal(tilt.neutral, null); assert.equal(tilt.status, 'waiting');
  host.sample(14, 1); assert.ok(Math.abs(tilt.neutral - 14) < 1e-10);
  assert.equal(requests, 1); tilt.dispose();
});
