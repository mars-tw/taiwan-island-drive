import './navigation.css';
import './parent-gate.css';
import './web-preview.css';
import { APP_BASE, APP_REPOSITORY, appUrl } from './paths.js';
import { readSettings, updateSettings,subscribeSettings,restoreLegacySettings,SETTINGS_KEY } from './settings.js';
import { installParentGate } from './parent-gate.js';
import { unlockCelebrationAudio,playChime } from './celebrate.js';
import { installPassport } from './passport.js';
import {academySummary} from './academy.js';
import {STUDENT_KEY,readStudent,restoreStudentIfMissing,subscribeStudent} from './student-save.js';
import { isNativeBuild,initNativeRuntime,nativeLocalHref,syncNativePreferences,disposeNativeRuntime,stopNativeSpeech } from './native.js';
import { t,setText,setAttr,applyLanguage,onLanguageChange,getLanguage,restoreLanguageIfMissing,LANGUAGE_KEY } from './i18n.js';

if (typeof document !== 'undefined') {
  const mode = document.body.dataset.game;
  const webPreview = document.body.dataset.webPreview === 'true';
  document.body.classList.add('academy-game');
  if (!webPreview) {
    const nav = document.createElement('nav');
    nav.className = 'academy-nav'; setAttr(nav, 'aria-label', '交通學院');
    nav.innerHTML = `<a href="${appUrl()}" ${!mode?'aria-current="page"':''}>⌂<span></span></a><a href="${appUrl('car/')}" ${mode==='car'?'aria-current="page"':''}>🚗<span></span></a><a href="${appUrl('train/')}" ${mode==='train'?'aria-current="page"':''}>🚆<span></span></a><a href="${appUrl('flight/')}" ${mode==='flight'?'aria-current="page"':''}>✈<span></span></a>`;
    // R50: labels keep their key on the element, so copies of this nav (lesson headers) switch language too.
    setAttr(nav.querySelector('a'), 'aria-label', '回到交通學院');
    ['回學院','汽車','火車','飛機'].forEach((label, index) => setText(nav.querySelectorAll('a>span')[index], label));
    document.body.prepend(nav);
  }
  document.querySelectorAll('[data-app-url]').forEach(link => link.href = appUrl(link.dataset.appUrl));
  document.querySelectorAll('[data-repository]').forEach(link => link.href = APP_REPOSITORY);
  if(isNativeBuild()){document.body.classList.add('is-native-app');document.querySelectorAll('a[href]').forEach(link=>{try{const url=new URL(link.href,document.baseURI);if(url.protocol===location.protocol&&url.host===location.host)link.href=nativeLocalHref(url.href,document.baseURI);}catch{}});}
  addEventListener('pointerdown',unlockCelebrationAudio,{passive:true});addEventListener('keydown',unlockCelebrationAudio);
  document.addEventListener('click',event=>{const control=event.target?.closest?.('button,summary,a');if(control&&!control.disabled&&!control.closest('.dispatch-controls'))playChime('tap',{volume:.05});});
  installParentGate();void initNativeRuntime().then(async()=>{if(!isNativeBuild())return;await syncNativePreferences({key:STUDENT_KEY,read:readStudent,update:restoreStudentIfMissing,subscribe:subscribeStudent});await syncNativePreferences({key:SETTINGS_KEY,read:readSettings,update:restoreLegacySettings,subscribe:()=>()=>{}});await syncNativePreferences({key:LANGUAGE_KEY,read:()=>({language:getLanguage()}),update:restoreLanguageIfMissing,subscribe:fn=>onLanguageChange(language=>fn({language}))});});
  installPassport();
  if(mode&&new URLSearchParams(location.search).get('academy')==='1'){
    const s=academySummary(),card=document.querySelector('.academy-nav [aria-current]');
    const label=()=>{setText(card.querySelector('span'),mode==='train'?'調度 {n} 人':mode==='car'?'補給運送':'空中路標',mode==='train'?{n:s.passengers}:undefined);card.setAttribute('aria-label',t('山海同行任務 · {task}',{task:mode==='train'?t('調度單：前車帶走 {n} 人，停穩接朋友。',{n:s.passengers}):mode==='car'?t('列車朋友已到站，沿海岸送補給。'):t('補給已送達，找兩顆空中路標。')}));};
    if(card){label();onLanguageChange(label);}
  }
  // R50: <html lang>, <title> and the meta description follow the chosen language on every page.
  applyLanguage();
  addEventListener('pagehide',()=>{void disposeNativeRuntime();});
  document.addEventListener('click',event=>{const link=event.target?.closest?.('a[href]');if(!link||!isNativeBuild())return;try{const url=new URL(link.href,document.baseURI);if(url.protocol===location.protocol&&url.host===location.host){event.preventDefault();void stopNativeSpeech().finally(()=>location.assign(nativeLocalHref(url.href,document.baseURI)));}}catch{}},true);
  if ('serviceWorker' in navigator && import.meta.env.PROD&&!isNativeBuild()&&!webPreview) {
    navigator.serviceWorker.register(appUrl('sw.js'), { scope: APP_BASE }).catch(error => console.warn('Offline setup:', error.message));
  }
  window.__transportAcademy = { base: APP_BASE, readSettings, updateSettings, repository: APP_REPOSITORY };
}
