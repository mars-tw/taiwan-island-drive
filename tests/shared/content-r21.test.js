import test from 'node:test';
import assert from 'node:assert/strict';
import {ContentLesson,FRIEND_NUMBERS,LOOK_SEQUENCES} from '../../src/shared/content-r21.js';
import {drivingCue,stability,ticketDoorState,crossingTraffic} from '../../src/shared/content-r21-scene.js';
const make=(k,stage=0)=>{const g=new ContentLesson(k,{stage},{freshObservation:true,observeTraffic:true,visualDeparture:true,visualDelivery:true,manualDoors:true});g.begin();return g;};
const tick=(g,s)=>{for(let n=0;n<Math.ceil(s*60);n++)g.update(1/60);};
const until=(g,fn,max=4000)=>{for(let n=0;n<max&&!fn();n++)g.update(1/60);assert.ok(fn());};

test('R21 centre recovery is player driven: idle and wrong holds freeze, correct holds advance, pause cancels',()=>{
 for(const sign of [-1,1]){const g=make('cake');g.balanceLean=sign*24;g.release();tick(g,.2);assert.equal(g.recoveryActive,true);assert.equal(g.balanceLean,sign*24);
  const correct=sign>0?'recover-left':'recover-right',wrong=sign>0?'recover-right':'recover-left';g.input[wrong]=true;tick(g,.5);assert.equal(g.balanceLean,sign*24);assert.equal(g.recoveryWrong,true);g.release();
  const values=[];for(let n=0;n<3;n++){g.input[correct]=true;tick(g,.3);values.push(stability(g).fill);}assert.ok(values[0]<values[1]&&values[1]<values[2]);assert.equal(g.distance,0);g.pause();const lean=g.balanceLean;tick(g,1);assert.equal(g.balanceLean,lean);g.paused=false;g.input[correct]=true;until(g,()=>!g.recoveryActive);assert.equal(g.balanceLean,0);assert.equal(g.facts.recoveries,1);
 }
});
test('R21 three crossing observation patterns reject the old answer and preserve friend identities',()=>{
 assert.deepEqual(FRIEND_NUMBERS,{child:1,bike:2,grandma:3});
 for(let stage=0;stage<3;stage++){const g=make('crossing',stage);g.speed=0;const seq=LOOK_SEQUENCES[stage];g.look(seq[0]==='left'?'right':'left');assert.equal(g.lookStep,0);assert.ok(g.choiceHint);for(const side of seq)g.look(side);assert.equal(g.friendConfirmed,true);const facts={...g.facts};g.look('left');g.look('right');assert.deepEqual(g.facts,facts);until(g,()=>g.crossTime>0);g.look('right');assert.equal(g.focus,'right');assert.equal(g.depart(),false);until(g,()=>g.crossed===1);assert.equal(g.lookStep,0);assert.equal(g.canDepart,false);assert.equal(crossingTraffic({...g,trafficTime:0}).reverse,stage===1);}
});
test('R21 train boarding advances only while escort is held; step remains until retracted',()=>{
 const g=make('tickets');g.select(g.platforms.findIndex(x=>x.name===g.target.name));g.distance=30;g.speed=0;assert.equal(g.door(),true);tick(g,.5);
 for(let n=0;n<3;n++){g.choosePassenger(n);assert.equal(g.boardFriend(),true);const t=g.boardTime;tick(g,1);assert.equal(g.boardTime,t);g.input.escort=true;tick(g,.3);assert.ok(g.boardTime>t);g.release();const pause=g.boardTime;tick(g,.3);assert.equal(g.boardTime,pause);g.input.escort=true;until(g,()=>g.doorStage!=='boarding');}
 assert.equal(ticketDoorState(g).step,1);assert.equal(g.closeDoor(),false);assert.equal(g.retractStep(),true);until(g,()=>g.doorStage==='close-ready');assert.equal(ticketDoorState(g).step,0);assert.equal(g.closeDoor(),true);
});
test('R21 all three courses complete every stop and restore factual saved results',()=>{
 for(const kind of ['cake','crossing','tickets']){const g=make(kind);
  for(let stage=0;stage<3;stage++){
   if(kind==='cake'){for(let n=0;n<50000&&g.phase==='playing';n++){const action=drivingCue(g).action;g.release();if(action)g.input[action]=true;g.update(1/60);}assert.equal(g.phase,'delivering');tick(g,2);}
   if(kind==='crossing'){g.speed=0;for(let i=0;i<3;i++){for(const side of g.lookSequence)g.look(side);until(g,()=>g.crossed>i);}assert.equal(g.depart(),true);tick(g,2);}
   if(kind==='tickets'){g.select(g.platforms.findIndex(x=>x.name===g.target.name));g.distance=30;g.speed=0;g.door();tick(g,.5);for(let i=0;i<3;i++){g.choosePassenger(i);g.boardFriend();g.input.escort=true;tick(g,1.3);}g.retractStep();tick(g,1);g.closeDoor();tick(g,1);g.departTrain();tick(g,2);}
   if(stage<2)g.next();
  }
  assert.equal(g.completed,true,kind);const r=new ContentLesson(kind,JSON.parse(JSON.stringify(g.snapshot())));assert.equal(r.completed,true);assert.deepEqual(r.facts,g.facts);
 }
});
test('R21 every ticket needs shape and colour, with the correct platform moved every stop',()=>{
 const indices=[];for(let stage=0;stage<3;stage++){const g=make('tickets',stage);indices.push(g.platforms.findIndex(p=>p.name===g.target.name));assert.ok(g.platforms.some(p=>p.shape===g.target.shape&&p.color!==g.target.color));assert.ok(g.platforms.some(p=>p.color===g.target.color&&p.shape!==g.target.shape));}assert.equal(new Set(indices).size,3);
});
