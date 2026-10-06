import test from 'node:test';
import assert from 'node:assert/strict';
import { AIRCRAFT } from '../../src/games/flight/config.js';
import { createState,stepPhysics,liftCoefficient,wrap,FEET,KNOTS } from '../../src/games/flight/physics.js';
import { newMission,updateMission,WAYPOINTS } from '../../src/games/flight/mission.js';
import { FlightGame } from '../../src/games/flight/game.js';
import { aircraftQuaternion } from '../../src/games/flight/world.js';
import { childAction,childMessage } from '../../src/games/flight/child-instructions.js';
import { PerspectiveCamera,Vector3 } from 'three';
const p=AIRCRAFT.trainer;
const iterate=(s,c,t=10,opt={assist:true,onRunway:true},plane=p)=>{for(let i=0;i<t*120;i++)stepPhysics(s,typeof c==='function'?c(s):c,plane,1/120,opt);return s;};
test('real unit conversions: metres to feet, metres/sec to knots',()=>{assert.ok(Math.abs(FEET*304.8-1000)<.001);assert.ok(Math.abs(KNOTS*30.8667-60)<.001);});
test('invalid and zero timestep preserve the flight state',()=>{const s=createState();const original=structuredClone(s);for(const dt of [0,-1,NaN,Infinity,undefined])stepPhysics(s,{throttle:1},p,dt);assert.deepEqual(s,original);});
test('post-stall wing lift drops at excessive angle of attack',()=>{const peak=liftCoefficient(p.stallAngle,0,p),stalled=liftCoefficient(.6,0,p);assert.ok(peak>1.6);assert.ok(stalled<peak*.5);assert.ok(liftCoefficient(.1,2,p)>liftCoefficient(.1,0,p));});
test('gravity acts on an aircraft with no forward airflow',()=>{const s=createState('navigation');s.velocity={x:0,y:0,z:0};s.position.y=200;stepPhysics(s,{throttle:0},p,1/120,{assist:false});assert.ok(s.velocity.y<0);assert.ok(s.position.y<200);assert.equal(s.grounded,false);});
test('throttle accelerates gradually; aileron does not teleport position',()=>{const s=createState();stepPhysics(s,{throttle:1,roll:1},p,1/120);assert.ok(s.airspeed<1);assert.ok(s.position.z-70<.001);assert.ok(Math.abs(s.position.x)<.001);assert.equal(s.grounded,true);});
test('wheel brakes stop an aircraft without reversing it',()=>{const s=createState();s.velocity.z=24;iterate(s,{throttle:0,brake:1},7);assert.ok(s.velocity.z>=0);assert.ok(s.airspeed<.1);assert.equal(s.position.y,0);assert.equal(s.grounded,true);});
test('wind separates ground velocity and airspeed',()=>{const s=createState('navigation');s.wind.z=8;stepPhysics(s,{throttle:.6},p,1/120);assert.ok(Math.abs(s.airspeed-26)<.2);assert.ok(s.velocity.z>33);});
test('bank produces a curved flight path rather than sideways translation',()=>{const s=createState('navigation');iterate(s,{throttle:.7,roll:.2},10);assert.ok(s.bank>.1);assert.ok(s.heading>.1);assert.ok(s.position.x<-8);assert.ok(s.position.z>200);});
test('right/left aileron and rudder produce the correct pilot-screen direction',()=>{
 const camera=new PerspectiveCamera(60,1,.1,5000);camera.position.set(0,145,0);camera.lookAt(0,145,1000);camera.updateMatrixWorld();
 for(const direction of [-1,1]){
  const s=createState('navigation');iterate(s,{throttle:.7,roll:direction*.2},8);
  const projected=new Vector3(s.position.x,s.position.y,s.position.z).project(camera);assert.ok(projected.x*direction>0,'flight path must turn toward the pressed screen side');assert.ok(s.heading*direction>0,'compass heading follows clockwise right turns');
  const q=aircraftQuaternion(s),rightWing=new Vector3(-5,0,0).applyQuaternion(q);assert.ok(rightWing.y*direction<0,'positive bank lowers the pilot-right wing');
  const nose=new Vector3(0,0,4).applyQuaternion(aircraftQuaternion({...s,pitch:.15,bank:0}));assert.ok(nose.y>0,'positive pitch raises the nose');
  const ground=createState();ground.velocity.z=10;iterate(ground,{throttle:.3,rudder:direction*.5},3);const onScreen=new Vector3(ground.position.x,145,ground.position.z).project(camera);assert.ok(onScreen.x*direction>0,'ground rudder/nosewheel follows the same right/left contract');
 }
});
test('large timesteps are bounded and long integration remains finite',()=>{const s=createState('navigation');for(let i=0;i<1500;i++)stepPhysics(s,{throttle:.7,pitch:Math.sin(i*.1)*.05,roll:Math.cos(i*.1)*.05},p,.2);for(const v of [...Object.values(s.position),...Object.values(s.velocity),s.pitch,s.bank,s.airspeed])assert.ok(Number.isFinite(v));assert.ok(Math.abs(s.time-50)<.001);});
for(const plane of Object.values(AIRCRAFT)){
test(`${plane.name}: takeoff lesson can be completed using throttle and elevator`,()=>{const s=createState(),m=newMission('takeoff');for(let i=0;i<120*70&&!m.complete&&!m.retry;i++){stepPhysics(s,{throttle:1,flaps:s.position.y<10?1:0,pitch:s.airspeed>plane.rotateSpeed&&s.position.y<50?.12:0},plane,1/120,{assist:true,onRunway:Math.abs(s.position.x)<24&&s.position.z>=0&&s.position.z<=1800});updateMission(m,s,1/120);}assert.equal(m.retry,false);assert.equal(m.complete,true);assert.ok(s.everAirborne);assert.ok(s.position.y*FEET>=150);});
test(`${plane.name}: full approach, touchdown and wheel-brake landing lesson`,()=>{const s=createState('landing'),m=newMission('landing');for(let i=0;i<120*90&&!m.complete&&!m.retry;i++){stepPhysics(s,{throttle:s.grounded?0:.28,flaps:2,pitch:s.position.y<10?.03:0,brake:s.grounded?1:0},plane,1/120,{assist:true,onRunway:Math.abs(s.position.x)<24&&s.position.z>=0&&s.position.z<=1800});updateMission(m,s,1/120);}assert.equal(m.retry,false);assert.equal(m.complete,true);assert.equal(s.touchdown.onRunway,true);assert.ok(s.touchdown.verticalSpeed>-4.2);assert.ok(s.airspeed<1.5);assert.equal(s.grounded,true);});
}
test('navigation lesson completes through physically flown waypoint turns',()=>{const s=createState('navigation'),m=newMission('navigation');for(let i=0;i<120*85&&!m.complete;i++){const w=WAYPOINTS[m.passed]||WAYPOINTS[2];const heading=Math.atan2(-(w.x-s.position.x),w.z-s.position.z);stepPhysics(s,{throttle:.72,flaps:0,roll:wrap(heading-s.heading)*.9-s.bank*.8,pitch:(w.y-s.position.y)*.002-s.velocity.y*.04},p,1/120,{assist:true,onRunway:true});updateMission(m,s,1/120);}assert.equal(m.passed,3);assert.equal(m.complete,true);});
test('a hard touchdown offers a retry without graphic accident effects',()=>{const s=createState('landing');s.position.y=.005;s.velocity.y=-8;stepPhysics(s,{throttle:0},p,1/120);const m=newMission('landing');updateMission(m,s,1/120);assert.equal(s.hardLanding,true);assert.equal(m.retry,true);assert.match(m.message,/再試一次/);});
test('advance controls can induce and recover from a stall',()=>{const s=createState('navigation');s.pitch=.7;stepPhysics(s,{throttle:0,pitch:0},p,1/120,{assist:false});assert.equal(s.stall,true);iterate(s,{throttle:1,pitch:-.3},2,{assist:false,onRunway:true});assert.ok(s.alpha<.4);});
test('only pushing throttle never earns takeoff credit and stops at the runway end',()=>{
 const s=createState('takeoff'),m=newMission('takeoff');
 for(let i=0;i<120*150&&!m.retry&&!m.complete;i++){stepPhysics(s,{throttle:1,flaps:1,pitch:0},p,1/120,{assist:true,onRunway:Math.abs(s.position.x)<24&&s.position.z>=0&&s.position.z<=1800});updateMission(m,s,1/120);}
 assert.equal(s.rotationCommanded,false);assert.equal(m.complete,false);assert.equal(m.retry,true);assert.equal(m.score,0);assert.ok(s.position.z<1800);assert.match(m.message,/抬頭起飛/);
});
test('natural shallow liftoff keeps the single child start action until assistance begins',()=>{
 const s=createState('takeoff');iterate(s,{throttle:1,flaps:1,pitch:0},30);assert.equal(s.grounded,false);assert.equal(s.rotationCommanded,false);
 const mission=newMission('takeoff'),school={state:s,mission,lesson:'takeoff',plane:'trainer',preschool:true,keys:new Set(),controls:{pitch:0,roll:0,rudder:0,throttle:1,flaps:1,brake:0},guidance:{rotate:false,navigate:false,land:false}};
 const view={...s,lesson:'takeoff',plane:'trainer',guidance:school.guidance,mission};assert.equal(childAction(view)[0],'一起起飛');assert.match(childMessage(view),/點一下就出發/);
 FlightGame.prototype.childControl.call(school);assert.equal(school.guidance.rotate,true);
 for(let i=0;i<120*50&&!mission.complete&&!mission.retry;i++){const c=FlightGame.prototype.input.call(school,1/120);stepPhysics(s,c,p,1/120,{assist:true,onRunway:Math.abs(s.position.x)<24&&s.position.z>=0&&s.position.z<=1800});updateMission(mission,s,1/120);}
 assert.equal(s.rotationCommanded,true);assert.equal(mission.complete,true);assert.equal(mission.retry,false);assert.equal(childAction({...view,...s})[0],'機翼保持平穩');
});
test('off-runway liftoff is recorded by physics and rejected by the takeoff lesson',()=>{
 const s=createState('takeoff');s.position.z=1850;s.velocity.z=36;s.pitch=.14;stepPhysics(s,{throttle:1,flaps:1,pitch:.12},p,1/120,{assist:true,onRunway:false});
 assert.equal(s.grounded,false);assert.equal(s.takeoffOnRunway,false);assert.equal(s.firstLiftoff.onRunway,false);assert.equal(s.liftoff.onRunway,false);const m=newMission('takeoff');updateMission(m,s,1/120);assert.equal(m.retry,true);assert.equal(m.complete,false);assert.equal(m.score,0);
});
test('free flight permits a physical grass departure and soft grass arrival',()=>{
 const s=createState('free');s.position.z=1850;s.velocity.z=36;s.pitch=.14;stepPhysics(s,{throttle:1,flaps:1,pitch:.12},p,1/120,{assist:true,onRunway:false});const m=newMission('free');updateMission(m,s,1/120);assert.equal(m.retry,false);s.position.y=.005;s.velocity.y=-.2;stepPhysics(s,{throttle:0},p,1/120,{assist:true,onRunway:false});updateMission(m,s,1/120);assert.equal(m.retry,false);assert.equal(s.groundType,'grass');
});
for(const lesson of ['takeoff','navigation','landing'])test(`preschool ${lesson}: actual large-button guidance follows physics to completion`,()=>{
 const state=createState(lesson),mission=newMission(lesson);const school={state,mission,lesson,plane:'trainer',preschool:true,keys:new Set(),controls:{pitch:0,roll:0,rudder:0,throttle:state.throttle,flaps:lesson==='takeoff'?1:state.flaps,brake:0},guidance:{rotate:false,navigate:false,land:false}};
 FlightGame.prototype.childControl.call(school);
 for(let i=0;i<120*100&&!mission.complete&&!mission.retry;i++){
  if(lesson==='takeoff'&&state.airspeed>=p.rotateSpeed&&!school.guidance.rotate)FlightGame.prototype.childControl.call(school);
  if(lesson==='landing'&&state.grounded){FlightGame.prototype.childControl.call(school);school.controls.brake=1;}
  const c=FlightGame.prototype.input.call(school,1/120);
  stepPhysics(state,c,p,1/120,{assist:true,onRunway:Math.abs(state.position.x)<24&&state.position.z>=0&&state.position.z<=1800});updateMission(mission,state,1/120);
 }
 assert.equal(mission.retry,false);assert.equal(mission.complete,true);
 if(lesson==='landing')assert.ok(state.touchdown.onRunway);
 if(lesson==='takeoff')assert.ok(state.position.y>=150/FEET);
});
