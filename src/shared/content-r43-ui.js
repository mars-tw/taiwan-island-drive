import {PASSENGER_NAMES} from './content-r35.js';
import {boardingSceneR43} from './content-r43-scene.js';
import {t, isEnglish, localize} from './i18n.js';

export function renderR43({g, cabin, scene, image}) {
  scene.dataset.r43Full = 'false';
  cabin.dataset.r43Full = 'false';
  cabin.dataset.r43Portrait = 'false';
  if (g.kind === 'tickets' && !cabin.hidden) {
    const frames = boardingSceneR43(g);
    for (const frame of frames) {
      if (frame.pose !== 'steady') continue;
      const target = cabin.querySelector(`.r32-cabin-friend[data-cabin-friend="${frame.index}"]`);
      const current = target?.querySelector('img');
      if (!current) continue;
      target.dataset.pose = 'steady';
      current.outerHTML = image(
        `art/content-r43/passenger-${frame.index + 1}-steady.png`,
        t('{name}雙腳張開站穩', {name: t(PASSENGER_NAMES[frame.index])}),
      );
    }
    const queue = cabin.querySelector('.r35-queue');
    const empty = !!queue && !queue.querySelector('button');
    const full = frames.filter(frame => frame.seated).length === 3;
    const portrait = full && cabin.clientHeight / Math.max(1,cabin.clientWidth) >= 1.4;
    if (queue) queue.dataset.empty = String(empty);
    cabin.dataset.r43Full = String(full);
    scene.dataset.r43Full = String(full);
    cabin.dataset.r43Portrait = String(portrait);
    if (full) {
      const art = cabin.querySelector('.r32-cabin-art>img');
      if (art) art.outerHTML = image(`art/content-r43/train-cabin-${portrait?'portrait':'compact'}.webp`,t('三位朋友各坐一席的緊湊車廂內景'));
    }
  }
  // R50: R35 modules are SHA256-locked by R38; localize rendered DOM in English mode here.
  if (isEnglish()) {
    localize(scene);
    const work = scene.closest?.('#content-r1')?.querySelector('.content-work');
    if (work) localize(work);
  }
}
