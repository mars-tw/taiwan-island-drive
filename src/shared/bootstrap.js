import './navigation.css';
import { APP_BASE, APP_REPOSITORY, appUrl } from './paths.js';
import { readSettings, updateSettings } from './settings.js';

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
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    navigator.serviceWorker.register(appUrl('sw.js'), { scope: APP_BASE }).catch(error => console.warn('Offline setup:', error.message));
  }
  window.__transportAcademy = { base: APP_BASE, readSettings, updateSettings, repository: APP_REPOSITORY };
}
