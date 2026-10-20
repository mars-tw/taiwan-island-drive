import test from 'node:test';
import assert from 'node:assert/strict';
import {ContentLesson} from '../../src/shared/content-r1.js';
import {cakeFeedback,crossingPose} from '../../src/shared/content-r7-scene.js';
import {boardingPose} from '../../src/shared/content-r3-scene.js';
const tick=(g,s)=>{for(let i=0;i<Math.ceil(s*60);i++)g.update(1/60);};
test('R8 cake arrows oppose lean and settled wording always means a full recovery meter',()=>{
 const g=new ContentLesson('cake');g.begin();g.input.go=true;tick(g,.5);assert.equal(cakeFeedback(g).direction,'right');assert.equal(cakeFeedback(g).settled,false);
 tick(g,2);g.input.left=true;tick(g,1);assert.equal(cakeFeedback(g).direction,'left');g.release();g.input.brake=true;tick(g,8);
 const f=cakeFeedback(g);assert.deepEqual(f,{settled:true,direction:'',fill:100});tick(g,4);assert.deepEqual(cakeFeedback(g),f);assert.equal(new ContentLesson('cake',g.snapshot()).facts.recoveries,g.facts.recoveries);
});
test('R8 each crossing starts on pavement and only a confirmation advances into the zebra',()=>{
 const g=new ContentLesson('crossing',{stage:1});g.begin();g.input.brake=true;tick(g,2);g.look('left');g.look('right');assert.equal(crossingPose(g).bottom,57);
 tick(g,3);assert.equal(g.crossTime,0);g.look('right');tick(g,2);assert.equal(g.crossTime,0);g.look('left');tick(g,1.4);assert.ok(crossingPose(g).bottom<39);assert.equal(g.crossed,0);tick(g,2);assert.equal(g.crossed,1);assert.equal(g.crossTime,0);assert.equal(crossingPose(g).bottom,39);
});
test('R8 all three seats fill before a closed-door dwell; inputs cannot move the train and nine seats persist',()=>{
 const g=new ContentLesson('tickets');g.boardingEnd=1.65;g.begin();
 for(let stage=0;stage<3;stage++){g.select(g.platforms.findIndex(p=>p.name===g.target.name));g.input.go=true;tick(g,6);g.release();g.input.brake=true;tick(g,2);assert.equal(g.door(),true);const x=g.trainX;tick(g,1.25);assert.ok([0,1,2].every(n=>boardingPose(g.boardTime,n).seated));assert.equal(g.phase,'boarding');g.input.go=true;tick(g,.2);assert.equal(g.trainX,x);assert.equal(g.phase,'boarding');tick(g,.3);assert.equal(g.phase,stage===2?'done':'checkpoint');if(stage<2)g.next();}
 assert.equal(g.completed,true);assert.equal(new ContentLesson('tickets',g.snapshot()).facts.boarded,9);
});
