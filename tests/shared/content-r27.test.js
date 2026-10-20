import test from 'node:test';
import assert from 'node:assert/strict';
import {ContentLesson,FRIEND_NAMES} from '../../src/shared/content-r27.js';
import {stability,cakeRoadState,queuePosition,ticketSceneGeometry,crossingLocation,lessonResult,crossingCue} from '../../src/shared/content-r27-scene.js';
test('R27 all lessons start neutral; timed or requested help never unlocks traffic',()=>{
 for(const kind of ['cake','crossing','tickets']){const g=new ContentLesson(kind);for(let i=0;i<100;i++)g.update(.05);g.begin();assert.equal(g.showHint,false,'reading the intro does not spend the observation window');g.update(.016);assert.equal(g.showHint,false);for(let i=0;i<41;i++)g.update(.05);assert.equal(g.showHint,true);g.stage=2;g.reset();g.begin();for(let i=0;i<100;i++)g.update(.05);assert.equal(g.showHint,false);g.askHint();assert.equal(g.showHint,true);if(kind==='crossing')assert.equal(g.canDepart,false);}
});
test('R27 completed bay rest means exactly upright and the bay sign is already present during braking',()=>{
 const g=new ContentLesson('cake');g.stage=2;g.begin();g.distance=47;g.bayStopped=true;g.balanceLean=.3;g.bayRestTime=.65;g.update(.016);assert.deepEqual(stability(g),{status:'坐穩了',fill:100});assert.equal(g.balanceLean,0);assert.equal(g.flagSway,0);g.bayStopped=false;g.distance=42;assert.equal(cakeRoadState(g).label,'休息灣');
});
test('R27 unsafe departure freezes the next feedback frame without moving traffic or pedestrians',()=>{
 const g=new ContentLesson('crossing',{}, {observeTraffic:true});g.begin();g.speed=0;g.look('left');g.trafficTime=.5;const before={traffic:g.trafficTime,person:g.crossTime,distance:g.distance};assert.equal(g.depart(),false);for(let i=0;i<6;i++)g.update(.016);assert.deepEqual({traffic:g.trafficTime,person:g.crossTime,distance:g.distance},before);assert.match(g.choiceHint,/還有車，先停住/);assert.equal(g.canDepart,false);
});
test('R27 replay rotates each crossing queue; waiting friends stay away from the car lane',()=>{
 for(let stage=0;stage<3;stage++){const a=new ContentLesson('crossing',{stage,layoutSeed:0}),b=new ContentLesson('crossing',{stage,layoutSeed:1});assert.notDeepEqual(a.crossingOrder,b.crossingOrder);assert.equal(b.crossingPerson,b.crossingOrder[0]);for(const who of b.crossingOrder){const pos=crossingLocation(who,'waiting',0,stage,b.crossingOrder);assert.ok(Math.abs(pos.x-50)>20);}}
 assert.equal(FRIEND_NAMES.child,'小安');assert.doesNotMatch(Object.values(FRIEND_NAMES).join(''),/小朋友|腳踏車/);
 const g=new ContentLesson('crossing');g.begin();g.speed=0;g.look('right');assert.equal(g.showHint,true);assert.equal(crossingCue(g).action,'look-left');
});
test('R27 train waits visibly independent of answer; boarding remains continuous and counting waits for seating',()=>{
 for(let stage=0;stage<3;stage++){const g=new ContentLesson('tickets',{stage});assert.equal(ticketSceneGeometry(g).x,18);for(const door of [20,50,80])for(let n=0;n<3;n++){let last=queuePosition(door,n,0,28);assert.equal(last.x,[22,42,62][n]);for(let i=1;i<=1000;i++){const next=queuePosition(door,n,i/1000,28);assert.ok(Math.abs(next.x-last.x)<1);assert.ok(Math.abs(next.bottom-last.bottom)<.1);last=next;}assert.equal(queuePosition(door,n,.8,28).surface,'door');assert.equal(queuePosition(door,n,.9,28).surface,'aisle');}}
 const g=new ContentLesson('tickets');g.phase='boarding';g.doorStage='boarding';g.boardingIndex=0;g.boardTime=.2;const t=g.boardTime;g.update(.05);assert.equal(g.boardTime,t);g.input.escort=true;g.update(.05);assert.ok(g.boardTime>t);const snapshot=g.snapshot();assert.equal(new ContentLesson('tickets',snapshot).stage,snapshot.stage);
 for(const width of [286,290,310]){const x=[0,1,2].map(i=>queuePosition(50,i,0,28,width).x*width/100);assert.ok(x[1]-x[0]>=60&&x[2]-x[1]>=60,'small-phone passenger buttons have independent 60px targets');}
});
test('R27 completion recap responds to actual corrections and saved completion survives replay seed',()=>{
 const g=new ContentLesson('cake');const clean=lessonResult(g).learned;g.facts.recoveries=3;assert.notEqual(lessonResult(g).learned,clean);g.completed=true;const saved=g.snapshot(),loaded=new ContentLesson('cake',saved);assert.equal(loaded.completed,true);assert.equal(loaded.facts.recoveries,3);
});
