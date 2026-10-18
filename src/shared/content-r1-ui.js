import './content-r1.css';
import './content-r2.css';
import './content-r3.css';
import './content-r4.css';
import './content-r5.css';
import './content-r6.css';
import {lessonFacts} from './content-r5-feedback.js';
import {cakePose,sideWatch,cakeTask} from './content-r4-scene.js';
import {ContentLesson,CONTENT_LESSONS,CAKE_ROUTES,CROSSING_ORDERS} from './content-r1.js';
import {PLATFORM_X,boardingPose,ticketGeometry} from './content-r3-scene.js';
import {readStudent,updateStudentSection,studentSaved} from './student-save.js';
import {readSettings} from './settings.js';
import {speakNative,stopNativeSpeech,registerGameLifecycle,registerNativeOverlay} from './native.js';
import {playChime,unlockCelebrationAudio} from './celebrate.js';
import {appUrl} from './paths.js';

const image=(path,alt='',cls='')=>`<img class="${cls}" src="${appUrl(path)}" alt="${alt}" draggable="false">`;
const icon=(name)=>{const paths={go:'M8 4L22 16 8 28Z',brake:'M7 5h6v22H7zM19 5h6v22h-6z',left:'M21 5L9 16l12 11M10 16h17',right:'M11 5l12 11-12 11M22 16H5',eye:'M2 16Q16 0 30 16Q16 32 2 16ZM20 16a4 4 0 1 1-8 0 4 4 0 1 1 8 0',door:'M5 4h22v24H5zM16 4v24M11 14v4m10-4v4',sound:'M3 12h6l7-7v22l-7-7H3zM21 10q9 6 0 12'};return `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="${paths[name]||paths.go}" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>`;};
const friendArt=(who,pose=0)=>who==='grandma'?`art/content-r6/grandma-${pose}.png`:`art/content-r1/${who}-${pose}.png`;
const friendName=who=>({child:'小朋友',bike:'腳踏車',grandma:'奶奶'}[who]);
const shape=t=>`<svg class="ticket-shape" viewBox="0 0 64 64" aria-hidden="true"><g fill="${{blue:'#1479b8',orange:'#f46b27',green:'#58b85b'}[t.color]}" stroke="#143b61" stroke-width="4">${t.shape==='circle'?'<circle cx="32" cy="32" r="25"/>':t.shape==='triangle'?'<path d="M32 5L60 58H4Z"/>':'<rect x="8" y="8" width="48" height="48" rx="5"/>'}</g></svg>`;

export function installContentLessons(){
 const host=document.querySelector('.welcome');if(!host)return;
 const opener=document.createElement('button');opener.id='content-start';opener.textContent='海岸實作課';host.append(opener);
 const dialog=document.createElement('dialog');dialog.id='content-r1';dialog.setAttribute('aria-label','海岸實作課');
 dialog.innerHTML=`<header class="content-header"><button id="content-back">回學院</button><h2 id="content-title">海岸實作課</h2><button id="content-pause">休息</button></header><section id="content-picker"><div class="content-picker-guide">${image('art/r8/coach-safe-window.png','阿路教練陪你選課')}<p>選一張車票<br><strong>和阿路一起出發</strong></p></div>${Object.entries(CONTENT_LESSONS).map(([k,v])=>`<button data-content="${k}">${image(k==='cake'?'art/content-r1/cake.png':k==='crossing'?'art/content-r1/grandma-0.png':'art/r6/train.png')}<span>${v}</span><em>${{cake:'按住、放開，讓蛋糕坐穩',crossing:'停下看左右，等朋友過街',tickets:'形狀和顏色一樣，再開門'}[k]}</em><small data-record="${k}"></small></button>`).join('')}</section><section id="content-play" hidden><div class="content-scene" aria-label="海岸練習場"><svg class="content-road" viewBox="0 0 600 400" preserveAspectRatio="none" aria-hidden="true"><path d="M300 420 Q100 220 300 180T300 -20" stroke="#1479b8" stroke-width="90" fill="none"/><path d="M300 420 Q100 220 300 180T300 -20" stroke="#fff1c9" stroke-width="76" fill="none"/><path d="M300 420 Q100 220 300 180T300 -20" stroke="#1479b8" stroke-width="3" stroke-dasharray="14 12" fill="none"/></svg><div class="content-zebra" aria-hidden="true"></div>${image('art/r7/car-rear.png','海藍汽車','content-car')}${image('art/r8/train-platform.png','藍黃列車車輪停在軌道上','content-train')}<div class="content-cake">${image('art/content-r1/cake.png','生日蛋糕')}${image('art/content-r1/flag.png','小旗隨操作傾斜','cake-flag')}</div><div class="content-ticket"></div><div class="content-walker"></div><div class="content-passengers"></div>${image('art/r8/coach-safe-window.png','阿路在車窗內繫好安全帶','content-coach')}<div class="content-stamps" aria-label="完成動作"></div><div class="content-route" aria-label="旅程進度"><i></i><i></i><i></i></div><div class="content-scene-cue"></div></div><div class="content-work"><p id="content-hint" role="status" aria-live="polite"></p><div id="content-controls"></div><p id="content-save"></p></div></section><section id="content-rest" hidden><h2>休息一下</h2><button id="content-resume">繼續練習</button><button id="content-leave">回學院</button></section>`;
 document.body.append(dialog);const $=id=>dialog.querySelector(`#content-${id}`);let lesson,last=0,raf=0,drawAt=0,spoken='',phase='';
 // Keep the cake and its carrier in one moving coordinate system.
 const scene=dialog.querySelector('.content-scene'),car=scene.querySelector('.content-car'),cake=scene.querySelector('.content-cake');
 const carrier=document.createElement('div');carrier.className='content-carrier';car.src=appUrl('art/r6/car.png');car.alt='蛋糕固定在汽車的托架上';car.before(carrier);carrier.append(car,cake);
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
 const stations=document.createElement('div');stations.className='content-stations';scene.append(stations);
 const finale=document.createElement('div');finale.className='content-finale';scene.append(finale);
 const watch=document.createElement('div');watch.className='content-observe';scene.append(watch);
 const panorama=document.createElement('div');panorama.className='crossing-panorama';scene.prepend(panorama);
 const lookout=document.createElement('div');lookout.className='crossing-lookout';scene.append(lookout);
 const task=document.createElement('div');task.className='cake-task';scene.append(task);
 const arrival=document.createElement('div');arrival.className='ticket-arrival';scene.append(arrival);
 const comparison=document.createElement('div');comparison.className='ticket-comparison';scene.append(comparison);
 const bay=document.createElementNS('http://www.w3.org/2000/svg','svg');bay.classList.add('cake-bay-mark');bay.setAttribute('viewBox','0 0 160 75');bay.innerHTML='<path d="M10 65L38 8H135L151 65Z" fill="#ffffff35" stroke="#1479b8" stroke-width="5" stroke-dasharray="12 5"/><path d="M70 23v26m20-26v26" stroke="#1479b8" stroke-width="8"/>';bay.setAttribute('aria-label','路面臨停灣位');scene.append(bay);
 const facts=document.createElement('div');facts.className='content-facts';$('hint').after(facts);
 opener.innerHTML=image('art/content-r1/cake.png')+'<span>海岸實作課<small id="content-home-progress"></small></span>';
 const records=()=>readStudent().sections.contentR1||{};
 function homeProgress(){const n=Object.values(records()).filter(r=>r?.completed).length;document.getElementById('content-home-progress').textContent=`已完成 ${n}／3 課`;opener.dataset.completed=String(n);}
 addEventListener('studentchange',homeProgress);homeProgress();
 function announce(text,force=false){if(text!==spoken||force){spoken=text;if(!readSettings().muted)void speakNative(text,{rate:.78});}}
 function persist(){const all=records(),snapshot=lesson.snapshot();snapshot.started=all[lesson.kind]?.started===true||snapshot.started;if(!all[lesson.kind]?.completed||snapshot.completed)all[lesson.kind]=snapshot;updateStudentSection('contentR1',all);$('save').textContent=studentSaved()?'已記住這一站。':'這次無法儲存，仍可繼續玩。';}
 function button(action,text,glyph,hold=false){return `<button data-action="${action}" ${hold?'data-hold="true"':''}>${icon(glyph)}<span>${text}</span></button>`;}
 function render(){if(!lesson)return;dialog.dataset.kind=lesson.kind;dialog.dataset.phase=lesson.phase;dialog.dataset.stage=String(lesson.stage);dialog.dataset.rough=String(lesson.rough||lesson.assisting);
  scene.dataset.distance=lesson.distance.toFixed(2);scene.dataset.speed=lesson.speed.toFixed(2);scene.dataset.bend=String(lesson.bend);scene.dataset.tilt=lesson.tilt.toFixed(2);scene.dataset.sway=lesson.sway.toFixed(2);scene.dataset.acceleration=lesson.acceleration.toFixed(2);scene.dataset.bayStopped=String(lesson.bayStopped);scene.dataset.bayRestarted=String(lesson.bayRestarted);scene.dataset.leftTurn=String(lesson.turns.left>=.2);scene.dataset.rightTurn=String(lesson.turns.right>=.2);scene.dataset.focus=lesson.focus;scene.dataset.crossTime=lesson.crossTime.toFixed(3);scene.dataset.crossDuration=String(lesson.crossingDuration);scene.dataset.orderHint=lesson.orderHint;scene.dataset.fruitSway=lesson.fruitSway.toFixed(2);scene.dataset.flagSway=lesson.flagSway.toFixed(2);
  const done=lesson.phase==='done',checkpoint=lesson.phase==='checkpoint',ready=lesson.phase==='ready',playing=lesson.phase==='playing';
  facts.hidden=!(done||checkpoint);facts.innerHTML=done||checkpoint?lessonFacts(lesson).map(f=>`<span>${icon(f.glyph)}<b>${f.text}</b></span>`).join(''):'';
  scene.dataset.assisting=String(!!lesson.assisting);scene.dataset.crossed=String(lesson.crossed);scene.dataset.lookedLeft=String(lesson.looked.left);scene.dataset.lookedRight=String(lesson.looked.right);
  intro.hidden=!ready;
  const hints={cake:lesson.distance>=55?'到了！按住煞車，慢慢停。':lesson.distance>15&&lesson.distance<40?`前面${lesson.bend>0?'右':'左'}彎，輕輕轉。`:'按住踏板起步，放開放慢。',crossing:lesson.speed>0?'按住煞車，停在線前。':!lesson.looked.left||!lesson.looked.right?'停穩了，看左邊、看右邊。':lesson.crossed<3?'停一停，看一看，等朋友過完。':'路口空了，可以出發。',tickets:lesson.phase==='boarding'?'朋友慢慢上車，等一等。':!lesson.matched?'看車票，找一樣的月台。':lesson.distance<28?'按住前進，去月台。':lesson.speed>0?'到站了，按住煞車。':'停穩了，開門接朋友。'};
  const ending={cake:'蛋糕送到了！一起分享。',crossing:'謝謝你等我們！朋友揮揮手。',tickets:'大家坐好了！一起去旅行。'};
  const routeHint=lesson.kind==='cake'&&lesson.stage===2&&lesson.distance>=42&&!lesson.bayStopped?'臨停灣到了，按住煞車。':lesson.kind==='cake'&&lesson.bayStopped&&!lesson.bayRestarted?'停穩了！按住踏板再起步。':'';
  const hint=done?ending[lesson.kind]:checkpoint?{cake:'這段路練好了，去下一站。',crossing:'朋友都過街了，去下個路口。',tickets:'朋友坐好了，去下一站。'}[lesson.kind]:ready?{cake:['按住起步，放開放慢。','先左彎，再右彎。','到臨停灣，停穩再起步。'][lesson.stage],crossing:'停下看左右，等朋友都過完。',tickets:'點月台站牌，停穩再開門。'}[lesson.kind]:lesson.hint||routeHint||(lesson.kind==='cake'&&lesson.rough?'小旗歪了，鬆開踏板、輕輕轉。':hints[lesson.kind]);
  if($('hint').textContent!==hint){$('hint').textContent=hint;announce(hint);}
  $('title').textContent=CONTENT_LESSONS[lesson.kind];
  const signature=`${lesson.phase}:${lesson.kind}`;
  if(phase!==signature){phase=signature;let controls='';
   if(ready)controls=button('begin','一起出發','go');
   else if(done)controls=button('replay','再玩一次','go')+button('picker','換一課','left');
   else if(checkpoint)controls=button('next','下一站','go');
   else if(lesson.kind==='tickets'&&lesson.phase==='boarding')controls=(button('go','前進','go')+button('brake','停穩','brake')+button('door','上車中','door')).replaceAll('<button ','<button disabled ');
   else if(playing&&lesson.kind==='cake')controls=button('left','左轉','left',true)+button('right','右轉','right',true)+button('go','踏板','go',true)+button('brake','煞車','brake',true);
   else if(playing&&lesson.kind==='crossing')controls=button('brake','停下','brake',true)+button('look-left','看左','eye')+button('look-right','看右','eye')+button('depart','出發','go');
   else if(playing&&lesson.kind==='tickets')controls=button('go','前進','go',true)+button('brake','停穩','brake',true)+button('door','開門','door');
   $('controls').innerHTML=controls+button('listen','再聽一次','sound');bindHolds();
  }
  const pose=cakePose(lesson),reducedMotion=readSettings().reducedMotion||matchMedia('(prefers-reduced-motion:reduce)').matches;
  dialog.querySelector('.cake-flag').style.transform=`translateX(${pose.fruit*.4}px) rotate(${pose.flag}deg) skewX(${pose.bend}deg)`;
  cake.style.transform=`rotate(${pose.cake}deg)`;
  cream.style.transform=`translateX(${pose.cream}px) rotate(${lesson.sway*.6}deg)`;fruit.style.transform=`translateX(${pose.fruit}px) rotate(${lesson.fruitSway*1.1}deg)`;
  correction.innerHTML=lesson.kind==='cake'?(lesson.rough||lesson.assisting?icon(lesson.tilt<0?'right':'left'):'<svg viewBox="0 0 32 32"><path d="M5 17l8 8L27 7" fill="none" stroke="currentColor" stroke-width="5"/></svg>'): '';correction.dataset.warning=String(lesson.rough||lesson.assisting);
  route.innerHTML=lesson.kind==='cake'?(lesson.stage===1?`<span data-met="${lesson.turns.left>=.2}">←</span><b>→</b><span data-met="${lesson.turns.right>=.2}">→</span>`:lesson.stage===2?`<span data-met="${lesson.bayStopped}">${icon('brake')}</span><b>→</b><span data-met="${lesson.bayRestarted}">${icon('go')}</span>`:''):'';
  carrier.style.transform=lesson.kind==='cake'?`translate(${pose.x*scene.clientWidth}px,${pose.y*scene.clientHeight}px) scale(${pose.scale}) rotate(${pose.pitch}deg)`:`translateX(${lesson.steer*18}px)`;
  task.textContent=lesson.kind==='cake'?(checkpoint?'這站完成！':cakeTask(lesson)):'';
  task.dataset.left=String(lesson.turns.left>=.2);task.dataset.right=String(lesson.turns.right>=.2);
  panorama.style.transform=`translateX(${reducedMotion?0:lesson.focus==='left'?9:lesson.focus==='right'?-9:0}%)`;
  lookout.replaceChildren();
  if(lesson.kind==='crossing'&&lesson.focus!=='center'){
   const side=sideWatch(lesson,lesson.focus);lookout.innerHTML=`<b>${lesson.focus==='left'?'←':'→'} ${side.label}看清楚</b><div>${side.people.map(w=>image(friendArt(w),{child:'小朋友',bike:'腳踏車',grandma:'菜籃奶奶'}[w])).join('')}</div><span>${side.clear?'這邊已過完':lesson.crossTime>0&&side.people.includes(lesson.crossingPerson)?'朋友正在過街':'朋友等著過街'}</span>`;
   lookout.dataset.side=lesson.focus;
  }
  const warning=lesson.rough||lesson.assisting;
  force.innerHTML=lesson.kind==='cake'?image(warning?'art/content-r5/coach-reminder.png':'art/r8/coach-safe-window.png',warning?'阿路溫柔提醒，放開扶正':'阿路安心微笑','force-coach')+`<div class="force-readout"><span class="force-arrow">${warning?(lesson.tilt<0?'↷':'↶'):'━'}</span><strong>${warning?'放開，扶正':'坐穩了'}</strong><div class="force-meter"><i style="width:${Math.min(100,Math.abs(lesson.tilt)/32*100)}%"></i></div></div>`:'';
  roadSign.innerHTML=lesson.kind==='cake'?`<svg viewBox="0 0 120 70" aria-hidden="true"><path d="${['M10 60L110 15','M10 60C10 5 100 65 70 10S110 20 110 5','M10 55H85V15'][lesson.stage]}" fill="none" stroke="#143b61" stroke-width="10" stroke-linecap="round"/><path d="M85 5h24v24" fill="none" stroke="#58b85b" stroke-width="7"/></svg><span>${lesson.distance>=55?'慢慢停':lesson.distance>15&&lesson.distance<40?(lesson.bend>0?'右彎 →':'← 左彎'):['按住起步','左右連彎','臨停再起步'][lesson.stage]}</span>`:'';
  dialog.querySelector('.content-stamps').innerHTML=lesson.kind==='cake'?['start','turn','stop'].map((k,i)=>`<span class="${lesson.skills[k]||lesson.smooth[k]>.25?'earned':''}">${icon(['go','right','brake'][i])}</span>`).join(''):'';
  dialog.querySelectorAll('.content-route i').forEach((el,i)=>el.classList.toggle('complete',i<lesson.stage||done));
  dialog.querySelector('.content-scene-cue').textContent=`第 ${lesson.stage+1} 站・`+(lesson.kind==='cake'?CAKE_ROUTES[lesson.stage]:lesson.kind==='crossing'?['海風斑馬線','榕樹巷口','燈塔小徑'][lesson.stage]:lesson.target.name+'車票');
  dialog.querySelector('.content-ticket').innerHTML=lesson.kind==='tickets'?shape(lesson.target):'';
  // The three actual station signs are the matching controls, not a second row of shape buttons.
  const stationKey=`${lesson.kind}:${lesson.stage}:${playing}`;
  if(stations.dataset.key!==stationKey){stations.dataset.key=stationKey;stations.innerHTML=lesson.kind==='tickets'?lesson.platforms.map((t,i)=>`<button data-platform="${i}" aria-label="${t.name}月台" style="left:${PLATFORM_X[i]}%" ${!playing?'disabled':''}>${shape(t)}<span>月台</span></button>`).join(''):'';}
  dialog.querySelectorAll('[data-platform]').forEach(b=>{const selected=Number(b.dataset.platform)===lesson.selected;b.setAttribute('aria-pressed',String(selected));b.dataset.arrived=String(selected&&lesson.matched&&lesson.distance>=28&&lesson.speed===0);b.querySelector('span').textContent=b.dataset.arrived==='true'?'✓ 停對了':'月台';});
  const wrong=lesson.kind==='tickets'&&playing&&lesson.selected>=0&&!lesson.matched&&lesson.distance>=28&&lesson.speed===0;
  comparison.innerHTML=wrong?`<div>${shape(lesson.target)}<span>車票</span></div><b>≠</b><div>${shape(lesson.platforms[lesson.selected])}<span>這站</span></div><strong>${icon('brake')}門關著，再找找</strong>`:'';
  // Scene signs remain the source of truth after arrival; no leftover floating ticket.
  scene.querySelector('.content-ticket').hidden=done||checkpoint;
  watch.textContent=lesson.kind==='crossing'?(lesson.canDepart?'朋友過街 3/3・可以出發':lesson.speed>0?'先停下':!lesson.looked.left||!lesson.looked.right?'停穩再看左右':`等朋友過街 ${lesson.crossed}/3`):'';
  watch.setAttribute('role','status');
  for(const side of ['left','right']){const b=dialog.querySelector(`[data-action="look-${side}"]`);if(b){b.dataset.checked=String(lesson.looked[side]);b.querySelector('span').textContent=(lesson.looked[side]?'✓ ':'')+(side==='left'?'看左':'看右');}}
  const depart=dialog.querySelector('[data-action=depart]');if(depart){depart.dataset.ready=String(lesson.canDepart);depart.setAttribute('aria-disabled',String(!lesson.canDepart));depart.setAttribute('aria-description',lesson.canDepart?'路口空了，可以出發':'等朋友過完才可出發');}
  const walker=dialog.querySelector('.content-walker');walker.replaceChildren();
  const reduced=readSettings().reducedMotion||matchMedia('(prefers-reduced-motion:reduce)').matches;
  if(lesson.kind==='crossing'&&lesson.crossed<3){const who=lesson.crossingPerson,pose=reduced?0:Math.floor(lesson.crossTime*3)%2,progress=lesson.crossTime/lesson.crossingDuration;walker.innerHTML=image(friendArt(who,pose),{child:'行人',bike:'腳踏車',grandma:'推菜籃奶奶'}[who]);walker.dataset.person=who;walker.dataset.pose=String(pose);walker.style.left=reduced?'50%':`${who==='bike'?86-progress*72:14+progress*72}%`;walker.style.bottom=`${who==='grandma'?25+Math.sin(progress*Math.PI)*5:29}%`;walker.style.scale=who==='bike'?'-1 1':'1';}
  if(lesson.kind==='crossing'){
   const order=CROSSING_ORDERS[lesson.stage];
   if(roster.dataset.stage!==String(lesson.stage)){roster.dataset.stage=String(lesson.stage);roster.innerHTML=order.map((w,i)=>`<button data-friend-request="${w}" aria-label="請${friendName(w)}先過">${image(friendArt(w))}<span>${i+1}</span></button>`).join('');}
   roster.querySelectorAll('button').forEach((b,i)=>{b.dataset.passed=String(i<lesson.crossed);b.dataset.current=String(i===lesson.crossed);b.disabled=!playing;});
   arrived.innerHTML=order.slice(0,lesson.crossed).map(w=>`<div data-arrived-friend="${w}" style="${w==='bike'?'left':'right'}:2%;bottom:${w==='bike'?26:order.slice(0,order.indexOf(w)).filter(v=>v!=='bike').length?12:28}%">${image(friendArt(w),friendName(w)+'已到對側')}<b>✓</b></div>`).join('');
   panorama.innerHTML=['left','right'].map(side=>{const pending=sideWatch(lesson,side).people.filter(w=>w!==lesson.crossingPerson);return `<div class="crossing-waiting" data-side="${side}">${pending.map(w=>image(friendArt(w),{child:'路邊等候的小朋友',bike:'右邊等候的腳踏車',grandma:'左邊等候的奶奶'}[w])).join('')}</div>`;}).join('');
   scene.querySelector('.content-coach').src=appUrl('art/content-r5/coach-reminder.png');
  }else{panorama.replaceChildren();roster.replaceChildren();roster.dataset.stage='';arrived.replaceChildren();}
  const train=dialog.querySelector('.content-train'),geometry=ticketGeometry(lesson);train.src=appUrl('art/content-r3/train-side.webp');train.alt=lesson.selected<0?'等待選月台的列車':`${lesson.platforms[lesson.selected].name}月台的列車`;vehicle.style.left=`${geometry.x}%`;vehicle.dataset.x=geometry.x.toFixed(2);
  const passengers=dialog.querySelector('.content-passengers'),boarding=lesson.phase==='boarding',seated=checkpoint||done,waiting=lesson.selected>=0&&lesson.distance>=28;
  const visibleFriends=lesson.kind==='tickets'&&(boarding||seated||waiting);
  seats.innerHTML=visibleFriends?[0,1,2].map(n=>{const state=boardingPose(lesson.boardTime,n,seated);return state.seated?`<div class="ticket-seated" data-friend="${n}" style="left:${13+n*21}%">${image(`art/r5/passenger-${n+1}-0.png`,'乘客已坐好')}</div>`:'';}).join(''):'';
  passengers.innerHTML=visibleFriends?[0,1,2].map(n=>{const state=boardingPose(lesson.boardTime,n,seated);if(state.seated)return '';const t=reduced?0:state.progress,origin=Math.max(18,Math.min(60,geometry.queue-8))+n*9,x=origin+(geometry.door-origin)*t;return `<div class="boarding-friend" data-friend="${n}" data-progress="${state.progress.toFixed(2)}" style="left:${x}%;bottom:${35.5-t*7}%">${image(`art/r5/passenger-${n+1}-${reduced?0:state.pose}.png`,'朋友沿月台走進車門')}</div>`;}).join(''):'';
  vehicle.dataset.doors=String(boarding);vehicle.style.setProperty('--door-open',String(boarding?Math.min(1,lesson.boardTime/.06):0));
  const seatCount=seats.children.length;counts.innerHTML=visibleFriends?`<span>月台 ${3-seatCount} 人</span><span>車內 ${seatCount} 人</span>`:'';
  arrival.innerHTML=lesson.kind==='tickets'&&(done||checkpoint)?image('art/r8/coach-safe-window.png','阿路陪大家旅行')+'<span>大家坐好了！<br>一起去旅行</span>':'';
  const finaleKey=done?lesson.kind:'';if(finale.dataset.key!==finaleKey){finale.dataset.key=finaleKey;finale.innerHTML=done&&lesson.kind!=='tickets'?image(`art/content-r2/${lesson.kind}-complete.webp`,ending[lesson.kind]):'';}
  if((done||checkpoint)&&!dialog.dataset.saved){dialog.dataset.saved='yes';persist();playChime('finish',{muted:readSettings().muted});}
 }
 function release(){lesson?.release();dialog.querySelectorAll('[data-hold]').forEach(b=>b.setAttribute('aria-pressed','false'));}
 function bindHolds(){dialog.querySelectorAll('[data-hold]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);if(lesson&&!lesson.paused){lesson.hint='';lesson.input[b.dataset.action]=true;b.setAttribute('aria-pressed','true');}});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>{if(lesson)lesson.input[b.dataset.action]=false;b.setAttribute('aria-pressed','false');});b.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();lesson.input[b.dataset.action]=true;}});b.addEventListener('keyup',()=>{lesson.input[b.dataset.action]=false;});});}
 function loop(now){if(!dialog.open||!lesson)return;lesson.update(last?Math.min((now-last)/1000,.05):0);last=now;if(now-drawAt>80){render();drawAt=now;}raf=requestAnimationFrame(loop);}
 function pick(){cancelAnimationFrame(raf);void stopNativeSpeech();lesson=null;phase='';$('picker').hidden=false;$('play').hidden=true;$('rest').hidden=true;$('pause').hidden=true;$('title').textContent='海岸實作課';dialog.dataset.kind='';dialog.querySelectorAll('[data-record]').forEach(el=>{const r=records()[el.dataset.record],state=r?.completed?'completed':r?.started||r?.stage>0?'started':'new';el.textContent=state==='completed'?'✓ 已完成・一起完成了！':state==='started'?`進行中・第 ${Math.min((r.stage||0)+1,3)} 站`:'未開始';el.closest('button').dataset.state=state;});}
 function start(kind,replay=false){lesson=new ContentLesson(kind,replay?{}:records()[kind]);lesson.boardingRate=.3;phase='';dialog.dataset.saved='';$('picker').hidden=true;$('play').hidden=false;$('rest').hidden=true;$('pause').hidden=false;last=0;spoken='';render();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);}
 function pause(){if(!lesson||lesson.paused)return;lesson.pause();persist();$('rest-progress').textContent=`${CONTENT_LESSONS[lesson.kind]}・第 ${lesson.stage+1}／3 站`; $('rest').hidden=false;$('play').hidden=true;void stopNativeSpeech();}
 function close(){if(lesson)persist();release();cancelAnimationFrame(raf);void stopNativeSpeech();dialog.close();opener.focus();}
 dialog.addEventListener('pointerdown',()=>unlockCelebrationAudio(),{passive:true});
 opener.onclick=()=>{pick();dialog.showModal();};$('back').onclick=close;$('leave').onclick=close;$('pause').onclick=pause;$('resume').onclick=()=>{lesson.paused=false;$('rest').hidden=true;$('play').hidden=false;last=0;render();};
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});dialog.addEventListener('click',e=>{const entry=e.target.closest('[data-content]');if(entry){start(entry.dataset.content);return;}if(!lesson)return;const friend=e.target.closest('[data-friend-request]');if(friend){lesson.requestFriend(friend.dataset.friendRequest);render();return;}const platform=e.target.closest('[data-platform]');if(platform){lesson.select(Number(platform.dataset.platform));render();return;}const b=e.target.closest('[data-action]');if(!b||b.dataset.hold)return;const a=b.dataset.action;lesson.hint='';if(a==='begin'){lesson.begin();persist();}if(a==='next'){lesson.next();dialog.dataset.saved='';}if(a==='replay'){start(lesson.kind,true);return;}if(a==='picker'){pick();return;}if(a==='look-left'||a==='look-right')lesson.look(a.slice(5));if(a==='depart')lesson.depart();if(a==='door')lesson.door();if(a==='listen')announce($('hint').textContent,true);render();});
 addEventListener('blur',()=>{if(dialog.open)pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&dialog.open)pause();});
 registerGameLifecycle({getState:()=>({paused:!dialog.open||!lesson||lesson.paused,completed:lesson?.completed}),pause});registerNativeOverlay({isOpen:()=>dialog.open,close});
}
