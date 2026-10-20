import test from 'node:test';
import assert from 'node:assert/strict';
import {ContentLesson} from '../../src/shared/content-r30.js';
import {cakeAngle,stability,cakeStage,drivingCue,carGround,ticketDifference,ticketMismatch,crossingCue,departReasons} from '../../src/shared/content-r30-scene.js';
const run=(g,n)=>{for(let i=0;i<n;i++)g.update(.016);};
test('R30 displayed cake angle uniquely determines return percentage including rounded zero',()=>{
 const g=new ContentLesson('cake');for(let lean=-32;lean<=32;lean+=.1){g.balanceLean=lean;const a=cakeAngle(g),s=stability(g);assert.equal(s.fill===100,a===0);assert.equal(s.status==='坐穩了',a===0);}
 g.balanceLean=20;assert.equal(stability(g).status,'蛋糕歪了');g.input['recover-left']=true;assert.equal(stability(g).status,'扶正中');
});
test('R30 bay instructions have one action and do not claim arrival before the destination',()=>{
 const g=new ContentLesson('cake',{stage:2});g.begin();for(const [distance,stopped,restarted,ready,id,action] of [[43,false,false,false,'bay-braking','brake'],[47,true,false,false,'resting',''],[47,true,false,true,'parked','go'],[51,true,true,true,'leaving','go'],[54.6,true,true,true,'main-road','go']]){Object.assign(g,{distance,bayStopped:stopped,bayRestarted:restarted,restReady:ready});assert.equal(cakeStage(g).id,id);assert.equal(drivingCue(g).action,action);assert.doesNotMatch(drivingCue(g).text,/到家|分享站/);}
 g.distance=55;g.speed=3;assert.equal(drivingCue(g).action,'brake');g.speed=0;g.balanceLean=9;assert.equal(drivingCue(g).action,'recover-left');
});
test('R30 return to main road is physically outside the parked position before destination',()=>{
 const g=new ContentLesson('cake',{stage:2});Object.assign(g,{bayStopped:true,distance:47});const p=carGround(g);g.bayRestarted=true;g.distance=54.5;const m=carGround(g);assert.ok(m.x<p.x-.45);assert.ok(m.y<p.y-.25);
});
test('R30 slowing and supporting instructions identify the same single action',()=>{
 const g=new ContentLesson('cake');g.begin();g.balanceLean=20;g.speed=5;assert.equal(drivingCue(g).action,'brake');assert.match(drivingCue(g).text,/煞車/);g.speed=0;assert.equal(drivingCue(g).action,'recover-left');assert.match(drivingCue(g).text,/向左扶/);g.balanceLean=-20;assert.equal(drivingCue(g).action,'recover-right');
});
test('R30 each crossing invalidates the previously observed opposite side during the first crossing',()=>{
 for(let stage=0;stage<3;stage++)for(let seed=0;seed<2;seed++){
  const g=new ContentLesson('crossing',{stage,layoutSeed:seed},{observeTraffic:true,visualDeparture:true});g.begin();g.input.brake=true;run(g,80);g.release();g.look('left');g.look('right');assert.ok(g.looked.left&&g.looked.right);run(g,400);assert.equal(g.newTraffic,true);assert.equal(g.staleSide,g.trafficSource);assert.equal(g.looked[g.staleSide],false);assert.equal(g.canDepart,false);assert.match(departReasons(g)[0],/再看/);const stale=g.staleSide,other=stale==='left'?'right':'left';g.look(other);assert.equal(g.staleSide,stale);g.look(stale);assert.equal(g.looked[stale],false);run(g,450);assert.equal(g.trafficActive,false);assert.match(crossingCue(g).text,/再看/);g.look(stale);assert.equal(g.staleSide,'');assert.equal(g.refreshes,1);
 }
});
test('R30 all three crossings finish through observation and let everyone arrive before departing',()=>{
 const g=new ContentLesson('crossing',{}, {observeTraffic:true,visualDeparture:true});g.begin();g.input.brake=true;run(g,80);g.release();for(let stage=0;stage<3;stage++){
  for(let frame=0;frame<3000&&g.phase==='playing';frame++){if(frame%50===0){g.look('left');g.look('right');}g.update(.016);if(g.canDepart)g.depart();}assert.equal(g.phase,'departing');assert.equal(g.crossed,3);assert.equal(g.refreshes,1);run(g,100);if(stage<2){assert.equal(g.phase,'checkpoint');g.next();g.input.brake=true;run(g,80);g.release();}}
 assert.equal(g.completed,true);const save=g.snapshot();assert.equal(save.contentVersion,30);assert.deepEqual(new ContentLesson('crossing',save).snapshot(),save);
});
test('R30 new vehicle yields while a friend crosses and pause freezes all traffic',()=>{
 const g=new ContentLesson('crossing',{}, {observeTraffic:true});g.begin();g.speed=0;g.trafficTime=5;g.look('left');g.look('right');run(g,100);assert.equal(g.newTraffic,true);assert.ok(g.newTrafficTime<=.3);const t=g.newTrafficTime,p=g.crossTime;g.pause();run(g,200);assert.equal(g.newTrafficTime,t);assert.equal(g.crossTime,p);
});
test('R30 ticket wrong shape and wrong color remain distinct and never reveal the solution',()=>{
 for(let stage=0;stage<3;stage++)for(let seed=0;seed<6;seed++){const g=new ContentLesson('tickets',{stage,layoutSeed:seed});g.begin();for(let i=0;i<3;i++){g.select(i);const d=ticketDifference(g);if(!d.shape)assert.match(ticketMismatch(g),/形狀不同/);else if(!d.color)assert.match(ticketMismatch(g),/顏色不同/);else assert.equal(g.matched,true);assert.equal(g.showHint,false);}}
});
