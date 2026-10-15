import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('../../public/sw.js',import.meta.url),'utf8');
async function install(entries){
 const events={},stored=[];
 const sandbox={URL,Request,Map,Set,Error,encodeURIComponent,fetch:async()=>({ok:true,json:async()=>entries}),
  caches:{open:async()=>({addAll:async requests=>stored.push(...requests.map(r=>r.url))})},
  self:{registration:{scope:'https://academy.test/'},addEventListener:(name,fn)=>events[name]=fn,skipWaiting:async()=>{}}};
 vm.runInNewContext(source,sandbox);let operation;events.install({waitUntil:p=>operation=p});await operation;return stored;
}
test('offline install includes the lobby audio as well as all bundled formats',async()=>{
 const stored=await install(['./index.html','./audio/lobby-theme.m4a','./audio/guide.mp3','./audio/click.ogg','./audio/chime.wav','./models/train.glb','./assets/font.woff2']);
 assert.equal(stored.length,8);assert.ok(stored.includes('https://academy.test/audio/lobby-theme.m4a'));
});
test('offline install rejects an off-origin manifest entry before caching',async()=>{
 await assert.rejects(()=>install(['./index.html','https://other.test/tracker.js']),/Nonlocal precache asset/);
});
test('offline anonymous module preload reuses a cached Vary-Origin bundle',async()=>{
 const handlers={},cached={status:200},request=new Request('https://academy.test/assets/car.js',{headers:{Origin:'https://academy.test'}});
 const sandbox={URL,Request,Map,Set,Error,encodeURIComponent,
  fetch:async()=>{throw new Error('offline');},
  caches:{open:async()=>({match:async(r,options)=>options?.ignoreVary?cached:undefined})},
  self:{registration:{scope:'https://academy.test/'},addEventListener:(n,fn)=>handlers[n]=fn}};
 vm.runInNewContext(source,sandbox);let result;handlers.fetch({request,respondWith:p=>result=p});assert.equal(await result,cached);
});
