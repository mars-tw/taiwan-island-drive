import './content-r1.css';
import {ContentLesson,CONTENT_LESSONS,CROSSING_ORDERS} from './content-r1.js';
import {readStudent,updateStudentSection,studentSaved} from './student-save.js';
import {readSettings} from './settings.js';
import {speakNative,stopNativeSpeech,registerGameLifecycle,registerNativeOverlay} from './native.js';
import {celebrate} from './celebrate.js';
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
 const records=()=>readStudent().sections.contentR1||{};
 function announce(text,force=false){if(text!==spoken||force){spoken=text;if(!readSettings().muted)void speakNative(text,{rate:.78});}}
 function persist(){const all=records(),snapshot=lesson.snapshot();snapshot.completed=all[lesson.kind]?.completed===true||snapshot.completed;all[lesson.kind]=snapshot;updateStudentSection('contentR1',all);$('save').textContent=studentSaved()?'已記住這一站。':'這次無法儲存，仍可繼續玩。';}
 function button(action,text,glyph,hold=false){return `<button data-action="${action}" ${hold?'data-hold="true"':''}>${icon(glyph)}<span>${text}</span></button>`;}
 function render(){if(!lesson)return;dialog.dataset.kind=lesson.kind;dialog.dataset.phase=lesson.phase;
  const done=lesson.phase==='done',checkpoint=lesson.phase==='checkpoint',ready=lesson.phase==='ready',playing=lesson.phase==='playing';
  const hints={cake:lesson.distance>=55?'到了！按住煞車，慢慢停。':lesson.distance>15&&lesson.distance<40?`前面${lesson.bend>0?'右':'左'}彎，輕輕轉。`:'輕按踏板，照顧小蛋糕。',crossing:lesson.speed>0?'按住煞車，停在線前。':!lesson.looked.left||!lesson.looked.right?'停穩了，看左邊、看右邊。':lesson.crossed<3?'停一停，看一看，等朋友過完。':'路口空了，可以出發。',tickets:lesson.phase==='boarding'?'朋友慢慢上車，等一等。':!lesson.matched?'看車票，找一樣的月台。':lesson.distance<28?'按住前進，去月台。':lesson.speed>0?'到站了，按住煞車。':'停穩了，開門接朋友。'};
  const hint=done?'大家都到了，一起慶祝！':checkpoint?'這一站完成了！':ready?{cake:'踏板起步、轉彎、煞車。小旗會告訴你。',crossing:'停下看左右，等朋友都過完。',tickets:'看形狀和顏色，停穩再開門。'}[lesson.kind]:lesson.hint||hints[lesson.kind];
  if($('hint').textContent!==hint){$('hint').textContent=hint;announce(hint);}
  $('title').textContent=CONTENT_LESSONS[lesson.kind];
  const signature=`${lesson.phase}:${lesson.kind}`;
  if(phase!==signature){phase=signature;let controls='';
   if(ready)controls=button('begin','一起出發','go');
   else if(done)controls=button('replay','再玩一次','go')+button('picker','換一課','left');
   else if(checkpoint)controls=button('next','下一站','go');
   else if(playing&&lesson.kind==='cake')controls=button('left','左轉','left',true)+button('right','右轉','right',true)+button('go','踏板','go',true)+button('brake','煞車','brake',true);
   else if(playing&&lesson.kind==='crossing')controls=button('brake','停下','brake',true)+button('look-left','看左','eye')+button('look-right','看右','eye')+button('depart','出發','go');
   else if(playing&&lesson.kind==='tickets')controls=`<div class="content-platforms">${lesson.platforms.map((t,i)=>`<button data-platform="${i}" aria-label="${t.name}月台">${shape(t)}</button>`).join('')}</div>`+button('go','前進','go',true)+button('brake','停穩','brake',true)+button('door','開門','door');
   $('controls').innerHTML=controls+button('listen','再聽一次','sound');bindHolds();
  }
  dialog.querySelector('.cake-flag').style.transform=`rotate(${lesson.tilt}deg)`;
  dialog.querySelector('.content-car').style.transform=`translateX(${lesson.steer*35}px) rotate(${lesson.steer*9}deg)`;
  dialog.querySelector('.content-stamps').innerHTML=lesson.kind==='cake'?['start','turn','stop'].map((k,i)=>`<span class="${lesson.skills[k]||lesson.smooth[k]>.25?'earned':''}">${icon(['go','right','brake'][i])}</span>`).join(''):'';
  dialog.querySelectorAll('.content-route i').forEach((el,i)=>el.classList.toggle('complete',i<lesson.stage||done));
  dialog.querySelector('.content-scene-cue').textContent=lesson.kind==='cake'?['海風路','燈塔彎','榕樹灣'][lesson.stage]:lesson.kind==='crossing'?(lesson.looked.left?'左邊看好了':'← 看左邊')+'　'+(lesson.looked.right?'右邊看好了':'看右邊 →'):lesson.target.name+'車票';
  dialog.querySelector('.content-ticket').innerHTML=lesson.kind==='tickets'?shape(lesson.target):'';
  dialog.querySelectorAll('[data-platform]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.platform)===lesson.selected)));
  const walker=dialog.querySelector('.content-walker');walker.replaceChildren();
  if(lesson.kind==='crossing'&&lesson.crossed<3){const who=CROSSING_ORDERS[lesson.stage][lesson.crossed],pose=readSettings().reducedMotion||matchMedia('(prefers-reduced-motion:reduce)').matches?0:Math.floor(lesson.crossTime*5)%2;walker.innerHTML=image(`art/content-r1/${who}-${pose}.png`,{child:'行人',bike:'腳踏車',grandma:'推菜籃奶奶'}[who]);walker.style.left=matchMedia('(prefers-reduced-motion:reduce)').matches?'50%':`${10+lesson.crossTime/2.1*70}%`;}
  dialog.querySelector('.content-train').style.transform=matchMedia('(prefers-reduced-motion:reduce)').matches?'none':`translateX(${Math.max(0,1-lesson.distance/30)*35}px)`;
  const passengers=dialog.querySelector('.content-passengers');passengers.innerHTML=lesson.kind==='tickets'&&(lesson.phase==='boarding'||checkpoint||done)?image(`art/r5/passenger-${lesson.stage+1}-${Math.floor(lesson.boardTime*5)%2}.png`,'朋友上車中'):'';
  passengers.style.transform=`translateX(${-Math.min(1,lesson.boardTime/1.2)*85}px)`;
  if((done||checkpoint)&&!dialog.dataset.saved){dialog.dataset.saved='yes';persist();celebrate({text:done?'一起到站了！':'謝謝你照顧朋友！',kind:'finish',pieces:24,sound:!readSettings().muted});}
 }
 function release(){lesson?.release();dialog.querySelectorAll('[data-hold]').forEach(b=>b.setAttribute('aria-pressed','false'));}
 function bindHolds(){dialog.querySelectorAll('[data-hold]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);if(lesson&&!lesson.paused){lesson.hint='';lesson.input[b.dataset.action]=true;b.setAttribute('aria-pressed','true');}});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>{if(lesson)lesson.input[b.dataset.action]=false;b.setAttribute('aria-pressed','false');});b.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();lesson.input[b.dataset.action]=true;}});b.addEventListener('keyup',()=>{lesson.input[b.dataset.action]=false;});});}
 function loop(now){if(!dialog.open||!lesson)return;lesson.update(last?Math.min((now-last)/1000,.05):0);last=now;if(now-drawAt>80){render();drawAt=now;}raf=requestAnimationFrame(loop);}
 function pick(){cancelAnimationFrame(raf);lesson=null;phase='';$('picker').hidden=false;$('play').hidden=true;$('rest').hidden=true;$('title').textContent='海岸實作課';dialog.dataset.kind='';dialog.querySelectorAll('[data-record]').forEach(el=>el.textContent=records()[el.dataset.record]?.completed?'一起完成了！':'慢慢學，不用趕');}
 function start(kind,replay=false){lesson=new ContentLesson(kind,replay?{}:records()[kind]);phase='';dialog.dataset.saved='';$('picker').hidden=true;$('play').hidden=false;$('rest').hidden=true;last=0;spoken='';render();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);}
 function pause(){if(!lesson||lesson.paused)return;lesson.pause();$('rest').hidden=false;$('play').hidden=true;void stopNativeSpeech();}
 function close(){release();cancelAnimationFrame(raf);void stopNativeSpeech();dialog.close();opener.focus();}
 opener.onclick=()=>{pick();dialog.showModal();};$('back').onclick=close;$('leave').onclick=close;$('pause').onclick=pause;$('resume').onclick=()=>{lesson.paused=false;$('rest').hidden=true;$('play').hidden=false;last=0;render();};
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});dialog.addEventListener('click',e=>{const entry=e.target.closest('[data-content]');if(entry){start(entry.dataset.content);return;}if(!lesson)return;const platform=e.target.closest('[data-platform]');if(platform){lesson.select(Number(platform.dataset.platform));render();return;}const b=e.target.closest('[data-action]');if(!b||b.dataset.hold)return;const a=b.dataset.action;lesson.hint='';if(a==='begin')lesson.begin();if(a==='next'){lesson.next();dialog.dataset.saved='';}if(a==='replay'){start(lesson.kind,true);return;}if(a==='picker'){pick();return;}if(a==='look-left'||a==='look-right')lesson.look(a.slice(5));if(a==='depart')lesson.depart();if(a==='door')lesson.door();if(a==='listen')announce($('hint').textContent,true);render();});
 addEventListener('blur',()=>{if(dialog.open)pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&dialog.open)pause();});
 registerGameLifecycle({getState:()=>({paused:!dialog.open||!lesson||lesson.paused,completed:lesson?.completed}),pause});registerNativeOverlay({isOpen:()=>dialog.open,close});
}
