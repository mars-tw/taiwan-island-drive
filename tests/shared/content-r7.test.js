import test from 'node:test';
import assert from 'node:assert/strict';
import {ContentLesson} from '../../src/shared/content-r1.js';
import {closeupPose} from '../../src/shared/content-r7-scene.js';
const tick=(g,s)=>{for(let i=0;i<Math.ceil(s*60);i++)g.update(1/60);};
test('R7 each of nine crossing decisions blocks idle time, wrong side and paused input',()=>{
 const g=new ContentLesson('crossing');g.begin();for(let stage=0;stage<3;stage++){g.input.brake=true;tick(g,2);g.look('left');g.look('right');for(let n=0;n<3;n++){tick(g,12);assert.equal(g.crossed,n);assert.equal(g.crossTime,0);g.look(g.decisionSide==='left'?'right':'left');tick(g,3);assert.equal(g.crossed,n);g.pause();g.look(g.decisionSide);assert.equal(g.friendConfirmed,false);g.paused=false;g.look(g.decisionSide);tick(g,.2);assert.equal(g.crossTime,0);tick(g,g.crossingDuration+.5);assert.equal(g.crossed,n+1);}assert.equal(g.depart(),true);if(stage<2)g.next();}assert.equal(g.completed,true);assert.equal(g.facts.waited,9);assert.equal(g.facts.confirmations,9);assert.equal(new ContentLesson('crossing',g.snapshot()).facts.waited,9);
});
test('R7 fixed closeup makes starting, cornering, braking and spring recovery distinct',()=>{
 const g=new ContentLesson('cake');g.begin();g.input.go=true;tick(g,.45);const start=closeupPose(g);assert.ok(start.top< -27);tick(g,2);g.input.left=true;tick(g,1);const turn=closeupPose(g);assert.ok(turn.top>27);assert.ok(Math.abs(turn.top-turn.base)>27);g.release();g.input.brake=true;tick(g,.5);assert.ok(closeupPose(g).top>20);g.release();tick(g,7);const settled=closeupPose(g);assert.ok(Math.abs(settled.top)<.2);assert.notEqual(turn.base,turn.middle);assert.notEqual(turn.middle,turn.top);assert.notEqual(turn.flag,turn.lean);
});
test('R7 boarding ignores all movement input, cannot reselect or duplicate doors, persists nine seated',()=>{
 const g=new ContentLesson('tickets');g.begin();for(let s=0;s<3;s++){g.select(g.platforms.findIndex(p=>p.name===g.target.name));g.input.go=true;tick(g,6);g.release();g.input.brake=true;tick(g,2);assert.equal(g.door(),true);const x=g.trainX,selected=g.selected;for(let n=0;n<3;n++){g.input.go=true;g.select((selected+1)%3);assert.equal(g.door(),false);tick(g,.1);assert.equal(g.trainX,x);assert.equal(g.selected,selected);}tick(g,1);if(s<2)g.next();}assert.equal(g.completed,true);assert.equal(g.facts.boarded,9);assert.equal(new ContentLesson('tickets',g.snapshot()).facts.boarded,9);
});
