import test from 'node:test';
import assert from 'node:assert/strict';
import {SafetyLesson,createSafetyStorage,normalizeSafety} from '../../src/shared/safety-lesson.js';
const advance=(lesson,seconds)=>{for(let i=0;i<Math.ceil(seconds*60);i++)lesson.tick(1/60);};
const stop=lesson=>{lesson.act('brake');advance(lesson,2);lesson.act('release');assert.equal(lesson.speed,0);};
const road=lesson=>{lesson.act('begin');stop(lesson);advance(lesson,4.1);assert.equal(lesson.act('depart'),true);};
const platform=lesson=>{lesson.act('begin');stop(lesson);lesson.act('open');advance(lesson,4.1);lesson.act('close');assert.equal(lesson.act('depart'),true);};
test('Safety: stopped vehicle and four-second clear crossing are required',()=>{
  const l=new SafetyLesson();assert.equal(l.act('depart'),false);advance(l,30);assert.equal(l.speed,12);
  l.act('begin');assert.equal(l.act('depart'),false);advance(l,10);assert.equal(l.observed,0);
  stop(l);assert.equal(l.act('depart'),false);advance(l,3);assert.equal(l.act('depart'),false);
  advance(l,1.1);assert.equal(l.act('depart'),true);assert.equal(l.completed,1);
});
test('Safety: moving train cannot open doors; boarding cannot be skipped',()=>{
  const l=new SafetyLesson({completed:1});l.act('begin');assert.equal(l.act('open'),false);assert.equal(l.doors,false);
  stop(l);assert.equal(l.act('depart'),false);l.act('open');advance(l,2);assert.equal(l.act('close'),false);assert.equal(l.doors,true);
  advance(l,2.1);assert.equal(l.boarded,true);assert.equal(l.act('depart'),false);
  l.act('close');assert.equal(l.act('depart'),true);
});
test('Safety: runway needs deliberate waiting plus elapsed observation',()=>{
  const l=new SafetyLesson({completed:2});l.act('begin');advance(l,10);assert.equal(l.clear,false);assert.equal(l.act('depart'),false);
  l.act('wait');advance(l,2);assert.equal(l.act('depart'),false);advance(l,2.1);assert.equal(l.act('depart'),true);assert.equal(l.phase,'done');
});
test('Safety: pause freezes observation and releases held brake',()=>{
  const l=new SafetyLesson();l.act('begin');l.act('brake');advance(l,.5);l.pause();const speed=l.speed;
  assert.equal(l.braking,false);advance(l,20);assert.equal(l.speed,speed);assert.equal(l.act('depart'),false);
  l.resume();advance(l,2);assert.equal(l.speed,speed);stop(l);l.pause();advance(l,20);assert.ok(l.observed<4);
});
test('Safety: pointer/key cancellation can release input while paused',()=>{
  const l=new SafetyLesson();l.act('begin');l.act('brake');l.act('release');advance(l,3);assert.equal(l.speed,12);
  l.pause();l.act('release');assert.equal(l.braking,false);
});
test('Safety: long stalls and invalid dt never skip waiting',()=>{
  const l=new SafetyLesson({completed:2});l.act('begin');l.act('wait');l.tick(10000);assert.equal(l.observed,.1);
  l.tick(NaN);l.tick(Infinity);l.tick(-10);assert.equal(l.observed,.1);
});
test('Safety: complete three actual systems, save checkpoints once, then replay all',()=>{
  const checkpoints=[],l=new SafetyLesson({checkpoint:value=>checkpoints.push(value.completed)});
  road(l);assert.equal(l.act('depart'),false);l.act('next');platform(l);l.act('next');l.act('begin');l.act('wait');advance(l,4.1);l.act('depart');
  assert.deepEqual(checkpoints,[1,2,3]);assert.equal(l.phase,'done');assert.equal(l.act('depart'),false);
  l.act('replay');road(l);l.act('next');assert.equal(l.stage,1);platform(l);l.act('next');assert.equal(l.stage,2);
});
test('Safety: storage survives recreation; corrupt and out-of-range values are rejected',()=>{
  const entries=new Map(),target=()=>({getItem:k=>entries.get(k),setItem:(k,v)=>entries.set(k,v)});
  assert.equal(createSafetyStorage(target).save({completed:2}),true);assert.equal(createSafetyStorage(target).read().completed,2);
  for(const value of [{completed:8},{completed:-1},{completed:'3'},null])assert.deepEqual(normalizeSafety(value),{completed:0});
  assert.deepEqual(createSafetyStorage(()=>({getItem:()=>'{broken'})).read(),{completed:0});
});
test('Safety: unavailable storage retains session and reports unsaved',()=>{
  const store=createSafetyStorage(()=>{throw new Error('disabled');});assert.equal(store.save({completed:1}),false);
  assert.equal(store.saved,false);assert.deepEqual(store.read(),{completed:1});
});
test('Safety: reopening starts at last completed checkpoint, no partial credit',()=>{
  const l=new SafetyLesson({completed:1});assert.equal(l.stage,1);assert.equal(l.phase,'intro');assert.equal(l.observed,0);
  assert.equal(new SafetyLesson({completed:3}).phase,'done');
});
