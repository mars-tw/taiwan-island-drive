import {childFlightDisplay} from '../../shared/child-display.js';
import '../../shared/bootstrap.js';
import {progressStorage} from '../../shared/student-save.js';
import { readSettings,updateSettings,subscribeSettings } from '../../shared/settings.js';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import './styles.css';
import '../../shared/mobile-controls.css';
import { FlightGame } from './game.js';
import { Instruments } from './instruments.js';
import { MAPS,AIRCRAFT,LESSONS } from './config.js';
import { ChildVoice } from './voice.js';
import { childAction,childMessage } from './child-instructions.js';
import { celebrate } from '../../shared/celebrate.js';
import { addStars,recordBest } from '../../shared/rewards.js';
import { rewardForEvent } from './rewards.js';
import {requestedJourney} from '../../shared/journeys.js';
import {journeyResult} from '../../shared/passport.js';
import {appUrl} from '../../shared/paths.js';
import {t,translateText,setAttr,bindLocalized,onLanguageChange} from '../../shared/i18n.js';
let journey=requestedJourney('flight'),runAwarded=false;
let lastRewardEventId=0;
const activityOrder=['treasure','mail','tour','takeoff','navigation','landing','free'];
// R50: the menu is written in Chinese (zh marks the source text) and bindLocalized(app)
// shows it in the chosen language. Mission and plan sentences stay Chinese in the game
// state; tx() turns them into the chosen language only when they are drawn or spoken.
const zh=text=>text,tx=text=>translateText(text);

const app=document.querySelector('#app');
const stage=document.createElement('div');stage.id='flight-stage';const scene=document.querySelector('#scene');scene.before(stage);stage.append(scene);setAttr(scene,'aria-label','三維飛行練習場');
app.innerHTML=`
 <section id="menu" class="menu">
  <header class="brand"><p class="eyebrow">${zh('交通學院・飛機課')}</p><h1>${zh('今天，飛去哪裡？')}</h1><p class="intro">${zh('選一趟旅程，按出發。')}<br>${zh('一起飛過台灣的山、海與城市。')}</p><div class="model-badge"><span class="dot"></span><span id="asset-state">${zh('飛機正在準備中…')}</span></div></header>
  <div class="dispatch-card">
   <div class="dispatch-title"><span>${zh('小小飛行員')}</span><span class="tag">${zh('3～5 歲・親子一起玩')}</span></div>
   <fieldset class="picture-picker"><legend>${zh('想看哪裡的風景？')}</legend><div class="flight-map-cards">${Object.values(MAPS).map((m,i)=>`<button type="button" data-flight-map="${m.id}" aria-pressed="${i===0}" class="${i===0?'selected':''}"><img src="${appUrl(`art/r6/route-${m.id}.webp`)}" alt=""><strong>${m.name}</strong></button>`).join('')}</div></fieldset>
   <fieldset class="picture-picker"><legend>${zh('選你的飛機')}</legend><div class="flight-plane-cards">${Object.values(AIRCRAFT).map((p,i)=>`<button type="button" data-flight-plane="${p.id}" aria-pressed="${i===0}" class="${i===0?'selected':''}"><img src="${appUrl('art/r6/flight.png')}" alt=""><strong>${p.name}</strong></button>`).join('')}</div></fieldset>
   <fieldset><legend>${zh('想玩什麼？')}</legend><div class="lesson-grid">${Object.values(LESSONS).sort((a,b)=>activityOrder.indexOf(a.id)-activityOrder.indexOf(b.id)).map((l,i)=>`${i===3?'</div><details class="extra-activities"><summary>更多飛行練習</summary><div class="lesson-grid">':''}<button class="lesson-card ${i===0?'selected':''}" data-lesson="${l.id}" aria-pressed="${i===0}"><img class="lesson-picture" src="${appUrl(`art/r6/${({treasure:'badge',mail:'mail-badge',tour:'route-badge'})[l.id]||'flight'}.png`)}" alt=""><span><strong>${l.name}</strong><small>${l.description}</small></span></button>`).join('')}</div></details></fieldset>
   <details class="parent-settings"><summary>${zh('家長設定與儀表說明')}</summary><div class="pilot-mode"><label>${zh('操作方式')}<select id="pilot-choice"><option value="child">${zh('孩子點一下・自動助飛')}</option><option value="parent">${zh('家長手動・完整操控')}</option></select></label></div>
   <div class="select-row"><label>${zh('台灣練習場')}<select id="map-choice">${Object.values(MAPS).map(m=>`<option value="${m.id}">${m.name}</option>`).join('')}</select></label><label>${zh('你的飛機')}<select id="plane-choice">${Object.values(AIRCRAFT).map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}</select></label></div>
   <label class="assist"><input id="assist-choice" type="checkbox" checked><span>${zh('穩定輔助')}<small>${zh('幫忙回正機翼，大人陪孩子一起練習。')}</small></span></label>
   <details class="instrument-guide"><summary>${zh('第一次飛？先認識儀表')}</summary><p>${zh('空速是飛機相對空氣的速度，KT 是「節」。姿態儀讓你看見機頭高低、機翼傾斜；高度用 FT（呎），升降率是每分鐘升降幾呎。航向 000° 向北、090° 向東。襟翼能增加低速升力，也會增加阻力。')}</p></details>
   <p class="learning-note">${zh('教學遊戲採簡化飛行模型。真實操作請由合格教練指導。')}</p></details>
   <button id="start" class="primary" disabled><span>${zh('出發')}</span><span>✈</span></button><p class="learning-note">${zh('按一下就會持續助飛，向左、向右也用點的。')}</p>

  </div>
 </section>
 <section id="hud" class="hud" hidden>
  <header class="flight-top"><div><strong id="lesson-name">${zh('滑行與起飛')}</strong><span id="map-name"></span></div><div class="top-actions"><button id="drop-mail" hidden title="${zh('投遞郵件')}">${zh('投遞')}</button><button id="return-home" title="${zh('助飛返航')}">${zh('返航')}</button><button id="view" title="${zh('切換視角')}">${zh('座艙')}</button><button id="mute" title="${zh('聲音開關')}" aria-label="${zh('聲音開關')}">♪</button><button id="pause" title="${zh('暫停')}" aria-label="${zh('暫停')}">Ⅱ</button></div></header>
  <div class="lesson-prompt"><span id="phase">${zh('課程 01')}</span><p id="hint"></p><div id="warning" hidden>${zh('迎角太大：輕推機頭並增加油門，讓氣流回來。')}</div><div id="progress-track"><i id="progress"></i></div></div>
  <div id="flight-window" class="flight-window" aria-label="${zh('飛行畫面，操作按鈕在畫面下方')}"></div>
  <div id="flight-controls" class="flight-controls"><div class="telemetry"><span id="flight-status" class="flight-status">${zh('飛機準備好了')}</span><span id="child-cue" class="child-cue" hidden>${zh('機翼平穩')}</span><button id="instrument-toggle" aria-expanded="false" aria-controls="instrument-panel">${zh('看儀表')}</button></div>
  <div id="instrument-panel" class="instrument-panel" hidden><canvas id="instruments" aria-label="${zh('空速、姿態、高度、航向、升降率及引擎儀表')}"></canvas></div>
  <div class="joystick-area"><span class="control-label">${zh('操縱桿')}</span><span class="push-label">${zh('推桿：機頭下降')}</span><div id="joystick" role="application" aria-label="${zh('操縱桿，左右傾斜，往下拉會抬頭')}" tabindex="0"><i id="stick"></i></div><span class="pull-label">${zh('拉桿：機頭抬起')}</span></div>
  <div class="power-area"><label for="throttle">${zh('油門')} <strong id="throttle-value">0%</strong></label><input id="throttle" type="range" min="0" max="100" value="0" aria-label="${zh('油門百分比')}"><button id="flaps">${zh('襟翼 0°')}</button><button id="brake" class="brake">${zh('按住煞車')}</button></div>
  <div class="rudder-area"><span>${zh('方向舵／地面轉向')}</span><div><button id="rudder-left" aria-label="${zh('左方向舵')}">◀</button><button id="rudder-right" aria-label="${zh('右方向舵')}">▶</button></div></div>
  <div id="child-panel" class="child-panel"><button id="child-left" aria-label="${zh('向左轉')}"><span>↶</span><strong>${zh('向左')}</strong></button><button id="child-action" class="child-action"><span id="child-icon">✈</span><strong id="child-action-text">${zh('出發')}</strong></button><button id="child-right" aria-label="${zh('向右轉')}"><span>↷</span><strong>${zh('向右')}</strong></button></div>
  <p class="keyboard-help">${zh('↑↓ 推拉桿　←→ 傾斜　Q/E 方向舵　Shift/Ctrl 油門　F 襟翼　Space 煞車')}</p></div>
 </section>
 <section id="overlay" class="overlay" hidden><div class="result-card"><span class="eyebrow" id="result-tag">${zh('飛行暫停')}</span><h2 id="result-title">${zh('休息一下。')}</h2><p id="result-text"></p><div id="result-data" class="result-data"></div><button id="continue" class="primary">${zh('繼續飛行')}</button><button id="replay">${zh('再練一次')}</button><button id="home">${zh('回到飛行計畫')}</button></div></section>
 <div id="boot-error" class="boot-error" hidden></div>
`;
const $=id=>document.getElementById(id);let selected=LESSONS.treasure?'treasure':'takeoff',lastMode='menu',lastUpdate=0,lastEventId=0,rewardUntil=0,rewardText='',updateReady=false,startLabel=false,assetState='',labelMuted=false;
const meters=document.createElement('div');meters.id='child-flight-meters';meters.innerHTML='<span class="flight-height"><b>離地高度</b><span>'+Array.from({length:5},()=>'<i></i>').join('')+'</span></span><span class="flight-wind"><b>前進速度</b><span>'+Array.from({length:5},()=>'<i></i>').join('')+'</span></span><strong id="flight-goal-count"></strong>';$('flight-status').after(meters);
bindLocalized(app);setAttr($('instruments'),'aria-label','空速、姿態、高度、航向、升降率及引擎儀表');
function syncPictureChoices(){
 for(const [attribute,id] of [['flight-map','map-choice'],['flight-plane','plane-choice']])document.querySelectorAll(`[data-${attribute}]`).forEach(button=>{const active=button.getAttribute(`data-${attribute}`)===$(id).value;button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active));});
}
for(const [attribute,id] of [['flight-map','map-choice'],['flight-plane','plane-choice']]){
 document.querySelectorAll(`[data-${attribute}]`).forEach(button=>button.onclick=()=>{$(id).value=button.getAttribute(`data-${attribute}`);$(id).dispatchEvent(new Event('change'));syncPictureChoices();});$(id).addEventListener('change',syncPictureChoices);
}
syncPictureChoices();
const hadWorkerAtBoot=!!navigator.serviceWorker?.controller;
let layoutFrame=0;function syncViewport(){cancelAnimationFrame(layoutFrame);layoutFrame=requestAnimationFrame(()=>{const r=$('hud').hidden?document.querySelector('#menu .brand').getBoundingClientRect():$('flight-window').getBoundingClientRect();Object.assign(stage.style,{left:`${r.left}px`,top:`${r.top}px`,width:`${Math.max(1,r.width)}px`,height:`${Math.max(1,r.height)}px`});game.world.resize();});}
const viewportObserver=new ResizeObserver(syncViewport);viewportObserver.observe($('flight-window'));viewportObserver.observe($('flight-controls'));addEventListener('resize',syncViewport);window.visualViewport?.addEventListener('resize',syncViewport);
const voice=new ChildVoice();
const instruments=new Instruments($('instruments'));
const game=new FlightGame($('scene'),s=>{
 if(s.mode!==lastMode){lastMode=s.mode;showMode(s);}
 if(s.mode==='menu')return;
 const now=performance.now();if(now-lastUpdate<65)return;lastUpdate=now;
 if(!$('instrument-panel').hidden&&$('instruments').clientWidth>60&&$('instruments').clientHeight>40)instruments.draw(s);
 const event=s.mission.events?.at(-1);if(event&&event.id>lastRewardEventId){lastRewardEventId=event.id;const reward=rewardForEvent(event);if(reward){addStars('flight',reward.stars);if(s.mode==='playing')celebrate({text:tx(reward.text),kind:'star',y:.38,pieces:20,sound:!readSettings().muted});}}if(s.preschool&&event&&event.id>lastEventId){lastEventId=event.id;rewardText=event.type==='landmark'?t('到了，{place}！',{place:tx(event.label)}):t(({star:'找到一顆星星！',mail:'郵件送到了！','mail-drop':'看，郵件飛下去了！',ring:'飛過一個圓圈！','mail-missed':'我們繞回來，再送一次。'})[event.type]||'');if(rewardText){rewardUntil=now+3600;if(s.mode==='playing')voice.say(rewardText,`reward:${s.lesson}:${event.id}`,true);}}
 $('hint').textContent=journey&&s.time<12?t(journey.tip):s.preschool&&now<rewardUntil?rewardText:s.preschool&&s.mission.target?.kind==='star'?t('阿路無線電：第 {n} 顆，機翼放平，飛向金星！',{n:(s.mission.passed||0)+1}):s.preschool?t('阿路無線電：{text}',{text:tx(childMessage(s))}):tx(s.mission.message||LESSONS[s.lesson].goal);document.querySelector('.lesson-prompt').classList.toggle('reward',s.preschool&&now<rewardUntil);$('warning').hidden=!s.stall;$('flight-status').textContent=s.preschool?t('{state} · 高度 {m} 公尺 · {kmh} 公里／時',{state:t(s.grounded?'地面':'飛行中'),m:Math.max(0,Math.round(s.position.y)),kmh:Math.round(s.airspeed*3.6)}):t('{state} · {kt} KT · {ft} FT',{state:t(s.grounded?'地面':'飛行中'),kt:Math.round(s.airspeedKnots),ft:Math.round(s.altitudeFeet)});
 if(s.preschool){const display=childFlightDisplay(s,game.world.terrainHeight(s.position.x,s.position.z));$('flight-status').textContent=t(display.label);meters.hidden=false;for(const [selector,value] of [['.flight-height',display.height],['.flight-wind',display.wind]]){const meter=meters.querySelector(selector);meter.setAttribute('aria-label',t(selector.includes('height')?'離地高度 {n} 格':'前進速度 {n} 格',{n:value}));meter.querySelectorAll('i').forEach((bar,i)=>bar.classList.toggle('lit',i<value));}const total=s.mission.total||s.mission.targets?.length||0;$('flight-goal-count').textContent=total?t('找到 {n}／{total}',{n:s.mission.passed||0,total}):'';}else meters.hidden=true;
 $('throttle-value').textContent=`${Math.round(game.controls.throttle*100)}%`;if(document.activeElement!==$('throttle'))$('throttle').value=Math.round(game.controls.throttle*100);$('flaps').textContent=t('襟翼 {n}°',{n:game.controls.flaps*10});
 const prog=Number.isFinite(s.mission.progress)?s.mission.progress:s.lesson==='navigation'?s.mission.passed/3:s.lesson==='takeoff'?Math.min(1,s.altitudeFeet/150):s.lesson==='landing'?(s.grounded?.85:Math.max(0,.75-s.position.y/120)):0;$('progress').style.width=`${Math.max(0,Math.min(1,prog))*100}%`;$('phase').textContent=s.pilot?.returning?t('助飛返航'):s.mission.total?t('{n}／{total} · {name}',{n:s.mission.passed||0,total:s.mission.total,name:tx(s.mission.targetLabel||LESSONS[s.lesson].name)}):t(LESSONS[s.lesson].name);$('return-home').hidden=!s.preschool;$('return-home').textContent=t(s.pilot?.returning?'取消返航':'返航');
 if(s.preschool){const action=childAction(s);$('child-action-text').textContent=tx(action[0]);$('child-icon').textContent=action[1];$('child-action').classList.toggle('highlight',action[2]);$('child-cue').textContent=t(s.pilot?.returning?'返航中':s.pilot?.turnRemaining>.1?'慢慢轉彎':s.grounded?'自動守住跑道':'助飛保持平穩');if(s.mode==='playing'&&now>=rewardUntil)voice.say(tx(childMessage(s)),`${s.lesson}:${s.pilot?.stage||s.mission.stage||s.mission.phase}:${s.mission.passed}:${action[0]}`);}
 const turnDelta=s.pilot?Math.atan2(Math.sin(s.pilot.targetHeading-s.heading),Math.cos(s.pilot.targetHeading-s.heading)):0;$('child-left').classList.toggle('active',s.pilot?.turnRemaining>0&&turnDelta<-.04);$('child-right').classList.toggle('active',s.pilot?.turnRemaining>0&&turnDelta>.04);
});
window.__flightSchool={game,voice,getState:()=>game.getState(),getLayout:()=>({stage:stage.getBoundingClientRect().toJSON(),window:$('flight-window').getBoundingClientRect().toJSON(),controls:$('flight-controls').getBoundingClientRect().toJSON()})};
// Texts the code writes itself (not bound from the menu html); redrawn after a language switch.
function paintLabels(){
 if(startLabel)$('start').querySelector('span').textContent=t('出發 · {name}',{name:t(LESSONS[selected].name)});
 $('view').textContent=t(game.world.view==='chase'?'座艙':'機外');$('instrument-toggle').textContent=t($('instrument-panel').hidden?'看儀表':'收起儀表');$('mute').textContent=t(labelMuted?'靜音':'聲音');
 if(assetState)$('asset-state').textContent=t(assetState==='ready'?'飛機已準備好':'素材載入失敗，請重新整理');if(assetState==='failed')$('boot-error').textContent=t('飛機素材沒有載入。請確認網路並重新整理頁面。');
}
function paintModeText(s){
 $('lesson-name').textContent=t(LESSONS[s.lesson].name);$('map-name').textContent=t(MAPS[s.map].name);
 if(s.mode==='paused'){$('result-tag').textContent=t('飛行暫停');$('result-title').textContent=t('休息一下。');$('result-text').textContent=t('準備好了，再繼續飛。');$('result-data').textContent='';}
 if(s.mode==='result'){$('result-tag').textContent=t(s.mission.complete?'旅程完成':'再試一次');$('result-title').textContent=t(s.mission.complete?'這趟旅程，完成了！':'再試一次就好。');$('result-text').textContent=tx(s.mission.message);$('result-data').textContent=s.mission.complete?t('得到 {score} 分・飛行 {sec} 秒',{score:s.mission.score,sec:Math.round(s.time)}):'';}
}
function showMode(s){
 if(s.mode==='menu'&&updateReady){location.reload();return;}
 $('menu').hidden=s.mode!=='menu';$('hud').hidden=s.mode==='menu';$('overlay').hidden=!['paused','result'].includes(s.mode);
 document.body.classList.toggle('flight-playing',s.mode!=='menu');$('hud').classList.toggle('preschool',s.preschool);$('child-panel').hidden=!s.preschool;$('child-cue').hidden=!s.preschool;
 paintModeText(s);
 $('drop-mail').hidden=s.preschool||s.lesson!=='mail';
 if(s.mode!=='playing')voice.stop();
 if(s.mode==='paused'){$('continue').hidden=false;$('replay').classList.remove('primary');}
 if(s.mode==='result'){$('continue').hidden=true;$('replay').classList.add('primary');if(s.mission.complete&&!runAwarded){runAwarded=true;journeyResult(document.querySelector('.result-card'),journey,s.mission.score>=85?3:s.mission.score>=60?2:1);addStars('flight',2);recordBest(`flight:${s.lesson}`,3);celebrate({text:t('飛行任務完成！'),kind:'finish',y:.25,pieces:40,big:true,sound:!readSettings().muted});}try{if(s.mission.complete){const record=JSON.parse(progressStorage.getItem('island-flight-school-record')||'{}');record[s.lesson]=Math.max(record[s.lesson]||0,s.mission.score);progressStorage.setItem('island-flight-school-record',JSON.stringify(record));}}catch{}}
 if(s.mode==='result'&&s.preschool)voice.say(tx(s.mission.message),`result:${s.lesson}:${s.mission.score}`,true);
 syncViewport();
}
document.querySelectorAll('[data-lesson]').forEach(b=>b.onclick=()=>{voice.unlock();journey=null;selected=b.dataset.lesson;document.querySelectorAll('[data-lesson]').forEach(o=>{o.classList.toggle('selected',o===b);o.setAttribute('aria-pressed',o===b);});startLabel=true;paintLabels();voice.say(t('{name}，按出發就開始。',{name:t(LESSONS[selected].name)}),`select:${selected}`,true);});
$('map-choice').onchange=e=>{game.map=e.target.value;game.world.setMap(game.map);};$('plane-choice').onchange=e=>game.plane=e.target.value;
$('start').onclick=()=>{voice.unlock();runAwarded=false;document.querySelector('.result-card .journey-result')?.remove();lastEventId=0;lastRewardEventId=0;rewardUntil=0;game.start(selected,{map:$('map-choice').value,plane:$('plane-choice').value,assist:$('assist-choice').checked,preschool:$('pilot-choice').value==='child',targets:journey?.targets});if(game.preschool)game.childControl();$('phase').textContent=t(LESSONS[selected].name);showMode(game.getState());if(game.preschool)voice.say(tx(childMessage(game.getState())),`start:${selected}`,true);};
$('pause').onclick=()=>game.pause();$('continue').onclick=()=>{voice.unlock();game.resume();};$('replay').onclick=()=>{runAwarded=false;document.querySelector('.result-card .journey-result')?.remove();lastEventId=0;lastRewardEventId=0;rewardUntil=0;game.reset();if(game.preschool)game.childControl();};$('home').onclick=()=>{journey=null;document.querySelector('.result-card .journey-result')?.remove();game.menu();$('menu').scrollTop=0;showMode(game.getState());};$('view').onclick=()=>{game.setView(game.world.view==='chase'?'cockpit':'chase');paintLabels();};$('mute').onclick=()=>updateSettings({muted:!readSettings().muted});
$('return-home').onclick=()=>{voice.unlock();if(game.getState().pilot?.returning)game.childControl();else game.returnHome();};$('instrument-toggle').onclick=()=>{const open=$('instrument-panel').hidden;$('instrument-panel').hidden=!open;$('instrument-toggle').setAttribute('aria-expanded',String(open));paintLabels();syncViewport();};
$('drop-mail').onclick=()=>{voice.unlock();game.dropMail();};
$('throttle').oninput=e=>game.controls.throttle=Number(e.target.value)/100;$('flaps').onclick=()=>game.controls.flaps=(game.controls.flaps+1)%3;
function held(id,key,value){const el=$(id);const release=e=>{game.controls[key]=0;el.classList.remove('active');if(e?.pointerId!==undefined&&el.hasPointerCapture(e.pointerId))el.releasePointerCapture(e.pointerId);};el.addEventListener('pointerdown',e=>{e.preventDefault();el.setPointerCapture(e.pointerId);game.controls[key]=value;el.classList.add('active');});el.addEventListener('pointerup',release);el.addEventListener('pointercancel',release);el.addEventListener('lostpointercapture',release);}
$('child-left').onclick=()=>{voice.unlock();game.childTurn(-1);};$('child-right').onclick=()=>{voice.unlock();game.childTurn(1);};$('child-action').onclick=()=>{voice.unlock();game.childControl();};
held('brake','brake',1);held('rudder-left','rudder',-1);held('rudder-right','rudder',1);
let stickPointer=null;const stick=$('joystick'),knob=$('stick');function moveStick(e){const r=stick.getBoundingClientRect(),x=Math.max(-1,Math.min(1,(e.clientX-r.x-r.width/2)/(r.width*.37))),y=Math.max(-1,Math.min(1,(e.clientY-r.y-r.height/2)/(r.height*.37)));game.controls.roll=x;game.controls.pitch=y;knob.style.transform=`translate(${x*r.width*.3}px,${y*r.height*.3}px)`;}
stick.onpointerdown=e=>{if(stickPointer!==null)return;e.preventDefault();stickPointer=e.pointerId;stick.setPointerCapture(e.pointerId);moveStick(e);};stick.onpointermove=e=>{if(e.pointerId===stickPointer)moveStick(e);};const releaseStick=()=>{stickPointer=null;game.controls.pitch=0;game.controls.roll=0;knob.style.transform='';};stick.onpointerup=releaseStick;stick.onpointercancel=releaseStick;stick.onlostpointercapture=releaseStick;
document.addEventListener('flight-assets',e=>{assetState=e.detail.ok?'ready':'failed';paintLabels();if(e.detail.ok){$('start').disabled=false;if(journey){selected=journey.lesson;$('map-choice').value=journey.map;$('start').click();}}else{$('boot-error').hidden=false;}});

let appliedChildMode;
function applySharedSettings(settings){
 game.preschool=settings.childMode;if(appliedChildMode!==settings.childMode)game.assist=settings.childMode;appliedChildMode=settings.childMode;game.audio.muted=settings.muted;labelMuted=settings.muted;voice.enabled=!settings.muted;if(settings.muted)voice.stop();
 $('pilot-choice').value=settings.childMode?'child':'parent';$('assist-choice').checked=game.assist;paintLabels();
 game.world.applyQuality(settings.quality);showMode(game.getState());
}
$('pilot-choice').onchange=e=>updateSettings({childMode:e.target.value==='child'});
$('assist-choice').onchange=e=>game.assist=e.target.checked;
applySharedSettings(readSettings());subscribeSettings(applySharedSettings);
onLanguageChange(()=>{paintLabels();paintModeText(game.getState());lastUpdate=0;});
syncViewport();
navigator.serviceWorker?.addEventListener('controllerchange',()=>{if(!hadWorkerAtBoot)return;updateReady=true;if(game.mode==='menu')location.reload();});

import {installArt} from "../../shared/art-refresh.js";
installArt();
import '../../shared/art-refresh.css';
