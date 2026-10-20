import test from 'node:test';
import assert from 'node:assert/strict';
import {ContentLesson} from '../../src/shared/content-r1.js';
import {pedalState,drivingCue,rigidCakePose,crossingLocation,ticketSceneGeometry,queuePosition,showQueue} from '../../src/shared/content-r12-scene.js';
import {ticketDoorState} from '../../src/shared/content-r11-scene.js';
const tick=(g,s)=>{for(let i=0;i<Math.ceil(s*60);i++)g.update(1/60);};
test('R12 pedal remains actionable after release, including bay restart; cake warning describes correction without a conflicting turn',()=>{
 const g=new ContentLesson('cake');g.balancePractice=true;g.begin();g.distance=43;g.bayStopped=true;
 let cue=drivingCue(g);assert.equal(cue.action,'go');assert.deepEqual(pedalState(g,cue),{state:'ready',text:'按住前進'});
 g.input.go=true;tick(g,.2);assert.equal(g.bayRestarted,true);g.stage=1;g.distance=22;g.balanceLean=-22;g.balanceDanger=true;
 cue=drivingCue(g);assert.equal(cue.action,'right');assert.equal(cue.release,true);assert.doesNotMatch(cue.text,/左轉|右轉/);assert.equal(pedalState(g,cue).text,'請放開');
 g.input.go=false;assert.deepEqual(pedalState(g,cue),{state:'released',text:'踏板'});
});
test('R12 whole cake and reference line share a bounded angle with a monotone, visible flag-tip recovery',()=>{
 const xs=[-20,-9,0].map(balanceLean=>{const angle=rigidCakePose({balanceLean})*Math.PI/180;return .96*(86+24*Math.cos(angle)+162*Math.sin(angle));});
 assert.ok(xs[1]-xs[0]>=20);assert.ok(xs[2]-xs[1]>=20);assert.ok(xs[2]-xs[0]>=108*.96/2);
 assert.equal(rigidCakePose({balanceLean:100}),29);assert.equal(rigidCakePose({balanceLean:-100}),-29);
});
test('R12 each crossing friend approaches on the pavement, crosses the zebra horizontally, then exits to a separate pavement space',()=>{
 for(const who of ['child','bike','grandma']){const positions=[0,.18,.4,.6,.82,1].map(p=>crossingLocation(who,'crossing',p));
  assert.deepEqual(positions[0],crossingLocation(who,'waiting'));assert.deepEqual(positions.at(-1),crossingLocation(who,'arrived'));
  for(const pos of positions.slice(1,-1))assert.equal(pos.bottom,35.5);
  assert.ok(positions.at(-1).bottom>35.5);assert.equal(Math.abs(positions.at(-1).x-positions[0].x),78);
  assert.ok(positions.at(-1).bottom>=35&&positions.at(-1).bottom<=50,'arrived feet stay on visible pavement, below the roadside walls');
 }
});
test('R12 real crossing departure holds its visible phase, pauses, completes all stations and reloads the saved nine friends',()=>{
 const g=new ContentLesson('crossing',{}, {freshObservation:true,visualDeparture:true});g.begin();
 for(let stage=0;stage<3;stage++){g.input.brake=true;tick(g,2);for(let n=0;n<3;n++){assert.deepEqual(g.looked,{left:false,right:false});g.look('left');g.look('right');g.look(g.decisionSide);tick(g,3.5);assert.equal(g.crossed,n+1);}
  assert.equal(g.depart(),true);assert.equal(g.phase,'departing');tick(g,.4);const time=g.departureTime;g.pause();tick(g,1);assert.equal(g.departureTime,time);g.paused=false;tick(g,1);assert.equal(g.phase,stage===2?'done':'checkpoint');if(stage<2)g.next();
 }
 const saved=new ContentLesson('crossing',JSON.parse(JSON.stringify(g.snapshot())));assert.equal(saved.completed,true);assert.equal(saved.facts.waited,9);
});
test('R12 boarding path exists only at the correct open station and disappears before door closing; queue fits all three stations',()=>{
 const g=new ContentLesson('tickets');g.boardingRate=.3;g.boardingEnd=1.65;g.begin();
 for(let stage=0;stage<3;stage++){
  g.select(g.platforms.findIndex(p=>p.name!==g.target.name));assert.equal(showQueue(g,ticketDoorState(g)),false);
  g.select(g.platforms.findIndex(p=>p.name===g.target.name));g.input.go=true;tick(g,7);g.release();g.input.brake=true;tick(g,2);assert.equal(g.door(),true);tick(g,.3);assert.equal(showQueue(g,ticketDoorState(g)),true);
  const geo=ticketSceneGeometry(g);assert.ok(Math.abs(geo.door-geo.markers[g.selected])<.01);for(let n=0;n<3;n++)assert.ok(queuePosition(geo.door,n,0,31).x<96);
  tick(g,3.2);assert.equal(showQueue(g,ticketDoorState(g)),false);tick(g,2.2);assert.equal(g.phase,stage===2?'done':'checkpoint');if(stage<2)g.next();
 }
 const saved=new ContentLesson('tickets',g.snapshot());assert.equal(saved.completed,true);assert.equal(saved.facts.boarded,9);
});
