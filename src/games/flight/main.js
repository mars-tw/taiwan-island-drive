import '../../shared/bootstrap.js';
import { appUrl,assetUrl,APP_REPOSITORY } from '../../shared/paths.js';
import { readSettings,updateSettings,subscribeSettings } from '../../shared/settings.js';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import './styles.css';
import { FlightGame } from './game.js';
import { Instruments } from './instruments.js';
import { MAPS,AIRCRAFT,LESSONS } from './config.js';
import { ChildVoice } from './voice.js';
import { childAction,childMessage } from './child-instructions.js';
const activityOrder=['treasure','mail','tour','takeoff','navigation','landing','free'];

const app=document.querySelector('#app');
const stage=document.createElement('div');stage.id='flight-stage';const scene=document.querySelector('#scene');scene.before(stage);stage.append(scene);
app.innerHTML=`
 <section id="menu" class="menu">
  <header class="brand"><p class="eyebrow">ISLAND FLIGHT SCHOOL</p><h1>今天，飛去哪裡？</h1><p class="intro">選一趟旅程，按出發。<br>一起飛過台灣的山、海與城市。</p><div class="model-badge"><span class="dot"></span><span id="asset-state">飛機正在準備中…</span></div></header>
  <div class="dispatch-card">
   <div class="dispatch-title"><span>小小飛行員</span><span class="tag">3～5 歲・親子一起玩</span></div>
   <fieldset><legend>想玩什麼？</legend><div class="lesson-grid">${Object.values(LESSONS).sort((a,b)=>activityOrder.indexOf(a.id)-activityOrder.indexOf(b.id)).map((l,i)=>`<button class="lesson-card ${i===0?'selected':''}" data-lesson="${l.id}" aria-pressed="${i===0}"><span class="lesson-number">${({takeoff:'↗',navigation:'◎',landing:'↓',free:'∞',treasure:'★',mail:'✉',tour:'⌖'})[l.id]||'✈'}</span><span><strong>${l.name}</strong><small>${l.description}</small></span></button>`).join('')}</div></fieldset>
   <div class="select-row"><label>台灣練習場<select id="map-choice">${Object.values(MAPS).map(m=>`<option value="${m.id}">${m.name}</option>`).join('')}</select></label><label>你的飛機<select id="plane-choice">${Object.values(AIRCRAFT).map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}</select></label></div>
   <details class="parent-settings"><summary>家長設定與儀表說明</summary><div class="pilot-mode"><label>操作方式<select id="pilot-choice"><option value="child">孩子點一下・自動助飛</option><option value="parent">家長手動・完整操控</option></select></label></div>
   <label class="assist"><input id="assist-choice" type="checkbox" checked><span>穩定輔助<small>幫忙回正機翼，大人陪孩子一起練習。</small></span></label>
   <details class="instrument-guide"><summary>第一次飛？先認識儀表</summary><p>空速是飛機相對空氣的速度，KT 是「節」。姿態儀讓你看見機頭高低、機翼傾斜；高度用 FT（呎），升降率是每分鐘升降幾呎。航向 000° 向北、090° 向東。襟翼能增加低速升力，也會增加阻力。</p></details>
   <p class="learning-note">教學遊戲採簡化飛行模型。真實操作請由合格教練指導。</p></details>
   <button id="start" class="primary" disabled><span>出發</span><span>✈</span></button><p class="learning-note">按一下就會持續助飛，向左、向右也用點的。</p>
   <footer><a href="${APP_REPOSITORY}" target="_blank" rel="noopener">MIT 開源</a><a href="${assetUrl('downloads/island-drive-source.zip')}">下載原始碼與 Blender 模型</a></footer>
  </div>
 </section>
 <section id="hud" class="hud" hidden>
  <header class="flight-top"><div><strong id="lesson-name">滑行與起飛</strong><span id="map-name"></span></div><div class="top-actions"><button id="drop-mail" hidden title="投遞郵件">投遞</button><button id="return-home" title="助飛返航">返航</button><button id="view" title="切換視角">座艙</button><button id="mute" title="聲音開關" aria-label="聲音開關">♪</button><button id="pause" title="暫停" aria-label="暫停">Ⅱ</button></div></header>
  <div class="lesson-prompt"><span id="phase">課程 01</span><p id="hint"></p><div id="warning" hidden>迎角太大：輕推機頭並增加油門，讓氣流回來。</div><div id="progress-track"><i id="progress"></i></div></div>
  <div id="flight-window" class="flight-window" aria-label="飛行畫面，操作按鈕在畫面下方"></div>
  <div id="flight-controls" class="flight-controls"><div class="telemetry"><span id="flight-status" class="flight-status">飛機準備好了</span><span id="child-cue" class="child-cue" hidden>機翼平穩</span><button id="instrument-toggle" aria-expanded="false" aria-controls="instrument-panel">看儀表</button></div>
  <div id="instrument-panel" class="instrument-panel" hidden><canvas id="instruments" aria-label="空速、姿態、高度、航向、升降率及引擎儀表"></canvas></div>
  <div class="joystick-area"><span class="control-label">操縱桿</span><span class="push-label">推桿：機頭下降</span><div id="joystick" role="application" aria-label="操縱桿，左右傾斜，往下拉會抬頭" tabindex="0"><i id="stick"></i></div><span class="pull-label">拉桿：機頭抬起</span></div>
  <div class="power-area"><label for="throttle">油門 <strong id="throttle-value">0%</strong></label><input id="throttle" type="range" min="0" max="100" value="0" aria-label="油門百分比"><button id="flaps">襟翼 0°</button><button id="brake" class="brake">按住煞車</button></div>
  <div class="rudder-area"><span>方向舵／地面轉向</span><div><button id="rudder-left" aria-label="左方向舵">◀</button><button id="rudder-right" aria-label="右方向舵">▶</button></div></div>
  <div id="child-panel" class="child-panel"><button id="child-left" aria-label="向左轉"><span>↶</span><strong>向左</strong></button><button id="child-action" class="child-action"><span id="child-icon">✈</span><strong id="child-action-text">出發</strong></button><button id="child-right" aria-label="向右轉"><span>↷</span><strong>向右</strong></button></div>
  <p class="keyboard-help">↑↓ 推拉桿　←→ 傾斜　Q/E 方向舵　Shift/Ctrl 油門　F 襟翼　Space 煞車</p></div>
 </section>
 <section id="overlay" class="overlay" hidden><div class="result-card"><span class="eyebrow" id="result-tag">FLIGHT PAUSED</span><h2 id="result-title">休息一下。</h2><p id="result-text"></p><div id="result-data" class="result-data"></div><button id="continue" class="primary">繼續飛行</button><button id="replay">再練一次</button><button id="home">回到飛行計畫</button></div></section>
 <div id="boot-error" class="boot-error" hidden></div>
`;
const $=id=>document.getElementById(id);let selected=LESSONS.treasure?'treasure':'takeoff',lastMode='menu',lastUpdate=0,lastEventId=0,rewardUntil=0,rewardText='',updateReady=false;
const hadWorkerAtBoot=!!navigator.serviceWorker?.controller;
let layoutFrame=0;function syncViewport(){cancelAnimationFrame(layoutFrame);layoutFrame=requestAnimationFrame(()=>{const r=$('hud').hidden?document.querySelector('#app').getBoundingClientRect():$('flight-window').getBoundingClientRect();Object.assign(stage.style,{left:`${r.left}px`,top:`${r.top}px`,width:`${Math.max(1,r.width)}px`,height:`${Math.max(1,r.height)}px`});game.world.resize();});}
const viewportObserver=new ResizeObserver(syncViewport);viewportObserver.observe($('flight-window'));viewportObserver.observe($('flight-controls'));addEventListener('resize',syncViewport);window.visualViewport?.addEventListener('resize',syncViewport);
const voice=new ChildVoice();
const instruments=new Instruments($('instruments'));
const game=new FlightGame($('scene'),s=>{
 if(s.mode!==lastMode){lastMode=s.mode;showMode(s);}
 if(s.mode==='menu')return;
 const t=performance.now();if(t-lastUpdate<65)return;lastUpdate=t;
 if(!$('instrument-panel').hidden&&$('instruments').clientWidth>60&&$('instruments').clientHeight>40)instruments.draw(s);
 const event=s.mission.events?.at(-1);if(s.preschool&&event&&event.id>lastEventId){lastEventId=event.id;rewardText=({star:'找到一顆星星！',mail:'郵件送到了！','mail-drop':'看，郵件飛下去了！',landmark:`到了，${event.label}！`,ring:'飛過一個圓圈！','mail-missed':'我們繞回來，再送一次。'})[event.type]||'';if(rewardText){rewardUntil=t+3600;if(s.mode==='playing')voice.say(rewardText,`reward:${s.lesson}:${event.id}`,true);}}
 $('hint').textContent=s.preschool&&t<rewardUntil?rewardText:s.preschool?childMessage(s):s.mission.message||LESSONS[s.lesson].goal;document.querySelector('.lesson-prompt').classList.toggle('reward',s.preschool&&t<rewardUntil);$('warning').hidden=!s.stall;$('flight-status').textContent=s.preschool?`${s.grounded?'地面':'飛行中'} · 高度 ${Math.max(0,Math.round(s.position.y))} 公尺 · ${Math.round(s.airspeed*3.6)} 公里／時`:`${s.grounded?'地面':'飛行中'} · ${Math.round(s.airspeedKnots)} KT · ${Math.round(s.altitudeFeet)} FT`;
 $('throttle-value').textContent=`${Math.round(game.controls.throttle*100)}%`;if(document.activeElement!==$('throttle'))$('throttle').value=Math.round(game.controls.throttle*100);$('flaps').textContent=`襟翼 ${game.controls.flaps*10}°`;
 const prog=Number.isFinite(s.mission.progress)?s.mission.progress:s.lesson==='navigation'?s.mission.passed/3:s.lesson==='takeoff'?Math.min(1,s.altitudeFeet/150):s.lesson==='landing'?(s.grounded?.85:Math.max(0,.75-s.position.y/120)):0;$('progress').style.width=`${Math.max(0,Math.min(1,prog))*100}%`;$('phase').textContent=s.pilot?.returning?'助飛返航':s.mission.total?`${s.mission.passed||0}／${s.mission.total} · ${s.mission.targetLabel||LESSONS[s.lesson].name}`:LESSONS[s.lesson].name;$('return-home').hidden=!s.preschool;$('return-home').textContent=s.pilot?.returning?'取消返航':'返航';
 if(s.preschool){const action=childAction(s);$('child-action-text').textContent=action[0];$('child-icon').textContent=action[1];$('child-action').classList.toggle('highlight',action[2]);$('child-cue').textContent=s.pilot?.returning?'返航中':s.pilot?.turnRemaining>.1?'慢慢轉彎':s.grounded?'自動守住跑道':'助飛保持平穩';if(s.mode==='playing'&&t>=rewardUntil)voice.say(childMessage(s),`${s.lesson}:${s.pilot?.stage||s.mission.stage||s.mission.phase}:${s.mission.passed}:${action[0]}`);}
 const turnDelta=s.pilot?Math.atan2(Math.sin(s.pilot.targetHeading-s.heading),Math.cos(s.pilot.targetHeading-s.heading)):0;$('child-left').classList.toggle('active',s.pilot?.turnRemaining>0&&turnDelta<-.04);$('child-right').classList.toggle('active',s.pilot?.turnRemaining>0&&turnDelta>.04);
});
window.__flightSchool={game,voice,getState:()=>game.getState(),getLayout:()=>({stage:stage.getBoundingClientRect().toJSON(),window:$('flight-window').getBoundingClientRect().toJSON(),controls:$('flight-controls').getBoundingClientRect().toJSON()})};
function showMode(s){
 if(s.mode==='menu'&&updateReady){location.reload();return;}
 $('menu').hidden=s.mode!=='menu';$('hud').hidden=s.mode==='menu';$('overlay').hidden=!['paused','result'].includes(s.mode);
 document.body.classList.toggle('flight-playing',s.mode!=='menu');$('hud').classList.toggle('preschool',s.preschool);$('child-panel').hidden=!s.preschool;$('child-cue').hidden=!s.preschool;
 $('lesson-name').textContent=LESSONS[s.lesson].name;$('map-name').textContent=MAPS[s.map].name;
 $('drop-mail').hidden=s.preschool||s.lesson!=='mail';
 if(s.mode!=='playing')voice.stop();
 if(s.mode==='paused'){$('result-tag').textContent='FLIGHT PAUSED';$('result-title').textContent='休息一下。';$('result-text').textContent='準備好了，再繼續飛。';$('result-data').textContent='';$('continue').hidden=false;$('replay').classList.remove('primary');}
 if(s.mode==='result'){$('result-tag').textContent=s.mission.complete?'JOURNEY COMPLETE':'TRY AGAIN';$('result-title').textContent=s.mission.complete?'這趟旅程，完成了！':'再試一次就好。';$('result-text').textContent=s.mission.message;$('result-data').textContent=s.mission.complete?`得到 ${s.mission.score} 分・飛行 ${Math.round(s.time)} 秒`:'';$('continue').hidden=true;$('replay').classList.add('primary');try{if(s.mission.complete){const record=JSON.parse(localStorage.getItem('island-flight-school-record')||'{}');record[s.lesson]=Math.max(record[s.lesson]||0,s.mission.score);localStorage.setItem('island-flight-school-record',JSON.stringify(record));}}catch{}}
 if(s.mode==='result'&&s.preschool)voice.say(s.mission.message,`result:${s.lesson}:${s.mission.score}`,true);
 syncViewport();
}
document.querySelectorAll('[data-lesson]').forEach(b=>b.onclick=()=>{voice.unlock();selected=b.dataset.lesson;document.querySelectorAll('[data-lesson]').forEach(o=>{o.classList.toggle('selected',o===b);o.setAttribute('aria-pressed',o===b);});$('start').querySelector('span').textContent=`出發 · ${LESSONS[selected].name}`;voice.say(`${LESSONS[selected].name}，按出發就開始。`,`select:${selected}`,true);});
$('map-choice').onchange=e=>{game.map=e.target.value;game.world.setMap(game.map);};$('plane-choice').onchange=e=>game.plane=e.target.value;
$('start').onclick=()=>{voice.unlock();lastEventId=0;rewardUntil=0;game.start(selected,{map:$('map-choice').value,plane:$('plane-choice').value,assist:$('assist-choice').checked,preschool:$('pilot-choice').value==='child'});if(game.preschool)game.childControl();$('phase').textContent=LESSONS[selected].name;showMode(game.getState());if(game.preschool)voice.say(childMessage(game.getState()),`start:${selected}`,true);};
$('pause').onclick=()=>game.pause();$('continue').onclick=()=>{voice.unlock();game.resume();};$('replay').onclick=()=>{lastEventId=0;rewardUntil=0;game.reset();if(game.preschool)game.childControl();};$('home').onclick=()=>{game.menu();$('menu').scrollTop=0;showMode(game.getState());};$('view').onclick=()=>{game.setView(game.world.view==='chase'?'cockpit':'chase');$('view').textContent=game.world.view==='chase'?'座艙':'機外';};$('mute').onclick=()=>updateSettings({muted:!readSettings().muted});
$('return-home').onclick=()=>{voice.unlock();if(game.getState().pilot?.returning)game.childControl();else game.returnHome();};$('instrument-toggle').onclick=()=>{const open=$('instrument-panel').hidden;$('instrument-panel').hidden=!open;$('instrument-toggle').setAttribute('aria-expanded',String(open));$('instrument-toggle').textContent=open?'收起儀表':'看儀表';syncViewport();};
$('drop-mail').onclick=()=>{voice.unlock();game.dropMail();};
$('throttle').oninput=e=>game.controls.throttle=Number(e.target.value)/100;$('flaps').onclick=()=>game.controls.flaps=(game.controls.flaps+1)%3;
function held(id,key,value){const el=$(id);const release=e=>{game.controls[key]=0;el.classList.remove('active');if(e?.pointerId!==undefined&&el.hasPointerCapture(e.pointerId))el.releasePointerCapture(e.pointerId);};el.addEventListener('pointerdown',e=>{e.preventDefault();el.setPointerCapture(e.pointerId);game.controls[key]=value;el.classList.add('active');});el.addEventListener('pointerup',release);el.addEventListener('pointercancel',release);el.addEventListener('lostpointercapture',release);}
$('child-left').onclick=()=>{voice.unlock();game.childTurn(-1);};$('child-right').onclick=()=>{voice.unlock();game.childTurn(1);};$('child-action').onclick=()=>{voice.unlock();game.childControl();};
held('brake','brake',1);held('rudder-left','rudder',-1);held('rudder-right','rudder',1);
let stickPointer=null;const stick=$('joystick'),knob=$('stick');function moveStick(e){const r=stick.getBoundingClientRect(),x=Math.max(-1,Math.min(1,(e.clientX-r.x-r.width/2)/(r.width*.37))),y=Math.max(-1,Math.min(1,(e.clientY-r.y-r.height/2)/(r.height*.37)));game.controls.roll=x;game.controls.pitch=y;knob.style.transform=`translate(${x*r.width*.3}px,${y*r.height*.3}px)`;}
stick.onpointerdown=e=>{if(stickPointer!==null)return;e.preventDefault();stickPointer=e.pointerId;stick.setPointerCapture(e.pointerId);moveStick(e);};stick.onpointermove=e=>{if(e.pointerId===stickPointer)moveStick(e);};const releaseStick=()=>{stickPointer=null;game.controls.pitch=0;game.controls.roll=0;knob.style.transform='';};stick.onpointerup=releaseStick;stick.onpointercancel=releaseStick;stick.onlostpointercapture=releaseStick;
document.addEventListener('flight-assets',e=>{if(e.detail.ok){$('asset-state').textContent='飛機已準備好';$('start').disabled=false;}else{$('asset-state').textContent='素材載入失敗，請重新整理';$('boot-error').hidden=false;$('boot-error').textContent='飛機素材沒有載入。請確認網路並重新整理頁面。';}});

let appliedChildMode;
function applySharedSettings(settings){
 game.preschool=settings.childMode;if(appliedChildMode!==settings.childMode)game.assist=settings.childMode;appliedChildMode=settings.childMode;game.audio.muted=settings.muted;voice.enabled=!settings.muted;if(settings.muted)voice.stop();
 $('pilot-choice').value=settings.childMode?'child':'parent';$('assist-choice').checked=game.assist;$('mute').textContent=settings.muted?'靜音':'聲音';
 game.world.applyQuality(settings.quality);showMode(game.getState());
}
$('pilot-choice').onchange=e=>updateSettings({childMode:e.target.value==='child'});
$('assist-choice').onchange=e=>game.assist=e.target.checked;
applySharedSettings(readSettings());subscribeSettings(applySharedSettings);
syncViewport();
navigator.serviceWorker?.addEventListener('controllerchange',()=>{if(!hadWorkerAtBoot)return;updateReady=true;if(game.mode==='menu')location.reload();});
