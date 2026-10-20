import test from 'node:test';
import assert from 'node:assert/strict';
import {ContentLesson} from '../../src/shared/content-r22.js';
import {cakeRoadState,drivingCue,crossingTraffic,crossingDestination,queuePosition,boardingGeometry,crossingCue} from '../../src/shared/content-r23-scene.js';

test('R23 cake route text and road sign describe the same painted road at every distance',()=>{
 for(let stage=0;stage<3;stage++)for(let distance=0;distance<60;distance+=.25){
  const g=new ContentLesson('cake',{stage});g.begin();g.distance=distance;
  const road=cakeRoadState(g),cue=drivingCue(g);
  assert.notEqual(road.shape,'straight');
  if(cue.action==='go'||cue.action==='left'||cue.action==='right')assert.ok(cue.text.includes(road.label),`${stage}/${distance}: ${cue.text}`);
  assert.doesNotMatch(cue.text,/直路/);
 }
 const g=new ContentLesson('cake',{stage:2});g.begin();g.distance=43;g.bayStopped=true;
 assert.match(drivingCue(g).text,/休息好了，可以出發了/);g.bayRestarted=true;assert.match(drivingCue(g).text,/左彎/);
});
test('R23 all cars follow horizontal lanes, and the fresh left recheck stays left',()=>{
 for(let stage=0;stage<3;stage++){
  let previous;
  for(let trafficTime=0;trafficTime<=4;trafficTime+=.05){
   const p=crossingTraffic({stage,trafficTime,lookStep:0});
   assert.equal(p.top,stage===1?27:32);assert.equal(p.approaching,false);
   assert.equal(p.heading,stage===1?'left':'right');
   if(previous)assert.ok(stage===1?p.x<=previous.x:p.x>=previous.x);previous=p;
  }
 }
 for(let recheckTime=0;recheckTime<1.4;recheckTime+=.01){const p=crossingTraffic({stage:2,lookStep:2,recheckTime});assert.ok(p.x<50);assert.equal(p.source,'left');assert.equal(p.heading,'right');}
 const g=new ContentLesson('crossing',{stage:2},{observeTraffic:true,freshObservation:true});g.begin();g.speed=0;g.look('left');g.look('right');g.recheckTime=1.5;
 assert.equal(g.trafficActive,true);assert.equal(crossingCue(g).text,'左邊還要再確認。');assert.equal(crossingCue(g).action,'look-left');
 g.trafficTime=4;assert.equal(g.trafficActive,false);assert.equal(crossingCue(g).text,'左邊還要再確認。');
 g.crossed=1;g.trafficTime=10;g.recheckTime=0;assert.equal(g.trafficActive,false);assert.equal(crossingCue(g).text,'左邊還要再確認。');
});
test('R23 destination has a check only when all three pairs of feet have landed',()=>{
 for(let crossed=0;crossed<3;crossed++)for(const p of [0,.17,.5,.81,.82,.99]){
  const g={crossed,crossTime:p*3,crossingDuration:3};assert.equal(crossingDestination(g).includes('✓'),crossed===2&&p>=.82);
 }
 assert.equal(crossingDestination({crossed:3,crossTime:0,crossingDuration:3}),'對岸 ✓');
 const g=new ContentLesson('crossing');g.begin();g.speed=0;g.crossTime=.1;assert.match(crossingCue(g).text,/準備過街/);
});
test('R23 queue feet stay on platform, climb the connected front step, and meet the sill',()=>{
 for(const height of [180,300,550,900])for(let stage=0;stage<3;stage++)for(const door of [20,50,80])for(let i=0;i<3;i++){
  const sill=height*.72,ground=boardingGeometry(sill,height),threshold=(height-sill)/height*100;
  assert.ok(ground.platformTop<height*.97);
  for(let progress=0;progress<.72;progress+=.01){const p=queuePosition(door,i,progress,threshold,360,height,134,stage),feet=height*(1-p.bottom/100);
   if(progress<.26)assert.ok(feet>=ground.platformTop);
   else {assert.ok(Math.abs(p.x-door)<1e-8);assert.ok(feet>=sill-1e-8);}
  }
  const end=queuePosition(door,i,.58,threshold,360,height,134,stage);assert.equal(end.x,door);assert.ok(Math.abs(end.bottom-threshold)<1e-8);
 }
});
