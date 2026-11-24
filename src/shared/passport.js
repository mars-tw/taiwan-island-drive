import './passport.css';
import {appUrl} from './paths.js';
import {pauseNativeGames,isNativeBuild,nativeLocalHref,stopNativeSpeech} from './native.js';
import {MODE_NAMES,journeysFor,readPassport,isJourneyOpen,completeJourney,passportSummary,nextJourney,subscribePassport} from './journeys.js';
import {academySummary} from './academy.js';
import {t,setText,setAttr,joinList,onLanguageChange} from './i18n.js';

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
  const text=document.createElement('p');text.textContent=t('{story} 護照 {done}／12 關。',{story:t(journey.story),done:summary.completed});panel.append(text);
  const button=document.createElement('button');button.type='button';button.id='journey-next';
  button.textContent=next?t(inAcademy?'下一章：{name}':'下一關：{name}',{name:t(next.name)}):t(inAcademy?'山海同行章！回學院':'四關完成！看看護照');
  button.onclick=()=>next?launchJourney(next,{academy:inAcademy}):inAcademy?location.assign(appUrl()):document.querySelector('[data-open-passport]').click();panel.append(button);container.append(panel);
}
let installed=false;
export function installPassport(){
  if(installed)return;installed=true;
  const current=document.body.dataset.game||'car';let mode=current;
  // R50: the label sits in its own marked span, so the coach picture and every copy of this button keep working after a switch.
  const opener=document.createElement('button');opener.type='button';opener.dataset.openPassport='';opener.className='passport-open';opener.append(setText(document.createElement('span'),'學生證'));
  const host=document.querySelector('.academy-nav,.header-tools');if(!host)return;host.append(opener);
  const dialog=document.createElement('dialog');dialog.id='passport-dialog';dialog.setAttribute('aria-labelledby','passport-title');
  dialog.innerHTML='<header class="passport-header"><div><h2 id="passport-title"></h2><p id="passport-summary"></p></div><button id="passport-close">×</button></header><div class="passport-tabs" role="group"></div><div id="passport-chapters"></div><p id="passport-note"></p>';
  setText(dialog.querySelector('#passport-title'),'我的星星護照');setAttr(dialog.querySelector('#passport-close'),'aria-label','關閉星星護照');setAttr(dialog.querySelector('.passport-tabs'),'aria-label','選擇交通工具');setText(dialog.querySelector('#passport-note'),'完成一關，就能開下一關。星等會記在這台裝置。');
  const tabs=dialog.querySelector('.passport-tabs');
  for(const [key,label] of Object.entries(MODE_NAMES)){
    const button=document.createElement('button');button.type='button';button.dataset.passportMode=key;setText(button,label);
    button.onclick=()=>{mode=key;render();};tabs.append(button);
  }
  function render(){
    const passport=readPassport(),summary=passportSummary(passport);
    dialog.querySelector('#passport-summary').textContent=[t('{done}／12 關 · {stars}／36 顆評等星',{done:summary.completed,stars:summary.stars}),...(summary.badges.length?[joinList(summary.badges.map(key=>t('{mode}章',{mode:t(MODE_NAMES[key])})))]:[])].join(' · ');
    tabs.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.passportMode===mode)));
    const chapters=dialog.querySelector('#passport-chapters');chapters.replaceChildren();
    journeysFor(mode).forEach((journey,index)=>{
      const open=isJourneyOpen(journey.id,passport),rating=passport.ratings[journey.id]||0;
      const button=document.createElement('button');button.type='button';button.className='passport-chapter';button.dataset.journey=journey.id;button.disabled=!open;
      const title=document.createElement('strong');title.textContent=`${index+1} ${t(journey.name)}`;
      const detail=document.createElement('span');detail.textContent=open?t(journey.goal):t('先完成第 {n} 關',{n:index});
      const stars=document.createElement('b');stars.className='passport-rating';stars.textContent=open?`${'★'.repeat(rating)}${'☆'.repeat(3-rating)}`:t('待解鎖');
      button.append(title,detail,stars);button.onclick=()=>launchJourney(journey);chapters.append(button);
    });
  }
  opener.onclick=()=>{pauseNativeGames();mode=current;render();dialog.showModal();};
  dialog.querySelector('#passport-close').onclick=()=>dialog.close();
  document.body.append(dialog);subscribePassport(()=>{if(dialog.open)render();});
  setText(dialog.querySelector('#passport-title'),'我的學院學生證');
  dialog.addEventListener('close',()=>{setText(document.querySelector('#passport-note'),'完成一關，就能開下一關。星等會記在這台裝置。');});
  const renderStudent=()=>{if(!dialog.open)return;const s=academySummary();const note=dialog.querySelector('#passport-note');note.removeAttribute('data-i18n');note.textContent=t('{status}。各課共用星星與本機進度。',{status:[t('山海同行 {n}／4 章',{n:s.done.filter(Boolean).length}),t(s.mathBadge?'數學調度章已取得':'列車數學課等你來'),...(s.badge?[t('山海同行章已取得')]:[])].join(' · ')});};
  opener.addEventListener('click',renderStudent);addEventListener('studentchange',renderStudent);
  onLanguageChange(()=>{if(dialog.open){render();renderStudent();}});
  addEventListener('pageshow',()=>{if(dialog.open)render();});
}
