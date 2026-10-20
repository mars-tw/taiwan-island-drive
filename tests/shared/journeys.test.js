import test from 'node:test';
import assert from 'node:assert/strict';
import {JOURNEYS,PASSPORT_KEY,journeysFor,readPassport,normalizePassport,isJourneyOpen,completeJourney,passportSummary,nextJourney,requestedJourney,resetPassportForTest} from '../../src/shared/journeys.js';
import {Game} from '../../src/games/car/game.js';
import {starLayout} from '../../src/games/car/collectibles.js';
import {TrainGame} from '../../src/games/train/game.js';
import {FlightGame} from '../../src/games/flight/game.js';
import {AIRCRAFT} from '../../src/games/flight/config.js';
import {newMission,updateMission} from '../../src/games/flight/mission.js';
import {stepPhysics} from '../../src/games/flight/physics.js';
import {createFlightInitialState,createChildPilot} from '../../src/games/flight/child-pilot.js';
import {nativeLocalHref} from '../../src/shared/native.js';

test('short outing navigation keeps its query and resolves a packaged native HTML entry',()=>{
  assert.equal(nativeLocalHref('capacitor://localhost/car/?journey=car-1','capacitor://localhost/index.html'),'capacitor://localhost/car/index.html?journey=car-1');
});

test('passport unlocks each mode separately, preserves best ratings, and awards three complete-mode badges',()=>{
  resetPassportForTest();
  assert.equal(JOURNEYS.length,12);
  for(const mode of ['car','train','flight']){
    const chapters=journeysFor(mode);assert.equal(chapters.length,4);
    assert.equal(isJourneyOpen(chapters[0].id),true);
    assert.equal(completeJourney(chapters[1].id,3),false);
    for(const journey of chapters){assert.equal(isJourneyOpen(journey.id),true);assert.equal(completeJourney(journey.id,2),true);assert.equal(completeJourney(journey.id,1),false);assert.equal(completeJourney(journey.id,3),true);}
    assert.equal(nextJourney(chapters.at(-1).id),null);
  }
  assert.deepEqual(passportSummary(),{completed:12,stars:36,badges:['car','train','flight']});
  resetPassportForTest();
});
test('corrupt and untrusted saves cannot unlock arbitrary chapter ids or inject invalid ratings',()=>{
  assert.deepEqual(normalizePassport({ratings:{'car-1':-1,'car-2':4,'train-1':2.5,'flight-1':'3',untrusted:3}}),{ratings:{}});
  assert.equal(isJourneyOpen('https://example.test'),false);assert.equal(completeJourney('car-1',NaN),false);
  assert.equal(requestedJourney('car','?journey=flight-1'),null);assert.equal(requestedJourney('car','?journey=car-4'),null);
  assert.equal(requestedJourney('car','?journey=car-1').id,'car-1');
});
test('passport reads back persistent progress after module reload and does not touch the R1 wallet',async()=>{
  const saved=new Map([['island-transport:rewards:v1','{"car":12}']]);
  globalThis.localStorage={getItem:key=>saved.get(key)||null,setItem:(key,value)=>saved.set(key,value),removeItem:key=>saved.delete(key)};
  try{
    resetPassportForTest();completeJourney('train-1',2);
    const reloaded=await import('../../src/shared/journeys.js?reload=1');
    assert.equal(reloaded.readPassport().ratings['train-1'],2);assert.equal(reloaded.isJourneyOpen('train-2'),true);
    assert.equal(saved.get('island-transport:rewards:v1'),'{"car":12}');assert.ok(saved.has(PASSPORT_KEY));
  }finally{resetPassportForTest();delete globalThis.localStorage;}
});
test('full or disabled storage retains successive in-session progress instead of reloading stale data',()=>{
  resetPassportForTest();
  globalThis.localStorage={getItem:()=>'{"ratings":{"car-1":1}}',setItem:()=>{throw new Error('quota');},removeItem(){}};
  try{assert.equal(completeJourney('car-2',2),true);assert.equal(completeJourney('car-3',3),true);assert.equal(readPassport().ratings['car-2'],2);assert.equal(readPassport().ratings['car-3'],3);}
  finally{delete globalThis.localStorage;resetPassportForTest();}
});

for(const journey of journeysFor('car'))test(`${journey.id}: actual car clock reaches short finish, collects stars, and replay retains length`,()=>{
  const previousRAF=globalThis.requestAnimationFrame;globalThis.requestAnimationFrame=()=>0;
  const results=[],game=new Game({canvas:{},onFinish:result=>results.push(result)});
  Object.assign(game,{initialized:true,mapId:journey.map,placeVehicle(){},updateCamera(){},world:{obstacles:[],update(){}},renderer:{render(){}},audio:{unlock:async()=>{},beep(){},update(){}}});
  try{
    game.start('cruise',{distance:journey.distance});game.starLayout=starLayout(journey.map,[],journey.distance);
    assert.ok(game.starLayout.every(star=>star.z>0&&star.z<journey.distance));
    for(let tick=1;tick<=60*160&&game.phase!=='finished';tick++){game.input.throttle=1;game.frame(tick*1000/60);}
    assert.equal(game.phase,'finished');assert.equal(results.length,1);assert.equal(results[0].completed,true);
    assert.ok(results[0].distance>=journey.distance&&results[0].distance<journey.distance+1);assert.ok(results[0].stars>0);assert.ok(results[0].elapsed<120);
    game.reset();assert.equal(game.journeyDistance,journey.distance);assert.equal(game.physics.distance,0);assert.equal(game.collected.size,0);
    game.start('cruise');assert.equal(game.journeyDistance,2400);
  }finally{globalThis.requestAnimationFrame=previousRAF;}
});
for(const journey of journeysFor('train'))test(`${journey.id}: child buttons physically service every station and obey the red signal`,()=>{
  const game=new TrainGame();game.start(journey.lesson,{route:journey.route});game.prepare();game.childGo();game.helpStop();
  for(let i=0;i<60*350&&!game.completed;i++){
    const s=game.getState();
    if(s.signalCleared&&!s.stopAssist&&s.distance>12&&Math.abs(s.speed)<.55&&!s.controls.doors){game.childGo();game.helpStop();}
    if(Math.abs(s.distance)<12&&Math.abs(s.speed)<.5&&!s.controls.doors){game.brake(7);game.toggleDoors();}
    if(game.serviced){game.toggleDoors();if(!game.completed){game.prepare();game.childGo();game.helpStop();}}
    const previous=game.physics.s;game.update(1/60);assert.ok(Math.abs(game.physics.s-previous)<.3);
  }
  assert.equal(game.completed,true);assert.equal(game.stops.length,game.lesson.stops.length);assert.equal(game.infractions.length,0);
  if(journey.id==='train-3')assert.equal(game.signalCleared,true);
  game.reset();assert.equal(game.lessonId,journey.lesson);assert.equal(game.stops.length,0);
});
for(const journey of journeysFor('flight'))test(`${journey.id}: one-tap child pilot completes shortened targets through flight and parcel physics`,()=>{
  const game=Object.create(FlightGame.prototype),state=createFlightInitialState(journey.lesson);
  Object.assign(game,{state,lesson:journey.lesson,map:journey.map,plane:'trainer',preschool:true,assist:true,mode:'playing',keys:new Set(),controls:{pitch:0,roll:0,rudder:0,throttle:state.throttle,flaps:state.flaps,brake:0},guidance:{pilot:createChildPilot(state)},mission:newMission(journey.lesson,journey.map,{targets:journey.targets}),world:{loaded:true,terrainHeight:()=>0,onRunway:p=>Math.abs(p.x)<24&&p.z>=0&&p.z<=1800}});
  game.childControl();
  for(let tick=0;tick<120*300&&!game.mission.complete&&!game.mission.retry;tick++){
    const controls=game.input(1/120),before={...state.position};stepPhysics(state,controls,AIRCRAFT.trainer,1/120,{assist:true,onRunway:game.world.onRunway(state.position)});updateMission(game.mission,state,1/120);
    assert.ok(Math.hypot(...['x','y','z'].map(axis=>state.position[axis]-before[axis]))<1);
  }
  assert.equal(game.mission.retry,false);assert.equal(game.mission.complete,true);assert.equal(game.mission.passed,journey.targets);assert.equal(game.mission.events.filter(event=>['star','mail','landmark'].includes(event.type)).length,journey.targets);assert.ok(state.time<180);
});
