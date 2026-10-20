import test from 'node:test';
import assert from 'node:assert/strict';
import {ContentLesson} from '../../src/shared/content-r1.js';
import {drivingCue,queueFrame} from '../../src/shared/content-r10-scene.js';
import {lessonFacts} from '../../src/shared/content-r5-feedback.js';
const tick=(g,s)=>{for(let n=0;n<Math.ceil(s*60);n++)g.update(1/60);};
test('R10 cake primary instruction stays correct through rough motion, bay stop, restart and saved completion',()=>{
 const g=new ContentLesson('cake');g.begin();assert.equal(drivingCue(g).action,'go');g.input.go=true;tick(g,.4);assert.equal(drivingCue(g).release,true);
 for(let stage=0;stage<3;stage++){
  for(let n=0;n<5000&&g.distance<55;n++){
   g.input.left=g.distance>15&&g.distance<=40&&g.bend<0;g.input.right=g.distance>15&&g.distance<=40&&g.bend>0;
   g.input.brake=stage===2&&g.distance>=42&&!g.bayStopped;g.input.go=!g.input.brake&&g.speed<5;g.update(1/60);
   if(g.bayStopped&&!g.bayRestarted)assert.equal(drivingCue(g).action,'go');
  }
  assert.equal(g.distance,55);assert.equal(drivingCue(g).action,'brake');g.release();g.input.brake=true;tick(g,3);if(stage<2)g.next();
 }
 const saved=new ContentLesson('cake',JSON.parse(JSON.stringify(g.snapshot())));assert.equal(saved.completed,true);assert.equal(saved.facts.bayRestarts,1);
});
test('R10 fresh observations block each new friend, identify the missing side and persist nine safe crossings',()=>{
 const g=new ContentLesson('crossing',{}, {freshObservation:true});g.begin();
 for(let stage=0;stage<3;stage++){
  g.input.brake=true;tick(g,2);
  for(let n=0;n<3;n++){
   assert.deepEqual(g.looked,{left:false,right:false});g.look('left');const before=g.crossed;assert.equal(g.depart(),false);assert.match(g.hint,/右/);tick(g,3);assert.equal(g.crossed,before);
   g.look('right');g.look(g.decisionSide);tick(g,g.crossingDuration+.7);assert.equal(g.crossed,n+1);
  }
  assert.equal(g.depart(),true);if(stage<2)g.next();
 }
 const saved=new ContentLesson('crossing',JSON.parse(JSON.stringify(g.snapshot())));assert.equal(saved.completed,true);assert.equal(saved.facts.waited,9);assert.equal(saved.facts.confirmations,9);assert.match(lessonFacts(saved)[0].text,/9 次/);assert.match(lessonFacts(saved)[1].text,/9 次/);
});
test('R10 boarding never starts a second passenger before first seats; all three routes complete and save nine',()=>{
 for(let t=0;t<1.2;t+=.002){const f=[0,1,2].map(n=>queueFrame(t,n));assert.ok(f.filter(x=>x.progress>0&&!x.seated).length<=1);for(let n=1;n<3;n++)if(f[n].progress>0)assert.equal(f[n-1].seated,true);}
 const g=new ContentLesson('tickets');g.boardingRate=.3;g.boardingEnd=1.65;g.begin();
 for(let stage=0;stage<3;stage++){
  assert.equal(g.door(),false);g.select(g.platforms.findIndex(p=>p.name===g.target.name));g.input.go=true;tick(g,7);g.release();g.input.brake=true;tick(g,2);assert.equal(g.door(),true);tick(g,5.6);assert.equal(g.phase,stage===2?'done':'checkpoint');if(stage<2)g.next();
 }
 assert.equal(new ContentLesson('tickets',JSON.parse(JSON.stringify(g.snapshot()))).facts.boarded,9);
});
