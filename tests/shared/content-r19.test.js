import test from 'node:test';
import assert from 'node:assert/strict';
import {ContentLesson} from '../../src/shared/content-r19.js';
import {drivingCue,cakeShift,ticketDoorState,landedFriends,completedCrossings,crossingCue,departLabel,observation} from '../../src/shared/content-r19-scene.js';
const options={releaseRecovery:true,observeTraffic:true,freshObservation:true,visualDeparture:true,manualDoors:true,visualDelivery:true,strictTurns:true};
const make=(kind,stage=0,layoutSeed=0)=>{const g=new ContentLesson(kind,{stage,layoutSeed},options);g.begin();g.speed=0;return g;};
const tick=(g,s)=>{for(let n=0;n<Math.ceil(s*60);n++)g.update(1/60);};
const until=(g,fn)=>{for(let n=0;n<2400&&!fn();n++)g.update(1/60);assert.ok(fn());};
test('R19 ordinary release and tray recovery give one consistent instruction on first play and replay',()=>{
 for(const seed of [0,1]){const g=make('cake',0,seed);g.distance=20;g.input[g.bend>0?'right':'left']=true;tick(g,.7);g.release();g.update(1/60);assert.equal(g.recoveryLocked,true);assert.equal(drivingCue(g).status,'回穩中');assert.equal(drivingCue(g).action,'');assert.match(drivingCue(g).text,/放開.*回中央/);until(g,()=>!g.recoveryLocked);assert.ok(Math.abs(g.balanceLean)<3);assert.ok(drivingCue(g).action);}
 const g=make('cake',1);g.distance=20;g.input.left=true;until(g,()=>g.hazardStop);assert.equal(drivingCue(g).status,'回穩中');const edge=cakeShift(g);assert.ok(Math.abs(edge)>=27);g.release();tick(g,.4);assert.ok(Math.abs(cakeShift(g))<Math.abs(edge));until(g,()=>!g.recoveryLocked);assert.ok(Math.abs(cakeShift(g))<3.4);
});
test('R19 step stays extended after all seats are filled and retracts before closing can begin',()=>{
 const g=make('tickets');g.select(g.platforms.findIndex(p=>p.name===g.target.name));g.distance=30;assert.equal(g.door(),true);tick(g,.4);
 for(let n=0;n<3;n++){g.choosePassenger(n);assert.equal(g.boardFriend(),true);until(g,()=>g.doorStage!=='boarding');}
 assert.equal(g.doorStage,'retract-ready');assert.equal(ticketDoorState(g).step,1);assert.equal(g.closeDoor(),false);g.retractStep();tick(g,.2);assert.ok(ticketDoorState(g).step>0&&ticketDoorState(g).step<1);assert.equal(g.closeDoor(),false);until(g,()=>g.doorStage==='close-ready');assert.equal(ticketDoorState(g).step,0);assert.equal(ticketDoorState(g).open,1);assert.equal(g.closeDoor(),true);until(g,()=>g.doorStage==='closed');assert.equal(ticketDoorState(g).open,0);
});
test('R19 all three crossings count a friend only after reaching the vacant far-curb slot',()=>{
 for(let stage=0;stage<3;stage++){const g=make('crossing',stage);g.look('left');g.look('right');until(g,()=>g.crossTime/g.crossingDuration>=.83);assert.equal(landedFriends(g),0);assert.doesNotMatch(crossingCue(g).text,/到了|到空位了/);assert.equal(g.canDepart,false);until(g,()=>g.crossed===1);assert.equal(landedFriends(g),1);assert.match(crossingCue(g).text,/到空位了/);assert.equal(completedCrossings(g),stage);}
});
test('R19 repeat observations during traffic and walking never skip a friend or increment observation facts',()=>{
 const g=make('crossing');g.look('left');g.look('right');const facts={...g.facts};g.look('left');assert.equal(g.focus,'left');g.look('right');assert.equal(g.focus,'right');assert.equal(g.crossed,0);assert.deepEqual(g.facts,facts);until(g,()=>g.crossTime>0);g.look('left');assert.equal(g.focus,'left');assert.ok(observation(g));assert.equal(g.depart(),false);assert.equal(g.crossed,0);
});
test('R19 departure label is always an action and never replaces arrival state',()=>{
 const g=make('crossing');for(const step of ['none','left','right']){if(step!=='none')g.look(step);assert.match(departLabel(g),/先看左|再看右|等車通過/);assert.doesNotMatch(departLabel(g),/已|正在|準備/);}until(g,()=>g.crossTime>0);assert.equal(departLabel(g),'等朋友到岸');
});
test('R19 three courses complete all stations and keep completion and facts through save restore',()=>{
 for(const kind of ['cake','crossing','tickets']){const g=make(kind);
  for(let stage=0;stage<3;stage++){
   if(kind==='cake'){for(let n=0;n<30000&&g.phase==='playing';n++){const cue=drivingCue(g);g.release();if(cue.action)g.input[cue.action]=true;g.update(1/60);}assert.equal(g.phase,'delivering');tick(g,2);}
   else if(kind==='crossing'){g.speed=0;for(let n=0;n<3;n++){g.look('left');g.look('right');until(g,()=>g.crossed>n);}assert.equal(g.depart(),true);tick(g,2);}
   else{g.select(g.platforms.findIndex(p=>p.name===g.target.name));g.distance=30;g.door();tick(g,1);for(let n=0;n<3;n++){g.choosePassenger(n);assert.equal(g.boardFriend(),true);tick(g,1.2);}assert.equal(g.retractStep(),true);tick(g,1);assert.equal(g.closeDoor(),true);tick(g,1);assert.equal(g.departTrain(),true);tick(g,2);}
   if(stage<2)g.next();
  }assert.equal(g.completed,true);const restored=new ContentLesson(kind,JSON.parse(JSON.stringify(g.snapshot())));assert.equal(restored.completed,true);assert.deepEqual(restored.facts,g.facts);
 }
});
