import '@fontsource/barlow-condensed/latin-600.css';
import './home.css';
import './shared/bootstrap.js';
import { readSettings, updateSettings, subscribeSettings } from './shared/settings.js';
import { readRewards, subscribeRewards, totalStars } from './shared/rewards.js';
import { isNativeBuild } from './shared/native.js';
import { LobbyMusic } from './shared/lobby-music.js';
import { installSafetyLesson } from './shared/safety-ui.js';
import { installAcademy } from './shared/academy-ui.js';
import { readRoom, roomLevel, setAgeBand } from './games/math/room-store.js';
import { t, bindLocalized, localize, onLanguageChange } from './shared/i18n.js';
import { createLanguageToggle, createLanguageSetting } from './shared/language-ui.js';
installSafetyLesson();
installAcademy();
import {installContentLessons} from './shared/content-r1-ui.js';
installContentLessons();
const $ = id => document.getElementById(id);
// R50: 「中文／English」 at the top of the home page and again in Parent Settings.
document.querySelector('.home-header .header-tools').before(createLanguageToggle());
$('family-title').after(createLanguageSetting());
function showSettings(value = readSettings()) {
  $('child-mode').checked = value.childMode;
  $('family-sound').checked = !value.muted;
  $('family-quality').value = value.quality;
  $('family-badge').textContent = t(value.childMode ? '幼兒模式 · 3～5 歲' : '家長模式 · 完整操作');
  $('math-age').value = roomLevel(readRoom(), value);
}
let shownTotal = null;
function showRewards(rewards = readRewards()) {
  const total = totalStars(rewards);
  $('star-total').textContent = total;
  $('star-shelf').setAttribute('aria-label', t('收集到 {n} 顆星星', { n: total }));
  document.querySelectorAll('[data-mode-stars]').forEach(badge => { badge.textContent = `⭐ ${rewards[badge.dataset.modeStars] || 0}`; });
  if (shownTotal !== null && total > shownTotal) { const shelf = $('star-shelf'); shelf.classList.remove('bump'); void shelf.offsetWidth; shelf.classList.add('bump'); }
  shownTotal = total;
}
$('home-settings').onclick = () => { showSettings(); $('family-dialog').showModal(); };
$('child-mode').onchange = event => updateSettings({ childMode: event.target.checked });
$('family-sound').onchange = event => updateSettings({ muted: !event.target.checked });
$('family-quality').onchange = event => updateSettings({ quality: event.target.value });
// R48: math room age band (3～4／5～6／7～8). Until a parent picks one it follows child mode.
$('math-age').onchange = event => setAgeBand(event.target.value);
document.addEventListener('academy:open-family-settings', () => { showSettings(); $('family-dialog').showModal(); });
subscribeSettings(showSettings); showSettings();
subscribeRewards(showRewards); showRewards();
addEventListener('pageshow', () => showRewards());
addEventListener('studentchange', () => showRewards());

const music = new LobbyMusic($('music-toggle'));
void music.init();
window.__lobbyMusic = music;
subscribeSettings(value => music.setMuted(value.muted));
onLanguageChange(() => { showSettings(); showRewards(); music.sync(); });

let installation;
if(!isNativeBuild())addEventListener('beforeinstallprompt', event => { event.preventDefault(); installation = event; $('install-app').hidden = false; });
$('install-app').hidden=true;$('install-app').onclick = async () => { if(!isNativeBuild())await installation?.prompt(); $('install-app').hidden = true; };

import {installArt} from "./shared/art-refresh.js";
installArt();
import './shared/art-refresh.css';
// R50: the page's own text (index.html) switches language in place; progress is untouched.
bindLocalized(document.querySelector('.academy-home'));
bindLocalized($('family-dialog'));
// The coast-practice button redraws itself on progress changes; keep its words in the chosen language.
addEventListener('studentchange', () => localize($('content-start')));
