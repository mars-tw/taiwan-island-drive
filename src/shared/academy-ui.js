import './academy.css';
import {ACADEMY_CHAPTERS,academySummary,readAcademy,performDispatch,importTrainBackup} from './academy.js';
import {dispatchMarkup} from '../games/math/dispatch.js';
import {launchJourney} from './passport.js';
import {journeyById} from './journeys.js';
import {studentSaved} from './student-save.js';
import {celebrate} from './celebrate.js';
import {readSettings} from './settings.js';
import {pauseNativeGames,registerGameLifecycle,registerNativeOverlay} from './native.js';

export function installAcademy(){
  const start=document.getElementById('academy-start');if(!start)return;
  const dialog=document.createElement('dialog');dialog.id='math-lesson';dialog.setAttribute('aria-label','列車數學課');document.body.append(dialog);
  let paused=false,visible=false;
  function update(){const s=academySummary(),a=readAcademy();
    document.getElementById('academy-chapter').textContent=s.badge?'山海教室開課了！':`第 ${s.index+1} 章：${s.next.name}`;
    document.getElementById('academy-story').textContent=s.badge?'學員證收齊調度、接客、運送與找路紀錄。再跑一趟，或選交通工具練習。':s.next.story;
    start.textContent=s.badge?'再上列車數學課':s.index===0?(a.dispatch.active&&a.dispatch.active.phase!=='done'?'繼續列車數學課':'接下第一份調度單'):`繼續：${s.next.name}`;
    document.getElementById('academy-route').textContent=ACADEMY_CHAPTERS.map((c,i)=>`${s.done[i]?'✓':'○'} ${c.name}`).join(' → ');
    document.getElementById('academy-record').textContent=`學生證 · ${s.done.filter(Boolean).length}／4 章${s.mathBadge?' · 數學調度章':''}${s.badge?' · 山海同行章':''}${a.imported?' · 已保留小小列車長紀錄':''}`;
  }
  function render(message=''){
    const a=readAcademy();dialog.innerHTML=dispatchMarkup(a.dispatch,message);
    dialog.querySelectorAll('.dispatch-wheels').forEach(wheels=>{wheels.replaceChildren();for(let i=0;i<2;i++){const wheel=document.createElement('span');wheel.textContent='●';wheels.append(wheel);}});
    if(a.dispatch.active?.phase==='intro')dialog.querySelector('.dispatch-instruction').textContent='海風站的朋友要去山海教室。每個圓點是一位乘客，先裝滿，再分車。';
    dialog.dataset.phase=a.dispatch.active?.phase;
    const top=dialog.querySelector('.dispatch-top');top.innerHTML='<button id="math-back">回學院</button><span>列車數學課</span><button id="math-pause">暫停</button>';
    top.querySelector('#math-back').onclick=close;top.querySelector('#math-pause').onclick=pause;
    if(a.dispatch.active?.phase==='done'){
      const next=document.createElement('button');next.id='math-next';next.textContent=`交接 ${a.delivered} 人調度單，去接朋友 →`;next.onclick=()=>{close();launchJourney(journeyById('train-1'),{academy:true});};
      dialog.querySelector('.dispatch-controls').prepend(next);
    }
    const note=document.createElement('p');note.className='math-save';note.setAttribute('role','status');note.textContent=studentSaved()?'學生證已存在這台裝置。':'這次無法儲存，關閉後可能不會保留。';dialog.querySelector('.dispatch-body').append(note);
    if(!studentSaved()){note.classList.add('save-failed');const completed=dialog.querySelector('.dispatch-completed');if(completed)completed.textContent=`已完成 ${a.dispatch.completed} 班調度；本次尚未儲存。`;}
    dialog.querySelectorAll('[data-dispatch]').forEach(button=>button.onclick=()=>{if(paused)return;const action=button.dataset.dispatch,before=readAcademy().dispatch.completed;const r=performDispatch(action,readSettings().childMode?'small':'medium');render(r.message);(dialog.querySelector(`[data-dispatch="${action}"]:not(:disabled)`)||dialog.querySelector('[data-dispatch]:not(:disabled)'))?.focus();if(r.state.completed>before)celebrate({text:'數學調度章 · 共用星星＋1',kind:'station',sound:!readSettings().muted});update();});
  }
  function close(){visible=false;paused=false;dialog.close();update();start.focus();}
  function pause(){if(!visible||paused)return;paused=true;const cover=document.createElement('section');cover.className='math-paused';cover.innerHTML='<h2>休息一下</h2><p>乘客和調度單都等你回來。</p><button id="math-resume">繼續調度</button><button id="math-leave">回學院</button>';dialog.append(cover);cover.querySelector('#math-resume').onclick=()=>{paused=false;render();dialog.querySelector('#math-pause').focus();};cover.querySelector('#math-leave').onclick=close;cover.querySelector('button').focus();}
  start.onclick=()=>{const s=academySummary();if(s.next&&s.index>0){launchJourney(journeyById(s.next.id),{academy:true});return;}
    pauseNativeGames();performDispatch('start',readSettings().childMode?'small':'medium');visible=true;paused=false;render();dialog.showModal();dialog.querySelector('[data-dispatch]')?.focus();};
  const practice=document.getElementById('math-practice');practice.onclick=()=>{pauseNativeGames();performDispatch('start',readSettings().childMode?'small':'medium');visible=true;paused=false;render();dialog.showModal();};
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  registerGameLifecycle({getState:()=>({paused:!visible||paused}),pause});registerNativeOverlay({isOpen:()=>dialog.open,close});
  const file=document.getElementById('train-backup');file.onchange=async()=>{const selected=file.files?.[0],status=document.getElementById('train-import-status');if(!selected)return;
    try {if(selected.size>262144)throw Error('備份太大，尚未匯入。');importTrainBackup(await selected.text());status.textContent=studentSaved()?'已保留原備份；數學進度已合併，沒有額外發星星。':'本次無法儲存；請保留原備份後再試。';update();}catch(e){status.textContent=e.message;}file.value='';};
  addEventListener('studentchange',update);addEventListener('pageshow',update);update();
}
