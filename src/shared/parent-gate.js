import { isNativeBuild,pauseNativeGames,registerNativeOverlay } from './native.js';
import { APP_REPOSITORY } from './paths.js';

function randomFraction(){if(globalThis.crypto?.getRandomValues){const data=new Uint32Array(1);crypto.getRandomValues(data);return data[0]/4294967296;}return Math.random();}
export function createGateSession({random=randomFraction,now=()=>Date.now(),ttl=90000}={}){
 const left=50+Math.floor(random()*40),right=50+Math.floor(random()*40),started=now();let attempts=0,used=false;
 return {challenge:()=>({left,right}),cancel:()=>{used=true;},check(answer){if(used)return {approved:false,reason:'used'};if(now()-started>ttl){used=true;return {approved:false,reason:'expired'};}const normalized=String(answer).trim().replace(/[０-９]/g,c=>String(c.charCodeAt(0)-0xff10));if(!/^\d{3}$/.test(normalized)||Number(normalized)!==left+right){attempts++;if(attempts>=3){used=true;return {approved:false,reason:'locked'};}return {approved:false,reason:'incorrect'};}used=true;return {approved:true,reason:'approved'};}};
}
export function linkPolicy(href,base,{native=false,download=false}={}){
 try{const url=new URL(href,base),origin=new URL(base);if(!['http:','https:','capacitor:','ionic:','mailto:','tel:'].includes(url.protocol))return {kind:'blocked',url:url.href};const external=url.protocol!==origin.protocol||url.host!==origin.host;const file=download||/\/downloads\/|\.(zip|blend|glb|apk|aab|ipa)(?:$|\?)/i.test(url.pathname);return {kind:external?'external':file?'download':'internal',url:url.href,nativeBlocked:native&&(external||file)};}catch{return {kind:'blocked',url:String(href||'')};}
}
const PARENT_SELECTOR='#home-settings,#settings-button,#settings,#advanced-toggle,#tilt-toggle,#tilt-settings-toggle,[data-parent-action]';
let installed=false,dialog=null,pending=null;const approvedClicks=new WeakSet();
function makeDialog(){if(dialog)return dialog;dialog=document.createElement('dialog');dialog.id='parent-gate';dialog.setAttribute('aria-labelledby','parent-gate-title');dialog.innerHTML='<form id="parent-gate-form"><button type="button" id="parent-gate-close" aria-label="關閉家長驗證">×</button><p class="parent-gate-eyebrow">請家長幫忙</p><h2 id="parent-gate-title">家長確認</h2><p id="parent-gate-reason"></p><label for="parent-gate-answer">請家長計算下面的加法</label><p id="parent-gate-question"></p><input id="parent-gate-answer" inputmode="numeric" autocomplete="off" spellcheck="false" aria-describedby="parent-gate-error" placeholder="輸入答案"><p id="parent-gate-error" role="status"></p><div class="parent-gate-actions"><button type="button" id="parent-gate-cancel">取消</button><button type="submit" id="parent-gate-submit">驗證並繼續</button></div></form><section id="parent-gate-info" hidden><h2>請家長使用電腦版</h2><p>這個 App 不會開啟外部網站或下載檔案。家長可以在電腦版處理開源專案。</p><p id="parent-gate-address"></p><button id="parent-gate-info-close">關閉</button></section>';document.body.append(dialog);
 dialog.querySelector('#parent-gate-close').onclick=()=>cancelParentGate();dialog.querySelector('#parent-gate-cancel').onclick=()=>cancelParentGate();dialog.querySelector('#parent-gate-info-close').onclick=()=>dialog.close();
 dialog.addEventListener('cancel',event=>{event.preventDefault();cancelParentGate();});dialog.addEventListener('close',()=>{if(pending)settle(false);});
 dialog.querySelector('form').addEventListener('submit',event=>{event.preventDefault();if(!pending)return;const result=pending.session.check(dialog.querySelector('input').value);if(result.approved){settle(true);}else{dialog.querySelector('#parent-gate-error').textContent=result.reason==='incorrect'?'答案不對，請家長再算一次。':'請關閉視窗，再請家長確認。';if(result.reason!=='incorrect')dialog.querySelector('#parent-gate-submit').disabled=true;}});
 registerNativeOverlay({isOpen:()=>dialog.open,close:()=>cancelParentGate()});return dialog;
}
function settle(approved){if(!pending)return;const request=pending;pending=null;request.session.cancel();dialog?.close();request.resolve(approved);if(approved)request.onApproved?.();}
export function cancelParentGate(){if(pending)settle(false);else dialog?.close();}
export function requireParentGate(reason,onApproved){
 if(typeof document==='undefined'||pending)return Promise.resolve(false);
 pauseNativeGames();const d=makeDialog();d.querySelector('form').hidden=false;d.querySelector('#parent-gate-info').hidden=true;d.querySelector('#parent-gate-reason').textContent=reason||'這個步驟需要家長確認。';d.querySelector('#parent-gate-answer').value='';d.querySelector('#parent-gate-error').textContent='';d.querySelector('#parent-gate-submit').disabled=false;
 const session=createGateSession(),challenge=session.challenge();d.querySelector('#parent-gate-question').textContent=challenge.left+' ＋ '+challenge.right+' ＝ ？';
 return new Promise(resolve=>{pending={session,resolve,onApproved};d.showModal();d.querySelector('input').focus();});
}
function nativeInfo(address){const d=makeDialog();d.querySelector('form').hidden=true;d.querySelector('#parent-gate-info').hidden=false;d.querySelector('#parent-gate-address').textContent=address;d.showModal();}
function linkHref(a){return a.getAttribute('href')||a.dataset.parentUrl||'';}
function protectLinks(){for(const a of document.querySelectorAll('a')){const href=linkHref(a);if(!href)continue;const policy=linkPolicy(href,document.baseURI,{native:isNativeBuild(),download:a.hasAttribute('download')||a.dataset.parentDownload==='true'});if(policy.kind!=='internal'){
 if(a.hasAttribute('href')){a.dataset.parentUrl=policy.url;a.dataset.parentDownload=String(a.hasAttribute('download')||a.dataset.parentDownload==='true');a.dataset.parentTarget=a.getAttribute('target')||a.dataset.parentTarget||'';a.removeAttribute('href');a.removeAttribute('download');a.removeAttribute('target');}
 a.setAttribute('role','button');a.setAttribute('tabindex','0');
 }}}
function approvedLink(a,policy){if(policy.kind==='blocked')return;if(policy.nativeBlocked){nativeInfo(policy.kind==='download'?APP_REPOSITORY:policy.url);return;}if(policy.kind==='download'){const link=document.createElement('a');link.href=policy.url;link.download='';approvedClicks.add(link);document.body.append(link);link.click();link.remove();}else{if(a.dataset.parentTarget==='_blank')window.open(policy.url,'_blank','noopener,noreferrer');else window.location.assign(policy.url);}}
export function installParentGate(){if(installed||typeof document==='undefined')return;installed=true;protectLinks();new MutationObserver(protectLinks).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['href','download','target']});
 document.addEventListener('click',event=>{
  const target=event.target?.closest?.('a,'+PARENT_SELECTOR+',.parent-settings>summary');if(!target)return;
  if(approvedClicks.has(target)){approvedClicks.delete(target);return;}
  const anchor=target.tagName==='A',policy=anchor?linkPolicy(linkHref(target),document.baseURI,{native:isNativeBuild(),download:target.dataset.parentDownload==='true'||target.hasAttribute('download')}):null;
  if(anchor&&policy.kind==='internal')return;
  if(target.matches('.parent-settings>summary')&&target.parentElement.open)return;
  if(target.id==='advanced-toggle'&&!document.getElementById('advanced-console')?.hidden)return;
  if(target.matches('[data-parent-handled]'))return;
  event.preventDefault();event.stopImmediatePropagation();
  if(anchor){if(policy.kind==='blocked')return;void requireParentGate(policy.kind==='download'?'下載開源檔案需要家長確認。':'離開遊戲前，請家長確認。',()=>approvedLink(target,policy));}
  else void requireParentGate(target.id.includes('tilt')?'啟用動作感測，需要家長確認。':'開啟家長設定，需要家長確認。',()=>{if(target.matches('.parent-settings>summary'))target.parentElement.open=true;else{approvedClicks.add(target);target.click();}});
 },true);
 document.addEventListener('keydown',event=>{if(dialog?.open){if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();cancelParentGate();}return;}const a=event.target?.closest?.('a[data-parent-url]');if(a&&['Enter',' '].includes(event.key)){event.preventDefault();a.click();}},true);
 document.addEventListener('contextmenu',event=>{if(event.target?.closest?.('a[data-parent-url]')||(isNativeBuild()&&!event.target?.closest?.('#parent-gate-info')))event.preventDefault();},true);
 document.addEventListener('auxclick',event=>{if(event.target?.closest?.('a[data-parent-url]')||(isNativeBuild()&&event.target?.closest?.('a'))){event.preventDefault();event.stopImmediatePropagation();}},true);
}
