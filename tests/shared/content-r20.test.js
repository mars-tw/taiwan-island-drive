import test from 'node:test';
import assert from 'node:assert/strict';
import {ContentLesson} from '../../src/shared/content-r19.js';
import {stability,queuePosition,observation,cakeShift} from '../../src/shared/content-r20-scene.js';

test('R20 inclination bar always measures roll, recovery ring uses actual tray position',()=>{
 for(const balanceLean of [-32,-16,-12,-3,0,3,12,16,32])for(const recoveryLocked of [false,true]){
  const g={balanceLean,recoveryLocked,input:{},stage:1,speed:0},m=stability(g);
  assert.equal(m.fill,Math.round(Math.abs(balanceLean)/32*100));
  assert.equal(m.recovery,100-m.fill);assert.equal(Math.abs(cakeShift(g))/36,Math.abs(balanceLean)/32);
  if(Math.abs(balanceLean)<=3)assert.ok(m.recovery>=90);
 }
});
test('R20 crossing removes observation during walking without changing completion or save facts',()=>{
 const g=new ContentLesson('crossing',{}, {observeTraffic:true,freshObservation:true,visualDeparture:true});g.begin();g.speed=0;g.look('left');g.look('right');
 assert.ok(observation(g));
 for(let n=0;n<1200&&g.crossTime===0;n++)g.update(1/60);
 assert.ok(g.crossTime>0);assert.equal(observation(g),null);assert.equal(g.depart(),false);
 for(let n=0;n<1200&&g.crossed===0;n++)g.update(1/60);
 assert.equal(g.crossed,1);const r=new ContentLesson('crossing',JSON.parse(JSON.stringify(g.snapshot())));assert.deepEqual(r.facts,g.facts);
});
test('R20 waiting feet stay on brick and approach the doorway before descending',()=>{
 for(const [w,h] of [[280,264],[360,550],[600,680]])for(let i=0;i<3;i++){
  const foot=queuePosition(75,i,0,22,w,h);assert.equal(foot.bottom,45.5);assert.equal(foot.x,[18,50,82][i]);
  const across=queuePosition(75,i,.26,22,w,h);assert.equal(across.x,75);assert.equal(across.bottom,45.5);
  const entering=queuePosition(75,i,.58,22,w,h);assert.equal(entering.x,75);assert.equal(entering.bottom,22);
  for(const p of [.30,.40,.50,.58])assert.equal(queuePosition(75,i,p,22,w,h).x,75);
 }
});
