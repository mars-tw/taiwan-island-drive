import './academy.css';
import {artImage} from './art-refresh.js';
import {ACADEMY_CHAPTERS,academySummary,readAcademy,performDispatch,importTrainBackup} from './academy.js';
import {dispatchMarkup,dispatchLesson} from '../games/math/dispatch.js';
import {launchJourney} from './passport.js';
import {journeyById} from './journeys.js';
import {studentSaved} from './student-save.js';
import {celebrate} from './celebrate.js';
import {readSettings} from './settings.js';
import {pauseNativeGames,registerGameLifecycle,registerNativeOverlay} from './native.js';

export function installAcademy(){
  const start=document.getElementById('academy-start');if(!start)return;
  const dialog=document.createElement('dialog');dialog.id='math-lesson';dialog.setAttribute('aria-label','列車數學課');document.body.append(dialog);
  let paused=false,visible=false,cast=null;
  function update(){const s=academySummary(),a=readAcademy();
    document.getElementById('academy-chapter').textContent=s.badge?'山海教室開課了！':`第 ${s.index+1} 章：${s.next.name}`;
    document.getElementById('academy-story').textContent=s.badge?'學員證收齊調度、接客、運送與找路紀錄。再跑一趟，或選交通工具練習。':s.next.story;
    start.textContent=s.badge?'再上列車數學課':s.index===0?(a.dispatch.active&&a.dispatch.active.phase!=='done'?'繼續列車數學課':'接下第一份調度單'):`繼續：${s.next.name}`;
    document.getElementById('academy-route').textContent=ACADEMY_CHAPTERS.map((c,i)=>`${s.done[i]?'✓':'○'} ${c.name}`).join(' → ');
    document.getElementById('academy-record').textContent=`學生證 · ${s.done.filter(Boolean).length}／4 章${s.mathBadge?' · 數學調度章':''}${s.badge?' · 山海同行章':''}${a.imported?' · 已保留小小列車長紀錄':''}`;
  }
  function render(message='',previous=new Map(),action=''){
    const a=readAcademy();dialog.innerHTML=dispatchMarkup(a.dispatch,message);
    dialog.querySelectorAll('.dispatch-wheels').forEach(wheels=>{wheels.replaceChildren();for(let i=0;i<2;i++){const wheel=document.createElement('span');wheel.textContent='●';wheels.append(wheel);}});
    if(a.dispatch.active?.phase==='intro')dialog.querySelector('.dispatch-instruction').textContent='海風站的朋友要去山海教室。一起請朋友上車，再分成兩車。';
    dialog.dataset.phase=a.dispatch.active?.phase;
    const phase=a.dispatch.active.phase,q=a.dispatch.active;
    const total=dispatchLesson(q.level,a.dispatch.completed-(phase==='done'?1:0)).total;
    if(!cast||cast.front.length!==q.front||cast.rear.length!==q.rear||cast.front.length+cast.rear.length+cast.queue.length!==total)cast={front:Array.from({length:q.front},(_,i)=>i),rear:Array.from({length:q.rear},(_,i)=>q.front+i),queue:Array.from({length:total-q.front-q.rear},(_,i)=>q.front+q.rear+i)};
    const passenger=(id,seated=true)=>{const figure=document.createElement('span');figure.className='passenger-figure';figure.dataset.passenger=id;figure.append(artImage(`passenger-${id%6+1}-0`,'',seated?'passenger-face':'passenger-wait'),artImage(`passenger-${id%6+1}-1`,'','passenger-step'));return figure;};
    for(const side of ['front','rear'])dialog.querySelectorAll(`.dispatch-carriage.${side} .occupied`).forEach((seat,index)=>seat.replaceChildren(passenger(cast[side][index])));
    dialog.querySelectorAll('.dispatch-carriage').forEach((carriage,i)=>{const shell=artImage(i?'carriage-orange':'carriage-blue','','carriage-shell');shell.src=shell.src.replace('/r4/','/r5/');carriage.append(shell);});
    const body=dialog.querySelector('.dispatch-body'),equation=dialog.querySelector('.dispatch-equation'),train=dialog.querySelector('.dispatch-train');
    if(phase==='load')equation.textContent=`${q.front}／${dispatchLesson(q.level,a.dispatch.completed).total} 位朋友上車`;
    dialog.querySelector('.dispatch-feedback').hidden=!message||message.startsWith('再看看')||phase==='done'||(['split','subtract'].includes(phase)&&action==='check');
    if(['split','subtract'].includes(phase))body.insertBefore(equation,train);
    if(['intro','load'].includes(phase)){const queue=document.createElement('div');queue.className='platform-queue';queue.setAttribute('aria-label','月台等車的朋友');for(const id of cast.queue)queue.append(passenger(id,false));body.insertBefore(queue,train);}
    if(['subtract','done'].includes(phase)){const sign=document.createElement('span');sign.className='stay-sign';sign.textContent='留在海風站';dialog.querySelector('.dispatch-carriage.rear').append(sign);}
    dialog.querySelector('.dispatch-coupler').textContent=['subtract','done'].includes(a.dispatch.active?.phase)?'分開':'相連';
    const top=dialog.querySelector('.dispatch-top');top.classList.add('academy-nav');
    // Rebuild from the same global navigation, at the same x/y positions.
    top.replaceChildren(...[...document.querySelectorAll('body>.academy-nav>a')].map(e=>e.cloneNode(true)));
    top.querySelector('a').id='math-back';top.querySelector('a').onclick=e=>{e.preventDefault();close();};
    const pauseButton=document.createElement('button');pauseButton.id='math-pause';pauseButton.textContent='暫停';pauseButton.setAttribute('aria-label','暫停列車數學課');pauseButton.onclick=pause;top.append(pauseButton);
    if(a.dispatch.active?.phase==='done'){
      const next=document.createElement('button');next.id='math-next';next.textContent='去接朋友 →';next.onclick=()=>{close();launchJourney(journeyById('train-1'),{academy:true});};
      dialog.querySelector('.dispatch-controls').prepend(next);
      dialog.querySelector('[data-dispatch=start]').textContent='再開一班';
      dialog.querySelector('#dispatch-title').textContent='調度完成！';
      const awards=document.createElement('div');awards.className='dispatch-awards';const total=q.front+q.rear;
      for(const [title,formula,icon] of [['合起來',`${q.front} ＋ ${q.rear} ＝ ${total}`,'badge'],['分開算',`${total} − ${q.rear} ＝ ${q.front}`,'route-badge']]){const card=document.createElement('section');card.className='math-award';card.append(artImage(icon));const label=document.createElement('strong');label.textContent=title;const number=document.createElement('b');number.textContent=formula;card.append(label,number);awards.append(card);}equation.replaceWith(awards);
      const stage=document.createElement('div');stage.className='celebration-stage';stage.append(artImage('confetti','','celebration-confetti'),artImage('train','','departure-train'));body.insertBefore(stage,awards);train.hidden=true;
    }
    const coach=document.createElement('div');coach.className='dispatch-coach';coach.append(artImage('coach','阿路教練'),artImage('coach-cheer','','coach-cheer'));const cue=document.createElement('span');cue.textContent={intro:'我是阿路！一起接朋友去山海教室。',load:'月台的朋友在等你，請他們上車吧！',split:'朋友換車廂，總人數一樣多。',subtract:'橘色車廂留下來，藍色車廂帶走幾人？',done:'你會合起來，也會分開算。綠旗出發！'}[phase];coach.append(cue);body.append(coach);
    if(phase==='done')body.querySelector('.celebration-stage').append(coach);
    const note=document.createElement('p');note.className='math-save';note.setAttribute('role','status');note.hidden=studentSaved();note.textContent=studentSaved()?'學生證已存在這台裝置。':'這次無法儲存，關閉後可能不會保留。';dialog.querySelector('.dispatch-body').append(note);
    if(!studentSaved()){note.classList.add('save-failed');const completed=dialog.querySelector('.dispatch-completed');if(completed)completed.textContent=`已完成 ${a.dispatch.completed} 班調度；本次尚未儲存。`;}
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
      // An overlay lets the same child walk through the aisle above both window frames.
      // The duplicate is presentation only; seated identity/count and lesson state never change.
      if(['add','remove','to-rear','to-front'].includes(action))dialog.querySelectorAll('[data-passenger]').forEach(figure=>{
        const old=previous.get(figure.dataset.passenger),now=figure.getBoundingClientRect();
        if(!old||Math.abs(old.x-now.x)+Math.abs(old.y-now.y)<3)return;
        const origin=dialog.getBoundingClientRect(),ghost=figure.cloneNode(true);ghost.removeAttribute('data-passenger');ghost.dataset.movingPassenger=figure.dataset.passenger;ghost.className='passenger-figure passenger-transit is-walking';ghost.setAttribute('aria-hidden','true');ghost.querySelectorAll('.passenger-face').forEach(e=>e.classList.remove('passenger-face'));
        Object.assign(ghost.style,{left:`${now.x-origin.x-dialog.clientLeft}px`,top:`${now.y-origin.y-dialog.clientTop}px`,width:`${now.width}px`,height:`${now.height}px`});dialog.append(ghost);figure.style.visibility='hidden';
        const dx=old.x-now.x,dy=old.y-now.y,vertical=['to-rear','to-front'].includes(action)&&Math.abs(dy)>80;
        const track=train.getBoundingClientRect(),aisle=track.right-track.width*.06-7-now.x-now.width/2;
        const frames=vertical?[{transform:`translate(${dx}px,${dy}px)`},{transform:`translate(${aisle}px,${dy}px)`,offset:.28},{transform:`translate(${aisle}px,0)`,offset:.72},{transform:'translate(0,0)'}]:[{transform:`translate(${dx}px,${dy}px)`},{transform:'translate(0,0)'}];
        ghost.dataset.path=vertical?'carriage-aisle':'boarding';const motion=ghost.animate(frames,{duration:700,easing:'ease-in-out'});
        motion.onfinish=()=>{figure.style.visibility='';ghost.remove();};
      });
      if(phase==='subtract'&&action==='check')dialog.querySelector('.dispatch-carriage.rear').animate([{transform:'translateX(-24px)'},{transform:'translateX(0)'}],{duration:650,easing:'ease-out'});
    }
    dialog.querySelectorAll('[data-dispatch]').forEach(button=>button.onclick=()=>{if(paused)return;const action=button.dataset.dispatch,before=readAcademy().dispatch;const rects=new Map([...dialog.querySelectorAll('[data-passenger]')].map(e=>[e.dataset.passenger,e.getBoundingClientRect()]));const r=performDispatch(action,readSettings().childMode?'small':'medium');
      if(cast&&before.active&&r.state.active){const next=r.state.active;
        if(action==='add'&&next.front>before.active.front)cast.front.push(cast.queue.shift());
        if(action==='remove'&&next.front<before.active.front)cast.queue.unshift(cast.front.pop());
        if(action==='to-rear'&&next.rear>before.active.rear)cast.rear.push(cast.front.pop());
        if(action==='to-front'&&next.front>before.active.front)cast.front.push(cast.rear.pop());
      }
      render(r.message,rects,action);(dialog.querySelector(`[data-dispatch="${action}"]:not(:disabled)`)||dialog.querySelector('[data-dispatch]:not(:disabled)'))?.focus();if(r.state.completed>before.completed)celebrate({text:'數學調度章 ＋1',kind:'station',sound:!readSettings().muted});update();});
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
