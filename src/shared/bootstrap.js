import './navigation.css';
import './parent-gate.css';
import { APP_BASE, APP_REPOSITORY, appUrl } from './paths.js';
import { readSettings, updateSettings,subscribeSettings,SETTINGS_KEY } from './settings.js';
import { installParentGate } from './parent-gate.js';
import { isNativeBuild,initNativeRuntime,nativeLocalHref,syncNativePreferences,disposeNativeRuntime,stopNativeSpeech } from './native.js';

if (typeof document !== 'undefined') {
  const mode = document.body.dataset.game;
  if (mode) {
    const nav = document.createElement('nav');
    nav.className = 'academy-nav'; nav.setAttribute('aria-label', '交通學院');
    nav.innerHTML = `<a href="${appUrl()}" aria-label="回到交通學院">⌂<span>回大廳</span></a><a href="${appUrl('car/')}" ${mode==='car'?'aria-current="page"':''}>🚗<span>汽車</span></a><a href="${appUrl('train/')}" ${mode==='train'?'aria-current="page"':''}>🚆<span>火車</span></a><a href="${appUrl('flight/')}" ${mode==='flight'?'aria-current="page"':''}>✈<span>飛機</span></a>`;
    document.body.prepend(nav);
    document.body.classList.add('academy-game');
  }
  document.querySelectorAll('[data-app-url]').forEach(link => link.href = appUrl(link.dataset.appUrl));
  document.querySelectorAll('[data-repository]').forEach(link => link.href = APP_REPOSITORY);
  if(isNativeBuild()){document.body.classList.add('is-native-app');document.querySelectorAll('a[href]').forEach(link=>{try{const url=new URL(link.href,document.baseURI);if(url.protocol===location.protocol&&url.host===location.host)link.href=nativeLocalHref(url.href,document.baseURI);}catch{}});}
  installParentGate();void initNativeRuntime();
  if(isNativeBuild())void syncNativePreferences({key:SETTINGS_KEY,read:readSettings,update:updateSettings,subscribe:subscribeSettings});
  addEventListener('pagehide',()=>{void disposeNativeRuntime();});
  document.addEventListener('click',event=>{const link=event.target?.closest?.('a[href]');if(!link||!isNativeBuild())return;try{const url=new URL(link.href,document.baseURI);if(url.protocol===location.protocol&&url.host===location.host){event.preventDefault();void stopNativeSpeech().finally(()=>location.assign(nativeLocalHref(url.href,document.baseURI)));}}catch{}},true);
  if ('serviceWorker' in navigator && import.meta.env.PROD&&!isNativeBuild()) {
    navigator.serviceWorker.register(appUrl('sw.js'), { scope: APP_BASE }).catch(error => console.warn('Offline setup:', error.message));
  }
  window.__transportAcademy = { base: APP_BASE, readSettings, updateSettings, repository: APP_REPOSITORY };
}
