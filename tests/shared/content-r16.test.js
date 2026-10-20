import test from 'node:test';
import assert from 'node:assert/strict';
import {ContentLesson} from '../../src/shared/content-r16.js';
import {drivingCue,stability,boardingCue,crossingCue,crossingLocation,crossingTraffic,ticketMismatch,lessonResult} from '../../src/shared/content-r16-scene.js';
const tick=(g,s)=>{for(let i=0;i<Math.ceil(s*60);i++)g.update(1/60);};
const make=(kind,stage=0)=>{const g=new ContentLesson(kind,{stage},{releaseRecovery:true,observeTraffic:true,freshObservation:true,visualDeparture:true,manualDoors:true,visualDelivery:true,strictTurns:true});g.balancePractice=kind==='cake';g.begin();return g;};
test('R16 correct short turn is positive; wrong turn never advances; recovery shares one instruction',()=>{
 const g=make('cake',1);g.distance=20;g.input.right=true;tick(g,.3);assert.equal(g.distance,20);assert.equal(stability(g).tone,'orange');assert.match(drivingCue(g).text,/方向相反/);
 g.release();tick(g,4);g.input.left=true;tick(g,.5);assert.ok(g.distance>20);assert.equal(stability(g).tone,'green');assert.equal(stability(g).status,'轉彎中・很穩');assert.equal(drivingCue(g).action,'left');assert.doesNotMatch(drivingCue(g).text,/歪/);
 g.release();tick(g,3);assert.equal(drivingCue(g).action,'left');assert.match(drivingCue(g).text,/左轉/);assert.doesNotMatch(drivingCue(g).text,/可起步/);
});
test('R16 sustained hold still slides, safely stops and requires release to recover',()=>{
 const g=make('cake',1);g.distance=20;g.input.left=true;tick(g,5);assert.equal(g.hazardStop,true);assert.equal(g.speed,0);const d=g.distance;tick(g,2);assert.equal(g.distance,d);g.release();tick(g,4);assert.equal(g.hazardStop,false);assert.equal(stability(g).tone,'green');
});
test('R16 every crossing choice is reversible and all nine fresh observations complete and save',()=>{
 const g=make('crossing');g.speed=0;
 for(let stage=0;stage<3;stage++){
  for(let n=0;n<3;n++){
   g.look('right');assert.match(crossingCue(g).text,/先看左/);assert.deepEqual(g.looked,{left:false,right:false});g.look('left');g.look('right');
   for(let i=0;i<900&&g.crossed===n;i++)g.update(1/60);assert.equal(g.crossed,n+1);
  }
  assert.equal(g.depart(),true);tick(g,1.6);if(stage<2){g.next();g.speed=0;}
 }
 assert.equal(g.completed,true);assert.equal(g.facts.leftViews,9);assert.equal(g.facts.rightViews,9);assert.equal(new ContentLesson('crossing',g.snapshot()).completed,true);
 assert.notDeepEqual(crossingLocation('child','waiting',0,0),crossingLocation('child','waiting',0,1));
 assert.notEqual(crossingLocation('child','crossing',.5,0).bottom,crossingLocation('child','crossing',.5,2).bottom);
 const a=crossingTraffic({stage:0,trafficTime:0}),b=crossingTraffic({stage:1,trafficTime:0});assert.notEqual(a.reverse,b.reverse);assert.notEqual(a.top,b.top);
});
test('R16 unselected platforms reveal no answer; mismatch names the differing clue; each rider needs scene selection',()=>{
 const g=make('tickets');assert.equal(g.selected,-1);assert.equal(g.matched,false);
 const wrong=g.platforms.findIndex(p=>p.shape===g.target.shape&&p.color!==g.target.color);g.select(wrong);assert.match(ticketMismatch(g),/顏色/);g.distance=30;g.speed=0;assert.equal(g.door(),false);
 g.select(g.platforms.findIndex(p=>p.color===g.target.color&&p.shape!==g.target.shape));g.distance=30;assert.match(ticketMismatch(g),/形狀/);assert.equal(g.door(),false);
 g.select(g.platforms.findIndex(p=>p.shape===g.target.shape&&p.color===g.target.color));g.distance=30;assert.equal(g.door(),true);tick(g,1);
 for(let n=0;n<3;n++){
  assert.equal(g.boardFriend(),false);assert.equal(boardingCue(g).action,'');assert.equal(g.choosePassenger((n+1)%3),false);assert.match(boardingCue(g).text,/先上車/);
  assert.equal(g.choosePassenger(n),true);assert.equal(boardingCue(g).action,'board');assert.equal(g.boardFriend(),true);tick(g,1.2);assert.equal(g.boardingIndex,n+1);
 }
 assert.equal(g.retractStep(),true);tick(g,1);assert.equal(g.closeDoor(),true);tick(g,1);assert.equal(g.departTrain(),true);tick(g,1.6);assert.equal(g.facts.boarded,3);
});
test('R16 cake completes all stations including bay restart and result avoids developer counters',()=>{
 const g=make('cake');for(let stage=0;stage<3;stage++){
  for(let n=0;n<30000&&g.phase==='playing';n++){const cue=drivingCue(g);g.release();if(cue.action)g.input[cue.action]=true;g.update(1/60);}
  assert.equal(g.phase,'delivering');tick(g,1.6);if(stage<2)g.next();
 }
 assert.equal(g.completed,true);assert.equal(g.facts.bayStops,1);assert.equal(g.facts.bayRestarts,1);assert.equal(new ContentLesson('cake',g.snapshot()).completed,true);
 for(const kind of ['cake','crossing','tickets'])assert.doesNotMatch(lessonResult({...g,kind}).learned,/9|次|九位/);
});
