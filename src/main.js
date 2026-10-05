import './styles.css';
import '@fontsource/barlow-condensed/latin-500.css';
import '@fontsource/barlow-condensed/latin-600.css';
import '@fontsource/barlow-condensed/latin-700.css';
import '@fontsource/barlow-condensed/latin-800.css';
import { MAPS, VEHICLES, COLORS, TRACK_LENGTH } from './config.js';
import { Game } from './game.js';
import { roadCenter } from './physics.js';
import { TiltController, combineSteering } from './tilt.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const base = import.meta.env.BASE_URL;
const storage = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem(`island-drive:${key}`)) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(`island-drive:${key}`, JSON.stringify(value)); } catch { /* Private browsing can disable storage. */ } }
};
const saved = storage.get('preferences', {});
let mapId = MAPS.some(m => m.id === saved.map) ? saved.map : 'coast';
let vehicleId = VEHICLES.some(v => v.id === saved.vehicle) ? saved.vehicle : 'coupe';
let paint = COLORS.includes(saved.paint) ? saved.paint : COLORS[0];
let mode = saved.mode === 'timeattack' ? 'timeattack' : 'cruise';
let quality = saved.quality === 'low' ? 'low' : 'high';
let muted = saved.muted !== false;
let ready = false;
let busy = false;
let pending = Promise.resolve();
let pendingCount = 0;
let lastState = { phase: 'menu', distance: 0, speed: 0, boost: 1 };
let toastTimer;
const pressedKeys = new Set();
const pointers = new Map();
const records = storage.get('records', {});
const currentMap = () => MAPS.find(m => m.id === mapId);
const currentVehicle = () => VEHICLES.find(v => v.id === vehicleId);
const persist = () => storage.set('preferences', { map: mapId, vehicle: vehicleId, paint, mode, quality, muted });

function mapArt(id) {
  const common = 'viewBox="0 0 240 92" aria-hidden="true"';
  if (id === 'coast') return `<svg ${common}><rect width="240" height="92" fill="#c9e5e7"/><path d="M0 37h240v55H0" fill="#6bb7c2"/><path d="M0 4 68 26l26 32L60 92H0Z" fill="#718f81"/><path d="m0 22 52 17 17 21-32 32H0Z" fill="#537e74"/><path d="m0 39 38 10 24 24L40 92H15l25-26-40-9" fill="#dde1d6"/><path d="m0 46 34 9 18 18-23 19" fill="none" stroke="#78878a" stroke-width="9"/><path d="m0 46 34 9 18 18-23 19" fill="none" stroke="#eaeac7" stroke-width="1.3" stroke-dasharray="5 5"/><path d="m128 56 54 0m-83 13h112m-50 12h46" stroke="#b8e2e4" stroke-width="2" opacity=".7"/></svg>`;
  if (id === 'alishan') return `<svg ${common}><rect width="240" height="92" fill="#d5ded3"/><path d="M0 56 44 16l38 32 35-26 60 46 32-27 31 21v30H0" fill="#9bad99"/><path d="M0 73 44 47l68 34 46-36 82 29v18H0" fill="#748d74"/><path d="M109 92c65-42-60-21-13-60" fill="none" stroke="#aeb1a0" stroke-width="10"/><path d="M109 92c65-42-60-21-13-60" fill="none" stroke="#f7eed6" stroke-width="1" stroke-dasharray="5 5"/><g fill="#3c685a">${[10,32,57,174,195,221].map((x,i)=>`<path d="m${x} ${30+i%3*9}-13 29h8l-11 16h32l-11-16h8Z"/>`).join('')}</g></svg>`;
  if (id === 'taipei') return `<svg ${common}><rect width="240" height="92" fill="#696684"/><circle cx="188" cy="20" r="10" fill="#e5d9bf"/><path d="M0 59h240v33H0" fill="#3d4b60"/><g fill="#354052"><path d="M6 29h24v44H6Zm33 10h29v35H39Zm96-13h20v52h-20Zm27 19h27v33h-27Zm44-11h24v44h-24Z"/><path d="M98 5h4v12h7v8h3v12h4v13h3v28H81V50h3V37h4V25h3v-8h7Z"/></g><path d="M0 88 96 67h35l109 21" fill="none" stroke="#7c7e94" stroke-width="12"/><path d="M0 88 96 67h35l109 21" fill="none" stroke="#ddccb0" stroke-width="1.4" stroke-dasharray="7 7"/><g stroke="#e4c982" stroke-width="2"><path d="M13 38h10m-10 7h10m22 5h15m-15 9h15m84-23h3m-3 10h3m28 8h10m-10 6h10M93 28h14m-18 12h20m-21 12h24"/></g></svg>`;
  return `<svg ${common}><rect width="240" height="92" fill="#eadcba"/><circle cx="179" cy="22" r="14" fill="#e9b864"/><path d="M0 49h240v43H0" fill="#79bec0"/><path d="M0 63 95 52l43 19L88 92H0" fill="#d5c395"/><path d="M0 80 62 64l32 9-33 19" fill="none" stroke="#a1a291" stroke-width="10"/><path d="M0 80 62 64l32 9-33 19" fill="none" stroke="#eee4c6" stroke-width="1.3" stroke-dasharray="5 5"/><g stroke="#6f8c70" fill="#6f8c70"><path d="m27 72 3-34m35 20 5-30" stroke="#897854" stroke-width="3"/><path d="m30 38-21-7 18 0-8-12 13 15 13-13-8 17 19 2-22 1Zm40-10-17-6 15 1-8-11 12 12 10-12-6 16 16 2-19 1Z"/></g><path d="M160 62h61m-87 15h92" stroke="#b2d5ce" stroke-width="2"/></svg>`;
}

function carArt(id) {
  const bodies = {
    coupe: 'M8 26 19 22l14-13h29l17 12 14 3 4 14H6Z',
    rally: 'M9 25 18 11h45l18 13 15 2 2 12H6Z',
    suv: 'M8 25 17 9h49l20 15 11 3v11H5Z',
    van: 'M10 11h62l14 13 11 3v12H7V16Z'
  };
  return `<svg viewBox="0 0 104 48" aria-hidden="true"><path d="${bodies[id]}" fill="currentColor"/><path d="m${id === 'van' ? '22 14h47l10 10H21' : '35 12h25l15 11H24'}Z" fill="#e5eded" opacity=".78"/><path d="M49 13v11" stroke="currentColor" stroke-width="3"/><circle cx="25" cy="36" r="8" fill="#23383d"/><circle cx="79" cy="36" r="8" fill="#23383d"/><circle cx="25" cy="36" r="3" fill="#cddcdb"/><circle cx="79" cy="36" r="3" fill="#cddcdb"/><path d="M89 28h6" stroke="#f9e8bc" stroke-width="3"/></svg>`;
}

$('#map-choices').innerHTML = MAPS.map((m, i) => `<button class="map-card" data-map="${m.id}" aria-pressed="false" aria-label="選擇${m.name}"><div class="map-art">${mapArt(m.id)}<span class="map-number">0${i + 1}</span><span class="selected-check">✓</span></div><div class="map-caption"><strong>${m.name}</strong><span>${m.english}</span></div></button>`).join('');
$('#vehicle-choices').innerHTML = VEHICLES.map(v => `<button class="vehicle-choice" data-vehicle="${v.id}" aria-pressed="false" aria-label="選擇${v.category} ${v.name}" style="--car-color:${v.color}">${carArt(v.id)}<span>${v.category}</span></button>`).join('');
$('#paint-options').innerHTML = COLORS.map((c, i) => `<button class="paint-dot" data-paint="${c}" style="--paint:${c}" aria-label="${['海洋青','奶油黃','雲霧白','夕陽紅','石墨灰'][i]}車身" aria-pressed="false"></button>`).join('');
$('#download-source').href = `${base}downloads/island-drive-source.zip`;

function syncSelection() {
  const map = currentMap();
  const car = currentVehicle();
  $$('[data-map]').forEach(el => { const active = el.dataset.map === mapId; el.classList.toggle('selected', active); el.setAttribute('aria-pressed', active); });
  $$('[data-vehicle]').forEach(el => { const active = el.dataset.vehicle === vehicleId; el.classList.toggle('selected', active); el.setAttribute('aria-pressed', active); });
  $$('[data-paint]').forEach(el => { const active = el.dataset.paint === paint; el.classList.toggle('selected', active); el.setAttribute('aria-pressed', active); });
  $$('[data-mode]').forEach(el => { const active = el.dataset.mode === mode; el.classList.toggle('selected', active); el.setAttribute('aria-pressed', active); });
  $('#location-label').textContent = map.name;
  $('#route-tag').textContent = map.tag;
  $('#route-description').textContent = map.description;
  $('#difficulty').textContent = map.difficulty;
  $('#vehicle-name').textContent = car.name;
  $('#vehicle-category').textContent = car.category;
  $('#vehicle-index').innerHTML = `0${VEHICLES.indexOf(car) + 1}<span> / 04</span>`;
  $('#car-maxspeed').textContent = car.maxSpeed;
  $('#handling-bar').style.width = `${car.stats[1]}%`;
  $('#stability-bar').style.width = `${car.stats[2]}%`;
  document.body.dataset.map = mapId;
  $('#quality-select').value = quality;
  $('#sound-button').setAttribute('aria-label', muted ? '開啟音效' : '關閉音效');
  $('#sound-button').setAttribute('aria-pressed', !muted);
  $('#sound-button use').setAttribute('href', muted ? '#i-muted' : '#i-sound');
  $('#start-hint').textContent = mode === 'cruise' ? '手機觸控 · 電腦鍵盤' : '倒數結束前，跑完 2.4 公里';
  drawMinimap(0);
  persist();
}

function timeFormat(seconds, fraction = false) {
  const s = Math.max(0, Number(seconds) || 0);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}${fraction ? `.${Math.floor(s * 10) % 10}` : ''}`;
}

function toast(text) {
  $('#toast').textContent = text;
  $('#toast').classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.add('hidden'), 3000);
}

function queueChange(fn) {
  pendingCount++;
  busy = true;
  $('#start-button').disabled = true;
  pending = pending.then(fn).catch(error => { console.error(error); toast('場景載入失敗，請重新選擇。'); }).finally(() => { pendingCount--; busy = pendingCount > 0; $('#start-button').disabled = !ready || busy; });
  return pending;
}

const minimap = $('#minimap').getContext('2d');
let routePoints = [];
let routeMap;
function drawMinimap(progress) {
  if (routeMap !== mapId) {
    routeMap = mapId;
    const xs = Array.from({ length: 81 }, (_, i) => roadCenter(i / 80 * TRACK_LENGTH, mapId));
    const min = Math.min(...xs), max = Math.max(...xs);
    routePoints = xs.map((x, i) => ({ x: 24 + (x - min) / Math.max(1, max - min) * 96, y: 126 - i / 80 * 108 }));
  }
  minimap.clearRect(0, 0, 144, 144);
  minimap.lineWidth = 5;
  minimap.lineCap = 'round';
  const path = (until, color) => { minimap.beginPath(); routePoints.slice(0, until).forEach((p, i) => i ? minimap.lineTo(p.x, p.y) : minimap.moveTo(p.x, p.y)); minimap.strokeStyle = color; minimap.stroke(); };
  path(81, 'rgba(230,244,236,.26)');
  path(Math.floor(progress * 80) + 1, '#dff395');
  const p = routePoints[Math.min(80, Math.max(0, Math.round(progress * 80)))];
  minimap.beginPath(); minimap.arc(p.x, p.y, 5.5, 0, Math.PI * 2); minimap.fillStyle = '#e4f69c'; minimap.fill();
  const end = routePoints[80]; minimap.fillStyle = '#f3f5ef'; minimap.fillRect(end.x - 3, end.y - 3, 6, 6);
}

function updateHUD(state) {
  lastState = state;
  tilt.setActive(state.phase === 'running');
  updateInput();
  $('#speed').textContent = String(Math.round(state.speed || 0)).padStart(3, '0');
  $('#gear').textContent = state.speed < 1 ? 'N' : Math.min(6, 1 + Math.floor(state.speed / 34));
  $('#progress-bar').style.width = `${Math.min(100, state.progress * 100)}%`;
  $('#boost-bar').style.width = `${Math.max(0, state.boost ?? 1) * 100}%`;
  $('#distance-label').textContent = `${((state.distance || 0) / 1000).toFixed(2)} / 2.40 km`;
  $('#clock').textContent = timeFormat(mode === 'timeattack' ? state.timeLeft : state.elapsed, true);
  $('#clock').classList.toggle('urgent', mode === 'timeattack' && state.timeLeft < 20);
  $('#drive-message').textContent = state.offRoad ? '回到路面，繼續前進' : '';
  $('#drive-message').classList.toggle('visible', Boolean(state.offRoad));
  drawMinimap(state.progress || 0);
  const counting = state.phase === 'countdown';
  $('#countdown').classList.toggle('hidden', !counting);
  if (counting) $('#countdown').textContent = state.countdown > 0 ? Math.ceil(state.countdown) : '出發';
  if (state.phase === 'paused') $('#pause-overlay').classList.remove('hidden');
  else $('#pause-overlay').classList.add('hidden');
}

function finish(result) {
  releaseInput();
  $('#countdown').classList.add('hidden');
  $('#finish-overlay').classList.remove('hidden');
  const completed = result.completed !== false;
  $('#finish-title').textContent = completed ? '這段風景，收下了。' : '再給自己一個彎。';
  $('#finish-eyebrow').textContent = completed ? 'JOURNEY COMPLETE' : 'TRY ANOTHER RUN';
  $('#finish-route').textContent = `${currentMap().name} · ${currentVehicle().name} · ${completed ? '2.40' : (result.distance / 1000).toFixed(2)} km`;
  $('#finish-time').textContent = timeFormat(result.elapsed, true);
  $('#finish-score').textContent = Math.round(result.score || 0).toLocaleString('zh-TW');
  const key = `${mapId}:${vehicleId}:${mode}`;
  const previous = records[key];
  if (completed && (!previous || result.elapsed < previous.elapsed)) {
    records[key] = { elapsed: result.elapsed, score: result.score };
    storage.set('records', records);
    $('#best-record').textContent = previous ? '刷新了你的最佳紀錄。' : '第一段旅程，已經記住了。';
  } else $('#best-record').textContent = previous ? `個人最快紀錄 ${timeFormat(previous.elapsed, true)}` : '換一台車，再試一次。';
}

function showDriving() {
  document.body.classList.add('driving');
  $('#menu').classList.add('hidden');
  $('#topbar').classList.add('hidden');
  $('#hud').classList.remove('hidden');
  $('#finish-overlay').classList.add('hidden');
  $('#pause-overlay').classList.add('hidden');
  $('#hud-map').textContent = currentMap().name;
  $('#mini-map-label').textContent = currentMap().tag;
  $('#hud-mode').textContent = mode === 'cruise' ? '自由駕駛' : '計時挑戰';
  $('#clock-label').textContent = mode === 'cruise' ? '旅程時間' : '剩餘時間';
}

function start() { if (!ready || busy) return; releaseInput(); showDriving(); game.start(mode); }
function returnToMenu() {
  releaseInput(); game.returnToMenu();
  document.body.classList.remove('driving');
  $('#menu').classList.remove('hidden'); $('#topbar').classList.remove('hidden'); $('#hud').classList.add('hidden');
  $$('.overlay, #countdown').forEach(el => el.classList.add('hidden'));
}

function updateInput() {
    const touches = new Set(pointers.values());
    const active = (...keys) => keys.some(k => pressedKeys.has(k));
    const left = active('a', 'arrowleft') || touches.has('left');
    const right = active('d', 'arrowright') || touches.has('right');
    game.input.steer = game.phase === 'running' ? combineSteering(left, right, tilt.enabled, tilt.steer) : 0;
    game.input.throttle = active('w', 'arrowup') || touches.has('throttle') ? 1 : 0;
    game.input.brake = active('s', 'arrowdown') || touches.has('brake') ? 1 : 0;
    game.input.boost = active('shift') || touches.has('boost');
    $$('[data-input]').forEach(el => el.classList.toggle('held', touches.has(el.dataset.input)));
}

function bindControls() {
  $$('[data-input]').forEach(button => {
    button.addEventListener('pointerdown', event => { event.preventDefault(); button.setPointerCapture(event.pointerId); pointers.set(event.pointerId, button.dataset.input); updateInput(); });
    const up = event => { pointers.delete(event.pointerId); updateInput(); };
    button.addEventListener('pointerup', up); button.addEventListener('pointercancel', up); button.addEventListener('lostpointercapture', up);
    button.addEventListener('contextmenu', event => event.preventDefault());
  });
  addEventListener('keydown', event => {
    if ($('dialog[open]') || /INPUT|SELECT|TEXTAREA/.test(event.target.tagName)) return;
    const key = event.key.toLowerCase();
    if (!['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift', 'escape', 'c'].includes(key) || !document.body.classList.contains('driving')) return;
    event.preventDefault();
    if (!event.repeat && key === 'escape') { if (lastState.phase === 'paused') game.resume(); else if (lastState.phase === 'running') { releaseInput(); game.pause(); } }
    else if (!event.repeat && key === 'c') game.setCamera();
    else { pressedKeys.add(key); updateInput(); }
  });
  addEventListener('keyup', event => { pressedKeys.delete(event.key.toLowerCase()); updateInput(); });
}

function releaseInput() {
  pressedKeys.clear(); pointers.clear();
  tilt.resetSteer();
  if (typeof game !== 'undefined') Object.assign(game.input, { steer: 0, throttle: 0, brake: 0, boost: false });
  $$('[data-input]').forEach(el => el.classList.remove('held'));
}

const game = new Game({
  canvas: $('#world'), onUpdate: updateHUD, onFinish: finish,
  onReady: () => {},
  onError: error => { console.error(error); toast('3D 場景載入遇到問題，請重新整理。'); }
});

function syncTiltUI(state = tilt.getState()) {
  const labels = { off: '觸控轉向', permission: '等待權限', waiting: '等待感測', ready: '方向盤已開',
    denied: '權限未開啟', unsupported: '瀏覽器不支援', insecure: '請使用 HTTPS', unavailable: '未收到感測資料', error: '無法取得權限' };
  const hud = $('#tilt-toggle');
  hud.setAttribute('aria-pressed', String(state.enabled));
  hud.setAttribute('aria-label', state.enabled ? '關閉手機方向盤' : '啟用手機方向盤');
  hud.classList.toggle('is-active', state.enabled);
  hud.disabled = state.pending;
  hud.querySelector('span').textContent = state.status === 'waiting' ? '等待感測' : state.enabled ? '方向盤開' : '方向盤';
  const settings = $('#tilt-settings-toggle');
  settings.setAttribute('aria-pressed', String(state.enabled));
  settings.disabled = state.pending;
  settings.textContent = state.pending ? '等待權限' : state.enabled ? '關閉' : '啟用';
  $('#tilt-status').textContent = labels[state.status] || '觸控轉向';
  $('#tilt-calibrate').classList.toggle('hidden', !state.enabled);
  $('#tilt-calibrate').disabled = !state.ready;
  document.body.classList.toggle('tilt-enabled', state.enabled);
  if (ready) $('#start-hint').textContent = state.enabled ? '傾斜手機轉向 · 右手按油門' : mode === 'cruise' ? '手機觸控 · 電腦鍵盤' : '倒數結束前，跑完 2.4 公里';
}

const tilt = new TiltController({ onSteer: updateInput, onStatus: syncTiltUI, onNotice: toast });
function toggleTilt() {
  if (tilt.enabled) { tilt.disable(); updateInput(); toast('已切回觸控轉向。'); }
  else void tilt.enable();
}
$('#tilt-settings-toggle').addEventListener('click', toggleTilt);
$('#tilt-toggle').addEventListener('click', toggleTilt);
$('#tilt-calibrate').addEventListener('click', () => tilt.calibrate());
syncTiltUI();

$$('[data-map]').forEach(button => button.addEventListener('click', () => { if (!ready) return; const id = button.dataset.map; queueChange(async () => { mapId = id; syncSelection(); await game.setMap(id); }); }));
$$('[data-vehicle]').forEach(button => button.addEventListener('click', () => { if (!ready) return; const id = button.dataset.vehicle; queueChange(async () => { vehicleId = id; syncSelection(); await game.setVehicle(id); game.setColor(paint); }); }));
$$('[data-paint]').forEach(button => button.addEventListener('click', () => { paint = button.dataset.paint; game.setColor(paint); syncSelection(); }));
$$('[data-mode]').forEach(button => button.addEventListener('click', () => { mode = button.dataset.mode; syncSelection(); }));
$('#start-button').addEventListener('click', start);
$('#pause-button').addEventListener('click', () => { releaseInput(); game.pause(); });
$('#resume-button').addEventListener('click', () => game.resume());
$('#restart-button').addEventListener('click', start);
$('#back-button').addEventListener('click', returnToMenu);
$('#again-button').addEventListener('click', start);
$('#choose-button').addEventListener('click', returnToMenu);
$('#camera-button').addEventListener('click', () => { game.setCamera(); toast('已切換駕駛視角'); });
$('#sound-button').addEventListener('click', () => { muted = !muted; game.setMuted(muted); syncSelection(); });
$('#settings-button').addEventListener('click', () => $('#settings-dialog').showModal());
$('#source-button').addEventListener('click', () => $('#source-dialog').showModal());
$$('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
$$('dialog').forEach(dialog => dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } }));
$('#quality-select').addEventListener('change', event => { quality = event.target.value; game.setQuality(quality); persist(); });
$('#fullscreen-button').addEventListener('click', async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); else toast('這個瀏覽器不支援全螢幕，可加入主畫面遊玩。'); } catch { toast('這個瀏覽器無法啟用全螢幕。'); } });
$('.brand').addEventListener('click', event => { event.preventDefault(); if (ready) returnToMenu(); });
addEventListener('blur', () => { releaseInput(); if (lastState.phase === 'running') game.pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { releaseInput(); if (lastState.phase === 'running' || lastState.phase === 'countdown') game.pause(); } });
syncSelection();
bindControls();

window.__islandDrive = { game, tilt, getTilt: () => tilt.getState(), getSelected: () => ({ mapId, vehicleId, mode, paint }), getRecords: () => ({ ...records }) };

try {
  await game.init();
  if (mapId !== 'coast') await game.setMap(mapId);
  if (vehicleId !== 'coupe') await game.setVehicle(vehicleId);
  game.setColor(paint); game.setQuality(quality); game.setMuted(muted);
  ready = true;
  $('#start-button').disabled = false;
  $('#start-button span').textContent = '出發上路';
  $('#loading-screen').classList.add('loaded');
  setTimeout(() => $('#loading-screen').remove(), 550);
} catch (error) {
  console.error(error);
  $('#loading-text').textContent = '無法載入 3D 場景。請確認瀏覽器支援 WebGL，再重新整理。';
  $('.loading-track').classList.add('hidden');
  const button = document.createElement('button'); button.className = 'primary-button'; button.textContent = '重新載入'; button.addEventListener('click', () => location.reload()); $('#loading-screen').append(button);
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register(new URL('sw.js', document.baseURI)).catch(error => console.warn('Offline cache unavailable:', error.message));
}
