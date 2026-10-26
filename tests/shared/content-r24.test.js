import test from 'node:test';
import assert from 'node:assert/strict';
import {ContentLesson} from '../../src/shared/content-r24.js';
import {cakeAngle,stability,drivingCue,crossingTraffic,crossingLocation,crossingCue,holdFeedback,ticketSceneGeometry,CROSSING_ROADS} from '../../src/shared/content-r24-scene.js';
const make=(kind,stage=0)=>{const g=new ContentLesson(kind,{stage},{freshObservation:true,observeTraffic:true,visualDeparture:true,manualDoors:true,visualDelivery:true});g.begin();return g;};
const until=(g,fn,max=50000)=>{for(let n=0;n<max&&!fn();n++)g.update(1/60);assert.ok(fn(),`${g.kind}/${g.stage}/${g.phase}`);};
test('R24 cake 62,80,100 poses have at least eight degree gaps and 100 means truly upright',()=>{
 const poses=[12.16,6.4,0].map(balanceLean=>({angle:cakeAngle({balanceLean}),fill:stability({balanceLean}).fill}));
 assert.deepEqual(poses.map(p=>p.fill),[62,80,100]);assert.ok(poses[0].angle-poses[1].angle>=8);assert.ok(poses[1].angle>=8);assert.equal(stability({balanceLean:.1}).fill,99);
});
test('R24 wrong recovery increases once per press, pauses, and correct hold clears the warning',()=>{
 const g=make('cake');g.balanceLean=12;g.recoveryActive=true;g.input['recover-right']=true;g.update(.05);assert.equal(g.balanceLean,17);for(let i=0;i<10;i++)g.update(.05);assert.equal(g.balanceLean,17);assert.match(drivingCue(g).text,/越扶越歪/);
 g.release();g.update(.05);assert.equal(g.balanceLean,17);assert.equal(holdFeedback(g).state,'paused');g.input['recover-left']=true;g.update(.05);assert.ok(g.balanceLean<17);assert.doesNotMatch(drivingCue(g).text,/越扶越歪/);until(g,()=>!g.recoveryActive);assert.equal(g.balanceLean,0);
});
test('R24 fresh car crosses zebra and exits fully before the last observation can confirm',()=>{
 const moving=make('crossing',2);moving.speed=0;moving.trafficTime=.75;moving.look('left');const prior=crossingTraffic(moving);moving.look('right');assert.equal(crossingTraffic(moving).x,prior.x,'looking at the other side never restarts the visible car');
 const g=make('crossing',2);g.speed=0;g.look('left');g.look('right');assert.equal(g.recheckTime,0);assert.equal(g.recheckStarted,true);
 const xs=[];for(let i=0;i<60;i++){xs.push(crossingTraffic(g).x);g.look('left');assert.equal(g.friendConfirmed,false);assert.equal(g.crossTime,0);g.update(.05);}
 assert.ok(xs[0]<0&&xs.at(-1)>100);assert.ok(xs.every((x,i)=>i===0||x>xs[i-1]));until(g,()=>!g.trafficActive);assert.match(crossingCue(g).text,/車過了，再看一次左邊/);g.look('left');assert.equal(g.friendConfirmed,true);
});
test('R24 car path intersects the actual vertical crossing and people stay on it across both lanes',()=>{
 for(let stage=0;stage<3;stage++){const road=CROSSING_ROADS[stage];for(let trafficTime=0;trafficTime<4;trafficTime+=.1){const car=crossingTraffic({stage,trafficTime});assert.ok(car.top>=road.top&&car.top<road.bottom);}
  for(const who of ['child','bike','grandma'])for(const p of [.18,.3,.5,.7,.82])assert.equal(crossingLocation(who,'crossing',p,stage).x,50);
 }
});
test('R24 same-plane trains have identical scale and align every actual door to its sign',()=>{
 const widths=new Set();for(let stage=0;stage<3;stage++)for(let selected=0;selected<3;selected++){const p=ticketSceneGeometry({stage,selected,distance:28,phase:'boarding'});widths.add(p.width);assert.ok(Math.abs(p.door-p.markers[selected])<1e-8);assert.ok(p.x>=0&&p.x+p.width<=100);}assert.equal(widths.size,1);
});
test('R24 escort progress stops for a full second and resumes to exactly one seat',()=>{
 const g=make('tickets');g.select(g.platforms.findIndex(p=>p.name===g.target.name));g.distance=30;g.speed=0;g.door();until(g,()=>g.doorStage==='awaiting');g.choosePassenger(0);g.boardFriend();g.input.escort=true;until(g,()=>holdFeedback(g).progress>=.5);g.release();const t=g.boardTime;for(let i=0;i<60;i++)g.update(1/60);assert.equal(g.boardTime,t);assert.equal(holdFeedback(g).state,'paused');g.input.escort=true;until(g,()=>g.doorStage==='awaiting');assert.equal(g.boardingIndex,1);g.release();for(let i=0;i<60;i++)g.update(1/60);assert.equal(g.boardingIndex,1);
});
test('R24 all three lessons complete all stops and restore exact completion facts',()=>{
 for(const kind of ['cake','crossing','tickets']){const g=make(kind);
  for(let stage=0;stage<3;stage++){
   if(kind==='cake'){until(g,()=>{if(g.phase!=='playing')return true;g.release();g.input[drivingCue(g).action]=true;return false;});assert.equal(g.phase,'delivering');until(g,()=>g.phase!=='delivering');}
   if(kind==='crossing'){g.speed=0;for(let i=0;i<3;i++){for(const side of g.lookSequence){if(g.lookStep===2&&g.recheckStarted)until(g,()=>!g.trafficActive);g.look(side);}until(g,()=>g.crossed>i);}assert.match(crossingCue(g).text,/大家都到了，可以出發/);assert.equal(g.depart(),true);until(g,()=>g.phase!=='departing');}
   if(kind==='tickets'){g.select(g.platforms.findIndex(p=>p.name===g.target.name));g.distance=30;g.speed=0;g.door();until(g,()=>g.doorStage==='awaiting');for(let i=0;i<3;i++){g.choosePassenger(i);g.boardFriend();g.input.escort=true;until(g,()=>g.doorStage!=='boarding');}g.retractStep();until(g,()=>g.doorStage==='close-ready');g.closeDoor();until(g,()=>g.doorStage==='closed');g.departTrain();until(g,()=>g.phase!=='departing');}
   if(stage<2)g.next();
  }
  const save=JSON.parse(JSON.stringify(g.snapshot()));assert.equal(save.completed,true);assert.deepEqual(new ContentLesson(kind,save).snapshot(),save);
 }
});
