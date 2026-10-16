import test from 'node:test';
import assert from 'node:assert/strict';
import {STUDENT_KEY,readStudent,progressStorage,studentSaved,restoreStudentIfMissing} from '../../src/shared/student-save.js';
import {readAcademy,performDispatch,academySummary,importTrainBackup,decodeTrainBackup} from '../../src/shared/academy.js';
import {dispatchLesson} from '../../src/games/math/dispatch.js';
import {completeJourney,readPassport,PASSPORT_KEY} from '../../src/shared/journeys.js';
import {addStars,readRewards,REWARDS_KEY} from '../../src/shared/rewards.js';
import {createSafetyStorage} from '../../src/shared/safety-lesson.js';
import {nativeLocalHref} from '../../src/shared/native.js';
import {restoreLegacySettings,updateSettings,readSettings} from '../../src/shared/settings.js';
function storage(entries=[]){const m=new Map(entries);globalThis.localStorage={getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};return m;}
function finish(){performDispatch('start');performDispatch('learn');const q=dispatchLesson('small',readAcademy().dispatch.completed);for(let i=0;i<q.total;i++)performDispatch('add');performDispatch('check');for(let i=0;i<q.rear;i++)performDispatch('to-rear');performDispatch('check');performDispatch(`answer:${q.front}`);return q;}
const backup=dispatch=>JSON.stringify({format:'taiwan-train-math.backup',version:1,passport:{version:1,dispatch,completed:['historic-puzzle'],souvenirs:['old-photo'],trips:12},session:null});

test('migrates existing stars, twelve-course passport, safety and settings without deleting originals',()=>{
 const m=storage([[REWARDS_KEY,'{"car":12,"train":4,"flight":2}'],[PASSPORT_KEY,'{"ratings":{"car-1":3,"train-1":2}}'],['island-transport:safety:v1','{"completed":2}'],['island-transport:settings:v1','{"muted":true}']]);
 assert.equal(readRewards().car,12);assert.equal(readPassport().ratings['train-1'],2);assert.equal(createSafetyStorage().read().completed,2);
 performDispatch('start');const record=JSON.parse(m.get(STUDENT_KEY));assert.equal(record.sections.settings.muted,true);assert.equal(record.sections.rewards.car,12);assert.equal(m.get(REWARDS_KEY),'{"car":12,"train":4,"flight":2}');assert.equal(record.schemaVersion,2);
 m.set(PASSPORT_KEY,'{"ratings":{}}');assert.equal(readPassport().ratings['car-1'],3,'canonical save wins over a stale compatibility mirror');delete globalThis.localStorage;
});
test('math completion unlocks train, carries the real passenger count and awards exactly one shared star',()=>{
 storage();assert.equal(academySummary().next.id,'math');performDispatch('start');performDispatch('learn');performDispatch('add');
 const partial=JSON.stringify(readStudent());assert.equal(JSON.parse(partial).sections.academy.dispatch.active.front,1);
 const q=finish();assert.equal(academySummary().next.id,'train-1');assert.equal(academySummary().passengers,q.front);assert.equal(readRewards().train,1);
 performDispatch(`answer:${q.front}`);assert.equal(readRewards().train,1);assert.equal(completeJourney('train-1',2),true);assert.equal(academySummary().next.id,'car-1');
 completeJourney('car-1',1);assert.equal(academySummary().next.id,'flight-1');completeJourney('flight-1',3);assert.equal(academySummary().badge,true);delete globalThis.localStorage;
});
test('source backup imports active math and archives unrelated progress; repeating import never mints stars',()=>{
 storage();const text=backup({completed:0,active:{level:'small',phase:'load',front:3,rear:0}});importTrainBackup(text);
 assert.equal(readAcademy().dispatch.active.front,3);assert.equal(readAcademy().archive,text);assert.equal(readRewards().train,0);
 importTrainBackup(text);assert.equal(readRewards().train,0);const q=finish();assert.equal(readRewards().train,1);
 importTrainBackup(backup({completed:0,active:null}));assert.equal(readAcademy().dispatch.completed,1);assert.equal(academySummary().passengers,q.front);delete globalThis.localStorage;
});
test('completed historical import unlocks mainline but does not mint wallet or drive-course ratings',()=>{
 storage();const text=backup({completed:1,active:{level:'small',phase:'done',front:4,rear:1}});importTrainBackup(text);importTrainBackup(text);
 assert.equal(academySummary().next.id,'train-1');assert.equal(academySummary().passengers,4);assert.deepEqual(readPassport().ratings,{});assert.equal(readRewards().train,0);delete globalThis.localStorage;
});
test('invalid, oversized and foreign backups leave the current save byte-identical',()=>{
 const m=storage();performDispatch('start');const before=m.get(STUDENT_KEY);
 for(const text of ['{','x'.repeat(262145),'{"version":1}',backup({completed:1,active:{level:'small',phase:'split',front:100,rear:1}})])assert.throws(()=>importTrainBackup(text));
 assert.equal(m.get(STUDENT_KEY),before);assert.throws(()=>decodeTrainBackup(backup({completed:-2,active:null})));delete globalThis.localStorage;
});
test('quota failure keeps all successive progress in session and reports unsaved',()=>{
 const m=storage();performDispatch('start');const stale=m.get(STUDENT_KEY);globalThis.localStorage.setItem=()=>{throw Error('quota');};
 performDispatch('learn');performDispatch('add');performDispatch('add');assert.equal(readAcademy().dispatch.active.front,2);assert.equal(studentSaved(),false);assert.equal(m.get(STUDENT_KEY),stale);delete globalThis.localStorage;
});
test('native recovery does not replace a current web record with stale Preferences',()=>{
 const m=storage();performDispatch('start');performDispatch('learn');performDispatch('add');const before=m.get(STUDENT_KEY);
 restoreStudentIfMissing({schemaVersion:2,sections:{}});assert.equal(m.get(STUDENT_KEY),before);delete globalThis.localStorage;
});
test('canonical record reload retains all modes; no legacy split wallet required',()=>{
 const m=storage();finish();completeJourney('train-1',3);addStars('car',2);createSafetyStorage().save({completed:1});
 const serialized=m.get(STUDENT_KEY);storage([[STUDENT_KEY,serialized]]);assert.equal(readAcademy().dispatch.completed,1);assert.equal(readPassport().ratings['train-1'],3);assert.equal(readRewards().car,2);assert.equal(createSafetyStorage().read().completed,1);delete globalThis.localStorage;
});
test('newer source backup cannot replace a currently unfinished dispatch',()=>{
 const m=storage();performDispatch('start');performDispatch('learn');performDispatch('add');const before=m.get(STUDENT_KEY);
 assert.throws(()=>importTrainBackup(backup({completed:4,active:null})),/先完成/);assert.equal(m.get(STUDENT_KEY),before);delete globalThis.localStorage;
});
test('source backup key order is irrelevant and legacy passports without dispatch retain their history',()=>{
 storage();const reordered=backup({active:{rear:0,front:2,phase:'load',level:'small'},completed:0});importTrainBackup(reordered);assert.equal(readAcademy().dispatch.active.front,2);
 const legacy=JSON.stringify({format:'taiwan-train-math.backup',version:1,passport:{version:1,completed:['old-math']},session:null});importTrainBackup(legacy);assert.equal(readAcademy().archive,legacy);assert.equal(readAcademy().dispatch.active.front,2);delete globalThis.localStorage;
});
test('mainline handoff query survives native bundled-entry conversion',()=>{
 assert.equal(nativeLocalHref('capacitor://localhost/train/?journey=train-1&academy=1','capacitor://localhost/index.html'),'capacitor://localhost/train/index.html?journey=train-1&academy=1');
});
test('all legacy vehicle records, selections and raw music preferences migrate into the single student record',()=>{
 const m=storage([['island-drive:preferences','{"vehicle":"coupe","paint":2}'],['island-drive:records','{"coast":36}'],['island-flight-school-record','{"treasure":95}'],['island-transport:lobby-music:v1','off']]);
 performDispatch('start');const canonical=JSON.parse(m.get(STUDENT_KEY));assert.equal(canonical.sections.carPreferences.paint,2);assert.equal(canonical.sections.carRecords.coast,36);assert.equal(canonical.sections.flightRecords.treasure,95);assert.equal(canonical.sections.music,'off');
 m.set('island-flight-school-record','{}');assert.equal(JSON.parse(progressStorage.getItem('island-flight-school-record')).treasure,95);
 progressStorage.setItem('island-transport:lobby-music:v1','on');assert.equal(readStudent().sections.music,'on');assert.equal(m.get('island-transport:lobby-music:v1'),'on');delete globalThis.localStorage;
});
test('partial student recovery backfills missing historical records without replacing explicit current values',()=>{
 storage([[STUDENT_KEY,JSON.stringify({schemaVersion:2,revision:3,sections:{carPreferences:{paint:1}}})],['island-drive:preferences','{"paint":9}'],['island-drive:records','{"coast":42}']]);
 assert.equal(readStudent().sections.carPreferences.paint,1);assert.equal(readStudent().sections.carRecords.coast,42);delete globalThis.localStorage;
});
test('legacy native settings are imported once and cannot override a newer canonical preference',()=>{
 storage();restoreLegacySettings({muted:true,quality:'low'});assert.equal(readSettings().muted,true);updateSettings({muted:false});restoreLegacySettings({muted:true});assert.equal(readSettings().muted,false);delete globalThis.localStorage;
});
