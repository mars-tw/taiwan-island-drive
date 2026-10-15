import './safety.css';
import {SafetyLesson,SAFETY_STOPS,createSafetyStorage} from './safety-lesson.js';
import {appUrl} from './paths.js';
import {registerGameLifecycle,registerNativeOverlay} from './native.js';

export function installSafetyLesson() {
  const opener=document.getElementById('safety-start');if(!opener)return;
  const store=createSafetyStorage();let lesson,previous=0,raf=0,lastDraw=0,visible=false;
  const dialog=document.createElement('dialog');dialog.id='safety-lesson';
  dialog.setAttribute('aria-labelledby','safety-title');
  dialog.innerHTML=`<header class="safety-header"><button id="safety-back">回大廳</button><span>島嶼觀察簿</span><button id="safety-pause">暫停</button></header>
    <div class="safety-route" aria-label="三站學習進度"><span>公路</span><span>月台</span><span>跑道</span></div>
    <section class="safety-main"><div class="safety-scene"><img id="safety-image" alt=""><div class="safety-scene-caption">交通觀察課</div><div class="safety-signal"><strong id="safety-signal"></strong><span id="safety-detail"></span><progress id="safety-meter" max="4" value="0" aria-label="觀察等候進度"></progress></div></div>
    <div class="safety-work"><p id="safety-step"></p><h2 id="safety-title"></h2><p id="safety-rule"></p><p id="safety-hint" role="status" aria-live="polite"></p>
    <div class="safety-controls"><button id="safety-begin">開始這一站</button><button id="safety-brake">按住煞車</button><button id="safety-door"></button><button id="safety-wait">等一等</button><button id="safety-depart">確認出發</button><button id="safety-next">下一站</button><button id="safety-replay">再練一次</button><button id="safety-finish">帶著觀察章回大廳</button></div>
    <p id="safety-save"></p></div></section>
    <section id="safety-paused" hidden><h2>休息一下</h2><p>號誌與等候時間都停下來了。</p><button id="safety-resume">繼續觀察</button><button id="safety-leave">回大廳</button></section>`;
  document.body.append(dialog);
  const $=id=>dialog.querySelector(`#safety-${id}`);
  function updateOpener(){const n=store.read().completed;opener.textContent=n===3?'安全觀察章：再練一次':n?`接著觀察：第 ${n+1} 站`:'第一課：停、看、再出發';}
  function render(){
    if(!lesson)return;
    const info=SAFETY_STOPS[lesson.stage],playing=lesson.phase==='playing',done=lesson.phase==='done',checkpoint=lesson.phase==='checkpoint';
    dialog.dataset.transport=info.mode;dialog.dataset.phase=lesson.phase;
    if($('image').dataset.mode!==info.mode){$('image').src=appUrl(`previews/${info.mode}.png`);$('image').dataset.mode=info.mode;}
    $('step').textContent=done?'三站完成 · 安全觀察章':`第 ${lesson.stage+1} 站／共 3 站`;
    $('title').textContent=done?'會等候，也會確認！':info.name;
    $('rule').textContent=done?'把「先停穩、看清楚、再出發」帶進接下來的旅程。':info.rule;
    $('signal').textContent=done?'安全觀察章':lesson.stage===0?(lesson.speed>0?'先煞停':lesson.clear?'綠燈 · 路口空了':'紅燈 · 路口通行中'):lesson.stage===1?(lesson.speed>0?'列車移動中':lesson.doors?(lesson.boarded?'朋友上車了':'朋友上車中'):(lesson.boarded?'車門已關好':'停穩了 · 可以開門')):(lesson.clear?'跑道空了':'跑道使用中');
    $('detail').textContent=done?'公路、月台、跑道，都看清楚了。':lesson.stage<2?`移動速度 ${Math.ceil(lesson.speed)} · ${lesson.stage===1?(lesson.doors?'車門開啟':'車門關閉'):'煞停後開始觀察'}`:'先按等一等，再觀察跑道是否清空。';
    $('meter').value=lesson.observed;
    $('hint').textContent=lesson.message||(lesson.paused?'觀察已暫停。':checkpoint?'這一站完成，觀察紀錄已留下。':lesson.phase==='intro'?'先讀上面的提示，再開始操作。':done?'可以回大廳開汽車、火車或飛機。':lesson.ready?'條件都確認了，可以出發。':lesson.stage<2&&lesson.speed>0?'按住煞車，讓速度慢慢降到 0。':lesson.stage===0?'留在原地，等路口清空。':lesson.stage===1?(lesson.boarded?'關好車門再出發。':lesson.doors?'車門開著，等朋友上車。':'點開門接客。'):'點「等一等」，看跑道狀態變化。');
    const shown={begin:lesson.phase==='intro',brake:playing&&lesson.stage<2,door:playing&&lesson.stage===1,wait:playing&&lesson.stage===2,depart:playing,next:checkpoint,replay:done,finish:done};
    for(const [id,show] of Object.entries(shown))$(id).hidden=!show;
    $('door').textContent=lesson.doors?'關好車門':'開門接客';
    $('brake').setAttribute('aria-pressed',String(lesson.braking));
    $('pause').hidden=done||checkpoint||lesson.phase==='intro';
    $('paused').hidden=!lesson.paused;
    $('save').textContent=store.saved?'每站完成後存在這台裝置；中途離開會從這一站重新觀察。':'這次無法儲存；關閉 App 後，觀察紀錄可能不會保留。';
    [...dialog.querySelectorAll('.safety-route span')].forEach((el,index)=>{el.classList.toggle('stamped',index<lesson.completed);el.setAttribute('aria-current',String(index===lesson.stage));});
  }
  function pause(){if(!visible||!lesson||lesson.phase!=='playing')return;lesson.pause();render();$('resume').focus();}
  function close(){lesson?.pause();visible=false;cancelAnimationFrame(raf);dialog.close();updateOpener();opener.focus();}
  function frame(now){if(!visible)return;lesson.tick(previous?(now-previous)/1000:0);previous=now;if(now-lastDraw>80){render();lastDraw=now;}raf=requestAnimationFrame(frame);}
  opener.onclick=()=>{lesson=new SafetyLesson({...store.read(),checkpoint:value=>{store.save(value);updateOpener();}});visible=true;previous=0;render();dialog.showModal();raf=requestAnimationFrame(frame);$('begin').hidden?$('replay').focus():$('begin').focus();};
  for(const [id,action] of Object.entries({begin:'begin',next:'next',replay:'replay',wait:'wait',depart:'depart'}))$(id).onclick=()=>{lesson.act(action);render();if(action==='next'||action==='replay')$('begin').focus();};
  $('door').onclick=()=>{lesson.act(lesson.doors?'close':'open');render();};
  const brake=$('brake');
  brake.onpointerdown=event=>{if(event.button!==0)return;event.preventDefault();brake.setPointerCapture(event.pointerId);lesson.act('brake');render();};
  function release(){lesson?.act('release');render();}
  for(const event of ['pointerup','pointercancel','lostpointercapture'])brake.addEventListener(event,release);
  brake.onkeydown=event=>{if([' ','Enter'].includes(event.key)){event.preventDefault();lesson.act('brake');render();}};
  brake.onkeyup=event=>{if([' ','Enter'].includes(event.key)){event.preventDefault();release();}};
  brake.onblur=release;
  $('pause').onclick=pause;$('resume').onclick=()=>{lesson.resume();previous=0;render();$('pause').focus();};
  for(const id of ['back','leave','finish'])$(id).onclick=close;
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  addEventListener('pagehide',()=>{lesson?.pause();cancelAnimationFrame(raf);});
  registerGameLifecycle({getState:()=>({paused:!visible||lesson?.paused!==false,completed:lesson?.phase==='done'}),pause});
  registerNativeOverlay({isOpen:()=>dialog.open,close});updateOpener();
}
