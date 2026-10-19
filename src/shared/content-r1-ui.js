import './content-r1.css';
import './content-r2.css';
import './content-r3.css';
import './content-r4.css';
import './content-r5.css';
import './content-r6.css';
import './content-r7.css';
import './content-r8.css';
import './content-r9.css';
import './content-r10.css';
import './content-r11.css';
import './content-r12.css';
import './content-r13.css';
import './content-r14.css';
import './content-r15.css';
import './content-r16.css';
import './content-r17.css';
import './content-r18.css';
import './content-r19.css';
import {ticketHint,cakeStatus} from './content-r11-scene.js';
import {queueFrame,carGround} from './content-r10-scene.js';
import {rigidCakePose,showQueue} from './content-r12-scene.js';
import {pedalState,drivingCue,crossingCue,crossingLocation,crossingTraffic,ticketMismatch,ticketSceneGeometry,queuePosition,stability,ticketDoorState,boardingCue,lessonResult,bendTravel,observation,trafficLabelPosition,landedFriends,completedCrossings,cakeShift,cakeAngle,departLabel,STOP_X,FRONT_RAIL,WHEEL_BOTTOM,DOOR_SILL} from './content-r19-scene.js';
import {grandmaFrame} from './content-r9-scene.js';
import {cakeFeedback} from './content-r7-scene.js';
import {lessonFacts} from './content-r5-feedback.js';
import {cakePose,sideWatch,cakeTask} from './content-r4-scene.js';
import {CONTENT_LESSONS,CAKE_ROUTES,CROSSING_ORDERS} from './content-r1.js';
import {ContentLesson,FRIEND_NAMES,PASSENGER_NAMES} from './content-r19.js';

import {readStudent,updateStudentSection,studentSaved} from './student-save.js';
import {readSettings} from './settings.js';
import {speakNative,stopNativeSpeech,registerGameLifecycle,registerNativeOverlay} from './native.js';
import {playChime,unlockCelebrationAudio} from './celebrate.js';
import {appUrl} from './paths.js';

const image=(path,alt='',cls='')=>`<img class="${cls}" src="${appUrl(path)}" alt="${alt}" draggable="false">`;
const icon=(name)=>{const paths={go:'M8 4L22 16 8 28Z',brake:'M7 5h6v22H7zM19 5h6v22h-6z',left:'M21 5L9 16l12 11M10 16h17',right:'M11 5l12 11-12 11M22 16H5',eye:'M2 16Q16 0 30 16Q16 32 2 16ZM20 16a4 4 0 1 1-8 0 4 4 0 1 1 8 0',door:'M5 4h22v24H5zM16 4v24M11 14v4m10-4v4',sound:'M3 12h6l7-7v22l-7-7H3zM21 10q9 6 0 12'};return `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="${paths[name]||paths.go}" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>`;};
const friendArt=(who,pose=0)=>who==='grandma'&&pose===2?'art/content-r9/grandma-2.png':who==='bike'?`art/content-r1/bike-${pose}.png`:`art/content-r7/${who}-${pose}.png`;
const lessonTitle=k=>k==='crossing'?'路口停看等':CONTENT_LESSONS[k];
const waitingArt=w=>`art/content-r10/${w}-waiting.png`;
const friendName=who=>FRIEND_NAMES[who];
const shortFriend=friendName;
const curve=side=>`<svg viewBox="0 0 32 32" aria-hidden="true" style="transform:scaleX(${side==='right'?1:-1})"><path d="M5 26V16Q5 6 16 6H27M19 1L27 6 19 13" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const shape=t=>`<svg class="ticket-shape" viewBox="0 0 64 64" aria-hidden="true"><g fill="${{blue:'#1479b8',orange:'#f46b27',green:'#58b85b'}[t.color]}" stroke="#143b61" stroke-width="4">${t.shape==='circle'?'<circle cx="32" cy="32" r="25"/>':t.shape==='triangle'?'<path d="M32 5L60 58H4Z"/>':'<rect x="8" y="8" width="48" height="48" rx="5"/>'}</g></svg>`;

export function installContentLessons(){
 const host=document.querySelector('.welcome');if(!host)return;
 const opener=document.createElement('button');opener.id='content-start';opener.textContent='海岸實作課';host.append(opener);
 const dialog=document.createElement('dialog');dialog.id='content-r1';dialog.setAttribute('aria-label','海岸實作課');
 dialog.innerHTML=`<header class="content-header"><button id="content-back">回學院</button><h2 id="content-title">海岸實作課</h2><button id="content-pause">休息</button></header><section id="content-picker"><div class="content-picker-guide">${image('art/r8/coach-safe-window.png','阿路教練陪你選課')}<p>選一張車票<br><strong>和阿路一起出發</strong></p></div>${Object.entries(CONTENT_LESSONS).map(([k,v])=>`<button data-content="${k}">${image(k==='cake'?'art/content-r1/cake.png':k==='crossing'?'art/content-r1/grandma-0.png':'art/r6/train.png')}<span>${lessonTitle(k)}</span><em>${{cake:'按住、放開，讓蛋糕坐穩',crossing:'停下看左右，等朋友過街',tickets:'形狀和顏色一樣，再開門'}[k]}</em><small data-record="${k}"></small></button>`).join('')}</section><section id="content-play" hidden><div class="content-scene" aria-label="海岸練習場"><svg class="content-road" viewBox="0 0 600 400" preserveAspectRatio="none" aria-hidden="true"><path d="M300 420 Q100 220 300 180T300 -20" stroke="#1479b8" stroke-width="90" fill="none"/><path d="M300 420 Q100 220 300 180T300 -20" stroke="#fff1c9" stroke-width="76" fill="none"/><path d="M300 420 Q100 220 300 180T300 -20" stroke="#1479b8" stroke-width="3" stroke-dasharray="14 12" fill="none"/></svg><div class="content-zebra" aria-hidden="true"></div>${image('art/r7/car-rear.png','海藍汽車','content-car')}${image('art/r8/train-platform.png','藍黃列車車輪停在軌道上','content-train')}<div class="content-cake">${image('art/content-r1/cake.png','生日蛋糕')}${image('art/content-r1/flag.png','小旗隨操作傾斜','cake-flag')}</div><div class="content-ticket"></div><div class="content-walker"></div><div class="content-passengers"></div>${image('art/r8/coach-safe-window.png','阿路在車窗內繫好安全帶','content-coach')}<div class="content-stamps" aria-label="完成動作"></div><div class="content-route" aria-label="旅程進度"><i></i><i></i><i></i></div><div class="content-scene-cue"></div></div><div class="content-work"><p id="content-hint" role="status" aria-live="polite"></p><div id="content-controls"></div><p id="content-save"></p></div></section><section id="content-rest" hidden><h2>休息一下</h2><button id="content-resume">繼續練習</button><button id="content-leave">回學院</button></section>`;
 document.body.append(dialog);const $=id=>dialog.querySelector(`#content-${id}`);let lesson,last=0,raf=0,drawAt=0,spoken='',phase='';
 // Keep the cake and its carrier in one moving coordinate system.
 const scene=dialog.querySelector('.content-scene'),car=scene.querySelector('.content-car'),cake=scene.querySelector('.content-cake');
 const carrier=document.createElement('div');carrier.className='content-carrier';car.src=appUrl('art/content-r11/car-rear.png');car.alt='背向鏡頭，沿道路前進的海藍汽車';car.before(carrier);carrier.append(car,cake);
 const cream=document.createElement('div');cream.className='cake-cream';cream.innerHTML=image('art/content-r1/cake.png');cake.append(cream);
 const fruit=document.createElement('div');fruit.className='cake-fruit';fruit.innerHTML=image('art/content-r1/cake.png');cake.append(fruit);
 const correction=document.createElement('div');correction.className='cake-correction';carrier.append(correction);
 const route=document.createElement('div');route.className='cake-route-map';scene.append(route);
 const roster=document.createElement('div');roster.className='crossing-roster';scene.append(roster);
 const arrived=document.createElement('div');arrived.className='crossing-arrived';scene.append(arrived);
 const force=document.createElement('div');force.className='content-force';force.setAttribute('aria-label','蛋糕力道');scene.append(force);
 const roadSign=document.createElement('div');roadSign.className='content-road-sign';scene.append(roadSign);
 const intro=document.createElement('div');intro.className='content-intro';intro.innerHTML=image('art/r8/coach-safe-window.png','阿路教練繫好安全帶')+'<span>阿路陪你練習</span>';scene.append(intro);
 $('rest').insertAdjacentHTML('afterbegin',image('art/r8/coach-safe-window.png','阿路陪你休息','content-rest-coach')+'<p id="content-rest-progress"></p>');
 const vehicle=document.createElement('div');vehicle.className='ticket-vehicle';scene.querySelector('.content-train').before(vehicle);vehicle.append(scene.querySelector('.content-train'));
 const seats=document.createElement('div');seats.className='ticket-seats';vehicle.append(seats);
 const door=document.createElement('div');door.className='ticket-door';door.innerHTML='<i></i><i></i>';vehicle.append(door);
 const counts=document.createElement('div');counts.className='ticket-counts';scene.append(counts);
 const platformSegments=document.createElement('div');platformSegments.className='ticket-platform-segments';scene.append(platformSegments);
 const queuePath=document.createElementNS('http://www.w3.org/2000/svg','svg');queuePath.classList.add('ticket-queue-path');queuePath.setAttribute('viewBox','0 0 100 100');queuePath.setAttribute('preserveAspectRatio','none');scene.append(queuePath);
 const bridge=document.createElement('div');bridge.className='ticket-boarding-bridge';scene.append(bridge);
 const ticketZoom=document.createElement('div');ticketZoom.className='ticket-closeup';ticketZoom.hidden=true;scene.append(ticketZoom);
 const stations=document.createElement('div');stations.className='content-stations';scene.append(stations);
 const finale=document.createElement('div');finale.className='content-finale';scene.append(finale);
 const watch=document.createElement('div');watch.className='content-observe';scene.append(watch);
 const panorama=document.createElement('div');panorama.className='crossing-panorama';scene.prepend(panorama);
 const lookout=document.createElement('div');lookout.className='crossing-lookout';scene.append(lookout);
 const task=document.createElement('div');task.className='cake-task';scene.append(task);
 const arrival=document.createElement('div');arrival.className='ticket-arrival';scene.append(arrival);
 const comparison=document.createElement('div');comparison.className='ticket-comparison';scene.append(comparison);
 const bay=document.createElementNS('http://www.w3.org/2000/svg','svg');bay.classList.add('cake-bay-mark');bay.setAttribute('viewBox','0 0 160 75');bay.setAttribute('preserveAspectRatio','none');bay.innerHTML='<rect x="6" y="4" width="148" height="67" rx="7" fill="#ffffff15" stroke="#1479b8" stroke-width="4" stroke-dasharray="12 5"/>';bay.setAttribute('aria-label','路面臨停灣位');scene.append(bay);
 const facts=document.createElement('div');facts.className='content-facts';$('hint').after(facts);
 const result=document.createElement('div');result.className='lesson-result';facts.before(result);
 const closeup=document.createElement('div');closeup.className='cake-closeup';closeup.setAttribute('aria-label','放大蛋糕：三層隨起步、轉彎、煞車晃動');closeup.innerHTML='<div class="cake-stack"><div class="cake-fixed-level"></div><div class="cake-rigid">'+['base','middle','top','pick'].map(k=>image(`art/content-r7/cake-${k}.png`,'',`cake-layer cake-${k}`)).join('')+'<div class="cake-level-line"></div><span class="cake-flag-tip"></span></div></div>';scene.append(closeup);
 const miniature=closeup.firstElementChild.cloneNode(true);miniature.classList.add('cake-miniature');cake.append(miniature);
 const roadView=document.createElement('div');roadView.className='cake-road-view';scene.append(roadView);
 const timing=document.createElement('div');timing.className='cake-timing';roadView.append(timing);
 const recovery=document.createElement('div');recovery.className='cake-recovery';roadView.append(recovery);
 const sharing=document.createElement('div');sharing.className='cake-sharing';sharing.innerHTML=[1,2,3].map(n=>image(`art/r5/passenger-${n}-0.png`,'朋友來分享蛋糕')).join('');roadView.append(sharing);
 const checks=document.createElement('div');checks.className='crossing-checks';scene.append(checks);
 const traffic=document.createElement('div');traffic.className='crossing-traffic';traffic.innerHTML=image('art/r6/car.png','來車通過中，請在線後等待')+'<b>來車</b>';scene.append(traffic);
 const decision=document.createElement('div');decision.className='crossing-decision';scene.append(decision);
 const crossDirection=document.createElement('div');crossDirection.className='crossing-direction';scene.append(crossDirection);
 const viewCone=document.createElementNS('http://www.w3.org/2000/svg','svg');viewCone.classList.add('driver-view');viewCone.setAttribute('viewBox','0 0 100 100');viewCone.setAttribute('preserveAspectRatio','none');viewCone.setAttribute('aria-label','駕駛觀察的道路範圍');scene.append(viewCone);

 const routeProof=document.createElement('div');routeProof.className='lesson-route-proof';scene.append(routeProof);
 opener.innerHTML=image('art/content-r1/cake.png')+'<span>海岸實作課<small id="content-home-progress"></small></span>';
 const wrongStation=g=>g.kind==='tickets'&&g.phase==='playing'&&g.selected>=0&&!g.matched&&g.distance>=28&&g.speed===0;
 const records=()=>readStudent().sections.contentR1||{};
 function homeProgress(){const n=Object.values(records()).filter(r=>r?.completed).length;document.getElementById('content-home-progress').textContent=`獨立・${n}／3 課`;opener.querySelector('span').firstChild.textContent=n===3?'再玩海岸實作課':'海岸實作課';opener.dataset.completed=String(n);}
 addEventListener('studentchange',homeProgress);homeProgress();
 function announce(text,force=false){if(text!==spoken||force){spoken=text;if(!readSettings().muted)void speakNative(text,{rate:.78});}}
 function persist(){const all=records(),snapshot=lesson.snapshot();snapshot.started=all[lesson.kind]?.started===true||snapshot.started;if(!all[lesson.kind]?.completed||snapshot.completed)all[lesson.kind]=snapshot;updateStudentSection('contentR1',all);$('save').textContent=studentSaved()?(['done','checkpoint'].includes(lesson.phase)?'旅程已保存':''):'這次無法儲存，仍可繼續玩。';}
 function button(action,text,glyph,hold=false){return `<button data-action="${action}" ${hold?'data-hold="true"':''}>${icon(glyph)}<span>${text}</span></button>`;}
 function render(){if(!lesson)return;dialog.dataset.kind=lesson.kind;dialog.dataset.phase=lesson.phase;dialog.dataset.stage=String(lesson.stage);dialog.dataset.rough=String(lesson.balancePractice?cakeStatus(lesson)==='danger'||lesson.assisting:lesson.rough||lesson.assisting);
  const feedback=cakeFeedback(lesson),cue=drivingCue(lesson);scene.dataset.boardTime=lesson.boardTime.toFixed(3);scene.dataset.doorStage=lesson.doorStage;scene.dataset.boardingIndex=String(lesson.boardingIndex);scene.dataset.hazard=String(lesson.hazardStop);scene.dataset.wrongTurn=String(lesson.inBend&&(lesson.wrongHeld||lesson.wrongTurnNotice>0));scene.dataset.inBend=String(lesson.inBend);scene.dataset.cue=cue.action;scene.dataset.settled=String(feedback.settled);scene.dataset.correction=feedback.direction;
  for(const el of [carrier,bay])if(el.parentElement!==(lesson.kind==='cake'?roadView:scene))(lesson.kind==='cake'?roadView:scene).append(el);
  if(scene.clientHeight>0)scene.dataset.compact=String(scene.clientHeight<360);scene.dataset.targetName=lesson.target.name;scene.dataset.layoutSeed=String(lesson.layoutSeed||0);scene.dataset.distance=lesson.distance.toFixed(2);scene.dataset.speed=lesson.speed.toFixed(2);scene.dataset.bend=String(lesson.bend);scene.dataset.tilt=lesson.tilt.toFixed(2);scene.dataset.sway=lesson.sway.toFixed(2);scene.dataset.acceleration=lesson.acceleration.toFixed(2);scene.dataset.bayStopped=String(lesson.bayStopped);scene.dataset.bayRestarted=String(lesson.bayRestarted);scene.dataset.leftTurn=String(lesson.turns.left>=.2);scene.dataset.rightTurn=String(lesson.turns.right>=.2);scene.dataset.focus=lesson.focus;scene.dataset.crossTime=lesson.crossTime.toFixed(3);scene.dataset.crossDuration=String(lesson.crossingDuration);scene.dataset.orderHint=lesson.orderHint;scene.dataset.fruitSway=lesson.fruitSway.toFixed(2);scene.dataset.flagSway=lesson.flagSway.toFixed(2);
  const done=lesson.phase==='done',checkpoint=lesson.phase==='checkpoint',ready=lesson.phase==='ready',playing=lesson.phase==='playing';
  dialog.dataset.guided=String(lesson.stage===0&&!(lesson.layoutSeed||0));
  const doorMode=lesson.kind==='tickets'&&lesson.phase==='boarding'?lesson.doorStage:'';
  if((playing||lesson.phase==='boarding')&&studentSaved())$('save').textContent='';
  const crossCue=crossingCue(lesson),summary=lessonResult(lesson);
  result.hidden=!done;result.innerHTML=done?`<strong>${summary.learned}</strong>`:'';
  scene.dataset.balanceLean=(lesson.balanceLean||0).toFixed(2);scene.dataset.balanceStatus=cakeStatus(lesson);scene.dataset.recoveries=String(lesson.facts.recoveries);scene.dataset.assists=String(lesson.facts.assists);
  facts.hidden=!(done||checkpoint);facts.innerHTML=done||checkpoint?(lesson.kind==='tickets'?[{glyph:'door',text:`全程 ${lesson.facts.boarded} 位坐好`},{glyph:'eye',text:`自己改選 ${lesson.facts.reselections} 次`},{glyph:'brake',text:'停穩才開門'}]:lessonFacts(lesson).map(f=>({...f,text:lesson.kind==='crossing'?f.text.replace('出發提醒','安全提醒'):f.text}))).map(f=>`<span>${icon(f.glyph)}<b>${f.text}</b></span>`).join(''):'';
  scene.dataset.assisting=String(!!lesson.assisting);scene.dataset.crossed=String(lesson.crossed);scene.dataset.lookedLeft=String(lesson.looked.left);scene.dataset.lookedRight=String(lesson.looked.right);
  intro.hidden=!ready;
  const hints={cake:lesson.distance>=55?'到了！按住煞車，慢慢停。':lesson.distance>15&&lesson.distance<40?`前面${lesson.bend>0?'右':'左'}彎，輕輕轉。`:'按住踏板起步，放開放慢。',crossing:lesson.speed>0?'按住煞車，停在線前。':!lesson.looked.left||!lesson.looked.right?'停穩了，看左邊、看右邊。':lesson.needsDecision?`朋友在${lesson.decisionSide==='left'?'左':'右'}邊，再看一次。`:lesson.crossed<3?'停一停，看一看，等朋友過完。':'路口空了，可以出發。',tickets:lesson.phase==='boarding'?(lesson.boardTime>=1.2?'三位坐好了，門關好了 ✓':'朋友慢慢上車，等一等。'):!lesson.matched?'看車票，找一樣的月台。':lesson.distance<28?'按住前進，去月台。':lesson.speed>0?'到站了，按住煞車。':'停穩了，開門接朋友。'};
  const ending={cake:'蛋糕送到了！一起分享。',crossing:'謝謝你等我們！朋友揮揮手。',tickets:'大家坐好了！一起去旅行。'};
  const hint=ticketHint(lesson,done?ending[lesson.kind]:checkpoint?{cake:'這段路練好了，去下一站。',crossing:'朋友都過街了，去下個路口。',tickets:'朋友坐好了，去下一站。'}[lesson.kind]:ready?{cake:['按住起步，放開放慢。','先左彎，再右彎。','到臨停灣，停穩再起步。'][lesson.stage],crossing:'停下看左右，等朋友都過完。',tickets:'點月台站牌，停穩再開門。'}[lesson.kind]:lesson.kind==='cake'?cue.text:lesson.kind==='crossing'&&lesson.trafficActive&&lesson.looked.left&&lesson.looked.right?'來車通過中，先等一等。':lesson.hint||hints[lesson.kind]);
  const currentHint=done?'':lesson.kind==='crossing'&&['playing','departing'].includes(lesson.phase)?crossCue.text:lesson.phase==='delivering'?cue.text:lesson.kind==='tickets'&&lesson.phase==='boarding'?boardingCue(lesson).text:lesson.kind==='tickets'&&lesson.phase==='departing'?'出發中，前往'+(lesson.stage===2?'海邊終點。':'下一站。'):wrongStation(lesson)?ticketMismatch(lesson):hint;
  if($('hint').textContent!==currentHint){$('hint').textContent=currentHint;announce(currentHint);}
  $('title').textContent=lessonTitle(lesson.kind);
  const crossingWait=lesson.kind==='crossing'&&playing&&!crossCue.action;
  const signature=`${lesson.phase}:${lesson.kind}:${doorMode}:${crossingWait}:${lesson.chosenPassenger}`;
  if(phase!==signature){phase=signature;let controls='';
   if(ready)controls=button('begin','一起出發','go');
   else if(done)controls=button('replay','再玩一次','go')+button('picker','換一課','left');
   else if(checkpoint)controls=button('next','下一站','go');
   else if(lesson.kind==='tickets'&&lesson.phase==='boarding'){const b=boardingCue(lesson);controls=b.action?button(b.action,b.label,b.action==='train-depart'?'go':'door'):button('status',b.label,'door').replace('<button ','<button disabled ');}
   else if(lesson.phase==='departing'&&lesson.kind==='crossing')controls=(button('brake','停下','brake',true)+button('look-left','左邊看過','eye')+button('look-right','右邊看過','eye')+button('depart','正在出發','go')).replaceAll('<button ','<button disabled ');
   else if(lesson.phase==='departing'||lesson.phase==='delivering')controls=button('status',lesson.phase==='delivering'?'正在送達':'正在出發','go').replace('<button ','<button disabled ');
   else if(playing&&lesson.kind==='cake')controls=button('left','左轉','left',true)+button('right','右轉','right',true)+button('go','踏板','go',true)+button('brake','煞車','brake',true);
   else if(playing&&lesson.kind==='crossing')controls=button('brake','停下','brake',true)+button('look-left','看左','eye')+button('look-right','看右','eye')+button('depart','出發','go');
   else if(playing&&lesson.kind==='tickets')controls=button('go','前進','go',true)+button('brake','停穩','brake',true)+button('door','開門','door');
   $('controls').innerHTML=controls+(done?'':button('listen','再聽一次','sound'));bindHolds();
  }
  if(lesson.kind==='cake')for(const side of ['left','right','go','brake']){const b=dialog.querySelector(`[data-action="${side}"]`);if(b){b.dataset.needed=String(playing&&cue.action===side);b.dataset.held=String(!!lesson.input[side]&&!lesson.recoveryLocked);b.dataset.recovering=String(lesson.recoveryLocked);b.setAttribute('aria-disabled',String(lesson.recoveryLocked));b.querySelector('svg').outerHTML=icon(side);if(['left','right'].includes(side))b.querySelector('span').textContent=side==='left'?'左轉':'右轉';if(side==='go'){const pedal=pedalState(lesson,cue);b.dataset.release=String(!!cue.release);b.dataset.pedal=pedal.state;b.querySelector('span').textContent=pedal.text;}}}
  const pose={...cakePose(lesson),...carGround(done&&lesson.kind==='cake'?{...lesson,distance:47}:lesson)},reducedMotion=readSettings().reducedMotion||matchMedia('(prefers-reduced-motion:reduce)').matches;
  if(lesson.kind==='cake'&&lesson.recoveryLocked)for(const b of dialog.querySelectorAll('#content-controls [data-hold]'))b.querySelector('span').textContent='等待回穩';
  else if(lesson.kind==='cake'){const brake=dialog.querySelector('[data-action=brake] span');if(brake)brake.textContent='煞車';}
  if(lesson.kind==='cake'&&lesson.stage===1)pose.x=bendTravel(lesson);
  const angle=cakeAngle(lesson);closeup.dataset.warning=String(Math.abs(angle)>15);closeup.dataset.offset=angle.toFixed(2);
  if(lesson.kind==='cake'&&closeup.clientWidth>0){const fit=Math.min((closeup.clientWidth-8)/240,(closeup.clientHeight-8)/196);closeup.style.setProperty('--cake-fit',String(fit));closeup.style.setProperty('--cake-inset-y',`${(closeup.clientHeight/fit-180)/2}px`);}
  for(const stack of [closeup,miniature])stack.querySelector('.cake-rigid').style.transform=`translateX(${cakeShift(lesson)}px) rotate(${angle}deg)`;
  scene.dataset.decision=String(lesson.needsDecision);scene.dataset.confirmed=String(!!lesson.friendConfirmed);scene.dataset.confirmDelay=String(lesson.confirmDelay);scene.dataset.person=lesson.crossingPerson||'';
  decision.textContent='';
  routeProof.innerHTML=done?[0,1,2].map(i=>`<div><b>✓</b><span>第 ${i+1} 站</span></div>`).join(''):'';
  dialog.querySelector('.cake-flag').style.transform=`translateX(${pose.fruit*.4}px) rotate(${pose.flag}deg) skewX(${pose.bend}deg)`;
  cake.style.transform='none';
  cream.style.transform=`translateX(${pose.cream}px) rotate(${lesson.sway*.6}deg)`;fruit.style.transform=`translateX(${pose.fruit}px) rotate(${lesson.fruitSway*1.1}deg)`;
  correction.innerHTML=lesson.kind==='cake'?(!feedback.settled?curve(feedback.direction):'<svg viewBox="0 0 32 32"><path d="M5 17l8 8L27 7" fill="none" stroke="currentColor" stroke-width="5"/></svg>'): '';correction.dataset.warning=String(!feedback.settled);correction.dataset.direction=feedback.direction;
  route.innerHTML=lesson.kind==='cake'?(lesson.stage===1?`<span data-met="${lesson.turns.left>=.2}">←</span><b>→</b><span data-met="${lesson.turns.right>=.2}">→</span>`:lesson.stage===2?`<span data-met="${lesson.bayStopped}">${icon('brake')}</span><b>→</b><span data-met="${lesson.bayRestarted}">${icon('go')}</span>`:''):'';
  const departing=Math.min(1,(lesson.departureTime||0)/1.5);
  carrier.style.transform=lesson.kind==='cake'?`translate(${pose.x*roadView.clientWidth}px,${pose.y*roadView.clientHeight-(lesson.phase==='delivering'?departing*Math.max(150,roadView.clientHeight*.48):0)}px) scale(${pose.scale})`:lesson.kind==='crossing'&&lesson.phase==='departing'?`translateY(${-departing*Math.max(150,scene.clientHeight*.48)}px)`:`translateX(${lesson.steer*18}px)`;
  car.style.setProperty('--car-turn',`${lesson.kind==='cake'&&lesson.inBend?lesson.steer*10:0}deg`);
  roadView.style.setProperty('--road-travel',`${-lesson.distance*5}px`);
  task.textContent='';
  timing.innerHTML=lesson.kind==='cake'?`<b>${lesson.inBend?`<span class="cake-lane-arrow">${lesson.bend<0?'↰':'↱'}</span>${lesson.bend<0?'左彎':'右彎'}`:lesson.stage===0?'坡頂・放開放慢':lesson.stage===1?'彎道前・慢慢起步':'路旁休息區'}</b>`:'';
  timing.dataset.active=String(playing&&lesson.inBend&&!!cue.action);
  recovery.textContent=lesson.kind==='cake'&&playing&&feedback.settled&&!lesson.bayStopped&&lesson.distance<42&&(lesson.recoveryNotice||0)>0?'✓ 蛋糕坐穩了':'';
  task.dataset.left=String(lesson.turns.left>=.2);task.dataset.right=String(lesson.turns.right>=.2);
  panorama.style.transform='none';
  const trafficPose=crossingTraffic(lesson);traffic.style.setProperty('--label-left',`${trafficLabelPosition(lesson,scene.clientWidth,traffic.querySelector('b').offsetWidth||44)-trafficPose.x*scene.clientWidth/100+traffic.offsetWidth/2}px`);traffic.hidden=lesson.kind!=='crossing'||!playing||!lesson.trafficActive||lesson.focus==='center'||lesson.crossTime>0;traffic.style.left=`${trafficPose.x}%`;traffic.style.top=`${trafficPose.top}%`;traffic.querySelector('img').style.scale=trafficPose.reverse?'-1 1':'1';scene.dataset.trafficActive=String(!!lesson.trafficActive);scene.dataset.trafficTime=(lesson.trafficTime||0).toFixed(2);
  const observed=observation(lesson);
  traffic.style.setProperty('--label-top',`${-scene.clientHeight*.03-18}px`);
  viewCone.innerHTML=lesson.kind==='crossing'&&observed?`<path d="M50 87 L${observed.x} ${observed.y}"/><ellipse cx="${observed.x}" cy="${observed.y}" rx="13" ry="7"/>`:'';
  lookout.replaceChildren();
  if(lesson.kind==='crossing'&&observed){
   lookout.innerHTML=`<b>${lesson.focus==='left'?'看左邊':'看右邊'}</b><span>${observed.target}</span>`;
   lookout.dataset.side=lesson.focus;
  }
  const warning=lesson.kind==='cake'&&cue.release===true;
  const meter=stability(lesson);
  force.innerHTML=lesson.kind==='cake'?`<div class="force-readout"><strong>${meter.status}</strong><div class="force-meter" data-tone="${meter.tone}" role="meter" aria-label="穩定度，虛線是坐穩位置" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${meter.fill}"><i style="width:${meter.fill}%"></i></div><small>${lesson.recoveryLocked?'蛋糕往中央回來':lesson.inBend?'看路牌，照顧蛋糕':'慢慢前進，蛋糕坐穩'}</small></div>`:'';
  roadSign.innerHTML=lesson.kind==='cake'?`<svg viewBox="0 0 120 70" aria-hidden="true"><path d="${lesson.inBend?(lesson.bend>0?'M40 65V40Q40 18 75 18H100':'M80 65V40Q80 18 45 18H20'):['M10 60L110 15','M10 60C10 5 100 65 70 10S110 20 110 5','M10 55H85V15'][lesson.stage]}" fill="none" stroke="#143b61" stroke-width="10" stroke-linecap="round"/><path d="M85 5h24v24" fill="none" stroke="#58b85b" stroke-width="7" style="display:${lesson.inBend?'none':'block'}"/></svg><span>${lesson.distance>=55?'慢慢停':lesson.distance>15&&lesson.distance<40?(lesson.bend>0?'右彎 →':'← 左彎'):['按住起步','左右連彎','臨停再起步'][lesson.stage]}</span>`:'';
  dialog.querySelector('.content-stamps').innerHTML=lesson.kind==='cake'?['start','turn','stop'].map((k,i)=>`<span class="${lesson.skills[k]||lesson.smooth[k]>.25?'earned':''}">${icon(['go','right','brake'][i])}</span>`).join(''):'';
  dialog.querySelectorAll('.content-route i').forEach((el,i)=>el.classList.toggle('complete',lesson.kind==='crossing'?i<completedCrossings(lesson):i<lesson.stage||done||checkpoint&&i===lesson.stage));
  dialog.querySelector('.content-scene-cue').textContent=done?summary.title:`第 ${lesson.stage+1} 站・`+(lesson.kind==='cake'?CAKE_ROUTES[lesson.stage]:lesson.kind==='crossing'?['海風斑馬線','榕樹巷口','燈塔小徑'][lesson.stage]:lesson.target.name+'車票');
  dialog.querySelector('.content-ticket').innerHTML=lesson.kind==='tickets'?shape(lesson.target):'';
  // The three actual station signs are the matching controls, not a second row of shape buttons.
  const stationPositions=ticketSceneGeometry(lesson,scene.clientWidth).markers,stationKey=`${lesson.kind}:${lesson.stage}:${playing}:${scene.clientWidth<300}`;
  if(stations.dataset.key!==stationKey){stations.dataset.key=stationKey;stations.innerHTML=lesson.kind==='tickets'?lesson.platforms.map((t,i)=>`<button data-platform="${i}" aria-label="${t.name}月台" style="left:${stationPositions[i]}%" ${!playing?'disabled':''}>${shape(t)}<span>${i+1} 號月台</span></button>`).join(''):'';}
  dialog.querySelectorAll('[data-platform]').forEach(b=>{const selected=Number(b.dataset.platform)===lesson.selected;b.setAttribute('aria-pressed',String(selected));b.dataset.wrong=String(selected&&wrongStation(lesson));b.dataset.choose=String(wrongStation(lesson));b.dataset.arrived=String(selected&&lesson.matched&&lesson.distance>=28&&lesson.speed===0);b.style.setProperty('--pole-height',`${Math.max(0,scene.getBoundingClientRect().top+scene.clientHeight*.73-b.getBoundingClientRect().bottom)}px`);b.querySelector('span').innerHTML=`${Number(b.dataset.platform)+1} 號月台`+(b.dataset.wrong==='true'?'<small>你選的<br>不對</small>':b.dataset.arrived==='true'?'<small>✓ 停對了</small>':'');});
  const wrong=lesson.kind==='tickets'&&playing&&lesson.selected>=0&&!lesson.matched&&lesson.distance>=28&&lesson.speed===0;
  if(lesson.kind==='tickets'){const db=dialog.querySelector('[data-action=door]');if(db){db.disabled=!playing||wrong||!lesson.matched||lesson.distance<28||lesson.speed>0;db.querySelector('span').textContent=wrong?'門不能開':'開門';}}
  if(lesson.kind==='tickets')for(const b of dialog.querySelectorAll('#content-controls [data-action]'))b.dataset.needed=String(playing&&!wrong&&b.dataset.action===(lesson.speed>0&&lesson.distance>=28?'brake':lesson.distance<28&&lesson.selected>=0?'go':lesson.matched?'door':''));
  for(const action of ['board','retract','close-door','train-depart','next']){const b=dialog.querySelector(`[data-action=${action}]`);if(b)b.dataset.needed='true';}
  comparison.innerHTML=wrong?`<div>${shape(lesson.target)}<span>車票</span></div><b>≠</b><div>${shape(lesson.platforms[lesson.selected])}<span>這站</span></div><strong>${icon('brake')}門關著，再找找</strong>`:'';
  // Scene signs remain the source of truth after arrival; no leftover floating ticket.
  scene.querySelector('.content-ticket').hidden=lesson.kind!=='tickets';
  scene.querySelector('.content-ticket').setAttribute('aria-label',`本站車票：${lesson.target.name}`);
  watch.innerHTML=lesson.kind==='crossing'?`路口完成 ${completedCrossings(lesson)}/3<small>本站到岸 ${landedFriends(lesson)}/3 人</small>`:'';
  watch.setAttribute('role','status');
  for(const side of ['left','right']){const b=dialog.querySelector(`[data-action="look-${side}"]`);if(b){b.dataset.checked=String(lesson.looked[side]);b.dataset.wrongLook=String(lesson.wrongLook===side);b.querySelector('span').textContent=lesson.looked[side]?(side==='left'?'左邊看過':'右邊看過'):side==='left'?'看左':'看右';}}
  if(lesson.kind==='crossing')for(const b of dialog.querySelectorAll('#content-controls [data-action]'))b.dataset.needed=String(playing&&b.dataset.action===crossCue.action);
  if(lesson.kind==='crossing')for(const b of dialog.querySelectorAll('#content-controls [data-action]'))b.dataset.wait=String(playing&&!crossCue.action&&b.dataset.action!=='listen');
  scene.dataset.watchSide=lesson.kind==='crossing'&&lesson.focus!=='center'?lesson.focus:'';
  checks.innerHTML='';
  const depart=dialog.querySelector('[data-action=depart]');if(depart){depart.disabled=!lesson.canDepart||lesson.phase==='departing';depart.querySelector('span').textContent=departLabel(lesson);depart.dataset.ready=String(lesson.canDepart);depart.setAttribute('aria-disabled',String(!lesson.canDepart));depart.setAttribute('aria-description',lesson.canDepart?'路口空了，可以出發':'等朋友過完才可出發');}
  const walker=dialog.querySelector('.content-walker');walker.replaceChildren();walker.hidden=true;
  const reduced=readSettings().reducedMotion||matchMedia('(prefers-reduced-motion:reduce)').matches;
  if(lesson.kind==='crossing'&&lesson.crossed<3){const who=lesson.crossingPerson,pose=reduced?0:who==='grandma'?grandmaFrame(lesson.crossTime/lesson.crossingDuration):Math.floor(lesson.crossTime*3)%2,pos=crossingLocation(who,'crossing',lesson.crossTime/lesson.crossingDuration,lesson.stage);walker.innerHTML=image(friendArt(who,pose),friendName(who));walker.dataset.person=who;walker.dataset.pose=String(pose);walker.innerHTML+=`<i class="friend-number">${CROSSING_ORDERS[lesson.stage].indexOf(who)+1} ${shortFriend(who)}</i>`;walker.hidden=lesson.crossTime===0;walker.style.left=`${pos.x}%`;walker.style.bottom=`${pos.bottom}%`;walker.style.scale='1';walker.querySelector('img').style.scale=lesson.stage===1?'-1 1':'1';}
  if(lesson.kind==='crossing'){
   const order=CROSSING_ORDERS[lesson.stage];
   const start=lesson.stage===1?88:12,end=100-start;
   crossDirection.innerHTML=`<span style="left:${start}%">起點</span><span class="crossing-arrow" aria-label="過街方向${start<end?'向右':'向左'}">${start<end?'→':'←'}</span><span style="left:${end}%">對岸 ✓</span>`;
   roster.replaceChildren();
   arrived.innerHTML=order.slice(0,lesson.crossed).map(w=>{const pos=crossingLocation(w,'arrived',0,lesson.stage);return `<div data-arrived-friend="${w}" style="left:${pos.x}%;bottom:${pos.bottom}%">${image(w==='grandma'?friendArt(w,2):waitingArt(w),friendName(w)+'已到對側')}<i class="friend-number">${order.indexOf(w)+1} ${shortFriend(w)}</i><b>✓</b></div>`;}).join('');
   panorama.innerHTML=order.slice(lesson.crossed).filter(w=>w!==lesson.crossingPerson||lesson.crossTime===0).map(w=>{const pos=crossingLocation(w,'waiting',0,lesson.stage);return `<div class="crossing-waiting"><div data-waiting="${w}" style="left:${pos.x}%;bottom:${pos.bottom}%">${image(waitingArt(w),friendName(w)+'站在線後等候')}<i class="friend-number">${order.indexOf(w)+1} ${shortFriend(w)}</i><b>等一等</b></div></div>`;}).join('');
   scene.querySelector('.content-coach').src=appUrl('art/content-r11/car-rear.png');scene.querySelector('.content-coach').alt='阿路的車尾朝玩家，車頭朝路口';scene.querySelector('.content-coach').style.translate=lesson.phase==='departing'?`0 ${-departing*Math.max(150,scene.clientHeight*.48)}px`:'none';
  }else{panorama.replaceChildren();roster.replaceChildren();roster.dataset.stage='';arrived.replaceChildren();crossDirection.replaceChildren();}
  const train=dialog.querySelector('.content-train'),geometry=ticketSceneGeometry(lesson,scene.clientWidth),drawX=geometry.x+(lesson.kind==='tickets'&&lesson.phase==='departing'?Math.min(1,lesson.departureTime/1.5)*Math.max(42,150/scene.clientWidth*100):0);train.src=appUrl('art/content-r3/train-side.webp');train.alt=lesson.selected<0?'等待選月台的列車':`${lesson.platforms[lesson.selected].name}月台的列車`;vehicle.style.left=`${drawX}%`;vehicle.dataset.x=drawX.toFixed(2);
  vehicle.style.top=lesson.kind==='tickets'?`${scene.clientHeight*(scene.clientHeight<360?.98:FRONT_RAIL)-vehicle.offsetHeight*WHEEL_BOTTOM}px`:'';
  platformSegments.innerHTML=lesson.kind==='tickets'?lesson.platforms.map((t,n)=>n===lesson.selected?`<span data-stop="${n}" style="left:${geometry.markers[n]}%"><b>${n+1}</b></span>`:'').join(''):'';
   const passengers=dialog.querySelector('.content-passengers'),boarding=lesson.phase==='boarding',seated=checkpoint||done||lesson.phase==='departing',waiting=lesson.selected>=0&&lesson.distance>=28;
  const doors=ticketDoorState(lesson);
  queuePath.innerHTML='';
   const visibleFriends=lesson.kind==='tickets';
  bridge.hidden=doors.step===0;bridge.style.cssText=`left:${(geometry.door-8)*scene.clientWidth/100}px;top:${vehicle.offsetTop+vehicle.offsetHeight*DOOR_SILL-2}px;width:${scene.clientWidth*.16}px;transform:translateY(${(1-doors.step)*-18}px) scaleY(${doors.step});`;
   seats.innerHTML=visibleFriends?[0,1,2].map(n=>{const state=queueFrame(lesson.boardTime,n,seated);return state.seated||state.inside?`<div class="ticket-seated" data-friend="${n}" data-entering="${!state.seated}" style="left:${state.seated?13+n*21:69.5+(13+n*21-69.5)*Math.max(0,Math.min(1,(state.progress-.72)/.28))}%">${image(done?`art/content-r16/passenger-${n+1}-wave.webp`:`art/r5/passenger-${n+1}-0.png`,done?PASSENGER_NAMES[n]+'在車窗內揮手':state.seated?'乘客已坐好':'朋友走進車廂找座位')}</div>`:'';}).join(''):'';
  passengers.innerHTML=visibleFriends?[0,1,2].map(n=>{const state=queueFrame(lesson.boardTime,n,seated);if(state.seated||state.inside)return '';const thresholdBottom=(scene.clientHeight-vehicle.offsetTop-vehicle.offsetHeight*DOOR_SILL)/scene.clientHeight*100;const pos=queuePosition(geometry.door,n,state.progress,thresholdBottom,scene.clientWidth,scene.clientHeight,vehicle.offsetHeight);const choose=boarding&&doorMode==='awaiting',tag=choose?'button':'div';return `<${tag} ${choose?`data-passenger="${n}" aria-label="選${PASSENGER_NAMES[n]}" aria-pressed="${lesson.chosenPassenger===n}"`:""} class="boarding-friend" data-friend="${n}" data-progress="${state.progress.toFixed(2)}" data-entering="${state.progress>.50}" style="--door-occlusion:${Math.max(0,Math.min(90,(state.progress-.5)/.22*90))}%;--rider-height:${vehicle.offsetHeight*(.43+.05*Math.min(1,state.progress/.58))}px;left:${pos.x}%;bottom:${pos.bottom}%;height:${Math.max(60,vehicle.offsetHeight*.48)}px;width:60px">${image(`art/r5/passenger-${n+1}-${reduced?0:state.pose}.png`,'朋友沿月台走進車門')}<b>${n+1} ${PASSENGER_NAMES[n]}</b></${tag}>`;}).join(''):'';
  const doorOpen=doors.open;
  vehicle.dataset.doors=String(doorOpen>0);vehicle.style.setProperty('--door-open',String(doorOpen));
  scene.dataset.doorState=doors.state;scene.dataset.step=String(doors.step);
  const statusButton=dialog.querySelector('[data-action=status] span');if(boarding&&statusButton)statusButton.textContent=boardingCue(lesson).label;
  ticketZoom.hidden=true;ticketZoom.replaceChildren();
  if(!ticketZoom.hidden){const names=PASSENGER_NAMES;ticketZoom.innerHTML=`<strong>${doorMode==='awaiting'?'點朋友，邀請上車':doorMode==='boarding'?PASSENGER_NAMES[lesson.boardingIndex]+'正在上車':doorMode==='closed'?'門關好了':boardingCue(lesson).label}</strong><div class="ticket-closeup-world"><div class="zoom-train">${image('art/content-r3/train-side.webp')}</div><div class="zoom-door" style="--door-open:${doors.open}"><i></i><i></i></div><div class="zoom-paving"></div><div class="zoom-step" ${doors.step===0?'hidden':''} style="transform:translateX(${(1-doors.step)*45}px) scaleX(${doors.step})"></div>${[0,1,2].map(n=>{const state=queueFrame(lesson.boardTime,n,false),p=state.progress;if(!state.inside&&n!==lesson.boardingIndex)return '';if(state.inside)return `<div class="zoom-seat" data-zoom-seat="${n}" style="left:${12+n*46}px">${image(`art/r5/passenger-${n+1}-0.png`,names[n]+'已入座')}</div>`;return `<div class="zoom-friend" data-zoom-friend="${n}" data-progress="${p.toFixed(2)}" style="left:${202-(45+n*18)*(1-Math.min(1,p/.58))}px;bottom:${15+26*Math.min(1,p/.58)}px">${image(`art/r5/passenger-${n+1}-${reduced?0:state.pose}.png`,names[n]+'跨過門檻')}<b>${n+1} ${names[n]}</b></div>`;}).join('')}</div>`;}
  const seatCount=seats.querySelectorAll('[data-entering=false]').length,entering=boarding&&doorMode==='boarding'?1:0;counts.innerHTML=visibleFriends&&!done?`<span>月台 ${3-seatCount-entering} 人</span>${entering?'<span>上車中 1 人</span>':''}<span>已入座 ${seatCount} 人</span>`:'';
  arrival.innerHTML=lesson.kind==='tickets'&&(done||checkpoint)?image('art/r8/coach-safe-window.png','阿路陪大家旅行')+'<span>大家坐好了！<br>一起去旅行</span>':'';
  const finaleKey=done?lesson.kind:'';if(finale.dataset.key!==finaleKey){finale.dataset.key=finaleKey;finale.innerHTML=done&&lesson.kind==='crossing'?image('art/content-r11/crossing-complete.webp',ending.crossing):done&&lesson.kind==='cake'?image('art/content-r16/cake-delivery.webp','完整三層蛋糕送到同三位朋友的桌上'):'';}
  if((done||checkpoint)&&!dialog.dataset.saved){dialog.dataset.saved='yes';persist();playChime('finish',{muted:readSettings().muted});}
 }
 function release(){lesson?.release();dialog.querySelectorAll('[data-hold]').forEach(b=>b.setAttribute('aria-pressed','false'));}
 function bindHolds(){dialog.querySelectorAll('[data-hold]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);if(lesson&&!lesson.paused){if(b.disabled||lesson.recoveryLocked)return;if(lesson.kind==='cake'&&b.dataset.needed!=='true'&&!(['left','right'].includes(b.dataset.action)&&lesson.inBend)){return;}lesson.hint='';lesson.input[b.dataset.action]=true;b.setAttribute('aria-pressed','true');}});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>{if(lesson)lesson.input[b.dataset.action]=false;b.setAttribute('aria-pressed','false');});b.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();if(lesson.kind==='cake'&&b.dataset.needed!=='true'&&!(['left','right'].includes(b.dataset.action)&&lesson.inBend)){return;}lesson.input[b.dataset.action]=true;}});b.addEventListener('keyup',()=>{lesson.input[b.dataset.action]=false;});});}
 function loop(now){if(!dialog.open||!lesson)return;lesson.update(last?Math.min((now-last)/1000,.05):0);last=now;if(now-drawAt>80){render();drawAt=now;}raf=requestAnimationFrame(loop);}
 function pick(){cancelAnimationFrame(raf);void stopNativeSpeech();lesson=null;phase='';$('picker').hidden=false;$('play').hidden=true;$('rest').hidden=true;$('pause').hidden=true;$('title').textContent='海岸實作課';dialog.dataset.kind='';dialog.querySelectorAll('[data-record]').forEach(el=>{const r=records()[el.dataset.record],state=r?.completed?'completed':r?.started||r?.stage>0?'started':'new';el.textContent=state==='completed'?'✓ 已完成・一起完成了！':state==='started'?`進行中・第 ${Math.min((r.stage||0)+1,3)} 站`:'未開始';el.closest('button').dataset.state=state;});}
 function start(kind,replay=false){const saved=records()[kind]||{},seed=replay?{layoutSeed:((saved.layoutSeed||0)+1)%3}:saved;lesson=new ContentLesson(kind,seed,{freshObservation:true,visualDeparture:true,releaseRecovery:true,observeTraffic:true,manualDoors:true,visualDelivery:true,strictTurns:true});lesson.balancePractice=kind==='cake';lesson.boardingRate=.3;lesson.boardingEnd=1.65;phase='';dialog.dataset.saved='';$('picker').hidden=true;$('play').hidden=false;$('rest').hidden=true;$('pause').hidden=false;last=0;spoken='';$('save').textContent='';render();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);}
 function pause(){if(!lesson||lesson.paused)return;lesson.pause();render();persist();$('rest-progress').textContent=`${lessonTitle(lesson.kind)}・第 ${lesson.stage+1}／3 站`; $('rest').hidden=false;$('play').hidden=true;void stopNativeSpeech();}
 function close(){if(lesson)persist();release();cancelAnimationFrame(raf);void stopNativeSpeech();dialog.close();opener.focus();}
 dialog.addEventListener('pointerdown',()=>unlockCelebrationAudio(),{passive:true});
 opener.onclick=()=>{pick();dialog.showModal();};$('back').onclick=close;$('leave').onclick=close;$('pause').onclick=pause;$('resume').onclick=()=>{lesson.paused=false;$('rest').hidden=true;$('play').hidden=false;last=0;render();};
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});dialog.addEventListener('click',e=>{const entry=e.target.closest('[data-content]');if(entry){start(entry.dataset.content);return;}if(!lesson)return;const rider=e.target.closest('[data-passenger]');if(rider){lesson.choosePassenger(Number(rider.dataset.passenger));phase='';render();return;}const friend=e.target.closest('[data-friend-request]');if(friend){lesson.requestFriend(friend.dataset.friendRequest);render();return;}const platform=e.target.closest('[data-platform]');if(platform){lesson.select(Number(platform.dataset.platform));render();return;}const b=e.target.closest('[data-action]');if(!b||b.dataset.hold)return;const a=b.dataset.action;lesson.hint='';if(a==='begin'){lesson.begin();persist();}if(a==='next'){lesson.next();dialog.dataset.saved='';}if(a==='replay'){start(lesson.kind,true);return;}if(a==='picker'){pick();return;}if(a==='look-left'||a==='look-right')lesson.look(a.slice(5));if(a==='depart')lesson.depart();if(a==='door')lesson.door();if(a==='board')lesson.boardFriend();if(a==='retract')lesson.retractStep();if(a==='close-door')lesson.closeDoor();if(a==='train-depart')lesson.departTrain();if(a==='listen')announce($('hint').textContent,true);render();});
 addEventListener('blur',()=>{if(dialog.open)pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&dialog.open)pause();});
 registerGameLifecycle({getState:()=>({paused:!dialog.open||!lesson||lesson.paused,completed:lesson?.completed}),pause});registerNativeOverlay({isOpen:()=>dialog.open,close});
}
