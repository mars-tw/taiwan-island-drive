import test from 'node:test';
import assert from 'node:assert/strict';
import { createNativeRuntime } from '../../src/shared/native.js';

function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};}
function clockHost(){
 let now=0,next=0,cancels=0;const timers=new Map();
 const host={Capacitor:{isNativePlatform:()=>true,getPlatform:()=> 'ios'},speechSynthesis:{cancel:()=>cancels++},document:{body:{dataset:{}},querySelectorAll:()=>[]}};
 host.setTimeout=(fn,delay)=>{const id=++next;timers.set(id,{fn,at:now+delay});return id;};host.clearTimeout=id=>timers.delete(id);
 return {host,timers,cancels:()=>cancels,advance(ms){now+=ms;for(const [id,timer] of [...timers])if(timer.at<=now){timers.delete(id);timer.fn();}}};
}
const voice={lang:'zh-TW',localService:true,networkConnectionRequired:false};
function tts(stop,speak=async()=>{}){return {getSupportedVoices:async()=>({voices:[voice]}),speak,stop};}
const flush=async()=>{for(let i=0;i<5;i++)await Promise.resolve();};

test('a normal native stop finishes before callers continue and cancels its deadline',async()=>{
 const clock=clockHost(),completion=deferred();let stopCalls=0,continued=false;
 const runtime=createNativeRuntime({host:clock.host,loadPlugin:async()=>tts(()=>{stopCalls++;return completion.promise;})});
 await runtime.speak('正常提示');const stopping=runtime.stopSpeech().then(()=>continued=true);await flush();
 assert.equal(stopCalls,1);assert.equal(clock.cancels(),1);assert.equal(continued,false);
 completion.resolve();await stopping;assert.equal(continued,true);assert.equal(runtime.getStatus().speech,'idle');assert.equal(clock.timers.size,0);
 clock.advance(1000);assert.equal(stopCalls,1);
});

test('a stalled native stop cannot indefinitely block navigation completion',async()=>{
 const clock=clockHost();let navigations=0;
 const runtime=createNativeRuntime({host:clock.host,loadPlugin:async()=>tts(()=>new Promise(()=>{}))});
 await runtime.speak('準備返回');const navigating=runtime.stopSpeech().finally(()=>navigations++);await flush();
 clock.advance(349);await flush();assert.equal(navigations,0);
 clock.advance(1);await navigating;assert.equal(navigations,1);assert.equal(clock.timers.size,0);assert.equal(runtime.getStatus().speech,'idle');
});

test('plugin loading may time out during stop and never later start the cancelled voice',async()=>{
 const clock=clockHost(),loading=deferred();let spoken=0;
 const runtime=createNativeRuntime({host:clock.host,loadPlugin:()=>loading.promise});
 const speaking=runtime.speak('已過期的提示');await flush();const stopping=runtime.stopSpeech();clock.advance(350);await stopping;
 assert.equal(clock.timers.size,0);loading.resolve(tts(async()=>{},async()=>spoken++));
 assert.equal((await speaking).spoken,false);await flush();assert.equal(spoken,0);assert.equal(clock.cancels(),1);assert.equal(clock.timers.size,0);
});

test('disposal removes app listeners even when native stop never responds',async()=>{
 const clock=clockHost();let removed=0;
 const runtime=createNativeRuntime({host:clock.host,loadPlugin:async name=>name==='App'?{addListener:async()=>({remove:async()=>removed++})}:tts(()=>new Promise(()=>{}))});
 await runtime.init();await runtime.speak('離開前的提示');const disposing=runtime.dispose();clock.advance(350);await disposing;
 assert.equal(removed,4);assert.equal(clock.timers.size,0);assert.equal(runtime.getStatus().speech,'idle');
});

test('back still pauses before bounded audio cleanup and then allows return to lobby',async()=>{
 const clock=clockHost();clock.host.document.body.dataset.game='train';let paused=false,home=0;
 const runtime=createNativeRuntime({host:clock.host,navigateHome:()=>home++,resolveGames:()=>[{game:{getState:()=>({paused,completed:false}),pause:()=>paused=true}}],loadPlugin:async()=>tts(()=>new Promise(()=>{}))});
 await runtime.speak('開火車');const back=runtime.handleBack();assert.equal(paused,true);clock.advance(350);
 assert.equal(await back,'paused');assert.equal(home,0);assert.equal(clock.timers.size,0);assert.equal(await runtime.handleBack(),'home');assert.equal(home,1);
});

test('native stop rejection is caught and leaves no timer or stuck cleanup state',async()=>{
 const clock=clockHost();const runtime=createNativeRuntime({host:clock.host,loadPlugin:async()=>tts(async()=>{throw new Error('synthetic native failure');})});
 await runtime.speak('提示');await assert.doesNotReject(()=>runtime.stopSpeech());assert.equal(clock.timers.size,0);assert.equal(runtime.getStatus().speech,'idle');assert.equal(clock.cancels(),1);
});

test('an older pending cleanup deadline must not overwrite a newer active voice status',async()=>{
 const clock=clockHost(),oldStop=deferred();const spoken=[];
 const runtime=createNativeRuntime({host:clock.host,loadPlugin:async()=>tts(()=>oldStop.promise,async options=>spoken.push(options.text))});
 await runtime.speak('原本提示');const stopping=runtime.stopSpeech();await flush();
 assert.equal((await runtime.speak('新的提示')).spoken,true);assert.equal(runtime.getStatus().speech,'native-local');
 clock.advance(350);await stopping;assert.equal(runtime.getStatus().speech,'native-local');assert.deepEqual(spoken,['原本提示','新的提示']);assert.equal(clock.timers.size,0);
 oldStop.resolve();await flush();assert.equal(runtime.getStatus().speech,'native-local');
});

test('late plugin loading must not run an obsolete stop against a newer queued voice',async()=>{
 const clock=clockHost(),loading=deferred();let stopCalls=0;const spoken=[];
 const runtime=createNativeRuntime({host:clock.host,loadPlugin:()=>loading.promise});
 const oldVoice=runtime.speak('過期提示');await flush();const stopping=runtime.stopSpeech();clock.advance(350);await stopping;
 const newVoice=runtime.speak('仍有效的新提示');await flush();loading.resolve(tts(async()=>stopCalls++,async options=>spoken.push(options.text)));
 assert.equal((await oldVoice).spoken,false);assert.equal((await newVoice).spoken,true);await flush();
 assert.equal(stopCalls,0);assert.deepEqual(spoken,['仍有效的新提示']);assert.equal(runtime.getStatus().speech,'native-local');assert.equal(clock.timers.size,0);
});
