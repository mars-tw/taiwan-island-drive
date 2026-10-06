import '@fontsource/barlow-condensed/latin-600.css';
import './home.css';
import './shared/bootstrap.js';
import { readSettings, updateSettings, subscribeSettings } from './shared/settings.js';
import { isNativeBuild } from './shared/native.js';
const $ = id => document.getElementById(id);
function showSettings(value = readSettings()) {
  $('child-mode').checked = value.childMode;
  $('family-sound').checked = !value.muted;
  $('family-quality').value = value.quality;
  $('family-badge').textContent = value.childMode ? '幼兒模式 · 3～5 歲' : '家長模式 · 完整操作';
}
$('home-settings').onclick = () => { showSettings(); $('family-dialog').showModal(); };
$('child-mode').onchange = event => updateSettings({ childMode: event.target.checked });
$('family-sound').onchange = event => updateSettings({ muted: !event.target.checked });
$('family-quality').onchange = event => updateSettings({ quality: event.target.value });
subscribeSettings(showSettings); showSettings();
let installation;
if(!isNativeBuild())addEventListener('beforeinstallprompt', event => { event.preventDefault(); installation = event; $('install-app').hidden = false; });
$('install-app').hidden=true;$('install-app').onclick = async () => { if(!isNativeBuild())await installation?.prompt(); $('install-app').hidden = true; };
