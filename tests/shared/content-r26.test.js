import test from 'node:test';
import assert from 'node:assert/strict';
import {ContentLesson} from '../../src/shared/content-r26.js';
import {stability,drivingCue,holdFeedback,queuePosition,crossingCue,boardingCue} from '../../src/shared/content-r26-scene.js';
test('R26 cake wrong, idle, correct and near-upright states agree with action',()=>{
 for(const sign of [-1,1]){
  const g=new ContentLesson('cake');g.begin();g.recoveryActive=true;g.balanceLean=sign*12;
  const right=sign>0?'recover-left':'recover-right',wrong=sign>0?'recover-right':'recover-left';
  assert.equal(stability(g).status,'等你扶正');g.input[wrong]=true;
  assert.equal(stability(g).status,'越來越歪');assert.match(drivingCue(g).text,/越扶越歪/);assert.equal(drivingCue(g).action,right);
  g.release();g.input[right]=true;assert.equal(stability(g).status,'回穩中');assert.equal(holdFeedback(g).reason,drivingCue(g).text);
  g.recoveryActive=false;g.balanceLean=sign*.6;assert.equal(stability(g).status,'快扶正了');assert.ok(stability(g).fill>=95);
  g.balanceLean=0;assert.equal(stability(g).status,'坐穩了');assert.equal(stability(g).fill,100);
  g.stage=2;g.distance=47;g.bayStopped=true;assert.equal(drivingCue(g).action,'');assert.match(drivingCue(g).text,/休息一下/);g.bayRestTime=1;assert.equal(drivingCue(g).action,'go');assert.match(drivingCue(g).text,/可以出發/);
 }
});
test('R26 first escort waits for hold without claiming a release',()=>{
 const g=new ContentLesson('tickets');g.phase='boarding';g.doorStage='boarding';
 assert.equal(holdFeedback(g).reason,'按住陪上車。');g.input.escort=true;g.update(.016);g.release();
 assert.match(holdFeedback(g).reason,/放開了/);
 const slow=new ContentLesson('tickets');slow.phase='boarding';slow.doorStage='boarding';slow.boardTime=.1;slow.boardingRate=.1;slow.input.escort=true;
 for(let n=0;n<20;n++)slow.update(.05);
 assert.ok(Math.abs(slow.boardTime-.2)<.001,'the configured escort rate actually controls the inherited fixed-rate simulation');assert.equal(slow.boardingIndex,0);
});
test('R26 all boarding paths are continuous at every segment and reach the door',()=>{
 for(const door of [20,50,80])for(let n=0;n<3;n++){
  let previous=queuePosition(door,n,0,28);
  for(let k=1;k<=1000;k++){const next=queuePosition(door,n,k/1000,28);assert.ok(Math.abs(next.x-previous.x)<1);assert.ok(Math.abs(next.bottom-previous.bottom)<.1);previous=next;}
  for(const cut of [.16,.35,.72,.82]){const before=queuePosition(door,n,cut-1e-6,28),after=queuePosition(door,n,cut+1e-6,28);assert.ok(Math.abs(before.x-after.x)<.002);assert.ok(Math.abs(before.bottom-after.bottom)<.002);}
  assert.ok(previous.x>=0&&previous.x<=100);assert.ok(previous.bottom>28);
 }
});
test('R26 landed and seated friends have matching phase descriptions',()=>{
 const crossing=new ContentLesson('crossing');crossing.begin();crossing.crossTime=crossing.crossingDuration*.85;
 assert.match(crossingCue(crossing).text,/到對岸了，等他站好/);assert.doesNotMatch(crossingCue(crossing).text,/還有人在過街/);
 const tickets=new ContentLesson('tickets');tickets.phase='boarding';tickets.doorStage='boarding';tickets.boardingIndex=0;tickets.boardTime=.40;
 assert.match(boardingCue(tickets).text,/坐好了/);assert.doesNotMatch(boardingCue(tickets).text,/進門了/);
});
