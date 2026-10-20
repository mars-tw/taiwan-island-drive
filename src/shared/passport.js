import './passport.css';
import {appUrl} from './paths.js';
import {pauseNativeGames,isNativeBuild,nativeLocalHref,stopNativeSpeech} from './native.js';
import {MODE_NAMES,journeysFor,readPassport,isJourneyOpen,completeJourney,passportSummary,nextJourney,subscribePassport} from './journeys.js';
import {academySummary} from './academy.js';

export function launchJourney(journey,{academy=false}={}){
  if(!journey||!isJourneyOpen(journey.id))return;
  if(academy&&academySummary().next?.id!==journey.id)return;
  const url=appUrl(`${journey.mode}/?journey=${encodeURIComponent(journey.id)}${academy?'&academy=1':''}`);
  void stopNativeSpeech().finally(()=>location.assign(isNativeBuild()?nativeLocalHref(url,document.baseURI):url));
}
export function journeyResult(container,journey,rating){
  if(!journey)return;
  completeJourney(journey.id,rating);
  container.querySelector('.journey-result')?.remove();
  const panel=document.createElement('div');panel.className='journey-result';
  const inAcademy=new URLSearchParams(location.search).get('academy')==='1',campaign=academySummary();
  const next=inAcademy?(campaign.next?{...campaign.next,mode:campaign.next.id.split('-')[0]}:null):nextJourney(journey.id),summary=passportSummary();
  const text=document.createElement('p');text.textContent=`${journey.story} 護照 ${summary.completed}／12 關。`;panel.append(text);
  const button=document.createElement('button');button.type='button';button.id='journey-next';
  button.textContent=next?`${inAcademy?'下一章':'下一關'}：${next.name}`:inAcademy?'山海同行章！回學院':'四關完成！看看護照';
  button.onclick=()=>next?launchJourney(next,{academy:inAcademy}):inAcademy?location.assign(appUrl()):document.querySelector('[data-open-passport]').click();panel.append(button);container.append(panel);
}
let installed=false;
export function installPassport(){
  if(installed)return;installed=true;
  const current=document.body.dataset.game||'car';let mode=current;
  const opener=document.createElement('button');opener.type='button';opener.dataset.openPassport='';opener.className='passport-open';opener.textContent='學生證';
  const host=document.querySelector('.academy-nav,.header-tools');if(!host)return;host.append(opener);
  const dialog=document.createElement('dialog');dialog.id='passport-dialog';dialog.setAttribute('aria-labelledby','passport-title');
  dialog.innerHTML='<header class="passport-header"><div><h2 id="passport-title">我的星星護照</h2><p id="passport-summary"></p></div><button id="passport-close" aria-label="關閉星星護照">×</button></header><div class="passport-tabs" role="group" aria-label="選擇交通工具"></div><div id="passport-chapters"></div><p id="passport-note">完成一關，就能開下一關。星等會記在這台裝置。</p>';
  const tabs=dialog.querySelector('.passport-tabs');
  for(const [key,label] of Object.entries(MODE_NAMES)){
    const button=document.createElement('button');button.type='button';button.dataset.passportMode=key;button.textContent=label;
    button.onclick=()=>{mode=key;render();};tabs.append(button);
  }
  function render(){
    const passport=readPassport(),summary=passportSummary(passport);
    dialog.querySelector('#passport-summary').textContent=`${summary.completed}／12 關 · ${summary.stars}／36 顆評等星${summary.badges.length?` · ${summary.badges.map(key=>MODE_NAMES[key]+'章').join('、')}`:''}`;
    tabs.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.passportMode===mode)));
    const chapters=dialog.querySelector('#passport-chapters');chapters.replaceChildren();
    journeysFor(mode).forEach((journey,index)=>{
      const open=isJourneyOpen(journey.id,passport),rating=passport.ratings[journey.id]||0;
      const button=document.createElement('button');button.type='button';button.className='passport-chapter';button.dataset.journey=journey.id;button.disabled=!open;
      const title=document.createElement('strong');title.textContent=`${index+1} ${journey.name}`;
      const detail=document.createElement('span');detail.textContent=open?journey.goal:`先完成第 ${index} 關`;
      const stars=document.createElement('b');stars.className='passport-rating';stars.textContent=open?`${'★'.repeat(rating)}${'☆'.repeat(3-rating)}`:'待解鎖';
      button.append(title,detail,stars);button.onclick=()=>launchJourney(journey);chapters.append(button);
    });
  }
  opener.onclick=()=>{pauseNativeGames();mode=current;render();dialog.showModal();};
  dialog.querySelector('#passport-close').onclick=()=>dialog.close();
  document.body.append(dialog);subscribePassport(()=>{if(dialog.open)render();});
  dialog.querySelector('#passport-title').textContent='我的學院學生證';
  dialog.addEventListener('close',()=>{document.querySelector('#passport-note').textContent='完成一關，就能開下一關。星等會記在這台裝置。';});
  const renderStudent=()=>{if(!dialog.open)return;const s=academySummary();dialog.querySelector('#passport-note').textContent=`山海同行 ${s.done.filter(Boolean).length}／4 章 · ${s.mathBadge?'數學調度章已取得':'列車數學課等你來'}${s.badge?' · 山海同行章已取得':''}。各課共用星星與本機進度。`;};
  opener.addEventListener('click',renderStudent);addEventListener('studentchange',renderStudent);
  addEventListener('pageshow',()=>{if(dialog.open)render();});
}
