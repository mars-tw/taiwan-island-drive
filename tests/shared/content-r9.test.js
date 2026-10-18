import test from 'node:test';
import assert from 'node:assert/strict';
import {ContentLesson} from '../../src/shared/content-r1.js';
import {crossingPose} from '../../src/shared/content-r7-scene.js';
import {boardingFrame,passengerPosition,aislePosition,grandmaFrame} from '../../src/shared/content-r9-scene.js';
const tick=(g,s)=>{for(let i=0;i<Math.ceil(s*60);i++)g.update(1/60);};
test('R9 unchanged cake completes all routes, bay restart and saved skills',()=>{
 const g=new ContentLesson('cake');g.begin();
 for(let stage=0;stage<3;stage++){
  for(let n=0;n<4000&&g.distance<55;n++){
   g.input.left=g.distance>15&&g.distance<=40&&g.bend<0;
   g.input.right=g.distance>15&&g.distance<=40&&g.bend>0;
   g.input.brake=stage===2&&g.distance>=42&&!g.bayStopped;
   g.input.go=!g.input.brake&&g.speed<5;g.update(1/60);
  }
  assert.equal(g.distance,55);g.release();g.input.brake=true;tick(g,3);
  assert.equal(g.phase,stage===2?'done':'checkpoint');if(stage<2)g.next();
 }
 const saved=new ContentLesson('cake',JSON.parse(JSON.stringify(g.snapshot())));
 assert.equal(saved.completed,true);assert.equal(saved.facts.bayRestarts,1);assert.deepEqual(saved.skills,g.skills);
});
test('R9 grandmother advances across three distinct poses; only arrival increments safe count',()=>{
 const g=new ContentLesson('crossing',{stage:1});g.begin();g.input.brake=true;tick(g,2);g.look('left');g.look('right');g.look('left');tick(g,.6);
 const samples=[];
 for(const progress of [.23,.52,.94]){
  while(g.crossTime/g.crossingDuration<progress)g.update(1/120);
  samples.push({x:crossingPose(g).x,pose:grandmaFrame(g.crossTime/g.crossingDuration)});
  assert.equal(g.crossed,0);assert.equal(g.facts.waited,0);assert.equal(g.depart(),false);
 }
 assert.deepEqual(samples.map(s=>s.pose),[0,1,2]);assert.ok(samples[1].x-samples[0].x>16);assert.ok(samples[2].x-samples[1].x>24);
 tick(g,.15);assert.equal(g.crossed,1);assert.equal(g.facts.waited,1);
 assert.equal(new ContentLesson('crossing',g.snapshot()).facts.waited,1);
});
test('R9 serial queue keeps one moving friend, monotonic doorway to aisle to seat, nine saved passengers',()=>{
 for(let time=0;time<1.2;time+=.002){
  const frames=[0,1,2].map(n=>boardingFrame(time,n));assert.ok(frames.filter(f=>f.progress>0&&!f.seated).length<=1);
  const visible=frames.map((f,n)=>({...f,...passengerPosition({door:55.76},n,f.progress)})).filter(f=>!f.inside);
  for(let n=1;n<visible.length;n++)assert.ok(visible[n-1].x-visible[n].x>=18-1e-6);
 }
 assert.ok(aislePosition(.65,0)>aislePosition(.9,0));assert.equal(aislePosition(1,2),55);
 const g=new ContentLesson('tickets');g.boardingEnd=1.65;g.begin();
 for(let s=0;s<3;s++){g.select(g.platforms.findIndex(p=>p.name===g.target.name));g.input.go=true;tick(g,7);g.release();g.input.brake=true;tick(g,2);assert.equal(g.door(),true);const x=g.trainX;tick(g,1);assert.ok([0,1,2].every(n=>boardingFrame(g.boardTime,n).seated));assert.equal(g.phase,'boarding');g.input.go=true;tick(g,.7);assert.equal(g.trainX,x);if(s<2)g.next();}
 assert.equal(g.completed,true);assert.equal(new ContentLesson('tickets',JSON.parse(JSON.stringify(g.snapshot()))).facts.boarded,9);
});
