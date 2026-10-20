import test from 'node:test';
import assert from 'node:assert/strict';
import {ContentLesson} from '../../src/shared/content-r22.js';
import {cakeAngle,stability,landedFriends,crossingCue,ticketSceneGeometry,drivingCue} from '../../src/shared/content-r22-scene.js';
const make=(kind,stage=0)=>{const g=new ContentLesson(kind,{stage},{freshObservation:true,observeTraffic:true,visualDeparture:true,manualDoors:true,visualDelivery:true});g.begin();return g;};
const until=(g,fn)=>{for(let n=0;n<4000&&!fn();n++)g.update(1/60);assert.ok(fn());};

test('R22 cake body and inset use distinguishable signed poses at 62,80,100 percent',()=>{
 const angles=[12.16,6.4,0].map(balanceLean=>{const g={balanceLean,stage:1,input:{}};return [stability(g).fill,cakeAngle(g)];});
 assert.deepEqual(angles.map(x=>x[0]),[62,80,100]);assert.ok(angles[0][1]>angles[1][1]+10);assert.equal(angles[2][1],0);
 assert.equal(cakeAngle({balanceLean:-12.16}),-angles[0][1]);
 assert.equal(drivingCue({balanceLean:0,stage:2,bayStopped:true,bayRestarted:false,input:{}}).text,'休息好了，可以出發了。');
});
test('R22 third look clears stale completion and waits for the visible new vehicle',()=>{
 const g=make('crossing',2);g.speed=0;g.look('left');g.look('right');assert.equal(g.looked.left,false);assert.equal(g.looked.right,true);assert.equal(g.friendConfirmed,false);assert.equal(g.trafficActive,true);assert.match(crossingCue(g).text,/再看左邊/);
 g.look('right');assert.equal(g.lookStep,2);g.look('left');assert.equal(g.friendConfirmed,true);until(g,()=>g.crossTime>0);assert.equal(g.trafficActive,false);
});
test('R22 all friends count at the pavement, before final parking; exactly once',()=>{
 for(let stage=0;stage<3;stage++){const g=make('crossing',stage);g.speed=0;
  for(let n=0;n<3;n++){for(const side of g.lookSequence)g.look(side);until(g,()=>g.crossTime/g.crossingDuration>.45);const who=g.crossingPerson;assert.equal(landedFriends(g),n);until(g,()=>g.crossTime/g.crossingDuration>=.82);assert.equal(g.crossingPerson,who);assert.equal(landedFriends(g),n+1);assert.match(crossingCue(g).text,/到對岸了/);until(g,()=>g.crossed>n);assert.equal(landedFriends(g),n+1);}
  assert.equal(g.facts.waited,3);assert.equal(g.depart(),true);
 }
});
test('R22 selected platform and actual door have a common coordinate with the whole train in frame',()=>{
 for(let stage=0;stage<3;stage++)for(let selected=0;selected<3;selected++){
  const g=make('tickets',stage);g.selected=selected;g.distance=30;const p=ticketSceneGeometry(g);
  assert.ok(Math.abs(p.door-p.markers[selected])<1e-10);assert.ok(p.x>=0);assert.ok(p.x+p.width<=100);
  const local=p.reverse?.22:.78;assert.equal(p.x+local*p.width,p.door);
 }
});
test('R22 all courses remain completable and preserve the existing save schema',()=>{
 for(const kind of ['cake','crossing','tickets']){const g=make(kind);
  for(let stage=0;stage<3;stage++){
   if(kind==='cake'){for(let i=0;i<50000&&g.phase==='playing';i++){g.release();const a=drivingCue(g).action;if(a)g.input[a]=true;g.update(1/60);}assert.equal(g.phase,'delivering');until(g,()=>g.phase!=='delivering');}
   if(kind==='crossing'){g.speed=0;for(let i=0;i<3;i++){for(const side of g.lookSequence)g.look(side);until(g,()=>g.crossed>i);}g.depart();until(g,()=>g.phase!=='departing');}
   if(kind==='tickets'){g.select(g.platforms.findIndex(x=>x.name===g.target.name));g.distance=30;g.speed=0;g.door();until(g,()=>g.doorStage==='awaiting');for(let i=0;i<3;i++){g.choosePassenger(i);g.boardFriend();g.input.escort=true;until(g,()=>g.doorStage!=='boarding');}g.retractStep();until(g,()=>g.doorStage==='close-ready');g.closeDoor();until(g,()=>g.doorStage==='closed');g.departTrain();until(g,()=>g.phase!=='departing');}
   if(stage<2)g.next();
  }
  const copy=JSON.parse(JSON.stringify(g.snapshot()));assert.equal(copy.completed,true);assert.deepEqual(new ContentLesson(kind,copy).snapshot(),copy);
 }
});
