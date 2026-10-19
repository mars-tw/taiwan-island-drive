import test from 'node:test';
import assert from 'node:assert/strict';
import {ContentLesson} from '../../src/shared/content-r18.js';
import {crossingCue,completedCrossings,landedFriends,drivingCue,crossingTraffic,observation,trafficLabelPosition} from '../../src/shared/content-r18-scene.js';
const options={releaseRecovery:true,observeTraffic:true,freshObservation:true,visualDeparture:true,manualDoors:true,visualDelivery:true,strictTurns:true};
const make=(kind,stage=0,layoutSeed=0)=>{const g=new ContentLesson(kind,{stage,layoutSeed},options);g.begin();g.speed=0;return g;};
const tick=(g,s)=>{for(let n=0;n<s*60;n++)g.update(1/60);};
const until=(g,fn)=>{for(let n=0;n<1200&&!fn();n++)g.update(1/60);assert.ok(fn(),'state transition completes within 20 simulated seconds');};
test('R18 observation caption describes only the observed lane and keeps other traffic separate',()=>{
 const g=make('crossing');g.look('left');assert.match(crossingCue(g).text,/左邊有車/);g.look('right');assert.match(crossingCue(g).text,/右邊沒車/);assert.equal(observation(g).target,'空車道入口');tick(g,1.7);assert.match(crossingCue(g).text,/右邊有車/);assert.equal(observation(g).target,'來車');assert.equal(g.canDepart,false);
});
test('R18 station counter and arrival acknowledgement are consistent through all three stations',()=>{
 for(let stage=0;stage<3;stage++){
  const g=make('crossing',stage);assert.equal(completedCrossings(g),stage);
  for(let n=0;n<3;n++){
   g.look('left');g.look('right');until(g,()=>g.crossTime>0);until(g,()=>g.crossTime/g.crossingDuration>=.83);
   assert.equal(landedFriends(g),n+1);assert.match(crossingCue(g).text,/到了/);assert.doesNotMatch(crossingCue(g).text,/正在過街/);
   assert.equal(completedCrossings(g),stage+(n===2?1:0));until(g,()=>g.crossed>n);
  }
  assert.equal(completedCrossings(g),stage+1);assert.equal(g.depart(),true);tick(g,2);assert.equal(completedCrossings(g),stage+1);
 }
});
test('R18 traffic and observation stay within the scene, for every station and replay',()=>{
 for(let stage=0;stage<3;stage++)for(let layoutSeed=0;layoutSeed<3;layoutSeed++)for(let t=0;t<=4;t+=.1){const g=make('crossing',stage,layoutSeed);g.trafficTime=t;g.focus='left';const car=crossingTraffic(g),o=observation(g);assert.ok(car.x>=17&&car.x<=83);assert.ok(o.x-13>=0&&o.x+13<=100);for(const width of [234,288,358,768]){const label=trafficLabelPosition(g,width);assert.ok(label>=2&&label+44<=width-2);assert.ok(label+44<=width*(o.x-13)/100-2||label>=width*(o.x+13)/100+2);}}
});
test('R18 tray stop locks held appearance and requires recovery before another press',()=>{
 const g=make('cake',1);g.distance=20;g.input.left=true;for(let n=0;n<900&&!g.hazardStop;n++)g.update(1/60);
 assert.equal(g.recoveryLocked,true);assert.equal(g.hazardStop,true);assert.equal(drivingCue(g).action,'');const d=g.distance;tick(g,2);assert.equal(g.distance,d);g.release();tick(g,4);assert.equal(g.recoveryLocked,false);assert.equal(g.hazardStop,false);assert.ok(Math.abs(g.balanceLean)<3);g.input[g.bend>0?'right':'left']=true;tick(g,1);assert.ok(g.distance>d);
});
test('R18 wrong-direction message belongs to a visible bend on both layouts',()=>{
 for(const seed of [0,1]){const g=make('cake',0,seed);g.distance=20;g.input[g.bend>0?'left':'right']=true;tick(g,.2);assert.match(drivingCue(g).text,/方向相反/);tick(g,2);assert.match(drivingCue(g).text,/方向相反/);assert.equal(g.distance,20);g.distance=45;assert.doesNotMatch(drivingCue(g).text,/方向相反/);}
});
test('R18 three courses still complete and restore without skipping manual boarding decisions',()=>{
 for(const kind of ['cake','crossing','tickets']){const g=make(kind);
  for(let stage=0;stage<3;stage++){
   if(kind==='cake'){for(let n=0;n<30000&&g.phase==='playing';n++){const c=drivingCue(g);g.release();if(c.action)g.input[c.action]=true;g.update(1/60);}assert.equal(g.phase,'delivering');tick(g,2);}
   else if(kind==='crossing'){g.speed=0;for(let n=0;n<3;n++){g.look('left');g.look('right');until(g,()=>g.crossed>n);}assert.equal(g.depart(),true);tick(g,2);}
   else{g.select(g.platforms.findIndex(p=>p.shape===g.target.shape&&p.color===g.target.color));g.distance=30;assert.equal(g.door(),true);tick(g,1);for(let n=0;n<3;n++){assert.equal(g.boardFriend(),false);g.choosePassenger(n);assert.equal(g.boardFriend(),true);tick(g,1.2);}assert.equal(g.phase,'boarding');assert.equal(g.doorStage,'retract-ready');assert.equal(g.retractStep(),true);tick(g,1);assert.equal(g.closeDoor(),true);tick(g,1);assert.equal(g.departTrain(),true);assert.equal(g.phase,'departing');tick(g,2);}
   if(stage<2)g.next();
  }assert.equal(g.completed,true);assert.equal(new ContentLesson(kind,JSON.parse(JSON.stringify(g.snapshot()))).completed,true);
 }
});
