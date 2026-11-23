// R48 B line TEMPORARY entry (train page → 路線／課程 → 火車謎題與數學（試玩）).
// When the math room lands, the room calls openRailPlay(id, { age }) and this file plus
// trial-entry.css and the one button in train/index.html are removed.
import './trial-entry.css';
import { RAIL_PLAY_GAMES } from './index.js';
import { AGE_BANDS, AGE_LABELS, ageFromSettings } from './common.js';
import { readSettings } from '../../shared/settings.js';

export function installRailPlayTrial(doc = document) {
  const opener = doc.getElementById('rail-play-trial');
  if (!opener) return null;
  let age = ageFromSettings(readSettings());
  const picker = doc.createElement('dialog');
  picker.id = 'rail-play-trial-dialog'; picker.setAttribute('aria-labelledby', 'rail-play-trial-title');
  doc.body.append(picker);
  function render() {
    picker.innerHTML = `<header><h2 id="rail-play-trial-title">火車謎題與數學（試玩）</h2><button type="button" class="trial-close" aria-label="關閉">×</button></header>
      <div class="trial-ages" role="group" aria-label="年齡">${AGE_BANDS.map(a => `<button type="button" data-age="${a}" aria-pressed="${a === age}">${AGE_LABELS[a]}</button>`).join('')}</div>
      ${['拼搭與方向', '數學'].map(room => `<section><h3>${room}</h3><div class="trial-games">${RAIL_PLAY_GAMES.filter(g => g.room === room).map(g => `<button type="button" data-game="${g.id}"><b><span aria-hidden="true">${g.icon}</span> ${g.title}</b><small>${g.blurb}</small></button>`).join('')}</div></section>`).join('')}
      <p class="trial-note">試玩入口：之後會搬進「數學遊戲室」。不計時，可以一直重來。</p>`;
    picker.querySelector('.trial-close').onclick = () => picker.close();
    picker.querySelectorAll('[data-age]').forEach(b => { b.onclick = () => { age = b.dataset.age; render(); picker.querySelector(`[data-age="${age}"]`).focus(); }; });
    picker.querySelectorAll('[data-game]').forEach(b => {
      b.onclick = () => RAIL_PLAY_GAMES.find(g => g.id === b.dataset.game).open({ age, onClose: () => picker.querySelector(`[data-game="${b.dataset.game}"]`)?.focus() });
    });
  }
  opener.addEventListener('click', () => { render(); picker.showModal(); picker.querySelector('[aria-pressed="true"]')?.focus(); });
  return picker;
}
if (typeof document !== 'undefined') installRailPlayTrial();
