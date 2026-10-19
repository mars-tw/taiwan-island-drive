import test from 'node:test';
import assert from 'node:assert/strict';
import {ContentLesson} from '../../src/shared/content-r15.js';
import {drivingCue,crossingCue,boardingCue,ticketDoorState} from '../../src/shared/content-r15-scene.js';
const tick=(g,s)=>{for(let i=0;i<Math.ceil(s*60);i++)g.update(1/60);};
const make=(kind,stage=0)=>{const g=new ContentLesson(kind,{stage},{releaseRecovery:true,observeTraffic:true,freshObservation:true,visualDeparture:true,manualDoors:true,visualDelivery:true,strictTurns:true});g.balancePractice=kind==='cake';g.begin();return g;};
test('R15 turns require the correct held direction; wrong direction stops without progress and visibly leans',()=>{
 for(const [distance,side,wrong] of [[20,'left','right'],[32,'right','left']]){
  const g=make('cake',1);g.distance=distance;g.input.go=true;tick(g,1);assert.equal(g.distance,distance);assert.equal(drivingCue(g).action,side);
  g.release();g.input[wrong]=true;tick(g,.3);assert.equal(g.distance,distance);assert.equal(g.speed,0);assert.ok(Math.abs(g.balanceLean)>=12);assert.match(drivingCue(g).text,/方向相反/);
  g.release();tick(g,4);assert.ok(Math.abs(g.balanceLean)<3);g.input[side]=true;tick(g,1);assert.ok(g.distance>distance);assert.ok(g.balanceLean*(side==='left'?1:-1)>5);assert.equal(drivingCue(g).action,side);
 }
});
test('R15 sustained turn slides to tray edge and gently stops until released and settled',()=>{
 const g=make('cake',1);g.distance=20;g.input.left=true;tick(g,5);assert.equal(g.hazardStop,true);assert.ok(Math.abs(g.balanceLean)>=24);assert.equal(g.speed,0);const d=g.distance;tick(g,2);assert.equal(g.distance,d);
 g.release();tick(g,4);assert.equal(g.hazardStop,false);assert.ok(Math.abs(g.balanceLean)<3);g.input.left=true;tick(g,1);assert.ok(g.distance>d);
});
test('R15 every friend needs fresh left/right, traffic clears before crossing, only arrival adds one',()=>{
 const g=make('crossing');g.speed=0;
 for(let stage=0;stage<3;stage++){
  for(let n=0;n<3;n++){
   assert.deepEqual(g.looked,{left:false,right:false});tick(g,1);assert.equal(g.crossTime,0);g.look('right');assert.equal(g.looked.right,false);
   g.look('left');tick(g,.2);assert.equal(g.crossTime,0);assert.equal(crossingCue(g).action,'look-right');g.look('right');assert.equal(g.friendConfirmed,true);
   if(n===0){tick(g,.3);assert.equal(g.crossTime,0);assert.equal(crossingCue(g).state,'正在等來車');}
   while(g.crossTime===0)tick(g,.05);assert.equal(g.crossed,n);assert.equal(crossingCue(g).state,'正在過街');tick(g,g.crossingDuration+.1);assert.equal(g.crossed,n+1);assert.equal(g.facts.waited,stage*3+n+1);
  }
  assert.equal(g.canDepart,true);g.depart();tick(g,1.6);if(stage<2){g.next();g.speed=0;}
 }
 assert.equal(g.completed,true);assert.equal(g.facts.leftViews,9);assert.equal(g.facts.rightViews,9);assert.equal(new ContentLesson('crossing',g.snapshot()).facts.waited,9);
});
test('R15 one invitation moves one rider; no timer can skip invitations, retract or close',()=>{
 const g=make('tickets');g.select(g.platforms.findIndex(t=>t.shape===g.target.shape&&t.color===g.target.color));g.distance=30;g.speed=0;assert.equal(g.door(),true);tick(g,2);
 for(let n=0;n<3;n++){
  assert.equal(g.doorStage,'awaiting');const time=g.boardTime;tick(g,8);assert.equal(g.boardTime,time);assert.equal(boardingCue(g).action,'board');assert.equal(g.boardFriend(n+1),false);assert.equal(g.boardFriend(n),true);assert.equal(g.boardFriend(n),false);assert.equal(g.retractStep(),false);assert.equal(g.closeDoor(),false);assert.equal(g.departTrain(),false);tick(g,1.2);assert.equal(g.boardingIndex,n+1);
 }
 assert.equal(g.doorStage,'retract-ready');assert.equal(g.closeDoor(),false);assert.equal(g.retractStep(),true);tick(g,2);assert.equal(g.doorStage,'close-ready');assert.equal(ticketDoorState(g).open,1);assert.equal(ticketDoorState(g).step,0);tick(g,5);assert.equal(g.doorStage,'close-ready');assert.equal(g.departTrain(),false);assert.equal(g.closeDoor(),true);tick(g,2);assert.equal(g.doorStage,'closed');assert.equal(g.departTrain(),true);tick(g,1.6);assert.equal(g.facts.boarded,3);
});
test('R15 ticket layout persists and rotates on replay without removing either distractor',()=>{
 for(let seed=0;seed<3;seed++){
  const slots=[];for(let stage=0;stage<3;stage++){const g=new ContentLesson('tickets',{stage,layoutSeed:seed}),p=g.platforms;slots.push(p.findIndex(t=>t.shape===g.target.shape&&t.color===g.target.color));assert.ok(p.some(t=>t.shape===g.target.shape&&t.color!==g.target.color));assert.ok(p.some(t=>t.shape!==g.target.shape&&t.color===g.target.color));assert.deepEqual(new ContentLesson('tickets',g.snapshot()).platforms,p);}
  assert.equal(new Set(slots).size,3);
 }
 assert.notDeepEqual(new ContentLesson('tickets',{layoutSeed:0}).platforms,new ContentLesson('tickets',{layoutSeed:1}).platforms);
});
test('R15 cake can complete all three stages with turns, release recovery and a bay restart',()=>{
 const g=make('cake');for(let stage=0;stage<3;stage++){
  for(let n=0;n<30000&&g.phase==='playing';n++){
   const cue=drivingCue(g);g.release();if(cue.action)g.input[cue.action]=true;g.update(1/60);
  }
  assert.equal(g.phase,'delivering');tick(g,1.6);assert.equal(g.phase,stage===2?'done':'checkpoint');if(stage<2)g.next();
 }
 assert.equal(g.completed,true);assert.equal(g.facts.bayStops,1);assert.equal(g.facts.bayRestarts,1);assert.equal(new ContentLesson('cake',g.snapshot()).completed,true);
});
