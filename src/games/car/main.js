import '../../shared/bootstrap.js';
import {progressStorage} from '../../shared/student-save.js';
import { readSettings, updateSettings, subscribeSettings } from '../../shared/settings.js';
import './styles.css';
import '../../shared/mobile-controls.css';
import '@fontsource/barlow-condensed/latin-500.css';
import '@fontsource/barlow-condensed/latin-600.css';
import '@fontsource/barlow-condensed/latin-700.css';
import '@fontsource/barlow-condensed/latin-800.css';
import { MAPS, VEHICLES, COLORS, TRACK_LENGTH } from './config.js';
import { Game } from './game.js';
import { roadCenter, roadHeading } from './physics.js';
import { TiltController, combineSteering } from './tilt.js';
import { celebrate } from '../../shared/celebrate.js';
import { addStars, recordBest, starRating } from '../../shared/rewards.js';
import { requestedJourney } from '../../shared/journeys.js';
import { journeyResult } from '../../shared/passport.js';
import { appUrl } from '../../shared/paths.js';
import {roadSpeedDisplay} from '../../shared/child-display.js';
import { t, setText, setAttr, bindLocalized, onLanguageChange } from '../../shared/i18n.js';
import '../../shared/content-r1-driving.css';
document.body.classList.toggle('content-child-driving',readSettings().childMode);
subscribeSettings(s=>document.body.classList.toggle('content-child-driving',s.childMode));

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const drivingInputHint = () => t(matchMedia('(pointer:coarse), (max-width:1100px)').matches ? '點方向與油門按鈕出發' : '手機觸控 · 電腦鍵盤');
addEventListener('resize',()=>{if(!document.body.classList.contains('tilt-enabled'))$('#start-hint').textContent=mode==='cruise'?drivingInputHint():t('倒數結束前，跑完 2.4 公里');});
const familySettings = readSettings();
const storage = {
  get(key, fallback) { try { return JSON.parse(progressStorage.getItem(`island-drive:${key}`)) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { progressStorage.setItem(`island-drive:${key}`, JSON.stringify(value)); } catch { /* Private browsing can disable storage. */ } }
};
const saved = storage.get('preferences', {});
let mapId = MAPS.some(m => m.id === saved.map) ? saved.map : 'coast';
let vehicleId = VEHICLES.some(v => v.id === saved.vehicle) ? saved.vehicle : 'coupe';
let paint = COLORS.includes(saved.paint) ? saved.paint : COLORS[0];
let mode = !readSettings().childMode && saved.mode === 'timeattack' ? 'timeattack' : 'cruise';
let journey = requestedJourney('car');
let autoThrottle = false;
if (journey) { mapId = journey.map; mode = 'cruise'; }
let quality = familySettings.quality;
let muted = familySettings.muted;
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

// R50: names stay Chinese in config.js (logic and saves use them); every label goes through t() where it is shown.
const PAINT_NAMES = ['海洋青','奶油黃','雲霧白','夕陽紅','石墨灰'];
const mapLabel = m => t('選擇{name}', { name: t(m.name) });
const vehicleLabel = v => t('選擇{category} {name}', { category: t(v.category), name: t(v.name) });
const paintLabel = i => t('{color}車身', { color: t(PAINT_NAMES[i]) });
$('#map-choices').innerHTML = MAPS.map((m, i) => `<button class="map-card" data-map="${m.id}" aria-pressed="false" aria-label="${mapLabel(m)}"><div class="map-art"><img src="${appUrl(`art/r6/route-${({coast:'coast',alishan:'valley',taipei:'taipei',kenting:'island'})[m.id]}.webp`)}" alt=""><span class="map-number">0${i + 1}</span><span class="selected-check">✓</span></div><div class="map-caption"><strong>${t(m.name)}</strong><span>${t(m.tag)}</span></div></button>`).join('');
$('#vehicle-choices').innerHTML = VEHICLES.map(v => `<button class="vehicle-choice" data-vehicle="${v.id}" aria-pressed="false" aria-label="${vehicleLabel(v)}" style="--car-color:${v.color}"><img src="${appUrl(`art/r6/${v.id}-${COLORS.indexOf(paint)}.png`)}" alt=""><span>${t(v.category)}</span></button>`).join('');
$('#paint-options').innerHTML = COLORS.map((c, i) => `<button class="paint-dot" data-paint="${c}" style="--paint:${c}" aria-label="${paintLabel(i)}" aria-pressed="false"></button>`).join('');
/** Language switch: the choice buttons were built once, so their labels are set again here. */
function labelChoices() {
  $$('#map-choices [data-map]').forEach(el => { const m = MAPS.find(item => item.id === el.dataset.map); el.setAttribute('aria-label', mapLabel(m)); el.querySelector('.map-caption strong').textContent = t(m.name); el.querySelector('.map-caption span').textContent = t(m.tag); });
  $$('#vehicle-choices [data-vehicle]').forEach(el => { const v = VEHICLES.find(item => item.id === el.dataset.vehicle); el.setAttribute('aria-label', vehicleLabel(v)); el.querySelector('span').textContent = t(v.category); });
  $$('#paint-options [data-paint]').forEach(el => el.setAttribute('aria-label', paintLabel(COLORS.indexOf(el.dataset.paint))));
}

/** Every text of the menu that depends on the current choice. */
function syncLabels() {
  const map = currentMap();
  const car = currentVehicle();
  $('#location-label').textContent = t(map.name);
  $('#route-tag').textContent = t(map.tag);
  $('#route-description').textContent = t(map.description);
  $('#difficulty').textContent = t(map.difficulty);
  $('#vehicle-name').textContent = t(car.name);
  $('#vehicle-category').textContent = t(car.category);
  const preview = $('#car-preview-image');
  if (preview) preview.alt = `${t(car.name)} ${t(car.category)}`;
  $('#sound-button').setAttribute('aria-label', t(muted ? '開啟音效' : '關閉音效'));
  $('#start-hint').textContent = mode === 'cruise' ? drivingInputHint() : t('倒數結束前，跑完 2.4 公里');
}

function syncSelection() {
  const car = currentVehicle();
  $$('[data-map]').forEach(el => { const active = el.dataset.map === mapId; el.classList.toggle('selected', active); el.setAttribute('aria-pressed', active); });
  $$('[data-vehicle]').forEach(el => { const active = el.dataset.vehicle === vehicleId; el.classList.toggle('selected', active); el.setAttribute('aria-pressed', active); });
  $$('[data-paint]').forEach(el => { const active = el.dataset.paint === paint; el.classList.toggle('selected', active); el.setAttribute('aria-pressed', active); });
  $$('[data-mode]').forEach(el => { const active = el.dataset.mode === mode; el.classList.toggle('selected', active); el.setAttribute('aria-pressed', active); });
  syncLabels();
  const preview=$('#car-preview-image');
  if(preview){preview.src=appUrl(`art/r6/${vehicleId}-${COLORS.indexOf(paint)}.png`);}
  $$('[data-vehicle] img').forEach(img=>img.src=appUrl(`art/r6/${img.closest('[data-vehicle]').dataset.vehicle}-${COLORS.indexOf(paint)}.png`));
  $('#vehicle-index').innerHTML = `0${VEHICLES.indexOf(car) + 1}<span> / 04</span>`;
  $('#car-maxspeed').textContent = car.maxSpeed;
  $('#handling-bar').style.width = `${car.stats[1]}%`;
  $('#stability-bar').style.width = `${car.stats[2]}%`;
  document.body.dataset.map = mapId;
  $('#quality-select').value = quality;
  $('#sound-button').setAttribute('aria-pressed', !muted);
  $('#sound-button use').setAttribute('href', muted ? '#i-muted' : '#i-sound');
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
  pending = pending.then(fn).catch(error => { console.error(error); toast(t('場景載入失敗，請重新選擇。')); }).finally(() => { pendingCount--; busy = pendingCount > 0; $('#start-button').disabled = !ready || busy; });
  return pending;
}

const minimap = $('#minimap').getContext('2d');
const finishFlag=new Image();finishFlag.src=appUrl('art/r7/finish-flag.png');
let coachRewardUntil=0;
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
  minimap.lineWidth=10;path(81,'#143b61');minimap.lineWidth=5;path(81,'#80d6fa');
  path(Math.floor(progress * 80) + 1, '#f46b27');
  const p = routePoints[Math.min(80, Math.max(0, Math.round(progress * 80)))];
  minimap.beginPath(); minimap.arc(p.x, p.y, 7, 0, Math.PI * 2); minimap.fillStyle = '#f46b27'; minimap.fill();minimap.strokeStyle='#fff';minimap.lineWidth=2;minimap.stroke();
  const end = routePoints[80];if(finishFlag.complete&&finishFlag.naturalWidth)minimap.drawImage(finishFlag,end.x-10,end.y-15,22,32);
}

function updateHUD(state) {
  lastState = state;
  if (state.phase === 'paused' && autoThrottle) { autoThrottle = false; $('#auto-throttle').setAttribute('aria-pressed','false'); }
  tilt.setActive(state.phase === 'running');
  updateInput();
  $('#speed').textContent = String(Math.round(state.speed || 0)).padStart(3, '0');
  const steps=$('.speed-steps');if(steps){const {bars,label}=roadSpeedDisplay(state.speed);steps.setAttribute('aria-valuenow',bars);steps.setAttribute('aria-valuetext',t('{label}，速度 {n} 格',{label,n:bars}));steps.querySelector('span').textContent=label;steps.querySelectorAll('i').forEach((e,i)=>e.classList.toggle('lit',i<bars));}
  const coach=$('.drive-coach');if(coach){const bend=roadHeading((state.distance||0)+55,mapId)-roadHeading(state.distance||0,mapId);const pose=performance.now()<coachRewardUntil?'reward':Math.abs(bend)>.018?'turn':'straight';const left=pose==='turn'&&bend>0;if(coach.dataset.pose!==pose){coach.dataset.pose=pose;coach.querySelector('img').src=appUrl(`art/r8/coach-safe-window.png`);}game.setCoachPose(pose,left);coach.classList.toggle('turn-left',left);coach.querySelector('span').textContent=t(pose==='reward'?'星星收好了！':pose==='turn'?(left?'前面往左彎':'前面往右彎'):'沿著海岸慢慢開');coach.querySelector('img').alt=t(pose==='reward'?'副駕阿路舉起剛找到的星星':pose==='turn'?(left?'副駕阿路舉左彎牌指路':'副駕阿路舉右彎牌指路'):'副駕阿路繫好安全帶舉直行牌');}
  if(coach)coach.querySelector('img').alt=t('阿路教練坐在閉合車窗內，繫好安全帶；{cue}',{cue:coach.querySelector('span').textContent});
  $('#gear').textContent = state.speed < 1 ? 'N' : Math.min(6, 1 + Math.floor(state.speed / 34));
  $('#boost-bar').style.width = `${Math.max(0, state.boost ?? 1) * 100}%`;
  const length = journey?.distance || TRACK_LENGTH;
  $('#progress-bar').style.width = `${Math.min(100,(state.distance || 0)/length*100)}%`;
  $('#distance-label').textContent = `${((state.distance || 0) / 1000).toFixed(2)} / ${(length/1000).toFixed(2)} km`;
  $('#clock').textContent = timeFormat(mode === 'timeattack' ? state.timeLeft : state.elapsed, true);
  $('#clock').classList.toggle('urgent', mode === 'timeattack' && state.timeLeft < 20);
  $('#drive-message').textContent = state.offRoad ? t('回到路面，繼續前進') : '';
  $('#drive-message').classList.toggle('visible', Boolean(state.offRoad));
  drawMinimap(state.progress || 0);
  if (state.starTotal) { $('#star-count').textContent = state.stars; $('#star-total').textContent = `/${state.starTotal}`; }
  const counting = state.phase === 'countdown';
  $('#countdown').classList.toggle('hidden', !counting);
  if (counting) $('#countdown').textContent = state.countdown > 0 ? Math.ceil(state.countdown) : t('出發');
  if (state.phase === 'paused') $('#pause-overlay').classList.remove('hidden');
  else $('#pause-overlay').classList.add('hidden');
}

let finishView = null;
function finish(result) {
  releaseInput();
  $('#countdown').classList.add('hidden');
  $('#finish-overlay').classList.remove('hidden');
  const completed = result.completed !== false;
  const stars = result.stars || 0, rating = completed ? starRating(stars, result.starTotal || 12) : 0;
  if (stars) addStars('car', stars);
  if (completed) recordBest(journey ? `car:${journey.id}` : `car:${mapId}`, rating);
  $('#finish-overlay .journey-result')?.remove();
  if (completed) journeyResult($('#finish-overlay .result-card'), journey, rating);
  if (completed) celebrate({ text: t(rating === 3 ? '超級司機！' : '到終點了！'), kind: 'finish', y: 0.3, pieces: 40, big: true, sound: !muted });
  const key = `${mapId}:${vehicleId}:${mode}${journey ? `:${journey.id}` : ''}`;
  const previous = records[key];
  const best = completed && (!previous || result.elapsed < previous.elapsed);
  if (best) {
    records[key] = { elapsed: result.elapsed, score: result.score };
    storage.set('records', records);
  }
  // Kept so a language switch can redraw the open result card without counting the trip twice.
  finishView = { result, completed, stars, rating, previous, best, map: currentMap(), vehicle: currentVehicle(), length: journey?.distance || TRACK_LENGTH, childMode: readSettings().childMode };
  renderFinish(finishView);
}

function renderFinish({ result, completed, stars, rating, previous, best, map, vehicle, length, childMode }) {
  $('#finish-stars').innerHTML = `<span class="rating" aria-label="${t('{n} 顆星評等', { n: rating })}">${[1, 2, 3].map(i => `<i class="${i <= rating ? 'on' : ''}">★</i>`).join('')}</span><span class="haul">${t('收集到 {n} / {total} 顆星星', { n: `<b>${stars}</b>`, total: result.starTotal || 12 })}</span>`;
  $('#finish-title').textContent = t(completed ? (stars === result.starTotal ? '星星全都帶回家！' : '到終點囉，好棒！') : '時間到，再試一次！');
  $('#finish-eyebrow').textContent = t(completed ? '旅程完成' : '再試一趟');
  $('#finish-route').textContent = childMode ? t('{name} · 大家一起到站了', { name: t(map.name) }) : `${t(map.name)} · ${t(vehicle.name)} · ${(Math.min(result.distance,length) / 1000).toFixed(2)} km`;
  $('#finish-time').textContent = timeFormat(result.elapsed, true);
  $('#finish-score').textContent = Math.round(result.score || 0).toLocaleString('zh-TW');
  if (best) $('#best-record').textContent = t(previous ? '刷新了你的最佳紀錄。' : '第一段旅程，已經記住了。');
  else $('#best-record').textContent = previous ? t('個人最快紀錄 {time}', { time: timeFormat(previous.elapsed, true) }) : t('換一台車，再試一次。');
  if(childMode)$('#best-record').textContent=t('這段風景記住了，再一起出發吧。');
}

function showDriving() {
  document.body.classList.add('driving');
  $('#menu').classList.add('hidden');
  $('#topbar').classList.add('hidden');
  $('#hud').classList.remove('hidden');
  $('#finish-overlay').classList.add('hidden');
  $('#pause-overlay').classList.add('hidden');
  syncDrivingText();
  $('#auto-throttle').setAttribute('aria-pressed','false');
}
/** HUD words set once per drive (also redrawn after a language switch). */
function syncDrivingText() {
  $('#hud-map').textContent = t(currentMap().name);
  $('#mini-map-label').textContent = t(currentMap().tag);
  $('#hud-mode').textContent = t(mode === 'cruise' ? '自由駕駛' : '計時挑戰');
  $('#clock-label').textContent = t(mode === 'cruise' ? '旅程時間' : '剩餘時間');
  $('#drive-guide').textContent = journey ? t('{name}：{tip}', { name: t(journey.name), tip: t(journey.tip) }) : t('按住右下油門前進；左下按鈕轉向。也可點「自動油門」。');
}

function start() { if (!ready || busy) return; if(readSettings().childMode)mode='cruise'; releaseInput(); showDriving(); game.start(mode, {distance:journey?.distance}); }
function returnToMenu() {
  releaseInput(); journey=null; game.returnToMenu();
  document.body.classList.remove('driving');
  $('#menu').classList.remove('hidden'); $('#topbar').classList.remove('hidden'); $('#hud').classList.add('hidden');
  $$('.overlay, #countdown').forEach(el => el.classList.add('hidden'));
}

function updateInput() {
    const touches = new Set(pointers.values());
    const active = (...keys) => keys.some(k => pressedKeys.has(k));
    const left = active('a', 'arrowleft') || touches.has('left');
    const right = active('d', 'arrowright') || touches.has('right');
    const braking = active('s', 'arrowdown') || touches.has('brake');
    game.input.steer = game.phase === 'running' ? combineSteering(left, right, tilt.enabled, tilt.steer) : 0;
    game.input.throttle = game.phase === 'running' && !braking && (autoThrottle || active('w', 'arrowup') || touches.has('throttle')) ? 1 : 0;
    // Child auto-cruise gives time to read the coast and steer; manual pedal stays manual.
    if(autoThrottle&&readSettings().childMode&&game.input.throttle)game.input.throttle=Math.max(0,Math.min(1,.2+(65-lastState.speed)/18));
    game.input.brake = game.phase === 'running' && braking ? 1 : 0;
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
  autoThrottle = false;
  $('#auto-throttle').setAttribute('aria-pressed','false');
  pressedKeys.clear(); pointers.clear();
  tilt.resetSteer();
  if (typeof game !== 'undefined') Object.assign(game.input, { steer: 0, throttle: 0, brake: 0, boost: false });
  $$('[data-input]').forEach(el => el.classList.remove('held'));
}

function collected({ collected: count, total }) {
  coachRewardUntil=performance.now()+1600;
  const badge = $('#hud-stars'); badge.classList.remove('bump'); void badge.offsetWidth; badge.classList.add('bump');
  celebrate({ text: count === total ? t('全部找到了！') : t('{n} 顆星星', { n: count }), kind: 'star', x: 0.5, y: 0.36, pieces: count === total ? 34 : 14, sound: false, big: count === total });
}

const game = new Game({
  canvas: $('#world'), onUpdate: updateHUD, onFinish: finish, onCollect: collected,
  onReady: () => {},
  onError: error => { console.error(error); toast(t('3D 場景載入遇到問題，請重新整理。')); }
});

function syncTiltUI(state = tilt.getState()) {
  const labels = { off: '觸控轉向', permission: '等待權限', waiting: '等待感測', ready: '方向盤已開',
    denied: '權限未開啟', unsupported: '瀏覽器不支援', insecure: '請使用 HTTPS', unavailable: '未收到感測資料', error: '無法取得權限' };
  const hud = $('#tilt-toggle');
  hud.setAttribute('aria-pressed', String(state.enabled));
  hud.setAttribute('aria-label', t(state.enabled ? '關閉手機方向盤' : '啟用手機方向盤'));
  hud.classList.toggle('is-active', state.enabled);
  hud.disabled = state.pending;
  hud.querySelector('span').textContent = t(state.status === 'waiting' ? '等待感測' : state.enabled ? '方向盤開' : '方向盤');
  const settings = $('#tilt-settings-toggle');
  settings.setAttribute('aria-pressed', String(state.enabled));
  settings.disabled = state.pending;
  settings.textContent = t(state.pending ? '等待權限' : state.enabled ? '關閉' : '啟用');
  $('#tilt-status').textContent = t(labels[state.status] || '觸控轉向');
  $('#tilt-calibrate').classList.toggle('hidden', !state.enabled);
  $('#tilt-calibrate').disabled = !state.ready;
  document.body.classList.toggle('tilt-enabled', state.enabled);
  if (ready) $('#start-hint').textContent = state.enabled ? t('傾斜手機轉向 · 右手按油門') : mode === 'cruise' ? drivingInputHint() : t('倒數結束前，跑完 2.4 公里');
}

const tilt = new TiltController({ onSteer: updateInput, onStatus: syncTiltUI, onNotice: toast });
function toggleTilt() {
  if (tilt.enabled) { tilt.disable(); updateInput(); toast(t('已切回觸控轉向。')); }
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
$('#auto-throttle').addEventListener('click', () => { autoThrottle = !autoThrottle; $('#auto-throttle').setAttribute('aria-pressed',String(autoThrottle)); updateInput(); });
$('#pause-button').addEventListener('click', () => { releaseInput(); game.pause(); });
$('#resume-button').addEventListener('click', () => game.resume());
$('#restart-button').addEventListener('click', start);
$('#back-button').addEventListener('click', returnToMenu);
$('#again-button').addEventListener('click', start);
$('#choose-button').addEventListener('click', returnToMenu);
$('#camera-button').addEventListener('click', () => { game.setCamera(); toast(t('已切換駕駛視角')); });
$('#sound-button').addEventListener('click', () => { muted = !muted; game.setMuted(muted); updateSettings({ muted }); syncSelection(); });
$('#settings-button').addEventListener('click', () => $('#settings-dialog').showModal());
$('#source-button').addEventListener('click', () => $('#source-dialog').showModal());
$$('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
$$('dialog').forEach(dialog => dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } }));
$('#quality-select').addEventListener('change', event => { quality = event.target.value; game.setQuality(quality); updateSettings({ quality }); persist(); });
$('#fullscreen-button').addEventListener('click', async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); else toast(t('這個瀏覽器不支援全螢幕，可加入主畫面遊玩。')); } catch { toast(t('這個瀏覽器無法啟用全螢幕。')); } });
$('.brand').addEventListener('click', event => { event.preventDefault(); if (ready) returnToMenu(); });
addEventListener('blur', () => { releaseInput(); if (lastState.phase === 'running') game.pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { releaseInput(); if (lastState.phase === 'running' || lastState.phase === 'countdown') game.pause(); } });
syncSelection();
bindControls();
// R50: words written in car/index.html switch language here (the html itself stays as it is).
['#topbar', '#menu', '#hud', '#pause-overlay', '#finish-overlay', '#settings-dialog', '#source-dialog', '#loading-screen'].forEach(selector => bindLocalized($(selector)));
setAttr($('#world'), 'aria-label', '台灣公路 3D 遊戲場景');
setAttr($('#minimap'), 'aria-label', '路線進度');
// Words this script wrote itself are drawn again in the new language.
onLanguageChange(() => {
  labelChoices(); syncLabels(); syncTiltUI();
  if (document.body.classList.contains('driving')) syncDrivingText();
  if (finishView && !$('#finish-overlay').classList.contains('hidden')) {
    renderFinish(finishView);
    // The trip panel (passport.js) is written once; draw it again. Completing the same rating twice changes nothing.
    if (finishView.completed && journey) journeyResult($('#finish-overlay .result-card'), journey, finishView.rating);
  }
});

window.__islandDrive = { game, tilt, getTilt: () => tilt.getState(), getSelected: () => ({ mapId, vehicleId, mode, paint }), getRecords: () => ({ ...records }) };

try {
  await game.init();
  if (mapId !== 'coast') await game.setMap(mapId);
  if (vehicleId !== 'coupe') await game.setVehicle(vehicleId);
  game.setColor(paint); game.setQuality(quality); game.setMuted(muted);
  ready = true;
  $('#start-button').disabled = false;
  setText($('#start-button span'), '出發上路');
  $('#loading-screen').classList.add('loaded');
  setTimeout(() => $('#loading-screen').remove(), 550);
  if (journey) start();
} catch (error) {
  console.error(error);
  setText($('#loading-text'), '無法載入 3D 場景。請確認瀏覽器支援 WebGL，再重新整理。');
  $('.loading-track').classList.add('hidden');
  const button = document.createElement('button'); button.className = 'primary-button'; setText(button, '重新載入'); button.addEventListener('click', () => location.reload()); $('#loading-screen').append(button);
}

subscribeSettings(value => {
  muted = value.muted; quality = value.quality;
  if (ready) { game.setMuted(muted); game.setQuality(quality); }
  syncSelection();
});

import {installArt} from "../../shared/art-refresh.js";
installArt();
import '../../shared/art-refresh.css';
