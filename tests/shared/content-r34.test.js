import test from 'node:test';
import assert from 'node:assert/strict';
import {ContentLesson} from '../../src/shared/content-r33.js';
import {crossingView,CROSSING_ROADS} from '../../src/shared/content-r33-scene.js';

test('R34 every station and replay keeps each traffic direction in its right-hand lane, including yield and recheck',()=>{
 for(let stage=0;stage<3;stage++)for(const layoutSeed of [0,1])for(const newTraffic of [false,true])for(const time of [0,.3,.85,1.6,2.5,3.15]){
  const g=new ContentLesson('crossing',{stage,layoutSeed},{observeTraffic:true});g.begin();
  Object.assign(g,{speed:0,newTraffic,trafficTime:time,newTrafficTime:time,crossTime:newTraffic&&time<=.3?.8:0,crossed:0});
  const {traffic:t,stop}=crossingView(g),r=CROSSING_ROADS[stage];
  const eastbound=t.source==='left';
  assert.equal(t.heading,eastbound?'right':'left');assert.equal(t.reverse,!eastbound);
  assert.equal(t.lane,eastbound?'lower':'upper');
  assert.ok(eastbound?t.top>r.center:t.top+7<r.center);
  assert.ok(t.top>=r.top&&t.top+7<=r.bottom);
  assert.equal(stop.top,t.top-1);assert.ok(stop.top>=r.top&&stop.top+stop.height<=r.bottom);
  assert.ok(eastbound?stop.top>r.center:stop.top+stop.height<r.center);
  if(stop.visible)assert.ok(eastbound?stop.x>t.x:stop.x<t.x);
  for(const departureTime of [.3,.55,.6,1,1.49]){
   Object.assign(g,{phase:'departing',departureTime});const p=crossingView(g).player;
   assert.ok(p.laneY*100>r.center&&p.laneY*100<r.bottom);
   assert.ok(p.laneHeight>0&&p.laneHeight<.2);
   assert.ok(p.joinProgress>0&&p.joinProgress<=1);
   if(departureTime>=.6){assert.equal(p.joinProgress,1);assert.equal(p.profile,'side');assert.equal(p.heading,'right');}
  }
 }
});

test('R34 unsafe departure names the friend and preserves the main car in every station and replay',()=>{
 for(let stage=0;stage<3;stage++)for(const layoutSeed of [0,1]){
  const g=new ContentLesson('crossing',{stage,layoutSeed},{observeTraffic:true});g.begin();
  Object.assign(g,{speed:0,crossTime:.8});const player=crossingView(g).player;
  assert.equal(g.depart(),false);assert.deepEqual(crossingView(g).player,player);assert.match(crossingView(g).text,/等.+走到對岸/);
 }
});
