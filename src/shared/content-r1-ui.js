import './content-r1.css';
import './content-r2.css';
import './content-r3.css';
import {ContentLesson,CONTENT_LESSONS,CAKE_ROUTES} from './content-r1.js';
import {PLATFORM_X,boardingPose,ticketGeometry} from './content-r3-scene.js';
import {readStudent,updateStudentSection,studentSaved} from './student-save.js';
import {readSettings} from './settings.js';
import {speakNative,stopNativeSpeech,registerGameLifecycle,registerNativeOverlay} from './native.js';
import {playChime,unlockCelebrationAudio} from './celebrate.js';
import {appUrl} from './paths.js';

const image=(path,alt='',cls='')=>`<img class="${cls}" src="${appUrl(path)}" alt="${alt}" draggable="false">`;
const icon=(name)=>{const paths={go:'M8 4L22 16 8 28Z',brake:'M7 5h6v22H7zM19 5h6v22h-6z',left:'M21 5L9 16l12 11M10 16h17',right:'M11 5l12 11-12 11M22 16H5',eye:'M2 16Q16 0 30 16Q16 32 2 16ZM20 16a4 4 0 1 1-8 0 4 4 0 1 1 8 0',door:'M5 4h22v24H5zM16 4v24M11 14v4m10-4v4',sound:'M3 12h6l7-7v22l-7-7H3zM21 10q9 6 0 12'};return `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="${paths[name]||paths.go}" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>`;};
const shape=t=>`<svg class="ticket-shape" viewBox="0 0 64 64" aria-hidden="true"><g fill="${{blue:'#1479b8',orange:'#f46b27',green:'#58b85b'}[t.color]}" stroke="#143b61" stroke-width="4">${t.shape==='circle'?'<circle cx="32" cy="32" r="25"/>':t.shape==='triangle'?'<path d="M32 5L60 58H4Z"/>':'<rect x="8" y="8" width="48" height="48" rx="5"/>'}</g></svg>`;

export function installContentLessons(){
 const host=document.querySelector('.welcome');if(!host)return;
 const opener=document.createElement('button');opener.id='content-start';opener.textContent='海岸實作課';host.append(opener);
 const dialog=document.createElement('dialog');dialog.id='content-r1';dialog.setAttribute('aria-label','海岸實作課');
 dialog.innerHTML=`<header class="content-header"><button id="content-back">回學院</button><h2 id="content-title">海岸實作課</h2><button id="content-pause">休息</button></header><section id="content-picker"><p>和阿路一起，慢慢學。</p>${Object.entries(CONTENT_LESSONS).map(([k,v])=>`<button data-content="${k}">${image(k==='cake'?'art/content-r1/cake.png':k==='crossing'?'art/content-r1/grandma-0.png':'art/r6/train.png')}<span>${v}</span><small data-record="${k}"></small></button>`).join('')}</section><section id="content-play" hidden><div class="content-scene" aria-label="海岸練習場"><svg class="content-road" viewBox="0 0 600 400" preserveAspectRatio="none" aria-hidden="true"><path d="M300 420 Q100 220 300 180T300 -20" stroke="#1479b8" stroke-width="90" fill="none"/><path d="M300 420 Q100 220 300 180T300 -20" stroke="#fff1c9" stroke-width="76" fill="none"/><path d="M300 420 Q100 220 300 180T300 -20" stroke="#1479b8" stroke-width="3" stroke-dasharray="14 12" fill="none"/></svg><div class="content-zebra" aria-hidden="true"></div>${image('art/r7/car-rear.png','海藍汽車','content-car')}${image('art/r8/train-platform.png','藍黃列車車輪停在軌道上','content-train')}<div class="content-cake">${image('art/content-r1/cake.png','生日蛋糕')}${image('art/content-r1/flag.png','小旗隨操作傾斜','cake-flag')}</div><div class="content-ticket"></div><div class="content-walker"></div><div class="content-passengers"></div>${image('art/r8/coach-safe-window.png','阿路在車窗內繫好安全帶','content-coach')}<div class="content-stamps" aria-label="完成動作"></div><div class="content-route" aria-label="旅程進度"><i></i><i></i><i></i></div><div class="content-scene-cue"></div></div><div class="content-work"><p id="content-hint" role="status" aria-live="polite"></p><div id="content-controls"></div><p id="content-save"></p></div></section><section id="content-rest" hidden><h2>休息一下</h2><button id="content-resume">繼續練習</button><button id="content-leave">回學院</button></section>`;
 document.body.append(dialog);const $=id=>dialog.querySelector(`#content-${id}`);let lesson,last=0,raf=0,drawAt=0,spoken='',phase='';
 // Keep the cake and its carrier in one moving coordinate system.
 const scene=dialog.querySelector('.content-scene'),car=scene.querySelector('.content-car'),cake=scene.querySelector('.content-cake');
 const carrier=document.createElement('div');carrier.className='content-carrier';car.src=appUrl('art/r6/car.png');car.alt='蛋糕固定在汽車的托架上';car.before(carrier);carrier.append(car,cake);
 const cream=document.createElement('div');cream.className='cake-cream';cream.innerHTML=image('art/content-r1/cake.png');cake.append(cream);
 const force=document.createElement('div');force.className='content-force';force.setAttribute('aria-label','蛋糕力道');scene.append(force);
 const roadSign=document.createElement('div');roadSign.className='content-road-sign';scene.append(roadSign);
 const intro=document.createElement('div');intro.className='content-intro';intro.innerHTML=image('art/r8/coach-safe-window.png','阿路教練繫好安全帶')+'<span>阿路陪你練習</span>';scene.append(intro);
 $('rest').insertAdjacentHTML('afterbegin',image('art/r8/coach-safe-window.png','阿路陪你休息','content-rest-coach')+'<p id="content-rest-progress"></p>');
 const vehicle=document.createElement('div');vehicle.className='ticket-vehicle';scene.querySelector('.content-train').before(vehicle);vehicle.append(scene.querySelector('.content-train'));
 const seats=document.createElement('div');seats.className='ticket-seats';vehicle.append(seats);
 const stations=document.createElement('div');stations.className='content-stations';scene.append(stations);
 const finale=document.createElement('div');finale.className='content-finale';scene.append(finale);
 const watch=document.createElement('div');watch.className='content-observe';scene.append(watch);
 opener.innerHTML=image('art/content-r1/cake.png')+'<span>海岸實作課</span>';
 const records=()=>readStudent().sections.contentR1||{};
 function announce(text,force=false){if(text!==spoken||force){spoken=text;if(!readSettings().muted)void speakNative(text,{rate:.78});}}
 function persist(){const all=records(),snapshot=lesson.snapshot();snapshot.completed=all[lesson.kind]?.completed===true||snapshot.completed;all[lesson.kind]=snapshot;updateStudentSection('contentR1',all);$('save').textContent=studentSaved()?'已記住這一站。':'這次無法儲存，仍可繼續玩。';}
 function button(action,text,glyph,hold=false){return `<button data-action="${action}" ${hold?'data-hold="true"':''}>${icon(glyph)}<span>${text}</span></button>`;}
 function render(){if(!lesson)return;dialog.dataset.kind=lesson.kind;dialog.dataset.phase=lesson.phase;dialog.dataset.stage=String(lesson.stage);dialog.dataset.rough=String(lesson.rough);
  scene.dataset.distance=lesson.distance.toFixed(2);scene.dataset.speed=lesson.speed.toFixed(2);scene.dataset.bend=String(lesson.bend);scene.dataset.tilt=lesson.tilt.toFixed(2);scene.dataset.sway=lesson.sway.toFixed(2);scene.dataset.acceleration=lesson.acceleration.toFixed(2);
  const done=lesson.phase==='done',checkpoint=lesson.phase==='checkpoint',ready=lesson.phase==='ready',playing=lesson.phase==='playing';
  intro.hidden=!ready;
  const hints={cake:lesson.distance>=55?'到了！按住煞車，慢慢停。':lesson.distance>15&&lesson.distance<40?`前面${lesson.bend>0?'右':'左'}彎，輕輕轉。`:'輕按踏板，照顧小蛋糕。',crossing:lesson.speed>0?'按住煞車，停在線前。':!lesson.looked.left||!lesson.looked.right?'停穩了，看左邊、看右邊。':lesson.crossed<3?'停一停，看一看，等朋友過完。':'路口空了，可以出發。',tickets:lesson.phase==='boarding'?'朋友慢慢上車，等一等。':!lesson.matched?'看車票，找一樣的月台。':lesson.distance<28?'按住前進，去月台。':lesson.speed>0?'到站了，按住煞車。':'停穩了，開門接朋友。'};
  const ending={cake:'蛋糕送到了！一起分享。',crossing:'謝謝你等我們！朋友揮揮手。',tickets:'大家坐好了！一起去旅行。'};
  const hint=done?ending[lesson.kind]:checkpoint?{cake:'這段路練好了，去下一站。',crossing:'朋友都過街了，去下個路口。',tickets:'朋友坐好了，去下一站。'}[lesson.kind]:ready?{cake:'輕踩、輕轉、慢慢停。看小旗。',crossing:'停下看左右，等朋友都過完。',tickets:'點月台站牌，停穩再開門。'}[lesson.kind]:lesson.hint||(lesson.kind==='cake'&&lesson.rough?'小旗歪了，鬆開踏板、輕輕轉。':hints[lesson.kind]);
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
  dialog.querySelector('.cake-flag').style.transform=`rotate(${lesson.tilt}deg)`;
  cream.style.transform=`translateX(${lesson.sway*.65}px) rotate(${lesson.tilt*.38}deg)`;
  carrier.style.transform=`translateX(${lesson.steer*18}px) rotate(${lesson.steer*3}deg)`;
  force.innerHTML=lesson.kind==='cake'?`<span class="force-arrow">${lesson.rough?'↶↷':'━'}</span><span>${lesson.rough?'輕一點':'平穩'}<small>小旗 ${Math.abs(lesson.tilt).toFixed(1)}°</small></span><svg class="cake-level" viewBox="0 0 90 42" aria-label="綠色水平線與小旗角度"><path d="M2 32H88" stroke="#58b85b" stroke-width="4"/><g transform="rotate(${lesson.tilt} 45 32)"><path d="M45 32V4L70 10 45 17" fill="#58b85b" stroke="#143b61" stroke-width="3"/></g></svg>`:'';
  roadSign.innerHTML=lesson.kind==='cake'?`<svg viewBox="0 0 120 70" aria-hidden="true"><path d="${['M10 60L110 15','M10 60C10 5 100 65 70 10S110 20 110 5','M10 55H85V15'][lesson.stage]}" fill="none" stroke="#143b61" stroke-width="10" stroke-linecap="round"/><path d="M85 5h24v24" fill="none" stroke="#58b85b" stroke-width="7"/></svg><span>${lesson.distance>=55?'慢慢停':lesson.distance>15&&lesson.distance<40?(lesson.bend>0?'右彎 →':'← 左彎'):['輕輕起步','去燈塔','前面停靠'][lesson.stage]}</span>`:'';
  dialog.querySelector('.content-stamps').innerHTML=lesson.kind==='cake'?['start','turn','stop'].map((k,i)=>`<span class="${lesson.skills[k]||lesson.smooth[k]>.25?'earned':''}">${icon(['go','right','brake'][i])}</span>`).join(''):'';
  dialog.querySelectorAll('.content-route i').forEach((el,i)=>el.classList.toggle('complete',i<lesson.stage||done));
  dialog.querySelector('.content-scene-cue').textContent=`第 ${lesson.stage+1} 站・`+(lesson.kind==='cake'?CAKE_ROUTES[lesson.stage]:lesson.kind==='crossing'?['海風斑馬線','榕樹巷口','燈塔小徑'][lesson.stage]:lesson.target.name+'車票');
  dialog.querySelector('.content-ticket').innerHTML=lesson.kind==='tickets'?shape(lesson.target):'';
  // The three actual station signs are the matching controls, not a second row of shape buttons.
  const stationKey=`${lesson.kind}:${lesson.stage}:${playing}`;
  if(stations.dataset.key!==stationKey){stations.dataset.key=stationKey;stations.innerHTML=lesson.kind==='tickets'?lesson.platforms.map((t,i)=>`<button data-platform="${i}" aria-label="${t.name}月台" style="left:${PLATFORM_X[i]}%" ${!playing?'disabled':''}>${shape(t)}<span>月台</span></button>`).join(''):'';}
  dialog.querySelectorAll('[data-platform]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.platform)===lesson.selected)));
  watch.textContent=lesson.kind==='crossing'?(lesson.canDepart?'朋友過完了':lesson.speed>0?'先停下':!lesson.looked.left||!lesson.looked.right?'停穩再看左右':`等朋友過街 ${lesson.crossed}/3`):'';
  watch.setAttribute('role','status');
  for(const side of ['left','right']){const b=dialog.querySelector(`[data-action="look-${side}"]`);if(b)b.dataset.checked=String(lesson.looked[side]);}
  const depart=dialog.querySelector('[data-action=depart]');if(depart){depart.dataset.ready=String(lesson.canDepart);depart.setAttribute('aria-description',lesson.canDepart?'路口空了，可以出發':'等朋友過完才可出發');}
  const walker=dialog.querySelector('.content-walker');walker.replaceChildren();
  const reduced=readSettings().reducedMotion||matchMedia('(prefers-reduced-motion:reduce)').matches;
  if(lesson.kind==='crossing'&&lesson.crossed<3){const who=lesson.crossingPerson,pose=reduced?0:Math.floor(lesson.crossTime*5)%2,progress=lesson.crossTime/lesson.crossingDuration;walker.innerHTML=image(`art/content-r1/${who}-${pose}.png`,{child:'行人',bike:'腳踏車',grandma:'推菜籃奶奶'}[who]);walker.dataset.person=who;walker.dataset.pose=String(pose);walker.style.left=reduced?'50%':`${who==='bike'?86-progress*72:14+progress*72}%`;walker.style.bottom=`${who==='grandma'?25+Math.sin(progress*Math.PI)*5:29}%`;walker.style.scale=who==='bike'?'-1 1':'1';}
  const train=dialog.querySelector('.content-train'),geometry=ticketGeometry(lesson);train.src=appUrl('art/content-r3/train-side.webp');train.alt=lesson.selected<0?'等待選月台的列車':`${lesson.platforms[lesson.selected].name}月台的列車`;vehicle.style.left=`${geometry.x}%`;vehicle.dataset.x=geometry.x.toFixed(2);
  const passengers=dialog.querySelector('.content-passengers'),boarding=lesson.phase==='boarding',seated=checkpoint||done,waiting=lesson.selected>=0&&lesson.distance>=28;
  const visibleFriends=lesson.kind==='tickets'&&(boarding||seated||waiting);
  seats.innerHTML=visibleFriends?[0,1,2].map(n=>{const state=boardingPose(lesson.boardTime,n,seated);return state.seated?`<div class="ticket-seated" data-friend="${n}" style="left:${13+n*21}%">${image(`art/r5/passenger-${n+1}-0.png`,'乘客已坐好')}</div>`:'';}).join(''):'';
  passengers.innerHTML=visibleFriends?[0,1,2].map(n=>{const state=boardingPose(lesson.boardTime,n,seated);if(state.seated)return '';const t=reduced?0:state.progress,origin=Math.max(18,Math.min(60,geometry.queue-8))+n*9,x=origin+(geometry.door-origin)*t;return `<div class="boarding-friend" data-friend="${n}" data-progress="${state.progress.toFixed(2)}" style="left:${x}%;bottom:${35.5-t*7}%">${image(`art/r5/passenger-${n+1}-${reduced?0:state.pose}.png`,'朋友沿月台走進車門')}</div>`;}).join(''):'';
  vehicle.dataset.doors=String(boarding);
  const finaleKey=done?lesson.kind:'';if(finale.dataset.key!==finaleKey){finale.dataset.key=finaleKey;finale.innerHTML=done?image(`art/content-r2/${lesson.kind}-complete.webp`,ending[lesson.kind])+(lesson.kind==='tickets'?`<div class="ticket-final-proof"><span>第 3 站</span><div aria-label="綠正方形月台站牌">${shape(lesson.target)}<b>月台</b></div><div class="final-ticket" aria-label="綠正方形車票">${shape(lesson.target)}<b>車票</b></div></div>`:''):'';}
  if((done||checkpoint)&&!dialog.dataset.saved){dialog.dataset.saved='yes';persist();playChime('finish',{muted:readSettings().muted});}
 }
 function release(){lesson?.release();dialog.querySelectorAll('[data-hold]').forEach(b=>b.setAttribute('aria-pressed','false'));}
 function bindHolds(){dialog.querySelectorAll('[data-hold]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);if(lesson&&!lesson.paused){lesson.hint='';lesson.input[b.dataset.action]=true;b.setAttribute('aria-pressed','true');}});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>{if(lesson)lesson.input[b.dataset.action]=false;b.setAttribute('aria-pressed','false');});b.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();lesson.input[b.dataset.action]=true;}});b.addEventListener('keyup',()=>{lesson.input[b.dataset.action]=false;});});}
 function loop(now){if(!dialog.open||!lesson)return;lesson.update(last?Math.min((now-last)/1000,.05):0);last=now;if(now-drawAt>80){render();drawAt=now;}raf=requestAnimationFrame(loop);}
 function pick(){cancelAnimationFrame(raf);void stopNativeSpeech();lesson=null;phase='';$('picker').hidden=false;$('play').hidden=true;$('rest').hidden=true;$('pause').hidden=true;$('title').textContent='海岸實作課';dialog.dataset.kind='';dialog.querySelectorAll('[data-record]').forEach(el=>el.textContent=records()[el.dataset.record]?.completed?'一起完成了！':'慢慢學，不用趕');}
 function start(kind,replay=false){lesson=new ContentLesson(kind,replay?{}:records()[kind]);phase='';dialog.dataset.saved='';$('picker').hidden=true;$('play').hidden=false;$('rest').hidden=true;$('pause').hidden=false;last=0;spoken='';render();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);}
 function pause(){if(!lesson||lesson.paused)return;lesson.pause();$('rest-progress').textContent=`${CONTENT_LESSONS[lesson.kind]}・第 ${lesson.stage+1}／3 站`; $('rest').hidden=false;$('play').hidden=true;void stopNativeSpeech();}
 function close(){release();cancelAnimationFrame(raf);void stopNativeSpeech();dialog.close();opener.focus();}
 dialog.addEventListener('pointerdown',()=>unlockCelebrationAudio(),{passive:true});
 opener.onclick=()=>{pick();dialog.showModal();};$('back').onclick=close;$('leave').onclick=close;$('pause').onclick=pause;$('resume').onclick=()=>{lesson.paused=false;$('rest').hidden=true;$('play').hidden=false;last=0;render();};
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});dialog.addEventListener('click',e=>{const entry=e.target.closest('[data-content]');if(entry){start(entry.dataset.content);return;}if(!lesson)return;const platform=e.target.closest('[data-platform]');if(platform){lesson.select(Number(platform.dataset.platform));render();return;}const b=e.target.closest('[data-action]');if(!b||b.dataset.hold)return;const a=b.dataset.action;lesson.hint='';if(a==='begin')lesson.begin();if(a==='next'){lesson.next();dialog.dataset.saved='';}if(a==='replay'){start(lesson.kind,true);return;}if(a==='picker'){pick();return;}if(a==='look-left'||a==='look-right')lesson.look(a.slice(5));if(a==='depart')lesson.depart();if(a==='door')lesson.door();if(a==='listen')announce($('hint').textContent,true);render();});
 addEventListener('blur',()=>{if(dialog.open)pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&dialog.open)pause();});
 registerGameLifecycle({getState:()=>({paused:!dialog.open||!lesson||lesson.paused,completed:lesson?.completed}),pause});registerNativeOverlay({isOpen:()=>dialog.open,close});
}
