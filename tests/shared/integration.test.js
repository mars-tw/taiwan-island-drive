import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolveAppBase } from '../../src/shared/paths.js';
import { DEFAULT_SETTINGS, readSettings, updateSettings, subscribeSettings } from '../../src/shared/settings.js';
import vm from 'node:vm';

test('all mode pages resolve to the same application and model library in a repository subdirectory',()=>{
  for(const mode of ['car','train','flight']) {
    const root=resolveAppBase(`https://example.test/academy/${mode}/?v=2`,'../');
    assert.equal(root,'https://example.test/academy/');
    assert.equal(new URL('models/train.glb',root).pathname,'/academy/models/train.glb');
  }
});
test('shared family preferences remain usable when browser storage is unavailable',()=>{
  assert.deepEqual(readSettings(),DEFAULT_SETTINGS);
  let observed;
  const unsubscribe=subscribeSettings(value=>observed=value);
  updateSettings({childMode:false,muted:true,quality:'low'});
  assert.deepEqual(readSettings(),{childMode:false,muted:true,quality:'low'});
  assert.deepEqual(observed,readSettings());
  updateSettings({muted:false}); assert.equal(readSettings().childMode,false);
  unsubscribe(); updateSettings(DEFAULT_SETTINGS);
});
test('one shared cache activation preserves another application and its offline assets',async()=>{
  const source=await readFile(new URL('../../public/sw.js',import.meta.url),'utf8');
  const listeners={};
  const stores=new Map([
    ['island-transport-%2Facademy%2F-v1',new Map()],
    ['island-transport-%2Fother%2F-v2',new Map([['https://example.test/other/index.html',{}]])],
    ['island-drive-v1',new Map([['https://example.test/academy/index.html',{}],['https://example.test/other/models/car.glb',{}]])]
  ]);
  const cacheAPI={keys:async()=>[...stores.keys()],delete:async key=>stores.delete(key),open:async key=>{
    if(!stores.has(key))stores.set(key,new Map()); const store=stores.get(key);
    return {keys:async()=>[...store.keys()].map(url=>({url})),delete:async r=>store.delete(r.url),match:async key=>store.get(key)};
  }};
  const context={URL,Map,Promise,caches:cacheAPI,self:{registration:{scope:'https://example.test/academy/'},clients:{claim:async()=>{}},addEventListener:(type,fn)=>listeners[type]=fn}};
  vm.runInNewContext(source,context);
  let activation; listeners.activate({waitUntil:p=>activation=p}); await activation;
  assert.equal(stores.has('island-transport-%2Facademy%2F-v1'),false);
  assert.equal(stores.has('island-transport-%2Fother%2F-v2'),true);
  assert.equal(stores.get('island-drive-v1').has('https://example.test/other/models/car.glb'),true);
  assert.equal(stores.get('island-drive-v1').has('https://example.test/academy/index.html'),false);
});
