import { appUrl } from './paths.js';
import '@capacitor/core';

const defaultHost=()=>globalThis.window||globalThis;
export function isNative(host=defaultHost()){
 try{return host.Capacitor?.isNativePlatform?.()===true||['ios','android'].includes(host.Capacitor?.getPlatform?.());}catch{return false;}
}
export function isNativeBuild(host=defaultHost(),mode=import.meta.env?.MODE){return isNative(host)||mode==='native';}
export function nativeLocalHref(href,base){const url=new URL(href,base),root=new URL(base);if(url.protocol===root.protocol&&url.host===root.host&&url.pathname.endsWith('/'))url.pathname+='index.html';return url.href;}
export function selectLocalChineseVoice(voices=[]){
 const ranked=voices.map((voice,index)=>({voice,index,lang:String(voice.lang||'').replaceAll('_','-').toLowerCase()})).filter(v=>v.lang.startsWith('zh')&&v.voice.localService===true&&v.voice.networkConnectionRequired!==true);
 ranked.sort((a,b)=>((b.lang==='zh-tw'?100:b.lang.includes('hant')?90:50)-(a.lang==='zh-tw'?100:a.lang.includes('hant')?90:50)));
 return ranked[0]||null;
}
export function gameIsRunning(state={}){return ['running','countdown'].includes(state.phase)||state.mode==='playing'||(state.paused===false&&state.completed!==true);}
export function resolveCurrentGames(host=defaultHost()){
 const mode=host.document?.body?.dataset?.game;const entry=mode==='car'?host.__islandDrive:mode==='train'?host.__trainSchool:mode==='flight'?host.__flightSchool:null;
 return entry?.game?[{game:entry.game,tilt:entry.tilt,audio:entry.audio||entry.game.audio}]:[];
}
const loaders={App:()=>import('@capacitor/app').then(m=>m.App),Motion:()=>import('@capacitor/motion').then(m=>m.Motion),Preferences:()=>import('@capacitor/preferences').then(m=>m.Preferences),TextToSpeech:()=>import('@capacitor-community/text-to-speech').then(m=>m.TextToSpeech)};

export function createNativeRuntime({host=defaultHost(),loadPlugin=name=>loaders[name](),resolveGames=()=>resolveCurrentGames(host),navigateHome=()=>host.location?.assign(appUrl()),closeDialog,mode=import.meta.env?.MODE}={}){
 const plugins=new Map(),overlays=new Set(),handles=[],registeredGames=new Set(),backgroundCloses=new WeakSet();let initialized=false,active=true,speechSequence=0,ttsVoices=null,motionGranted=false;
 const status={native:isNative(host),build:isNativeBuild(host,mode),platform:host.Capacitor?.getPlatform?.()||'web',lifecycle:'idle',speech:'idle',motion:'off',hardwareVerified:false};
 const plugin=name=>{if(!plugins.has(name))plugins.set(name,Promise.resolve().then(()=>loadPlugin(name)));return plugins.get(name);};
 const games=()=>[...resolveGames(),...registeredGames];
 function pauseGames(){for(const entry of games()){const game=entry.game||entry;if(gameIsRunning(game.getState?.()||{}))game.pause?.();entry.tilt?.setActive(false);}}
 function closeTopDialog(){for(const overlay of [...overlays].reverse())if(overlay.isOpen?.()){overlay.close?.();return true;}if(closeDialog)return closeDialog();const dialogs=host.document?.querySelectorAll?.('dialog[open]');const dialog=dialogs?.[dialogs.length-1];if(dialog){dialog.close('back');return true;}return false;}
 async function stopSpeech(){
  const sequence=++speechSequence;host.speechSynthesis?.cancel?.();
  if(plugins.has('TextToSpeech')){
   // Audio cleanup must not hold navigation, back or disposal indefinitely.
   const schedule=host.setTimeout?.bind(host)||globalThis.setTimeout.bind(globalThis),unschedule=host.clearTimeout?.bind(host)||globalThis.clearTimeout.bind(globalThis);let timer;
   try{await Promise.race([plugin('TextToSpeech').then(tts=>sequence===speechSequence?tts.stop():undefined),new Promise(resolve=>{timer=schedule(resolve,350);})]);}catch{}
   finally{if(timer!==undefined)unschedule(timer);}
  }
  if(sequence===speechSequence)status.speech='idle';
 }
 function background(){active=false;status.lifecycle='background';for(const overlay of overlays)if(overlay.isOpen?.())overlay.close?.();const open=host.document?.querySelectorAll?.('dialog[open]')||[];for(const dialog of open){backgroundCloses.add(dialog);dialog.close();}pauseGames();for(const entry of games()){const audio=entry.audio||(entry.game||entry).audio,ctx=audio?.ctx||audio?.context;if(ctx){for(const field of ['gain','engineGain','windGain'])audio[field]?.gain?.setValueAtTime?.(0,ctx.currentTime);void ctx.suspend?.().catch?.(()=>{});}}void stopSpeech();}
 function foreground(){active=true;status.lifecycle='foreground-paused';/* Continue buttons own resumption; children never restart unexpectedly. */}
 async function handleBack(){if(closeTopDialog())return 'dialog';const entries=games();const running=entries.find(e=>gameIsRunning((e.game||e).getState?.()||{}));if(running){pauseGames();await stopSpeech();return 'paused';}if(host.document?.body?.dataset?.game||entries.length){navigateHome();return 'home';}if(status.native)try{await (await plugin('App')).minimizeApp();return 'minimized';}catch{}return 'home';}
 async function init(){if(initialized)return {...status};initialized=true;if(!status.native){status.lifecycle='web';return {...status};}host.document?.addEventListener?.('close',event=>{const fromBackground=backgroundCloses.has(event.target);backgroundCloses.delete(event.target);if(!active||fromBackground){event.stopImmediatePropagation();pauseGames();}},true);try{const app=await plugin('App');handles.push(await app.addListener('appStateChange',s=>s.isActive?foreground():background()));handles.push(await app.addListener('pause',background));handles.push(await app.addListener('resume',foreground));handles.push(await app.addListener('backButton',()=>{void handleBack();}));status.lifecycle='bound';}catch{status.lifecycle='unavailable';}return {...status};}
 async function speak(text,{lang='zh-TW',rate=.8,pitch=1.06,volume=1}={}){
  if(!active||!text)return {spoken:false,backend:'none'};
  const sequence=++speechSequence;
  if(status.native){try{
   const tts=await plugin('TextToSpeech');if(sequence!==speechSequence)return {spoken:false,backend:'none'};
   // Voice indices belong to the current installed engine list; never reuse a
   // stale index after the device's voices have changed.
   const result=await tts.getSupportedVoices();ttsVoices=result.voices||[];
   const selected=selectLocalChineseVoice(ttsVoices);if(!selected){status.speech='text-only';return {spoken:false,backend:'none',reason:'no-local-chinese-voice'};}
   if(tts.isLanguageSupported&&(await tts.isLanguageSupported({lang:selected.voice.lang||lang})).supported!==true){status.speech='text-only';return {spoken:false,backend:'none',reason:'local-language-data-missing'};}
   if(sequence!==speechSequence||!active)return {spoken:false,backend:'none'};
   status.speech='native-local';await tts.speak({text,lang:selected.voice.lang||lang,voice:selected.index,rate,pitch,volume,category:'ambient',queueStrategy:0});return {spoken:sequence===speechSequence&&active,backend:'native-local'};
  }catch{if(sequence===speechSequence)status.speech='text-only';return {spoken:false,backend:'none',reason:'native-tts-unavailable'};}}
  if(!host.speechSynthesis||!host.SpeechSynthesisUtterance)return {spoken:false,backend:'none'};
  try{host.speechSynthesis.cancel();const u=new host.SpeechSynthesisUtterance(text);u.lang=lang;u.rate=rate;u.pitch=pitch;u.volume=volume;const voices=host.speechSynthesis.getVoices?.()||[];u.voice=voices.find(v=>v.lang===lang)||voices.find(v=>v.lang?.startsWith('zh'))||null;host.speechSynthesis.speak(u);status.speech='browser';return {spoken:true,backend:'browser'};}catch{return {spoken:false,backend:'none'};}
 }
 async function requestMotion(){
  if(!status.native)return {granted:false,status:'web'};
  const Orientation=host.DeviceOrientationEvent;if(!Orientation){status.motion='unsupported';return {granted:false,status:'unsupported'};}
  try{
   // Run before the first await/import so the adult gate's submit gesture is retained.
   const permission=typeof Orientation.requestPermission==='function'?Orientation.requestPermission():Promise.resolve('granted');
   if(await permission!=='granted'){status.motion='denied';return {granted:false,status:'denied'};}
   motionGranted=true;status.motion='waiting';return {granted:true,status:'waiting',source:'capacitor-web-motion'};
  }catch{status.motion='denied';return {granted:false,status:'denied'};}
 }
 async function subscribeMotion(listener){
  if(!motionGranted)throw new Error('Motion permission must be requested from a user action first.');
  const motion=await plugin('Motion');const handle=await motion.addListener('orientation',sample=>{if(active)listener(sample);});
  return async()=>{await handle.remove();status.motion='off';};
 }
 async function syncPreferences({key,read,update,subscribe}){if(!status.native)return ()=>{};try{const prefs=await plugin('Preferences'),saved=await prefs.get({key});if(saved.value){const value=JSON.parse(saved.value);if(value&&typeof value==='object')update(value);}return subscribe(value=>{void prefs.set({key,value:JSON.stringify(value)}).catch(()=>{});});}catch{return ()=>{};}}
 function registerOverlay(overlay){overlays.add(overlay);return ()=>overlays.delete(overlay);}
 function registerGameLifecycle(entry){const wrapper={game:entry};registeredGames.add(wrapper);return ()=>registeredGames.delete(wrapper);}
 async function dispose(){await stopSpeech();for(const handle of handles.splice(0))await handle.remove();overlays.clear();}
 return {init,speak,stopSpeech,requestMotion,subscribeMotion,syncPreferences,pauseGames,background,foreground,handleBack,registerOverlay,registerGameLifecycle,dispose,getStatus:()=>({...status})};
}
const runtime=createNativeRuntime();
export const initNativeRuntime=()=>runtime.init();
export const speakNative=(text,options)=>runtime.speak(text,options);
export const stopNativeSpeech=()=>runtime.stopSpeech();
export const requestNativeMotion=()=>runtime.requestMotion();
export const subscribeNativeMotion=listener=>runtime.subscribeMotion(listener);
export const registerNativeOverlay=overlay=>runtime.registerOverlay(overlay);
export const registerGameLifecycle=entry=>runtime.registerGameLifecycle(entry);
export const pauseNativeGames=()=>runtime.pauseGames();
export const syncNativePreferences=options=>runtime.syncPreferences(options);
export const getNativeStatus=()=>runtime.getStatus();
export const disposeNativeRuntime=()=>runtime.dispose();
