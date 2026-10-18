import test from 'node:test';
import assert from 'node:assert/strict';
import {ContentLesson,CROSSING_ORDERS} from '../../src/shared/content-r1.js';
const tick=(g,seconds)=>{for(let i=0;i<Math.ceil(seconds*60);i++)g.update(1/60);};
test('cake: continuous pedals, inertia flag, bend and brake accumulate skills; all drivers finish all routes',()=>{
 const g=new ContentLesson('cake');g.begin();
 for(let stage=0;stage<3;stage++){
  g.input.go=true;tick(g,2);assert.ok(g.speed>1);assert.ok(Math.abs(g.tilt)>0);g.input[g.bend>0?'right':'left']=true;
  for(let i=0;i<1000&&g.distance<55;i++){
   g.input.left=g.bend<0;g.input.right=g.bend>0;
   g.input.brake=stage===2&&g.distance>=42&&!g.bayStopped;
   g.input.go=!g.input.brake&&g.speed<5;g.update(1/60);
  }
  if(stage===1){assert.ok(g.turns.left>=.2);assert.ok(g.turns.right>=.2);}
  if(stage===2){assert.equal(g.bayStopped,true);assert.equal(g.bayRestarted,true);}
  assert.equal(g.distance,55);g.input.go=false;g.input.brake=true;tick(g,3);assert.ok(['checkpoint','done'].includes(g.phase));
  const saved=JSON.parse(JSON.stringify(g.snapshot()));assert.equal(new ContentLesson('cake',saved).stage,Math.min(stage+1,2));
  if(stage<2)g.next();
 }
 assert.equal(g.completed,true);assert.deepEqual(g.skills,{start:true,turn:true,stop:true});assert.equal(new ContentLesson('cake',g.snapshot()).phase,'done');
});
test('crossings: moving observation, incomplete observation and occupied crossing cannot depart; orders vary',()=>{
 const g=new ContentLesson('crossing');g.begin();g.look('left');assert.equal(g.looked.left,false);assert.equal(g.depart(),false);
 for(let stage=0;stage<3;stage++){
  g.input.brake=true;tick(g,2);g.look('left');tick(g,8);assert.equal(g.crossed,0);assert.equal(g.depart(),false);
  g.look('right');tick(g,1);assert.equal(g.depart(),false);g.pause();const before=g.crossTime;tick(g,3);assert.equal(g.crossTime,before);g.paused=false;tick(g,7);assert.equal(g.crossed,3);assert.equal(g.depart(),true);
  if(stage<2)g.next();
 }
 assert.equal(g.completed,true);assert.equal(new Set(CROSSING_ORDERS.map(a=>a.join())).size,3);assert.equal(new ContentLesson('crossing',g.snapshot()).completed,true);
});
test('tickets: both shape and color, travel, stationary doors, complete boarding and all stops persist',()=>{
 const g=new ContentLesson('tickets');g.begin();
 for(let stage=0;stage<3;stage++){
  g.platforms.forEach((p,i)=>{g.select(i);if(p.shape!==g.target.shape||p.color!==g.target.color){assert.equal(g.matched,false);assert.equal(g.door(),false);}});
  const correct=g.platforms.findIndex(p=>p.shape===g.target.shape&&p.color===g.target.color);g.select(correct);assert.equal(g.door(),false);g.input.go=true;tick(g,7);assert.equal(g.distance,30);assert.equal(g.door(),false);g.input.go=false;g.input.brake=true;tick(g,2);assert.equal(g.door(),true);assert.equal(g.phase,'boarding');tick(g,.4);assert.equal(g.phase,'boarding');tick(g,1);assert.ok(['checkpoint','done'].includes(g.phase));if(stage<2)g.next();
 }
 assert.equal(new ContentLesson('tickets',JSON.parse(JSON.stringify(g.snapshot()))).completed,true);
});
test('pause releases every held input; unknown content and damaged save remain bounded',()=>{
 const g=new ContentLesson('cake',{stage:999});assert.equal(g.stage,2);g.begin();g.input.go=true;tick(g,1);g.pause();assert.deepEqual(g.input,{go:false,brake:false,left:false,right:false});const before=g.distance;tick(g,5);assert.equal(g.distance,before);assert.throws(()=>new ContentLesson('unknown'));
});
