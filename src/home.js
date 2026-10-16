import '@fontsource/barlow-condensed/latin-600.css';
import './home.css';
import './shared/bootstrap.js';
import { readSettings, updateSettings, subscribeSettings } from './shared/settings.js';
import { readRewards, subscribeRewards, totalStars } from './shared/rewards.js';
import { isNativeBuild } from './shared/native.js';
import { LobbyMusic } from './shared/lobby-music.js';
import { installSafetyLesson } from './shared/safety-ui.js';
import { installAcademy } from './shared/academy-ui.js';
installSafetyLesson();
installAcademy();
const $ = id => document.getElementById(id);
function showSettings(value = readSettings()) {
  $('child-mode').checked = value.childMode;
  $('family-sound').checked = !value.muted;
  $('family-quality').value = value.quality;
  $('family-badge').textContent = value.childMode ? '幼兒模式 · 3～5 歲' : '家長模式 · 完整操作';
}
let shownTotal = null;
function showRewards(rewards = readRewards()) {
  const total = totalStars(rewards);
  $('star-total').textContent = total;
  $('star-shelf').setAttribute('aria-label', `收集到 ${total} 顆星星`);
  document.querySelectorAll('[data-mode-stars]').forEach(badge => { badge.textContent = `⭐ ${rewards[badge.dataset.modeStars] || 0}`; });
  if (shownTotal !== null && total > shownTotal) { const shelf = $('star-shelf'); shelf.classList.remove('bump'); void shelf.offsetWidth; shelf.classList.add('bump'); }
  shownTotal = total;
}
$('home-settings').onclick = () => { showSettings(); $('family-dialog').showModal(); };
$('child-mode').onchange = event => updateSettings({ childMode: event.target.checked });
$('family-sound').onchange = event => updateSettings({ muted: !event.target.checked });
$('family-quality').onchange = event => updateSettings({ quality: event.target.value });
subscribeSettings(showSettings); showSettings();
subscribeRewards(showRewards); showRewards();
addEventListener('pageshow', () => showRewards());
addEventListener('studentchange', () => showRewards());

const music = new LobbyMusic($('music-toggle'));
void music.init();
window.__lobbyMusic = music;
subscribeSettings(value => music.setMuted(value.muted));

let installation;
if(!isNativeBuild())addEventListener('beforeinstallprompt', event => { event.preventDefault(); installation = event; $('install-app').hidden = false; });
$('install-app').hidden=true;$('install-app').onclick = async () => { if(!isNativeBuild())await installation?.prompt(); $('install-app').hidden = true; };

import {installArt} from "./shared/art-refresh.js";
installArt();
import './shared/art-refresh.css';
