import {boardingScene as baseBoardingScene} from './content-r35-scene.js';
import {STAND_HOLD_SECONDS} from './content-r35.js';

export function boardingSceneR43(g) {
  const frames = baseBoardingScene(g);
  const stable = g.kind === 'tickets'
    && g.phase === 'boarding'
    && g.doorStage === 'boarding'
    && g.escortWaiting
    && g.escortStable >= STAND_HOLD_SECONDS
    && g.escortBump <= 0;
  if (!stable) return frames;
  return Object.freeze(frames.map(frame => frame.current && frame.surface === 'threshold'
    ? Object.freeze({...frame, pose: 'steady'})
    : frame));
}
