import './styles.css';
import '../../shared/bootstrap.js';
import {APP_REPOSITORY} from '../../shared/paths.js';
import {readSettings,updateSettings,subscribeSettings} from '../../shared/settings.js';
import {TrainGame} from './game.js';
import {TrainWorld} from './world.js';
import {TrainAudio} from './audio.js';
import {ROUTES,LESSONS,VEHICLES,clamp} from './config.js';
const $=id=>document.getElementById(id),game=new TrainGame(),audio=new TrainAudio();let world;
const initialSettings=readSettings();game.childMode=initialSettings.childMode;
try{world=new TrainWorld($('world'),game);}catch(error){$('asset-loading').innerHTML='<b>這台瀏覽器無法啟動 3D 畫面</b><span>請在 Safari 或 Chrome 重新開啟。</span>';console.error(error);}
window.__trainSchool={game,getState:()=>game.getState(),getAssets:()=>world?.assetStatus,world};
window.addEventListener('train-assets',()=>{const status=world.assetStatus;if(Object.values(status).every(v=>v==='ready'))$('asset-loading').hidden=true;else if(Object.values(status).includes('error'))$('asset-loading').innerHTML='<b>模型載入未完成</b><span>請重新整理，或確認網路連線後再試。</span>';});
let voiceEnabled=!initialSettings.muted,voiceActivated=false,lastSpoken='',lastSpokenAt=0;
function activateAudio(){audio.unlock();audio.enabled=voiceEnabled;}
function applySharedSettings(settings,force=false){
 const modeChanged=game.childMode!==settings.childMode;game.childMode=settings.childMode;voiceEnabled=!settings.muted;audio.enabled=voiceEnabled;
 if(!voiceEnabled&&'speechSynthesis'in window)speechSynthesis.cancel();
 $('child-mode').checked=game.childMode;$('sound').setAttribute('aria-label',voiceEnabled?'關閉語音教練':'開啟語音教練');$('sound').textContent=voiceEnabled?'♪':'♩';
 if(modeChanged||force){$('child-console').hidden=!game.childMode;$('advanced-console').hidden=game.childMode;$('advanced-toggle').textContent='家長／進階操作 ⌄';}
 world?.applyQuality(settings.quality);updateUI();
}
function speak(text,force=false){if(!voiceActivated||!voiceEnabled||!('speechSynthesis'in window))return;if(text===lastSpoken&&!force)return;if(!force&&performance.now()-lastSpokenAt<3500)return;lastSpoken=text;lastSpokenAt=performance.now();const utterance=new SpeechSynthesisUtterance(text);utterance.lang='zh-TW';utterance.rate=.83;utterance.pitch=1.08;const voices=speechSynthesis.getVoices();utterance.voice=voices.find(v=>v.lang==='zh-TW')||voices.find(v=>v.lang.startsWith('zh'))||null;speechSynthesis.cancel();speechSynthesis.speak(utterance);}
const run=fn=>()=>{activateAudio();voiceActivated=true;if(!game.completed)fn();updateUI();if(game.childMode)speak(game.childHint().text,true);};
$('child-prepare').onclick=run(()=>game.prepare());$('child-go').onclick=run(()=>game.childGo());$('child-stop').onclick=run(()=>game.gentleStop());$('child-help-stop').onclick=run(()=>game.helpStop());$('child-doors').onclick=run(()=>game.toggleDoors());$('child-emergency').onclick=run(()=>game.controls.emergency?game.releaseEmergency():game.emergency());
$('advanced-toggle').onclick=()=>{$('advanced-console').hidden=!$('advanced-console').hidden;$('advanced-toggle').textContent=$('advanced-console').hidden?'家長／進階操作 ⌄':'收起進階操作 ⌃';};
$('power').onclick=run(()=>game.togglePower());$('doors').onclick=run(()=>game.toggleDoors());document.querySelectorAll('[data-direction]').forEach(b=>b.onclick=run(()=>game.direction(Number(b.dataset.direction))));
$('throttle').oninput=run(()=>game.throttle(Number($('throttle').value)));$('brake').oninput=run(()=>game.brake(Number($('brake').value)));
for(const [id,field,sign] of [['throttle-up','throttle',1],['throttle-down','throttle',-1],['brake-up','brake',1],['brake-down','brake',-1]])$(id).onclick=run(()=>game[field](game.controls[field]+sign));
$('emergency').onclick=run(()=>game.controls.emergency?game.releaseEmergency():game.emergency());$('horn').onclick=()=>{voiceActivated=true;if(voiceEnabled){activateAudio();audio.horn();}};$('sound').onclick=()=>{voiceActivated=true;updateSettings({muted:!readSettings().muted});if(voiceEnabled){activateAudio();speak(game.childHint().text,true);}};
$('view').onclick=()=>{world.view=world.view==='cab'?'outside':'cab';$('view').textContent=world.view==='cab'?'外部視角 ↗':'駕駛艙 ↙';};
function pause(){game.paused?game.resume():game.pause();updateUI();}
$('pause').onclick=pause;$('resume').onclick=()=>{game.resume();updateUI();};$('restart-pause').onclick=()=>{game.reset();updateUI();};
let selectedRoute='coast',selectedLesson='lesson1',wasPaused=false;
function selectOptions(){document.querySelectorAll('[data-route]').forEach(b=>b.classList.toggle('selected',b.dataset.route===selectedRoute));document.querySelectorAll('[data-lesson]').forEach(b=>b.classList.toggle('selected',b.dataset.lesson===selectedLesson));}
function openSettings(){wasPaused=game.paused;game.pause();selectedRoute=game.routeId;selectedLesson=game.lessonId;selectOptions();$('vehicle-select').value=game.vehicleId;$('assisted').checked=game.assisted;$('child-mode').checked=game.childMode;$('settings-dialog').showModal();}
$('settings').onclick=openSettings;document.querySelectorAll('[data-route]').forEach(b=>b.onclick=()=>{selectedRoute=b.dataset.route;selectOptions();});document.querySelectorAll('[data-lesson]').forEach(b=>b.onclick=()=>{selectedLesson=b.dataset.lesson;selectOptions();});
$('settings-dialog').addEventListener('close',()=>{if(!wasPaused&&!game.completed)game.resume();});
$('start-lesson').onclick=()=>{activateAudio();voiceActivated=true;game.start(selectedLesson,{route:selectedRoute,vehicle:$('vehicle-select').value});game.assisted=$('assisted').checked;updateSettings({childMode:$('child-mode').checked});wasPaused=false;$('settings-dialog').close();updateUI();speak(game.childMode?game.childHint().text:game.hint,true);};
$('help').onclick=()=>{wasPaused=game.paused;game.pause();$('help-dialog').showModal();};$('help-dialog').addEventListener('close',()=>{if(!wasPaused&&!game.completed)game.resume();});
$('replay').onclick=()=>{$('result-dialog').close();game.reset();updateUI();};$('next-lesson').onclick=()=>{$('result-dialog').close();const n=Object.keys(LESSONS),i=n.indexOf(game.lessonId);game.start(n[(i+1)%n.length]);updateUI();};
document.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]')||/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName))return;const handlers={ArrowUp:()=>game.throttle(game.controls.throttle+1),ArrowDown:()=>game.throttle(game.controls.throttle-1),ArrowLeft:()=>game.brake(game.controls.brake-1),ArrowRight:()=>game.brake(game.controls.brake+1),' ':()=>game.emergency(),p:()=>game.togglePower(),d:()=>game.toggleDoors(),f:()=>game.direction(1),r:()=>game.direction(-1),n:()=>game.direction(0),Escape:pause};const fn=handlers[e.key]||handlers[e.key.toLowerCase()];if(fn){e.preventDefault();activateAudio();fn();updateUI();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)game.pause();});
let resultShown=false;
function updateUI(){
 const s=game.getState(),c=s.controls,speed=Math.abs(s.speed);$('speed').textContent=speed.toFixed(0);$('limit').textContent=s.limit;$('speed').closest('.speed-instrument').classList.toggle('speeding',speed>s.limit+1);$('station').textContent=`${s.station||'終點'}站`;$('distance').textContent=Math.abs(s.distance).toFixed(0);$('progress').style.width=`${clamp(s.s/(game.lesson.stops.at(-1))*100,0,100)}%`;
 $('signal-lamp').className=`lamp ${s.signal}`;$('signal-name').textContent={red:'紅燈・停車',yellow:'黃燈・減速',green:'綠燈・可前進'}[s.signal];$('signal-distance').textContent=s.signalDistance===null?'路線暢通':`${Math.max(0,s.signalDistance).toFixed(0)} m`;
 $('route-name').textContent=ROUTES[s.route].name;$('lesson-name').textContent=LESSONS[s.lesson].short;$('vehicle-name').textContent=VEHICLES[s.vehicle].name;$('elapsed').textContent=`${String(Math.floor(s.elapsed/60)).padStart(2,'0')}:${String(Math.floor(s.elapsed%60)).padStart(2,'0')}`;
 const child=game.childHint();$('hint').textContent=s.childMode?child.text:s.hint;$('stopping').textContent=`建議提早煞車距離 ${s.stoppingDistance.toFixed(0)} m`;$('stopping').hidden=!s.assisted||s.childMode;$('mode-label').textContent=s.childMode?'幼兒模式':s.assisted?'輔助模式':'進階模式';document.querySelectorAll('.child-console>button').forEach(b=>b.classList.toggle('coach-next',b.id===child.action));$('child-doors').innerHTML=`<span>🚪</span>${s.controls.doors?'關門出發':'開門接客'}`;$('child-emergency').innerHTML=`<span>■</span>${s.controls.emergency?'解除煞車':'緊急煞車'}`;if(!s.paused&&!s.completed&&s.childMode)speak(child.text);
 $('power').classList.toggle('ready',c.power);$('power-state').textContent=c.power?'已開啟':'關閉';$('doors').classList.toggle('ready',!c.doors);$('doors-label').textContent=c.doors?'關門確認':'開門接客';$('doors-state').textContent=c.doors?'車門開啟':'車門鎖定';$('readiness').textContent=`${[c.power,!c.doors,c.direction!==0,c.brake===0].filter(Boolean).length} / 4 就緒`;
 document.querySelectorAll('[data-direction]').forEach(b=>b.classList.toggle('active',Number(b.dataset.direction)===c.direction));$('throttle').value=c.throttle;$('brake').value=c.brake;$('throttle-value').textContent=c.throttle;$('brake-value').textContent=c.brake;$('traction').textContent=(s.traction/1000).toFixed(0);$('pressure').textContent=s.pressure.toFixed(0);$('traction-bar').style.width=`${s.traction/game.vehicle.maxTraction*100}%`;$('pressure-bar').style.width=`${s.pressure/360*100}%`;
 $('emergency').classList.toggle('engaged',c.emergency);$('emergency').querySelector('span').textContent=c.emergency?'解除緊急煞車':'緊急煞車';$('pause-overlay').hidden=!s.paused||s.completed||!!document.querySelector('dialog[open]');$('pause').textContent=s.paused?'▶':'Ⅱ';$('pause').setAttribute('aria-label',s.paused?'繼續課程':'暫停課程');$('toast').hidden=!s.toast;$('toast').textContent=s.toast;
 if(s.completed&&!resultShown){resultShown=true;speak('乘客都到站了！你完成這一課啦。',true);$('score').textContent=s.score;$('stop-results').innerHTML=s.stops.map(v=>`<div class="stop-result"><b>${v.station}站</b><span>停車誤差 ${v.error.toFixed(1)} m</span></div>`).join('');$('result-feedback').textContent=s.infractions.length?'再試一次，在紅燈前提早煞車。完成停站的步驟已經學會了。':s.overspeedTime>3?'停站流程完成了。下一次提早收動力，試著全程留在限速內。':'你會確認車門、平順起步，也會在停車標附近接客了。下一課再練習新任務！';$('result-dialog').showModal();}
 if(!s.completed)resultShown=false;
}
let previous=performance.now(),accumulator=0,lastUI=0;
function frame(now){const dt=Math.min((now-previous)/1000,.1);previous=now;accumulator+=dt;while(accumulator>=1/60){game.update(1/60);accumulator-=1/60;}world?.render();audio.update(game.physics.v*3.6,game.paused);if(now-lastUI>80){updateUI();lastUI=now;}requestAnimationFrame(frame);}
document.querySelector('a[href*="github.com/mars-tw/"]').href=APP_REPOSITORY;
applySharedSettings(readSettings(),true);subscribeSettings(applySharedSettings);requestAnimationFrame(frame);
